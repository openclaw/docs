---
read_when:
    - Ajanın hangi oturum araçlarına sahip olduğunu anlamak istiyorsunuz
    - Oturumlar arası erişimi veya alt ajan başlatmayı yapılandırmak istiyorsunuz
    - Oluşturulan alt ajan durumunu incelemek istiyorsunuz
summary: Oturumlar arası durum, hatırlama, mesajlaşma ve alt aracı orkestrasyonu için aracı araçları
title: Oturum araçları
x-i18n:
    generated_at: "2026-06-28T00:31:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffc7edf68e4510ea6a5fe93238be32e9d7eacf8e7b49e58f63536c14bbe2da80
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw, ajanlara oturumlar arasında çalışmak, durumu incelemek ve
alt ajanları orkestre etmek için araçlar sağlar.

## Kullanılabilir araçlar

| Araç              | Ne yapar                                                                      |
| ----------------- | ----------------------------------------------------------------------------- |
| `sessions_list`   | İsteğe bağlı filtrelerle oturumları listeler (tür, etiket, ajan, güncellik, önizleme) |
| `sessions_history` | Belirli bir oturumun dökümünü okur                                           |
| `sessions_send`   | Başka bir oturuma mesaj gönderir ve isteğe bağlı olarak bekler                |
| `sessions_spawn`  | Arka plan işi için yalıtılmış bir alt ajan oturumu başlatır                   |
| `sessions_yield`  | Geçerli turu sonlandırır ve takip alt ajan sonuçlarını bekler                 |
| `subagents`       | Bu oturum için başlatılmış alt ajan durumunu listeler                         |
| `session_status`  | `/status` tarzı bir kart gösterir ve isteğe bağlı olarak oturum başına model geçersiz kılması ayarlar |

Bu araçlar hâlâ etkin araç profiline ve izin/verme
politikasına tabidir. `tools.profile: "coding"`, `sessions_spawn`,
`sessions_yield` ve `subagents` dahil tam oturum orkestrasyonu
kümesini içerir. `tools.profile: "messaging"` oturumlar arası mesajlaşma araçlarını
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`) içerir ancak
alt ajan başlatmayı içermez. Bir mesajlaşma profilini koruyup yine de
yerel delegasyona izin vermek için şunu ekleyin:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Grup, sağlayıcı, sandbox ve ajan başına politikalar, profil aşamasından sonra
bu araçları yine de kaldırabilir. Etkilenen oturumdan etkili araç listesini
incelemek için `/tools` kullanın.

## Oturumları listeleme ve okuma

`sessions_list`, oturumları anahtarları, agentId, tür, kanal, model,
token sayıları ve zaman damgalarıyla döndürür. Türe (`main`, `group`, `cron`, `hook`,
`node`), tam `label`, tam `agentId`, arama metni veya güncelliğe
(`activeMinutes`) göre filtreleyin. Posta kutusu tarzı triyaj gerektiğinde, her satırda
görünürlük kapsamlı türetilmiş bir başlık, son mesaj önizleme parçacığı veya sınırlı yakın tarihli
mesajlar da isteyebilir. Türetilmiş başlıklar ve önizlemeler yalnızca
çağıranın yapılandırılmış oturum aracı görünürlük politikası altında zaten görebildiği oturumlar için
üretilir; böylece ilgisiz oturumlar gizli kalır. Görünürlük kısıtlandığında, `sessions_list`
etkili modu gösteren isteğe bağlı `visibility` meta verileri ve sonuçların kapsamla sınırlı olabileceğine dair bir uyarı
döndürür.

`sessions_history`, belirli bir oturumun konuşma dökümünü getirir.
Varsayılan olarak araç sonuçları hariç tutulur; bunları görmek için `includeTools: true` geçirin.
En yeni sınırlı kuyruk için `limit` kullanın. Sayfalandırma meta verilerine ihtiyaç duyduğunuzda
`offset: 0` geçirin, ardından ham döküm dosyalarını okumadan eski OpenClaw döküm pencerelerinde
geriye doğru sayfalama yapmak için döndürülen `nextOffset` değerlerini geçirin.
Açık offset sayfaları harici CLI geri dönüş içe aktarımlarını birleştirmez; bu birleştirilmiş görüntüleme geçmişine ihtiyaç duyduğunuzda
varsayılan en yeni kuyruk görünümünü kullanın.
Döndürülen görünüm kasıtlı olarak sınırlıdır ve güvenlik filtresinden geçirilmiştir:

- asistan metni geri çağırmadan önce normalleştirilir:
  - düşünme etiketleri çıkarılır
  - `<relevant-memories>` / `<relevant_memories>` iskelet blokları çıkarılır
  - `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` ve
    `<function_calls>...</function_calls>` gibi düz metin araç çağrısı XML yük blokları, düzgün kapanmayan kesilmiş
    yükler dahil çıkarılır
  - `[Tool Call: ...]`,
    `[Tool Result ...]` ve `[Historical context ...]` gibi indirgenmiş araç çağrısı/sonuç iskeleti çıkarılır
  - `<|assistant|>` gibi sızmış model kontrol token'ları, diğer ASCII
    `<|...|>` token'ları ve tam genişlikli `<｜...｜>` varyantları çıkarılır
  - `<invoke ...>` /
    `</minimax:tool_call>` gibi hatalı biçimlendirilmiş MiniMax araç çağrısı XML'i çıkarılır
- kimlik bilgisi/token benzeri metin döndürülmeden önce redakte edilir
- uzun metin blokları kısaltılır
- çok büyük geçmişler eski satırları düşürebilir veya aşırı büyük bir satırı
  `[sessions_history omitted: message too large]` ile değiştirebilir
- araç `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, `bytes` gibi özet bayraklarını ve sayfalandırma meta verilerini bildirir

