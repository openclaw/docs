---
read_when:
    - Vuoi cercare ID di contatti/gruppi/self per un canale
    - Stai sviluppando un adattatore di directory di canale
summary: Riferimento CLI per `openclaw directory` (self, peer, gruppi)
title: directory
x-i18n:
    generated_at: "2026-04-05T13:47:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a81a037e0a33f77c24b1adabbc4be16ed4d03c419873f3cbdd63f2ce84a1064
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

Ricerche nella directory per i canali che la supportano (contatti/peer, gruppi e “me”).

## Flag comuni

- `--channel <name>`: ID/alias del canale (obbligatorio quando sono configurati più canali; automatico quando ne è configurato solo uno)
- `--account <id>`: ID account (predefinito: account predefinito del canale)
- `--json`: output JSON

## Note

- `directory` serve ad aiutarti a trovare ID che puoi incollare in altri comandi (soprattutto `openclaw message send --target ...`).
- Per molti canali, i risultati sono basati sulla configurazione (allowlist / gruppi configurati) anziché su una directory live del provider.
- L'output predefinito è `id` (e talvolta `name`) separato da un tab; usa `--json` per gli script.

## Uso dei risultati con `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formati ID (per canale)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (gruppo)
- Telegram: `@username` o ID chat numerico; i gruppi sono ID numerici
- Slack: `user:U…` e `channel:C…`
- Discord: `user:<id>` e `channel:<id>`
- Matrix (plugin): `user:@user:server`, `room:!roomId:server` o `#alias:server`
- Microsoft Teams (plugin): `user:<id>` e `conversation:<id>`
- Zalo (plugin): ID utente (Bot API)
- Zalo Personal / `zalouser` (plugin): ID thread (DM/gruppo) da `zca` (`me`, `friend list`, `group list`)

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
