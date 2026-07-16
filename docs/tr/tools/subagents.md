---
read_when:
    - Agent aracılığıyla arka planda veya paralel çalışma yapmak istiyorsunuz
    - sessions_spawn veya alt ajan araç politikasını değiştiriyorsunuz
    - İş parçacığına bağlı alt ajan oturumlarını uyguluyor veya sorunlarını gideriyorsunuz
sidebarTitle: Sub-agents
summary: Sonuçları istekte bulunan sohbete bildiren yalıtılmış arka plan agent çalıştırmaları başlatın
title: Alt ajanlar
x-i18n:
    generated_at: "2026-07-16T17:53:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8c670d5c7f92d5be8ebce7b1140d9bfd7956b10f38144d275ec84c6af98ae04b
    source_path: tools/subagents.md
    workflow: 16
---

Alt ajanlar, mevcut bir ajan çalıştırmasından başlatılan arka plan ajan çalıştırmalarıdır.
Her biri kendi oturumunda (`agent:<agentId>:subagent:<uuid>`) çalışır ve
tamamlandığında sonucunu istekte bulunan sohbet kanalına **duyurur**.
Her alt ajan çalıştırması bir [arka plan görevi](/tr/automation/tasks) olarak izlenir.

Hedefler:

- Araştırmaları, uzun görevleri ve yavaş araç çalışmalarını ana çalıştırmayı engellemeden paralelleştirmek.
- Alt ajanları varsayılan olarak yalıtılmış tutmak (oturum ayrımı, isteğe bağlı korumalı alan).
- Araç yüzeyinin hatalı kullanımını zorlaştırmak: alt ajanlar varsayılan olarak oturum veya mesaj araçlarına sahip **değildir**.
- Orkestratör kalıpları için yapılandırılabilir iç içe geçme derinliğini desteklemek.

<Note>
**Maliyet notu:** Varsayılan olarak her alt ajanın kendi bağlamı ve token kullanımı
vardır. Ağır veya tekrarlanan görevlerde alt ajanlar için daha ucuz bir model
ayarlayın ve ana ajanınızı `agents.defaults.subagents.model` veya ajan başına geçersiz kılmalar
aracılığıyla daha yüksek kaliteli bir modelde tutun. Bir alt öğe
istekte bulunanın mevcut transkriptine gerçekten ihtiyaç duyduğunda, onu
`context: "fork"` ile başlatın. İş parçacığına bağlı alt ajan oturumları,
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

`/subagents info`, çalıştırma meta verilerini (durum, zaman damgaları, oturum kimliği,
transkript yolu, temizlik) gösterir. `/subagents log`, bir çalıştırmanın son sohbet
turlarını yazdırır; araç çağrısı/sonuç mesajlarını dahil etmek için
`tools` token'ını ekleyin (varsayılan olarak dahil edilmez).
Bir ajan turu içinden sınırlandırılmış, güvenlik filtresinden geçirilmiş bir geri çağırma
görünümü için `sessions_history` kullanın veya ham tam transkript için diskteki
transkript yolunu inceleyin.

Control UI'da, yakın zamanda alt çalıştırmaları olan üst oturumların genişletilebilir
bir kenar çubuğu satırı vardır. İç içe satırlar alt öğenin durumunu ve çalışma süresini
gösterir; bunlardan biri seçildiğinde üst öğe hiyerarşisi korunarak ilgili alt öğenin
sohbeti açılır.

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
Tamamlanmalar, dahili üst oturum olayları olarak döner; kullanıcıya yönelik
bir güncellemenin gerekip gerekmediğine üst/istekte bulunan ajan karar verir.

