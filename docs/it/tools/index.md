---
read_when:
    - Vuoi capire quali strumenti fornisce OpenClaw
    - È necessario configurare, consentire o negare gli strumenti
    - Stai scegliendo tra strumenti integrati, Skills e Plugin
summary: 'Panoramica degli strumenti e dei Plugin di OpenClaw: cosa può fare l''agente e come estenderlo'
title: Strumenti e Plugin
x-i18n:
    generated_at: "2026-05-07T13:26:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: e001a51222a1b838ded2498bcedc6bd95dbc0a8912850ad7de21e28b25c50790
    source_path: tools/index.md
    workflow: 16
---

Tutto ciò che l'agente fa oltre a generare testo avviene tramite **strumenti**.
Gli strumenti sono il modo in cui l'agente legge file, esegue comandi, naviga
sul web, invia messaggi e interagisce con i dispositivi.

## Strumenti, Skills e plugin

OpenClaw ha tre livelli che lavorano insieme:

<Steps>
  <Step title="Gli strumenti sono ciò che l'agente chiama">
    Uno strumento è una funzione tipizzata che l'agente può invocare (ad es. `exec`, `browser`,
    `web_search`, `message`). OpenClaw include un insieme di **strumenti integrati** e
    i plugin possono registrarne altri.

    L'agente vede gli strumenti come definizioni di funzione strutturate inviate all'API del modello.

  </Step>

  <Step title="Le Skills insegnano all'agente quando e come">
    Una skill è un file markdown (`SKILL.md`) inserito nel prompt di sistema.
    Le Skills forniscono all'agente contesto, vincoli e indicazioni passo passo per
    usare gli strumenti in modo efficace. Le Skills vivono nel tuo workspace, in cartelle condivise
    o sono incluse nei plugin.

    [Riferimento Skills](/it/tools/skills) | [Creare Skills](/it/tools/creating-skills)

  </Step>

  <Step title="I plugin impacchettano tutto insieme">
    Un plugin è un pacchetto che può registrare qualsiasi combinazione di funzionalità:
    canali, provider di modelli, strumenti, Skills, sintesi vocale, trascrizione in tempo reale,
    voce in tempo reale, comprensione dei media, generazione di immagini, generazione di video,
    recupero web, ricerca web e altro. Alcuni plugin sono **core** (distribuiti con
    OpenClaw), altri sono **esterni** (pubblicati su npm dalla community).

    [Installa e configura i plugin](/it/tools/plugin) | [Crea il tuo](/it/plugins/building-plugins)

  </Step>
</Steps>

## Strumenti integrati

Questi strumenti sono inclusi in OpenClaw e sono disponibili senza installare alcun plugin:

