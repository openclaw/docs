---
read_when:
    - Je voert de eerste configuratie uit zonder volledige CLI-begeleiding
    - Je wilt het standaardwerkruimtepad instellen
summary: CLI-referentie voor `openclaw setup` (configuratie + werkruimte initialiseren)
title: Installatie
x-i18n:
    generated_at: "2026-05-02T20:42:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805f60c81f5fc216fc446641efe0bcb60bb6c34b3a50a6fc9e767461206e5f90
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
- `--wizard`: introductie uitvoeren
- `--non-interactive`: introductie zonder prompts uitvoeren
- `--mode <local|remote>`: introductiemodus
- `--import-from <provider>`: migratieprovider om tijdens de introductie uit te voeren
- `--import-source <path>`: bron-agent-home voor `--import-from`
- `--import-secrets`: ondersteunde geheimen importeren tijdens introductiemigratie
- `--remote-url <url>`: WebSocket-URL van externe Gateway
- `--remote-token <token>`: token voor externe Gateway

Om introductie via setup uit te voeren:

```bash
openclaw setup --wizard
```

Opmerkingen:

- Gewoon `openclaw setup` initialiseert de configuratie en werkruimte zonder de volledige introductiestroom.
- Voer na gewone setup `openclaw configure` uit om modellen, kanalen, Gateway, plugins, Skills of gezondheidscontroles te kiezen.
- Introductie wordt automatisch uitgevoerd wanneer er introductievlaggen aanwezig zijn (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Als Hermes-status wordt gedetecteerd, kan interactieve introductie automatisch migratie aanbieden. Importintroductie vereist een nieuwe setup; gebruik [Migreren](/nl/cli/migrate) voor dry-runplannen, back-ups en overschrijfmodus buiten introductie.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Installatieoverzicht](/nl/install)
