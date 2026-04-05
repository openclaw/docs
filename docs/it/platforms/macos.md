---
read_when:
    - Stai implementando funzionalità dell'app macOS
    - Stai modificando il ciclo di vita del gateway o il bridging del nodo su macOS
summary: App complementare OpenClaw per macOS (barra dei menu + broker del gateway)
title: App macOS
x-i18n:
    generated_at: "2026-04-05T13:59:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: bfac937e352ede495f60af47edf3b8e5caa5b692ba0ea01d9fb0de9a44bbc135
    source_path: platforms/macos.md
    workflow: 15
---

# App complementare OpenClaw per macOS (barra dei menu + broker del gateway)

L'app macOS è l'**app complementare nella barra dei menu** per OpenClaw. Gestisce i permessi,
amministra/si collega al Gateway in locale (launchd o manuale) ed espone le
capacità di macOS all'agente come nodo.

## Cosa fa

- Mostra notifiche native e stato nella barra dei menu.
- Gestisce i prompt TCC (Notifiche, Accessibilità, Registrazione dello schermo, Microfono,
  Riconoscimento vocale, Automazione/AppleScript).
- Esegue o si connette al Gateway (locale o remoto).
- Espone strumenti solo macOS (Canvas, Fotocamera, Registrazione dello schermo, `system.run`).
- Avvia il servizio host del nodo locale in modalità **remote** (launchd), e lo arresta in modalità **local**.
- Facoltativamente ospita **PeekabooBridge** per l'automazione UI.
- Installa la CLI globale (`openclaw`) su richiesta tramite npm, pnpm o bun (l'app preferisce npm, poi pnpm, poi bun; Node resta il runtime Gateway consigliato).

## Modalità locale vs remota

- **Local** (predefinita): l'app si collega a un Gateway locale in esecuzione se presente;
  altrimenti abilita il servizio launchd tramite `openclaw gateway install`.
- **Remote**: l'app si connette a un Gateway tramite SSH/Tailscale e non avvia mai
  un processo locale.
  L'app avvia il **servizio host del nodo** locale così il Gateway remoto può raggiungere questo Mac.
  L'app non genera il Gateway come processo figlio.
  Il rilevamento del Gateway ora preferisce i nomi Tailscale MagicDNS agli IP tailnet grezzi,
  quindi l'app Mac si ripristina in modo più affidabile quando gli IP tailnet cambiano.

## Controllo launchd

L'app gestisce un LaunchAgent per utente con etichetta `ai.openclaw.gateway`
(o `ai.openclaw.<profile>` quando si usa `--profile`/`OPENCLAW_PROFILE`; il legacy `com.openclaw.*` viene comunque scaricato).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Sostituisci l'etichetta con `ai.openclaw.<profile>` quando esegui un profilo con nome.

Se il LaunchAgent non è installato, abilitalo dall'app o esegui
`openclaw gateway install`.

## Capacità del nodo (Mac)

L'app macOS si presenta come un nodo. Comandi comuni:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Fotocamera: `camera.snap`, `camera.clip`
- Schermo: `screen.record`
- Sistema: `system.run`, `system.notify`

Il nodo segnala una mappa `permissions` così gli agenti possono decidere cosa è consentito.

Servizio nodo + IPC dell'app:

- Quando il servizio host del nodo headless è in esecuzione (modalità remota), si connette al Gateway WS come nodo.
- `system.run` viene eseguito nell'app macOS (contesto UI/TCC) tramite un socket Unix locale; prompt + output restano nell'app.

Diagramma (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Approvazioni exec (`system.run`)

`system.run` è controllato da **Exec approvals** nell'app macOS (Settings → Exec approvals).
Sicurezza + richiesta + allowlist sono archiviati localmente sul Mac in:

```
~/.openclaw/exec-approvals.json
```

Esempio:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

Note:

- Le voci `allowlist` sono pattern glob per i percorsi binari risolti.
- Il testo del comando shell grezzo che contiene sintassi di controllo o espansione della shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) viene trattato come una mancata corrispondenza dell'allowlist e richiede approvazione esplicita (oppure l'inserimento nell'allowlist del binario della shell).
- Scegliere “Always Allow” nel prompt aggiunge quel comando all'allowlist.
- Gli override dell'ambiente `system.run` vengono filtrati (elimina `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) e poi uniti con l'ambiente dell'app.
- Per i wrapper shell (`bash|sh|zsh ... -c/-lc`), gli override dell'ambiente con ambito richiesta vengono ridotti a una piccola allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Per le decisioni always-allow in modalità allowlist, i wrapper di dispatch noti (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) mantengono i percorsi eseguibili interni invece dei percorsi dei wrapper. Se l'unwrapping non è sicuro, nessuna voce di allowlist viene mantenuta automaticamente.

## Deep link

L'app registra lo schema URL `openclaw://` per azioni locali.

### `openclaw://agent`

Attiva una richiesta Gateway `agent`.
__OC_I18N_900004__
Parametri della query:

- `message` (obbligatorio)
- `sessionKey` (facoltativo)
- `thinking` (facoltativo)
- `deliver` / `to` / `channel` (facoltativo)
- `timeoutSeconds` (facoltativo)
- `key` (facoltativo, chiave per modalità non presidiata)

Sicurezza:

- Senza `key`, l'app richiede conferma.
- Senza `key`, l'app applica un limite breve al messaggio per il prompt di conferma e ignora `deliver` / `to` / `channel`.
- Con una `key` valida, l'esecuzione è non presidiata (pensata per automazioni personali).

## Flusso di onboarding (tipico)

1. Installa e avvia **OpenClaw.app**.
2. Completa la checklist dei permessi (prompt TCC).
3. Assicurati che la modalità **Local** sia attiva e che il Gateway sia in esecuzione.
4. Installa la CLI se vuoi l'accesso dal terminale.

## Posizionamento della directory di stato (macOS)

Evita di mettere la directory di stato di OpenClaw in iCloud o in altre cartelle sincronizzate nel cloud.
I percorsi supportati dalla sincronizzazione possono aggiungere latenza e occasionalmente causare race di blocco file/sincronizzazione per
sessioni e credenziali.

Preferisci un percorso di stato locale non sincronizzato come:
__OC_I18N_900005__
Se `openclaw doctor` rileva lo stato sotto:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

mostrerà un avviso e consiglierà di tornare a un percorso locale.

## Flusso di build e sviluppo (nativo)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (o Xcode)
- Impacchetta l'app: `scripts/package-mac-app.sh`

## Debug della connettività gateway (CLI macOS)

Usa la CLI di debug per esercitare la stessa logica di handshake e rilevamento del Gateway WebSocket
usata dall'app macOS, senza avviare l'app.
__OC_I18N_900006__
Opzioni di connessione:

- `--url <ws://host:port>`: override della configurazione
- `--mode <local|remote>`: risoluzione dalla configurazione (predefinito: configurazione o local)
- `--probe`: forza un nuovo health probe
- `--timeout <ms>`: timeout della richiesta (predefinito: `15000`)
- `--json`: output strutturato per il confronto delle differenze

Opzioni di rilevamento:

- `--include-local`: include i gateway che verrebbero filtrati come “local”
- `--timeout <ms>`: finestra complessiva di rilevamento (predefinito: `2000`)
- `--json`: output strutturato per il confronto delle differenze

Suggerimento: confronta con `openclaw gateway discover --json` per vedere se la
pipeline di rilevamento dell'app macOS (`local.` più il dominio wide-area configurato, con
fallback wide-area e Tailscale Serve) differisce da
quella della CLI Node basata su `dns-sd`.

