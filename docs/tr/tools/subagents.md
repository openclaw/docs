---
read_when:
    - Arka planda veya paralel olarak çalışmayı ajan aracılığıyla yapmak istiyorsunuz
    - sessions_spawn veya alt ajan araç politikasını değiştiriyorsunuz
    - İş parçacığına bağlı alt ajan oturumlarını uyguluyor veya sorunlarını gideriyorsunuz
sidebarTitle: Sub-agents
summary: Sonuçları istekte bulunan sohbete geri bildiren yalıtılmış arka plan ajan çalıştırmaları başlatın
title: Alt aracılar
x-i18n:
    generated_at: "2026-04-30T16:30:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c46d2c6d9ddac23653dcbfaf20df0ff5be9619035a1b115a3b49fd48fd8280
    source_path: tools/subagents.md
    workflow: 16
---

Alt aracılar, mevcut bir aracı çalıştırmasından başlatılan arka plan aracı çalıştırmalarıdır.
Kendi oturumlarında (`agent:<agentId>:subagent:<uuid>`) çalışırlar ve
tamamlandıklarında sonuçlarını istekte bulunan sohbet kanalına **duyururlar**.
Her alt aracı çalıştırması bir [arka plan görevi](/tr/automation/tasks) olarak izlenir.

Birincil hedefler:

- Ana çalıştırmayı engellemeden "araştırma / uzun görev / yavaş araç" işlerini paralelleştirmek.
- Alt aracıları varsayılan olarak yalıtılmış tutmak (oturum ayrımı + isteğe bağlı sandboxing).
- Araç yüzeyinin kötüye kullanılmasını zorlaştırmak: alt aracılar varsayılan olarak oturum araçlarını almaz.
- Orkestratör desenleri için yapılandırılabilir iç içe geçme derinliğini desteklemek.

<Note>
**Maliyet notu:** Her alt aracının varsayılan olarak kendi bağlamı ve token kullanımı vardır.
Ağır veya tekrarlı görevler için alt aracılar adına daha ucuz bir model ayarlayın
ve ana aracınızı daha yüksek kaliteli bir modelde tutun. `agents.defaults.subagents.model`
veya aracı başına geçersiz kılmalar üzerinden yapılandırın. Bir alt öğe gerçekten
istekte bulunanın mevcut konuşma dökümüne ihtiyaç duyduğunda, aracı yalnızca o başlatma için
`context: "fork"` isteyebilir.
</Note>

## Eğik çizgi komutu

**Geçerli oturum** için alt aracı çalıştırmalarını incelemek veya denetlemek üzere `/subagents` kullanın:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

`/subagents info`, çalıştırma meta verilerini gösterir (durum, zaman damgaları, oturum kimliği,
konuşma dökümü yolu, temizlik). Sınırlı ve güvenlik filtresinden geçirilmiş bir hatırlama görünümü için
`sessions_history` kullanın; ham tam konuşma dökümüne ihtiyaç duyduğunuzda diskteki konuşma dökümü yolunu inceleyin.

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

