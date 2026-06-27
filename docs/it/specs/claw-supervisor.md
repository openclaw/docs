---
read_when:
    - Progettare la supervisione della flotta Codex
    - Creare strumenti OpenClaw che leggono, guidano o avviano sessioni Codex
    - Scegliere tra distribuzione locale, Cloudflare e VPS per Codex supervisionato
summary: Piano di supervisione della flotta per le sessioni app-server di Codex controllate da OpenClaw.
title: Supervisore Claw
x-i18n:
    generated_at: "2026-06-27T18:15:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ecdd58730011c94796c6df1d757606aad7112d2f36f30921541ac7f5d46ad91f
    source_path: specs/claw-supervisor.md
    workflow: 16
---

# Supervisore Claw

## Obiettivo

Claw Supervisor consente a un'istanza OpenClaw sempre attiva di monitorare e guidare una flotta di sessioni Codex senza modificare la normale esperienza utente di Codex. Un utente può accedere a un host tramite SSH, avviare Codex, lavorare nella TUI e avere comunque il supervisore che legge la sessione, la guida, la interrompe, genera sessioni correlate e accetta passaggi di consegne. Le sessioni Codex possono anche richiamare OpenClaw tramite MCP.

## Modello di prodotto

Codex resta la superficie di lavoro principale. OpenClaw supervisiona Codex invece di nascondere Codex dentro un sottoagente OpenClaw opaco.

Il Plugin OpenClaw si chiama `codex-supervisor`. `crabfleet` resta il profilo di distribuzione
e flotta di host per le macchine CRAB invece del nome del Plugin riutilizzabile.

Il modello ha tre ruoli:

- Codex collegato a un umano: una normale TUI Codex interattiva avviata tramite un app-server condiviso.
- Codex autonomo: un thread app-server Codex generato dal supervisore a cui un umano può collegarsi in seguito.
- Claw supervisore: un agente OpenClaw sempre attivo con strumenti per stato della flotta, letture delle trascrizioni, guida, interruzione, generazione e passaggio di consegne.

OpenClaw può usare internamente il proprio meccanismo di sottoagenti esistente, ma il contratto esterno è una sessione Codex collegabile con un ID thread Codex.

## Architettura

```text
user SSH session
  -> codex --remote unix://... or ws://...
      -> local codex app-server daemon
          <-> host sidecar / supervisor connector
              <-> OpenClaw fleet supervisor
                  <-> supervisor MCP exposed back to Codex
```

Ogni host compatibile con Codex esegue:

- Daemon app-server Codex.
- Un launcher che avvia sempre Codex interattivo con `--remote`.
- Un connettore che registra endpoint app-server e thread attivi presso il supervisore.

Il supervisore esegue:

- Registro degli endpoint.
- Registro delle sessioni.
- Pool di client JSON-RPC per app-server Codex.
- Server MCP per chiamate da Codex a Claw.
- Strumenti OpenClaw per il controllo da Claw a Codex.
- Motore di policy per azioni autonome, approvazioni e prevenzione dei loop.

## Contratto app-server Codex

Usa le API app-server Codex come piano di controllo canonico:

- `initialize`, `initialized`
- `thread/loaded/list`
- `thread/list`
- `thread/read`
- `thread/resume`
- `thread/start`
- `turn/start`
- `turn/steer`
- `turn/interrupt`
- `model/list`

Codex interattivo deve essere avviato con `codex --remote <endpoint>` in modo che la TUI e il supervisore si connettano allo stesso app-server. `codex exec` autonomo oggi non è una sessione condivisa in tempo reale; usa le API app-server per il lavoro autonomo finché Codex non supporta `exec --remote`.

## Registro delle sessioni

Il supervisore archivia un record per ogni thread Codex osservato:

```json
{
  "sessionId": "codex-thread-id",
  "endpointId": "host-a",
  "host": "host-a.example",
  "workspace": "/workspace/repo",
  "repo": "owner/repo",
  "branch": "feature/example",
  "source": "vscode",
  "status": "idle",
  "humanAttached": true,
  "lastSeenAt": "2026-05-28T10:00:00.000Z",
  "summary": "Short working-state summary"
}
```

