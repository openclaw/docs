---
read_when:
    - Chcesz używać Fireworks z OpenClaw
    - Potrzebujesz zmiennej env z kluczem API Fireworks lub domyślnego identyfikatora modelu
summary: Konfiguracja Fireworks (uwierzytelnianie + wybór modelu)
x-i18n:
    generated_at: "2026-04-05T14:02:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20083d5c248abd9a7223e6d188f0265ae27381940ee0067dff6d1d46d908c552
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) udostępnia modele open-weight i routowane przez API zgodne z OpenAI. OpenClaw zawiera teraz dołączony plugin providera Fireworks.

- Provider: `fireworks`
- Uwierzytelnianie: `FIREWORKS_API_KEY`
- API: zgodne z OpenAI chat/completions
- Base URL: `https://api.fireworks.ai/inference/v1`
- Model domyślny: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`

## Szybki start

Skonfiguruj uwierzytelnianie Fireworks przez onboarding:

```bash
openclaw onboard --auth-choice fireworks-api-key
```

To zapisuje twój klucz Fireworks w config OpenClaw i ustawia startowy model Fire Pass jako domyślny.

## Przykład nieinteraktywny

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Uwaga dotycząca środowiska

Jeśli Gateway działa poza twoją interaktywną powłoką, upewnij się, że `FIREWORKS_API_KEY`
jest dostępne również dla tego procesu. Klucz znajdujący się tylko w `~/.profile`
nie pomoże demonowi launchd/systemd, chyba że to środowisko również zostanie tam zaimportowane.

## Wbudowany katalog

| Model ref                                              | Name                        | Input      | Context | Max output | Notes                                      |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ---------- | ------------------------------------------ |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000    | Domyślny dołączony model startowy w Fireworks |

## Niestandardowe identyfikatory modeli Fireworks

OpenClaw akceptuje również dynamiczne identyfikatory modeli Fireworks. Użyj dokładnego identyfikatora modelu lub routera pokazywanego przez Fireworks i poprzedź go prefiksem `fireworks/`.

Przykład:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

Jeśli Fireworks opublikuje nowszy model, taki jak świeże wydanie Qwen lub Gemma, możesz przełączyć się na niego bezpośrednio, używając jego identyfikatora modelu Fireworks, bez czekania na aktualizację dołączonego katalogu.
