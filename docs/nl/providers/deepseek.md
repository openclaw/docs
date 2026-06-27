---
read_when:
    - Je wilt DeepSeek met OpenClaw gebruiken
    - Je hebt de env-var voor de API-sleutel of de CLI-authenticatiekeuze nodig
summary: DeepSeek-installatie (auth + modelselectie)
title: DeepSeek
x-i18n:
    generated_at: "2026-06-27T18:11:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0446f78e1cb6412034ca18b0db49f2f3a1958e91a013661b3056bf3687fc2d09
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) biedt krachtige AI-modellen met een OpenAI-compatibele API.

| Eigenschap | Waarde                     |
| ---------- | -------------------------- |
| Provider   | `deepseek`                 |
| Auth       | `DEEPSEEK_API_KEY`         |
| API        | OpenAI-compatibel          |
| Basis-URL  | `https://api.deepseek.com` |

## Plugin installeren

Installeer de officiële Plugin en herstart daarna Gateway:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## Aan de slag

<Steps>
  <Step title="Get your API key">
    Maak een API-sleutel aan op [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Dit vraagt om je API-sleutel en stelt `deepseek/deepseek-v4-flash` in als standaardmodel.

  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider deepseek
    ```

    Gebruik het volgende om de statische catalogus van de Plugin te bekijken zonder dat er een draaiende Gateway nodig is:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Non-interactive setup">
    Geef voor gescripte of headless installaties alle vlaggen direct mee:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Als de Gateway als daemon draait (launchd/systemd), zorg er dan voor dat `DEEPSEEK_API_KEY`
beschikbaar is voor dat proces (bijvoorbeeld in `~/.openclaw/.env` of via
`env.shellEnv`).
</Warning>

## Ingebouwde catalogus

| Modelreferentie              | Naam              | Invoer | Context   | Maximale uitvoer | Opmerkingen                                 |
| ---------------------------- | ----------------- | ------ | --------- | ---------------- | ------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text   | 1,000,000 | 384,000          | Standaardmodel; V4-oppervlak met thinking   |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text   | 1,000,000 | 384,000          | V4-oppervlak met thinking                   |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text   | 131,072   | 8,192            | DeepSeek V3.2-oppervlak zonder thinking     |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text   | 131,072   | 65,536           | V3.2-oppervlak met redenering ingeschakeld  |

<Tip>
V4-modellen ondersteunen DeepSeeks `thinking`-besturing. OpenClaw speelt ook
DeepSeek `reasoning_content` opnieuw af bij vervolgronden, zodat thinking-sessies met toolaanroepen
kunnen doorgaan.
Gebruik `/think xhigh` of `/think max` met DeepSeek V4-modellen om DeepSeeks
maximale `reasoning_effort` aan te vragen.
</Tip>

## Thinking en tools

DeepSeek V4-thinking-sessies hebben een strikter replay-contract dan de meeste
OpenAI-compatibele providers: nadat een ronde met thinking ingeschakeld tools gebruikt, verwacht DeepSeek
dat opnieuw afgespeelde assistant-berichten uit die ronde `reasoning_content`
bevatten bij vervolgverzoeken. OpenClaw handelt dit af binnen de
DeepSeek-Plugin, zodat normaal toolgebruik over meerdere ronden werkt met
`deepseek/deepseek-v4-flash` en `deepseek/deepseek-v4-pro`.

Als je een bestaande sessie overschakelt van een andere OpenAI-compatibele provider naar een
DeepSeek V4-model, hebben oudere assistant-ronden met toolaanroepen mogelijk geen native
DeepSeek `reasoning_content`. OpenClaw vult dat ontbrekende veld in bij opnieuw afgespeelde
assistant-berichten voor DeepSeek V4-thinking-verzoeken, zodat de provider
de geschiedenis kan accepteren zonder `/new` te vereisen.

Wanneer thinking is uitgeschakeld in OpenClaw (inclusief de UI-selectie **None**),
verstuurt OpenClaw DeepSeek `thinking: { type: "disabled" }` en verwijdert het opnieuw afgespeelde
`reasoning_content` uit de uitgaande geschiedenis. Zo blijven sessies met uitgeschakeld thinking
op het DeepSeek-pad zonder thinking.

Gebruik `deepseek/deepseek-v4-flash` voor het standaard snelle pad. Gebruik
`deepseek/deepseek-v4-pro` wanneer je het sterkere V4-model wilt en hogere kosten
of latency kunt accepteren.

## Live testen

De directe live-modelsuite bevat DeepSeek V4 in de moderne modellenset. Voer
alleen de directe-modelcontroles voor DeepSeek V4 zo uit:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Die livecontrole verifieert dat beide V4-modellen kunnen voltooien en dat vervolgronden
voor thinking/tools de replay-payload behouden die DeepSeek vereist.

## Configuratievoorbeeld

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Configuration reference" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige configuratiereferentie voor agents, modellen en providers.
  </Card>
</CardGroup>
