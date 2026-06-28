---
read_when:
    - Oturum kimliklerinde, transcript JSONL'de veya sessions.json alanlarında hata ayıklamanız gerekiyor
    - Otomatik Compaction davranışını değiştiriyorsunuz veya “Compaction öncesi” temizlik işleri ekliyorsunuz
    - Bellek temizlemeleri veya sessiz sistem turları uygulamak istiyorsunuz
summary: 'Derinlemesine inceleme: oturum deposu + dökümler, yaşam döngüsü ve (otomatik) Compaction iç yapıları'
title: Oturum yönetimine derinlemesine bakış
x-i18n:
    generated_at: "2026-06-28T01:17:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d4b6195c54024a8c0096ec2462ba367dbb6e16a8f6e10f2f912b879848c65af
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw bu alanlarda oturumları uçtan uca yönetir:

- **Oturum yönlendirme** (gelen iletilerin bir `sessionKey` ile nasıl eşlendiği)
- **Oturum deposu** (`sessions.json`) ve neleri izlediği
- **Döküm kalıcılığı** (`*.jsonl`) ve yapısı
- **Döküm hijyeni** (çalıştırmalardan önce sağlayıcıya özgü düzeltmeler)
- **Bağlam sınırları** (bağlam penceresi ile izlenen tokenlar)
- **Compaction** (manuel ve otomatik Compaction) ve Compaction öncesi işi nereye bağlayacağınız
- **Sessiz bakım** (kullanıcıya görünür çıktı üretmemesi gereken bellek yazmaları)

Önce daha üst düzey bir genel bakış istiyorsanız şunlarla başlayın:

- [Oturum yönetimi](/tr/concepts/session)
- [Compaction](/tr/concepts/compaction)
- [Belleğe genel bakış](/tr/concepts/memory)
- [Bellek araması](/tr/concepts/memory-search)
- [Oturum budama](/tr/concepts/session-pruning)
- [Döküm hijyeni](/tr/reference/transcript-hygiene)

---

## Doğruluk kaynağı: Gateway

OpenClaw, oturum durumunun sahibi olan tek bir **Gateway süreci** etrafında tasarlanmıştır.

- UI'lar (macOS uygulaması, web Control UI, TUI) oturum listelerini ve token sayılarını Gateway üzerinden sorgulamalıdır.
- Uzak modda, oturum dosyaları uzak ana makinededir; "yerel Mac dosyalarınızı kontrol etmek" Gateway'in kullandığı şeyi yansıtmaz.

---

## İki kalıcılık katmanı

OpenClaw oturumları iki katmanda kalıcı hale getirir:

1. **Oturum deposu (`sessions.json`)**
   - Anahtar/değer haritası: `sessionKey -> SessionEntry`
   - Küçük, değiştirilebilir, düzenlemesi (veya girdileri silmesi) güvenli
   - Oturum meta verilerini izler (geçerli oturum kimliği, son etkinlik, anahtarlar, token sayaçları vb.)

2. **Döküm (`<sessionId>.jsonl`)**
   - Ağaç yapısına sahip yalnızca eklemeli döküm (girdiler `id` + `parentId` içerir)
   - Gerçek konuşmayı + araç çağrılarını + Compaction özetlerini depolar
   - Gelecek turlar için model bağlamını yeniden oluşturmakta kullanılır
   - Compaction denetim noktaları, sıkıştırılmış ardıl
     döküm üzerindeki meta verilerdir. Yeni Compaction işlemleri ikinci bir `.checkpoint.*.jsonl`
     kopyası yazmaz.

Gateway geçmiş okuyucuları, yüzey açıkça rastgele geçmiş erişimine ihtiyaç duymadıkça
tüm dökümü belleğe almaktan kaçınmalıdır. İlk sayfa geçmişi,
gömülü sohbet geçmişi, yeniden başlatma kurtarması ve token/kullanım denetimleri sınırlı kuyruk
okumaları kullanır. Tam döküm taramaları, dosya yolu ve `mtimeMs`/`size` ile
önbelleğe alınan ve eşzamanlı okuyucular arasında paylaşılan eşzamansız döküm dizini üzerinden gider.

