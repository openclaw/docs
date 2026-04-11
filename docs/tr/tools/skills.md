---
read_when:
    - Skills ekleme veya değiştirme
    - Skill geçitlemesini veya yükleme kurallarını değiştirme
summary: 'Skills: yönetilen ve çalışma alanı tabanlı, geçit kuralları ve yapılandırma/env bağlama'
title: Skills
x-i18n:
    generated_at: "2026-04-11T02:48:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: b1eaf130966950b6eb24f859d9a77ecbf81c6cb80deaaa6a3a79d2c16d83115d
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw, agent'a araçları nasıl kullanacağını öğretmek için **[AgentSkills](https://agentskills.io) uyumlu** skill klasörleri kullanır. Her skill, YAML frontmatter ve talimatlar içeren bir `SKILL.md` dosyasına sahip bir dizindir. OpenClaw, **bundled Skills** ile isteğe bağlı yerel geçersiz kılmaları yükler ve bunları yükleme sırasında ortam, yapılandırma ve ikili dosya varlığına göre filtreler.

## Konumlar ve öncelik

OpenClaw Skills'i şu kaynaklardan yükler:

1. **Ek skill klasörleri**: `skills.load.extraDirs` ile yapılandırılır
2. **Bundled Skills**: kurulumla birlikte gelir (npm paketi veya OpenClaw.app)
3. **Managed/yerel Skills**: `~/.openclaw/skills`
4. **Kişisel agent Skills**: `~/.agents/skills`
5. **Proje agent Skills**: `<workspace>/.agents/skills`
6. **Çalışma alanı Skills**: `<workspace>/skills`

Bir skill adı çakışırsa öncelik şöyledir:

`<workspace>/skills` (en yüksek) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled Skills → `skills.load.extraDirs` (en düşük)

## Agent başına ve paylaşılan Skills

**Çok agent'lı** kurulumlarda her agent'ın kendi çalışma alanı vardır. Bu şu anlama gelir:

- **Agent başına Skills**, yalnızca o agent için `<workspace>/skills` içinde bulunur.
- **Proje agent Skills**, `<workspace>/.agents/skills` içinde bulunur ve
  normal çalışma alanı `skills/` klasöründen önce o çalışma alanına uygulanır.
- **Kişisel agent Skills**, `~/.agents/skills` içinde bulunur ve
  o makinedeki çalışma alanları arasında uygulanır.
- **Paylaşılan Skills**, `~/.openclaw/skills` içinde bulunur (managed/yerel) ve
  aynı makinedeki **tüm agent'lar** tarafından görülebilir.
- **Paylaşılan klasörler**, birden fazla agent tarafından kullanılan ortak bir skill paketi istiyorsanız `skills.load.extraDirs` üzerinden de eklenebilir (en düşük
  öncelik).

Aynı skill adı birden fazla yerde varsa normal öncelik geçerlidir:
çalışma alanı kazanır, ardından proje agent Skills, ardından kişisel agent Skills,
ardından managed/yerel, ardından bundled, ardından ek dizinler gelir.

## Agent skill izin listeleri

Skill **konumu** ve skill **görünürlüğü** ayrı denetimlerdir.

- Konum/öncelik, aynı adlı skill'in hangi kopyasının kazanacağını belirler.
- Agent izin listeleri, bir agent'ın görünür Skills'den hangilerini gerçekten kullanabileceğini belirler.

