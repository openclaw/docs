---
read_when:
    - Mac menü kullanıcı arayüzünü veya durum mantığını ince ayarlama
summary: Menü çubuğu durum mantığı ve kullanıcılara gösterilenler
title: Menü çubuğu
x-i18n:
    generated_at: "2026-07-12T12:28:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 480a85f383a6495c0e45850a322c0c67c4cc35e21d2d29b4bd86f42fdbf9430a
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## Gösterilenler

- Mevcut ajan çalışma durumu, menü çubuğu simgesinde ve menünün ilk durum satırında görüntülenir.
- Çalışma etkinken sistem durumu gizlenir; tüm oturumlar boşta olduğunda yeniden görünür.
- Kök düzeyindeki "Bağlam" öğesi, oturumları kök menüde genişletmek yerine son oturumların bulunduğu bir alt menü açar.
- Kök menüdeki "Node'lar" bloğu, istemci/varlık girdilerini değil, yalnızca (`node.list` kaynağındaki) eşleştirilmiş **cihazları** listeler.
- Sağlayıcı kullanım anlık görüntüleri mevcut olduğunda Bağlam'ın altında kök düzeyinde bir "Kullanım" bölümü, varsa bunun ardından maliyet ayrıntıları görüntülenir.

## Durum modeli

- Kaynak: `WorkActivityStore` (`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`).
- Olaylar, bir `runId` ile `ControlAgentEvent` olarak gelir; işleyici (`ControlChannel.routeWorkActivity`), olay yükünden `sessionKey` değerini okur ve bu değer yoksa varsayılan olarak `"main"` kullanır.
- Öncelik: ana oturum (varsayılan olarak `sessionKey == "main"`) her zaman önceliklidir. Ana oturum etkinse durumu hemen gösterilir. Ana oturum boştaysa bunun yerine en son etkin olan ana oturum dışındaki oturum gösterilir. Depo, etkinlik sırasında geçiş yapmaz; yalnızca mevcut oturum boşa geçtiğinde veya ana oturum etkinleştiğinde geçiş yapar.
- Etkinlik türleri:
  - `job`: üst düzey komut yürütme (`state: started|streaming|done|error|...`).
  - `tool`: `name` ve isteğe bağlı `meta`/`args` ile `phase: start|result`.

## IconState numaralandırması (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (hata ayıklama geçersiz kılması)

### ActivityKind -> rozet sembolü

`ActivityKind`, bir `ToolKind` (`bash`, `read`, `write`, `edit`, `attach`, `other`) veya yalın bir `job` sarmalar. Her biri, yaratık simgesinin üzerine çizilen bir SF Symbols rozetine (`IconState.badgeSymbolName`) eşlenir:

| Tür             | Sembol                             |
| --------------- | ---------------------------------- |
| `bash`          | `chevron.left.slash.chevron.right` |
| `read`          | `doc`                              |
| `write`         | `pencil`                           |
| `edit`          | `pencil.tip`                       |
| `attach`        | `paperclip`                        |
| `other` / `job` | `gearshape.fill`                   |

### Görsel eşleme

- `idle`: normal yaratık, rozet yok.
- `workingMain`: sembollü rozet, tam renk tonu (`.primary` belirginliği), bacaklarda "çalışma" animasyonu.
- `workingOther`: sembollü rozet, soluk renk tonu (`.secondary` belirginliği), koşturma yok.
- `overridden`: gerçek etkinlikten bağımsız olarak seçilen sembolü/renk tonunu kullanır.

## Bağlam alt menüsü

- Kök menü, oturum sayısı/durumu içeren tek bir "Bağlam" satırı gösterir; bu satır bir alt menü (`MenuSessionsInjector`) açar.
- Alt menü başlığı, son 24 saatteki etkin oturum sayısını gösterir.
- Her oturum satırı; token çubuğunu, yaşını, önizlemesini, düşünme/ayrıntılı mod geçişini ve sıfırlama, sıkıştırma ve silme eylemlerini korur.
- Yükleniyor, bağlantı kesildi ve oturum yükleme hatası mesajları Bağlam alt menüsünde görüntülenir.
- Kullanım ve maliyet bölümleri, alt menüyü açmadan bir bakışta görülebilmeleri için Bağlam'ın altında kök düzeyinde kalır.

## Durum satırı metni (menü)

- Çalışma etkinken: `<Session role> · <activity label>` (`MenuContentView` içinde `"\(roleLabel) · \(activity.label)"`); burada rol etiketi `Main` veya `Other` olur.
- Boştayken: sistem durumu özetine geri döner.

## Olay alımı

- Kaynak: `ControlChannel.routeWorkActivity(from:)` tarafından yönlendirilen kontrol kanalı `agent` olayları.
- Ayrıştırılan alanlar:
  - Başlatma/durdurma için `data.state` ile `stream: "job"`.
  - `data.phase`, `data.name` ve isteğe bağlı `data.meta`/`data.args` ile `stream: "tool"`.
- Araç etiketleri `ToolDisplayRegistry.resolve(name:args:meta:)` üzerinden alınır; çözümlenemeyen adlar için ham araç adı kullanılır.

## Hata ayıklama geçersiz kılması

- Settings > Debug > "Icon override" seçicisi:
  - `System (auto)` (varsayılan)
  - `Working: main` / `Working: other` (araç türüne göre: bash, okuma, yazma, düzenleme, diğer)
  - `Idle`
- `UserDefaults` altındaki `openclaw.iconOverride` anahtarında saklanır; `IconState.overridden` ile eşlenir.

## Test kontrol listesi

- Ana oturum işini tetikleyin: simge hemen değişir ve durum satırı ana etiketi gösterir.
- Ana oturum boştayken ana olmayan bir oturum işini tetikleyin: simge/durum ana olmayan oturumu gösterir ve iş tamamlanana kadar sabit kalır.
- Başka bir oturum etkinken ana oturumu başlatın: simge anında ana oturuma geçer.
- Hızlı araç etkinliği serileri: rozet titremez (tamamlanan bir araç temizlenmeden önce 2 saniyelik bekleme aralığı, `WorkActivityStore.toolResultGrace`).
- Tüm oturumlar boşa geçtiğinde sistem durumu satırı yeniden görünür.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Menü çubuğu simgesi](/tr/platforms/mac/icon)
