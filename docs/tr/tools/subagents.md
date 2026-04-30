---
read_when:
    - Ajan aracılığıyla arka plan veya paralel çalışma istiyorsunuz
    - sessions_spawn veya alt ajan araç politikasını değiştiriyorsunuz
    - İş parçacığına bağlı alt ajan oturumlarını uyguluyor veya sorunlarını gideriyorsunuz
sidebarTitle: Sub-agents
summary: Sonuçları istekte bulunan sohbete geri bildiren yalıtılmış arka plan ajan çalıştırmaları başlatın
title: Alt ajanlar
x-i18n:
    generated_at: "2026-04-30T09:51:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84386ea706873cf9f2ea03261f916c8fb01304999f2d9fa86e037e734a62bf7e
    source_path: tools/subagents.md
    workflow: 16
---

Alt ajanlar, mevcut bir ajan çalıştırmasından başlatılan arka plan ajan çalıştırmalarıdır.
Kendi oturumlarında (`agent:<agentId>:subagent:<uuid>`) çalışırlar ve,
tamamlandıklarında, sonuçlarını istekte bulunan sohbet kanalına **duyururlar**.
Her alt ajan çalıştırması bir
[arka plan görevi](/tr/automation/tasks) olarak izlenir.

Birincil hedefler:

- Ana çalıştırmayı engellemeden "araştırma / uzun görev / yavaş araç" işlerini paralelleştirmek.
- Alt ajanları varsayılan olarak yalıtılmış tutmak (oturum ayrımı + isteğe bağlı sandbox).
- Araç yüzeyinin yanlış kullanılmasını zorlaştırmak: alt ajanlar varsayılan olarak oturum araçlarını almaz.
- Orkestratör kalıpları için yapılandırılabilir iç içe geçme derinliğini desteklemek.

<Note>
**Maliyet notu:** her alt ajanın varsayılan olarak kendi bağlamı ve token kullanımı vardır.
Ağır veya tekrarlı görevler için alt ajanlara daha ucuz bir model ayarlayın
ve ana ajanınızı daha yüksek kaliteli bir modelde tutun. `agents.defaults.subagents.model`
veya ajan bazlı geçersiz kılmalarla yapılandırın. Bir alt ajan gerçekten
istekte bulunanın mevcut konuşma dökümüne ihtiyaç duyduğunda, ajan yalnızca
o başlatma için `context: "fork"` isteyebilir.
</Note>

## Slash komutu

**Geçerli oturum** için alt ajan çalıştırmalarını incelemek veya denetlemek üzere
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

`/subagents info` çalıştırma meta verilerini (durum, zaman damgaları, oturum kimliği,
konuşma dökümü yolu, temizlik) gösterir. Sınırlı, güvenlik filtresinden geçirilmiş
anımsama görünümü için `sessions_history` kullanın; ham tam konuşma dökümüne
ihtiyaç duyduğunuzda diskteki konuşma dökümü yolunu inceleyin.

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

`/subagents spawn`, bir arka plan alt ajanını kullanıcı komutu olarak başlatır
(dahili aktarma değil) ve çalıştırma tamamlandığında istekte bulunan sohbete
tek bir son tamamlanma güncellemesi gönderir.

