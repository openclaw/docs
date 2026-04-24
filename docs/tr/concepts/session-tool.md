---
read_when:
    - Ajanın hangi oturum araçlarına sahip olduğunu anlamak istiyorsunuz
    - Oturumlar arası erişimi veya alt ajan başlatmayı yapılandırmak istiyorsunuz
    - Durumu incelemek veya başlatılmış alt ajanları denetlemek istiyorsunuz
summary: Oturumlar arası durum, geri çağırma, mesajlaşma ve alt ajan orkestrasyonu için ajan araçları
title: Oturum araçları
x-i18n:
    generated_at: "2026-04-24T09:06:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3032178a83e662009c3ea463f02cb20d604069d1634d5c24a9f86988e676b2e
    source_path: concepts/session-tool.md
    workflow: 15
---

OpenClaw, ajanlara oturumlar arasında çalışmak, durumu incelemek ve
alt ajanları orkestre etmek için araçlar sağlar.

## Kullanılabilir araçlar

| Araç              | Ne yapar                                                                    |
| ----------------- | --------------------------------------------------------------------------- |
| `sessions_list`   | İsteğe bağlı filtrelerle oturumları listeler (tür, etiket, ajan, yakınlık, önizleme) |
| `sessions_history`| Belirli bir oturumun transkriptini okur                                     |
| `sessions_send`   | Başka bir oturuma mesaj gönderir ve isteğe bağlı olarak bekler              |
| `sessions_spawn`  | Arka plan çalışması için yalıtılmış bir alt ajan oturumu başlatır           |
| `sessions_yield`  | Geçerli dönüşü sonlandırır ve takip eden alt ajan sonuçlarını bekler        |
| `subagents`       | Bu oturum için başlatılmış alt ajanları listeler, yönlendirir veya sonlandırır |
| `session_status`  | `/status` benzeri bir kart gösterir ve isteğe bağlı olarak oturum başına model geçersiz kılma ayarlar |

## Oturumları listeleme ve okuma

`sessions_list`, oturumları anahtarları, agentId, tür, kanal, model,
token sayıları ve zaman damgalarıyla döndürür. Tür (`main`, `group`, `cron`, `hook`,
`node`), tam `label`, tam `agentId`, arama metni veya yakınlığa
(`activeMinutes`) göre filtreleyin. Posta kutusu tarzı triyaj gerektiğinde,
görünürlük kapsamlı türetilmiş bir başlık, son mesaj önizleme parçacığı veya
her satırda sınırlı son mesajlar da isteyebilir. Türetilmiş başlıklar ve önizlemeler yalnızca
çağıranın yapılandırılmış oturum aracı görünürlük politikası altında zaten görebildiği
oturumlar için üretilir; böylece alakasız oturumlar gizli kalır.

`sessions_history`, belirli bir oturum için konuşma transkriptini getirir.
Varsayılan olarak araç sonuçları hariç tutulur -- görmek için `includeTools: true` geçin.
Döndürülen görünüm bilinçli olarak sınırlanmış ve güvenlik filtresinden geçirilmiştir:

- asistan metni geri çağırmadan önce normalize edilir:
  - düşünme etiketleri çıkarılır
  - `<relevant-memories>` / `<relevant_memories>` iskele blokları çıkarılır
  - `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` ve
    `<function_calls>...</function_calls>` gibi düz metin araç çağrısı XML yük blokları çıkarılır;
    düzgün kapanmayan kesik yükler de buna dahildir
  - `[Tool Call: ...]`,
    `[Tool Result ...]` ve `[Historical context ...]` gibi düşürülmüş araç çağrısı/sonuç iskelesi çıkarılır
  - `<|assistant|>`, diğer ASCII
    `<|...|>` belirteçleri ve tam genişlikli `<｜...｜>` varyantları gibi sızmış model denetim belirteçleri çıkarılır
  - `<invoke ...>` /
    `</minimax:tool_call>` gibi bozuk MiniMax araç çağrısı XML'i çıkarılır
- kimlik bilgisi/token benzeri metin döndürülmeden önce redakte edilir
- uzun metin blokları kısaltılır
- çok büyük geçmişlerde eski satırlar düşürülebilir veya aşırı büyük bir satır
  `[sessions_history omitted: message too large]` ile değiştirilebilir
- araç, `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` ve `bytes` gibi özet bayrakları raporlar

Her iki araç da **oturum anahtarı** (ör. `"main"`) veya
önceki listeleme çağrısından alınan **oturum kimliği** kabul eder.

Tam olarak bayt düzeyinde transkripte ihtiyacınız varsa,
`sessions_history` aracını ham döküm olarak görmek yerine disk üzerindeki transkript dosyasını inceleyin.

## Oturumlar arası mesaj gönderme

