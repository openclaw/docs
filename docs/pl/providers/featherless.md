---
read_when:
    - Chcesz używać Featherless AI z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API Featherless lub odpowiedniego formatu odwołania do modelu
summary: Konfiguracja Featherless AI, wybór modelu i wywoływanie narzędzi
title: Featherless AI
x-i18n:
    generated_at: "2026-07-12T15:29:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9112f7e65b4089bf96933c632d0b62f7fb87d42998d985ca85eb92dc392636b6
    source_path: providers/featherless.md
    workflow: 16
---

[Featherless AI](https://featherless.ai) udostępnia otwarte modele za pośrednictwem
interfejsu API zgodnego z OpenAI. OpenClaw instaluje Featherless jako oficjalny
zewnętrzny Plugin dostawcy i utrzymuje niewielki wbudowany katalog, jednocześnie
akceptując w czasie działania dokładne identyfikatory modeli z Featherless.

| Właściwość                  | Wartość                                  |
| --------------------------- | ---------------------------------------- |
| Identyfikator dostawcy      | `featherless`                            |
| Pakiet                      | `@openclaw/featherless-provider`         |
| Zmienna środowiskowa uwierz. | `FEATHERLESS_API_KEY`                    |
| Flaga wdrażania             | `--auth-choice featherless-api-key`      |
| Bezpośrednia flaga CLI      | `--featherless-api-key <key>`            |
| API                         | Zgodne z OpenAI (`openai-completions`)   |
| Bazowy adres URL            | `https://api.featherless.ai/v1`          |
| Model domyślny              | `featherless/Qwen/Qwen3-32B`             |

## Konfiguracja

Zainstaluj Plugin i uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/featherless-provider
openclaw gateway restart
```

Uruchom wdrażanie:

```bash
openclaw onboard --auth-choice featherless-api-key
```

W przypadku konfiguracji nieinteraktywnej:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice featherless-api-key \
  --featherless-api-key "$FEATHERLESS_API_KEY"
```

Możesz też udostępnić klucz procesowi Gateway:

```bash
export FEATHERLESS_API_KEY="<your-featherless-api-key>" # pragma: allowlist secret
```

Zweryfikuj dostawcę:

```bash
openclaw models list --provider featherless
```

## Model domyślny

Plugin używa `Qwen/Qwen3-32B` jako domyślnego modelu podczas konfiguracji,
ponieważ dokumentacja Featherless opisuje natywną obsługę wywoływania narzędzi
dla rodziny Qwen 3. OpenClaw konfiguruje okno kontekstu obejmujące 32 768 tokenów,
konserwatywny limit wyjściowy wynoszący 4096 tokenów oraz mechanizmy sterowania
myśleniem w szablonie czatu Qwen.

Pola kosztów w katalogu mają wartość zero, ponieważ Featherless obsługuje wiele
modeli rozliczeń, a OpenClaw nie osadza stawek zależnych od planu konta ani cen
za żądania.

## Inne modele Featherless

Użyj dokładnego identyfikatora modelu Featherless po prefiksie dostawcy
`featherless/`:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "featherless/moonshotai/Kimi-K2-Instruct",
      },
    },
  },
}
```

OpenClaw celowo nie kopiuje pełnego publicznego indeksu modeli Featherless do
selektora. Indeks jest duży i nie udostępnia wystarczającej ilości
ustrukturyzowanych metadanych możliwości, aby bezpiecznie sklasyfikować każdy
model tekstowy, wizyjny, osadzający i rozumujący. Dlatego nieznane identyfikatory
są rozpoznawane z konserwatywnymi ustawieniami domyślnymi: wyłącznie tekst, bez
rozumowania, okno kontekstu obejmujące 4096 tokenów i limit wyjściowy wynoszący
1024 tokeny.

Dodaj jawny wpis modelu dostawcy, gdy model wymaga innych metadanych:

```json5
{
  models: {
    mode: "merge",
    providers: {
      featherless: {
        baseUrl: "https://api.featherless.ai/v1",
        apiKey: "${FEATHERLESS_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-3-27b-it",
            name: "Gemma 3 27B",
            input: ["text", "image"],
            reasoning: false,
            contextWindow: 32768,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

Przed dodaniem niestandardowych metadanych sprawdź w katalogu modeli Featherless
bieżącą dostępność modeli i znaczniki możliwości.

## Rozwiązywanie problemów

- `401` lub `403`: upewnij się, że zmienna `FEATHERLESS_API_KEY` jest widoczna
  dla procesu Gateway, albo ponownie uruchom wdrażanie.
- Nieznany model: użyj dokładnego identyfikatora z Featherless z zachowaniem
  wielkości liter po prefiksie `featherless/`.
- Wywołania narzędzi zwracane jako tekst: wybierz rodzinę modeli, dla której
  Featherless dokumentuje natywne wywoływanie funkcji, na przykład Qwen 3.
- Zarządzany Gateway nie widzi klucza: umieść go w `~/.openclaw/.env` lub innym
  źródle zmiennych środowiskowych wczytywanym przez usługę, a następnie uruchom
  ponownie Gateway.

## Powiązane

- [Dostawcy modeli](/pl/concepts/model-providers)
- [Wszyscy dostawcy](/pl/providers/index)
- [Tryby myślenia](/pl/tools/thinking)
