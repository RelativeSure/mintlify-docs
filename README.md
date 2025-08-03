# Rasmus - Platform/DevOps Engineer Documentation

This repository contains personal documentation and curated resources for platform engineering, DevOps, and system administration.

## Overview

A comprehensive documentation site built with [Mintlify](https://mintlify.com) covering:

- **Bookmarks**: Curated links and resources organized by technology category
- **Good Stuff**: Useful tools, tips, and configurations
- **Linux**: System administration, automation, and shell configurations
- **Windows**: PowerShell and Windows administration
- **Projects**: Personal projects and work-in-progress items

## Getting Started

### Prerequisites

- Node.js and npm/pnpm
- Mintlify CLI

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## Project Structure

```
docs/
├── bookmarks/          # Curated resource links
├── goodstuff/          # Tools and configurations
├── linux/              # Linux administration guides
├── windows/            # Windows and PowerShell docs
├── projects/           # Personal projects
├── website/            # Site documentation
├── docs.json           # Mintlify configuration
├── index.mdx           # Homepage
└── package.json        # Dependencies and scripts
```

## Documentation Categories

### Bookmarks
- Technology & Development
- Infrastructure & Security  
- Platform Specific (Windows, Discord)
- Personal & Lifestyle

### Technical Guides
- **Linux**: System administration, automation (Ansible, Puppet), shell configurations
- **Windows**: PowerShell scripting, WSL setup
- **Development**: Git workflows, Node.js, VS Code configurations
- **Infrastructure**: Kubernetes, Helm charts, containerization

## Contributing

This is a personal documentation repository. Feel free to browse and use any configurations or guides that might be helpful.

## Built With

- [Mintlify](https://mintlify.com) - Documentation platform
- MDX - Markdown with React components