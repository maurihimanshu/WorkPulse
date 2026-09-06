# Security Policy

WorkPulse is designed from the ground up as a **privacy-first, offline** desktop assistant. We take the security of your data and the integrity of our software very seriously.

---

## Supported Versions

Only the latest release receive security updates and bug fixes:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

---

## Privacy & Security Architecture

WorkPulse follows strict privacy-by-design engineering principles:

1. **Zero External Telemetry**: All machine learning models, analytics aggregations, and classification heuristics execute 100% locally on your machine. No activity logs, window titles, or metrics are ever sent to remote servers.
2. **At-Rest Encryption**: Activity records and daily session files are encrypted using AES-128-CBC via Cryptography's `Fernet` specification with HMAC authentication.
3. **Key Security**: Encryption keys are stored locally with restrictive file permissions (`0600` on POSIX systems).
4. **No Raw Keystroke Logging**: The application monitors activity presence and idle intervals; it never logs raw keystroke text or clipboard content.
5. **Data Retention Controls**: Automatic purging of activities older than the configured data retention window (default 30 days).

---

## Reporting a Vulnerability

If you discover a security vulnerability or sensitive data exposure issue in WorkPulse, please report it responsibly:

### 1. GitHub Security Advisory (Preferred)
Please submit your report privately through [GitHub Security Advisories](https://github.com/maurihimanshu/workpulse/security/advisories/new). This allows the maintainers to coordinate a patch before public disclosure.

### 2. Direct Contact
If you cannot use GitHub Advisories, please contact the maintainers:
- **Lead Maintainer**: Himanshu Mauri
- **GitHub**: [@maurihimanshu](https://github.com/maurihimanshu), [@himanshumauri](https://github.com/himanshumauri), [@githubofhimanshu](https://github.com/githubofhimanshu)

### What to Include in Your Report
To help us investigate and triage quickly, please include:
- A clear description of the vulnerability and its potential impact.
- Step-by-step instructions or proof-of-concept (PoC) script to reproduce the issue.
- Details of your operating system (Windows, Linux, macOS) and Python environment.
- Any suggestions for mitigation or remediation.

### Response Timeline
- **Initial Response**: Within 48 hours acknowledging receipt of your report.
- **Triage & Assessment**: Within 5 business days with assessment and proposed next steps.
- **Fix & Disclosure**: Coordinated release with patch and security advisory credit.

Please do not open public GitHub issues for security vulnerabilities.
