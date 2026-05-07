---
read_when:
    - Kodlama harness'larını ACP üzerinden çalıştırma
    - Mesajlaşma kanallarında konuşmaya bağlı ACP oturumlarını ayarlama
    - Bir mesaj kanalı konuşmasını kalıcı bir ACP oturumuna bağlama
    - ACP arka ucu, Plugin bağlantılandırması veya tamamlama teslimiyle ilgili sorun giderme
    - Sohbetten /acp komutlarını çalıştırma
sidebarTitle: ACP agents
summary: Harici kodlama araçlarını (Claude Code, Cursor, Gemini CLI, açık Codex ACP, OpenClaw ACP, OpenCode) ACP arka ucu üzerinden çalıştırın
title: ACP ajanları
x-i18n:
    generated_at: "2026-05-07T13:27:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5cdb853d2cec2c7466fff5f1e046b38bf9bac8b2b62f208ad3465a666272631
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) oturumları
OpenClaw'ın harici kodlama çalıştırıcılarını (örneğin Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI ve diğer
desteklenen ACPX çalıştırıcıları) bir ACP arka uç Plugin'i üzerinden çalıştırmasını sağlar.

Her ACP oturumu başlatması bir [arka plan görevi](/tr/automation/tasks) olarak izlenir.

<Note>
**ACP varsayılan Codex yolu değil, harici çalıştırıcı yoludur.** Yerel
Codex app-server Plugin'i `/codex ...` kontrollerinin ve
`agentRuntime.id: "codex"` gömülü çalışma zamanının sahibidir; ACP ise
`/acp ...` kontrollerinin ve `sessions_spawn({ runtime: "acp" })` oturumlarının sahibidir.

Codex veya Claude Code'un mevcut OpenClaw kanal konuşmalarına
doğrudan harici MCP istemcisi olarak bağlanmasını istiyorsanız ACP yerine
[`openclaw mcp serve`](/tr/cli/mcp) kullanın.
</Note>

## Hangi sayfayı istiyorum?

| Şunu yapmak istiyorsunuz…                                                                       | Bunu kullanın                         | Notlar                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Geçerli konuşmada Codex'i bağlamak veya kontrol etmek                                           | `/codex bind`, `/codex threads`       | `codex` Plugin'i etkinken yerel Codex app-server yolu; bağlı sohbet yanıtları, görüntü iletme, model/hızlı/izinler, durdurma ve yönlendirme kontrollerini içerir. ACP açık bir geri dönüş yoludur |
| Claude Code, Gemini CLI, açık Codex ACP veya başka bir harici çalıştırıcıyı OpenClaw _üzerinden_ çalıştırmak | Bu sayfa                              | Sohbete bağlı oturumlar, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, arka plan görevleri, çalışma zamanı kontrolleri                                                                  |
| Bir OpenClaw Gateway oturumunu bir düzenleyici veya istemci için ACP sunucusu _olarak_ sunmak   | [`openclaw acp`](/tr/cli/acp)            | Köprü modu. IDE/istemci stdio/WebSocket üzerinden OpenClaw ile ACP konuşur                                                                                                                    |
| Yerel bir AI CLI'ı yalnızca metin geri dönüş modeli olarak yeniden kullanmak                    | [CLI Arka Uçları](/tr/gateway/cli-backends) | ACP değildir. OpenClaw araçları yok, ACP kontrolleri yok, çalıştırıcı çalışma zamanı yok                                                                                                      |

## Bu kutudan çıktığı gibi çalışır mı?

Evet, resmi ACP çalışma zamanı Plugin'i yüklendikten sonra:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Kaynak checkout'ları, `pnpm install` sonrasında yerel `extensions/acpx` çalışma alanı Plugin'ini kullanabilir.
Hazırlık denetimi için `/acp doctor` çalıştırın.

OpenClaw ajanlara ACP başlatmayı yalnızca ACP **gerçekten kullanılabilir**
olduğunda öğretir: ACP etkin olmalı, dağıtım devre dışı olmamalı, geçerli
oturum sandbox tarafından engellenmemeli ve bir çalışma zamanı arka ucu
yüklenmiş olmalıdır. Bu koşullar karşılanmazsa ACP Plugin Skills ve
`sessions_spawn` ACP yönlendirmesi gizli kalır; böylece ajan kullanılamayan
bir arka uç önermemiş olur.

<AccordionGroup>
  <Accordion title="İlk çalıştırmada dikkat edilecekler">
    - `plugins.allow` ayarlanmışsa bu kısıtlayıcı bir Plugin envanteridir ve **mutlaka** `acpx` içermelidir; aksi halde yüklü ACP arka ucu bilerek engellenir ve `/acp doctor` eksik izin listesi girdisini bildirir.
    - Codex ACP adaptörü `acpx` Plugin'i ile hazırlanır ve mümkün olduğunda yerel olarak başlatılır.
    - Codex ACP izole bir `CODEX_HOME` ile çalışır; OpenClaw ana makine Codex yapılandırmasından yalnızca güvenilir proje girdilerini kopyalar ve etkin çalışma alanına güvenir, kimlik doğrulama, bildirimler ve hook'lar ana makine yapılandırmasında kalır.
    - Diğer hedef çalıştırıcı adaptörleri, ilk kullanımınızda hâlâ isteğe bağlı olarak `npx` ile getirilebilir.
    - Tedarikçi kimlik doğrulaması yine de o çalıştırıcı için ana makinede mevcut olmalıdır.
    - Ana makinede npm veya ağ erişimi yoksa, önbellekler önceden ısıtılana veya adaptör başka bir yolla yüklenene kadar ilk çalıştırma adaptör getirmeleri başarısız olur.

  </Accordion>
  <Accordion title="Çalışma zamanı önkoşulları">
    ACP gerçek bir harici çalıştırıcı süreci başlatır. OpenClaw yönlendirme,
    arka plan görevi durumu, teslim, bağlamalar ve politikanın sahibidir;
    çalıştırıcı ise kendi sağlayıcı oturum açma işleminin, model kataloğunun,
    dosya sistemi davranışının ve yerel araçlarının sahibidir.

    OpenClaw'ı suçlamadan önce şunları doğrulayın:

    - `/acp doctor` etkin ve sağlıklı bir arka uç bildiriyor.
    - Bu izin listesi ayarlandığında hedef kimliğe `acp.allowedAgents` tarafından izin veriliyor.
    - Çalıştırıcı komutu Gateway ana makinesinde başlayabiliyor.
    - Sağlayıcı kimlik doğrulaması o çalıştırıcı için mevcut (`claude`, `codex`, `gemini`, `opencode`, `droid` vb.).
    - Seçilen model o çalıştırıcı için mevcut; model kimlikleri çalıştırıcılar arasında taşınabilir değildir.
    - İstenen `cwd` mevcut ve erişilebilir, ya da `cwd` değerini atlayıp arka ucun varsayılanını kullanmasına izin verin.
    - İzin modu işle eşleşiyor. Etkileşimsiz oturumlar yerel izin istemlerine tıklayamaz, bu nedenle yazma/çalıştırma ağırlıklı kodlama çalıştırmaları genellikle başsız devam edebilen bir ACPX izin profiline ihtiyaç duyar.

  </Accordion>
