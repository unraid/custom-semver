# Custom SemVer

A library for semantic versioning with special handling for patch build tags.

## Installation

```bash
npm install custom-semver
# or
yarn add custom-semver
# or
pnpm add custom-semver
```

### Peer Dependencies

This package has the following peer dependencies:

```json
{
  "semver": "^7.0.0"
}
```

Make sure they are installed in your project.

## Features

This library extends standard semver comparison to handle build tags in a special way:

- Normal semver comparison is performed first. If versions are equal, then build tags are compared.
- If at least one version has a build tag containing "patch", custom comparison is used:
  - Build tags are normalized by adding zeros until they have at least 3 parts (like 1.0.0) for proper comparison.
  - A version with a patch build tag is considered greater than a version without a build tag.
- If neither version has a build tag containing "patch", standard semver comparison is used.

## Usage

```typescript
import { customSemverCompare, gt, lt, eq, gte, lte, valid } from 'custom-semver';

// Compare versions
customSemverCompare('1.0.0', '2.0.0'); // returns -1 (1.0.0 < 2.0.0)
customSemverCompare('7.0.0+patch.1', '7.0.0+patch.10'); // returns -1 (7.0.0+patch.1 < 7.0.0+patch.10)
customSemverCompare('7.0.0+patch.1', '7.0.0+patch.1.0'); // returns 0 (they are equal)

// Check if one version is greater than another
gt('2.0.0', '1.0.0'); // returns true
gt('7.0.0+patch.10', '7.0.0+patch.1'); // returns true

// Check if one version is less than another
lt('1.0.0', '2.0.0'); // returns true
lt('7.0.0+patch.1', '7.0.0+patch.10'); // returns true

// Check if versions are equal
eq('1.0.0', '1.0.0'); // returns true
eq('7.0.0+patch.1', '7.0.0+patch.1.0'); // returns true

// Check if one version is greater than or equal to another
gte('2.0.0', '1.0.0'); // returns true
gte('1.0.0', '1.0.0'); // returns true
gte('7.0.0+patch.10', '7.0.0+patch.1'); // returns true

// Check if one version is less than or equal to another
lte('1.0.0', '2.0.0'); // returns true
lte('1.0.0', '1.0.0'); // returns true
lte('7.0.0+patch.1', '7.0.0+patch.10'); // returns true

// Check if a version string is valid
valid('1.0.0'); // returns '1.0.0'
valid('invalid'); // returns null
```

## Examples

```typescript
// Handling patch build tags
customSemverCompare('7.0.0+patch.1', '7.0.0+patch.10'); // -1
customSemverCompare('7.0.0+patch.10', '7.0.0+patch.1'); // 1

// Comparing versions with and without build tags
customSemverCompare('7.0.0', '7.0.0+patch.1'); // -1
customSemverCompare('7.0.0+patch.1', '7.0.0'); // 1

// Standard semver comparison for non-patch build tags
customSemverCompare('7.0.0+alpha', '7.0.0+beta'); // 0
```

## License

MIT
