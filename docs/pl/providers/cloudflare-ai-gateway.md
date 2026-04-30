---
read_when:
    - Chcesz używać Cloudflare AI Gateway z OpenClaw
    - Potrzebujesz identyfikatora konta, identyfikatora Gateway lub zmiennej środowiskowej klucza API
summary: Konfiguracja Cloudflare AI Gateway (uwierzytelnianie + wybór modelu)
title: Gateway AI Cloudflare
x-i18n:
    generated_at: "2026-04-30T10:12:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c567076a5b3fea0f09f44d772c0858aed2a4813f91f1cc9f87b0da39c2e5db
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway znajduje się przed interfejsami API dostawców i pozwala dodać analitykę, buforowanie oraz mechanizmy kontroli. W przypadku Anthropic OpenClaw używa Anthropic Messages API przez punkt końcowy Gateway.

| Właściwość       | Wartość                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------- |
| Dostawca         | `cloudflare-ai-gateway`                                                                  |
| Bazowy URL       | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Model domyślny   | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| Klucz API        | `CLOUDFLARE_AI_GATEWAY_API_KEY` (klucz API dostawcy dla żądań przez Gateway) |

<Note>
W przypadku modeli Anthropic kierowanych przez Cloudflare AI Gateway użyj swojego **klucza API Anthropic** jako klucza dostawcy.
</Note>

Gdy myślenie jest włączone dla modeli Anthropic Messages, OpenClaw usuwa końcowe
tury wstępnego wypełniania asystenta przed wysłaniem ładunku przez Cloudflare AI Gateway.
Anthropic odrzuca wstępne wypełnianie odpowiedzi z rozszerzonym myśleniem, natomiast zwykłe
wstępne wypełnianie bez myślenia pozostaje dostępne.

## Pierwsze kroki

<Steps>
  <Step title="Set the provider API key and Gateway details">
    Uruchom onboarding i wybierz opcję uwierzytelniania Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Zostaniesz poproszony o identyfikator konta, identyfikator gateway i klucz API.

  </Step>
  <Step title="Set a default model">
    Dodaj model do konfiguracji OpenClaw:

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

## Przykład nieinteraktywny

W konfiguracjach skryptowych lub CI przekaż wszystkie wartości w wierszu poleceń:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Authenticated gateways">
    Jeśli włączono uwierzytelnianie Gateway w Cloudflare, dodaj nagłówek `cf-aig-authorization`. Jest to **dodatkowe względem** klucza API dostawcy.

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
    Nagłówek `cf-aig-authorization` uwierzytelnia w samym Cloudflare Gateway, natomiast klucz API dostawcy (na przykład klucz Anthropic) uwierzytelnia u dostawcy nadrzędnego.
    </Tip>

  </Accordion>

  <Accordion title="Environment note">
    Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że `CLOUDFLARE_AI_GATEWAY_API_KEY` jest dostępny dla tego procesu.

    <Warning>
    Klucz znajdujący się tylko w `~/.profile` nie pomoże demonowi launchd/systemd, chyba że to środowisko również zostanie tam zaimportowane. Ustaw klucz w `~/.openclaw/.env` lub przez `env.shellEnv`, aby zapewnić procesowi gateway możliwość jego odczytu.
    </Warning>

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Troubleshooting" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i FAQ.
  </Card>
</CardGroup>
