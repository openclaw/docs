---
read_when:
    - Vuoi usare Qwen con OpenClaw
    - In precedenza hai usato Qwen OAuth
summary: Usa Qwen Cloud tramite il provider qwen bundle di OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-24T08:58:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3601722ed12e7e0441ec01e6a9e6b205a39a7ecfb599e16dad3bbfbdbf34ee83
    source_path: providers/qwen.md
    workflow: 15
---

<Warning>

**Qwen OAuth è stato rimosso.** L'integrazione OAuth del piano gratuito
(`qwen-portal`) che usava gli endpoint `portal.qwen.ai` non è più disponibile.
Vedi [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) per
il contesto.

</Warning>

OpenClaw ora tratta Qwen come provider bundle di prima classe con id canonico
`qwen`. Il provider bundle punta agli endpoint Qwen Cloud / Alibaba DashScope e
Coding Plan e mantiene gli id legacy `modelstudio` come alias di
compatibilità.

- Provider: `qwen`
- Variabile env preferita: `QWEN_API_KEY`
- Accettate anche per compatibilità: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Stile API: compatibile con OpenAI

<Tip>
Se vuoi `qwen3.6-plus`, preferisci l'endpoint **Standard (pay-as-you-go)**.
Il supporto del Coding Plan può essere in ritardo rispetto al catalogo pubblico.
</Tip>

## Per iniziare

