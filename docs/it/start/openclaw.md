---
read_when:
    - Configurazione iniziale di una nuova istanza dell'assistente
    - Esame delle implicazioni per sicurezza e autorizzazioni
summary: Guida completa per eseguire OpenClaw come assistente personale con avvertenze di sicurezza
title: Configurazione dell'assistente personale
x-i18n:
    generated_at: "2026-04-30T09:13:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0614272f9a2b30e0900c55b39a8bd6a2b71b9f5d5fbf0fe00c534b91193e6a0
    source_path: start/openclaw.md
    workflow: 16
---

# Creare un assistente personale con OpenClaw

OpenClaw è un gateway self-hosted che collega Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e altri canali ad agenti IA. Questa guida copre la configurazione "assistente personale": un numero WhatsApp dedicato che si comporta come il tuo assistente IA sempre attivo.

## ⚠️ Prima la sicurezza

Stai mettendo un agente nella condizione di:

- eseguire comandi sulla tua macchina (a seconda della tua policy sugli strumenti)
- leggere/scrivere file nel tuo workspace
- inviare messaggi verso l’esterno tramite WhatsApp/Telegram/Discord/Mattermost e altri canali inclusi

Inizia in modo conservativo:

- Imposta sempre `channels.whatsapp.allowFrom` (non esporre mai il tuo Mac personale al mondo intero).
- Usa un numero WhatsApp dedicato per l’assistente.
- Gli Heartbeat ora sono impostati per impostazione predefinita ogni 30 minuti. Disattivali finché non ti fidi della configurazione impostando `agents.defaults.heartbeat.every: "0m"`.

## Prerequisiti

- OpenClaw installato e configurato — vedi [Per iniziare](/it/start/getting-started) se non l’hai ancora fatto
- Un secondo numero di telefono (SIM/eSIM/prepagata) per l’assistente

## La configurazione con due telefoni (consigliata)

Vuoi ottenere questo:

```mermaid
flowchart TB
    A["<b>Your Phone (personal)<br></b><br>Your WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Second Phone (assistant)<br></b><br>Assistant WA<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Your Mac (openclaw)<br></b><br>AI agent"]
```

Se colleghi il tuo WhatsApp personale a OpenClaw, ogni messaggio diretto a te diventa “input dell’agente”. Raramente è ciò che vuoi.

## Avvio rapido in 5 minuti

1. Associa WhatsApp Web (mostra un QR; scansionalo con il telefono dell’assistente):

```bash
openclaw channels login
```

2. Avvia il Gateway (lascialo in esecuzione):

```bash
openclaw gateway --port 18789
```

3. Inserisci una configurazione minima in `~/.openclaw/openclaw.json`:

```json5
{
  gateway: { mode: "local" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Ora invia un messaggio al numero dell’assistente dal telefono inserito nella allowlist.

Al termine dell’onboarding, OpenClaw apre automaticamente la dashboard e stampa un link pulito (non tokenizzato). Se la dashboard richiede l’autenticazione, incolla il segreto condiviso configurato nelle impostazioni della Control UI. L’onboarding usa un token per impostazione predefinita (`gateway.auth.token`), ma funziona anche l’autenticazione con password se hai cambiato `gateway.auth.mode` in `password`. Per riaprire in seguito: `openclaw dashboard`.

## Dai all’agente un workspace (AGENTS)

OpenClaw legge le istruzioni operative e la “memoria” dalla sua directory workspace.

Per impostazione predefinita, OpenClaw usa `~/.openclaw/workspace` come workspace dell’agente e lo creerà (insieme ai file iniziali `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`) automaticamente durante la configurazione o alla prima esecuzione dell’agente. `BOOTSTRAP.md` viene creato solo quando il workspace è completamente nuovo (non dovrebbe ricomparire dopo che lo elimini). `MEMORY.md` è facoltativo (non viene creato automaticamente); quando è presente, viene caricato per le sessioni normali. Le sessioni dei subagenti iniettano solo `AGENTS.md` e `TOOLS.md`.

<Tip>
Tratta questa cartella come la memoria di OpenClaw e rendila un repository git (idealmente privato) in modo che il tuo `AGENTS.md` e i file di memoria siano sottoposti a backup. Se git è installato, i workspace appena creati vengono inizializzati automaticamente.
</Tip>

```bash
openclaw setup
```

Layout completo del workspace + guida al backup: [Workspace dell’agente](/it/concepts/agent-workspace)
Workflow della memoria: [Memoria](/it/concepts/memory)

Facoltativo: scegli un workspace diverso con `agents.defaults.workspace` (supporta `~`).

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

Se distribuisci già i tuoi file workspace da un repository, puoi disabilitare completamente la creazione dei file di bootstrap:

```json5
{
  agents: {
    defaults: {
      skipBootstrap: true,
    },
  },
}
```

## La configurazione che lo trasforma in "un assistente"

OpenClaw usa per impostazione predefinita una buona configurazione da assistente, ma di solito vorrai personalizzare:

- persona/istruzioni in [`SOUL.md`](/it/concepts/soul)
- impostazioni predefinite di ragionamento (se desiderato)
- Heartbeat (quando ti fidi della configurazione)

Esempio:

```json5
{
  logging: { level: "info" },
  agent: {
    model: "anthropic/claude-opus-4-6",
    workspace: "~/.openclaw/workspace",
    thinkingDefault: "high",
    timeoutSeconds: 1800,
    // Start with 0; enable later.
    heartbeat: { every: "0m" },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  routing: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"],
    },
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080,
    },
  },
}
```

## Sessioni e memoria

- File di sessione: `~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- Metadati di sessione (uso dei token, ultima route, ecc.): `~/.openclaw/agents/<agentId>/sessions/sessions.json` (legacy: `~/.openclaw/sessions/sessions.json`)
- `/new` o `/reset` avvia una nuova sessione per quella chat (configurabile tramite `resetTriggers`). Se inviato da solo, OpenClaw conferma il reset senza invocare il modello.
- `/compact [instructions]` compatta il contesto della sessione e riporta il budget di contesto rimanente.

