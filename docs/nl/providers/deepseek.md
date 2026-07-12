---
read_when:
    - Je wilt DeepSeek met OpenClaw gebruiken
    - U hebt de omgevingsvariabele voor de API-sleutel of de CLI-authenticatiekeuze nodig
summary: DeepSeek-installatie (authenticatie + modelselectie)
title: DeepSeek
x-i18n:
    generated_at: "2026-07-12T09:13:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77e074756d593205d7d05f499da93b9bd3c63acdce7092b42fb5562023577925
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) biedt krachtige AI-modellen met een OpenAI-compatibele API.

| Eigenschap | Waarde                     |
| ---------- | -------------------------- |
| Provider   | `deepseek`                 |
| Authenticatie | `DEEPSEEK_API_KEY`      |
| API        | OpenAI-compatibel          |
| Basis-URL  | `https://api.deepseek.com` |

## Plugin installeren

Installeer de officiële Plugin en start daarna de Gateway opnieuw:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## Aan de slag

<Steps>
  <Step title="Uw API-sleutel verkrijgen">
    Maak een API-sleutel aan op [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Onboarding uitvoeren">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Vraagt om uw API-sleutel en stelt `deepseek/deepseek-v4-flash` in als standaardmodel.

  </Step>
  <Step title="Controleren of modellen beschikbaar zijn">
    ```bash
    openclaw models list --provider deepseek
    ```

    Zo inspecteert u de statische catalogus van de Plugin zonder een actieve Gateway:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Niet-interactieve configuratie">
    Geef voor gescripte of headless-installaties alle vlaggen rechtstreeks door:

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
Als de Gateway als daemon (launchd/systemd) wordt uitgevoerd, zorg er dan voor dat
`DEEPSEEK_API_KEY` beschikbaar is voor dat proces (bijvoorbeeld in
`~/.openclaw/.env` of via `env.shellEnv`).
</Warning>

## Ingebouwde catalogus

| Modelreferentie              | Naam              | Invoer | Context   | Maximale uitvoer | Opmerkingen                                                  |
| ---------------------------- | ----------------- | ------ | --------- | ---------------- | ------------------------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | tekst  | 1,000,000 | 384,000          | Standaardmodel; V4-interface met denkfunctionaliteit          |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | tekst  | 1,000,000 | 384,000          | V4-interface met denkfunctionaliteit                         |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | tekst  | 1,000,000 | 384,000          | Verouderde compatibiliteitsnaam voor V4 Flash zonder denken   |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | tekst  | 1,000,000 | 384,000          | Verouderde compatibiliteitsnaam voor V4 Flash met denken      |

<Warning>
DeepSeek beëindigt `deepseek-chat` en `deepseek-reasoner` op 24 juli 2026
om 15:59 UTC. Deze verwijzen momenteel respectievelijk naar DeepSeek V4 Flash
in de modus zonder denken en de denkmodus. Wijzig geconfigureerde modelreferenties
vóór de uiterste datum naar `deepseek/deepseek-v4-flash` of
`deepseek/deepseek-v4-pro`.
</Warning>

De lokale kostenschattingen van OpenClaw volgen de door DeepSeek gepubliceerde
tarieven voor cachetreffers, cachemissers en uitvoer. DeepSeek kan deze tarieven
wijzigen; de pagina [Modellen en prijzen](https://api-docs.deepseek.com/quick_start/pricing/)
is bepalend voor de facturering.

<Tip>
V4-modellen ondersteunen de `thinking`-besturing van DeepSeek. OpenClaw speelt
DeepSeek-`reasoning_content` ook opnieuw af tijdens vervolgbeurten, zodat
denksessies met toolaanroepen kunnen doorgaan.
Gebruik `/think xhigh` of `/think max` met DeepSeek V4-modellen om de maximale
`reasoning_effort` van DeepSeek aan te vragen; beide worden toegewezen aan `"max"`.
</Tip>

## Denken en tools

DeepSeek V4-denksessies vereisen dat opnieuw afgespeelde assistentberichten uit
een beurt waarin denken is ingeschakeld, bij vervolgverzoeken `reasoning_content`
bevatten. De DeepSeek-Plugin van OpenClaw vult dat veld automatisch aan, zodat
normaal toolgebruik over meerdere beurten werkt met `deepseek/deepseek-v4-flash`
en `deepseek/deepseek-v4-pro`, zelfs wanneer de geschiedenis afkomstig is van
een andere OpenAI-compatibele provider (zonder systeemeigen `reasoning_content`)
of van een gewoon assistentbericht. Na het wisselen van provider tijdens een
sessie is geen `/new` vereist.

Wanneer denken is uitgeschakeld (waaronder de UI-selectie **None**), verzendt
OpenClaw `thinking: { type: "disabled" }` en verwijdert het opnieuw afgespeelde
`reasoning_content` uit de uitgaande geschiedenis, zodat de sessie het
DeepSeek-pad zonder denken blijft volgen.

Gebruik `deepseek/deepseek-v4-flash` voor het standaard snelle pad. Gebruik
`deepseek/deepseek-v4-pro` voor het krachtigere model wanneer u hogere kosten
of latentie kunt accepteren.

## Live testen

Voer de volgende opdracht uit om alleen de rechtstreekse DeepSeek V4-modelcontroles
uit de moderne live-modeltestsuite uit te voeren:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Controleert of beide V4-modellen worden voltooid en of vervolgbeurten met
denken/tools de door DeepSeek vereiste herhalingspayload behouden.

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
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige configuratiereferentie voor agents, modellen en providers.
  </Card>
</CardGroup>
