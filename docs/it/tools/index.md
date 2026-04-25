---
read_when:
    - Vuoi capire quali strumenti fornisce OpenClaw
    - Hai bisogno di configurare, consentire o negare strumenti
    - Stai decidendo tra strumenti built-in, Skills e Plugin
summary: 'Panoramica di strumenti e Plugin di OpenClaw: cosa può fare l''agente e come estenderlo'
title: Strumenti e Plugin
x-i18n:
    generated_at: "2026-04-25T18:23:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 72f1257f5e556b57238f9a0ff01574510f310250cf6da73c74f9f2421fa2c917
    source_path: tools/index.md
    workflow: 15
---

Tutto ciò che l'agente fa oltre a generare testo avviene tramite gli **strumenti**.
Gli strumenti sono il modo in cui l'agente legge file, esegue comandi, naviga sul web, invia
messaggi e interagisce con i dispositivi.

## Strumenti, Skills e Plugin

OpenClaw ha tre livelli che lavorano insieme:

<Steps>
  <Step title="Gli strumenti sono ciò che l'agente chiama">
    Uno strumento è una funzione tipizzata che l'agente può invocare (ad esempio `exec`, `browser`,
    `web_search`, `message`). OpenClaw distribuisce un insieme di **strumenti built-in** e
    i Plugin possono registrarne altri aggiuntivi.

    L'agente vede gli strumenti come definizioni di funzione strutturate inviate all'API del modello.

  </Step>

  <Step title="Le Skills insegnano all'agente quando e come">
    Una Skill è un file markdown (`SKILL.md`) iniettato nel prompt di sistema.
    Le Skills forniscono all'agente contesto, vincoli e istruzioni passo passo per
    usare efficacemente gli strumenti. Le Skills si trovano nel tuo workspace, in cartelle condivise,
    oppure vengono distribuite all'interno dei Plugin.

    [Riferimento Skills](/it/tools/skills) | [Creazione di Skills](/it/tools/creating-skills)

  </Step>

  <Step title="I Plugin impacchettano tutto insieme">
    Un Plugin è un pacchetto che può registrare qualsiasi combinazione di capacità:
    canali, provider di modelli, strumenti, Skills, voce, trascrizione realtime,
    voce realtime, comprensione dei contenuti multimediali, generazione di immagini,
    generazione video, recupero web, ricerca web e altro ancora. Alcuni Plugin sono **core** (distribuiti con
    OpenClaw), altri sono **esterni** (pubblicati su npm dalla community).

    [Installa e configura i Plugin](/it/tools/plugin) | [Crea il tuo](/it/plugins/building-plugins)

  </Step>
</Steps>

## Strumenti built-in

Questi strumenti sono distribuiti con OpenClaw e sono disponibili senza installare alcun Plugin:

| Strumento                                  | Cosa fa                                                               | Pagina                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Esegue comandi shell, gestisce processi in background                 | [Exec](/it/tools/exec), [Approvazioni Exec](/it/tools/exec-approvals) |
| `code_execution`                           | Esegue analisi Python remote in sandbox                               | [Code Execution](/it/tools/code-execution)                      |
| `browser`                                  | Controlla un browser Chromium (navigazione, clic, screenshot)         | [Browser](/it/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Cerca sul web, cerca post su X, recupera contenuti di pagine          | [Web](/it/tools/web), [Web Fetch](/it/tools/web-fetch)             |
| `read` / `write` / `edit`                  | I/O dei file nel workspace                                            |                                                              |
| `apply_patch`                              | Patch di file multi-hunk                                              | [Apply Patch](/it/tools/apply-patch)                            |
| `message`                                  | Invia messaggi su tutti i canali                                      | [Invio agente](/it/tools/agent-send)                            |
| `canvas`                                   | Controlla Node Canvas (present, eval, snapshot)                       |                                                              |
| `nodes`                                    | Rileva e seleziona dispositivi associati                              |                                                              |
| `cron` / `gateway`                         | Gestisce job pianificati; ispeziona, modifica, riavvia o aggiorna il gateway |                                                              |
| `image` / `image_generate`                 | Analizza o genera immagini                                            | [Generazione immagini](/it/tools/image-generation)              |
| `music_generate`                           | Genera tracce musicali                                                | [Generazione musicale](/it/tools/music-generation)              |
| `video_generate`                           | Genera video                                                          | [Generazione video](/it/tools/video-generation)                 |
| `tts`                                      | Conversione text-to-speech one-shot                                   | [TTS](/it/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gestione delle sessioni, stato e orchestrazione dei sub-agent         | [Sub-agent](/it/tools/subagents)                                |
| `session_status`                           | Lettura leggera in stile `/status` e override del modello di sessione | [Strumenti di sessione](/it/concepts/session-tool)              |

Per il lavoro sulle immagini, usa `image` per l'analisi e `image_generate` per la generazione o la modifica. Se usi `openai/*`, `google/*`, `fal/*` o un altro provider di immagini non predefinito, configura prima l'auth/la chiave API di quel provider.

Per il lavoro musicale, usa `music_generate`. Se usi `google/*`, `minimax/*` o un altro provider musicale non predefinito, configura prima l'auth/la chiave API di quel provider.

Per il lavoro video, usa `video_generate`. Se usi `qwen/*` o un altro provider video non predefinito, configura prima l'auth/la chiave API di quel provider.

Per la generazione audio basata su workflow, usa `music_generate` quando un Plugin come
ComfyUI lo registra. È separato da `tts`, che è text-to-speech.

`session_status` è lo strumento leggero di stato/lettura nel gruppo delle sessioni.
Risponde a domande in stile `/status` sulla sessione corrente e può
facoltativamente impostare un override del modello per sessione; `model=default` rimuove tale
override. Come `/status`, può colmare valori sparsi di contatori token/cache e
l'etichetta del modello runtime attivo dall'ultima voce di utilizzo della trascrizione.

`gateway` è lo strumento runtime riservato al proprietario per le operazioni sul gateway:

- `config.schema.lookup` per un sottoalbero di configurazione con ambito di percorso prima delle modifiche
- `config.get` per lo snapshot di configurazione corrente + hash
- `config.patch` per aggiornamenti parziali della configurazione con riavvio
- `config.apply` solo per la sostituzione dell'intera configurazione
- `update.run` per auto-aggiornamento esplicito + riavvio

Per modifiche parziali, preferisci `config.schema.lookup` poi `config.patch`. Usa
`config.apply` solo quando intendi sostituire intenzionalmente l'intera configurazione.
Lo strumento rifiuta anche di modificare `tools.exec.ask` o `tools.exec.security`;
gli alias legacy `tools.bash.*` vengono normalizzati agli stessi percorsi exec protetti.

### Strumenti forniti dai Plugin

I Plugin possono registrare strumenti aggiuntivi. Alcuni esempi:

- [Diffs](/it/tools/diffs) — visualizzatore e renderer di diff
- [LLM Task](/it/tools/llm-task) — passaggio LLM solo JSON per output strutturato
- [Lobster](/it/tools/lobster) — runtime di workflow tipizzato con approvazioni ripristinabili
- [Generazione musicale](/it/tools/music-generation) — strumento condiviso `music_generate` con provider supportati da workflow
- [OpenProse](/it/prose) — orchestrazione di workflow markdown-first
- [Tokenjuice](/it/tools/tokenjuice) — risultati compatti per strumenti `exec` e `bash` rumorosi

## Configurazione degli strumenti

### Allowlist e deny list

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

OpenClaw fallisce in modalità chiusa quando una allowlist esplicita non si risolve in alcuno strumento chiamabile.
Ad esempio, `tools.allow: ["query_db"]` funziona solo se un Plugin caricato registra davvero
`query_db`. Se nessuno strumento built-in, Plugin o MCP bundled corrisponde alla
allowlist, l'esecuzione si interrompe prima della chiamata al modello invece di continuare come
esecuzione solo testo che potrebbe allucinare risultati di strumenti.

### Profili degli strumenti

`tools.profile` imposta una allowlist di base prima che vengano applicati `allow`/`deny`.
Override per agente: `agents.list[].tools.profile`.

| Profilo     | Cosa include                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Nessuna restrizione (uguale a non impostato)                                                                                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                        |
| `minimal`   | solo `session_status`                                                                                                                             |

`coding` include strumenti web leggeri (`web_search`, `web_fetch`, `x_search`)
ma non lo strumento completo di controllo browser. L'automazione del browser può controllare sessioni reali
e profili autenticati, quindi aggiungilo esplicitamente con
`tools.alsoAllow: ["browser"]` oppure con
`agents.list[].tools.alsoAllow: ["browser"]` per agente.

I profili `coding` e `messaging` consentono anche gli strumenti MCP bundle configurati
sotto la chiave Plugin `bundle-mcp`. Aggiungi `tools.deny: ["bundle-mcp"]` quando
vuoi che un profilo mantenga i suoi normali strumenti built-in ma nasconda tutti gli strumenti MCP configurati.
Il profilo `minimal` non include strumenti MCP bundle.

### Gruppi di strumenti

Usa le abbreviazioni `group:*` nelle allow/deny list:

| Gruppo             | Strumenti                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` è accettato come alias per `exec`)                                  |
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
| `group:openclaw`   | Tutti gli strumenti OpenClaw built-in (esclude gli strumenti Plugin)                                       |

`sessions_history` restituisce una vista di richiamo limitata e filtrata per la sicurezza. Rimuove i tag di thinking, l'impalcatura `<relevant-memories>`, i payload XML di chiamata strumenti in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata strumenti troncati), l'impalcatura declassata delle chiamate strumenti, i token di controllo del modello trapelati in ASCII/full-width e l'XML malformato delle chiamate strumenti MiniMax dal testo dell'assistente, quindi applica redazione/troncamento ed eventuali placeholder per righe sovradimensionate invece di agire come dump grezzo della trascrizione.

### Restrizioni specifiche del provider

Usa `tools.byProvider` per limitare gli strumenti per provider specifici senza
modificare i valori predefiniti globali:

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
