---
read_when:
    - Oturum kimliklerinde, transkript JSONL'de veya sessions.json alanlarında hata ayıklamanız gerekiyor
    - Otomatik Compaction davranışını değiştiriyor veya “Compaction öncesi” bakım işlemleri ekliyorsunuz
    - Bellek boşaltmaları veya sessiz sistem turları uygulamak istiyorsunuz
summary: 'Derinlemesine inceleme: oturum deposu + transkriptler, yaşam döngüsü ve (otomatik) Compaction iç işleyişi'
title: Oturum yönetimine derinlemesine bakış
x-i18n:
    generated_at: "2026-05-02T20:59:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8271d7b0786e1c47a8cec6e7bd73c3c86a433d629e17937fdd87fa756ed78d73
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw oturumları bu alanlarda uçtan uca yönetir:

- **Oturum yönlendirme** (gelen iletilerin bir `sessionKey` ile nasıl eşlendiği)
- **Oturum deposu** (`sessions.json`) ve neleri izlediği
- **Transkript kalıcılığı** (`*.jsonl`) ve yapısı
- **Transkript hijyeni** (çalıştırmalardan önce sağlayıcıya özgü düzeltmeler)
- **Bağlam sınırları** (bağlam penceresi ve izlenen token’lar)
- **Compaction** (manuel ve otomatik Compaction) ve Compaction öncesi işleri nereye bağlayacağınız
- **Sessiz bakım işleri** (kullanıcıya görünür çıktı üretmemesi gereken bellek yazımları)

Önce daha üst düzey bir genel bakış istiyorsanız, şunlarla başlayın:

- [Oturum yönetimi](/tr/concepts/session)
- [Compaction](/tr/concepts/compaction)
- [Belleğe genel bakış](/tr/concepts/memory)
- [Bellek araması](/tr/concepts/memory-search)
- [Oturum budama](/tr/concepts/session-pruning)
- [Transkript hijyeni](/tr/reference/transcript-hygiene)

---

## Doğruluk kaynağı: Gateway

OpenClaw, oturum durumunun sahibi olan tek bir **Gateway işlemi** etrafında tasarlanmıştır.

- UI’lar (macOS uygulaması, web Control UI, TUI) oturum listeleri ve token sayıları için Gateway’i sorgulamalıdır.
- Uzak modda oturum dosyaları uzak ana makinededir; “yerel Mac dosyalarınızı kontrol etmek” Gateway’in kullandığı şeyi yansıtmaz.

---

## İki kalıcılık katmanı

OpenClaw oturumları iki katmanda kalıcı hale getirir:

1. **Oturum deposu (`sessions.json`)**
   - Anahtar/değer eşlemesi: `sessionKey -> SessionEntry`
   - Küçük, değiştirilebilir, düzenlemesi güvenli (veya girdiler silinebilir)
   - Oturum meta verilerini izler (geçerli oturum kimliği, son etkinlik, anahtarlar, token sayaçları vb.)

2. **Transkript (`<sessionId>.jsonl`)**
   - Ağaç yapısına sahip yalnızca eklemeli transkript (girdiler `id` + `parentId` içerir)
   - Asıl konuşmayı + araç çağrılarını + Compaction özetlerini saklar
   - Gelecek dönüşler için model bağlamını yeniden oluşturmakta kullanılır
   - Etkin transkript denetim noktası boyutu üst sınırını aştığında büyük Compaction öncesi hata ayıklama denetim noktaları atlanır; böylece ikinci bir dev `.checkpoint.*.jsonl` kopyası oluşturulmaz.

Gateway geçmiş okuyucuları, yüzey açıkça rastgele geçmiş erişimine ihtiyaç duymadıkça tüm transkripti belleğe almaktan kaçınmalıdır. İlk sayfa geçmişi, gömülü sohbet geçmişi, yeniden başlatma kurtarması ve token/kullanım kontrolleri sınırlı kuyruk okumaları kullanır. Tam transkript taramaları, dosya yolu artı `mtimeMs`/`size` ile önbelleğe alınan ve eşzamanlı okuyucular arasında paylaşılan asenkron transkript dizininden geçer.

