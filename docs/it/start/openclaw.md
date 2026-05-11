---
read_when:
    - Configurazione iniziale di una nuova istanza dell'assistente
    - Esame delle implicazioni relative a sicurezza e autorizzazioni
summary: Guida completa per eseguire OpenClaw come assistente personale con avvertenze di sicurezza
title: Configurazione dell'assistente personale
x-i18n:
    generated_at: "2026-05-11T20:35:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 74dd13c4b43faa8e29e1fd56a355f36c6cf7c3fa8193bb62c1056211933f4df9
    source_path: start/openclaw.md
    workflow: 16
---

OpenClaw è un gateway self-hosted che collega Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e altro ancora ad agenti AI. Questa guida copre la configurazione da "assistente personale": un numero WhatsApp dedicato che si comporta come il tuo assistente AI sempre attivo.

## ⚠️ Prima la sicurezza

Stai mettendo un agente nella posizione di:

- eseguire comandi sulla tua macchina (a seconda della tua policy sugli strumenti)
- leggere/scrivere file nel tuo workspace
- inviare messaggi verso l'esterno tramite WhatsApp/Telegram/Discord/Mattermost e altri canali inclusi

Inizia in modo prudente:

- Imposta sempre `channels.whatsapp.allowFrom` (non eseguirlo mai aperto a tutto il mondo sul tuo Mac personale).
- Usa un numero WhatsApp dedicato per l'assistente.
- Gli Heartbeat ora sono predefiniti ogni 30 minuti. Disabilitali finché non ti fidi della configurazione impostando `agents.defaults.heartbeat.every: "0m"`.

## Prerequisiti

- OpenClaw installato e configurato con onboarding: consulta [Per iniziare](/it/start/getting-started) se non l'hai ancora fatto
- Un secondo numero di telefono (SIM/eSIM/prepagata) per l'assistente

## Configurazione con due telefoni (consigliata)

Vuoi questo:

```mermaid
flowchart TB
    A["<b>Your Phone (personal)<br></b><br>Your WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Second Phone (assistant)<br></b><br>Assistant WA<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Your Mac (openclaw)<br></b><br>AI agent"]
```

Se colleghi il tuo WhatsApp personale a OpenClaw, ogni messaggio indirizzato a te diventa "input dell'agente". Raramente è ciò che vuoi.

## Avvio rapido in 5 minuti

