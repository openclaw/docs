---
read_when:
    - Control UI içinde Kanban tarzı bir çalışma panosu istiyorsunuz
    - Paketlenmiş Workboard plugin'ini etkinleştiriyor veya devre dışı bırakıyorsunuz
    - Planlanan ajan çalışmalarını harici bir proje yöneticisi olmadan takip etmek istiyorsunuz
summary: Agent tarafından sahiplenilen kartlar ve oturum devri için isteğe bağlı pano çalışma tahtası
title: Çalışma panosu Plugin
x-i18n:
    generated_at: "2026-06-28T01:07:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caca6263b4ee08b36816ef6acdef506499c66b4d27f4f75551ac7784b2bf3324
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard Plugin, [Kontrol UI](/tr/web/control-ui) içine isteğe bağlı Kanban tarzı bir pano ekler. Bunu ajan ölçeğindeki iş kartlarını toplamak, bunları ajanlara atamak ve bağlantılı arka plan görevini, çalıştırmayı ve dashboard oturumunu tek bir karttan izlemek için kullanın.

Workboard bilinçli olarak küçük tutulmuştur. Bir OpenClaw Gateway için yerel işletim işlerini izler; GitHub Issues, Linear, Jira veya diğer ekip proje yönetim sistemlerinin yerine geçmez.

## Varsayılan durum

Workboard, paketlenmiş bir Plugin’dir ve Plugin yapılandırmasında etkinleştirmediğiniz sürece varsayılan olarak devre dışıdır.

Şununla etkinleştirin:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

Ardından dashboard’u açın:

```bash
openclaw dashboard
```

Workboard sekmesi dashboard gezintisinde görünür. Sekme görünürse ancak Plugin devre dışıysa veya `plugins.allow` / `plugins.deny` tarafından engellenmişse, görünüm yerel kart verileri yerine Plugin kullanılamıyor durumunu gösterir.

## Kartların içerdiği bilgiler

Her kart şunları saklar:

- başlık ve notlar
- durum: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`,
  `review`, `blocked` veya `done`
- öncelik: `low`, `normal`, `high` veya `urgent`
- etiketler
- isteğe bağlı ajan kimliği
- isteğe bağlı bağlantılı görev, çalıştırma, oturum veya kaynak URL’si
- karttan başlatılan bir Codex veya Claude çalıştırması için isteğe bağlı yürütme meta verileri
- denemeler, yorumlar, bağlantılar, kanıt, yapıtlar, otomasyon,
  ekler, çalışan günlükleri, çalışan protokol durumu, sahiplenmeler, tanılamalar,
  bildirimler, şablonlar, arşiv durumu ve bayat oturum algılama için kompakt meta veriler
- oluşturuldu, taşındı, bağlandı, sahiplenildi, Heartbeat,
  deneme, kanıt, yapıt, tanılama, bildirim, dispatch, arşiv, bayat
  veya ajan tarafından güncellendi değişiklikleri gibi son kart olayları

Kartlar Plugin’in Gateway durumunda saklanır. Gateway durum dizinine yereldir ve ilgili Gateway’in geri kalan OpenClaw durumuyla birlikte taşınır.

Workboard, operatörlerin bağlantılı oturumu açmadan bir kartın panoda nasıl ilerlediğini görebilmesi için kart başına kompakt meta veriler tutar. Olaylar, deneme özetleri, kanıt parçaları, ilişkili bağlantılar, yorumlar, arşiv işaretçileri ve bayat oturum işaretçileri bilinçli olarak yerel meta verilerdir; oturum dökümlerinin veya GitHub issue geçmişinin yerini almazlar.

## Kart yürütmeleri ve görevler

Bağlantısız kartlar işi karttan başlatabilir. Otonom başlatmalar Gateway’in görev izlemeli ajan çalıştırma yolunu kullanır, ardından Workboard ortaya çıkan görevi, çalıştırma kimliğini ve oturum anahtarını karta geri bağlar. Başlatma, Gateway’in yapılandırılmış varsayılan ajanını ve modelini kullanır. Codex ve Claude eylemleri isteğe bağlı açık model seçimleridir:

- Run Codex veya Run Claude, görev destekli bir ajan çalıştırması başlatır, kart istemini gönderir ve kartı `running` olarak işaretler.
- Open Codex veya Open Claude, kart istemini göndermeden ya da kartı taşımadan bağlantılı bir dashboard oturumu oluşturur; böylece karta bağlı kalırken elle çalışabilirsiniz.

Yürütme meta verileri seçilen motoru, modu, model referansını, oturum anahtarını, çalıştırma kimliğini, varsa görev kimliğini ve yaşam döngüsü durumunu kartta saklar. Codex yürütmeleri `openai/gpt-5.5` kullanır; Claude yürütmeleri
`anthropic/claude-sonnet-4-6` kullanır.

Her bağlantılı yürütme aynı kart kaydına bir deneme özeti de kaydeder. Deneme özeti motoru, modu, modeli, çalıştırma kimliğini, zaman damgalarını, durumu ve kayan hata sayısını tutar; böylece tekrarlanan hatalar panoda görünür kalır.

Dashboard, Gateway görev defterinden görev durumunu yeniler ve görevleri görev kimliği, çalıştırma kimliği veya bağlantılı oturum anahtarıyla kartlarla eşleştirir. Bir görev kuyruğa alınmış veya çalışıyorsa kart yaşam döngüsü etkin görev durumunu gösterir. Görev biterse, başarısız olursa, zaman aşımına uğrarsa veya iptal edilirse kart yaşam döngüsü, bağlantılı oturumlarla aynı yaşam döngüsü eşitlemesini kullanarak review veya blocked durumuna doğru ilerler.

## Ajan koordinasyonu

Workboard ayrıca pano farkındalığı olan iş akışları için isteğe bağlı ajan araçları sunar:

- `workboard_list`, isteğe bağlı pano filtresiyle birlikte sahiplenme ve tanılama durumuna sahip kompakt kartları listeler.
- `workboard_read`, notlardan, denemelerden, yorumlardan, bağlantılardan, kanıttan, yapıtlardan, üst sonuçlardan, son atanan çalışmalarından ve etkin tanılamalardan oluşturulan sınırlı çalışan bağlamıyla birlikte bir kart döndürür.
- `workboard_create`, isteğe bağlı üst kartlar, kiracı, Skills,
  pano, çalışma alanı meta verileri, idempotency anahtarı, çalışma süresi sınırı ve yeniden deneme bütçesiyle bir kart oluşturur.
- `workboard_link`, bir üst kartı bir alt karta bağlar. Alt kartlar, her üst kart `done` durumuna ulaşana kadar `todo` içinde kalır; ardından dispatch yükseltmesi onları `ready` durumuna taşır.
- `workboard_claim`, çağıran ajan için bir kartı sahiplenir ve backlog, todo veya ready kartlarını `running` durumuna taşır.
- `workboard_heartbeat`, daha uzun çalıştırmalar sırasında sahiplenme Heartbeat’ini yeniler.
- `workboard_release`, tamamlanma, duraklama veya devretme sonrasında sahiplenmeyi serbest bırakır ve kartı bir sonraki duruma taşıyabilir.
- `workboard_complete` ve `workboard_block`, nihai özetler, kanıt, yapıtlar, oluşturulan kart manifestleri ve engelleyici nedenleri için yapılandırılmış yaşam döngüsü araçlarıdır. Oluşturulan kart manifestleri, tamamlanan karta geri bağlanmış kartlara referans vermelidir; bu, hayalet alt kartları özetlerin dışında tutar.
- `workboard_attachment_add`, `workboard_attachment_read` ve
  `workboard_attachment_delete`, küçük kart eklerini Plugin SQLite durumunda saklar, bunları kartta dizine ekler ve çalışan bağlamında sunar.
- `workboard_worker_log` ve `workboard_protocol_violation`, çalışan günlük satırlarını kaydeder ve otomatik bir çalışan `workboard_complete` veya `workboard_block` çağırmadan durduğunda kartları engeller.
- `workboard_board_create`, `workboard_board_archive` ve
  `workboard_board_delete`, görüntü adı, açıklama, arşiv durumu ve varsayılan çalışma alanı gibi kalıcı pano meta verilerini yönetir.
- `workboard_runs`, bir kartta saklanan kalıcı çalıştırma-deneme geçmişini döndürür.
- `workboard_specify`, kaba bir triage veya backlog kartını netleştirilmiş bir `todo` kartına dönüştürür ve belirtim özetini karta kaydeder.
- `workboard_decompose`, bir üst orkestrasyon kartını bağlantılı alt kartlara yayar,
  pano ve kiracı meta verilerini devralır ve üst kartı oluşturulan kart manifestiyle tamamlayabilir.
- `workboard_notify_subscribe`, `workboard_notify_list`,
  `workboard_notify_events`, `workboard_notify_advance` ve
  `workboard_notify_unsubscribe`, bildirim aboneliklerini Plugin durumunda yönetir. Olay okumaları tekrar oynatmaya güvenlidir; advance aracı dayanıklı imleci taşır, böylece çağıranlar tamamlanan, başarısız olan veya bayat kart olaylarını kaybetmeden ya da çift okumadan devam edebilir.
- `workboard_boards`, `workboard_stats`, `workboard_promote`,
  `workboard_reassign`, `workboard_reclaim`, `workboard_comment`,
  `workboard_proof`, `workboard_unblock` ve `workboard_dispatch`, bir ajanın
  pano ad alanlarını incelemesini, kuyruk istatistiklerini görüntülemesini, takılmış işleri kurtarmasını, devir notları eklemesini, kanıt veya yapıt referansları iliştirmesini, engellenmiş işi tekrar `todo` durumuna taşımasını ve bağımlılık yükseltmesini veya bayat sahiplenme temizliğini tetiklemesini sağlar.

Sahiplenilmiş kartlar, çağıranın `workboard_claim` tarafından döndürülen sahiplenme belirtecine sahip olmadığı sürece diğer ajanlardan gelen ajan-aracı mutasyonlarını reddeder. Dashboard operatörleri hâlâ normal Gateway RPC yüzeyini kullanır ve kartları kurtarabilir veya yeniden atayabilir.

Workboard, dayanıklı pano verilerini OpenClaw durum dizini altında Plugin’e ait ilişkisel SQLite veritabanında saklar. Panolar, kartlar, etiketler, yaşam döngüsü olayları, çalıştırma denemeleri, yorumlar, bağımlılık bağlantıları, kanıt, yapıt referansları,
ek meta verileri ve blob’ları, tanılamalar, bildirimler, çalışan günlükleri,
protokol durumu ve abonelikler Plugin anahtar-değer girdileri yerine Workboard tablolarında kalıcılaştırılır. Bir kart dışa aktarımı, ek blob içeriklerini satır içine almadan pano anlatısını yine de korur.

`.28` sürümünde Workboard kullanan kurulumlar, gönderilmiş eski Plugin durum ad alanlarını (`workboard.cards`, `workboard.boards` ve `workboard.notify`) ilişkisel veritabanına geçirmek için
`openclaw doctor --fix` çalıştırabilir. Eski bir `workboard.attachments` ad alanı varsa doctor bu ek blob’larını da geçirir.

Workboard tanılamaları yerel kart meta verilerinden hesaplanır. Yerleşik kontroller çok uzun bekleyen atanmış kartları, yakın zamanda Heartbeat almamış çalışan kartları, dikkat gerektiren engellenmiş kartları, tekrarlanan hataları, kanıtsız done kartlarını ve yalnızca gevşek bir oturum bağlantısı olan çalışan kartları işaretler.

Dispatch bilinçli olarak Gateway’e yereldir. Keyfi işletim sistemi süreçleri başlatmaz; normal OpenClaw alt ajan oturumları yürütmeye sahip olmaya devam eder. Dispatch eylemi bağımlılıkları hazır kartları yükseltir, ready kartlara dispatch meta verileri kaydeder, süresi dolmuş sahiplenmeleri veya zaman aşımına uğramış çalıştırmaları engeller, pano yapılandırmalı triage kartlarını orkestrasyon adayları olarak işaretler, ardından küçük bir ready kart grubunu sahiplenir ve Gateway alt ajan çalışma zamanı üzerinden çalışan çalıştırmaları başlatır. Atanmış kartlar `agent:<id>:subagent:workboard-*` çalışan oturum anahtarlarını kullanır; atanmamış kartlar kapsamlandırılmamış `subagent:workboard-*` anahtarlarını kullanır, böylece Gateway yapılandırılmış varsayılan ajanı yine çözer. Çalışanlar, Workboard araçları üzerinden kart için Heartbeat göndermek, kartı tamamlamak veya engellemek için ihtiyaç duydukları sahiplenme belirteciyle birlikte sınırlı kart bağlamı alır.

### Dispatch çalışan seçimi

Her dispatch geçişi varsayılan olarak en fazla üç çalışan başlatır. Ready kartlar önceliğe, konuma ve oluşturulma zamanına göre sıralanır, ardından yinelenen etkin sahipliği önlemek için filtrelenir. Bir dispatch aynı geçişte belirli bir sahip veya ajan için yalnızca bir kart başlatır ve panoda zaten running veya review işi olan sahipleri atlar.

Arşivlenmiş kartlar, etkin sahiplenmesi olan kartlar ve `ready` durumunda olmayan kartlar çalışan başlatmaları için seçilmez. Bayat sahiplenmeler, bağımlılık yükseltmesi veya zaman aşımı temizliği geçerliyse dispatch’in veri tarafı bunları yine de etkileyebilir.

### Çalışan istemi ve yaşam döngüsü

Çalışan istemi kart başlığını, sınırlı notları ve bağlamı, atanmış panoyu ve Workboard çalışan protokolünü içerir. Ayrıca sahiplenme sahibini ve sahiplenme belirtecini içerir; böylece çalışan, başka bir aktör kartı devralmadan `workboard_heartbeat`,
`workboard_complete` veya `workboard_block` çağırabilir.

Bir çalışan başarıyla başladığında Workboard oturum anahtarını, çalıştırma kimliğini,
motoru, modu, model etiketini, durumu ve çalışan günlüğünü kartta saklar. Oturum anahtarı pano ve kart için deterministiktir; bu, tekrarlanan dispatch işlemlerinin ilgisiz oturumlar oluşturmak yerine aynı çalışan hattına geri yönlenmesini sağlar.

Bir kart sahiplenildikten sonra çalışan başlatılamazsa Workboard kartı engeller,
sahiplenmeyi temizler, çalıştırma başlatma hatasını kaydeder ve bir çalışan günlük satırı ekler. Bu hata dashboard’da, CLI JSON’da, ajan araçlarında ve kart tanılamalarında görünür.

### Dispatch giriş noktaları

Ready kart çalışan başlatmaları şuradan gerçekleşebilir:

- dashboard dispatch eylemi
- `openclaw workboard dispatch`
- komut destekli bir kanalda `/workboard dispatch`

Üç giriş noktası da Gateway kullanılabilir olduğunda Gateway alt ajan çalışma zamanını kullanır. CLI’ın fazladan bir operatör geri dönüşü vardır: Gateway çevrimdışıysa veya Workboard dispatch yöntemini sunmuyorsa ve açık bir `--url` veya
`--token` hedefi sağlanmamışsa, yerel SQLite durumuna karşı yalnızca veri dispatch çalıştırır. Bu geri dönüş bağımlılıkları yükseltebilir, bayat sahiplenmeleri temizleyebilir ve zaman aşımına uğramış çalıştırmaları engelleyebilir, ancak çalışan başlatamaz.

Pano meta verileri `autoDecompose`,
`autoDecomposePerDispatch`, `defaultAssignee` ve `orchestratorProfile` gibi orkestrasyon ayarlarını içerebilir. OpenClaw orkestrasyon niyetini kaydeder ve bunu çalışan bağlamında sunar; asıl belirtim ve ayrıştırma yine normal Workboard araçları üzerinden gerçekleşir.

## CLI ve eğik çizgi komutu

Plugin bir kök CLI komutu kaydeder:

```bash
openclaw workboard list
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id>
openclaw workboard dispatch
```

`openclaw workboard dispatch`, çalışan Gateway'i çağırır; böylece worker başlangıçları
dashboard ile aynı subagent runtime'ını kullanır. Gateway kullanılamıyorsa,
dependency promotion, stale-claim cleanup ve timeout blocking işlemleri yine de
çalışabilsin diye yalnızca veriyle dispatch yapmaya geri döner. Auth, permission
ve validation hataları komut hataları olarak görünmeye devam eder; açık
`--url` veya `--token` hedeflerine yönelik hatalar da aynı şekilde görünür.

`/workboard` slash komutu aynı kompakt operatör yolunu destekler:
`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>` ve
`/workboard dispatch`. List ve show, yetkili komut gönderenler için okuma
işlemleridir. Create ve dispatch, sohbet yüzeylerinde owner durumu ya da
`operator.write` veya `operator.admin` yetkisine sahip bir Gateway istemcisi
gerektirir.

Komut bayrakları, JSON çıktısı, Gateway fallback davranışı, belirsiz olmayan
id öneki işleme, dispatch seçim kuralları ve sorun giderme için
[Workboard CLI](/tr/cli/workboard) bölümüne bakın.

## Oturum yaşam döngüsü senkronizasyonu

Kartlar, mevcut dashboard oturumlarına veya bir karttan çalışmayı başlattığınızda
oluşturulan oturuma bağlanabilir. Bağlı kartlar oturum yaşam döngüsünü satır
içinde gösterir: çalışıyor, stale, bağlı boşta, tamamlandı, başarısız veya eksik.

Bağlı oturum eksikse, kart bağlam için bağlı kalır ve çalışmayı yeni bir
dashboard oturumunda yeniden başlatabilmeniz için başlatma kontrollerini sunmaya
devam eder. Etkin bir bağlı oturum yakın tarihli etkinlik bildirmeyi durdurursa,
Workboard kartı stale olarak işaretler ve yaşam döngüsü bunu temizleyene kadar
işareti kart metadata'sı olarak saklar.

Mevcut bir dashboard oturumunu Sessions sekmesinden Workboard'a Ekle ile de
yakalayabilirsiniz. Kart bu oturuma bağlanır, başlık olarak oturum etiketini
veya yakın tarihli kullanıcı istemini kullanır ve sohbet geçmişi mevcut olduğunda
yakın tarihli kullanıcı istemi ile en son assistant yanıtından notları başlatır.

Workboard, kart hâlâ etkin bir çalışma durumundayken bağlı oturumu izler:

- etkin bağlı oturum -> `running`
- tamamlanmış bağlı oturum -> `review`
- başarısız, öldürülmüş, zaman aşımına uğramış veya iptal edilmiş bağlı oturum -> `blocked`

Manuel review durumları önceliklidir. Bir kartı `review`, `blocked` veya `done`
durumuna taşırsanız, Workboard siz kartı tekrar `todo` veya `running` durumuna
taşıyana kadar o kartı otomatik taşımayı durdurur.

## Dashboard iş akışı

1. Control UI içinde Workboard sekmesini açın.
2. Başlık, notlar, öncelik, etiketler, isteğe bağlı ajan ve isteğe bağlı bağlı
   oturum içeren bir kart oluşturun.
3. Ya da Sessions'ı açıp mevcut bir oturum için Workboard'a Ekle'yi seçin.
4. Kartı sütunlar arasında sürükleyin veya karttaki kompakt durum kontrolüne
   odaklanıp menüsünü ya da ArrowLeft/ArrowRight kullanın.
5. Bir dashboard oturumu oluşturmak veya yeniden kullanmak için çalışmayı karttan
   başlatın.
6. Ajan çalışırken bağlı oturumu karttan açın.
7. Yaşam döngüsü senkronizasyonunun çalışan işi review veya blocked durumuna
   taşımasına izin verin, ardından kabul edildiğinde kartı manuel olarak done
   durumuna taşıyın.

Bir kartı başlatmak normal Gateway oturumlarını kullanır. Workboard Plugin'i
yalnızca kart metadata'sını ve bağlantıları saklar; konuşma transcript'i, model
seçimi ve run yaşam döngüsü normal oturum sistemine ait kalır.

Canlı bağlı bir kartta Stop kullanarak etkin oturum run'ını iptal edin.
Workboard, takip için görünür kalması amacıyla bu kartı `blocked` olarak işaretler.

Yeni kartlar bugfix'ler, docs, release'ler, PR review'ları veya Plugin çalışması
için Workboard şablonlarından başlayabilir. Şablonlar başlık, notlar, etiketler
ve önceliği önceden doldurur; seçilen şablon id'si kart metadata'sı olarak
saklanır.

## İzinler

Plugin, Gateway RPC yöntemlerini `workboard.*` namespace'i altında kaydeder:

- `workboard.cards.list`, `operator.read` gerektirir
- `workboard.cards.export`, `operator.read` gerektirir
- `workboard.cards.diagnostics`, `operator.read` gerektirir
- `workboard.cards.diagnostics.refresh`, `operator.write` gerektirir
- attachment list/get ve notification event okumaları `operator.read` gerektirir
- notification cursor ilerletme `operator.write` gerektirir
- create, update, move, delete, comment, link, dependency link, proof, artifact,
  attachment add/delete, worker log, protocol violation, claim, heartbeat,
  release, complete, block, unblock, dispatch, bulk ve archive yöntemleri
  `operator.write` gerektirir

Salt okunur operatör erişimiyle bağlanan tarayıcılar panoyu inceleyebilir, ancak
kartları değiştiremez.

## Yapılandırma

Workboard'un bugün Plugin'e özgü bir config'i yoktur. Standart Plugin girdisiyle
etkinleştirin veya devre dışı bırakın:

```json5
{
  plugins: {
    entries: {
      workboard: {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Tekrar devre dışı bırakmak için:

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Sorun giderme

### Sekme Workboard kullanılamıyor diyor

Plugin policy'sini kontrol edin:

```bash
openclaw plugins inspect workboard --runtime --json
```

`plugins.allow` yapılandırılmışsa, bu allowlist'e `workboard` ekleyin.
`plugins.deny`, `workboard` içeriyorsa Plugin'i etkinleştirmeden önce kaldırın.

### Kartlar kaydedilmiyor

Tarayıcı bağlantısının `operator.write` erişimine sahip olduğunu doğrulayın.
Salt okunur operatör oturumları kartları listeleyebilir, ancak onları oluşturamaz,
düzenleyemez, taşıyamaz veya silemez.

### Bir kartı başlatmak beklenen oturumu açmıyor

Workboard normal dashboard oturumlarına bağlantılar oluşturur. Kartın ajan id'sini
ve bağlı oturumu kontrol edin, ardından gerçek run durumunu incelemek için
Sessions veya Chat görünümünü açın.

### Dispatch bir worker başlatmıyor

Etkin claim'i olmayan en az bir `ready` kart bulunduğunu doğrulayın:

```bash
openclaw workboard list --status ready
```

CLI yalnızca veriyle dispatch bildiriyorsa, Gateway'i başlatın veya yeniden
başlatın ve tekrar deneyin. Yalnızca veriyle dispatch yerel pano durumunu
günceller, ancak subagent worker run'larını başlatamaz.

Aynı owner veya ajan için başka bir kart zaten çalışıyorsa ya da review bekliyorsa,
kartlar atlanabilir. Aynı owner için daha fazla çalışma dispatch etmeden önce bu
etkin çalışmayı tamamlayın, block edin veya release edin.

## İlgili

- [Control UI](/tr/web/control-ui)
- [Workboard CLI](/tr/cli/workboard)
- [Plugin'ler](/tr/tools/plugin)
- [Plugin'leri yönet](/tr/plugins/manage-plugins)
- [Oturumlar](/tr/concepts/session)
