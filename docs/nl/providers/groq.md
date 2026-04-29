---
read_when:
    - Je wilt Groq gebruiken met OpenClaw
    - Je hebt de omgevingsvariabele voor de API-sleutel of de keuze voor CLI-authenticatie nodig
summary: Groq instellen (authenticatie + modelselectie)
title: Groq
x-i18n:
    generated_at: "2026-04-29T23:10:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed612471939e7ac5362f8236f179d38ae07f9076709ff55020c1790f7c56a6fa
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) biedt ultrasnelle inferentie op opensourcemodellen
(Llama, Gemma, Mistral en meer) met aangepaste LPU-hardware. OpenClaw maakt
verbinding met Groq via de OpenAI-compatibele API.

| Eigenschap | Waarde            |
| ---------- | ----------------- |
| Provider   | `groq`            |
| Authenticatie | `GROQ_API_KEY` |
| API        | OpenAI-compatibel |

## Aan de slag

<Steps>
  <Step title="Vraag een API-sleutel aan">
    Maak een API-sleutel aan op [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Stel de API-sleutel in">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Stel een standaardmodel in">
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

De modelcatalogus van Groq verandert regelmatig. Voer `openclaw models list | grep groq`
uit om de momenteel beschikbare modellen te zien, of raadpleeg
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Model                       | Opmerkingen                        |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Algemeen inzetbaar, grote context  |
| **Llama 3.1 8B Instant**    | Snel, lichtgewicht                 |
| **Gemma 2 9B**              | Compact, efficiënt                 |
| **Mixtral 8x7B**            | MoE-architectuur, sterk redeneren  |

<Tip>
Gebruik `openclaw models list --provider groq` voor de meest actuele lijst met
modellen die beschikbaar zijn voor je account.
</Tip>

## Redeneermodellen

OpenClaw koppelt de gedeelde `/think`-niveaus aan Groq's modelspecifieke
`reasoning_effort`-waarden. Voor `qwen/qwen3-32b` stuurt uitgeschakeld denken
`none` en ingeschakeld denken `default`. Voor Groq GPT-OSS-redeneermodellen
stuurt OpenClaw `low`, `medium` of `high`; bij uitgeschakeld denken wordt
`reasoning_effort` weggelaten omdat die modellen geen uitgeschakelde waarde ondersteunen.

## Audiotranscriptie

Groq biedt ook snelle Whisper-gebaseerde audiotranscriptie. Wanneer Groq is
geconfigureerd als provider voor mediabegrip, gebruikt OpenClaw Groq's
`whisper-large-v3-turbo`-model om spraakberichten te transcriberen via het
gedeelde `tools.media.audio`-oppervlak.

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
  <Accordion title="Details van audiotranscriptie">
    | Eigenschap | Waarde |
    |----------|-------|
    | Gedeeld configuratiepad | `tools.media.audio` |
    | Standaard basis-URL | `https://api.groq.com/openai/v1` |
    | Standaardmodel | `whisper-large-v3-turbo` |
    | API-eindpunt | OpenAI-compatibel `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Opmerking over omgeving">
    Als de Gateway als daemon draait (launchd/systemd), zorg er dan voor dat `GROQ_API_KEY`
    beschikbaar is voor dat proces (bijvoorbeeld in `~/.openclaw/.env` of via
    `env.shellEnv`).

    <Warning>
    Sleutels die alleen in je interactieve shell zijn ingesteld, zijn niet zichtbaar voor
    gatewayprocessen die door een daemon worden beheerd. Gebruik configuratie via
    `~/.openclaw/.env` of `env.shellEnv` voor blijvende beschikbaarheid.
    </Warning>

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig configuratieschema inclusief provider- en audio-instellingen.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq-dashboard, API-documentatie en prijzen.
  </Card>
  <Card title="Groq-modellenlijst" href="https://console.groq.com/docs/models" icon="list">
    Officiële Groq-modelcatalogus.
  </Card>
</CardGroup>
