---
read_when:
    - Je wilt Groq met OpenClaw gebruiken
    - Je hebt de omgevingsvariabele voor de API-sleutel of de CLI-authenticatiekeuze nodig
    - Je configureert Whisper-audiotranscriptie op Groq
summary: Groq-configuratie (authenticatie + modelselectie + Whisper-transcriptie)
title: Groq
x-i18n:
    generated_at: "2026-07-12T09:19:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) biedt ultrasnelle inferentie op modellen met open gewichten (Llama, Gemma, Kimi, Qwen, GPT OSS en meer) met behulp van aangepaste LPU-hardware. De Groq-plugin registreert zowel een OpenAI-compatibele chatprovider als een provider voor mediabegrip van audio.

| Eigenschap                   | Waarde                                   |
| ---------------------------- | ---------------------------------------- |
| Provider-id                  | `groq`                                   |
| Plugin                       | officieel extern pakket                  |
| Omgevingsvariabele voor auth | `GROQ_API_KEY`                           |
| API                          | OpenAI-compatibel (`openai-completions`) |
| Basis-URL                    | `https://api.groq.com/openai/v1`         |
| Audiotranscriptie            | `whisper-large-v3-turbo` (standaard)     |
| Aanbevolen standaardchatmodel | `groq/llama-3.3-70b-versatile`          |

## Plugin installeren

Installeer de officiële plugin en start daarna de Gateway opnieuw:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Aan de slag

<Steps>
  <Step title="Een API-sleutel verkrijgen">
    Maak een API-sleutel aan op [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="De API-sleutel instellen">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="Een standaardmodel instellen">
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
  <Step title="Controleren of de catalogus bereikbaar is">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### Voorbeeld van een configuratiebestand

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

OpenClaw wordt geleverd met een door een manifest ondersteunde Groq-catalogus met zowel modellen met als zonder redeneervermogen. Voer `openclaw models list --provider groq` uit om de statische vermeldingen voor je geïnstalleerde versie te bekijken, of raadpleeg [console.groq.com/docs/models](https://console.groq.com/docs/models) voor de gezaghebbende lijst van Groq.

| Modelreferentie                                  | Naam                    | Redeneren | Invoer            | Context |
| ------------------------------------------------ | ----------------------- | --------- | ----------------- | ------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | nee       | tekst             | 131,072 |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | nee       | tekst             | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | nee       | tekst + afbeelding | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | ja        | tekst             | 131,072 |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | ja        | tekst             | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | ja        | tekst             | 131,072 |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | ja        | tekst             | 131,072 |
| `groq/groq/compound`                             | Compound                | ja        | tekst             | 131,072 |
| `groq/groq/compound-mini`                        | Compound Mini           | ja        | tekst             | 131,072 |

<Tip>
  De catalogus ontwikkelt zich met elke OpenClaw-release. `openclaw models list --provider groq` toont de vermeldingen die bekend zijn bij je geïnstalleerde versie; vergelijk deze met [console.groq.com/docs/models](https://console.groq.com/docs/models) voor nieuw toegevoegde of verouderde modellen.
</Tip>

## Redeneermodellen

Groq-redeneermodellen (`reasoning: true` in de bovenstaande tabel) wijzen de gedeelde `/think`-niveaus van OpenClaw toe aan `reasoning_effort`-waarden van `low`, `medium` of `high`. Bij `/think off` of `/think none` wordt `reasoning_effort` uit het verzoek weggelaten in plaats van een uitgeschakelde waarde te verzenden.

Zie [Denkmodi](/nl/tools/thinking) voor de gedeelde `/think`-niveaus en hoe OpenClaw deze per provider vertaalt.

## Audiotranscriptie

De Groq-plugin registreert ook een **provider voor mediabegrip van audio**, zodat spraakberichten via het gedeelde `tools.media.audio`-oppervlak kunnen worden getranscribeerd.

| Eigenschap                 | Waarde                                    |
| -------------------------- | ----------------------------------------- |
| Gedeeld configuratiepad    | `tools.media.audio`                       |
| Standaardbasis-URL         | `https://api.groq.com/openai/v1`          |
| Standaardmodel             | `whisper-large-v3-turbo`                  |
| Automatische prioriteit    | 20                                        |
| API-eindpunt               | OpenAI-compatibel `/audio/transcriptions` |

Groq instellen als de standaardbackend voor audio:

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
  <Accordion title="Beschikbaarheid van de omgeving voor de daemon">
    Als de Gateway als beheerde service wordt uitgevoerd (launchd, systemd, Docker), moet `GROQ_API_KEY` zichtbaar zijn voor dat proces — niet alleen voor je interactieve shell.

    <Warning>
      Een sleutel die alleen in een interactieve shell is geëxporteerd, helpt een launchd- of systemd-daemon niet, tenzij die omgeving daar ook wordt geïmporteerd. Stel de sleutel in `~/.openclaw/.env` of via `env.shellEnv` in om deze leesbaar te maken voor het Gateway-proces.
    </Warning>

  </Accordion>

  <Accordion title="Aangepaste Groq-model-id's">
    OpenClaw accepteert tijdens runtime elke Groq-model-id. Gebruik de exacte id die Groq toont en zet er `groq/` voor. De statische catalogus dekt de veelvoorkomende gevallen; id's die niet in de catalogus staan, vallen terug op de standaard OpenAI-compatibele sjabloon.

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
  <Card title="Modelproviders" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Denkmodi" href="/nl/tools/thinking" icon="brain">
    Niveaus voor redeneerinspanning en interactie met providerbeleid.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig configuratieschema, inclusief provider- en audio-instellingen.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq-dashboard, API-documentatie en prijzen.
  </Card>
</CardGroup>
