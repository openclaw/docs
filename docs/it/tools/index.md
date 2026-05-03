---
read_when:
    - Vuoi capire quali strumenti offre OpenClaw
    - È necessario configurare, consentire o negare gli strumenti
    - Stai decidendo tra strumenti integrati, Skills e Plugin
summary: 'Panoramica degli strumenti e dei plugin di OpenClaw: cosa può fare l''agente e come estenderlo'
title: Strumenti e plugin
x-i18n:
    generated_at: "2026-05-03T21:44:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d1f776639ec2a90d8c02418c4b2c62ae7534ea535f626bc1172f1301c32c6f0
    source_path: tools/index.md
    workflow: 16
---

Tutto ciò che l'agente fa oltre a generare testo avviene tramite **strumenti**.
Gli strumenti sono il modo in cui l'agente legge file, esegue comandi, naviga
sul web, invia messaggi e interagisce con dispositivi.

## Strumenti, Skills e plugin

OpenClaw ha tre livelli che lavorano insieme:

<Steps>
  <Step title="Gli strumenti sono ciò che l'agente chiama">
    Uno strumento è una funzione tipizzata che l'agente può invocare (ad es. `exec`, `browser`,
    `web_search`, `message`). OpenClaw include un insieme di **strumenti integrati** e
    i plugin possono registrarne altri.

    L'agente vede gli strumenti come definizioni di funzioni strutturate inviate all'API del modello.

  </Step>

  <Step title="Le Skills insegnano all'agente quando e come">
    Una skill è un file markdown (`SKILL.md`) iniettato nel prompt di sistema.
    Le Skills forniscono all'agente contesto, vincoli e indicazioni passo passo per
    usare gli strumenti in modo efficace. Le Skills risiedono nel tuo workspace, in cartelle condivise,
    oppure sono incluse nei plugin.

    [Riferimento Skills](/it/tools/skills) | [Creare Skills](/it/tools/creating-skills)

  </Step>

  <Step title="I plugin impacchettano tutto insieme">
    Un plugin è un pacchetto che può registrare qualsiasi combinazione di funzionalità:
    canali, provider di modelli, strumenti, Skills, voce, trascrizione in tempo reale,
    voce in tempo reale, comprensione dei media, generazione di immagini, generazione di video,
    recupero web, ricerca web e altro ancora. Alcuni plugin sono **core** (forniti con
    OpenClaw), altri sono **esterni** (pubblicati su npm dalla community).

    [Installa e configura i plugin](/it/tools/plugin) | [Crea il tuo](/it/plugins/building-plugins)

  </Step>
</Steps>

## Strumenti integrati

Questi strumenti sono inclusi in OpenClaw e sono disponibili senza installare alcun plugin:

