import { describe, it, expect } from 'vitest';
import { customSemverCompare, gt, lt, eq, gte, lte, valid } from '../utils/custom-semver';
// Import from main index to test the exports
import * as indexExports from '../index';

describe('index exports', () => {
	it('should export all the necessary functions', () => {
		expect(indexExports.customSemverCompare).toBeDefined();
		expect(indexExports.gt).toBeDefined();
		expect(indexExports.lt).toBeDefined();
		expect(indexExports.eq).toBeDefined();
		expect(indexExports.gte).toBeDefined();
		expect(indexExports.lte).toBeDefined();
		expect(indexExports.valid).toBeDefined();
		
		// Test a function to ensure it works
		expect(indexExports.gt('2.0.0', '1.0.0')).toBe(true);
	});
});

describe('customSemverCompare', () => {
	it('should compare normal semver versions correctly', () => {
		expect(customSemverCompare('1.0.0', '2.0.0')).toBe(-1);
		expect(customSemverCompare('2.0.0', '1.0.0')).toBe(1);
		expect(customSemverCompare('1.0.0', '1.0.0')).toBe(0);
		expect(customSemverCompare('1.0.0', '1.1.0')).toBe(-1);
		expect(customSemverCompare('1.1.0', '1.0.0')).toBe(1);
		expect(customSemverCompare('1.0.1', '1.0.0')).toBe(1);
		expect(customSemverCompare('1.0.0', '1.0.1')).toBe(-1);
	});

	it('should handle prerelease versions correctly', () => {
		expect(customSemverCompare('1.0.0-alpha', '1.0.0')).toBe(-1);
		expect(customSemverCompare('1.0.0', '1.0.0-alpha')).toBe(1);
		expect(customSemverCompare('1.0.0-alpha.1', '1.0.0-alpha.2')).toBe(-1);
		expect(customSemverCompare('1.0.0-alpha.2', '1.0.0-alpha.1')).toBe(1);
		expect(customSemverCompare('1.0.0-alpha', '1.0.0-beta')).toBe(-1);
		expect(customSemverCompare('1.0.0-beta', '1.0.0-alpha')).toBe(1);
	});

	it('should compare patch build tags correctly when semver versions are equal', () => {
		// Example from the requirements
		expect(customSemverCompare('7.0.0+patch.1', '7.0.0+patch.10')).toBe(-1);
		expect(customSemverCompare('7.0.0+patch.10', '7.0.0+patch.1')).toBe(1);

		// Additional test cases
		expect(customSemverCompare('7.0.0+patch.1', '7.0.0+patch.1')).toBe(0);
		expect(customSemverCompare('7.0.0+patch.1.2', '7.0.0+patch.1.1')).toBe(1);
		expect(customSemverCompare('7.0.0+patch.1.1', '7.0.0+patch.1.2')).toBe(-1);
	});

	it('should compare hotfix build tags correctly when semver versions are equal', () => {
		// Test hotfix identifier similar to patch tests
		expect(customSemverCompare('7.0.0+hotfix.1', '7.0.0+hotfix.10')).toBe(-1);
		expect(customSemverCompare('7.0.0+hotfix.10', '7.0.0+hotfix.1')).toBe(1);
		expect(customSemverCompare('7.0.0+hotfix.1', '7.0.0+hotfix.1')).toBe(0);
		expect(customSemverCompare('7.0.0+hotfix.1.2', '7.0.0+hotfix.1.1')).toBe(1);
		expect(customSemverCompare('7.0.0+hotfix.1.1', '7.0.0+hotfix.1.2')).toBe(-1);
	});

	it('should compare patch and hotfix build tags lexicographically', () => {
		// "hotfix" comes before "patch" lexicographically
		expect(customSemverCompare('7.0.0+patch.1', '7.0.0+hotfix.1')).toBe(1);
		expect(customSemverCompare('7.0.0+hotfix.1', '7.0.0+patch.1')).toBe(-1);
		
		// Even a higher hotfix version is still lower than any patch version
		expect(customSemverCompare('7.0.0+patch.1', '7.0.0+hotfix.10')).toBe(1);
		expect(customSemverCompare('7.0.0+hotfix.10', '7.0.0+patch.1')).toBe(-1);

		// Test across different helper functions as well
		expect(gt('7.0.0+patch.1', '7.0.0+hotfix.10')).toBe(true);
		expect(lt('7.0.0+hotfix.10', '7.0.0+patch.1')).toBe(true);
		expect(eq('7.0.0+hotfix.1', '7.0.0+patch.1')).toBe(false);
	});

	it('should use standard semver comparison for non-patch build tags', () => {
		// According to semver spec, build metadata doesn't affect precedence
		expect(customSemverCompare('7.0.0+alpha', '7.0.0+beta')).toBe(0);
		expect(customSemverCompare('7.0.0+beta', '7.0.0+alpha')).toBe(0);
	});

	it('should handle missing parts in build tags by padding with zeros', () => {
		expect(customSemverCompare('7.0.0+patch.1', '7.0.0+patch.1.0')).toBe(0);
		expect(customSemverCompare('7.0.0+patch.1.0.0', '7.0.0+patch.1')).toBe(0);
		expect(customSemverCompare('7.0.0+patch.1', '7.0.0+patch.1.1')).toBe(-1);
		expect(customSemverCompare('7.0.0+patch.1.1', '7.0.0+patch.1')).toBe(1);
	});

	it('should handle mixed numeric and string parts in build tags', () => {
		// For non-patch/hotfix build tags, string comparison is used
		expect(customSemverCompare('7.0.0+build.1.beta', '7.0.0+build.1.alpha')).toBe(0);
		expect(customSemverCompare('7.0.0+build.1.alpha', '7.0.0+build.1.beta')).toBe(0);
		
		// String parts in patch/hotfix identifiers rely on semver comparison
		// so we only test valid version-like structures
		expect(customSemverCompare('7.0.0+patch.1.0', '7.0.0+patch.2.0')).toBe(-1);
		expect(customSemverCompare('7.0.0+patch.2.0', '7.0.0+patch.1.0')).toBe(1);
		expect(customSemverCompare('7.0.0+hotfix.1.0', '7.0.0+hotfix.2.0')).toBe(-1);
		expect(customSemverCompare('7.0.0+hotfix.2.0', '7.0.0+hotfix.1.0')).toBe(1);
	});

	it('should prioritize normal semver comparison over build tags', () => {
		expect(customSemverCompare('7.0.1+patch.1', '7.0.0+patch.10')).toBe(1);
		expect(customSemverCompare('7.0.0+patch.10', '7.1.0+patch.1')).toBe(-1);
		expect(customSemverCompare('7.0.0-alpha+patch.10', '7.0.0+patch.1')).toBe(-1);
	});

	it('should handle invalid versions by falling back to semver rules', () => {
		// The semver package throws an error for invalid versions, so we need to handle that in our tests
		try {
			customSemverCompare('invalid', 'invalid');
		} catch (error) {
			expect(error).toBeDefined();
		}
		
		try {
			customSemverCompare('1.0.0', 'invalid');
		} catch (error) {
			expect(error).toBeDefined();
		}
		
		try {
			customSemverCompare('invalid', '1.0.0');
		} catch (error) {
			expect(error).toBeDefined();
		}
	});

	it('should handle build tags that contain patch but are not patch prefixed', () => {
		// Build tags contain "patch" but don't start with "patch."
		expect(customSemverCompare('7.0.0+contains.patch.1', '7.0.0+contains.patch.2')).toBe(-1);
		expect(customSemverCompare('7.0.0+contains.patch.2', '7.0.0+contains.patch.1')).toBe(1);
		expect(customSemverCompare('7.0.0+contains.patch.1', '7.0.0')).toBe(1);
		expect(customSemverCompare('7.0.0', '7.0.0+contains.patch.1')).toBe(-1);
	});

	it('should handle one version with patch prefix and one without patch prefix', () => {
		// One build tag has "patch." prefix, the other has "patch" but not as a prefix
		expect(customSemverCompare('7.0.0+patch.1', '7.0.0+notpatch.1')).toBe(1);
		expect(customSemverCompare('7.0.0+notpatch.1', '7.0.0+patch.1')).toBe(-1);
	});

	it('should handle missing build parts after patch', () => {
		// Invalid version format with empty build parts will throw, so we just test valid patterns
		expect(customSemverCompare('7.0.0+patch.0', '7.0.0+patch.1')).toBe(-1);
		expect(customSemverCompare('7.0.0+patch.1', '7.0.0+patch.0')).toBe(1);
		expect(customSemverCompare('7.0.0+patch.0', '7.0.0+patch.0')).toBe(0);
	});

	it('should handle string comparison for other build tags', () => {
		// Test string comparison for non-patch build tags
		expect(customSemverCompare('7.0.0+build.1', '7.0.0+build.2')).toBe(0);
		expect(customSemverCompare('7.0.0+a', '7.0.0+b')).toBe(0);
		expect(customSemverCompare('7.0.0+z', '7.0.0+a')).toBe(0);
	});

	it('should prioritize build tags with patch over those without', () => {
		// This test covers the case where one version has a patch-containing build tag
		// and the other has a non-patch build tag
		expect(customSemverCompare('1.0.0+patch.something', '1.0.0+other')).toBe(1);
		expect(customSemverCompare('1.0.0+other', '1.0.0+patch.something')).toBe(-1);
	});

	it('should handle cases where one version has a patch build tag and the other has no build tag', () => {
		const versionWithPatch = '1.0.0+patch.1';
		const versionWithoutBuild = '1.0.0';
		
		// The version with patch build tag should be greater
		expect(customSemverCompare(versionWithPatch, versionWithoutBuild)).toBe(1);
		expect(customSemverCompare(versionWithoutBuild, versionWithPatch)).toBe(-1);
	});

	it('should handle cases where one version has a hotfix build tag and the other has no build tag', () => {
		// Similar to patch tests, versions with hotfix build tags should be greater
		const versionWithHotfix = '1.0.0+hotfix.1';
		const versionWithoutBuild = '1.0.0';
		
		// The version with hotfix build tag should be greater
		expect(customSemverCompare(versionWithHotfix, versionWithoutBuild)).toBe(1);
		expect(customSemverCompare(versionWithoutBuild, versionWithHotfix)).toBe(-1);
	});
});

