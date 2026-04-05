---
read_when:
    - İlk ajan çalıştırmasında neler olduğunu anlamak
    - Önyükleme dosyalarının nerede bulunduğunu açıklamak
    - Onboarding kimlik kurulumunda hata ayıklamak
sidebarTitle: Bootstrapping
summary: Çalışma alanını ve kimlik dosyalarını oluşturan ajan önyükleme ritüeli
title: Ajan Önyükleme
x-i18n:
    generated_at: "2026-04-05T14:08:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a08b5102f25c6c4bcdbbdd44384252a9e537b245a7b070c4961a72b4c6c6601
    source_path: start/bootstrapping.md
    workflow: 15
---

# Ajan Önyükleme

Önyükleme, bir ajan çalışma alanını hazırlayan ve kimlik bilgilerini toplayan
**ilk çalıştırma** ritüelidir. Onboarding sonrasında, ajan ilk kez
başlatıldığında gerçekleşir.

## Önyükleme ne yapar

İlk ajan çalıştırmasında OpenClaw çalışma alanını önyükler (varsayılan
`~/.openclaw/workspace`):

- `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md` dosyalarını oluşturur.
- Kısa bir soru-cevap ritüeli yürütür (her seferinde bir soru).
- Kimlik + tercihleri `IDENTITY.md`, `USER.md`, `SOUL.md` dosyalarına yazar.
- Yalnızca bir kez çalışması için bittiğinde `BOOTSTRAP.md` dosyasını kaldırır.

## Nerede çalışır

Önyükleme her zaman **gateway host** üzerinde çalışır. macOS uygulaması uzak
bir Gateway'e bağlanıyorsa, çalışma alanı ve önyükleme dosyaları bu uzak
makinede bulunur.

<Note>
Gateway başka bir makinede çalışıyorsa, çalışma alanı dosyalarını gateway
host üzerinde düzenleyin (örneğin, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## İlgili belgeler

- macOS uygulaması onboarding: [Onboarding](/start/onboarding)
- Çalışma alanı düzeni: [Ajan çalışma alanı](/tr/concepts/agent-workspace)