## Infrastruttura delle connessioni remote (tunnel SSH)

Quando l'app macOS è in esecuzione in modalità **Remote**, apre un tunnel SSH così i componenti UI locali
possono comunicare con un Gateway remoto come se fosse in localhost.

### Tunnel di controllo (porta WebSocket Gateway)

- **Scopo:** health check, stato, Web Chat, configurazione e altre chiamate del piano di controllo.
- **Porta locale:** la porta Gateway (predefinita `18789`), sempre stabile.
- **Porta remota:** la stessa porta Gateway sull'host remoto.
- **Comportamento:** nessuna porta locale casuale; l'app riusa un tunnel esistente e sano
  oppure lo riavvia se necessario.
- **Forma SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` con opzioni BatchMode +
  ExitOnForwardFailure + keepalive.
- **Reporting IP:** il tunnel SSH usa loopback, quindi il gateway vedrà l'IP del nodo
  come `127.0.0.1`. Usa il trasporto **Direct (ws/wss)** se vuoi che compaia il vero IP del client
  (vedi [accesso remoto macOS](/platforms/mac/remote)).

Per i passaggi di configurazione, vedi [accesso remoto macOS](/platforms/mac/remote). Per i dettagli del protocollo,
vedi [Protocollo Gateway](/gateway/protocol).

## Documentazione correlata

- [Runbook del Gateway](/gateway)
- [Gateway (macOS)](/platforms/mac/bundled-gateway)
- [Permessi macOS](/platforms/mac/permissions)
- [Canvas](/platforms/mac/canvas)
