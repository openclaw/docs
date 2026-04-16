---
x-i18n:
    generated_at: "2026-04-16T08:53:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95e56c5411204363676f002059c942201503e2359515d1a4b409882cc2e04920
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# Async Exec Çift Tamamlanma İncelemesi

## Kapsam

- Oturum: `agent:main:telegram:group:-1003774691294:topic:1`
- Belirti: aynı async exec completion, `keen-nexus` oturum/çalıştırması için LCM'de iki kez kullanıcı turu olarak kaydedildi.
- Amaç: bunun büyük olasılıkla yinelenen oturum enjeksiyonu mu yoksa basit bir giden teslimat yeniden denemesi mi olduğunu belirlemek.

## Sonuç

Bu büyük olasılıkla saf bir giden teslimat yeniden denemesi değil, **yinelenen oturum enjeksiyonu**.

Gateway tarafındaki en güçlü boşluk, **node exec completion yolunda**:

1. Node tarafındaki bir exec bitişi, tam `runId` ile `exec.finished` yayar.
2. Gateway `server-node-events`, bunu bir sistem olayına dönüştürür ve bir Heartbeat ister.
3. Heartbeat çalıştırması, boşaltılmış sistem olayı bloğunu agent prompt'una enjekte eder.
4. Gömülü runner, bu prompt'u oturum transkriptine yeni bir kullanıcı turu olarak kalıcılaştırır.

Aynı `exec.finished`, herhangi bir nedenle aynı `runId` için gateway'e iki kez ulaşırsa (yeniden oynatma, yeniden bağlanma kopyası, upstream yeniden gönderim, yinelenmiş üretici), OpenClaw şu anda bu yol üzerinde `runId`/`contextKey` ile anahtarlanan **bir idempotency kontrolüne sahip değil**. İkinci kopya da aynı içerikle ikinci bir kullanıcı mesajına dönüşür.

## Kesin Kod Yolu

### 1. Üretici: node exec completion olayı

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)`, olay `exec.finished` olacak şekilde `node.event` yayar.
  - Payload, `sessionKey` ve tam `runId` içerir.

### 2. Gateway olay alımı

- `src/gateway/server-node-events.ts:574-640`
  - `exec.finished` olayını işler.
  - Metni oluşturur:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Bunu şu şekilde kuyruğa alır:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Hemen ardından bir wake ister:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Sistem olayı dedupe zayıflığı

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` yalnızca **ardışık yinelenen metni** bastırır:
    - `if (entry.lastText === cleaned) return false`
  - `contextKey` saklar, ancak `contextKey`'i idempotency için **kullanmaz**.
  - Drain sonrasında yinelenen bastırma sıfırlanır.

Bu şu anlama gelir: aynı `runId` ile yeniden oynatılmış bir `exec.finished`, kod zaten kararlı bir idempotency adayı (`exec:<runId>`) içermesine rağmen daha sonra tekrar kabul edilebilir.

### 4. Wake işleme birincil çoğaltıcı değil

- `src/infra/heartbeat-wake.ts:79-117`
  - Wake'ler `(agentId, sessionKey)` ile birleştirilir.
  - Aynı hedef için yinelenen wake istekleri tek bir bekleyen wake girdisine çöker.

Bu da **tek başına yinelenen wake işlemenin**, yinelenen olay alımına kıyasla daha zayıf bir açıklama olmasını sağlar.

### 5. Heartbeat olayı tüketir ve prompt girdisine dönüştürür

- `src/infra/heartbeat-runner.ts:535-574`
  - Preflight, bekleyen sistem olaylarına bakar ve exec-event çalıştırmalarını sınıflandırır.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)`, oturum için kuyruğu boşaltır.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - Boşaltılmış sistem olayı bloğu, agent prompt gövdesinin başına eklenir.

### 6. Transkript enjeksiyon noktası

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)`, tam prompt'u gömülü PI oturumuna gönderir.
  - Completion'dan türetilen prompt'un kalıcı bir kullanıcı turuna dönüştüğü nokta burasıdır.

Dolayısıyla aynı sistem olayı iki kez prompt içine yeniden kurulursa, LCM'de yinelenen kullanıcı mesajları beklenen bir sonuçtur.

## Neden basit giden teslimat yeniden denemesi daha az olası

Heartbeat runner içinde gerçek bir giden hata yolu var:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - Yanıt önce üretilir.
  - Giden teslimat daha sonra `deliverOutboundPayloads(...)` aracılığıyla gerçekleşir.
  - Buradaki hata `{ status: "failed" }` döndürür.

Ancak aynı sistem olayı kuyruğu girdisi için, bu tek başına yinelenen kullanıcı turlarını açıklamak için **yeterli değildir**:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - Sistem olayı kuyruğu, giden teslimattan önce zaten boşaltılmıştır.

Yani bir kanal gönderim yeniden denemesi tek başına aynı kuyruklanmış olayı yeniden oluşturmaz. Harici teslimatın eksik/başarısız olmasını açıklayabilir, ancak tek başına ikinci özdeş oturum kullanıcı mesajını açıklamaz.

## İkincil, daha düşük güvenli olasılık

Agent runner içinde tam çalıştırma yeniden deneme döngüsü vardır:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Bazı geçici hatalar, tüm çalıştırmayı yeniden deneyebilir ve aynı `commandBody`'yi yeniden gönderebilir.

Bu, prompt zaten eklenmişken yeniden deneme koşulu tetiklenirse, **aynı yanıt yürütmesi içinde** kalıcılaştırılmış bir kullanıcı prompt'unu çoğaltabilir.

Bunu, yinelenen `exec.finished` alımına göre daha düşük sıraya koyuyorum çünkü:

- gözlemlenen boşluk yaklaşık 51 saniyeydi; bu da süreç içi bir yeniden denemeden çok ikinci bir wake/tur gibi görünüyor;
- rapor zaten tekrarlanan mesaj gönderim hatalarından bahsediyor; bu da anlık model/runtime yeniden denemesinden çok daha sonraki ayrı bir tura işaret ediyor.

## Kök Neden Hipotezi

En yüksek güvenli hipotez:

- `keen-nexus` completion, **node exec olay yolu** üzerinden geldi.
- Aynı `exec.finished`, `server-node-events`'e iki kez teslim edildi.
- Gateway ikisini de kabul etti çünkü `enqueueSystemEvent(...)`, `contextKey` / `runId` ile dedupe yapmıyor.
- Kabul edilen her olay bir Heartbeat tetikledi ve PI transkriptine kullanıcı turu olarak enjekte edildi.

## Önerilen Küçük ve Cerrahi Düzeltme

Bir düzeltme isteniyorsa, en küçük ve en yüksek değerli değişiklik şu olur:

- exec/sistem olayı idempotency'sinin, en azından tam `(sessionKey, contextKey, text)` tekrarları için, `contextKey`'i kısa bir ufuk boyunca dikkate almasını sağlamak;
- veya `server-node-events` içinde `(sessionKey, runId, event kind)` ile anahtarlanan `exec.finished` için özel bir dedupe eklemek.

Bu, yeniden oynatılmış `exec.finished` kopyalarını oturum turlarına dönüşmeden önce doğrudan engeller.
