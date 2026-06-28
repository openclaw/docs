---
read_when:
    - Eksik veya takılmış macOS izin istemlerinde hata ayıklama
    - node veya bir CLI çalışma zamanına Erişilebilirlik izni verilip verilmeyeceğine karar verme
    - macOS uygulamasını paketleme veya imzalama
    - Paket kimliklerini veya uygulama kurulum yollarını değiştirme
summary: macOS izin kalıcılığı (TCC) ve imzalama gereksinimleri
title: macOS izinleri
x-i18n:
    generated_at: "2026-06-28T00:49:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b7e21c53bff16c3023e2b6509894717c3d0ef96524951b0d0c5975d2fc91019
    source_path: platforms/mac/permissions.md
    workflow: 16
---

macOS izin verme işlemleri kırılgandır. TCC, bir izin verme işlemini uygulamanın kod imzası, paket tanımlayıcısı ve diskteki yolu ile ilişkilendirir. Bunlardan herhangi biri değişirse macOS uygulamayı yeni kabul eder ve istemleri kaldırabilir veya gizleyebilir.

## Kararlı izinler için gereksinimler

- Aynı yol: uygulamayı sabit bir konumdan çalıştırın (OpenClaw için `dist/OpenClaw.app`).
- Aynı paket tanımlayıcısı: paket kimliğini değiştirmek yeni bir izin kimliği oluşturur.
- İmzalı uygulama: imzasız veya ad-hoc imzalı derlemeler izinleri kalıcı tutmaz.
- Tutarlı imza: imzanın yeniden derlemeler arasında kararlı kalması için gerçek bir Apple Development veya Developer ID sertifikası kullanın.

Ad-hoc imzalar her derlemede yeni bir kimlik oluşturur. macOS önceki izinleri unutacaktır ve eski girdiler temizlenene kadar istemler tamamen kaybolabilir.

## Node ve CLI çalışma zamanları için Erişilebilirlik izinleri

Genel bir `node` ikilisi yerine OpenClaw.app, Peekaboo.app veya kendi paket tanımlayıcısına sahip başka bir imzalı yardımcıya Erişilebilirlik izni vermeyi tercih edin.

macOS TCC, Erişilebilirlik iznini gördüğü işlemin kod kimliğine verir. Bir Homebrew, nvm, pnpm veya npm iş akışı paylaşılan bir `node` yürütülebilir dosyasının Erişilebilirlik almasına neden olursa, aynı yürütülebilir dosya üzerinden başlatılan herhangi bir JavaScript paketi GUI otomasyon ayrıcalıklarını devralabilir.

Sistem Ayarları'ndaki bir `node` girdisini tek bir npm paketine verilmiş izin olarak değil, ilgili Node çalışma zamanı için geniş kapsamlı izin olarak değerlendirin. Tam olarak o Node kurulumu üzerinden başlatılan her betiğe ve pakete güvenmiyorsanız `node` için Erişilebilirlik izni vermekten kaçının.

Yanlışlıkla `node` için Erişilebilirlik izni verdiyseniz, bu girdiyi Sistem Ayarları -> Gizlilik ve Güvenlik -> Erişilebilirlik bölümünden kaldırın. Ardından UI otomasyonunun sahibi olması gereken imzalı uygulamaya veya yardımcıya izin verin.

## İstemler kaybolduğunda kurtarma kontrol listesi

1. Uygulamadan çıkın.
2. Uygulama girdisini Sistem Ayarları -> Gizlilik ve Güvenlik bölümünden kaldırın.
3. Uygulamayı aynı yoldan yeniden başlatın ve izinleri yeniden verin.
4. İstem hâlâ görünmüyorsa TCC girdilerini `tccutil` ile sıfırlayın ve tekrar deneyin.
5. Bazı izinler yalnızca tam bir macOS yeniden başlatmasından sonra tekrar görünür.

Örnek sıfırlamalar (paket kimliğini gerektiği gibi değiştirin):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Dosya ve klasör izinleri (Masaüstü/Belgeler/İndirilenler)

macOS, terminal/arka plan işlemleri için Masaüstü, Belgeler ve İndirilenler klasörlerini de kısıtlayabilir. Dosya okumaları veya dizin listelemeleri takılırsa, dosya işlemlerini gerçekleştiren aynı işlem bağlamına erişim izni verin (örneğin Terminal/iTerm, LaunchAgent tarafından başlatılan uygulama veya SSH işlemi).

Geçici çözüm: klasör başına izinlerden kaçınmak istiyorsanız dosyaları OpenClaw çalışma alanına (`~/.openclaw/workspace`) taşıyın.

İzinleri test ediyorsanız her zaman gerçek bir sertifikayla imzalayın. Ad-hoc derlemeler yalnızca izinlerin önemli olmadığı hızlı yerel çalıştırmalar için kabul edilebilir.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [macOS imzalama](/tr/platforms/mac/signing)
