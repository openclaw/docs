---
read_when:
    - Chcesz używać Cloudflare AI Gateway z OpenClaw
    - Potrzebujesz identyfikatora konta, identyfikatora Gateway lub zmiennej środowiskowej klucza API
summary: Konfiguracja Cloudflare AI Gateway (uwierzytelnianie + wybór modelu)
title: Gateway AI Cloudflare
x-i18n:
    generated_at: "2026-06-27T18:11:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05678faa049349c610a9c7ea9d23958bf51927453cf6987fef397cd273f6556b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway znajduje się przed API dostawców i umożliwia dodanie analityki, buforowania oraz kontroli. W przypadku Anthropic OpenClaw używa Anthropic Messages API przez punkt końcowy Gateway.

| Właściwość      | Wartość                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Dostawca      | `cloudflare-ai-gateway`                                                                  |
| Bazowy URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Domyślny model | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| Klucz API       | `CLOUDFLARE_AI_GATEWAY_API_KEY` (klucz API dostawcy dla żądań przez Gateway) |

<Note>
Dla modeli Anthropic kierowanych przez Cloudflare AI Gateway użyj swojego **klucza API Anthropic** jako klucza dostawcy.
</Note>

Gdy myślenie jest włączone dla modeli Anthropic Messages, OpenClaw usuwa końcowe
tury wstępnego wypełnienia asystenta przed wysłaniem ładunku przez Cloudflare AI Gateway.
Anthropic odrzuca wstępne wypełnianie odpowiedzi z rozszerzonym myśleniem, natomiast zwykłe
wstępne wypełnianie bez myślenia pozostaje dostępne.

## Zainstaluj plugin

Zainstaluj oficjalny plugin, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API dostawcy i szczegóły Gateway">
    Uruchom wdrażanie i wybierz opcję uwierzytelniania Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Zostaniesz poproszony o identyfikator konta, identyfikator gateway oraz klucz API.

  </Step>
  <Step title="Ustaw domyślny model">
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
  <Step title="Sprawdź, czy model jest dostępny">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Przykład nieinteraktywny

W przypadku konfiguracji skryptowych lub CI przekaż wszystkie wartości w wierszu poleceń:

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
  <Accordion title="Uwierzytelniane gatewaye">
    Jeśli włączono uwierzytelnianie Gateway w Cloudflare, dodaj nagłówek `cf-aig-authorization`. Jest to **dodatek do** klucza API dostawcy.

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
    Nagłówek `cf-aig-authorization` uwierzytelnia w samym Cloudflare Gateway, natomiast klucz API dostawcy (na przykład klucz Anthropic) uwierzytelnia u nadrzędnego dostawcy.
    </Tip>

  </Accordion>

  <Accordion title="Uwaga dotycząca środowiska">
    Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że `CLOUDFLARE_AI_GATEWAY_API_KEY` jest dostępny dla tego procesu.

    <Warning>
    Klucz wyeksportowany tylko w interaktywnej powłoce nie pomoże demonowi launchd/systemd, chyba że to środowisko również zostanie tam zaimportowane. Ustaw klucz w `~/.openclaw/.env` lub przez `env.shellEnv`, aby zapewnić, że proces gateway będzie mógł go odczytać.
    </Warning>

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i często zadawane pytania.
  </Card>
</CardGroup>
