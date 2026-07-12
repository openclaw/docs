---
read_when:
    - U wilt Cloudflare AI Gateway gebruiken met OpenClaw
    - U hebt de account-ID, Gateway-ID of omgevingsvariabele voor de API-sleutel nodig
summary: Cloudflare AI Gateway instellen (authenticatie + modelselectie)
title: Cloudflare AI-gateway
x-i18n:
    generated_at: "2026-07-12T09:18:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) bevindt zich vóór de API's van providers en voegt analyses, caching en beheerfuncties toe. Voor Anthropic gebruikt OpenClaw de Anthropic Messages API via uw Gateway-eindpunt.

| Eigenschap    | Waarde                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------- |
| Provider      | `cloudflare-ai-gateway`                                                                             |
| Plugin        | officieel extern pakket (`@openclaw/cloudflare-ai-gateway-provider`)                                |
| Basis-URL     | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`                          |
| Standaardmodel | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                          |
| API-sleutel   | `CLOUDFLARE_AI_GATEWAY_API_KEY` (uw provider-API-sleutel voor aanvragen via de Gateway)             |

<Note>
Gebruik voor Anthropic-modellen die via Cloudflare AI Gateway worden gerouteerd uw **Anthropic-API-sleutel** als providersleutel.
</Note>

Wanneer denkfunctionaliteit is ingeschakeld voor Anthropic Messages-modellen, verwijdert OpenClaw afsluitende vooraf ingevulde assistentbeurten voordat de payload via Cloudflare AI Gateway wordt verzonden. Anthropic weigert het vooraf invullen van antwoorden wanneer uitgebreid denken is ingeschakeld, terwijl normaal vooraf invullen zonder denkfunctionaliteit beschikbaar blijft.

## Plugin installeren

Installeer de officiële Plugin en start daarna Gateway opnieuw:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Aan de slag

<Steps>
  <Step title="De provider-API-sleutel en Gateway-gegevens instellen">
    Voer de onboarding uit en kies de verificatieoptie voor Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    U wordt gevraagd om uw account-ID, Gateway-ID en API-sleutel.

  </Step>
  <Step title="Een standaardmodel instellen">
    Voeg het model toe aan uw OpenClaw-configuratie:

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
  <Step title="Controleren of het model beschikbaar is">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Niet-interactief voorbeeld

Geef voor gescripte configuraties of CI-configuraties alle waarden op via de opdrachtregel:

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
  <Accordion title="Geverifieerde Gateways">
    Als u Gateway-verificatie in Cloudflare hebt ingeschakeld, voegt u de header `cf-aig-authorization` toe. Dit komt **naast** uw provider-API-sleutel.

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
    De header `cf-aig-authorization` verifieert bij de Cloudflare Gateway zelf, terwijl de provider-API-sleutel (bijvoorbeeld uw Anthropic-sleutel) verifieert bij de bovenliggende provider.
    </Tip>

  </Accordion>

  <Accordion title="Opmerking over de omgeving">
    Als Gateway als daemon wordt uitgevoerd (launchd/systemd), moet `CLOUDFLARE_AI_GATEWAY_API_KEY` beschikbaar zijn voor dat proces.

    <Warning>
    Een sleutel die alleen in een interactieve shell is geëxporteerd, is niet beschikbaar voor een launchd/systemd-daemon, tenzij die omgeving daar ook wordt geïmporteerd. Stel de sleutel in `~/.openclaw/.env` of via `env.shellEnv` in om ervoor te zorgen dat het Gateway-proces deze kan lezen.
    </Warning>

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Algemene probleemoplossing en veelgestelde vragen.
  </Card>
</CardGroup>