1. Associa WhatsApp Web (mostra il QR; scansionalo con il telefono dell'assistente):

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

Ora invia un messaggio al numero dell'assistente dal telefono nella allowlist.

Al termine dell'onboarding, OpenClaw apre automaticamente la dashboard e stampa un link pulito (non tokenizzato). Se la dashboard richiede l'autenticazione, incolla il segreto condiviso configurato nelle impostazioni della Control UI. L'onboarding usa un token per impostazione predefinita (`gateway.auth.token`), ma anche l'autenticazione con password funziona se hai cambiato `gateway.auth.mode` in `password`. Per riaprire in seguito: `openclaw dashboard`.

## Dare all'agente un workspace (AGENTS)

OpenClaw legge le istruzioni operative e la "memoria" dalla sua directory workspace.

Per impostazione predefinita, OpenClaw usa `~/.openclaw/workspace` come workspace dell'agente e lo creerà (insieme agli starter `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`) automaticamente alla configurazione/prima esecuzione dell'agente. `BOOTSTRAP.md` viene creato solo quando il workspace è completamente nuovo (non dovrebbe tornare dopo che lo elimini). `MEMORY.md` è opzionale (non creato automaticamente); quando è presente, viene caricato per le sessioni normali. Le sessioni subagent iniettano solo `AGENTS.md` e `TOOLS.md`.

<Tip>
Tratta questa cartella come la memoria di OpenClaw e rendila un repository git (idealmente privato) così il tuo `AGENTS.md` e i file di memoria sono sottoposti a backup. Se git è installato, i workspace nuovi vengono inizializzati automaticamente.
</Tip>

```bash
openclaw setup
```

Layout completo del workspace + guida al backup: [Workspace dell'agente](/it/concepts/agent-workspace)
Flusso di lavoro della memoria: [Memoria](/it/concepts/memory)

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

OpenClaw usa per impostazione predefinita una buona configurazione da assistente, ma di solito vorrai regolare:

- persona/istruzioni in [`SOUL.md`](/it/concepts/soul)
- impostazioni predefinite di ragionamento (se desiderato)
- Heartbeat (una volta che ti fidi)

Esempio:

```json5
{
  logging: { level: "info" },
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      workspace: "~/.openclaw/workspace",
      thinkingDefault: "high",
      timeoutSeconds: 1800,
      // Start with 0; enable later.
      heartbeat: { every: "0m" },
    },
    list: [
      {
        id: "main",
        default: true,
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
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
- Metadati di sessione (uso dei token, ultimo instradamento, ecc.): `~/.openclaw/agents/<agentId>/sessions/sessions.json` (legacy: `~/.openclaw/sessions/sessions.json`)
- `/new` o `/reset` avvia una nuova sessione per quella chat (configurabile tramite `resetTriggers`). Se inviato da solo, OpenClaw conferma il reset senza invocare il modello.
- `/compact [instructions]` compatta il contesto della sessione e segnala il budget di contesto rimanente.

## Heartbeat (modalità proattiva)

Per impostazione predefinita, OpenClaw esegue un Heartbeat ogni 30 minuti con il prompt:
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
Imposta `agents.defaults.heartbeat.every: "0m"` per disabilitarlo.

- Se `HEARTBEAT.md` esiste ma è di fatto vuoto (solo righe vuote e intestazioni markdown come `# Heading`), OpenClaw salta l'esecuzione dell'Heartbeat per risparmiare chiamate API.
- Se il file manca, l'Heartbeat viene comunque eseguito e il modello decide cosa fare.
- Se l'agente risponde con `HEARTBEAT_OK` (facoltativamente con un breve padding; vedi `agents.defaults.heartbeat.ackMaxChars`), OpenClaw sopprime la consegna in uscita per quell'Heartbeat.
- Per impostazione predefinita, la consegna dell'Heartbeat a destinazioni DM-style `user:<id>` è consentita. Imposta `agents.defaults.heartbeat.directPolicy: "block"` per sopprimere la consegna a destinazioni dirette mantenendo attive le esecuzioni dell'Heartbeat.
- Gli Heartbeat eseguono turni completi dell'agente: intervalli più brevi consumano più token.

```json5
{
  agents: {
    defaults: {
      heartbeat: { every: "30m" },
    },
  },
}
```

## Media in entrata e in uscita

Gli allegati in ingresso (immagini/audio/documenti) possono essere esposti al tuo comando tramite template:

- `{{MediaPath}}` (percorso del file temporaneo locale)
- `{{MediaUrl}}` (pseudo-URL)
- `{{Transcript}}` (se la trascrizione audio è abilitata)

Allegati in uscita dall'agente: includi `MEDIA:<path-or-url>` su una riga a sé (senza spazi). Esempio:

```
Here's the screenshot.
MEDIA:https://example.com/screenshot.png
```

OpenClaw li estrae e li invia come media insieme al testo.

Il comportamento dei percorsi locali segue lo stesso modello di fiducia per la lettura dei file dell'agente:

- Se `tools.fs.workspaceOnly` è `true`, i percorsi locali `MEDIA:` in uscita restano limitati alla root temporanea di OpenClaw, alla cache dei media, ai percorsi del workspace dell'agente e ai file generati dalla sandbox.
- Se `tools.fs.workspaceOnly` è `false`, `MEDIA:` in uscita può usare file locali dell'host che l'agente è già autorizzato a leggere.
- I percorsi locali possono essere assoluti, relativi al workspace o relativi alla home con `~/`.
- Gli invii locali dall'host consentono comunque solo media e tipi di documenti sicuri (immagini, audio, video, PDF e documenti Office). Testo semplice e file simili a segreti non vengono trattati come media inviabili.

Questo significa che le immagini/i file generati fuori dal workspace ora possono essere inviati quando la tua policy fs consente già quelle letture, senza riaprire l'esfiltrazione arbitraria di allegati di testo dell'host.

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
- Operazioni Gateway: [Runbook Gateway](/it/gateway)
- Cron + risvegli: [Job Cron](/it/automation/cron-jobs)
- Companion della barra dei menu macOS: [App OpenClaw per macOS](/it/platforms/macos)
- App nodo iOS: [App iOS](/it/platforms/ios)
- App nodo Android: [App Android](/it/platforms/android)
- Stato Windows: [Windows (WSL2)](/it/platforms/windows)
- Stato Linux: [App Linux](/it/platforms/linux)
- Sicurezza: [Sicurezza](/it/gateway/security)

## Correlati

- [Per iniziare](/it/start/getting-started)
- [Configurazione](/it/start/setup)
- [Panoramica dei canali](/it/channels)
