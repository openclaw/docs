---
read_when:
    - Je wilt Xiaomi MiMo-modellen in OpenClaw
    - Je hebt Xiaomi MiMo-authenticatie of Token Plan-configuratie nodig
summary: Gebruik Xiaomi MiMo pay-as-you-go- en Token Plan-modellen met OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-06-27T18:16:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 171c4b95c6ff12d4b8d75747d35fcad19c6173d670a3af65fe0a286e04199751
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo is het API-platform voor **MiMo**-modellen. OpenClaw bevat een gebundelde Xiaomi Plugin met twee presets voor tekstproviders:

- `xiaomi` voor sleutels voor betalen naar gebruik (`sk-...`)
- `xiaomi-token-plan` voor Token Plan-sleutels (`tp-...`) met regionale endpointpresets

Dezelfde Plugin registreert ook de `xiaomi`-spraakprovider (TTS).

| Eigenschap        | Waarde                                                                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider-id's     | `xiaomi` (betalen naar gebruik), `xiaomi-token-plan` (Token Plan)                                                                                  |
| Plugin            | gebundeld, `enabledByDefault: true`                                                                                                                |
| Auth-env-vars     | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| Onboarding-vlaggen | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Directe CLI-vlaggen | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                    |
| Contracten        | chatvoltooiingen + `speechProviders`                                                                                                               |
| API               | OpenAI-compatibel (`openai-completions`)                                                                                                           |
| Basis-URL's       | Betalen naar gebruik: `https://api.xiaomimimo.com/v1`; Token Plan-presets: `token-plan-{cn,sgp,ams}...`                                           |
| Standaardmodellen | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS-standaard     | `mimo-v2.5-tts`, stem `mimo_default`; voicedesign-model `mimo-v2.5-tts-voicedesign`                                                               |

## Aan de slag

