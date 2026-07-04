---
read_when:
    - Oturum kimliklerini, transcript JSONL’i veya sessions.json alanlarını hata ayıklamanız gerekiyor
    - Otomatik Compaction davranışını değiştiriyorsunuz veya "Compaction öncesi" bakım ekliyorsunuz
    - Bellek temizlemeleri veya sessiz sistem turları uygulamak istiyorsunuz
summary: 'Derinlemesine inceleme: oturum deposu ve transkriptler, yaşam döngüsü ve (otomatik)Compaction iç işleyişi'
title: Oturum yönetimi derinlemesine inceleme
x-i18n:
    generated_at: "2026-07-04T20:41:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c97994f674e14ec01b2eaadc10a61e524f5071f95b2ef84957d71abacbdc719b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw, oturumları bu alanlarda uçtan uca yönetir:

- **Oturum yönlendirme** (gelen iletilerin bir `sessionKey` ile nasıl eşleştiği)
- **Oturum deposu** (`sessions.json`) ve neleri izlediği
- **Transkript kalıcılığı** (`*.jsonl`) ve yapısı
- **Transkript hijyeni** (çalıştırmalardan önce sağlayıcıya özgü düzeltmeler)
- **Bağlam sınırları** (bağlam penceresi ve izlenen token'lar)
- **Compaction** (elle ve otomatik Compaction) ve Compaction öncesi işlerin nereye bağlanacağı
- **Sessiz bakım** (kullanıcıya görünür çıktı üretmemesi gereken bellek yazmaları)

Önce daha üst düzey bir genel bakış istiyorsanız şunlarla başlayın:

- [Oturum yönetimi](/tr/concepts/session)
- [Compaction](/tr/concepts/compaction)
- [Belleğe genel bakış](/tr/concepts/memory)
- [Bellek arama](/tr/concepts/memory-search)
- [Oturum budama](/tr/concepts/session-pruning)
- [Transkript hijyeni](/tr/reference/transcript-hygiene)

---

## Doğruluk kaynağı: Gateway

OpenClaw, oturum durumunun sahibi olan tek bir **Gateway süreci** etrafında tasarlanmıştır.

- UI'lar (macOS uygulaması, web Control UI, TUI), oturum listeleri ve token sayıları için Gateway'i sorgulamalıdır.
- Uzak modda, oturum dosyaları uzak ana makinededir; "yerel Mac dosyalarınızı kontrol etmek" Gateway'in ne kullandığını yansıtmaz.

---

## İki kalıcılık katmanı

OpenClaw oturumları iki katmanda kalıcı hale getirir:

1. **Oturum deposu (`sessions.json`)**
   - Anahtar/değer eşlemesi: `sessionKey -> SessionEntry`
   - Küçük, değiştirilebilir, düzenlemesi (veya girdileri silmesi) güvenli
   - Oturum meta verilerini izler (geçerli oturum kimliği, son etkinlik, geçişler, token sayaçları vb.)

2. **Transkript (`<sessionId>.jsonl`)**
   - Ağaç yapılı, yalnızca eklemeli transkript (girdiler `id` + `parentId` içerir)
   - Gerçek konuşmayı + araç çağrılarını + Compaction özetlerini depolar
   - Gelecekteki turlar için model bağlamını yeniden oluşturmak üzere kullanılır
   - Compaction kontrol noktaları, sıkıştırılmış ardıl transkript üzerinde meta verilerdir. Yeni Compaction'lar ikinci bir `.checkpoint.*.jsonl`
     kopyası yazmaz.

Gateway geçmiş okuyucuları, yüzey açıkça rastgele geçmiş erişimine ihtiyaç duymadıkça
tüm transkripti belleğe almaktan kaçınmalıdır. İlk sayfa geçmişi,
gömülü sohbet geçmişi, yeniden başlatma kurtarması ve token/kullanım kontrolleri sınırlı kuyruk
okumaları kullanır. Tam transkript taramaları, dosya yolu artı `mtimeMs`/`size` ile
önbelleğe alınan ve eşzamanlı okuyucular arasında paylaşılan asenkron transkript dizini üzerinden geçer.

---

## Disk üzerindeki konumlar

Gateway ana makinesinde, her ajan için:

- Depo: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkriptler: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram konu oturumları: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw bunları `src/config/sessions.ts` aracılığıyla çözümler.

---

## Depo bakımı ve disk denetimleri

Oturum kalıcılığında `sessions.json`, transkript yapıtları ve trajectory yan dosyaları için otomatik bakım denetimleri (`session.maintenance`) vardır:

- `mode`: `enforce` (varsayılan) veya `warn`
- `pruneAfter`: eski girdi yaş sınırı (varsayılan `30d`)
- `maxEntries`: `sessions.json` içindeki girdileri sınırlar (varsayılan `500`)
- Kısa ömürlü Gateway model çalıştırma probe saklama süresi sabit olarak `24h` değerindedir, ancak baskıya bağlıdır: eski katı probe satırlarını yalnızca oturum girdisi bakım/sınır baskısına ulaşıldığında kaldırır. Bu yalnızca `agent:*:explicit:model-run-<uuid>` ile eşleşen katı açık probe anahtarları için geçerlidir ve çalıştığında genel eski girdi temizliği/sınırlamasından önce çalışır.
- `resetArchiveRetention`: `*.reset.<timestamp>` transkript arşivleri için saklama süresi (varsayılan: `pruneAfter` ile aynı; `false` temizliği devre dışı bırakır)
- `maxDiskBytes`: isteğe bağlı oturumlar dizini bütçesi
- `highWaterBytes`: temizlik sonrası isteğe bağlı hedef (varsayılan `maxDiskBytes` değerinin `%80`'i)

Normal Gateway yazmaları, süreç içi değişiklikleri bir çalışma zamanı dosya kilidi almadan seri hale getiren depo başına bir oturum yazıcısından geçer. Sıcak yol yama yardımcıları, bu yazıcı yuvasını tuttukları sırada doğrulanmış değiştirilebilir önbelleği ödünç alır; böylece büyük `sessions.json` dosyaları her meta veri güncellemesi için klonlanmaz veya yeniden okunmaz. Çalışma zamanı kodu `updateSessionStore(...)` veya `updateSessionStoreEntry(...)` kullanmayı tercih etmelidir; doğrudan tüm depo kaydetmeleri uyumluluk ve çevrimdışı bakım araçlarıdır. Bir Gateway erişilebilir olduğunda, dry-run olmayan `openclaw sessions cleanup` ve `openclaw agents delete`, depo değişikliklerini Gateway'e devreder; böylece temizlik aynı yazıcı kuyruğuna katılır. `--store <path>`, doğrudan dosya bakımı için açık çevrimdışı onarım yoludur. `maxEntries` temizliği üretim boyutlu sınırlar için hâlâ toplu yapılır; bu nedenle bir depo, bir sonraki yüksek su seviyesi temizliği onu tekrar aşağı çekmeden önce yapılandırılmış sınırı kısa süreliğine aşabilir. Oturum deposu okumaları, Gateway başlangıcı sırasında girdileri budamaz veya sınırlamaz; temizlik için yazmaları ya da `openclaw sessions cleanup --enforce` kullanın. `openclaw sessions cleanup --enforce`, disk bütçesi yapılandırılmamış olsa bile yapılandırılmış sınırı yine hemen uygular ve eski başvurulmayan transkript, kontrol noktası ve trajectory yapıtlarını budar.

Bakım, grup oturumları ve iş parçacığı kapsamlı sohbet oturumları gibi kalıcı dış konuşma işaretçilerini korur,
ancak cron, hook'lar, Heartbeat, ACP ve alt ajanlara yönelik sentetik çalışma zamanı girdileri
yapılandırılmış yaş, sayı veya disk bütçesini aştıklarında yine de kaldırılabilir. Gateway model çalıştırma probe oturumları, yalnızca anahtarları tam olarak
`agent:*:explicit:model-run-<uuid>` ile eşleştiğinde ayrı `24h` model çalıştırma saklamasını kullanır; diğer açık oturumlar
bu saklamanın parçası değildir. Model çalıştırma temizliği yalnızca oturum girdisi sınırı
baskısı altında uygulanır. Yalıtılmış cron çalıştırmaları, model çalıştırma probe saklamasından bağımsız olarak kendi `cron.sessionRetention` denetimini korur.

OpenClaw artık Gateway yazmaları sırasında otomatik `sessions.json.bak.*` döndürme yedekleri oluşturmaz. Eski `session.maintenance.rotateBytes` anahtarı yok sayılır ve `openclaw doctor --fix` onu eski yapılandırmalardan kaldırır.

Transkript değişiklikleri, transkript dosyasında bir oturum yazma kilidi kullanır. Kilit alma,
meşgul oturum hatası gösterilmeden önce `session.writeLock.acquireTimeoutMs` kadar bekler; varsayılan `60000`
ms'dir. Bunu yalnızca meşru hazırlık, temizlik, Compaction veya transkript yansıtma işleri
yavaş makinelerde daha uzun süre çakıştığında artırın. `session.writeLock.staleMs`, mevcut bir kilidin
ne zaman eski sayılarak geri alınabileceğini denetler; varsayılan `1800000` ms'dir. `session.writeLock.maxHoldMs`, süreç içi
watchdog serbest bırakma eşiğini denetler; varsayılan `300000` ms'dir. Acil durum env geçersiz kılmaları
`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS` ve
`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS` değerleridir.

Disk bütçesi temizliği için zorlama sırası (`mode: "enforce"`):

1. Önce en eski arşivlenmiş, sahipsiz transkript veya sahipsiz trajectory yapıtlarını kaldır.
2. Hâlâ hedefin üzerindeyse, en eski oturum girdilerini ve onların transkript/trajectory dosyalarını çıkar.
3. Kullanım `highWaterBytes` değerinde veya altında olana kadar devam et.

`mode: "warn"` içinde OpenClaw olası çıkarmaları bildirir ancak depoyu/dosyaları değiştirmez.

Bakımı isteğe bağlı çalıştırın:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron oturumları ve çalıştırma günlükleri

Yalıtılmış cron çalıştırmaları da oturum girdileri/transkriptler oluşturur ve bunların özel saklama denetimleri vardır:

- `cron.sessionRetention` (varsayılan `24h`), eski yalıtılmış cron çalıştırma oturumlarını oturum deposundan budar (`false` devre dışı bırakır).
- `cron.runLog.keepLines`, cron işi başına saklanan SQLite çalıştırma geçmişi satırlarını budar (varsayılan: `2000`). `cron.runLog.maxBytes`, eski dosya destekli çalıştırma günlükleri için kabul edilmeye devam eder.

Cron zorla yeni bir yalıtılmış çalıştırma oturumu oluşturduğunda, yeni satırı yazmadan önce önceki
`cron:<jobId>` oturum girdisini temizler. Düşünme/hızlı/ayrıntılı ayarları, etiketler ve açıkça
kullanıcı tarafından seçilmiş model/auth geçersiz kılmaları gibi güvenli
tercihleri taşır. Yeni bir yalıtılmış çalıştırmanın eski bir çalıştırmadan bayat teslimat veya
çalışma zamanı yetkisi devralamaması için kanal/grup yönlendirme, gönderme veya kuyruk ilkesi,
yükseltme, kaynak ve ACP çalışma zamanı bağlaması gibi ortam konuşma bağlamını bırakır.

---

## Oturum anahtarları (`sessionKey`)

Bir `sessionKey`, _hangi konuşma kovasında_ olduğunuzu tanımlar (yönlendirme + yalıtım).

Yaygın örüntüler:

- Ana/doğrudan sohbet (ajan başına): `agent:<agentId>:<mainKey>` (varsayılan `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Oda/kanal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` veya `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (geçersiz kılınmadığı sürece)

Kanonik kurallar [/concepts/session](/tr/concepts/session) adresinde belgelenmiştir.

---

## Oturum kimlikleri (`sessionId`)

Her `sessionKey`, geçerli bir `sessionId` değerine (konuşmayı sürdüren transkript dosyası) işaret eder.

Genel kurallar:

- **Sıfırlama** (`/new`, `/reset`), ilgili `sessionKey` için yeni bir `sessionId` oluşturur.
- **Günlük sıfırlama** (varsayılan olarak Gateway ana makinesinde yerel saatle 04:00), sıfırlama sınırından sonraki ilk iletide yeni bir `sessionId` oluşturur.
- **Boşta kalma süresi dolması** (`session.reset.idleMinutes` veya eski `session.idleMinutes`), boşta kalma penceresinden sonra bir ileti geldiğinde yeni bir `sessionId` oluşturur. Günlük + boşta kalma birlikte yapılandırıldığında, hangisinin süresi önce dolarsa o kazanır.
- **Control UI yeniden bağlanma sürdürmesi**, Gateway bir operatör UI istemcisinden eşleşen `sessionId` değerini aldığında, bir yeniden bağlanma gönderimi için o anda görünür olan oturumu koruyabilir. Sıradan bayat gönderimler yine yeni bir `sessionId` oluşturur.
- **Sistem olayları** (Heartbeat, cron uyandırmaları, exec bildirimleri, Gateway defter tutma) oturum satırını değiştirebilir ancak günlük/boşta sıfırlama tazeliğini uzatmaz. Sıfırlama devri, yeni istem oluşturulmadan önce önceki oturum için kuyruğa alınmış sistem olayı bildirimlerini atar.
- **Üst fork ilkesi**, bir iş parçacığı veya alt ajan fork'u oluştururken OpenClaw'ın etkin dalını kullanır. Bu dal çok büyükse OpenClaw, başarısız olmak veya kullanılamaz geçmişi devralmak yerine alt öğeyi yalıtılmış bağlamla başlatır. Boyutlandırma ilkesi otomatiktir; eski `session.parentForkMaxTokens` yapılandırması `openclaw doctor --fix` tarafından kaldırılır.

Uygulama ayrıntısı: karar `src/auto-reply/reply/session.ts` içindeki `initSessionState()` içinde verilir.

---

## Oturum deposu şeması (`sessions.json`)

Deponun değer türü `src/config/sessions.ts` içindeki `SessionEntry` türüdür.

Ana alanlar (kapsamlı değildir):

- `sessionId`: geçerli transkript kimliği (`sessionFile` ayarlanmadıkça dosya adı bundan türetilir)
- `sessionStartedAt`: geçerli `sessionId` için başlangıç zaman damgası; günlük sıfırlama
  güncelliği bunu kullanır. Eski satırlar bunu JSONL oturum başlığından türetebilir.
- `lastInteractionAt`: son gerçek kullanıcı/kanal etkileşimi zaman damgası; boşta sıfırlama
  güncelliği bunu kullanır, böylece heartbeat, cron ve exec olayları oturumları
  canlı tutmaz. Bu alanı olmayan eski satırlar, boşta güncelliği için kurtarılan oturum başlangıç
  zamanına geri döner.
- `updatedAt`: listeleme, budama ve
  defter tutma için kullanılan son depo satırı mutasyonu zaman damgası. Günlük/boşta sıfırlama güncelliği için yetkili kaynak değildir.
- `archivedAt`: isteğe bağlı arşiv zaman damgası. Arşivlenen oturumlar transkriptleri bozulmadan depoda kalır
  ve normal etkin listelerden hariç tutulur.
- `pinnedAt`: isteğe bağlı sabitleme zaman damgası. Etkin sabitlenmiş oturumlar
  sabitlenmemiş oturumlardan önce sıralanır; bir oturumu arşivlemek sabitlemesini temizler.
- Codex iş parçacığı birlikte çalışabilirliği: her iki alan da Codex iş parçacığı yönetimi biçimini izler —
  aktarım hattındaki `archived`/`pinned` boolean değerleri her zaman
  zaman damgasından türetilir ve sunucu tarafında damgalanır; Codex `threads.archived_at`
  semantiği ve camelCase serileştirmesiyle eşleşir. OpenClaw zaman damgaları epoch
  milisaniyeleridir, Codex ise epoch saniyeleri kullanır; bu nedenle köprüler codex
  plugin sınırında dönüştürme yapar. Codex'in henüz sabitleme API'si yoktur (yalnızca `thread/archive`/`thread/unarchive`);
  sabitlenmiş durum, bir tane var olana kadar OpenClaw tarafında kalır; o noktada
  eşleşen biçim bağlı oturumların sabitleme durumunu mekanik olarak gidiş dönüş yapmasını sağlar.
- `sessionFile`: isteğe bağlı açık transkript yolu geçersiz kılması
- `chatType`: `direct | group | room` (UI'lara ve gönderme politikasına yardımcı olur)
- `provider`, `subject`, `room`, `space`, `displayName`: grup/kanal etiketleme için meta veriler
- Açma kapama ayarları:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (oturum başına geçersiz kılma)
- Model seçimi:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token sayaçları (en iyi çaba / sağlayıcıya bağlı):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: bu oturum anahtarı için otomatik Compaction'ın kaç kez tamamlandığı
- `memoryFlushAt`: son Compaction öncesi bellek temizlemesinin zaman damgası
- `memoryFlushCompactionCount`: son temizleme çalıştığında Compaction sayısı

Depoyu düzenlemek güvenlidir, ancak yetkili kaynak Gateway'dir: oturumlar çalışırken girdileri yeniden yazabilir veya yeniden doldurabilir.

---

## Transkript yapısı (`*.jsonl`)

Transkriptler `openclaw/plugin-sdk/agent-sessions` öğesinin `SessionManager`'ı tarafından yönetilir.

Dosya JSONL'dir:

- İlk satır: oturum başlığı (`type: "session"`, `id`, `cwd`, `timestamp`, isteğe bağlı `parentSession` içerir)
- Sonra: `id` + `parentId` (ağaç) içeren oturum girdileri

Dikkate değer girdi türleri:

- `message`: kullanıcı/asistan/toolResult iletileri
- `custom_message`: model bağlamına giren uzantı tarafından enjekte edilen iletiler (UI'dan gizlenebilir)
- `custom`: model bağlamına girmeyen uzantı durumu
- `compaction`: `firstKeptEntryId` ve `tokensBefore` içeren kalıcı Compaction özeti
- `branch_summary`: bir ağaç dalında gezinirken kalıcı özet

OpenClaw transkriptleri bilerek "düzeltmez"; Gateway bunları okumak/yazmak için `SessionManager` kullanır.

---

## Bağlam pencereleri ve izlenen tokenlar

İki farklı kavram önemlidir:

1. **Model bağlam penceresi**: model başına sert sınır (modelin görebildiği tokenlar)
2. **Oturum deposu sayaçları**: `sessions.json` içine yazılan hareketli istatistikler (/status ve panolar için kullanılır)

Sınırları ayarlıyorsanız:

- Bağlam penceresi model kataloğundan gelir (ve yapılandırma üzerinden geçersiz kılınabilir).
- Depodaki `contextTokens` bir çalışma zamanı tahmini/raporlama değeridir; bunu katı bir garanti olarak değerlendirmeyin.

Daha fazlası için bkz. [/token-use](/tr/reference/token-use).

---

## Compaction: nedir

Compaction, eski konuşmayı transkriptte kalıcı bir `compaction` girdisine özetler ve son iletileri olduğu gibi tutar.

Compaction sonrasında gelecekteki turlar şunları görür:

- Compaction özeti
- `firstKeptEntryId` sonrasındaki iletiler

Compaction sonrasında AGENTS.md bölümü yeniden enjekte etme, `agents.defaults.compaction.postCompactionSections` ile isteğe bağlıdır; ayarlanmamışsa veya `[]` ise,
OpenClaw Compaction özetinin üzerine AGENTS.md alıntıları eklemez.

Compaction **kalıcıdır** (oturum budamanın aksine). Bkz. [/concepts/session-pruning](/tr/concepts/session-pruning).

## Compaction parça sınırları ve araç eşleştirmesi

OpenClaw uzun bir transkripti Compaction parçalarına böldüğünde,
asistan araç çağrılarını eşleşen `toolResult` girdileriyle eşlenmiş tutar.

- Token payı bölmesi bir araç çağrısı ile sonucu arasına denk gelirse, OpenClaw
  çifti ayırmak yerine sınırı asistan araç çağrısı iletisine kaydırır.
- Sondaki bir araç sonucu bloğu aksi halde parçayı hedefin üzerine çıkaracaksa,
  OpenClaw bekleyen bu araç bloğunu korur ve özetlenmemiş kuyruğu
  olduğu gibi tutar.
- Durdurulan/hatalı araç çağrısı blokları bekleyen bir bölmeyi açık tutmaz.

---

## Otomatik Compaction ne zaman gerçekleşir (OpenClaw çalışma zamanı)

Gömülü OpenClaw ajanında otomatik Compaction iki durumda tetiklenir:

1. **Taşma kurtarma**: model bir bağlam taşması hatası döndürür
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` ve benzer sağlayıcı biçimli varyantlar) → compact → yeniden dene.
   Sağlayıcı denenen token sayısını bildirdiğinde, OpenClaw gözlemlenen bu sayıyı
   taşma kurtarma Compaction'ına iletir. Sağlayıcı taşmayı doğrular ancak
   ayrıştırılabilir bir sayı sunmazsa, OpenClaw Compaction motorlarına ve tanılamalara bütçeyi
   asgari düzeyde aşan sentetik bir sayı geçirir.
   Taşma kurtarma hâlâ başarısız olursa, OpenClaw kullanıcıya açık rehberlik sunar
   ve oturum anahtarını sessizce yeni bir oturum kimliğine döndürmek yerine
   geçerli oturum eşlemesini korur. Sonraki adım operatör denetimindedir:
   iletiyi yeniden dene, `/compact` çalıştır veya yeni bir oturum
   tercih edildiğinde `/new` çalıştır.
2. **Eşik bakımı**: başarılı bir turdan sonra, şu olduğunda:

`contextTokens > contextWindow - reserveTokens`

Burada:

- `contextWindow` modelin bağlam penceresidir
- `reserveTokens` istemler + sonraki model çıktısı için ayrılmış boşluktur

Bunlar OpenClaw çalışma zamanı semantik değerleridir.

OpenClaw, `agents.defaults.compaction.maxActiveTranscriptBytes` ayarlandığında ve
etkin transkript dosyası bu boyuta ulaştığında, sonraki çalıştırmayı açmadan önce
ön kontrol yerel Compaction da tetikleyebilir. Bu, yerel yeniden açma maliyeti için dosya boyutu korumasıdır,
ham arşivleme değildir: OpenClaw yine normal semantik Compaction çalıştırır
ve sıkıştırılmış özetin yeni bir ardıl transkript olabilmesi için `truncateAfterCompaction` gerektirir.

Gömülü OpenClaw çalıştırmaları için `agents.defaults.compaction.midTurnPrecheck.enabled: true`
isteğe bağlı bir araç döngüsü koruması ekler. Bir araç sonucu eklendikten sonra ve
sonraki model çağrısından önce, OpenClaw tur başlangıcında kullanılan aynı ön kontrol
bütçe mantığını kullanarak istem baskısını tahmin eder. Bağlam artık sığmıyorsa, koruma
OpenClaw çalışma zamanının `transformContext` kancası içinde compact yapmaz. Yapılandırılmış
tur ortası ön kontrol sinyali yükseltir, geçerli istem gönderimini durdurur ve
dış çalıştırma döngüsünün mevcut kurtarma yolunu kullanmasına izin verir: bu yeterli olduğunda
aşırı büyük araç sonuçlarını keser veya yapılandırılmış Compaction modunu tetikleyip yeniden dener. Seçenek
varsayılan olarak devre dışıdır ve sağlayıcı destekli safeguard Compaction dahil olmak üzere hem `default` hem de `safeguard`
Compaction modlarıyla çalışır.
Bu, `maxActiveTranscriptBytes` değerinden bağımsızdır: byte boyutu koruması
bir tur açılmadan önce çalışır, tur ortası ön kontrol ise yeni araç sonuçları eklendikten sonra gömülü OpenClaw araç
döngüsünde daha sonra çalışır.

---

## Compaction ayarları (`reserveTokens`, `keepRecentTokens`)

OpenClaw çalışma zamanının Compaction ayarları ajan ayarlarında bulunur:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw gömülü çalıştırmalar için ayrıca bir güvenlik tabanı uygular:

- `compaction.reserveTokens < reserveTokensFloor` ise OpenClaw bunu yükseltir.
- Varsayılan taban `20000` tokendır.
- Tabanı devre dışı bırakmak için `agents.defaults.compaction.reserveTokensFloor: 0` ayarlayın.
- Zaten daha yüksekse OpenClaw bunu olduğu gibi bırakır.
- Manuel `/compact`, açık bir `agents.defaults.compaction.keepRecentTokens`
  değerine uyar ve OpenClaw çalışma zamanının son kuyruk kesme noktasını korur. Açık bir tutma bütçesi olmadan,
  manuel Compaction katı bir denetim noktası olarak kalır ve yeniden oluşturulan bağlam
  yeni özetten başlar.
- Yeni araç sonuçlarından sonra ve sonraki model
  çağrısından önce isteğe bağlı araç döngüsü ön kontrolünü çalıştırmak için `agents.defaults.compaction.midTurnPrecheck.enabled: true` ayarlayın. Bu yalnızca bir tetikleyicidir; özet üretimi hâlâ yapılandırılmış
  Compaction yolunu kullanır. Bir
  tur başlangıcı etkin transkript byte boyutu koruması olan `maxActiveTranscriptBytes` değerinden bağımsızdır.
- Etkin
  transkript büyüdüğünde bir turdan önce yerel Compaction çalıştırmak için `agents.defaults.compaction.maxActiveTranscriptBytes` değerini bir byte değeri veya
  `"20mb"` gibi bir dize olarak ayarlayın. Bu koruma yalnızca
  `truncateAfterCompaction` da etkinleştirildiğinde etkindir. Devre dışı bırakmak için ayarlamadan bırakın veya `0` olarak ayarlayın.
- `agents.defaults.compaction.truncateAfterCompaction` etkinleştirildiğinde,
  OpenClaw etkin transkripti Compaction sonrasında sıkıştırılmış bir ardıl JSONL'ye döndürür.
  Dal/geri yükleme denetim noktası eylemleri bu sıkıştırılmış ardılı kullanır;
  eski Compaction öncesi denetim noktası dosyaları başvuruldukları sürece okunabilir kalır.

Neden: Compaction kaçınılmaz hale gelmeden önce çok turlu "temizlik" (bellek yazmaları gibi) için yeterli boşluk bırakmak.

Uygulama: `src/agents/agent-settings.ts` içinde `applyAgentCompactionSettingsFromConfig()`
(gömülü çalıştırıcı turundan ve Compaction kurulum yollarından çağrılır).

---

## Takılabilir Compaction sağlayıcıları

Plugin'ler, plugin API'sindeki `registerCompactionProvider()` aracılığıyla bir Compaction sağlayıcısı kaydedebilir. `agents.defaults.compaction.provider` kayıtlı bir sağlayıcı kimliğine ayarlandığında, safeguard uzantısı özetlemeyi yerleşik `summarizeInStages` işlem hattı yerine bu sağlayıcıya devreder.

- `provider`: kayıtlı bir Compaction sağlayıcı Plugin'inin kimliği. Varsayılan LLM özetlemesi için ayarlamadan bırakın.
- Bir `provider` ayarlamak `mode: "safeguard"` değerini zorunlu kılar.
- Sağlayıcılar, yerleşik yolla aynı Compaction talimatlarını ve tanımlayıcı koruma politikasını alır.
- Safeguard, sağlayıcı çıktısından sonra son tur ve bölünmüş tur sonek bağlamını hâlâ korur.
- Yerleşik safeguard özetlemesi, önceki özetin tamamını olduğu gibi korumak yerine
  önceki özetleri yeni iletilerle yeniden damıtır.
- Safeguard modu varsayılan olarak özet kalite denetimlerini etkinleştirir; hatalı biçimlendirilmiş çıktı durumunda yeniden deneme davranışını atlamak için
  `qualityGuard.enabled: false` ayarlayın.
- Sağlayıcı başarısız olursa veya boş sonuç döndürürse, OpenClaw otomatik olarak yerleşik LLM özetlemesine geri döner.
- Çağıran iptaline saygı göstermek için abort/timeout sinyalleri yeniden fırlatılır (yutulmaz).

Kaynak: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## Kullanıcının görebildiği yüzeyler

Compaction ve oturum durumunu şunlarla gözlemleyebilirsiniz:

- `/status` (herhangi bir sohbet oturumunda)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Gateway günlükleri (`pnpm gateway:watch` veya `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Ayrıntılı mod: `🧹 Auto-compaction complete` + Compaction sayısı

---

## Sessiz temizlik (`NO_REPLY`)

OpenClaw, kullanıcının ara çıktıyı görmemesi gereken arka plan görevleri için "sessiz" turları destekler.

Kural:

- Asistan çıktısına, "kullanıcıya yanıt iletme" anlamına gelen tam sessiz belirteç `NO_REPLY` /
  `no_reply` ile başlar.
- OpenClaw bunu teslim katmanında çıkarır/bastırır.
- Tam sessiz belirteç bastırma büyük/küçük harfe duyarlı değildir; bu nedenle tüm yük yalnızca sessiz belirteç olduğunda `NO_REPLY` ve
  `no_reply` ikisi de geçerli sayılır.
- Bu yalnızca gerçek arka plan/teslimatsız dönüşler içindir; sıradan, eyleme dönük kullanıcı istekleri için bir kısayol değildir.

`2026.1.10` itibarıyla OpenClaw, kısmi bir parça `NO_REPLY` ile başladığında **taslak/yazma akışını** da bastırır; böylece sessiz işlemler dönüş sırasında kısmi çıktıyı sızdırmaz.

---

## Compaction öncesi "bellek boşaltma" (uygulandı)

Amaç: otomatik Compaction gerçekleşmeden önce, kalıcı durumu diske yazan sessiz bir aracılı dönüş çalıştırmak (ör. ajan çalışma alanında `memory/YYYY-MM-DD.md`), böylece Compaction kritik bağlamı silemez.

OpenClaw **ön eşik boşaltma** yaklaşımını kullanır:

1. Oturum bağlamı kullanımını izle.
2. "Yumuşak eşiği" geçtiğinde (OpenClaw çalışma zamanının Compaction eşiğinin altında), ajana sessiz bir "belleği şimdi yaz" yönergesi çalıştır.
3. Kullanıcının hiçbir şey görmemesi için tam sessiz belirteç `NO_REPLY` / `no_reply` kullan.

Yapılandırma (`agents.defaults.compaction.memoryFlush`):

- `enabled` (varsayılan: `true`)
- `model` (boşaltma dönüşü için isteğe bağlı tam sağlayıcı/model geçersiz kılması, örneğin `ollama/qwen3:8b`)
- `softThresholdTokens` (varsayılan: `4000`)
- `prompt` (boşaltma dönüşü için kullanıcı iletisi)
- `systemPrompt` (boşaltma dönüşü için eklenen ek sistem istemi)

Notlar:

- Varsayılan istem/sistem istemi, teslimi bastırmak için bir `NO_REPLY` ipucu içerir.
- `model` ayarlandığında, boşaltma dönüşü etkin oturum yedek zincirini devralmadan bu modeli kullanır; böylece yalnızca yerel bakım işleri sessizce ücretli bir konuşma modeline geri dönmez.
- Boşaltma her Compaction döngüsünde bir kez çalışır (`sessions.json` içinde izlenir).
- Boşaltma yalnızca gömülü OpenClaw oturumları için çalışır (CLI arka uçları bunu atlar).
- Oturum çalışma alanı salt okunur olduğunda (`workspaceAccess: "ro"` veya `"none"`) boşaltma atlanır.
- Çalışma alanı dosya düzeni ve yazma kalıpları için bkz. [Bellek](/tr/concepts/memory).

OpenClaw ayrıca uzantı API'sinde bir `session_before_compact` kancası sunar, ancak OpenClaw'ın boşaltma mantığı bugün Gateway tarafında bulunur.

---

## Sorun giderme kontrol listesi

- Oturum anahtarı yanlış mı? [/concepts/session](/tr/concepts/session) ile başlayın ve `/status` içindeki `sessionKey` değerini doğrulayın.
- Depo ile transkript uyuşmuyor mu? `openclaw status` çıktısından Gateway konağını ve depo yolunu doğrulayın.
- Compaction spam'i mi? Şunları kontrol edin:
  - model bağlam penceresi (çok küçük)
  - Compaction ayarları (`reserveTokens` model penceresi için çok yüksekse daha erken Compaction'a neden olabilir)
  - araç sonucu şişmesi: oturum budamayı etkinleştirin/ayarlayın
- Sessiz dönüşler sızıyor mu? Yanıtın `NO_REPLY` ile başladığını (büyük/küçük harfe duyarsız tam belirteç) ve akış bastırma düzeltmesini içeren bir derlemede olduğunuzu doğrulayın.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
- [Bağlam motoru](/tr/concepts/context-engine)
