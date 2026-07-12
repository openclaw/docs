---
read_when:
    - Vuoi utilizzare Cohere con OpenClaw
    - È necessaria la variabile d'ambiente della chiave API di Cohere oppure l'opzione di autenticazione della CLI
summary: Configurazione di Cohere (autenticazione + selezione del modello)
title: Cohere
x-i18n:
    generated_at: "2026-07-12T07:26:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fee46bf80609bd5e8211d6be507713f4de178653941effb81ebae48d8bb6528a
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) fornisce inferenza compatibile con OpenAI tramite la propria API di compatibilità. OpenClaw include il provider Cohere durante la transizione verso l'esternalizzazione e lo pubblica anche come Plugin esterno ufficiale.

| Proprietà                   | Valore                                                       |
| --------------------------- | ------------------------------------------------------------ |
| ID provider                 | `cohere`                                                     |
| Plugin                      | incluso durante la transizione; pacchetto esterno ufficiale |
| Variabile di ambiente auth  | `COHERE_API_KEY`                                             |
| Flag di configurazione      | `--auth-choice cohere-api-key`                               |
| Flag CLI diretto            | `--cohere-api-key <key>`                                     |
| API                         | compatibile con OpenAI (`openai-completions`)                |
| URL di base                 | `https://api.cohere.ai/compatibility/v1`                     |
| Modello predefinito         | `cohere/command-a-plus-05-2026`                              |
| Finestra di contesto        | 128.000 token                                                |

## Catalogo integrato

| Riferimento modello                  | Input           | Contesto | Output massimo | Note                                                        |
| ------------------------------------ | --------------- | -------- | -------------- | ----------------------------------------------------------- |
| `cohere/command-a-plus-05-2026`      | testo, immagine | 128.000  | 64.000         | Predefinito; modello agentico e di ragionamento di punta    |
| `cohere/command-a-03-2025`           | testo           | 256.000  | 8.000          | Modello Command A precedente                                |
| `cohere/command-a-reasoning-08-2025` | testo           | 256.000  | 32.000         | Ragionamento agentico e utilizzo degli strumenti            |
| `cohere/command-a-vision-07-2025`    | testo, immagine | 128.000  | 8.000          | Analisi visiva e documentale; nessun utilizzo di strumenti  |
| `cohere/north-mini-code-1-0`         | testo, immagine | 256.000  | 64.000         | Programmazione agentica; ragionamento; limiti gratuiti      |

I modelli Cohere con capacità di ragionamento supportano due modalità di ragionamento dell'API di compatibilità. OpenClaw associa **disattivato** a `none` e ogni livello di pensiero abilitato a `high`. Command A Vision non supporta l'utilizzo degli strumenti, pertanto OpenClaw mantiene disabilitati gli strumenti dell'agente per questo modello.

## Per iniziare

1. Cohere è incluso nei pacchetti OpenClaw attuali. Se manca, installa il pacchetto esterno e riavvia il Gateway:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Crea una chiave API Cohere.
3. Esegui la configurazione iniziale:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. Verifica che il catalogo sia disponibile:

```bash
openclaw models list --provider cohere
```

La configurazione iniziale imposta Cohere come modello principale solo se non è già configurato alcun modello principale.

## Configurazione solo tramite ambiente

Rendi `COHERE_API_KEY` disponibile al processo Gateway, quindi seleziona il modello Cohere:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-plus-05-2026" },
    },
  },
}
```

<Note>
Se il Gateway viene eseguito come daemon o in Docker, imposta `COHERE_API_KEY` per tale servizio. Esportarla solo in una shell interattiva non la rende disponibile a un Gateway già in esecuzione.
</Note>

## Contenuti correlati

- [Provider di modelli](/it/concepts/model-providers)
- [CLI dei modelli](/it/cli/models)
- [Directory dei provider](/it/providers/index)
