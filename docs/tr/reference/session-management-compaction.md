---
read_when:
    - Oturum kimliklerini, transkript JSONL'yi veya sessions.json alanlarını hata ayıklamanız gerekiyor
    - Otomatik Compaction davranışını değiştiriyor veya “Compaction öncesi” bakım ekliyorsunuz
    - Bellek boşaltmaları veya sessiz sistem turları uygulamak istiyorsunuz
summary: 'Derin inceleme: oturum deposu + transkriptler, yaşam döngüsü ve (otomatik) Compaction iç yapıları'
title: Oturum yönetimine derinlemesine bakış
x-i18n:
    generated_at: "2026-04-24T09:30:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e236840ebf9d4980339c801c1ecb70a7f413ea18987400ac47db0818b5cab8c
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Oturum Yönetimi ve Compaction (Derin İnceleme)

Bu belge, OpenClaw'ın oturumları uçtan uca nasıl yönettiğini açıklar:

- **Oturum yönlendirme** (gelen mesajların bir `sessionKey` değerine nasıl eşlendiği)
- **Oturum deposu** (`sessions.json`) ve neleri izlediği
- **Transkript kalıcılığı** (`*.jsonl`) ve yapısı
- **Transkript hijyeni** (çalıştırmalardan önce sağlayıcıya özgü düzeltmeler)
- **Bağlam sınırları** (bağlam penceresi ile izlenen token'lar)
- **Compaction** (elle + otomatik Compaction) ve Compaction öncesi işleri nereye bağlayacağınız
- **Sessiz bakım işleri** (örneğin kullanıcıya görünür çıktı üretmemesi gereken bellek yazımları)

Önce daha üst düzey bir genel bakış istiyorsanız şuradan başlayın:

- [/concepts/session](/tr/concepts/session)
- [/concepts/compaction](/tr/concepts/compaction)
- [/concepts/memory](/tr/concepts/memory)
- [/concepts/memory-search](/tr/concepts/memory-search)
- [/concepts/session-pruning](/tr/concepts/session-pruning)
- [/reference/transcript-hygiene](/tr/reference/transcript-hygiene)

---

## Doğruluk kaynağı: Gateway

OpenClaw, oturum durumunu sahiplenen tek bir **Gateway süreci** etrafında tasarlanmıştır.

- UI'ler (macOS uygulaması, web Control UI, TUI), oturum listeleri ve token sayıları için Gateway'i sorgulamalıdır.
- Uzak modda oturum dosyaları uzak host üzerindedir; “yerel Mac dosyalarınızı kontrol etmek”, Gateway'in ne kullandığını yansıtmaz.

---

## İki kalıcılık katmanı

OpenClaw oturumları iki katmanda kalıcılaştırır:

1. **Oturum deposu (`sessions.json`)**
   - Anahtar/değer eşlemesi: `sessionKey -> SessionEntry`
   - Küçük, değiştirilebilir, düzenlemesi güvenli (veya girdileri silmek güvenli)
   - Oturum meta verilerini izler (geçerli oturum kimliği, son etkinlik, geçişler, token sayaçları vb.)

2. **Transkript (`<sessionId>.jsonl`)**
   - Ağaç yapılı, yalnızca eklemeli transkript (`id` + `parentId` bağlantılarına sahip girdiler)
   - Gerçek konuşmayı + araç çağrılarını + Compaction özetlerini saklar
   - Gelecekteki turlar için model bağlamını yeniden oluşturmakta kullanılır

---

## Disk üzerindeki konumlar

Gateway host üzerinde, ajan başına:

- Depo: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkriptler: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram konu oturumları: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw bunları `src/config/sessions.ts` üzerinden çözümler.

---

## Depo bakımı ve disk denetimleri

Oturum kalıcılığının, `sessions.json` ve transkript varlıkları için otomatik bakım denetimleri (`session.maintenance`) vardır:

- `mode`: `warn` (varsayılan) veya `enforce`
- `pruneAfter`: eski girdi yaşı kesimi (varsayılan `30d`)
- `maxEntries`: `sessions.json` içindeki girdi üst sınırı (varsayılan `500`)
- `rotateBytes`: `sessions.json` aşırı büyüdüğünde döndür (varsayılan `10mb`)
- `resetArchiveRetention`: `*.reset.<timestamp>` transkript arşivleri için saklama süresi (varsayılan: `pruneAfter` ile aynı; `false` temizlik işlemini devre dışı bırakır)
- `maxDiskBytes`: isteğe bağlı oturumlar dizini bütçesi
- `highWaterBytes`: temizleme sonrası isteğe bağlı hedef (varsayılan `maxDiskBytes` değerinin `%80`'i)

Disk bütçesi temizliği için uygulama sırası (`mode: "enforce"`):

1. Önce en eski arşivlenmiş veya sahipsiz transkript varlıklarını kaldır.
2. Hâlâ hedefin üzerindeyse en eski oturum girdilerini ve transkript dosyalarını çıkar.
3. Kullanım `highWaterBytes` değerine eşit veya daha düşük olana kadar devam et.

`mode: "warn"` modunda OpenClaw olası çıkarmaları bildirir ama depoyu/dosyaları değiştirmez.

İstendiğinde bakım çalıştırın:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron oturumları ve çalıştırma günlükleri

Yalıtılmış Cron çalıştırmaları da oturum girdileri/transkriptler oluşturur ve bunların özel saklama denetimleri vardır:

- `cron.sessionRetention` (varsayılan `24h`), eski yalıtılmış Cron çalıştırma oturumlarını oturum deposundan budar (`false` devre dışı bırakır).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyalarını budar (varsayılanlar: `2_000_000` bayt ve `2000` satır).

---

## Oturum anahtarları (`sessionKey`)

Bir `sessionKey`, hangi konuşma kovasında bulunduğunuzu tanımlar (yönlendirme + yalıtım).

Yaygın desenler:

- Ana/doğrudan sohbet (ajan başına): `agent:<agentId>:<mainKey>` (varsayılan `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Oda/kanal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` veya `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (geçersiz kılınmadıkça)

Kanonik kurallar [/concepts/session](/tr/concepts/session) altında belgelenmiştir.

---

## Oturum kimlikleri (`sessionId`)

Her `sessionKey`, geçerli bir `sessionId` işaret eder (konuşmayı sürdüren transkript dosyası).

Temel kurallar:

- **Sıfırlama** (`/new`, `/reset`) bu `sessionKey` için yeni bir `sessionId` oluşturur.
- **Günlük sıfırlama** (varsayılan olarak gateway host'un yerel saatine göre sabah 4:00) sıfırlama sınırından sonraki ilk mesajda yeni bir `sessionId` oluşturur.
- **Boşta kalma sonu** (`session.reset.idleMinutes` veya eski `session.idleMinutes`) bir mesaj boşta kalma penceresinden sonra geldiğinde yeni bir `sessionId` oluşturur. Günlük + boşta kalma birlikte yapılandırıldığında önce hangisi dolarsa o kazanır.
- **Konu üst fork koruması** (`session.parentForkMaxTokens`, varsayılan `100000`), üst oturum transkripti zaten çok büyük olduğunda üst transkript forking'ini atlar; yeni konu sıfırdan başlar. Devre dışı bırakmak için `0` ayarlayın.

Uygulama ayrıntısı: karar `src/auto-reply/reply/session.ts` içindeki `initSessionState()` içinde verilir.

---

## Oturum deposu şeması (`sessions.json`)

Depo değer türü `src/config/sessions.ts` içindeki `SessionEntry` yapısıdır.

Temel alanlar (tam liste değil):

- `sessionId`: geçerli transkript kimliği (`sessionFile` ayarlı değilse dosya adı bundan türetilir)
- `updatedAt`: son etkinlik zaman damgası
- `sessionFile`: isteğe bağlı açık transkript yolu geçersiz kılması
- `chatType`: `direct | group | room` (UI'lere ve gönderim politikasına yardımcı olur)
- `provider`, `subject`, `room`, `space`, `displayName`: grup/kanal etiketlemesi için meta veriler
- Geçişler:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (oturum başına geçersiz kılma)
- Model seçimi:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token sayaçları (best-effort / sağlayıcıya bağlı):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: bu oturum anahtarı için otomatik Compaction'ın kaç kez tamamlandığı
- `memoryFlushAt`: son Compaction öncesi bellek boşaltmasının zaman damgası
- `memoryFlushCompactionCount`: son boşaltma çalıştığında Compaction sayısı

Depoyu düzenlemek güvenlidir, ancak oturumlar çalışırken Gateway otoritedir: girdileri yeniden yazabilir veya yeniden doldurabilir.

---

## Transkript yapısı (`*.jsonl`)

Transkriptler, `@mariozechner/pi-coding-agent` paketinin `SessionManager` yapısı tarafından yönetilir.

Dosya JSONL biçimindedir:

- İlk satır: oturum başlığı (`type: "session"`, `id`, `cwd`, `timestamp`, isteğe bağlı `parentSession` içerir)
- Sonra: `id` + `parentId` içeren oturum girdileri (ağaç)

Önemli girdi türleri:

- `message`: kullanıcı/asistan/toolResult mesajları
- `custom_message`: model bağlamına **giren** uzantı enjekte edilmiş mesajlar (UI'den gizlenebilir)
- `custom`: model bağlamına girmeyen uzantı durumu
- `compaction`: `firstKeptEntryId` ve `tokensBefore` ile kalıcılaştırılmış Compaction özeti
- `branch_summary`: ağaç dalında gezinirken kalıcılaştırılmış özet

OpenClaw kasıtlı olarak transkriptleri **düzeltmez**; Gateway bunları okumak/yazmak için `SessionManager` kullanır.

---

## Bağlam pencereleri ile izlenen token'lar

İki farklı kavram önemlidir:

1. **Model bağlam penceresi**: model başına katı üst sınır (modele görünür token'lar)
2. **Oturum deposu sayaçları**: `sessions.json` içine yazılan döner istatistikler (`/status` ve panolar için kullanılır)

Sınırları ayarlıyorsanız:

- Bağlam penceresi model kataloğundan gelir (ve yapılandırma ile geçersiz kılınabilir).
- Depodaki `contextTokens`, çalışma zamanı tahmini/raporlama değeridir; bunu katı garanti olarak değerlendirmeyin.

Daha fazlası için bkz. [/token-use](/tr/reference/token-use).

---

## Compaction: nedir

Compaction, eski konuşmayı transkriptte kalıcı bir `compaction` girdisi olarak özetler ve son mesajları sağlam tutar.

Compaction sonrasında gelecekteki turlar şunları görür:

- Compaction özeti
- `firstKeptEntryId` sonrasındaki mesajlar

Compaction **kalıcıdır** (oturum budamanın aksine). Bkz. [/concepts/session-pruning](/tr/concepts/session-pruning).

## Compaction parça sınırları ve araç eşleştirme

OpenClaw uzun bir transkripti Compaction parçalarına böldüğünde,
asistan araç çağrılarını eşleşen `toolResult` girdileriyle birlikte tutar.

- Token payı bölünmesi bir araç çağrısı ile sonucu arasına denk gelirse OpenClaw
  bu çifti ayırmak yerine sınırı asistan araç çağrısı mesajına kaydırır.
- Sondaki bir tool-result bloğu parçayı hedefin üzerine taşıyacaksa OpenClaw
  bu bekleyen araç bloğunu korur ve özetlenmemiş kuyruğu sağlam tutar.
- İptal edilmiş/hatalı araç çağrısı blokları bekleyen bölmeyi açık tutmaz.

---

## Otomatik Compaction ne zaman olur (Pi çalışma zamanı)

Gömülü Pi ajanında otomatik Compaction iki durumda tetiklenir:

1. **Taşma kurtarma**: model bir bağlam taşması hatası döndürür
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` ve benzeri sağlayıcı biçimli varyantlar) → sıkıştır → yeniden dene.
2. **Eşik bakımı**: başarılı bir turdan sonra, şu durumda:

`contextTokens > contextWindow - reserveTokens`

Burada:

- `contextWindow`, modelin bağlam penceresidir
- `reserveTokens`, istemler + sonraki model çıktısı için ayrılmış boşluktur

Bunlar Pi çalışma zamanı semantikleridir (olayları OpenClaw tüketir, ancak ne zaman sıkıştırılacağına Pi karar verir).

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
- Varsayılan taban `20000` token'dır.
- Tabanı devre dışı bırakmak için `agents.defaults.compaction.reserveTokensFloor: 0` ayarlayın.
- Zaten daha yüksekse OpenClaw ona dokunmaz.

Neden: Compaction kaçınılmaz hâle gelmeden önce çok turlu “bakım işleri” (bellek yazımları gibi) için yeterli boşluğu bırakmak.

Uygulama: `src/agents/pi-settings.ts` içindeki `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts` içinden çağrılır).

---

## Takılabilir Compaction sağlayıcıları

Plugins, Plugin API üzerinde `registerCompactionProvider()` aracılığıyla bir Compaction sağlayıcısı kaydedebilir. `agents.defaults.compaction.provider`, kayıtlı bir sağlayıcı kimliğine ayarlandığında safeguard uzantısı, yerleşik `summarizeInStages` işlem hattı yerine özetlemeyi o sağlayıcıya devreder.

- `provider`: kayıtlı bir Compaction sağlayıcı Plugin kimliği. Varsayılan LLM özetlemesi için boş bırakın.
- Bir `provider` ayarlamak `mode: "safeguard"` zorlar.
- Sağlayıcılar, yerleşik yol ile aynı Compaction yönergelerini ve tanımlayıcı koruma politikasını alır.
- Sağlayıcı çıktısından sonra safeguard yine son tur ve bölünmüş tur son eki bağlamını korur.
- Sağlayıcı başarısız olursa veya boş sonuç döndürürse OpenClaw otomatik olarak yerleşik LLM özetlemesine geri düşer.
- Abort/timeout sinyalleri çağıran iptaline saygı göstermek için yeniden fırlatılır (yutulmaz).

Kaynak: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Kullanıcıya görünür yüzeyler

Compaction ve oturum durumunu şuralardan gözlemleyebilirsiniz:

- `/status` (herhangi bir sohbet oturumunda)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Verbose mod: `🧹 Auto-compaction complete` + Compaction sayısı

---

## Sessiz bakım işleri (`NO_REPLY`)

OpenClaw, kullanıcının ara çıktıları görmemesi gereken arka plan işleri için “sessiz” turları destekler.

Sözleşme:

- Asistan, kullanıcıya yanıt teslim edilmemesi gerektiğini belirtmek için çıktısına tam sessiz belirteç `NO_REPLY` /
  `no_reply` ile başlar.
- OpenClaw bunu teslim katmanında temizler/bastırır.
- Tam sessiz belirteç bastırması büyük/küçük harf duyarsızdır; bu yüzden tüm payload yalnızca sessiz belirteçten oluşuyorsa `NO_REPLY` ve
  `no_reply` ikisi de geçerlidir.
- Bu yalnızca gerçek arka plan/teslim yok turları içindir; olağan eyleme dönük kullanıcı istekleri için
  bir kısayol değildir.

`2026.1.10` itibarıyla OpenClaw, bir
kısmi parça `NO_REPLY` ile başladığında **taslak/yazıyor akışını** da bastırır; böylece sessiz işlemler
tur ortasında kısmi çıktı sızdırmaz.

---

## Compaction öncesi "bellek boşaltması" (uygulandı)

Amaç: otomatik Compaction gerçekleşmeden önce dayanıklı
durumu diske yazan sessiz bir ajanik tur çalıştırmak (örn. ajan çalışma alanındaki `memory/YYYY-MM-DD.md`), böylece Compaction kritik bağlamı
silemesin.

OpenClaw **eşik öncesi boşaltma** yaklaşımını kullanır:

1. Oturum bağlam kullanımını izle.
2. Kullanım bir “yumuşak eşiği” geçtiğinde (Pi'nin Compaction eşiğinin altında), ajana sessiz bir
   “şimdi belleğe yaz” yönergesi çalıştır.
3. Kullanıcının hiçbir şey görmemesi için tam sessiz belirteç `NO_REPLY` / `no_reply` kullan.

Yapılandırma (`agents.defaults.compaction.memoryFlush`):

- `enabled` (varsayılan: `true`)
- `softThresholdTokens` (varsayılan: `4000`)
- `prompt` (boşaltma turu için kullanıcı mesajı)
- `systemPrompt` (boşaltma turu için eklenen ekstra sistem istemi)

Notlar:

- Varsayılan prompt/sistem istemi, teslimi bastırmak için
  bir `NO_REPLY` ipucu içerir.
- Boşaltma, Compaction döngüsü başına bir kez çalışır (`sessions.json` içinde izlenir).
- Boşaltma yalnızca gömülü Pi oturumları için çalışır (CLI backend'leri bunu atlar).
- Oturum çalışma alanı salt okunursa (`workspaceAccess: "ro"` veya `"none"`) boşaltma atlanır.
- Çalışma alanı dosya düzeni ve yazma desenleri için bkz. [Bellek](/tr/concepts/memory).

Pi, uzantı API'sinde bir `session_before_compact` hook'u da açığa çıkarır, ancak OpenClaw'ın
boşaltma mantığı bugün Gateway tarafında yaşar.

---

## Sorun giderme kontrol listesi

- Oturum anahtarı yanlış mı? [/concepts/session](/tr/concepts/session) ile başlayın ve `/status` içindeki `sessionKey` değerini doğrulayın.
- Depo ile transkript uyuşmuyor mu? Gateway host'unu ve `openclaw status` içindeki depo yolunu doğrulayın.
- Compaction spam'i mi var? Şunları kontrol edin:
  - model bağlam penceresi (çok küçük mü)
  - Compaction ayarları (`reserveTokens`, model penceresi için çok yüksekse daha erken Compaction'a neden olabilir)
  - araç sonucu şişmesi: oturum budamayı etkinleştirin/ayarlayın
- Sessiz turlar sızdırıyor mu? Yanıtın `NO_REPLY` ile başladığını (büyük/küçük harf duyarsız tam belirteç) doğrulayın ve akış bastırma düzeltmesini içeren bir yapı kullandığınızdan emin olun.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
- [Bağlam motoru](/tr/concepts/context-engine)
