---
read_when:
    - Configurazione iniziale di una nuova istanza dell'assistente
    - Revisione delle implicazioni relative a sicurezza e autorizzazioni
summary: Guida completa per eseguire OpenClaw come assistente personale con avvertenze di sicurezza
title: Configurazione dell'assistente personale
x-i18n:
    generated_at: "2026-05-06T09:09:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fea1194e6b9e8d8816cc712296940487b38faaabea463bd45ba1f37ff52d44d
    source_path: start/openclaw.md
    workflow: 16
---

OpenClaw è un Gateway self-hosted che collega Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e altro ancora agli agenti AI. Questa guida copre la configurazione "assistente personale": un numero WhatsApp dedicato che si comporta come il tuo assistente AI sempre attivo.

## ⚠️ Prima la sicurezza

Stai mettendo un agente nella posizione di:

- eseguire comandi sulla tua macchina (a seconda della tua policy per gli strumenti)
- leggere/scrivere file nella tua area di lavoro
- inviare messaggi verso l'esterno tramite WhatsApp/Telegram/Discord/Mattermost e altri canali inclusi

Inizia in modo prudente:

- Imposta sempre `channels.whatsapp.allowFrom` (non eseguire mai una configurazione aperta al mondo sul tuo Mac personale).
- Usa un numero WhatsApp dedicato per l'assistente.
- Gli Heartbeat ora sono predefiniti ogni 30 minuti. Disattivali finché non ti fidi della configurazione impostando `agents.defaults.heartbeat.every: "0m"`.

## Prerequisiti

- OpenClaw installato e inizializzato - vedi [Introduzione](/it/start/getting-started) se non lo hai ancora fatto
- Un secondo numero di telefono (SIM/eSIM/prepagata) per l'assistente

## La configurazione con due telefoni (consigliata)

Vuoi ottenere questo:

```mermaid
flowchart TB
    A["<b>Your Phone (personal)<br></b><br>Your WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Second Phone (assistant)<br></b><br>Assistant WA<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Your Mac (openclaw)<br></b><br>AI agent"]
```

Se colleghi il tuo WhatsApp personale a OpenClaw, ogni messaggio destinato a te diventa "input dell'agente". Raramente è ciò che vuoi.

## Avvio rapido in 5 minuti

1. Associa WhatsApp Web (mostra un QR; scansiona con il telefono dell'assistente):

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

Ora invia un messaggio al numero dell'assistente dal telefono autorizzato.

Al termine dell'onboarding, OpenClaw apre automaticamente la dashboard e stampa un link pulito (senza token). Se la dashboard richiede l'autenticazione, incolla il segreto condiviso configurato nelle impostazioni di Control UI. L'onboarding usa un token per impostazione predefinita (`gateway.auth.token`), ma anche l'autenticazione tramite password funziona se hai cambiato `gateway.auth.mode` in `password`. Per riaprire in seguito: `openclaw dashboard`.

## Dai all'agente un'area di lavoro (AGENTS)

OpenClaw legge istruzioni operative e "memoria" dalla sua directory di area di lavoro.

Per impostazione predefinita, OpenClaw usa `~/.openclaw/workspace` come area di lavoro dell'agente e la creerà automaticamente (insieme ai file iniziali `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`) durante la configurazione/la prima esecuzione dell'agente. `BOOTSTRAP.md` viene creato solo quando l'area di lavoro è completamente nuova (non dovrebbe tornare dopo che lo elimini). `MEMORY.md` è opzionale (non creato automaticamente); quando presente, viene caricato per le sessioni normali. Le sessioni dei subagenti iniettano solo `AGENTS.md` e `TOOLS.md`.

<Tip>
Tratta questa cartella come la memoria di OpenClaw e rendila un repository git (idealmente privato) così i tuoi file `AGENTS.md` e di memoria hanno un backup. Se git è installato, le aree di lavoro completamente nuove vengono inizializzate automaticamente.
</Tip>

```bash
openclaw setup
```

Layout completo dell'area di lavoro + guida al backup: [Area di lavoro dell'agente](/it/concepts/agent-workspace)
Flusso di lavoro della memoria: [Memoria](/it/concepts/memory)

Opzionale: scegli un'area di lavoro diversa con `agents.defaults.workspace` (supporta `~`).

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

Se distribuisci già i tuoi file di area di lavoro da un repository, puoi disabilitare completamente la creazione dei file di bootstrap:

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

