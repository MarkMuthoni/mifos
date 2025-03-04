import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext';
import { API_CONFIG } from '../../../config';
import './MigrateOpeningBalances.css';
import {useLoading} from "../../../context/LoadingContext";
import {useNavigate} from "react-router-dom";

const MigrateOpeningBalancesPage = () => {
    const { user } = useContext(AuthContext);
    const { startLoading, stopLoading } = useLoading();
    const [offices, setOffices] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [office, setOffice] = useState('');
    const [currency, setCurrency] = useState('');
    const [openingBalances, setOpeningBalances] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [formErrors, setFormErrors] = useState({});
    const [contraAccount, setContraAccount] = useState(null);
    const navigate = useNavigate();


    useEffect(() => {
        fetchOffices();
        fetchCurrencies();
    }, []);

    const fetchOffices = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/offices`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setOffices(response.data || []);
        } catch (error) {
            console.error('Error fetching offices:', error);
        } finally {
            stopLoading();
        }
    };


    const fetchCurrencies = async () => {
        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/currencies?fields=selectedCurrencyOptions`, {
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });
            setCurrencies(response.data.selectedCurrencyOptions || []);
        } catch (error) {
            console.error('Error fetching currencies:', error);
        } finally {
            stopLoading();
        }
    };


    const handleSearch = async () => {
        if (!office || !currency) {
            setFormErrors({ office: !office ? 'Office is required' : '', currency: !currency ? 'Currency is required' : '' });
            return;
        }

        // console.log('Office selected:', office);
        // console.log('Currency selected:', currency);

        startLoading();
        try {
            const response = await axios.get(`${API_CONFIG.proxy}/fineract-provider/api/v1/journalentries/openingbalance`, {
                params: { currencyCode: currency, officeId: office },
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
            });

            // console.log('API response data:', response.data);

            const {
                assetAccountOpeningBalances = [],
                liabilityAccountOpeningBalances = [],
                incomeAccountOpeningBalances = [],
                expenseAccountOpeningBalances = [],
                equityAccountOpeningBalances = [],
                contraAccount = null
            } = response.data;

            const allBalances = [
                ...assetAccountOpeningBalances.map((entry) => ({ ...entry, type: 'Asset' })),
                ...liabilityAccountOpeningBalances.map((entry) => ({ ...entry, type: 'Liability' })),
                ...incomeAccountOpeningBalances.map((entry) => ({ ...entry, type: 'Income' })),
                ...expenseAccountOpeningBalances.map((entry) => ({ ...entry, type: 'Expense' })),
                ...equityAccountOpeningBalances.map((entry) => ({ ...entry, type: 'Equity' })),
            ];

            setOpeningBalances(allBalances);
            setContraAccount(contraAccount);
        } catch (error) {
            console.error('Error fetching opening balances:', error);
        } finally {
            stopLoading();
        }
    };

    const handleSubmit = () => {
        console.log("Submitting data:", openingBalances);
    };

    return (
        <div className="migrate-opening-balances-page">
            <div className="search-form">
                <div className="search-item">
                    <label>Office <span>*</span></label>
                    <select
                        value={office}
                        onChange={(e) => {
                            setOffice(e.target.value);
                            setFormErrors((prevErrors) => ({...prevErrors, office: ''}));
                        }}
                        required
                    >
                        <option value="">Select Office</option>
                        {offices.map((office) => (
                            <option key={office.id} value={office.id}>
                                {office.name}
                            </option>
                        ))}
                    </select>
                    {formErrors.office && <span className="error-text">{formErrors.office}</span>}
                </div>

                <div className="search-item">
                    <label>Currency <span>*</span></label>
                    <select
                        value={currency}
                        onChange={(e) => {
                            setCurrency(e.target.value);
                            setFormErrors((prevErrors) => ({...prevErrors, currency: ''}));
                        }}
                        required
                    >
                        <option value="">Select Currency</option>
                        {currencies.map((curr) => (
                            <option key={curr.code} value={curr.code}>
                                {curr.name}
                            </option>
                        ))}
                    </select>
                    {formErrors.currency && <span className="error-text">{formErrors.currency}</span>}
                </div>

                <div className="search-item search-button-container">
                    <button onClick={handleSearch} className="search-button">Search</button>
                </div>
            </div>

            {openingBalances.length > 0 && (
                <div className="opening-balance-details">
                    <div className="contra-and-date-container">
                        {contraAccount && (
                            <div className="contra-section">
                                <label>Opening Balances Contra</label>
                                <span>
                                    {`${contraAccount.name} (${contraAccount.glCode})`}
                                </span>
                            </div>
                        )}
                        <div className="date-section">
                            <label>Date of Opening Balance <span>*</span></label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <table className="opening-balances-table">
                        <thead>
                        <tr>
                            <th>Type</th>
                            <th>GL Code</th>
                            <th>Account</th>
                            <th>Debit</th>
                            <th>Credit</th>
                        </tr>
                        </thead>
                        <tbody>
                        {openingBalances.map((entry, index) => {
                            const isFirstOfType =
                                index === 0 || entry.type !== openingBalances[index - 1].type;
                            const typeRowSpan = openingBalances.filter(
                                (e) => e.type === entry.type
                            ).length;

                            return (
                                <tr key={index}>
                                    {isFirstOfType && (
                                        <td rowSpan={typeRowSpan} className="merged-type-cell">
                                            {entry.type}
                                        </td>
                                    )}
                                    <td>{entry.glAccountCode}</td>
                                    <td>{entry.glAccountName}</td>
                                    <td><input type="number" defaultValue={0} min="0"/></td>
                                    <td><input type="number" defaultValue={0} min="0"/></td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                    <div className="opening-balance-form-actions">
                        <div className="opening-balance-submit-button" onClick={handleSubmit}>Submit</div>
                        <div className="opening-balance-cancel-button" onClick={() => navigate('/accounting')}>Cancel
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MigrateOpeningBalancesPage;
