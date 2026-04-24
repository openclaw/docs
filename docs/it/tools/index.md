---
read_when:
    - Vuoi capire quali strumenti fornisce OpenClaw
    - Hai bisogno di configurare, consentire o negare strumenti
    - Stai decidendo tra strumenti integrati, Skills e Plugin
summary: 'Panoramica degli strumenti e dei Plugin di OpenClaw: cosa può fare l''agente e come estenderlo'
title: Strumenti e Plugin
x-i18n:
    generated_at: "2026-04-24T09:06:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9ab57fcb1b58875866721fbadba63093827698ed980afeb14274da601b34f11
    source_path: tools/index.md
    workflow: 15
---

Tutto ciò che l'agente fa oltre a generare testo avviene tramite **strumenti**.
Gli strumenti sono il modo in cui l'agente legge file, esegue comandi, naviga sul web, invia
messaggi e interagisce con i dispositivi.

## Strumenti, Skills e Plugin

OpenClaw ha tre livelli che lavorano insieme:

<Steps>
  <Step title="Gli strumenti sono ciò che l'agente chiama">
    Uno strumento è una funzione tipizzata che l'agente può invocare (per esempio `exec`, `browser`,
    `web_search`, `message`). OpenClaw distribuisce un insieme di **strumenti integrati** e
    i Plugin possono registrarne altri.

    L'agente vede gli strumenti come definizioni di funzione strutturate inviate all'API del modello.

  </Step>

  <Step title="Le Skills insegnano all'agente quando e come">
    Una Skill è un file markdown (`SKILL.md`) iniettato nel prompt di sistema.
    Le Skills danno all'agente contesto, vincoli e guida passo per passo per
    usare gli strumenti in modo efficace. Le Skills vivono nel tuo workspace, in cartelle condivise,
    oppure vengono distribuite dentro i Plugin.

    [Riferimento Skills](/it/tools/skills) | [Creare Skills](/it/tools/creating-skills)

  </Step>

  <Step title="I Plugin impacchettano tutto insieme">
    Un Plugin è un pacchetto che può registrare qualsiasi combinazione di capacità:
    canali, provider di modelli, strumenti, Skills, speech, trascrizione realtime,
    voce realtime, media understanding, generazione immagini, generazione video,
    web fetch, web search e altro. Alcuni Plugin sono **core** (distribuiti con
    OpenClaw), altri sono **esterni** (pubblicati su npm dalla community).

    [Installare e configurare Plugin](/it/tools/plugin) | [Costruirne uno tuo](/it/plugins/building-plugins)

  </Step>
</Steps>

## Strumenti integrati

Questi strumenti vengono distribuiti con OpenClaw e sono disponibili senza installare alcun Plugin:

