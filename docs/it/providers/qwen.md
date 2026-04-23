---
read_when:
    - Vuoi usare Qwen con OpenClaw
    - In precedenza hai usato Qwen OAuth
summary: Usa Qwen Cloud tramite il provider qwen bundled di OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-23T08:35:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70726b64202d8167f7879320281bde86d69ffa4c40117a53352922eb65d66400
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Qwen OAuth è stato rimosso.** L’integrazione OAuth del tier gratuito
(`qwen-portal`) che usava gli endpoint `portal.qwen.ai` non è più disponibile.
Vedi [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) per il
contesto.

</Warning>

OpenClaw ora tratta Qwen come un provider bundled di prima classe con ID canonico
`qwen`. Il provider bundled usa gli endpoint Qwen Cloud / Alibaba DashScope e
Coding Plan e mantiene gli ID legacy `modelstudio` come
alias di compatibilità.

- Provider: `qwen`
- Variabile d’ambiente preferita: `QWEN_API_KEY`
- Accettate anche per compatibilità: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Stile API: compatibile OpenAI

<Tip>
Se vuoi `qwen3.6-plus`, preferisci l’endpoint **Standard (pay-as-you-go)**.
Il supporto del Coding Plan può essere in ritardo rispetto al catalogo pubblico.
</Tip>

## Per iniziare

