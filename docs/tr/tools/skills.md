---
read_when:
    - Skills ekleme veya değiştirme
    - Skill geçitlemesini veya yükleme kurallarını değiştirme
summary: 'Skills: yönetilen ve çalışma alanı, geçitleme kuralları ve config/env kablolaması'
title: Skills
x-i18n:
    generated_at: "2026-04-22T04:28:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2ff6a3a92bc3c1c3892620a00e2eb01c73364bc6388a3513943defa46e49749
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw, agent'e araçların nasıl kullanılacağını öğretmek için **[AgentSkills](https://agentskills.io) uyumlu** Skill klasörleri kullanır. Her Skill, YAML frontmatter ve yönergeler içeren bir `SKILL.md` dosyası barındıran bir dizindir. OpenClaw, **paketle gelen Skills** ile isteğe bağlı yerel geçersiz kılmaları yükler ve bunları yükleme zamanında ortama, config'e ve binary varlığına göre filtreler.

## Konumlar ve öncelik

OpenClaw Skills'i şu kaynaklardan yükler:

1. **Ek Skill klasörleri**: `skills.load.extraDirs` ile yapılandırılır
2. **Paketle gelen Skills**: kurulumla birlikte gelir (npm package veya OpenClaw.app)
3. **Yönetilen/yerel Skills**: `~/.openclaw/skills`
4. **Kişisel agent Skills**: `~/.agents/skills`
5. **Proje agent Skills**: `<workspace>/.agents/skills`
6. **Workspace Skills**: `<workspace>/skills`

Bir Skill adı çakışırsa öncelik sırası şöyledir:

`<workspace>/skills` (en yüksek) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketle gelen Skills → `skills.load.extraDirs` (en düşük)

## Agent başına ve paylaşılan Skills

**Çok agent'li** kurulumlarda her agent'in kendi workspace'i vardır. Bu şu anlama gelir:

- **Agent başına Skills**, yalnızca o agent için `<workspace>/skills` içinde bulunur.
- **Proje agent Skills**, `<workspace>/.agents/skills` içinde bulunur ve
  normal workspace `skills/` klasöründen önce o workspace'e uygulanır.
- **Kişisel agent Skills**, `~/.agents/skills` içinde bulunur ve
  o makinedeki workspace'ler arasında uygulanır.
- **Paylaşılan Skills**, `~/.openclaw/skills` içinde bulunur (yönetilen/yerel) ve
  aynı makinedeki **tüm agent'ler** tarafından görülebilir.
- **Paylaşılan klasörler**, birden çok agent tarafından kullanılan ortak bir Skills paketi istiyorsanız
  `skills.load.extraDirs` üzerinden de eklenebilir (en düşük
  öncelik).

Aynı Skill adı birden fazla yerde varsa olağan öncelik
uygulanır: workspace kazanır, sonra proje agent Skills, sonra kişisel agent Skills,
sonra yönetilen/yerel, sonra paketle gelen, sonra ek dizinler.

## Agent Skill allowlist'leri

Skill **konumu** ve Skill **görünürlüğü** ayrı denetimlerdir.

- Konum/öncelik, aynı adlı bir Skill'in hangi kopyasının kazanacağını belirler.
- Agent allowlist'leri, görünür Skill'lerden hangilerini bir agent'in gerçekten kullanabileceğini belirler.