---

## Disk üzerindeki konumlar

Gateway ana makinesinde, ajan başına:

- Depo: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkriptler: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram konu oturumları: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw bunları `src/config/sessions.ts` üzerinden çözümler.

---

## Depo bakımı ve disk denetimleri

Oturum kalıcılığı; `sessions.json`, transkript artefaktları ve trajectory yan dosyaları için otomatik bakım denetimlerine (`session.maintenance`) sahiptir:

- `mode`: `warn` (varsayılan) veya `enforce`
- `pruneAfter`: eski girdi yaş sınırı (varsayılan `30d`)
- `maxEntries`: `sessions.json` içindeki girdi sınırı (varsayılan `500`)
- `resetArchiveRetention`: `*.reset.<timestamp>` transkript arşivleri için saklama süresi (varsayılan: `pruneAfter` ile aynı; `false` temizliği devre dışı bırakır)
- `maxDiskBytes`: isteğe bağlı oturum dizini bütçesi
- `highWaterBytes`: temizlikten sonraki isteğe bağlı hedef (varsayılan `maxDiskBytes` değerinin `%80`’i)

Normal Gateway yazımları, işlem içi değişiklikleri çalışma zamanı dosya kilidi almadan seri hale getiren depo başına bir oturum yazıcısından geçer. Sıcak yol yama yardımcıları, bu yazıcı yuvasını tutarken doğrulanmış değiştirilebilir önbelleği ödünç alır; böylece büyük `sessions.json` dosyaları her meta veri güncellemesi için klonlanmaz veya yeniden okunmaz. Çalışma zamanı kodu `updateSessionStore(...)` veya `updateSessionStoreEntry(...)` tercih etmelidir; doğrudan tüm depo kayıtları uyumluluk ve çevrimdışı bakım araçlarıdır. Bir Gateway erişilebilir olduğunda, kuru çalıştırma olmayan `openclaw sessions cleanup` ve `openclaw agents delete` depo değişikliklerini Gateway’e devreder; böylece temizlik aynı yazıcı kuyruğuna katılır. `--store <path>`, doğrudan dosya bakımı için açık çevrimdışı onarım yoludur. `maxEntries` temizliği üretim boyutundaki sınırlar için hâlâ toplu yapılır; bu nedenle bir depo, sonraki yüksek su temizlik işlemi onu tekrar küçültmeden önce yapılandırılmış sınırı kısa süre aşabilir. Oturum deposu okumaları Gateway başlangıcında girdileri budamaz veya sınırlamaz; temizlik için yazımları ya da `openclaw sessions cleanup --enforce` kullanın. `openclaw sessions cleanup --enforce` yapılandırılmış sınırı yine de hemen uygular.

Bakım, grup oturumları ve iş parçacığı kapsamlı sohbet oturumları gibi dayanıklı harici konuşma işaretçilerini korur; ancak Cron, hooks, Heartbeat, ACP ve alt ajanlar için sentetik çalışma zamanı girdileri, yapılandırılmış yaş, sayı veya disk bütçesini aştıklarında yine kaldırılabilir.

OpenClaw artık Gateway yazımları sırasında otomatik `sessions.json.bak.*` rotasyon yedekleri oluşturmaz. Eski `session.maintenance.rotateBytes` anahtarı yok sayılır ve `openclaw doctor --fix` bunu eski yapılandırmalardan kaldırır.

Transkript değişiklikleri, transkript dosyasında oturum yazma kilidi kullanır. Kilit edinimi, meşgul oturum hatası göstermeden önce `session.writeLock.acquireTimeoutMs` kadar bekler; varsayılan değer `60000` ms’dir. Bunu yalnızca meşru hazırlık, temizlik, Compaction veya transkript yansıtma işleri yavaş makinelerde daha uzun çakıştığında artırın. Eski kilit algılama ve azami tutma uyarıları ayrı ilkeler olarak kalır.

Disk bütçesi temizliği için uygulama sırası (`mode: "enforce"`):

