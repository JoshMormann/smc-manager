import { describe, it, expect } from 'vitest';
import {
  srefCodeSchema,
  srefSubmissionSchema,
  srefUpdateSchema,
  type SREFFormData,
  type SREFSubmissionData,
  type SREFUpdateData,
} from './srefValidation';

describe('srefCodeSchema', () => {
  describe('title validation', () => {
    it('should accept valid titles', () => {
      const validData = {
        title: 'Valid Title',
        code_value: '--sref 1234567890',
        version: 'SV6' as const,
      };

      const result = srefCodeSchema.parse(validData);
      expect(result.title).toBe('Valid Title');
    });

    it('should trim whitespace from titles', () => {
      const data = {
        title: '  Title with spaces  ',
        code_value: '--sref 1234567890',
        version: 'SV6' as const,
      };

      const result = srefCodeSchema.parse(data);
      expect(result.title).toBe('Title with spaces');
    });

    it('should reject empty titles', () => {
      const data = {
        title: '',
        code_value: '--sref 1234567890',
        version: 'SV6' as const,
      };

      expect(() => srefCodeSchema.parse(data)).toThrow('Title is required');
    });

    it('should reject titles that are too long', () => {
      const data = {
        title: 'a'.repeat(101), // 101 characters
        code_value: '--sref 1234567890',
        version: 'SV6' as const,
      };

      expect(() => srefCodeSchema.parse(data)).toThrow('Title must be 100 characters or less');
    });

    it('should accept maximum length title', () => {
      const data = {
        title: 'a'.repeat(100), // exactly 100 characters
        code_value: '--sref 1234567890',
        version: 'SV6' as const,
      };

      const result = srefCodeSchema.parse(data);
      expect(result.title).toBe('a'.repeat(100));
    });
  });

  describe('code_value validation', () => {
    it('should accept valid SREF codes', () => {
      const validCodes = [
        '--sref 1234567890',
        '--sref 123456',
        '--sref 999999999999',
        ' --sref 123 ',
        '--sref  456  ',
      ];

      validCodes.forEach(code => {
        const data = {
          title: 'Test',
          code_value: code,
          version: 'SV6' as const,
        };

        expect(() => srefCodeSchema.parse(data)).not.toThrow();
      });
    });

    it('should reject empty code_value', () => {
      const data = {
        title: 'Test',
        code_value: '',
        version: 'SV6' as const,
      };

      expect(() => srefCodeSchema.parse(data)).toThrow('SREF code is required');
    });

    it('should reject codes without --sref', () => {
      const data = {
        title: 'Test',
        code_value: '1234567890',
        version: 'SV6' as const,
      };

      try {
        srefCodeSchema.parse(data);
        expect.fail('Expected validation to fail');
      } catch (error: unknown) {
        const zodError = error as { issues: Array<{ message: string }> };
        expect(zodError.issues[0].message).toBe('SREF code must include "--sref"');
      }
    });

    it('should reject codes with incorrect format', () => {
      // These codes should fail the first refine (missing --sref)
      const missingFlag = ['sref 123', '--ref 123'];
      missingFlag.forEach(code => {
        const data = {
          title: 'Test',
          code_value: code,
          version: 'SV6' as const,
        };
        expect(() => srefCodeSchema.parse(data)).toThrow();
      });

      // These codes should fail the regex check (no digits after --sref)
      const noDigits = ['--sref', '--sref abc'];
      noDigits.forEach(code => {
        const data = {
          title: 'Test',
          code_value: code,
          version: 'SV6' as const,
        };
        expect(() => srefCodeSchema.parse(data)).toThrow();
      });

      // Note: '--sref 12.34' actually passes the regex /--sref\s+\d+/ because it contains digits after --sref
      // This is the current behavior of the schema and might be intentional
    });
  });

  describe('version validation', () => {
    it('should accept valid versions', () => {
      ['SV4', 'SV6'].forEach(version => {
        const data = {
          title: 'Test',
          code_value: '--sref 123',
          version: version as 'SV4' | 'SV6',
        };

        const result = srefCodeSchema.parse(data);
        expect(result.version).toBe(version);
      });
    });

    it('should reject invalid versions', () => {
      const invalidVersions = ['SV5', 'V4', 'sv4', 'SV3', 'SV7', ''];

      invalidVersions.forEach(version => {
        const data = {
          title: 'Test',
          code_value: '--sref 123',
          version: version as 'SV4' | 'SV6',
        };

        expect(() => srefCodeSchema.parse(data)).toThrow('Version must be either SV4 or SV6');
      });
    });
  });

  describe('tags validation', () => {
    it('should accept valid tags array', () => {
      const data = {
        title: 'Test',
        code_value: '--sref 123',
        version: 'SV6' as const,
        tags: ['tag1', 'tag2', 'cyberpunk'],
      };

      const result = srefCodeSchema.parse(data);
      expect(result.tags).toEqual(['tag1', 'tag2', 'cyberpunk']);
    });

    it('should default to empty array when tags not provided', () => {
      const data = {
        title: 'Test',
        code_value: '--sref 123',
        version: 'SV6' as const,
      };

      const result = srefCodeSchema.parse(data);
      expect(result.tags).toEqual([]);
    });

    it('should reject empty tag strings', () => {
      const data = {
        title: 'Test',
        code_value: '--sref 123',
        version: 'SV6' as const,
        tags: ['valid', '', 'also-valid'],
      };

      expect(() => srefCodeSchema.parse(data)).toThrow();
    });

    it('should reject tags that are too long', () => {
      const data = {
        title: 'Test',
        code_value: '--sref 123',
        version: 'SV6' as const,
        tags: ['a'.repeat(51)], // 51 characters
      };

      expect(() => srefCodeSchema.parse(data)).toThrow();
    });

    it('should accept maximum length tag', () => {
      const data = {
        title: 'Test',
        code_value: '--sref 123',
        version: 'SV6' as const,
        tags: ['a'.repeat(50)], // exactly 50 characters
      };

      const result = srefCodeSchema.parse(data);
      expect(result.tags).toEqual(['a'.repeat(50)]);
    });

    it('should reject more than 20 tags', () => {
      const data = {
        title: 'Test',
        code_value: '--sref 123',
        version: 'SV6' as const,
        tags: Array.from({ length: 21 }, (_: unknown, i: number) => `tag${i}`),
      };

      expect(() => srefCodeSchema.parse(data)).toThrow('Maximum 20 tags allowed');
    });

    it('should accept exactly 20 tags', () => {
      const data = {
        title: 'Test',
        code_value: '--sref 123',
        version: 'SV6' as const,
        tags: Array.from({ length: 20 }, (_: unknown, i: number) => `tag${i}`),
      };

      const result = srefCodeSchema.parse(data);
      expect(result.tags).toHaveLength(20);
    });
  });

  describe('images validation', () => {
    it('should accept valid image URLs', () => {
      const data = {
        title: 'Test',
        code_value: '--sref 123',
        version: 'SV6' as const,
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.png',
          'http://example.com/image3.gif',
        ],
      };

      const result = srefCodeSchema.parse(data);
      expect(result.images).toEqual(data.images);
    });

    it('should default to empty array when images not provided', () => {
      const data = {
        title: 'Test',
        code_value: '--sref 123',
        version: 'SV6' as const,
      };

      const result = srefCodeSchema.parse(data);
      expect(result.images).toEqual([]);
    });

    it('should reject invalid URLs', () => {
      const data = {
        title: 'Test',
        code_value: '--sref 123',
        version: 'SV6' as const,
        images: ['not-a-url', 'also-invalid'],
      };

      expect(() => srefCodeSchema.parse(data)).toThrow('Invalid image URL');
    });

    it('should reject more than 6 images', () => {
      const data = {
        title: 'Test',
        code_value: '--sref 123',
        version: 'SV6' as const,
        images: Array.from(
          { length: 7 },
          (_: unknown, i: number) => `https://example.com/image${i}.jpg`
        ),
      };

      expect(() => srefCodeSchema.parse(data)).toThrow('Maximum 6 images allowed');
    });

    it('should accept exactly 6 images', () => {
      const data = {
        title: 'Test',
        code_value: '--sref 123',
        version: 'SV6' as const,
        images: Array.from(
          { length: 6 },
          (_: unknown, i: number) => `https://example.com/image${i}.jpg`
        ),
      };

      const result = srefCodeSchema.parse(data);
      expect(result.images).toHaveLength(6);
    });
  });
});