`/subagents spawn`, bir arka plan alt aracısını kullanıcı komutu olarak başlatır (dahili aktarma değil)
ve çalıştırma tamamlandığında istekte bulunan sohbete tek bir son tamamlama güncellemesi gönderir.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - Başlatma komutu engelleyici değildir; hemen bir çalıştırma kimliği döndürür.
    - Tamamlandığında, alt aracı istekte bulunan sohbet kanalına bir özet/sonuç mesajı duyurur.
    - Tamamlama push tabanlıdır. Başlatıldıktan sonra, yalnızca bitmesini beklemek için `/subagents list`, `sessions_list` veya `sessions_history` komutlarını döngü içinde yoklamayın; durumu yalnızca hata ayıklama veya müdahale için ihtiyaç halinde inceleyin.
    - Tamamlandığında OpenClaw, duyuru temizlik akışı devam etmeden önce ilgili alt aracı oturumu tarafından açılan izlenen tarayıcı sekmelerini/süreçlerini elinden geldiğince kapatır.

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw önce kararlı bir idempotency anahtarıyla doğrudan `agent` teslimatını dener.
    - Doğrudan teslimat başarısız olursa kuyruk yönlendirmesine geri döner.
    - Kuyruk yönlendirmesi hâlâ kullanılabilir değilse, duyuru son vazgeçmeden önce kısa bir üstel geri çekilme ile yeniden denenir.
    - Tamamlama teslimatı çözümlenmiş istekte bulunan rotasını korur: kullanılabilir olduğunda iş parçacığına bağlı veya konuşmaya bağlı tamamlama rotaları önceliklidir; tamamlama kaynağı yalnızca bir kanal sağlıyorsa OpenClaw, eksik hedefi/hesabı istekte bulunan oturumun çözümlenmiş rotasından (`lastChannel` / `lastTo` / `lastAccountId`) doldurur, böylece doğrudan teslimat yine çalışır.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    İstekte bulunan oturuma yapılan tamamlama devri, çalışma zamanında oluşturulan dahili bağlamdır
    (kullanıcı tarafından yazılmış metin değildir) ve şunları içerir:

    - `Result` — en son görünür `assistant` yanıt metni; yoksa temizlenmiş en son tool/toolResult metni. Terminal başarısız çalıştırmalar yakalanan yanıt metnini yeniden kullanmaz.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompakt çalışma zamanı/token istatistikleri.
    - İstekte bulunan aracıya normal asistan sesiyle yeniden yazmasını söyleyen bir teslimat yönergesi (ham dahili meta verileri iletmemesi için).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` ve `--thinking`, ilgili çalıştırma için varsayılanları geçersiz kılar.
    - Tamamlama sonrası ayrıntıları ve çıktıyı incelemek için `info`/`log` kullanın.
    - `/subagents spawn` tek seferlik moddur (`mode: "run"`). Kalıcı iş parçacığına bağlı oturumlar için `thread: true` ve `mode: "session"` ile `sessions_spawn` kullanın.
    - ACP donanımı oturumları için (Claude Code, Gemini CLI, OpenCode veya açık Codex ACP/acpx), araç bu çalışma zamanını duyurduğunda `runtime: "acp"` ile `sessions_spawn` kullanın. Tamamlamalarda veya aracıdan aracıya döngülerde hata ayıklarken [ACP teslimat modeli](/tr/tools/acp-agents#delivery-model) bölümüne bakın. `codex` plugin'i etkin olduğunda, Codex sohbet/iş parçacığı denetimi, kullanıcı açıkça ACP/acpx istemediği sürece ACP yerine `/codex ...` tercih etmelidir.
    - OpenClaw, ACP etkinleştirilene, istekte bulunan sandboxed olmayana ve `acpx` gibi bir arka uç plugin'i yüklenene kadar `runtime: "acp"` değerini gizler. `runtime: "acp"`, harici bir ACP donanımı kimliği veya `runtime.type="acp"` içeren bir `agents.list[]` girdisi bekler; `agents_list` kaynaklı normal OpenClaw yapılandırma aracıları için varsayılan alt aracı çalışma zamanını kullanın.

  </Accordion>
</AccordionGroup>

## Bağlam modları

Yerel alt ajanlar, çağıran açıkça mevcut konuşma dökümünü çatallamayı istemedikçe yalıtılmış başlar.

| Mod        | Ne zaman kullanılır                                                                                                                           | Davranış                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `isolated` | Yeni araştırma, bağımsız uygulama, yavaş araç çalışması veya görev metninde özetlenebilecek herhangi bir şey                                  | Temiz bir alt konuşma dökümü oluşturur. Varsayılan budur ve token kullanımını düşük tutar. |
| `fork`     | Mevcut konuşmaya, önceki araç sonuçlarına veya istekte bulunanın konuşma dökümünde zaten bulunan nüanslı talimatlara bağlı işler              | Alt oturum başlamadan önce istekte bulunanın konuşma dökümünü alt oturuma dallandırır. |

`fork` seçeneğini sınırlı kullanın. Bu, bağlama duyarlı yetkilendirme içindir;
net bir görev istemi yazmanın yerine geçmez.

## Araç: `sessions_spawn`

Global `subagent` kulvarında `deliver: false` ile bir alt ajan çalıştırması
başlatır, ardından bir duyuru adımı çalıştırır ve duyuru yanıtını istekte bulunanın
sohbet kanalına gönderir.

Kullanılabilirlik, çağıranın etkili araç politikasına bağlıdır. `coding` ve
`full` profilleri varsayılan olarak `sessions_spawn` aracını sunar. `messaging`
profili sunmaz; iş yetkilendirmesi gereken ajanlar için `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` ekleyin veya `tools.profile: "coding"` kullanın.
Kanal/grup, sağlayıcı, korumalı alan ve ajan başına izin/verme reddetme politikaları
profil aşamasından sonra aracı yine de kaldırabilir. Etkili araç listesini doğrulamak
için aynı oturumdan `/tools` kullanın.

**Varsayılanlar:**

- **Model:** `agents.defaults.subagents.model` (veya ajan başına `agents.list[].subagents.model`) ayarlamadığınız sürece çağırandan devralır; açık bir `sessions_spawn.model` yine de önceliklidir.
- **Düşünme:** `agents.defaults.subagents.thinking` (veya ajan başına `agents.list[].subagents.thinking`) ayarlamadığınız sürece çağırandan devralır; açık bir `sessions_spawn.thinking` yine de önceliklidir.
- **Çalıştırma zaman aşımı:** `sessions_spawn.runTimeoutSeconds` atlanırsa, ayarlandığında OpenClaw `agents.defaults.subagents.runTimeoutSeconds` değerini kullanır; aksi halde `0` değerine döner (zaman aşımı yok).

### Araç parametreleri

<ParamField path="task" type="string" required>
  Alt ajan için görev açıklaması.
</ParamField>
<ParamField path="label" type="string">
  İsteğe bağlı, insanlar tarafından okunabilir etiket.
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents` tarafından izin verildiğinde başka bir ajan kimliği altında oluşturun.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` yalnızca harici ACP çalıştırma düzenekleri (`claude`, `droid`, `gemini`, `opencode` veya açıkça istenen Codex ACP/acpx) ve `runtime.type` değeri `acp` olan `agents.list[]` girdileri içindir.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Yalnızca ACP. `runtime: "acp"` olduğunda mevcut bir ACP çalıştırma düzeneği oturumunu sürdürür; yerel alt ajan oluşturma işlemleri için yok sayılır.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Yalnızca ACP. `runtime: "acp"` olduğunda ACP çalıştırma çıktısını üst oturuma aktarır; yerel alt ajan oluşturma işlemleri için atlayın.
</ParamField>
<ParamField path="model" type="string">
  Alt ajan modelini geçersiz kılın. Geçersiz değerler atlanır ve alt ajan, araç sonucunda bir uyarıyla varsayılan modelde çalışır.
</ParamField>
<ParamField path="thinking" type="string">
  Alt ajan çalıştırması için düşünme düzeyini geçersiz kılın.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Ayarlandığında varsayılan olarak `agents.defaults.subagents.runTimeoutSeconds`, aksi halde `0` değerini kullanır. Ayarlandığında alt ajan çalıştırması N saniye sonra iptal edilir.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` olduğunda bu alt ajan oturumu için kanal konu bağlaması ister.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` ise ve `mode` atlanmışsa varsayılan `session` olur. `mode: "session"` için `thread: true` gerekir.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` duyurudan hemen sonra arşivler (konuşma dökümünü yeniden adlandırma yoluyla yine de tutar).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require`, hedef alt çalışma zamanı korumalı alanlı değilse oluşturmayı reddeder.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork`, istekte bulunanın mevcut konuşma dökümünü alt oturuma dallandırır. Yalnızca yerel alt ajanlar. `fork` yalnızca alt öğenin mevcut konuşma dökümüne ihtiyacı olduğunda kullanın.
