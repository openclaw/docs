---
read_when:
    - Bağlam motoru yaşam döngüsü davranışını Codex harness’ına bağlıyorsunuz
    - lossless-claw veya başka bir bağlam motoru Plugin'inin codex/* gömülü harness oturumlarıyla çalışmasına ihtiyacınız var
    - Gömülü PI ve Codex app-server bağlam davranışını karşılaştırıyorsunuz
summary: Paketle gelen Codex app-server harness’ının OpenClaw bağlam motoru Plugin'lerini dikkate almasını sağlama belirtimi
title: Codex Harness Bağlam Motoru Taşıması
x-i18n:
    generated_at: "2026-04-24T09:18:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d6b106915f2888337cb08c831c1722770ad8ec6612c575efe88fe2fc263dec5
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

# Codex Harness Bağlam Motoru Taşıması

## Durum

Taslak uygulama belirtimi.

## Hedef

Paketle gelen Codex app-server harness’ının, gömülü PI dönüşlerinin zaten dikkate aldığı aynı OpenClaw bağlam motoru yaşam döngüsü sözleşmesini dikkate almasını sağlamak.

`agents.defaults.embeddedHarness.runtime: "codex"` veya
bir `codex/*` modeli kullanan bir oturum, seçilen bağlam motoru Plugin'inin, örneğin
`lossless-claw`, bağlam oluşturmayı, dönüş sonrası alımı, bakımı ve
OpenClaw düzeyi Compaction ilkesini Codex app-server sınırının izin verdiği ölçüde denetlemesine yine de izin vermelidir.

## Hedef dışı konular

- Codex app-server iç işleyişini yeniden uygulamayın.
- Codex doğal iş parçacığı Compaction'ının lossless-claw özeti üretmesini sağlamayın.
- Codex dışı modellerin Codex harness’ını kullanmasını zorunlu kılmayın.
- ACP/acpx oturum davranışını değiştirmeyin. Bu belirtim yalnızca
  ACP olmayan gömülü aracı harness yolu içindir.
- Üçüncü taraf Plugin'lerin Codex app-server uzantı fabrikaları kaydetmesini sağlamayın;
  mevcut paketlenmiş Plugin güven sınırı değişmeden kalır.

## Geçerli mimari

Gömülü çalıştırma döngüsü, somut düşük düzeyli bir harness seçmeden önce
çalıştırma başına yapılandırılmış bağlam motorunu bir kez çözer:

- `src/agents/pi-embedded-runner/run.ts`
  - bağlam motoru Plugin'lerini başlatır
  - `resolveContextEngine(params.config)` çağırır
  - `contextEngine` ve `contextTokenBudget` değerlerini
    `runEmbeddedAttemptWithBackend(...)` içine geçirir

`runEmbeddedAttemptWithBackend(...)`, seçilen aracı harness’ına devreder:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex app-server harness’ı paketlenmiş Codex Plugin'i tarafından kaydedilir:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Codex harness uygulaması, PI destekli denemelerle aynı `EmbeddedRunAttemptParams`
nesnesini alır:

- `extensions/codex/src/app-server/run-attempt.ts`

Bu, gerekli hook noktasının OpenClaw denetimindeki kod içinde olduğu anlamına gelir. Harici
sınır, Codex app-server protokolünün kendisidir: OpenClaw `thread/start`, `thread/resume` ve
`turn/start` için ne gönderdiğini denetleyebilir ve bildirimleri gözlemleyebilir, ancak
Codex’in dahili iş parçacığı deposunu veya doğal Compaction'ını değiştiremez.

## Geçerli boşluk

Gömülü PI denemeleri bağlam motoru yaşam döngüsünü doğrudan çağırır:

- denemeden önce bootstrap/bakım
- model çağrısından önce assemble
- denemeden sonra afterTurn veya ingest
- başarılı bir dönüşten sonra bakım
- Compaction'a sahip motorlar için bağlam motoru Compaction'ı

İlgili PI kodu:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex app-server denemeleri şu anda genel aracı-harness hook'larını çalıştırır ve
transkripti yansıtır, ancak `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` veya
`params.contextEngine.maintain` çağrılarını yapmaz.

İlgili Codex kodu:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## İstenen davranış

Codex harness dönüşleri için OpenClaw şu yaşam döngüsünü korumalıdır:

