---
read_when:
    - OpenCode Go kataloğunu istiyorsunuz
    - Go barındırmalı modeller için çalışma zamanı model referanslarına ihtiyacınız var
summary: Paylaşılan OpenCode kurulumu ile OpenCode Go kataloğunu kullanın
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-05T14:04:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8650af7c64220c14bab8c22472fff8bebd7abde253e972b6a11784ad833d321c
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go, [OpenCode](/providers/opencode) içindeki Go kataloğudur.
Zen kataloğuyla aynı `OPENCODE_API_KEY` anahtarını kullanır, ancak çalışma zamanı
sağlayıcı kimliği olarak `opencode-go` değerini korur; böylece upstream model başına yönlendirme doğru kalır.

## Desteklenen modeller

- `opencode-go/kimi-k2.5`
- `opencode-go/glm-5`
- `opencode-go/minimax-m2.5`

## CLI kurulumu

```bash
openclaw onboard --auth-choice opencode-go
# or non-interactive
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## Yapılandırma parçası

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Yönlendirme davranışı

Model referansı `opencode-go/...` kullandığında OpenClaw model başına yönlendirmeyi otomatik olarak işler.

## Notlar

- Paylaşılan onboarding ve katalog genel görünümü için [OpenCode](/providers/opencode) kullanın.
- Çalışma zamanı referansları açık kalır: Zen için `opencode/...`, Go için `opencode-go/...`.
