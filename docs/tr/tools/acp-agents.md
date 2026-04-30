---
read_when:
    - Kodlama harness’larını ACP üzerinden çalıştırma
    - Mesajlaşma kanallarında sohbete bağlı ACP oturumlarını ayarlama
    - Bir mesaj kanalı konuşmasını kalıcı bir ACP oturumuna bağlama
    - ACP arka ucu, Plugin bağlantı yapılandırması veya tamamlama iletimi sorunlarını giderme
    - Sohbetten /acp komutlarını çalıştırma
sidebarTitle: ACP agents
summary: Harici kodlama çalıştırma düzeneklerini (Claude Code, Cursor, Gemini CLI, açık Codex ACP, OpenClaw ACP, OpenCode) ACP arka ucu üzerinden çalıştırın
title: ACP aracıları
x-i18n:
    generated_at: "2026-04-30T09:47:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8257bdba22b613093da1a06761fdc5034cae4bca249ae91a531ec3fccabb954
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) oturumları
OpenClaw'ın harici kodlama harness'larını (örneğin Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI ve desteklenen diğer
ACPX harness'ları) bir ACP backend plugin'i aracılığıyla çalıştırmasını sağlar.

Her ACP oturum başlatması bir [arka plan görevi](/tr/automation/tasks) olarak izlenir.

<Note>
**ACP, varsayılan Codex yolu değil, harici harness yoludur.** Yerel
Codex uygulama sunucusu plugin'i `/codex ...` denetimlerini ve
`agentRuntime.id: "codex"` gömülü runtime'ını sahiplenir; ACP ise
`/acp ...` denetimlerini ve `sessions_spawn({ runtime: "acp" })` oturumlarını sahiplenir.

Codex veya Claude Code'un harici bir MCP istemcisi olarak mevcut OpenClaw
kanal konuşmalarına doğrudan bağlanmasını istiyorsanız, ACP yerine
[`openclaw mcp serve`](/tr/cli/mcp) kullanın.
</Note>

## Hangi sayfayı istiyorum?

| Şunu yapmak istiyorsunuz…                                                                       | Bunu kullanın                         | Notlar                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Geçerli konuşmada Codex'i bağlamak veya denetlemek                                               | `/codex bind`, `/codex threads`       | `codex` plugin'i etkin olduğunda yerel Codex uygulama sunucusu yolu; bağlı sohbet yanıtlarını, görsel iletmeyi, model/hızlı/izinleri, durdurma ve yönlendirme denetimlerini içerir. ACP açık bir yedektir |
| Claude Code, Gemini CLI, açık Codex ACP veya başka bir harici harness'ı OpenClaw _üzerinden_ çalıştırmak | Bu sayfa                              | Sohbete bağlı oturumlar, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, arka plan görevleri, runtime denetimleri                                                                        |
| Bir OpenClaw Gateway oturumunu bir düzenleyici veya istemci için ACP sunucusu _olarak_ sunmak    | [`openclaw acp`](/tr/cli/acp)            | Köprü modu. IDE/istemci, stdio/WebSocket üzerinden OpenClaw ile ACP konuşur                                                                                                                   |
| Yerel bir AI CLI'ını yalnızca metin yedek modeli olarak yeniden kullanmak                         | [CLI Backend'leri](/tr/gateway/cli-backends) | ACP değildir. OpenClaw araçları yok, ACP denetimleri yok, harness runtime'ı yok                                                                                                               |

## Bu kutudan çıktığı gibi çalışır mı?

Genellikle evet. Yeni kurulumlar, varsayılan olarak etkinleştirilmiş paketli
`acpx` runtime plugin'iyle gelir; bu plugin, OpenClaw'ın başlangıçta yokladığı
ve kendi kendine onardığı plugin'e yerel olarak sabitlenmiş bir `acpx` ikili dosyasına sahiptir.
Hazırlık kontrolü için `/acp doctor` çalıştırın.

OpenClaw, ajanlara ACP başlatmayı yalnızca ACP **gerçekten kullanılabilir**
olduğunda öğretir: ACP etkin olmalı, dispatch devre dışı olmamalı, geçerli
oturum sandbox tarafından engellenmemeli ve bir runtime backend'i yüklenmiş
olmalıdır. Bu koşullar karşılanmazsa, ajan kullanılamayan bir backend önermesin
diye ACP plugin Skills'ları ve `sessions_spawn` ACP rehberliği gizli kalır.

<AccordionGroup>
  <Accordion title="İlk çalıştırma tuzakları">
    - `plugins.allow` ayarlanmışsa, bu kısıtlayıcı bir plugin envanteridir ve **mutlaka** `acpx` içermelidir; aksi halde paketli varsayılan bilinçli olarak engellenir ve `/acp doctor` eksik allowlist girdisini bildirir.
    - Paketli Codex ACP adaptörü, `acpx` plugin'iyle hazırlanır ve mümkün olduğunda yerel olarak başlatılır.
    - Diğer hedef harness adaptörleri, onları ilk kez kullandığınızda hâlâ gerektiğinde `npx` ile alınabilir.
    - Satıcı kimlik doğrulamasının o harness için host üzerinde zaten bulunması gerekir.
    - Host'ta npm veya ağ erişimi yoksa, ilk çalıştırma adaptör alma işlemleri önbellekler önceden ısıtılana veya adaptör başka bir şekilde yüklenene kadar başarısız olur.

  </Accordion>
  <Accordion title="Runtime önkoşulları">
    ACP gerçek bir harici harness süreci başlatır. OpenClaw yönlendirme,
    arka plan görevi durumunu, teslimatı, bağlamaları ve politikayı sahiplenir;
    harness ise sağlayıcı oturum açmasını, model kataloğunu, dosya sistemi
    davranışını ve yerel araçlarını sahiplenir.

    OpenClaw'ı sorumlu tutmadan önce şunları doğrulayın:

    - `/acp doctor`, etkin ve sağlıklı bir backend bildiriyor.
    - Bu allowlist ayarlandığında hedef id `acp.allowedAgents` tarafından izinli.
    - Harness komutu Gateway host'unda başlatılabiliyor.
    - Bu harness için sağlayıcı kimlik doğrulaması mevcut (`claude`, `codex`, `gemini`, `opencode`, `droid` vb.).
    - Seçilen model bu harness için mevcut — model id'leri harness'lar arasında taşınabilir değildir.
    - İstenen `cwd` mevcut ve erişilebilir, ya da `cwd` değerini atlayın ve backend'in varsayılanını kullanmasına izin verin.
    - İzin modu işe uygun. Etkileşimsiz oturumlar yerel izin istemlerine tıklayamaz, bu yüzden yazma/çalıştırma ağırlıklı kodlama çalıştırmaları genellikle başsız ilerleyebilen bir ACPX izin profiline ihtiyaç duyar.

  </Accordion>