Paylaşılan bir temel için `agents.defaults.skills` kullanın, sonra agent başına
`agents.list[].skills` ile geçersiz kılın:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // github, weather öğelerini devralır
      { id: "docs", skills: ["docs-search"] }, // varsayılanların yerini alır
      { id: "locked-down", skills: [] }, // hiç skill yok
    ],
  },
}
```

Kurallar:

- Varsayılan olarak kısıtlanmamış Skills için `agents.defaults.skills` alanını atlayın.
- `agents.defaults.skills` değerini devralmak için `agents.list[].skills` alanını atlayın.
- Hiç skill olmaması için `agents.list[].skills: []` ayarlayın.
- Boş olmayan bir `agents.list[].skills` listesi, o agent için son kümedir;
  varsayılanlarla birleşmez.

OpenClaw, etkili agent skill kümesini istem oluşturma, skill slash-command keşfi, sandbox senkronizasyonu ve skill anlık görüntüleri genelinde uygular.

## Plugins + Skills

Plugins, `openclaw.plugin.json` içinde
`skills` dizinlerini listeleyerek kendi Skills'lerini gönderebilir (plugin köküne göre yollar). Plugin etkin olduğunda plugin Skills yüklenir. Bugün bu dizinler, `skills.load.extraDirs` ile aynı düşük öncelikli yola birleştirilir; bu yüzden aynı adlı bundled,
managed, agent veya çalışma alanı skill'i bunların yerini alır.
Bunları, plugin'in yapılandırma girdisindeki `metadata.openclaw.requires.config`
üzerinden geçitleyebilirsiniz. Keşif/yapılandırma için [Plugins](/tr/tools/plugin) ve
bu Skills'in öğrettiği araç yüzeyi için [Tools](/tr/tools) bölümlerine bakın.

## ClawHub (kurulum + senkronizasyon)

ClawHub, OpenClaw için herkese açık Skills kayıt defteridir. Göz atmak için:
[https://clawhub.ai](https://clawhub.ai). Skills keşfetmek/kurmak/güncellemek için yerel `openclaw skills`
komutlarını veya yayınlama/senkronizasyon iş akışları gerektiğinde ayrı `clawhub` CLI aracını
kullanın.
Tam kılavuz: [ClawHub](/tr/tools/clawhub).

Yaygın akışlar:

- Çalışma alanınıza bir skill kurun:
  - `openclaw skills install <skill-slug>`
- Kurulu tüm Skills'i güncelleyin:
  - `openclaw skills update --all`
- Senkronize edin (tara + güncellemeleri yayımlayın):
  - `clawhub sync --all`

Yerel `openclaw skills install`, etkin çalışma alanı `skills/`
dizinine kurar. Ayrı `clawhub` CLI aracı da geçerli çalışma dizininiz altındaki `./skills` içine
kurar (veya yapılandırılmış OpenClaw çalışma alanına geri döner).
OpenClaw bunu bir sonraki oturumda `<workspace>/skills` olarak algılar.

## Güvenlik notları

- Üçüncü taraf Skills'i **güvenilmeyen kod** olarak değerlendirin. Etkinleştirmeden önce okuyun.
- Güvenilmeyen girdiler ve riskli araçlar için sandbox'lanmış çalıştırmaları tercih edin. Bkz. [Sandboxing](/tr/gateway/sandboxing).
- Çalışma alanı ve ek dizin skill keşfi yalnızca çözülmüş gerçek yolu yapılandırılmış kök içinde kalan skill köklerini ve `SKILL.md` dosyalarını kabul eder.
- Gateway destekli skill bağımlılık kurulumları (`skills.install`, onboarding ve Skills ayarları UI'ı), kurulum meta verilerini yürütmeden önce yerleşik tehlikeli kod tarayıcısını çalıştırır. `critical` bulgular, çağıran açıkça tehlikeli geçersiz kılmayı ayarlamadıkça varsayılan olarak engellenir; şüpheli bulgular ise yalnızca uyarı üretir.
- `openclaw skills install <slug>` farklıdır: bir ClawHub skill klasörünü çalışma alanına indirir ve yukarıdaki kurulum-meta verisi yolunu kullanmaz.
- `skills.entries.*.env` ve `skills.entries.*.apiKey`, sırları o agent dönüşü için **host** sürecine
  enjekte eder (sandbox'a değil). Sırları istemlerden ve günlüklerden uzak tutun.
- Daha geniş tehdit modeli ve kontrol listeleri için bkz. [Security](/tr/gateway/security).

## Biçim (AgentSkills + Pi-uyumlu)

`SKILL.md` en az şunu içermelidir:

```markdown
---
name: image-lab
description: Bir sağlayıcı destekli image iş akışı üzerinden görsel oluşturun veya düzenleyin
---
```

Notlar:

- Düzen/amaç için AgentSkills belirtimini izliyoruz.
- Gömülü agent tarafından kullanılan ayrıştırıcı yalnızca **tek satırlı** frontmatter anahtarlarını destekler.
- `metadata`, **tek satırlı JSON nesnesi** olmalıdır.
- Skill klasörü yoluna başvurmak için talimatlarda `{baseDir}` kullanın.
- İsteğe bağlı frontmatter anahtarları:
  - `homepage` — macOS Skills UI'ında “Website” olarak gösterilen URL (`metadata.openclaw.homepage` üzerinden de desteklenir).
  - `user-invocable` — `true|false` (varsayılan: `true`). `true` olduğunda skill, kullanıcı slash komutu olarak gösterilir.
  - `disable-model-invocation` — `true|false` (varsayılan: `false`). `true` olduğunda skill, model isteminden çıkarılır (yine de kullanıcı çağrısıyla kullanılabilir).
  - `command-dispatch` — `tool` (isteğe bağlı). `tool` olarak ayarlandığında slash command modeli atlar ve doğrudan bir araca yönlendirilir.
  - `command-tool` — `command-dispatch: tool` ayarlandığında çağrılacak araç adı.
  - `command-arg-mode` — `raw` (varsayılan). Araç yönlendirmesi için ham argüman dizesini araca iletir (çekirdek ayrıştırma yok).

    Araç şu parametrelerle çağrılır:
    `{ command: "<ham argümanlar>", commandName: "<slash command>", skillName: "<skill adı>" }`.

## Geçitleme (yükleme zamanı filtreleri)

OpenClaw, `metadata` (tek satırlı JSON) kullanarak Skills'i **yükleme zamanında** filtreler:

```markdown
---
name: image-lab
description: Bir sağlayıcı destekli image iş akışı üzerinden görsel oluşturun veya düzenleyin
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