<AccordionGroup>
  <Accordion title="Engellemeyen, gönderim tabanlı tamamlanma">
    - `sessions_spawn` engelleyici değildir; hemen bir çalıştırma kimliği döndürür.
    - Tamamlandığında alt ajan, üst/istekte bulunan oturuma geri bildirimde bulunur.
    - Alt öğe sonuçlarına ihtiyaç duyan ajan turları, gerekli işi başlattıktan sonra `sessions_yield` çağrısı yapmalıdır. Bu işlem geçerli turu sonlandırır ve tamamlanma olayının modelin görebileceği bir sonraki mesaj olarak gelmesini sağlar.
    - Tamamlanma gönderim tabanlıdır. Başlatıldıktan sonra yalnızca bitmesini beklemek için `/subagents list`, `sessions_list` veya `sessions_history` çağrılarını bir döngüde **yoklamayın**; durumu yalnızca hata ayıklarken gerektiğinde kontrol edin.
    - Alt öğe çıktısı, istekte bulunan ajanın sentezlemesi için bir rapor/kanıttır. Kullanıcı tarafından yazılmış talimat metni değildir ve sistem, geliştirici veya kullanıcı politikasını geçersiz kılamaz.
    - Tamamlanma sırasında OpenClaw, duyuru temizleme akışı devam etmeden önce söz konusu alt ajan oturumunun açtığı izlenen tarayıcı sekmelerini/süreçlerini makul çaba temelinde kapatır.

  </Accordion>
  <Accordion title="Tamamlanma teslimi">
    - OpenClaw, tamamlanmaları kararlı bir eşsizlik anahtarına sahip `agent` turu aracılığıyla istekte bulunan oturuma geri iletir.
    - İstekte bulunan çalıştırma hâlâ etkinse OpenClaw, ikinci bir görünür yanıt yolu başlatmak yerine önce bu çalıştırmayı uyandırmayı/yönlendirmeyi dener.
    - Etkin istekte bulunan uyandırılamazsa OpenClaw, duyuruyu düşürmek yerine aynı tamamlanma bağlamıyla istekte bulunan ajana devretmeye geri döner.
    - Başarılı bir üst öğeye devir, üst öğe görünür bir kullanıcı güncellemesine gerek olmadığına karar verse bile alt ajan teslimini tamamlar.
    - Yerel alt ajanlar mesaj aracına sahip değildir. Üst/istekte bulunan ajana düz asistan metni döndürürler; insanların görebildiği yanıtların sahipliği, üst/istekte bulunan ajanın normal teslim politikasında kalır.
    - Doğrudan devir kullanılamazsa teslim, kuyruk yönlendirmesine; ardından nihai olarak vazgeçilmeden önce duyurunun kısa bir üstel geri çekilme yeniden denemesine geri döner.
    - Teslim, çözümlenmiş istekte bulunan rotasını korur: kullanılabilir olduğunda iş parçacığına veya konuşmaya bağlı tamamlanma rotaları önceliklidir. Tamamlanma kaynağı yalnızca bir kanal sağlıyorsa OpenClaw, eksik hedefi/hesabı istekte bulunan oturumun çözümlenmiş rotasından (`lastChannel` / `lastTo` / `lastAccountId`) doldurur; böylece doğrudan teslim çalışmaya devam eder.

  </Accordion>
  <Accordion title="Tamamlanma devir meta verileri">
    İstekte bulunan oturuma tamamlanma devri, çalışma zamanı tarafından oluşturulan
    dahili bağlamdır (kullanıcı tarafından yazılmış metin değildir) ve şunları içerir:

    - `Result` — alt öğenin en son görünür `assistant` yanıt metni. Araç/toolResult çıktısı alt öğe sonuçlarına yükseltilmez. Son durumdaki başarısız çalıştırmalar, yakalanmış yanıt metnini yeniden kullanmaz.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Kompakt çalışma zamanı/token istatistikleri.
    - İstekte bulunan ajana, özgün görevin tamamlanıp tamamlanmadığına karar vermeden önce sonucu doğrulamasını söyleyen bir inceleme talimatı.
    - Alt öğe sonucu daha fazla işlem gerektirdiğinde istekte bulunan ajana görevi sürdürmesini veya bir takip kaydı oluşturmasını söyleyen takip yönlendirmesi.
    - Başka işlem gerekmeyen yol için, ham dahili meta verileri iletmeden normal asistan diliyle yazılmış bir nihai güncelleme talimatı.

  </Accordion>
  <Accordion title="Modlar ve ACP çalışma zamanı">
    - `--model` ve `--thinking`, söz konusu çalıştırma için varsayılanları geçersiz kılar.
    - Tamamlanmadan sonra ayrıntıları ve çıktıyı incelemek için `info`/`log` kullanın.
    - Kalıcı iş parçacığına bağlı oturumlar için `thread: true` ve `mode: "session"` ile `sessions_spawn` kullanın.
    - İstekte bulunan kanal iş parçacığı bağlamalarını desteklemiyorsa olanaksız bir iş parçacığına bağlı birleşimi yeniden denemek yerine `mode: "run"` kullanın.
    - ACP koşum oturumları (Claude Code, Gemini CLI, OpenCode veya açık Codex ACP/acpx) için araç bu çalışma zamanını sunduğunda `runtime: "acp"` ile `sessions_spawn` kullanın. Tamamlanmaları veya ajanlar arası döngüleri hata ayıklarken [ACP teslim modeline](/tr/tools/acp-agents#delivery-model) bakın. `codex` Plugin'i etkinleştirildiğinde, kullanıcı açıkça ACP/acpx istemediği sürece Codex sohbet/iş parçacığı denetimi ACP yerine `/codex ...` tercih etmelidir.
    - OpenClaw; ACP etkinleştirilene, istekte bulunan korumalı alanda olmayana ve `acpx` gibi bir arka uç Plugin'i yüklenene kadar `runtime: "acp"` öğesini gizler. `runtime: "acp"`, harici bir ACP koşum kimliği veya `runtime.type="acp"` içeren bir `agents.list[]` girdisi bekler; `agents_list` içindeki normal OpenClaw yapılandırma ajanları için varsayılan alt ajan çalışma zamanını kullanın.

  </Accordion>
</AccordionGroup>

## Bağlam modları

Çağıran açıkça geçerli transkripti çatallamayı istemediği sürece yerel alt ajanlar
yalıtılmış olarak başlar.

| Mod       | Ne zaman kullanılmalı                                                                                                                         | Davranış                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Yeni araştırma, bağımsız uygulama, yavaş araç çalışması veya görev metninde açıklanabilecek herhangi bir iş                           | Temiz bir alt öğe transkripti oluşturur. Bu varsayılandır ve token kullanımını daha düşük tutar.  |
| `fork`     | Geçerli konuşmaya, önceki araç sonuçlarına veya istekte bulunanın transkriptinde zaten bulunan incelikli talimatlara bağlı işler | Alt öğe başlamadan önce istekte bulunanın transkriptini alt öğe oturumuna dallandırır. |

`fork` öğesini ölçülü kullanın. Bağlama duyarlı yetkilendirme içindir;
net bir görev istemi yazmanın yerine geçmez.

## Araç: `sessions_spawn`

Global `subagent` hattında `deliver: false` ile bir alt ajan çalıştırması
başlatır, ardından bir duyuru adımı çalıştırır ve duyuru yanıtını istekte bulunan
sohbet kanalına gönderir.

Kullanılabilirlik, çağıranın etkin araç politikasına bağlıdır. Yerleşik
`coding` profili `sessions_spawn` içerir; `messaging` ve `minimal`
içermez. `full` her araca izin verir. Daha dar bir profilde olup yine de iş
devretmesi gereken ajanlar için `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]` ekleyin veya `tools.profile: "coding"` kullanın.
Kanal/grup, sağlayıcı, korumalı alan ve ajan başına izin/verme politikaları,
profil aşamasından sonra da aracı kaldırabilir. Etkin araç listesini doğrulamak için
aynı oturumdan `/tools` kullanın.

**Varsayılanlar:**

- **Model:** `agents.defaults.subagents.model` (veya ajan başına `agents.list[].subagents.model`) ayarlamadığınız sürece yerel alt ajanlar çağıranın modelini devralır. ACP çalışma zamanı başlatmaları, yapılandırılmış alt ajan modeli varsa aynı modeli kullanır; aksi hâlde ACP koşumu kendi varsayılanını korur. Açık bir `sessions_spawn.model` yine önceliklidir.
- **Düşünme:** `agents.defaults.subagents.thinking` (veya ajan başına `agents.list[].subagents.thinking`) ayarlamadığınız sürece yerel alt ajanlar çağıranın ayarını devralır. ACP çalışma zamanı başlatmaları da seçilen model için `agents.defaults.models["provider/model"].params.thinking` uygular. Açık bir `sessions_spawn.thinking` yine önceliklidir.
- **Çalıştırma zaman aşımı:** OpenClaw, ayarlanmışsa `agents.defaults.subagents.runTimeoutSeconds` kullanır; aksi hâlde `0` değerine geri döner (zaman aşımı yoktur). `sessions_spawn`, çağrı başına zaman aşımı geçersiz kılmalarını kabul etmez.
- **Görev teslimi:** yerel alt ajanlar, devredilen görevi ilk görünür `[Subagent Task]` mesajlarında alır. Alt ajan sistem istemi, görevin gizli bir kopyasını değil, çalışma zamanı kurallarını ve yönlendirme bağlamını taşır.

Kabul edilen yerel alt ajan başlatmaları, araç sonucunda çözümlenmiş alt öğe modelinin
meta verilerini içerir: `resolvedModel` uygulanan model başvurusunu,
`resolvedProvider` ise başvuruda varsa sağlayıcı önekini içerir.

### Yetkilendirme istemi modu

`agents.defaults.subagents.delegationMode` yalnızca istem yönlendirmesini denetler; araç politikasını değiştirmez veya yetkilendirmeyi zorunlu kılmaz.

- `suggest` (varsayılan): daha büyük veya yavaş işler için alt ajan kullanmaya yönelik standart istem yönlendirmesini korur.
- `prefer`: ana ajana yanıt vermeye devam etmesini ve doğrudan yanıttan daha kapsamlı her işi `sessions_spawn` aracılığıyla devretmesini söyler.

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
  Alt aracının görev açıklaması.
</ParamField>
<ParamField path="taskName" type="string">
  Daha sonraki durum çıktısında belirli bir alt öğeyi tanımlamak için isteğe bağlı kararlı tanıtıcı. `[a-z][a-z0-9_-]{0,63}` ile eşleşmelidir ve `last` veya `all` gibi ayrılmış bir hedef olamaz.
</ParamField>
<ParamField path="label" type="string">
  İsteğe bağlı, insanların okuyabileceği etiket.
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents` tarafından izin verildiğinde yapılandırılmış başka bir aracı kimliği altında oluşturur.
</ParamField>
<ParamField path="cwd" type="string">
  Alt çalıştırma için isteğe bağlı görev çalışma dizini. Yerel alt aracılar önyükleme dosyalarını yine hedef aracının çalışma alanından yükler; `cwd` yalnızca çalışma zamanı araçlarının ve CLI düzeneklerinin devredilen işi nerede yaptığını değiştirir.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` yalnızca harici ACP düzenekleri (`claude`, `droid`, `gemini`, `opencode` veya açıkça istenen Codex ACP/acpx) ve `runtime.type` değeri `acp` olan `agents.list[]` girdileri içindir.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Yalnızca ACP. `runtime: "acp"` olduğunda mevcut bir ACP düzeneği oturumunu sürdürür; yerel alt aracı oluşturma işlemlerinde yok sayılır.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Yalnızca ACP. `runtime: "acp"` olduğunda ACP çalıştırma çıktısını üst oturuma aktarır; yerel alt aracı oluşturma işlemlerinde kullanılmaz.
</ParamField>
<ParamField path="model" type="string">
  Alt aracı modelini geçersiz kılar. Geçersiz değerler atlanır ve alt aracı, araç sonucunda bir uyarıyla varsayılan modelde çalışır.
</ParamField>
<ParamField path="thinking" type="string">
  Alt aracı çalıştırması için düşünme düzeyini geçersiz kılar.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` olduğunda bu alt aracı oturumu için kanal ileti dizisi bağlaması ister.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` olduğunda ve `mode` belirtilmediğinde varsayılan değer `session` olur. `mode: "session"`, `thread: true` gerektirir.
  İstekte bulunan kanal için ileti dizisi bağlaması kullanılamıyorsa bunun yerine `mode: "run"` kullanın.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"`, duyurudan hemen sonra oturumu arşivler (dökümü yeniden adlandırarak saklamaya devam eder).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require`, hedef alt çalışma zamanı korumalı alanda değilse oluşturma işlemini reddeder.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork`, istekte bulunanın mevcut dökümünü alt oturuma dallandırır. Yalnızca yerel alt aracılar. İletişim dizisine bağlı oluşturma işlemlerinin varsayılanı `fork`; iletişim dizisine bağlı olmayan oluşturma işlemlerinin varsayılanı `isolated` değeridir.
</ParamField>

<Warning>
`sessions_spawn`, kanal teslim parametrelerini (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`) **kabul etmez**. Yerel alt aracılar en son
asistan dönüşlerini istekte bulunana bildirir; harici teslim üst/istekte bulunan
aracıda kalır.
</Warning>

### Görev adları ve hedefleme

`taskName`, oturum anahtarı değil, orkestrasyon için modele yönelik bir tanıtıcıdır.
Bir koordinatörün daha sonra ilgili alt öğeyi incelemesi gerekebilecek durumlarda `review_subagents`,
`linux_validation` veya `docs_update` gibi kararlı alt öğe adları için kullanın.

Hedef çözümleme, tam `taskName` eşleşmelerini ve belirsiz olmayan
önekleri kabul eder. Eşleştirme, numaralı `/subagents` hedeflerinin kullandığı
aynı etkin/yakın tarihli hedef penceresiyle sınırlıdır; dolayısıyla eski, tamamlanmış
bir alt öğe, yeniden kullanılan bir tanıtıcıyı belirsiz hâle getirmez. İki etkin veya yakın tarihli alt öğe
aynı `taskName` değerini paylaşıyorsa hedef belirsizdir; bunun yerine liste
dizinini, oturum anahtarını veya çalıştırma kimliğini kullanın.

Ayrılmış `last` ve `all` hedefleri, zaten denetim
anlamları taşıdıklarından geçerli `taskName` değerleri değildir.

## Araç: `sessions_yield`

Geçerli model dönüşünü sonlandırır ve başta alt aracı tamamlanma olayları
olmak üzere çalışma zamanı olaylarının bir sonraki ileti olarak gelmesini bekler. İstekte bulunan,
bu tamamlanma olayları gelmeden nihai yanıt üretemiyorsa gerekli alt çalışma
oluşturulduktan sonra bunu kullanın.

`sessions_yield`, bekleme temel işlemidir. Yalnızca alt öğenin tamamlandığını
algılamak için bunu `subagents`, `sessions_list`, `sessions_history`, kabuk
`sleep` veya süreç yoklaması üzerindeki yoklama döngüleriyle değiştirmeyin.

`sessions_yield` aracını yalnızca oturumun etkin araç listesinde
bulunduğunda kullanın. Bazı asgari veya özel araç profilleri `sessions_spawn` ve
`subagents` araçlarını sunarken `sessions_yield` aracını sunmayabilir; bu durumda,
yalnızca tamamlanmayı beklemek için bir yoklama döngüsü uydurmayın.

Etkin alt öğeler bulunduğunda OpenClaw, istekte bulunanın mevcut alt
oturumları, çalıştırma kimliklerini, durumları, etiketleri, görevleri ve
`taskName` diğer adlarını yoklama yapmadan görebilmesi için normal dönüşlere çalışma zamanında
oluşturulan kompakt bir `Active Subagents` istem bloğu ekler. Bu bloktaki görev ve etiket
alanları talimat olarak değil, veri olarak tırnak içine alınır; çünkü kullanıcı/model
tarafından sağlanan oluşturma bağımsız değişkenlerinden gelebilirler.

## Araç: `subagents`

İstekte bulunan oturumun sahip olduğu oluşturulmuş alt aracı çalıştırmalarını listeler.
Kapsamı geçerli istekte bulunanla sınırlıdır; bir alt öğe yalnızca kendi denetimindeki alt öğeleri görebilir.

İsteğe bağlı durum ve hata ayıklama için `subagents` kullanın. Tamamlanma
olaylarını beklemek için `sessions_yield` kullanın.

## İletişim dizisine bağlı oturumlar

Bir kanal için iletişim dizisi bağlamaları etkinleştirildiğinde, bir alt aracı
iletişim dizisine bağlı kalabilir; böylece bu iletişim dizisindeki sonraki kullanıcı
iletileri aynı alt aracı oturumuna yönlendirilmeye devam eder.

### İletişim dizisini destekleyen kanallar

Bir kanal, konuşma bağlama bağdaştırıcısı kaydettiğinde kalıcı, iletişim dizisine bağlı
alt aracı oturumlarını (`sessions_spawn` ile `thread: true`) destekler.
Bu desteği içeren paketlenmiş kanallar: **Discord**,
**iMessage**, **Matrix** ve **Telegram**. Discord ve Matrix varsayılan olarak
bir alt iletişim dizisi oluşturur; Telegram ve iMessage varsayılan olarak
geçerli konuşmayı bağlar. Etkinleştirme, zaman aşımları ve `spawnSessions`
için kanal başına `threadBindings` yapılandırma anahtarlarını kullanın.

### Hızlı akış

<Steps>
  <Step title="Oluştur">
    `thread: true` (ve isteğe bağlı olarak `mode: "session"`) ile `sessions_spawn`.
  </Step>
  <Step title="Bağla">
    OpenClaw, etkin kanalda bu oturum hedefine bir iletişim dizisi oluşturur veya bağlar.
  </Step>
  <Step title="Sonraki iletileri yönlendir">
    Bu iletişim dizisindeki yanıtlar ve sonraki iletiler bağlı oturuma yönlendirilir.
  </Step>
  <Step title="Zaman aşımlarını incele">
    Etkinsizlik durumunda otomatik odaktan çıkarma ayarını incelemek/güncellemek için `/session idle`
    ve kesin üst sınırı denetlemek için `/session max-age` kullanın.
  </Step>
  <Step title="Bağlantıyı kaldır">
    El ile bağlantıyı kaldırmak için `/unfocus` kullanın.
  </Step>
</Steps>

### El ile denetimler

| Komut              | Etki                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Geçerli iletişim dizisini bir alt aracı/oturum hedefine bağlar (veya bir tane oluşturur)  |
| `/unfocus`         | Geçerli bağlı iletişim dizisinin bağlamasını kaldırır                                     |
| `/agents`          | Etkin çalıştırmaları ve bağlama durumunu listeler (`binding:<id>`, `unbound` veya `bindings unavailable`) |
| `/session idle`    | Boşta kalınca otomatik odaktan çıkarmayı inceler/günceller (yalnızca odaklanmış bağlı iletişim dizileri) |
| `/session max-age` | Kesin üst sınırı inceler/günceller (yalnızca odaklanmış bağlı iletişim dizileri)           |

### Yapılandırma anahtarları

- **Genel varsayılan:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanal geçersiz kılma ve oluşturma sırasında otomatik bağlama anahtarları** bağdaştırıcıya özeldir. Yukarıdaki [İletişim dizisini destekleyen kanallar](#thread-supporting-channels) bölümüne bakın.

Geçerli bağdaştırıcı ayrıntıları için [Yapılandırma başvurusu](/tr/gateway/configuration-reference) ve
[Eğik çizgi komutları](/tr/tools/slash-commands) bölümlerine bakın.

### İzin verilenler listesi

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Açık `agentId` aracılığıyla hedeflenebilecek yapılandırılmış aracı kimliklerinin listesi (`["*"]`, yapılandırılmış herhangi bir hedefe izin verir). Varsayılan: yalnızca istekte bulunan aracı. Bir liste ayarlayıp istekte bulunanın `agentId` ile kendisini oluşturabilmesini sürdürmek istiyorsanız istekte bulunanın kimliğini listeye ekleyin.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  İstekte bulunan aracı kendi `subagents.allowAgents` değerini ayarlamadığında kullanılan, yapılandırılmış hedef aracılara yönelik varsayılan izin verilenler listesi.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` belirtmeyen `sessions_spawn` çağrılarını engeller (açık profil seçimini zorunlu kılar). Aracı başına geçersiz kılma: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Gateway `agent` duyuru teslimi girişimleri için çağrı başına zaman aşımı. Değerler pozitif tamsayı milisaniyelerdir ve platformun güvenli zamanlayıcı üst sınırıyla sınırlandırılır. Geçici yeniden denemeler, toplam duyuru bekleme süresini yapılandırılmış tek bir zaman aşımından daha uzun hâle getirebilir.
</ParamField>

İstekte bulunan oturum korumalı alandaysa `sessions_spawn`, korumalı alan
olmadan çalışacak hedefleri reddeder.

### Keşif

`sessions_spawn` için şu anda hangi aracı kimliklerine izin verildiğini görmek
üzere `agents_list` kullanın. Yanıt, çağıranların OpenClaw, Codex
uygulama sunucusu ve yapılandırılmış diğer yerel çalışma zamanlarını ayırt edebilmesi için
listelenen her aracının etkin modelini ve gömülü çalışma zamanı meta verilerini içerir.

`allowAgents` girdileri, `agents.list[]` içindeki yapılandırılmış aracı kimliklerini göstermelidir.
`["*"]`, yapılandırılmış herhangi bir hedef aracıya ve istekte bulunana izin verir. Bir aracı
yapılandırması silinmesine rağmen kimliği `allowAgents` içinde kalırsa `sessions_spawn` bu kimliği
reddeder ve `agents_list` bunu atlar. Eski izin verilenler listesi girdilerini temizlemek
için `openclaw doctor --fix` çalıştırın veya hedefin varsayılanları devralırken
oluşturulabilir kalması gerekiyorsa asgari bir `agents.list[]` girdisi ekleyin.

### Otomatik arşivleme

- Alt aracı oturumları `agents.defaults.subagents.archiveAfterMinutes` sonrasında otomatik olarak arşivlenir (varsayılan `60`).
- Arşiv, `sessions.delete` kullanır ve dökümü `*.deleted.<timestamp>` olarak yeniden adlandırır (aynı klasör).
- `cleanup: "delete"`, duyurudan hemen sonra arşivler (dökümü yeniden adlandırarak saklamaya devam eder).
- Otomatik arşivleme en iyi çaba esasına dayanır; Gateway yeniden başlatılırsa bekleyen zamanlayıcılar kaybolur.
- Yapılandırılmış çalıştırma zaman aşımları otomatik arşivleme **yapmaz**; yalnızca çalıştırmayı durdurur. Oturum, otomatik arşivlemeye kadar kalır.
- Otomatik arşivleme, derinlik 1 ve derinlik 2 oturumlarına eşit şekilde uygulanır.
- Tarayıcı temizliği, arşiv temizliğinden ayrıdır: döküm/oturum kaydı saklansa bile çalıştırma tamamlandığında izlenen tarayıcı sekmeleri/süreçleri en iyi çaba esasına göre kapatılır.

## İç içe alt aracılar

Varsayılan olarak alt aracılar kendi alt aracılarını oluşturamaz
(`maxSpawnDepth: 1`). Tek düzey iç içe geçmeyi etkinleştirmek için
`maxSpawnDepth: 2` ayarını kullanın — **orkestratör kalıbı**: ana → orkestratör alt aracısı →
çalışan alt-alt aracılar.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // alt aracıların alt öğeler oluşturmasına izin ver (varsayılan: 1, aralık 1-5)
        maxChildrenPerAgent: 5, // aracı oturumu başına en fazla etkin alt öğe (varsayılan: 5, aralık 1-20)
        maxConcurrent: 8, // genel eşzamanlılık şeridi üst sınırı (varsayılan: 8)
        runTimeoutSeconds: 900, // sessions_spawn için varsayılan zaman aşımı (0 = zaman aşımı yok)
        announceTimeoutMs: 120000, // çağrı başına Gateway duyuru zaman aşımı
      },
    },
  },
}
```

### Derinlik düzeyleri

| Derinlik | Oturum anahtarı biçimi                            | Rol                                          | Alt ajan başlatabilir mi?                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Ana ajan                                    | Her zaman                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Alt ajan (derinlik 2'ye izin verildiğinde orkestratör) | Yalnızca `maxSpawnDepth >= 2` ise |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Alt-alt ajan (uç çalışan)                   | Asla                        |

### Duyuru zinciri

Sonuçlar zincir boyunca yukarı doğru akar:

1. Derinlik 2 çalışanı tamamlanır → üst öğesine (derinlik 1 orkestratörü) duyurur.
2. Derinlik 1 orkestratörü duyuruyu alır, sonuçları sentezler ve tamamlanır → ana ajana duyurur.
3. Ana ajan duyuruyu alır ve kullanıcıya iletir.

Her düzey yalnızca doğrudan alt öğelerinden gelen duyuruları görür.

<Note>
**Operasyonel rehberlik:** alt öğe çalışmasını bir kez başlatın ve
`sessions_list`, `sessions_history`, `/subagents list` veya `exec` uyku komutları etrafında yoklama döngüleri oluşturmak yerine tamamlanma olaylarını bekleyin.
`sessions_list` ve `/subagents list`, alt oturum ilişkilerini
canlı çalışmaya odaklı tutar — canlı alt öğeler bağlı kalır, sonlandırılan alt öğeler
yakın geçmişe ait kısa bir zaman aralığında görünür kalır ve yalnızca depoda bulunan eski alt öğe bağlantıları
güncellik süreleri dolduktan sonra yok sayılır. Bu, eski `spawnedBy` /
`parentSessionKey` meta verilerinin yeniden başlatma sonrasında hayalet alt öğeleri
yeniden ortaya çıkarmasını önler. Son yanıtı zaten gönderdikten sonra bir alt öğe tamamlanma olayı gelirse
doğru takip, tam olarak şu sessiz belirteçtir:
`NO_REPLY` / `no_reply`.
</Note>

### Derinliğe göre araç politikası

- Rol ve denetim kapsamı, başlatma sırasında oturum meta verilerine yazılır. Bu, düzleştirilmiş veya geri yüklenmiş oturum anahtarlarının yanlışlıkla orkestratör ayrıcalıklarını yeniden kazanmasını önler.
- **Derinlik 1 (orkestratör, `maxSpawnDepth >= 2` olduğunda):** alt öğeleri başlatabilmesi ve durumlarını inceleyebilmesi için `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` araçlarını alır. Diğer oturum/sistem araçları reddedilmeye devam eder.
- **Derinlik 1 (uç, `maxSpawnDepth == 1` olduğunda):** oturum aracı yoktur (mevcut varsayılan davranış).
- **Derinlik 2 (uç çalışan):** oturum aracı yoktur — `sessions_spawn`, derinlik 2'de her zaman reddedilir. Başka alt öğeler başlatamaz.

### Ajan başına başlatma sınırı

Her ajan oturumu (herhangi bir derinlikte) aynı anda en fazla `maxChildrenPerAgent`
(varsayılan `5`) etkin alt öğeye sahip olabilir. Bu, tek bir orkestratörden
denetimsiz yayılmayı önler.

### Kademeli durdurma

Bir derinlik 1 orkestratörünün durdurulması, tüm derinlik 2
alt öğelerini otomatik olarak durdurur:

- Ana sohbetteki `/stop`, tüm derinlik 1 ajanlarını durdurur ve durdurmayı onların derinlik 2 alt öğelerine yayar.

## Kimlik doğrulama

Alt ajan kimlik doğrulaması, oturum türüne göre değil **ajan kimliğine** göre çözümlenir:

- Alt ajan oturum anahtarı `agent:<agentId>:subagent:<uuid>` şeklindedir.
- Kimlik doğrulama deposu, bu ajanın `agentDir` konumundan yüklenir.
- Ana ajanın kimlik doğrulama profilleri **geri dönüş** olarak birleştirilir; çakışmalarda ajan profilleri ana profilleri geçersiz kılar.

Birleştirme eklemelidir; dolayısıyla ana profiller her zaman geri dönüş
olarak kullanılabilir. Ajan başına tamamen yalıtılmış kimlik doğrulama henüz desteklenmemektedir.

## Duyuru

Alt ajanlar bir duyuru adımıyla geri bildirimde bulunur:

- Duyuru adımı, istekte bulunan oturumda değil alt ajan oturumunda çalışır.
- Alt ajan tam olarak `ANNOUNCE_SKIP` yanıtını verirse hiçbir şey gönderilmez.
- En son asistan metni tam olarak `NO_REPLY` / `no_reply` sessiz belirteciyse, daha önce görünür ilerleme bulunmuş olsa bile duyuru çıktısı engellenir.

Teslimat, istekte bulunanın derinliğine bağlıdır:

- Üst düzey istekte bulunan oturumlar, harici teslimatla (`deliver=true`) bir takip `agent` çağrısı kullanır.
- İç içe istekte bulunan alt ajan oturumları, orkestratörün alt öğe sonuçlarını oturum içinde sentezleyebilmesi için dahili bir takip eklemesi (`deliver=false`) alır.
- İç içe istekte bulunan alt ajan oturumu artık mevcut değilse OpenClaw, kullanılabilir olduğunda o oturumun istekte bulunanına geri döner.

Üst düzey istekte bulunan oturumlar için tamamlanma modu doğrudan teslimatı, önce
bağlı konuşma/konu rotasını ve kanca geçersiz kılmasını çözümler, ardından
eksik kanal-hedef alanlarını istekte bulunan oturumun depolanmış rotasından doldurur.
Bu, tamamlanma kaynağı yalnızca kanalı tanımlasa bile tamamlanmaları doğru sohbette/konuda
tutar.

İç içe tamamlanma bulguları oluşturulurken alt öğe tamamlanma toplaması,
mevcut istekte bulunan çalışmasıyla sınırlandırılır; böylece önceki çalışmalara ait eski alt öğe
çıktılarının mevcut duyuruya sızması önlenir. Duyuru yanıtları,
kanal bağdaştırıcılarında mevcut olduğunda ileti dizisi/konu yönlendirmesini korur.

### Duyuru bağlamı

Duyuru bağlamı, kararlı bir dahili olay bloğuna normalleştirilir:

| Alan          | Kaynak                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Kaynak         | `subagent` veya `cron`                                                                                     |
| Oturum kimlikleri    | Alt öğe oturum anahtarı/kimliği                                                                                     |
| Tür           | Duyuru türü + görev etiketi                                                                               |
| Durum         | Çalışma zamanı sonucundan türetilir (`ok`, `error`, `timeout` veya `unknown`) — model metninden çıkarılmaz |
| Sonuç içeriği | Alt öğeden gelen en son görünür asistan metni                                                             |
| Takip      | Ne zaman yanıt verileceğini veya sessiz kalınacağını açıklayan talimat                                                      |

Terminalde başarısız olan çalışmalar, yakalanan yanıt metnini yeniden oynatmadan
başarısızlık durumunu bildirir. Araç/araç sonucu çıktısı, alt öğe sonuç metnine yükseltilmez.

### İstatistik satırı

Duyuru yükleri, sarmalanmış olsalar bile sonda bir istatistik satırı içerir:

- Çalışma süresi (ör. `runtime 5m12s`).
- Belirteç kullanımı (girdi/çıktı/toplam).
- Model fiyatlandırması yapılandırıldığında tahmini maliyet (`models.providers.*.models[].cost`).
- Ana ajanın `sessions_history` aracılığıyla geçmişi alabilmesi veya diskteki dosyayı inceleyebilmesi için `sessionKey`, `sessionId` ve döküm yolu.

Dahili meta veriler yalnızca orkestrasyon içindir; kullanıcıya yönelik yanıtlar
normal asistan üslubuyla yeniden yazılmalıdır.

### Neden `sessions_history` tercih edilmeli?

`sessions_history`, bir ajan turu içinden alt öğenin
dökümünü okumak için daha güvenli orkestrasyon yoludur:

- Genel amaçlı günlük redaksiyonu devre dışı olsa bile kimlik bilgisi/belirteç benzeri metinleri karartır.
- Uzun metin bloklarını kısaltır (blok başına 4000 karakter) ve düşünme imzalarını, muhakeme yeniden oynatma yüklerini ve satır içi görüntü verilerini kaldırır.
- 80 KB yanıt sınırı uygular; aşırı büyük satırlar `[sessions_history omitted: message too large]` ile değiştirilir.
- Eski döküm pencerelerinde geriye doğru sayfalamak için mevcut olduğunda `nextOffset` kullanın.
- `sessions_history`, muhakeme etiketlerini, `<relevant-memories>` iskelesini veya araç çağrısı XML'ini ileti metninden **kaldırmaz** — yalnızca karartılmış ve boyutu sınırlandırılmış şekilde, ham döküm biçimine yakın yapılandırılmış içerik blokları döndürür. `/subagents log`, yapılandırılmış bloklar yerine düz sohbet satırları oluşturduğu için daha kapsamlı düz yazı temizleyicisini uygular (muhakeme etiketlerini, bellek iskelesini ve araç çağrısı XML'ini kaldırır).
- Bayt bayt tam döküme ihtiyaç duyduğunuzda ham disk üzerindeki dökümü incelemek geri dönüş seçeneğidir.

## Araç politikası

Alt ajanlar önce üst veya hedef ajanla aynı profil ve araç politikası
işlem hattını kullanır. Bundan sonra OpenClaw, alt ajan kısıtlama
katmanını uygular.

Alt ajanlar; derinlik veya rolden bağımsız olarak `gateway`, `agents_list`, `session_status` ve
`cron` araçlarını her zaman kaybeder (sistem düzeyinde/etkileşimli araçlar veya
ana ajanın koordine etmesi gereken araçlar). Uç alt ajanlar (varsayılan derinlik 1
davranışı ve derinlik 2'de her zaman) ayrıca `subagents`,
`sessions_list`, `sessions_history` ve `sessions_spawn` araçlarını kaybeder. Alt ajanlar
`message` aracını hiçbir zaman almaz — bu araç, bu ret listesiyle filtrelenmek yerine başlatma sırasında devre dışı bırakılır — ve alt ajanların
yalnızca duyuru zinciri üzerinden iletişim kurması için `sessions_send` reddedilmeye devam eder.

`sessions_history` burada da sınırlandırılmış, temizlenmiş bir hatırlama görünümü olarak kalır —
ham döküm değildir.

`maxSpawnDepth >= 2` olduğunda, derinlik 1 orkestratör alt ajanları
alt öğelerini yönetebilmeleri için ayrıca `sessions_spawn`, `subagents`, `sessions_list` ve
`sessions_history` araçlarını alır.

### Yapılandırmayla geçersiz kılma

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
        // ret önceliklidir
        deny: ["gateway", "cron"],
        // izin ayarlanırsa yalnızca izin verilenler geçerli olur (ret yine önceliklidir)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow`, yalnızca izin veren son bir filtredir. Önceden
