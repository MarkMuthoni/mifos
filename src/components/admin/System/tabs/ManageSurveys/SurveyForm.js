import React, { useState, useContext } from 'react';
import { AuthContext } from '../../../../../context/AuthContext';
import { useLoading } from '../../../../../context/LoadingContext';
import { API_CONFIG } from '../../../../../config';
import './SurveyForm.css';
import {NotificationContext} from "../../../../../context/NotificationContext";

const SurveyForm = () => {
    const { user } = useContext(AuthContext);
    const { showNotification } = useContext(NotificationContext);
    const { startLoading, stopLoading } = useLoading();

    const [surveyData, setSurveyData] = useState({
        key: '',
        name: '',
        countryCode: '',
        description: '',
    });

    const [questions, setQuestions] = useState([
        {
            key: '',
            text: '',
            description: '',
            options: [{ text: '', value: '' }],
        },
    ]);

    const [showQuestions, setShowQuestions] = useState(false);

    const handleSurveyChange = (field, value) => {
        setSurveyData((prev) => ({ ...prev, [field]: value }));
    };

    const handleQuestionChange = (index, field, value) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index][field] = value;
        setQuestions(updatedQuestions);
    };

    const handleOptionChange = (questionIndex, optionIndex, field, value) => {
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex].options[optionIndex][field] = value;
        setQuestions(updatedQuestions);
    };

    const addOption = (questionIndex) => {
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex].options.push({ text: '', value: '' });
        setQuestions(updatedQuestions);
    };

    const deleteOption = (questionIndex, optionIndex) => {
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex].options.splice(optionIndex, 1);
        setQuestions(updatedQuestions);
    };

    const addQuestion = () => {
        setQuestions((prev) => [
            ...prev,
            { key: '', text: '', description: '', options: [{ text: '', value: '' }] },
        ]);
    };

    const deleteQuestion = (index) => {
        const updatedQuestions = [...questions];
        updatedQuestions.splice(index, 1);
        setQuestions(updatedQuestions);
    };

    const handleSurveySubmit = async () => {
        const payload = {
            ...surveyData,
            questions: questions.map((question) => ({
                key: question.key,
                text: question.text,
                description: question.description,
                options: question.options,
            })),
        };

        startLoading();
        try {
            const response = await fetch(`${API_CONFIG.proxy}/fineract-provider/api/v1/surveys`, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${user.base64EncodedAuthenticationKey}`,
                    'Fineract-Platform-TenantId': `${API_CONFIG.tenantId}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                showNotification('Survey created successfully!', 'success');
                setSurveyData({ key: '', name: '', countryCode: '', description: '' });
                setQuestions([{ key: '', text: '', description: '', options: [{ text: '', value: '' }] }]);
                setShowQuestions(false);
            } else {
                const errorData = await response.json();
                console.error('Error creating survey:', errorData);
                showNotification('Failed to create survey. Please try again!', 'error');
            }
        } catch (error) {
            console.error('Error creating survey:', error);
            showNotification('An error occurred. Please try again later!', 'error');
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="survey-form-container">
            <h3 className="survey-form-title">Create a New Survey</h3>
            <form>
                {/* Survey Details Form */}
                <div className="survey-form-section">
                    <div className="survey-option-row">
                        <div className="survey-form-field">
                            <label htmlFor="survey-key">
                                Key <span>*</span>
                            </label>
                            <input
                                type="text"
                                id="survey-key"
                                value={surveyData.key}
                                onChange={(e) => handleSurveyChange('key', e.target.value)}
                                placeholder="Enter a unique key"
                                required
                            />
                        </div>
                        <div className="survey-form-field">
                            <label htmlFor="survey-name">
                                Name <span>*</span>
                            </label>
                            <input
                                type="text"
                                id="survey-name"
                                value={surveyData.name}
                                onChange={(e) => handleSurveyChange('name', e.target.value)}
                                placeholder="Enter the survey name"
                                required
                            />
                        </div>
                    </div>
                    <div className="survey-form-field">
                        <label htmlFor="survey-country-code">
                            Country Code <span>*</span>
                        </label>
                        <input
                            type="text"
                            id="survey-country-code"
                            value={surveyData.countryCode}
                            onChange={(e) => handleSurveyChange('countryCode', e.target.value)}
                            placeholder="e.g., KE or US"
                            maxLength={2}
                            required
                        />
                    </div>
                    <div className="survey-form-field">
                        <label htmlFor="survey-description">Description</label>
                        <textarea
                            id="survey-description"
                            value={surveyData.description}
                            onChange={(e) => handleSurveyChange('description', e.target.value)}
                            placeholder="Optional: Provide a brief description of the survey"
                        />
                    </div>
                    <div className="survey-form-submit-container">
                        <button
                            type="button"
                            className="survey-form-submit-button"
                            onClick={() => setShowQuestions(true)}
                            disabled={!surveyData.key || !surveyData.name || !surveyData.countryCode}
                        >
                            Proceed
                        </button>
                    </div>
                </div>

                {showQuestions &&
                    questions.map((question, questionIndex) => (
                        <div key={questionIndex} className="survey-question-section">
                            <div className="question-header">
                                <h4>Question {questionIndex + 1}</h4>
                                <button
                                    type="button"
                                    className="survey-delete-question-button"
                                    onClick={() => deleteQuestion(questionIndex)}
                                    disabled={questions.length === 1}
                                >
                                    Delete Question
                                </button>
                            </div>
                            <div className="survey-option-row">
                                <div className="survey-form-field">
                                    <label htmlFor={`question-key-${questionIndex}`}>
                                        Key <span>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id={`question-key-${questionIndex}`}
                                        value={question.key}
                                        onChange={(e) => handleQuestionChange(questionIndex, 'key', e.target.value)}
                                        placeholder="Enter question key"
                                        required
                                    />
                                </div>
                                <div className="survey-form-field">
                                    <label htmlFor={`question-text-${questionIndex}`}>
                                        Text <span>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id={`question-text-${questionIndex}`}
                                        value={question.text}
                                        onChange={(e) => handleQuestionChange(questionIndex, 'text', e.target.value)}
                                        placeholder="Enter question text"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="survey-form-field">
                                <label htmlFor={`question-description-${questionIndex}`}>Description</label>
                                <textarea
                                    id={`question-description-${questionIndex}`}
                                    value={question.description}
                                    onChange={(e) =>
                                        handleQuestionChange(questionIndex, 'description', e.target.value)
                                    }
                                    placeholder="Optional: Provide a brief description of the question"
                                />
                            </div>
                            <div className="survey-options-section">
                                <h5>Options <span>*</span>
                                </h5>
                                {question.options.map((option, optionIndex) => (
                                    <div key={optionIndex} className="survey-option-row">
                                        <input
                                            type="text"
                                            placeholder="Option text"
                                            value={option.text}
                                            onChange={(e) =>
                                                handleOptionChange(questionIndex, optionIndex, 'text', e.target.value)
                                            }
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Option value"
                                            value={option.value}
                                            onChange={(e) =>
                                                handleOptionChange(questionIndex, optionIndex, 'value', e.target.value)
                                            }
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="survey-option-delete-button"
                                            onClick={() => deleteOption(questionIndex, optionIndex)}
                                            disabled={question.options.length === 1}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="survey-add-option-button"
                                    onClick={() => addOption(questionIndex)}
                                >
                                    Add Option
                                </button>
                            </div>
                        </div>
                    ))}
                {showQuestions && (
                    <div className="add-question-container">
                        <button
                            type="button"
                            className="survey-add-question-button"
                            onClick={addQuestion}
                        >
                            Add Question
                        </button>
                    </div>
                )}
                {showQuestions && (
                    <div className="survey-form-submit-container">
                        <button
                            type="button"
                            className="survey-form-submit-button"
                            onClick={handleSurveySubmit}
                            disabled={
                                !surveyData.key ||
                                !surveyData.name ||
                                !surveyData.countryCode ||
                                questions.some(
                                    (question) =>
                                        !question.key ||
                                        !question.text ||
                                        question.options.some((option) => !option.text || !option.value)
                                )
                            }
                        >
                            Submit Survey
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default SurveyForm;