| Strumento                                  | Cosa fa                                                                | Pagina                                                       |
| ------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Esegue comandi shell, gestisce processi in background                  | [Exec](/it/tools/exec), [Approvazioni Exec](/it/tools/exec-approvals) |
| `code_execution`                           | Esegue analisi Python remota in sandbox                                | [Code Execution](/it/tools/code-execution)                      |
| `browser`                                  | Controlla un browser Chromium (naviga, clicca, screenshot)             | [Browser](/it/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Cerca sul web, cerca post su X, recupera il contenuto di pagine        | [Web](/it/tools/web), [Web Fetch](/it/tools/web-fetch)             |
| `read` / `write` / `edit`                  | I/O file nel workspace                                                 |                                                              |
| `apply_patch`                              | Patch di file multi-hunk                                               | [Apply Patch](/it/tools/apply-patch)                            |
| `message`                                  | Invia messaggi su tutti i canali                                       | [Agent Send](/it/tools/agent-send)                              |
| `canvas`                                   | Pilota il Canvas del Node (present, eval, snapshot)                    |                                                              |
| `nodes`                                    | Rileva e punta ai dispositivi associati                                |                                                              |
| `cron` / `gateway`                         | Gestisce processi pianificati; ispeziona, corregge, riavvia o aggiorna il gateway |                                                              |
| `image` / `image_generate`                 | Analizza o genera immagini                                             | [Generazione immagini](/it/tools/image-generation)              |
| `music_generate`                           | Genera tracce musicali                                                 | [Generazione musicale](/it/tools/music-generation)              |
| `video_generate`                           | Genera video                                                           | [Generazione video](/it/tools/video-generation)                 |
| `tts`                                      | Conversione text-to-speech one-shot                                    | [TTS](/it/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gestione sessioni, stato e orchestrazione dei sottoagenti             | [Sottoagenti](/it/tools/subagents)                              |
| `session_status`                           | Readback leggero in stile `/status` e override del modello di sessione | [Strumenti di sessione](/it/concepts/session-tool)              |

Per il lavoro sulle immagini, usa `image` per l'analisi e `image_generate` per la generazione o il ritocco. Se punti a `openai/*`, `google/*`, `fal/*` o a un altro provider immagini non predefinito, configura prima auth/chiave API di quel provider.

Per il lavoro musicale, usa `music_generate`. Se punti a `google/*`, `minimax/*` o a un altro provider musicale non predefinito, configura prima auth/chiave API di quel provider.

Per il lavoro video, usa `video_generate`. Se punti a `qwen/*` o a un altro provider video non predefinito, configura prima auth/chiave API di quel provider.

Per la generazione audio guidata da workflow, usa `music_generate` quando un Plugin come
ComfyUI lo registra. Questo è separato da `tts`, che è text-to-speech.

`session_status` è lo strumento leggero di stato/readback nel gruppo sessions.
Risponde a domande in stile `/status` sulla sessione corrente e può
facoltativamente impostare un override di modello per sessione; `model=default` cancella tale
override. Come `/status`, può riempire contatori token/cache scarsi e l'etichetta del modello runtime attivo dall'ultima voce di utilizzo della trascrizione.

`gateway` è lo strumento runtime riservato al proprietario per le operazioni del gateway:

- `config.schema.lookup` per un sottoalbero di configurazione con ambito a un percorso prima delle modifiche
- `config.get` per lo snapshot + hash della configurazione corrente
- `config.patch` per aggiornamenti parziali della configurazione con riavvio
- `config.apply` solo per la sostituzione completa della configurazione
- `update.run` per auto-aggiornamento esplicito + riavvio

Per modifiche parziali, preferisci `config.schema.lookup` poi `config.patch`. Usa
`config.apply` solo quando intendi sostituire l'intera configurazione.
Lo strumento si rifiuta anche di modificare `tools.exec.ask` o `tools.exec.security`;
gli alias legacy `tools.bash.*` vengono normalizzati sugli stessi percorsi exec protetti.

### Strumenti forniti dai Plugin

I Plugin possono registrare strumenti aggiuntivi. Alcuni esempi:

- [Diffs](/it/tools/diffs) — visualizzatore e renderer di differenze
- [LLM Task](/it/tools/llm-task) — passaggio LLM solo JSON per output strutturato
- [Lobster](/it/tools/lobster) — runtime di workflow tipizzato con approvazioni riprendibili
- [Generazione musicale](/it/tools/music-generation) — strumento condiviso `music_generate` con provider supportati da workflow
- [OpenProse](/it/prose) — orchestrazione di workflow markdown-first
- [Tokenjuice](/it/tools/tokenjuice) — compatta i risultati rumorosi degli strumenti `exec` e `bash`

## Configurazione degli strumenti

### Allowlist e denylist

Controlla quali strumenti l'agente può chiamare tramite `tools.allow` / `tools.deny` nella
configurazione. La deny ha sempre la precedenza sulla allow.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Profili degli strumenti

`tools.profile` imposta una allowlist di base prima che vengano applicati `allow`/`deny`.
Override per agente: `agents.list[].tools.profile`.

| Profilo     | Cosa include                                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Nessuna restrizione (uguale a non impostato)                                                                                                   |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                     |
| `minimal`   | Solo `session_status`                                                                                                                          |

I profili `coding` e `messaging` consentono anche gli strumenti bundle MCP configurati
sotto la chiave Plugin `bundle-mcp`. Aggiungi `tools.deny: ["bundle-mcp"]` quando
vuoi che un profilo mantenga i suoi normali strumenti integrati ma nasconda tutti gli strumenti MCP configurati.
Il profilo `minimal` non include strumenti bundle MCP.

### Gruppi di strumenti

Usa le scorciatoie `group:*` nelle allow/deny list:

| Gruppo             | Strumenti                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` è accettato come alias di `exec`)                                   |
| `group:fs`         | read, write, edit, apply_patch                                                                             |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                  |
| `group:web`        | web_search, x_search, web_fetch                                                                            |
| `group:ui`         | browser, canvas                                                                                            |
| `group:automation` | cron, gateway                                                                                              |
| `group:messaging`  | message                                                                                                    |
| `group:nodes`      | nodes                                                                                                      |
| `group:agents`     | agents_list                                                                                                |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                 |
| `group:openclaw`   | Tutti gli strumenti integrati di OpenClaw (esclude gli strumenti dei Plugin)                              |

`sessions_history` restituisce una vista di richiamo limitata e filtrata per sicurezza. Rimuove
tag di thinking, scaffolding `<relevant-memories>`, payload XML di chiamate di tool in testo semplice
(inclusi `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocchi di chiamata di tool troncati),
scaffolding declassato delle chiamate di tool, token di controllo del modello trapelati in ASCII/full-width e XML malformato delle chiamate di tool MiniMax dal testo dell'assistente, poi applica
redazione/troncamento ed eventuali placeholder per righe troppo grandi invece di agire
come dump grezzo della trascrizione.

### Restrizioni specifiche per provider

Usa `tools.byProvider` per limitare gli strumenti per provider specifici senza
cambiare i valori predefiniti globali:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
