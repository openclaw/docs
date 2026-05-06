---
read_when:
    - Je voert de eerste installatie uit zonder volledige CLI-onboarding
    - Je wilt het standaardpad voor de werkruimte instellen
summary: CLI-referentie voor `openclaw setup` (configuratie + werkruimte initialiseren)
title: Instellen
x-i18n:
    generated_at: "2026-05-06T17:54:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a47d41f8c6c59395eaa4bc6055fa09f863af819c7920e29969793904180c910
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Initialiseer `~/.openclaw/openclaw.json` en de agentwerkruimte.

<Note>
`openclaw setup` is bedoeld voor installaties met wijzigbare configuratie. In Nix-modus (`OPENCLAW_NIX_MODE=1`) weigert OpenClaw schrijfacties voor setup, omdat het configuratiebestand door Nix wordt beheerd. Agents moeten de eigen [nix-openclaw-snelstart](https://github.com/openclaw/nix-openclaw#quick-start) of de equivalente bronconfiguratie voor een ander Nix-pakket gebruiken.
</Note>

Gerelateerd:

- Aan de slag: [Aan de slag](/nl/start/getting-started)
- CLI-onboarding: [Onboarding (CLI)](/nl/start/wizard)

## Voorbeelden

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opties

- `--workspace <dir>`: agentwerkruimtemap (opgeslagen als `agents.defaults.workspace`)
- `--wizard`: onboarding uitvoeren
- `--non-interactive`: onboarding uitvoeren zonder prompts
- `--mode <local|remote>`: onboardingmodus
- `--import-from <provider>`: migratieprovider om tijdens onboarding uit te voeren
- `--import-source <path>`: bron-agent-home voor `--import-from`
- `--import-secrets`: ondersteunde geheimen importeren tijdens onboardingmigratie
- `--remote-url <url>`: externe Gateway WebSocket-URL
- `--remote-token <token>`: extern Gateway-token

Onboarding uitvoeren via setup:

```bash
openclaw setup --wizard
```

Opmerkingen:

- Eenvoudige `openclaw setup` initialiseert configuratie + werkruimte zonder de volledige onboardingflow.
- Voer na eenvoudige setup `openclaw configure` uit om modellen, kanalen, Gateway, plugins, Skills of statuscontroles te kiezen.
- Onboarding wordt automatisch uitgevoerd wanneer er onboardingvlaggen aanwezig zijn (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Als Hermes-status wordt gedetecteerd, kan interactieve onboarding automatisch migratie aanbieden. Import-onboarding vereist een nieuwe setup; gebruik [Migreren](/nl/cli/migrate) voor dry-run-plannen, back-ups en overschrijfmodus buiten onboarding.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Installatieoverzicht](/nl/install)
