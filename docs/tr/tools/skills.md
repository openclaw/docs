---
read_when:
    - Skills ekleme veya değiştirme
    - Beceri geçitlemesini, izin listelerini veya yükleme kurallarını değiştirme
    - Beceri önceliğini ve anlık görüntü davranışını anlama
sidebarTitle: Skills
summary: 'Skills: yönetilen ile çalışma alanı arasındaki farklar, geçitleme kuralları, ajan izin listeleri ve yapılandırma bağlantıları'
title: Skills
x-i18n:
    generated_at: "2026-04-30T09:50:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7dd17f52119bf0a0bb197025070abb68f7667a7d22c3d5fa6ef2f666110a45a
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw, ajana araçları nasıl kullanacağını öğretmek için **[AgentSkills](https://agentskills.io) uyumlu** beceri
klasörleri kullanır. Her beceri, YAML frontmatter ve talimatlar içeren
bir `SKILL.md` barındıran dizindir. OpenClaw, paketle gelen becerileri ve
isteğe bağlı yerel geçersiz kılmaları yükler; bunları yükleme sırasında
ortama, yapılandırmaya ve ikili dosya varlığına göre filtreler.

## Konumlar ve öncelik

OpenClaw becerileri şu kaynaklardan yükler, **en yüksek öncelik önce**:

| #   | Kaynak                 | Yol                              |
| --- | ---------------------- | -------------------------------- |
| 1   | Çalışma alanı becerileri | `<workspace>/skills`             |
| 2   | Proje ajanı becerileri | `<workspace>/.agents/skills`     |
| 3   | Kişisel ajan becerileri | `~/.agents/skills`               |
| 4   | Yönetilen/yerel beceriler | `~/.openclaw/skills`             |
| 5   | Paketle gelen beceriler | kurulumla birlikte gelir         |
| 6   | Ek beceri klasörleri   | `skills.load.extraDirs` (config) |

Bir beceri adı çakışırsa, en yüksek kaynak kazanır.

## Ajan bazında ve paylaşılan beceriler

**Çok ajanlı** kurulumlarda her ajanın kendi çalışma alanı vardır:

| Kapsam                 | Yol                                         | Şunlara görünür             |
| ---------------------- | ------------------------------------------- | --------------------------- |
| Ajan bazında           | `<workspace>/skills`                        | Yalnızca o ajan             |
| Proje ajanı            | `<workspace>/.agents/skills`                | Yalnızca o çalışma alanının ajanı |
| Kişisel ajan           | `~/.agents/skills`                          | O makinedeki tüm ajanlar    |
| Paylaşılan yönetilen/yerel | `~/.openclaw/skills`                    | O makinedeki tüm ajanlar    |
| Paylaşılan ek dizinler | `skills.load.extraDirs` (en düşük öncelik)  | O makinedeki tüm ajanlar    |

Birden çok yerde aynı ad → en yüksek kaynak kazanır. Çalışma alanı,
proje ajanını; proje ajanı, kişisel ajanı; kişisel ajan, yönetilen/yereli;
yönetilen/yerel, paketle geleni; paketle gelen de ek dizinleri geçer.

## Ajan beceri izin listeleri

Beceri **konumu** ve beceri **görünürlüğü** ayrı denetimlerdir.
Konum/öncelik, aynı adlı bir becerinin hangi kopyasının kazanacağını belirler;
ajan izin listeleri ise bir ajanın gerçekten hangi becerileri kullanabileceğini belirler.

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
  <Accordion title="İzin listesi kuralları">
    - Varsayılan olarak sınırsız beceriler için `agents.defaults.skills` değerini atlayın.
    - `agents.defaults.skills` değerini devralmak için `agents.list[].skills` değerini atlayın.
    - Beceri olmaması için `agents.list[].skills: []` ayarlayın.
    - Boş olmayan bir `agents.list[].skills` listesi, o ajan için **nihai** kümedir — varsayılanlarla birleştirilmez.
    - Etkin izin listesi istem oluşturma, beceri slash komutu keşfi, sandbox eşitlemesi ve beceri anlık görüntüleri genelinde uygulanır.

  </Accordion>
</AccordionGroup>

## Plugins ve beceriler

Plugins, `openclaw.plugin.json` içinde `skills` dizinlerini listeleyerek
kendi becerilerini gönderebilir (yollar Plugin köküne görelidir). Plugin becerileri,
Plugin etkinleştirildiğinde yüklenir. Bu, araç açıklaması için fazla uzun olan
ancak Plugin kurulu olduğunda kullanılabilir olması gereken araca özgü
işletim kılavuzları için doğru yerdir — örneğin tarayıcı
Plugin, çok adımlı tarayıcı denetimi için bir `browser-automation` becerisi gönderir.

Plugin beceri dizinleri, `skills.load.extraDirs` ile aynı düşük öncelikli
yola birleştirilir; bu nedenle aynı adlı paketle gelen, yönetilen, ajan veya
çalışma alanı becerisi bunları geçersiz kılar. Bunları Plugin yapılandırma
girişindeki `metadata.openclaw.requires.config` ile kapılayabilirsiniz.

Keşif/yapılandırma için [Plugins](/tr/tools/plugin) bölümüne, bu becerilerin
öğrettiği araç yüzeyi için [Araçlar](/tr/tools) bölümüne bakın.

## Skill Workshop

İsteğe bağlı, deneysel **Skill Workshop** Plugin, ajan çalışması sırasında
gözlemlenen yeniden kullanılabilir prosedürlerden çalışma alanı becerileri
oluşturabilir veya güncelleyebilir. Varsayılan olarak devre dışıdır ve
`plugins.entries.skill-workshop` üzerinden açıkça etkinleştirilmelidir.

Skill Workshop yalnızca `<workspace>/skills` içine yazar, oluşturulan
içeriği tarar, bekleyen onayı veya otomatik güvenli yazmaları destekler,
güvensiz önerileri karantinaya alır ve başarılı yazmalardan sonra beceri
anlık görüntüsünü yeniler; böylece yeni beceriler Gateway yeniden başlatması
olmadan kullanılabilir hale gelir.

Bunu _"bir dahaki sefere GIF atfını doğrula"_ gibi düzeltmeler veya medya
QA kontrol listeleri gibi zor kazanılmış iş akışları için kullanın. Bekleyen
onayla başlayın; otomatik yazmaları yalnızca önerilerini inceledikten sonra
güvenilir çalışma alanlarında kullanın. Tam kılavuz: [Skill Workshop Plugin](/tr/plugins/skill-workshop).

## ClawHub (kurulum ve eşitleme)

[ClawHub](https://clawhub.ai), OpenClaw için herkese açık beceri kayıt defteridir.
Keşif/kurulum/güncelleme için yerel `openclaw skills` komutlarını veya
yayınlama/eşitleme iş akışları için ayrı `clawhub` CLI aracını kullanın.
Tam kılavuz: [ClawHub](/tr/tools/clawhub).

| Eylem                                | Komut                                  |
| ------------------------------------ | -------------------------------------- |
| Çalışma alanına bir beceri kur       | `openclaw skills install <skill-slug>` |
| Kurulu tüm becerileri güncelle       | `openclaw skills update --all`         |
| Eşitle (tara + güncellemeleri yayımla) | `clawhub sync --all`                 |

Yerel `openclaw skills install`, etkin çalışma alanı `skills/` dizinine
kurulum yapar. Ayrı `clawhub` CLI de geçerli çalışma dizininizin altındaki
`./skills` içine kurulum yapar (veya yapılandırılmış OpenClaw çalışma alanına
geri döner). OpenClaw bunu bir sonraki oturumda `<workspace>/skills` olarak
alır. Yapılandırılmış beceri kökleri, `skills/<group>/<skill>/SKILL.md`
gibi tek bir gruplama düzeyini de destekler; böylece ilgili üçüncü taraf
becerileri geniş özyinelemeli tarama olmadan paylaşılan bir klasör altında
tutulabilir.

ClawHub beceri sayfaları, kurulumdan önce en son güvenlik taraması durumunu
VirusTotal, ClawScan ve statik analiz için tarayıcı ayrıntı sayfalarıyla
birlikte gösterir. `openclaw skills install <slug>` yalnızca kurulum yolu
olarak kalır; yayıncılar yanlış pozitifleri ClawHub panosu veya
`clawhub skill rescan <slug>` üzerinden düzeltir.

## Güvenlik

<Warning>
Üçüncü taraf becerileri **güvenilmeyen kod** olarak değerlendirin. Etkinleştirmeden
önce okuyun. Güvenilmeyen girdiler ve riskli araçlar için sandbox içinde
çalıştırmayı tercih edin. Ajan tarafı denetimler için
[Sandboxing](/tr/gateway/sandboxing) bölümüne bakın.
</Warning>

- Çalışma alanı ve ek dizin beceri keşfi, yalnızca çözümlenen gerçek yolu yapılandırılmış kökün içinde kalan beceri köklerini ve `SKILL.md` dosyalarını kabul eder.
- Gateway destekli beceri bağımlılığı kurulumları (`skills.install`, onboarding ve Skills ayarları UI), kurulum metaverilerini yürütmeden önce yerleşik tehlikeli kod tarayıcısını çalıştırır. Çağıran açıkça tehlikeli geçersiz kılmayı ayarlamadıkça `critical` bulgular varsayılan olarak engeller; şüpheli bulgular ise yine yalnızca uyarır.
- `openclaw skills install <slug>` farklıdır — çalışma alanına bir ClawHub beceri klasörü indirir ve yukarıdaki kurulum metaverisi yolunu kullanmaz.
- `skills.entries.*.env` ve `skills.entries.*.apiKey`, o ajan turu için gizli değerleri **host** sürecine enjekte eder (sandbox içine değil). Gizli değerleri istemlerden ve günlüklerden uzak tutun.

Daha geniş bir tehdit modeli ve kontrol listeleri için [Güvenlik](/tr/gateway/security) bölümüne bakın.

## SKILL.md biçimi

`SKILL.md` en az şunları içermelidir:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw, düzen/amaç için AgentSkills belirtimini izler. Gömülü ajan
tarafından kullanılan ayrıştırıcı yalnızca **tek satırlık** frontmatter
anahtarlarını destekler; `metadata` bir **tek satırlık JSON nesnesi**
olmalıdır. Talimatlarda beceri klasörü yoluna başvurmak için `{baseDir}`
kullanın.

### İsteğe bağlı frontmatter anahtarları

<ParamField path="homepage" type="string">
  macOS Skills UI içinde "Web sitesi" olarak gösterilen URL. `metadata.openclaw.homepage` üzerinden de desteklenir.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  `true` olduğunda beceri, kullanıcı slash komutu olarak sunulur.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` olduğunda beceri, model isteminden çıkarılır (kullanıcı çağrısıyla yine kullanılabilir).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  `tool` olarak ayarlandığında slash komutu modeli atlar ve doğrudan bir araca gönderilir.
</ParamField>
<ParamField path="command-tool" type="string">
  `command-dispatch: tool` ayarlandığında çağrılacak araç adı.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Araç gönderimi için ham argüman dizesini araca iletir (çekirdek ayrıştırma yok). Araç `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` ile çağrılır.
</ParamField>

## Kapılama (yükleme zamanı filtreleri)

OpenClaw, `metadata` (tek satırlık JSON) kullanarak becerileri yükleme
zamanında filtreler:

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
  `true` olduğunda beceriyi her zaman dahil et (diğer kapıları atla).
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills UI tarafından kullanılan isteğe bağlı emoji.
</ParamField>
<ParamField path="homepage" type="string">
  macOS Skills UI içinde "Web sitesi" olarak gösterilen isteğe bağlı URL.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  İsteğe bağlı platform listesi. Ayarlanırsa beceri yalnızca bu işletim sistemlerinde uygundur.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Her biri `PATH` üzerinde bulunmalıdır.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  En az biri `PATH` üzerinde bulunmalıdır.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Ortam değişkeni bulunmalı veya yapılandırmada sağlanmalıdır.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Doğru değerli olması gereken `openclaw.json` yollarının listesi.
</ParamField>
<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` ile ilişkili ortam değişkeni adı.
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills UI tarafından kullanılan isteğe bağlı kurulum belirtimleri (brew/node/go/uv/download).
</ParamField>

`metadata.openclaw` yoksa beceri her zaman uygundur (yapılandırmada devre dışı
bırakılmadıkça veya paketle gelen beceriler için `skills.allowBundled`
tarafından engellenmedikçe).

<Note>
Eski `metadata.clawdbot` blokları, `metadata.openclaw` yokken hâlâ kabul edilir;
böylece daha eski kurulu beceriler bağımlılık kapılarını ve kurulum ipuçlarını
korur. Yeni ve güncellenmiş beceriler `metadata.openclaw` kullanmalıdır.
</Note>

### Sandboxing notları

- `requires.bins`, beceri yükleme zamanında **host** üzerinde denetlenir.
- Bir ajan sandbox içindese, ikili dosya **konteynerin içinde** de bulunmalıdır. Bunu `agents.defaults.sandbox.docker.setupCommand` (veya özel bir imaj) ile kurun. `setupCommand`, konteyner oluşturulduktan sonra bir kez çalışır. Paket kurulumları ayrıca ağ çıkışı, yazılabilir kök FS ve sandbox içinde root kullanıcı gerektirir.
- Örnek: `summarize` becerisi (`skills/summarize/SKILL.md`), orada çalışmak için sandbox konteynerinde `summarize` CLI aracına ihtiyaç duyar.

### Kurulum belirtimleri

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
    - Birden fazla yükleyici listelenirse gateway tek bir tercih edilen seçenek seçer (varsa brew, aksi halde node).
    - Tüm yükleyiciler `download` ise OpenClaw, mevcut artifaktları görebilmeniz için her girdiyi listeler.
    - Yükleyici tanımları, seçenekleri platforma göre filtrelemek için `os: ["darwin"|"linux"|"win32"]` içerebilir.
    - Node kurulumları, `openclaw.json` içindeki `skills.install.nodeManager` ayarına uyar (varsayılan: npm; seçenekler: npm/pnpm/yarn/bun). Bu yalnızca skill kurulumlarını etkiler; Gateway çalışma zamanı yine Node olmalıdır — Bun, WhatsApp/Telegram için önerilmez.
    - Gateway destekli yükleyici seçimi tercih odaklıdır: kurulum tanımları türleri karıştırdığında OpenClaw, `skills.install.preferBrew` etkinse ve `brew` varsa önce Homebrew'i, sonra `uv`'yi, sonra yapılandırılan node yöneticisini, ardından `go` veya `download` gibi diğer yedekleri tercih eder.
    - Her kurulum tanımı `download` ise OpenClaw, tek bir tercih edilen yükleyiciye indirgemek yerine tüm indirme seçeneklerini gösterir.

  </Accordion>
  <Accordion title="Yükleyici başına ayrıntılar">
    - **Go kurulumları:** `go` eksikse ve `brew` kullanılabiliyorsa gateway önce Homebrew üzerinden Go kurar ve mümkün olduğunda `GOBIN` değerini Homebrew'in `bin` dizinine ayarlar.
    - **İndirme kurulumları:** `url` (zorunlu), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (varsayılan: arşiv algılandığında otomatik), `stripComponents`, `targetDir` (varsayılan: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Yapılandırma geçersiz kılmaları

Paketle gelen ve yönetilen skills, `~/.openclaw/openclaw.json` içindeki
`skills.entries` altında açılıp kapatılabilir ve env değerleriyle beslenebilir:

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
  `false`, paketle gelmiş veya kurulmuş olsa bile skill'i devre dışı bırakır.
  Paketle gelen `coding-agent` skill'i isteğe bağlıdır: agent'lara sunmadan önce
  `skills.entries.coding-agent.enabled: true` ayarını yapın,
  ardından `claude`, `codex`, `opencode` veya `pi` içinden birinin kurulu olduğundan ve
  kendi CLI'ı için kimliğinin doğrulandığından emin olun.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` bildiren skills için kolaylık sağlar. Düz metni veya SecretRef'i destekler.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Yalnızca değişken süreçte zaten ayarlı değilse enjekte edilir.
</ParamField>
<ParamField path="config" type="object">
  Özel skill başına alanlar için isteğe bağlı torba. Özel anahtarlar burada bulunmalıdır.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Yalnızca **paketle gelen** skills için isteğe bağlı izin listesi. Ayarlanırsa yalnızca listedeki paketle gelen skills uygun olur (yönetilen/çalışma alanı skills etkilenmez).
</ParamField>

Skill adı kısa çizgiler içeriyorsa anahtarı tırnak içine alın (JSON5 tırnaklı
anahtarlara izin verir). Yapılandırma anahtarları varsayılan olarak **skill adı** ile eşleşir — bir skill
`metadata.openclaw.skillKey` tanımlıyorsa `skills.entries` altında bu anahtarı kullanın.

<Note>
OpenClaw içinde stok görsel oluşturma/düzenleme için paketle gelen bir skill yerine
`agents.defaults.imageGenerationModel` ile çekirdek
`image_generate` aracını kullanın. Buradaki skill örnekleri özel veya üçüncü taraf
iş akışları içindir. Yerel görsel analizi için
`agents.defaults.imageModel` ile `image` aracını kullanın. `openai/*`, `google/*`,
`fal/*` veya sağlayıcıya özgü başka bir görsel modeli seçerseniz o sağlayıcının
kimlik doğrulama/API anahtarını da ekleyin.
</Note>

## Ortam enjeksiyonu

Bir agent çalıştırması başladığında OpenClaw:

1. Skill metadata'sını okur.
2. `skills.entries.<key>.env` ve `skills.entries.<key>.apiKey` değerlerini `process.env` üzerine uygular.
3. Sistem istemini **uygun** skills ile oluşturur.
4. Çalıştırma sona erdikten sonra özgün ortamı geri yükler.

Ortam enjeksiyonu genel bir shell ortamı değil, **agent çalıştırmasıyla sınırlıdır**.

Paketle gelen `claude-cli` arka ucu için OpenClaw aynı uygun anlık görüntüyü
geçici bir Claude Code plugin'i olarak da somutlaştırır ve
`--plugin-dir` ile geçirir. Claude Code daha sonra kendi yerel skill çözücüsünü kullanabilir;
OpenClaw ise önceliği, agent başına izin listelerini, kapılamayı ve
`skills.entries.*` env/API anahtarı enjeksiyonunu yönetmeye devam eder. Diğer CLI arka uçları yalnızca
istem kataloğunu kullanır.

## Anlık görüntüler ve yenileme

OpenClaw, uygun skills için **bir oturum başladığında** anlık görüntü alır ve
aynı oturumdaki sonraki turlarda bu listeyi yeniden kullanır. Skills veya yapılandırmadaki değişiklikler
bir sonraki yeni oturumda etkili olur.

Skills oturum ortasında iki durumda yenilenebilir:

- Skills watcher etkindir.
- Yeni bir uygun uzak node görünür.

Bunu bir **hot reload** olarak düşünün: yenilenen liste bir sonraki
agent turunda alınır. Bu oturum için geçerli agent skill izin listesi değişirse
OpenClaw anlık görüntüyü yeniler, böylece görünür skills mevcut agent ile uyumlu kalır.

### Skills watcher

Varsayılan olarak OpenClaw skill klasörlerini izler ve `SKILL.md` dosyaları
değiştiğinde skills anlık görüntüsünü artırır. `skills.load` altında yapılandırın:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

### Uzak macOS node'ları (Linux gateway)

Gateway Linux üzerinde çalışıyor ancak `system.run` izni verilmiş bir **macOS node'u**
bağlıysa (Exec onayları güvenliği `deny` olarak ayarlanmamışsa),
OpenClaw, gerekli ikili dosyalar o node üzerinde mevcut olduğunda yalnızca macOS skills'i uygun kabul edebilir.
Agent bu skills'i `host=node` ile `exec` aracı üzerinden çalıştırmalıdır.

Bu, node'un komut desteğini raporlamasına ve `system.which` veya `system.run`
üzerinden yapılan bir bin probe'a dayanır. Çevrimdışı node'lar **uzaklara özel** skills'i
görünür yapmaz. Bağlı bir node bin probe'larına yanıt vermeyi bırakırsa
OpenClaw, önbelleğe alınmış bin eşleşmelerini temizler; böylece agent'lar şu anda orada
çalışamayan skills'i artık görmez.

## Token etkisi

Skills uygun olduğunda OpenClaw, mevcut skills'in kompakt bir XML listesini
sistem istemine enjekte eder (`pi-coding-agent` içindeki `formatSkillsForPrompt`
üzerinden). Maliyet deterministiktir:

- **Temel ek yük** (yalnızca ≥1 skill olduğunda): 195 karakter.
- **Skill başına:** 97 karakter + XML kaçışlı `<name>`, `<description>` ve `<location>` değerlerinin uzunluğu.

Formül (karakterler):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML kaçışlama `& < > " '` karakterlerini varlıklara (`&amp;`, `&lt;` vb.)
genişleterek uzunluğu artırır. Token sayıları model tokenizer'ına göre değişir. Kabaca
OpenAI tarzı bir tahmin ~4 karakter/token olduğundan **97 karakter ≈ 24 token** eder;
buna skill başına gerçek alan uzunluklarınız eklenir.

## Yönetilen skills yaşam döngüsü

OpenClaw, kurulumla (npm paketi veya OpenClaw.app) birlikte temel bir skills kümesini
**paketle gelen skills** olarak gönderir. `~/.openclaw/skills`, yerel geçersiz kılmalar için vardır —
örneğin paketle gelen kopyayı değiştirmeden bir skill'i sabitlemek veya yamamak için.
Çalışma alanı skills kullanıcıya aittir ve ad çakışmalarında ikisinin de üzerine yazar.

## Daha fazla skill mi arıyorsunuz?

[https://clawhub.ai](https://clawhub.ai) adresine göz atın. Tam yapılandırma
şeması: [Skills yapılandırması](/tr/tools/skills-config).

## İlgili

- [ClawHub](/tr/tools/clawhub) — herkese açık skills kayıt defteri
- [Skill oluşturma](/tr/tools/creating-skills) — özel skills oluşturma
- [Plugins](/tr/tools/plugin) — plugin sistemi genel bakışı
- [Skill Workshop plugin](/tr/plugins/skill-workshop) — agent çalışmasından skills üretin
- [Skills yapılandırması](/tr/tools/skills-config) — skill yapılandırması başvurusu
- [Slash komutları](/tr/tools/slash-commands) — mevcut tüm slash komutları
