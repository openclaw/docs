---
read_when:
    - Je wilt Groq gebruiken met OpenClaw
    - Je hebt de omgevingsvariabele voor de API-sleutel of de CLI-authenticatiekeuze nodig
    - Je configureert Whisper-audiotranscriptie op Groq
summary: Groq instellen (authenticatie + modelselectie + Whisper-transcriptie)
title: Groq
x-i18n:
    generated_at: "2026-05-06T09:29:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ce6d702eb1e0abba0cf1efd3e86c766444f5e7cbf26c312b94a74fa410b700
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) biedt ultrasnelle inferentie op open-weight modellen (Llama, Gemma, Kimi, Qwen, GPT OSS en meer) met aangepaste LPU-hardware. OpenClaw bevat een gebundelde Groq-Plugin die zowel een OpenAI-compatibele chatprovider als een provider voor mediabegrip van audio registreert.

| Eigenschap                 | Waarde                                   |
| -------------------------- | ---------------------------------------- |
| Provider-id                | `groq`                                   |
| Plugin                     | gebundeld, `enabledByDefault: true`      |
| Auth-env-var               | `GROQ_API_KEY`                           |
| Onboarding-vlag            | `--auth-choice groq-api-key`             |
| API                        | OpenAI-compatibel (`openai-completions`) |
| Basis-URL                  | `https://api.groq.com/openai/v1`         |
| Audiotranscriptie          | `whisper-large-v3-turbo` (standaard)     |
| Voorgestelde chatstandaard | `groq/llama-3.3-70b-versatile`           |

## Aan de slag

<Steps>
  <Step title="Een API-sleutel ophalen">
    Maak een API-sleutel aan op [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="De API-sleutel instellen">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice groq-api-key
```

```bash Alleen env
export GROQ_API_KEY=gsk_...
```

    </CodeGroup>

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

OpenClaw wordt geleverd met een manifestondersteunde Groq-catalogus met zowel redenerende als niet-redenerende vermeldingen. Voer `openclaw models list --provider groq` uit om de gebundelde rijen voor je geïnstalleerde versie te bekijken, of raadpleeg [console.groq.com/docs/models](https://console.groq.com/docs/models) voor Groq's gezaghebbende lijst.

| Modelreferentie                                      | Naam                          | Redeneren | Invoer       | Context |
| ---------------------------------------------------- | ----------------------------- | --------- | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                       | Llama 3.3 70B Versatile       | nee       | tekst        | 131,072 |
| `groq/llama-3.1-8b-instant`                          | Llama 3.1 8B Instant          | nee       | tekst        | 131,072 |
| `groq/meta-llama/llama-4-maverick-17b-128e-instruct` | Llama 4 Maverick 17B          | nee       | tekst + afbeelding | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct`     | Llama 4 Scout 17B             | nee       | tekst + afbeelding | 131,072 |
| `groq/llama3-70b-8192`                               | Llama 3 70B                   | nee       | tekst        | 8,192   |
| `groq/llama3-8b-8192`                                | Llama 3 8B                    | nee       | tekst        | 8,192   |
| `groq/gemma2-9b-it`                                  | Gemma 2 9B                    | nee       | tekst        | 8,192   |
| `groq/mistral-saba-24b`                              | Mistral Saba 24B              | nee       | tekst        | 32,768  |
| `groq/moonshotai/kimi-k2-instruct`                   | Kimi K2 Instruct              | nee       | tekst        | 131,072 |
| `groq/moonshotai/kimi-k2-instruct-0905`              | Kimi K2 Instruct 0905         | nee       | tekst        | 262,144 |
| `groq/openai/gpt-oss-120b`                           | GPT OSS 120B                  | ja        | tekst        | 131,072 |
| `groq/openai/gpt-oss-20b`                            | GPT OSS 20B                   | ja        | tekst        | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`                  | Safety GPT OSS 20B            | ja        | tekst        | 131,072 |
| `groq/qwen-qwq-32b`                                  | Qwen QwQ 32B                  | ja        | tekst        | 131,072 |
| `groq/qwen/qwen3-32b`                                | Qwen3 32B                     | ja        | tekst        | 131,072 |
| `groq/deepseek-r1-distill-llama-70b`                 | DeepSeek R1 Distill Llama 70B | ja        | tekst        | 131,072 |
| `groq/groq/compound`                                 | Compound                      | ja        | tekst        | 131,072 |
| `groq/groq/compound-mini`                            | Compound Mini                 | ja        | tekst        | 131,072 |

<Tip>
  De catalogus ontwikkelt zich met elke OpenClaw-release. `openclaw models list --provider groq` toont de rijen die bekend zijn bij je geïnstalleerde versie; controleer dit met [console.groq.com/docs/models](https://console.groq.com/docs/models) voor nieuw toegevoegde of verouderde modellen.
</Tip>

## Redeneringsmodellen

OpenClaw koppelt zijn gedeelde `/think`-niveaus aan Groq's modelspecifieke `reasoning_effort`-waarden:

- Voor `qwen/qwen3-32b` verzendt uitgeschakeld denken `none` en ingeschakeld denken `default`.
- Voor Groq GPT OSS-redeneringsmodellen (`openai/gpt-oss-*`) verzendt OpenClaw `low`, `medium` of `high` op basis van het `/think`-niveau. Uitgeschakeld denken laat `reasoning_effort` weg, omdat die modellen geen uitgeschakelde waarde ondersteunen.
- DeepSeek R1 Distill, Qwen QwQ en Compound gebruiken Groq's native redeneeroppervlak; `/think` regelt de zichtbaarheid, maar het model redeneert altijd.

Zie [Denkmodi](/nl/tools/thinking) voor de gedeelde `/think`-niveaus en hoe OpenClaw deze per provider vertaalt.

## Audiotranscriptie

Groq's gebundelde Plugin registreert ook een **provider voor mediabegrip van audio**, zodat spraakberichten kunnen worden getranscribeerd via het gedeelde `tools.media.audio`-oppervlak.

| Eigenschap                | Waarde                                    |
| ------------------------- | ----------------------------------------- |
| Gedeeld configuratiepad   | `tools.media.audio`                       |
| Standaard basis-URL       | `https://api.groq.com/openai/v1`          |
| Standaardmodel            | `whisper-large-v3-turbo`                  |
| Automatische prioriteit   | 20                                        |
| API-eindpunt              | OpenAI-compatibel `/audio/transcriptions` |

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
  <Accordion title="Omgevingsbeschikbaarheid voor de daemon">
    Als de Gateway als beheerde service draait (launchd, systemd, Docker), moet `GROQ_API_KEY` zichtbaar zijn voor dat proces, niet alleen voor je interactieve shell.

    <Warning>
      Een sleutel die alleen in `~/.profile` staat, helpt een launchd- of systemd-daemon niet, tenzij die omgeving daar ook wordt geïmporteerd. Stel de sleutel in `~/.openclaw/.env` of via `env.shellEnv` in om deze leesbaar te maken vanuit het gatewayproces.
    </Warning>

  </Accordion>

  <Accordion title="Aangepaste Groq-model-id's">
    OpenClaw accepteert elke Groq-model-id tijdens runtime. Gebruik de exacte id die Groq toont en voeg er `groq/` als prefix aan toe. De gebundelde catalogus dekt de gangbare gevallen; niet-gecatalogiseerde id's vallen terug op de standaard OpenAI-compatibele template.

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
    Volledig configuratieschema inclusief provider- en audio-instellingen.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq-dashboard, API-documentatie en prijzen.
  </Card>
</CardGroup>
