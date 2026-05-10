---
read_when:
    - Skills ekleme veya değiştirme
    - Skills geçitlemesini, izin listelerini veya yükleme kurallarını değiştirme
    - Skills önceliğini ve anlık görüntü davranışını anlama
sidebarTitle: Skills
summary: 'Skills: yönetilen ve çalışma alanı, geçiş kuralları, aracı izin listeleri ve yapılandırma bağlantıları'
title: Skills
x-i18n:
    generated_at: "2026-05-10T19:58:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: a265932a9990e71c0dd6b4444f26efb04019ed979477b0712a3a45569b1b4dff
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw, ajana araçları nasıl kullanacağını öğretmek için **[AgentSkills](https://agentskills.io) uyumlu** beceri
klasörleri kullanır. Her beceri, YAML frontmatter ve talimatlar içeren bir
`SKILL.md` dosyasına sahip bir dizindir. OpenClaw, paketle gelen becerileri ve isteğe bağlı
yerel geçersiz kılmaları yükler ve bunları yükleme zamanında ortama, yapılandırmaya ve
ikili dosya varlığına göre filtreler.

## Konumlar ve öncelik

OpenClaw becerileri şu kaynaklardan yükler, **en yüksek öncelik önce**:

| #   | Kaynak                | Yol                              |
| --- | --------------------- | -------------------------------- |
| 1   | Çalışma alanı becerileri | `<workspace>/skills`             |
| 2   | Proje ajan becerileri | `<workspace>/.agents/skills`     |
| 3   | Kişisel ajan becerileri | `~/.agents/skills`               |
| 4   | Yönetilen/yerel beceriler | `~/.openclaw/skills`             |
| 5   | Paketle gelen beceriler | kurulumla birlikte gelir         |
| 6   | Ek beceri klasörleri  | `skills.load.extraDirs` (yapılandırma) |

Bir beceri adı çakışırsa, en yüksek kaynak kazanır.

Codex CLI'nin yerel `$CODEX_HOME/skills` dizini bu OpenClaw beceri köklerinden
biri değildir. Codex harness modunda, yerel uygulama sunucusu başlatmaları yalıtılmış
ajan başına Codex ana dizinleri kullanır, bu nedenle kişisel Codex CLI becerileri örtük olarak yüklenmez.
Bunların envanterini çıkarmak için `openclaw migrate codex --dry-run` komutunu ve
geçerli OpenClaw ajan çalışma alanına kopyalamadan önce etkileşimli
onay kutusu istemiyle beceri dizinlerini seçmek için `openclaw migrate codex` komutunu kullanın.
Etkileşimsiz çalıştırmalar için, kopyalanacak tam beceriler için `--skill <name>` seçeneğini tekrarlayın.

## Ajan başına ve paylaşılan beceriler

**Çok ajanlı** kurulumlarda her ajanın kendi çalışma alanı vardır:

| Kapsam               | Yol                                         | Görünür olduğu yer           |
| -------------------- | ------------------------------------------- | --------------------------- |
| Ajan başına          | `<workspace>/skills`                        | Yalnızca o ajan             |
| Proje ajanı          | `<workspace>/.agents/skills`                | Yalnızca o çalışma alanının ajanı |
| Kişisel ajan         | `~/.agents/skills`                          | O makinedeki tüm ajanlar    |
| Paylaşılan yönetilen/yerel | `~/.openclaw/skills`                  | O makinedeki tüm ajanlar    |
| Paylaşılan ek dizinler | `skills.load.extraDirs` (en düşük öncelik) | O makinedeki tüm ajanlar    |

Birden fazla yerde aynı ad → en yüksek kaynak kazanır. Çalışma alanı,
proje ajanını, kişisel ajanı, yönetilen/yereli, paketle gelenleri ve
ek dizinleri geçer.

## Ajan beceri izin listeleri

Beceri **konumu** ve beceri **görünürlüğü** ayrı denetimlerdir.
Konum/öncelik, aynı adlı bir becerinin hangi kopyasının kazanacağını belirler; ajan
izin listeleri ise bir ajanın gerçekte hangi becerileri kullanabileceğini belirler.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Allowlist rules">
    - Varsayılan olarak sınırsız beceriler için `agents.defaults.skills` öğesini atlayın.
    - `agents.defaults.skills` değerini devralmak için `agents.list[].skills` öğesini atlayın.
    - Beceri olmaması için `agents.list[].skills: []` ayarlayın.
    - Boş olmayan bir `agents.list[].skills` listesi, o ajan için **nihai** kümedir - varsayılanlarla birleştirilmez.
    - Etkili izin listesi istem oluşturma, beceri eğik çizgi komutu keşfi, sandbox eşitlemesi ve beceri anlık görüntüleri genelinde uygulanır.

  </Accordion>
</AccordionGroup>

## Plugin'ler ve beceriler

Plugin'ler, `openclaw.plugin.json` içinde `skills` dizinlerini listeleyerek
kendi becerilerini gönderebilir (yollar Plugin köküne görelidir). Plugin becerileri,
Plugin etkin olduğunda yüklenir. Bu, araç açıklaması için çok uzun olan ancak
Plugin kurulu olduğunda kullanılabilir olması gereken araca özel kullanım kılavuzları için
doğru yerdir - örneğin tarayıcı Plugin'i, çok adımlı tarayıcı denetimi için
bir `browser-automation` becerisi gönderir.

Plugin beceri dizinleri, `skills.load.extraDirs` ile aynı düşük öncelikli yolda
birleştirilir, bu nedenle aynı adlı paketle gelen, yönetilen, ajan veya
çalışma alanı becerisi bunları geçersiz kılar. Bunları Plugin'in yapılandırma girdisindeki
`metadata.openclaw.requires.config` üzerinden koşullandırabilirsiniz.

Keşif/yapılandırma için [Plugin'ler](/tr/tools/plugin) ve bu becerilerin öğrettiği
araç yüzeyi için [Araçlar](/tr/tools) bölümüne bakın.

## Beceri Atölyesi

İsteğe bağlı, deneysel **Beceri Atölyesi** Plugin'i, ajan çalışması sırasında
gözlemlenen yeniden kullanılabilir prosedürlerden çalışma alanı becerileri oluşturabilir veya güncelleyebilir.
Varsayılan olarak devre dışıdır ve `plugins.entries.skill-workshop` üzerinden
açıkça etkinleştirilmelidir.

Beceri Atölyesi yalnızca `<workspace>/skills` içine yazar, oluşturulan
içeriği tarar, bekleyen onayı veya otomatik güvenli yazmaları destekler, güvenli olmayan
önerileri karantinaya alır ve başarılı yazmalardan sonra beceri anlık görüntüsünü yeniler;
böylece yeni beceriler Gateway yeniden başlatması olmadan kullanılabilir hale gelir.

Bunu _"bir dahaki sefere, GIF atfını doğrula"_ gibi düzeltmeler veya
medya QA kontrol listeleri gibi emekle edinilmiş iş akışları için kullanın. Bekleyen
onayla başlayın; otomatik yazmaları yalnızca önerilerini inceledikten sonra güvenilen
çalışma alanlarında kullanın. Tam kılavuz: [Beceri Atölyesi Plugin'i](/tr/plugins/skill-workshop).

## ClawHub (kurulum ve eşitleme)

[ClawHub](https://clawhub.ai), OpenClaw için herkese açık beceri kayıt defteridir.
Keşfetme/kurma/güncelleme için yerel `openclaw skills` komutlarını veya
yayınlama/eşitleme iş akışları için ayrı `clawhub` CLI'sini kullanın. Tam kılavuz:
[ClawHub](/tr/clawhub).

| Eylem                              | Komut                                  |
| ---------------------------------- | -------------------------------------- |
| Çalışma alanına bir beceri kur     | `openclaw skills install <skill-slug>` |
| Kurulu tüm becerileri güncelle     | `openclaw skills update --all`         |
| Eşitle (tara + güncellemeleri yayınla) | `clawhub sync --all`                   |

Yerel `openclaw skills install`, etkin çalışma alanındaki `skills/` dizinine kurar.
Ayrı `clawhub` CLI de geçerli çalışma dizininizin altındaki `./skills` içine kurar
(veya yapılandırılmış OpenClaw çalışma alanına geri döner). OpenClaw, sonraki oturumda
bunu `<workspace>/skills` olarak alır.
Yapılandırılmış beceri kökleri ayrıca `skills/<group>/<skill>/SKILL.md` gibi
tek bir gruplama düzeyini destekler; böylece ilgili üçüncü taraf beceriler,
geniş özyinelemeli tarama olmadan paylaşılan bir klasör altında tutulabilir.

Özel, ClawHub dışı teslimata ihtiyaç duyan Gateway istemcileri, `skills.upload.begin`,
`skills.upload.chunk` ve `skills.upload.commit` ile bir zip beceri arşivini hazırlayabilir,
ardından tamamlanan yüklemeyi `skills.install({ source: "upload", uploadId, slug, force?, sha256? })`
ile kurabilir. Bu, güvenilir istemciler için açık bir yönetici yükleme yoludur; normal
`openclaw skills install <slug>` veya ClawHub kurulum akışı değildir. Varsayılan olarak kapalıdır
ve yalnızca `openclaw.json` içinde `skills.install.allowUploadedArchives: true` ayarlandığında çalışır.
Yükleme modu yine de varsayılan ajan çalışma alanındaki `skills/<slug>` dizinine kurar;
arşivin iç klasör adı nihai kurulum hedefi için yok sayılır.

ClawHub beceri sayfaları, kurulumdan önce en son güvenlik taraması durumunu,
VirusTotal, ClawScan ve statik analiz için tarayıcı ayrıntı sayfalarıyla birlikte gösterir.
`openclaw skills install <slug>` yalnızca kurulum yolu olarak kalır; yayıncılar
yanlış pozitifleri ClawHub panosu veya `clawhub skill rescan <slug>` üzerinden giderir.

## Güvenlik

<Warning>
Üçüncü taraf becerileri **güvenilmeyen kod** olarak değerlendirin. Etkinleştirmeden önce okuyun.
Güvenilmeyen girdiler ve riskli araçlar için sandbox içinde çalıştırmaları tercih edin. Ajan tarafı
denetimleri için [Sandboxing](/tr/gateway/sandboxing) bölümüne bakın.
</Warning>

- Çalışma alanı ve ek dizin beceri keşfi, yalnızca çözümlenen gerçek yolu yapılandırılmış kökün içinde kalan beceri köklerini ve `SKILL.md` dosyalarını kabul eder.
- Gateway özel arşiv kurulumları varsayılan olarak kapalıdır. Açıkça etkinleştirildiğinde,
  `SKILL.md` içeren tamamlanmış bir zip yüklemesi gerektirir ve ClawHub beceri kurulumlarıyla aynı
  arşiv çıkarma, yol geçişi, sembolik bağlantı, zorlama ve geri alma korumalarını yeniden kullanır.
  Bunlar `skills.install.allowUploadedArchives` ile koşullandırılır; normal ClawHub kurulumları
  bu ayarı gerektirmez.
- Gateway destekli beceri bağımlılığı kurulumları (`skills.install`, onboarding ve Skills ayarları kullanıcı arayüzü), kurulum aracı metadata'sını yürütmeden önce yerleşik tehlikeli kod tarayıcısını çalıştırır. `critical` bulguları, çağıran açıkça tehlikeli geçersiz kılmayı ayarlamadıkça varsayılan olarak engeller; şüpheli bulgular yine yalnızca uyarır.
- `openclaw skills install <slug>` farklıdır - bir ClawHub beceri klasörünü çalışma alanına indirir ve yukarıdaki kurulum aracı metadata yolunu kullanmaz.
- `skills.entries.*.env` ve `skills.entries.*.apiKey`, o ajan dönüşü için gizli bilgileri **ana makine** sürecine enjekte eder (sandbox'a değil). Gizli bilgileri istemlerden ve günlüklerden uzak tutun.

Daha geniş bir tehdit modeli ve kontrol listeleri için [Güvenlik](/tr/gateway/security) bölümüne bakın.

## SKILL.md biçimi

`SKILL.md` en az şunları içermelidir:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw, düzen/amaç için AgentSkills belirtimini izler. Gömülü ajan tarafından kullanılan
ayrıştırıcı yalnızca **tek satırlı** frontmatter anahtarlarını destekler;
`metadata` bir **tek satırlı JSON nesnesi** olmalıdır. Talimatlarda beceri klasörü yoluna
başvurmak için `{baseDir}` kullanın.

### İsteğe bağlı frontmatter anahtarları

<ParamField path="homepage" type="string">
  macOS Skills kullanıcı arayüzünde "Web Sitesi" olarak gösterilen URL. `metadata.openclaw.homepage` üzerinden de desteklenir.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  `true` olduğunda beceri, kullanıcı eğik çizgi komutu olarak gösterilir.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` olduğunda OpenClaw, becerinin talimatlarını ajanın normal isteminin dışında tutar.
  Beceri yine kurulu kalır ve `user-invocable` da `true` olduğunda açıkça
  eğik çizgi komutu olarak çalıştırılabilir.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  `tool` olarak ayarlandığında eğik çizgi komutu modeli atlar ve doğrudan bir araca gönderilir.
</ParamField>
<ParamField path="command-tool" type="string">
  `command-dispatch: tool` ayarlandığında çağrılacak araç adı.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Araç gönderimi için ham argümanlar dizesini araca iletir (çekirdek ayrıştırma yok). Araç `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` ile çağrılır.
</ParamField>

## Koşullandırma (yükleme zamanı filtreleri)

OpenClaw, `metadata` (tek satırlı JSON) kullanarak becerileri yükleme zamanında filtreler:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

`metadata.openclaw` altındaki alanlar:

<ParamField path="always" type="boolean">
  `true` olduğunda, beceriyi her zaman dahil et (diğer kapıları atla).
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills kullanıcı arayüzü tarafından kullanılan isteğe bağlı emoji.
</ParamField>
<ParamField path="homepage" type="string">
  macOS Skills kullanıcı arayüzünde "Web sitesi" olarak gösterilen isteğe bağlı URL.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  İsteğe bağlı platform listesi. Ayarlanırsa, beceri yalnızca bu işletim sistemlerinde uygun olur.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Her biri `PATH` üzerinde mevcut olmalıdır.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  En az biri `PATH` üzerinde mevcut olmalıdır.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Ortam değişkeni mevcut olmalı veya yapılandırmada sağlanmalıdır.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Truthy olması gereken `openclaw.json` yollarının listesi.
</ParamField>
<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` ile ilişkilendirilmiş ortam değişkeni adı.
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills kullanıcı arayüzü tarafından kullanılan isteğe bağlı yükleyici belirtimleri (brew/node/go/uv/download).
</ParamField>

Hiç `metadata.openclaw` yoksa, beceri her zaman uygundur (yapılandırmada
devre dışı bırakılmadığı veya paketli beceriler için `skills.allowBundled` tarafından engellenmediği sürece).

<Note>
Eski `metadata.clawdbot` blokları, `metadata.openclaw` yokken hâlâ kabul edilir;
böylece daha eski yüklü beceriler bağımlılık kapılarını ve yükleyici ipuçlarını korur.
Yeni ve güncellenmiş beceriler `metadata.openclaw` kullanmalıdır.
</Note>

### Korumalı alan notları

- `requires.bins`, beceri yükleme zamanında **ana makinede** denetlenir.
- Bir agent korumalı alandaysa, ikili dosya **konteynerin içinde** de mevcut olmalıdır. Bunu `agents.defaults.sandbox.docker.setupCommand` (veya özel bir imaj) üzerinden yükleyin. `setupCommand`, konteyner oluşturulduktan sonra bir kez çalışır. Paket yüklemeleri ayrıca ağ çıkışı, yazılabilir bir kök dosya sistemi ve korumalı alanda root kullanıcı gerektirir.
- Örnek: `summarize` becerisinin (`skills/summarize/SKILL.md`) orada çalışabilmesi için korumalı alan konteynerinde `summarize` CLI gerekir.

### Yükleyici belirtimleri

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="Yükleyici seçim kuralları">
    - Birden fazla yükleyici listelenirse, gateway tek bir tercih edilen seçenek seçer (mevcutsa brew, aksi halde node).
    - Tüm yükleyiciler `download` ise, OpenClaw mevcut artefaktları görebilmeniz için her girdiyi listeler.
    - Yükleyici belirtimleri, seçenekleri platforma göre filtrelemek için `os: ["darwin"|"linux"|"win32"]` içerebilir.
    - Node yüklemeleri, `openclaw.json` içindeki `skills.install.nodeManager` ayarına uyar (varsayılan: npm; seçenekler: npm/pnpm/yarn/bun). Bu yalnızca beceri yüklemelerini etkiler; Gateway çalışma zamanı yine Node olmalıdır - Bun, WhatsApp/Telegram için önerilmez.
    - Gateway destekli yükleyici seçimi tercihe dayalıdır: yükleme belirtimleri farklı türleri karıştırdığında, `skills.install.preferBrew` etkinse ve `brew` mevcutsa OpenClaw Homebrew'ı tercih eder, ardından `uv`, ardından yapılandırılmış node yöneticisi, ardından `go` veya `download` gibi diğer yedekler gelir.
    - Her yükleme belirtimi `download` ise, OpenClaw tek bir tercih edilen yükleyiciye indirgemek yerine tüm indirme seçeneklerini gösterir.

  </Accordion>
  <Accordion title="Yükleyici başına ayrıntılar">
    - **Go yüklemeleri:** `go` eksikse ve `brew` mevcutsa, gateway önce Homebrew üzerinden Go yükler ve mümkün olduğunda `GOBIN` değerini Homebrew'ın `bin` dizinine ayarlar.
    - **İndirme yüklemeleri:** `url` (zorunlu), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (varsayılan: arşiv algılandığında otomatik), `stripComponents`, `targetDir` (varsayılan: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Yapılandırma geçersiz kılmaları

Paketli ve yönetilen beceriler açılıp kapatılabilir ve ortam değerleri
`~/.openclaw/openclaw.json` içindeki `skills.entries` altında sağlanabilir:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  `false`, paketli veya yüklü olsa bile beceriyi devre dışı bırakır.
  Paketli `coding-agent` becerisi isteğe bağlıdır: agent'lara göstermeden önce
  `skills.entries.coding-agent.enabled: true` ayarını yapın,
  ardından `claude`, `codex`, `opencode` veya `pi` öğelerinden birinin yüklü ve
  kendi CLI için kimliği doğrulanmış olduğundan emin olun.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` bildiren beceriler için kolaylık sağlar. Düz metni veya SecretRef'i destekler.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Yalnızca değişken süreçte zaten ayarlı değilse enjekte edilir.
</ParamField>
<ParamField path="config" type="object">
  Özel beceri başına alanlar için isteğe bağlı torba. Özel anahtarlar burada bulunmalıdır.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Yalnızca **paketli** beceriler için isteğe bağlı izin listesi. Ayarlanırsa, yalnızca listedeki paketli beceriler uygun olur (yönetilen/çalışma alanı becerileri etkilenmez).
</ParamField>

Beceri adı kısa çizgiler içeriyorsa, anahtarı tırnak içine alın (JSON5 tırnaklı
anahtarlara izin verir). Yapılandırma anahtarları varsayılan olarak **beceri adı** ile eşleşir - bir beceri
`metadata.openclaw.skillKey` tanımlıyorsa, `skills.entries` altında bu anahtarı kullanın.

<Note>
OpenClaw içinde stok görüntü oluşturma/düzenleme için paketli beceri yerine
`agents.defaults.imageGenerationModel` ile çekirdek `image_generate` aracını kullanın.
Buradaki beceri örnekleri özel veya üçüncü taraf iş akışları içindir.
Yerel görüntü analizi için `agents.defaults.imageModel` ile `image` aracını kullanın.
`openai/*`, `google/*`, `fal/*` veya başka bir sağlayıcıya özgü görüntü modeli seçerseniz,
o sağlayıcının kimlik doğrulama/API anahtarını da ekleyin.
</Note>

## Ortam enjeksiyonu

Bir agent çalışması başladığında, OpenClaw:

1. Beceri meta verilerini okur.
2. `skills.entries.<key>.env` ve `skills.entries.<key>.apiKey` değerlerini `process.env` üzerine uygular.
3. Sistem istemini **uygun** becerilerle oluşturur.
4. Çalışma sona erdikten sonra özgün ortamı geri yükler.

Ortam enjeksiyonu küresel bir shell ortamı değil, **agent çalışmasıyla sınırlıdır**.

Paketli `claude-cli` arka ucu için OpenClaw ayrıca aynı uygun anlık görüntüyü
geçici bir Claude Code Plugin olarak materyalize eder ve bunu `--plugin-dir` ile geçirir.
Claude Code daha sonra yerel beceri çözümleyicisini kullanabilir; OpenClaw ise
önceliği, agent başına izin listelerini, kapıları ve
`skills.entries.*` ortam/API anahtarı enjeksiyonunu yönetmeye devam eder. Diğer CLI arka uçları yalnızca
istem kataloğunu kullanır.

## Anlık görüntüler ve yenileme

OpenClaw, uygun becerilerin anlık görüntüsünü **bir oturum başladığında** alır ve
aynı oturumdaki sonraki dönüşlerde bu listeyi yeniden kullanır. Becerilerdeki veya
yapılandırmadaki değişiklikler bir sonraki yeni oturumda etkili olur.

Beceriler iki durumda oturum ortasında yenilenebilir:

- Skills izleyicisi etkindir.
- Yeni bir uygun uzak düğüm görünür.

Bunu bir **hot reload** olarak düşünün: yenilenen liste, bir sonraki
agent dönüşünde alınır. O oturum için etkili agent beceri izin listesi değişirse,
OpenClaw anlık görüntüyü yeniler; böylece görünen beceriler mevcut agent ile uyumlu kalır.

### Skills izleyicisi

Varsayılan olarak OpenClaw, beceri klasörlerini izler ve `SKILL.md` dosyaları
değiştiğinde beceriler anlık görüntüsünü artırır. `skills.load` altında yapılandırın:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

Yerleşik bir beceri kökünün bir sembolik bağlantı içerdiği kasıtlı kardeş repo
düzenleri için `allowSymlinkTargets` kullanın; örneğin
`~/.agents/skills/manager -> ~/Projects/manager/skills`. Hedef listesi,
realpath çözümlemesinden sonra eşleştirilir ve dar tutulmalıdır.

### Uzak macOS düğümleri (Linux gateway)

Gateway Linux üzerinde çalışıyorsa ancak `system.run` izni olan
(`deny` olarak ayarlanmamış Exec onayları güvenliği) bir **macOS düğümü** bağlıysa,
gerekli ikililer o düğümde mevcut olduğunda OpenClaw macOS'a özgü becerileri uygun kabul edebilir.
Agent, bu becerileri `host=node` ile `exec` aracı üzerinden yürütmelidir.

Bu, düğümün komut desteğini bildirmesine ve `system.which` veya `system.run`
üzerinden yapılan bir ikili dosya yoklamasına dayanır. Çevrimdışı düğümler
yalnızca uzak becerileri görünür yapmaz. Bağlı bir düğüm ikili dosya
yoklamalarına yanıt vermeyi durdurursa, OpenClaw önbelleğe alınmış ikili dosya
eşleşmelerini temizler; böylece agent'lar şu anda orada çalışamayan becerileri artık görmez.

## Token etkisi

Beceriler uygun olduğunda, OpenClaw sistem istemine mevcut
becerilerin kompakt bir XML listesini enjekte eder (`pi-coding-agent` içindeki
`formatSkillsForPrompt` üzerinden). Maliyet deterministiktir:

- **Temel ek yük** (yalnızca ≥1 beceri olduğunda): 195 karakter.
- **Beceri başına:** 97 karakter + XML kaçışlı `<name>`, `<description>` ve `<location>` değerlerinin uzunluğu.

Formül (karakter):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML kaçışı, `& < > " '` karakterlerini varlıklara (`&amp;`, `&lt;`, vb.)
genişleterek uzunluğu artırır. Token sayıları model tokenizer'ına göre değişir. Kabaca
OpenAI tarzı bir tahmin ~4 karakter/token olduğundan, beceri başına **97 karakter ≈ 24 token**
artı gerçek alan uzunluklarınız gerekir.

## Yönetilen beceriler yaşam döngüsü

OpenClaw, kurulumla (npm paketi veya OpenClaw.app) birlikte bir temel beceri kümesini
**paketli beceriler** olarak gönderir. `~/.openclaw/skills`, yerel geçersiz kılmalar için vardır;
örneğin paketli kopyayı değiştirmeden bir beceriyi sabitlemek veya yamalamak.
Çalışma alanı becerileri kullanıcıya aittir ve ad çakışmalarında her ikisinin de üzerine yazar.

## Daha fazla beceri mi arıyorsunuz?

[https://clawhub.ai](https://clawhub.ai) adresine göz atın. Tam yapılandırma
şeması: [Skills yapılandırması](/tr/tools/skills-config).

## İlgili

- [ClawHub](/tr/clawhub) - herkese açık beceri kayıt defteri
- [Beceri oluşturma](/tr/tools/creating-skills) - özel beceriler oluşturma
- [Plugins](/tr/tools/plugin) - Plugin sistemi genel bakışı
- [Skill Workshop Plugin](/tr/plugins/skill-workshop) - agent çalışmasından beceriler üretme
- [Skills yapılandırması](/tr/tools/skills-config) - beceri yapılandırması başvurusu
- [Slash komutları](/tr/tools/slash-commands) - mevcut tüm slash komutları
