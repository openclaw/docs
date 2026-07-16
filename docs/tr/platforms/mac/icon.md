---
read_when:
    - Menü çubuğu simgesi davranışını değiştirme
summary: macOS'te OpenClaw için menü çubuğu simgesi durumları ve animasyonları
title: Menü çubuğu simgesi
x-i18n:
    generated_at: "2026-07-16T17:36:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8a38f1253f0c376ef2ce6c0ae339b67084c472c764964bcc7ad21e10133e2b47
    source_path: platforms/mac/icon.md
    workflow: 16
---

# Menü Çubuğu Simgesi Durumları

Kapsam: macOS uygulaması (`apps/macos`). İşleme: `CritterIconRenderer.makeIcon(...)`. Animasyon/durum bağlantıları: `CritterStatusLabel` + `CritterStatusLabel+Behavior.swift`.

## Durumlar

| Durum                 | Tetikleyici                               | Görsel                                                                                              |
| --------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Boşta                 | Varsayılan                                | Normal göz kırpma/kıpırdama animasyonu; açık gözlerde parlak bir ışıltı korunur                     |
| Duraklatıldı          | `isPaused=true`                        | Antenler açık gözlerle aşağı sarkar ("görev dışı"); hareket yoktur                                  |
| Uyuyor                | Gateway bağlantısı kesilmiş/yapılandırılmamış | Antenler aşağı sarkar ve gözler kapanarak `⌣ ⌣` göz kapaklarına dönüşür; hareket yoktur |
| Kutlama               | Mesaj gönderildi (`sendCelebrationTick`)     | Gözler ~0.9s boyunca mutlu `∩ ∩` yayları şeklinde parlar ve buna bir bacak tekmesi eşlik eder |
| Sesle uyandırma (büyük kulaklar) | Uyandırma sözcüğü duyuldu        | Antenler dikleşip uzar (`earScale=1.9`); sessizlikten sonra eski hâline döner                   |
| Çalışıyor             | `isWorking=true` veya etkin bir `IconState` | Daha hızlı bacak kıpırdaması (`legWiggle` değerinden `1.0` değerine kadar) ve küçük bir yatay kayma; boşta kıpırdamasına eklenir |

Bir oturumda etkin bir iş veya araç olduğunda, aynı yaratık simgesinin üzerinde bir araç etkinliği rozeti (SF Symbol diski; ör. exec için `chevron.left.slash.chevron.right`) görüntülenebilir. Bu rozet `IconState`/`ActivityKind` kaynağından gelir; tam durum modeli için [Menü çubuğu](/tr/platforms/mac/menu-bar) sayfasına bakın.

## Sesle uyandırma kulakları

- Tetikleyici: Sesle uyandırma yakalama işlem hattından (`VoiceWakeRuntime`) ve sesle uyandırma hata ayıklama/test araçlarından (`VoiceWakeTester`, `VoiceWakeOverlayController`) çağrılan `AppStateStore.shared.triggerVoiceEars(ttl: nil)`.
- Durdurma: Yakalama tamamlandığında çağrılan `stopVoiceEars()`.
- Tamamlamadan önceki sessizlik aralığı: normalde `2.0s`; yalnızca tetikleyici sözcük duyulduysa ve ardından başka bir konuşma gelmediyse `5.0s` (`VoiceWakeRuntime.silenceWindow` / `triggerOnlySilenceWindow`).
- Güçlendirme etkinken boşta göz kırpma/kıpırdama/bacak/kulak zamanlayıcıları askıya alınır (`earBoostActive`, `CritterStatusLabel+Behavior` içindeki animasyon görevini denetler).

## Şekiller ve boyutlar

- Tuval: 18x18pt şablon görüntü, simgenin Retina ekranda keskin kalması için 36x36px bit eşlemli arka depoya (2x) işlenir.
- Kulak ölçeğinin varsayılanı `1.0`; ses güçlendirmesi genel çerçeveyi değiştirmeden `earScale=1.9` değerini ayarlar.
- `antennaDroop` (0-1), duraklatılmış ve uyuyan pozlar için antenleri aşağı katlar.
- Bacak koşuşturması, küçük bir yatay titremeyle birlikte `legWiggle` değerinden `1.0` değerine kadar olan aralığı kullanır.

## Davranış notları

- Kulaklar veya çalışma durumu için harici CLI/aracı anahtarı yoktur; yanlışlıkla gidip gelmelerini önlemek amacıyla ikisi de uygulama sinyalleri (`AppState.setWorking`, `AppState.triggerVoiceEars`) tarafından dâhilî olarak yönetilir.
- Bir iş takılı kalırsa simgenin hızla temel duruma dönebilmesi için yeni TTL değerlerini kısa (10s değerinin oldukça altında) tutun.

## İlgili

- [Menü çubuğu](/tr/platforms/mac/menu-bar)
- [macOS uygulaması](/tr/platforms/macos)
