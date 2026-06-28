---
read_when:
    - Skills ekleme veya değiştirme
    - Beceri erişim denetimini, izin listelerini veya yükleme kurallarını değiştirme
    - Beceri önceliğini ve anlık görüntü davranışını anlama
sidebarTitle: Skills
summary: Skills, aracınıza araçları nasıl kullanacağını öğretir. Nasıl yüklendiklerini, önceliğin nasıl çalıştığını ve gating, izin listeleri ile ortam enjeksiyonunu nasıl yapılandıracağınızı öğrenin.
title: Skills
x-i18n:
    generated_at: "2026-06-28T01:25:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e42d89d47125a4d92f68a20d754de571d5582858a9c44618b999a27335e78ab2
    source_path: tools/skills.md
    workflow: 16
---

Skills, ajana araçları nasıl ve ne zaman kullanacağını öğreten markdown yönerge dosyalarıdır. Her beceri, YAML frontmatter ve markdown gövdesi içeren bir `SKILL.md` dosyasının bulunduğu bir dizinde yaşar. OpenClaw, paketle gelen Skills ile tüm yerel geçersiz kılmaları yükler ve bunları yükleme sırasında ortama, yapılandırmaya ve ikili dosya varlığına göre filtreler.

<CardGroup cols={2}>
  <Card title="Skills oluşturma" href="/tr/tools/creating-skills" icon="hammer">
    Sıfırdan özel bir beceri oluşturup test edin.
  </Card>
  <Card title="Beceri Atölyesi" href="/tr/tools/skill-workshop" icon="flask">
    Ajanın taslak olarak hazırladığı beceri önerilerini inceleyin ve onaylayın.
  </Card>
  <Card title="Skills yapılandırması" href="/tr/tools/skills-config" icon="gear">
    Tam `skills.*` yapılandırma şeması ve ajan izin listeleri.
  </Card>
  <Card title="ClawHub" href="/tr/clawhub" icon="cloud">
    Topluluk becerilerine göz atın ve yükleyin.
  </Card>
</CardGroup>

## Yükleme sırası

OpenClaw şu kaynaklardan yükler, **öncelik en yüksekten en düşüğe doğrudur**. Aynı
beceri adı birden fazla yerde göründüğünde en yüksek kaynak kazanır.

| Öncelik    | Kaynak                 | Yol                                     |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — en yüksek | Çalışma alanı Skills  | `<workspace>/skills`                    |
| 2           | Proje ajanı Skills     | `<workspace>/.agents/skills`            |
| 3           | Kişisel ajan Skills    | `~/.agents/skills`                      |
| 4           | Yönetilen / yerel Skills | `~/.openclaw/skills`                  |
| 5           | Paketle gelen Skills   | kurulumla birlikte gönderilir           |
| 6 — en düşük | Ek dizinler           | `skills.load.extraDirs` + plugin Skills |

Beceri kökleri gruplanmış düzenleri destekler. OpenClaw, yapılandırılmış bir kökün
altında herhangi bir yerde `SKILL.md` göründüğünde bir beceri keşfeder:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Klasör yolu yalnızca düzenleme içindir. Becerinin adı, eğik çizgi komutu ve
izin listesi anahtarı, `name` frontmatter alanından gelir (`name` eksikse dizin
adından gelir).

<Note>
  Codex CLI'nin yerel `$CODEX_HOME/skills` dizini bir OpenClaw
  beceri kökü **değildir**. Bu Skills envanterini çıkarmak için `openclaw migrate plan codex`,
  ardından bunları OpenClaw çalışma alanınıza kopyalamak için
  `openclaw migrate codex` kullanın.
</Note>

## Ajan başına ve paylaşılan Skills

Çok ajanlı kurulumlarda her ajanın kendi çalışma alanı vardır. İstediğiniz
görünürlüğe uyan yolu kullanın:

| Kapsam         | Yol                          | Şunlara görünür             |
| -------------- | ---------------------------- | --------------------------- |
| Ajan başına    | `<workspace>/skills`         | Yalnızca o ajan             |
| Proje ajanı    | `<workspace>/.agents/skills` | Yalnızca o çalışma alanının ajanı |
| Kişisel ajan   | `~/.agents/skills`           | Bu makinedeki tüm ajanlar   |
| Paylaşılan yönetilen | `~/.openclaw/skills`    | Bu makinedeki tüm ajanlar   |
| Ek dizinler    | `skills.load.extraDirs`      | Bu makinedeki tüm ajanlar   |