çözümlenmiş araç kümesini daraltabilir ancak `tools.profile` tarafından kaldırılan bir aracı **geri ekleyemez**.
Örneğin `tools.profile: "coding"`, `web_search`/`web_fetch` içerir
ancak `browser` aracını içermez. Kodlama profilli alt ajanların
tarayıcı otomasyonunu kullanmasını sağlamak için tarayıcıyı profil
aşamasında ekleyin:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Yalnızca bir ajanın tarayıcı otomasyonu alması gerekiyorsa ajan başına
`agents.list[].tools.alsoAllow: ["browser"]` kullanın.

## Eşzamanlılık

Alt ajanlar özel bir işlem içi kuyruk şeridi kullanır:

- **Şerit adı:** `subagent`
- **Eşzamanlılık:** `agents.defaults.subagents.maxConcurrent` (varsayılan `8`)

## Canlılık ve kurtarma

OpenClaw, `endedAt` yokluğunu bir alt ajanın hâlâ canlı olduğuna dair
kalıcı kanıt olarak kabul etmez. Eski çalışma penceresinden daha eski olan sonlandırılmamış çalışmalar
(2 saat veya yapılandırılmış çalışma zaman aşımı ile kısa bir ek sürenin toplamı;
hangisi daha uzunsa) `/subagents list` içindeki etkin/beklemede sayımlarında,
durum özetlerinde, alt öğe tamamlanma geçitlerinde ve oturum başına
eşzamanlılık denetimlerinde artık hesaba katılmaz.

