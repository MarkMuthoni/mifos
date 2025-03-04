// import React, { useState, useEffect, useContext } from 'react';
// import axios from 'axios';
// import { useParams } from 'react-router-dom';
// import { AuthContext } from '../../../../context/AuthContext';
// import { useLoading } from '../../../../context/LoadingContext';
// import { API_CONFIG } from '../../../../config';
//
// const CreateGSIMApplication = () => {
//     const { groupId } = useParams();
//     const { user } = useContext(AuthContext);
//     const { startLoading, stopLoading } = useLoading();
//
//     const [currentStage, setCurrentStage] = useState('Details');
//     const [productOptions, setProductOptions] = useState([]);
//     const [selectedProduct, setSelectedProduct] = useState('');
//     const [savingsTemplate, setSavingsTemplate] = useState(null);
//
//     const stages = ['Details', 'Terms', 'Charges', 'Preview'];
//
//     useEffect(() => {
//         const fetchGroupProducts = async () => {
//             startLoading();
//             try {
//                 const headers = {
//                     Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
//                     'Fineract-Platform-TenantId': 'default',
//                 };
//                 const response = await axios.get(
//                     `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/template?groupId=${groupId}`,
//                     { headers }
//                 );
//                 setProductOptions(response.data.productOptions || []);
//             } catch (error) {
//                 console.error('Error fetching group products:', error);
//             } finally {
//                 stopLoading();
//             }
//         };
//
//         fetchGroupProducts();
//     }, [groupId, user]);
//
//     const fetchProductDetails = async (productId) => {
//         startLoading();
//         try {
//             const headers = {
//                 Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
//                 'Fineract-Platform-TenantId': 'default',
//             };
//             const response = await axios.get(
//                 `${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts/template?groupId=${groupId}&productId=${productId}`,
//                 { headers }
//             );
//             setSavingsTemplate(response.data);
//         } catch (error) {
//             console.error('Error fetching product details:', error);
//         } finally {
//             stopLoading();
//         }
//     };
//
//     const handleNext = () => {
//         const currentIndex = stages.indexOf(currentStage);
//         if (currentIndex < stages.length - 1) {
//             setCurrentStage(stages[currentIndex + 1]);
//         }
//     };
//
//     const handlePrevious = () => {
//         const currentIndex = stages.indexOf(currentStage);
//         if (currentIndex > 0) {
//             setCurrentStage(stages[currentIndex - 1]);
//         }
//     };
//
//     const renderStageTracker = () => (
//         <div className="staged-form-stage-tracker">
//             {stages.map((stage) => (
//                 <div
//                     key={stage}
//                     className={`staged-form-stage ${
//                         stage === currentStage
//                             ? 'staged-form-active'
//                             : 'staged-form-unvisited'
//                     }`}
//                     onClick={() => setCurrentStage(stage)}
//                 >
//                     <span className="staged-form-stage-circle">{stages.indexOf(stage) + 1}</span>
//                     <span className="staged-form-stage-label">{stage}</span>
//                 </div>
//             ))}
//         </div>
//     );
//
//     const renderDetailsStage = () => (
//         <div className="stage-details">
//             <div className="staged-form-row">
//                 <div className="staged-form-field">
//                     <label htmlFor="product">Product Name <span>*</span></label>
//                     <select
//                         id="product"
//                         value={selectedProduct}
//                         className="staged-form-select"
//                         onChange={(e) => {
//                             setSelectedProduct(e.target.value);
//                             fetchProductDetails(e.target.value);
//                         }}
//                         required
//                     >
//                         <option value="">Select Product</option>
//                         {productOptions.map((product) => (
//                             <option key={product.id} value={product.id}>
//                                 {product.name}
//                             </option>
//                         ))}
//                     </select>
//                 </div>
//             </div>
//         </div>
//     );
//
//     const renderTermsStage = () => (
//         <div className="stage-terms">
//             <div className="staged-form-row">
//                 <div className="staged-form-field">
//                     <label htmlFor="nominalAnnualInterest">Nominal Annual Interest</label>
//                     <input
//                         type="number"
//                         id="nominalAnnualInterest"
//                         value={savingsTemplate?.nominalAnnualInterestRate || ''}
//                         onChange={(e) =>
//                             setSavingsTemplate((prev) => ({
//                                 ...prev,
//                                 nominalAnnualInterestRate: e.target.value,
//                             }))
//                         }
//                         className="staged-form-input"
//                     />
//                 </div>
//             </div>
//         </div>
//     );
//
//     const renderChargesStage = () => (
//         <div className="stage-charges">
//             <div className="staged-form-row">
//                 <div className="staged-form-field">
//                     <label htmlFor="chargeSelect">Charge</label>
//                     <select
//                         id="chargeSelect"
//                         value={selectedCharge}
//                         onChange={(e) => setSelectedCharge(e.target.value)}
//                         className="staged-form-select"
//                     >
//                         <option value="">-- Select a Charge --</option>
//                         {chargeOptions.map((charge) => (
//                             <option key={charge.id} value={charge.id}>
//                                 {charge.name}
//                             </option>
//                         ))}
//                     </select>
//                 </div>
//                 <button
//                     onClick={handleAddCharge}
//                     className="staged-form-button-add"
//                     disabled={!selectedCharge}
//                 >
//                     Add
//                 </button>
//             </div>
//             <div className="charges-table-container">
//                 <table className="charges-table">
//                     <thead>
//                     <tr>
//                         <th>Name</th>
//                         <th>Type</th>
//                         <th>Amount</th>
//                         <th>Actions</th>
//                     </tr>
//                     </thead>
//                     <tbody>
//                     {charges.map((charge, index) => (
//                         <tr key={index}>
//                             <td>{charge.name}</td>
//                             <td>{charge.type || "N/A"}</td>
//                             <td>
//                                 <input
//                                     type="number"
//                                     value={charge.amount}
//                                     onChange={(e) =>
//                                         handleChargeFieldUpdate(index, "amount", e.target.value)
//                                     }
//                                     className="staged-form-input"
//                                 />
//                             </td>
//                             <td>
//                                 <FaTrash onClick={() => handleRemoveCharge(index)} />
//                             </td>
//                         </tr>
//                     ))}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     );
//
//     const renderPreviewSection = () => {
//         const stageData = {
//             "Product Name": selectedProduct
//                 ? productOptions.find((product) => product.id === parseInt(selectedProduct))?.name || "N/A"
//                 : "N/A",
//             "Nominal Annual Interest": savingsTemplate?.nominalAnnualInterestRate || "N/A",
//             "Charges": charges.map((charge) => charge.name).join(", ") || "N/A",
//         };
//
//         return (
//             <div className="staged-form-preview-section">
//                 <h2 className="preview-header">Form Preview</h2>
//                 <table className="staged-form-preview-table">
//                     <thead>
//                     <tr>
//                         <th>Field</th>
//                         <th>Value</th>
//                     </tr>
//                     </thead>
//                     <tbody>
//                     {Object.entries(stageData).map(([key, value]) => (
//                         <tr key={key}>
//                             <td>{key}</td>
//                             <td>{value}</td>
//                         </tr>
//                     ))}
//                     </tbody>
//                 </table>
//             </div>
//         );
//     };
//
//     const handleSubmit = async () => {
//         try {
//             startLoading();
//             const submissionData = {
//                 groupId: savingsTemplate?.groupId,
//                 productId: selectedProduct,
//                 nominalAnnualInterestRate: savingsTemplate?.nominalAnnualInterestRate,
//                 charges: charges.map((charge) => ({
//                     id: charge.id,
//                     amount: charge.amount || null,
//                     date: charge.date || null,
//                     repaymentsEvery: charge.repaymentsEvery || null,
//                 })),
//             };
//
//             console.log("Submitting data: ", submissionData);
//
//             const headers = {
//                 Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
//                 'Fineract-Platform-TenantId': 'default',
//             };
//
//             await axios.post(`${API_CONFIG.proxy}/fineract-provider/api/v1/savingsaccounts`, submissionData, { headers });
//
//             alert("Application submitted successfully!");
//         } catch (error) {
//             console.error("Error submitting the application: ", error);
//             alert("Failed to submit the application. Please try again.");
//         } finally {
//             stopLoading();
//         }
//     };
//
//     const renderStageContent = () => {
//         switch (currentStage) {
//             case 'Details':
//                 return renderDetailsStage();
//             case 'Terms':
//                 return renderTermsStage();
//             case 'Charges':
//                 return renderChargesStage();
//             case 'Preview':
//                 return renderPreviewSection();
//             default:
//                 return null;
//         }
//     };
//
//     return (
//         <div className="staged-form-container">
//             {renderStageTracker()}
//             <div className="staged-form-content">
//                 {renderStageContent()}
//                 <div className="staged-form-buttons">
//                     <button
//                         onClick={handlePrevious}
//                         disabled={currentStage === 'Details'}
//                         className="staged-form-button-previous"
//                     >
//                         Previous
//                     </button>
//                     <button
//                         onClick={currentStage === 'Preview' ? handleSubmit : handleNext}
//                         disabled={
//                             (currentStage !== 'Preview' && !isStageComplete(currentStage)) ||
//                             (currentStage === 'Preview' && charges.length === 0)
//                         }
//                         className={`staged-form-button-${currentStage === 'Preview' ? 'submit' : 'next'}`}
//                     >
//                         {currentStage === 'Preview' ? 'Submit' : 'Next'}
//                     </button>
//                     <button
//                         onClick={handleSubmit}
//                         disabled={currentStage !== 'Preview'}
//                         className="staged-form-button-submit"
//                     >
//                         Submit
//                     </button>
//                 </div>
//
//             </div>
//         </div>
//     );
// };
//
// export default CreateGSIMApplication;