1. Önce en eski arşivlenmiş, yetim transkript veya yetim trajectory artefaktlarını kaldırın.
2. Hâlâ hedefin üzerindeyse, en eski oturum girdilerini ve bunların transkript/trajectory dosyalarını çıkarın.
3. Kullanım `highWaterBytes` değerinde veya altında olana kadar devam edin.

`mode: "warn"` içinde OpenClaw olası çıkarmaları raporlar ancak depoyu/dosyaları değiştirmez.

Bakımı isteğe bağlı çalıştırın:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron oturumları ve çalıştırma günlükleri

Yalıtılmış Cron çalıştırmaları da oturum girdileri/transkriptler oluşturur ve bunların özel saklama denetimleri vardır:

- `cron.sessionRetention` (varsayılan `24h`) eski yalıtılmış Cron çalıştırma oturumlarını oturum deposundan budar (`false` devre dışı bırakır).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyalarını budar (varsayılanlar: `2_000_000` bayt ve `2000` satır).

Cron yeni bir yalıtılmış çalıştırma oturumunu zorla oluşturduğunda, yeni satırı yazmadan önce önceki `cron:<jobId>` oturum girdisini temizler. Düşünme/hızlı/ayrıntılı ayarları, etiketler ve açıkça kullanıcı tarafından seçilmiş model/kimlik doğrulama geçersiz kılmaları gibi güvenli tercihleri taşır. Kanal/grup yönlendirme, gönderme veya kuyruğa alma ilkesi, yükseltme, kaynak ve ACP çalışma zamanı bağlaması gibi ortam konuşma bağlamını bırakır; böylece yeni bir yalıtılmış çalıştırma, eski bir çalıştırmadan bayat teslim veya çalışma zamanı yetkisi devralamaz.

---

## Oturum anahtarları (`sessionKey`)

Bir `sessionKey`, _hangi konuşma kovasında_ olduğunuzu tanımlar (yönlendirme + yalıtım).

Yaygın desenler:

- Ana/doğrudan sohbet (ajan başına): `agent:<agentId>:<mainKey>` (varsayılan `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Oda/kanal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` veya `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (geçersiz kılınmadıkça)

Kanonik kurallar [/concepts/session](/tr/concepts/session) adresinde belgelenmiştir.

---

## Oturum kimlikleri (`sessionId`)

Her `sessionKey`, geçerli bir `sessionId` değerini işaret eder (konuşmayı sürdüren transkript dosyası).

Genel kurallar:

- **Sıfırlama** (`/new`, `/reset`) bu `sessionKey` için yeni bir `sessionId` oluşturur.
- **Günlük sıfırlama** (varsayılan olarak Gateway ana makinesinin yerel saatine göre 04:00) sıfırlama sınırından sonraki ilk iletide yeni bir `sessionId` oluşturur.
- **Boşta kalma süresi dolumu** (`session.reset.idleMinutes` veya eski `session.idleMinutes`), boşta kalma penceresinden sonra bir ileti geldiğinde yeni bir `sessionId` oluşturur. Günlük + boşta kalma birlikte yapılandırıldığında, önce hangisinin süresi dolarsa o kazanır.
- **Sistem olayları** (Heartbeat, Cron uyandırmaları, exec bildirimleri, Gateway defter tutma) oturum satırını değiştirebilir ancak günlük/boşta sıfırlama tazeliğini uzatmaz. Sıfırlama devri, yeni istem oluşturulmadan önce önceki oturum için kuyruğa alınmış sistem olayı bildirimlerini atar.
- **Üst çatallanma ilkesi**, bir iş parçacığı veya alt ajan çatallanması oluştururken PI’nin etkin dalını kullanır. Bu dal çok büyükse OpenClaw başarısız olmak veya kullanılamaz geçmişi devralmak yerine çocuğu yalıtılmış bağlamla başlatır. Boyutlandırma ilkesi otomatiktir; eski `session.parentForkMaxTokens` yapılandırması `openclaw doctor --fix` tarafından kaldırılır.

Uygulama ayrıntısı: karar `src/auto-reply/reply/session.ts` içindeki `initSessionState()` içinde gerçekleşir.

---

## Oturum deposu şeması (`sessions.json`)

Deponun değer türü, `src/config/sessions.ts` içindeki `SessionEntry` türüdür.

Ana alanlar (tam liste değildir):

- `sessionId`: geçerli transkript kimliği (`sessionFile` ayarlanmadıkça dosya adı bundan türetilir)
- `sessionStartedAt`: geçerli `sessionId` için başlangıç zaman damgası; günlük sıfırlama tazeliği bunu kullanır. Eski satırlar bunu JSONL oturum başlığından türetebilir.
- `lastInteractionAt`: son gerçek kullanıcı/kanal etkileşimi zaman damgası; boşta sıfırlama tazeliği bunu kullanır, böylece Heartbeat, Cron ve exec olayları oturumları canlı tutmaz. Bu alanı olmayan eski satırlar, boşta tazeliği için kurtarılan oturum başlangıç zamanına geri döner.
- `updatedAt`: listeleme, budama ve defter tutma için kullanılan son depo satırı değişiklik zaman damgası. Günlük/boşta sıfırlama tazeliği için yetkili kaynak değildir.
- `sessionFile`: isteğe bağlı açık transkript yolu geçersiz kılması
- `chatType`: `direct | group | room` (UI’lara ve gönderme ilkesine yardımcı olur)
- `provider`, `subject`, `room`, `space`, `displayName`: grup/kanal etiketleme için meta veriler
- Anahtarlar:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (oturum başına geçersiz kılma)
- Model seçimi:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token sayaçları (en iyi çaba / sağlayıcıya bağlı):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: bu oturum anahtarı için otomatik Compaction’ın kaç kez tamamlandığı
- `memoryFlushAt`: son Compaction öncesi bellek boşaltımı için zaman damgası
- `memoryFlushCompactionCount`: son boşaltma çalıştığında Compaction sayısı

Depoyu düzenlemek güvenlidir, ancak yetkili kaynak Gateway’dir: oturumlar çalışırken girdileri yeniden yazabilir veya yeniden doldurabilir.

---

## Transkript yapısı (`*.jsonl`)

Transkriptler `@mariozechner/pi-coding-agent` adlı `SessionManager` tarafından yönetilir.

Dosya JSONL biçimindedir:

- İlk satır: oturum başlığı (`type: "session"`, `id`, `cwd`, `timestamp`, isteğe bağlı `parentSession` içerir)
- Ardından: `id` + `parentId` içeren oturum girdileri (ağaç)

Dikkate değer girdi türleri:

- `message`: kullanıcı/asistan/toolResult iletileri
- `custom_message`: model bağlamına _giren_ uzantı tarafından enjekte edilmiş iletiler (UI’dan gizlenebilir)
- `custom`: model bağlamına _girmeyen_ uzantı durumu
- `compaction`: `firstKeptEntryId` ve `tokensBefore` ile kalıcı hale getirilmiş Compaction özeti
- `branch_summary`: ağaç dalında gezinirken kalıcı hale getirilmiş özet

OpenClaw kasıtlı olarak transkriptleri “düzeltmez”; Gateway bunları okumak/yazmak için `SessionManager` kullanır.

---

## Bağlam pencereleri ve izlenen token’lar

İki farklı kavram önemlidir:

1. **Model bağlam penceresi**: model başına katı üst sınır (modelin görebildiği token’lar)
2. **Oturum deposu sayaçları**: `sessions.json` içine yazılan yuvarlanan istatistikler (/status ve panolarda kullanılır)

Sınırları ayarlıyorsanız:

- Bağlam penceresi model kataloğundan gelir (ve yapılandırma üzerinden geçersiz kılınabilir).
- Depodaki `contextTokens` bir çalışma zamanı tahmini/raporlama değeridir; bunu katı bir garanti olarak değerlendirmeyin.

Daha fazlası için bkz. [/token-use](/tr/reference/token-use).

---

## Compaction: nedir

Compaction, eski konuşmayı transkript içinde kalıcı bir `compaction` girdisine özetler ve yakın tarihli iletileri aynen korur.

Compaction sonrasında, gelecek dönüşler şunları görür:

- Compaction özeti
- `firstKeptEntryId` sonrasındaki iletiler

Compaction **kalıcıdır** (oturum budamanın aksine). Bkz. [/concepts/session-pruning](/tr/concepts/session-pruning).

## Compaction parça sınırları ve araç eşleştirme

OpenClaw uzun bir dökümü Compaction parçalarına böldüğünde, asistan araç çağrılarını eşleşen `toolResult` girdileriyle eşli tutar.

- Token payına göre yapılan bölme bir araç çağrısı ile sonucu arasına denk gelirse OpenClaw çifti ayırmak yerine sınırı asistan araç çağrısı iletisine kaydırır.
- Sondaki bir araç sonucu bloğu normalde parçayı hedefin üzerine çıkaracaksa OpenClaw bekleyen araç bloğunu korur ve özetlenmemiş kuyruğu bozulmadan tutar.
- Durdurulmuş/hatalı araç çağrısı blokları bekleyen bir bölmeyi açık tutmaz.

---

## Otomatik Compaction ne zaman gerçekleşir (Pi runtime)

Gömülü Pi aracısında otomatik Compaction iki durumda tetiklenir:

1. **Taşma kurtarma**: model bağlam taşması hatası döndürür (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` ve benzer sağlayıcı biçimli varyantlar) → compact → retry.
2. **Eşik bakımı**: başarılı bir turdan sonra, şu durumda:

