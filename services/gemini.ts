import { GoogleGenAI } from "@google/genai";

const getApiKey = () => process.env.API_KEY || '';

// Initialize client lazily to avoid issues if key is missing initially
export const createGeminiClient = () => {
  return new GoogleGenAI({ apiKey: getApiKey() });
};

export const MOCK_LOAN_DOC_CONTENT = `LOAN AGREEMENT

This Loan Agreement ("Agreement") is made and entered into on October 24, 2023, by and between:
LENDER: Global Finance Corp, located at 123 Wall St, NY.
BORROWER: John Doe, located at 456 Elm St, CA.

1. PRINCIPAL AMOUNT: $50,000.00 USD.
2. INTEREST RATE: 5.5% fixed per annum.
3. REPAYMENT TERM: 60 months.
4. COLLATERAL: 2022 Tesla Model 3 (VIN: 5YJ3E1EA1LF...).
5. DEFAULT: Failure to pay within 15 days of due date constitutes default.

IN WITNESS WHEREOF, the parties have executed this Agreement.
`;
