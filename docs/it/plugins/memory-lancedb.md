---
read_when:
    - Si sta configurando il plugin memory-lancedb
    - Si desidera una memoria a lungo termine basata su LanceDB con richiamo o acquisizione automatici
    - Si stanno utilizzando embedding locali compatibili con OpenAI, come Ollama
sidebarTitle: Memory LanceDB
summary: Configura il Plugin di memoria esterno ufficiale LanceDB, inclusi gli embedding locali compatibili con Ollama
title: Memoria LanceDB
x-i18n:
    generated_at: "2026-07-16T14:44:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 786b511da4fbfd90f4c3e5be5a1aeddf5daa59036247552bd671f4bab89319f6
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` è un plugin esterno ufficiale che archivia la memoria a lungo termine in
LanceDB con ricerca vettoriale. Può richiamare automaticamente i ricordi pertinenti prima di un turno
del modello e acquisire automaticamente i fatti importanti dopo una risposta.

Utilizzarlo per un database vettoriale locale, un endpoint di embedding compatibile con OpenAI oppure
un archivio di memoria esterno al backend di memoria integrato predefinito.

## Installazione

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Il plugin è pubblicato su npm; non è incluso nell'immagine di runtime di OpenClaw.
L'installazione scrive la voce del plugin, lo abilita e imposta
`plugins.slots.memory` su `memory-lancedb`. Se un altro plugin occupa attualmente
lo slot di memoria, tale plugin viene disabilitato con un avviso.

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

Riavviare il Gateway dopo aver modificato la configurazione del plugin, quindi verificare che sia stato caricato:

```bash
openclaw gateway restart
openclaw plugins list
```

## Configurazione degli embedding

`embedding` è obbligatorio e deve includere almeno un campo. Il valore predefinito di `provider`
è `openai`; il valore predefinito di `model` è `text-embedding-3-small`.

| Campo                  | Tipo          | Note                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | stringa        | ID dell'adattatore, ad es. `openai`, `github-copilot`, `ollama`. Valore predefinito: `openai`. |
| `embedding.model`      | stringa        | Valore predefinito: `text-embedding-3-small`.                                        |
| `embedding.apiKey`     | stringa        | Facoltativo; supporta l'espansione di `${ENV_VAR}`.                               |
| `embedding.baseUrl`    | stringa        | Facoltativo; supporta l'espansione di `${ENV_VAR}`.                               |
| `embedding.dimensions` | intero (>=1) | Obbligatorio per i modelli non presenti nella tabella integrata (vedere sotto).               |

Sono disponibili due percorsi per le richieste:

- **Percorso dell'adattatore del provider** (predefinito): impostare `embedding.provider` e omettere
  `embedding.apiKey`/`embedding.baseUrl`. Il plugin risolve il profilo di autenticazione
  configurato del provider, la variabile di ambiente oppure
  `models.providers.<provider>.apiKey` tramite gli stessi adattatori di embedding della memoria
  utilizzati da `memory-core`. Questo è il percorso per `github-copilot`, `ollama`
  e qualsiasi altro provider incluso che supporti gli embedding.
- **Percorso diretto del client compatibile con OpenAI**: lasciare `embedding.provider` non impostato
  (oppure `"openai"`) e impostare `embedding.apiKey` più `embedding.baseUrl`. Utilizzare questo
  percorso per un endpoint di embedding compatibile con OpenAI senza un adattatore
  del provider incluso.

OAuth di OpenAI Codex / ChatGPT non è una credenziale per gli embedding di OpenAI Platform.
Per gli embedding OpenAI, utilizzare un profilo di autenticazione con chiave API OpenAI, `OPENAI_API_KEY` oppure
`models.providers.openai.apiKey`. Chi utilizza esclusivamente OAuth dovrebbe scegliere un altro
provider compatibile con gli embedding, come `github-copilot` o `ollama`.

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
omette `encoding_format` nelle richieste e accetta risposte costituite da array di valori in virgola mobile oppure
valori float32 codificati in base64, pertanto entrambi i formati di risposta funzionano senza configurazione.

### Dimensioni

OpenClaw dispone di una dimensione integrata soltanto per `text-embedding-3-small` (1536) e
`text-embedding-3-large` (3072). Qualsiasi altro modello richiede un valore
`embedding.dimensions` esplicito affinché LanceDB possa creare la colonna vettoriale, ad esempio
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

## Embedding Ollama

Utilizzare il percorso dell'adattatore del provider Ollama incluso (`embedding.provider: "ollama"`).
Richiama l'endpoint nativo `/api/embed` di Ollama e segue le stesse regole di autenticazione e URL
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

`mxbai-embed-large` non è presente nella tabella delle dimensioni integrata, pertanto `dimensions` è
obbligatorio. Per i modelli di embedding locali di piccole dimensioni, ridurre `recallMaxChars` se il
server locale restituisce errori relativi alla lunghezza del contesto.

## Limiti di richiamo e acquisizione

| Impostazione           | Valore predefinito | Intervallo                        | Si applica a                                                 |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | Testo inviato all'API di embedding per il richiamo.                 |
| `captureMaxChars` | `500`   | 100-10000                    | Lunghezza dei messaggi idonei all'acquisizione automatica.                  |
| `customTriggers`  | `[]`    | 0-50 elementi, ciascuno <=100 caratteri | Frasi letterali che fanno considerare un messaggio per l'acquisizione automatica. |

`recallMaxChars` limita la query di richiamo automatico `before_prompt_build`, lo
strumento `memory_recall`, il percorso di query `memory_forget` e `openclaw ltm
search`. Il richiamo automatico incorpora il messaggio utente più recente del turno e utilizza
l'intero prompt come soluzione di ripiego solo quando non è presente alcun messaggio utente, evitando di includere i metadati
del canale e i blocchi di prompt di grandi dimensioni nella richiesta di embedding.

`captureMaxChars` determina se un messaggio utente dell'evento `agent_end`
del turno è sufficientemente breve da essere considerato per l'acquisizione automatica; non influisce sulle
query di richiamo.

`customTriggers` aggiunge frasi letterali per l'acquisizione automatica senza espressioni regolari. Gli attivatori
integrati coprono comuni frasi relative alla memoria in inglese, ceco, cinese, giapponese e coreano
(`remember`, `prefer`, `记住`, `覚えて`, `기억해` e simili).

L'acquisizione automatica rifiuta inoltre il testo che sembra contenere metadati di busta/trasporto,
payload di prompt injection o contesto `<relevant-memories>` già inserito,
e limita l'acquisizione a 3 ricordi per turno dell'agente.

Ogni ricordo appartiene a un solo agente. Il richiamo, il rilevamento dei duplicati, l'acquisizione,
l'elenco, le query non elaborate e l'eliminazione verificano tutti il proprietario prima di restituire o
modificare le righe. Un agente con `memorySearch.enabled: false` (in `agents.list[]`
o tramite `agents.defaults`) non riceve inoltre alcuno degli strumenti `memory_recall`, `memory_store`
o `memory_forget` e non partecipa al richiamo o all'acquisizione automatici,
anche quando i flag `autoRecall`/`autoCapture` a livello di plugin sono attivi.

## Comandi

`memory-lancedb` registra lo spazio dei nomi CLI `ltm` ogni volta che è installato
(non soltanto quando occupa lo slot di memoria attivo):

```bash
openclaw ltm list [--agent <id>] [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--agent <id>] [--limit <n>]
openclaw ltm stats [--agent <id>]
```

`ltm query` esegue una query non vettoriale direttamente sulla tabella LanceDB:

```bash
openclaw ltm query --agent research --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Flag                              | Valore predefinito                                 | Note                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--agent <id>`                    | agente predefinito configurato                | Seleziona lo spazio dei nomi privato dell'agente. Disponibile per `list`, `search`, `query` e `stats`.                                                 |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | Elenco consentito di colonne separate da virgole.                                                                                                         |
| `--filter <condition>`            | nessuno                                    | Un confronto su una colonna di output, come `category = 'preference'` o `importance >= 0.8`. I valori stringa devono essere racchiusi tra virgolette.             |
| `--limit <n>`                     | `10`                                    | Intero positivo.                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | nessuno                                    | Ordinamento in memoria dopo l'applicazione del filtro; la colonna di ordinamento viene aggiunta automaticamente alla proiezione e rimossa dall'output se non era stata richiesta. |

Gli agenti ricevono tre strumenti dal plugin di memoria attivo:

- `memory_recall`: ricerca vettoriale nei ricordi archiviati.
- `memory_store`: salva un fatto, una preferenza, una decisione o un'entità (rifiuta il testo
  che sembra un payload di prompt injection; evita di archiviare elementi quasi duplicati).
- `memory_forget`: elimina tramite `memoryId` oppure tramite `query` (elimina automaticamente una singola
  corrispondenza con un punteggio superiore al 90%, altrimenti elenca gli ID candidati per eliminare l'ambiguità).

## Archiviazione

Per impostazione predefinita, i dati LanceDB sono archiviati in `~/.openclaw/memory/lancedb`. Modificare il percorso con `dbPath`:

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

Il plugin mantiene una tabella LanceDB e archivia in ogni riga il proprietario normalizzato
dell'agente. Si tratta di un limite di archiviazione, non di un filtro successivo alla ricerca: la proprietà dell'agente viene
applicata prima della classificazione vettoriale ed è inclusa nei predicati di elenco, query, conteggio
ed eliminazione. `ltm query --filter` accetta un confronto convalidato sulle
colonne di output pubbliche. L'archivio crea tale confronto separatamente dal
predicato obbligatorio relativo al proprietario, impedendo a un filtro di estendere la query a un altro
agente.

I database creati prima dell'introduzione della proprietà per agente non dispongono di una provenienza affidabile delle righe.
Durante l'aggiornamento, `openclaw doctor --fix` assegna una sola volta tali righe legacy
all'agente predefinito configurato. L'accesso in fase di runtime viene negato fino al completamento
della migrazione; gli altri agenti non ereditano mai le vecchie righe condivise.

`storageOptions` accetta coppie chiave/valore stringa per i backend di archiviazione LanceDB
(ad es. archiviazione di oggetti compatibile con S3) e supporta l'espansione di `${ENV_VAR}`:

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

`memory-lancedb` dipende dal pacchetto nativo `@lancedb/lancedb`, di proprietà del
pacchetto del plugin (non della distribuzione core di OpenClaw). L'avvio del Gateway non ripara
le dipendenze del plugin; se la dipendenza nativa è mancante o non viene caricata,
reinstallare o aggiornare il pacchetto del plugin e riavviare il Gateway.

`@lancedb/lancedb` non pubblica una build nativa per `darwin-x64` (Mac
Intel). Su tale piattaforma, durante il caricamento il plugin registra che LanceDB non è disponibile;
utilizzare il backend di memoria predefinito, eseguire il Gateway su una
piattaforma o architettura supportata oppure disabilitare `memory-lancedb`.

## Risoluzione dei problemi

### La lunghezza dell'input supera la lunghezza del contesto

Il modello di embedding ha rifiutato la query di recupero:

```text
memory-lancedb: recupero non riuscito: Errore: 400 la lunghezza dell'input supera la lunghezza del contesto
```

Ridurre `recallMaxChars`, quindi riavviare il Gateway:

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

Per Ollama, verificare inoltre che il server di embedding sia raggiungibile dall'host
del Gateway tramite il relativo endpoint di embedding nativo:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Modello di embedding non supportato

Senza `embedding.dimensions`, sono note solo le dimensioni di embedding
integrate di OpenAI (`text-embedding-3-small`, `text-embedding-3-large`). Per qualsiasi altro
modello, impostare `embedding.dimensions` sulla dimensione del vettore indicata dal modello.

### Il plugin viene caricato, ma non appare alcun ricordo

Verificare che `plugins.slots.memory` punti a `memory-lancedb`, quindi eseguire:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Se `autoCapture` è disabilitato, il plugin continua a recuperare i ricordi esistenti, ma
non ne archivia automaticamente di nuovi. Utilizzare lo strumento `memory_store` oppure abilitare
`autoCapture`.

## Correlati

- [Panoramica della memoria](/it/concepts/memory)
- [Active Memory](/it/concepts/active-memory)
- [Ricerca nella memoria](/it/concepts/memory-search)
- [Wiki della memoria](/it/plugins/memory-wiki)
- [Ollama](/it/providers/ollama)
