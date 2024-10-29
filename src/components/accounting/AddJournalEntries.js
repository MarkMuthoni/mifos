import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';
import './FrequentPosting.css';

const AddJournalEntries = () => {
    const [step, setStep] = useState(1);
    const [showPaymentDetails, setShowPaymentDetails] = useState(false);

    const [office, setOffice] = useState('');
    const [currency, setCurrency] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [transactionDate, setTransactionDate] = useState('');
    const [paymentType, setPaymentType] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [chequeNumber, setChequeNumber] = useState('');
    const [routingCode, setRoutingCode] = useState('');
    const [receiptNumber, setReceiptNumber] = useState('');
    const [bankNumber, setBankNumber] = useState('');
    const [comments, setComments] = useState('');

    const [debits, setDebits] = useState([{ type: '', amount: '' }]);
    const [credit, setCredit] = useState({ type: '', amount: '' });
    const [credits, setCredits] = useState([{ type: '', amount: '' }]);


    const isStep1Complete = office && currency && transactionDate;
    const isStep2Complete = debits[0].type || credit.type;

    const goNext = () => {
        if ((step === 1 && isStep1Complete) || (step === 2 && isStep2Complete)) {
            setStep(step + 1);
        }
    };
    const goBack = () => setStep(step - 1);

    const handleAddDebit = () => {
        setDebits([...debits, { type: '', amount: '' }]);
    };

    const handleDebitChange = (index, field, value) => {
        const updatedDebits = [...debits];
        updatedDebits[index][field] = value;
        setDebits(updatedDebits);
    };

    const handleCreditChange = (index, field, value) => {
        const updatedCredits = [...credits];
        updatedCredits[index][field] = value;
        setCredits(updatedCredits);
    };

    const handleAddCredit = () => {
        if (credits.length < 2) {
            setCredits([...credits, { type: '', amount: '' }]);
        }
    };

    const handleRemoveDebit = (index) => {
        setDebits(debits.filter((_, i) => i !== index));
    };

    const handleRemoveCredit = (index) => {
        setCredits(credits.filter((_, i) => i !== index));
    };


    const handleSubmit = () => {
        console.log("Form submitted with data:", {
            office, currency, referenceNumber, transactionDate, debits, credit,
            paymentType, accountNumber, chequeNumber, routingCode, receiptNumber,
            bankNumber, comments
        });
    };

    return (
        <div className="form-container-client">
            <h2>
                <Link to="/accounting" className="breadcrumb-link">Accounting</Link> . Add Journal Entries
            </h2>

            <div className="with-indicator">
                <div className="stage-indicator">
                    <div className={`stage ${step === 1 ? 'current' : step > 1 ? 'completed' : ''}`} onClick={() => setStep(1)}>
                        <div className="circle"></div>
                        <span>Basic Information</span>
                    </div>
                    <div className={`stage ${step === 2 ? 'current' : step > 2 ? 'completed' : ''}`} onClick={() => setStep(2)}>
                        <div className="circle"></div>
                        <span>Affected GL Entries</span>
                    </div>
                    <div className={`stage ${step === 3 ? 'current' : step > 3 ? 'completed' : ''}`} onClick={() => setStep(3)}>
                        <div className="circle"></div>
                        <span>Payment Details</span>
                    </div>
                    <div className={`stage ${step === 4 ? 'current' : ''}`} onClick={() => setStep(4)}>
                        <div className="circle"></div>
                        <span>Review & Submit</span>
                    </div>
                </div>

                <form className="client-form">
                    {step === 1 && (
                        <>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Office <span>*</span></label>
                                    <select value={office} onChange={(e) => setOffice(e.target.value)} required>
                                        <option value="">Select Office</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Currency <span>*</span></label>
                                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} required>
                                        <option value="">Select Currency</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Reference Number</label>
                                    <input type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Transaction Date <span>*</span></label>
                                    <input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} required />
                                </div>
                            </div>
                            <div className="navigation-buttons">
                                <button type="button" className="back-button">Cancel</button>
                                <button type="button" className="next-button" onClick={goNext} disabled={!isStep1Complete}>Next</button>
                            </div>
                        </>
                    )}
                    {step === 2 && (
                        <>
                            <div className="form-row">
                                <h3>Affected GL Entries</h3>
                                {debits.length < 2 && (
                                    <span
                                        type="button"
                                        className="add-debit-button"
                                        onClick={handleAddDebit}
                                    >
                                        <FaPlus style={{ marginRight: '5px' }} />
                                        Add Debit
                                    </span>
                                )}
                                {credits.length < 2 && (
                                    <span
                                        type="button"
                                        className="add-debit-button"
                                        onClick={handleAddCredit}
                                    >
                                        <FaPlus style={{ marginRight: '5px' }} />
                                        Add Credit
                                    </span>
                                )}
                            </div>
                            <div className="form-row">
                                {debits.map((debit, index) => (
                                    <div key={index} className="form-row debit-entry">
                                        <div className="form-group">
                                            <label>Debit Type</label>
                                            <input
                                                type="text"
                                                value={debit.type}
                                                onChange={(e) => handleDebitChange(index, 'type', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Amount</label>
                                            <input
                                                type="number"
                                                value={debit.amount}
                                                onChange={(e) => handleDebitChange(index, 'amount', e.target.value)}
                                            />
                                        </div>
                                        {debits.length > 1 && (
                                            <button
                                                type="button"
                                                className="remove-icon"
                                                onClick={() => handleRemoveDebit(index)}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="form-row">
                                {credits.map((credit, index) => (
                                    <div key={index} className="form-row credit-entry">
                                        <div className="form-group">
                                            <label>Credit Type</label>
                                            <input
                                                type="text"
                                                value={credit.type}
                                                onChange={(e) => handleCreditChange(index, 'type', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Amount</label>
                                            <input
                                                type="number"
                                                value={credit.amount}
                                                onChange={(e) => handleCreditChange(index, 'amount', e.target.value)}
                                            />
                                        </div>
                                        {credits.length > 1 && (
                                            <button
                                                type="button"
                                                className="remove-icon"
                                                onClick={() => handleRemoveCredit(index)}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="navigation-buttons">
                                <button type="button" className="back-button" onClick={goBack}>Back</button>
                                <button type="button" className="next-button" onClick={goNext} disabled={!isStep2Complete}>Next</button>
                            </div>
                        </>
                    )}
                    {step === 3 && (
                        <>
                            <button type="button" onClick={() => setShowPaymentDetails(!showPaymentDetails)} className="toggle-payment-details">
                                {showPaymentDetails ? 'Hide' : 'Show'} Payment Details
                            </button>

                            {showPaymentDetails && (
                                <div className="payment-details">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Payment Type</label>
                                            <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                                                <option value="">Select Payment Type</option>
                                                <option value="money-transfer">Money Transfer</option>
                                                <option value="account-to-account">Account to Account</option>
                                                <option value="funds-transfer">Funds Transfer</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Account Number</label>
                                            <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Cheque Number</label>
                                            <input type="text" value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>Routing Code</label>
                                            <input type="text" value={routingCode} onChange={(e) => setRoutingCode(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Receipt Number</label>
                                            <input type="text" value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>Bank Number</label>
                                            <input type="text" value={bankNumber} onChange={(e) => setBankNumber(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Comments</label>
                                <textarea rows="3" value={comments} onChange={(e) => setComments(e.target.value)} />
                            </div>
                            <div className="navigation-buttons">
                                <button type="button" className="back-button" onClick={goBack}>Back</button>
                                <button type="button" className="next-button" onClick={goNext}>Next</button>
                            </div>
                        </>
                    )}
                    {step === 4 && (
                        <>
                        <div className="review-section">
                            <h3 className="review-title">Review & Submit</h3>
                            <div className="review-details">
                                <div className="review-row">
                                    <p><strong>Office:</strong> {office}</p>
                                    <p><strong>Currency:</strong> {currency}</p>
                                    <p><strong>Reference Number:</strong> {referenceNumber}</p>
                                    <p><strong>Transaction Date:</strong> {transactionDate}</p>
                                </div>
                                {debits.map((debit, index) => (
                                    <div key={index} className="review-row">
                                        <p><strong>Debit Type:</strong> {debit.type}</p>
                                        <p><strong>Debit Amount:</strong> {debit.amount}</p>
                                    </div>
                                ))}
                                <div className="review-row">
                                    <p><strong>Credit Type:</strong> {credit.type}</p>
                                    <p><strong>Credit Amount:</strong> {credit.amount}</p>
                                </div>
                                {showPaymentDetails && (
                                    <>
                                        <h4>Payment Details</h4>
                                        <div className="review-row">
                                            <p><strong>Payment Type:</strong> {paymentType}</p>
                                            <p><strong>Account Number:</strong> {accountNumber}</p>
                                            <p><strong>Cheque Number:</strong> {chequeNumber}</p>
                                            <p><strong>Routing Code:</strong> {routingCode}</p>
                                            <p><strong>Receipt Number:</strong> {receiptNumber}</p>
                                            <p><strong>Bank Number:</strong> {bankNumber}</p>
                                        </div>
                                    </>
                                )}
                                <div className="review-row">
                                    <p><strong>Comments:</strong> {comments}</p>
                                </div>
                            </div>

                        </div>
                        <div className="navigation-buttons">
                            <button type="button" onClick={goBack} className="back-button">Back</button>
                            <button type="button" onClick={handleSubmit} className="submit-button">Submit</button>
                        </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
};

export default AddJournalEntries;