---
read_when:
    - Oturum kimliklerinde, transkript JSONL'inde veya sessions.json alanlarında hata ayıklamanız gerekiyor
    - Otomatik Compaction davranışını değiştiriyor veya “Compaction öncesi” temizlik işlemleri ekliyorsunuz
    - Bellek boşaltmaları veya sessiz sistem dönüşleri uygulamak istiyorsunuz
summary: 'Derinlemesine inceleme: oturum deposu + transkriptler, yaşam döngüsü ve (otomatik)Compaction iç işleyişi'
title: Oturum yönetimine derinlemesine bakış
x-i18n:
    generated_at: "2026-05-02T09:06:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ca8a35210625051f5051e90a18a005d6103bc1d65d356c34f818d2bfc0058c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw şu alanlarda oturumları baştan sona yönetir:

- **Oturum yönlendirme** (gelen iletilerin bir `sessionKey` ile nasıl eşlendiği)
- **Oturum deposu** (`sessions.json`) ve izlediği bilgiler
- **Transkript kalıcılığı** (`*.jsonl`) ve yapısı
- **Transkript temizliği** (çalıştırmalardan önce sağlayıcıya özgü düzeltmeler)
- **Bağlam sınırları** (bağlam penceresi ve izlenen token'lar)
- **Compaction** (elle ve otomatik Compaction) ve Compaction öncesi çalışmanın nereye bağlanacağı
- **Sessiz bakım** (kullanıcıya görünür çıktı üretmemesi gereken bellek yazımları)

Önce daha üst düzey bir genel bakış istiyorsanız şunlarla başlayın:

- [Oturum yönetimi](/tr/concepts/session)
- [Compaction](/tr/concepts/compaction)
- [Belleğe genel bakış](/tr/concepts/memory)
- [Bellek araması](/tr/concepts/memory-search)
- [Oturum budama](/tr/concepts/session-pruning)
- [Transkript temizliği](/tr/reference/transcript-hygiene)

---

## Doğruluk kaynağı: Gateway

OpenClaw, oturum durumunun sahibi olan tek bir **Gateway süreci** etrafında tasarlanmıştır.

- UI'lar (macOS uygulaması, web Control UI, TUI) oturum listeleri ve token sayıları için Gateway'i sorgulamalıdır.
- Uzak modda oturum dosyaları uzak ana makinededir; "yerel Mac dosyalarınızı denetlemek", Gateway'in kullandığını yansıtmaz.

---

## İki kalıcılık katmanı

OpenClaw oturumları iki katmanda kalıcı hale getirir:

1. **Oturum deposu (`sessions.json`)**
   - Anahtar/değer eşlemi: `sessionKey -> SessionEntry`
   - Küçük, değiştirilebilir, düzenlemesi (veya girdileri silmesi) güvenli
   - Oturum meta verilerini izler (geçerli oturum kimliği, son etkinlik, açma/kapatma ayarları, token sayaçları vb.)

2. **Transkript (`<sessionId>.jsonl`)**
   - Ağaç yapısına sahip yalnızca eklemeli transkript (girdilerde `id` + `parentId` bulunur)
   - Asıl konuşmayı + araç çağrılarını + Compaction özetlerini depolar
   - Gelecek dönüşler için model bağlamını yeniden oluşturmakta kullanılır
   - Etkin transkript denetim noktası boyut üst sınırını aştığında, Compaction öncesi büyük hata ayıklama denetim noktaları atlanır; böylece ikinci bir dev `.checkpoint.*.jsonl` kopyası önlenir.

Gateway geçmiş okuyucuları, yüzey açıkça rastgele geçmiş erişimine ihtiyaç duymadıkça transkriptin tamamını belleğe almaktan kaçınmalıdır. İlk sayfa geçmişi, gömülü sohbet geçmişi, yeniden başlatma kurtarması ve token/kullanım denetimleri sınırlı kuyruk okumaları kullanır. Tam transkript taramaları, dosya yolu artı `mtimeMs`/`size` ile önbelleğe alınan ve eşzamanlı okuyucular arasında paylaşılan asenkron transkript dizininden geçer.

---

## Diskteki konumlar

Her ajan için, Gateway ana makinesinde:

- Depo: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkriptler: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram konu oturumları: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw bunları `src/config/sessions.ts` üzerinden çözümler.

---

## Depo bakımı ve disk denetimleri

Oturum kalıcılığı, `sessions.json`, transkript yapıtları ve trajectory yan dosyaları için otomatik bakım denetimlerine (`session.maintenance`) sahiptir:

- `mode`: `warn` (varsayılan) veya `enforce`
- `pruneAfter`: eski girdi yaş sınırı (varsayılan `30d`)
- `maxEntries`: `sessions.json` içindeki girdi üst sınırı (varsayılan `500`)
- `resetArchiveRetention`: `*.reset.<timestamp>` transkript arşivleri için saklama süresi (varsayılan: `pruneAfter` ile aynı; `false` temizliği devre dışı bırakır)
- `maxDiskBytes`: isteğe bağlı oturum dizini bütçesi
- `highWaterBytes`: temizlikten sonraki isteğe bağlı hedef (varsayılan `maxDiskBytes` değerinin `%80`'i)

Normal Gateway yazımları, üretim ölçekli üst sınırlar için `maxEntries` temizliğini toplu işler; bu yüzden depo, bir sonraki yüksek su temizliği onu yeniden aşağı çekene kadar yapılandırılmış üst sınırı kısa süreliğine aşabilir. Oturum deposu okumaları, Gateway başlangıcı sırasında girdileri budamaz veya sınırlamaz; temizlik için yazımları ya da `openclaw sessions cleanup --enforce` komutunu kullanın. `openclaw sessions cleanup --enforce` yapılandırılmış üst sınırı yine de hemen uygular.

Bakım, grup oturumları ve iş parçacığı kapsamlı sohbet oturumları gibi dayanıklı harici konuşma işaretçilerini korur; ancak Cron, hook'lar, Heartbeat, ACP ve alt ajanlar için sentetik çalışma zamanı girdileri, yapılandırılmış yaş, sayı veya disk bütçesini aştıklarında yine de kaldırılabilir.

OpenClaw artık Gateway yazımları sırasında otomatik `sessions.json.bak.*` rotasyon yedekleri oluşturmaz. Eski `session.maintenance.rotateBytes` anahtarı yok sayılır ve `openclaw doctor --fix` bunu eski yapılandırmalardan kaldırır.

Disk bütçesi temizliği için uygulama sırası (`mode: "enforce"`):

1. Önce en eski arşivlenmiş, yetim transkript veya yetim trajectory yapıtlarını kaldırın.
2. Hâlâ hedefin üzerindeyse, en eski oturum girdilerini ve bunların transkript/trajectory dosyalarını çıkarın.
3. Kullanım `highWaterBytes` değerinde veya altında olana kadar devam edin.

`mode: "warn"` içinde OpenClaw olası çıkarmaları bildirir ancak depoyu/dosyaları değiştirmez.

Bakımı isteğe bağlı çalıştırın:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron oturumları ve çalıştırma günlükleri

Yalıtılmış Cron çalıştırmaları da oturum girdileri/transkriptler oluşturur ve bunlar için özel saklama denetimleri vardır:

- `cron.sessionRetention` (varsayılan `24h`), eski yalıtılmış Cron çalıştırma oturumlarını oturum deposundan budar (`false` devre dışı bırakır).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyalarını budar (varsayılanlar: `2_000_000` bayt ve `2000` satır).

Cron yeni bir yalıtılmış çalıştırma oturumunu zorla oluşturduğunda, yeni satırı yazmadan önce önceki `cron:<jobId>` oturum girdisini temizler. Düşünme/hızlı/ayrıntılı ayarları, etiketler ve açıkça kullanıcı tarafından seçilmiş model/kimlik doğrulama geçersiz kılmaları gibi güvenli tercihleri taşır. Taze bir yalıtılmış çalıştırmanın eski bir çalıştırmadan bayat teslimat veya çalışma zamanı yetkisi devralamaması için kanal/grup yönlendirme, gönderme veya kuyruk ilkesi, yükseltme, köken ve ACP çalışma zamanı bağlaması gibi ortam konuşma bağlamını atar.

---

## Oturum anahtarları (`sessionKey`)

Bir `sessionKey`, _hangi konuşma kovasında_ olduğunuzu tanımlar (yönlendirme + yalıtım).

Yaygın kalıplar:

- Ana/doğrudan sohbet (ajan başına): `agent:<agentId>:<mainKey>` (varsayılan `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Oda/kanal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` veya `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (geçersiz kılınmadıkça)

Kanonik kurallar [/concepts/session](/tr/concepts/session) bölümünde belgelenmiştir.

---

## Oturum kimlikleri (`sessionId`)

Her `sessionKey`, geçerli bir `sessionId` değerine işaret eder (konuşmayı sürdüren transkript dosyası).

Temel kurallar:

- **Sıfırlama** (`/new`, `/reset`) bu `sessionKey` için yeni bir `sessionId` oluşturur.
- **Günlük sıfırlama** (varsayılan olarak Gateway ana makinesinin yerel saatinde 04:00) sıfırlama sınırından sonraki ilk iletide yeni bir `sessionId` oluşturur.
- **Boşta kalma süresi dolumu** (`session.reset.idleMinutes` veya eski `session.idleMinutes`), boşta kalma penceresinden sonra bir ileti geldiğinde yeni bir `sessionId` oluşturur. Günlük + boşta kalma birlikte yapılandırıldığında, önce hangisinin süresi dolarsa o kazanır.
- **Sistem olayları** (Heartbeat, Cron uyandırmaları, exec bildirimleri, Gateway defter tutma işlemleri) oturum satırını değiştirebilir ancak günlük/boşta kalma sıfırlama tazeliğini uzatmaz. Sıfırlama devri, taze istem oluşturulmadan önce önceki oturum için kuyruktaki sistem olayı bildirimlerini atar.
- **Üst dal politikası**, bir iş parçacığı veya alt ajan dalı oluştururken Pi'nin etkin dalını kullanır. Bu dal çok büyükse OpenClaw çocuğu başarısız olmak veya kullanılamaz geçmişi devralmak yerine yalıtılmış bağlamla başlatır. Boyutlandırma politikası otomatiktir; eski `session.parentForkMaxTokens` yapılandırması `openclaw doctor --fix` tarafından kaldırılır.

Uygulama ayrıntısı: karar `src/auto-reply/reply/session.ts` içindeki `initSessionState()` içinde gerçekleşir.

---

## Oturum deposu şeması (`sessions.json`)

Deponun değer tipi `src/config/sessions.ts` içindeki `SessionEntry` türüdür.

Ana alanlar (tam liste değildir):

- `sessionId`: geçerli transkript kimliği (`sessionFile` ayarlanmadıkça dosya adı bundan türetilir)
- `sessionStartedAt`: geçerli `sessionId` için başlangıç zaman damgası; günlük sıfırlama tazeliği bunu kullanır. Eski satırlar bunu JSONL oturum başlığından türetebilir.
- `lastInteractionAt`: son gerçek kullanıcı/kanal etkileşimi zaman damgası; boşta kalma sıfırlama tazeliği bunu kullanır, böylece Heartbeat, Cron ve exec olayları oturumları canlı tutmaz. Bu alanı olmayan eski satırlar, boşta kalma tazeliği için kurtarılan oturum başlangıç zamanına geri döner.
- `updatedAt`: listeleme, budama ve defter tutma için kullanılan son depo satırı değişiklik zaman damgası. Günlük/boşta kalma sıfırlama tazeliği için yetkili kaynak değildir.
- `sessionFile`: isteğe bağlı açık transkript yolu geçersiz kılması
- `chatType`: `direct | group | room` (UI'lara ve gönderme ilkesine yardımcı olur)
- `provider`, `subject`, `room`, `space`, `displayName`: grup/kanal etiketleme için meta veriler
- Açma/kapatma ayarları:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (oturum başına geçersiz kılma)
- Model seçimi:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token sayaçları (en iyi çaba / sağlayıcıya bağlı):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: bu oturum anahtarı için otomatik Compaction'ın kaç kez tamamlandığı
- `memoryFlushAt`: son Compaction öncesi bellek boşaltımı için zaman damgası
- `memoryFlushCompactionCount`: son boşaltım çalıştığında Compaction sayısı

Depoyu düzenlemek güvenlidir, ancak Gateway yetkili kaynaktır: oturumlar çalışırken girdileri yeniden yazabilir veya yeniden canlandırabilir.

---

## Transkript yapısı (`*.jsonl`)

Transkriptler `@mariozechner/pi-coding-agent` paketinin `SessionManager` aracı tarafından yönetilir.

Dosya JSONL'dir:

- İlk satır: oturum başlığı (`type: "session"`, `id`, `cwd`, `timestamp`, isteğe bağlı `parentSession` içerir)
- Sonra: `id` + `parentId` içeren oturum girdileri (ağaç)

Dikkate değer girdi türleri:

- `message`: kullanıcı/asistan/toolResult iletileri
- `custom_message`: model bağlamına _giren_ uzantı tarafından enjekte edilmiş iletiler (UI'dan gizlenebilir)
- `custom`: model bağlamına _girmeyen_ uzantı durumu
- `compaction`: `firstKeptEntryId` ve `tokensBefore` içeren kalıcı Compaction özeti
- `branch_summary`: ağaç dalında gezinirken kalıcı hale getirilen özet

OpenClaw transkriptleri bilerek "düzeltmez"; Gateway bunları okumak/yazmak için `SessionManager` kullanır.

---

## Bağlam pencereleri ve izlenen token'lar

İki farklı kavram önemlidir:

1. **Model bağlam penceresi**: model başına sert üst sınır (modelin görebildiği token'lar)
2. **Oturum deposu sayaçları**: `sessions.json` içine yazılan kayan istatistikler (/status ve panolar için kullanılır)

Sınırları ayarlıyorsanız:

- Bağlam penceresi model kataloğundan gelir (ve yapılandırma üzerinden geçersiz kılınabilir).
- Depodaki `contextTokens` bir çalışma zamanı tahmini/raporlama değeridir; bunu katı bir garanti olarak ele almayın.

Daha fazlası için bkz. [/token-use](/tr/reference/token-use).

---

## Compaction: nedir

Compaction, eski konuşmayı transkript içinde kalıcı bir `compaction` girdisine özetler ve son iletileri olduğu gibi tutar.

Compaction'dan sonra gelecek dönüşler şunları görür:

- Compaction özeti
- `firstKeptEntryId` sonrasındaki iletiler

Compaction **kalıcıdır** (oturum budamanın aksine). Bkz. [/concepts/session-pruning](/tr/concepts/session-pruning).

## Compaction parça sınırları ve araç eşleştirme

OpenClaw uzun bir transkripti Compaction parçalarına böldüğünde, asistan araç çağrılarını eşleşen `toolResult` girdileriyle birlikte tutar.

- Token payı bölmesi bir araç çağrısı ile sonucu arasına denk gelirse OpenClaw, çifti ayırmak yerine sınırı asistan araç çağrısı iletisine kaydırır.
- Sondaki bir araç sonucu bloğu aksi halde parçayı hedefin üzerine çıkaracaksa OpenClaw bekleyen bu araç bloğunu korur ve özetlenmemiş kuyruğu olduğu gibi tutar.
- İptal edilmiş/hatalı araç çağrısı blokları bekleyen bir bölmeyi açık tutmaz.

---

## Otomatik Compaction ne zaman gerçekleşir (Pi çalışma zamanı)

Gömülü Pi ajanında otomatik Compaction iki durumda tetiklenir:

1. **Taşma kurtarma**: model bir bağlam taşması hatası döndürür
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` ve benzer sağlayıcı biçimli türevler) → compact → yeniden dene.
2. **Eşik bakımı**: başarılı bir turdan sonra, şu durumda:

`contextTokens > contextWindow - reserveTokens`

Burada:

- `contextWindow`, modelin bağlam penceresidir
- `reserveTokens`, istemler + sonraki model çıktısı için ayrılan paydır

Bunlar Pi çalışma zamanı semantik kurallarıdır (OpenClaw olayları tüketir, ancak ne zaman compact yapılacağına Pi karar verir).

OpenClaw, `agents.defaults.compaction.maxActiveTranscriptBytes` ayarlandığında ve
etkin transkript dosyası bu boyuta ulaştığında, sonraki çalıştırmayı açmadan önce
bir ön kontrol yerel compaction işlemi de tetikleyebilir. Bu, yerel yeniden açma
maliyeti için bir dosya boyutu korumasıdır; ham arşivleme değildir: OpenClaw yine
normal semantik compaction çalıştırır ve compact edilmiş özetin yeni bir ardıl
transkript olabilmesi için `truncateAfterCompaction` gerektirir.

Gömülü Pi çalıştırmaları için `agents.defaults.compaction.midTurnPrecheck.enabled: true`
isteğe bağlı bir araç döngüsü koruması ekler. Bir araç sonucu eklendikten sonra ve
sonraki model çağrısından önce OpenClaw, tur başlangıcında kullanılan aynı ön kontrol
bütçe mantığını kullanarak istem baskısını tahmin eder. Bağlam artık sığmıyorsa,
koruma Pi'nin `transformContext` hook'u içinde compact yapmaz. Yapılandırılmış
bir tur ortası ön kontrol sinyali yükseltir, mevcut istem gönderimini durdurur ve
dış çalıştırma döngüsünün mevcut kurtarma yolunu kullanmasına izin verir: yeterli
olduğunda fazla büyük araç sonuçlarını kısaltır veya yapılandırılmış compaction
modunu tetikleyip yeniden dener. Seçenek varsayılan olarak devre dışıdır ve
sağlayıcı destekli safeguard compaction dahil hem `default` hem de `safeguard`
compaction modlarıyla çalışır.
Bu, `maxActiveTranscriptBytes` değerinden bağımsızdır: bayt boyutu koruması
bir tur açılmadan önce çalışır, tur ortası ön kontrol ise gömülü Pi araç döngüsünde
yeni araç sonuçları eklendikten sonra daha sonra çalışır.

---

## Compaction ayarları (`reserveTokens`, `keepRecentTokens`)

Pi'nin compaction ayarları Pi ayarlarında bulunur:

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
- Varsayılan taban `20000` tokendir.
- Tabanı devre dışı bırakmak için `agents.defaults.compaction.reserveTokensFloor: 0` ayarlayın.
- Zaten daha yüksekse OpenClaw bunu olduğu gibi bırakır.
- Manuel `/compact`, açık bir `agents.defaults.compaction.keepRecentTokens`
  değerine uyar ve Pi'nin son kuyruk kesim noktasını korur. Açık bir koruma bütçesi
  olmadan manuel compaction katı bir denetim noktası olarak kalır ve yeniden
  oluşturulan bağlam yeni özetten başlar.
- Yeni araç sonuçlarından sonra ve sonraki model çağrısından önce isteğe bağlı
  araç döngüsü ön kontrolünü çalıştırmak için
  `agents.defaults.compaction.midTurnPrecheck.enabled: true` ayarlayın. Bu yalnızca
  bir tetikleyicidir; özet üretimi hâlâ yapılandırılmış compaction yolunu kullanır.
  Tur başlangıcında etkin transkript bayt boyutu koruması olan
  `maxActiveTranscriptBytes` değerinden bağımsızdır.
- Etkin transkript büyüdüğünde bir turdan önce yerel compaction çalıştırmak için
  `agents.defaults.compaction.maxActiveTranscriptBytes` değerini bir bayt değeri
  veya `"20mb"` gibi bir dize olarak ayarlayın. Bu koruma yalnızca
  `truncateAfterCompaction` da etkinleştirildiğinde aktiftir. Devre dışı bırakmak
  için ayarlanmamış bırakın veya `0` ayarlayın.
- `agents.defaults.compaction.truncateAfterCompaction` etkinleştirildiğinde,
  OpenClaw compaction sonrasında etkin transkripti compact edilmiş bir ardıl JSONL'ye
  döndürür. Eski tam transkript yerinde yeniden yazılmak yerine arşivlenmiş olarak
  kalır ve compaction denetim noktasından bağlanır.

Neden: compaction kaçınılmaz hale gelmeden önce çok turlu “bakım” işlemleri (bellek yazmaları gibi) için yeterli pay bırakmak.

Uygulama: `src/agents/pi-settings.ts` içinde `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts` içinden çağrılır).

---

## Takılabilir compaction sağlayıcıları

Plugin'ler, plugin API'sindeki `registerCompactionProvider()` üzerinden bir compaction sağlayıcısı kaydedebilir. `agents.defaults.compaction.provider` kayıtlı bir sağlayıcı kimliğine ayarlandığında, safeguard uzantısı özetlemeyi yerleşik `summarizeInStages` hattı yerine o sağlayıcıya devreder.

- `provider`: kayıtlı bir compaction sağlayıcısı plugin'inin kimliği. Varsayılan LLM özetlemesi için ayarlanmamış bırakın.
- Bir `provider` ayarlamak `mode: "safeguard"` değerini zorunlu kılar.
- Sağlayıcılar, yerleşik yolla aynı compaction talimatlarını ve tanımlayıcı koruma politikasını alır.
- Safeguard, sağlayıcı çıktısından sonra da son tur ve bölünmüş tur son ek bağlamını korur.
- Yerleşik safeguard özetlemesi, tam önceki özeti birebir korumak yerine önceki özetleri
  yeni iletilerle yeniden damıtır.
- Safeguard modu özet kalite denetimlerini varsayılan olarak etkinleştirir; hatalı biçimli çıktı durumunda yeniden deneme davranışını atlamak için
  `qualityGuard.enabled: false` ayarlayın.
- Sağlayıcı başarısız olursa veya boş bir sonuç döndürürse OpenClaw otomatik olarak yerleşik LLM özetlemesine geri döner.
- Çağıranın iptalini dikkate almak için iptal/zaman aşımı sinyalleri yeniden fırlatılır (yutulmaz).

Kaynak: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Kullanıcının görebildiği yüzeyler

Compaction ve oturum durumunu şunlar üzerinden gözlemleyebilirsiniz:

- `/status` (herhangi bir sohbet oturumunda)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Ayrıntılı mod: `🧹 Auto-compaction complete` + compaction sayısı

---

## Sessiz bakım (`NO_REPLY`)

OpenClaw, kullanıcının ara çıktıları görmemesi gereken arka plan görevleri için “sessiz” turları destekler.

Kural:

- Asistan, “kullanıcıya yanıt teslim etme” anlamına geldiğini belirtmek için çıktısını tam sessiz belirteç `NO_REPLY` /
  `no_reply` ile başlatır.
- OpenClaw bunu teslim katmanında çıkarır/bastırır.
- Tam sessiz belirteç bastırma büyük/küçük harfe duyarsızdır; bu yüzden tüm yük yalnızca sessiz belirteç olduğunda hem `NO_REPLY` hem de
  `no_reply` sayılır.
- Bu yalnızca gerçek arka plan/teslim edilmeyecek turlar içindir; olağan işlem gerektiren kullanıcı istekleri için bir kısayol değildir.

`2026.1.10` itibarıyla OpenClaw, kısmi bir parça `NO_REPLY` ile başladığında
**taslak/yazıyor akışını** da bastırır; böylece sessiz işlemler tur ortasında kısmi
çıktı sızdırmaz.

---

## Compaction öncesi "bellek boşaltma" (uygulandı)

Amaç: otomatik compaction gerçekleşmeden önce, dayanıklı durumu diske yazan sessiz
bir agentic tur çalıştırmak (ör. ajan çalışma alanında `memory/YYYY-MM-DD.md`) ve böylece compaction'ın
kritik bağlamı silememesini sağlamak.

OpenClaw **eşik öncesi boşaltma** yaklaşımını kullanır:

1. Oturum bağlam kullanımını izle.
2. Pi'nin compaction eşiğinin altındaki bir “yumuşak eşiği” geçtiğinde, ajana sessiz
   bir “belleği şimdi yaz” yönergesi çalıştır.
3. Kullanıcının hiçbir şey görmemesi için tam sessiz belirteç `NO_REPLY` / `no_reply` kullan.

Yapılandırma (`agents.defaults.compaction.memoryFlush`):

- `enabled` (varsayılan: `true`)
- `model` (boşaltma turu için isteğe bağlı tam sağlayıcı/model geçersiz kılması, örneğin `ollama/qwen3:8b`)
- `softThresholdTokens` (varsayılan: `4000`)
- `prompt` (boşaltma turu için kullanıcı iletisi)
- `systemPrompt` (boşaltma turu için eklenen ekstra sistem istemi)

Notlar:

- Varsayılan istem/sistem istemi, teslimi bastırmak için bir `NO_REPLY` ipucu içerir.
- `model` ayarlandığında, boşaltma turu etkin oturum yedek zincirini devralmadan
  o modeli kullanır; böylece yalnızca yerel bakım sessizce ücretli bir konuşma
  modeline geri düşmez.
- Boşaltma, her compaction döngüsünde bir kez çalışır (`sessions.json` içinde izlenir).
- Boşaltma yalnızca gömülü Pi oturumları için çalışır (CLI backend'leri bunu atlar).
- Oturum çalışma alanı salt okunur olduğunda (`workspaceAccess: "ro"` veya `"none"`) boşaltma atlanır.
- Çalışma alanı dosya düzeni ve yazma kalıpları için [Memory](/tr/concepts/memory) bölümüne bakın.

Pi, uzantı API'sinde bir `session_before_compact` hook'u da sunar, ancak OpenClaw'ın
boşaltma mantığı bugün Gateway tarafında bulunur.

---

## Sorun giderme kontrol listesi

- Oturum anahtarı yanlış mı? [/concepts/session](/tr/concepts/session) ile başlayın ve `/status` içindeki `sessionKey` değerini doğrulayın.
- Depo ile transkript uyuşmuyor mu? `openclaw status` çıktısından Gateway ana makinesini ve depo yolunu doğrulayın.
- Compaction spam'i mi var? Kontrol edin:
  - model bağlam penceresi (çok küçük)
  - compaction ayarları (`reserveTokens` model penceresi için çok yüksekse daha erken compaction'a neden olabilir)
  - araç sonucu şişmesi: oturum budamayı etkinleştirin/ayarlayın
- Sessiz turlar sızıyor mu? Yanıtın `NO_REPLY` ile başladığını (büyük/küçük harfe duyarsız tam belirteç) ve akış bastırma düzeltmesini içeren bir derlemede olduğunuzu doğrulayın.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
- [Bağlam motoru](/tr/concepts/context-engine)
