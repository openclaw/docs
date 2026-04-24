---
read_when:
    - mac menü UI'ını veya durum mantığını ayarlama
summary: Menü çubuğu durum mantığı ve kullanıcılara nelerin gösterildiği
title: Menü çubuğu
x-i18n:
    generated_at: "2026-04-24T09:19:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89b03f3b0f9e56057d4cbf10bd1252372c65a2b2ae5e0405a844e9a59b51405d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# Menü Çubuğu Durum Mantığı

## Ne gösterilir

- Geçerli aracı iş durumunu menü çubuğu simgesinde ve menünün ilk durum satırında gösteriyoruz.
- Sağlık durumu, iş etkin olduğunda gizlenir; tüm oturumlar boştayken geri gelir.
- Menüdeki “Nodes” bloğu, istemci/presence girdilerini değil, yalnızca **cihazları** ( `node.list` üzerinden eşleştirilmiş Node'lar) listeler.
- Sağlayıcı kullanım anlık görüntüleri mevcut olduğunda Context altında bir “Usage” bölümü görünür.

## Durum modeli

- Oturumlar: olaylar `runId` (çalıştırma başına) ile birlikte payload içinde `sessionKey` ile gelir. “main” oturumu `main` anahtarıdır; yoksa en son güncellenen oturuma fallback yaparız.
- Öncelik: main her zaman kazanır. Main etkinse durumu hemen gösterilir. Main boşta ise en son etkin olan main olmayan oturum gösterilir. Etkinliğin ortasında flip-flop yapmayız; yalnızca geçerli oturum boşa geçtiğinde veya main etkin olduğunda değiştiririz.
- Etkinlik türleri:
  - `job`: üst düzey komut yürütme (`state: started|streaming|done|error`).
  - `tool`: `toolName` ve `meta/args` ile `phase: start|result`.

## IconState enum (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (hata ayıklama geçersiz kılması)

### `ActivityKind` → glif

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- varsayılan → 🛠️

### Görsel eşleme

- `idle`: normal yaratık.
- `workingMain`: glifli rozet, tam tonlama, bacak “çalışıyor” animasyonu.
- `workingOther`: glifli rozet, sönük tonlama, koşturma yok.
- `overridden`: etkinlikten bağımsız olarak seçilen glifi/tonlamayı kullanır.

## Durum satırı metni (menü)

- İş etkin olduğunda: `<Session role> · <activity label>`
  - Örnekler: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Boştayken: sağlık özetine fallback yapar.

## Olay alma

- Kaynak: denetim kanalı `agent` olayları (`ControlChannel.handleAgentEvent`).
- Ayrıştırılan alanlar:
  - başlat/durdur için `data.state` ile `stream: "job"`.
  - `data.phase`, `name`, isteğe bağlı `meta`/`args` ile `stream: "tool"`.
- Etiketler:
  - `exec`: `args.command` öğesinin ilk satırı.
  - `read`/`write`: kısaltılmış yol.
  - `edit`: yol artı `meta`/diff sayılarından çıkarılan değişiklik türü.
  - fallback: araç adı.

## Hata ayıklama geçersiz kılması

- Ayarlar ▸ Hata Ayıklama ▸ “Icon override” seçici:
  - `System (auto)` (varsayılan)
  - `Working: main` (araç türü başına)
  - `Working: other` (araç türü başına)
  - `Idle`
- `@AppStorage("iconOverride")` ile saklanır; `IconState.overridden` içine eşlenir.

## Test kontrol listesi

- Main oturumunda bir iş tetikleyin: simgenin hemen değiştiğini ve durum satırının main etiketini gösterdiğini doğrulayın.
- Main boştayken main olmayan bir oturum işi tetikleyin: simge/durum main olmayanı gösterir; bitene kadar kararlı kalır.
- Diğeri etkinken main'i başlatın: simge anında main'e döner.
- Hızlı araç patlamaları: rozetin titremediğinden emin olun (araç sonuçlarında TTL geçiş süresi).
- Tüm oturumlar boşa geçtiğinde sağlık satırı yeniden görünür.

## İlgili

- [macOS app](/tr/platforms/macos)
- [Menu bar icon](/tr/platforms/mac/icon)