1. Yansıtılmış OpenClaw oturum transkriptini oku.
2. Önceki bir oturum dosyası varsa etkin bağlam motorunu bootstrap et.
3. Varsa bootstrap bakımını çalıştır.
4. Etkin bağlam motorunu kullanarak bağlamı assemble et.
5. Assemble edilen bağlamı Codex uyumlu girdilere dönüştür.
6. Bağlam motoru `systemPromptAddition` değerini içeren geliştirici yönergeleriyle
   Codex iş parçacığını başlat veya sürdür.
7. Assemble edilen kullanıcıya dönük istemle Codex dönüşünü başlat.
8. Codex sonucunu OpenClaw transkriptine geri yansıt.
9. Uygulanmışsa `afterTurn`, aksi halde yansıtılmış transkript anlık görüntüsünü kullanarak
   `ingestBatch`/`ingest` çağır.
10. Başarılı, iptal edilmemiş dönüşlerden sonra dönüş bakımını çalıştır.
11. Codex doğal Compaction sinyallerini ve OpenClaw Compaction hook'larını koru.

## Tasarım kısıtları

### Codex app-server doğal iş parçacığı durumu için kanonik kalır

Codex, doğal iş parçacığını ve tüm dahili genişletilmiş geçmişi sahiplenir. OpenClaw
app-server’ın dahili geçmişini desteklenen protokol çağrıları dışında değiştirmeye çalışmamalıdır.

OpenClaw’ın transkript yansıması OpenClaw özellikleri için kaynak olarak kalır:

- sohbet geçmişi
- arama
- `/new` ve `/reset` kayıt işlemleri
- gelecekte model veya harness değiştirme
- bağlam motoru Plugin durumu

### Bağlam motoru assembly’si Codex girdilerine yansıtılmalıdır

Bağlam motoru arayüzü bir Codex
iş parçacığı yaması değil, OpenClaw `AgentMessage[]` döndürür. Codex app-server `turn/start` geçerli kullanıcı girdisini kabul ederken,
`thread/start` ve `thread/resume` geliştirici yönergelerini kabul eder.

Bu nedenle uygulamanın bir yansıtma katmanına ihtiyacı vardır. Güvenli ilk sürüm
Codex dahili geçmişini değiştirebiliyormuş gibi davranmaktan kaçınmalıdır. Assemble edilen bağlamı
geçerli dönüş çevresinde deterministik istem/geliştirici yönergesi materyali olarak enjekte etmelidir.

### İstem önbelleği kararlılığı önemlidir

lossless-claw gibi motorlar için assemble edilen bağlam, değişmeyen girdiler için deterministik olmalıdır.
Üretilen bağlam metnine zaman damgaları, rastgele kimlikler veya belirlenemeyen sıralama eklemeyin.

### PI geri dönüş semantiği değişmez

Harness seçimi olduğu gibi kalır:

- `runtime: "pi"` PI’yi zorlar
- `runtime: "codex"` kayıtlı Codex harness’ını seçer
- `runtime: "auto"` Plugin harness’larının desteklenen sağlayıcıları sahiplenmesine izin verir
- `fallback: "none"` eşleşen Plugin harness’ı olmadığında PI geri dönüşünü devre dışı bırakır

Bu çalışma Codex harness’ı seçildikten sonra ne olduğunu değiştirir.

## Uygulama planı

### 1. Yeniden kullanılabilir bağlam motoru deneme yardımcılarını dışa aktarın veya taşıyın

Bugün yeniden kullanılabilir yaşam döngüsü yardımcıları PI çalıştırıcısı altında yaşıyor:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Mümkünse Codex, adı PI’yi ima eden bir uygulama yolundan içe aktarmamalıdır.

Örneğin harness’ten bağımsız bir modül oluşturun:

- `src/agents/harness/context-engine-lifecycle.ts`

Taşıyın veya yeniden dışa aktarın:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- `runContextEngineMaintenance` için küçük bir sarmalayıcı

Eski dosyalardan yeniden dışa aktararak veya aynı PR içinde PI çağrı noktalarını
güncelleyerek PI içe aktarmalarını çalışır tutun.

Tarafsız yardımcı adları PI’den söz etmemelidir.

Önerilen adlar:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Bir Codex bağlam yansıtma yardımcısı ekleyin

Yeni bir modül ekleyin:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Sorumluluklar:

- Assemble edilmiş `AgentMessage[]`, özgün yansıtılmış geçmiş ve geçerli
  istemi kabul edin.
