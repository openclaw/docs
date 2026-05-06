---
read_when:
    - Kodlama altyapılarını ACP üzerinden çalıştırma
    - Mesajlaşma kanallarında konuşmaya bağlı ACP oturumlarını ayarlama
    - Bir mesaj kanalı konuşmasını kalıcı bir ACP oturumuna bağlama
    - ACP arka ucu, Plugin bağlantıları veya tamamlama iletimiyle ilgili sorun giderme
    - Sohbetten /acp komutlarını çalıştırma
sidebarTitle: ACP agents
summary: Harici kodlama çalıştırıcılarını (Claude Code, Cursor, Gemini CLI, açık Codex ACP, OpenClaw ACP, OpenCode) ACP arka ucu üzerinden çalıştırın
title: ACP aracıları
x-i18n:
    generated_at: "2026-05-06T09:32:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75744690ee307bc86d9a3de268c84e52d8a281ca8a0e7d2d39c9a0cb7fbe2b39
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) oturumları,
OpenClaw'ın ACP backend Plugin'i aracılığıyla harici kodlama koşumlarını
(örneğin Pi, Claude Code, Cursor, Copilot, Droid, OpenClaw ACP, OpenCode,
Gemini CLI ve desteklenen diğer ACPX koşumları) çalıştırmasını sağlar.

Her ACP oturumu başlatması bir [arka plan görevi](/tr/automation/tasks) olarak izlenir.

<Note>
**ACP, varsayılan Codex yolu değil, harici koşum yoludur.** Yerel Codex
app-server Plugin'i `/codex ...` denetimlerinin ve `agentRuntime.id: "codex"`
gömülü çalışma zamanının sahibidir; ACP ise `/acp ...` denetimlerinin ve
`sessions_spawn({ runtime: "acp" })` oturumlarının sahibidir.

Codex veya Claude Code'un mevcut OpenClaw kanal konuşmalarına harici MCP istemcisi
olarak doğrudan bağlanmasını istiyorsanız, ACP yerine
[`openclaw mcp serve`](/tr/cli/mcp) kullanın.
</Note>

## Hangi sayfaya ihtiyacım var?

| Şunu yapmak istiyorsunuz…                                                                       | Bunu kullanın                         | Notlar                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Geçerli konuşmada Codex'i bağlamak veya denetlemek                                              | `/codex bind`, `/codex threads`       | `codex` Plugin'i etkin olduğunda yerel Codex app-server yolu; bağlı sohbet yanıtlarını, görüntü iletmeyi, model/hızlı/izinleri, durdurma ve yönlendirme denetimlerini içerir. ACP açık bir yedektir |
| Claude Code, Gemini CLI, açık Codex ACP veya başka bir harici koşumu OpenClaw _üzerinden_ çalıştırmak | Bu sayfa                              | Sohbete bağlı oturumlar, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, arka plan görevleri, çalışma zamanı denetimleri                                                                        |
| Bir OpenClaw Gateway oturumunu bir düzenleyici veya istemci için ACP sunucusu _olarak_ sunmak   | [`openclaw acp`](/tr/cli/acp)            | Köprü modu. IDE/istemci, stdio/WebSocket üzerinden OpenClaw ile ACP konuşur                                                                                                                          |
| Yerel bir AI CLI'ını yalnızca metin yedek modeli olarak yeniden kullanmak                       | [CLI Backend'leri](/tr/gateway/cli-backends) | ACP değil. OpenClaw aracı yok, ACP denetimi yok, koşum çalışma zamanı yok                                                                                                                            |

## Bu kutudan çıktığı gibi çalışır mı?

Evet, resmi ACP çalışma zamanı Plugin'i kurulduktan sonra:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Kaynak checkout'ları, `pnpm install` sonrasında yerel `extensions/acpx` workspace
Plugin'ini kullanabilir. Hazırlık denetimi için `/acp doctor` çalıştırın.

OpenClaw, ajanlara ACP başlatmayı yalnızca ACP **gerçekten kullanılabilir**
olduğunda öğretir: ACP etkin olmalı, dispatch devre dışı bırakılmamış olmalı,
geçerli oturum sandbox tarafından engellenmemiş olmalı ve bir çalışma zamanı
backend'i yüklenmiş olmalıdır. Bu koşullar karşılanmazsa, ACP Plugin Skills'leri
ve `sessions_spawn` ACP yönergeleri gizli kalır; böylece ajan kullanılamayan bir
backend önermemiş olur.

<AccordionGroup>
  <Accordion title="İlk çalıştırma sorunları">
    - `plugins.allow` ayarlanmışsa, bu kısıtlayıcı bir Plugin envanteridir ve **mutlaka** `acpx` içermelidir; aksi halde kurulu ACP backend'i bilerek engellenir ve `/acp doctor` eksik allowlist girdisini bildirir.
    - Codex ACP adaptörü `acpx` Plugin'iyle birlikte hazırlanır ve mümkün olduğunda yerel olarak başlatılır.
    - Diğer hedef koşum adaptörleri, ilk kez kullandığınızda hâlâ `npx` ile isteğe bağlı olarak getirilebilir.
    - Satıcı kimlik doğrulamasının o koşum için ana makinede hâlâ mevcut olması gerekir.
    - Ana makinede npm veya ağ erişimi yoksa, önbellekler önceden ısıtılana veya adaptör başka bir şekilde kurulana kadar ilk çalıştırma adaptör getirmeleri başarısız olur.

  </Accordion>
  <Accordion title="Çalışma zamanı önkoşulları">
    ACP gerçek bir harici koşum süreci başlatır. OpenClaw yönlendirme,
    arka plan görevi durumu, teslim, bağlamalar ve politikadan sorumludur;
    koşum ise sağlayıcı oturumu, model kataloğu, dosya sistemi davranışı ve
    yerel araçlardan sorumludur.

    OpenClaw'ı suçlamadan önce şunları doğrulayın:

    - `/acp doctor` etkin ve sağlıklı bir backend bildiriyor.
    - Bu allowlist ayarlandığında hedef id, `acp.allowedAgents` tarafından izinli.
    - Koşum komutu Gateway ana makinesinde başlayabiliyor.
    - Sağlayıcı kimlik doğrulaması o koşum için mevcut (`claude`, `codex`, `gemini`, `opencode`, `droid` vb.).
    - Seçilen model o koşum için mevcut; model id'leri koşumlar arasında taşınabilir değildir.
    - İstenen `cwd` mevcut ve erişilebilir; ya da `cwd` belirtmeyin ve backend'in varsayılanını kullanmasına izin verin.
    - İzin modu işle eşleşiyor. Etkileşimsiz oturumlar yerel izin istemlerine tıklayamaz; bu nedenle yazma/çalıştırma ağırlıklı kodlama çalışmaları genellikle başsız ilerleyebilen bir ACPX izin profiline ihtiyaç duyar.

  </Accordion>