## Heartbeat (modalità proattiva)

Per impostazione predefinita, OpenClaw esegue un Heartbeat ogni 30 minuti con il prompt:
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
Imposta `agents.defaults.heartbeat.every: "0m"` per disabilitarlo.

- Se `HEARTBEAT.md` esiste ma è di fatto vuoto (solo righe vuote e intestazioni markdown come `# Heading`), OpenClaw salta l’esecuzione dell’Heartbeat per risparmiare chiamate API.
- Se il file manca, l’Heartbeat viene comunque eseguito e il modello decide cosa fare.
- Se l’agente risponde con `HEARTBEAT_OK` (facoltativamente con un breve padding; vedi `agents.defaults.heartbeat.ackMaxChars`), OpenClaw sopprime la consegna in uscita per quell’Heartbeat.
- Per impostazione predefinita, la consegna degli Heartbeat a destinazioni in stile DM `user:<id>` è consentita. Imposta `agents.defaults.heartbeat.directPolicy: "block"` per sopprimere la consegna a destinazione diretta mantenendo attive le esecuzioni degli Heartbeat.
- Gli Heartbeat eseguono turni completi dell’agente: intervalli più brevi consumano più token.

```json5
{
  agent: {
    heartbeat: { every: "30m" },
  },
}
```

## Media in entrata e in uscita

Gli allegati in entrata (immagini/audio/documenti) possono essere esposti al tuo comando tramite template:

- `{{MediaPath}}` (percorso file temporaneo locale)
- `{{MediaUrl}}` (pseudo-URL)
- `{{Transcript}}` (se la trascrizione audio è abilitata)

Allegati in uscita dall’agente: includi `MEDIA:<path-or-url>` su una riga dedicata (senza spazi). Esempio:

```
Here’s the screenshot.
MEDIA:https://example.com/screenshot.png
```

OpenClaw li estrae e li invia come media insieme al testo.

Il comportamento dei percorsi locali segue lo stesso modello di fiducia per la lettura dei file dell’agente:

- Se `tools.fs.workspaceOnly` è `true`, i percorsi locali `MEDIA:` in uscita restano limitati alla root temporanea di OpenClaw, alla cache dei media, ai percorsi del workspace dell’agente e ai file generati dalla sandbox.
- Se `tools.fs.workspaceOnly` è `false`, `MEDIA:` in uscita può usare file locali dell’host che l’agente è già autorizzato a leggere.
- Gli invii locali dall’host consentono comunque solo media e tipi di documenti sicuri (immagini, audio, video, PDF e documenti Office). I file di testo semplice e quelli simili a segreti non vengono trattati come media inviabili.

Ciò significa che immagini/file generati fuori dal workspace possono ora essere inviati quando la tua policy fs consente già quelle letture, senza riaprire l’esfiltrazione arbitraria di allegati testuali dall’host.

## Checklist operativa

```bash
openclaw status          # local status (creds, sessions, queued events)
openclaw status --all    # full diagnosis (read-only, pasteable)
openclaw status --deep   # asks the gateway for a live health probe with channel probes when supported
openclaw health --json   # gateway health snapshot (WS; default can return a fresh cached snapshot)
```

I log si trovano in `/tmp/openclaw/` (predefinito: `openclaw-YYYY-MM-DD.log`).

## Passaggi successivi

- WebChat: [WebChat](/it/web/webchat)
- Operazioni Gateway: [Runbook del Gateway](/it/gateway)
- Cron + risvegli: [Job Cron](/it/automation/cron-jobs)
- Companion della barra dei menu macOS: [App macOS di OpenClaw](/it/platforms/macos)
- App nodo iOS: [App iOS](/it/platforms/ios)
- App nodo Android: [App Android](/it/platforms/android)
- Stato Windows: [Windows (WSL2)](/it/platforms/windows)
- Stato Linux: [App Linux](/it/platforms/linux)
- Sicurezza: [Sicurezza](/it/gateway/security)

## Correlati

- [Per iniziare](/it/start/getting-started)
- [Configurazione](/it/start/setup)
- [Panoramica dei canali](/it/channels)
