---
read_when:
    - Je wilt DeepSeek gebruiken met OpenClaw
    - Je hebt de omgevingsvariabele voor de API-sleutel of de CLI-authenticatiekeuze nodig
summary: DeepSeek instellen (authenticatie + modelselectie)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-29T23:09:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: e84d989a7cba8d259779ac02293718050ce51efe6ce2bdbfacb9e22bbfd294ef
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

## Aan de slag

<Steps>
  <Step title="Get your API key">
    Maak een API-sleutel aan op [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Dit vraagt om je API-sleutel en stelt `deepseek/deepseek-v4-flash` in als het standaardmodel.

  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider deepseek
    ```

    Gebruik het volgende om de gebundelde statische catalogus te inspecteren zonder dat er een actieve Gateway nodig is:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Non-interactive setup">
    Geef voor gescripte of headless installaties alle flags direct mee:

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

| Model-ref                    | Naam              | Invoer | Context   | Max. uitvoer | Opmerkingen                                      |
| ---------------------------- | ----------------- | ------ | --------- | ------------ | ------------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | tekst  | 1,000,000 | 384,000      | Standaardmodel; V4-oppervlak met thinking-mogelijkheid |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | tekst  | 1,000,000 | 384,000      | V4-oppervlak met thinking-mogelijkheid          |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | tekst  | 131,072   | 8,192        | DeepSeek V3.2-oppervlak zonder thinking          |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | tekst  | 131,072   | 65,536       | V3.2-oppervlak met redenering ingeschakeld       |

<Tip>
V4-modellen ondersteunen DeepSeeks `thinking`-besturing. OpenClaw speelt ook
DeepSeek `reasoning_content` opnieuw af bij vervolgrondes, zodat thinking-sessies met tool
calls kunnen doorgaan.
</Tip>

## Thinking en tools

DeepSeek V4-thinking-sessies hebben een strikter replay-contract dan de meeste
OpenAI-compatibele providers: nadat een ronde met thinking ingeschakeld tools gebruikt, verwacht DeepSeek
dat opnieuw afgespeelde assistant-berichten uit die ronde
`reasoning_content` bevatten bij vervolgverzoeken. OpenClaw handelt dit af binnen de
DeepSeek Plugin, zodat normaal toolgebruik over meerdere rondes werkt met
`deepseek/deepseek-v4-flash` en `deepseek/deepseek-v4-pro`.

Als je een bestaande sessie van een andere OpenAI-compatibele provider overschakelt naar een
DeepSeek V4-model, hebben oudere assistant-rondes met tool-calls mogelijk geen native
DeepSeek `reasoning_content`. OpenClaw vult dat ontbrekende veld aan bij opnieuw afgespeelde
assistant-berichten voor DeepSeek V4-thinking-verzoeken, zodat de provider de
geschiedenis kan accepteren zonder dat `/new` nodig is.

Wanneer thinking is uitgeschakeld in OpenClaw (inclusief de UI-selectie **None**),
stuurt OpenClaw DeepSeek `thinking: { type: "disabled" }` en verwijdert het opnieuw afgespeelde
`reasoning_content` uit de uitgaande geschiedenis. Dit houdt sessies met uitgeschakelde thinking
op het DeepSeek-pad zonder thinking.

Gebruik `deepseek/deepseek-v4-flash` voor het standaard snelle pad. Gebruik
`deepseek/deepseek-v4-pro` wanneer je het sterkere V4-model wilt en hogere kosten of latentie
acceptabel zijn.

## Live testen

De directe live-modelsuite bevat DeepSeek V4 in de moderne modelset. Voer alleen
de directe modelcontroles voor DeepSeek V4 als volgt uit:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Die livecontrole verifieert dat beide V4-modellen kunnen voltooien en dat vervolgrondes met thinking/tool
de replay-payload behouden die DeepSeek vereist.

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
    Providers, model-refs en failover-gedrag kiezen.
  </Card>
  <Card title="Configuration reference" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige configuratiereferentie voor agents, modellen en providers.
  </Card>
</CardGroup>
