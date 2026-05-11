---
read_when:
    - Ajan üzerinden arka planda veya paralel çalışma istiyorsunuz
    - sessions_spawn veya alt ajan araç politikasını değiştiriyorsunuz
    - İş parçacığına bağlı alt ajan oturumlarını uyguluyor veya sorunlarını gideriyorsunuz
sidebarTitle: Sub-agents
summary: İsteği yapan sohbete sonuçları geri duyuran yalıtılmış arka plan ajan çalıştırmaları başlatın
title: Alt ajanlar
x-i18n:
    generated_at: "2026-05-11T20:39:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02b03bdfd5cddf5618fddf0804f017400c36751095166dac18fa35fa3bfd4c6e
    source_path: tools/subagents.md
    workflow: 16
---

Alt aracılar, mevcut bir aracı çalıştırmasından başlatılan arka plan aracı çalıştırmalarıdır.
Kendi oturumlarında (`agent:<agentId>:subagent:<uuid>`) çalışırlar ve
tamamlandıklarında sonuçlarını istekte bulunan sohbet
kanalına **duyururlar**. Her alt aracı çalıştırması bir
[arka plan görevi](/tr/automation/tasks) olarak izlenir.

Birincil hedefler:

- Ana çalıştırmayı engellemeden "araştırma / uzun görev / yavaş araç" çalışmalarını paralelleştirmek.
- Alt aracıları varsayılan olarak yalıtılmış tutmak (oturum ayrımı + isteğe bağlı sandboxing).
- Araç yüzeyini yanlış kullanımı zor olacak şekilde tutmak: alt aracılar varsayılan olarak oturum araçlarını almaz.
- Orkestratör desenleri için yapılandırılabilir iç içe geçme derinliğini desteklemek.

<Note>
**Maliyet notu:** her alt aracının varsayılan olarak kendi bağlamı ve token
kullanımı vardır. Ağır veya tekrarlayan görevler için alt aracılara daha ucuz
bir model ayarlayın ve ana aracınızı daha yüksek kaliteli bir modelde tutun. Şununla
yapılandırın: `agents.defaults.subagents.model` veya aracı başına geçersiz kılmalar.
Bir alt öğe gerçekten istekte bulunanın mevcut konuşma dökümüne ihtiyaç duyduğunda,
aracı o tek başlatmada `context: "fork"` isteyebilir. Konuya bağlı alt aracı oturumları
varsayılan olarak `context: "fork"` kullanır, çünkü mevcut konuşmayı bir
takip konusuna dallandırırlar.
</Note>

## Eğik çizgi komutu

**Mevcut oturum** için alt aracı çalıştırmalarını incelemek veya kontrol etmek üzere
`/subagents` kullanın:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

Mevcut istekte bulunan oturumun etkin çalıştırmasını yönlendirmek için üst düzey [`/steer <message>`](/tr/tools/steer) kullanın. Hedef bir alt çalıştırma olduğunda `/subagents steer <id|#> <message>` kullanın.

`/subagents info` çalıştırma meta verilerini gösterir (durum, zaman damgaları, oturum kimliği,
konuşma dökümü yolu, temizlik). Sınırlı ve güvenlik filtreli bir geri çağırma görünümü için
`sessions_history` kullanın; ham tam konuşma dökümüne ihtiyaç duyduğunuzda diskteki konuşma dökümü yolunu inceleyin.

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

`/subagents spawn`, bir arka plan alt aracısını kullanıcı komutu olarak başlatır (dahili bir
aktarım değil) ve çalıştırma bittiğinde istekte bulunan sohbete son bir tamamlama
güncellemesi gönderir.