</AccordionGroup>

OpenClaw Plugin araçları ve yerleşik OpenClaw araçları varsayılan olarak
ACP çalıştırıcılarına sunulmaz. Çalıştırıcının bu araçları doğrudan çağırması
gerekiyorsa açık MCP köprülerini yalnızca
[ACP ajanları - kurulum](/tr/tools/acp-agents-setup) içinde etkinleştirin.

## Desteklenen çalıştırıcı hedefleri

`acpx` arka ucu ile bu çalıştırıcı kimliklerini `/acp spawn <id>`
veya `sessions_spawn({ runtime: "acp", agentId: "<id>" })` hedefleri olarak kullanın:

| Çalıştırıcı kimliği | Tipik arka uç                                | Notlar                                                                              |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP adaptörü                       | Ana makinede Claude Code kimlik doğrulaması gerektirir.                             |
| `codex`    | Codex ACP adaptörü                             | Yerel `/codex` kullanılamadığında veya ACP istendiğinde yalnızca açık ACP geri dönüşü. |
| `copilot`  | GitHub Copilot ACP adaptörü                    | Copilot CLI/çalışma zamanı kimlik doğrulaması gerektirir.                           |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Yerel bir kurulum farklı bir ACP giriş noktası sunuyorsa acpx komutunu geçersiz kılın. |
| `droid`    | Factory Droid CLI                              | Çalıştırıcı ortamında Factory/Droid kimlik doğrulaması veya `FACTORY_API_KEY` gerektirir. |
| `gemini`   | Gemini CLI ACP adaptörü                        | Gemini CLI kimlik doğrulaması veya API anahtarı kurulumu gerektirir.                |
| `iflow`    | iFlow CLI                                      | Adaptör kullanılabilirliği ve model kontrolü yüklü CLI'a bağlıdır.                  |
| `kilocode` | Kilo Code CLI                                  | Adaptör kullanılabilirliği ve model kontrolü yüklü CLI'a bağlıdır.                  |
| `kimi`     | Kimi/Moonshot CLI                              | Ana makinede Kimi/Moonshot kimlik doğrulaması gerektirir.                           |
| `kiro`     | Kiro CLI                                       | Adaptör kullanılabilirliği ve model kontrolü yüklü CLI'a bağlıdır.                  |
| `opencode` | OpenCode ACP adaptörü                          | OpenCode CLI/sağlayıcı kimlik doğrulaması gerektirir.                               |
| `openclaw` | `openclaw acp` üzerinden OpenClaw Gateway köprüsü | ACP uyumlu bir çalıştırıcının bir OpenClaw Gateway oturumuna geri konuşmasını sağlar. |
| `pi`       | Pi/gömülü OpenClaw çalışma zamanı              | OpenClaw'a özgü çalıştırıcı deneyleri için kullanılır.                              |
| `qwen`     | Qwen Code / Qwen CLI                           | Ana makinede Qwen uyumlu kimlik doğrulaması gerektirir.                             |

Özel acpx ajan takma adları acpx içinde yapılandırılabilir, ancak OpenClaw
politikası dağıtımdan önce yine de `acp.allowedAgents` değerini ve tüm
`agents.list[].runtime.acp.agent` eşlemelerini denetler.

## Operatör runbook'u

Sohbetten hızlı `/acp` akışı:

<Steps>
  <Step title="Başlat">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` veya açık
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Çalış">
    Bağlı konuşmada veya ileti dizisinde devam edin (ya da oturum
    anahtarını açıkça hedefleyin).
  </Step>
  <Step title="Durumu kontrol et">
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
    - Üst sahipli ACP oturumları, çalışma zamanı oturumu kalıcı olsa bile arka plan işi olarak ele alınır; tamamlanma ve yüzeyler arası teslim, normal kullanıcıya yönelik sohbet oturumu gibi davranmak yerine üst görev bildiricisi üzerinden gider.
    - Görev bakımı, terminal veya sahipsiz üst sahipli tek kullanımlık ACP oturumlarını kapatır. Kalıcı ACP oturumları etkin bir konuşma bağlaması kaldığı sürece korunur; etkin bağlaması olmayan eski kalıcı oturumlar kapatılır, böylece sahip görev bittikten veya görev kaydı gittikten sonra sessizce sürdürülemezler.
    - Bağlı takip mesajları, bağlama kapatılana, odak dışı bırakılana, sıfırlanana veya süresi dolana kadar doğrudan ACP oturumuna gider.
    - Gateway komutları yerel kalır. `/acp ...`, `/status` ve `/unfocus` hiçbir zaman bağlı bir ACP çalıştırıcısına normal istem metni olarak gönderilmez.
    - `cancel`, arka uç iptali desteklediğinde etkin turu iptal eder; bağlamayı veya oturum meta verilerini silmez.
    - `close`, ACP oturumunu OpenClaw açısından sonlandırır ve bağlamayı kaldırır. Bir çalıştırıcı, sürdürmeyi destekliyorsa kendi yukarı akış geçmişini hâlâ tutabilir.
    - acpx Plugin'i, `close` sonrasında OpenClaw'a ait sarmalayıcı ve adaptör süreç ağaçlarını temizler ve Gateway başlatılırken eski OpenClaw'a ait ACPX yetimlerini toplar.
    - Boştaki çalışma zamanı çalışanları `acp.runtime.ttlMinutes` sonrasında temizlenmeye adaydır; depolanmış oturum meta verileri `/acp sessions` için kullanılabilir kalır.

  </Accordion>
  <Accordion title="Yerel Codex yönlendirme kuralları">
    Etkin olduğunda **yerel Codex Plugin'ine** yönlendirilmesi gereken
    doğal dil tetikleyicileri:

    - "Bu Discord kanalını Codex'e bağla."
    - "Bu sohbeti Codex ileti dizisi `<id>` öğesine ekle."
    - "Codex ileti dizilerini göster, sonra bunu bağla."

    Native Codex konuşma bağlama, varsayılan sohbet denetimi yoludur.
    OpenClaw dinamik araçları yine OpenClaw üzerinden yürütülürken,
    shell/apply-patch gibi Codex'e özgü araçlar Codex içinde yürütülür.
    Codex'e özgü araç olayları için OpenClaw, Plugin hook'larının `before_tool_call` öğesini engelleyebilmesi, `after_tool_call` öğesini gözlemleyebilmesi ve Codex `PermissionRequest` olaylarını
    OpenClaw onayları üzerinden yönlendirebilmesi için her turda yerel bir
    hook aktarıcısı enjekte eder. Codex `Stop` hook'ları
    OpenClaw `before_agent_finalize` öğesine aktarılır; burada Plugin'ler, Codex yanıtını sonlandırmadan önce bir model geçişi daha isteyebilir. Aktarıcı bilinçli olarak tutucu kalır:
    Codex'e özgü araç argümanlarını değiştirmez veya Codex thread kayıtlarını yeniden yazmaz. ACP'yi yalnızca
    ACP runtime/session modelini istediğinizde açıkça kullanın. Gömülü Codex
    destek sınırı
    [Codex harness v1 destek sözleşmesi](/tr/plugins/codex-harness#v1-support-contract) içinde belgelenmiştir.

  </Accordion>
  <Accordion title="Model / provider / runtime seçimi hızlı başvuru tablosu">
    - `openai-codex/*` - doctor tarafından onarılan eski Codex OAuth/abonelik model yolu.
    - `openai/*` - OpenAI agent turları için yerel Codex app-server gömülü runtime.
    - `/codex ...` - yerel Codex konuşma denetimi.
    - `/acp ...` veya `runtime: "acp"` - açık ACP/acpx denetimi.

  </Accordion>
  <Accordion title="ACP yönlendirmeli doğal dil tetikleyicileri">
    ACP runtime'a yönlendirilmesi gereken tetikleyiciler:

    - "Bunu tek seferlik Claude Code ACP session olarak çalıştır ve sonucu özetle."
    - "Bu görev için Gemini CLI'yi bir thread içinde kullan, sonra takipleri aynı thread içinde tut."
    - "Codex'i ACP üzerinden bir arka plan thread'inde çalıştır."

    OpenClaw `runtime: "acp"` seçer, harness `agentId` değerini çözümler,
    desteklendiğinde mevcut konuşmaya veya thread'e bağlanır ve
    kapanma/süre sonuna kadar takipleri bu session'a yönlendirir. Codex bu yolu yalnızca
    ACP/acpx açık olduğunda veya istenen işlem için yerel Codex
    Plugin'i kullanılamadığında izler.

    `sessions_spawn` için `runtime: "acp"` yalnızca ACP
    etkinleştirildiğinde, istekte bulunan sandboxed olmadığında ve bir ACP runtime
    backend'i yüklendiğinde duyurulur. `acp.dispatch.enabled=false` otomatik
    ACP thread dispatch işlemini duraklatır ancak açık
    `sessions_spawn({ runtime: "acp" })` çağrılarını gizlemez veya engellemez. `codex`,
    `claude`, `droid`, `gemini` veya `opencode` gibi ACP harness id'lerini hedefler. Bu giriş
    açıkça `agents.list[].runtime.type="acp"` ile yapılandırılmadıkça `agents_list` içinden normal bir
    OpenClaw config agent id'si geçirmeyin;
    aksi takdirde varsayılan sub-agent runtime'ı kullanın. Bir OpenClaw agent
    `runtime.type="acp"` ile yapılandırıldığında, OpenClaw
    alttaki harness id olarak `runtime.acp.agent` değerini kullanır.

  </Accordion>
</AccordionGroup>

## ACP ve sub-agent'lar

Harici bir harness runtime istediğinizde ACP kullanın. `codex`
Plugin'i etkin olduğunda Codex konuşma bağlama/denetimi için **yerel Codex
app-server** kullanın. OpenClaw'a özgü
devredilmiş çalıştırmalar istediğinizde **sub-agent'lar** kullanın.

| Alan          | ACP session                           | Sub-agent çalıştırması             |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | ACP backend Plugin'i (örneğin acpx)   | OpenClaw yerel sub-agent runtime   |
| Session anahtarı | `agent:<agentId>:acp:<uuid>`       | `agent:<agentId>:subagent:<uuid>`  |
| Ana komutlar  | `/acp ...`                            | `/subagents ...`                   |
| Spawn aracı   | `runtime:"acp"` ile `sessions_spawn`  | `sessions_spawn` (varsayılan runtime) |

Ayrıca bkz. [Sub-agent'lar](/tr/tools/subagents).

## ACP Claude Code'u nasıl çalıştırır

ACP üzerinden Claude Code için stack şöyledir:

1. OpenClaw ACP session denetim düzlemi.
2. Resmi `@openclaw/acpx` runtime Plugin'i.
3. Claude ACP bağdaştırıcısı.
4. Claude tarafı runtime/session mekanizması.

ACP Claude; ACP denetimleri, session sürdürme,
arka plan görev takibi ve isteğe bağlı konuşma/thread bağlama özelliklerine sahip bir **harness session**'dır.

CLI backend'leri ayrı, yalnızca metin tabanlı yerel fallback runtime'lardır - bkz.
[CLI Backend'leri](/tr/gateway/cli-backends).

Operatörler için pratik kural şudur:

- **`/acp spawn`, bağlanabilir session'lar, runtime denetimleri veya kalıcı harness işi mi istiyorsunuz?** ACP kullanın.
- **Ham CLI üzerinden basit yerel metin fallback mi istiyorsunuz?** CLI backend'lerini kullanın.

## Bağlı session'lar

### Zihinsel model

- **Sohbet yüzeyi** - insanların konuşmayı sürdürdüğü yer (Discord kanalı, Telegram konusu, iMessage sohbeti).
- **ACP session** - OpenClaw'ın yönlendirdiği kalıcı Codex/Claude/Gemini runtime durumu.
- **Alt thread/konu** - yalnızca `--thread ...` tarafından oluşturulan isteğe bağlı ek mesajlaşma yüzeyi.
- **Runtime çalışma alanı** - harness'in çalıştığı dosya sistemi konumu (`cwd`, repo checkout, backend çalışma alanı). Sohbet yüzeyinden bağımsızdır.

### Mevcut konuşma bağları

`/acp spawn <harness> --bind here` mevcut konuşmayı
oluşturulan ACP session'a sabitler - alt thread yok, aynı sohbet yüzeyi. OpenClaw
taşıma, kimlik doğrulama, güvenlik ve teslimin sahipliğini sürdürür. Bu
konuşmadaki takip mesajları aynı session'a yönlendirilir; `/new` ve `/reset`
session'ı yerinde sıfırlar; `/acp close` bağlamayı kaldırır.

Örnekler:

```text
/codex bind                                              # yerel Codex bağlaması, gelecekteki mesajları buraya yönlendir
/codex model gpt-5.4                                     # bağlı yerel Codex thread'ini ayarla
/codex stop                                              # etkin yerel Codex turunu denetle
/acp spawn codex --bind here                             # Codex için açık ACP fallback
/acp spawn codex --thread auto                           # alt thread/konu oluşturabilir ve oraya bağlanabilir
/acp spawn codex --bind here --cwd /workspace/repo       # aynı sohbet bağlaması, Codex /workspace/repo içinde çalışır
```

<AccordionGroup>
  <Accordion title="Bağlama kuralları ve münhasırlık">
    - `--bind here` ve `--thread ...` birbirini dışlar.
    - `--bind here` yalnızca mevcut konuşma bağlamayı duyuran kanallarda çalışır; aksi durumda OpenClaw net bir desteklenmiyor mesajı döndürür. Bağlamalar Gateway yeniden başlatmaları arasında kalıcıdır.
    - Discord'da `spawnSessions`, `--thread auto|here` için alt thread oluşturmayı denetler - `--bind here` için değil.
    - `--cwd` olmadan farklı bir ACP agent'a spawn ederseniz OpenClaw varsayılan olarak **hedef agent'ın** çalışma alanını devralır. Eksik devralınan yollar (`ENOENT`/`ENOTDIR`) backend varsayılanına geri döner; diğer erişim hataları (örn. `EACCES`) spawn hataları olarak görünür.
    - Gateway yönetim komutları bağlı konuşmalarda yerel kalır - normal takip metni bağlı ACP session'a yönlendirilse bile `/acp ...` komutları OpenClaw tarafından işlenir; bu yüzey için komut işleme etkin olduğunda `/status` ve `/unfocus` da yerel kalır.

  </Accordion>
  <Accordion title="Thread'e bağlı session'lar">
    Bir kanal bağdaştırıcısı için thread bağlamaları etkinleştirildiğinde:

    - OpenClaw bir thread'i hedef ACP session'a bağlar.
    - Bu thread içindeki takip mesajları bağlı ACP session'a yönlendirilir.
    - ACP çıktısı aynı thread'e geri teslim edilir.
    - Unfocus/kapatma/arşivleme/boşta kalma zaman aşımı veya maksimum yaş süresinin dolması bağlamayı kaldırır.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` ve `/unfocus` Gateway komutlarıdır, ACP harness'e gönderilen prompt'lar değildir.

    Thread'e bağlı ACP için gerekli feature flag'leri:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` varsayılan olarak açıktır (otomatik ACP thread dispatch işlemini duraklatmak için `false` olarak ayarlayın; açık `sessions_spawn({ runtime: "acp" })` çağrıları çalışmaya devam eder).
    - Kanal bağdaştırıcısı thread session spawn'ları etkin (varsayılan: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Thread bağlama desteği bağdaştırıcıya özeldir. Etkin kanal
    bağdaştırıcısı thread bağlamalarını desteklemiyorsa OpenClaw net bir
    desteklenmiyor/kullanılamıyor mesajı döndürür.

  </Accordion>
  <Accordion title="Thread destekleyen kanallar">
    - Session/thread bağlama yeteneğini sunan herhangi bir kanal bağdaştırıcısı.
    - Mevcut yerleşik destek: **Discord** thread'leri/kanalları, **Telegram** konuları (gruplarda/süper gruplarda forum konuları ve DM konuları).
    - Plugin kanalları aynı bağlama arayüzü üzerinden destek ekleyebilir.

  </Accordion>
</AccordionGroup>

## Kalıcı kanal bağlamaları

Geçici olmayan iş akışları için, üst düzey `bindings[]` girdilerinde kalıcı ACP bağlamaları yapılandırın.

### Bağlama modeli

<ParamField path="bindings[].type" type='"acp"'>
  Kalıcı bir ACP konuşma bağlamasını işaretler.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Hedef konuşmayı tanımlar. Kanal başına biçimler:

- **Discord kanalı/thread'i:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram forum konusu:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles DM/grubu:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Kararlı grup bağlamaları için `chat_id:*` veya `chat_identifier:*` tercih edin.
- **iMessage DM/grubu:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Kararlı grup bağlamaları için `chat_id:*` tercih edin.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Sahip OpenClaw agent id'si.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  İsteğe bağlı ACP override'ı.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  İsteğe bağlı operatöre dönük etiket.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  İsteğe bağlı runtime çalışma dizini.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  İsteğe bağlı backend override'ı.
</ParamField>

### Agent başına runtime varsayılanları

Agent başına ACP varsayılanlarını bir kez tanımlamak için `agents.list[].runtime` kullanın:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness id, örn. `codex` veya `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP bağlı session'ları için override önceliği:**

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

- OpenClaw, yapılandırılmış ACP oturumunun kullanılmadan önce mevcut olmasını sağlar.
- Bu kanal veya konudaki mesajlar, yapılandırılmış ACP oturumuna yönlendirilir.
- Bağlı konuşmalarda `/new` ve `/reset`, aynı ACP oturum anahtarını yerinde sıfırlar.
- Geçici çalışma zamanı bağlamaları (örneğin thread-focus akışları tarafından oluşturulanlar) mevcut oldukları yerde uygulanmaya devam eder.
- Açık bir `cwd` olmadan aracı arası ACP başlatmaları için OpenClaw, hedef aracı çalışma alanını aracı yapılandırmasından devralır.
- Eksik devralınan çalışma alanı yolları, arka ucun varsayılan cwd değerine geri döner; eksik olmayan erişim hataları başlatma hataları olarak görünür.

## ACP oturumlarını başlatma

Bir ACP oturumu başlatmanın iki yolu vardır:

<Tabs>
  <Tab title="From sessions_spawn">
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
    `runtime` varsayılan olarak `subagent` değerini alır; bu yüzden ACP
    oturumları için `runtime: "acp"` değerini açıkça ayarlayın. `agentId`
    atlanırsa OpenClaw, yapılandırılmışsa `acp.defaultAgent` kullanır.
    `mode: "session"`, kalıcı bağlı bir konuşmayı korumak için
    `thread: true` gerektirir.
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
  ACP hedef yürütme ortamı kimliği. Ayarlanmışsa `acp.defaultAgent` değerine geri döner.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Desteklendiği yerde ileti dizisi bağlama akışı ister.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` tek seferliktir; `"session"` kalıcıdır. `thread: true` ise ve
  `mode` atlanırsa OpenClaw, çalışma zamanı yoluna göre varsayılan olarak
  kalıcı davranış kullanabilir. `mode: "session"` `thread: true` gerektirir.
</ParamField>
<ParamField path="cwd" type="string">
  İstenen çalışma zamanı çalışma dizini (arka uç/çalışma zamanı
  politikası tarafından doğrulanır). Atlanırsa ACP başlatması,
  yapılandırıldığında hedef aracı çalışma alanını devralır; eksik devralınan
  yollar arka uç varsayılanlarına geri dönerken gerçek erişim hataları döndürülür.
</ParamField>
<ParamField path="label" type="string">
  Oturum/banner metninde kullanılan operatöre dönük etiket.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Yeni bir oturum oluşturmak yerine mevcut bir ACP oturumunu sürdürür. Aracı,
  konuşma geçmişini `session/load` üzerinden yeniden oynatır. `runtime: "acp"`
  gerektirir.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"`, ilk ACP çalıştırma ilerleme özetlerini sistem olayları olarak
  istekte bulunan oturuma geri akıtır. Kabul edilen yanıtlar, tam aktarma
  geçmişi için takip edebileceğiniz oturum kapsamlı bir JSONL günlüğüne
  (`<sessionId>.acp-stream.jsonl`) işaret eden `streamLogPath` içerir.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  ACP alt turunu N saniye sonra iptal eder. `0`, turu Gateway'in zaman aşımı
  olmayan yolunda tutar. Aynı değer Gateway çalıştırmasına ve ACP çalışma
  zamanına uygulanır; böylece takılan/kotası tükenen yürütme ortamları üst
  aracı hattını süresiz olarak meşgul etmez.
</ParamField>
<ParamField path="model" type="string">
  ACP alt oturumu için açık model geçersiz kılması. Codex ACP başlatmaları,
  `openai-codex/gpt-5.4` gibi OpenClaw Codex referanslarını `session/new`
  öncesinde Codex ACP başlangıç yapılandırmasına normalleştirir; 
  `openai-codex/gpt-5.4/high` gibi slash biçimleri ayrıca Codex ACP akıl
  yürütme çabasını ayarlar. Diğer yürütme ortamları ACP `models` duyurmalı
  ve `session/set_model` desteklemelidir; aksi halde OpenClaw/acpx hedef aracı
  varsayılanına sessizce geri dönmek yerine açıkça başarısız olur.
</ParamField>
<ParamField path="thinking" type="string">
  Açık düşünme/akıl yürütme çabası. Codex ACP için `minimal` düşük çabaya
  eşlenir, `low`/`medium`/`high`/`xhigh` doğrudan eşlenir ve `off` akıl
  yürütme çabası başlangıç geçersiz kılmasını atlar.
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
    - `--bind` ve `--thread`, aynı `/acp spawn` çağrısında birlikte kullanılamaz.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mod    | Davranış                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | Etkin bir ileti dizisinde: o ileti dizisini bağlar. İleti dizisi dışında: desteklendiğinde alt ileti dizisi oluşturur/bağlar. |
    | `here` | Geçerli etkin ileti dizisini gerektirir; bir ileti dizisinde değilse başarısız olur.                |
    | `off`  | Bağlama yoktur. Oturum bağlı olmadan başlar.                                                        |

    Notlar:

    - İleti dizisi bağlamayan yüzeylerde varsayılan davranış fiilen `off` olur.
    - İleti dizisine bağlı başlatma, kanal politikası desteği gerektirir:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Alt ileti dizisi oluşturmadan geçerli konuşmayı sabitlemek istediğinizde `--bind here` kullanın.

  </Tab>
</Tabs>

## Teslim modeli

ACP oturumları etkileşimli çalışma alanları veya üst öğeye ait arka plan
işleri olabilir. Teslim yolu bu yapıya bağlıdır.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Etkileşimli oturumlar, görünür bir sohbet yüzeyinde konuşmayı sürdürmek
    için tasarlanmıştır:

    - `/acp spawn ... --bind here`, geçerli konuşmayı ACP oturumuna bağlar.
    - `/acp spawn ... --thread ...`, bir kanal ileti dizisini/konusunu ACP oturumuna bağlar.
    - Kalıcı yapılandırılmış `bindings[].type="acp"`, eşleşen konuşmaları aynı ACP oturumuna yönlendirir.

    Bağlı konuşmadaki takip mesajları doğrudan ACP oturumuna yönlendirilir
    ve ACP çıktısı aynı kanala/ileti dizisine/konuya geri teslim edilir.

    OpenClaw'ın yürütme ortamına gönderdiği şeyler:

    - Normal bağlı takipler, istem metni olarak ve yalnızca yürütme ortamı/arka uç desteklediğinde eklerle birlikte gönderilir.
    - `/acp` yönetim komutları ve yerel Gateway komutları, ACP gönderiminden önce yakalanır.
    - Çalışma zamanı tarafından üretilen tamamlanma olayları hedefe göre somutlaştırılır. OpenClaw aracıları, OpenClaw'ın dahili çalışma zamanı bağlam zarfını alır; harici ACP yürütme ortamları alt sonuç ve talimat içeren düz bir istem alır. Ham `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` zarfı harici yürütme ortamlarına asla gönderilmemeli veya ACP kullanıcı transkripti metni olarak kalıcılaştırılmamalıdır.
    - ACP transkript girdileri, kullanıcıya görünen tetikleyici metni veya düz tamamlanma istemini kullanır. Dahili olay meta verileri mümkün olduğunda OpenClaw içinde yapılandırılmış kalır ve kullanıcı tarafından yazılmış sohbet içeriği olarak ele alınmaz.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Başka bir aracı çalıştırması tarafından başlatılan tek seferlik ACP
    oturumları, alt aracılara benzer şekilde arka plan alt öğeleridir:

    - Üst öğe `sessions_spawn({ runtime: "acp", mode: "run" })` ile iş ister.
    - Alt öğe kendi ACP yürütme ortamı oturumunda çalışır.
    - Alt turlar, yerel alt aracı başlatmaları tarafından kullanılan aynı arka plan hattında çalışır; bu nedenle yavaş bir ACP yürütme ortamı ilgisiz ana oturum işini engellemez.
    - Tamamlanma, görev tamamlama duyuru yolu üzerinden geri raporlanır. OpenClaw, harici bir yürütme ortamına göndermeden önce dahili tamamlanma meta verilerini düz bir ACP istemine dönüştürür; böylece yürütme ortamları yalnızca OpenClaw'a özgü çalışma zamanı bağlam işaretleyicilerini görmez.
    - Kullanıcıya dönük bir yanıt yararlı olduğunda üst öğe alt sonucu normal asistan sesiyle yeniden yazar.

    Bu yolu üst öğe ve alt öğe arasında eşler arası sohbet olarak
    ele **almayın**. Alt öğenin üst öğeye geri dönen bir tamamlanma
    kanalı zaten vardır.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send`, başlatmadan sonra başka bir oturumu hedefleyebilir.
    Normal eş oturumları için OpenClaw, mesajı enjekte ettikten sonra
    aracıdan aracıya (A2A) takip yolu kullanır:

    - Hedef oturumun yanıtını bekler.
    - İsteğe bağlı olarak istekte bulunan ve hedefin sınırlı sayıda takip turu alışverişi yapmasına izin verir.
    - Hedeften bir duyuru mesajı üretmesini ister.
    - Bu duyuruyu görünür kanala veya ileti dizisine teslim eder.

    Bu A2A yolu, gönderenin görünür bir takip mesajına ihtiyaç duyduğu
    eş gönderimleri için bir geri dönüş yoludur. İlgisiz bir oturumun
    bir ACP hedefini görebildiği ve ona mesaj gönderebildiği durumlarda,
    örneğin geniş `tools.sessions.visibility` ayarları altında, etkin kalır.

    OpenClaw, A2A takibini yalnızca istekte bulunan kendi üst öğesine ait
    tek seferlik ACP alt öğesinin üst öğesiyse atlar. Bu durumda görev
    tamamlamanın üzerine A2A çalıştırmak, üst öğeyi alt öğenin sonucuyla
    uyandırabilir, üst öğenin yanıtını tekrar alt öğeye iletebilir ve
    bir üst/alt yankı döngüsü oluşturabilir. Bu sahip olunan alt öğe durumu
    için `sessions_send` sonucu `delivery.status="skipped"` bildirir; çünkü
    sonuçtan tamamlanma yolu zaten sorumludur.

  </Accordion>
  <Accordion title="Resume an existing session">
    Baştan başlatmak yerine önceki bir ACP oturumuna devam etmek için
    `resumeSessionId` kullanın. Aracı, konuşma geçmişini `session/load`
    üzerinden yeniden oynatır; böylece önceki tüm bağlamla kaldığı yerden
    devam eder.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Yaygın kullanım örnekleri:

    - Codex oturumunu dizüstü bilgisayarınızdan telefonunuza devredin - aracınıza kaldığınız yerden devam etmesini söyleyin.
    - CLI içinde etkileşimli olarak başlattığınız bir kodlama oturumuna, şimdi aracınız üzerinden başsız şekilde devam edin.
    - Gateway yeniden başlatması veya boşta kalma zaman aşımı nedeniyle kesilen işi sürdürün.

    Notlar:

    - `resumeSessionId` yalnızca `runtime: "acp"` olduğunda geçerlidir; varsayılan alt aracı çalışma zamanı bu yalnızca ACP'ye özgü alanı yok sayar.
    - `streamTo` yalnızca `runtime: "acp"` olduğunda geçerlidir; varsayılan alt aracı çalışma zamanı bu yalnızca ACP'ye özgü alanı yok sayar.
    - `resumeSessionId`, ana makineye yerel bir ACP/yürütme ortamı sürdürme kimliğidir; bir OpenClaw kanal oturumu anahtarı değildir. OpenClaw gönderimden önce yine ACP başlatma politikasını ve hedef aracı politikasını denetler; bu üst akış kimliğini yükleme yetkilendirmesi ise ACP arka ucuna veya yürütme ortamına aittir.
    - `resumeSessionId`, üst akış ACP konuşma geçmişini geri yükler; `thread` ve `mode`, oluşturduğunuz yeni OpenClaw oturumuna yine normal şekilde uygulanır. Bu nedenle `mode: "session"` yine `thread: true` gerektirir.
    - Hedef aracı `session/load` desteklemelidir (Codex ve Claude Code destekler).
    - Oturum kimliği bulunamazsa başlatma açık bir hatayla başarısız olur - yeni bir oturuma sessiz geri dönüş yapılmaz.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Bir Gateway dağıtımından sonra birim testlere güvenmek yerine canlı
    uçtan uca denetim çalıştırın:

    1. Hedef ana makinede dağıtılmış Gateway sürümünü ve commit'i doğrulayın.
    2. Canlı bir agent'a geçici bir ACPX köprü oturumu açın.
    3. Bu agent'tan `sessions_spawn` çağrısını `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` ve `Reply with exactly LIVE-ACP-SPAWN-OK` göreviyle yapmasını isteyin.
    4. `accepted=yes`, gerçek bir `childSessionKey` ve doğrulayıcı hatası olmadığını doğrulayın.
    5. Geçici köprü oturumunu temizleyin.

    Geçidi `mode: "run"` üzerinde tutun ve `streamTo: "parent"` öğesini atlayın -
    iş parçacığına bağlı `mode: "session"` ve akış aktarma yolları ayrı
    daha kapsamlı entegrasyon geçişleridir.

  </Accordion>
</AccordionGroup>

## Sandbox uyumluluğu

ACP oturumları şu anda OpenClaw sandbox'ının içinde **değil**,
ana makine çalışma zamanında çalışır.

<Warning>
**Güvenlik sınırı:**

- Harici harness, kendi CLI izinlerine ve seçilen `cwd` değerine göre okuma/yazma yapabilir.
- OpenClaw'ın sandbox ilkesi ACP harness yürütmesini **sarmalamaz**.
- OpenClaw yine de ACP özellik geçitlerini, izin verilen agent'ları, oturum sahipliğini, kanal bağlamalarını ve Gateway teslim ilkesini uygular.
- Sandbox tarafından zorunlu kılınan OpenClaw yerel çalışmaları için `runtime: "subagent"` kullanın.

</Warning>

Geçerli sınırlamalar:

- İstekte bulunan oturum sandbox içindeyse, ACP spawn işlemleri hem `sessions_spawn({ runtime: "acp" })` hem de `/acp spawn` için engellenir.
- `runtime: "acp"` ile `sessions_spawn`, `sandbox: "require"` desteği sunmaz.

## Oturum hedefi çözümleme

Çoğu `/acp` eylemi isteğe bağlı bir oturum hedefi (`session-key`,
`session-id` veya `session-label`) kabul eder.

**Çözümleme sırası:**

1. Açık hedef bağımsız değişkeni (veya `/acp steer` için `--session`)
   - anahtarı dener
   - ardından UUID biçimli oturum kimliğini
   - ardından etiketi
2. Geçerli iş parçacığı bağlaması (bu konuşma/iş parçacığı bir ACP oturumuna bağlıysa).
3. Geçerli istekte bulunan oturuma geri dönüş.

Geçerli konuşma bağlamaları ve iş parçacığı bağlamalarının ikisi de
2. adıma katılır.

Hiçbir hedef çözümlenemezse OpenClaw net bir hata döndürür
(`Unable to resolve session target: ...`).

## ACP denetimleri

| Komut                | Ne yapar                                                  | Örnek                                                        |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------ |
| `/acp spawn`         | ACP oturumu oluşturur; isteğe bağlı geçerli bağlama veya iş parçacığı bağlaması. | `/acp spawn codex --bind here --cwd /repo`                   |
| `/acp cancel`        | Hedef oturum için sürmekte olan turn'ü iptal eder.        | `/acp cancel agent:codex:acp:<uuid>`                         |
| `/acp steer`         | Çalışan oturuma yönlendirme talimatı gönderir.            | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Oturumu kapatır ve iş parçacığı hedeflerinin bağını kaldırır. | `/acp close`                                                 |
| `/acp status`        | Arka ucu, modu, durumu, çalışma zamanı seçeneklerini ve yetenekleri gösterir. | `/acp status`                                                |
| `/acp set-mode`      | Hedef oturum için çalışma zamanı modunu ayarlar.          | `/acp set-mode plan`                                         |
| `/acp set`           | Genel çalışma zamanı yapılandırma seçeneği yazımı.        | `/acp set model openai/gpt-5.4`                              |
| `/acp cwd`           | Çalışma zamanı çalışma dizini geçersiz kılmasını ayarlar. | `/acp cwd /Users/user/Projects/repo`                         |
| `/acp permissions`   | Onay ilkesi profilini ayarlar.                            | `/acp permissions strict`                                    |
| `/acp timeout`       | Çalışma zamanı zaman aşımını ayarlar (saniye).            | `/acp timeout 120`                                           |
| `/acp model`         | Çalışma zamanı model geçersiz kılmasını ayarlar.          | `/acp model anthropic/claude-opus-4-6`                       |
| `/acp reset-options` | Oturum çalışma zamanı seçeneği geçersiz kılmalarını kaldırır. | `/acp reset-options`                                         |
| `/acp sessions`      | Depodan son ACP oturumlarını listeler.                    | `/acp sessions`                                              |
| `/acp doctor`        | Arka uç sağlığı, yetenekler, uygulanabilir düzeltmeler.   | `/acp doctor`                                                |
| `/acp install`       | Belirleyici kurulum ve etkinleştirme adımlarını yazdırır. | `/acp install`                                               |

`/acp status`, etkili çalışma zamanı seçeneklerini, çalışma zamanı düzeyi ve
arka uç düzeyi oturum tanımlayıcılarıyla birlikte gösterir. Bir arka uçta bir
yetenek eksik olduğunda desteklenmeyen denetim hataları net biçimde görünür.
`/acp sessions`, geçerli bağlı veya istekte bulunan oturum için depoyu okur;
hedef token'ları (`session-key`, `session-id` veya `session-label`), özel
agent başına `session.store` kökleri dahil olmak üzere Gateway oturum
keşfi üzerinden çözümlenir.

### Çalışma zamanı seçenekleri eşlemesi

`/acp` kolaylık komutlarına ve genel bir ayarlayıcıya sahiptir. Eşdeğer
işlemler:

| Komut                        | Şuna eşlenir                         | Notlar                                                                                                                                                                         |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | çalışma zamanı yapılandırma anahtarı `model` | Codex ACP için OpenClaw, `openai-codex/<model>` değerini adaptör model kimliğine normalleştirir ve `openai-codex/gpt-5.4/high` gibi eğik çizgili reasoning son eklerini `reasoning_effort` öğesine eşler. |
| `/acp set thinking <level>`  | çalışma zamanı yapılandırma anahtarı `thinking` | Codex ACP için OpenClaw, adaptör desteklediğinde karşılık gelen `reasoning_effort` değerini gönderir.                                                                          |
| `/acp permissions <profile>` | çalışma zamanı yapılandırma anahtarı `approval_policy` | -                                                                                                                                                                             |
| `/acp timeout <seconds>`     | çalışma zamanı yapılandırma anahtarı `timeout` | -                                                                                                                                                                             |
| `/acp cwd <path>`            | çalışma zamanı cwd geçersiz kılması  | Doğrudan güncelleme.                                                                                                                                                          |
| `/acp set <key> <value>`     | genel                                | `key=cwd`, cwd geçersiz kılma yolunu kullanır.                                                                                                                                |
| `/acp reset-options`         | tüm çalışma zamanı geçersiz kılmalarını temizler | -                                                                                                                                                                             |

## acpx harness, Plugin kurulumu ve izinler

acpx harness yapılandırması (Claude Code / Codex / Gemini CLI
takma adları), plugin-tools ve OpenClaw-tools MCP köprüleri ve ACP
izin modları için
[ACP agent'ları - kurulum](/tr/tools/acp-agents-setup) bölümüne bakın.

## Sorun giderme

| Belirti                                                                     | Olası neden                                                                                                            | Düzeltme                                                                                                                                                                |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Arka uç Plugin'i eksik, devre dışı veya `plugins.allow` tarafından engellenmiş.                                        | Arka uç Plugin'ini kurup etkinleştirin, bu izin listesi ayarlandığında `plugins.allow` içine `acpx` ekleyin, ardından `/acp doctor` çalıştırın.                         |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP genel olarak devre dışı.                                                                                           | `acp.enabled=true` ayarlayın.                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Normal iş parçacığı mesajlarından otomatik yönlendirme devre dışı.                                                     | Otomatik iş parçacığı yönlendirmesini sürdürmek için `acp.dispatch.enabled=true` ayarlayın; açık `sessions_spawn({ runtime: "acp" })` çağrıları çalışmaya devam eder.   |
| `ACP agent "<id>" is not allowed by policy`                                 | Ajan izin listesinde değil.                                                                                            | İzin verilen `agentId` kullanın veya `acp.allowedAgents` öğesini güncelleyin.                                                                                           |
| `/acp doctor` reports backend not ready right after startup                 | Arka uç Plugin'i eksik, devre dışı, izin/ret politikası tarafından engellenmiş veya yapılandırılmış yürütülebilir dosyası kullanılamıyor. | Arka uç Plugin'ini kurun/etkinleştirin, `/acp doctor` komutunu yeniden çalıştırın ve sağlıksız kalırsa arka uç kurulumunu veya politika hatasını inceleyin.             |
| Harness command not found                                                   | Bağdaştırıcı CLI kurulu değil, dış Plugin eksik veya Codex dışı bir bağdaştırıcı için ilk çalıştırma `npx` getirmesi başarısız oldu. | `/acp doctor` çalıştırın, bağdaştırıcıyı Gateway ana makinesinde kurun/önceden ısıtın veya acpx ajan komutunu açıkça yapılandırın.                                      |
| Model-not-found from the harness                                            | Model kimliği başka bir sağlayıcı/koşum için geçerli, ancak bu ACP hedefi için değil.                                  | O koşum tarafından listelenen bir model kullanın, modeli koşumda yapılandırın veya geçersiz kılmayı atlayın.                                                            |
| Vendor auth error from the harness                                          | OpenClaw sağlıklı, ancak hedef CLI/sağlayıcı oturum açmamış.                                                           | Gateway ana makine ortamında oturum açın veya gerekli sağlayıcı anahtarını sağlayın.                                                                                     |
| `Unable to resolve session target: ...`                                     | Hatalı anahtar/kimlik/etiket belirteci.                                                                                 | `/acp sessions` çalıştırın, tam anahtarı/etiketi kopyalayın, yeniden deneyin.                                                                                            |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here`, etkin ve bağlanabilir bir konuşma olmadan kullanıldı.                                                    | Hedef sohbete/kanala geçip yeniden deneyin veya bağlanmamış spawn kullanın.                                                                                              |
| `Conversation bindings are unavailable for <channel>.`                      | Bağdaştırıcıda geçerli konuşma ACP bağlama yeteneği yok.                                                               | Desteklenen yerlerde `/acp spawn ... --thread ...` kullanın, üst düzey `bindings[]` yapılandırın veya desteklenen bir kanala geçin.                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here`, bir iş parçacığı bağlamının dışında kullanıldı.                                                        | Hedef iş parçacığına geçin veya `--thread auto`/`off` kullanın.                                                                                                          |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Etkin bağlama hedefinin sahibi başka bir kullanıcı.                                                                     | Sahip olarak yeniden bağlayın veya farklı bir konuşma ya da iş parçacığı kullanın.                                                                                       |
| `Thread bindings are unavailable for <channel>.`                            | Bağdaştırıcıda iş parçacığı bağlama yeteneği yok.                                                                      | `--thread off` kullanın veya desteklenen bağdaştırıcıya/kanala geçin.                                                                                                    |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP çalışma zamanı ana makine tarafındadır; isteyen oturum sandbox içindedir.                                          | Sandbox içindeki oturumlardan `runtime="subagent"` kullanın veya ACP spawn işlemini sandbox içinde olmayan bir oturumdan çalıştırın.                                    |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP çalışma zamanı için `sandbox="require"` istendi.                                                                    | Zorunlu sandbox kullanımı için `runtime="subagent"` kullanın veya sandbox içinde olmayan bir oturumdan `sandbox="inherit"` ile ACP kullanın.                             |
| `Cannot apply --model ... did not advertise model support`                  | Hedef koşum genel ACP model değiştirmeyi sunmuyor.                                                                      | ACP `models`/`session/set_model` duyuran bir koşum kullanın, Codex ACP model referanslarını kullanın veya kendi başlatma bayrağı varsa modeli doğrudan koşumda yapılandırın. |
| Missing ACP metadata for bound session                                      | Eski/silinmiş ACP oturum meta verisi.                                                                                   | `/acp spawn` ile yeniden oluşturun, ardından iş parçacığını yeniden bağlayın/odaklayın.                                                                                  |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode`, etkileşimli olmayan ACP oturumunda yazma/yürütme işlemlerini engelliyor.                            | `plugins.entries.acpx.config.permissionMode` değerini `approve-all` olarak ayarlayın ve Gateway'i yeniden başlatın. Bkz. [İzin yapılandırması](/tr/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | İzin istemleri `permissionMode`/`nonInteractivePermissions` tarafından engelleniyor.                                    | `AcpRuntimeError` için gateway günlüklerini kontrol edin. Tam izinler için `permissionMode=approve-all`; zarif düşüş için `nonInteractivePermissions=deny` ayarlayın.     |
| ACP session stalls indefinitely after completing work                       | Koşum süreci tamamlandı, ancak ACP oturumu tamamlandığını bildirmedi.                                                   | OpenClaw'ı güncelleyin; geçerli acpx temizliği, kapanışta ve Gateway başlangıcında OpenClaw'a ait eski sarmalayıcı ve bağdaştırıcı süreçlerini toplar.                   |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | İç olay zarfı ACP sınırından sızdı.                                                                                    | OpenClaw'ı güncelleyin ve tamamlama akışını yeniden çalıştırın; dış koşumlar yalnızca düz tamamlama istemleri almalıdır.                                                |

## İlgili

- [ACP ajanları - kurulum](/tr/tools/acp-agents-setup)
- [Ajan gönderme](/tr/tools/agent-send)
- [CLI Arka Uçları](/tr/gateway/cli-backends)
- [Codex koşumu](/tr/plugins/codex-harness)
- [Çok ajanlı sandbox araçları](/tr/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (köprü modu)](/tr/cli/acp)
- [Alt ajanlar](/tr/tools/subagents)