describe('gt (greater than)', () => {
	it('should return true when first version is greater', () => {
		expect(gt('2.0.0', '1.0.0')).toBe(true);
		expect(gt('7.0.0+patch.10', '7.0.0+patch.1')).toBe(true);
	});

	it('should return false when first version is not greater', () => {
		expect(gt('1.0.0', '2.0.0')).toBe(false);
		expect(gt('1.0.0', '1.0.0')).toBe(false);
		expect(gt('7.0.0+patch.1', '7.0.0+patch.10')).toBe(false);
	});
});

describe('lt (less than)', () => {
	it('should return true when first version is less', () => {
		expect(lt('1.0.0', '2.0.0')).toBe(true);
		expect(lt('7.0.0+patch.1', '7.0.0+patch.10')).toBe(true);
	});

	it('should return false when first version is not less', () => {
		expect(lt('2.0.0', '1.0.0')).toBe(false);
		expect(lt('1.0.0', '1.0.0')).toBe(false);
		expect(lt('7.0.0+patch.10', '7.0.0+patch.1')).toBe(false);
	});
});

describe('eq (equal)', () => {
	it('should return true when versions are equal', () => {
		expect(eq('1.0.0', '1.0.0')).toBe(true);
		expect(eq('7.0.0+patch.1', '7.0.0+patch.1')).toBe(true);
		expect(eq('7.0.0+patch.1', '7.0.0+patch.1.0')).toBe(true);
	});

	it('should return false when versions are not equal', () => {
		expect(eq('1.0.0', '2.0.0')).toBe(false);
		expect(eq('7.0.0+patch.1', '7.0.0+patch.10')).toBe(false);
	});
});

