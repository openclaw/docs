---
read_when:
    - Je wilt Xiaomi MiMo-modellen in OpenClaw
    - Je moet Xiaomi MiMo-authenticatie of een Token Plan instellen
summary: Gebruik de pay-as-you-go- en Token Plan-modellen van Xiaomi MiMo met OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-12T09:20:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6b91ead3e4a32a93bca7e02476b8de11137e8a5b5fa434bad8187bc1b204856
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo is het API-platform voor **MiMo**-modellen. De meegeleverde `xiaomi`-
plugin (`enabledByDefault: true`, geen installatiestap) registreert twee tekstproviders
en een spraakprovider (TTS):

- `xiaomi` - sleutels met betaling naar gebruik (`sk-...`)
- `xiaomi-token-plan` - Token Plan-sleutels (`tp-...`) met regionale vooraf ingestelde eindpunten

| Eigenschap          | Waarde                                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider-id's       | `xiaomi` (betaling naar gebruik), `xiaomi-token-plan` (Token Plan)                                                                                 |
| Omgevingsvariabelen voor authenticatie | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                         |
| Onboardingvlaggen   | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Directe CLI-vlaggen | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API                 | OpenAI-compatibele chatvoltooiingen (`openai-completions`)                                                                                         |
| Spraakcontract      | `speechProviders: ["xiaomi"]`                                                                                                                      |
| Basis-URL's         | Betaling naar gebruik: `https://api.xiaomimimo.com/v1`; Token Plan: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                   |
| Standaardmodellen   | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS-standaard       | `mimo-v2.5-tts`, stem `mimo_default`; stemontwerpmodel `mimo-v2.5-tts-voicedesign`                                                                |

## Aan de slag

