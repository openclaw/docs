---
read_when:
    - Ajan aracılığıyla arka plan veya paralel çalışma istiyorsunuz
    - sessions_spawn veya alt ajan aracı ilkesini değiştiriyorsunuz
    - İş parçacığına bağlı alt ajan oturumlarını uyguluyor veya sorunlarını gideriyorsunuz
sidebarTitle: Sub-agents
summary: Sonuçları istekte bulunan sohbete geri duyuran yalıtılmış arka plan ajan çalıştırmaları başlatın
title: Alt ajanlar
x-i18n:
    generated_at: "2026-05-04T07:09:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65d60bf6813d667b7311aa28109d4bd6be012a16e638c64cfff130831db88cd8
    source_path: tools/subagents.md
    workflow: 16
---

Alt aracılar, mevcut bir aracı çalışmasından başlatılan arka plan aracı çalışmalarıdır.
Kendi oturumlarında (`agent:<agentId>:subagent:<uuid>`) çalışırlar ve
tamamlandıklarında sonuçlarını istekte bulunan sohbet kanalına geri
**duyururlar**. Her alt aracı çalışması bir
[arka plan görevi](/tr/automation/tasks) olarak izlenir.

Birincil hedefler:

- Ana çalışmayı engellemeden "araştırma / uzun görev / yavaş araç" işlerini paralelleştirmek.
- Alt aracıları varsayılan olarak izole tutmak (oturum ayrımı + isteğe bağlı sandbox).
- Araç yüzeyinin yanlış kullanımını zorlaştırmak: alt aracılar varsayılan olarak oturum araçlarını almaz.
- Orkestratör desenleri için yapılandırılabilir iç içe geçme derinliğini desteklemek.

<Note>
**Maliyet notu:** her alt aracının varsayılan olarak kendi bağlamı ve token kullanımı vardır. Ağır veya tekrarlı görevler için alt aracılar için daha ucuz bir model ayarlayın ve ana aracınızı daha yüksek kaliteli bir modelde tutun. `agents.defaults.subagents.model` veya aracı bazlı geçersiz kılmalar ile yapılandırın. Bir alt aracı gerçekten istekte bulunanın mevcut transkriptine ihtiyaç duyduğunda, aracı o tek başlatmada `context: "fork"` isteyebilir. İş parçacığına bağlı alt aracı oturumları, mevcut konuşmayı bir takip iş parçacığına dallandırdıkları için varsayılan olarak `context: "fork"` kullanır.
</Note>

## Slash komutu

**Mevcut oturum** için alt aracı çalışmalarını incelemek veya kontrol etmek üzere `/subagents` kullanın:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

Mevcut istekte bulunan oturumun etkin çalışmasını yönlendirmek için üst düzey [`/steer <message>`](/tr/tools/steer) kullanın. Hedef bir alt çalışma olduğunda `/subagents steer <id|#> <message>` kullanın.

`/subagents info` çalışma meta verilerini (durum, zaman damgaları, oturum kimliği, transkript yolu, temizlik) gösterir. Sınırlandırılmış, güvenlik filtresinden geçirilmiş bir hatırlama görünümü için `sessions_history` kullanın; ham tam transkripte ihtiyaç duyduğunuzda diskteki transkript yolunu inceleyin.

### İş parçacığı bağlama kontrolleri

