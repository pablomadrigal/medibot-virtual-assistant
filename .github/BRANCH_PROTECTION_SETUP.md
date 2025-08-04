# Branch Protection Setup

This document explains how to set up branch protection rules to ensure tests run before every PR merge.

## Required Branch Protection Rules

### For `main` branch:

1. **Go to Repository Settings** → **Branches** → **Add rule**

2. **Branch name pattern**: `main`

3. **Enable the following settings**:
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals: 1
     - ✅ Dismiss stale PR approvals when new commits are pushed
     - ✅ Require review from code owners
   
   - ✅ **Require status checks to pass before merging**
     - ✅ Require branches to be up to date before merging
     - **Required status checks**:
       - `Run Tests (18.x)`
       - `Run Tests (20.x)`
       - `Build Application`
       - `Security Audit`
       - `API Integration Tests`
       - `Enforce Required Checks`
   
   - ✅ **Require conversation resolution before merging**
   - ✅ **Require signed commits**
   - ✅ **Include administrators**
   - ✅ **Restrict pushes that create files**

### For `develop` branch:

1. **Branch name pattern**: `develop`

2. **Enable the following settings**:
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals: 1
   
   - ✅ **Require status checks to pass before merging**
     - ✅ Require branches to be up to date before merging
     - **Required status checks**:
       - `Run Tests (20.x)`
       - `Build Application`
       - `API Integration Tests`

## GitHub Actions Workflows

The following workflows will automatically run:

### 1. **CI/CD Pipeline** (`.github/workflows/ci.yml`)
- Runs on every push and PR
- Tests on Node.js 18.x and 20.x
- Runs type checking, linting, and tests
- Builds the application
- Uploads coverage reports

### 2. **API Tests** (`.github/workflows/api-tests.yml`)
- Runs when API-related files change
- Sets up PostgreSQL and Redis services
- Runs comprehensive API integration tests
- Includes performance testing

### 3. **Branch Protection** (`.github/workflows/branch-protection.yml`)
- Enforces PR requirements
- Validates PR title format
- Checks for breaking changes

## Required Secrets

Add these secrets to your repository:

1. **CODECOV_TOKEN** (optional): For code coverage reporting
2. **ENCRYPTION_KEY**: For testing encryption functionality

## PR Requirements

All PRs must:

1. ✅ Pass all CI tests (144+ tests)
2. ✅ Maintain code coverage
3. ✅ Pass security audit
4. ✅ Build successfully
5. ✅ Have descriptive title following conventional commits
6. ✅ Resolve all conversations
7. ✅ Be approved by at least 1 reviewer

## Test Coverage Requirements

- **Minimum coverage**: 80%
- **API endpoints**: 100% coverage required
- **Security functions**: 100% coverage required
- **Medical validation**: 100% coverage required

## Automatic Checks

The following will be automatically checked:

- 🧪 **Unit Tests**: All 144+ tests must pass
- 🔒 **Security**: No high/critical vulnerabilities
- 🏗️ **Build**: Application must build successfully
- 📊 **Coverage**: Code coverage must be maintained
- 🎯 **Type Safety**: TypeScript compilation must succeed
- 🧹 **Code Quality**: ESLint rules must pass

## Manual Setup Steps

1. Enable branch protection rules as described above
2. Add required secrets to repository settings
3. Ensure all team members have appropriate permissions
4. Test the workflow with a sample PR

## Troubleshooting

### Common Issues:

1. **Tests failing**: Check the Actions tab for detailed logs
2. **Coverage dropping**: Add tests for new code
3. **Build failing**: Check TypeScript errors and dependencies
4. **Security audit failing**: Update vulnerable dependencies

### Getting Help:

- Check the Actions tab for detailed error logs
- Review the test output in the workflow summary
- Ensure all required environment variables are set