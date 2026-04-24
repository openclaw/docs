---
read_when:
    - Chcesz używać Cloudflare AI Gateway z OpenClaw
    - Potrzebujesz identyfikatora konta, identyfikatora gateway lub zmiennej środowiskowej klucza API
summary: Konfiguracja Cloudflare AI Gateway (auth + wybór modelu)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-24T09:27:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb10ef4bd92db88b2b3dac1773439ab2ba37916a72d1925995d74ef787fa1c8b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

Cloudflare AI Gateway stoi przed API providerów i pozwala dodawać analitykę, cache oraz kontrolki. W przypadku Anthropic OpenClaw używa Anthropic Messages API przez punkt końcowy Twojego Gateway.

| Właściwość    | Wartość                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------- |
| Provider      | `cloudflare-ai-gateway`                                                                  |
| Base URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`              |
| Model domyślny | `cloudflare-ai-gateway/claude-sonnet-4-6`                                               |
| Klucz API     | `CLOUDFLARE_AI_GATEWAY_API_KEY` (Twój klucz API providera dla żądań przechodzących przez Gateway) |

<Note>
Dla modeli Anthropic routowanych przez Cloudflare AI Gateway używaj swojego **klucza API Anthropic** jako klucza providera.
</Note>

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API providera i szczegóły Gateway">
    Uruchom onboarding i wybierz opcję auth Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Zostaniesz poproszony o identyfikator konta, identyfikator gateway i klucz API.

  </Step>
  <Step title="Ustaw model domyślny">
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
  <Step title="Zweryfikuj, że model jest dostępny">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Przykład nieinteraktywny

Dla konfiguracji skryptowych lub CI przekaż wszystkie wartości w wierszu poleceń:

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
  <Accordion title="Gateway z uwierzytelnianiem">
    Jeśli włączyłeś uwierzytelnianie Gateway w Cloudflare, dodaj nagłówek `cf-aig-authorization`. To jest **dodatkowe** względem klucza API providera.

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
    Nagłówek `cf-aig-authorization` uwierzytelnia wobec samego Cloudflare Gateway, podczas gdy klucz API providera (na przykład klucz Anthropic) uwierzytelnia wobec upstream providera.
    </Tip>

  </Accordion>

  <Accordion title="Uwaga o środowisku">
    Jeśli Gateway działa jako daemon (launchd/systemd), upewnij się, że `CLOUDFLARE_AI_GATEWAY_API_KEY` jest dostępny dla tego procesu.

    <Warning>
    Klucz znajdujący się tylko w `~/.profile` nie pomoże daemonowi launchd/systemd, jeśli to środowisko nie zostanie tam również zaimportowane. Ustaw klucz w `~/.openclaw/.env` albo przez `env.shellEnv`, aby mieć pewność, że proces gateway może go odczytać.
    </Warning>

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, odwołań modeli i zachowania failover.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i FAQ.
  </Card>
</CardGroup>