</ParamField>

<Warning>
`sessions_spawn`, kanal teslim parametrelerini (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`) kabul **etmez**. Teslim için oluşturulan çalıştırmadan
`message`/`sessions_send` kullanın.
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
`channels.discord.threadBindings.spawnSubagentSessions` bağdaştırıcı anahtarlarını destekler.

### Hızlı akış

<Steps>
  <Step title="Oluştur">
    `thread: true` ile (ve isteğe bağlı olarak `mode: "session"`) `sessions_spawn`.
  </Step>
  <Step title="Bağla">
    OpenClaw etkin kanalda o oturum hedefi için bir konu oluşturur veya bağlar.
  </Step>
  <Step title="Takipleri yönlendir">
    O konudaki yanıtlar ve takip mesajları bağlı oturuma yönlendirilir.
  </Step>
  <Step title="Zaman aşımlarını incele">
    Etkin olmama nedeniyle otomatik odaktan çıkarmayı incelemek/güncellemek için `/session idle` ve
    kesin üst sınırı denetlemek için `/session max-age` kullanın.
  </Step>
  <Step title="Ayır">
    Manuel olarak ayırmak için `/unfocus` kullanın.
  </Step>
</Steps>

### Manuel denetimler

| Komut              | Etkisi                                                                      |
| ------------------ | --------------------------------------------------------------------------- |
| `/focus <target>`  | Geçerli thread'i (veya yeni bir tane oluşturup) bir alt ajan/session hedefe bağlar |
| `/unfocus`         | Geçerli bağlı thread için bağlamayı kaldırır                                |
| `/agents`          | Etkin çalıştırmaları ve bağlama durumunu listeler (`thread:<id>` veya `unbound`) |
| `/session idle`    | Boşta otomatik odaktan çıkarmayı incele/güncelle (yalnızca odaklanmış bağlı thread'ler) |
| `/session max-age` | Sabit üst sınırı incele/güncelle (yalnızca odaklanmış bağlı thread'ler)     |

### Yapılandırma anahtarları

- **Genel varsayılan:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanal geçersiz kılma ve spawn otomatik bağlama anahtarları** adapter'a özeldir. Yukarıdaki [Thread destekleyen kanallar](#thread-supporting-channels) bölümüne bakın.

Güncel adapter ayrıntıları için [Yapılandırma başvurusu](/tr/gateway/configuration-reference) ve
[Slash komutları](/tr/tools/slash-commands) bölümlerine bakın.

### İzin listesi

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Açık `agentId` aracılığıyla hedeflenebilecek ajan kimliklerinin listesi (`["*"]` herhangi birine izin verir). Varsayılan: yalnızca istekte bulunan ajan. Bir liste ayarlarsanız ve istekte bulunanın yine de `agentId` ile kendisini spawn etmesini istiyorsanız, istekte bulunan kimliği listeye ekleyin.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  İstekte bulunan ajan kendi `subagents.allowAgents` değerini ayarlamadığında kullanılan varsayılan hedef ajan izin listesi.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` atlayan `sessions_spawn` çağrılarını engeller (açık profil seçimini zorunlu kılar). Ajan başına geçersiz kılma: `agents.list[].subagents.requireAgentId`.
</ParamField>

İstekte bulunan session sandbox içindeyse, `sessions_spawn` sandbox dışında
çalışacak hedefleri reddeder.

### Keşif

`sessions_spawn` için şu anda hangi ajan kimliklerine izin verildiğini görmek üzere
`agents_list` kullanın. Yanıt, çağıranların Pi, Codex uygulama sunucusu ve
diğer yapılandırılmış yerel runtime'ları ayırt edebilmesi için listelenen her ajanın etkili
modelini ve gömülü runtime metadata'sını içerir.

### Otomatik arşivleme

- Alt ajan session'ları `agents.defaults.subagents.archiveAfterMinutes` sonrasında otomatik olarak arşivlenir (varsayılan `60`).
- Arşivleme `sessions.delete` kullanır ve transkripti `*.deleted.<timestamp>` olarak yeniden adlandırır (aynı klasör).
- `cleanup: "delete"` duyurudan hemen sonra arşivler (transkripti yine de yeniden adlandırarak tutar).
- Otomatik arşivleme en iyi çaba esaslıdır; Gateway yeniden başlatılırsa bekleyen timer'lar kaybolur.
- `runTimeoutSeconds` otomatik arşivlemez; yalnızca çalıştırmayı durdurur. Session, otomatik arşivlemeye kadar kalır.
- Otomatik arşivleme depth-1 ve depth-2 session'larına eşit şekilde uygulanır.
- Tarayıcı temizliği arşiv temizliğinden ayrıdır: izlenen tarayıcı sekmeleri/process'leri, transkript/session kaydı tutulsa bile çalıştırma bittiğinde en iyi çaba esaslı kapatılır.

## İç içe alt ajanlar

Varsayılan olarak, alt ajanlar kendi alt ajanlarını spawn edemez
(`maxSpawnDepth: 1`). Bir düzey
iç içe geçmeyi etkinleştirmek için `maxSpawnDepth: 2` ayarlayın — **orkestratör deseni**: ana → orkestratör alt ajan →
çalışan alt alt ajanlar.

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

| Derinlik | Session anahtarı biçimi                     | Rol                                           | Spawn edebilir mi?           |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Ana ajan                                      | Her zaman                    |
| 1     | `agent:<id>:subagent:<uuid>`                 | Alt ajan (depth 2 izinliyse orkestratör)      | Yalnızca `maxSpawnDepth >= 2` ise |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Alt alt ajan (uç çalışan)                     | Asla                         |

### Duyuru zinciri

Sonuçlar zincir boyunca yukarı akar:

1. Depth-2 çalışan biter → üstüne duyuru yapar (depth-1 orkestratör).
2. Depth-1 orkestratör duyuruyu alır, sonuçları sentezler, biter → ana ajana duyuru yapar.
3. Ana ajan duyuruyu alır ve kullanıcıya iletir.

Her düzey yalnızca doğrudan çocuklarından gelen duyuruları görür.

<Note>
**Operasyonel rehberlik:** `sessions_list`,
`sessions_history`, `/subagents list` veya `exec` sleep komutları etrafında poll döngüleri oluşturmak yerine çocuk çalışmayı bir kez başlatın ve tamamlanma
event'lerini bekleyin.
`sessions_list` ve `/subagents list`, çocuk session ilişkilerini
canlı işe odaklı tutar — canlı çocuklar bağlı kalır, biten çocuklar kısa bir yakın geçmiş penceresinde
görünür kalır ve bayat yalnızca-store çocuk bağlantıları tazelik pencereleri dolduktan sonra
yok sayılır. Bu, eski `spawnedBy` /
`parentSessionKey` metadata'sının yeniden başlatmadan sonra hayalet çocukları
yeniden canlandırmasını önler. Bir çocuk tamamlanma event'i final yanıtı
zaten gönderdikten sonra gelirse, doğru takip yanıtı tam sessiz token olan
`NO_REPLY` / `no_reply` değeridir.
</Note>

### Derinliğe göre araç politikası

- Rol ve kontrol kapsamı, spawn zamanında session metadata'sına yazılır. Bu, düz veya geri yüklenmiş session anahtarlarının yanlışlıkla orkestratör ayrıcalıklarını yeniden kazanmasını engeller.
- **Depth 1 (orkestratör, `maxSpawnDepth >= 2` olduğunda):** çocuklarını yönetebilmesi için `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` alır. Diğer session/sistem araçları reddedilmeye devam eder.
- **Depth 1 (uç, `maxSpawnDepth == 1` olduğunda):** session aracı yok (geçerli varsayılan davranış).
- **Depth 2 (uç çalışan):** session aracı yok — `sessions_spawn` depth 2'de her zaman reddedilir. Daha fazla çocuk spawn edemez.

### Ajan başına spawn sınırı

Her ajan session'ı (herhangi bir derinlikte) aynı anda en fazla `maxChildrenPerAgent`
(varsayılan `5`) etkin çocuğa sahip olabilir. Bu, tek bir orkestratörden
kontrolsüz fan-out oluşmasını önler.

### Kademeli durdurma

Bir depth-1 orkestratörü durdurmak, tüm depth-2
çocuklarını otomatik olarak durdurur:

- Ana sohbette `/stop`, tüm depth-1 ajanlarını durdurur ve onların depth-2 çocuklarına kademeli olarak uygulanır.
- `/subagents kill <id>` belirli bir alt ajanı durdurur ve çocuklarına kademeli olarak uygulanır.
- `/subagents kill all` istekte bulunan için tüm alt ajanları durdurur ve kademeli olarak uygulanır.

## Kimlik doğrulama

Alt ajan auth'u session türüne göre değil, **ajan kimliğine** göre çözümlenir:

- Alt ajan session anahtarı `agent:<agentId>:subagent:<uuid>` şeklindedir.
- Auth store, o ajanın `agentDir` konumundan yüklenir.
- Ana ajanın auth profilleri **fallback** olarak birleştirilir; ajan profilleri çakışmalarda ana profilleri geçersiz kılar.

Birleştirme eklemelidir, bu yüzden ana profiller fallback olarak her zaman
kullanılabilir. Ajan başına tamamen yalıtılmış auth henüz desteklenmiyor.

## Duyuru

Alt ajanlar bir duyuru adımıyla geri rapor verir:

- Duyuru adımı, alt ajan session'ı içinde çalışır (istekte bulunan session'da değil).
- Alt ajan tam olarak `ANNOUNCE_SKIP` yanıtını verirse hiçbir şey gönderilmez.
- En son assistant metni tam sessiz token olan `NO_REPLY` / `no_reply` ise, daha önce görünür ilerleme olsa bile duyuru çıktısı bastırılır.

