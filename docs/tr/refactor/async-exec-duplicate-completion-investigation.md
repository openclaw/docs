---
read_when:
    - Yinelenen Node exec tamamlama olaylarında hata ayıklama
    - Heartbeat/sistem olayı tekilleştirmesi üzerinde çalışılıyor
summary: Yinelenen eşzamansız exec tamamlama eklemesi için inceleme notları
title: Eşzamansız exec yinelenen tamamlama incelemesi
x-i18n:
    generated_at: "2026-04-24T09:28:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: e448cdcff6c799bf7f40caea2698c3293d1a78ed85ba5ffdfe10f53ce125f0ab
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

## Kapsam

- Oturum: `agent:main:telegram:group:-1003774691294:topic:1`
- Belirti: aynı eşzamansız exec tamamlanması, `keen-nexus` oturum/çalıştırması için LCM içinde kullanıcı dönüşleri olarak iki kez kaydedildi.
- Hedef: bunun büyük olasılıkla yinelenen oturum eklemesi mi yoksa yalnızca düz giden teslim yeniden denemesi mi olduğunu belirlemek.

## Sonuç

Bunun en olası açıklaması, salt bir giden teslim yeniden denemesi değil, **yinelenen oturum eklemesi**dir.

Gateway tarafındaki en güçlü boşluk, **Node exec tamamlanma yolundadır**:

1. Node tarafındaki bir exec bitişi, tam `runId` ile `exec.finished` yayar.
2. Gateway `server-node-events`, bunu bir sistem olayına dönüştürür ve bir Heartbeat ister.
3. Heartbeat çalıştırması, boşaltılan sistem olayı bloğunu ajan istemine ekler.
4. Gömülü çalıştırıcı, bu istemi oturum transkriptine yeni bir kullanıcı dönüşü olarak kalıcılaştırır.

Herhangi bir nedenle aynı `exec.finished`, aynı `runId` için gateway'e iki kez ulaşırsa (replay, yeniden bağlanma yinelenmesi, yukarı akış yeniden gönderimi, yinelenmiş üretici), OpenClaw şu anda bu yolda `runId`/`contextKey` ile anahtarlanmış **hiçbir idempotency denetimine** sahip değildir. İkinci kopya, aynı içerikle ikinci bir kullanıcı mesajına dönüşür.

## Tam Kod Yolu

### 1. Üretici: Node exec tamamlanma olayı

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)`, olay olarak `exec.finished` içeren `node.event` yayar.
  - Yük, `sessionKey` ve tam `runId` içerir.

### 2. Gateway olay alımı

- `src/gateway/server-node-events.ts:574-640`
  - `exec.finished` olayını işler.
  - Şu metni oluşturur:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Bunu şu yolla kuyruğa alır:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Hemen bir uyandırma ister:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Sistem olayı tekilleştirme zayıflığı

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` yalnızca **ardışık yinelenen metni** bastırır:
    - `if (entry.lastText === cleaned) return false`
  - `contextKey` depolar, ancak `contextKey` değerini idempotency için **kullanmaz**.
  - Boşaltmadan sonra yinelenen bastırması sıfırlanır.

Bu, aynı `runId` ile replay edilen bir `exec.finished` olayının, kod zaten kararlı bir idempotency adayı (`exec:<runId>`) içeriyor olsa bile daha sonra yeniden kabul edilebileceği anlamına gelir.

### 4. Uyandırma işlemesi birincil yineleyici değildir

- `src/infra/heartbeat-wake.ts:79-117`
  - Uyandırmalar `(agentId, sessionKey)` temelinde birleştirilir.
  - Aynı hedef için yinelenen uyandırma istekleri tek bir bekleyen uyandırma girdisine çöker.

Bu, **yalnızca yinelenen uyandırma işlemesinin** yinelenen olay alımına göre daha zayıf bir açıklama olmasını sağlar.

### 5. Heartbeat olayı tüketir ve istem girdisine dönüştürür

