---
read_when:
    - Vuoi usare i modelli Xiaomi MiMo in OpenClaw
    - È necessario configurare l'autenticazione Xiaomi MiMo o il piano Token
summary: Usa i modelli a consumo e del piano Token di Xiaomi MiMo con OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-12T07:29:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6b91ead3e4a32a93bca7e02476b8de11137e8a5b5fa434bad8187bc1b204856
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo è la piattaforma API per i modelli **MiMo**. Il plugin `xiaomi`
incluso (`enabledByDefault: true`, senza alcun passaggio di installazione) registra due
provider di testo e un provider vocale (TTS):

- `xiaomi` - chiavi con pagamento in base al consumo (`sk-...`)
- `xiaomi-token-plan` - chiavi Token Plan (`tp-...`) con preimpostazioni regionali degli endpoint

| Proprietà                  | Valore                                                                                                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID dei provider            | `xiaomi` (pagamento in base al consumo), `xiaomi-token-plan` (Token Plan)                                                                           |
| Variabili di ambiente auth | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| Flag di onboarding         | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Flag CLI diretti           | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API                        | Completamenti chat compatibili con OpenAI (`openai-completions`)                                                                                   |
| Contratto vocale           | `speechProviders: ["xiaomi"]`                                                                                                                      |
| URL di base                | Pagamento in base al consumo: `https://api.xiaomimimo.com/v1`; Token Plan: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                             |
| Modelli predefiniti        | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS predefinito            | `mimo-v2.5-tts`, voce `mimo_default`; modello di progettazione vocale `mimo-v2.5-tts-voicedesign`                                                   |

## Per iniziare

<Steps>
  <Step title="Ottieni la chiave corretta">
    Crea una chiave con pagamento in base al consumo nella [console Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys), oppure apri la pagina del tuo abbonamento Token Plan e copia l'URL di base regionale compatibile con OpenAI insieme alla chiave `tp-...` corrispondente.
  </Step>

  <Step title="Esegui l'onboarding">
    Pagamento in base al consumo:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    In alternativa, passa direttamente le chiavi:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

<Tip>
L'onboarding convalida il formato della chiave e avvisa quando viene inserita una chiave `tp-...` nel percorso con pagamento in base al consumo oppure una chiave `sk-...` nel percorso Token Plan.
</Tip>

## Catalogo con pagamento in base al consumo

| Riferimento modello       | Input         | Contesto  | Output massimo | Ragionamento | Note                  |
| ------------------------- | ------------- | --------- | -------------- | ------------- | --------------------- |
| `xiaomi/mimo-v2-flash`    | testo         | 262.144   | 8.192          | No            | Modello predefinito   |
| `xiaomi/mimo-v2-pro`      | testo         | 1.048.576 | 32.000         | Sì            | Contesto esteso       |
| `xiaomi/mimo-v2-omni`     | testo, immagine | 262.144 | 32.000         | Sì            | Multimodale           |

## Catalogo Token Plan

Scegli l'opzione di autenticazione Token Plan corrispondente all'URL di base regionale mostrato nell'interfaccia dell'abbonamento Xiaomi:

| Opzione di autenticazione | URL di base                                |
| ------------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn`    | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp`   | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams`   | `https://token-plan-ams.xiaomimimo.com/v1` |

| Riferimento modello                  | Input           | Contesto  | Output massimo | Ragionamento | Note                |
| ------------------------------------ | --------------- | --------- | -------------- | ------------- | ------------------- |
| `xiaomi-token-plan/mimo-v2.5-pro`    | testo           | 1.048.576 | 131.072        | Sì            | Modello predefinito |
| `xiaomi-token-plan/mimo-v2.5`        | testo, immagine | 1.048.576 | 131.072        | Sì            | Multimodale         |

`xiaomi-token-plan` richiede un URL di base regionale per essere risolto. Il percorso
supportato consiste in un'opzione di onboarding Token Plan inclusa oppure in un blocco
di configurazione `models.providers.xiaomi-token-plan` esplicito con `baseUrl` impostato;
il provider non viene proposto in assenza di una di queste condizioni.

## Modelli di ragionamento

`mimo-v2-pro`, `mimo-v2-omni`, `mimo-v2.5` e `mimo-v2.5-pro` supportano
la [direttiva `/think`](/it/tools/thinking) di OpenClaw con i livelli `off`,
`minimal`, `low`, `medium`, `high`, `xhigh` e `max` (valore predefinito `high`).
`mimo-v2-flash` non supporta il ragionamento.

## Sintesi vocale

Il plugin `xiaomi` incluso registra inoltre Xiaomi MiMo come provider vocale
per `messages.tts`. Richiama il contratto TTS dei completamenti chat di Xiaomi
usando il testo come messaggio `assistant` e le indicazioni di stile facoltative
come messaggio `user`.

