---
read_when:
    - Ajan aracılığıyla arka plan veya paralel çalışma istiyorsunuz
    - sessions_spawn veya alt ajan araç politikasını değiştiriyorsunuz
    - İş parçacığına bağlı alt ajan oturumlarını uyguluyor veya sorunlarını gideriyorsunuz
sidebarTitle: Sub-agents
summary: İstekte bulunan sohbete sonuçları geri bildiren yalıtılmış arka plan agent çalıştırmaları başlatın
title: Alt aracılar
x-i18n:
    generated_at: "2026-06-28T01:25:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 144af6e020c86d171fe6c5734efaad229adaea35f8d1c1b07e37c549805c88ff
    source_path: tools/subagents.md
    workflow: 16
---

Alt ajanlar, mevcut bir ajan çalıştırmasından başlatılan arka plan ajan çalıştırmalarıdır.
Kendi oturumlarında (`agent:<agentId>:subagent:<uuid>`) çalışırlar ve
tamamlandıklarında sonuçlarını istekte bulunan sohbet kanalına **duyururlar**.
Her alt ajan çalıştırması bir
[arka plan görevi](/tr/automation/tasks) olarak izlenir.

Birincil hedefler:

- Ana çalıştırmayı engellemeden "araştırma / uzun görev / yavaş araç" çalışmalarını paralelleştirmek.
- Alt ajanları varsayılan olarak yalıtılmış tutmak (oturum ayrımı + isteğe bağlı korumalı alan).
- Araç yüzeyinin kötüye kullanımını zorlaştırmak: alt ajanlar varsayılan olarak oturum araçlarını almaz.
- Orkestratör desenleri için yapılandırılabilir iç içe geçme derinliğini desteklemek.

<Note>
**Maliyet notu:** her alt ajanın varsayılan olarak kendi bağlamı ve token
kullanımı vardır. Ağır veya tekrarlayan görevler için alt ajanlarda daha ucuz
bir model ayarlayın ve ana ajanınızı daha yüksek kaliteli bir modelde tutun.
`agents.defaults.subagents.model` veya ajan başına geçersiz kılmalarla
yapılandırın. Bir çocuk gerçekten istekte bulunanın mevcut dökümüne ihtiyaç
duyduğunda, ajan o tek başlatmada `context: "fork"` isteyebilir. Konuya bağlı
alt ajan oturumları, mevcut konuşmayı bir takip konusuna dallandırdıkları için
varsayılan olarak `context: "fork"` kullanır.
</Note>

## Slash komutu