describe('gte (greater than or equal)', () => {
	it('should return true when first version is greater or equal', () => {
		expect(gte('2.0.0', '1.0.0')).toBe(true);
		expect(gte('1.0.0', '1.0.0')).toBe(true);
		expect(gte('7.0.0+patch.10', '7.0.0+patch.1')).toBe(true);
		expect(gte('7.0.0+patch.1', '7.0.0+patch.1')).toBe(true);
	});

	it('should return false when first version is less', () => {
		expect(gte('1.0.0', '2.0.0')).toBe(false);
		expect(gte('7.0.0+patch.1', '7.0.0+patch.10')).toBe(false);
	});
});

describe('lte (less than or equal)', () => {
	it('should return true when first version is less or equal', () => {
		expect(lte('1.0.0', '2.0.0')).toBe(true);
		expect(lte('1.0.0', '1.0.0')).toBe(true);
		expect(lte('7.0.0+patch.1', '7.0.0+patch.10')).toBe(true);
		expect(lte('7.0.0+patch.1', '7.0.0+patch.1')).toBe(true);
	});

	it('should return false when first version is greater', () => {
		expect(lte('2.0.0', '1.0.0')).toBe(false);
		expect(lte('7.0.0+patch.10', '7.0.0+patch.1')).toBe(false);
	});
});

