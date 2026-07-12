---
read_when:
    - Control UI'da Kanban tarzı bir çalışma panosu istiyorsunuz
    - Paketle birlikte gelen Workboard Pluginini etkinleştiriyor veya devre dışı bırakıyorsunuz
    - Planlanan ajan çalışmalarını harici bir proje yöneticisi kullanmadan takip etmek istiyorsunuz
summary: Agent tarafından yönetilen kartlar ve oturum devri için isteğe bağlı gösterge panosu çalışma alanı
title: Workboard plugin'i
x-i18n:
    generated_at: "2026-07-12T12:37:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b647fa702f629c26335d301899edfab3104f0a5cb6995e646901845d7ad4357f
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard Plugin'i, [Kontrol Arayüzü](/tr/web/control-ui)'ne isteğe bağlı Kanban tarzı bir pano ekler: ajan boyutunda iş kartları, ajanlara atama ve kartın görevine, çalıştırmasına ve gösterge paneli oturumuna geri dönen bir bağlantı.

Workboard bilinçli olarak küçük tutulmuştur: tek bir OpenClaw Gateway için yerel operasyonel işleri takip eder. GitHub Issues, Linear, Jira veya diğer ekip proje yönetim sistemlerinin yerine geçmez.

## Etkinleştirme

Workboard paketle birlikte gelir ancak varsayılan olarak devre dışıdır:

1. Kontrol Arayüzü'nde **Plugin'ler** bölümünü açın veya yapılandırılmış Kontrol Arayüzü temel yoluna göre `/settings/plugins` yolunu kullanın. Örneğin, `/openclaw` temel yolu `/openclaw/settings/plugins` yolunu kullanır.
2. **Workboard**'u bulun ve **Etkinleştir**'i seçin. Workboard, OpenClaw ile birlikte geldiğinden **Yükle** işlemi gerekmez.
3. Arayüz yeniden başlatma gerektiğini bildirirse Gateway'i yeniden başlatın.

Plugin çalışma zamanı yüklendikten sonra Workboard sekmesi gösterge paneli gezinme menüsünde görünür. Devre dışıyken sekme gezinme menüsünde gizli kalır. Plugin devre dışıyken veya `plugins.allow`/`plugins.deny` tarafından engellenmişken `/workboard` rotasını doğrudan açmak, kart verileri yerine Plugin'in kullanılamadığı durumunu gösterir.

Eşdeğer CLI iş akışı şöyledir:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Yapılandırma

Workboard'a özgü bir Plugin yapılandırması yoktur. Standart Plugin girdisiyle etkinleştirin veya devre dışı bırakın:

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

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Kart alanları

| Alan        | Değerler                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                                             |
| `priority`  | `low`, `normal`, `high`, `urgent`                                                                                                     |
| `labels`    | serbest biçimli dizeler                                                                                                               |
| `agentId`   | isteğe bağlı atanmış ajan                                                                                                             |
| bağlı refler | isteğe bağlı görev, çalıştırma, oturum veya kaynak URL'si                                                                             |
| `execution` | karttan başlatılan bir Codex/Claude çalıştırmasına ait isteğe bağlı meta veriler (altyapı, mod, model, oturum, çalıştırma kimliği, durum) |

Kartlar ayrıca denemeler, yorumlar, bağlantılar, kanıtlar, yapıtlar, otomasyon ayarları, ekler, çalışan günlükleri, çalışan protokol durumu, talepler, tanılamalar, bildirimler, şablon kimliği, arşiv durumu ve eski oturum algılama için kompakt meta verilerin yanı sıra yakın tarihli olayların listesini (`created`, `edited`, `moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`, `execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`, `link_added`, `proof_added`, `artifact_added`, `attachment_added`, `diagnostic`, `notification`, `dispatch`, `orchestration`, `protocol_violation`, `archived`, `unarchived`, `stale`) içerir. Bu meta veriler, bir operatörün bağlı oturumu açmadan kartın pano üzerinde nasıl ilerlediğini görmesini sağlar; bunlar yerel operasyon bağlamıdır ve oturum dökümlerinin veya GitHub issue geçmişinin yerine geçmez.