| Proprietà       | Valore                                         |
| --------------- | ---------------------------------------------- |
| ID TTS          | `xiaomi` (alias `mimo`)                        |
| Autenticazione  | `XIAOMI_API_KEY`                               |
| API             | `POST /v1/chat/completions` con `audio`        |
| Predefinito     | `mimo-v2.5-tts`, voce `mimo_default`           |
| Output          | MP3 per impostazione predefinita; WAV se configurato |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          speakerVoice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Voci integrate: `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`,
`Milo`, `Dean`. I modelli con voce preimpostata (`mimo-v2.5-tts`, `mimo-v2-tts`) usano
`audio.voice`, pertanto OpenClaw invia `speakerVoice` per questi modelli.

Il modello di progettazione vocale `mimo-v2.5-tts-voicedesign` genera la voce da una
descrizione di stile in linguaggio naturale anziché da un ID voce preimpostato. Imposta `style`
sulla descrizione vocale desiderata; OpenClaw la invia come messaggio `user`, invia
il testo da pronunciare come messaggio `assistant` e omette `audio.voice` per questo
modello.

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Warm, natural female voice with clear pronunciation.",
        },
      },
    },
  },
}
```

Per i canali che richiedono come destinazione della sintesi una nota vocale (Discord, Feishu,
Matrix, Telegram e WhatsApp), OpenClaw transcodifica l'output Xiaomi in Opus mono a 48 kHz
con `ffmpeg` prima della consegna.

## Esempio di configurazione

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

I prezzi e i flag di compatibilità provengono dal manifesto del plugin incluso, quindi l'esempio di configurazione omette `cost` e `compat` per evitare divergenze dal comportamento in fase di esecuzione.

Token Plan:

```json5
{
  env: { XIAOMI_TOKEN_PLAN_API_KEY: "tp-your-key" },
  agents: { defaults: { model: { primary: "xiaomi-token-plan/mimo-v2.5-pro" } } },
  models: {
    mode: "merge",
    providers: {
      "xiaomi-token-plan": {
        baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_TOKEN_PLAN_API_KEY",
        models: [
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

I prezzi provengono dal manifesto incluso (i modelli Token Plan comprendono prezzi a livelli per la lettura dalla cache), quindi l'esempio di configurazione omette `cost`.

<AccordionGroup>
  <Accordion title="Comportamento di inserimento automatico">
    Il provider `xiaomi` viene abilitato automaticamente quando `XIAOMI_API_KEY` è impostata nell'ambiente oppure esiste un profilo di autenticazione. `xiaomi-token-plan` richiede un URL di base regionale, quindi il percorso supportato consiste nell'opzione di onboarding Token Plan inclusa oppure in un blocco di configurazione `models.providers.xiaomi-token-plan` esplicito.
  </Accordion>

  <Accordion title="Dettagli dei modelli">
    - **mimo-v2-flash** - leggero e veloce, ideale per attività testuali generiche. Non supporta il ragionamento.
    - **mimo-v2-pro** - supporta il ragionamento con una finestra di contesto da 1 milione di token per carichi di lavoro con documenti lunghi.
    - **mimo-v2-omni** - modello multimodale con ragionamento che accetta input sia testuali sia di immagini.
    - **mimo-v2.5-pro** - modello predefinito di Token Plan con l'attuale architettura di ragionamento V2.5 di Xiaomi.
    - **mimo-v2.5** - percorso multimodale V2.5 di Token Plan.

    <Note>
    I modelli con pagamento in base al consumo usano il prefisso `xiaomi/`. I modelli Token Plan usano il prefisso `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    - Se i modelli non vengono visualizzati, verifica che la variabile di ambiente della chiave pertinente o il profilo di autenticazione siano presenti e validi.
    - Per Token Plan, verifica che la regione scelta durante l'onboarding corrisponda all'URL di base della pagina dell'abbonamento e che la chiave inizi con `tp-`.
    - Quando il Gateway viene eseguito come demone, assicurati che la chiave sia disponibile per quel processo, ad esempio in `~/.openclaw/.env` o tramite `env.shellEnv`.

    <Warning>
    Le chiavi impostate soltanto nella shell interattiva non sono visibili ai processi Gateway gestiti come demoni. Usa `~/.openclaw/.env` o la configurazione `env.shellEnv` per garantirne la disponibilità persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Livelli di ragionamento" href="/it/tools/thinking" icon="brain">
    Sintassi della direttiva `/think` e associazione dei livelli.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione di OpenClaw.
  </Card>
  <Card title="Console Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Dashboard Xiaomi MiMo e gestione delle chiavi API.
  </Card>
</CardGroup>