- Hangi bağlamın geliştirici yönergelerinde, hangisinin geçerli kullanıcı
  girdisinde yer alacağını belirleyin.
- Geçerli kullanıcı istemini son eyleme geçirilebilir istek olarak koruyun.
- Önceki mesajları kararlı, açık bir biçimde oluşturun.
- Değişken meta verilerden kaçının.

Önerilen API:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

Önerilen ilk yansıtma:

- `systemPromptAddition` değerini geliştirici yönergelerine koyun.
- Assemble edilen transkript bağlamını geçerli istemden önce `promptText` içine koyun.
- Bunu OpenClaw assemble edilmiş bağlamı olarak açıkça etiketleyin.
- Geçerli istemi en sona koyun.
- Kuyrukta zaten görünüyorsa yinelenen geçerli kullanıcı istemini hariç tutun.

Örnek istem biçimi:

```text
Bu dönüş için OpenClaw tarafından assemble edilmiş bağlam:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Geçerli kullanıcı isteği:
...
```

Bu, doğal Codex geçmişi cerrahisinden daha az zariftir, ancak OpenClaw içinde uygulanabilir
ve bağlam motoru semantiğini korur.

Gelecekteki iyileştirme: Codex app-server iş parçacığı geçmişini değiştirmek veya
tamamlamak için bir protokol açığa çıkarırsa bu yansıtma katmanını o API’yi kullanacak şekilde değiştirin.

### 3. Codex iş parçacığı başlangıcından önce bootstrap’i bağlayın

`extensions/codex/src/app-server/run-attempt.ts` içinde:

- Bugünkü gibi yansıtılmış oturum geçmişini okuyun.
- Oturum dosyasının bu çalıştırmadan önce var olup olmadığını belirleyin. Tercihen,
  yansıtma yazımlarından önce `fs.stat(params.sessionFile)` kontrol eden bir yardımcı kullanın.
- Yardımcı bunu gerektiriyorsa bir `SessionManager` açın veya dar bir oturum yöneticisi bağdaştırıcısı kullanın.
- `params.contextEngine` mevcut olduğunda tarafsız bootstrap yardımcısını çağırın.

Sahte akış:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Codex araç köprüsü ve transkript yansıması ile aynı `sessionKey` kuralını kullanın. Bugün Codex,
`params.sessionKey` veya `params.sessionId` değerinden `sandboxSessionKey` hesaplıyor; ham `params.sessionKey` değerini korumak için bir neden yoksa bunu tutarlı biçimde kullanın.

### 4. `thread/start` / `thread/resume` ve `turn/start` öncesi assemble’i bağlayın

`runCodexAppServerAttempt` içinde:

1. Önce dinamik araçları oluşturun, böylece bağlam motoru gerçekten mevcut
   araç adlarını görür.
2. Yansıtılmış oturum geçmişini okuyun.
3. `params.contextEngine` mevcut olduğunda bağlam motoru `assemble(...)` çalıştırın.
4. Assemble edilen sonucu şunlara yansıtın:
   - geliştirici yönergesi eklemesi
   - `turn/start` için istem metni

Mevcut hook çağrısı:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

bağlam farkındalıklı hâle gelmelidir:

1. `buildDeveloperInstructions(params)` ile temel geliştirici yönergelerini hesaplayın
2. bağlam motoru assembly/yansıtmayı uygulayın
3. Yansıtılan istem/geliştirici yönergeleriyle `before_prompt_build` çalıştırın

Bu sıra, genel istem hook'larının Codex’in alacağı aynı istemi görmesini sağlar. Sıkı PI eşliği gerekiyorsa,
istem işlem hattısından sonra bağlam motoru `systemPromptAddition` değerini son sistem istemine uyguladığından,
hook birleşiminden önce bağlam motoru assembly’sini çalıştırın. Önemli değişmez, hem bağlam
motorunun hem de hook'ların deterministik, belgelenmiş bir sıra elde etmesidir.

İlk uygulama için önerilen sıra:

1. `buildDeveloperInstructions(params)`
2. bağlam motoru `assemble()`
3. `systemPromptAddition` değerini geliştirici yönergelerine ekle/önüne koy
4. assemble edilen mesajları istem metnine yansıt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. son geliştirici yönergelerini `startOrResumeThread(...)` içine geçir
7. son istem metnini `buildTurnStartParams(...)` içine geçir

