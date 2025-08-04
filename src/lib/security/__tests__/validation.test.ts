import { InputSanitizer, validateRequest, validationSchemas } from '../validation';

describe('InputSanitizer', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = InputSanitizer.sanitizeHtml(input);
      expect(result).toBe('Hello  World');
    });

    it('should remove all HTML tags', () => {
      const input = '<div>Hello <b>World</b></div>';
      const result = InputSanitizer.sanitizeHtml(input);
      expect(result).toBe('Hello World');
    });

    it('should handle multiple script tags', () => {
      const input = '<script>bad()</script>Good content<script>more bad()</script>';
      const result = InputSanitizer.sanitizeHtml(input);
      expect(result).toBe('Good content');
    });
  });

  describe('sanitizeSql', () => {
    it('should remove SQL injection characters', () => {
      const input = "'; DROP TABLE users; --";
      const result = InputSanitizer.sanitizeSql(input);
      expect(result).toBe('DROP TABLE users');
    });

    it('should remove comment markers', () => {
      const input = 'SELECT * FROM users /* comment */ WHERE id = 1';
      const result = InputSanitizer.sanitizeSql(input);
      expect(result).toBe('SELECT * FROM users  comment  WHERE id = 1');
    });
  });

  describe('sanitizeMedicalText', () => {
    it('should preserve medical terminology', () => {
      const input = 'Patient has acute myocardial infarction with ST-elevation';
      const result = InputSanitizer.sanitizeMedicalText(input);
      expect(result).toBe(input);
    });

    it('should remove dangerous content', () => {
      const input = 'Patient has <script>alert("xss")</script> symptoms';
      const result = InputSanitizer.sanitizeMedicalText(input);
      expect(result).toBe('Patient has scriptalert("xss")/script symptoms');
    });

    it('should remove javascript protocols', () => {
      const input = 'Click javascript:alert("xss") for more info';
      const result = InputSanitizer.sanitizeMedicalText(input);
      expect(result).toBe('Click alert("xss") for more info');
    });
  });

  describe('sanitizeName', () => {
    it('should preserve valid name characters', () => {
      const input = "John O'Connor-Smith";
      const result = InputSanitizer.sanitizeName(input);
      expect(result).toBe(input);
    });

    it('should remove invalid characters', () => {
      const input = 'John123@#$%Doe';
      const result = InputSanitizer.sanitizeName(input);
      expect(result).toBe('JohnDoe');
    });

    it('should normalize spaces', () => {
      const input = '  John    Doe  ';
      const result = InputSanitizer.sanitizeName(input);
      expect(result).toBe('John Doe');
    });
  });

  describe('normalizeWhitespace', () => {
    it('should replace multiple spaces with single space', () => {
      const input = 'Hello     World';
      const result = InputSanitizer.normalizeWhitespace(input);
      expect(result).toBe('Hello World');
    });

    it('should normalize multiple newlines', () => {
      const input = 'Line 1\n\n\n\nLine 2';
      const result = InputSanitizer.normalizeWhitespace(input);
      expect(result).toBe('Line 1 Line 2');
    });
  });
});