| Strumento                                  | Cosa fa                                                               | Pagina                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Esegue comandi shell, gestisce processi in background                 | [Exec](/it/tools/exec), [Approvazioni Exec](/it/tools/exec-approvals) |
| `code_execution`                           | Esegue analisi Python remote in sandbox                               | [Esecuzione codice](/it/tools/code-execution)                   |
| `browser`                                  | Controlla un browser Chromium (naviga, clicca, acquisisce screenshot) | [Browser](/it/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Cerca sul web, cerca post su X, recupera contenuti di pagine          | [Web](/it/tools/web), [Recupero web](/it/tools/web-fetch)          |
| `read` / `write` / `edit`                  | I/O dei file nel workspace                                            |                                                              |
| `apply_patch`                              | Patch di file multi-hunk                                              | [Apply Patch](/it/tools/apply-patch)                            |
| `message`                                  | Invia messaggi su tutti i canali                                      | [Invio agente](/it/tools/agent-send)                            |
| `canvas`                                   | Pilota Canvas di Node (presenta, valuta, snapshot)                    |                                                              |
| `nodes`                                    | Scopre e indirizza dispositivi associati                              |                                                              |
| `cron` / `gateway`                         | Gestisce job pianificati; ispeziona, applica patch, riavvia o aggiorna il gateway |                                                              |
| `image` / `image_generate`                 | Analizza o genera immagini                                            | [Generazione immagini](/it/tools/image-generation)              |
| `music_generate`                           | Genera tracce musicali                                                | [Generazione musicale](/it/tools/music-generation)              |
| `video_generate`                           | Genera video                                                          | [Generazione video](/it/tools/video-generation)                 |
| `tts`                                      | Conversione text-to-speech una tantum                                 | [TTS](/it/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gestione sessioni, stato e orchestrazione di sotto-agenti             | [Sotto-agenti](/it/tools/subagents)                             |
| `session_status`                           | Lettura leggera in stile `/status` e override del modello di sessione | [Strumenti di sessione](/it/concepts/session-tool)              |

Per il lavoro sulle immagini, usa `image` per l'analisi e `image_generate` per la generazione o la modifica. Se scegli come target `openai/*`, `google/*`, `fal/*` o un altro provider di immagini non predefinito, configura prima l'autenticazione/la chiave API di quel provider.

Per il lavoro sulla musica, usa `music_generate`. Se scegli come target `google/*`, `minimax/*` o un altro provider musicale non predefinito, configura prima l'autenticazione/la chiave API di quel provider.

Per il lavoro sui video, usa `video_generate`. Se scegli come target `qwen/*` o un altro provider video non predefinito, configura prima l'autenticazione/la chiave API di quel provider.

Per la generazione audio guidata da workflow, usa `music_generate` quando un plugin come
ComfyUI lo registra. Questo è separato da `tts`, che è text-to-speech.

`session_status` è lo strumento leggero di stato/lettura nel gruppo sessioni.
Risponde a domande in stile `/status` sulla sessione corrente e può
opzionalmente impostare un override del modello per sessione; `model=default` cancella tale
override. Come `/status`, può completare retroattivamente contatori sparsi di token/cache e l'etichetta
del modello runtime attivo dall'ultima voce di utilizzo della trascrizione.

`gateway` è lo strumento runtime riservato al proprietario per le operazioni sul gateway:

- `config.schema.lookup` per un sottoalbero di configurazione con ambito su un percorso prima delle modifiche
- `config.get` per lo snapshot della configurazione corrente + hash
- `config.patch` per aggiornamenti parziali della configurazione con riavvio
- `config.apply` solo per la sostituzione completa della configurazione
- `update.run` per autoaggiornamento esplicito + riavvio

Per modifiche parziali, preferisci `config.schema.lookup` e poi `config.patch`. Usa
`config.apply` solo quando intendi sostituire l'intera configurazione.
Per documentazione più ampia sulla configurazione, leggi [Configurazione](/it/gateway/configuration) e
[Riferimento configurazione](/it/gateway/configuration-reference).
Lo strumento inoltre rifiuta di modificare `tools.exec.ask` o `tools.exec.security`;
gli alias legacy `tools.bash.*` vengono normalizzati sugli stessi percorsi exec protetti.

### Strumenti forniti dai plugin

I plugin possono registrare strumenti aggiuntivi. Alcuni esempi:

- [Diff](/it/tools/diffs) — visualizzatore e renderer di diff
- [Task LLM](/it/tools/llm-task) — passaggio LLM solo JSON per output strutturato
- [Lobster](/it/tools/lobster) — runtime di workflow tipizzato con approvazioni riprendibili
- [Generazione musicale](/it/tools/music-generation) — strumento condiviso `music_generate` con provider basati su workflow
- [OpenProse](/it/prose) — orchestrazione di workflow markdown-first
- [Tokenjuice](/it/tools/tokenjuice) — compatta risultati rumorosi degli strumenti `exec` e `bash`

Gli strumenti dei plugin sono comunque definiti con `api.registerTool(...)` e dichiarati
nell'elenco `contracts.tools` del manifesto del plugin. OpenClaw acquisisce il descrittore
validato dello strumento durante la scoperta e lo mette in cache per sorgente e contratto del plugin, così
la pianificazione successiva degli strumenti può evitare il caricamento del runtime del plugin. L'esecuzione dello strumento carica comunque
il plugin proprietario e chiama l'implementazione registrata live.

## Configurazione degli strumenti

### Liste di inclusione ed esclusione

Controlla quali strumenti l'agente può chiamare tramite `tools.allow` / `tools.deny` nella
configurazione. L'esclusione prevale sempre sull'inclusione.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw fallisce in modo chiuso quando un allowlist esplicito non risolve alcuno strumento chiamabile.
Per esempio, `tools.allow: ["query_db"]` funziona solo se un plugin caricato registra effettivamente
`query_db`. Se nessuno strumento integrato, plugin o MCP in bundle corrisponde all'allowlist,
l'esecuzione si ferma prima della chiamata al modello invece di continuare come
esecuzione solo testuale che potrebbe allucinare risultati di strumenti.

### Profili strumenti

`tools.profile` imposta un allowlist di base prima che venga applicato `allow`/`deny`.
Override per agente: `agents.list[].tools.profile`.

| Profilo     | Cosa include                                                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Tutti gli strumenti core e opzionali dei plugin; base senza restrizioni per accesso più ampio a comando/controllo                                  |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                          |
| `minimal`   | Solo `session_status`                                                                                                                              |

<Note>
`tools.profile: "messaging"` è intenzionalmente ristretto per agenti focalizzati sui canali.
Esclude strumenti più ampi di comando/controllo come filesystem, runtime,
browser, canvas, nodi, cron e controllo del gateway. Usa `tools.profile: "full"`
come base senza restrizioni per accesso più ampio a comando/controllo, poi limita
l'accesso con `tools.allow` / `tools.deny` quando necessario.
</Note>

`coding` include strumenti web leggeri (`web_search`, `web_fetch`, `x_search`)
ma non lo strumento completo di controllo del browser. L'automazione del browser può pilotare
sessioni reali e profili con login, quindi aggiungila esplicitamente con
`tools.alsoAllow: ["browser"]` o con
`agents.list[].tools.alsoAllow: ["browser"]` per agente.

<Note>
Configurare `tools.exec` o `tools.fs` sotto un profilo restrittivo (`messaging`, `minimal`) non amplia implicitamente l'allowlist del profilo. Aggiungi voci esplicite in `tools.alsoAllow` (per esempio `["exec", "process"]` per exec, o `["read", "write", "edit"]` per fs) quando vuoi che un profilo restrittivo usi quelle sezioni configurate. OpenClaw registra un avviso di avvio quando una sezione di configurazione è presente senza una concessione `alsoAllow` corrispondente.
</Note>

I profili `coding` e `messaging` consentono anche strumenti MCP in bundle configurati
sotto la chiave plugin `bundle-mcp`. Aggiungi `tools.deny: ["bundle-mcp"]` quando
vuoi che un profilo mantenga i suoi normali strumenti integrati ma nasconda tutti gli strumenti MCP configurati.
Il profilo `minimal` non include strumenti MCP in bundle.

Esempio (superficie di strumenti più ampia per impostazione predefinita):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Gruppi di strumenti

Usa le abbreviazioni `group:*` nelle liste allow/deny:

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
| `group:openclaw`   | Tutti gli strumenti OpenClaw integrati (esclude gli strumenti dei plugin)                                 |

`sessions_history` restituisce una vista di richiamo limitata e filtrata per la sicurezza. Rimuove
tag di ragionamento, strutture di supporto `<relevant-memories>`, payload XML
di chiamate a strumenti in testo semplice (inclusi `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocchi di chiamate a strumenti troncati),
strutture di supporto di chiamate a strumenti declassate, token di controllo
del modello trapelati in ASCII/a larghezza intera e XML di chiamate a strumenti
MiniMax non valido dal testo dell’assistente, quindi applica redazione/troncamento
e possibili segnaposto per righe sovradimensionate invece di comportarsi
come un dump grezzo della trascrizione.

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