**Geçerli oturum** için alt ajan çalıştırmalarını incelemek üzere `/subagents` kullanın:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info`, çalıştırma meta verilerini (durum, zaman damgaları, oturum kimliği,
döküm yolu, temizleme) gösterir. Sınırlı ve güvenlik filtreli bir geri çağırma
görünümü için `sessions_history` kullanın; ham tam döküme ihtiyacınız olduğunda
diskteki döküm yolunu inceleyin.

### Konu bağlama denetimleri

Bu komutlar kalıcı konu bağlamalarını destekleyen kanallarda çalışır.
Aşağıdaki [Konu destekleyen kanallar](#thread-supporting-channels) bölümüne bakın.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Başlatma davranışı

Ajanlar `sessions_spawn` ile arka plan alt ajanları başlatır. Alt ajan tamamlanmaları
iç ebeveyn oturum olayları olarak döner; ebeveyn/istekte bulunan ajan
kullanıcıya dönük bir güncellemenin gerekip gerekmediğine karar verir.

<AccordionGroup>
  <Accordion title="Engellemeyen, itme tabanlı tamamlanma">
    - `sessions_spawn` engellemez; hemen bir çalıştırma kimliği döndürür.
    - Tamamlandığında alt ajan ebeveyn/istekte bulunan oturuma geri rapor verir.
    - Çocuk sonuçlarına ihtiyaç duyan ajan dönüşleri, gerekli işi başlattıktan sonra `sessions_yield` çağırmalıdır. Bu, geçerli dönüşü sonlandırır ve tamamlanma olaylarının bir sonraki model tarafından görülebilir mesaj olarak gelmesini sağlar.
    - Tamamlanma itme tabanlıdır. Başlatıldıktan sonra, yalnızca bitmesini beklemek için `/subagents list`, `sessions_list` veya `sessions_history` komutlarını döngü içinde yoklamayın; durumu yalnızca hata ayıklama görünürlüğü için gerektiğinde inceleyin.
    - Çocuk çıktısı, istekte bulunan ajanın sentezlemesi için bir rapor/kanıttır. Kullanıcı tarafından yazılmış talimat metni değildir ve sistem, geliştirici veya kullanıcı ilkesini geçersiz kılamaz.
    - Tamamlandığında OpenClaw, duyuru temizleme akışı devam etmeden önce bu alt ajan oturumu tarafından açılan izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır.

  </Accordion>
  <Accordion title="Tamamlanma teslimi">
    - OpenClaw, tamamlanmaları kararlı bir idempotency anahtarına sahip bir `agent` dönüşü aracılığıyla istekte bulunan oturuma geri verir.
    - İstekte bulunan çalıştırma hâlâ etkinse OpenClaw, ikinci bir görünür yanıt yolu başlatmak yerine önce bu çalıştırmayı uyandırmayı/yönlendirmeyi dener.
    - Etkin bir istekte bulunan uyandırılamazsa OpenClaw, duyuruyu düşürmek yerine aynı tamamlanma bağlamıyla istekte bulunan ajan devrine geri döner.
    - Başarılı bir ebeveyn devri, ebeveyn görünür kullanıcı güncellemesine gerek olmadığına karar verse bile alt ajan teslimini tamamlar.
    - Yerel alt ajanlar mesaj aracını almaz. Ebeveyn/istekte bulunan ajana düz asistan metni döndürürler; insan tarafından görülebilir yanıtlar ebeveyn/istekte bulunan ajanın normal teslim ilkesi tarafından sahiplenilir.
    - Doğrudan devir kullanılamazsa kuyruk yönlendirmesine geri döner.
    - Kuyruk yönlendirmesi hâlâ kullanılamıyorsa duyuru, son vazgeçmeden önce kısa üstel backoff ile yeniden denenir.
    - Tamamlanma teslimi çözümlenmiş istekte bulunan rotayı korur: konuya bağlı veya konuşmaya bağlı tamamlanma rotaları mevcut olduğunda kazanır; tamamlanma kaynağı yalnızca bir kanal sağlıyorsa OpenClaw, doğrudan teslimin hâlâ çalışması için eksik hedefi/hesabı istekte bulunan oturumun çözümlenmiş rotasından (`lastChannel` / `lastTo` / `lastAccountId`) doldurur.

  </Accordion>
  <Accordion title="Tamamlanma devir meta verileri">
    İstekte bulunan oturuma yapılan tamamlanma devri, çalışma zamanı tarafından oluşturulan
    iç bağlamdır (kullanıcı tarafından yazılmış metin değil) ve şunları içerir:

    - `Result` — çocuktan gelen en son görünür `assistant` yanıt metni. Araç/toolResult çıktısı çocuk sonuçlarına yükseltilmez. Terminal başarısız çalıştırmalar yakalanan yanıt metnini yeniden kullanmaz.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Kompakt çalışma zamanı/token istatistikleri.
    - İstekte bulunan ajana, özgün görevin tamamlanıp tamamlanmadığına karar vermeden önce sonucu doğrulamasını söyleyen bir inceleme talimatı.
    - Çocuk sonucu daha fazla işlem bıraktığında istekte bulunan ajana göreve devam etmesini veya bir takip kaydetmesini söyleyen takip rehberliği.
    - Artık işlem yok yolu için, ham iç meta verileri iletmeden normal asistan sesiyle yazılmış son güncelleme talimatı.

  </Accordion>
  <Accordion title="Modlar ve ACP çalışma zamanı">
    - `--model` ve `--thinking`, o belirli çalıştırma için varsayılanları geçersiz kılar.
    - Tamamlanmadan sonra ayrıntıları ve çıktıyı incelemek için `info`/`log` kullanın.
    - Kalıcı konuya bağlı oturumlar için `sessions_spawn` komutunu `thread: true` ve `mode: "session"` ile kullanın.
    - İstekte bulunan kanal konu bağlamalarını desteklemiyorsa imkânsız konuya bağlı kombinasyonları yeniden denemek yerine `mode: "run"` kullanın.
    - ACP harness oturumları (Claude Code, Gemini CLI, OpenCode veya açık Codex ACP/acpx) için, araç bu çalışma zamanını duyurduğunda `sessions_spawn` komutunu `runtime: "acp"` ile kullanın. Tamamlanmaları veya ajandan ajana döngüleri hata ayıklarken [ACP teslim modeli](/tr/tools/acp-agents#delivery-model) bölümüne bakın. `codex` Plugin etkinleştirildiğinde, kullanıcı açıkça ACP/acpx istemedikçe Codex sohbet/konu denetimi ACP yerine `/codex ...` tercih etmelidir.
    - OpenClaw, ACP etkinleştirilene, istekte bulunan korumalı alanda olmayana ve `acpx` gibi bir arka uç Plugin yüklenene kadar `runtime: "acp"` öğesini gizler. `runtime: "acp"` harici bir ACP harness kimliği veya `runtime.type="acp"` olan bir `agents.list[]` girişi bekler; `agents_list` içindeki normal OpenClaw yapılandırma ajanları için varsayılan alt ajan çalışma zamanını kullanın.

  </Accordion>
</AccordionGroup>

## Bağlam modları

Yerel alt ajanlar, çağıran açıkça geçerli dökümü çatallamayı istemedikçe
yalıtılmış olarak başlar.

| Mod        | Ne zaman kullanılır                                                                                                                       | Davranış                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `isolated` | Yeni araştırma, bağımsız uygulama, yavaş araç çalışması veya görev metninde özetlenebilen herhangi bir şey                                | Temiz bir çocuk dökümü oluşturur. Bu varsayılandır ve token kullanımını daha düşük tutar. |
| `fork`     | Geçerli konuşmaya, önceki araç sonuçlarına veya istekte bulunan dökümünde zaten bulunan incelikli talimatlara bağlı çalışma                | Çocuk başlamadan önce istekte bulunan dökümünü çocuk oturumuna dallandırır.               |

`fork` seçeneğini ölçülü kullanın. Bu, bağlama duyarlı delegasyon içindir;
net bir görev istemi yazmanın yerine geçmez.

## Araç: `sessions_spawn`

Global `subagent` hattında `deliver: false` ile bir alt ajan çalıştırması
başlatır, ardından bir duyuru adımı çalıştırır ve duyuru yanıtını istekte
bulunan sohbet kanalına gönderir.

Kullanılabilirlik, çağıranın etkin araç ilkesine bağlıdır. `coding` ve
`full` profilleri varsayılan olarak `sessions_spawn` sunar. `messaging` profili
sunmaz; iş devretmesi gereken ajanlar için `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` ekleyin veya `tools.profile: "coding"` kullanın. Kanal/grup,
sağlayıcı, korumalı alan ve ajan başına izin/verme ilkeleri profil aşamasından
sonra aracı yine de kaldırabilir. Etkin araç listesini doğrulamak için aynı
oturumdan `/tools` kullanın.

**Varsayılanlar:**

- **Model:** `agents.defaults.subagents.model` (veya ajan başına `agents.list[].subagents.model`) ayarlamadığınız sürece yerel alt ajanlar çağıranı devralır. ACP çalışma zamanı başlatmaları, mevcut olduğunda aynı yapılandırılmış alt ajan modelini kullanır; aksi takdirde ACP harness kendi varsayılanını korur. Açık bir `sessions_spawn.model` yine de kazanır.
- **Thinking:** `agents.defaults.subagents.thinking` (veya ajan başına `agents.list[].subagents.thinking`) ayarlamadığınız sürece yerel alt ajanlar çağıranı devralır. ACP çalışma zamanı başlatmaları, seçilen model için `agents.defaults.models["provider/model"].params.thinking` değerini de uygular. Açık bir `sessions_spawn.thinking` yine de kazanır.
- **Çalıştırma zaman aşımı:** OpenClaw, ayarlandığında `agents.defaults.subagents.runTimeoutSeconds` kullanır; aksi takdirde `0` değerine (zaman aşımı yok) geri döner. `sessions_spawn` çağrı başına zaman aşımı geçersiz kılmalarını kabul etmez.
- **Görev teslimi:** yerel alt ajanlar devredilen görevi ilk görünür `[Subagent Task]` mesajlarında alır. Alt ajan sistem istemi, görevin gizli bir kopyasını değil çalışma zamanı kurallarını ve yönlendirme bağlamını taşır.

Kabul edilen yerel alt ajan başlatmaları, araç sonucunda çözümlenmiş çocuk model
meta verilerini içerir: `resolvedModel` uygulanan model başvurusunu içerir ve
`resolvedProvider`, başvuruda varsa sağlayıcı önekini içerir.

### Delegasyon istem modu

`agents.defaults.subagents.delegationMode` yalnızca istem rehberliğini denetler; araç ilkesini değiştirmez veya delegasyonu zorunlu kılmaz.

- `suggest` (varsayılan): daha büyük veya daha yavaş işler için alt ajanları kullanmaya yönelik standart istem yönlendirmesini korur.
- `prefer`: ana ajana yanıt verebilir kalmasını ve doğrudan yanıttan daha kapsamlı olan her şeyi `sessions_spawn` üzerinden devretmesini söyler.

Ajan başına geçersiz kılmalar `agents.list[].subagents.delegationMode` kullanır.

```json5
{
  agents: {
    defaults: {
      subagents: {
        delegationMode: "prefer",
        maxConcurrent: 4,
      },
    },
    list: [
      {
        id: "coordinator",
        subagents: { delegationMode: "prefer" },
      },
    ],
  },
}
```

### Araç parametreleri

<ParamField path="task" type="string" required>
  Alt aracı için görev açıklaması.
</ParamField>
<ParamField path="taskName" type="string">
  Daha sonraki durum çıktısında belirli bir alt öğeyi tanımlamak için isteğe bağlı kararlı tanıtıcı. `[a-z][a-z0-9_-]{0,63}` ile eşleşmeli ve `last` veya `all` gibi ayrılmış hedefler olamaz.
</ParamField>
<ParamField path="label" type="string">
  İsteğe bağlı insan tarafından okunabilir etiket.
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents` tarafından izin verildiğinde başka bir yapılandırılmış aracı kimliği altında başlat.
</ParamField>
<ParamField path="cwd" type="string">
  Alt çalıştırma için isteğe bağlı görev çalışma dizini. Yerel alt aracılar yine de önyükleme dosyalarını hedef aracı çalışma alanından yükler; `cwd` yalnızca çalışma zamanı araçlarının ve CLI koşumlarının devredilen işi nerede yaptığını değiştirir.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` yalnızca harici ACP koşumları (`claude`, `droid`, `gemini`, `opencode` veya açıkça istenen Codex ACP/acpx) ve `runtime.type` değeri `acp` olan `agents.list[]` girdileri içindir.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Yalnızca ACP. `runtime: "acp"` olduğunda mevcut bir ACP koşum oturumunu sürdürür; yerel alt aracı başlatmaları için yok sayılır.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Yalnızca ACP. `runtime: "acp"` olduğunda ACP çalıştırma çıktısını üst oturuma akıtır; yerel alt aracı başlatmaları için atlayın.
</ParamField>
<ParamField path="model" type="string">
  Alt aracı modelini geçersiz kıl. Geçersiz değerler atlanır ve alt aracı, araç sonucunda bir uyarıyla varsayılan modelde çalışır.
</ParamField>
<ParamField path="thinking" type="string">
  Alt aracı çalıştırması için düşünme düzeyini geçersiz kıl.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` olduğunda, bu alt aracı oturumu için kanal iş parçacığı bağlaması ister.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` ise ve `mode` atlanmışsa, varsayılan `session` olur. `mode: "session"` için `thread: true` gerekir.
  İstekte bulunan kanal için iş parçacığı bağlaması kullanılamıyorsa bunun yerine `mode: "run"` kullanın.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` duyurudan hemen sonra arşivler (dökümü yeniden adlandırma yoluyla yine saklar).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require`, hedef alt çalışma zamanı sandbox içinde değilse başlatmayı reddeder.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork`, istekte bulunanın mevcut dökümünü alt oturuma dallandırır. Yalnızca yerel alt aracılar. İş parçacığına bağlı başlatmalar varsayılan olarak `fork`; iş parçacığı olmayan başlatmalar varsayılan olarak `isolated` kullanır.