L'implementazione locale può derivare la maggior parte dei campi dai metadati del thread Codex. La distribuzione della flotta dovrebbe arricchire i record con identità dell'host, stato di collegamento dell'utente, stato git e salute del sidecar.

## Superficie MCP per Codex

Ogni Codex supervisionato riceve un server MCP chiamato `openclaw-codex-supervisor`.

Strumenti:

- `codex_sessions_list`: elenca le sessioni Codex visibili.
- `codex_session_read`: legge una trascrizione.
- `codex_session_send`: invia un messaggio a un thread inattivo o guida un thread attivo.
- `codex_session_interrupt`: interrompe il turno attivo.
- `codex_endpoint_probe`: verifica la connettività dell'endpoint.
- `claw_report_progress`: pubblica lo stato dell'attività corrente al supervisore.
- `claw_ask`: chiede aiuto o delega al supervisore.
- `codex_spawn`: crea una nuova sessione Codex autonoma.
- `codex_handoff`: richiede la presa in carico da parte di un umano o di un pari.

Risorse:

- `codex://sessions`
- `codex://sessions/{sessionId}`
- `codex://sessions/{sessionId}/transcript`

## Superficie di controllo Claw

Il Claw sempre attivo riceve le stesse primitive degli strumenti interni:

- elencare sessioni ed endpoint
- leggere trascrizioni
- inviare/guidare testo
- interrompere il lavoro attivo
- generare nuove sessioni
- riassumere e assegnare sessioni
- trasmettere istruzioni a un gruppo filtrato
- contrassegnare le sessioni come bloccate, completate o abbandonate

Comportamento degli strumenti:

- Se un thread di destinazione è inattivo, `codex_session_send` viene mappato a `turn/start`.
- Se un thread di destinazione è attivo e un ID turno in corso è visibile, viene mappato a `turn/steer`.
- Se non è possibile identificare il turno attivo, lo strumento fallisce in modo chiuso invece di creare un turno non correlato.
- I controlli di scrittura MCP esposti da Codex restano disabilitati a meno che una policy attendibile riservata al supervisore non li abiliti.
- Le letture grezze delle trascrizioni restano disabilitate a meno che una policy attendibile riservata al supervisore non le abiliti.
- Le approvazioni autonome negano per impostazione predefinita le approvazioni di strumenti/file a meno che una policy esplicita non dica diversamente.

## Flusso di avvio

Accesso interattivo all'host:

1. L'utente accede a un host CRAB tramite SSH.
2. Il servizio SSH avvia o verifica `codex app-server daemon start`.
3. Il wrapper di login avvia `codex --remote unix:// --cd <workspace>`.
4. Il connettore dell'host registra endpoint e thread caricato.
5. Il supervisore emette un evento di flotta ad alta priorità: nuova sessione Codex, workspace, stato collegato a un umano, anteprima dell'attività corrente.
6. Il Claw supervisore può leggere e guidare immediatamente.

Generazione autonoma:

1. Il supervisore seleziona host e workspace.
2. Il connettore dell'host apre o riprende un thread app-server Codex.
3. Il supervisore avvia il primo turno con testo dell'attività e configurazione MCP.
4. Il registro delle sessioni lo contrassegna come autonomo e collegabile.
5. Un umano può collegarsi in seguito con `codex --remote <endpoint> resume <threadId>` quando Codex supporterà quella UX esatta, oppure tramite il flusso di ripresa attuale sullo stesso app-server.

## Distribuzione

Piano di controllo preferito:

- I connettori degli host mantengono connessioni WebSocket in uscita verso il supervisore.
- Lo stato del supervisore risiede nello storage del Gateway OpenClaw.
- L'app-server Codex resta locale a ciascun host; non esporre mai un app-server grezzo non autenticato a Internet pubblico.

Idoneità di Cloudflare:

- Buono per registro, oggetti durevoli, aggregazione WebSocket, routing leggero degli eventi ed endpoint MCP/Gateway pubblici.
- Non sufficiente da solo per il controllo diretto di host privati perché i Worker non possono chiamare socket Unix privati arbitrari o app-server local loopback.
- Usa Cloudflare quando ogni connettore host chiama casa tramite WebSocket in uscita.

