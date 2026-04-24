---
read_when:
    - Skills ekleme veya değiştirme
    - Skill geçitleme veya yükleme kurallarını değiştirme
summary: 'Skills: yönetilen ve çalışma alanı, geçitleme kuralları ve yapılandırma/env kablolaması'
title: Skills
x-i18n:
    generated_at: "2026-04-24T09:36:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c7db23e1eb818d62283376cb33353882a9cb30e4476c5775218137da2ba82d9
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw, ajana araçları nasıl kullanacağını öğretmek için **[AgentSkills](https://agentskills.io) uyumlu** Skill klasörleri kullanır. Her Skill, YAML frontmatter ve yönergeler içeren bir `SKILL.md` barındıran bir dizindir. OpenClaw, **paketlenmiş Skills** ile isteğe bağlı yerel geçersiz kılmaları yükler ve bunları yükleme zamanında ortam, yapılandırma ve ikili dosya varlığına göre filtreler.

## Konumlar ve öncelik

OpenClaw Skills'i şu kaynaklardan yükler:

1. **Ek Skill klasörleri**: `skills.load.extraDirs` ile yapılandırılır
2. **Paketlenmiş Skills**: kurulumla birlikte gelir (npm paketi veya OpenClaw.app)
3. **Yönetilen/yerel Skills**: `~/.openclaw/skills`
4. **Kişisel ajan Skills**: `~/.agents/skills`
5. **Proje ajan Skills**: `<workspace>/.agents/skills`
6. **Çalışma alanı Skills**: `<workspace>/skills`

Bir Skill adı çakışırsa öncelik sırası şöyledir:

`<workspace>/skills` (en yüksek) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş Skills → `skills.load.extraDirs` (en düşük)

## Ajan başına ve paylaşılan Skills

**Çok ajanlı** kurulumlarda her ajanın kendi çalışma alanı vardır. Bu şu anlama gelir:

- **Ajan başına Skills**, yalnızca o ajan için `<workspace>/skills` içinde bulunur.
- **Proje ajan Skills**, `<workspace>/.agents/skills` içinde bulunur ve
  normal çalışma alanı `skills/` klasöründen önce o çalışma alanına uygulanır.
- **Kişisel ajan Skills**, `~/.agents/skills` içinde bulunur ve
  o makinedeki çalışma alanları genelinde uygulanır.
- **Paylaşılan Skills**, `~/.openclaw/skills` içinde bulunur (yönetilen/yerel) ve
  aynı makinedeki **tüm ajanlar** tarafından görülebilir.
- **Paylaşılan klasörler**, birden çok ajan tarafından kullanılan ortak bir Skills paketi istiyorsanız
  `skills.load.extraDirs` aracılığıyla da eklenebilir (en düşük öncelik).

Aynı Skill adı birden fazla yerde varsa normal öncelik uygulanır:
çalışma alanı kazanır, sonra proje ajan Skills, sonra kişisel ajan Skills,
sonra yönetilen/yerel, sonra paketlenmiş, sonra ek dizinler.

## Ajan Skill allowlist'leri

Skill **konumu** ile Skill **görünürlüğü** ayrı denetimlerdir.

- Konum/öncelik, aynı adlı Skill'in hangi kopyasının kazanacağını belirler.
- Ajan allowlist'leri, görünür Skills içinden bir ajanın gerçekte hangilerini kullanabileceğini belirler.

Önce paylaşılan bir temel için `agents.defaults.skills` kullanın, ardından ajan başına
`agents.list[].skills` ile geçersiz kılın:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // github, weather devralır
      { id: "docs", skills: ["docs-search"] }, // varsayılanların yerini alır
      { id: "locked-down", skills: [] }, // skill yok
    ],
  },
}
```

Kurallar:

- Varsayılan olarak sınırsız Skills için `agents.defaults.skills` alanını atlayın.
- `agents.defaults.skills` devralmak için `agents.list[].skills` alanını atlayın.
- Skill olmaması için `agents.list[].skills: []` ayarlayın.
- Boş olmayan bir `agents.list[].skills` listesi o ajan için son kümedir;
  varsayılanlarla birleşmez.

OpenClaw, etkili ajan Skill kümesini istem oluşturma, Skill
slash-command keşfi, sandbox senkronizasyonu ve Skill snapshot'ları boyunca uygular.

## Plugin'ler + Skills

Plugin'ler, `openclaw.plugin.json` içinde
Plugin köküne göreli `skills` dizinlerini listeleyerek kendi Skills'lerini gönderebilir.
Plugin Skills, Plugin etkin olduğunda yüklenir. Bugün bu dizinler
`skills.load.extraDirs` ile aynı düşük öncelikli yolda birleştirilir; bu nedenle aynı ada sahip bir paketlenmiş,
yönetilen, ajan veya çalışma alanı Skill'i onları geçersiz kılar.
Bunları Plugin'in yapılandırma
girdisindeki `metadata.openclaw.requires.config` ile geçitleyebilirsiniz.
Keşif/yapılandırma için [Plugins](/tr/tools/plugin) ve bu Skills'in öğrettiği
araç yüzeyi için [Tools](/tr/tools) bölümüne bakın.

## Skill Workshop

İsteğe bağlı, deneysel Skill Workshop Plugin'i, ajan çalışması sırasında gözlemlenen yeniden kullanılabilir prosedürlerden çalışma alanı
Skills'i oluşturabilir veya güncelleyebilir. Varsayılan olarak devre dışıdır ve
`plugins.entries.skill-workshop` üzerinden açıkça etkinleştirilmelidir.

Skill Workshop yalnızca `<workspace>/skills` içine yazar, oluşturulan içeriği tarar,
bekleyen onay veya otomatik güvenli yazmaları destekler, güvensiz
önerileri karantinaya alır ve başarılı yazmalardan sonra Skill snapshot'ını yeniler; böylece yeni
Skills, Gateway yeniden başlatılmadan kullanılabilir hale gelebilir.

“Bir dahaki sefere GIF atfını doğrula” gibi düzeltmelerin veya
medya QA kontrol listeleri gibi zorlukla edinilmiş iş akışlarının kalıcı prosedürel
yönergelere dönüşmesini istediğinizde bunu kullanın. Bekleyen onayla başlayın; otomatik yazmaları yalnızca
önerilerini gözden geçirdikten sonra güvenilir çalışma alanlarında kullanın. Tam kılavuz:
[Skill Workshop Plugin](/tr/plugins/skill-workshop).

## ClawHub (kurulum + senkronizasyon)

ClawHub, OpenClaw için herkese açık Skills kayıt defteridir. Göz atmak için
[https://clawhub.ai](https://clawhub.ai) adresine gidin. Skills'i keşfetmek/kurmak/güncellemek için yerel `openclaw skills`
komutlarını veya yayımlama/senkronizasyon iş akışlarına ihtiyaç duyduğunuzda ayrı `clawhub` CLI'yi kullanın.
Tam kılavuz: [ClawHub](/tr/tools/clawhub).

Yaygın akışlar:

- Çalışma alanınıza bir Skill kurun:
  - `openclaw skills install <skill-slug>`
- Kurulu tüm Skills'i güncelleyin:
  - `openclaw skills update --all`
- Senkronize edin (tara + güncellemeleri yayımla):
  - `clawhub sync --all`

Yerel `openclaw skills install`, etkin çalışma alanı `skills/`
dizinine kurar. Ayrı `clawhub` CLI de geçerli çalışma dizininiz altında `./skills` içine kurar
(veya yapılandırılmış OpenClaw çalışma alanına fallback yapar).
OpenClaw bunu sonraki oturumda `<workspace>/skills` olarak algılar.

## Güvenlik notları

- Üçüncü taraf Skills'i **güvenilmeyen kod** olarak değerlendirin. Etkinleştirmeden önce okuyun.
- Güvenilmeyen girdiler ve riskli araçlar için sandbox'lı çalıştırmaları tercih edin. Bkz. [Sandboxing](/tr/gateway/sandboxing).
- Çalışma alanı ve ek dizin Skill keşfi yalnızca, çözümlenmiş realpath'i yapılandırılmış kökün içinde kalan Skill köklerini ve `SKILL.md` dosyalarını kabul eder.
- Gateway destekli Skill bağımlılık kurulumları (`skills.install`, onboarding ve Skills ayarları UI),
  yükleyici meta verilerini yürütmeden önce yerleşik tehlikeli kod tarayıcısını çalıştırır. `critical` bulgular,
  çağıran açıkça tehlikeli geçersiz kılmayı ayarlamadıkça varsayılan olarak engellenir; şüpheli bulgular ise yalnızca uyarı verir.
- `openclaw skills install <slug>` farklıdır: bir ClawHub Skill klasörünü çalışma alanına indirir ve yukarıdaki yükleyici-meta veri yolunu kullanmaz.
- `skills.entries.*.env` ve `skills.entries.*.apiKey`, gizli bilgileri **host** sürecine
  o ajan dönüşü için enjekte eder (sandbox'a değil). Gizli bilgileri istemlerden ve günlüklerden uzak tutun.
- Daha geniş bir tehdit modeli ve kontrol listeleri için bkz. [Security](/tr/gateway/security).

## Biçim (AgentSkills + Pi-compatible)

`SKILL.md` en azından şunu içermelidir:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Notlar:

- Düzen/amaç için AgentSkills spec'ini izleriz.
- Gömülü ajan tarafından kullanılan ayrıştırıcı yalnızca **tek satırlı** frontmatter anahtarlarını destekler.
- `metadata`, **tek satırlı JSON nesnesi** olmalıdır.
- Skill klasörü yoluna başvurmak için yönergelerde `{baseDir}` kullanın.
- İsteğe bağlı frontmatter anahtarları:
  - `homepage` — macOS Skills UI içinde “Website” olarak gösterilen URL (`metadata.openclaw.homepage` üzerinden de desteklenir).
  - `user-invocable` — `true|false` (varsayılan: `true`). `true` olduğunda Skill kullanıcı slash command'i olarak sunulur.
  - `disable-model-invocation` — `true|false` (varsayılan: `false`). `true` olduğunda Skill model isteminden çıkarılır (yine de kullanıcı çağrımıyla kullanılabilir).
  - `command-dispatch` — `tool` (isteğe bağlı). `tool` olarak ayarlandığında slash command modeli atlar ve doğrudan bir araca yönlendirir.
  - `command-tool` — `command-dispatch: tool` ayarlandığında çağrılacak araç adı.
  - `command-arg-mode` — `raw` (varsayılan). Araç yönlendirmesi için ham args dizgesini araca iletir (çekirdek ayrıştırma yok).

    Araç şu parametrelerle çağrılır:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Geçitleme (yükleme zamanı filtreleri)

OpenClaw, yükleme zamanında `metadata` (tek satırlı JSON) kullanarak **Skills'i filtreler**:

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

- `always: true` — Skill'i her zaman dahil et (diğer geçitleri atla).
- `emoji` — macOS Skills UI tarafından kullanılan isteğe bağlı emoji.
- `homepage` — macOS Skills UI içinde “Website” olarak gösterilen isteğe bağlı URL.
- `os` — isteğe bağlı platform listesi (`darwin`, `linux`, `win32`). Ayarlanırsa Skill yalnızca bu işletim sistemlerinde uygundur.
- `requires.bins` — liste; her biri `PATH` üzerinde bulunmalıdır.
- `requires.anyBins` — liste; en az biri `PATH` üzerinde bulunmalıdır.
- `requires.env` — liste; env değişkeni mevcut olmalı **veya** yapılandırmada sağlanmış olmalıdır.
- `requires.config` — truthy olması gereken `openclaw.json` yollarının listesi.
- `primaryEnv` — `skills.entries.<name>.apiKey` ile ilişkili env değişken adı.
- `install` — macOS Skills UI tarafından kullanılan isteğe bağlı yükleyici spec dizisi (brew/node/go/uv/download).

Sandboxing hakkında not:

- `requires.bins`, Skill yükleme zamanında **host** üzerinde denetlenir.
- Bir ajan sandbox içindeyse ikili dosyanın **container içinde de** bulunması gerekir.
  Bunu `agents.defaults.sandbox.docker.setupCommand` (veya özel bir imaj) ile kurun.
  `setupCommand`, container oluşturulduktan sonra bir kez çalışır.
  Paket kurulumları ayrıca ağ çıkışı, yazılabilir bir kök FS ve sandbox içinde root kullanıcı gerektirir.
  Örnek: `summarize` Skill'i (`skills/summarize/SKILL.md`), orada çalışması için
  sandbox container içinde `summarize` CLI'ye ihtiyaç duyar.

Yükleyici örneği:

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

Notlar:

- Birden çok yükleyici listelenirse Gateway, **tek** tercih edilen seçeneği seçer (varsa brew, aksi halde node).
- Tüm yükleyiciler `download` ise OpenClaw, kullanılabilir yapıtları görebilmeniz için her girdiyi listeler.
- Yükleyici spec'leri seçenekleri platforma göre filtrelemek için `os: ["darwin"|"linux"|"win32"]` içerebilir.
- Node kurulumları, `openclaw.json` içindeki `skills.install.nodeManager` değerine uyar (varsayılan: npm; seçenekler: npm/pnpm/yarn/bun).
  Bu yalnızca **Skill kurulumlarını** etkiler; Gateway çalışma zamanı yine de Node
  olmalıdır (WhatsApp/Telegram için Bun önerilmez).
- Gateway destekli yükleyici seçimi yalnızca node odaklı değil, tercih odaklıdır:
  yükleme spec'leri türleri karıştırdığında OpenClaw, önce
  `skills.install.preferBrew` etkinse ve `brew` varsa Homebrew'ü, sonra `uv`yi, sonra
  yapılandırılmış node yöneticisini, ardından `go` veya `download` gibi diğer fallback'leri tercih eder.
- Her yükleme spec'i `download` ise OpenClaw, tek bir tercih edilen yükleyiciye daraltmak
  yerine tüm indirme seçeneklerini sunar.
- Go kurulumları: `go` eksikse ve `brew` varsa Gateway önce Homebrew üzerinden Go kurar ve mümkün olduğunda `GOBIN` değerini Homebrew'ün `bin` dizinine ayarlar.
- Download kurulumları: `url` (zorunlu), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (varsayılan: arşiv algılanırsa otomatik), `stripComponents`, `targetDir` (varsayılan: `~/.openclaw/tools/<skillKey>`).

`metadata.openclaw` yoksa Skill her zaman uygundur (
yapılandırmada devre dışı bırakılmadıkça veya paketlenmiş Skills için `skills.allowBundled` tarafından engellenmedikçe).

## Yapılandırma geçersiz kılmaları (`~/.openclaw/openclaw.json`)

Paketlenmiş/yönetilen Skills açılıp kapatılabilir ve env değerleri sağlanabilir:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // veya düz metin string
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

Not: Skill adı tire içeriyorsa anahtarı tırnak içine alın (JSON5 tırnaklı anahtarlara izin verir).

OpenClaw'ın kendi içinde stok görsel üretimi/düzenlemesi istiyorsanız, bir
paketlenmiş Skill yerine `agents.defaults.imageGenerationModel` ile çekirdek
`image_generate` aracını kullanın. Buradaki Skill örnekleri özel veya üçüncü taraf iş akışları içindir.

Yerel görsel analizi için `agents.defaults.imageModel` ile `image` aracını kullanın.
Yerel görsel üretimi/düzenlemesi için
`agents.defaults.imageGenerationModel` ile `image_generate` kullanın. `openai/*`, `google/*`,
`fal/*` veya sağlayıcıya özgü başka bir görsel model seçerseniz, o sağlayıcının auth/API
anahtarını da ekleyin.

Yapılandırma anahtarları varsayılan olarak **Skill adıyla** eşleşir. Bir Skill
`metadata.openclaw.skillKey` tanımlarsa `skills.entries` altında o anahtarı kullanın.

Kurallar:

- `enabled: false`, Skill paketlenmiş/kurulu olsa bile onu devre dışı bırakır.
- `env`: değişken süreçte zaten ayarlı değilse **yalnızca o zaman** enjekte edilir.
- `apiKey`: `metadata.openclaw.primaryEnv` bildiren Skills için kolaylık sağlar.
  Düz metin string veya SecretRef nesnesini destekler (`{ source, provider, id }`).
- `config`: özel Skill başına alanlar için isteğe bağlı kapsayıcı; özel anahtarlar burada yaşamalıdır.
- `allowBundled`: yalnızca **paketlenmiş** Skills için isteğe bağlı allowlist. Ayarlanırsa,
  yalnızca listedeki paketlenmiş Skills uygundur (yönetilen/çalışma alanı Skills etkilenmez).

## Ortam enjeksiyonu (ajan çalıştırması başına)

Bir ajan çalıştırması başladığında OpenClaw:

1. Skill meta verilerini okur.
2. `skills.entries.<key>.env` veya `skills.entries.<key>.apiKey` değerlerini
   `process.env` üzerine uygular.
3. Sistem istemini **uygun** Skills ile oluşturur.
4. Çalıştırma bittikten sonra özgün ortamı geri yükler.

Bu, genel bir kabuk ortamı değil, **ajan çalıştırmasına kapsamlıdır**.

Paketlenmiş `claude-cli` arka ucu için OpenClaw, aynı
uygun snapshot'ı geçici bir Claude Code Plugin'i olarak da somutlaştırır ve bunu
`--plugin-dir` ile geçirir. Böylece Claude Code yerel Skill çözümleyicisini kullanabilirken
öncelik, ajan başına allowlist'ler, geçitleme ve
`skills.entries.*` env/API key enjeksiyonu yine OpenClaw tarafından yönetilir. Diğer CLI arka uçları yalnızca istem
kataloğunu kullanır.

## Oturum snapshot'ı (performans)

OpenClaw, **oturum başladığında** uygun Skills'in snapshot'ını alır ve aynı oturumdaki sonraki dönüşlerde bu listeyi yeniden kullanır. Skills veya yapılandırmadaki değişiklikler bir sonraki yeni oturumda etkili olur.

Skills watcher etkin olduğunda veya yeni uygun bir uzak Node göründüğünde Skills oturum ortasında da yenilenebilir (aşağıya bakın). Bunu bir **hot reload** olarak düşünün: yenilenen liste bir sonraki ajan dönüşünde alınır.

Bu oturum için etkili ajan Skill allowlist'i değişirse OpenClaw,
görünür Skills'in geçerli ajanla uyumlu kalması için snapshot'ı yeniler.

## Uzak macOS Node'ları (Linux gateway)

Gateway Linux üzerinde çalışıyorsa ancak **bir macOS Node'u** bağlıysa **ve `system.run` izinliyse** (Exec approvals güvenliği `deny` olarak ayarlanmamışsa), OpenClaw gerekli ikili dosyalar o Node üzerinde bulunduğunda yalnızca macOS'e özel Skills'i uygun olarak değerlendirebilir. Ajan bu Skills'i `host=node` ile `exec` aracı üzerinden yürütmelidir.

Bu, Node'un komut desteğini bildirmesine ve `system.run` üzerinden bir bin probe'una dayanır. macOS Node daha sonra çevrimdışı olursa Skills görünür kalır; Node yeniden bağlanana kadar çağrılar başarısız olabilir.

## Skills watcher (otomatik yenileme)

Varsayılan olarak OpenClaw, Skill klasörlerini izler ve `SKILL.md` dosyaları değiştiğinde Skills snapshot'ını artırır. Bunu `skills.load` altında yapılandırın:

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

## Token etkisi (Skills listesi)

Skills uygun olduğunda OpenClaw, kullanılabilir Skills'in kompakt bir XML listesini sistem istemine enjekte eder (`pi-coding-agent` içindeki `formatSkillsForPrompt` aracılığıyla). Maliyet deterministiktir:

- **Temel ek yük (yalnızca ≥1 Skill olduğunda):** 195 karakter.
- **Skill başına:** 97 karakter + XML-escape edilmiş `<name>`, `<description>` ve `<location>` değerlerinin uzunluğu.

Formül (karakter):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Notlar:

- XML escaping, `& < > " '` karakterlerini varlıklara (`&amp;`, `&lt;` vb.) genişletir ve uzunluğu artırır.
- Token sayıları model tokenizer'ına göre değişir. Yaklaşık bir OpenAI tarzı tahmin ~4 karakter/token olduğundan **97 karakter ≈ 24 token** eder; buna gerçek alan uzunluklarınız eklenir.

## Yönetilen Skills yaşam döngüsü

OpenClaw, kurulumun bir parçası olarak **paketlenmiş Skills** şeklinde temel bir Skill kümesi gönderir
(npm paketi veya OpenClaw.app). `~/.openclaw/skills`, yerel
geçersiz kılmalar için vardır (örneğin paketlenmiş kopyayı değiştirmeden bir Skill'i
sabitlemek/yamalamak). Çalışma alanı Skills'i kullanıcıya aittir ve ad çakışmalarında ikisini de geçersiz kılar.

## Yapılandırma başvurusu

Tam yapılandırma şeması için bkz. [Skills config](/tr/tools/skills-config).

## Daha fazla Skill mi arıyorsunuz?

[https://clawhub.ai](https://clawhub.ai) adresine göz atın.

---

## İlgili

- [Skills oluşturma](/tr/tools/creating-skills) — özel Skills oluşturma
- [Skills Config](/tr/tools/skills-config) — Skill yapılandırma başvurusu
- [Slash Commands](/tr/tools/slash-commands) — tüm kullanılabilir slash command'ler
- [Plugins](/tr/tools/plugin) — Plugin sistemi genel bakış