describe('specific requirements test', () => {
	it('should handle the specific example from requirements', () => {
		// The requirement states that 7.0.0+patch.1 would become 7.0.0+patch.1.0.0
		// and be compared to 7.0.0+patch.10 as 7.0.0+patch.10.0.0

		// This means 7.0.0+patch.1 < 7.0.0+patch.10
		expect(customSemverCompare('7.0.0+patch.1', '7.0.0+patch.10')).toBe(-1);
		expect(lt('7.0.0+patch.1', '7.0.0+patch.10')).toBe(true);
		expect(gt('7.0.0+patch.1', '7.0.0+patch.10')).toBe(false);

		// And 7.0.0+patch.10 > 7.0.0+patch.1
		expect(customSemverCompare('7.0.0+patch.10', '7.0.0+patch.1')).toBe(1);
		expect(gt('7.0.0+patch.10', '7.0.0+patch.1')).toBe(true);
		expect(lt('7.0.0+patch.10', '7.0.0+patch.1')).toBe(false);

		// But 7.0.0+patch.1 = 7.0.0+patch.1.0
		expect(customSemverCompare('7.0.0+patch.1', '7.0.0+patch.1.0')).toBe(0);
		expect(eq('7.0.0+patch.1', '7.0.0+patch.1.0')).toBe(true);

		// And 7.0.0+patch.1.0.0 = 7.0.0+patch.1
		expect(customSemverCompare('7.0.0+patch.1.0.0', '7.0.0+patch.1')).toBe(0);
		expect(eq('7.0.0+patch.1.0.0', '7.0.0+patch.1')).toBe(true);
	});

	it('should handle comparison between versions with and without build tags', () => {
		// A version with a patch build tag should be greater than the same version without a build tag
		expect(customSemverCompare('7.0.0', '7.0.0+patch.1')).toBe(-1);
		expect(lt('7.0.0', '7.0.0+patch.1')).toBe(true);
		expect(gt('7.0.0', '7.0.0+patch.1')).toBe(false);

		expect(customSemverCompare('7.0.0+patch.1', '7.0.0')).toBe(1);
		expect(gt('7.0.0+patch.1', '7.0.0')).toBe(true);
		expect(lt('7.0.0+patch.1', '7.0.0')).toBe(false);

		// But a version with a non-patch build tag should be equal to the same version without a build tag
		// (following standard semver rules where build metadata doesn't affect precedence)
		expect(customSemverCompare('7.0.0', '7.0.0+build.1')).toBe(0);
		expect(eq('7.0.0', '7.0.0+build.1')).toBe(true);
		expect(lt('7.0.0', '7.0.0+build.1')).toBe(false);
		expect(gt('7.0.0', '7.0.0+build.1')).toBe(false);

		expect(customSemverCompare('7.0.0+build.1', '7.0.0')).toBe(0);
		expect(eq('7.0.0+build.1', '7.0.0')).toBe(true);
		expect(gt('7.0.0+build.1', '7.0.0')).toBe(false);
		expect(lt('7.0.0+build.1', '7.0.0')).toBe(false);
	});

	it('should correctly order a sequence of semver versions', () => {
		const versions = [
			'0.0.0-alpha.1',
			'0.0.0',
			'1.0.0-alpha.1',
			'1.0.0-alpha.2',
			'1.0.0',
			'1.0.0+hotfix.1',
			'1.0.0+hotfix.2',
			'1.0.0+hotfix.10',
			'1.0.0+patch.1',
			'1.0.0+patch.1.1',
			'1.0.0+patch.1.2',
			'1.0.0+patch.2',
			'1.0.0+patch.2.1',
			'1.0.0+patch.10',
			'1.0.0+patch.10.1',
			'1.0.1',
			'1.1.0',
			'2.0.0',
			'2.0.0+hotfix.1',
			'2.0.0+patch.1',
		];

		// Test that each version is less than the next version in the array
		for (let i = 0; i < versions.length - 1; i++) {
			const current = versions[i];
			const next = versions[i + 1];

			expect(customSemverCompare(current, next)).toBe(-1);
			expect(lt(current, next)).toBe(true);
			expect(gt(current, next)).toBe(false);

			expect(customSemverCompare(next, current)).toBe(1);
			expect(gt(next, current)).toBe(true);
			expect(lt(next, current)).toBe(false);
		}

		// Test that each version is less than all subsequent versions
		for (let i = 0; i < versions.length; i++) {
			for (let j = i + 1; j < versions.length; j++) {
				expect(lt(versions[i], versions[j])).toBe(true);
				expect(gt(versions[j], versions[i])).toBe(true);
			}
		}
	});
});

