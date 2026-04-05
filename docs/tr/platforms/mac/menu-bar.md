---
read_when:
    - Mac menü UI'si veya durum mantığı ayarlanırken
summary: Menü çubuğu durum mantığı ve kullanıcılara gösterilenler
title: Menü Çubuğu
x-i18n:
    generated_at: "2026-04-05T14:00:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8eb73c0e671a76aae4ebb653c65147610bf3e6d3c9c0943d150e292e7761d16d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# Menü Çubuğu Durum Mantığı

## Gösterilenler

- Geçerli aracı çalışma durumunu menü çubuğu simgesinde ve menünün ilk durum satırında gösteririz.
- Sağlık durumu, çalışma etkinken gizlenir; tüm oturumlar boşta olduğunda geri gelir.
- Menüdeki “Nodes” bloğu, istemci/mevcudiyet girdilerini değil yalnızca **cihazları** (`node.list` üzerinden eşleştirilmiş düğümler) listeler.
- Sağlayıcı kullanım anlık görüntüleri mevcut olduğunda Context altında bir “Usage” bölümü görünür.

## Durum modeli

- Oturumlar: olaylar `runId` (çalıştırma başına) ile birlikte yükte `sessionKey` ile gelir. “main” oturumu `main` anahtarıdır; yoksa en son güncellenen oturuma geri döneriz.
- Öncelik: main her zaman kazanır. main etkinken durumu hemen gösterilir. main boşta ise, en son etkin olan main olmayan oturum gösterilir. Etkinlik sırasında ileri geri geçiş yapmayız; yalnızca geçerli oturum boşta olduğunda veya main etkin olduğunda geçiş yaparız.
- Etkinlik türleri:
  - `job`: üst düzey komut yürütme (`state: started|streaming|done|error`).
  - `tool`: `toolName` ve `meta/args` ile `phase: start|result`.

## IconState enum (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (hata ayıklama geçersiz kılması)

### ActivityKind → glif

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- varsayılan → 🛠️

### Görsel eşleme

- `idle`: normal critter.
- `workingMain`: glifli rozet, tam renk tonu, bacak “working” animasyonu.
- `workingOther`: glifli rozet, soluk renk tonu, scurry yok.
- `overridden`: etkinlikten bağımsız olarak seçilen glifi/renk tonunu kullanır.

## Durum satırı metni (menü)

- Çalışma etkinken: `<Session role> · <activity label>`
  - Örnekler: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Boştayken: sağlık özetine geri döner.

## Olay alımı

- Kaynak: kontrol kanalı `agent` olayları (`ControlChannel.handleAgentEvent`).
- Ayrıştırılan alanlar:
  - başlatma/durdurma için `data.state` ile `stream: "job"`.
  - `data.phase`, `name`, isteğe bağlı `meta`/`args` ile `stream: "tool"`.
- Etiketler:
  - `exec`: `args.command` öğesinin ilk satırı.
  - `read`/`write`: kısaltılmış yol.
  - `edit`: yol artı `meta`/diff sayılarından çıkarılan değişiklik türü.
  - geri dönüş: araç adı.

## Hata ayıklama geçersiz kılması

- Ayarlar ▸ Debug ▸ “Icon override” seçici:
  - `System (auto)` (varsayılan)
  - `Working: main` (araç türü başına)
  - `Working: other` (araç türü başına)
  - `Idle`
- `@AppStorage("iconOverride")` üzerinden depolanır; `IconState.overridden` ile eşlenir.

## Test kontrol listesi

- Main oturumu job tetikleyin: simgenin hemen değiştiğini ve durum satırının main etiketini gösterdiğini doğrulayın.
- Main boşta iken main olmayan bir oturum job tetikleyin: simge/durum main olmayanı gösterir; bitene kadar sabit kalır.
- Diğeri etkinken main başlatın: simge anında main'e döner.
- Hızlı araç patlamaları: rozetin titremediğinden emin olun (araç sonuçlarında TTL toleransı).
- Tüm oturumlar boşta olduğunda sağlık satırı yeniden görünür.