describe('srefSubmissionSchema', () => {
  it('should extend srefCodeSchema with user_id and sv_version', () => {
    const data = {
      title: 'Test SREF',
      code_value: '--sref 1234567890',
      version: 'SV6' as const,
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      sv_version: 6,
    };

    const result = srefSubmissionSchema.parse(data);
    expect(result.user_id).toBe(data.user_id);
    expect(result.sv_version).toBe(6);
  });

  it('should reject invalid UUID for user_id', () => {
    const data = {
      title: 'Test SREF',
      code_value: '--sref 1234567890',
      version: 'SV6' as const,
      user_id: 'invalid-uuid',
      sv_version: 6,
    };

    expect(() => srefSubmissionSchema.parse(data)).toThrow('Invalid user ID');
  });

  it('should reject invalid sv_version values', () => {
    const invalidVersions = [3, 7, 4.5, -1, 0];

    invalidVersions.forEach(sv_version => {
      const data = {
        title: 'Test SREF',
        code_value: '--sref 1234567890',
        version: 'SV6' as const,
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        sv_version,
      };

      expect(() => srefSubmissionSchema.parse(data)).toThrow();
    });
  });

  it('should accept valid sv_version values', () => {
    [4, 5, 6].forEach(sv_version => {
      const data = {
        title: 'Test SREF',
        code_value: '--sref 1234567890',
        version: 'SV6' as const,
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        sv_version,
      };

      const result = srefSubmissionSchema.parse(data);
      expect(result.sv_version).toBe(sv_version);
    });
  });
});

