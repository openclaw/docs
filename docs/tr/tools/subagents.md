---
read_when:
    - Ajan aracılığıyla arka planda veya paralel çalışma istiyorsunuz
    - sessions_spawn veya alt ajan araç politikasını değiştiriyorsunuz
    - İş parçacığına bağlı alt ajan oturumlarını uyguluyor veya sorunlarını gideriyorsunuz
sidebarTitle: Sub-agents
summary: Sonuçları istekte bulunan sohbete geri bildiren yalıtılmış arka plan ajan çalıştırmaları başlatın
title: Alt ajanlar
x-i18n:
    generated_at: "2026-05-07T13:27:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b112f9c45bcb9cdc5d3b856f2fe2a36617606ad278b0ccc3db8830f0e847ba9
    source_path: tools/subagents.md
    workflow: 16
---

Alt ajanlar, mevcut bir ajan çalıştırmasından başlatılan arka plan ajan çalıştırmalarıdır.
Kendi oturumlarında (`agent:<agentId>:subagent:<uuid>`) çalışırlar ve,
bittiklerinde sonuçlarını istekte bulunan sohbet kanalına geri **duyururlar**.
Her alt ajan çalıştırması bir
[arka plan görevi](/tr/automation/tasks) olarak izlenir.

Birincil hedefler:

- Ana çalıştırmayı engellemeden "araştırma / uzun görev / yavaş araç" işlerini paralelleştirmek.
- Alt ajanları varsayılan olarak yalıtılmış tutmak (oturum ayrımı + isteğe bağlı sandbox).
- Araç yüzeyinin kötüye kullanımını zorlaştırmak: alt ajanlara varsayılan olarak oturum araçları verilmez.
- Orkestratör desenleri için yapılandırılabilir iç içe geçme derinliğini desteklemek.

<Note>
**Maliyet notu:** her alt ajanın varsayılan olarak kendi bağlamı ve token kullanımı vardır. Ağır veya tekrarlı görevler için alt ajanlara daha ucuz bir model ayarlayın ve ana ajanınızı daha yüksek kaliteli bir modelde tutun. `agents.defaults.subagents.model` veya ajan başına geçersiz kılmalar üzerinden yapılandırın. Bir alt ajan gerçekten istekte bulunanın geçerli transkriptine ihtiyaç duyduğunda, ajan o tek başlatmada `context: "fork"` isteyebilir. Konuya bağlı alt ajan oturumları varsayılan olarak `context: "fork"` kullanır çünkü geçerli konuşmayı bir takip konusuna dallandırırlar.
</Note>

## Slash komutu

**Geçerli oturum** için alt ajan çalıştırmalarını incelemek veya denetlemek üzere `/subagents` kullanın:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

Geçerli istekte bulunan oturumun aktif çalıştırmasını yönlendirmek için üst düzey [`/steer <message>`](/tr/tools/steer) kullanın. Hedef bir alt çalıştırmaysa `/subagents steer <id|#> <message>` kullanın.

`/subagents info` çalıştırma meta verilerini gösterir (durum, zaman damgaları, oturum kimliği,
transkript yolu, temizlik). Sınırlı ve güvenlik filtresinden geçmiş geri çağırma görünümü için `sessions_history` kullanın; ham tam transkripte ihtiyaç duyduğunuzda diskteki transkript yolunu inceleyin.

### Konu bağlama kontrolleri

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

`/subagents spawn`, bir arka plan alt ajanını kullanıcı komutu olarak başlatır (iç röle olarak değil) ve çalıştırma bittiğinde istekte bulunan sohbete son bir tamamlama güncellemesi gönderir.