- `always: true` — skill'i her zaman dahil et (diğer geçitleri atla).
- `emoji` — macOS Skills UI'ı tarafından kullanılan isteğe bağlı emoji.
- `homepage` — macOS Skills UI'ında “Website” olarak gösterilen isteğe bağlı URL.
- `os` — isteğe bağlı platform listesi (`darwin`, `linux`, `win32`). Ayarlanırsa skill yalnızca bu işletim sistemlerinde uygun olur.
- `requires.bins` — liste; her biri `PATH` üzerinde bulunmalıdır.
- `requires.anyBins` — liste; en az biri `PATH` üzerinde bulunmalıdır.
- `requires.env` — liste; env değişkeni mevcut olmalı **veya** yapılandırmada sağlanmış olmalıdır.
- `requires.config` — doğru/truthy olması gereken `openclaw.json` yol listesi.
- `primaryEnv` — `skills.entries.<name>.apiKey` ile ilişkilendirilen env değişkeni adı.
- `install` — macOS Skills UI'ı tarafından kullanılan isteğe bağlı kurucu belirtim dizisi (brew/node/go/uv/download).

Sandboxing notu:

- `requires.bins`, skill yükleme zamanında **host** üzerinde denetlenir.
- Bir agent sandbox içindeyse, ikili dosya **container içinde de** bulunmalıdır.
  Bunu `agents.defaults.sandbox.docker.setupCommand` (veya özel bir image) üzerinden kurun.
  `setupCommand`, container oluşturulduktan sonra bir kez çalışır.
  Paket kurulumları ayrıca ağ çıkışı, yazılabilir bir root FS ve sandbox içinde root kullanıcı gerektirir.
  Örnek: `summarize` skill'i (`skills/summarize/SKILL.md`), orada çalışması için sandbox container'ında `summarize` CLI
  gerektirir.

Kurucu örneği:

```markdown
---
name: gemini
description: Kodlama yardımı ve Google arama sorguları için Gemini CLI kullanın.
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
              "label": "Gemini CLI kur (brew)",
            },
          ],
      },
  }
---
```

Notlar:

- Birden fazla kurucu listelenirse gateway, **tek** bir tercih edilen seçeneği seçer (mümkünse brew, aksi halde node).
- Tüm kurucular `download` ise OpenClaw, mevcut artifact'leri görebilmeniz için her girdiyi listeler.
- Kurucu belirtimleri, seçenekleri platforma göre filtrelemek için `os: ["darwin"|"linux"|"win32"]` içerebilir.
- Node kurulumları `openclaw.json` içindeki `skills.install.nodeManager` ayarına uyar (varsayılan: npm; seçenekler: npm/pnpm/yarn/bun).
  Bu yalnızca **skill kurulumlarını** etkiler; Gateway çalışma zamanı yine de Node olmalıdır
  (WhatsApp/Telegram için Bun önerilmez).
