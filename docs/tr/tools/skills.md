---
read_when:
    - Skills ekleme veya değiştirme
    - Skills geçitlemeyi, izin verilenler listelerini veya yükleme kurallarını değiştirme
    - Skill önceliğini ve anlık görüntü davranışını anlama
sidebarTitle: Skills
summary: Skills, aracınıza araçları nasıl kullanacağını öğretir. Nasıl yüklendiklerini, önceliğin nasıl çalıştığını ve geçitleme, izin listeleri ve ortam enjeksiyonunun nasıl yapılandırılacağını öğrenin.
title: Skills
x-i18n:
    generated_at: "2026-07-04T06:45:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81b0f8dfc6522994b2dba865e236d1de3220fe265698506332d3139e38d9c929
    source_path: tools/skills.md
    workflow: 16
---

Skills, araca araçları nasıl ve ne zaman kullanacağını öğreten markdown yönerge dosyalarıdır. Her skill, YAML frontmatter ve markdown gövdesi içeren bir `SKILL.md` dosyasının bulunduğu bir dizinde yaşar. OpenClaw, paketle gelen skills ile yerel geçersiz kılmaları yükler ve bunları yükleme sırasında ortama, yapılandırmaya ve ikili dosya varlığına göre filtreler.

<CardGroup cols={2}>
  <Card title="Creating skills" href="/tr/tools/creating-skills" icon="hammer">
    Sıfırdan özel bir skill oluşturup test edin.
  </Card>
  <Card title="Skill Workshop" href="/tr/tools/skill-workshop" icon="flask">
    Aracının taslak olarak hazırladığı skill önerilerini inceleyip onaylayın.
  </Card>
  <Card title="Skills config" href="/tr/tools/skills-config" icon="gear">
    Tam `skills.*` yapılandırma şeması ve aracı izin listeleri.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Topluluk skills'lerine göz atın ve kurun.
  </Card>
</CardGroup>

## Yükleme sırası

OpenClaw şu kaynaklardan, **önce en yüksek öncelik** olacak şekilde yükler. Aynı
skill adı birden fazla yerde göründüğünde, en yüksek kaynak kazanır.

| Öncelik       | Kaynak                    | Yol                                     |
| ------------- | ------------------------- | --------------------------------------- |
| 1 — en yüksek | Çalışma alanı skills'leri | `<workspace>/skills`                    |
| 2             | Proje aracı skills'leri   | `<workspace>/.agents/skills`            |
| 3             | Kişisel aracı skills'leri | `~/.agents/skills`                      |
| 4             | Yönetilen / yerel skills  | `~/.openclaw/skills`                    |
| 5             | Paketle gelen skills      | kurulumla birlikte gelir                |
| 6 — en düşük  | Ek dizinler               | `skills.load.extraDirs` + plugin skills |

Skill kökleri gruplanmış düzenleri destekler. OpenClaw, yapılandırılmış bir
kökün altında herhangi bir yerde `SKILL.md` göründüğünde bir skill keşfeder:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Klasör yolu yalnızca düzenleme içindir. Skill'in adı, slash komutu ve izin
listesi anahtarı hep `name` frontmatter alanından gelir (`name` eksikse dizin
adından gelir).

<Note>
  Codex CLI'nin yerel `$CODEX_HOME/skills` dizini bir OpenClaw skill kökü
  **değildir**. Bu skills'lerin envanterini çıkarmak için `openclaw migrate plan codex`,
  ardından bunları OpenClaw çalışma alanınıza kopyalamak için `openclaw migrate codex`
  kullanın.
</Note>

## Aracı başına ve paylaşılan skills

Çok aracılı kurulumlarda her aracının kendi çalışma alanı vardır. İstediğiniz
görünürlüğe uyan yolu kullanın:

| Kapsam         | Yol                          | Görüneceği yer               |
| -------------- | ---------------------------- | ---------------------------- |
| Aracı başına   | `<workspace>/skills`         | Yalnızca o aracı             |
| Proje-aracısı  | `<workspace>/.agents/skills` | Yalnızca o çalışma alanının aracısı |
| Kişisel-aracı  | `~/.agents/skills`           | Bu makinedeki tüm aracılar   |
| Paylaşılan yönetilen | `~/.openclaw/skills`   | Bu makinedeki tüm aracılar   |
| Ek dizinler    | `skills.load.extraDirs`      | Bu makinedeki tüm aracılar   |

