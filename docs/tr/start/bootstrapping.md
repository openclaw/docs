---
read_when:
    - İlk ajan çalıştırmasında neler olduğunu anlamak
    - Önyükleme dosyalarının nerede bulunduğunu açıklama
    - İlk kurulum kimliği ayarında hata ayıklama
sidebarTitle: Bootstrapping
summary: Çalışma alanını ve kimlik dosyalarını hazırlayan ajan önyükleme ritüeli
title: Aracı önyüklemesi
x-i18n:
    generated_at: "2026-04-30T09:46:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: de829f82016ae1e4dcd7714502ca8d11755556fed18b985a7e2bada4149a2d46
    source_path: start/bootstrapping.md
    workflow: 16
---

Önyükleme, bir ajan çalışma alanını hazırlayan ve kimlik ayrıntılarını
toplayan **ilk çalıştırma** sürecidir. İlk kurulumdan sonra, ajan ilk kez
başladığında gerçekleşir.

## Önyükleme ne yapar?

İlk ajan çalıştırmasında OpenClaw çalışma alanını önyükler (varsayılan
`~/.openclaw/workspace`):

- `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md` dosyalarını oluşturur.
- Kısa bir soru-cevap süreci yürütür (tek seferde bir soru).
- Kimliği ve tercihleri `IDENTITY.md`, `USER.md`, `SOUL.md` dosyalarına yazar.
- Bittiğinde `BOOTSTRAP.md` dosyasını kaldırır; böylece yalnızca bir kez çalışır.

Gömülü/yerel model çalıştırmaları için OpenClaw, `BOOTSTRAP.md` dosyasını
ayrıcalıklı sistem bağlamının dışında tutar. Birincil etkileşimli ilk
çalıştırmada, `read` aracını güvenilir biçimde çağırmayan modellerin de süreci
tamamlayabilmesi için dosya içeriklerini yine de kullanıcı isteminde geçirir.
Geçerli çalıştırma çalışma alanına güvenli biçimde erişemiyorsa, ajan genel bir
selamlama yerine sınırlı bir önyükleme notu alır.

## Önyüklemeyi atlama

Önceden hazırlanmış bir çalışma alanı için bunu atlamak üzere `openclaw onboard --skip-bootstrap` komutunu çalıştırın.

## Nerede çalışır?

Önyükleme her zaman **gateway ana makinesinde** çalışır. macOS uygulaması uzak
bir Gateway’e bağlanırsa, çalışma alanı ve önyükleme dosyaları o uzak makinede
bulunur.

<Note>
Gateway başka bir makinede çalıştığında, çalışma alanı dosyalarını gateway
ana makinesinde düzenleyin (örneğin, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## İlgili belgeler

- macOS uygulaması ilk kurulumu: [İlk Kurulum](/tr/start/onboarding)
- Çalışma alanı düzeni: [Ajan çalışma alanı](/tr/concepts/agent-workspace)