## Ajan izin listeleri

Beceri **konumu** (öncelik) ile beceri **görünürlüğü** (hangi ajanın
kullanabileceği) ayrı denetimlerdir. Bir ajanın hangi Skills göreceğini,
nereden yüklendiklerinden bağımsız olarak sınırlamak için izin listelerini kullanın.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="İzin listesi kuralları">
    - Varsayılan olarak tüm Skills kısıtlamasız bırakmak için `agents.defaults.skills` değerini atlayın.
    - `agents.defaults.skills` değerini devralmak için `agents.list[].skills` değerini atlayın.
    - Söz konusu ajan için hiçbir Skills göstermemek üzere `agents.list[].skills: []` ayarlayın.
    - Boş olmayan bir `agents.list[].skills` listesi **nihai** kümedir; varsayılanlarla
      birleştirilmez.
    - Etkin izin listesi istem oluşturma, eğik çizgi komutu keşfi, sandbox eşitleme
      ve beceri anlık görüntülerinin tamamında uygulanır.
  </Accordion>
</AccordionGroup>

## Plugin'ler ve Skills

Plugin'ler, `openclaw.plugin.json` içinde `skills` dizinlerini listeleyerek
(kök plugine göre göreli yollar) kendi Skills gönderebilir. Plugin Skills,
plugin etkinleştirildiğinde yüklenir; örneğin tarayıcı plugini, çok adımlı
tarayıcı denetimi için bir `browser-automation` becerisi gönderir.

Plugin beceri dizinleri, `skills.load.extraDirs` ile aynı düşük öncelikli
düzeyde birleşir; bu nedenle aynı ada sahip paketle gelen, yönetilen, ajan veya
çalışma alanı becerisi bunları geçersiz kılar. Bunları pluginin yapılandırma
girdisinde `metadata.openclaw.requires.config` üzerinden kapılayın.

