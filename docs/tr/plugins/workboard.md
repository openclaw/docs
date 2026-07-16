---
read_when:
    - Control UI'da Kanban tarzı bir çalışma panosu istiyorsunuz
    - Paketle birlikte gelen Workboard Plugin'ini etkinleştiriyor veya devre dışı bırakıyorsunuz
    - Planlanan ajan çalışmalarını harici bir proje yöneticisi olmadan takip etmek istiyorsunuz
summary: Ajanların sahip olduğu kartlar ve oturum devri için isteğe bağlı pano çalışma alanı
title: Workboard Plugin'i
x-i18n:
    generated_at: "2026-07-16T17:35:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 607c6db4a7c038aa12b7db8f881635683871675bc6ef31686cc8b05853fb0701
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard plugini, [Kontrol Arayüzü](/tr/web/control-ui)'ne isteğe bağlı Kanban tarzı bir pano ekler:
ajan boyutunda iş kartları, ajanlara atama ve kartın görevine, çalıştırmasına ve
pano oturumuna geri dönen bir bağlantı.

Workboard özellikle küçük tutulmuştur: tek bir OpenClaw Gateway için yerel operasyonel
işleri izler. GitHub Issues, Linear, Jira veya diğer ekip proje yönetimi
sistemlerinin yerine geçmez.

## Etkinleştirme

Workboard paketle birlikte gelir ancak varsayılan olarak devre dışıdır:

1. Kontrol Arayüzü'nde **Pluginler**'i açın veya yapılandırılmış Kontrol Arayüzü
   temel yoluna göre `/settings/plugins` yolunu kullanın. Örneğin, `/openclaw`
   temel yolu `/openclaw/settings/plugins` yolunu kullanır.
2. **Workboard**'u bulun ve **Etkinleştir**'i seçin. Workboard, OpenClaw ile birlikte
   sunulduğundan bir **Yükle** işlemi gerektirmez.
3. Arayüz yeniden başlatma gerektiğini bildirirse Gateway'i yeniden başlatın.

Plugin çalışma zamanı yüklendikten sonra Workboard sekmesi pano gezintisinde görünür.
Devre dışıyken sekme gezintide gizli kalır. Plugin devre dışıyken veya
`plugins.allow`/`plugins.deny` tarafından engellenmişken `/workboard`
rotasını doğrudan açmak, kart verileri yerine pluginin kullanılamadığı durumunu
gösterir.

Eşdeğer CLI iş akışı şöyledir:

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## Yapılandırma

Workboard'a özgü bir plugin yapılandırması yoktur. Standart plugin girdisiyle
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

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Kart alanları

| Alan        | Değerler                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`  | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`    | serbest biçimli dizeler                                                                                        |
| `agentId`   | isteğe bağlı atanmış ajan                                                                                      |
| bağlantılı referanslar | isteğe bağlı görev, çalıştırma, oturum veya kaynak URL'si                                                     |
| `execution` | karttan başlatılan bir Codex/Claude çalıştırması için isteğe bağlı meta veriler (motor, mod, model, oturum, çalıştırma kimliği, durum) |

Kartlar ayrıca denemeler, yorumlar, bağlantılar, kanıtlar, yapıtlar, otomasyon
ayarları, ekler, çalışan günlükleri, çalışan protokolü durumu, talepler,
tanılamalar, bildirimler, şablon kimliği, arşiv durumu ve eski oturum algılama
için kompakt meta verilerin yanı sıra son olayların bir listesini
(`created`, `edited`, `moved`, `linked`,
`specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`) taşır. Bu meta
veriler, operatörün bağlantılı oturumu açmadan bir kartın panoda nasıl ilerlediğini
görmesini sağlar; bunlar yerel operasyon bağlamıdır, oturum dökümlerinin veya
GitHub sorun geçmişinin yerine geçmez.

Plugin ve Kontrol Arayüzü tek bir Workboard kart sözleşmesi kullanır. Bu nedenle
pano yenilemeleri, kartın yalnızca arayüze özgü daha küçük bir kopyasını
yansıtmak yerine çalışma alanı kökenini ve yetkisini, talep durumunu, tanılama
işlemlerini ve bildirim sıra numaralarını korur. Bilinmeyen tanılama türleri,
tanılama önem dereceleri ve bildirim türleri, her iki yüzey de bunları
destekleyene kadar yok sayılır; hiçbir zaman başka bir geçerli duruma
dönüştürülmezler.