describe('srefUpdateSchema', () => {
  it('should allow partial updates', () => {
    const data = {
      title: 'Updated Title',
    };

    const result = srefUpdateSchema.parse(data);
    expect(result.title).toBe('Updated Title');
    expect(result.code_value).toBeUndefined();
    expect(result.version).toBeUndefined();
  });

  it('should allow updating just the code_value', () => {
    const data = {
      code_value: '--sref 9876543210',
    };

    const result = srefUpdateSchema.parse(data);
    expect(result.code_value).toBe('--sref 9876543210');
  });

  it('should allow updating tags only', () => {
    const data = {
      tags: ['new-tag', 'updated'],
    };

    const result = srefUpdateSchema.parse(data);
    expect(result.tags).toEqual(['new-tag', 'updated']);
  });

  it('should make user_id optional', () => {
    const data = {
      title: 'Updated',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = srefUpdateSchema.parse(data);
    expect(result.user_id).toBe(data.user_id);
  });

  it('should allow empty update object', () => {
    const data = {};

    const result = srefUpdateSchema.parse(data);
    // The update schema should not modify empty objects
    expect(result).toEqual({});
  });

  it('should still validate fields when provided', () => {
    const data = {
      title: '', // Invalid empty title
    };

    expect(() => srefUpdateSchema.parse(data)).toThrow('Title is required');
  });
});

describe('Edge cases and error handling', () => {
  it('should handle whitespace-only title', () => {
    const data = {
      title: '   ',
      code_value: '--sref 123',
      version: 'SV6' as const,
    };

    // Whitespace-only strings pass min(1) check then get trimmed to empty
    const result = srefCodeSchema.parse(data);
    expect(result.title).toBe(''); // Trimmed to empty string
  });

  it('should handle special characters in title', () => {
    const data = {
      title: 'Comic 🎨 Style & Effects (90s)',
      code_value: '--sref 123',
      version: 'SV6' as const,
    };

    const result = srefCodeSchema.parse(data);
    expect(result.title).toBe('Comic 🎨 Style & Effects (90s)');
  });

  it('should handle very long SREF codes', () => {
    const data = {
      title: 'Test',
      code_value: `--sref ${'1'.repeat(100)}`,
      version: 'SV6' as const,
    };

    const result = srefCodeSchema.parse(data);
    expect(result.code_value).toBe(`--sref ${'1'.repeat(100)}`);
  });

  it('should handle SREF codes with extra whitespace', () => {
    const data = {
      title: 'Test',
      code_value: '  --sref   123456   ',
      version: 'SV6' as const,
    };

    const result = srefCodeSchema.parse(data);
    expect(result.code_value).toBe('  --sref   123456   ');
  });

  it('should handle duplicate tags', () => {
    const data = {
      title: 'Test',
      code_value: '--sref 123',
      version: 'SV6' as const,
      tags: ['cyberpunk', 'neon', 'cyberpunk', 'futuristic', 'neon'],
    };

    const result = srefCodeSchema.parse(data);
    // Schema doesn't deduplicate - it accepts duplicates
    expect(result.tags).toEqual(['cyberpunk', 'neon', 'cyberpunk', 'futuristic', 'neon']);
  });

  it('should handle mixed case versions', () => {
    const invalidVersions = ['sv4', 'sv6', 'Sv4', 'Sv6'];

    invalidVersions.forEach(version => {
      const data = {
        title: 'Test',
        code_value: '--sref 123',
        version: version as 'SV4' | 'SV6',
      };

      expect(() => srefCodeSchema.parse(data)).toThrow();
    });
  });

  it('should handle null and undefined values', () => {
    const invalidData = [
      { title: null, code_value: '--sref 123', version: 'SV6' },
      { title: 'Test', code_value: null, version: 'SV6' },
      { title: 'Test', code_value: '--sref 123', version: null },
      { title: undefined, code_value: '--sref 123', version: 'SV6' },
    ];

    invalidData.forEach(data => {
      expect(() => srefCodeSchema.parse(data)).toThrow();
    });
  });

  it('should handle non-string image URLs', () => {
    const data = {
      title: 'Test',
      code_value: '--sref 123',
      version: 'SV6' as const,
      images: [123, null, undefined] as unknown as string[],
    };

    expect(() => srefCodeSchema.parse(data)).toThrow();
  });

  it('should handle extremely long tags', () => {
    const data = {
      title: 'Test',
      code_value: '--sref 123',
      version: 'SV6' as const,
      tags: ['a'.repeat(51)], // Over 50 character limit
    };

    expect(() => srefCodeSchema.parse(data)).toThrow();
  });
});

describe('Complex validation scenarios', () => {
  it('should validate complete SREF submission with all fields', () => {
    const data: SREFSubmissionData = {
      title: 'Cyberpunk City Scene',
      code_value: '--sref 1234567890123',
      version: 'SV6',
      tags: ['cyberpunk', 'neon', 'futuristic', 'cityscape'],
      images: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.png',
        'https://cdn.example.com/gallery/image3.gif',
      ],
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      sv_version: 6,
    };

    const result = srefSubmissionSchema.parse(data);
    expect(result).toEqual(data);
  });

  it('should validate partial update with only changed fields', () => {
    const data = {
      title: 'Updated Cyberpunk Scene',
      tags: ['cyberpunk', 'updated', 'modern'],
    };

    const result = srefUpdateSchema.parse(data);
    expect(result.title).toBe('Updated Cyberpunk Scene');
    expect(result.tags).toEqual(['cyberpunk', 'updated', 'modern']);
    expect(result.code_value).toBeUndefined();
  });

  it('should handle maximum allowed values', () => {
    const data = {
      title: 'a'.repeat(100), // Max length
      code_value: `--sref ${'9'.repeat(50)}`, // Very long code
      version: 'SV6' as const,
      tags: Array.from(
        { length: 20 },
        (_: unknown, i: number) => `tag${i.toString().padStart(2, '0')}`
      ), // Max 20 tags
      images: Array.from(
        { length: 6 },
        (_: unknown, i: number) => `https://example.com/image${i}.jpg`
      ), // Max 6 images
    };

    const result = srefCodeSchema.parse(data);
    expect(result.title).toHaveLength(100);
    expect(result.tags).toHaveLength(20);
    expect(result.images).toHaveLength(6);
  });
});

describe('TypeScript type inference', () => {
  it('should infer correct types', () => {
    // This test ensures TypeScript types are working correctly
    const formData: SREFFormData = {
      title: 'Test',
      code_value: '--sref 123',
      version: 'SV6',
      tags: ['test'],
      images: ['https://example.com/image.jpg'],
    };

    const submissionData: SREFSubmissionData = {
      ...formData,
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      sv_version: 6,
    };

    const updateData: SREFUpdateData = {
      title: 'Updated title',
    };

    // If these compile without errors, the types are correct
    expect(formData.title).toBe('Test');
    expect(submissionData.user_id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(updateData.title).toBe('Updated title');
  });
});