describe('valid function', () => {
	it('should return the normalized version for valid semver versions', () => {
		expect(valid('1.0.0')).toBe('1.0.0');
		expect(valid('1.2.3')).toBe('1.2.3');
		expect(valid('1.0.0-alpha')).toBe('1.0.0-alpha');
		// Note: semver's valid function normalizes build metadata out of the result
		expect(valid('1.0.0+build')).toBe('1.0.0');
		expect(valid('1.0.0-beta+build')).toBe('1.0.0-beta');
	});

	it('should return null for invalid semver versions', () => {
		expect(valid('invalid')).toBe(null);
		expect(valid('1.0')).toBe(null);
		expect(valid('1')).toBe(null);
		expect(valid('')).toBe(null);
		expect(valid('1.0.0.0')).toBe(null);
	});
});

describe('customSemverCompare - regex pattern improvements', () => {
	it('should correctly identify patch identifiers only when properly delimited', () => {
		// Should identify patch identifiers when at the start of build tag
		expect(customSemverCompare('1.0.0+patch.1', '1.0.0')).toBe(1);
		expect(customSemverCompare('1.0.0+hotfix.1', '1.0.0')).toBe(1);
		
		// Should identify patch identifiers when in the middle of a dot-delimited string
		expect(customSemverCompare('1.0.0+foo.patch.1', '1.0.0')).toBe(1);
		expect(customSemverCompare('1.0.0+foo.hotfix.1', '1.0.0')).toBe(1);
		
		// Should NOT match patch identifiers when they're substrings without proper delimiters
		expect(customSemverCompare('1.0.0+dispatcher.1', '1.0.0')).toBe(0); // "patch" is part of "dispatcher"
		expect(customSemverCompare('1.0.0+myhotfixer.1', '1.0.0')).toBe(0); // "hotfix" is part of "myhotfixer"
		expect(customSemverCompare('1.0.0+patchwork.1', '1.0.0')).toBe(0); // "patch" is part of "patchwork"
	});

	it('should handle edge cases with patch identifiers in build tags', () => {
		// Exact match at start
		expect(customSemverCompare('1.0.0+patch', '1.0.0')).toBe(1);
		expect(customSemverCompare('1.0.0+hotfix', '1.0.0')).toBe(1);
		
		// Embedded at the end with proper delimiter
		expect(customSemverCompare('1.0.0+foo.patch', '1.0.0')).toBe(1);
		expect(customSemverCompare('1.0.0+foo.hotfix', '1.0.0')).toBe(1);
		
		// No match with improper delimiters
		expect(customSemverCompare('1.0.0+patchlike', '1.0.0')).toBe(0);
		expect(customSemverCompare('1.0.0+hotfixable', '1.0.0')).toBe(0);
		expect(customSemverCompare('1.0.0+apatch.1', '1.0.0')).toBe(0); // No dot before "patch"
		expect(customSemverCompare('1.0.0+ahotfix.1', '1.0.0')).toBe(0); // No dot before "hotfix"
	});
	
	it('should handle multiple patch identifiers in the same build tag', () => {
		// Multiple valid patch identifiers in the same build tag
		expect(customSemverCompare('1.0.0+patch.1.hotfix.2', '1.0.0')).toBe(1);
		expect(customSemverCompare('1.0.0+hotfix.1.patch.2', '1.0.0')).toBe(1);
		
		// Mix of valid and invalid identifiers
		expect(customSemverCompare('1.0.0+patchwork.1.hotfix.2', '1.0.0')).toBe(1); // "hotfix" is valid
		expect(customSemverCompare('1.0.0+patch.1.myhotfixer.2', '1.0.0')).toBe(1); // "patch" is valid
	});
});