</AccordionGroup>

OpenClaw plugin araçları ve yerleşik OpenClaw araçları varsayılan olarak
ACP harness'larına sunulmaz. Açık MCP köprülerini yalnızca harness'ın
bu araçları doğrudan çağırması gerektiğinde
[ACP ajanları — kurulum](/tr/tools/acp-agents-setup) bölümünde etkinleştirin.

## Desteklenen harness hedefleri

Paketli `acpx` backend'iyle, şu harness id'lerini `/acp spawn <id>` veya
`sessions_spawn({ runtime: "acp", agentId: "<id>" })` hedefleri olarak kullanın:

| Harness id | Tipik backend                                  | Notlar                                                                              |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP adaptörü                       | Host üzerinde Claude Code kimlik doğrulaması gerektirir.                            |
| `codex`    | Codex ACP adaptörü                             | Yalnızca yerel `/codex` kullanılamadığında veya ACP istendiğinde açık ACP yedeği.   |
| `copilot`  | GitHub Copilot ACP adaptörü                    | Copilot CLI/runtime kimlik doğrulaması gerektirir.                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Yerel kurulum farklı bir ACP entrypoint'i sunuyorsa acpx komutunu geçersiz kılın.   |
| `droid`    | Factory Droid CLI                              | Harness ortamında Factory/Droid kimlik doğrulaması veya `FACTORY_API_KEY` gerektirir. |
| `gemini`   | Gemini CLI ACP adaptörü                        | Gemini CLI kimlik doğrulaması veya API anahtarı kurulumu gerektirir.                |
| `iflow`    | iFlow CLI                                      | Adaptör kullanılabilirliği ve model denetimi, yüklü CLI'a bağlıdır.                 |
| `kilocode` | Kilo Code CLI                                  | Adaptör kullanılabilirliği ve model denetimi, yüklü CLI'a bağlıdır.                 |
| `kimi`     | Kimi/Moonshot CLI                              | Host üzerinde Kimi/Moonshot kimlik doğrulaması gerektirir.                          |
| `kiro`     | Kiro CLI                                       | Adaptör kullanılabilirliği ve model denetimi, yüklü CLI'a bağlıdır.                 |
| `opencode` | OpenCode ACP adaptörü                          | OpenCode CLI/sağlayıcı kimlik doğrulaması gerektirir.                               |
| `openclaw` | `openclaw acp` üzerinden OpenClaw Gateway köprüsü | ACP farkındalığı olan bir harness'ın bir OpenClaw Gateway oturumuyla geri konuşmasını sağlar. |
| `pi`       | Pi/gömülü OpenClaw runtime'ı                   | OpenClaw'a yerel harness deneyleri için kullanılır.                                 |
| `qwen`     | Qwen Code / Qwen CLI                           | Host üzerinde Qwen uyumlu kimlik doğrulaması gerektirir.                            |

Özel acpx ajan diğer adları acpx içinde yapılandırılabilir, ancak OpenClaw
politikası dispatch öncesinde yine de `acp.allowedAgents` ve varsa
`agents.list[].runtime.acp.agent` eşlemesini denetler.

## Operatör runbook'u

Sohbetten hızlı `/acp` akışı:

<Steps>
  <Step title="Başlat">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` veya açıkça
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Çalış">
    Bağlı konuşmada veya thread'de devam edin (ya da oturum anahtarını
    açıkça hedefleyin).
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
    - Spawn bir ACP runtime oturumu oluşturur veya sürdürür, OpenClaw oturum deposuna ACP meta verilerini kaydeder ve çalışma üst öğe sahipliyse bir arka plan görevi oluşturabilir.
    - Üst öğe sahipli ACP oturumları, runtime oturumu kalıcı olsa bile arka plan işi olarak ele alınır; tamamlama ve yüzeyler arası teslimat, normal kullanıcıya dönük bir sohbet oturumu gibi davranmak yerine üst görev bildiricisi üzerinden geçer.
    - Görev bakımı, terminal veya sahipsiz üst öğe sahipli tek seferlik ACP oturumlarını kapatır. Kalıcı ACP oturumları etkin bir konuşma bağlaması kaldığı sürece korunur; etkin bağlaması olmayan bayat kalıcı oturumlar kapatılır, böylece sahip olan görev tamamlandıktan veya görev kaydı yok olduktan sonra sessizce sürdürülemezler.
    - Bağlı takip mesajları, bağlama kapatılana, odaktan çıkarılana, sıfırlanana veya süresi dolana kadar doğrudan ACP oturumuna gider.
    - Gateway komutları yerel kalır. `/acp ...`, `/status` ve `/unfocus` hiçbir zaman bağlı bir ACP harness'ına normal prompt metni olarak gönderilmez.
    - `cancel`, backend iptali desteklediğinde etkin turu iptal eder; bağlamayı veya oturum meta verilerini silmez.
    - `close`, OpenClaw açısından ACP oturumunu sonlandırır ve bağlamayı kaldırır. Bir harness, sürdürmeyi destekliyorsa kendi upstream geçmişini yine de tutabilir.
    - Boştaki runtime worker'ları `acp.runtime.ttlMinutes` sonrasında temizlenmeye uygundur; saklanan oturum meta verileri `/acp sessions` için kullanılabilir kalır.

  </Accordion>
  <Accordion title="Yerel Codex yönlendirme kuralları">
    Etkin olduğunda **yerel Codex plugin'ine** yönlendirilmesi gereken
    doğal dil tetikleyicileri:

    - "Bu Discord kanalını Codex'e bağla."
    - "Bu sohbeti Codex thread'i `<id>` öğesine ekle."
    - "Codex thread'lerini göster, sonra bunu bağla."

    Yerel Codex konuşma bağlaması varsayılan sohbet denetimi yoludur.
    OpenClaw dinamik araçları hâlâ OpenClaw üzerinden çalışır; shell/apply-patch
    gibi Codex'e yerel araçlar ise Codex içinde çalışır.
    Codex'e yerel araç olayları için OpenClaw, plugin hook'larının
    `before_tool_call` öğesini engelleyebilmesi, `after_tool_call` öğesini
    gözlemleyebilmesi ve Codex `PermissionRequest` olaylarını OpenClaw
    onayları üzerinden yönlendirebilmesi için tur başına yerel bir hook
    aktarımı enjekte eder. Codex `Stop` hook'ları OpenClaw
    `before_agent_finalize` öğesine aktarılır; burada plugin'ler Codex yanıtını
    kesinleştirmeden önce bir model geçişi daha isteyebilir. Aktarım bilinçli
    olarak muhafazakâr kalır: Codex'e yerel araç argümanlarını değiştirmez veya
    Codex thread kayıtlarını yeniden yazmaz. Açık ACP'yi yalnızca ACP
    runtime/oturum modelini istediğinizde kullanın. Gömülü Codex destek sınırı,
    [Codex harness v1 destek sözleşmesi](/tr/plugins/codex-harness#v1-support-contract) içinde belgelenmiştir.

  </Accordion>
  <Accordion title="Model / sağlayıcı / çalışma zamanı seçim hızlı başvuru sayfası">
    - `openai-codex/*` — PI Codex OAuth/abonelik yolu.
    - `openai/*` artı `agentRuntime.id: "codex"` — yerel Codex uygulama sunucusuna gömülü çalışma zamanı.
    - `/codex ...` — yerel Codex konuşma denetimi.
    - `/acp ...` veya `runtime: "acp"` — açık ACP/acpx denetimi.

  </Accordion>
  <Accordion title="ACP yönlendirmesi doğal dil tetikleyicileri">
    ACP çalışma zamanına yönlendirilmesi gereken tetikleyiciler:

    - "Bunu tek seferlik bir Claude Code ACP oturumu olarak çalıştır ve sonucu özetle."
    - "Bu görev için Gemini CLI'yi bir dizide kullan, ardından takipleri aynı dizide tut."
    - "Codex'i ACP üzerinden arka plan dizisinde çalıştır."

    OpenClaw `runtime: "acp"` seçer, harness `agentId` değerini çözer,
    desteklendiğinde mevcut konuşmaya veya diziye bağlanır ve
    kapanana/süresi dolana kadar takipleri o oturuma yönlendirir. Codex bu
    yolu yalnızca ACP/acpx açık olduğunda veya istenen işlem için yerel Codex
    plugin kullanılamadığında izler.

    `sessions_spawn` için, `runtime: "acp"` yalnızca ACP etkin olduğunda,
    istekte bulunan sandbox içinde olmadığında ve bir ACP çalışma zamanı
    arka ucu yüklendiğinde duyurulur. `acp.dispatch.enabled=false` otomatik
    ACP dizi yönlendirmesini duraklatır ancak açık
    `sessions_spawn({ runtime: "acp" })` çağrılarını gizlemez veya engellemez. `codex`,
    `claude`, `droid`, `gemini` veya `opencode` gibi ACP harness kimliklerini hedefler. Bu giriş
    açıkça `agents.list[].runtime.type="acp"` ile yapılandırılmadıkça
    `agents_list` içinden normal bir OpenClaw yapılandırma ajanı kimliği geçirmeyin;
    bunun yerine varsayılan alt ajan çalışma zamanını kullanın. Bir OpenClaw ajanı
    `runtime.type="acp"` ile yapılandırıldığında OpenClaw, alttaki harness kimliği olarak
    `runtime.acp.agent` kullanır.

  </Accordion>
</AccordionGroup>

## ACP ve alt ajanlar

Harici bir harness çalışma zamanı istediğinizde ACP kullanın. `codex`
plugin etkin olduğunda Codex konuşma bağlama/denetimi için **yerel Codex
uygulama sunucusunu** kullanın. OpenClaw'a özgü
devredilmiş çalıştırmalar istediğinizde **alt ajanları** kullanın.

| Alan          | ACP oturumu                          | Alt ajan çalıştırması             |
| ------------- | ------------------------------------ | --------------------------------- |
| Çalışma zamanı | ACP arka uç plugin (örneğin acpx)    | OpenClaw yerel alt ajan çalışma zamanı |
| Oturum anahtarı | `agent:<agentId>:acp:<uuid>`         | `agent:<agentId>:subagent:<uuid>` |
| Ana komutlar  | `/acp ...`                           | `/subagents ...`                  |
| Başlatma aracı | `sessions_spawn` ile `runtime:"acp"` | `sessions_spawn` (varsayılan çalışma zamanı) |

Ayrıca bkz. [Alt ajanlar](/tr/tools/subagents).

## ACP, Claude Code'u nasıl çalıştırır

ACP üzerinden Claude Code için yığın şöyledir:

1. OpenClaw ACP oturum denetim düzlemi.
2. Paketle gelen `acpx` çalışma zamanı plugin.
3. Claude ACP bağdaştırıcısı.
4. Claude tarafındaki çalışma zamanı/oturum mekanizması.

ACP Claude, ACP denetimleri, oturum sürdürme,
arka plan görevi izleme ve isteğe bağlı konuşma/dizi bağlama içeren bir **harness oturumudur**.

CLI arka uçları ayrı, yalnızca metin tabanlı yerel yedek çalışma zamanlarıdır — bkz.
[CLI Arka Uçları](/tr/gateway/cli-backends).

Operatörler için pratik kural şudur:

- **`/acp spawn`, bağlanabilir oturumlar, çalışma zamanı denetimleri veya kalıcı harness işi mi istiyorsunuz?** ACP kullanın.
- **Ham CLI üzerinden basit yerel metin yedeği mi istiyorsunuz?** CLI arka uçlarını kullanın.

## Bağlı oturumlar

### Zihinsel model

- **Sohbet yüzeyi** — insanların konuşmayı sürdürdüğü yer (Discord kanalı, Telegram konusu, iMessage sohbeti).
- **ACP oturumu** — OpenClaw'ın yönlendirdiği kalıcı Codex/Claude/Gemini çalışma zamanı durumu.
- **Alt dizi/konu** — yalnızca `--thread ...` tarafından oluşturulan isteğe bağlı ek mesajlaşma yüzeyi.
- **Çalışma zamanı çalışma alanı** — harness'in çalıştığı dosya sistemi konumu (`cwd`, repo checkout, arka uç çalışma alanı). Sohbet yüzeyinden bağımsızdır.

### Mevcut konuşma bağlamaları

`/acp spawn <harness> --bind here`, mevcut konuşmayı
başlatılan ACP oturumuna sabitler — alt dizi yok, aynı sohbet yüzeyi. OpenClaw
taşıma, kimlik doğrulama, güvenlik ve teslimi yönetmeye devam eder. Bu
konuşmadaki takip mesajları aynı oturuma yönlendirilir; `/new` ve `/reset`
oturumu yerinde sıfırlar; `/acp close` bağlamayı kaldırır.

Örnekler:

```text
/codex bind                                              # yerel Codex bağlaması, gelecekteki mesajları buraya yönlendir
/codex model gpt-5.4                                     # bağlı yerel Codex dizisini ayarla
/codex stop                                              # etkin yerel Codex turunu denetle
/acp spawn codex --bind here                             # Codex için açık ACP yedeği
/acp spawn codex --thread auto                           # bir alt dizi/konu oluşturabilir ve oraya bağlayabilir
/acp spawn codex --bind here --cwd /workspace/repo       # aynı sohbet bağlaması, Codex /workspace/repo içinde çalışır
```

<AccordionGroup>
  <Accordion title="Bağlama kuralları ve münhasırlık">
    - `--bind here` ve `--thread ...` karşılıklı olarak birbirini dışlar.
    - `--bind here` yalnızca mevcut konuşma bağlamasını duyuran kanallarda çalışır; aksi halde OpenClaw net bir desteklenmiyor mesajı döndürür. Bağlamalar Gateway yeniden başlatmaları boyunca kalıcıdır.
    - Discord'da `spawnAcpSessions` yalnızca OpenClaw'ın `--thread auto|here` için bir alt dizi oluşturması gerektiğinde gerekir — `--bind here` için gerekmez.
    - `--cwd` olmadan farklı bir ACP ajanına başlatırsanız OpenClaw varsayılan olarak **hedef ajanın** çalışma alanını devralır. Eksik devralınan yollar (`ENOENT`/`ENOTDIR`) arka uç varsayılanına geri döner; diğer erişim hataları (ör. `EACCES`) başlatma hataları olarak gösterilir.
    - Gateway yönetim komutları bağlı konuşmalarda yerel kalır — normal takip metni bağlı ACP oturumuna yönlendirilse bile `/acp ...` komutları OpenClaw tarafından işlenir; bu yüzey için komut işleme etkin olduğunda `/status` ve `/unfocus` da yerel kalır.

  </Accordion>
  <Accordion title="Thread'e bağlı oturumlar">
    Bir kanal adaptörü için thread bağlamaları etkinleştirildiğinde:

    - OpenClaw bir thread'i hedef ACP oturumuna bağlar.
    - Bu thread'deki takip mesajları bağlı ACP oturumuna yönlendirilir.
    - ACP çıktısı aynı thread'e geri iletilir.
    - Odaktan çıkarma/kapatma/arşivleme/boşta kalma zaman aşımı veya max-age süresinin dolması bağlamayı kaldırır.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` ve `/unfocus` Gateway komutlarıdır, ACP harness'ına gönderilen istemler değildir.

    Thread'e bağlı ACP için gerekli özellik bayrakları:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` varsayılan olarak açıktır (otomatik ACP thread dispatch'i duraklatmak için `false` olarak ayarlayın; açık `sessions_spawn({ runtime: "acp" })` çağrıları yine de çalışır).
    - Kanal adaptörünün ACP thread oluşturma bayrağı etkin (adaptöre özgü):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    Thread bağlama desteği adaptöre özgüdür. Etkin kanal
    adaptörü thread bağlamalarını desteklemiyorsa OpenClaw açık bir
    desteklenmiyor/kullanılamıyor mesajı döndürür.

  </Accordion>
  <Accordion title="Thread destekleyen kanallar">
    - Oturum/thread bağlama yeteneğini açığa çıkaran herhangi bir kanal adaptörü.
    - Mevcut yerleşik destek: **Discord** thread'leri/kanalları, **Telegram** konuları (gruplarda/süper gruplarda forum konuları ve DM konuları).
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
  Hedef konuşmayı tanımlar. Kanal bazında biçimler:

- **Discord kanalı/thread'i:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram forum konusu:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles DM/grup:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Kararlı grup bağlamaları için `chat_id:*` veya `chat_identifier:*` tercih edin.
- **iMessage DM/grup:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Kararlı grup bağlamaları için `chat_id:*` tercih edin.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Sahip olan OpenClaw ajan kimliği.
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

### Ajan başına çalışma zamanı varsayılanları

ACP varsayılanlarını her ajan için bir kez tanımlamak üzere `agents.list[].runtime` kullanın:

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
- Bu kanaldaki veya konudaki mesajlar yapılandırılan ACP oturumuna yönlendirilir.
- Bağlı konuşmalarda `/new` ve `/reset` aynı ACP oturum anahtarını yerinde sıfırlar.
- Geçici çalışma zamanı bağlamaları (örneğin thread odaklama akışları tarafından oluşturulanlar) bulundukları yerde geçerli olmaya devam eder.
- Açık bir `cwd` olmadan ajanlar arası ACP oluşturmaları için OpenClaw hedef ajan çalışma alanını ajan yapılandırmasından devralır.
- Eksik devralınan çalışma alanı yolları arka ucun varsayılan cwd'sine geri döner; eksik olmayan erişim hataları oluşturma hataları olarak görünür.

## ACP oturumlarını başlatma

Bir ACP oturumu başlatmanın iki yolu vardır:

<Tabs>
  <Tab title="sessions_spawn üzerinden">
    Bir ajan turundan veya araç çağrısından ACP oturumu başlatmak için `runtime: "acp"` kullanın.

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
    `runtime` varsayılan olarak `subagent` değerine ayarlanır, bu nedenle ACP oturumları için
    `runtime: "acp"` değerini açıkça ayarlayın. `agentId` atlanırsa OpenClaw,
    yapılandırıldığında `acp.defaultAgent` kullanır. Kalıcı, bağlı bir konuşmayı
    korumak için `mode: "session"` değeri `thread: true` gerektirir.
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
  ACP hedef harness kimliği. Ayarlanmışsa `acp.defaultAgent` değerine geri döner.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Desteklendiği yerlerde iş parçacığı bağlama akışı isteyin.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` tek seferliktir; `"session"` kalıcıdır. `thread: true` ise ve
  `mode` atlanmışsa OpenClaw, çalışma zamanı yoluna göre varsayılan olarak
  kalıcı davranış kullanabilir. `mode: "session"` değeri `thread: true` gerektirir.
</ParamField>
<ParamField path="cwd" type="string">
  İstenen çalışma zamanı çalışma dizini (arka uç/çalışma zamanı ilkesi
  tarafından doğrulanır). Atlanırsa ACP spawn, yapılandırıldığında hedef
  ajan çalışma alanını devralır; eksik devralınan yollar arka uç varsayılanlarına
  geri dönerken gerçek erişim hataları döndürülür.
</ParamField>
<ParamField path="label" type="string">
  Oturum/banner metninde kullanılan operatöre yönelik etiket.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Yeni bir oturum oluşturmak yerine mevcut bir ACP oturumunu sürdürün. Ajan,
  konuşma geçmişini `session/load` aracılığıyla yeniden oynatır. `runtime: "acp"`
  gerektirir.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"`, ilk ACP çalıştırma ilerleme özetlerini sistem olayları olarak
  istekte bulunan oturuma geri akıtır. Kabul edilen yanıtlar, tam aktarma
  geçmişi için takip edebileceğiniz oturum kapsamlı JSONL günlüğüne
  (`<sessionId>.acp-stream.jsonl`) işaret eden `streamLogPath` içerir.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  ACP alt dönüşünü N saniye sonra iptal eder. `0`, dönüşü Gateway'in
  zaman aşımı olmayan yolunda tutar. Aynı değer Gateway çalıştırmasına ve
  ACP çalışma zamanına uygulanır; böylece takılmış/kotası tükenmiş harness'lar
  üst ajan hattını süresiz işgal etmez.
</ParamField>
<ParamField path="model" type="string">
  ACP alt oturumu için açık model geçersiz kılması. Codex ACP spawn'ları,
  `openai-codex/gpt-5.4` gibi OpenClaw Codex referanslarını `session/new`
  öncesinde Codex ACP başlangıç yapılandırmasına normalleştirir; `openai-codex/gpt-5.4/high`
  gibi eğik çizgi biçimleri de Codex ACP akıl yürütme çabasını ayarlar.
  Diğer harness'lar ACP `models` değerlerini duyurmalı ve `session/set_model`
  desteği sunmalıdır; aksi takdirde OpenClaw/acpx, hedef ajan varsayılanına
  sessizce geri dönmek yerine açıkça başarısız olur.
</ParamField>
<ParamField path="thinking" type="string">
  Açık düşünme/akıl yürütme çabası. Codex ACP için `minimal` düşük çabaya
  eşlenir, `low`/`medium`/`high`/`xhigh` doğrudan eşlenir ve `off` akıl yürütme
  çabası başlangıç geçersiz kılmasını atlar.
</ParamField>

## Spawn bağlama ve iş parçacığı modları

<Tabs>
  <Tab title="--bind here|off">
    | Mod    | Davranış                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Geçerli etkin konuşmayı yerinde bağlar; etkin konuşma yoksa başarısız olur. |
    | `off`  | Geçerli konuşma bağlaması oluşturmaz.                                  |

    Notlar:

    - `--bind here`, "bu kanalı veya sohbeti Codex destekli yap" için en basit operatör yoludur.
    - `--bind here` alt iş parçacığı oluşturmaz.
    - `--bind here` yalnızca geçerli konuşma bağlama desteği sunan kanallarda kullanılabilir.
    - `--bind` ve `--thread` aynı `/acp spawn` çağrısında birleştirilemez.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mod    | Davranış                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | Etkin bir iş parçacığında: o iş parçacığını bağlar. İş parçacığı dışında: destekleniyorsa alt iş parçacığı oluşturur/bağlar. |
    | `here` | Geçerli etkin iş parçacığı gerektirir; bir iş parçacığında değilse başarısız olur.                  |
    | `off`  | Bağlama yoktur. Oturum bağlanmamış başlar.                                                          |

    Notlar:

    - İş parçacığı bağlama yüzeyi olmayan yerlerde varsayılan davranış fiilen `off` olur.
    - İş parçacığına bağlı spawn, kanal ilkesi desteği gerektirir:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Alt iş parçacığı oluşturmadan geçerli konuşmayı sabitlemek istediğinizde `--bind here` kullanın.

  </Tab>
</Tabs>

## Teslim modeli

ACP oturumları etkileşimli çalışma alanları veya üst öğeye ait arka plan
işleri olabilir. Teslim yolu bu yapıya bağlıdır.

<AccordionGroup>
  <Accordion title="Etkileşimli ACP oturumları">
    Etkileşimli oturumlar görünür bir sohbet yüzeyinde konuşmayı sürdürmek
    için tasarlanmıştır:

    - `/acp spawn ... --bind here`, geçerli konuşmayı ACP oturumuna bağlar.
    - `/acp spawn ... --thread ...`, kanal iş parçacığını/konusunu ACP oturumuna bağlar.
    - Kalıcı yapılandırılmış `bindings[].type="acp"`, eşleşen konuşmaları aynı ACP oturumuna yönlendirir.

    Bağlı konuşmadaki takip mesajları doğrudan ACP oturumuna yönlendirilir
    ve ACP çıktısı aynı kanala/iş parçacığına/konuya geri teslim edilir.

    OpenClaw'ın harness'a gönderdikleri:

    - Normal bağlı takipler, harness/arka uç desteklediğinde eklerle birlikte istem metni olarak gönderilir.
    - `/acp` yönetim komutları ve yerel Gateway komutları ACP gönderiminden önce yakalanır.
    - Çalışma zamanı tarafından oluşturulan tamamlama olayları hedefe göre somutlaştırılır. OpenClaw ajanları OpenClaw'ın dahili çalışma zamanı bağlamı zarfını alır; harici ACP harness'ları alt sonuç ve talimatla birlikte düz bir istem alır. Ham `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` zarfı hiçbir zaman harici harness'lara gönderilmemeli veya ACP kullanıcı döküm metni olarak kalıcılaştırılmamalıdır.
    - ACP döküm girdileri, kullanıcıya görünen tetik metnini veya düz tamamlama istemini kullanır. Dahili olay meta verileri mümkün olduğunda OpenClaw içinde yapılandırılmış kalır ve kullanıcı tarafından yazılmış sohbet içeriği olarak ele alınmaz.

  </Accordion>
  <Accordion title="Üst öğeye ait tek seferlik ACP oturumları">
    Başka bir ajan çalıştırması tarafından başlatılan tek seferlik ACP oturumları,
    alt ajanlara benzer arka plan alt öğeleridir:

    - Üst öğe, `sessions_spawn({ runtime: "acp", mode: "run" })` ile iş ister.
    - Alt öğe kendi ACP harness oturumunda çalışır.
    - Alt dönüşler yerel alt ajan spawn'larının kullandığı aynı arka plan hattında çalışır, bu nedenle yavaş bir ACP harness'ı ilgisiz ana oturum işini engellemez.
    - Tamamlama, görev tamamlama duyuru yolu üzerinden geri bildirilir. OpenClaw, harici bir harness'a göndermeden önce dahili tamamlama meta verilerini düz bir ACP istemine dönüştürür; böylece harness'lar yalnızca OpenClaw'a özgü çalışma zamanı bağlam işaretçilerini görmez.
    - Kullanıcıya yönelik bir yanıt yararlı olduğunda üst öğe, alt öğenin sonucunu normal asistan sesiyle yeniden yazar.

    Bu yolu üst öğe ile alt öğe arasında eşler arası sohbet olarak
    ele **almayın**. Alt öğenin zaten üst öğeye geri dönen bir tamamlama
    kanalı vardır.

  </Accordion>
  <Accordion title="sessions_send ve A2A teslimi">
    `sessions_send`, spawn sonrasında başka bir oturumu hedefleyebilir.
    Normal eş oturumları için OpenClaw, mesajı enjekte ettikten sonra
    ajandan ajana (A2A) takip yolu kullanır:

    - Hedef oturumun yanıtını bekleyin.
    - İsteğe bağlı olarak istekte bulunan ile hedefin sınırlı sayıda takip dönüşü paylaşmasına izin verin.
    - Hedeften bir duyuru mesajı üretmesini isteyin.
    - Bu duyuruyu görünür kanala veya iş parçacığına teslim edin.

    Bu A2A yolu, gönderenin görünür bir takibe ihtiyaç duyduğu eş gönderimleri
    için bir geri dönüş yoludur. İlgisiz bir oturumun ACP hedefini görebildiği
    ve ona mesaj gönderebildiği durumlarda, örneğin geniş
    `tools.sessions.visibility` ayarları altında, etkin kalır.

    OpenClaw A2A takibini yalnızca istekte bulunan kendi üst öğeye ait
    tek seferlik ACP alt öğesinin üst öğesiyse atlar. Bu durumda, görev
    tamamlamanın üzerine A2A çalıştırmak üst öğeyi alt öğenin sonucuyla
    uyandırabilir, üst öğenin yanıtını alt öğeye geri iletebilir ve üst/alt
    yankı döngüsü oluşturabilir. `sessions_send` sonucu, sonuçtan zaten
    tamamlama yolu sorumlu olduğu için bu sahip olunan alt öğe durumunda
    `delivery.status="skipped"` bildirir.

  </Accordion>
  <Accordion title="Mevcut bir oturumu sürdürme">
    Baştan başlatmak yerine önceki bir ACP oturumuna devam etmek için
    `resumeSessionId` kullanın. Ajan, konuşma geçmişini `session/load`
    aracılığıyla yeniden oynatır; böylece daha önce olanların tam bağlamıyla
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

    - Codex oturumunu dizüstü bilgisayarınızdan telefonunuza devredin — ajanınıza kaldığınız yerden devam etmesini söyleyin.
    - CLI içinde etkileşimli olarak başlattığınız kodlama oturumuna artık ajanınız üzerinden başsız olarak devam edin.
    - Gateway yeniden başlatması veya boşta kalma zaman aşımı nedeniyle kesintiye uğrayan işi sürdürün.

    Notlar:

    - `resumeSessionId` yalnızca `runtime: "acp"` olduğunda geçerlidir; varsayılan alt ajan çalışma zamanı bu yalnızca ACP alanını yok sayar.
    - `streamTo` yalnızca `runtime: "acp"` olduğunda geçerlidir; varsayılan alt ajan çalışma zamanı bu yalnızca ACP alanını yok sayar.
    - `resumeSessionId`, OpenClaw kanal oturum anahtarı değil, ana bilgisayara yerel bir ACP/harness sürdürme kimliğidir; OpenClaw gönderimden önce ACP spawn ilkesini ve hedef ajan ilkesini yine de denetlerken, bu yukarı akış kimliğini yükleme yetkilendirmesinin sahibi ACP arka ucu veya harness'tır.
    - `resumeSessionId` yukarı akış ACP konuşma geçmişini geri yükler; `thread` ve `mode` oluşturduğunuz yeni OpenClaw oturumuna normal şekilde uygulanmaya devam eder, bu nedenle `mode: "session"` yine `thread: true` gerektirir.
    - Hedef ajan `session/load` desteklemelidir (Codex ve Claude Code destekler).
    - Oturum kimliği bulunamazsa spawn açık bir hatayla başarısız olur — yeni oturuma sessiz geri dönüş yoktur.

  </Accordion>
  <Accordion title="Dağıtım sonrası smoke testi">
    Bir Gateway dağıtımından sonra birim testlerine güvenmek yerine
    canlı uçtan uca denetim çalıştırın:

    1. Hedef ana bilgisayarda dağıtılan Gateway sürümünü ve commit'i doğrulayın.
    2. Canlı bir ajana geçici bir ACPX bridge oturumu açın.
    3. Bu ajandan `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` ve `Reply with exactly LIVE-ACP-SPAWN-OK` göreviyle `sessions_spawn` çağırmasını isteyin.
    4. `accepted=yes`, gerçek bir `childSessionKey` ve doğrulayıcı hatası olmadığını doğrulayın.
    5. Geçici bridge oturumunu temizleyin.

    Gate'i `mode: "run"` üzerinde tutun ve `streamTo: "parent"` değerini atlayın —
    iş parçacığına bağlı `mode: "session"` ve akış aktarma yolları ayrı,
    daha zengin entegrasyon geçişleridir.

  </Accordion>
</AccordionGroup>

## Sandbox uyumluluğu

ACP oturumları şu anda OpenClaw sandbox'ı içinde **değil**, ana bilgisayar
çalışma zamanında çalışır.

<Warning>
**Güvenlik sınırı:**

- Harici koşum, kendi CLI izinlerine ve seçilen `cwd` değerine göre okuyabilir/yazabilir.
- OpenClaw'ın sandbox ilkesi, ACP koşum yürütmesini **sarmalamaz**.
- OpenClaw yine de ACP özellik kapılarını, izin verilen ajanları, oturum sahipliğini, kanal bağlamalarını ve Gateway teslim ilkesini uygular.
- Sandbox tarafından zorlanan OpenClaw'a özgü çalışma için `runtime: "subagent"` kullanın.

</Warning>

Geçerli sınırlamalar:

- İstek sahibi oturumu sandbox içindeyse, ACP başlatmaları hem `sessions_spawn({ runtime: "acp" })` hem de `/acp spawn` için engellenir.
- `runtime: "acp"` ile `sessions_spawn`, `sandbox: "require"` desteklemez.

## Oturum hedefi çözümleme

Çoğu `/acp` eylemi isteğe bağlı bir oturum hedefi kabul eder (`session-key`,
`session-id` veya `session-label`).

**Çözümleme sırası:**

1. Açık hedef argümanı (veya `/acp steer` için `--session`)
   - anahtarı dener
   - ardından UUID biçimli oturum kimliğini dener
   - ardından etiketi dener
2. Geçerli iş parçacığı bağlaması (bu konuşma/iş parçacığı bir ACP oturumuna bağlıysa).
3. Geçerli istek sahibi oturumu yedeği.

Geçerli konuşma bağlamaları ve iş parçacığı bağlamaları, ikisi de
2. adıma katılır.

Hiçbir hedef çözümlenmezse OpenClaw açık bir hata döndürür
(`Unable to resolve session target: ...`).

## ACP denetimleri

| Komut                | Ne yapar                                                       | Örnek                                                        |
| -------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| `/acp spawn`         | ACP oturumu oluşturur; isteğe bağlı geçerli bağlama veya iş parçacığı bağlaması. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Hedef oturum için devam eden turu iptal eder.                  | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Çalışan oturuma yönlendirme talimatı gönderir.                 | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Oturumu kapatır ve iş parçacığı hedeflerinin bağını kaldırır.  | `/acp close`                                                  |
| `/acp status`        | Arka ucu, modu, durumu, çalışma zamanı seçeneklerini ve yetenekleri gösterir. | `/acp status`                                                 |
| `/acp set-mode`      | Hedef oturum için çalışma zamanı modunu ayarlar.               | `/acp set-mode plan`                                          |
| `/acp set`           | Genel çalışma zamanı yapılandırma seçeneği yazar.              | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Çalışma zamanı çalışma dizini geçersiz kılmasını ayarlar.      | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Onay ilkesi profilini ayarlar.                                 | `/acp permissions strict`                                     |
| `/acp timeout`       | Çalışma zamanı zaman aşımını (saniye) ayarlar.                 | `/acp timeout 120`                                            |
| `/acp model`         | Çalışma zamanı model geçersiz kılmasını ayarlar.               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Oturum çalışma zamanı seçenek geçersiz kılmalarını kaldırır.   | `/acp reset-options`                                          |
| `/acp sessions`      | Depodan son ACP oturumlarını listeler.                         | `/acp sessions`                                               |
| `/acp doctor`        | Arka uç sağlığı, yetenekler ve uygulanabilir düzeltmeler.      | `/acp doctor`                                                 |
| `/acp install`       | Belirleyici kurulum ve etkinleştirme adımlarını yazdırır.      | `/acp install`                                                |

`/acp status`, etkili çalışma zamanı seçeneklerini ve çalışma zamanı düzeyi ile
arka uç düzeyi oturum tanımlayıcılarını gösterir. Bir arka uçta bir yetenek
bulunmadığında desteklenmeyen denetim hataları açıkça görünür. `/acp sessions`,
geçerli bağlı oturum veya istek sahibi oturumu için depoyu okur; hedef belirteçleri
(`session-key`, `session-id` veya `session-label`), özel ajan başına `session.store`
kökleri dahil olmak üzere Gateway oturum keşfi üzerinden çözümlenir.

### Çalışma zamanı seçenekleri eşlemesi

`/acp`, kolaylık komutlarına ve genel bir ayarlayıcıya sahiptir. Eşdeğer
işlemler:

| Komut                        | Şuna eşlenir                        | Notlar                                                                                                                                                                             |
| ---------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | runtime config key `model`          | Codex ACP için OpenClaw, `openai-codex/<model>` değerini adaptör model kimliğine normalleştirir ve `openai-codex/gpt-5.4/high` gibi eğik çizgili muhakeme son eklerini `reasoning_effort` değerine eşler. |
| `/acp set thinking <level>`  | runtime config key `thinking`       | Codex ACP için OpenClaw, adaptörün desteklediği yerde ilgili `reasoning_effort` değerini gönderir.                                                                                 |
| `/acp permissions <profile>` | runtime config key `approval_policy` | —                                                                                                                                                                                  |
| `/acp timeout <seconds>`     | runtime config key `timeout`        | —                                                                                                                                                                                  |
| `/acp cwd <path>`            | runtime cwd override                | Doğrudan güncelleme.                                                                                                                                                               |
| `/acp set <key> <value>`     | generic                             | `key=cwd`, cwd geçersiz kılma yolunu kullanır.                                                                                                                                     |
| `/acp reset-options`         | clears all runtime overrides        | —                                                                                                                                                                                  |

## acpx koşumu, Plugin kurulumu ve izinler

acpx koşum yapılandırması (Claude Code / Codex / Gemini CLI
takma adları), plugin-tools ve OpenClaw-tools MCP köprüleri ve ACP
izin modları için bkz.
[ACP ajanları — kurulum](/tr/tools/acp-agents-setup).

## Sorun giderme

| Belirti                                                                     | Olası neden                                                                                                           | Düzeltme                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Arka uç Plugin eksik, devre dışı ya da `plugins.allow` tarafından engellenmiş.                                                       | Arka uç Plugin'i kurup etkinleştirin, bu izin listesi ayarlandığında `plugins.allow` içine `acpx` ekleyin, ardından `/acp doctor` çalıştırın.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP genel olarak devre dışı.                                                                                                 | `acp.enabled=true` ayarlayın.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Normal iş parçacığı iletilerinden otomatik gönderim devre dışı.                                                               | Otomatik iş parçacığı yönlendirmesini sürdürmek için `acp.dispatch.enabled=true` ayarlayın; açık `sessions_spawn({ runtime: "acp" })` çağrıları hâlâ çalışır.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Aracı izin listesinde değil.                                                                                                | İzin verilen bir `agentId` kullanın veya `acp.allowedAgents` değerini güncelleyin.                                                                                                                     |
| `/acp doctor` başlatmadan hemen sonra arka ucun hazır olmadığını bildiriyor                 | Plugin bağımlılık yoklaması veya kendi kendini onarma hâlâ çalışıyor.                                                               | Kısa bir süre bekleyip `/acp doctor` komutunu yeniden çalıştırın; sağlıksız kalırsa arka uç kurulum hatasını ve Plugin izin/engel politikasını inceleyin.                                             |
| Harness komutu bulunamadı                                                   | Bağdaştırıcı CLI kurulu değil, aşamalanmış Plugin bağımlılıkları eksik veya Codex olmayan bir bağdaştırıcı için ilk çalıştırma `npx` getirmesi başarısız oldu. | `/acp doctor` çalıştırın, Plugin bağımlılıklarını onarın, bağdaştırıcıyı Gateway ana makinesine kurun/önceden ısıtın veya acpx aracı komutunu açıkça yapılandırın.                          |
| Harness'tan model bulunamadı                                                | Model kimliği başka bir sağlayıcı/harness için geçerli, ancak bu ACP hedefi için değil.                                                | Bu harness tarafından listelenen bir modeli kullanın, modeli harness içinde yapılandırın veya geçersiz kılmayı atlayın.                                                                            |
| Harness'tan satıcı kimlik doğrulama hatası                                          | OpenClaw sağlıklı, ancak hedef CLI/sağlayıcı oturum açmış değil.                                                     | Gateway ana makine ortamında oturum açın veya gerekli sağlayıcı anahtarını sağlayın.                                                                                             |
| `Unable to resolve session target: ...`                                     | Hatalı anahtar/kimlik/etiket belirteci.                                                                                                | `/acp sessions` çalıştırın, tam anahtarı/etiketi kopyalayın ve yeniden deneyin.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here`, etkin ve bağlanabilir bir konuşma olmadan kullanıldı.                                                            | Hedef sohbet/kanala geçip yeniden deneyin veya bağsız oluşturma kullanın.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Bağdaştırıcıda geçerli konuşma ACP bağlama yeteneği yok.                                                             | Destekleniyorsa `/acp spawn ... --thread ...` kullanın, üst düzey `bindings[]` yapılandırın veya desteklenen bir kanala geçin.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here`, bir iş parçacığı bağlamı dışında kullanıldı.                                                                         | Hedef iş parçacığına geçin veya `--thread auto`/`off` kullanın.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Etkin bağlama hedefinin sahibi başka bir kullanıcı.                                                                           | Sahip olarak yeniden bağlayın veya farklı bir konuşma ya da iş parçacığı kullanın.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | Bağdaştırıcıda iş parçacığı bağlama yeteneği yok.                                                                               | `--thread off` kullanın veya desteklenen bağdaştırıcıya/kanala geçin.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP çalışma zamanı ana makine tarafındadır; istekte bulunan oturum sandbox içinde.                                                              | Sandbox içindeki oturumlardan `runtime="subagent"` kullanın veya ACP oluşturmayı sandbox içinde olmayan bir oturumdan çalıştırın.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP çalışma zamanı için `sandbox="require"` istendi.                                                                         | Zorunlu sandbox için `runtime="subagent"` kullanın veya sandbox içinde olmayan bir oturumdan ACP'yi `sandbox="inherit"` ile kullanın.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | Hedef harness genel ACP model değiştirmeyi sunmuyor.                                                        | ACP `models`/`session/set_model` duyuran bir harness kullanın, Codex ACP model başvurularını kullanın veya kendi başlangıç bayrağı varsa modeli doğrudan harness içinde yapılandırın. |
| Bağlı oturum için ACP meta verisi eksik                                      | Eski/silinmiş ACP oturum meta verisi.                                                                                    | `/acp spawn` ile yeniden oluşturun, ardından iş parçacığını yeniden bağlayın/odaklayın.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode`, etkileşimsiz ACP oturumunda yazmaları/çalıştırmaları engelliyor.                                                    | `plugins.entries.acpx.config.permissionMode` değerini `approve-all` olarak ayarlayın ve Gateway'i yeniden başlatın. Bkz. [İzin yapılandırması](/tr/tools/acp-agents-setup#permission-configuration). |
| ACP oturumu az çıktıyla erken başarısız oluyor                                  | İzin istemleri `permissionMode`/`nonInteractivePermissions` tarafından engelleniyor.                                        | Gateway günlüklerinde `AcpRuntimeError` arayın. Tam izinler için `permissionMode=approve-all`; zarif düşüş için `nonInteractivePermissions=deny` ayarlayın.        |
| ACP oturumu işi tamamladıktan sonra süresiz olarak takılıyor                       | Harness süreci tamamlandı, ancak ACP oturumu tamamlanmayı bildirmedi.                                                    | `ps aux \| grep acpx` ile izleyin; eski süreçleri elle sonlandırın.                                                                                                       |
| Harness `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` görüyor                        | Dahili olay zarfı ACP sınırından sızdı.                                                                | OpenClaw'u güncelleyin ve tamamlama akışını yeniden çalıştırın; harici harness'lar yalnızca düz tamamlama istemleri almalıdır.                                                          |

## İlgili

- [ACP aracıları — kurulum](/tr/tools/acp-agents-setup)
- [Aracı gönderimi](/tr/tools/agent-send)
- [CLI arka uçları](/tr/gateway/cli-backends)
- [Codex harness](/tr/plugins/codex-harness)
- [Çok aracılı sandbox araçları](/tr/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (köprü modu)](/tr/cli/acp)
- [Alt aracılar](/tr/tools/subagents)
