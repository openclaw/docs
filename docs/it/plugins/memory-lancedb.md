---
read_when:
    - Stai configurando il plugin memory-lancedb
    - Vuoi una memoria a lungo termine basata su LanceDB con richiamo automatico o acquisizione automatica
    - Stai utilizzando incorporamenti locali compatibili con OpenAI, come Ollama
sidebarTitle: Memory LanceDB
summary: Configura il Plugin di memoria esterno ufficiale LanceDB, inclusi gli embedding locali compatibili con Ollama
title: Memoria LanceDB
x-i18n:
    generated_at: "2026-07-12T07:16:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cdcf5ef7b7fbb8bf6055363d86782cfa36df193fc724406dba06c1380fd9f434
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` è un plugin esterno ufficiale che archivia la memoria a lungo termine in
LanceDB con ricerca vettoriale. Può richiamare automaticamente i ricordi pertinenti prima di un turno
del modello e acquisire automaticamente i fatti importanti dopo una risposta.

Utilizzalo per un database vettoriale locale, un endpoint di embedding compatibile con OpenAI oppure
un archivio di memoria esterno al backend di memoria integrato predefinito.

## Installazione

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Il plugin è pubblicato su npm; non è incluso nell'immagine di runtime di OpenClaw.
L'installazione scrive la voce del plugin, lo abilita e imposta
`plugins.slots.memory` su `memory-lancedb`. Se un altro plugin occupa attualmente
lo slot di memoria, viene disabilitato con un avviso.

<Note>
I plugin complementari come `memory-wiki` possono essere eseguiti insieme a `memory-lancedb`,
ma un solo plugin alla volta occupa lo slot di memoria attivo.
</Note>

## Avvio rapido

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

Riavvia il Gateway dopo aver modificato la configurazione del plugin, quindi verifica che sia stato caricato:

```bash
openclaw gateway restart
openclaw plugins list
```

## Configurazione degli embedding

`embedding` è obbligatorio e deve includere almeno un campo. Il valore predefinito di `provider`
è `openai`; quello di `model` è `text-embedding-3-small`.

| Campo                  | Tipo          | Note                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | stringa       | ID dell'adattatore, ad es. `openai`, `github-copilot`, `ollama`. Valore predefinito: `openai`. |
| `embedding.model`      | stringa       | Valore predefinito: `text-embedding-3-small`.                                        |
| `embedding.apiKey`     | stringa       | Facoltativo; supporta l'espansione `${ENV_VAR}`.                               |
| `embedding.baseUrl`    | stringa       | Facoltativo; supporta l'espansione `${ENV_VAR}`.                               |
| `embedding.dimensions` | intero (>=1) | Obbligatorio per i modelli non presenti nella tabella integrata (vedi sotto).               |

Esistono due percorsi per le richieste:

- **Percorso tramite adattatore del provider** (predefinito): imposta `embedding.provider` e ometti
  `embedding.apiKey`/`embedding.baseUrl`. Il plugin risolve il profilo di
  autenticazione configurato del provider, la variabile d'ambiente oppure
  `models.providers.<provider>.apiKey` tramite gli stessi adattatori per gli embedding
  della memoria utilizzati da `memory-core`. Questo è il percorso per `github-copilot`, `ollama`
  e qualsiasi altro provider incluso che supporti gli embedding.
- **Percorso tramite client diretto compatibile con OpenAI**: non impostare `embedding.provider`
  (oppure impostalo su `"openai"`) e configura `embedding.apiKey` insieme a `embedding.baseUrl`. Utilizza questo
  percorso per un endpoint di embedding compatibile con OpenAI privo di un adattatore
  del provider incluso.

L'OAuth di OpenAI Codex / ChatGPT non è una credenziale per gli embedding di OpenAI Platform.
Per gli embedding OpenAI utilizza un profilo di autenticazione con chiave API OpenAI, `OPENAI_API_KEY` oppure
`models.providers.openai.apiKey`. Gli utenti che dispongono solo di OAuth devono scegliere un altro
provider che supporti gli embedding, come `github-copilot` o `ollama`.

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

Alcuni endpoint di embedding compatibili con OpenAI rifiutano il parametro `encoding_format`;
altri lo ignorano e restituiscono sempre `number[]`. `memory-lancedb`
omette `encoding_format` nelle richieste e accetta sia risposte come array di numeri in virgola mobile sia
risposte float32 codificate in base64, pertanto entrambi i formati di risposta funzionano senza configurazione.

### Dimensioni

OpenClaw dispone di dimensioni integrate solo per `text-embedding-3-small` (1536) e
`text-embedding-3-large` (3072). Qualsiasi altro modello richiede un valore esplicito per
`embedding.dimensions`, affinché LanceDB possa creare la colonna vettoriale; ad esempio,
ZhiPu `embedding-3` con 2048 dimensioni:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            apiKey: "${ZHIPU_API_KEY}",
            baseUrl: "https://open.bigmodel.cn/api/paas/v4",
            model: "embedding-3",
            dimensions: 2048,
          },
        },
      },
    },
  },
}
```

