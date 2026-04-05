---
read_when:
    - Oturum kimliklerinde, JSONL dökümlerinde veya sessions.json alanlarında hata ayıklamanız gerekiyorsa
    - Otomatik sıkıştırma davranışını değiştiriyor veya “sıkıştırma öncesi” bakım işlemleri ekliyorsanız
    - Bellek boşaltmaları veya sessiz sistem dönüşleri uygulamak istiyorsanız
summary: 'Ayrıntılı inceleme: oturum deposu + dökümler, yaşam döngüsü ve (otomatik) sıkıştırma ayrıntıları'
title: Oturum Yönetimine Ayrıntılı Bakış
x-i18n:
    generated_at: "2026-04-05T14:07:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: e379d624dd7808d3af25ed011079268ce6a9da64bb3f301598884ad4c46ab091
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Oturum Yönetimi ve Sıkıştırma (Ayrıntılı İnceleme)

Bu belge, OpenClaw’un oturumları uçtan uca nasıl yönettiğini açıklar:

- **Oturum yönlendirme** (gelen mesajların bir `sessionKey` ile nasıl eşlendiği)
- **Oturum deposu** (`sessions.json`) ve bunun neleri izlediği
- **Döküm kalıcılığı** (`*.jsonl`) ve yapısı
- **Döküm hijyeni** (çalıştırmalardan önce sağlayıcıya özgü düzeltmeler)
- **Bağlam sınırları** (bağlam penceresi ile izlenen token’lar)
- **Sıkıştırma** (manuel + otomatik sıkıştırma) ve sıkıştırma öncesi işlerin nereye bağlanacağı
- **Sessiz bakım işlemleri** (ör. kullanıcıya görünür çıktı üretmemesi gereken bellek yazımları)

Önce daha üst düzey bir genel bakış istiyorsanız, şuradan başlayın:

- [/concepts/session](/tr/concepts/session)
- [/concepts/compaction](/tr/concepts/compaction)
- [/concepts/memory](/tr/concepts/memory)
- [/concepts/memory-search](/tr/concepts/memory-search)
- [/concepts/session-pruning](/tr/concepts/session-pruning)
- [/reference/transcript-hygiene](/reference/transcript-hygiene)

---

## Gerçek kaynak: Gateway

OpenClaw, oturum durumuna sahip olan tek bir **Gateway işlemi** etrafında tasarlanmıştır.

- UI’ler (macOS uygulaması, web Control UI, TUI) oturum listeleri ve token sayıları için Gateway’i sorgulamalıdır.
- Uzak modda, oturum dosyaları uzak ana makinededir; “yerel Mac dosyalarınızı kontrol etmek”, Gateway’in kullandığını yansıtmaz.

---

## İki kalıcılık katmanı

OpenClaw oturumları iki katmanda kalıcı hale getirir:

1. **Oturum deposu (`sessions.json`)**
   - Anahtar/değer eşlemesi: `sessionKey -> SessionEntry`
   - Küçük, değiştirilebilir, düzenlemesi güvenli (veya girdileri silebilirsiniz)
   - Oturum meta verilerini izler (geçerli oturum kimliği, son etkinlik, anahtarlar, token sayaçları vb.)

2. **Döküm (`<sessionId>.jsonl`)**
   - Ağaç yapısına sahip salt eklemeli döküm (`id` + `parentId` içeren girdiler)
   - Gerçek konuşmayı + araç çağrılarını + sıkıştırma özetlerini depolar
   - Gelecek dönüşler için model bağlamını yeniden oluşturmakta kullanılır

---

## Disk üzerindeki konumlar

Gateway ana makinesinde, aracı başına:

- Depo: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Dökümler: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram konu oturumları: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw bunları `src/config/sessions.ts` üzerinden çözümler.

---

## Depo bakımı ve disk kontrolleri

Oturum kalıcılığında, `sessions.json` ve döküm yapıtları için otomatik bakım kontrolleri (`session.maintenance`) vardır:

- `mode`: `warn` (varsayılan) veya `enforce`
- `pruneAfter`: eski girişler için yaş sınırı (varsayılan `30d`)
- `maxEntries`: `sessions.json` içindeki giriş üst sınırı (varsayılan `500`)
- `rotateBytes`: `sessions.json` fazla büyüdüğünde döndürme yapar (varsayılan `10mb`)
- `resetArchiveRetention`: `*.reset.<timestamp>` döküm arşivleri için saklama süresi (varsayılan: `pruneAfter` ile aynı; `false` temizliği devre dışı bırakır)
- `maxDiskBytes`: isteğe bağlı oturumlar dizini bütçesi
- `highWaterBytes`: temizlik sonrası isteğe bağlı hedef (varsayılan `maxDiskBytes` değerinin `%80`’i)

