---
read_when:
    - Vuoi cercare gli ID di contatti/gruppi/personali per un canale
    - Stai sviluppando un adattatore per la directory dei canali
summary: Riferimento CLI per `openclaw directory` (sé, pari, gruppi)
title: Cartella
x-i18n:
    generated_at: "2026-05-02T08:18:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcd0be284c0ec1aa347084d84f7001f1e2f47977ec5198025ba303297858aaab
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Ricerche nella directory per i canali che le supportano (contatti/peer, gruppi e “me”).

## Flag comuni

- `--channel <name>`: ID/alias del canale (obbligatorio quando sono configurati più canali; automatico quando ne è configurato uno solo)
- `--account <id>`: ID account (predefinito: valore predefinito del canale)
- `--json`: output JSON

## Note

- `directory` serve ad aiutarti a trovare ID che puoi incollare in altri comandi (in particolare `openclaw message send --target ...`).
- Per molti canali, i risultati sono basati sulla configurazione (allowlist / gruppi configurati) anziché su una directory live del provider.
- I Plugin di canale installati possono comunque omettere il supporto alla directory; in quel caso il comando segnala l'operazione di directory non supportata invece di reinstallare il Plugin.
- L'output predefinito è `id` (e a volte `name`) separati da una tabulazione; usa `--json` per gli script.

## Uso dei risultati con `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formati degli ID (per canale)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (gruppo)
- Telegram: `@username` o ID chat numerico; i gruppi sono ID numerici
- Slack: `user:U…` e `channel:C…`
- Discord: `user:<id>` e `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` o `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` e `conversation:<id>`
- Zalo (Plugin): ID utente (Bot API)
- Zalo Personal / `zalouser` (Plugin): ID thread (DM/gruppo) da `zca` (`me`, `friend list`, `group list`)

## Sé stessi ("me")

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
