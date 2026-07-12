---
read_when:
    - Chcesz używać Cloudflare AI Gateway z OpenClaw
    - Potrzebujesz identyfikatora konta, identyfikatora Gateway lub zmiennej środowiskowej klucza API
summary: Konfiguracja Cloudflare AI Gateway (uwierzytelnianie i wybór modelu)
title: Gateway AI Cloudflare
x-i18n:
    generated_at: "2026-07-12T15:29:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) działa przed interfejsami API dostawców i dodaje analitykę, buforowanie oraz mechanizmy kontroli. W przypadku Anthropic OpenClaw korzysta z interfejsu Anthropic Messages API za pośrednictwem punktu końcowego Gateway.

| Właściwość     | Wartość                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Dostawca       | `cloudflare-ai-gateway`                                                                                  |
| Plugin         | oficjalny pakiet zewnętrzny (`@openclaw/cloudflare-ai-gateway-provider`)                                 |
| Bazowy adres URL | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`                             |
| Model domyślny | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                                |
| Klucz API      | `CLOUDFLARE_AI_GATEWAY_API_KEY` (klucz API dostawcy używany do żądań przesyłanych przez Gateway)         |

<Note>
W przypadku modeli Anthropic kierowanych przez Cloudflare AI Gateway jako klucza dostawcy użyj swojego **klucza API Anthropic**.
</Note>

Gdy myślenie jest włączone dla modeli Anthropic Messages, OpenClaw usuwa końcowe
tury wstępnie wypełnione przez asystenta przed wysłaniem ładunku przez Cloudflare AI Gateway.
Anthropic odrzuca wstępne wypełnianie odpowiedzi przy rozszerzonym myśleniu, natomiast zwykłe
wstępne wypełnianie bez myślenia pozostaje dostępne.

## Instalowanie pluginu

Zainstaluj oficjalny plugin, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API dostawcy i dane Gateway">
    Uruchom konfigurację początkową i wybierz opcję uwierzytelniania Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Zostanie wyświetlona prośba o identyfikator konta, identyfikator Gateway i klucz API.

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
  <Accordion title="Uwierzytelniane Gateway">
    Jeśli włączono uwierzytelnianie Gateway w Cloudflare, dodaj nagłówek `cf-aig-authorization`. Jest on wymagany **oprócz** klucza API dostawcy.

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
    Nagłówek `cf-aig-authorization` służy do uwierzytelniania w samym Cloudflare Gateway, natomiast klucz API dostawcy (na przykład klucz Anthropic) służy do uwierzytelniania u dostawcy nadrzędnego.
    </Tip>

  </Accordion>

  <Accordion title="Uwaga dotycząca środowiska">
    Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że zmienna `CLOUDFLARE_AI_GATEWAY_API_KEY` jest dostępna dla tego procesu.

    <Warning>
    Klucz wyeksportowany wyłącznie w interaktywnej powłoce nie będzie dostępny dla demona launchd/systemd, chyba że to środowisko również zostanie do niego zaimportowane. Ustaw klucz w pliku `~/.openclaw/.env` lub za pomocą `env.shellEnv`, aby proces Gateway mógł go odczytać.
    </Warning>

  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania mechanizmu przełączania awaryjnego.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne wskazówki dotyczące rozwiązywania problemów i często zadawane pytania.
  </Card>
</CardGroup>