<AccordionGroup>
  <Accordion title="Engellemeyen, anlık iletime dayalı tamamlama">
    - Başlatma komutu engelleyici değildir; hemen bir çalıştırma kimliği döndürür.
    - Tamamlandığında alt ajan, istekte bulunan sohbet kanalına bir özet/sonuç mesajı duyurur.
    - Tamamlama anlık iletime dayalıdır. Başlatıldıktan sonra, yalnızca bitmesini beklemek için `/subagents list`, `sessions_list` veya `sessions_history` komutlarını döngü içinde yoklamayın; durumu yalnızca hata ayıklama veya müdahale için gerektiğinde inceleyin.
    - Tamamlandığında OpenClaw, duyuru temizleme akışı devam etmeden önce bu alt ajan oturumu tarafından açılan izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır.

  </Accordion>
  <Accordion title="Elle başlatma teslim dayanıklılığı">
    - OpenClaw, tamamlamaları kararlı bir idempotency anahtarıyla bir `agent` turu üzerinden istekte bulunan oturuma geri verir.
    - İstekte bulunan çalıştırma hâlâ aktifse OpenClaw, ikinci bir görünür yanıt yolu başlatmak yerine önce bu çalıştırmayı uyandırmayı/yönlendirmeyi dener.
    - İstekte bulunan ajan tamamlama devri başarısız olursa veya görünür çıktı üretmezse OpenClaw teslimi başarısız sayar ve kuyruk yönlendirme/yeniden deneme yoluna düşer. Alt sonucu doğrudan harici sohbete ham olarak göndermez.
    - Doğrudan devir kullanılamazsa kuyruk yönlendirmeye geri döner.
    - Kuyruk yönlendirme hâlâ kullanılamıyorsa duyuru, son vazgeçmeden önce kısa üstel geri çekilmeyle yeniden denenir.
    - Tamamlama teslimi çözümlenmiş istekte bulunan rotasını korur: konuya bağlı veya konuşmaya bağlı tamamlama rotaları kullanılabilir olduğunda önceliklidir; tamamlama kaynağı yalnızca bir kanal sağlıyorsa OpenClaw, doğrudan teslimin yine çalışması için eksik hedefi/hesabı istekte bulunan oturumun çözümlenmiş rotasından (`lastChannel` / `lastTo` / `lastAccountId`) doldurur.

  </Accordion>
  <Accordion title="Tamamlama devri meta verileri">
    İstekte bulunan oturuma tamamlama devri, çalışma zamanında oluşturulan
    dahili bağlamdır (kullanıcı tarafından yazılmış metin değildir) ve şunları içerir:

    - `Result` — en son görünür `assistant` yanıt metni; yoksa temizlenmiş en son araç/toolResult metni. Terminalde başarısız olan çalıştırmalar yakalanmış yanıt metnini yeniden kullanmaz.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompakt çalışma zamanı/token istatistikleri.
    - İstekte bulunan ajana normal asistan sesiyle yeniden yazmasını söyleyen bir teslim talimatı (ham dahili meta verileri iletmemesi için).

  </Accordion>
  <Accordion title="Modlar ve ACP çalışma zamanı">
    - `--model` ve `--thinking`, bu belirli çalıştırma için varsayılanları geçersiz kılar.
    - Tamamlandıktan sonra ayrıntıları ve çıktıyı incelemek için `info`/`log` kullanın.
    - `/subagents spawn` tek seferlik moddur (`mode: "run"`). Kalıcı konuya bağlı oturumlar için `thread: true` ve `mode: "session"` ile `sessions_spawn` kullanın.
    - ACP harness oturumları (Claude Code, Gemini CLI, OpenCode veya açıkça Codex ACP/acpx) için, araç bu çalışma zamanını ilan ettiğinde `runtime: "acp"` ile `sessions_spawn` kullanın. Tamamlamalarda veya ajanlar arası döngülerde hata ayıklarken [ACP teslim modeli](/tr/tools/acp-agents#delivery-model) bölümüne bakın. `codex` Plugin etkinleştirildiğinde, kullanıcı açıkça ACP/acpx istemedikçe Codex sohbet/konu denetimi ACP yerine `/codex ...` tercih etmelidir.
    - OpenClaw, ACP etkinleşene, istekte bulunan sandbox içinde olmayana ve `acpx` gibi bir arka uç Plugin yüklenene kadar `runtime: "acp"` değerini gizler. `runtime: "acp"` harici bir ACP harness kimliği veya `runtime.type="acp"` olan bir `agents.list[]` girdisi bekler; `agents_list` içinden normal OpenClaw yapılandırma ajanları için varsayılan alt ajan çalışma zamanını kullanın.

  </Accordion>
</AccordionGroup>

## Bağlam modları

Yerel alt ajanlar, çağıran açıkça geçerli transkripti fork etmeyi istemedikçe yalıtılmış başlar.

| Mod        | Ne zaman kullanılır                                                                                                                    | Davranış                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `isolated` | Yeni araştırma, bağımsız uygulama, yavaş araç işi veya görev metninde özetlenebilecek herhangi bir şey                                 | Temiz bir alt transkript oluşturur. Bu varsayılandır ve token kullanımını düşük tutar. |
| `fork`     | Geçerli konuşmaya, önceki araç sonuçlarına veya istekte bulunan transkriptinde zaten bulunan incelikli talimatlara bağlı işler         | Alt ajan başlamadan önce istekte bulunan transkriptini alt oturuma dallandırır. |

`fork` değerini ölçülü kullanın. Bağlama duyarlı delege etme içindir, net bir görev istemi yazmanın yerine geçmez.

## Araç: `sessions_spawn`

Global `subagent` hattında `deliver: false` ile bir alt ajan çalıştırması başlatır,
ardından bir duyuru adımı çalıştırır ve duyuru yanıtını istekte bulunan sohbet kanalına gönderir.

Kullanılabilirlik, çağıranın etkin araç politikasına bağlıdır. `coding` ve
`full` profilleri varsayılan olarak `sessions_spawn` sunar. `messaging` profili
sunmaz; iş delege etmesi gereken ajanlar için `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` ekleyin veya `tools.profile: "coding"` kullanın. Kanal/grup, sağlayıcı, sandbox ve ajan başına izin/verme politikaları, profil aşamasından sonra aracı yine kaldırabilir. Etkin araç listesini doğrulamak için aynı oturumdan `/tools` kullanın.

**Varsayılanlar:**

- **Model:** `agents.defaults.subagents.model` (veya ajan başına `agents.list[].subagents.model`) ayarlamadığınız sürece çağırandan devralır; açık bir `sessions_spawn.model` yine önceliklidir.
- **Thinking:** `agents.defaults.subagents.thinking` (veya ajan başına `agents.list[].subagents.thinking`) ayarlamadığınız sürece çağırandan devralır; açık bir `sessions_spawn.thinking` yine önceliklidir.
- **Çalıştırma zaman aşımı:** `sessions_spawn.runTimeoutSeconds` atlanırsa OpenClaw, ayarlı olduğunda `agents.defaults.subagents.runTimeoutSeconds` kullanır; aksi halde `0` değerine geri döner (zaman aşımı yok).

### Araç parametreleri

<ParamField path="task" type="string" required>
  Alt ajan için görev açıklaması.
</ParamField>
<ParamField path="label" type="string">
  İsteğe bağlı insan tarafından okunabilir etiket.
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents` tarafından izin verildiğinde başka bir ajan kimliği altında başlatın.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` yalnızca harici ACP harness'leri (`claude`, `droid`, `gemini`, `opencode` veya açıkça istenen Codex ACP/acpx) ve `runtime.type` değeri `acp` olan `agents.list[]` girdileri içindir.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Yalnızca ACP. `runtime: "acp"` olduğunda mevcut bir ACP harness oturumunu sürdürür; yerel alt ajan başlatmaları için yok sayılır.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Yalnızca ACP. `runtime: "acp"` olduğunda ACP çalıştırma çıktısını üst oturuma aktarır; yerel alt ajan başlatmaları için atlayın.
</ParamField>
<ParamField path="model" type="string">
  Alt ajan modelini geçersiz kılın. Geçersiz değerler atlanır ve alt ajan, araç sonucunda bir uyarıyla varsayılan modelde çalışır.
</ParamField>
<ParamField path="thinking" type="string">
  Alt ajan çalıştırması için thinking düzeyini geçersiz kılın.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Ayarlandığında varsayılan olarak `agents.defaults.subagents.runTimeoutSeconds`; aksi halde `0`. Ayarlandığında alt ajan çalıştırması N saniye sonra iptal edilir.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` olduğunda bu alt ajan oturumu için kanal konu bağlaması ister.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` ve `mode` atlanmışsa varsayılan `session` olur. `mode: "session"` için `thread: true` gerekir.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` duyurudan hemen sonra arşivler (transkripti yeniden adlandırma yoluyla yine korur).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require`, hedef alt çalışma zamanı sandbox içinde değilse başlatmayı reddeder.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork`, istekte bulunanın geçerli transkriptini alt oturuma dallandırır. Yalnızca yerel alt ajanlar. Konuya bağlı başlatmalar varsayılan olarak `fork`; konu dışı başlatmalar varsayılan olarak `isolated` kullanır.
</ParamField>

<Warning>
`sessions_spawn`, kanal teslim parametrelerini (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`) kabul **etmez**. Teslim için başlatılan çalıştırmadan `message`/`sessions_send` kullanın.
</Warning>

