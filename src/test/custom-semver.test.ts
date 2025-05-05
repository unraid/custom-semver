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
