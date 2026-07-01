---
read_when:
    - Skills ekleme veya değiştirme
    - Skill kapılamasını, izin listelerini veya yükleme kurallarını değiştirme
    - Skills önceliğini ve anlık görüntü davranışını anlama
sidebarTitle: Skills
summary: Skills, aracınıza araçları nasıl kullanacağını öğretir. Nasıl yüklendiklerini, önceliğin nasıl çalıştığını ve gating, izin listeleri ile ortam enjeksiyonunu nasıl yapılandıracağınızı öğrenin.
title: Skills
x-i18n:
    generated_at: "2026-07-01T08:29:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278a83bcd92e8c24ad0e01ec8fbf462450556493453ca1152e317727be34400
    source_path: tools/skills.md
    workflow: 16
---

Skills, ajana araçları nasıl ve ne zaman kullanacağını öğreten markdown yönerge dosyalarıdır. Her Skills, YAML frontmatter ve markdown gövdesi içeren bir `SKILL.md` dosyasının bulunduğu bir dizinde yer alır. OpenClaw, paketle gelen Skills ile yerel geçersiz kılmaları yükler ve bunları yükleme sırasında ortama, yapılandırmaya ve ikili dosya varlığına göre filtreler.

<CardGroup cols={2}>
  <Card title="Skills oluşturma" href="/tr/tools/creating-skills" icon="hammer">
    Sıfırdan özel bir Skills oluşturun ve test edin.
  </Card>
  <Card title="Skills Atölyesi" href="/tr/tools/skill-workshop" icon="flask">
    Ajan tarafından taslaklanan Skills önerilerini inceleyin ve onaylayın.
  </Card>
  <Card title="Skills yapılandırması" href="/tr/tools/skills-config" icon="gear">
    Tam `skills.*` yapılandırma şeması ve ajan izin listeleri.
  </Card>
  <Card title="ClawHub" href="/tr/clawhub" icon="cloud">
    Topluluk Skills'lerini gözden geçirin ve yükleyin.
  </Card>
</CardGroup>

## Yükleme sırası

OpenClaw şu kaynaklardan yükler, **en yüksek öncelik önce gelir**. Aynı Skills adı birden fazla yerde göründüğünde, en yüksek kaynak kazanır.

| Öncelik       | Kaynak                    | Yol                                     |
| ------------- | ------------------------- | --------------------------------------- |
| 1 — en yüksek | Çalışma alanı Skills'leri | `<workspace>/skills`                    |
| 2             | Proje ajanı Skills'leri   | `<workspace>/.agents/skills`            |
| 3             | Kişisel ajan Skills'leri  | `~/.agents/skills`                      |
| 4             | Yönetilen / yerel Skills  | `~/.openclaw/skills`                    |
| 5             | Paketle gelen Skills      | kurulumla birlikte gönderilir           |
| 6 — en düşük  | Ek dizinler               | `skills.load.extraDirs` + plugin Skills |

Skills kökleri gruplanmış düzenleri destekler. OpenClaw, yapılandırılmış bir kökün altında herhangi bir yerde `SKILL.md` göründüğünde bir Skills keşfeder:

```text
<workspace>/skills/research/SKILL.md          ✓ "research" olarak bulundu
<workspace>/skills/personal/research/SKILL.md ✓ ayrıca "research" olarak bulundu
```

Klasör yolu yalnızca düzenleme içindir. Skills'in adı, eğik çizgi komutu ve izin listesi anahtarının tümü `name` frontmatter alanından gelir (`name` eksik olduğunda dizin adından gelir).

<Note>
  Codex CLI'nin yerel `$CODEX_HOME/skills` dizini bir OpenClaw Skills kökü **değildir**. Bu Skills'lerin envanterini çıkarmak için `openclaw migrate plan codex` kullanın, ardından bunları OpenClaw çalışma alanınıza kopyalamak için `openclaw migrate codex` kullanın.
</Note>

## Ajan başına ve paylaşılan Skills

Çok ajanlı kurulumlarda her ajanın kendi çalışma alanı vardır. İstediğiniz görünürlükle eşleşen yolu kullanın:

| Kapsam          | Yol                          | Görünür olduğu yer             |
| --------------- | ---------------------------- | ------------------------------ |
| Ajan başına     | `<workspace>/skills`         | Yalnızca o ajan                |
| Proje ajanı     | `<workspace>/.agents/skills` | Yalnızca o çalışma alanı ajanı |
| Kişisel ajan    | `~/.agents/skills`           | Bu makinedeki tüm ajanlar      |
| Paylaşılan yönetilen | `~/.openclaw/skills`     | Bu makinedeki tüm ajanlar      |
| Ek dizinler     | `skills.load.extraDirs`      | Bu makinedeki tüm ajanlar      |