## Konuya bağlı oturumlar

Bir kanal için konu bağlamaları etkinleştirildiğinde, bir alt ajan bir konuya bağlı kalabilir; böylece bu konudaki takip kullanıcı mesajları aynı alt ajan oturumuna yönlendirilmeye devam eder.

### Konu destekleyen kanallar

**Discord** şu anda desteklenen tek kanaldır. Kalıcı konuya bağlı alt ajan oturumlarını (`thread: true` ile `sessions_spawn`), elle konu kontrollerini (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) ve adapter anahtarlarını destekler:
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` ve
`channels.discord.threadBindings.spawnSessions`.

### Hızlı akış

<Steps>
  <Step title="Başlat">
    `thread: true` (ve isteğe bağlı olarak `mode: "session"`) ile `sessions_spawn`.
  </Step>
  <Step title="Bağla">
    OpenClaw, etkin kanalda bu oturum hedefine bir iş parçacığı oluşturur veya bağlar.
  </Step>
  <Step title="Takipleri yönlendir">
    Bu iş parçacığındaki yanıtlar ve takip mesajları bağlı oturuma yönlendirilir.
  </Step>
  <Step title="Zaman aşımlarını incele">
    Etkinlik dışı kalındığında otomatik odaktan çıkarmayı incelemek/güncellemek için `/session idle` ve
    sabit üst sınırı denetlemek için `/session max-age` kullanın.
  </Step>
  <Step title="Ayır">
    El ile ayırmak için `/unfocus` kullanın.
  </Step>
</Steps>

### El ile denetimler

| Komut              | Etki                                                                            |
| ------------------ | -------------------------------------------------------------------------------- |
| `/focus <target>`  | Geçerli iş parçacığını (veya yeni bir tane oluşturup) bir alt aracı/oturum hedefine bağlar |
| `/unfocus`         | Geçerli bağlı iş parçacığının bağını kaldırır                                   |
| `/agents`          | Etkin çalıştırmaları ve bağ durumunu listeler (`thread:<id>` veya `unbound`)    |
| `/session idle`    | Boşta otomatik odaktan çıkarmayı incele/güncelle (yalnızca odaklanmış bağlı iş parçacıkları) |
| `/session max-age` | Sabit üst sınırı incele/güncelle (yalnızca odaklanmış bağlı iş parçacıkları)    |

### Yapılandırma anahtarları

- **Genel varsayılan:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanal geçersiz kılma ve başlatmada otomatik bağlama anahtarları** bağdaştırıcıya özeldir. Yukarıdaki [İş parçacığını destekleyen kanallar](#thread-supporting-channels) bölümüne bakın.

Geçerli bağdaştırıcı ayrıntıları için [Yapılandırma başvurusu](/tr/gateway/configuration-reference) ve
[Eğik çizgi komutları](/tr/tools/slash-commands) bölümlerine bakın.

### İzin listesi

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Açık `agentId` üzerinden hedeflenebilecek aracı kimliklerinin listesi (`["*"]` herhangi birine izin verir). Varsayılan: yalnızca istekte bulunan aracı. Bir liste ayarlar ve yine de istekte bulunanın `agentId` ile kendisini başlatmasını istiyorsanız, istekte bulunanın kimliğini listeye ekleyin.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  İstekte bulunan aracı kendi `subagents.allowAgents` değerini ayarlamadığında kullanılan varsayılan hedef aracı izin listesi.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` değerini atlayan `sessions_spawn` çağrılarını engeller (açık profil seçimini zorunlu kılar). Aracı başına geçersiz kılma: `agents.list[].subagents.requireAgentId`.
</ParamField>

