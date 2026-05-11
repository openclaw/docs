---
read_when:
    - Oturum kimliklerinde, transkript JSONL'inde veya sessions.json alanlarında hata ayıklamanız gerekiyor
    - Otomatik Compaction davranışını değiştiriyorsunuz veya "Compaction öncesi" bakım işlemleri ekliyorsunuz
    - Bellek boşaltmaları veya sessiz sistem turları uygulamak istiyorsunuz
summary: 'Derinlemesine inceleme: oturum deposu + dökümler, yaşam döngüsü ve (otomatik)Compaction iç işleyişi'
title: Oturum yönetimine derinlemesine bakış
x-i18n:
    generated_at: "2026-05-11T20:36:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ed30f6b1943b2ed5808c5ccdd593e6899e10fb7f75ff5911e6a9623a30ed6be
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw bu alanlarda oturumları uçtan uca yönetir:

- **Oturum yönlendirme** (gelen iletilerin bir `sessionKey` ile nasıl eşleştiği)
- **Oturum deposu** (`sessions.json`) ve neyi izlediği
- **Transkript kalıcılığı** (`*.jsonl`) ve yapısı
- **Transkript hijyeni** (çalıştırmalardan önce sağlayıcıya özgü düzeltmeler)
- **Bağlam sınırları** (bağlam penceresi ile izlenen token'lar)
- **Compaction** (elle ve otomatik Compaction) ve Compaction öncesi işi nereye bağlayacağınız
- **Sessiz bakım işleri** (kullanıcıya görünür çıktı üretmemesi gereken bellek yazımları)

Önce daha üst düzey bir genel bakış istiyorsanız şunlarla başlayın:

- [Oturum yönetimi](/tr/concepts/session)
- [Compaction](/tr/concepts/compaction)
- [Bellek genel bakışı](/tr/concepts/memory)
- [Bellek arama](/tr/concepts/memory-search)
- [Oturum budama](/tr/concepts/session-pruning)
- [Transkript hijyeni](/tr/reference/transcript-hygiene)

---

## Gerçeğin kaynağı: Gateway

OpenClaw, oturum durumunun sahibi olan tek bir **Gateway süreci** etrafında tasarlanmıştır.

- Kullanıcı arayüzleri (macOS uygulaması, web Control UI, TUI) oturum listeleri ve token sayıları için Gateway'e sorgu göndermelidir.
- Uzak modda oturum dosyaları uzak ana makinededir; "yerel Mac dosyalarınızı kontrol etmek" Gateway'in ne kullandığını yansıtmaz.

---

## İki kalıcılık katmanı

OpenClaw oturumları iki katmanda kalıcı hale getirir:

1. **Oturum deposu (`sessions.json`)**
   - Anahtar/değer eşlemesi: `sessionKey -> SessionEntry`
   - Küçük, değiştirilebilir, düzenlemesi (veya girdileri silmesi) güvenli
   - Oturum meta verilerini izler (geçerli oturum kimliği, son etkinlik, açma/kapatmalar, token sayaçları vb.)

2. **Transkript (`<sessionId>.jsonl`)**
   - Ağaç yapılı, yalnızca eklemeli transkript (girdilerde `id` + `parentId` bulunur)
   - Asıl konuşmayı + araç çağrılarını + Compaction özetlerini depolar
   - Gelecekteki turlar için model bağlamını yeniden oluşturmakta kullanılır
   - Etkin transkript kontrol noktası boyutu sınırını aştığında büyük Compaction öncesi hata ayıklama kontrol noktaları atlanır; böylece ikinci bir dev
     `.checkpoint.*.jsonl` kopyasından kaçınılır.

Gateway geçmiş okuyucuları, yüzey açıkça rastgele geçmiş erişimi gerektirmediği sürece
tüm transkripti belleğe almaktan kaçınmalıdır. İlk sayfa geçmişi,
gömülü sohbet geçmişi, yeniden başlatma kurtarması ve token/kullanım kontrolleri sınırlı kuyruk
okumaları kullanır. Tam transkript taramaları, dosya yolu artı `mtimeMs`/`size` ile
önbelleğe alınan ve eşzamanlı okuyucular arasında paylaşılan asenkron transkript indeksinden geçer.

---

## Disk üzerindeki konumlar

Gateway ana makinesinde, ajan başına:

- Depo: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkriptler: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram konu oturumları: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw bunları `src/config/sessions.ts` aracılığıyla çözümler.

---

## Depo bakımı ve disk denetimleri

Oturum kalıcılığında `sessions.json`, transkript yapıtları ve yörünge yan dosyaları için otomatik bakım denetimleri (`session.maintenance`) vardır:

- `mode`: `warn` (varsayılan) veya `enforce`
- `pruneAfter`: bayat girdi yaş eşiği (varsayılan `30d`)
- `maxEntries`: `sessions.json` içindeki girdi sınırı (varsayılan `500`)
- `resetArchiveRetention`: `*.reset.<timestamp>` transkript arşivleri için saklama süresi (varsayılan: `pruneAfter` ile aynı; `false` temizliği devre dışı bırakır)
- `maxDiskBytes`: isteğe bağlı oturumlar dizini bütçesi
- `highWaterBytes`: temizlik sonrası isteğe bağlı hedef (varsayılan `maxDiskBytes` değerinin `%80`'i)

Normal Gateway yazımları, süreç içi değişiklikleri çalışma zamanı dosya kilidi almadan serileştiren depo başına bir oturum yazıcısından geçer. Sıcak yol yama yardımcıları, bu yazıcı yuvasını tuttukları sırada doğrulanmış değiştirilebilir önbelleği ödünç alır; böylece büyük `sessions.json` dosyaları her meta veri güncellemesi için klonlanmaz veya yeniden okunmaz. Çalışma zamanı kodu `updateSessionStore(...)` veya `updateSessionStoreEntry(...)` kullanmayı tercih etmelidir; doğrudan tüm depoyu kaydetme, uyumluluk ve çevrimdışı bakım araçları içindir. Bir Gateway erişilebilir olduğunda, kuru çalıştırma olmayan `openclaw sessions cleanup` ve `openclaw agents delete`, depo değişikliklerini Gateway'e devreder; böylece temizlik aynı yazıcı kuyruğuna katılır. `--store <path>`, doğrudan dosya bakımı için açık çevrimdışı onarım yoludur. `maxEntries` temizliği üretim boyutundaki sınırlar için hâlâ toplu yapılır, bu nedenle bir depo bir sonraki yüksek su seviyesi temizliği onu yeniden aşağı çekene kadar yapılandırılmış sınırı kısa süreliğine aşabilir. Oturum deposu okumaları Gateway başlangıcı sırasında girdileri budamaz veya sınırlamaz; temizlik için yazımları veya `openclaw sessions cleanup --enforce` komutunu kullanın. `openclaw sessions cleanup --enforce`, disk bütçesi yapılandırılmamış olsa bile yapılandırılmış sınırı hemen uygular ve eski başvurulmayan transkript, kontrol noktası ve yörünge yapıtlarını budar.

Bakım, grup oturumları ve iş parçacığı kapsamlı sohbet oturumları gibi dayanıklı dış konuşma işaretçilerini korur,
ancak cron, hook'lar, heartbeat, ACP ve alt ajanlar için sentetik çalışma zamanı girdileri
yapılandırılmış yaş, sayı veya disk bütçesini aştıklarında yine de kaldırılabilir.

OpenClaw artık Gateway yazımları sırasında otomatik `sessions.json.bak.*` dönüşümlü yedekleri oluşturmaz. Eski `session.maintenance.rotateBytes` anahtarı yok sayılır ve `openclaw doctor --fix` bunu eski yapılandırmalardan kaldırır.

Transkript değişiklikleri, transkript dosyasında bir oturum yazma kilidi kullanır. Kilit edinimi,
meşgul oturum hatası göstermeden önce `session.writeLock.acquireTimeoutMs` kadar bekler; varsayılan değer `60000`
ms'dir. Bunu yalnızca meşru hazırlık, temizlik, Compaction veya transkript yansıtma işi
yavaş makinelerde daha uzun süre çakıştığında artırın. Bayat kilit algılama ve maksimum tutma uyarıları ayrı politikalar olarak kalır.

Disk bütçesi temizliği için uygulama sırası (`mode: "enforce"`):

1. Önce en eski arşivlenmiş, yetim transkript veya yetim yörünge yapıtlarını kaldır.
2. Hâlâ hedefin üzerindeyse en eski oturum girdilerini ve bunların transkript/yörünge dosyalarını çıkar.
3. Kullanım `highWaterBytes` değerinde veya altında olana kadar devam et.

`mode: "warn"` içinde OpenClaw olası çıkarmaları bildirir ancak depoyu/dosyaları değiştirmez.

Bakımı isteğe bağlı çalıştırın:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron oturumları ve çalıştırma günlükleri

Yalıtılmış cron çalıştırmaları da oturum girdileri/transkriptleri oluşturur ve bunların özel saklama denetimleri vardır:

- `cron.sessionRetention` (varsayılan `24h`), eski yalıtılmış cron çalıştırma oturumlarını oturum deposundan budar (`false` devre dışı bırakır).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyalarını budar (varsayılanlar: `2_000_000` bayt ve `2000` satır).

Cron yeni bir yalıtılmış çalıştırma oturumunu zorla oluşturduğunda, yeni satırı yazmadan önce önceki
`cron:<jobId>` oturum girdisini temizler. Düşünme/hızlı/ayrıntılı ayarları, etiketler ve açıkça
kullanıcı tarafından seçilmiş model/kimlik doğrulama geçersiz kılmaları gibi güvenli
tercihleri taşır. Kanal/grup yönlendirmesi, gönderme veya kuyruk politikası, yükseltme, kaynak ve ACP
çalışma zamanı bağlaması gibi çevresel konuşma bağlamını bırakır; böylece yeni bir yalıtılmış çalıştırma
daha eski bir çalıştırmadan bayat teslimat veya çalışma zamanı yetkisi devralamaz.

---

## Oturum anahtarları (`sessionKey`)

Bir `sessionKey`, _hangi konuşma kovasında_ olduğunuzu tanımlar (yönlendirme + yalıtım).

Yaygın desenler:

- Ana/doğrudan sohbet (ajan başına): `agent:<agentId>:<mainKey>` (varsayılan `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Oda/kanal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` veya `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (geçersiz kılınmadığı sürece)

Kurallı kurallar [/concepts/session](/tr/concepts/session) adresinde belgelenmiştir.

---

## Oturum kimlikleri (`sessionId`)

Her `sessionKey`, geçerli bir `sessionId` değerine işaret eder (konuşmayı sürdüren transkript dosyası).

Pratik kurallar:

- **Sıfırlama** (`/new`, `/reset`) bu `sessionKey` için yeni bir `sessionId` oluşturur.
- **Günlük sıfırlama** (gateway ana makinesinde varsayılan olarak yerel saatle 04:00), sıfırlama sınırından sonraki ilk iletide yeni bir `sessionId` oluşturur.
- **Boşta kalma süresi dolumu** (`session.reset.idleMinutes` veya eski `session.idleMinutes`), boşta kalma penceresinden sonra bir ileti geldiğinde yeni bir `sessionId` oluşturur. Günlük + boşta kalma birlikte yapılandırıldığında hangisinin süresi önce dolarsa o kazanır.
- **Sistem olayları** (heartbeat, cron uyandırmaları, exec bildirimleri, gateway defter tutma) oturum satırını değiştirebilir ancak günlük/boşta sıfırlama tazeliğini uzatmaz. Sıfırlama devri, yeni istem oluşturulmadan önce önceki oturum için kuyruğa alınmış sistem olayı bildirimlerini atar.
- **Üst fork politikası**, bir iş parçacığı veya alt ajan fork'u oluştururken PI'nin etkin dalını kullanır. Bu dal çok büyükse OpenClaw, başarısız olmak veya kullanılamaz geçmişi devralmak yerine çocuğu yalıtılmış bağlamla başlatır. Boyutlandırma politikası otomatiktir; eski `session.parentForkMaxTokens` yapılandırması `openclaw doctor --fix` tarafından kaldırılır.

Uygulama ayrıntısı: karar `src/auto-reply/reply/session.ts` içindeki `initSessionState()` içinde verilir.

---

## Oturum deposu şeması (`sessions.json`)

Deponun değer türü `src/config/sessions.ts` içindeki `SessionEntry`'dir.

Ana alanlar (tam liste değildir):

- `sessionId`: geçerli transkript kimliği (`sessionFile` ayarlanmadıysa dosya adı bundan türetilir)
- `sessionStartedAt`: geçerli `sessionId` için başlangıç zaman damgası; günlük sıfırlama
  tazeliği bunu kullanır. Eski satırlar bunu JSONL oturum başlığından türetebilir.
- `lastInteractionAt`: son gerçek kullanıcı/kanal etkileşimi zaman damgası; boşta sıfırlama
  tazeliği bunu kullanır, böylece heartbeat, cron ve exec olayları oturumları
  canlı tutmaz. Bu alanı olmayan eski satırlar, boşta tazeliği için kurtarılan oturum başlangıç
  zamanına geri döner.
- `updatedAt`: listeleme, budama ve
  defter tutma için kullanılan son depo satırı değişiklik zaman damgası. Günlük/boşta sıfırlama tazeliği için yetkili kaynak değildir.
- `sessionFile`: isteğe bağlı açık transkript yolu geçersiz kılması
- `chatType`: `direct | group | room` (kullanıcı arayüzlerine ve gönderme politikasına yardımcı olur)
- `provider`, `subject`, `room`, `space`, `displayName`: grup/kanal etiketlemesi için meta veriler
- Açma/kapatmalar:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (oturum başına geçersiz kılma)
- Model seçimi:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token sayaçları (en iyi çaba / sağlayıcıya bağlı):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: bu oturum anahtarı için otomatik Compaction'ın kaç kez tamamlandığı
- `memoryFlushAt`: son Compaction öncesi bellek boşaltımı için zaman damgası
- `memoryFlushCompactionCount`: son boşaltma çalıştığındaki Compaction sayısı

Depoyu düzenlemek güvenlidir, ancak yetkili kaynak Gateway'dir: oturumlar çalışırken girdileri yeniden yazabilir veya yeniden oluşturabilir.

---

## Transkript yapısı (`*.jsonl`)

Transkriptler `@earendil-works/pi-coding-agent` öğesinin `SessionManager`'ı tarafından yönetilir.

Dosya JSONL'dir:

- İlk satır: oturum başlığı (`type: "session"`, `id`, `cwd`, `timestamp`, isteğe bağlı `parentSession` içerir)
- Ardından: `id` + `parentId` içeren oturum girdileri (ağaç)

Dikkate değer girdi türleri:

- `message`: kullanıcı/asistan/toolResult iletileri
- `custom_message`: model bağlamına _giren_ uzantı tarafından enjekte edilmiş iletiler (kullanıcı arayüzünden gizlenebilir)
- `custom`: model bağlamına _girmeyen_ uzantı durumu
- `compaction`: `firstKeptEntryId` ve `tokensBefore` ile kalıcı hale getirilmiş Compaction özeti
- `branch_summary`: bir ağaç dalında gezinirken kalıcı hale getirilmiş özet

OpenClaw kasıtlı olarak transkriptleri "düzeltmez"; Gateway bunları okumak/yazmak için `SessionManager` kullanır.

---

## Bağlam pencereleri ve izlenen token'lar

İki farklı kavram önemlidir:

1. **Model bağlam penceresi**: model başına katı sınır (modelin görebildiği token'lar)
2. **Oturum deposu sayaçları**: `sessions.json` içine yazılan hareketli istatistikler (/status ve panolar için kullanılır)

Sınırları ayarlıyorsanız:

- Bağlam penceresi model kataloğundan gelir (ve yapılandırma aracılığıyla geçersiz kılınabilir).
- Depodaki `contextTokens` bir çalışma zamanı tahmini/raporlama değeridir; bunu katı bir garanti olarak görmeyin.

Daha fazlası için [/token-use](/tr/reference/token-use) sayfasına bakın.

---

## Compaction: nedir

Compaction, eski konuşmayı transkriptte kalıcı bir `compaction` girdisine özetler ve son iletileri olduğu gibi tutar.

Compaction sonrasında gelecek turlar şunları görür:

- Compaction özeti
- `firstKeptEntryId` sonrasındaki iletiler

Compaction **kalıcıdır** (oturum budamadan farklı olarak). Bkz. [/concepts/session-pruning](/tr/concepts/session-pruning).

## Compaction parça sınırları ve araç eşleştirme

OpenClaw uzun bir transkripti Compaction parçalarına böldüğünde, asistan araç çağrılarını eşleşen `toolResult` girdileriyle birlikte tutar.

- Token payı bölmesi bir araç çağrısı ile sonucu arasına denk gelirse OpenClaw, çifti ayırmak yerine sınırı asistan araç çağrısı iletisine kaydırır.
- Sondaki bir araç sonucu bloğu aksi halde parçayı hedefin üzerine çıkaracaksa OpenClaw, bekleyen bu araç bloğunu korur ve özetlenmemiş kuyruğu olduğu gibi tutar.
- Durdurulmuş/hatalı araç çağrısı blokları bekleyen bir bölmeyi açık tutmaz.

---

## Otomatik Compaction ne zaman gerçekleşir (Pi çalışma zamanı)

Gömülü Pi ajanında otomatik Compaction iki durumda tetiklenir:

1. **Taşma kurtarma**: model bir bağlam taşması hatası döndürür
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` ve benzer sağlayıcı biçimli varyantlar) → sıkıştır → yeniden dene.
2. **Eşik bakımı**: başarılı bir turdan sonra, şu durumda:

`contextTokens > contextWindow - reserveTokens`

Burada:

- `contextWindow`, modelin bağlam penceresidir
- `reserveTokens`, istemler + sonraki model çıktısı için ayrılmış boşluktur

Bunlar Pi çalışma zamanı semantik değerleridir (OpenClaw olayları tüketir, ancak ne zaman sıkıştırılacağına Pi karar verir).

OpenClaw ayrıca `agents.defaults.compaction.maxActiveTranscriptBytes` ayarlandığında ve etkin transkript dosyası bu boyuta ulaştığında, sonraki çalıştırmayı açmadan önce ön kontrol amaçlı yerel Compaction tetikleyebilir. Bu, yerel yeniden açma maliyeti için bir dosya boyutu korumasıdır; ham arşivleme değildir: OpenClaw yine normal semantik Compaction çalıştırır ve sıkıştırılmış özetin yeni bir ardıl transkript olabilmesi için `truncateAfterCompaction` gerektirir.

Gömülü Pi çalıştırmaları için `agents.defaults.compaction.midTurnPrecheck.enabled: true`, isteğe bağlı bir araç döngüsü koruması ekler. Bir araç sonucu eklendikten sonra ve sonraki model çağrısından önce OpenClaw, tur başlangıcında kullanılan aynı ön kontrol bütçe mantığını kullanarak istem baskısını tahmin eder. Bağlam artık sığmıyorsa koruma, Pi'nin `transformContext` kancası içinde sıkıştırma yapmaz. Yapılandırılmış bir tur ortası ön kontrol sinyali yükseltir, geçerli istem gönderimini durdurur ve dış çalıştırma döngüsünün mevcut kurtarma yolunu kullanmasına izin verir: yeterli olduğunda aşırı büyük araç sonuçlarını kısaltır veya yapılandırılmış Compaction modunu tetikleyip yeniden dener. Seçenek varsayılan olarak devre dışıdır ve sağlayıcı destekli safeguard Compaction dahil hem `default` hem de `safeguard` Compaction modlarıyla çalışır.
Bu, `maxActiveTranscriptBytes` değerinden bağımsızdır: bayt boyutu koruması bir tur açılmadan önce çalışır; tur ortası ön kontrol ise gömülü Pi araç döngüsünde yeni araç sonuçları eklendikten sonra daha sonra çalışır.

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

OpenClaw gömülü çalıştırmalar için ayrıca bir güvenlik tabanı uygular:

- `compaction.reserveTokens < reserveTokensFloor` ise OpenClaw bunu yükseltir.
- Varsayılan taban `20000` token’dır.
- Tabanı devre dışı bırakmak için `agents.defaults.compaction.reserveTokensFloor: 0` ayarlayın.
- Zaten daha yüksekse OpenClaw dokunmaz.
- Manuel `/compact`, açık bir `agents.defaults.compaction.keepRecentTokens` değerine uyar ve Pi'nin yakın kuyruk kesim noktasını korur. Açık bir saklama bütçesi olmadan manuel Compaction sert bir kontrol noktası olarak kalır ve yeniden oluşturulan bağlam yeni özetten başlar.
- Yeni araç sonuçlarından sonra ve sonraki model çağrısından önce isteğe bağlı araç döngüsü ön kontrolünü çalıştırmak için `agents.defaults.compaction.midTurnPrecheck.enabled: true` ayarlayın. Bu yalnızca bir tetikleyicidir; özet üretimi hâlâ yapılandırılmış Compaction yolunu kullanır. Bu, tur başlangıcı etkin transkript bayt boyutu koruması olan `maxActiveTranscriptBytes` değerinden bağımsızdır.
- Etkin transkript büyüdüğünde bir turdan önce yerel Compaction çalıştırmak için `agents.defaults.compaction.maxActiveTranscriptBytes` değerini bir bayt değeri veya `"20mb"` gibi bir dize olarak ayarlayın. Bu koruma yalnızca `truncateAfterCompaction` da etkin olduğunda aktiftir. Devre dışı bırakmak için ayarsız bırakın veya `0` ayarlayın.
- `agents.defaults.compaction.truncateAfterCompaction` etkin olduğunda OpenClaw, Compaction sonrasında etkin transkripti sıkıştırılmış bir ardıl JSONL’ye döndürür. Eski tam transkript yerinde yeniden yazılmak yerine arşivlenmiş olarak kalır ve Compaction kontrol noktasından bağlanır.

Neden: Compaction kaçınılmaz hale gelmeden önce çok turlu "temizlik" işlemleri (bellek yazmaları gibi) için yeterli boşluk bırakmak.

Uygulama: `src/agents/pi-settings.ts` içindeki `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts` içinden çağrılır).

---

## Takılabilir Compaction sağlayıcıları

Plugin'ler, Plugin API’sindeki `registerCompactionProvider()` aracılığıyla bir Compaction sağlayıcısı kaydedebilir. `agents.defaults.compaction.provider` kayıtlı bir sağlayıcı kimliğine ayarlandığında, safeguard eklentisi özetlemeyi yerleşik `summarizeInStages` hattı yerine bu sağlayıcıya devreder.

- `provider`: kayıtlı bir Compaction sağlayıcı Plugin kimliği. Varsayılan LLM özetlemesi için ayarsız bırakın.
- Bir `provider` ayarlamak `mode: "safeguard"` değerini zorunlu kılar.
- Sağlayıcılar, yerleşik yol ile aynı Compaction yönergelerini ve tanımlayıcı koruma ilkesini alır.
- Safeguard, sağlayıcı çıktısından sonra yakın tur ve bölünmüş tur son ek bağlamını yine korur.
- Yerleşik safeguard özetlemesi, tam önceki özeti kelimesi kelimesine korumak yerine önceki özetleri yeni iletilerle yeniden damıtır.
- Safeguard modu özet kalite denetimlerini varsayılan olarak etkinleştirir; hatalı biçimli çıktı durumunda yeniden deneme davranışını atlamak için `qualityGuard.enabled: false` ayarlayın.
- Sağlayıcı başarısız olursa veya boş bir sonuç döndürürse OpenClaw otomatik olarak yerleşik LLM özetlemesine geri döner.
- Durdurma/zaman aşımı sinyalleri, çağıranın iptaline saygı göstermek için yeniden fırlatılır (yutulmaz).

Kaynak: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Kullanıcının görebildiği yüzeyler

Compaction ve oturum durumunu şunlar üzerinden gözlemleyebilirsiniz:

- `/status` (herhangi bir sohbet oturumunda)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Gateway günlükleri (`pnpm gateway:watch` veya `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Ayrıntılı mod: `🧹 Auto-compaction complete` + Compaction sayısı

---

## Sessiz temizlik (`NO_REPLY`)

OpenClaw, kullanıcının ara çıktıları görmemesi gereken arka plan görevleri için "sessiz" turları destekler.

Kural:

- Asistan, "kullanıcıya yanıt iletme" anlamına gelen tam sessiz token `NO_REPLY` / `no_reply` ile çıktısını başlatır.
- OpenClaw bunu teslim katmanında kaldırır/bastırır.
- Tam sessiz token bastırma büyük/küçük harfe duyarsızdır; bu nedenle tüm yük yalnızca sessiz token ise hem `NO_REPLY` hem de `no_reply` geçerlidir.
- Bu yalnızca gerçekten arka plan/teslimatsız turlar içindir; sıradan işlem gerektiren kullanıcı istekleri için bir kısayol değildir.

`2026.1.10` itibarıyla OpenClaw, kısmi bir parça `NO_REPLY` ile başladığında **taslak/yazıyor akışını** da bastırır; böylece sessiz işlemler tur ortasında kısmi çıktı sızdırmaz.

---

## Compaction öncesi "bellek boşaltma" (uygulandı)

Amaç: otomatik Compaction gerçekleşmeden önce, kalıcı durumu diske yazan sessiz bir ajansal tur çalıştırmak (ör. ajan çalışma alanında `memory/YYYY-MM-DD.md`) ve böylece Compaction’ın kritik bağlamı silememesini sağlamak.

OpenClaw **ön eşik boşaltma** yaklaşımını kullanır:

1. Oturum bağlam kullanımını izleyin.
2. Pi'nin Compaction eşiğinin altında bir "yumuşak eşiği" geçtiğinde, ajana sessiz bir "belleği şimdi yaz" yönergesi çalıştırın.
3. Kullanıcının hiçbir şey görmemesi için tam sessiz token `NO_REPLY` / `no_reply` kullanın.

Yapılandırma (`agents.defaults.compaction.memoryFlush`):

- `enabled` (varsayılan: `true`)
- `model` (boşaltma turu için isteğe bağlı tam sağlayıcı/model geçersiz kılması, örneğin `ollama/qwen3:8b`)
- `softThresholdTokens` (varsayılan: `4000`)
- `prompt` (boşaltma turu için kullanıcı iletisi)
- `systemPrompt` (boşaltma turu için eklenen ek sistem istemi)

Notlar:

- Varsayılan istem/sistem istemi, teslimi bastırmak için bir `NO_REPLY` ipucu içerir.
- `model` ayarlandığında, boşaltma turu etkin oturum yedek zincirini devralmadan bu modeli kullanır; böylece yalnızca yerel temizlik sessizce ücretli bir konuşma modeline geri dönmez.
- Boşaltma her Compaction döngüsünde bir kez çalışır (`sessions.json` içinde izlenir).
- Boşaltma yalnızca gömülü Pi oturumları için çalışır (CLI arka uçları atlar).
- Oturum çalışma alanı salt okunur olduğunda (`workspaceAccess: "ro"` veya `"none"`) boşaltma atlanır.
- Çalışma alanı dosya düzeni ve yazma desenleri için bkz. [Bellek](/tr/concepts/memory).

Pi ayrıca uzantı API’sinde bir `session_before_compact` kancası sunar, ancak OpenClaw’ın boşaltma mantığı bugün Gateway tarafında bulunur.

---

## Sorun giderme kontrol listesi

- Oturum anahtarı yanlış mı? [/concepts/session](/tr/concepts/session) ile başlayın ve `/status` içindeki `sessionKey` değerini doğrulayın.
- Depo ile transkript uyumsuz mu? `openclaw status` çıktısından Gateway ana makinesini ve depo yolunu doğrulayın.
- Compaction spam’i mi? Şunları kontrol edin:
  - model bağlam penceresi (çok küçük)
  - Compaction ayarları (`reserveTokens` model penceresi için çok yüksekse daha erken Compaction’a neden olabilir)
  - araç sonucu şişmesi: oturum budamayı etkinleştirin/ayarlayın
- Sessiz turlar sızıyor mu? Yanıtın `NO_REPLY` ile başladığını (büyük/küçük harfe duyarsız tam token) ve akış bastırma düzeltmesini içeren bir derlemede olduğunuzu doğrulayın.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
- [Bağlam motoru](/tr/concepts/context-engine)