<AccordionGroup>
  <Accordion title="Engellemesiz, itme tabanlı tamamlama">
    - Başlatma komutu engellemesizdir; hemen bir çalıştırma kimliği döndürür.
    - Tamamlandığında alt aracı, istekte bulunan sohbet kanalına bir özet/sonuç mesajı duyurur.
    - Alt sonuçlara ihtiyaç duyan aracı turları, gerekli işi başlattıktan sonra `sessions_yield` çağırmalıdır. Bu, mevcut turu bitirir ve tamamlama olaylarının model tarafından görülebilen bir sonraki mesaj olarak gelmesini sağlar.
    - Tamamlama itme tabanlıdır. Başlatıldıktan sonra, yalnızca bitmesini beklemek için `/subagents list`, `sessions_list` veya `sessions_history` komutlarını döngü içinde yoklamayın; durumu yalnızca hata ayıklama veya müdahale için gerektiğinde inceleyin.
    - Alt çıktı, istekte bulunan aracının sentezlemesi için bir rapor/kanıttır. Kullanıcı tarafından yazılmış talimat metni değildir ve sistem, geliştirici veya kullanıcı politikasını geçersiz kılamaz.
    - Tamamlandığında OpenClaw, duyuru temizleme akışı devam etmeden önce o alt aracı oturumu tarafından açılan izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır.

  </Accordion>
  <Accordion title="Elle başlatma teslim dayanıklılığı">
    - OpenClaw, tamamlamaları istekte bulunan oturuma kararlı bir idempotency anahtarına sahip bir `agent` turu üzerinden geri verir.
    - İstekte bulunan çalıştırma hâlâ etkinse OpenClaw, ikinci bir görünür yanıt yolu başlatmak yerine önce o çalıştırmayı uyandırmayı/yönlendirmeyi dener.
    - İstekte bulunan aracı tamamlama devri başarısız olursa veya görünür çıktı üretmezse OpenClaw teslimi başarısız sayar ve kuyruk yönlendirme/yeniden denemeye geri döner. Alt sonucu doğrudan dış sohbete ham olarak göndermez.
    - Doğrudan devir kullanılamazsa kuyruk yönlendirmeye geri döner.
    - Kuyruk yönlendirme hâlâ kullanılabilir değilse duyuru, son vazgeçmeden önce kısa üstel geri çekilmeyle yeniden denenir.
    - Tamamlama teslimi çözümlenmiş istekte bulunan rotayı korur: kullanılabilir olduğunda konuya bağlı veya konuşmaya bağlı tamamlama rotaları kazanır; tamamlama kaynağı yalnızca bir kanal sağlıyorsa OpenClaw, eksik hedefi/hesabı istekte bulunan oturumun çözümlenmiş rotasından (`lastChannel` / `lastTo` / `lastAccountId`) doldurur, böylece doğrudan teslim hâlâ çalışır.

  </Accordion>
  <Accordion title="Tamamlama devri meta verileri">
    İstekte bulunan oturuma tamamlama devri, çalışma zamanı tarafından oluşturulan
    dahili bağlamdır (kullanıcı tarafından yazılmış metin değildir) ve şunları içerir:

    - `Result` — en son görünür `assistant` yanıt metni, aksi halde temizlenmiş en son tool/toolResult metni. Terminal başarısız çalıştırmalar yakalanmış yanıt metnini yeniden kullanmaz.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompakt çalışma zamanı/token istatistikleri.
    - İstekte bulunan aracıya normal asistan sesiyle yeniden yazmasını söyleyen bir teslim talimatı (ham dahili meta veriyi iletmemesini).

  </Accordion>
  <Accordion title="Modlar ve ACP çalışma zamanı">
    - `--model` ve `--thinking`, o belirli çalıştırma için varsayılanları geçersiz kılar.
    - Tamamlandıktan sonra ayrıntıları ve çıktıyı incelemek için `info`/`log` kullanın.
    - `/subagents spawn` tek seferlik moddur (`mode: "run"`). Kalıcı konuya bağlı oturumlar için `thread: true` ve `mode: "session"` ile `sessions_spawn` kullanın.
    - ACP koşum oturumları için (Claude Code, Gemini CLI, OpenCode veya açık Codex ACP/acpx), araç bu çalışma zamanını duyurduğunda `runtime: "acp"` ile `sessions_spawn` kullanın. Tamamlamalarda veya aracıdan aracıya döngülerde hata ayıklarken [ACP teslim modeli](/tr/tools/acp-agents#delivery-model) bölümüne bakın. `codex` Plugin etkin olduğunda Codex sohbet/konu denetimi, kullanıcı açıkça ACP/acpx istemedikçe ACP yerine `/codex ...` tercih etmelidir.
    - OpenClaw, ACP etkinleştirilene, istekte bulunan sandbox içinde olmayana ve `acpx` gibi bir arka uç Plugin yüklenene kadar `runtime: "acp"` değerini gizler. `runtime: "acp"` harici bir ACP koşum kimliği veya `runtime.type="acp"` olan bir `agents.list[]` girdisi bekler; `agents_list` içindeki normal OpenClaw yapılandırma aracıları için varsayılan alt aracı çalışma zamanını kullanın.

  </Accordion>
</AccordionGroup>

## Bağlam modları

Yerel alt aracılar, çağıran açıkça mevcut konuşma dökümünü çatallamayı istemediği sürece yalıtılmış başlar.

| Mod        | Ne zaman kullanılır                                                                                                                     | Davranış                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `isolated` | Yeni araştırma, bağımsız uygulama, yavaş araç çalışması veya görev metninde özetlenebilecek herhangi bir şey                            | Temiz bir alt konuşma dökümü oluşturur. Bu varsayılandır ve token kullanımını daha düşük tutar. |
| `fork`     | Mevcut konuşmaya, önceki araç sonuçlarına veya istekte bulunan konuşma dökümünde zaten bulunan nüanslı talimatlara bağlı çalışma        | Alt başlamadan önce istekte bulunan konuşma dökümünü alt oturuma dallandırır. |

`fork` değerini tutumlu kullanın. Bu, bağlama duyarlı yetkilendirme içindir;
net bir görev istemi yazmanın yerine geçmez.

## Araç: `sessions_spawn`

Global `subagent` hattında `deliver: false` ile bir alt aracı çalıştırması başlatır,
ardından bir duyuru adımı çalıştırır ve duyuru yanıtını istekte bulunan
sohbet kanalına gönderir.

Kullanılabilirlik, çağıranın etkili araç politikasına bağlıdır. `coding` ve
`full` profilleri varsayılan olarak `sessions_spawn` sunar. `messaging` profili
sunmaz; iş devretmesi gereken aracılar için `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` ekleyin veya `tools.profile: "coding"` kullanın. Kanal/grup,
sağlayıcı, sandbox ve aracı başına izin/verme politikaları, profil aşamasından
sonra aracı yine de kaldırabilir. Etkili araç listesini doğrulamak için aynı
oturumdan `/tools` kullanın.

**Varsayılanlar:**

- **Model:** `agents.defaults.subagents.model` (veya aracı başına `agents.list[].subagents.model`) ayarlamadığınız sürece çağırandan devralır; açık bir `sessions_spawn.model` yine de kazanır.
- **Thinking:** `agents.defaults.subagents.thinking` (veya aracı başına `agents.list[].subagents.thinking`) ayarlamadığınız sürece çağırandan devralır; açık bir `sessions_spawn.thinking` yine de kazanır.
- **Çalıştırma zaman aşımı:** `sessions_spawn.runTimeoutSeconds` atlanırsa OpenClaw, ayarlandığında `agents.defaults.subagents.runTimeoutSeconds` kullanır; aksi halde `0` değerine (zaman aşımı yok) geri döner.

### Yetkilendirme istem modu

`agents.defaults.subagents.delegationMode` yalnızca istem rehberliğini kontrol eder; araç politikasını değiştirmez veya yetkilendirmeyi zorunlu kılmaz.

- `suggest` (varsayılan): daha büyük veya daha yavaş işler için alt aracıları kullanmaya yönelik standart istem yönlendirmesini korur.
- `prefer`: ana aracıya yanıt verebilir kalmasını ve doğrudan yanıttan daha kapsamlı olan her şeyi `sessions_spawn` üzerinden devretmesini söyler.

Aracı başına geçersiz kılmalar `agents.list[].subagents.delegationMode` kullanır.

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
  Daha sonra `subagents` hedeflemesi için isteğe bağlı kararlı tanıtıcı. `[a-z][a-z0-9_]{0,63}` ile eşleşmeli ve `last` veya `all` gibi ayrılmış hedefler olamaz. Koordinatörün birkaç alt öğe başlattıktan sonra belirli bir alt öğeyi yönlendirmesi, sonlandırması veya tanımlaması gerekebilecek durumlarda bunu tercih edin.
</ParamField>
<ParamField path="label" type="string">
  İsteğe bağlı, insanlar tarafından okunabilir etiket.
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents` tarafından izin verildiğinde başka bir aracı kimliği altında başlatın.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` yalnızca harici ACP koşumları (`claude`, `droid`, `gemini`, `opencode` veya açıkça istenen Codex ACP/acpx) ve `runtime.type` değeri `acp` olan `agents.list[]` girdileri içindir.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Yalnızca ACP. `runtime: "acp"` olduğunda mevcut bir ACP koşum oturumunu sürdürür; yerel alt aracı başlatmaları için yok sayılır.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Yalnızca ACP. `runtime: "acp"` olduğunda ACP çalıştırma çıktısını üst oturuma aktarır; yerel alt aracı başlatmaları için atlayın.
</ParamField>
<ParamField path="model" type="string">
  Alt aracı modelini geçersiz kılın. Geçersiz değerler atlanır ve alt aracı, araç sonucunda bir uyarıyla varsayılan modelde çalışır.
</ParamField>
<ParamField path="thinking" type="string">
  Alt aracı çalıştırması için düşünme düzeyini geçersiz kılın.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Ayarlandığında varsayılan olarak `agents.defaults.subagents.runTimeoutSeconds` değerini, aksi halde `0` değerini kullanır. Ayarlandığında, alt aracı çalıştırması N saniye sonra durdurulur.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` olduğunda, bu alt aracı oturumu için kanal ileti dizisi bağlaması ister.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` ve `mode` atlanmışsa varsayılan `session` olur. `mode: "session"` için `thread: true` gerekir.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"`, duyurudan hemen sonra arşivler (yine de yeniden adlandırma yoluyla transkripti korur).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require`, hedef alt çalışma zamanı korumalı alanda değilse başlatmayı reddeder.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork`, istekte bulunanın mevcut transkriptini alt oturuma dallandırır. Yalnızca yerel alt aracılar. İleti dizisine bağlı başlatmalar varsayılan olarak `fork`; ileti dizisi olmayan başlatmalar varsayılan olarak `isolated` kullanır.
</ParamField>

<Warning>
`sessions_spawn`, kanal teslim parametrelerini (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`) kabul **etmez**. Teslim için, başlatılan çalıştırmadan
`message`/`sessions_send` kullanın.
</Warning>

### Görev adları ve hedefleme

`taskName`, oturum anahtarı değil, orkestrasyon için modele dönük bir tanıtıcıdır.
Bir koordinatörün daha sonra o alt öğeyi yönlendirmesi veya sonlandırması gerekebilecek durumlarda
`review_subagents`, `linux_validation` veya `docs_update` gibi kararlı alt öğe adları için kullanın.

Hedef çözümleme, tam `taskName` eşleşmelerini ve belirsiz olmayan
ön ekleri kabul eder. Eşleştirme, numaralandırılmış `/subagents` hedefleri tarafından kullanılan aynı etkin/yakın hedef penceresiyle
sınırlıdır; bu nedenle eski tamamlanmış bir alt öğe, yeniden kullanılan
bir tanıtıcıyı belirsiz hale getirmez. İki etkin veya yakın alt öğe aynı
`taskName` değerini paylaşıyorsa hedef belirsizdir; bunun yerine liste dizinini, oturum anahtarını veya
çalıştırma kimliğini kullanın.

Ayrılmış hedefler olan `last` ve `all`, geçerli `taskName` değerleri değildir
çünkü zaten denetim anlamları vardır.

## Araç: `sessions_yield`

Geçerli model turunu sonlandırır ve çalışma zamanı olaylarının, öncelikle
alt aracı tamamlanma olaylarının, sonraki ileti olarak gelmesini bekler. İstekte bulunan, bu tamamlanmalar gelene kadar nihai
yanıt üretemiyorsa gerekli alt çalışmayı başlattıktan sonra bunu kullanın.

`sessions_yield` bekleme temelidir. Alt öğe tamamlanmasını algılamak için bunu
`subagents`, `sessions_list`, `sessions_history` üzerinde yoklama
döngüleriyle, kabuk `sleep` komutuyla veya süreç yoklamayla değiştirmeyin.

Yalnızca oturumun etkili araç listesi bunu içerdiğinde `sessions_yield` kullanın.
Bazı minimal veya özel araç profilleri, `sessions_yield` göstermeden `sessions_spawn` ve
`subagents` gösterebilir; bu durumda tamamlanmayı beklemek için
bir yoklama döngüsü icat etmeyin.

Etkin alt öğeler varken OpenClaw, normal turlara kompakt, çalışma zamanı tarafından oluşturulan
`Active Subagents` istem bloğu ekler; böylece istekte bulunan geçerli alt oturumları, çalıştırma kimliklerini, durumları, etiketleri, görevleri ve
`taskName` takma adlarını yoklama yapmadan görebilir. Bu
blokta görev ve etiket alanları, talimat olarak değil veri olarak alıntılanır; çünkü kullanıcı/model tarafından sağlanan başlatma argümanlarından
gelebilirler.

## Araç: `subagents`

İstekte bulunan oturuma ait başlatılmış alt aracı çalıştırmalarını
listeler, yönlendirir veya sonlandırır. Geçerli istekte bulunanla sınırlıdır; bir alt öğe yalnızca
kendi denetlediği alt öğeleri görebilir/denetleyebilir.

İsteğe bağlı durum, hata ayıklama, yönlendirme veya sonlandırma için `subagents` kullanın.
Tamamlanma olaylarını beklemek için `sessions_yield` kullanın.

## İleti dizisine bağlı oturumlar

Bir kanal için ileti dizisi bağlamaları etkinleştirildiğinde, bir alt aracı bir ileti dizisine bağlı kalabilir; böylece o ileti dizisindeki takip kullanıcı iletileri aynı
alt aracı oturumuna yönlendirilmeye devam eder.

### İleti dizisi destekleyen kanallar

**Discord** şu anda desteklenen tek kanaldır. Kalıcı
ileti dizisine bağlı alt aracı oturumlarını (`sessions_spawn` ile
`thread: true`), manuel ileti dizisi denetimlerini (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) ve bağdaştırıcı anahtarlarını
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` ve
`channels.discord.threadBindings.spawnSessions` destekler.

### Hızlı akış

<Steps>
  <Step title="Başlat">
    `thread: true` ile (ve isteğe bağlı olarak `mode: "session"`) `sessions_spawn`.
  </Step>
  <Step title="Bağla">
    OpenClaw, etkin kanalda bu oturum hedefine bir ileti dizisi oluşturur veya bağlar.
  </Step>
  <Step title="Takipleri yönlendir">
    Bu ileti dizisindeki yanıtlar ve takip iletileri bağlı oturuma yönlendirilir.
  </Step>
  <Step title="Zaman aşımlarını incele">
    Etkinsizlik otomatik odak kaldırmayı incelemek/güncellemek için `/session idle` ve
    sabit üst sınırı denetlemek için `/session max-age` kullanın.
  </Step>
  <Step title="Ayır">
    Manuel olarak ayırmak için `/unfocus` kullanın.
  </Step>
</Steps>

### Manuel denetimler

| Komut              | Etki                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| `/focus <target>`  | Geçerli ileti dizisini (veya yeni bir tane oluşturup) bir alt aracı/oturum hedefine bağlar |
| `/unfocus`         | Geçerli bağlı ileti dizisi için bağlamayı kaldırır                   |
| `/agents`          | Etkin çalıştırmaları ve bağlama durumunu listeler (`thread:<id>` veya `unbound`) |
| `/session idle`    | Boşta otomatik odak kaldırmayı inceler/günceller (yalnızca odaklanmış bağlı ileti dizileri) |
| `/session max-age` | Sabit üst sınırı inceler/günceller (yalnızca odaklanmış bağlı ileti dizileri) |

### Yapılandırma anahtarları

- **Genel varsayılan:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanal geçersiz kılma ve başlatma otomatik bağlama anahtarları** bağdaştırıcıya özeldir. Yukarıdaki [İleti dizisi destekleyen kanallar](#thread-supporting-channels) bölümüne bakın.

Geçerli bağdaştırıcı ayrıntıları için [Yapılandırma başvurusu](/tr/gateway/configuration-reference) ve
[Slash komutları](/tr/tools/slash-commands) bölümlerine bakın.

### İzin listesi

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Açık `agentId` aracılığıyla hedeflenebilecek aracı kimliklerinin listesi (`["*"]` herhangi birine izin verir). Varsayılan: yalnızca istekte bulunan aracı. Bir liste ayarlarsanız ve istekte bulunanın yine de `agentId` ile kendisini başlatmasını istiyorsanız, istekte bulunan kimliğini listeye ekleyin.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  İstekte bulunan aracı kendi `subagents.allowAgents` değerini ayarlamadığında kullanılan varsayılan hedef aracı izin listesi.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` atlayan `sessions_spawn` çağrılarını engeller (açık profil seçimini zorunlu kılar). Aracı başına geçersiz kılma: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Gateway `agent` duyuru teslim denemeleri için çağrı başına zaman aşımı. Değerler pozitif tam sayı milisaniyedir ve platform açısından güvenli zamanlayıcı maksimumuna sıkıştırılır. Geçici yeniden denemeler, toplam duyuru beklemesini yapılandırılmış tek bir zaman aşımından daha uzun hale getirebilir.
</ParamField>

İstekte bulunan oturum korumalı alandaysa `sessions_spawn`, korumalı alan dışında çalışacak hedefleri
reddeder.

### Keşif

`sessions_spawn` için şu anda hangi aracı kimliklerine izin verildiğini görmek üzere `agents_list` kullanın. Yanıt, çağıranların PI, Codex
uygulama sunucusu ve diğer yapılandırılmış yerel çalışma zamanlarını ayırt edebilmesi için listelenen her aracının etkili
modelini ve gömülü çalışma zamanı meta verilerini içerir.

### Otomatik arşiv

- Alt aracı oturumları `agents.defaults.subagents.archiveAfterMinutes` sonrasında otomatik olarak arşivlenir (varsayılan `60`).
- Arşiv, `sessions.delete` kullanır ve transkripti `*.deleted.<timestamp>` olarak yeniden adlandırır (aynı klasör).
- `cleanup: "delete"`, duyurudan hemen sonra arşivler (yine de yeniden adlandırma yoluyla transkripti korur).
- Otomatik arşiv en iyi çabayla yapılır; Gateway yeniden başlatılırsa bekleyen zamanlayıcılar kaybolur.
- `runTimeoutSeconds` otomatik arşivleme yapmaz; yalnızca çalıştırmayı durdurur. Oturum otomatik arşive kadar kalır.
- Otomatik arşiv, derinlik-1 ve derinlik-2 oturumlara eşit şekilde uygulanır.
- Tarayıcı temizleme, arşiv temizlemeden ayrıdır: izlenen tarayıcı sekmeleri/süreçleri, transkript/oturum kaydı tutulsa bile çalıştırma bittiğinde en iyi çabayla kapatılır.

## İç içe alt aracılar

Varsayılan olarak, alt aracılar kendi alt aracılarını başlatamaz
(`maxSpawnDepth: 1`). Bir düzey iç içe geçmeyi etkinleştirmek için `maxSpawnDepth: 2` ayarlayın:
**orkestratör deseni**: ana → orkestratör alt aracı →
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
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### Derinlik düzeyleri

| Derinlik | Oturum anahtarı şekli                       | Rol                                           | Başlatabilir mi?             |
| -------- | ------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0        | `agent:<id>:main`                           | Ana aracı                                     | Her zaman                    |
| 1        | `agent:<id>:subagent:<uuid>`                | Alt aracı (derinlik 2 izinliyse orkestratör)  | Yalnızca `maxSpawnDepth >= 2` ise |
| 2        | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Alt-alt aracı (yaprak çalışan)                | Asla                         |

### Duyuru zinciri

Sonuçlar zincir boyunca yukarı akar:

1. Derinlik-2 çalışan biter → üst öğesine duyurur (derinlik-1 orkestratör).
2. Derinlik-1 orkestratör duyuruyu alır, sonuçları sentezler, biter → ana öğeye duyurur.
3. Ana aracı duyuruyu alır ve kullanıcıya teslim eder.

Her düzey yalnızca doğrudan alt öğelerinden gelen duyuruları görür.

<Note>
**Operasyonel yönerge:** alt işleri bir kez başlatın ve `sessions_list`,
`sessions_history`, `/subagents list` veya `exec` uyku komutları etrafında yoklama döngüleri oluşturmak yerine tamamlanma
olaylarını bekleyin.
`sessions_list` ve `/subagents list`, alt oturum ilişkilerini
canlı işe odaklı tutar — canlı alt oturumlar bağlı kalır, sona eren alt oturumlar
kısa bir yakın zaman penceresinde görünür kalır ve eski, yalnızca depoda bulunan alt bağlantılar
güncellik pencerelerinden sonra yok sayılır. Bu, eski `spawnedBy` /
`parentSessionKey` meta verilerinin yeniden başlatmadan sonra hayalet alt oturumları
geri getirmesini önler. Nihai yanıtı zaten gönderdikten sonra bir alt tamamlanma olayı gelirse,
doğru takip yanıtı tam sessiz belirteç olan
`NO_REPLY` / `no_reply` değeridir.
</Note>

### Derinliğe göre araç ilkesi

- Rol ve denetim kapsamı, oluşturma zamanında oturum meta verilerine yazılır. Bu, düz veya geri yüklenmiş oturum anahtarlarının yanlışlıkla orkestratör ayrıcalıklarını yeniden kazanmasını önler.
- **Derinlik 1 (orkestratör, `maxSpawnDepth >= 2` olduğunda):** alt oturumlarını yönetebilmesi için `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` alır. Diğer oturum/sistem araçları reddedilmiş kalır.
- **Derinlik 1 (yaprak, `maxSpawnDepth == 1` olduğunda):** oturum aracı yoktur (geçerli varsayılan davranış).
- **Derinlik 2 (yaprak işçi):** oturum aracı yoktur — `sessions_spawn` derinlik 2'de her zaman reddedilir. Daha fazla alt oturum oluşturamaz.

### Ajan başına oluşturma sınırı

Her ajan oturumunun (herhangi bir derinlikte) aynı anda en fazla `maxChildrenPerAgent`
(varsayılan `5`) etkin alt oturumu olabilir. Bu, tek bir orkestratörden
kontrolsüz yayılmayı önler.

### Kademeli durdurma

Derinlik 1 orkestratörünü durdurmak, tüm derinlik 2
alt oturumlarını otomatik olarak durdurur:

- Ana sohbette `/stop`, tüm derinlik 1 ajanlarını durdurur ve derinlik 2 alt oturumlarına kademeli olarak uygulanır.
- `/subagents kill <id>`, belirli bir alt ajanı durdurur ve alt oturumlarına kademeli olarak uygulanır.
- `/subagents kill all`, istekte bulunan için tüm alt ajanları durdurur ve kademeli olarak uygulanır.

## Kimlik Doğrulama

Alt ajan kimlik doğrulaması, oturum türüne göre değil **ajan id** ile çözümlenir:

- Alt ajan oturum anahtarı `agent:<agentId>:subagent:<uuid>` biçimindedir.
- Kimlik doğrulama deposu, ilgili ajanın `agentDir` konumundan yüklenir.
- Ana ajanın kimlik doğrulama profilleri **yedek** olarak birleştirilir; çakışmalarda ajan profilleri ana profillerin üzerine yazar.

Birleştirme eklemelidir, bu yüzden ana profiller her zaman
yedek olarak kullanılabilir. Ajan başına tamamen yalıtılmış kimlik doğrulama henüz desteklenmez.

## Duyuru

Alt ajanlar bir duyuru adımıyla geri bildirim gönderir:

- Duyuru adımı, istekte bulunan oturumda değil alt ajan oturumunun içinde çalışır.
- Alt ajan tam olarak `ANNOUNCE_SKIP` yanıtını verirse hiçbir şey gönderilmez.
- En son asistan metni tam sessiz belirteç olan `NO_REPLY` / `no_reply` ise, daha önce görünür ilerleme olsa bile duyuru çıktısı bastırılır.

Teslimat, istekte bulunanın derinliğine bağlıdır:

- Üst düzey istekte bulunan oturumlar, harici teslimatla (`deliver=true`) bir takip `agent` çağrısı kullanır.
- İç içe istekte bulunan alt ajan oturumları, orkestratörün alt sonuçları oturum içinde sentezleyebilmesi için dahili bir takip enjeksiyonu (`deliver=false`) alır.
- İç içe istekte bulunan alt ajan oturumu yoksa OpenClaw, varsa o oturumun istekte bulunanına geri döner.

Üst düzey istekte bulunan oturumlar için, tamamlanma modu doğrudan teslimatı önce
bağlı konuşma/iş parçacığı rotasını ve hook geçersiz kılmasını çözer, ardından
eksik kanal-hedef alanlarını istekte bulunan oturumun saklanan rotasından doldurur.
Bu, tamamlanma kaynağı yalnızca kanalı tanımlasa bile tamamlanmaları doğru sohbet/konu üzerinde tutar.

Alt tamamlanma toplama, iç içe tamamlanma bulguları oluşturulurken
geçerli istekte bulunan çalıştırmasıyla kapsamlanır; bu, önceki çalıştırmalardan kalan eski alt
çıktıların geçerli duyuruya sızmasını önler. Duyuru yanıtları,
kanal bağdaştırıcılarında mevcut olduğunda iş parçacığı/konu yönlendirmesini korur.

### Duyuru bağlamı

Duyuru bağlamı, kararlı bir dahili olay bloğuna normalleştirilir:

| Alan           | Kaynak                                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| Kaynak         | `subagent` veya `cron`                                                                                                |
| Oturum id'leri | Alt oturum anahtarı/id                                                                                                |
| Tür            | Duyuru türü + görev etiketi                                                                                           |
| Durum          | Çalışma zamanı sonucundan türetilir (`success`, `error`, `timeout` veya `unknown`) — model metninden **çıkarılmaz** |
| Sonuç içeriği  | En son görünür asistan metni, yoksa temizlenmiş en son araç/toolResult metni                                         |
| Takip          | Ne zaman yanıt verileceğini ve ne zaman sessiz kalınacağını açıklayan yönerge                                         |

Terminal başarısız çalıştırmalar, yakalanan yanıt metnini tekrar oynatmadan
başarısızlık durumu bildirir. Zaman aşımında, alt oturum yalnızca araç çağrılarına kadar ilerlediyse duyuru,
ham araç çıktısını tekrar oynatmak yerine bu geçmişi kısa bir kısmi ilerleme özetine
indirgeyebilir.

### İstatistik satırı

Duyuru yükleri, sonda bir istatistik satırı içerir (sarmalanmış olsa bile):

- Çalışma zamanı (ör. `runtime 5m12s`).
- Belirteç kullanımı (giriş/çıkış/toplam).
- Model fiyatlandırması yapılandırıldığında tahmini maliyet (`models.providers.*.models[].cost`).
- Ana ajanın `sessions_history` üzerinden geçmişi getirebilmesi veya diskteki dosyayı inceleyebilmesi için `sessionKey`, `sessionId` ve transkript yolu.

Dahili meta veriler yalnızca orkestrasyon içindir; kullanıcıya dönük yanıtlar
normal asistan diliyle yeniden yazılmalıdır.

### Neden `sessions_history` tercih edilmeli

`sessions_history` daha güvenli orkestrasyon yoludur:

- Asistan hatırlaması önce normalleştirilir: düşünme etiketleri kaldırılır; `<relevant-memories>` / `<relevant_memories>` iskeleti kaldırılır; düz metin araç çağrısı XML yük blokları (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) kaldırılır; temiz biçimde hiç kapanmayan kesilmiş yükler dahil; düşürülmüş araç çağrısı/sonuç iskeleti ve geçmiş bağlam işaretleri kaldırılır; sızmış model denetim belirteçleri (`<|assistant|>`, diğer ASCII `<|...|>`, tam genişlikli `<｜...｜>`) kaldırılır; hatalı biçimlendirilmiş MiniMax araç çağrısı XML'i kaldırılır.
- Kimlik bilgisi/belirteç benzeri metin redakte edilir.
- Uzun bloklar kısaltılabilir.
- Çok büyük geçmişler eski satırları düşürebilir veya aşırı büyük bir satırı `[sessions_history omitted: message too large]` ile değiştirebilir.
- Bayt düzeyinde tam transkripte ihtiyaç duyduğunuzda ham disk üstü transkript incelemesi yedek yoldur.

## Araç ilkesi

Alt ajanlar önce üst veya hedef ajanla aynı profil ve araç ilkesi hattını kullanır.
Bundan sonra OpenClaw, alt ajan kısıtlama katmanını uygular.

Kısıtlayıcı bir `tools.profile` olmadığında, alt ajanlar
oturum araçları ve sistem araçları **dışındaki tüm araçları** alır:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` burada da sınırlı, temizlenmiş bir hatırlama görünümü olarak kalır —
ham transkript dökümü değildir.

`maxSpawnDepth >= 2` olduğunda, derinlik 1 orkestratör alt ajanları ayrıca
alt oturumlarını yönetebilmeleri için `sessions_spawn`, `subagents`, `sessions_list` ve
`sessions_history` alır.

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

`tools.subagents.tools.allow` nihai bir yalnızca izin verilenler filtresidir. Zaten çözümlenmiş
araç kümesini daraltabilir, ancak `tools.profile` tarafından kaldırılmış bir aracı
**geri ekleyemez**. Örneğin, `tools.profile: "coding"` `web_search`/`web_fetch` içerir
ama `browser` aracını içermez. Kodlama profilli alt ajanların browser otomasyonu kullanmasına izin vermek için,
browser'ı profil aşamasında ekleyin:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Yalnızca bir ajanın browser otomasyonu alması gerekiyorsa ajan başına
`agents.list[].tools.alsoAllow: ["browser"]` kullanın.

## Eşzamanlılık

Alt ajanlar, özel bir süreç içi kuyruk hattı kullanır:

- **Hat adı:** `subagent`
- **Eşzamanlılık:** `agents.defaults.subagents.maxConcurrent` (varsayılan `8`)

## Canlılık ve kurtarma

OpenClaw, `endedAt` yokluğunu bir alt ajanın hâlâ canlı olduğuna dair kalıcı kanıt olarak değerlendirmez.
Eski çalıştırma penceresinden daha eski, sonlanmamış çalıştırmalar
`/subagents list`, durum özetleri, alt tamamlanma kapılaması ve oturum başına eşzamanlılık kontrollerinde
etkin/beklemede olarak sayılmayı bırakır.

Bir gateway yeniden başlatmasından sonra, eski sonlanmamış geri yüklenen çalıştırmalar,
alt oturumları `abortedLastRun: true` olarak işaretlenmemişse budanır. Bu
yeniden başlatmayla iptal edilmiş alt oturumlar, iptal işaretini temizlemeden önce sentetik bir sürdürme mesajı gönderen
alt ajan yetim kurtarma akışı üzerinden kurtarılabilir durumda kalır.

Otomatik yeniden başlatma kurtarması, alt oturum başına sınırlandırılmıştır. Aynı
alt ajan alt oturumu hızlı yeniden takılma penceresi içinde tekrar tekrar yetim kurtarma için kabul edilirse,
OpenClaw o oturumda bir kurtarma mezar taşı kalıcı hale getirir ve sonraki yeniden başlatmalarda onu otomatik sürdürmeyi durdurur.
Görev kaydını uzlaştırmak için `openclaw tasks maintenance --apply` çalıştırın veya
mezar taşlı oturumlardaki eski iptal edilmiş kurtarma bayraklarını temizlemek için
`openclaw doctor --fix` çalıştırın.

<Note>
Bir alt ajan oluşturma işlemi Gateway `PAIRING_REQUIRED` /
`scope-upgrade` ile başarısız olursa, eşleştirme durumunu düzenlemeden önce RPC çağıranını kontrol edin.
Dahili `sessions_spawn` koordinasyonu, doğrudan
loopback paylaşılan belirteç/parola kimlik doğrulaması üzerinden
`client.id: "gateway-client"` ve `client.mode: "backend"` ile bağlanmalıdır; bu yol,
CLI'nin eşleştirilmiş cihaz kapsamı temel değerine bağlı değildir. Uzak çağıranlar, açık
`deviceIdentity`, açık cihaz belirteci yolları ve browser/node istemcileri
kapsam yükseltmeleri için hâlâ normal cihaz onayına ihtiyaç duyar.
</Note>

## Durdurma

- İstekte bulunan sohbette `/stop` göndermek, istekte bulunan oturumu iptal eder ve ondan oluşturulmuş etkin alt ajan çalıştırmalarını durdurur; iç içe alt oturumlara kademeli olarak uygulanır.
- `/subagents kill <id>`, belirli bir alt ajanı durdurur ve alt oturumlarına kademeli olarak uygulanır.

## Sınırlamalar

- Alt ajan duyurusu **en iyi çaba** esasına dayanır. Gateway yeniden başlatılırsa bekleyen "geri duyur" işi kaybolur.
- Alt ajanlar hâlâ aynı gateway süreç kaynaklarını paylaşır; `maxConcurrent` değerini bir güvenlik valfi olarak değerlendirin.
- `sessions_spawn` her zaman engellemesizdir: hemen `{ status: "accepted", runId, childSessionKey }` döndürür.
- Alt ajan bağlamı yalnızca `AGENTS.md`, `TOOLS.md`, `SOUL.md`, `IDENTITY.md` ve `USER.md` enjekte eder (`MEMORY.md`, `HEARTBEAT.md` veya `BOOTSTRAP.md` yoktur).
- En fazla iç içe geçme derinliği 5'tir (`maxSpawnDepth` aralığı: 1–5). Çoğu kullanım senaryosu için derinlik 2 önerilir.
- `maxChildrenPerAgent`, oturum başına etkin alt oturumları sınırlar (varsayılan `5`, aralık `1–20`).

## İlgili

- [ACP ajanları](/tr/tools/acp-agents)
- [Ajan gönderimi](/tr/tools/agent-send)
- [Arka plan görevleri](/tr/automation/tasks)
- [Çok ajanlı sandbox araçları](/tr/tools/multi-agent-sandbox-tools)
