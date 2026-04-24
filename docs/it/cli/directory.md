---
read_when:
    - Directory
    - Stai sviluppando un adapter directory del canale
summary: Riferimento CLI per `openclaw directory` (self, peer, gruppi)
title: Directory
x-i18n:
    generated_at: "2026-04-24T08:33:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: f63ed92469738501ae1f8f08aec3edf01d1f0f46008571ed38ccd9c77e5ba15e
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

Ricerche nella directory per i canali che la supportano (contatti/peer, gruppi e “me”).

## Flag comuni

- `--channel <name>`: id/alias del canale (obbligatorio quando sono configurati più canali; automatico quando ne è configurato solo uno)
- `--account <id>`: id dell'account (predefinito: canale predefinito)
- `--json`: output JSON

## Note

- `directory` serve ad aiutarti a trovare ID che puoi incollare in altri comandi (in particolare `openclaw message send --target ...`).
- Per molti canali, i risultati sono basati sulla configurazione (allowlist / gruppi configurati) piuttosto che su una directory live del provider.
- L'output predefinito è `id` (e talvolta `name`) separato da un tab; usa `--json` per gli script.

## Uso dei risultati con `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formati ID (per canale)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (gruppo)
- Telegram: `@username` o id chat numerico; i gruppi sono id numerici
- Slack: `user:U…` e `channel:C…`
- Discord: `user:<id>` e `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` o `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` e `conversation:<id>`
- Zalo (Plugin): id utente (API Bot)
- Zalo personale / `zalouser` (Plugin): id thread (DM/gruppo) da `zca` (`me`, `friend list`, `group list`)

## Self ("me")

```bash
openclaw directory self --channel zalouser
```

## Peer (contatti/utenti)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## Gruppi

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Correlati

- [Riferimento CLI](/it/cli)
