---
read_when:
    - Oturum kimlikleri, transkript JSONL'si veya sessions.json alanlarında hata ayıklamanız gerekiyor
    - Otomatik Compaction davranışını değiştiriyor veya “Compaction öncesi” temizlik ekliyorsunuz
    - Bellek boşaltmalarını veya sessiz sistem turlarını uygulamak istiyorsunuz
summary: 'Derinlemesine inceleme: oturum deposu + transkriptler, yaşam döngüsü ve (otomatik)Compaction iç işleyişi'
title: Oturum yönetimine derinlemesine bakış
x-i18n:
    generated_at: "2026-04-30T09:44:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9785723ebf9b5411440a8f3b2885a50d659f669811ba749c431a2b3aeed700
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw, oturumları bu alanlarda uçtan uca yönetir:

- **Oturum yönlendirme** (gelen iletilerin bir `sessionKey` ile nasıl eşleştiği)
- **Oturum deposu** (`sessions.json`) ve neleri izlediği
- **Döküm kalıcılığı** (`*.jsonl`) ve yapısı
- **Döküm hijyeni** (çalıştırmalardan önce sağlayıcıya özgü düzeltmeler)
- **Bağlam sınırları** (bağlam penceresi ve izlenen token'lar)
- **Compaction** (manuel ve otomatik Compaction) ve Compaction öncesi işlerin nereye bağlanacağı
- **Sessiz bakım** (kullanıcıya görünür çıktı üretmemesi gereken bellek yazımları)

Önce daha üst düzey bir genel bakış istiyorsanız şunlarla başlayın:

- [Oturum yönetimi](/tr/concepts/session)
- [Compaction](/tr/concepts/compaction)
- [Bellek genel bakışı](/tr/concepts/memory)
- [Bellek araması](/tr/concepts/memory-search)
- [Oturum budama](/tr/concepts/session-pruning)
- [Döküm hijyeni](/tr/reference/transcript-hygiene)

---

## Doğruluk kaynağı: Gateway

OpenClaw, oturum durumuna sahip olan tek bir **Gateway işlemi** etrafında tasarlanmıştır.

- UI'lar (macOS uygulaması, web Control UI, TUI) oturum listeleri ve token sayıları için Gateway'i sorgulamalıdır.
- Uzak modda oturum dosyaları uzak ana makinededir; “yerel Mac dosyalarınızı kontrol etmek” Gateway'in kullandığı şeyi yansıtmaz.

---

## İki kalıcılık katmanı

OpenClaw oturumları iki katmanda kalıcı hale getirir:

1. **Oturum deposu (`sessions.json`)**
   - Anahtar/değer haritası: `sessionKey -> SessionEntry`
   - Küçük, değiştirilebilir, düzenlemesi (veya girdileri silmesi) güvenli
   - Oturum meta verilerini izler (geçerli oturum kimliği, son etkinlik, açma/kapatma seçenekleri, token sayaçları vb.)

2. **Döküm (`<sessionId>.jsonl`)**
   - Ağaç yapısına sahip yalnızca eklemeli döküm (girdilerde `id` + `parentId` bulunur)
   - Asıl konuşmayı + araç çağrılarını + Compaction özetlerini depolar
   - Gelecek turlar için model bağlamını yeniden oluşturmakta kullanılır
   - Etkin döküm kontrol noktası boyutu üst sınırını aştığında büyük Compaction öncesi hata ayıklama kontrol noktaları atlanır; böylece ikinci bir dev `.checkpoint.*.jsonl` kopyası önlenir.

---

## Disk üzerindeki konumlar

Gateway ana makinesinde, ajan başına:

- Depo: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Dökümler: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram konu oturumları: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw bunları `src/config/sessions.ts` aracılığıyla çözer.

---

## Depo bakımı ve disk denetimleri

Oturum kalıcılığında `sessions.json`, döküm yapıtları ve trajectory yan dosyaları için otomatik bakım denetimleri (`session.maintenance`) vardır:

- `mode`: `warn` (varsayılan) veya `enforce`
- `pruneAfter`: eski girdi yaş kesimi (varsayılan `30d`)
- `maxEntries`: `sessions.json` içindeki girdiler için üst sınır (varsayılan `500`)
- `resetArchiveRetention`: `*.reset.<timestamp>` döküm arşivleri için saklama süresi (varsayılan: `pruneAfter` ile aynı; `false` temizliği devre dışı bırakır)
- `maxDiskBytes`: isteğe bağlı oturumlar dizini bütçesi
- `highWaterBytes`: temizlik sonrası isteğe bağlı hedef (varsayılan `maxDiskBytes` değerinin `%80`'i)

Normal Gateway yazımları, üretim boyutundaki üst sınırlar için `maxEntries` temizliğini toplu işler; bu nedenle bir depo, bir sonraki yüksek seviye temizliği onu yeniden alt sınıra düşürene kadar yapılandırılmış üst sınırı kısa süreliğine aşabilir. `openclaw sessions cleanup --enforce` yine de yapılandırılmış üst sınırı hemen uygular.

OpenClaw artık Gateway yazımları sırasında otomatik `sessions.json.bak.*` dönüşümlü yedekleri oluşturmaz. Eski `session.maintenance.rotateBytes` anahtarı yok sayılır ve `openclaw doctor --fix` bunu eski yapılandırmalardan kaldırır.

Disk bütçesi temizliği için uygulama sırası (`mode: "enforce"`):

1. Önce en eski arşivlenmiş, sahipsiz döküm veya sahipsiz trajectory yapıtlarını kaldırın.
2. Hâlâ hedefin üzerindeyse en eski oturum girdilerini ve bunların döküm/trajectory dosyalarını çıkarın.
3. Kullanım `highWaterBytes` değerinde veya altında olana kadar devam edin.

`mode: "warn"` içinde OpenClaw olası çıkarmaları raporlar, ancak depoyu/dosyaları değiştirmez.

Bakımı isteğe bağlı çalıştırın:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron oturumları ve çalıştırma günlükleri

Yalıtılmış Cron çalıştırmaları da oturum girdileri/dökümleri oluşturur ve bunlar için özel saklama denetimleri vardır:

- `cron.sessionRetention` (varsayılan `24h`), eski yalıtılmış Cron çalıştırma oturumlarını oturum deposundan budar (`false` devre dışı bırakır).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyalarını budar (varsayılanlar: `2_000_000` bayt ve `2000` satır).

Cron yeni bir yalıtılmış çalıştırma oturumunu zorla oluşturduğunda, yeni satırı yazmadan önce önceki `cron:<jobId>` oturum girdisini temizler. Düşünme/hızlı/ayrıntılı ayarları, etiketler ve açık kullanıcı seçimi model/kimlik doğrulama geçersiz kılmaları gibi güvenli tercihleri taşır. Kanal/grup yönlendirme, gönderme veya kuyruk ilkesi, yükseltme, köken ve ACP çalışma zamanı bağlaması gibi ortam konuşma bağlamını bırakır; böylece yeni bir yalıtılmış çalıştırma, eski bir çalıştırmadan eski teslimat veya çalışma zamanı yetkisini devralamaz.

---

## Oturum anahtarları (`sessionKey`)

Bir `sessionKey`, _hangi konuşma kovasında_ olduğunuzu tanımlar (yönlendirme + yalıtım).

Yaygın kalıplar:

- Ana/doğrudan sohbet (ajan başına): `agent:<agentId>:<mainKey>` (varsayılan `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Oda/kanal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` veya `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (geçersiz kılınmadıkça)

Kurallı kurallar [/concepts/session](/tr/concepts/session) adresinde belgelenmiştir.

---

## Oturum kimlikleri (`sessionId`)

Her `sessionKey`, geçerli bir `sessionId` değerine işaret eder (konuşmayı sürdüren döküm dosyası).

Pratik kurallar:

- **Sıfırlama** (`/new`, `/reset`), bu `sessionKey` için yeni bir `sessionId` oluşturur.
- **Günlük sıfırlama** (varsayılan olarak Gateway ana makinesinde yerel saatle 4:00 AM), sıfırlama sınırından sonraki ilk iletide yeni bir `sessionId` oluşturur.
- **Boşta kalma süresi dolumu** (`session.reset.idleMinutes` veya eski `session.idleMinutes`), boşta kalma penceresinden sonra bir ileti geldiğinde yeni bir `sessionId` oluşturur. Günlük + boşta kalma birlikte yapılandırıldığında önce hangisinin süresi dolarsa o kazanır.
- **Sistem olayları** (Heartbeat, Cron uyandırmaları, exec bildirimleri, Gateway kayıt tutma) oturum satırını değiştirebilir ancak günlük/boşta sıfırlama tazeliğini uzatmaz. Sıfırlama devri, yeni istem oluşturulmadan önce önceki oturum için kuyruktaki sistem olayı bildirimlerini atar.
- **Konu ebeveyn çatallanma koruması** (`session.parentForkMaxTokens`, varsayılan `100000`), ebeveyn oturum zaten çok büyük olduğunda ebeveyn döküm çatallamasını atlar; yeni konu temiz başlar. Devre dışı bırakmak için `0` ayarlayın.

Uygulama ayrıntısı: karar `src/auto-reply/reply/session.ts` içindeki `initSessionState()` içinde verilir.

---

## Oturum deposu şeması (`sessions.json`)

Deponun değer türü `src/config/sessions.ts` içindeki `SessionEntry` türüdür.

Ana alanlar (tam liste değildir):

- `sessionId`: geçerli döküm kimliği (`sessionFile` ayarlanmadıkça dosya adı bundan türetilir)
- `sessionStartedAt`: geçerli `sessionId` için başlangıç zaman damgası; günlük sıfırlama tazeliği bunu kullanır. Eski satırlar bunu JSONL oturum başlığından türetebilir.
- `lastInteractionAt`: son gerçek kullanıcı/kanal etkileşimi zaman damgası; boşta sıfırlama tazeliği bunu kullanır, böylece Heartbeat, Cron ve exec olayları oturumları canlı tutmaz. Bu alanı olmayan eski satırlar, boşta tazeliği için kurtarılan oturum başlangıç zamanına geri döner.
- `updatedAt`: listeleme, budama ve kayıt tutma için kullanılan son depo satırı değişiklik zaman damgası. Günlük/boşta sıfırlama tazeliği için yetkili kaynak değildir.
- `sessionFile`: isteğe bağlı açık döküm yolu geçersiz kılma
- `chatType`: `direct | group | room` (UI'lara ve gönderme ilkesine yardımcı olur)
- `provider`, `subject`, `room`, `space`, `displayName`: grup/kanal etiketleme için meta veriler
- Açma/kapatma seçenekleri:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (oturum başına geçersiz kılma)
- Model seçimi:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token sayaçları (en iyi çaba / sağlayıcıya bağlı):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: bu oturum anahtarı için otomatik Compaction'ın kaç kez tamamlandığı
- `memoryFlushAt`: son Compaction öncesi bellek boşaltımı için zaman damgası
- `memoryFlushCompactionCount`: son boşaltım çalıştığında Compaction sayısı

Depoyu düzenlemek güvenlidir, ancak Gateway yetkili kaynaktır: oturumlar çalışırken girdileri yeniden yazabilir veya yeniden oluşturabilir.

---

## Döküm yapısı (`*.jsonl`)

Dökümler `@mariozechner/pi-coding-agent`'ın `SessionManager` bileşeni tarafından yönetilir.

Dosya JSONL'dir:

- İlk satır: oturum başlığı (`type: "session"`, `id`, `cwd`, `timestamp`, isteğe bağlı `parentSession` içerir)
- Sonra: `id` + `parentId` içeren oturum girdileri (ağaç)

Dikkate değer girdi türleri:

- `message`: kullanıcı/asistan/toolResult iletileri
- `custom_message`: model bağlamına giren uzantı tarafından enjekte edilmiş iletiler (UI'dan gizlenebilir)
- `custom`: model bağlamına girmeyen uzantı durumu
- `compaction`: `firstKeptEntryId` ve `tokensBefore` içeren kalıcı Compaction özeti
- `branch_summary`: bir ağaç dalında gezinirken kalıcı özet

OpenClaw dökümleri bilerek “düzeltmez”; Gateway bunları okumak/yazmak için `SessionManager` kullanır.

---

## Bağlam pencereleri ve izlenen token'lar

İki farklı kavram önemlidir:

1. **Model bağlam penceresi**: model başına katı üst sınır (modele görünür token'lar)
2. **Oturum deposu sayaçları**: `sessions.json` içine yazılan kayan istatistikler (/status ve panolar için kullanılır)

Sınırları ayarlıyorsanız:

- Bağlam penceresi model kataloğundan gelir (ve yapılandırma üzerinden geçersiz kılınabilir).
- Depodaki `contextTokens`, çalışma zamanı tahmini/raporlama değeridir; bunu katı bir garanti olarak değerlendirmeyin.

Daha fazla bilgi için bkz. [/token-use](/tr/reference/token-use).

---

## Compaction: nedir

Compaction, eski konuşmayı dökümde kalıcı bir `compaction` girdisine özetler ve son iletileri olduğu gibi tutar.

Compaction sonrasında gelecek turlar şunları görür:

- Compaction özeti
- `firstKeptEntryId` sonrasındaki iletiler

Compaction **kalıcıdır** (oturum budamanın aksine). Bkz. [/concepts/session-pruning](/tr/concepts/session-pruning).

## Compaction parça sınırları ve araç eşleştirme

OpenClaw uzun bir dökümü Compaction parçalarına böldüğünde, asistan araç çağrılarını eşleşen `toolResult` girdileriyle birlikte tutar.

- Token payı bölmesi bir araç çağrısı ile sonucu arasına denk gelirse OpenClaw, çifti ayırmak yerine sınırı asistan araç çağrısı iletisine kaydırır.
- Sondaki bir araç sonucu bloğu aksi halde parçayı hedefin üzerine çıkaracaksa OpenClaw, bekleyen araç bloğunu korur ve özetlenmemiş kuyruğu olduğu gibi tutar.
- İptal edilmiş/hatalı araç çağrısı blokları bekleyen bir bölmeyi açık tutmaz.

---

## Otomatik Compaction ne zaman gerçekleşir (Pi çalışma zamanı)

Gömülü Pi ajanında otomatik Compaction iki durumda tetiklenir:

1. **Taşma kurtarma**: model bir bağlam taşma hatası döndürür
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` ve benzer sağlayıcı biçimli varyantlar) → compact → retry.
2. **Eşik bakımı**: başarılı bir turdan sonra, şu olduğunda:

`contextTokens > contextWindow - reserveTokens`

Burada:

- `contextWindow` modelin bağlam penceresidir
- `reserveTokens`, istemler + sonraki model çıktısı için ayrılmış paydır

Bunlar Pi çalışma zamanı semantik değerleridir (OpenClaw olayları tüketir, ancak ne zaman Compaction yapılacağına Pi karar verir).

OpenClaw, `agents.defaults.compaction.maxActiveTranscriptBytes` ayarlandığında ve etkin döküm dosyası bu boyuta ulaştığında sonraki çalıştırmayı açmadan önce bir ön uçuş yerel Compaction da tetikleyebilir. Bu, yerel yeniden açma maliyeti için bir dosya boyutu korumasıdır, ham arşivleme değildir: OpenClaw yine normal semantik Compaction çalıştırır ve sıkıştırılmış özetin yeni bir ardıl döküm haline gelebilmesi için `truncateAfterCompaction` gerektirir.

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

OpenClaw, gömülü çalıştırmalar için bir güvenlik alt sınırı da uygular:

- Eğer `compaction.reserveTokens < reserveTokensFloor` ise OpenClaw bunu yükseltir.
- Varsayılan alt sınır `20000` token'dır.
- Alt sınırı devre dışı bırakmak için `agents.defaults.compaction.reserveTokensFloor: 0` ayarlayın.
- Zaten daha yüksekse, OpenClaw ona dokunmaz.
- Manuel `/compact`, açıkça belirtilmiş bir `agents.defaults.compaction.keepRecentTokens`
  değerine uyar ve Pi'nin son kuyruk kesim noktasını korur. Açık bir koruma bütçesi olmadan,
  manuel Compaction katı bir kontrol noktası olarak kalır ve yeniden oluşturulan bağlam
  yeni özetten başlar.
- Etkin transkript büyüdüğünde bir turdan önce yerel Compaction çalıştırmak için
  `agents.defaults.compaction.maxActiveTranscriptBytes` değerini bayt değeri veya
  `"20mb"` gibi bir dize olarak ayarlayın. Bu koruma yalnızca
  `truncateAfterCompaction` da etkin olduğunda aktiftir. Devre dışı bırakmak için
  ayarlamadan bırakın veya `0` olarak ayarlayın.
- `agents.defaults.compaction.truncateAfterCompaction` etkinleştirildiğinde,
  OpenClaw Compaction sonrasında etkin transkripti sıkıştırılmış bir ardıl JSONL'ye
  döndürür. Eski tam transkript yerinde yeniden yazılmak yerine arşivlenmiş olarak
  kalır ve Compaction kontrol noktasından bağlanır.

Neden: Compaction kaçınılmaz hale gelmeden önce çok turlu “temizlik” işleri (bellek yazmaları gibi) için yeterli alan bırakmak.

Uygulama: `src/agents/pi-settings.ts` içindeki `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts` tarafından çağrılır).

---

## Takılabilir Compaction sağlayıcıları

Plugin'ler, plugin API'sindeki `registerCompactionProvider()` üzerinden bir Compaction sağlayıcısı kaydedebilir. `agents.defaults.compaction.provider` kayıtlı bir sağlayıcı kimliğine ayarlandığında, safeguard uzantısı özetlemeyi yerleşik `summarizeInStages` işlem hattı yerine bu sağlayıcıya devreder.

- `provider`: kayıtlı bir Compaction sağlayıcı Plugin kimliği. Varsayılan LLM özetlemesi için ayarlamadan bırakın.
- Bir `provider` ayarlamak `mode: "safeguard"` değerini zorunlu kılar.
- Sağlayıcılar, yerleşik yol ile aynı Compaction yönergelerini ve tanımlayıcı koruma politikasını alır.
- Safeguard, sağlayıcı çıktısından sonra da son tur ve bölünmüş tur sonek bağlamını korur.
- Yerleşik safeguard özetlemesi, tam önceki özeti birebir korumak yerine
  önceki özetleri yeni mesajlarla yeniden damıtır.
- Safeguard modu, özet kalite denetimlerini varsayılan olarak etkinleştirir; hatalı biçimlendirilmiş çıktıda yeniden deneme davranışını atlamak için
  `qualityGuard.enabled: false` ayarlayın.
- Sağlayıcı başarısız olursa veya boş bir sonuç döndürürse, OpenClaw otomatik olarak yerleşik LLM özetlemesine geri döner.
- Çağıranın iptalini gözetmek için durdurma/zaman aşımı sinyalleri yeniden fırlatılır (yutulmaz).

Kaynak: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Kullanıcının görebildiği yüzeyler

Compaction ve oturum durumunu şu yollarla gözlemleyebilirsiniz:

- `/status` (herhangi bir sohbet oturumunda)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Ayrıntılı mod: `🧹 Auto-compaction complete` + Compaction sayısı

---

## Sessiz temizlik (`NO_REPLY`)

OpenClaw, kullanıcının ara çıktıyı görmemesi gereken arka plan görevleri için “sessiz” turları destekler.

Kural:

- Asistan, “kullanıcıya yanıt iletme” anlamına gelmesi için çıktısını tam sessiz token olan `NO_REPLY` /
  `no_reply` ile başlatır.
- OpenClaw bunu teslim katmanında çıkarır/bastırır.
- Tam sessiz token bastırma büyük/küçük harfe duyarsızdır; bu nedenle tüm yük yalnızca sessiz token olduğunda hem `NO_REPLY` hem de
  `no_reply` geçerli sayılır.
- Bu yalnızca gerçek arka plan/teslimatsız turlar içindir; sıradan eyleme geçirilebilir kullanıcı istekleri için bir kısayol değildir.

`2026.1.10` itibarıyla OpenClaw, kısmi bir parça `NO_REPLY` ile başladığında
**taslak/yazıyor akışını** da bastırır; böylece sessiz işlemler tur ortasında
kısmi çıktı sızdırmaz.

---

## Compaction öncesi "bellek temizleme" (uygulandı)

Hedef: otomatik Compaction gerçekleşmeden önce, dayanıklı durumu diske yazan sessiz bir agentic tur çalıştırmak
(ör. agent çalışma alanında `memory/YYYY-MM-DD.md`) ve böylece Compaction'ın
kritik bağlamı silememesini sağlamak.

OpenClaw **ön eşik temizleme** yaklaşımını kullanır:

1. Oturum bağlamı kullanımını izleyin.
2. Bir “yumuşak eşiği” geçtiğinde (Pi'nin Compaction eşiğinin altında), agent'a sessiz
   bir “belleği şimdi yaz” yönergesi çalıştırın.
3. Kullanıcının hiçbir şey görmemesi için tam sessiz token olan `NO_REPLY` / `no_reply` kullanın.

Yapılandırma (`agents.defaults.compaction.memoryFlush`):

- `enabled` (varsayılan: `true`)
- `model` (temizleme turu için isteğe bağlı tam sağlayıcı/model geçersiz kılması, örneğin `ollama/qwen3:8b`)
- `softThresholdTokens` (varsayılan: `4000`)
- `prompt` (temizleme turu için kullanıcı mesajı)
- `systemPrompt` (temizleme turu için eklenen ekstra sistem prompt'u)

Notlar:

- Varsayılan prompt/sistem prompt'u, teslimi bastırmak için bir `NO_REPLY` ipucu içerir.
- `model` ayarlandığında, temizleme turu etkin oturum geri dönüş zincirini devralmadan bu modeli kullanır; böylece yalnızca yerel temizlik işleri sessizce ücretli bir konuşma modeline geri dönmez.
- Temizleme, Compaction döngüsü başına bir kez çalışır (`sessions.json` içinde izlenir).
- Temizleme yalnızca gömülü Pi oturumları için çalışır (CLI backend'leri bunu atlar).
- Oturum çalışma alanı salt okunur olduğunda (`workspaceAccess: "ro"` veya `"none"`) temizleme atlanır.
- Çalışma alanı dosya düzeni ve yazma kalıpları için [Bellek](/tr/concepts/memory) bölümüne bakın.

Pi, uzantı API'sinde bir `session_before_compact` hook'u da sunar, ancak OpenClaw'ın
temizleme mantığı bugün Gateway tarafında yaşar.

---

## Sorun giderme kontrol listesi

- Oturum anahtarı yanlış mı? [/concepts/session](/tr/concepts/session) ile başlayın ve `/status` içindeki `sessionKey` değerini doğrulayın.
- Depo ile transkript uyuşmuyor mu? `openclaw status` çıktısından Gateway ana makinesini ve depo yolunu doğrulayın.
- Compaction spam'i mi var? Şunları kontrol edin:
  - model bağlam penceresi (çok küçük)
  - Compaction ayarları (`reserveTokens` model penceresi için çok yüksekse daha erken Compaction'a neden olabilir)
  - araç sonucu şişmesi: oturum budamayı etkinleştirin/ayarlayın
- Sessiz turlar sızıyor mu? Yanıtın `NO_REPLY` ile başladığını (büyük/küçük harfe duyarsız tam token) ve akış bastırma düzeltmesini içeren bir derlemede olduğunuzu doğrulayın.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
- [Bağlam motoru](/tr/concepts/context-engine)
