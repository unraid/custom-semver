import { compare as semverCompare, parse, valid as semverValid } from "semver";

// Magic string constant for patch build tags
const PATCH_IDENTIFIER = "patch";

/**
 * Custom semver comparison that handles build tags in a special way.
 *
 * Normal semver comparison is performed first. If versions are equal, then build tags are compared.
 * If at least one version has a build tag containing "patch", custom comparison is used:
 * - Build tags are normalized by adding zeros until they have at least 3 parts (like 1.0.0) for proper comparison.
 * - A version with a patch build tag is considered greater than a version without a build tag.
 *
 * If neither version has a build tag containing "patch", standard semver comparison is used.
 *
 * Example:
 * - 7.0.0+patch.1 vs 7.0.0+patch.10
 *   First, normal semver comparison: 7.0.0 = 7.0.0
 *   Then, build tag comparison: patch.1.0.0 < patch.10.0.0
 *
 * - 7.0.0 vs 7.0.0+patch.1
 *   First, normal semver comparison: 7.0.0 = 7.0.0
 *   Then, since one has a build tag containing "patch" and the other doesn't, 7.0.0 < 7.0.0+patch.1
 *
 * - 7.0.0 vs 7.0.0+build.1
 *   First, normal semver comparison: 7.0.0 = 7.0.0
 *   Then, since neither has a build tag containing "patch", standard semver comparison is used
 *
 * @param version1 First version to compare
 * @param version2 Second version to compare
 * @returns -1 if version1 < version2, 0 if version1 = version2, 1 if version1 > version2
 */
export function customSemverCompare(
  version1: string,
  version2: string
): number {
  // First, do a normal semver comparison
  const normalCompare = semverCompare(version1, version2);

  // If versions are not equal by normal semver rules, return the result
  if (normalCompare !== 0) {
    return normalCompare;
  }

  // Parse the versions to extract build tags
  const parsed1 = parse(version1);
  const parsed2 = parse(version2);

  // If either parse result is null, use normal semver rules
  if (parsed1 === null || parsed2 === null) {
    return normalCompare;
  }

  // Extract the build tags
  const buildTag1 = parsed1.build.length ? parsed1.build.join(".") : "";
  const buildTag2 = parsed2.build.length ? parsed2.build.join(".") : "";

  // Check if either build tag contains "patch"
  const hasPatch1 = buildTag1.includes(PATCH_IDENTIFIER);
  const hasPatch2 = buildTag2.includes(PATCH_IDENTIFIER);

  // If neither has a patch build tag, use standard semver comparison
  if (!hasPatch1 && !hasPatch2) {
    return normalCompare;
  }

  // If one has a patch build tag and the other doesn't have a build tag, the one with patch is greater
  if (hasPatch1 && !parsed2.build.length) {
    return 1; // version1 is greater
  }
  if (!parsed1.build.length && hasPatch2) {
    return -1; // version2 is greater
  }

  // If both have build tags but they're identical, they're equal
  if (buildTag1 === buildTag2) {
    return 0;
  }

  // Check if both build tags start with "patch."
  const patchRegex = new RegExp(`^${PATCH_IDENTIFIER}\\.(\\d+(?:\\.\\d+)*)$`);
  const matchesA = patchRegex.exec(buildTag1);
  const matchesB = patchRegex.exec(buildTag2);

  // If both have the patch. prefix, compare them specially
  if (matchesA && matchesB) {
    // Extract the version numbers after "patch."
    const patchVersionA = matchesA[1] || "";
    const patchVersionB = matchesB[1] || "";

    // Normalize version numbers by adding trailing zeros if needed
    // Count the number of parts in each version
    const partsA = patchVersionA.split(".");
    const partsB = patchVersionB.split(".");

    // Normalize to 3 parts (like 1.0.0) for proper comparison
    while (partsA.length < 3) {
      partsA.push("0");
    }
    while (partsB.length < 3) {
      partsB.push("0");
    }

    const normalizedA = partsA.join(".");
    const normalizedB = partsB.join(".");

    // Use semver compare for proper semantic versioning comparison
    return semverCompare(normalizedA, normalizedB);
  }

  // If only one has the patch. prefix, prioritize it
  if (matchesA && !matchesB) {
    return 1; // version1 is greater
  }
  if (!matchesA && matchesB) {
    return -1; // version2 is greater
  }

  // For other build tags, use string comparison
  return buildTag1.localeCompare(buildTag2);
}

/**
 * Checks if version1 is greater than version2 using custom semver comparison.
 *
 * @param version1 First version to compare
 * @param version2 Second version to compare
 * @returns true if version1 > version2, false otherwise
 */
export function gt(version1: string, version2: string): boolean {
  return customSemverCompare(version1, version2) > 0;
}

/**
 * Checks if version1 is less than version2 using custom semver comparison.
 *
 * @param version1 First version to compare
 * @param version2 Second version to compare
 * @returns true if version1 < version2, false otherwise
 */
export function lt(version1: string, version2: string): boolean {
  return customSemverCompare(version1, version2) < 0;
}

/**
 * Checks if version1 is equal to version2 using custom semver comparison.
 *
 * @param version1 First version to compare
 * @param version2 Second version to compare
 * @returns true if version1 = version2, false otherwise
 */
export function eq(version1: string, version2: string): boolean {
  return customSemverCompare(version1, version2) === 0;
}

/**
 * Checks if version1 is greater than or equal to version2 using custom semver comparison.
 *
 * @param version1 First version to compare
 * @param version2 Second version to compare
 * @returns true if version1 >= version2, false otherwise
 */
export function gte(version1: string, version2: string): boolean {
  return customSemverCompare(version1, version2) >= 0;
}

/**
 * Checks if version1 is less than or equal to version2 using custom semver comparison.
 *
 * @param version1 First version to compare
 * @param version2 Second version to compare
 * @returns true if version1 <= version2, false otherwise
 */
export function lte(version1: string, version2: string): boolean {
  return customSemverCompare(version1, version2) <= 0;
}

/**
 * Checks if a version string is a valid semver version.
 *
 * @param version Version string to check
 * @returns true if the version is valid, false otherwise
 */
export function valid(version: string): string | null {
  return semverValid(version);
}