- `src/infra/heartbeat-runner.ts:535-574`
  - Preflight, bekleyen sistem olaylarına bakar ve exec-event çalıştırmalarını sınıflandırır.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)`, oturum için kuyruğu boşaltır.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - Boşaltılan sistem olayı bloğu, ajan istem gövdesinin başına eklenir.

### 6. Transkript ekleme noktası

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)`, tam istemi gömülü PI oturumuna gönderir.
  - Tamamlanmadan türetilmiş istemin kalıcı kullanıcı dönüşüne dönüştüğü nokta budur.

Dolayısıyla aynı sistem olayı istem içinde iki kez yeniden kurulursa, LCM'de yinelenen kullanıcı mesajları beklenir.

## Neden düz giden teslim yeniden denemesi daha az olası

Heartbeat çalıştırıcısında gerçek bir giden hata yolu vardır:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - Önce yanıt üretilir.
  - Giden teslim daha sonra `deliverOutboundPayloads(...)` aracılığıyla gerçekleşir.
  - Buradaki hata `{ status: "failed" }` döndürür.

Ancak aynı sistem olayı kuyruğu girdisi için, bu tek başına **yinelenen kullanıcı dönüşlerini** açıklamak için yeterli değildir:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - Sistem olayı kuyruğu, giden teslimden önce zaten boşaltılmıştır.

Bu nedenle tek başına bir kanal gönderme yeniden denemesi, aynı kuyruklanmış olayı yeniden oluşturmaz. Eksik/başarısız harici teslimatı açıklayabilir, ancak tek başına ikinci özdeş oturum kullanıcı mesajını açıklayamaz.

## İkincil, daha düşük güvenli olasılık

Ajan çalıştırıcısında tam çalıştırma yeniden deneme döngüsü vardır:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Bazı geçici hatalar tüm çalıştırmayı yeniden deneyebilir ve aynı `commandBody` değerini tekrar gönderebilir.

Bu, istem yeniden deneme koşulu tetiklenmeden önce zaten eklenmişse, **aynı yanıt yürütmesi içinde** kalıcı bir kullanıcı istemini yineleyebilir.

Bunu, yinelenen `exec.finished` alımına göre daha düşük sıraya koyuyorum çünkü:

- gözlenen boşluk yaklaşık 51 saniyeydi; bu da süreç içi yeniden denemeden çok ikinci bir uyandırma/dönüşe benziyor;
- rapor zaten tekrar eden mesaj gönderme hatalarından bahsediyor; bu da anlık model/çalışma zamanı yeniden denemesinden çok daha sonra gelen ayrı bir dönüşe işaret ediyor.

## Kök Neden Hipotezi

En yüksek güvenli hipotez:

- `keen-nexus` tamamlanması **Node exec olay yolu** üzerinden geldi.
- Aynı `exec.finished`, `server-node-events` bileşenine iki kez teslim edildi.
- Gateway, `enqueueSystemEvent(...)` işlemi `contextKey` / `runId` ile tekilleştirme yapmadığı için ikisini de kabul etti.
- Kabul edilen her olay bir Heartbeat tetikledi ve PI transkriptine kullanıcı dönüşü olarak eklendi.

## Önerilen Küçük Cerrahi Düzeltme

Bir düzeltme isteniyorsa, en küçük yüksek değerli değişiklik şudur:

- exec/sistem olayı idempotency'sinin `contextKey` değerini kısa bir ufuk için dikkate almasını sağlamak; en azından tam `(sessionKey, contextKey, text)` tekrarları için;
- veya `server-node-events` içinde `(sessionKey, runId, olay türü)` ile anahtarlanmış, `exec.finished` için özel bir tekilleştirme eklemek.

Bu, replay edilen `exec.finished` yinelemelerini oturum dönüşlerine dönüşmeden önce doğrudan engeller.

## İlgili

- [Exec aracı](/tr/tools/exec)
- [Oturum yönetimi](/tr/concepts/session)
