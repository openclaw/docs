---
read_when:
    - Kodlama harness'larını ACP üzerinden çalıştırma
    - Mesajlaşma kanallarında konuşmaya bağlı ACP oturumlarını ayarlama
    - Mesaj kanalı konuşmasını kalıcı bir ACP oturumuna bağlama
    - ACP arka ucu, plugin bağlantısı veya tamamlama tesliminde sorun giderme
    - Sohbetten /acp komutlarını çalıştırma
sidebarTitle: ACP agents
summary: Harici kodlama harness’larını (Claude Code, Cursor, Gemini CLI, açık Codex ACP, OpenClaw ACP, OpenCode) ACP backend’i üzerinden çalıştırın
title: ACP aracıları
x-i18n:
    generated_at: "2026-06-30T14:24:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61edbc3b5a8303dc88e27a1315fe996da70eeee7aa211877d5680eb150e36cb
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) oturumları,
OpenClaw'ın harici kodlama harness'larını (örneğin Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI ve diğer
desteklenen ACPX harness'ları) bir ACP backend plugin'i üzerinden
çalıştırmasını sağlar.

Her ACP oturum başlatması bir [arka plan görevi](/tr/automation/tasks) olarak izlenir.

<Note>
**ACP, varsayılan Codex yolu değil, harici harness yoludur.** Yerel
Codex app-server plugin'i `/codex ...` denetimlerinin ve agent dönüşleri için varsayılan
`openai/gpt-*` gömülü runtime'ın sahibidir; ACP ise
`/acp ...` denetimlerinin ve `sessions_spawn({ runtime: "acp" })` oturumlarının sahibidir.

Codex veya Claude Code'un mevcut OpenClaw kanal konuşmalarına harici bir MCP istemcisi olarak
doğrudan bağlanmasını istiyorsanız ACP yerine
[`openclaw mcp serve`](/tr/cli/mcp) kullanın.
</Note>

## Hangi sayfayı istiyorum?

| İstediğiniz…                                                                                   | Bunu kullanın                         | Notlar                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Geçerli konuşmada Codex'i bağlamak veya denetlemek                                              | `/codex bind`, `/codex threads`       | `codex` plugin'i etkinleştirildiğinde yerel Codex app-server yolu; bağlı sohbet yanıtlarını, görüntü iletmeyi, model/hızlı/izinler, durdurma ve yönlendirme denetimlerini içerir. ACP açık bir yedektir |
| Claude Code, Gemini CLI, açık Codex ACP veya başka bir harici harness'ı OpenClaw _üzerinden_ çalıştırmak | Bu sayfa                              | Sohbete bağlı oturumlar, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, arka plan görevleri, runtime denetimleri                                                                          |
| Bir OpenClaw Gateway oturumunu bir düzenleyici veya istemci için ACP sunucusu _olarak_ açmak    | [`openclaw acp`](/tr/cli/acp)            | Köprü modu. IDE/istemci, stdio/WebSocket üzerinden OpenClaw'a ACP ile konuşur                                                                                                                  |
| Yerel bir AI CLI'ını yalnızca metin yedek modeli olarak yeniden kullanmak                       | [CLI Backend'leri](/tr/gateway/cli-backends) | ACP değildir. OpenClaw araçları yok, ACP denetimleri yok, harness runtime yok                                                                                                                  |

## Bu kutudan çıktığı gibi çalışır mı?

Evet, resmi ACP runtime plugin'i yüklendikten sonra:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Kaynak checkout'ları `pnpm install` sonrasında yerel `extensions/acpx` workspace plugin'ini
kullanabilir. Hazırlık denetimi için `/acp doctor` çalıştırın.

OpenClaw, agent'lara ACP başlatmayı yalnızca ACP **gerçekten
kullanılabilir** olduğunda öğretir: ACP etkin olmalı, dispatch devre dışı
olmamalı, geçerli oturum sandbox tarafından engellenmemeli ve bir runtime backend'i
yüklenmiş olmalıdır. Bu koşullar karşılanmıyorsa ACP plugin Skills'i ve
`sessions_spawn` ACP kılavuzu gizli kalır; böylece agent kullanılamayan
bir backend önermemiş olur.

<AccordionGroup>
  <Accordion title="İlk çalıştırma notları">
    - `plugins.allow` ayarlanmışsa, bu kısıtlayıcı bir plugin envanteridir ve **mutlaka** `acpx` içermelidir; aksi halde yüklü ACP backend'i bilerek engellenir ve `/acp doctor` eksik allowlist girdisini bildirir.
    - Codex ACP adapter'ı `acpx` plugin'iyle hazırlanır ve mümkün olduğunda yerelde başlatılır.
    - Codex ACP yalıtılmış bir `CODEX_HOME` ile çalışır; OpenClaw, host Codex config'inden güvenilir proje girdilerini ve güvenli model/provider yönlendirme config'ini kopyalar; auth, bildirimler ve hook'lar host config'inde kalır.
    - Diğer hedef harness adapter'ları, onları ilk kez kullandığınızda yine `npx` ile isteğe bağlı olarak getirilebilir.
    - Tedarikçi auth bilgisi bu harness için host üzerinde yine mevcut olmalıdır.
    - Host'ta npm veya ağ erişimi yoksa, önbellekler önceden ısıtılana veya adapter başka bir yolla yüklenene kadar ilk çalıştırma adapter getirmeleri başarısız olur.

  </Accordion>
  <Accordion title="Runtime önkoşulları">
    ACP gerçek bir harici harness işlemi başlatır. OpenClaw yönlendirme,
    arka plan görevi durumu, teslimat, bağlamalar ve politikanın sahibidir; harness
    kendi provider oturum açma bilgileri, model kataloğu, dosya sistemi davranışı ve
    yerel araçlarının sahibidir.

    OpenClaw'ı suçlamadan önce şunları doğrulayın:

    - `/acp doctor` etkin ve sağlıklı bir backend bildiriyor.
    - Bu allowlist ayarlandığında hedef id'ye `acp.allowedAgents` tarafından izin veriliyor.
    - Harness komutu Gateway host'unda başlayabiliyor.
    - Bu harness için provider auth mevcut (`claude`, `codex`, `gemini`, `opencode`, `droid` vb.).
    - Seçilen model bu harness için mevcut - model id'leri harness'lar arasında taşınabilir değildir.
    - İstenen `cwd` mevcut ve erişilebilir, ya da `cwd` kullanmayıp backend'in varsayılanını kullanmasına izin verin.
    - İzin modu işle eşleşiyor. Etkileşimsiz oturumlar yerel izin istemlerine tıklayamaz; bu yüzden yazma/çalıştırma ağırlıklı kodlama çalıştırmaları genellikle başsız ilerleyebilen bir ACPX izin profiline ihtiyaç duyar.

  </Accordion>
