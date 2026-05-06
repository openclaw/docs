---
read_when:
    - Implementazione delle funzionalità dell'app macOS
    - Modifica del ciclo di vita del Gateway o del bridging dei Node su macOS
summary: App complementare macOS di OpenClaw (barra dei menu + broker Gateway)
title: app macOS
x-i18n:
    generated_at: "2026-05-06T09:01:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc67a88303073bb771fcec09e7366f710a6bd5500f584f8782232deaa69e599d
    source_path: platforms/macos.md
    workflow: 16
---

L’app macOS è il **companion nella barra dei menu** per OpenClaw. Gestisce le autorizzazioni,
gestisce/si collega al Gateway localmente (launchd o manuale) ed espone le
funzionalità macOS all’agente come nodo.

## Cosa fa

- Mostra notifiche native e stato nella barra dei menu.
- Gestisce le richieste TCC (Notifiche, Accessibilità, Registrazione schermo, Microfono,
  Riconoscimento vocale, Automazione/AppleScript).
- Esegue il Gateway o vi si connette (locale o remoto).
- Espone strumenti disponibili solo su macOS (Canvas, Camera, Screen Recording, `system.run`).
- Avvia il servizio host del nodo locale in modalità **remote** (launchd) e lo arresta in modalità **local**.
- Ospita facoltativamente **PeekabooBridge** per l’automazione dell’interfaccia utente.
- Installa la CLI globale (`openclaw`) su richiesta tramite npm, pnpm o bun (l’app preferisce npm, poi pnpm, poi bun; Node rimane il runtime consigliato per il Gateway).

## Modalità locale e remota

- **Local** (predefinita): l’app si collega a un Gateway locale in esecuzione, se presente;
  altrimenti abilita il servizio launchd tramite `openclaw gateway install`.
- **Remote**: l’app si connette a un Gateway tramite SSH/Tailscale e non avvia mai
  un processo locale.
  L’app avvia il **servizio host del nodo** locale in modo che il Gateway remoto possa raggiungere questo Mac.
  L’app non genera il Gateway come processo figlio.
  Il rilevamento del Gateway ora preferisce i nomi Tailscale MagicDNS rispetto agli IP tailnet grezzi,
  quindi l’app Mac si ripristina in modo più affidabile quando gli IP tailnet cambiano.

## Controllo launchd

L’app gestisce un LaunchAgent per utente con etichetta `ai.openclaw.gateway`
(o `ai.openclaw.<profile>` quando si usa `--profile`/`OPENCLAW_PROFILE`; il legacy `com.openclaw.*` viene ancora scaricato).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Sostituisci l’etichetta con `ai.openclaw.<profile>` quando esegui un profilo con nome.

Se il LaunchAgent non è installato, abilitalo dall’app o esegui
`openclaw gateway install`.

## Funzionalità Node (mac)

L’app macOS si presenta come un nodo. Comandi comuni:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Schermo: `screen.snapshot`, `screen.record`
- Sistema: `system.run`, `system.notify`

Il nodo segnala una mappa `permissions` così gli agenti possono decidere cosa è consentito.

Servizio Node + IPC dell’app:

- Quando il servizio host del nodo headless è in esecuzione (modalità remota), si connette al Gateway WS come nodo.
- `system.run` viene eseguito nell’app macOS (contesto UI/TCC) tramite un socket Unix locale; richieste e output restano nell’app.