## Ajan izin listeleri

Skills **konumu** (öncelik) ve Skills **görünürlüğü** (hangi ajanın onu kullanabileceği) ayrı denetimlerdir. Bir ajanın hangi Skills'leri gördüğünü, nereden yüklendiklerinden bağımsız olarak kısıtlamak için izin listelerini kullanın.

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
    - Varsayılan olarak tüm Skills'leri kısıtlamasız bırakmak için `agents.defaults.skills` öğesini atlayın.
    - `agents.defaults.skills` öğesini devralmak için `agents.list[].skills` öğesini atlayın.
    - O ajan için hiçbir Skills göstermemek üzere `agents.list[].skills: []` olarak ayarlayın.
    - Boş olmayan bir `agents.list[].skills` listesi **nihai** kümedir; varsayılanlarla birleştirilmez.
    - Etkin izin listesi istem oluşturma, eğik çizgi komutu keşfi, korumalı alan eşitlemesi ve Skills anlık görüntüleri genelinde uygulanır.
    - Bu, bir ana makine kabuğu yetkilendirme sınırı değildir. Aynı ajan `exec` kullanabiliyorsa, o kabuğu korumalı alan, işletim sistemi kullanıcısı yalıtımı, exec reddetme/izin listeleri ve kaynak başına kimlik bilgileriyle ayrı olarak kısıtlayın.

  </Accordion>
</AccordionGroup>

## Plugin'ler ve Skills

Plugin'ler, `openclaw.plugin.json` içinde `skills` dizinlerini listeleyerek kendi Skills'lerini gönderebilir (yollar Plugin köküne görelidir). Plugin Skills'leri, Plugin etkinleştirildiğinde yüklenir; örneğin, tarayıcı Plugin'i çok adımlı tarayıcı denetimi için bir `browser-automation` Skills'i gönderir.

Plugin Skills dizinleri, `skills.load.extraDirs` ile aynı düşük öncelik düzeyinde birleştirilir; bu nedenle aynı ada sahip paketle gelen, yönetilen, ajan veya çalışma alanı Skills'i bunları geçersiz kılar. Bunları Plugin'in yapılandırma girdisindeki `metadata.openclaw.requires.config` aracılığıyla geçitleyin.