- Gateway destekli kurucu seçimi, yalnızca node'a değil tercihe dayanır:
  kurulum belirtimleri türleri karıştırdığında OpenClaw,
  `skills.install.preferBrew` etkin ve `brew` mevcutsa Homebrew'ü, ardından `uv`'yi, sonra yapılandırılmış
  node yöneticisini, ardından `go` veya `download` gibi diğer fallback'leri tercih eder.
- Her kurulum belirtimi `download` ise OpenClaw, tek bir tercih edilen kurucuya daraltmak yerine tüm indirme seçeneklerini gösterir.
- Go kurulumları: `go` yoksa ve `brew` varsa, gateway önce Go'yu Homebrew ile kurar ve mümkün olduğunda `GOBIN` değerini Homebrew'ün `bin` dizinine ayarlar.
- İndirme kurulumları: `url` (zorunlu), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (varsayılan: arşiv algılanırsa otomatik), `stripComponents`, `targetDir` (varsayılan: `~/.openclaw/tools/<skillKey>`).

`metadata.openclaw` yoksa skill her zaman uygundur (yapılandırmada devre dışı bırakılmadıkça veya bundled Skills için `skills.allowBundled` tarafından engellenmedikçe).

## Yapılandırma geçersiz kılmaları (`~/.openclaw/openclaw.json`)

Bundled/managed Skills açılıp kapatılabilir ve env değerleri sağlanabilir:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // veya düz metin dizesi
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

OpenClaw'ın içinde stok image generation/düzenleme istiyorsanız bundled bir
skill yerine `agents.defaults.imageGenerationModel` ile çekirdek
`image_generate` aracını kullanın. Buradaki skill örnekleri özel veya üçüncü taraf iş akışları içindir.

Yerel image analizi için `agents.defaults.imageModel` ile `image` aracını kullanın.
Yerel image generation/düzenleme için
`agents.defaults.imageGenerationModel` ile `image_generate` kullanın. `openai/*`, `google/*`,
`fal/*` veya sağlayıcıya özgü başka bir image modeli seçerseniz, o sağlayıcının auth/API
anahtarını da ekleyin.

Yapılandırma anahtarları varsayılan olarak **skill adıyla** eşleşir. Bir skill
`metadata.openclaw.skillKey` tanımlarsa `skills.entries` altında bu anahtarı kullanın.

Kurallar:

- `enabled: false`, bundled/kurulu olsa bile skill'i devre dışı bırakır.
- `env`: değişken süreçte zaten ayarlı değilse **yalnızca o durumda** enjekte edilir.
- `apiKey`: `metadata.openclaw.primaryEnv` bildiren Skills için kolaylık sağlar.
  Düz metin dizesini veya SecretRef nesnesini (`{ source, provider, id }`) destekler.
- `config`: özel skill başına alanlar için isteğe bağlı torba; özel anahtarlar burada bulunmalıdır.
- `allowBundled`: yalnızca **bundled** Skills için isteğe bağlı izin listesi. Ayarlanırsa yalnızca
  listedeki bundled Skills uygundur (managed/çalışma alanı Skills etkilenmez).

## Ortam enjeksiyonu (agent çalıştırması başına)

Bir agent çalıştırması başladığında OpenClaw:

1. Skill meta verilerini okur.
2. Herhangi bir `skills.entries.<key>.env` veya `skills.entries.<key>.apiKey` değerini
   `process.env` içine uygular.
3. Sistem istemini **uygun** Skills ile oluşturur.
4. Çalıştırma bittikten sonra özgün ortamı geri yükler.

Bu, genel bir shell ortamı değil, **agent çalıştırmasına kapsamlıdır**.

Bundled `claude-cli` backend'i için OpenClaw ayrıca aynı
uygun anlık görüntüyü geçici bir Claude Code plugin'i olarak oluşturur ve
bunu `--plugin-dir` ile geçirir. Claude Code daha sonra kendi yerel skill çözücüsünü kullanabilir; OpenClaw ise öncelik, agent başına izin listeleri, geçitleme ve
`skills.entries.*` env/API anahtarı enjeksiyonunun sahibi olmaya devam eder. Diğer CLI backend'leri yalnızca istem
kataloğunu kullanır.

