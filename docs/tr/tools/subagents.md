---
read_when:
    - Agent üzerinden arka planda veya paralel çalışma istiyorsunuz
    - '`sessions_spawn` veya alt agent tool politikasını değiştiriyorsunuz'
    - İş parçacığına bağlı alt agent oturumlarını uyguluyor veya sorun gideriyorsunuz
sidebarTitle: Sub-agents
summary: Sonuçları istekte bulunan sohbete geri duyuran yalıtılmış arka plan agent çalıştırmaları başlatın
title: Alt agent'lar
x-i18n:
    generated_at: "2026-04-26T11:43:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7f2f1b8ae08026dd0f8c1b466bb7a8b044ae1d12c2ae61735dcf9f380179986
    source_path: tools/subagents.md
    workflow: 15
---

Alt agent'lar, mevcut bir agent çalıştırmasından başlatılan arka plan agent çalıştırmalarıdır.
Kendi oturumlarında (`agent:<agentId>:subagent:<uuid>`) çalışırlar ve
tamamlandıklarında sonuçlarını istekte bulunan sohbet
kanalına **duyururlar**. Her alt agent çalıştırması bir
[arka plan görevi](/tr/automation/tasks) olarak izlenir.

Birincil hedefler:

- Ana çalıştırmayı engellemeden "araştırma / uzun görev / yavaş tool" işlerini paralelleştirmek.
- Alt agent'ları varsayılan olarak yalıtılmış tutmak (oturum ayrımı + isteğe bağlı sandboxing).
- Tool yüzeyini yanlış kullanımı zor olacak şekilde tutmak: alt agent'lar varsayılan olarak session tool'larını **almaz**.
- Orkestratör kalıpları için yapılandırılabilir iç içe geçme derinliğini desteklemek.

<Note>
**Maliyet notu:** varsayılan olarak her alt agent'ın kendi bağlamı ve token kullanımı vardır.
Ağır veya tekrarlayan görevlerde alt agent'lar için daha ucuz bir model ayarlayın
ve ana agent'ınızı daha yüksek kaliteli bir modelde tutun. Şununla yapılandırın:
`agents.defaults.subagents.model` veya agent başına geçersiz kılmalar.
Bir alt öğe gerçekten istekte bulunanın geçerli transkriptine ihtiyaç duyduğunda,
agent o tek başlatma için `context: "fork"` isteyebilir.
</Note>

## Slash komutu

Geçerli oturum için alt agent çalıştırmalarını incelemek veya denetlemek üzere
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

`/subagents info`, çalıştırma meta verilerini gösterir (durum, zaman damgaları, session id,
transkript yolu, temizleme). Sınırlı,
güvenlik filtreli bir geri çağırma görünümü için `sessions_history` kullanın; ham tam transkripte
ihtiyacınız olduğunda disk üzerindeki transkript yolunu inceleyin.

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

`/subagents spawn`, bir arka plan alt agent'ını kullanıcı komutu olarak başlatır (dahili
aktarma olarak değil) ve çalıştırma bittiğinde
istekte bulunan sohbete son bir tamamlanma güncellemesi gönderir.

