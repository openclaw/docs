---
read_when:
    - ACP üzerinden kodlama koşumlarını çalıştırma
    - Mesajlaşma kanallarında konuşmaya bağlı ACP oturumlarını ayarlama
    - Bir mesaj kanalı görüşmesini kalıcı bir ACP oturumuna bağlama
    - ACP arka ucu, Plugin bağlantılandırması veya tamamlama iletimi sorunlarını giderme
    - Sohbetten /acp komutlarını çalıştırma
sidebarTitle: ACP agents
summary: Harici kodlama düzeneklerini (Claude Code, Cursor, Gemini CLI, açık Codex ACP, OpenClaw ACP, OpenCode) ACP arka ucu üzerinden çalıştırın
title: ACP aracıları
x-i18n:
    generated_at: "2026-05-02T09:07:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec2404924cbb4c4cd0d94485bc7d8ea586c0ef5f4380e72d5212c8bd9d868c20
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) oturumları
OpenClaw'ın harici kodlama harness'larını (örneğin Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI ve diğer
desteklenen ACPX harness'ları) bir ACP arka uç Plugin'i üzerinden çalıştırmasını sağlar.

Her ACP oturumu başlatma işlemi bir [arka plan görevi](/tr/automation/tasks) olarak izlenir.

<Note>
**ACP, varsayılan Codex yolu değil, harici harness yoludur.** Yerel
Codex uygulama sunucusu Plugin'i `/codex ...` denetimlerinin ve
`agentRuntime.id: "codex"` gömülü çalışma zamanının sahibidir; ACP ise
`/acp ...` denetimlerinin ve `sessions_spawn({ runtime: "acp" })` oturumlarının sahibidir.

Codex veya Claude Code'un mevcut OpenClaw kanal konuşmalarına doğrudan
harici bir MCP istemcisi olarak bağlanmasını istiyorsanız, ACP yerine
[`openclaw mcp serve`](/tr/cli/mcp) kullanın.
</Note>

## Hangi sayfayı istiyorum?

| Şunu yapmak istiyorsunuz…                                                                       | Bunu kullanın                         | Notlar                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Geçerli konuşmada Codex'i bağlamak veya denetlemek                                               | `/codex bind`, `/codex threads`       | `codex` Plugin'i etkin olduğunda yerel Codex uygulama sunucusu yolu; bağlı sohbet yanıtları, görüntü iletme, model/hızlı/izinler, durdurma ve yönlendirme denetimlerini içerir. ACP açık bir yedektir |
| Claude Code, Gemini CLI, açık Codex ACP veya başka bir harici harness'ı OpenClaw _üzerinden_ çalıştırmak | Bu sayfa                              | Sohbete bağlı oturumlar, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, arka plan görevleri, çalışma zamanı denetimleri                                                                   |
| Bir OpenClaw Gateway oturumunu bir düzenleyici veya istemci için ACP sunucusu _olarak_ sunmak    | [`openclaw acp`](/tr/cli/acp)            | Köprü modu. IDE/istemci, stdio/WebSocket üzerinden OpenClaw ile ACP konuşur                                                                                                                   |
| Yerel bir AI CLI'ını yalnızca metin yedek modeli olarak yeniden kullanmak                        | [CLI Arka Uçları](/tr/gateway/cli-backends) | ACP değildir. OpenClaw araçları yok, ACP denetimleri yok, harness çalışma zamanı yok                                                                                                          |

## Bu kutudan çıktığı gibi çalışır mı?

Evet, resmi ACP çalışma zamanı Plugin'i yüklendikten sonra:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Kaynak checkout'ları, `pnpm install` sonrasında yerel `extensions/acpx`
çalışma alanı Plugin'ini kullanabilir. Hazırlık denetimi için `/acp doctor` çalıştırın.

OpenClaw, ajanlara ACP başlatmayı yalnızca ACP **gerçekten
kullanılabilir** olduğunda öğretir: ACP etkin olmalı, dağıtım devre dışı
olmamalı, geçerli oturum sandbox tarafından engellenmemeli ve bir çalışma
zamanı arka ucu yüklenmiş olmalıdır. Bu koşullar karşılanmıyorsa, ACP
Plugin becerileri ve `sessions_spawn` ACP rehberliği gizli kalır; böylece
ajan kullanılamayan bir arka uç önermez.

<AccordionGroup>
  <Accordion title="İlk çalıştırma sorunları">
    - `plugins.allow` ayarlanmışsa, bu kısıtlayıcı bir Plugin envanteridir ve **mutlaka** `acpx` içermelidir; aksi halde yüklü ACP arka ucu bilerek engellenir ve `/acp doctor` eksik izin listesi girdisini bildirir.
    - Codex ACP adaptörü `acpx` Plugin'iyle birlikte hazırlanır ve mümkün olduğunda yerel olarak başlatılır.
    - Diğer hedef harness adaptörleri, ilk kullandığınızda hâlâ `npx` ile isteğe bağlı olarak getirilebilir.
    - Bu harness için satıcı kimlik doğrulamasının ana makinede hâlâ mevcut olması gerekir.
    - Ana makinede npm veya ağ erişimi yoksa, önbellekler önceden ısıtılana veya adaptör başka bir şekilde yüklenene kadar ilk çalıştırma adaptör getirmeleri başarısız olur.

  </Accordion>
  <Accordion title="Çalışma zamanı ön koşulları">
    ACP gerçek bir harici harness süreci başlatır. OpenClaw yönlendirme,
    arka plan görevi durumu, teslimat, bağlamalar ve politikadan sorumludur;
    harness ise sağlayıcı oturum açma, model kataloğu, dosya sistemi davranışı
    ve yerel araçlardan sorumludur.

    OpenClaw'ı suçlamadan önce şunları doğrulayın:

    - `/acp doctor` etkin ve sağlıklı bir arka uç bildiriyor.
    - Bu izin listesi ayarlandığında hedef id, `acp.allowedAgents` tarafından izinli.
    - Harness komutu Gateway ana makinesinde başlatılabiliyor.
    - Bu harness için sağlayıcı kimlik doğrulaması mevcut (`claude`, `codex`, `gemini`, `opencode`, `droid` vb.).
    - Seçilen model bu harness için mevcut — model id'leri harness'lar arasında taşınabilir değildir.
    - İstenen `cwd` mevcut ve erişilebilir, ya da `cwd` değerini atlayıp arka ucun varsayılanını kullanmasına izin verin.
    - İzin modu yapılan işe uygun. Etkileşimsiz oturumlar yerel izin istemlerine tıklayamaz; bu yüzden yazma/çalıştırma ağırlıklı kodlama çalışmaları genellikle başsız ilerleyebilen bir ACPX izin profili gerektirir.

  </Accordion>
</AccordionGroup>

OpenClaw Plugin araçları ve yerleşik OpenClaw araçları varsayılan olarak
ACP harness'larına sunulmaz. Harness'ın bu araçları doğrudan çağırması
gerektiğinde yalnızca [ACP ajanları — kurulum](/tr/tools/acp-agents-setup)
içindeki açık MCP köprülerini etkinleştirin.

## Desteklenen harness hedefleri

`acpx` arka ucuyla, şu harness id'lerini `/acp spawn <id>` veya
`sessions_spawn({ runtime: "acp", agentId: "<id>" })` hedefleri olarak kullanın:

| Harness id | Tipik arka uç                                  | Notlar                                                                              |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP adaptörü                       | Ana makinede Claude Code kimlik doğrulaması gerektirir.                             |
| `codex`    | Codex ACP adaptörü                             | Yalnızca yerel `/codex` kullanılamadığında veya ACP istendiğinde açık ACP yedeği.   |
| `copilot`  | GitHub Copilot ACP adaptörü                    | Copilot CLI/çalışma zamanı kimlik doğrulaması gerektirir.                           |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Yerel bir kurulum farklı bir ACP giriş noktası sunuyorsa acpx komutunu geçersiz kılın. |
| `droid`    | Factory Droid CLI                              | Harness ortamında Factory/Droid kimlik doğrulaması veya `FACTORY_API_KEY` gerektirir. |
| `gemini`   | Gemini CLI ACP adaptörü                        | Gemini CLI kimlik doğrulaması veya API anahtarı kurulumu gerektirir.                |
| `iflow`    | iFlow CLI                                      | Adaptör kullanılabilirliği ve model denetimi yüklü CLI'a bağlıdır.                  |
| `kilocode` | Kilo Code CLI                                  | Adaptör kullanılabilirliği ve model denetimi yüklü CLI'a bağlıdır.                  |
| `kimi`     | Kimi/Moonshot CLI                              | Ana makinede Kimi/Moonshot kimlik doğrulaması gerektirir.                           |
| `kiro`     | Kiro CLI                                       | Adaptör kullanılabilirliği ve model denetimi yüklü CLI'a bağlıdır.                  |
| `opencode` | OpenCode ACP adaptörü                          | OpenCode CLI/sağlayıcı kimlik doğrulaması gerektirir.                               |
| `openclaw` | `openclaw acp` üzerinden OpenClaw Gateway köprüsü | ACP uyumlu bir harness'ın OpenClaw Gateway oturumuna geri konuşmasını sağlar.       |
| `pi`       | Pi/gömülü OpenClaw çalışma zamanı              | OpenClaw yerel harness deneyleri için kullanılır.                                   |
| `qwen`     | Qwen Code / Qwen CLI                           | Ana makinede Qwen uyumlu kimlik doğrulaması gerektirir.                             |

Özel acpx ajan takma adları acpx içinde yapılandırılabilir, ancak OpenClaw
politikası dağıtımdan önce yine `acp.allowedAgents` değerini ve varsa
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
    - Başlatma, bir ACP çalışma zamanı oturumu oluşturur veya sürdürür, ACP meta verilerini OpenClaw oturum deposuna kaydeder ve çalışma üst öğe sahipliyse bir arka plan görevi oluşturabilir.
    - Üst öğe sahipli ACP oturumları, çalışma zamanı oturumu kalıcı olsa bile arka plan işi olarak değerlendirilir; tamamlama ve yüzeyler arası teslimat, normal kullanıcıya dönük sohbet oturumu gibi davranmak yerine üst görev bildiricisi üzerinden gider.
    - Görev bakımı, terminal durumundaki veya sahipsiz üst öğe sahipli tek seferlik ACP oturumlarını kapatır. Etkin bir konuşma bağlaması kaldığı sürece kalıcı ACP oturumları korunur; etkin bağlaması olmayan eski kalıcı oturumlar kapatılır, böylece sahip görev bittiğinde veya görev kaydı kaybolduğunda sessizce sürdürülemezler.
    - Bağlı takip mesajları, bağlama kapatılana, odaktan çıkarılana, sıfırlanana veya süresi dolana kadar doğrudan ACP oturumuna gider.
    - Gateway komutları yerel kalır. `/acp ...`, `/status` ve `/unfocus` hiçbir zaman bağlı bir ACP harness'ına normal istem metni olarak gönderilmez.
    - `cancel`, arka uç iptali desteklediğinde etkin turu iptal eder; bağlamayı veya oturum meta verilerini silmez.
    - `close`, OpenClaw açısından ACP oturumunu sonlandırır ve bağlamayı kaldırır. Bir harness, sürdürmeyi destekliyorsa kendi üst akış geçmişini hâlâ tutabilir.
    - Boştaki çalışma zamanı işçileri `acp.runtime.ttlMinutes` sonrasında temizlemeye uygun hale gelir; saklanan oturum meta verileri `/acp sessions` için kullanılabilir kalır.

  </Accordion>
  <Accordion title="Yerel Codex yönlendirme kuralları">
    Etkin olduğunda **yerel Codex Plugin'ine** yönlendirilmesi gereken
    doğal dil tetikleyicileri:

    - "Bu Discord kanalını Codex'e bağla."
    - "Bu sohbeti Codex iş parçacığı `<id>` öğesine ekle."
    - "Codex iş parçacıklarını göster, sonra bunu bağla."

    Yerel Codex konuşma bağlaması varsayılan sohbet denetimi yoludur.
    OpenClaw dinamik araçları hâlâ OpenClaw üzerinden çalışırken,
    shell/apply-patch gibi Codex yerel araçları Codex içinde çalışır.
    Codex yerel araç olayları için OpenClaw, Plugin hook'larının
    `before_tool_call` olayını engelleyebilmesi, `after_tool_call` olayını
    gözlemleyebilmesi ve Codex `PermissionRequest` olaylarını OpenClaw
    onayları üzerinden yönlendirebilmesi için her turda yerel bir hook rölesi
    enjekte eder. Codex `Stop` hook'ları OpenClaw `before_agent_finalize`
    olayına iletilir; burada Plugin'ler Codex yanıtını sonlandırmadan önce
    bir model geçişi daha isteyebilir. Röle bilinçli olarak tutucu kalır:
    Codex yerel araç argümanlarını değiştirmez veya Codex iş parçacığı
    kayıtlarını yeniden yazmaz. ACP çalışma zamanı/oturum modelini istediğinizde
    yalnızca açık ACP kullanın. Gömülü Codex destek sınırı
    [Codex harness v1 destek sözleşmesi](/tr/plugins/codex-harness#v1-support-contract)
    içinde belgelenmiştir.

  </Accordion>
  <Accordion title="Model / sağlayıcı / çalışma zamanı seçimi kopya kağıdı">
    - `openai-codex/*` — PI Codex OAuth/abonelik rotası.
    - `openai/*` artı `agentRuntime.id: "codex"` — yerel Codex uygulama sunucusuna gömülü çalışma zamanı.
    - `/codex ...` — yerel Codex konuşma denetimi.
    - `/acp ...` veya `runtime: "acp"` — açık ACP/acpx denetimi.

  </Accordion>
  <Accordion title="ACP yönlendirmesi için doğal dil tetikleyicileri">
    ACP çalışma zamanına yönlendirilmesi gereken tetikleyiciler:

    - "Bunu tek seferlik bir Claude Code ACP oturumu olarak çalıştır ve sonucu özetle."
    - "Bu görev için Gemini CLI'ı bir iş parçacığında kullan, ardından takipleri aynı iş parçacığında tut."
    - "Codex'i ACP üzerinden arka plan iş parçacığında çalıştır."

    OpenClaw `runtime: "acp"` seçer, harness `agentId` değerini çözümler,
    desteklendiğinde geçerli konuşmaya veya iş parçacığına bağlar ve
    takipleri kapanana/süresi dolana kadar o oturuma yönlendirir. Codex bu yolu yalnızca
    ACP/acpx açık olduğunda veya istenen işlem için yerel Codex
    Plugin kullanılamadığında izler.

    `sessions_spawn` için `runtime: "acp"` yalnızca ACP
    etkinleştirildiğinde, istekte bulunan sandbox içinde olmadığında ve bir ACP çalışma zamanı
    arka ucu yüklendiğinde duyurulur. `acp.dispatch.enabled=false` otomatik
    ACP iş parçacığı dağıtımını duraklatır ancak açık
    `sessions_spawn({ runtime: "acp" })` çağrılarını gizlemez veya engellemez. `codex`,
    `claude`, `droid`, `gemini` veya `opencode` gibi ACP harness kimliklerini hedefler. Bu giriş
    açıkça `agents.list[].runtime.type="acp"` ile yapılandırılmadıkça
    `agents_list` içinden normal bir OpenClaw config ajan kimliği geçirmeyin;
    aksi halde varsayılan alt ajan çalışma zamanını kullanın. Bir OpenClaw ajanı
    `runtime.type="acp"` ile yapılandırıldığında OpenClaw, alttaki harness kimliği olarak
    `runtime.acp.agent` kullanır.

  </Accordion>
</AccordionGroup>

## ACP ile alt ajanlar karşılaştırması

Harici bir harness çalışma zamanı istediğinizde ACP kullanın. `codex`
Plugin etkin olduğunda Codex konuşma bağlama/denetimi için **yerel Codex
uygulama sunucusu** kullanın. OpenClaw yerelinde
yetkilendirilmiş çalıştırmalar istediğinizde **alt ajanları** kullanın.

| Alan          | ACP oturumu                           | Alt ajan çalıştırması                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Çalışma zamanı       | ACP arka uç Plugin'i (örneğin acpx) | OpenClaw yerel alt ajan çalışma zamanı  |
| Oturum anahtarı   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Ana komutlar | `/acp ...`                            | `/subagents ...`                   |
| Başlatma aracı    | `runtime:"acp"` ile `sessions_spawn` | `sessions_spawn` (varsayılan çalışma zamanı) |

Ayrıca bkz. [Alt ajanlar](/tr/tools/subagents).

## ACP, Claude Code'u nasıl çalıştırır

ACP üzerinden Claude Code için yığın şöyledir:

1. OpenClaw ACP oturum denetim düzlemi.
2. Resmi `@openclaw/acpx` çalışma zamanı Plugin'i.
3. Claude ACP bağdaştırıcısı.
4. Claude tarafı çalışma zamanı/oturum mekanizması.

ACP Claude, ACP denetimleri, oturum sürdürme,
arka plan görev takibi ve isteğe bağlı konuşma/iş parçacığı bağlama özelliklerine sahip bir **harness oturumudur**.

CLI arka uçları ayrı, yalnızca metin tabanlı yerel geri dönüş çalışma zamanlarıdır; bkz.
[CLI Arka Uçları](/tr/gateway/cli-backends).

Operatörler için pratik kural şudur:

- **`/acp spawn`, bağlanabilir oturumlar, çalışma zamanı denetimleri veya kalıcı harness çalışması mı istiyorsunuz?** ACP kullanın.
- **Ham CLI üzerinden basit yerel metin geri dönüşü mü istiyorsunuz?** CLI arka uçlarını kullanın.

## Bağlı oturumlar

### Zihinsel model

- **Sohbet yüzeyi** — insanların konuşmayı sürdürdüğü yer (Discord kanalı, Telegram konusu, iMessage sohbeti).
- **ACP oturumu** — OpenClaw'ın yönlendirdiği dayanıklı Codex/Claude/Gemini çalışma zamanı durumu.
- **Alt iş parçacığı/konu** — yalnızca `--thread ...` tarafından oluşturulan isteğe bağlı ek mesajlaşma yüzeyi.
- **Çalışma zamanı çalışma alanı** — harness'in çalıştığı dosya sistemi konumu (`cwd`, repo checkout, arka uç çalışma alanı). Sohbet yüzeyinden bağımsızdır.

### Geçerli konuşma bağları

`/acp spawn <harness> --bind here`, geçerli konuşmayı
başlatılan ACP oturumuna sabitler; alt iş parçacığı yoktur, aynı sohbet yüzeyi kullanılır. OpenClaw
taşıma, kimlik doğrulama, güvenlik ve teslimi sahiplenmeye devam eder. Bu
konuşmadaki takip mesajları aynı oturuma yönlendirilir; `/new` ve `/reset`
oturumu yerinde sıfırlar; `/acp close` bağı kaldırır.

Örnekler:

```text
/codex bind                                              # yerel Codex bağı, gelecekteki mesajları buraya yönlendir
/codex model gpt-5.4                                     # bağlı yerel Codex iş parçacığını ayarla
/codex stop                                              # etkin yerel Codex turunu denetle
/acp spawn codex --bind here                             # Codex için açık ACP geri dönüşü
/acp spawn codex --thread auto                           # alt iş parçacığı/konu oluşturabilir ve oraya bağlayabilir
/acp spawn codex --bind here --cwd /workspace/repo       # aynı sohbet bağı, Codex /workspace/repo içinde çalışır
```

<AccordionGroup>
  <Accordion title="Bağlama kuralları ve münhasırlık">
    - `--bind here` ve `--thread ...` karşılıklı olarak dışlayıcıdır.
    - `--bind here` yalnızca geçerli konuşma bağlamayı duyuran kanallarda çalışır; aksi halde OpenClaw net bir desteklenmiyor mesajı döndürür. Bağlar Gateway yeniden başlatmaları arasında kalıcıdır.
    - Discord'da `spawnSessions`, `--thread auto|here` için alt iş parçacığı oluşturmayı denetler; `--bind here` için değil.
    - `--cwd` olmadan farklı bir ACP ajanına başlatırsanız OpenClaw varsayılan olarak **hedef ajanın** çalışma alanını devralır. Eksik devralınan yollar (`ENOENT`/`ENOTDIR`) arka uç varsayılanına geri döner; diğer erişim hataları (örn. `EACCES`) başlatma hataları olarak görünür.
    - Gateway yönetim komutları bağlı konuşmalarda yerel kalır; normal takip metni bağlı ACP oturumuna yönlendirilse bile `/acp ...` komutları OpenClaw tarafından işlenir; `/status` ve `/unfocus` da ilgili yüzey için komut işleme etkin olduğunda yerel kalır.

  </Accordion>
  <Accordion title="İş parçacığına bağlı oturumlar">
    Bir kanal bağdaştırıcısı için iş parçacığı bağları etkinleştirildiğinde:

    - OpenClaw bir iş parçacığını hedef ACP oturumuna bağlar.
    - Bu iş parçacığındaki takip mesajları bağlı ACP oturumuna yönlendirilir.
    - ACP çıktısı aynı iş parçacığına geri teslim edilir.
    - Odaktan çıkarma/kapatma/arşivleme/boşta kalma zaman aşımı veya azami yaş süresinin dolması bağı kaldırır.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` ve `/unfocus` Gateway komutlarıdır; ACP harness'ine gönderilen istemler değildir.

    İş parçacığına bağlı ACP için gerekli özellik bayrakları:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` varsayılan olarak açıktır (otomatik ACP iş parçacığı dağıtımını duraklatmak için `false` olarak ayarlayın; açık `sessions_spawn({ runtime: "acp" })` çağrıları çalışmaya devam eder).
    - Kanal bağdaştırıcısı iş parçacığı oturumu başlatmaları etkin (varsayılan: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    İş parçacığı bağlama desteği bağdaştırıcıya özeldir. Etkin kanal
    bağdaştırıcısı iş parçacığı bağlarını desteklemiyorsa OpenClaw net bir
    desteklenmiyor/kullanılamıyor mesajı döndürür.

  </Accordion>
  <Accordion title="İş parçacığı destekleyen kanallar">
    - Oturum/iş parçacığı bağlama yeteneği sunan herhangi bir kanal bağdaştırıcısı.
    - Geçerli yerleşik destek: **Discord** iş parçacıkları/kanalları, **Telegram** konuları (gruplarda/süper gruplarda forum konuları ve DM konuları).
    - Plugin kanalları aynı bağlama arayüzü üzerinden destek ekleyebilir.

  </Accordion>
</AccordionGroup>

## Kalıcı kanal bağları

Geçici olmayan iş akışları için üst düzey `bindings[]` girişlerinde
kalıcı ACP bağlarını yapılandırın.

### Bağlama modeli

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

- OpenClaw, yapılandırılmış ACP oturumunun kullanımdan önce var olmasını sağlar.
- O kanaldaki veya konudaki mesajlar yapılandırılmış ACP oturumuna yönlendirilir.
- Bağlı konuşmalarda `/new` ve `/reset`, aynı ACP oturum anahtarını yerinde sıfırlar.
- Geçici çalışma zamanı bağları (örneğin iş parçacığı odak akışları tarafından oluşturulanlar) bulundukları yerde uygulanmaya devam eder.
- Açık bir `cwd` olmadan ajanlar arası ACP başlatmaları için OpenClaw hedef ajan çalışma alanını ajan yapılandırmasından devralır.
- Eksik devralınan çalışma alanı yolları arka ucun varsayılan cwd değerine geri döner; eksik olmayan erişim hataları başlatma hataları olarak görünür.

## ACP oturumlarını başlatma

Bir ACP oturumu başlatmanın iki yolu vardır:

<Tabs>
  <Tab title="sessions_spawn'dan">
    Bir ajan turundan veya araç çağrısından ACP oturumu başlatmak için
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
    `runtime` varsayılan olarak `subagent` değerine ayarlanır, bu yüzden ACP oturumları
    için `runtime: "acp"` değerini açıkça ayarlayın. `agentId` atlanırsa, OpenClaw
    yapılandırıldığında `acp.defaultAgent` değerini kullanır. `mode: "session"` kalıcı,
    bağlı bir konuşmayı korumak için `thread: true` gerektirir.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Sohbetten açık operatör kontrolü için `/acp spawn` kullanın.

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
  ACP hedef harness kimliği. Ayarlanmışsa `acp.defaultAgent` değerine geri döner.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Desteklendiği yerlerde iş parçacığı bağlama akışını ister.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` tek seferliktir; `"session"` kalıcıdır. `thread: true` ise ve
  `mode` atlanırsa, OpenClaw çalışma zamanı yoluna göre varsayılan olarak kalıcı
  davranışı kullanabilir. `mode: "session"` için `thread: true` gerekir.
</ParamField>
<ParamField path="cwd" type="string">
  İstenen çalışma zamanı çalışma dizini (arka uç/çalışma zamanı
  ilkesi tarafından doğrulanır). Atlanırsa, ACP spawn yapılandırıldığında
  hedef aracı çalışma alanını devralır; eksik devralınan yollar arka uç
  varsayılanlarına geri dönerken gerçek erişim hataları döndürülür.
</ParamField>
<ParamField path="label" type="string">
  Oturum/banner metninde kullanılan operatöre dönük etiket.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Yeni bir ACP oturumu oluşturmak yerine mevcut bir ACP oturumunu sürdürür. Aracı,
  konuşma geçmişini `session/load` üzerinden yeniden oynatır. `runtime: "acp"` gerektirir.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"`, ilk ACP çalıştırma ilerleme özetlerini sistem olayları olarak
  istekte bulunan oturuma geri akıtır. Kabul edilen yanıtlar, tam aktarma geçmişi
  için takip edebileceğiniz oturum kapsamlı JSONL günlüğüne
  (`<sessionId>.acp-stream.jsonl`) işaret eden `streamLogPath` içerir.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  ACP alt turunu N saniye sonra iptal eder. `0`, turu Gateway'in zaman aşımı
  olmayan yolunda tutar. Aynı değer Gateway çalıştırmasına ve ACP çalışma zamanına
  uygulanır; böylece takılmış/kotası tükenmiş harness'ler üst aracı şeridini
  süresiz olarak işgal etmez.
</ParamField>
<ParamField path="model" type="string">
  ACP alt oturumu için açık model geçersiz kılması. Codex ACP spawn işlemleri,
  `session/new` öncesinde `openai-codex/gpt-5.4` gibi OpenClaw Codex referanslarını
  Codex ACP başlangıç yapılandırmasına normalleştirir; `openai-codex/gpt-5.4/high`
  gibi slash biçimleri de Codex ACP akıl yürütme çabasını ayarlar.
  Diğer harness'ler ACP `models` değerlerini duyurmalı ve
  `session/set_model` desteği sunmalıdır; aksi halde OpenClaw/acpx hedef aracı
  varsayılanına sessizce geri dönmek yerine açıkça başarısız olur.
</ParamField>
<ParamField path="thinking" type="string">
  Açık düşünme/akıl yürütme çabası. Codex ACP için `minimal` düşük çabaya eşlenir,
  `low`/`medium`/`high`/`xhigh` doğrudan eşlenir ve `off` akıl yürütme çabası
  başlangıç geçersiz kılmasını atlar.
</ParamField>

## Spawn bağlama ve iş parçacığı modları

<Tabs>
  <Tab title="--bind here|off">
    | Mod    | Davranış                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Geçerli etkin konuşmayı yerinde bağla; etkin konuşma yoksa başarısız ol. |
    | `off`  | Geçerli konuşma bağlaması oluşturma.                                   |

    Notlar:

    - `--bind here`, "bu kanalı veya sohbeti Codex destekli yap" için en basit operatör yoludur.
    - `--bind here` alt iş parçacığı oluşturmaz.
    - `--bind here` yalnızca geçerli konuşma bağlama desteğini açığa çıkaran kanallarda kullanılabilir.
    - `--bind` ve `--thread` aynı `/acp spawn` çağrısında birlikte kullanılamaz.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mod    | Davranış                                                                                           |
    | ------ | -------------------------------------------------------------------------------------------------- |
    | `auto` | Etkin bir iş parçacığında: o iş parçacığını bağla. İş parçacığı dışında: desteklenirse alt iş parçacığı oluştur/bağla. |
    | `here` | Geçerli etkin iş parçacığını gerektir; içinde değilse başarısız ol.                                |
    | `off`  | Bağlama yok. Oturum bağlanmamış başlar.                                                            |

    Notlar:

    - İş parçacığı bağlama yüzeyi olmayan yerlerde varsayılan davranış fiilen `off` olur.
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
    Etkileşimli oturumlar görünür bir sohbet yüzeyinde konuşmayı sürdürmek içindir:

    - `/acp spawn ... --bind here`, geçerli konuşmayı ACP oturumuna bağlar.
    - `/acp spawn ... --thread ...`, bir kanal iş parçacığını/konusunu ACP oturumuna bağlar.
    - Kalıcı yapılandırılmış `bindings[].type="acp"`, eşleşen konuşmaları aynı ACP oturumuna yönlendirir.

    Bağlı konuşmadaki takip mesajları doğrudan ACP oturumuna yönlendirilir
    ve ACP çıktısı aynı kanala/iş parçacığına/konuya geri teslim edilir.

    OpenClaw'un harness'e gönderdiği:

    - Normal bağlı takipler istem metni olarak gönderilir; ekler yalnızca harness/arka uç desteklediğinde eklenir.
    - `/acp` yönetim komutları ve yerel Gateway komutları ACP gönderiminden önce yakalanır.
    - Çalışma zamanı tarafından üretilen tamamlama olayları hedef başına somutlaştırılır. OpenClaw aracıları OpenClaw'un dahili çalışma zamanı bağlam zarfını alır; harici ACP harness'leri alt sonuç ve talimatla düz bir istem alır. Ham `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` zarfı harici harness'lere asla gönderilmemeli veya ACP kullanıcı transkripti metni olarak kalıcılaştırılmamalıdır.
    - ACP transkript girdileri kullanıcıya görünür tetikleyici metni veya düz tamamlama istemini kullanır. Dahili olay meta verileri mümkün olduğunda OpenClaw içinde yapılandırılmış kalır ve kullanıcı tarafından yazılmış sohbet içeriği olarak değerlendirilmez.

  </Accordion>
  <Accordion title="Üst tarafından sahiplenilen tek seferlik ACP oturumları">
    Başka bir aracı çalıştırması tarafından spawn edilen tek seferlik ACP oturumları,
    alt aracılara benzer şekilde arka plan alt öğeleri olarak çalışır:

    - Üst, `sessions_spawn({ runtime: "acp", mode: "run" })` ile iş ister.
    - Alt, kendi ACP harness oturumunda çalışır.
    - Alt turlar, yerel alt aracı spawn işlemlerinin kullandığı aynı arka plan şeridinde çalışır; bu yüzden yavaş bir ACP harness'i ilgisiz ana oturum işini engellemez.
    - Tamamlama, görev tamamlama duyuru yolu üzerinden geri raporlanır. OpenClaw, dahili tamamlama meta verilerini harici bir harness'e göndermeden önce düz bir ACP istemine dönüştürür; böylece harness'ler yalnızca OpenClaw'a ait çalışma zamanı bağlam işaretleyicilerini görmez.
    - Üst, kullanıcıya dönük bir yanıt yararlı olduğunda alt sonucu normal asistan sesiyle yeniden yazar.

    Bu yolu üst ve alt arasında eşler arası sohbet olarak **değerlendirmeyin**.
    Altın zaten üste geri dönen bir tamamlama kanalı vardır.

  </Accordion>
  <Accordion title="sessions_send ve A2A teslimi">
    `sessions_send`, spawn sonrasında başka bir oturumu hedefleyebilir. Normal
    eş oturumlar için OpenClaw, mesajı enjekte ettikten sonra aracıdan aracıya
    (A2A) takip yolu kullanır:

    - Hedef oturumun yanıtını bekle.
    - İsteğe bağlı olarak istekte bulunan ile hedefin sınırlı sayıda takip turu alışverişi yapmasına izin ver.
    - Hedeften bir duyuru mesajı üretmesini iste.
    - Bu duyuruyu görünür kanala veya iş parçacığına teslim et.

    Bu A2A yolu, gönderenin görünür bir takibe ihtiyaç duyduğu eş gönderimleri
    için bir geri dönüş yoludur. İlgisiz bir oturumun bir ACP hedefini görebildiği
    ve ona mesaj gönderebildiği durumlarda, örneğin geniş
    `tools.sessions.visibility` ayarları altında, etkin kalır.

    OpenClaw, A2A takibini yalnızca istekte bulunan kendi üst tarafından
    sahiplenilen tek seferlik ACP altının üstü olduğunda atlar. Bu durumda,
    görev tamamlamanın üzerine A2A çalıştırmak üstü altın sonucuyla uyandırabilir,
    üstün yanıtını alta geri iletebilir ve bir üst/alt yankı döngüsü oluşturabilir.
    `sessions_send` sonucu, sonucun sorumluluğu zaten tamamlama yolunda olduğu için
    bu sahiplenilen alt durumunda `delivery.status="skipped"` raporlar.

  </Accordion>
  <Accordion title="Mevcut oturumu sürdürme">
    Yeni başlamak yerine önceki bir ACP oturumuna devam etmek için `resumeSessionId`
    kullanın. Aracı, konuşma geçmişini `session/load` üzerinden yeniden oynatır;
    böylece daha önce olanların tam bağlamıyla devam eder.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Yaygın kullanım durumları:

    - Codex oturumunu dizüstü bilgisayarınızdan telefonunuza devredin; aracınıza kaldığınız yerden devam etmesini söyleyin.
    - CLI içinde etkileşimli olarak başlattığınız kodlama oturumuna artık aracınız üzerinden başsız şekilde devam edin.
    - Gateway yeniden başlatması veya boşta kalma zaman aşımı nedeniyle kesilen işi devam ettirin.

    Notlar:

    - `resumeSessionId` yalnızca `runtime: "acp"` olduğunda geçerlidir; varsayılan alt aracı çalışma zamanı bu yalnızca ACP alanını yok sayar.
    - `streamTo` yalnızca `runtime: "acp"` olduğunda geçerlidir; varsayılan alt aracı çalışma zamanı bu yalnızca ACP alanını yok sayar.
    - `resumeSessionId`, ana makineye yerel bir ACP/harness sürdürme kimliğidir; OpenClaw kanal oturum anahtarı değildir. OpenClaw gönderimden önce ACP spawn ilkesini ve hedef aracı ilkesini yine denetlerken, bu upstream kimliği yükleme yetkilendirmesinin sahibi ACP arka ucu veya harness'tir.
    - `resumeSessionId`, upstream ACP konuşma geçmişini geri yükler; `thread` ve `mode` oluşturduğunuz yeni OpenClaw oturumuna normal şekilde uygulanmaya devam eder, bu yüzden `mode: "session"` yine `thread: true` gerektirir.
    - Hedef aracı `session/load` desteği sunmalıdır (Codex ve Claude Code sunar).
    - Oturum kimliği bulunamazsa spawn açık bir hatayla başarısız olur; yeni oturuma sessiz geri dönüş yapılmaz.

  </Accordion>
  <Accordion title="Dağıtım sonrası smoke testi">
    Bir Gateway dağıtımından sonra, birim testlere güvenmek yerine canlı uçtan uca
    denetim çalıştırın:

    1. Hedef ana makinede dağıtılmış Gateway sürümünü ve commit'i doğrulayın.
    2. Canlı bir aracıya geçici ACPX köprü oturumu açın.
    3. Bu aracıdan `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` ve `Reply with exactly LIVE-ACP-SPAWN-OK` göreviyle `sessions_spawn` çağırmasını isteyin.
    4. `accepted=yes`, gerçek bir `childSessionKey` ve doğrulayıcı hatası olmadığını doğrulayın.
    5. Geçici köprü oturumunu temizleyin.

    Geçidi `mode: "run"` üzerinde tutun ve `streamTo: "parent"` değerini atlayın;
    iş parçacığına bağlı `mode: "session"` ve akış aktarma yolları ayrı, daha zengin
    entegrasyon geçişleridir.

  </Accordion>
</AccordionGroup>

## Sandbox uyumluluğu

ACP oturumları şu anda OpenClaw sandbox içinde **değil**, ana makine çalışma zamanında çalışır.

<Warning>
**Güvenlik sınırı:**

- Dış harness, kendi CLI izinlerine ve seçili `cwd` değerine göre okuyup yazabilir.
- OpenClaw'ın sandbox politikası ACP harness yürütmesini **sarmalamaz**.
- OpenClaw yine de ACP özellik kapılarını, izin verilen aracıları, oturum sahipliğini, kanal bağlamalarını ve Gateway teslim politikasını zorunlu kılar.
- Sandbox uygulanan OpenClaw'a özgü işler için `runtime: "subagent"` kullanın.

</Warning>

Mevcut sınırlamalar:

- İstekte bulunan oturum sandbox içindeyse ACP başlatmaları hem `sessions_spawn({ runtime: "acp" })` hem de `/acp spawn` için engellenir.
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
3. Geçerli istekte bulunan oturum yedeği.

Geçerli konuşma bağlamaları ve iş parçacığı bağlamalarının ikisi de
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
| `/acp set`           | Genel çalışma zamanı yapılandırma seçeneği yazımı.         | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Çalışma zamanı çalışma dizini geçersiz kılmasını ayarlar.  | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Onay politikası profilini ayarlar.                         | `/acp permissions strict`                                     |
| `/acp timeout`       | Çalışma zamanı zaman aşımını (saniye) ayarlar.             | `/acp timeout 120`                                            |
| `/acp model`         | Çalışma zamanı model geçersiz kılmasını ayarlar.           | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Oturum çalışma zamanı seçeneği geçersiz kılmalarını kaldırır. | `/acp reset-options`                                          |
| `/acp sessions`      | Depodaki son ACP oturumlarını listeler.                    | `/acp sessions`                                               |
| `/acp doctor`        | Arka uç sağlığı, yetenekler, uygulanabilir düzeltmeler.    | `/acp doctor`                                                 |
| `/acp install`       | Belirleyici kurulum ve etkinleştirme adımlarını yazdırır.  | `/acp install`                                                |

`/acp status`, etkin çalışma zamanı seçeneklerini ve çalışma zamanı düzeyi ile
arka uç düzeyi oturum tanımlayıcılarını gösterir. Bir arka uçta bir yetenek
olmadığında desteklenmeyen kontrol hataları açıkça gösterilir. `/acp sessions`,
geçerli bağlı oturum veya istekte bulunan oturum için depoyu okur; hedef belirteçleri
(`session-key`, `session-id` veya `session-label`), özel aracı başına `session.store`
kökleri dahil olmak üzere gateway oturum keşfi üzerinden çözümlenir.

### Çalışma zamanı seçenekleri eşlemesi

`/acp` kolaylık komutlarına ve genel bir ayarlayıcıya sahiptir. Eşdeğer
işlemler:

| Komut                        | Şuna eşlenir                         | Notlar                                                                                                                                                                        |
| ---------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | çalışma zamanı yapılandırma anahtarı `model` | Codex ACP için OpenClaw, `openai-codex/<model>` değerini adaptör model kimliğine normalleştirir ve `openai-codex/gpt-5.4/high` gibi eğik çizgili akıl yürütme son eklerini `reasoning_effort` değerine eşler. |
| `/acp set thinking <level>`  | çalışma zamanı yapılandırma anahtarı `thinking` | Codex ACP için OpenClaw, adaptörün desteklediği yerde karşılık gelen `reasoning_effort` değerini gönderir.                                                                    |
| `/acp permissions <profile>` | çalışma zamanı yapılandırma anahtarı `approval_policy` | —                                                                                                                                                                            |
| `/acp timeout <seconds>`     | çalışma zamanı yapılandırma anahtarı `timeout` | —                                                                                                                                                                            |
| `/acp cwd <path>`            | çalışma zamanı cwd geçersiz kılması | Doğrudan güncelleme.                                                                                                                                                          |
| `/acp set <key> <value>`     | genel                                | `key=cwd`, cwd geçersiz kılma yolunu kullanır.                                                                                                                                |
| `/acp reset-options`         | tüm çalışma zamanı geçersiz kılmalarını temizler | —                                                                                                                                                                            |

## acpx harness, Plugin kurulumu ve izinler

acpx harness yapılandırması (Claude Code / Codex / Gemini CLI
takma adları), plugin-tools ve OpenClaw-tools MCP köprüleri ve ACP
izin modları için bkz.
[ACP aracıları — kurulum](/tr/tools/acp-agents-setup).

## Sorun giderme

| Belirti                                                                     | Olası neden                                                                                                            | Çözüm                                                                                                                                                                    |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Arka uç Plugin eksik, devre dışı veya `plugins.allow` tarafından engellenmiş.                                          | Arka uç Plugin'i kurup etkinleştirin, bu izin listesi ayarlandığında `plugins.allow` içine `acpx` ekleyin, ardından `/acp doctor` çalıştırın.                           |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP genel olarak devre dışı.                                                                                          | `acp.enabled=true` olarak ayarlayın.                                                                                                                                    |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Normal iş parçacığı mesajlarından otomatik gönderim devre dışı.                                                       | Otomatik iş parçacığı yönlendirmesini sürdürmek için `acp.dispatch.enabled=true` olarak ayarlayın; açık `sessions_spawn({ runtime: "acp" })` çağrıları çalışmaya devam eder. |
| `ACP agent "<id>" is not allowed by policy`                                 | Aracı izin listesinde değil.                                                                                          | İzin verilen `agentId` kullanın veya `acp.allowedAgents` değerini güncelleyin.                                                                                          |
| `/acp doctor` reports backend not ready right after startup                 | Arka uç Plugin eksik, devre dışı, izin/red ilkesi tarafından engellenmiş veya yapılandırılmış çalıştırılabilir dosyası kullanılamıyor. | Arka uç Plugin'i kurun/etkinleştirin, `/acp doctor` komutunu yeniden çalıştırın ve sağlıksız kalırsa arka uç kurulumunu ya da ilke hatasını inceleyin.                 |
| Harness command not found                                                   | Bağdaştırıcı CLI kurulu değil, harici Plugin eksik veya Codex dışı bir bağdaştırıcı için ilk çalıştırma `npx` getirmesi başarısız oldu. | `/acp doctor` çalıştırın, bağdaştırıcıyı Gateway ana makinesinde kurun/önceden ısıtın veya acpx aracı komutunu açıkça yapılandırın.                                     |
| Model-not-found from the harness                                            | Model kimliği başka bir sağlayıcı/harness için geçerli, ancak bu ACP hedefi için geçerli değil.                       | Bu harness tarafından listelenen bir model kullanın, modeli harness içinde yapılandırın veya geçersiz kılmayı atlayın.                                                   |
| Vendor auth error from the harness                                          | OpenClaw sağlıklı, ancak hedef CLI/sağlayıcı oturum açmamış.                                                          | Gateway ana makine ortamında oturum açın veya gerekli sağlayıcı anahtarını sağlayın.                                                                                    |
| `Unable to resolve session target: ...`                                     | Hatalı anahtar/kimlik/etiket belirteci.                                                                               | `/acp sessions` çalıştırın, tam anahtarı/etiketi kopyalayın ve yeniden deneyin.                                                                                         |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here`, etkin bağlanabilir bir konuşma olmadan kullanıldı.                                                     | Hedef sohbete/kanala geçip yeniden deneyin veya bağlanmamış spawn kullanın.                                                                                             |
| `Conversation bindings are unavailable for <channel>.`                      | Bağdaştırıcıda geçerli konuşma ACP bağlama yeteneği yok.                                                              | Desteklendiği yerlerde `/acp spawn ... --thread ...` kullanın, üst düzey `bindings[]` yapılandırın veya desteklenen bir kanala geçin.                                  |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here`, iş parçacığı bağlamı dışında kullanıldı.                                                             | Hedef iş parçacığına geçin veya `--thread auto`/`off` kullanın.                                                                                                         |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Etkin bağlama hedefinin sahibi başka bir kullanıcı.                                                                   | Sahip olarak yeniden bağlayın veya farklı bir konuşma ya da iş parçacığı kullanın.                                                                                      |
| `Thread bindings are unavailable for <channel>.`                            | Bağdaştırıcıda iş parçacığı bağlama yeteneği yok.                                                                     | `--thread off` kullanın veya desteklenen bağdaştırıcıya/kanala geçin.                                                                                                   |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP çalışma zamanı ana makine tarafındadır; istekte bulunan oturum sandbox içindedir.                                | Sandbox içindeki oturumlardan `runtime="subagent"` kullanın veya ACP spawn'ı sandbox içinde olmayan bir oturumdan çalıştırın.                                          |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP çalışma zamanı için `sandbox="require"` istendi.                                                                  | Zorunlu sandbox için `runtime="subagent"` kullanın veya sandbox içinde olmayan bir oturumdan `sandbox="inherit"` ile ACP kullanın.                                      |
| `Cannot apply --model ... did not advertise model support`                  | Hedef harness genel ACP model değiştirmeyi açığa çıkarmıyor.                                                          | ACP `models`/`session/set_model` duyuran bir harness kullanın, Codex ACP model başvurularını kullanın veya kendi başlangıç bayrağı varsa modeli doğrudan harness içinde yapılandırın. |
| Missing ACP metadata for bound session                                      | Eski/silinmiş ACP oturum metaverisi.                                                                                  | `/acp spawn` ile yeniden oluşturun, ardından iş parçacığını yeniden bağlayın/odağa alın.                                                                                |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode`, etkileşimsiz ACP oturumunda yazma/çalıştırmayı engelliyor.                                         | `plugins.entries.acpx.config.permissionMode` değerini `approve-all` olarak ayarlayın ve Gateway'i yeniden başlatın. Bkz. [İzin yapılandırması](/tr/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | İzin istemleri `permissionMode`/`nonInteractivePermissions` tarafından engelleniyor.                                  | Gateway günlüklerinde `AcpRuntimeError` denetleyin. Tam izinler için `permissionMode=approve-all` olarak ayarlayın; kademeli bozulma için `nonInteractivePermissions=deny` olarak ayarlayın. |
| ACP session stalls indefinitely after completing work                       | Harness işlemi bitti ancak ACP oturumu tamamlanma bildirmedi.                                                         | `ps aux \| grep acpx` ile izleyin; eski işlemleri elle sonlandırın.                                                                                                    |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Dahili olay zarfı ACP sınırından sızdı.                                                                               | OpenClaw'ı güncelleyin ve tamamlama akışını yeniden çalıştırın; harici harness'ler yalnızca düz tamamlama istemleri almalıdır.                                         |

## İlgili

- [ACP aracıları — kurulum](/tr/tools/acp-agents-setup)
- [Aracı gönderimi](/tr/tools/agent-send)
- [CLI arka uçları](/tr/gateway/cli-backends)
- [Codex harness](/tr/plugins/codex-harness)
- [Çok aracılı sandbox araçları](/tr/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (köprü modu)](/tr/cli/acp)
- [Alt aracılar](/tr/tools/subagents)
