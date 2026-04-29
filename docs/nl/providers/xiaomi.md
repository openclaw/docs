---
read_when:
    - Je wilt Xiaomi MiMo-modellen in OpenClaw
    - Je moet XIAOMI_API_KEY instellen
summary: Gebruik Xiaomi MiMo-modellen met OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-29T23:14:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7781973c3a1d14101cdb0a8d1affe3fd076a968552ed2a8630a91a8947daeb3a
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo is het API-platform voor **MiMo**-modellen. OpenClaw gebruikt het Xiaomi
OpenAI-compatibele eindpunt met authenticatie via API-sleutel.

| Eigenschap | Waarde                          |
| ---------- | -------------------------------- |
| Provider   | `xiaomi`                        |
| Auth       | `XIAOMI_API_KEY`                |
| API        | OpenAI-compatibel               |
| Basis-URL  | `https://api.xiaomimimo.com/v1` |

## Aan de slag

<Steps>
  <Step title="Een API-sleutel verkrijgen">
    Maak een API-sleutel aan in de [Xiaomi MiMo-console](https://platform.xiaomimimo.com/#/console/api-keys).
  </Step>
  <Step title="Onboarding uitvoeren">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Of geef de sleutel direct door:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="Verifiëren dat het model beschikbaar is">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## Ingebouwde catalogus

| Modelverwijzing        | Invoer      | Context   | Maximale uitvoer | Redeneren | Opmerkingen      |
| ---------------------- | ----------- | --------- | ---------------- | --------- | ---------------- |
| `xiaomi/mimo-v2-flash` | tekst       | 262,144   | 8,192            | Nee       | Standaardmodel   |
| `xiaomi/mimo-v2-pro`   | tekst       | 1,048,576 | 32,000           | Ja        | Grote context    |
| `xiaomi/mimo-v2-omni`  | tekst, beeld | 262,144   | 32,000           | Ja        | Multimodaal      |

<Tip>
De standaardmodelverwijzing is `xiaomi/mimo-v2-flash`. De provider wordt automatisch geïnjecteerd wanneer `XIAOMI_API_KEY` is ingesteld of wanneer er een authenticatieprofiel bestaat.
</Tip>

## Tekst-naar-spraak

De meegeleverde `xiaomi`-plugin registreert Xiaomi MiMo ook als spraakprovider voor
`messages.tts`. Deze roept Xiaomi's TTS-contract voor chat-completions aan met de tekst als
een `assistant`-bericht en optionele stijlrichtlijnen als een `user`-bericht.

| Eigenschap | Waarde                                   |
| ---------- | ---------------------------------------- |
| TTS-id     | `xiaomi` (`mimo`-alias)                  |
| Auth       | `XIAOMI_API_KEY`                         |
| API        | `POST /v1/chat/completions` met `audio`  |
| Standaard  | `mimo-v2.5-tts`, stem `mimo_default`     |
| Uitvoer    | Standaard MP3; WAV wanneer geconfigureerd |

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
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Ondersteunde ingebouwde stemmen zijn onder andere `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` en `Dean`. `mimo-v2-tts` wordt ondersteund voor oudere MiMo
TTS-accounts; de standaard gebruikt het huidige MiMo-V2.5 TTS-model. Voor doelen voor spraaknotities
zoals Feishu en Telegram transcodeert OpenClaw Xiaomi-uitvoer naar 48 kHz
Opus met `ffmpeg` vóór aflevering.

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
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Gedrag voor automatische injectie">
    De `xiaomi`-provider wordt automatisch geïnjecteerd wanneer `XIAOMI_API_KEY` in je omgeving is ingesteld of wanneer er een authenticatieprofiel bestaat. Je hoeft de provider niet handmatig te configureren, tenzij je modelmetadata of de basis-URL wilt overschrijven.
  </Accordion>

  <Accordion title="Modeldetails">
    - **mimo-v2-flash** — lichtgewicht en snel, ideaal voor algemene teksttaken. Geen ondersteuning voor redeneren.
    - **mimo-v2-pro** — ondersteunt redeneren met een contextvenster van 1 miljoen tokens voor workloads met lange documenten.
    - **mimo-v2-omni** — multimodaal model met redeneren ingeschakeld dat zowel tekst- als beeldinvoer accepteert.

    <Note>
    Alle modellen gebruiken het voorvoegsel `xiaomi/` (bijvoorbeeld `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Probleemoplossing">
    - Als modellen niet verschijnen, controleer dan of `XIAOMI_API_KEY` is ingesteld en geldig is.
    - Wanneer de Gateway als daemon draait, zorg er dan voor dat de sleutel beschikbaar is voor dat proces (bijvoorbeeld in `~/.openclaw/.env` of via `env.shellEnv`).

    <Warning>
    Sleutels die alleen in je interactieve shell zijn ingesteld, zijn niet zichtbaar voor door een daemon beheerde gatewayprocessen. Gebruik `~/.openclaw/.env` of `env.shellEnv`-configuratie voor blijvende beschikbaarheid.
    </Warning>

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige OpenClaw-configuratiereferentie.
  </Card>
  <Card title="Xiaomi MiMo-console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo-dashboard en beheer van API-sleutels.
  </Card>
</CardGroup>
