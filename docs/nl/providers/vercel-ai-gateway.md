---
read_when:
    - Je wilt Vercel AI Gateway gebruiken met OpenClaw
    - Je hebt de omgevingsvariabele voor de API-sleutel of de CLI-authenticatiekeuze nodig
summary: Vercel AI Gateway instellen (authenticatie + modelselectie)
title: Vercel AI-gateway
x-i18n:
    generated_at: "2026-07-12T09:15:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

De [Vercel AI Gateway](https://vercel.com/ai-gateway) biedt één uniforme API voor
toegang tot honderden modellen via één endpoint.

| Eigenschap      | Waarde                                 |
| --------------- | -------------------------------------- |
| Provider        | `vercel-ai-gateway`                    |
| Pakket          | `@openclaw/vercel-ai-gateway-provider` |
| Authenticatie   | `AI_GATEWAY_API_KEY`                   |
| API             | Compatibel met Anthropic Messages      |
| Basis-URL       | `https://ai-gateway.vercel.sh`         |
| Modelcatalogus  | Automatisch gevonden via `/v1/models`  |

<Tip>
OpenClaw vindt de Gateway-catalogus `/v1/models` automatisch, zodat zowel de
chatopdracht `/models vercel-ai-gateway` als
`openclaw models list --provider vercel-ai-gateway` actuele modelverwijzingen
bevatten, zoals `vercel-ai-gateway/openai/gpt-5.5` en
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Aan de slag

<Steps>
  <Step title="Installeer de Plugin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="Stel de API-sleutel in">
    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```
  </Step>
  <Step title="Stel een standaardmodel in">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```
  </Step>
  <Step title="Controleer of het model beschikbaar is">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Niet-interactief voorbeeld

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Verkorte model-ID

OpenClaw normaliseert verkorte Claude-modelverwijzingen tijdens runtime:

| Verkorte invoer                     | Genormaliseerde modelverwijzing               |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Gebruik een van beide vormen in uw configuratie; OpenClaw zet deze automatisch
om naar de canonieke verwijzing `anthropic/...`.
</Tip>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Omgevingsvariabele voor daemonprocessen">
    Als de OpenClaw Gateway als daemon wordt uitgevoerd (launchd/systemd), zorg
    er dan voor dat `AI_GATEWAY_API_KEY` beschikbaar is voor dat proces.

    <Warning>
    Een sleutel die alleen in een interactieve shell is geëxporteerd, is niet
    zichtbaar voor een launchd/systemd-daemon, tenzij die omgeving expliciet
    wordt geïmporteerd. Stel de sleutel in `~/.openclaw/.env` of via
    `env.shellEnv` in om ervoor te zorgen dat het Gateway-proces deze kan lezen.
    </Warning>

  </Accordion>

  <Accordion title="Providerroutering">
    Vercel AI Gateway routeert elke aanvraag naar de upstreamprovider die in het
    voorvoegsel van de modelverwijzing wordt genoemd. Zo wordt
    `vercel-ai-gateway/anthropic/claude-opus-4.6` via Anthropic gerouteerd,
    `vercel-ai-gateway/openai/gpt-5.5` via OpenAI en
    `vercel-ai-gateway/moonshotai/kimi-k2.6` via MoonshotAI. Eén
    `AI_GATEWAY_API_KEY` authenticeert alle upstreamproviders.
  </Accordion>
  <Accordion title="Denkniveaus">
    De opties van `/think` volgen het voorvoegsel van het upstreammodel wanneer
    OpenClaw dit herkent. `vercel-ai-gateway/anthropic/...` gebruikt het
    Claude-denkprofiel, inclusief de adaptieve standaardinstelling voor
    Claude 4.6-modellen. Vertrouwde verwijzingen met
    `vercel-ai-gateway/openai/...` (`gpt-5.2` en nieuwer, plus Codex-varianten
    tot en met `gpt-5.1-codex`) bieden `/think xhigh`. Andere verwijzingen met
    een naamruimte behouden de standaard redeneerniveaus, tenzij hun
    catalogusmetadata meer niveaus vermeldt.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
  <Card title="Problemen oplossen" href="/nl/help/troubleshooting" icon="wrench">
    Algemene probleemoplossing en veelgestelde vragen.
  </Card>
</CardGroup>
