---
read_when:
    - Kodlama çalışma düzeneklerini ACP üzerinden çalıştırma
    - Mesajlaşma kanallarında konuşmaya bağlı ACP oturumlarını ayarlama
    - Bir mesaj kanalı görüşmesini kalıcı bir ACP oturumuna bağlama
    - ACP arka ucunda, Plugin bağlantılarında veya tamamlama iletiminde sorun giderme
    - Sohbetten /acp komutlarını çalıştırma
sidebarTitle: ACP agents
summary: Harici kodlama altyapılarını (Claude Code, Cursor, Gemini CLI, açık Codex ACP, OpenClaw ACP, OpenCode) ACP arka ucu üzerinden çalıştırın
title: ACP aracıları
x-i18n:
    generated_at: "2026-07-12T12:16:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f5a5588710bea3027583bf06587706eb476d3ad1a31b0ef798586fcb895aa9
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) oturumları,
OpenClaw'ın harici kodlama çalıştırıcılarını (Claude Code, Cursor, Copilot, Droid,
OpenClaw ACP, OpenCode, Gemini CLI ve desteklenen diğer ACPX çalıştırıcıları)
bir ACP arka uç plugini üzerinden çalıştırmasını sağlar. Her başlatma bir
[arka plan görevi](/tr/automation/tasks) olarak izlenir.

<Note>
**ACP, varsayılan Codex yolu değil, harici çalıştırıcı yoludur.** Yerel
Codex uygulama sunucusu plugini, `/codex ...` kontrollerini ve ajan turları için
varsayılan `openai/gpt-*` gömülü çalışma zamanını yönetir; ACP ise `/acp ...`
kontrollerini ve `sessions_spawn({ runtime: "acp" })` oturumlarını yönetir.

Codex veya Claude Code'un mevcut OpenClaw kanal konuşmalarına harici bir MCP
istemcisi olarak doğrudan bağlanmasını sağlamak için ACP yerine
[`openclaw mcp serve`](/tr/cli/mcp) kullanın.
</Note>

## Hangi sayfayı kullanmalıyım?

| Yapmak istediğiniz...                                                                               | Bunu kullanın                          | Notlar                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Geçerli konuşmada Codex'i bağlamak veya denetlemek                                                   | `/codex bind`, `/codex threads`        | `codex` plugini etkinleştirildiğinde yerel Codex uygulama sunucusu yolu: bağlı sohbet yanıtları, görsel iletme, model/hızlı/izinler, durdurma ve yönlendirme. ACP açıkça seçilen bir geri dönüş yoludur |
| Claude Code, Gemini CLI, açıkça Codex ACP veya başka bir harici çalıştırıcıyı OpenClaw _üzerinden_ çalıştırmak | Bu sayfa                               | Sohbete bağlı oturumlar, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, arka plan görevleri, çalışma zamanı kontrolleri                                                                                  |
| Bir OpenClaw Gateway oturumunu bir düzenleyici veya istemci için ACP sunucusu _olarak_ sunmak         | [`openclaw acp`](/tr/cli/acp)             | Köprü modu: Bir IDE/istemci, stdio/WebSocket üzerinden OpenClaw ile ACP konuşur                                                                                                                                |
| Yerel bir yapay zekâ CLI'sini yalnızca metin destekleyen geri dönüş modeli olarak yeniden kullanmak  | [CLI Arka Uçları](/tr/gateway/cli-backends) | ACP değildir: OpenClaw araçları, ACP kontrolleri veya çalıştırıcı çalışma zamanı yoktur                                                                                                                      |

## Bu, kutudan çıktığı gibi çalışır mı?

Evet, resmî ACP çalışma zamanı pluginini yükledikten sonra:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Kaynak kod kopyaları, `pnpm install` sonrasında yerel `extensions/acpx` çalışma
alanı pluginini kullanabilir. Hazırlık denetimi için `/acp doctor` çalıştırın.

OpenClaw, ajanlara ACP ile başlatmayı yalnızca ACP **gerçekten kullanılabilir**
olduğunda öğretir: ACP etkin olmalı, gönderim devre dışı bırakılmamış olmalı,
geçerli oturum korumalı alan tarafından engellenmemeli ve bir çalışma zamanı
arka ucu yüklenmiş ve sağlıklı olmalıdır. Herhangi bir koşul karşılanmazsa
ACP Skills ve `sessions_spawn` ACP rehberliği gizli kalır; böylece ajan,
kullanılamayan bir arka uç önermez.

<AccordionGroup>
  <Accordion title="İlk çalıştırmada dikkat edilmesi gerekenler">
    - `plugins.allow` ayarlanmışsa kısıtlayıcı bir plugin envanteridir ve **mutlaka** `acpx` içermelidir; aksi hâlde yüklü ACP arka ucu bilerek engellenir (`/acp doctor`, izin listesindeki eksik girdiyi bildirir).
    - Codex ACP bağdaştırıcısı `acpx` pluginiyle birlikte gelir ve mümkün olduğunda yerel olarak başlatılır.
    - Codex ACP, yalıtılmış bir `CODEX_HOME` ile çalışır. OpenClaw, güvenilen proje güven girdilerini ve güvenli model/sağlayıcı yönlendirme yapılandırmasını (`model`, `model_provider`, `model_reasoning_effort`, `sandbox_mode` ve güvenli `model_providers.<name>` alanları) ana makinedeki Codex yapılandırmasından kopyalar; kimlik doğrulama, bildirimler ve kancalar yalnızca ana makine yapılandırmasında kalır.
    - Diğer hedef çalıştırıcı bağdaştırıcıları ilk kullanımda gerektiğinde `npx` ile getirilebilir.
    - İlgili çalıştırıcı için sağlayıcı kimlik doğrulaması ana makinede önceden mevcut olmalıdır.
    - Ana makinede npm veya ağ erişimi yoksa önbellekler önceden ısıtılana ya da bağdaştırıcı başka bir şekilde yüklenene kadar ilk çalıştırmadaki bağdaştırıcı getirme işlemleri başarısız olur.

  </Accordion>
  <Accordion title="Çalışma zamanı ön koşulları">
    ACP, gerçek bir harici çalıştırıcı süreci başlatır. OpenClaw yönlendirmeyi,
    arka plan görevi durumunu, teslimatı, bağlamaları ve politikayı yönetir;
    çalıştırıcı ise sağlayıcı oturum açma işlemini, model kataloğunu, dosya
    sistemi davranışını ve yerel araçlarını yönetir.

    OpenClaw'ı sorumlu tutmadan önce şunları doğrulayın:

    - `/acp doctor`, etkin ve sağlıklı bir arka uç bildiriyor.
    - İzin listesi ayarlanmışsa hedef kimliğe `acp.allowedAgents` tarafından izin veriliyor.
    - Çalıştırıcı komutu Gateway ana makinesinde başlatılabiliyor.
    - İlgili çalıştırıcı için sağlayıcı kimlik doğrulaması mevcut (`claude`, `codex`, `gemini`, `opencode`, `droid` vb.).
    - Seçilen model ilgili çalıştırıcıda mevcut; model kimlikleri çalıştırıcılar arasında taşınabilir değildir.
    - İstenen `cwd` mevcut ve erişilebilir; aksi hâlde `cwd` değerini atlayın ve arka ucun varsayılanını kullanmasına izin verin.
    - İzin modu işe uygun. Etkileşimsiz oturumlar yerel izin istemlerine tıklayamaz; bu nedenle yoğun yazma/yürütme gerektiren kodlama çalışmaları genellikle gözetimsiz ilerleyebilen bir ACPX izin profili gerektirir.

  </Accordion>
