---
read_when:
    - Implementazione di funzionalità dell'app macOS
    - Modifica del ciclo di vita del gateway o del bridge Node su macOS
summary: App companion macOS di OpenClaw (barra dei menu + broker del gateway)
title: App macOS
x-i18n:
    generated_at: "2026-04-24T08:51:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c7911d0a2e7be7fa437c5ef01a98c0f7da5e44388152ba182581cd2e381ba8b
    source_path: platforms/macos.md
    workflow: 15
---

L'app macOS è il **companion nella barra dei menu** per OpenClaw. Gestisce i permessi,
amministra/si collega al Gateway in locale (launchd o manuale) ed espone le
capacità macOS all'agente come Node.

## Cosa fa

- Mostra notifiche native e stato nella barra dei menu.
- Gestisce i prompt TCC (Notifiche, Accessibilità, Registrazione schermo, Microfono,
  Riconoscimento vocale, Automation/AppleScript).
- Esegue o si collega al Gateway (locale o remoto).
- Espone strumenti specifici di macOS (Canvas, Camera, Screen Recording, `system.run`).
- Avvia il servizio host Node locale in modalità **remote** (launchd) e lo arresta in modalità **local**.
- Può facoltativamente ospitare **PeekabooBridge** per l'automazione dell'interfaccia.
- Installa la CLI globale (`openclaw`) su richiesta tramite npm, pnpm o bun (l'app preferisce npm, poi pnpm, poi bun; Node resta il runtime consigliato per il Gateway).

## Modalità locale vs remota

- **Local** (predefinita): l'app si collega a un Gateway locale già in esecuzione, se presente;
  altrimenti abilita il servizio launchd tramite `openclaw gateway install`.
- **Remote**: l'app si collega a un Gateway tramite SSH/Tailscale e non avvia mai
  un processo locale.
  L'app avvia il **servizio host Node** locale in modo che il Gateway remoto possa raggiungere questo Mac.
  L'app non avvia il Gateway come processo figlio.
  Il rilevamento del Gateway ora preferisce i nomi Tailscale MagicDNS agli IP tailnet grezzi,
  così l'app Mac si riprende in modo più affidabile quando gli IP tailnet cambiano.

## Controllo launchd

L'app gestisce un LaunchAgent per utente con etichetta `ai.openclaw.gateway`
(o `ai.openclaw.<profile>` quando si usa `--profile`/`OPENCLAW_PROFILE`; il legacy `com.openclaw.*` viene comunque scaricato).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Sostituisci l'etichetta con `ai.openclaw.<profile>` quando esegui un profilo con nome.

Se il LaunchAgent non è installato, abilitalo dall'app oppure esegui
`openclaw gateway install`.

## Capacità del Node (mac)

L'app macOS si presenta come un Node. Comandi comuni:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Schermo: `screen.snapshot`, `screen.record`
- Sistema: `system.run`, `system.notify`

Il Node riporta una mappa `permissions` così gli agenti possono decidere cosa è consentito.

Servizio Node + IPC dell'app:

- Quando il servizio host Node headless è in esecuzione (modalità remota), si collega al Gateway WS come Node.
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
Security + ask + allowlist sono memorizzati localmente sul Mac in:

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

- Le voci `allowlist` sono pattern glob per percorsi binari risolti.
- Il testo grezzo dei comandi shell che contiene sintassi di controllo o espansione della shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) viene trattato come mancata corrispondenza della allowlist e richiede approvazione esplicita (oppure l'inserimento del binario shell nella allowlist).
- Scegliere “Always Allow” nel prompt aggiunge quel comando alla allowlist.
- Gli override dell'ambiente di `system.run` vengono filtrati (rimuove `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) e poi uniti con l'ambiente dell'app.
- Per i wrapper shell (`bash|sh|zsh ... -c/-lc`), gli override dell'ambiente con ambito richiesta vengono ridotti a una piccola allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Per decisioni allow-always in modalità allowlist, i wrapper di dispatch noti (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistono i percorsi dell'eseguibile interno invece dei percorsi del wrapper. Se l'unwrapping non è sicuro, nessuna voce allowlist viene persistita automaticamente.

## Deep link

L'app registra lo schema URL `openclaw://` per azioni locali.

### `openclaw://agent`

Attiva una richiesta `agent` al Gateway.
__OC_I18N_900004__
Parametri query:

- `message` (obbligatorio)
- `sessionKey` (facoltativo)
- `thinking` (facoltativo)
- `deliver` / `to` / `channel` (facoltativi)
- `timeoutSeconds` (facoltativo)
- `key` (facoltativo, modalità unattended)

Sicurezza:

- Senza `key`, l'app richiede conferma.
- Senza `key`, l'app applica un limite breve al messaggio per il prompt di conferma e ignora `deliver` / `to` / `channel`.
- Con una `key` valida, l'esecuzione è unattended (pensata per automazioni personali).

## Flusso tipico di onboarding

1. Installa e avvia **OpenClaw.app**.
2. Completa la checklist dei permessi (prompt TCC).
3. Assicurati che la modalità **Local** sia attiva e che il Gateway sia in esecuzione.
4. Installa la CLI se vuoi accesso da terminale.

## Posizionamento della directory di stato (macOS)

Evita di collocare la directory di stato di OpenClaw in iCloud o in altre cartelle sincronizzate nel cloud.
I percorsi supportati dalla sincronizzazione possono aggiungere latenza e occasionalmente causare race di lock/sync dei file per
sessioni e credenziali.

Preferisci un percorso di stato locale non sincronizzato come:
__OC_I18N_900005__
Se `openclaw doctor` rileva lo stato sotto:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

emetterà un avviso e consiglierà di tornare a un percorso locale.

## Flusso di build e sviluppo (nativo)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (oppure Xcode)
- Crea il pacchetto dell'app: `scripts/package-mac-app.sh`

## Debug della connettività del gateway (CLI macOS)

Usa la CLI di debug per esercitare lo stesso handshake WebSocket del Gateway e la stessa logica di discovery
usati dall'app macOS, senza avviare l'app.
__OC_I18N_900006__
Opzioni di connect:

- `--url <ws://host:port>`: override della configurazione
- `--mode <local|remote>`: risolvi dalla configurazione (predefinito: config o locale)
- `--probe`: forza una probe di stato nuova
- `--timeout <ms>`: timeout della richiesta (predefinito: `15000`)
- `--json`: output strutturato per il confronto

Opzioni di discovery:

- `--include-local`: include gateway che verrebbero filtrati come “local”
- `--timeout <ms>`: finestra complessiva di discovery (predefinito: `2000`)
- `--json`: output strutturato per il confronto

Suggerimento: confronta con `openclaw gateway discover --json` per vedere se la
pipeline di discovery dell'app macOS (`local.` più il dominio wide-area configurato, con
fallback wide-area e Tailscale Serve) differisce dalla
discovery basata su `dns-sd` della CLI Node.

