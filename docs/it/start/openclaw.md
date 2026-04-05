---
read_when:
    - Eseguire l'onboarding di una nuova istanza dell'assistente
    - Esaminare le implicazioni di sicurezza e autorizzazione
summary: Guida end-to-end per eseguire OpenClaw come assistente personale con avvertenze di sicurezza
title: Configurazione dell'assistente personale
x-i18n:
    generated_at: "2026-04-05T14:05:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02f10a9f7ec08f71143cbae996d91cbdaa19897a40f725d8ef524def41cf2759
    source_path: start/openclaw.md
    workflow: 15
---

# Creare un assistente personale con OpenClaw

OpenClaw è un Gateway self-hosted che collega Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e altri ad agenti AI. Questa guida copre la configurazione "assistente personale": un numero WhatsApp dedicato che si comporta come il tuo assistente AI sempre attivo.

## ⚠️ La sicurezza prima di tutto

Stai mettendo un agente nella posizione di poter:

- eseguire comandi sulla tua macchina (a seconda della tua policy degli strumenti)
- leggere/scrivere file nel tuo workspace
- inviare messaggi all'esterno tramite WhatsApp/Telegram/Discord/Mattermost e altri canali inclusi

Inizia in modo prudente:

- Imposta sempre `channels.whatsapp.allowFrom` (non eseguire mai una configurazione aperta a tutto il mondo sul tuo Mac personale).
- Usa un numero WhatsApp dedicato per l'assistente.
- Gli heartbeat ora sono impostati per default ogni 30 minuti. Disattivali finché non ti fidi della configurazione impostando `agents.defaults.heartbeat.every: "0m"`.

## Prerequisiti

- OpenClaw installato e onboarding completato — vedi [Per iniziare](/start/getting-started) se non l'hai ancora fatto
- Un secondo numero di telefono (SIM/eSIM/prepagato) per l'assistente

## La configurazione con due telefoni (consigliata)

Ti serve questo:

```mermaid
flowchart TB
    A["<b>Il tuo telefono (personale)<br></b><br>Il tuo WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Secondo telefono (assistente)<br></b><br>WhatsApp assistente<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Il tuo Mac (openclaw)<br></b><br>Agente AI"]
```

Se colleghi il tuo WhatsApp personale a OpenClaw, ogni messaggio che ricevi diventa “input dell'agente”. Raramente è ciò che vuoi.

## Avvio rapido in 5 minuti

