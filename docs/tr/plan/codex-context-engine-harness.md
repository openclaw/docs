---
read_when:
    - context-engine yaşam döngüsü davranışını Codex harness'a bağlıyorsunuz
    - codex/* yerleşik test düzeneği oturumlarıyla çalışmak için lossless-claw veya başka bir bağlam motoru Plugin'i gerekir
    - Gömülü OpenClaw ve Codex uygulama sunucusu bağlam davranışını karşılaştırıyorsunuz
summary: Paketle gelen Codex app-server harness'ının OpenClaw context-engine Plugin'lerini dikkate almasını sağlama belirtimi
title: Codex Harness Bağlam Motoru Portu
x-i18n:
    generated_at: "2026-06-28T00:47:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a757ee324e7937e30736ff8a82d86fec6b3fe93e837a71a69a6d0af911e9f395
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Durum

Taslak uygulama belirtimi.

## Hedef

Paketle gelen Codex uygulama sunucusu harness'ının, gömülü OpenClaw turlarının zaten uyduğu aynı OpenClaw bağlam motoru yaşam döngüsü sözleşmesine uymasını sağlamak.

Sağlayıcı/model olarak `agentRuntime.id: "codex"` kullanan veya bir `codex/*` modeli kullanan bir oturum, seçilen bağlam motoru Plugin'inin, örneğin `lossless-claw`'un, Codex uygulama sunucusu sınırının izin verdiği ölçüde bağlam oluşturmayı, tur sonrası içe almayı, bakımı ve OpenClaw düzeyindeki compaction politikasını kontrol etmesine hâlâ izin vermelidir.

## Hedef dışı konular

- Codex uygulama sunucusu iç işleyişini yeniden uygulamayın.
- Codex yerel iş parçacığı compaction işleminin bir lossless-claw özeti üretmesini sağlamayın.
- Codex dışı modellerin Codex harness'ını kullanmasını zorunlu kılmayın.
- ACP/acpx oturum davranışını değiştirmeyin. Bu belirtim yalnızca ACP olmayan gömülü ajan harness yolu içindir.
- Üçüncü taraf Plugin'lerin Codex uygulama sunucusu uzantı fabrikaları kaydetmesini sağlamayın; mevcut paketli Plugin güven sınırı değişmeden kalır.

## Mevcut mimari

Gömülü çalıştırma döngüsü, somut alt düzey harness'ı seçmeden önce yapılandırılmış bağlam motorunu her çalıştırma için bir kez çözümler:

- `src/agents/embedded-agent-runner/run.ts`
  - bağlam motoru Plugin'lerini başlatır
  - `resolveContextEngine(params.config)` çağrısı yapar
  - `contextEngine` ve `contextTokenBudget` değerlerini
    `runEmbeddedAttemptWithBackend(...)` içine geçirir

`runEmbeddedAttemptWithBackend(...)` seçilen ajan harness'ına delege eder:

- `src/agents/embedded-agent-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex uygulama sunucusu harness'ı, paketli Codex Plugin'i tarafından kaydedilir:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Codex harness uygulaması, yerleşik OpenClaw denemeleriyle aynı `EmbeddedRunAttemptParams` değerlerini alır:

- `extensions/codex/src/app-server/run-attempt.ts`

Bu, gerekli hook noktasının OpenClaw tarafından kontrol edilen kodda olduğu anlamına gelir. Dış sınır Codex uygulama sunucusu protokolünün kendisidir: OpenClaw `thread/start`, `thread/resume` ve `turn/start` çağrılarına ne gönderdiğini kontrol edebilir ve bildirimleri gözlemleyebilir, ancak Codex'in dahili iş parçacığı deposunu veya yerel compactörünü değiştiremez.

## Mevcut boşluk

Yerleşik OpenClaw denemeleri bağlam motoru yaşam döngüsünü doğrudan çağırır:

- denemeden önce bootstrap/bakım
- model çağrısından önce oluşturma
- denemeden sonra afterTurn veya içe alma
- başarılı bir turdan sonra bakım
- compaction sahipliği olan motorlar için bağlam motoru compaction işlemi

İlgili OpenClaw kodu:

- `src/agents/embedded-agent-runner/run/attempt.ts`
- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex uygulama sunucusu denemeleri şu anda genel ajan harness hook'larını çalıştırır ve transkripti yansıtır, ancak `params.contextEngine.bootstrap`, `params.contextEngine.assemble`, `params.contextEngine.afterTurn`, `params.contextEngine.ingestBatch`, `params.contextEngine.ingest` veya `params.contextEngine.maintain` çağrılarını yapmaz.

İlgili Codex kodu:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## İstenen davranış

Codex harness turları için OpenClaw şu yaşam döngüsünü korumalıdır:

1. Yansıtılmış OpenClaw oturum transkriptini oku.
2. Önceki bir oturum dosyası varsa etkin bağlam motorunu bootstrap et.
3. Varsa bootstrap bakımını çalıştır.
4. Etkin bağlam motorunu kullanarak bağlamı oluştur.
5. Oluşturulan bağlamı Codex uyumlu girdilere dönüştür.
6. Codex iş parçacığını, varsa bağlam motoru `systemPromptAddition` değerini içeren geliştirici yönergeleriyle başlat veya sürdür.
7. Codex turunu, oluşturulmuş kullanıcıya yönelik istemle başlat.
8. Codex sonucunu OpenClaw transkriptine geri yansıt.
9. Uygulanmışsa `afterTurn` çağrısı yap, aksi halde yansıtılmış transkript anlık görüntüsünü kullanarak `ingestBatch`/`ingest` çağrısı yap.
10. Başarılı ve iptal edilmemiş turlardan sonra tur bakımını çalıştır.
11. Codex yerel compaction sinyallerini ve OpenClaw compaction hook'larını koru.

## Tasarım kısıtları

### Codex uygulama sunucusu, yerel iş parçacığı durumu için kanonik kalır

Codex kendi yerel iş parçacığına ve dahili genişletilmiş geçmişe sahiptir. OpenClaw, desteklenen protokol çağrıları dışında uygulama sunucusunun dahili geçmişini değiştirmeye çalışmamalıdır.

OpenClaw'ın transkript yansıtması, OpenClaw özellikleri için kaynak olmaya devam eder:

- sohbet geçmişi
- arama
- `/new` ve `/reset` kayıt tutma
- gelecekte model veya harness değiştirme
- bağlam motoru Plugin durumu

### Bağlam motoru oluşturması Codex girdilerine yansıtılmalıdır

Bağlam motoru arayüzü bir Codex iş parçacığı yaması değil, OpenClaw `AgentMessage[]` döndürür. Codex uygulama sunucusu `turn/start` geçerli bir kullanıcı girdisi kabul ederken, `thread/start` ve `thread/resume` geliştirici yönergeleri kabul eder.

Bu nedenle uygulamanın bir yansıtma katmanına ihtiyacı vardır. Güvenli ilk sürüm, Codex dahili geçmişini değiştirebiliyormuş gibi davranmaktan kaçınmalıdır. Oluşturulmuş bağlamı, geçerli turun çevresine deterministik istem/geliştirici yönergesi materyali olarak enjekte etmelidir.

### İstem önbelleği kararlılığı önemlidir

lossless-claw gibi motorlar için oluşturulan bağlam, değişmeyen girdiler için deterministik olmalıdır. Üretilen bağlam metnine zaman damgaları, rastgele kimlikler veya deterministik olmayan sıralama eklemeyin.

### Çalışma zamanı seçim semantiği değişmez

Harness seçimi olduğu gibi kalır:

- `runtime: "openclaw"` yerleşik OpenClaw harness'ını seçer
- `runtime: "codex"` kayıtlı Codex harness'ını seçer
- `runtime: "auto"` Plugin harness'larının desteklenen sağlayıcıları sahiplenmesine izin verir
- eşleşmeyen `auto` çalıştırmaları yerleşik OpenClaw harness'ını kullanır

Bu çalışma, Codex harness'ı seçildikten sonra ne olduğunu değiştirir.

## Uygulama planı

### 1. Yeniden kullanılabilir bağlam motoru deneme yardımcılarını dışa aktarın veya taşıyın

Bugün yeniden kullanılabilir yaşam döngüsü yardımcıları gömülü ajan çalıştırıcısı altında bulunur:

- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/run/attempt.prompt-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex, çalıştırıcı uygulama ayrıntılarına erişmek yerine harness'tan bağımsız yardımcıları içe aktarmalıdır.

Örneğin harness'tan bağımsız bir modül oluşturun:

- `src/agents/harness/context-engine-lifecycle.ts`

Şunları taşıyın veya yeniden dışa aktarın:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- `runContextEngineMaintenance` etrafında küçük bir sarmalayıcı

Aynı PR içinde yerleşik harness çağrı noktalarını güncelleyin.

Nötr yardımcı adları yerleşik harness'tan söz etmemelidir.

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

- Oluşturulan `AgentMessage[]`, özgün yansıtılmış geçmiş ve geçerli istemi kabul et.
- Hangi bağlamın geliştirici yönergelerine, hangisinin geçerli kullanıcı girdisine ait olduğunu belirle.
- Geçerli kullanıcı istemini son uygulanabilir istek olarak koru.
- Önceki iletileri kararlı ve açık bir biçimde işle.
- Değişken metadata'dan kaçın.

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

- `systemPromptAddition` değerini geliştirici yönergelerine koy.
- Oluşturulmuş transkript bağlamını `promptText` içinde geçerli istemden önce koy.
- Bunu açıkça OpenClaw tarafından oluşturulmuş bağlam olarak etiketle.
- Geçerli istemi sonda tut.
- Kuyrukta zaten görünüyorsa yinelenen geçerli kullanıcı istemini hariç tut.

Örnek istem şekli:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

Bu, yerel Codex geçmişi ameliyatından daha az zariftir, ancak OpenClaw içinde uygulanabilir ve bağlam motoru semantiğini korur.

Gelecekteki iyileştirme: Codex uygulama sunucusu iş parçacığı geçmişini değiştirmek veya tamamlamak için bir protokol sunarsa, bu yansıtma katmanını o API'yi kullanacak şekilde değiştirin.

### 3. Codex iş parçacığı başlatılmadan önce bootstrap'ı bağlayın

`extensions/codex/src/app-server/run-attempt.ts` içinde:

- Yansıtılmış oturum geçmişini bugünkü gibi oku.
- Oturum dosyasının bu çalıştırmadan önce var olup olmadığını belirle. Yansıtma yazmalarından önce `fs.stat(params.sessionFile)` kontrolü yapan bir yardımcıyı tercih et.
- Bir `SessionManager` aç veya yardımcı gerektiriyorsa dar kapsamlı bir oturum yöneticisi adaptörü kullan.
- `params.contextEngine` varsa nötr bootstrap yardımcısını çağır.

Sözde akış:

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

Codex araç köprüsü ve transkript yansıtmasıyla aynı `sessionKey` kuralını kullanın. Bugün Codex, `sandboxSessionKey` değerini `params.sessionKey` veya `params.sessionId` üzerinden hesaplar; ham `params.sessionKey` değerini korumak için bir neden yoksa bunu tutarlı şekilde kullanın.

### 4. `thread/start` / `thread/resume` ve `turn/start` öncesinde oluşturmayı bağlayın

`runCodexAppServerAttempt` içinde:

1. Önce dinamik araçları oluşturun, böylece bağlam motoru gerçekten kullanılabilir araç adlarını görür.
2. Yansıtılmış oturum geçmişini oku.
3. `params.contextEngine` varsa bağlam motoru `assemble(...)` çağrısını çalıştır.
4. Oluşturulan sonucu şunlara yansıt:
   - geliştirici yönergesi eki
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

bağlam duyarlı hale gelmelidir:

1. `buildDeveloperInstructions(params)` ile temel geliştirici yönergelerini hesapla
2. bağlam motoru oluşturmasını/yansıtmasını uygula
3. `before_prompt_build` çağrısını yansıtılmış istem/geliştirici yönergeleriyle çalıştır

Bu sıra, genel istem hook'larının Codex'in alacağı istemin aynısını görmesini sağlar. Katı OpenClaw eşdeğerliğine ihtiyacımız varsa, bağlam motoru oluşturmasını hook bileşiminden önce çalıştırın, çünkü yerleşik harness bağlam motoru `systemPromptAddition` değerini istem hattından sonra nihai sistem istemine uygular. Önemli değişmez, hem bağlam motorunun hem de hook'ların deterministik ve belgelenmiş bir sıraya sahip olmasıdır.

İlk uygulama için önerilen sıra:

1. `buildDeveloperInstructions(params)`
2. bağlam motoru `assemble()`
3. `systemPromptAddition` değerini geliştirici yönergelerine ekle/önüne ekle
4. oluşturulmuş iletileri istem metnine yansıt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. nihai geliştirici yönergelerini `startOrResumeThread(...)` içine geçir
7. nihai istem metnini `buildTurnStartParams(...)` içine geçir

Belirtim testlere kodlanmalıdır, böylece gelecekteki değişiklikler sıralamayı yanlışlıkla yeniden düzenlemez.

### 5. İstem önbelleği kararlı biçimlendirmesini koruyun

Yansıtma yardımcısı, aynı girdiler için bayt düzeyinde kararlı çıktı üretmelidir:

- kararlı ileti sırası
- kararlı rol etiketleri
- üretilmiş zaman damgaları yok
- nesne anahtar sırası sızıntısı yok
- rastgele ayraçlar yok
- çalıştırma başına kimlikler yok

Sabit ayraçlar ve açık bölümler kullanın.

### 6. Transkript yansıtmadan sonra tur sonrası işlemi bağlayın

Codex'in `CodexAppServerEventProjector` öğesi, geçerli dönüş için yerel bir `messagesSnapshot` oluşturur. `mirrorTranscriptBestEffort(...)` bu anlık görüntüyü OpenClaw konuşma dökümü aynasına yazar.

Aynalama başarılı ya da başarısız olduktan sonra, bağlam motoru sonlandırıcısını mevcut en iyi mesaj anlık görüntüsüyle çağırın:

- Yazmadan sonra tam aynalanmış oturum bağlamını tercih edin, çünkü `afterTurn` yalnızca geçerli dönüşü değil, oturum anlık görüntüsünü bekler.
- Oturum dosyası yeniden açılamıyorsa `historyMessages + result.messagesSnapshot` değerine geri dönün.

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

Aynalama başarısız olursa, yine de geri dönüş anlık görüntüsüyle `afterTurn` çağrısını yapın, ancak bağlam motorunun geri dönüş dönüş verilerinden içe aldığını günlüğe yazın.

### 7. Kullanımı ve prompt-cache çalışma zamanı bağlamını normalleştirin

Codex sonuçları, mevcut olduğunda uygulama sunucusu token bildirimlerinden gelen normalleştirilmiş kullanımı içerir. Bu kullanımı bağlam motoru çalışma zamanı bağlamına geçirin.

Codex uygulama sunucusu sonunda önbellek okuma/yazma ayrıntılarını sunarsa, bunları `ContextEnginePromptCacheInfo` içine eşleyin. O zamana kadar sıfırlar uydurmak yerine `promptCache` değerini atlayın.

### 8. Compaction politikası

İki Compaction sistemi vardır:

1. OpenClaw bağlam motoru `compact()`
2. Codex uygulama sunucusu yerel `thread/compact/start`

Bunları sessizce birbirine karıştırmayın.

#### `/compact` ve açık OpenClaw Compaction

Seçili bağlam motorunda `info.ownsCompaction === true` olduğunda, açık OpenClaw Compaction, OpenClaw konuşma dökümü aynası ve Plugin durumu için bağlam motorunun `compact()` sonucunu tercih etmelidir.

Seçili Codex harness yerel bir thread bağlamasına sahip olduğunda, uygulama sunucusu thread'ini sağlıklı tutmak için ek olarak Codex yerel Compaction isteyebiliriz, ancak bu ayrıntılarda ayrı bir arka uç eylemi olarak raporlanmalıdır.

Önerilen davranış:

- `contextEngine.info.ownsCompaction === true` ise:
  - önce bağlam motoru `compact()` çağrısını yapın
  - ardından bir thread bağlaması varsa en iyi çabayla Codex yerel Compaction çağrısı yapın
  - birincil sonuç olarak bağlam motoru sonucunu döndürün
  - Codex yerel Compaction durumunu `details.codexNativeCompaction` içine ekleyin
- Etkin bağlam motoru Compaction sahibi değilse:
  - geçerli Codex yerel Compaction davranışını koruyun

Bu muhtemelen `maybeCompactAgentHarnessSession(...)` öğesinin nerede çağrıldığına bağlı olarak `extensions/codex/src/app-server/compact.ts` dosyasını değiştirmeyi veya genel Compaction yolundan sarmalamayı gerektirir.

#### Dönüş içi Codex yerel contextCompaction olayları

Codex bir dönüş sırasında `contextCompaction` öğe olayları yayabilir. `event-projector.ts` içindeki mevcut Compaction öncesi/sonrası hook yayımını koruyun, ancak bunu tamamlanmış bir bağlam motoru Compaction olarak ele almayın.

Compaction sahibi olan motorlar için, Codex yine de yerel Compaction gerçekleştirdiğinde açık bir tanılama yayınlayın:

- stream/event adı: mevcut `compaction` stream kabul edilebilir
- ayrıntılar: `{ backend: "codex-app-server", ownsCompaction: true }`

Bu, ayrımı denetlenebilir hale getirir.

### 9. Oturum sıfırlama ve bağlama davranışı

Mevcut Codex harness `reset(...)`, OpenClaw oturum dosyasından Codex uygulama sunucusu bağlamasını temizler. Bu davranışı koruyun.

Ayrıca bağlam motoru durum temizliğinin mevcut OpenClaw oturum yaşam döngüsü yolları üzerinden gerçekleşmeye devam ettiğinden emin olun. Bağlam motoru yaşam döngüsü şu anda tüm harness'lar için reset/delete olaylarını kaçırmıyorsa Codex'e özgü temizlik eklemeyin.

### 10. Hata işleme

Yerleşik OpenClaw semantiklerini izleyin:

- bootstrap hataları uyarır ve devam eder
- assemble hataları uyarır ve birleştirilmemiş pipeline mesajlarına/prompt'a geri döner
- afterTurn/ingest hataları uyarır ve dönüş sonrası sonlandırmayı başarısız olarak işaretler
- bakım yalnızca başarılı, iptal edilmemiş, yield ile iptal edilmemiş dönüşlerden sonra çalışır
- Compaction hataları yeni prompt'lar olarak yeniden denenmemelidir

Codex'e özgü eklemeler:

- Bağlam projeksiyonu başarısız olursa uyarın ve özgün prompt'a geri dönün.
- Konuşma dökümü aynası başarısız olursa, geri dönüş mesajlarıyla yine de bağlam motoru sonlandırmasını deneyin.
- Codex yerel Compaction, bağlam motoru Compaction başarılı olduktan sonra başarısız olursa, bağlam motoru birincil olduğunda tüm OpenClaw Compaction işlemini başarısız kılmayın.

## Test planı

### Birim testleri

`extensions/codex/src/app-server` altına testler ekleyin:

1. `run-attempt.context-engine.test.ts`
   - Bir oturum dosyası mevcut olduğunda Codex `bootstrap` çağırır.
   - Codex, aynalanmış mesajlar, token bütçesi, araç adları, alıntı modu, model kimliği ve prompt ile `assemble` çağırır.
   - `systemPromptAddition` geliştirici talimatlarına dahil edilir.
   - Birleştirilmiş mesajlar, geçerli istekten önce prompt içine projekte edilir.
   - Codex, konuşma dökümü aynalamasından sonra `afterTurn` çağırır.
   - `afterTurn` olmadan Codex `ingestBatch` veya mesaj başına `ingest` çağırır.
   - Dönüş bakımı başarılı dönüşlerden sonra çalışır.
   - Dönüş bakımı prompt hatasında, iptalde veya yield iptalinde çalışmaz.

2. `context-engine-projection.test.ts`
   - aynı girdiler için kararlı çıktı
   - birleştirilmiş geçmiş onu içerdiğinde geçerli prompt kopyalanmaz
   - boş geçmişi işler
   - rol sırasını korur
   - sistem prompt eklemesini yalnızca geliştirici talimatlarına dahil eder

3. `compact.context-engine.test.ts`
   - sahip olan bağlam motorunun birincil sonucu kazanır
   - ayrıca denendiğinde Codex yerel Compaction durumu ayrıntılarda görünür
   - Codex yerel hatası, sahip olan bağlam motoru Compaction işlemini başarısız kılmaz
   - sahip olmayan bağlam motoru geçerli yerel Compaction davranışını korur

### Güncellenecek mevcut testler

- Varsa `extensions/codex/src/app-server/run-attempt.test.ts`, yoksa en yakın Codex uygulama sunucusu çalışma testleri.
- Yalnızca Compaction olay ayrıntıları değişirse `extensions/codex/src/app-server/event-projector.test.ts`.
- Yapılandırma davranışı değişmediği sürece `src/agents/harness/selection.test.ts` değişiklik gerektirmemelidir; kararlı kalmalıdır.
- Yerleşik harness bağlam motoru testleri değişmeden geçmeye devam etmelidir.

### Entegrasyon / canlı testler

Canlı Codex harness smoke testleri ekleyin veya genişletin:

- `plugins.slots.contextEngine` değerini bir test motoruna yapılandırın
- `agents.defaults.model` değerini bir `codex/*` modeline yapılandırın
- sağlayıcı/model `agentRuntime.id = "codex"` değerini yapılandırın
- test motorunun şunları gözlemlediğini doğrulayın:
  - bootstrap
  - assemble
  - afterTurn veya ingest
  - bakım

OpenClaw core testlerinde lossless-claw gerektirmekten kaçının. Repo içinde küçük bir sahte bağlam motoru Plugin'i kullanın.

## Gözlemlenebilirlik

Codex bağlam motoru yaşam döngüsü çağrılarının etrafına debug günlükleri ekleyin:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` ve gerekçe
- `codex native compaction completed alongside context-engine compaction`

Tam prompt'ları veya konuşma dökümü içeriklerini günlüğe yazmaktan kaçının.

Yararlı olduğunda yapılandırılmış alanlar ekleyin:

- `sessionId`
- mevcut günlükleme uygulamasına göre redakte edilmiş veya atlanmış `sessionKey`
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Geçiş / uyumluluk

Bu geriye dönük uyumlu olmalıdır:

- Hiçbir bağlam motoru yapılandırılmamışsa, eski bağlam motoru davranışı bugünkü Codex harness davranışına eşdeğer olmalıdır.
- Bağlam motoru `assemble` başarısız olursa, Codex özgün prompt yoluyla devam etmelidir.
- Mevcut Codex thread bağlamaları geçerli kalmalıdır.
- Dinamik araç parmak izi bağlam motoru çıktısını içermemelidir; aksi takdirde her bağlam değişikliği yeni bir Codex thread zorlayabilir. Dinamik araç parmak izini yalnızca araç kataloğu etkilemelidir.

## Açık sorular

1. Birleştirilmiş bağlam tamamen kullanıcı prompt'una mı, tamamen geliştirici talimatlarına mı, yoksa bölünerek mi enjekte edilmeli?

   Öneri: bölünerek. `systemPromptAddition` öğesini geliştirici talimatlarına koyun; birleştirilmiş konuşma dökümü bağlamını kullanıcı prompt sarmalayıcısına koyun. Bu, yerel thread geçmişini değiştirmeden mevcut Codex protokolüyle en iyi şekilde eşleşir.

2. Bir bağlam motoru Compaction sahibi olduğunda Codex yerel Compaction devre dışı bırakılmalı mı?

   Öneri: hayır, başlangıçta değil. Codex yerel Compaction, uygulama sunucusu thread'ini canlı tutmak için hâlâ gerekli olabilir. Ancak bağlam motoru Compaction olarak değil, yerel Codex Compaction olarak raporlanmalıdır.

3. `before_prompt_build`, bağlam motoru assembly öncesinde mi yoksa sonrasında mı çalışmalı?

   Öneri: Codex için bağlam motoru projeksiyonundan sonra; böylece genel harness hook'ları Codex'in alacağı gerçek prompt'u/geliştirici talimatlarını görür. Yerleşik harness eşliği tersini gerektiriyorsa, seçilen sırayı testlerde kodlayın ve burada belgeleyin.

4. Codex uygulama sunucusu gelecekte yapılandırılmış bir bağlam/geçmiş geçersiz kılmasını kabul edebilir mi?

   Bilinmiyor. Edebiliyorsa, metin projeksiyonu katmanını bu protokolle değiştirin ve yaşam döngüsü çağrılarını değiştirmeden bırakın.

## Kabul kriterleri

- Bir `codex/*` gömülü harness dönüşü, seçili bağlam motorunun assemble yaşam döngüsünü çağırır.
- Bir bağlam motoru `systemPromptAddition`, Codex geliştirici talimatlarını etkiler.
- Birleştirilmiş bağlam, Codex dönüş girdisini deterministik olarak etkiler.
- Başarılı Codex dönüşleri `afterTurn` veya ingest geri dönüşünü çağırır.
- Başarılı Codex dönüşleri bağlam motoru dönüş bakımını çalıştırır.
- Başarısız/iptal edilmiş/yield ile iptal edilmiş dönüşler dönüş bakımını çalıştırmaz.
- Bağlam motoru sahipli Compaction, OpenClaw/Plugin durumu için birincil kalır.
- Codex yerel Compaction, yerel Codex davranışı olarak denetlenebilir kalır.
- Mevcut yerleşik harness bağlam motoru davranışı değişmez.
- Eski olmayan hiçbir bağlam motoru seçilmediğinde veya assembly başarısız olduğunda mevcut Codex harness davranışı değişmez.