<AccordionGroup>
  <Accordion title="Engellemeyen, itme tabanlı tamamlanma">
    - Başlatma komutu engellemez; hemen bir çalıştırma kimliği döndürür.
    - Tamamlandığında alt ajan, istekte bulunan sohbet kanalına bir özet/sonuç mesajı duyurur.
    - Tamamlanma itme tabanlıdır. Başlatıldıktan sonra, yalnızca bitmesini beklemek için `/subagents list`, `sessions_list` veya `sessions_history` komutlarını döngü içinde yoklamayın; durumu yalnızca hata ayıklama veya müdahale için gerektiğinde inceleyin.
    - Tamamlandığında OpenClaw, duyuru temizleme akışı devam etmeden önce bu alt ajan oturumu tarafından açılmış izlenen tarayıcı sekmelerini/süreçlerini en iyi çabayla kapatır.

  </Accordion>
  <Accordion title="Elle başlatma teslimat dayanıklılığı">
    - OpenClaw önce kararlı bir idempotency anahtarıyla doğrudan `agent` teslimatını dener.
    - Doğrudan teslimat başarısız olursa kuyruk yönlendirmesine geri döner.
    - Kuyruk yönlendirmesi hâlâ kullanılamıyorsa, son vazgeçmeden önce duyuru kısa üstel geri çekilmeyle yeniden denenir.
    - Tamamlanma teslimatı çözümlenen istekte bulunan rotasını korur: kullanılabiliyorsa konuya bağlı veya konuşmaya bağlı tamamlanma rotaları kazanır; tamamlanma kaynağı yalnızca bir kanal sağlıyorsa, OpenClaw eksik hedefi/hesabı istekte bulunan oturumun çözümlenen rotasından (`lastChannel` / `lastTo` / `lastAccountId`) doldurur, böylece doğrudan teslimat yine çalışır.

  </Accordion>
  <Accordion title="Tamamlanma devri meta verileri">
    İstekte bulunan oturuma tamamlanma devri, çalışma zamanında oluşturulan
    dahili bağlamdır (kullanıcı tarafından yazılmış metin değildir) ve şunları içerir:

    - `Result` — en son görünür `assistant` yanıt metni, yoksa temizlenmiş en son araç/toolResult metni. Terminal başarısız çalıştırmalar yakalanmış yanıt metnini yeniden kullanmaz.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompakt çalışma zamanı/token istatistikleri.
    - İstekte bulunan ajana normal asistan sesiyle yeniden yazmasını söyleyen bir teslimat talimatı (ham dahili meta veriyi iletmesini değil).

  </Accordion>
  <Accordion title="Modlar ve ACP çalışma zamanı">
    - `--model` ve `--thinking`, ilgili çalıştırma için varsayılanları geçersiz kılar.
    - Tamamlanmadan sonra ayrıntıları ve çıktıyı incelemek için `info`/`log` kullanın.
    - `/subagents spawn` tek seferlik moddur (`mode: "run"`). Kalıcı konuya bağlı oturumlar için `thread: true` ve `mode: "session"` ile `sessions_spawn` kullanın.
    - ACP harness oturumları (Claude Code, Gemini CLI, OpenCode veya açıkça Codex ACP/acpx) için, araç bu çalışma zamanını ilan ettiğinde `runtime: "acp"` ile `sessions_spawn` kullanın. Tamamlanmaları veya ajandan ajana döngüleri hata ayıklarken [ACP teslimat modeli](/tr/tools/acp-agents#delivery-model) bölümüne bakın. `codex` Plugin etkin olduğunda, kullanıcı açıkça ACP/acpx istemedikçe Codex sohbet/konu denetimi ACP yerine `/codex ...` tercih etmelidir.
    - OpenClaw, ACP etkinleştirilene, istekte bulunan sandbox içinde olmayana ve `acpx` gibi bir arka uç Plugin yüklenene kadar `runtime: "acp"` değerini gizler. `runtime: "acp"` harici bir ACP harness kimliği veya `runtime.type="acp"` olan bir `agents.list[]` girişi bekler; `agents_list` içindeki normal OpenClaw yapılandırma ajanları için varsayılan alt ajan çalışma zamanını kullanın.

  </Accordion>
</AccordionGroup>

## Bağlam modları

Yerel alt ajanlar, çağıran açıkça mevcut konuşma dökümünü çatallamayı istemedikçe
yalıtılmış başlar.

| Mod        | Ne zaman kullanılır                                                                                                                    | Davranış                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Yeni araştırma, bağımsız uygulama, yavaş araç işi veya görev metninde özetlenebilecek herhangi bir şey                                | Temiz bir alt konuşma dökümü oluşturur. Varsayılan budur ve token kullanımını düşük tutar. |
| `fork`     | Mevcut konuşmaya, önceki araç sonuçlarına veya istekte bulunan konuşma dökümünde zaten bulunan nüanslı talimatlara bağlı iş           | Alt ajan başlamadan önce istekte bulunanın konuşma dökümünü alt oturuma dallandırır. |

`fork` değerini idareli kullanın. Bu, bağlama duyarlı delegasyon içindir;
net bir görev istemi yazmanın yerine geçmez.

## Araç: `sessions_spawn`

Global `subagent` hattında `deliver: false` ile bir alt ajan çalıştırması başlatır,
ardından bir duyuru adımı çalıştırır ve duyuru yanıtını istekte bulunan sohbet
kanalına gönderir.

Kullanılabilirlik, çağıranın etkili araç politikasına bağlıdır. `coding` ve
`full` profilleri varsayılan olarak `sessions_spawn` sunar. `messaging` profili
sunmaz; iş devredecek ajanlar için `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` ekleyin veya `tools.profile: "coding"` kullanın. Kanal/grup,
sağlayıcı, sandbox ve ajan bazlı izin/verme politikaları profil aşamasından
sonra aracı yine kaldırabilir. Etkili araç listesini doğrulamak için aynı
oturumdan `/tools` kullanın.

**Varsayılanlar:**

- **Model:** `agents.defaults.subagents.model` (veya ajan bazlı `agents.list[].subagents.model`) ayarlamadığınız sürece çağırandan devralır; açık bir `sessions_spawn.model` yine de kazanır.
- **Thinking:** `agents.defaults.subagents.thinking` (veya ajan bazlı `agents.list[].subagents.thinking`) ayarlamadığınız sürece çağırandan devralır; açık bir `sessions_spawn.thinking` yine de kazanır.
- **Çalıştırma zaman aşımı:** `sessions_spawn.runTimeoutSeconds` atlanırsa OpenClaw, ayarlandıysa `agents.defaults.subagents.runTimeoutSeconds` kullanır; aksi takdirde `0` değerine (zaman aşımı yok) geri döner.

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
  `acp` yalnızca harici ACP harness’leri (`claude`, `droid`, `gemini`, `opencode` veya açıkça istenmiş Codex ACP/acpx) ve `runtime.type` değeri `acp` olan `agents.list[]` girişleri içindir.
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
  Ayarlandığında varsayılan olarak `agents.defaults.subagents.runTimeoutSeconds`, aksi takdirde `0`. Ayarlandığında alt ajan çalıştırması N saniye sonra iptal edilir.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` olduğunda, bu alt ajan oturumu için kanal konusu bağlaması ister.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` ve `mode` atlanırsa varsayılan `session` olur. `mode: "session"`, `thread: true` gerektirir.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` duyurudan hemen sonra arşivler (yeniden adlandırma yoluyla konuşma dökümünü yine saklar).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require`, hedef alt çalışma zamanı sandbox içinde olmadıkça başlatmayı reddeder.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork`, istekte bulunanın mevcut konuşma dökümünü alt oturuma dallandırır. Yalnızca yerel alt ajanlar. `fork` değerini yalnızca alt ajanın mevcut konuşma dökümüne ihtiyacı olduğunda kullanın.
</ParamField>

<Warning>
`sessions_spawn` kanal teslimatı parametrelerini (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`) kabul etmez. Teslimat için
başlatılan çalıştırmadan `message`/`sessions_send` kullanın.
</Warning>

