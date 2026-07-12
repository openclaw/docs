---
read_when:
    - Vuoi usare Qwen con OpenClaw
    - Hai un abbonamento Alibaba Cloud Token Plan
    - In precedenza utilizzavi Qwen OAuth
summary: Usa Qwen Cloud tramite il relativo plugin OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-07-12T07:26:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 18030a70c024cd5c0713262874f5353bac50576e850f68a61bef4fa73ccf9b9c
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud è un Plugin provider esterno ufficiale di OpenClaw con ID canonico `qwen`. È destinato agli endpoint Standard e Coding Plan di Qwen Cloud / Alibaba DashScope, espone Token Plan come `qwen-token-plan`, mantiene `modelstudio` come alias di compatibilità, gestisce autonomamente l'ID provider personalizzato `bailian-token-plan` documentato da Alibaba ed espone il flusso di token di Qwen Portal come [`qwen-oauth`](/it/providers/qwen-oauth).

| Proprietà                      | Valore                                     |
| ------------------------------ | ------------------------------------------ |
| Provider                       | `qwen`                                     |
| Provider Token Plan            | `qwen-token-plan`                          |
| Provider del portale           | [`qwen-oauth`](/it/providers/qwen-oauth)      |
| Variabile di ambiente preferita | `QWEN_API_KEY`                             |
| Variabile di ambiente Token Plan | `QWEN_TOKEN_PLAN_API_KEY`                |
| Accettate anche (compatibilità) | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| Stile API                      | Compatibile con OpenAI                     |

<Tip>
`qwen3.7-plus` e `qwen3.6-plus` funzionano con gli endpoint Coding Plan e Standard.
Per `qwen3.7-max` o `qwen3.6-flash`, usa un endpoint **Standard (pagamento in base al consumo)**.
</Tip>

## Installare il Plugin

`qwen` viene distribuito come Plugin esterno ufficiale e non è incluso nel core. Installalo e riavvia il Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Per iniziare