Teslimat, istekte bulunanın derinliğine bağlıdır:

- Üst düzey istekte bulunan session'lar harici teslimatla (`deliver=true`) bir takip `agent` çağrısı kullanır.
- İç içe istekte bulunan subagent session'lar, orkestratörün çocuk sonuçlarını session içinde sentezleyebilmesi için dahili bir takip enjeksiyonu (`deliver=false`) alır.
- İç içe istekte bulunan subagent session yoksa, OpenClaw mümkün olduğunda o session'ın istekte bulunanına fallback yapar.

Üst düzey istekte bulunan session'lar için, completion-mode doğrudan teslimat önce
herhangi bir bağlı conversation/thread route'unu ve hook override'ını çözümler, ardından
eksik kanal-hedef alanlarını istekte bulunan session'ın saklanan route'undan doldurur.
Bu, completion kaynağı yalnızca kanalı tanımladığında bile completion'ların doğru sohbet/topic üzerinde kalmasını sağlar.

Çocuk tamamlanma toplaması, iç içe tamamlanma bulguları oluşturulurken
geçerli istekte bulunan çalıştırmaya kapsamlanır; bu, bayat önceki çalıştırma çocuk
çıktılarının geçerli duyuruya sızmasını önler. Duyuru yanıtları, kanal adapter'larında mevcut olduğunda
thread/topic yönlendirmesini korur.