İstekte bulunan oturum korumalı alandaysa, `sessions_spawn` korumasız
çalışacak hedefleri reddeder.

### Keşif

Şu anda `sessions_spawn` için hangi aracı kimliklerine izin verildiğini görmek üzere
`agents_list` kullanın. Yanıt, çağıranların PI, Codex
uygulama sunucusu ve yapılandırılmış diğer yerel çalışma zamanlarını ayırt edebilmesi için listelenen her aracının etkin
modelini ve gömülü çalışma zamanı meta verilerini içerir.

### Otomatik arşivleme

- Alt aracı oturumları `agents.defaults.subagents.archiveAfterMinutes` sonrasında otomatik olarak arşivlenir (varsayılan `60`).
- Arşiv, `sessions.delete` kullanır ve transkripti `*.deleted.<timestamp>` olarak yeniden adlandırır (aynı klasör).
- `cleanup: "delete"` duyurudan hemen sonra arşivler (transkripti yine de yeniden adlandırarak tutar).
- Otomatik arşivleme en iyi çaba esasına dayanır; Gateway yeniden başlatılırsa bekleyen zamanlayıcılar kaybolur.
- `runTimeoutSeconds` otomatik arşivleme yapmaz; yalnızca çalıştırmayı durdurur. Oturum otomatik arşivlemeye kadar kalır.
- Otomatik arşivleme, derinlik 1 ve derinlik 2 oturumlarına eşit şekilde uygulanır.
- Tarayıcı temizliği arşiv temizliğinden ayrıdır: izlenen tarayıcı sekmeleri/süreçleri, transkript/oturum kaydı tutulsa bile çalıştırma bittiğinde en iyi çaba ile kapatılır.

