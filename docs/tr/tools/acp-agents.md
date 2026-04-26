---
read_when:
    - ACP üzerinden kodlama harness’leri çalıştırma
    - Mesajlaşma kanallarında konuşmaya bağlı ACP oturumları ayarlama
    - Bir mesajlaşma kanalı konuşmasını kalıcı bir ACP oturumuna bağlama
    - ACP arka ucunda, Plugin bağlamasında veya tamamlanma tesliminde sorun giderme
    - Sohbetten `/acp` komutlarını çalıştırma
sidebarTitle: ACP agents
summary: ACP arka ucu üzerinden harici kodlama harness’lerini çalıştırın (Claude Code, Cursor, Gemini CLI, açık Codex ACP, OpenClaw ACP, OpenCode)
title: ACP aracılar
x-i18n:
    generated_at: "2026-04-26T11:41:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3b8550be4cf0da2593b0770e302833e1722820d3c922e5508a253685cd0cb6b
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) oturumları,
OpenClaw’ın ACP arka uç Plugin’i üzerinden harici kodlama harness’lerini (örneğin Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI ve diğer
desteklenen ACPX harness’leri) çalıştırmasını sağlar.

Her ACP oturumu başlatması bir [background task](/tr/automation/tasks) olarak izlenir.

<Note>
**ACP, varsayılan Codex yolu değil, harici harness yoludur.**
Yerel Codex app-server Plugin’i `/codex ...` denetimlerinin ve
`agentRuntime.id: "codex"` gömülü çalışma zamanının sahibidir; ACP ise
`/acp ...` denetimlerinin ve `sessions_spawn({ runtime: "acp" })` oturumlarının sahibidir.

Codex veya Claude Code’un harici bir MCP istemcisi olarak
mevcut OpenClaw kanal konuşmalarına doğrudan bağlanmasını istiyorsanız,
ACP yerine [`openclaw mcp serve`](/tr/cli/mcp) kullanın.
</Note>

## Hangi sayfayı istiyorum?

| Şunu yapmak istiyorsunuz…                                                                      | Şunu kullanın                         | Notlar                                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Geçerli konuşmada Codex’i bağlamak veya denetlemek                                             | `/codex bind`, `/codex threads`       | `codex` Plugin’i etkin olduğunda yerel Codex app-server yolu; bağlı sohbet yanıtları, görsel yönlendirme, model/fast/izinler, durdurma ve yönlendirme denetimlerini içerir. ACP açık geri dönüş yoludur |
| Claude Code, Gemini CLI, açık Codex ACP veya başka bir harici harness’i OpenClaw _üzerinden_ çalıştırmak | Bu sayfa                              | Sohbete bağlı oturumlar, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, background tasks, çalışma zamanı denetimleri                                                                    |
| Bir OpenClaw Gateway oturumunu bir düzenleyici veya istemci için ACP sunucusu _olarak_ açığa çıkarmak | [`openclaw acp`](/tr/cli/acp)            | Köprü modu. IDE/istemci ACP’yi stdio/WebSocket üzerinden OpenClaw ile konuşur                                                                                                                |
| Yerel bir AI CLI’yi yalnızca metin tabanlı geri dönüş modeli olarak yeniden kullanmak          | [CLI Backends](/tr/gateway/cli-backends) | ACP değildir. OpenClaw araçları yok, ACP denetimleri yok, harness çalışma zamanı yok                                                                                                         |

## Bu kutudan çıktığı gibi çalışır mı?

Genellikle evet. Yeni kurulumlar, varsayılan olarak etkin olan, paketlenmiş `acpx`
çalışma zamanı Plugin’iyle gelir; bu Plugin, OpenClaw’ın başlangıçta yoklayıp
kendini onardığı Plugin-yerel sabitlenmiş bir `acpx` ikilisi içerir. Hazırlık denetimi için `/acp doctor` çalıştırın.

OpenClaw aracılara ACP başlatmayı yalnızca ACP **gerçekten
kullanılabilir** olduğunda öğretir: ACP etkin olmalı, dispatch devre dışı olmamalı, geçerli
oturum sandbox tarafından engellenmemeli ve bir çalışma zamanı arka ucu
yüklenmiş olmalıdır. Bu koşullar karşılanmazsa ACP Plugin Skills’leri ve
`sessions_spawn` ACP rehberliği gizli kalır; böylece aracı
kullanılamayan bir arka uç önermesin.

<AccordionGroup>
  <Accordion title="İlk çalıştırma tuzakları">
    - `plugins.allow` ayarlıysa bu kısıtlayıcı bir Plugin envanteridir ve **`acpx` içermek zorundadır**; aksi halde paketlenmiş varsayılan bilinçli olarak engellenir ve `/acp doctor` eksik allowlist girdisini bildirir.
    - Hedef harness adaptörleri (Codex, Claude vb.) ilk kullanımda isteğe bağlı olarak `npx` ile getirilebilir.
    - O harness için sağlayıcı auth’ının yine de ana makinede mevcut olması gerekir.
    - Ana makinede npm veya ağ erişimi yoksa, ilk çalıştırma adaptör getirmeleri önbellekler önceden ısıtılana veya adaptör başka bir yolla kurulana kadar başarısız olur.
  </Accordion>
  <Accordion title="Çalışma zamanı ön koşulları">
    ACP gerçek bir harici harness süreci başlatır. OpenClaw yönlendirme,
    background-task durumu, teslim, bağlar ve ilkeye sahiptir; harness ise
    kendi sağlayıcı girişine, model kataloğuna, dosya sistemi davranışına ve
    yerel araçlara sahiptir.

    OpenClaw’ı suçlamadan önce şunları doğrulayın:

    - `/acp doctor`, etkin ve sağlıklı bir arka uç bildiriyor.
    - `acp.allowedAgents` allowlist’i ayarlıysa hedef kimlik buna izinli.
    - Harness komutu Gateway ana makinesinde başlayabiliyor.
    - O harness için sağlayıcı auth’ı mevcut (`claude`, `codex`, `gemini`, `opencode`, `droid` vb.).
    - Seçilen model o harness için mevcut — model kimlikleri harness’ler arasında taşınabilir değildir.
    - İstenen `cwd` mevcut ve erişilebilir, ya da `cwd`’yi atlayın ve arka ucun varsayılanını kullanmasına izin verin.
    - İzin modu işe uygun. Etkileşimli olmayan oturumlar yerel izin istemlerine tıklayamaz; bu yüzden yoğun yazma/exec içeren kodlama çalıştırmaları genellikle başsız ilerleyebilen bir ACPX izin profili gerektirir.

  </Accordion>