Diagramma (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Approvazioni exec (system.run)

`system.run` è controllato dalle **approvazioni exec** nell’app macOS (Impostazioni → Approvazioni exec).
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
- Il testo grezzo di un comando shell che contiene sintassi di controllo o espansione della shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) viene trattato come mancata corrispondenza della allowlist e richiede approvazione esplicita (oppure l’inserimento del binario della shell nella allowlist).
- Scegliere "Always Allow" nella richiesta aggiunge quel comando alla allowlist.
- Gli override dell’ambiente di `system.run` vengono filtrati (rimuove `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) e poi uniti all’ambiente dell’app.
- Per i wrapper shell (`bash|sh|zsh ... -c/-lc`), gli override dell’ambiente con ambito richiesta vengono ridotti a una piccola allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Per le decisioni di consenso permanente in modalità allowlist, i wrapper di dispatch noti (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) salvano i percorsi degli eseguibili interni invece dei percorsi dei wrapper. Se l’estrazione non è sicura, nessuna voce allowlist viene salvata automaticamente.

## Deep link

L’app registra lo schema URL `openclaw://` per azioni locali.

### `openclaw://agent`

Attiva una richiesta `agent` del Gateway.
__OC_I18N_900004__
Parametri query:

- `message` (obbligatorio)
- `sessionKey` (facoltativo)
- `thinking` (facoltativo)
- `deliver` / `to` / `channel` (facoltativo)
- `timeoutSeconds` (facoltativo)
- `key` (chiave facoltativa per modalità non presidiata)

Sicurezza:

- Senza `key`, l’app richiede conferma.
- Senza `key`, l’app applica un limite breve al messaggio per la richiesta di conferma e ignora `deliver` / `to` / `channel`.
- Con una `key` valida, l’esecuzione non è presidiata (pensata per automazioni personali).

## Flusso di onboarding (tipico)

1. Installa e avvia **OpenClaw.app**.
2. Completa la checklist delle autorizzazioni (richieste TCC).
3. Assicurati che la modalità **Local** sia attiva e che il Gateway sia in esecuzione.
4. Installa la CLI se vuoi accesso da terminale.

## Posizionamento della directory di stato (macOS)

Evita di mettere la directory di stato di OpenClaw in iCloud o in altre cartelle sincronizzate con il cloud.
I percorsi basati su sincronizzazione possono aggiungere latenza e occasionalmente causare race di file-lock/sincronizzazione per
sessioni e credenziali.

Preferisci un percorso di stato locale non sincronizzato, come:
__OC_I18N_900005__
Se `openclaw doctor` rileva stato sotto:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

mostrerà un avviso e consiglierà di tornare a un percorso locale.

## Workflow di build e sviluppo (nativo)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (o Xcode)
- Pacchetta l’app: `scripts/package-mac-app.sh`

## Debug della connettività Gateway (CLI macOS)

Usa la CLI di debug per esercitare lo stesso handshake WebSocket del Gateway e la stessa logica di rilevamento
usati dall’app macOS, senza avviare l’app.
__OC_I18N_900006__
Opzioni di connessione:

- `--url <ws://host:port>`: sovrascrive la configurazione
- `--mode <local|remote>`: risolve dalla configurazione (predefinito: configurazione o locale)
- `--probe`: forza un nuovo probe di salute
- `--timeout <ms>`: timeout della richiesta (predefinito: `15000`)
- `--json`: output strutturato per confronti

Opzioni di rilevamento:

- `--include-local`: include gateway che verrebbero filtrati come "local"
- `--timeout <ms>`: finestra complessiva di rilevamento (predefinito: `2000`)
- `--json`: output strutturato per confronti

<Tip>
Confronta con `openclaw gateway discover --json` per vedere se la pipeline di rilevamento dell’app macOS (`local.` più il dominio wide-area configurato, con fallback wide-area e Tailscale Serve) differisce dal rilevamento basato su `dns-sd` della CLI Node.
</Tip>

## Plumbing della connessione remota (tunnel SSH)

Quando l’app macOS viene eseguita in modalità **Remote**, apre un tunnel SSH in modo che i componenti UI locali
possano parlare con un Gateway remoto come se fosse su localhost.

### Tunnel di controllo (porta WebSocket del Gateway)

- **Scopo:** health check, stato, Web Chat, configurazione e altre chiamate del piano di controllo.
- **Porta locale:** la porta del Gateway (predefinita `18789`), sempre stabile.
- **Porta remota:** la stessa porta del Gateway sull’host remoto.
- **Comportamento:** nessuna porta locale casuale; l’app riutilizza un tunnel sano esistente
  o lo riavvia se necessario.
- **Forma SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` con BatchMode +
  ExitOnForwardFailure + opzioni keepalive.
- **Segnalazione IP:** il tunnel SSH usa loopback, quindi il gateway vedrà l’IP del nodo
  come `127.0.0.1`. Usa il trasporto **Direct (ws/wss)** se vuoi che compaia l’IP reale del client
  (vedi [accesso remoto macOS](/it/platforms/mac/remote)).

Per i passaggi di configurazione, vedi [accesso remoto macOS](/it/platforms/mac/remote). Per i dettagli del protocollo,
vedi [protocollo Gateway](/it/gateway/protocol).

## Documenti correlati

- [Runbook Gateway](/it/gateway)
- [Gateway (macOS)](/it/platforms/mac/bundled-gateway)
- [Autorizzazioni macOS](/it/platforms/mac/permissions)
- [Canvas](/it/platforms/mac/canvas)