## Embedding con Ollama

Utilizza il percorso dell'adattatore del provider Ollama incluso (`embedding.provider: "ollama"`).
Chiama l'endpoint nativo `/api/embed` di Ollama e segue le stesse regole per l'autenticazione e l'URL
di base del provider [Ollama](/it/providers/ollama).

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            model: "mxbai-embed-large",
            dimensions: 1024,
          },
          recallMaxChars: 400,
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

`mxbai-embed-large` non è presente nella tabella integrata delle dimensioni, pertanto `dimensions` è
obbligatorio. Per i modelli di embedding locali di piccole dimensioni, riduci `recallMaxChars` se il
server locale restituisce errori relativi alla lunghezza del contesto.

## Limiti di richiamo e acquisizione

| Impostazione       | Valore predefinito | Intervallo                   | Si applica a                                                |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | Testo inviato all'API di embedding per il richiamo.                 |
| `captureMaxChars` | `500`   | 100-10000                    | Lunghezza del messaggio ammessa per l'acquisizione automatica.                  |
| `customTriggers`  | `[]`    | 0-50 elementi, ciascuno <=100 caratteri | Frasi letterali che fanno prendere in considerazione un messaggio per l'acquisizione automatica. |

`recallMaxChars` limita la query di richiamo automatico `before_prompt_build`, lo
strumento `memory_recall`, il percorso di query `memory_forget` e `openclaw ltm
search`. Il richiamo automatico genera l'embedding dell'ultimo messaggio dell'utente nel turno e
ricorre al prompt completo solo quando non è presente alcun messaggio dell'utente, escludendo così
dalla richiesta di embedding i metadati del canale e i blocchi di prompt di grandi dimensioni.

`captureMaxChars` determina se un messaggio dell'utente proveniente dall'evento `agent_end`
del turno è sufficientemente breve da essere preso in considerazione per l'acquisizione automatica; non influisce
sulle query di richiamo.

`customTriggers` aggiunge frasi letterali per l'acquisizione automatica senza espressioni regolari. Gli
attivatori integrati includono comuni frasi relative alla memoria in inglese, ceco, cinese,
giapponese e coreano (`remember`, `prefer`, `记住`, `覚えて`, `기억해` e simili).

L'acquisizione automatica rifiuta inoltre il testo che sembra costituito da metadati di busta/trasporto,
payload di prompt injection o contesto `<relevant-memories>` già inserito
e limita a 3 il numero di ricordi acquisiti per turno dell'agente.

## Comandi

`memory-lancedb` registra lo spazio dei nomi CLI `ltm` ogni volta che è installato
(non solo quando occupa lo slot di memoria attivo):

```bash
openclaw ltm list [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--limit <n>]
openclaw ltm stats
```

