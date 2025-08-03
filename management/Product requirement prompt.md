# **Product Requirement Document: "MediBot" Pre-consultation Virtual Assistant**

### 1\. Introduction and Overview

Product: MediBot, an AI-powered Virtual Assistant for medical pre-consultation.

Vision: To streamline the patient intake process in clinics and medical offices by automating the initial data collection. MediBot will interact with patients in an empathetic and efficient manner, allowing medical staff to focus on clinical care.

Primary Goal: To develop a conversational agent capable of executing a structured, three-phase dialogue to gather basic demographic and anamnesis information from a patient before their medical appointment.

### 2\. User Stories

* As a patient, I want to provide my personal details and the reason for my visit to an automated system quickly and easily, so my doctor has this information ready when they see me.  
* As a medical professional (doctor/nurse), I want to receive a clear and concise summary of the patient's data and their reason for consultation before the appointment, so I can prepare adequately and optimize the consultation time.  
* As a clinic administrator, I want to implement a tool that reduces the administrative workload on my staff and improves the patient experience from the very first point of contact.

### 3\. Functional Requirements

3.1. Structured Conversation Flow: The system must strictly follow the three sequential phases below:

* Phase 1: Greeting and Introduction:  
  * Initiate the conversation with a standardized greeting.  
  * Introduce itself as "MediBot," the clinic's virtual assistant.  
  * Briefly explain its function is to gather data for the doctor.  
* Phase 2: Basic Anamnesis: 
  * Ask for the reason for the consultation, the main symptoms, and the duration or onset of these symptoms.  
  * It must be able to process an open-ended response containing this information.  
  * Action: Upon receiving the response, the system must call the save\_anamnesis(reason\_for\_visit: string, symptoms: string, duration: string) function.
* Phase 3: Summary for the doctor:
  * The AI Agent should generate a summary of the pacient problem.
  * It should also recommend the solution and the necesary medication, so the Doctor could decide what are the better options  

3.2. Conversation Closure:

* Once the initial two phases are complete, the system must end the conversation with a message of thanks and confirmation that the data will be reviewed by the doctor.

3.3. Dialogue Management:

* Unsolicited Information: If the patient provides information from a later phase (e.g., gives symptoms during the personal data phase), the system should politely acknowledge it and continue with the current question in the flow.  
* Off-Topic Questions: If the patient asks a question unrelated to the pre-consultation (e.g., "How much does the appointment cost?"), the system should politely respond that its sole function is to gather data and that the doctor will answer other questions.

### 4\. Non-Functional Requirements

4.1. Tone and Personality:

* The language used must be professional, calm, and empathetic.  
* Questions must be clear, direct, and concise.  
* The language model must be able to understand and process English naturally.

4.2. Error Handling and Clarifications:

* Low Comprehension Confidence: If the system does not understand the patient's response, it should politely ask them to repeat it (e.g., "I'm sorry, I didn't quite understand that. Could you please repeat it?").  
* Missing Data Prompt: If the patient only provides part of the requested information (e.g., only their name), the system must specifically ask for the missing piece of data (e.g., "Thank you. Could you also provide me with your date of birth?").

4.3. Integrations (API Calls):

* The system must integrate with two external functions (API endpoints):  
  * save\_patient\_data(name, date\_of\_birth): Called after Phase 2\.  
  * save\_anamnesis(reason\_for\_visit, symptoms, duration): Called after Phase 3\.  
* Error handling must be in place in case these API calls fail.

### 5\. Backend Requirements

5.1. API Endpoints:

* **Patient Data Management:**
  * `POST /api/patients` - Create new patient record
  * `PUT /api/patients/{id}` - Update existing patient information
  * `GET /api/patients/{id}` - Retrieve patient details
  * `DELETE /api/patients/{id}` - Remove patient record

* **Anamnesis Management:**
  * `POST /api/anamnesis` - Save consultation anamnesis data
  * `GET /api/anamnesis/{patient_id}` - Retrieve patient's anamnesis history
  * `PUT /api/anamnesis/{id}` - Update anamnesis information

* **Doctor Interface:**
  * `GET /api/consultations/pending` - List pending patient consultations
  * `PUT /api/consultations/{id}/review` - Mark consultation as reviewed
  * `POST /api/consultations/{id}/notes` - Add doctor's notes
  * `GET /api/consultations/{id}/summary` - Get complete consultation summary

5.2. Data Storage:

* **Patient Table:** id, name, date_of_birth, created_at, updated_at
* **Anamnesis Table:** id, patient_id, reason_for_visit, symptoms, duration, ai_summary, ai_recommendations, created_at
* **Consultations Table:** id, patient_id, anamnesis_id, status (pending/reviewed/completed), doctor_notes, reviewed_at
* **Audit Log:** Track all data changes with timestamps and user attribution

5.3. Security & Compliance:

* HIPAA-compliant data encryption at rest and in transit
* Authentication and authorization for doctor access
* Data retention policies
* Secure API authentication (JWT tokens)

### 6\. Frontend Requirements - Doctor Interface

6.1. Dashboard:

* **Pending Consultations View:**
  * List of patients waiting for consultation
  * Patient name, appointment time, and status
  * Quick preview of chief complaint
  * Priority indicators based on symptoms

* **Patient Detail View:**
  * Complete patient information display
  * Anamnesis data with AI-generated summary
  * AI recommendations section
  * Editable notes section for doctor's observations

6.2. Review and Edit Functionality:

* **Data Validation:**
  * Allow doctors to correct patient information
  * Validate and update anamnesis details
  * Add or modify symptoms and duration

* **Notes and Annotations:**
  * Rich text editor for doctor's notes
  * Ability to flag urgent cases
  * Add follow-up reminders

6.3. Search and Filter:

* Search patients by name, date, or symptoms
* Filter by consultation status, date range, or urgency
* Export functionality for reports

### 7\. Frontend Requirements - Conversational Agent UI

7.1. Chat Interface:

* **Design Requirements:**
  * Clean, medical-professional appearance
  * Accessible design (WCAG 2.1 AA compliance)
  * Mobile-responsive layout
  * Clear typography with adequate contrast ratios

* **Conversation Flow:**
  * Progressive disclosure of conversation phases
  * Visual indicators for current step (progress bar)
  * Clear message bubbles with timestamps
  * Typing indicators during AI processing

7.2. Input Methods:

* **Text Input:**
  * Auto-expanding text area
  * Character limit indicators
  * Input validation and sanitization
  * Support for common medical terminology

* **Voice Input (Optional):**
  * Speech-to-text capability
  * Visual feedback during recording
  * Fallback to text input if voice fails

7.3. User Experience Features:

* **Accessibility:**
  * Screen reader compatibility
  * Keyboard navigation support
  * Font size adjustment options
  * High contrast mode

* **Error Handling:**
  * Clear error messages for failed inputs
  * Graceful degradation if backend is unavailable
  * Retry mechanisms for failed API calls

* **Progress Tracking:**
  * Phase completion indicators
  * Estimated time remaining
  * Ability to pause and resume conversation

### 8\. Edge Cases

* Patient Interruption: The system should be able to resume the question flow if interrupted.  
* Vague or Indecisive Patient: The system should handle ambiguous responses by attempting to clarify once before logging the information as provided.  
* Patient Refuses to Provide Information: If a patient refuses to provide a piece of information, the system should note it as such and continue the flow if possible, or end the call if the data is critical (like the patient's name).