### Duyuru bağlamı

Duyuru bağlamı kararlı bir dahili event bloğuna normalize edilir:

| Alan           | Kaynak                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Kaynak         | `subagent` veya `cron`                                                                                        |
| Session kimlikleri | Çocuk session anahtarı/kimliği                                                                            |
| Tür            | Duyuru türü + görev etiketi                                                                                   |
| Durum          | Runtime sonucundan türetilir (`success`, `error`, `timeout` veya `unknown`) — model metninden çıkarılmaz |
| Sonuç içeriği  | En son görünür assistant metni, yoksa sanitize edilmiş en son tool/toolResult metni                           |
| Takip          | Ne zaman yanıt verileceğini ve ne zaman sessiz kalınacağını açıklayan talimat                                  |

Terminal failed çalıştırmalar, yakalanan
yanıt metnini yeniden oynatmadan failure durumu bildirir. Timeout durumunda, çocuk yalnızca tool çağrılarına kadar geldiyse, duyuru
ham tool çıktısını yeniden oynatmak yerine bu geçmişi kısa bir kısmi ilerleme özeti halinde
daraltabilir.

### İstatistik satırı

Duyuru payload'ları sonda bir istatistik satırı içerir (sarmalandığında bile):

- Runtime (örn. `runtime 5m12s`).
- Token kullanımı (input/output/total).
- Model fiyatlandırması yapılandırıldığında tahmini maliyet (`models.providers.*.models[].cost`).
- Ana ajanın `sessions_history` aracılığıyla geçmişi getirebilmesi veya diskteki dosyayı inceleyebilmesi için `sessionKey`, `sessionId` ve transkript yolu.