</ParamField>

<Warning>
`sessions_spawn` kanal teslim parametrelerini (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`) kabul **etmez**. Yerel alt aracılar
en son asistan dönüşlerini istekte bulunana geri bildirir; harici teslimat
üst/istekte bulunan aracıda kalır.
</Warning>

### Görev adları ve hedefleme

`taskName`, orkestrasyon için modele görünen bir tanıtıcıdır, oturum anahtarı değildir.
Bir koordinatörün daha sonra ilgili alt öğeyi incelemesi gerekebileceğinde
`review_subagents`, `linux_validation` veya `docs_update` gibi kararlı alt adları için kullanın.

Hedef çözümleme tam `taskName` eşleşmelerini ve belirsiz olmayan
öneki kabul eder. Eşleştirme, numaralı `/subagents` hedeflerinin kullandığı
aynı etkin/yakın hedef penceresiyle sınırlıdır; bu nedenle eski tamamlanmış bir alt öğe,
yeniden kullanılan bir tanıtıcıyı belirsiz hale getirmez. İki etkin veya yakın alt öğe aynı
`taskName` değerini paylaşıyorsa hedef belirsizdir; bunun yerine liste dizinini, oturum anahtarını veya
çalıştırma kimliğini kullanın.

Ayrılmış hedefler `last` ve `all`, zaten denetim anlamları taşıdıkları için
geçerli `taskName` değerleri değildir.

## Araç: `sessions_yield`

Geçerli model dönüşünü sonlandırır ve başta
alt aracı tamamlama olayları olmak üzere çalışma zamanı olaylarının sonraki ileti olarak gelmesini bekler. İstekte bulunan,
bu tamamlamalar gelene kadar nihai yanıt üretemediğinde gerekli alt çalışmayı
başlattıktan sonra kullanın.

`sessions_yield` bekleme ilkelidir. Alt öğe tamamlanmasını algılamak için onu
`subagents`, `sessions_list`, `sessions_history` üzerinde yoklama döngüleriyle, kabuk
`sleep` komutuyla veya süreç yoklamasıyla değiştirmeyin.

Yalnızca oturumun etkin araç listesi bunu içerdiğinde `sessions_yield` kullanın.
Bazı en küçük veya özel araç profilleri, `sessions_yield` sunmadan `sessions_spawn` ve
`subagents` sunabilir; bu durumda tamamlanmayı beklemek için yoklama döngüsü
icat etmeyin.

Etkin alt öğeler olduğunda OpenClaw, normal dönüşlere kompakt ve çalışma zamanı tarafından oluşturulmuş
bir `Active Subagents` istem bloğu enjekte eder; böylece istekte bulunan,
yoklama yapmadan geçerli alt oturumları, çalıştırma kimliklerini, durumları, etiketleri, görevleri ve
`taskName` diğer adlarını görebilir. Bu bloktaki görev ve etiket alanları,
kullanıcı/model tarafından sağlanan başlatma argümanlarından gelebilecekleri için
talimat değil, veri olarak alıntılanır.

## Araç: `subagents`

İstekte bulunan oturumun sahip olduğu başlatılmış alt aracı çalıştırmalarını listeler. Geçerli
istekte bulunanla sınırlıdır; bir alt öğe yalnızca kendi denetlediği alt öğeleri görebilir.

İsteğe bağlı durum ve hata ayıklama için `subagents` kullanın. Tamamlama olaylarını
beklemek için `sessions_yield` kullanın.

## İş parçacığına bağlı oturumlar

Bir kanal için iş parçacığı bağlamaları etkinleştirildiğinde, bir alt aracı bir iş parçacığına bağlı kalabilir;
böylece o iş parçacığındaki takip kullanıcı iletileri aynı alt aracı oturumuna
yönlendirilmeye devam eder.

### İş parçacığını destekleyen kanallar

Oturum bağlama adaptörü olan herhangi bir kanal, kalıcı
iş parçacığına bağlı alt aracı oturumlarını destekleyebilir (`thread: true` ile `sessions_spawn`).
Paketlenmiş adaptörler şu anda Discord iş parçacıklarını, Matrix iş parçacıklarını,
Telegram forum konularını ve Feishu için geçerli konuşma bağlamalarını içerir.
Etkinleştirme, zaman aşımları ve `spawnSessions` için kanal başına `threadBindings`
yapılandırma anahtarlarını kullanın.

### Hızlı akış

<Steps>
  <Step title="Başlat">
    `thread: true` ile `sessions_spawn` (ve isteğe bağlı olarak `mode: "session"`).
  </Step>
  <Step title="Bağla">
    OpenClaw etkin kanalda bu oturum hedefine bir iş parçacığı oluşturur veya bağlar.
  </Step>
  <Step title="Takipleri yönlendir">
    Bu iş parçacığındaki yanıtlar ve takip iletileri bağlı oturuma yönlendirilir.
  </Step>
  <Step title="Zaman aşımlarını incele">
    Etkinsizlikte otomatik odaktan çıkarmayı incelemek/güncellemek için `/session idle` ve
    kesin sınırı denetlemek için `/session max-age` kullanın.
  </Step>
  <Step title="Ayır">
    Elle ayırmak için `/unfocus` kullanın.
  </Step>
</Steps>

### Elle denetimler

| Komut              | Etki                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| `/focus <target>`  | Geçerli iş parçacığını bir alt aracı/oturum hedefine bağla (veya oluştur) |
| `/unfocus`         | Geçerli bağlı iş parçacığı için bağlamayı kaldır                     |
| `/agents`          | Etkin çalıştırmaları ve bağlama durumunu listele (`thread:<id>` veya `unbound`) |
| `/session idle`    | Boşta otomatik odaktan çıkarmayı incele/güncelle (yalnızca odaklanmış bağlı iş parçacıkları) |
| `/session max-age` | Kesin sınırı incele/güncelle (yalnızca odaklanmış bağlı iş parçacıkları) |

### Yapılandırma anahtarları

- **Küresel varsayılan:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanal geçersiz kılma ve başlatma otomatik bağlama anahtarları** adaptöre özeldir. Yukarıdaki [İş parçacığını destekleyen kanallar](#thread-supporting-channels) bölümüne bakın.

Geçerli adaptör ayrıntıları için [Yapılandırma başvurusu](/tr/gateway/configuration-reference) ve
[Slash komutları](/tr/tools/slash-commands) bölümlerine bakın.

### İzin listesi

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Açık `agentId` yoluyla hedeflenebilen yapılandırılmış aracı kimliklerinin listesi (`["*"]` yapılandırılmış herhangi bir hedefe izin verir). Varsayılan: yalnızca istekte bulunan aracı. Bir liste ayarlar ve yine de istekte bulunanın `agentId` ile kendini başlatmasını istiyorsanız, istekte bulunan kimliğini listeye ekleyin.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  İstekte bulunan aracı kendi `subagents.allowAgents` değerini ayarlamadığında kullanılan varsayılan yapılandırılmış hedef aracı izin listesi.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` atlayan `sessions_spawn` çağrılarını engelle (açık profil seçimini zorunlu kılar). Aracı başına geçersiz kılma: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Gateway `agent` duyuru teslim denemeleri için çağrı başına zaman aşımı. Değerler pozitif tamsayı milisaniyelerdir ve platform açısından güvenli zamanlayıcı üst sınırına sıkıştırılır. Geçici yeniden denemeler toplam duyuru bekleme süresini yapılandırılmış tek bir zaman aşımından daha uzun hale getirebilir.
</ParamField>

İstekte bulunan oturum sandbox içindeyse, `sessions_spawn` sandbox dışında
çalışacak hedefleri reddeder.

### Keşif

Şu anda `sessions_spawn` için hangi aracı kimliklerine izin verildiğini görmek için `agents_list` kullanın.
Yanıt, çağıranların OpenClaw, Codex
uygulama sunucusu ve diğer yapılandırılmış yerel çalışma zamanlarını ayırt edebilmesi için listelenen her aracının etkin
modelini ve gömülü çalışma zamanı meta verilerini içerir.

`allowAgents` girdileri `agents.list[]` içindeki yapılandırılmış aracı kimliklerini göstermelidir.
`["*"]`, yapılandırılmış herhangi bir hedef aracı artı istekte bulunan anlamına gelir. Bir aracı yapılandırması
silinir ancak kimliği `allowAgents` içinde kalırsa, `sessions_spawn` bu kimliği reddeder
ve `agents_list` onu atlar. Eski izin listesi girdilerini temizlemek için `openclaw doctor --fix`
çalıştırın veya hedef, varsayılanları devralırken başlatılabilir kalmalıysa
en küçük bir `agents.list[]` girdisi ekleyin.

### Otomatik arşivleme

- Alt aracı oturumları `agents.defaults.subagents.archiveAfterMinutes` sonrasında otomatik olarak arşivlenir (varsayılan `60`).
- Arşivleme `sessions.delete` kullanır ve dökümü `*.deleted.<timestamp>` olarak yeniden adlandırır (aynı klasör).
- `cleanup: "delete"` duyurudan hemen sonra arşivler (dökümü yeniden adlandırma yoluyla yine saklar).
- Otomatik arşivleme en iyi çabayla yapılır; Gateway yeniden başlatılırsa bekleyen zamanlayıcılar kaybolur.
- Yapılandırılmış çalıştırma zaman aşımları otomatik arşivleme **yapmaz**; yalnızca çalıştırmayı durdurur. Oturum otomatik arşivlemeye kadar kalır.
- Otomatik arşivleme, derinlik 1 ve derinlik 2 oturumlarına eşit şekilde uygulanır.
- Tarayıcı temizliği arşiv temizliğinden ayrıdır: döküm/oturum kaydı tutulsa bile izlenen tarayıcı sekmeleri/süreçleri çalıştırma bittiğinde en iyi çabayla kapatılır.

## İç içe alt aracılar

Varsayılan olarak, alt aracılar kendi alt aracılarını başlatamaz
(`maxSpawnDepth: 1`). Bir düzey
iç içe yerleştirmeyi etkinleştirmek için `maxSpawnDepth: 2` ayarlayın: **orkestratör deseni**: ana → orkestratör alt aracı →
çalışan alt-alt aracılar.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // alt aracıların alt öğe başlatmasına izin ver (varsayılan: 1)
        maxChildrenPerAgent: 5, // aracı oturumu başına en fazla etkin alt öğe (varsayılan: 5)
        maxConcurrent: 8, // küresel eşzamanlılık hattı sınırı (varsayılan: 8)
        runTimeoutSeconds: 900, // sessions_spawn için varsayılan zaman aşımı (0 = zaman aşımı yok)
        announceTimeoutMs: 120000, // çağrı başına Gateway duyuru zaman aşımı
      },
    },
  },
}
```

### Derinlik düzeyleri

| Derinlik | Oturum anahtarı biçimi                        | Rol                                           | Başlatabilir mi?             |
| -------- | --------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0        | `agent:<id>:main`                             | Ana aracı                                     | Her zaman                    |
| 1        | `agent:<id>:subagent:<uuid>`                  | Alt aracı (derinlik 2 izinliyse orkestratör)  | Yalnızca `maxSpawnDepth >= 2` |
| 2        | `agent:<id>:subagent:<uuid>:subagent:<uuid>`  | Alt-alt aracı (uç çalışan)                    | Asla                         |

### Duyuru zinciri

Sonuçlar zincirde yukarı doğru akar:

1. Derinlik-2 çalışanı tamamlanır → üst ögesine (derinlik-1 orkestratörü) duyurur.
2. Derinlik-1 orkestratörü duyuruyu alır, sonuçları sentezler, tamamlanır → ana ajana duyurur.
3. Ana ajan duyuruyu alır ve kullanıcıya iletir.

Her seviye yalnızca doğrudan alt ögelerinden gelen duyuruları görür.

<Note>
**Operasyonel rehberlik:** `sessions_list`,
`sessions_history`, `/subagents list` veya `exec` sleep komutları
etrafında yoklama döngüleri oluşturmak yerine alt çalışmayı bir kez
başlatın ve tamamlama olaylarını bekleyin. `sessions_list` ve
`/subagents list`, alt oturum ilişkilerini canlı işe odaklı tutar — canlı
alt ögeler bağlı kalır, sona eren alt ögeler kısa bir son dönem penceresi
boyunca görünür kalır ve yalnızca depoda kalan eski alt bağlantılar
tazelik pencerelerinden sonra yok sayılır. Bu, eski `spawnedBy` /
`parentSessionKey` meta verilerinin yeniden başlatmadan sonra hayalet alt
ögeleri yeniden ortaya çıkarmasını önler. Siz final yanıtını gönderdikten
sonra bir alt öge tamamlama olayı gelirse, doğru takip eylemi tam sessiz
belirteç olan `NO_REPLY` / `no_reply` olur.
</Note>

### Derinliğe göre araç politikası

- Rol ve denetim kapsamı, oluşturma sırasında oturum meta verilerine yazılır. Bu, düz veya geri yüklenmiş oturum anahtarlarının yanlışlıkla orkestratör ayrıcalıklarını geri kazanmasını önler.
- **Derinlik 1 (orkestratör, `maxSpawnDepth >= 2` olduğunda):** alt ögeler oluşturabilmesi ve durumlarını inceleyebilmesi için `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` alır. Diğer oturum/sistem araçları reddedilmiş kalır.
- **Derinlik 1 (yaprak, `maxSpawnDepth == 1` olduğunda):** oturum aracı yoktur (geçerli varsayılan davranış).
- **Derinlik 2 (yaprak çalışan):** oturum aracı yoktur — `sessions_spawn`, derinlik 2'de her zaman reddedilir. Daha fazla alt öge oluşturamaz.

### Ajan başına oluşturma sınırı

Her ajan oturumu (herhangi bir derinlikte) aynı anda en fazla
`maxChildrenPerAgent` (varsayılan `5`) etkin alt ögeye sahip olabilir. Bu,
tek bir orkestratörden kontrolsüz yayılımı önler.

### Zincirleme durdurma

Bir derinlik-1 orkestratörünü durdurmak, tüm derinlik-2 alt ögelerini
otomatik olarak durdurur:

- Ana sohbette `/stop`, tüm derinlik-1 ajanlarını durdurur ve derinlik-2 alt ögelerine zincirleme uygulanır.

## Kimlik doğrulama

Alt ajan kimlik doğrulaması, oturum türüne göre değil **ajan kimliğine** göre çözümlenir:

- Alt ajan oturum anahtarı `agent:<agentId>:subagent:<uuid>` şeklindedir.
- Kimlik doğrulama deposu, o ajanın `agentDir` konumundan yüklenir.
- Ana ajanın kimlik doğrulama profilleri **yedek** olarak birleştirilir; çakışmalarda ajan profilleri ana profilleri geçersiz kılar.

Birleştirme eklemelidir, bu nedenle ana profiller yedek olarak her zaman
kullanılabilir. Ajan başına tamamen yalıtılmış kimlik doğrulama henüz
desteklenmez.

## Duyuru

Alt ajanlar bir duyuru adımı aracılığıyla geri bildirim yapar:

- Duyuru adımı, istekte bulunan oturumda değil alt ajan oturumunun içinde çalışır.
- Alt ajan tam olarak `ANNOUNCE_SKIP` yanıtını verirse hiçbir şey gönderilmez.
- En son asistan metni tam sessiz belirteç olan `NO_REPLY` / `no_reply` ise, daha önce görünür ilerleme olsa bile duyuru çıktısı bastırılır.

Teslim, istekte bulunanın derinliğine bağlıdır:

- Üst düzey istek oturumları, harici teslim (`deliver=true`) ile takip `agent` çağrısı kullanır.
- İç içe istek yapan subagent oturumları, orkestratörün alt öge sonuçlarını oturum içinde sentezleyebilmesi için dahili takip enjeksiyonu (`deliver=false`) alır.
- İç içe istek yapan subagent oturumu yoksa OpenClaw, kullanılabildiğinde o oturumun istekte bulunanına geri döner.

Üst düzey istek oturumları için tamamlama modu doğrudan teslim, önce
bağlı konuşma/iş parçacığı rotasını ve hook geçersiz kılmasını çözer,
ardından eksik kanal-hedef alanlarını istekte bulunan oturumun depolanmış
rotasından doldurur. Bu, tamamlama kaynağı yalnızca kanalı tanımlasa bile
tamamlamaların doğru sohbet/konuda kalmasını sağlar.

Alt öge tamamlama toplaması, iç içe tamamlama bulguları oluşturulurken
geçerli istek çalıştırmasıyla kapsamlandırılır; bu, eski önceki çalışma
alt öge çıktılarının geçerli duyuruya sızmasını önler. Duyuru yanıtları,
kanal bağdaştırıcılarında kullanılabildiğinde iş parçacığı/konu
yönlendirmesini korur.

### Duyuru bağlamı

Duyuru bağlamı, kararlı bir dahili olay bloğuna normalleştirilir:

| Alan           | Kaynak                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| Kaynak         | `subagent` veya `cron`                                                                                            |
| Oturum kimlikleri | Alt oturum anahtarı/kimliği                                                                                   |
| Tür            | Duyuru türü + görev etiketi                                                                                       |
| Durum          | Çalışma zamanı sonucundan türetilir (`success`, `error`, `timeout` veya `unknown`) — model metninden çıkarılmaz |
| Sonuç içeriği  | Alt ögeden gelen en son görünür asistan metni                                                                     |
| Takip          | Ne zaman yanıt verileceğini ve ne zaman sessiz kalınacağını açıklayan talimat                                     |

Terminalde başarısız olan çalıştırmalar, yakalanan yanıt metnini yeniden
oynatmadan başarısızlık durumu bildirir. Tool/toolResult çıktısı alt öge
sonuç metnine yükseltilmez.

### İstatistik satırı

Duyuru yükleri sonda bir istatistik satırı içerir (sarmalanmış olsa bile):

- Çalışma zamanı (ör. `runtime 5m12s`).
- Token kullanımı (girdi/çıktı/toplam).
- Model fiyatlandırması yapılandırıldığında tahmini maliyet (`models.providers.*.models[].cost`).
- Ana ajanın `sessions_history` aracılığıyla geçmişi alabilmesi veya diskteki dosyayı inceleyebilmesi için `sessionKey`, `sessionId` ve transkript yolu.

Dahili meta veriler yalnızca orkestrasyon içindir; kullanıcıya dönük
yanıtlar normal asistan sesiyle yeniden yazılmalıdır.

### Neden `sessions_history` tercih edilmeli

`sessions_history` daha güvenli orkestrasyon yoludur:

- Asistan geri çağırması önce normalleştirilir: düşünme etiketleri kaldırılır; `<relevant-memories>` / `<relevant_memories>` iskeleti kaldırılır; düz metin tool-call XML yük blokları (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) kaldırılır, temiz kapanmayan kırpılmış yükler dahil; düşürülmüş tool-call/result iskeleti ve tarihsel bağlam işaretleri kaldırılır; sızmış model denetim belirteçleri (`<|assistant|>`, diğer ASCII `<|...|>`, tam genişlikli `<｜...｜>`) kaldırılır; hatalı biçimlendirilmiş MiniMax tool-call XML kaldırılır.
- Kimlik bilgisi/token benzeri metin sansürlenir.
- Uzun bloklar kırpılabilir.
- Çok büyük geçmişler daha eski satırları düşürebilir veya aşırı büyük bir satırı `[sessions_history omitted: message too large]` ile değiştirebilir.
- Eski transkript pencerelerinde geriye doğru sayfalama yapmak için mevcut olduğunda `nextOffset` kullanın.
- Tam bayt bayt transkripte ihtiyacınız olduğunda ham disk üzerindeki transkript incelemesi yedek yoldur.

## Araç politikası

Alt ajanlar önce ebeveyn veya hedef ajanla aynı profil ve araç politikası
iş hattını kullanır. Ardından OpenClaw, alt ajan kısıtlama katmanını
uygular.

Kısıtlayıcı bir `tools.profile` yoksa alt ajanlar **mesaj aracı, oturum
araçları ve sistem araçları hariç tüm araçları** alır:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

`sessions_history` burada da sınırlı, temizlenmiş bir geri çağırma
görünümü olarak kalır — ham transkript dökümü değildir.

`maxSpawnDepth >= 2` olduğunda, derinlik-1 orkestratör alt ajanları ayrıca
alt ögelerini yönetebilmeleri için `sessions_spawn`, `subagents`,
`sessions_list` ve `sessions_history` alır.

### Yapılandırma ile geçersiz kılma

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` son bir yalnızca izin filtresidir. Zaten
çözülmüş araç kümesini daraltabilir, ancak `tools.profile` tarafından
kaldırılmış bir aracı **geri ekleyemez**. Örneğin,
`tools.profile: "coding"` `web_search`/`web_fetch` içerir, ancak `browser`
aracını içermez. Coding profilli alt ajanların tarayıcı otomasyonu
kullanmasına izin vermek için browser'ı profil aşamasında ekleyin:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Yalnızca bir ajanın tarayıcı otomasyonu alması gerektiğinde ajan başına
`agents.list[].tools.alsoAllow: ["browser"]` kullanın.

