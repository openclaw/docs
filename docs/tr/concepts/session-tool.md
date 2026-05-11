---
read_when:
    - Ajanın hangi oturum araçlarına sahip olduğunu anlamak istiyorsunuz
    - Oturumlar arası erişimi veya alt ajan oluşturmayı yapılandırmak istiyorsunuz
    - Oluşturulmuş alt ajanların durumunu incelemek veya onları kontrol etmek istiyorsunuz
summary: Oturumlar arası durum, hatırlama, mesajlaşma ve alt ajan orkestrasyonu için ajan araçları
title: Oturum araçları
x-i18n:
    generated_at: "2026-05-11T20:28:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: e91f1f956ff882cabf7df51bd8c08836398decfb185c56c42db4052f24b3f716
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw, ajanlara oturumlar arasında çalışmak, durumu incelemek ve
alt ajanları orkestre etmek için araçlar sağlar.

## Kullanılabilir araçlar

| Araç               | Ne yapar                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | İsteğe bağlı filtrelerle oturumları listeler (tür, etiket, ajan, güncellik, önizleme) |
| `sessions_history` | Belirli bir oturumun dökümünü okur                                          |
| `sessions_send`    | Başka bir oturuma mesaj gönderir ve isteğe bağlı olarak bekler              |
| `sessions_spawn`   | Arka plan işi için yalıtılmış bir alt ajan oturumu başlatır                 |
| `sessions_yield`   | Geçerli turu sonlandırır ve takip alt ajan sonuçlarını bekler               |
| `subagents`        | Bu oturum için başlatılmış alt ajanları listeler, yönlendirir veya sonlandırır |
| `session_status`   | `/status` tarzı bir kart gösterir ve isteğe bağlı olarak oturum başına model geçersiz kılması ayarlar |

Bu araçlar yine de etkin araç profiline ve izin ver/engelle politikasına tabidir.
`tools.profile: "coding"`, `sessions_spawn`, `sessions_yield` ve `subagents`
dahil tam oturum orkestrasyon kümesini içerir. `tools.profile: "messaging"`,
oturumlar arası mesajlaşma araçlarını (`sessions_list`, `sessions_history`,
`sessions_send`, `session_status`) içerir ancak alt ajan başlatmayı içermez.
Mesajlaşma profilini koruyup yine de yerel yetkilendirmeye izin vermek için şunu ekleyin:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Grup, sağlayıcı, sandbox ve ajan başına politikalar, profil aşamasından sonra
bu araçları yine de kaldırabilir. Etkili araç listesini incelemek için etkilenen
oturumdan `/tools` kullanın.

## Oturumları listeleme ve okuma

`sessions_list`, oturumları anahtarları, agentId, türleri, kanalları, modelleri,
belirteç sayıları ve zaman damgalarıyla döndürür. Türe (`main`, `group`, `cron`,
`hook`, `node`), tam `label`, tam `agentId`, arama metni veya güncelliğe
(`activeMinutes`) göre filtreleyin. Posta kutusu tarzı triyaj gerektiğinde,
görünürlük kapsamlı türetilmiş başlık, son mesaj önizleme parçacığı veya her
satırda sınırlandırılmış yakın tarihli mesajlar da isteyebilir. Türetilmiş
başlıklar ve önizlemeler yalnızca çağıranın yapılandırılmış oturum aracı
görünürlük politikası kapsamında zaten görebildiği oturumlar için üretilir;
böylece ilgisiz oturumlar gizli kalır.

`sessions_history`, belirli bir oturum için konuşma dökümünü getirir. Varsayılan
olarak araç sonuçları hariç tutulur -- bunları görmek için `includeTools: true`
iletin. Döndürülen görünüm kasıtlı olarak sınırlandırılmış ve güvenlik açısından
filtrelenmiştir:

- asistan metni geri çağırmadan önce normalleştirilir:
  - düşünme etiketleri kaldırılır
  - `<relevant-memories>` / `<relevant_memories>` iskele blokları kaldırılır
  - `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
    `<tool_calls>...</tool_calls>` ve `<function_calls>...</function_calls>` gibi
    düz metin araç çağrısı XML yük blokları, düzgün kapanmayan kesilmiş yükler
    dahil kaldırılır
  - `[Tool Call: ...]`, `[Tool Result ...]` ve `[Historical context ...]` gibi
    düşürülmüş araç çağrısı/sonucu iskeleleri kaldırılır
  - `<|assistant|>` gibi sızmış model denetim belirteçleri, diğer ASCII
    `<|...|>` belirteçleri ve tam genişlikli `<｜...｜>` varyantları kaldırılır
  - `<invoke ...>` / `</minimax:tool_call>` gibi hatalı biçimlendirilmiş MiniMax
    araç çağrısı XML'i kaldırılır
- kimlik bilgisi/belirteç benzeri metin döndürülmeden önce redakte edilir
- uzun metin blokları kesilir
- çok büyük geçmişler eski satırları düşürebilir veya aşırı büyük bir satırı
  `[sessions_history omitted: message too large]` ile değiştirebilir
- araç `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted` ve
  `bytes` gibi özet bayrakları bildirir

Her iki araç da bir önceki liste çağrısından gelen bir **oturum anahtarı**
(`"main"` gibi) veya bir **oturum kimliği** kabul eder.

Tam bayt bayt eşleşen döküme ihtiyacınız varsa, `sessions_history` öğesini ham
döküm olarak ele almak yerine diskteki döküm dosyasını inceleyin.

## Oturumlar arası mesaj gönderme

`sessions_send`, başka bir oturuma mesaj teslim eder ve isteğe bağlı olarak
yanıtı bekler:

- **Gönder ve unut:** sıraya alıp hemen dönmek için `timeoutSeconds: 0` ayarlayın.
- **Yanıtı bekle:** bir zaman aşımı ayarlayın ve yanıtı satır içi alın.

Slack veya Discord anahtarları `:thread:<id>` ile biten iş parçacığı kapsamlı
sohbet oturumları, geçerli `sessions_send` hedefleri değildir. Ajanlar arası
koordinasyon için üst kanal oturum anahtarını kullanın; böylece araçla
yönlendirilen mesajlar etkin, insanla yüz yüze bir iş parçacığının içinde
görünmez.

Mesajlar ve A2A takip yanıtları, alıcı isteminde
(`[Inter-session message ... isUser=false]`) ve döküm kaynağında oturumlar arası
veri olarak işaretlenir. Alıcı ajan bunları doğrudan son kullanıcı tarafından
yazılmış bir talimat olarak değil, araçla yönlendirilmiş veri olarak ele
almalıdır.

Hedef yanıt verdikten sonra OpenClaw, ajanların sırayla mesajlaştığı bir
**geri yanıt döngüsü** çalıştırabilir (`session.agentToAgent.maxPingPongTurns`
değerine kadar; aralık 0-20, varsayılan 5). Hedef ajan erken durmak için
`REPLY_SKIP` yanıtını verebilir.

## Durum ve orkestrasyon yardımcıları

`session_status`, geçerli veya başka bir görünür oturum için hafif
`/status` eşdeğeri araçtır. Kullanımı, zamanı, model/çalışma zamanı durumunu ve
varsa bağlantılı arka plan görevi bağlamını bildirir. `/status` gibi, seyrek
belirteç/önbellek sayaçlarını en son döküm kullanım girdisinden geriye dönük
doldurabilir ve `model=default`, oturum başına geçersiz kılmayı temizler.
Çağıranın geçerli oturumu için `sessionKey="current"` kullanın; `openclaw-tui`
gibi görünür istemci etiketleri oturum anahtarları değildir.

`sessions_yield`, beklediğiniz takip olayı bir sonraki mesaj olarak gelebilsin
diye geçerli turu kasıtlı olarak sonlandırır. Tamamlama sonuçlarının yoklama
döngüleri kurmak yerine sonraki mesaj olarak gelmesini istediğinizde, alt
ajanları başlattıktan sonra kullanın.

`subagents`, zaten başlatılmış OpenClaw alt ajanları için kontrol düzlemi
yardımcısıdır. Şunları destekler:

- etkin/yakın tarihli çalıştırmaları incelemek için `action: "list"`
- çalışan bir alt ajana takip yönlendirmesi göndermek için `action: "steer"`
- bir alt ajanı veya `all` değerini durdurmak için `action: "kill"`

## Alt ajanları başlatma

`sessions_spawn`, varsayılan olarak bir arka plan görevi için yalıtılmış bir
oturum oluşturur. Her zaman engellemesizdir -- hemen bir `runId` ve
`childSessionKey` ile döner.

Temel seçenekler:

- `runtime: "subagent"` (varsayılan) veya harici harness ajanları için `"acp"`.
- Alt oturum için `model` ve `thinking` geçersiz kılmaları.
- Başlatmayı bir sohbet iş parçacığına (Discord, Slack vb.) bağlamak için
  `thread: true`.
- Alt ajanda sandbox kullanımını zorunlu kılmak için `sandbox: "require"`.
- Alt ajanın geçerli istekte bulunan dökümüne ihtiyacı olduğunda yerel alt
  ajanlar için `context: "fork"`; temiz bir alt ajan için bunu atlayın veya
  `context: "isolated"` kullanın. İş parçacığına bağlı yerel alt ajanlar,
  `threadBindings.defaultSpawnContext` başka türlü belirtmediği sürece
  varsayılan olarak `context: "fork"` kullanır.

Varsayılan yaprak alt ajanlar oturum araçları almaz. `maxSpawnDepth >= 2`
olduğunda, derinlik-1 orkestratör alt ajanlar ayrıca `sessions_spawn`,
`subagents`, `sessions_list` ve `sessions_history` alır; böylece kendi alt
ajanlarını yönetebilirler. Yaprak çalıştırmalar yine de özyinelemeli
orkestrasyon araçları almaz.

Tamamlandıktan sonra, bir duyuru adımı sonucu istekte bulunanın kanalına
gönderir. Tamamlama teslimi mevcut olduğunda bağlı iş parçacığı/konu
yönlendirmesini korur ve tamamlama kaynağı yalnızca bir kanalı tanımlıyorsa
OpenClaw, doğrudan teslim için istekte bulunan oturumun saklanmış rotasını
(`lastChannel` / `lastTo`) yine de yeniden kullanabilir.

ACP'ye özgü davranış için bkz. [ACP Ajanları](/tr/tools/acp-agents).

## Görünürlük

Oturum araçları, ajanın görebileceklerini sınırlamak için kapsamlandırılır:

| Düzey   | Kapsam                                   |
| ------- | ---------------------------------------- |
| `self`  | Yalnızca geçerli oturum                  |
| `tree`  | Geçerli oturum + başlatılmış alt ajanlar |
| `agent` | Bu ajan için tüm oturumlar               |
| `all`   | Tüm oturumlar (yapılandırılmışsa ajanlar arası) |

Varsayılan `tree` değeridir. Sandbox uygulanmış oturumlar, yapılandırmadan
bağımsız olarak `tree` ile sınırlandırılır.

## Ek okuma

- [Oturum Yönetimi](/tr/concepts/session) -- yönlendirme, yaşam döngüsü, bakım
- [ACP Ajanları](/tr/tools/acp-agents) -- harici harness başlatma
- [Çok ajanlı](/tr/concepts/multi-agent) -- çok ajanlı mimari
- [Gateway Yapılandırması](/tr/gateway/configuration) -- oturum aracı yapılandırma ayarları

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
