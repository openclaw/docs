---
read_when:
    - Implementazione di funzionalità dell'app macOS
    - Modifica del ciclo di vita del Gateway o del bridging di Node su macOS
summary: App complementare macOS di OpenClaw (barra dei menu + broker del Gateway)
title: app macOS
x-i18n:
    generated_at: "2026-04-30T09:01:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ed98cd4865f2117728d4349c9be99d9c2e20f4d86a77c80f5ba0b5520eb81cd
    source_path: platforms/macos.md
    workflow: 16
---

L’app macOS è il **compagno da barra dei menu** per OpenClaw. Gestisce le autorizzazioni,
gestisce/si collega localmente al Gateway (launchd o manuale) ed espone le
funzionalità macOS all’agente come Node.

## Cosa fa

- Mostra notifiche native e lo stato nella barra dei menu.
- Gestisce i prompt TCC (Notifiche, Accessibilità, Registrazione schermo, Microfono,
  Riconoscimento vocale, Automazione/AppleScript).
- Esegue o si connette al Gateway (locale o remoto).
- Espone strumenti disponibili solo su macOS (Canvas, Fotocamera, Registrazione schermo, `system.run`).
- Avvia il servizio host Node locale in modalità **remote** (launchd) e lo arresta in modalità **local**.
- Può opzionalmente ospitare **PeekabooBridge** per l’automazione dell’interfaccia utente.
- Installa la CLI globale (`openclaw`) su richiesta tramite npm, pnpm o bun (l’app preferisce npm, poi pnpm, poi bun; Node rimane il runtime consigliato per il Gateway).

## Modalità locale e remota

- **Local** (predefinita): l’app si collega a un Gateway locale in esecuzione, se presente;
  altrimenti abilita il servizio launchd tramite `openclaw gateway install`.
- **Remote**: l’app si connette a un Gateway tramite SSH/Tailscale e non avvia mai
  un processo locale.
  L’app avvia il **servizio host Node** locale così che il Gateway remoto possa raggiungere questo Mac.
  L’app non genera il Gateway come processo figlio.
  La scoperta del Gateway ora preferisce i nomi Tailscale MagicDNS agli IP tailnet grezzi,
  così l’app Mac si ripristina in modo più affidabile quando gli IP tailnet cambiano.

## Controllo launchd

L’app gestisce un LaunchAgent per utente etichettato `ai.openclaw.gateway`
(o `ai.openclaw.<profile>` quando si usa `--profile`/`OPENCLAW_PROFILE`; il legacy `com.openclaw.*` viene comunque scaricato).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Sostituisci l’etichetta con `ai.openclaw.<profile>` quando esegui un profilo denominato.

Se il LaunchAgent non è installato, abilitalo dall’app oppure esegui
`openclaw gateway install`.

## Capacità Node (Mac)

L’app macOS si presenta come Node. Comandi comuni:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Fotocamera: `camera.snap`, `camera.clip`
- Schermo: `screen.snapshot`, `screen.record`
- Sistema: `system.run`, `system.notify`

Il Node riporta una mappa `permissions` così gli agenti possono decidere cosa è consentito.

Servizio Node + IPC dell’app:

- Quando il servizio host Node headless è in esecuzione (modalità remota), si connette al Gateway WS come Node.
- `system.run` viene eseguito nell’app macOS (contesto UI/TCC) tramite un socket Unix locale; prompt e output restano nell’app.