Bu komutlar kalıcı iş parçacığı bağlamalarını destekleyen kanallarda çalışır.
Aşağıdaki [İş parçacığını destekleyen kanallar](#thread-supporting-channels) bölümüne bakın.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Başlatma davranışı

`/subagents spawn`, bir kullanıcı komutu olarak (iç röle değil) bir arka plan alt aracısı başlatır ve çalışma tamamlandığında istekte bulunan sohbete son bir tamamlama güncellemesi gönderir.

<AccordionGroup>
  <Accordion title="Engellemeyen, itme tabanlı tamamlama">
    - Başlatma komutu engelleyici değildir; hemen bir çalışma kimliği döndürür.
    - Tamamlandığında alt aracı, istekte bulunan sohbet kanalına bir özet/sonuç mesajı duyurur.
    - Tamamlama itme tabanlıdır. Başlatıldıktan sonra, yalnızca bitmesini beklemek için `/subagents list`, `sessions_list` veya `sessions_history` komutlarını döngü içinde yoklamayın; durumu yalnızca hata ayıklama veya müdahale için gerektiğinde inceleyin.
    - Tamamlandığında OpenClaw, duyuru temizlik akışı devam etmeden önce o alt aracı oturumu tarafından açılan izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır.

  </Accordion>
  <Accordion title="Elle başlatmada teslim dayanıklılığı">
    - OpenClaw önce kararlı bir idempotency anahtarıyla doğrudan `agent` teslimini dener.
    - İstekte bulunan aracı tamamlama turu başarısız olursa, görünür çıktı üretmezse veya yakalanan alt sonucun açıkça eksik bir önekini döndürürse, OpenClaw yakalanan alt sonuçtan doğrudan tamamlama teslimine geri döner.
    - Doğrudan teslim kullanılamazsa, kuyruk yönlendirmesine geri döner.
    - Kuyruk yönlendirmesi hâlâ mevcut değilse, duyuru son vazgeçmeden önce kısa üstel geri çekilmeyle yeniden denenir.
    - Tamamlama teslimi çözümlenen istekte bulunan rotasını korur: mevcut olduğunda iş parçacığına bağlı veya konuşmaya bağlı tamamlama rotaları kazanır; tamamlama kaynağı yalnızca bir kanal sağlıyorsa, OpenClaw eksik hedefi/hesabı istekte bulunan oturumun çözümlenen rotasından (`lastChannel` / `lastTo` / `lastAccountId`) doldurur, böylece doğrudan teslim hâlâ çalışır.

  </Accordion>
  <Accordion title="Tamamlama devri meta verileri">
    İstekte bulunan oturuma tamamlama devri, çalışma zamanında oluşturulan
    iç bağlamdır (kullanıcı tarafından yazılmış metin değildir) ve şunları içerir:

    - `Result` — en son görünür `assistant` yanıt metni, aksi halde temizlenmiş en son araç/toolResult metni. Terminal başarısız çalışmaları yakalanan yanıt metnini yeniden kullanmaz.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompakt çalışma zamanı/token istatistikleri.
    - İstekte bulunan aracıya normal asistan sesiyle yeniden yazmasını söyleyen bir teslim talimatı (ham iç meta verileri iletmez).

  </Accordion>
  <Accordion title="Modlar ve ACP çalışma zamanı">
    - `--model` ve `--thinking`, o belirli çalışma için varsayılanları geçersiz kılar.
    - Tamamlandıktan sonra ayrıntıları ve çıktıyı incelemek için `info`/`log` kullanın.
    - `/subagents spawn` tek seferlik moddur (`mode: "run"`). Kalıcı iş parçacığına bağlı oturumlar için `thread: true` ve `mode: "session"` ile `sessions_spawn` kullanın.
    - ACP harness oturumları (Claude Code, Gemini CLI, OpenCode veya açıkça Codex ACP/acpx) için, araç bu çalışma zamanını duyurduğunda `runtime: "acp"` ile `sessions_spawn` kullanın. Tamamlamalarda veya aracıdan aracıya döngülerde hata ayıklarken [ACP teslim modeli](/tr/tools/acp-agents#delivery-model) bölümüne bakın. `codex` Plugin etkinleştirildiğinde, Codex sohbet/iş parçacığı kontrolü, kullanıcı açıkça ACP/acpx istemediği sürece ACP yerine `/codex ...` tercih etmelidir.
    - OpenClaw, ACP etkinleştirilene, istekte bulunan sandbox içinde olmayana ve `acpx` gibi bir backend Plugin yüklenene kadar `runtime: "acp"` değerini gizler. `runtime: "acp"` harici bir ACP harness kimliği veya `runtime.type="acp"` olan bir `agents.list[]` girdisi bekler; `agents_list` içindeki normal OpenClaw yapılandırma aracıları için varsayılan alt aracı çalışma zamanını kullanın.

  </Accordion>
</AccordionGroup>

## Bağlam modları

Yerel alt aracılar, çağıran açıkça mevcut transkripti fork etmeyi istemedikçe izole başlar.

| Mod        | Ne zaman kullanılır                                                                                                                   | Davranış                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Yeni araştırma, bağımsız uygulama, yavaş araç işi veya görev metninde özetlenebilecek herhangi bir şey                                | Temiz bir alt transkript oluşturur. Bu varsayılandır ve token kullanımını daha düşük tutar. |
| `fork`     | Mevcut konuşmaya, önceki araç sonuçlarına veya istekte bulunan transkriptte zaten bulunan incelikli talimatlara bağlı işler           | Alt başlatılmadan önce istekte bulunan transkripti alt oturuma dallandırır.       |

`fork` değerini ölçülü kullanın. Bu, bağlama duyarlı yetkilendirme içindir, açık bir görev istemi yazmanın yerine geçmez.

## Araç: `sessions_spawn`

Global `subagent` hattında `deliver: false` ile bir alt aracı çalışması başlatır,
ardından bir duyuru adımı çalıştırır ve duyuru yanıtını istekte bulunan
sohbet kanalına gönderir.

Kullanılabilirlik, çağıranın etkin araç politikasına bağlıdır. `coding` ve
`full` profilleri varsayılan olarak `sessions_spawn` sunar. `messaging` profili
sunmaz; işi devretmesi gereken aracılar için `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` ekleyin veya `tools.profile: "coding"` kullanın.
Kanal/grup, sağlayıcı, sandbox ve aracı bazlı izin/verme politikaları,
profil aşamasından sonra aracı yine de kaldırabilir. Etkin araç listesini
doğrulamak için aynı oturumdan `/tools` kullanın.

**Varsayılanlar:**

- **Model:** `agents.defaults.subagents.model` (veya aracı bazlı `agents.list[].subagents.model`) ayarlamadığınız sürece çağıranı devralır; açık bir `sessions_spawn.model` yine de kazanır.
- **Thinking:** `agents.defaults.subagents.thinking` (veya aracı bazlı `agents.list[].subagents.thinking`) ayarlamadığınız sürece çağıranı devralır; açık bir `sessions_spawn.thinking` yine de kazanır.
- **Çalışma zaman aşımı:** `sessions_spawn.runTimeoutSeconds` atlanırsa, ayarlı olduğunda OpenClaw `agents.defaults.subagents.runTimeoutSeconds` kullanır; aksi halde `0` değerine (zaman aşımı yok) geri döner.

### Araç parametreleri

<ParamField path="task" type="string" required>
  Alt aracı için görev açıklaması.
</ParamField>
<ParamField path="label" type="string">
  İsteğe bağlı, insan tarafından okunabilir etiket.
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents` tarafından izin verildiğinde başka bir aracı kimliği altında başlatın.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` yalnızca harici ACP harness'leri (`claude`, `droid`, `gemini`, `opencode` veya açıkça istenen Codex ACP/acpx) ve `runtime.type` değeri `acp` olan `agents.list[]` girdileri içindir.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Yalnızca ACP. `runtime: "acp"` olduğunda mevcut bir ACP harness oturumunu sürdürür; yerel alt aracı başlatmaları için yok sayılır.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Yalnızca ACP. `runtime: "acp"` olduğunda ACP çalışma çıktısını üst oturuma aktarır; yerel alt aracı başlatmaları için atlayın.
</ParamField>
<ParamField path="model" type="string">
  Alt aracı modelini geçersiz kılın. Geçersiz değerler atlanır ve alt aracı, araç sonucunda bir uyarıyla varsayılan modelde çalışır.
</ParamField>
<ParamField path="thinking" type="string">
  Alt aracı çalışması için thinking düzeyini geçersiz kılın.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Ayarlı olduğunda varsayılan olarak `agents.defaults.subagents.runTimeoutSeconds`, aksi halde `0`. Ayarlandığında, alt aracı çalışması N saniye sonra iptal edilir.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` olduğunda, bu alt aracı oturumu için kanal iş parçacığı bağlaması ister.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` ve `mode` atlanırsa, varsayılan `session` olur. `mode: "session"` için `thread: true` gerekir.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` duyurudan hemen sonra arşivler (transkripti yeniden adlandırma yoluyla yine de korur).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require`, hedef alt çalışma zamanı sandbox içinde değilse başlatmayı reddeder.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork`, istekte bulunanın mevcut transkriptini alt oturuma dallandırır. Yalnızca yerel alt aracılar. İş parçacığına bağlı başlatmalar varsayılan olarak `fork`; iş parçacığı olmayan başlatmalar varsayılan olarak `isolated` kullanır.
</ParamField>

<Warning>
`sessions_spawn`, kanal teslim parametrelerini (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`) kabul etmez. Teslim için başlatılan çalışmadan
`message`/`sessions_send` kullanın.
</Warning>

## İş parçacığına bağlı oturumlar

Bir kanal için iş parçacığı bağlamaları etkinleştirildiğinde, bir alt aracı
bir iş parçacığına bağlı kalabilir; böylece o iş parçacığındaki takip kullanıcı
mesajları aynı alt aracı oturumuna yönlendirilmeye devam eder.

### İş parçacığını destekleyen kanallar

**Discord** şu anda desteklenen tek kanaldır. Kalıcı iş parçacığına bağlı alt aracı oturumlarını (`thread: true` ile `sessions_spawn`), manuel iş parçacığı kontrollerini (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) ve adapter anahtarlarını
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` ve
`channels.discord.threadBindings.spawnSessions` destekler.

### Hızlı akış

<Steps>
  <Step title="Spawn">
    `sessions_spawn`, `thread: true` ile (ve isteğe bağlı olarak `mode: "session"`).
  </Step>
  <Step title="Bind">
    OpenClaw, etkin kanalda bu oturum hedefine bir iş parçacığı oluşturur veya bağlar.
  </Step>
  <Step title="Route follow-ups">
    Bu iş parçacığındaki yanıtlar ve takip mesajları bağlı oturuma yönlendirilir.
  </Step>
  <Step title="Inspect timeouts">
    Etkinsizlikte otomatik odaktan çıkarmayı incelemek/güncellemek için `/session idle`, sabit üst sınırı denetlemek için
    `/session max-age` kullanın.
  </Step>
  <Step title="Detach">
    Elle ayırmak için `/unfocus` kullanın.
  </Step>
</Steps>

### Elle denetimler

| Komut              | Etki                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Geçerli iş parçacığını (veya yeni bir tane oluşturarak) bir alt-agent/oturum hedefine bağlar |
| `/unfocus`         | Geçerli bağlı iş parçacığının bağını kaldırır                         |
| `/agents`          | Etkin çalıştırmaları ve bağ durumunu listeler (`thread:<id>` veya `unbound`) |
| `/session idle`    | Boşta otomatik odaktan çıkarmayı incele/güncelle (yalnızca odaklanmış bağlı iş parçacıkları) |
| `/session max-age` | Sabit üst sınırı incele/güncelle (yalnızca odaklanmış bağlı iş parçacıkları) |

### Yapılandırma anahtarları

- **Genel varsayılan:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanal geçersiz kılması ve oluşturma sırasında otomatik bağlama anahtarları** adaptere özeldir. Yukarıdaki [İş parçacığını destekleyen kanallar](#thread-supporting-channels) bölümüne bakın.

Güncel adapter ayrıntıları için [Yapılandırma başvurusu](/tr/gateway/configuration-reference) ve
[Slash komutları](/tr/tools/slash-commands) bölümlerine bakın.

### İzin listesi

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Açık `agentId` üzerinden hedeflenebilecek agent kimliklerinin listesi (`["*"]` herhangi birine izin verir). Varsayılan: yalnızca isteği yapan agent. Bir liste ayarlarsanız ve isteği yapanın `agentId` ile kendisini oluşturmasını hâlâ istiyorsanız, listeye isteği yapanın kimliğini ekleyin.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  İsteği yapan agent kendi `subagents.allowAgents` değerini ayarlamadığında kullanılan varsayılan hedef-agent izin listesi.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` değerini atlayan `sessions_spawn` çağrılarını engelleyin (açık profil seçimini zorunlu kılar). Agent başına geçersiz kılma: `agents.list[].subagents.requireAgentId`.
</ParamField>

İsteği yapan oturum sandbox içindeyse, `sessions_spawn` sandbox dışında çalışacak hedefleri reddeder.

### Keşif

`sessions_spawn` için şu anda hangi agent kimliklerine izin verildiğini görmek üzere `agents_list` kullanın. Yanıt, çağıranların PI, Codex app-server ve diğer yapılandırılmış yerel çalışma zamanlarını ayırt edebilmesi için listelenen her agentın etkin modelini ve gömülü çalışma zamanı metaverilerini içerir.

### Otomatik arşivleme

- Alt-agent oturumları `agents.defaults.subagents.archiveAfterMinutes` sonrasında otomatik olarak arşivlenir (varsayılan `60`).
- Arşivleme `sessions.delete` kullanır ve transkripti `*.deleted.<timestamp>` olarak yeniden adlandırır (aynı klasör).
- `cleanup: "delete"` duyurudan hemen sonra arşivler (transkripti yeniden adlandırma yoluyla yine korur).
- Otomatik arşivleme en iyi çaba esasına göredir; Gateway yeniden başlatılırsa bekleyen zamanlayıcılar kaybolur.
- `runTimeoutSeconds` otomatik arşivlemez; yalnızca çalıştırmayı durdurur. Oturum, otomatik arşivlemeye kadar kalır.
- Otomatik arşivleme derinlik-1 ve derinlik-2 oturumlarına eşit şekilde uygulanır.
- Tarayıcı temizliği arşiv temizliğinden ayrıdır: izlenen tarayıcı sekmeleri/süreçleri, transkript/oturum kaydı korunsa bile çalıştırma bittiğinde en iyi çaba ile kapatılır.

## İç içe alt-agentlar

Varsayılan olarak alt-agentlar kendi alt-agentlarını oluşturamaz (`maxSpawnDepth: 1`). Bir düzey iç içe geçmeyi etkinleştirmek için `maxSpawnDepth: 2` ayarlayın — **orchestrator kalıbı**: ana → orchestrator alt-agent →
worker alt-alt-agentlar.

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

| Derinlik | Oturum anahtarı biçimi                      | Rol                                           | Oluşturabilir mi?            |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Ana agent                                     | Her zaman                    |
| 1     | `agent:<id>:subagent:<uuid>`                 | Alt-agent (derinlik 2'ye izin verildiğinde orchestrator) | Yalnızca `maxSpawnDepth >= 2` ise |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Alt-alt-agent (yaprak worker)                 | Asla                         |

### Duyuru zinciri

Sonuçlar zincirde yukarı doğru akar:

1. Derinlik-2 worker tamamlanır → üst öğesine duyurur (derinlik-1 orchestrator).
2. Derinlik-1 orchestrator duyuruyu alır, sonuçları sentezler, tamamlanır → ana agenta duyurur.
3. Ana agent duyuruyu alır ve kullanıcıya iletir.

Her düzey yalnızca doğrudan alt öğelerinden gelen duyuruları görür.

<Note>
**Operasyonel rehberlik:** `sessions_list`,
`sessions_history`, `/subagents list` veya `exec` sleep komutları etrafında yoklama döngüleri oluşturmak yerine alt çalışmayı bir kez başlatın ve tamamlama olaylarını bekleyin.
`sessions_list` ve `/subagents list`, alt-oturum ilişkilerini canlı işe odaklı tutar — canlı alt öğeler bağlı kalır, sonlanan alt öğeler kısa bir yakın geçmiş penceresinde görünür kalır ve bayat yalnızca-depo alt bağlantıları tazelik penceresinden sonra yok sayılır. Bu, eski `spawnedBy` /
`parentSessionKey` metaverilerinin yeniden başlatmadan sonra hayalet alt öğeleri yeniden canlandırmasını önler. Son yanıtı gönderdikten sonra bir alt öğe tamamlama olayı gelirse, doğru takip yanıtı tam sessiz token olan
`NO_REPLY` / `no_reply` değeridir.
</Note>

### Derinliğe göre araç ilkesi

- Rol ve denetim kapsamı oluşturma zamanında oturum metaverilerine yazılır. Bu, düz veya geri yüklenmiş oturum anahtarlarının yanlışlıkla orchestrator ayrıcalıklarını yeniden kazanmasını engeller.
- **Derinlik 1 (orchestrator, `maxSpawnDepth >= 2` olduğunda):** alt öğelerini yönetebilmesi için `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` alır. Diğer oturum/sistem araçları reddedilmeye devam eder.
- **Derinlik 1 (yaprak, `maxSpawnDepth == 1` olduğunda):** oturum aracı yok (geçerli varsayılan davranış).
- **Derinlik 2 (yaprak worker):** oturum aracı yok — `sessions_spawn` derinlik 2'de her zaman reddedilir. Daha fazla alt öğe oluşturamaz.

### Agent başına oluşturma sınırı

Her agent oturumu (herhangi bir derinlikte) aynı anda en fazla `maxChildrenPerAgent`
(varsayılan `5`) etkin alt öğeye sahip olabilir. Bu, tek bir orchestratordan kontrolden çıkmış yayılmayı önler.

### Kademeli durdurma

Bir derinlik-1 orchestratoru durdurmak, tüm derinlik-2 alt öğelerini otomatik olarak durdurur:

- Ana sohbette `/stop`, tüm derinlik-1 agentları durdurur ve onların derinlik-2 alt öğelerine kademelenir.
- `/subagents kill <id>` belirli bir alt-agentı durdurur ve alt öğelerine kademelenir.
- `/subagents kill all` isteği yapan için tüm alt-agentları durdurur ve kademelenir.

## Kimlik doğrulama

Alt-agent kimlik doğrulaması oturum türüne göre değil, **agent kimliğine** göre çözümlenir:

- Alt-agent oturum anahtarı `agent:<agentId>:subagent:<uuid>` biçimindedir.
- Kimlik doğrulama deposu bu agentın `agentDir` konumundan yüklenir.
- Ana agentın kimlik doğrulama profilleri **yedek** olarak birleştirilir; çakışmalarda agent profilleri ana profilleri geçersiz kılar.

Birleştirme eklemelidir, bu nedenle ana profiller yedek olarak her zaman kullanılabilir. Agent başına tamamen yalıtılmış kimlik doğrulama henüz desteklenmiyor.

## Duyuru

Alt-agentlar bir duyuru adımıyla geri rapor verir:

- Duyuru adımı alt-agent oturumunun içinde çalışır (isteği yapan oturumda değil).
- Alt-agent tam olarak `ANNOUNCE_SKIP` yanıtı verirse hiçbir şey gönderilmez.
- En son asistan metni tam sessiz token olan `NO_REPLY` / `no_reply` ise, daha önce görünür ilerleme olsa bile duyuru çıktısı bastırılır.

Teslimat, isteği yapanın derinliğine bağlıdır:

- Üst düzey istekte bulunan oturumlar, harici teslimatla (`deliver=true`) bir takip `agent` çağrısı kullanır.
- İç içe istekte bulunan subagent oturumları, orchestratorın alt öğe sonuçlarını oturum içinde sentezleyebilmesi için dahili takip enjeksiyonu (`deliver=false`) alır.
- İç içe istekte bulunan bir subagent oturumu yoksa, OpenClaw kullanılabilir olduğunda o oturumun istekte bulunanına geri döner.

Üst düzey istekte bulunan oturumlarda, tamamlama modu doğrudan teslimat önce bağlı konuşma/iş parçacığı rotasını ve hook geçersiz kılmasını çözer, ardından eksik kanal-hedef alanlarını istekte bulunan oturumun kayıtlı rotasından doldurur.
Bu, tamamlama kaynağı yalnızca kanalı tanımlasa bile tamamlamaları doğru sohbet/konu üzerinde tutar.

İç içe tamamlama bulguları oluşturulurken alt öğe tamamlama toplaması geçerli istekte bulunan çalıştırmasıyla kapsamlanır; bu, eski önceki çalıştırma alt öğe çıktılarının geçerli duyuruya sızmasını önler. Duyuru yanıtları, kanal adapterlerinde mevcut olduğunda iş parçacığı/konu yönlendirmesini korur.

### Duyuru bağlamı

Duyuru bağlamı kararlı bir dahili olay bloğuna normalleştirilir:

| Alan           | Kaynak                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Kaynak         | `subagent` veya `cron`                                                                                        |
| Oturum kimlikleri | Alt oturum anahtarı/kimliği                                                                               |
| Tür            | Duyuru türü + görev etiketi                                                                                   |
| Durum          | Çalışma zamanı sonucundan türetilir (`success`, `error`, `timeout` veya `unknown`) — model metninden çıkarılmaz |
| Sonuç içeriği  | En son görünür asistan metni; yoksa arındırılmış en son araç/toolResult metni                                 |
| Takip          | Ne zaman yanıt verileceğini ve ne zaman sessiz kalınacağını açıklayan talimat                                 |

Terminalde başarısız olan çalıştırmalar, yakalanan yanıt metnini yeniden oynatmadan başarısızlık durumunu bildirir. Zaman aşımında, alt öğe yalnızca araç çağrılarına kadar ilerlediyse duyuru, ham araç çıktısını yeniden oynatmak yerine bu geçmişi kısa bir kısmi ilerleme özetine indirebilir.

### İstatistik satırı

Duyuru yükleri sonda bir istatistik satırı içerir (sarmalandığında bile):

- Çalışma zamanı (örn. `runtime 5m12s`).
- Token kullanımı (girdi/çıktı/toplam).
- Model fiyatlandırması yapılandırıldığında tahmini maliyet (`models.providers.*.models[].cost`).
- Ana agentın `sessions_history` üzerinden geçmişi getirebilmesi veya diskteki dosyayı inceleyebilmesi için `sessionKey`, `sessionId` ve transkript yolu.

Dahili metaveriler yalnızca orchestration için tasarlanmıştır; kullanıcıya dönük yanıtlar normal asistan sesiyle yeniden yazılmalıdır.

### Neden `sessions_history` tercih edilmeli

`sessions_history` daha güvenli orchestration yoludur:

- Asistan hatırlaması önce normalleştirilir: düşünme etiketleri çıkarılır; `<relevant-memories>` / `<relevant_memories>` iskeleti çıkarılır; düz metin araç çağrısı XML yük blokları (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) çıkarılır, düzgün kapanmayan kesilmiş yükler dahil; düşürülmüş araç çağrısı/sonuç iskeleti ve geçmiş-bağlam işaretçileri çıkarılır; sızan model denetim tokenları (`<|assistant|>`, diğer ASCII `<|...|>`, tam genişlikli `<｜...｜>`) çıkarılır; hatalı biçimli MiniMax araç çağrısı XML'i çıkarılır.
- Kimlik bilgisi/token benzeri metin redakte edilir.
- Uzun bloklar kısaltılabilir.
- Çok büyük geçmişler daha eski satırları düşürebilir veya aşırı büyük bir satırı `[sessions_history omitted: message too large]` ile değiştirebilir.
- Tam bayt bayt transkripte ihtiyaç duyduğunuzda ham disk üzerindeki transkript incelemesi yedektir.

## Araç ilkesi

Alt ajanlar önce üst veya hedef ajanla aynı profil ve araç ilkesi işlem hattını kullanır. Bundan sonra OpenClaw alt ajan kısıtlama katmanını uygular.

Kısıtlayıcı bir `tools.profile` olmadığında, alt ajanlar **oturum araçları ve sistem araçları dışındaki tüm araçları** alır:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` burada da sınırlandırılmış, temizlenmiş bir hatırlama görünümü olarak kalır; ham transkript dökümü değildir.

`maxSpawnDepth >= 2` olduğunda, derinlik-1 düzenleyici alt ajanlar ayrıca çocuklarını yönetebilmeleri için `sessions_spawn`, `subagents`, `sessions_list` ve `sessions_history` alır.

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

`tools.subagents.tools.allow` son bir yalnızca izin filtresidir. Zaten çözümlenmiş araç kümesini daraltabilir, ancak `tools.profile` tarafından kaldırılan bir aracı **geri ekleyemez**. Örneğin, `tools.profile: "coding"` `web_search`/`web_fetch` içerir, ancak `browser` aracını içermez. Kodlama profilli alt ajanların tarayıcı otomasyonu kullanmasına izin vermek için, profil aşamasında browser ekleyin:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Yalnızca bir ajanın tarayıcı otomasyonu alması gerektiğinde ajan başına `agents.list[].tools.alsoAllow: ["browser"]` kullanın.

## Eşzamanlılık

Alt ajanlar, sürece özel ayrılmış bir kuyruk hattı kullanır:

- **Hat adı:** `subagent`
- **Eşzamanlılık:** `agents.defaults.subagents.maxConcurrent` (varsayılan `8`)

## Canlılık ve kurtarma

OpenClaw, `endedAt` yokluğunu bir alt ajanın hâlâ canlı olduğuna dair kalıcı kanıt olarak değerlendirmez. Bayat çalışma penceresinden daha eski bitmemiş çalışmalar `/subagents list`, durum özetleri, alt öğe tamamlanma kapısı ve oturum başına eşzamanlılık kontrollerinde aktif/bekleyen olarak sayılmayı bırakır.

Gateway yeniden başlatıldıktan sonra, alt oturumları `abortedLastRun: true` olarak işaretlenmemişse bayat, bitmemiş geri yüklenen çalışmalar budanır. Yeniden başlatma nedeniyle iptal edilen bu alt oturumlar, iptal işaretini temizlemeden önce sentetik bir sürdürme mesajı gönderen alt ajan yetim kurtarma akışı üzerinden kurtarılabilir kalır.

Otomatik yeniden başlatma kurtarması alt oturum başına sınırlandırılmıştır. Aynı alt ajan çocuğu hızlı yeniden takılma penceresi içinde tekrar tekrar yetim kurtarma için kabul edilirse, OpenClaw bu oturumda bir kurtarma mezar taşı kalıcılaştırır ve sonraki yeniden başlatmalarda bunu otomatik sürdürmeyi durdurur. Görev kaydını uzlaştırmak için `openclaw tasks maintenance --apply`, mezar taşlı oturumlardaki bayat iptal edilmiş kurtarma bayraklarını temizlemek için `openclaw doctor --fix` çalıştırın.

<Note>
Bir alt ajan oluşturma işlemi Gateway `PAIRING_REQUIRED` / `scope-upgrade` ile başarısız olursa, eşleme durumunu düzenlemeden önce RPC çağırıcısını kontrol edin. Dahili `sessions_spawn` koordinasyonu, doğrudan local loopback paylaşılan token/parola kimlik doğrulaması üzerinden `client.id: "gateway-client"` ve `client.mode: "backend"` ile bağlanmalıdır; bu yol CLI'ın eşlenmiş cihaz kapsamı taban çizgisine bağlı değildir. Uzak çağırıcılar, açık `deviceIdentity`, açık cihaz token yolları ve tarayıcı/node istemcileri kapsam yükseltmeleri için hâlâ normal cihaz onayına ihtiyaç duyar.
</Note>

## Durdurma

- İstek sahibi sohbetinde `/stop` göndermek istek sahibi oturumunu iptal eder ve ondan oluşturulan tüm aktif alt ajan çalışmalarını durdurarak iç içe çocuklara kadar yayılır.
- `/subagents kill <id>` belirli bir alt ajanı durdurur ve çocuklarına yayılır.

## Sınırlamalar

- Alt ajan duyurusu **en iyi çaba** esaslıdır. Gateway yeniden başlatılırsa, bekleyen "geri duyur" işi kaybolur.
- Alt ajanlar hâlâ aynı Gateway süreç kaynaklarını paylaşır; `maxConcurrent` değerini bir emniyet valfi olarak değerlendirin.
- `sessions_spawn` her zaman engellemesizdir: `{ status: "accepted", runId, childSessionKey }` değerini hemen döndürür.
- Alt ajan bağlamı yalnızca `AGENTS.md` + `TOOLS.md` enjekte eder (`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` veya `BOOTSTRAP.md` yoktur).
- En fazla iç içe geçme derinliği 5'tir (`maxSpawnDepth` aralığı: 1-5). Çoğu kullanım durumu için derinlik 2 önerilir.
- `maxChildrenPerAgent`, oturum başına aktif çocuk sayısını sınırlar (varsayılan `5`, aralık `1-20`).

## İlgili

- [ACP ajanları](/tr/tools/acp-agents)
- [Ajan gönderme](/tr/tools/agent-send)
- [Arka plan görevleri](/tr/automation/tasks)
- [Çok ajanlı sandbox araçları](/tr/tools/multi-agent-sandbox-tools)