Scegli il tipo di piano e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Coding Plan (abbonamento)">
    **Ideale per:** accesso in abbonamento tramite Qwen Coding Plan.

    <Steps>
      <Step title="Ottieni la chiave API">
        Crea o copia una chiave API da [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Esegui la configurazione iniziale">
        Per l'endpoint **globale**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Per l'endpoint **cinese**:

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
    Gli ID legacy `modelstudio-*` per la scelta dell'autenticazione e i riferimenti
    ai modelli `modelstudio/...` continuano a funzionare come alias di compatibilità,
    ma i nuovi flussi di configurazione dovrebbero preferire gli ID canonici
    `qwen-*` per la scelta dell'autenticazione e i riferimenti ai modelli `qwen/...`.
    Se definisci una voce personalizzata esatta `models.providers.modelstudio` con
    un altro valore `api`, tale provider personalizzato gestisce i riferimenti
    `modelstudio/...` al posto dell'alias di compatibilità Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (pagamento in base al consumo)">
    **Ideale per:** accesso con pagamento in base al consumo tramite l'endpoint Standard di Model Studio, inclusi `qwen3.7-max` e `qwen3.6-flash`, che non sono disponibili nel Coding Plan.

    <Steps>
      <Step title="Ottieni la chiave API">
        Crea o copia una chiave API da [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Esegui la configurazione iniziale">
        Per l'endpoint **globale**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Per l'endpoint **cinese**:

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
    Gli ID legacy `modelstudio-*` per la scelta dell'autenticazione e i riferimenti
    ai modelli `modelstudio/...` continuano a funzionare come alias di compatibilità,
    ma i nuovi flussi di configurazione dovrebbero preferire gli ID canonici
    `qwen-*` per la scelta dell'autenticazione e i riferimenti ai modelli `qwen/...`.
    Se definisci una voce personalizzata esatta `models.providers.modelstudio` con
    un altro valore `api`, tale provider personalizzato gestisce i riferimenti
    `modelstudio/...` al posto dell'alias di compatibilità Qwen.
    </Note>

  </Tab>

  <Tab title="Token Plan (edizione Team)">
    **Ideale per:** accesso in abbonamento per team basato su crediti a Qwen e ai modelli di terze parti supportati tramite Alibaba Cloud Model Studio.

    <Steps>
      <Step title="Ottieni la chiave dedicata">
        Assegna una postazione Token Plan e crea la relativa chiave dedicata `sk-sp-...`. Le chiavi di Token Plan, Coding Plan e pagamento in base al consumo non sono intercambiabili. Consulta la [panoramica globale di Token Plan](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) o la [panoramica cinese di Token Plan](https://help.aliyun.com/zh/model-studio/token-plan-overview).
      </Step>
      <Step title="Esegui la configurazione iniziale">
        Per l'endpoint **globale/internazionale** a Singapore:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        Per l'endpoint **cinese** a Pechino:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="Verifica il provider">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "Reply with: token plan ready"
        ```
      </Step>
    </Steps>

    <Note>
    La guida OpenClaw di Alibaba usa `bailian-token-plan` per un provider
    personalizzato manuale. Il Plugin registra tale ID come gestore di compatibilità,
    ma le nuove configurazioni dovrebbero usare `qwen-token-plan`. Una voce
    personalizzata esatta `models.providers.bailian-token-plan` mantiene la gestione
    del trasporto e del catalogo configurati; non viene mai unita al catalogo
    canonico di OpenAI.
    </Note>

    <Warning>
    Usa Token Plan solo per sessioni OpenClaw interattive. Non selezionarlo per
    processi Cron, script non presidiati o backend applicativi. Alibaba dichiara
    che l'uso non interattivo può comportare la sospensione dell'abbonamento o
    la revoca della relativa chiave API.
    </Warning>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Ideale per:** un token di Qwen Portal per `https://portal.qwen.ai/v1`.

    Consulta [Qwen OAuth / Portal](/it/providers/qwen-oauth) per la pagina dedicata
    al provider e le note sulla migrazione.

    <Steps>
      <Step title="Fornisci il token del portale">
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
    `qwen-oauth` usa lo stesso nome di variabile di ambiente `QWEN_API_KEY` del
    provider Qwen Cloud, ma memorizza l'autenticazione sotto l'ID provider
    `qwen-oauth` quando viene configurato tramite la procedura iniziale di OpenClaw.
    </Note>

  </Tab>
</Tabs>

## Tipi di piano ed endpoint

| Piano                              | Regione | Scelta di autenticazione   | Endpoint                                                         |
| ---------------------------------- | ------- | -------------------------- | ---------------------------------------------------------------- |
| Coding Plan (abbonamento)          | Cina    | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`                               |
| Coding Plan (abbonamento)          | Globale | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`                          |
| Qwen Portal                        | Globale | `qwen-oauth`               | `portal.qwen.ai/v1`                                              |
| Standard (pagamento in base al consumo) | Cina | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`                  |
| Standard (pagamento in base al consumo) | Globale | `qwen-standard-api-key` | `dashscope-intl.aliyuncs.com/compatible-mode/v1`              |
| Token Plan (edizione Team)         | Cina    | `qwen-token-plan-cn`       | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`     |
| Token Plan (edizione Team)         | Globale | `qwen-token-plan`          | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |

Il provider seleziona automaticamente l'endpoint in base alla scelta di
autenticazione. Le scelte canoniche usano la famiglia `qwen-*`; `modelstudio-*`
rimane disponibile solo per compatibilità. Puoi eseguire l'override con un
`baseUrl` personalizzato nella configurazione.

<Tip>
**Gestisci le chiavi:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentazione:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catalogo integrato

OpenClaw include questo catalogo statico Qwen. Il catalogo tiene conto
dell'endpoint: le configurazioni Coding Plan omettono i modelli che funzionano
solo sull'endpoint Standard.

| Riferimento modello          | Input           | Contesto  | Note                              |
| ---------------------------- | --------------- | --------- | --------------------------------- |
| `qwen/qwen3.5-plus`          | testo, immagine | 1,000,000 | Modello predefinito               |
| `qwen/qwen3.6-flash`         | testo, immagine | 1,000,000 | Solo endpoint Standard            |
| `qwen/qwen3.6-plus`          | testo, immagine | 1,000,000 | Coding Plan + Standard            |
| `qwen/qwen3.7-max`           | testo           | 1,000,000 | Solo endpoint Standard            |
| `qwen/qwen3.7-plus`          | testo, immagine | 1,000,000 | Coding Plan + Standard            |
| `qwen/qwen3-max-2026-01-23`  | testo           | 262,144   | Linea Qwen Max                    |
| `qwen/qwen3-coder-next`      | testo           | 262,144   | Programmazione                    |
| `qwen/qwen3-coder-plus`      | testo           | 1,000,000 | Programmazione                    |
| `qwen/MiniMax-M2.5`          | testo           | 1,000,000 | Ragionamento abilitato            |
| `qwen/glm-5`                 | testo           | 202,752   | GLM                               |
| `qwen/glm-4.7`               | testo           | 202,752   | GLM                               |
| `qwen/kimi-k2.5`             | testo, immagine | 262,144   | Moonshot AI tramite Alibaba       |
| `qwen-oauth/qwen3.5-plus`    | testo, immagine | 1,000,000 | Predefinito di Qwen Portal        |

<Note>
La disponibilità può comunque variare in base all'endpoint e al piano di
fatturazione, anche quando un modello è presente nel catalogo statico.
</Note>

### Catalogo Token Plan

Token Plan usa un elenco consentito separato basato sulla corrispondenza esatta
delle stringhe. I modelli del piano dedicati esclusivamente alla generazione di
immagini non sono inclusi perché usano API differenti.

| Riferimento modello                  | Input           | Contesto  |
| ------------------------------------ | --------------- | --------- |
| `qwen-token-plan/qwen3.7-max`        | testo           | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`       | testo, immagine | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`       | testo, immagine | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`      | testo, immagine | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`    | testo           | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash`  | testo           | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`      | testo           | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`     | testo, immagine | 262,144   |
| `qwen-token-plan/kimi-k2.6`          | testo, immagine | 262,144   |
| `qwen-token-plan/kimi-k2.5`          | testo, immagine | 262,144   |
| `qwen-token-plan/glm-5.2`            | testo           | 1,000,000 |
| `qwen-token-plan/glm-5.1`            | testo           | 202,752   |
| `qwen-token-plan/glm-5`              | testo           | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`       | testo           | 196,608   |

## Controlli del ragionamento

`qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-flash` e `qwen3.6-plus` hanno il
ragionamento abilitato nel catalogo integrato. Per i modelli di ragionamento della
famiglia `qwen`, il provider associa i livelli di ragionamento di OpenClaw al flag
di richiesta di primo livello `enable_thinking` di DashScope: con il ragionamento
disabilitato invia `enable_thinking: false`, mentre con qualsiasi altro livello
invia `enable_thinking: true`. I modelli personalizzati possono adottare un payload
di ragionamento alternativo basato sul modello di chat impostando
`compat.thinkingFormat: "qwen-chat-template"` nella voce del modello.

Anche i modelli Token Plan sono contrassegnati come in grado di ragionare.
`kimi-k2.7-code` e `MiniMax-M2.5` funzionano esclusivamente con il ragionamento,
quindi OpenClaw lo mantiene abilitato anche quando la sessione richiede
`/think off`. DeepSeek V4 associa i livelli da `minimal` a `high` all'intensità
`high` del servizio e associa `xhigh` o `max` a `max`. GLM 5.2 accetta l'intero
intervallo da `minimal` a `max`; GLM 5.1 e GLM 5 accettano i livelli fino a
`xhigh` e tutti e tre usano `high` come valore predefinito. Gli altri modelli
ibridi rispettano lo stato di attivazione o disattivazione richiesto.

## Funzionalità aggiuntive multimodali

Il plugin `qwen` offre funzionalità multimodali solo sugli endpoint DashScope
**Standard**, non sugli endpoint Coding Plan:

- **Comprensione di immagini e video** tramite `qwen-vl-max-latest`
- **Generazione di video Wan** tramite `wan2.6-t2v` (predefinito), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

L'autenticazione per la comprensione dei contenuti multimediali viene determinata
automaticamente dalla configurazione Qwen; non è necessaria alcuna configurazione
aggiuntiva. Perché la comprensione dei contenuti multimediali funzioni, assicurati
di utilizzare un endpoint Standard (con pagamento in base al consumo).

Per impostare Qwen come provider video predefinito:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Limiti della generazione video: 1 video di output per richiesta, fino a 1 immagine
di input (da immagine a video), fino a 4 video di input (da video a video), durata
massima di 10 secondi. Supporta `size`, `aspectRatio`, `resolution`, `audio` e
`watermark`. Gli input di immagini o video di riferimento richiedono URL http(s)
remoti; i percorsi di file locali vengono rifiutati prima dell'invio perché
l'endpoint video di DashScope non accetta buffer locali caricati per tali
riferimenti.

<Note>
Consulta [Generazione di video](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Disponibilità di Qwen 3.6 e 3.7">
    `qwen3.7-plus` e `qwen3.6-plus` sono disponibili sugli endpoint Coding Plan e Standard. `qwen3.7-max` e `qwen3.6-flash` sono disponibili solo su Standard. Gli endpoint Standard (con pagamento in base al consumo) sono:

    - Cina: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Globale: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw omette `qwen3.7-max` e `qwen3.6-flash` dai cataloghi Coding Plan.
    Se un endpoint Coding Plan restituisce un errore "modello non supportato" per uno dei due,
    passa all'endpoint Standard corrispondente e alla relativa chiave.

  </Accordion>

  <Accordion title="Instradamento regionale della generazione video">
    Prima di inviare un processo di generazione video, OpenClaw associa la regione Qwen
    configurata all'host DashScope AIGC corrispondente:

    - Globale/Internazionale: `https://dashscope-intl.aliyuncs.com`
    - Cina: `https://dashscope.aliyuncs.com`

    Un normale `models.providers.qwen.baseUrl` che punta agli host Qwen Coding Plan
    o Standard instrada comunque la generazione video all'endpoint video DashScope
    regionale corrispondente.

  </Accordion>

  <Accordion title="Compatibilità dell'utilizzo in streaming">
    Gli endpoint Qwen nativi dichiarano la compatibilità dell'utilizzo in streaming
    sul trasporto condiviso `openai-completions`, quindi gli identificativi di provider
    personalizzati compatibili con DashScope che puntano agli stessi host nativi
    ereditano lo stesso comportamento senza richiedere specificamente
    l'identificativo del provider integrato `qwen`. Ciò si applica agli endpoint
    Coding Plan, Standard e Token Plan:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Piano delle funzionalità">
    Il plugin `qwen` viene posizionato come sede specifica del fornitore per l'intera
    gamma di Qwen Cloud, non soltanto per i modelli di programmazione e testo.

    - **Modelli di testo/chat:** disponibili tramite il plugin
    - **Chiamata di strumenti, output strutturato, ragionamento:** ereditati dal trasporto compatibile con OpenAI
    - **Generazione di immagini:** pianificata a livello del plugin del provider
    - **Comprensione di immagini/video:** disponibile tramite il plugin sull'endpoint Standard
    - **Voce/audio:** pianificati a livello del plugin del provider
    - **Embedding e riordinamento della memoria:** pianificati tramite l'interfaccia dell'adattatore di embedding
    - **Generazione di video:** disponibile tramite il plugin attraverso la funzionalità condivisa di generazione video

  </Accordion>

  <Accordion title="Configurazione dell'ambiente e del demone">
    Se il Gateway viene eseguito come demone (launchd/systemd), assicurati che
    `QWEN_API_KEY` o `QWEN_TOKEN_PLAN_API_KEY` sia disponibile per tale processo
    (ad esempio in `~/.openclaw/.env` o tramite `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Alibaba Model Studio" href="/it/providers/alibaba" icon="cloud">
    Provider integrato per la generazione di video Wan sulla stessa piattaforma DashScope.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e domande frequenti.
  </Card>
</CardGroup>