Her iki araç da önceki bir liste çağrısından gelen bir **oturum anahtarı** (`"main"` gibi) veya bir **oturum ID'si**
kabul eder.

Bayt bayt tam döküme ihtiyacınız varsa, `sessions_history`'yi ham döküm olarak ele almak yerine
diskteki döküm dosyasını inceleyin.

## Oturumlar arası mesaj gönderme

`sessions_send`, başka bir oturuma mesaj teslim eder ve isteğe bağlı olarak
yanıtı bekler:

- **Gönder ve unut:** Kuyruğa alıp hemen dönmek için `timeoutSeconds: 0` ayarlayın.
- **Yanıt bekle:** Bir zaman aşımı ayarlayın ve yanıtı satır içi alın.

`:thread:<id>` ile biten Slack veya Discord anahtarları gibi iş parçacığı kapsamlı sohbet oturumları,
geçerli `sessions_send` hedefleri değildir. Araç yönlendirmeli mesajların etkin, insanlara dönük bir iş parçacığı içinde görünmemesi için
ajanlar arası koordinasyonda üst kanal oturum anahtarını kullanın.

Mesajlar ve A2A takip yanıtları, alan isteminde
(`[Inter-session message ... isUser=false]`) ve döküm kökeninde oturumlar arası veri olarak işaretlenir.
Alan ajan bunları doğrudan son kullanıcı tarafından yazılmış bir talimat olarak değil,
araç yönlendirmeli veri olarak ele almalıdır.

Hedef yanıt verdikten sonra OpenClaw, ajanların sırayla mesajlaştığı
(`session.agentToAgent.maxPingPongTurns` değerine kadar, aralık 0-20, varsayılan 5) bir **yanıt geri döngüsü**
çalıştırabilir. Hedef ajan erken durmak için
`REPLY_SKIP` yanıtını verebilir.

## Durum ve orkestrasyon yardımcıları

`session_status`, geçerli veya başka bir görünür oturum için hafif
`/status` eşdeğeri araçtır. Kullanımı, zamanı, model/runtime durumunu ve
varsa bağlantılı arka plan görevi bağlamını bildirir. `/status` gibi, seyrek token/cache sayaçlarını
en son döküm kullanım girdisinden geriye dönük doldurabilir ve
`model=default` oturum başına geçersiz kılmayı temizler. Çağıranın geçerli oturumu için
`sessionKey="current"` kullanın; `openclaw-tui` gibi görünür istemci etiketleri
oturum anahtarı değildir.

Rota meta verileri kullanılabilir olduğunda, `session_status` görünür bir
`Route context` JSON bloğu ve eşleşen yapılandırılmış `details` alanları da içerir. Bu
alanlar oturum anahtarını, canlı çalışmayı şu anda işleyen rotadan ayırt eder:

- `origin`, oturumun oluşturulduğu yerdir veya eski durumda saklanmış köken meta verileri yoksa
  teslim edilebilir oturum anahtarı ön ekinden çıkarılan sağlayıcıdır.