## İç içe alt aracılar

Varsayılan olarak alt aracılar kendi alt aracılarını başlatamaz
(`maxSpawnDepth: 1`). Bir düzey iç içe yerleşimi etkinleştirmek için `maxSpawnDepth: 2` ayarlayın:
**orkestratör deseni**: ana → orkestratör alt aracı →
çalışan alt-alt aracılar.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // alt aracıların çocuk başlatmasına izin ver (varsayılan: 1)
        maxChildrenPerAgent: 5, // aracı oturumu başına en fazla etkin çocuk (varsayılan: 5)
        maxConcurrent: 8, // genel eşzamanlılık şeridi üst sınırı (varsayılan: 8)
        runTimeoutSeconds: 900, // atlandığında sessions_spawn için varsayılan zaman aşımı (0 = zaman aşımı yok)
      },
    },
  },
}
```

### Derinlik düzeyleri

| Derinlik | Oturum anahtarı biçimi                       | Rol                                           | Başlatabilir mi?             |
| -------- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0        | `agent:<id>:main`                            | Ana aracı                                     | Her zaman                    |
| 1        | `agent:<id>:subagent:<uuid>`                 | Alt aracı (derinlik 2 izinliyse orkestratör)  | Yalnızca `maxSpawnDepth >= 2` ise |
| 2        | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Alt-alt aracı (yaprak çalışan)                | Asla                         |

### Duyuru zinciri

Sonuçlar zincir boyunca yukarı akar:

1. Derinlik 2 çalışanı biter → üstüne duyurur (derinlik 1 orkestratör).
2. Derinlik 1 orkestratör duyuruyu alır, sonuçları sentezler, biter → ana aracıya duyurur.
3. Ana aracı duyuruyu alır ve kullanıcıya iletir.

Her düzey yalnızca doğrudan çocuklarından gelen duyuruları görür.

<Note>
**Operasyonel kılavuz:** `sessions_list`,
`sessions_history`, `/subagents list` veya `exec` uyku komutları etrafında yoklama döngüleri oluşturmak yerine çocuk işi bir kez başlatın ve tamamlanma
olaylarını bekleyin.
`sessions_list` ve `/subagents list`, çocuk oturumu ilişkilerini
canlı işe odaklı tutar: canlı çocuklar bağlı kalır, bitmiş çocuklar kısa bir yakın zaman penceresinde
görünür kalır ve yalnızca depoda kalan eski çocuk bağlantıları
tazelik pencerelerinden sonra yok sayılır. Bu, eski `spawnedBy` /
`parentSessionKey` meta verilerinin yeniden başlatmadan sonra hayalet çocukları yeniden ortaya çıkarmasını
önler. Bir çocuk tamamlanma olayı siz son yanıtı zaten gönderdikten sonra gelirse,
doğru takip tam sessiz belirteçtir:
`NO_REPLY` / `no_reply`.
</Note>

### Derinliğe göre araç ilkesi

- Rol ve denetim kapsamı başlatma sırasında oturum meta verilerine yazılır. Bu, düz veya geri yüklenmiş oturum anahtarlarının yanlışlıkla orkestratör ayrıcalıklarını yeniden kazanmasını önler.
- **Derinlik 1 (orkestratör, `maxSpawnDepth >= 2` olduğunda):** çocuklarını yönetebilmesi için `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` alır. Diğer oturum/sistem araçları reddedilmiş kalır.
- **Derinlik 1 (yaprak, `maxSpawnDepth == 1` olduğunda):** oturum aracı yoktur (geçerli varsayılan davranış).
- **Derinlik 2 (yaprak çalışan):** oturum aracı yoktur; `sessions_spawn` derinlik 2'de her zaman reddedilir. Daha fazla çocuk başlatamaz.

### Aracı başına başlatma sınırı

Her aracı oturumunun (herhangi bir derinlikte) aynı anda en fazla `maxChildrenPerAgent`
(varsayılan `5`) etkin çocuğu olabilir. Bu, tek bir orkestratörden
denetimsiz yayılmayı önler.

### Zincirleme durdurma

Derinlik 1 orkestratörünü durdurmak tüm derinlik 2
çocuklarını otomatik olarak durdurur:

- Ana sohbette `/stop`, tüm derinlik 1 aracılarını durdurur ve onların derinlik 2 çocuklarına zincirleme uygular.
- `/subagents kill <id>` belirli bir alt aracı durdurur ve çocuklarına zincirleme uygular.
- `/subagents kill all` istekte bulunan için tüm alt aracıları durdurur ve zincirleme uygular.

## Kimlik doğrulama

Alt aracı kimlik doğrulaması oturum türüne göre değil, **aracı kimliğine** göre çözümlenir:

- Alt aracı oturum anahtarı `agent:<agentId>:subagent:<uuid>` biçimindedir.
- Kimlik doğrulama deposu bu aracının `agentDir` dizininden yüklenir.
- Ana aracının kimlik doğrulama profilleri **yedek** olarak birleştirilir; çakışmalarda aracı profilleri ana profilleri geçersiz kılar.

Birleştirme eklemelidir, bu nedenle ana profiller her zaman yedek olarak
kullanılabilir. Aracı başına tamamen yalıtılmış kimlik doğrulama henüz desteklenmiyor.

## Duyuru

Alt aracılar bir duyuru adımıyla geri bildirim yapar:

- Duyuru adımı alt aracı oturumu içinde çalışır (istekte bulunan oturumunda değil).
- Alt aracı tam olarak `ANNOUNCE_SKIP` yanıtını verirse hiçbir şey gönderilmez.
- En son asistan metni tam sessiz belirteç olan `NO_REPLY` / `no_reply` ise, daha önce görünür ilerleme olsa bile duyuru çıktısı bastırılır.

Teslimat, istekte bulunan derinliğine bağlıdır:

- Üst düzey istekte bulunan oturumlar, harici teslimat (`deliver=true`) ile takip `agent` çağrısı kullanır.
- İç içe istekte bulunan alt aracı oturumları, orkestratörün çocuk sonuçlarını oturum içinde sentezleyebilmesi için dahili takip enjeksiyonu (`deliver=false`) alır.
- İç içe istekte bulunan alt aracı oturumu yoksa, OpenClaw mümkün olduğunda o oturumun istekte bulunanına geri döner.

Üst düzey istekte bulunan oturumlar için, tamamlama modu doğrudan teslimat önce
bağlı konuşma/iş parçacığı yolunu ve hook geçersiz kılmasını çözer, ardından
eksik kanal hedef alanlarını istekte bulunan oturumun depolanmış yolundan doldurur.
Bu, tamamlama kaynağı yalnızca kanalı tanımladığında bile tamamlamaları doğru sohbet/konu üzerinde tutar.

Çocuk tamamlama birleştirmesi, iç içe tamamlama bulguları oluşturulurken
geçerli istekte bulunan çalıştırmasına kapsamlanır; bu, önceki çalıştırmalardan kalan eski çocuk
çıktılarının geçerli duyuruya sızmasını önler. Duyuru yanıtları, kanal bağdaştırıcılarında mevcut olduğunda
iş parçacığı/konu yönlendirmesini korur.

### Duyuru bağlamı

Duyuru bağlamı kararlı bir dahili olay bloğuna normalleştirilir:

| Alan           | Kaynak                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Kaynak         | `subagent` veya `cron`                                                                                        |
| Oturum kimlikleri | Çocuk oturum anahtarı/kimliği                                                                             |
| Tür            | Duyuru türü + görev etiketi                                                                                   |
| Durum          | Çalışma zamanı sonucundan türetilir (`success`, `error`, `timeout` veya `unknown`); model metninden **çıkarılmaz** |
| Sonuç içeriği  | En son görünür asistan metni, aksi halde temizlenmiş en son araç/toolResult metni                             |
| Takip          | Ne zaman yanıt verileceğini ve ne zaman sessiz kalınacağını açıklayan talimat                                  |

Terminalde başarısız olan çalıştırmalar, yakalanmış yanıt metnini yeniden oynatmadan
başarısızlık durumunu bildirir. Zaman aşımında, çocuk yalnızca araç çağrılarına kadar ilerlediyse, duyuru
ham araç çıktısını yeniden oynatmak yerine bu geçmişi kısa bir kısmi ilerleme özetine
indirger.

### İstatistik satırı

Duyuru yükleri sonunda (sarmalanmış olsa bile) bir istatistik satırı içerir:

- Çalışma zamanı (örn. `runtime 5m12s`).
- Belirteç kullanımı (girdi/çıktı/toplam).
- Model fiyatlandırması yapılandırıldığında tahmini maliyet (`models.providers.*.models[].cost`).
- Ana aracının `sessions_history` üzerinden geçmişi getirebilmesi veya diskteki dosyayı inceleyebilmesi için `sessionKey`, `sessionId` ve transkript yolu.

Dahili meta veriler yalnızca orkestrasyon içindir; kullanıcıya dönük yanıtlar
normal asistan sesiyle yeniden yazılmalıdır.

### Neden `sessions_history` tercih edilmeli

`sessions_history` daha güvenli orkestrasyon yoludur:

- Asistan hatırlaması önce normalleştirilir: düşünme etiketleri çıkarılır; `<relevant-memories>` / `<relevant_memories>` iskeleti çıkarılır; düz metin araç çağrısı XML yük blokları (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) çıkarılır; buna temiz kapanmayan kesilmiş yükler de dahildir; düzeyi düşürülmüş araç çağrısı/sonuç iskeleti ve geçmiş bağlam işaretçileri çıkarılır; sızmış model denetim belirteçleri (`<|assistant|>`, diğer ASCII `<|...|>`, tam genişlik `<｜...｜>`) çıkarılır; hatalı biçimli MiniMax araç çağrısı XML'i çıkarılır.
- Kimlik bilgisi/belirteç benzeri metinler redakte edilir.
- Uzun bloklar kesilebilir.
- Çok büyük geçmişler eski satırları bırakabilir veya aşırı büyük bir satırı `[sessions_history omitted: message too large]` ile değiştirebilir.
- Tam bayt bayt transkripte ihtiyaç duyduğunuzda ham disk üstü transkript incelemesi yedektir.

## Araç ilkesi

Alt ajanlar önce üst veya hedef ajanla aynı profil ve araç ilkesi işlem hattını kullanır.
Bundan sonra OpenClaw, alt ajan kısıtlama katmanını uygular.

Kısıtlayıcı bir `tools.profile` olmadığında alt ajanlar, **oturum araçları
ve sistem araçları hariç tüm araçları** alır:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` burada da sınırlı, temizlenmiş bir hatırlama görünümü olarak kalır; ham transkript dökümü değildir.

