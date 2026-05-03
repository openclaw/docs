---
read_when:
    - Bağlam motoru yaşam döngüsü davranışını Codex test düzeneğine entegre ediyorsunuz
    - codex/* gömülü test düzeneği oturumlarıyla çalışmak için lossless-claw veya başka bir context-engine Plugin gerekir.
    - Gömülü PI ile Codex uygulama sunucusunun bağlam davranışını karşılaştırıyorsunuz
summary: Birlikte gelen Codex app-server test düzeneğinin OpenClaw context-engine Plugin'lerini dikkate almasını sağlamaya yönelik belirtim
title: Codex Harness Bağlam Motoru Aktarımı
x-i18n:
    generated_at: "2026-05-03T08:57:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6575c25973d43c04cada6157e39c52ea5ad1cc60171cf801fe36cbb9c54c9237
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Durum

Taslak uygulama spesifikasyonu.

## Hedef

Paketle gelen Codex app-server çalıştırma altyapısının, gömülü PI turlarının zaten uyduğu OpenClaw bağlam motoru yaşam döngüsü sözleşmesine uymasını sağlamak.

`agents.defaults.embeddedHarness.runtime: "codex"` veya bir `codex/*` modeli kullanan bir oturum, seçili bağlam motoru Plugin'inin, örneğin `lossless-claw`, Codex app-server sınırının izin verdiği ölçüde bağlam derlemesini, tur sonrası alımı, bakımı ve OpenClaw düzeyindeki sıkıştırma ilkesini denetlemesine yine de izin vermelidir.

## Hedef dışı konular

- Codex app-server iç bileşenlerini yeniden uygulamayın.
- Codex yerel iş parçacığı sıkıştırmasının bir lossless-claw özeti üretmesini sağlamayın.
- Codex dışı modellerin Codex çalıştırma altyapısını kullanmasını zorunlu kılmayın.
- ACP/acpx oturum davranışını değiştirmeyin. Bu spesifikasyon yalnızca ACP dışı gömülü ajan çalıştırma altyapısı yolu içindir.
- Üçüncü taraf Plugin'lerin Codex app-server uzantı fabrikalarını kaydetmesini sağlamayın; mevcut paketli Plugin güven sınırı değişmeden kalır.

## Geçerli mimari

Gömülü çalıştırma döngüsü, somut alt düzey çalıştırma altyapısını seçmeden önce her çalıştırmada yapılandırılmış bağlam motorunu bir kez çözümler:

- `src/agents/pi-embedded-runner/run.ts`
  - bağlam motoru Plugin'lerini başlatır
  - `resolveContextEngine(params.config)` çağırır
  - `contextEngine` ve `contextTokenBudget` değerlerini
    `runEmbeddedAttemptWithBackend(...)` içine geçirir

`runEmbeddedAttemptWithBackend(...)`, seçili ajan çalıştırma altyapısına devreder:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex app-server çalıştırma altyapısı paketli Codex Plugin'i tarafından kaydedilir:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Codex çalıştırma altyapısı uygulaması, PI destekli denemelerle aynı `EmbeddedRunAttemptParams` değerini alır:

- `extensions/codex/src/app-server/run-attempt.ts`

Bu, gerekli hook noktasının OpenClaw denetimindeki kodda olduğu anlamına gelir. Harici sınır Codex app-server protokolünün kendisidir: OpenClaw, `thread/start`, `thread/resume` ve `turn/start` çağrılarına ne gönderdiğini denetleyebilir ve bildirimleri gözlemleyebilir, ancak Codex'in dahili iş parçacığı deposunu veya yerel sıkıştırıcısını değiştiremez.

## Geçerli boşluk

Gömülü PI denemeleri bağlam motoru yaşam döngüsünü doğrudan çağırır:

- denemeden önce bootstrap/bakım
- model çağrısından önce derleme
- denemeden sonra afterTurn veya alım
- başarılı bir turdan sonra bakım
- sıkıştırmanın sahibi olan motorlar için bağlam motoru sıkıştırması

İlgili PI kodu:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex app-server denemeleri şu anda genel ajan çalıştırma altyapısı hook'larını çalıştırır ve transkripti yansıtır, ancak `params.contextEngine.bootstrap`, `params.contextEngine.assemble`, `params.contextEngine.afterTurn`, `params.contextEngine.ingestBatch`, `params.contextEngine.ingest` veya `params.contextEngine.maintain` çağrılarını yapmaz.

İlgili Codex kodu:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## İstenen davranış

Codex çalıştırma altyapısı turları için OpenClaw şu yaşam döngüsünü korumalıdır:

1. Yansıtılmış OpenClaw oturum transkriptini oku.
2. Önceki bir oturum dosyası varsa etkin bağlam motorunu bootstrap et.
3. Varsa bootstrap bakımını çalıştır.
4. Etkin bağlam motorunu kullanarak bağlamı derle.
5. Derlenmiş bağlamı Codex uyumlu girdilere dönüştür.
6. Codex iş parçacığını, herhangi bir bağlam motoru `systemPromptAddition` değerini içeren geliştirici talimatlarıyla başlat veya sürdür.
7. Codex turunu derlenmiş kullanıcıya dönük istemle başlat.
8. Codex sonucunu OpenClaw transkriptine geri yansıt.
9. Uygulanmışsa `afterTurn` çağır, aksi halde yansıtılmış transkript anlık görüntüsünü kullanarak `ingestBatch`/`ingest` çağır.
10. Başarılı ve iptal edilmemiş turlardan sonra tur bakımını çalıştır.
11. Codex yerel sıkıştırma sinyallerini ve OpenClaw sıkıştırma hook'larını koru.

## Tasarım kısıtları

### Codex app-server yerel iş parçacığı durumu için yetkili kaynak olarak kalır

Codex, kendi yerel iş parçacığının ve tüm dahili genişletilmiş geçmişin sahibidir. OpenClaw, desteklenen protokol çağrıları dışında app-server'ın dahili geçmişini değiştirmeye çalışmamalıdır.

OpenClaw'ın transkript yansısı, OpenClaw özellikleri için kaynak olmaya devam eder:

- sohbet geçmişi
- arama
- `/new` ve `/reset` kayıt yönetimi
- gelecekte model veya çalıştırma altyapısı değiştirme
- bağlam motoru Plugin durumu

### Bağlam motoru derlemesi Codex girdilerine yansıtılmalıdır

Bağlam motoru arayüzü, Codex iş parçacığı yaması değil OpenClaw `AgentMessage[]` döndürür. Codex app-server `turn/start` geçerli bir kullanıcı girdisini kabul ederken `thread/start` ve `thread/resume` geliştirici talimatlarını kabul eder.

Bu nedenle uygulamanın bir yansıtma katmanına ihtiyacı vardır. Güvenli ilk sürüm, Codex dahili geçmişini değiştirebiliyormuş gibi davranmaktan kaçınmalıdır. Derlenmiş bağlamı geçerli turun etrafına deterministik istem/geliştirici talimatı malzemesi olarak enjekte etmelidir.

### İstem önbelleği kararlılığı önemlidir

lossless-claw gibi motorlar için derlenmiş bağlam, değişmeyen girdilerde deterministik olmalıdır. Oluşturulan bağlam metnine zaman damgaları, rastgele kimlikler veya deterministik olmayan sıralama eklemeyin.

### Çalışma zamanı seçim semantiği değişmez

Çalıştırma altyapısı seçimi olduğu gibi kalır:

- `runtime: "pi"` PI'yi zorlar
- `runtime: "codex"` kayıtlı Codex çalıştırma altyapısını seçer
- `runtime: "auto"` Plugin çalıştırma altyapılarının desteklenen sağlayıcıları sahiplenmesine izin verir
- eşleşmeyen `auto` çalıştırmaları PI kullanır

Bu çalışma, Codex çalıştırma altyapısı seçildikten sonra ne olduğunu değiştirir.

## Uygulama planı

### 1. Yeniden kullanılabilir bağlam motoru deneme yardımcılarını dışa aktarın veya taşıyın

Bugün yeniden kullanılabilir yaşam döngüsü yardımcıları PI çalıştırıcısı altında bulunur:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex, mümkünse adı PI ima eden bir uygulama yolundan içe aktarmamalıdır.

Çalıştırma altyapısından bağımsız bir modül oluşturun, örneğin:

- `src/agents/harness/context-engine-lifecycle.ts`

Şunları taşıyın veya yeniden dışa aktarın:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- `runContextEngineMaintenance` etrafında küçük bir sarmalayıcı

PI içe aktarmalarının çalışmaya devam etmesini, eski dosyalardan yeniden dışa aktararak veya aynı PR içinde PI çağrı noktalarını güncelleyerek sağlayın.

Tarafsız yardımcı adları PI'den bahsetmemelidir.

Önerilen adlar:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Codex bağlam yansıtma yardımcısı ekleyin

Yeni bir modül ekleyin:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Sorumluluklar:

- Derlenmiş `AgentMessage[]`, özgün yansıtılmış geçmiş ve geçerli istemi kabul et.
- Hangi bağlamın geliştirici talimatlarına, hangisinin geçerli kullanıcı girdisine ait olduğunu belirle.
- Geçerli kullanıcı istemini son eyleme geçirilebilir istek olarak koru.
- Önceki mesajları kararlı, açık bir biçimde oluştur.
- Oynak meta verilerden kaçın.

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

- `systemPromptAddition` değerini geliştirici talimatlarına koy.
- Derlenmiş transkript bağlamını `promptText` içinde geçerli istemden önce koy.
- Bunu açıkça OpenClaw derlenmiş bağlamı olarak etiketle.
- Geçerli istemi sonda tut.
- Geçerli kullanıcı istemi zaten sonda görünüyorsa yineleneni hariç tut.

Örnek istem biçimi:

```text
Bu tur için OpenClaw tarafından derlenen bağlam:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Geçerli kullanıcı isteği:
...
```

Bu, yerel Codex geçmişi üzerinde cerrahi değişiklik yapmaktan daha az zariftir, ancak OpenClaw içinde uygulanabilir ve bağlam motoru semantiğini korur.

Gelecekteki iyileştirme: Codex app-server, iş parçacığı geçmişini değiştirmek veya eklemek için bir protokol sunarsa bu yansıtma katmanını o API'yi kullanacak şekilde değiştirin.

### 3. Codex iş parçacığı başlatmadan önce bootstrap'ı bağlayın

`extensions/codex/src/app-server/run-attempt.ts` içinde:

- Yansıtılmış oturum geçmişini bugün olduğu gibi oku.
- Bu çalıştırmadan önce oturum dosyasının var olup olmadığını belirle. Yansıtma yazmalarından önce `fs.stat(params.sessionFile)` kontrol eden bir yardımcıyı tercih et.
- Bir `SessionManager` aç veya yardımcı bunu gerektiriyorsa dar kapsamlı bir oturum yöneticisi adaptörü kullan.
- `params.contextEngine` varsa tarafsız bootstrap yardımcısını çağır.

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

Codex araç köprüsü ve transkript yansısındakiyle aynı `sessionKey` kuralını kullanın. Bugün Codex `sandboxSessionKey` değerini `params.sessionKey` veya `params.sessionId` üzerinden hesaplar; ham `params.sessionKey` değerini korumak için bir neden yoksa bunu tutarlı biçimde kullanın.

### 4. `thread/start` / `thread/resume` ve `turn/start` öncesinde derlemeyi bağlayın

`runCodexAppServerAttempt` içinde:

1. Önce dinamik araçları oluşturun, böylece bağlam motoru gerçekten kullanılabilir araç adlarını görür.
2. Yansıtılmış oturum geçmişini oku.
3. `params.contextEngine` varsa bağlam motoru `assemble(...)` çağrısını çalıştır.
4. Derlenmiş sonucu şunlara yansıt:
   - geliştirici talimatı eklemesi
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

bağlamdan haberdar hale gelmelidir:

1. `buildDeveloperInstructions(params)` ile temel geliştirici talimatlarını hesapla
2. bağlam motoru derlemesini/yansıtmasını uygula
3. yansıtılmış istem/geliştirici talimatlarıyla `before_prompt_build` çalıştır

Bu sıra, genel istem hook'larının Codex'in alacağı istemi görmesini sağlar. Katı PI eşdeğerliği gerekiyorsa bağlam motoru derlemesini hook bileşiminden önce çalıştırın, çünkü PI bağlam motoru `systemPromptAddition` değerini istem işlem hattından sonra son sistem istemine uygular. Önemli değişmez, hem bağlam motorunun hem de hook'ların deterministik ve belgelenmiş bir sıraya sahip olmasıdır.

İlk uygulama için önerilen sıra:

1. `buildDeveloperInstructions(params)`
2. bağlam motoru `assemble()`
3. `systemPromptAddition` değerini geliştirici talimatlarına ekle/başa ekle
4. derlenmiş mesajları istem metnine yansıt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. son geliştirici talimatlarını `startOrResumeThread(...)` içine geçir
7. son istem metnini `buildTurnStartParams(...)` içine geçir

Gelecekteki değişikliklerin bunu yanlışlıkla yeniden sıralamaması için spesifikasyon testlerde kodlanmalıdır.

### 5. İstem önbelleği için kararlı biçimlendirmeyi koruyun

Yansıtma yardımcısı aynı girdiler için bayt düzeyinde kararlı çıktı üretmelidir:

- kararlı mesaj sırası
- kararlı rol etiketleri
- oluşturulmuş zaman damgaları yok
- nesne anahtarı sırası sızıntısı yok
- rastgele ayraçlar yok
- çalıştırma başına kimlikler yok

Sabit ayraçlar ve açık bölümler kullanın.

### 6. Transkript yansıtmasından sonra tur sonrasını bağlayın

Codex'in `CodexAppServerEventProjector` öğesi, geçerli tur için yerel bir `messagesSnapshot` oluşturur. `mirrorTranscriptBestEffort(...)`, bu anlık görüntüyü OpenClaw transkript aynasına yazar.

Aynalama başarılı olduktan veya başarısız olduktan sonra, en iyi kullanılabilir mesaj anlık görüntüsüyle bağlam motoru sonlandırıcısını çağırın:

- Yazımdan sonra tam aynalanmış oturum bağlamını tercih edin, çünkü `afterTurn` yalnızca geçerli turu değil, oturum anlık görüntüsünü bekler.
- Oturum dosyası yeniden açılamıyorsa `historyMessages + result.messagesSnapshot` değerine geri dönün.

Sözde akış:

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

Aynalama başarısız olursa, yine de yedek anlık görüntüyle `afterTurn` çağırın, ancak bağlam motorunun yedek tur verilerinden içe aldığını günlüğe kaydedin.

### 7. Kullanımı ve prompt önbelleği çalışma zamanı bağlamını normalleştirin

Codex sonuçları, mevcut olduğunda app-server token bildirimlerinden normalleştirilmiş kullanım içerir. Bu kullanımı bağlam motoru çalışma zamanı bağlamına iletin.

Codex app-server sonunda önbellek okuma/yazma ayrıntılarını açığa çıkarırsa, bunları `ContextEnginePromptCacheInfo` içine eşleyin. O zamana kadar sıfırlar icat etmek yerine `promptCache` değerini atlayın.

### 8. Compaction ilkesi

İki Compaction sistemi vardır:

1. OpenClaw bağlam motoru `compact()`
2. Codex app-server yerel `thread/compact/start`

Bunları sessizce birbirine karıştırmayın.

#### `/compact` ve açık OpenClaw Compaction

Seçili bağlam motorunda `info.ownsCompaction === true` olduğunda, açık OpenClaw Compaction, OpenClaw transkript aynası ve Plugin durumu için bağlam motorunun `compact()` sonucunu tercih etmelidir.

Seçili Codex harness yerel bir iş parçacığı bağlamasına sahip olduğunda, app-server iş parçacığını sağlıklı tutmak için ek olarak Codex yerel Compaction isteyebiliriz, ancak bu ayrıntılarda ayrı bir arka uç eylemi olarak bildirilmelidir.

Önerilen davranış:

- `contextEngine.info.ownsCompaction === true` ise:
  - önce bağlam motoru `compact()` çağırın
  - ardından bir iş parçacığı bağlaması varsa en iyi çabayla Codex yerel Compaction çağırın
  - birincil sonuç olarak bağlam motoru sonucunu döndürün
  - Codex yerel Compaction durumunu `details.codexNativeCompaction` içine ekleyin
- Etkin bağlam motoru Compaction sahibi değilse:
  - mevcut Codex yerel Compaction davranışını koruyun

Bu muhtemelen `extensions/codex/src/app-server/compact.ts` dosyasını değiştirmeyi veya `maybeCompactAgentHarnessSession(...)` nerede çağrılıyorsa ona bağlı olarak genel Compaction yolundan sarmalamayı gerektirir.

#### Tur içi Codex yerel contextCompaction olayları

Codex bir tur sırasında `contextCompaction` öğe olayları yayabilir. `event-projector.ts` içindeki mevcut önce/sonra Compaction hook yayımını koruyun, ancak bunu tamamlanmış bir bağlam motoru Compaction olarak ele almayın.

Compaction sahibi olan motorlar için Codex yine de yerel Compaction yaptığında açık bir tanı olayı yayınlayın:

- akış/olay adı: mevcut `compaction` akışı kabul edilebilir
- ayrıntılar: `{ backend: "codex-app-server", ownsCompaction: true }`

Bu, ayrımı denetlenebilir kılar.

### 9. Oturum sıfırlama ve bağlama davranışı

Mevcut Codex harness `reset(...)`, OpenClaw oturum dosyasından Codex app-server bağlamasını temizler. Bu davranışı koruyun.

Ayrıca bağlam motoru durumu temizliğinin mevcut OpenClaw oturum yaşam döngüsü yolları üzerinden gerçekleşmeye devam ettiğinden emin olun. Bağlam motoru yaşam döngüsü şu anda tüm harness'lar için sıfırlama/silme olaylarını kaçırmıyorsa Codex'e özgü temizleme eklemeyin.

### 10. Hata işleme

PI semantiğini izleyin:

- bootstrap hataları uyarır ve devam eder
- assemble hataları uyarır ve birleştirilmemiş pipeline mesajlarına/prompt'a geri döner
- afterTurn/içe alma hataları uyarır ve tur sonrası sonlandırmayı başarısız olarak işaretler
- bakım yalnızca başarılı, iptal edilmemiş ve yield edilerek iptal edilmemiş turlardan sonra çalışır
- Compaction hataları yeni prompt'lar olarak yeniden denenmemelidir

Codex'e özgü eklemeler:

- Bağlam projeksiyonu başarısız olursa, uyarın ve özgün prompt'a geri dönün.
- Transkript aynası başarısız olursa, yine de yedek mesajlarla bağlam motoru sonlandırmasını deneyin.
- Bağlam motoru Compaction başarılı olduktan sonra Codex yerel Compaction başarısız olursa, bağlam motoru birincil olduğunda tüm OpenClaw Compaction işlemini başarısız kılmayın.

## Test planı

### Birim testleri

`extensions/codex/src/app-server` altına testler ekleyin:

1. `run-attempt.context-engine.test.ts`
   - Codex, oturum dosyası mevcut olduğunda `bootstrap` çağırır.
   - Codex, aynalanmış mesajlar, token bütçesi, araç adları, alıntı modu, model kimliği ve prompt ile `assemble` çağırır.
   - `systemPromptAddition`, geliştirici talimatlarına dahil edilir.
   - Birleştirilmiş mesajlar, geçerli istekten önce prompt içine yansıtılır.
   - Codex, transkript aynalamasından sonra `afterTurn` çağırır.
   - `afterTurn` olmadan Codex, `ingestBatch` veya mesaj başına `ingest` çağırır.
   - Tur bakımı başarılı turlardan sonra çalışır.
   - Tur bakımı prompt hatasında, iptalde veya yield iptalinde çalışmaz.

2. `context-engine-projection.test.ts`
   - aynı girdiler için kararlı çıktı
   - birleştirilmiş geçmiş bunu içerdiğinde yinelenen geçerli prompt yok
   - boş geçmişi işler
   - rol sırasını korur
   - sistem prompt eklemesini yalnızca geliştirici talimatlarına dahil eder

3. `compact.context-engine.test.ts`
   - sahip olan bağlam motoru birincil sonucu kazanır
   - Codex yerel Compaction durumu, ayrıca denendiğinde ayrıntılarda görünür
   - Codex yerel hatası, sahip olan bağlam motoru Compaction işlemini başarısız kılmaz
   - sahip olmayan bağlam motoru mevcut yerel Compaction davranışını korur

### Güncellenecek mevcut testler

- Varsa `extensions/codex/src/app-server/run-attempt.test.ts`, yoksa en yakın Codex app-server çalıştırma testleri.
- Yalnızca Compaction olay ayrıntıları değişirse `extensions/codex/src/app-server/event-projector.test.ts`.
- Yapılandırma davranışı değişmedikçe `src/agents/harness/selection.test.ts` değişiklik gerektirmemelidir; kararlı kalmalıdır.
- PI bağlam motoru testleri değişmeden geçmeye devam etmelidir.

### Entegrasyon / canlı testler

Canlı Codex harness smoke testleri ekleyin veya genişletin:

- `plugins.slots.contextEngine` değerini bir test motoruna yapılandırın
- `agents.defaults.model` değerini bir `codex/*` modeline yapılandırın
- `agents.defaults.embeddedHarness.runtime = "codex"` yapılandırın
- test motorunun şunları gözlemlediğini doğrulayın:
  - bootstrap
  - assemble
  - afterTurn veya ingest
  - bakım

OpenClaw çekirdek testlerinde lossless-claw gerektirmekten kaçının. Küçük bir repo içi sahte bağlam motoru Plugin'i kullanın.

## Gözlemlenebilirlik

Codex bağlam motoru yaşam döngüsü çağrılarının çevresine hata ayıklama günlükleri ekleyin:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- neden ile birlikte `codex context engine maintenance skipped`
- `codex native compaction completed alongside context-engine compaction`

Tam prompt'ları veya transkript içeriklerini günlüğe kaydetmekten kaçının.

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

- Hiçbir bağlam motoru yapılandırılmadıysa, eski bağlam motoru davranışı bugünkü Codex harness davranışına eşdeğer olmalıdır.
- Bağlam motoru `assemble` başarısız olursa, Codex özgün prompt yoluyla devam etmelidir.
- Mevcut Codex iş parçacığı bağlamaları geçerli kalmalıdır.
- Dinamik araç parmak izi bağlam motoru çıktısını içermemelidir; aksi halde her bağlam değişikliği yeni bir Codex iş parçacığını zorlayabilir. Dinamik araç parmak izini yalnızca araç kataloğu etkilemelidir.

## Açık sorular

1. Birleştirilmiş bağlam tamamen kullanıcı prompt'una mı, tamamen geliştirici talimatlarına mı enjekte edilmeli, yoksa bölünmeli mi?

   Öneri: bölünmeli. `systemPromptAddition` değerini geliştirici talimatlarına koyun; birleştirilmiş transkript bağlamını kullanıcı prompt sarmalayıcısına koyun. Bu, yerel iş parçacığı geçmişini değiştirmeden mevcut Codex protokolüyle en iyi eşleşir.

2. Bir bağlam motoru Compaction sahibi olduğunda Codex yerel Compaction devre dışı bırakılmalı mı?

   Öneri: hayır, başlangıçta değil. Codex yerel Compaction, app-server iş parçacığını canlı tutmak için hâlâ gerekli olabilir. Ancak bağlam motoru Compaction olarak değil, yerel Codex Compaction olarak bildirilmelidir.

3. `before_prompt_build`, bağlam motoru assemble işleminden önce mi sonra mı çalışmalı?

   Öneri: Codex için bağlam motoru projeksiyonundan sonra, böylece genel harness hook'ları Codex'in alacağı gerçek prompt/geliştirici talimatlarını görür. PI eşdeğerliliği tersini gerektiriyorsa, seçilen sırayı testlerde kodlayın ve burada belgeleyin.

4. Codex app-server gelecekte yapılandırılmış bir bağlam/geçmiş geçersiz kılmasını kabul edebilir mi?

   Bilinmiyor. Edebilirse, metin projeksiyonu katmanını bu protokolle değiştirin ve yaşam döngüsü çağrılarını değişmeden tutun.

## Kabul kriterleri

- Bir `codex/*` gömülü harness turu, seçili bağlam motorunun assemble yaşam döngüsünü çağırır.
- Bağlam motoru `systemPromptAddition`, Codex geliştirici talimatlarını etkiler.
- Birleştirilmiş bağlam, Codex tur girdisini deterministik olarak etkiler.
- Başarılı Codex turları `afterTurn` veya ingest yedeğini çağırır.
- Başarılı Codex turları bağlam motoru tur bakımını çalıştırır.
- Başarısız/iptal edilmiş/yield ile iptal edilmiş turlar tur bakımını çalıştırmaz.
- Bağlam motoru sahipli Compaction, OpenClaw/Plugin durumu için birincil kalır.
- Codex yerel Compaction, yerel Codex davranışı olarak denetlenebilir kalır.
- Mevcut PI bağlam motoru davranışı değişmez.
- Eski olmayan bağlam motoru seçilmediğinde veya assembly başarısız olduğunda mevcut Codex harness davranışı değişmez.
