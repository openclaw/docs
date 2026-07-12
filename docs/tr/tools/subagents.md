---
read_when:
    - Agent aracılığıyla arka planda veya paralel çalışma yapmak istiyorsunuz
    - sessions_spawn veya alt ajan araç politikasını değiştiriyorsunuz
    - İş parçacığına bağlı alt ajan oturumlarını uyguluyor veya bu oturumlardaki sorunları gideriyorsunuz
sidebarTitle: Sub-agents
summary: Sonuçları istekte bulunan sohbete bildiren yalıtılmış arka plan agent çalıştırmaları başlatın
title: Alt ajanlar
x-i18n:
    generated_at: "2026-07-12T12:50:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2293993ad99e2797f5cfbe13e964487f3bd0fa0a3114e78d25ce5862768b9ca
    source_path: tools/subagents.md
    workflow: 16
---

Alt ajanlar, mevcut bir ajan çalıştırmasından başlatılan arka plan ajan çalıştırmalarıdır.
Her biri kendi oturumunda (`agent:<agentId>:subagent:<uuid>`) çalışır ve
tamamlandığında sonucunu istekte bulunan sohbet kanalına **bildirir**.
Her alt ajan çalıştırması bir [arka plan görevi](/tr/automation/tasks) olarak izlenir.

Hedefler:

- Ana çalıştırmayı engellemeden araştırmayı, uzun görevleri ve yavaş araç çalışmalarını paralelleştirmek.
- Alt ajanları varsayılan olarak yalıtılmış tutmak (oturum ayrımı, isteğe bağlı korumalı alan).
- Araç yüzeyinin kötüye kullanılmasını zorlaştırmak: alt ajanlar varsayılan olarak oturum veya mesaj araçlarına erişemez.
- Orkestratör örüntüleri için yapılandırılabilir iç içe geçme derinliğini desteklemek.

<Note>
**Maliyet notu:** Varsayılan olarak her alt ajanın kendi bağlamı ve token kullanımı
vardır. Yoğun veya tekrarlanan görevlerde alt ajanlar için daha ucuz bir model
belirleyin ve `agents.defaults.subagents.model` ya da ajan başına geçersiz
kılmalar aracılığıyla ana ajanınızda daha yüksek kaliteli bir model kullanın.
Bir alt öğenin istekte bulunanın mevcut transkriptine gerçekten ihtiyacı olduğunda
onu `context: "fork"` ile başlatın. İş parçacığına bağlı alt ajan oturumları,
mevcut konuşmayı bir takip iş parçacığına dallandırdıkları için varsayılan olarak
`context: "fork"` kullanır.
</Note>

## Eğik çizgi komutu