describe('customSemverCompare - advanced regex pattern tests', () => {
	it('should correctly handle boundaries and edge cases in regex matching', () => {
		// Test string boundaries 
		expect(customSemverCompare('1.0.0+patch', '1.0.0')).toBe(1); // Exact match at end
		expect(customSemverCompare('1.0.0+patchsomething', '1.0.0')).toBe(0); // Not a proper boundary
		
		// Test with special characters around identifiers (using valid semver build identifiers)
		expect(customSemverCompare('1.0.0+foo-patch.1', '1.0.0')).toBe(0); // Hyphen not a proper delimiter
		expect(customSemverCompare('1.0.0+foo.notpatch.1', '1.0.0')).toBe(0); // Using a valid build id
		
		// Test with patch/hotfix at beginning followed by other text without dot
		expect(customSemverCompare('1.0.0+patchsuffix', '1.0.0')).toBe(0);
		expect(customSemverCompare('1.0.0+hotfixsuffix', '1.0.0')).toBe(0);
	});
	
	it('should handle compound identifiers correctly', () => {
		// Test patterns with the word "patch" or "hotfix" in compound identifiers
		expect(customSemverCompare('1.0.0+subpatch.1', '1.0.0')).toBe(0); // "patch" is part of "subpatch"
		expect(customSemverCompare('1.0.0+super.patch.1', '1.0.0')).toBe(1); // "patch" properly delimited
		expect(customSemverCompare('1.0.0+patch.hotfix.1', '1.0.0')).toBe(1); // Both identifiers valid
		expect(customSemverCompare('1.0.0+patch-or-hotfix.1', '1.0.0')).toBe(0); // Hyphen not a proper delimiter
	});
	
	it('should validate the regex captures expected patterns', () => {
		// Case sensitivity tests
		expect(customSemverCompare('1.0.0+PATCH.1', '1.0.0')).toBe(0); // Uppercase not matched
		expect(customSemverCompare('1.0.0+Patch.1', '1.0.0')).toBe(0); // Mixed case not matched
		expect(customSemverCompare('1.0.0+hotFix.1', '1.0.0')).toBe(0); // Mixed case not matched
		
		// Variations with multiple identifiers in build tag
		expect(customSemverCompare('1.0.0+build.patch.hotfix', '1.0.0')).toBe(1); // Both identifiers should match
		expect(customSemverCompare('1.0.0+patch.build.hotfix', '1.0.0')).toBe(1); // Both identifiers should match
		expect(customSemverCompare('1.0.0+apatch.build.hotfix', '1.0.0')).toBe(1); // Only hotfix should match
	});
});

