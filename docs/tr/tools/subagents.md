---
read_when:
    - Aracı üzerinden arka planda veya paralel çalışma istiyorsunuz
    - sessions_spawn veya alt ajan araç politikasını değiştiriyorsunuz
    - İleti dizisine bağlı alt ajan oturumlarını uyguluyor veya sorunlarını gideriyorsunuz
sidebarTitle: Sub-agents
summary: Sonuçları istekte bulunan sohbete geri bildiren yalıtılmış arka plan aracı çalıştırmaları başlatın
title: Alt ajanlar
x-i18n:
    generated_at: "2026-05-02T09:09:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e964df543bd19435daf94f2c85a34b9d32e07662405d2eac7635935f1e7bf64
    source_path: tools/subagents.md
    workflow: 16
---

Alt ajanlar, mevcut bir ajan çalıştırmasından başlatılan arka plan ajan çalıştırmalarıdır.
Kendi oturumlarında (`agent:<agentId>:subagent:<uuid>`) çalışırlar ve
tamamlandıklarında sonuçlarını istekte bulunan sohbet kanalına **duyururlar**.
Her alt ajan çalıştırması bir
[arka plan görevi](/tr/automation/tasks) olarak izlenir.

Birincil hedefler:

- Ana çalıştırmayı engellemeden "araştırma / uzun görev / yavaş araç" işlerini paralelleştirmek.
- Alt ajanları varsayılan olarak yalıtılmış tutmak (oturum ayrımı + isteğe bağlı sandboxing).
- Araç yüzeyinin kötüye kullanımını zorlaştırmak: alt ajanlar varsayılan olarak oturum araçlarını almaz.
- Düzenleyici desenleri için yapılandırılabilir iç içe geçme derinliğini desteklemek.

<Note>
**Maliyet notu:** her alt ajanın varsayılan olarak kendi bağlamı ve token kullanımı vardır. Ağır veya tekrarlı görevler için alt ajanlara daha ucuz bir model ayarlayın ve ana ajanınızı daha yüksek kaliteli bir modelde tutun. `agents.defaults.subagents.model` veya ajan başına geçersiz kılmalar üzerinden yapılandırın. Bir alt öğe gerçekten istekte bulunanın mevcut transkriptine ihtiyaç duyduğunda, ajan o başlatma için `context: "fork"` isteyebilir. İş parçacığına bağlı alt ajan oturumları varsayılan olarak `context: "fork"` kullanır çünkü mevcut konuşmayı bir takip iş parçacığına dallandırırlar.
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

