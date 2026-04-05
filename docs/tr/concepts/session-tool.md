---
read_when:
    - Agent’ın hangi oturum araçlarına sahip olduğunu anlamak istiyorsunuz
    - Oturumlar arası erişimi veya alt ajan başlatmayı yapılandırmak istiyorsunuz
    - Durumu incelemek veya başlatılmış alt ajanları denetlemek istiyorsunuz
summary: Oturumlar arası durum, hatırlama, mesajlaşma ve alt ajan orkestrasyonu için agent araçları
title: Session Tools
x-i18n:
    generated_at: "2026-04-05T13:51:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77fab7cbf9d1a5cccaf316b69fefe212bbf9370876c8b92e988d3175f5545a4d
    source_path: concepts/session-tool.md
    workflow: 15
---

# Session Tools

OpenClaw, agent’lara oturumlar arasında çalışmak, durumu incelemek ve
alt ajanları orkestre etmek için araçlar verir.

## Kullanılabilir araçlar

| Araç               | Ne yapar                                                                  |
| ------------------ | ------------------------------------------------------------------------- |
| `sessions_list`    | İsteğe bağlı filtrelerle (tür, yakın zamanlılık) oturumları listeler      |
| `sessions_history` | Belirli bir oturumun transkriptini okur                                   |
| `sessions_send`    | Başka bir oturuma mesaj gönderir ve isteğe bağlı olarak bekler            |
| `sessions_spawn`   | Arka plan çalışması için yalıtılmış bir alt ajan oturumu başlatır         |
| `sessions_yield`   | Geçerli turu bitirir ve takip eden alt ajan sonuçlarını bekler            |
| `subagents`        | Bu oturum için başlatılmış alt ajanları listeler, yönlendirir veya öldürür |
| `session_status`   | `/status` benzeri bir kart gösterir ve isteğe bağlı olarak oturum başına model geçersiz kılması ayarlar |

## Oturumları listeleme ve okuma

`sessions_list`, oturumları anahtarları, türleri, kanalları, modelleri, token
sayıları ve zaman damgalarıyla birlikte döndürür. Tür (`main`, `group`, `cron`, `hook`,
`node`) veya yakın zamanlılık (`activeMinutes`) bazında filtreleyin.

`sessions_history`, belirli bir oturum için konuşma transkriptini getirir.
Varsayılan olarak araç sonuçları hariç tutulur -- görmek için `includeTools: true` geçin.
Döndürülen görünüm kasıtlı olarak sınırlandırılmış ve güvenlik filtresinden geçirilmiştir:

- assistant metni geri çağırmadan önce normalize edilir:
  - thinking etiketleri kaldırılır
  - `<relevant-memories>` / `<relevant_memories>` iskele blokları kaldırılır
  - `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` ve
    `<function_calls>...</function_calls>` gibi düz metin araç çağrısı XML yük blokları kaldırılır;
    düzgün kapanmayan kesilmiş yükler dahil
  - `[Tool Call: ...]`,
    `[Tool Result ...]` ve `[Historical context ...]` gibi indirgenmiş araç çağrısı/sonucu iskeleleri kaldırılır
  - `<|assistant|>`, diğer ASCII
    `<|...|>` token’ları ve tam genişlikli `<｜...｜>` varyantları gibi sızmış model kontrol token’ları kaldırılır
  - `<invoke ...>` /
    `</minimax:tool_call>` gibi hatalı MiniMax araç çağrısı XML’i kaldırılır
- kimlik bilgisi/token benzeri metin, döndürülmeden önce redakte edilir
- uzun metin blokları kısaltılır
- çok büyük geçmişlerde daha eski satırlar düşürülebilir veya aşırı büyük bir satır
  `[sessions_history omitted: message too large]` ile değiştirilebilir
- araç; `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` ve `bytes` gibi özet bayraklar bildirir

Her iki araç da bir **oturum anahtarı**nı (örneğin `"main"`) veya önceki bir liste çağrısından gelen bir **oturum kimliği**ni kabul eder.

Tam bayt düzeyinde transkripte ihtiyacınız varsa,
`sessions_history` çıktısını ham döküm gibi ele almak yerine diskteki transkript dosyasını inceleyin.

## Oturumlar arası mesaj gönderme

`sessions_send`, başka bir oturuma mesaj teslim eder ve isteğe bağlı olarak
yanıtı bekler:

- **Gönder ve unut:** kuyruğa ekleyip hemen dönmek için `timeoutSeconds: 0` ayarlayın.
- **Yanıtı bekle:** bir zaman aşımı ayarlayın ve yanıtı satır içi alın.

Hedef yanıt verdikten sonra OpenClaw, agent’ların
mesajları sırayla değiştirdiği bir **reply-back loop** çalıştırabilir (en fazla 5 tur). Hedef agent
erken durdurmak için `REPLY_SKIP` yanıtı verebilir.

## Durum ve orkestrasyon yardımcıları

`session_status`, geçerli
veya görünür başka bir oturum için hafif bir `/status` eşdeğeri araçtır. Kullanımı, zamanı, model/çalışma zamanı durumunu ve varsa
bağlı arka plan görevi bağlamını bildirir. `/status` gibi, en son transkript kullanım girdisinden seyrek token/önbellek sayaçlarını doldurabilir ve
`model=default` bir oturum başına geçersiz kılmayı temizler.

`sessions_yield`, beklediğiniz takip olayının
bir sonraki mesaj olabilmesi için geçerli turu kasıtlı olarak bitirir. Tamamlama sonuçlarının yoklama döngüleri oluşturmadan
bir sonraki mesaj olarak gelmesini istediğinizde, alt ajan başlattıktan sonra bunu kullanın.

`subagents`, zaten başlatılmış OpenClaw
alt ajanları için kontrol düzlemi yardımcısıdır. Şunları destekler:

- etkin/son çalıştırmaları incelemek için `action: "list"`
- çalışan bir alt sürece takip yönlendirmesi göndermek için `action: "steer"`
- tek bir alt süreci veya `all` değerini durdurmak için `action: "kill"`

## Alt ajan başlatma

`sessions_spawn`, bir arka plan görevi için yalıtılmış bir oturum oluşturur. Her zaman
engellemesizdir -- `runId` ve `childSessionKey` ile hemen döner.

Temel seçenekler:

- harici harness agent’ları için `runtime: "subagent"` (varsayılan) veya `"acp"`.
- alt oturum için `model` ve `thinking` geçersiz kılmaları.
- başlatmayı bir sohbet iş parçacığına bağlamak için `thread: true` (Discord, Slack vb.).
- alt süreçte sandbox zorlamak için `sandbox: "require"`.

Varsayılan yaprak alt ajanlar oturum araçları almaz. `maxSpawnDepth >= 2` olduğunda, derinlik-1 orkestratör alt ajanlar ayrıca
kendi çocuklarını yönetebilmeleri için
`sessions_spawn`, `subagents`, `sessions_list` ve `sessions_history` alır. Yaprak çalıştırmalar yine de özyineli
orkestrasyon araçları almaz.

Tamamlandıktan sonra bir duyuru adımı sonucu istekte bulunanın kanalına gönderir.
Tamamlama teslimi, varsa bağlı iş parçacığı/konu yönlendirmesini korur ve
tamamlama kökeni yalnızca bir kanalı tanımlıyorsa bile OpenClaw, doğrudan
teslim için istekte bulunan oturumun depolanmış yolunu (`lastChannel` / `lastTo`) yeniden kullanabilir.

ACP’ye özgü davranış için bkz. [ACP Agents](/tools/acp-agents).

## Görünürlük

Oturum araçları, agent’ın ne görebileceğini sınırlamak için kapsamlandırılır:

| Düzey   | Kapsam                                  |
| ------- | --------------------------------------- |
| `self`  | Yalnızca geçerli oturum                 |
| `tree`  | Geçerli oturum + başlatılmış alt ajanlar |
| `agent` | Bu agent için tüm oturumlar             |
| `all`   | Tüm oturumlar (yapılandırılmışsa agent’lar arası) |

Varsayılan `tree` değeridir. Sandbox içindeki oturumlar, yapılandırmadan bağımsız olarak
`tree` ile sınırlandırılır.

## Daha fazla bilgi

- [Session Management](/concepts/session) -- yönlendirme, yaşam döngüsü, bakım
- [ACP Agents](/tools/acp-agents) -- harici harness başlatma
- [Multi-agent](/concepts/multi-agent) -- çoklu agent mimarisi
- [Gateway Configuration](/gateway/configuration) -- oturum aracı yapılandırma ayarları