## Konuya bağlı oturumlar

Bir kanal için konu bağlamaları etkinleştirildiğinde, bir alt ajan bir konuya
bağlı kalabilir; böylece o konudaki takip kullanıcı mesajları aynı alt ajan
oturumuna yönlendirilmeye devam eder.

### Konu destekleyen kanallar

**Discord** şu anda desteklenen tek kanaldır. Kalıcı konuya bağlı alt ajan
oturumlarını (`thread: true` ile `sessions_spawn`), manuel konu denetimlerini
(`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ve
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` ve
`channels.discord.threadBindings.spawnSubagentSessions` adaptör anahtarlarını destekler.

### Hızlı akış

<Steps>
  <Step title="Başlat">
    `thread: true` (ve isteğe bağlı olarak `mode: "session"`) ile `sessions_spawn`.
  </Step>
  <Step title="Bağla">
    OpenClaw, etkin kanalda bu oturum hedefine bir konu oluşturur veya bağlar.
  </Step>
  <Step title="Takipleri yönlendir">
    Bu konudaki yanıtlar ve takip mesajları bağlı oturuma yönlendirilir.
  </Step>
  <Step title="Zaman aşımlarını incele">
    Etkinliksizlikte otomatik odak kaldırmayı incelemek/güncellemek için `/session idle`
    ve katı üst sınırı denetlemek için `/session max-age` kullanın.
  </Step>
  <Step title="Ayır">
    Manuel olarak ayırmak için `/unfocus` kullanın.
  </Step>
</Steps>

### Manuel denetimler

| Komut              | Etki                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| `/focus <target>`  | Geçerli iş parçacığını (veya yeni bir tane oluşturup) bir alt ajan/oturum hedefine bağla |
| `/unfocus`         | Geçerli bağlı iş parçacığının bağını kaldır                          |
| `/agents`          | Etkin çalıştırmaları ve bağ durumunu listele (`thread:<id>` veya `unbound`) |
| `/session idle`    | Boşta otomatik odaktan çıkarma ayarını incele/güncelle (yalnızca odaklanmış bağlı iş parçacıkları) |
| `/session max-age` | Sabit üst sınırı incele/güncelle (yalnızca odaklanmış bağlı iş parçacıkları) |

### Yapılandırma anahtarları

- **Genel varsayılan:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanal geçersiz kılma ve oluşturma sırasında otomatik bağlama anahtarları** adaptöre özeldir. Yukarıdaki [İş parçacığını destekleyen kanallar](#thread-supporting-channels) bölümüne bakın.

Geçerli adaptör ayrıntıları için [Yapılandırma başvurusu](/tr/gateway/configuration-reference) ve
[Eğik çizgi komutları](/tr/tools/slash-commands) bölümlerine bakın.

### İzin listesi

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Açık `agentId` ile hedeflenebilecek ajan kimliklerinin listesi (`["*"]` herhangi birine izin verir). Varsayılan: yalnızca istekte bulunan ajan. Bir liste ayarlarsanız ve yine de istekte bulunanın `agentId` ile kendisini oluşturmasını istiyorsanız, istekte bulunan kimliğini listeye ekleyin.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  İstekte bulunan ajan kendi `subagents.allowAgents` değerini ayarlamadığında kullanılan varsayılan hedef ajan izin listesi.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` içermeyen `sessions_spawn` çağrılarını engelle (açık profil seçimini zorunlu kılar). Ajan başına geçersiz kılma: `agents.list[].subagents.requireAgentId`.
</ParamField>

İstekte bulunan oturum sandbox içindeyse, `sessions_spawn` sandbox dışı
çalışacak hedefleri reddeder.

### Keşif

`sessions_spawn` için şu anda hangi ajan kimliklerine izin verildiğini
görmek üzere `agents_list` kullanın. Yanıt, çağıranların PI, Codex
uygulama sunucusu ve diğer yapılandırılmış yerel çalışma zamanlarını ayırt edebilmesi için
listelenen her ajanın etkin modelini ve gömülü çalışma zamanı meta verilerini içerir.

### Otomatik arşivleme

- Alt ajan oturumları `agents.defaults.subagents.archiveAfterMinutes` sonrasında otomatik olarak arşivlenir (varsayılan `60`).
- Arşivleme `sessions.delete` kullanır ve dökümü `*.deleted.<timestamp>` olarak yeniden adlandırır (aynı klasör).
- `cleanup: "delete"` duyurudan hemen sonra arşivler (dökümü yeniden adlandırma yoluyla yine saklar).
- Otomatik arşivleme en iyi çaba esasına dayanır; Gateway yeniden başlatılırsa bekleyen zamanlayıcılar kaybolur.
- `runTimeoutSeconds` otomatik arşivleme yapmaz; yalnızca çalıştırmayı durdurur. Oturum otomatik arşivlemeye kadar kalır.
- Otomatik arşivleme, derinlik-1 ve derinlik-2 oturumlarına eşit şekilde uygulanır.
- Tarayıcı temizliği arşiv temizliğinden ayrıdır: döküm/oturum kaydı saklansa bile, izlenen tarayıcı sekmeleri/süreçleri çalıştırma bittiğinde en iyi çaba ile kapatılır.

## İç içe alt ajanlar

Varsayılan olarak, alt ajanlar kendi alt ajanlarını oluşturamaz
(`maxSpawnDepth: 1`). Bir seviye iç içe geçmeyi etkinleştirmek için
`maxSpawnDepth: 2` ayarlayın — **orkestratör deseni**: ana → orkestratör alt ajan →
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

### Derinlik seviyeleri

| Derinlik | Oturum anahtarı biçimi                         | Rol                                           | Oluşturabilir mi?            |
| -------- | ---------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0        | `agent:<id>:main`                              | Ana ajan                                      | Her zaman                    |
| 1        | `agent:<id>:subagent:<uuid>`                   | Alt ajan (derinlik 2 izinliyse orkestratör)   | Yalnızca `maxSpawnDepth >= 2` ise |
| 2        | `agent:<id>:subagent:<uuid>:subagent:<uuid>`   | Alt-alt ajan (yaprak çalışan)                 | Asla                         |

### Duyuru zinciri

Sonuçlar zincirde yukarı doğru akar:

1. Derinlik-2 çalışan bitirir → ebeveynine duyurur (derinlik-1 orkestratör).
2. Derinlik-1 orkestratör duyuruyu alır, sonuçları sentezler, bitirir → ana ajana duyurur.
3. Ana ajan duyuruyu alır ve kullanıcıya iletir.

Her seviye yalnızca doğrudan çocuklarından gelen duyuruları görür.

<Note>
**Operasyonel rehberlik:** `sessions_list`,
`sessions_history`, `/subagents list` veya `exec` uyku komutları etrafında yoklama döngüleri oluşturmak yerine çocuk işi bir kez başlatın ve tamamlanma
olaylarını bekleyin.
`sessions_list` ve `/subagents list`, çocuk oturum ilişkilerini
canlı işe odaklı tutar — canlı çocuklar bağlı kalır, sona eren çocuklar kısa bir yakın geçmiş penceresinde
görünür kalır ve yalnızca depoda kalmış eski çocuk bağlantıları tazelik pencerelerinden sonra
yok sayılır. Bu, eski `spawnedBy` /
`parentSessionKey` meta verilerinin yeniden başlatma sonrasında hayalet çocukları diriltmesini önler. Son yanıtı zaten gönderdikten sonra bir çocuk tamamlanma olayı gelirse, doğru takip yanıtı tam sessiz belirteç olan
`NO_REPLY` / `no_reply` olmalıdır.
</Note>

### Derinliğe göre araç politikası

- Rol ve kontrol kapsamı, oluşturma sırasında oturum meta verilerine yazılır. Bu, düzleştirilmiş veya geri yüklenmiş oturum anahtarlarının yanlışlıkla orkestratör ayrıcalıklarını yeniden kazanmasını engeller.
- **Derinlik 1 (orkestratör, `maxSpawnDepth >= 2` olduğunda):** çocuklarını yönetebilmesi için `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` alır. Diğer oturum/sistem araçları reddedilmeye devam eder.
- **Derinlik 1 (yaprak, `maxSpawnDepth == 1` olduğunda):** oturum aracı yoktur (geçerli varsayılan davranış).
- **Derinlik 2 (yaprak çalışan):** oturum aracı yoktur — `sessions_spawn` derinlik 2'de her zaman reddedilir. Daha fazla çocuk oluşturamaz.

### Ajan başına oluşturma sınırı

Her ajan oturumunun (herhangi bir derinlikte) aynı anda en fazla `maxChildrenPerAgent`
(varsayılan `5`) etkin çocuğu olabilir. Bu, tek bir orkestratörden
kontrolden çıkan yayılmayı önler.

### Kademeli durdurma

Bir derinlik-1 orkestratörü durdurmak, tüm derinlik-2
çocuklarını otomatik olarak durdurur:

- Ana sohbette `/stop`, tüm derinlik-1 ajanları durdurur ve onların derinlik-2 çocuklarına kademeli uygulanır.
- `/subagents kill <id>` belirli bir alt ajanı durdurur ve çocuklarına kademeli uygulanır.
- `/subagents kill all` istekte bulunan için tüm alt ajanları durdurur ve kademeli uygulanır.

## Kimlik doğrulama

Alt ajan kimlik doğrulaması oturum türüne göre değil, **ajan kimliğine** göre çözümlenir:

- Alt ajan oturum anahtarı `agent:<agentId>:subagent:<uuid>` şeklindedir.
- Kimlik doğrulama deposu o ajanın `agentDir` konumundan yüklenir.
- Ana ajanın kimlik doğrulama profilleri **geri dönüş** olarak birleştirilir; çakışmalarda ajan profilleri ana profilleri geçersiz kılar.

Birleştirme eklemelidir, bu nedenle ana profiller her zaman geri dönüş olarak
kullanılabilir. Ajan başına tamamen yalıtılmış kimlik doğrulama henüz desteklenmez.

## Duyuru

Alt ajanlar bir duyuru adımıyla geri bildirir:

- Duyuru adımı alt ajan oturumu içinde çalışır (istekte bulunan oturumda değil).
- Alt ajan tam olarak `ANNOUNCE_SKIP` yanıtını verirse hiçbir şey gönderilmez.
- En son asistan metni tam sessiz belirteç olan `NO_REPLY` / `no_reply` ise, daha önce görünür ilerleme olsa bile duyuru çıktısı bastırılır.

Teslimat istekte bulunanın derinliğine bağlıdır:

- Üst seviye istekte bulunan oturumları, harici teslimatla (`deliver=true`) takip `agent` çağrısı kullanır.
- İç içe istekte bulunan alt ajan oturumları dahili bir takip enjeksiyonu (`deliver=false`) alır; böylece orkestratör çocuk sonuçlarını oturum içinde sentezleyebilir.
- İç içe istekte bulunan alt ajan oturumu artık yoksa, OpenClaw mevcut olduğunda o oturumun istekte bulunanına geri döner.

Üst seviye istekte bulunan oturumları için, tamamlama modu doğrudan teslimat önce
bağlı konuşma/iş parçacığı rotasını ve kanca geçersiz kılmasını çözümler, ardından
eksik kanal hedef alanlarını istekte bulunan oturumun saklanan rotasından doldurur.
Bu, tamamlama kaynağı yalnızca kanalı tanımlasa bile tamamlamaların doğru sohbet/konuda kalmasını sağlar.

İç içe tamamlama bulguları oluşturulurken çocuk tamamlama toplaması geçerli istekte bulunan çalıştırmasına kapsamlanır; böylece önceki çalıştırmalardan kalmış çocuk
çıktılarının geçerli duyuruya sızması önlenir. Duyuru yanıtları, kanal adaptörlerinde mevcut olduğunda
iş parçacığı/konu yönlendirmesini korur.

### Duyuru bağlamı

Duyuru bağlamı, kararlı bir dahili olay bloğuna normalleştirilir:

| Alan           | Kaynak                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| Kaynak         | `subagent` veya `cron`                                                                                      |
| Oturum kimlikleri | Çocuk oturum anahtarı/kimliği                                                                            |
| Tür            | Duyuru türü + görev etiketi                                                                                 |
| Durum          | Çalışma zamanı sonucundan türetilir (`success`, `error`, `timeout` veya `unknown`) — model metninden **çıkarımsanmaz** |
| Sonuç içeriği  | En son görünür asistan metni, yoksa temizlenmiş en son araç/toolResult metni                                |
| Takip          | Ne zaman yanıt verileceğini ve ne zaman sessiz kalınacağını açıklayan talimat                                |

Terminalde başarısız olan çalıştırmalar, yakalanan yanıt metnini yeniden oynatmadan
başarısızlık durumunu bildirir. Zaman aşımında, çocuk yalnızca araç çağrılarına kadar ilerlediyse, duyuru
ham araç çıktısını yeniden oynatmak yerine bu geçmişi kısa bir kısmi ilerleme özetine
indirgeyebilir.

### İstatistik satırı

Duyuru yükleri sonunda bir istatistik satırı içerir (sarılmış olsa bile):

- Çalışma zamanı (ör. `runtime 5m12s`).
- Belirteç kullanımı (girdi/çıktı/toplam).
- Model fiyatlandırması yapılandırıldığında tahmini maliyet (`models.providers.*.models[].cost`).
- Ana ajanın `sessions_history` ile geçmişi getirebilmesi veya diskteki dosyayı inceleyebilmesi için `sessionKey`, `sessionId` ve döküm yolu.

Dahili meta veriler yalnızca orkestrasyon içindir; kullanıcıya yönelik yanıtlar
normal asistan sesiyle yeniden yazılmalıdır.

### Neden `sessions_history` tercih edilmeli

`sessions_history` daha güvenli orkestrasyon yoludur:

- Asistan hatırlaması önce normalleştirilir: düşünme etiketleri kaldırılır; `<relevant-memories>` / `<relevant_memories>` iskeleti kaldırılır; düz metin araç çağrısı XML yük blokları (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) kaldırılır; temiz kapanmayan kesilmiş yükler dahil; derecesi düşürülmüş araç çağrısı/sonuç iskeleti ve geçmiş bağlam işaretleri kaldırılır; sızmış model kontrol belirteçleri (`<|assistant|>`, diğer ASCII `<|...|>`, tam genişlik `<｜...｜>`) kaldırılır; bozuk MiniMax araç çağrısı XML'i kaldırılır.
- Kimlik bilgisi/belirteç benzeri metin redakte edilir.
- Uzun bloklar kısaltılabilir.
- Çok büyük geçmişlerde eski satırlar düşürülebilir veya aşırı büyük bir satır `[sessions_history omitted: message too large]` ile değiştirilebilir.
- Tam bayt bayt döküme ihtiyacınız olduğunda, diskteki ham dökümü incelemek geri dönüş yoludur.

## Araç politikası

Alt ajanlar önce ebeveyn veya hedef ajanla aynı profil ve araç politikası
iş hattını kullanır. Bundan sonra OpenClaw alt ajan kısıtlama
katmanını uygular.

Kısıtlayıcı bir `tools.profile` yoksa, alt ajanlar **oturum araçları**
ve sistem araçları hariç tüm araçları alır:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` burada da sınırlı, temizlenmiş bir hatırlama görünümü olarak kalır —
ham döküm çıktısı değildir.

`maxSpawnDepth >= 2` olduğunda, derinlik-1 orkestratör alt ajanları ayrıca
çocuklarını yönetebilmeleri için `sessions_spawn`, `subagents`, `sessions_list` ve
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

`tools.subagents.tools.allow` son bir yalnızca izin ver filtresidir. Önceden çözümlenmiş araç kümesini daraltabilir, ancak `tools.profile` tarafından kaldırılan bir aracı **geri ekleyemez**. Örneğin, `tools.profile: "coding"` `web_search`/`web_fetch` içerir, ancak `browser` aracını içermez. Kodlama profilli alt ajanların tarayıcı otomasyonu kullanmasına izin vermek için, tarayıcıyı profil aşamasında ekleyin:

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

Alt ajanlar ayrılmış bir süreç içi kuyruk hattı kullanır:

- **Hat adı:** `subagent`
- **Eşzamanlılık:** `agents.defaults.subagents.maxConcurrent` (varsayılan `8`)

## Canlılık ve kurtarma

OpenClaw, `endedAt` değerinin olmamasını bir alt ajanın hâlâ canlı olduğuna dair kalıcı kanıt olarak değerlendirmez. Bayat çalıştırma penceresinden daha eski olan sonlandırılmamış çalıştırmalar, `/subagents list`, durum özetleri, alt öğe tamamlama geçitlemesi ve oturum başına eşzamanlılık kontrollerinde etkin/beklemede olarak sayılmayı bırakır.

Bir Gateway yeniden başlatmasından sonra, alt oturumları `abortedLastRun: true` olarak işaretlenmemişse bayat sonlandırılmamış geri yüklenen çalıştırmalar budanır. Bu yeniden başlatma nedeniyle durdurulmuş alt oturumlar, iptal işaretini temizlemeden önce sentetik bir sürdürme mesajı gönderen alt ajan yetim kurtarma akışı üzerinden kurtarılabilir kalır.

<Note>
Bir alt ajan başlatma işlemi Gateway `PAIRING_REQUIRED` / `scope-upgrade` ile başarısız olursa, eşleştirme durumunu düzenlemeden önce RPC çağırıcısını kontrol edin. Dahili `sessions_spawn` koordinasyonu, doğrudan loopback paylaşılan belirteç/parola kimlik doğrulaması üzerinden `client.id: "gateway-client"` ve `client.mode: "backend"` ile bağlanmalıdır; bu yol CLI'ın eşleştirilmiş cihaz kapsamı temel çizgisine bağlı değildir. Uzak çağırıcılar, açık `deviceIdentity`, açık cihaz belirteci yolları ve tarayıcı/node istemcileri kapsam yükseltmeleri için hâlâ normal cihaz onayına ihtiyaç duyar.
</Note>

## Durdurma

- İstek sahibi sohbette `/stop` göndermek, istek sahibi oturumu iptal eder ve ondan başlatılmış etkin alt ajan çalıştırmalarını durdurur; bu, iç içe alt öğelere kademeli olarak uygulanır.
- `/subagents kill <id>` belirli bir alt ajanı durdurur ve alt öğelerine kademeli olarak uygulanır.

## Sınırlamalar

- Alt ajan duyurusu **en iyi çaba** esaslıdır. Gateway yeniden başlatılırsa, bekleyen "announce back" işi kaybolur.
- Alt ajanlar hâlâ aynı Gateway süreci kaynaklarını paylaşır; `maxConcurrent` değerini bir emniyet valfi olarak değerlendirin.
- `sessions_spawn` her zaman engellemesizdir: hemen `{ status: "accepted", runId, childSessionKey }` döndürür.
- Alt ajan bağlamı yalnızca `AGENTS.md` + `TOOLS.md` enjekte eder (`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` veya `BOOTSTRAP.md` yoktur).
- En fazla iç içe geçme derinliği 5'tir (`maxSpawnDepth` aralığı: 1-5). Çoğu kullanım durumu için derinlik 2 önerilir.
- `maxChildrenPerAgent`, oturum başına etkin alt öğeleri sınırlar (varsayılan `5`, aralık `1-20`).

## İlgili

- [ACP ajanları](/tr/tools/acp-agents)
- [Ajan gönderimi](/tr/tools/agent-send)
- [Arka plan görevleri](/tr/automation/tasks)
- [Çok ajanlı sandbox araçları](/tr/tools/multi-agent-sandbox-tools)
