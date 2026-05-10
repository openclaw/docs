---
read_when:
    - Arka planda veya paralel çalışmanın ajan aracılığıyla yürütülmesini istiyorsunuz
    - sessions_spawn veya alt ajan araç politikasını değiştiriyorsunuz
    - İş parçacığına bağlı alt ajan oturumlarını uyguluyor veya sorunlarını gideriyorsunuz
sidebarTitle: Sub-agents
summary: İstek sahibinin sohbetine sonuçları geri bildiren yalıtılmış arka plan ajan çalıştırmaları başlatın
title: Alt ajanlar
x-i18n:
    generated_at: "2026-05-10T19:59:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b4a78b83fda42931ed2a4795e2db611121a30378de149c0478e989029123382
    source_path: tools/subagents.md
    workflow: 16
---

Alt ajanlar, mevcut bir ajan çalıştırmasından başlatılan arka plan ajan çalıştırmalarıdır.
Kendi oturumlarında (`agent:<agentId>:subagent:<uuid>`) çalışırlar ve,
tamamlandıklarında, sonuçlarını istekte bulunan sohbet kanalına **duyururlar**.
Her alt ajan çalıştırması bir
[arka plan görevi](/tr/automation/tasks) olarak izlenir.

Birincil hedefler:

- "araştırma / uzun görev / yavaş araç" işlerini ana çalıştırmayı engellemeden paralelleştirmek.
- Alt ajanları varsayılan olarak yalıtılmış tutmak (oturum ayrımı + isteğe bağlı korumalı alan).
- Araç yüzeyinin yanlış kullanımını zorlaştırmak: alt ajanlar varsayılan olarak oturum araçlarını almaz.
- Orkestratör desenleri için yapılandırılabilir iç içe geçme derinliğini desteklemek.

<Note>
**Maliyet notu:** her alt ajanın varsayılan olarak kendi bağlamı ve token
kullanımı vardır. Ağır veya yinelenen görevler için alt ajanlara daha ucuz
bir model ayarlayın ve ana ajanınızı daha yüksek kaliteli bir modelde tutun.
`agents.defaults.subagents.model` veya ajan başına geçersiz kılmalar üzerinden
yapılandırın. Bir alt öğe gerçekten istekte bulunanın mevcut transkriptine
    ihtiyaç duyduğunda, ajan o tek başlatmada `context: "fork"` isteyebilir.
    İş parçacığına bağlı alt ajan oturumları varsayılan olarak
    `context: "fork"` kullanır çünkü mevcut konuşmayı bir takip iş parçacığına
    dallandırırlar.
</Note>

## Eğik çizgi komutu

**Geçerli oturum** için alt ajan çalıştırmalarını incelemek veya denetlemek
üzere `/subagents` kullanın:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

Geçerli istekte bulunan oturumun etkin çalıştırmasını yönlendirmek için üst düzey [`/steer <message>`](/tr/tools/steer) kullanın. Hedef bir alt çalıştırma olduğunda `/subagents steer <id|#> <message>` kullanın.

`/subagents info`, çalıştırma meta verilerini (durum, zaman damgaları, oturum kimliği,
transkript yolu, temizleme) gösterir. Sınırlı ve güvenlik filtresinden geçirilmiş
geri çağırma görünümü için `sessions_history` kullanın; ham tam transkripte
ihtiyaç duyduğunuzda diskteki transkript yolunu inceleyin.

### İş parçacığı bağlama denetimleri