---

## Disk üzerindeki konumlar

Gateway ana makinesinde, aracı başına:

- Depo: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Dökümler: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram konu oturumları: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw bunları `src/config/sessions.ts` üzerinden çözümler.

---

## Depo bakımı ve disk kontrolleri

Oturum kalıcılığında `sessions.json`, döküm yapıtları ve trajectory yan dosyaları için otomatik bakım kontrolleri (`session.maintenance`) bulunur:

- `mode`: `enforce` (varsayılan) veya `warn`
- `pruneAfter`: bayat girdi yaş sınırı (varsayılan `30d`)
- `maxEntries`: `sessions.json` içindeki girdileri sınırlar (varsayılan `500`)
- Kısa ömürlü Gateway model çalıştırma probe saklama süresi sabit olarak `24h` değerindedir, ancak baskı kapılıdır: bayat katı probe satırlarını yalnızca oturum girdisi bakımı/sınır baskısına ulaşıldığında kaldırır. Bu yalnızca `agent:*:explicit:model-run-<uuid>` ile eşleşen katı açık probe anahtarları için geçerlidir ve çalıştığında genel bayat girdi temizliği/sınırlamasından önce çalışır.
- `resetArchiveRetention`: `*.reset.<timestamp>` döküm arşivleri için saklama süresi (varsayılan: `pruneAfter` ile aynı; `false` temizliği devre dışı bırakır)
- `maxDiskBytes`: isteğe bağlı oturumlar dizini bütçesi
- `highWaterBytes`: temizlik sonrası isteğe bağlı hedef (varsayılan `maxDiskBytes` değerinin `%80`'i)

Normal Gateway yazmaları, süreç içi mutasyonları çalışma zamanı dosya kilidi almadan serileştiren depo başına oturum yazıcısından geçer. Sıcak yol yama yardımcıları, bu yazıcı slotunu tuttukları sırada doğrulanmış değiştirilebilir önbelleği ödünç alır; böylece büyük `sessions.json` dosyaları her meta veri güncellemesi için klonlanmaz veya yeniden okunmaz. Çalışma zamanı kodu `updateSessionStore(...)` veya `updateSessionStoreEntry(...)` tercih etmelidir; doğrudan tam depo kayıtları uyumluluk ve çevrimdışı bakım araçlarıdır. Gateway erişilebilir olduğunda, dry-run olmayan `openclaw sessions cleanup` ve `openclaw agents delete`, depo mutasyonlarını Gateway'e devreder; böylece temizlik aynı yazıcı kuyruğuna katılır. `--store <path>` doğrudan dosya bakımı için açık çevrimdışı onarım yoludur. `maxEntries` temizliği üretim boyutlu sınırlar için hâlâ toplu yapılır, bu nedenle bir depo bir sonraki yüksek su temizliği onu yeniden aşağı çekene kadar yapılandırılmış sınırı kısa süreliğine aşabilir. Oturum deposu okumaları Gateway başlangıcı sırasında girdileri budamaz veya sınırlamaz; temizlik için yazmaları veya `openclaw sessions cleanup --enforce` kullanın. `openclaw sessions cleanup --enforce`, disk bütçesi yapılandırılmamış olsa bile yapılandırılmış sınırı hemen uygular ve eski başvurulmayan döküm, denetim noktası ve trajectory yapıtlarını budar.

Bakım, grup oturumları ve thread kapsamlı sohbet oturumları gibi dayanıklı dış konuşma işaretçilerini korur; ancak cron, hook'lar, Heartbeat, ACP ve alt aracılar için sentetik çalışma zamanı girdileri yapılandırılmış yaş, sayı veya disk bütçesini aştıklarında yine de kaldırılabilir. Gateway model çalıştırma probe oturumları, ayrı `24h` model çalıştırma saklamasını yalnızca anahtarları tam olarak `agent:*:explicit:model-run-<uuid>` ile eşleştiğinde kullanır; diğer açık oturumlar bu saklamanın parçası değildir. Model çalıştırma temizliği yalnızca oturum girdisi sınır baskısı altında uygulanır. Yalıtılmış cron çalıştırmaları, model çalıştırma probe saklamasından bağımsız olarak kendi `cron.sessionRetention` kontrollerini tutar.

OpenClaw artık Gateway yazmaları sırasında otomatik `sessions.json.bak.*` rotasyon yedekleri oluşturmaz. Eski `session.maintenance.rotateBytes` anahtarı yok sayılır ve `openclaw doctor --fix` bunu eski yapılandırmalardan kaldırır.

Döküm mutasyonları döküm dosyasında bir oturum yazma kilidi kullanır. Kilit edinme, meşgul oturum hatası göstermeden önce
`session.writeLock.acquireTimeoutMs` kadar bekler; varsayılan `60000`
ms'dir. Bunu yalnızca meşru hazırlık, temizlik, Compaction veya döküm yansıtma işi yavaş makinelerde
daha uzun süre çekişmeye neden olduğunda artırın. `session.writeLock.staleMs`, mevcut bir kilidin ne zaman
bayat olarak geri alınabileceğini denetler; varsayılan `1800000` ms'dir. `session.writeLock.maxHoldMs`, süreç içi watchdog bırakma eşiğini denetler; varsayılan `300000` ms'dir. Acil durum env geçersiz kılmaları
`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS` ve
`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS` şeklindedir.

Disk bütçesi temizliği için uygulama sırası (`mode: "enforce"`):

1. Önce en eski arşivlenmiş, sahipsiz döküm veya sahipsiz trajectory yapıtlarını kaldır.
2. Hâlâ hedefin üzerindeyse en eski oturum girdilerini ve bunların döküm/trajectory dosyalarını çıkar.
3. Kullanım `highWaterBytes` değerinde veya altında olana kadar devam et.

`mode: "warn"` içinde OpenClaw olası çıkarmaları raporlar ancak depoyu/dosyaları değiştirmez.

Bakımı isteğe bağlı çalıştırın:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron oturumları ve çalıştırma günlükleri

Yalıtılmış cron çalıştırmaları da oturum girdileri/dökümleri oluşturur ve bunların özel saklama kontrolleri vardır:

- `cron.sessionRetention` (varsayılan `24h`), eski yalıtılmış cron çalıştırma oturumlarını oturum deposundan budar (`false` devre dışı bırakır).
- `cron.runLog.keepLines`, cron işi başına saklanan SQLite çalıştırma geçmişi satırlarını budar (varsayılan: `2000`). `cron.runLog.maxBytes`, eski dosya destekli çalıştırma günlükleri için kabul edilmeye devam eder.

Cron zorla yeni bir yalıtılmış çalıştırma oturumu oluşturduğunda, yeni satırı yazmadan önce önceki
`cron:<jobId>` oturum girdisini temizler. Düşünme/hızlı/ayrıntılı ayarlar, etiketler ve açık
kullanıcı seçimi model/auth geçersiz kılmaları gibi güvenli
tercihleri taşır. Kanal/grup yönlendirme, gönderme veya kuyruk ilkesi, yükseltme, köken ve ACP
çalışma zamanı bağlaması gibi ortam konuşma bağlamını bırakır; böylece yeni bir yalıtılmış çalıştırma eski bir çalıştırmadan bayat teslimat veya
çalışma zamanı yetkisi devralamaz.

---

## Oturum anahtarları (`sessionKey`)

Bir `sessionKey`, _hangi konuşma kovasında_ olduğunuzu tanımlar (yönlendirme + yalıtım).

Yaygın kalıplar:

- Ana/doğrudan sohbet (aracı başına): `agent:<agentId>:<mainKey>` (varsayılan `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Oda/kanal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` veya `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (geçersiz kılınmadıkça)

Standart kurallar [/concepts/session](/tr/concepts/session) adresinde belgelenmiştir.

---

## Oturum kimlikleri (`sessionId`)

Her `sessionKey`, geçerli bir `sessionId` değerine işaret eder (konuşmayı sürdüren döküm dosyası).

Genel kurallar:

- **Sıfırlama** (`/new`, `/reset`), ilgili `sessionKey` için yeni bir `sessionId` oluşturur.
- **Günlük sıfırlama** (varsayılan olarak Gateway ana makinesinin yerel saatine göre 04:00), sıfırlama sınırından sonraki ilk iletide yeni bir `sessionId` oluşturur.
- **Boşta kalma süresi dolumu** (`session.reset.idleMinutes` veya eski `session.idleMinutes`), boşta kalma penceresinden sonra bir ileti geldiğinde yeni bir `sessionId` oluşturur. Günlük + boşta kalma birlikte yapılandırıldığında önce hangisinin süresi dolarsa o kazanır.
- **Control UI yeniden bağlanma sürdürmesi**, Gateway bir operatör UI istemcisinden eşleşen `sessionId` aldığında, bir yeniden bağlanma gönderimi için o anda görünür oturumu koruyabilir. Olağan bayat gönderimler yine yeni bir `sessionId` oluşturur.
- **Sistem olayları** (Heartbeat, cron uyandırmaları, exec bildirimleri, Gateway defter tutma) oturum satırını değiştirebilir ancak günlük/boşta sıfırlama tazeliğini uzatmaz. Sıfırlama devri, yeni istem oluşturulmadan önce önceki oturum için kuyruğa alınmış sistem olayı bildirimlerini atar.
- **Üst çatallanma ilkesi**, bir thread veya alt aracı çatallanması oluştururken OpenClaw'ın etkin dalını kullanır. Bu dal çok büyükse OpenClaw çocuğu başarısız olmak veya kullanılamaz geçmiş devralmak yerine yalıtılmış bağlamla başlatır. Boyutlandırma ilkesi otomatiktir; eski `session.parentForkMaxTokens` yapılandırması `openclaw doctor --fix` tarafından kaldırılır.

Uygulama ayrıntısı: karar `src/auto-reply/reply/session.ts` içindeki `initSessionState()` içinde verilir.

---

## Oturum deposu şeması (`sessions.json`)

Deponun değer türü `src/config/sessions.ts` içindeki `SessionEntry` türüdür.

Ana alanlar (tam liste değildir):

- `sessionId`: geçerli döküm kimliği (`sessionFile` ayarlanmadığı sürece dosya adı bundan türetilir)
- `sessionStartedAt`: geçerli `sessionId` için başlangıç zaman damgası; günlük sıfırlama
  tazeliği bunu kullanır. Eski satırlar bunu JSONL oturum başlığından türetebilir.
- `lastInteractionAt`: son gerçek kullanıcı/kanal etkileşimi zaman damgası; boşta sıfırlama
  tazeliği bunu kullanır, böylece Heartbeat, cron ve exec olayları oturumları
  canlı tutmaz. Bu alanı olmayan eski satırlar, boşta kalma tazeliği için kurtarılan oturum başlangıç
  zamanına geri döner.
- `updatedAt`: listeleme, budama ve
  defter tutma için kullanılan son depo satırı mutasyon zaman damgası. Günlük/boşta sıfırlama tazeliği için yetkili kaynak değildir.
- `sessionFile`: isteğe bağlı açık döküm yolu geçersiz kılması
- `chatType`: `direct | group | room` (UI'lara ve gönderme ilkesine yardımcı olur)
- `provider`, `subject`, `room`, `space`, `displayName`: grup/kanal etiketleme için meta veriler
- Anahtarlar:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (oturum başına geçersiz kılma)
- Model seçimi:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token sayaçları (en iyi çaba / sağlayıcıya bağlı):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: bu oturum anahtarı için otomatik Compaction'ın kaç kez tamamlandığı
- `memoryFlushAt`: son Compaction öncesi bellek flush işlemi için zaman damgası
- `memoryFlushCompactionCount`: son flush çalıştığında Compaction sayısı

Depoyu düzenlemek güvenlidir, ancak yetkili kaynak Gateway'dir: oturumlar çalışırken girdileri yeniden yazabilir veya yeniden doldurabilir.

---

## Döküm yapısı (`*.jsonl`)

Dökümler, `openclaw/plugin-sdk/agent-sessions` içindeki `SessionManager` tarafından yönetilir.

Dosya JSONL'dir:

- İlk satır: oturum başlığı (`type: "session"`, `id`, `cwd`, `timestamp`, isteğe bağlı `parentSession` içerir)
- Sonra: `id` + `parentId` içeren oturum girdileri (ağaç)

Dikkate değer girdi türleri:

- `message`: kullanıcı/asistan/toolResult iletileri
- `custom_message`: model bağlamına _giren_ uzantı tarafından enjekte edilen iletiler (kullanıcı arayüzünden gizlenebilir)
- `custom`: model bağlamına _girmeyen_ uzantı durumu
- `compaction`: `firstKeptEntryId` ve `tokensBefore` ile kalıcı hale getirilen Compaction özeti
- `branch_summary`: ağaç dalında gezinirken kalıcı hale getirilen özet

OpenClaw, dökümleri bilinçli olarak **"düzeltmez"**; Gateway bunları okumak/yazmak için `SessionManager` kullanır.

---

## Bağlam pencereleri ve izlenen token'lar

İki farklı kavram önemlidir:

1. **Model bağlam penceresi**: model başına katı sınır (modelin görebildiği token'lar)
2. **Oturum deposu sayaçları**: `sessions.json` içine yazılan kayan istatistikler (/status ve panolar için kullanılır)

Sınırları ayarlıyorsanız:

- Bağlam penceresi model kataloğundan gelir (ve yapılandırma ile geçersiz kılınabilir).
- Depodaki `contextTokens` bir çalışma zamanı tahmini/raporlama değeridir; bunu katı bir garanti olarak ele almayın.

Daha fazlası için bkz. [/token-use](/tr/reference/token-use).

---

## Compaction: nedir

Compaction, eski konuşmayı dökümde kalıcı bir `compaction` girdisine özetler ve son iletileri olduğu gibi tutar.

Compaction sonrasında, gelecekteki turlar şunları görür:

- Compaction özeti
- `firstKeptEntryId` sonrasındaki iletiler

Compaction sonrasında AGENTS.md bölümlerinin yeniden enjekte edilmesi,
`agents.defaults.compaction.postCompactionSections` üzerinden isteğe bağlıdır; ayarlanmamışsa veya `[]` ise,
OpenClaw Compaction özetinin üzerine AGENTS.md alıntıları eklemez.

Compaction **kalıcıdır** (oturum budamanın aksine). Bkz. [/concepts/session-pruning](/tr/concepts/session-pruning).

## Compaction parça sınırları ve araç eşleştirme

OpenClaw uzun bir dökümü Compaction parçalarına böldüğünde,
asistan araç çağrılarını eşleşen `toolResult` girdileriyle birlikte tutar.

- Token payı bölmesi bir araç çağrısı ile sonucu arasına denk gelirse, OpenClaw
  çifti ayırmak yerine sınırı asistan araç çağrısı iletisine kaydırır.
- Sondaki bir araç sonucu bloğu aksi halde parçayı hedefin üzerine çıkaracaksa,
  OpenClaw bekleyen bu araç bloğunu korur ve özetlenmemiş kuyruğu olduğu gibi tutar.
- İptal edilmiş/hatalı araç çağrısı blokları bekleyen bir bölmeyi açık tutmaz.

---

## Otomatik Compaction ne zaman gerçekleşir (OpenClaw çalışma zamanı)

Yerleşik OpenClaw ajanında otomatik Compaction iki durumda tetiklenir:

1. **Taşma kurtarma**: model bir bağlam taşma hatası döndürür
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` ve benzer sağlayıcı biçimli varyantlar) → sıkıştır → yeniden dene.
   Sağlayıcı denenen token sayısını bildirdiğinde, OpenClaw bu gözlemlenen
   sayıyı taşma kurtarma Compaction'ına iletir. Sağlayıcı taşmayı doğrular
   ancak ayrıştırılabilir bir sayı göstermiyorsa, OpenClaw Compaction motorlarına
   ve tanılamalara bütçeyi en az aşan sentetik bir sayı geçirir.
   Taşma kurtarma hâlâ başarısız olursa, OpenClaw kullanıcıya açık yönlendirme
   gösterir ve oturum anahtarını sessizce yeni bir oturum kimliğine döndürmek
   yerine mevcut oturum eşlemesini korur. Sonraki adım operatör denetimindedir:
   iletiyi yeniden denemek, `/compact` çalıştırmak veya yeni bir oturum tercih
   edildiğinde `/new` çalıştırmak.
2. **Eşik bakımı**: başarılı bir turdan sonra, şu durumda:

`contextTokens > contextWindow - reserveTokens`

Burada:

- `contextWindow` modelin bağlam penceresidir
- `reserveTokens` istemler + bir sonraki model çıktısı için ayrılmış paydır

Bunlar OpenClaw çalışma zamanı semantik değerleridir.

OpenClaw, `agents.defaults.compaction.maxActiveTranscriptBytes` ayarlandığında
ve etkin döküm dosyası bu boyuta ulaştığında bir sonraki çalıştırmayı açmadan
önce ön uçuş yerel Compaction da tetikleyebilir. Bu, ham arşivleme değil yerel
yeniden açma maliyeti için bir dosya boyutu korumasıdır: OpenClaw yine normal
semantik Compaction çalıştırır ve sıkıştırılmış özetin yeni bir ardıl döküm
olabilmesi için `truncateAfterCompaction` gerektirir.

Yerleşik OpenClaw çalıştırmaları için `agents.defaults.compaction.midTurnPrecheck.enabled: true`
isteğe bağlı bir araç döngüsü koruması ekler. Bir araç sonucu eklendikten sonra ve
bir sonraki model çağrısından önce, OpenClaw tur başlangıcında kullanılan aynı ön uçuş
bütçe mantığıyla istem baskısını tahmin eder. Bağlam artık sığmıyorsa, koruma
OpenClaw çalışma zamanının `transformContext` kancası içinde Compaction yapmaz.
Yapılandırılmış bir tur ortası ön denetim sinyali yükseltir, mevcut istem
gönderimini durdurur ve dış çalıştırma döngüsünün mevcut kurtarma yolunu
kullanmasına izin verir: yeterli olduğunda aşırı büyük araç sonuçlarını kırpar
veya yapılandırılmış Compaction modunu tetikleyip yeniden dener. Seçenek varsayılan
olarak devre dışıdır ve sağlayıcı destekli safeguard Compaction dahil hem `default`
hem de `safeguard` Compaction modlarıyla çalışır.
Bu, `maxActiveTranscriptBytes` ayarından bağımsızdır: bayt boyutu koruması bir tur
açılmadan önce çalışır, tur ortası ön denetim ise daha sonra, yeni araç sonuçları
eklendiğinde yerleşik OpenClaw araç döngüsünde çalışır.

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

OpenClaw ayrıca yerleşik çalıştırmalar için bir güvenlik tabanı uygular:

- `compaction.reserveTokens < reserveTokensFloor` ise OpenClaw bunu yükseltir.
- Varsayılan taban `20000` token'dır.
- Tabanı devre dışı bırakmak için `agents.defaults.compaction.reserveTokensFloor: 0` ayarlayın.
- Zaten daha yüksekse, OpenClaw olduğu gibi bırakır.
- Manuel `/compact`, açık bir `agents.defaults.compaction.keepRecentTokens`
  değerini dikkate alır ve OpenClaw çalışma zamanının son kuyruk kesme noktasını korur. Açık bir tutma bütçesi olmadan,
  manuel Compaction katı bir kontrol noktası olarak kalır ve yeniden oluşturulan bağlam
  yeni özetten başlar.
- Yeni araç sonuçlarından sonra ve bir sonraki model çağrısından önce isteğe bağlı
  araç döngüsü ön denetimini çalıştırmak için `agents.defaults.compaction.midTurnPrecheck.enabled: true`
  ayarlayın. Bu yalnızca bir tetikleyicidir; özet oluşturma hâlâ yapılandırılmış
  Compaction yolunu kullanır. Bu, tur başlangıcı etkin döküm bayt boyutu koruması
  olan `maxActiveTranscriptBytes` ayarından bağımsızdır.
- Etkin döküm büyüdüğünde bir turdan önce yerel Compaction çalıştırmak için
  `agents.defaults.compaction.maxActiveTranscriptBytes` değerini bayt değeri
  veya `"20mb"` gibi bir dize olarak ayarlayın. Bu koruma yalnızca
  `truncateAfterCompaction` da etkin olduğunda etkindir. Devre dışı bırakmak için
  ayarlanmamış bırakın veya `0` ayarlayın.
- `agents.defaults.compaction.truncateAfterCompaction` etkinleştirildiğinde,
  OpenClaw Compaction sonrasında etkin dökümü sıkıştırılmış bir ardıl JSONL'ye
  döndürür. Dal/geri yükleme kontrol noktası eylemleri bu sıkıştırılmış ardılı kullanır;
  eski Compaction öncesi kontrol noktası dosyaları başvuruldukları sürece okunabilir kalır.

Neden: Compaction kaçınılmaz hâle gelmeden önce çok turlu "temizlik" işlemleri (bellek yazmaları gibi) için yeterli pay bırakmak.

Uygulama: `src/agents/agent-settings.ts` içindeki `applyAgentCompactionSettingsFromConfig()`
(yerleşik çalıştırıcı turu ve Compaction kurulum yollarından çağrılır).

---

## Takılabilir Compaction sağlayıcıları

Plugin'ler, Plugin API'sinde `registerCompactionProvider()` üzerinden bir Compaction sağlayıcısı kaydedebilir. `agents.defaults.compaction.provider` kayıtlı bir sağlayıcı kimliğine ayarlandığında, safeguard uzantısı özetlemeyi yerleşik `summarizeInStages` işlem hattı yerine bu sağlayıcıya devreder.

- `provider`: kayıtlı bir Compaction sağlayıcı Plugin'inin kimliği. Varsayılan LLM özetlemesi için ayarlanmamış bırakın.
- Bir `provider` ayarlamak `mode: "safeguard"` modunu zorunlu kılar.
- Sağlayıcılar, yerleşik yolla aynı Compaction talimatlarını ve tanımlayıcı koruma politikasını alır.
- Safeguard, sağlayıcı çıktısından sonra da son tur ve bölünmüş tur sonek bağlamını korur.
- Yerleşik safeguard özetleme, tam önceki özeti kelimesi kelimesine korumak
  yerine önceki özetleri yeni iletilerle yeniden damıtır.
- Safeguard modu varsayılan olarak özet kalite denetimlerini etkinleştirir;
  hatalı biçimlendirilmiş çıktı üzerinde yeniden deneme davranışını atlamak için
  `qualityGuard.enabled: false` ayarlayın.
- Sağlayıcı başarısız olursa veya boş bir sonuç döndürürse, OpenClaw otomatik olarak yerleşik LLM özetlemesine geri döner.
- İptal/zaman aşımı sinyalleri, çağıranın iptalini gözetmek için yeniden fırlatılır (yutulmaz).

Kaynak: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## Kullanıcıya görünen yüzeyler

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

- Asistan, "kullanıcıya yanıt iletme" anlamına gelmesi için çıktısını tam sessiz token `NO_REPLY` /
  `no_reply` ile başlatır.
- OpenClaw bunu teslim katmanında çıkarır/bastırır.
- Tam sessiz-token bastırma büyük/küçük harfe duyarsızdır; bu nedenle tüm yük
  yalnızca sessiz token olduğunda `NO_REPLY` ve `no_reply` ikisi de sayılır.
- Bu yalnızca gerçek arka plan/teslimatsız turlar içindir; sıradan eyleme dönük
  kullanıcı istekleri için bir kısayol değildir.

`2026.1.10` itibarıyla OpenClaw, kısmi bir parça `NO_REPLY` ile başladığında
**taslak/yazıyor akışını** da bastırır; böylece sessiz işlemler tur ortasında
kısmi çıktı sızdırmaz.

---

## Compaction öncesi "bellek boşaltma" (uygulandı)

Hedef: otomatik Compaction gerçekleşmeden önce, kalıcı durumu diske yazan
sessiz bir ajansı tur çalıştırmak (ör. ajan çalışma alanında `memory/YYYY-MM-DD.md`), böylece Compaction kritik bağlamı silemez.

OpenClaw **ön eşik boşaltma** yaklaşımını kullanır:

1. Oturum bağlam kullanımını izleyin.
2. "Yumuşak eşiği" geçtiğinde (OpenClaw çalışma zamanının Compaction eşiğinin altında), ajana sessiz bir
   "belleği şimdi yaz" yönergesi çalıştırın.
3. Kullanıcının hiçbir şey görmemesi için tam sessiz token `NO_REPLY` / `no_reply`
   kullanın.

Yapılandırma (`agents.defaults.compaction.memoryFlush`):

- `enabled` (varsayılan: `true`)
- `model` (boşaltma turu için isteğe bağlı tam sağlayıcı/model geçersiz kılması, örneğin `ollama/qwen3:8b`)
- `softThresholdTokens` (varsayılan: `4000`)
- `prompt` (boşaltma turu için kullanıcı iletisi)
- `systemPrompt` (boşaltma turu için eklenen ek sistem istemi)

Notlar:

- Varsayılan istem/sistem istemi teslimi bastırmak için bir `NO_REPLY` ipucu içerir.
- `model` ayarlandığında, boşaltma turu bu modeli etkin oturum geri dönüş zincirini
  devralmadan kullanır; böylece yalnızca yerel temizlik sessizce ücretli bir
  konuşma modeline geri dönmez.
- Boşaltma, her Compaction döngüsünde bir kez çalışır (`sessions.json` içinde izlenir).
- Boşaltma yalnızca yerleşik OpenClaw oturumları için çalışır (CLI arka uçları bunu atlar).
- Oturum çalışma alanı salt okunur olduğunda (`workspaceAccess: "ro"` veya `"none"`) boşaltma atlanır.
- Çalışma alanı dosya düzeni ve yazma desenleri için bkz. [Memory](/tr/concepts/memory).

OpenClaw ayrıca uzantı API'sinde bir `session_before_compact` kancası sunar, ancak OpenClaw'ın
boşaltma mantığı bugün Gateway tarafında yaşar.

---

## Sorun giderme kontrol listesi

- Oturum anahtarı yanlış mı? [/concepts/session](/tr/concepts/session) ile başlayın ve `/status` içindeki `sessionKey` değerini doğrulayın.
- Depo ile döküm uyuşmuyor mu? Gateway ana makinesini ve depo yolunu `openclaw status` ile doğrulayın.
- Compaction spam'i mi? Şunları kontrol edin:
  - model bağlam penceresi (çok küçük)
  - Compaction ayarları (`reserveTokens` model penceresi için çok yüksekse daha erken Compaction'a neden olabilir)
  - araç sonucu şişmesi: oturum budamayı etkinleştirin/ayarlayın
- Sessiz turlar sızıyor mu? Yanıtın `NO_REPLY` ile başladığını (büyük/küçük harfe duyarsız tam token) ve akış bastırma düzeltmesini içeren bir derlemede olduğunuzu doğrulayın.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
- [Bağlam motoru](/tr/concepts/context-engine)