## Aracı izin listeleri

Skill **konumu** (öncelik) ve skill **görünürlüğü** (hangi aracının
kullanabileceği) ayrı denetimlerdir. Bir aracının hangi skills'leri gördüğünü,
nereden yüklendiklerinden bağımsız olarak kısıtlamak için izin listelerini
kullanın.

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
  <Accordion title="Allowlist rules">
    - Varsayılan olarak tüm skills'leri kısıtsız bırakmak için `agents.defaults.skills` öğesini atlayın.
    - `agents.defaults.skills` değerini devralmak için `agents.list[].skills` öğesini atlayın.
    - O aracıya hiçbir skill göstermemek için `agents.list[].skills: []` ayarlayın.
    - Boş olmayan bir `agents.list[].skills` listesi **son** kümedir — varsayılanlarla
      birleştirilmez.
    - Etkin izin listesi prompt oluşturma, slash komutu keşfi, sandbox
      senkronizasyonu ve skill anlık görüntüleri genelinde uygulanır.
    - Bu, bir host shell yetkilendirme sınırı değildir. Aynı aracı `exec`
      kullanabiliyorsa, o shell'i sandboxing, işletim sistemi kullanıcısı
      yalıtımı, exec engelleme/izin listeleri ve kaynak başına kimlik bilgileriyle
      ayrıca kısıtlayın.
  </Accordion>
</AccordionGroup>

## Plugins ve skills

Plugins, `openclaw.plugin.json` içinde `skills` dizinlerini listeleyerek kendi
skills'leriyle gelebilir (yollar plugin köküne görelidir). Plugin skills,
plugin etkinleştirildiğinde yüklenir — örneğin browser plugin, çok adımlı
tarayıcı denetimi için bir `browser-automation` skill'iyle gelir.

Plugin skill dizinleri, `skills.load.extraDirs` ile aynı düşük öncelikli düzeyde
birleşir; bu nedenle aynı ada sahip paketle gelen, yönetilen, aracı veya çalışma
alanı skill'i bunları geçersiz kılar. Bunları plugin'in yapılandırma girdisinde
`metadata.openclaw.requires.config` üzerinden kapılayın.

Tam plugin sistemi için [Plugins](/tr/tools/plugin) ve [Tools](/tr/tools) sayfalarına bakın.

## Skill Workshop

[Skill Workshop](/tr/tools/skill-workshop), aracı ile etkin skill dosyalarınız
arasında bir öneri kuyruğudur. Aracı yeniden kullanılabilir iş yakaladığında,
doğrudan `SKILL.md` dosyasına yazmak yerine bir öneri taslağı hazırlar. Herhangi
bir şey değişmeden önce inceleyip onaylarsınız.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Tam yaşam döngüsü, CLI başvurusu ve yapılandırma için
[Skill Workshop](/tr/tools/skill-workshop) sayfasına bakın.

## ClawHub'dan kurma