Dahili metadata yalnızca orkestrasyon içindir; kullanıcıya dönük yanıtlar
normal assistant sesiyle yeniden yazılmalıdır.

### Neden `sessions_history` tercih edilmeli

`sessions_history` daha güvenli orkestrasyon yoludur:

- Assistant recall önce normalize edilir: thinking tag'leri çıkarılır; `<relevant-memories>` / `<relevant_memories>` iskelesi çıkarılır; düz metin tool-call XML payload blokları (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) çıkarılır, temiz kapanmayan kesilmiş payload'lar dahil; düşürülmüş tool-call/result iskelesi ve geçmiş-bağlam marker'ları çıkarılır; sızmış model kontrol token'ları (`<|assistant|>`, diğer ASCII `<|...|>`, full-width `<｜...｜>`) çıkarılır; hatalı biçimli MiniMax tool-call XML'i çıkarılır.
- Credential/token benzeri metin redakte edilir.
- Uzun bloklar kısaltılabilir.
- Çok büyük geçmişler eski satırları düşürebilir veya aşırı büyük bir satırı `[sessions_history omitted: message too large]` ile değiştirebilir.
- Ham disk üstü transkript incelemesi, tam byte-byte transkripte ihtiyacınız olduğunda fallback'tir.

## Araç politikası

