---
read_when:
    - Je voert de setup bij eerste gebruik uit zonder volledige CLI-onboarding
    - Je wilt het standaardwerkruimtepad instellen
summary: CLI-referentie voor `openclaw setup` (configuratie + werkruimte initialiseren)
title: Installatie
x-i18n:
    generated_at: "2026-04-29T22:35:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68e5c07a6b1769420c2125677f3eda9bd4841c938b4fc62583c5bed2a2596250
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Initialiseer `~/.openclaw/openclaw.json` en de agentwerkruimte.

Gerelateerd:

- Aan de slag: [Aan de slag](/nl/start/getting-started)
- CLI-introductie: [Introductie (CLI)](/nl/start/wizard)

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
- `--wizard`: voer de introductie uit
- `--non-interactive`: voer de introductie uit zonder prompts
- `--mode <local|remote>`: introductiemodus
- `--import-from <provider>`: migratieprovider die tijdens de introductie moet worden uitgevoerd
- `--import-source <path>`: bronmap van de agent voor `--import-from`
- `--import-secrets`: importeer ondersteunde geheimen tijdens de introductiemigratie
- `--remote-url <url>`: externe Gateway WebSocket-URL
- `--remote-token <token>`: extern Gateway-token

Om de introductie via setup uit te voeren:

```bash
openclaw setup --wizard
```

Opmerkingen:

- Gewone `openclaw setup` initialiseert configuratie + werkruimte zonder de volledige introductiestroom.
- Introductie wordt automatisch uitgevoerd wanneer er introductievlaggen aanwezig zijn (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Als Hermes-status wordt gedetecteerd, kan interactieve introductie automatisch migratie aanbieden. Importintroductie vereist een nieuwe setup; gebruik [Migreren](/nl/cli/migrate) voor dry-run-plannen, back-ups en overschrijfmodus buiten de introductie.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Installatieoverzicht](/nl/install)