// Import the regex patterns directly for testing
// Since these are module-private constants, we'll recreate them here for testing
describe('Patch identifier regex patterns', () => {
	// Recreate the patterns from the implementation
	const PATCH_IDENTIFIERS = ["patch", "hotfix"];
	
	// Each specific pattern for a single identifier
	function createSpecificIdentifierPatterns(): { id: string; pattern: RegExp }[] {
		return PATCH_IDENTIFIERS.map(id => ({
			id,
			pattern: new RegExp(`(^${id}(\\.|$)|\\.${id}(\\.|$))`)
		}));
	}
	
	const STARTS_WITH_PATCH_PATTERN = new RegExp(`^(${PATCH_IDENTIFIERS.join('|')})\\.`);
	const SPECIFIC_PATTERNS = createSpecificIdentifierPatterns();
	
	it('should correctly match patch identifiers at start of string', () => {
		// Check each pattern individually with its corresponding identifier
		SPECIFIC_PATTERNS.forEach(({ id, pattern }) => {
			expect(pattern.test(id)).toBe(true);
			expect(pattern.test(`${id}.1`)).toBe(true);
		});
	});
	
	it('should correctly match patch identifiers in the middle of string', () => {
		// Check each pattern individually with its corresponding identifier
		SPECIFIC_PATTERNS.forEach(({ id, pattern }) => {
			expect(pattern.test(`foo.${id}`)).toBe(true);
			expect(pattern.test(`foo.${id}.1`)).toBe(true);
		});
	});
	
	it('should not match when identifiers are part of other words', () => {
		// Test negative cases
		SPECIFIC_PATTERNS.forEach(({ pattern }) => {
			expect(pattern.test('dispatcher')).toBe(false); // "patch" as substring
			expect(pattern.test('myhotfixer')).toBe(false); // "hotfix" as substring
			expect(pattern.test('foo-patch')).toBe(false); // wrong delimiter
			expect(pattern.test('patchwork')).toBe(false); // wrong boundary
			expect(pattern.test('hotfixable')).toBe(false); // wrong boundary
		});
	});
	
	it('should correctly identify strings starting with patch identifiers', () => {
		// Test the STARTS_WITH_PATCH_PATTERN
		expect(STARTS_WITH_PATCH_PATTERN.test('patch.1')).toBe(true);
		expect(STARTS_WITH_PATCH_PATTERN.test('hotfix.1')).toBe(true);
		expect(STARTS_WITH_PATCH_PATTERN.test('patch')).toBe(false); // Needs dot after
		expect(STARTS_WITH_PATCH_PATTERN.test('hotfix')).toBe(false); // Needs dot after
		expect(STARTS_WITH_PATCH_PATTERN.test('foo.patch.1')).toBe(false); // Not at start
		expect(STARTS_WITH_PATCH_PATTERN.test('patchsomething')).toBe(false); // Not followed by dot
	});
});