`/subagents info`, çalıştırma üst verilerini (durum, zaman damgaları, oturum id'si, transkript yolu, temizlik) gösterir. Sınırlı, güvenlik filtresinden geçirilmiş bir hatırlama görünümü için `sessions_history` kullanın; ham tam transkripte ihtiyaç duyduğunuzda diskteki transkript yolunu inceleyin.

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

`/subagents spawn`, bir arka plan alt ajanını kullanıcı komutu olarak başlatır (dahili relay olarak değil) ve çalıştırma bittiğinde istekte bulunan sohbete son bir tamamlanma güncellemesi gönderir.

<AccordionGroup>
  <Accordion title="Engellemeyen, push tabanlı tamamlanma">
    - Başlatma komutu engellemez; hemen bir çalıştırma id'si döndürür.
    - Tamamlandığında alt ajan, istekte bulunan sohbet kanalına bir özet/sonuç mesajı duyurur.
    - Tamamlanma push tabanlıdır. Başlatıldıktan sonra yalnızca bitmesini beklemek için `/subagents list`, `sessions_list` veya `sessions_history` komutlarını döngü içinde yoklamayın; durumu yalnızca hata ayıklama veya müdahale için talep üzerine inceleyin.
    - Tamamlandığında OpenClaw, duyuru temizlik akışı sürmeden önce bu alt ajan oturumu tarafından açılan izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır.

  </Accordion>
  <Accordion title="Manuel başlatma teslim dayanıklılığı">
    - OpenClaw önce kararlı bir idempotency anahtarıyla doğrudan `agent` teslimini dener.
    - Doğrudan teslim başarısız olursa kuyruk yönlendirmesine geri döner.
    - Kuyruk yönlendirmesi de hâlâ kullanılabilir değilse duyuru, son vazgeçmeden önce kısa üstel geri çekilmeyle yeniden denenir.
    - Tamamlanma teslimi çözümlenmiş istekte bulunan rotasını korur: kullanılabilir olduğunda iş parçacığına bağlı veya konuşmaya bağlı tamamlanma rotaları kazanır; tamamlanma kaynağı yalnızca bir kanal sağlıyorsa OpenClaw, eksik hedefi/hesabı istekte bulunan oturumun çözümlenmiş rotasından (`lastChannel` / `lastTo` / `lastAccountId`) doldurur, böylece doğrudan teslim hâlâ çalışır.

  </Accordion>
  <Accordion title="Tamamlanma devir üst verileri">
    İstekte bulunan oturuma yapılan tamamlanma devri, çalışma zamanında oluşturulan dahili bağlamdır (kullanıcı tarafından yazılmış metin değildir) ve şunları içerir:

    - `Result` — en son görünür `assistant` yanıt metni, aksi halde temizlenmiş en son araç/toolResult metni. Terminal başarısız çalıştırmalar yakalanmış yanıt metnini yeniden kullanmaz.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompakt çalışma zamanı/token istatistikleri.
    - İstekte bulunan ajana normal asistan sesiyle yeniden yazmasını söyleyen bir teslim talimatı (ham dahili üst veriyi iletmez).

  </Accordion>
  <Accordion title="Modlar ve ACP çalışma zamanı">
    - `--model` ve `--thinking`, bu belirli çalıştırma için varsayılanları geçersiz kılar.
    - Tamamlanma sonrasında ayrıntıları ve çıktıyı incelemek için `info`/`log` kullanın.
    - `/subagents spawn` tek seferlik moddur (`mode: "run"`). Kalıcı iş parçacığına bağlı oturumlar için `thread: true` ve `mode: "session"` ile `sessions_spawn` kullanın.
    - ACP harness oturumları (Claude Code, Gemini CLI, OpenCode veya açık Codex ACP/acpx) için, araç bu çalışma zamanını duyurduğunda `runtime: "acp"` ile `sessions_spawn` kullanın. Tamamlanmaları veya ajanlar arası döngüleri hata ayıklarken [ACP teslim modeli](/tr/tools/acp-agents#delivery-model) bölümüne bakın. `codex` Plugin etkin olduğunda, Codex sohbet/iş parçacığı denetimi kullanıcı açıkça ACP/acpx istemedikçe ACP yerine `/codex ...` tercih etmelidir.
    - OpenClaw, ACP etkinleştirilene, istekte bulunan sandboxed olmayana ve `acpx` gibi bir arka uç Plugin yüklenene kadar `runtime: "acp"` değerini gizler. `runtime: "acp"`, harici bir ACP harness id'si veya `runtime.type="acp"` olan bir `agents.list[]` girdisi bekler; `agents_list` içindeki normal OpenClaw yapılandırma ajanları için varsayılan alt ajan çalışma zamanını kullanın.

  </Accordion>
</AccordionGroup>

## Bağlam modları

Yerel alt ajanlar, çağıran açıkça mevcut transkripti fork etmeyi istemediği sürece yalıtılmış başlar.

| Mod        | Ne zaman kullanılır                                                                                                                    | Davranış                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Yeni araştırma, bağımsız uygulama, yavaş araç işi veya görev metninde özetlenebilecek herhangi bir şey                                 | Temiz bir alt transkript oluşturur. Varsayılan budur ve token kullanımını düşük tutar. |
| `fork`     | Mevcut konuşmaya, önceki araç sonuçlarına veya istekte bulunan transkriptinde zaten bulunan nüanslı talimatlara bağlı iş               | Alt öğe başlamadan önce istekte bulunan transkriptini alt oturuma dallandırır.     |

`fork` seçeneğini tutumlu kullanın. Bu, bağlama duyarlı devretme içindir; açık bir görev istemi yazmanın yerine geçmez.

## Araç: `sessions_spawn`

Genel `subagent` şeridinde `deliver: false` ile bir alt ajan çalıştırması başlatır, ardından bir duyuru adımı çalıştırır ve duyuru yanıtını istekte bulunan sohbet kanalına gönderir.

Kullanılabilirlik, çağıranın etkili araç politikasına bağlıdır. `coding` ve `full` profilleri varsayılan olarak `sessions_spawn` sunar. `messaging` profili sunmaz; işi devretmesi gereken ajanlar için `tools.alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"]` ekleyin veya `tools.profile: "coding"` kullanın. Kanal/grup, sağlayıcı, sandbox ve ajan başına izin ver/reddet politikaları profilden sonra aracı yine kaldırabilir. Etkili araç listesini doğrulamak için aynı oturumdan `/tools` kullanın.

**Varsayılanlar:**

- **Model:** `agents.defaults.subagents.model` (veya ajan başına `agents.list[].subagents.model`) ayarlamadığınız sürece çağırandan devralır; açık bir `sessions_spawn.model` yine kazanır.
- **Thinking:** `agents.defaults.subagents.thinking` (veya ajan başına `agents.list[].subagents.thinking`) ayarlamadığınız sürece çağırandan devralır; açık bir `sessions_spawn.thinking` yine kazanır.
- **Çalıştırma zaman aşımı:** `sessions_spawn.runTimeoutSeconds` atlanırsa OpenClaw, ayarlı olduğunda `agents.defaults.subagents.runTimeoutSeconds` kullanır; aksi halde `0` değerine (zaman aşımı yok) geri döner.

### Araç parametreleri

<ParamField path="task" type="string" required>
  Alt ajan için görev açıklaması.
</ParamField>
<ParamField path="label" type="string">
  İsteğe bağlı, insan tarafından okunabilir etiket.
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents` tarafından izin verildiğinde başka bir ajan id'si altında başlatın.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` yalnızca harici ACP harness'leri (`claude`, `droid`, `gemini`, `opencode` veya açıkça istenen Codex ACP/acpx) ve `runtime.type` değeri `acp` olan `agents.list[]` girdileri içindir.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Yalnızca ACP. `runtime: "acp"` olduğunda mevcut bir ACP harness oturumunu sürdürür; yerel alt ajan başlatmaları için yok sayılır.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Yalnızca ACP. `runtime: "acp"` olduğunda ACP çalıştırma çıktısını üst oturuma yayınlar; yerel alt ajan başlatmaları için atlayın.
</ParamField>
<ParamField path="model" type="string">
  Alt ajan modelini geçersiz kılar. Geçersiz değerler atlanır ve alt ajan, araç sonucunda bir uyarıyla varsayılan modelde çalışır.
</ParamField>
<ParamField path="thinking" type="string">
  Alt ajan çalıştırması için thinking düzeyini geçersiz kılar.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Ayarlı olduğunda varsayılan olarak `agents.defaults.subagents.runTimeoutSeconds`, aksi halde `0` değerini alır. Ayarlandığında alt ajan çalıştırması N saniye sonra durdurulur.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` olduğunda bu alt ajan oturumu için kanal iş parçacığı bağlaması ister.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` ve `mode` atlanmışsa varsayılan `session` olur. `mode: "session"` için `thread: true` gerekir.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` duyurudan hemen sonra arşivler (transkripti yeniden adlandırma yoluyla yine saklar).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require`, hedef alt çalışma zamanı sandboxed değilse başlatmayı reddeder.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork`, istekte bulunanın mevcut transkriptini alt oturuma dallandırır. Yalnızca yerel alt ajanlar. İş parçacığına bağlı başlatmalar varsayılan olarak `fork`; iş parçacığına bağlı olmayan başlatmalar varsayılan olarak `isolated` kullanır.
</ParamField>

<Warning>
`sessions_spawn`, kanal teslim parametrelerini (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`) kabul etmez. Teslim için başlatılmış çalıştırmadan `message`/`sessions_send` kullanın.
</Warning>

## İş parçacığına bağlı oturumlar

Bir kanal için iş parçacığı bağlamaları etkinleştirildiğinde, bir alt ajan bir iş parçacığına bağlı kalabilir; böylece o iş parçacığındaki takip kullanıcı mesajları aynı alt ajan oturumuna yönlendirilmeyi sürdürür.

### İş parçacığını destekleyen kanallar

**Discord** şu anda desteklenen tek kanaldır. Kalıcı iş parçacığına bağlı alt ajan oturumlarını (`thread: true` ile `sessions_spawn`), manuel iş parçacığı denetimlerini (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ve adapter anahtarlarını `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` ve `channels.discord.threadBindings.spawnSessions` destekler.

### Hızlı akış

<Steps>
  <Step title="Başlat">
    `thread: true` ile (ve isteğe bağlı olarak `mode: "session"` ile) `sessions_spawn`.
  </Step>
  <Step title="Bağla">
    OpenClaw, etkin kanalda bu oturum hedefine bir iş parçacığı oluşturur veya bağlar.
  </Step>
  <Step title="Takipleri yönlendir">
    Bu iş parçacığındaki yanıtlar ve takip mesajları bağlı oturuma yönlendirilir.
  </Step>
  <Step title="Zaman aşımlarını incele">
    Etkinsizlikte otomatik odaktan çıkmayı incelemek/güncellemek için `/session idle` ve
    sert üst sınırı denetlemek için `/session max-age` kullanın.
  </Step>
  <Step title="Ayır">
    Elle ayırmak için `/unfocus` kullanın.
  </Step>
</Steps>

### Manuel denetimler

| Komut              | Etkisi                                                                            |
| ------------------ | --------------------------------------------------------------------------------- |
| `/focus <target>`  | Geçerli diziyi (veya yeni bir tane oluşturup) bir alt ajan/oturum hedefine bağlar |
| `/unfocus`         | Geçerli bağlı dizinin bağını kaldırır                                             |
| `/agents`          | Etkin çalıştırmaları ve bağlama durumunu listeler (`thread:<id>` veya `unbound`)  |
| `/session idle`    | Boşta otomatik odaktan çıkarma ayarını incele/güncelle (yalnızca odaklanmış bağlı diziler) |
| `/session max-age` | Katı üst sınırı incele/güncelle (yalnızca odaklanmış bağlı diziler)               |

### Yapılandırma anahtarları

- **Genel varsayılan:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanal geçersiz kılma ve oluşturma sırasında otomatik bağlama anahtarları** adaptöre özgüdür. Yukarıdaki [Diziyi destekleyen kanallar](#thread-supporting-channels) bölümüne bakın.

Güncel adaptör ayrıntıları için [Yapılandırma başvurusu](/tr/gateway/configuration-reference) ve
[Slash komutları](/tr/tools/slash-commands) bölümlerine bakın.

### İzin verilenler listesi

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Açık `agentId` üzerinden hedeflenebilecek ajan kimliklerinin listesi (`["*"]` herhangi birine izin verir). Varsayılan: yalnızca istekte bulunan ajan. Bir liste ayarlarsanız ve istekte bulunan ajanın yine de `agentId` ile kendisini oluşturabilmesini istiyorsanız, istekte bulunan ajanın kimliğini listeye ekleyin.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  İstekte bulunan ajan kendi `subagents.allowAgents` değerini ayarlamadığında kullanılan varsayılan hedef-ajan izin listesi.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` belirtmeyen `sessions_spawn` çağrılarını engeller (açık profil seçimini zorunlu kılar). Ajan başına geçersiz kılma: `agents.list[].subagents.requireAgentId`.
</ParamField>

İstekte bulunan oturum sandbox içinde çalışıyorsa, `sessions_spawn` sandbox dışında
çalışacak hedefleri reddeder.

### Keşif

`sessions_spawn` için şu anda hangi ajan kimliklerine izin verildiğini görmek için
`agents_list` kullanın. Yanıt, çağıranların PI, Codex uygulama sunucusu ve diğer
yapılandırılmış yerel çalışma zamanlarını ayırt edebilmesi için listelenen her ajanın etkili
modelini ve gömülü çalışma zamanı meta verilerini içerir.

### Otomatik arşivleme

- Alt ajan oturumları `agents.defaults.subagents.archiveAfterMinutes` sonrasında otomatik olarak arşivlenir (varsayılan `60`).
- Arşivleme `sessions.delete` kullanır ve transkripti `*.deleted.<timestamp>` olarak yeniden adlandırır (aynı klasör).
- `cleanup: "delete"` duyurudan hemen sonra arşivler (transkripti yine yeniden adlandırarak saklar).
- Otomatik arşivleme en iyi çaba düzeyindedir; Gateway yeniden başlatılırsa bekleyen zamanlayıcılar kaybolur.
- `runTimeoutSeconds` otomatik arşivleme yapmaz; yalnızca çalıştırmayı durdurur. Oturum otomatik arşivlemeye kadar kalır.
- Otomatik arşivleme, derinlik-1 ve derinlik-2 oturumlarına eşit şekilde uygulanır.
- Tarayıcı temizliği arşiv temizliğinden ayrıdır: izlenen tarayıcı sekmeleri/süreçleri, transkript/oturum kaydı saklansa bile çalıştırma bittiğinde en iyi çaba düzeyinde kapatılır.

## İç içe alt ajanlar

Varsayılan olarak, alt ajanlar kendi alt ajanlarını oluşturamaz
(`maxSpawnDepth: 1`). Bir düzey iç içe yerleşimi etkinleştirmek için `maxSpawnDepth: 2`
ayarlayın — **orkestratör deseni**: ana → orkestratör alt ajan →
çalışan alt-alt ajanlar.

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

| Derinlik | Oturum anahtarı biçimi                        | Rol                                           | Oluşturabilir mi?            |
| -------- | --------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0        | `agent:<id>:main`                             | Ana ajan                                      | Her zaman                    |
| 1        | `agent:<id>:subagent:<uuid>`                  | Alt ajan (derinlik 2 izinliyse orkestratör)   | Yalnızca `maxSpawnDepth >= 2` |
| 2        | `agent:<id>:subagent:<uuid>:subagent:<uuid>`  | Alt-alt ajan (uç çalışan)                     | Asla                         |

### Duyuru zinciri

Sonuçlar zincir boyunca yukarı akar:

1. Derinlik-2 çalışan biter → üst öğesine duyurur (derinlik-1 orkestratör).
2. Derinlik-1 orkestratör duyuruyu alır, sonuçları sentezler, biter → ana ajana duyurur.
3. Ana ajan duyuruyu alır ve kullanıcıya iletir.

Her düzey yalnızca doğrudan alt öğelerinden gelen duyuruları görür.

<Note>
**Operasyonel rehberlik:** `sessions_list`,
`sessions_history`, `/subagents list` veya `exec` uyku komutları etrafında anket döngüleri
kurmak yerine alt işi bir kez başlatın ve tamamlanma olaylarını bekleyin.
`sessions_list` ve `/subagents list`, alt oturum ilişkilerini canlı işe
odaklı tutar — canlı alt öğeler bağlı kalır, sonlanmış alt öğeler kısa bir yakın zaman penceresinde
görünür kalır ve yalnızca depoda kalan bayat alt bağlantılar
güncellik pencerelerinden sonra yok sayılır. Bu, eski `spawnedBy` /
`parentSessionKey` meta verilerinin yeniden başlatma sonrasında hayalet alt öğeleri
yeniden ortaya çıkarmasını önler. Zaten son yanıtı gönderdikten sonra bir alt tamamlanma olayı gelirse,
doğru takip yanıtı tam sessiz belirteç olan
`NO_REPLY` / `no_reply` olmalıdır.
</Note>

### Derinliğe göre araç ilkesi

- Rol ve denetim kapsamı, oluşturma zamanında oturum meta verilerine yazılır. Bu, düz veya geri yüklenmiş oturum anahtarlarının yanlışlıkla orkestratör ayrıcalıklarını yeniden kazanmasını engeller.
- **Derinlik 1 (orkestratör, `maxSpawnDepth >= 2` olduğunda):** alt öğelerini yönetebilmesi için `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` alır. Diğer oturum/sistem araçları reddedilmeye devam eder.
- **Derinlik 1 (uç, `maxSpawnDepth == 1` olduğunda):** oturum aracı yoktur (geçerli varsayılan davranış).
- **Derinlik 2 (uç çalışan):** oturum aracı yoktur — `sessions_spawn` derinlik 2'de her zaman reddedilir. Daha fazla alt öğe oluşturamaz.

### Ajan başına oluşturma sınırı

Her ajan oturumu (herhangi bir derinlikte) aynı anda en fazla `maxChildrenPerAgent`
(varsayılan `5`) etkin alt öğeye sahip olabilir. Bu, tek bir orkestratörden
kontrolsüz yayılmayı önler.

### Kademeli durdurma

Derinlik-1 orkestratörü durdurmak, tüm derinlik-2 alt öğelerini otomatik olarak
durdurur:

- Ana sohbette `/stop`, tüm derinlik-1 ajanları durdurur ve onların derinlik-2 alt öğelerine kademeli olarak uygulanır.
- `/subagents kill <id>` belirli bir alt ajanı durdurur ve onun alt öğelerine kademeli olarak uygulanır.
- `/subagents kill all` istekte bulunan için tüm alt ajanları durdurur ve kademeli olarak uygulanır.

## Kimlik doğrulama

Alt ajan kimlik doğrulaması oturum türüne göre değil, **ajan kimliğine** göre çözümlenir:

- Alt ajan oturum anahtarı `agent:<agentId>:subagent:<uuid>` biçimindedir.
- Kimlik doğrulama deposu o ajanın `agentDir` dizininden yüklenir.
- Ana ajanın kimlik doğrulama profilleri **yedek** olarak birleştirilir; çakışmalarda ajan profilleri ana profilleri geçersiz kılar.

Birleştirme eklemelidir, bu nedenle ana profiller yedek olarak her zaman kullanılabilir.
Ajan başına tamamen yalıtılmış kimlik doğrulama henüz desteklenmiyor.

## Duyuru

Alt ajanlar bir duyuru adımı üzerinden geri rapor verir:

- Duyuru adımı, istekte bulunan oturumda değil alt ajan oturumunun içinde çalışır.
- Alt ajan tam olarak `ANNOUNCE_SKIP` yanıtını verirse hiçbir şey gönderilmez.
- En son asistan metni tam sessiz belirteç olan `NO_REPLY` / `no_reply` ise, daha önce görünür ilerleme olsa bile duyuru çıktısı bastırılır.

Teslimat, istekte bulunanın derinliğine bağlıdır:

- Üst düzey istekte bulunan oturumlar, harici teslimatla (`deliver=true`) bir takip `agent` çağrısı kullanır.
- İç içe istekte bulunan alt ajan oturumları, orkestratörün alt sonuçları oturum içinde sentezleyebilmesi için dahili bir takip enjeksiyonu (`deliver=false`) alır.
- İç içe istekte bulunan alt ajan oturumu yoksa, OpenClaw mümkün olduğunda o oturumun istekte bulunanına geri döner.

Üst düzey istekte bulunan oturumlarda, tamamlanma modu doğrudan teslimat önce
herhangi bir bağlı konuşma/dizi rotasını ve hook geçersiz kılmasını çözümler, ardından
eksik kanal-hedef alanlarını istekte bulunan oturumun saklanan rotasından doldurur.
Bu, tamamlanma kaynağı yalnızca kanalı tanımlasa bile tamamlanmaların doğru sohbet/konu üzerinde kalmasını sağlar.

Alt tamamlanma toplaması, iç içe tamamlanma bulguları oluşturulurken geçerli istekte bulunan çalıştırmaya
kapsamlanır; böylece önceki çalıştırmalardan kalan bayat alt
çıktıların geçerli duyuruya sızması engellenir. Duyuru yanıtları, kanal adaptörlerinde mevcut olduğunda
dizi/konu yönlendirmesini korur.

### Duyuru bağlamı

Duyuru bağlamı, kararlı bir dahili olay bloğuna normalize edilir:

| Alan           | Kaynak                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| Kaynak         | `subagent` veya `cron`                                                                                            |
| Oturum kimlikleri | Alt oturum anahtarı/kimliği                                                                                   |
| Tür            | Duyuru türü + görev etiketi                                                                                       |
| Durum          | Çalışma zamanı sonucundan türetilir (`success`, `error`, `timeout` veya `unknown`) — model metninden çıkarılmaz |
| Sonuç içeriği  | En son görünür asistan metni; yoksa arındırılmış en son araç/toolResult metni                                    |
| Takip          | Ne zaman yanıt verileceğini ve ne zaman sessiz kalınacağını açıklayan yönerge                                     |

Terminalde başarısız olan çalıştırmalar, yakalanan yanıt metnini yeniden oynatmadan
başarısızlık durumunu bildirir. Zaman aşımında, alt öğe yalnızca araç çağrılarına kadar ilerlediyse, duyuru
ham araç çıktısını yeniden oynatmak yerine bu geçmişi kısa bir kısmi ilerleme özetine
daraltabilir.

### İstatistik satırı

Duyuru yükleri sonunda (sarılmış olsa bile) bir istatistik satırı içerir:

- Çalışma zamanı (ör. `runtime 5m12s`).
- Belirteç kullanımı (girdi/çıktı/toplam).
- Model fiyatlandırması yapılandırıldığında tahmini maliyet (`models.providers.*.models[].cost`).
- Ana ajanın `sessions_history` üzerinden geçmişi getirebilmesi veya diskteki dosyayı inceleyebilmesi için `sessionKey`, `sessionId` ve transkript yolu.

Dahili meta veriler yalnızca orkestrasyon içindir; kullanıcıya dönük yanıtlar
normal asistan sesiyle yeniden yazılmalıdır.

### Neden `sessions_history` tercih edilmeli

`sessions_history` daha güvenli orkestrasyon yoludur:

- Asistan hatırlaması önce normalize edilir: düşünme etiketleri çıkarılır; `<relevant-memories>` / `<relevant_memories>` iskeleti çıkarılır; düz metin araç çağrısı XML yük blokları (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) çıkarılır, temiz şekilde hiç kapanmayan kesilmiş yükler dahil; düşürülmüş araç çağrısı/sonuç iskeleti ve geçmiş-bağlam işaretleri çıkarılır; sızmış model denetim belirteçleri (`<|assistant|>`, diğer ASCII `<|...|>`, tam genişlik `<｜...｜>`) çıkarılır; hatalı biçimlendirilmiş MiniMax araç çağrısı XML'i çıkarılır.
- Kimlik bilgisi/belirteç benzeri metin redakte edilir.
- Uzun bloklar kısaltılabilir.
- Çok büyük geçmişler eski satırları düşürebilir veya aşırı büyük bir satırı `[sessions_history omitted: message too large]` ile değiştirebilir.
- Ham disk üzerindeki transkript incelemesi, eksiksiz byte-byte transkripte ihtiyaç duyduğunuzda yedek yoldur.

## Araç ilkesi

Alt ajanlar önce üst veya hedef ajanla aynı profil ve araç ilkesi hattını
kullanır. Bundan sonra OpenClaw alt ajan kısıtlama katmanını uygular.

Kısıtlayıcı bir `tools.profile` olmadığında, alt ajanlar **oturum araçları**
ve sistem araçları dışında tüm araçları alır:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` burada da sınırlı, arındırılmış bir hatırlama görünümü olarak kalır —
ham transkript dökümü değildir.

`maxSpawnDepth >= 2` olduğunda, derinlik-1 orkestratör alt ajanları ayrıca
alt öğelerini yönetebilmeleri için `sessions_spawn`, `subagents`, `sessions_list` ve
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

`tools.subagents.tools.allow` nihai, yalnızca izin veren bir filtredir. Zaten çözümlenmiş araç kümesini daraltabilir, ancak `tools.profile` tarafından kaldırılmış bir aracı **geri ekleyemez**. Örneğin, `tools.profile: "coding"` `web_search`/`web_fetch` içerir ancak `browser` aracını içermez. Kodlama profilli alt ajanların tarayıcı otomasyonu kullanmasına izin vermek için profil aşamasında browser ekleyin:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Yalnızca tek bir ajanın tarayıcı otomasyonu alması gerekiyorsa ajan başına `agents.list[].tools.alsoAllow: ["browser"]` kullanın.

## Eşzamanlılık

Alt ajanlar, ayrılmış bir süreç içi kuyruk hattı kullanır:

- **Hat adı:** `subagent`
- **Eşzamanlılık:** `agents.defaults.subagents.maxConcurrent` (varsayılan `8`)

## Canlılık ve kurtarma

OpenClaw, `endedAt` yokluğunu bir alt ajanın hâlâ canlı olduğuna dair kalıcı kanıt olarak değerlendirmez. Eski çalıştırma penceresinden daha eski, sonlandırılmamış çalıştırmalar `/subagents list`, durum özetleri, alt öğe tamamlama kapısı ve oturum başına eşzamanlılık denetimlerinde aktif/beklemede olarak sayılmayı bırakır.

Bir Gateway yeniden başlatmasından sonra, eski sonlandırılmamış geri yüklenen çalıştırmalar, alt oturumları `abortedLastRun: true` olarak işaretlenmemişse budanır. Yeniden başlatma nedeniyle iptal edilmiş bu alt oturumlar, iptal işaretini temizlemeden önce sentetik bir sürdürme mesajı gönderen alt ajan yetim kurtarma akışı üzerinden kurtarılabilir kalır.

Otomatik yeniden başlatma kurtarması, alt oturum başına sınırlıdır. Aynı alt ajan çocuğu hızlı yeniden takılma penceresi içinde tekrar tekrar yetim kurtarma için kabul edilirse OpenClaw, o oturumda bir kurtarma mezar taşı kalıcılaştırır ve sonraki yeniden başlatmalarda onu otomatik olarak sürdürmeyi durdurur. Görev kaydını uzlaştırmak için `openclaw tasks maintenance --apply` veya mezar taşı konmuş oturumlardaki eski iptal edilmiş kurtarma bayraklarını temizlemek için `openclaw doctor --fix` çalıştırın.

<Note>
Bir alt ajan başlatma işlemi Gateway `PAIRING_REQUIRED` / `scope-upgrade` ile başarısız olursa, eşleştirme durumunu düzenlemeden önce RPC çağırıcısını denetleyin. Dahili `sessions_spawn` koordinasyonu, doğrudan loopback paylaşımlı belirteç/parola kimlik doğrulaması üzerinden `client.id: "gateway-client"` ve `client.mode: "backend"` olarak bağlanmalıdır; bu yol CLI'nin eşleştirilmiş cihaz kapsamı tabanına bağlı değildir. Uzak çağırıcılar, açık `deviceIdentity`, açık cihaz belirteci yolları ve tarayıcı/node istemcileri kapsam yükseltmeleri için yine normal cihaz onayına ihtiyaç duyar.
</Note>

## Durdurma

- İstekte bulunan sohbette `/stop` göndermek, istekte bulunan oturumu iptal eder ve ondan başlatılmış tüm aktif alt ajan çalıştırmalarını durdurur; iç içe alt öğelere de kademeli olarak uygulanır.
- `/subagents kill <id>` belirli bir alt ajanı durdurur ve alt öğelerine kademeli olarak uygulanır.

## Sınırlamalar

- Alt ajan duyurusu **en iyi çaba** esaslıdır. Gateway yeniden başlatılırsa bekleyen "geri duyur" işi kaybolur.
- Alt ajanlar yine aynı Gateway süreç kaynaklarını paylaşır; `maxConcurrent` değerini bir güvenlik valfi olarak değerlendirin.
- `sessions_spawn` her zaman engelleyici değildir: hemen `{ status: "accepted", runId, childSessionKey }` döndürür.
- Alt ajan bağlamı yalnızca `AGENTS.md` + `TOOLS.md` enjekte eder (`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` veya `BOOTSTRAP.md` yoktur).
- Maksimum iç içe geçme derinliği 5'tir (`maxSpawnDepth` aralığı: 1-5). Çoğu kullanım durumu için derinlik 2 önerilir.
- `maxChildrenPerAgent`, oturum başına aktif alt öğeleri sınırlar (varsayılan `5`, aralık `1-20`).

## İlgili

- [ACP ajanları](/tr/tools/acp-agents)
- [Ajan gönderimi](/tr/tools/agent-send)
- [Arka plan görevleri](/tr/automation/tasks)
- [Çok ajanlı korumalı alan araçları](/tr/tools/multi-agent-sandbox-tools)