Fallback VPS:

- Usa un servizio Hetzner quando sono necessari controllo di processi di lunga durata, tunnel SSH, routing di rete privata o accesso al filesystem locale.
- Mantieni lo stesso protocollo: connettori host in uscita, registro supervisore centrale, app-server Codex locale.

## Sicurezza

- Il bind predefinito è un socket Unix locale.
- L'app-server remoto usa autenticazione con token o bearer firmato.
- Il connettore host si autentica al supervisore con un token host con ambito.
- Gli strumenti del supervisore applicano policy per sessione: lettura, guida, interruzione, generazione, approvazione.
- I messaggi tra agenti includono `originSessionId`; l'eco verso sé stessi viene scartata.
- La trasmissione richiede un filtro esplicito e un numero di destinatari limitato.
- Le letture delle trascrizioni oscurano i segreti al confine OpenClaw.
- Le richieste di approvazione sono negate per impostazione predefinita per i turni originati dal supervisore, salvo se la policy le consente.

## Piano di implementazione

Fase 1: MVP supervisore locale

- Aggiungere client JSON-RPC app-server Codex per proxy stdio ed endpoint WebSocket.
- Aggiungere registro endpoint/sessioni del supervisore.
- Aggiungere strumenti MCP: elenco, lettura, invio, interruzione, probe.
- Aggiungere configurazione env locale per gli endpoint.
- Aggiungere test con app-server finto e uno smoke test locale live dell'app-server.

Fase 2: Integrazione OpenClaw

- Registrare gli strumenti del supervisore nel Plugin `codex-supervisor`.
- Iniettare MCP del supervisore nella configurazione del thread Codex.
- Aggiungere riassunti delle sessioni al contesto dell'agente.
- Aggiungere notifiche di eventi quando compaiono nuovi thread Codex.
- Aggiungere configurazione di policy per invio/interruzione/generazione autonomi.

Fase 3: Connettore di flotta

- Il sidecar dell'host registra endpoint app-server, metadati host, metadati git/workspace e stato di collegamento umano.
- Aggiungere connettore WebSocket in uscita per piano di controllo Cloudflare o VPS.
- Aggiungere riconnessione, Heartbeat e pulizia delle sessioni obsolete.
- Aggiungere wrapper launcher SSH CRAB.

Fase 4: Operazione autonoma

- Aggiungere flussi di generazione/ripresa/presa in carico.
- Aggiungere trasmissione e delega.
- Aggiungere report di avanzamento e riassunti dello stato delle attività.
- Aggiungere prevenzione dei loop e limiti di frequenza.
- Aggiungere viste dashboard.

Fase 5: Multi-Claw

- Partizionare le sessioni per gruppo.
- Aggiungere leadership/lease per ogni sessione.
- Aggiungere log di audit e replay.
- Aggiungere escalation tra gruppi Claw.

## Test di accettazione

- Un umano avvia la TUI Codex tramite un app-server condiviso.
- Il supervisore elenca il thread live tramite `thread/loaded/list`.
- Il supervisore legge la trascrizione tramite `thread/read`.
- Il supervisore invia testo a un thread inattivo tramite `turn/start`.
- Il supervisore guida un thread attivo tramite `turn/steer`.
- L'interruzione del supervisore ferma un turno attivo tramite `turn/interrupt`.
- Codex chiama l'MCP del supervisore ed elenca le sessioni pari.
- Un Codex autonomo viene generato e in seguito collegato a un umano.
- Un connettore host perso contrassegna le sessioni come obsolete senza eliminare la cronologia.

## Domande aperte

- UX esatta di collegamento della TUI Codex per un thread app-server generato senza TUI.
- Se Codex debba aggiungere `exec --remote` per esecuzioni headless condivise live.
- Proprietario dello stato durevole: DB del Gateway OpenClaw, Cloudflare Durable Object o database VPS.
- Granularità della policy di approvazione per turni originati dal supervisore.
- Quanta parte del riassunto della trascrizione debba essere iniettata nel contesto del Claw sempre attivo rispetto a essere mantenuta come strumento/risorsa.