Gateway yeniden başlatıldıktan sonra, alt öğe oturumu `abortedLastRun: true` olarak
işaretlenmemişse eski ve sonlandırılmamış geri yüklenmiş çalışmalar budanır. Yeniden başlatma nedeniyle iptal edilen
çalışmalar, alt ajan yetim kurtarma akışı için kayıtlı kalır: eski
çalışmalar devam ettirilmeden sonlandırılırken yeni alt öğe oturumları,
iptal işareti temizlenmeden önce yapay bir devam ettirme iletisi alır.

Otomatik yeniden başlatma kurtarması, alt öğe oturumu başına sınırlandırılmıştır. Aynı
alt ajan alt öğesi hızlı yeniden kilitlenme penceresi içinde yetim kurtarma için tekrar tekrar kabul edilirse
OpenClaw, bu oturumda kalıcı bir kurtarma mezar taşı tutar ve
sonraki yeniden başlatmalarda otomatik olarak devam ettirmeyi durdurur. Görev kaydını uzlaştırmak için
`openclaw tasks maintenance --apply` veya mezar taşı bulunan oturumlardaki eski iptal edilmiş kurtarma işaretlerini temizlemek için
`openclaw doctor --fix` komutunu çalıştırın.

<Note>
Bir alt ajan oluşturma işlemi Gateway `PAIRING_REQUIRED` /
`scope-upgrade` ile başarısız olursa eşleştirme durumunu düzenlemeden önce RPC çağırıcısını kontrol edin.
Dahili `sessions_spawn` koordinasyonu, çağırıcı zaten gateway istek bağlamında çalışıyorsa işlem içinde yönlendirilir; dolayısıyla
geri döngü WebSocket'i açmaz veya CLI'ın eşleştirilmiş cihaz kapsamı
temeline bağlı değildir. Gateway işlemi dışındaki çağırıcılar yine WebSocket
geri dönüşünü `client.id: "gateway-client"` olarak, doğrudan geri döngü paylaşılan belirteç/parola kimlik doğrulaması üzerinden `client.mode: "backend"`
ile kullanır. Uzak çağırıcılar, açık
`deviceIdentity`, açık cihaz belirteci yolları ve tarayıcı/node istemcileri
kapsam yükseltmeleri için hâlâ normal cihaz onayına ihtiyaç duyar.
</Note>