## Infrastruttura di connessione remota (tunnel SSH)

Quando l'app macOS viene eseguita in modalità **Remote**, apre un tunnel SSH in modo che i componenti UI locali
possano parlare con un Gateway remoto come se fosse su localhost.

### Tunnel di controllo (porta WebSocket del Gateway)

- **Scopo:** health check, stato, Web Chat, configurazione e altre chiamate del control plane.
- **Porta locale:** la porta del Gateway (predefinita `18789`), sempre stabile.
- **Porta remota:** la stessa porta del Gateway sull'host remoto.
- **Comportamento:** nessuna porta locale casuale; l'app riutilizza un tunnel esistente sano
  oppure lo riavvia se necessario.
- **Forma SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` con opzioni BatchMode +
  ExitOnForwardFailure + keepalive.
- **Segnalazione IP:** il tunnel SSH usa il loopback, quindi il gateway vedrà l'IP del Node
  come `127.0.0.1`. Usa il trasporto **Direct (ws/wss)** se vuoi che compaia
  il vero IP del client (vedi [macOS remote access](/it/platforms/mac/remote)).

Per i passaggi di configurazione, vedi [macOS remote access](/it/platforms/mac/remote). Per i dettagli
del protocollo, vedi [Gateway protocol](/it/gateway/protocol).

## Documentazione correlata

- [Gateway runbook](/it/gateway)
- [Gateway (macOS)](/it/platforms/mac/bundled-gateway)
- [macOS permissions](/it/platforms/mac/permissions)
- [Canvas](/it/platforms/mac/canvas)