## Eşzamanlılık

Alt ajanlar özel bir süreç içi kuyruk hattı kullanır:

- **Hat adı:** `subagent`
- **Eşzamanlılık:** `agents.defaults.subagents.maxConcurrent` (varsayılan `8`)

## Canlılık ve kurtarma

OpenClaw, `endedAt` yokluğunu bir alt ajanın hâlâ canlı olduğuna dair
kalıcı kanıt olarak ele almaz. Eski çalışma penceresinden daha eski
sonlandırılmamış çalıştırmalar `/subagents list`, durum özetleri, alt
tamamlama geçidi ve oturum başına eşzamanlılık kontrollerinde
etkin/beklemede olarak sayılmayı bırakır.

Bir Gateway yeniden başlatmasından sonra, alt oturumları
`abortedLastRun: true` olarak işaretlenmedikçe eski sonlandırılmamış geri
yüklenmiş çalıştırmalar budanır. Bu yeniden başlatmada iptal edilmiş alt
oturumlar, iptal işaretini temizlemeden önce sentetik bir sürdürme mesajı
gönderen alt ajan yetim kurtarma akışı aracılığıyla kurtarılabilir kalır.

Otomatik yeniden başlatma kurtarması alt oturum başına sınırlıdır. Aynı
alt ajan alt ögesi hızlı yeniden sıkışma penceresi içinde tekrar tekrar
yetim kurtarma için kabul edilirse OpenClaw, o oturumda bir kurtarma
mezar taşı kalıcılaştırır ve sonraki yeniden başlatmalarda onu otomatik
sürdürmeyi durdurur. Görev kaydını uzlaştırmak için
`openclaw tasks maintenance --apply` veya mezar taşlı oturumlardaki eski
iptal edilmiş kurtarma bayraklarını temizlemek için `openclaw doctor --fix`
çalıştırın.

