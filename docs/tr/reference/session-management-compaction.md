---
read_when:
    - Oturum kimliklerinde, transkript JSONL'sinde veya sessions.json alanlarında hata ayıklamanız gerekiyor
    - Otomatik Compaction davranışını değiştiriyor veya "Compaction öncesi" temizlik işlemleri ekliyorsunuz
    - Bellek boşaltmaları veya sessiz sistem turları uygulamak istiyorsunuz
summary: 'Derinlemesine inceleme: oturum deposu + transkriptler, yaşam döngüsü ve (otomatik) Compaction iç işleyişi'
title: Oturum yönetimine derinlemesine bakış
x-i18n:
    generated_at: "2026-05-06T09:30:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ade29b83c2b3857c52e56275ed11c5b1f3cd07050ba9f35ea49ad427efcc39d
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw, bu alanlarda oturumları uçtan uca yönetir:

- **Oturum yönlendirme** (gelen mesajların bir `sessionKey` ile nasıl eşleştiği)
- **Oturum deposu** (`sessions.json`) ve neleri izlediği
- **Transkript kalıcılığı** (`*.jsonl`) ve yapısı
- **Transkript hijyeni** (çalıştırmalardan önce sağlayıcıya özgü düzeltmeler)
- **Bağlam sınırları** (bağlam penceresi ve izlenen token'lar)
- **Compaction** (manuel ve otomatik Compaction) ve Compaction öncesi çalışmanın nereye bağlanacağı
- **Sessiz bakım** (kullanıcıya görünür çıktı üretmemesi gereken bellek yazımları)

Önce daha üst düzey bir genel bakış istiyorsanız şunlarla başlayın:

- [Oturum yönetimi](/tr/concepts/session)
- [Compaction](/tr/concepts/compaction)
- [Belleğe genel bakış](/tr/concepts/memory)
- [Bellek araması](/tr/concepts/memory-search)
- [Oturum budama](/tr/concepts/session-pruning)
- [Transkript hijyeni](/tr/reference/transcript-hygiene)

---

## Doğruluk kaynağı: Gateway

OpenClaw, oturum durumunun sahibi olan tek bir **Gateway işlemi** etrafında tasarlanmıştır.

- UI'lar (macOS uygulaması, web Control UI, TUI) oturum listeleri ve token sayıları için Gateway'i sorgulamalıdır.
- Uzak modda oturum dosyaları uzak ana makinededir; "yerel Mac dosyalarınızı kontrol etmek" Gateway'in ne kullandığını yansıtmaz.

---

## İki kalıcılık katmanı

OpenClaw oturumları iki katmanda kalıcı hale getirir:

1. **Oturum deposu (`sessions.json`)**
   - Anahtar/değer haritası: `sessionKey -> SessionEntry`
   - Küçük, değiştirilebilir, düzenlemesi (veya girdileri silmesi) güvenli
   - Oturum meta verilerini izler (geçerli oturum kimliği, son etkinlik, anahtarlar, token sayaçları vb.)

2. **Transkript (`<sessionId>.jsonl`)**
   - Ağaç yapısına sahip yalnızca eklemeli transkript (girdiler `id` + `parentId` içerir)
   - Gerçek konuşmayı + araç çağrılarını + Compaction özetlerini saklar
   - Gelecekteki turlar için model bağlamını yeniden oluşturmakta kullanılır
   - Etkin transkript kontrol noktası boyutu üst sınırını aştığında büyük Compaction öncesi hata ayıklama kontrol noktaları atlanır; böylece ikinci bir dev `.checkpoint.*.jsonl` kopyası oluşturulmaz.

Gateway geçmiş okuyucuları, yüzey açıkça rastgele geçmiş erişimine ihtiyaç duymadıkça tüm transkripti belleğe almaktan kaçınmalıdır. İlk sayfa geçmişi, gömülü sohbet geçmişi, yeniden başlatma kurtarması ve token/kullanım kontrolleri sınırlı kuyruk okumaları kullanır. Tam transkript taramaları, dosya yolu artı `mtimeMs`/`size` ile önbelleğe alınan ve eşzamanlı okuyucular arasında paylaşılan asenkron transkript dizini üzerinden gider.

---

## Disk üzerindeki konumlar

Gateway ana makinesinde, ajan başına:

- Depo: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkriptler: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram konu oturumları: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw bunları `src/config/sessions.ts` üzerinden çözer.

---

## Depo bakımı ve disk denetimleri

Oturum kalıcılığında `sessions.json`, transkript yapıtları ve trajectory yan dosyaları için otomatik bakım denetimleri (`session.maintenance`) vardır:

- `mode`: `warn` (varsayılan) veya `enforce`
- `pruneAfter`: bayat girdi yaş eşiği (varsayılan `30d`)
- `maxEntries`: `sessions.json` içindeki girdi üst sınırı (varsayılan `500`)
- `resetArchiveRetention`: `*.reset.<timestamp>` transkript arşivleri için saklama süresi (varsayılan: `pruneAfter` ile aynı; `false` temizliği devre dışı bırakır)
- `maxDiskBytes`: isteğe bağlı oturumlar dizini bütçesi
- `highWaterBytes`: temizlikten sonraki isteğe bağlı hedef (varsayılan `maxDiskBytes` değerinin `%80`'i)

Normal Gateway yazımları, işlem içi değişiklikleri çalışma zamanı dosya kilidi almadan serileştiren depo başına bir oturum yazıcısından geçer. Sıcak yol yama yardımcıları, bu yazıcı yuvasını tuttukları sırada doğrulanmış değiştirilebilir önbelleği ödünç alır; böylece büyük `sessions.json` dosyaları her meta veri güncellemesinde klonlanmaz veya yeniden okunmaz. Çalışma zamanı kodu `updateSessionStore(...)` veya `updateSessionStoreEntry(...)` tercih etmelidir; doğrudan tüm depo kaydetmeleri uyumluluk ve çevrimdışı bakım araçlarıdır. Bir Gateway'e erişilebildiğinde, dry-run olmayan `openclaw sessions cleanup` ve `openclaw agents delete`, depo değişikliklerini Gateway'e devreder; böylece temizlik aynı yazıcı kuyruğuna katılır. `--store <path>`, doğrudan dosya bakımı için açık çevrimdışı onarım yoludur. `maxEntries` temizliği üretim boyutlu üst sınırlar için hâlâ toplu yapılır; bu nedenle bir depo, sonraki high-water temizliği onu yeniden aşağı çekmeden önce yapılandırılmış üst sınırı kısa süreliğine aşabilir. Oturum deposu okumaları Gateway başlatılırken girdileri budamaz veya sınırlamaz; temizlik için yazımları ya da `openclaw sessions cleanup --enforce` kullanın. `openclaw sessions cleanup --enforce`, disk bütçesi yapılandırılmamış olsa bile yapılandırılmış üst sınırı hemen uygular ve eski başvurulmayan transkript, kontrol noktası ve trajectory yapıtlarını budar.

Bakım, grup oturumları ve thread kapsamlı sohbet oturumları gibi dayanıklı harici konuşma işaretçilerini korur; ancak cron, hook, Heartbeat, ACP ve alt ajanlar için sentetik çalışma zamanı girdileri, yapılandırılmış yaş, sayı veya disk bütçesini aştıklarında yine de kaldırılabilir.

OpenClaw artık Gateway yazımları sırasında otomatik `sessions.json.bak.*` döndürme yedekleri oluşturmaz. Eski `session.maintenance.rotateBytes` anahtarı yok sayılır ve `openclaw doctor --fix` bunu eski yapılandırmalardan kaldırır.

Transkript değişiklikleri, transkript dosyasında bir oturum yazma kilidi kullanır. Kilit edinimi, meşgul oturum hatası göstermeden önce `session.writeLock.acquireTimeoutMs` kadar bekler; varsayılan değer `60000` ms'dir. Bunu yalnızca meşru hazırlık, temizlik, Compaction veya transkript yansıtma işi yavaş makinelerde daha uzun süre çakıştığında yükseltin. Bayat kilit algılama ve maksimum tutma uyarıları ayrı ilkeler olarak kalır.

Disk bütçesi temizliği için uygulama sırası (`mode: "enforce"`):

1. Önce en eski arşivlenmiş, yetim transkript veya yetim trajectory yapıtlarını kaldırın.
2. Hâlâ hedefin üzerindeyse, en eski oturum girdilerini ve bunların transkript/trajectory dosyalarını çıkarın.
3. Kullanım `highWaterBytes` değerinde veya altında olana kadar devam edin.

`mode: "warn"` içinde OpenClaw olası çıkarmaları raporlar ancak depoyu/dosyaları değiştirmez.

Bakımı isteğe bağlı çalıştırın:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron oturumları ve çalışma günlükleri

Yalıtılmış cron çalıştırmaları da oturum girdileri/transkriptleri oluşturur ve bunlar için özel saklama denetimleri vardır:

- `cron.sessionRetention` (varsayılan `24h`), eski yalıtılmış cron çalışma oturumlarını oturum deposundan budar (`false` devre dışı bırakır).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyalarını budar (varsayılanlar: `2_000_000` bayt ve `2000` satır).

Cron yeni bir yalıtılmış çalışma oturumunu zorla oluşturduğunda, yeni satırı yazmadan önce önceki `cron:<jobId>` oturum girdisini temizler. Düşünme/hızlı/ayrıntılı ayarlar, etiketler ve açık kullanıcı seçimi model/kimlik doğrulama geçersiz kılmaları gibi güvenli tercihleri taşır. Kanal/grup yönlendirmesi, gönderme veya kuyruk ilkesi, yükseltme, kaynak ve ACP çalışma zamanı bağlama gibi ortam konuşma bağlamını bırakır; böylece yeni bir yalıtılmış çalışma eski bir çalıştırmadan bayat teslimat veya çalışma zamanı yetkisi devralamaz.

---

## Oturum anahtarları (`sessionKey`)

Bir `sessionKey`, _hangi konuşma kovasında_ olduğunuzu tanımlar (yönlendirme + yalıtım).

Yaygın kalıplar:

- Ana/doğrudan sohbet (ajan başına): `agent:<agentId>:<mainKey>` (varsayılan `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Oda/kanal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` veya `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (geçersiz kılınmadıkça)

Kanonik kurallar [/concepts/session](/tr/concepts/session) adresinde belgelenmiştir.

---

## Oturum kimlikleri (`sessionId`)

Her `sessionKey`, geçerli bir `sessionId` değerini gösterir (konuşmayı sürdüren transkript dosyası).

Pratik kurallar:

- **Sıfırlama** (`/new`, `/reset`), bu `sessionKey` için yeni bir `sessionId` oluşturur.
- **Günlük sıfırlama** (gateway ana makinesinde varsayılan yerel saat 04:00), sıfırlama sınırından sonraki ilk mesajda yeni bir `sessionId` oluşturur.
- **Boşta kalma süresi dolması** (`session.reset.idleMinutes` veya eski `session.idleMinutes`), boşta kalma penceresinden sonra bir mesaj geldiğinde yeni bir `sessionId` oluşturur. Günlük + boşta kalma birlikte yapılandırılmışsa, önce hangisinin süresi dolarsa o kazanır.
- **Sistem olayları** (Heartbeat, cron uyandırmaları, exec bildirimleri, gateway defter tutma) oturum satırını değiştirebilir ancak günlük/boşta sıfırlama tazeliğini uzatmaz. Sıfırlama devri, yeni istem oluşturulmadan önce önceki oturum için kuyruğa alınmış sistem olayı bildirimlerini atar.
- **Üst fork ilkesi**, bir thread veya alt ajan fork'u oluştururken Pi'nin aktif dalını kullanır. Bu dal çok büyükse OpenClaw başarısız olmak veya kullanılamaz geçmişi devralmak yerine çocuğu yalıtılmış bağlamla başlatır. Boyutlandırma ilkesi otomatiktir; eski `session.parentForkMaxTokens` yapılandırması `openclaw doctor --fix` tarafından kaldırılır.

Uygulama ayrıntısı: karar `src/auto-reply/reply/session.ts` içindeki `initSessionState()` içinde verilir.

---

## Oturum deposu şeması (`sessions.json`)

Deponun değer türü `src/config/sessions.ts` içindeki `SessionEntry`'dir.

Ana alanlar (kapsamlı değildir):

- `sessionId`: geçerli transkript kimliği (`sessionFile` ayarlanmadıkça dosya adı bundan türetilir)
- `sessionStartedAt`: geçerli `sessionId` için başlangıç zaman damgası; günlük sıfırlama tazeliği bunu kullanır. Eski satırlar bunu JSONL oturum başlığından türetebilir.
- `lastInteractionAt`: son gerçek kullanıcı/kanal etkileşimi zaman damgası; boşta sıfırlama tazeliği bunu kullanır, böylece Heartbeat, cron ve exec olayları oturumları canlı tutmaz. Bu alanı olmayan eski satırlar, boşta tazeliği için kurtarılan oturum başlangıç zamanına geri döner.
- `updatedAt`: listeleme, budama ve defter tutma için kullanılan son depo satırı değişiklik zaman damgası. Günlük/boşta sıfırlama tazeliği için yetkili kaynak değildir.
- `sessionFile`: isteğe bağlı açık transkript yolu geçersiz kılması
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
- `memoryFlushAt`: son Compaction öncesi bellek boşaltması için zaman damgası
- `memoryFlushCompactionCount`: son boşaltma çalıştığında Compaction sayısı

Depoyu düzenlemek güvenlidir, ancak yetkili kaynak Gateway'dir: oturumlar çalışırken girdileri yeniden yazabilir veya yeniden hydrate edebilir.

---

## Transkript yapısı (`*.jsonl`)

Transkriptler `@mariozechner/pi-coding-agent`'ın `SessionManager`'ı tarafından yönetilir.

Dosya JSONL'dir:

- İlk satır: oturum başlığı (`type: "session"`, `id`, `cwd`, `timestamp`, isteğe bağlı `parentSession` içerir)
- Sonra: `id` + `parentId` içeren oturum girdileri (ağaç)

Dikkate değer girdi türleri:

- `message`: kullanıcı/asistan/toolResult mesajları
- `custom_message`: model bağlamına _giren_ uzantı eklemeli mesajlar (UI'dan gizlenebilir)
- `custom`: model bağlamına _girmeyen_ uzantı durumu
- `compaction`: `firstKeptEntryId` ve `tokensBefore` içeren kalıcı Compaction özeti
- `branch_summary`: bir ağaç dalında gezinirken kalıcı özet

OpenClaw transkriptleri bilerek "düzeltmez"; Gateway bunları okumak/yazmak için `SessionManager` kullanır.

---

## Bağlam pencereleri ve izlenen token'lar

İki farklı kavram önemlidir:

1. **Model bağlam penceresi**: model başına katı üst sınır (modelin görebildiği token'lar)
2. **Oturum deposu sayaçları**: `sessions.json` içine yazılan kayan istatistikler (/status ve panolarda kullanılır)

Sınırları ayarlıyorsanız:

- Bağlam penceresi model kataloğundan gelir (ve yapılandırma üzerinden geçersiz kılınabilir).
- Depodaki `contextTokens` bir çalışma zamanı tahmini/raporlama değeridir; bunu katı bir garanti olarak değerlendirmeyin.

Daha fazlası için [/token-use](/tr/reference/token-use) bölümüne bakın.

---

## Compaction: nedir

Compaction, eski konuşmayı transkriptte kalıcı bir `compaction` girdisine özetler ve son mesajları olduğu gibi tutar.

Compaction sonrasında gelecekteki turlar şunları görür:

- Compaction özeti
- `firstKeptEntryId` sonrasındaki mesajlar

Compaction, oturum budamadan farklı olarak **kalıcıdır**. Bkz. [/concepts/session-pruning](/tr/concepts/session-pruning).

## Compaction parça sınırları ve araç eşleştirme

OpenClaw uzun bir konuşma dökümünü Compaction parçalarına böldüğünde, asistan araç çağrılarını eşleşen `toolResult` girdileriyle birlikte tutar.

- Token payı bölmesi bir araç çağrısı ile sonucu arasına denk gelirse OpenClaw, çifti ayırmak yerine sınırı asistan araç çağrısı mesajına kaydırır.
- Sondaki bir araç sonucu bloğu aksi halde parçayı hedefin üzerine çıkaracaksa OpenClaw, bekleyen bu araç bloğunu korur ve özetlenmemiş kuyruğu olduğu gibi tutar.
- İptal edilmiş/hatalı araç çağrısı blokları bekleyen bir bölmeyi açık tutmaz.

---

## Otomatik Compaction ne zaman gerçekleşir (Pi runtime)

Gömülü Pi ajanında otomatik Compaction iki durumda tetiklenir:

1. **Taşma kurtarması**: model bir bağlam taşması hatası döndürür (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` ve benzer sağlayıcı biçimli varyantlar) → compact → yeniden dene.
2. **Eşik bakımı**: başarılı bir turdan sonra, şu koşulda:

`contextTokens > contextWindow - reserveTokens`

Burada:

- `contextWindow`, modelin bağlam penceresidir
- `reserveTokens`, istemler + sonraki model çıktısı için ayrılmış boşluktur

Bunlar Pi runtime semantiğidir (OpenClaw olayları tüketir, ancak ne zaman compact yapılacağına Pi karar verir).

OpenClaw, `agents.defaults.compaction.maxActiveTranscriptBytes` ayarlıysa ve etkin konuşma dökümü dosyası bu boyuta ulaştıysa, bir sonraki çalıştırmayı açmadan önce uçuş öncesi yerel Compaction da tetikleyebilir. Bu, ham arşivleme için değil, yerel yeniden açma maliyeti için bir dosya boyutu korumasıdır: OpenClaw yine normal anlamsal Compaction çalıştırır ve compact edilmiş özetin yeni bir ardıl konuşma dökümü olabilmesi için `truncateAfterCompaction` gerektirir.

Gömülü Pi çalıştırmaları için `agents.defaults.compaction.midTurnPrecheck.enabled: true`, isteğe bağlı bir araç döngüsü koruması ekler. Bir araç sonucu eklendikten sonra ve sonraki model çağrısından önce OpenClaw, tur başlangıcında kullanılan aynı uçuş öncesi bütçe mantığıyla istem baskısını tahmin eder. Bağlam artık sığmıyorsa koruma, Pi'nin `transformContext` hook içinde compact yapmaz. Yapılandırılmış bir tur ortası ön kontrol sinyali yükseltir, geçerli istem gönderimini durdurur ve dış çalıştırma döngüsünün mevcut kurtarma yolunu kullanmasına izin verir: bu yeterliyse aşırı büyük araç sonuçlarını kısaltır veya yapılandırılan Compaction modunu tetikleyip yeniden dener. Seçenek varsayılan olarak devre dışıdır ve sağlayıcı destekli safeguard Compaction dahil olmak üzere hem `default` hem de `safeguard` Compaction modlarıyla çalışır.
Bu, `maxActiveTranscriptBytes` değerinden bağımsızdır: bayt boyutu koruması bir tur açılmadan önce çalışır, tur ortası ön kontrol ise yeni araç sonuçları eklendikten sonra gömülü Pi araç döngüsünde daha sonra çalışır.

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

OpenClaw gömülü çalıştırmalar için bir güvenlik tabanı da uygular:

- `compaction.reserveTokens < reserveTokensFloor` ise OpenClaw bunu yükseltir.
- Varsayılan taban `20000` tokendır.
- Tabanı devre dışı bırakmak için `agents.defaults.compaction.reserveTokensFloor: 0` ayarlayın.
- Zaten daha yüksekse OpenClaw onu olduğu gibi bırakır.
- Manuel `/compact`, açık bir `agents.defaults.compaction.keepRecentTokens` değerine uyar ve Pi'nin yakın kuyruk kesme noktasını korur. Açık bir tutma bütçesi olmadan manuel Compaction katı bir kontrol noktası olarak kalır ve yeniden oluşturulan bağlam yeni özetten başlar.
- Yeni araç sonuçlarından sonra ve sonraki model çağrısından önce isteğe bağlı araç döngüsü ön kontrolünü çalıştırmak için `agents.defaults.compaction.midTurnPrecheck.enabled: true` ayarlayın. Bu yalnızca bir tetikleyicidir; özet üretimi yine yapılandırılmış Compaction yolunu kullanır. Tur başlangıcındaki etkin konuşma dökümü bayt boyutu koruması olan `maxActiveTranscriptBytes` değerinden bağımsızdır.
- Etkin konuşma dökümü büyüdüğünde bir turdan önce yerel Compaction çalıştırmak için `agents.defaults.compaction.maxActiveTranscriptBytes` değerini bir bayt değeri veya `"20mb"` gibi bir string olarak ayarlayın. Bu koruma yalnızca `truncateAfterCompaction` da etkin olduğunda aktiftir. Devre dışı bırakmak için ayarsız bırakın veya `0` olarak ayarlayın.
- `agents.defaults.compaction.truncateAfterCompaction` etkinleştirildiğinde OpenClaw, Compaction sonrasında etkin konuşma dökümünü compact edilmiş bir ardıl JSONL dosyasına döndürür. Eski tam konuşma dökümü yerinde yeniden yazılmak yerine arşivlenmiş kalır ve Compaction kontrol noktasından bağlanır.

Neden: Compaction kaçınılmaz hale gelmeden önce çok turlu "bakım" işlemleri (bellek yazmaları gibi) için yeterli boşluk bırakmak.

Uygulama: `src/agents/pi-settings.ts` içinde `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts` içinden çağrılır).

---

## Takılabilir Compaction sağlayıcıları

Plugin'ler, plugin API üzerinde `registerCompactionProvider()` aracılığıyla bir Compaction sağlayıcısı kaydedebilir. `agents.defaults.compaction.provider` kayıtlı bir sağlayıcı kimliğine ayarlandığında, safeguard uzantısı özetlemeyi yerleşik `summarizeInStages` işlem hattı yerine bu sağlayıcıya devreder.

- `provider`: kayıtlı bir Compaction sağlayıcı plugin kimliği. Varsayılan LLM özetlemesi için ayarsız bırakın.
- Bir `provider` ayarlamak `mode: "safeguard"` modunu zorunlu kılar.
- Sağlayıcılar, yerleşik yolla aynı Compaction yönergelerini ve tanımlayıcı koruma politikasını alır.
- Safeguard, sağlayıcı çıktısından sonra yakın tur ve bölünmüş tur son ek bağlamını yine korur.
- Yerleşik safeguard özetlemesi, tam önceki özeti bire bir korumak yerine önceki özetleri yeni mesajlarla yeniden damıtır.
- Safeguard modu varsayılan olarak özet kalite denetimlerini etkinleştirir; hatalı biçimlendirilmiş çıktı durumunda yeniden deneme davranışını atlamak için `qualityGuard.enabled: false` ayarlayın.
- Sağlayıcı başarısız olursa veya boş bir sonuç döndürürse OpenClaw otomatik olarak yerleşik LLM özetlemesine geri döner.
- İptal/zaman aşımı sinyalleri çağıranın iptalini gözetmek için yeniden fırlatılır (yutulmaz).

Kaynak: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Kullanıcının görebildiği yüzeyler

Compaction ve oturum durumunu şunlarla gözlemleyebilirsiniz:

- `/status` (herhangi bir sohbet oturumunda)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Ayrıntılı mod: `🧹 Auto-compaction complete` + Compaction sayısı

---

## Sessiz bakım (`NO_REPLY`)

OpenClaw, kullanıcının ara çıktıları görmemesi gereken arka plan görevleri için "sessiz" turları destekler.

Kural:

- Asistan, "kullanıcıya yanıt teslim etme" anlamına geldiğini belirtmek için çıktısına tam sessiz token `NO_REPLY` / `no_reply` ile başlar.
- OpenClaw bunu teslim katmanında çıkarır/bastırır.
- Tam sessiz token bastırma büyük/küçük harfe duyarlı değildir; bu nedenle tüm yük yalnızca sessiz token olduğunda hem `NO_REPLY` hem de `no_reply` geçerli sayılır.
- Bu yalnızca gerçek arka plan/teslimatsız turlar içindir; sıradan eyleme dönük kullanıcı istekleri için bir kısayol değildir.

`2026.1.10` itibarıyla OpenClaw, kısmi bir parça `NO_REPLY` ile başladığında **taslak/yazıyor streaming** çıktısını da bastırır; böylece sessiz işlemler tur ortasında kısmi çıktı sızdırmaz.

---

## Compaction öncesi "bellek boşaltma" (uygulandı)

Amaç: otomatik Compaction gerçekleşmeden önce, kalıcı durumu diske yazan sessiz bir ajanlı tur çalıştırmak (ör. ajan çalışma alanında `memory/YYYY-MM-DD.md`), böylece Compaction kritik bağlamı silemez.

OpenClaw **eşik öncesi boşaltma** yaklaşımını kullanır:

1. Oturum bağlam kullanımını izleyin.
2. Bir "yumuşak eşiği" (Pi'nin Compaction eşiğinin altında) geçtiğinde, ajana sessiz bir "belleği şimdi yaz" yönergesi çalıştırın.
3. Kullanıcının hiçbir şey görmemesi için tam sessiz token `NO_REPLY` / `no_reply` kullanın.

Yapılandırma (`agents.defaults.compaction.memoryFlush`):

- `enabled` (varsayılan: `true`)
- `model` (boşaltma turu için isteğe bağlı tam sağlayıcı/model geçersiz kılması, örneğin `ollama/qwen3:8b`)
- `softThresholdTokens` (varsayılan: `4000`)
- `prompt` (boşaltma turu için kullanıcı mesajı)
- `systemPrompt` (boşaltma turu için eklenen ek sistem istemi)

Notlar:

- Varsayılan istem/sistem istemi, teslimi bastırmak için bir `NO_REPLY` ipucu içerir.
- `model` ayarlandığında, boşaltma turu etkin oturumun fallback zincirini devralmadan bu modeli kullanır; böylece yalnızca yerel bakım sessizce ücretli bir konuşma modeline geri dönmez.
- Boşaltma her Compaction döngüsünde bir kez çalışır (`sessions.json` içinde izlenir).
- Boşaltma yalnızca gömülü Pi oturumları için çalışır (CLI backend'leri bunu atlar).
- Oturum çalışma alanı salt okunur olduğunda (`workspaceAccess: "ro"` veya `"none"`) boşaltma atlanır.
- Çalışma alanı dosya yerleşimi ve yazma kalıpları için bkz. [Bellek](/tr/concepts/memory).

Pi ayrıca uzantı API içinde bir `session_before_compact` hook sunar, ancak OpenClaw'ın boşaltma mantığı bugün Gateway tarafında bulunur.

---

## Sorun giderme kontrol listesi

- Oturum anahtarı yanlış mı? [/concepts/session](/tr/concepts/session) ile başlayın ve `/status` içindeki `sessionKey` değerini doğrulayın.
- Depo ile konuşma dökümü uyuşmuyor mu? Gateway host'unu ve `openclaw status` çıktısındaki depo yolunu doğrulayın.
- Compaction spam'i mi var? Şunları kontrol edin:
  - model bağlam penceresi (çok küçük)
  - Compaction ayarları (`reserveTokens` model penceresi için çok yüksekse daha erken Compaction'a neden olabilir)
  - araç sonucu şişmesi: oturum budamayı etkinleştirin/ayarlayın
- Sessiz turlar sızıyor mu? Yanıtın `NO_REPLY` ile başladığını (büyük/küçük harfe duyarlı olmayan tam token) ve streaming bastırma düzeltmesini içeren bir derlemede olduğunuzu doğrulayın.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
- [Bağlam motoru](/tr/concepts/context-engine)
