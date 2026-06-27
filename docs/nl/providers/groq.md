---
read_when:
    - Je wilt Groq gebruiken met OpenClaw
    - Je hebt de API-sleutel-env-var of CLI-authenticatiekeuze nodig
    - Je configureert Whisper-audiotranscriptie op Groq
summary: Groq-configuratie (authenticatie + modelselectie + Whisper-transcriptie)
title: Groq
x-i18n:
    generated_at: "2026-06-27T18:12:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1133f2b1fa09e2e854b5762e189233597e86e8ccb2df8d619e891b4dc9c8d82
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) biedt ultrasnelle inferentie op modellen met open gewichten (Llama, Gemma, Kimi, Qwen, GPT OSS en meer) met aangepaste LPU-hardware. De Groq-Plugin registreert zowel een OpenAI-compatibele chatprovider als een provider voor media-inzicht in audio.

| Eigenschap                  | Waarde                                   |
| --------------------------- | ---------------------------------------- |
| Provider-id                 | `groq`                                   |
| Plugin                      | officieel extern pakket                  |
| Auth-omgevingsvariabele     | `GROQ_API_KEY`                           |
| API                         | OpenAI-compatibel (`openai-completions`) |
| Basis-URL                   | `https://api.groq.com/openai/v1`         |
| Audiotranscriptie           | `whisper-large-v3-turbo` (standaard)     |
| Voorgestelde chatstandaard  | `groq/llama-3.3-70b-versatile`           |

## Plugin installeren

Installeer de officiële Plugin en herstart daarna Gateway:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Aan de slag

<Steps>
  <Step title="Get an API key">
    Maak een API-sleutel aan op [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Set the API key">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="Set a default model">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
  <Step title="Verify the catalog is reachable">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### Voorbeeld van configuratiebestand

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Ingebouwde catalogus

OpenClaw levert een door een manifest ondersteunde Groq-catalogus met zowel redenerende als niet-redenerende items. Voer `openclaw models list --provider groq` uit om de statische rijen voor je geïnstalleerde versie te bekijken, of raadpleeg [console.groq.com/docs/models](https://console.groq.com/docs/models) voor Groqs gezaghebbende lijst.

| Modelverwijzing                                  | Naam                    | Redeneren | Invoer             | Context |
| ------------------------------------------------ | ----------------------- | --------- | ------------------ | ------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | nee       | tekst              | 131,072 |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | nee       | tekst              | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | nee       | tekst + afbeelding | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | ja        | tekst              | 131,072 |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | ja        | tekst              | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | ja        | tekst              | 131,072 |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | ja        | tekst              | 131,072 |
| `groq/groq/compound`                             | Compound                | ja        | tekst              | 131,072 |
| `groq/groq/compound-mini`                        | Compound Mini           | ja        | tekst              | 131,072 |

<Tip>
  De catalogus verandert met elke OpenClaw-release. `openclaw models list --provider groq` toont de rijen die bij je geïnstalleerde versie bekend zijn; controleer dit met [console.groq.com/docs/models](https://console.groq.com/docs/models) voor nieuw toegevoegde of verouderde modellen.
</Tip>

## Redeneermodellen

OpenClaw koppelt de gedeelde `/think`-niveaus aan Groqs modelspecifieke `reasoning_effort`-waarden:

- Voor `qwen/qwen3-32b` verzendt uitgeschakeld denken `none` en ingeschakeld denken `default`.
- Voor Groq GPT OSS-redeneermodellen (`openai/gpt-oss-*`) verzendt OpenClaw `low`, `medium` of `high` op basis van het `/think`-niveau. Uitgeschakeld denken laat `reasoning_effort` weg, omdat die modellen geen uitgeschakelde waarde ondersteunen.
- DeepSeek R1 Distill, Qwen QwQ en Compound gebruiken Groqs native redeneeroppervlak; `/think` bepaalt de zichtbaarheid, maar het model redeneert altijd.

Zie [Denkmodi](/nl/tools/thinking) voor de gedeelde `/think`-niveaus en hoe OpenClaw ze per provider vertaalt.

## Audiotranscriptie

Groqs Plugin registreert ook een **provider voor media-inzicht in audio**, zodat spraakberichten kunnen worden getranscribeerd via het gedeelde `tools.media.audio`-oppervlak.

| Eigenschap              | Waarde                                    |
| ----------------------- | ----------------------------------------- |
| Gedeeld configuratiepad | `tools.media.audio`                       |
| Standaard basis-URL     | `https://api.groq.com/openai/v1`          |
| Standaardmodel          | `whisper-large-v3-turbo`                  |
| Automatische prioriteit | 20                                        |
| API-eindpunt            | OpenAI-compatibel `/audio/transcriptions` |

Om Groq de standaard audio-backend te maken:

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Environment availability for the daemon">
    Als Gateway als beheerde service draait (launchd, systemd, Docker), moet `GROQ_API_KEY` zichtbaar zijn voor dat proces — niet alleen voor je interactieve shell.

    <Warning>
      Een sleutel die alleen in een interactieve shell is geëxporteerd, helpt een launchd- of systemd-daemon niet, tenzij die omgeving daar ook wordt geïmporteerd. Stel de sleutel in `~/.openclaw/.env` in of via `env.shellEnv` om deze leesbaar te maken vanuit het gatewayproces.
    </Warning>

  </Accordion>

  <Accordion title="Custom Groq model ids">
    OpenClaw accepteert elke Groq-model-id tijdens runtime. Gebruik de exacte id die Groq toont en voeg er `groq/` als prefix aan toe. De statische catalogus dekt de gebruikelijke gevallen; niet-gecatalogiseerde id's vallen terug op de standaard OpenAI-compatibele template.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/<your-model-id>" },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model providers" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
  <Card title="Thinking modes" href="/nl/tools/thinking" icon="brain">
    Niveaus voor redeneerinspanning en interactie met providerbeleid.
  </Card>
  <Card title="Configuration reference" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig configuratieschema inclusief provider- en audio-instellingen.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq-dashboard, API-documentatie en prijzen.
  </Card>
</CardGroup>
