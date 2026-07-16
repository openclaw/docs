---
read_when:
    - Accesso a ClawHub
    - Utilizzo della CLI di ClawHub
    - Debug degli errori 401
summary: Accesso a ClawHub, token API, accesso tramite CLI, archiviazione e revoca dei token.
x-i18n:
    generated_at: "2026-07-16T14:03:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Autenticazione

ClawHub usa GitHub per l'accesso via web. La CLI usa i token API di ClawHub creati
tramite l'account con cui è stato effettuato l'accesso.

## Accesso via web

Usare GitHub per accedere a [clawhub.ai](https://clawhub.ai).

Gli account eliminati, esclusi o disabilitati non possono completare il normale accesso a ClawHub.
Se al termine dell'accesso si ritorna a uno stato disconnesso, è possibile che l'account non sia
in regola. Se l'account è stato escluso o disabilitato, usare il
[modulo di ricorso di ClawHub](https://appeals.openclaw.ai/) se si ritiene che si tratti di un
errore.

## Accesso tramite CLI

Il flusso di accesso predefinito della CLI apre il browser:

```bash
clawhub login
clawhub whoami
```

Cosa accade:

1. La CLI avvia un server di callback temporaneo su `127.0.0.1`.
2. Il browser apre la pagina di accesso di ClawHub.
3. Dopo l'accesso tramite GitHub, ClawHub crea un token API.
4. Il browser reindirizza al callback locale.
5. La CLI memorizza il token nel file di configurazione di ClawHub.

Se il browser non riesce a raggiungere il callback locale a causa delle regole di firewall, VPN o
proxy, usare il flusso con token headless.

## Accesso headless

Creare un token nell'interfaccia web di ClawHub, quindi passarlo alla CLI:

```bash
clawhub login --token clh_...
```

Usare questo flusso per server, processi CI o ambienti con solo terminale.

Per le shell remote in cui è possibile aprire un browser altrove, eseguire:

```bash
clawhub login --device
```

La CLI visualizza un codice monouso e attende che venga autorizzata all'indirizzo
`https://clawhub.ai/cli/device`.

## Archiviazione dei token

Percorsi di configurazione predefiniti:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` o `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Per sovrascrivere il percorso, usare:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

Per visualizzare il token memorizzato per la configurazione della CI, usare:

```bash
clawhub token
```

## Revoca

È possibile revocare i token API nell'interfaccia web di ClawHub.

I token revocati, non validi o mancanti restituiscono `401 Unauthorized`. Accedere nuovamente
con `clawhub login` oppure fornire un nuovo token con `clawhub login --token`.

Gli account eliminati, esclusi o disabilitati non possono continuare a usare i token API esistenti.
Se l'account è stato escluso o disabilitato, usare il
[modulo di ricorso di ClawHub](https://appeals.openclaw.ai/) se si ritiene che si tratti di un
errore.
