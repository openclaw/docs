---
read_when:
    - Vuoi capire quali strumenti offre OpenClaw
    - È necessario configurare, consentire o negare gli strumenti
    - Stai scegliendo tra strumenti integrati, Skills e Plugin
summary: 'Panoramica degli strumenti e dei plugin di OpenClaw: cosa può fare l''agente e come estenderlo'
title: Strumenti e plugin
x-i18n:
    generated_at: "2026-04-30T16:30:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7acfac11669b6f9696a368c08afada8d33e30ac2f452d507f5d1bc36bae367eb
    source_path: tools/index.md
    workflow: 16
---

Tutto ciò che l'agente fa oltre a generare testo avviene tramite **strumenti**.
Gli strumenti sono il modo in cui l'agente legge file, esegue comandi, naviga sul web, invia
messaggi e interagisce con i dispositivi.

## Strumenti, Skills e plugin

OpenClaw ha tre livelli che lavorano insieme:

<Steps>
  <Step title="Gli strumenti sono ciò che l'agente chiama">
    Uno strumento è una funzione tipizzata che l'agente può invocare (ad esempio `exec`, `browser`,
    `web_search`, `message`). OpenClaw include un insieme di **strumenti integrati** e
    i plugin possono registrarne altri.

    L'agente vede gli strumenti come definizioni di funzioni strutturate inviate all'API del modello.

  </Step>

  <Step title="Le Skills insegnano all'agente quando e come">
    Una skill è un file markdown (`SKILL.md`) iniettato nel prompt di sistema.
    Le Skills forniscono all'agente contesto, vincoli e indicazioni passo passo per
    usare gli strumenti in modo efficace. Le Skills si trovano nel tuo workspace, in cartelle condivise,
    oppure sono incluse nei plugin.

    [Riferimento delle Skills](/it/tools/skills) | [Creare Skills](/it/tools/creating-skills)

  </Step>

  <Step title="I plugin impacchettano tutto insieme">
    Un plugin è un pacchetto che può registrare qualsiasi combinazione di funzionalità:
    canali, provider di modelli, strumenti, Skills, voce, trascrizione in tempo reale,
    voce in tempo reale, comprensione dei media, generazione di immagini, generazione di video,
    recupero web, ricerca web e altro ancora. Alcuni plugin sono **core** (forniti con
    OpenClaw), altri sono **esterni** (pubblicati su npm dalla community).

    [Installare e configurare i plugin](/it/tools/plugin) | [Costruisci il tuo](/it/plugins/building-plugins)

  </Step>
</Steps>

## Strumenti integrati

Questi strumenti sono inclusi in OpenClaw e sono disponibili senza installare alcun plugin:

| Strumento                                  | Cosa fa                                                               | Pagina                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Esegue comandi shell, gestisce processi in background                 | [Exec](/it/tools/exec), [Approvazioni Exec](/it/tools/exec-approvals) |
| `code_execution`                           | Esegue analisi Python remote in sandbox                               | [Esecuzione di codice](/it/tools/code-execution)                |
| `browser`                                  | Controlla un browser Chromium (naviga, clicca, screenshot)            | [Browser](/it/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Cerca sul web, cerca post X, recupera contenuti di pagine             | [Web](/it/tools/web), [Recupero web](/it/tools/web-fetch)          |
| `read` / `write` / `edit`                  | I/O di file nel workspace                                             |                                                              |
| `apply_patch`                              | Patch di file multi-hunk                                              | [Applica patch](/it/tools/apply-patch)                          |
| `message`                                  | Invia messaggi su tutti i canali                                      | [Invio agente](/it/tools/agent-send)                            |
| `canvas`                                   | Controlla Canvas Node (presentazione, valutazione, snapshot)          |                                                              |
| `nodes`                                    | Individua e indirizza dispositivi associati                           |                                                              |
| `cron` / `gateway`                         | Gestisce job pianificati; ispeziona, applica patch, riavvia o aggiorna il gateway |                                                              |
| `image` / `image_generate`                 | Analizza o genera immagini                                            | [Generazione di immagini](/it/tools/image-generation)           |
| `music_generate`                           | Genera tracce musicali                                                | [Generazione musicale](/it/tools/music-generation)              |
| `video_generate`                           | Genera video                                                          | [Generazione video](/it/tools/video-generation)                 |
| `tts`                                      | Conversione testo-voce una tantum                                     | [TTS](/it/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gestione delle sessioni, stato e orchestrazione dei sotto-agenti      | [Sotto-agenti](/it/tools/subagents)                             |
| `session_status`                           | Rilettura leggera in stile `/status` e override del modello di sessione | [Strumenti di sessione](/it/concepts/session-tool)              |

Per il lavoro sulle immagini, usa `image` per l'analisi e `image_generate` per la generazione o la modifica. Se scegli come destinazione `openai/*`, `google/*`, `fal/*` o un altro provider di immagini non predefinito, configura prima l'autenticazione/la chiave API di quel provider.

Per il lavoro sulla musica, usa `music_generate`. Se scegli come destinazione `google/*`, `minimax/*` o un altro provider musicale non predefinito, configura prima l'autenticazione/la chiave API di quel provider.

Per il lavoro sui video, usa `video_generate`. Se scegli come destinazione `qwen/*` o un altro provider video non predefinito, configura prima l'autenticazione/la chiave API di quel provider.

Per la generazione audio guidata da workflow, usa `music_generate` quando un plugin come
ComfyUI lo registra. Questo è separato da `tts`, che è testo-voce.

`session_status` è lo strumento leggero di stato/rilettura nel gruppo delle sessioni.
Risponde a domande in stile `/status` sulla sessione corrente e può
impostare facoltativamente un override del modello per sessione; `model=default` cancella tale
override. Come `/status`, può completare retroattivamente contatori sparsi di token/cache e
l'etichetta del modello runtime attivo dall'ultima voce di utilizzo della trascrizione.

`gateway` è lo strumento runtime riservato al proprietario per le operazioni del gateway:

- `config.schema.lookup` per un sottoalbero di configurazione con ambito di percorso prima delle modifiche
- `config.get` per lo snapshot di configurazione corrente + hash
- `config.patch` per aggiornamenti parziali della configurazione con riavvio
- `config.apply` solo per la sostituzione completa della configurazione
- `update.run` per auto-aggiornamento esplicito + riavvio

Per modifiche parziali, preferisci `config.schema.lookup` e poi `config.patch`. Usa
`config.apply` solo quando intendi sostituire l'intera configurazione.
Per documentazione di configurazione più ampia, leggi [Configurazione](/it/gateway/configuration) e
[Riferimento della configurazione](/it/gateway/configuration-reference).
Lo strumento rifiuta inoltre di modificare `tools.exec.ask` o `tools.exec.security`;
gli alias legacy `tools.bash.*` vengono normalizzati agli stessi percorsi exec protetti.

### Strumenti forniti dai plugin

I plugin possono registrare strumenti aggiuntivi. Alcuni esempi:

- [Diff](/it/tools/diffs) — visualizzatore e renderer di diff
- [Attività LLM](/it/tools/llm-task) — passaggio LLM solo JSON per output strutturato
- [Lobster](/it/tools/lobster) — runtime di workflow tipizzato con approvazioni ripristinabili
- [Generazione musicale](/it/tools/music-generation) — strumento condiviso `music_generate` con provider basati su workflow
- [OpenProse](/it/prose) — orchestrazione di workflow markdown-first
- [Tokenjuice](/it/tools/tokenjuice) — compatta risultati rumorosi degli strumenti `exec` e `bash`

## Configurazione degli strumenti

### Liste di autorizzazione e divieto

Controlla quali strumenti l'agente può chiamare tramite `tools.allow` / `tools.deny` nella
configurazione. Il divieto prevale sempre sull'autorizzazione.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw fallisce in modo chiuso quando una allowlist esplicita non risolve alcuno strumento chiamabile.
Ad esempio, `tools.allow: ["query_db"]` funziona solo se un plugin caricato registra effettivamente
`query_db`. Se nessuno strumento integrato, plugin o strumento MCP in bundle corrisponde alla
allowlist, l'esecuzione si ferma prima della chiamata al modello invece di continuare come
esecuzione solo testo che potrebbe allucinare risultati degli strumenti.

### Profili degli strumenti

`tools.profile` imposta una allowlist di base prima che venga applicato `allow`/`deny`.
Override per agente: `agents.list[].tools.profile`.

| Profilo     | Cosa include                                                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Baseline senza restrizioni per accesso più ampio a comandi/controllo; uguale a lasciare `tools.profile` non impostato                              |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Solo `session_status`                                                                                                                              |

<Note>
`tools.profile: "messaging"` è intenzionalmente ristretto per agenti focalizzati sui canali.
Esclude strumenti più ampi di comando/controllo come filesystem, runtime,
browser, canvas, nodi, cron e controllo del gateway. Usa `tools.profile: "full"`
come baseline senza restrizioni per un accesso più ampio a comandi/controllo, quindi limita
l'accesso con `tools.allow` / `tools.deny` quando necessario.
</Note>

`coding` include strumenti web leggeri (`web_search`, `web_fetch`, `x_search`)
ma non lo strumento completo di controllo del browser. L'automazione del browser può guidare
sessioni reali e profili con accesso effettuato, quindi aggiungila esplicitamente con
`tools.alsoAllow: ["browser"]` o con
`agents.list[].tools.alsoAllow: ["browser"]` per agente.

<Note>
Configurare `tools.exec` o `tools.fs` sotto un profilo restrittivo (`messaging`, `minimal`) non amplia implicitamente la allowlist del profilo. Aggiungi voci esplicite in `tools.alsoAllow` (ad esempio `["exec", "process"]` per exec, oppure `["read", "write", "edit"]` per fs) quando vuoi che un profilo restrittivo usi quelle sezioni configurate. OpenClaw registra un avviso di avvio quando una sezione di configurazione è presente senza una concessione `alsoAllow` corrispondente.
</Note>

I profili `coding` e `messaging` consentono anche strumenti MCP in bundle configurati
sotto la chiave plugin `bundle-mcp`. Aggiungi `tools.deny: ["bundle-mcp"]` quando
vuoi che un profilo mantenga i suoi normali strumenti integrati ma nasconda tutti gli strumenti MCP configurati.
Il profilo `minimal` non include strumenti MCP in bundle.

Esempio (superficie strumenti più ampia per impostazione predefinita):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Gruppi di strumenti

Usa le abbreviazioni `group:*` nelle liste di autorizzazione/divieto:

| Gruppo             | Strumenti                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` è accettato come alias per `exec`)                                  |
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
| `group:openclaw`   | Tutti gli strumenti OpenClaw integrati (esclude gli strumenti plugin)                                     |

`sessions_history` restituisce una vista di richiamo limitata e filtrata per sicurezza. Rimuove
tag di pensiero, strutture di supporto `<relevant-memories>`, payload XML
di chiamata agli strumenti in testo semplice (inclusi `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocchi di chiamata agli strumenti troncati),
strutture di supporto di chiamata agli strumenti declassate, token ASCII/a larghezza piena
di controllo del modello trapelati e XML di chiamata agli strumenti MiniMax malformato
dal testo dell'assistente, quindi applica oscuramento/troncamento e possibili segnaposto
per righe sovradimensionate invece di comportarsi come un dump grezzo della trascrizione.

### Restrizioni specifiche del provider

Usa `tools.byProvider` per limitare gli strumenti per provider specifici senza
modificare le impostazioni predefinite globali:

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