Tam Plugin sistemi için [Plugin'ler](/tr/tools/plugin) ve [Araçlar](/tr/tools) sayfalarına bakın.

## Skills Atölyesi

[Skills Atölyesi](/tr/tools/skill-workshop), ajan ile etkin Skills dosyalarınız arasında bir öneri kuyruğudur. Ajan yeniden kullanılabilir çalışma fark ettiğinde, doğrudan `SKILL.md` dosyasına yazmak yerine bir öneri taslağı oluşturur. Herhangi bir şey değişmeden önce inceler ve onaylarsınız.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Tam yaşam döngüsü, CLI başvurusu ve yapılandırma için [Skills Atölyesi](/tr/tools/skill-workshop) sayfasına bakın.

## ClawHub'dan yükleme

[ClawHub](https://clawhub.ai), herkese açık Skills kayıt defteridir. Yükleme ve güncelleme için `openclaw skills` komutlarını, yayımlama ve eşitleme için `clawhub` CLI'yi kullanın.

| Eylem                                    | Komut                                                  |
| ---------------------------------------- | ------------------------------------------------------ |
| Çalışma alanına bir Skills yükle         | `openclaw skills install @owner/<slug>`                |
| Bir Git deposundan yükle                 | `openclaw skills install git:owner/repo@ref`           |
| Yerel bir Skills dizini yükle            | `openclaw skills install ./path/to/skill --as my-tool` |
| Tüm yerel ajanlar için yükle             | `openclaw skills install @owner/<slug> --global`       |
| Tüm çalışma alanı Skills'lerini güncelle | `openclaw skills update --all`                         |
| Paylaşılan yönetilen bir Skills'i güncelle | `openclaw skills update @owner/<slug> --global`      |
| Tüm paylaşılan yönetilen Skills'leri güncelle | `openclaw skills update --all --global`           |
| Bir Skills'in güven zarfını doğrula      | `openclaw skills verify @owner/<slug>`                 |
| Oluşturulan Skill Card'ı yazdır          | `openclaw skills verify @owner/<slug> --card`          |
| ClawHub CLI üzerinden yayımla / eşitle   | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Yükleme ayrıntıları">
    `openclaw skills install`, varsayılan olarak etkin çalışma alanındaki `skills/` dizinine yükler. Tüm yerel ajanlara görünür olan paylaşılan `~/.openclaw/skills` dizinine yüklemek için `--global` ekleyin; ajan izin listeleri bunu daraltabilir.

    Git ve yerel yüklemeler, kaynak kökünde `SKILL.md` bekler. Geçerli olduğunda slug, `SKILL.md` frontmatter `name` alanından gelir; ardından dizin veya depo adına geri döner. Geçersiz kılmak için `--as <slug>` kullanın.
    `openclaw skills update` yalnızca ClawHub yüklemelerini izler; Git veya yerel kaynakları yenilemek için yeniden yükleyin.

  </Accordion>
  <Accordion title="Doğrulama ve güvenlik taraması">
    `openclaw skills verify @owner/<slug>`, ClawHub'dan Skills'in `clawhub.skill.verify.v1` güven zarfını ister. Yüklü ClawHub Skills'leri, `.clawhub/origin.json` içinde kaydedilen sürüme ve kayıt defterine göre doğrulanır.
    Çıplak slug'lar mevcut yüklü veya belirsiz olmayan Skills'ler için kabul edilmeye devam eder, ancak sahip nitelikli başvurular yayımcı belirsizliğini önler.

    ClawHub Skills sayfaları, yüklemeden önce en son güvenlik taraması durumunu gösterir; VirusTotal, ClawScan ve statik analiz için ayrıntı sayfaları bulunur. ClawHub doğrulamayı başarısız olarak işaretlediğinde komut sıfır olmayan kodla çıkar. Yayımcılar yanlış pozitifleri ClawHub panosu veya `clawhub skill rescan @owner/<slug>` aracılığıyla giderir.

  </Accordion>
  <Accordion title="Özel arşiv yüklemeleri">
    ClawHub dışı teslimata ihtiyaç duyan Gateway istemcileri, `skills.upload.begin`, `skills.upload.chunk` ve `skills.upload.commit` ile bir zip Skills arşivini hazırlayabilir, ardından `skills.install({ source: "upload", ... })` ile yükleyebilir. Bu yol varsayılan olarak kapalıdır ve `openclaw.json` içinde `skills.install.allowUploadedArchives: true` gerektirir. Normal ClawHub yüklemeleri bu ayara hiçbir zaman ihtiyaç duymaz.
  </Accordion>
</AccordionGroup>

## Güvenlik

<Warning>
  Üçüncü taraf Skills'leri **güvenilmeyen kod** olarak değerlendirin. Etkinleştirmeden önce okuyun.
  Güvenilmeyen girdiler ve riskli araçlar için korumalı alanlı çalıştırmaları tercih edin. Ajan tarafı denetimler için [Korumalı Alan](/tr/gateway/sandboxing) sayfasına bakın.
</Warning>

<AccordionGroup>
  <Accordion title="Yol kapsama">
    Çalışma alanı, proje ajanı ve ek dizin Skills keşfi, çözümlenmiş realpath'i yapılandırılmış kökün içinde kalan Skills köklerini kabul eder; `skills.load.allowSymlinkTargets` bir hedef köke açıkça güvenmediği sürece.
    Skills Atölyesi, bu güvenilen hedefler üzerinden yalnızca `skills.workshop.allowSymlinkTargetWrites` etkinleştirildiğinde yazar.
    Yönetilen `~/.openclaw/skills` ve kişisel `~/.agents/skills` sembolik bağlantılı Skills klasörleri içerebilir, ancak her `SKILL.md` realpath'i yine de çözümlenmiş Skills dizininin içinde kalmalıdır.
  </Accordion>
  <Accordion title="Operatör yükleme politikası">
    Skills yüklemeleri devam etmeden önce güvenilen bir yerel politika komutu çalıştırmak için `security.installPolicy` yapılandırın. Politika, meta verileri ve hazırlanmış kaynak yolunu alır; ClawHub, yüklenen, Git, yerel, güncelleme ve bağımlılık yükleyici yollarına uygulanır ve komut geçerli bir karar döndüremediğinde kapalı başarısız olur.
  </Accordion>
  <Accordion title="Gizli kapsamı ekleme">
    `skills.entries.*.env` ve `skills.entries.*.apiKey`, gizli değerleri yalnızca o ajan dönüşü için **ana makine** sürecine ekler; korumalı alana eklemez. Gizli değerleri istemlerden ve günlüklerden uzak tutun.
  </Accordion>
</AccordionGroup>

Daha geniş tehdit modeli ve güvenlik kontrol listeleri için [Güvenlik](/tr/gateway/security) sayfasına bakın.

## SKILL.md biçimi

Her Skills için frontmatter içinde en az bir `name` ve `description` gerekir:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw, [AgentSkills](https://agentskills.io) belirtimini izler. Frontmatter ayrıştırıcısı **yalnızca tek satırlı anahtarları** destekler; `metadata` tek satırlı bir JSON nesnesi olmalıdır. Skills klasörü yoluna başvurmak için gövdede `{baseDir}` kullanın.
</Note>

### İsteğe bağlı frontmatter anahtarları

<ParamField path="homepage" type="string">
  macOS Skills kullanıcı arayüzünde "Website" olarak gösterilen URL. `metadata.openclaw.homepage` üzerinden de desteklenir.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  `true` olduğunda, Skills kullanıcı tarafından çağrılabilir bir eğik çizgi komutu olarak sunulur.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` olduğunda, OpenClaw Skills'in yönergelerini ajanın normal isteminin dışında tutar. `user-invocable` da `true` olduğunda Skills yine de eğik çizgi komutu olarak kullanılabilir.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  `tool` olarak ayarlandığında, eğik çizgi komutu modeli atlar ve doğrudan kayıtlı bir araca yönlendirilir.
</ParamField>

<ParamField path="command-tool" type="string">
  `command-dispatch: tool` ayarlandığında çağrılacak araç adı.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Araç yönlendirmesi için, ham argümanlar dizesini çekirdek ayrıştırması
  olmadan araca iletir. Araç
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` alır.
</ParamField>

## Geçit Koşulları

OpenClaw, yükleme sırasında becerileri `metadata.openclaw` kullanarak filtreler
(frontmatter içinde tek satırlık JSON). `metadata.openclaw` bloğu olmayan bir
beceri, açıkça devre dışı bırakılmadığı sürece her zaman uygundur.

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
  macOS Skills kullanıcı arayüzünde gösterilen isteğe bağlı emoji.
</ParamField>

<ParamField path="homepage" type="string">
  macOS Skills kullanıcı arayüzünde "Web sitesi" olarak gösterilen isteğe bağlı URL.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Platform filtresi. Ayarlandığında, beceri yalnızca listelenen işletim sistemlerinde uygundur.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Her ikili `PATH` üzerinde mevcut olmalıdır.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  En az bir ikili `PATH` üzerinde mevcut olmalıdır.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Her ortam değişkeni süreçte mevcut olmalı veya yapılandırma üzerinden sağlanmalıdır.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Her `openclaw.json` yolu doğrumsu olmalıdır.
</ParamField>

<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` ile ilişkili ortam değişkeni adı.
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills kullanıcı arayüzü tarafından kullanılan isteğe bağlı yükleyici belirtimleri (brew / node / go / uv / download).
</ParamField>

<Note>
  Eski `metadata.clawdbot` blokları, `metadata.openclaw` yoksa hâlâ kabul
  edilir; böylece daha eski yüklü beceriler bağımlılık geçitlerini ve yükleyici
  ipuçlarını korur. Yeni beceriler `metadata.openclaw` kullanmalıdır.
</Note>

### Yükleyici belirtimleri

Yükleyici belirtimleri, macOS Skills kullanıcı arayüzüne bir bağımlılığın nasıl
yükleneceğini söyler:

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
    - Birden fazla yükleyici listelendiğinde Gateway tercih edilen bir seçenek
      seçer (varsa brew, aksi halde node).
    - Tüm yükleyiciler `download` ise OpenClaw her girdiyi listeler, böylece
      mevcut tüm yapıtları görebilirsiniz.
    - Belirtimler platforma göre filtrelemek için `os: ["darwin"|"linux"|"win32"]`
      içerebilir.
    - Node yüklemeleri `openclaw.json` içindeki `skills.install.nodeManager`
      ayarına uyar (varsayılan: npm; seçenekler: npm / pnpm / yarn / bun). Bu
      yalnızca beceri yüklemelerini etkiler; Gateway çalışma zamanı yine Node olmalıdır.
    - Gateway yükleyici tercihi: Homebrew → uv → yapılandırılmış node yöneticisi →
      go → download.
  </Accordion>
  <Accordion title="Yükleyici başına ayrıntılar">
    - **Homebrew:** OpenClaw, Homebrew'i otomatik yüklemez veya brew formüllerini
      sistem paketi komutlarına çevirmez. `brew` olmayan Linux konteynerlerinde,
      yalnızca brew kullanan yükleyiciler gizlenir; özel bir imaj kullanın veya
      bağımlılığı el ile yükleyin.
    - **Go:** `go` eksikse ve `brew` mevcutsa Gateway önce Homebrew üzerinden
      Go yükler ve `GOBIN` değerini Homebrew'in `bin` dizinine ayarlar.
    - **Download:** `url` (gerekli), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (varsayılan: arşiv algılandığında otomatik), `stripComponents`,
      `targetDir` (varsayılan: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Korumalı alan notları">
    `requires.bins`, beceri yükleme sırasında **ana makinede** denetlenir. Bir
    ajan korumalı alanda çalışıyorsa ikili **konteynerin içinde** de mevcut
    olmalıdır. `agents.defaults.sandbox.docker.setupCommand` veya özel bir imaj
    üzerinden yükleyin. `setupCommand`, konteyner oluşturulduktan sonra bir kez
    çalışır ve ağ çıkışı, yazılabilir kök dosya sistemi ve korumalı alanda root
    kullanıcı gerektirir.
  </Accordion>
</AccordionGroup>

## Yapılandırma geçersiz kılmaları

Birlikte gelen veya yönetilen becerileri `~/.openclaw/openclaw.json` içinde
`skills.entries` altında açıp kapatın ve yapılandırın:

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
  `false`, birlikte gelse veya yüklü olsa bile beceriyi devre dışı bırakır.
  Birlikte gelen `coding-agent` becerisi isteğe bağlıdır — `skills.entries.coding-agent.enabled: true`
  ayarlayın ve `claude`, `codex`, `opencode` veya desteklenen başka bir CLI'ın
  yüklü ve kimliği doğrulanmış olduğundan emin olun.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` bildiren beceriler için kolaylık alanı.
  Düz metin dizesini veya SecretRef nesnesini destekler.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Ajan çalıştırması için enjekte edilen ortam değişkenleri. Yalnızca değişken
  süreçte zaten ayarlı değilse enjekte edilir.
</ParamField>

<ParamField path="config" type="object">
  Beceriye özel yapılandırma alanları için isteğe bağlı torba.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Yalnızca **birlikte gelen** beceriler için isteğe bağlı izin listesi.
  Ayarlandığında, yalnızca listedeki birlikte gelen beceriler uygundur.
  Yönetilen ve çalışma alanı becerileri etkilenmez.
</ParamField>

<Note>
  Yapılandırma anahtarları varsayılan olarak **beceri adı** ile eşleşir. Bir
  beceri `metadata.openclaw.skillKey` tanımlıyorsa, `skills.entries` altında o
  anahtarı kullanın. Tireli adları tırnak içine alın: JSON5 tırnaklı anahtarlara izin verir.
</Note>

## Ortam enjeksiyonu

Bir ajan çalıştırması başladığında OpenClaw:

<Steps>
  <Step title="Beceri metaverisini okur">
    OpenClaw, geçit kurallarını, izin listelerini ve yapılandırma geçersiz
    kılmalarını uygulayarak ajan için etkili beceri listesini çözer.
  </Step>
  <Step title="Ortamı ve API anahtarlarını enjekte eder">
    `skills.entries.<key>.env` ve `skills.entries.<key>.apiKey`, çalıştırma
    süresi boyunca `process.env` üzerine uygulanır.
  </Step>
  <Step title="Sistem istemini oluşturur">
    Uygun beceriler kompakt bir XML bloğuna derlenir ve sistem istemine enjekte edilir.
  </Step>
  <Step title="Ortamı geri yükler">
    Çalıştırma bittikten sonra özgün ortam geri yüklenir.
  </Step>
</Steps>

<Warning>
  Ortam enjeksiyonu korumalı alana değil, **ana makine** ajan çalıştırmasına
  kapsamlanır. Korumalı alan içinde `env` ve `apiKey` etkisizdir. Sırları
  korumalı alan çalıştırmalarına nasıl geçireceğiniz için
  [Skills yapılandırması](/tr/tools/skills-config#sandboxed-skills-and-env-vars)
  bölümüne bakın.
</Warning>

Birlikte gelen `claude-cli` arka ucu için OpenClaw aynı uygun beceri anlık
görüntüsünü geçici bir Claude Code Plugin olarak da somutlaştırır ve
`--plugin-dir` üzerinden geçirir. Diğer CLI arka uçları yalnızca istem kataloğunu kullanır.

## Anlık görüntüler ve yenileme

OpenClaw uygun becerilerin anlık görüntüsünü **bir oturum başladığında** alır
ve bu listeyi oturumdaki sonraki tüm turlarda yeniden kullanır. Becerilerde
veya yapılandırmada yapılan değişiklikler bir sonraki yeni oturumda etkili olur.

Beceriler oturum ortasında iki durumda yenilenir:

- Beceri izleyicisi bir `SKILL.md` değişikliği algılar.
- Yeni bir uygun uzak düğüm bağlanır.

Yenilenen liste bir sonraki ajan turunda alınır. Etkili ajan izin listesi
değişirse OpenClaw, görünür becerileri hizalı tutmak için anlık görüntüyü yeniler.

<AccordionGroup>
  <Accordion title="Skills izleyicisi">
    Varsayılan olarak OpenClaw beceri klasörlerini izler ve `SKILL.md` dosyaları
    değiştiğinde anlık görüntüyü artırır. `skills.load` altında yapılandırın:

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

    Bir beceri kök sembolik bağlantısının yapılandırılmış kökün dışını
    gösterdiği kasıtlı sembolik bağlantılı yerleşimler için `allowSymlinkTargets`
    kullanın; örneğin `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    `skills.workshop.allowSymlinkTargetWrites` seçeneğini yalnızca Skill Workshop
    teklifleri bu güvenilen sembolik bağlantılı yollar üzerinden de uygulamalıysa etkinleştirin.

  </Accordion>
  <Accordion title="Uzak macOS düğümleri (Linux gateway)">
    Gateway Linux üzerinde çalışıyor ancak `system.run` izinli bir **macOS düğümü**
    bağlıysa, gerekli ikililer o düğümde mevcut olduğunda OpenClaw yalnızca
    macOS becerilerini uygun kabul edebilir. Ajan bu becerileri `host=node` ile
    `exec` aracı üzerinden çalıştırmalıdır.

    Çevrimdışı düğümler yalnızca uzak becerileri görünür yapmaz. Bir düğüm
    ikili yoklamalarına yanıt vermeyi bırakırsa OpenClaw, önbelleğe aldığı ikili
    eşleşmelerini temizler.

  </Accordion>
</AccordionGroup>

## Token etkisi

Beceriler uygun olduğunda OpenClaw sistem istemine kompakt bir XML bloğu enjekte
eder. Maliyet deterministiktir:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Taban ek yük** (yalnızca ≥ 1 beceri olduğunda): ~195 karakter
- **Beceri başına:** ~97 karakter + `name`, `description` ve `location` alan uzunluklarınız
- XML kaçışlama `& < > " '` karakterlerini varlıklara genişletir ve her oluşumda birkaç karakter ekler
- ~4 karakter/token oranında, 97 karakter alan uzunluklarından önce beceri başına ≈ 24 token eder

İstem ek yükünü en aza indirmek için açıklamaları kısa ve açıklayıcı tutun.

## İlgili

<CardGroup cols={2}>
  <Card title="Beceri oluşturma" href="/tr/tools/creating-skills" icon="hammer">
    Özel bir beceri yazmak için adım adım kılavuz.
  </Card>
  <Card title="Skill Workshop" href="/tr/tools/skill-workshop" icon="flask">
    Ajan taslaklı beceriler için teklif kuyruğu.
  </Card>
  <Card title="Skills yapılandırması" href="/tr/tools/skills-config" icon="gear">
    Tam `skills.*` yapılandırma şeması ve ajan izin listeleri.
  </Card>
  <Card title="Slash komutları" href="/tr/tools/slash-commands" icon="terminal">
    Beceri slash komutlarının nasıl kaydedildiği ve yönlendirildiği.
  </Card>
  <Card title="ClawHub" href="/tr/clawhub" icon="cloud">
    Genel kayıt defterinde becerilere göz atın ve yayımlayın.
  </Card>
  <Card title="Plugins" href="/tr/tools/plugin" icon="plug">
    Plugin'ler, belgeledikleri araçlarla birlikte beceriler gönderebilir.
  </Card>
</CardGroup>
