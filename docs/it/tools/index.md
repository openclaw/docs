---
read_when:
    - Vuoi capire quali strumenti fornisce OpenClaw
    - Devi configurare, consentire o negare strumenti
    - Stai decidendo tra strumenti integrati, Skills e plugin
summary: 'Panoramica degli strumenti e dei plugin OpenClaw: cosa può fare l''agente e come estenderlo'
title: Strumenti e plugin
x-i18n:
    generated_at: "2026-04-23T08:36:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef0975c567b0bca0e991a0445d3db4a00fe2e2cf91b9e6bea5686825deac91a0
    source_path: tools/index.md
    workflow: 15
---

# Strumenti e plugin

Tutto ciò che l'agente fa oltre a generare testo avviene tramite **strumenti**.
Gli strumenti sono il modo in cui l'agente legge file, esegue comandi, naviga sul web, invia
messaggi e interagisce con i dispositivi.

## Strumenti, Skills e plugin

OpenClaw ha tre livelli che lavorano insieme:

<Steps>
  <Step title="Gli strumenti sono ciò che l'agente chiama">
    Uno strumento è una funzione tipizzata che l'agente può invocare (ad esempio `exec`, `browser`,
    `web_search`, `message`). OpenClaw fornisce un insieme di **strumenti integrati** e
    i plugin possono registrarne altri.

    L'agente vede gli strumenti come definizioni di funzioni strutturate inviate all'API del modello.

  </Step>

  <Step title="Le Skills insegnano all'agente quando e come">
    Una skill è un file markdown (`SKILL.md`) iniettato nel prompt di sistema.
    Le Skills forniscono all'agente contesto, vincoli e guida passo-passo per
    usare efficacemente gli strumenti. Le Skills si trovano nel tuo workspace, in cartelle condivise,
    oppure sono distribuite dentro i plugin.

    [Riferimento Skills](/it/tools/skills) | [Creazione di Skills](/it/tools/creating-skills)

  </Step>

  <Step title="I plugin impacchettano tutto insieme">
    Un plugin è un pacchetto che può registrare qualsiasi combinazione di capacità:
    canali, provider di modelli, strumenti, Skills, voce, trascrizione realtime,
    voce realtime, comprensione dei media, generazione di immagini, generazione di video,
    web fetch, web search e altro. Alcuni plugin sono **core** (distribuiti con
    OpenClaw), altri sono **esterni** (pubblicati su npm dalla community).

    [Installa e configura i plugin](/it/tools/plugin) | [Crea il tuo](/it/plugins/building-plugins)

  </Step>
</Steps>

## Strumenti integrati

Questi strumenti sono distribuiti con OpenClaw e sono disponibili senza installare plugin:

