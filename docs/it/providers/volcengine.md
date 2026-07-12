---
read_when:
    - Vuoi usare i modelli Volcano Engine o Doubao con OpenClaw
    - È necessario configurare la chiave API di Volcengine
    - Vuoi utilizzare la sintesi vocale di Volcengine Speech
summary: Configurazione di Volcano Engine (modelli Doubao, endpoint per la programmazione e sintesi vocale Seed Speech)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-07-12T07:29:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e853a1c8847704caedf0ec83c38332569f72105c5e34ad973daf614a2e80550b
    source_path: providers/volcengine.md
    workflow: 16
---

Il provider Volcengine consente di accedere ai modelli Doubao e ai modelli di terze parti ospitati su Volcano Engine, con endpoint distinti per i carichi di lavoro generici e di programmazione. Lo stesso plugin incluso registra anche Volcengine Speech come provider TTS.

| Dettaglio              | Valore                                                     |
| ---------------------- | ---------------------------------------------------------- |
| Provider               | `volcengine` (generico + TTS), `volcengine-plan` (codifica) |
| Autenticazione modelli | `VOLCANO_ENGINE_API_KEY`                                   |
| Autenticazione TTS     | `VOLCENGINE_TTS_API_KEY` o `BYTEPLUS_SEED_SPEECH_API_KEY`  |
| API                    | Modelli compatibili con OpenAI, TTS BytePlus Seed Speech   |

## Per iniziare

<Steps>
  <Step title="Set the API key">
    Esegui la configurazione iniziale interattiva:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Questo registra sia il provider generico (`volcengine`) sia quello di programmazione (`volcengine-plan`) usando un'unica chiave API.

  </Step>
  <Step title="Set a default model">
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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Per la configurazione non interattiva (CI, scripting), passa direttamente la chiave:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Provider ed endpoint

| Provider          | Endpoint                                  | Caso d'uso         |
| ----------------- | ----------------------------------------- | ------------------ |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Modelli generici   |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modelli di codifica |

<Note>
Entrambi i provider vengono configurati con un'unica chiave API. La configurazione li registra entrambi automaticamente e il selettore dei modelli del provider di programmazione riutilizza anche l'autenticazione del provider generico (`volcengine-plan` è un alias di autenticazione di `volcengine`).
</Note>

## Catalogo integrato

<Tabs>
  <Tab title="General (volcengine)">
    | Riferimento modello                           | Nome                            | Input           | Contesto |
    | --------------------------------------------- | ------------------------------- | --------------- | -------- |
    | `volcengine/deepseek-v3-2-251201`             | DeepSeek V3.2                   | testo, immagine | 128.000  |
    | `volcengine/doubao-seed-1-8-251228`           | Doubao Seed 1.8                 | testo, immagine | 256.000  |
    | `volcengine/doubao-seed-code-preview-251028`  | doubao-seed-code-preview-251028 | testo, immagine | 256.000  |
    | `volcengine/glm-4-7-251222`                   | GLM 4.7                         | testo, immagine | 200.000  |
    | `volcengine/kimi-k2-5-260127`                 | Kimi K2.5                       | testo, immagine | 256.000  |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | Riferimento modello                                | Nome                     | Input | Contesto |
    | -------------------------------------------------- | ------------------------ | ----- | -------- |
    | `volcengine-plan/ark-code-latest`                  | Ark Coding Plan          | testo | 256.000  |
    | `volcengine-plan/doubao-seed-code`                 | Doubao Seed Code         | testo | 256.000  |
    | `volcengine-plan/doubao-seed-code-preview-251028`  | Doubao Seed Code Preview | testo | 256.000  |
    | `volcengine-plan/glm-4.7`                          | GLM 4.7 Coding           | testo | 200.000  |
    | `volcengine-plan/kimi-k2-thinking`                 | Kimi K2 Thinking         | testo | 256.000  |
    | `volcengine-plan/kimi-k2.5`                        | Kimi K2.5 Coding         | testo | 256.000  |
  </Tab>
</Tabs>