<Note>
Bir alt ajan oluşturma işlemi Gateway `PAIRING_REQUIRED` /
`scope-upgrade` ile başarısız olursa, eşleştirme durumunu düzenlemeden
önce RPC çağırıcısını kontrol edin. Dahili `sessions_spawn`
koordinasyonu, çağırıcı zaten gateway istek bağlamı içinde çalışıyorsa
süreç içinde dağıtılır; bu nedenle bir loopback WebSocket açmaz veya
CLI'nin eşleştirilmiş cihaz kapsamı taban çizgisine bağlı değildir.
Gateway süreci dışındaki çağırıcılar hâlâ doğrudan loopback paylaşılan
token/parola kimlik doğrulaması üzerinden `client.id: "gateway-client"`
ve `client.mode: "backend"` ile WebSocket yedeğini kullanır. Uzak
çağırıcılar, açık `deviceIdentity`, açık cihaz-token yolları ve
browser/node istemcileri kapsam yükseltmeleri için hâlâ normal cihaz
onayına ihtiyaç duyar.
</Note>

## Durdurma

- İstekte bulunan sohbette `/stop` göndermek, istekte bulunan oturumu iptal eder ve ondan oluşturulmuş tüm etkin alt ajan çalıştırmalarını durdurur; bu, iç içe alt ögelere zincirleme uygulanır.

