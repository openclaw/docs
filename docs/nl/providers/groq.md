---
read_when:
    - Je wilt Groq met OpenClaw gebruiken
    - Je hebt de omgevingsvariabele voor de API-sleutel of de CLI-authenticatiekeuze nodig
summary: Groq instellen (authenticatie + modelselectie)
title: Groq
x-i18n:
    generated_at: "2026-05-02T11:25:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf6678047581a438906420894b250bafb68d71254fbaf30ea5dfcfc4799eac7
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) biedt ultrasnelle inferentie op opensourcemodellen
(Llama, Gemma, Mistral en meer) met aangepaste LPU-hardware. OpenClaw maakt
verbinding met Groq via de OpenAI-compatibele API.

| Eigenschap | Waarde            |
| ---------- | ----------------- |
| Provider   | `groq`            |
| Auth       | `GROQ_API_KEY`    |
| API        | OpenAI-compatibel |

## Aan de slag

<Steps>
  <Step title="Get an API key">
    Maak een API-sleutel aan op [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Set the API key">
    ```bash
    export GROQ_API_KEY="gsk_..."
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

OpenClaw wordt geleverd met een door een manifest ondersteunde Groq-catalogus
voor snelle, op provider gefilterde modelvermeldingen. Voer `openclaw models list --all --provider groq` uit om de meegeleverde
rijen te zien, of raadpleeg
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Model                       | Opmerkingen                        |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Algemeen inzetbaar, grote context  |
| **Llama 3.1 8B Instant**    | Snel, lichtgewicht                 |
| **Gemma 2 9B**              | Compact, efficiënt                 |
| **Mixtral 8x7B**            | MoE-architectuur, sterk redeneren  |

<Tip>
Gebruik `openclaw models list --all --provider groq` voor de door een manifest ondersteunde Groq-rijen
die bij deze OpenClaw-versie bekend zijn.
</Tip>

## Redeneermodellen

OpenClaw koppelt de gedeelde `/think`-niveaus aan Groq's modelspecifieke
`reasoning_effort`-waarden. Voor `qwen/qwen3-32b` verzendt uitgeschakeld denken
`none` en verzendt ingeschakeld denken `default`. Voor Groq GPT-OSS-redeneermodellen
verzendt OpenClaw `low`, `medium` of `high`; bij uitgeschakeld denken wordt
`reasoning_effort` weggelaten omdat deze modellen geen uitgeschakelde waarde ondersteunen.

## Audiotranscriptie

Groq biedt ook snelle op Whisper gebaseerde audiotranscriptie. Wanneer Groq is geconfigureerd als
provider voor media-inzicht, gebruikt OpenClaw Groq's `whisper-large-v3-turbo`-
model om spraakberichten te transcriberen via het gedeelde `tools.media.audio`-
oppervlak.

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
  <Accordion title="Audio transcription details">
    | Eigenschap | Waarde |
    |----------|-------|
    | Gedeeld configuratiepad | `tools.media.audio` |
    | Standaard basis-URL | `https://api.groq.com/openai/v1` |
    | Standaardmodel | `whisper-large-v3-turbo` |
    | API-eindpunt | OpenAI-compatibel `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Environment note">
    Als de Gateway als daemon draait (launchd/systemd), zorg er dan voor dat `GROQ_API_KEY`
    beschikbaar is voor dat proces (bijvoorbeeld in `~/.openclaw/.env` of via
    `env.shellEnv`).

    <Warning>
    Sleutels die alleen in je interactieve shell zijn ingesteld, zijn niet zichtbaar voor door daemons beheerde
    gateway-processen. Gebruik `~/.openclaw/.env` of `env.shellEnv`-configuratie voor
    blijvende beschikbaarheid.
    </Warning>

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failover-gedrag kiezen.
  </Card>
  <Card title="Configuration reference" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig configuratieschema inclusief provider- en audio-instellingen.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq-dashboard, API-documentatie en prijzen.
  </Card>
  <Card title="Groq model list" href="https://console.groq.com/docs/models" icon="list">
    Officiële Groq-modelcatalogus.
  </Card>
</CardGroup>