`maxSpawnDepth >= 2` olduğunda, derinlik-1 düzenleyici alt ajanlar ayrıca
`sessions_spawn`, `subagents`, `sessions_list` ve
`sessions_history` alır; böylece kendi alt öğelerini yönetebilirler.

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

`tools.subagents.tools.allow` son bir yalnızca-izin filtresidir. Zaten çözümlenmiş araç kümesini daraltabilir, ancak `tools.profile` tarafından kaldırılmış bir aracı **geri ekleyemez**. Örneğin, `tools.profile: "coding"` `web_search`/`web_fetch` içerir, ancak `browser` aracını içermez. Kodlama profilli alt ajanların tarayıcı otomasyonu kullanmasına izin vermek için tarayıcıyı profil aşamasında ekleyin:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Yalnızca bir ajanın tarayıcı otomasyonu alması gerekiyorsa ajan başına `agents.list[].tools.alsoAllow: ["browser"]` kullanın.

## Eşzamanlılık

Alt ajanlar, işleme özel ayrılmış bir kuyruk hattı kullanır:

- **Hat adı:** `subagent`
- **Eşzamanlılık:** `agents.defaults.subagents.maxConcurrent` (varsayılan `8`)

## Canlılık ve kurtarma

OpenClaw, `endedAt` değerinin olmamasını bir alt ajanın hâlâ çalıştığına dair kalıcı kanıt olarak görmez. Eski çalıştırma penceresinden daha eski, sonlandırılmamış çalıştırmalar `/subagents list`, durum özetleri, alt öğe tamamlama kapıları ve oturum başına eşzamanlılık denetimlerinde aktif/bekliyor olarak sayılmayı bırakır.

