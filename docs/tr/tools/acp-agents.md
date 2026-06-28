---
read_when:
    - Kodlama harness'larını ACP üzerinden çalıştırma
    - Mesajlaşma kanallarında konuşmaya bağlı ACP oturumlarını ayarlama
    - Bir mesaj kanalı konuşmasını kalıcı bir ACP oturumuna bağlama
    - ACP arka ucu, Plugin bağlantılandırması veya tamamlama iletimiyle ilgili sorun giderme
    - Sohbetten /acp komutlarını çalıştırma
sidebarTitle: ACP agents
summary: Harici kodlama koşumlarını (Claude Code, Cursor, Gemini CLI, açık Codex ACP, OpenClaw ACP, OpenCode) ACP arka ucu üzerinden çalıştırın
title: ACP ajanları
x-i18n:
    generated_at: "2026-06-28T01:20:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9ad2fd3dec35062209b5e66a3ec301e8fa247d10a48787e54b938b10b314aee
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) oturumları
OpenClaw'ın harici kodlama harness'larını (örneğin Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI ve diğer
desteklenen ACPX harness'ları) bir ACP arka uç plugin'i üzerinden çalıştırmasını sağlar.

Her ACP oturumu oluşturma işlemi bir [arka plan görevi](/tr/automation/tasks) olarak izlenir.

<Note>
**ACP, varsayılan Codex yolu değil, harici harness yoludur.** Yerel
Codex app-server plugin'i, ajan turları için `/codex ...` kontrollerinin ve varsayılan
`openai/gpt-*` gömülü çalışma zamanının sahibidir; ACP ise
`/acp ...` kontrollerinin ve `sessions_spawn({ runtime: "acp" })` oturumlarının sahibidir.

Codex veya Claude Code'un harici bir MCP istemcisi olarak
mevcut OpenClaw kanal konuşmalarına doğrudan bağlanmasını istiyorsanız,
ACP yerine [`openclaw mcp serve`](/tr/cli/mcp) kullanın.
</Note>

## Hangi sayfayı istiyorum?

| Şunu yapmak istiyorsunuz…                                                                       | Bunu kullanın                         | Notlar                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Geçerli konuşmada Codex'i bağlamak veya kontrol etmek                                           | `/codex bind`, `/codex threads`       | `codex` plugin'i etkin olduğunda yerel Codex app-server yolu; bağlı sohbet yanıtlarını, görüntü iletmeyi, model/hızlı/izinler, durdurma ve yönlendirme kontrollerini içerir. ACP açık bir geri dönüş yoludur |
| Claude Code, Gemini CLI, açık Codex ACP veya başka bir harici harness'ı OpenClaw _üzerinden_ çalıştırmak | Bu sayfa                              | Sohbete bağlı oturumlar, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, arka plan görevleri, çalışma zamanı kontrolleri                                                                              |
| Bir OpenClaw Gateway oturumunu bir düzenleyici veya istemci için ACP sunucusu _olarak_ sunmak   | [`openclaw acp`](/tr/cli/acp)            | Köprü modu. IDE/istemci, stdio/WebSocket üzerinden OpenClaw ile ACP konuşur                                                                                                                               |
| Yerel bir AI CLI'ını yalnızca metinli geri dönüş modeli olarak yeniden kullanmak                | [CLI Arka Uçları](/tr/gateway/cli-backends) | ACP değildir. OpenClaw araçları yok, ACP kontrolleri yok, harness çalışma zamanı yok                                                                                                                      |

## Bu kutudan çıktığı gibi çalışır mı?

Evet, resmi ACP çalışma zamanı plugin'ini yükledikten sonra:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Kaynak checkout'ları, `pnpm install` sonrasında yerel `extensions/acpx`
çalışma alanı plugin'ini kullanabilir. Hazır olma denetimi için `/acp doctor` çalıştırın.

OpenClaw ajanlara ACP oluşturmayı yalnızca ACP **gerçekten
kullanılabilir** olduğunda öğretir: ACP etkin olmalı, dispatch devre dışı bırakılmamış olmalı, geçerli
oturum sandbox tarafından engellenmemiş olmalı ve bir çalışma zamanı arka ucu
yüklenmiş olmalıdır. Bu koşullar karşılanmazsa, ajan kullanılamayan
bir arka uç önermesin diye ACP plugin skills ve
`sessions_spawn` ACP yönlendirmesi gizli kalır.

<AccordionGroup>
  <Accordion title="İlk çalıştırma tuzakları">
    - `plugins.allow` ayarlıysa, bu kısıtlayıcı bir plugin envanteridir ve **mutlaka** `acpx` içermelidir; aksi halde yüklü ACP arka ucu bilinçli olarak engellenir ve `/acp doctor` eksik allowlist girdisini bildirir.
    - Codex ACP adaptörü `acpx` plugin'iyle aşamalı olarak hazırlanır ve mümkün olduğunda yerel olarak başlatılır.
    - Codex ACP yalıtılmış bir `CODEX_HOME` ile çalışır; OpenClaw, ana makine Codex yapılandırmasından güvenilen proje girdilerini ve güvenli model/sağlayıcı yönlendirme yapılandırmasını kopyalar, auth, bildirimler ve hooks ise ana makine yapılandırmasında kalır.
    - Diğer hedef harness adaptörleri, onları ilk kez kullandığınızda hâlâ gerektiğinde `npx` ile getirilebilir.
    - Tedarikçi auth'u yine de o harness için ana makinede bulunmalıdır.
    - Ana makinede npm veya ağ erişimi yoksa, önbellekler önceden ısıtılana veya adaptör başka bir yolla yüklenene kadar ilk çalıştırma adaptör getirmeleri başarısız olur.

  </Accordion>
  <Accordion title="Çalışma zamanı önkoşulları">
    ACP gerçek bir harici harness işlemi başlatır. OpenClaw yönlendirme,
    arka plan görevi durumu, teslimat, bağlamalar ve politikanın sahibidir; harness
    kendi sağlayıcı oturum açma bilgilerine, model kataloğuna, dosya sistemi davranışına ve
    yerel araçlarına sahiptir.

    OpenClaw'ı suçlamadan önce şunları doğrulayın:

    - `/acp doctor` etkin ve sağlıklı bir arka uç bildiriyor.
    - Hedef kimliği, bu allowlist ayarlandığında `acp.allowedAgents` tarafından izinli.
    - Harness komutu Gateway ana makinesinde başlayabiliyor.
    - Sağlayıcı auth'u o harness için mevcut (`claude`, `codex`, `gemini`, `opencode`, `droid` vb.).
    - Seçilen model o harness için mevcut - model kimlikleri harness'lar arasında taşınabilir değildir.
    - İstenen `cwd` mevcut ve erişilebilir, ya da `cwd` öğesini atlayıp arka ucun varsayılanını kullanmasına izin verin.
    - İzin modu işe uygun. Etkileşimsiz oturumlar yerel izin istemlerine tıklayamaz, bu yüzden yazma/çalıştırma ağırlıklı kodlama çalıştırmaları genellikle başsız ilerleyebilen bir ACPX izin profiline ihtiyaç duyar.

  </Accordion>
</AccordionGroup>

OpenClaw plugin araçları ve yerleşik OpenClaw araçları varsayılan olarak
ACP harness'larına açılmaz. Harness'ın bu araçları doğrudan
çağırması gerektiğinde, açık MCP köprülerini yalnızca
[ACP ajanları - kurulum](/tr/tools/acp-agents-setup) içinde etkinleştirin.

## Desteklenen harness hedefleri

`acpx` arka ucuyla, bu harness kimliklerini `/acp spawn <id>`
veya `sessions_spawn({ runtime: "acp", agentId: "<id>" })` hedefleri olarak kullanın:

| Harness kimliği | Tipik arka uç                                  | Notlar                                                                              |
| --------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`        | Claude Code ACP adaptörü                      | Ana makinede Claude Code auth gerektirir.                                           |
| `codex`         | Codex ACP adaptörü                            | Yalnızca yerel `/codex` kullanılamadığında veya ACP istendiğinde açık ACP geri dönüşü. |
| `copilot`       | GitHub Copilot ACP adaptörü                   | Copilot CLI/çalışma zamanı auth gerektirir.                                         |
| `cursor`        | Cursor CLI ACP (`cursor-agent acp`)           | Yerel bir kurulum farklı bir ACP giriş noktası sunuyorsa acpx komutunu geçersiz kılın. |
| `droid`         | Factory Droid CLI                             | Harness ortamında Factory/Droid auth veya `FACTORY_API_KEY` gerektirir.             |
| `gemini`        | Gemini CLI ACP adaptörü                       | Gemini CLI auth veya API anahtarı kurulumu gerektirir.                              |
| `iflow`         | iFlow CLI                                     | Adaptör kullanılabilirliği ve model kontrolü, yüklü CLI'a bağlıdır.                 |
| `kilocode`      | Kilo Code CLI                                 | Adaptör kullanılabilirliği ve model kontrolü, yüklü CLI'a bağlıdır.                 |
| `kimi`          | Kimi/Moonshot CLI                             | Ana makinede Kimi/Moonshot auth gerektirir.                                         |
| `kiro`          | Kiro CLI                                      | Adaptör kullanılabilirliği ve model kontrolü, yüklü CLI'a bağlıdır.                 |
| `opencode`      | OpenCode ACP adaptörü                         | OpenCode CLI/sağlayıcı auth gerektirir.                                             |
| `openclaw`      | `openclaw acp` üzerinden OpenClaw Gateway köprüsü | ACP uyumlu bir harness'ın bir OpenClaw Gateway oturumuyla geri konuşmasını sağlar.   |
| `qwen`          | Qwen Code / Qwen CLI                          | Ana makinede Qwen uyumlu auth gerektirir.                                           |

Özel acpx ajan diğer adları acpx içinde yapılandırılabilir, ancak OpenClaw
politikası dispatch öncesinde yine de `acp.allowedAgents` ve varsa
`agents.list[].runtime.acp.agent` eşlemesini kontrol eder.

## Operatör runbook'u

Sohbetten hızlı `/acp` akışı:

<Steps>
  <Step title="Oluştur">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` veya açıkça
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
    `/acp cancel` (geçerli tur) veya `/acp close` (oturum + bağlamalar).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Yaşam döngüsü ayrıntıları">
    - Oluşturma, bir ACP çalışma zamanı oturumu oluşturur veya sürdürür, ACP meta verilerini OpenClaw oturum deposuna kaydeder ve çalışma üst öğe sahipliyse bir arka plan görevi oluşturabilir.
    - Üst öğe sahipli ACP oturumları, çalışma zamanı oturumu kalıcı olsa bile arka plan işi olarak ele alınır; tamamlama ve yüzeyler arası teslimat, normal kullanıcıya dönük sohbet oturumu gibi davranmak yerine üst görev bildiricisi üzerinden gider.
    - Görev bakımı, terminal durumdaki veya yetim kalmış üst öğe sahipli tek seferlik ACP oturumlarını kapatır. Kalıcı ACP oturumları, etkin bir konuşma bağlaması kaldığı sürece korunur; etkin bağlaması olmayan bayat kalıcı oturumlar, sahip görev tamamlandıktan veya görev kaydı yok olduktan sonra sessizce sürdürülememeleri için kapatılır.
    - Bağlı takip mesajları, bağlama kapatılana, odaktan çıkarılana, sıfırlanana veya süresi dolana kadar doğrudan ACP oturumuna gider.
    - Gateway komutları yerel kalır. `/acp ...`, `/status` ve `/unfocus` hiçbir zaman normal prompt metni olarak bağlı bir ACP harness'ına gönderilmez.
    - `cancel`, arka uç iptali desteklediğinde etkin turu iptal eder; bağlamayı veya oturum meta verilerini silmez.
    - `close`, OpenClaw açısından ACP oturumunu sonlandırır ve bağlamayı kaldırır. Bir harness, sürdürmeyi destekliyorsa kendi upstream geçmişini tutmaya devam edebilir.
    - acpx plugin'i, `close` sonrasında OpenClaw sahipli wrapper ve adaptör işlem ağaçlarını temizler ve Gateway başlangıcı sırasında bayat OpenClaw sahipli ACPX yetimlerini toplar.
    - Boşta olan çalışma zamanı worker'ları `acp.runtime.ttlMinutes` sonrasında temizlik için uygun hale gelir; depolanan oturum meta verileri `/acp sessions` için kullanılabilir kalır.

  </Accordion>
  <Accordion title="Yerel Codex yönlendirme kuralları">
    Etkin olduğunda **yerel Codex
    plugin'ine** yönlendirilmesi gereken doğal dil tetikleyicileri:

    - "Bu Discord kanalını Codex'e bağla."
    - "Bu sohbeti Codex thread'i `<id>` öğesine ekle."
    - "Codex thread'lerini göster, sonra bunu bağla."

    Yerel Codex konuşma bağlama, varsayılan sohbet denetimi yoludur.
    OpenClaw dinamik araçları yine OpenClaw üzerinden yürütülürken,
    shell/apply-patch gibi Codex'e özgü araçlar Codex içinde yürütülür.
    Codex'e özgü araç olayları için OpenClaw, Plugin kancalarının
    `before_tool_call` öğesini engelleyebilmesi, `after_tool_call` öğesini
    gözlemleyebilmesi ve Codex `PermissionRequest` olaylarını OpenClaw
    onayları üzerinden yönlendirebilmesi için her dönüşe özgü bir yerel
    kanca aktarıcısı ekler. Codex `Stop` kancaları OpenClaw
    `before_agent_finalize` öğesine aktarılır; burada Plugin'ler Codex
    yanıtını sonlandırmadan önce bir model geçişi daha isteyebilir.
    Aktarıcı kasıtlı olarak muhafazakâr kalır: Codex'e özgü araç
    argümanlarını değiştirmez veya Codex iş parçacığı kayıtlarını yeniden yazmaz.
    Açık ACP'yi yalnızca ACP çalışma zamanı/oturum modelini istediğinizde kullanın.
    Gömülü Codex destek sınırı
    [Codex harness v1 destek sözleşmesi](/tr/plugins/codex-harness-runtime#v1-support-contract)
    içinde belgelenmiştir.

  </Accordion>
  <Accordion title="Model / sağlayıcı / çalışma zamanı seçimi kısa kılavuzu">
    - eski Codex model referansları - doctor tarafından onarılan eski Codex OAuth/abonelik model rotası.
    - `openai/*` - OpenAI aracı dönüşleri için yerel Codex app-server gömülü çalışma zamanı.
    - `/codex ...` - yerel Codex konuşma denetimi.
    - `/acp ...` veya `runtime: "acp"` - açık ACP/acpx denetimi.

  </Accordion>
  <Accordion title="ACP yönlendirmesi doğal dil tetikleyicileri">
    ACP çalışma zamanına yönlendirilmesi gereken tetikleyiciler:

    - "Bunu tek seferlik bir Claude Code ACP oturumu olarak çalıştır ve sonucu özetle."
    - "Bu görev için Gemini CLI'yi bir iş parçacığında kullan, ardından takipleri aynı iş parçacığında tut."
    - "Codex'i ACP üzerinden arka plan iş parçacığında çalıştır."

    OpenClaw `runtime: "acp"` seçer, harness `agentId` öğesini çözer,
    desteklendiğinde geçerli konuşmaya veya iş parçacığına bağlanır ve
    takipleri kapanış/süre sonuna kadar bu oturuma yönlendirir. Codex bu yolu
    yalnızca ACP/acpx açık olduğunda veya yerel Codex Plugin'i istenen işlem
    için kullanılamadığında izler.

    `sessions_spawn` için `runtime: "acp"` yalnızca ACP etkinleştirildiğinde,
    istekte bulunan sanal alana alınmamış olduğunda ve bir ACP çalışma zamanı
    arka ucu yüklendiğinde duyurulur. `acp.dispatch.enabled=false`, otomatik
    ACP iş parçacığı dağıtımını duraklatır ancak açık
    `sessions_spawn({ runtime: "acp" })` çağrılarını gizlemez veya engellemez. `codex`,
    `claude`, `droid`, `gemini` veya `opencode` gibi ACP harness kimliklerini hedefler.
    Bu girdi açıkça `agents.list[].runtime.type="acp"` ile yapılandırılmadıkça
    `agents_list` içinden normal bir OpenClaw yapılandırma aracı kimliği geçirmeyin;
    aksi halde varsayılan alt aracı çalışma zamanını kullanın. Bir OpenClaw aracı
    `runtime.type="acp"` ile yapılandırıldığında OpenClaw, alttaki harness kimliği
    olarak `runtime.acp.agent` öğesini kullanır.

  </Accordion>
</AccordionGroup>

## ACP ile alt aracılar

Harici bir harness çalışma zamanı istediğinizde ACP kullanın. `codex`
Plugin'i etkin olduğunda Codex konuşma bağlama/denetimi için **yerel Codex
app-server** kullanın. OpenClaw'a özgü devredilmiş çalıştırmalar istediğinizde
**alt aracıları** kullanın.

| Alan          | ACP oturumu                           | Alt aracı çalıştırması             |
| ------------- | ------------------------------------- | ---------------------------------- |
| Çalışma zamanı | ACP arka uç Plugin'i (örneğin acpx)  | OpenClaw yerel alt aracı çalışma zamanı |
| Oturum anahtarı | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`  |
| Ana komutlar | `/acp ...`                            | `/subagents ...`                   |
| Başlatma aracı | `sessions_spawn` with `runtime:"acp"` | `sessions_spawn` (varsayılan çalışma zamanı) |

Ayrıca bkz. [Alt aracılar](/tr/tools/subagents).

## ACP Claude Code'u nasıl çalıştırır?

ACP üzerinden Claude Code için yığın şöyledir:

1. OpenClaw ACP oturum denetim düzlemi.
2. Resmi `@openclaw/acpx` çalışma zamanı Plugin'i.
3. Claude ACP bağdaştırıcısı.
4. Claude tarafı çalışma zamanı/oturum mekanizması.

ACP Claude; ACP denetimleri, oturum sürdürme, arka plan görevi izleme
ve isteğe bağlı konuşma/iş parçacığı bağlama içeren bir **harness oturumudur**.

CLI arka uçları ayrı, yalnızca metin tabanlı yerel geri dönüş çalışma zamanlarıdır - bkz.
[CLI Arka Uçları](/tr/gateway/cli-backends).

Operatörler için pratik kural şudur:

- **`/acp spawn`, bağlanabilir oturumlar, çalışma zamanı denetimleri veya kalıcı harness işi mi istiyorsunuz?** ACP kullanın.
- **Ham CLI üzerinden basit yerel metin geri dönüşü mü istiyorsunuz?** CLI arka uçlarını kullanın.

## Bağlı oturumlar

### Zihinsel model

- **Sohbet yüzeyi** - insanların konuşmayı sürdürdüğü yer (Discord kanalı, Telegram konusu, iMessage sohbeti).
- **ACP oturumu** - OpenClaw'ın yönlendirdiği kalıcı Codex/Claude/Gemini çalışma zamanı durumu.
- **Alt iş parçacığı/konu** - yalnızca `--thread ...` tarafından oluşturulan isteğe bağlı ek mesajlaşma yüzeyi.
- **Çalışma zamanı çalışma alanı** - harness'in çalıştığı dosya sistemi konumu (`cwd`, depo checkout'u, arka uç çalışma alanı). Sohbet yüzeyinden bağımsızdır.

### Geçerli konuşma bağlamaları

`/acp spawn <harness> --bind here`, geçerli konuşmayı başlatılan ACP oturumuna
sabitler - alt iş parçacığı yok, aynı sohbet yüzeyi. OpenClaw taşıma,
kimlik doğrulama, güvenlik ve teslimi sahiplenmeye devam eder. Bu konuşmadaki
takip mesajları aynı oturuma yönlendirilir; `/new` ve `/reset` oturumu yerinde
sıfırlar; `/acp close` bağlamayı kaldırır.

Örnekler:

```text
/codex bind                                              # yerel Codex bağlaması, gelecekteki mesajları buraya yönlendir
/codex model gpt-5.4                                     # bağlı yerel Codex iş parçacığını ayarla
/codex stop                                              # etkin yerel Codex dönüşünü denetle
/acp spawn codex --bind here                             # Codex için açık ACP geri dönüşü
/acp spawn codex --thread auto                           # alt iş parçacığı/konu oluşturabilir ve oraya bağlayabilir
/acp spawn codex --bind here --cwd /workspace/repo       # aynı sohbet bağlaması, Codex /workspace/repo içinde çalışır
```

<AccordionGroup>
  <Accordion title="Bağlama kuralları ve münhasırlık">
    - `--bind here` ve `--thread ...` karşılıklı olarak dışlayıcıdır.
    - `--bind here` yalnızca geçerli konuşma bağlaması duyuran kanallarda çalışır; aksi halde OpenClaw açık bir desteklenmiyor mesajı döndürür. Bağlamalar Gateway yeniden başlatmaları boyunca kalıcıdır.
    - Discord'da `spawnSessions`, `--thread auto|here` için alt iş parçacığı oluşturmayı kapılar - `--bind here` için değil.
    - `--cwd` olmadan farklı bir ACP aracısına başlatırsanız OpenClaw varsayılan olarak **hedef aracının** çalışma alanını devralır. Eksik devralınan yollar (`ENOENT`/`ENOTDIR`) arka uç varsayılanına geri döner; diğer erişim hataları (ör. `EACCES`) başlatma hatası olarak görünür.
    - Gateway yönetim komutları bağlı konuşmalarda yerel kalır - normal takip metni bağlı ACP oturumuna yönlendirilse bile `/acp ...` komutları OpenClaw tarafından işlenir; `/status` ve `/unfocus` da bu yüzey için komut işleme etkin olduğunda yerel kalır.

  </Accordion>
  <Accordion title="İş parçacığına bağlı oturumlar">
    Bir kanal bağdaştırıcısı için iş parçacığı bağlamaları etkinleştirildiğinde:

    - OpenClaw bir iş parçacığını hedef ACP oturumuna bağlar.
    - Bu iş parçacığındaki takip mesajları bağlı ACP oturumuna yönlendirilir.
    - ACP çıktısı aynı iş parçacığına geri teslim edilir.
    - Unfocus/close/archive/idle-timeout veya max-age süre sonu bağlamayı kaldırır.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` ve `/unfocus` Gateway komutlarıdır, ACP harness'e gönderilen istemler değildir.

    İş parçacığına bağlı ACP için gerekli özellik bayrakları:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` varsayılan olarak açıktır (otomatik ACP iş parçacığı dağıtımını duraklatmak için `false` ayarlayın; açık `sessions_spawn({ runtime: "acp" })` çağrıları çalışmaya devam eder).
    - Kanal bağdaştırıcısı iş parçacığı oturumu başlatmaları etkin (varsayılan: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    İş parçacığı bağlama desteği bağdaştırıcıya özeldir. Etkin kanal
    bağdaştırıcısı iş parçacığı bağlamalarını desteklemiyorsa OpenClaw açık bir
    desteklenmiyor/kullanılamıyor mesajı döndürür.

  </Accordion>
  <Accordion title="İş parçacığını destekleyen kanallar">
    - Oturum/iş parçacığı bağlama yeteneği sunan herhangi bir kanal bağdaştırıcısı.
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
  Hedef konuşmayı tanımlar. Kanal başına şekiller:

- **Discord kanalı/iş parçacığı:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack kanalı/DM:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Kararlı Slack kimliklerini tercih edin; kanal bağlamaları bu kanalın iş parçacıkları içindeki yanıtlarla da eşleşir.
- **Telegram forum konusu:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp DM/grup:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Doğrudan sohbetler için `+15555550123` gibi E.164 numaraları ve gruplar için `120363424282127706@g.us` gibi WhatsApp grup JID'leri kullanın.
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

ACP varsayılanlarını aracı başına bir kez tanımlamak için `agents.list[].runtime` kullanın:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness kimliği, ör. `codex` veya `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP bağlı oturumları için geçersiz kılma önceliği:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Küresel ACP varsayılanları (ör. `acp.backend`)

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

- OpenClaw, yapılandırılmış ACP oturumunun kanala özgü kabulden sonra ve kullanımdan önce var olmasını sağlar.
- Bu kanal, konu veya sohbetteki iletiler yapılandırılmış ACP oturumuna yönlendirilir.
- Yapılandırılmış ACP bağlamaları kendi oturum rotalarının sahibidir. Kanal yayın fan-out'u, eşleşen bir bağlama için yapılandırılmış ACP oturumunun yerini almaz.
- Bağlı konuşmalarda `/new` ve `/reset`, aynı ACP oturum anahtarını yerinde sıfırlar.
- Geçici çalışma zamanı bağlamaları (örneğin iş parçacığı odaklı akışlar tarafından oluşturulanlar) mevcut oldukları yerlerde uygulanmaya devam eder.
- Açık bir `cwd` olmadan aracılar arası ACP başlatmalarında OpenClaw, hedef aracı çalışma alanını aracı yapılandırmasından devralır.
- Eksik devralınan çalışma alanı yolları backend varsayılan cwd değerine geri döner; eksik olmayan erişim hataları başlatma hataları olarak yüzeye çıkar.

## ACP oturumlarını başlatma

Bir ACP oturumu başlatmanın iki yolu vardır:

<Tabs>
  <Tab title="sessions_spawn üzerinden">
    Bir aracı turundan veya araç çağrısından ACP oturumu başlatmak için `runtime: "acp"` kullanın.

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
    `runtime` varsayılan olarak `subagent` değerini alır; bu nedenle ACP oturumları için
    açıkça `runtime: "acp"` ayarlayın. `agentId` atlanırsa OpenClaw,
    yapılandırılmış olduğunda `acp.defaultAgent` kullanır. `mode: "session"`,
    kalıcı bağlı konuşmayı korumak için `thread: true` gerektirir.
    </Note>

  </Tab>
  <Tab title="/acp komutu üzerinden">
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
  ACP hedef harness kimliği. Ayarlanmışsa `acp.defaultAgent` değerine geri döner.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Desteklendiği yerlerde iş parçacığı bağlama akışı ister.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` tek seferliktir; `"session"` kalıcıdır. `thread: true` ise ve
  `mode` atlanırsa OpenClaw, çalışma zamanı yoluna göre varsayılan olarak
  kalıcı davranışı kullanabilir. `mode: "session"` için `thread: true` gerekir.
</ParamField>
<ParamField path="cwd" type="string">
  İstenen çalışma zamanı çalışma dizini (backend/çalışma zamanı
  ilkesi tarafından doğrulanır). Atlanırsa ACP başlatması, yapılandırılmış
  olduğunda hedef aracı çalışma alanını devralır; eksik devralınan yollar
  backend varsayılanlarına geri dönerken gerçek erişim hataları döndürülür.
</ParamField>
<ParamField path="label" type="string">
  Oturum/banner metninde kullanılan operatöre yönelik etiket.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Yeni bir oturum oluşturmak yerine mevcut bir ACP oturumunu sürdürür. Aracı,
  konuşma geçmişini `session/load` üzerinden yeniden oynatır. `runtime: "acp"`
  gerektirir.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"`, ilk ACP çalıştırma ilerleme özetlerini sistem olayları olarak
  istekte bulunan oturuma geri akıtır. Kabul edilen yanıtlar, tam aktarma geçmişi için
  izleyebileceğiniz oturum kapsamlı bir JSONL günlüğüne
  (`<sessionId>.acp-stream.jsonl`) işaret eden `streamLogPath` içerebilir.
  Üst ilerleme akışları, `streaming.progress.commentary=false` olmadığı sürece
  varsayılan olarak asistan yorumlarını ve ACP durum ilerlemesini gösterir. Discord da
  hiçbir akış modu yapılandırılmadığında üst önizlemeleri varsayılan olarak ilerleme
  moduna alır. Durum ilerlemesi yine de `acp.stream.tagVisibility` değerine uyar;
  bu nedenle `plan` gibi etiketler açıkça etkinleştirilmedikçe gizli kalır.
</ParamField>

ACP `sessions_spawn` çalıştırmaları, varsayılan alt tur sınırı için
`agents.defaults.subagents.runTimeoutSeconds` kullanır. Araç, çağrı başına zaman aşımı
geçersiz kılmalarını kabul etmez.

<ParamField path="model" type="string">
  ACP alt oturumu için açık model geçersiz kılma. Codex ACP başlatmaları,
  `openai/gpt-5.4` gibi OpenAI başvurularını `session/new` öncesinde Codex ACP başlangıç
  yapılandırmasına normalize eder; `openai/gpt-5.4/high` gibi slash biçimleri
  Codex ACP akıl yürütme eforunu da ayarlar.
  Atlandığında `sessions_spawn({ runtime: "acp" })`, yapılandırılmışsa mevcut
  alt aracı model varsayılanlarını (`agents.defaults.subagents.model` veya
  `agents.list[].subagents.model`) kullanır; aksi halde ACP harness'in kendi
  varsayılan modelini kullanmasına izin verir.
  Diğer harness'ler ACP `models` duyurmalı ve `session/set_model` desteklemelidir;
  aksi halde OpenClaw/acpx, hedef aracı varsayılanına sessizce geri dönmek yerine
  açıkça başarısız olur.
</ParamField>
<ParamField path="thinking" type="string">
  Açık düşünme/akıl yürütme eforu. Codex ACP için `minimal` düşük efora eşlenir,
  `low`/`medium`/`high`/`xhigh` doğrudan eşlenir ve `off`, reasoning-effort başlangıç
  geçersiz kılmasını atlar.
  Atlandığında ACP başlatmaları, seçili model için mevcut alt aracı düşünme varsayılanlarını
  ve model başına `agents.defaults.models["provider/model"].params.thinking`
  değerini kullanır.
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
    - `--bind here` alt thread oluşturmaz.
    - `--bind here` yalnızca geçerli konuşma bağlama desteği sunan kanallarda kullanılabilir.
    - `--bind` ve `--thread` aynı `/acp spawn` çağrısında birlikte kullanılamaz.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mod    | Davranış                                                                                           |
    | ------ | -------------------------------------------------------------------------------------------------- |
    | `auto` | Etkin bir thread içindeyken: o thread'i bağlar. Thread dışında: destekleniyorsa bir alt thread oluşturur/bağlar. |
    | `here` | Geçerli etkin thread gerektirir; bir thread içinde değilse başarısız olur.                         |
    | `off`  | Bağlama yoktur. Oturum bağlanmamış olarak başlar.                                                  |

    Notlar:

    - Thread olmayan bağlama yüzeylerinde varsayılan davranış fiilen `off` olur.
    - Thread'e bağlı spawn, kanal politikası desteği gerektirir:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Alt thread oluşturmadan geçerli konuşmayı sabitlemek istediğinizde `--bind here` kullanın.

  </Tab>
</Tabs>

## Teslim modeli

ACP oturumları etkileşimli çalışma alanları veya üst öğeye ait
arka plan işi olabilir. Teslim yolu bu yapıya bağlıdır.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Etkileşimli oturumlar, görünür bir sohbet yüzeyinde konuşmayı
    sürdürmek içindir:

    - `/acp spawn ... --bind here` geçerli konuşmayı ACP oturumuna bağlar.
    - `/acp spawn ... --thread ...` bir kanal thread'ini/konusunu ACP oturumuna bağlar.
    - Kalıcı yapılandırılmış `bindings[].type="acp"` eşleşen konuşmaları aynı ACP oturumuna yönlendirir.

    Bağlı konuşmadaki takip mesajları doğrudan ACP oturumuna
    yönlendirilir ve ACP çıktısı aynı kanala/thread'e/konuya geri
    teslim edilir.

    OpenClaw'ın harness'a gönderdiği:

    - Normal bağlı takipler, prompt metni olarak ve yalnızca harness/backend desteklediğinde eklerle birlikte gönderilir.
    - `/acp` yönetim komutları ve yerel Gateway komutları ACP dağıtımından önce yakalanır.
    - Çalışma zamanı tarafından oluşturulan tamamlama olayları hedef başına somutlaştırılır. OpenClaw ajanları OpenClaw'ın dahili çalışma zamanı bağlamı zarfını alır; harici ACP harness'ları, alt sonuç ve talimat içeren düz bir prompt alır. Ham `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` zarfı harici harness'lara asla gönderilmemeli veya ACP kullanıcı transkripti metni olarak kalıcılaştırılmamalıdır.
    - ACP transkript girdileri kullanıcıya görünen tetikleyici metni veya düz tamamlama prompt'unu kullanır. Dahili olay meta verileri mümkün olduğunda OpenClaw içinde yapılandırılmış kalır ve kullanıcı tarafından yazılmış sohbet içeriği olarak ele alınmaz.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Başka bir ajan çalıştırması tarafından spawn edilen tek seferlik ACP
    oturumları, alt ajanlara benzer arka plan alt öğeleridir:

    - Üst öğe işi `sessions_spawn({ runtime: "acp", mode: "run" })` ile ister.
    - Alt öğe kendi ACP harness oturumunda çalışır.
    - Alt öğe dönüşleri, yerel alt ajan spawn'larının kullandığı aynı arka plan hattında çalışır; böylece yavaş bir ACP harness'ı ilgisiz ana oturum işini engellemez.
    - Tamamlama, görev tamamlama duyuru yolu üzerinden geri bildirilir. OpenClaw, harici bir harness'a göndermeden önce dahili tamamlama meta verilerini düz bir ACP prompt'una dönüştürür; böylece harness'lar yalnızca OpenClaw'a ait çalışma zamanı bağlamı işaretçilerini görmez.
    - Kullanıcıya yönelik bir yanıt faydalı olduğunda üst öğe, alt öğe sonucunu normal asistan sesiyle yeniden yazar.

    Bu yolu üst öğe ile alt öğe arasında eşler arası sohbet olarak
    ele **almayın**. Alt öğenin üst öğeye geri dönen bir tamamlama
    kanalı zaten vardır.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send`, spawn sonrasında başka bir oturumu hedefleyebilir. Normal
    eş oturumlar için OpenClaw, mesajı enjekte ettikten sonra
    ajanlar arası (A2A) takip yolu kullanır:

    - Hedef oturumun yanıtını bekleyin.
    - İsteğe bağlı olarak istekte bulunan ile hedefin sınırlı sayıda takip dönüşü alışverişi yapmasına izin verin.
    - Hedeften bir duyuru mesajı üretmesini isteyin.
    - Bu duyuruyu görünür kanala veya thread'e teslim edin.

    Bu A2A yolu, gönderenin görünür bir takibe ihtiyaç duyduğu eş
    gönderimler için bir fallback'tir. İlgisiz bir oturumun bir ACP
    hedefini görebildiği ve ona mesaj gönderebildiği durumlarda,
    örneğin geniş `tools.sessions.visibility` ayarları altında, etkin
    kalır.

    OpenClaw, A2A izleme işlemini yalnızca istekte bulunan kendi
    üst öğesine ait tek seferlik ACP alt öğesinin üst öğesi olduğunda atlar. Bu durumda,
    görevin tamamlanmasının üstünde A2A çalıştırmak, üst öğeyi alt öğenin sonucuyla
    uyandırabilir, üst öğenin yanıtını alt öğeye geri iletebilir ve
    bir üst/alt öğe yankı döngüsü oluşturabilir. `sessions_send` sonucu, bu sahipli-alt-öğe durumu için
    `delivery.status="skipped"` bildirir çünkü
    tamamlama yolu sonuçtan zaten sorumludur.

  </Accordion>
  <Accordion title="Mevcut bir oturumu sürdür">
    Baştan başlamak yerine önceki bir ACP oturumunu devam ettirmek için `resumeSessionId` kullanın.
    Agent, konuşma geçmişini
    `session/load` üzerinden yeniden oynatır, böylece önceki içeriğin tam bağlamıyla devam eder.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Yaygın kullanım durumları:

    - Bir Codex oturumunu dizüstü bilgisayarınızdan telefonunuza devredin - agent’ınıza kaldığınız yerden devam etmesini söyleyin.
    - CLI içinde etkileşimli olarak başlattığınız bir kodlama oturumunu artık agent’ınız üzerinden başsız biçimde devam ettirin.
    - Bir gateway yeniden başlatması veya boşta kalma zaman aşımı nedeniyle kesintiye uğrayan işe devam edin.

    Notlar:

    - `resumeSessionId` yalnızca `runtime: "acp"` olduğunda geçerlidir; varsayılan alt agent çalışma zamanı bu yalnızca ACP’ye özgü alanı yok sayar.
    - `streamTo` yalnızca `runtime: "acp"` olduğunda geçerlidir; varsayılan alt agent çalışma zamanı bu yalnızca ACP’ye özgü alanı yok sayar.
    - `resumeSessionId`, OpenClaw kanal oturumu anahtarı değil, ana makineye yerel bir ACP/yürütme altyapısı sürdürme kimliğidir; OpenClaw dağıtımdan önce ACP başlatma ilkesini ve hedef agent ilkesini yine denetler, bu üst akış kimliğini yükleme yetkilendirmesi ise ACP arka ucuna veya yürütme altyapısına aittir.
    - `resumeSessionId` üst akış ACP konuşma geçmişini geri yükler; `thread` ve `mode` oluşturduğunuz yeni OpenClaw oturumuna yine normal şekilde uygulanır, bu nedenle `mode: "session"` yine `thread: true` gerektirir.
    - Hedef agent `session/load` desteğine sahip olmalıdır (Codex ve Claude Code destekler).
    - Oturum kimliği bulunamazsa başlatma net bir hatayla başarısız olur - yeni bir oturuma sessiz geri dönüş yapılmaz.

  </Accordion>
  <Accordion title="Dağıtım sonrası smoke testi">
    Bir Gateway dağıtımından sonra birim testlerine güvenmek yerine
    canlı uçtan uca denetim çalıştırın:

    1. Hedef ana makinede dağıtılan Gateway sürümünü ve commit’i doğrulayın.
    2. Canlı bir agent’a geçici bir ACPX köprü oturumu açın.
    3. Bu agent’tan `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` ve `Reply with exactly LIVE-ACP-SPAWN-OK` göreviyle `sessions_spawn` çağırmasını isteyin.
    4. `accepted=yes`, gerçek bir `childSessionKey` ve doğrulayıcı hatası olmadığını doğrulayın.
    5. Geçici köprü oturumunu temizleyin.

    Kapıyı `mode: "run"` üzerinde tutun ve `streamTo: "parent"` değerini atlayın -
    iş parçacığına bağlı `mode: "session"` ve akış aktarma yolları ayrı
    daha kapsamlı entegrasyon geçişleridir.

  </Accordion>
</AccordionGroup>

## Sandbox uyumluluğu

ACP oturumları şu anda OpenClaw sandbox içinde **değil**,
ana makine çalışma zamanında çalışır.

<Warning>
**Güvenlik sınırı:**

- Harici yürütme altyapısı, kendi CLI izinlerine ve seçilen `cwd` değerine göre okuyabilir/yazabilir.
- OpenClaw’ın sandbox ilkesi ACP yürütme altyapısı çalıştırmasını **sarmalamaz**.
- OpenClaw yine de ACP özellik kapılarını, izin verilen agent’ları, oturum sahipliğini, kanal bağlamalarını ve Gateway teslim ilkesini uygular.
- Sandbox tarafından zorlanan OpenClaw’a özgü işler için `runtime: "subagent"` kullanın.

</Warning>

Geçerli sınırlamalar:

- İstekte bulunan oturum sandbox içindeyse, ACP başlatmaları hem `sessions_spawn({ runtime: "acp" })` hem de `/acp spawn` için engellenir.
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
3. Geçerli istekte bulunan oturum geri dönüşü.

Geçerli konuşma bağlamaları ve iş parçacığı bağlamaları
2. adıma birlikte katılır.

Hiçbir hedef çözümlenemezse OpenClaw net bir hata döndürür
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
| `/acp install`       | Belirleyici kurulum ve etkinleştirme adımlarını yazdırır. | `/acp install`                                                |

`/acp status`, etkin çalışma zamanı seçeneklerini ve çalışma zamanı düzeyindeki ve
arka uç düzeyindeki oturum tanımlayıcılarını gösterir. Bir arka uçta bir yetenek eksik olduğunda
desteklenmeyen denetim hataları net biçimde görünür. `/acp sessions`,
geçerli bağlı veya istekte bulunan oturum için depoyu okur; hedef belirteçleri
(`session-key`, `session-id` veya `session-label`), özel agent başına `session.store`
kökleri dahil olmak üzere Gateway oturum keşfi üzerinden çözümlenir.

### Çalışma zamanı seçenekleri eşlemesi

`/acp` kolaylık komutlarına ve genel bir ayarlayıcıya sahiptir. Eşdeğer
işlemler:

| Komut                        | Şuna eşlenir                         | Notlar                                                                                                                                                                                                     |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | çalışma zamanı yapılandırma anahtarı `model` | Codex ACP için OpenClaw, `openai/<model>` değerini bağdaştırıcı model kimliğine normalleştirir ve `openai/gpt-5.4/high` gibi eğik çizgili akıl yürütme soneklerini `reasoning_effort` değerine eşler.     |
| `/acp set thinking <level>`  | kanonik seçenek `thinking`           | OpenClaw, mevcut olduğunda arka ucun duyurduğu eşdeğeri gönderir; sırayla `thinking`, ardından `effort`, `reasoning_effort` veya `thought_level` tercih edilir. Codex ACP için bağdaştırıcı değerleri `reasoning_effort` değerine eşler. |
| `/acp permissions <profile>` | kanonik seçenek `permissionProfile`  | OpenClaw, mevcut olduğunda `approval_policy`, `permission_profile`, `permissions` veya `permission_mode` gibi arka ucun duyurduğu eşdeğeri gönderir.                                                       |
| `/acp timeout <seconds>`     | kanonik seçenek `timeoutSeconds`     | OpenClaw, mevcut olduğunda `timeout` veya `timeout_seconds` gibi arka ucun duyurduğu eşdeğeri gönderir.                                                                                                    |
| `/acp cwd <path>`            | çalışma zamanı cwd geçersiz kılması  | Doğrudan güncelleme.                                                                                                                                                                                       |
| `/acp set <key> <value>`     | genel                                | `key=cwd`, cwd geçersiz kılma yolunu kullanır.                                                                                                                                                             |
| `/acp reset-options`         | tüm çalışma zamanı geçersiz kılmalarını temizler | -                                                                                                                                                                                                          |

## acpx yürütme altyapısı, Plugin kurulumu ve izinler

acpx yürütme altyapısı yapılandırması (Claude Code / Codex / Gemini CLI
takma adları), plugin-tools ve OpenClaw-tools MCP köprüleri ve ACP
izin modları için bkz.
[ACP agent’ları - kurulum](/tr/tools/acp-agents-setup).

## Sorun giderme

| Belirti                                                                     | Olası neden                                                                                                           | Çözüm                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Arka uç Plugin'i eksik, devre dışı veya `plugins.allow` tarafından engellenmiş.                                                       | Arka uç Plugin'ini kurun ve etkinleştirin, bu izin listesi ayarlandığında `plugins.allow` içine `acpx` ekleyin, ardından `/acp doctor` çalıştırın.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP genel olarak devre dışı bırakılmış.                                                                                                 | `acp.enabled=true` olarak ayarlayın.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Normal ileti dizisi mesajlarından otomatik gönderim devre dışı.                                                               | Otomatik ileti dizisi yönlendirmesini sürdürmek için `acp.dispatch.enabled=true` olarak ayarlayın; açık `sessions_spawn({ runtime: "acp" })` çağrıları çalışmaya devam eder.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Ajan izin listesinde değil.                                                                                                | İzin verilen `agentId` kullanın veya `acp.allowedAgents` değerini güncelleyin.                                                                                                                     |
| `/acp doctor` reports backend not ready right after startup                 | Arka uç Plugin'i eksik, devre dışı, izin/ret ilkesi tarafından engellenmiş veya yapılandırılmış yürütülebilir dosyası kullanılamıyor.        | Arka uç Plugin'ini kurun/etkinleştirin, `/acp doctor` komutunu yeniden çalıştırın ve sağlıksız kalırsa arka uç kurulumunu veya ilke hatasını inceleyin.                                           |
| Harness komutu bulunamadı                                                   | Bağdaştırıcı CLI'si kurulu değil, harici Plugin eksik veya Codex olmayan bir bağdaştırıcı için ilk çalıştırma `npx` alımı başarısız oldu. | `/acp doctor` çalıştırın, bağdaştırıcıyı Gateway ana makinesine kurun/önceden hazırlayın veya acpx ajan komutunu açıkça yapılandırın.                                                      |
| Harness'tan model bulunamadı hatası                                            | Model kimliği başka bir sağlayıcı/harness için geçerli, ancak bu ACP hedefi için geçerli değil.                                                | Bu harness tarafından listelenen bir modeli kullanın, modeli harness içinde yapılandırın veya geçersiz kılmayı atlayın.                                                                            |
| Harness'tan satıcı kimlik doğrulama hatası                                          | OpenClaw sağlıklı, ancak hedef CLI/sağlayıcı oturum açmamış.                                                     | Gateway ana makinesi ortamında oturum açın veya gerekli sağlayıcı anahtarını sağlayın.                                                                                             |
| `Unable to resolve session target: ...`                                     | Hatalı anahtar/kimlik/etiket belirteci.                                                                                                | `/acp sessions` çalıştırın, tam anahtarı/etiketi kopyalayın, yeniden deneyin.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here`, etkin ve bağlanabilir bir konuşma olmadan kullanıldı.                                                            | Hedef sohbet/kanala geçip yeniden deneyin veya bağlı olmayan başlatmayı kullanın.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Bağdaştırıcıda geçerli konuşma ACP bağlama yeteneği yok.                                                             | Desteklendiği yerde `/acp spawn ... --thread ...` kullanın, üst düzey `bindings[]` yapılandırın veya desteklenen bir kanala geçin.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here`, bir ileti dizisi bağlamının dışında kullanıldı.                                                                         | Hedef ileti dizisine geçin veya `--thread auto`/`off` kullanın.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Etkin bağlama hedefinin sahibi başka bir kullanıcı.                                                                           | Sahip olarak yeniden bağlayın veya farklı bir konuşma ya da ileti dizisi kullanın.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | Bağdaştırıcıda ileti dizisi bağlama yeteneği yok.                                                                               | `--thread off` kullanın veya desteklenen bağdaştırıcıya/kanala geçin.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP çalışma zamanı ana makine tarafındadır; istekte bulunan oturum korumalı alandadır.                                                              | Korumalı alandaki oturumlardan `runtime="subagent"` kullanın veya ACP başlatmayı korumalı alanda olmayan bir oturumdan çalıştırın.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP çalışma zamanı için `sandbox="require"` istendi.                                                                         | Zorunlu korumalı alan için `runtime="subagent"` kullanın veya korumalı alanda olmayan bir oturumdan `sandbox="inherit"` ile ACP kullanın.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | Hedef harness genel ACP model değiştirmeyi sunmuyor.                                                        | ACP `models`/`session/set_model` duyuran bir harness kullanın, Codex ACP model başvurularını kullanın veya kendi başlangıç bayrağı varsa modeli doğrudan harness içinde yapılandırın. |
| Bağlı oturum için ACP meta verileri eksik                                      | Eski/silinmiş ACP oturumu meta verileri.                                                                                    | `/acp spawn` ile yeniden oluşturun, ardından ileti dizisini yeniden bağlayın/odaklayın.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode`, etkileşimsiz ACP oturumunda yazma/yürütme işlemlerini engelliyor.                                                    | `plugins.entries.acpx.config.permissionMode` değerini `approve-all` olarak ayarlayın ve gateway'i yeniden başlatın. Bkz. [İzin yapılandırması](/tr/tools/acp-agents-setup#permission-configuration). |
| ACP oturumu az çıktıyla erken başarısız oluyor                                  | İzin istemleri `permissionMode`/`nonInteractivePermissions` tarafından engelleniyor.                                        | `AcpRuntimeError` için gateway günlüklerini kontrol edin. Tam izinler için `permissionMode=approve-all` ayarlayın; zarif bozulma için `nonInteractivePermissions=deny` ayarlayın.        |
| ACP oturumu işi tamamladıktan sonra süresiz olarak takılıyor                       | Harness süreci tamamlandı, ancak ACP oturumu tamamlanmayı bildirmedi.                                                    | OpenClaw'ı güncelleyin; geçerli acpx temizliği, kapanışta ve Gateway başlangıcında OpenClaw'a ait eski sarmalayıcı ve bağdaştırıcı süreçlerini toplar.                                             |
| Harness `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` görüyor                        | İç olay zarfı ACP sınırından dışarı sızdı.                                                                | OpenClaw'ı güncelleyin ve tamamlama akışını yeniden çalıştırın; harici harness'lar yalnızca düz tamamlama istemleri almalıdır.                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable`, ACP/acpx'e değil
yerel Codex hook aktarıcısına aittir. Bağlı bir Codex sohbetinde, `/new` veya
`/reset` ile yeni bir oturum başlatın; bir kez çalışıp sonraki yerel araç
çağrısında geri dönerse, `/new` komutunu tekrarlamak yerine Codex app-server'ı
veya OpenClaw Gateway'i yeniden başlatın. Bkz. [Codex harness sorun giderme](/tr/plugins/codex-harness#troubleshooting).
</Note>

## İlgili

- [ACP ajanları - kurulum](/tr/tools/acp-agents-setup)
- [Ajan gönderme](/tr/tools/agent-send)
- [CLI Arka Uçları](/tr/gateway/cli-backends)
- [Codex harness](/tr/plugins/codex-harness)
- [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Çok ajanlı korumalı alan araçları](/tr/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (köprü modu)](/tr/cli/acp)
- [Alt ajanlar](/tr/tools/subagents)
