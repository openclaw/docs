---
read_when:
    - Aracı üzerinden arka plan veya paralel çalışma istiyorsunuz
    - sessions_spawn veya alt ajan araç politikasını değiştiriyorsunuz
    - İş parçacığına bağlı alt aracı oturumlarını uyguluyor veya bu oturumlarda sorun gideriyorsunuz
sidebarTitle: Sub-agents
summary: Sonuçları istekte bulunan sohbetine geri duyuran yalıtılmış arka plan ajan çalıştırmaları başlatın
title: Alt aracılar
x-i18n:
    generated_at: "2026-05-07T01:54:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 901311ae7766640ff6991f66a63070fddef47d79ef5385d2c1af84be34a5140e
    source_path: tools/subagents.md
    workflow: 16
---

Alt ajanlar, mevcut bir ajan çalıştırmasından başlatılan arka plan ajan çalıştırmalarıdır.
Kendi oturumlarında (`agent:<agentId>:subagent:<uuid>`) çalışırlar ve,
tamamlandıklarında, sonuçlarını istekte bulunan sohbet
kanalına **duyururlar**. Her alt ajan çalıştırması bir
[arka plan görevi](/tr/automation/tasks) olarak izlenir.

Yetkilendirmenin arkasındaki güvenlik modeli için bkz.
[Çok ajanlı ve alt ajan sınırları](/tr/gateway/security#multi-agent-and-sub-agent-boundaries).
Alt ajanlar kullanışlı yalıtım ve iş akışı birimleridir, ancak tek bir paylaşılan Gateway içinde düşmanca
çok kiracılı bir yetkilendirme sınırı değildir.

Birincil hedefler:

- Ana çalıştırmayı engellemeden "araştırma / uzun görev / yavaş araç" işlerini paralelleştirmek.
- Alt ajanları varsayılan olarak yalıtılmış tutmak (oturum ayrımı + isteğe bağlı korumalı alan).
- Araç yüzeyinin yanlış kullanılmasını zorlaştırmak: alt ajanlar varsayılan olarak oturum araçlarını almaz.
- Orkestratör desenleri için yapılandırılabilir iç içe geçme derinliğini desteklemek.

<Note>
**Maliyet notu:** her alt ajanın varsayılan olarak kendi bağlamı ve token kullanımı vardır. Ağır veya yinelenen görevler için alt ajanlara daha ucuz bir model ayarlayın ve ana ajanınızı daha yüksek kaliteli bir modelde tutun. `agents.defaults.subagents.model` veya ajan başına geçersiz kılmalarla yapılandırın. Bir alt öğenin gerçekten istekte bulunanın mevcut dökümüne ihtiyacı olduğunda, ajan o tek başlatma için `context: "fork"` isteyebilir. İş parçacığına bağlı alt ajan oturumları varsayılan olarak `context: "fork"` kullanır çünkü mevcut konuşmayı bir takip iş parçacığına dallandırırlar.
</Note>

## Eğik çizgi komutu

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

Geçerli istekte bulunan oturumun etkin çalıştırmasını yönlendirmek için üst düzey [`/steer <message>`](/tr/tools/steer) kullanın. Hedef bir alt çalıştırma olduğunda `/subagents steer <id|#> <message>` kullanın.

`/subagents info` çalıştırma üst verilerini gösterir (durum, zaman damgaları, oturum kimliği,
döküm yolu, temizlik). Sınırlı ve güvenlik filtreli bir geri çağırma görünümü için `sessions_history` kullanın; ham tam döküme ihtiyacınız olduğunda diskteki döküm yolunu inceleyin.

### İş parçacığı bağlama denetimleri

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

`/subagents spawn`, bir arka plan alt ajanını kullanıcı komutu olarak başlatır (iç
aktarım olarak değil) ve çalıştırma tamamlandığında istekte bulunan sohbete tek bir son tamamlanma güncellemesi gönderir.

<AccordionGroup>
  <Accordion title="Engelleyici olmayan, anlık tamamlanma">
    - Başlatma komutu engelleyici değildir; hemen bir çalıştırma kimliği döndürür.
    - Tamamlandığında alt ajan, istekte bulunan sohbet kanalına bir özet/sonuç iletisi duyurur.
    - Tamamlanma anlıktır. Başlatıldıktan sonra, yalnızca bitmesini beklemek için `/subagents list`, `sessions_list` veya `sessions_history` komutlarını bir döngüde yoklamayın; durumu yalnızca hata ayıklama veya müdahale için gerektiğinde inceleyin.
    - Tamamlandığında OpenClaw, duyuru temizlik akışı devam etmeden önce o alt ajan oturumu tarafından açılan izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır.

  </Accordion>
  <Accordion title="Elle başlatma teslim dayanıklılığı">
    - OpenClaw önce kararlı bir idempotency anahtarıyla doğrudan `agent` teslimini dener.
    - İstekte bulunan ajanın tamamlanma dönüşü başarısız olursa, görünür çıktı üretmezse veya yakalanan alt sonuçtan açıkça eksik bir önek döndürürse OpenClaw, yakalanan alt sonuçtan doğrudan tamamlanma teslimine geri döner.
    - Doğrudan teslim kullanılamazsa kuyruk yönlendirmesine geri döner.
    - Kuyruk yönlendirmesi hâlâ kullanılabilir değilse duyuru, son vazgeçmeden önce kısa üstel geri çekilmeyle yeniden denenir.
    - Tamamlanma teslimi çözümlenmiş istekte bulunan rotasını korur: kullanılabilir olduğunda iş parçacığına bağlı veya konuşmaya bağlı tamamlanma rotaları kazanır; tamamlanma kaynağı yalnızca bir kanal sağlıyorsa OpenClaw eksik hedefi/hesabı istekte bulunan oturumun çözümlenmiş rotasından (`lastChannel` / `lastTo` / `lastAccountId`) doldurur, böylece doğrudan teslim yine çalışır.

  </Accordion>
  <Accordion title="Tamamlanma devri üst verileri">
    İstekte bulunan oturuma tamamlanma devri, çalışma zamanı tarafından üretilen
    iç bağlamdır (kullanıcı tarafından yazılmış metin değildir) ve şunları içerir:

    - `Result` — en son görünür `assistant` yanıt metni, yoksa temizlenmiş en son araç/toolResult metni. Terminalde başarısız olan çalıştırmalar yakalanan yanıt metnini yeniden kullanmaz.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompakt çalışma zamanı/token istatistikleri.
    - İstekte bulunan ajana normal asistan sesiyle yeniden yazmasını söyleyen bir teslim talimatı (ham iç üst verileri iletmemesini).

  </Accordion>
  <Accordion title="Kipler ve ACP çalışma zamanı">
    - `--model` ve `--thinking`, o belirli çalıştırma için varsayılanları geçersiz kılar.
    - Tamamlandıktan sonra ayrıntıları ve çıktıyı incelemek için `info`/`log` kullanın.
    - `/subagents spawn` tek seferlik kiptir (`mode: "run"`). Kalıcı iş parçacığına bağlı oturumlar için `thread: true` ve `mode: "session"` ile `sessions_spawn` kullanın.
    - ACP koşum oturumları (Claude Code, Gemini CLI, OpenCode veya açıkça Codex ACP/acpx) için, araç bu çalışma zamanını bildiriyorsa `runtime: "acp"` ile `sessions_spawn` kullanın. Tamamlanmaları veya ajandan ajana döngüleri hata ayıklarken [ACP teslim modeli](/tr/tools/acp-agents#delivery-model) bölümüne bakın. `codex` plugin etkin olduğunda, kullanıcı açıkça ACP/acpx istemedikçe Codex sohbet/iş parçacığı denetimi ACP yerine `/codex ...` tercih etmelidir.
    - OpenClaw, ACP etkinleştirilene, istekte bulunan korumalı alanda olmayana ve `acpx` gibi bir arka uç plugin yüklenene kadar `runtime: "acp"` değerini gizler. `runtime: "acp"` harici bir ACP koşum kimliği veya `runtime.type="acp"` olan bir `agents.list[]` girdisi bekler; `agents_list` içindeki normal OpenClaw yapılandırma ajanları için varsayılan alt ajan çalışma zamanını kullanın.

  </Accordion>
</AccordionGroup>

## Bağlam kipleri

Yerel alt ajanlar, çağıran açıkça geçerli dökümü çatallamayı istemedikçe yalıtılmış başlar.

| Kip        | Ne zaman kullanılır                                                                                                                    | Davranış                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Yeni araştırma, bağımsız uygulama, yavaş araç çalışması veya görev metninde özetlenebilen herhangi bir şey                              | Temiz bir alt döküm oluşturur. Varsayılan budur ve token kullanımını daha düşük tutar. |
| `fork`     | Geçerli konuşmaya, önceki araç sonuçlarına veya istekte bulunan dökümde zaten bulunan nüanslı talimatlara bağlı çalışma                 | Alt öğe başlamadan önce istekte bulunan dökümü alt oturuma dallandırır. |

`fork` değerini sınırlı kullanın. Bu, bağlama duyarlı yetkilendirme içindir; açık bir görev istemi yazmanın yerine geçmez.

## Araç: `sessions_spawn`

Genel `subagent` hattında `deliver: false` ile bir alt ajan çalıştırması başlatır,
ardından bir duyuru adımı çalıştırır ve duyuru yanıtını istekte bulunan
sohbet kanalına gönderir.

Kullanılabilirlik, çağıranın etkin araç ilkesine bağlıdır. `coding` ve
`full` profilleri varsayılan olarak `sessions_spawn` sunar. `messaging` profili
sunmaz; iş yetkilendirmesi yapması gereken ajanlar için `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` ekleyin veya `tools.profile: "coding"` kullanın.
Kanal/grup, sağlayıcı, korumalı alan ve ajan başına izin verme/reddetme ilkeleri
profil aşamasından sonra aracı yine kaldırabilir. Etkin araç listesini doğrulamak için aynı
oturumdan `/tools` kullanın.

**Varsayılanlar:**

- **Model:** `agents.defaults.subagents.model` (veya ajan başına `agents.list[].subagents.model`) ayarlamadığınız sürece çağırandan devralır; açık bir `sessions_spawn.model` yine önceliklidir.
- **Düşünme:** `agents.defaults.subagents.thinking` (veya ajan başına `agents.list[].subagents.thinking`) ayarlamadığınız sürece çağırandan devralır; açık bir `sessions_spawn.thinking` yine önceliklidir.
- **Çalıştırma zaman aşımı:** `sessions_spawn.runTimeoutSeconds` atlanırsa OpenClaw, ayarlandığında `agents.defaults.subagents.runTimeoutSeconds` kullanır; aksi halde `0` (zaman aşımı yok) değerine geri döner.

### Araç parametreleri

<ParamField path="task" type="string" required>
  Alt ajan için görev açıklaması.
</ParamField>
<ParamField path="label" type="string">
  İsteğe bağlı, insan tarafından okunabilir etiket.
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents` tarafından izin verildiğinde başka bir ajan kimliği altında başlatın.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` yalnızca harici ACP koşumları (`claude`, `droid`, `gemini`, `opencode` veya açıkça istenen Codex ACP/acpx) ve `runtime.type` değeri `acp` olan `agents.list[]` girdileri içindir.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Yalnızca ACP. `runtime: "acp"` olduğunda mevcut bir ACP koşum oturumunu sürdürür; yerel alt ajan başlatmaları için yok sayılır.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Yalnızca ACP. `runtime: "acp"` olduğunda ACP çalıştırma çıktısını üst oturuma aktarır; yerel alt ajan başlatmaları için atlayın.
</ParamField>
<ParamField path="model" type="string">
  Alt ajan modelini geçersiz kılın. Geçersiz değerler atlanır ve alt ajan, araç sonucunda bir uyarıyla varsayılan modelde çalışır.
</ParamField>
<ParamField path="thinking" type="string">
  Alt ajan çalıştırması için düşünme düzeyini geçersiz kılın.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Ayarlandığında varsayılan olarak `agents.defaults.subagents.runTimeoutSeconds`, aksi halde `0`. Ayarlandığında alt ajan çalıştırması N saniye sonra durdurulur.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` olduğunda bu alt ajan oturumu için kanal iş parçacığı bağlaması ister.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` ve `mode` atlanmışsa varsayılan `session` olur. `mode: "session"` için `thread: true` gerekir.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` duyurudan hemen sonra arşivler (dökümü yine yeniden adlandırma yoluyla korur).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require`, hedef alt çalışma zamanı korumalı alanda değilse başlatmayı reddeder.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork`, istekte bulunanın geçerli dökümünü alt oturuma dallandırır. Yalnızca yerel alt ajanlar. İş parçacığına bağlı başlatmalar varsayılan olarak `fork`; iş parçacığı olmayan başlatmalar varsayılan olarak `isolated` kullanır.
</ParamField>

<Warning>
`sessions_spawn` kanal teslim parametrelerini kabul etmez (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Teslim için, başlatılan çalıştırmadan
`message`/`sessions_send` kullanın.
</Warning>

## İş parçacığına bağlı oturumlar

Bir kanal için iş parçacığı bağlamaları etkinleştirildiğinde, bir alt ajan
bir iş parçacığına bağlı kalabilir; böylece o iş parçacığındaki takip kullanıcı iletileri
aynı alt ajan oturumuna yönlendirilmeye devam eder.

### İş parçacığını destekleyen kanallar

**Discord** şu anda desteklenen tek kanaldır. Kalıcı iş parçacığına bağlı alt ajan oturumlarını (`thread: true` ile `sessions_spawn`), elle iş parçacığı denetimlerini (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) ve
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` ve
`channels.discord.threadBindings.spawnSessions` adaptör anahtarlarını destekler.

### Hızlı akış

<Steps>
  <Step title="Oluştur">
    `thread: true` (ve isteğe bağlı olarak `mode: "session"`) ile `sessions_spawn`.
  </Step>
  <Step title="Bağla">
    OpenClaw, etkin kanalda bu oturum hedefine bir konu oluşturur veya bağlar.
  </Step>
  <Step title="Takipleri yönlendir">
    Bu konudaki yanıtlar ve takip mesajları bağlı oturuma yönlendirilir.
  </Step>
  <Step title="Zaman aşımlarını incele">
    Etkinsizlikte otomatik odaktan çıkarma ayarını incelemek/güncellemek için `/session idle` ve
    sabit üst sınırı denetlemek için `/session max-age` kullanın.
  </Step>
  <Step title="Ayır">
    Elle ayırmak için `/unfocus` kullanın.
  </Step>
</Steps>

### Elle denetimler

| Komut              | Etki                                                                           |
| ------------------ | ------------------------------------------------------------------------------ |
| `/focus <target>`  | Geçerli konuyu bir alt ajan/oturum hedefine bağla (veya bir tane oluştur)      |
| `/unfocus`         | Geçerli bağlı konu için bağlamayı kaldır                                       |
| `/agents`          | Etkin çalıştırmaları ve bağlama durumunu listele (`thread:<id>` veya `unbound`) |
| `/session idle`    | Boşta otomatik odaktan çıkarmayı incele/güncelle (yalnızca odaktaki bağlı konular) |
| `/session max-age` | Sabit üst sınırı incele/güncelle (yalnızca odaktaki bağlı konular)             |

### Yapılandırma anahtarları

- **Küresel varsayılan:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanal geçersiz kılma ve oluşturma sırasında otomatik bağlama anahtarları** bağdaştırıcıya özeldir. Yukarıdaki [Konu destekleyen kanallar](#thread-supporting-channels) bölümüne bakın.

Güncel bağdaştırıcı ayrıntıları için [Yapılandırma başvurusu](/tr/gateway/configuration-reference) ve
[Slash komutları](/tr/tools/slash-commands) bölümlerine bakın.

### İzin verilenler listesi

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Açık `agentId` üzerinden hedeflenebilecek ajan kimliklerinin listesi (`["*"]` herhangi birine izin verir). Varsayılan: yalnızca istekte bulunan ajan. Bir liste ayarlar ve istekte bulunanın yine `agentId` ile kendisini oluşturmasını istiyorsanız, istekte bulunan kimliğini listeye ekleyin.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  İstekte bulunan ajan kendi `subagents.allowAgents` değerini ayarlamadığında kullanılan varsayılan hedef ajan izin listesi.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` değerini atlayan `sessions_spawn` çağrılarını engelle (açık profil seçimini zorunlu kılar). Ajan başına geçersiz kılma: `agents.list[].subagents.requireAgentId`.
</ParamField>

İstekte bulunan oturum sandbox içindeyse, `sessions_spawn` sandbox dışında çalışacak hedefleri reddeder.

### Keşif

`sessions_spawn` için şu anda hangi ajan kimliklerine izin verildiğini görmek için `agents_list` kullanın. Yanıt, çağıranların Pi, Codex uygulama sunucusu ve diğer yapılandırılmış yerel çalışma zamanlarını ayırt edebilmesi için listelenen her ajanın etkin modelini ve gömülü çalışma zamanı meta verilerini içerir.

### Otomatik arşiv

- Alt ajan oturumları `agents.defaults.subagents.archiveAfterMinutes` sonrasında otomatik olarak arşivlenir (varsayılan `60`).
- Arşiv, `sessions.delete` kullanır ve transkripti `*.deleted.<timestamp>` olarak yeniden adlandırır (aynı klasörde).
- `cleanup: "delete"` duyurudan hemen sonra arşivler (transkripti yine yeniden adlandırma yoluyla tutar).
- Otomatik arşiv en iyi çabayla çalışır; Gateway yeniden başlatılırsa bekleyen zamanlayıcılar kaybolur.
- `runTimeoutSeconds` otomatik arşivlemez; yalnızca çalıştırmayı durdurur. Oturum otomatik arşive kadar kalır.
- Otomatik arşiv, derinlik 1 ve derinlik 2 oturumlarına aynı şekilde uygulanır.
- Tarayıcı temizliği arşiv temizliğinden ayrıdır: izlenen tarayıcı sekmeleri/süreçleri, transkript/oturum kaydı tutulsa bile çalıştırma bittiğinde en iyi çabayla kapatılır.

## İç içe alt ajanlar

Varsayılan olarak, alt ajanlar kendi alt ajanlarını oluşturamaz (`maxSpawnDepth: 1`). Bir iç içe geçme düzeyini etkinleştirmek için `maxSpawnDepth: 2` ayarlayın — **orkestratör kalıbı**: ana → orkestratör alt ajan → çalışan alt-alt ajanlar.

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

| Derinlik | Oturum anahtarı biçimi                         | Rol                                               | Oluşturabilir mi?            |
| -------- | ---------------------------------------------- | ------------------------------------------------- | ---------------------------- |
| 0        | `agent:<id>:main`                              | Ana ajan                                          | Her zaman                    |
| 1        | `agent:<id>:subagent:<uuid>`                   | Alt ajan (derinlik 2 izinliyse orkestratör)       | Yalnızca `maxSpawnDepth >= 2` |
| 2        | `agent:<id>:subagent:<uuid>:subagent:<uuid>`   | Alt-alt ajan (uç çalışan)                         | Asla                         |

### Duyuru zinciri

Sonuçlar zincirde yukarı doğru akar:

1. Derinlik 2 çalışanı biter → üst öğesine (derinlik 1 orkestratör) duyurur.
2. Derinlik 1 orkestratör duyuruyu alır, sonuçları sentezler, biter → ana ajana duyurur.
3. Ana ajan duyuruyu alır ve kullanıcıya iletir.

Her düzey yalnızca doğrudan çocuklarından gelen duyuruları görür.

<Note>
**Operasyonel rehberlik:** `sessions_list`,
`sessions_history`, `/subagents list` veya `exec` uyku komutları etrafında yoklama döngüleri kurmak yerine çocuk işi bir kez başlatın ve tamamlama olaylarını bekleyin.
`sessions_list` ve `/subagents list`, çocuk oturum ilişkilerini canlı işe odaklı tutar — canlı çocuklar bağlı kalır, biten çocuklar kısa bir yakın zaman penceresinde görünür kalır ve yalnızca depoda bulunan eski çocuk bağlantıları tazelik penceresinden sonra yok sayılır. Bu, eski `spawnedBy` /
`parentSessionKey` meta verilerinin yeniden başlatma sonrasında hayalet çocukları yeniden diriltmesini önler. Bir çocuk tamamlama olayı, siz nihai yanıtı zaten gönderdikten sonra gelirse doğru takip, tam sessiz belirteç olan
`NO_REPLY` / `no_reply` değeridir.
</Note>

### Derinliğe göre araç ilkesi

- Rol ve denetim kapsamı, oluşturma sırasında oturum meta verilerine yazılır. Bu, düz veya geri yüklenmiş oturum anahtarlarının yanlışlıkla orkestratör ayrıcalıklarını yeniden kazanmasını önler.
- **Derinlik 1 (orkestratör, `maxSpawnDepth >= 2` olduğunda):** çocuklarını yönetebilmesi için `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` alır. Diğer oturum/sistem araçları reddedilmiş kalır.
- **Derinlik 1 (uç, `maxSpawnDepth == 1` olduğunda):** oturum aracı yoktur (geçerli varsayılan davranış).
- **Derinlik 2 (uç çalışan):** oturum aracı yoktur — `sessions_spawn` derinlik 2'de her zaman reddedilir. Daha fazla çocuk oluşturamaz.

### Ajan başına oluşturma sınırı

Her ajan oturumunun (herhangi bir derinlikte) aynı anda en fazla `maxChildrenPerAgent`
(varsayılan `5`) etkin çocuğu olabilir. Bu, tek bir orkestratörden denetimsiz yayılmayı önler.

### Kademeli durdurma

Bir derinlik 1 orkestratörü durdurmak, tüm derinlik 2 çocuklarını otomatik olarak durdurur:

- Ana sohbette `/stop`, tüm derinlik 1 ajanlarını durdurur ve onların derinlik 2 çocuklarına kademeli olarak uygular.
- `/subagents kill <id>` belirli bir alt ajanı durdurur ve çocuklarına kademeli olarak uygular.
- `/subagents kill all` istekte bulunan için tüm alt ajanları durdurur ve kademeli uygular.

## Kimlik doğrulama

Alt ajan kimlik doğrulaması oturum türüne göre değil, **ajan kimliğine** göre çözümlenir:

- Alt ajan oturum anahtarı `agent:<agentId>:subagent:<uuid>` şeklindedir.
- Kimlik doğrulama deposu bu ajanın `agentDir` dizininden yüklenir.
- Ana ajanın kimlik doğrulama profilleri **yedek** olarak birleştirilir; çakışmalarda ajan profilleri ana profillerin üzerine yazar.

Birleştirme eklemelidir, bu yüzden ana profiller her zaman yedek olarak kullanılabilir. Ajan başına tamamen yalıtılmış kimlik doğrulama henüz desteklenmez.

## Duyuru

Alt ajanlar bir duyuru adımıyla geri bildirim yapar:

- Duyuru adımı, istekte bulunan oturumda değil, alt ajan oturumunun içinde çalışır.
- Alt ajan tam olarak `ANNOUNCE_SKIP` yanıtını verirse hiçbir şey gönderilmez.
- En son asistan metni tam sessiz belirteç olan `NO_REPLY` / `no_reply` ise, daha önce görünür ilerleme olsa bile duyuru çıktısı bastırılır.

Teslim, istekte bulunanın derinliğine bağlıdır:

- Üst düzey istekte bulunan oturumlar, harici teslimatla (`deliver=true`) bir takip `agent` çağrısı kullanır.
- İç içe istekte bulunan alt ajan oturumları, orkestratörün çocuk sonuçlarını oturum içinde sentezleyebilmesi için dahili bir takip eklemesi (`deliver=false`) alır.
- İç içe istekte bulunan bir alt ajan oturumu yoksa, OpenClaw mümkün olduğunda o oturumun istekte bulunanına geri döner.

Üst düzey istekte bulunan oturumlar için, tamamlama modu doğrudan teslim önce bağlı konuşma/konu rotasını ve hook geçersiz kılmasını çözer, ardından eksik kanal hedefi alanlarını istekte bulunan oturumun saklanan rotasından doldurur. Bu, tamamlama kaynağı yalnızca kanalı tanımlasa bile tamamlamaları doğru sohbet/konuda tutar.

Çocuk tamamlama toplaması, iç içe tamamlama bulguları oluşturulurken geçerli istekte bulunan çalıştırmayla sınırlanır ve eski önceki çalıştırma çocuk çıktılarının geçerli duyuruya sızmasını önler. Duyuru yanıtları, kanal bağdaştırıcılarında mevcut olduğunda konu/başlık yönlendirmesini korur.

### Duyuru bağlamı

Duyuru bağlamı kararlı bir dahili olay bloğuna normalleştirilir:

| Alan           | Kaynak                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Kaynak         | `subagent` veya `cron`                                                                                                    |
| Oturum kimlikleri | Çocuk oturum anahtarı/kimliği                                                                                         |
| Tür            | Duyuru türü + görev etiketi                                                                                               |
| Durum          | Çalışma zamanı sonucundan türetilir (`success`, `error`, `timeout` veya `unknown`) — model metninden **çıkarılmaz**       |
| Sonuç içeriği  | En son görünür asistan metni, yoksa temizlenmiş en son araç/toolResult metni                                              |
| Takip          | Ne zaman yanıt verileceğini ve ne zaman sessiz kalınacağını açıklayan talimat                                             |

Terminal başarısız çalıştırmalar, yakalanan yanıt metnini yeniden oynatmadan hata durumunu bildirir. Zaman aşımında, çocuk yalnızca araç çağrılarına kadar ilerlediyse duyuru, ham araç çıktısını yeniden oynatmak yerine bu geçmişi kısa bir kısmi ilerleme özetine daraltabilir.

### İstatistik satırı

Duyuru yükleri en sonda bir istatistik satırı içerir (sarılmış olsa bile):

- Çalışma zamanı (örn. `runtime 5m12s`).
- Token kullanımı (girdi/çıktı/toplam).
- Model fiyatlandırması yapılandırıldığında tahmini maliyet (`models.providers.*.models[].cost`).
- Ana ajanın `sessions_history` üzerinden geçmişi getirebilmesi veya diskteki dosyayı inceleyebilmesi için `sessionKey`, `sessionId` ve transkript yolu.

Dahili meta veriler yalnızca orkestrasyon içindir; kullanıcıya yönelik yanıtlar normal asistan sesiyle yeniden yazılmalıdır.

### Neden `sessions_history` tercih edilmeli

`sessions_history` daha güvenli orkestrasyon yoludur:

- Asistan hatırlaması önce normalleştirilir: düşünme etiketleri çıkarılır; `<relevant-memories>` / `<relevant_memories>` iskeleti çıkarılır; düz metin araç çağrısı XML yük blokları (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) çıkarılır; temiz kapanmayan kesilmiş yükler dahil; düşürülmüş araç çağrısı/sonuç iskeleti ve geçmiş bağlam işaretçileri çıkarılır; sızmış model denetim tokenları (`<|assistant|>`, diğer ASCII `<|...|>`, tam genişlikli `<｜...｜>`) çıkarılır; hatalı biçimli MiniMax araç çağrısı XML'i çıkarılır.
- Kimlik bilgisi/token benzeri metin redakte edilir.
- Uzun bloklar kısaltılabilir.
- Çok büyük geçmişler eski satırları düşürebilir veya aşırı büyük bir satırı `[sessions_history omitted: message too large]` ile değiştirebilir.
- Tam bayt bayt transkripte ihtiyacınız olduğunda diskteki ham transkript incelemesi yedek yoldur.

## Araç ilkesi

Alt ajanlar, önce üst veya hedef ajanla aynı profil ve araç ilkesi hattını kullanır. Bundan sonra OpenClaw, alt ajan kısıtlama katmanını uygular.

Kısıtlayıcı bir `tools.profile` olmadığında alt ajanlar, **oturum araçları dışında tüm araçları** ve sistem araçlarını alır:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` burada da sınırlı, temizlenmiş bir geri çağırma görünümü olarak kalır — ham bir transkript dökümü değildir.

`maxSpawnDepth >= 2` olduğunda, derinlik-1 orkestratör alt ajanları ayrıca `sessions_spawn`, `subagents`, `sessions_list` ve `sessions_history` alır; böylece kendi çocuklarını yönetebilirler.

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

`tools.subagents.tools.allow` son bir yalnızca izin filtresidir. Zaten çözümlenmiş araç kümesini daraltabilir, ancak `tools.profile` tarafından kaldırılmış bir aracı **geri ekleyemez**. Örneğin, `tools.profile: "coding"` `web_search`/`web_fetch` içerir ancak `browser` aracını içermez. Kodlama profilli alt ajanların tarayıcı otomasyonu kullanmasına izin vermek için profil aşamasında browser ekleyin:

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

Alt ajanlar ayrılmış bir süreç içi kuyruk hattı kullanır:

- **Hat adı:** `subagent`
- **Eşzamanlılık:** `agents.defaults.subagents.maxConcurrent` (varsayılan `8`)

## Canlılık ve kurtarma

OpenClaw, `endedAt` yokluğunu bir alt ajanın hâlâ canlı olduğuna dair kalıcı kanıt olarak değerlendirmez. Bayat çalıştırma penceresinden daha eski, sonlandırılmamış çalıştırmalar `/subagents list`, durum özetleri, alt nesil tamamlama kapıları ve oturum başına eşzamanlılık kontrollerinde etkin/beklemede sayılmayı bırakır.

Gateway yeniden başlatıldıktan sonra, çocuk oturumları `abortedLastRun: true` olarak işaretli değilse bayat, sonlandırılmamış geri yüklenen çalıştırmalar budanır. Bu yeniden başlatma nedeniyle iptal edilmiş çocuk oturumları, alt ajan sahipsiz kurtarma akışı üzerinden kurtarılabilir kalır; bu akış, iptal işaretini temizlemeden önce sentetik bir sürdürme iletisi gönderir.

Otomatik yeniden başlatma kurtarması çocuk oturumu başına sınırlıdır. Aynı alt ajan çocuğu hızlı yeniden takılma penceresi içinde tekrar tekrar sahipsiz kurtarma için kabul edilirse OpenClaw, o oturumda bir kurtarma mezar taşı kalıcılaştırır ve sonraki yeniden başlatmalarda onu otomatik olarak sürdürmeyi durdurur. Görev kaydını uzlaştırmak için `openclaw tasks maintenance --apply` çalıştırın veya mezar taşlı oturumlardaki bayat iptal edilmiş kurtarma bayraklarını temizlemek için `openclaw doctor --fix` çalıştırın.

<Note>
Bir alt ajan oluşturma işlemi Gateway `PAIRING_REQUIRED` / `scope-upgrade` ile başarısız olursa, eşleştirme durumunu düzenlemeden önce RPC çağırıcısını kontrol edin. Dahili `sessions_spawn` koordinasyonu, doğrudan local loopback paylaşılan belirteç/parola kimlik doğrulaması üzerinden `client.id: "gateway-client"` ve `client.mode: "backend"` ile bağlanmalıdır; bu yol, CLI'nin eşleştirilmiş cihaz kapsamı taban çizgisine bağlı değildir. Uzak çağırıcılar, açık `deviceIdentity`, açık cihaz belirteci yolları ve tarayıcı/node istemcileri kapsam yükseltmeleri için yine normal cihaz onayına ihtiyaç duyar.
</Note>

## Durdurma

- İstekte bulunan sohbette `/stop` göndermek, istekte bulunan oturumu iptal eder ve ondan oluşturulmuş etkin alt ajan çalıştırmalarını durdurarak iç içe çocuklara kadar kademeli olarak uygular.
- `/subagents kill <id>` belirli bir alt ajanı durdurur ve çocuklarına kademeli olarak uygular.

## Sınırlamalar

- Alt ajan duyurusu **en iyi çaba** esaslıdır. Gateway yeniden başlatılırsa bekleyen "geri duyur" işi kaybolur.
- Alt ajanlar yine aynı Gateway süreç kaynaklarını paylaşır; `maxConcurrent` değerini bir güvenlik vanası olarak değerlendirin.
- `sessions_spawn` her zaman engellemesizdir: hemen `{ status: "accepted", runId, childSessionKey }` döndürür.
- Alt ajan bağlamı yalnızca `AGENTS.md` + `TOOLS.md` enjekte eder (`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` veya `BOOTSTRAP.md` yoktur).
- Maksimum iç içe geçme derinliği 5'tir (`maxSpawnDepth` aralığı: 1–5). Çoğu kullanım durumu için derinlik 2 önerilir.
- `maxChildrenPerAgent`, oturum başına etkin çocukları sınırlar (varsayılan `5`, aralık `1–20`).

## İlgili

- [ACP ajanları](/tr/tools/acp-agents)
- [Ajan gönderimi](/tr/tools/agent-send)
- [Arka plan görevleri](/tr/automation/tasks)
- [Çok ajanlı korumalı alan araçları](/tr/tools/multi-agent-sandbox-tools)
