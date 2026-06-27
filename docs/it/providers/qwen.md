---
read_when:
    - Vuoi usare Qwen con OpenClaw
    - In precedenza hai usato Qwen OAuth
summary: Usare Qwen Cloud tramite il suo Plugin OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-06-27T18:09:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e42a38f3e7f2db54092886f2ef8c3ab27163c3c3d0f9b4d95affd58555f58d3
    source_path: providers/qwen.md
    workflow: 16
---

OpenClaw ora tratta Qwen come Plugin provider di prima classe con id canonico
`qwen`. Il Plugin provider punta agli endpoint Qwen Cloud / Alibaba DashScope e
Coding Plan, mantiene funzionanti gli id legacy `modelstudio` come alias di
compatibilità ed espone anche il flusso del token Qwen Portal come provider
`qwen-oauth`.

- Provider: `qwen`
- Provider Portal: [`qwen-oauth`](/it/providers/qwen-oauth)
- Variabile env preferita: `QWEN_API_KEY`
- Accettate anche per compatibilità: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Stile API: compatibile con OpenAI

<Tip>
Se vuoi usare `qwen3.6-plus`, preferisci l'endpoint **Standard (pagamento a consumo)**.
Il supporto del Coding Plan può essere in ritardo rispetto al catalogo pubblico.
</Tip>

## Installa Plugin

Installa il Plugin ufficiale, poi riavvia Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Per iniziare

Scegli il tipo di piano e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Coding Plan (abbonamento)">
    **Ideale per:** accesso basato su abbonamento tramite Qwen Coding Plan.

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
    Gli id auth-choice legacy `modelstudio-*` e i riferimenti modello `modelstudio/...`
    continuano a funzionare come alias di compatibilità, ma i nuovi flussi di configurazione
    dovrebbero preferire gli id auth-choice canonici `qwen-*` e i riferimenti modello
    `qwen/...`. Se definisci una voce personalizzata esatta
    `models.providers.modelstudio` con un altro valore `api`, quel provider
    personalizzato possiede i riferimenti `modelstudio/...` invece dell'alias di
    compatibilità Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (pagamento a consumo)">
    **Ideale per:** accesso a consumo tramite l'endpoint Standard Model Studio, inclusi modelli come `qwen3.6-plus` che potrebbero non essere disponibili nel Coding Plan.

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
    Gli id auth-choice legacy `modelstudio-*` e i riferimenti modello `modelstudio/...`
    continuano a funzionare come alias di compatibilità, ma i nuovi flussi di configurazione
    dovrebbero preferire gli id auth-choice canonici `qwen-*` e i riferimenti modello
    `qwen/...`. Se definisci una voce personalizzata esatta
    `models.providers.modelstudio` con un altro valore `api`, quel provider
    personalizzato possiede i riferimenti `modelstudio/...` invece dell'alias di
    compatibilità Qwen.
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Ideale per:** un token Qwen Portal per `https://portal.qwen.ai/v1`.

    Consulta [Qwen OAuth / Portal](/it/providers/qwen-oauth) per la pagina dedicata
    del provider e le note di migrazione.

    <Steps>
      <Step title="Fornisci il tuo token Portal">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Imposta un modello predefinito">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen-oauth/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` usa lo stesso nome di variabile env `QWEN_API_KEY` del provider
    DashScope, ma salva l'autenticazione sotto l'id provider `qwen-oauth` quando
    configurato tramite l'onboarding di OpenClaw.
    </Note>

  </Tab>
</Tabs>

## Tipi di piano ed endpoint

| Piano                      | Regione | Scelta auth                | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pagamento a consumo) | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pagamento a consumo) | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (abbonamento) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (abbonamento) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                              |

Il provider seleziona automaticamente l'endpoint in base alla tua scelta auth.
Le scelte canoniche usano la famiglia `qwen-*`; `modelstudio-*` resta solo per
compatibilità. Puoi eseguire l'override con un `baseUrl` personalizzato nella
configurazione.

<Tip>
**Gestisci chiavi:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentazione:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catalogo integrato

OpenClaw attualmente distribuisce questo catalogo statico Qwen. Il catalogo
configurato è consapevole dell'endpoint: le configurazioni Coding Plan omettono
i modelli noti per funzionare solo sull'endpoint Standard.

| Riferimento modello         | Input       | Contesto  | Note                                               |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000 | Modello predefinito                                |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000 | Preferisci endpoint Standard quando ti serve questo modello |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144   | Linea Qwen Max                                     |
| `qwen/qwen3-coder-next`     | text        | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000 | Ragionamento abilitato                             |
| `qwen/glm-5`                | text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | text, image | 262,144   | Moonshot AI tramite Alibaba                        |
| `qwen-oauth/qwen3.5-plus`   | text, image | 1,000,000 | Predefinito Qwen Portal                            |

<Note>
La disponibilità può comunque variare in base all'endpoint e al piano di fatturazione
anche quando un modello è presente nel catalogo statico.
</Note>