## Sınırlamalar

- Alt ajan duyurusu **en iyi çaba** esasına dayanır. Gateway yeniden başlatılırsa bekleyen "geri duyur" işi kaybolur.
- Alt ajanlar hâlâ aynı gateway süreci kaynaklarını paylaşır; `maxConcurrent` değerini bir emniyet valfi olarak ele alın.
- `sessions_spawn` her zaman engellemesizdir: hemen `{ status: "accepted", runId, childSessionKey }` döndürür.
- Alt ajan bağlamı yalnızca `AGENTS.md` ve `TOOLS.md` enjekte eder (`SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` veya `BOOTSTRAP.md` yok). Codex yerel subagents aynı sınırı izler: `TOOLS.md` devralınan Codex iş parçacığı talimatlarında kalırken, yalnızca ebeveyne ait persona, kimlik ve kullanıcı dosyaları, alt ögelerin bunları klonlamaması için tur kapsamlı iş birliği talimatları olarak enjekte edilir.
- Maksimum iç içe geçme derinliği 5'tir (`maxSpawnDepth` aralığı: 1–5). Çoğu kullanım durumu için derinlik 2 önerilir.
- `maxChildrenPerAgent`, oturum başına etkin alt ögeleri sınırlar (varsayılan `5`, aralık `1–20`).

## İlgili

- [ACP ajanları](/tr/tools/acp-agents)
- [Ajan gönderimi](/tr/tools/agent-send)
- [Arka plan görevleri](/tr/automation/tasks)
- [Çok ajanlı sandbox araçları](/tr/tools/multi-agent-sandbox-tools)