<Steps>
  <Step title="Get the right key">
    Maak een sleutel voor betalen naar gebruik aan in de [Xiaomi MiMo-console](https://platform.xiaomimimo.com/#/console/api-keys), of open je Token Plan-abonnementspagina en kopieer de regionale OpenAI-compatibele basis-URL plus de bijbehorende `tp-...`-sleutel.
  </Step>

  <Step title="Run onboarding">
    Betalen naar gebruik:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    Of geef de sleutels direct door:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

## Catalogus voor betalen naar gebruik

| Modelref               | Invoer      | Context   | Max. uitvoer | Redeneren | Opmerkingen      |
| ---------------------- | ----------- | --------- | ------------- | --------- | ---------------- |
| `xiaomi/mimo-v2-flash` | tekst       | 262,144   | 8,192         | Nee       | Standaardmodel   |
| `xiaomi/mimo-v2-pro`   | tekst       | 1,048,576 | 32,000        | Ja        | Grote context    |
| `xiaomi/mimo-v2-omni`  | tekst, afbeelding | 262,144   | 32,000        | Ja        | Multimodaal      |

<Tip>
De standaardmodelref is `xiaomi/mimo-v2-flash`. De provider wordt automatisch geïnjecteerd wanneer `XIAOMI_API_KEY` is ingesteld of wanneer er een auth-profiel bestaat.
</Tip>

## Token Plan-catalogus

Kies de Token Plan-auth-keuze die overeenkomt met de regionale basis-URL die in Xiaomi's abonnements-UI wordt weergegeven:

- `xiaomi-token-plan-cn` -> `https://token-plan-cn.xiaomimimo.com/v1`
- `xiaomi-token-plan-sgp` -> `https://token-plan-sgp.xiaomimimo.com/v1`
- `xiaomi-token-plan-ams` -> `https://token-plan-ams.xiaomimimo.com/v1`

| Modelref                          | Invoer      | Context   | Max. uitvoer | Redeneren | Opmerkingen      |
| --------------------------------- | ----------- | --------- | ------------- | --------- | ---------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | tekst       | 1,048,576 | 131,072       | Ja        | Standaardmodel   |
| `xiaomi-token-plan/mimo-v2.5`     | tekst, afbeelding | 1,048,576 | 131,072       | Ja        | Multimodaal      |

<Tip>
Token Plan-onboarding valideert de sleutelvorm en waarschuwt wanneer een `tp-...`-sleutel wordt ingevoerd in het pad voor betalen naar gebruik, of wanneer een `sk-...`-sleutel wordt ingevoerd in het Token Plan-pad.
</Tip>

## Tekst-naar-spraak

De gebundelde `xiaomi` Plugin registreert Xiaomi MiMo ook als spraakprovider voor
`messages.tts`. Deze roept Xiaomi's TTS-contract voor chatvoltooiingen aan met de tekst als
een `assistant`-bericht en optionele stijlinstructies als een `user`-bericht.

| Eigenschap | Waarde                                   |
| ---------- | ---------------------------------------- |
| TTS-id     | `xiaomi` (`mimo`-alias)                  |
| Auth       | `XIAOMI_API_KEY`                         |
| API        | `POST /v1/chat/completions` met `audio`  |
| Standaard  | `mimo-v2.5-tts`, stem `mimo_default`     |
| Uitvoer    | standaard MP3; WAV wanneer geconfigureerd |

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

Ondersteunde ingebouwde stemmen zijn onder meer `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` en `Dean`. Preset-stemmodellen gebruiken `audio.voice`, dus
OpenClaw verzendt `speakerVoice` voor `mimo-v2.5-tts` en `mimo-v2-tts`.

Xiaomi's voicedesign-model, `mimo-v2.5-tts-voicedesign`, genereert de stem
vanuit een stijlprompt in natuurlijke taal in plaats van een preset-stem-id. Configureer
`style` met de gewenste stembeschrijving; OpenClaw verzendt deze als het `user`-
bericht, verzendt de gesproken tekst als het `assistant`-bericht en laat
`audio.voice` weg voor dit model.

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

Voor spraaknotitiedoelen zoals Feishu en Telegram transcodeert OpenClaw Xiaomi-
uitvoer naar 48kHz Opus met `ffmpeg` vóór levering.

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

Prijzen en compat-vlaggen komen uit het gebundelde Plugin-manifest, dus het configuratievoorbeeld laat `cost` en `compat` weg om afwijking van runtimegedrag te voorkomen.

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

Prijzen komen uit het gebundelde manifest (Token Plan-modellen bevatten gelaagde prijzen voor cachelezingen), dus het configuratievoorbeeld laat `cost` weg.

<AccordionGroup>
  <Accordion title="Auto-injection behavior">
    De `xiaomi`-provider wordt automatisch geïnjecteerd wanneer `XIAOMI_API_KEY` in je omgeving is ingesteld of wanneer er een auth-profiel bestaat. `xiaomi-token-plan` heeft een regionale basis-URL nodig, dus het ondersteunde pad is de gebundelde Token Plan-onboardingkeuze of een expliciet configuratieblok `models.providers.xiaomi-token-plan`.
  </Accordion>

  <Accordion title="Model details">
    - **mimo-v2-flash** — lichtgewicht en snel, ideaal voor algemene teksttaken. Geen ondersteuning voor redeneren.
    - **mimo-v2-pro** — ondersteunt redeneren met een contextvenster van 1M tokens voor workloads met lange documenten.
    - **mimo-v2-omni** — multimodaal model met redeneren dat zowel tekst- als afbeeldingsinvoer accepteert.
    - **mimo-v2.5-pro** — Token Plan-standaard met Xiaomi's huidige V2.5-redeneerstack.
    - **mimo-v2.5** — multimodale V2.5-route voor Token Plan.

    <Note>
    Modellen voor betalen naar gebruik gebruiken het prefix `xiaomi/`. Token Plan-modellen gebruiken het prefix `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Als modellen niet verschijnen, controleer dan of de relevante sleutel-env-var of het auth-profiel aanwezig en geldig is.
    - Controleer voor Token Plan of de gekozen onboardingregio overeenkomt met de basis-URL op de abonnementspagina en of de sleutel begint met `tp-`.
    - Wanneer de Gateway als daemon draait, zorg er dan voor dat de sleutel beschikbaar is voor dat proces (bijvoorbeeld in `~/.openclaw/.env` of via `env.shellEnv`).

    <Warning>
    Sleutels die alleen in je interactieve shell zijn ingesteld, zijn niet zichtbaar voor door een daemon beheerde gatewayprocessen. Gebruik `~/.openclaw/.env` of `env.shellEnv`-configuratie voor permanente beschikbaarheid.
    </Warning>

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failovergedrag kiezen.
  </Card>
  <Card title="Configuration reference" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige OpenClaw-configuratiereferentie.
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo-dashboard en beheer van API-sleutels.
  </Card>
</CardGroup>
