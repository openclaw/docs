---
read_when:
    - Ajanın hangi oturum araçlarına sahip olduğunu anlamak istiyorsunuz
    - Oturumlar arası erişimi veya alt aracı oluşturmayı yapılandırmak istiyorsunuz
    - Başlatılan alt aracıların durumunu incelemek veya onları kontrol etmek istiyorsunuz
summary: Oturumlar arası durum, hatırlama, mesajlaşma ve alt ajan orkestrasyonu için ajan araçları
title: Oturum araçları
x-i18n:
    generated_at: "2026-05-02T08:53:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb8a3ab7fd1036ccd97940fc9824684d7b27ded0136f6a69416eb144bbfc64be
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw, aracılara oturumlar arasında çalışmak, durumu incelemek ve
alt aracıları orkestre etmek için araçlar sağlar.

## Kullanılabilir araçlar

| Araç              | Ne yapar                                                                    |
| ----------------- | --------------------------------------------------------------------------- |
| `sessions_list`   | İsteğe bağlı filtrelerle oturumları listeler (tür, etiket, aracı, güncellik, önizleme) |
| `sessions_history` | Belirli bir oturumun dökümünü okur                                         |
| `sessions_send`   | Başka bir oturuma mesaj gönderir ve isteğe bağlı olarak bekler             |
| `sessions_spawn`  | Arka plan çalışması için izole bir alt aracı oturumu başlatır              |
| `sessions_yield`  | Geçerli turu sonlandırır ve takip eden alt aracı sonuçlarını bekler        |
| `subagents`       | Bu oturum için başlatılmış alt aracıları listeler, yönlendirir veya sonlandırır |
| `session_status`  | `/status` tarzı bir kart gösterir ve isteğe bağlı olarak oturum başına model geçersiz kılması ayarlar |

Bu araçlar hâlâ etkin araç profiline ve izin/verme engelleme politikasına
tabidir. `tools.profile: "coding"`, `sessions_spawn`, `sessions_yield` ve
`subagents` dahil olmak üzere tam oturum orkestrasyonu kümesini içerir.
`tools.profile: "messaging"` oturumlar arası mesajlaşma araçlarını
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`) içerir
ancak alt aracı başlatmayı içermez. Mesajlaşma profilini koruyup yine de yerel
delegasyona izin vermek için şunu ekleyin:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Grup, sağlayıcı, sandbox ve aracı başına politikalar, profil aşamasından sonra
bu araçları yine de kaldırabilir. Etkilenen oturumdan `/tools` kullanarak
etkin araç listesini inceleyin.

## Oturumları listeleme ve okuma

`sessions_list`, oturumları anahtarları, agentId, türleri, kanalları, modelleri,
token sayıları ve zaman damgalarıyla döndürür. Türe (`main`, `group`, `cron`,
`hook`, `node`), tam `label`, tam `agentId`, arama metni veya güncelliğe
(`activeMinutes`) göre filtreleyin. Posta kutusu tarzı önceliklendirmeye
ihtiyacınız olduğunda, her satır için görünürlük kapsamlı türetilmiş bir başlık,
son mesaj önizleme parçası veya sınırlandırılmış son mesajlar da isteyebilir.
Türetilmiş başlıklar ve önizlemeler yalnızca çağıranın yapılandırılmış oturum
aracı görünürlük politikası altında zaten görebildiği oturumlar için üretilir,
böylece ilgisiz oturumlar gizli kalır.

`sessions_history`, belirli bir oturumun konuşma dökümünü getirir.
Varsayılan olarak araç sonuçları hariç tutulur; bunları görmek için
`includeTools: true` iletin. Döndürülen görünüm bilinçli olarak sınırlandırılmış
ve güvenlik açısından filtrelenmiştir:

- asistan metni geri çağırmadan önce normalleştirilir:
  - düşünme etiketleri kaldırılır
  - `<relevant-memories>` / `<relevant_memories>` iskelet blokları kaldırılır
  - `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
    `<tool_calls>...</tool_calls>` ve
    `<function_calls>...</function_calls>` gibi düz metin araç çağrısı XML
    yük blokları, düzgün kapanmayan kesilmiş yükler dahil kaldırılır
  - `[Tool Call: ...]`, `[Tool Result ...]` ve `[Historical context ...]` gibi
    düşürülmüş araç çağrısı/sonuç iskeletleri kaldırılır
  - `<|assistant|>` gibi sızmış model kontrol token’ları, diğer ASCII
    `<|...|>` token’ları ve tam genişlikli `<｜...｜>` varyantları kaldırılır
  - `<invoke ...>` / `</minimax:tool_call>` gibi hatalı biçimlendirilmiş MiniMax
    araç çağrısı XML’i kaldırılır
- kimlik bilgisi/token benzeri metin döndürülmeden önce redakte edilir
- uzun metin blokları kesilir
- çok büyük geçmişler eski satırları düşürebilir veya aşırı büyük bir satırı
  `[sessions_history omitted: message too large]` ile değiştirebilir
- araç `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted` ve
  `bytes` gibi özet bayrakları raporlar

Her iki araç da önceki bir liste çağrısından gelen bir **oturum anahtarı**nı
(`"main"` gibi) veya bir **oturum kimliği**ni kabul eder.

Tam bayt bayt aynı konuşma dökümüne ihtiyacınız varsa, `sessions_history`’yi ham
döküm gibi ele almak yerine diskteki döküm dosyasını inceleyin.

## Oturumlar arası mesaj gönderme

`sessions_send`, başka bir oturuma mesaj iletir ve isteğe bağlı olarak yanıtı
bekler:

- **Gönder ve unut:** kuyruğa alıp hemen dönmek için `timeoutSeconds: 0` ayarlayın.
- **Yanıtı bekle:** bir zaman aşımı ayarlayın ve yanıtı satır içinde alın.

Slack veya Discord anahtarlarının `:thread:<id>` ile bitmesi gibi iş parçacığı
kapsamlı sohbet oturumları geçerli `sessions_send` hedefleri değildir. Aracılar
arası koordinasyon için üst kanal oturum anahtarını kullanın; böylece araçla
yönlendirilen mesajlar etkin, insana dönük bir iş parçacığının içinde görünmez.

Mesajlar ve A2A takip yanıtları, alıcı prompt içinde
(`[Inter-session message ... isUser=false]`) ve döküm köken bilgisinde oturumlar
arası veri olarak işaretlenir. Alıcı aracı bunları doğrudan son kullanıcı
tarafından yazılmış bir talimat olarak değil, araçla yönlendirilmiş veri olarak
ele almalıdır.

Hedef yanıt verdikten sonra OpenClaw, aracıların sırayla mesajlaştığı bir
**yanıt-geri döngüsü** çalıştırabilir (en fazla 5 tur). Hedef aracı erken
durdurmak için `REPLY_SKIP` yanıtını verebilir.

## Durum ve orkestrasyon yardımcıları

`session_status`, geçerli veya görünür başka bir oturum için hafif
`/status` eşdeğeri araçtır. Kullanımı, zamanı, model/çalışma zamanı durumunu ve
varsa bağlı arka plan görev bağlamını raporlar. `/status` gibi, seyrek
token/cache sayaçlarını son döküm kullanım girdisinden geriye dönük
doldurabilir ve `model=default` oturum başına geçersiz kılmayı temizler.
Çağıranın geçerli oturumu için `sessionKey="current"` kullanın; `openclaw-tui`
gibi görünür istemci etiketleri oturum anahtarı değildir.

`sessions_yield`, beklediğiniz takip olayının bir sonraki mesaj olabilmesi için
geçerli turu bilinçli olarak sonlandırır. Tamamlanma sonuçlarının yoklama
döngüleri kurmak yerine bir sonraki mesaj olarak gelmesini istediğinizde, alt
aracıları başlattıktan sonra bunu kullanın.

`subagents`, zaten başlatılmış OpenClaw alt aracıları için kontrol düzlemi
yardımcısıdır. Şunları destekler:

- etkin/son çalıştırmaları incelemek için `action: "list"`
- çalışan bir alt aracıya takip yönlendirmesi göndermek için `action: "steer"`
- bir alt aracı veya `all` durdurmak için `action: "kill"`

## Alt aracıları başlatma

`sessions_spawn`, varsayılan olarak bir arka plan görevi için izole bir oturum
oluşturur. Her zaman engellemesizdir; hemen bir `runId` ve `childSessionKey` ile
döner.

Temel seçenekler:

- `runtime: "subagent"` (varsayılan) veya harici denetim aracıları için `"acp"`.
- Alt oturum için `model` ve `thinking` geçersiz kılmaları.
- Başlatmayı bir sohbet iş parçacığına bağlamak için `thread: true` (Discord, Slack vb.).
- Alt oturumda sandbox uygulanmasını zorunlu kılmak için `sandbox: "require"`.
- Alt aracı geçerli istekte bulunan dökümüne ihtiyaç duyduğunda yerel alt aracılar
  için `context: "fork"`; temiz bir alt aracı için bunu atlayın veya
  `context: "isolated"` kullanın. İş parçacığına bağlı yerel alt aracılar,
  `threadBindings.defaultSpawnContext` aksi yönde söylemedikçe varsayılan olarak
  `context: "fork"` kullanır.

Varsayılan yaprak alt aracılar oturum araçları almaz. `maxSpawnDepth >= 2`
olduğunda, depth-1 orkestratör alt aracılar ayrıca `sessions_spawn`,
`subagents`, `sessions_list` ve `sessions_history` alır; böylece kendi alt
aracılarını yönetebilirler. Yaprak çalıştırmalar yine de özyinelemeli
orkestrasyon araçları almaz.

Tamamlandıktan sonra, bir duyuru adımı sonucu istekte bulunanın kanalına
gönderir. Tamamlanma teslimi, mevcut olduğunda bağlı iş parçacığı/konu
yönlendirmesini korur; tamamlanma kaynağı yalnızca bir kanalı tanımlıyorsa
OpenClaw doğrudan teslimat için istekte bulunan oturumun saklanan rotasını
(`lastChannel` / `lastTo`) yine de yeniden kullanabilir.

ACP’ye özgü davranış için bkz. [ACP Aracıları](/tr/tools/acp-agents).

## Görünürlük

Oturum araçları, aracının neleri görebileceğini sınırlamak için kapsamlanır:

| Düzey   | Kapsam                                   |
| ------- | ---------------------------------------- |
| `self`  | Yalnızca geçerli oturum                  |
| `tree`  | Geçerli oturum + başlatılmış alt aracılar |
| `agent` | Bu aracıya ait tüm oturumlar             |
| `all`   | Tüm oturumlar (yapılandırılmışsa aracılar arası) |

Varsayılan `tree`’dir. Sandbox uygulanmış oturumlar, yapılandırmadan bağımsız
olarak `tree` ile sınırlandırılır.

## Ek okuma

- [Oturum Yönetimi](/tr/concepts/session) -- yönlendirme, yaşam döngüsü, bakım
- [ACP Aracıları](/tr/tools/acp-agents) -- harici denetim aracı başlatma
- [Çok aracılı](/tr/concepts/multi-agent) -- çok aracılı mimari
- [Gateway Yapılandırması](/tr/gateway/configuration) -- oturum aracı yapılandırma düğmeleri

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