1. Abbina WhatsApp Web (mostra un QR; scansionalo con il telefono dell'assistente):

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

Ora invia un messaggio al numero dell'assistente dal telefono presente nella allowlist.

Quando l'onboarding termina, apriamo automaticamente la dashboard e stampiamo un link pulito (senza token). Se richiede l'autenticazione, incolla il segreto condiviso configurato nelle impostazioni della Control UI. L'onboarding usa un token per default (`gateway.auth.token`), ma anche l'autenticazione tramite password funziona se hai cambiato `gateway.auth.mode` in `password`. Per riaprirla in seguito: `openclaw dashboard`.

## Assegna un workspace all'agente (AGENTS)

OpenClaw legge istruzioni operative e “memoria” dalla directory del suo workspace.

Per default, OpenClaw usa `~/.openclaw/workspace` come workspace dell'agente e lo creerà automaticamente (insieme ai file iniziali `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`) durante la configurazione o la prima esecuzione dell'agente. `BOOTSTRAP.md` viene creato solo quando il workspace è completamente nuovo (non dovrebbe ricomparire dopo che lo elimini). `MEMORY.md` è facoltativo (non viene creato automaticamente); quando è presente, viene caricato per le sessioni normali. Le sessioni dei sottoagenti iniettano solo `AGENTS.md` e `TOOLS.md`.

Suggerimento: tratta questa cartella come la “memoria” di OpenClaw e rendila un repository git (idealmente privato) in modo che `AGENTS.md` e i file di memoria siano sottoposti a backup. Se git è installato, i workspace completamente nuovi vengono inizializzati automaticamente.

```bash
openclaw setup
```

Layout completo del workspace + guida al backup: [Workspace dell'agente](/it/concepts/agent-workspace)
Flusso di lavoro della memoria: [Memoria](/it/concepts/memory)

Facoltativo: scegli un workspace diverso con `agents.defaults.workspace` (supporta `~`).

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

Se distribuisci già i tuoi file del workspace da un repository, puoi disattivare completamente la creazione dei file bootstrap:

```json5
{
  agent: {
    skipBootstrap: true,
  },
}
```

## La configurazione che lo trasforma in "un assistente"

OpenClaw usa per default una buona configurazione da assistente, ma in genere vorrai regolare:

- persona/istruzioni in [`SOUL.md`](/it/concepts/soul)
- impostazioni predefinite del ragionamento (se desiderato)
- heartbeat (una volta che ti fidi)

Esempio:

```json5
{
  logging: { level: "info" },
  agent: {
    model: "anthropic/claude-opus-4-6",
    workspace: "~/.openclaw/workspace",
    thinkingDefault: "high",
    timeoutSeconds: 1800,
    // Inizia con 0; abilitalo in seguito.
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
- Metadati della sessione (uso dei token, ultima route, ecc.): `~/.openclaw/agents/<agentId>/sessions/sessions.json` (legacy: `~/.openclaw/sessions/sessions.json`)
- `/new` o `/reset` avvia una nuova sessione per quella chat (configurabile tramite `resetTriggers`). Se inviato da solo, l'agente risponde con un breve saluto per confermare il reset.
- `/compact [instructions]` compatta il contesto della sessione e riporta il budget di contesto rimanente.

## Heartbeat (modalità proattiva)

Per default, OpenClaw esegue un heartbeat ogni 30 minuti con il prompt:
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
Imposta `agents.defaults.heartbeat.every: "0m"` per disattivarlo.

- Se `HEARTBEAT.md` esiste ma è di fatto vuoto (solo righe vuote e intestazioni markdown come `# Heading`), OpenClaw salta l'esecuzione dell'heartbeat per risparmiare chiamate API.
- Se il file manca, l'heartbeat viene comunque eseguito e il modello decide cosa fare.
- Se l'agente risponde con `HEARTBEAT_OK` (facoltativamente con un breve padding; vedi `agents.defaults.heartbeat.ackMaxChars`), OpenClaw sopprime la consegna in uscita per quell'heartbeat.
- Per default, è consentita la consegna degli heartbeat ai target in stile DM `user:<id>`. Imposta `agents.defaults.heartbeat.directPolicy: "block"` per sopprimere la consegna verso target diretti mantenendo attive le esecuzioni degli heartbeat.
- Gli heartbeat eseguono turni completi dell'agente — intervalli più brevi consumano più token.

```json5
{
  agent: {
    heartbeat: { every: "30m" },
  },
}
```

## Media in ingresso e in uscita

Gli allegati in ingresso (immagini/audio/documenti) possono essere esposti al tuo comando tramite template:

- `{{MediaPath}}` (percorso locale del file temporaneo)
- `{{MediaUrl}}` (pseudo-URL)
- `{{Transcript}}` (se la trascrizione audio è abilitata)

Allegati in uscita dall'agente: includi `MEDIA:<path-or-url>` su una riga separata (senza spazi). Esempio:

```
Ecco lo screenshot.
MEDIA:https://example.com/screenshot.png
```

OpenClaw li estrae e li invia come media insieme al testo.

Il comportamento dei percorsi locali segue lo stesso modello di fiducia per la lettura dei file dell'agente:

- Se `tools.fs.workspaceOnly` è `true`, i percorsi locali `MEDIA:` in uscita rimangono limitati alla root temporanea di OpenClaw, alla cache dei media, ai percorsi del workspace dell'agente e ai file generati dalla sandbox.
- Se `tools.fs.workspaceOnly` è `false`, `MEDIA:` in uscita può usare file locali dell'host che l'agente è già autorizzato a leggere.
- Gli invii da percorsi locali dell'host consentono comunque solo media e tipi di documento sicuri (immagini, audio, video, PDF e documenti Office). I file di testo semplice e quelli che sembrano segreti non vengono trattati come media inviabili.

Ciò significa che immagini/file generati al di fuori del workspace ora possono essere inviati quando la tua policy fs consente già quelle letture, senza riaprire l'esfiltrazione arbitraria di allegati di testo dell'host.

## Checklist operativa

```bash
openclaw status          # stato locale (credenziali, sessioni, eventi in coda)
openclaw status --all    # diagnosi completa (sola lettura, incollabile)
openclaw status --deep   # chiede al gateway un probe live di integrità con probe dei canali quando supportati
openclaw health --json   # snapshot di integrità del gateway (WS; il default può restituire uno snapshot fresco memorizzato nella cache)
```

I log si trovano in `/tmp/openclaw/` (predefinito: `openclaw-YYYY-MM-DD.log`).

## Passaggi successivi

- WebChat: [WebChat](/web/webchat)
- Operazioni del Gateway: [Runbook del Gateway](/it/gateway)
- Cron + wakeup: [Cron jobs](/it/automation/cron-jobs)
- Companion della barra dei menu macOS: [App macOS OpenClaw](/it/platforms/macos)
- App nodo iOS: [App iOS](/it/platforms/ios)
- App nodo Android: [App Android](/it/platforms/android)
- Stato di Windows: [Windows (WSL2)](/it/platforms/windows)
- Stato di Linux: [App Linux](/it/platforms/linux)
- Sicurezza: [Sicurezza](/it/gateway/security)