describe('Validation Schemas', () => {
  describe('commonSchemas', () => {
    it('should validate valid UUID', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(() => validationSchemas.common.uuid.parse(validUuid)).not.toThrow();
    });

    it('should reject invalid UUID', () => {
      const invalidUuid = 'not-a-uuid';
      expect(() => validationSchemas.common.uuid.parse(invalidUuid)).toThrow();
    });

    it('should validate valid email', () => {
      const validEmail = 'user@example.com';
      expect(() => validationSchemas.common.email.parse(validEmail)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidEmail = 'not-an-email';
      expect(() => validationSchemas.common.email.parse(invalidEmail)).toThrow();
    });

    it('should validate strong password', () => {
      const strongPassword = 'StrongPass123!';
      expect(() => validationSchemas.common.password.parse(strongPassword)).not.toThrow();
    });

    it('should reject weak password', () => {
      const weakPassword = 'weak';
      expect(() => validationSchemas.common.password.parse(weakPassword)).toThrow();
    });

    it('should validate valid name', () => {
      const validName = "John O'Connor-Smith";
      expect(() => validationSchemas.common.name.parse(validName)).not.toThrow();
    });

    it('should reject name with numbers', () => {
      const invalidName = 'John123';
      expect(() => validationSchemas.common.name.parse(invalidName)).toThrow();
    });

    it('should validate date of birth', () => {
      const validDate = '1990-01-01';
      expect(() => validationSchemas.common.dateOfBirth.parse(validDate)).not.toThrow();
    });

    it('should reject invalid date format', () => {
      const invalidDate = '01/01/1990';
      expect(() => validationSchemas.common.dateOfBirth.parse(invalidDate)).toThrow();
    });

    it('should validate user roles', () => {
      expect(() => validationSchemas.common.userRole.parse('patient')).not.toThrow();
      expect(() => validationSchemas.common.userRole.parse('doctor')).not.toThrow();
      expect(() => validationSchemas.common.userRole.parse('admin')).not.toThrow();
    });

    it('should reject invalid user role', () => {
      expect(() => validationSchemas.common.userRole.parse('invalid')).toThrow();
    });
  });

  describe('patientSchemas', () => {
    it('should validate create patient request', () => {
      const validData = {
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        email: 'john@example.com'
      };
      expect(() => validationSchemas.patient.createPatient.parse(validData)).not.toThrow();
    });

    it('should validate create patient without optional email', () => {
      const validData = {
        name: 'John Doe',
        dateOfBirth: '1990-01-01'
      };
      expect(() => validationSchemas.patient.createPatient.parse(validData)).not.toThrow();
    });

    it('should reject create patient with missing required fields', () => {
      const invalidData = {
        email: 'john@example.com'
      };
      expect(() => validationSchemas.patient.createPatient.parse(invalidData)).toThrow();
    });
  });

  describe('anamnesisSchemas', () => {
    it('should validate create anamnesis request', () => {
      const validData = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        reasonForVisit: 'Annual checkup',
        symptoms: 'No specific symptoms',
        duration: '1 day'
      };
      expect(() => validationSchemas.anamnesis.createAnamnesis.parse(validData)).not.toThrow();
    });

    it('should reject anamnesis with invalid patient ID', () => {
      const invalidData = {
        patientId: 'invalid-uuid',
        reasonForVisit: 'Annual checkup',
        symptoms: 'No specific symptoms',
        duration: '1 day'
      };
      expect(() => validationSchemas.anamnesis.createAnamnesis.parse(invalidData)).toThrow();
    });
  });

  describe('authSchemas', () => {
    it('should validate login request', () => {
      const validData = {
        email: 'user@example.com',
        password: 'password123'
      };
      expect(() => validationSchemas.auth.login.parse(validData)).not.toThrow();
    });

    it('should validate register request', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass123!',
        role: 'patient' as const
      };
      expect(() => validationSchemas.auth.register.parse(validData)).not.toThrow();
    });
  });
});

describe('validateRequest', () => {
  it('should return parsed data for valid input', () => {
    const schema = validationSchemas.common.email;
    const validator = validateRequest(schema);
    const result = validator('user@example.com');
    expect(result).toBe('user@example.com');
  });

  it('should throw error for invalid input', () => {
    const schema = validationSchemas.common.email;
    const validator = validateRequest(schema);
    expect(() => validator('invalid-email')).toThrow('Validation failed');
  });

  it('should provide detailed error messages', () => {
    const schema = validationSchemas.patient.createPatient;
    const validator = validateRequest(schema);
    
    try {
      validator({ name: '', dateOfBirth: 'invalid' });
    } catch (error) {
      expect((error as Error).message).toContain('Validation failed');
      expect((error as Error).message).toContain('name');
      expect((error as Error).message).toContain('dateOfBirth');
    }
  });
});