</AccordionGroup>

OpenClaw Plugin araçları ve yerleşik OpenClaw araçları varsayılan olarak ACP
koşumlarına açılmaz. Açık MCP köprülerini, yalnızca koşumun bu araçları doğrudan
çağırması gerektiğinde [ACP ajanları - kurulum](/tr/tools/acp-agents-setup) içinde
etkinleştirin.

## Desteklenen koşum hedefleri

`acpx` backend'iyle, bu koşum id'lerini `/acp spawn <id>` veya
`sessions_spawn({ runtime: "acp", agentId: "<id>" })` hedefleri olarak kullanın:

| Koşum id'si | Tipik backend                                 | Notlar                                                                                   |
| ----------- | --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `claude`    | Claude Code ACP adaptörü                      | Ana makinede Claude Code kimlik doğrulaması gerektirir.                                  |
| `codex`     | Codex ACP adaptörü                            | Yalnızca yerel `/codex` kullanılamadığında veya ACP istendiğinde açık ACP yedeği.         |
| `copilot`   | GitHub Copilot ACP adaptörü                   | Copilot CLI/çalışma zamanı kimlik doğrulaması gerektirir.                                |
| `cursor`    | Cursor CLI ACP (`cursor-agent acp`)           | Yerel kurulum farklı bir ACP giriş noktası sunuyorsa acpx komutunu geçersiz kılın.       |
| `droid`     | Factory Droid CLI                             | Koşum ortamında Factory/Droid kimlik doğrulaması veya `FACTORY_API_KEY` gerektirir.      |
| `gemini`    | Gemini CLI ACP adaptörü                       | Gemini CLI kimlik doğrulaması veya API anahtarı kurulumu gerektirir.                     |
| `iflow`     | iFlow CLI                                     | Adaptör kullanılabilirliği ve model denetimi kurulu CLI'a bağlıdır.                      |
| `kilocode`  | Kilo Code CLI                                 | Adaptör kullanılabilirliği ve model denetimi kurulu CLI'a bağlıdır.                      |
| `kimi`      | Kimi/Moonshot CLI                             | Ana makinede Kimi/Moonshot kimlik doğrulaması gerektirir.                                |
| `kiro`      | Kiro CLI                                      | Adaptör kullanılabilirliği ve model denetimi kurulu CLI'a bağlıdır.                      |
| `opencode`  | OpenCode ACP adaptörü                         | OpenCode CLI/sağlayıcı kimlik doğrulaması gerektirir.                                    |
| `openclaw`  | `openclaw acp` üzerinden OpenClaw Gateway köprüsü | ACP uyumlu bir koşumun OpenClaw Gateway oturumuna geri konuşmasını sağlar.               |
| `pi`        | Pi/gömülü OpenClaw çalışma zamanı             | OpenClaw yerel koşum deneyleri için kullanılır.                                          |
| `qwen`      | Qwen Code / Qwen CLI                          | Ana makinede Qwen uyumlu kimlik doğrulaması gerektirir.                                  |

Özel acpx ajan takma adları acpx içinde yapılandırılabilir, ancak OpenClaw
politikası dispatch öncesinde yine `acp.allowedAgents` ve varsa
`agents.list[].runtime.acp.agent` eşlemesini denetler.

## Operatör runbook'u

Sohbetten hızlı `/acp` akışı:

<Steps>
  <Step title="Başlat">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` veya açık
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Çalış">
    Bağlı konuşmada veya iş parçacığında devam edin (ya da oturum anahtarını
    açıkça hedefleyin).
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
    - Başlatma, bir ACP çalışma zamanı oturumu oluşturur veya sürdürür, ACP meta verilerini OpenClaw oturum deposuna kaydeder ve çalışma üst öğeye ait olduğunda bir arka plan görevi oluşturabilir.
    - Üst öğeye ait ACP oturumları, çalışma zamanı oturumu kalıcı olsa bile arka plan işi olarak ele alınır; tamamlama ve yüzeyler arası teslim, normal kullanıcıya dönük sohbet oturumu gibi davranmak yerine üst görev bildiricisi üzerinden geçer.
    - Görev bakımı, terminal durumundaki veya sahipsiz üst öğeye ait tek seferlik ACP oturumlarını kapatır. Kalıcı ACP oturumları, etkin bir konuşma bağlaması kaldığı sürece korunur; etkin bağlaması olmayan eski kalıcı oturumlar, sahip görev tamamlandıktan veya görev kaydı kaybolduktan sonra sessizce sürdürülememeleri için kapatılır.
    - Bağlı takip mesajları, bağlama kapatılana, odaktan çıkarılana, sıfırlanana veya süresi dolana kadar doğrudan ACP oturumuna gider.
    - Gateway komutları yerel kalır. `/acp ...`, `/status` ve `/unfocus`, bağlı bir ACP koşumuna normal istem metni olarak asla gönderilmez.
    - Backend iptali desteklediğinde `cancel` etkin turu iptal eder; bağlamayı veya oturum meta verilerini silmez.
    - `close`, ACP oturumunu OpenClaw açısından sonlandırır ve bağlamayı kaldırır. Bir koşum, sürdürmeyi destekliyorsa kendi yukarı akış geçmişini hâlâ tutabilir.
    - Boştaki çalışma zamanı işçileri `acp.runtime.ttlMinutes` sonrasında temizleme için uygun hale gelir; depolanan oturum meta verileri `/acp sessions` için kullanılabilir kalır.

  </Accordion>
  <Accordion title="Yerel Codex yönlendirme kuralları">
    Etkin olduğunda **yerel Codex Plugin'ine** yönlendirilmesi gereken doğal dil tetikleyicileri:

    - "Bu Discord kanalını Codex'e bağla."
    - "Bu sohbeti Codex iş parçacığına `<id>` ekle."
    - "Codex iş parçacıklarını göster, sonra bunu bağla."

    Yerel Codex konuşma bağlama varsayılan sohbet denetim yoludur.
    OpenClaw dinamik araçları hâlâ OpenClaw üzerinden çalışır; shell/apply-patch
    gibi Codex yerel araçları ise Codex içinde çalışır. Codex yerel araç
    olayları için OpenClaw, Plugin hook'larının `before_tool_call` öğesini
    engelleyebilmesi, `after_tool_call` öğesini gözlemleyebilmesi ve Codex
    `PermissionRequest` olaylarını OpenClaw onayları üzerinden yönlendirebilmesi
    için tur başına bir yerel hook aktarıcısı enjekte eder. Codex `Stop` hook'ları,
    Plugin'lerin Codex yanıtını sonlandırmadan önce bir model geçişi daha
    isteyebileceği OpenClaw `before_agent_finalize` öğesine aktarılır. Aktarıcı
    bilerek temkinli kalır: Codex yerel araç argümanlarını değiştirmez veya
    Codex iş parçacığı kayıtlarını yeniden yazmaz. Yalnızca ACP çalışma
    zamanı/oturum modelini istediğinizde açık ACP kullanın. Gömülü Codex destek
    sınırı [Codex koşumu v1 destek sözleşmesi](/tr/plugins/codex-harness#v1-support-contract)
    içinde belgelenmiştir.

  </Accordion>
  <Accordion title="Model / sağlayıcı / çalışma zamanı seçimi kısa başvuru tablosu">
    - `openai-codex/*` - PI Codex OAuth/abonelik rotası.
    - `openai/*` artı `agentRuntime.id: "codex"` - yerel Codex app-server gömülü çalışma zamanı.
    - `/codex ...` - yerel Codex konuşma kontrolü.
    - `/acp ...` veya `runtime: "acp"` - açık ACP/acpx kontrolü.

  </Accordion>
  <Accordion title="ACP yönlendirme doğal dil tetikleyicileri">
    ACP çalışma zamanına yönlendirilmesi gereken tetikleyiciler:

    - "Bunu tek seferlik Claude Code ACP oturumu olarak çalıştır ve sonucu özetle."
    - "Bu görev için Gemini CLI'ı bir iş parçacığında kullan, ardından takipleri aynı iş parçacığında tut."
    - "Codex'i ACP üzerinden arka plan iş parçacığında çalıştır."

    OpenClaw `runtime: "acp"` seçer, koşum `agentId` değerini çözümler,
    desteklendiğinde geçerli konuşmaya veya iş parçacığına bağlanır ve
    kapanış/süre dolumuna kadar takipleri o oturuma yönlendirir. Codex bu yolu yalnızca
    ACP/acpx açık olduğunda veya istenen işlem için yerel Codex
    Plugin kullanılamadığında izler.

    `sessions_spawn` için `runtime: "acp"` yalnızca ACP
    etkinse, istekte bulunan sandbox içinde değilse ve bir ACP çalışma zamanı
    arka ucu yüklenmişse ilan edilir. `acp.dispatch.enabled=false`, otomatik
    ACP iş parçacığı gönderimini duraklatır ancak açık
    `sessions_spawn({ runtime: "acp" })` çağrılarını gizlemez veya engellemez. `codex`,
    `claude`, `droid`, `gemini` veya `opencode` gibi ACP koşum kimliklerini hedefler.
    Bu girdi açıkça `agents.list[].runtime.type="acp"` ile
    yapılandırılmadıkça `agents_list` içinden normal bir
    OpenClaw yapılandırma aracı kimliği geçirmeyin;
    bunun yerine varsayılan alt aracı çalışma zamanını kullanın. Bir OpenClaw aracı
    `runtime.type="acp"` ile yapılandırıldığında OpenClaw,
    temel koşum kimliği olarak `runtime.acp.agent` kullanır.

  </Accordion>
</AccordionGroup>

## ACP ve alt aracılar

Harici bir koşum çalışma zamanı istediğinizde ACP kullanın. `codex`
Plugin etkinken Codex konuşma bağlama/kontrolü için **yerel Codex
app-server** kullanın. OpenClaw'a özgü
yetkilendirilmiş çalıştırmalar istediğinizde **alt aracıları** kullanın.

| Alan          | ACP oturumu                           | Alt aracı çalıştırması                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Çalışma zamanı       | ACP arka uç Plugin (örneğin acpx) | OpenClaw yerel alt aracı çalışma zamanı  |
| Oturum anahtarı   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Ana komutlar | `/acp ...`                            | `/subagents ...`                   |
| Başlatma aracı    | `runtime:"acp"` ile `sessions_spawn` | `sessions_spawn` (varsayılan çalışma zamanı) |

Ayrıca bkz. [Alt aracılar](/tr/tools/subagents).

## ACP Claude Code'u nasıl çalıştırır

ACP üzerinden Claude Code için yığın şöyledir:

1. OpenClaw ACP oturum kontrol düzlemi.
2. Resmi `@openclaw/acpx` çalışma zamanı Plugin.
3. Claude ACP bağdaştırıcısı.
4. Claude tarafı çalışma zamanı/oturum mekanizması.

ACP Claude, ACP kontrolleri, oturum sürdürme,
arka plan görev takibi ve isteğe bağlı konuşma/iş parçacığı bağlama özelliklerine sahip bir **koşum oturumudur**.

CLI arka uçları ayrı, yalnızca metin tabanlı yerel yedek çalışma zamanlarıdır - bkz.
[CLI Arka Uçları](/tr/gateway/cli-backends).

Operatörler için pratik kural şudur:

- **`/acp spawn`, bağlanabilir oturumlar, çalışma zamanı kontrolleri veya kalıcı koşum işi mi istiyorsunuz?** ACP kullanın.
- **Ham CLI üzerinden basit yerel metin yedeği mi istiyorsunuz?** CLI arka uçlarını kullanın.

## Bağlı oturumlar

### Zihinsel model

- **Sohbet yüzeyi** - insanların konuşmayı sürdürdüğü yer (Discord kanalı, Telegram konusu, iMessage sohbeti).
- **ACP oturumu** - OpenClaw'un yönlendirdiği kalıcı Codex/Claude/Gemini çalışma zamanı durumu.
- **Alt iş parçacığı/konu** - yalnızca `--thread ...` tarafından oluşturulan isteğe bağlı ek mesajlaşma yüzeyi.
- **Çalışma zamanı çalışma alanı** - koşumun çalıştığı dosya sistemi konumu (`cwd`, depo checkout'u, arka uç çalışma alanı). Sohbet yüzeyinden bağımsızdır.

### Geçerli konuşma bağlamaları

`/acp spawn <harness> --bind here`, geçerli konuşmayı
başlatılan ACP oturumuna sabitler - alt iş parçacığı yok, aynı sohbet yüzeyi. OpenClaw
taşıma, kimlik doğrulama, güvenlik ve teslimatı yönetmeye devam eder. Bu
konuşmadaki takip mesajları aynı oturuma yönlendirilir; `/new` ve `/reset`
oturumu yerinde sıfırlar; `/acp close` bağlamayı kaldırır.

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
  <Accordion title="Bağlama kuralları ve ayrıcalıklılık">
    - `--bind here` ve `--thread ...` birbirini dışlar.
    - `--bind here` yalnızca geçerli konuşma bağlamasını ilan eden kanallarda çalışır; aksi halde OpenClaw açık bir desteklenmiyor mesajı döndürür. Bağlamalar Gateway yeniden başlatmalarında kalıcıdır.
    - Discord'da `spawnSessions`, `--thread auto|here` için alt iş parçacığı oluşturmayı sınırlar - `--bind here` için değil.
    - `--cwd` olmadan farklı bir ACP aracısına başlatırsanız OpenClaw varsayılan olarak **hedef aracının** çalışma alanını devralır. Eksik devralınan yollar (`ENOENT`/`ENOTDIR`) arka uç varsayılanına geri döner; diğer erişim hataları (örn. `EACCES`) başlatma hataları olarak görünür.
    - Gateway yönetim komutları bağlı konuşmalarda yerel kalır - normal takip metni bağlı ACP oturumuna yönlendirilse bile `/acp ...` komutları OpenClaw tarafından işlenir; komut işleme o yüzey için etkin olduğunda `/status` ve `/unfocus` da yerel kalır.

  </Accordion>
  <Accordion title="İş parçacığına bağlı oturumlar">
    Bir kanal bağdaştırıcısı için iş parçacığı bağlamaları etkinleştirildiğinde:

    - OpenClaw bir iş parçacığını hedef ACP oturumuna bağlar.
    - Bu iş parçacığındaki takip mesajları bağlı ACP oturumuna yönlendirilir.
    - ACP çıktısı aynı iş parçacığına geri teslim edilir.
    - Odaktan çıkarma/kapatma/arşivleme/boşta kalma zaman aşımı veya maksimum yaş süresi dolumu bağlamayı kaldırır.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` ve `/unfocus` Gateway komutlarıdır, ACP koşumuna gönderilen istemler değildir.

    İş parçacığına bağlı ACP için gerekli özellik bayrakları:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` varsayılan olarak açıktır (otomatik ACP iş parçacığı gönderimini duraklatmak için `false` ayarlayın; açık `sessions_spawn({ runtime: "acp" })` çağrıları çalışmaya devam eder).
    - Kanal bağdaştırıcısı iş parçacığı oturumu başlatmaları etkin (varsayılan: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    İş parçacığı bağlama desteği bağdaştırıcıya özeldir. Etkin kanal
    bağdaştırıcısı iş parçacığı bağlamalarını desteklemiyorsa OpenClaw açık bir
    desteklenmiyor/kullanılamıyor mesajı döndürür.

  </Accordion>
  <Accordion title="İş parçacığını destekleyen kanallar">
    - Oturum/iş parçacığı bağlama yeteneğini sunan herhangi bir kanal bağdaştırıcısı.
    - Geçerli yerleşik destek: **Discord** iş parçacıkları/kanalları, **Telegram** konuları (gruplarda/süper gruplarda forum konuları ve DM konuları).
    - Plugin kanalları aynı bağlama arayüzü üzerinden destek ekleyebilir.

  </Accordion>
</AccordionGroup>

## Kalıcı kanal bağlamaları

Geçici olmayan iş akışları için kalıcı ACP bağlamalarını
üst düzey `bindings[]` girdilerinde yapılandırın.

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
  İsteğe bağlı operatöre dönük etiket.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  İsteğe bağlı çalışma zamanı çalışma dizini.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  İsteğe bağlı arka uç geçersiz kılması.
</ParamField>

### Aracı başına çalışma zamanı varsayılanları

Aracı başına ACP varsayılanlarını bir kez tanımlamak için `agents.list[].runtime` kullanın:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (koşum kimliği, örn. `codex` veya `claude`)
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

- OpenClaw, yapılandırılmış ACP oturumunun kullanımdan önce var olmasını sağlar.
- Bu kanaldaki veya konudaki mesajlar yapılandırılmış ACP oturumuna yönlendirilir.
- Bağlı konuşmalarda `/new` ve `/reset` aynı ACP oturum anahtarını yerinde sıfırlar.
- Geçici çalışma zamanı bağlamaları (örneğin iş parçacığı odağı akışları tarafından oluşturulanlar) mevcut oldukları yerde uygulanmaya devam eder.
- Açık bir `cwd` olmadan çapraz aracı ACP başlatmalarında OpenClaw, hedef aracı çalışma alanını aracı yapılandırmasından devralır.
- Eksik devralınan çalışma alanı yolları arka uç varsayılan cwd değerine geri döner; eksik olmayan erişim hataları başlatma hataları olarak görünür.

## ACP oturumlarını başlatma

Bir ACP oturumu başlatmanın iki yolu vardır:

<Tabs>
  <Tab title="sessions_spawn üzerinden">
    Bir aracı turundan veya araç çağrısından ACP oturumu başlatmak için
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
    `runtime` varsayılan olarak `subagent` olur, bu yüzden ACP oturumları için
    `runtime: "acp"` değerini açıkça ayarlayın. `agentId` atlanırsa OpenClaw,
    yapılandırıldığında `acp.defaultAgent` değerini kullanır. `mode: "session"`,
    kalıcı bağlı bir konuşmayı korumak için `thread: true` gerektirir.
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

    Bkz. [Slash komutları](/tr/tools/slash-commands).

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
  ACP hedef çalışma düzeneği kimliği. Ayarlanmışsa `acp.defaultAgent` değerine geri döner.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Desteklendiği yerlerde iş parçacığı bağlama akışını isteyin.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` tek seferliktir; `"session"` kalıcıdır. `thread: true` ise ve
  `mode` atlanırsa OpenClaw, runtime yoluna göre varsayılan olarak kalıcı
  davranışı kullanabilir. `mode: "session"` `thread: true` gerektirir.
</ParamField>
<ParamField path="cwd" type="string">
  İstenen runtime çalışma dizini (backend/runtime ilkesi tarafından
  doğrulanır). Atlanırsa ACP spawn, yapılandırıldığında hedef ajan çalışma
  alanını devralır; eksik devralınan yollar backend varsayılanlarına geri
  dönerken gerçek erişim hataları döndürülür.
</ParamField>
<ParamField path="label" type="string">
  Oturum/başlık metninde kullanılan operatöre dönük etiket.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Yeni bir ACP oturumu oluşturmak yerine mevcut bir ACP oturumunu sürdürür.
  Ajan, konuşma geçmişini `session/load` aracılığıyla yeniden oynatır.
  `runtime: "acp"` gerektirir.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"`, ilk ACP çalıştırma ilerleme özetlerini sistem olayları olarak
  istekte bulunan oturuma geri yayınlar. Kabul edilen yanıtlar, tam aktarma
  geçmişi için takip edebileceğiniz oturum kapsamlı bir JSONL günlüğüne
  (`<sessionId>.acp-stream.jsonl`) işaret eden `streamLogPath` içerir.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  ACP alt dönüşünü N saniye sonra iptal eder. `0`, dönüşü gateway'in zaman
  aşımı olmayan yolunda tutar. Aynı değer Gateway çalıştırmasına ve ACP
  runtime'ına uygulanır, böylece takılmış/kota tükenmiş çalışma düzenekleri
  üst ajan hattını süresiz olarak meşgul etmez.
</ParamField>
<ParamField path="model" type="string">
  ACP alt oturumu için açık model geçersiz kılması. Codex ACP spawn'ları,
  `openai-codex/gpt-5.4` gibi OpenClaw Codex referanslarını `session/new`
  öncesinde Codex ACP başlangıç yapılandırmasına normalleştirir; 
  `openai-codex/gpt-5.4/high` gibi slash biçimleri de Codex ACP akıl yürütme
  eforunu ayarlar. Diğer çalışma düzenekleri ACP `models` değerlerini
  ilan etmeli ve `session/set_model` desteklemelidir; aksi halde OpenClaw/acpx
  hedef ajan varsayılanına sessizce geri dönmek yerine açıkça başarısız olur.
</ParamField>
<ParamField path="thinking" type="string">
  Açık düşünme/akıl yürütme eforu. Codex ACP için `minimal` düşük efora
  eşlenir, `low`/`medium`/`high`/`xhigh` doğrudan eşlenir ve `off`,
  akıl yürütme eforu başlangıç geçersiz kılmasını atlar.
</ParamField>

## Spawn bağlama ve iş parçacığı modları

<Tabs>
  <Tab title="--bind here|off">
    | Mod    | Davranış                                                              |
    | ------ | --------------------------------------------------------------------- |
    | `here` | Geçerli etkin konuşmayı yerinde bağla; etkin konuşma yoksa başarısız ol. |
    | `off`  | Geçerli konuşma bağlaması oluşturma.                                  |

    Notlar:

    - `--bind here`, "bu kanalı veya sohbeti Codex destekli yap" için en basit operatör yoludur.
    - `--bind here` alt iş parçacığı oluşturmaz.
    - `--bind here` yalnızca geçerli konuşma bağlama desteğini sunan kanallarda kullanılabilir.
    - `--bind` ve `--thread` aynı `/acp spawn` çağrısında birlikte kullanılamaz.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mod    | Davranış                                                                                         |
    | ------ | ------------------------------------------------------------------------------------------------ |
    | `auto` | Etkin bir iş parçacığında: o iş parçacığını bağla. İş parçacığı dışında: destekleniyorsa alt iş parçacığı oluştur/bağla. |
    | `here` | Geçerli etkin iş parçacığını gerektirir; içinde değilse başarısız olur.                          |
    | `off`  | Bağlama yok. Oturum bağlanmamış başlar.                                                          |

    Notlar:

    - İş parçacığı bağlamayan yüzeylerde varsayılan davranış fiilen `off` olur.
    - İş parçacığına bağlı spawn, kanal ilkesi desteği gerektirir:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Alt iş parçacığı oluşturmadan geçerli konuşmayı sabitlemek istediğinizde `--bind here` kullanın.

  </Tab>
</Tabs>

## Teslim modeli

ACP oturumları etkileşimli çalışma alanları veya üst tarafından sahiplenilen
arka plan işleri olabilir. Teslim yolu bu yapıya bağlıdır.

<AccordionGroup>
  <Accordion title="Etkileşimli ACP oturumları">
    Etkileşimli oturumlar, görünür bir sohbet yüzeyinde konuşmayı sürdürmek
    için tasarlanmıştır:

    - `/acp spawn ... --bind here`, geçerli konuşmayı ACP oturumuna bağlar.
    - `/acp spawn ... --thread ...`, bir kanal iş parçacığını/konusunu ACP oturumuna bağlar.
    - Kalıcı yapılandırılmış `bindings[].type="acp"`, eşleşen konuşmaları aynı ACP oturumuna yönlendirir.

    Bağlı konuşmadaki takip mesajları doğrudan ACP oturumuna yönlendirilir
    ve ACP çıktısı aynı kanala/iş parçacığına/konuya geri teslim edilir.

    OpenClaw'un çalışma düzeneğine gönderdiği şeyler:

    - Normal bağlı takipler, çalışma düzeneği/backend desteklediğinde yalnızca eklerle birlikte istem metni olarak gönderilir.
    - `/acp` yönetim komutları ve yerel Gateway komutları, ACP gönderiminden önce yakalanır.
    - Runtime tarafından oluşturulan tamamlama olayları hedef başına somutlaştırılır. OpenClaw ajanları OpenClaw'un dahili runtime bağlam zarfını alır; harici ACP çalışma düzenekleri alt sonuç ve talimat içeren düz bir istem alır. Ham `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` zarfı harici çalışma düzeneklerine asla gönderilmemeli veya ACP kullanıcı transkript metni olarak kalıcılaştırılmamalıdır.
    - ACP transkript girdileri, kullanıcıya görünen tetikleyici metni veya düz tamamlama istemini kullanır. Dahili olay meta verileri mümkün olduğunda OpenClaw içinde yapılandırılmış kalır ve kullanıcı tarafından yazılmış sohbet içeriği olarak ele alınmaz.

  </Accordion>
  <Accordion title="Üst tarafından sahiplenilen tek seferlik ACP oturumları">
    Başka bir ajan çalıştırması tarafından spawn edilen tek seferlik ACP
    oturumları, alt ajanlara benzer şekilde arka plan alt işleridir:

    - Üst, `sessions_spawn({ runtime: "acp", mode: "run" })` ile iş ister.
    - Alt, kendi ACP çalışma düzeneği oturumunda çalışır.
    - Alt dönüşler, yerel alt ajan spawn'ları tarafından kullanılan aynı arka plan hattında çalışır; bu nedenle yavaş bir ACP çalışma düzeneği ilgisiz ana oturum işini engellemez.
    - Tamamlama, görev tamamlama duyuru yolu üzerinden geri bildirilir. OpenClaw, harici bir çalışma düzeneğine göndermeden önce dahili tamamlama meta verilerini düz bir ACP istemine dönüştürür; böylece çalışma düzenekleri yalnızca OpenClaw'a ait runtime bağlam işaretleyicilerini görmez.
    - Üst, kullanıcıya dönük bir yanıt yararlı olduğunda alt sonucu normal asistan sesiyle yeniden yazar.

    Bu yolu üst ve alt arasında eşler arası sohbet olarak ele **almayın**.
    Altın zaten üste geri dönen bir tamamlama kanalı vardır.

  </Accordion>
  <Accordion title="sessions_send ve A2A teslimi">
    `sessions_send`, spawn sonrasında başka bir oturumu hedefleyebilir.
    Normal eş oturumları için OpenClaw, mesajı enjekte ettikten sonra
    ajandan ajana (A2A) takip yolunu kullanır:

    - Hedef oturumun yanıtını bekle.
    - İsteğe bağlı olarak istekte bulunanın ve hedefin sınırlı sayıda takip dönüşü alışverişi yapmasına izin ver.
    - Hedeften bir duyuru mesajı üretmesini iste.
    - Bu duyuruyu görünür kanala veya iş parçacığına teslim et.

    Bu A2A yolu, gönderenin görünür bir takibe ihtiyaç duyduğu eş gönderimleri
    için bir yedektir. İlgisiz bir oturum bir ACP hedefini görebildiğinde ve
    ona mesaj gönderebildiğinde, örneğin geniş `tools.sessions.visibility`
    ayarları altında, etkin kalır.

    OpenClaw, A2A takibini yalnızca istekte bulunan kendi üst tarafından
    sahiplenilen tek seferlik ACP altının üstü olduğunda atlar. Bu durumda,
    görev tamamlamanın üzerine A2A çalıştırmak üstü altın sonucuyla
    uyandırabilir, üstün yanıtını alta geri iletebilir ve bir üst/alt yankı
    döngüsü oluşturabilir. `sessions_send` sonucu, tamamlama yolu sonuçtan
    zaten sorumlu olduğu için bu sahiplenilen-alt durumda
    `delivery.status="skipped"` bildirir.

  </Accordion>
  <Accordion title="Mevcut bir oturumu sürdür">
    Baştan başlamak yerine önceki bir ACP oturumunu devam ettirmek için
    `resumeSessionId` kullanın. Ajan, konuşma geçmişini `session/load`
    aracılığıyla yeniden oynatır; böylece önceki bağlamın tamamıyla devam eder.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Yaygın kullanım durumları:

    - Codex oturumunu dizüstü bilgisayarınızdan telefonunuza devredin - ajanınıza kaldığınız yerden devam etmesini söyleyin.
    - CLI'de etkileşimli olarak başlattığınız bir kodlama oturumunu artık ajanınız üzerinden başsız olarak sürdürün.
    - Gateway yeniden başlatması veya boşta kalma zaman aşımı nedeniyle kesintiye uğrayan işi devam ettirin.

    Notlar:

    - `resumeSessionId` yalnızca `runtime: "acp"` olduğunda geçerlidir; varsayılan alt ajan runtime'ı bu yalnızca ACP alanını yok sayar.
    - `streamTo` yalnızca `runtime: "acp"` olduğunda geçerlidir; varsayılan alt ajan runtime'ı bu yalnızca ACP alanını yok sayar.
    - `resumeSessionId`, OpenClaw kanal oturum anahtarı değil, ana makineye yerel bir ACP/çalışma düzeneği sürdürme kimliğidir; OpenClaw gönderimden önce ACP spawn ilkesini ve hedef ajan ilkesini yine denetler, ancak bu upstream kimliğini yükleme yetkilendirmesi ACP backend'ine veya çalışma düzeneğine aittir.
    - `resumeSessionId` upstream ACP konuşma geçmişini geri yükler; `thread` ve `mode`, oluşturduğunuz yeni OpenClaw oturumuna yine normal şekilde uygulanır; bu nedenle `mode: "session"` yine `thread: true` gerektirir.
    - Hedef ajan `session/load` desteklemelidir (Codex ve Claude Code destekler).
    - Oturum kimliği bulunamazsa spawn açık bir hatayla başarısız olur - yeni bir oturuma sessiz geri dönüş yoktur.

  </Accordion>
  <Accordion title="Dağıtım sonrası duman testi">
    Bir gateway dağıtımından sonra birim testlerine güvenmek yerine canlı
    uçtan uca denetim çalıştırın:

    1. Hedef ana makinede dağıtılan gateway sürümünü ve commit'i doğrulayın.
    2. Canlı bir ajana geçici bir ACPX köprü oturumu açın.
    3. Bu ajandan `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` ve `Reply with exactly LIVE-ACP-SPAWN-OK` göreviyle `sessions_spawn` çağırmasını isteyin.
    4. `accepted=yes`, gerçek bir `childSessionKey` ve doğrulayıcı hatası olmadığını doğrulayın.
    5. Geçici köprü oturumunu temizleyin.

    Kapıyı `mode: "run"` üzerinde tutun ve `streamTo: "parent"` öğesini atlayın -
    iş parçacığına bağlı `mode: "session"` ve akış aktarma yolları ayrı,
    daha zengin entegrasyon geçişleridir.

  </Accordion>
</AccordionGroup>

## Sandbox uyumluluğu

ACP oturumları şu anda OpenClaw sandbox'ı içinde **değil**, ana makine
runtime'ında çalışır.

<Warning>
**Güvenlik sınırı:**

- Harici çalıştırma düzeneği, kendi CLI izinlerine ve seçilen `cwd` değerine göre okuma/yazma yapabilir.
- OpenClaw'ın korumalı alan ilkesi, ACP çalıştırma düzeneği yürütmesini **sarmalamaz**.
- OpenClaw yine de ACP özellik kapılarını, izin verilen ajanları, oturum sahipliğini, kanal bağlamalarını ve Gateway teslim ilkesini uygular.
- Korumalı alan uygulanan OpenClaw'a özgü işler için `runtime: "subagent"` kullanın.

</Warning>

Geçerli sınırlamalar:

- İstek yapan oturum korumalı alandaysa, ACP başlatmaları hem `sessions_spawn({ runtime: "acp" })` hem de `/acp spawn` için engellenir.
- `runtime: "acp"` ile `sessions_spawn`, `sandbox: "require"` desteği sunmaz.

## Oturum hedefi çözümleme

Çoğu `/acp` eylemi isteğe bağlı bir oturum hedefini (`session-key`,
`session-id` veya `session-label`) kabul eder.

**Çözümleme sırası:**

1. Açık hedef bağımsız değişkeni (veya `/acp steer` için `--session`)
   - anahtarı dener
   - ardından UUID biçimli oturum kimliğini dener
   - ardından etiketi dener
2. Geçerli iş parçacığı bağlaması (bu konuşma/iş parçacığı bir ACP oturumuna bağlıysa).
3. Geçerli istek yapan oturum yedeği.

Geçerli konuşma bağlamaları ve iş parçacığı bağlamaları ikisi de
2. adıma katılır.

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
| `/acp permissions`   | Onay ilkesi profilini ayarlar.                            | `/acp permissions strict`                                     |
| `/acp timeout`       | Çalışma zamanı zaman aşımını (saniye) ayarlar.            | `/acp timeout 120`                                            |
| `/acp model`         | Çalışma zamanı model geçersiz kılmasını ayarlar.          | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Oturum çalışma zamanı seçeneği geçersiz kılmalarını kaldırır. | `/acp reset-options`                                          |
| `/acp sessions`      | Depodan son ACP oturumlarını listeler.                    | `/acp sessions`                                               |
| `/acp doctor`        | Arka uç sağlığı, yetenekler, uygulanabilir düzeltmeler.   | `/acp doctor`                                                 |
| `/acp install`       | Belirlenimci kurulum ve etkinleştirme adımlarını yazdırır. | `/acp install`                                                |

`/acp status`, geçerli çalışma zamanı seçeneklerinin yanı sıra çalışma zamanı düzeyi ve
arka uç düzeyi oturum tanımlayıcılarını gösterir. Bir arka uçta bir yetenek eksik olduğunda
desteklenmeyen denetim hataları net biçimde görünür. `/acp sessions`,
geçerli bağlı oturum veya istek yapan oturum için depoyu okur; hedef belirteçleri
(`session-key`, `session-id` veya `session-label`), ajan başına özel `session.store`
kökleri dahil olmak üzere Gateway oturum keşfi üzerinden çözümlenir.

### Çalışma zamanı seçenekleri eşlemesi

`/acp`, kolaylık komutlarına ve genel bir ayarlayıcıya sahiptir. Eşdeğer
işlemler:

| Komut                        | Şuna eşlenir                         | Notlar                                                                                                                                                                         |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | çalışma zamanı yapılandırma anahtarı `model` | Codex ACP için OpenClaw, `openai-codex/<model>` değerini bağdaştırıcı model kimliğine normalleştirir ve `openai-codex/gpt-5.4/high` gibi eğik çizgili akıl yürütme soneklerini `reasoning_effort` değerine eşler. |
| `/acp set thinking <level>`  | çalışma zamanı yapılandırma anahtarı `thinking` | Codex ACP için OpenClaw, bağdaştırıcının desteklediği yerde karşılık gelen `reasoning_effort` değerini gönderir.                                                               |
| `/acp permissions <profile>` | çalışma zamanı yapılandırma anahtarı `approval_policy` | -                                                                                                                                                                              |
| `/acp timeout <seconds>`     | çalışma zamanı yapılandırma anahtarı `timeout` | -                                                                                                                                                                              |
| `/acp cwd <path>`            | çalışma zamanı cwd geçersiz kılması  | Doğrudan güncelleme.                                                                                                                                                          |
| `/acp set <key> <value>`     | genel                                | `key=cwd`, cwd geçersiz kılma yolunu kullanır.                                                                                                                                 |
| `/acp reset-options`         | tüm çalışma zamanı geçersiz kılmalarını temizler | -                                                                                                                                                                              |

## acpx çalıştırma düzeneği, Plugin kurulumu ve izinler

acpx çalıştırma düzeneği yapılandırması (Claude Code / Codex / Gemini CLI
takma adları), plugin-tools ve OpenClaw-tools MCP köprüleri ve ACP
izin modları için bkz.
[ACP ajanları - kurulum](/tr/tools/acp-agents-setup).

## Sorun giderme

| Belirti                                                                     | Olası neden                                                                                                            | Düzeltme                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Arka uç Plugin eksik, devre dışı veya `plugins.allow` tarafından engellenmiş.                                                       | Arka uç Plugin'i kurup etkinleştirin, izin listesi ayarlandıysa `plugins.allow` içine `acpx` ekleyin, ardından `/acp doctor` çalıştırın.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP genel olarak devre dışı.                                                                                                 | `acp.enabled=true` olarak ayarlayın.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Normal iş parçacığı iletilerinden otomatik yönlendirme devre dışı.                                                               | Otomatik iş parçacığı yönlendirmesini sürdürmek için `acp.dispatch.enabled=true` olarak ayarlayın; açık `sessions_spawn({ runtime: "acp" })` çağrıları yine de çalışır.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Aracı izin listesinde değil.                                                                                                | İzin verilen `agentId` kullanın veya `acp.allowedAgents` değerini güncelleyin.                                                                                                                     |
| `/acp doctor` reports backend not ready right after startup                 | Arka uç Plugin eksik, devre dışı, izin/reddetme ilkesi tarafından engellenmiş veya yapılandırılmış çalıştırılabilir dosyası kullanılamıyor.        | Arka uç Plugin'i kurun/etkinleştirin, `/acp doctor` komutunu yeniden çalıştırın ve sağlıksız kalırsa arka uç kurulumunu veya ilke hatasını inceleyin.                                           |
| Harness komutu bulunamadı                                                   | Adaptör CLI kurulu değil, harici Plugin eksik veya ilk çalıştırmada `npx` getirme işlemi Codex dışı bir adaptör için başarısız oldu. | `/acp doctor` çalıştırın, adaptörü Gateway ana makinesine kurun/önceden ısıtın veya acpx aracı komutunu açıkça yapılandırın.                                                      |
| Çalıştırma düzeneğinden model bulunamadı                                            | Model kimliği başka bir sağlayıcı/çalıştırma düzeneği için geçerli, ancak bu ACP hedefi için değil.                                                | Bu çalıştırma düzeneği tarafından listelenen bir model kullanın, modeli çalıştırma düzeneğinde yapılandırın veya geçersiz kılmayı atlayın.                                                                            |
| Çalıştırma düzeneğinden satıcı kimlik doğrulama hatası                                          | OpenClaw sağlıklı, ancak hedef CLI/sağlayıcı oturum açmamış.                                                     | Gateway ana makine ortamında oturum açın veya gerekli sağlayıcı anahtarını sağlayın.                                                                                             |
| `Unable to resolve session target: ...`                                     | Hatalı anahtar/kimlik/etiket belirteci.                                                                                                | `/acp sessions` çalıştırın, tam anahtarı/etiketi kopyalayın, yeniden deneyin.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here`, etkin bağlanabilir bir konuşma olmadan kullanıldı.                                                            | Hedef sohbete/kanala geçip yeniden deneyin veya bağlanmamış spawn kullanın.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Adaptörde mevcut konuşma ACP bağlama yeteneği yok.                                                             | Destekleniyorsa `/acp spawn ... --thread ...` kullanın, üst düzey `bindings[]` yapılandırın veya desteklenen bir kanala geçin.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here`, iş parçacığı bağlamı dışında kullanıldı.                                                                         | Hedef iş parçacığına geçin veya `--thread auto`/`off` kullanın.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Etkin bağlama hedefinin sahibi başka bir kullanıcı.                                                                           | Sahip olarak yeniden bağlayın veya farklı bir konuşma ya da iş parçacığı kullanın.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | Adaptörde iş parçacığı bağlama yeteneği yok.                                                                               | `--thread off` kullanın veya desteklenen adaptöre/kanala geçin.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP çalışma zamanı ana makine tarafındadır; istekte bulunan oturum sandbox içindedir.                                                              | Sandbox içindeki oturumlardan `runtime="subagent"` kullanın veya ACP spawn'ı sandbox içinde olmayan bir oturumdan çalıştırın.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP çalışma zamanı için `sandbox="require"` istendi.                                                                         | Gerekli sandbox kullanımı için `runtime="subagent"` kullanın veya sandbox içinde olmayan bir oturumdan `sandbox="inherit"` ile ACP kullanın.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | Hedef çalıştırma düzeneği genel ACP model değiştirmeyi sunmuyor.                                                        | ACP `models`/`session/set_model` duyuran bir çalıştırma düzeneği kullanın, Codex ACP model referanslarını kullanın veya kendi başlangıç bayrağı varsa modeli doğrudan çalıştırma düzeneğinde yapılandırın. |
| Bağlı oturum için ACP meta verileri eksik                                      | Eski/silinmiş ACP oturum meta verileri.                                                                                    | `/acp spawn` ile yeniden oluşturun, ardından iş parçacığını yeniden bağlayın/odaklayın.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode`, etkileşimsiz ACP oturumunda yazma/çalıştırma işlemlerini engelliyor.                                                    | `plugins.entries.acpx.config.permissionMode` değerini `approve-all` olarak ayarlayın ve Gateway'i yeniden başlatın. Bkz. [İzin yapılandırması](/tr/tools/acp-agents-setup#permission-configuration). |
| ACP oturumu az çıktı ile erken başarısız oluyor                                  | İzin istemleri `permissionMode`/`nonInteractivePermissions` tarafından engelleniyor.                                        | Gateway günlüklerinde `AcpRuntimeError` olup olmadığını kontrol edin. Tam izinler için `permissionMode=approve-all`; kontrollü işlev azalması için `nonInteractivePermissions=deny` ayarlayın.        |
| ACP oturumu işi tamamladıktan sonra süresiz takılıyor                       | Çalıştırma düzeneği işlemi bitti ancak ACP oturumu tamamlandığını bildirmedi.                                                    | `ps aux \| grep acpx` ile izleyin; eski işlemleri elle sonlandırın.                                                                                                       |
| Çalıştırma düzeneği `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` görüyor                        | Dahili olay zarfı ACP sınırından sızdı.                                                                | OpenClaw'ı güncelleyin ve tamamlama akışını yeniden çalıştırın; harici çalıştırma düzenekleri yalnızca düz tamamlama istemleri almalıdır.                                                          |

## İlgili

- [ACP aracıları - kurulum](/tr/tools/acp-agents-setup)
- [Aracı gönderimi](/tr/tools/agent-send)
- [CLI Arka Uçları](/tr/gateway/cli-backends)
- [Codex çalıştırma düzeneği](/tr/plugins/codex-harness)
- [Çok aracılı sandbox araçları](/tr/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (köprü modu)](/tr/cli/acp)
- [Alt aracılar](/tr/tools/subagents)
