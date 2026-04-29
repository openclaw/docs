---
read_when:
    - Je wilt Cloudflare AI Gateway met OpenClaw gebruiken
    - Je hebt de account-ID, de Gateway-ID of de omgevingsvariabele voor de API-sleutel nodig
summary: Cloudflare AI Gateway instellen (authenticatie + modelselectie)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-29T23:09:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c567076a5b3fea0f09f44d772c0858aed2a4813f91f1cc9f87b0da39c2e5db
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway staat voor provider-API's en laat je analytics, caching en besturingselementen toevoegen. Voor Anthropic gebruikt OpenClaw de Anthropic Messages API via je Gateway-eindpunt.

| Eigenschap       | Waarde                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------- |
| Provider         | `cloudflare-ai-gateway`                                                                  |
| Basis-URL        | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Standaardmodel   | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| API-sleutel      | `CLOUDFLARE_AI_GATEWAY_API_KEY` (je provider-API-sleutel voor aanvragen via de Gateway) |

<Note>
Gebruik voor Anthropic-modellen die via Cloudflare AI Gateway worden gerouteerd je **Anthropic API-sleutel** als provider-sleutel.
</Note>

Wanneer denken is ingeschakeld voor Anthropic Messages-modellen, verwijdert OpenClaw afsluitende
assistant-prefill-beurten voordat de payload via Cloudflare AI Gateway wordt verzonden.
Anthropic weigert antwoord-prefilling met uitgebreid denken, terwijl gewone
prefill zonder denken beschikbaar blijft.

## Aan de slag

<Steps>
  <Step title="Stel de provider-API-sleutel en Gateway-gegevens in">
    Voer onboarding uit en kies de authenticatieoptie voor Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Dit vraagt om je account-ID, gateway-ID en API-sleutel.

  </Step>
  <Step title="Stel een standaardmodel in">
    Voeg het model toe aan je OpenClaw-configuratie:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Controleer of het model beschikbaar is">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Niet-interactief voorbeeld

Geef voor gescripte of CI-configuraties alle waarden door via de opdrachtregel:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Geauthenticeerde gateways">
    Als je Gateway-authenticatie in Cloudflare hebt ingeschakeld, voeg dan de header `cf-aig-authorization` toe. Dit komt **naast** je provider-API-sleutel.

    ```json5
    {
      models: {
        providers: {
          "cloudflare-ai-gateway": {
            headers: {
              "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
            },
          },
        },
      },
    }
    ```

    <Tip>
    De header `cf-aig-authorization` authenticeert bij de Cloudflare Gateway zelf, terwijl de provider-API-sleutel (bijvoorbeeld je Anthropic-sleutel) authenticeert bij de upstream-provider.
    </Tip>

  </Accordion>

  <Accordion title="Omgevingsnotitie">
    Als de Gateway als daemon draait (launchd/systemd), zorg er dan voor dat `CLOUDFLARE_AI_GATEWAY_API_KEY` beschikbaar is voor dat proces.

    <Warning>
    Een sleutel die alleen in `~/.profile` staat, helpt een launchd/systemd-daemon niet, tenzij die omgeving daar ook wordt geïmporteerd. Stel de sleutel in `~/.openclaw/.env` in of via `env.shellEnv` om te zorgen dat het gatewayproces deze kan lezen.
    </Warning>

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failover-gedrag kiezen.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Algemene probleemoplossing en veelgestelde vragen.
  </Card>
</CardGroup>
