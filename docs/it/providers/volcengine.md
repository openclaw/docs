---
read_when:
    - Vuoi usare Volcano Engine o i modelli Doubao con OpenClaw
    - Hai bisogno della configurazione della chiave API di Volcengine
    - Vuoi usare la sintesi vocale di Volcengine Speech
summary: Configurazione di Volcano Engine (modelli Doubao, endpoint di coding e TTS Seed Speech)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-26T11:37:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7948a26cc898e125d445e9ae091704f5cf442266d29e712c0dcedbe0dc0cce7
    source_path: providers/volcengine.md
    workflow: 15
    postprocess_version: locale-links-v1
---

Il provider Volcengine offre accesso ai modelli Doubao e ai modelli di terze parti
ospitati su Volcano Engine, con endpoint separati per i carichi di lavoro
generali e di coding. Lo stesso Plugin incluso può anche registrare Volcengine Speech come provider TTS.

| Dettaglio   | Valore                                                     |
| ---------- | ---------------------------------------------------------- |
| Provider   | `volcengine` (generale + TTS) + `volcengine-plan` (coding) |
| Autenticazione modello | `VOLCANO_ENGINE_API_KEY`                        |
| Autenticazione TTS | `VOLCENGINE_TTS_API_KEY` o `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API        | Modelli compatibili con OpenAI, TTS BytePlus Seed Speech   |

## Per iniziare

<Steps>
  <Step title="Imposta la chiave API">
    Esegui l'onboarding interattivo:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Questo registra sia il provider generale (`volcengine`) sia quello di coding (`volcengine-plan`) a partire da una singola chiave API.

  </Step>
  <Step title="Imposta un modello predefinito">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Per una configurazione non interattiva (CI, scripting), passa la chiave direttamente:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Provider ed endpoint

| Provider          | Endpoint                                  | Caso d'uso     |
| ----------------- | ----------------------------------------- | -------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Modelli generali |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modelli di coding |

<Note>
Entrambi i provider sono configurati da una singola chiave API. La configurazione li registra entrambi automaticamente.
</Note>

## Catalogo integrato

<Tabs>
  <Tab title="Generale (volcengine)">
    | Model ref                                    | Nome                            | Input       | Contesto |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | testo, immagine | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | testo, immagine | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | testo, immagine | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | testo, immagine | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | testo, immagine | 128,000 |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | Model ref                                         | Nome                     | Input | Contesto |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | testo | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | testo | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | testo | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | testo | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | testo | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | testo | 256,000 |
  </Tab>
</Tabs>

## Sintesi vocale

Il TTS di Volcengine usa l'API HTTP BytePlus Seed Speech ed è configurato
separatamente dalla chiave API dei modelli Doubao compatibili con OpenAI. Nella console BytePlus,
apri Seed Speech > Settings > API Keys e copia la chiave API, quindi imposta:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

Poi abilitalo in `openclaw.json`:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "byteplus_seed_speech_api_key",
          voice: "en_female_anna_mars_bigtts",
          speedRatio: 1.0,
        },
      },
    },
  },
}
```

Per le destinazioni con note vocali, OpenClaw richiede a Volcengine il formato nativo del provider
`ogg_opus`. Per i normali allegati audio, richiede `mp3`. Anche gli alias del provider
`bytedance` e `doubao` vengono risolti nello stesso provider vocale.

L'ID risorsa predefinito è `seed-tts-1.0` perché è quello che BytePlus assegna
alle chiavi API Seed Speech appena create nel progetto predefinito. Se il tuo progetto
ha l'abilitazione TTS 2.0, imposta `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`.

<Warning>
`VOLCANO_ENGINE_API_KEY` è per gli endpoint dei modelli ModelArk/Doubao e non è una
chiave API Seed Speech. Il TTS richiede una chiave API Seed Speech dalla BytePlus Speech
Console oppure una coppia AppID/token della Speech Console legacy.
</Warning>

L'autenticazione legacy AppID/token resta supportata per le applicazioni meno recenti della Speech Console:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Modello predefinito dopo l'onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` attualmente imposta
    `volcengine-plan/ark-code-latest` come modello predefinito registrando anche
    il catalogo generale `volcengine`.
  </Accordion>

  <Accordion title="Comportamento di fallback del selettore del modello">
    Durante l'onboarding/configurazione della selezione del modello, la scelta di autenticazione Volcengine privilegia
    sia le righe `volcengine/*` sia `volcengine-plan/*`. Se questi modelli non sono
    ancora caricati, OpenClaw ripiega sul catalogo non filtrato invece di mostrare un
    selettore limitato al provider vuoto.
  </Accordion>

  <Accordion title="Variabili d'ambiente per i processi daemon">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che le variabili d'ambiente
    del modello e del TTS come `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`,
    `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID` e
    `VOLCENGINE_TTS_TOKEN` siano disponibili per quel processo (per esempio, in
    `~/.openclaw/.env` o tramite `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Quando OpenClaw viene eseguito come servizio in background, le variabili d'ambiente impostate nella tua
shell interattiva non vengono ereditate automaticamente. Vedi la nota precedente sui daemon.
</Warning>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei model ref e del comportamento di failover.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione per agenti, modelli e provider.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e passaggi di debug.
  </Card>
  <Card title="FAQ" href="/it/help/faq" icon="circle-question">
    Domande frequenti sulla configurazione di OpenClaw.
  </Card>
</CardGroup>