Tam plugin sistemi için [Plugin'ler](/tr/tools/plugin) ve [Araçlar](/tr/tools) bölümlerine bakın.

## Beceri Atölyesi

[Beceri Atölyesi](/tr/tools/skill-workshop), ajan ile etkin beceri dosyalarınız
arasındaki bir öneri kuyruğudur. Ajan yeniden kullanılabilir bir çalışma fark
ettiğinde doğrudan `SKILL.md` içine yazmak yerine bir öneri taslağı oluşturur.
Herhangi bir şey değişmeden önce inceler ve onaylarsınız.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Tam yaşam döngüsü, CLI başvurusu ve yapılandırma için
[Beceri Atölyesi](/tr/tools/skill-workshop) bölümüne bakın.

## ClawHub'dan yükleme

[ClawHub](https://clawhub.ai), herkese açık Skills kayıt defteridir. Yükleme
ve güncelleme için `openclaw skills` komutlarını, yayımlama ve eşitleme için
`clawhub` CLI'yi kullanın.

| Eylem                              | Komut                                                  |
| ---------------------------------- | ------------------------------------------------------ |
| Çalışma alanına bir beceri yükle   | `openclaw skills install @owner/<slug>`                |
| Bir Git deposundan yükle           | `openclaw skills install git:owner/repo@ref`           |
| Yerel bir beceri dizini yükle      | `openclaw skills install ./path/to/skill --as my-tool` |
| Tüm yerel ajanlar için yükle       | `openclaw skills install @owner/<slug> --global`       |
| Tüm çalışma alanı Skills güncelle  | `openclaw skills update --all`                         |
| Paylaşılan yönetilen bir beceriyi güncelle | `openclaw skills update @owner/<slug> --global` |
| Tüm paylaşılan yönetilen Skills güncelle | `openclaw skills update --all --global`          |
| Bir becerinin güven zarfını doğrula | `openclaw skills verify @owner/<slug>`                |
| Oluşturulan Skill Card'ı yazdır    | `openclaw skills verify @owner/<slug> --card`          |
| ClawHub CLI ile yayımla / eşitle   | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Yükleme ayrıntıları">
    `openclaw skills install`, varsayılan olarak etkin çalışma alanındaki
    `skills/` dizinine yükler. Tüm yerel ajanlara görünür olan paylaşılan
    `~/.openclaw/skills` dizinine yüklemek için `--global` ekleyin; ajan
    izin listeleri bunu daraltabilir.

    Git ve yerel yüklemeler, kaynak kökte `SKILL.md` bekler. Slug, geçerliyse
    `SKILL.md` frontmatter `name` alanından gelir, ardından dizin veya depo
    adına geri döner. Geçersiz kılmak için `--as <slug>` kullanın.
    `openclaw skills update` yalnızca ClawHub yüklemelerini izler; Git veya
    yerel kaynakları yenilemek için yeniden yükleyin.

  </Accordion>
  <Accordion title="Doğrulama ve güvenlik taraması">
    `openclaw skills verify @owner/<slug>`, ClawHub'dan becerinin
    `clawhub.skill.verify.v1` güven zarfını ister. Yüklü ClawHub Skills,
    `.clawhub/origin.json` içinde kaydedilen sürüme ve kayıt defterine göre
    doğrulanır. Çıplak slug'lar mevcut yüklü veya belirsiz olmayan Skills için
    kabul edilmeye devam eder, ancak sahip nitelemeli başvurular yayıncı
    belirsizliğini önler.

    ClawHub beceri sayfaları, yükleme öncesinde en son güvenlik taraması
    durumunu; VirusTotal, ClawScan ve statik analiz için ayrıntı sayfalarıyla
    birlikte gösterir. ClawHub doğrulamayı başarısız olarak işaretlediğinde
    komut sıfır dışı çıkar. Yayıncılar yanlış pozitifleri ClawHub panosu veya
    `clawhub skill rescan @owner/<slug>` üzerinden giderir.

  </Accordion>
  <Accordion title="Özel arşiv yüklemeleri">
    ClawHub dışı teslimata ihtiyaç duyan Gateway istemcileri,
    `skills.upload.begin`, `skills.upload.chunk` ve `skills.upload.commit` ile
    bir zip beceri arşivini hazırlayıp ardından `skills.install({ source: "upload", ... })`
    ile yükleyebilir. Bu yol varsayılan olarak kapalıdır ve `openclaw.json`
    içinde `skills.install.allowUploadedArchives: true` gerektirir. Normal
    ClawHub yüklemeleri bu ayara hiçbir zaman ihtiyaç duymaz.
  </Accordion>
</AccordionGroup>

## Güvenlik

<Warning>
  Üçüncü taraf Skills **güvenilmeyen kod** olarak ele alın. Etkinleştirmeden
  önce okuyun. Güvenilmeyen girdiler ve riskli araçlar için sandbox içinde
  çalıştırmaları tercih edin. Ajan tarafı denetimleri için
  [Sandboxing](/tr/gateway/sandboxing) bölümüne bakın.
</Warning>

<AccordionGroup>
  <Accordion title="Yol kapsama">
    Çalışma alanı, proje ajanı ve ek dizin beceri keşfi, yalnızca çözümlenmiş
    realpath'i yapılandırılmış kökün içinde kalan beceri köklerini kabul eder;
    bunun istisnası, `skills.load.allowSymlinkTargets` değerinin bir hedef köke
    açıkça güvenmesidir. Beceri Atölyesi, yalnızca
    `skills.workshop.allowSymlinkTargetWrites` etkin olduğunda bu güvenilen
    hedefler üzerinden yazar. Yönetilen `~/.openclaw/skills` ve kişisel
    `~/.agents/skills` sembolik bağlantılı beceri klasörleri içerebilir, ancak
    her `SKILL.md` realpath'i yine de çözümlenmiş beceri dizininin içinde
    kalmalıdır.
  </Accordion>
  <Accordion title="Operatör yükleme ilkesi">
    Beceri yüklemeleri devam etmeden önce güvenilir bir yerel ilke komutu
    çalıştırmak için `security.installPolicy` yapılandırın. İlke, meta verileri
    ve hazırlanmış kaynak yolunu alır; ClawHub, yüklenen, Git, yerel,
    güncelleme ve bağımlılık yükleyici yollarına uygulanır ve komut geçerli
    bir karar döndüremediğinde kapalı başarısız olur.
  </Accordion>
  <Accordion title="Gizli değer ekleme kapsamı">
    `skills.entries.*.env` ve `skills.entries.*.apiKey`, gizli değerleri
    yalnızca o ajan turu için **ana makine** işlemine ekler; sandbox içine
    eklemez. Gizli değerleri istemlerden ve günlüklerden uzak tutun.
  </Accordion>
</AccordionGroup>

Daha geniş tehdit modeli ve güvenlik kontrol listeleri için
[Güvenlik](/tr/gateway/security) bölümüne bakın.

## SKILL.md biçimi

Her becerinin frontmatter içinde en az bir `name` ve `description` değerine
ihtiyacı vardır:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw, [AgentSkills](https://agentskills.io) belirtimini izler.
  Frontmatter ayrıştırıcı **yalnızca tek satırlı anahtarları** destekler;
  `metadata` tek satırlı bir JSON nesnesi olmalıdır. Beceri klasörü yoluna
  başvurmak için gövdede `{baseDir}` kullanın.
</Note>

### İsteğe bağlı frontmatter anahtarları

<ParamField path="homepage" type="string">
  macOS Skills kullanıcı arayüzünde "Web sitesi" olarak gösterilen URL. Ayrıca
  `metadata.openclaw.homepage` üzerinden de desteklenir.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  `true` olduğunda beceri, kullanıcı tarafından çağrılabilir bir eğik çizgi
  komutu olarak sunulur.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` olduğunda OpenClaw, becerinin yönergelerini ajanın normal isteminin
  dışında tutar. `user-invocable` da `true` olduğunda beceri yine de eğik çizgi
  komutu olarak kullanılabilir.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  `tool` olarak ayarlandığında eğik çizgi komutu modeli atlar ve doğrudan
  kayıtlı bir araca gönderilir.
</ParamField>

<ParamField path="command-tool" type="string">
  `command-dispatch: tool` ayarlandığında çağrılacak araç adı.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Araç gönderimi için ham bağımsız değişkenler dizesini çekirdek ayrıştırması
  olmadan araca iletir. Araç
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`
  alır.
</ParamField>

## Kapılama

OpenClaw, becerileri yükleme zamanında `metadata.openclaw` (frontmatter içinde tek satırlık JSON) kullanarak filtreler. `metadata.openclaw` bloğu olmayan bir beceri, açıkça devre dışı bırakılmadığı sürece her zaman uygundur.

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

<ParamField path="always" type="boolean">
  `true` olduğunda, beceriyi her zaman dahil eder ve diğer tüm geçitleri atlar.
</ParamField>

<ParamField path="emoji" type="string">
  macOS Skills arayüzünde gösterilen isteğe bağlı emoji.
</ParamField>

<ParamField path="homepage" type="string">
  macOS Skills arayüzünde "Web sitesi" olarak gösterilen isteğe bağlı URL.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Platform filtresi. Ayarlandığında, beceri yalnızca listelenen işletim sistemlerinde uygundur.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Her ikili dosya `PATH` üzerinde bulunmalıdır.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  En az bir ikili dosya `PATH` üzerinde bulunmalıdır.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Her ortam değişkeni süreçte bulunmalı veya yapılandırma aracılığıyla sağlanmalıdır.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Her `openclaw.json` yolu truthy olmalıdır.
</ParamField>

<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` ile ilişkilendirilmiş ortam değişkeni adı.
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills arayüzü tarafından kullanılan isteğe bağlı yükleyici belirtimleri (brew / node / go / uv / download).
</ParamField>

<Note>
  Eski `metadata.clawdbot` blokları, `metadata.openclaw` yoksa hâlâ kabul edilir; böylece daha önce yüklenmiş beceriler bağımlılık geçitlerini ve yükleyici ipuçlarını korur. Yeni beceriler `metadata.openclaw` kullanmalıdır.
</Note>

### Yükleyici belirtimleri

Yükleyici belirtimleri, macOS Skills arayüzüne bir bağımlılığın nasıl yükleneceğini söyler:

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
  <Accordion title="Installer selection rules">
    - Birden çok yükleyici listelendiğinde, Gateway tercih edilen tek bir seçeneği seçer (varsa brew, yoksa node).
    - Tüm yükleyiciler `download` ise OpenClaw her girdiyi listeler; böylece mevcut tüm artifaktları görebilirsiniz.
    - Belirtimler, platforma göre filtrelemek için `os: ["darwin"|"linux"|"win32"]` içerebilir.
    - Node yüklemeleri `openclaw.json` içindeki `skills.install.nodeManager` ayarına uyar (varsayılan: npm; seçenekler: npm / pnpm / yarn / bun). Bu yalnızca beceri yüklemelerini etkiler; Gateway çalışma zamanı hâlâ Node olmalıdır.
    - Gateway yükleyici tercihi: Homebrew → uv → yapılandırılmış node yöneticisi → go → download.
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew:** OpenClaw, Homebrew'u otomatik yüklemez veya brew formüllerini sistem paket komutlarına çevirmez. `brew` olmayan Linux container'larında, yalnızca brew yükleyicileri gizlenir; özel bir imaj kullanın veya bağımlılığı elle yükleyin.
    - **Go:** `go` eksikse ve `brew` kullanılabiliyorsa, Gateway önce Go'yu Homebrew aracılığıyla yükler ve `GOBIN` değerini Homebrew'un `bin` dizinine ayarlar.
    - **Download:** `url` (zorunlu), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (varsayılan: arşiv algılandığında otomatik), `stripComponents`, `targetDir` (varsayılan: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins`, beceri yükleme zamanında **ana makinede** denetlenir. Bir ajan sandbox içinde çalışıyorsa, ikili dosya **container içinde** de bulunmalıdır. Bunu `agents.defaults.sandbox.docker.setupCommand` veya özel bir imaj aracılığıyla yükleyin. `setupCommand`, container oluşturulduktan sonra bir kez çalışır ve sandbox içinde ağ çıkışı, yazılabilir kök dosya sistemi ve root kullanıcı gerektirir.
  </Accordion>
</AccordionGroup>

## Yapılandırma geçersiz kılmaları

Birlikte gelen veya yönetilen becerileri `~/.openclaw/openclaw.json` içinde `skills.entries` altında açıp kapatın ve yapılandırın:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
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
  `false`, beceri birlikte gelse veya yüklenmiş olsa bile onu devre dışı bırakır. Birlikte gelen `coding-agent` becerisi isteğe bağlıdır — `skills.entries.coding-agent.enabled: true` ayarını yapın ve `claude`, `codex`, `opencode` veya desteklenen başka bir CLI'nin yüklü ve kimliği doğrulanmış olduğundan emin olun.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` bildiren beceriler için kolaylık alanı. Düz metin dizeyi veya SecretRef nesnesini destekler.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Ajan çalıştırmasına enjekte edilen ortam değişkenleri. Yalnızca değişken süreçte zaten ayarlanmamışsa enjekte edilir.
</ParamField>

<ParamField path="config" type="object">
  Beceriye özel yapılandırma alanları için isteğe bağlı paket.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Yalnızca **birlikte gelen** beceriler için isteğe bağlı izin listesi. Ayarlandığında, yalnızca listedeki birlikte gelen beceriler uygundur. Yönetilen ve çalışma alanı becerileri etkilenmez.
</ParamField>

<Note>
  Yapılandırma anahtarları varsayılan olarak **beceri adıyla** eşleşir. Bir beceri `metadata.openclaw.skillKey` tanımlıyorsa, `skills.entries` altında bu anahtarı kullanın. Tireli adları tırnak içine alın: JSON5 tırnaklı anahtarlara izin verir.
</Note>

## Ortam enjeksiyonu

Bir ajan çalıştırması başladığında OpenClaw:

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw, geçit kurallarını, izin listelerini ve yapılandırma geçersiz kılmalarını uygulayarak ajan için etkili beceri listesini çözümler.
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` ve `skills.entries.<key>.apiKey`, çalıştırma süresi boyunca `process.env` üzerine uygulanır.
  </Step>
  <Step title="Builds the system prompt">
    Uygun beceriler kompakt bir XML bloğunda derlenir ve sistem istemine enjekte edilir.
  </Step>
  <Step title="Restores the environment">
    Çalıştırma sona erdikten sonra özgün ortam geri yüklenir.
  </Step>
</Steps>

<Warning>
  Ortam enjeksiyonu sandbox'a değil, **ana makinedeki** ajan çalıştırmasına kapsamlanmıştır. Sandbox içinde `env` ve `apiKey` etkisizdir. Gizli değerleri sandbox içindeki çalıştırmalara nasıl geçireceğiniz için [Skills yapılandırması](/tr/tools/skills-config#sandboxed-skills-and-env-vars) bölümüne bakın.
</Warning>

Birlikte gelen `claude-cli` arka ucu için OpenClaw, aynı uygun beceri anlık görüntüsünü geçici bir Claude Code Plugin olarak da oluşturur ve bunu `--plugin-dir` aracılığıyla geçirir. Diğer CLI arka uçları yalnızca istem kataloğunu kullanır.

## Anlık görüntüler ve yenileme

OpenClaw uygun becerilerin anlık görüntüsünü **bir oturum başladığında** alır ve bu listeyi oturumdaki sonraki tüm turlar için yeniden kullanır. Becerilerde veya yapılandırmada yapılan değişiklikler bir sonraki yeni oturumda etkili olur.

Beceriler oturum ortasında iki durumda yenilenir:

- Beceri izleyicisi bir `SKILL.md` değişikliği algılar.
- Yeni bir uygun uzak düğüm bağlanır.

Yenilenen liste bir sonraki ajan turunda alınır. Etkili ajan izin listesi değişirse, OpenClaw görünür becerileri hizalı tutmak için anlık görüntüyü yeniler.

<AccordionGroup>
  <Accordion title="Skills watcher">
    Varsayılan olarak OpenClaw, beceri klasörlerini izler ve `SKILL.md` dosyaları değiştiğinde anlık görüntüyü artırır. `skills.load` altında yapılandırın:

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

    Bir beceri kökü symlink'inin yapılandırılmış kökün dışını işaret ettiği kasıtlı symlink'li düzenler için `allowSymlinkTargets` kullanın; örneğin `<workspace>/skills/manager -> ~/Projects/manager/skills`. `skills.workshop.allowSymlinkTargetWrites` ayarını yalnızca Skill Workshop'un teklifleri bu güvenilir symlink'li yollar üzerinden de uygulaması gerektiğinde etkinleştirin.

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    Gateway Linux üzerinde çalışıyor ancak `system.run` izni olan bir **macOS düğümü** bağlıysa, OpenClaw gerekli ikili dosyalar o düğümde mevcut olduğunda yalnızca macOS becerilerini uygun kabul edebilir. Ajan bu becerileri `host=node` ile `exec` aracı üzerinden çalıştırmalıdır.

    Çevrimdışı düğümler, yalnızca uzak becerileri görünür yapmaz. Bir düğüm ikili dosya yoklamalarına yanıt vermeyi durdurursa, OpenClaw önbelleğe alınmış ikili eşleşmelerini temizler.

  </Accordion>
</AccordionGroup>

## Token etkisi

Beceriler uygun olduğunda OpenClaw, sistem istemine kompakt bir XML bloğu enjekte eder. Maliyet deterministiktir:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Temel ek yük** (yalnızca ≥ 1 beceri olduğunda): ~195 karakter
- **Beceri başına:** ~97 karakter + `name`, `description` ve `location` alan uzunluklarınız
- XML kaçışlama `& < > " '` karakterlerini entity'lere genişletir ve her oluşumda birkaç karakter ekler
- ~4 karakter/token oranında, 97 karakter alan uzunluklarından önce beceri başına ≈ 24 token eder

İstem ek yükünü en aza indirmek için açıklamaları kısa ve açıklayıcı tutun.

## İlgili

<CardGroup cols={2}>
  <Card title="Creating skills" href="/tr/tools/creating-skills" icon="hammer">
    Özel bir beceri yazmak için adım adım kılavuz.
  </Card>
  <Card title="Skill Workshop" href="/tr/tools/skill-workshop" icon="flask">
    Ajan tarafından taslaklanan beceriler için teklif kuyruğu.
  </Card>
  <Card title="Skills config" href="/tr/tools/skills-config" icon="gear">
    Tam `skills.*` yapılandırma şeması ve ajan izin listeleri.
  </Card>
  <Card title="Slash commands" href="/tr/tools/slash-commands" icon="terminal">
    Beceri slash komutlarının nasıl kaydedildiği ve yönlendirildiği.
  </Card>
  <Card title="ClawHub" href="/tr/clawhub" icon="cloud">
    Herkese açık kayıt defterinde becerilere göz atın ve yayımlayın.
  </Card>
  <Card title="Plugins" href="/tr/tools/plugin" icon="plug">
    Plugin'ler, belgeledikleri araçlarla birlikte beceriler sağlayabilir.
  </Card>
</CardGroup>
