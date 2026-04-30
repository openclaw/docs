---
read_when:
    - Oturum kimliklerinde, döküm JSONL'sinde veya sessions.json alanlarında hata ayıklamanız gerekir
    - Otomatik Compaction davranışını değiştiriyor veya “Compaction öncesi” bakım işleri ekliyorsunuz
    - Bellek temizlemelerini veya sessiz sistem turlarını uygulamak istiyorsunuz
summary: 'Derinlemesine inceleme: oturum deposu + dökümler, yaşam döngüsü ve (otomatik)Compaction iç işleyişi'
title: Oturum yönetimine derinlemesine bakış
x-i18n:
    generated_at: "2026-04-30T16:30:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a6a7031cebd90d27784a32a0d0378ea9959249389d209f0745395f90b8a0df9
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw oturumları şu alanlarda uçtan uca yönetir:

- **Oturum yönlendirme** (gelen iletilerin bir `sessionKey` ile nasıl eşleştiği)
- **Oturum deposu** (`sessions.json`) ve neleri izlediği
- **Konuşma dökümü kalıcılığı** (`*.jsonl`) ve yapısı
- **Konuşma dökümü hijyeni** (çalıştırmalardan önce sağlayıcıya özgü düzeltmeler)
- **Bağlam sınırları** (bağlam penceresi ve izlenen token’lar)
- **Compaction** (manuel ve otomatik Compaction) ve Compaction öncesi işlerin nereye bağlanacağı
- **Sessiz bakım işleri** (kullanıcıya görünür çıktı üretmemesi gereken bellek yazmaları)

Önce daha üst düzey bir genel bakış istiyorsanız şunlarla başlayın:

- [Oturum yönetimi](/tr/concepts/session)
- [Compaction](/tr/concepts/compaction)
- [Belleğe genel bakış](/tr/concepts/memory)
- [Bellek arama](/tr/concepts/memory-search)
- [Oturum budama](/tr/concepts/session-pruning)
- [Konuşma dökümü hijyeni](/tr/reference/transcript-hygiene)

---

## Doğruluk kaynağı: Gateway

OpenClaw, oturum durumunun sahibi olan tek bir **Gateway süreci** etrafında tasarlanmıştır.

- Kullanıcı arayüzleri (macOS uygulaması, web Control UI, TUI) oturum listeleri ve token sayıları için Gateway’i sorgulamalıdır.
- Uzak modda oturum dosyaları uzak ana makinededir; “yerel Mac dosyalarınızı kontrol etmek” Gateway’in ne kullandığını yansıtmaz.

---

## İki kalıcılık katmanı

OpenClaw oturumları iki katmanda kalıcı hale getirir:

1. **Oturum deposu (`sessions.json`)**
   - Anahtar/değer eşlemesi: `sessionKey -> SessionEntry`
   - Küçük, değiştirilebilir, düzenlemesi güvenli (veya girdileri silebilirsiniz)
   - Oturum meta verilerini izler (geçerli oturum kimliği, son etkinlik, anahtarlar, token sayaçları vb.)

2. **Konuşma dökümü (`<sessionId>.jsonl`)**
   - Ağaç yapılı, yalnızca ekleme yapılan konuşma dökümü (girdilerde `id` + `parentId` bulunur)
   - Gerçek konuşmayı + araç çağrılarını + Compaction özetlerini depolar
   - Gelecekteki dönüşlerde model bağlamını yeniden oluşturmak için kullanılır
   - Etkin konuşma dökümü kontrol noktası boyutu üst sınırını aştığında, Compaction öncesi büyük hata ayıklama kontrol noktaları atlanır; böylece ikinci bir dev `.checkpoint.*.jsonl` kopyasından kaçınılır.

---

## Disk üzerindeki konumlar

Gateway ana makinesinde, ajan başına:

- Depo: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Konuşma dökümleri: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram konu oturumları: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw bunları `src/config/sessions.ts` üzerinden çözer.

---

## Depo bakımı ve disk denetimleri

Oturum kalıcılığında `sessions.json`, konuşma dökümü yapıtları ve trajectory yan dosyaları için otomatik bakım denetimleri (`session.maintenance`) vardır:

- `mode`: `warn` (varsayılan) veya `enforce`
- `pruneAfter`: bayat girdi yaş eşiği (varsayılan `30d`)
- `maxEntries`: `sessions.json` içindeki girdi üst sınırı (varsayılan `500`)
- `resetArchiveRetention`: `*.reset.<timestamp>` konuşma dökümü arşivleri için saklama süresi (varsayılan: `pruneAfter` ile aynı; `false` temizlemeyi devre dışı bırakır)
- `maxDiskBytes`: isteğe bağlı oturumlar dizini bütçesi
- `highWaterBytes`: temizleme sonrası isteğe bağlı hedef (varsayılan `maxDiskBytes` değerinin `%80`’i)

Normal Gateway yazmaları, üretim boyutlu sınırlar için `maxEntries` temizlemesini toplu işler; bu yüzden bir depo, bir sonraki yüksek su seviyesi temizliği onu tekrar küçültüp yazmadan önce yapılandırılmış sınırı kısa süreliğine aşabilir. `openclaw sessions cleanup --enforce` yapılandırılmış sınırı yine de hemen uygular.

OpenClaw artık Gateway yazmaları sırasında otomatik `sessions.json.bak.*` dönüşümlü yedekleri oluşturmaz. Eski `session.maintenance.rotateBytes` anahtarı yok sayılır ve `openclaw doctor --fix` bunu eski yapılandırmalardan kaldırır.

Disk bütçesi temizliği için uygulama sırası (`mode: "enforce"`):

1. Önce en eski arşivlenmiş, sahipsiz konuşma dökümü veya sahipsiz trajectory yapıtlarını kaldır.
2. Hâlâ hedefin üzerindeyse, en eski oturum girdilerini ve bunların konuşma dökümü/trajectory dosyalarını çıkar.
3. Kullanım `highWaterBytes` değerinde veya altında olana kadar devam et.

`mode: "warn"` içinde OpenClaw olası çıkarmaları bildirir ancak depoyu/dosyaları değiştirmez.

Bakımı isteğe bağlı çalıştırın:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron oturumları ve çalıştırma günlükleri

Yalıtılmış cron çalıştırmaları da oturum girdileri/konuşma dökümleri oluşturur ve bunların özel saklama denetimleri vardır:

- `cron.sessionRetention` (varsayılan `24h`), eski yalıtılmış cron çalıştırma oturumlarını oturum deposundan budar (`false` devre dışı bırakır).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyalarını budar (varsayılanlar: `2_000_000` bayt ve `2000` satır).

Cron yeni bir yalıtılmış çalıştırma oturumunu zorla oluşturduğunda, yeni satırı yazmadan önce önceki `cron:<jobId>` oturum girdisini temizler. Düşünme/hızlı/ayrıntılı ayarları, etiketler ve açıkça kullanıcı tarafından seçilmiş model/kimlik doğrulama geçersiz kılmaları gibi güvenli tercihleri taşır. Kanal/grup yönlendirmesi, gönderme veya kuyruk ilkesi, yükseltme, kaynak ve ACP çalışma zamanı bağlaması gibi ortam konuşma bağlamını bırakır; böylece yeni bir yalıtılmış çalıştırma, eski bir çalıştırmadan bayat teslimat veya çalışma zamanı yetkisi devralamaz.

---

## Oturum anahtarları (`sessionKey`)

Bir `sessionKey`, _hangi konuşma kovasında_ olduğunuzu tanımlar (yönlendirme + yalıtım).

Yaygın kalıplar:

- Ana/doğrudan sohbet (ajan başına): `agent:<agentId>:<mainKey>` (varsayılan `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Oda/kanal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` veya `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (geçersiz kılınmadıkça)

Standart kurallar [/concepts/session](/tr/concepts/session) sayfasında belgelenmiştir.

---

## Oturum kimlikleri (`sessionId`)

Her `sessionKey`, geçerli bir `sessionId` değerine işaret eder (konuşmayı sürdüren konuşma dökümü dosyası).

Genel kurallar:

- **Sıfırlama** (`/new`, `/reset`), ilgili `sessionKey` için yeni bir `sessionId` oluşturur.
- **Günlük sıfırlama** (varsayılan olarak Gateway ana makinesinin yerel saatine göre 04:00), sıfırlama sınırından sonraki ilk iletide yeni bir `sessionId` oluşturur.
- **Boşta kalma süresi dolumu** (`session.reset.idleMinutes` veya eski `session.idleMinutes`), boşta kalma penceresinden sonra bir ileti geldiğinde yeni bir `sessionId` oluşturur. Günlük ve boşta kalma birlikte yapılandırılmışsa, önce hangisinin süresi dolarsa o kazanır.
- **Sistem olayları** (Heartbeat, cron uyandırmaları, exec bildirimleri, Gateway kayıt işleri) oturum satırını değiştirebilir ancak günlük/boşta sıfırlama tazeliğini uzatmaz. Sıfırlama devri, yeni istem oluşturulmadan önce önceki oturum için kuyruğa alınmış sistem olayı bildirimlerini atar.
- **İş parçacığı üst öğe çatallanma koruması** (`session.parentForkMaxTokens`, varsayılan `100000`), üst oturum zaten çok büyükse üst konuşma dökümü çatallanmasını atlar; yeni iş parçacığı temiz başlar. Devre dışı bırakmak için `0` ayarlayın.

Uygulama ayrıntısı: karar `src/auto-reply/reply/session.ts` içindeki `initSessionState()` içinde verilir.

---

## Oturum deposu şeması (`sessions.json`)

Deponun değer türü, `src/config/sessions.ts` içindeki `SessionEntry` türüdür.

Önemli alanlar (tam liste değildir):

- `sessionId`: geçerli konuşma dökümü kimliği (`sessionFile` ayarlanmadıkça dosya adı bundan türetilir)
- `sessionStartedAt`: geçerli `sessionId` için başlangıç zaman damgası; günlük sıfırlama tazeliği bunu kullanır. Eski satırlar bunu JSONL oturum başlığından türetebilir.
- `lastInteractionAt`: son gerçek kullanıcı/kanal etkileşimi zaman damgası; boşta sıfırlama tazeliği bunu kullanır, bu nedenle Heartbeat, cron ve exec olayları oturumları canlı tutmaz. Bu alanı olmayan eski satırlar, boşta tazelik için kurtarılan oturum başlangıç zamanına geri döner.
- `updatedAt`: listeleme, budama ve kayıt işleri için kullanılan son depo satırı değişiklik zaman damgası. Günlük/boşta sıfırlama tazeliği için yetkili kaynak değildir.
- `sessionFile`: isteğe bağlı açık konuşma dökümü yolu geçersiz kılması
- `chatType`: `direct | group | room` (kullanıcı arayüzlerine ve gönderme ilkesine yardımcı olur)
- `provider`, `subject`, `room`, `space`, `displayName`: grup/kanal etiketleme için meta veriler
- Anahtarlar:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (oturum başına geçersiz kılma)
- Model seçimi:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token sayaçları (en iyi çaba / sağlayıcıya bağlı):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: bu oturum anahtarı için otomatik Compaction’ın kaç kez tamamlandığı
- `memoryFlushAt`: son Compaction öncesi bellek boşaltması için zaman damgası
- `memoryFlushCompactionCount`: son boşaltma çalıştığındaki Compaction sayısı

Depoyu düzenlemek güvenlidir, ancak yetkili kaynak Gateway’dir: oturumlar çalışırken girdileri yeniden yazabilir veya yeniden oluşturabilir.

---

## Konuşma dökümü yapısı (`*.jsonl`)

Konuşma dökümleri `@mariozechner/pi-coding-agent` paketinin `SessionManager`’ı tarafından yönetilir.

Dosya JSONL biçimindedir:

- İlk satır: oturum başlığı (`type: "session"`, `id`, `cwd`, `timestamp`, isteğe bağlı `parentSession` içerir)
- Sonra: `id` + `parentId` içeren oturum girdileri (ağaç)

Dikkate değer girdi türleri:

- `message`: kullanıcı/asistan/toolResult iletileri
- `custom_message`: model bağlamına _giren_ uzantı tarafından enjekte edilmiş iletiler (UI’dan gizlenebilir)
- `custom`: model bağlamına _girmeyen_ uzantı durumu
- `compaction`: `firstKeptEntryId` ve `tokensBefore` içeren kalıcı Compaction özeti
- `branch_summary`: bir ağaç dalında gezinirken kalıcı özet

OpenClaw konuşma dökümlerini bilerek “düzeltmez”; Gateway bunları okumak/yazmak için `SessionManager` kullanır.

---

## Bağlam pencereleri ve izlenen token’lar

İki farklı kavram önemlidir:

1. **Model bağlam penceresi**: model başına katı üst sınır (modelin görebildiği token’lar)
2. **Oturum deposu sayaçları**: `sessions.json` içine yazılan yuvarlanan istatistikler (/status ve panolar için kullanılır)

Sınırları ayarlıyorsanız:

- Bağlam penceresi model kataloğundan gelir (ve yapılandırma ile geçersiz kılınabilir).
- Depodaki `contextTokens`, çalışma zamanı tahmini/raporlama değeridir; bunu katı bir garanti olarak görmeyin.

Daha fazlası için bkz. [/token-use](/tr/reference/token-use).

---

## Compaction: nedir

Compaction, eski konuşmayı konuşma dökümünde kalıcı bir `compaction` girdisine özetler ve son iletileri olduğu gibi tutar.

Compaction’dan sonra gelecekteki dönüşler şunları görür:

- Compaction özeti
- `firstKeptEntryId` sonrasındaki iletiler

Compaction **kalıcıdır** (oturum budamanın aksine). Bkz. [/concepts/session-pruning](/tr/concepts/session-pruning).

## Compaction parça sınırları ve araç eşleştirme

OpenClaw uzun bir konuşma dökümünü Compaction parçalarına böldüğünde, asistan araç çağrılarını eşleşen `toolResult` girdileriyle birlikte tutar.

- Token payına göre yapılan bölme bir araç çağrısı ile sonucu arasına denk gelirse, OpenClaw çifti ayırmak yerine sınırı asistan araç çağrısı iletisine kaydırır.
- Sondaki bir araç sonucu bloğu parçayı hedefin üzerine çıkaracaksa, OpenClaw bekleyen araç bloğunu korur ve özetlenmemiş kuyruğu olduğu gibi tutar.
- İptal edilmiş/hatalı araç çağrısı blokları bekleyen bir bölmeyi açık tutmaz.

---

## Otomatik Compaction ne zaman gerçekleşir (Pi çalışma zamanı)

Gömülü Pi ajanında otomatik Compaction iki durumda tetiklenir:

1. **Taşma kurtarma**: model bir bağlam taşması hatası döndürür (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` ve benzer sağlayıcı biçimli varyantlar) → compact → retry.
2. **Eşik bakımı**: başarılı bir dönüşten sonra, şu durumda:

`contextTokens > contextWindow - reserveTokens`

Burada:

- `contextWindow`, modelin bağlam penceresidir
- `reserveTokens`, istemler + sonraki model çıktısı için ayrılmış paydır

Bunlar Pi çalışma zamanı semantiğidir (OpenClaw olayları tüketir, ancak ne zaman compact yapılacağına Pi karar verir).

OpenClaw ayrıca, `agents.defaults.compaction.maxActiveTranscriptBytes` ayarlandığında ve etkin konuşma dökümü dosyası bu boyuta ulaştığında, sonraki çalıştırmayı açmadan önce ön kontrol yerel Compaction tetikleyebilir. Bu, ham arşivleme için değil yerel yeniden açma maliyeti için bir dosya boyutu korumasıdır: OpenClaw yine de normal semantik Compaction çalıştırır ve sıkıştırılmış özetin yeni bir ardıl konuşma dökümü olabilmesi için `truncateAfterCompaction` gerektirir.

Gömülü Pi çalıştırmaları için `agents.defaults.compaction.midTurnPrecheck.enabled: true`
isteğe bağlı bir araç döngüsü koruması ekler. Bir araç sonucu eklendikten sonra ve
sonraki model çağrısından önce OpenClaw, tur başlangıcında kullanılan aynı ön kontrol
bütçe mantığını kullanarak istem baskısını tahmin eder. Bağlam artık sığmıyorsa,
koruma Pi'nin `transformContext` kancası içinde Compaction yapmaz. Yapılandırılmış
bir tur ortası ön kontrol sinyali yükseltir, geçerli istem gönderimini durdurur ve
dış çalıştırma döngüsünün mevcut kurtarma yolunu kullanmasına izin verir: yeterli
olduğunda aşırı büyük araç sonuçlarını kırpar veya yapılandırılmış Compaction modunu
tetikleyip yeniden dener. Seçenek varsayılan olarak devre dışıdır ve sağlayıcı destekli
koruma Compaction dahil olmak üzere hem `default` hem de `safeguard` Compaction
modlarıyla çalışır.
Bu, `maxActiveTranscriptBytes` ayarından bağımsızdır: bayt boyutu koruması
bir tur açılmadan önce çalışır; tur ortası ön kontrol ise yeni araç sonuçları
eklendikten sonra gömülü Pi araç döngüsünde daha sonra çalışır.

---

## Compaction ayarları (`reserveTokens`, `keepRecentTokens`)

Pi’nin Compaction ayarları Pi ayarlarında bulunur:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw, gömülü çalıştırmalar için bir güvenlik tabanı da uygular:

- `compaction.reserveTokens < reserveTokensFloor` ise OpenClaw bunu yükseltir.
- Varsayılan taban `20000` token’dır.
- Tabanı devre dışı bırakmak için `agents.defaults.compaction.reserveTokensFloor: 0` ayarlayın.
- Zaten daha yüksekse OpenClaw bunu olduğu gibi bırakır.
- Elle `/compact`, açık bir `agents.defaults.compaction.keepRecentTokens`
  ayarına uyar ve Pi'nin son kuyruk kesim noktasını korur. Açık bir saklama bütçesi
  olmadan, elle Compaction katı bir kontrol noktası olarak kalır ve yeniden oluşturulan
  bağlam yeni özetten başlar.
- Yeni araç sonuçlarından sonra ve sonraki model çağrısından önce isteğe bağlı
  araç döngüsü ön kontrolünü çalıştırmak için
  `agents.defaults.compaction.midTurnPrecheck.enabled: true` ayarlayın. Bu yalnızca
  bir tetikleyicidir; özet üretimi yine yapılandırılmış Compaction yolunu kullanır.
  Bu, tur başlangıcında çalışan aktif konuşma dökümü bayt boyutu koruması olan
  `maxActiveTranscriptBytes` ayarından bağımsızdır.
- Aktif konuşma dökümü büyüdüğünde bir turdan önce yerel Compaction çalıştırmak için
  `agents.defaults.compaction.maxActiveTranscriptBytes` ayarını bir bayt değeri veya
  `"20mb"` gibi bir dize olarak ayarlayın. Bu koruma yalnızca
  `truncateAfterCompaction` da etkin olduğunda aktiftir. Devre dışı bırakmak için
  ayarı boş bırakın veya `0` olarak ayarlayın.
- `agents.defaults.compaction.truncateAfterCompaction` etkinleştirildiğinde,
  OpenClaw Compaction sonrasında aktif konuşma dökümünü sıkıştırılmış bir ardıl
  JSONL dosyasına döndürür. Eski tam konuşma dökümü yerinde yeniden yazılmak yerine
  arşivlenmiş olarak kalır ve Compaction kontrol noktasından bağlanır.

Neden: Compaction kaçınılmaz hale gelmeden önce çok turlu “bakım” işlemleri (bellek yazmaları gibi) için yeterli alan bırakmak.

Uygulama: `src/agents/pi-settings.ts` içinde `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts` içinden çağrılır).

---

## Takılabilir Compaction sağlayıcıları

Plugin'ler, Plugin API üzerinde `registerCompactionProvider()` aracılığıyla bir Compaction sağlayıcısı kaydedebilir. `agents.defaults.compaction.provider` kayıtlı bir sağlayıcı kimliğine ayarlandığında, koruma Plugin'i özetlemeyi yerleşik `summarizeInStages` hattı yerine bu sağlayıcıya devreder.

- `provider`: kayıtlı bir Compaction sağlayıcısı Plugin'inin kimliği. Varsayılan LLM özetleme için boş bırakın.
- Bir `provider` ayarlamak `mode: "safeguard"` modunu zorunlu kılar.
- Sağlayıcılar, yerleşik yolla aynı Compaction yönergelerini ve tanımlayıcı koruma politikasını alır.
- Koruma, sağlayıcı çıktısından sonra da son tur ve bölünmüş tur sonek bağlamını korur.
- Yerleşik koruma özetleme, tam önceki özeti kelimesi kelimesine korumak yerine
  önceki özetleri yeni mesajlarla yeniden damıtır.
- Koruma modu varsayılan olarak özet kalite denetimlerini etkinleştirir;
  hatalı biçimli çıktı durumunda yeniden deneme davranışını atlamak için
  `qualityGuard.enabled: false` ayarlayın.
- Sağlayıcı başarısız olursa veya boş bir sonuç döndürürse, OpenClaw otomatik olarak yerleşik LLM özetlemeye geri döner.
- Çağıranın iptalini gözetmek için iptal/zaman aşımı sinyalleri yeniden fırlatılır (yutulmaz).

Kaynak: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Kullanıcıya görünen yüzeyler

Compaction ve oturum durumunu şunlar aracılığıyla gözlemleyebilirsiniz:

- `/status` (herhangi bir sohbet oturumunda)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Ayrıntılı mod: `🧹 Auto-compaction complete` + Compaction sayısı

---