[ClawHub](https://clawhub.ai), herkese açık skills kayıt defteridir. Kurulum ve
güncelleme için `openclaw skills` komutlarını, yayımlama ve senkronizasyon için
ise `clawhub` CLI'yi kullanın.

| Eylem                                | Komut                                                  |
| ------------------------------------ | ------------------------------------------------------ |
| Çalışma alanına bir skill kur        | `openclaw skills install @owner/<slug>`                |
| Bir Git deposundan kur               | `openclaw skills install git:owner/repo@ref`           |
| Yerel bir skill dizini kur           | `openclaw skills install ./path/to/skill --as my-tool` |
| Tüm yerel aracılar için kur          | `openclaw skills install @owner/<slug> --global`       |
| Tüm çalışma alanı skills'lerini güncelle | `openclaw skills update --all`                     |
| Paylaşılan yönetilen bir skill'i güncelle | `openclaw skills update @owner/<slug> --global`    |
| Tüm paylaşılan yönetilen skills'leri güncelle | `openclaw skills update --all --global`         |
| Bir skill'in güven zarfını doğrula   | `openclaw skills verify @owner/<slug>`                 |
| Üretilen Skill Card'ı yazdır         | `openclaw skills verify @owner/<slug> --card`          |
| ClawHub CLI üzerinden yayımla / senkronize et | `clawhub sync --all`                           |

<AccordionGroup>
  <Accordion title="Install details">
    `openclaw skills install` varsayılan olarak etkin çalışma alanındaki
    `skills/` dizinine kurar. Tüm yerel aracılara görünür olan paylaşılan
    `~/.openclaw/skills` dizinine kurmak için `--global` ekleyin; aracı izin
    listeleri bunu daraltmadığı sürece görünür olur.

    Git ve yerel kurulumlar kaynak kökte `SKILL.md` bekler. Slug, geçerliyse
    `SKILL.md` frontmatter `name` alanından gelir, ardından dizin veya depo adına
    geri düşer. Geçersiz kılmak için `--as <slug>` kullanın.
    `openclaw skills update` yalnızca ClawHub kurulumlarını izler — Git veya
    yerel kaynakları yenilemek için yeniden kurun.

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>`, ClawHub'dan skill'in
    `clawhub.skill.verify.v1` güven zarfını ister. Kurulu ClawHub skills,
    `.clawhub/origin.json` içinde kaydedilen sürüme ve kayıt defterine göre
    doğrulanır. Yalın slug'lar mevcut kurulu veya belirsiz olmayan skills için
    kabul edilmeye devam eder, ancak sahip nitelikli ref'ler yayımlayıcı
    belirsizliğini önler.

    ClawHub skill sayfaları, kurulumdan önce en son güvenlik taraması durumunu
    VirusTotal, ClawScan ve statik analiz ayrıntı sayfalarıyla birlikte gösterir.
    ClawHub doğrulamayı başarısız olarak işaretlediğinde komut sıfır olmayan
    kodla çıkar. Yayımcılar yanlış pozitifleri ClawHub panosu veya
    `clawhub skill rescan @owner/<slug>` üzerinden düzeltebilir.

  </Accordion>
  <Accordion title="Private archive installs">
    ClawHub dışı teslimata ihtiyaç duyan Gateway istemcileri,
    `skills.upload.begin`, `skills.upload.chunk` ve `skills.upload.commit` ile
    bir zip skill arşivi hazırlayıp ardından `skills.install({ source: "upload", ... })`
    ile kurabilir. Bu yol varsayılan olarak kapalıdır ve `openclaw.json` içinde
    `skills.install.allowUploadedArchives: true` gerektirir. Normal ClawHub
    kurulumları bu ayara asla ihtiyaç duymaz.
  </Accordion>
</AccordionGroup>

## Güvenlik

<Warning>
  Üçüncü taraf skills'leri **güvenilmeyen kod** olarak ele alın. Etkinleştirmeden
  önce okuyun. Güvenilmeyen girdiler ve riskli araçlar için sandbox'lı
  çalıştırmaları tercih edin. Aracı tarafı denetimleri için
  [Sandboxing](/tr/gateway/sandboxing) sayfasına bakın.
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    Çalışma alanı, proje-aracısı ve ek-dizin skill keşfi, çözülmüş realpath'i
    yapılandırılmış kökün içinde kalan skill köklerini kabul eder; bunun istisnası,
    `skills.load.allowSymlinkTargets` ayarının bir hedef köke açıkça güvenmesidir.
    Skill Workshop, yalnızca `skills.workshop.allowSymlinkTargetWrites`
    etkinleştirildiğinde bu güvenilir hedefler üzerinden yazar.
    Yönetilen `~/.openclaw/skills` ve kişisel `~/.agents/skills`, symlink'li
    skill klasörleri içerebilir; ancak her `SKILL.md` realpath'i yine de
    çözülmüş skill dizininin içinde kalmalıdır.
  </Accordion>
  <Accordion title="Operator install policy">
    Skill kurulumları devam etmeden önce güvenilir bir yerel ilke komutu
    çalıştırmak için `security.installPolicy` yapılandırın. İlke, metadata ve
    hazırlanmış kaynak yolunu alır; ClawHub, yüklenen, Git, yerel, güncelleme ve
    bağımlılık-kurucu yollarına uygulanır ve komut geçerli bir karar döndüremezse
    kapalı başarısız olur.
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` ve `skills.entries.*.apiKey`, gizli değerleri yalnızca
    o aracı turu için **host** sürecine enjekte eder — sandbox'a değil. Gizli
    değerleri prompt'lardan ve günlüklerden uzak tutun.
  </Accordion>
</AccordionGroup>

Daha geniş tehdit modeli ve güvenlik kontrol listeleri için
[Security](/tr/gateway/security) sayfasına bakın.

## SKILL.md biçimi

Her skill için frontmatter içinde en az bir `name` ve `description` gerekir:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw, [AgentSkills](https://agentskills.io) spesifikasyonunu izler.
  Frontmatter ayrıştırıcı **yalnızca tek satırlı anahtarları** destekler —
  `metadata` tek satırlı bir JSON nesnesi olmalıdır. Skill klasör yoluna
  başvurmak için gövdede `{baseDir}` kullanın.
</Note>

### İsteğe bağlı frontmatter anahtarları

<ParamField path="homepage" type="string">
  macOS Skills arayüzünde "Website" olarak gösterilen URL. Ayrıca
  `metadata.openclaw.homepage` üzerinden de desteklenir.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  `true` olduğunda skill, kullanıcı tarafından çağrılabilir bir slash komutu
  olarak sunulur.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` olduğunda OpenClaw, skill yönergelerini aracının normal prompt'unun
  dışında tutar. `user-invocable` da `true` olduğunda skill yine de slash komutu
  olarak kullanılabilir.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  `tool` olarak ayarlandığında slash komutu modeli atlar ve doğrudan kayıtlı
  bir araca gönderilir.
</ParamField>

<ParamField path="command-tool" type="string">
  `command-dispatch: tool` ayarlandığında çağrılacak araç adı.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Araç yönlendirmesi için ham args dizesini çekirdek ayrıştırması olmadan
  araca iletir. Araç
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` alır.
</ParamField>

## Kapılama

OpenClaw, yükleme sırasında Skills'i `metadata.openclaw` kullanarak filtreler
(frontmatter içinde tek satırlık JSON). `metadata.openclaw` bloğu olmayan bir Skill,
açıkça devre dışı bırakılmadığı sürece her zaman uygundur.

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
  `true` olduğunda, Skill'i her zaman dahil eder ve diğer tüm kapıları atlar.
</ParamField>

<ParamField path="emoji" type="string">
  macOS Skills UI'da gösterilen isteğe bağlı emoji.
</ParamField>

<ParamField path="homepage" type="string">
  macOS Skills UI'da "Website" olarak gösterilen isteğe bağlı URL.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Platform filtresi. Ayarlandığında Skill yalnızca listelenen işletim sistemlerinde uygundur.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Her ikili dosya `PATH` üzerinde bulunmalıdır.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  En az bir ikili dosya `PATH` üzerinde bulunmalıdır.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Her env var süreçte bulunmalı veya config aracılığıyla sağlanmalıdır.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Her `openclaw.json` yolu truthy olmalıdır.
</ParamField>

<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` ile ilişkili env var adı.
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills UI tarafından kullanılan isteğe bağlı yükleyici belirtimleri (brew / node / go / uv / download).
</ParamField>

<Note>
  Eski `metadata.clawdbot` blokları, `metadata.openclaw` yoksa hâlâ kabul edilir;
  böylece daha eski yüklü Skills bağımlılık kapılarını ve yükleyici ipuçlarını korur.
  Yeni Skills `metadata.openclaw` kullanmalıdır.
</Note>

### Yükleyici belirtimleri

Yükleyici belirtimleri, macOS Skills UI'a bir bağımlılığın nasıl yükleneceğini söyler:

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
    - Birden fazla yükleyici listelendiğinde gateway tercih edilen tek bir
      seçenek seçer (varsa brew, aksi halde node).
    - Tüm yükleyiciler `download` ise OpenClaw her girdiyi listeler; böylece
      kullanılabilir tüm artifact'leri görebilirsiniz.
    - Belirtimler platforma göre filtrelemek için `os: ["darwin"|"linux"|"win32"]` içerebilir.
    - Node yüklemeleri `openclaw.json` içindeki `skills.install.nodeManager`
      ayarına uyar (varsayılan: npm; seçenekler: npm / pnpm / yarn / bun). Bu yalnızca Skill
      yüklemelerini etkiler; Gateway runtime yine Node olmalıdır.
    - Gateway yükleyici tercihi: Homebrew → uv → yapılandırılmış node yöneticisi →
      go → download.
  </Accordion>
  <Accordion title="Yükleyici başına ayrıntılar">
    - **Homebrew:** OpenClaw, Homebrew'u otomatik olarak yüklemez veya brew
      formüllerini sistem paketi komutlarına çevirmez. `brew` olmayan Linux
      container'larında yalnızca brew yükleyicileri gizlenir; özel bir image kullanın veya
      bağımlılığı elle yükleyin.
    - **Go:** OpenClaw, otomatik Skill yüklemeleri için Go 1.21 veya daha yenisini gerektirir ve
      mevcut `GOBIN`, `GOPATH` ve `GOTOOLCHAIN` ayarlarını korur. Yapılandırılmış
      toolchain bir modülün gerekli Go sürümünü karşılayamazsa onboarding,
      yükleme denemesinden sonra Skill'i manuel Go önkoşullarıyla gruplar.
      `go` eksikse ve Homebrew kullanılabiliyorsa OpenClaw önce Go'yu Homebrew
      üzerinden yükler ve `GOBIN` değerini Homebrew'un `bin` dizinine ayarlar. Linux'ta
      OpenClaw bunun yerine, yenilenen `golang-go` adayı minimum sürümü karşılıyorsa
      root olarak veya parolasız `sudo` üzerinden `apt-get` kullanabilir.
    - **Download:** `url` (zorunlu), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (varsayılan: arşiv algılandığında otomatik), `stripComponents`,
      `targetDir` (varsayılan: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Sandboxing notları">
    `requires.bins`, Skill yükleme sırasında **host** üzerinde denetlenir. Bir agent
    sandbox içinde çalışıyorsa ikili dosya **container içinde** de bulunmalıdır.
    `agents.defaults.sandbox.docker.setupCommand` veya özel bir image üzerinden
    yükleyin. `setupCommand`, container oluşturulduktan sonra bir kez çalışır ve
    ağ çıkışı, yazılabilir root FS ve sandbox içinde root kullanıcı gerektirir.
  </Accordion>
</AccordionGroup>

## Config geçersiz kılmaları

Paketlenmiş veya yönetilen Skills'i `~/.openclaw/openclaw.json` içindeki
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
  `false`, paketlenmiş veya yüklü olsa bile Skill'i devre dışı bırakır. Paketlenmiş
  `coding-agent` Skill'i isteğe bağlıdır — `skills.entries.coding-agent.enabled: true`
  ayarını yapın ve `claude`, `codex`, `opencode` veya desteklenen başka bir CLI'ın
  yüklü ve kimlik doğrulamasının yapılmış olduğundan emin olun.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` bildiren Skills için kolaylık alanı.
  Düz metin dizesini veya SecretRef nesnesini destekler.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Agent çalıştırması için enjekte edilen ortam değişkenleri. Yalnızca değişken
  süreçte zaten ayarlı değilse enjekte edilir.
</ParamField>

<ParamField path="config" type="object">
  Skill'e özel yapılandırma alanları için isteğe bağlı torba.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Yalnızca **paketlenmiş** Skills için isteğe bağlı izin listesi. Ayarlandığında
  yalnızca listedeki paketlenmiş Skills uygundur. Yönetilen ve workspace Skills
  etkilenmez.
</ParamField>

<Note>
  Config anahtarları varsayılan olarak **Skill adı** ile eşleşir. Bir Skill
  `metadata.openclaw.skillKey` tanımlıyorsa `skills.entries` altında bu anahtarı kullanın.
  Tireli adları tırnak içine alın: JSON5 tırnaklı anahtarlara izin verir.
</Note>

## Ortam enjeksiyonu

Bir agent çalıştırması başladığında OpenClaw:

<Steps>
  <Step title="Skill metadata'sını okur">
    OpenClaw, kapılama kurallarını, izin listelerini ve config geçersiz kılmalarını
    uygulayarak agent için etkili Skill listesini çözer.
  </Step>
  <Step title="Env ve API anahtarlarını enjekte eder">
    `skills.entries.<key>.env` ve `skills.entries.<key>.apiKey`, çalıştırma süresi boyunca
    `process.env` üzerine uygulanır.
  </Step>
  <Step title="Sistem prompt'unu oluşturur">
    Uygun Skills kompakt bir XML bloğu halinde derlenir ve sistem prompt'una
    enjekte edilir.
  </Step>
  <Step title="Ortamı geri yükler">
    Çalıştırma bittikten sonra özgün ortam geri yüklenir.
  </Step>
</Steps>

<Warning>
  Env enjeksiyonu sandbox'a değil **host** agent çalıştırmasına kapsamlanır. Bir
  sandbox içinde `env` ve `apiKey` etkisizdir. Gizli değerleri sandbox içindeki
  çalıştırmalara nasıl geçireceğiniz için
  [Skills config](/tr/tools/skills-config#sandboxed-skills-and-env-vars) bölümüne bakın.
</Warning>

Paketlenmiş `claude-cli` backend'i için OpenClaw aynı uygun Skill snapshot'ını
geçici bir Claude Code plugin'i olarak da oluşturur ve `--plugin-dir` üzerinden
geçirir. Diğer CLI backend'leri yalnızca prompt kataloğunu kullanır.

## Snapshot'lar ve yenileme

OpenClaw uygun Skills'in snapshot'ını **bir session başladığında** alır ve bu
listeyi session içindeki sonraki tüm turn'ler için yeniden kullanır. Skills veya
config değişiklikleri bir sonraki yeni session'da etkili olur.

Skills iki durumda session ortasında yenilenir:

- Skills watcher bir `SKILL.md` değişikliği algılar.
- Yeni bir uygun uzak node bağlanır.

Yenilenmiş liste bir sonraki agent turn'ünde alınır. Etkili agent izin listesi
değişirse OpenClaw, görünür Skills'i hizalı tutmak için snapshot'ı yeniler.

<AccordionGroup>
  <Accordion title="Skills watcher">
    Varsayılan olarak OpenClaw, Skill klasörlerini izler ve `SKILL.md` dosyaları
    değiştiğinde snapshot'ı artırır. `skills.load` altında yapılandırın:

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

    Skill root symlink'inin yapılandırılmış root dışına işaret ettiği bilinçli
    symlink'li yerleşimler için `allowSymlinkTargets` kullanın; örneğin
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    `skills.workshop.allowSymlinkTargetWrites` ayarını yalnızca Skill Workshop'un
    teklifleri bu güvenilen symlink'li yollar üzerinden de uygulaması gerektiğinde etkinleştirin.

  </Accordion>
  <Accordion title="Uzak macOS node'ları (Linux gateway)">
    Gateway Linux üzerinde çalışıyor ancak `system.run` izni olan bir **macOS node**
    bağlıysa OpenClaw, gerekli ikili dosyalar o node üzerinde mevcut olduğunda
    yalnızca macOS Skills'i uygun kabul edebilir. Agent bu Skills'i `exec` aracıyla
    `host=node` kullanarak çalıştırmalıdır.

    Çevrimdışı node'lar, yalnızca uzak Skills'i görünür yapmaz. Bir node bin
    probe'larına yanıt vermeyi bırakırsa OpenClaw önbelleğe alınmış bin eşleşmelerini temizler.

  </Accordion>
</AccordionGroup>

## Token etkisi

Skills uygun olduğunda OpenClaw sistem prompt'una kompakt bir XML bloğu enjekte eder.
Maliyet deterministiktir:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Temel ek yük** (yalnızca ≥ 1 Skill olduğunda): ~195 karakter
- **Skill başına:** ~97 karakter + `name`, `description` ve `location` alan uzunluklarınız
- XML kaçışlama `& < > " '` karakterlerini entity'lere genişletir ve her oluşum başına birkaç karakter ekler
- ~4 karakter/token varsayımıyla, 97 karakter alan uzunlukları öncesinde Skill başına ≈ 24 token eder

Prompt ek yükünü en aza indirmek için açıklamaları kısa ve açıklayıcı tutun.

## İlgili

<CardGroup cols={2}>
  <Card title="Skills oluşturma" href="/tr/tools/creating-skills" icon="hammer">
    Özel bir Skill yazmak için adım adım kılavuz.
  </Card>
  <Card title="Skill Workshop" href="/tr/tools/skill-workshop" icon="flask">
    Agent taslaklı Skills için teklif kuyruğu.
  </Card>
  <Card title="Skills config" href="/tr/tools/skills-config" icon="gear">
    Tam `skills.*` config şeması ve agent izin listeleri.
  </Card>
  <Card title="Slash commands" href="/tr/tools/slash-commands" icon="terminal">
    Skill slash commands'ın nasıl kaydedildiği ve yönlendirildiği.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Herkese açık kayıt üzerinde Skills'e göz atın ve yayınlayın.
  </Card>
  <Card title="Plugins" href="/tr/tools/plugin" icon="plug">
    Plugins, belgeledikleri araçlarla birlikte Skills gönderebilir.
  </Card>
</CardGroup>