Açık pano, `plugin.workboard.changed` geçersiz kılmalarından güncellenir. Her olay
yalnızca bir depo dönemi ve revizyon içerir; ardından arayüz, normal
`operator.read` RPC aracılığıyla kanonik kartları yeniden okur. Birden fazla
revizyon, tek bir takip okumasında birleştirilir. Workboard, bir kart
sürüklenirken, düzenlenirken veya yazılırken bu okumayı erteler ve yerel
etkileşim tamamlandıktan sonra sürdürür. Yeniden bağlantı her zaman kanonik bir
yeniden yükleme gerçekleştirir. Rutin bir tam kart yoklaması yoktur ve
**Yenile** manuel kurtarma seçeneği olarak kullanılabilir kalır.

Birden fazla pano olduğunda araç çubuğunda yalnızca o anda görünen kartlar
yerine kalıcı pano meta verileriyle desteklenen bir **Pano** filtresi bulunur.
Bu nedenle boş ve arşivlenmiş panolar seçilebilir durumda kalır. Açık bir pano
kimliği olmayan kartlar kanonik `default` panosuna aittir. Seçili pano
`?board=` sorgu parametresinde saklanır; böylece filtrelenmiş Workboard
URL'si yer imlerine eklenebilir veya paylaşılabilir. **Tüm panolar** seçildiğinde
parametre kaldırılır.