## Sessiz bakım (`NO_REPLY`)

OpenClaw, kullanıcının ara çıktıyı görmemesi gereken arka plan görevleri için “sessiz” turları destekler.

Kural:

- Asistan, “kullanıcıya yanıt iletme” anlamını belirtmek için çıktısını tam sessiz token olan `NO_REPLY` /
  `no_reply` ile başlatır.
- OpenClaw bunu teslim katmanında kaldırır/bastırır.
- Tam sessiz token bastırma büyük/küçük harfe duyarsızdır; bu nedenle tüm yük yalnızca sessiz token olduğunda `NO_REPLY` ve
  `no_reply` ikisi de geçerli sayılır.
- Bu yalnızca gerçek arka plan/teslimatsız turlar içindir; sıradan işlem gerektiren
  kullanıcı istekleri için bir kestirme değildir.

`2026.1.10` itibarıyla OpenClaw, kısmi bir parça `NO_REPLY` ile başladığında
**taslak/yazıyor akışını** da bastırır; böylece sessiz işlemler tur ortasında kısmi
çıktı sızdırmaz.

---

## Compaction öncesi "bellek boşaltma" (uygulandı)

Amaç: otomatik Compaction gerçekleşmeden önce, dayanıklı durumu diske yazan
sessiz bir ajansal tur çalıştırmak (ör. ajan çalışma alanında `memory/YYYY-MM-DD.md`);
böylece Compaction kritik bağlamı silemez.

OpenClaw **ön eşik boşaltma** yaklaşımını kullanır:

1. Oturum bağlamı kullanımını izleyin.
2. Bir “yumuşak eşiği” (Pi’nin Compaction eşiğinin altında) geçtiğinde, ajana sessiz
   bir “belleği şimdi yaz” yönergesi çalıştırın.
3. Kullanıcı hiçbir şey görmesin diye tam sessiz token olan `NO_REPLY` / `no_reply`
   kullanın.

Yapılandırma (`agents.defaults.compaction.memoryFlush`):

- `enabled` (varsayılan: `true`)
- `model` (boşaltma turu için isteğe bağlı tam sağlayıcı/model geçersiz kılması, örneğin `ollama/qwen3:8b`)
- `softThresholdTokens` (varsayılan: `4000`)
- `prompt` (boşaltma turu için kullanıcı mesajı)
- `systemPrompt` (boşaltma turu için eklenen ek sistem istemi)

Notlar:

- Varsayılan istem/sistem istemi, teslimi bastırmak için bir `NO_REPLY` ipucu içerir.
- `model` ayarlandığında, boşaltma turu aktif oturum yedek zincirini devralmadan
  bu modeli kullanır; böylece yalnızca yerel bakım sessizce ücretli bir konuşma
  modeline geri dönmez.
- Boşaltma, her Compaction döngüsü başına bir kez çalışır (`sessions.json` içinde izlenir).
- Boşaltma yalnızca gömülü Pi oturumları için çalışır (CLI arka uçları bunu atlar).
- Oturum çalışma alanı salt okunur olduğunda (`workspaceAccess: "ro"` veya `"none"`) boşaltma atlanır.
- Çalışma alanı dosya düzeni ve yazma kalıpları için [Bellek](/tr/concepts/memory) bölümüne bakın.

Pi ayrıca uzantı API’sinde bir `session_before_compact` kancası sunar, ancak OpenClaw’ın
boşaltma mantığı bugün Gateway tarafında bulunur.

---

## Sorun giderme kontrol listesi

- Oturum anahtarı yanlış mı? [/concepts/session](/tr/concepts/session) ile başlayın ve `/status` içindeki `sessionKey` değerini doğrulayın.
- Depo ile konuşma dökümü uyuşmazlığı mı var? `openclaw status` çıktısından Gateway ana makinesini ve depo yolunu doğrulayın.
- Compaction spam’i mi var? Şunları kontrol edin:
  - model bağlam penceresi (çok küçük)
  - Compaction ayarları (`reserveTokens` model penceresi için çok yüksekse daha erken Compaction tetiklenebilir)
  - araç sonucu şişmesi: oturum budamayı etkinleştirin/ayarlayın
- Sessiz turlar sızıyor mu? Yanıtın `NO_REPLY` ile başladığını (büyük/küçük harfe duyarsız tam token) ve akış bastırma düzeltmesini içeren bir derlemede olduğunuzu doğrulayın.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
- [Bağlam motoru](/tr/concepts/context-engine)