`/subagents`, **geçerli oturumdaki** alt ajan çalıştırmalarını inceler:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` çalıştırma meta verilerini (durum, zaman damgaları, oturum kimliği,
transkript yolu, temizleme) gösterir. `/subagents log`, bir çalıştırmanın son sohbet
sıralarını yazdırır; araç çağrısı/sonuç mesajlarını eklemek için `tools` token'ını
ekleyin (varsayılan olarak hariç tutulur). Bir ajan sırası içinden sınırlı ve
güvenlik filtresinden geçirilmiş bir hatırlama görünümü için `sessions_history`
kullanın veya ham tam transkript için diskteki transkript yolunu inceleyin.

### İş parçacığı bağlama denetimleri

Bu komutlar kalıcı iş parçacığı bağlamalarını destekleyen kanallarda çalışır. Aşağıdaki
[İş parçacığını destekleyen kanallar](#thread-supporting-channels) bölümüne bakın.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Başlatma davranışı

Ajanlar, `sessions_spawn` aracıyla arka plan alt ajanlarını başlatır.
Tamamlanmalar dahili üst oturum olayları olarak döner; kullanıcıya yönelik bir
güncellemenin gerekip gerekmediğine üst/istekte bulunan ajan karar verir.

<AccordionGroup>
  <Accordion title="Engellemeyen, gönderim tabanlı tamamlanma">
    - `sessions_spawn` engellemez; hemen bir çalıştırma kimliği döndürür.
    - Alt ajan, tamamlandığında üst/istekte bulunan oturuma geri bildirimde bulunur.
    - Alt öğe sonuçlarına ihtiyaç duyan ajan sıraları, gerekli çalışmaları başlattıktan sonra `sessions_yield` çağırmalıdır. Bu, geçerli sırayı sonlandırır ve tamamlanma olayının modelin görebildiği sonraki mesaj olarak ulaşmasını sağlar.
    - Tamamlanma gönderim tabanlıdır. Başlatıldıktan sonra yalnızca bitmesini beklemek için `/subagents list`, `sessions_list` veya `sessions_history` komutlarını döngü içinde **yoklamayın**; durumu yalnızca hata ayıklarken gerektiğinde denetleyin.
    - Alt öğe çıktısı, istekte bulunan ajanın sentezlemesi için bir rapor/kanıttır. Kullanıcı tarafından yazılmış talimat metni değildir ve sistem, geliştirici veya kullanıcı politikasını geçersiz kılamaz.
    - Tamamlanma sırasında OpenClaw, bildirim temizleme akışı devam etmeden önce söz konusu alt ajan oturumu tarafından açılmış izlenen tarayıcı sekmelerini/süreçlerini mümkün olan en iyi şekilde kapatır.

  </Accordion>
  <Accordion title="Tamamlanma teslimi">
    - OpenClaw, tamamlanmaları kararlı bir eşgüçlülük anahtarına sahip bir `agent` sırası üzerinden istekte bulunan oturuma geri iletir.
    - İstekte bulunan çalıştırma hâlâ etkinse OpenClaw, ikinci bir görünür yanıt yolu başlatmak yerine önce bu çalıştırmayı uyandırmayı/yönlendirmeyi dener.
    - Etkin istekte bulunan uyandırılamazsa OpenClaw, bildirimi düşürmek yerine aynı tamamlanma bağlamıyla istekte bulunan ajana devretmeye geri döner.
    - Başarılı bir üst öğe devri, üst öğe görünür bir kullanıcı güncellemesine gerek olmadığına karar verse bile alt ajan teslimini tamamlar.
    - Yerel alt ajanlar mesaj aracına erişemez. Üst/istekte bulunan ajana düz asistan metni döndürürler; insanların görebildiği yanıtlar üst/istekte bulunan ajanın normal teslim politikasının sorumluluğunda kalır.
    - Doğrudan devir kullanılamazsa teslim, kuyruk yönlendirmeye; ardından tamamen vazgeçmeden önce bildirimin kısa bir üstel geri çekilme yeniden denemesine geri döner.
    - Teslim, çözümlenmiş istekte bulunan rotasını korur: mevcut olduğunda iş parçacığına veya konuşmaya bağlı tamamlanma rotaları önceliklidir. Tamamlanma kaynağı yalnızca bir kanal sağlıyorsa OpenClaw, doğrudan teslimin çalışmaya devam etmesi için eksik hedefi/hesabı istekte bulunan oturumun çözümlenmiş rotasından (`lastChannel` / `lastTo` / `lastAccountId`) doldurur.

  </Accordion>
  <Accordion title="Tamamlanma devir meta verileri">
    İstekte bulunan oturuma yapılan tamamlanma devri, çalışma zamanı tarafından
    oluşturulan dahili bağlamdır (kullanıcı tarafından yazılmış metin değildir) ve
    şunları içerir:

    - `Result` — alt öğenin en son görünür `assistant` yanıt metni. Tool/toolResult çıktısı alt öğe sonuçlarına yükseltilmez. Sonlandırıcı başarısız çalıştırmalar, yakalanmış yanıt metnini yeniden kullanmaz.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Kompakt çalışma zamanı/token istatistikleri.
    - İstekte bulunan ajana, özgün görevin tamamlanıp tamamlanmadığına karar vermeden önce sonucu doğrulamasını söyleyen bir inceleme talimatı.
    - Alt öğe sonucu daha fazla işlem gerektiriyorsa istekte bulunan ajana göreve devam etmesini veya bir takip kaydetmesini söyleyen takip yönlendirmesi.
    - Başka işlem gerekmeyen yol için, ham dahili meta verileri iletmeden normal asistan üslubuyla yazılmış bir son güncelleme talimatı.

  </Accordion>
  <Accordion title="Modlar ve ACP çalışma zamanı">
    - `--model` ve `--thinking`, söz konusu çalıştırma için varsayılanları geçersiz kılar.
    - Tamamlanma sonrasında ayrıntıları ve çıktıyı incelemek için `info`/`log` kullanın.
    - Kalıcı iş parçacığına bağlı oturumlar için `sessions_spawn` aracını `thread: true` ve `mode: "session"` ile kullanın.
    - İstekte bulunan kanal iş parçacığı bağlamalarını desteklemiyorsa olanaksız bir iş parçacığına bağlı birleşimi yeniden denemek yerine `mode: "run"` kullanın.
    - ACP düzenek oturumları (Claude Code, Gemini CLI, OpenCode veya açık Codex ACP/acpx) için araç bu çalışma zamanını tanıtıyorsa `sessions_spawn` aracını `runtime: "acp"` ile kullanın. Tamamlanmalarda veya ajanlar arası döngülerde hata ayıklarken [ACP teslim modeli](/tr/tools/acp-agents#delivery-model) bölümüne bakın. `codex` plugini etkinleştirildiğinde kullanıcı açıkça ACP/acpx istemediği sürece Codex sohbet/iş parçacığı denetimi ACP yerine `/codex ...` tercih etmelidir.
    - OpenClaw; ACP etkinleştirilene, istekte bulunan korumalı alanda olmayana ve `acpx` gibi bir arka uç plugini yüklenene kadar `runtime: "acp"` seçeneğini gizler. `runtime: "acp"`, harici bir ACP düzenek kimliği veya `runtime.type="acp"` içeren bir `agents.list[]` girdisi bekler; `agents_list` içindeki normal OpenClaw yapılandırma ajanları için varsayılan alt ajan çalışma zamanını kullanın.

  </Accordion>
</AccordionGroup>

## Bağlam modları

Yerel alt ajanlar, çağıran geçerli transkripti çatallamayı açıkça istemediği sürece
yalıtılmış olarak başlar.

| Mod        | Ne zaman kullanılmalı                                                                                                                   | Davranış                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Yeni araştırma, bağımsız uygulama, yavaş araç çalışması veya görev metninde açıklanabilecek herhangi bir iş                            | Temiz bir alt öğe transkripti oluşturur. Bu varsayılandır ve token kullanımını daha düşük tutar. |
| `fork`     | Geçerli konuşmaya, önceki araç sonuçlarına veya istekte bulunanın transkriptinde zaten bulunan incelikli talimatlara bağlı çalışmalar | Alt öğe başlamadan önce istekte bulunanın transkriptini alt öğe oturumuna dallandırır. |

`fork` seçeneğini ölçülü kullanın. Bağlama duyarlı yetkilendirme içindir; açık bir
görev istemi yazmanın yerine geçmez.

## Araç: `sessions_spawn`

Genel `subagent` hattında `deliver: false` ile bir alt ajan çalıştırması başlatır,
ardından bir bildirim adımı çalıştırır ve bildirim yanıtını istekte bulunan sohbet
kanalına gönderir.

Kullanılabilirlik, çağıranın etkin araç politikasına bağlıdır. Yerleşik `coding`
profili `sessions_spawn` aracını içerir; `messaging` ve `minimal` içermez.
`full` tüm araçlara izin verir. Daha dar bir profilde olup yine de iş
yetkilendirmesi gereken ajanlar için `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]` ekleyin veya `tools.profile: "coding"` kullanın.
Kanal/grup, sağlayıcı, korumalı alan ve ajan başına izin verme/reddetme politikaları
profil aşamasından sonra da aracı kaldırabilir. Etkin araç listesini doğrulamak
için aynı oturumdan `/tools` kullanın.

**Varsayılanlar:**

- **Model:** `agents.defaults.subagents.model` (veya ajan başına `agents.list[].subagents.model`) ayarlamadığınız sürece yerel alt ajanlar çağıranın modelini devralır. ACP çalışma zamanı başlatmaları, mevcut olduğunda aynı yapılandırılmış alt ajan modelini kullanır; aksi takdirde ACP düzeneği kendi varsayılanını korur. Açık bir `sessions_spawn.model` değeri yine önceliklidir.
- **Düşünme:** `agents.defaults.subagents.thinking` (veya ajan başına `agents.list[].subagents.thinking`) ayarlamadığınız sürece yerel alt ajanlar çağıranın ayarını devralır. ACP çalışma zamanı başlatmaları ayrıca seçilen model için `agents.defaults.models["provider/model"].params.thinking` değerini uygular. Açık bir `sessions_spawn.thinking` değeri yine önceliklidir.
- **Çalıştırma zaman aşımı:** OpenClaw, ayarlanmışsa `agents.defaults.subagents.runTimeoutSeconds` değerini kullanır; aksi takdirde `0` değerine (zaman aşımı yok) geri döner. `sessions_spawn`, çağrı başına zaman aşımı geçersiz kılmalarını kabul etmez.
- **Görev teslimi:** yerel alt ajanlar, yetkilendirilen görevi ilk görünür `[Subagent Task]` mesajlarında alır. Alt ajan sistem istemi çalışma zamanı kurallarını ve yönlendirme bağlamını taşır; görevin gizli bir kopyasını taşımaz.

Kabul edilen yerel alt ajan başlatmaları, çözümlenmiş alt öğe modelinin meta
verilerini araç sonucuna dahil eder: `resolvedModel`, uygulanan model başvurusunu;
`resolvedProvider` ise başvuruda sağlayıcı öneki bulunduğunda bu öneki içerir.

### Yetkilendirme istemi modu

`agents.defaults.subagents.delegationMode` yalnızca istem yönlendirmesini denetler; araç politikasını değiştirmez veya yetkilendirmeyi zorunlu kılmaz.

- `suggest` (varsayılan): daha büyük veya daha yavaş çalışmalar için alt ajanları kullanmaya yönelik standart istem teşvikini korur.
- `prefer`: ana ajana hızlı yanıt vermeye devam etmesini ve doğrudan bir yanıttan daha kapsamlı her işi `sessions_spawn` üzerinden yetkilendirmesini söyler.

Ajan başına geçersiz kılma: `agents.list[].subagents.delegationMode`.

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
  Alt ajan için görev açıklaması.
</ParamField>
<ParamField path="taskName" type="string">
  Daha sonraki durum çıktısında belirli bir alt öğeyi tanımlamak için isteğe bağlı kararlı tanıtıcı. `[a-z][a-z0-9_-]{0,63}` kalıbıyla eşleşmeli ve `last` veya `all` gibi ayrılmış bir hedef olamaz.
</ParamField>
<ParamField path="label" type="string">
  İsteğe bağlı, insanlar tarafından okunabilir etiket.
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents` tarafından izin verildiğinde, yapılandırılmış başka bir ajan kimliği altında başlatır.
</ParamField>
<ParamField path="cwd" type="string">
  Alt çalıştırma için isteğe bağlı görev çalışma dizini. Yerel alt ajanlar önyükleme dosyalarını yine hedef ajanın çalışma alanından yükler; `cwd` yalnızca çalışma zamanı araçlarının ve CLI çalıştırma düzeneklerinin devredilen işi nerede yaptığını değiştirir.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` yalnızca harici ACP çalıştırma düzenekleri (`claude`, `droid`, `gemini`, `opencode` veya açıkça istenen Codex ACP/acpx) ve `runtime.type` değeri `acp` olan `agents.list[]` girdileri içindir.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Yalnızca ACP. `runtime: "acp"` olduğunda mevcut bir ACP çalıştırma düzeneği oturumunu sürdürür; yerel alt ajan başlatmalarında yok sayılır.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Yalnızca ACP. `runtime: "acp"` olduğunda ACP çalıştırma çıktısını üst oturuma aktarır; yerel alt ajan başlatmalarında belirtmeyin.
</ParamField>
<ParamField path="model" type="string">
  Alt ajan modelini geçersiz kılar. Geçersiz değerler atlanır ve alt ajan, araç sonucundaki bir uyarıyla varsayılan modelde çalışır.
</ParamField>
<ParamField path="thinking" type="string">
  Alt ajan çalıştırması için düşünme düzeyini geçersiz kılar.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` olduğunda bu alt ajan oturumu için kanal ileti dizisi bağlaması ister.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` ise ve `mode` belirtilmezse varsayılan değer `session` olur. `mode: "session"`, `thread: true` gerektirir.
  İstekte bulunan kanal için ileti dizisi bağlaması kullanılamıyorsa bunun yerine `mode: "run"` kullanın.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"`, duyurudan hemen sonra oturumu arşivler (yeniden adlandırma yoluyla dökümü yine saklar).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require`, hedef alt çalışma zamanı korumalı alanda değilse başlatmayı reddeder.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork`, istekte bulunanın geçerli dökümünü alt oturuma dallandırır. Yalnızca yerel alt ajanlar içindir. İleti dizisine bağlı başlatmalar varsayılan olarak `fork`, ileti dizisine bağlı olmayan başlatmalar ise `isolated` kullanır.