Paylaşılan bir taban için `agents.defaults.skills` kullanın, sonra agent başına
`agents.list[].skills` ile geçersiz kılın:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // github, weather devralır
      { id: "docs", skills: ["docs-search"] }, // varsayılanların yerine geçer
      { id: "locked-down", skills: [] }, // hiç Skill yok
    ],
  },
}
```

Kurallar:

- Varsayılan olarak kısıtlanmamış Skills için `agents.defaults.skills` alanını atlayın.
- `agents.defaults.skills` devralmak için `agents.list[].skills` alanını atlayın.
- Skill olmaması için `agents.list[].skills: []` ayarlayın.
- Boş olmayan bir `agents.list[].skills` listesi o agent için son kümedir;
  varsayılanlarla birleştirilmez.

OpenClaw, etkili agent Skill kümesini istem oluşturma, Skill
slash-command keşfi, sandbox senkronizasyonu ve Skill anlık görüntüleri boyunca uygular.

## Plugin'ler + Skills

Plugin'ler `openclaw.plugin.json` içinde
`skills` dizinlerini listeleyerek kendi Skills'lerini gönderebilir
(yollar plugin köküne göredir). Plugin etkin olduğunda plugin Skills yüklenir. Bugün bu dizinler
`skills.load.extraDirs` ile aynı
düşük öncelikli yol içinde birleştirilir; dolayısıyla aynı adlı bir paketle gelen,
yönetilen, agent veya workspace Skill'i bunların üzerine yazar.
Bunları plugin'in config
girdisinde `metadata.openclaw.requires.config` ile geçitleyebilirsiniz. Keşif/config için [Plugins](/tr/tools/plugin) ve
bu Skills'in öğrettiği araç yüzeyi için [Tools](/tr/tools) bölümlerine bakın.

## Skill Workshop

İsteğe bağlı, deneysel Skill Workshop plugin'i, agent çalışması sırasında gözlemlenen yeniden kullanılabilir yordamlar üzerinden workspace
Skills oluşturabilir veya güncelleyebilir. Varsayılan olarak devre dışıdır ve
`plugins.entries.skill-workshop` üzerinden açıkça etkinleştirilmelidir.

Skill Workshop yalnızca `<workspace>/skills` içine yazar, üretilen içeriği tarar,
bekleyen onay veya otomatik güvenli yazımları destekler, güvensiz
önerileri karantinaya alır ve başarılı yazımlardan sonra Skill anlık görüntüsünü yeniler; böylece yeni
Skills bir Gateway yeniden başlatması olmadan kullanılabilir hâle gelebilir.

“Bir dahaki sefere GIF atfını doğrula” gibi düzeltmelerin veya
medya QA denetim listeleri gibi zor kazanılmış iş akışlarının kalıcı usule ilişkin
yönergelere dönüşmesini istediğinizde kullanın. Bekleyen onayla başlayın;
önerilerini inceledikten sonra yalnızca güvenilen workspace'lerde otomatik yazım kullanın. Tam kılavuz:
[Skill Workshop Plugin](/tr/plugins/skill-workshop).

## ClawHub (kurulum + senkronizasyon)

ClawHub, OpenClaw için herkese açık Skills kayıt defteridir. Göz atmak için
[https://clawhub.ai](https://clawhub.ai) adresini kullanın. Skill keşfetmek/kurmak/güncellemek için yerel `openclaw skills`
komutlarını veya
yayınlama/senkronizasyon iş akışlarına ihtiyaç duyduğunuzda ayrı `clawhub` CLI'yi kullanın.
Tam kılavuz: [ClawHub](/tr/tools/clawhub).

Yaygın akışlar:

- Workspace'inize bir Skill kurun:
  - `openclaw skills install <skill-slug>`
- Kurulu tüm Skills'i güncelleyin:
  - `openclaw skills update --all`
- Senkronize edin (tara + güncellemeleri yayımla):
  - `clawhub sync --all`

Yerel `openclaw skills install`, etkin workspace `skills/`
dizinine kurar. Ayrı `clawhub` CLI de
geçerli çalışma dizininiz altındaki `./skills` içine kurar (veya yapılandırılmış OpenClaw workspace'ine geri döner).
OpenClaw bunu bir sonraki oturumda `<workspace>/skills` olarak algılar.

## Güvenlik notları

- Üçüncü taraf Skills'i **güvenilmeyen kod** olarak değerlendirin. Etkinleştirmeden önce okuyun.
- Güvenilmeyen girdiler ve riskli araçlar için sandbox'lı çalıştırmaları tercih edin. Bkz. [Sandboxing](/tr/gateway/sandboxing).
- Workspace ve extra-dir Skill keşfi yalnızca çözülmüş realpath'i yapılandırılmış kök içinde kalan Skill köklerini ve `SKILL.md` dosyalarını kabul eder.
- Gateway destekli Skill bağımlılığı kurulumları (`skills.install`, onboarding ve Skills ayarları UI) kurulum meta verisini çalıştırmadan önce yerleşik tehlikeli kod tarayıcısını çalıştırır. `critical` bulgular, çağıran açıkça tehlikeli geçersiz kılmayı ayarlamadıkça varsayılan olarak engeller; şüpheli bulgular ise yalnızca uyarır.
- `openclaw skills install <slug>` farklıdır: bir ClawHub Skill klasörünü workspace'e indirir ve yukarıdaki kurulum-meta verisi yolunu kullanmaz.
- `skills.entries.*.env` ve `skills.entries.*.apiKey`, sırları **host** sürecine
  o agent turu için enjekte eder
  (sandbox'a değil). Sırları istemlerden ve günlüklerden uzak tutun.
- Daha geniş tehdit modeli ve denetim listeleri için [Security](/tr/gateway/security) bölümüne bakın.

## Biçim (AgentSkills + Pi uyumlu)

`SKILL.md` en azından şunları içermelidir:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Notlar:

- Düzen/amaç için AgentSkills spec'ini izliyoruz.
- Gömülü agent tarafından kullanılan ayrıştırıcı yalnızca **tek satırlık** frontmatter anahtarlarını destekler.
- `metadata`, **tek satırlık JSON nesnesi** olmalıdır.
- Skill klasörü yoluna başvurmak için yönergelerde `{baseDir}` kullanın.
- İsteğe bağlı frontmatter anahtarları:
  - `homepage` — macOS Skills UI içinde “Website” olarak gösterilen URL (`metadata.openclaw.homepage` üzerinden de desteklenir).
  - `user-invocable` — `true|false` (varsayılan: `true`). `true` olduğunda Skill kullanıcı slash command'i olarak açığa çıkar.
  - `disable-model-invocation` — `true|false` (varsayılan: `false`). `true` olduğunda Skill model isteminden hariç tutulur (yine de kullanıcı çağrımı yoluyla kullanılabilir).
  - `command-dispatch` — `tool` (isteğe bağlı). `tool` olarak ayarlandığında slash command modeli atlar ve doğrudan bir araca yönlendirir.
  - `command-tool` — `command-dispatch: tool` ayarlandığında çağrılacak araç adı.
  - `command-arg-mode` — `raw` (varsayılan). Araç yönlendirmesi için ham args dizesini araca iletir (çekirdek ayrıştırma yok).

    Araç şu parametrelerle çağrılır:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Geçitleme (yükleme zamanı filtreleri)

OpenClaw, `metadata` (tek satırlık JSON) kullanarak Skills'i **yükleme zamanında** filtreler:

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
- `os` — isteğe bağlı platform listesi (`darwin`, `linux`, `win32`). Ayarlanırsa Skill yalnızca bu işletim sistemlerinde uygun olur.
- `requires.bins` — liste; her biri `PATH` üzerinde bulunmalıdır.
- `requires.anyBins` — liste; en az biri `PATH` üzerinde bulunmalıdır.
- `requires.env` — liste; env değişkeni mevcut olmalı **veya** config içinde sağlanmalıdır.
- `requires.config` — doğru/truthy olması gereken `openclaw.json` yolları listesi.
- `primaryEnv` — `skills.entries.<name>.apiKey` ile ilişkilendirilen env değişken adı.
- `install` — macOS Skills UI tarafından kullanılan isteğe bağlı kurulum tanımları dizisi (brew/node/go/uv/download).

Sandboxing notu:

- `requires.bins`, yükleme zamanında **host** üzerinde denetlenir.
- Bir agent sandbox'lıysa binary'nin **container içinde** de bulunması gerekir.
  Bunu `agents.defaults.sandbox.docker.setupCommand` (veya özel bir görsel) ile kurun.
  `setupCommand`, container oluşturulduktan sonra bir kez çalışır.
  Package kurulumları ayrıca ağ çıkışı, yazılabilir bir kök dosya sistemi ve sandbox içinde root kullanıcı gerektirir.
  Örnek: `summarize` Skill'i (`skills/summarize/SKILL.md`), orada çalışması için sandbox container içinde `summarize` CLI'sine
  ihtiyaç duyar.

Kurulum örneği:

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

- Birden çok kurulum aracı listelenmişse gateway **tek** bir tercih edilen seçeneği seçer (mümkünse brew, aksi halde node).
- Tüm kurulum araçları `download` ise OpenClaw, kullanılabilir artifact'leri görebilmeniz için her girdiyi listeler.
- Kurulum tanımları seçenekleri platforma göre filtrelemek için `os: ["darwin"|"linux"|"win32"]` içerebilir.
- Node kurulumları `openclaw.json` içindeki `skills.install.nodeManager` değerine uyar (varsayılan: npm; seçenekler: npm/pnpm/yarn/bun).
  Bu yalnızca **Skill kurulumlarını** etkiler; Gateway çalışma zamanı yine de Node
  olmalıdır
  (Bun, WhatsApp/Telegram için önerilmez).
- Gateway destekli kurulum aracı seçimi yalnızca node odaklı değil, tercih odaklıdır:
  kurulum tanımları farklı türleri karıştırdığında OpenClaw,
  `skills.install.preferBrew` etkinse ve `brew` mevcutsa Homebrew'ü, sonra `uv`, sonra
  yapılandırılmış node manager'ı, sonra `go` veya `download` gibi diğer geri dönüşleri tercih eder.
- Her kurulum tanımı `download` ise OpenClaw bunları tek bir tercih edilen kurulum aracına daraltmak yerine
  tüm indirme seçeneklerini gösterir.
- Go kurulumları: `go` eksikse ve `brew` mevcutsa gateway önce Go'yu Homebrew ile kurar ve mümkün olduğunda `GOBIN` değerini Homebrew'ün `bin` dizinine ayarlar.
- Download kurulumları: `url` (gerekli), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (varsayılan: arşiv algılandığında otomatik), `stripComponents`, `targetDir` (varsayılan: `~/.openclaw/tools/<skillKey>`).

`metadata.openclaw` yoksa Skill her zaman uygundur
(`config` içinde devre dışı bırakılmadığı veya paketle gelen Skills için `skills.allowBundled` tarafından engellenmediği sürece).

## Config geçersiz kılmaları (`~/.openclaw/openclaw.json`)

Paketle gelen/yönetilen Skills açılıp kapatılabilir ve env değerleri sağlanabilir:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // veya düz metin dize
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

Görsel üretme/düzenlemeyi OpenClaw içinde stok olarak istiyorsanız, paketle gelen bir
Skill yerine `agents.defaults.imageGenerationModel` ile çekirdek
`image_generate` aracını kullanın. Buradaki Skill örnekleri özel veya üçüncü taraf iş akışları içindir.

Yerel görsel analizi için `agents.defaults.imageModel` ile `image` aracını kullanın.
Yerel görsel üretimi/düzenleme için `agents.defaults.imageGenerationModel` ile
`image_generate` kullanın. `openai/*`, `google/*`,
`fal/*` veya sağlayıcıya özgü başka bir görsel model seçerseniz o sağlayıcının auth/API
anahtarını da ekleyin.

Config anahtarları varsayılan olarak **Skill adıyla** eşleşir. Bir Skill
`metadata.openclaw.skillKey` tanımlıyorsa `skills.entries` altında
o anahtarı kullanın.

Kurallar:

- `enabled: false`, paketle gelmiş/kurulmuş olsa bile Skill'i devre dışı bırakır.
- `env`: değişken süreçte zaten ayarlı değilse **yalnızca o zaman** enjekte edilir.
- `apiKey`: `metadata.openclaw.primaryEnv` bildiren Skills için kolaylıktır.
  Düz metin dizeyi veya SecretRef nesnesini destekler (`{ source, provider, id }`).
- `config`: özel Skill başına alanlar için isteğe bağlı çanta; özel anahtarlar burada yaşamalıdır.
- `allowBundled`: yalnızca **paketle gelen** Skills için isteğe bağlı allowlist. Ayarlanırsa yalnızca
  listedeki paketle gelen Skills uygundur (yönetilen/workspace Skills etkilenmez).

## Ortam enjeksiyonu (agent çalıştırması başına)

Bir agent çalıştırması başladığında OpenClaw:

1. Skill meta verisini okur.
2. Herhangi bir `skills.entries.<key>.env` veya `skills.entries.<key>.apiKey` değerini
   `process.env` içine uygular.
3. Sistem istemini **uygun** Skills ile oluşturur.
4. Çalıştırma bitince özgün ortamı geri yükler.

Bu, genel bir shell ortamı değil, **agent çalıştırmasına kapsamlıdır**.

Paketle gelen `claude-cli` backend için OpenClaw ayrıca aynı
uygun anlık görüntüyü geçici bir Claude Code plugin'i olarak somutlaştırır ve bunu
`--plugin-dir` ile geçirir. Claude Code daha sonra yerel Skill çözücüsünü kullanabilir; OpenClaw ise
öncelik, agent başına allowlist'ler, geçitleme ve
`skills.entries.*` env/API anahtarı enjeksiyonunun sahibi olmaya devam eder. Diğer CLI backend'ler yalnızca istem
kataloğunu kullanır.

## Oturum anlık görüntüsü (performans)

OpenClaw, uygun Skills'i **bir oturum başladığında** anlık görüntü olarak alır ve aynı oturumdaki sonraki turlar için bu listeyi yeniden kullanır. Skills veya config değişiklikleri bir sonraki yeni oturumda etkili olur.

Skills ayrıca Skills izleyicisi etkin olduğunda veya yeni bir uygun uzak node göründüğünde oturum ortasında da yenilenebilir (aşağıya bakın). Bunu bir **hot reload** olarak düşünün: yenilenmiş liste bir sonraki agent turunda alınır.

Etkili agent Skill allowlist'i o oturum için değişirse OpenClaw,
görünür Skills'in mevcut agent ile hizalı kalması için anlık görüntüyü yeniler.

## Uzak macOS node'ları (Linux gateway)

Gateway Linux üzerinde çalışıyorsa ancak **macOS node** bağlıysa **ve `system.run` izni varsa** (Exec onayları güvenliği `deny` olarak ayarlanmamışsa), OpenClaw gerekli binary'ler o node üzerinde mevcut olduğunda yalnızca macOS'e özgü Skills'i uygun kabul edebilir. Agent bu Skills'i `exec` aracı üzerinden `host=node` ile çalıştırmalıdır.

Bu, node'un komut desteğini bildirmesine ve `system.run` üzerinden bir bin yoklamasına dayanır. macOS node daha sonra çevrimdışı olursa Skills görünür kalır; node yeniden bağlanana kadar çağrımlar başarısız olabilir.

## Skills izleyicisi (otomatik yenileme)

Varsayılan olarak OpenClaw Skill klasörlerini izler ve `SKILL.md` dosyaları değiştiğinde Skills anlık görüntüsünü yükseltir. Bunu `skills.load` altında yapılandırın:

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

Skills uygunsa OpenClaw, kullanılabilir Skills'in kompakt bir XML listesini sistem istemine enjekte eder (`pi-coding-agent` içindeki `formatSkillsForPrompt` üzerinden). Maliyet deterministiktir:

- **Temel ek yük (yalnızca ≥1 Skill olduğunda):** 195 karakter.
- **Skill başına:** 97 karakter + XML-escape edilmiş `<name>`, `<description>` ve `<location>` değerlerinin uzunluğu.

Formül (karakterler):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Notlar:

- XML escape işlemi `& < > " '` karakterlerini varlıklara (`&amp;`, `&lt;` vb.) genişletir ve uzunluğu artırır.
- Token sayıları model tokenizer'ına göre değişir. Kaba bir OpenAI tarzı tahmin ~4 karakter/token'dır; dolayısıyla **97 karakter ≈ 24 token** eder; buna gerçek alan uzunluklarınız da eklenir.

## Yönetilen Skills yaşam döngüsü

OpenClaw, kurulumun bir parçası olarak
paketle gelen Skills biçiminde temel bir Skills kümesiyle gelir (npm package veya OpenClaw.app). `~/.openclaw/skills`, yerel
geçersiz kılmalar için vardır
(örneğin paketle gelen kopyayı değiştirmeden bir Skill'i sabitlemek/yamalamak). Workspace Skills kullanıcıya aittir ve ad çakışmalarında her ikisini de geçersiz kılar.

## Config referansı

Tam yapılandırma şeması için [Skills config](/tr/tools/skills-config) bölümüne bakın.

## Daha fazla Skill mi arıyorsunuz?

[https://clawhub.ai](https://clawhub.ai) adresine göz atın.

---

## İlgili

- [Skills Oluşturma](/tr/tools/creating-skills) — özel Skills oluşturma
- [Skills Config](/tr/tools/skills-config) — Skill yapılandırma referansı
- [Slash Commands](/tr/tools/slash-commands) — tüm kullanılabilir slash command'ler
- [Plugins](/tr/tools/plugin) — plugin sistemi genel bakışı