Scegli il tipo di piano e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Coding Plan (abbonamento)">
    **Ideale per:** accesso in abbonamento tramite il Qwen Coding Plan.

    <Steps>
      <Step title="Ottieni la tua chiave API">
        Crea o copia una chiave API da [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Esegui l’onboarding">
        Per l’endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Per l’endpoint **China**:

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
    Gli ID `auth-choice` legacy `modelstudio-*` e i ref modello `modelstudio/...` continuano
    a funzionare come alias di compatibilità, ma i nuovi flussi di setup dovrebbero preferire gli ID `auth-choice` canonici `qwen-*` e i ref modello `qwen/...`.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Ideale per:** accesso pay-as-you-go tramite l’endpoint Standard Model Studio, inclusi modelli come `qwen3.6-plus` che potrebbero non essere disponibili nel Coding Plan.

    <Steps>
      <Step title="Ottieni la tua chiave API">
        Crea o copia una chiave API da [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Esegui l’onboarding">
        Per l’endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Per l’endpoint **China**:

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
    Gli ID `auth-choice` legacy `modelstudio-*` e i ref modello `modelstudio/...` continuano
    a funzionare come alias di compatibilità, ma i nuovi flussi di setup dovrebbero preferire gli ID `auth-choice` canonici `qwen-*` e i ref modello `qwen/...`.
    </Note>

  </Tab>
</Tabs>

## Tipi di piano ed endpoint

| Piano                      | Regione | Auth choice                | Endpoint                                         |
| -------------------------- | ------- | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China   | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global  | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (abbonamento)  | China   | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (abbonamento)  | Global  | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Il provider seleziona automaticamente l’endpoint in base al tuo auth choice. Le scelte canoniche
usano la famiglia `qwen-*`; `modelstudio-*` resta solo per compatibilità.
Puoi fare override con un `baseUrl` personalizzato nella configurazione.

<Tip>
**Gestisci le chiavi:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentazione:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catalogo integrato

OpenClaw distribuisce attualmente questo catalogo Qwen bundled. Il catalogo configurato è
consapevole dell’endpoint: le configurazioni Coding Plan omettono i modelli che si sa funzionino solo
sull’endpoint Standard.

| Ref modello                | Input       | Contesto  | Note                                                |
| -------------------------- | ----------- | --------- | --------------------------------------------------- |
| `qwen/qwen3.5-plus`        | testo, immagine | 1,000,000 | Modello predefinito                            |
| `qwen/qwen3.6-plus`        | testo, immagine | 1,000,000 | Preferisci gli endpoint Standard quando ti serve questo modello |
| `qwen/qwen3-max-2026-01-23` | testo      | 262,144   | Linea Qwen Max                                      |
| `qwen/qwen3-coder-next`    | testo       | 262,144   | Coding                                              |
| `qwen/qwen3-coder-plus`    | testo       | 1,000,000 | Coding                                              |
| `qwen/MiniMax-M2.5`        | testo       | 1,000,000 | Thinking abilitato                                  |
| `qwen/glm-5`               | testo       | 202,752   | GLM                                                 |
| `qwen/glm-4.7`             | testo       | 202,752   | GLM                                                 |
| `qwen/kimi-k2.5`           | testo, immagine | 262,144 | Moonshot AI tramite Alibaba                         |

<Note>
La disponibilità può comunque variare per endpoint e piano di fatturazione anche quando un modello è
presente nel catalogo bundled.
</Note>

## Estensioni multimodali

Il plugin `qwen` espone anche capability multimodali sugli endpoint DashScope **Standard**
(non sugli endpoint Coding Plan):

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
Vedi [Video Generation](/it/tools/video-generation) per parametri condivisi dello strumento, selezione del provider e comportamento di failover.
</Note>

## Avanzato

<AccordionGroup>
  <Accordion title="Comprensione di immagini e video">
    Il plugin Qwen bundled registra Media Understanding per immagini e video
    sugli endpoint DashScope **Standard** (non sugli endpoint Coding Plan).

    | Proprietà       | Valore                |
    | --------------- | --------------------- |
    | Modello         | `qwen-vl-max-latest`  |
    | Input supportati | Immagini, video      |

    Media Understanding viene risolto automaticamente dall’autenticazione Qwen configurata — non
    è necessaria alcuna configurazione aggiuntiva. Assicurati di usare un endpoint
    Standard (pay-as-you-go) per il supporto Media Understanding.

  </Accordion>

  <Accordion title="Disponibilità di Qwen 3.6 Plus">
    `qwen3.6-plus` è disponibile sugli endpoint Standard (pay-as-you-go) Model Studio:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Se gli endpoint Coding Plan restituiscono un errore "unsupported model" per
    `qwen3.6-plus`, passa a Standard (pay-as-you-go) invece che alla coppia
    endpoint/chiave del Coding Plan.

  </Accordion>

  <Accordion title="Piano delle capability">
    Il plugin `qwen` viene posizionato come vendor home per l’intera superficie Qwen
    Cloud, non solo per i modelli coding/testo.

    - **Modelli testo/chat:** bundled ora
    - **Tool calling, output strutturato, thinking:** ereditati dal trasporto compatibile OpenAI
    - **Generazione immagini:** pianificata a livello di plugin provider
    - **Comprensione immagini/video:** bundled ora sull’endpoint Standard
    - **Speech/audio:** pianificati a livello di plugin provider
    - **Embedding/reranking memoria:** pianificati tramite la superficie adapter di embedding
    - **Generazione video:** bundled ora tramite la capability condivisa di generazione video

  </Accordion>

  <Accordion title="Dettagli della generazione video">
    Per la generazione video, OpenClaw mappa la regione Qwen configurata sull’host
    DashScope AIGC corrispondente prima di inviare il job:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Questo significa che un normale `models.providers.qwen.baseUrl` che punta a uno degli host
    Qwen Coding Plan o Standard continua comunque a mantenere la generazione video sul corretto
    endpoint video DashScope regionale.

    Limiti attuali della generazione video Qwen bundled:

    - Fino a **1** video di output per richiesta
    - Fino a **1** immagine di input
    - Fino a **4** video di input
    - Fino a **10 secondi** di durata
    - Supporta `size`, `aspectRatio`, `resolution`, `audio` e `watermark`
    - La modalità immagine/video di riferimento richiede attualmente **URL http(s) remoti**. I
      percorsi di file locali vengono rifiutati subito perché l’endpoint video DashScope non
      accetta buffer locali caricati per quei riferimenti.

  </Accordion>

  <Accordion title="Compatibilità dell’utilizzo in streaming">
    Gli endpoint nativi Model Studio pubblicizzano compatibilità dell’utilizzo in streaming sul
    trasporto condiviso `openai-completions`. OpenClaw ora basa questo comportamento sulle capability dell’endpoint, quindi gli ID provider personalizzati compatibili DashScope che puntano agli
    stessi host nativi ereditano lo stesso comportamento di utilizzo in streaming invece di
    richiedere specificamente l’ID provider integrato `qwen`.

    La compatibilità dell’utilizzo native-streaming si applica sia agli host Coding Plan sia
    agli host compatibili DashScope Standard:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Regioni degli endpoint multimodali">
    Le superfici multimodali (comprensione video e generazione video Wan) usano gli
    endpoint DashScope **Standard**, non gli endpoint Coding Plan:

    - URL base Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL base Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Configurazione dell’ambiente e del daemon">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `QWEN_API_KEY` sia
    disponibile per quel processo (ad esempio in `~/.openclaw/.env` oppure tramite
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scegliere provider, ref dei modelli e comportamento di failover.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/it/providers/alibaba" icon="cloud">
    Provider ModelStudio legacy e note di migrazione.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione dei problemi generale e FAQ.
  </Card>
</CardGroup>
