---
read_when:
    - Ajanın hangi oturum araçlarına sahip olduğunu anlamak istiyorsunuz
    - Oturumlar arası erişimi veya alt ajan oluşturmayı yapılandırmak istiyorsunuz
    - Durumu incelemek veya başlatılan alt ajanları kontrol etmek istiyorsunuz
summary: Oturumlar arası durum, anımsama, mesajlaşma ve alt ajan orkestrasyonu için ajan araçları
title: Oturum araçları
x-i18n:
    generated_at: "2026-04-30T09:18:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0464116d42e271da12cbe90529e06e9f51605981be85b54bb5850ee9b8fb7824
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw, ajanlara oturumlar arasında çalışmak, durumu incelemek ve
alt ajanları orkestre etmek için araçlar sağlar.

## Kullanılabilir araçlar

| Araç              | Ne yapar                                                                    |
| ----------------- | --------------------------------------------------------------------------- |
| `sessions_list`   | İsteğe bağlı filtrelerle oturumları listeler (kind, label, ajan, güncellik, önizleme) |
| `sessions_history` | Belirli bir oturumun dökümünü okur                                         |
| `sessions_send`   | Başka bir oturuma mesaj gönderir ve isteğe bağlı olarak bekler              |
| `sessions_spawn`  | Arka plan çalışması için yalıtılmış bir alt ajan oturumu başlatır           |
| `sessions_yield`  | Geçerli dönüşü sonlandırır ve takip alt ajan sonuçlarını bekler             |
| `subagents`       | Bu oturum için başlatılmış alt ajanları listeler, yönlendirir veya sonlandırır |
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

Grup, sağlayıcı, sandbox ve ajan başına politikalar, profil aşamasından
sonra bu araçları yine kaldırabilir. Etkili araç listesini incelemek için
etkilenen oturumdan `/tools` kullanın.

## Oturumları listeleme ve okuma

`sessions_list`, oturumları key, agentId, kind, kanal, model,
token sayıları ve zaman damgalarıyla döndürür. kind (`main`, `group`, `cron`, `hook`,
`node`), tam `label`, tam `agentId`, arama metni veya güncelliğe
(`activeMinutes`) göre filtreleyin. Posta kutusu tarzı triyaj gerektiğinde, her satırda
görünürlük kapsamlı türetilmiş başlık, son mesaj önizleme parçacığı veya sınırlı
son mesajlar da isteyebilir. Türetilmiş başlıklar ve önizlemeler yalnızca
çağıranın yapılandırılmış oturum aracı görünürlük politikası altında zaten
görebildiği oturumlar için üretilir; böylece ilgisiz oturumlar gizli kalır.

`sessions_history`, belirli bir oturum için konuşma dökümünü getirir.
Varsayılan olarak araç sonuçları hariç tutulur; bunları görmek için `includeTools: true` geçin.
Döndürülen görünüm kasıtlı olarak sınırlı ve güvenlik filtresinden geçirilmiştir:

- assistant metni hatırlamadan önce normalleştirilir:
  - thinking etiketleri çıkarılır
  - `<relevant-memories>` / `<relevant_memories>` iskele blokları çıkarılır
  - `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
    `<tool_calls>...</tool_calls>` ve `<function_calls>...</function_calls>` gibi
    düz metin araç çağrısı XML yük blokları, düzgün kapanmayan kesilmiş
    yükler dahil çıkarılır
  - `[Tool Call: ...]`, `[Tool Result ...]` ve `[Historical context ...]` gibi
    düşürülmüş araç çağrısı/sonuç iskeleleri çıkarılır
  - `<|assistant|>` gibi sızmış model denetim token’ları, diğer ASCII
    `<|...|>` token’ları ve tam genişlikli `<｜...｜>` varyantları çıkarılır
  - `<invoke ...>` / `</minimax:tool_call>` gibi bozuk MiniMax araç çağrısı XML’i çıkarılır
- kimlik bilgisi/token benzeri metin döndürülmeden önce redakte edilir
- uzun metin blokları kesilir
- çok büyük geçmişler eski satırları düşürebilir veya aşırı büyük bir satırı
  `[sessions_history omitted: message too large]` ile değiştirebilir
- araç `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted` ve `bytes`
  gibi özet bayrakları bildirir

Her iki araç da bir önceki liste çağrısından gelen bir **oturum anahtarı** (`"main"` gibi)
veya bir **oturum ID’si** kabul eder.

Tam bayt bayt aynı döküme ihtiyacınız varsa, `sessions_history` öğesini ham döküm
olarak ele almak yerine diskteki döküm dosyasını inceleyin.

## Oturumlar arası mesaj gönderme

`sessions_send`, başka bir oturuma mesaj iletir ve isteğe bağlı olarak yanıtı bekler:

- **Gönder ve unut:** Kuyruğa almak ve hemen dönmek için `timeoutSeconds: 0` ayarlayın.
- **Yanıt bekle:** Bir zaman aşımı ayarlayın ve yanıtı satır içinde alın.

Mesajlar ve A2A takip yanıtları, alıcı prompt’ta
(`[Inter-session message ... isUser=false]`) ve döküm kökeninde oturumlar arası veri
olarak işaretlenir. Alıcı ajan bunları doğrudan son kullanıcı tarafından yazılmış
bir talimat değil, araç üzerinden yönlendirilmiş veri olarak ele almalıdır.

Hedef yanıt verdikten sonra OpenClaw, ajanların dönüşümlü mesajlar gönderdiği
(5 dönüşe kadar) bir **yanıt-geri döngüsü** çalıştırabilir. Hedef ajan erken
durdurmak için `REPLY_SKIP` yanıtı verebilir.

## Durum ve orkestrasyon yardımcıları

`session_status`, geçerli veya görünür başka bir oturum için hafif `/status` eşdeğeri
araçtır. Kullanımı, zamanı, model/çalışma zamanı durumunu ve varsa bağlantılı
arka plan görevi bağlamını bildirir. `/status` gibi, seyrek token/cache sayaçlarını
en son döküm kullanım girdisinden geriye dönük doldurabilir ve `model=default`
oturum başına geçersiz kılmayı temizler. Çağıranın geçerli oturumu için
`sessionKey="current"` kullanın; `openclaw-tui` gibi görünür istemci etiketleri
oturum anahtarı değildir.

`sessions_yield`, beklediğiniz takip olayının bir sonraki mesaj olabilmesi için
geçerli dönüşü kasıtlı olarak sonlandırır. Alt ajanları başlattıktan sonra,
tamamlanma sonuçlarının yoklama döngüleri kurmak yerine bir sonraki mesaj olarak
gelmesini istediğinizde kullanın.

`subagents`, zaten başlatılmış OpenClaw alt ajanları için control-plane yardımcısıdır.
Şunları destekler:

- etkin/son çalışmaları incelemek için `action: "list"`
- çalışan bir çocuğa takip yönlendirmesi göndermek için `action: "steer"`
- bir çocuğu veya `all` öğesini durdurmak için `action: "kill"`

## Alt ajanları başlatma

`sessions_spawn`, varsayılan olarak bir arka plan görevi için yalıtılmış bir oturum
oluşturur. Her zaman engellemesizdir; bir `runId` ve `childSessionKey` ile hemen döner.

Temel seçenekler:

- `runtime: "subagent"` (varsayılan) veya harici harness ajanları için `"acp"`.
- Çocuk oturum için `model` ve `thinking` geçersiz kılmaları.
- Başlatmayı bir sohbet iş parçacığına bağlamak için `thread: true` (Discord, Slack vb.).
- Çocukta sandbox uygulamak için `sandbox: "require"`.
- Çocuk geçerli istek sahibinin dökümüne ihtiyaç duyduğunda yerel alt ajanlar için
  `context: "fork"`; temiz bir çocuk için bunu atlayın veya `context: "isolated"` kullanın.

Varsayılan yaprak alt ajanlara oturum araçları verilmez. `maxSpawnDepth >= 2`
olduğunda, derinlik-1 orkestratör alt ajanlar ayrıca `sessions_spawn`, `subagents`,
`sessions_list` ve `sessions_history` alır; böylece kendi çocuklarını yönetebilirler.
Yaprak çalışmalar yine de özyinelemeli orkestrasyon araçları almaz.

Tamamlandıktan sonra bir duyuru adımı sonucu istek sahibinin kanalına gönderir.
Tamamlanma teslimi, kullanılabiliyorsa bağlı iş parçacığı/konu yönlendirmesini
korur; tamamlanma kaynağı yalnızca bir kanalı tanımlıyorsa OpenClaw doğrudan
teslimat için istek sahibi oturumun saklanan rotasını (`lastChannel` / `lastTo`)
yine de yeniden kullanabilir.

ACP’ye özgü davranış için bkz. [ACP Ajanları](/tr/tools/acp-agents).

## Görünürlük

Oturum araçları, ajanın ne görebileceğini sınırlamak için kapsamlandırılır:

| Düzey   | Kapsam                                  |
| ------- | --------------------------------------- |
| `self`  | Yalnızca geçerli oturum                 |
| `tree`  | Geçerli oturum + başlatılmış alt ajanlar |
| `agent` | Bu ajan için tüm oturumlar              |
| `all`   | Tüm oturumlar (yapılandırılmışsa ajanlar arası) |

Varsayılan `tree` şeklindedir. Sandboxed oturumlar, yapılandırmadan bağımsız olarak
`tree` ile sınırlandırılır.

## Daha fazla okuma

- [Oturum Yönetimi](/tr/concepts/session) -- yönlendirme, yaşam döngüsü, bakım
- [ACP Ajanları](/tr/tools/acp-agents) -- harici harness başlatma
- [Çok ajanlı](/tr/concepts/multi-agent) -- çok ajanlı mimari
- [Gateway Yapılandırması](/tr/gateway/configuration) -- oturum aracı yapılandırma düğmeleri

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