Disk bütçesi temizliğinde zorlamanın sırası (`mode: "enforce"`):

1. Önce en eski arşivlenmiş veya sahipsiz döküm yapıtlarını kaldırır.
2. Hâlâ hedefin üzerindeyse, en eski oturum girdilerini ve bunların döküm dosyalarını çıkarır.
3. Kullanım `highWaterBytes` değerine eşit veya altına inene kadar devam eder.

`mode: "warn"` durumunda OpenClaw olası çıkarmaları bildirir, ancak depoyu/dosyaları değiştirmez.

Bakımı isteğe bağlı olarak çalıştırın:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron oturumları ve çalıştırma günlükleri

Yalıtılmış cron çalıştırmaları da oturum girdileri/dökümleri oluşturur ve bunlar için ayrılmış saklama kontrolleri vardır:

- `cron.sessionRetention` (varsayılan `24h`) eski yalıtılmış cron çalıştırma oturumlarını oturum deposundan temizler (`false` devre dışı bırakır).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyalarını budar (varsayılanlar: `2_000_000` bayt ve `2000` satır).

---

## Oturum anahtarları (`sessionKey`)

Bir `sessionKey`, _hangi konuşma kovasında_ olduğunuzu tanımlar (yönlendirme + yalıtım).

Yaygın kalıplar:

- Ana/doğrudan sohbet (aracı başına): `agent:<agentId>:<mainKey>` (varsayılan `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Oda/kanal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` veya `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (geçersiz kılınmadıysa)

Kuralların kanonik hali [/concepts/session](/tr/concepts/session) içinde belgelenmiştir.

---

## Oturum kimlikleri (`sessionId`)

Her `sessionKey`, geçerli bir `sessionId` değerini işaret eder (konuşmayı sürdüren döküm dosyası).

Temel kurallar:

- **Sıfırlama** (`/new`, `/reset`), o `sessionKey` için yeni bir `sessionId` oluşturur.
- **Günlük sıfırlama** (varsayılan olarak Gateway ana makinesinin yerel saatinde sabah 4:00) sıfırlama sınırından sonraki ilk mesajda yeni bir `sessionId` oluşturur.
- **Boşta kalma sona ermesi** (`session.reset.idleMinutes` veya eski `session.idleMinutes`), boşta kalma penceresinden sonra bir mesaj geldiğinde yeni bir `sessionId` oluşturur. Günlük + boşta kalma birlikte yapılandırılmışsa hangisi önce sona ererse o geçerli olur.
- **İş parçacığı üst çatallanma koruması** (`session.parentForkMaxTokens`, varsayılan `100000`), üst oturum zaten çok büyük olduğunda üst döküm çatallanmasını atlar; yeni iş parçacığı temiz başlar. Devre dışı bırakmak için `0` ayarlayın.

Uygulama ayrıntısı: karar, `src/auto-reply/reply/session.ts` içindeki `initSessionState()` içinde verilir.

---

## Oturum deposu şeması (`sessions.json`)

Depodaki değer türü, `src/config/sessions.ts` içindeki `SessionEntry`’dir.

Temel alanlar (tam liste değildir):

- `sessionId`: geçerli döküm kimliği (eğer `sessionFile` ayarlı değilse dosya adı bundan türetilir)
- `updatedAt`: son etkinlik zaman damgası
- `sessionFile`: isteğe bağlı açık döküm yolu geçersiz kılması
- `chatType`: `direct | group | room` (UI’lere ve gönderim ilkesine yardımcı olur)
- `provider`, `subject`, `room`, `space`, `displayName`: grup/kanal etiketlemesi için meta veriler
- Anahtarlar:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (oturum başına geçersiz kılma)
- Model seçimi:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token sayaçları (yaklaşık / sağlayıcıya bağlı):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: bu oturum anahtarı için otomatik sıkıştırmanın kaç kez tamamlandığı
- `memoryFlushAt`: son sıkıştırma öncesi bellek boşaltmanın zaman damgası
- `memoryFlushCompactionCount`: son boşaltmanın çalıştığı andaki sıkıştırma sayısı

Depoyu düzenlemek güvenlidir, ancak yetkili olan Gateway’dir: oturumlar çalışırken girdileri yeniden yazabilir veya yeniden oluşturabilir.

---

## Döküm yapısı (`*.jsonl`)

Dökümler, `@mariozechner/pi-coding-agent` paketinin `SessionManager` bileşeni tarafından yönetilir.

Dosya JSONL biçimindedir:

- İlk satır: oturum üst bilgisi (`type: "session"`, `id`, `cwd`, `timestamp`, isteğe bağlı `parentSession` içerir)
- Sonrasında: `id` + `parentId` içeren oturum girdileri (ağaç)

Önemli girdi türleri:

- `message`: kullanıcı/asistan/toolResult mesajları
- `custom_message`: model bağlamına _giren_ eklenti tarafından enjekte edilen mesajlar (UI’de gizlenebilir)
- `custom`: model bağlamına girmeyen eklenti durumu
- `compaction`: `firstKeptEntryId` ve `tokensBefore` içeren kalıcı sıkıştırma özeti
- `branch_summary`: ağaç dalında gezinirken kalıcı özet

OpenClaw kasıtlı olarak dökümleri “düzeltmez”; Gateway bunları okumak/yazmak için `SessionManager` kullanır.

---

## Bağlam pencereleri ile izlenen token’lar

İki farklı kavram önemlidir:

1. **Model bağlam penceresi**: model başına sabit üst sınır (modele görünen token’lar)
2. **Oturum deposu sayaçları**: `sessions.json` içine yazılan kayan istatistikler (`/status` ve panolar için kullanılır)

Sınırları ayarlıyorsanız:

- Bağlam penceresi model kataloğundan gelir (ve yapılandırma ile geçersiz kılınabilir).
- Depodaki `contextTokens`, çalışma zamanı tahmini/raporlama değeridir; bunu katı bir garanti olarak görmeyin.

Daha fazla bilgi için bkz. [/token-use](/reference/token-use).

---

## Sıkıştırma: nedir

Sıkıştırma, konuşmanın daha eski kısmını döküm içinde kalıcı bir `compaction` girdisi halinde özetler ve son mesajları olduğu gibi bırakır.

Sıkıştırmadan sonra gelecek dönüşler şunları görür:

- Sıkıştırma özeti
- `firstKeptEntryId` sonrasındaki mesajlar

Sıkıştırma **kalıcıdır** (oturum budamadan farklı olarak). Bkz. [/concepts/session-pruning](/tr/concepts/session-pruning).

## Sıkıştırma parça sınırları ve araç eşleştirmesi

OpenClaw uzun bir dökümü sıkıştırma parçalarına böldüğünde, asistan araç çağrılarını eşleşen `toolResult` girdileriyle birlikte tutar.

- Token payı bölünmesi bir araç çağrısı ile sonucu arasına denk gelirse, OpenClaw çifti ayırmak yerine sınırı asistan araç çağrısı mesajına kaydırır.
- Sondaki bir tool-result bloğu başka türlü parçayı hedefin üstüne çıkaracaksa, OpenClaw bu bekleyen araç bloğunu korur ve özetlenmemiş kuyruğu bozulmadan tutar.
- İptal edilmiş/hatalı araç çağrısı blokları bekleyen bölmeyi açık tutmaz.

---

## Otomatik sıkıştırma ne zaman gerçekleşir (Pi çalışma zamanı)

Gömülü Pi ajanında otomatik sıkıştırma iki durumda tetiklenir:

1. **Taşma kurtarma**: model bağlam taşması hatası döndürür
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` ve benzeri sağlayıcı biçimli varyantlar) → sıkıştır → yeniden dene.
2. **Eşik bakımı**: başarılı bir dönüşten sonra, şu durumda:

`contextTokens > contextWindow - reserveTokens`

Burada:

- `contextWindow`, modelin bağlam penceresidir
- `reserveTokens`, istemler + bir sonraki model çıktısı için ayrılan boşluktur

Bunlar Pi çalışma zamanı anlamlarıdır (OpenClaw olayları kullanır, ancak ne zaman sıkıştırılacağına Pi karar verir).

---

## Sıkıştırma ayarları (`reserveTokens`, `keepRecentTokens`)

Pi’nin sıkıştırma ayarları Pi ayarları içinde yer alır:

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

- Eğer `compaction.reserveTokens < reserveTokensFloor` ise, OpenClaw bunu yükseltir.
- Varsayılan taban `20000` token’dır.
- Tabanı devre dışı bırakmak için `agents.defaults.compaction.reserveTokensFloor: 0` ayarlayın.
- Zaten daha yüksekse, OpenClaw buna dokunmaz.

Neden: sıkıştırma kaçınılmaz hale gelmeden önce çok dönüşlü “bakım” işlemleri (örneğin bellek yazımları) için yeterli boşluk bırakmak.