Kartlar pluginin kendi Gateway durumunda saklanır ve söz konusu Gateway'in geri
kalan OpenClaw durumuyla birlikte taşınır (bkz. [Depolama](#storage)).

## Karttan iş başlatma

Bağlantısız kartlar doğrudan iş başlatabilir:

- **Codex'i Çalıştır** / **Claude'u Çalıştır**, açıkça belirtilmiş bir motorla görev
  izlemeli bir ajan çalıştırması başlatır, kart istemini gönderir ve kartı
  `running` olarak işaretler. Codex çalıştırmaları `openai/gpt-5.6-sol`;
  Claude çalıştırmaları `anthropic/claude-sonnet-4-6` kullanır.
- **Codex'i Aç** / **Claude'u Aç**, panoya bağlı kalan manuel işler için kart
  istemini göndermeden veya kartı taşımadan bağlantılı bir pano oturumu
  oluşturur.

Otonom başlatmalar Gateway'in görev izlemeli ajan çalıştırma yolunu kullanır
(Codex/Claude açıkça seçilmediği sürece varsayılan ajan ve model); Workboard
daha sonra ortaya çıkan görevi, çalıştırma kimliğini ve oturum anahtarını karta
bağlar. Bağlantılı her yürütme ayrıca bir deneme özeti (motor, mod, model,
çalıştırma kimliği, zaman damgaları, durum, ilerleyen hata sayısı) kaydeder;
böylece yinelenen hatalar görünür kalır.

Pano, görevleri görev kimliği, çalıştırma kimliği veya bağlantılı oturum
anahtarıyla kartlarla eşleştirerek Gateway görev defterinden görev durumunu
yeniler. Kuyruktaki/çalışan bir görev kartın yaşam döngüsünü etkin tutar;
tamamlanmış, başarısız olmuş, zaman aşımına uğramış veya iptal edilmiş bir görev,
bağlantılı oturumlarla aynı eşitleme kuralını kullanarak kartı
`review` veya `blocked` durumuna taşır (bkz.
[Oturum yaşam döngüsü eşitlemesi](#session-lifecycle-sync)).

## Ajan araçları

| Araç                                                                                                                                             | Amaç                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | Talep/tanı durumuyla birlikte kompakt kartları listeler; isteğe bağlı pano filtresi.                                                                                                                    |
| `workboard_read`                                                                                                                                 | Bir kartı ve sınırlı çalışan bağlamını (notlar, denemeler, yorumlar, bağlantılar, kanıtlar, yapıtlar, üst kart sonuçları, atanan kişinin son çalışmaları, etkin tanılar) döndürür.                               |
| `workboard_create`                                                                                                                               | İsteğe bağlı üst kartlar, kiracı, beceriler, pano, çalışma alanı meta verileri, eşgüçlülük anahtarı, çalışma süresi sınırı ve yeniden deneme bütçesiyle bir kart oluşturur.                                                             |
| `workboard_link`                                                                                                                                 | Bir üst kartı bir alt karta bağlar. Alt kartlar, her üst kart `done` durumuna ulaşana kadar `todo` durumunda kalır; ardından dağıtım yükseltmesi bunları `ready` durumuna taşır.                                                     |
| `workboard_claim`                                                                                                                                | Çağrıyı yapan agent için bir kartı talep eder; `backlog`/`todo`/`ready` durumlarını `running` durumuna taşır.                                                                                                        |
| `workboard_heartbeat`                                                                                                                            | Daha uzun bir çalışma sırasında talep Heartbeat'ini yeniler.                                                                                                                                          |
| `workboard_release`                                                                                                                              | Tamamlama, duraklatma veya devir sonrasında talebi serbest bırakır; kartı bir sonraki duruma taşıyabilir.                                                                                                |
| `workboard_complete` / `workboard_block`                                                                                                         | Nihai özetler, kanıtlar, yapıtlar ve oluşturulan kart bildirimleri (tamamlanan karta geri bağlanan kartlara başvurmalıdır) ya da engelleme nedenleri için yapılandırılmış yaşam döngüsü araçları.                 |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | Küçük kart eklerini Plugin SQLite durumunda depolar, kartta dizinler ve çalışan bağlamında sunar.                                                                                         |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | Çalışan günlük satırlarını kaydeder ve otomatik bir çalışan `workboard_complete`/`workboard_block` çağrısı yapmadan durduğunda kartı engeller.                                                           |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | Kalıcı pano meta verilerini (görünen ad, açıklama, arşiv durumu, varsayılan çalışma alanı) yönetir.                                                                                            |
| `workboard_runs`                                                                                                                                 | Bir kartın kalıcı çalışma-denemesi geçmişini döndürür.                                                                                                                                      |
| `workboard_specify`                                                                                                                              | Taslak bir önceliklendirme/birikmiş iş kartını netleştirilmiş bir `todo` kartına dönüştürür; belirtim özetini karta kaydeder.                                                                                      |
| `workboard_decompose`                                                                                                                            | Bir üst düzenleme kartını bağlı alt kartlara ayırarak pano/kiracı meta verilerini devralır; üst kartı oluşturulan kart bildirimiyle tamamlayabilir.                                             |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | Bildirim aboneliklerini yönetir. Olay okumaları yeniden yürütmeye karşı güvenlidir; `advance`, kalıcı imleci taşıyarak çağıranların tamamlanmış/başarısız/bayat kart olaylarını kaybetmeden veya iki kez okumadan devam etmesini sağlar. |
| `workboard_boards` / `workboard_stats`                                                                                                           | Pano ad alanlarını ve kuyruk istatistiklerini inceler.                                                                                                                                                 |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | Takılı kalan işi kurtarır veya devreder.                                                                                                                                                           |
| `workboard_comment` / `workboard_proof`                                                                                                          | Devir notları ekler veya kanıt/yapıt başvuruları iliştirir.                                                                                                                                    |
| `workboard_unblock`                                                                                                                              | Engellenmiş işi yeniden `todo` durumuna taşır.                                                                                                                                                         |
| `workboard_move`                                                                                                                                 | Bir kartı başka bir duruma taşır; talep edilmiş kartlar, çağıranın agent talebi kapsamını gerektirir.                                                                                                      |
| `workboard_dispatch`                                                                                                                             | Çalışanları başlatmadan bağımlılık yükseltmesini veya bayat talep temizliğini tetikler; çalışan başlatma Gateway veya eğik çizgi komutu dağıtımını kullanır.                                                        |

Talep edilmiş kartlar, çağıran `workboard_claim` tarafından döndürülen talep
belirtecine sahip olmadığı sürece diğer agent'ların agent aracı değişikliklerini
reddeder. Bir agent aracı veya Gateway RPC çağrısı tarafından döndürülen her kart,
`metadata.claim.token` değerini `[redacted]` olarak gizler (belirtecin kendisi
yalnızca `workboard_claim` tarafından en üst düzeyde ve bir kez döndürülür);
böylece gösterge paneli operatörleri ve diğer agent'lar kullanılabilir bir
belirteci hiçbir zaman görmeden talep durumunu inceleyebilir. Kurtarma,
belirteç gerektirmeyen
`workboard_promote`/`workboard_reassign`/`workboard_reclaim` üzerinden yapılır.

## Dağıtım

Dağıtım Gateway'e yereldir: rastgele işletim sistemi süreçleri oluşturmaz.
Yürütme yine normal OpenClaw alt agent oturumlarına aittir. Bir dağıtım geçişi:

1. Bağımlılıkları hazır kartları yükseltir.
2. Hazır kartlara dağıtım meta verilerini kaydeder.
3. Süresi dolmuş talepleri veya zaman aşımına uğramış çalışmaları engeller.
4. Pano tarafından yapılandırılmış önceliklendirme kartlarını düzenleme adayı olarak işaretler.
5. Hazır kartlardan oluşan küçük bir toplu işi talep eder ve Gateway alt agent
   çalışma zamanı üzerinden çalışan çalışmalarını başlatır.

Çalışanlar; sınırlı kart bağlamının yanı sıra Workboard araçları üzerinden kartın
Heartbeat'ini göndermek, kartı tamamlamak veya engellemek için gereken talep
belirtecini alır.

Çalışma alanı yolları, çağıranın mevcut dosya sistemi yetkisini izler.
`operator.write` özelliğine sahip Gateway istemcileri yapılandırılmış agent
çalışma alanlarını kullanabilir; `operator.admin` istemcileri diğer ana makine
çıkışlarını kullanabilir. Korumalı alan içindeki agent araçları kendi korumalı
alan çalışma alanı erişimini kullanırken, korumalı alan dışında yalnızca çalışma
alanına erişen araçlar yapılandırılmış çalışma alanı kökünü kullanır. Workboard,
bir çalışma alanı atandığında bu yetkiyi kaydeder ve dağıtım sırasında yeniden
mevcut çağıranın yetkisiyle kesiştirir; böylece kalıcı bir kart daha sonraki bir
çağıranın erişimini genişletemez. Açık bir ana makine çalışma alanına sahip ancak
kaydedilmiş yetkisi olmayan eski kartlarda, tam ana makine dağıtımından önce bu
çalışma alanı yeniden kaydedilmelidir; ana makine yolu olmayan kartlar ilk kez
dağıtıldıklarında mevcut çağıranın yetkisini benimser.

Çalışma alanına bağlı dağıtım, yalnızca depo kökü hedef agent çalışma alanıyla
tam olarak eşleştiğinde bir dizini veya Git çıkışını kabul eder. Bir worktree
isteği bu dizine daraltılır ve bir dizin çalışma alanı olarak kalıcılaştırılır;
böylece ana makine çıkışı oluşturmaz veya depo kurulum kodunu yürütmez. Hedef
çalışan, yükseltilmiş yürütme, kalıcı ana makine/node exec geçersiz kılmaları ya
da sınıflandırılmamış Plugin ve MCP araçları olmadan, tam olarak bu çalışma alanı
için yazılabilir ve paylaşılmayan bir Docker korumalı alanı kullanmalıdır.
Workboard, bir `workboard_*` önekine güvenmek yerine kayıtlı araçlarını
sıralar ve canlı bağlama/yapılandırma karması bayat olan etkin bir Docker
kapsayıcısına dağıtımı reddeder. Dağıtım, daha az kısıtlı bir çalışan başlatmak
yerine uyumsuz hedef politikasını bildirir.
Tam ana makine dağıtımı diğer yerel çıkışları hedefleyebilir ve normal yönetilen
worktree kurulumunu korur.

Çalışma alanı yetkisi ikinci bir kart yaşam döngüsü izin modeli oluşturmaz.
Workboard kartlarını değiştirebilen çağıranlar, kartları her yüzeyde aynı durumlar
arasında elle taşıyabilir; salt okunur çalışma alanı erişimi yalnızca yazma
gerektiren çalışan dağıtımını önler.

### Çalışan seçimi

Her geçiş varsayılan olarak **en fazla 3 çalışan** başlatır. Hazır kartlar önce
önceliğe, ardından konuma, ardından oluşturulma zamanına göre sıralanır. Bir
geçiş, her sahip/agent için yalnızca bir kart başlatır ve panoda hâlihazırda
çalışan veya inceleme işi bulunan sahipleri atlar. Arşivlenmiş kartlar, etkin
talebi olan kartlar ve `ready` durumunda olmayan kartlar hiçbir zaman
çalışan başlatmak için seçilmez (dağıtımın veri tarafı bunları yine de
etkileyebilir: bayat talep temizliği, bağımlılık yükseltmesi, zaman aşımı
temizliği).

Oturum anahtarları pano/kart başına belirlenimlidir; dolayısıyla yinelenen
dağıtımlar ilgisiz oturumlar oluşturmak yerine aynı çalışan şeridine geri
yönlendirilir:

- Atanmış kartlar: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- Atanmamış kartlar: `subagent:workboard-<boardId>-<cardId>` (Gateway yapılandırılmış
  varsayılan agent'ı çözümler)

Bir kart talep edildikten sonra çalışan başlatılamazsa Workboard kartı engeller,
talebi temizler, çalışma başlatma hatasını kaydeder ve bir çalışan günlük satırı
ekler; bu satır gösterge panelinde, CLI JSON'unda, agent araçlarında ve kart
tanılarında görünür.

### Giriş noktaları

- Pano gönderme eylemi
- `openclaw workboard dispatch`
- komut destekli bir kanalda `/workboard dispatch`

Gateway kullanılabilir olduğunda üçünün de kullandığı çalışma zamanı Gateway alt ajan çalışma zamanıdır.
CLI'da tek bir operatör geri dönüşü vardır: Gateway çağrısı bir
bağlantı/kullanılamama hatasıyla (veya eski Gateway'ler için bir `unknown method`
hatasıyla) başarısız olursa, açıkça belirtilmiş bir `--url`/`--token` hedefi yoksa ve yapılandırılmış bir uzak
Gateway (`OPENCLAW_GATEWAY_URL` veya `gateway.mode: remote`) geçerli değilse CLI, yerel SQLite
durumuna karşı yalnızca veri gönderimi çalıştırır; bağımlılıkları ilerletebilir,
eskimiş talepleri temizleyebilir ve zaman aşımına uğramış çalıştırmaları engelleyebilir, ancak çalışanları başlatamaz. Erişilebilir bir Gateway'den gelen kimlik doğrulama,
izin ve doğrulama hataları kullanılamama durumu olarak değerlendirilmez;
bunlar komut hataları olarak gösterilir; açıkça bir `--url`/`--token` hedefi belirtildiğinde oluşan tüm Gateway
hataları da aynı şekilde gösterilir.

Pano meta verileri `autoDecompose`, `autoDecomposePerDispatch`,
`defaultAssignee` ve `orchestratorProfile` değerlerini ayarlayabilir. OpenClaw bu amacı kaydeder ve
çalışan bağlamında sunar; gerçek belirtim/ayrıştırma işlemleri yine de
normal Workboard araçları üzerinden yürütülür.

## CLI ve eğik çizgi komutu

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard move <card-id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

`list` metin çıktısı, arşivlenmiş kartları varsayılan olarak gizler (`--include-archived`
bunu geçersiz kılar); `--json`, mevcut betiklerin kullandığı tam kart
sözleşmesiyle eşleşecek şekilde arşivlenmiş kartları her zaman içerir. `show` ve `move`, belirsizlik içermeyen bir kimlik
önekini kabul eder. `list`, `create`, `show` ve `move` her zaman yerel Plugin
durumunu doğrudan okur/yazar. Yalnızca `dispatch`, yukarıda açıklanan geri dönüşle
çalışan Gateway'i çağırır.

Tüm bayraklar, JSON çıktısı, Gateway geri dönüş davranışı, kimlik öneki işleme, gönderim seçim kuralları ve
sorun giderme için [Workboard CLI](/tr/cli/workboard) bölümüne bakın.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`,
`/workboard move <card-id> --status <status>` ve `/workboard dispatch`,
CLI'ı yansıtır. Listeleme ve gösterme, yetkili tüm komut gönderenler için okuma işlemleridir.
Oluşturma, taşıma ve gönderme işlemleri sohbet yüzeylerinde sahip durumunu veya
`operator.write`/`operator.admin` yetkilerine sahip bir Gateway
istemcisini gerektirir. El ile yapılan operatör taşıma işlemleri, pano sürükleyip bırakma işleviyle
aynı talebi geçersiz kılma davranışını kullanır. Çalışma ağacına erişimleri
yine yukarıda açıklanan aynı çalışma alanı sınırını izler.

## Oturum yaşam döngüsü eşitlemesi

Kartlar mevcut bir pano oturumuna veya karttan çalışmayı
başlattığınızda oluşturulan bir oturuma bağlanabilir. Bağlı kartlar oturum yaşam döngüsünü satır içinde gösterir:
çalışıyor, eskimiş, bağlı ve boşta, tamamlandı, başarısız veya eksik. Ayrıca Sessions sekmesinden **Add to Workboard** ile
mevcut bir oturumu yakalayabilirsiniz; kart
bu oturuma bağlanır, başlık olarak oturum etiketini veya son kullanıcı istemini kullanır
ve mevcut olduğunda son kullanıcı istemiyle en son asistan yanıtından
notlar oluşturur.

Bağlı oturum kaybolursa kart bağlam amacıyla bağlı kalır ve
yeni bir oturumda yeniden başlatmak için başlatma kontrollerini sunmaya devam eder. Etkin
bağlı bir oturum yakın zamandaki etkinliği bildirmeyi durdurursa Workboard kartı
`stale` olarak işaretler ve yaşam döngüsü bunu temizleyene kadar meta veri olarak saklar.

Bir kart etkin çalışma durumundayken Workboard, bağlı oturumu izler:

| Bağlı oturum durumu                   | Kart durumu |
| ------------------------------------- | ----------- |
| etkin                                 | `running`   |
| tamamlandı                            | `review`    |
| başarısız oldu, sonlandırıldı, zaman aşımına uğradı veya iptal edildi | `blocked`   |

**El ile inceleme durumları önceliklidir.** Bir kartı `review`, `blocked` veya `done`
durumuna taşımak, kartı yeniden `todo` veya `running` durumuna taşıyana kadar otomatik eşitlemeyi durdurur.

Bir kartı başlatmak normal Gateway oturumlarını kullanır; Workboard yalnızca kart
meta verilerini ve bağlantıları saklar. Konuşma dökümü, model seçimi ve çalıştırma
yaşam döngüsü normal oturum sisteminin sorumluluğunda kalır. Etkin
bağlı bir kartta çalıştırmayı iptal etmek için **Stop** seçeneğini kullanın; Workboard bu kartı `blocked` olarak işaretler ve
takip amacıyla görünür kalmasını sağlar.

Yeni kartlar Workboard şablonlarından (`bugfix`, `docs`, `release`,
`pr_review`, `plugin`) başlatılabilir. Şablonlar başlığı, notları, etiketleri ve önceliği önceden doldurur;
şablon kimliği kart meta verisi olarak saklanır.

## Pano iş akışı

1. Control UI'da Workboard sekmesini açın.
2. Başlık, notlar, öncelik, etiketler, isteğe bağlı ajan ve
   isteğe bağlı bağlı oturum içeren bir kart oluşturun veya mevcut bir oturum için Sessions'ı açıp **Add to Workboard**
   seçeneğini belirleyin.
3. Kartı sütunlar arasında sürükleyin ya da kompakt durum kontrolüne odaklanıp
   menüyü veya ArrowLeft/ArrowRight tuşlarını kullanın. Sürükleme sırasında kaynak kart soluklaşır ve
   kullanılabilir bırakma sütunları bir dış çizgi kazanır.
4. Bir pano oturumu oluşturmak veya yeniden kullanmak için karttan çalışmayı başlatın.
5. Ajan çalışırken karttan bağlı oturumu açın.
6. Yaşam döngüsü eşitlemesinin çalışan işi `review`/`blocked` durumuna taşımasına izin verin, ardından kabul edildiğinde
   kartı el ile `done` durumuna taşıyın.

## Tanılama

Tanılama, yerel kart meta verilerinden hesaplanır. Yerleşik denetimler şunları işaretler:

| Tür                         | Koşul                                                                          |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | Atanmış `todo`/`backlog`/`ready` kartı 1 saatten uzun süredir güncellenmemiş.             |
| `running_without_heartbeat` | Talep heartbeat'i veya yürütme güncellemesi 20 dakikadan uzun süredir bulunmayan `running` kartı. |
| `blocked_too_long`          | 24 saatten uzun süredir güncellenmemiş `blocked` kartı.                                   |
| `repeated_failures`         | Kartın izlenen hata sayısı 2 veya daha fazlasına ulaşır.                                |
| `missing_proof`             | Kanıtı, yapıtı veya eki bulunmayan `done` kartı.                          |
| `orphaned_session`          | `sessionKey` içeren ancak `execution` meta verisi bulunmayan `running` kartı.                |

## İzinler

Gateway RPC yöntemleri `workboard.*` altında bulunur:

| Kapsam           | Yöntemler                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, ek listeleme/alma, bildirim olayı okumaları, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`, oluşturma/güncelleme/taşıma/silme/yorum yapma/bağlama/bağımlılık bağlama/kanıt/yapıt, ek ekleme/silme, çalışan günlüğü, protokol ihlali, talep/heartbeat/serbest bırakma/ilerletme/yeniden atama/geri alma/tamamlama/engelleme/engeli kaldırma, `cards.dispatch`, `cards.bulk`, arşivleme, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, bildirimlere abone olma/silme/ilerletme |

Hiçbir RPC yöntemi `operator.admin` gerektirmez. Salt okunur
operatör erişimiyle bağlanan tarayıcılar panoyu inceleyebilir ancak kartları değiştiremez. Yönetici kapsamı
kabul edilen Workboard ana makine yollarını genişletir; kullanılabilir yöntemleri değiştirmez.

## Depolama

Workboard kalıcı verileri OpenClaw durum dizini altındaki Plugin'e ait ilişkisel bir SQLite
veritabanında saklar: panolar, kartlar, etiketler, yaşam döngüsü olayları,
çalıştırma girişimleri, yorumlar, bağımlılık bağlantıları, kanıtlar, yapıt referansları,
ek meta verileri ve blob'ları, tanılama, bildirimler, çalışan günlükleri,
protokol durumu ve aboneliklerin tamamı Workboard tablolarında bulunur (Plugin
anahtar-değer girdilerinde değil). Kart dışa aktarımı, ek blob içeriklerini
satır içine almadan pano anlatısını korur.

Workboard'u `.28` sürümünde kullanan kurulumlar,
yayınlanmış eski Plugin durum ad alanlarını
(`workboard.cards`, `workboard.boards`, `workboard.notify` ve mevcutsa
`workboard.attachments`) ilişkisel veritabanına taşımak için
`openclaw doctor --fix` komutunu çalıştırabilir.

## Sorun giderme

**Sekmede Workboard'un kullanılamadığı belirtiliyor**

```bash
openclaw plugins inspect workboard --runtime --json
```

`plugins.allow` yapılandırılmışsa buna `workboard` ekleyin. `plugins.deny`
`workboard` içeriyorsa Plugin'i etkinleştirmeden önce bunu kaldırın.

**Kartlar kaydedilmiyor**

Tarayıcı bağlantısının `operator.write` erişimine sahip olduğunu doğrulayın. Salt okunur operatör
oturumları kartları listeleyebilir ancak oluşturamaz, düzenleyemez, taşıyamaz veya silemez.

**Bir kartı başlatmak beklenen oturumu açmıyor**

Kartın ajan kimliğini ve bağlı oturumunu kontrol edin, ardından
gerçek çalıştırma durumunu incelemek için Sessions veya Chat'i açın.

**Gönderim bir çalışanı başlatmıyor**

Etkin talebi olmayan en az bir `ready` kartı bulunduğunu doğrulayın:

```bash
openclaw workboard list --status ready
```

CLI yalnızca veri gönderimi bildirse Gateway'i başlatın veya yeniden başlatın ve
tekrar deneyin; yalnızca veri gönderimi yerel pano durumunu günceller ancak
alt ajan çalışanı çalıştırmalarını başlatamaz. Aynı sahip veya ajan için başka bir
kart zaten çalışıyorsa ya da inceleme bekliyorsa kartlar atlanabilir; aynı
sahip için daha fazla kart göndermeden önce etkin işi tamamlayın,
engelleyin veya serbest bırakın.

## İlgili

- [Control UI](/tr/web/control-ui)
- [Workboard CLI](/tr/cli/workboard)
- [Plugin'ler](/tr/tools/plugin)
- [Plugin'leri yönetme](/tr/plugins/manage-plugins)
- [Oturumlar](/tr/concepts/session)
