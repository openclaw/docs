---
read_when:
    - Kodlama düzeneklerini ACP üzerinden çalıştırma
    - Mesajlaşma kanallarında konuşmaya bağlı ACP oturumlarını ayarlama
    - Bir mesaj kanalı konuşmasını kalıcı bir ACP oturumuna bağlama
    - ACP arka ucu, Plugin bağlantıları veya tamamlama iletimi sorunlarını giderme
    - Sohbetten /acp komutlarını çalıştırma
sidebarTitle: ACP agents
summary: Harici kodlama çalışma ortamlarını (Claude Code, Cursor, Gemini CLI, açık Codex ACP, OpenClaw ACP, OpenCode) ACP arka ucu üzerinden çalıştırın
title: ACP aracıları
x-i18n:
    generated_at: "2026-05-01T09:05:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb4164208571799f2d78d324f86c9b2fb72c60489ac2c367256f222495c74dbf
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) oturumları,
OpenClaw'ın harici kodlama yürütücü takımlarını (örneğin Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI ve desteklenen
diğer ACPX yürütücü takımları) bir ACP arka uç Plugin üzerinden çalıştırmasını sağlar.

Her ACP oturumu başlatması bir [arka plan görevi](/tr/automation/tasks) olarak izlenir.

<Note>
**ACP, varsayılan Codex yolu değil, harici yürütücü takım yoludur.** Yerel
Codex uygulama sunucusu Plugin'i `/codex ...` denetimlerinin ve
`agentRuntime.id: "codex"` gömülü çalışma zamanının sahibidir; ACP ise
`/acp ...` denetimlerinin ve `sessions_spawn({ runtime: "acp" })` oturumlarının sahibidir.

Codex veya Claude Code'un mevcut OpenClaw kanal konuşmalarına doğrudan
harici MCP istemcisi olarak bağlanmasını istiyorsanız, ACP yerine
[`openclaw mcp serve`](/tr/cli/mcp) kullanın.
</Note>

## Hangi sayfayı istiyorum?

| Şunu yapmak istiyorsunuz…                                                                       | Bunu kullanın                         | Notlar                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Geçerli konuşmada Codex'i bağlamak veya denetlemek                                              | `/codex bind`, `/codex threads`       | `codex` Plugin etkin olduğunda yerel Codex uygulama sunucusu yolu; bağlı sohbet yanıtlarını, görüntü iletmeyi, model/hızlı/izinler, durdurma ve yönlendirme denetimlerini içerir. ACP açık bir yedektir |
| Claude Code, Gemini CLI, açık Codex ACP veya başka bir harici yürütücü takımı OpenClaw _üzerinden_ çalıştırmak | Bu sayfa                              | Sohbete bağlı oturumlar, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, arka plan görevleri, çalışma zamanı denetimleri                                                                  |
| Bir OpenClaw Gateway oturumunu bir düzenleyici veya istemci için ACP sunucusu _olarak_ sunmak   | [`openclaw acp`](/tr/cli/acp)            | Köprü modu. IDE/istemci, stdio/WebSocket üzerinden OpenClaw ile ACP konuşur                                                                                                                    |
| Yerel bir AI CLI'yi yalnızca metin yedek modeli olarak yeniden kullanmak                        | [CLI Arka Uçları](/tr/gateway/cli-backends) | ACP değildir. OpenClaw araçları yok, ACP denetimleri yok, yürütücü takım çalışma zamanı yok                                                                                                  |

## Bu kutudan çıktığı gibi çalışır mı?

Genellikle evet. Yeni kurulumlar, varsayılan olarak etkin gelen paketli
`acpx` çalışma zamanı Plugin'iyle birlikte gelir; bu Plugin, OpenClaw'ın
Gateway HTTP dinleyicisi canlı hale gelir gelmez yokladığı ve kendi kendine
onardığı Plugin'e yerel sabitlenmiş bir `acpx` ikili dosyası içerir. Hazır olma
denetimi için `/acp doctor` çalıştırın.

OpenClaw ajanlara ACP başlatmayı yalnızca ACP **gerçekten
kullanılabilir** olduğunda öğretir: ACP etkin olmalı, gönderim devre dışı
bırakılmamış olmalı, geçerli oturum sandbox tarafından engellenmemiş olmalı
ve bir çalışma zamanı arka ucu yüklenmiş olmalıdır. Bu koşullar karşılanmazsa,
ACP Plugin Skills ve `sessions_spawn` ACP kılavuzu gizli kalır; böylece ajan
kullanılamayan bir arka uç önermez.

<AccordionGroup>
  <Accordion title="İlk çalıştırma sorunları">
    - `plugins.allow` ayarlanmışsa, bu kısıtlayıcı bir Plugin envanteridir ve **mutlaka** `acpx` içermelidir; aksi halde paketli varsayılan kasıtlı olarak engellenir ve `/acp doctor` eksik izin listesi girdisini bildirir.
    - Paketli Codex ACP adaptörü `acpx` Plugin ile hazırlanır ve mümkün olduğunda yerel olarak başlatılır.
    - Diğer hedef yürütücü takım adaptörleri, ilk kullanımda hâlâ `npx` ile isteğe bağlı olarak getirilebilir.
    - Tedarikçi kimlik doğrulaması, söz konusu yürütücü takım için ana makinede yine mevcut olmalıdır.
    - Ana makinede npm veya ağ erişimi yoksa, önbellekler önceden ısıtılana ya da adaptör başka bir yolla kurulana kadar ilk çalıştırma adaptörü getirmeleri başarısız olur.

  </Accordion>
  <Accordion title="Çalışma zamanı önkoşulları">
    ACP gerçek bir harici yürütücü takım süreci başlatır. OpenClaw yönlendirme,
    arka plan görevi durumu, teslim, bağlamalar ve politikanın sahibidir; yürütücü takım
    kendi sağlayıcı oturum açmasının, model kataloğunun, dosya sistemi davranışının ve
    yerel araçlarının sahibidir.

    OpenClaw'ı suçlamadan önce şunları doğrulayın:

    - `/acp doctor` etkin ve sağlıklı bir arka uç bildiriyor.
    - Bu izin listesi ayarlandığında hedef id, `acp.allowedAgents` tarafından izinli.
    - Yürütücü takım komutu Gateway ana makinesinde başlayabiliyor.
    - Sağlayıcı kimlik doğrulaması söz konusu yürütücü takım için mevcut (`claude`, `codex`, `gemini`, `opencode`, `droid` vb.).
    - Seçilen model söz konusu yürütücü takım için mevcut — model id'leri yürütücü takımlar arasında taşınabilir değildir.
    - İstenen `cwd` mevcut ve erişilebilir, ya da `cwd` değerini atlayıp arka ucun kendi varsayılanını kullanmasına izin verin.
    - İzin modu işle eşleşiyor. Etkileşimsiz oturumlar yerel izin istemlerine tıklayamaz; bu yüzden yazma/çalıştırma ağırlıklı kodlama çalıştırmaları genellikle başsız ilerleyebilen bir ACPX izin profili gerektirir.

  </Accordion>