Alt ajanlar önce parent veya hedef ajanla aynı profil ve araç politikası
pipeline'ını kullanır. Bundan sonra OpenClaw alt ajan kısıtlama
katmanını uygular.

Kısıtlayıcı bir `tools.profile` yoksa, alt ajanlar **session araçları ve
sistem araçları dışında tüm araçları** alır:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` burada da sınırlandırılmış, sanitize edilmiş bir recall görünümü olarak kalır —
ham transkript dökümü değildir.

`maxSpawnDepth >= 2` olduğunda, depth-1 orkestratör alt ajanları ek olarak
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

`tools.subagents.tools.allow` son bir yalnızca izin verme filtresidir. Zaten çözümlenmiş araç kümesini daraltabilir, ancak `tools.profile` tarafından kaldırılmış bir aracı **geri ekleyemez**. Örneğin, `tools.profile: "coding"` `web_search`/`web_fetch` içerir, ancak `browser` aracını içermez. Kodlama profiline sahip alt ajanların tarayıcı otomasyonu kullanmasına izin vermek için profil aşamasında browser ekleyin:

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

OpenClaw, `endedAt` yokluğunu bir alt ajanın hâlâ canlı olduğuna dair kalıcı kanıt olarak değerlendirmez. Eski çalıştırma penceresinden daha eski, sonlandırılmamış çalıştırmalar `/subagents list`, durum özetleri, alt öğe tamamlanma geçitlemesi ve oturum başına eşzamanlılık denetimlerinde etkin/beklemede olarak sayılmayı bırakır.

Gateway yeniden başlatıldıktan sonra, eski sonlandırılmamış geri yüklenen çalıştırmalar, alt oturumları `abortedLastRun: true` olarak işaretlenmediği sürece budanır. Yeniden başlatma nedeniyle iptal edilen bu alt oturumlar, iptal işaretini temizlemeden önce sentetik bir sürdürme mesajı gönderen alt ajan yetim kurtarma akışı üzerinden kurtarılabilir kalır.

Otomatik yeniden başlatma kurtarması alt oturum başına sınırlıdır. Aynı alt ajan alt öğesi hızlı yeniden takılma penceresi içinde tekrar tekrar yetim kurtarma için kabul edilirse, OpenClaw o oturumda bir kurtarma mezar taşı kalıcılaştırır ve sonraki yeniden başlatmalarda onu otomatik sürdürmeyi durdurur. Görev kaydını uzlaştırmak için `openclaw tasks maintenance --apply` komutunu veya mezar taşı bırakılmış oturumlardaki eski iptal edilmiş kurtarma bayraklarını temizlemek için `openclaw doctor --fix` komutunu çalıştırın.

<Note>
Bir alt ajan başlatma işlemi Gateway `PAIRING_REQUIRED` / `scope-upgrade` ile başarısız olursa, eşleştirme durumunu düzenlemeden önce RPC çağırıcısını kontrol edin. Dahili `sessions_spawn` koordinasyonu, doğrudan loopback paylaşılan-token/parola kimlik doğrulaması üzerinden `client.id: "gateway-client"` ve `client.mode: "backend"` olarak bağlanmalıdır; bu yol CLI'nin eşleştirilmiş cihaz kapsamı temel çizgisine bağlı değildir. Uzak çağırıcılar, açık `deviceIdentity`, açık cihaz-token yolları ve tarayıcı/Node istemcileri kapsam yükseltmeleri için hâlâ normal cihaz onayına ihtiyaç duyar.
</Note>

## Durdurma

- İstekte bulunan sohbette `/stop` göndermek, istekte bulunan oturumu iptal eder ve ondan başlatılan etkin alt ajan çalıştırmalarını durdurur; bu, iç içe alt öğelere de yayılır.
- `/subagents kill <id>` belirli bir alt ajanı durdurur ve alt öğelerine yayılır.

## Sınırlamalar

- Alt ajan duyurusu **en iyi çaba esasına dayalıdır**. Gateway yeniden başlatılırsa bekleyen "geri duyur" çalışması kaybolur.
- Alt ajanlar hâlâ aynı Gateway işlem kaynaklarını paylaşır; `maxConcurrent` değerini bir güvenlik valfi olarak değerlendirin.
- `sessions_spawn` her zaman engelleyici değildir: hemen `{ status: "accepted", runId, childSessionKey }` döndürür.
- Alt ajan bağlamı yalnızca `AGENTS.md` + `TOOLS.md` enjekte eder (`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` veya `BOOTSTRAP.md` yoktur).
- En fazla iç içe geçme derinliği 5'tir (`maxSpawnDepth` aralığı: 1–5). Çoğu kullanım durumu için derinlik 2 önerilir.
- `maxChildrenPerAgent`, oturum başına etkin alt öğeleri sınırlar (varsayılan `5`, aralık `1–20`).

## İlgili

- [ACP ajanları](/tr/tools/acp-agents)
- [Ajan gönderimi](/tr/tools/agent-send)
- [Arka plan görevleri](/tr/automation/tasks)
- [Çok ajanlı sandbox araçları](/tr/tools/multi-agent-sandbox-tools)
