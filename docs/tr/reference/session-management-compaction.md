---
read_when:
    - Oturum kimlikleri, transkript JSONL'si veya sessions.json alanları üzerinde hata ayıklamanız gerekiyor
    - Otomatik Compaction davranışını değiştiriyor veya “Compaction öncesi” temizlik işlemleri ekliyorsunuz
    - Bellek temizlemeleri veya sessiz sistem turları uygulamak istiyorsunuz
summary: 'Derinlemesine inceleme: oturum deposu + transkriptler, yaşam döngüsü ve (otomatik) Compaction iç yapıları'
title: Oturum yönetimine derinlemesine bakış
x-i18n:
    generated_at: "2026-05-05T08:26:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3161dd9c98bff7ea24266f44a9261693d8a9ee2b47d9af2d152de7057016748b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw, oturumları şu alanlar boyunca uçtan uca yönetir:

- **Oturum yönlendirme** (gelen iletilerin bir `sessionKey` ile nasıl eşleştiği)
- **Oturum deposu** (`sessions.json`) ve neyi izlediği
- **Transkript kalıcılığı** (`*.jsonl`) ve yapısı
- **Transkript hijyeni** (çalıştırmalardan önce sağlayıcıya özgü düzeltmeler)
- **Bağlam sınırları** (bağlam penceresi ve izlenen token'lar)
- **Compaction** (manuel ve otomatik Compaction) ve Compaction öncesi işlere nereden bağlanılacağı
- **Sessiz bakım işleri** (kullanıcıya görünür çıktı üretmemesi gereken bellek yazımları)

Önce daha üst düzey bir genel bakış istiyorsanız şunlarla başlayın:

- [Oturum yönetimi](/tr/concepts/session)
- [Compaction](/tr/concepts/compaction)
- [Bellek genel bakışı](/tr/concepts/memory)
- [Bellek arama](/tr/concepts/memory-search)
- [Oturum budama](/tr/concepts/session-pruning)
- [Transkript hijyeni](/tr/reference/transcript-hygiene)

---

## Doğruluk kaynağı: Gateway

OpenClaw, oturum durumuna sahip olan tek bir **Gateway süreci** etrafında tasarlanmıştır.

- Kullanıcı arayüzleri (macOS uygulaması, web Control UI, TUI), oturum listeleri ve token sayıları için Gateway'i sorgulamalıdır.
- Uzak modda oturum dosyaları uzak ana makinededir; “yerel Mac dosyalarınızı denetlemek”, Gateway'in kullandığı şeyi yansıtmaz.

---

## İki kalıcılık katmanı

OpenClaw oturumları iki katmanda kalıcılaştırır:

1. **Oturum deposu (`sessions.json`)**
   - Anahtar/değer eşlemesi: `sessionKey -> SessionEntry`
   - Küçük, değiştirilebilir, düzenlemesi (veya girdileri silmesi) güvenlidir
   - Oturum meta verilerini izler (geçerli oturum kimliği, son etkinlik, açma kapama ayarları, token sayaçları vb.)

2. **Transkript (`<sessionId>.jsonl`)**
   - Ağaç yapısına sahip yalnızca eklemeli transkript (girdiler `id` + `parentId` içerir)
   - Asıl konuşmayı + araç çağrılarını + Compaction özetlerini depolar
   - Gelecekteki turlar için model bağlamını yeniden oluşturmakta kullanılır
   - Etkin transkript denetim noktası boyut üst sınırını aştığında, büyük
     Compaction öncesi hata ayıklama denetim noktaları atlanır; böylece ikinci bir dev
     `.checkpoint.*.jsonl` kopyasından kaçınılır.

Gateway geçmiş okuyucuları, yüzey açıkça rastgele geçmiş erişimine ihtiyaç duymadıkça
tüm transkripti belleğe almaktan kaçınmalıdır. İlk sayfa geçmişi,
gömülü sohbet geçmişi, yeniden başlatma kurtarması ve token/kullanım denetimleri sınırlı kuyruk
okumaları kullanır. Tam transkript taramaları, dosya yolu artı `mtimeMs`/`size` ile
önbelleğe alınan ve eşzamanlı okuyucular arasında paylaşılan zaman uyumsuz transkript dizini üzerinden geçer.

---

## Disk üzerindeki konumlar

Gateway ana makinesinde, aracı başına:

- Depo: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkriptler: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram konu oturumları: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw bunları `src/config/sessions.ts` üzerinden çözümler.

---

## Depo bakımı ve disk denetimleri

Oturum kalıcılığında `sessions.json`, transkript yapıtları ve trajectory yardımcı dosyaları için otomatik bakım denetimleri (`session.maintenance`) vardır:

- `mode`: `warn` (varsayılan) veya `enforce`
- `pruneAfter`: eski girdi yaş eşiği (varsayılan `30d`)
- `maxEntries`: `sessions.json` içindeki girdi sınırı (varsayılan `500`)
- `resetArchiveRetention`: `*.reset.<timestamp>` transkript arşivleri için saklama süresi (varsayılan: `pruneAfter` ile aynı; `false` temizliği devre dışı bırakır)
- `maxDiskBytes`: isteğe bağlı oturum dizini bütçesi
- `highWaterBytes`: temizlik sonrası isteğe bağlı hedef (varsayılan `maxDiskBytes` değerinin `%80`'i)

Normal Gateway yazımları, süreç içi mutasyonları çalışma zamanı dosya kilidi almadan serileştiren depo başına bir oturum yazıcısından geçer. Sıcak yol yama yardımcıları, bu yazıcı yuvasını tuttukları sırada doğrulanmış değiştirilebilir önbelleği ödünç alır; böylece büyük `sessions.json` dosyaları her meta veri güncellemesi için klonlanmaz veya yeniden okunmaz. Çalışma zamanı kodu `updateSessionStore(...)` veya `updateSessionStoreEntry(...)` tercih etmelidir; doğrudan tüm depo kaydetmeleri uyumluluk ve çevrimdışı bakım araçlarıdır. Gateway erişilebilir olduğunda, dry-run olmayan `openclaw sessions cleanup` ve `openclaw agents delete`, depo mutasyonlarını Gateway'e devreder; böylece temizlik aynı yazıcı kuyruğuna katılır. `--store <path>`, doğrudan dosya bakımı için açık çevrimdışı onarım yoludur. `maxEntries` temizliği üretim boyutundaki sınırlar için hâlâ toplu yapılır; bu nedenle bir depo, bir sonraki yüksek eşik temizliği onu yeniden aşağı çekmeden önce yapılandırılmış sınırı kısa süreliğine aşabilir. Oturum deposu okumaları, Gateway başlangıcı sırasında girdileri budamaz veya sınırlamaz; temizlik için yazımları ya da `openclaw sessions cleanup --enforce` kullanın. `openclaw sessions cleanup --enforce`, yapılandırılmış sınırı yine hemen uygular ve disk bütçesi yapılandırılmamış olsa bile eski başvurulmayan transkript, denetim noktası ve trajectory yapıtlarını budar.

Bakım, grup oturumları ve iş parçacığı kapsamlı sohbet oturumları gibi dayanıklı dış konuşma işaretçilerini korur,
ancak cron, hook'lar, Heartbeat, ACP ve alt aracılar için sentetik çalışma zamanı girdileri,
yapılandırılmış yaş, sayı veya disk bütçesini aştıklarında yine de kaldırılabilir.

OpenClaw artık Gateway yazımları sırasında otomatik `sessions.json.bak.*` rotasyon yedekleri oluşturmaz. Eski `session.maintenance.rotateBytes` anahtarı yok sayılır ve `openclaw doctor --fix` bunu eski yapılandırmalardan kaldırır.

Transkript mutasyonları, transkript dosyasında bir oturum yazma kilidi kullanır. Kilit edinimi, meşgul oturum hatası yüzeye çıkarılmadan önce
`session.writeLock.acquireTimeoutMs` kadar bekler; varsayılan değer `60000`
ms'dir. Bunu yalnızca meşru hazırlık, temizlik, Compaction veya transkript aynalama işi yavaş makinelerde
daha uzun süre çakıştığında artırın. Eski kilit algılama ve maksimum tutma uyarıları ayrı politikalar olarak kalır.

Disk bütçesi temizliği için uygulama sırası (`mode: "enforce"`):

1. Önce en eski arşivlenmiş, yetim transkript veya yetim trajectory yapıtlarını kaldırın.
2. Hâlâ hedefin üzerindeyse, en eski oturum girdilerini ve bunların transkript/trajectory dosyalarını çıkarın.
3. Kullanım `highWaterBytes` değerinde veya altında olana kadar devam edin.

`mode: "warn"` içinde OpenClaw olası çıkarmaları bildirir, ancak depoyu/dosyaları değiştirmez.

Bakımı isteğe bağlı çalıştırın:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron oturumları ve çalıştırma günlükleri

Yalıtılmış cron çalıştırmaları da oturum girdileri/transkriptler oluşturur ve bunların özel saklama denetimleri vardır:

- `cron.sessionRetention` (varsayılan `24h`), eski yalıtılmış cron çalıştırma oturumlarını oturum deposundan budar (`false` devre dışı bırakır).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyalarını budar (varsayılanlar: `2_000_000` bayt ve `2000` satır).

Cron yeni bir yalıtılmış çalıştırma oturumunu zorla oluşturduğunda, yeni satırı yazmadan önce önceki
`cron:<jobId>` oturum girdisini temizler. Düşünme/hızlı/ayrıntılı ayarları, etiketler ve açık
kullanıcı seçimi model/kimlik doğrulama geçersiz kılmaları gibi güvenli
tercihleri taşır. Kanal/grup yönlendirmesi, gönderme veya kuyruk politikası, yükseltme, kaynak ve ACP
çalışma zamanı bağlaması gibi ortam konuşma bağlamını bırakır; böylece yeni bir yalıtılmış çalıştırma,
eski bir çalıştırmadan eski teslimat veya çalışma zamanı yetkisini devralamaz.

---

## Oturum anahtarları (`sessionKey`)

Bir `sessionKey`, _hangi konuşma kovasında_ olduğunuzu tanımlar (yönlendirme + yalıtım).

Yaygın kalıplar:

- Ana/doğrudan sohbet (aracı başına): `agent:<agentId>:<mainKey>` (varsayılan `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Oda/kanal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` veya `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (geçersiz kılınmadıkça)

Kanonik kurallar [/concepts/session](/tr/concepts/session) adresinde belgelenmiştir.

---

## Oturum kimlikleri (`sessionId`)

Her `sessionKey`, geçerli bir `sessionId` değerine işaret eder (konuşmayı sürdüren transkript dosyası).

Genel kurallar:

- **Sıfırlama** (`/new`, `/reset`), o `sessionKey` için yeni bir `sessionId` oluşturur.
- **Günlük sıfırlama** (varsayılan olarak gateway ana makinesinde yerel saatle 04:00), sıfırlama sınırından sonraki ilk iletide yeni bir `sessionId` oluşturur.
- **Boşta kalma sona ermesi** (`session.reset.idleMinutes` veya eski `session.idleMinutes`), boşta kalma penceresinden sonra bir ileti geldiğinde yeni bir `sessionId` oluşturur. Günlük + boşta kalma birlikte yapılandırıldığında, hangisi önce sona ererse o kazanır.
- **Sistem olayları** (Heartbeat, cron uyandırmaları, exec bildirimleri, gateway kayıt işleri) oturum satırını değiştirebilir, ancak günlük/boşta sıfırlama tazeliğini uzatmaz. Sıfırlama devri, yeni istem oluşturulmadan önce önceki oturum için kuyruktaki sistem olayı bildirimlerini atar.
- **Üst çatallanma politikası**, bir iş parçacığı veya alt aracı çatallanması oluştururken PI'nin etkin dalını kullanır. Bu dal çok büyükse OpenClaw, başarısız olmak veya kullanılamaz geçmişi devralmak yerine alt öğeyi yalıtılmış bağlamla başlatır. Boyutlandırma politikası otomatiktir; eski `session.parentForkMaxTokens` yapılandırması `openclaw doctor --fix` tarafından kaldırılır.

Uygulama ayrıntısı: karar `src/auto-reply/reply/session.ts` içindeki `initSessionState()` fonksiyonunda verilir.

---

## Oturum deposu şeması (`sessions.json`)

Deponun değer türü, `src/config/sessions.ts` içindeki `SessionEntry`'dir.

Ana alanlar (kapsamlı değildir):

- `sessionId`: geçerli transkript kimliği (`sessionFile` ayarlanmadığı sürece dosya adı bundan türetilir)
- `sessionStartedAt`: geçerli `sessionId` için başlangıç zaman damgası; günlük sıfırlama
  tazeliği bunu kullanır. Eski satırlar bunu JSONL oturum başlığından türetebilir.
- `lastInteractionAt`: son gerçek kullanıcı/kanal etkileşimi zaman damgası; boşta sıfırlama
  tazeliği bunu kullanır, böylece Heartbeat, cron ve exec olayları oturumları
  canlı tutmaz. Bu alanı olmayan eski satırlar, boşta tazeliği için kurtarılan oturum başlangıç
  zamanına geri döner.
- `updatedAt`: listeleme, budama ve kayıt işleri için kullanılan son depo satırı mutasyonu zaman damgası.
  Günlük/boşta sıfırlama tazeliği için yetkili kaynak değildir.
- `sessionFile`: isteğe bağlı açık transkript yolu geçersiz kılması
- `chatType`: `direct | group | room` (kullanıcı arayüzlerine ve gönderme politikasına yardımcı olur)
- `provider`, `subject`, `room`, `space`, `displayName`: grup/kanal etiketleme için meta veriler
- Açma kapama ayarları:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (oturum başına geçersiz kılma)
- Model seçimi:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token sayaçları (en iyi çaba / sağlayıcıya bağlı):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: bu oturum anahtarı için otomatik Compaction'ın kaç kez tamamlandığı
- `memoryFlushAt`: son Compaction öncesi bellek boşaltması için zaman damgası
- `memoryFlushCompactionCount`: son boşaltma çalıştığındaki Compaction sayısı

Depoyu düzenlemek güvenlidir, ancak Gateway yetkili kaynaktır: oturumlar çalışırken girdileri yeniden yazabilir veya yeniden doldurabilir.

---

## Transkript yapısı (`*.jsonl`)

Transkriptler `@mariozechner/pi-coding-agent` paketinin `SessionManager`'ı tarafından yönetilir.

Dosya JSONL'dir:

- İlk satır: oturum başlığı (`type: "session"`, `id`, `cwd`, `timestamp`, isteğe bağlı `parentSession` içerir)
- Sonra: `id` + `parentId` içeren oturum girdileri (ağaç)

Dikkate değer girdi türleri:

- `message`: kullanıcı/asistan/toolResult iletileri
- `custom_message`: model bağlamına _giren_ uzantı tarafından enjekte edilmiş iletiler (kullanıcı arayüzünden gizlenebilir)
- `custom`: model bağlamına _girmeyen_ uzantı durumu
- `compaction`: `firstKeptEntryId` ve `tokensBefore` içeren kalıcılaştırılmış Compaction özeti
- `branch_summary`: bir ağaç dalında gezinirken kalıcılaştırılmış özet

OpenClaw transkriptleri bilinçli olarak “düzeltmez”; Gateway bunları okumak/yazmak için `SessionManager` kullanır.

---

## Bağlam pencereleri ve izlenen token'lar

İki farklı kavram önemlidir:

1. **Model bağlam penceresi**: model başına katı üst sınır (modele görünen token'lar)
2. **Oturum deposu sayaçları**: `sessions.json` içine yazılan hareketli istatistikler (/status ve panolar için kullanılır)

Sınırları ayarlıyorsanız:

- Bağlam penceresi model kataloğundan gelir (ve yapılandırma üzerinden geçersiz kılınabilir).
- Depodaki `contextTokens`, bir çalışma zamanı tahmini/raporlama değeridir; bunu katı bir garanti olarak değerlendirmeyin.

Daha fazlası için bkz. [/token-use](/tr/reference/token-use).

---

## Compaction: nedir

Compaction, eski konuşmayı transkriptte kalıcılaştırılmış bir `compaction` girdisi olarak özetler ve yakın tarihli iletileri olduğu gibi tutar.

Compaction sonrasında, gelecekteki turlar şunları görür:

- Compaction özeti
- `firstKeptEntryId` sonrasındaki iletiler

Compaction **kalıcıdır** (oturum budamasının aksine). Bkz. [/concepts/session-pruning](/tr/concepts/session-pruning).

## Compaction parça sınırları ve araç eşleştirme

OpenClaw uzun bir dökümü Compaction parçalarına böldüğünde, asistan araç çağrılarını eşleşen `toolResult` girdileriyle birlikte tutar.

- Token payı bölmesi bir araç çağrısı ile sonucu arasına denk gelirse OpenClaw, çifti ayırmak yerine sınırı asistan araç çağrısı mesajına kaydırır.
- Sondaki bir araç sonucu bloğu aksi halde parçayı hedefin üzerine çıkaracaksa OpenClaw, bekleyen bu araç bloğunu korur ve özetlenmemiş kuyruğu bozmadan bırakır.
- Durdurulmuş/hatalı araç çağrısı blokları bekleyen bir bölmeyi açık tutmaz.

---

## Otomatik Compaction ne zaman gerçekleşir (Pi çalışma zamanı)

Gömülü Pi aracısında otomatik Compaction iki durumda tetiklenir:

1. **Taşma kurtarma**: model bir bağlam taşması hatası döndürür (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` ve benzer sağlayıcı biçimli varyantlar) → compact → retry.
2. **Eşik bakımı**: başarılı bir turdan sonra, şu durumda:

`contextTokens > contextWindow - reserveTokens`

Burada:

- `contextWindow`, modelin bağlam penceresidir
- `reserveTokens`, istemler + bir sonraki model çıktısı için ayrılmış paydır

Bunlar Pi çalışma zamanı semantiğidir (OpenClaw olayları tüketir, ancak ne zaman Compaction yapılacağına Pi karar verir).

OpenClaw, `agents.defaults.compaction.maxActiveTranscriptBytes` ayarlandığında ve etkin döküm dosyası bu boyuta ulaştığında, sonraki çalıştırmayı açmadan önce ön denetim yerel Compaction da tetikleyebilir. Bu, ham arşivleme değil, yerel yeniden açma maliyeti için bir dosya boyutu korumasıdır: OpenClaw yine normal anlamsal Compaction çalıştırır ve sıkıştırılmış özetin yeni bir ardıl döküm haline gelebilmesi için `truncateAfterCompaction` gerektirir.

Gömülü Pi çalıştırmaları için `agents.defaults.compaction.midTurnPrecheck.enabled: true`, isteğe bağlı bir araç döngüsü koruması ekler. Bir araç sonucu eklendikten sonra ve sonraki model çağrısından önce OpenClaw, tur başlangıcında kullanılan aynı ön denetim bütçe mantığını kullanarak istem baskısını tahmin eder. Bağlam artık sığmıyorsa koruma, Pi'nin `transformContext` kancası içinde Compaction yapmaz. Yapılandırılmış bir tur ortası ön denetim sinyali yükseltir, geçerli istem gönderimini durdurur ve dış çalıştırma döngüsünün mevcut kurtarma yolunu kullanmasına izin verir: yeterliyse aşırı büyük araç sonuçlarını kırpar veya yapılandırılmış Compaction modunu tetikleyip yeniden dener. Seçenek varsayılan olarak devre dışıdır ve sağlayıcı destekli safeguard Compaction dahil hem `default` hem de `safeguard` Compaction modlarıyla çalışır.
Bu, `maxActiveTranscriptBytes` değerinden bağımsızdır: bayt boyutu koruması bir tur açılmadan önce çalışırken, tur ortası ön denetim yeni araç sonuçları eklendikten sonra gömülü Pi araç döngüsünde daha sonra çalışır.

---

## Compaction ayarları (`reserveTokens`, `keepRecentTokens`)

Pi'nin Compaction ayarları Pi ayarlarında bulunur:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw ayrıca gömülü çalıştırmalar için bir güvenlik tabanı uygular:

- `compaction.reserveTokens < reserveTokensFloor` ise OpenClaw bunu yükseltir.
- Varsayılan taban `20000` token’dır.
- Tabanı devre dışı bırakmak için `agents.defaults.compaction.reserveTokensFloor: 0` ayarlayın.
- Zaten daha yüksekse OpenClaw olduğu gibi bırakır.
- Manuel `/compact`, açık bir `agents.defaults.compaction.keepRecentTokens` değerine uyar ve Pi'nin son kuyruk kesme noktasını korur. Açık bir tutma bütçesi olmadan manuel Compaction katı bir kontrol noktası olarak kalır ve yeniden oluşturulan bağlam yeni özetten başlar.
- Yeni araç sonuçlarından sonra ve sonraki model çağrısından önce isteğe bağlı araç döngüsü ön denetimini çalıştırmak için `agents.defaults.compaction.midTurnPrecheck.enabled: true` ayarlayın. Bu yalnızca bir tetikleyicidir; özet üretimi yine yapılandırılmış Compaction yolunu kullanır. Tur başlangıcı etkin döküm bayt boyutu koruması olan `maxActiveTranscriptBytes` değerinden bağımsızdır.
- Etkin döküm büyüdüğünde bir turdan önce yerel Compaction çalıştırmak için `agents.defaults.compaction.maxActiveTranscriptBytes` değerini bir bayt değeri veya `"20mb"` gibi bir dize olarak ayarlayın. Bu koruma yalnızca `truncateAfterCompaction` da etkinse aktiftir. Devre dışı bırakmak için ayarlamayın veya `0` ayarlayın.
- `agents.defaults.compaction.truncateAfterCompaction` etkinleştirildiğinde OpenClaw, Compaction sonrasında etkin dökümü sıkıştırılmış ardıl bir JSONL dosyasına döndürür. Eski tam döküm yerinde yeniden yazılmak yerine arşivlenmiş olarak kalır ve Compaction kontrol noktasından bağlantılanır.

Neden: Compaction kaçınılmaz hale gelmeden önce çok turlu “bakım” işlemleri (bellek yazmaları gibi) için yeterli pay bırakmak.

Uygulama: `src/agents/pi-settings.ts` içindeki `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts` içinden çağrılır).

---

## Takılabilir Compaction sağlayıcıları

Plugin'ler, plugin API üzerinde `registerCompactionProvider()` aracılığıyla bir Compaction sağlayıcısı kaydedebilir. `agents.defaults.compaction.provider` kayıtlı bir sağlayıcı kimliğine ayarlandığında safeguard uzantısı, özetlemeyi yerleşik `summarizeInStages` işlem hattı yerine o sağlayıcıya devreder.

- `provider`: kayıtlı bir Compaction sağlayıcı Plugin kimliği. Varsayılan LLM özetlemesi için ayarlamayın.
- Bir `provider` ayarlamak `mode: "safeguard"` değerini zorunlu kılar.
- Sağlayıcılar, yerleşik yolla aynı Compaction yönergelerini ve tanımlayıcı koruma politikasını alır.
- safeguard, sağlayıcı çıktısından sonra son tur ve bölünmüş tur sonek bağlamını yine korur.
- Yerleşik safeguard özetlemesi, tam önceki özeti kelimesi kelimesine korumak yerine önceki özetleri yeni mesajlarla yeniden damıtır.
- Safeguard modu özet kalite denetimlerini varsayılan olarak etkinleştirir; hatalı biçimli çıktıda yeniden deneme davranışını atlamak için `qualityGuard.enabled: false` ayarlayın.
- Sağlayıcı başarısız olursa veya boş bir sonuç döndürürse OpenClaw otomatik olarak yerleşik LLM özetlemesine geri döner.
- Çağıran tarafın iptaline uymak için abort/zaman aşımı sinyalleri yeniden fırlatılır (yutulmaz).

Kaynak: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Kullanıcının görebildiği yüzeyler

Compaction ve oturum durumunu şunlar aracılığıyla gözlemleyebilirsiniz:

- `/status` (herhangi bir sohbet oturumunda)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Ayrıntılı mod: `🧹 Auto-compaction complete` + Compaction sayısı

---

## Sessiz bakım (`NO_REPLY`)

OpenClaw, kullanıcının ara çıktıyı görmemesi gereken arka plan görevleri için “sessiz” turları destekler.

Kural:

- Asistan, “kullanıcıya yanıt teslim etme” anlamına geldiğini belirtmek için çıktısına tam sessiz token `NO_REPLY` / `no_reply` ile başlar.
- OpenClaw bunu teslim katmanında çıkarır/bastırır.
- Tam sessiz token bastırma büyük/küçük harfe duyarsızdır; bu yüzden tüm yük yalnızca sessiz token olduğunda hem `NO_REPLY` hem de `no_reply` geçerli sayılır.
- Bu yalnızca gerçek arka plan/teslimatsız turlar içindir; sıradan uygulanabilir kullanıcı istekleri için bir kestirme değildir.

`2026.1.10` itibarıyla OpenClaw, kısmi bir parça `NO_REPLY` ile başladığında **taslak/yazıyor akışını** da bastırır; böylece sessiz işlemler turun ortasında kısmi çıktı sızdırmaz.

---

## Compaction öncesi "bellek boşaltma" (uygulandı)

Hedef: otomatik Compaction gerçekleşmeden önce, kalıcı durumu diske yazan sessiz bir aracısal tur çalıştırmak (ör. aracı çalışma alanında `memory/YYYY-MM-DD.md`), böylece Compaction kritik bağlamı silemez.

OpenClaw **eşik öncesi boşaltma** yaklaşımını kullanır:

1. Oturum bağlamı kullanımını izleyin.
2. Bir “yumuşak eşiği” (Pi'nin Compaction eşiğinin altında) geçtiğinde aracıya sessiz bir “belleği şimdi yaz” yönergesi çalıştırın.
3. Kullanıcının hiçbir şey görmemesi için tam sessiz token `NO_REPLY` / `no_reply` kullanın.

Yapılandırma (`agents.defaults.compaction.memoryFlush`):

- `enabled` (varsayılan: `true`)
- `model` (boşaltma turu için isteğe bağlı tam sağlayıcı/model geçersiz kılması, örneğin `ollama/qwen3:8b`)
- `softThresholdTokens` (varsayılan: `4000`)
- `prompt` (boşaltma turu için kullanıcı mesajı)
- `systemPrompt` (boşaltma turu için eklenen ekstra sistem istemi)

Notlar:

- Varsayılan istem/sistem istemi, teslimi bastırmak için bir `NO_REPLY` ipucu içerir.
- `model` ayarlandığında boşaltma turu, etkin oturum geri dönüş zincirini devralmadan bu modeli kullanır; böylece yalnızca yerel bakım sessizce ücretli bir konuşma modeline geri dönmez.
- Boşaltma her Compaction döngüsünde bir kez çalışır (`sessions.json` içinde izlenir).
- Boşaltma yalnızca gömülü Pi oturumları için çalışır (CLI arka uçları atlar).
- Oturum çalışma alanı salt okunursa (`workspaceAccess: "ro"` veya `"none"`) boşaltma atlanır.
- Çalışma alanı dosya düzeni ve yazma desenleri için bkz. [Memory](/tr/concepts/memory).

Pi ayrıca extension API içinde bir `session_before_compact` kancası sunar, ancak OpenClaw'ın boşaltma mantığı bugün Gateway tarafında yaşar.

---

## Sorun giderme kontrol listesi

- Oturum anahtarı yanlış mı? [/concepts/session](/tr/concepts/session) ile başlayın ve `/status` içindeki `sessionKey` değerini doğrulayın.
- Depo ile döküm uyuşmazlığı mı var? Gateway ana makinesini ve `openclaw status` çıktısındaki depo yolunu doğrulayın.
- Compaction spam’i mi var? Şunları kontrol edin:
  - model bağlam penceresi (çok küçük)
  - Compaction ayarları (`reserveTokens` model penceresi için çok yüksekse daha erken Compaction’a neden olabilir)
  - araç sonucu şişmesi: oturum budamasını etkinleştirin/ayarlayın
- Sessiz turlar sızıyor mu? Yanıtın `NO_REPLY` ile başladığını (büyük/küçük harfe duyarsız tam token) ve akış bastırma düzeltmesini içeren bir derlemede olduğunuzu doğrulayın.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
- [Bağlam motoru](/tr/concepts/context-engine)
