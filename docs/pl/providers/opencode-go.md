---
read_when:
    - Chcesz używać katalogu OpenCode Go
    - Potrzebujesz referencji modeli runtime dla modeli hostowanych przez Go
summary: Używaj katalogu OpenCode Go ze współdzieloną konfiguracją OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-05T14:03:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8650af7c64220c14bab8c22472fff8bebd7abde253e972b6a11784ad833d321c
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go to katalog Go w ramach [OpenCode](/providers/opencode).
Używa tego samego `OPENCODE_API_KEY` co katalog Zen, ale zachowuje identyfikator
providera runtime `opencode-go`, aby routing upstream per model pozostał poprawny.

## Obsługiwane modele

- `opencode-go/kimi-k2.5`
- `opencode-go/glm-5`
- `opencode-go/minimax-m2.5`

## Konfiguracja CLI

```bash
openclaw onboard --auth-choice opencode-go
# albo nieinteraktywnie
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## Fragment config

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Zachowanie routingu

OpenClaw automatycznie obsługuje routing per model, gdy referencja modelu używa `opencode-go/...`.

## Uwagi

- Informacje o współdzielonym onboardingu i przeglądzie katalogu znajdziesz w [OpenCode](/providers/opencode).
- Referencje runtime pozostają jawne: `opencode/...` dla Zen, `opencode-go/...` dla Go.
