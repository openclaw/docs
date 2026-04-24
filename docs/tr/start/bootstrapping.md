---
read_when:
    - İlk aracı çalıştırmasında ne olduğunu anlama
    - Önyüklemeleme dosyalarının nerede yaşadığını açıklama
    - İlk katılım kimlik kurulumunda hata ayıklama
sidebarTitle: Bootstrapping
summary: Çalışma alanını ve kimlik dosyalarını tohumlayan aracı önyükleme ritüeli
title: Aracı önyüklemeleme
x-i18n:
    generated_at: "2026-04-24T09:31:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c23a204a7afbf2ca0c0d19a227286cf0ae396181073403055db41dafa764d2a
    source_path: start/bootstrapping.md
    workflow: 15
---

Önyüklemeleme, bir aracı çalışma alanını hazırlayan ve
kimlik ayrıntılarını toplayan **ilk çalıştırma** ritüelidir. İlk katılımdan sonra, aracı
ilk kez başlatıldığında gerçekleşir.

## Önyükülemeleme ne yapar

İlk aracı çalıştırmasında OpenClaw çalışma alanını önyükler (varsayılan
`~/.openclaw/workspace`):

- `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md` dosyalarını tohumlar.
- Kısa bir Soru-Cevap ritüeli çalıştırır (her seferinde bir soru).
- Kimlik + tercihleri `IDENTITY.md`, `USER.md`, `SOUL.md` dosyalarına yazar.
- Yalnızca bir kez çalışması için bittiğinde `BOOTSTRAP.md` dosyasını kaldırır.

## Nerede çalışır

Önyüklemeleme her zaman **gateway ana makinesinde** çalışır. macOS uygulaması
uzak bir Gateway'e bağlanıyorsa, çalışma alanı ve önyüklemeleme dosyaları o uzak
makinede yaşar.

<Note>
Gateway başka bir makinede çalıştığında, çalışma alanı dosyalarını gateway
ana makinesinde düzenleyin (örneğin `user@gateway-host:~/.openclaw/workspace`).
</Note>

## İlgili belgeler

- macOS uygulaması ilk katılımı: [İlk katılım](/tr/start/onboarding)
- Çalışma alanı düzeni: [Aracı çalışma alanı](/tr/concepts/agent-workspace)
