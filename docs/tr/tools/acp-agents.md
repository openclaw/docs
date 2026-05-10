---
read_when:
    - Kodlama yürütme ortamlarını ACP üzerinden çalıştırma
    - Mesajlaşma kanallarında konuşmaya bağlı ACP oturumlarını ayarlama
    - Bir mesaj kanalı konuşmasını kalıcı bir ACP oturumuna bağlama
    - ACP arka ucu, Plugin bağlantılandırması veya tamamlama iletimi için sorun giderme
    - Sohbetten /acp komutlarını çalıştırma
sidebarTitle: ACP agents
summary: Harici kodlama çalıştırıcılarını (Claude Code, Cursor, Gemini CLI, açık Codex ACP, OpenClaw ACP, OpenCode) ACP arka ucu üzerinden çalıştırın
title: ACP ajanları
x-i18n:
    generated_at: "2026-05-10T19:56:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6f4beb509c00c965bc2b202648f1b6567d1f3a633f2f9926882adafc5144e06
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) oturumları,
OpenClaw'ın harici kodlama harness'larını (örneğin Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI ve diğer
desteklenen ACPX harness'ları) bir ACP arka uç Plugin'i üzerinden çalıştırmasını sağlar.

Her ACP oturumu spawn'ı bir [arka plan görevi](/tr/automation/tasks) olarak izlenir.

<Note>
**ACP, harici harness yoludur; varsayılan Codex yolu değildir.** Yerel
Codex uygulama sunucusu Plugin'i, agent dönüşleri için `/codex ...`
kontrollerinin ve varsayılan `openai/gpt-*` gömülü runtime'ının sahibidir;
ACP ise `/acp ...` kontrollerinin ve `sessions_spawn({ runtime: "acp" })`
oturumlarının sahibidir.

Codex veya Claude Code'un, mevcut OpenClaw kanal konuşmalarına doğrudan
harici bir MCP istemcisi olarak bağlanmasını istiyorsanız ACP yerine
[`openclaw mcp serve`](/tr/cli/mcp) kullanın.
</Note>

## Hangi sayfayı istiyorum?

| Şunu yapmak istiyorsunuz…                                                                       | Bunu kullanın                         | Notlar                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Geçerli konuşmada Codex'i bağlamak veya kontrol etmek                                           | `/codex bind`, `/codex threads`       | `codex` Plugin'i etkin olduğunda yerel Codex uygulama sunucusu yolu; bağlı sohbet yanıtları, görüntü iletme, model/hızlı/izinler, durdurma ve yönlendirme kontrollerini içerir. ACP açık bir yedektir |
| Claude Code, Gemini CLI, açık Codex ACP veya başka bir harici harness'ı OpenClaw _üzerinden_ çalıştırmak | Bu sayfa                              | Sohbete bağlı oturumlar, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, arka plan görevleri, runtime kontrolleri                                                                                         |
| Bir OpenClaw Gateway oturumunu bir düzenleyici veya istemci için ACP sunucusu _olarak_ açmak    | [`openclaw acp`](/tr/cli/acp)            | Köprü modu. IDE/istemci, stdio/WebSocket üzerinden OpenClaw'a ACP konuşur                                                                                                                                     |
| Yerel bir AI CLI'ını yalnızca metin tabanlı yedek model olarak yeniden kullanmak                | [CLI Arka Uçları](/tr/gateway/cli-backends) | ACP değildir. OpenClaw araçları yok, ACP kontrolleri yok, harness runtime'ı yok                                                                                                                               |

## Bu kutudan çıktığı gibi çalışır mı?

Evet, resmi ACP runtime Plugin'i yüklendikten sonra:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Kaynak checkout'ları, `pnpm install` sonrasında yerel `extensions/acpx`
çalışma alanı Plugin'ini kullanabilir. Hazırlık denetimi için `/acp doctor`
çalıştırın.

OpenClaw, agent'lara ACP spawn işlemini yalnızca ACP **gerçekten
kullanılabilir** olduğunda öğretir: ACP etkin olmalı, dispatch devre dışı
olmamalı, geçerli oturum sandbox tarafından engellenmemiş olmalı ve bir
runtime arka ucu yüklenmiş olmalıdır. Bu koşullar karşılanmazsa ACP Plugin
Skills'leri ve `sessions_spawn` ACP kılavuzu gizli kalır; böylece agent
kullanılamayan bir arka uç önermez.

<AccordionGroup>
  <Accordion title="İlk çalıştırma sorunları">
    - `plugins.allow` ayarlanmışsa bu kısıtlayıcı bir Plugin envanteridir ve `acpx` öğesini **içermelidir**; aksi halde yüklü ACP arka ucu kasıtlı olarak engellenir ve `/acp doctor` eksik allowlist girdisini bildirir.
    - Codex ACP adaptörü, `acpx` Plugin'iyle hazırlanır ve mümkün olduğunda yerelde başlatılır.
    - Codex ACP yalıtılmış bir `CODEX_HOME` ile çalışır; OpenClaw, ana makinedeki Codex config'inden yalnızca güvenilir proje girdilerini kopyalar ve etkin çalışma alanına güvenir; auth, bildirimler ve hook'lar ana makine config'inde kalır.
    - Diğer hedef harness adaptörleri, ilk kullanımınızda hâlâ `npx` ile isteğe bağlı olarak getirilebilir.
    - Vendor auth, o harness için ana makinede hâlâ mevcut olmalıdır.
    - Ana makinede npm veya ağ erişimi yoksa ilk çalıştırma adaptör getirmeleri, önbellekler önceden ısıtılana veya adaptör başka bir yolla yüklenene kadar başarısız olur.

  </Accordion>
  <Accordion title="Runtime önkoşulları">
    ACP gerçek bir harici harness süreci başlatır. OpenClaw yönlendirme,
    arka plan görevi durumu, teslim, bağlamalar ve politikanın sahibidir;
    harness ise kendi sağlayıcı oturum açma işleminin, model kataloğunun,
    dosya sistemi davranışının ve yerel araçlarının sahibidir.

    OpenClaw'ı suçlamadan önce şunları doğrulayın:

    - `/acp doctor` etkin ve sağlıklı bir arka uç bildiriyor.
    - İlgili allowlist ayarlandığında hedef id, `acp.allowedAgents` tarafından izinli.
    - Harness komutu Gateway ana makinesinde başlatılabiliyor.
    - Sağlayıcı auth'u o harness için mevcut (`claude`, `codex`, `gemini`, `opencode`, `droid` vb.).
    - Seçilen model o harness için mevcut - model id'leri harness'lar arasında taşınabilir değildir.
    - İstenen `cwd` mevcut ve erişilebilir ya da `cwd` değerini atlayıp arka ucun varsayılanını kullanmasına izin verin.
    - İzin modu işle eşleşiyor. Etkileşimsiz oturumlar yerel izin istemlerine tıklayamaz; bu nedenle yazma/çalıştırma ağırlıklı kodlama çalışmaları genellikle başsız ilerleyebilen bir ACPX izin profiline ihtiyaç duyar.

  </Accordion>
</AccordionGroup>

OpenClaw Plugin araçları ve yerleşik OpenClaw araçları varsayılan olarak
ACP harness'larına açılmaz. Harness'ın bu araçları doğrudan çağırması
gerektiğinde yalnızca [ACP agent'ları - kurulum](/tr/tools/acp-agents-setup)
içindeki açık MCP köprülerini etkinleştirin.

## Desteklenen harness hedefleri

`acpx` arka ucuyla, `/acp spawn <id>` veya
`sessions_spawn({ runtime: "acp", agentId: "<id>" })` hedefleri olarak şu
harness id'lerini kullanın:

| Harness id | Tipik arka uç                                  | Notlar                                                                                  |
| ---------- | ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP adaptörü                       | Ana makinede Claude Code auth gerektirir.                                               |
| `codex`    | Codex ACP adaptörü                             | Yalnızca yerel `/codex` kullanılamadığında veya ACP istendiğinde açık ACP yedeği.       |
| `copilot`  | GitHub Copilot ACP adaptörü                    | Copilot CLI/runtime auth gerektirir.                                                    |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Yerel kurulum farklı bir ACP giriş noktası sunuyorsa acpx komutunu geçersiz kılın.      |
| `droid`    | Factory Droid CLI                              | Harness ortamında Factory/Droid auth veya `FACTORY_API_KEY` gerektirir.                 |
| `gemini`   | Gemini CLI ACP adaptörü                        | Gemini CLI auth veya API key kurulumu gerektirir.                                       |
| `iflow`    | iFlow CLI                                      | Adaptör kullanılabilirliği ve model kontrolü yüklü CLI'a bağlıdır.                      |
| `kilocode` | Kilo Code CLI                                  | Adaptör kullanılabilirliği ve model kontrolü yüklü CLI'a bağlıdır.                      |
| `kimi`     | Kimi/Moonshot CLI                              | Ana makinede Kimi/Moonshot auth gerektirir.                                             |
| `kiro`     | Kiro CLI                                       | Adaptör kullanılabilirliği ve model kontrolü yüklü CLI'a bağlıdır.                      |
| `opencode` | OpenCode ACP adaptörü                          | OpenCode CLI/sağlayıcı auth gerektirir.                                                 |
| `openclaw` | `openclaw acp` üzerinden OpenClaw Gateway köprüsü | ACP farkındalığı olan bir harness'ın bir OpenClaw Gateway oturumuna geri konuşmasını sağlar. |
| `pi`       | Pi/gömülü OpenClaw runtime'ı                   | OpenClaw yerel harness deneyleri için kullanılır.                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | Ana makinede Qwen uyumlu auth gerektirir.                                               |

Özel acpx agent alias'ları acpx içinde yapılandırılabilir, ancak OpenClaw
politikası dispatch öncesinde yine de `acp.allowedAgents` ve varsa
`agents.list[].runtime.acp.agent` eşlemesini denetler.

## Operatör runbook'u

Sohbetten hızlı `/acp` akışı:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` veya açık
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Çalışma">
    Bağlı konuşmada veya thread'de devam edin (ya da oturum anahtarını
    açıkça hedefleyin).
  </Step>
  <Step title="Durumu denetleme">
    `/acp status`
  </Step>
  <Step title="Ayarlama">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Yönlendirme">
    Bağlamı değiştirmeden: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Durdurma">
    `/acp cancel` (geçerli dönüş) veya `/acp close` (oturum + bağlamalar).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Yaşam döngüsü ayrıntıları">
    - Spawn, bir ACP runtime oturumu oluşturur veya sürdürür, ACP meta verilerini OpenClaw oturum deposuna kaydeder ve çalışma üst öğeye ait olduğunda bir arka plan görevi oluşturabilir.
    - Üst öğeye ait ACP oturumları, runtime oturumu kalıcı olsa bile arka plan işi olarak değerlendirilir; tamamlama ve yüzeyler arası teslim, normal kullanıcıya dönük sohbet oturumu gibi davranmak yerine üst görev bildiricisi üzerinden gider.
    - Görev bakımı, terminal veya yetim kalmış üst öğeye ait tek seferlik ACP oturumlarını kapatır. Kalıcı ACP oturumları etkin bir konuşma bağlaması kaldığı sürece korunur; etkin bağlaması olmayan eski kalıcı oturumlar, sahip olan görev tamamlandıktan veya görev kaydı kaybolduktan sonra sessizce sürdürülememeleri için kapatılır.
    - Bağlı takip mesajları, bağlama kapatılana, odaktan çıkarılana, sıfırlanana veya süresi dolana kadar doğrudan ACP oturumuna gider.
    - Gateway komutları yerel kalır. `/acp ...`, `/status` ve `/unfocus` bağlı bir ACP harness'ına asla normal prompt metni olarak gönderilmez.
    - `cancel`, arka uç iptali desteklediğinde etkin dönüşü iptal eder; bağlamayı veya oturum meta verilerini silmez.
    - `close`, OpenClaw açısından ACP oturumunu sonlandırır ve bağlamayı kaldırır. Bir harness, sürdürmeyi destekliyorsa kendi upstream geçmişini yine de tutabilir.
    - acpx Plugin'i, `close` sonrasında OpenClaw'a ait wrapper ve adaptör süreç ağaçlarını temizler ve Gateway başlatılırken eski OpenClaw'a ait ACPX yetimlerini toplar.
    - Boştaki runtime worker'ları `acp.runtime.ttlMinutes` sonrasında temizleme için uygundur; depolanan oturum meta verileri `/acp sessions` için kullanılabilir kalır.

  </Accordion>
  <Accordion title="Yerel Codex yönlendirme kuralları">
    Etkin olduğunda **yerel Codex Plugin'ine** yönlendirilmesi gereken
    doğal dil tetikleyicileri:

    - "Bu Discord kanalını Codex'e bağla."
    - "Bu sohbeti Codex thread'i `<id>` öğesine ekle."
    - "Codex thread'lerini göster, sonra bunu bağla."

    Yerel Codex konuşma bağlaması varsayılan sohbet-denetim yoludur.
    OpenClaw dinamik araçları yine OpenClaw üzerinden çalıştırılırken
    shell/apply-patch gibi Codex'e özgü yerel araçlar Codex içinde
    çalıştırılır. Codex'e özgü yerel araç olayları için OpenClaw, her tur
    için yerel bir kanca aktarıcısı enjekte eder; böylece Plugin kancaları
    `before_tool_call` aşamasında engelleyebilir, `after_tool_call`
    aşamasını gözlemleyebilir ve Codex `PermissionRequest` olaylarını
    OpenClaw onayları üzerinden yönlendirebilir. Codex `Stop` kancaları,
    OpenClaw `before_agent_finalize` aşamasına aktarılır; burada Plugin'ler,
    Codex yanıtını sonlandırmadan önce bir model geçişi daha isteyebilir.
    Aktarıcı bilinçli olarak muhafazakar kalır: Codex'e özgü yerel araç
    bağımsız değişkenlerini değiştirmez veya Codex iş parçacığı kayıtlarını
    yeniden yazmaz. Açık ACP'yi yalnızca ACP çalışma zamanı/oturum modelini
    istediğinizde kullanın. Gömülü Codex destek sınırı
    [Codex harness v1 destek sözleşmesi](/tr/plugins/codex-harness-runtime#v1-support-contract)
    içinde belgelenmiştir.

  </Accordion>
  <Accordion title="Model / sağlayıcı / çalışma zamanı seçimi özet tablosu">
    - `openai-codex/*` - doctor tarafından onarılan eski Codex OAuth/abonelik modeli yolu.
    - `openai/*` - OpenAI ajan turları için yerel Codex app-server gömülü çalışma zamanı.
    - `/codex ...` - yerel Codex konuşma denetimi.
    - `/acp ...` veya `runtime: "acp"` - açık ACP/acpx denetimi.

  </Accordion>
  <Accordion title="ACP yönlendirmesi doğal dil tetikleyicileri">
    ACP çalışma zamanına yönlendirilmesi gereken tetikleyiciler:

    - "Bunu tek seferlik bir Claude Code ACP oturumu olarak çalıştır ve sonucu özetle."
    - "Bu görev için Gemini CLI'ı bir iş parçacığında kullan, ardından takipleri aynı iş parçacığında tut."
    - "Codex'i ACP üzerinden bir arka plan iş parçacığında çalıştır."

    OpenClaw `runtime: "acp"` değerini seçer, harness `agentId`
    değerini çözümler, desteklendiğinde geçerli konuşmaya veya iş
    parçacığına bağlanır ve takipleri kapanış/süre dolumuna kadar o
    oturuma yönlendirir. Codex bu yolu yalnızca ACP/acpx açık olduğunda
    veya istenen işlem için yerel Codex Plugin'i kullanılamadığında izler.

    `sessions_spawn` için `runtime: "acp"` yalnızca ACP etkinse,
    istekte bulunan korumalı alanda değilse ve bir ACP çalışma zamanı
    arka ucu yüklüyse duyurulur. `acp.dispatch.enabled=false` otomatik
    ACP iş parçacığı dağıtımını duraklatır ancak açık
    `sessions_spawn({ runtime: "acp" })` çağrılarını gizlemez veya engellemez. `codex`,
    `claude`, `droid`, `gemini` ya da `opencode` gibi ACP harness kimliklerini hedefler. Bu giriş
    açıkça `agents.list[].runtime.type="acp"` ile yapılandırılmadıkça
    `agents_list` içinden normal bir OpenClaw yapılandırma ajan kimliği
    geçirmeyin; aksi halde varsayılan alt ajan çalışma zamanını kullanın.
    Bir OpenClaw ajanı `runtime.type="acp"` ile yapılandırıldığında,
    OpenClaw alttaki harness kimliği olarak `runtime.acp.agent` değerini
    kullanır.

  </Accordion>
</AccordionGroup>

## ACP ve alt ajanlar

Harici bir harness çalışma zamanı istediğinizde ACP kullanın. `codex`
Plugin'i etkin olduğunda Codex konuşma bağlaması/denetimi için **yerel Codex
app-server** kullanın. OpenClaw'a özgü yerel devredilmiş çalıştırmalar
istediğinizde **alt ajanlar** kullanın.

| Alan          | ACP oturumu                           | Alt ajan çalıştırması             |
| ------------- | ------------------------------------- | ---------------------------------- |
| Çalışma zamanı | ACP arka uç Plugin'i (örneğin acpx) | OpenClaw yerel alt ajan çalışma zamanı |
| Oturum anahtarı | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`  |
| Ana komutlar | `/acp ...`                            | `/subagents ...`                   |
| Oluşturma aracı | `sessions_spawn` ile `runtime:"acp"` | `sessions_spawn` (varsayılan çalışma zamanı) |

Ayrıca bkz. [Alt ajanlar](/tr/tools/subagents).

## ACP Claude Code'u nasıl çalıştırır

ACP üzerinden Claude Code için yığın şöyledir:

1. OpenClaw ACP oturum denetim düzlemi.
2. Resmi `@openclaw/acpx` çalışma zamanı Plugin'i.
3. Claude ACP bağdaştırıcısı.
4. Claude tarafı çalışma zamanı/oturum mekanizması.

ACP Claude, ACP denetimleri, oturum sürdürme, arka plan görev takibi ve
isteğe bağlı konuşma/iş parçacığı bağlaması içeren bir **harness oturumudur**.

CLI arka uçları ayrı, yalnızca metin tabanlı yerel yedek çalışma
zamanlarıdır - bkz. [CLI Arka Uçları](/tr/gateway/cli-backends).

Operatörler için pratik kural şöyledir:

- **`/acp spawn`, bağlanabilir oturumlar, çalışma zamanı denetimleri veya kalıcı harness işi mi istiyorsunuz?** ACP kullanın.
- **Ham CLI üzerinden basit yerel metin yedeği mi istiyorsunuz?** CLI arka uçlarını kullanın.

## Bağlı oturumlar

### Zihinsel model

- **Sohbet yüzeyi** - insanların konuşmayı sürdürdüğü yer (Discord kanalı, Telegram konusu, iMessage sohbeti).
- **ACP oturumu** - OpenClaw'ın yönlendirdiği kalıcı Codex/Claude/Gemini çalışma zamanı durumu.
- **Alt iş parçacığı/konu** - yalnızca `--thread ...` tarafından oluşturulan isteğe bağlı ek mesajlaşma yüzeyi.
- **Çalışma zamanı çalışma alanı** - harness'in çalıştığı dosya sistemi konumu (`cwd`, repo checkout, arka uç çalışma alanı). Sohbet yüzeyinden bağımsızdır.

### Geçerli konuşma bağlamaları

`/acp spawn <harness> --bind here`, geçerli konuşmayı oluşturulan ACP
oturumuna sabitler - alt iş parçacığı yoktur, aynı sohbet yüzeyi kullanılır.
OpenClaw taşıma, kimlik doğrulama, güvenlik ve teslimi yönetmeye devam eder.
Bu konuşmadaki takip mesajları aynı oturuma yönlendirilir; `/new` ve
`/reset` oturumu yerinde sıfırlar; `/acp close` bağlamayı kaldırır.

Örnekler:

```text
/codex bind                                              # yerel Codex bağlaması, gelecekteki mesajları buraya yönlendir
/codex model gpt-5.4                                     # bağlı yerel Codex iş parçacığını ayarla
/codex stop                                              # etkin yerel Codex turunu denetle
/acp spawn codex --bind here                             # Codex için açık ACP yedeği
/acp spawn codex --thread auto                           # alt iş parçacığı/konu oluşturabilir ve oraya bağlayabilir
/acp spawn codex --bind here --cwd /workspace/repo       # aynı sohbet bağlaması, Codex /workspace/repo içinde çalışır
```

<AccordionGroup>
  <Accordion title="Bağlama kuralları ve münhasırlık">
    - `--bind here` ve `--thread ...` karşılıklı olarak birbirini dışlar.
    - `--bind here` yalnızca geçerli konuşma bağlamasını duyuran kanallarda çalışır; aksi halde OpenClaw açık bir desteklenmiyor mesajı döndürür. Bağlamalar Gateway yeniden başlatmalarında korunur.
    - Discord'da `spawnSessions`, `--thread auto|here` için alt iş parçacığı oluşturmayı denetler - `--bind here` için değil.
    - `--cwd` olmadan farklı bir ACP ajanına oluşturma yaparsanız, OpenClaw varsayılan olarak **hedef ajanın** çalışma alanını devralır. Eksik devralınan yollar (`ENOENT`/`ENOTDIR`) arka uç varsayılanına geri döner; diğer erişim hataları (örn. `EACCES`) oluşturma hataları olarak gösterilir.
    - Gateway yönetim komutları bağlı konuşmalarda yerel kalır - normal takip metni bağlı ACP oturumuna yönlendirilse bile `/acp ...` komutları OpenClaw tarafından işlenir; `/status` ve `/unfocus` da o yüzey için komut işleme etkin olduğunda yerel kalır.

  </Accordion>
  <Accordion title="İş parçacığına bağlı oturumlar">
    Bir kanal bağdaştırıcısı için iş parçacığı bağlamaları etkin olduğunda:

    - OpenClaw bir iş parçacığını hedef ACP oturumuna bağlar.
    - Bu iş parçacığındaki takip mesajları bağlı ACP oturumuna yönlendirilir.
    - ACP çıktısı aynı iş parçacığına geri teslim edilir.
    - Odaktan çıkarma/kapatma/arşivleme/boşta kalma zaman aşımı veya azami yaş süresi dolumu bağlamayı kaldırır.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` ve `/unfocus` Gateway komutlarıdır, ACP harness'ine gönderilen istemler değildir.

    İş parçacığına bağlı ACP için gerekli özellik bayrakları:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` varsayılan olarak açıktır (otomatik ACP iş parçacığı dağıtımını duraklatmak için `false` olarak ayarlayın; açık `sessions_spawn({ runtime: "acp" })` çağrıları çalışmaya devam eder).
    - Kanal bağdaştırıcısı iş parçacığı oturum oluşturma etkin (varsayılan: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    İş parçacığı bağlama desteği bağdaştırıcıya özeldir. Etkin kanal
    bağdaştırıcısı iş parçacığı bağlamalarını desteklemiyorsa, OpenClaw
    açık bir desteklenmiyor/kullanılamıyor mesajı döndürür.

  </Accordion>
  <Accordion title="İş parçacığını destekleyen kanallar">
    - Oturum/iş parçacığı bağlama yeteneği sunan herhangi bir kanal bağdaştırıcısı.
    - Geçerli yerleşik destek: **Discord** iş parçacıkları/kanalları, **Telegram** konuları (gruplarda/süper gruplarda forum konuları ve DM konuları).
    - Plugin kanalları aynı bağlama arayüzü üzerinden destek ekleyebilir.

  </Accordion>
</AccordionGroup>

## Kalıcı kanal bağlamaları

Geçici olmayan iş akışları için kalıcı ACP bağlamalarını üst düzey
`bindings[]` girişlerinde yapılandırın.

### Bağlama modeli

<ParamField path="bindings[].type" type='"acp"'>
  Kalıcı bir ACP konuşma bağlamasını işaretler.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Hedef konuşmayı tanımlar. Kanal başına biçimler:

- **Discord kanalı/iş parçacığı:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack kanalı/DM:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Kararlı Slack kimliklerini tercih edin; kanal bağlamaları o kanalın iş parçacıkları içindeki yanıtlarla da eşleşir.
- **Telegram forum konusu:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **iMessage DM/grup:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Kararlı grup bağlamaları için `chat_id:*` tercih edin.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Sahip OpenClaw ajan kimliği.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  İsteğe bağlı ACP geçersiz kılması.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  İsteğe bağlı operatöre dönük etiket.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  İsteğe bağlı çalışma zamanı çalışma dizini.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  İsteğe bağlı arka uç geçersiz kılması.
</ParamField>

### Ajan başına çalışma zamanı varsayılanları

ACP varsayılanlarını ajan başına bir kez tanımlamak için `agents.list[].runtime` kullanın:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness kimliği, örn. `codex` veya `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP bağlı oturumları için geçersiz kılma önceliği:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Genel ACP varsayılanları (örn. `acp.backend`)

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

- OpenClaw, yapılandırılmış ACP oturumunun kullanılmadan önce var olduğundan emin olur.
- Bu kanaldaki veya konudaki mesajlar, yapılandırılmış ACP oturumuna yönlendirilir.
- Bağlı konuşmalarda `/new` ve `/reset`, aynı ACP oturum anahtarını yerinde sıfırlar.
- Geçici çalışma zamanı bağlamaları (örneğin iş parçacığı odağı akışları tarafından oluşturulanlar), mevcut oldukları yerde uygulanmaya devam eder.
- Açık bir `cwd` olmadan ajanlar arası ACP başlatmalarında OpenClaw, hedef ajan çalışma alanını ajan yapılandırmasından devralır.
- Eksik devralınan çalışma alanı yolları arka uç varsayılan cwd değerine geri döner; eksik olmayan erişim hataları başlatma hataları olarak gösterilir.

## ACP oturumlarını başlatma

Bir ACP oturumu başlatmanın iki yolu vardır:

<Tabs>
  <Tab title="sessions_spawn üzerinden">
    Bir ajan dönüşünden veya araç çağrısından ACP oturumu başlatmak için `runtime: "acp"`
    kullanın.

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
    `runtime` varsayılan olarak `subagent` olur; bu yüzden ACP oturumları için
    açıkça `runtime: "acp"` ayarlayın. `agentId` atlanırsa, yapılandırıldığında
    OpenClaw `acp.defaultAgent` kullanır. `mode: "session"`, kalıcı bir bağlı
    konuşma tutmak için `thread: true` gerektirir.
    </Note>

  </Tab>
  <Tab title="/acp komutundan">
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
  ACP hedef harness kimliği. Ayarlıysa `acp.defaultAgent` değerine geri döner.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Desteklendiği yerlerde iş parçacığı bağlama akışı ister.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` tek seferliktir; `"session"` kalıcıdır. `thread: true` ise ve
  `mode` atlanmışsa, OpenClaw çalışma zamanı yoluna göre kalıcı davranışı
  varsayılan olarak kullanabilir. `mode: "session"` `thread: true` gerektirir.
</ParamField>
<ParamField path="cwd" type="string">
  İstenen çalışma zamanı çalışma dizini (arka uç/çalışma zamanı
  ilkesi tarafından doğrulanır). Atlanırsa, ACP başlatma yapılandırıldığında
  hedef ajan çalışma alanını devralır; eksik devralınan yollar arka uç
  varsayılanlarına geri dönerken gerçek erişim hataları döndürülür.
</ParamField>
<ParamField path="label" type="string">
  Oturum/banner metninde kullanılan operatöre dönük etiket.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Yeni bir oturum oluşturmak yerine mevcut bir ACP oturumunu sürdürür. Ajan,
  konuşma geçmişini `session/load` aracılığıyla yeniden oynatır. `runtime: "acp"`
  gerektirir.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"`, ilk ACP çalıştırma ilerleme özetlerini sistem olayları olarak
  istekte bulunan oturuma geri akıtır. Kabul edilen yanıtlar, tam aktarma
  geçmişi için tail ile izleyebileceğiniz oturum kapsamlı bir JSONL günlüğüne
  (`<sessionId>.acp-stream.jsonl`) işaret eden `streamLogPath` içerir.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  ACP alt dönüşünü N saniye sonra sonlandırır. `0`, dönüşü Gateway'in
  zaman aşımı olmayan yolunda tutar. Aynı değer Gateway çalıştırmasına
  ve ACP çalışma zamanına uygulanır; böylece takılan/kota tükenmiş harness'lar
  üst ajan hattını süresiz olarak meşgul etmez.
</ParamField>
<ParamField path="model" type="string">
  ACP alt oturumu için açık model geçersiz kılması. Codex ACP başlatmaları,
  `openai-codex/gpt-5.4` gibi OpenClaw Codex başvurularını `session/new`
  öncesinde Codex ACP başlangıç yapılandırmasına normalleştirir; `openai-codex/gpt-5.4/high`
  gibi eğik çizgi biçimleri ayrıca Codex ACP akıl yürütme çabasını ayarlar.
  Diğer harness'lar ACP `models` bildirmeli ve `session/set_model`
  desteklemelidir; aksi halde OpenClaw/acpx hedef ajan varsayılanına sessizce
  geri dönmek yerine açıkça başarısız olur.
</ParamField>
<ParamField path="thinking" type="string">
  Açık düşünme/akıl yürütme çabası. Codex ACP için `minimal` düşük çabaya
  eşlenir, `low`/`medium`/`high`/`xhigh` doğrudan eşlenir ve `off`
  akıl yürütme çabası başlangıç geçersiz kılmasını atlar.
</ParamField>

## Başlatma bağlama ve iş parçacığı modları

<Tabs>
  <Tab title="--bind here|off">
    | Mod    | Davranış                                                              |
    | ------ | --------------------------------------------------------------------- |
    | `here` | Geçerli etkin konuşmayı yerinde bağlar; etkin konuşma yoksa başarısız olur. |
    | `off`  | Geçerli konuşma bağlaması oluşturmaz.                                 |

    Notlar:

    - `--bind here`, "bu kanalı veya sohbeti Codex destekli yap" için en basit operatör yoludur.
    - `--bind here` alt iş parçacığı oluşturmaz.
    - `--bind here` yalnızca geçerli konuşma bağlama desteğini sunan kanallarda kullanılabilir.
    - `--bind` ve `--thread` aynı `/acp spawn` çağrısında birleştirilemez.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mod    | Davranış                                                                                         |
    | ------ | ------------------------------------------------------------------------------------------------ |
    | `auto` | Etkin bir iş parçacığında: o iş parçacığını bağlar. İş parçacığı dışında: destekleniyorsa bir alt iş parçacığı oluşturur/bağlar. |
    | `here` | Geçerli etkin iş parçacığını gerektirir; içinde değilse başarısız olur.                          |
    | `off`  | Bağlama yoktur. Oturum bağlantısız başlar.                                                       |

    Notlar:

    - İş parçacığı bağlaması olmayan yüzeylerde varsayılan davranış fiilen `off` olur.
    - İş parçacığına bağlı başlatma kanal ilkesi desteği gerektirir:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Alt iş parçacığı oluşturmadan geçerli konuşmayı sabitlemek istediğinizde `--bind here` kullanın.

  </Tab>
</Tabs>

## Teslim modeli

ACP oturumları etkileşimli çalışma alanları veya üst öğenin sahip olduğu
arka plan işleri olabilir. Teslim yolu bu yapıya bağlıdır.

<AccordionGroup>
  <Accordion title="Etkileşimli ACP oturumları">
    Etkileşimli oturumlar görünür bir sohbet yüzeyinde konuşmayı sürdürmek
    için tasarlanmıştır:

    - `/acp spawn ... --bind here` geçerli konuşmayı ACP oturumuna bağlar.
    - `/acp spawn ... --thread ...` bir kanal iş parçacığını/konusunu ACP oturumuna bağlar.
    - Kalıcı yapılandırılmış `bindings[].type="acp"`, eşleşen konuşmaları aynı ACP oturumuna yönlendirir.

    Bağlı konuşmadaki takip mesajları doğrudan ACP oturumuna yönlendirilir
    ve ACP çıktısı aynı kanala/iş parçacığına/konuya geri teslim edilir.

    OpenClaw'un harness'a gönderdiği:

    - Normal bağlı takipler, yalnızca harness/arka uç desteklediğinde eklerle birlikte istem metni olarak gönderilir.
    - `/acp` yönetim komutları ve yerel Gateway komutları ACP gönderiminden önce yakalanır.
    - Çalışma zamanı tarafından oluşturulan tamamlama olayları hedefe göre somutlaştırılır. OpenClaw ajanları OpenClaw'un dahili çalışma zamanı bağlamı zarfını alır; harici ACP harness'ları alt sonuç ve talimat içeren düz bir istem alır. Ham `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` zarfı hiçbir zaman harici harness'lara gönderilmemeli veya ACP kullanıcı döküm metni olarak kalıcı hale getirilmemelidir.
    - ACP döküm girdileri kullanıcıya görünür tetikleyici metni veya düz tamamlama istemini kullanır. Dahili olay meta verileri mümkün olduğunda OpenClaw içinde yapılandırılmış kalır ve kullanıcı tarafından yazılmış sohbet içeriği olarak değerlendirilmez.

  </Accordion>
  <Accordion title="Üst öğenin sahip olduğu tek seferlik ACP oturumları">
    Başka bir ajan çalıştırması tarafından başlatılan tek seferlik ACP oturumları,
    alt ajanlara benzer arka plan alt öğeleridir:

    - Üst öğe `sessions_spawn({ runtime: "acp", mode: "run" })` ile iş ister.
    - Alt öğe kendi ACP harness oturumunda çalışır.
    - Alt dönüşler yerel alt ajan başlatmaları tarafından kullanılan aynı arka plan hattında çalışır; bu nedenle yavaş bir ACP harness'ı ilgisiz ana oturum işini engellemez.
    - Tamamlama, görev tamamlama duyuru yolu üzerinden geri raporlanır. OpenClaw, harici bir harness'a göndermeden önce dahili tamamlama meta verilerini düz bir ACP istemine dönüştürür; böylece harness'lar yalnızca OpenClaw'a özgü çalışma zamanı bağlamı işaretçilerini görmez.
    - Kullanıcıya dönük bir yanıt yararlı olduğunda üst öğe alt sonucu normal asistan sesiyle yeniden yazar.

    Bu yolu üst öğe ile alt öğe arasında eşler arası sohbet olarak
    değerlendirmeyin. Alt öğenin üst öğeye geri dönen bir tamamlama kanalı
    zaten vardır.

  </Accordion>
  <Accordion title="sessions_send ve A2A teslimi">
    `sessions_send`, başlatmadan sonra başka bir oturumu hedefleyebilir. Normal
    eş oturumları için OpenClaw, mesajı enjekte ettikten sonra ajandan ajana
    (A2A) takip yolu kullanır:

    - Hedef oturumun yanıtını bekler.
    - İsteğe bağlı olarak istekte bulunanın ve hedefin sınırlı sayıda takip dönüşü alışverişi yapmasına izin verir.
    - Hedeften bir duyuru mesajı üretmesini ister.
    - Bu duyuruyu görünür kanala veya iş parçacığına teslim eder.

    Bu A2A yolu, gönderenin görünür bir takibe ihtiyaç duyduğu eş gönderimler
    için bir geri dönüş yoludur. İlgisiz bir oturum bir ACP hedefini görebildiğinde
    ve ona mesaj gönderebildiğinde, örneğin geniş `tools.sessions.visibility`
    ayarları altında, etkin kalır.

    OpenClaw yalnızca istekte bulunan, kendi üst öğesinin sahip olduğu tek
    seferlik ACP alt öğesinin üst öğesiyse A2A takibini atlar. Bu durumda,
    görev tamamlamanın üstünde A2A çalıştırmak üst öğeyi alt öğenin sonucuyla
    uyandırabilir, üst öğenin yanıtını tekrar alt öğeye iletebilir ve bir
    üst/alt yankı döngüsü oluşturabilir. Tamamlama yolu sonuçtan zaten sorumlu
    olduğu için `sessions_send` sonucu bu sahip olunan alt öğe durumu için
    `delivery.status="skipped"` bildirir.

  </Accordion>
  <Accordion title="Mevcut bir oturumu sürdürme">
    Baştan başlamak yerine önceki bir ACP oturumuna devam etmek için
    `resumeSessionId` kullanın. Ajan, konuşma geçmişini `session/load`
    aracılığıyla yeniden oynatır; böylece önceki bağlamın tamamıyla kaldığı
    yerden devam eder.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Yaygın kullanım durumları:

    - Bir Codex oturumunu dizüstü bilgisayarınızdan telefonunuza devredin; ajanınıza kaldığınız yerden devam etmesini söyleyin.
    - CLI içinde etkileşimli olarak başlattığınız bir kodlama oturumuna şimdi ajanınız üzerinden başsız olarak devam edin.
    - Gateway yeniden başlatması veya boşta kalma zaman aşımı nedeniyle kesintiye uğrayan işi sürdürün.

    Notlar:

    - `resumeSessionId` yalnızca `runtime: "acp"` olduğunda geçerlidir; varsayılan alt ajan çalışma zamanı bu yalnızca ACP alanını yok sayar.
    - `streamTo` yalnızca `runtime: "acp"` olduğunda geçerlidir; varsayılan alt ajan çalışma zamanı bu yalnızca ACP alanını yok sayar.
    - `resumeSessionId`, OpenClaw kanal oturum anahtarı değil, ana makineye yerel bir ACP/harness sürdürme kimliğidir; ACP arka ucu veya harness bu upstream kimliği yükleme yetkilendirmesinin sahibiyken OpenClaw gönderimden önce ACP başlatma ilkesini ve hedef ajan ilkesini yine de denetler.
    - `resumeSessionId` upstream ACP konuşma geçmişini geri yükler; `thread` ve `mode`, oluşturduğunuz yeni OpenClaw oturumuna normal şekilde uygulanmaya devam eder; bu yüzden `mode: "session"` yine `thread: true` gerektirir.
    - Hedef ajan `session/load` desteklemelidir (Codex ve Claude Code destekler).
    - Oturum kimliği bulunamazsa başlatma açık bir hatayla başarısız olur; yeni bir oturuma sessiz geri dönüş yoktur.

  </Accordion>
  <Accordion title="Dağıtım sonrası smoke testi">
    Bir Gateway dağıtımından sonra, birim testlerine güvenmek yerine canlı
    uçtan uca denetim çalıştırın:

    1. Hedef ana makinede dağıtılmış Gateway sürümünü ve commit'i doğrulayın.
    2. Canlı bir agente geçici bir ACPX köprü oturumu açın.
    3. Bu agentten `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` ve `Reply with exactly LIVE-ACP-SPAWN-OK` göreviyle `sessions_spawn` çağırmasını isteyin.
    4. `accepted=yes`, gerçek bir `childSessionKey` ve doğrulayıcı hatası olmadığını doğrulayın.
    5. Geçici köprü oturumunu temizleyin.

    Kapıyı `mode: "run"` üzerinde tutun ve `streamTo: "parent"` değerini atlayın -
    iş parçacığına bağlı `mode: "session"` ve akış aktarma yolları ayrı
    daha zengin entegrasyon geçişleridir.

  </Accordion>
</AccordionGroup>

## Korumalı alan uyumluluğu

ACP oturumları şu anda OpenClaw korumalı alanının **içinde değil**,
ana makine çalışma zamanında çalışır.

<Warning>
**Güvenlik sınırı:**

- Harici koşum, kendi CLI izinlerine ve seçilen `cwd` değerine göre okuyabilir/yazabilir.
- OpenClaw'ın korumalı alan politikası ACP koşum yürütmesini **sarmalamaz**.
- OpenClaw yine de ACP özellik kapılarını, izin verilen agentleri, oturum sahipliğini, kanal bağlamalarını ve Gateway teslim politikasını uygular.
- Korumalı alanla zorunlu kılınan OpenClaw'a özgü işler için `runtime: "subagent"` kullanın.

</Warning>

Geçerli sınırlamalar:

- İstekte bulunan oturum korumalı alandaysa ACP başlatmaları hem `sessions_spawn({ runtime: "acp" })` hem de `/acp spawn` için engellenir.
- `runtime: "acp"` ile `sessions_spawn`, `sandbox: "require"` desteği sunmaz.

## Oturum hedefi çözümleme

Çoğu `/acp` eylemi isteğe bağlı bir oturum hedefi (`session-key`,
`session-id` veya `session-label`) kabul eder.

**Çözümleme sırası:**

1. Açık hedef argümanı (veya `/acp steer` için `--session`)
   - anahtarı dener
   - ardından UUID biçimli oturum kimliğini dener
   - ardından etiketi dener
2. Geçerli iş parçacığı bağlaması (bu konuşma/iş parçacığı bir ACP oturumuna bağlıysa).
3. Geçerli istek sahibi oturumu yedeği.

Geçerli konuşma bağlamaları ve iş parçacığı bağlamaları, 2. adıma birlikte
katılır.

Hiçbir hedef çözümlenmezse OpenClaw net bir hata döndürür
(`Unable to resolve session target: ...`).

## ACP denetimleri

| Komut                | Ne yapar                                                  | Örnek                                                         |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP oturumu oluşturur; isteğe bağlı geçerli bağlama veya iş parçacığı bağlaması. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Hedef oturum için devam eden turu iptal eder.             | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Çalışan oturuma yönlendirme talimatı gönderir.            | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Oturumu kapatır ve iş parçacığı hedeflerinin bağını kaldırır. | `/acp close`                                                  |
| `/acp status`        | Arka ucu, modu, durumu, çalışma zamanı seçeneklerini ve yetenekleri gösterir. | `/acp status`                                                 |
| `/acp set-mode`      | Hedef oturum için çalışma zamanı modunu ayarlar.          | `/acp set-mode plan`                                          |
| `/acp set`           | Genel çalışma zamanı yapılandırma seçeneği yazımı.        | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Çalışma zamanı çalışma dizini geçersiz kılmasını ayarlar. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Onay politikası profilini ayarlar.                        | `/acp permissions strict`                                     |
| `/acp timeout`       | Çalışma zamanı zaman aşımını ayarlar (saniye).            | `/acp timeout 120`                                            |
| `/acp model`         | Çalışma zamanı model geçersiz kılmasını ayarlar.          | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Oturum çalışma zamanı seçeneği geçersiz kılmalarını kaldırır. | `/acp reset-options`                                          |
| `/acp sessions`      | Depodan son ACP oturumlarını listeler.                    | `/acp sessions`                                               |
| `/acp doctor`        | Arka uç sağlığı, yetenekler, uygulanabilir düzeltmeler.   | `/acp doctor`                                                 |
| `/acp install`       | Belirleyici kurulum ve etkinleştirme adımlarını yazdırır. | `/acp install`                                                |

`/acp status`, etkili çalışma zamanı seçeneklerini ve çalışma zamanı düzeyi ile
arka uç düzeyi oturum tanımlayıcılarını gösterir. Bir arka uçta bir yetenek
bulunmadığında desteklenmeyen denetim hataları net biçimde görünür.
`/acp sessions`, geçerli bağlı oturum veya istek sahibi oturumu için
depoyu okur; hedef belirteçler (`session-key`, `session-id` veya
`session-label`), agente özel özel `session.store` kökleri dahil olmak üzere
gateway oturum keşfi üzerinden çözümlenir.

### Çalışma zamanı seçenekleri eşlemesi

`/acp`, kolaylık komutlarına ve genel bir ayarlayıcıya sahiptir. Eşdeğer
işlemler:

| Komut                        | Şuna eşlenir                         | Notlar                                                                                                                                                                                                     |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | çalışma zamanı yapılandırma anahtarı `model` | Codex ACP için OpenClaw, `openai-codex/<model>` değerini adaptör model kimliğine normalleştirir ve `openai-codex/gpt-5.4/high` gibi eğik çizgili akıl yürütme son eklerini `reasoning_effort` değerine eşler. |
| `/acp set thinking <level>`  | kanonik seçenek `thinking`           | OpenClaw mevcut olduğunda arka ucun duyurduğu eşdeğeri gönderir; sırasıyla `thinking`, ardından `effort`, `reasoning_effort` veya `thought_level` tercih edilir. Codex ACP için adaptör değerleri `reasoning_effort` değerine eşler. |
| `/acp permissions <profile>` | kanonik seçenek `permissionProfile`  | OpenClaw mevcut olduğunda `approval_policy`, `permission_profile`, `permissions` veya `permission_mode` gibi arka ucun duyurduğu eşdeğeri gönderir.                                                        |
| `/acp timeout <seconds>`     | kanonik seçenek `timeoutSeconds`     | OpenClaw mevcut olduğunda `timeout` veya `timeout_seconds` gibi arka ucun duyurduğu eşdeğeri gönderir.                                                                                                    |
| `/acp cwd <path>`            | çalışma zamanı cwd geçersiz kılması  | Doğrudan güncelleme.                                                                                                                                                                                        |
| `/acp set <key> <value>`     | genel                                | `key=cwd`, cwd geçersiz kılma yolunu kullanır.                                                                                                                                                             |
| `/acp reset-options`         | tüm çalışma zamanı geçersiz kılmalarını temizler | -                                                                                                                                                                                                          |

## acpx koşumu, Plugin kurulumu ve izinler

acpx koşum yapılandırması (Claude Code / Codex / Gemini CLI
takma adları), plugin-tools ve OpenClaw-tools MCP köprüleri ve ACP
izin modları için bkz.
[ACP agentleri - kurulum](/tr/tools/acp-agents-setup).

## Sorun giderme

| Belirti                                                                     | Olası neden                                                                                                           | Düzeltme                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Arka uç Plugin'i eksik, devre dışı veya `plugins.allow` tarafından engellenmiş.                                                       | Arka uç Plugin'ini kurup etkinleştirin, bu izin listesi ayarlıysa `plugins.allow` içine `acpx` ekleyin, ardından `/acp doctor` çalıştırın.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP genel olarak devre dışı.                                                                                                 | `acp.enabled=true` olarak ayarlayın.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Normal iş parçacığı iletilerinden otomatik dispatch devre dışı.                                                               | Otomatik iş parçacığı yönlendirmesini sürdürmek için `acp.dispatch.enabled=true` olarak ayarlayın; açık `sessions_spawn({ runtime: "acp" })` çağrıları çalışmaya devam eder.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Aracı izin listesinde değil.                                                                                                | İzin verilen bir `agentId` kullanın veya `acp.allowedAgents` ayarını güncelleyin.                                                                                                                     |
| `/acp doctor` reports backend not ready right after startup                 | Arka uç Plugin'i eksik, devre dışı, izin/reddetme politikası tarafından engellenmiş veya yapılandırılmış çalıştırılabilir dosyası kullanılamıyor.        | Arka uç Plugin'ini kurun/etkinleştirin, `/acp doctor` komutunu yeniden çalıştırın ve sağlıksız kalırsa arka uç kurulumunu veya politika hatasını inceleyin.                                           |
| Harness komutu bulunamadı                                                   | Bağdaştırıcı CLI'si kurulu değil, harici Plugin eksik veya ilk çalıştırma `npx` getirme işlemi Codex dışı bir bağdaştırıcı için başarısız oldu. | `/acp doctor` çalıştırın, bağdaştırıcıyı Gateway ana makinesinde kurun/önceden ısıtın veya acpx aracı komutunu açıkça yapılandırın.                                                      |
| Koşumdan model bulunamadı hatası                                            | Model kimliği başka bir sağlayıcı/koşum için geçerli, ancak bu ACP hedefi için değil.                                                | Bu koşum tarafından listelenen bir model kullanın, modeli koşumda yapılandırın veya geçersiz kılmayı atlayın.                                                                            |
| Koşumdan satıcı kimlik doğrulama hatası                                          | OpenClaw sağlıklı, ancak hedef CLI/sağlayıcıda oturum açılmamış.                                                     | Gateway ana makinesi ortamında oturum açın veya gerekli sağlayıcı anahtarını sağlayın.                                                                                             |
| `Unable to resolve session target: ...`                                     | Hatalı anahtar/kimlik/etiket belirteci.                                                                                                | `/acp sessions` çalıştırın, tam anahtarı/etiketi kopyalayın ve yeniden deneyin.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here`, etkin bağlanabilir bir konuşma olmadan kullanıldı.                                                            | Hedef sohbete/kanala geçip yeniden deneyin veya bağsız spawn kullanın.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Bağdaştırıcıda geçerli konuşma ACP bağlama yeteneği yok.                                                             | Desteklenen yerde `/acp spawn ... --thread ...` kullanın, üst düzey `bindings[]` yapılandırın veya desteklenen bir kanala geçin.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here`, iş parçacığı bağlamı dışında kullanıldı.                                                                         | Hedef iş parçacığına geçin veya `--thread auto`/`off` kullanın.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Etkin bağlama hedefinin sahibi başka bir kullanıcı.                                                                           | Sahip olarak yeniden bağlayın veya farklı bir konuşma ya da iş parçacığı kullanın.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | Bağdaştırıcıda iş parçacığı bağlama yeteneği yok.                                                                               | `--thread off` kullanın veya desteklenen bağdaştırıcıya/kanala geçin.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP çalışma zamanı ana makine tarafındadır; istekte bulunan oturum korumalı alandadır.                                                              | Korumalı alan oturumlarından `runtime="subagent"` kullanın veya ACP spawn işlemini korumalı alanda olmayan bir oturumdan çalıştırın.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP çalışma zamanı için `sandbox="require"` istendi.                                                                         | Zorunlu korumalı alan için `runtime="subagent"` kullanın veya korumalı alanda olmayan bir oturumdan `sandbox="inherit"` ile ACP kullanın.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | Hedef koşum genel ACP model değiştirmeyi sunmuyor.                                                        | ACP `models`/`session/set_model` sunduğunu belirten bir koşum kullanın, Codex ACP model başvurularını kullanın veya kendi başlangıç bayrağı varsa modeli doğrudan koşumda yapılandırın. |
| Bağlı oturum için ACP metadata eksik                                      | Eski/silinmiş ACP oturum metadata'sı.                                                                                    | `/acp spawn` ile yeniden oluşturun, ardından iş parçacığını yeniden bağlayın/odaklayın.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode`, etkileşimsiz ACP oturumunda yazma/çalıştırma işlemlerini engelliyor.                                                    | `plugins.entries.acpx.config.permissionMode` değerini `approve-all` olarak ayarlayın ve gateway'i yeniden başlatın. Bkz. [İzin yapılandırması](/tr/tools/acp-agents-setup#permission-configuration). |
| ACP oturumu az çıktıyla erken başarısız oluyor                                  | İzin istemleri `permissionMode`/`nonInteractivePermissions` tarafından engelleniyor.                                        | Gateway günlüklerinde `AcpRuntimeError` olup olmadığını kontrol edin. Tam izinler için `permissionMode=approve-all` ayarlayın; zarif bozulma için `nonInteractivePermissions=deny` ayarlayın.        |
| ACP oturumu işi tamamladıktan sonra süresiz olarak takılıyor                       | Koşum süreci tamamlandı, ancak ACP oturumu tamamlanmayı bildirmedi.                                                    | OpenClaw'ı güncelleyin; mevcut acpx temizliği, kapanışta ve Gateway başlangıcında OpenClaw'a ait eski sarmalayıcı ve bağdaştırıcı süreçlerini toplar.                                             |
| Koşum `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` görüyor                        | Dahili olay zarfı ACP sınırından sızdı.                                                                | OpenClaw'ı güncelleyin ve tamamlama akışını yeniden çalıştırın; harici koşumlar yalnızca düz tamamlama istemleri almalıdır.                                                          |

## İlgili

- [ACP aracıları - kurulum](/tr/tools/acp-agents-setup)
- [Aracı gönderme](/tr/tools/agent-send)
- [CLI Arka Uçları](/tr/gateway/cli-backends)
- [Codex koşumu](/tr/plugins/codex-harness)
- [Codex koşumu çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Çok aracılı korumalı alan araçları](/tr/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (köprü modu)](/tr/cli/acp)
- [Alt aracılar](/tr/tools/subagents)