Belirtim testlerde kodlanmalıdır; böylece gelecekteki değişiklikler bunu kazara yeniden sıralamaz.

### 5. İstem önbelleği açısından kararlı biçimlendirmeyi koruyun

Yansıtma yardımcısı aynı girdiler için bayt düzeyinde kararlı çıktı üretmelidir:

- kararlı mesaj sırası
- kararlı rol etiketleri
- üretilmiş zaman damgaları yok
- nesne anahtarı sırası sızıntısı yok
- rastgele ayraçlar yok
- çalıştırma başına kimlik yok

Sabit ayraçlar ve açık bölümler kullanın.

### 6. Transkript yansımasından sonra dönüş sonrasını bağlayın

Codex’in `CodexAppServerEventProjector` bileşeni geçerli dönüş için yerel bir `messagesSnapshot` oluşturur. `mirrorTranscriptBestEffort(...)` bu anlık görüntüyü OpenClaw transkript yansımasına yazar.

Yansıtma başarılı da olsa başarısız da olsa, mevcut en iyi mesaj anlık görüntüsüyle bağlam motoru sonlandırıcısını çağırın:

- `afterTurn`, yalnızca geçerli dönüşü değil, oturum anlık görüntüsünü beklediğinden, yazımdan sonraki tam yansıtılmış oturum bağlamını tercih edin.
- Oturum dosyası yeniden açılamazsa `historyMessages + result.messagesSnapshot` değerine geri düşün.

Sahte akış:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

Yansıtma başarısız olursa yine de geri dönüş anlık görüntüsüyle `afterTurn` çağırın, ancak bağlam motorunun geri dönüş dönüş verisinden alım yaptığını günlüğe kaydedin.

### 7. Kullanım ve istem önbelleği çalışma zamanı bağlamını normalleştirin

Codex sonuçları, varsa app-server token bildirimlerinden normalleştirilmiş kullanım içerir. Bu kullanımı bağlam motoru çalışma zamanı bağlamına geçirin.

Codex app-server sonunda önbellek okuma/yazma ayrıntılarını açığa çıkarırsa bunları `ContextEnginePromptCacheInfo` içine eşleyin. O zamana kadar sıfır uydurmak yerine `promptCache` alanını atlayın.

### 8. Compaction ilkesi

İki Compaction sistemi vardır:

1. OpenClaw bağlam motoru `compact()`
2. Codex app-server doğal `thread/compact/start`

Bunları sessizce birleştirmeyin.

#### `/compact` ve açık OpenClaw Compaction'ı

Seçilen bağlam motorunda `info.ownsCompaction === true` varsa açık
OpenClaw Compaction'ı OpenClaw transkript yansıması ve Plugin durumu için
bağlam motorunun `compact()` sonucunu tercih etmelidir.

Seçilen Codex harness’ında doğal bir iş parçacığı bağı varsa app-server iş parçacığını sağlıklı tutmak için
ek olarak Codex doğal Compaction isteyebiliriz, ancak bu ayrıntılarda ayrı bir arka uç eylemi olarak raporlanmalıdır.

Önerilen davranış:

- Eğer `contextEngine.info.ownsCompaction === true` ise:
  - önce bağlam motoru `compact()` çağrılır
  - ardından bir iş parçacığı bağı varsa en iyi çabayla Codex doğal Compaction çağrılır
  - birincil sonuç olarak bağlam motoru sonucu döndürülür
  - Codex doğal Compaction durumu `details.codexNativeCompaction` içine dahil edilir
- Etkin bağlam motoru Compaction'a sahip değilse:
  - mevcut Codex doğal Compaction davranışı korunur

Bu, `extensions/codex/src/app-server/compact.ts` dosyasını değiştirmeyi veya
`maybeCompactAgentHarnessSession(...)` nerede çağrıldığına bağlı olarak bunu genel Compaction yolundan
sarmalamayı gerektirebilir.

#### Dönüş içi Codex doğal `contextCompaction` olayları

Codex bir dönüş sırasında `contextCompaction` öğe olayları yayabilir. `event-projector.ts` içinde mevcut
Compaction öncesi/sonrası hook üretimini koruyun, ancak bunu tamamlanmış bir bağlam motoru Compaction'ı olarak ele almayın.

Compaction'a sahip motorlar için Codex yine de doğal Compaction yaptığında açık bir tanılama üretin:

- akış/olay adı: mevcut `compaction` akışı kabul edilebilir
- ayrıntılar: `{ backend: "codex-app-server", ownsCompaction: true }`

Bu ayrımı denetlenebilir kılar.

### 9. Oturum sıfırlama ve bağlama davranışı

Mevcut Codex harness `reset(...)` davranışı, OpenClaw oturum dosyasından Codex app-server bağını temizler. Bu davranışı koruyun.

Ayrıca bağlam motoru durum temizliğinin mevcut
OpenClaw oturum yaşam döngüsü yolları üzerinden devam ettiğinden emin olun. Bağlam motoru yaşam döngüsü şu anda tüm harness’lar için sıfırlama/silme olaylarını kaçırmıyorsa Codex’e özgü temizlik eklemeyin.

### 10. Hata yönetimi

PI semantiğini izleyin:

- bootstrap hataları uyarır ve devam eder
- assemble hataları uyarır ve assemble edilmemiş işlem hattı mesajlarına/isteme geri döner
- afterTurn/ingest hataları uyarır ve dönüş sonrası sonlandırmayı başarısız olarak işaretler
- bakım yalnızca başarılı, iptal edilmemiş, yield yapılmamış dönüşlerden sonra çalışır
- Compaction hataları yeni istemler olarak yeniden denenmemelidir

Codex’e özgü eklemeler:

- Bağlam yansıtma başarısız olursa uyarın ve özgün isteme geri dönün.
- Transkript yansıması başarısız olursa yine de geri dönüş mesajlarıyla bağlam motoru sonlandırmasını deneyin.
- Bağlam motoru Compaction'ı başarılı olduktan sonra Codex doğal Compaction'ı başarısız olursa,
  bağlam motoru birincil olduğunda tüm OpenClaw Compaction'ını başarısız kılmayın.

## Test planı

### Birim testleri

`extensions/codex/src/app-server` altında testler ekleyin:

1. `run-attempt.context-engine.test.ts`
   - Bir oturum dosyası varsa Codex `bootstrap` çağırır.
   - Codex, yansıtılmış mesajlar, token bütçesi, araç adları,
     citations mode, model kimliği ve istem ile `assemble` çağırır.
   - `systemPromptAddition` geliştirici yönergelerine dahil edilir.
   - Assemble edilen mesajlar geçerli istekten önce isteme yansıtılır.
   - Codex, transkript yansımasından sonra `afterTurn` çağırır.
   - `afterTurn` yoksa Codex `ingestBatch` veya mesaj başına `ingest` çağırır.
   - Dönüş bakımı başarılı dönüşlerden sonra çalışır.
   - Dönüş bakımı istem hatası, iptal veya yield iptalinde çalışmaz.

2. `context-engine-projection.test.ts`
   - aynı girdiler için kararlı çıktı
   - assemble edilmiş geçmiş onu içerdiğinde yinelenen geçerli istem yok
   - boş geçmişi işler
   - rol sırasını korur
   - sistem istemi eklemesini yalnızca geliştirici yönergelerine dahil eder

3. `compact.context-engine.test.ts`
   - Compaction'a sahip bağlam motorunun birincil sonucu kazanır
   - Codex doğal Compaction durumu, o da denendiğinde ayrıntılarda görünür
   - Codex doğal başarısızlığı, Compaction'a sahip bağlam motoru Compaction'ını başarısız kılmaz
   - Compaction'a sahip olmayan bağlam motoru mevcut doğal Compaction davranışını korur

### Güncellenecek mevcut testler

- `extensions/codex/src/app-server/run-attempt.test.ts` varsa, yoksa
  en yakın Codex app-server çalıştırma testleri.
- `extensions/codex/src/app-server/event-projector.test.ts` yalnızca Compaction
  olay ayrıntıları değişirse.
- `src/agents/harness/selection.test.ts`, yapılandırma
  davranışı değişmedikçe değişiklik gerektirmemelidir; kararlı kalmalıdır.
- PI bağlam motoru testleri değişmeden geçmeye devam etmelidir.

### Entegrasyon / canlı testler

Canlı Codex harness smoke testlerini ekleyin veya genişletin:

- `plugins.slots.contextEngine` değerini bir test motoruna yapılandırın
- `agents.defaults.model` değerini bir `codex/*` modeline yapılandırın
- `agents.defaults.embeddedHarness.runtime = "codex"` yapılandırın
- test motorunun şunları gözlemlediğini doğrulayın:
  - bootstrap
  - assemble
  - afterTurn veya ingest
  - bakım

