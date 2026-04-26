---
read_when:
    - Oturum kimlikleri, transcript JSONL veya sessions.json alanlarında hata ayıklamanız gerekiyor.
    - Otomatik Compaction davranışını değiştiriyor veya “Compaction öncesi” temizlik ekliyorsunuz.
    - Bellek boşaltmaları veya sessiz sistem turları uygulamak istiyorsunuz.
summary: 'Derin inceleme: oturum deposu + dökümler, yaşam döngüsü ve (otomatik) Compaction iç yapıları'
title: Oturum yönetimi derin incelemesi
x-i18n:
    generated_at: "2026-04-26T11:40:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: f41f1c403f978c22cc2a929629e1811414d1399fa7f9e28c481fcb594d30196f
    source_path: reference/session-management-compaction.md
    workflow: 15
---

Bu sayfa OpenClaw'ın oturumları uçtan uca nasıl yönettiğini açıklar:

- **Oturum yönlendirme** (gelen mesajların bir `sessionKey` değerine nasıl eşlendiği)
- **Oturum deposu** (`sessions.json`) ve neyi izlediği
- **Döküm kalıcılığı** (`*.jsonl`) ve yapısı
- **Döküm hijyeni** (çalıştırmalardan önce sağlayıcıya özgü düzeltmeler)
- **Bağlam sınırları** (bağlam penceresi ve izlenen token'lar)
- **Compaction** (elle + otomatik Compaction) ve Compaction öncesi çalışmayı nereye bağlayabileceğiniz
- **Sessiz bakım işleri** (ör. kullanıcıya görünür çıktı üretmemesi gereken bellek yazımları)

Önce daha üst düzey bir genel bakış istiyorsanız şuradan başlayın:

- [Oturum yönetimi](/tr/concepts/session)
- [Compaction](/tr/concepts/compaction)
- [Belleğe genel bakış](/tr/concepts/memory)
- [Bellek araması](/tr/concepts/memory-search)
- [Oturum budama](/tr/concepts/session-pruning)
- [Döküm hijyeni](/tr/reference/transcript-hygiene)

---

## Tek doğruluk kaynağı: Gateway

OpenClaw, oturum durumunun sahibi olan tek bir **Gateway süreci** etrafında tasarlanmıştır.

- UI'lar (macOS uygulaması, web Control UI, TUI), oturum listeleri ve token sayıları için Gateway'i sorgulamalıdır.
- Uzak modda, oturum dosyaları uzak host üzerindedir; “yerel Mac dosyalarınızı denetlemek”, Gateway'in kullandığını yansıtmaz.

---

## İki kalıcılık katmanı

OpenClaw, oturumları iki katmanda kalıcı hale getirir:

1. **Oturum deposu (`sessions.json`)**
   - Anahtar/değer haritası: `sessionKey -> SessionEntry`
   - Küçük, değiştirilebilir, düzenlemesi güvenli (veya girdileri silebilirsiniz)
   - Oturum meta verilerini izler (geçerli oturum kimliği, son etkinlik, geçişler, token sayaçları vb.)

2. **Döküm (`<sessionId>.jsonl`)**
   - Ağaç yapılı, yalnızca eklemeli döküm (girdiler `id` + `parentId` içerir)
   - Gerçek konuşmayı + araç çağrılarını + Compaction özetlerini saklar
   - Gelecek turlar için model bağlamını yeniden kurmakta kullanılır

---

## Disk üzerindeki konumlar

Gateway hostunda, ajan başına:

- Depo: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Dökümler: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram konu oturumları: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw bunları `src/config/sessions.ts` üzerinden çözümler.

---

## Depo bakımı ve disk denetimleri

Oturum kalıcılığı, `sessions.json` ve döküm artifact'leri için otomatik bakım denetimlerine (`session.maintenance`) sahiptir:

- `mode`: `warn` (varsayılan) veya `enforce`
- `pruneAfter`: eski girdi yaş sınırı (varsayılan `30d`)
- `maxEntries`: `sessions.json` içindeki en fazla girdi sayısı (varsayılan `500`)
- `rotateBytes`: `sessions.json` çok büyüdüğünde döndür (varsayılan `10mb`)
- `resetArchiveRetention`: `*.reset.<timestamp>` döküm arşivleri için saklama süresi (varsayılan: `pruneAfter` ile aynı; `false` temizliği devre dışı bırakır)
- `maxDiskBytes`: isteğe bağlı oturumlar-dizini bütçesi
- `highWaterBytes`: temizlik sonrası isteğe bağlı hedef (varsayılan `maxDiskBytes` değerinin `%80`'i)

Disk bütçesi temizliği için zorlama sırası (`mode: "enforce"`):

1. Önce en eski arşivlenmiş veya yetim döküm artifact'lerini kaldır.
2. Hâlâ hedefin üzerindeyse en eski oturum girdilerini ve bunların döküm dosyalarını çıkar.
3. Kullanım `highWaterBytes` değerine veya altına düşene kadar devam et.

`mode: "warn"` modunda OpenClaw olası çıkarmaları bildirir ama depo/dosyaları değiştirmez.

Bakımı isteğe bağlı olarak çalıştırın:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron oturumları ve çalıştırma günlükleri

Yalıtılmış Cron çalıştırmaları da oturum girdileri/dökümleri oluşturur ve bunların özel saklama denetimleri vardır:

- `cron.sessionRetention` (varsayılan `24h`), eski yalıtılmış Cron çalıştırma oturumlarını oturum deposundan temizler (`false` devre dışı bırakır).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyalarını budar (varsayılanlar: `2_000_000` bayt ve `2000` satır).

Cron yeni bir yalıtılmış çalıştırma oturumunu zorla oluşturduğunda, yeni satırı yazmadan önce
önceki `cron:<jobId>` oturum girdisini temizler. Şunlar gibi güvenli
tercihleri taşır: thinking/fast/verbose ayarları, etiketler ve açık
kullanıcı seçimi model/auth geçersiz kılmaları. Ortamsal konuşma bağlamını ise
bırakır; örneğin kanal/grup yönlendirmesi, gönderme veya kuyruk ilkesi, yükseltme, köken ve ACP
çalışma zamanı bağlaması. Böylece yeni bir yalıtılmış çalıştırma, eski bir çalıştırmadan gelen teslimat veya
çalışma zamanı yetkisini devralamaz.

---

## Oturum anahtarları (`sessionKey`)

Bir `sessionKey`, hangi _konuşma kovasında_ bulunduğunuzu belirler (yönlendirme + yalıtım).

Yaygın desenler:

- Ana/doğrudan sohbet (ajan başına): `agent:<agentId>:<mainKey>` (varsayılan `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Oda/kanal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` veya `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (geçersiz kılınmadıkça)

Kanonik kurallar [/concepts/session](/tr/concepts/session) adresinde belgelenmiştir.

---

## Oturum kimlikleri (`sessionId`)

Her `sessionKey`, geçerli bir `sessionId` değerini işaret eder (konuşmayı sürdüren döküm dosyası).

Pratik kurallar:

- **Sıfırlama** (`/new`, `/reset`), o `sessionKey` için yeni bir `sessionId` oluşturur.
- **Günlük sıfırlama** (varsayılan olarak gateway hostunun yerel saatine göre sabah 4:00) sıfırlama sınırından sonraki ilk mesajda yeni bir `sessionId` oluşturur.
- **Boşta kalma süresi dolumu** (`session.reset.idleMinutes` veya eski `session.idleMinutes`), boşta kalma penceresinden sonra mesaj geldiğinde yeni bir `sessionId` oluşturur. Günlük + boşta kalma birlikte yapılandırılmışsa önce hangisinin süresi dolarsa o kazanır.
- **Sistem olayları** (Heartbeat, Cron uyanmaları, exec bildirimleri, gateway muhasebesi) oturum satırını değiştirebilir ama günlük/boşta kalma sıfırlama tazeliğini uzatmaz. Sıfırlama devri, yeni istem oluşturulmadan önce önceki oturum için sıraya alınmış sistem olay bildirilerini atar.
- **İş parçacığı üst ebeveyn çatal koruması** (`session.parentForkMaxTokens`, varsayılan `100000`), üst oturum dökümü zaten çok büyükse ebeveyn dökümünü çatallamayı atlar; yeni iş parçacığı taze başlar. Devre dışı bırakmak için `0` ayarlayın.

Uygulama ayrıntısı: karar `src/auto-reply/reply/session.ts` içindeki `initSessionState()` içinde verilir.

---

## Oturum deposu şeması (`sessions.json`)

Deponun değer türü `src/config/sessions.ts` içindeki `SessionEntry` türüdür.

Temel alanlar (tam liste değildir):

- `sessionId`: geçerli döküm kimliği (`sessionFile` ayarlanmamışsa dosya adı bundan türetilir)
- `sessionStartedAt`: geçerli `sessionId` için başlangıç zaman damgası; günlük sıfırlama
  tazeliği bunu kullanır. Eski satırlar bunu JSONL oturum başlığından türetebilir.
- `lastInteractionAt`: son gerçek kullanıcı/kanal etkileşimi zaman damgası; boşta kalma sıfırlama
  tazeliği bunu kullanır, böylece Heartbeat, Cron ve exec olayları oturumları canlı
  tutmaz. Bu alanı olmayan eski satırlar, boşta kalma tazeliği için kurtarılan oturum başlangıç
  zamanına geri döner.
- `updatedAt`: son depo-satırı değişim zaman damgası; listeleme, budama ve
  muhasebe için kullanılır. Günlük/boşta kalma sıfırlama tazeliği için yetkili alan bu değildir.
- `sessionFile`: isteğe bağlı açık döküm yolu geçersiz kılması
- `chatType`: `direct | group | room` (UI'lara ve gönderme ilkesine yardımcı olur)
- `provider`, `subject`, `room`, `space`, `displayName`: grup/kanal etiketleme için meta veriler
- Geçişler:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (oturum başına geçersiz kılma)
- Model seçimi:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token sayaçları (en iyi çaba / sağlayıcıya bağlı):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: bu oturum anahtarı için otomatik Compaction'ın kaç kez tamamlandığı
- `memoryFlushAt`: son Compaction öncesi bellek boşaltmasının zaman damgası
- `memoryFlushCompactionCount`: son boşaltmanın çalıştığı andaki Compaction sayısı

Depoyu düzenlemek güvenlidir, ancak yetkili olan Gateway'dir: oturumlar çalıştıkça girdileri yeniden yazabilir veya yeniden hidrate edebilir.

---

## Döküm yapısı (`*.jsonl`)

Dökümler, `@mariozechner/pi-coding-agent` içindeki `SessionManager` tarafından yönetilir.

Dosya JSONL'dir:

- İlk satır: oturum başlığı (`type: "session"`, `id`, `cwd`, `timestamp`, isteğe bağlı `parentSession` içerir)
- Sonra: `id` + `parentId` içeren oturum girdileri (ağaç)

Dikkat çekici girdi türleri:

- `message`: kullanıcı/yardımcı/`toolResult` mesajları
- `custom_message`: model bağlamına _giren_ uzantı enjekte mesajlar (UI'dan gizlenebilir)
- `custom`: model bağlamına girmeyen uzantı durumu
- `compaction`: `firstKeptEntryId` ve `tokensBefore` ile kalıcı Compaction özeti
- `branch_summary`: ağaç dalında gezinirken kalıcı özet

OpenClaw dökümleri kasıtlı olarak **düzeltmez**; Gateway bunları okumak/yazmak için `SessionManager` kullanır.

---

## Bağlam pencereleri ve izlenen token'lar

İki farklı kavram önemlidir:

1. **Model bağlam penceresi**: model başına sert üst sınır (modele görünür token'lar)
2. **Oturum deposu sayaçları**: `sessions.json` içine yazılan kayan istatistikler (`/status` ve panolar için kullanılır)

Sınırları ayarlıyorsanız:

- Bağlam penceresi model kataloğundan gelir (ve yapılandırma ile geçersiz kılınabilir).
- Depodaki `contextTokens` çalışma zamanı tahmini/raporlama değeridir; bunu katı bir garanti olarak değerlendirmeyin.

Daha fazlası için bkz. [/token-use](/tr/reference/token-use).

---

## Compaction: nedir

Compaction, eski konuşmayı döküm içinde kalıcı bir `compaction` girdisine özetler ve son mesajları bozulmadan tutar.

Compaction sonrasında gelecekteki turlar şunları görür:

- Compaction özeti
- `firstKeptEntryId` sonrasındaki mesajlar

Compaction **kalıcıdır** (oturum budamadan farklı olarak). Bkz. [/concepts/session-pruning](/tr/concepts/session-pruning).

## Compaction parça sınırları ve araç eşleştirme

OpenClaw uzun bir dökümü Compaction parçalarına böldüğünde,
yardımcı araç çağrılarını eşleşen `toolResult` girdileriyle eşli tutar.

- Token-paylaşım bölmesi bir araç çağrısı ile sonucu arasına denk gelirse OpenClaw
  çifti ayırmak yerine sınırı yardımcı araç-çağrısı mesajına kaydırır.
- Sondaki bir tool-result bloğu parçayı hedefin üstüne taşıyacaksa
  OpenClaw o bekleyen araç bloğunu korur ve özetlenmemiş kuyruğu olduğu gibi bırakır.
- İptal edilmiş/hatalı araç-çağrısı blokları bekleyen bölmeyi açık tutmaz.

---

## Otomatik Compaction ne zaman olur (Pi çalışma zamanı)

Gömülü Pi ajanında otomatik Compaction iki durumda tetiklenir:

1. **Taşma kurtarma**: model bir bağlam taşması hatası döndürür
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` ve benzer sağlayıcı biçimli varyantlar) → compact → yeniden dene.
2. **Eşik bakımı**: başarılı bir turdan sonra, şu durumda:

`contextTokens > contextWindow - reserveTokens`

Burada:

- `contextWindow`, modelin bağlam penceresidir
- `reserveTokens`, istemler + sonraki model çıktısı için ayrılan baş boşluktur

Bunlar Pi çalışma zamanı semantikidir (OpenClaw olayları tüketir, ancak ne zaman compact yapılacağına Pi karar verir).

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

OpenClaw, gömülü çalıştırmalar için ayrıca bir güvenlik tabanı uygular:

- `compaction.reserveTokens < reserveTokensFloor` ise OpenClaw bunu yükseltir.
- Varsayılan taban `20000` token'dır.
- Tabanı devre dışı bırakmak için `agents.defaults.compaction.reserveTokensFloor: 0` ayarlayın.
- Zaten daha yüksekse OpenClaw buna dokunmaz.
- Elle `/compact`, açık bir `agents.defaults.compaction.keepRecentTokens`
  değerine uyar ve Pi'nin son kuyruğu kesme noktasını korur. Açık bir tutma bütçesi yoksa
  elle Compaction sert bir kontrol noktası olarak kalır ve yeniden kurulan bağlam
  yeni özetten başlar.

Neden: Compaction kaçınılmaz hale gelmeden önce çok turlu “bakım işleri” (bellek yazımları gibi) için yeterli baş boşluk bırakmak.

Uygulama: `src/agents/pi-settings.ts` içindeki `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts` içinden çağrılır).

---

## Takılabilir Compaction sağlayıcıları

Plugin'ler Plugin API üzerinde `registerCompactionProvider()` aracılığıyla bir Compaction sağlayıcısı kaydedebilir. `agents.defaults.compaction.provider`, kayıtlı bir sağlayıcı kimliğine ayarlandığında koruma uzantısı özetlemeyi yerleşik `summarizeInStages` hattı yerine o sağlayıcıya devreder.

- `provider`: kayıtlı bir Compaction sağlayıcı Plugin'inin kimliği. Varsayılan LLM özetlemesi için boş bırakın.
- Bir `provider` ayarlamak `mode: "safeguard"` zorlar.
- Sağlayıcılar, yerleşik yol ile aynı Compaction yönergelerini ve tanımlayıcı-koruma ilkesini alır.
- Koruma mekanizması, sağlayıcı çıktısından sonra yine son tur ve bölünmüş tur son ek bağlamını korur.
- Yerleşik koruma özetlemesi, önceki özeti aynen korumak yerine önceki özetleri yeni mesajlarla yeniden damıtır.
- Koruma modu, özet kalite denetimlerini varsayılan olarak etkinleştirir; bozuk çıktı sonrası yeniden deneme davranışını atlamak için `qualityGuard.enabled: false` ayarlayın.
- Sağlayıcı başarısız olursa veya boş sonuç döndürürse OpenClaw otomatik olarak yerleşik LLM özetlemesine geri döner.
- Abort/timeout sinyalleri, çağıran iptaline saygı göstermek için yeniden fırlatılır (yutulmaz).

Kaynak: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Kullanıcıya görünen yüzeyler

Compaction ve oturum durumunu şunlar üzerinden gözlemleyebilirsiniz:

- `/status` (herhangi bir sohbet oturumunda)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Ayrıntılı mod: `🧹 Auto-compaction complete` + Compaction sayısı

---

## Sessiz bakım işleri (`NO_REPLY`)

OpenClaw, kullanıcının ara çıktıyı görmemesi gereken arka plan görevleri için “sessiz” turları destekler.

Kural:

- Yardımcı, “kullanıcıya yanıt teslim etme” anlamına gelen tam sessiz belirteç `NO_REPLY` /
  `no_reply` ile çıktısına başlar.
- OpenClaw bunu teslim katmanında temizler/bastırır.
- Tam sessiz belirteç bastırması büyük/küçük harfe duyarsızdır; tüm yük yalnızca sessiz belirteç olduğunda `NO_REPLY` ve
  `no_reply` ikisi de geçerlidir.
- Bu, yalnızca gerçek arka plan/teslimatsız turlar içindir; sıradan uygulanabilir kullanıcı istekleri için kısayol değildir.

`2026.1.10` itibarıyla OpenClaw, bir kısmi parça
`NO_REPLY` ile başlıyorsa **taslak/yazma akışını** da bastırır; böylece sessiz işlemler tur ortasında kısmi
çıktı sızdırmaz.

---

## Compaction öncesi "bellek boşaltma" (uygulandı)

Amaç: otomatik Compaction olmadan önce, kalıcı
durumu diske yazan (ör. ajan çalışma alanındaki `memory/YYYY-MM-DD.md`) sessiz bir ajan turu çalıştırmak; böylece Compaction kritik bağlamı silemesin.

OpenClaw **eşik öncesi boşaltma** yaklaşımını kullanır:

1. Oturum bağlam kullanımını izle.
2. “Yumuşak eşik” aşıldığında (Pi'nin Compaction eşiğinin altında), ajana sessiz
   bir “şimdi belleğe yaz” yönergesi çalıştır.
3. Kullanıcının hiçbir şey görmemesi için tam sessiz belirteç `NO_REPLY` / `no_reply` kullan.

Yapılandırma (`agents.defaults.compaction.memoryFlush`):

- `enabled` (varsayılan: `true`)
- `softThresholdTokens` (varsayılan: `4000`)
- `prompt` (boşaltma turu için kullanıcı mesajı)
- `systemPrompt` (boşaltma turu için eklenen ek sistem istemi)

Notlar:

- Varsayılan prompt/system prompt, teslimatı bastırmak için bir `NO_REPLY` ipucu içerir.
- Boşaltma, Compaction döngüsü başına bir kez çalışır (`sessions.json` içinde izlenir).
- Boşaltma yalnızca gömülü Pi oturumları için çalışır (CLI arka uçları bunu atlar).
- Oturum çalışma alanı salt okunursa boşaltma atlanır (`workspaceAccess: "ro"` veya `"none"`).
- Çalışma alanı dosya düzeni ve yazma desenleri için bkz. [Bellek](/tr/concepts/memory).

Pi ayrıca uzantı API'sinde bir `session_before_compact` hook'u sunar, ancak OpenClaw'ın
boşaltma mantığı bugün Gateway tarafında yaşar.

---

## Sorun giderme denetim listesi

- Oturum anahtarı yanlış mı? [/concepts/session](/tr/concepts/session) ile başlayın ve `/status` içindeki `sessionKey` değerini doğrulayın.
- Depo ve döküm uyuşmuyor mu? Gateway hostunu ve `openclaw status` içindeki depo yolunu doğrulayın.
- Compaction spam'i mi var? Şunları denetleyin:
  - model bağlam penceresi (çok küçük olabilir)
  - Compaction ayarları (model penceresine göre çok yüksek `reserveTokens`, daha erken Compaction'a yol açabilir)
  - araç-sonuç şişmesi: oturum budamayı etkinleştirin/ayarlayın
- Sessiz turlar sızıyor mu? Yanıtın `NO_REPLY` ile başladığını (tam belirteç, büyük/küçük harfe duyarsız) ve akış bastırma düzeltmesini içeren bir derlemede olduğunuzu doğrulayın.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
- [Bağlam motoru](/tr/concepts/context-engine)
