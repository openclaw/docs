---
read_when:
    - Je wilt Cloudflare AI Gateway gebruiken met OpenClaw
    - Je hebt de account-ID, Gateway-ID of omgevingsvariabele voor de API-sleutel nodig
summary: Cloudflare AI Gateway instellen (authenticatie + modelselectie)
title: Cloudflare AI-gateway
x-i18n:
    generated_at: "2026-06-27T18:10:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05678faa049349c610a9c7ea9d23958bf51927453cf6987fef397cd273f6556b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway staat vóór provider-API's en laat je analytics, caching en besturing toevoegen. Voor Anthropic gebruikt OpenClaw de Anthropic Messages API via je Gateway-eindpunt.

| Eigenschap      | Waarde                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------- |
| Provider        | `cloudflare-ai-gateway`                                                                  |
| Basis-URL       | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Standaardmodel  | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| API-sleutel     | `CLOUDFLARE_AI_GATEWAY_API_KEY` (je provider-API-sleutel voor aanvragen via de Gateway) |

<Note>
Gebruik voor Anthropic-modellen die via Cloudflare AI Gateway worden gerouteerd je **Anthropic API-sleutel** als providersleutel.
</Note>

Wanneer thinking is ingeschakeld voor Anthropic Messages-modellen, verwijdert OpenClaw afsluitende
assistant-prefill-beurten voordat de payload via Cloudflare AI Gateway wordt verzonden.
Anthropic weigert antwoord-prefilling met extended thinking, terwijl gewone
prefill zonder thinking beschikbaar blijft.

## Plugin installeren

Installeer de officiële Plugin en herstart daarna Gateway:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Aan de slag

<Steps>
  <Step title="Set the provider API key and Gateway details">
    Voer onboarding uit en kies de Cloudflare AI Gateway-authoptie:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Dit vraagt om je account-ID, Gateway-ID en API-sleutel.

  </Step>
  <Step title="Set a default model">
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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Niet-interactief voorbeeld

Geef voor scripts of CI-setups alle waarden door op de opdrachtregel:

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
  <Accordion title="Authenticated gateways">
    Als je Gateway-authenticatie in Cloudflare hebt ingeschakeld, voeg dan de header `cf-aig-authorization` toe. Dit komt **boven op** je provider-API-sleutel.

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

  <Accordion title="Environment note">
    Als de Gateway als daemon draait (launchd/systemd), zorg er dan voor dat `CLOUDFLARE_AI_GATEWAY_API_KEY` beschikbaar is voor dat proces.

    <Warning>
    Een sleutel die alleen in een interactieve shell is geëxporteerd, helpt een launchd/systemd-daemon niet, tenzij die omgeving daar ook wordt geïmporteerd. Stel de sleutel in `~/.openclaw/.env` in of via `env.shellEnv` om ervoor te zorgen dat het Gateway-proces deze kan lezen.
    </Warning>

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failover-gedrag kiezen.
  </Card>
  <Card title="Troubleshooting" href="/nl/help/troubleshooting" icon="wrench">
    Algemene probleemoplossing en veelgestelde vragen.
  </Card>
</CardGroup>