Gateway yeniden başlatıldıktan sonra, alt oturumları `abortedLastRun: true` olarak işaretlenmemiş olan eski sonlandırılmamış geri yüklenmiş çalıştırmalar temizlenir. Yeniden başlatmayla iptal edilmiş bu alt oturumlar, iptal işaretini temizlemeden önce sentetik bir sürdürme mesajı gönderen alt ajan yetim kurtarma akışı üzerinden kurtarılabilir durumda kalır.

Otomatik yeniden başlatma kurtarması alt oturum başına sınırlıdır. Aynı alt ajan alt öğesi hızlı yeniden takılma penceresi içinde tekrar tekrar yetim kurtarma için kabul edilirse, OpenClaw bu oturumda bir kurtarma mezar taşı kalıcı hale getirir ve sonraki yeniden başlatmalarda onu otomatik sürdürmeyi durdurur. Görev kaydını uzlaştırmak için `openclaw tasks maintenance --apply` çalıştırın veya mezar taşlı oturumlardaki eski iptal edilmiş kurtarma bayraklarını temizlemek için `openclaw doctor --fix` çalıştırın.

<Note>
Bir alt ajan oluşturma işlemi Gateway `PAIRING_REQUIRED` /
`scope-upgrade` ile başarısız olursa, eşleştirme durumunu düzenlemeden önce RPC çağıranını kontrol edin. Dahili `sessions_spawn` koordinasyonu, doğrudan
local loopback paylaşımlı belirteç/parola kimlik doğrulaması üzerinden
`client.id: "gateway-client"` ve `client.mode: "backend"` olarak bağlanmalıdır; bu yol CLI'ın eşleştirilmiş cihaz kapsamı taban çizgisine bağlı değildir. Uzak çağıranlar, açık `deviceIdentity`, açık cihaz belirteci yolları ve tarayıcı/Node istemcileri kapsam yükseltmeleri için hâlâ normal cihaz onayına ihtiyaç duyar.
</Note>

