---
read_when:
    - Implementazione di funzionalità dell'app macOS
    - Modifica del ciclo di vita del gateway o del bridging dei nodi su macOS
summary: App companion per macOS di OpenClaw (barra dei menu + broker del gateway)
title: app per macOS
x-i18n:
    generated_at: "2026-06-27T17:46:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e637a1ae5ca66dfb6255fb6a233436ae0cf04b972f96446e8dc3d703486c9fa
    source_path: platforms/macos.md
    workflow: 16
---

L'app macOS è il **companion nella barra dei menu** per OpenClaw. Gestisce i permessi,
gestisce/si collega al Gateway localmente (launchd o manuale) ed espone le
funzionalità macOS all'agente come nodo.

## Cosa fa

- Mostra notifiche native e stato nella barra dei menu.
- Gestisce i prompt TCC (Notifiche, Accessibilità, Registrazione schermo, Microfono,
  Riconoscimento vocale, Automazione/AppleScript).
- Esegue o si connette al Gateway (locale o remoto).
- Espone strumenti solo per macOS (Canvas, Fotocamera, Registrazione schermo, `system.run`).
- Avvia il servizio host del nodo locale in modalità **remota** (launchd) e lo arresta in modalità **locale**.
- Facoltativamente ospita **PeekabooBridge** per l'automazione dell'interfaccia utente.
- Installa la CLI globale (`openclaw`) su richiesta tramite npm, pnpm o bun (l'app preferisce npm, poi pnpm, poi bun; Node rimane il runtime consigliato per Gateway).

## Modalità locale e remota

- **Locale** (predefinita): l'app si collega a un Gateway locale in esecuzione, se presente;
  altrimenti abilita il servizio launchd tramite `openclaw gateway install`.
- **Remota**: l'app si connette a un Gateway tramite SSH/Tailscale e non avvia mai
  un processo locale.
  L'app avvia il **servizio host del nodo** locale in modo che il Gateway remoto possa raggiungere questo Mac.
  L'app non genera il Gateway come processo figlio.
  La scoperta del Gateway ora preferisce i nomi Tailscale MagicDNS rispetto agli IP tailnet grezzi,
  quindi l'app Mac recupera in modo più affidabile quando gli IP tailnet cambiano.

## Controllo launchd

L'app gestisce un LaunchAgent per utente etichettato `ai.openclaw.gateway`
(o `ai.openclaw.<profile>` quando si usa `--profile`/`OPENCLAW_PROFILE`; il legacy `com.openclaw.*` viene ancora scaricato).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Sostituisci l'etichetta con `ai.openclaw.<profile>` quando esegui un profilo con nome.

Se il LaunchAgent non è installato, abilitalo dall'app oppure esegui
`openclaw gateway install`.

Se il gateway scompare ripetutamente per minuti o ore e riprende solo quando tocchi l'interfaccia utente di controllo o accedi all'host tramite SSH, consulta la nota di risoluzione dei problemi per gli arresti anomali di macOS Maintenance Sleep / `ENETDOWN` e il gate di protezione dal respawn di launchd in [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#macos-gateway-silently-stops-responding-then-resumes-when-you-touch-the-dashboard).

## Funzionalità del nodo (Mac)

L'app macOS si presenta come nodo. Comandi comuni:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Fotocamera: `camera.snap`, `camera.clip`
- Schermo: `screen.snapshot`, `screen.record`
- Sistema: `system.run`, `system.notify`

Il nodo segnala una mappa `permissions` in modo che gli agenti possano decidere cosa è consentito.

Servizio nodo + IPC app:

- Quando il servizio host del nodo headless è in esecuzione (modalità remota), si connette al Gateway WS come nodo.
- `system.run` viene eseguito nell'app macOS (contesto UI/TCC) tramite un socket Unix locale; prompt e output restano nell'app.

Diagramma (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Approvazioni Exec (system.run)

`system.run` è controllato dalle **approvazioni Exec** nell'app macOS (Impostazioni → Approvazioni Exec).
Sicurezza + richiesta + allowlist sono archiviate localmente sul Mac in:

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

- Le voci `allowlist` sono pattern glob per percorsi binari risolti, oppure nomi di comando semplici per comandi invocati tramite PATH.
- Il testo grezzo del comando shell che contiene sintassi di controllo o espansione della shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) viene trattato come mancata corrispondenza dell'allowlist e richiede approvazione esplicita (o l'inserimento del binario shell nell'allowlist).
- Scegliere "Consenti sempre" nel prompt aggiunge quel comando all'allowlist.
- Gli override dell'ambiente di `system.run` vengono filtrati (rimuove `PATH`, `DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`) e poi uniti all'ambiente dell'app.
- Per wrapper shell (`bash|sh|zsh ... -c/-lc`), gli override dell'ambiente con ambito sulla richiesta sono ridotti a una piccola allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Per le decisioni consenti-sempre in modalità allowlist, i wrapper di dispatch noti (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) persistono i percorsi degli eseguibili interni invece dei percorsi dei wrapper. Se l'unwrapping non è sicuro, nessuna voce allowlist viene persistita automaticamente.

## Deep link

L'app registra lo schema URL `openclaw://` per azioni locali.

### `openclaw://agent`

Attiva una richiesta `agent` del Gateway.
__OC_I18N_900004__
Parametri di query:

- `message` (obbligatorio)
- `sessionKey` (facoltativo)
- `thinking` (facoltativo)
- `deliver` / `to` / `channel` (facoltativo)
- `timeoutSeconds` (facoltativo)
- `key` (chiave facoltativa per modalità non presidiata)

Sicurezza:

- Senza `key`, l'app richiede conferma.
- Senza `key`, l'app impone un limite breve per il messaggio nel prompt di conferma e ignora `deliver` / `to` / `channel`.
- Con una `key` valida, l'esecuzione è non presidiata (pensata per automazioni personali).

## Flusso di onboarding (tipico)

1. Installa e avvia **OpenClaw.app**.
2. Completa la checklist dei permessi (prompt TCC).
3. Assicurati che la modalità **Locale** sia attiva e che il Gateway sia in esecuzione.
4. Installa la CLI se vuoi l'accesso da terminale.

## Posizionamento della directory di stato (macOS)

Evita di mettere la tua directory di stato OpenClaw in iCloud o in altre cartelle sincronizzate nel cloud.
I percorsi con sincronizzazione possono aggiungere latenza e occasionalmente causare race di blocco file/sincronizzazione per
sessioni e credenziali.

Preferisci un percorso di stato locale non sincronizzato, ad esempio:
__OC_I18N_900005__
Se `openclaw doctor` rileva lo stato sotto:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

avviserà e consiglierà di tornare a un percorso locale.

## Workflow di build e sviluppo (nativo)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (o Xcode)
- Pacchetto app: `scripts/package-mac-app.sh`

## Debug della connettività Gateway (CLI macOS)

Usa la CLI di debug per esercitare la stessa logica di handshake e scoperta WebSocket del Gateway
usata dall'app macOS, senza avviare l'app.
__OC_I18N_900006__
Opzioni di connessione:

- `--url <ws://host:port>`: sovrascrivi la configurazione
- `--mode <local|remote>`: risolvi dalla configurazione (predefinito: configurazione o locale)
- `--probe`: forza un nuovo probe di integrità
- `--timeout <ms>`: timeout della richiesta (predefinito: `15000`)
- `--json`: output strutturato per il confronto

Opzioni di scoperta:

- `--include-local`: includi gateway che verrebbero filtrati come "locali"
- `--timeout <ms>`: finestra complessiva di scoperta (predefinito: `2000`)
- `--json`: output strutturato per il confronto

<Tip>
Confronta con `openclaw gateway discover --json` per vedere se la pipeline di scoperta dell'app macOS (`local.` più il dominio wide-area configurato, con fallback wide-area e Tailscale Serve) differisce dalla scoperta basata su `dns-sd` della CLI Node.
</Tip>

## Plumbing della connessione remota (tunnel SSH)

Quando l'app macOS viene eseguita in modalità **Remota**, apre un tunnel SSH in modo che i componenti dell'interfaccia utente locali
possano comunicare con un Gateway remoto come se fosse su localhost.

### Tunnel di controllo (porta WebSocket del Gateway)

- **Scopo:** controlli di integrità, stato, Chat Web, configurazione e altre chiamate del piano di controllo.
- **Porta locale:** la porta del Gateway (predefinita `18789`), sempre stabile.
- **Porta remota:** la stessa porta del Gateway sull'host remoto.
- **Comportamento:** nessuna porta locale casuale; l'app riutilizza un tunnel integro esistente
  oppure lo riavvia se necessario.
- **Forma SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` con BatchMode +
  ExitOnForwardFailure + opzioni keepalive.
- **Segnalazione IP:** il tunnel SSH usa loopback, quindi il gateway vedrà l'IP del nodo
  come `127.0.0.1`. Usa il trasporto **Direct (ws/wss)** se vuoi che appaia il vero IP client
  (vedi [accesso remoto macOS](/it/platforms/mac/remote)).

Per i passaggi di configurazione, vedi [accesso remoto macOS](/it/platforms/mac/remote). Per i dettagli del protocollo,
vedi [protocollo Gateway](/it/gateway/protocol).

## Documentazione correlata

- [Runbook Gateway](/it/gateway)
- [Gateway (macOS)](/it/platforms/mac/bundled-gateway)
- [Permessi macOS](/it/platforms/mac/permissions)
- [Canvas](/it/platforms/mac/canvas)
