---
read_when:
    - Skills ekleme veya değiştirme
    - Skill geçitlerini veya yükleme kurallarını değiştirme
summary: 'Skills: yönetilen ve çalışma alanı, geçit kuralları ve yapılandırma/ortam bağlantıları'
title: Skills
x-i18n:
    generated_at: "2026-04-05T14:14:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6bb0e2e7c2ff50cf19c759ea1da1fd1886dc11f94adc77cbfd816009f75d93ee
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw, ajana araçları nasıl kullanacağını öğretmek için **[AgentSkills](https://agentskills.io) uyumlu** skill klasörleri kullanır. Her skill, YAML frontmatter ve talimatlar içeren bir `SKILL.md` dosyası barındıran bir dizindir. OpenClaw, **paketlenmiş skill**'leri ve isteğe bağlı yerel geçersiz kılmaları yükler ve bunları yükleme zamanında ortam, yapılandırma ve ikili dosya varlığına göre filtreler.

## Konumlar ve öncelik

OpenClaw skills öğelerini şu kaynaklardan yükler:

1. **Ek skill klasörleri**: `skills.load.extraDirs` ile yapılandırılır
2. **Paketlenmiş skills**: kurulumla birlikte gönderilir (npm paketi veya OpenClaw.app)
3. **Yönetilen/yerel skills**: `~/.openclaw/skills`
4. **Kişisel ajan skills**: `~/.agents/skills`
5. **Proje ajan skills**: `<workspace>/.agents/skills`
6. **Çalışma alanı skills**: `<workspace>/skills`

Bir skill adı çakışırsa öncelik sırası şöyledir:

`<workspace>/skills` (en yüksek) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş skills → `skills.load.extraDirs` (en düşük)

## Ajan başına skills ve paylaşılan skills

**Çok ajanlı** kurulumlarda her ajanın kendi çalışma alanı vardır. Bu şu anlama gelir:

- **Ajan başına skills**, yalnızca o ajan için `<workspace>/skills` içinde bulunur.
- **Proje ajan skills**, `<workspace>/.agents/skills` içinde bulunur ve normal çalışma alanı `skills/` klasöründen önce o çalışma alanına uygulanır.
- **Kişisel ajan skills**, `~/.agents/skills` içinde bulunur ve o makinedeki tüm çalışma alanlarına uygulanır.
- **Paylaşılan skills**, `~/.openclaw/skills` içinde bulunur (yönetilen/yerel) ve aynı makinedeki **tüm ajanlar** tarafından görülebilir.
- **Paylaşılan klasörler**, birden fazla ajanın kullandığı ortak bir skills paketi istiyorsanız `skills.load.extraDirs` aracılığıyla da eklenebilir (en düşük öncelik).

Aynı skill adı birden fazla yerde varsa olağan öncelik uygulanır:
çalışma alanı kazanır, ardından proje ajan skills, sonra kişisel ajan skills,
sonra yönetilen/yerel, sonra paketlenmiş, sonra ek dizinler gelir.

## Ajan skill izin listeleri

Skill **konumu** ile skill **görünürlüğü** ayrı denetimlerdir.

- Konum/öncelik, aynı ada sahip bir skill'in hangi kopyasının kazanacağını belirler.
- Ajan izin listeleri, bir ajanın gerçekte hangi görünür skills öğelerini kullanabileceğini belirler.

Paylaşılan temel için `agents.defaults.skills` kullanın, ardından ajan başına `agents.list[].skills` ile geçersiz kılın:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // github, weather devralır
      { id: "docs", skills: ["docs-search"] }, // varsayılanların yerine geçer
      { id: "locked-down", skills: [] }, // skills yok
    ],
  },
}
```

Kurallar:

- Varsayılan olarak kısıtlanmamış skills için `agents.defaults.skills` değerini belirtmeyin.
- `agents.defaults.skills` değerini devralmak için `agents.list[].skills` değerini belirtmeyin.
- Skills olmaması için `agents.list[].skills: []` ayarlayın.
- Boş olmayan bir `agents.list[].skills` listesi, o ajan için nihai kümedir; varsayılanlarla birleştirilmez.

OpenClaw, etkili ajan skill kümesini istem oluşturma, skill slash-command keşfi, sandbox eşitleme ve skill anlık görüntüleri genelinde uygular.

## Plugins + skills

Plugins, `openclaw.plugin.json` içinde `skills` dizinlerini listeleyerek
kendi skills öğelerini gönderebilir (plugin köküne göreli yollar). Plugin
skills, plugin etkin olduğunda yüklenir. Bugün bu dizinler,
`skills.load.extraDirs` ile aynı düşük öncelikli yola birleştirilir, bu nedenle
aynı adlı bir paketlenmiş, yönetilen, ajan veya çalışma alanı skill'i bunların
üzerine yazar.
Bunları plugin'in yapılandırma girdisindeki `metadata.openclaw.requires.config`
üzerinden geçitlendirebilirsiniz. Keşif/yapılandırma için [Plugins](/tools/plugin) ve bu
skills öğelerinin öğrettiği araç yüzeyi için [Tools](/tr/tools) bölümüne bakın.

## ClawHub (yükleme + eşitleme)

ClawHub, OpenClaw için herkese açık skills kayıt defteridir. Göz atmak için
[https://clawhub.ai](https://clawhub.ai) adresini kullanın. Skills keşfetmek/yüklemek/güncellemek için yerel `openclaw skills`
komutlarını veya yayımlama/eşitleme iş akışlarına ihtiyacınız olduğunda ayrı
`clawhub` CLI aracını kullanın.
Tam kılavuz: [ClawHub](/tr/tools/clawhub).

Yaygın akışlar:

- Çalışma alanınıza bir skill yükleyin:
  - `openclaw skills install <skill-slug>`
- Yüklü tüm skills öğelerini güncelleyin:
  - `openclaw skills update --all`
- Eşitleme (tara + güncellemeleri yayımla):
  - `clawhub sync --all`

Yerel `openclaw skills install`, etkin çalışma alanının `skills/`
dizinine yükler. Ayrı `clawhub` CLI aracı da geçerli çalışma dizininiz altındaki `./skills`
klasörüne yükler (veya yapılandırılmış OpenClaw çalışma alanına geri döner).
OpenClaw bunu sonraki oturumda `<workspace>/skills` olarak algılar.

## Güvenlik notları

- Üçüncü taraf skills öğelerine **güvenilmeyen kod** gibi davranın. Etkinleştirmeden önce okuyun.
- Güvenilmeyen girdiler ve riskli araçlar için sandbox çalıştırmalarını tercih edin. Bkz. [Sandboxing](/tr/gateway/sandboxing).
- Çalışma alanı ve ek dizin skill keşfi, yalnızca çözümlenmiş gerçek yolu yapılandırılmış kök içinde kalan skill köklerini ve `SKILL.md` dosyalarını kabul eder.
- Gateway destekli skill bağımlılık yüklemeleri (`skills.install`, onboarding ve Skills ayarları arayüzü), yükleyici meta verilerini çalıştırmadan önce yerleşik tehlikeli kod tarayıcısını çalıştırır. Çağıran açıkça tehlikeli geçersiz kılmayı ayarlamadıkça `critical` bulgular varsayılan olarak engellenir; şüpheli bulgular ise yalnızca uyarı verir.
- `openclaw skills install <slug>` farklıdır: çalışma alanına bir ClawHub skill klasörü indirir ve yukarıdaki yükleyici-meta veri yolunu kullanmaz.
- `skills.entries.*.env` ve `skills.entries.*.apiKey`, sırları bu ajan dönüşü için **host** sürecine enjekte eder
  (sandbox'a değil). Sırları istemlerin ve günlüklerin dışında tutun.
- Daha geniş bir tehdit modeli ve kontrol listeleri için bkz. [Security](/tr/gateway/security).

## Biçim (AgentSkills + Pi uyumlu)

`SKILL.md` en az şunları içermelidir:

```markdown
---
name: image-lab
description: Bir sağlayıcı destekli görüntü iş akışıyla görseller oluşturun veya düzenleyin
---
```

Notlar:

- Düzen/amaç için AgentSkills belirtimini takip ediyoruz.
- Gömülü ajan tarafından kullanılan ayrıştırıcı, yalnızca **tek satırlı** frontmatter anahtarlarını destekler.
- `metadata`, **tek satırlı bir JSON nesnesi** olmalıdır.
- Skill klasörü yoluna başvurmak için talimatlarda `{baseDir}` kullanın.
- İsteğe bağlı frontmatter anahtarları:
  - `homepage` — macOS Skills arayüzünde “Website” olarak gösterilen URL (`metadata.openclaw.homepage` üzerinden de desteklenir).
  - `user-invocable` — `true|false` (varsayılan: `true`). `true` olduğunda skill, kullanıcı slash komutu olarak gösterilir.
  - `disable-model-invocation` — `true|false` (varsayılan: `false`). `true` olduğunda skill model isteminden hariç tutulur (yine de kullanıcı çağrısıyla kullanılabilir).
  - `command-dispatch` — `tool` (isteğe bağlı). `tool` olarak ayarlandığında slash komutu modeli atlar ve doğrudan bir araca gönderilir.
  - `command-tool` — `command-dispatch: tool` ayarlandığında çağrılacak araç adı.
  - `command-arg-mode` — `raw` (varsayılan). Araç gönderimi için ham bağımsız değişken dizesini araca iletir (çekirdek ayrıştırması yok).

    Araç şu parametrelerle çağrılır:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Geçitleme (yükleme zamanı filtreleri)

OpenClaw, `metadata` kullanarak skills öğelerini **yükleme zamanında filtreler** (tek satırlı JSON):

```markdown
---
name: image-lab
description: Bir sağlayıcı destekli görüntü iş akışıyla görseller oluşturun veya düzenleyin
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
- `emoji` — macOS Skills arayüzü tarafından kullanılan isteğe bağlı emoji.
- `homepage` — macOS Skills arayüzünde “Website” olarak gösterilen isteğe bağlı URL.
- `os` — isteğe bağlı platform listesi (`darwin`, `linux`, `win32`). Ayarlanırsa skill yalnızca bu işletim sistemlerinde uygun olur.
- `requires.bins` — liste; her biri `PATH` içinde bulunmalıdır.
- `requires.anyBins` — liste; en az biri `PATH` içinde bulunmalıdır.
- `requires.env` — liste; ortam değişkeni mevcut olmalı **veya** yapılandırmada sağlanmış olmalıdır.
- `requires.config` — doğru değer taşıması gereken `openclaw.json` yolu listesi.
- `primaryEnv` — `skills.entries.<name>.apiKey` ile ilişkili ortam değişkeni adı.
- `install` — macOS Skills arayüzü tarafından kullanılan isteğe bağlı yükleyici belirtimleri dizisi (brew/node/go/uv/download).