<AccordionGroup>
  <Accordion title="Engellemeyen, itme tabanlı tamamlanma">
    - Başlatma komutu engellemez; hemen bir çalıştırma kimliği döndürür.
    - Tamamlandığında alt agent, istekte bulunan sohbet kanalına bir özet/sonuç iletisi duyurur.
    - Tamamlanma itme tabanlıdır. Bir kez başlatıldıktan sonra, bitmesini beklemek için döngü içinde `/subagents list`, `sessions_list` veya `sessions_history` yoklaması yapmayın; durumu yalnızca hata ayıklama veya müdahale için gerektiğinde inceleyin.
    - Tamamlandığında OpenClaw, duyuru temizleme akışı devam etmeden önce, o alt agent oturumu tarafından açılan izlenen tarayıcı sekmelerini/süreçlerini elinden gelen en iyi şekilde kapatır.
  </Accordion>
  <Accordion title="Elle başlatma teslim dayanıklılığı">
    - OpenClaw önce kararlı bir idempotency anahtarı ile doğrudan `agent` teslimini dener.
    - Doğrudan teslim başarısız olursa, kuyruk yönlendirmesine geri döner.
    - Kuyruk yönlendirme hâlâ kullanılamıyorsa, duyuru son vazgeçmeden önce kısa bir üstel backoff ile yeniden denenir.
    - Tamamlama teslimi çözümlenmiş istek sahibi rotasını korur: kullanılabilir olduğunda iş parçacığına bağlı veya konuşmaya bağlı tamamlama rotaları kazanır; tamamlama kaynağı yalnızca bir kanal sağlıyorsa OpenClaw, doğrudan teslimin yine çalışabilmesi için eksik hedef/hesap bilgisini istek sahibinin çözülmüş rota bilgisinden (`lastChannel` / `lastTo` / `lastAccountId`) doldurur.
  </Accordion>
  <Accordion title="Tamamlama aktarım meta verisi">
    İstekte bulunan oturuma yapılan tamamlama aktarımı, çalışma zamanında üretilen
    dahili bağlamdır (kullanıcı tarafından yazılmış metin değildir) ve şunları içerir:

    - `Result` — en son görünür `assistant` yanıt metni; yoksa temizlenmiş en son tool/toolResult metni. Son durumda başarısız olan çalıştırmalar yakalanmış yanıt metnini yeniden kullanmaz.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompakt çalışma zamanı/token istatistikleri.
    - İstekte bulunan agent'a normal assistant sesiyle yeniden yazmasını söyleyen bir teslim talimatı (ham dahili meta veriyi iletmemesi için).

  </Accordion>
  <Accordion title="Modlar ve ACP çalışma zamanı">
    - `--model` ve `--thinking`, yalnızca o belirli çalıştırma için varsayılanları geçersiz kılar.
    - Tamamlandıktan sonra ayrıntıları ve çıktıyı incelemek için `info`/`log` kullanın.
    - `/subagents spawn` tek seferlik moddur (`mode: "run"`). Kalıcı iş parçacığına bağlı oturumlar için `thread: true` ve `mode: "session"` ile `sessions_spawn` kullanın.
    - ACP harness oturumları için (Claude Code, Gemini CLI, OpenCode veya açıkça Codex ACP/acpx), tool bu çalışma zamanını ilan ettiğinde `runtime: "acp"` ile `sessions_spawn` kullanın. Tamamlamaları veya agent'tan agent'a döngüleri hata ayıklarken [ACP teslim modeli](/tr/tools/acp-agents#delivery-model) sayfasına bakın. `codex` Plugin etkin olduğunda, kullanıcı açıkça ACP/acpx istemedikçe Codex sohbet/iş parçacığı denetimi ACP yerine `/codex ...` tercih etmelidir.
    - ACP etkinleştirilene, istekte bulunan sandbox içinde olmayana ve `acpx` gibi bir arka uç Plugin yüklenene kadar OpenClaw `runtime: "acp"` seçeneğini gizler. `runtime: "acp"`, harici bir ACP harness kimliği veya `runtime.type="acp"` olan bir `agents.list[]` girdisi bekler; `agents_list` içindeki normal OpenClaw yapılandırma agent'ları için varsayılan alt agent çalışma zamanını kullanın.
  </Accordion>
</AccordionGroup>

## Bağlam modları

Doğal alt agent'lar, çağıran açıkça geçerli transkripti çatallamak istemedikçe
yalıtılmış olarak başlar.

| Mod        | Ne zaman kullanılmalı                                                                                                                  | Davranış                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Yeni araştırma, bağımsız uygulama, yavaş tool çalışması veya görev metni içinde özetlenebilecek her şey                               | Temiz bir alt transkript oluşturur. Bu varsayılandır ve token kullanımını düşük tutar. |
| `fork`     | Geçerli konuşmaya, önceki tool sonuçlarına veya istekte bulunan transkriptinde zaten bulunan ayrıntılı talimatlara bağlı işler       | Alt öğe başlamadan önce istekte bulunan transkriptini alt oturuma dallandırır. |

`fork` seçeneğini idareli kullanın. Bu, bağlama duyarlı yetki devri içindir;
açık bir görev prompt'u yazmanın yerine geçmez.

## Tool: `sessions_spawn`

Genel `subagent` hattında `deliver: false` ile bir alt agent çalıştırması başlatır,
ardından bir duyuru adımı çalıştırır ve duyuru yanıtını istekte bulunan
sohbet kanalına gönderir.

**Varsayılanlar:**

- **Model:** `agents.defaults.subagents.model` (veya agent başına `agents.list[].subagents.model`) ayarlamazsanız çağıranı devralır; açık bir `sessions_spawn.model` yine önceliklidir.
- **Thinking:** `agents.defaults.subagents.thinking` (veya agent başına `agents.list[].subagents.thinking`) ayarlamazsanız çağıranı devralır; açık bir `sessions_spawn.thinking` yine önceliklidir.
- **Çalıştırma zaman aşımı:** `sessions_spawn.runTimeoutSeconds` atlanırsa, OpenClaw ayarlanmışsa `agents.defaults.subagents.runTimeoutSeconds` değerini kullanır; aksi halde `0` (zaman aşımı yok) değerine geri döner.

### Tool parametreleri

<ParamField path="task" type="string" required>
  Alt agent için görev açıklaması.
</ParamField>
<ParamField path="label" type="string">
  İsteğe bağlı, insan tarafından okunabilir etiket.
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents` tarafından izin verildiğinde başka bir agent kimliği altında başlatın.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` yalnızca harici ACP harness'leri (`claude`, `droid`, `gemini`, `opencode` veya açıkça istenen Codex ACP/acpx) ve `runtime.type` değeri `acp` olan `agents.list[]` girdileri içindir.
</ParamField>
<ParamField path="model" type="string">
  Alt agent modelini geçersiz kılar. Geçersiz değerler atlanır ve alt agent, tool sonucunda bir uyarı ile varsayılan modelde çalışır.
</ParamField>
<ParamField path="thinking" type="string">
  Alt agent çalıştırması için thinking düzeyini geçersiz kılar.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Ayarlanmışsa varsayılan olarak `agents.defaults.subagents.runTimeoutSeconds`, aksi halde `0` kullanılır. Ayarlandığında alt agent çalıştırması N saniye sonra iptal edilir.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` olduğunda bu alt agent oturumu için kanal iş parçacığı bağlaması ister.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true` ve `mode` atlanmışsa varsayılan `session` olur. `mode: "session"` için `thread: true` gerekir.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"`, duyurudan hemen sonra arşivler (yine de transkripti yeniden adlandırarak korur).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require`, hedef alt çalışma zamanı sandbox içinde değilse başlatmayı reddeder.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork`, istekte bulunanın geçerli transkriptini alt oturuma dallandırır. Yalnızca doğal alt agent'lar içindir. `fork` seçeneğini yalnızca alt öğe geçerli transkripte ihtiyaç duyduğunda kullanın.
</ParamField>

<Warning>
`sessions_spawn`, kanal teslim parametrelerini (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`) kabul etmez. Teslim için,
başlatılan çalıştırmadan `message`/`sessions_send` kullanın.
</Warning>

## İş parçacığına bağlı oturumlar

Bir kanal için iş parçacığı bağlamaları etkin olduğunda, bir alt agent bir iş parçacığına
bağlı kalabilir; böylece o iş parçacığındaki takip kullanıcı iletileri aynı alt agent oturumuna
yönlendirilmeye devam eder.

### İş parçacığını destekleyen kanallar

Şu anda yalnızca **Discord** desteklenmektedir. Kalıcı iş parçacığına bağlı alt agent oturumlarını (`thread: true` ile `sessions_spawn`), elle iş parçacığı denetimlerini (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) ve bağdaştırıcı anahtarlarını
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` ve
`channels.discord.threadBindings.spawnSubagentSessions` destekler.

### Hızlı akış

<Steps>
  <Step title="Başlat">
    `thread: true` ile `sessions_spawn` (ve isteğe bağlı olarak `mode: "session"`).
  </Step>
  <Step title="Bağla">
    OpenClaw, etkin kanalda o oturum hedefine bir iş parçacığı oluşturur veya bağlar.
  </Step>
  <Step title="Takipleri yönlendir">
    O iş parçacığındaki yanıtlar ve takip iletileri bağlı oturuma yönlendirilir.
  </Step>
  <Step title="Zaman aşimlarını incele">
    Hareketsizlik nedeniyle otomatik odak kaldırmayı incelemek/güncellemek için `/session idle`,
    katı üst sınırı denetlemek için `/session max-age` kullanın.
  </Step>
  <Step title="Ayır">
    Elle ayırmak için `/unfocus` kullanın.
  </Step>
</Steps>

### Elle denetimler

| Komut              | Etki                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| `/focus <target>`  | Geçerli iş parçacığını bir alt agent/oturum hedefine bağla (veya oluştur) |
| `/unfocus`         | Geçerli bağlı iş parçacığının bağlamasını kaldır                     |
| `/agents`          | Etkin çalıştırmaları ve bağlama durumunu listele (`thread:<id>` veya `unbound`) |
| `/session idle`    | Boşta kalınca otomatik odak kaldırmayı incele/güncelle (yalnızca odaklı bağlı iş parçacıkları) |
| `/session max-age` | Katı üst sınırı incele/güncelle (yalnızca odaklı bağlı iş parçacıkları) |

### Yapılandırma anahtarları

- **Genel varsayılan:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanal geçersiz kılması ve başlatma otomatik bağlama anahtarları** bağdaştırıcıya özgüdür. Yukarıdaki [İş parçacığını destekleyen kanallar](#thread-supporting-channels) bölümüne bakın.

Geçerli bağdaştırıcı ayrıntıları için [Yapılandırma referansı](/tr/gateway/configuration-reference) ve
[Slash komutları](/tr/tools/slash-commands) sayfalarına bakın.

### İzin listesi

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  `agentId` üzerinden hedeflenebilecek agent kimliklerinin listesi (`["*"]` her birine izin verir). Varsayılan: yalnızca istekte bulunan agent.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  İstekte bulunan agent kendi `subagents.allowAgents` değerini ayarlamadığında kullanılan varsayılan hedef-agent izin listesi.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId` içermeyen `sessions_spawn` çağrılarını engeller (açık profil seçimini zorlar). Agent başına geçersiz kılma: `agents.list[].subagents.requireAgentId`.
</ParamField>

İstekte bulunan oturum sandbox içindeyse, `sessions_spawn`
sandbox dışında çalışacak hedefleri reddeder.

### Keşif

Şu anda `sessions_spawn` için hangi agent kimliklerine izin verildiğini görmek üzere
`agents_list` kullanın. Yanıt, çağıranların PI, Codex
app-server ve diğer yapılandırılmış doğal çalışma zamanlarını ayırt edebilmesi için
listelenen her agent'ın etkin modelini ve gömülü çalışma zamanı meta verisini içerir.

### Otomatik arşivleme

- Alt agent oturumları, `agents.defaults.subagents.archiveAfterMinutes` sonrasında otomatik olarak arşivlenir (varsayılan `60`).
- Arşivleme `sessions.delete` kullanır ve transkripti `*.deleted.<timestamp>` olarak yeniden adlandırır (aynı klasör).
- `cleanup: "delete"`, duyurudan hemen sonra arşivler (yine de yeniden adlandırma yoluyla transkripti korur).
- Otomatik arşivleme best-effort çalışır; gateway yeniden başlatılırsa bekleyen zamanlayıcılar kaybolur.
- `runTimeoutSeconds` otomatik arşivleme yapmaz; yalnızca çalıştırmayı durdurur. Oturum, otomatik arşivlemeye kadar kalır.
- Otomatik arşivleme hem derinlik-1 hem de derinlik-2 oturumlarına eşit şekilde uygulanır.
- Tarayıcı temizleme, arşiv temizlemeden ayrıdır: transkript/oturum kaydı tutulsa bile izlenen tarayıcı sekmeleri/süreçleri çalıştırma bittiğinde best-effort olarak kapatılır.

## İç içe alt agent'lar

Varsayılan olarak alt agent'lar kendi alt agent'larını başlatamaz
(`maxSpawnDepth: 1`). Tek seviyelik
iç içe geçmeyi etkinleştirmek için `maxSpawnDepth: 2` ayarlayın — **orkestratör kalıbı**:
ana → orkestratör alt agent → çalışan alt-alt agent'lar.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // alt agent'ların alt öğe başlatmasına izin ver (varsayılan: 1)
        maxChildrenPerAgent: 5, // agent oturumu başına en fazla etkin alt öğe (varsayılan: 5)
        maxConcurrent: 8, // genel eşzamanlılık hattı üst sınırı (varsayılan: 8)
        runTimeoutSeconds: 900, // atlandığında sessions_spawn için varsayılan zaman aşımı (0 = zaman aşımı yok)
      },
    },
  },
}
```

### Derinlik düzeyleri

| Derinlik | Oturum anahtarı biçimi                        | Rol                                           | Başlatabilir mi?             |
| -------- | --------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0        | `agent:<id>:main`                             | Ana agent                                     | Her zaman                    |
| 1        | `agent:<id>:subagent:<uuid>`                  | Alt agent (`depth 2` izinliyse orkestratör)   | Yalnızca `maxSpawnDepth >= 2` ise |
| 2        | `agent:<id>:subagent:<uuid>:subagent:<uuid>`  | Alt-alt agent (yaprak çalışan)                | Asla                         |

### Duyuru zinciri

Sonuçlar zincir boyunca yukarı akar:

1. Derinlik-2 çalışanı biter → üstüne (derinlik-1 orkestratöre) duyurur.
2. Derinlik-1 orkestratör duyuruyu alır, sonuçları sentezler, biter → ana bölüme duyurur.
3. Ana agent duyuruyu alır ve kullanıcıya teslim eder.

Her seviye yalnızca doğrudan alt öğelerinden gelen duyuruları görür.

<Note>
**Operasyonel yönlendirme:** alt işi bir kez başlatın ve tamamlanma
olaylarını bekleyin; `sessions_list`,
`sessions_history`, `/subagents list` veya `exec` sleep komutları etrafında yoklama döngüleri kurmayın.
`sessions_list` ve `/subagents list`, alt oturum ilişkilerini
canlı işe odaklı tutar — canlı alt öğeler bağlı kalır, biten alt öğeler
kısa bir yakın geçmiş penceresi boyunca görünür kalır ve yalnızca depoda bulunan bayat alt bağlantılar
tazelik penceresinden sonra yok sayılır. Bu, eski `spawnedBy` /
`parentSessionKey` meta verisinin yeniden başlatmadan sonra hayalet alt öğeleri
diriltmesini önler. Bir alt öğe tamamlanma olayı siz zaten
son yanıtı gönderdikten sonra gelirse, doğru takip tam sessiz token
`NO_REPLY` / `no_reply` olur.
</Note>

### Derinliğe göre tool politikası

- Rol ve denetim kapsamı başlatma anında oturum meta verisine yazılır. Bu, düzleştirilmiş veya geri yüklenmiş oturum anahtarlarının yanlışlıkla yeniden orkestratör ayrıcalıkları kazanmasını önler.
- **Derinlik 1 (orkestratör, `maxSpawnDepth >= 2` olduğunda):** alt öğelerini yönetebilmesi için `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` alır. Diğer session/sistem tool'ları reddedilmiş kalır.
- **Derinlik 1 (yaprak, `maxSpawnDepth == 1` olduğunda):** session tool'u yoktur (geçerli varsayılan davranış).
- **Derinlik 2 (yaprak çalışan):** session tool'u yoktur — `sessions_spawn` derinlik 2'de her zaman reddedilir. Daha fazla alt öğe başlatamaz.

### Agent başına başlatma sınırı

Her agent oturumu (herhangi bir derinlikte) aynı anda en fazla `maxChildrenPerAgent`
(varsayılan `5`) etkin alt öğeye sahip olabilir. Bu, tek bir orkestratörden gelen kontrolsüz genişlemeyi önler.

### Kademeli durdurma

Derinlik-1 orkestratörünü durdurmak, tüm derinlik-2
alt öğelerini otomatik olarak durdurur:

- Ana sohbette `/stop`, tüm derinlik-1 agent'ları durdurur ve onların derinlik-2 alt öğelerine kademeli olarak iner.
- `/subagents kill <id>`, belirli bir alt agent'ı durdurur ve alt öğelerine kademeli olarak iner.
- `/subagents kill all`, istekte bulunanın tüm alt agent'larını durdurur ve kademeli olarak iner.

## Kimlik doğrulama

Alt agent kimlik doğrulaması, oturum türüne göre değil **agent kimliğine** göre çözülür:

- Alt agent oturum anahtarı `agent:<agentId>:subagent:<uuid>` biçimindedir.
- Kimlik doğrulama deposu, o agent'ın `agentDir` konumundan yüklenir.
- Ana agent'ın kimlik doğrulama profilleri bir **geri dönüş** olarak birleştirilir; çakışmalarda agent profilleri ana profilleri geçersiz kılar.

Birleştirme eklemelidir, bu nedenle ana profiller her zaman
geri dönüş olarak kullanılabilir. Agent başına tamamen yalıtılmış kimlik doğrulama henüz desteklenmemektedir.

## Duyuru

Alt agent'lar bir duyuru adımı aracılığıyla geri rapor verir:

- Duyuru adımı alt agent oturumunun içinde çalışır (istekte bulunan oturumda değil).
- Alt agent tam olarak `ANNOUNCE_SKIP` yanıtı verirse hiçbir şey gönderilmez.
- En son assistant metni tam sessiz token `NO_REPLY` / `no_reply` ise, daha önce görünür ilerleme olmuş olsa bile duyuru çıktısı bastırılır.

Teslim, istekte bulunanın derinliğine bağlıdır:

- Üst düzey istekte bulunan oturumlar, harici teslim (`deliver=true`) ile bir takip `agent` çağrısı kullanır.
- İç içe istekte bulunan alt agent oturumları, orkestratörün alt sonuçları oturum içinde sentezleyebilmesi için dahili takip enjeksiyonu (`deliver=false`) alır.
- İç içe istekte bulunan bir alt agent oturumu yok olmuşsa, OpenClaw kullanılabiliyorsa o oturumun istekte bulunanına geri döner.

Üst düzey istekte bulunan oturumlar için tamamlama modundaki doğrudan teslim,
önce bağlı konuşma/iş parçacığı rotasını ve hook geçersiz kılmasını çözümler, sonra
eksik kanal-hedef alanlarını istekte bulunan oturumun depolanan rotasından doldurur.
Bu, tamamlama kaynağı yalnızca kanalı tanımlasa bile tamamlamaları doğru sohbet/konu üzerinde tutar.

İç içe tamamlama bulguları oluşturulurken alt tamamlama toplaması geçerli istekte bulunan çalıştırmasıyla sınırlanır; bu, önceki çalıştırmalardan kalan bayat alt
çıktıların geçerli duyuruya sızmasını önler. Duyuru yanıtları, kanal bağdaştırıcılarında mevcut olduğunda
iş parçacığı/konu yönlendirmesini korur.

### Duyuru bağlamı

Duyuru bağlamı, kararlı bir dahili olay bloğuna normalize edilir:

| Alan          | Kaynak                                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| Source        | `subagent` veya `cron`                                                                                            |
| Session ids   | Alt oturum anahtarı/kimliği                                                                                        |
| Type          | Duyuru türü + görev etiketi                                                                                        |
| Status        | Çalışma zamanı sonucundan türetilir (`success`, `error`, `timeout` veya `unknown`) — model metninden **çıkarılmaz** |
| Result content | En son görünür assistant metni, yoksa temizlenmiş en son tool/toolResult metni                                  |
| Follow-up     | Ne zaman yanıt verileceğini, ne zaman sessiz kalınacağını açıklayan talimat                                     |

Son durumda başarısız olan çalıştırmalar, yakalanmış
yanıt metnini yeniden oynatmadan başarısızlık durumunu bildirir. Zaman aşımında, alt öğe yalnızca tool call'lara kadar geldiyse duyuru,
ham tool çıktısını yeniden oynatmak yerine bu geçmişi kısa bir kısmi ilerleme özetine dönüştürebilir.

### İstatistik satırı

Duyuru yükleri sonda bir istatistik satırı içerir (sarılmış olsa bile):

- Çalışma zamanı (ör. `runtime 5m12s`).
- Token kullanımı (girdi/çıktı/toplam).
- Model fiyatlandırması yapılandırılmışsa tahmini maliyet (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` ve transkript yolu; böylece ana agent geçmişi `sessions_history` ile getirebilir veya dosyayı disk üzerinde inceleyebilir.

Dahili meta veri yalnızca orkestrasyon içindir; kullanıcıya dönük yanıtlar
normal assistant sesiyle yeniden yazılmalıdır.

### Neden `sessions_history` tercih edilmeli

`sessions_history`, daha güvenli orkestrasyon yoludur:

- Assistant geri çağırması önce normalize edilir: akıl yürütme etiketleri kaldırılır; `<relevant-memories>` / `<relevant_memories>` iskeleti kaldırılır; düz metin tool-call XML yük blokları (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) temizlenir; buna düzgün kapanmayan kesilmiş yükler de dahildir; düşürülmüş tool-call/result iskeleti ve historical-context işaretleyicileri kaldırılır; sızmış model denetim token'ları (`<|assistant|>`, diğer ASCII `<|...|>`, tam genişlikte `<｜...｜>`) kaldırılır; bozuk MiniMax tool-call XML'i kaldırılır.
- Kimlik bilgisi/token benzeri metin sansürlenir.
- Uzun bloklar kırpılabilir.
- Çok büyük geçmişlerde eski satırlar atılabilir veya aşırı büyük bir satır `[sessions_history omitted: message too large]` ile değiştirilebilir.
- Ham, disk üzerindeki transkript incelemesi, bayt bayt tam transkripte ihtiyacınız olduğunda geri dönüş yoludur.

## Tool politikası

Alt agent'lar önce ebeveyn veya
hedef agent ile aynı profil ve tool-politikası hattını kullanır. Bundan sonra OpenClaw alt-agent kısıtlama
katmanını uygular.

Kısıtlayıcı bir `tools.profile` yoksa, alt agent'lar **session tool'ları hariç tüm araçları**
ve sistem tool'larını alır:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history`, burada da sınırlı ve temizlenmiş bir geri çağırma görünümü olarak kalır —
ham bir transkript dökümü değildir.

`maxSpawnDepth >= 2` olduğunda, derinlik-1 orkestratör alt agent'lar ayrıca
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
        // deny kazanır
        deny: ["gateway", "cron"],
        // allow ayarlanırsa yalnızca izin listesi olur (deny yine kazanır)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow`, son bir yalnızca-izin filtresidir. Zaten çözümlenmiş tool kümesini daraltabilir, ancak `tools.profile` tarafından kaldırılmış bir tool'u **geri ekleyemez**. Örneğin `tools.profile: "coding"`,
`web_search`/`web_fetch` içerir ama `browser` tool'unu içermez. Kodlama profiline sahip alt agent'ların tarayıcı otomasyonu kullanabilmesi için `browser` öğesini
profil aşamasında ekleyin:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Yalnızca bir agent tarayıcı otomasyonu alacaksa agent başına `agents.list[].tools.alsoAllow: ["browser"]` kullanın.

## Eşzamanlılık

Alt agent'lar özel bir süreç içi kuyruk hattı kullanır:

- **Hat adı:** `subagent`
- **Eşzamanlılık:** `agents.defaults.subagents.maxConcurrent` (varsayılan `8`)

## Canlılık ve kurtarma

OpenClaw, `endedAt` alanının yokluğunu bir
alt agent'ın hâlâ hayatta olduğuna dair kalıcı kanıt olarak görmez. Sona ermemiş, bayat çalıştırmalar
`/subagents list`, durum özetleri,
soy tamamlanma denetimi ve oturum başına eşzamanlılık kontrollerinde artık etkin/beklemede olarak sayılmaz.

Bir gateway yeniden başlatmasından sonra, bayat sona ermemiş geri yüklenmiş çalıştırmalar
alt oturum `abortedLastRun: true` olarak işaretlenmedikçe budanır. Bu
yeniden başlatma nedeniyle iptal edilmiş alt oturumlar, iptal işaretini temizlemeden önce
sentetik bir devam iletisi gönderen alt agent yetim kurtarma akışı üzerinden kurtarılabilir.

<Note>
Bir alt agent başlatması Gateway `PAIRING_REQUIRED` /
`scope-upgrade` ile başarısız olursa, eşleştirme durumunu düzenlemeden önce RPC çağıranı kontrol edin.
Dahili `sessions_spawn` koordinasyonu,
doğrudan loopback paylaşılan token/parola kimlik doğrulaması üzerinden
`client.id: "gateway-client"` ve `client.mode: "backend"` ile bağlanmalıdır; bu yol
CLI'nin eşleştirilmiş cihaz kapsamı taban çizgisine bağlı değildir. Uzak çağıranlar, açık
`deviceIdentity`, açık aygıt-token yolları ve tarayıcı/node istemcileri ise
kapsam yükseltmeleri için yine normal cihaz onayı gerektirir.
</Note>

## Durdurma

- İstekte bulunan sohbette `/stop` göndermek, istekte bulunan oturumu iptal eder ve ondan başlatılan etkin alt agent çalıştırmalarını durdurur; iç içe alt öğelere kademeli olarak iner.
- `/subagents kill <id>`, belirli bir alt agent'ı durdurur ve alt öğelerine kademeli olarak iner.

## Sınırlamalar

- Alt agent duyurusu **best-effort** çalışır. Gateway yeniden başlatılırsa, bekleyen "geri duyur" işleri kaybolur.
- Alt agent'lar yine aynı gateway süreç kaynaklarını paylaşır; `maxConcurrent` değerini bir güvenlik supabı olarak değerlendirin.
- `sessions_spawn` her zaman engellemez: hemen `{ status: "accepted", runId, childSessionKey }` döndürür.
- Alt agent bağlamı yalnızca `AGENTS.md` + `TOOLS.md` ekler (`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` veya `BOOTSTRAP.md` yoktur).
- Azami iç içe geçme derinliği 5'tir (`maxSpawnDepth` aralığı: 1–5). Çoğu kullanım durumu için derinlik 2 önerilir.
- `maxChildrenPerAgent`, oturum başına etkin alt öğeleri sınırlar (varsayılan `5`, aralık `1–20`).

## İlgili

- [ACP agent'ları](/tr/tools/acp-agents)
- [Agent gönderimi](/tr/tools/agent-send)
- [Arka plan görevleri](/tr/automation/tasks)
- [Çoklu agent sandbox araçları](/tr/tools/multi-agent-sandbox-tools)
