---
read_when:
    - Je wilt Xiaomi MiMo-modellen in OpenClaw
    - Je moet XIAOMI_API_KEY instellen
summary: Gebruik Xiaomi MiMo-modellen met OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-05-06T09:30:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7bb33bf107cb44414b0f3a6140d60fdfecb3b7154c3197e7cbed982d9a6450b
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo is het API-platform voor **MiMo**-modellen. OpenClaw bevat een gebundelde `xiaomi`-Plugin die zowel een OpenAI-compatibele chatprovider als een spraakprovider (TTS) registreert met dezelfde `XIAOMI_API_KEY`.

| Eigenschap       | Waarde                                   |
| ---------------- | ---------------------------------------- |
| Provider-id      | `xiaomi`                                 |
| Plugin           | gebundeld, `enabledByDefault: true`      |
| Auth-env-var     | `XIAOMI_API_KEY`                         |
| Onboarding-vlag  | `--auth-choice xiaomi-api-key`           |
| Directe CLI-vlag | `--xiaomi-api-key <key>`                 |
| Contracten       | chataanvullingen + `speechProviders`     |
| API              | OpenAI-compatibel (`openai-completions`) |
| Basis-URL        | `https://api.xiaomimimo.com/v1`          |
| Standaardmodel   | `xiaomi/mimo-v2-flash`                   |
| TTS-standaard    | `mimo-v2.5-tts`, stem `mimo_default`     |

## Aan de slag

<Steps>
  <Step title="Een API-sleutel ophalen">
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
  <Step title="Controleren of het model beschikbaar is">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## Ingebouwde catalogus

| Model-ref              | Invoer      | Context   | Max. uitvoer | Redeneren | Opmerkingen   |
| ---------------------- | ----------- | --------- | ------------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | tekst       | 262,144   | 8,192         | Nee       | Standaardmodel |
| `xiaomi/mimo-v2-pro`   | tekst       | 1,048,576 | 32,000        | Ja        | Grote context |
| `xiaomi/mimo-v2-omni`  | tekst, afbeelding | 262,144   | 32,000        | Ja        | Multimodaal   |

<Tip>
De standaardmodel-ref is `xiaomi/mimo-v2-flash`. De provider wordt automatisch geïnjecteerd wanneer `XIAOMI_API_KEY` is ingesteld of wanneer er een auth-profiel bestaat.
</Tip>

## Tekst-naar-spraak

De gebundelde `xiaomi`-Plugin registreert Xiaomi MiMo ook als spraakprovider voor
`messages.tts`. Deze roept Xiaomi's TTS-contract voor chataanvullingen aan met de tekst als
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
TTS-accounts; de standaard gebruikt het huidige MiMo-V2.5 TTS-model. Voor voice-note-
doelen zoals Feishu en Telegram transcodeert OpenClaw Xiaomi-uitvoer naar 48kHz
Opus met `ffmpeg` vóór levering.

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
    De `xiaomi`-provider wordt automatisch geïnjecteerd wanneer `XIAOMI_API_KEY` in je omgeving is ingesteld of wanneer er een auth-profiel bestaat. Je hoeft de provider niet handmatig te configureren, tenzij je modelmetadata of de basis-URL wilt overschrijven.
  </Accordion>

  <Accordion title="Modeldetails">
    - **mimo-v2-flash** — lichtgewicht en snel, ideaal voor algemene teksttaken. Geen ondersteuning voor redeneren.
    - **mimo-v2-pro** — ondersteunt redeneren met een contextvenster van 1M tokens voor workloads met lange documenten.
    - **mimo-v2-omni** — multimodaal model met redeneren dat zowel tekst- als afbeeldingsinvoer accepteert.

    <Note>
    Alle modellen gebruiken het voorvoegsel `xiaomi/` (bijvoorbeeld `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Probleemoplossing">
    - Als modellen niet verschijnen, controleer dan of `XIAOMI_API_KEY` is ingesteld en geldig is.
    - Wanneer de Gateway als daemon draait, zorg er dan voor dat de sleutel beschikbaar is voor dat proces (bijvoorbeeld in `~/.openclaw/.env` of via `env.shellEnv`).

    <Warning>
    Sleutels die alleen in je interactieve shell zijn ingesteld, zijn niet zichtbaar voor door een daemon beheerde gatewayprocessen. Gebruik `~/.openclaw/.env` of `env.shellEnv`-configuratie voor permanente beschikbaarheid.
    </Warning>

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, model-refs en failovergedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige OpenClaw-configuratiereferentie.
  </Card>
  <Card title="Xiaomi MiMo-console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo-dashboard en API-sleutelbeheer.
  </Card>
</CardGroup>
