---
read_when:
    - Vuoi usare Qwen con OpenClaw
    - Hai usato in precedenza Qwen OAuth
summary: Usare Qwen Cloud tramite il provider qwen incluso in OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-30T09:09:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898a7ef1f071c838f3bd877632dd06cf0e6112adfa2833895280f99642df56e6
    source_path: providers/qwen.md
    workflow: 16
---

<Warning>

**Qwen OAuth è stato rimosso.** L'integrazione OAuth di livello gratuito
(`qwen-portal`) che usava gli endpoint `portal.qwen.ai` non è più disponibile.
Vedi [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) per
il contesto.

</Warning>

OpenClaw ora tratta Qwen come provider in bundle di prima classe con id canonico
`qwen`. Il provider in bundle usa come destinazione gli endpoint Qwen Cloud / Alibaba DashScope e
Coding Plan e mantiene funzionanti gli id `modelstudio` legacy come
alias di compatibilità.

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
  <Tab title="Coding Plan (subscription)">
    **Ideale per:** accesso basato su abbonamento tramite il Qwen Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Crea o copia una chiave API da [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Per l'endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Per l'endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Gli id `modelstudio-*` auth-choice legacy e i riferimenti modello `modelstudio/...`
    funzionano ancora come alias di compatibilità, ma i nuovi flussi di configurazione dovrebbero preferire gli id
    auth-choice canonici `qwen-*` e i riferimenti modello `qwen/...`. Se definisci una voce
    personalizzata esatta `models.providers.modelstudio` con un altro valore `api`, quel
    provider personalizzato possiede i riferimenti `modelstudio/...` invece dell'alias di compatibilità
    Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Ideale per:** accesso pay-as-you-go tramite l'endpoint Standard Model Studio, inclusi modelli come `qwen3.6-plus` che potrebbero non essere disponibili sul Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Crea o copia una chiave API da [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Per l'endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Per l'endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Gli id `modelstudio-*` auth-choice legacy e i riferimenti modello `modelstudio/...`
    funzionano ancora come alias di compatibilità, ma i nuovi flussi di configurazione dovrebbero preferire gli id
    auth-choice canonici `qwen-*` e i riferimenti modello `qwen/...`. Se definisci una voce
    personalizzata esatta `models.providers.modelstudio` con un altro valore `api`, quel
    provider personalizzato possiede i riferimenti `modelstudio/...` invece dell'alias di compatibilità
    Qwen.
    </Note>

  </Tab>
</Tabs>

## Tipi di piano ed endpoint

| Piano                      | Regione | Scelta auth                | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Il provider seleziona automaticamente l'endpoint in base alla tua scelta auth. Le scelte canoniche
usano la famiglia `qwen-*`; `modelstudio-*` rimane solo per compatibilità.
Puoi sovrascrivere con un `baseUrl` personalizzato nella configurazione.

<Tip>
**Gestisci chiavi:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentazione:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catalogo integrato

OpenClaw attualmente include questo catalogo Qwen in bundle. Il catalogo configurato è
consapevole dell'endpoint: le configurazioni Coding Plan omettono i modelli che sono noti per funzionare
solo sull'endpoint Standard.

| Rif. modello                | Input       | Contesto  | Note                                                            |
| --------------------------- | ----------- | --------- | --------------------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000 | Modello predefinito                                             |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000 | Preferisci gli endpoint Standard quando ti serve questo modello |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144   | Linea Qwen Max                                                  |
| `qwen/qwen3-coder-next`     | text        | 262,144   | Coding                                                          |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000 | Coding                                                          |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000 | Ragionamento abilitato                                          |
| `qwen/glm-5`                | text        | 202,752   | GLM                                                             |
| `qwen/glm-4.7`              | text        | 202,752   | GLM                                                             |
| `qwen/kimi-k2.5`            | text, image | 262,144   | Moonshot AI tramite Alibaba                                     |

<Note>
La disponibilità può comunque variare in base all'endpoint e al piano di fatturazione anche quando un modello è
presente nel catalogo in bundle.
</Note>

## Controlli di thinking

Per i modelli Qwen Cloud con ragionamento abilitato, il provider in bundle mappa i livelli di
thinking di OpenClaw al flag di richiesta di primo livello `enable_thinking` di DashScope. Il
thinking disabilitato invia `enable_thinking: false`; gli altri livelli di thinking inviano
`enable_thinking: true`.

## Componenti aggiuntivi multimodali

Il Plugin `qwen` espone anche capacità multimodali sugli endpoint DashScope **Standard**
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
Vedi [Generazione video](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Image and video understanding">
    Il Plugin Qwen in bundle registra la comprensione dei media per immagini e video
    sugli endpoint DashScope **Standard** (non sugli endpoint Coding Plan).

    | Proprietà       | Valore                |
    | ------------- | --------------------- |
    | Modello       | `qwen-vl-max-latest`  |
    | Input supportato | Immagini, video    |

    La comprensione dei media viene risolta automaticamente dall'auth Qwen configurata: non è
    necessaria alcuna configurazione aggiuntiva. Assicurati di usare un endpoint Standard (pay-as-you-go)
    per il supporto della comprensione dei media.

  </Accordion>

  <Accordion title="Qwen 3.6 Plus availability">
    `qwen3.6-plus` è disponibile sugli endpoint Standard (pay-as-you-go) Model Studio:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Se gli endpoint Coding Plan restituiscono un errore "unsupported model" per
    `qwen3.6-plus`, passa a Standard (pay-as-you-go) invece della coppia endpoint/chiave
    Coding Plan.

    Il catalogo Qwen in bundle di OpenClaw non pubblicizza `qwen3.6-plus` sugli endpoint Coding
    Plan, ma le voci `qwen/qwen3.6-plus` configurate esplicitamente sotto
    `models.providers.qwen.models` vengono rispettate sui baseUrl Coding Plan, quindi puoi
    abilitare quel modello se Aliyun lo abilita sul tuo abbonamento. L'API
    upstream decide comunque se la chiamata riesce.

  </Accordion>

  <Accordion title="Capability plan">
    Il Plugin `qwen` viene posizionato come sede del vendor per l'intera superficie Qwen
    Cloud, non solo per i modelli di coding/testo.

    - **Modelli testo/chat:** in bundle ora
    - **Chiamata di strumenti, output strutturato, thinking:** ereditati dal trasporto compatibile con OpenAI
    - **Generazione immagini:** pianificata a livello di provider-Plugin
    - **Comprensione immagini/video:** in bundle ora sull'endpoint Standard
    - **Voce/audio:** pianificati a livello di provider-Plugin
    - **Embedding/reranking della memoria:** pianificati tramite la superficie dell'adapter di embedding
    - **Generazione video:** in bundle ora tramite la capacità condivisa di generazione video

  </Accordion>

  <Accordion title="Video generation details">
    Per la generazione video, OpenClaw mappa la regione Qwen configurata sull'host AIGC
    DashScope corrispondente prima di inviare il job:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Ciò significa che un normale `models.providers.qwen.baseUrl` che punta agli host Qwen
    Coding Plan o Standard mantiene comunque la generazione video sull'endpoint video DashScope
    regionale corretto.

    Limiti attuali della generazione video Qwen in bundle:

    - Fino a **1** video di output per richiesta
    - Fino a **1** immagine di input
    - Fino a **4** video di input
    - Fino a **10 secondi** di durata
    - Supporta `size`, `aspectRatio`, `resolution`, `audio` e `watermark`
    - La modalità immagine/video di riferimento attualmente richiede **URL http(s) remoti**. I percorsi
      dei file locali vengono rifiutati in anticipo perché l'endpoint video DashScope non
      accetta buffer locali caricati per quei riferimenti.

  </Accordion>

  <Accordion title="Streaming usage compatibility">
    Gli endpoint nativi Model Studio pubblicizzano la compatibilità dell'uso in streaming sul
    trasporto condiviso `openai-completions`. OpenClaw ora la determina dalle capacità
    dell'endpoint, quindi gli id di provider personalizzati compatibili con DashScope che puntano agli
    stessi host nativi ereditano lo stesso comportamento di streaming-usage invece di
    richiedere specificamente l'id del provider integrato `qwen`.

    La compatibilità dell'uso con streaming nativo si applica sia agli host Coding Plan sia
    agli host compatibili con DashScope Standard:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Multimodal endpoint regions">
    Le superfici multimodali (comprensione video e generazione video Wan) usano gli endpoint
    DashScope **Standard**, non gli endpoint Coding Plan:

    - URL base Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL base Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Configurazione dell'ambiente e del demone">
    Se il Gateway viene eseguito come demone (launchd/systemd), assicurati che `QWEN_API_KEY` sia
    disponibile per quel processo (ad esempio, in `~/.openclaw/.env` o tramite
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti dei modelli e del comportamento di failover.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/it/providers/alibaba" icon="cloud">
    Provider ModelStudio legacy e note sulla migrazione.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e FAQ.
  </Card>
</CardGroup>
