---
read_when:
    - Vuoi gli embedding per la ricerca nella memoria da un modello GGUF locale
    - Stai configurando memorySearch.provider = "local"
    - Hai bisogno del Plugin OpenClaw che gestisce il runtime node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: Installa il provider ufficiale llama.cpp per gli embedding della memoria locale in formato GGUF
title: Provider llama.cpp
x-i18n:
    generated_at: "2026-07-12T07:18:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 369ec199e8493356912337b849a84f829672e8872d17083c9a597f4e5294ebd5
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` è il plugin provider esterno ufficiale per gli embedding GGUF
locali. Registra l'ID del provider di embedding `local` e gestisce la
dipendenza di runtime `node-llama-cpp` utilizzata da `memorySearch.provider: "local"`.

Installalo prima di utilizzare gli embedding locali per la memoria:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Il pacchetto npm principale `openclaw` non include `node-llama-cpp`. Mantenere la
dipendenza nativa in questo plugin impedisce ai normali aggiornamenti npm di OpenClaw di
eliminare un runtime installato manualmente nella directory del pacchetto OpenClaw.

## Configurazione

Imposta `memorySearch.provider` su `local`:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        local: {
          modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

Il valore predefinito di `local.modelPath` è l'URI `hf:` mostrato sopra (`embeddinggemma-300m-qat-Q8_0.gguf`).
Impostalo su un URI `hf:` diverso o su un file `.gguf` locale per utilizzare un altro
modello. `local.modelCacheDir` sostituisce il percorso in cui i modelli scaricati vengono memorizzati nella cache
(valore predefinito: `~/.node-llama-cpp/models`), mentre `local.contextSize` accetta un
numero intero o `"auto"`.

Quando `local.contextSize` è numerico, il provider comunica tale requisito
anche al posizionamento automatico dei livelli sulla GPU di node-llama-cpp. Ciò consente a node-llama-cpp di adattare
insieme il modello e il contesto degli embedding, mantenendo i propri controlli di sicurezza
della memoria. Con `"auto"`, node-llama-cpp mantiene il normale posizionamento automatico.

## Runtime nativo

Usa Node 24 per un'installazione nativa più agevole. I checkout del codice sorgente che utilizzano
pnpm potrebbero dover approvare e ricompilare la dipendenza nativa:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## Diagnostica del runtime

Esegui `openclaw memory status --deep` dopo il caricamento del provider per esaminare
il backend e la build selezionati, i nomi dei dispositivi, i livelli trasferiti sulla GPU, la dimensione
del contesto richiesta e l'ultima istantanea osservata della VRAM o della memoria unificata. I valori della VRAM
includono un timestamp dell'osservazione, poiché le letture passive dello stato non
ricaricano il modello né interrogano il dispositivo.

Gli stessi dati più recenti possono comparire in `openclaw doctor` quando il Gateway
in esecuzione ha già utilizzato il provider locale. Un normale comando di stato o diagnostica
non carica un modello solo per raccogliere informazioni diagnostiche.

## Risoluzione dei problemi

Se `node-llama-cpp` è assente o non viene caricato, OpenClaw segnala l'errore
indicando di:

1. Installare il plugin: `openclaw plugins install @openclaw/llama-cpp-provider`.
2. Usare Node 24 per le installazioni e gli aggiornamenti nativi.
3. Da un checkout del codice sorgente con pnpm: `pnpm approve-builds`, quindi `pnpm rebuild node-llama-cpp`.

Per utilizzare embedding locali con meno complicazioni e senza la fase di compilazione nativa, imposta
`memorySearch.provider` su un provider di embedding remoto come `lmstudio`,
`ollama`, `openai` o `voyage`.
