---
read_when:
    - Je wilt Vercel AI Gateway met OpenClaw gebruiken
    - Je hebt de omgevingsvariabele voor de API-sleutel of de CLI-authenticatiekeuze nodig
summary: Vercel AI Gateway instellen (auth + modelselectie)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-29T23:14:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3bbe498a04c2073020fcfbbe68cb506eca4c52c3274e4eca6ab7e6893fcfa56
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

De [Vercel AI Gateway](https://vercel.com/ai-gateway) biedt een uniforme API om
toegang te krijgen tot honderden modellen via één enkel eindpunt.

| Eigenschap     | Waarde                         |
| -------------- | ------------------------------ |
| Provider       | `vercel-ai-gateway`            |
| Auth           | `AI_GATEWAY_API_KEY`           |
| API            | compatibel met Anthropic Messages |
| Modelcatalogus | automatisch ontdekt via `/v1/models` |

<Tip>
OpenClaw ontdekt automatisch de Gateway-catalogus `/v1/models`, zodat
`/models vercel-ai-gateway` actuele modelverwijzingen bevat, zoals
`vercel-ai-gateway/openai/gpt-5.5` en
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Aan de slag

<Steps>
  <Step title="De API-sleutel instellen">
    Voer onboarding uit en kies de AI Gateway-authoptie:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Een standaardmodel instellen">
    Voeg het model toe aan je OpenClaw-configuratie:

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
  <Step title="Controleren of het model beschikbaar is">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Niet-interactief voorbeeld

Voor gescripte of CI-installaties geef je alle waarden door op de opdrachtregel:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Verkorte model-ID

OpenClaw accepteert verkorte Vercel Claude-modelverwijzingen en normaliseert ze tijdens
runtime:

| Verkorte invoer                     | Genormaliseerde modelverwijzing              |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Je kunt de verkorte of de volledig gekwalificeerde modelverwijzing in je
configuratie gebruiken. OpenClaw lost de canonieke vorm automatisch op.
</Tip>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Omgevingsvariabele voor daemonprocessen">
    Als de OpenClaw Gateway als daemon draait (launchd/systemd), zorg er dan voor
    dat `AI_GATEWAY_API_KEY` beschikbaar is voor dat proces.

    <Warning>
    Een sleutel die alleen in `~/.profile` is ingesteld, is niet zichtbaar voor een launchd/systemd-
    daemon tenzij die omgeving expliciet wordt geïmporteerd. Stel de sleutel in
    `~/.openclaw/.env` in of via `env.shellEnv` om ervoor te zorgen dat het Gateway-proces deze kan
    lezen.
    </Warning>

  </Accordion>

  <Accordion title="Providerroutering">
    Vercel AI Gateway routeert aanvragen naar de upstream provider op basis van het prefix van de modelverwijzing. Bijvoorbeeld: `vercel-ai-gateway/anthropic/claude-opus-4.6` routeert
    via Anthropic, terwijl `vercel-ai-gateway/openai/gpt-5.5` via
    OpenAI routeert en `vercel-ai-gateway/moonshotai/kimi-k2.6` via
    MoonshotAI. Je enkele `AI_GATEWAY_API_KEY` verzorgt authenticatie voor alle
    upstream providers.
  </Accordion>
  <Accordion title="Denk­niveaus">
    `/think`-opties volgen vertrouwde upstream modelprefixen wanneer OpenClaw het
    contract van de upstream provider kent. `vercel-ai-gateway/anthropic/...` gebruikt het
    Claude-denkprofiel, inclusief adaptieve standaardwaarden voor Claude 4.6-modellen.
    `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5` en Codex-achtige verwijzingen bieden
    `/think xhigh`, net als de directe OpenAI/OpenAI Codex-providers. Andere
    namespaced verwijzingen behouden de normale redeneerniveaus, tenzij hun catalogusmetadata
    meer declareert.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failover-gedrag kiezen.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Algemene probleemoplossing en veelgestelde vragen.
  </Card>
</CardGroup>