`contextTokens > contextWindow - reserveTokens`

Burada:

- `contextWindow` modelin bağlam penceresidir
- `reserveTokens` istemler + sonraki model çıktısı için ayrılmış paydır

Bunlar Pi runtime semantik değerleridir (OpenClaw olayları tüketir, ancak ne zaman compact yapılacağına Pi karar verir).

OpenClaw ayrıca `agents.defaults.compaction.maxActiveTranscriptBytes` ayarlandığında ve etkin döküm dosyası bu boyuta ulaştığında, sonraki çalıştırmayı açmadan önce bir ön kontrol yerel Compaction tetikleyebilir. Bu, yerel yeniden açma maliyeti için bir dosya boyutu korumasıdır, ham arşivleme değildir: OpenClaw yine normal semantik Compaction çalıştırır ve compact edilmiş özetin yeni ardıl döküm olabilmesi için `truncateAfterCompaction` gerektirir.

Gömülü Pi çalıştırmaları için `agents.defaults.compaction.midTurnPrecheck.enabled: true` isteğe bağlı bir araç döngüsü koruması ekler. Bir araç sonucu eklendikten sonra ve sonraki model çağrısından önce OpenClaw, tur başlangıcında kullanılan aynı ön kontrol bütçe mantığıyla istem baskısını tahmin eder. Bağlam artık sığmıyorsa koruma, Pi'nin `transformContext` hook'u içinde compact yapmaz. Yapılandırılmış bir tur ortası ön kontrol sinyali yükseltir, mevcut istem gönderimini durdurur ve dış çalıştırma döngüsünün mevcut kurtarma yolunu kullanmasına izin verir: yeterli olduğunda aşırı büyük araç sonuçlarını kısaltır veya yapılandırılmış Compaction modunu tetikleyip yeniden dener. Seçenek varsayılan olarak devre dışıdır ve sağlayıcı destekli safeguard Compaction dahil olmak üzere hem `default` hem de `safeguard` Compaction modlarıyla çalışır.
Bu, `maxActiveTranscriptBytes` ayarından bağımsızdır: bayt boyutu koruması bir tur açılmadan önce çalışırken, tur ortası ön kontrol yeni araç sonuçları eklendikten sonra gömülü Pi araç döngüsünde daha sonra çalışır.

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

OpenClaw gömülü çalıştırmalar için bir güvenlik alt sınırı da zorunlu kılar:

- `compaction.reserveTokens < reserveTokensFloor` ise OpenClaw bunu yükseltir.
- Varsayılan alt sınır `20000` tokendir.
- Alt sınırı devre dışı bırakmak için `agents.defaults.compaction.reserveTokensFloor: 0` ayarlayın.
- Zaten daha yüksekse OpenClaw olduğu gibi bırakır.
- Manuel `/compact`, açık bir `agents.defaults.compaction.keepRecentTokens` değerine uyar ve Pi'nin yakın kuyruk kesme noktasını korur. Açık bir koruma bütçesi olmadığında manuel Compaction katı bir kontrol noktası olarak kalır ve yeniden oluşturulan bağlam yeni özetten başlar.
- Yeni araç sonuçlarından sonra ve sonraki model çağrısından önce isteğe bağlı araç döngüsü ön kontrolünü çalıştırmak için `agents.defaults.compaction.midTurnPrecheck.enabled: true` ayarlayın. Bu yalnızca bir tetikleyicidir; özet üretimi yine yapılandırılmış Compaction yolunu kullanır. Bu, tur başlangıcı etkin döküm bayt boyutu koruması olan `maxActiveTranscriptBytes` ayarından bağımsızdır.
- Etkin döküm büyüdüğünde turdan önce yerel Compaction çalıştırmak için `agents.defaults.compaction.maxActiveTranscriptBytes` değerini bir bayt değeri ya da `"20mb"` gibi bir dize olarak ayarlayın. Bu koruma yalnızca `truncateAfterCompaction` da etkin olduğunda aktiftir. Devre dışı bırakmak için ayarlanmamış bırakın veya `0` olarak ayarlayın.
- `agents.defaults.compaction.truncateAfterCompaction` etkinleştirildiğinde OpenClaw, Compaction sonrasında etkin dökümü compact edilmiş ardıl bir JSONL dosyasına döndürür. Eski tam döküm yerinde yeniden yazılmak yerine arşivlenmiş kalır ve Compaction kontrol noktasından bağlanır.

Neden: Compaction kaçınılmaz hale gelmeden önce çok turlu “bakım” işleri (bellek yazmaları gibi) için yeterli pay bırakmak.

Uygulama: `src/agents/pi-settings.ts` içindeki `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts` içinden çağrılır).

---

## Takılabilir Compaction sağlayıcıları

Plugins, Plugin API üzerinde `registerCompactionProvider()` aracılığıyla bir Compaction sağlayıcısı kaydedebilir. `agents.defaults.compaction.provider` kayıtlı bir sağlayıcı kimliğine ayarlandığında safeguard Plugin’i, özetlemeyi yerleşik `summarizeInStages` hattı yerine bu sağlayıcıya devreder.

- `provider`: kayıtlı bir Compaction sağlayıcısı Plugin kimliği. Varsayılan LLM özetlemesi için ayarlanmamış bırakın.
- Bir `provider` ayarlamak `mode: "safeguard"` değerini zorunlu kılar.
- Sağlayıcılar, yerleşik yolla aynı Compaction talimatlarını ve tanımlayıcı koruma politikasını alır.
- Safeguard, sağlayıcı çıktısından sonra yakın tur ve bölünmüş tur sonek bağlamını yine korur.
- Yerleşik safeguard özetleme, tam önceki özeti kelimesi kelimesine korumak yerine önceki özetleri yeni iletilerle yeniden damıtır.
- Safeguard modu özet kalite denetimlerini varsayılan olarak etkinleştirir; hatalı biçimli çıktı durumunda yeniden deneme davranışını atlamak için `qualityGuard.enabled: false` ayarlayın.
- Sağlayıcı başarısız olursa veya boş sonuç döndürürse OpenClaw otomatik olarak yerleşik LLM özetlemesine geri döner.
- Çağıran tarafın iptaline saygı göstermek için durdurma/zaman aşımı sinyalleri yeniden fırlatılır (yutulmaz).

Kaynak: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Kullanıcıya görünen yüzeyler

Compaction ve oturum durumunu şu yollarla gözlemleyebilirsiniz:

- `/status` (herhangi bir sohbet oturumunda)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Ayrıntılı mod: `🧹 Auto-compaction complete` + Compaction sayısı

---

## Sessiz bakım (`NO_REPLY`)

OpenClaw, kullanıcının ara çıktıları görmemesi gereken arka plan görevleri için “sessiz” turları destekler.

Kural:

- Asistan, “kullanıcıya yanıt teslim etme” anlamına geldiğini belirtmek için çıktısını tam sessiz token `NO_REPLY` / `no_reply` ile başlatır.
- OpenClaw bunu teslim katmanında çıkarır/bastırır.
- Tam sessiz token bastırma büyük/küçük harfe duyarsızdır; bu nedenle tüm yük yalnızca sessiz token olduğunda hem `NO_REPLY` hem de `no_reply` geçerli sayılır.
- Bu yalnızca gerçek arka plan/teslimsiz turlar içindir; sıradan eyleme dönük kullanıcı istekleri için bir kestirme değildir.

`2026.1.10` itibarıyla OpenClaw, kısmi bir parça `NO_REPLY` ile başladığında **taslak/yazma akışını** da bastırır; böylece sessiz işlemler tur ortasında kısmi çıktı sızdırmaz.

---

## Compaction öncesi "bellek boşaltma" (uygulandı)

Hedef: otomatik Compaction gerçekleşmeden önce, dayanıklı durumu diske yazan sessiz bir aracı turu çalıştırmak (ör. aracı çalışma alanında `memory/YYYY-MM-DD.md`), böylece Compaction kritik bağlamı silemez.

OpenClaw **eşik öncesi boşaltma** yaklaşımını kullanır:

1. Oturum bağlam kullanımını izleyin.
2. “Yumuşak eşiği” geçtiğinde (Pi’nin Compaction eşiğinin altında), aracıya sessiz bir “belleği şimdi yaz” yönergesi çalıştırın.
3. Kullanıcının hiçbir şey görmemesi için tam sessiz token `NO_REPLY` / `no_reply` kullanın.

Yapılandırma (`agents.defaults.compaction.memoryFlush`):

- `enabled` (varsayılan: `true`)
- `model` (boşaltma turu için isteğe bağlı tam sağlayıcı/model geçersiz kılması, örneğin `ollama/qwen3:8b`)
- `softThresholdTokens` (varsayılan: `4000`)
- `prompt` (boşaltma turu için kullanıcı iletisi)
- `systemPrompt` (boşaltma turu için eklenen ekstra sistem istemi)

Notlar:

- Varsayılan prompt/system prompt, teslimi bastırmak için bir `NO_REPLY` ipucu içerir.
- `model` ayarlandığında, boşaltma turu bu modeli etkin oturum yedek zincirini devralmadan kullanır; böylece yalnızca yerel bakım sessizce ücretli bir konuşma modeline geri dönmez.
- Boşaltma her Compaction döngüsünde bir kez çalışır (`sessions.json` içinde izlenir).
- Boşaltma yalnızca gömülü Pi oturumları için çalışır (CLI arka uçları bunu atlar).
- Oturum çalışma alanı salt okunur olduğunda (`workspaceAccess: "ro"` veya `"none"`) boşaltma atlanır.
- Çalışma alanı dosya düzeni ve yazma kalıpları için [Memory](/tr/concepts/memory) bölümüne bakın.

Pi ayrıca Plugin API içinde bir `session_before_compact` hook'u sunar, ancak OpenClaw’ın boşaltma mantığı bugün Gateway tarafında yaşar.

---

## Sorun giderme kontrol listesi

- Oturum anahtarı yanlış mı? [/concepts/session](/tr/concepts/session) ile başlayın ve `/status` içindeki `sessionKey` değerini doğrulayın.
- Depo ile döküm uyuşmazlığı mı var? `openclaw status` çıktısından Gateway ana makinesini ve depo yolunu doğrulayın.
- Compaction spam’i mi var? Şunları kontrol edin:
  - model bağlam penceresi (çok küçük)
  - Compaction ayarları (`reserveTokens` model penceresi için çok yüksekse daha erken Compaction’a neden olabilir)
  - araç sonucu şişmesi: oturum budamayı etkinleştirin/ayarlayın
- Sessiz turlar sızıyor mu? Yanıtın `NO_REPLY` ile başladığını (büyük/küçük harfe duyarsız tam token) ve akış bastırma düzeltmesini içeren bir derlemede olduğunuzu doğrulayın.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
- [Bağlam motoru](/tr/concepts/context-engine)