Kartlar Plugin'in kendi Gateway durumunda saklanır ve ilgili Gateway'in diğer OpenClaw durumuyla birlikte taşınır (bkz. [Depolama](#storage)).

## Karttan çalışma başlatma

Bağlantısız kartlar doğrudan çalışma başlatabilir:

- **Codex'i Çalıştır** / **Claude'u Çalıştır**, açıkça belirtilen bir altyapıyla görev takibi yapılan bir ajan çalıştırması başlatır, kart istemini gönderir ve kartı `running` olarak işaretler. Codex çalıştırmaları `openai/gpt-5.6-sol`, Claude çalıştırmaları ise `anthropic/claude-sonnet-4-6` kullanır.
- **Codex'i Aç** / **Claude'u Aç**, kart istemini göndermeden veya kartı taşımadan bağlı bir gösterge paneli oturumu oluşturur; bu, panoya bağlı kalan manuel çalışmalar içindir.

Otonom başlatmalar Gateway'in görev takibi yapılan ajan çalıştırma yolunu kullanır (Codex/Claude açıkça seçilmediği sürece varsayılan ajan ve model); ardından Workboard ortaya çıkan görevi, çalıştırma kimliğini ve oturum anahtarını karta bağlar. Bağlı her yürütme ayrıca bir deneme özeti (altyapı, mod, model, çalıştırma kimliği, zaman damgaları, durum, değişken hata sayısı) kaydeder; böylece yinelenen hatalar görünür kalır.

Gösterge paneli, görevleri görev kimliği, çalıştırma kimliği veya bağlı oturum anahtarına göre kartlarla eşleştirerek Gateway görev defterindeki görev durumunu yeniler. Kuyruktaki veya çalışan bir görev, kartın yaşam döngüsünü etkin tutar; tamamlanmış, başarısız olmuş, zaman aşımına uğramış veya iptal edilmiş bir görev, bağlı oturumlarla aynı eşitleme kuralını kullanarak kartı `review` veya `blocked` durumuna taşır (bkz. [Oturum yaşam döngüsü eşitlemesi](#session-lifecycle-sync)).

## Ajan araçları

| Araç                                                                                                                                             | Amaç                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Talep/tanı durumuyla birlikte kompakt kartları listeler; isteğe bağlı pano filtresi sunar.                                                                                                |
| `workboard_read`                                                                                                                                 | Bir kartı ve sınırlandırılmış çalışan bağlamını (notlar, denemeler, yorumlar, bağlantılar, kanıtlar, yapıtlar, üst kart sonuçları, atanan kişinin son çalışmaları, etkin tanılar) döndürür. |
| `workboard_create`                                                                                                                               | İsteğe bağlı üst kartlar, kiracı, beceriler, pano, çalışma alanı meta verileri, eşgüçlülük anahtarı, çalışma süresi sınırı ve yeniden deneme bütçesiyle bir kart oluşturur.                |
| `workboard_link`                                                                                                                                 | Bir üst kartı alt karta bağlar. Alt kartlar, tüm üst kartlar `done` durumuna ulaşana kadar `todo` durumunda kalır; ardından sevk yükseltmesi onları `ready` durumuna taşır.                |
| `workboard_claim`                                                                                                                                | Çağrıyı yapan ajan adına bir kartı talep eder; `backlog`/`todo`/`ready` durumlarını `running` durumuna taşır.                                                                              |
| `workboard_heartbeat`                                                                                                                            | Daha uzun bir çalışma sırasında talep Heartbeat'ini yeniler.                                                                                                                              |
| `workboard_release`                                                                                                                              | Tamamlama, duraklatma veya devretme sonrasında talebi serbest bırakır; kartı bir sonraki duruma taşıyabilir.                                                                               |
| `workboard_complete` / `workboard_block`                                                                                                         | Son özetler, kanıtlar, yapıtlar ve oluşturulan kart bildirimleri (tamamlanan karta geri bağlanan kartlara başvurmalıdır) ya da engelleyici nedenleri için yapılandırılmış yaşam döngüsü araçlarıdır. |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Küçük kart eklerini Plugin SQLite durumunda depolar, kart üzerinde dizine ekler ve çalışan bağlamında kullanıma sunar.                                                                     |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Çalışan günlük satırlarını kaydeder ve otomatik bir çalışan `workboard_complete`/`workboard_block` çağrısı yapmadan durduğunda kartı engeller.                                            |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Kalıcı pano meta verilerini (görünen ad, açıklama, arşiv durumu, varsayılan çalışma alanı) yönetir.                                                                                        |
| `workboard_runs`                                                                                                                                 | Bir kartın kalıcı çalışma-denemesi geçmişini döndürür.                                                                                                                                    |
| `workboard_specify`                                                                                                                              | Taslak bir triyaj/iş listesi kartını netleştirilmiş bir `todo` kartına dönüştürür; belirtim özetini karta kaydeder.                                                                       |
| `workboard_decompose`                                                                                                                            | Bir üst düzenleme kartını pano/kiracı meta verilerini devralan bağlantılı alt kartlara böler; üst kartı oluşturulan kart bildirimiyle tamamlayabilir.                                    |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Bildirim aboneliklerini yönetir. Olay okumaları yeniden oynatmaya dayanıklıdır; `advance`, kalıcı imleci ilerleterek çağrı yapanların tamamlanmış/başarısız/bayat kart olaylarını kaybetmeden veya iki kez okumadan devam etmesini sağlar. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Pano ad alanlarını ve kuyruk istatistiklerini inceler.                                                                                                                                     |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Takılı kalan işi kurtarır veya devreder.                                                                                                                                                   |
| `workboard_comment` / `workboard_proof`                                                                                                          | Devir notları ekler veya kanıt/yapıt başvuruları iliştirir.                                                                                                                               |
| `workboard_unblock`                                                                                                                              | Engellenen işi yeniden `todo` durumuna taşır.                                                                                                                                             |
| `workboard_dispatch`                                                                                                                             | Bağımlılık yükseltmesini veya bayat talep temizliğini tetikler.                                                                                                                           |

Talep edilmiş kartlar, çağrıyı yapan ajan `workboard_claim` tarafından
döndürülen talep belirtecine sahip olmadığı sürece diğer ajanlardan gelen ajan
aracı değişikliklerini reddeder. Bir ajan aracı veya Gateway RPC çağrısı
tarafından döndürülen her kart, `metadata.claim.token` değerini `[redacted]`
olarak gizler (belirtecin kendisi yalnızca `workboard_claim` tarafından bir kez,
üst düzeyde döndürülür); böylece kontrol paneli operatörleri ve diğer ajanlar
kullanılabilir bir belirteci hiç görmeden talep durumunu inceleyebilir.
Kurtarma, belirteç gerektirmeyen
`workboard_promote`/`workboard_reassign`/`workboard_reclaim` üzerinden
gerçekleşir.

## Sevk

Sevk Gateway'e özeldir: rastgele işletim sistemi süreçleri başlatmaz. Yürütmenin
sahibi normal OpenClaw alt ajan oturumları olmaya devam eder. Bir sevk geçişi:

1. Bağımlılıkları hazır olan kartları yükseltir.
2. Hazır kartlara sevk meta verilerini kaydeder.
3. Süresi dolmuş talepleri veya zaman aşımına uğramış çalışmaları engeller.
4. Panoda yapılandırılmış triyaj kartlarını düzenleme adayları olarak işaretler.
5. Hazır kartlardan küçük bir grubu talep eder ve Gateway alt ajan çalışma
   zamanı üzerinden çalışan çalışmalarını başlatır.

Çalışanlar, sınırlandırılmış kart bağlamının yanı sıra Workboard araçları
üzerinden Heartbeat göndermek, kartı tamamlamak veya engellemek için gereken
talep belirtecini alır.

### Çalışan seçimi

Her geçiş varsayılan olarak **en fazla 3 çalışan başlatır**. Hazır kartlar önce
önceliğe, ardından konuma, sonra da oluşturulma zamanına göre sıralanır. Bir
geçiş, her sahip/ajan için yalnızca bir kart başlatır ve panoda hâlihazırda
çalışan veya inceleme aşamasında işi bulunan sahipleri atlar. Arşivlenmiş
kartlar, etkin talebi bulunan kartlar ve `ready` durumunda olmayan kartlar,
çalışan başlatmak için hiçbir zaman seçilmez (yine de sevkin veri tarafındaki
işlemlerden etkilenebilirler: bayat talep temizliği, bağımlılık yükseltmesi,
zaman aşımı temizliği).

Oturum anahtarları pano/kart başına belirlenimcidir; böylece yinelenen sevkler,
ilgisiz oturumlar oluşturmak yerine aynı çalışan hattına geri yönlendirilir:

- Atanmış kartlar: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Atanmamış kartlar: `subagent:workboard-<boardId>-<cardId>` (Gateway,
  yapılandırılmış varsayılan ajanı çözümler)

Bir kart talep edildikten sonra çalışan başlatılamazsa Workboard kartı engeller,
talebi temizler, çalışma başlatma hatasını kaydeder ve kontrol panelinde, CLI
JSON çıktısında, ajan araçlarında ve kart tanılarında görülebilen bir çalışan
günlük satırı ekler.

### Giriş noktaları

- Kontrol paneli sevk eylemi
- `openclaw workboard dispatch`
- Komut destekleyen bir kanalda `/workboard dispatch`

Gateway kullanılabilir olduğunda üçü de Gateway alt ajan çalışma zamanını
kullanır. CLI'ın tek bir operatör geri dönüşü vardır: Gateway çağrısı bir
bağlantı/kullanılamama hatasıyla (veya eski Gateway'ler için `unknown method`
hatasıyla) başarısız olursa, açık bir `--url`/`--token` hedefi belirtilmemişse
ve yapılandırılmış bir uzak Gateway (`OPENCLAW_GATEWAY_URL` veya
`gateway.mode: remote`) geçerli değilse CLI, yerel SQLite durumu üzerinde
yalnızca veri sevki çalıştırır; bağımlılıkları yükseltebilir, bayat talepleri
temizleyebilir ve zaman aşımına uğramış çalışmaları engelleyebilir, ancak
çalışan başlatamaz. Erişilebilir bir Gateway'den gelen kimlik doğrulama, izin
ve doğrulama hataları kullanılamama olarak değerlendirilmez; bunlar komut
hatası olarak gösterilir. Açık bir `--url`/`--token` hedefi verildiğinde
oluşan tüm Gateway hataları da aynı şekilde gösterilir.

Pano meta verileri `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee` ve `orchestratorProfile` değerlerini ayarlayabilir. OpenClaw
bu amacı kaydeder ve çalışan bağlamında kullanıma sunar; gerçek
belirtim/parçalama işlemleri yine normal Workboard araçları üzerinden
gerçekleşir.

## CLI ve eğik çizgi komutu

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

`list` metin çıktısı arşivlenmiş kartları varsayılan olarak gizler
(`--include-archived` bunu geçersiz kılar); `--json`, mevcut betikler tarafından
kullanılan tam kart sözleşmesiyle uyumlu olarak arşivlenmiş kartları her zaman
içerir. `show`, belirsiz olmayan bir kimlik önekini kabul eder. `list`,
`create` ve `show` her zaman yerel Plugin durumunu doğrudan okur/yazar.
Yalnızca `dispatch`, yukarıda açıklanan geri dönüşle çalışan Gateway'i çağırır.

Tüm bayraklar, JSON çıktısı, Gateway geri dönüş davranışı, kimlik öneki
işleme, sevk seçim kuralları ve sorun giderme için [Workboard
CLI](/tr/cli/workboard) sayfasına bakın.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>` ve
`/workboard dispatch`, CLI'ı yansıtır. Listeleme ve gösterme, yetkilendirilmiş
tüm komut göndericileri için okuma işlemleridir. Oluşturma ve sevk, sohbet
yüzeylerinde sahip durumu veya `operator.write`/`operator.admin` yetkisine
sahip bir Gateway istemcisi gerektirir.

## Oturum yaşam döngüsü eşitlemesi

Kartlar mevcut bir pano oturumuna veya karttan çalışmayı
başlattığınızda oluşturulan bir oturuma bağlanabilir. Bağlı kartlar oturum yaşam döngüsünü satır içinde gösterir:
çalışıyor, eskimiş, bağlı ve boşta, tamamlandı, başarısız veya eksik. Ayrıca Sessions sekmesinden **Add to Workboard** ile
mevcut bir oturumu alabilirsiniz; kart bu oturuma bağlanır, başlık olarak
oturum etiketini veya son kullanıcı istemini kullanır ve mevcut olduğunda
son kullanıcı istemi ile en son asistan yanıtından notları önceden doldurur.

Bağlı oturum kaybolursa kart bağlam amacıyla bağlı kalır ve
yeni bir oturumda yeniden başlatmak için başlatma denetimlerini sunmaya devam eder. Etkin bir
bağlı oturum yakın zamandaki etkinliği bildirmeyi durdurursa Workboard, kartı
`stale` olarak işaretler ve yaşam döngüsü bunu temizleyene kadar meta veri olarak saklar.

Bir kart etkin çalışma durumundayken Workboard, bağlı oturumu izler:

| Bağlı oturum durumu                        | Kart durumu |
| ------------------------------------------ | ----------- |
| etkin                                      | `running`   |
| tamamlandı                                 | `review`    |
| başarısız, sonlandırıldı, zaman aşımına uğradı veya iptal edildi | `blocked`   |

**Manuel inceleme durumları önceliklidir.** Bir kartı `review`, `blocked` veya `done`
durumuna taşımak, siz kartı yeniden `todo` veya `running` durumuna taşıyana kadar
o kartın otomatik eşitlemesini durdurur.

Bir kartı başlatmak normal Gateway oturumlarını kullanır; Workboard yalnızca kart
meta verilerini ve bağlantıları saklar. Görüşme dökümü, model seçimi ve çalıştırma
yaşam döngüsü normal oturum sisteminin sahipliğinde kalır. Etkin çalıştırmayı
iptal etmek için canlı bağlı kartta **Stop** seçeneğini kullanın; Workboard bu kartı
`blocked` olarak işaretler, böylece kart takip işlemleri için görünür kalır.

Yeni kartlar Workboard şablonlarından (`bugfix`, `docs`, `release`,
`pr_review`, `plugin`) başlatılabilir. Şablonlar başlığı, notları, etiketleri ve önceliği
önceden doldurur; şablon kimliği kart meta verisi olarak saklanır.

## Pano iş akışı

1. Control UI içinde Workboard sekmesini açın.
2. Başlık, notlar, öncelik, etiketler, isteğe bağlı ajan ve
   isteğe bağlı bağlı oturum içeren bir kart oluşturun veya Sessions'ı açıp
   mevcut bir oturum için **Add to Workboard** seçeneğini belirleyin.
3. Kartı sütunlar arasında sürükleyin veya kompakt durum denetimine odaklanıp
   menüyü ya da ArrowLeft/ArrowRight tuşlarını kullanın.
4. Bir pano oturumu oluşturmak veya yeniden kullanmak için karttan çalışmayı başlatın.
5. Ajan çalışırken bağlı oturumu karttan açın.
6. Yaşam döngüsü eşitlemesinin çalışan işi `review`/`blocked` durumuna taşımasına izin verin, ardından kabul edildiğinde
   kartı manuel olarak `done` durumuna taşıyın.

## Tanılama

Tanılama, yerel kart meta verilerinden hesaplanır. Yerleşik denetimler şunları işaretler:

| Tür                         | Koşul                                                                          |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | Atanmış `todo`/`backlog`/`ready` kartı 1 saatten uzun süredir güncellenmemiş. |
| `running_without_heartbeat` | `running` kartında 20 dakikadan uzun süredir talep Heartbeat'i veya yürütme güncellemesi yok. |
| `blocked_too_long`          | `blocked` kartı 24 saatten uzun süredir güncellenmemiş. |
| `repeated_failures`         | Kartın izlenen başarısızlık sayısı 2 veya daha fazlasına ulaşmış. |
| `missing_proof`             | `done` kartında kanıt, eser veya ek yok. |
| `orphaned_session`          | `running` kartında `sessionKey` var ancak `execution` meta verisi yok. |

## İzinler

Gateway RPC yöntemleri `workboard.*` altında bulunur:

| Kapsam           | Yöntemler                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, ek listeleme/alma, bildirim olayı okumaları, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                                          |
| `operator.write` | `cards.diagnostics.refresh`, oluşturma/güncelleme/taşıma/silme/yorum/bağlama/bağımlılık bağlama/kanıt/eser, ek ekleme/silme, çalışan günlüğü, protokol ihlali, talep/heartbeat/serbest bırakma/yükseltme/yeniden atama/yeniden talep/tamamlama/engelleme/engel kaldırma, `cards.dispatch`, `cards.bulk`, arşivleme, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, bildirim aboneliği/silme/ilerletme |

Hiçbir RPC yöntemi `operator.admin` gerektirmez. Salt okunur
operatör erişimiyle bağlı tarayıcılar panoyu inceleyebilir ancak kartları değiştiremez.

## Depolama

Workboard, kalıcı verileri OpenClaw durum dizini altında Plugin'e ait ilişkisel bir SQLite veritabanında
saklar: panolar, kartlar, etiketler, yaşam döngüsü olayları,
çalıştırma girişimleri, yorumlar, bağımlılık bağlantıları, kanıtlar, eser başvuruları,
ek meta verileri ve blob'ları, tanılamalar, bildirimler, çalışan günlükleri,
protokol durumu ve aboneliklerin tümü Workboard tablolarında bulunur (Plugin
anahtar-değer girdilerinde değil). Kart dışa aktarımı, ek blob içeriklerini
satır içine almadan pano anlatısını korur.

`.28` sürümünde Workboard kullanan kurulumlar, yayımlanmış eski Plugin durum ad alanlarını
(`workboard.cards`, `workboard.boards`, `workboard.notify` ve mevcutsa
`workboard.attachments`) ilişkisel veritabanına taşımak için
`openclaw doctor --fix` komutunu çalıştırabilir.

## Sorun giderme

**Sekme Workboard'un kullanılamadığını belirtiyor**

```bash
openclaw plugins inspect workboard --runtime --json
```

`plugins.allow` yapılandırılmışsa buna `workboard` ekleyin. `plugins.deny`
`workboard` içeriyorsa Plugin'i etkinleştirmeden önce bunu kaldırın.

**Kartlar kaydedilmiyor**

Tarayıcı bağlantısının `operator.write` erişimine sahip olduğunu doğrulayın. Salt okunur operatör
oturumları kartları listeleyebilir ancak oluşturamaz, düzenleyemez, taşıyamaz veya silemez.

**Bir kartı başlatmak beklenen oturumu açmıyor**

Kartın ajan kimliğini ve bağlı oturumunu denetleyin, ardından gerçek çalıştırma durumunu
incelemek için Sessions veya Chat'i açın.

**Dağıtım bir çalışan başlatmıyor**

Etkin talebi olmayan en az bir `ready` kartı bulunduğunu doğrulayın:

```bash
openclaw workboard list --status ready
```

CLI yalnızca veri dağıtımı bildiriyorsa Gateway'i başlatın veya yeniden başlatın ve
tekrar deneyin; yalnızca veri dağıtımı yerel pano durumunu günceller ancak
alt ajan çalışan çalıştırmalarını başlatamaz. Aynı sahip veya ajan için başka bir kart
zaten çalışıyorsa ya da inceleme bekliyorsa kartlar atlanabilir; aynı
sahip için daha fazlasını dağıtmadan önce bu etkin işi tamamlayın,
engelleyin veya serbest bırakın.

## İlgili

- [Control UI](/tr/web/control-ui)
- [Workboard CLI](/tr/cli/workboard)
- [Plugin'ler](/tr/tools/plugin)
- [Plugin'leri yönetme](/tr/plugins/manage-plugins)
- [Oturumlar](/tr/concepts/session)