Entrambi i cataloghi sono statici (non viene effettuata alcuna chiamata di individuazione a `/models`) e supportano la contabilizzazione in streaming dell'utilizzo compatibile con OpenAI. Gli schemi degli strumenti per entrambi i provider eliminano automaticamente le parole chiave `minLength`, `maxLength`, `minItems`, `maxItems`, `minContains` e `maxContains`, poiché l'API per le chiamate agli strumenti di Volcengine le rifiuta.

## Sintesi vocale

Il TTS di Volcengine utilizza l'API HTTP BytePlus Seed Speech (`voice.ap-southeast-1.bytepluses.com`) e viene configurato separatamente dalla chiave API dei modelli Doubao compatibile con OpenAI. Nella console BytePlus, apri Seed Speech > Settings > API Keys, copia la chiave API, quindi imposta:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

Quindi abilitalo in `openclaw.json`:

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

Campi disponibili in `messages.tts.providers.volcengine`: `apiKey`, `voice`, `speedRatio` (0.2-3.0), `emotion`, `cluster`, `resourceId`, `appKey` e `baseUrl`. Anche `!emotion=<value>` funziona come direttiva vocale incorporata quando sono consentite le sostituzioni delle impostazioni vocali.

Per le destinazioni di messaggi vocali, OpenClaw richiede il formato nativo del provider `ogg_opus`. Per i normali allegati audio, richiede `mp3`. Anche gli alias del provider `bytedance` e `doubao` vengono risolti in questo provider vocale.

L'ID risorsa predefinito è `seed-tts-1.0`, l'abilitazione che BytePlus concede per impostazione predefinita alle chiavi API Seed Speech appena create. Se il tuo progetto dispone dell'abilitazione TTS 2.0, imposta `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`.

<Warning>
`VOLCANO_ENGINE_API_KEY` è destinata agli endpoint dei modelli ModelArk/Doubao e non è una chiave API Seed Speech. Il TTS richiede una chiave API Seed Speech dalla BytePlus Speech Console oppure una coppia AppID/token della precedente Speech Console.
</Warning>

L'autenticazione precedente tramite AppID/token rimane supportata per le applicazioni Speech Console meno recenti:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

Altre variabili di ambiente TTS facoltative: quando impostate, `VOLCENGINE_TTS_VOICE`, `VOLCENGINE_TTS_APP_KEY` e `VOLCENGINE_TTS_BASE_URL` sostituiscono i campi di configurazione corrispondenti in `messages.tts.providers.volcengine`.

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Default model after onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` imposta `volcengine-plan/ark-code-latest` come modello predefinito, registrando al contempo il catalogo generico `volcengine`.
  </Accordion>

  <Accordion title="Model picker fallback behavior">
    Durante la selezione del modello nella configurazione iniziale o nella configurazione successiva, la scelta di autenticazione Volcengine privilegia sia le righe `volcengine/*` sia quelle `volcengine-plan/*`. Se questi modelli non sono ancora caricati, OpenClaw utilizza come alternativa il catalogo non filtrato anziché mostrare un selettore vuoto limitato al provider.
  </Accordion>

  <Accordion title="Environment variables for daemon processes">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che le variabili di ambiente dei modelli e del TTS, come `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`, `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID` e `VOLCENGINE_TTS_TOKEN`, siano disponibili per tale processo, ad esempio in `~/.openclaw/.env` o tramite `env.shellEnv`.
  </Accordion>
</AccordionGroup>

<Warning>
Quando OpenClaw viene eseguito come servizio in background, le variabili di ambiente impostate nella shell interattiva non vengono ereditate automaticamente. Consulta la nota sui daemon riportata sopra.
</Warning>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti dei modelli e del comportamento di failover.
  </Card>
  <Card title="Configuration" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione per agenti, modelli e provider.
  </Card>
  <Card title="Troubleshooting" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e procedure di debug.
  </Card>
  <Card title="FAQ" href="/it/help/faq" icon="circle-question">
    Domande frequenti sulla configurazione di OpenClaw.
  </Card>
</CardGroup>
