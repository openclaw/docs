---
read_when:
    - Anda menginginkan katalog OpenCode Go
    - Anda memerlukan ref model runtime untuk model yang di-host oleh Go
summary: Gunakan katalog OpenCode Go dengan penyiapan OpenCode bersama
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-05T14:03:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8650af7c64220c14bab8c22472fff8bebd7abde253e972b6a11784ad833d321c
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go adalah katalog Go di dalam [OpenCode](/providers/opencode).
Ini menggunakan `OPENCODE_API_KEY` yang sama dengan katalog Zen, tetapi mempertahankan
id provider runtime `opencode-go` agar routing per model di upstream tetap benar.

## Model yang didukung

- `opencode-go/kimi-k2.5`
- `opencode-go/glm-5`
- `opencode-go/minimax-m2.5`

## Penyiapan CLI

```bash
openclaw onboard --auth-choice opencode-go
# atau non-interaktif
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## Cuplikan config

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Perilaku routing

OpenClaw menangani routing per model secara otomatis saat ref model menggunakan `opencode-go/...`.

## Catatan

- Gunakan [OpenCode](/providers/opencode) untuk onboarding bersama dan ringkasan katalog.
- Ref runtime tetap eksplisit: `opencode/...` untuk Zen, `opencode-go/...` untuk Go.
