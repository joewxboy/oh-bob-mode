# Contributing to oh-bob-mode

Thank you for your interest in contributing to this project! We welcome contributions of all kinds — bug reports, skill improvements, new workflows, documentation updates, and more.

## How to Contribute

1. **Fork** this repository on GitHub
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** — follow the project conventions described below
4. **Sign off your commits** (see DCO section below):
   ```bash
   git commit -s -m "Add your descriptive commit message"
   ```
5. **Push** your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request** against `main` and fill in the PR description

## Development Setup

Install MCP server dependencies before testing:

```bash
make install
```

Validate prerequisites and server syntax:

```bash
make check
```

## Project Conventions

- **Skills** live in `.bob/skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description` required)
- **Slash commands** live in `.bob/commands/opsx-*.md`
- **MCP server** (`index.js`) is ESM — always use `import`, never `require`; log only to `console.error`
- Keep skill files under 500 lines; add a `references/` subdirectory for larger content
- Never commit credentials, API keys, or `.env` files — see [PREREQUISITES.md](PREREQUISITES.md)

## Developer Certificate of Origin

All commits must be signed off to indicate agreement with the [Developer Certificate of Origin](https://developercertificate.org/). Use the `-s` flag when committing:

```bash
git commit -s -m "Your message"
```

This adds a `Signed-off-by: Your Name <your@email.com>` trailer to your commit.

## Open Horizon Contributing Guidelines

This project follows the broader Open Horizon contribution guidelines:

> https://github.com/open-horizon/.github/blob/master/CONTRIBUTING.md

Please read them before submitting your first contribution.

## Reporting Issues

Open an issue on GitHub with:
- A clear description of the problem or suggestion
- Steps to reproduce (for bugs)
- Expected vs. actual behavior

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE.md).