</ParamField>

<Warning>
`sessions_spawn`, kanal teslim parametrelerini (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`) **kabul etmez**. Yerel alt ajanlar,
en son asistan iletilerini istekte bulunana geri bildirir; harici teslimat
üst/istekte bulunan ajanın sorumluluğunda kalır.
</Warning>

### Görev adları ve hedefleme

`taskName`, düzenleme için modele yönelik bir tanıtıcıdır; oturum anahtarı değildir.
Bir koordinatörün daha sonra ilgili alt öğeyi incelemesi gerekebilecek durumlarda
`review_subagents`, `linux_validation` veya `docs_update` gibi kararlı alt öğe adları için kullanın.

Hedef çözümleme, tam `taskName` eşleşmelerini ve belirsiz olmayan
önekleri kabul eder. Eşleştirme, numaralı `/subagents` hedeflerinin kullandığı
aynı etkin/yakın tarihli hedef penceresiyle sınırlıdır; dolayısıyla eski ve tamamlanmış bir alt öğe,
yeniden kullanılan tanıtıcıyı belirsiz hâle getirmez. İki etkin veya yakın tarihli alt öğe aynı
`taskName` değerini paylaşıyorsa hedef belirsizdir; bunun yerine liste dizinini, oturum anahtarını
veya çalıştırma kimliğini kullanın.

Ayrılmış `last` ve `all` hedefleri zaten denetim anlamlarına sahip olduğundan
geçerli `taskName` değerleri değildir.

## Araç: `sessions_yield`

Geçerli model sırasını sonlandırır ve başta alt ajan tamamlanma olayları olmak üzere
çalışma zamanı olaylarının sonraki ileti olarak gelmesini bekler. İstekte bulunan,
gerekli alt çalışma tamamlanmadan nihai yanıt üretemiyorsa başlatma sonrasında bunu kullanın.

`sessions_yield` bekleme temel aracıdır. Yalnızca alt öğenin tamamlanmasını algılamak için
bunu `subagents`, `sessions_list`, `sessions_history` üzerinde yoklama döngüleriyle,
kabuk `sleep` komutuyla veya süreç yoklamasıyla değiştirmeyin.

`sessions_yield` yalnızca oturumun etkin araç listesinde yer alıyorsa kullanın.
Bazı asgari veya özel araç profilleri, `sessions_yield` sunmadan `sessions_spawn` ve
`subagents` sunabilir; bu durumda yalnızca tamamlanmayı beklemek için bir yoklama
döngüsü uydurmayın.

Etkin alt öğeler bulunduğunda OpenClaw, istekte bulunanın geçerli alt oturumları,
çalıştırma kimliklerini, durumları, etiketleri, görevleri ve `taskName` takma adlarını
yoklama yapmadan görebilmesi için normal sıralara çalışma zamanı tarafından oluşturulan
kısa bir `Etkin Alt Ajanlar` istem bloğu ekler. Bu bloktaki görev ve etiket alanları,
kullanıcı/model tarafından sağlanan başlatma bağımsız değişkenlerinden gelebileceğinden
talimat olarak değil, veri olarak alıntılanır.

## Araç: `subagents`

İstekte bulunan oturumun sahip olduğu başlatılmış alt ajan çalıştırmalarını listeler.
Kapsamı geçerli istekte bulunanla sınırlıdır; bir alt öğe yalnızca kendi denetimindeki
alt öğeleri görebilir.

İsteğe bağlı durum ve hata ayıklama için `subagents` kullanın. Tamamlanma olaylarını
beklemek için `sessions_yield` kullanın.

## İleti dizisine bağlı oturumlar

Bir kanal için ileti dizisi bağlamaları etkinleştirildiğinde, alt ajan bir ileti dizisine
bağlı kalabilir; böylece bu ileti dizisindeki sonraki kullanıcı iletileri aynı alt ajan
oturumuna yönlendirilmeye devam eder.

### İleti dizisini destekleyen kanallar

Bir kanal, konuşma bağlama bağdaştırıcısı kaydettiğinde kalıcı ileti dizisine bağlı
alt ajan oturumlarını (`thread: true` ile `sessions_spawn`) destekler. Bu desteğe sahip
paketle gelen kanallar: **Discord**, **iMessage**, **Matrix** ve **Telegram**.
Discord ve Matrix varsayılan olarak bir alt ileti dizisi oluşturur; Telegram ve iMessage
ise varsayılan olarak geçerli konuşmayı bağlar. Etkinleştirme, zaman aşımları ve
`spawnSessions` için kanal başına `threadBindings` yapılandırma anahtarlarını kullanın.

### Hızlı akış

<Steps>
  <Step title="Başlat">
    `thread: true` (ve isteğe bağlı olarak `mode: "session"`) ile `sessions_spawn`.
  </Step>
  <Step title="Bağla">
    OpenClaw, etkin kanalda bu oturum hedefine bir ileti dizisi oluşturur veya bağlar.
  </Step>
  <Step title="Sonraki iletileri yönlendir">
    Bu ileti dizisindeki yanıtlar ve sonraki iletiler bağlı oturuma yönlendirilir.
  </Step>
  <Step title="Zaman aşımlarını incele">
    Etkin olmama durumunda otomatik odaktan çıkarmayı incelemek/güncellemek için `/session idle`,
    kesin üst sınırı denetlemek için `/session max-age` kullanın.
  </Step>
  <Step title="Ayır">
    El ile ayırmak için `/unfocus` kullanın.
  </Step>
</Steps>

### El ile denetimler

| Komut              | Etki                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| `/focus <target>`  | Geçerli ileti dizisini bir alt ajan/oturum hedefine bağlar (veya bir ileti dizisi oluşturur)           |
| `/unfocus`         | Geçerli bağlı ileti dizisinin bağlamasını kaldırır                                                     |
| `/agents`          | Etkin çalıştırmaları ve bağlama durumunu (`binding:<id>`, `unbound` veya `bindings unavailable`) listeler |
| `/session idle`    | Boşta kalma durumunda otomatik odaktan çıkarmayı inceler/günceller (yalnızca odaklanmış bağlı ileti dizileri) |
| `/session max-age` | Kesin üst sınırı inceler/günceller (yalnızca odaklanmış bağlı ileti dizileri)                          |

### Yapılandırma anahtarları

- **Genel varsayılan:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanal geçersiz kılması ve başlatmada otomatik bağlama anahtarları** bağdaştırıcıya özeldir. Yukarıdaki [İleti dizisini destekleyen kanallar](#thread-supporting-channels) bölümüne bakın.

Geçerli bağdaştırıcı ayrıntıları için [Yapılandırma başvurusu](/tr/gateway/configuration-reference) ve
[Eğik çizgi komutları](/tr/tools/slash-commands) bölümlerine bakın.

### İzin verilenler listesi

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Açık `agentId` aracılığıyla hedeflenebilecek yapılandırılmış ajan kimliklerinin listesi (`["*"]`, yapılandırılmış herhangi bir hedefe izin verir). Varsayılan: yalnızca istekte bulunan ajan. Bir liste ayarlayıp istekte bulunanın `agentId` ile kendisini başlatabilmesini de istiyorsanız istekte bulunanın kimliğini listeye ekleyin.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  İstekte bulunan ajan kendi `subagents.allowAgents` değerini ayarlamadığında kullanılan varsayılan yapılandırılmış hedef ajan izin listesi.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` belirtmeyen `sessions_spawn` çağrılarını engeller (açık profil seçimini zorunlu kılar). Ajan başına geçersiz kılma: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Gateway `agent` duyuru teslimi denemeleri için çağrı başına zaman aşımı. Değerler pozitif tam sayı milisaniyelerdir ve platform açısından güvenli zamanlayıcı üst sınırına sabitlenir. Geçici yeniden denemeler, toplam duyuru bekleme süresinin yapılandırılmış tek bir zaman aşımından daha uzun olmasına yol açabilir.
</ParamField>

İstekte bulunan oturum korumalı alandaysa `sessions_spawn`, korumalı alan dışında
çalışacak hedefleri reddeder.

### Keşif

`sessions_spawn` için hangi ajan kimliklerine şu anda izin verildiğini görmek üzere
`agents_list` kullanın. Yanıt, çağıranların OpenClaw, Codex uygulama sunucusu ve
yapılandırılmış diğer yerel çalışma zamanlarını ayırt edebilmesi için listelenen her ajanın
etkin modelini ve gömülü çalışma zamanı meta verilerini içerir.

`allowAgents` girdileri, `agents.list[]` içindeki yapılandırılmış ajan kimliklerine işaret etmelidir.
`["*"]`, yapılandırılmış herhangi bir hedef ajanı ve istekte bulunanı ifade eder. Bir ajan
yapılandırması silinir ancak kimliği `allowAgents` içinde kalırsa `sessions_spawn` bu kimliği
reddeder ve `agents_list` onu atlar. Eski izin listesi girdilerini temizlemek için
`openclaw doctor --fix` komutunu çalıştırın veya hedefin varsayılanları devralırken
başlatılabilir kalması gerekiyorsa asgari bir `agents.list[]` girdisi ekleyin.

### Otomatik arşivleme

- Alt ajan oturumları, `agents.defaults.subagents.archiveAfterMinutes` sonrasında otomatik olarak arşivlenir (varsayılan `60`).
- Arşivleme `sessions.delete` kullanır ve dökümü `*.deleted.<timestamp>` olarak yeniden adlandırır (aynı klasörde).
- `cleanup: "delete"`, duyurudan hemen sonra arşivler (yeniden adlandırma yoluyla dökümü yine saklar).
- Otomatik arşivleme en iyi çaba esasına dayanır; Gateway yeniden başlatılırsa bekleyen zamanlayıcılar kaybolur.
- Yapılandırılmış çalıştırma zaman aşımları otomatik arşivleme **yapmaz**; yalnızca çalıştırmayı durdurur. Oturum, otomatik arşivlemeye kadar kalır.
- Otomatik arşivleme, derinlik-1 ve derinlik-2 oturumlarına eşit şekilde uygulanır.
- Tarayıcı temizliği, arşiv temizliğinden ayrıdır: döküm/oturum kaydı saklansa bile izlenen tarayıcı sekmeleri/süreçleri çalıştırma tamamlandığında en iyi çaba esasına göre kapatılır.

## İç içe alt ajanlar

Varsayılan olarak alt ajanlar kendi alt ajanlarını başlatamaz
(`maxSpawnDepth: 1`). Tek bir iç içe geçme düzeyini etkinleştirmek için
`maxSpawnDepth: 2` ayarlayın — **düzenleyici kalıbı**: ana → düzenleyici alt ajan →
çalışan alt-alt ajanlar.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // alt ajanların alt öğeler başlatmasına izin ver (varsayılan: 1, aralık 1-5)
        maxChildrenPerAgent: 5, // ajan oturumu başına en fazla etkin alt öğe (varsayılan: 5, aralık 1-20)
        maxConcurrent: 8, // genel eşzamanlılık hattı üst sınırı (varsayılan: 8)
        runTimeoutSeconds: 900, // sessions_spawn için varsayılan zaman aşımı (0 = zaman aşımı yok)
        announceTimeoutMs: 120000, // çağrı başına Gateway duyuru zaman aşımı
      },
    },
  },
}
```

### Derinlik düzeyleri

| Derinlik | Oturum anahtarı biçimi                       | Rol                                                   | Alt ajan başlatabilir mi?       |
| -------- | -------------------------------------------- | ----------------------------------------------------- | ------------------------------- |
| 0        | `agent:<id>:main`                            | Ana ajan                                              | Her zaman                       |
| 1        | `agent:<id>:subagent:<uuid>`                 | Alt ajan (derinlik 2'ye izin verildiğinde orkestratör) | Yalnızca `maxSpawnDepth >= 2` ise |
| 2        | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Alt-alt ajan (uç çalışan)                             | Asla                            |

### Duyuru zinciri

Sonuçlar zincirde yukarı doğru akar:

1. Derinlik-2 çalışanı tamamlanır → üst öğesine (derinlik-1 orkestratörü) duyuru gönderir.
2. Derinlik-1 orkestratörü duyuruyu alır, sonuçları sentezler, tamamlanır → ana ajana duyuru gönderir.
3. Ana ajan duyuruyu alır ve kullanıcıya iletir.

Her seviye yalnızca doğrudan alt öğelerinden gelen duyuruları görür.

<Note>
**Operasyonel kılavuz:** `sessions_list`, `sessions_history`, `/subagents list` veya `exec` uyku komutlarının etrafında yoklama döngüleri oluşturmak yerine alt öğe çalışmasını bir kez başlatın ve tamamlanma olaylarını bekleyin. `sessions_list` ve `/subagents list`, alt oturum ilişkilerini etkin çalışmaya odaklı tutar — etkin alt öğeler bağlı kalır, sona eren alt öğeler kısa bir yakın geçmiş penceresi boyunca görünür kalır ve yalnızca depoda bulunan eski alt öğe bağlantıları güncellik pencerelerinden sonra yok sayılır. Bu, eski `spawnedBy` / `parentSessionKey` meta verilerinin yeniden başlatmadan sonra hayalet alt öğeleri yeniden ortaya çıkarmasını önler. Son yanıtı zaten gönderdikten sonra bir alt öğe tamamlanma olayı gelirse doğru takip yanıtı tam olarak sessiz belirteç olan `NO_REPLY` / `no_reply` olmalıdır.
</Note>

### Derinliğe göre araç ilkesi

- Rol ve denetim kapsamı, başlatma sırasında oturum meta verilerine yazılır. Bu, düz veya geri yüklenmiş oturum anahtarlarının yanlışlıkla orkestratör ayrıcalıklarını yeniden kazanmasını önler.
- **Derinlik 1 (orkestratör, `maxSpawnDepth >= 2` olduğunda):** alt öğeleri başlatabilmesi ve durumlarını inceleyebilmesi için `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` araçlarını alır. Diğer oturum/sistem araçları reddedilmeye devam eder.
- **Derinlik 1 (uç, `maxSpawnDepth == 1` olduğunda):** oturum aracı yoktur (mevcut varsayılan davranış).
- **Derinlik 2 (uç çalışan):** oturum aracı yoktur — `sessions_spawn`, derinlik 2'de her zaman reddedilir. Başka alt öğeler başlatamaz.

### Ajan başına başlatma sınırı

Her ajan oturumu (herhangi bir derinlikte), aynı anda en fazla `maxChildrenPerAgent` (varsayılan `5`) etkin alt öğeye sahip olabilir. Bu, tek bir orkestratörden denetimsiz dallanmayı önler.

### Zincirleme durdurma

Bir derinlik-1 orkestratörünü durdurmak, tüm derinlik-2 alt öğelerini otomatik olarak durdurur:

- Ana sohbetteki `/stop`, tüm derinlik-1 ajanlarını durdurur ve durdurma işlemini onların derinlik-2 alt öğelerine zincirleme olarak uygular.

## Kimlik doğrulama

Alt ajan kimlik doğrulaması, oturum türüne göre değil **ajan kimliğine** göre çözümlenir:

- Alt ajan oturum anahtarı `agent:<agentId>:subagent:<uuid>` biçimindedir.
- Kimlik doğrulama deposu, ilgili ajanın `agentDir` dizininden yüklenir.
- Ana ajanın kimlik doğrulama profilleri **geri dönüş seçeneği** olarak birleştirilir; çakışmalarda ajan profilleri ana profilleri geçersiz kılar.

Birleştirme eklemelidir; dolayısıyla ana profiller geri dönüş seçenekleri olarak her zaman kullanılabilir. Ajan başına tamamen yalıtılmış kimlik doğrulama henüz desteklenmemektedir.

## Duyuru

Alt ajanlar bir duyuru adımı aracılığıyla geri bildirimde bulunur:

- Duyuru adımı, istekte bulunan oturumda değil alt ajan oturumunda çalışır.
- Alt ajan tam olarak `ANNOUNCE_SKIP` yanıtını verirse hiçbir şey gönderilmez.
- En son asistan metni tam olarak sessiz belirteç olan `NO_REPLY` / `no_reply` ise daha önce görünür ilerleme bulunsa bile duyuru çıktısı engellenir.

Teslimat, istekte bulunanın derinliğine bağlıdır:

- Üst düzey istekte bulunan oturumlar, dış teslimat (`deliver=true`) içeren bir takip `agent` çağrısı kullanır.
- İç içe istekte bulunan alt ajan oturumları, orkestratörün alt öğe sonuçlarını oturum içinde sentezleyebilmesi için dahili bir takip eklemesi (`deliver=false`) alır.
- İç içe istekte bulunan alt ajan oturumu artık mevcut değilse OpenClaw, kullanılabilir olduğunda bu oturumun istekte bulunanına geri döner.

Üst düzey istekte bulunan oturumlarda tamamlanma modu doğrudan teslimatı, önce bağlı konuşma/ileti dizisi yolunu ve kanca geçersiz kılmasını çözümler, ardından eksik kanal-hedef alanlarını istekte bulunan oturumun kayıtlı yolundan doldurur. Bu, tamamlanma kaynağı yalnızca kanalı tanımlasa bile tamamlanmaların doğru sohbet/konuda kalmasını sağlar.

İç içe tamamlanma bulguları oluşturulurken alt öğe tamamlanma toplaması mevcut istekte bulunan çalışmasıyla sınırlandırılır; böylece önceki çalışmalardan kalan eski alt öğe çıktılarının mevcut duyuruya sızması önlenir. Duyuru yanıtları, kanal bağdaştırıcılarında kullanılabilir olduğunda ileti dizisi/konu yönlendirmesini korur.

### Duyuru bağlamı

Duyuru bağlamı, kararlı bir dahili olay bloğuna normalleştirilir:

| Alan           | Kaynak                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Kaynak         | `subagent` veya `cron`                                                                                                    |
| Oturum kimlikleri | Alt öğe oturum anahtarı/kimliği                                                                                        |
| Tür            | Duyuru türü + görev etiketi                                                                                               |
| Durum          | Çalışma zamanı sonucundan türetilir (`ok`, `error`, `timeout` veya `unknown`) — model metninden **çıkarılmaz**             |
| Sonuç içeriği  | Alt öğenin en son görünür asistan metni                                                                                   |
| Takip          | Ne zaman yanıt verileceğini, ne zaman sessiz kalınacağını açıklayan talimat                                               |

Başarısız olan sonlandırılmış çalışmalar, yakalanan yanıt metnini yeniden oynatmadan başarısızlık durumunu bildirir. Araç/araç sonucu çıktısı alt öğe sonuç metnine yükseltilmez.

### İstatistik satırı

Duyuru yükleri, sarmalanmış olsa bile sonunda bir istatistik satırı içerir:

- Çalışma süresi (ör. `runtime 5m12s`).
- Belirteç kullanımı (girdi/çıktı/toplam).
- Model fiyatlandırması yapılandırıldığında tahmini maliyet (`models.providers.*.models[].cost`).
- Ana ajanın `sessions_history` aracılığıyla geçmişi alabilmesi veya diskteki dosyayı inceleyebilmesi için `sessionKey`, `sessionId` ve döküm yolu.

Dahili meta veriler yalnızca orkestrasyon içindir; kullanıcıya yönelik yanıtlar normal asistan üslubuyla yeniden yazılmalıdır.

### Neden `sessions_history` tercih edilmeli?

`sessions_history`, bir ajan dönüşü içinden alt öğenin dökümünü okumak için daha güvenli orkestrasyon yoludur:

- Genel amaçlı günlük sansürleme devre dışı olsa bile kimlik bilgisi/belirteç benzeri metinleri sansürler.
- Uzun metin bloklarını kısaltır (blok başına 4000 karakter) ve düşünme imzalarını, akıl yürütme yeniden oynatma yüklerini ve satır içi görüntü verilerini çıkarır.
- 80 KB yanıt sınırı uygular; aşırı büyük satırlar `[sessions_history omitted: message too large]` ile değiştirilir.
- Eski döküm pencerelerinde geriye doğru sayfalama yapmak için mevcut olduğunda `nextOffset` kullanın.
- `sessions_history`, akıl yürütme etiketlerini, `<relevant-memories>` iskeletini veya araç çağrısı XML'ini ileti metninden **çıkarmaz** — yalnızca sansürlenmiş ve boyutu sınırlandırılmış şekilde, ham döküm biçimine yakın yapılandırılmış içerik blokları döndürür. `/subagents log`, yapılandırılmış bloklar yerine düz sohbet satırları oluşturduğu için daha kapsamlı düzyazı temizleyicisini uygular (akıl yürütme etiketlerini, bellek iskeletini ve araç çağrısı XML'ini çıkarır).
- Tam, bayt bayt döküme ihtiyaç duyduğunuzda diskteki ham dökümü incelemek geri dönüş seçeneğidir.

## Araç ilkesi

Alt ajanlar önce üst veya hedef ajanla aynı profil ve araç ilkesi işlem hattını kullanır. Ardından OpenClaw, alt ajan kısıtlama katmanını uygular.

Alt ajanlar, derinlik veya rolden bağımsız olarak (sistem düzeyindeki/etkileşimli araçlar ya da ana ajanın koordine etmesi gereken araçlar olan) `gateway`, `agents_list`, `session_status` ve `cron` araçlarını her zaman kaybeder. Uç alt ajanlar (varsayılan derinlik-1 davranışı ve her zaman derinlik 2) ayrıca `subagents`, `sessions_list`, `sessions_history` ve `sessions_spawn` araçlarını kaybeder. Alt ajanlar hiçbir zaman `message` aracını almaz — bu araç bu ret listesiyle filtrelenmek yerine başlatma sırasında devre dışı bırakılır — ve alt ajanların yalnızca duyuru zinciri üzerinden iletişim kurması için `sessions_send` reddedilmeye devam eder.

`sessions_history` burada da sınırlandırılmış, temizlenmiş bir hatırlama görünümü olarak kalır — ham döküm çıktısı değildir.

`maxSpawnDepth >= 2` olduğunda derinlik-1 orkestratör alt ajanları, alt öğelerini yönetebilmeleri için ek olarak `sessions_spawn`, `subagents`, `sessions_list` ve `sessions_history` araçlarını alır.

### Yapılandırma aracılığıyla geçersiz kılma

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

`tools.subagents.tools.allow`, son bir yalnızca izin verilenler filtresidir. Önceden çözümlenmiş araç kümesini daraltabilir ancak `tools.profile` tarafından kaldırılan bir aracı **geri ekleyemez**. Örneğin `tools.profile: "coding"`, `web_search`/`web_fetch` araçlarını içerir ancak `browser` aracını içermez. Kodlama profiline sahip alt ajanların tarayıcı otomasyonunu kullanmasına izin vermek için tarayıcıyı profil aşamasında ekleyin:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Yalnızca bir ajanın tarayıcı otomasyonunu alması gerektiğinde ajan başına `agents.list[].tools.alsoAllow: ["browser"]` kullanın.

## Eşzamanlılık

Alt ajanlar, süreç içinde ayrılmış bir kuyruk hattı kullanır:

- **Hat adı:** `subagent`
- **Eşzamanlılık:** `agents.defaults.subagents.maxConcurrent` (varsayılan `8`)

## Canlılık ve kurtarma

OpenClaw, `endedAt` bulunmamasını bir alt ajanın hâlâ çalıştığının kalıcı kanıtı olarak kabul etmez. Eski çalışma penceresinden (2 saat veya yapılandırılan çalışma zaman aşımı artı kısa bir ek süre; hangisi daha uzunsa) daha eski tamamlanmamış çalışmalar; `/subagents list`, durum özetleri, alt soy tamamlanma geçitlemesi ve oturum başına eşzamanlılık denetimlerinde etkin/beklemede olarak sayılmayı bırakır.

Bir Gateway yeniden başlatmasından sonra eski, tamamlanmamış ve geri yüklenmiş çalışmalar, alt öğe oturumları `abortedLastRun: true` olarak işaretlenmemişse budanır. Yeniden başlatmayla iptal edilmiş çalışmalar, alt ajan yetim kurtarma akışı için kayıtlı kalır: eski çalışmalar devam ettirilmeden sonlandırılırken yeni alt öğe oturumları, iptal işareti temizlenmeden önce sentetik bir devam ettirme iletisi alır.

Otomatik yeniden başlatma kurtarması, alt öğe oturumu başına sınırlandırılmıştır. Aynı alt ajan alt öğesi, hızlı yeniden takılma penceresi içinde yetim kurtarma için tekrar tekrar kabul edilirse OpenClaw bu oturumda kalıcı bir kurtarma mezar taşı oluşturur ve sonraki yeniden başlatmalarda otomatik olarak devam ettirmeyi durdurur. Görev kaydını uzlaştırmak için `openclaw tasks maintenance --apply` veya mezar taşı oluşturulmuş oturumlardaki eski iptal edilmiş kurtarma işaretlerini temizlemek için `openclaw doctor --fix` çalıştırın.

<Note>
Bir alt ajan başlatma işlemi Gateway `PAIRING_REQUIRED` / `scope-upgrade` hatasıyla başarısız olursa eşleştirme durumunu düzenlemeden önce RPC çağırıcısını denetleyin. Dahili `sessions_spawn` koordinasyonu, çağırıcı zaten Gateway istek bağlamında çalışıyorsa süreç içinde dağıtılır; dolayısıyla bir local loopback WebSocket açmaz veya CLI'ın eşleştirilmiş cihaz kapsamı temel düzeyine bağlı değildir. Gateway sürecinin dışındaki çağırıcılar, doğrudan local loopback paylaşılan belirteç/parola kimlik doğrulaması üzerinden `client.id: "gateway-client"` ve `client.mode: "backend"` ile WebSocket geri dönüşünü kullanmaya devam eder. Uzak çağırıcılar, açık `deviceIdentity`, açık cihaz belirteci yolları ve tarayıcı/Node istemcileri, kapsam yükseltmeleri için yine normal cihaz onayına ihtiyaç duyar.
</Note>

## Durdurma

- İstekte bulunan sohbette `/stop` göndermek, istekte bulunan oturumu iptal eder ve bu oturumdan başlatılan tüm etkin alt ajan çalışmalarını durdurarak işlemi iç içe alt öğelere zincirleme uygular.

## Sınırlamalar

- Alt ajan duyurusu **en iyi çaba esasına** dayanır. Gateway yeniden başlatılırsa bekleyen "geri duyurma" işi kaybolur.
- Alt ajanlar aynı Gateway işlem kaynaklarını paylaşmaya devam eder; `maxConcurrent` değerini bir güvenlik supabı olarak değerlendirin.
- `sessions_spawn` her zaman engellemesizdir: hemen `{ status: "accepted", runId, childSessionKey }` döndürür.
- Alt ajan bağlamına yalnızca `AGENTS.md` ve `TOOLS.md` eklenir (`SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` veya `BOOTSTRAP.md` eklenmez). Codex'e özgü alt ajanlar da aynı sınıra uyar: `TOOLS.md`, devralınan Codex iş parçacığı talimatlarında kalırken yalnızca üst ajana ait kişilik, kimlik ve kullanıcı dosyaları, alt ajanların bunları kopyalamaması için dönüş kapsamlı iş birliği talimatları olarak eklenir.
- En fazla iç içe geçme derinliği 5'tir (`maxSpawnDepth` aralığı: 1-5). Çoğu kullanım durumu için 2 derinliği önerilir.
- `maxChildrenPerAgent`, oturum başına etkin alt ajan sayısını sınırlar (varsayılan `5`, aralık `1-20`).

## İlgili

- [Oturum araçları ve durum değişiklikleri](/tr/concepts/session-tool)
- [ACP ajanları](/tr/tools/acp-agents)
- [Ajan gönderimi](/tr/tools/agent-send)
- [Arka plan görevleri](/tr/automation/tasks)
- [Çok ajanlı korumalı alan araçları](/tr/tools/multi-agent-sandbox-tools)
