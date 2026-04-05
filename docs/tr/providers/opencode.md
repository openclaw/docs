---
read_when:
    - OpenCode barındırmalı model erişimi istiyorsunuz
    - Zen ve Go katalogları arasında seçim yapmak istiyorsunuz
summary: OpenClaw ile OpenCode Zen ve Go kataloglarını kullanın
title: OpenCode
x-i18n:
    generated_at: "2026-04-05T14:04:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: c23bc99208d9275afcb1731c28eee250c9f4b7d0578681ace31416135c330865
    source_path: providers/opencode.md
    workflow: 15
---

# OpenCode

OpenCode, OpenClaw içinde iki barındırmalı katalog sunar:

- **Zen** kataloğu için `opencode/...`
- **Go** kataloğu için `opencode-go/...`

Her iki katalog da aynı OpenCode API anahtarını kullanır. OpenClaw, yukarı akış model başına yönlendirme doğru kalsın diye çalışma zamanı sağlayıcı kimliklerini
ayrı tutar, ancak onboarding ve belgeler bunları
tek bir OpenCode kurulumu olarak ele alır.

## CLI kurulumu

### Zen kataloğu

```bash
openclaw onboard --auth-choice opencode-zen
openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
```

### Go kataloğu

```bash
openclaw onboard --auth-choice opencode-go
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## Yapılandırma parçası

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Kataloglar

### Zen

- Çalışma zamanı sağlayıcısı: `opencode`
- Örnek modeller: `opencode/claude-opus-4-6`, `opencode/gpt-5.4`, `opencode/gemini-3-pro`
- Düzenlenmiş OpenCode çok modelli proxy'yi istediğinizde en uygunudur

### Go

- Çalışma zamanı sağlayıcısı: `opencode-go`
- Örnek modeller: `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5`
- OpenCode barındırmalı Kimi/GLM/MiniMax dizilimini istediğinizde en uygunudur

## Notlar

- `OPENCODE_ZEN_API_KEY` de desteklenir.
- Kurulum sırasında bir OpenCode anahtarı girmek, her iki çalışma zamanı sağlayıcısı için kimlik bilgilerini saklar.
- OpenCode'da oturum açar, faturalandırma bilgilerini eklersiniz ve API anahtarınızı kopyalarsınız.
- Faturalandırma ve katalog kullanılabilirliği OpenCode panosundan yönetilir.
- Gemini destekli OpenCode başvuruları proxy-Gemini yolunda kalır, bu nedenle OpenClaw
  yerel Gemini
  yeniden oynatma doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmeden burada
  Gemini thought-signature temizliğini korur.
- Gemini dışı OpenCode başvuruları asgari OpenAI uyumlu yeniden oynatma ilkesini korur.