</AccordionGroup>

OpenClaw plugin araçları ve yerleşik OpenClaw araçları varsayılan olarak
ACP harness'larına açılmaz. Yalnızca harness'ın bu araçları doğrudan
çağırması gerektiğinde [ACP agent'ları - kurulum](/tr/tools/acp-agents-setup) içindeki
açık MCP köprülerini etkinleştirin.

## Desteklenen harness hedefleri

`acpx` backend'iyle, `/acp spawn <id>` olarak veya
`sessions_spawn({ runtime: "acp", agentId: "<id>" })` hedefleri olarak şu harness id'lerini kullanın:

| Harness id | Tipik backend                                | Notlar                                                                              |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP adapter'ı                     | Host üzerinde Claude Code auth gerektirir.                                          |
| `codex`    | Codex ACP adapter'ı                           | Yalnızca yerel `/codex` kullanılamadığında veya ACP istendiğinde açık ACP yedeği.   |
| `copilot`  | GitHub Copilot ACP adapter'ı                  | Copilot CLI/runtime auth gerektirir.                                                |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)           | Yerel kurulum farklı bir ACP giriş noktası sunuyorsa acpx komutunu geçersiz kılın. |
| `droid`    | Factory Droid CLI                             | Harness ortamında Factory/Droid auth veya `FACTORY_API_KEY` gerektirir.             |
| `gemini`   | Gemini CLI ACP adapter'ı                      | Gemini CLI auth veya API anahtarı kurulumu gerektirir.                              |
| `iflow`    | iFlow CLI                                     | Adapter kullanılabilirliği ve model denetimi yüklü CLI'a bağlıdır.                  |
| `kilocode` | Kilo Code CLI                                 | Adapter kullanılabilirliği ve model denetimi yüklü CLI'a bağlıdır.                  |
| `kimi`     | Kimi/Moonshot CLI                             | Host üzerinde Kimi/Moonshot auth gerektirir.                                        |
| `kiro`     | Kiro CLI                                      | Adapter kullanılabilirliği ve model denetimi yüklü CLI'a bağlıdır.                  |
| `opencode` | OpenCode ACP adapter'ı                        | OpenCode CLI/provider auth gerektirir.                                              |
| `openclaw` | `openclaw acp` üzerinden OpenClaw Gateway köprüsü | ACP farkındalığı olan bir harness'ın bir OpenClaw Gateway oturumuna geri konuşmasını sağlar. |
| `qwen`     | Qwen Code / Qwen CLI                          | Host üzerinde Qwen uyumlu auth gerektirir.                                          |

Özel acpx agent alias'ları acpx içinde yapılandırılabilir, ancak OpenClaw
politikası dispatch öncesinde yine `acp.allowedAgents` ve varsa
`agents.list[].runtime.acp.agent` eşlemesini denetler.

## Operatör çalışma kılavuzu

Sohbetten hızlı `/acp` akışı:

<Steps>
  <Step title="Başlat">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` veya açık
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Çalış">
    Bağlı konuşmada veya thread'de devam edin (ya da oturum
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
    `/acp cancel` (geçerli dönüş) veya `/acp close` (oturum + bağlamalar).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Yaşam döngüsü ayrıntıları">
    - Başlatma, bir ACP runtime oturumu oluşturur veya sürdürür, ACP metadata'sını OpenClaw oturum deposuna kaydeder ve çalıştırma parent-owned olduğunda bir arka plan görevi oluşturabilir.
    - Parent-owned ACP oturumları, runtime oturumu persistent olsa bile arka plan işi olarak ele alınır; tamamlama ve yüzeyler arası teslimat, normal kullanıcıya dönük sohbet oturumu gibi davranmak yerine üst görev bildiricisinden geçer.
    - Görev bakımı terminal veya sahipsiz parent-owned tek seferlik ACP oturumlarını kapatır. Persistent ACP oturumları, etkin bir konuşma bağlaması kaldığı sürece korunur; etkin bağlaması olmayan bayat persistent oturumlar kapatılır, böylece sahip görev tamamlandıktan veya görev kaydı gittikten sonra sessizce sürdürülemezler.
    - Bağlı takip mesajları, bağlama kapatılana, odaktan çıkarılana, sıfırlanana veya süresi dolana kadar doğrudan ACP oturumuna gider.
    - Gateway komutları yerel kalır. `/acp ...`, `/status` ve `/unfocus` hiçbir zaman bağlı bir ACP harness'ına normal prompt metni olarak gönderilmez.
    - `cancel`, backend iptali desteklediğinde etkin dönüşü iptal eder; bağlamayı veya oturum metadata'sını silmez.
    - `close`, OpenClaw açısından ACP oturumunu sonlandırır ve bağlamayı kaldırır. Harness, sürdürmeyi destekliyorsa kendi upstream geçmişini yine tutabilir.
    - acpx plugin'i `close` sonrasında OpenClaw'a ait wrapper ve adapter işlem ağaçlarını temizler ve Gateway başlangıcı sırasında bayat OpenClaw'a ait ACPX yetimlerini toplar.
    - Boşta runtime worker'ları `acp.runtime.ttlMinutes` sonrasında temizlenmeye uygundur; depolanan oturum metadata'sı `/acp sessions` için kullanılabilir kalır.

  </Accordion>
  <Accordion title="Yerel Codex yönlendirme kuralları">
    Etkin olduğunda **yerel Codex
    plugin'ine** yönlendirilmesi gereken doğal dil tetikleyicileri:

    - "Bu Discord kanalını Codex'e bağla."
    - "Bu sohbeti Codex thread'i `<id>`'ye ekle."
    - "Codex thread'lerini göster, sonra bunu bağla."

    Yerel Codex konuşma bağlama, varsayılan sohbet denetimi yoludur.
    OpenClaw dinamik araçları yine OpenClaw üzerinden yürütülürken,
    shell/apply-patch gibi Codex yerel araçları Codex içinde yürütülür.
    Codex yerel araç olayları için OpenClaw, Plugin hook'larının
    `before_tool_call`'ı engelleyebilmesi, `after_tool_call`'ı gözlemleyebilmesi
    ve Codex `PermissionRequest` olaylarını OpenClaw onayları üzerinden
    yönlendirebilmesi için her dönüşe özgü yerel bir hook aktarıcısı enjekte eder.
    Codex `Stop` hook'ları OpenClaw `before_agent_finalize`'a aktarılır; burada
    Plugin'ler Codex yanıtını sonlandırmadan önce bir model geçişi daha isteyebilir.
    Aktarıcı bilinçli olarak muhafazakar kalır: Codex yerel araç argümanlarını
    değiştirmez veya Codex iş parçacığı kayıtlarını yeniden yazmaz. Açık ACP'yi
    yalnızca ACP çalışma zamanı/oturum modelini istediğinizde kullanın. Gömülü Codex
    destek sınırı
    [Codex harness v1 destek sözleşmesinde](/tr/plugins/codex-harness-runtime#v1-support-contract)
    belgelenmiştir.

  </Accordion>
  <Accordion title="Model / sağlayıcı / çalışma zamanı seçim kılavuzu">
    - eski Codex model ref'leri - doctor tarafından onarılan eski Codex OAuth/abonelik model rotası.
    - `openai/*` - OpenAI aracı dönüşleri için yerel Codex app-server gömülü çalışma zamanı.
    - `/codex ...` - yerel Codex konuşma denetimi.
    - `/acp ...` veya `runtime: "acp"` - açık ACP/acpx denetimi.

  </Accordion>
  <Accordion title="ACP yönlendirmeli doğal dil tetikleyicileri">
    ACP çalışma zamanına yönlendirilmesi gereken tetikleyiciler:

    - "Bunu tek seferlik bir Claude Code ACP oturumu olarak çalıştır ve sonucu özetle."
    - "Bu görev için Gemini CLI'yi bir iş parçacığında kullan, ardından takipleri aynı iş parçacığında tut."
    - "Codex'i arka plan iş parçacığında ACP üzerinden çalıştır."

    OpenClaw `runtime: "acp"` seçer, harness `agentId` değerini çözer,
    desteklendiğinde geçerli konuşmaya veya iş parçacığına bağlanır ve
    kapanana/süresi dolana kadar takipleri o oturuma yönlendirir. Codex bu yolu
    yalnızca ACP/acpx açık olduğunda veya istenen işlem için yerel Codex
    Plugin'i kullanılamadığında izler.

    `sessions_spawn` için `runtime: "acp"` yalnızca ACP etkinse, istekte bulunan
    sandbox içinde değilse ve bir ACP çalışma zamanı backend'i yüklenmişse duyurulur.
    `acp.dispatch.enabled=false`, otomatik ACP iş parçacığı dağıtımını duraklatır
    ancak açık `sessions_spawn({ runtime: "acp" })` çağrılarını gizlemez veya engellemez.
    `codex`, `claude`, `droid`, `gemini` veya `opencode` gibi ACP harness kimliklerini hedefler.
    Bu giriş açıkça `agents.list[].runtime.type="acp"` ile yapılandırılmadığı sürece
    `agents_list` içinden normal bir OpenClaw yapılandırma aracı kimliği geçirmeyin;
    bunun yerine varsayılan alt aracı çalışma zamanını kullanın. Bir OpenClaw aracı
    `runtime.type="acp"` ile yapılandırıldığında OpenClaw, alttaki harness kimliği
    olarak `runtime.acp.agent` değerini kullanır.

  </Accordion>
</AccordionGroup>

## ACP ve alt araçlar

Harici bir harness çalışma zamanı istediğinizde ACP kullanın. `codex`
Plugin'i etkin olduğunda Codex konuşma bağlama/denetimi için **yerel Codex
app-server** kullanın. OpenClaw yerel yetkilendirilmiş çalıştırmalar istediğinizde
**alt araçları** kullanın.

| Alan          | ACP oturumu                           | Alt araç çalıştırması              |
| ------------- | ------------------------------------- | ---------------------------------- |
| Çalışma zamanı | ACP backend Plugin'i (örneğin acpx) | OpenClaw yerel alt araç çalışma zamanı |
| Oturum anahtarı | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`  |
| Ana komutlar  | `/acp ...`                            | `/subagents ...`                   |
| Spawn aracı   | `runtime:"acp"` ile `sessions_spawn`  | `sessions_spawn` (varsayılan çalışma zamanı) |

Ayrıca bkz. [Alt araçlar](/tr/tools/subagents).

## ACP Claude Code'u nasıl çalıştırır

ACP üzerinden Claude Code için yığın şöyledir:

1. OpenClaw ACP oturum denetim düzlemi.
2. Resmi `@openclaw/acpx` çalışma zamanı Plugin'i.
3. Claude ACP bağdaştırıcısı.
4. Claude tarafındaki çalışma zamanı/oturum mekanizması.

ACP Claude, ACP denetimleri, oturum sürdürme, arka plan görev izleme ve
isteğe bağlı konuşma/iş parçacığı bağlama içeren bir **harness oturumudur**.

CLI backend'leri ayrı, yalnızca metin tabanlı yerel yedek çalışma zamanlarıdır -
bkz. [CLI Backend'leri](/tr/gateway/cli-backends).

Operatörler için pratik kural şudur:

- **`/acp spawn`, bağlanabilir oturumlar, çalışma zamanı denetimleri veya kalıcı harness çalışması mı istiyorsunuz?** ACP kullanın.
- **Ham CLI üzerinden basit yerel metin yedeği mi istiyorsunuz?** CLI backend'lerini kullanın.

## Bağlı oturumlar

### Zihinsel model

- **Sohbet yüzeyi** - insanların konuşmaya devam ettiği yer (Discord kanalı, Telegram konusu, iMessage sohbeti).
- **ACP oturumu** - OpenClaw'ın yönlendirdiği kalıcı Codex/Claude/Gemini çalışma zamanı durumu.
- **Alt iş parçacığı/konu** - yalnızca `--thread ...` tarafından oluşturulan isteğe bağlı ek mesajlaşma yüzeyi.
- **Çalışma zamanı çalışma alanı** - harness'in çalıştığı dosya sistemi konumu (`cwd`, repo checkout, backend çalışma alanı). Sohbet yüzeyinden bağımsızdır.

### Geçerli konuşma bağları

`/acp spawn <harness> --bind here`, geçerli konuşmayı oluşturulan ACP oturumuna
sabitler - alt iş parçacığı yoktur, aynı sohbet yüzeyi kullanılır. OpenClaw
taşıma, kimlik doğrulama, güvenlik ve teslimi yönetmeye devam eder. Bu konuşmadaki
takip mesajları aynı oturuma yönlendirilir; `/new` ve `/reset` oturumu yerinde
sıfırlar; `/acp close` bağlamayı kaldırır.

Örnekler:

```text
/codex bind                                              # native Codex bind, route future messages here
/codex model gpt-5.4                                     # tune the bound native Codex thread
/codex stop                                              # control the active native Codex turn
/acp spawn codex --bind here                             # explicit ACP fallback for Codex
/acp spawn codex --thread auto                           # may create a child thread/topic and bind there
/acp spawn codex --bind here --cwd /workspace/repo       # same chat binding, Codex runs in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Bağlama kuralları ve dışlayıcılık">
    - `--bind here` ve `--thread ...` birbirini dışlar.
    - `--bind here` yalnızca geçerli konuşma bağlamayı duyuran kanallarda çalışır; aksi halde OpenClaw açık bir desteklenmiyor mesajı döndürür. Bağlamalar Gateway yeniden başlatmaları boyunca kalıcıdır.
    - Discord'da `spawnSessions`, `--thread auto|here` için alt iş parçacığı oluşturmayı sınırlar - `--bind here` için değil.
    - `--cwd` olmadan farklı bir ACP aracına spawn yaparsanız OpenClaw varsayılan olarak **hedef aracın** çalışma alanını devralır. Eksik devralınan yollar (`ENOENT`/`ENOTDIR`) backend varsayılanına geri döner; diğer erişim hataları (örn. `EACCES`) spawn hataları olarak görünür.
    - Gateway yönetim komutları bağlı konuşmalarda yerel kalır - normal takip metni bağlı ACP oturumuna yönlendirilse bile `/acp ...` komutları OpenClaw tarafından işlenir; komut işleme o yüzey için etkin olduğunda `/status` ve `/unfocus` da yerel kalır.

  </Accordion>
  <Accordion title="İş parçacığına bağlı oturumlar">
    Bir kanal bağdaştırıcısı için iş parçacığı bağlamaları etkinleştirildiğinde:

    - OpenClaw bir iş parçacığını hedef ACP oturumuna bağlar.
    - Bu iş parçacığındaki takip mesajları bağlı ACP oturumuna yönlendirilir.
    - ACP çıktısı aynı iş parçacığına geri teslim edilir.
    - Unfocus/close/archive/idle-timeout veya max-age süresinin dolması bağlamayı kaldırır.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` ve `/unfocus` Gateway komutlarıdır; ACP harness'ine gönderilen prompt'lar değildir.

    İş parçacığına bağlı ACP için gereken özellik bayrakları:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` varsayılan olarak açıktır (otomatik ACP iş parçacığı dağıtımını duraklatmak için `false` ayarlayın; açık `sessions_spawn({ runtime: "acp" })` çağrıları çalışmaya devam eder).
    - Kanal bağdaştırıcısı iş parçacığı oturum spawn'ları etkin (varsayılan: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    İş parçacığı bağlama desteği bağdaştırıcıya özeldir. Etkin kanal
    bağdaştırıcısı iş parçacığı bağlamalarını desteklemiyorsa OpenClaw açık bir
    desteklenmiyor/kullanılamıyor mesajı döndürür.

  </Accordion>
  <Accordion title="İş parçacığı destekleyen kanallar">
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
  Hedef konuşmayı tanımlar. Kanal başına şekiller:

- **Discord kanalı/iş parçacığı:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack kanalı/DM:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Kararlı Slack kimliklerini tercih edin; kanal bağlamaları o kanalın iş parçacıkları içindeki yanıtlarla da eşleşir.
- **Telegram forum konusu:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp DM/grup:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Doğrudan sohbetler için `+15555550123` gibi E.164 numaralarını ve gruplar için `120363424282127706@g.us` gibi WhatsApp grup JID'lerini kullanın.
- **iMessage DM/grup:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Kararlı grup bağlamaları için `chat_id:*` tercih edin.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Sahip OpenClaw aracı kimliği.
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
  İsteğe bağlı backend geçersiz kılması.
</ParamField>

### Araç başına çalışma zamanı varsayılanları

ACP varsayılanlarını araç başına bir kez tanımlamak için `agents.list[].runtime` kullanın:

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

- OpenClaw, yapılandırılmış ACP oturumunun kanala özgü kabulden sonra ve kullanımdan önce mevcut olmasını sağlar.
- Bu kanaldaki, konudaki veya sohbetteki iletiler yapılandırılmış ACP oturumuna yönlendirilir.
- Yapılandırılmış ACP bağlamaları kendi oturum rotasına sahiptir. Kanal yayınına dağıtım, eşleşen bir bağlama için yapılandırılmış ACP oturumunun yerini almaz.
- Bağlı konuşmalarda `/new` ve `/reset`, aynı ACP oturum anahtarını yerinde sıfırlar.
- Geçici çalışma zamanı bağlamaları (örneğin ileti dizisi odağı akışları tarafından oluşturulanlar) mevcut oldukları yerlerde uygulanmaya devam eder.
- Açık bir `cwd` olmadan aracılar arası ACP başlatmalarında OpenClaw, hedef aracı çalışma alanını aracı yapılandırmasından devralır.
- Eksik devralınan çalışma alanı yolları arka ucun varsayılan cwd değerine geri döner; eksik olmayan erişim hataları başlatma hataları olarak gösterilir.

## ACP oturumlarını başlatma

Bir ACP oturumu başlatmanın iki yolu vardır:

<Tabs>
  <Tab title="sessions_spawn üzerinden">
    Bir aracı dönüşünden veya araç çağrısından ACP oturumu başlatmak için `runtime: "acp"` kullanın.

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
    `runtime` varsayılan olarak `subagent` olur; bu nedenle ACP oturumları için `runtime: "acp"` değerini açıkça ayarlayın. `agentId` atlanırsa OpenClaw, yapılandırıldığında `acp.defaultAgent` değerini kullanır. `mode: "session"`, kalıcı bağlı konuşmayı korumak için `thread: true` gerektirir.
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
  ACP hedef koşum id'si. Ayarlanmışsa `acp.defaultAgent` değerine geri döner.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Desteklendiği yerlerde ileti dizisi bağlama akışı ister.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` tek seferliktir; `"session"` kalıcıdır. `thread: true` ise ve `mode` atlanırsa OpenClaw, çalışma zamanı yoluna göre varsayılan olarak kalıcı davranışı kullanabilir. `mode: "session"` için `thread: true` gerekir.
</ParamField>
<ParamField path="cwd" type="string">
  İstenen çalışma zamanı çalışma dizini (arka uç/çalışma zamanı ilkesi tarafından doğrulanır). Atlanırsa ACP başlatma, yapılandırıldığında hedef aracı çalışma alanını devralır; eksik devralınan yollar arka uç varsayılanlarına geri dönerken gerçek erişim hataları döndürülür.
</ParamField>
<ParamField path="label" type="string">
  Oturum/afiş metninde kullanılan operatöre dönük etiket.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Yeni bir tane oluşturmak yerine mevcut bir ACP oturumunu sürdürür. Aracı, konuşma geçmişini `session/load` üzerinden yeniden oynatır. `runtime: "acp"` gerektirir.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"`, ilk ACP çalıştırma ilerleme özetlerini sistem olayları olarak istekte bulunan oturuma geri akıtır. Kabul edilen yanıtlar, tam aktarma geçmişi için izleyebileceğiniz oturum kapsamlı bir JSONL günlüğüne (`<sessionId>.acp-stream.jsonl`) işaret eden `streamLogPath` içerir. Üst ilerleme akışları, `streaming.progress.commentary=false` olmadığı sürece varsayılan olarak asistan yorumlarını ve ACP durum ilerlemesini gösterir. Hiçbir akış modu yapılandırılmadığında Discord da varsayılan olarak üst önizlemeleri ilerleme moduna alır. Durum ilerlemesi yine de `acp.stream.tagVisibility` değerine uyar; bu nedenle `plan` gibi etiketler açıkça etkinleştirilmedikçe gizli kalır.
</ParamField>

ACP `sessions_spawn` çalıştırmaları, varsayılan alt dönüş sınırları için `agents.defaults.subagents.runTimeoutSeconds` kullanır. Araç, çağrı başına zaman aşımı geçersiz kılmalarını kabul etmez.

<ParamField path="model" type="string">
  ACP alt oturumu için açık model geçersiz kılması. Codex ACP başlatmaları, `session/new` öncesinde `openai/gpt-5.4` gibi OpenAI referanslarını Codex ACP başlangıç yapılandırmasına normalize eder; `openai/gpt-5.4/high` gibi eğik çizgili biçimler de Codex ACP akıl yürütme çabasını ayarlar.
  Atlandığında `sessions_spawn({ runtime: "acp" })`, yapılandırılmışsa mevcut alt aracı model varsayılanlarını (`agents.defaults.subagents.model` veya `agents.list[].subagents.model`) kullanır; aksi takdirde ACP koşumunun kendi varsayılan modelini kullanmasına izin verir.
  Diğer koşumlar ACP `models` değerlerini duyurmalı ve `session/set_model` desteği sağlamalıdır; aksi halde OpenClaw/acpx hedef aracı varsayılanına sessizce geri dönmek yerine açıkça başarısız olur.
</ParamField>
<ParamField path="thinking" type="string">
  Açık düşünme/akıl yürütme çabası. Codex ACP için `minimal` düşük çabaya eşlenir, `low`/`medium`/`high`/`xhigh` doğrudan eşlenir ve `off` akıl yürütme çabası başlangıç geçersiz kılmasını atlar.
  Atlandığında ACP başlatmaları, seçilen model için mevcut alt aracı düşünme varsayılanlarını ve model başına `agents.defaults.models["provider/model"].params.thinking` değerini kullanır.
</ParamField>

## Başlatma bağlama ve ileti dizisi modları

<Tabs>
  <Tab title="--bind here|off">
    | Mod    | Davranış                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Geçerli etkin konuşmayı yerinde bağlar; etkin konuşma yoksa başarısız olur. |
    | `off`  | Geçerli konuşma bağlaması oluşturmaz.                                  |

    Notlar:

    - `--bind here`, "bu kanalı veya sohbeti Codex destekli yap" için en basit operatör yoludur.
    - `--bind here` alt ileti dizisi oluşturmaz.
    - `--bind here` yalnızca geçerli konuşma bağlama desteği sunan kanallarda kullanılabilir.
    - `--bind` ve `--thread` aynı `/acp spawn` çağrısında birleştirilemez.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mod    | Davranış                                                                                           |
    | ------ | -------------------------------------------------------------------------------------------------- |
    | `auto` | Etkin bir ileti dizisindeyken: o ileti dizisini bağlar. İleti dizisi dışındayken: destekleniyorsa bir alt ileti dizisi oluşturur/bağlar. |
    | `here` | Geçerli etkin ileti dizisini gerektirir; içinde değilse başarısız olur.                            |
    | `off`  | Bağlama yoktur. Oturum bağlanmamış başlar.                                                         |

    Notlar:

    - İleti dizisi bağlamayan yüzeylerde varsayılan davranış fiilen `off` olur.
    - İleti dizisine bağlı başlatma kanal ilkesi desteği gerektirir:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Alt ileti dizisi oluşturmadan geçerli konuşmayı sabitlemek istediğinizde `--bind here` kullanın.

  </Tab>
</Tabs>

## Teslim modeli

ACP oturumları etkileşimli çalışma alanları veya üst oturuma ait arka plan işleri olabilir. Teslim yolu bu şekle bağlıdır.

<AccordionGroup>
  <Accordion title="Etkileşimli ACP oturumları">
    Etkileşimli oturumlar, görünür bir sohbet yüzeyinde konuşmayı sürdürmek için tasarlanmıştır:

    - `/acp spawn ... --bind here`, geçerli konuşmayı ACP oturumuna bağlar.
    - `/acp spawn ... --thread ...`, bir kanal ileti dizisini/konusunu ACP oturumuna bağlar.
    - Kalıcı yapılandırılmış `bindings[].type="acp"`, eşleşen konuşmaları aynı ACP oturumuna yönlendirir.

    Bağlı konuşmadaki takip iletileri doğrudan ACP oturumuna yönlendirilir ve ACP çıktısı aynı kanala/ileti dizisine/konuya geri teslim edilir.

    OpenClaw'un koşuma gönderdikleri:

    - Normal bağlı takipler, koşum/arka uç desteklediğinde yalnızca eklerle birlikte istem metni olarak gönderilir.
    - `/acp` yönetim komutları ve yerel Gateway komutları ACP gönderiminden önce yakalanır.
    - Çalışma zamanı tarafından oluşturulan tamamlama olayları hedef başına somutlaştırılır. OpenClaw aracıları OpenClaw'un dahili çalışma zamanı bağlam zarfını alır; harici ACP koşumları alt sonuç ve yönerge içeren düz bir istem alır. Ham `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` zarfı hiçbir zaman harici koşumlara gönderilmemeli veya ACP kullanıcı transkripti metni olarak kalıcılaştırılmamalıdır.
    - ACP transkript girdileri kullanıcıya görünen tetikleyici metni veya düz tamamlama istemini kullanır. Dahili olay meta verileri mümkün olduğunda OpenClaw içinde yapılandırılmış kalır ve kullanıcı tarafından yazılmış sohbet içeriği olarak değerlendirilmez.

  </Accordion>
  <Accordion title="Üst oturuma ait tek seferlik ACP oturumları">
    Başka bir aracı çalıştırması tarafından başlatılan tek seferlik ACP oturumları, alt aracılara benzer arka plan çocuklarıdır:

    - Üst oturum, `sessions_spawn({ runtime: "acp", mode: "run" })` ile iş ister.
    - Alt oturum kendi ACP koşum oturumunda çalışır.
    - Alt dönüşler, yerel alt aracı başlatmalarıyla kullanılan aynı arka plan hattında çalışır; böylece yavaş bir ACP koşumu ilgisiz ana oturum işini engellemez.
    - Tamamlama, görev tamamlama duyuru yolu üzerinden geri bildirilir. OpenClaw, harici bir koşuma göndermeden önce dahili tamamlama meta verilerini düz bir ACP istemine dönüştürür; böylece koşumlar yalnızca OpenClaw'a ait çalışma zamanı bağlam işaretlerini görmez.
    - Kullanıcıya dönük bir yanıt yararlı olduğunda üst oturum, alt sonucu normal asistan sesiyle yeniden yazar.

    Bu yolu üst oturum ile alt oturum arasında eşler arası sohbet olarak **değerlendirmeyin**. Alt oturumun zaten üst oturuma geri giden bir tamamlama kanalı vardır.

  </Accordion>
  <Accordion title="sessions_send ve A2A teslimi">
    `sessions_send`, başlatmadan sonra başka bir oturumu hedefleyebilir. Normal eş oturumlar için OpenClaw, iletiyi enjekte ettikten sonra aracıdan aracıya (A2A) takip yolu kullanır:

    - Hedef oturumun yanıtını bekler.
    - İsteğe bağlı olarak, istekte bulunan ile hedefin sınırlı sayıda takip dönüşü alışverişi yapmasına izin verir.
    - Hedeften bir duyuru iletisi üretmesini ister.
    - Bu duyuruyu görünür kanala veya ileti dizisine teslim eder.

    Bu A2A yolu, gönderenin görünür bir takibe ihtiyaç duyduğu eş göndermeleri için bir geri dönüş yoludur. Örneğin geniş `tools.sessions.visibility` ayarları altında ilgisiz bir oturumun ACP hedefini görebildiği ve ona ileti gönderebildiği durumlarda etkin kalır.

    OpenClaw, A2A takibini yalnızca istekte bulunan, kendi üst öğesine ait tek seferlik ACP alt öğesinin
    üst öğesi olduğunda atlar. Bu durumda,
    görev tamamlanmasının üzerine A2A çalıştırmak üst öğeyi alt öğenin
    sonucu ile uyandırabilir, üst öğenin yanıtını alt öğeye geri iletebilir ve
    bir üst öğe/alt öğe yankı döngüsü oluşturabilir. `sessions_send` sonucu,
    bu sahip olunan alt öğe durumu için `delivery.status="skipped"` bildirir çünkü
    sonuçtan zaten tamamlama yolu sorumludur.

  </Accordion>
  <Accordion title="Mevcut bir oturumu sürdür">
    Yeni başlamak yerine önceki bir ACP oturumuna devam etmek için
    `resumeSessionId` kullanın. Agent, konuşma geçmişini
    `session/load` üzerinden yeniden oynatır; böylece önceki olanların tam
    bağlamıyla devam eder.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Yaygın kullanım durumları:

    - Bir Codex oturumunu dizüstü bilgisayarınızdan telefonunuza devredin; agent'ınıza kaldığınız yerden devam etmesini söyleyin.
    - CLI'de etkileşimli olarak başlattığınız bir kodlama oturumuna artık agent'ınız üzerinden başsız şekilde devam edin.
    - Gateway yeniden başlatması veya boşta kalma zaman aşımı nedeniyle kesintiye uğrayan işi sürdürün.

    Notlar:

    - `resumeSessionId` yalnızca `runtime: "acp"` olduğunda geçerlidir; varsayılan alt agent çalışma zamanı bu yalnızca ACP alanını yok sayar.
    - `streamTo` yalnızca `runtime: "acp"` olduğunda geçerlidir; varsayılan alt agent çalışma zamanı bu yalnızca ACP alanını yok sayar.
    - `resumeSessionId`, OpenClaw kanal oturumu anahtarı değil, ana makineye yerel bir ACP/harness sürdürme kimliğidir; OpenClaw gönderimden önce ACP oluşturma ilkesini ve hedef agent ilkesini hâlâ denetlerken, bu yukarı akış kimliğini yükleme yetkilendirmesinin sahibi ACP arka ucu veya harness'tır.
    - `resumeSessionId` yukarı akış ACP konuşma geçmişini geri yükler; `thread` ve `mode` oluşturduğunuz yeni OpenClaw oturumuna normal şekilde uygulanmaya devam eder, bu nedenle `mode: "session"` hâlâ `thread: true` gerektirir.
    - Hedef agent `session/load` desteklemelidir (Codex ve Claude Code destekler).
    - Oturum kimliği bulunamazsa oluşturma açık bir hatayla başarısız olur; yeni bir oturuma sessiz geri dönüş yapılmaz.

  </Accordion>
  <Accordion title="Dağıtım sonrası duman testi">
    Bir Gateway dağıtımından sonra birim testlerine güvenmek yerine
    canlı uçtan uca denetim çalıştırın:

    1. Hedef ana makinede dağıtılmış Gateway sürümünü ve commit'i doğrulayın.
    2. Canlı bir agent'a geçici bir ACPX köprü oturumu açın.
    3. Bu agent'tan `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` ve `Reply with exactly LIVE-ACP-SPAWN-OK` göreviyle `sessions_spawn` çağırmasını isteyin.
    4. `accepted=yes`, gerçek bir `childSessionKey` ve doğrulayıcı hatası olmadığını doğrulayın.
    5. Geçici köprü oturumunu temizleyin.

    Kapıyı `mode: "run"` üzerinde tutun ve `streamTo: "parent"` seçeneğini atlayın;
    iş parçacığına bağlı `mode: "session"` ve akış aktarma yolları ayrı,
    daha zengin entegrasyon geçişleridir.

  </Accordion>
</AccordionGroup>

## Sandbox uyumluluğu

ACP oturumları şu anda OpenClaw sandbox'ının içinde **değil**,
ana makine çalışma zamanında çalışır.

<Warning>
**Güvenlik sınırı:**

- Harici harness, kendi CLI izinlerine ve seçilen `cwd` değerine göre okuyup yazabilir.
- OpenClaw'ın sandbox ilkesi ACP harness yürütmesini **sarmalamaz**.
- OpenClaw ACP özellik kapılarını, izin verilen agent'ları, oturum sahipliğini, kanal bağlamalarını ve Gateway teslim ilkesini hâlâ uygular.
- Sandbox tarafından zorunlu tutulan OpenClaw yerel işleri için `runtime: "subagent"` kullanın.

</Warning>

Mevcut sınırlamalar:

- İstekte bulunan oturum sandbox içindeyse ACP oluşturma işlemleri hem `sessions_spawn({ runtime: "acp" })` hem de `/acp spawn` için engellenir.
- `runtime: "acp"` ile `sessions_spawn`, `sandbox: "require"` desteklemez.

## Oturum hedefi çözümleme

Çoğu `/acp` eylemi isteğe bağlı bir oturum hedefi kabul eder (`session-key`,
`session-id` veya `session-label`).

**Çözümleme sırası:**

1. Açık hedef bağımsız değişkeni (veya `/acp steer` için `--session`)
   - anahtarı dener
   - ardından UUID biçimli oturum kimliğini
   - ardından etiketi
2. Geçerli iş parçacığı bağlaması (bu konuşma/iş parçacığı bir ACP oturumuna bağlıysa).
3. Geçerli istekte bulunan oturuma geri dönüş.

Geçerli konuşma bağlamaları ve iş parçacığı bağlamaları, ikisi de
2. adıma katılır.

Hiçbir hedef çözümlenmezse OpenClaw açık bir hata döndürür
(`Unable to resolve session target: ...`).

## ACP kontrolleri

| Komut                | Ne yapar                                                   | Örnek                                                         |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP oturumu oluşturur; isteğe bağlı geçerli bağlama veya iş parçacığı bağlaması. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Hedef oturum için sürmekte olan turu iptal eder.           | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Çalışan oturuma yönlendirme talimatı gönderir.             | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Oturumu kapatır ve iş parçacığı hedeflerinin bağını kaldırır. | `/acp close`                                                  |
| `/acp status`        | Arka ucu, modu, durumu, çalışma zamanı seçeneklerini ve yetenekleri gösterir. | `/acp status`                                                 |
| `/acp set-mode`      | Hedef oturum için çalışma zamanı modunu ayarlar.           | `/acp set-mode plan`                                          |
| `/acp set`           | Genel çalışma zamanı yapılandırma seçeneği yazma işlemi.   | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Çalışma zamanı çalışma dizini geçersiz kılmasını ayarlar.  | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Onay ilkesi profilini ayarlar.                             | `/acp permissions strict`                                     |
| `/acp timeout`       | Çalışma zamanı zaman aşımını (saniye) ayarlar.             | `/acp timeout 120`                                            |
| `/acp model`         | Çalışma zamanı model geçersiz kılmasını ayarlar.           | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Oturum çalışma zamanı seçeneği geçersiz kılmalarını kaldırır. | `/acp reset-options`                                          |
| `/acp sessions`      | Depodan son ACP oturumlarını listeler.                     | `/acp sessions`                                               |
| `/acp doctor`        | Arka uç sağlığı, yetenekler, uygulanabilir düzeltmeler.    | `/acp doctor`                                                 |
| `/acp install`       | Belirleyici kurulum ve etkinleştirme adımlarını yazdırır.  | `/acp install`                                                |

Çalışma zamanı kontrolleri (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model` ve `reset-options`) harici
kanallardan sahip kimliği ve dahili Gateway istemcilerinden `operator.admin`
gerektirir. Yetkili sahip olmayan gönderenler yine de `sessions`, `doctor`,
`install` ve `help` kullanabilir.

`/acp status` etkin çalışma zamanı seçeneklerini, ayrıca çalışma zamanı düzeyi ve
arka uç düzeyi oturum tanımlayıcılarını gösterir. Bir arka uçta bir yetenek
bulunmadığında desteklenmeyen kontrol hataları açıkça yüzeye çıkar.
`/acp sessions`, geçerli bağlı oturum veya istekte bulunan oturum için depoyu
okur; hedef belirteçleri (`session-key`, `session-id` veya `session-label`),
özel agent başına `session.store` kökleri dahil olmak üzere Gateway oturum
keşfi üzerinden çözümlenir.

### Çalışma zamanı seçenekleri eşlemesi

`/acp` kolaylık komutlarına ve genel bir ayarlayıcıya sahiptir. Eşdeğer
işlemler:

| Komut                        | Şuna eşlenir                         | Notlar                                                                                                                                                                                                     |
| ---------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | çalışma zamanı yapılandırma anahtarı `model` | Codex ACP için OpenClaw `openai/<model>` değerini bağdaştırıcı model kimliğine normalleştirir ve `openai/gpt-5.4/high` gibi eğik çizgili reasoning soneklerini `reasoning_effort` değerine eşler.        |
| `/acp set thinking <level>`  | kanonik seçenek `thinking`           | OpenClaw mevcut olduğunda arka ucun duyurduğu eşdeğeri gönderir; sırasıyla `thinking`, ardından `effort`, `reasoning_effort` veya `thought_level` tercih edilir. Codex ACP için bağdaştırıcı değerleri `reasoning_effort` değerine eşler. |
| `/acp permissions <profile>` | kanonik seçenek `permissionProfile`  | OpenClaw mevcut olduğunda `approval_policy`, `permission_profile`, `permissions` veya `permission_mode` gibi arka ucun duyurduğu eşdeğeri gönderir.                                                        |
| `/acp timeout <seconds>`     | kanonik seçenek `timeoutSeconds`     | OpenClaw mevcut olduğunda `timeout` veya `timeout_seconds` gibi arka ucun duyurduğu eşdeğeri gönderir.                                                                                                    |
| `/acp cwd <path>`            | çalışma zamanı cwd geçersiz kılması  | Doğrudan güncelleme.                                                                                                                                                                                       |
| `/acp set <key> <value>`     | genel                                | `key=cwd`, cwd geçersiz kılma yolunu kullanır.                                                                                                                                                            |
| `/acp reset-options`         | tüm çalışma zamanı geçersiz kılmalarını temizler | -                                                                                                                                                                                                         |

## acpx harness, Plugin kurulumu ve izinler

acpx harness yapılandırması (Claude Code / Codex / Gemini CLI
takma adları), plugin-tools ve OpenClaw-tools MCP köprüleri ve ACP
izin modları için bkz.
[ACP agent'ları - kurulum](/tr/tools/acp-agents-setup).

## Sorun giderme

| Belirti                                                                     | Olası neden                                                                                                            | Düzeltme                                                                                                                                                                 |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Arka uç Plugin eksik, devre dışı ya da `plugins.allow` tarafından engellenmiş.                                         | Arka uç Plugin'i kurup etkinleştirin, izin listesi ayarlandığında `plugins.allow` içine `acpx` ekleyin, ardından `/acp doctor` çalıştırın.                               |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP genel olarak devre dışı.                                                                                          | `acp.enabled=true` ayarlayın.                                                                                                                                            |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Normal iş parçacığı iletilerinden otomatik dağıtım devre dışı.                                                        | Otomatik iş parçacığı yönlendirmesini sürdürmek için `acp.dispatch.enabled=true` ayarlayın; açık `sessions_spawn({ runtime: "acp" })` çağrıları çalışmaya devam eder.     |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent izin listesinde değil.                                                                                          | İzin verilen `agentId` değerini kullanın veya `acp.allowedAgents` değerini güncelleyin.                                                                                  |
| `/acp doctor` reports backend not ready right after startup                 | Arka uç Plugin eksik, devre dışı, izin/ret politikası tarafından engellenmiş ya da yapılandırılmış yürütülebilir dosyası kullanılamıyor. | Arka uç Plugin'i kurun/etkinleştirin, `/acp doctor` komutunu yeniden çalıştırın ve sağlıksız kalırsa arka uç kurulumunu veya politika hatasını inceleyin.                |
| Harness command not found                                                   | Bağdaştırıcı CLI kurulmamış, harici Plugin eksik veya Codex dışı bir bağdaştırıcı için ilk çalıştırma `npx` getirmesi başarısız olmuş. | Gateway ana makinesinde `/acp doctor` çalıştırın, bağdaştırıcıyı kurun/önceden ısıtın veya acpx agent komutunu açıkça yapılandırın.                                      |
| Model-not-found from the harness                                            | Model kimliği başka bir provider/harness için geçerli, ancak bu ACP hedefi için geçerli değil.                         | Bu harness tarafından listelenen bir modeli kullanın, modeli harness içinde yapılandırın veya geçersiz kılmayı atlayın.                                                  |
| Vendor auth error from the harness                                          | OpenClaw sağlıklı, ancak hedef CLI/provider oturum açmamış.                                                            | Gateway ana makine ortamında oturum açın veya gerekli provider anahtarını sağlayın.                                                                                      |
| `Unable to resolve session target: ...`                                     | Hatalı anahtar/kimlik/etiket belirteci.                                                                                | `/acp sessions` çalıştırın, tam anahtarı/etiketi kopyalayın, yeniden deneyin.                                                                                            |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here`, etkin bağlanabilir bir konuşma olmadan kullanılmış.                                                     | Hedef sohbet/kanala geçip yeniden deneyin veya bağlı olmayan spawn kullanın.                                                                                             |
| `Conversation bindings are unavailable for <channel>.`                      | Bağdaştırıcıda geçerli konuşma ACP bağlama yeteneği yok.                                                               | Desteklendiği yerde `/acp spawn ... --thread ...` kullanın, üst düzey `bindings[]` yapılandırın veya desteklenen bir kanala geçin.                                       |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here`, bir iş parçacığı bağlamının dışında kullanılmış.                                                      | Hedef iş parçacığına geçin veya `--thread auto`/`off` kullanın.                                                                                                          |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Etkin bağlama hedefinin sahibi başka bir kullanıcı.                                                                    | Sahip olarak yeniden bağlayın veya farklı bir konuşma ya da iş parçacığı kullanın.                                                                                       |
| `Thread bindings are unavailable for <channel>.`                            | Bağdaştırıcıda iş parçacığı bağlama yeteneği yok.                                                                      | `--thread off` kullanın veya desteklenen bağdaştırıcı/kanala geçin.                                                                                                      |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP runtime ana makine tarafındadır; istekte bulunan oturum sandbox içindedir.                                         | Sandbox içindeki oturumlardan `runtime="subagent"` kullanın veya ACP spawn işlemini sandbox içinde olmayan bir oturumdan çalıştırın.                                     |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP runtime için `sandbox="require"` istenmiş.                                                                         | Gerekli sandbox için `runtime="subagent"` kullanın veya sandbox içinde olmayan bir oturumdan `sandbox="inherit"` ile ACP kullanın.                                        |
| `Cannot apply --model ... did not advertise model support`                  | Hedef harness genel ACP model değiştirmeyi sunmuyor.                                                                   | ACP `models`/`session/set_model` duyuran bir harness kullanın, Codex ACP model referanslarını kullanın veya kendi başlangıç bayrağı varsa modeli doğrudan harness içinde yapılandırın. |
| Missing ACP metadata for bound session                                      | Eski/silinmiş ACP oturum meta verileri.                                                                                | `/acp spawn` ile yeniden oluşturun, ardından iş parçacığını yeniden bağlayın/odaklayın.                                                                                  |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode`, etkileşimsiz ACP oturumunda yazma/yürütmeyi engelliyor.                                              | `plugins.entries.acpx.config.permissionMode` değerini `approve-all` olarak ayarlayın ve Gateway'i yeniden başlatın. Bkz. [İzin yapılandırması](/tr/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | İzin istemleri `permissionMode`/`nonInteractivePermissions` tarafından engelleniyor.                                   | Gateway günlüklerinde `AcpRuntimeError` olup olmadığını kontrol edin. Tam izinler için `permissionMode=approve-all` ayarlayın; zarif düşüş için `nonInteractivePermissions=deny` ayarlayın. |
| ACP session stalls indefinitely after completing work                       | Harness işlemi bitmiş, ancak ACP oturumu tamamlandığını bildirmemiş.                                                   | OpenClaw'ı güncelleyin; güncel acpx temizliği, kapanışta ve Gateway başlangıcında OpenClaw'a ait eski sarmalayıcı ve bağdaştırıcı işlemlerini toplar.                    |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | İç olay zarfı ACP sınırından sızmış.                                                                                   | OpenClaw'ı güncelleyin ve tamamlama akışını yeniden çalıştırın; harici harness'ler yalnızca düz tamamlama istemleri almalıdır.                                           |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable`, ACP/acpx'e değil
yerel Codex hook aktarımına aittir. Bağlı bir Codex sohbetinde, `/new` veya `/reset`
ile yeni bir oturum başlatın; bir kez çalışıp sonraki yerel araç çağrısında yeniden
dönerse, `/new` komutunu tekrarlamak yerine Codex app-server'ı veya OpenClaw Gateway'i
yeniden başlatın. Bkz. [Codex harness sorun giderme](/tr/plugins/codex-harness#troubleshooting).
</Note>

## İlgili

- [ACP agent'ları - kurulum](/tr/tools/acp-agents-setup)
- [Agent gönderme](/tr/tools/agent-send)
- [CLI Arka Uçları](/tr/gateway/cli-backends)
- [Codex harness](/tr/plugins/codex-harness)
- [Codex harness runtime](/tr/plugins/codex-harness-runtime)
- [Çok agent'lı sandbox araçları](/tr/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (köprü modu)](/tr/cli/acp)
- [Alt agent'lar](/tr/tools/subagents)