Scegli il tipo di piano e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Coding Plan (abbonamento)">
    **Ideale per:** accesso basato su abbonamento tramite il Qwen Coding Plan.

    <Steps>
      <Step title="Ottieni la tua chiave API">
        Crea o copia una chiave API da [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Esegui l'onboarding">
        Per l'endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Per l'endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Imposta un modello predefinito">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Gli id auth-choice legacy `modelstudio-*` e i model ref `modelstudio/...` continuano
    a funzionare come alias di compatibilità, ma i nuovi flussi di configurazione dovrebbero preferire gli
    id auth-choice canonici `qwen-*` e i model ref `qwen/...`.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Ideale per:** accesso pay-as-you-go tramite l'endpoint Standard Model Studio, inclusi modelli come `qwen3.6-plus` che potrebbero non essere disponibili nel Coding Plan.

    <Steps>
      <Step title="Ottieni la tua chiave API">
        Crea o copia una chiave API da [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Esegui l'onboarding">
        Per l'endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Per l'endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Imposta un modello predefinito">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Gli id auth-choice legacy `modelstudio-*` e i model ref `modelstudio/...` continuano
    a funzionare come alias di compatibilità, ma i nuovi flussi di configurazione dovrebbero preferire gli
    id auth-choice canonici `qwen-*` e i model ref `qwen/...`.
    </Note>

  </Tab>
</Tabs>

## Tipi di piano ed endpoint

| Piano                      | Regione | Auth choice                 | Endpoint                                         |
| -------------------------- | ------- | --------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | Cina    | `qwen-standard-api-key-cn`  | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global  | `qwen-standard-api-key`     | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (abbonamento)  | Cina    | `qwen-api-key-cn`           | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (abbonamento)  | Global  | `qwen-api-key`              | `coding-intl.dashscope.aliyuncs.com/v1`          |

Il provider seleziona automaticamente l'endpoint in base al tuo auth choice. Le scelte canoniche
usano la famiglia `qwen-*`; `modelstudio-*` resta solo per compatibilità.
Puoi sovrascrivere con un `baseUrl` personalizzato nella configurazione.

<Tip>
**Gestisci le chiavi:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentazione:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catalogo integrato

OpenClaw attualmente include questo catalogo Qwen bundle. Il catalogo configurato è
consapevole dell'endpoint: le configurazioni Coding Plan omettono i modelli che è noto funzionino
solo sull'endpoint Standard.

| Model ref                   | Input       | Contesto  | Note                                               |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | testo, immagine | 1,000,000 | Modello predefinito                                |
| `qwen/qwen3.6-plus`         | testo, immagine | 1,000,000 | Preferisci gli endpoint Standard quando ti serve questo modello |
| `qwen/qwen3-max-2026-01-23` | testo       | 262,144   | Linea Qwen Max                                     |
| `qwen/qwen3-coder-next`     | testo       | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`     | testo       | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`         | testo       | 1,000,000 | Reasoning abilitato                                |
| `qwen/glm-5`                | testo       | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | testo       | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | testo, immagine | 262,144 | Moonshot AI tramite Alibaba                        |

<Note>
La disponibilità può comunque variare per endpoint e piano di fatturazione anche quando un modello è
presente nel catalogo bundle.
</Note>

## Componenti aggiuntivi multimodali

Il Plugin `qwen` espone anche capacità multimodali sugli endpoint **Standard**
DashScope (non sugli endpoint del Coding Plan):

- **Comprensione video** tramite `qwen-vl-max-latest`
- **Generazione video Wan** tramite `wan2.6-t2v` (predefinito), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Per usare Qwen come provider video predefinito:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
Vedi [Generazione video](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Comprensione di immagini e video">
    Il Plugin Qwen bundle registra la comprensione multimediale per immagini e video
    sugli endpoint DashScope **Standard** (non sugli endpoint del Coding Plan).

    | Proprietà       | Valore                |
    | --------------- | --------------------- |
    | Modello         | `qwen-vl-max-latest`  |
    | Input supportati | Immagini, video      |

    La comprensione multimediale viene risolta automaticamente dall'auth Qwen configurata — non
    è necessaria alcuna configurazione aggiuntiva. Assicurati di usare un endpoint
    Standard (pay-as-you-go) per il supporto della comprensione multimediale.

  </Accordion>

  <Accordion title="Disponibilità di Qwen 3.6 Plus">
    `qwen3.6-plus` è disponibile sugli endpoint Model Studio Standard (pay-as-you-go):

    - Cina: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Se gli endpoint del Coding Plan restituiscono un errore "unsupported model" per
    `qwen3.6-plus`, passa a Standard (pay-as-you-go) invece che alla coppia
    endpoint/chiave del Coding Plan.

  </Accordion>

  <Accordion title="Piano delle capacità">
    Il Plugin `qwen` viene posizionato come la casa vendor per l'intera superficie
    Qwen Cloud, non solo per i modelli coding/testo.

    - **Modelli testo/chat:** già bundle
    - **Tool calling, output strutturato, thinking:** ereditati dal trasporto compatibile OpenAI
    - **Generazione immagini:** pianificata al livello del Plugin provider
    - **Comprensione di immagini/video:** già bundle sull'endpoint Standard
    - **Voce/audio:** pianificati al livello del Plugin provider
    - **Embedding/reranking della memoria:** pianificati tramite la superficie dell'adattatore embedding
    - **Generazione video:** già bundle tramite la capacità condivisa di generazione video

  </Accordion>

  <Accordion title="Dettagli della generazione video">
    Per la generazione video, OpenClaw mappa la regione Qwen configurata all'host
    DashScope AIGC corrispondente prima di inviare il job:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - Cina: `https://dashscope.aliyuncs.com`

    Ciò significa che un normale `models.providers.qwen.baseUrl` che punta a uno dei
    host Qwen Coding Plan o Standard mantiene comunque la generazione video sul corretto
    endpoint video DashScope regionale.

    Limiti attuali del bundle Qwen per la generazione video:

    - Fino a **1** video di output per richiesta
    - Fino a **1** immagine di input
    - Fino a **4** video di input
    - Fino a **10 secondi** di durata
    - Supporta `size`, `aspectRatio`, `resolution`, `audio` e `watermark`
    - La modalità immagine/video di riferimento al momento richiede **URL http(s) remoti**. I percorsi
      di file locali vengono rifiutati subito perché l'endpoint video DashScope non
      accetta buffer locali caricati per quei riferimenti.

  </Accordion>

  <Accordion title="Compatibilità dell'uso in streaming">
    Gli endpoint nativi Model Studio pubblicizzano la compatibilità dell'uso in streaming sul
    trasporto condiviso `openai-completions`. OpenClaw ora la collega alle capacità dell'endpoint,
    così gli id provider personalizzati compatibili con DashScope che puntano agli stessi
    host nativi ereditano lo stesso comportamento di uso in streaming invece di
    richiedere specificamente l'id provider integrato `qwen`.

    La compatibilità dell'uso nativo in streaming si applica sia agli host del Coding Plan sia
    agli host compatibili DashScope Standard:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Regioni degli endpoint multimodali">
    Le superfici multimodali (comprensione video e generazione video Wan) usano gli
    endpoint DashScope **Standard**, non quelli del Coding Plan:

    - Base URL Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - Base URL Standard Cina: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Configurazione dell'ambiente e del daemon">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `QWEN_API_KEY` sia
    disponibile a quel processo (ad esempio in `~/.openclaw/.env` o tramite
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, model ref e comportamento di failover.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/it/providers/alibaba" icon="cloud">
    Provider legacy ModelStudio e note sulla migrazione.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    FAQ e risoluzione generale dei problemi.
  </Card>
</CardGroup>
