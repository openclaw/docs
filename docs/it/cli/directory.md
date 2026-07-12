---
read_when:
    - Vuoi cercare gli ID di contatti, gruppi o del tuo profilo per un canale
    - Stai sviluppando un adattatore per la directory dei canali
summary: Riferimento CLI per `openclaw directory` (proprio, peer, gruppi)
title: Directory
x-i18n:
    generated_at: "2026-07-12T06:55:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Ricerche nelle directory per i canali che le supportano: contatti/peer, gruppi e "me" (sé stessi).

I risultati sono pensati per essere incollati in altri comandi, in particolare `openclaw message send --target ...`.

## Flag comuni

- `--channel <name>`: id/alias del canale (obbligatorio quando sono configurati più canali; selezionato automaticamente quando ne è configurato uno solo)
- `--account <id>`: id dell'account (predefinito: valore predefinito del canale)
- `--json`: output JSON

L'output predefinito (non JSON) è `id` (e talvolta `name`) separato da una tabulazione.

## Note

- Per molti canali, i risultati provengono dalla configurazione (elenchi consentiti / gruppi configurati) anziché da una directory in tempo reale del provider.
- Un plugin di canale già installato potrebbe non supportare le directory. In tal caso, il comando segnala che l'operazione non è supportata; non tenta di reinstallare o aggiornare il plugin per aggiungere il supporto.

## Utilizzo dei risultati con `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formati degli ID per canale

| Canale                              | Formato dell'id di destinazione                                                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567` (DM), `1234567890-1234567890@g.us` (gruppo), `120363123456789@newsletter` (canale/newsletter, solo in uscita)       |
| Signal                              | Gli alias configurati vengono risolti in destinazioni DM E.164/UUID o in destinazioni di gruppo `group:<id>`                      |
| Telegram                            | `@username` o id numerico della chat; i gruppi usano id numerici                                                                   |
| Slack                               | `user:U…` e `channel:C…`                                                                                                           |
| Discord                             | `user:<id>` e `channel:<id>`                                                                                                       |
| Matrix (plugin)                     | `user:@user:server`, `room:!roomId:server` o `#alias:server`                                                                       |
| Microsoft Teams (plugin)            | `user:<id>` e `conversation:<id>`                                                                                                  |
| Zalo (plugin)                       | ID utente (API del bot)                                                                                                            |
| Zalo Personal / `zalouser` (plugin) | ID del thread (DM/gruppo), da `zca` (`me`, `friend list`, `group list`)                                                            |

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

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