## Durdurma

- İstek sahibi sohbette `/stop` göndermek, istek sahibi oturumu iptal eder ve bu oturumdan oluşturulan tüm etkin alt ajan çalıştırmalarını durdurarak işlemi iç içe alt öğelere yayar.

## Sınırlamalar

- Alt ajan duyurusu **mümkün olan en iyi çabayla** gerçekleştirilir. Gateway yeniden başlatılırsa bekleyen "geri duyur" işi kaybolur.
- Alt ajanlar yine aynı Gateway işlemi kaynaklarını paylaşır; `maxConcurrent` değerini bir emniyet valfi olarak değerlendirin.
- `sessions_spawn` her zaman engellemesizdir: `{ status: "accepted", runId, childSessionKey }` değerini hemen döndürür.
- Alt ajan bağlamı yalnızca `AGENTS.md` ve `TOOLS.md` öğelerini ekler (`SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` veya `BOOTSTRAP.md` eklenmez). Codex'e özgü alt ajanlar aynı sınırı izler: `TOOLS.md` devralınan Codex iş parçacığı talimatlarında kalırken, yalnızca üst öğeye ait persona, kimlik ve kullanıcı dosyaları dönüş kapsamlı iş birliği talimatları olarak eklenir; böylece alt öğeler bunları klonlamaz.
- En fazla iç içe yerleştirme derinliği 5'tir (`maxSpawnDepth` aralığı: 1-5). Çoğu kullanım durumu için 2 derinliği önerilir.
- `maxChildrenPerAgent`, oturum başına etkin alt öğe sayısını sınırlar (varsayılan `5`, aralık `1-20`).

## İlgili

- [Oturum araçları ve durum değişiklikleri](/tr/concepts/session-tool)
- [ACP ajanları](/tr/tools/acp-agents)
- [Ajan gönderimi](/tr/tools/agent-send)
- [Arka plan görevleri](/tr/automation/tasks)
- [Çok ajanlı korumalı alan araçları](/tr/tools/multi-agent-sandbox-tools)