OpenClaw çekirdek testlerinde lossless-claw gerektirmekten kaçının. Depo içindeki küçük bir sahte
bağlam motoru Plugin'i kullanın.

## Gözlemlenebilirlik

Codex bağlam motoru yaşam döngüsü çağrıları çevresine hata ayıklama günlükleri ekleyin:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` neden ile birlikte
- `codex native compaction completed alongside context-engine compaction`

Tam istemleri veya transkript içeriklerini günlüğe kaydetmekten kaçının.

Yararlı olduğu yerlerde yapılandırılmış alanlar ekleyin:

- `sessionId`
- `sessionKey`, mevcut günlükleme uygulamasına göre sansürlenmiş veya çıkarılmış
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Taşıma / uyumluluk

Bu geriye dönük uyumlu olmalıdır:

- Hiçbir bağlam motoru yapılandırılmamışsa eski bağlam motoru davranışı
  bugünkü Codex harness davranışına eşdeğer olmalıdır.
- Bağlam motoru `assemble` başarısız olursa Codex özgün
  istem yoluyla devam etmelidir.
- Mevcut Codex iş parçacığı bağları geçerli kalmalıdır.
- Dinamik araç parmak izi bağlam motoru çıktısını içermemelidir; aksi takdirde
  her bağlam değişikliği yeni bir Codex iş parçacığını zorlayabilir. Yalnızca araç kataloğu
  dinamik araç parmak izini etkilemelidir.

## Açık sorular

1. Assemble edilen bağlam bütünüyle kullanıcı istemine mi, bütünüyle
   geliştirici yönergelerine mi, yoksa bölünmüş mü enjekte edilmeli?

   Öneri: bölünmüş. `systemPromptAddition` değerini geliştirici yönergelerine koyun;
   assemble edilmiş transkript bağlamını kullanıcı istemi sarmalayıcısına koyun. Bu en iyi şekilde
   doğal iş parçacığı geçmişini değiştirmeden geçerli Codex protokolüyle eşleşir.

2. Bir bağlam motoru Compaction'a sahipse Codex doğal Compaction
   devre dışı bırakılmalı mı?

   Öneri: hayır, en azından başlangıçta değil. Codex doğal Compaction yine de
   app-server iş parçacığını canlı tutmak için gerekli olabilir. Ancak bu
   bağlam motoru Compaction'ı olarak değil, doğal Codex Compaction'ı olarak raporlanmalıdır.

3. `before_prompt_build`, bağlam motoru assembly’sinden önce mi sonra mı çalışmalı?

   Öneri: Codex için bağlam motoru yansıtmasından sonra, böylece genel harness
   hook'ları Codex’in gerçekten alacağı istem/geliştirici yönergelerini görür. PI
   eşliği tersi sırayı gerektiriyorsa seçilen sırayı testlerde kodlayın ve burada
   belgeleyin.

4. Codex app-server gelecekte yapılandırılmış bir bağlam/geçmiş geçersiz kılmasını kabul edebilir mi?

   Bilinmiyor. Eğer kabul edebiliyorsa metin yansıtma katmanını o protokolle değiştirin ve
   yaşam döngüsü çağrılarını aynı tutun.

## Kabul ölçütleri

- Bir `codex/*` gömülü harness dönüşü seçilen bağlam motorunun
  assemble yaşam döngüsünü çağırır.
- Bir bağlam motoru `systemPromptAddition`, Codex geliştirici yönergelerini etkiler.
- Assemble edilen bağlam Codex dönüş girdisini deterministik olarak etkiler.
- Başarılı Codex dönüşleri `afterTurn` veya ingest geri dönüşünü çağırır.
- Başarılı Codex dönüşleri bağlam motoru dönüş bakımını çalıştırır.
- Başarısız/iptal edilmiş/yield iptal edilmiş dönüşler dönüş bakımını çalıştırmaz.
- Bağlam motoruna ait Compaction, OpenClaw/Plugin durumu için birincil kalır.
- Codex doğal Compaction, doğal Codex davranışı olarak denetlenebilir kalır.
- Mevcut PI bağlam motoru davranışı değişmez.
- Eski olmayan bir bağlam motoru seçilmediğinde veya assembly başarısız olduğunda
  mevcut Codex harness davranışı değişmez.
