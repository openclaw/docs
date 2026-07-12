---
read_when:
    - Accesso a ClawHub
    - Utilizzo della CLI di ClawHub
    - Debug degli errori 401
summary: Accesso a ClawHub, token API, accesso tramite CLI, archiviazione e revoca dei token.
x-i18n:
    generated_at: "2026-07-12T06:52:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Autenticazione

ClawHub usa GitHub per l'accesso via web. La CLI usa i token API di ClawHub creati tramite l'account con cui è stato effettuato l'accesso.

## Accesso via web

Usa GitHub per accedere a [clawhub.ai](https://clawhub.ai).

Gli account eliminati, sospesi o disabilitati non possono completare il normale accesso a ClawHub. Se, dopo il tentativo di accesso, risulti ancora disconnesso, il tuo account potrebbe non essere in regola. Se il tuo account è stato sospeso o disabilitato e ritieni che si tratti di un errore, usa il [modulo di ricorso di ClawHub](https://appeals.openclaw.ai/).

## Accesso dalla CLI

Il flusso di accesso predefinito della CLI apre il browser:

```bash
clawhub login
clawhub whoami
```

Cosa accade:

1. La CLI avvia un server temporaneo di callback su `127.0.0.1`.
2. Il browser apre la pagina di accesso di ClawHub.
3. Dopo l'accesso con GitHub, ClawHub crea un token API.
4. Il browser reindirizza alla callback locale.
5. La CLI memorizza il token nel file di configurazione di ClawHub.

Se il browser non riesce a raggiungere la callback locale a causa delle regole del firewall, della VPN o del proxy, usa il flusso con token senza interfaccia grafica.

## Accesso senza interfaccia grafica

Crea un token nell'interfaccia web di ClawHub, quindi passalo alla CLI:

```bash
clawhub login --token clh_...
```

Usa questo flusso per server, processi CI o ambienti che dispongono solo del terminale.

Per le shell remote in cui puoi aprire un browser altrove, esegui:

```bash
clawhub login --device
```

La CLI mostra un codice monouso e attende che tu ne autorizzi l'uso all'indirizzo `https://clawhub.ai/cli/device`.

## Archiviazione dei token

Percorsi di configurazione predefiniti:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` oppure `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Sovrascrivi il percorso con:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

Per la configurazione della CI, visualizza il token memorizzato con:

```bash
clawhub token
```

## Revoca

Puoi revocare i token API nell'interfaccia web di ClawHub.

I token revocati, non validi o mancanti restituiscono `401 Unauthorized`. Accedi nuovamente con `clawhub login` oppure fornisci un nuovo token con `clawhub login --token`.

Gli account eliminati, sospesi o disabilitati non possono continuare a usare i token API esistenti. Se il tuo account è stato sospeso o disabilitato e ritieni che si tratti di un errore, usa il [modulo di ricorso di ClawHub](https://appeals.openclaw.ai/).
