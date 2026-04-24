---
read_when:
    - Chcesz używać Tencent Hy3 preview z OpenClaw
    - Potrzebujesz konfiguracji klucza API TokenHub
summary: Konfiguracja Tencent Cloud TokenHub dla wersji preview Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-24T09:29:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: c64afffc66dccca256ec658235ae1fbc18e46608b594bc07875118f54b2a494d
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud TokenHub

Tencent Cloud jest dostarczany jako **dołączony Plugin providera** w OpenClaw. Zapewnia dostęp do Tencent Hy3 preview przez punkt końcowy TokenHub (`tencent-tokenhub`).

Provider używa API zgodnego z OpenAI.

| Właściwość    | Wartość                                  |
| ------------- | ---------------------------------------- |
| Provider      | `tencent-tokenhub`                       |
| Model domyślny | `tencent-tokenhub/hy3-preview`          |
| Auth          | `TOKENHUB_API_KEY`                       |
| API           | Zgodne z OpenAI chat completions         |
| Base URL      | `https://tokenhub.tencentmaas.com/v1`    |
| Global URL    | `https://tokenhub-intl.tencentmaas.com/v1` |

## Szybki start

<Steps>
  <Step title="Utwórz klucz API TokenHub">
    Utwórz klucz API w Tencent Cloud TokenHub. Jeśli wybierzesz dla klucza ograniczony zakres dostępu, uwzględnij **Hy3 preview** w dozwolonych modelach.
  </Step>
  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --auth-choice tokenhub-api-key
    ```
  </Step>
  <Step title="Zweryfikuj model">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Konfiguracja nieinteraktywna

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Wbudowany katalog

| Ref modelu                     | Nazwa                  | Wejście | Kontekst | Maks. wyjście | Uwagi                          |
| ------------------------------ | ---------------------- | ------- | -------- | ------------- | ------------------------------ |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | tekst   | 256,000  | 64,000        | Domyślny; reasoning-enabled    |

Hy3 preview to duży model językowy MoE Tencent Hunyuan do reasoning, wykonywania instrukcji w długim kontekście, kodu i przepływów pracy agentów. Przykłady Tencent zgodne z OpenAI używają `hy3-preview` jako identyfikatora modelu i obsługują standardowe wywoływanie narzędzi chat-completions oraz `reasoning_effort`.

<Tip>
Identyfikator modelu to `hy3-preview`. Nie myl go z modelami Tencent `HY-3D-*`, które są API generowania 3D i nie są modelem czatu OpenClaw konfigurowanym przez tego providera.
</Tip>

## Nadpisanie punktu końcowego

OpenClaw domyślnie używa punktu końcowego Tencent Cloud `https://tokenhub.tencentmaas.com/v1`. Tencent dokumentuje również międzynarodowy punkt końcowy TokenHub:

```bash
openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
```

Nadpisuj punkt końcowy tylko wtedy, gdy wymaga tego Twoje konto lub region TokenHub.

## Uwagi

- Odwołania modeli TokenHub używają `tencent-tokenhub/<modelId>`.
- Dołączony katalog zawiera obecnie `hy3-preview`.
- Plugin oznacza Hy3 preview jako zdolny do reasoning i zgodny z usage streamingu.
- Plugin jest dostarczany z warstwowymi metadanymi cenowymi Hy3, więc szacunki kosztów są wypełniane bez ręcznych nadpisań cen.
- Nadpisuj ceny, kontekst lub metadane punktu końcowego w `models.providers` tylko wtedy, gdy jest to potrzebne.

## Uwaga o środowisku

Jeśli Gateway działa jako daemon (launchd/systemd), upewnij się, że `TOKENHUB_API_KEY`
jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` albo przez
`env.shellEnv`).

## Powiązana dokumentacja

- [Konfiguracja OpenClaw](/pl/gateway/configuration)
- [Providerzy modeli](/pl/concepts/model-providers)
- [Strona produktu Tencent TokenHub](https://cloud.tencent.com/product/tokenhub)
- [Generowanie tekstu Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130079)
- [Konfiguracja Tencent TokenHub Cline dla Hy3 preview](https://cloud.tencent.com/document/product/1823/130932)
- [Karta modelu Tencent Hy3 preview](https://huggingface.co/tencent/Hy3-preview)