OpenClaw ha impostazioni predefinite adatte a un buon assistente, ma di solito vorrai regolare:

- personalità/istruzioni in [`SOUL.md`](/it/concepts/soul)
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

- File delle sessioni: `~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- Metadati delle sessioni (uso dei token, ultimo routing, ecc.): `~/.openclaw/agents/<agentId>/sessions/sessions.json` (legacy: `~/.openclaw/sessions/sessions.json`)
- `/new` o `/reset` avvia una nuova sessione per quella chat (configurabile tramite `resetTriggers`). Se inviato da solo, OpenClaw conferma il reset senza invocare il modello.
- `/compact [instructions]` compatta il contesto della sessione e riporta il budget di contesto rimanente.

## Heartbeat (modalità proattiva)

Per impostazione predefinita, OpenClaw esegue un Heartbeat ogni 30 minuti con il prompt:
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
Imposta `agents.defaults.heartbeat.every: "0m"` per disabilitarlo.

- Se `HEARTBEAT.md` esiste ma è di fatto vuoto (solo righe vuote e intestazioni markdown come `# Heading`), OpenClaw salta l'esecuzione dell'Heartbeat per risparmiare chiamate API.
- Se il file manca, l'Heartbeat viene comunque eseguito e il modello decide cosa fare.
- Se l'agente risponde con `HEARTBEAT_OK` (facoltativamente con un breve riempimento; vedi `agents.defaults.heartbeat.ackMaxChars`), OpenClaw sopprime la consegna in uscita per quell'Heartbeat.
- Per impostazione predefinita, la consegna degli Heartbeat verso destinazioni in stile DM `user:<id>` è consentita. Imposta `agents.defaults.heartbeat.directPolicy: "block"` per sopprimere la consegna a destinazioni dirette mantenendo attive le esecuzioni degli Heartbeat.
- Gli Heartbeat eseguono turni completi dell'agente - intervalli più brevi consumano più token.

```json5
{
  agent: {
    heartbeat: { every: "30m" },
  },
}
```

## Media in entrata e in uscita

Gli allegati in entrata (immagini/audio/documenti) possono essere esposti al tuo comando tramite template:

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

- Se `tools.fs.workspaceOnly` è `true`, i percorsi locali `MEDIA:` in uscita restano limitati alla radice temporanea di OpenClaw, alla cache dei media, ai percorsi dell'area di lavoro dell'agente e ai file generati dalla sandbox.
- Se `tools.fs.workspaceOnly` è `false`, `MEDIA:` in uscita può usare file locali dell'host che l'agente è già autorizzato a leggere.
- I percorsi locali possono essere assoluti, relativi all'area di lavoro o relativi alla home con `~/`.
- Gli invii locali dell'host consentono comunque solo media e tipi di documenti sicuri (immagini, audio, video, PDF e documenti Office). File di testo semplice e file simili a segreti non vengono trattati come media inviabili.

Questo significa che immagini/file generati fuori dall'area di lavoro ora possono essere inviati quando la tua policy fs consente già quelle letture, senza riaprire l'esfiltrazione arbitraria di allegati di testo dall'host.

## Checklist operativa

```bash
openclaw status          # local status (creds, sessions, queued events)
openclaw status --all    # full diagnosis (read-only, pasteable)
openclaw status --deep   # asks the gateway for a live health probe with channel probes when supported
openclaw health --json   # gateway health snapshot (WS; default can return a fresh cached snapshot)
```

I log si trovano sotto `/tmp/openclaw/` (predefinito: `openclaw-YYYY-MM-DD.log`).

## Passi successivi

- WebChat: [WebChat](/it/web/webchat)
- Operazioni Gateway: [Runbook del Gateway](/it/gateway)
- Cron + risvegli: [Processi Cron](/it/automation/cron-jobs)
- Companion per barra dei menu macOS: [App macOS di OpenClaw](/it/platforms/macos)
- App nodo iOS: [App iOS](/it/platforms/ios)
- App nodo Android: [App Android](/it/platforms/android)
- Stato Windows: [Windows (WSL2)](/it/platforms/windows)
- Stato Linux: [App Linux](/it/platforms/linux)
- Sicurezza: [Sicurezza](/it/gateway/security)

## Correlati

- [Introduzione](/it/start/getting-started)
- [Configurazione](/it/start/setup)
- [Panoramica dei canali](/it/channels)