| Strumento                                  | Cosa fa                                                               | Pagina                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Esegue comandi shell, gestisce processi in background                 | [Exec](/it/tools/exec), [Approvazioni Exec](/it/tools/exec-approvals) |
| `code_execution`                           | Esegue analisi Python remote in sandbox                               | [Esecuzione di codice](/it/tools/code-execution)                |
| `browser`                                  | Controlla un browser Chromium (navigazione, clic, screenshot)         | [Browser](/it/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Cerca sul web, cerca post su X, recupera contenuti di pagine          | [Web](/it/tools/web), [Recupero web](/it/tools/web-fetch)          |
| `read` / `write` / `edit`                  | I/O su file nel workspace                                             |                                                              |
| `apply_patch`                              | Patch di file multi-hunk                                              | [Applica patch](/it/tools/apply-patch)                          |
| `message`                                  | Invia messaggi su tutti i canali                                      | [Invio agente](/it/tools/agent-send)                            |
| `nodes`                                    | Scopre e indirizza dispositivi associati                              |                                                              |
| `cron` / `gateway`                         | Gestisce job pianificati; ispeziona, applica patch, riavvia o aggiorna il gateway |                                                              |
| `image` / `image_generate`                 | Analizza o genera immagini                                            | [Generazione di immagini](/it/tools/image-generation)           |
| `music_generate`                           | Genera tracce musicali                                                | [Generazione musicale](/it/tools/music-generation)              |
| `video_generate`                           | Genera video                                                          | [Generazione video](/it/tools/video-generation)                 |
| `tts`                                      | Conversione testo-voce una tantum                                     | [TTS](/it/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gestione sessioni, stato e orchestrazione di sotto-agenti             | [Sotto-agenti](/it/tools/subagents)                             |
| `session_status`                           | Lettura leggera in stile `/status` e override del modello di sessione | [Strumenti di sessione](/it/concepts/session-tool)              |

Per il lavoro sulle immagini, usa `image` per l'analisi e `image_generate` per la generazione o la modifica. Se usi come target `openai/*`, `google/*`, `fal/*` o un altro provider di immagini non predefinito, configura prima l'autenticazione/la chiave API di quel provider.

Per il lavoro sulla musica, usa `music_generate`. Se usi come target `google/*`, `minimax/*` o un altro provider musicale non predefinito, configura prima l'autenticazione/la chiave API di quel provider.

Per il lavoro sui video, usa `video_generate`. Se usi come target `qwen/*` o un altro provider video non predefinito, configura prima l'autenticazione/la chiave API di quel provider.

Per la generazione audio guidata da workflow, usa `music_generate` quando un plugin come
ComfyUI lo registra. Questo è separato da `tts`, che è text-to-speech.

`session_status` è lo strumento leggero di stato/lettura nel gruppo sessioni.
Risponde a domande in stile `/status` sulla sessione corrente e può
facoltativamente impostare un override del modello per sessione; `model=default` cancella tale
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
Per documentazione più ampia sulla configurazione, leggi [Configurazione](/it/gateway/configuration) e
[Riferimento configurazione](/it/gateway/configuration-reference).
Lo strumento rifiuta anche di modificare `tools.exec.ask` o `tools.exec.security`;
gli alias legacy `tools.bash.*` si normalizzano negli stessi percorsi exec protetti.

### Strumenti forniti dai plugin

I plugin possono registrare strumenti aggiuntivi. Alcuni esempi:

- [Canvas](/it/plugins/reference/canvas) — plugin sperimentale incluso per il controllo di Canvas Node e il rendering A2UI
- [Diff](/it/tools/diffs) — visualizzatore e renderer di diff
- [Attività LLM](/it/tools/llm-task) — passaggio LLM solo JSON per output strutturato
- [Lobster](/it/tools/lobster) — runtime di workflow tipizzato con approvazioni riprendibili
- [Generazione musicale](/it/tools/music-generation) — strumento condiviso `music_generate` con provider basati su workflow
- [OpenProse](/it/prose) — orchestrazione di workflow markdown-first
- [Tokenjuice](/it/tools/tokenjuice) — compatta risultati rumorosi degli strumenti `exec` e `bash`

Gli strumenti dei plugin sono comunque creati con `api.registerTool(...)` e dichiarati
nell'elenco `contracts.tools` del manifesto del plugin. OpenClaw acquisisce il descrittore
di strumento validato durante la discovery e lo memorizza nella cache per sorgente e contratto del plugin, così
la pianificazione successiva degli strumenti può saltare il caricamento del runtime del plugin. L'esecuzione dello strumento carica comunque
il plugin proprietario e chiama l'implementazione registrata live.

## Configurazione degli strumenti

### Elenchi di inclusione ed esclusione

Controlla quali strumenti può chiamare l'agente tramite `tools.allow` / `tools.deny` nella
configurazione. Deny ha sempre la precedenza su allow.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw fallisce in modo chiuso quando un allowlist esplicito non risolve alcuno strumento chiamabile.
Ad esempio, `tools.allow: ["query_db"]` funziona solo se un plugin caricato registra effettivamente
`query_db`. Se nessuno strumento integrato, plugin o MCP incluso corrisponde
all'allowlist, l'esecuzione si interrompe prima della chiamata al modello invece di continuare come
esecuzione solo testo che potrebbe allucinare risultati degli strumenti.

### Profili strumenti

`tools.profile` imposta un allowlist di base prima che `allow`/`deny` venga applicato.
Override per agente: `agents.list[].tools.profile`.

| Profilo     | Cosa include                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Tutti gli strumenti core e dei plugin opzionali; baseline senza restrizioni per un accesso più ampio a comandi/controllo                          |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Solo `session_status`                                                                                                                             |

<Note>
`tools.profile: "messaging"` è intenzionalmente ristretto per agenti focalizzati sui canali.
Esclude strumenti più ampi di comando/controllo come filesystem, runtime,
browser, canvas, nodes, cron e controllo gateway. Usa `tools.profile: "full"`
come baseline senza restrizioni per un accesso più ampio a comandi/controllo, poi limita
l'accesso con `tools.allow` / `tools.deny` quando necessario.
</Note>

`coding` include strumenti web leggeri (`web_search`, `web_fetch`, `x_search`)
ma non lo strumento completo di controllo del browser. L'automazione del browser può guidare sessioni reali
e profili con accesso effettuato, quindi aggiungilo esplicitamente con
`tools.alsoAllow: ["browser"]` o con un valore per agente
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
Configurare `tools.exec` o `tools.fs` sotto un profilo restrittivo (`messaging`, `minimal`) non amplia implicitamente l'allowlist del profilo. Aggiungi voci esplicite in `tools.alsoAllow` (ad esempio `["exec", "process"]` per exec, o `["read", "write", "edit"]` per fs) quando vuoi che un profilo restrittivo usi quelle sezioni configurate. OpenClaw registra un avviso di avvio quando una sezione di configurazione è presente senza una concessione `alsoAllow` corrispondente.
</Note>

I profili `coding` e `messaging` consentono anche strumenti MCP bundle configurati
sotto la chiave plugin `bundle-mcp`. Aggiungi `tools.deny: ["bundle-mcp"]` quando
vuoi che un profilo mantenga i suoi normali strumenti integrati ma nasconda tutti gli strumenti MCP configurati.
Il profilo `minimal` non include strumenti MCP bundle.

Esempio (superficie strumenti più ampia per impostazione predefinita):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Gruppi di strumenti

Usa le scorciatoie `group:*` negli elenchi allow/deny:

| Gruppo             | Strumenti                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` è accettato come alias per `exec`)                                  |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas quando il Plugin Canvas incluso è abilitato                                               |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Tutti gli strumenti OpenClaw integrati (esclude gli strumenti dei Plugin)                                 |

`sessions_history` restituisce una vista di richiamo limitata e filtrata per sicurezza. Rimuove
i tag di ragionamento, l’impalcatura `<relevant-memories>`, i payload XML
in testo normale delle chiamate agli strumenti (inclusi `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e i blocchi di chiamata agli strumenti troncati),
l’impalcatura declassata delle chiamate agli strumenti, i token di controllo del modello
ASCII/a larghezza intera trapelati e XML MiniMax di chiamata agli strumenti non valido
dal testo dell’assistente, poi applica redazione/troncamento e possibili segnaposto per righe
sovradimensionate invece di agire come dump grezzo della trascrizione.

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
