---
read_when:
    - Mac menü kullanıcı arayüzünü veya durum mantığını ayarlama
summary: Menü çubuğu durum mantığı ve kullanıcılara nelerin gösterildiği
title: Menü çubuğu
x-i18n:
    generated_at: "2026-05-06T09:22:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: c569ced20b2f6a639d52d373cc8b55a42d7c015a0b234d5154ce67ac03c2eaf6
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## Gösterilenler

- Geçerli aracı çalışma durumunu menü çubuğu simgesinde ve menünün ilk durum satırında gösteririz.
- Çalışma etkinken sağlık durumu gizlenir; tüm oturumlar boştayken geri döner.
- Kök "Bağlam" alt menüsü, son oturumları doğrudan kök menüde genişletmek yerine içerir.
- Kök menüdeki "Node'lar" bloğu, istemci/varlık girdilerini değil, yalnızca **cihazları** (`node.list` aracılığıyla eşleştirilmiş node'lar) listeler.
- Sağlayıcı kullanım anlık görüntüleri mevcut olduğunda Bağlam'ın altında kök "Kullanım" bölümü görünür; mevcut olduğunda kullanım-maliyet ayrıntıları bunu izler.

## Durum modeli

- Oturumlar: olaylar, payload içinde `sessionKey` ile birlikte `runId` (çalıştırma başına) ile gelir. "main" oturumu `main` anahtarıdır; yoksa en son güncellenen oturuma geri döneriz.
- Öncelik: main her zaman kazanır. main etkinse durumu hemen gösterilir. main boştaysa en son etkin olan main dışı oturum gösterilir. Etkinlik sırasında gidip gelmeyiz; yalnızca geçerli oturum boşa geçtiğinde veya main etkin olduğunda geçiş yaparız.
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
- `workingMain`: glifli rozet, tam ton, bacak "çalışıyor" animasyonu.
- `workingOther`: glifli rozet, soluk ton, hızlı hareket yok.
- `overridden`: etkinlikten bağımsız olarak seçilen glifi/tonu kullanır.

## Bağlam alt menüsü

- Kök menü, oturum sayısı/durumu içeren bir "Bağlam" satırı gösterir ve bir alt menü açar.
- Bağlam alt menüsü başlığı, son 24 saat için etkin oturum sayısını gösterir.
- Her oturum satırı token çubuğunu, yaşı, önizlemeyi, düşünme/ayrıntılı modu, sıfırlama, compact ve silme eylemlerini korur.
- Yükleniyor, bağlantı kesildi ve oturum yükleme hatası mesajları Bağlam alt menüsünün içinde görünür.
- Sağlayıcı kullanımı ve kullanım-maliyet ayrıntıları Bağlam'ın altında kök düzeyde kalır; böylece alt menüyü açmadan hızlıca görülebilirler.

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
  - `exec`: `args.command` değerinin ilk satırı.
  - `read`/`write`: kısaltılmış yol.
  - `edit`: yol ve `meta`/diff sayılarından çıkarılan değişiklik türü.
  - geri dönüş: araç adı.

## Hata ayıklama geçersiz kılması

- Ayarlar ▸ Hata Ayıklama ▸ "Simge geçersiz kılması" seçici:
  - `System (auto)` (varsayılan)
  - `Working: main` (araç türü başına)
  - `Working: other` (araç türü başına)
  - `Idle`
- `@AppStorage("iconOverride")` üzerinden saklanır; `IconState.overridden` değerine eşlenir.

## Test kontrol listesi

- main oturum işi tetikle: simgenin hemen değiştiğini ve durum satırının main etiketini gösterdiğini doğrula.
- main boşta iken main dışı oturum işi tetikle: simge/durum main dışını gösterir; bitene kadar kararlı kalır.
- Diğeri etkinken main başlat: simge anında main'e döner.
- Hızlı araç patlamaları: rozetin titremediğinden emin ol (araç sonuçlarında TTL toleransı).
- Tüm oturumlar boşa geçtiğinde sağlık satırı yeniden görünür.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Menü çubuğu simgesi](/tr/platforms/mac/icon)