</AccordionGroup>

OpenClaw Plugin araçları ve yerleşik OpenClaw araçları varsayılan olarak
ACP harness’lerine açığa çıkarılmaz. Harness’in bu araçları doğrudan çağırması
gerekiyorsa yalnızca [ACP agents — setup](/tr/tools/acp-agents-setup)
içindeki açık MCP köprülerini etkinleştirin.

## Desteklenen harness hedefleri

Paketlenmiş `acpx` arka ucuyla, bu harness kimliklerini `/acp spawn <id>`
veya `sessions_spawn({ runtime: "acp", agentId: "<id>" })` hedefleri olarak kullanın:

| Harness kimliği | Tipik arka uç                                 | Notlar                                                                                  |
| --------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `claude`        | Claude Code ACP adaptörü                      | Ana makinede Claude Code auth’ı gerektirir.                                              |
| `codex`         | Codex ACP adaptörü                            | Yalnızca yerel `/codex` kullanılamadığında veya ACP açıkça istendiğinde açık ACP geri dönüşü. |
| `copilot`       | GitHub Copilot ACP adaptörü                   | Copilot CLI/çalışma zamanı auth’ı gerektirir.                                            |
| `cursor`        | Cursor CLI ACP (`cursor-agent acp`)           | Yerel kurulum farklı bir ACP giriş noktası açığa çıkarıyorsa acpx komutunu geçersiz kılın. |
| `droid`         | Factory Droid CLI                             | Factory/Droid auth’ı veya harness ortamında `FACTORY_API_KEY` gerektirir.                |
| `gemini`        | Gemini CLI ACP adaptörü                       | Gemini CLI auth’ı veya API anahtarı kurulumu gerektirir.                                 |
| `iflow`         | iFlow CLI                                     | Adaptör kullanılabilirliği ve model denetimi kurulu CLI’ye bağlıdır.                     |
| `kilocode`      | Kilo Code CLI                                 | Adaptör kullanılabilirliği ve model denetimi kurulu CLI’ye bağlıdır.                     |
| `kimi`          | Kimi/Moonshot CLI                             | Ana makinede Kimi/Moonshot auth’ı gerektirir.                                            |
| `kiro`          | Kiro CLI                                      | Adaptör kullanılabilirliği ve model denetimi kurulu CLI’ye bağlıdır.                     |
| `opencode`      | OpenCode ACP adaptörü                         | OpenCode CLI/sağlayıcı auth’ı gerektirir.                                                |
| `openclaw`      | `openclaw acp` üzerinden OpenClaw Gateway köprüsü | ACP farkındalığı olan bir harness’in bir OpenClaw Gateway oturumuna geri konuşmasını sağlar. |
| `pi`            | Pi/gömülü OpenClaw çalışma zamanı             | OpenClaw-yerel harness deneyleri için kullanılır.                                        |
| `qwen`          | Qwen Code / Qwen CLI                          | Ana makinede Qwen uyumlu auth gerektirir.                                                |

Özel acpx aracı takma adları acpx içinde yapılandırılabilir, ancak OpenClaw
ilkesi yine de dispatch öncesinde `acp.allowedAgents` ve herhangi bir
`agents.list[].runtime.acp.agent` eşlemesini denetler.

## Operatör çalışma kitabı

Sohbetten hızlı `/acp` akışı:

<Steps>
  <Step title="Başlat">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, veya açık
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Çalış">
    Bağlı konuşmada veya iş parçacığında devam edin (ya da oturum
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
  <Step title="Yön ver">
    Bağlamı değiştirmeden: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Durdur">
    `/acp cancel` (geçerli dönüş) veya `/acp close` (oturum + bağlar).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Yaşam döngüsü ayrıntıları">
    - Başlatma, bir ACP çalışma zamanı oturumu oluşturur veya sürdürür, OpenClaw oturum deposuna ACP meta verisini kaydeder ve çalıştırma üst-öğe sahipliyse bir background task oluşturabilir.
    - Bağlı takip mesajları, bağ kapatılana, odak kaldırılana, sıfırlanana veya süresi dolana kadar doğrudan ACP oturumuna gider.
    - Gateway komutları yerelde kalır. `/acp ...`, `/status` ve `/unfocus`, bağlı bir ACP harness’ine asla normal istem metni olarak gönderilmez.
    - `cancel`, arka uç iptali destekliyorsa etkin dönüşü iptal eder; bağı veya oturum meta verisini silmez.
    - `close`, ACP oturumunu OpenClaw’ın bakış açısından bitirir ve bağı kaldırır. Bir harness sürdürmeyi destekliyorsa kendi upstream geçmişini yine de tutabilir.
    - Boştaki çalışma zamanı worker’ları `acp.runtime.ttlMinutes` sonrasında temizlenmeye uygundur; saklanan oturum meta verisi `/acp sessions` için kullanılabilir kalır.
  </Accordion>
  <Accordion title="Yerel Codex yönlendirme kuralları">
    **Yerel Codex Plugin’i**ne yönlenmesi gereken doğal dil tetikleyicileri
    Plugin etkin olduğunda:

    - "Bind this Discord channel to Codex."
    - "Attach this chat to Codex thread `<id>`."
    - "Show Codex threads, then bind this one."

    Yerel Codex konuşma bağlama, varsayılan sohbet denetim yoludur.
    OpenClaw dinamik araçları OpenClaw üzerinden yürütülmeye devam ederken,
    kabuk/apply-patch gibi Codex-yerel araçlar Codex içinde yürütülür.
    Codex-yerel araç olayları için OpenClaw, Plugin hook’larının
    `before_tool_call` engellemesi, `after_tool_call` gözlemlemesi ve
    Codex `PermissionRequest` olaylarını OpenClaw onayları üzerinden yönlendirmesi için dönüş başına yerel
    bir hook relay ekler. Codex `Stop` hook’ları
    OpenClaw `before_agent_finalize` aşamasına iletilir; burada Plugin’ler
    Codex yanıtını sonlandırmadan önce bir model geçişi daha isteyebilir.
    Relay bilinçli olarak muhafazakâr kalır:
    Codex-yerel araç argümanlarını değiştirmez veya Codex iş parçacığı kayıtlarını yeniden yazmaz.
    ACP çalışma zamanı/oturum modelini istediğinizde yalnızca açık ACP kullanın. Gömülü Codex
    destek sınırı,
    [Codex harness v1 support contract](/tr/plugins/codex-harness#v1-support-contract)
    içinde belgelenmiştir.

  </Accordion>
  <Accordion title="Model / sağlayıcı / çalışma zamanı seçim kılavuzu">
    - `openai-codex/*` — PI Codex OAuth/abonelik yolu.
    - `openai/*` artı `agentRuntime.id: "codex"` — yerel Codex app-server gömülü çalışma zamanı.
    - `/codex ...` — yerel Codex konuşma denetimi.
    - `/acp ...` veya `runtime: "acp"` — açık ACP/acpx denetimi.
  </Accordion>
  <Accordion title="ACP yönlendirme doğal dil tetikleyicileri">
    ACP çalışma zamanına yönlenmesi gereken tetikleyiciler:

    - "Run this as a one-shot Claude Code ACP session and summarize the result."
    - "Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread."
    - "Run Codex through ACP in a background thread."

    OpenClaw `runtime: "acp"` seçer, harness `agentId`’sini çözer,
    desteklendiğinde geçerli konuşmaya veya iş parçacığına bağlar ve
    kapanana/süresi dolana kadar takip iletilerini o oturuma yönlendirir. Codex
    bu yolu yalnızca ACP/acpx açıkça istendiğinde veya talep edilen işlem için yerel Codex
    Plugin’i kullanılamadığında izler.

    `sessions_spawn` için `runtime: "acp"` yalnızca ACP
    etkin olduğunda, istekte bulunan sandbox’ta olmadığında ve bir ACP çalışma zamanı
    arka ucu yüklendiğinde ilan edilir. `codex`,
    `claude`, `droid`, `gemini` veya `opencode` gibi ACP harness kimliklerini hedefler. Bir normal
    OpenClaw config aracı kimliğini `agents_list` içinden geçmeyin; ancak bu girdi açıkça
    `agents.list[].runtime.type="acp"` ile yapılandırılmışsa geçirin;
    aksi halde varsayılan alt aracı çalışma zamanını kullanın. Bir OpenClaw aracı
    `runtime.type="acp"` ile yapılandırıldığında OpenClaw,
    alttaki harness kimliği olarak `runtime.acp.agent` kullanır.

  </Accordion>
</AccordionGroup>

## ACP ve alt aracılar

Harici bir harness çalışma zamanı istiyorsanız ACP kullanın. `codex`
Plugin’i etkin olduğunda Codex konuşma bağlama/denetimi için **yerel Codex
app-server** kullanın. OpenClaw-yerel
delege çalıştırmalar istiyorsanız **alt aracılar** kullanın.

| Alan          | ACP oturumu                           | Alt aracı çalıştırması             |
| ------------- | ------------------------------------- | ---------------------------------- |
| Çalışma zamanı | ACP arka uç Plugin’i (örneğin acpx)  | OpenClaw yerel alt aracı çalışma zamanı |
| Oturum anahtarı | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`  |
| Ana komutlar  | `/acp ...`                            | `/subagents ...`                   |
| Başlatma aracı | `sessions_spawn` ile `runtime:"acp"` | `sessions_spawn` (varsayılan çalışma zamanı) |

Ayrıca bkz. [Sub-agents](/tr/tools/subagents).

## ACP, Claude Code’u nasıl çalıştırır

Claude Code’un ACP üzerinden çalıştırılmasında yığın şöyledir:

1. OpenClaw ACP oturumu kontrol düzlemi.
2. Paketlenmiş `acpx` çalışma zamanı Plugin’i.
3. Claude ACP adaptörü.
4. Claude tarafı çalışma zamanı/oturum altyapısı.

ACP Claude bir **harness oturumu**dur; ACP denetimleri, oturum sürdürme,
background-task izleme ve isteğe bağlı konuşma/iş parçacığı bağlama içerir.

CLI arka uçları ayrı, yalnızca metin tabanlı yerel geri dönüş çalışma zamanlarıdır — bkz.
[CLI Backends](/tr/gateway/cli-backends).

Operatörler için pratik kural şudur:

- **`/acp spawn`, bağlanabilir oturumlar, çalışma zamanı denetimleri veya kalıcı harness işi mi istiyorsunuz?** ACP kullanın.
- **Ham CLI üzerinden basit yerel metin geri dönüşü mü istiyorsunuz?** CLI arka uçlarını kullanın.

## Bağlı oturumlar

### Zihinsel model

- **Sohbet yüzeyi** — insanların konuşmaya devam ettiği yer (Discord kanalı, Telegram konusu, iMessage sohbeti).
- **ACP oturumu** — OpenClaw’ın yönlendirdiği kalıcı Codex/Claude/Gemini çalışma zamanı durumu.
- **Alt iş parçacığı/konu** — yalnızca `--thread ...` ile oluşturulan isteğe bağlı ek mesajlaşma yüzeyi.
- **Çalışma zamanı çalışma alanı** — harness’in çalıştığı dosya sistemi konumu (`cwd`, repo checkout, arka uç çalışma alanı). Sohbet yüzeyinden bağımsızdır.

### Geçerli konuşma bağları

`/acp spawn <harness> --bind here`, geçerli konuşmayı başlatılan
ACP oturumuna sabitler — alt iş parçacığı yok, aynı sohbet yüzeyi. OpenClaw
transport, auth, güvenlik ve teslimin sahibi olmaya devam eder. Bu
konuşmadaki takip iletileri aynı oturuma yönlenir; `/new` ve `/reset`
oturumu yerinde sıfırlar; `/acp close` bağı kaldırır.

Örnekler:

```text
/codex bind                                              # yerel Codex bağı, gelecekteki iletileri buraya yönlendir
/codex model gpt-5.4                                     # bağlı yerel Codex iş parçacığını ayarla
/codex stop                                              # etkin yerel Codex dönüşünü denetle
/acp spawn codex --bind here                             # Codex için açık ACP geri dönüşü
/acp spawn codex --thread auto                           # alt iş parçacığı/konu oluşturabilir ve oraya bağlayabilir
/acp spawn codex --bind here --cwd /workspace/repo       # aynı sohbet bağı, Codex /workspace/repo içinde çalışır
```

<AccordionGroup>
  <Accordion title="Bağlama kuralları ve münhasırlık">
    - `--bind here` ve `--thread ...` birbirini dışlar.
    - `--bind here` yalnızca geçerli konuşma bağlamasını ilan eden kanallarda çalışır; aksi halde OpenClaw açık bir desteklenmiyor mesajı döndürür. Bağlar Gateway yeniden başlatmalarında da kalıcıdır.
    - Discord’da `spawnAcpSessions`, yalnızca OpenClaw’ın `--thread auto|here` için alt iş parçacığı oluşturması gerektiğinde gerekir — `--bind here` için gerekmez.
    - `--cwd` olmadan farklı bir ACP aracısına başlatırsanız, OpenClaw varsayılan olarak **hedef aracının** çalışma alanını devralır. Eksik devralınmış yollar (`ENOENT`/`ENOTDIR`) arka ucun varsayılanına geri döner; diğer erişim hataları (`EACCES` gibi) başlatma hatası olarak görünür.
    - Gateway yönetim komutları bağlı konuşmalarda yerelde kalır — normal takip metni bağlı ACP oturumuna yönlense bile `/acp ...` komutları OpenClaw tarafından işlenir; ayrıca bu yüzey için komut işleme etkin olduğunda `/status` ve `/unfocus` da yerelde kalır.
  </Accordion>
  <Accordion title="İş parçacığına bağlı oturumlar">
    Bir kanal adaptörü için iş parçacığı bağları etkin olduğunda:

    - OpenClaw bir iş parçacığını hedef ACP oturumuna bağlar.
    - O iş parçacığındaki takip iletileri bağlı ACP oturumuna yönlenir.
    - ACP çıktısı aynı iş parçacığına geri teslim edilir.
    - Odak kaldırma/kapatma/arşivleme/boşta zaman aşımı veya max-age süresi dolması bağı kaldırır.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` ve `/unfocus`, ACP harness’ine gönderilen istemler değil, Gateway komutlarıdır.

    İş parçacığına bağlı ACP için gerekli özellik bayrakları:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` varsayılan olarak açıktır (ACP dispatch’i duraklatmak için `false` ayarlayın).
    - Kanal adaptörüne özgü ACP iş parçacığı başlatma bayrağı etkin olmalıdır:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    İş parçacığı bağlama desteği adaptöre özgüdür. Etkin kanal
    adaptörü iş parçacığı bağlarını desteklemiyorsa, OpenClaw açık bir
    desteklenmiyor/kullanılamıyor mesajı döndürür.

  </Accordion>
  <Accordion title="İş parçacığını destekleyen kanallar">
    - Oturum/iş parçacığı bağlama yeteneği sunan herhangi bir kanal adaptörü.
    - Geçerli yerleşik destek: **Discord** iş parçacıkları/kanalları, **Telegram** konuları (gruplar/süper gruplardaki forum konuları ve DM konuları).
    - Plugin kanalları aynı bağlama arayüzü üzerinden destek ekleyebilir.
  </Accordion>
</AccordionGroup>

## Kalıcı kanal bağları

Geçici olmayan iş akışları için üst düzey `bindings[]` girdilerinde
kalıcı ACP bağları yapılandırın.

### Bağ modeli

<ParamField path="bindings[].type" type='"acp"'>
  Kalıcı bir ACP konuşma bağını işaretler.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Hedef konuşmayı tanımlar. Kanal başına biçimler:

- **Discord kanalı/iş parçacığı:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram forum konusu:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles DM/grup:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Kararlı grup bağları için `chat_id:*` veya `chat_identifier:*` tercih edin.
- **iMessage DM/grup:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Kararlı grup bağları için `chat_id:*` tercih edin.
  </ParamField>
  <ParamField path="bindings[].agentId" type="string">
  Sahip OpenClaw aracı kimliği.
  </ParamField>
  <ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  İsteğe bağlı ACP geçersiz kılması.
  </ParamField>
  <ParamField path="bindings[].acp.label" type="string">
  İsteğe bağlı operatör odaklı etiket.
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
- `agents.list[].runtime.acp.agent` (harness kimliği, örneğin `codex` veya `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP bağlı oturumları için geçersiz kılma önceliği:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Genel ACP varsayılanları (örneğin `acp.backend`)

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
- O kanal veya konudaki iletiler yapılandırılmış ACP oturumuna yönlenir.
- Bağlı konuşmalarda `/new` ve `/reset`, aynı ACP oturum anahtarını yerinde sıfırlar.
- Geçici çalışma zamanı bağları (örneğin iş parçacığı odak akışları tarafından oluşturulanlar) mevcut oldukları yerde yine uygulanır.
- Açık bir `cwd` olmadan arası-aracı ACP başlatmaları için OpenClaw, hedef aracı çalışma alanını aracı config’inden devralır.
- Eksik devralınmış çalışma alanı yolları arka ucun varsayılan cwd’sine geri düşer; eksik olmayan erişim hataları başlatma hatası olarak görünür.

## ACP oturumları başlatma

Bir ACP oturumunu başlatmanın iki yolu vardır:

<Tabs>
  <Tab title="sessions_spawn içinden">
    Bir aracı dönüşünden veya
    araç çağrısından ACP oturumu başlatmak için `runtime: "acp"` kullanın.

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
    `runtime` varsayılan olarak `subagent` değerine gelir; bu yüzden ACP oturumları
    için `runtime: "acp"` değerini açıkça ayarlayın. `agentId` atlanırsa OpenClaw,
    yapılandırılmışsa `acp.defaultAgent` kullanır. `mode: "session"` kalıcı bağlı konuşma tutmak için
    `thread: true` gerektirir.
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

    Bkz. [Slash commands](/tr/tools/slash-commands).

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
  ACP hedef harness kimliği. Ayarlıysa `acp.defaultAgent` değerine geri düşer.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Desteklendiği yerde iş parçacığı bağlama akışını ister.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` tek seferliktir; `"session"` kalıcıdır. Eğer `thread: true` ve
  `mode` atlanmışsa OpenClaw çalışma zamanı yoluna göre varsayılan olarak kalıcı davranış kullanabilir.
  `mode: "session"` için `thread: true` gerekir.
</ParamField>
<ParamField path="cwd" type="string">
  İstenen çalışma zamanı çalışma dizini (arka uç/çalışma zamanı
  ilkesi tarafından doğrulanır). Atlanırsa ACP başlatma, yapılandırılmışsa hedef aracı çalışma alanını
  devralır; eksik devralınmış yollar arka uç
  varsayılanlarına geri düşer, gerçek erişim hataları ise döndürülür.
</ParamField>
<ParamField path="label" type="string">
  Oturum/banner metninde kullanılan operatör odaklı etiket.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Yeni bir ACP oturumu oluşturmak yerine mevcut bir ACP oturumunu sürdürür.
  Aracı konuşma geçmişini `session/load` ile yeniden oynatır.
  `runtime: "acp"` gerektirir.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"`, ilk ACP çalıştırma ilerleme özetlerini
  sistem olayları olarak istekte bulunan oturuma akıtır. Kabul edilen yanıtlar,
  tam röle geçmişi için tail edebileceğiniz oturum kapsamlı bir JSONL günlüğünü
  (`<sessionId>.acp-stream.jsonl`) gösteren `streamLogPath` içerebilir.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  ACP alt dönüşünü N saniye sonra iptal eder. `0`, dönüşü
  Gateway’in zaman aşımı olmayan yolunda tutar. Aynı değer hem Gateway
  çalıştırmasına hem ACP çalışma zamanına uygulanır; böylece takılmış/kotası tükenmiş harness’ler
  üst aracı lane’ini süresiz meşgul etmez.
</ParamField>
<ParamField path="model" type="string">
  ACP alt oturumu için açık model geçersiz kılması. Codex ACP başlatmaları,
  `openai-codex/gpt-5.4` gibi OpenClaw Codex başvurularını
  `session/new` öncesinde Codex ACP başlangıç config’ine normalleştirir;
  `openai-codex/gpt-5.4/high` gibi eğik çizgili biçimler de
  Codex ACP reasoning çabasını ayarlar. Diğer harness’ler ACP `models` ilan etmeli ve
  `session/set_model` desteklemelidir; aksi halde OpenClaw/acpx
  sessizce hedef aracı varsayılanına dönmek yerine açık biçimde başarısız olur.
</ParamField>
<ParamField path="thinking" type="string">
  Açık thinking/reasoning çabası. Codex ACP için `minimal`,
  düşük çabaya eşlenir; `low`/`medium`/`high`/`xhigh` doğrudan eşlenir ve
  `off` reasoning-effort başlangıç geçersiz kılmasını atlar.
</ParamField>

## Başlatma bağlama ve iş parçacığı modları

<Tabs>
  <Tab title="--bind here|off">
    | Mod    | Davranış                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Geçerli etkin konuşmayı yerinde bağlar; etkin konuşma yoksa başarısız olur. |
    | `off`  | Geçerli konuşma bağı oluşturmaz.                                       |

    Notlar:

    - `--bind here`, “bu kanalı veya sohbeti Codex destekli yap” için en basit operatör yoludur.
    - `--bind here`, alt iş parçacığı oluşturmaz.
    - `--bind here`, yalnızca geçerli konuşma bağlama desteği sunan kanallarda kullanılabilir.
    - `--bind` ve `--thread`, aynı `/acp spawn` çağrısında birleştirilemez.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mod    | Davranış                                                                                              |
    | ------ | ----------------------------------------------------------------------------------------------------- |
    | `auto` | Etkin bir iş parçacığında: o iş parçacığını bağlar. İş parçacığı dışında: destekleniyorsa alt iş parçacığı oluşturur/bağlar. |
    | `here` | Geçerli etkin iş parçacığını zorunlu kılar; içinde değilse başarısız olur.                            |
    | `off`  | Bağ yok. Oturum bağlı olmadan başlar.                                                                  |

    Notlar:

    - İş parçacığı bağlamayan yüzeylerde varsayılan davranış fiilen `off` olur.
    - İş parçacığına bağlı başlatma, kanal ilkesi desteği gerektirir:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Alt iş parçacığı oluşturmadan geçerli konuşmayı sabitlemek istediğinizde `--bind here` kullanın.

  </Tab>
</Tabs>

## Teslim modeli

ACP oturumları etkileşimli çalışma alanları veya üst-öğe sahipliğinde
arka plan işleri olabilir. Teslim yolu buna göre değişir.

<AccordionGroup>
  <Accordion title="Etkileşimli ACP oturumları">
    Etkileşimli oturumlar görünür bir sohbet
    yüzeyinde konuşmaya devam etmek içindir:

    - `/acp spawn ... --bind here`, geçerli konuşmayı ACP oturumuna bağlar.
    - `/acp spawn ... --thread ...`, bir kanal iş parçacığını/konusunu ACP oturumuna bağlar.
    - Kalıcı yapılandırılmış `bindings[].type="acp"` girdileri eşleşen konuşmaları aynı ACP oturumuna yönlendirir.

    Bağlı konuşmadaki takip iletileri doğrudan
    ACP oturumuna yönlenir ve ACP çıktısı aynı
    kanal/iş parçacığı/konuya geri teslim edilir.

    OpenClaw’ın harness’e gönderdiği şey:

    - Normal bağlı takipler istem metni olarak gönderilir; ekler ise yalnızca harness/arka uç bunları desteklediğinde gönderilir.
    - `/acp` yönetim komutları ve yerel Gateway komutları ACP dispatch’inden önce yakalanır.
    - Çalışma zamanı tarafından üretilen tamamlanma olayları hedef başına somutlaştırılır. OpenClaw aracıları OpenClaw’ın dahili çalışma zamanı bağlamı zarfını alır; harici ACP harness’leri ise çocuk sonuç ve yönerge içeren düz bir istem alır. Ham `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` zarfı hiçbir zaman harici harness’lere gönderilmemeli veya ACP kullanıcı transcript metni olarak kalıcılaştırılmamalıdır.
    - ACP transcript girdileri kullanıcı tarafından görülen tetikleyici metni veya düz tamamlanma istemini kullanır. Dahili olay meta verisi mümkün olduğunda OpenClaw içinde yapılandırılmış kalır ve kullanıcı tarafından yazılmış sohbet içeriği gibi ele alınmaz.

  </Accordion>
  <Accordion title="Üst-öğe sahipliğinde tek seferlik ACP oturumları">
    Başka bir aracı çalıştırması tarafından başlatılan tek seferlik ACP oturumları,
    alt aracılara benzer şekilde arka plan
    çocuklarıdır:

    - Üst öğe işi `sessions_spawn({ runtime: "acp", mode: "run" })` ile ister.
    - Çocuk kendi ACP harness oturumunda çalışır.
    - Çocuk dönüşleri, yerel alt aracı başlatmalarında kullanılan aynı arka plan lane’inde çalışır; böylece yavaş bir ACP harness alakasız ana oturum işlerini engellemez.
    - Tamamlanma task-completion duyuru yolu üzerinden geri raporlanır. OpenClaw dahili tamamlanma meta verisini, harici bir harness’e göndermeden önce düz bir ACP istemine dönüştürür; böylece harness’ler OpenClaw’a özgü çalışma zamanı bağlam işaretlerini görmez.
    - Kullanıcıya dönük yanıt faydalı olduğunda üst öğe, çocuk sonucunu normal yardımcı sesiyle yeniden yazar.

    Bu yolu üst öğe ile çocuk arasında eşler arası sohbet gibi
    değerlendirmeyin. Çocuğun zaten üst öğeye geri giden bir tamamlanma kanalı vardır.

  </Accordion>
  <Accordion title="sessions_send ve A2A teslimi">
    `sessions_send`, başlatmadan sonra başka bir oturumu hedefleyebilir. Normal
    eş oturumlar için OpenClaw, iletiyi enjekte ettikten sonra
    aracıdan aracıya (A2A) takip yolunu kullanır:

    - Hedef oturumun yanıtını bekler.
    - İsteğe bağlı olarak istekte bulunan ve hedefin sınırlı sayıda takip dönüşü alışverişi yapmasına izin verir.
    - Hedeften bir duyuru mesajı üretmesini ister.
    - Bu duyuruyu görünür kanal veya iş parçacığına teslim eder.

    Bu A2A yolu, gönderen görünür bir
    takip gerektirdiğinde eş gönderimleri için geri dönüş yoludur. İlgisiz bir oturum geniş
    `tools.sessions.visibility` ayarları altında bir ACP hedefini görebildiğinde ve ona mesaj gönderebildiğinde örneğin bu yol etkin kalır.

    OpenClaw A2A takibini yalnızca istekte bulunan, üst-öğe sahipliğinde tek seferlik ACP çocuğunun
    üst öğesi olduğunda atlar. Bu durumda,
    task completion üzerine A2A çalıştırmak üst öğeyi çocuk sonucu ile
    uyandırabilir, üst öğenin yanıtını çocuğa geri iletebilir ve
    bir üst-öğe/çocuk yankı döngüsü oluşturabilir. `sessions_send` sonucu
    sahip olunan çocuk durumunda `delivery.status="skipped"` bildirir; çünkü
    sonuçtan zaten tamamlanma yolu sorumludur.

  </Accordion>
  <Accordion title="Mevcut bir oturumu sürdürme">
    Yeni başlatmak yerine önceki bir ACP oturumunu
    sürdürmek için `resumeSessionId` kullanın. Aracı konuşma geçmişini
    `session/load` ile yeniden oynatır; böylece öncekinin tam bağlamıyla
    kaldığı yerden devam eder.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Yaygın kullanım durumları:

    - Bir Codex oturumunu dizüstü bilgisayarınızdan telefonunuza devredin — aracınıza kaldığınız yerden devam etmesini söyleyin.
    - CLI’de etkileşimli olarak başlattığınız bir kodlama oturumuna şimdi aracınız üzerinden başsız şekilde devam edin.
    - Gateway yeniden başlatması veya boşta zaman aşımı ile kesilen işi sürdürün.

    Notlar:

    - `resumeSessionId`, `runtime: "acp"` gerektirir — alt aracı çalışma zamanıyla kullanılırsa hata döndürür.
    - `resumeSessionId`, upstream ACP konuşma geçmişini geri yükler; `thread` ve `mode` yine de oluşturduğunuz yeni OpenClaw oturumuna normal şekilde uygulanır, dolayısıyla `mode: "session"` için yine `thread: true` gerekir.
    - Hedef aracı `session/load` desteklemelidir (Codex ve Claude Code destekler).
    - Oturum kimliği bulunamazsa başlatma açık bir hatayla başarısız olur — yeni bir oturuma sessiz geri dönüş yoktur.

  </Accordion>
  <Accordion title="Dağıtım sonrası smoke testi">
    Gateway dağıtımından sonra yalnızca birim testlerine
    güvenmek yerine canlı bir uçtan uca denetim çalıştırın:

    1. Hedef ana makinede dağıtılmış Gateway sürümünü ve commit’ini doğrulayın.
    2. Canlı bir aracıya geçici bir ACPX köprü oturumu açın.
    3. Bu aracıdan `sessions_spawn` çağırmasını isteyin; `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` ve görev `Reply with exactly LIVE-ACP-SPAWN-OK` olsun.
    4. `accepted=yes`, gerçek bir `childSessionKey` ve doğrulayıcı hatası olmadığını doğrulayın.
    5. Geçici köprü oturumunu temizleyin.

    Geçidi `mode: "run"` üzerinde tutun ve `streamTo: "parent"` atlayın —
    iş parçacığına bağlı `mode: "session"` ve akış rölesi yolları ayrı,
    daha zengin entegrasyon geçişleridir.

  </Accordion>
</AccordionGroup>

## Sandbox uyumluluğu

ACP oturumları şu anda OpenClaw sandbox’ı
içinde değil, ana makine çalışma zamanında çalışır.

<Warning>
**Güvenlik sınırı:**

- Harici harness kendi CLI izinlerine ve seçilen `cwd`’ye göre okuyup yazabilir.
- OpenClaw’ın sandbox ilkesi ACP harness yürütmesini **sarmalamaz**.
- OpenClaw yine de ACP özellik kapılarını, izinli aracıları, oturum sahipliğini, kanal bağlarını ve Gateway teslim ilkesini uygular.
- Sandbox zorunlu OpenClaw-yerel işler için `runtime: "subagent"` kullanın.
  </Warning>

Geçerli sınırlamalar:

- İstekte bulunan oturum sandbox içindeyse ACP başlatmaları hem `sessions_spawn({ runtime: "acp" })` hem de `/acp spawn` için engellenir.
- `sessions_spawn` ile `runtime: "acp"`, `sandbox: "require"` desteklemez.

## Oturum hedef çözümlemesi

Çoğu `/acp` eylemi isteğe bağlı bir oturum hedefi kabul eder (`session-key`,
`session-id` veya `session-label`).

**Çözümleme sırası:**

1. Açık hedef argümanı (veya `/acp steer` için `--session`)
   - önce anahtarı dener
   - sonra UUID biçimli oturum kimliğini dener
   - sonra etiketi dener
2. Geçerli iş parçacığı bağı (bu konuşma/iş parçacığı bir ACP oturumuna bağlıysa).
3. Geçerli istekte bulunan oturumuna geri dönüş.

Geçerli konuşma bağları ve iş parçacığı bağları her ikisi de
2. adıma katılır.

Hiçbir hedef çözümlenemezse OpenClaw açık bir hata
(`Unable to resolve session target: ...`) döndürür.

## ACP denetimleri

| Komut                | Ne yapar                                                  | Örnek                                                        |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------ |
| `/acp spawn`         | ACP oturumu oluşturur; isteğe bağlı geçerli bağ veya iş parçacığı bağı. | `/acp spawn codex --bind here --cwd /repo`                   |
| `/acp cancel`        | Hedef oturum için devam eden dönüşü iptal eder.           | `/acp cancel agent:codex:acp:<uuid>`                         |
| `/acp steer`         | Çalışan oturuma yönlendirme talimatı gönderir.            | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Oturumu kapatır ve iş parçacığı hedeflerinin bağını kaldırır. | `/acp close`                                                 |
| `/acp status`        | Arka ucu, modu, durumu, çalışma zamanı seçeneklerini, yetenekleri gösterir. | `/acp status`                                                |
| `/acp set-mode`      | Hedef oturum için çalışma zamanı modunu ayarlar.          | `/acp set-mode plan`                                         |
| `/acp set`           | Genel çalışma zamanı config seçeneği yazımı.              | `/acp set model openai/gpt-5.4`                              |
| `/acp cwd`           | Çalışma zamanı çalışma dizini geçersiz kılmasını ayarlar. | `/acp cwd /Users/user/Projects/repo`                         |
| `/acp permissions`   | Onay ilkesi profilini ayarlar.                            | `/acp permissions strict`                                    |
| `/acp timeout`       | Çalışma zamanı zaman aşımını (saniye) ayarlar.            | `/acp timeout 120`                                           |
| `/acp model`         | Çalışma zamanı model geçersiz kılmasını ayarlar.          | `/acp model anthropic/claude-opus-4-6`                       |
| `/acp reset-options` | Oturum çalışma zamanı seçenek geçersiz kılmalarını kaldırır. | `/acp reset-options`                                         |
| `/acp sessions`      | Depodan son ACP oturumlarını listeler.                    | `/acp sessions`                                              |
| `/acp doctor`        | Arka uç sağlığı, yetenekler, uygulanabilir düzeltmeler.   | `/acp doctor`                                                |
| `/acp install`       | Deterministik kurulum ve etkinleştirme adımlarını yazdırır. | `/acp install`                                               |

`/acp status`, etkin çalışma zamanı seçeneklerini ve çalışma zamanı düzeyi ile
arka uç düzeyi oturum kimliklerini gösterir. Desteklenmeyen denetim hataları,
bir arka uçta yetenek eksik olduğunda açık biçimde görünür. `/acp sessions`,
depo verisini geçerli bağlı veya istekte bulunan oturum için okur; hedef belirteçleri
(`session-key`, `session-id` veya `session-label`), özel aracı başına `session.store`
kökleri dahil olmak üzere Gateway oturum keşfi üzerinden çözülür.

### Çalışma zamanı seçenekleri eşlemesi

`/acp`, kolaylık komutlarına ve genel bir ayarlayıcıya sahiptir. Eşdeğer
işlemler:

| Komut                      | Şuna eşlenir                         | Notlar                                                                                                                                                                           |
| -------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`          | çalışma zamanı config anahtarı `model` | Codex ACP için OpenClaw, `openai-codex/<model>` değerini adaptör model kimliğine normalleştirir ve `openai-codex/gpt-5.4/high` gibi eğik çizgili reasoning soneklerini `reasoning_effort` değerine eşler. |
| `/acp set thinking <level>` | çalışma zamanı config anahtarı `thinking` | Codex ACP için OpenClaw, adaptör bunu desteklediğinde karşılık gelen `reasoning_effort` değerini gönderir.                                                                     |
| `/acp permissions <profile>` | çalışma zamanı config anahtarı `approval_policy` | —                                                                                                                                                                                |
| `/acp timeout <seconds>`   | çalışma zamanı config anahtarı `timeout` | —                                                                                                                                                                                |
| `/acp cwd <path>`          | çalışma zamanı cwd geçersiz kılması   | Doğrudan güncelleme.                                                                                                                                                             |
| `/acp set <key> <value>`   | genel                                | `key=cwd`, cwd geçersiz kılma yolunu kullanır.                                                                                                                                   |
| `/acp reset-options`       | tüm çalışma zamanı geçersiz kılmalarını temizler | —                                                                                                                                                                                |

## acpx harness, Plugin kurulumu ve izinler

acpx harness yapılandırması (Claude Code / Codex / Gemini CLI
takma adları), Plugin-tools ve OpenClaw-tools MCP köprüleri ve ACP
izin modları için bkz.
[ACP agents — setup](/tr/tools/acp-agents-setup).

## Sorun giderme

| Belirti                                                                    | Muhtemel neden                                                                   | Çözüm                                                                                                                                                                      |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                    | Arka uç Plugin’i eksik, devre dışı veya `plugins.allow` tarafından engellenmiş. | Arka uç Plugin’ini kurun ve etkinleştirin, bu allowlist ayarlıysa `plugins.allow` içine `acpx` ekleyin, sonra `/acp doctor` çalıştırın.                                  |
| `ACP is disabled by policy (acp.enabled=false)`                            | ACP genel olarak devre dışı.                                                     | `acp.enabled=true` ayarlayın.                                                                                                                                              |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`          | Normal iş parçacığı mesajlarından dispatch devre dışı.                           | `acp.dispatch.enabled=true` ayarlayın.                                                                                                                                     |
| `ACP agent "<id>" is not allowed by policy`                                | Aracı allowlist içinde değil.                                                    | İzinli `agentId` kullanın veya `acp.allowedAgents` güncelleyin.                                                                                                            |
| `/acp doctor`, başlangıçtan hemen sonra arka ucun hazır olmadığını bildiriyor | Plugin bağımlılık yoklaması veya kendini onarma hâlâ çalışıyor.                 | Kısa süre bekleyip `/acp doctor` komutunu yeniden çalıştırın; sağlıksız kalırsa arka uç kurulum hatasını ve Plugin allow/deny ilkesini inceleyin.                        |
| Harness komutu bulunamadı                                                  | Adaptör CLI kurulu değil veya ilk çalıştırma `npx` getirmesi başarısız oldu.    | Adaptörü Gateway ana makinesinde kurun/önceden ısıtın veya acpx aracı komutunu açıkça yapılandırın.                                                                       |
| Harness’ten model not found                                                | Model kimliği başka bir sağlayıcı/harness için geçerli ama bu ACP hedefi için değil. | O harness tarafından listelenen bir model kullanın, modeli harness içinde yapılandırın veya geçersiz kılmayı kaldırın.                                                   |
| Harness’ten vendor auth hatası                                             | OpenClaw sağlıklı, ama hedef CLI/sağlayıcı oturum açmamış.                       | Gateway ana makinesi ortamında oturum açın veya gerekli sağlayıcı anahtarını sağlayın.                                                                                    |
| `Unable to resolve session target: ...`                                    | Hatalı anahtar/kimlik/etiket belirteci.                                          | `/acp sessions` çalıştırın, tam anahtarı/etiketi kopyalayın, yeniden deneyin.                                                                                             |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here`, etkin bağlanabilir konuşma olmadan kullanıldı.                   | Hedef sohbet/kanala gidin ve yeniden deneyin ya da bağsız başlatma kullanın.                                                                                               |
| `Conversation bindings are unavailable for <channel>.`                     | Adaptör, geçerli konuşma ACP bağlama yeteneğine sahip değil.                     | Desteklendiği yerde `/acp spawn ... --thread ...` kullanın, üst düzey `bindings[]` yapılandırın veya desteklenen bir kanala geçin.                                        |
| `--thread here requires running /acp spawn inside an active ... thread`    | `--thread here`, iş parçacığı bağlamı dışında kullanıldı.                        | Hedef iş parçacığına gidin veya `--thread auto`/`off` kullanın.                                                                                                            |
| `Only <user-id> can rebind this channel/conversation/thread.`              | Etkin bağ hedefinin sahibi başka bir kullanıcı.                                  | Sahibi olarak yeniden bağlayın veya farklı bir konuşma ya da iş parçacığı kullanın.                                                                                       |
| `Thread bindings are unavailable for <channel>.`                           | Adaptör iş parçacığı bağlama yeteneğine sahip değil.                             | `--thread off` kullanın veya desteklenen bir adaptör/kanala geçin.                                                                                                         |
| `Sandboxed sessions cannot spawn ACP sessions ...`                         | ACP çalışma zamanı ana makine tarafındadır; istekte bulunan oturum sandbox içindedir. | Sandbox içindeki oturumlardan `runtime="subagent"` kullanın veya ACP başlatmasını sandbox olmayan bir oturumdan yapın.                                                   |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`    | ACP çalışma zamanı için `sandbox="require"` istendi.                             | Zorunlu sandboxing için `runtime="subagent"` kullanın veya sandbox olmayan bir oturumdan `sandbox="inherit"` ile ACP kullanın.                                           |
| `Cannot apply --model ... did not advertise model support`                 | Hedef harness genel ACP model değiştirmeyi açığa çıkarmıyor.                     | ACP `models`/`session/set_model` ilan eden bir harness kullanın, Codex ACP model başvurularını kullanın veya modelin kendi başlangıç bayrağı varsa doğrudan harness içinde yapılandırın. |
| Bağlı oturum için ACP meta verisi eksik                                    | Bayat/silinmiş ACP oturum meta verisi.                                           | `/acp spawn` ile yeniden oluşturun, sonra iş parçacığını yeniden bağlayın/odaklayın.                                                                                      |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`   | `permissionMode`, etkileşimli olmayan ACP oturumunda yazma/exec işlemlerini engelliyor. | `plugins.entries.acpx.config.permissionMode` değerini `approve-all` yapın ve Gateway’i yeniden başlatın. Bkz. [Permission configuration](/tr/tools/acp-agents-setup#permission-configuration). |
| ACP oturumu az çıktı vererek erken başarısız oluyor                        | İzin istemleri `permissionMode`/`nonInteractivePermissions` tarafından engelleniyor. | Gateway günlüklerinde `AcpRuntimeError` arayın. Tam izinler için `permissionMode=approve-all`; kontrollü bozulma için `nonInteractivePermissions=deny` ayarlayın.      |
| ACP oturumu işi tamamladıktan sonra süresiz takılı kalıyor                 | Harness süreci bitti ama ACP oturumu tamamlanmayı bildirmedi.                    | `ps aux \| grep acpx` ile izleyin; bayat süreçleri elle sonlandırın.                                                                                                      |
| Harness `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` görüyor                    | Dahili olay zarfı ACP sınırının dışına sızmış.                                   | OpenClaw’ı güncelleyin ve tamamlanma akışını yeniden çalıştırın; harici harness’ler yalnızca düz tamamlanma istemleri almalıdır.                                        |

## İlgili

- [ACP agents — setup](/tr/tools/acp-agents-setup)
- [Agent send](/tr/tools/agent-send)
- [CLI Backends](/tr/gateway/cli-backends)
- [Codex harness](/tr/plugins/codex-harness)
- [Multi-agent sandbox tools](/tr/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (köprü modu)](/tr/cli/acp)
- [Sub-agents](/tr/tools/subagents)