Diagramma (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Approvazioni di esecuzione (system.run)

`system.run` è controllato dalle **approvazioni di esecuzione** nell’app macOS (Impostazioni → Approvazioni di esecuzione).
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

- Le voci `allowlist` sono pattern glob per percorsi binari risolti, oppure nomi di comandi semplici per comandi invocati tramite PATH.
- Il testo grezzo di un comando shell che contiene sintassi di controllo o espansione della shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) viene trattato come mancata corrispondenza dell’allowlist e richiede approvazione esplicita (o l’inserimento del binario della shell nell’allowlist).
- Scegliere “Consenti sempre” nel prompt aggiunge quel comando all’allowlist.
- Gli override dell’ambiente di `system.run` vengono filtrati (rimuove `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) e poi uniti all’ambiente dell’app.
- Per i wrapper shell (`bash|sh|zsh ... -c/-lc`), gli override dell’ambiente con ambito di richiesta vengono ridotti a una piccola allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Per le decisioni di consenso permanente in modalità allowlist, i wrapper di dispatch noti (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistono i percorsi degli eseguibili interni invece dei percorsi dei wrapper. Se l’unwrapping non è sicuro, nessuna voce allowlist viene persistita automaticamente.

## Link diretti

L’app registra lo schema URL `openclaw://` per azioni locali.

### `openclaw://agent`

Attiva una richiesta `agent` del Gateway.
__OC_I18N_900004__
Parametri di query:

- `message` (obbligatorio)
- `sessionKey` (opzionale)
- `thinking` (opzionale)
- `deliver` / `to` / `channel` (opzionale)
- `timeoutSeconds` (opzionale)
- `key` (chiave opzionale per modalità non presidiata)

Sicurezza:

- Senza `key`, l’app richiede conferma.
- Senza `key`, l’app applica un limite breve al messaggio per il prompt di conferma e ignora `deliver` / `to` / `channel`.
- Con una `key` valida, l’esecuzione è non presidiata (pensata per automazioni personali).

## Flusso di onboarding (tipico)

1. Installa e avvia **OpenClaw.app**.
2. Completa la checklist delle autorizzazioni (prompt TCC).
3. Assicurati che la modalità **Local** sia attiva e che il Gateway sia in esecuzione.
4. Installa la CLI se vuoi l’accesso da terminale.

## Posizionamento della directory di stato (macOS)

Evita di mettere la directory di stato di OpenClaw in iCloud o in altre cartelle sincronizzate con il cloud.
I percorsi basati su sincronizzazione possono aggiungere latenza e occasionalmente causare race di blocco/sincronizzazione file per
sessioni e credenziali.

Preferisci un percorso di stato locale non sincronizzato come:
__OC_I18N_900005__
Se `openclaw doctor` rileva lo stato sotto:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

mostrerà un avviso e consiglierà di tornare a un percorso locale.

## Flusso di lavoro build e sviluppo (nativo)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (o Xcode)
- Pacchetto app: `scripts/package-mac-app.sh`

## Debug della connettività del Gateway (CLI macOS)

Usa la CLI di debug per esercitare la stessa logica di handshake e scoperta WebSocket del Gateway
usata dall’app macOS, senza avviare l’app.
__OC_I18N_900006__
Opzioni di connessione:

- `--url <ws://host:port>`: sovrascrivi la configurazione
- `--mode <local|remote>`: risolvi dalla configurazione (predefinito: configurazione o locale)
- `--probe`: forza un nuovo probe di salute
- `--timeout <ms>`: timeout della richiesta (predefinito: `15000`)
- `--json`: output strutturato per il confronto

Opzioni di scoperta:

- `--include-local`: includi i gateway che verrebbero filtrati come “locali”
- `--timeout <ms>`: finestra complessiva di scoperta (predefinito: `2000`)
- `--json`: output strutturato per il confronto

<Tip>
Confronta con `openclaw gateway discover --json` per vedere se la pipeline di scoperta dell’app macOS (`local.` più il dominio wide-area configurato, con fallback wide-area e Tailscale Serve) differisce dalla scoperta basata su `dns-sd` della CLI Node.
</Tip>

## Impianto della connessione remota (tunnel SSH)

Quando l’app macOS viene eseguita in modalità **Remote**, apre un tunnel SSH così i componenti UI locali
possono comunicare con un Gateway remoto come se fosse su localhost.

### Tunnel di controllo (porta WebSocket del Gateway)

- **Scopo:** controlli di salute, stato, Web Chat, configurazione e altre chiamate del piano di controllo.
- **Porta locale:** la porta del Gateway (predefinita `18789`), sempre stabile.
- **Porta remota:** la stessa porta del Gateway sull’host remoto.
- **Comportamento:** nessuna porta locale casuale; l’app riutilizza un tunnel sano esistente
  o lo riavvia se necessario.
- **Forma SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` con BatchMode +
  ExitOnForwardFailure + opzioni keepalive.
- **Segnalazione IP:** il tunnel SSH usa il loopback, quindi il gateway vedrà l’IP del Node
  come `127.0.0.1`. Usa il trasporto **Direct (ws/wss)** se vuoi che venga visualizzato l’IP reale del client
  (vedi [accesso remoto macOS](/it/platforms/mac/remote)).

Per i passaggi di configurazione, vedi [accesso remoto macOS](/it/platforms/mac/remote). Per i dettagli del protocollo,
vedi [protocollo Gateway](/it/gateway/protocol).

## Documenti correlati

- [Runbook Gateway](/it/gateway)
- [Gateway (macOS)](/it/platforms/mac/bundled-gateway)
- [Autorizzazioni macOS](/it/platforms/mac/permissions)
- [Canvas](/it/platforms/mac/canvas)
