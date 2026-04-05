---
read_when:
    - Chcesz dostępu do modeli hostowanych przez OpenCode
    - Chcesz wybrać między katalogami Zen i Go
summary: Używaj katalogów OpenCode Zen i Go z OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-05T14:03:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: c23bc99208d9275afcb1731c28eee250c9f4b7d0578681ace31416135c330865
    source_path: providers/opencode.md
    workflow: 15
---

# OpenCode

OpenCode udostępnia w OpenClaw dwa hostowane katalogi:

- `opencode/...` dla katalogu **Zen**
- `opencode-go/...` dla katalogu **Go**

Oba katalogi używają tego samego klucza API OpenCode. OpenClaw utrzymuje rozdzielone identyfikatory dostawców runtime,
aby routing upstream per model pozostał poprawny, ale onboarding i dokumentacja traktują je
jako jedną konfigurację OpenCode.

## Konfiguracja przez CLI

### Katalog Zen

```bash
openclaw onboard --auth-choice opencode-zen
openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
```

### Katalog Go

```bash
openclaw onboard --auth-choice opencode-go
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## Fragment konfiguracji

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Katalogi

### Zen

- Dostawca runtime: `opencode`
- Przykładowe modele: `opencode/claude-opus-4-6`, `opencode/gpt-5.4`, `opencode/gemini-3-pro`
- Najlepszy wybór, gdy chcesz kuratorowany wielomodelowy proxy OpenCode

### Go

- Dostawca runtime: `opencode-go`
- Przykładowe modele: `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5`
- Najlepszy wybór, gdy chcesz linię Kimi/GLM/MiniMax hostowaną przez OpenCode

## Uwagi

- `OPENCODE_ZEN_API_KEY` jest również obsługiwane.
- Wprowadzenie jednego klucza OpenCode podczas konfiguracji zapisuje poświadczenia dla obu dostawców runtime.
- Logujesz się do OpenCode, dodajesz dane rozliczeniowe i kopiujesz swój klucz API.
- Billing i dostępność katalogów są zarządzane z panelu OpenCode.
- Referencje OpenCode oparte na Gemini pozostają na ścieżce proxy-Gemini, więc OpenClaw zachowuje
  tam sanityzację thought-signature Gemini bez włączania natywnej walidacji replay Gemini
  ani przepisywania bootstrap.
- Referencje OpenCode inne niż Gemini zachowują minimalną politykę replay zgodną z OpenAI.