- `active`, geçerli canlı çalışma rotasıdır. Yalnızca şu anda işlenen canlı veya
  geçerli oturum için bildirilir.
- `deliveryContext`, oturumda saklanan kalıcı teslim rotasıdır;
  OpenClaw, etkin yüzey farklı olduğunda bile bunu daha sonraki teslimat için yeniden kullanabilir.

`sessions_yield`, beklediğiniz takip olayının bir sonraki mesaj olabilmesi için
geçerli turu kasıtlı olarak sonlandırır. Alt ajanlar başlattıktan sonra, tamamlama sonuçlarının yoklama döngüleri kurmak yerine
bir sonraki mesaj olarak gelmesini istediğinizde bunu kullanın.

`subagents`, zaten başlatılmış OpenClaw alt ajanları için görünürlük yardımcısıdır.
Etkin/yakın tarihli çalışmaları incelemek için `action: "list"` destekler.

## Alt ajanları başlatma

`sessions_spawn`, varsayılan olarak arka plan görevi için yalıtılmış bir oturum oluşturur.
Her zaman engellemesizdir; hemen bir `runId` ve
`childSessionKey` ile döner. Yerel alt ajan çalışmaları, devredilen görevi
alt oturumun ilk görünür `[Subagent Task]` mesajında alırken sistem
istemi yalnızca alt ajan runtime kurallarını ve yönlendirme bağlamını taşır.

Ana seçenekler:

- `runtime: "subagent"` (varsayılan) veya harici harness ajanları için `"acp"`.
- Alt oturum için `model` ve `thinking` geçersiz kılmaları.
- Başlatmayı bir sohbet iş parçacığına (Discord, Slack vb.) bağlamak için `thread: true`.
- Alt öğede sandbox kullanımını zorunlu kılmak için `sandbox: "require"`.
- Alt öğe geçerli istekte bulunan dökümüne ihtiyaç duyduğunda yerel alt ajanlar için `context: "fork"`;
  temiz bir alt öğe için bunu atlayın veya `context: "isolated"` kullanın.
  İş parçacığına bağlı yerel alt ajanlar, `threadBindings.defaultSpawnContext` aksini söylemediği sürece
  varsayılan olarak `context: "fork"` kullanır.

Varsayılan yaprak alt ajanlar oturum araçları almaz. `maxSpawnDepth >= 2` olduğunda,
derinlik-1 orkestratör alt ajanlar ayrıca
`sessions_spawn`, `subagents`, `sessions_list` ve `sessions_history` alır; böylece
kendi alt öğelerini yönetebilirler. Yaprak çalışmalar yine de özyinelemeli
orkestrasyon araçları almaz.

Tamamlandıktan sonra, bir duyuru adımı sonucu istekte bulunanın kanalına gönderir.
Tamamlama teslimatı, varsa bağlı iş parçacığı/konu yönlendirmesini korur ve
tamamlama kökeni yalnızca bir kanalı tanımlıyorsa OpenClaw, doğrudan
teslimat için istekte bulunan oturumun saklanan rotasını (`lastChannel` / `lastTo`) yine de yeniden kullanabilir.

ACP'ye özgü davranış için bkz. [ACP Ajanları](/tr/tools/acp-agents).

## Görünürlük

Oturum araçları, ajanın görebileceklerini sınırlamak için kapsamlanır:

| Düzey   | Kapsam                                   |
| ------- | ---------------------------------------- |
| `self`  | Yalnızca geçerli oturum                  |
| `tree`  | Geçerli oturum + başlatılmış alt ajanlar |
| `agent` | Bu ajan için tüm oturumlar               |
| `all`   | Tüm oturumlar (yapılandırılmışsa ajanlar arası) |

Varsayılan `tree` değeridir. Sandbox içindeki oturumlar, yapılandırmadan bağımsız olarak
`tree` ile sınırlandırılır.

## Daha fazla okuma

- [Oturum Yönetimi](/tr/concepts/session) -- yönlendirme, yaşam döngüsü, bakım
- [ACP Ajanları](/tr/tools/acp-agents) -- harici harness başlatma
- [Çoklu ajan](/tr/concepts/multi-agent) -- çoklu ajan mimarisi
- [Gateway Yapılandırması](/tr/gateway/configuration) -- oturum aracı yapılandırma düğmeleri

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
