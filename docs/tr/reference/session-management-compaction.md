---
read_when:
    - Oturum kimliklerinde, transkript olaylarında veya oturum satırı alanlarında hata ayıklamanız gerekiyor
    - Otomatik Compaction davranışını değiştiriyor veya "Compaction öncesi" düzenleme işlemleri ekliyorsunuz
    - Bellek boşaltmalarını veya sessiz sistem turlarını uygulamak istiyorsunuz
summary: 'Derinlemesine inceleme: oturum deposu ve transkriptler, yaşam döngüsü ve (otomatik) Compaction iç işleyişi'
title: Oturum yönetimine derinlemesine bakış
x-i18n:
    generated_at: "2026-07-16T17:42:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7551a94a4e2dc8be8b69503795309d0200cc3b5d7231b54083dbcaade697b06c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Tek bir **Gateway işlemi**, oturum durumunu uçtan uca yönetir. Kullanıcı arayüzleri (macOS uygulaması, web Control UI, TUI), oturum listeleri ve token sayıları için Gateway'i sorgular. Uzak modda oturum dosyaları uzak ana makinede bulunur; bu nedenle yerel Mac'inizdeki dosyaları denetlemek, Gateway'in kullandıklarını yansıtmaz.

Önce genel bakış belgeleri: [Oturum yönetimi](/tr/concepts/session), [Compaction](/tr/concepts/compaction), [Belleğe genel bakış](/tr/concepts/memory), [Bellek araması](/tr/concepts/memory-search), [Oturum budama](/tr/concepts/session-pruning), [Transkript düzeni](/tr/reference/transcript-hygiene), tam yapılandırma referansı için [Agent yapılandırması](/tr/gateway/config-agents).

## İki kalıcılık katmanı

1. **Oturum satırları (agent başına SQLite)** - anahtar/değer eşlemesi `sessionKey -> SessionEntry`. Gateway'in yönettiği değiştirilebilir çalışma zamanı durumu. Meta verileri izler: geçerli oturum kimliği, son etkinlik, açma/kapatma ayarları, token sayaçları.
2. **Transkript olayları (agent başına SQLite)** - yalnızca eklemeli, ağaç yapılıdır (girdilerde `id` + `parentId` bulunur). Konuşmayı, araç çağrılarını ve Compaction özetlerini depolar; sonraki dönüşler için model bağlamını yeniden oluşturur. Compaction denetim noktaları, sıkıştırılmış ardıl transkript üzerindeki meta verilerdir; yeni bir Compaction, ikinci bir `.checkpoint.*.jsonl` kopyası yazmaz.

