# Contributing to Biway

First off, thank you for considering contributing to **Biway**! 🎉

We appreciate every contribution, whether it's reporting a bug, suggesting an improvement, improving documentation, or submitting code. Your help makes Biway better for everyone.

---

# How Can I Contribute?

## 🐛 Reporting Bugs

If you find a bug, please open a GitHub Issue and include:

- A clear description of the problem
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Your operating system
- Browser version (if applicable)
- Logs or screenshots (if available)

---

## 💡 Suggesting Enhancements

Have an idea to improve Biway?

Open an issue first so we can discuss the proposal before implementation. This helps avoid duplicated work and ensures the feature aligns with the project's direction.

---

## 👨‍💻 Code Contributions

If you're looking to contribute code, check for issues labeled:

- `good first issue`
- `help wanted`

Feel free to comment on an issue before starting work so others know you're working on it.

---

# Development Setup

Biway consists of two primary components:

- **Go Backend** (Admin & Agent)
- **React Frontend** (Panel)

## Prerequisites

Before getting started, make sure you have:

- Go **1.26+**
- Node.js **20+**

---

## Backend Setup (Go)

The backend source code is located in the repository root.

### Clone the repository

```bash
git clone https://github.com/yourusername/biway.git
cd biway
```

### Install Go dependencies

```bash
go mod download
```

### Run the Admin Server

```bash
go run cmd/admin/main.go serve
```

### Run the Agent (in another terminal)

```bash
go run cmd/agent/main.go start
```

---

## Frontend Setup (React)

The web panel lives inside the `panel/` directory.

### Navigate to the panel

```bash
cd panel
```

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

The frontend will typically be available at:

```
http://localhost:5173
```

---

# Pull Request Process

1. Fork the repository.
2. Create a branch from `main`.

### Branch Naming

Use descriptive branch names such as:

```
feature/add-docker-support
bugfix/login-crash
docs/update-installation
refactor/database-layer
```

### Before Submitting

Please ensure that you:

- Add tests where applicable.
- Format Go code:

```bash
go fmt ./...
```

- Lint the frontend:

```bash
cd panel
npm run lint
```

- Update documentation (`README.md` or `docs/`) if your changes affect installation, configuration, or usage.

### Submit Your Pull Request

Open a Pull Request with:

- A clear title
- A concise description
- Screenshots (if UI changes)
- Related issue number (if applicable)

---

# Code Style

## Go

- Follow standard Go conventions.
- Run:

```bash
go fmt ./...
```

before committing.

---

## React / TypeScript

We use:

- ESLint
- Prettier

Run:

```bash
npm run lint
```

before submitting your changes.

---

# Commit Messages (Recommended)

Although not required, we recommend following Conventional Commits:

```
feat: add Docker support
fix: resolve login redirect issue
docs: update installation guide
refactor: simplify database initialization
test: add unit tests for authentication
```

---

# Questions?

If you have any questions, feel free to open a GitHub Discussion or Issue.

We're happy to help!

---

## ❤️ Thank You

Thank you for taking the time to contribute to **Biway**.

Every contribution—big or small—helps make the project better for everyone.