| Strumento                                  | Cosa fa                                                              | Pagina                                                       |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Esegue comandi shell, gestisce processi in background                | [Exec](/it/tools/exec), [Approvazioni Exec](/it/tools/exec-approvals) |
| `code_execution`                           | Esegue analisi Python remota in sandbox                              | [Code Execution](/it/tools/code-execution)                      |
| `browser`                                  | Controlla un browser Chromium (naviga, clicca, screenshot)           | [Browser](/it/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Cerca sul web, cerca post su X, recupera contenuto delle pagine      | [Web](/it/tools/web), [Web Fetch](/it/tools/web-fetch)             |
| `read` / `write` / `edit`                  | I/O file nel workspace                                               |                                                              |
| `apply_patch`                              | Patch multi-hunk dei file                                            | [Apply Patch](/it/tools/apply-patch)                            |
| `message`                                  | Invia messaggi su tutti i canali                                     | [Agent Send](/it/tools/agent-send)                              |
| `canvas`                                   | Controlla node Canvas (presenta, eval, istantanea)                   |                                                              |
| `nodes`                                    | Scopre e indirizza dispositivi associati                             |                                                              |
| `cron` / `gateway`                         | Gestisce job pianificati; ispeziona, modifica, riavvia o aggiorna il gateway |                                                              |
| `image` / `image_generate`                 | Analizza o genera immagini                                           | [Generazione di immagini](/it/tools/image-generation)           |
| `music_generate`                           | Genera tracce musicali                                               | [Generazione musicale](/it/tools/music-generation)              |
| `video_generate`                           | Genera video                                                         | [Generazione video](/it/tools/video-generation)                 |
| `tts`                                      | Conversione text-to-speech una tantum                                | [TTS](/it/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gestione delle sessioni, stato e orchestrazione di sottoagenti       | [Sottoagenti](/it/tools/subagents)                              |
| `session_status`                           | Lettura leggera in stile `/status` e sovrascrittura del modello di sessione | [Strumenti di sessione](/it/concepts/session-tool)              |

Per il lavoro sulle immagini, usa `image` per l'analisi e `image_generate` per generazione o modifica. Se punti a `openai/*`, `google/*`, `fal/*` o a un altro provider di immagini non predefinito, configura prima l'autenticazione/la chiave API di quel provider.

Per il lavoro musicale, usa `music_generate`. Se punti a `google/*`, `minimax/*` o a un altro provider musicale non predefinito, configura prima l'autenticazione/la chiave API di quel provider.

Per il lavoro video, usa `video_generate`. Se punti a `qwen/*` o a un altro provider video non predefinito, configura prima l'autenticazione/la chiave API di quel provider.

Per la generazione audio guidata da workflow, usa `music_generate` quando un plugin come
ComfyUI lo registra. Questo è separato da `tts`, che è text-to-speech.

`session_status` è lo strumento leggero di stato/rilettura nel gruppo delle sessioni.
Risponde a domande in stile `/status` sulla sessione corrente e può
facoltativamente impostare una sovrascrittura del modello per sessione; `model=default` cancella tale
sovrascrittura. Come `/status`, può riempire retroattivamente contatori sparsi di token/cache e l'
etichetta del modello runtime attivo dall'ultima voce di utilizzo della trascrizione.

`gateway` è lo strumento runtime riservato al proprietario per le operazioni sul gateway:

- `config.schema.lookup` per un sottoalbero di configurazione limitato a un percorso prima delle modifiche
- `config.get` per l'istantanea + hash della configurazione corrente
- `config.patch` per aggiornamenti parziali della configurazione con riavvio
- `config.apply` solo per la sostituzione completa della configurazione
- `update.run` per auto-aggiornamento esplicito + riavvio

Per modifiche parziali, preferisci `config.schema.lookup` poi `config.patch`. Usa
`config.apply` solo quando sostituisci intenzionalmente l'intera configurazione.
Lo strumento rifiuta anche di modificare `tools.exec.ask` o `tools.exec.security`;
gli alias legacy `tools.bash.*` vengono normalizzati agli stessi percorsi exec protetti.

### Strumenti forniti dai plugin

I plugin possono registrare strumenti aggiuntivi. Alcuni esempi:

- [Diffs](/it/tools/diffs) — visualizzatore e renderer di diff
- [LLM Task](/it/tools/llm-task) — passaggio LLM solo JSON per output strutturato
- [Lobster](/it/tools/lobster) — runtime di workflow tipizzato con approvazioni riprendibili
- [Generazione musicale](/it/tools/music-generation) — strumento condiviso `music_generate` con provider supportati da workflow
- [OpenProse](/it/prose) — orchestrazione di workflow markdown-first
- [Tokenjuice](/it/tools/tokenjuice) — risultati compatti e meno rumorosi degli strumenti `exec` e `bash`

## Configurazione degli strumenti

### Allow list e deny list

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
Sovrascrittura per agente: `agents.list[].tools.profile`.

| Profilo     | Cosa include                                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Nessuna restrizione (uguale a non impostato)                                                                                                  |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                     |
| `minimal`   | Solo `session_status`                                                                                                                         |

I profili `coding` e `messaging` consentono anche gli strumenti MCP del bundle configurati
sotto la chiave plugin `bundle-mcp`. Aggiungi `tools.deny: ["bundle-mcp"]` quando
vuoi che un profilo mantenga i normali strumenti integrati ma nasconda tutti gli strumenti MCP configurati.
Il profilo `minimal` non include strumenti MCP del bundle.

### Gruppi di strumenti

Usa le forme abbreviate `group:*` nelle allow/deny list:

| Gruppo             | Strumenti                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` è accettato come alias di `exec`)                                  |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Tutti gli strumenti integrati OpenClaw (esclude gli strumenti dei plugin)                                 |

`sessions_history` restituisce una vista di richiamo limitata e filtrata per sicurezza. Rimuove
tag di ragionamento, scaffolding `<relevant-memories>`, payload XML di chiamata strumenti in testo semplice
(inclusi `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocchi di chiamata strumenti troncati),
scaffolding degradato di chiamata strumenti, token di controllo del modello ASCII/full-width trapelati
e XML malformato di chiamata strumenti MiniMax dal testo dell'assistente, quindi applica
redazione/troncamento ed eventuali segnaposto per righe sovradimensionate invece di agire
come dump grezzo della trascrizione.

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
