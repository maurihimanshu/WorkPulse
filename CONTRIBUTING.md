# Contributing to WorkPulse

Thank you for your interest in contributing to **WorkPulse**! We are thrilled to welcome community contributions to build the best privacy-first intelligent desktop assistant.

---

## Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for all contributors regardless of background or experience level. Please treat everyone with respect, kindness, and constructive feedback.

---

## Branching Model

To ensure a smooth release cycle, WorkPulse uses the following git branching strategy:

- **`main`**: Represents official, stable releases. Code on `main` is production-ready.
- **`developer`**: Active integration branch for upcoming releases. All feature and bugfix PRs must be targeted against `developer`.
- **Feature & Fix branches**:
  - `feature/<feature-name>`: For new capabilities or enhancements.
  - `fix/<bug-name>`: For bug fixes.
  - `docs/<doc-topic>`: For documentation updates.

### Creating a Branch
Always branch from the latest `developer`:
```bash
git checkout developer
git pull origin developer
git checkout -b feature/my-new-feature
```

---

## Development Setup

### 1. Prerequisites
- Python 3.9, 3.10, 3.11, or 3.12
- Git

### 2. Fork and Clone
```bash
git clone https://github.com/your-username/workpulse.git
cd workpulse
```

### 3. Create a Virtual Environment
```bash
# Linux / macOS
python3 -m venv venv
source venv/bin/activate

# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 4. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
pip install -e ".[dev]"
```

### 5. Setup Environment Configuration
```bash
cp .env.example .env
```

---

## Coding Guidelines & Quality Checks

Before submitting a pull request, ensure all code passes formatting, type checking, and tests:

### 1. Code Formatting & Style
WorkPulse adheres to PEP 8 standards with **Black** and **isort**:
```bash
# Format code
black src tests
isort src tests

# Check linting
flake8 src tests --max-line-length=120
```

### 2. Type Checking
```bash
mypy src --ignore-missing-imports
```

### 3. Running Tests
```bash
pytest tests/ -ra -q --cov=src
```

### 4. Checking CLI & Headless Operation
```bash
python src/main.py --version
python src/main.py --check-config
```

---

## Submitting a Pull Request (PR)

1. **Keep PRs Focused**: Keep changes atomic and dedicated to a single feature or bug fix.
2. **Target `developer`**: Set the base branch of your PR to `developer` (not `main`).
3. **Include Tests**: If you are adding features or fixing bugs, include corresponding unit or integration tests in `tests/`.
4. **Fill out the PR Template**: Describe the change, linked issues, and testing steps.
5. **Review**: Maintainers (`@maurihimanshu @himanshumauri @githubofhimanshu`) will review your pull request and assist with any feedback.

---

## Reporting Issues

- **Bug Reports**: Use our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md) with reproduction steps and environment details.
- **Feature Requests**: Use our [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md) with motivation and proposed design.
- **Security Vulnerabilities**: Refer to [SECURITY.md](SECURITY.md) and report privately via GitHub Security Advisories.