Bu komutlar, kalıcı iş parçacığı bağlamalarını destekleyen kanallarda çalışır.
Aşağıdaki [İş parçacığını destekleyen kanallar](#thread-supporting-channels) bölümüne bakın.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Başlatma davranışı

`/subagents spawn`, bir arka plan alt ajanını kullanıcı komutu olarak (dahili
aktarım değil) başlatır ve çalıştırma tamamlandığında istekte bulunan sohbete
tek bir son tamamlama güncellemesi gönderir.

<AccordionGroup>
  <Accordion title="Engellemesiz, anında iletim tabanlı tamamlama">
    - Başlatma komutu engellemesizdir; hemen bir çalıştırma kimliği döndürür.
    - Tamamlandığında alt ajan, istekte bulunan sohbet kanalına bir özet/sonuç mesajı duyurur.
    - Alt sonuçlara ihtiyaç duyan ajan dönüşleri, gerekli işi başlattıktan sonra `sessions_yield` çağırmalıdır. Bu, geçerli dönüşü sonlandırır ve tamamlama olaylarının modelin görebileceği bir sonraki mesaj olarak gelmesini sağlar.
    - Tamamlama anında iletim tabanlıdır. Başlatıldıktan sonra yalnızca bitmesini beklemek için `/subagents list`, `sessions_list` veya `sessions_history` komutlarını bir döngüde yoklamayın; durumu yalnızca hata ayıklama veya müdahale için isteğe bağlı olarak inceleyin.
    - Alt çıktı, istekte bulunan ajanın sentezlemesi için bir rapor/kanıttır. Kullanıcı tarafından yazılmış talimat metni değildir ve sistem, geliştirici veya kullanıcı politikasını geçersiz kılamaz.
    - Tamamlandığında OpenClaw, duyuru temizleme akışı devam etmeden önce o alt ajan oturumu tarafından açılan izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır.

  </Accordion>
  <Accordion title="Elle başlatma teslim dayanıklılığı">
    - OpenClaw, tamamlamaları kararlı bir idempotency anahtarına sahip bir `agent` dönüşü üzerinden istekte bulunan oturuma geri verir.
    - İstekte bulunan çalıştırma hâlâ etkinse OpenClaw, ikinci bir görünür yanıt yolu başlatmak yerine önce o çalıştırmayı uyandırmayı/yönlendirmeyi dener.
    - İstekte bulunan ajan tamamlama devri başarısız olursa veya görünür çıktı üretmezse OpenClaw teslimi başarısız kabul eder ve kuyruk yönlendirmesine/yeniden denemeye geri döner. Alt sonucu doğrudan harici sohbete ham olarak göndermez.
    - Doğrudan devir kullanılamazsa kuyruk yönlendirmesine geri döner.
    - Kuyruk yönlendirmesi hâlâ kullanılamıyorsa duyuru, son vazgeçmeden önce kısa bir üstel geri çekilmeyle yeniden denenir.
    - Tamamlama teslimi, çözümlenen istekte bulunan rotasını korur: mevcut olduğunda iş parçacığına bağlı veya konuşmaya bağlı tamamlama rotaları önceliklidir; tamamlama kaynağı yalnızca bir kanal sağlıyorsa OpenClaw, doğrudan teslimin yine de çalışması için eksik hedefi/hesabı istekte bulunan oturumun çözümlenmiş rotasından (`lastChannel` / `lastTo` / `lastAccountId`) doldurur.

  </Accordion>
  <Accordion title="Tamamlama devri meta verileri">
    İstekte bulunan oturuma tamamlama devri, çalışma zamanı tarafından
    üretilmiş dahili bağlamdır (kullanıcı tarafından yazılmış metin değil) ve şunları içerir:

    - `Result` — en son görünür `assistant` yanıt metni; yoksa temizlenmiş en son araç/toolResult metni. Terminal başarısız çalıştırmalar yakalanmış yanıt metnini yeniden kullanmaz.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompakt çalışma zamanı/token istatistikleri.
    - İstekte bulunan ajana normal asistan sesiyle yeniden yazmasını söyleyen bir teslim talimatı (ham dahili meta verileri iletmemesini ister).

  </Accordion>
  <Accordion title="Modlar ve ACP çalışma zamanı">
    - `--model` ve `--thinking`, o belirli çalıştırma için varsayılanları geçersiz kılar.
    - Tamamlandıktan sonra ayrıntıları ve çıktıyı incelemek için `info`/`log` kullanın.
    - `/subagents spawn` tek seferlik moddur (`mode: "run"`). Kalıcı iş parçacığına bağlı oturumlar için `thread: true` ve `mode: "session"` ile `sessions_spawn` kullanın.
    - ACP harness oturumları (Claude Code, Gemini CLI, OpenCode veya açık Codex ACP/acpx) için, araç bu çalışma zamanını duyurduğunda `runtime: "acp"` ile `sessions_spawn` kullanın. Tamamlamaları veya ajanlar arası döngüleri hata ayıklarken [ACP teslim modeli](/tr/tools/acp-agents#delivery-model) bölümüne bakın. `codex` Plugin etkin olduğunda, kullanıcı açıkça ACP/acpx istemedikçe Codex sohbet/iş parçacığı denetimi ACP yerine `/codex ...` tercih etmelidir.
    - OpenClaw, ACP etkinleştirilene, istekte bulunan korumalı alanda olmayana ve `acpx` gibi bir arka uç Plugin yüklenene kadar `runtime: "acp"` değerini gizler. `runtime: "acp"`, harici bir ACP harness kimliği veya `runtime.type="acp"` değerine sahip bir `agents.list[]` girdisi bekler; `agents_list` içindeki normal OpenClaw yapılandırma ajanları için varsayılan alt ajan çalışma zamanını kullanın.

  </Accordion>
</AccordionGroup>

## Bağlam modları

Yerel alt ajanlar, çağıran taraf mevcut transkripti çatallamayı açıkça
istemediği sürece yalıtılmış başlar.

| Mod        | Ne zaman kullanılmalı                                                                                                                   | Davranış                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Yeni araştırma, bağımsız uygulama, yavaş araç işi veya görev metninde özetlenebilecek herhangi bir şey                                  | Temiz bir alt transkript oluşturur. Varsayılan budur ve token kullanımını düşük tutar. |
| `fork`     | Geçerli konuşmaya, önceki araç sonuçlarına veya istekte bulunan transkriptinde zaten bulunan nüanslı talimatlara bağlı iş               | Alt başlamadan önce istekte bulunan transkriptini alt oturuma dallandırır. |

`fork` değerini idareli kullanın. Bu, bağlama duyarlı yetkilendirme içindir;
net bir görev istemi yazmanın yerine geçmez.

## Araç: `sessions_spawn`

Global `subagent` şeridinde `deliver: false` ile bir alt ajan çalıştırması
başlatır, ardından bir duyuru adımı çalıştırır ve duyuru yanıtını istekte
bulunan sohbet kanalına gönderir.

Kullanılabilirlik, çağıranın etkili araç politikasına bağlıdır. `coding` ve
`full` profilleri varsayılan olarak `sessions_spawn` sunar. `messaging` profili
sunmaz; işi devretmesi gereken ajanlar için `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` ekleyin veya `tools.profile: "coding"` kullanın. Kanal/grup,
sağlayıcı, korumalı alan ve ajan başına izin/verme politikaları, profil
aşamasından sonra aracı yine de kaldırabilir. Etkili araç listesini doğrulamak
için aynı oturumdan `/tools` kullanın.

**Varsayılanlar:**

- **Model:** `agents.defaults.subagents.model` (veya ajan başına `agents.list[].subagents.model`) ayarlamadığınız sürece çağırandan devralır; açık bir `sessions_spawn.model` yine de önceliklidir.
- **Düşünme:** `agents.defaults.subagents.thinking` (veya ajan başına `agents.list[].subagents.thinking`) ayarlamadığınız sürece çağırandan devralır; açık bir `sessions_spawn.thinking` yine de önceliklidir.
- **Çalıştırma zaman aşımı:** `sessions_spawn.runTimeoutSeconds` atlanırsa OpenClaw, ayarlandığında `agents.defaults.subagents.runTimeoutSeconds` kullanır; aksi halde `0` değerine (zaman aşımı yok) geri döner.

### Yetkilendirme istemi modu

`agents.defaults.subagents.delegationMode` yalnızca istem yönlendirmesini denetler; araç politikasını değiştirmez veya yetkilendirmeyi zorunlu kılmaz.

- `suggest` (varsayılan): daha büyük veya daha yavaş işler için alt ajanları kullanmaya yönelik standart istem yönlendirmesini korur.
- `prefer`: ana ajana duyarlı kalmasını ve doğrudan yanıttan daha kapsamlı olan her şeyi `sessions_spawn` üzerinden devretmesini söyler.

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
  Alt aracının görev açıklaması.
</ParamField>
<ParamField path="taskName" type="string">
  Daha sonra `subagents` hedeflemesi için isteğe bağlı kararlı tanıtıcı. `[a-z][a-z0-9_]{0,63}` ile eşleşmeli ve `last` veya `all` gibi ayrılmış hedefler olamaz. Koordinatörün birkaç alt öğe oluşturduktan sonra belirli bir alt öğeyi yönlendirmesi, sonlandırması veya tanımlaması gerekebileceğinde bunu tercih edin.
</ParamField>
<ParamField path="label" type="string">
  İsteğe bağlı, insan tarafından okunabilir etiket.
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents` tarafından izin verildiğinde başka bir aracı kimliği altında oluştur.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` yalnızca harici ACP donanımları (`claude`, `droid`, `gemini`, `opencode` veya açıkça istenen Codex ACP/acpx) ve `runtime.type` değeri `acp` olan `agents.list[]` girdileri içindir.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Yalnızca ACP. `runtime: "acp"` olduğunda mevcut bir ACP donanım oturumunu sürdürür; yerel alt aracı oluşturma işlemlerinde yok sayılır.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Yalnızca ACP. `runtime: "acp"` olduğunda ACP çalıştırma çıktısını üst oturuma aktarır; yerel alt aracı oluşturma işlemlerinde atlayın.
</ParamField>
<ParamField path="model" type="string">
  Alt aracı modelini geçersiz kıl. Geçersiz değerler atlanır ve alt aracı, araç sonucunda bir uyarıyla varsayılan modelde çalışır.
</ParamField>
<ParamField path="thinking" type="string">
  Alt aracı çalıştırması için düşünme düzeyini geçersiz kıl.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Ayarlandığında varsayılan olarak `agents.defaults.subagents.runTimeoutSeconds`, aksi halde `0` olur. Ayarlandığında, alt aracı çalıştırması N saniye sonra durdurulur.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` olduğunda, bu alt aracı oturumu için kanal iş parçacığı bağlaması ister.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` ise ve `mode` atlanırsa, varsayılan `session` olur. `mode: "session"` için `thread: true` gerekir.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` duyurudan hemen sonra arşivler (yine de yeniden adlandırma yoluyla transkripti tutar).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require`, hedef alt çalışma zamanı sandbox içinde değilse oluşturmayı reddeder.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork`, istekte bulunanın mevcut transkriptini alt oturuma dallandırır. Yalnızca yerel alt aracılar. İş parçacığına bağlı oluşturmalarda varsayılan `fork`; iş parçacığı olmayan oluşturmalarda varsayılan `isolated`.
</ParamField>

<Warning>
`sessions_spawn`, kanal teslim parametrelerini (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`) kabul **etmez**. Teslim için, oluşturulan çalıştırmadan
`message`/`sessions_send` kullanın.
</Warning>

### Görev adları ve hedefleme

`taskName`, oturum anahtarı değil, orkestrasyon için modele yönelik bir tanıtıcıdır.
Koordinatörün daha sonra ilgili alt öğeyi yönlendirmesi
veya sonlandırması gerekebileceğinde `review_subagents`,
`linux_validation` veya `docs_update` gibi kararlı alt öğe adları için kullanın.

Hedef çözümleme, tam `taskName` eşleşmelerini ve belirsiz olmayan
ön ekleri kabul eder. Eşleştirme, numaralı `/subagents` hedeflerinin kullandığı
aynı etkin/yakın geçmiş hedef penceresiyle sınırlıdır; bu nedenle eski, tamamlanmış bir alt öğe
yeniden kullanılan bir tanıtıcıyı belirsiz hale getirmez. İki etkin veya yakın geçmiş alt öğe aynı
`taskName` değerini paylaşıyorsa hedef belirsizdir; bunun yerine liste dizinini, oturum anahtarını veya
çalıştırma kimliğini kullanın.

Ayrılmış hedefler `last` ve `all`, zaten denetim anlamlarına sahip oldukları için
geçerli `taskName` değerleri değildir.

## Araç: `sessions_yield`

Geçerli model dönüşünü sonlandırır ve çalışma zamanı olaylarının, özellikle
alt aracı tamamlanma olaylarının, bir sonraki ileti olarak gelmesini bekler. İstekte bulunan,
bu tamamlanmalar gelene kadar nihai
yanıt üretemediğinde gerekli alt işleri oluşturduktan sonra kullanın.

`sessions_yield` bekleme ilkelidir. Alt öğe tamamlanmasını algılamak için bunu
`subagents`, `sessions_list`, `sessions_history`, kabuk
`sleep` veya süreç yoklama üzerinde yoklama
döngüleriyle değiştirmeyin.

Yalnızca oturumun etkili araç listesi bunu içerdiğinde `sessions_yield` kullanın.
Bazı minimal veya özel araç profilleri, `sessions_yield` sunmadan `sessions_spawn` ve
`subagents` sunabilir; bu durumda yalnızca tamamlanmayı beklemek için
bir yoklama döngüsü icat etmeyin.

Etkin alt öğeler varken OpenClaw, normal dönüşlere kompakt, çalışma zamanı tarafından oluşturulan
bir `Active Subagents` istem bloğu ekler; böylece istekte bulunan
geçerli alt oturumları, çalıştırma kimliklerini, durumları, etiketleri, görevleri ve
`taskName` takma adlarını yoklama yapmadan görebilir. Bu
blok içindeki görev ve etiket alanları talimat olarak değil, veri olarak alıntılanır; çünkü bunlar
kullanıcı/model tarafından sağlanan oluşturma argümanlarından gelebilir.

## Araç: `subagents`

İstekte bulunan oturuma ait oluşturulmuş alt aracı çalıştırmalarını
listeler, yönlendirir veya sonlandırır. Geçerli istekte bulunanla sınırlıdır; bir alt öğe yalnızca
kendi denetlediği alt öğeleri görebilir/denetleyebilir.

İsteğe bağlı durum, hata ayıklama, yönlendirme veya sonlandırma için `subagents` kullanın.
Tamamlanma olaylarını beklemek için `sessions_yield` kullanın.

## İş parçacığına bağlı oturumlar

Bir kanal için iş parçacığı bağlamaları etkinleştirildiğinde, bir alt aracı bir iş parçacığına bağlı
kalabilir; böylece bu iş parçacığındaki takip kullanıcı iletileri aynı
alt aracı oturumuna yönlendirilmeye devam eder.

### İş parçacığı destekleyen kanallar

**Discord** şu anda desteklenen tek kanaldır. Kalıcı
iş parçacığına bağlı alt aracı oturumlarını (`sessions_spawn` ile
`thread: true`), manuel iş parçacığı denetimlerini (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) ve bağdaştırıcı anahtarlarını
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` ve
`channels.discord.threadBindings.spawnSessions` destekler.

### Hızlı akış

<Steps>
  <Step title="Oluştur">
    `sessions_spawn` ile `thread: true` (ve isteğe bağlı olarak `mode: "session"`).
  </Step>
  <Step title="Bağla">
    OpenClaw, etkin kanalda ilgili oturum hedefine bir iş parçacığı oluşturur veya bağlar.
  </Step>
  <Step title="Takipleri yönlendir">
    Bu iş parçacığındaki yanıtlar ve takip iletileri bağlı oturuma yönlendirilir.
  </Step>
  <Step title="Zaman aşımlarını incele">
    Etkinsizlik otomatik odaktan çıkarma ayarını incelemek/güncellemek için `/session idle` ve
    katı sınırı denetlemek için `/session max-age` kullanın.
  </Step>
  <Step title="Ayır">
    Manuel olarak ayırmak için `/unfocus` kullanın.
  </Step>
</Steps>

### Manuel denetimler

| Komut              | Etki                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Geçerli iş parçacığını (veya yeni bir tane oluşturup) bir alt aracı/oturum hedefine bağlar |
| `/unfocus`         | Geçerli bağlı iş parçacığı için bağlamayı kaldırır                    |
| `/agents`          | Etkin çalıştırmaları ve bağlama durumunu listeler (`thread:<id>` veya `unbound`) |
| `/session idle`    | Boşta otomatik odaktan çıkarmayı incele/güncelle (yalnızca odaklanmış bağlı iş parçacıkları) |
| `/session max-age` | Katı sınırı incele/güncelle (yalnızca odaklanmış bağlı iş parçacıkları) |

### Yapılandırma anahtarları

- **Genel varsayılan:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanal geçersiz kılma ve oluşturma otomatik bağlama anahtarları** bağdaştırıcıya özeldir. Yukarıdaki [İş parçacığı destekleyen kanallar](#thread-supporting-channels) bölümüne bakın.

Geçerli bağdaştırıcı ayrıntıları için [Yapılandırma başvurusu](/tr/gateway/configuration-reference) ve
[Slash komutları](/tr/tools/slash-commands) bölümlerine bakın.

### İzin listesi

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Açık `agentId` üzerinden hedeflenebilecek aracı kimlikleri listesi (`["*"]` herhangi birine izin verir). Varsayılan: yalnızca istekte bulunan aracı. Bir liste ayarlarsanız ve yine de istekte bulunanın `agentId` ile kendisini oluşturmasını istiyorsanız, istekte bulunan kimliğini listeye ekleyin.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  İstekte bulunan aracı kendi `subagents.allowAgents` değerini ayarlamadığında kullanılan varsayılan hedef aracı izin listesi.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` atlayan `sessions_spawn` çağrılarını engeller (açık profil seçimini zorunlu kılar). Aracı başına geçersiz kılma: `agents.list[].subagents.requireAgentId`.
</ParamField>

İstekte bulunan oturum sandbox içindeyse, `sessions_spawn` sandbox dışında çalışacak
hedefleri reddeder.

### Keşif

`sessions_spawn` için şu anda hangi aracı kimliklerine izin verildiğini görmek için
`agents_list` kullanın. Yanıt, çağıranların PI, Codex
app-server ve yapılandırılmış diğer yerel çalışma zamanlarını ayırt edebilmesi için listelenen her aracının etkili
modelini ve gömülü çalışma zamanı meta verilerini içerir.

### Otomatik arşivleme

- Alt aracı oturumları, `agents.defaults.subagents.archiveAfterMinutes` sonrasında otomatik olarak arşivlenir (varsayılan `60`).
- Arşiv, `sessions.delete` kullanır ve transkripti `*.deleted.<timestamp>` olarak yeniden adlandırır (aynı klasör).
- `cleanup: "delete"` duyurudan hemen sonra arşivler (yine de yeniden adlandırma yoluyla transkripti tutar).
- Otomatik arşivleme en iyi çabayla yapılır; Gateway yeniden başlatılırsa bekleyen zamanlayıcılar kaybolur.
- `runTimeoutSeconds` otomatik arşivleme **yapmaz**; yalnızca çalıştırmayı durdurur. Oturum, otomatik arşivlemeye kadar kalır.
- Otomatik arşivleme, derinlik 1 ve derinlik 2 oturumlara eşit şekilde uygulanır.
- Tarayıcı temizliği, arşiv temizliğinden ayrıdır: izlenen tarayıcı sekmeleri/süreçleri, transkript/oturum kaydı tutulsa bile çalıştırma bittiğinde en iyi çabayla kapatılır.

## İç içe alt aracılar

Varsayılan olarak alt aracılar kendi alt aracılarını oluşturamaz
(`maxSpawnDepth: 1`). Bir düzey
iç içe geçirmeyi etkinleştirmek için `maxSpawnDepth: 2` ayarlayın — **orkestratör kalıbı**: ana → orkestratör alt aracı →
çalışan alt-alt aracılar.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### Derinlik düzeyleri

| Derinlik | Oturum anahtarı biçimi                       | Rol                                           | Oluşturabilir mi?             |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Ana aracı                                     | Her zaman                    |
| 1     | `agent:<id>:subagent:<uuid>`                 | Alt aracı (derinlik 2 izinliyse orkestratör)  | Yalnızca `maxSpawnDepth >= 2` ise |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Alt-alt aracı (uç çalışan)                    | Asla                         |

### Duyuru zinciri

Sonuçlar zincirde yukarı doğru akar:

1. Derinlik 2 çalışanı biter → üst öğesine (derinlik 1 orkestratör) duyurur.
2. Derinlik 1 orkestratör duyuruyu alır, sonuçları sentezler, biter → ana aracıya duyurur.
3. Ana aracı duyuruyu alır ve kullanıcıya iletir.

Her düzey yalnızca doğrudan alt öğelerinden gelen duyuruları görür.

<Note>
**Operasyonel yönerge:** alt işi bir kez başlatın ve `sessions_list`,
`sessions_history`, `/subagents list` veya `exec` uyku komutları çevresinde
yoklama döngüleri oluşturmak yerine tamamlanma
olaylarını bekleyin. `sessions_list` ve `/subagents list`, alt oturum ilişkilerini
canlı işe odaklı tutar — canlı alt öğeler bağlı kalır, biten alt öğeler kısa bir yakın geçmiş penceresinde
görünür kalır ve eski, yalnızca depoda bulunan alt bağlantılar
güncellik pencerelerinden sonra yok sayılır. Bu, eski `spawnedBy` /
`parentSessionKey` meta verilerinin yeniden başlatmadan sonra hayalet alt öğeleri
yeniden ortaya çıkarmasını önler. Bir alt öğe tamamlanma olayı, nihai yanıtı
zaten gönderdikten sonra gelirse, doğru takip tam sessiz belirteçtir:
`NO_REPLY` / `no_reply`.
</Note>

### Derinliğe göre araç ilkesi

- Rol ve denetim kapsamı, oluşturma zamanında oturum meta verilerine yazılır. Bu, düzleştirilmiş veya geri yüklenmiş oturum anahtarlarının yanlışlıkla orkestratör ayrıcalıklarını yeniden kazanmasını önler.
- **Derinlik 1 (orkestratör, `maxSpawnDepth >= 2` olduğunda):** çocuklarını yönetebilmesi için `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` alır. Diğer oturum/sistem araçları reddedilmiş olarak kalır.
- **Derinlik 1 (yaprak, `maxSpawnDepth == 1` olduğunda):** oturum aracı yoktur (geçerli varsayılan davranış).
- **Derinlik 2 (yaprak worker):** oturum aracı yoktur — `sessions_spawn` derinlik 2'de her zaman reddedilir. Daha fazla çocuk oluşturamaz.

### Ajan başına oluşturma sınırı

Her ajan oturumu (herhangi bir derinlikte) aynı anda en fazla `maxChildrenPerAgent`
(varsayılan `5`) etkin çocuğa sahip olabilir. Bu, tek bir orkestratörden
kontrolsüz yayılmayı önler.

### Kademeli durdurma

Derinlik 1 orkestratörünü durdurmak, tüm derinlik 2 çocuklarını
otomatik olarak durdurur:

- Ana sohbette `/stop`, tüm derinlik 1 ajanlarını durdurur ve derinlik 2 çocuklarına kademeli olarak uygulanır.
- `/subagents kill <id>` belirli bir alt ajanı durdurur ve çocuklarına kademeli olarak uygulanır.
- `/subagents kill all` istekte bulunan için tüm alt ajanları durdurur ve kademeli olarak uygulanır.

## Kimlik Doğrulama

Alt ajan kimlik doğrulaması, oturum türüne göre değil **ajan kimliğine** göre çözümlenir:

- Alt ajan oturum anahtarı `agent:<agentId>:subagent:<uuid>` şeklindedir.
- Kimlik doğrulama deposu, o ajanın `agentDir` konumundan yüklenir.
- Ana ajanın kimlik doğrulama profilleri **yedek** olarak birleştirilir; çakışmalarda ajan profilleri ana profilleri geçersiz kılar.

Birleştirme eklemelidir, bu nedenle ana profiller her zaman yedek
olarak kullanılabilir. Ajan başına tamamen yalıtılmış kimlik doğrulama
henüz desteklenmemektedir.

## Duyuru

Alt ajanlar bir duyuru adımı aracılığıyla geri bildirim yapar:

- Duyuru adımı alt ajan oturumu içinde çalışır (istekte bulunan oturumunda değil).
- Alt ajan tam olarak `ANNOUNCE_SKIP` yanıtını verirse hiçbir şey gönderilmez.
- En son assistant metni tam sessiz token `NO_REPLY` / `no_reply` ise, daha önce görünür ilerleme olmuş olsa bile duyuru çıktısı bastırılır.

Teslimat, istekte bulunanın derinliğine bağlıdır:

- Üst düzey istek sahibi oturumları, harici teslimatla (`deliver=true`) bir takip `agent` çağrısı kullanır.
- İç içe istek sahibi alt ajan oturumları, orkestratörün çocuk sonuçlarını oturum içinde sentezleyebilmesi için dahili bir takip enjeksiyonu (`deliver=false`) alır.
- İç içe istek sahibi alt ajan oturumu yoksa, OpenClaw mevcut olduğunda o oturumun istekte bulunanına geri döner.

Üst düzey istek sahibi oturumları için, tamamlama modu doğrudan teslimat önce
bağlı konuşma/iş parçacığı rotasını ve hook geçersiz kılmasını çözümler, ardından
eksik kanal-hedef alanlarını istek sahibi oturumunun saklanan rotasından doldurur.
Bu, tamamlama kaynağı yalnızca kanalı tanımlasa bile tamamlamaların doğru sohbet/konu
üzerinde kalmasını sağlar.

Çocuk tamamlama toplaması, iç içe tamamlama bulguları oluşturulurken
geçerli istek sahibi çalıştırmasıyla sınırlandırılır ve eski önceki çalıştırma
çocuk çıktılarının geçerli duyuruya sızmasını önler. Duyuru yanıtları,
kanal adaptörlerinde mevcut olduğunda iş parçacığı/konu yönlendirmesini korur.

### Duyuru bağlamı

Duyuru bağlamı, kararlı bir dahili olay bloğuna normalleştirilir:

| Alan           | Kaynak                                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| Kaynak         | `subagent` veya `cron`                                                                                          |
| Oturum kimlikleri | Çocuk oturum anahtarı/kimliği                                                                               |
| Tür            | Duyuru türü + görev etiketi                                                                                     |
| Durum          | Çalışma zamanı sonucundan türetilir (`success`, `error`, `timeout` veya `unknown`) — model metninden **çıkarılmaz** |
| Sonuç içeriği  | En son görünür assistant metni, aksi halde temizlenmiş en son araç/toolResult metni                            |
| Takip          | Ne zaman yanıt verileceğini ve ne zaman sessiz kalınacağını açıklayan talimat                                  |

Terminalde başarısız olan çalıştırmalar, yakalanan yanıt metnini yeniden oynatmadan
başarısızlık durumunu bildirir. Zaman aşımında, çocuk yalnızca araç çağrılarına
kadar ilerlediyse, duyuru ham araç çıktısını yeniden oynatmak yerine bu geçmişi
kısa bir kısmi ilerleme özetine daraltabilir.

### İstatistik satırı

Duyuru payload'ları sonunda (sarılmış olsa bile) bir istatistik satırı içerir:

- Çalışma zamanı (ör. `runtime 5m12s`).
- Token kullanımı (girdi/çıktı/toplam).
- Model fiyatlandırması yapılandırıldığında tahmini maliyet (`models.providers.*.models[].cost`).
- Ana ajanın `sessions_history` aracılığıyla geçmişi alabilmesi veya diskteki dosyayı inceleyebilmesi için `sessionKey`, `sessionId` ve transcript yolu.

Dahili meta veriler yalnızca orkestrasyon içindir; kullanıcıya dönük yanıtlar
normal assistant sesiyle yeniden yazılmalıdır.

### Neden `sessions_history` tercih edilmeli

`sessions_history` daha güvenli orkestrasyon yoludur:

- Assistant hatırlaması önce normalleştirilir: düşünme etiketleri kaldırılır; `<relevant-memories>` / `<relevant_memories>` iskeleti kaldırılır; düz metin araç çağrısı XML payload blokları (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) kaldırılır; temiz kapanmayan kesilmiş payload'lar da buna dahildir; düşürülmüş araç çağrısı/sonuç iskeleti ve geçmiş bağlam işaretçileri kaldırılır; sızmış model denetim token'ları (`<|assistant|>`, diğer ASCII `<|...|>`, tam genişlik `<｜...｜>`) kaldırılır; hatalı biçimlendirilmiş MiniMax araç çağrısı XML'i kaldırılır.
- Kimlik bilgisi/token benzeri metin redakte edilir.
- Uzun bloklar kısaltılabilir.
- Çok büyük geçmişler eski satırları düşürebilir veya aşırı büyük bir satırı `[sessions_history omitted: message too large]` ile değiştirebilir.
- Ham disk üzerindeki transcript incelemesi, tam bayt bayt transcript gerektiğinde yedek yoldur.

## Araç ilkesi

Alt ajanlar önce üst veya hedef ajanla aynı profil ve araç ilkesi hattını
kullanır. Bundan sonra OpenClaw, alt ajan kısıtlama katmanını uygular.

Kısıtlayıcı bir `tools.profile` olmadığında, alt ajanlar **oturum araçları
ve sistem araçları hariç tüm araçları** alır:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` burada da sınırlı, temizlenmiş bir hatırlama görünümü olarak kalır —
ham transcript dökümü değildir.

`maxSpawnDepth >= 2` olduğunda, derinlik 1 orkestratör alt ajanları
çocuklarını yönetebilmeleri için ayrıca `sessions_spawn`, `subagents`,
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

`tools.subagents.tools.allow` son bir yalnızca-izin filtresidir. Zaten çözümlenmiş
araç kümesini daraltabilir, ancak `tools.profile` tarafından kaldırılmış bir aracı
**geri ekleyemez**. Örneğin, `tools.profile: "coding"` `web_search`/`web_fetch`
içerir ancak `browser` aracını içermez. Coding profilli alt ajanların tarayıcı
otomasyonu kullanmasına izin vermek için, browser'ı profil aşamasında ekleyin:

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

Alt ajanlar ayrılmış bir süreç içi kuyruk hattı kullanır:

- **Hat adı:** `subagent`
- **Eşzamanlılık:** `agents.defaults.subagents.maxConcurrent` (varsayılan `8`)

## Canlılık ve kurtarma

OpenClaw, `endedAt` yokluğunu bir alt ajanın hâlâ canlı olduğuna dair kalıcı
kanıt olarak görmez. Bayat çalıştırma penceresinden daha eski sonlandırılmamış
çalıştırmalar `/subagents list`, durum özetleri, soyundan gelen tamamlama kapıları
ve oturum başına eşzamanlılık kontrollerinde etkin/beklemede sayılmayı bırakır.

Gateway yeniden başlatıldıktan sonra, bayat sonlandırılmamış geri yüklenmiş
çalıştırmalar, çocuk oturumları `abortedLastRun: true` olarak işaretlenmedikçe
budanır. Bu yeniden başlatma nedeniyle iptal edilmiş çocuk oturumları, iptal
işaretçisini temizlemeden önce sentetik bir sürdürme mesajı gönderen alt ajan
yetim kurtarma akışı üzerinden kurtarılabilir kalır.

Otomatik yeniden başlatma kurtarması çocuk oturumu başına sınırlıdır. Aynı
alt ajan çocuğu hızlı yeniden takılma penceresi içinde tekrar tekrar yetim
kurtarma için kabul edilirse, OpenClaw o oturumda bir kurtarma tombstone'u
kalıcılaştırır ve sonraki yeniden başlatmalarda onu otomatik sürdürmeyi durdurur.
Görev kaydını uzlaştırmak için `openclaw tasks maintenance --apply` çalıştırın
veya tombstone'lanmış oturumlarda bayat iptal edilmiş kurtarma bayraklarını
temizlemek için `openclaw doctor --fix` kullanın.

<Note>
Bir alt ajan oluşturma işlemi Gateway `PAIRING_REQUIRED` /
`scope-upgrade` ile başarısız olursa, eşleştirme durumunu düzenlemeden önce
RPC çağıranını kontrol edin. Dahili `sessions_spawn` koordinasyonu, doğrudan
local loopback paylaşılan token/parola kimlik doğrulaması üzerinden
`client.id: "gateway-client"` ve `client.mode: "backend"` olarak bağlanmalıdır;
bu yol, CLI'nin eşleştirilmiş cihaz kapsamı temel çizgisine bağlı değildir.
Uzak çağıranlar, açık `deviceIdentity`, açık cihaz token yolları ve browser/node
istemcileri kapsam yükseltmeleri için hâlâ normal cihaz onayına ihtiyaç duyar.
</Note>

## Durdurma

- İstek sahibi sohbetinde `/stop` göndermek, istek sahibi oturumunu iptal eder ve ondan oluşturulmuş etkin alt ajan çalıştırmalarını durdurur; iç içe çocuklara kademeli olarak uygulanır.
- `/subagents kill <id>` belirli bir alt ajanı durdurur ve çocuklarına kademeli olarak uygulanır.

## Sınırlamalar

- Alt ajan duyurusu **en iyi çaba** esaslıdır. Gateway yeniden başlatılırsa bekleyen "geri duyur" işi kaybolur.
- Alt ajanlar hâlâ aynı Gateway süreç kaynaklarını paylaşır; `maxConcurrent` değerini bir emniyet valfi olarak değerlendirin.
- `sessions_spawn` her zaman engellemesizdir: hemen `{ status: "accepted", runId, childSessionKey }` döndürür.
- Alt ajan bağlamı yalnızca `AGENTS.md`, `TOOLS.md`, `SOUL.md`, `IDENTITY.md` ve `USER.md` enjekte eder (`MEMORY.md`, `HEARTBEAT.md` veya `BOOTSTRAP.md` yoktur).
- En fazla iç içe geçme derinliği 5'tir (`maxSpawnDepth` aralığı: 1–5). Çoğu kullanım durumu için derinlik 2 önerilir.
- `maxChildrenPerAgent`, oturum başına etkin çocukları sınırlar (varsayılan `5`, aralık `1–20`).

## İlgili

- [ACP ajanları](/tr/tools/acp-agents)
- [Ajan gönderme](/tr/tools/agent-send)
- [Arka plan görevleri](/tr/automation/tasks)
- [Çok ajanlı sandbox araçları](/tr/tools/multi-agent-sandbox-tools)
