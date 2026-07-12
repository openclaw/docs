---
read_when:
    - Vuoi utilizzare la generazione video di Alibaba Wan in OpenClaw
    - Per la generazione di video è necessario configurare una chiave API di Model Studio o DashScope
summary: Generazione di video con Alibaba Model Studio Wan in OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-07-12T07:23:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

Il plugin `alibaba` incluso registra un provider di generazione video per i modelli Wan su Alibaba Model Studio (il nome internazionale di DashScope). È abilitato per impostazione predefinita; è necessaria solo una chiave API.

| Proprietà              | Valore                                                                          |
| ---------------------- | ------------------------------------------------------------------------------- |
| ID del provider        | `alibaba`                                                                       |
| Plugin                 | incluso, `enabledByDefault: true`                                                |
| Variabili di ambiente per l'autenticazione | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (viene usata la prima corrispondenza) |
| Flag di configurazione iniziale | `--auth-choice alibaba-model-studio-api-key`                           |
| Flag CLI diretto       | `--alibaba-model-studio-api-key <key>`                                          |
| Modello predefinito    | `alibaba/wan2.6-t2v`                                                            |
| URL di base predefinito | `https://dashscope-intl.aliyuncs.com`                                          |

## Per iniziare

<Steps>
  <Step title="Impostare una chiave API">
    Memorizza la chiave per il provider `alibaba` tramite la configurazione iniziale:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    In alternativa, passa direttamente la chiave:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Oppure esporta una delle variabili di ambiente accettate prima di avviare il Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # oppure DASHSCOPE_API_KEY=...
    # oppure QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Impostare un modello video predefinito">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Verificare che il provider sia configurato">
    ```bash
    openclaw models list --provider alibaba
    ```

    L'elenco include tutti e cinque i modelli Wan inclusi. Se non è possibile risolvere `MODELSTUDIO_API_KEY`, `openclaw models status --json` segnala la credenziale mancante in `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  Il plugin Alibaba e il [plugin Qwen](/it/providers/qwen) eseguono entrambi l'autenticazione tramite DashScope e accettano variabili di ambiente sovrapposte. Usa gli ID modello `alibaba/...` per l'interfaccia video Wan dedicata; usa gli ID `qwen/...` per la chat, gli embedding o la comprensione multimediale di Qwen.
</Note>

## Modelli Wan integrati

| Riferimento del modello    | Modalità                              |
| -------------------------- | ------------------------------------- |
| `alibaba/wan2.6-t2v`       | Da testo a video (predefinita)        |
| `alibaba/wan2.6-i2v`       | Da immagine a video                   |
| `alibaba/wan2.6-r2v`       | Da riferimento a video                |
| `alibaba/wan2.6-r2v-flash` | Da riferimento a video (rapida)       |
| `alibaba/wan2.7-r2v`       | Da riferimento a video                |

## Funzionalità e limiti

Tutte e tre le modalità condividono lo stesso limite per richiesta relativo al numero e alla durata dei video; cambia solo la struttura dell'input.

| Modalità                | Numero massimo di video di output | Numero massimo di immagini di input | Numero massimo di video di input | Durata massima | Controlli supportati                                       |
| ----------------------- | --------------------------------- | ----------------------------------- | ------------------------------- | -------------- | ---------------------------------------------------------- |
| Da testo a video        | 1                                 | non applicabile                     | non applicabile                 | 10 s           | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Da immagine a video     | 1                                 | 1                                   | non applicabile                 | 10 s           | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Da riferimento a video | 1                                 | non applicabile                     | 4                               | 10 s           | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Una richiesta che omette `durationSeconds` usa il valore predefinito accettato da DashScope di **5 secondi**. Imposta esplicitamente `durationSeconds` nello [strumento di generazione video](/it/tools/video-generation) per estendere la durata fino a 10 s.

<Warning>
  Gli input di immagini e video di riferimento devono essere URL `http(s)` remoti; le modalità di riferimento di DashScope rifiutano i percorsi di file locali. Caricali prima in un sistema di archiviazione di oggetti oppure usa il flusso dello [strumento multimediale](/it/tools/media-overview), che produce già un URL pubblico.
</Warning>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Sostituire l'URL di base di DashScope">
    Per impostazione predefinita, il provider usa l'endpoint internazionale di DashScope. Per usare l'endpoint della regione cinese:

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    Il provider rimuove le barre finali prima di costruire gli URL delle attività AIGC.

  </Accordion>

  <Accordion title="Priorità delle variabili di ambiente per l'autenticazione">
    OpenClaw risolve la chiave API di Alibaba dalle variabili di ambiente nell'ordine seguente, usando il primo valore non vuoto:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Le voci `auth.profiles` configurate (impostate tramite `openclaw models auth login`) hanno la precedenza sulla risoluzione delle variabili di ambiente. Consulta [Profili di autenticazione nelle domande frequenti sui modelli](/it/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them) per informazioni sulla rotazione dei profili, sui periodi di attesa e sui meccanismi di sostituzione.

  </Accordion>

  <Accordion title="Relazione con il plugin Qwen">
    Entrambi i plugin inclusi comunicano con DashScope e accettano chiavi API sovrapposte. Usa:

    - Gli ID `alibaba/wan*.*` per il provider video Wan dedicato documentato in questa pagina.
    - Gli ID `qwen/*` per la chat, gli embedding e la comprensione multimediale di Qwen (consulta [Qwen](/it/providers/qwen)).

    Impostando `MODELSTUDIO_API_KEY` una sola volta si autenticano entrambi i plugin, poiché gli elenchi delle variabili di ambiente per l'autenticazione si sovrappongono intenzionalmente; non è necessario eseguire separatamente la configurazione iniziale di ciascun plugin.

  </Accordion>
</AccordionGroup>

## Argomenti correlati

<CardGroup cols={2}>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Qwen" href="/it/providers/qwen" icon="microchip">
    Configurazione della chat, degli embedding e della comprensione multimediale di Qwen con la stessa autenticazione DashScope.
  </Card>
  <Card title="Riferimento per la configurazione" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Valori predefiniti degli agenti e configurazione dei modelli.
  </Card>
  <Card title="Domande frequenti sui modelli" href="/it/help/faq-models" icon="circle-question">
    Profili di autenticazione, cambio di modello e risoluzione degli errori "nessun profilo".
  </Card>
</CardGroup>