</AccordionGroup>

OpenClaw plugin araçları ve yerleşik OpenClaw araçları, varsayılan olarak ACP
çalıştırıcılarına **sunulmaz**. Yalnızca çalıştırıcının bu araçları doğrudan
çağırması gerektiğinde [ACP ajanları - kurulum](/tr/tools/acp-agents-setup)
bölümündeki açık MCP köprülerini etkinleştirin.

## Desteklenen çalıştırıcı hedefleri

`acpx` arka ucuyla bu kimlikleri `/acp spawn <id>` veya
`sessions_spawn({ runtime: "acp", agentId: "<id>" })` hedefleri olarak kullanın:

| Çalıştırıcı kimliği | Tipik arka uç                                  | Notlar                                                                                         |
| ------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `claude`            | Claude Code ACP bağdaştırıcısı                 | Ana makinede Claude Code kimlik doğrulaması gerektirir.                                        |
| `codex`             | Codex ACP bağdaştırıcısı                       | Yalnızca yerel `/codex` kullanılamadığında veya ACP istendiğinde açık ACP geri dönüş yoludur.   |
| `copilot`           | GitHub Copilot ACP bağdaştırıcısı              | Copilot CLI/çalışma zamanı kimlik doğrulaması gerektirir.                                      |
| `cursor`            | Cursor CLI ACP (`cursor-agent acp`)            | Yerel yükleme farklı bir ACP giriş noktası sunuyorsa acpx komutunu geçersiz kılın.              |
| `droid`             | Factory Droid CLI                              | Çalıştırıcı ortamında Factory/Droid kimlik doğrulaması veya `FACTORY_API_KEY` gerektirir.       |
| `fast-agent`        | fast-agent-mcp ACP bağdaştırıcısı              | Gerektiğinde `uvx` ile getirilir.                                                              |
| `gemini`            | Gemini CLI ACP bağdaştırıcısı                  | Gemini CLI kimlik doğrulaması veya API anahtarı kurulumu gerektirir.                           |
| `iflow`             | iFlow CLI                                      | Bağdaştırıcı kullanılabilirliği ve model denetimi, yüklü CLI'ye bağlıdır.                       |
| `kilocode`          | Kilo Code CLI                                  | Bağdaştırıcı kullanılabilirliği ve model denetimi, yüklü CLI'ye bağlıdır.                       |
| `kimi`              | Kimi/Moonshot CLI                              | Ana makinede Kimi/Moonshot kimlik doğrulaması gerektirir.                                      |
| `kiro`              | Kiro CLI                                       | Bağdaştırıcı kullanılabilirliği ve model denetimi, yüklü CLI'ye bağlıdır.                       |
| `mux`               | Mux CLI ACP bağdaştırıcısı                     | Gerektiğinde `npx` ile getirilir.                                                              |
| `opencode`          | OpenCode ACP bağdaştırıcısı                    | OpenCode CLI/sağlayıcı kimlik doğrulaması gerektirir.                                          |
| `openclaw`          | `openclaw acp` üzerinden OpenClaw Gateway köprüsü | ACP uyumlu bir çalıştırıcının bir OpenClaw Gateway oturumuyla iletişim kurmasını sağlar.     |
| `qoder`             | Qoder CLI                                      | Bağdaştırıcı kullanılabilirliği ve model denetimi, yüklü CLI'ye bağlıdır.                       |
| `qwen`              | Qwen Code / Qwen CLI                           | Ana makinede Qwen uyumlu kimlik doğrulaması gerektirir.                                        |
| `trae`              | Trae CLI ACP bağdaştırıcısı                    | Bağdaştırıcı kullanılabilirliği ve model denetimi, yüklü CLI'ye bağlıdır.                       |

`pi` (pi-acp) de acpx arka ucuna kayıtlıdır ancak yukarıdakilerle aynı anlamda
bir kodlama çalıştırıcısı değildir.

Özel acpx ajan takma adları acpx içinde yapılandırılabilir; ancak OpenClaw
politikası, gönderimden önce yine de `acp.allowedAgents` ve tüm
`agents.list[].runtime.acp.agent` eşlemelerini denetler.

## Operatör çalışma kılavuzu

Sohbetten hızlı `/acp` akışı:

<Steps>
  <Step title="Başlatma">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` veya açıkça
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Çalışma">
    Bağlı konuşmada veya ileti dizisinde devam edin (ya da oturum anahtarını
    açıkça hedefleyin).
  </Step>
  <Step title="Durumu denetleme">
    `/acp status`
  </Step>
  <Step title="Ayarlama">
    `/acp model <provider/model>`, `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Yönlendirme">
    Bağlamı değiştirmeden: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Durdurma">
    `/acp cancel` (geçerli tur) veya `/acp close` (oturum + bağlamalar).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Yaşam döngüsü ayrıntıları">
    - Başlatma, bir ACP çalışma zamanı oturumu oluşturur veya sürdürür, ACP meta verilerini OpenClaw oturum deposuna kaydeder ve çalıştırma üst süreç tarafından yönetiliyorsa bir arka plan görevi oluşturabilir.
    - Üst süreç tarafından yönetilen ACP oturumları, çalışma zamanı oturumu kalıcı olsa bile arka plan işi olarak ele alınır; tamamlanma ve yüzeyler arası teslimat, normal kullanıcıya yönelik sohbet oturumu gibi davranmak yerine üst görev bildirimcisi üzerinden gerçekleşir.
    - Görev bakımı, sonlanmış veya sahipsiz, üst süreç tarafından yönetilen tek seferlik ACP oturumlarını kapatır. Etkin bir konuşma bağlaması bulunduğu sürece kalıcı ACP oturumları korunur; etkin bağlaması olmayan eski kalıcı oturumlar kapatılır, böylece sahip görev tamamlandıktan veya görev kaydı kaybolduktan sonra sessizce sürdürülemezler.
    - Bağlı takip iletileri, bağlama kapatılana, odaktan çıkarılana, sıfırlanana veya süresi dolana kadar doğrudan ACP oturumuna gider.
    - Gateway komutları yerel kalır. `/acp ...`, `/status` ve `/unfocus`, bağlı bir ACP çalıştırıcısına hiçbir zaman normal istem metni olarak gönderilmez.
    - Arka uç iptali desteklediğinde `cancel` etkin turu iptal eder; bağlamayı veya oturum meta verilerini silmez.
    - `close`, OpenClaw açısından ACP oturumunu sonlandırır ve bağlamayı kaldırır. Bir çalıştırıcı, sürdürmeyi destekliyorsa kendi üst akış geçmişini yine de tutabilir.
    - acpx plugini, `close` sonrasında OpenClaw tarafından yönetilen sarmalayıcı ve bağdaştırıcı süreç ağaçlarını temizler ve Gateway başlatılırken eski, OpenClaw tarafından yönetilen ACPX sahipsiz süreçlerini sonlandırır.
    - Boştaki çalışma zamanı işçileri, `acp.runtime.ttlMinutes` sonrasında temizlenmeye uygun hâle gelir; depolanan oturum meta verileri `/acp sessions` için kullanılabilir kalır.

  </Accordion>
  <Accordion title="Yerel Codex yönlendirme kuralları">
    Etkinleştirildiğinde **yerel Codex pluginine** yönlendirilmesi gereken doğal
    dil tetikleyicileri:

    - "Bu Discord kanalını Codex'e bağla."
    - "Bu sohbeti `<id>` Codex ileti dizisine ekle."
    - "Codex ileti dizilerini göster, ardından bunu bağla."

    Yerel Codex konuşma bağlama, varsayılan sohbet denetimi yoludur.
    OpenClaw dinamik araçları yine OpenClaw üzerinden çalışırken shell/apply-patch
    gibi Codex'e özgü araçlar Codex içinde çalışır. Codex'e özgü araç olaylarında
    OpenClaw, Plugin hook'larının `before_tool_call` çağrısını engelleyebilmesi,
    `after_tool_call` çağrısını gözlemleyebilmesi ve Codex `PermissionRequest`
    olaylarını OpenClaw onayları üzerinden yönlendirebilmesi için her turda yerel
    bir hook aktarıcısı ekler. Codex `Stop` hook'ları OpenClaw
    `before_agent_finalize` hook'una aktarılır; burada plugin'ler Codex yanıtını
    sonlandırmadan önce modelden bir geçiş daha isteyebilir. Aktarıcı kasıtlı olarak
    temkinli davranır: Codex'e özgü araç bağımsız değişkenlerini değiştirmez veya
    Codex iş parçacığı kayıtlarını yeniden yazmaz. ACP çalışma zamanı/oturum
    modelini istediğinizde yalnızca açıkça ACP kullanın. Gömülü Codex destek sınırı,
    [Codex donanımı v1 destek sözleşmesinde](/tr/plugins/codex-harness-runtime#v1-support-contract)
    belgelenmiştir.

  </Accordion>
  <Accordion title="Model / sağlayıcı / çalışma zamanı seçimi kısa kılavuzu">
    - eski Codex model başvuruları - doctor tarafından onarılan eski Codex OAuth/abonelik model rotası.
    - `openai/*` - OpenAI ajan turları için yerel Codex app-server gömülü çalışma zamanı.
    - `/codex ...` - yerel Codex konuşma denetimi.
    - `/acp ...` veya `runtime: "acp"` - açık ACP/acpx denetimi.

  </Accordion>
  <Accordion title="ACP yönlendirmesi için doğal dil tetikleyicileri">
    ACP çalışma zamanına yönlendirilmesi gereken tetikleyiciler:

    - "Bunu tek seferlik bir Claude Code ACP oturumu olarak çalıştır ve sonucu özetle."
    - "Bu görev için bir iş parçacığında Gemini CLI kullan, ardından takip mesajlarını aynı iş parçacığında sürdür."
    - "Codex'i ACP üzerinden bir arka plan iş parçacığında çalıştır."

    OpenClaw `runtime: "acp"` seçeneğini belirler, donanımın `agentId` değerini
    çözümler, desteklendiğinde geçerli konuşmaya veya iş parçacığına bağlanır ve
    kapanana/süresi dolana kadar takip mesajlarını bu oturuma yönlendirir. Codex
    bu yolu yalnızca ACP/acpx açıkça belirtildiğinde veya istenen işlem için yerel
    Codex plugin'i kullanılamadığında izler.

    `sessions_spawn` için `runtime: "acp"` yalnızca ACP etkin olduğunda, istekte
    bulunan korumalı alanda olmadığında ve bir ACP çalışma zamanı arka ucu
    yüklendiğinde duyurulur. `acp.dispatch.enabled=false`, otomatik ACP iş parçacığı
    gönderimini duraklatır ancak açık `sessions_spawn({ runtime: "acp" })`
    çağrılarını gizlemez veya engellemez. `codex`, `claude`, `droid`, `gemini`
    veya `opencode` gibi ACP donanım kimliklerini hedefler. İlgili girdi açıkça
    `agents.list[].runtime.type="acp"` ile yapılandırılmadıkça `agents_list`
    içindeki normal bir OpenClaw yapılandırma ajanı kimliğini iletmeyin; bunun
    yerine varsayılan alt ajan çalışma zamanını kullanın. Bir OpenClaw ajanı
    `runtime.type="acp"` ile yapılandırıldığında OpenClaw, temel donanım kimliği
    olarak `runtime.acp.agent` değerini kullanır.

  </Accordion>
</AccordionGroup>

## ACP ile alt ajanların karşılaştırması

Harici bir donanım çalışma zamanı istediğinizde ACP kullanın. `codex` plugin'i
etkinken Codex konuşma bağlama/denetimi için **yerel Codex app-server** kullanın.
OpenClaw'a özgü yetkilendirilmiş çalıştırmalar istediğinizde **alt ajanları**
kullanın.

| Alan          | ACP oturumu                           | Alt ajan çalıştırması               |
| ------------- | ------------------------------------- | ----------------------------------- |
| Çalışma zamanı | ACP arka uç plugin'i (örneğin acpx)  | OpenClaw yerel alt ajan çalışma zamanı |
| Oturum anahtarı | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`   |
| Ana komutlar  | `/acp ...`                            | `/subagents ...`                    |
| Başlatma aracı | `runtime:"acp"` ile `sessions_spawn` | `sessions_spawn` (varsayılan çalışma zamanı) |

Ayrıca bkz. [Alt ajanlar](/tr/tools/subagents).

## ACP, Claude Code'u nasıl çalıştırır?

ACP üzerinden Claude Code için yığın şöyledir:

1. OpenClaw ACP oturum denetim düzlemi.
2. Resmî `@openclaw/acpx` çalışma zamanı plugin'i.
3. Claude ACP bağdaştırıcısı.
4. Claude tarafındaki çalışma zamanı/oturum mekanizması.

ACP Claude; ACP denetimleri, oturumu sürdürme, arka plan görevi izleme ve
isteğe bağlı konuşma/iş parçacığı bağlama özelliklerine sahip bir **donanım
oturumudur**.

CLI arka uçları, yalnızca metin kullanan ayrı yerel geri dönüş çalışma
zamanlarıdır; bkz. [CLI Arka Uçları](/tr/gateway/cli-backends).

Operatörler için pratik kural şudur:

- **`/acp spawn`, bağlanabilir oturumlar, çalışma zamanı denetimleri veya kalıcı donanım çalışması mı istiyorsunuz?** ACP kullanın.
- **Ham CLI üzerinden basit bir yerel metin geri dönüşü mü istiyorsunuz?** CLI arka uçlarını kullanın.

## Bağlı oturumlar

### Zihinsel model

- **Sohbet yüzeyi** - insanların konuşmayı sürdürdüğü yer (Discord kanalı, Telegram konusu, iMessage sohbeti).
- **ACP oturumu** - OpenClaw'ın yönlendirdiği kalıcı Codex/Claude/Gemini çalışma zamanı durumu.
- **Alt iş parçacığı/konu** - yalnızca `--thread ...` tarafından oluşturulan isteğe bağlı ek mesajlaşma yüzeyi.
- **Çalışma zamanı çalışma alanı** - donanımın çalıştığı dosya sistemi konumu (`cwd`, depo çalışma kopyası, arka uç çalışma alanı). Sohbet yüzeyinden bağımsızdır.

### Geçerli konuşma bağlamaları

`/acp spawn <harness> --bind here`, geçerli konuşmayı başlatılan ACP oturumuna
sabitler; alt iş parçacığı oluşturulmaz ve aynı sohbet yüzeyi kullanılır.
OpenClaw taşıma, kimlik doğrulama, güvenlik ve teslimatı yönetmeye devam eder.
Bu konuşmadaki takip mesajları aynı oturuma yönlendirilir; `/new` ve `/reset`
oturumu yerinde sıfırlar; `/acp close` bağlamayı kaldırır.

Örnekler:

```text
/codex bind                                              # yerel Codex bağlaması, gelecekteki mesajları buraya yönlendir
/codex model gpt-5.4                                     # bağlı yerel Codex iş parçacığını ayarla
/codex stop                                              # etkin yerel Codex turunu denetle
/acp spawn codex --bind here                             # Codex için açık ACP geri dönüşü
/acp spawn codex --thread auto                           # bir alt iş parçacığı/konu oluşturup oraya bağlanabilir
/acp spawn codex --bind here --cwd /workspace/repo       # aynı sohbet bağlaması, Codex /workspace/repo içinde çalışır
```

<AccordionGroup>
  <Accordion title="Bağlama kuralları ve karşılıklı dışlama">
    - `--bind here` ile `--thread ...` birlikte kullanılamaz.
    - `--bind here` yalnızca geçerli konuşma bağlamayı desteklediğini bildiren kanallarda çalışır; aksi durumda OpenClaw açık bir desteklenmiyor mesajı döndürür. Bağlamalar Gateway yeniden başlatmaları boyunca kalıcıdır.
    - Discord'da `spawnSessions`, `--thread auto|here` için alt iş parçacığı oluşturmayı denetler; `--bind here` için değil.
    - `--cwd` olmadan farklı bir ACP ajanına başlatırsanız OpenClaw varsayılan olarak **hedef ajanın** çalışma alanını devralır. Eksik devralınan yollar (`ENOENT`/`ENOTDIR`) arka uç varsayılanına geri döner; diğer erişim hataları (ör. `EACCES`) başlatma hataları olarak gösterilir.
    - Gateway yönetim komutları bağlı konuşmalarda yerel kalır; normal takip metni bağlı ACP oturumuna yönlendirilse bile `/acp ...` komutları OpenClaw tarafından işlenir. Komut işleme söz konusu yüzey için etkin olduğunda `/status` ve `/unfocus` da yerel kalır.

  </Accordion>
  <Accordion title="İş parçacığına bağlı oturumlar">
    Bir kanal bağdaştırıcısı için iş parçacığı bağlamaları etkinleştirildiğinde:

    - OpenClaw bir iş parçacığını hedef ACP oturumuna bağlar.
    - Bu iş parçacığındaki takip mesajları bağlı ACP oturumuna yönlendirilir.
    - ACP çıktısı aynı iş parçacığına geri teslim edilir.
    - Odağı kaldırma/kapatma/arşivleme/boşta kalma zaman aşımı veya azami yaş süresinin dolması bağlamayı kaldırır.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` ve `/unfocus`, ACP donanımına gönderilen istemler değil, Gateway komutlarıdır.

    İş parçacığına bağlı ACP için gerekli özellik bayrakları:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` varsayılan olarak açıktır (otomatik ACP iş parçacığı gönderimini duraklatmak için `false` olarak ayarlayın; açık `sessions_spawn({ runtime: "acp" })` çağrıları çalışmaya devam eder).
    - Kanal bağdaştırıcısı iş parçacığı oturumu başlatmaları etkinleştirilmiş olmalıdır (varsayılan: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    İş parçacığı bağlama desteği bağdaştırıcıya özgüdür. Etkin kanal
    bağdaştırıcısı iş parçacığı bağlamalarını desteklemiyorsa OpenClaw açık bir
    desteklenmiyor/kullanılamıyor mesajı döndürür.

  </Accordion>
  <Accordion title="İş parçacığı destekleyen kanallar">
    - Oturum/iş parçacığı bağlama yeteneği sunan tüm kanal bağdaştırıcıları.
    - Geçerli yerleşik destek: **Discord** iş parçacıkları/kanalları, **Telegram** konuları (gruplardaki/süper gruplardaki forum konuları ve DM konuları).
    - Plugin kanalları aynı bağlama arabirimi üzerinden destek ekleyebilir.

  </Accordion>
</AccordionGroup>

## Kalıcı kanal bağlamaları

Geçici olmayan iş akışları için kalıcı ACP bağlamalarını üst düzey
`bindings[]` girdilerinde yapılandırın.

### Bağlama modeli

<ParamField path="bindings[].type" type='"acp"'>
  Kalıcı bir ACP konuşma bağlamasını işaretler.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Hedef konuşmayı tanımlar. Kanal başına şekiller:

- **Discord kanalı/iş parçacığı:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack kanalı/DM:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Kararlı Slack kimliklerini tercih edin; kanal bağlamaları, ilgili kanalın iş parçacıklarındaki yanıtlarla da eşleşir.
- **Telegram forum konusu:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp DM/grubu:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Doğrudan sohbetler için `+15555550123` gibi E.164 numaralarını, gruplar için `120363424282127706@g.us` gibi WhatsApp grup JID'lerini kullanın.
- **iMessage DM/grubu:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Kararlı grup bağlamaları için `chat_id:*` tercih edin.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Sahip OpenClaw ajanı kimliği.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  İsteğe bağlı ACP geçersiz kılması.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  İsteğe bağlı, operatöre yönelik etiket.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  İsteğe bağlı çalışma zamanı çalışma dizini.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  İsteğe bağlı arka uç geçersiz kılması.
</ParamField>

### Ajan başına çalışma zamanı varsayılanları

ACP varsayılanlarını ajan başına bir kez tanımlamak için `agents.list[].runtime`
kullanın:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (donanım kimliği, ör. `codex` veya `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP'ye bağlı oturumlar için geçersiz kılma önceliği:**

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

- OpenClaw, kanala özgü kabul işleminden sonra ve kullanımdan önce yapılandırılmış ACP oturumunun mevcut olmasını sağlar.
- Bu kanal, konu veya sohbetteki mesajlar yapılandırılmış ACP oturumuna yönlendirilir.
- Yapılandırılmış ACP bağlamaları kendi oturum rotalarının sahibidir. Kanal yayını dağıtımı, eşleşen bir bağlama için yapılandırılmış ACP oturumunun yerini almaz.
- Bağlı konuşmalarda `/new` ve `/reset`, aynı ACP oturum anahtarını yerinde sıfırlar.
- Geçici çalışma zamanı bağlamaları (örneğin ileti dizisi odaklama akışları tarafından oluşturulanlar) mevcut oldukları yerde uygulanmaya devam eder.
- Açık bir `cwd` olmadan ajanlar arası ACP başlatmalarında OpenClaw, hedef ajan çalışma alanını ajan yapılandırmasından devralır.
- Eksik devralınmış çalışma alanı yollarında arka ucun varsayılan cwd'sine geri dönülür; mevcut yollardaki erişim hataları ise başlatma hataları olarak gösterilir.

## ACP oturumlarını başlatma

Bir ACP oturumunu başlatmanın iki yolu vardır:

<Tabs>
  <Tab title="sessions_spawn üzerinden">
    Bir ajan dönüşünden veya araç çağrısından ACP oturumu başlatmak için
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
    `runtime` varsayılan olarak `subagent` değerini kullandığından ACP
    oturumları için `runtime: "acp"` değerini açıkça ayarlayın. `agentId`
    belirtilmezse OpenClaw, yapılandırılmış olduğunda `acp.defaultAgent`
    değerini kullanır. Kalıcı bağlı bir konuşmayı korumak için
    `mode: "session"`, `thread: true` gerektirir.
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
  ACP hedef yürütme ortamı kimliği. Ayarlanmışsa `acp.defaultAgent` değerine geri döner.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Desteklendiği yerlerde ileti dizisi bağlama akışını ister.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` tek seferliktir; `"session"` kalıcıdır. `thread: true` olduğunda ve
  `mode` belirtilmediğinde OpenClaw, çalışma zamanı yoluna göre varsayılan
  olarak kalıcı davranışı kullanabilir. `mode: "session"`, `thread: true`
  gerektirir.
</ParamField>
<ParamField path="cwd" type="string">
  İstenen çalışma zamanı çalışma dizini (arka uç/çalışma zamanı politikası
  tarafından doğrulanır). Belirtilmezse ACP başlatma işlemi, yapılandırılmış
  olduğunda hedef ajan çalışma alanını devralır; eksik devralınmış yollarda
  arka uç varsayılanlarına geri dönülürken gerçek erişim hataları döndürülür.
</ParamField>
<ParamField path="label" type="string">
  Oturum/başlık metninde kullanılan, operatöre yönelik etiket.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Yeni bir ACP oturumu oluşturmak yerine mevcut bir oturumu sürdürür. Ajan,
  konuşma geçmişini `session/load` aracılığıyla yeniden oynatır.
  `runtime: "acp"` gerektirir.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"`, ilk ACP çalıştırmasının ilerleme özetlerini sistem olayları
  olarak istekte bulunan oturuma geri aktarır. Kabul edilen yanıtlar, tam
  aktarma geçmişi için takip edebileceğiniz oturum kapsamlı bir JSONL
  günlüğünü (`<sessionId>.acp-stream.jsonl`) gösteren `streamLogPath` değerini
  içerir. Üst ilerleme akışları, `streaming.progress.commentary=false`
  olmadığı sürece varsayılan olarak asistan açıklamalarını ve ACP durum
  ilerlemesini gösterir. Herhangi bir akış modu yapılandırılmadığında Discord
  da üst önizlemeleri için varsayılan olarak ilerleme modunu kullanır. Durum
  ilerlemesi yine de `acp.stream.tagVisibility` ayarına uyar; bu nedenle
  `plan` gibi etiketler açıkça etkinleştirilmedikçe gizli kalır.
</ParamField>

ACP `sessions_spawn` çalıştırmaları, varsayılan alt dönüş sınırı için
`agents.defaults.subagents.runTimeoutSeconds` değerini kullanır. Araç, çağrı
başına zaman aşımı geçersiz kılmalarını kabul etmez
(`runTimeoutSeconds`/`timeoutSeconds`, varsayılanı yapılandırma hatasıyla
reddedilir).

<ParamField path="model" type="string">
  ACP alt oturumu için açık model geçersiz kılması. Codex ACP başlatmaları,
  `openai/gpt-5.4` gibi OpenAI başvurularını `session/new` öncesinde Codex ACP
  başlangıç yapılandırmasına normalleştirir; `openai/gpt-5.4/high` gibi eğik
  çizgili biçimler Codex ACP akıl yürütme düzeyini de ayarlar. Belirtilmediğinde
  `sessions_spawn({ runtime: "acp" })`, yapılandırılmışsa mevcut alt ajan model
  varsayılanlarını (`agents.defaults.subagents.model` veya
  `agents.list[].subagents.model`) kullanır; aksi takdirde ACP yürütme ortamının
  kendi varsayılan modelini kullanmasına izin verir. Diğer yürütme ortamları
  ACP `models` özelliğini duyurmalı ve `session/set_model` desteği sunmalıdır;
  aksi takdirde OpenClaw/acpx, sessizce hedef ajanın varsayılanına geri dönmek
  yerine açıkça başarısız olur.
</ParamField>
<ParamField path="thinking" type="string">
  Açık düşünme/akıl yürütme düzeyi. Codex ACP için `minimal` düşük düzeye
  eşlenir; `low`/`medium`/`high`/`xhigh` doğrudan eşlenir ve `off`, başlangıçtaki
  akıl yürütme düzeyi geçersiz kılmasını atlar. Belirtilmediğinde ACP
  başlatmaları, seçili model için mevcut alt ajan düşünme varsayılanlarını ve
  modele özgü `agents.defaults.models["provider/model"].params.thinking`
  değerini kullanır.
</ParamField>

## Başlatma bağlama ve ileti dizisi modları

<Tabs>
  <Tab title="--bind here|off">
    | Mod    | Davranış                                                                  |
    | ------ | ------------------------------------------------------------------------- |
    | `here` | Geçerli etkin konuşmayı yerinde bağlar; etkin konuşma yoksa başarısız olur. |
    | `off`  | Geçerli konuşma bağlaması oluşturmaz.                                    |

    Notlar:

    - `--bind here`, "bu kanalı veya sohbeti Codex destekli yapmanın" en basit operatör yoludur.
    - `--bind here` bir alt ileti dizisi oluşturmaz.
    - `--bind here` yalnızca geçerli konuşma bağlama desteği sunan kanallarda kullanılabilir.
    - `--bind` ve `--thread` aynı `/acp spawn` çağrısında birlikte kullanılamaz.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mod    | Davranış                                                                                                         |
    | ------ | ---------------------------------------------------------------------------------------------------------------- |
    | `auto` | Etkin bir ileti dizisindeyken bu diziyi bağlar. Dışındayken destekleniyorsa bir alt ileti dizisi oluşturur/bağlar. |
    | `here` | Geçerli etkin ileti dizisini gerektirir; bir ileti dizisinde değilse başarısız olur.                              |
    | `off`  | Bağlama yoktur. Oturum bağlanmadan başlar.                                                                        |

    Notlar:

    - İleti dizisi olmayan bağlama yüzeylerinde varsayılan davranış fiilen `off` değeridir.
    - İleti dizisine bağlı başlatma, kanal politikası desteği gerektirir:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Bir alt ileti dizisi oluşturmadan geçerli konuşmayı sabitlemek istediğinizde `--bind here` kullanın.

  </Tab>
</Tabs>

## Teslim modeli

ACP oturumları etkileşimli çalışma alanları veya üst öğenin sahip olduğu arka
plan işleri olabilir. Teslim yolu bu yapıya bağlıdır.

<AccordionGroup>
  <Accordion title="Etkileşimli ACP oturumları">
    Etkileşimli oturumlar, görünür bir sohbet yüzeyinde konuşmayı sürdürmek
    amacıyla tasarlanmıştır:

    - `/acp spawn ... --bind here`, geçerli konuşmayı ACP oturumuna bağlar.
    - `/acp spawn ... --thread ...`, bir kanal ileti dizisini/konusunu ACP oturumuna bağlar.
    - Kalıcı yapılandırılmış `bindings[].type="acp"` bağlamaları, eşleşen konuşmaları aynı ACP oturumuna yönlendirir.

    Bağlı konuşmadaki sonraki mesajlar doğrudan ACP oturumuna yönlendirilir ve
    ACP çıktısı aynı kanala/ileti dizisine/konuya geri teslim edilir.

    OpenClaw'ın yürütme ortamına gönderdikleri:

    - Normal bağlı takip mesajları, istem metni olarak ve yalnızca yürütme ortamı/arka uç desteklediğinde eklerle birlikte gönderilir.
    - `/acp` yönetim komutları ve yerel Gateway komutları, ACP'ye gönderilmeden önce yakalanır.
    - Çalışma zamanı tarafından oluşturulan tamamlanma olayları hedef başına somutlaştırılır. OpenClaw ajanları, OpenClaw'ın dahili çalışma zamanı bağlamı zarfını alır; harici ACP yürütme ortamları ise alt sonuç ve talimatı içeren düz bir istem alır. Ham `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` zarfı hiçbir zaman harici yürütme ortamlarına gönderilmemeli veya ACP kullanıcı dökümü metni olarak kalıcılaştırılmamalıdır.
    - ACP döküm girdileri, kullanıcıya görünür tetikleme metnini veya düz tamamlanma istemini kullanır. Dahili olay meta verileri mümkün olduğunda OpenClaw içinde yapılandırılmış olarak kalır ve kullanıcı tarafından yazılmış sohbet içeriği olarak değerlendirilmez.

  </Accordion>
  <Accordion title="Üst öğenin sahip olduğu tek seferlik ACP oturumları">
    Başka bir ajan çalıştırması tarafından başlatılan tek seferlik ACP
    oturumları, alt ajanlara benzer arka plan alt süreçleridir:

    - Üst öğe, `sessions_spawn({ runtime: "acp", mode: "run" })` ile iş ister.
    - Alt süreç kendi ACP yürütme ortamı oturumunda çalışır.
    - Alt dönüşler, yerel alt ajan başlatmalarının kullandığı aynı arka plan hattında çalışır; böylece yavaş bir ACP yürütme ortamı, ilgisiz ana oturum işlerini engellemez.
    - Tamamlanma, görev tamamlanma duyuru yolu üzerinden geri bildirilir. OpenClaw, dahili tamamlanma meta verilerini harici bir yürütme ortamına göndermeden önce düz bir ACP istemine dönüştürür; böylece yürütme ortamları yalnızca OpenClaw'a özgü çalışma zamanı bağlamı işaretçilerini görmez.
    - Kullanıcıya yönelik bir yanıt yararlı olduğunda üst öğe, alt sürecin sonucunu normal asistan üslubuyla yeniden yazar.

    Bu yolu üst öğe ile alt süreç arasında eşler arası bir sohbet olarak
    **değerlendirmeyin**. Alt sürecin üst öğeye geri dönen bir tamamlanma
    kanalı zaten vardır.

  </Accordion>
  <Accordion title="sessions_send ve A2A teslimi">
    `sessions_send`, başlatmadan sonra başka bir oturumu hedefleyebilir. Normal
    eş oturumları için OpenClaw, mesajı ekledikten sonra ajanlar arası (A2A)
    takip yolunu kullanır:

    - Hedef oturumun yanıtını bekler.
    - İsteğe bağlı olarak istekte bulunan ile hedefin sınırlı sayıda takip dönüşü alışverişi yapmasına izin verir.
    - Hedeften bir duyuru mesajı oluşturmasını ister.
    - Bu duyuruyu görünür kanala veya ileti dizisine teslim eder.

    Bu A2A yolu, göndericinin görünür bir takip yanıtına ihtiyaç duyduğu eşler arası gönderimler için bir geri dönüş yoludur. İlgisiz bir oturumun bir ACP hedefini görebildiği ve ona mesaj gönderebildiği durumlarda, örneğin geniş `tools.sessions.visibility` ayarları altında etkin kalır.

    OpenClaw, A2A takip yanıtını yalnızca istekte bulunan taraf kendi üst öğesine ait tek seferlik ACP alt öğesinin üst öğesiyse atlar. Bu durumda, görev tamamlamanın üzerine A2A çalıştırmak üst öğeyi alt öğenin sonucuyla uyandırabilir, üst öğenin yanıtını alt öğeye geri iletebilir ve bir üst öğe/alt öğe yankı döngüsü oluşturabilir. Tamamlama yolu sonuçtan zaten sorumlu olduğundan, `sessions_send` sonucu bu sahip olunan alt öğe durumu için `delivery.status="skipped"` bildirir.

  </Accordion>
  <Accordion title="Mevcut bir oturumu sürdürme">
    Yeni bir başlangıç yapmak yerine önceki bir ACP oturumunu sürdürmek için `resumeSessionId` kullanın. Aracı, konuşma geçmişini `session/load` aracılığıyla yeniden oynatır; böylece daha önce gerçekleşenlerin tüm bağlamıyla devam eder.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Yaygın kullanım örnekleri:

    - Bir Codex oturumunu dizüstü bilgisayarınızdan telefonunuza devredin; aracınıza bıraktığınız yerden devam etmesini söyleyin.
    - CLI'da etkileşimli olarak başlattığınız bir kodlama oturumunu artık aracınız üzerinden etkileşimsiz biçimde sürdürün.
    - Gateway yeniden başlatması veya boşta kalma zaman aşımı nedeniyle kesintiye uğrayan çalışmaya devam edin.

    Notlar:

    - `resumeSessionId` yalnızca `runtime: "acp"` olduğunda geçerlidir; varsayılan alt aracı çalışma zamanı, yalnızca ACP'ye özgü bu alanı yok sayar.
    - `streamTo` yalnızca `runtime: "acp"` olduğunda geçerlidir; varsayılan alt aracı çalışma zamanı, yalnızca ACP'ye özgü bu alanı yok sayar.
    - `resumeSessionId`, OpenClaw kanal oturumu anahtarı değil, ana makineye yerel bir ACP/çalıştırma düzeneği sürdürme kimliğidir; OpenClaw, dağıtımdan önce ACP başlatma politikasını ve hedef aracı politikasını yine denetlerken, bu üst sistem kimliğinin yüklenmesine ilişkin yetkilendirme ACP arka ucu veya çalıştırma düzeneği tarafından yönetilir.
    - `resumeSessionId`, üst sistemdeki ACP konuşma geçmişini geri yükler; `thread` ve `mode`, oluşturduğunuz yeni OpenClaw oturumuna normal şekilde uygulanmaya devam eder. Bu nedenle `mode: "session"` yine `thread: true` gerektirir.
    - Hedef aracı `session/load` özelliğini desteklemelidir (Codex ve Claude Code destekler).
    - Oturum kimliği bulunamazsa başlatma işlemi açık bir hatayla başarısız olur; yeni bir oturuma sessizce geri dönülmez.

  </Accordion>
  <Accordion title="Dağıtım sonrası hızlı doğrulama testi">
    Bir Gateway dağıtımından sonra birim testlerine güvenmek yerine canlı, uçtan uca bir denetim çalıştırın:

    1. Hedef ana makinede dağıtılan Gateway sürümünü ve kaydı doğrulayın.
    2. Canlı bir aracıya geçici bir ACPX köprü oturumu açın.
    3. Bu aracıdan `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` ve `Reply with exactly LIVE-ACP-SPAWN-OK` göreviyle `sessions_spawn` çağrısı yapmasını isteyin.
    4. `accepted=yes`, gerçek bir `childSessionKey` ve doğrulayıcı hatası bulunmadığını doğrulayın.
    5. Geçici köprü oturumunu temizleyin.

    Geçidi `mode: "run"` üzerinde tutun ve `streamTo: "parent"` seçeneğini atlayın; iş parçacığına bağlı `mode: "session"` ve akış aktarma yolları, ayrı ve daha kapsamlı entegrasyon geçişleridir.

  </Accordion>
</AccordionGroup>

## Korumalı alan uyumluluğu

ACP oturumları şu anda OpenClaw korumalı alanının içinde **değil**, ana makine çalışma zamanında çalışır.

<Warning>
**Güvenlik sınırı:**

- Harici çalıştırma düzeneği, kendi CLI izinlerine ve seçilen `cwd` değerine göre okuma/yazma işlemi yapabilir.
- OpenClaw'ın korumalı alan politikası ACP çalıştırma düzeneğinin yürütülmesini **kapsamaz**.
- OpenClaw; ACP özellik geçitlerini, izin verilen aracıları, oturum sahipliğini, kanal bağlarını ve Gateway teslim politikasını uygulamaya devam eder.
- Korumalı alan tarafından uygulanan, OpenClaw'a özgü çalışmalar için `runtime: "subagent"` kullanın.

</Warning>

Mevcut sınırlamalar:

- İstekte bulunan oturum korumalı alandaysa hem `sessions_spawn({ runtime: "acp" })` hem de `/acp spawn` için ACP başlatmaları engellenir.
- `runtime: "acp"` ile kullanılan `sessions_spawn`, `sandbox: "require"` seçeneğini desteklemez.

## Oturum hedefi çözümleme

Çoğu `/acp` işlemi isteğe bağlı bir oturum hedefi (`session-key`, `session-id` veya `session-label`) kabul eder.

**Çözümleme sırası:**

1. Açık hedef bağımsız değişkeni (veya `/acp steer` için `--session`)
   - önce anahtarı dener
   - ardından UUID biçimli oturum kimliğini
   - ardından etiketi
2. Geçerli iş parçacığı bağı (bu konuşma/iş parçacığı bir ACP oturumuna bağlıysa).
3. Geçerli istekte bulunan oturuma geri dönüş.

Hem geçerli konuşma bağları hem de iş parçacığı bağları 2. adıma katılır.

Hiçbir hedef çözümlenemezse OpenClaw açık bir hata döndürür (`Unable to resolve session target: ...`).

## ACP denetimleri

| Komut                | İşlevi                                                        | Örnek                                                         |
| -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP oturumu oluşturur; isteğe bağlı geçerli bağ veya iş parçacığı bağı. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Hedef oturumda devam eden turu iptal eder.                    | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Çalışan oturuma yönlendirme talimatı gönderir.                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Oturumu kapatır ve iş parçacığı hedeflerinin bağını kaldırır. | `/acp close`                                                  |
| `/acp status`        | Arka ucu, modu, durumu, çalışma zamanı seçeneklerini ve yetenekleri gösterir. | `/acp status`                                                 |
| `/acp set-mode`      | Hedef oturumun çalışma zamanı modunu ayarlar.                 | `/acp set-mode plan`                                          |
| `/acp set`           | Genel çalışma zamanı yapılandırma seçeneğini yazar.           | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Çalışma zamanı çalışma dizini geçersiz kılmasını ayarlar.     | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Onay politikası profilini ayarlar.                            | `/acp permissions strict`                                     |
| `/acp timeout`       | Çalışma zamanı zaman aşımını (saniye) ayarlar.                | `/acp timeout 120`                                            |
| `/acp model`         | Çalışma zamanı model geçersiz kılmasını ayarlar.              | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Oturum çalışma zamanı seçeneği geçersiz kılmalarını kaldırır. | `/acp reset-options`                                          |
| `/acp sessions`      | Depodan son ACP oturumlarını listeler.                        | `/acp sessions`                                               |
| `/acp doctor`        | Arka uç sağlığını, yetenekleri ve uygulanabilir düzeltmeleri gösterir. | `/acp doctor`                                                 |
| `/acp install`       | Belirlenimci kurulum ve etkinleştirme adımlarını yazdırır.    | `/acp install`                                                |

Çalışma zamanı denetimleri (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`, `set`, `cwd`, `permissions`, `timeout`, `model` ve `reset-options`) harici kanallarda sahip kimliği, dahili Gateway istemcilerinde ise `operator.admin` gerektirir. Yetkilendirilmiş ancak sahip olmayan göndericiler `sessions`, `doctor`, `install` ve `help` komutlarını yine kullanabilir.

`/acp status`, geçerli çalışma zamanı seçeneklerinin yanı sıra çalışma zamanı ve arka uç düzeyindeki oturum tanımlayıcılarını gösterir. Bir arka uçta bir yetenek bulunmadığında desteklenmeyen denetim hataları açıkça gösterilir. `/acp sessions`, geçerli bağlı oturumun veya istekte bulunan oturumun deposunu okur; hedef belirteçleri (`session-key`, `session-id` veya `session-label`), aracı başına özel `session.store` kökleri dâhil olmak üzere Gateway oturum keşfi aracılığıyla çözümlenir.

### Çalışma zamanı seçenekleri eşlemesi

`/acp`, kolaylık komutlarına ve genel bir ayarlayıcıya sahiptir. Eşdeğer işlemler:

| Komut                        | Eşlendiği öğe                        | Notlar                                                                                                                                                                                                     |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | çalışma zamanı yapılandırma anahtarı `model` | Codex ACP için OpenClaw, `openai/<model>` değerini bağdaştırıcı model kimliğine normalleştirir ve `openai/gpt-5.4/high` gibi eğik çizgili akıl yürütme soneklerini `reasoning_effort` ile eşler.             |
| `/acp set thinking <level>`  | kurallı seçenek `thinking`           | OpenClaw, varsa arka ucun duyurduğu eşdeğeri gönderir; sırasıyla `thinking`, `effort`, `reasoning_effort` veya `thought_level` tercih edilir. Codex ACP için bağdaştırıcı, değerleri `reasoning_effort` ile eşler. |
| `/acp permissions <profile>` | kurallı seçenek `permissionProfile`  | OpenClaw, varsa `approval_policy`, `permission_profile`, `permissions` veya `permission_mode` gibi arka ucun duyurduğu eşdeğeri gönderir.                                                                  |
| `/acp timeout <seconds>`     | kurallı seçenek `timeoutSeconds`     | OpenClaw, varsa `timeout` veya `timeout_seconds` gibi arka ucun duyurduğu eşdeğeri gönderir.                                                                                                                |
| `/acp cwd <path>`            | çalışma zamanı cwd geçersiz kılması  | Doğrudan güncelleme.                                                                                                                                                                                        |
| `/acp set <key> <value>`     | genel                                | `key=cwd`, cwd geçersiz kılma yolunu kullanır.                                                                                                                                                              |
| `/acp reset-options`         | tüm çalışma zamanı geçersiz kılmalarını temizler | -                                                                                                                                                                                                          |

## acpx çalıştırma düzeneği, Plugin kurulumu ve izinler

acpx çalıştırma düzeneği yapılandırması (Claude Code / Codex / Gemini CLI diğer adları), plugin-tools ve OpenClaw-tools MCP köprüleri ve ACP izin modları için [ACP aracıları - kurulum](/tr/tools/acp-agents-setup) bölümüne bakın.

## Sorun giderme

| Belirti                                                                                   | Olası neden                                                                                                           | Çözüm                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                                   | Arka uç Plugin’i eksik, devre dışı veya `plugins.allow` tarafından engelleniyor.                                      | Arka uç Plugin’ini kurup etkinleştirin, izin listesi ayarlanmışsa `plugins.allow` içine `acpx` ekleyin, ardından `/acp doctor` komutunu çalıştırın.                           |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP genel olarak devre dışı.                                                                                          | `acp.enabled=true` olarak ayarlayın.                                                                                                                                        |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | Normal ileti dizisi iletilerinden otomatik yönlendirme devre dışı.                                                    | Otomatik ileti dizisi yönlendirmesini sürdürmek için `acp.dispatch.enabled=true` olarak ayarlayın; açık `sessions_spawn({ runtime: "acp" })` çağrıları çalışmaya devam eder. |
| `ACP agent "<id>" is not allowed by policy`                                               | Aracı izin listesinde değil.                                                                                          | İzin verilen bir `agentId` kullanın veya `acp.allowedAgents` değerini güncelleyin.                                                                                           |
| `/acp doctor` reports backend not ready right after startup                               | Arka uç Plugin’i eksik, devre dışı, izin/ret politikası tarafından engellenmiş veya yapılandırılmış yürütülebilir dosyası kullanılamıyor. | Arka uç Plugin’ini kurup etkinleştirin, `/acp doctor` komutunu yeniden çalıştırın ve sağlıksız kalırsa arka uç kurulum ya da politika hatasını inceleyin.                    |
| Harness komutu bulunamadı                                                                 | Bağdaştırıcı CLI’ı kurulu değil, harici Plugin eksik veya Codex dışı bir bağdaştırıcının ilk çalıştırmadaki `npx` indirmesi başarısız oldu. | `/acp doctor` komutunu çalıştırın, bağdaştırıcıyı Gateway ana makinesine kurup önceden hazırlayın veya acpx aracı komutunu açıkça yapılandırın.                              |
| Harness’tan model bulunamadı hatası                                                       | Model kimliği başka bir sağlayıcı/harness için geçerli, ancak bu ACP hedefi için değil.                               | Bu harness tarafından listelenen bir modeli kullanın, modeli harness içinde yapılandırın veya geçersiz kılmayı kaldırın.                                                   |
| Harness’tan üretici kimlik doğrulama hatası                                               | OpenClaw sağlıklı, ancak hedef CLI/sağlayıcıda oturum açılmamış.                                                       | Gateway ana makinesi ortamında oturum açın veya gerekli sağlayıcı anahtarını sağlayın.                                                                                      |
| `Unable to resolve session target: ...`                                                   | Anahtar/kimlik/etiket belirteci hatalı.                                                                                | `/acp sessions` komutunu çalıştırın, tam anahtarı/etiketi kopyalayın ve yeniden deneyin.                                                                                    |
| `--bind here requires running /acp spawn inside an active ... conversation`               | `--bind here`, etkin ve bağlanabilir bir konuşma olmadan kullanıldı.                                                  | Hedef sohbete/kanala geçip yeniden deneyin veya bağlama olmadan oluşturun.                                                                                                  |
| `Conversation bindings are unavailable for <channel>.`                                    | Bağdaştırıcı, geçerli konuşmayı ACP’ye bağlama yeteneğine sahip değil.                                                 | Destekleniyorsa `/acp spawn ... --thread ...` kullanın, üst düzey `bindings[]` öğelerini yapılandırın veya desteklenen bir kanala geçin.                                    |
| `--thread here requires running /acp spawn inside an active ... thread`                   | `--thread here`, ileti dizisi bağlamı dışında kullanıldı.                                                              | Hedef ileti dizisine geçin veya `--thread auto`/`off` kullanın.                                                                                                             |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | Etkin bağlama hedefinin sahibi başka bir kullanıcı.                                                                    | Sahibi olarak yeniden bağlayın veya farklı bir konuşma ya da ileti dizisi kullanın.                                                                                          |
| `Thread bindings are unavailable for <channel>.`                                          | Bağdaştırıcı, ileti dizisi bağlama yeteneğine sahip değil.                                                             | `--thread off` kullanın veya desteklenen bir bağdaştırıcıya/kanala geçin.                                                                                                   |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | ACP çalışma zamanı ana makine tarafındadır; istekte bulunan oturum korumalı alandadır.                                 | Korumalı alan oturumlarında `runtime="subagent"` kullanın veya ACP oluşturma işlemini korumalı alanda olmayan bir oturumdan çalıştırın.                                     |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | ACP çalışma zamanı için `sandbox="require"` istendi.                                                                   | Zorunlu korumalı alan için `runtime="subagent"` kullanın veya korumalı alanda olmayan bir oturumdan `sandbox="inherit"` ile ACP kullanın.                                   |
| `Cannot apply --model ... did not advertise model support`                                | Hedef harness, genel ACP model değiştirme özelliğini sunmuyor.                                                         | ACP `models`/`session/set_model` desteğini bildiren bir harness kullanın, Codex ACP model başvurularını kullanın veya kendi başlatma bayrağı varsa modeli doğrudan harness içinde yapılandırın. |
| Bağlı oturum için ACP meta verileri eksik                                                 | ACP oturumu meta verileri eski veya silinmiş.                                                                          | `/acp spawn` ile yeniden oluşturun, ardından ileti dizisini yeniden bağlayın/odaklayın.                                                                                      |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode`, etkileşimsiz ACP oturumunda yazma/yürütme işlemlerini engelliyor.                                    | `plugins.entries.acpx.config.permissionMode` değerini `approve-all` olarak ayarlayıp Gateway’i yeniden başlatın. Bkz. [İzin yapılandırması](/tr/tools/acp-agents-setup#permission-configuration). |
| ACP oturumu çok az çıktı vererek erkenden başarısız oluyor                                | İzin istemleri `permissionMode`/`nonInteractivePermissions` tarafından engelleniyor.                                  | Gateway günlüklerinde `AcpRuntimeError` olup olmadığını kontrol edin. Tam izinler için `permissionMode=approve-all`; sorunsuz kısıtlama için `nonInteractivePermissions=deny` olarak ayarlayın. |
| ACP oturumu işi tamamladıktan sonra süresiz olarak takılıyor                              | Harness işlemi tamamlandı ancak ACP oturumu tamamlandığını bildirmedi.                                                 | OpenClaw’u güncelleyin; mevcut acpx temizleme işlemi, kapatma ve Gateway başlatma sırasında OpenClaw’a ait eski sarmalayıcı ve bağdaştırıcı işlemlerini sonlandırır.          |
| Harness, `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` ifadesini görüyor                        | Dahili olay zarfı ACP sınırının dışına sızdı.                                                                          | OpenClaw’u güncelleyin ve tamamlama akışını yeniden çalıştırın; harici harness’lar yalnızca düz tamamlama istemleri almalıdır.                                                |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable`, ACP/acpx’e
değil, yerel Codex kanca aktarımına aittir. Bağlı bir Codex sohbetinde `/new`
veya `/reset` ile yeni bir oturum başlatın; bir kez çalışıp sonraki yerel araç
çağrısında yeniden ortaya çıkarsa `/new` komutunu tekrarlamak yerine Codex
uygulama sunucusunu veya OpenClaw Gateway’i yeniden başlatın. Bkz.
[Codex harness sorun giderme](/tr/plugins/codex-harness#troubleshooting).
</Note>

## İlgili içerikler

- [ACP aracıları - kurulum](/tr/tools/acp-agents-setup)
- [Aracıya gönderme](/tr/tools/agent-send)
- [CLI arka uçları](/tr/gateway/cli-backends)
- [Codex harness](/tr/plugins/codex-harness)
- [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Çok aracılı korumalı alan araçları](/tr/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (köprü modu)](/tr/cli/acp)
- [Alt aracılar](/tr/tools/subagents)