## Oturum anlık görüntüsü (performans)

OpenClaw, bir oturum başladığında uygun Skills'in anlık görüntüsünü alır **ve aynı oturumdaki sonraki dönüşler için** bu listeyi yeniden kullanır. Skills veya yapılandırmadaki değişiklikler bir sonraki yeni oturumda etkili olur.

Skills, Skills izleyicisi etkin olduğunda veya yeni bir uygun uzak düğüm göründüğünde de oturum ortasında yenilenebilir (aşağıya bakın). Bunu bir **hot reload** olarak düşünün: yenilenen liste bir sonraki agent dönüşünde alınır.

O oturum için etkili agent skill izin listesi değişirse OpenClaw,
görünür Skills'in mevcut agent ile hizalı kalması için anlık görüntüyü yeniler.

## Uzak macOS düğümleri (Linux gateway)

Gateway Linux üzerinde çalışıyorsa ancak **`system.run` izni verilmiş** bir **macOS düğümü** bağlıysa (Exec approvals güvenliği `deny` olarak ayarlanmamışsa), OpenClaw gerekli ikili dosyalar o düğümde mevcut olduğunda yalnızca macOS'a özgü Skills'i uygun olarak değerlendirebilir. Agent bu Skills'i `exec` aracı üzerinden `host=node` ile çalıştırmalıdır.

Bu, düğümün komut desteğini bildirmesine ve `system.run` üzerinden bir ikili dosya yoklamasına dayanır. macOS düğümü daha sonra çevrimdışı olursa Skills görünür kalır; düğüm yeniden bağlanana kadar çağrılar başarısız olabilir.

## Skills izleyicisi (otomatik yenileme)

Varsayılan olarak OpenClaw skill klasörlerini izler ve `SKILL.md` dosyaları değiştiğinde Skills anlık görüntüsünü artırır. Bunu `skills.load` altında yapılandırın:

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

Skills uygun olduğunda OpenClaw, sistem istemine mevcut Skills'in kompakt bir XML listesini enjekte eder (`pi-coding-agent` içindeki `formatSkillsForPrompt` aracılığıyla). Maliyet belirlenebilirdir:

- **Temel ek yük (yalnızca ≥1 skill olduğunda):** 195 karakter.
- **Skill başına:** 97 karakter + XML'den kaçırılmış `<name>`, `<description>` ve `<location>` değerlerinin uzunluğu.

Formül (karakter):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Notlar:

- XML kaçırma, `& < > " '` karakterlerini varlıklara (`&amp;`, `&lt;` vb.) dönüştürür ve uzunluğu artırır.
- Token sayıları model tokenizer'ına göre değişir. Kaba bir OpenAI tarzı tahmin ~4 karakter/token'dır; bu nedenle **97 karakter ≈ 24 token** eder; skill başına buna gerçek alan uzunluklarınız da eklenir.

## Managed Skills yaşam döngüsü

OpenClaw, kurulumun bir parçası olarak
(npm paketi veya OpenClaw.app) temel bir skill kümesini **bundled Skills** olarak sunar. `~/.openclaw/skills`, yerel
geçersiz kılmalar için vardır (örneğin bundled
kopyayı değiştirmeden bir skill'i sabitlemek/yamalamak). Çalışma alanı Skills kullanıcıya aittir ve ad çakışmalarında her ikisini de geçersiz kılar.

## Yapılandırma başvurusu

Tam yapılandırma şeması için [Skills config](/tr/tools/skills-config) bölümüne bakın.

## Daha fazla skill mi arıyorsunuz?

[https://clawhub.ai](https://clawhub.ai) sitesine göz atın.

---

## İlgili

- [Creating Skills](/tr/tools/creating-skills) — özel Skills oluşturma
- [Skills Config](/tr/tools/skills-config) — skill yapılandırma başvurusu
- [Slash Commands](/tr/tools/slash-commands) — kullanılabilir tüm slash command'ler
- [Plugins](/tr/tools/plugin) — plugin sistemi genel bakışı