`ltm query` esegue una query non vettoriale direttamente sulla tabella LanceDB:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Flag                              | Valore predefinito                       | Note                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | Elenco consentito di colonne separate da virgole.                                                                                                         |
| `--filter <condition>`            | nessuno                                 | Clausola WHERE in stile SQL. Massimo 200 caratteri; sono consentiti solo caratteri alfanumerici, `_-`, spazi e `='"<>!.,()%*`.                              |
| `--limit <n>`                     | `10`                                    | Intero positivo.                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | nessuno                                 | Ordinamento in memoria dopo l'esecuzione del filtro; la colonna di ordinamento viene aggiunta automaticamente alla proiezione e rimossa dall'output se non era stata richiesta. |

Gli agenti ricevono tre strumenti dal plugin di memoria attivo:

- `memory_recall`: ricerca vettoriale nei ricordi archiviati.
- `memory_store`: salva un fatto, una preferenza, una decisione o un'entità (rifiuta il testo
  che sembra un payload di prompt injection; ignora i salvataggi quasi duplicati).
- `memory_forget`: elimina tramite `memoryId` oppure tramite `query` (elimina automaticamente una singola
  corrispondenza con un punteggio superiore al 90%; altrimenti elenca gli ID candidati per eliminare l'ambiguità).

## Archiviazione

I dati di LanceDB vengono salvati per impostazione predefinita in `~/.openclaw/memory/lancedb`. Modifica il percorso con `dbPath`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "~/.openclaw/memory/lancedb",
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

`storageOptions` accetta coppie chiave/valore di tipo stringa per i backend di archiviazione LanceDB
(ad es. archiviazione di oggetti compatibile con S3) e supporta l'espansione `${ENV_VAR}`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "s3://memory-bucket/openclaw",
          storageOptions: {
            access_key: "${AWS_ACCESS_KEY_ID}",
            secret_key: "${AWS_SECRET_ACCESS_KEY}",
            endpoint: "${AWS_ENDPOINT_URL}",
          },
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

## Dipendenze di runtime e supporto delle piattaforme

`memory-lancedb` dipende dal pacchetto nativo `@lancedb/lancedb`, gestito dal
pacchetto del plugin (non dalla distribuzione principale di OpenClaw). L'avvio del Gateway non ripara
le dipendenze del plugin; se la dipendenza nativa manca o non viene caricata,
reinstalla o aggiorna il pacchetto del plugin e riavvia il Gateway.

`@lancedb/lancedb` non pubblica una build nativa per `darwin-x64` (Mac
Intel). Su tale piattaforma, il plugin registra durante il caricamento che LanceDB non è disponibile;
utilizza il backend di memoria predefinito, esegui il Gateway su una
piattaforma/architettura supportata oppure disabilita `memory-lancedb`.

## Risoluzione dei problemi

### La lunghezza dell'input supera quella del contesto

Il modello di embedding ha rifiutato la query di richiamo:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Riduci `recallMaxChars`, quindi riavvia il Gateway:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        config: {
          recallMaxChars: 400,
        },
      },
    },
  },
}
```

Per Ollama, verifica inoltre che il server di embedding sia raggiungibile dall'host del Gateway
tramite il relativo endpoint nativo per gli embedding:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Modello di embedding non supportato

Senza `embedding.dimensions`, sono note solo le dimensioni degli embedding OpenAI integrate
(`text-embedding-3-small`, `text-embedding-3-large`). Per qualsiasi altro
modello, imposta `embedding.dimensions` sulla dimensione del vettore indicata dal modello.

### Il plugin viene caricato, ma non compare alcun ricordo

Verifica che `plugins.slots.memory` punti a `memory-lancedb`, quindi esegui:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Se `autoCapture` è disabilitato, il plugin continua a richiamare i ricordi esistenti, ma
non ne archivia automaticamente di nuovi. Usa lo strumento `memory_store` oppure abilita
`autoCapture`.

## Contenuti correlati

- [Panoramica della memoria](/it/concepts/memory)
- [Active Memory](/it/concepts/active-memory)
- [Ricerca nella memoria](/it/concepts/memory-search)
- [Wiki della memoria](/it/plugins/memory-wiki)
- [Ollama](/it/providers/ollama)
