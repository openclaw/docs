---
read_when:
    - Eksik veya takılı kalan macOS izin istemlerinde hata ayıklama
    - Node'a veya bir CLI çalışma zamanına Erişilebilirlik izni verilip verilmeyeceğine karar verme
    - macOS uygulamasını paketleme veya imzalama
    - Paket kimliklerini veya uygulama yükleme yollarını değiştirme
summary: macOS izin kalıcılığı (TCC) ve imzalama gereksinimleri
title: macOS izinleri
x-i18n:
    generated_at: "2026-07-12T11:56:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c8431a1d5a27aed00c50c5d6c8c36554cf766051dfdccea677d0523bbc4189d4
    source_path: platforms/mac/permissions.md
    workflow: 16
---

macOS izinleri hassastır. TCC, bir izin yetkilendirmesini uygulamanın kod imzası, paket tanımlayıcısı ve diskteki yolu ile ilişkilendirir. Bunlardan herhangi biri değişirse macOS uygulamayı yeni olarak değerlendirir ve istemleri kaldırabilir veya gizleyebilir.

## Kararlı izinler için gereksinimler

- Aynı yol: uygulamayı sabit bir konumdan çalıştırın (OpenClaw için `dist/OpenClaw.app`).
- Aynı paket tanımlayıcısı: OpenClaw'ın paket kimliği `ai.openclaw.mac` değeridir; bunu değiştirmek yeni bir izin kimliği oluşturur.
- İmzalı uygulama: imzasız veya geçici imzayla imzalanmış derlemelerde izinler kalıcı olmaz.
- Tutarlı imza: imzanın yeniden derlemeler arasında kararlı kalması için gerçek bir Apple Development veya Developer ID sertifikası kullanın.

Geçici imzalar her derlemede yeni bir kimlik oluşturur. macOS önceki izinleri unutur ve eski girdiler temizlenene kadar istemler tamamen kaybolabilir.

## Node ve CLI çalışma zamanları için Erişilebilirlik izinleri

Genel bir `node` ikili dosyası yerine Erişilebilirlik iznini OpenClaw.app, Peekaboo.app veya kendi paket tanımlayıcısına sahip başka bir imzalı yardımcı uygulamaya vermeyi tercih edin.

macOS TCC, Erişilebilirlik iznini gördüğü işlemin kod kimliğine verir. Bir Homebrew, nvm, pnpm veya npm iş akışı, paylaşılan bir `node` yürütülebilir dosyasının Erişilebilirlik izni almasına neden olursa aynı yürütülebilir dosya üzerinden başlatılan tüm JavaScript paketleri grafik arayüz otomasyonu ayrıcalıklarını devralabilir.

Sistem Ayarları'ndaki bir `node` girdisini tek bir npm paketine verilen izin olarak değil, söz konusu Node çalışma zamanı için geniş kapsamlı bir izin olarak değerlendirin. Tam olarak bu Node kurulumuyla başlatılan her betiğe ve pakete güvenmiyorsanız `node` için Erişilebilirlik izni vermekten kaçının.

Yanlışlıkla `node` için Erişilebilirlik izni verdiyseniz bu girdiyi Sistem Ayarları -> Gizlilik ve Güvenlik -> Erişilebilirlik bölümünden kaldırın. Ardından kullanıcı arayüzü otomasyonunun sahibi olması gereken imzalı uygulamaya veya yardımcı uygulamaya izin verin.

## İstemler kaybolduğunda kurtarma denetim listesi

1. Uygulamadan çıkın.
2. Sistem Ayarları -> Gizlilik ve Güvenlik bölümündeki uygulama girdisini kaldırın.
3. Uygulamayı aynı yoldan yeniden başlatın ve izinleri tekrar verin.
4. İstem hâlâ görünmüyorsa TCC girdilerini `tccutil` ile sıfırlayıp tekrar deneyin.
5. Bazı izinler yalnızca macOS tamamen yeniden başlatıldıktan sonra tekrar görünür.

Örnek sıfırlama komutları (OpenClaw'ın paket kimliği `ai.openclaw.mac` kullanılarak):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Dosya ve klasör izinleri (Masaüstü/Belgeler/İndirilenler)

macOS, terminal veya arka plan işlemlerinin Masaüstü, Belgeler ve İndirilenler klasörlerine erişimini de kısıtlayabilir. Dosya okumaları veya dizin listelemeleri yanıt vermiyorsa dosya işlemlerini gerçekleştiren işlem bağlamına erişim verin (örneğin Terminal/iTerm, LaunchAgent tarafından başlatılan uygulama veya SSH işlemi).

Geçici çözüm: klasör başına izin vermekten kaçınmak istiyorsanız dosyaları OpenClaw çalışma alanına (`~/.openclaw/workspace`) taşıyın.

İzinleri test ediyorsanız her zaman gerçek bir sertifikayla imzalayın. Geçici imzalı derlemeler yalnızca izinlerin önemli olmadığı hızlı yerel çalıştırmalar için kabul edilebilir.

## İlgili konular

- [macOS uygulaması](/tr/platforms/macos)
- [macOS imzalama](/tr/platforms/mac/signing)
