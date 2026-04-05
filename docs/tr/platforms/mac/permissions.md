---
read_when:
    - Eksik veya takılı kalmış macOS izin istemlerini hata ayıklama
    - macOS uygulamasını paketleme veya imzalama
    - Bundle ID'lerini veya uygulama kurulum yollarını değiştirme
summary: macOS izin kalıcılığı (TCC) ve imzalama gereksinimleri
title: macOS İzinleri
x-i18n:
    generated_at: "2026-04-05T14:00:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 250065b964c98c307a075ab9e23bf798f9d247f27befe2e5f271ffef1f497def
    source_path: platforms/mac/permissions.md
    workflow: 15
---

# macOS izinleri (TCC)

macOS izin onayları hassastır. TCC, bir izin onayını uygulamanın
kod imzası, bundle tanımlayıcısı ve disk üzerindeki yolu ile ilişkilendirir. Bunlardan herhangi biri değişirse,
macOS uygulamayı yeni olarak değerlendirir ve istemleri kaldırabilir veya gizleyebilir.

## Kararlı izinler için gereksinimler

- Aynı yol: uygulamayı sabit bir konumdan çalıştırın (OpenClaw için `dist/OpenClaw.app`).
- Aynı bundle tanımlayıcısı: bundle ID'yi değiştirmek yeni bir izin kimliği oluşturur.
- İmzalı uygulama: imzasız veya ad-hoc imzalı derlemeler izinleri kalıcı olarak saklamaz.
- Tutarlı imza: imzanın yeniden derlemeler arasında kararlı kalması için gerçek bir Apple Development veya Developer ID sertifikası
  kullanın.

Ad-hoc imzalar her derlemede yeni bir kimlik oluşturur. macOS önceki
izin onaylarını unutur ve eski girdiler temizlenene kadar istemler tamamen kaybolabilir.

## İstemler kaybolduğunda kurtarma kontrol listesi

1. Uygulamadan çıkın.
2. System Settings -> Privacy & Security içinde uygulama girdisini kaldırın.
3. Uygulamayı aynı yoldan yeniden başlatın ve izinleri tekrar verin.
4. İstem hâlâ görünmüyorsa, TCC girdilerini `tccutil` ile sıfırlayın ve tekrar deneyin.
5. Bazı izinler ancak macOS tamamen yeniden başlatıldıktan sonra yeniden görünür.

Örnek sıfırlamalar (gerektiğinde bundle ID'yi değiştirin):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Dosya ve klasör izinleri (Desktop/Documents/Downloads)

macOS, Desktop, Documents ve Downloads klasörlerini terminal/arka plan süreçleri için de kısıtlayabilir. Dosya okumaları veya dizin listelemeleri takılı kalıyorsa, dosya işlemlerini gerçekleştiren aynı süreç bağlamına erişim verin (örneğin Terminal/iTerm, LaunchAgent ile başlatılan uygulama veya SSH süreci).

Geçici çözüm: klasör bazında izin vermekten kaçınmak istiyorsanız dosyaları OpenClaw çalışma alanına (`~/.openclaw/workspace`) taşıyın.

İzinleri test ediyorsanız her zaman gerçek bir sertifikayla imzalayın. Ad-hoc
derlemeler yalnızca izinlerin önemli olmadığı hızlı yerel çalıştırmalar için kabul edilebilir.