`sessions_send`, başka bir oturuma mesaj iletir ve isteğe bağlı olarak
yanıtı bekler:

- **Gönder ve unut:** kuyruğa alıp hemen dönmek için `timeoutSeconds: 0` ayarlayın.
- **Yanıtı bekle:** bir zaman aşımı belirleyin ve yanıtı satır içinde alın.

Hedef yanıt verdikten sonra OpenClaw,
ajanların mesajları sırayla değiştirdiği **geri-yanıt döngüsünü** çalıştırabilir (en fazla 5 dönüş). Hedef ajan
erken durmak için `REPLY_SKIP` yanıtı verebilir.

## Durum ve orkestrasyon yardımcıları

`session_status`, geçerli
veya görünür başka bir oturum için hafif `/status` eşdeğeri araçtır. Kullanımı, zamanı, model/çalışma zamanı durumunu ve varsa
bağlı arka plan görevi bağlamını raporlar. `/status` gibi, son transkript kullanım girdisinden seyrek token/önbellek sayaçlarını geri doldurabilir ve
`model=default` oturum başına geçersiz kılmayı temizler.

`sessions_yield`, bir sonraki mesajın beklediğiniz
takip olayı olabilmesi için geçerli dönüşü bilinçli olarak sonlandırır. Tamamlama sonuçlarının yoklama döngüleri kurmak yerine
bir sonraki mesaj olarak gelmesini istediğinizde alt ajanlar başlattıktan sonra bunu kullanın.

`subagents`, zaten başlatılmış OpenClaw
alt ajanları için denetim düzlemi yardımcısıdır. Şunları destekler:

- etkin/son çalıştırmaları incelemek için `action: "list"`
- çalışan bir çocuğa takip yönlendirmesi göndermek için `action: "steer"`
- bir çocuğu veya `all` değerini durdurmak için `action: "kill"`

## Alt ajan başlatma

`sessions_spawn`, varsayılan olarak arka plan görevi için yalıtılmış bir oturum oluşturur.
Her zaman engellemez -- hemen bir `runId` ve
`childSessionKey` ile döner.

Temel seçenekler:

- harici koşum ajanları için `runtime: "subagent"` (varsayılan) veya `"acp"`.
- çocuk oturum için `model` ve `thinking` geçersiz kılmaları.
- başlatmayı sohbet iş parçacığına bağlamak için `thread: true` (Discord, Slack vb.).
- çocukta sandbox zorlamak için `sandbox: "require"`.
- çocuk geçerli
  istemci transkriptine ihtiyaç duyduğunda yerel alt ajanlar için `context: "fork"`; temiz bir çocuk için bunu atlayın veya `context: "isolated"` kullanın.

Varsayılan yaprak alt ajanlar oturum araçları almaz. `maxSpawnDepth >= 2` olduğunda,
derinlik-1 orkestratör alt ajanlar ayrıca kendi çocuklarını
yönetebilmeleri için `sessions_spawn`, `subagents`, `sessions_list` ve `sessions_history` alır. Yaprak çalıştırmalar hâlâ özyinelemeli
orkestrasyon araçları almaz.

Tamamlandıktan sonra bir duyuru adımı, sonucu istekte bulunanın kanalına gönderir.
Tamamlama teslimi, mevcut olduğunda bağlı iş parçacığı/konu yönlendirmesini korur ve tamamlanma kaynağı yalnızca bir kanal tanımlıyorsa bile OpenClaw doğrudan
teslim için istekte bulunan oturumun kayıtlı rotasını (`lastChannel` / `lastTo`) yeniden kullanabilir.

ACP'ye özgü davranış için [ACP Ajanları](/tr/tools/acp-agents) bölümüne bakın.

## Görünürlük

Oturum araçları, ajanın görebileceklerini sınırlamak için kapsamlandırılmıştır:

| Düzey   | Kapsam                                    |
| ------- | ----------------------------------------- |
| `self`  | Yalnızca geçerli oturum                   |
| `tree`  | Geçerli oturum + başlatılmış alt ajanlar  |
| `agent` | Bu ajan için tüm oturumlar                |
| `all`   | Tüm oturumlar (yapılandırılmışsa ajanlar arası) |

Varsayılan `tree` değeridir. Sandboxed oturumlar, yapılandırmadan bağımsız olarak
`tree` düzeyine sabitlenir.

## Daha fazla okuma

- [Oturum Yönetimi](/tr/concepts/session) -- yönlendirme, yaşam döngüsü, bakım
- [ACP Ajanları](/tr/tools/acp-agents) -- harici koşum başlatma
- [Çok ajanlı](/tr/concepts/multi-agent) -- çok ajanlı mimari
- [Gateway Yapılandırması](/tr/gateway/configuration) -- oturum aracı yapılandırma ayarları

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