## Durdurma

- İsteyen sohbetinde `/stop` göndermek, isteyen oturumunu iptal eder ve buradan oluşturulan etkin alt ajan çalıştırmalarını durdurur; bu işlem iç içe alt öğelere de yayılır.
- `/subagents kill <id>` belirli bir alt ajanı durdurur ve alt öğelerine yayılır.

## Sınırlamalar

- Alt ajan duyurusu **en iyi çaba** esasına göredir. Gateway yeniden başlatılırsa, bekleyen "geri duyur" işi kaybolur.
- Alt ajanlar hâlâ aynı Gateway işlem kaynaklarını paylaşır; `maxConcurrent` değerini bir güvenlik vanası olarak değerlendirin.
- `sessions_spawn` her zaman engellemesizdir: hemen `{ status: "accepted", runId, childSessionKey }` döndürür.
- Alt ajan bağlamı yalnızca `AGENTS.md` + `TOOLS.md` enjekte eder (`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` veya `BOOTSTRAP.md` yoktur).
- En yüksek iç içe geçme derinliği 5'tir (`maxSpawnDepth` aralığı: 1–5). Çoğu kullanım durumu için derinlik 2 önerilir.
- `maxChildrenPerAgent`, oturum başına etkin alt öğeleri sınırlar (varsayılan `5`, aralık `1–20`).

## İlgili

- [ACP ajanları](/tr/tools/acp-agents)
- [Ajan gönderme](/tr/tools/agent-send)
- [Arka plan görevleri](/tr/automation/tasks)
- [Çok ajanlı kum havuzu araçları](/tr/tools/multi-agent-sandbox-tools)