## Controlli di ragionamento

Per i modelli Qwen Cloud con ragionamento abilitato, il provider mappa i livelli
di ragionamento di OpenClaw al flag di richiesta di primo livello `enable_thinking`
di DashScope. Il ragionamento disabilitato invia `enable_thinking: false`; gli altri
livelli di ragionamento inviano `enable_thinking: true`.

## Add-on multimodali

Il Plugin `qwen` espone anche capacità multimodali sugli endpoint DashScope
**Standard** (non sugli endpoint Coding Plan):

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
    Il Plugin Qwen registra la comprensione multimediale per immagini e video
    sugli endpoint DashScope **Standard** (non sugli endpoint Coding Plan).

    | Proprietà     | Valore                |
    | ------------- | --------------------- |
    | Modello       | `qwen-vl-max-latest`  |
    | Input supportato | Immagini, video    |

    La comprensione multimediale viene risolta automaticamente dall'autenticazione
    Qwen configurata: non serve configurazione aggiuntiva. Assicurati di usare un
    endpoint Standard (pagamento a consumo) per il supporto alla comprensione
    multimediale.

  </Accordion>

  <Accordion title="Disponibilità di Qwen 3.6 Plus">
    `qwen3.6-plus` è disponibile sugli endpoint Standard (pagamento a consumo)
    Model Studio:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Se gli endpoint Coding Plan restituiscono un errore "unsupported model" per
    `qwen3.6-plus`, passa a Standard (pagamento a consumo) invece della coppia
    endpoint/chiave del Coding Plan.

    Il catalogo statico Qwen di OpenClaw non pubblicizza `qwen3.6-plus` sugli
    endpoint Coding Plan, ma le voci `qwen/qwen3.6-plus` configurate esplicitamente
    sotto `models.providers.qwen.models` vengono rispettate sui baseUrl Coding Plan,
    così puoi abilitare quel modello se Aliyun lo abilita sul tuo abbonamento. L'API
    upstream decide comunque se la chiamata va a buon fine.

  </Accordion>

  <Accordion title="Piano delle capacità">
    Il Plugin `qwen` viene posizionato come sede vendor per l'intera superficie
    Qwen Cloud, non solo per i modelli di coding/testo.

    - **Modelli testo/chat:** disponibili tramite il Plugin
    - **Tool calling, output strutturato, ragionamento:** ereditati dal trasporto compatibile con OpenAI
    - **Generazione immagini:** pianificata a livello di Plugin provider
    - **Comprensione immagini/video:** disponibile tramite il Plugin sull'endpoint Standard
    - **Voce/audio:** pianificati a livello di Plugin provider
    - **Embedding/reranking di memoria:** pianificati tramite la superficie dell'adattatore embedding
    - **Generazione video:** disponibile tramite il Plugin attraverso la capacità condivisa di generazione video

  </Accordion>

  <Accordion title="Dettagli sulla generazione video">
    Per la generazione video, OpenClaw mappa la regione Qwen configurata sull'host
    DashScope AIGC corrispondente prima di inviare il job:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Ciò significa che un normale `models.providers.qwen.baseUrl` che punta agli
    host Qwen Coding Plan o Standard mantiene comunque la generazione video
    sull'endpoint video DashScope regionale corretto.

    Limiti attuali della generazione video Qwen:

    - Fino a **1** video di output per richiesta
    - Fino a **1** immagine di input
    - Fino a **4** video di input
    - Fino a **10 secondi** di durata
    - Supporta `size`, `aspectRatio`, `resolution`, `audio` e `watermark`
    - La modalità immagine/video di riferimento attualmente richiede **URL http(s) remoti**. I percorsi
      di file locali vengono rifiutati in anticipo perché l'endpoint video DashScope non
      accetta buffer locali caricati per tali riferimenti.

  </Accordion>

  <Accordion title="Compatibilità dell'utilizzo in streaming">
    Gli endpoint nativi di Model Studio dichiarano la compatibilità dell'utilizzo in streaming sul
    trasporto condiviso `openai-completions`. OpenClaw ora determina questo in base alle
    capacità degli endpoint, quindi gli ID di provider personalizzati compatibili con DashScope che puntano agli
    stessi host nativi ereditano lo stesso comportamento di utilizzo in streaming invece di
    richiedere specificamente l'ID del provider integrato `qwen`.

    La compatibilità dell'utilizzo con streaming nativo si applica sia agli host Coding Plan sia
    agli host Standard compatibili con DashScope:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Regioni degli endpoint multimodali">
    Le superfici multimodali (comprensione video e generazione video Wan) usano gli
    endpoint DashScope **Standard**, non gli endpoint Coding Plan:

    - URL di base Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL di base Standard Cina: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Configurazione dell'ambiente e del daemon">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `QWEN_API_KEY` sia
    disponibile per quel processo (ad esempio in `~/.openclaw/.env` o tramite
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
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
