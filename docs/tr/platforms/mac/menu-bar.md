---
read_when:
    - Mac menüsü arayüzünde veya durum mantığında ince ayar yapma
summary: Menü çubuğu durum mantığı ve kullanıcılara gösterilenler
title: Menü çubuğu
x-i18n:
    generated_at: "2026-05-01T09:02:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 340b86a2e222fb1fe7fda4f0f0434127af1393a64348ea033ea284ba52866beb
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

# Menü Çubuğu Durum Mantığı

## Gösterilenler

- Mevcut ajan çalışma durumunu menü çubuğu simgesinde ve menünün ilk durum satırında gösteririz.
- Çalışma etkinken sağlık durumu gizlenir; tüm oturumlar boştayken geri döner.
- Kök “Bağlam” alt menüsü, son oturumları doğrudan kök menüde genişletmek yerine içerir.
- Kök menüdeki “Node'lar” bloğu yalnızca **cihazları** listeler (`node.list` üzerinden eşleştirilmiş Node'lar); istemci/varlık girdilerini listelemez.
- Sağlayıcı kullanım anlık görüntüleri mevcut olduğunda Bağlam'ın altında kök “Kullanım” bölümü görünür; mevcutsa bunu kullanım maliyeti ayrıntıları izler.

## Durum modeli

- Oturumlar: olaylar yük içinde `runId` (çalıştırma başına) ve `sessionKey` ile gelir. “Ana” oturum `main` anahtarıdır; yoksa en son güncellenen oturuma geri döneriz.
- Öncelik: ana her zaman kazanır. Ana etkinse durumu hemen gösterilir. Ana boştaysa en son etkin olan ana olmayan oturum gösterilir. Etkinlik ortasında sürekli gidip gelmeyiz; yalnızca geçerli oturum boşa geçtiğinde veya ana etkin olduğunda geçiş yaparız.
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

- `idle`: normal karakter.
- `workingMain`: glifli rozet, tam renk tonu, bacak “çalışıyor” animasyonu.
- `workingOther`: glifli rozet, soluk renk tonu, koşuşturma yok.
- `overridden`: etkinlikten bağımsız olarak seçilen glifi/renk tonunu kullanır.

## Bağlam alt menüsü

- Kök menü, oturum sayısı/durumuyla birlikte tek bir “Bağlam” satırı gösterir ve bir alt menü açar.
- Bağlam alt menüsü başlığı, son 24 saatin etkin oturum sayısını gösterir.
- Her oturum satırı kendi token çubuğunu, yaşını, önizlemesini, düşünme/ayrıntılı modunu, sıfırlama, compact ve silme eylemlerini korur.
- Yükleme, bağlantı kesildi ve oturum yükleme hatası mesajları Bağlam alt menüsünde görünür.
- Sağlayıcı kullanımı ve kullanım maliyeti ayrıntıları, alt menüyü açmadan hızlıca görülebilmeleri için Bağlam'ın altında kök düzeyinde kalır.

## Durum satırı metni (menü)

- Çalışma etkinken: `<Session role> · <activity label>`
  - Örnekler: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Boştayken: sağlık özetine geri döner.

## Olay alımı

- Kaynak: control-channel `agent` olayları (`ControlChannel.handleAgentEvent`).
- Ayrıştırılan alanlar:
  - Başlatma/durdurma için `data.state` ile `stream: "job"`.
  - `data.phase`, `name`, isteğe bağlı `meta`/`args` ile `stream: "tool"`.
- Etiketler:
  - `exec`: `args.command` öğesinin ilk satırı.
  - `read`/`write`: kısaltılmış yol.
  - `edit`: yol artı `meta`/diff sayımlarından çıkarılan değişiklik türü.
  - geri dönüş: araç adı.

## Hata ayıklama geçersiz kılması

- Ayarlar ▸ Hata Ayıklama ▸ “Simge geçersiz kılması” seçici:
  - `System (auto)` (varsayılan)
  - `Working: main` (araç türü başına)
  - `Working: other` (araç türü başına)
  - `Idle`
- `@AppStorage("iconOverride")` üzerinden saklanır; `IconState.overridden` değerine eşlenir.

## Test kontrol listesi

- Ana oturum işini tetikleyin: simgenin hemen değiştiğini ve durum satırının ana etiketi gösterdiğini doğrulayın.
- Ana boştayken ana olmayan oturum işini tetikleyin: simge/durum ana olmayanı gösterir; bitene kadar kararlı kalır.
- Diğeri etkinken anayı başlatın: simge anında anaya döner.
- Hızlı araç patlamaları: rozetin titremediğinden emin olun (araç sonuçlarında TTL ek süresi).
- Tüm oturumlar boşa geçtiğinde sağlık satırı yeniden görünür.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Menü çubuğu simgesi](/tr/platforms/mac/icon)
