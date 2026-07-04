---
read_when:
    - Temsilcinin hangi oturum araçlarına sahip olduğunu anlamak istiyorsunuz
    - Kalıcı oturumlar arası erişimi veya alt ajan oluşturmayı yapılandırmak istiyorsunuz
    - Oluşturulan alt ajan durumunu incelemek istiyorsunuz
summary: Çapraz oturum durumu, hatırlama, mesajlaşma ve alt ajan orkestrasyonu için ajan araçları
title: Oturum araçları
x-i18n:
    generated_at: "2026-07-04T20:40:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f344642b8d234984719cc603b4ac8773314a0bffdb0ac7d5a7280e584c5f530
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw, ajanlara oturumlar arasında çalışmak, durumu incelemek ve
alt ajanları düzenlemek için araçlar sağlar.

## Kullanılabilir araçlar

| Araç               | Ne yapar                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | İsteğe bağlı filtrelerle oturumları listeler (tür, etiket, ajan, arşiv, önizleme) |
| `sessions_history` | Belirli bir oturumun konuşma dökümünü okur                                  |
| `sessions_send`    | Başka bir oturuma mesaj gönderir ve isteğe bağlı olarak bekler              |
| `sessions_spawn`   | Arka plan çalışması için yalıtılmış bir alt ajan oturumu başlatır           |
| `sessions_yield`   | Geçerli turu sonlandırır ve takip alt ajan sonuçlarını bekler               |
| `subagents`        | Bu oturum için başlatılan alt ajan durumunu listeler                        |
| `session_status`   | `/status` tarzı bir kart gösterir ve isteğe bağlı olarak oturum başına model geçersiz kılma ayarlar |

Bu araçlar hâlâ etkin araç profiline ve izin/verme-engelleme
politikasına tabidir. `tools.profile: "coding"`, `sessions_spawn`,
`sessions_yield` ve `subagents` dahil olmak üzere tam oturum düzenleme
kümesini içerir. `tools.profile: "messaging"`, oturumlar arası mesajlaşma
araçlarını (`sessions_list`, `sessions_history`, `sessions_send`,
`session_status`) içerir ancak alt ajan başlatmayı içermez. Mesajlaşma
profilini koruyup yine de yerel devretmeye izin vermek için şunu ekleyin:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Grup, sağlayıcı, korumalı alan ve ajan başına politikalar, profil aşamasından
sonra bu araçları yine de kaldırabilir. Etkilenen oturumdan `/tools` kullanarak
etkili araç listesini inceleyin.

## Oturumları listeleme ve okuma

`sessions_list`, oturumları anahtarları, agentId, tür, kanal, model, belirteç
sayıları ve zaman damgalarıyla döndürür. Türe (`main`, `group`, `cron`, `hook`,
`node`), tam `label`, tam `agentId`, arama metni veya güncelliğe
(`activeMinutes`) göre filtreleyin. Etkin oturumlar varsayılan olarak döndürülür;
arşivlenmiş oturumları incelemek için `archived: true` geçin. Satırlar
sabitlenmiş ve arşivlenmiş durumlarını içerir. Posta kutusu tarzı önceliklendirme
gerektiğinde, her satırda görünürlük kapsamlı türetilmiş bir başlık, son mesaj
önizleme parçacığı veya sınırlandırılmış yakın tarihli mesajlar da isteyebilir.
Türetilmiş başlıklar ve önizlemeler yalnızca çağıranın yapılandırılmış oturum
aracı görünürlük politikası kapsamında zaten görebildiği oturumlar için üretilir;
böylece ilgisiz oturumlar gizli kalır. Görünürlük kısıtlandığında,
`sessions_list`, etkili modu gösteren isteğe bağlı `visibility` meta verilerini
ve sonuçların kapsamla sınırlı olabileceğine dair bir uyarıyı döndürür.

`sessions_history`, belirli bir oturum için konuşma dökümünü getirir.
Varsayılan olarak araç sonuçları hariç tutulur; bunları görmek için
`includeTools: true` geçin. En yeni sınırlandırılmış son bölüm için `limit`
kullanın. Sayfalama meta verileri gerektiğinde `offset: 0` geçin, ardından ham
döküm dosyalarını okumadan eski OpenClaw döküm pencerelerinde geriye doğru
sayfalama yapmak için döndürülen `nextOffset` değerlerini geçin.
Açık ofset sayfaları dış CLI yedek içe aktarmalarını birleştirmez; bu
birleştirilmiş görüntüleme geçmişi gerektiğinde varsayılan en yeni son bölüm
görünümünü kullanın.
Döndürülen görünüm kasıtlı olarak sınırlandırılmış ve güvenlik filtresinden
geçirilmiştir:

- asistan metni geri çağırmadan önce normalleştirilir:
  - düşünme etiketleri çıkarılır
  - `<relevant-memories>` / `<relevant_memories>` iskele blokları çıkarılır
  - `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
    `<tool_calls>...</tool_calls>` ve `<function_calls>...</function_calls>`
    gibi düz metin araç çağrısı XML yük blokları, temiz kapanmayan kesilmiş
    yükler dahil olmak üzere çıkarılır
  - `[Tool Call: ...]`, `[Tool Result ...]` ve `[Historical context ...]`
    gibi düşürülmüş araç çağrısı/sonuç iskeleleri çıkarılır
  - `<|assistant|>` gibi sızmış model denetim belirteçleri, diğer ASCII
    `<|...|>` belirteçleri ve tam genişlikli `<｜...｜>` varyantları çıkarılır
  - `<invoke ...>` / `</minimax:tool_call>` gibi hatalı biçimlendirilmiş MiniMax
    araç çağrısı XML'i çıkarılır
- kimlik bilgisi/belirteç benzeri metin döndürülmeden önce redakte edilir
- uzun metin blokları kesilir
- çok büyük geçmişler eski satırları düşürebilir veya aşırı büyük bir satırı
  `[sessions_history omitted: message too large]` ile değiştirebilir
- araç `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`,
  `bytes` gibi özet bayraklarını ve sayfalama meta verilerini raporlar

Her iki araç da önceki bir liste çağrısından gelen bir **oturum anahtarı**
(`"main"` gibi) veya bir **oturum kimliği** kabul eder.

Tam bayt bayt aynı döküm gerekiyorsa, `sessions_history` aracını ham döküm
olarak ele almak yerine diskteki döküm dosyasını inceleyin.

## Oturumlar arası mesaj gönderme

`sessions_send`, başka bir oturuma mesaj teslim eder ve isteğe bağlı olarak
yanıtı bekler:

- **Gönder ve unut:** kuyruğa alıp hemen dönmek için `timeoutSeconds: 0`
  ayarlayın.
- **Yanıtı bekle:** bir zaman aşımı ayarlayın ve yanıtı satır içinde alın.

Slack veya Discord anahtarları `:thread:<id>` ile biten iş parçacığı kapsamlı
sohbet oturumları, geçerli `sessions_send` hedefleri değildir. Ajanlar arası
koordinasyon için üst kanal oturum anahtarını kullanın; böylece araçla yönlendirilen
mesajlar etkin, insanlara dönük bir iş parçacığının içinde görünmez.

Mesajlar ve A2A takip yanıtları, alıcı isteminde
(`[Inter-session message ... isUser=false]`) ve döküm kökeninde oturumlar arası
veri olarak işaretlenir. Alıcı ajan bunları doğrudan son kullanıcı tarafından
yazılmış bir talimat olarak değil, araçla yönlendirilen veri olarak ele almalıdır.

Hedef yanıt verdikten sonra OpenClaw, ajanların sırayla mesajlaştığı bir
**geri yanıt döngüsü** çalıştırabilir (`session.agentToAgent.maxPingPongTurns`
değerine kadar, aralık 0-20, varsayılan 5). Hedef ajan erken durmak için
`REPLY_SKIP` yanıtı verebilir.

## Durum ve düzenleme yardımcıları

`session_status`, geçerli veya başka bir görünür oturum için hafif
`/status` eşdeğeri araçtır. Kullanımı, zamanı, model/çalışma zamanı durumunu ve
varsa bağlantılı arka plan görevi bağlamını raporlar. `/status` gibi, seyrek
belirteç/önbellek sayaçlarını en son döküm kullanım girdisinden geriye dönük
doldurabilir ve `model=default` oturum başına geçersiz kılmayı temizler.
Çağıranın geçerli oturumu için `sessionKey="current"` kullanın; `openclaw-tui`
gibi görünür istemci etiketleri oturum anahtarı değildir.

Rota meta verileri kullanılabilir olduğunda, `session_status` görünür bir
`Route context` JSON bloğu ve eşleşen yapılandırılmış `details` alanları da
içerir. Bu alanlar, oturum anahtarını şu anda canlı çalışmayı işleyen rotadan
ayırt eder:

- `origin`, oturumun oluşturulduğu yerdir veya eski durum saklanan kaynak meta
  verilerinden yoksunsa teslim edilebilir oturum anahtarı önekinden çıkarılan
  sağlayıcıdır.
- `active`, geçerli canlı çalışma rotasıdır. Yalnızca şu anda işlenen canlı veya
  geçerli oturum için raporlanır.
- `deliveryContext`, oturumda saklanan kalıcı teslim rotasıdır; OpenClaw bunu,
  etkin yüzey farklı olduğunda bile daha sonraki teslim için yeniden kullanabilir.

`sessions_yield`, beklediğiniz takip olayının bir sonraki mesaj olabilmesi için
geçerli turu kasıtlı olarak sonlandırır. Alt ajanları başlattıktan sonra tamamlama
sonuçlarının yoklama döngüleri kurmak yerine bir sonraki mesaj olarak gelmesini
istediğinizde kullanın.

`subagents`, zaten başlatılmış OpenClaw alt ajanları için görünürlük yardımcısıdır.
Etkin/yakın tarihli çalışmaları incelemek için `action: "list"` destekler.

## Alt ajanları başlatma

`sessions_spawn`, varsayılan olarak arka plan görevi için yalıtılmış bir oturum
oluşturur. Her zaman engellemesizdir; hemen bir `runId` ve `childSessionKey` ile
döner. Yerel alt ajan çalışmaları devredilen görevi alt oturumun ilk görünür
`[Subagent Task]` mesajında alırken, sistem istemi yalnızca alt ajan çalışma
zamanı kurallarını ve yönlendirme bağlamını taşır.

Temel seçenekler:

- `runtime: "subagent"` (varsayılan) veya harici koşum ajanları için `"acp"`.
- Alt oturum için `model` ve `thinking` geçersiz kılmaları.
- Başlatmayı bir sohbet iş parçacığına (Discord, Slack vb.) bağlamak için
  `thread: true`.
- Alt oturumda korumalı alanı zorunlu kılmak için `sandbox: "require"`.
- Alt oturumun geçerli istekte bulunan dökümüne ihtiyacı olduğunda yerel alt
  ajanlar için `context: "fork"`; temiz bir alt oturum için bunu atlayın veya
  `context: "isolated"` kullanın. İş parçacığına bağlı yerel alt ajanlar,
  `threadBindings.defaultSpawnContext` aksini söylemediği sürece varsayılan
  olarak `context: "fork"` kullanır.

Varsayılan yaprak alt ajanlar oturum araçlarını almaz. `maxSpawnDepth >= 2`
olduğunda, derinlik-1 düzenleyici alt ajanlar kendi alt ajanlarını yönetebilmeleri
için ayrıca `sessions_spawn`, `subagents`, `sessions_list` ve `sessions_history`
alır. Yaprak çalışmalar yine de özyinelemeli düzenleme araçları almaz.

Tamamlandıktan sonra bir duyuru adımı sonucu istekte bulunanın kanalına gönderir.
Tamamlama teslimi, kullanılabilir olduğunda bağlı iş parçacığı/konu yönlendirmesini
korur ve tamamlama kaynağı yalnızca bir kanalı tanımlıyorsa OpenClaw doğrudan
teslim için istekte bulunan oturumun saklanan rotasını (`lastChannel` / `lastTo`)
yine de yeniden kullanabilir.

ACP'ye özgü davranış için bkz. [ACP Ajanları](/tr/tools/acp-agents).

## Görünürlük

Oturum araçları, ajanın ne görebileceğini sınırlamak için kapsama alınır:

| Düzey   | Kapsam                                   |
| ------- | ---------------------------------------- |
| `self`  | Yalnızca geçerli oturum                  |
| `tree`  | Geçerli oturum + başlatılan alt ajanlar  |
| `agent` | Bu ajan için tüm oturumlar               |
| `all`   | Tüm oturumlar (yapılandırılmışsa ajanlar arası) |

Varsayılan `tree` değeridir. Korumalı alanlı oturumlar yapılandırmadan bağımsız
olarak `tree` değerine sıkıştırılır.

## Daha fazla okuma

- [Oturum Yönetimi](/tr/concepts/session) -- yönlendirme, yaşam döngüsü, bakım
- [ACP Ajanları](/tr/tools/acp-agents) -- harici koşum başlatma
- [Çok ajanlı](/tr/concepts/multi-agent) -- çok ajanlı mimari
- [Gateway Yapılandırması](/tr/gateway/configuration) -- oturum aracı yapılandırma düğmeleri

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
