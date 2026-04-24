---
read_when:
    - Eksik veya takılı kalan macOS izin istemlerini hata ayıklama
    - macOS uygulamasını paketleme veya imzalama
    - Bundle ID'leri veya uygulama kurulum yollarını değiştirme
summary: macOS izin kalıcılığı (TCC) ve imzalama gereksinimleri
title: macOS izinleri
x-i18n:
    generated_at: "2026-04-24T09:20:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9ee8ee6409577094a0ba1bc4a50c73560741c12cbb1b3c811cb684ac150e05e
    source_path: platforms/mac/permissions.md
    workflow: 15
---

macOS izinleri kırılgandır. TCC bir izin onayını uygulamanın kod imzası, bundle tanımlayıcısı ve disk üzerindeki yolu ile ilişkilendirir. Bunlardan herhangi biri değişirse macOS uygulamayı yeni kabul eder ve istemleri düşürebilir veya gizleyebilir.

## Kalıcı izinler için gereksinimler

- Aynı yol: uygulamayı sabit bir konumdan çalıştırın (OpenClaw için `dist/OpenClaw.app`).
- Aynı bundle tanımlayıcısı: bundle ID'yi değiştirmek yeni bir izin kimliği oluşturur.
- İmzalı uygulama: imzasız veya ad-hoc imzalı yapılar izinleri kalıcı tutmaz.
- Tutarlı imza: imzanın yeniden derlemeler arasında kararlı kalması için gerçek bir Apple Development veya Developer ID sertifikası kullanın.

Ad-hoc imzalar her derlemede yeni bir kimlik üretir. macOS önceki
izinleri unutur ve eski girdiler temizlenene kadar istemler tamamen kaybolabilir.

## İstemler kaybolduğunda kurtarma kontrol listesi

1. Uygulamayı kapatın.
2. System Settings -> Privacy & Security içinde uygulama girdisini kaldırın.
3. Uygulamayı aynı yoldan yeniden başlatın ve izinleri tekrar verin.
4. İstem hâlâ görünmüyorsa `tccutil` ile TCC girdilerini sıfırlayın ve yeniden deneyin.
5. Bazı izinler yalnızca tam bir macOS yeniden başlatmasından sonra yeniden görünür.

Örnek sıfırlamalar (gerekirse bundle ID'yi değiştirin):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Dosyalar ve klasörler izinleri (Desktop/Documents/Downloads)

macOS, terminal/arka plan süreçleri için Desktop, Documents ve Downloads dizinlerini de geçitleyebilir. Dosya okumaları veya dizin listelemeleri takılıyorsa, dosya işlemlerini gerçekleştiren aynı süreç bağlamına erişim verin (örneğin Terminal/iTerm, LaunchAgent ile başlatılan uygulama veya SSH süreci).

Geçici çözüm: klasör başına izinlerden kaçınmak istiyorsanız dosyaları OpenClaw çalışma alanına (`~/.openclaw/workspace`) taşıyın.

İzinleri test ediyorsanız her zaman gerçek bir sertifikayla imzalayın. Ad-hoc
yapılar yalnızca izinlerin önemli olmadığı hızlı yerel çalıştırmalar için kabul edilebilir.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [macOS imzalama](/tr/platforms/mac/signing)