</AccordionGroup>

OpenClaw Plugin araçları ve yerleşik OpenClaw araçları varsayılan olarak
ACP yürütücü takımlarına açılmaz. Yürütücü takım bu araçları doğrudan
çağırmalıysa, açık MCP köprülerini yalnızca
[ACP ajanları — kurulum](/tr/tools/acp-agents-setup) bölümünde etkinleştirin.

## Desteklenen yürütücü takım hedefleri

Paketli `acpx` arka ucuyla, bu yürütücü takım id'lerini `/acp spawn <id>`
veya `sessions_spawn({ runtime: "acp", agentId: "<id>" })` hedefleri olarak kullanın:

| Yürütücü takım id | Tipik arka uç                                  | Notlar                                                                              |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP adaptörü                       | Ana makinede Claude Code kimlik doğrulaması gerektirir.                             |
| `codex`    | Codex ACP adaptörü                             | Yalnızca yerel `/codex` kullanılamadığında veya ACP istendiğinde açık ACP yedeği.   |
| `copilot`  | GitHub Copilot ACP adaptörü                    | Copilot CLI/çalışma zamanı kimlik doğrulaması gerektirir.                           |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Yerel kurulum farklı bir ACP giriş noktası sunuyorsa acpx komutunu geçersiz kılın.  |
| `droid`    | Factory Droid CLI                              | Yürütücü takım ortamında Factory/Droid kimlik doğrulaması veya `FACTORY_API_KEY` gerektirir. |
| `gemini`   | Gemini CLI ACP adaptörü                        | Gemini CLI kimlik doğrulaması veya API anahtarı kurulumu gerektirir.                |
| `iflow`    | iFlow CLI                                      | Adaptör kullanılabilirliği ve model denetimi kurulu CLI'ye bağlıdır.                |
| `kilocode` | Kilo Code CLI                                  | Adaptör kullanılabilirliği ve model denetimi kurulu CLI'ye bağlıdır.                |
| `kimi`     | Kimi/Moonshot CLI                              | Ana makinede Kimi/Moonshot kimlik doğrulaması gerektirir.                           |
| `kiro`     | Kiro CLI                                       | Adaptör kullanılabilirliği ve model denetimi kurulu CLI'ye bağlıdır.                |
| `opencode` | OpenCode ACP adaptörü                          | OpenCode CLI/sağlayıcı kimlik doğrulaması gerektirir.                               |
| `openclaw` | `openclaw acp` üzerinden OpenClaw Gateway köprüsü | ACP bilen bir yürütücü takımın bir OpenClaw Gateway oturumuyla geri konuşmasını sağlar. |
| `pi`       | Pi/gömülü OpenClaw çalışma zamanı              | OpenClaw yerel yürütücü takım deneyleri için kullanılır.                            |
| `qwen`     | Qwen Code / Qwen CLI                           | Ana makinede Qwen uyumlu kimlik doğrulaması gerektirir.                             |

Özel acpx ajan takma adları acpx içinde yapılandırılabilir, ancak OpenClaw
politikası gönderimden önce yine de `acp.allowedAgents` ve tüm
`agents.list[].runtime.acp.agent` eşleştirmelerini denetler.

## Operatör çalışma kılavuzu

Sohbetten hızlı `/acp` akışı:

<Steps>
  <Step title="Başlat">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` veya açık
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Çalış">
    Bağlı konuşmada veya iş parçacığında devam edin (ya da oturum
    anahtarını açıkça hedefleyin).
  </Step>
  <Step title="Durumu denetle">
    `/acp status`
  </Step>
  <Step title="Ayarla">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Yönlendir">
    Bağlamı değiştirmeden: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Durdur">
    `/acp cancel` (geçerli tur) veya `/acp close` (oturum + bağlamalar).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Yaşam döngüsü ayrıntıları">
    - Başlatma, bir ACP çalışma zamanı oturumu oluşturur veya sürdürür, ACP meta verilerini OpenClaw oturum deposuna kaydeder ve çalıştırma üst sahipliyse bir arka plan görevi oluşturabilir.
    - Üst sahipli ACP oturumları, çalışma zamanı oturumu kalıcı olsa bile arka plan işi olarak ele alınır; tamamlama ve yüzeyler arası teslim, normal kullanıcıya dönük sohbet oturumu gibi davranmak yerine üst görev bildiricisi üzerinden gider.
    - Görev bakımı, terminal veya sahipsiz üst sahipli tek seferlik ACP oturumlarını kapatır. Kalıcı ACP oturumları etkin bir konuşma bağlaması kaldığı sürece korunur; etkin bağlaması olmayan bayat kalıcı oturumlar, sahip görev tamamlandıktan veya görev kaydı gittikten sonra sessizce sürdürülememeleri için kapatılır.
    - Bağlı takip mesajları, bağlama kapatılana, odaktan çıkarılana, sıfırlanana veya süresi dolana kadar doğrudan ACP oturumuna gider.
    - Gateway komutları yerel kalır. `/acp ...`, `/status` ve `/unfocus`, bağlı bir ACP yürütücü takımına asla normal istem metni olarak gönderilmez.
    - `cancel`, arka uç iptali desteklediğinde etkin turu iptal eder; bağlamayı veya oturum meta verilerini silmez.
    - `close`, OpenClaw'ın bakış açısından ACP oturumunu sonlandırır ve bağlamayı kaldırır. Bir yürütücü takım, sürdürmeyi destekliyorsa kendi yukarı akış geçmişini yine tutabilir.
    - Boştaki çalışma zamanı işçileri `acp.runtime.ttlMinutes` sonrasında temizlenmeye uygundur; depolanan oturum meta verileri `/acp sessions` için erişilebilir kalır.

  </Accordion>
  <Accordion title="Yerel Codex yönlendirme kuralları">
    Etkin olduğunda **yerel Codex Plugin'ine** yönlendirilmesi gereken
    doğal dil tetikleyicileri:

    - "Bu Discord kanalını Codex'e bağla."
    - "Bu sohbeti Codex iş parçacığına bağla: `<id>`."
    - "Codex iş parçacıklarını göster, sonra bunu bağla."

    Yerel Codex konuşma bağlaması varsayılan sohbet denetimi yoludur.
    OpenClaw dinamik araçları yine OpenClaw üzerinden yürütülürken,
    shell/apply-patch gibi Codex'e yerel araçlar Codex içinde yürütülür.
    Codex'e yerel araç olayları için OpenClaw, Plugin kancalarının
    `before_tool_call` değerini engelleyebilmesi, `after_tool_call` değerini
    gözlemleyebilmesi ve Codex `PermissionRequest` olaylarını OpenClaw onayları
    üzerinden yönlendirebilmesi için tur başına yerel bir kanca aktarıcısı enjekte eder.
    Codex `Stop` kancaları OpenClaw `before_agent_finalize` konumuna aktarılır;
    burada Plugin'ler, Codex yanıtını kesinleştirmeden önce bir model geçişi daha
    isteyebilir. Aktarıcı bilinçli olarak tutucu kalır: Codex'e yerel araç
    argümanlarını değiştirmez veya Codex iş parçacığı kayıtlarını yeniden yazmaz.
    Açık ACP'yi yalnızca ACP çalışma zamanı/oturum modelini istediğinizde kullanın.
    Gömülü Codex destek sınırı
    [Codex yürütücü takım v1 destek sözleşmesi](/tr/plugins/codex-harness#v1-support-contract)
    içinde belgelenmiştir.

  </Accordion>
  <Accordion title="Model / sağlayıcı / çalışma zamanı seçimi hızlı başvuru tablosu">
    - `openai-codex/*` — PI Codex OAuth/abonelik yolu.
    - `openai/*` artı `agentRuntime.id: "codex"` — yerel Codex uygulama sunucusu yerleşik çalışma zamanı.
    - `/codex ...` — yerel Codex konuşma denetimi.
    - `/acp ...` veya `runtime: "acp"` — açık ACP/acpx denetimi.

  </Accordion>
  <Accordion title="ACP yönlendirmesi doğal dil tetikleyicileri">
    ACP çalışma zamanına yönlendirilmesi gereken tetikleyiciler:

    - "Bunu tek seferlik bir Claude Code ACP oturumu olarak çalıştır ve sonucu özetle."
    - "Bu görev için Gemini CLI'ı bir iş parçacığında kullan, ardından takipleri aynı iş parçacığında tut."
    - "Codex'i ACP üzerinden arka plan iş parçacığında çalıştır."

    OpenClaw `runtime: "acp"` seçer, harness `agentId` değerini çözer,
    desteklendiğinde geçerli konuşmaya veya iş parçacığına bağlanır ve
    takipleri kapatılana/süresi dolana kadar o oturuma yönlendirir. Codex bu
    yolu yalnızca ACP/acpx açık olduğunda veya istenen işlem için yerel Codex
    plugin'i kullanılamadığında izler.

    `sessions_spawn` için `runtime: "acp"` yalnızca ACP
    etkinleştirildiğinde, istekte bulunan korumalı alanda olmadığında ve bir ACP çalışma zamanı
    arka ucu yüklendiğinde duyurulur. `acp.dispatch.enabled=false` otomatik
    ACP iş parçacığı dağıtımını duraklatır ancak açık
    `sessions_spawn({ runtime: "acp" })` çağrılarını gizlemez veya engellemez. `codex`,
    `claude`, `droid`, `gemini` veya `opencode` gibi ACP harness kimliklerini hedefler. Bu giriş
    açıkça `agents.list[].runtime.type="acp"` ile yapılandırılmadıkça
    `agents_list` içinden normal bir OpenClaw yapılandırma aracı kimliği geçirmeyin;
    aksi takdirde varsayılan alt aracı çalışma zamanını kullanın. Bir OpenClaw aracısı
    `runtime.type="acp"` ile yapılandırıldığında, OpenClaw temel harness kimliği olarak
    `runtime.acp.agent` değerini kullanır.

  </Accordion>
</AccordionGroup>

## ACP ile alt aracılar karşılaştırması

Harici bir harness çalışma zamanı istediğinizde ACP kullanın. `codex`
plugin'i etkinken Codex konuşma bağlama/denetimi için **yerel Codex
uygulama sunucusunu** kullanın. OpenClaw'a özgü
devredilmiş çalıştırmalar istediğinizde **alt aracıları** kullanın.

| Alan          | ACP oturumu                           | Alt aracı çalıştırması             |
| ------------- | ------------------------------------- | ---------------------------------- |
| Çalışma zamanı | ACP arka uç plugin'i (örneğin acpx)  | OpenClaw yerel alt aracı çalışma zamanı |
| Oturum anahtarı | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`  |
| Ana komutlar | `/acp ...`                            | `/subagents ...`                   |
| Başlatma aracı | `runtime:"acp"` ile `sessions_spawn` | `sessions_spawn` (varsayılan çalışma zamanı) |

Ayrıca bkz. [Alt aracılar](/tr/tools/subagents).

## ACP Claude Code'u nasıl çalıştırır

ACP üzerinden Claude Code için yığın şöyledir:

1. OpenClaw ACP oturum denetim düzlemi.
2. Paketlenmiş `acpx` çalışma zamanı plugin'i.
3. Claude ACP bağdaştırıcısı.
4. Claude tarafı çalışma zamanı/oturum mekanizması.

ACP Claude, ACP denetimleri, oturum sürdürme,
arka plan görev takibi ve isteğe bağlı konuşma/iş parçacığı bağlama özelliklerine sahip bir **harness oturumudur**.

CLI arka uçları ayrı, yalnızca metin kullanan yerel yedek çalışma zamanlarıdır — bkz.
[CLI Arka Uçları](/tr/gateway/cli-backends).

Operatörler için pratik kural şudur:

- **`/acp spawn`, bağlanabilir oturumlar, çalışma zamanı denetimleri veya kalıcı harness işi mi istiyorsunuz?** ACP kullanın.
- **Ham CLI üzerinden basit yerel metin yedeği mi istiyorsunuz?** CLI arka uçlarını kullanın.

## Bağlı oturumlar

### Zihinsel model

- **Sohbet yüzeyi** — insanların konuşmayı sürdürdüğü yer (Discord kanalı, Telegram konusu, iMessage sohbeti).
- **ACP oturumu** — OpenClaw'ın yönlendirdiği kalıcı Codex/Claude/Gemini çalışma zamanı durumu.
- **Alt iş parçacığı/konu** — yalnızca `--thread ...` tarafından oluşturulan isteğe bağlı ek mesajlaşma yüzeyi.
- **Çalışma zamanı çalışma alanı** — harness'in çalıştığı dosya sistemi konumu (`cwd`, repo checkout'u, arka uç çalışma alanı). Sohbet yüzeyinden bağımsızdır.

### Geçerli konuşma bağlamaları

`/acp spawn <harness> --bind here`, geçerli konuşmayı
başlatılan ACP oturumuna sabitler — alt iş parçacığı yok, aynı sohbet yüzeyi. OpenClaw
taşıma, kimlik doğrulama, güvenlik ve teslim sahipliğini korur. Bu
konuşmadaki takip mesajları aynı oturuma yönlendirilir; `/new` ve `/reset`
oturumu yerinde sıfırlar; `/acp close` bağlamayı kaldırır.

Örnekler:

```text
/codex bind                                              # yerel Codex bağlaması, gelecekteki mesajları buraya yönlendir
/codex model gpt-5.4                                     # bağlı yerel Codex iş parçacığını ayarla
/codex stop                                              # etkin yerel Codex dönüşünü denetle
/acp spawn codex --bind here                             # Codex için açık ACP yedeği
/acp spawn codex --thread auto                           # bir alt iş parçacığı/konu oluşturabilir ve oraya bağlayabilir
/acp spawn codex --bind here --cwd /workspace/repo       # aynı sohbet bağlaması, Codex /workspace/repo içinde çalışır
```

<AccordionGroup>
  <Accordion title="Bağlama kuralları ve münhasırlık">
    - `--bind here` ve `--thread ...` birbirini dışlar.
    - `--bind here` yalnızca geçerli konuşma bağlamasını duyuran kanallarda çalışır; aksi halde OpenClaw net bir desteklenmiyor mesajı döndürür. Bağlamalar Gateway yeniden başlatmaları boyunca kalıcıdır.
    - Discord'da `spawnAcpSessions` yalnızca OpenClaw'ın `--thread auto|here` için alt iş parçacığı oluşturması gerektiğinde gerekir — `--bind here` için gerekmez.
    - `--cwd` olmadan farklı bir ACP aracısına başlatırsanız, OpenClaw varsayılan olarak **hedef aracının** çalışma alanını devralır. Eksik devralınan yollar (`ENOENT`/`ENOTDIR`) arka uç varsayılanına geri döner; diğer erişim hataları (ör. `EACCES`) başlatma hataları olarak gösterilir.
    - Gateway yönetim komutları bağlı konuşmalarda yerel kalır — normal takip metni bağlı ACP oturumuna yönlendirilse bile `/acp ...` komutları OpenClaw tarafından işlenir; komut işleme o yüzey için etkin olduğunda `/status` ve `/unfocus` da yerel kalır.

  </Accordion>
  <Accordion title="İş parçacığına bağlı oturumlar">
    Bir kanal bağdaştırıcısı için iş parçacığı bağlamaları etkin olduğunda:

    - OpenClaw bir iş parçacığını hedef ACP oturumuna bağlar.
    - Bu iş parçacığındaki takip mesajları bağlı ACP oturumuna yönlendirilir.
    - ACP çıktısı aynı iş parçacığına geri teslim edilir.
    - Odaktan çıkarma/kapatma/arşivleme/boşta kalma zaman aşımı veya azami yaş süresinin dolması bağlamayı kaldırır.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` ve `/unfocus` Gateway komutlarıdır, ACP harness'ine gönderilen istemler değildir.

    İş parçacığına bağlı ACP için gerekli özellik bayrakları:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` varsayılan olarak açıktır (otomatik ACP iş parçacığı dağıtımını duraklatmak için `false` ayarlayın; açık `sessions_spawn({ runtime: "acp" })` çağrıları çalışmaya devam eder).
    - Kanal bağdaştırıcısı ACP iş parçacığı başlatma bayrağı etkin (bağdaştırıcıya özgü):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    İş parçacığı bağlama desteği bağdaştırıcıya özgüdür. Etkin kanal
    bağdaştırıcısı iş parçacığı bağlamalarını desteklemiyorsa, OpenClaw net bir
    desteklenmiyor/kullanılamıyor mesajı döndürür.

  </Accordion>
  <Accordion title="İş parçacığını destekleyen kanallar">
    - Oturum/iş parçacığı bağlama yeteneğini açığa çıkaran herhangi bir kanal bağdaştırıcısı.
    - Geçerli yerleşik destek: **Discord** iş parçacıkları/kanalları, **Telegram** konuları (gruplarda/süper gruplarda forum konuları ve DM konuları).
    - Plugin kanalları aynı bağlama arayüzü üzerinden destek ekleyebilir.

  </Accordion>
</AccordionGroup>

## Kalıcı kanal bağlamaları

Geçici olmayan iş akışları için üst düzey `bindings[]` girişlerinde
kalıcı ACP bağlamaları yapılandırın.

### Bağlama modeli

<ParamField path="bindings[].type" type='"acp"'>
  Kalıcı bir ACP konuşma bağlamasını işaretler.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Hedef konuşmayı tanımlar. Kanal başına biçimler:

- **Discord kanalı/iş parçacığı:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram forum konusu:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles DM/grup:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Kararlı grup bağlamaları için `chat_id:*` veya `chat_identifier:*` tercih edin.
- **iMessage DM/grup:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Kararlı grup bağlamaları için `chat_id:*` tercih edin.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Sahip OpenClaw aracı kimliği.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  İsteğe bağlı ACP geçersiz kılması.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  İsteğe bağlı operatöre yönelik etiket.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  İsteğe bağlı çalışma zamanı çalışma dizini.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  İsteğe bağlı arka uç geçersiz kılması.
</ParamField>

### Aracı başına çalışma zamanı varsayılanları

ACP varsayılanlarını aracı başına bir kez tanımlamak için `agents.list[].runtime` kullanın:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness kimliği, ör. `codex` veya `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP bağlı oturumları için geçersiz kılma önceliği:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Genel ACP varsayılanları (ör. `acp.backend`)

### Örnek

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

### Davranış

- OpenClaw yapılandırılan ACP oturumunun kullanımdan önce var olmasını sağlar.
- O kanal veya konudaki mesajlar yapılandırılan ACP oturumuna yönlendirilir.
- Bağlı konuşmalarda `/new` ve `/reset` aynı ACP oturum anahtarını yerinde sıfırlar.
- Geçici çalışma zamanı bağlamaları (örneğin iş parçacığı odağı akışları tarafından oluşturulanlar) mevcut oldukları yerlerde geçerli olmaya devam eder.
- Açık bir `cwd` olmadan aracıları aşan ACP başlatmalarında, OpenClaw hedef aracı çalışma alanını aracı yapılandırmasından devralır.
- Eksik devralınan çalışma alanı yolları arka uç varsayılan cwd'sine geri döner; eksik olmayan erişim hataları başlatma hataları olarak gösterilir.

## ACP oturumlarını başlatma

Bir ACP oturumu başlatmanın iki yolu vardır:

<Tabs>
  <Tab title="sessions_spawn'dan">
    Bir aracı dönüşünden veya araç çağrısından ACP oturumu başlatmak için
    `runtime: "acp"` kullanın.

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` varsayılan olarak `subagent` değerini alır, bu yüzden ACP oturumları için
    `runtime: "acp"` değerini açıkça ayarlayın. `agentId` atlanırsa OpenClaw,
    yapılandırıldığında `acp.defaultAgent` değerini kullanır. `mode: "session"`,
    kalıcı bağlı bir konuşmayı tutmak için `thread: true` gerektirir.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Sohbetten açık operatör denetimi için `/acp spawn` kullanın.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Temel bayraklar:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    Bkz. [Eğik çizgi komutları](/tr/tools/slash-commands).

  </Tab>
</Tabs>

### `sessions_spawn` parametreleri

<ParamField path="task" type="string" required>
  ACP oturumuna gönderilen ilk istem.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP oturumları için `"acp"` olmalıdır.
</ParamField>
<ParamField path="agentId" type="string">
  ACP hedef harness kimliği. Ayarlanmışsa `acp.defaultAgent` değerine geri döner.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Desteklendiği yerlerde iş parçacığı bağlama akışını ister.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` tek seferliktir; `"session"` kalıcıdır. `thread: true` ise ve
  `mode` atlanırsa OpenClaw, çalışma zamanı yoluna göre varsayılan olarak kalıcı davranışı
  kullanabilir. `mode: "session"` için `thread: true` gerekir.
</ParamField>
<ParamField path="cwd" type="string">
  İstenen çalışma zamanı çalışma dizini (arka uç/çalışma zamanı ilkesi tarafından doğrulanır).
  Atlanırsa ACP spawn, yapılandırıldığında hedef agent çalışma alanını devralır;
  eksik devralınan yollar arka uç varsayılanlarına geri dönerken gerçek erişim hataları döndürülür.
</ParamField>
<ParamField path="label" type="string">
  Oturum/banner metninde kullanılan operatöre yönelik etiket.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Yeni bir ACP oturumu oluşturmak yerine mevcut bir ACP oturumunu sürdürür.
  Agent, konuşma geçmişini `session/load` üzerinden yeniden oynatır. `runtime: "acp"` gerektirir.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"`, ilk ACP çalıştırma ilerleme özetlerini sistem olayları olarak
  istekte bulunan oturuma geri aktarır. Kabul edilen yanıtlar,
  tam aktarım geçmişini takip edebilmeniz için oturum kapsamlı bir JSONL günlüğünü
  (`<sessionId>.acp-stream.jsonl`) gösteren `streamLogPath` içerir.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  ACP alt turunu N saniye sonra iptal eder. `0`, turu Gateway'in zaman aşımı olmayan yolunda tutar.
  Aynı değer Gateway çalıştırmasına ve ACP çalışma zamanına uygulanır; böylece takılmış veya kotası tükenmiş
  harness'lar üst agent hattını süresiz işgal etmez.
</ParamField>
<ParamField path="model" type="string">
  ACP alt oturumu için açık model geçersiz kılması. Codex ACP spawn'ları,
  `openai-codex/gpt-5.4` gibi OpenClaw Codex referanslarını `session/new` öncesinde
  Codex ACP başlangıç yapılandırmasına normalleştirir; `openai-codex/gpt-5.4/high`
  gibi eğik çizgi formları ayrıca Codex ACP akıl yürütme çabasını ayarlar.
  Diğer harness'lar ACP `models` değerlerini ilan etmeli ve `session/set_model`
  desteği sunmalıdır; aksi halde OpenClaw/acpx hedef agent varsayılanına sessizce geri dönmek yerine
  net biçimde başarısız olur.
</ParamField>
<ParamField path="thinking" type="string">
  Açık düşünme/akıl yürütme çabası. Codex ACP için `minimal` düşük çabaya eşlenir,
  `low`/`medium`/`high`/`xhigh` doğrudan eşlenir ve `off`
  akıl yürütme çabası başlangıç geçersiz kılmasını atlar.
</ParamField>

## Spawn bağlama ve iş parçacığı modları

<Tabs>
  <Tab title="--bind here|off">
    | Mod    | Davranış                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Geçerli etkin konuşmayı yerinde bağla; etkin konuşma yoksa başarısız ol. |
    | `off`  | Geçerli konuşma bağlaması oluşturma.                          |

    Notlar:

    - `--bind here`, "bu kanalı veya sohbeti Codex destekli yap" için en basit operatör yoludur.
    - `--bind here` bir alt iş parçacığı oluşturmaz.
    - `--bind here` yalnızca geçerli konuşma bağlama desteği sunan kanallarda kullanılabilir.
    - `--bind` ve `--thread` aynı `/acp spawn` çağrısında birleştirilemez.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mod    | Davranış                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | Etkin bir iş parçacığındayken: o iş parçacığını bağla. İş parçacığı dışındayken: destekleniyorsa alt iş parçacığı oluştur/bağla. |
    | `here` | Geçerli etkin iş parçacığını zorunlu kıl; içinde değilse başarısız ol.                                                  |
    | `off`  | Bağlama yok. Oturum bağlı olmadan başlar.                                                                 |

    Notlar:

    - İş parçacığı bağlama olmayan yüzeylerde varsayılan davranış fiilen `off` olur.
    - İş parçacığına bağlı spawn, kanal ilkesi desteği gerektirir:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Alt iş parçacığı oluşturmadan geçerli konuşmayı sabitlemek istediğinizde `--bind here` kullanın.

  </Tab>
</Tabs>

## Teslim modeli

ACP oturumları etkileşimli çalışma alanları veya üst tarafından sahiplenilen
arka plan işleri olabilir. Teslim yolu bu yapıya bağlıdır.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Etkileşimli oturumlar görünür bir sohbet yüzeyinde konuşmayı sürdürmek içindir:

    - `/acp spawn ... --bind here`, geçerli konuşmayı ACP oturumuna bağlar.
    - `/acp spawn ... --thread ...`, bir kanal iş parçacığını/konusunu ACP oturumuna bağlar.
    - Kalıcı yapılandırılmış `bindings[].type="acp"`, eşleşen konuşmaları aynı ACP oturumuna yönlendirir.

    Bağlı konuşmadaki takip mesajları doğrudan ACP oturumuna yönlendirilir
    ve ACP çıktısı aynı kanala/iş parçacığına/konuya geri teslim edilir.

    OpenClaw'un harness'a gönderdiği şeyler:

    - Normal bağlı takipler, yalnızca harness/arka uç desteklediğinde eklerle birlikte istem metni olarak gönderilir.
    - `/acp` yönetim komutları ve yerel Gateway komutları ACP gönderiminden önce yakalanır.
    - Çalışma zamanı tarafından üretilen tamamlama olayları hedef başına somutlaştırılır. OpenClaw agent'ları OpenClaw'un dahili çalışma zamanı bağlamı zarfını alır; harici ACP harness'ları alt sonuç ve talimat içeren düz bir istem alır. Ham `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` zarfı harici harness'lara asla gönderilmemeli veya ACP kullanıcı transkript metni olarak kalıcılaştırılmamalıdır.
    - ACP transkript girdileri, kullanıcıya görünen tetikleme metnini veya düz tamamlama istemini kullanır. Dahili olay meta verileri mümkün olduğunda OpenClaw içinde yapılandırılmış kalır ve kullanıcı tarafından yazılmış sohbet içeriği olarak ele alınmaz.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Başka bir agent çalıştırması tarafından spawn edilen tek seferlik ACP oturumları,
    sub-agent'lara benzer arka plan alt öğeleridir:

    - Üst, `sessions_spawn({ runtime: "acp", mode: "run" })` ile iş ister.
    - Alt öğe kendi ACP harness oturumunda çalışır.
    - Alt turlar, yerel sub-agent spawn'larının kullandığı aynı arka plan hattında çalışır; bu yüzden yavaş bir ACP harness, ilgisiz ana oturum işini engellemez.
    - Tamamlama, görev tamamlama duyuru yolu üzerinden geri raporlanır. OpenClaw, harici bir harness'a göndermeden önce dahili tamamlama meta verilerini düz bir ACP istemine dönüştürür; böylece harness'lar yalnızca OpenClaw'a ait çalışma zamanı bağlamı işaretleyicilerini görmez.
    - Üst, kullanıcıya yönelik bir yanıt yararlı olduğunda alt sonucu normal asistan sesiyle yeniden yazar.

    Bu yolu üst ve alt arasında eşler arası bir sohbet olarak **ele almayın**.
    Alt öğenin zaten üste geri dönen bir tamamlama kanalı vardır.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send`, spawn sonrasında başka bir oturumu hedefleyebilir. Normal eş oturumlarda
    OpenClaw, mesajı enjekte ettikten sonra agent'tan agent'a (A2A) takip yolu kullanır:

    - Hedef oturumun yanıtını bekle.
    - İsteğe bağlı olarak istekte bulunanın ve hedefin sınırlı sayıda takip turu değiş tokuş etmesine izin ver.
    - Hedeften bir duyuru mesajı üretmesini iste.
    - Bu duyuruyu görünür kanala veya iş parçacığına teslim et.

    Bu A2A yolu, gönderenin görünür bir takibe ihtiyaç duyduğu eş gönderimler için bir yedektir.
    Geniş `tools.sessions.visibility` ayarları altında olduğu gibi, ilgisiz bir oturum bir ACP hedefini
    görebildiğinde ve ona mesaj gönderebildiğinde etkin kalır.

    OpenClaw, A2A takibini yalnızca istekte bulunan kendi üst tarafından sahiplenilen tek seferlik
    ACP alt öğesinin üstü olduğunda atlar. Bu durumda, görev tamamlama üstüne A2A çalıştırmak,
    üstü alt öğenin sonucuyla uyandırabilir, üstün yanıtını alt öğeye geri iletebilir ve
    bir üst/alt yankı döngüsü oluşturabilir. `sessions_send` sonucu, bu sahiplenilen alt öğe durumu için
    `delivery.status="skipped"` bildirir; çünkü sonuçtan zaten tamamlama yolu sorumludur.

  </Accordion>
  <Accordion title="Resume an existing session">
    Baştan başlamak yerine önceki bir ACP oturumuna devam etmek için `resumeSessionId` kullanın.
    Agent, konuşma geçmişini `session/load` üzerinden yeniden oynatır; böylece önceki bağlamın tamamıyla devam eder.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Yaygın kullanım durumları:

    - Bir Codex oturumunu dizüstü bilgisayarınızdan telefonunuza devredin — agent'ınıza kaldığınız yerden devam etmesini söyleyin.
    - CLI'da etkileşimli olarak başlattığınız bir kodlama oturumuna şimdi agent'ınız üzerinden başsız şekilde devam edin.
    - Gateway yeniden başlatması veya boşta kalma zaman aşımı nedeniyle kesintiye uğrayan işi sürdürün.

    Notlar:

    - `resumeSessionId` yalnızca `runtime: "acp"` olduğunda geçerlidir; varsayılan sub-agent çalışma zamanı bu yalnızca ACP alanını yok sayar.
    - `streamTo` yalnızca `runtime: "acp"` olduğunda geçerlidir; varsayılan sub-agent çalışma zamanı bu yalnızca ACP alanını yok sayar.
    - `resumeSessionId`, host yerel bir ACP/harness sürdürme kimliğidir, OpenClaw kanal oturumu anahtarı değildir; OpenClaw gönderimden önce ACP spawn ilkesini ve hedef agent ilkesini yine de denetler, bu upstream kimliği yükleme yetkilendirmesinin sahibi ise ACP arka ucu veya harness'tır.
    - `resumeSessionId`, upstream ACP konuşma geçmişini geri yükler; `thread` ve `mode` oluşturduğunuz yeni OpenClaw oturumuna normal şekilde uygulanmaya devam eder, bu yüzden `mode: "session"` yine de `thread: true` gerektirir.
    - Hedef agent `session/load` desteği sunmalıdır (Codex ve Claude Code sunar).
    - Oturum kimliği bulunamazsa spawn net bir hatayla başarısız olur — yeni oturuma sessiz geri dönüş yoktur.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Bir gateway dağıtımından sonra birim testlerine güvenmek yerine canlı uçtan uca denetim çalıştırın:

    1. Hedef host üzerinde dağıtılmış gateway sürümünü ve commit'i doğrulayın.
    2. Canlı bir agent'a geçici bir ACPX köprü oturumu açın.
    3. O agent'tan `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` ve `Reply with exactly LIVE-ACP-SPAWN-OK` göreviyle `sessions_spawn` çağırmasını isteyin.
    4. `accepted=yes`, gerçek bir `childSessionKey` ve doğrulayıcı hatası olmadığını doğrulayın.
    5. Geçici köprü oturumunu temizleyin.

    Kapıyı `mode: "run"` üzerinde tutun ve `streamTo: "parent"` değerini atlayın —
    iş parçacığına bağlı `mode: "session"` ve stream aktarım yolları ayrı,
    daha zengin entegrasyon geçişleridir.

  </Accordion>
</AccordionGroup>

## Sandbox uyumluluğu

ACP oturumları şu anda OpenClaw sandbox'ının içinde **değil**,
host çalışma zamanında çalışır.

<Warning>
**Güvenlik sınırı:**

- Harici çalıştırıcı, kendi CLI izinlerine ve seçili `cwd` değerine göre okuyabilir/yazabilir.
- OpenClaw'ın sandbox ilkesi, ACP çalıştırıcısının yürütülmesini **sarmalamaz**.
- OpenClaw yine de ACP özellik kapılarını, izin verilen aracıları, oturum sahipliğini, kanal bağlamalarını ve Gateway teslim ilkesini uygular.
- Sandbox tarafından uygulanan OpenClaw'a özgü işler için `runtime: "subagent"` kullanın.

</Warning>

Geçerli sınırlamalar:

- İstekte bulunan oturum sandbox içindeyse ACP başlatmaları hem `sessions_spawn({ runtime: "acp" })` hem de `/acp spawn` için engellenir.
- `runtime: "acp"` ile `sessions_spawn`, `sandbox: "require"` desteklemez.

## Oturum hedefi çözümleme

Çoğu `/acp` eylemi isteğe bağlı bir oturum hedefi (`session-key`,
`session-id` veya `session-label`) kabul eder.

**Çözümleme sırası:**

1. Açık hedef bağımsız değişkeni (veya `/acp steer` için `--session`)
   - anahtarı dener
   - ardından UUID biçimli oturum kimliğini dener
   - ardından etiketi dener
2. Geçerli iş parçacığı bağlaması (bu konuşma/iş parçacığı bir ACP oturumuna bağlıysa).
3. Geçerli istek sahibi oturumuna geri dönüş.

Geçerli konuşma bağlamaları ve iş parçacığı bağlamalarının ikisi de
2. adıma katılır.

Hiçbir hedef çözümlenmezse OpenClaw açık bir hata döndürür
(`Unable to resolve session target: ...`).

## ACP denetimleri

| Komut                | Ne yapar                                                        | Örnek                                                        |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------------------------ |
| `/acp spawn`         | ACP oturumu oluşturur; isteğe bağlı geçerli bağlama veya iş parçacığı bağlaması. | `/acp spawn codex --bind here --cwd /repo`                   |
| `/acp cancel`        | Hedef oturum için devam eden turu iptal eder.                   | `/acp cancel agent:codex:acp:<uuid>`                         |
| `/acp steer`         | Çalışan oturuma yönlendirme talimatı gönderir.                  | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Oturumu kapatır ve iş parçacığı hedeflerinin bağını kaldırır.   | `/acp close`                                                 |
| `/acp status`        | Arka ucu, modu, durumu, çalışma zamanı seçeneklerini ve yetenekleri gösterir. | `/acp status`                                                |
| `/acp set-mode`      | Hedef oturum için çalışma zamanı modunu ayarlar.                | `/acp set-mode plan`                                         |
| `/acp set`           | Genel çalışma zamanı yapılandırma seçeneği yazar.               | `/acp set model openai/gpt-5.4`                              |
| `/acp cwd`           | Çalışma zamanı çalışma dizini geçersiz kılmasını ayarlar.       | `/acp cwd /Users/user/Projects/repo`                         |
| `/acp permissions`   | Onay ilkesi profilini ayarlar.                                  | `/acp permissions strict`                                    |
| `/acp timeout`       | Çalışma zamanı zaman aşımını ayarlar (saniye).                  | `/acp timeout 120`                                           |
| `/acp model`         | Çalışma zamanı model geçersiz kılmasını ayarlar.                | `/acp model anthropic/claude-opus-4-6`                       |
| `/acp reset-options` | Oturum çalışma zamanı seçeneği geçersiz kılmalarını kaldırır.   | `/acp reset-options`                                         |
| `/acp sessions`      | Depodan son ACP oturumlarını listeler.                          | `/acp sessions`                                              |
| `/acp doctor`        | Arka uç sağlığı, yetenekler, uygulanabilir düzeltmeler.         | `/acp doctor`                                                |
| `/acp install`       | Deterministik kurulum ve etkinleştirme adımlarını yazdırır.     | `/acp install`                                               |

`/acp status`, etkili çalışma zamanı seçeneklerinin yanı sıra çalışma zamanı düzeyi ve
arka uç düzeyi oturum tanımlayıcılarını gösterir. Desteklenmeyen denetim hataları,
bir arka uçta bir yetenek olmadığında açıkça yüzeye çıkar. `/acp sessions`, geçerli
bağlı oturum veya istek sahibi oturumu için depoyu okur; hedef belirteçler
(`session-key`, `session-id` veya `session-label`), aracı başına özel `session.store`
kökleri dahil olmak üzere gateway oturum keşfi üzerinden çözümlenir.

### Çalışma zamanı seçenekleri eşlemesi

`/acp` kolaylık komutlarına ve genel bir ayarlayıcıya sahiptir. Eşdeğer
işlemler:

| Komut                        | Şuna eşlenir                          | Notlar                                                                                                                                                                         |
| ---------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | çalışma zamanı yapılandırma anahtarı `model` | Codex ACP için OpenClaw, `openai-codex/<model>` değerini bağdaştırıcı model kimliğine normalleştirir ve `openai-codex/gpt-5.4/high` gibi eğik çizgili reasoning soneklerini `reasoning_effort` değerine eşler. |
| `/acp set thinking <level>`  | çalışma zamanı yapılandırma anahtarı `thinking` | Codex ACP için OpenClaw, bağdaştırıcının desteklediği yerde karşılık gelen `reasoning_effort` değerini gönderir.                                                               |
| `/acp permissions <profile>` | çalışma zamanı yapılandırma anahtarı `approval_policy` | —                                                                                                                                                                             |
| `/acp timeout <seconds>`     | çalışma zamanı yapılandırma anahtarı `timeout` | —                                                                                                                                                                             |
| `/acp cwd <path>`            | çalışma zamanı cwd geçersiz kılması   | Doğrudan güncelleme.                                                                                                                                                          |
| `/acp set <key> <value>`     | genel                                 | `key=cwd`, cwd geçersiz kılma yolunu kullanır.                                                                                                                                |
| `/acp reset-options`         | tüm çalışma zamanı geçersiz kılmalarını temizler | —                                                                                                                                                                             |

## acpx çalıştırıcısı, Plugin kurulumu ve izinler

acpx çalıştırıcısı yapılandırması (Claude Code / Codex / Gemini CLI
takma adları), plugin-tools ve OpenClaw-tools MCP köprüleri ve ACP
izin modları için bkz.
[ACP aracıları — kurulum](/tr/tools/acp-agents-setup).

## Sorun giderme

| Belirti                                                                     | Olası neden                                                                                                            | Düzeltme                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Arka uç Plugin eksik, devre dışı veya `plugins.allow` tarafından engellenmiş.                                                       | Arka uç Plugin'i kurup etkinleştirin, izin listesi ayarlanmışsa `plugins.allow` içine `acpx` ekleyin, ardından `/acp doctor` çalıştırın.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP genel olarak devre dışı.                                                                                                 | `acp.enabled=true` olarak ayarlayın.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Normal iş parçacığı mesajlarından otomatik gönderim devre dışı.                                                               | Otomatik iş parçacığı yönlendirmeyi sürdürmek için `acp.dispatch.enabled=true` olarak ayarlayın; açık `sessions_spawn({ runtime: "acp" })` çağrıları yine de çalışır.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent izin listesinde değil.                                                                                                | İzin verilen `agentId` kullanın veya `acp.allowedAgents` ayarını güncelleyin.                                                                                                                     |
| `/acp doctor` başlatmadan hemen sonra arka ucun hazır olmadığını bildiriyor                 | Plugin bağımlılık yoklaması veya kendi kendini onarma hâlâ çalışıyor.                                                               | Kısa süre bekleyip `/acp doctor` komutunu yeniden çalıştırın; sağlıksız kalırsa arka uç kurulum hatasını ve Plugin izin verme/reddetme ilkesini inceleyin.                                             |
| Koşum komutu bulunamadı                                                   | Bağdaştırıcı CLI kurulu değil, hazırlanan Plugin bağımlılıkları eksik veya Codex dışı bir bağdaştırıcı için ilk çalıştırma `npx` getirmesi başarısız oldu. | `/acp doctor` çalıştırın, Plugin bağımlılıklarını onarın, bağdaştırıcıyı Gateway ana makinesinde kurun/önceden hazırlayın veya acpx agent komutunu açıkça yapılandırın.                          |
| Koşumdan model bulunamadı hatası                                            | Model kimliği başka bir sağlayıcı/koşum için geçerli, ancak bu ACP hedefi için değil.                                                | Bu koşumun listelediği bir modeli kullanın, modeli koşumda yapılandırın veya geçersiz kılmayı atlayın.                                                                            |
| Koşumdan satıcı kimlik doğrulama hatası                                          | OpenClaw sağlıklı, ancak hedef CLI/sağlayıcı oturum açmamış.                                                     | Gateway ana makinesi ortamında oturum açın veya gerekli sağlayıcı anahtarını sağlayın.                                                                                             |
| `Unable to resolve session target: ...`                                     | Hatalı anahtar/kimlik/etiket belirteci.                                                                                                | `/acp sessions` çalıştırın, tam anahtarı/etiketi kopyalayın, yeniden deneyin.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | Etkin bağlanabilir bir konuşma olmadan `--bind here` kullanıldı.                                                            | Hedef sohbete/kanala geçip yeniden deneyin veya bağsız oluşturmayı kullanın.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Bağdaştırıcıda geçerli konuşma ACP bağlama yeteneği yok.                                                             | Destekleniyorsa `/acp spawn ... --thread ...` kullanın, üst düzey `bindings[]` yapılandırın veya desteklenen bir kanala geçin.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` bir iş parçacığı bağlamı dışında kullanıldı.                                                                         | Hedef iş parçacığına geçin veya `--thread auto`/`off` kullanın.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Etkin bağlama hedefinin sahibi başka bir kullanıcı.                                                                           | Sahip olarak yeniden bağlayın veya farklı bir konuşma ya da iş parçacığı kullanın.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | Bağdaştırıcıda iş parçacığı bağlama yeteneği yok.                                                                               | `--thread off` kullanın veya desteklenen bağdaştırıcıya/kanala geçin.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP çalışma zamanı ana makine tarafındadır; istekte bulunan oturum sandbox'lıdır.                                                              | Sandbox'lı oturumlardan `runtime="subagent"` kullanın veya ACP oluşturmayı sandbox'lı olmayan bir oturumdan çalıştırın.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP çalışma zamanı için `sandbox="require"` istendi.                                                                         | Zorunlu sandbox için `runtime="subagent"` kullanın veya sandbox'lı olmayan bir oturumdan ACP'yi `sandbox="inherit"` ile kullanın.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | Hedef koşum genel ACP model değiştirmeyi sunmuyor.                                                        | ACP `models`/`session/set_model` duyuran bir koşum kullanın, Codex ACP model referanslarını kullanın veya kendi başlangıç bayrağı varsa modeli doğrudan koşumda yapılandırın. |
| Bağlı oturum için ACP meta verileri eksik                                      | Eski/silinmiş ACP oturum meta verileri.                                                                                    | `/acp spawn` ile yeniden oluşturun, ardından iş parçacığını yeniden bağlayın/odaklayın.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode`, etkileşimsiz ACP oturumunda yazma/çalıştırma işlemlerini engelliyor.                                                    | `plugins.entries.acpx.config.permissionMode` değerini `approve-all` olarak ayarlayın ve gateway'i yeniden başlatın. Bkz. [İzin yapılandırması](/tr/tools/acp-agents-setup#permission-configuration). |
| ACP oturumu az çıktıyla erken başarısız oluyor                                  | İzin istemleri `permissionMode`/`nonInteractivePermissions` tarafından engelleniyor.                                        | `AcpRuntimeError` için gateway günlüklerini kontrol edin. Tam izinler için `permissionMode=approve-all`; düzgün düşürme için `nonInteractivePermissions=deny` ayarlayın.        |
| ACP oturumu işi tamamladıktan sonra süresiz olarak takılıyor                       | Koşum süreci tamamlandı, ancak ACP oturumu tamamlanmayı bildirmedi.                                                    | `ps aux \| grep acpx` ile izleyin; eski süreçleri elle sonlandırın.                                                                                                       |
| Koşum `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` görüyor                        | İç olay zarfı ACP sınırından sızdı.                                                                | OpenClaw'ı güncelleyin ve tamamlama akışını yeniden çalıştırın; dış koşumlar yalnızca düz tamamlama istemleri almalıdır.                                                          |

## İlgili

- [ACP agent'ları — kurulum](/tr/tools/acp-agents-setup)
- [Agent gönderme](/tr/tools/agent-send)
- [CLI Arka Uçları](/tr/gateway/cli-backends)
- [Codex koşumu](/tr/plugins/codex-harness)
- [Çok agent'lı sandbox araçları](/tr/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (köprü modu)](/tr/cli/acp)
- [Alt agent'lar](/tr/tools/subagents)