<Steps>
  <Step title="De juiste sleutel verkrijgen">
    Maak een sleutel met betaling naar gebruik aan in de [Xiaomi MiMo-console](https://platform.xiaomimimo.com/#/console/api-keys), of open de abonnementspagina van je Token Plan en kopieer de regionale OpenAI-compatibele basis-URL en de bijbehorende `tp-...`-sleutel.
  </Step>

  <Step title="De onboarding uitvoeren">
    Betaling naar gebruik:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    Je kunt de sleutels ook rechtstreeks doorgeven:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Controleren of het model beschikbaar is">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

<Tip>
Tijdens de onboarding wordt de vorm van de sleutel gevalideerd en verschijnt er een waarschuwing wanneer een `tp-...`-sleutel wordt ingevoerd in het traject voor betaling naar gebruik, of wanneer een `sk-...`-sleutel wordt ingevoerd in het Token Plan-traject.
</Tip>

## Catalogus voor betaling naar gebruik

| Modelreferentie        | Invoer      | Context   | Maximale uitvoer | Redeneren | Opmerkingen       |
| ---------------------- | ----------- | --------- | ---------------- | --------- | ----------------- |
| `xiaomi/mimo-v2-flash` | tekst       | 262,144   | 8,192            | Nee       | Standaardmodel    |
| `xiaomi/mimo-v2-pro`   | tekst       | 1,048,576 | 32,000           | Ja        | Grote context     |
| `xiaomi/mimo-v2-omni`  | tekst, afbeelding | 262,144 | 32,000      | Ja        | Multimodaal       |

## Token Plan-catalogus

Kies de Token Plan-authenticatieoptie die overeenkomt met de regionale basis-URL die in de abonnementsinterface van Xiaomi wordt weergegeven:

| Authenticatieoptie      | Basis-URL                                  |
| ----------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn`  | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp` | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams` | `https://token-plan-ams.xiaomimimo.com/v1` |

| Modelreferentie                   | Invoer           | Context   | Maximale uitvoer | Redeneren | Opmerkingen    |
| --------------------------------- | ---------------- | --------- | ---------------- | --------- | -------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | tekst            | 1,048,576 | 131,072          | Ja        | Standaardmodel |
| `xiaomi-token-plan/mimo-v2.5`     | tekst, afbeelding | 1,048,576 | 131,072         | Ja        | Multimodaal    |

`xiaomi-token-plan` heeft een regionale basis-URL nodig om te kunnen worden herleid. Het ondersteunde
traject is een meegeleverde Token Plan-onboardingoptie of een expliciet
`models.providers.xiaomi-token-plan`-configuratieblok waarin `baseUrl` is ingesteld; de
provider wordt zonder een van deze opties niet aangeboden.

## Redeneermodellen

`mimo-v2-pro`, `mimo-v2-omni`, `mimo-v2.5` en `mimo-v2.5-pro` ondersteunen
de [`/think`-instructie](/nl/tools/thinking) van OpenClaw met de niveaus `off`,
`minimal`, `low`, `medium`, `high`, `xhigh` en `max` (standaard `high`).
`mimo-v2-flash` ondersteunt geen redeneren.

## Tekst-naar-spraak

De meegeleverde `xiaomi`-plugin registreert Xiaomi MiMo ook als spraakprovider
voor `messages.tts`. Deze roept het TTS-contract voor chatvoltooiingen van Xiaomi aan met de
tekst als een `assistant`-bericht en optionele stijlaanwijzingen als een `user`-
bericht.

| Eigenschap | Waarde                                   |
| ---------- | ---------------------------------------- |
| TTS-id     | `xiaomi` (`mimo`-alias)                  |
| Authenticatie | `XIAOMI_API_KEY`                      |
| API        | `POST /v1/chat/completions` met `audio`  |
| Standaard  | `mimo-v2.5-tts`, stem `mimo_default`     |
| Uitvoer    | Standaard MP3; WAV indien geconfigureerd |

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

Ingebouwde stemmen: `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`,
`Milo`, `Dean`. Modellen met vooraf ingestelde stemmen (`mimo-v2.5-tts`, `mimo-v2-tts`) gebruiken
`audio.voice`, waardoor OpenClaw voor deze modellen `speakerVoice` verzendt.

Het stemontwerpmodel `mimo-v2.5-tts-voicedesign` genereert de stem op basis van een
stijlprompt in natuurlijke taal in plaats van een vooraf ingesteld stem-id. Stel `style` in op
de gewenste stembeschrijving; OpenClaw verzendt deze als het `user`-bericht, verzendt
de uit te spreken tekst als het `assistant`-bericht en laat `audio.voice` weg voor dit
model.

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

Voor kanalen die een synthesedoel voor spraakberichten aanvragen (Discord, Feishu,
Matrix, Telegram en WhatsApp), transcodeert OpenClaw de uitvoer van Xiaomi vóór aflevering
naar 48kHz mono-Opus met `ffmpeg`.

## Configuratievoorbeeld

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

Prijzen en compatibiliteitsvlaggen zijn afkomstig uit het meegeleverde pluginmanifest, zodat in het configuratievoorbeeld `cost` en `compat` worden weggelaten om afwijkingen van het runtimegedrag te voorkomen.

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

Prijzen zijn afkomstig uit het meegeleverde manifest (Token Plan-modellen bevatten gelaagde prijzen voor cacheleesbewerkingen), zodat in het configuratievoorbeeld `cost` wordt weggelaten.

<AccordionGroup>
  <Accordion title="Gedrag bij automatische injectie">
    De `xiaomi`-provider wordt automatisch ingeschakeld wanneer `XIAOMI_API_KEY` in je omgeving is ingesteld of wanneer er een authenticatieprofiel bestaat. `xiaomi-token-plan` heeft een regionale basis-URL nodig, dus het ondersteunde traject is de meegeleverde Token Plan-onboardingoptie of een expliciet `models.providers.xiaomi-token-plan`-configuratieblok.
  </Accordion>

  <Accordion title="Modeldetails">
    - **mimo-v2-flash** - lichtgewicht en snel, ideaal voor algemene teksttaken. Ondersteunt geen redeneren.
    - **mimo-v2-pro** - ondersteunt redeneren met een contextvenster van 1 miljoen tokens voor werklasten met lange documenten.
    - **mimo-v2-omni** - multimodaal model met ondersteuning voor redeneren dat zowel tekst- als afbeeldingsinvoer accepteert.
    - **mimo-v2.5-pro** - het standaardmodel van Token Plan met de huidige V2.5-redeneerstack van Xiaomi.
    - **mimo-v2.5** - de multimodale V2.5-route van Token Plan.

    <Note>
    Modellen met betaling naar gebruik gebruiken het voorvoegsel `xiaomi/`. Token Plan-modellen gebruiken het voorvoegsel `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Problemen oplossen">
    - Als modellen niet verschijnen, controleer dan of de relevante omgevingsvariabele voor de sleutel of het authenticatieprofiel aanwezig en geldig is.
    - Controleer voor Token Plan of de gekozen onboardingregio overeenkomt met de basis-URL op de abonnementspagina en of de sleutel begint met `tp-`.
    - Wanneer de Gateway als daemon wordt uitgevoerd, moet je ervoor zorgen dat de sleutel beschikbaar is voor dat proces (bijvoorbeeld in `~/.openclaw/.env` of via `env.shellEnv`).

    <Warning>
    Sleutels die alleen in je interactieve shell zijn ingesteld, zijn niet zichtbaar voor Gateway-processen die als daemon worden beheerd. Gebruik de configuratie `~/.openclaw/.env` of `env.shellEnv` voor permanente beschikbaarheid.
    </Warning>

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers en modelreferenties kiezen en failovergedrag configureren.
  </Card>
  <Card title="Denkniveaus" href="/nl/tools/thinking" icon="brain">
    Syntaxis van de `/think`-instructie en toewijzing van niveaus.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige configuratiereferentie voor OpenClaw.
  </Card>
  <Card title="Xiaomi MiMo-console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo-dashboard en beheer van API-sleutels.
  </Card>
</CardGroup>
