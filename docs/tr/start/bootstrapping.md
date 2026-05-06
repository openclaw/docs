---
read_when:
    - İlk ajan çalıştırmasında neler olduğunu anlama
    - Önyükleme dosyalarının nerede bulunduğunu açıklama
    - Başlangıç kimliği kurulumunda hata ayıklama
sidebarTitle: Bootstrapping
summary: Çalışma alanını ve kimlik dosyalarını hazırlayan ajan başlatma ritüeli
title: Ajan önyüklemesi
x-i18n:
    generated_at: "2026-05-06T09:31:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: e25f05ca47184068b87f0bf8b7dea1c427f4ed48edde170a74888d586b8a606d
    source_path: start/bootstrapping.md
    workflow: 16
---

Bootstrapping, bir ajan çalışma alanını hazırlayan ve kimlik ayrıntılarını toplayan **ilk çalıştırma** ritüelidir. Onboarding sonrasında, ajan ilk kez başlatıldığında gerçekleşir.

## Bootstrapping ne yapar

İlk ajan çalıştırmasında OpenClaw çalışma alanını bootstrap eder (varsayılan
`~/.openclaw/workspace`):

- `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md` dosyalarını oluşturur.
- Kısa bir soru-cevap ritüeli çalıştırır (her seferinde bir soru).
- Kimlik + tercihleri `IDENTITY.md`, `USER.md`, `SOUL.md` dosyalarına yazar.
- Tamamlandığında `BOOTSTRAP.md` dosyasını kaldırır, böylece yalnızca bir kez çalışır.

Gömülü/yerel model çalıştırmaları için OpenClaw, `BOOTSTRAP.md` dosyasını ayrıcalıklı sistem bağlamının dışında tutar. Birincil etkileşimli ilk çalıştırmada, `read` aracını güvenilir şekilde çağırmayan modellerin ritüeli tamamlayabilmesi için dosya içeriklerini yine de kullanıcı isteminde geçirir. Geçerli çalıştırma çalışma alanına güvenli şekilde erişemiyorsa ajan, genel bir selamlama yerine sınırlı bir bootstrap notu alır.

## Bootstrapping’i atlama

Önceden hazırlanmış bir çalışma alanı için bunu atlamak üzere `openclaw onboard --skip-bootstrap` komutunu çalıştırın.

## Nerede çalışır

Bootstrapping her zaman **Gateway ana makinesinde** çalışır. macOS uygulaması uzak bir Gateway’e bağlanırsa çalışma alanı ve bootstrapping dosyaları o uzak makinede bulunur.

<Note>
Gateway başka bir makinede çalıştığında, çalışma alanı dosyalarını gateway ana makinesinde düzenleyin (örneğin, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## İlgili belgeler

- macOS uygulama onboarding’i: [Onboarding](/tr/start/onboarding)
- Çalışma alanı düzeni: [Ajan çalışma alanı](/tr/concepts/agent-workspace)
