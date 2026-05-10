---
read_when:
    - Accesso a ClawHub
    - Utilizzo della CLI di ClawHub
    - Debug degli errori 401
summary: Accesso a ClawHub, token API, accesso alla CLI, archiviazione dei token e revoca.
x-i18n:
    generated_at: "2026-05-10T19:25:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261f5a93200db8415e3bc8f35251c3486110ce8e076c482e846ad11f2ccd517f
    source_path: clawhub/auth.md
    workflow: 16
---

# Autenticazione

ClawHub usa GitHub per l'accesso web. La CLI usa token dell'API di ClawHub creati
tramite quell'account connesso.

## Accesso web

Usa GitHub per accedere su [clawhub.ai](https://clawhub.ai).

Gli account eliminati, sospesi o disabilitati non possono completare il normale accesso a ClawHub.
Se l'accesso ti riporta a uno stato disconnesso, il tuo account potrebbe non essere in regola.

## Accesso dalla CLI

Il flusso di accesso predefinito della CLI apre il browser:

```bash
clawhub login
clawhub whoami
```

Cosa accade:

1. La CLI avvia un server di callback temporaneo su `127.0.0.1`.
2. Il browser apre la pagina di accesso a ClawHub.
3. Dopo l'accesso con GitHub, ClawHub crea un token API.
4. Il browser reindirizza alla callback locale.
5. La CLI archivia il token nel file di configurazione di ClawHub.

Se il browser non riesce a raggiungere la callback locale a causa di regole di
firewall, VPN o proxy, usa il flusso con token senza interfaccia grafica.

## Accesso senza interfaccia grafica

Crea un token nell'interfaccia web di ClawHub, quindi passalo alla CLI:

```bash
clawhub login --token clh_...
```

Usa questo flusso per server, job CI o ambienti solo terminale.

Per shell remote in cui puoi aprire un browser altrove, esegui:

```bash
clawhub login --device
```

La CLI stampa un codice monouso e attende mentre lo autorizzi su
`https://clawhub.ai/cli/device`.

## Archiviazione dei token

Percorsi di configurazione predefiniti:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` o `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Sovrascrivi il percorso con:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

## Revoca

Puoi revocare i token API nell'interfaccia web di ClawHub.

I token revocati, non validi o mancanti restituiscono `401 Unauthorized`. Accedi di nuovo
con `clawhub login` oppure fornisci un token aggiornato con `clawhub login --token`.

Gli account eliminati, sospesi o disabilitati non possono continuare a usare i token API esistenti.
