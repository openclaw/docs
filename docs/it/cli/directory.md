---
read_when:
    - Vuoi cercare gli ID di contatti/gruppi/te stesso per un canale
    - Stai sviluppando un adattatore per la directory dei canali
summary: Riferimento CLI per `openclaw directory` (sé, peer, gruppi)
title: Directory
x-i18n:
    generated_at: "2026-07-03T15:31:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d17f545ce0bbe23a6c1ba74e4d1b44b103cc985b52affe4b25fbc6a6d1121045
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Ricerche nella directory per i canali che le supportano (contatti/peer, gruppi e "me").

## Flag comuni

- `--channel <name>`: id/alias del canale (obbligatorio quando sono configurati più canali; automatico quando ne è configurato uno solo)
- `--account <id>`: id dell'account (predefinito: valore predefinito del canale)
- `--json`: output JSON

## Note

- `directory` serve ad aiutarti a trovare ID che puoi incollare in altri comandi (in particolare `openclaw message send --target ...`).
- Per molti canali, i risultati sono basati sulla configurazione (allowlist / gruppi configurati) anziché su una directory live del provider.
- I Plugin di canale installati possono comunque omettere il supporto alla directory; in quel caso il comando segnala l'operazione di directory non supportata invece di reinstallare il Plugin.
- L'output predefinito è `id` (e talvolta `name`) separato da una tabulazione; usa `--json` per gli script.

## Uso dei risultati con `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formati ID (per canale)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (gruppo), `120363123456789@newsletter` (target in uscita Channel/Newsletter)
- Signal: gli alias configurati si risolvono in target DM E.164/UUID o target di gruppo `group:<id>`
- Telegram: `@username` o id chat numerico; i gruppi sono id numerici
- Slack: `user:U…` e `channel:C…`
- Discord: `user:<id>` e `channel:<id>`
- Matrix (plugin): `user:@user:server`, `room:!roomId:server` o `#alias:server`
- Microsoft Teams (plugin): `user:<id>` e `conversation:<id>`
- Zalo (plugin): id utente (Bot API)
- Zalo Personal / `zalouser` (plugin): id thread (DM/gruppo) da `zca` (`me`, `friend list`, `group list`)

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
