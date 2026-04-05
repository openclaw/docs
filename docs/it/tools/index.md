---
read_when:
    - Vuoi capire quali strumenti fornisce OpenClaw
    - Devi configurare, consentire o negare strumenti
    - Stai decidendo tra strumenti integrati, Skills e plugin
summary: 'Panoramica di strumenti e plugin di OpenClaw: cosa può fare l''agente e come estenderlo'
title: Strumenti e plugin
x-i18n:
    generated_at: "2026-04-05T14:06:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17768048b23f980de5e502cc30fbddbadc2e26ae62f0f03c5ab5bbcdeea67e50
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
  <Step title="Gli strumenti sono ciò che l'agente invoca">
    Uno strumento è una funzione tipizzata che l'agente può invocare (ad es. `exec`, `browser`,
    `web_search`, `message`). OpenClaw include un insieme di **strumenti integrati** e
    i plugin possono registrarne altri.

    L'agente vede gli strumenti come definizioni di funzione strutturate inviate all'API del modello.

  </Step>

  <Step title="Le Skills insegnano all'agente quando e come">
    Una Skill è un file markdown (`SKILL.md`) iniettato nel prompt di sistema.
    Le Skills forniscono all'agente contesto, vincoli e indicazioni passo passo per
    usare gli strumenti in modo efficace. Le Skills si trovano nel tuo workspace, in cartelle condivise,
    oppure sono incluse nei plugin.

    [Riferimento Skills](/tools/skills) | [Creare Skills](/tools/creating-skills)

  </Step>

  <Step title="I plugin raggruppano tutto insieme">
    Un plugin è un pacchetto che può registrare qualsiasi combinazione di funzionalità:
    canali, provider di modelli, strumenti, Skills, voce, trascrizione in tempo reale,
    voce in tempo reale, comprensione dei media, generazione di immagini, generazione di video,
    web fetch, web search e altro. Alcuni plugin sono **core** (inclusi con
    OpenClaw), altri sono **esterni** (pubblicati su npm dalla comunità).

    [Installare e configurare i plugin](/tools/plugin) | [Crea il tuo](/it/plugins/building-plugins)

  </Step>
</Steps>

## Strumenti integrati

Questi strumenti sono inclusi con OpenClaw e sono disponibili senza installare alcun plugin:

| Strumento                                  | Cosa fa                                                              | Pagina                                  |
| ------------------------------------------ | -------------------------------------------------------------------- | --------------------------------------- |
| `exec` / `process`                         | Esegue comandi shell, gestisce processi in background                | [Exec](/tools/exec)                     |
| `code_execution`                           | Esegue analisi Python remote in sandbox                              | [Code Execution](/tools/code-execution) |
| `browser`                                  | Controlla un browser Chromium (navigazione, clic, screenshot)        | [Browser](/tools/browser)               |
| `web_search` / `x_search` / `web_fetch`    | Cerca nel web, cerca post su X, recupera contenuti di pagina         | [Web](/tools/web)                       |
| `read` / `write` / `edit`                  | I/O su file nel workspace                                            |                                         |
| `apply_patch`                              | Patch di file multi-hunk                                             | [Apply Patch](/tools/apply-patch)       |
| `message`                                  | Invia messaggi su tutti i canali                                     | [Agent Send](/tools/agent-send)         |
| `canvas`                                   | Controlla node Canvas (present, eval, snapshot)                      |                                         |
| `nodes`                                    | Individua e seleziona dispositivi associati                          |                                         |
| `cron` / `gateway`                         | Gestisce job pianificati; ispeziona, applica patch, riavvia o aggiorna il gateway |                                         |
| `image` / `image_generate`                 | Analizza o genera immagini                                           |                                         |
| `tts`                                      | Conversione text-to-speech one-shot                                  | [TTS](/tools/tts)                       |
| `sessions_*` / `subagents` / `agents_list` | Gestione delle sessioni, stato e orchestrazione di sotto-agenti      | [Sub-agents](/tools/subagents)          |
| `session_status`                           | Lettura leggera in stile `/status` e override del modello per sessione | [Session Tools](/it/concepts/session-tool) |

Per il lavoro sulle immagini, usa `image` per l'analisi e `image_generate` per la generazione o la modifica. Se usi `openai/*`, `google/*`, `fal/*` o un altro provider di immagini non predefinito, configura prima l'autenticazione/la chiave API di quel provider.

`session_status` è lo strumento leggero di stato/rilettura nel gruppo sessions.
Risponde a domande in stile `/status` sulla sessione corrente e può
facoltativamente impostare un override del modello per sessione; `model=default` rimuove tale
override. Come `/status`, può ricostruire contatori sparsi di token/cache e l'etichetta
del modello runtime attivo dall'ultima voce di utilizzo della trascrizione.

`gateway` è lo strumento runtime riservato al proprietario per le operazioni sul gateway:

- `config.schema.lookup` per un sottoalbero di configurazione limitato a un percorso prima delle modifiche
- `config.get` per lo snapshot di configurazione corrente + hash
- `config.patch` per aggiornamenti parziali della configurazione con riavvio
- `config.apply` solo per la sostituzione completa della configurazione
- `update.run` per auto-aggiornamento esplicito + riavvio

Per modifiche parziali, preferisci `config.schema.lookup` e poi `config.patch`. Usa
`config.apply` solo quando intendi sostituire l'intera configurazione.
Lo strumento rifiuta anche di modificare `tools.exec.ask` o `tools.exec.security`;
gli alias legacy `tools.bash.*` vengono normalizzati negli stessi percorsi exec protetti.

### Strumenti forniti dai plugin

I plugin possono registrare strumenti aggiuntivi. Alcuni esempi:

- [Lobster](/tools/lobster) — runtime di workflow tipizzato con approvazioni riprendibili
- [LLM Task](/tools/llm-task) — passaggio LLM solo JSON per output strutturato
- [Diffs](/tools/diffs) — visualizzatore e renderer di diff
- [OpenProse](/it/prose) — orchestrazione di workflow markdown-first

## Configurazione degli strumenti

### Liste di autorizzazione e di negazione

Controlla quali strumenti l'agente può invocare tramite `tools.allow` / `tools.deny` nella
configurazione. Il deny prevale sempre sull'allow.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Profili degli strumenti

`tools.profile` imposta una allowlist di base prima dell'applicazione di `allow`/`deny`.
Override per agente: `agents.list[].tools.profile`.

| Profilo     | Cosa include                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `full`      | Nessuna restrizione (uguale a non impostato)                                                                                |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                     |
| `minimal`   | Solo `session_status`                                                                                         |

### Gruppi di strumenti

Usa le abbreviazioni `group:*` nelle liste allow/deny:

| Gruppo             | Strumenti                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` è accettato come alias di `exec`)                                 |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, tts                                                                                |
| `group:openclaw`   | Tutti gli strumenti integrati di OpenClaw (esclude gli strumenti dei plugin)                                                       |

`sessions_history` restituisce una vista di richiamo limitata e filtrata per la sicurezza. Rimuove
i tag di pensiero, l'impalcatura `<relevant-memories>`, i payload XML di chiamata agli strumenti in testo normale
(inclusi `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocchi troncati di chiamata agli strumenti),
l'impalcatura degradata delle chiamate agli strumenti, i token di controllo del modello ASCII/a larghezza piena trapelati
e il malformed MiniMax tool-call XML dal testo dell'assistente, quindi applica
redazione/troncamento e possibili placeholder per righe sovradimensionate invece di agire
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