Sandboxing hakkında not:

- `requires.bins`, skill yükleme zamanında **host** üzerinde denetlenir.
- Bir ajan sandbox içindeyse ikili dosya **container içinde de** bulunmalıdır.
  Bunu `agents.defaults.sandbox.docker.setupCommand` aracılığıyla (veya özel bir imajla) yükleyin.
  `setupCommand`, container oluşturulduktan sonra bir kez çalışır.
  Paket kurulumları ayrıca ağ çıkışı, yazılabilir bir kök dosya sistemi ve sandbox içinde bir root kullanıcısı gerektirir.
  Örnek: `summarize` skill'i (`skills/summarize/SKILL.md`) orada çalışabilmek için sandbox container içinde `summarize` CLI aracına
  ihtiyaç duyar.

Yükleyici örneği:

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
              "label": "Gemini CLI yükle (brew)",
            },
          ],
      },
  }
---
```

Notlar:

- Birden fazla yükleyici listelenmişse gateway tek bir tercih edilen seçenek seçer (**brew** mevcutsa, aksi halde node).
- Tüm yükleyiciler `download` ise OpenClaw, kullanılabilir yapıtları görebilmeniz için her girdiyi listeler.
- Yükleyici belirtimleri, seçenekleri platforma göre filtrelemek için `os: ["darwin"|"linux"|"win32"]` içerebilir.
- Node kurulumları `openclaw.json` içindeki `skills.install.nodeManager` değerine uyar (varsayılan: npm; seçenekler: npm/pnpm/yarn/bun).
  Bu yalnızca **skill yüklemelerini** etkiler; Gateway çalışma zamanı yine de Node
  olmalıdır (Bun, WhatsApp/Telegram için önerilmez).
- Gateway destekli yükleyici seçimi node odaklı değil, tercih odaklıdır:
  yükleme belirtimleri türleri karıştırdığında OpenClaw,
  `skills.install.preferBrew` etkinse ve `brew` varsa Homebrew'ü tercih eder, ardından `uv`, sonra yapılandırılmış node yöneticisi, sonra da `go` veya `download` gibi diğer geri dönüşler gelir.
- Her yükleme belirtimi `download` ise OpenClaw, bunları tek bir tercih edilen yükleyiciye indirmek yerine tüm indirme seçeneklerini gösterir.
- Go kurulumları: `go` eksikse ve `brew` mevcutsa gateway önce Homebrew ile Go kurar ve mümkün olduğunda `GOBIN` değerini Homebrew'ün `bin` yoluna ayarlar.
- İndirme kurulumları: `url` (zorunlu), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (varsayılan: arşiv algılanınca otomatik), `stripComponents`, `targetDir` (varsayılan: `~/.openclaw/tools/<skillKey>`).

`metadata.openclaw` yoksa skill her zaman uygundur (`config` içinde devre dışı bırakılmadıkça veya paketlenmiş skills için `skills.allowBundled` tarafından engellenmedikçe).

## Yapılandırma geçersiz kılmaları (`~/.openclaw/openclaw.json`)

Paketlenmiş/yönetilen skills açılıp kapatılabilir ve ortam değerleri sağlanabilir:

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

Not: skill adı tire içeriyorsa anahtarı tırnak içine alın (JSON5 tırnaklı anahtarları destekler).

OpenClaw içinde hazır görüntü oluşturma/düzenleme istiyorsanız, paketlenmiş bir
skill yerine `agents.defaults.imageGenerationModel` ile çekirdek
`image_generate` aracını kullanın. Buradaki skill örnekleri özel veya üçüncü taraf iş akışları içindir.

Yerel görüntü analizi için `agents.defaults.imageModel` ile `image` aracını kullanın.
Yerel görüntü oluşturma/düzenleme için
`agents.defaults.imageGenerationModel` ile `image_generate` kullanın. `openai/*`, `google/*`,
`fal/*` veya başka bir sağlayıcıya özgü görüntü modeli seçerseniz, o sağlayıcının kimlik doğrulamasını/API
anahtarını da ekleyin.

Yapılandırma anahtarları varsayılan olarak **skill adıyla** eşleşir. Bir skill
`metadata.openclaw.skillKey` tanımlıyorsa, `skills.entries` altında o anahtarı kullanın.

Kurallar:

- `enabled: false`, paketlenmiş/yüklü olsa bile skill'i devre dışı bırakır.
- `env`: değişken süreçte zaten ayarlı değilse **yalnızca** o zaman enjekte edilir.
- `apiKey`: `metadata.openclaw.primaryEnv` bildiren skills için kolaylıktır.
  Düz metin dizesini veya SecretRef nesnesini destekler (`{ source, provider, id }`).
- `config`: özel skill alanları için isteğe bağlı torba; özel anahtarlar burada bulunmalıdır.
- `allowBundled`: yalnızca **paketlenmiş** skills için isteğe bağlı izin listesi. Ayarlanırsa yalnızca listedeki paketlenmiş skills uygundur (yönetilen/çalışma alanı skills etkilenmez).

## Ortam enjeksiyonu (ajan çalıştırması başına)

Bir ajan çalıştırması başladığında OpenClaw şunları yapar:

1. Skill meta verilerini okur.
2. Herhangi bir `skills.entries.<key>.env` veya `skills.entries.<key>.apiKey` değerini
   `process.env` içine uygular.
3. Sistem istemini **uygun** skills ile oluşturur.
4. Çalıştırma sona erdiğinde özgün ortamı geri yükler.

Bu, genel bir shell ortamı değil, **ajana ait çalıştırma kapsamındadır**.

## Oturum anlık görüntüsü (performans)

OpenClaw, bir oturum başladığında uygun skills öğelerinin anlık görüntüsünü alır ve aynı oturumdaki sonraki dönüşler için bu listeyi yeniden kullanır. Skills veya yapılandırmadaki değişiklikler sonraki yeni oturumda etkili olur.

Skills, skills izleyicisi etkin olduğunda veya yeni bir uygun uzak düğüm göründüğünde oturum ortasında da yenilenebilir (aşağıya bakın). Bunu bir **hot reload** olarak düşünün: yenilenen liste bir sonraki ajan dönüşünde alınır.

Bu oturum için etkili ajan skill izin listesi değişirse OpenClaw,
görünür skills öğelerinin geçerli ajanla uyumlu kalması için anlık görüntüyü
yeniler.

## Uzak macOS düğümleri (Linux gateway)

Gateway Linux üzerinde çalışıyor ancak **macOS düğümü** bağlıysa **ve `system.run` izinliyse** (Exec approvals güvenliği `deny` olarak ayarlanmamışsa), OpenClaw gerekli ikili dosyalar o düğümde mevcut olduğunda yalnızca macOS'a özgü skills öğelerini uygun kabul edebilir. Ajan bu skills öğelerini `host=node` ile `exec` aracı üzerinden çalıştırmalıdır.

Bu, düğümün komut desteğini raporlamasına ve `system.run` üzerinden bir ikili dosya yoklamasına dayanır. macOS düğümü daha sonra çevrimdışı olursa skills görünür kalır; çağrılar düğüm yeniden bağlanana kadar başarısız olabilir.

## Skills izleyicisi (otomatik yenileme)

Varsayılan olarak OpenClaw, skill klasörlerini izler ve `SKILL.md` dosyaları değiştiğinde skills anlık görüntüsünü artırır. Bunu `skills.load` altında yapılandırın:

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

## Belirteç etkisi (skills listesi)

Skills uygun olduğunda OpenClaw, kullanılabilir skills öğelerinin kompakt bir XML listesini sistem istemine enjekte eder (`pi-coding-agent` içindeki `formatSkillsForPrompt` aracılığıyla). Maliyet deterministiktir:

- **Temel ek yük (yalnızca ≥1 skill olduğunda):** 195 karakter.
- **Skill başına:** 97 karakter + XML ile kaçışlanmış `<name>`, `<description>` ve `<location>` değerlerinin uzunluğu.

Formül (karakter):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Notlar:

- XML kaçışlama, `& < > " '` karakterlerini varlıklara (`&amp;`, `&lt;` vb.) genişleterek uzunluğu artırır.
- Belirteç sayıları model tokenizer'ına göre değişir. Yaklaşık OpenAI tarzı bir tahmin ~4 karakter/belirteçtir; dolayısıyla skill başına **97 karakter ≈ 24 belirteç**, artı gerçek alan uzunluklarınız gelir.

## Yönetilen skills yaşam döngüsü

OpenClaw, kurulumun bir parçası olarak (npm paketi veya OpenClaw.app)
temel bir skill kümesini **paketlenmiş skills** olarak gönderir. `~/.openclaw/skills`,
yerel geçersiz kılmalar için vardır (örneğin, paketlenmiş kopyayı değiştirmeden
bir skill'i sabitlemek/yamamak için). Çalışma alanı skills öğeleri kullanıcıya aittir ve ad çakışmalarında her ikisini de geçersiz kılar.

## Yapılandırma başvurusu

Tam yapılandırma şeması için [Skills yapılandırması](/tools/skills-config) bölümüne bakın.

## Daha fazla skill mi arıyorsunuz?

[https://clawhub.ai](https://clawhub.ai) adresine göz atın.

---

## İlgili

- [Skills Oluşturma](/tr/tools/creating-skills) — özel skills oluşturma
- [Skills Yapılandırması](/tools/skills-config) — skill yapılandırması başvurusu
- [Slash Commands](/tools/slash-commands) — kullanılabilir tüm slash komutları
- [Plugins](/tools/plugin) — plugin sistemi genel bakışı