Uygulama: `src/agents/pi-settings.ts` içindeki `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts` tarafından çağrılır).

---

## Kullanıcıya görünür yüzeyler

Sıkıştırmayı ve oturum durumunu şu yollarla gözlemleyebilirsiniz:

- `/status` (herhangi bir sohbet oturumunda)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Ayrıntılı mod: `🧹 Auto-compaction complete` + sıkıştırma sayısı

---

## Sessiz bakım işlemleri (`NO_REPLY`)

OpenClaw, kullanıcının ara çıktıyı görmemesi gereken arka plan görevleri için “sessiz” dönüşleri destekler.

Kural:

- Asistan, çıktısına tam sessiz belirteç olan `NO_REPLY` /
  `no_reply` ile başlayarak “kullanıcıya yanıt gönderme” anlamını belirtir.
- OpenClaw bunu teslim katmanında ayıklar/baskılar.
- Tam sessiz belirteç baskılaması büyük/küçük harfe duyarsızdır; dolayısıyla tüm yük yalnızca sessiz belirteç olduğunda `NO_REPLY` ve
  `no_reply` ikisi de geçerlidir.
- Bu yalnızca gerçekten arka plan/teslimatsız dönüşler içindir; sıradan eyleme geçirilebilir kullanıcı istekleri için bir kısayol değildir.

`2026.1.10` itibarıyla OpenClaw, kısmi bir parça `NO_REPLY` ile başladığında **taslak/yazıyor akışını** da baskılar; böylece sessiz işlemler dönüş ortasında kısmi çıktı sızdırmaz.

---

## Sıkıştırma öncesi "bellek boşaltma" (uygulandı)

Amaç: otomatik sıkıştırma gerçekleşmeden önce, kalıcı durumu diske yazan sessiz ve etkensel bir dönüş çalıştırmak
(ör. ajan çalışma alanında `memory/YYYY-MM-DD.md`) ki sıkıştırma kritik bağlamı silemesin.

OpenClaw **eşik öncesi boşaltma** yaklaşımını kullanır:

1. Oturum bağlam kullanımını izleyin.
2. Bir “yumuşak eşiği” (Pi’nin sıkıştırma eşiğinin altında) geçtiğinde, ajana sessiz bir
   “şimdi belleğe yaz” yönergesi çalıştırın.
3. Kullanıcının hiçbir şey görmemesi için tam sessiz belirteç `NO_REPLY` / `no_reply` kullanın.

Yapılandırma (`agents.defaults.compaction.memoryFlush`):

- `enabled` (varsayılan: `true`)
- `softThresholdTokens` (varsayılan: `4000`)
- `prompt` (boşaltma dönüşü için kullanıcı mesajı)
- `systemPrompt` (boşaltma dönüşü için eklenen ek sistem istemi)

Notlar:

- Varsayılan prompt/system prompt, teslimatı baskılamak için bir `NO_REPLY` ipucu içerir.
- Boşaltma her sıkıştırma döngüsünde bir kez çalışır (`sessions.json` içinde izlenir).
- Boşaltma yalnızca gömülü Pi oturumları için çalışır (CLI arka uçları bunu atlar).
- Oturum çalışma alanı salt okunursa boşaltma atlanır (`workspaceAccess: "ro"` veya `"none"`).
- Çalışma alanı dosya düzeni ve yazma kalıpları için bkz. [Memory](/tr/concepts/memory).

Pi ayrıca eklenti API’sinde bir `session_before_compact` kancası sunar, ancak OpenClaw’un
boşaltma mantığı bugün Gateway tarafında yer alır.

---

## Sorun giderme kontrol listesi

- Oturum anahtarı yanlış mı? [/concepts/session](/tr/concepts/session) ile başlayın ve `/status` içindeki `sessionKey` değerini doğrulayın.
- Depo ile döküm eşleşmiyor mu? Gateway ana makinesini ve `openclaw status` içinden depo yolunu doğrulayın.
- Sıkıştırma spam’i mi var? Şunları kontrol edin:
  - model bağlam penceresi (çok küçük olabilir)
  - sıkıştırma ayarları (model penceresi için `reserveTokens` fazla yüksekse daha erken sıkıştırmaya neden olabilir)
  - tool-result şişmesi: oturum budamayı etkinleştirin/ayarlayın
- Sessiz dönüşler sızıyor mu? Yanıtın `NO_REPLY` ile başladığını (büyük/küçük harfe duyarsız tam belirteç) ve akış baskılama düzeltmesini içeren bir derleme kullandığınızı doğrulayın.