Eski kurulumlarda agent `sessions/`
dizini altında hâlâ `sessions.json` dosyaları bulunabilir. Bu dosyaları eski oturum satırı geçiş girdileri veya açıkça belirtilmiş
çevrimdışı bakım hedefleri olarak değerlendirin. Gateway başlangıcı ve `openclaw doctor --fix`, etkin eski satırları
ve transkript geçmişini agent başına SQLite deposuna otomatik olarak aktarır.
Açık inceleme veya doğrulama kanıtı gerektiğinde `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` komutunu çalıştırın, ardından [Doctor geçiş
sırasını](/tr/cli/doctor#session-sqlite-migration) izleyin. Eski transkript
yapıtları arşivlendikten sonra geçiş başarısız olursa bu sıradaki Doctor kurtarma modunu kullanın.
Kurtarma, geçiş bildirimlerini kullanır, yalnızca etkilenen arşivlenmiş destek
yapıtlarını geri yükler, istendiğinde temizlenmiş bir GitHub sorun raporu hazırlar ve etkin
çalışma zamanının JSONL dosyalarını yeniden okumasına neden olmaz.

Gateway geçmiş okuyucuları, yüzey rastgele geçmiş erişimi gerektirmedikçe transkriptin tamamını bellekte oluşturmaz. İlk sayfa geçmişi, gömülü sohbet geçmişi, yeniden başlatma kurtarması ve token/kullanım denetimleri SQLite'tan sınırlı kuyruk okumaları kullanır. Tam transkript taramaları eşzamansız transkript dizini üzerinden gerçekleştirilir ve eşzamanlı okuyucular arasında paylaşılır.

## Disk üzerindeki konumlar

Agent başına, Gateway ana makinesinde (`src/config/sessions.ts` aracılığıyla çözümlenir):

- Çalışma zamanı oturum satırı deposu: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Çalışma zamanı transkript satırları: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Eski/arşiv transkript yapıtları: `~/.openclaw/agents/<agentId>/sessions/`
- Eski satır geçiş girdisi: `~/.openclaw/agents/<agentId>/sessions/sessions.json`

## Depo bakımı ve disk denetimleri

`session.maintenance`, SQLite oturum satırları, SQLite transkript satırları, arşiv yapıtları ve yörünge yan dosyaları için otomatik bakımı denetler:

| Anahtar                 | Varsayılan            | Notlar                                                                                      |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | veya `"warn"` (yalnızca raporlar, değişiklik yapmaz)                                        |
| `pruneAfter`            | `"30d"`               | eski girdiler için yaş sınırı                                                               |
| `maxEntries`            | `500`                 | oturum girdisi üst sınırı                                                                   |
| `resetArchiveRetention` | tut (yaş sınırı yok)  | `*.reset.*`/`*.deleted.*` transkript arşivleri için yaş sınırı; bir süre belirtilmesi silmeyi etkinleştirir |
| `maxDiskBytes`          | `2gb`                 | agent başına oturum disk bütçesi; `false` devre dışı bırakır                               |
| `highWaterBytes`        | `maxDiskBytes` değerinin %80'i | bütçe temizliğinden sonraki hedef                                                            |

Arşivlenmiş transkriptler varsayılan olarak saklanır ve çalışma zamanı desteklediğinde zstd (`*.jsonl.<reason>.<timestamp>.zst`) ile sıkıştırılır; böylece bir oturumu silmek veya sıfırlamak konuşma geçmişini hiçbir zaman sessizce atmaz. Disk bütçesi, etkin oturumlara dokunmadan önce en eski arşivleri çıkarır.

`maxDiskBytes` için etkin SQLite uygulaması, oturum başına oturum satırı JSON'u ile transkript olayı JSON baytlarını ölçer; eski çevrimdışı bakım uygulaması ise seçilen oturum dizinindeki dosyaları ölçer.

Gateway model çalıştırma yoklama oturumları (`agent:*:explicit:model-run-<uuid>` ile eşleşen anahtarlar) ayrı ve sabit bir `24h` saklama süresine sahiptir. Bu budama baskıya bağlıdır: yalnızca oturum girdisi bakım/sınır baskısına ulaşıldığında ve yalnızca genel eski girdi temizliği/sınır adımından önce çalışır. Açıkça belirtilen diğer oturumlar bu saklama süresini kullanmaz.

Disk bütçesi temizliği için uygulama sırası (`mode: "enforce"`):

1. Önce en eski arşivlenmiş transkript yapıtlarını, sahipsiz eski yapıtları veya sahipsiz yörünge yapıtlarını kaldırın.
2. Hâlâ hedefin üzerindeyse en eski oturum girdilerini ve bunların transkript satırlarını veya yörünge yapıtlarını çıkarın.
3. Kullanım `highWaterBytes` değerine eşit veya bundan düşük olana kadar yineleyin.

`mode: "warn"`, depoda veya dosyalarda değişiklik yapmadan olası çıkarmaları bildirir.

Bakımı isteğe bağlı olarak çalıştırın:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

Bakım, grup oturumları ve iş parçacığı kapsamlı sohbet oturumları gibi kalıcı harici konuşma işaretçilerini korur; ancak sentetik çalışma zamanı girdileri (cron, kancalar, Heartbeat, ACP, alt agent'lar), yapılandırılan yaş, sayı veya disk bütçesini aştıklarında yine de kaldırılabilir. Yalıtılmış cron çalıştırmaları, model çalıştırma yoklama saklama süresinden bağımsız ayrı bir `cron.sessionRetention` denetimi kullanır.

Normal Gateway yazmaları, agent başına SQLite değişikliklerini çalışma zamanı yazıcı yolu üzerinden seri hâle getiren oturum erişimcisi aracılığıyla gerçekleştirilir. Çalışma zamanı kodu `src/config/sessions/session-accessor.ts` içindeki erişimci yardımcılarını tercih etmelidir; eski `sessions.json` yardımcıları geçiş ve çevrimdışı bakım araçlarıdır. Bir Gateway'e erişilebildiğinde, dry-run olmayan `openclaw sessions cleanup` ve `openclaw agents delete`, temizliğin aynı yazıcı kuyruğuna katılması için depo değişikliklerini Gateway'e devreder; `--store <path>`, seçilen eski depo için açık çevrimdışı onarım yoludur ve her zaman yerel kalır (`--dry-run` de öyledir). `maxEntries` temizliği, üretim boyutundaki depolar için toplu olarak gerçekleştirilir; bu nedenle bir depo, sonraki yüksek su seviyesi temizliği onu yeniden yapılandırılmış sınırın altına indirene kadar yapılandırılan sınırı kısa süreliğine aşabilir. Okumalar, Gateway başlangıcı sırasında girdileri hiçbir zaman budamaz veya sınırlamaz; bunu yalnızca yazmalar ya da `openclaw sessions cleanup --enforce` yapar. İkincisi ayrıca sınırı hemen uygular ve yapılandırılmış disk bütçesi olmasa bile eski, başvurulmayan transkript, denetim noktası ve yörünge yapıtlarını budar.

OpenClaw artık Gateway yazmaları sırasında otomatik `sessions.json.bak.*` döndürme yedekleri oluşturmaz. Geçerli şema, eski `session.maintenance.rotateBytes` anahtarını reddeder ve `openclaw doctor --fix` bunu eski yapılandırmalardan kaldırır.

Transkript değişiklikleri, SQLite transkript hedefi için oturum yazma kuyruğunu kullanır:

| Ayar                                 | Varsayılan | Ortam değişkeni geçersiz kılması                 |
| ------------------------------------ | ---------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`   | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`  | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs`, bir kilit beklemesinin vazgeçmeden önce meşgul oturum hatası göstermesi için geçen süredir; bunu yalnızca yavaş makinelerde meşru hazırlık, temizlik, Compaction veya transkript yansıtma çalışmaları daha uzun süre çakışıyorsa artırın. `staleMs`, mevcut bir kilidin ne zaman eski kabul edilerek geri alınabileceğini belirtir. `maxHoldMs`, işlem içi gözetleyici serbest bırakma eşiğidir.

### SQLite Geçişinden Sonra Eski Sürüme Dönme

Dosya tabanlı eski bir OpenClaw sürümünü çalıştırmadan önce arşivlenmiş eski transkript yapıtlarını geri yükleyin:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Geçiş, destek ve geri alma için eski `sessions.json` dosyalarını yerinde bırakır;
ancak SQLite'a aktarılmış etkin transkript JSONL dosyaları
`session-sqlite-import-archive/` içine yeniden adlandırılır. Dosya tabanlı eski çalışma zamanları,
`sessions.json` içindeki `sessionFile` yollarını izler; bu nedenle başlangıçtan
önce bu yapıtların geri yüklenmesi gerekir. Geri yükleme, geçiş bildirimlerini kullanır, yalnızca özgün yolları
eksik olan kayıtlı arşiv yapıtlarını taşır ve ileri kurtarma için SQLite veritabanını
yerinde bırakır.

SQLite geçişinden sonra oluşturulan oturumlar yalnızca SQLite'ta bulunur ve dosya tabanlı
eski bir çalışma zamanında görünmez. Eski sürüme döndükten sonra yeniden yükseltme yaparsanız OpenClaw'ın geri yüklenen eski
yapıtları aktarmadan önce doğrulayabilmesi için Doctor inceleme ve doğrulama sırasını yeniden çalıştırın.

## Cron oturumları ve çalışma günlükleri

Yalıtılmış cron çalıştırmaları, özel saklama süresine sahip kendi oturum girdilerini/transkriptlerini oluşturur:

- `cron.sessionRetention` (varsayılan `"24h"`), eski yalıtılmış cron çalıştırma oturumlarını depodan budar; `false` devre dışı bırakır.
- Çalıştırma geçmişi, cron işi başına en yeni 2000 terminal satırını saklar. Kaybolan satırlar 24 saatlik temizleme aralığını korur.

Cron zorunlu olarak yeni bir yalıtılmış çalıştırma oturumu oluşturduğunda, yeni satırı yazmadan önce önceki `cron:<jobId>` oturum girdisini temizler: güvenli tercihleri (düşünme/hızlı/ayrıntılı/gerekçelendirme ayarları, etiketler, görünen ad) ve kullanıcı tarafından açıkça seçilmiş model/kimlik doğrulama geçersiz kılmalarını taşır; ancak ortam konuşma bağlamını (kanal/grup yönlendirmesi, gönderme/kuyruk ilkesi, yükseltme, kaynak, ACP çalışma zamanı bağlaması) kaldırır. Böylece yeni bir yalıtılmış çalıştırma, eski bir çalıştırmadan güncelliğini yitirmiş teslimat veya çalışma zamanı yetkisini devralamaz.

## Oturum anahtarları (`sessionKey`)

Bir `sessionKey`, hangi konuşma bölümünde bulunduğunuzu belirler (yönlendirme + yalıtım). Standart kurallar: [/concepts/session](/tr/concepts/session).

| Kalıp                        | Örnek                                                       |
| ---------------------------- | ----------------------------------------------------------- |
| Ana/doğrudan sohbet (agent başına) | `agent:<agentId>:<mainKey>` (varsayılan `main`)                |
| Grup                         | `agent:<agentId>:<channel>:group:<id>`                      |
| Oda/kanal (Discord/Slack)    | `agent:<agentId>:<channel>:channel:<id>` veya `...:room:<id>` |
| Cron                         | `cron:<job.id>`                                             |
| Webhook                      | `hook:<uuid>` (geçersiz kılınmadıkça)                       |

## Oturum kimlikleri (`sessionId`)

Her `sessionKey`, geçerli bir `sessionId` değerine (konuşmayı sürdüren SQLite transkript kimliği) işaret eder. Karar mantığı, `src/auto-reply/reply/session.ts` içindeki `initSessionState()` konumunda bulunur.

- **Sıfırlama** (`/new`, `/reset`), söz konusu `sessionKey` için yeni bir `sessionId` oluşturur.
- **Günlük sıfırlama** (varsayılan olarak Gateway ana makinesinin yerel saatine göre 4:00), sıfırlama sınırından sonraki ilk mesajda yeni bir `sessionId` oluşturur.
- **Boşta kalma süresinin dolması** (`session.reset.idleMinutes` veya eski `session.idleMinutes`), boşta kalma aralığından sonra bir mesaj geldiğinde yeni bir `sessionId` oluşturur. Hem günlük sıfırlama hem de boşta kalma süresi yapılandırılmışsa önce dolan süre geçerli olur.
- **Control UI yeniden bağlantısında sürdürme**, Gateway bir operatör UI istemcisinden eşleşen `sessionId` değerini aldığında, yeniden bağlantı sonrasında gönderilen tek bir ileti için o anda görünür olan oturumu korur. Bu tek kullanımlık bir sinyaldir; olağan eski gönderimler yine yeni bir `sessionId` oluşturur.
- **Sistem olayları** (Heartbeat, Cron uyandırmaları, exec bildirimleri, Gateway kayıt işlemleri) oturum satırını değiştirebilir ancak günlük/boşta kalma sıfırlamasının güncelliğini hiçbir zaman uzatmaz. Sıfırlama geçişi, yeni istem oluşturulmadan önce önceki oturuma ait kuyruğa alınmış sistem olayı bildirimlerini atar.
- **Üst öğeden çatallama ilkesi**, bir iş parçacığı veya alt ajan çatalı oluştururken OpenClaw'ın etkin dalını kullanır. Bu dal çok büyükse (sabit bir dahili sınırın üzerinde; şu anda 100K token), OpenClaw başarısız olmak veya kullanılamaz geçmişi devralmak yerine alt öğeyi yalıtılmış bağlamla başlatır. Boyutlandırma otomatiktir ve yapılandırılamaz; eski `session.parentForkMaxTokens` yapılandırması `openclaw doctor --fix` tarafından kaldırılır.
- **Operatör çatalları**: `sessions.create { parentSessionKey, fork: true }`, transkripti üst öğenin mevcut durumundan dallanan yeni bir oturum oluşturur (yukarıdaki boyut sınırı dâhil, alt ajan başlatmalarıyla aynı çatallama mekanizması). Üst öğede etkin bir çalıştırma varken çatallama reddedilir; açıkça bir model geçirilmediği sürece üst öğenin model seçimi devralınır ve alt öğe, yeni token sayaçlarıyla `forkedFromParent` olarak işaretlenir.

## Oturum deposu şeması

Çalışma zamanı deposu, `SessionEntry` değerlerini ajan başına SQLite'ta tutar. Değer türü, `src/config/sessions.ts` içindeki `SessionEntry` türüdür. Temel alanlar (kapsamlı değildir):

- `sessionId`: SQLite transkript satırlarını adreslemek için kullanılan mevcut transkript kimliği
- `sessionStartedAt`: mevcut `sessionId` için başlangıç zaman damgası; günlük sıfırlama güncelliği bunu kullanır. Eski satırlar bunu JSONL oturum başlığından türetebilir.
- `lastInteractionAt`: son gerçek kullanıcı/kanal etkileşiminin zaman damgası; boşta kalma sıfırlamasının güncelliği bunu kullanır, böylece Heartbeat, Cron ve exec olayları oturumları etkin tutmaz. Bu alanı içermeyen eski satırlar, kurtarılan oturum başlangıç zamanına geri döner.
- `updatedAt`: listeleme/budama/kayıt işlemleri için kullanılan son depo satırı değişikliği zaman damgası; günlük/boşta kalma güncelliğinin yetkili kaynağı değildir.
- `archivedAt`: isteğe bağlı arşiv zaman damgası. Arşivlenen oturumlar transkriptleri bozulmadan depoda kalır ve normal etkin listelerin dışında tutulur.
- `pinnedAt`: isteğe bağlı sabitleme zaman damgası. Etkin sabitlenmiş oturumlar sabitlenmemiş oturumlardan önce sıralanır; bir oturum arşivlendiğinde sabitlemesi kaldırılır.
- Codex iş parçacığı birlikte çalışabilirliği: her iki alan da Codex iş parçacığı yönetimi biçimini izler; aktarım sırasındaki `archived`/`pinned` boole değerleri her zaman zaman damgasından türetilir ve Codex `threads.archived_at` semantiği ile camelCase serileştirmesine uygun olarak sunucu tarafında damgalanır. OpenClaw zaman damgaları epoch milisaniyesi, Codex ise epoch saniyesi kullandığından köprüler dönüşümü `codex` Plugin bağlantı noktasında yapar. Codex henüz bir sabitleme API'sine sahip değildir (yalnızca `thread/archive`/`thread/unarchive`); böyle bir API sunulana kadar sabitlenmiş durum OpenClaw tarafında kalır ve sunulduğunda eşleşen biçim, bağlı oturumların sabitleme durumunu mekanik olarak çift yönlü aktarmasına olanak tanır.
- Codex gözetimi yalnızca arşivlenmemiş yerel iş parçacıklarını listeler. Gateway'e yerel bir `idle` veya etkinlik durumu bilinmeyen `notLoaded` iş parçacığı, yalnızca operatör başka hiçbir Codex işleminin ona sahip olmadığını açıkça onayladıktan sonra yerel `thread/archive` aracılığıyla arşivlenebilir; Plugin önce işlem düzeyindeki durumu yeniden okur ve ardından iş parçacığı katalogdan kaybolur. Bu okuma, başka bir App Server işleminin iş parçacığını kullanmadığını kanıtlayamaz. OpenClaw etkin ve hata durumundaki satırları arşivlemeyi reddeder; eşleştirilmiş Node arşivleme ise Node köprüsü akış hâlindeki iş parçacığının tüm yaşam döngüsünü yönetebilene kadar kullanılamaz. Yerel bir Codex istemcisinde arşivden çıkarılan iş parçacığı yeniden görünmeye uygun hâle gelir.
- `lastReadAt` / `markedUnreadAt`: `sessions.patch { unread }` tarafından sunucu tarafında damgalanan okuma durumu zaman damgalarıdır; `unread: false` bir okumayı kaydeder (`lastReadAt` değerini ayarlar, `markedUnreadAt` değerini temizler); `unread: true` ise bir sonraki okumaya kadar oturumu okunmamış olarak işaretler. Oturum satırları türetilmiş bir `unread` boole değeri sunar: açıkça okunmamış olarak işaretlenmiş veya son etkinlikten önce okunmuş. Hiçbir zaman okunmuş olarak işaretlenmeyen oturumlar `unread: false` olarak kalır; böylece mevcut kurulumlarda yükseltme sonrasında bildirimler birden etkinleşmez.
- `lastActivityAt`: okunmamış sayılmaya değer etkinlik olarak kabul edilen son tamamlanmış ajan çalıştırmasının zaman damgası (kullanıcı, kanal ve Cron çalıştırmaları). Heartbeat ve dahili olay dönüşleri ile meta veri yamaları bunu güncellemez; `updatedAt` bir etkinlik sinyali değildir.
- `sessionFile`: taşıma/arşiv uyumluluğu için korunan eski işaretçi; etkin çalışma zamanı SQLite kimliğini kullanır
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: grup/kanal etiketleme meta verileri
- Geçişler: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (oturum başına geçersiz kılma)
- Model seçimi: `providerOverride`, `modelOverride`, `authProfileOverride`
- Token sayaçları (mümkün olan en iyi tahmin/sağlayıcıya bağlı): `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: bu oturum anahtarı için otomatik Compaction işleminin kaç kez tamamlandığı
- `memoryFlushAt` / `memoryFlushCompactionCount`: Compaction öncesindeki son bellek boşaltımının zaman damgası ve Compaction sayısı

Gateway yetkili kaynaktır: oturumlar çalışırken girdileri yeniden yazabilir veya yeniden yükleyebilir. Dosya destekli eski kurulumlarda,
`sessions.json` dosyasını düzenleyip çalışma zamanının bu dosyayı okumaya devam etmesini beklemek yerine
`openclaw doctor --session-sqlite import --session-sqlite-all-agents` ile taşıma yapın.

## Transkript olay yapısı

Transkriptler OpenClaw oturum erişimcisi tarafından yönetilir ve kimlik tabanlı yardımcılar aracılığıyla çalışma zamanı koduna sunulur. Olay akışı yalnızca eklemelidir:

- İlk girdi: oturum başlığı - `type: "session"`, `id`, `cwd`, `timestamp`, isteğe bağlı `parentSession`.
- Ardından: `id` + `parentId` içeren girdiler (ağaç yapısı).

Dikkate değer girdi türleri:

- `message`: kullanıcı/asistan/toolResult mesajları
- `custom_message`: model bağlamına _giren_, uzantı tarafından eklenmiş mesaj (`display: true` olduğunda TUI'da işlenir, `display: false` olduğunda tamamen gizlenir)
- `custom`: model bağlamına _girmeyen_ uzantı durumu (yeniden yüklemeler arasında uzantı durumunu kalıcı tutmak için)
- `compaction`: `firstKeptEntryId` ve `tokensBefore` içeren kalıcı Compaction özeti
- `branch_summary`: bir ağaç dalında gezinirken kalıcı tutulan özet

OpenClaw transkriptleri kasıtlı olarak "düzeltmez"; Gateway bunları okumak/yazmak için `SessionManager` kullanır.

## Bağlam pencereleri ve izlenen tokenlar

İki farklı kavram vardır:

1. **Model bağlam penceresi**: model başına sabit üst sınır (modelin görebildiği tokenlar). Model kataloğundan gelir ve yapılandırma aracılığıyla geçersiz kılınabilir.
2. **Oturum deposu sayaçları**: oturum satırına yazılan hareketli istatistiklerdir (`/status` ve panolar için kullanılır). `contextTokens` bir çalışma zamanı tahmin/raporlama değeridir; bunu kesin bir garanti olarak değerlendirmeyin.

Sınırlar hakkında daha fazla bilgi: [/reference/token-use](/tr/reference/token-use).

## Compaction: nedir?

Compaction, eski konuşmaları transkriptte kalıcı bir `compaction` girdisi hâlinde özetler ve son mesajları olduğu gibi korur. Compaction sonrasında gelecek dönüşler, Compaction özetini ve `firstKeptEntryId` sonrasındaki mesajları görür. Compaction, oturum budamasının aksine **kalıcıdır**; bkz. [/concepts/session-pruning](/tr/concepts/session-pruning).

Compaction sonrasında AGENTS.md bölümünün yeniden eklenmesi `agents.defaults.compaction.postCompactionSections` aracılığıyla isteğe bağlıdır; ayarlanmadığında veya `[]` olduğunda OpenClaw, Compaction özetinin üzerine AGENTS.md alıntıları eklemez.

### Parça sınırları ve araç eşleştirme

OpenClaw, uzun bir transkripti Compaction parçalarına bölerken asistan araç çağrılarını eşleşen `toolResult` girdileriyle birlikte tutar:

- Token payına dayalı bölme bir araç çağrısı ile sonucu arasına denk gelecekse OpenClaw çifti ayırmak yerine sınırı asistanın araç çağrısı mesajına kaydırır.
- Sondaki bir araç sonucu bloğu aksi hâlde parçayı hedefin üzerine çıkaracaksa OpenClaw bekleyen araç bloğunu korur ve özetlenmemiş kuyruğu olduğu gibi bırakır.
- İptal edilmiş/hatalı araç çağrısı blokları, bekleyen bir bölmeyi açık tutmaz.

## Otomatik Compaction ne zaman gerçekleşir?

Gömülü OpenClaw ajanında iki tetikleyici vardır:

1. **Taşma kurtarması**: model bir bağlam taşması hatası döndürür (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded` ve sağlayıcıya özgü diğer varyantlar); Compaction uygulayıp yeniden dener. Sağlayıcı denenen token sayısını bildirdiğinde OpenClaw, gözlemlenen bu sayıyı taşma kurtarma Compaction işlemine iletir; sağlayıcı taşmayı doğrular ancak ayrıştırılabilir bir sayı sunmazsa OpenClaw, Compaction motorlarına ve tanılamaya bütçeyi asgari düzeyde aşan sentetik bir sayı geçirir. Taşma kurtarması yine başarısız olursa OpenClaw, sessizce yeni bir oturum kimliğine geçmek yerine açık yönergeler sunar ve mevcut oturum eşlemesini korur; mesajı yeniden deneyin, `/compact` veya `/new` çalıştırın.
2. **Eşik bakımı**: başarılı bir dönüşten sonra `contextTokens > contextWindow - reserveTokens` olduğunda; burada `contextWindow` modelin bağlam penceresi, `reserveTokens` ise istemler ve bir sonraki model çıktısı için ayrılan paydır.

Bu iki tetikleyicinin dışında iki ek koruma çalışır:

- **Ön kontrol yerel Compaction**: etkin transkript bu boyuta ulaştığında sonraki çalıştırmayı açmadan önce yerel Compaction işlemini tetiklemek için `agents.defaults.compaction.maxActiveTranscriptBytes` değerini (bayt veya `"20mb"` gibi bir dize) ayarlayın. Bu, ham arşivleme değil, yerel yeniden açma maliyetine yönelik bir boyut korumasıdır; normal semantik Compaction yine çalışır ve sıkıştırılmış özetin yeni bir ardıl transkript hâline gelmesi için `truncateAfterCompaction` gerektirir.
- **Dönüş ortası ön kontrolü**: araç döngüsü koruması eklemek için `agents.defaults.compaction.midTurnPrecheck.enabled: true` değerini (varsayılan `false`) ayarlayın. Bir araç sonucu eklendikten sonra ve bir sonraki model çağrısından önce OpenClaw, dönüş başlangıcında kullanılan ön kontrol bütçe mantığıyla istem baskısını tahmin eder. Bağlam artık sığmıyorsa koruma satır içinde Compaction uygulamaz; yapılandırılmış bir dönüş ortası ön kontrol sinyali oluşturur, mevcut istem gönderimini durdurur ve dış çalıştırma döngüsünün mevcut kurtarma yolunu kullanmasına izin verir (yeterli olduğunda aşırı büyük araç sonuçlarını kısaltır veya yapılandırılmış Compaction modunu tetikleyip yeniden dener). Sağlayıcı destekli koruyucu Compaction dâhil olmak üzere hem `default` hem de `safeguard` Compaction modlarıyla çalışır. `maxActiveTranscriptBytes` değerinden bağımsızdır: bayt boyutu koruması bir dönüş açılmadan önce, dönüş ortası ön kontrolü ise daha sonra, yeni araç sonuçları eklendikten sonra çalışır.

## Compaction ayarları

```json5
{
  agents: {
    defaults: {
      compaction: {
        enabled: true,
        reserveTokens: 16384,
        keepRecentTokens: 20000,
      },
    },
  },
}
```

OpenClaw, gömülü çalıştırmalar için bir güvenlik alt sınırı da uygular: `compaction.reserveTokens`, `reserveTokensFloor` değerinin (varsayılan `20000`) altındaysa OpenClaw bunu yükseltir. Alt sınırı devre dışı bırakmak için `agents.defaults.compaction.reserveTokensFloor: 0` değerini ayarlayın. Etkin modelin bağlam penceresi biliniyorsa hem alt sınır hem de nihai etkin rezerv, rezervin tüm istem bütçesini tüketemeyeceği şekilde sınırlandırılır. Bu, küçük bağlamlı modellerin (örneğin 16K token'lık yerel bir modelin) ilk token'dan itibaren Compaction sürecine girmesini önler; bilinen bir bağlam penceresi yoksa yapılandırılmış ve mevcut rezerv bütçeleri sınırlandırılmaz. Alt sınırın amacı: Compaction kaçınılmaz hâle gelmeden önce çok turlu "bakım" işlemleri (aşağıdaki bellek boşaltma gibi) için yeterli boşluk bırakmaktır. Uygulama: `src/agents/agent-settings.ts` içindeki `applyAgentCompactionSettingsFromConfig()`; gömülü çalıştırıcı turu ve Compaction kurulum yollarından çağrılır.

Manuel `/compact`, açıkça belirtilen bir `agents.defaults.compaction.keepRecentTokens` değerine uyar ve çalışma zamanının yakın geçmiş kuyruğu kesim noktasını korur. Açıkça belirtilmiş bir koruma bütçesi yoksa manuel Compaction kesin bir denetim noktasıdır ve yeniden oluşturulan bağlam yeni özetten başlar.

`truncateAfterCompaction` etkinleştirildiğinde OpenClaw, Compaction sonrasında etkin transkripti sıkıştırılmış ardılına döndürür. Dal/geri yükleme denetim noktası eylemleri bu sıkıştırılmış ardılı kullanır; eski Compaction öncesi denetim noktası dosyaları, bunlara başvurulduğu sürece okunabilir kalır.

## Takılabilir Compaction sağlayıcıları

Plugin'ler, Plugin API'sindeki `registerCompactionProvider()` aracılığıyla bir Compaction sağlayıcısı kaydeder. `agents.defaults.compaction.provider` kayıtlı bir sağlayıcı kimliğine ayarlandığında koruma uzantısı, özetleme işlemini yerleşik `summarizeInStages` işlem hattı yerine bu sağlayıcıya devreder.

- `provider`: kayıtlı bir Compaction sağlayıcısı Plugin'inin kimliği. Varsayılan LLM özetlemesini kullanmak için ayarlamadan bırakın. Bir `provider` ayarlamak `mode: "safeguard"` kullanımını zorunlu kılar.
- Sağlayıcılar, yerleşik yolla aynı Compaction talimatlarını ve tanımlayıcı koruma politikasını alır; koruma mekanizması, sağlayıcı çıktısından sonra da son turların ve bölünmüş turların sonek bağlamını korur.
- Yerleşik koruma özetlemesi, önceki özetin tamamını olduğu gibi korumak yerine önceki özetleri yeni mesajlarla yeniden damıtır.
- Koruma modu, özet kalitesi denetimlerini varsayılan olarak etkinleştirir; hatalı biçimlendirilmiş çıktıda yeniden deneme davranışını atlamak için `qualityGuard.enabled: false` değerini ayarlayın.
- Sağlayıcı başarısız olursa veya boş bir sonuç döndürürse OpenClaw otomatik olarak yerleşik LLM özetlemesine geri döner. Çağıranın açıkça tetiklediği iptal/zaman aşımı sinyalleri yutulmaz, yeniden fırlatılır; böylece iptale her zaman uyulur.

Kaynak: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Kullanıcının görebildiği yüzeyler

- Herhangi bir sohbet oturumunda `/status`
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Gateway günlükleri (`pnpm gateway:watch` veya `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Ayrıntılı mod: `🧹 Auto-compaction complete` ve Compaction sayısı

## Sessiz bakım (`NO_REPLY`)

OpenClaw, kullanıcının ara çıktıları görmemesi gereken arka plan görevleri için "sessiz" turları destekler.

- Asistan, "kullanıcıya yanıt iletme" anlamına gelen tam sessiz token `NO_REPLY` / `no_reply` ile çıktısına başlar. OpenClaw bunu teslimat katmanında kaldırır/bastırır.
- Tam sessiz token bastırma işlemi büyük/küçük harfe duyarsızdır: tüm yük yalnızca sessiz token'dan oluşuyorsa hem `NO_REPLY` hem de `no_reply` geçerli sayılır.
- `2026.1.10` itibarıyla OpenClaw, kısmi bir parça `NO_REPLY` ile başladığında taslak/yazıyor akışını da bastırır; böylece sessiz işlemler turun ortasında kısmi çıktı sızdırmaz.
- Bu yalnızca gerçek arka plan/teslimatsız turlar içindir; sıradan, eyleme dönük kullanıcı istekleri için bir kestirme değildir.

## Compaction öncesi bellek boşaltma

Otomatik Compaction gerçekleşmeden önce OpenClaw, kalıcı durumu diske (örneğin ajan çalışma alanındaki `memory/YYYY-MM-DD.md`) yazan sessiz bir ajansal tur çalıştırabilir; böylece Compaction kritik bağlamı silemez. Oturum bağlamı kullanımını izler ve kullanım Compaction eşiğinin altındaki yumuşak eşiği geçtiğinde, tam sessiz token `NO_REPLY` / `no_reply` kullanarak sessiz bir "belleği şimdi yaz" yönergesi gönderir; böylece kullanıcı hiçbir şey görmez.

Yapılandırma (`agents.defaults.compaction.memoryFlush`), tam başvuru için bkz. [/gateway/config-agents](/tr/gateway/config-agents#agentsdefaultscompaction):

| Anahtar                     | Varsayılan       | Notlar                                                                                                                                 |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | ayarlanmamış     | yalnızca boşaltma turu için tam sağlayıcı/model geçersiz kılması; örneğin `ollama/qwen3:8b`                                             |
| `softThresholdTokens`       | `4000`           | boşaltmayı tetikleyen, Compaction eşiğinin altındaki fark                                                                               |
| `forceFlushTranscriptBytes` | ayarlanmamış (devre dışı) | token sayaçları güncel olmasa bile transkript dosyası bu bayt boyutuna (veya `"2mb"` gibi bir dizeye) ulaştığında boşaltmayı zorunlu kılar; `0` devre dışı bırakır |
| `prompt`                    | yerleşik         | boşaltma turunun kullanıcı mesajı                                                                                                       |
| `systemPrompt`              | yerleşik         | boşaltma turuna eklenen ilave sistem istemi                                                                                             |

Notlar:

- Varsayılan istem/sistem istemi, teslimatı bastırmak için bir `NO_REPLY` ipucu içerir.
- `model` ayarlandığında boşaltma turu, etkin oturumun geri dönüş zincirini devralmadan bu modeli kullanır; böylece yalnızca yerel bakım işlemleri, başarısızlık durumunda fark edilmeden ücretli bir konuşma modeline geri dönmez.
- Boşaltma, her Compaction döngüsünde bir kez çalışır (oturum satırında izlenir).
- Boşaltma yalnızca gömülü OpenClaw oturumları için çalışır; CLI arka uçları ve Heartbeat turları bunu atlar.
- Oturum çalışma alanı salt okunur olduğunda (`workspaceAccess: "ro"` veya `"none"`) boşaltma atlanır.
- Çalışma alanı dosya düzeni ve yazma kalıpları için [Bellek](/tr/concepts/memory) bölümüne bakın.

OpenClaw, uzantı API'sinde bir `session_before_compact` kancası sunar; ancak yukarıdaki boşaltma mantığı bu kancada değil, Gateway tarafında (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`) bulunur.

## Sorun giderme kontrol listesi

- **Oturum anahtarı yanlış mı?** [/concepts/session](/tr/concepts/session) ile başlayın ve `/status` içindeki `sessionKey` değerini doğrulayın.
- **Depo ile transkript uyuşmuyor mu?** Gateway ana makinesini ve `openclaw status` tarafından belirtilen depo yolunu doğrulayın.
- **Compaction sürekli mi tekrarlanıyor?** Modelin bağlam penceresini (çok küçük olması sık Compaction yapılmasını zorunlu kılar), `reserveTokens` değerini (model penceresi için çok yüksek olması Compaction'ın daha erken yapılmasına neden olur) ve araç sonucu şişmesini (oturum budamasını ayarlayın) kontrol edin.
- **Küçük bir yerel modelde her istem taşıyor gibi mi görünüyor?** Sağlayıcının doğru model bağlam penceresini bildirdiğini doğrulayın. OpenClaw, etkin rezervi yalnızca bu pencere biliniyorsa sınırlandırabilir.
- **Sessiz turlar sızıyor mu?** Yanıtın tam sessiz token `NO_REPLY` ile başladığını (büyük/küçük harfe duyarsız) ve akış bastırma düzeltmesini içeren bir derlemeyi (`2026.1.10`+) kullandığınızı doğrulayın.

## İlgili konular

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
- [Bağlam motoru](/tr/concepts/context-engine)
- [Ajan yapılandırma başvurusu](/tr/gateway/config-agents)
