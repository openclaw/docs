---
read_when:
    - Je wilt Vercel AI Gateway met OpenClaw gebruiken
    - Je hebt de omgevingsvariabele voor de API-sleutel of de CLI-authenticatiekeuze nodig
summary: Vercel AI Gateway-configuratie (authenticatie + modelselectie)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-06-27T18:15:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27aeeeff28661839f3be55c60bf1b383b95af78e17abb77441ae4e81f58688ed
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

De [Vercel AI Gateway](https://vercel.com/ai-gateway) biedt een uniforme API om
honderden modellen via één endpoint te gebruiken.

| Eigenschap    | Waarde                                 |
| ------------- | -------------------------------------- |
| Provider      | `vercel-ai-gateway`                    |
| Pakket        | `@openclaw/vercel-ai-gateway-provider` |
| Authenticatie | `AI_GATEWAY_API_KEY`                   |
| API           | compatibel met Anthropic Messages      |
| Modelcatalogus | automatisch ontdekt via `/v1/models`  |

<Tip>
OpenClaw ontdekt automatisch de Gateway-`/v1/models`-catalogus, zodat
`/models vercel-ai-gateway` huidige modelrefs bevat, zoals
`vercel-ai-gateway/openai/gpt-5.5` en
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Aan de slag

<Steps>
  <Step title="Installeer de plugin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="Stel de API-sleutel in">
    Voer onboarding uit en kies de authenticatieoptie voor AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Stel een standaardmodel in">
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
  <Step title="Controleer of het model beschikbaar is">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Niet-interactief voorbeeld

Geef voor gescripte of CI-configuraties alle waarden door op de opdrachtregel:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Verkorte model-ID

OpenClaw accepteert verkorte Vercel Claude-modelrefs en normaliseert ze tijdens
runtime:

| Verkorte invoer                     | Genormaliseerde modelref                      |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Je kunt in je configuratie de verkorte vorm of de volledig gekwalificeerde
modelref gebruiken. OpenClaw lost de canonieke vorm automatisch op.
</Tip>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Omgevingsvariabele voor daemonprocessen">
    Als de OpenClaw Gateway als daemon draait (launchd/systemd), zorg er dan voor
    dat `AI_GATEWAY_API_KEY` beschikbaar is voor dat proces.

    <Warning>
    Een sleutel die alleen in een interactieve shell is geëxporteerd, is niet
    zichtbaar voor een launchd/systemd-daemon, tenzij die omgeving expliciet is
    geïmporteerd. Stel de sleutel in `~/.openclaw/.env` in of via
    `env.shellEnv` om ervoor te zorgen dat het gatewayproces deze kan lezen.
    </Warning>

  </Accordion>

  <Accordion title="Provider-routering">
    Vercel AI Gateway routeert aanvragen naar de upstream-provider op basis van
    het voorvoegsel van de modelref. `vercel-ai-gateway/anthropic/claude-opus-4.6`
    routeert bijvoorbeeld via Anthropic, terwijl `vercel-ai-gateway/openai/gpt-5.5`
    via OpenAI routeert en `vercel-ai-gateway/moonshotai/kimi-k2.6` via
    MoonshotAI routeert. Je enkele `AI_GATEWAY_API_KEY` verzorgt authenticatie
    voor alle upstream-providers.
  </Accordion>
  <Accordion title="Denk-niveaus">
    `/think`-opties volgen vertrouwde upstream-modelvoorvoegsels wanneer
    OpenClaw het upstream-providercontract kent. `vercel-ai-gateway/anthropic/...`
    gebruikt het Claude-denkprofiel, inclusief adaptieve standaardwaarden voor
    Claude 4.6-modellen. `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5` en
    Codex-achtige refs bieden `/think xhigh`, net als de directe
    OpenAI/OpenAI Codex-providers. Andere refs met een namespace behouden de
    normale reasoning-niveaus, tenzij hun catalogusmetadata meer declareren.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failovergedrag kiezen.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Algemene probleemoplossing en veelgestelde vragen.
  </Card>
</CardGroup>
