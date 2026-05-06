---
read_when:
    - Skills ekleme veya değiştirme
    - Skills geçitlemesini, izin listelerini veya yükleme kurallarını değiştirme
    - Skills önceliğini ve anlık görüntü davranışını anlama
sidebarTitle: Skills
summary: 'Skills: yönetilen ve çalışma alanı, kapılama kuralları, ajan izin listeleri ve yapılandırma bağlantıları'
title: Skills
x-i18n:
    generated_at: "2026-05-06T09:35:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22e1951cc4a932029bc33b43c06ff975b58d9ef81ffe679e2922401e1b6f801c
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw, araca araçları nasıl kullanacağını öğretmek için **[AgentSkills](https://agentskills.io) uyumlu** skill
klasörleri kullanır. Her skill, YAML frontmatter ve talimatlar içeren bir `SKILL.md` bulunan
bir dizindir. OpenClaw, paketle gelen skill'leri ve isteğe bağlı yerel geçersiz kılmaları
yükler; bunları yükleme sırasında ortam, yapılandırma ve ikili dosya varlığına göre filtreler.

## Konumlar ve öncelik

OpenClaw skill'leri şu kaynaklardan yükler, **en yüksek öncelik önce**:

| #   | Kaynak                | Yol                              |
| --- | --------------------- | -------------------------------- |
| 1   | Çalışma alanı skill'leri | `<workspace>/skills`             |
| 2   | Proje aracı skill'leri | `<workspace>/.agents/skills`     |
| 3   | Kişisel araç skill'leri | `~/.agents/skills`               |
| 4   | Yönetilen/yerel skill'ler | `~/.openclaw/skills`             |
| 5   | Paketle gelen skill'ler | kurulumla birlikte gönderilir    |
| 6   | Ek skill klasörleri   | `skills.load.extraDirs` (yapılandırma) |

Bir skill adı çakışırsa en yüksek kaynak kazanır.

Codex CLI'nin yerel `$CODEX_HOME/skills` dizini, bu OpenClaw skill köklerinden
biri değildir. Codex harness modunda, yerel uygulama sunucusu başlatmaları
araca özel yalıtılmış Codex home'ları kullanır; bu nedenle kişisel Codex CLI skill'leri
örtük olarak yüklenmez. Bunları envanterlemek için `openclaw migrate codex --dry-run`,
mevcut OpenClaw aracı çalışma alanına kopyalamadan önce etkileşimli bir onay kutusu
isteminde skill dizinlerini seçmek için `openclaw migrate codex` kullanın.
Etkileşimsiz çalıştırmalar için kopyalanacak tam skill'ler adına `--skill <name>` seçeneğini yineleyin.

## Araca özel ve paylaşılan skill'ler

**Çok araçlı** kurulumlarda her aracın kendi çalışma alanı vardır:

| Kapsam               | Yol                                         | Görünür olduğu yer           |
| -------------------- | ------------------------------------------- | ---------------------------- |
| Araca özel           | `<workspace>/skills`                        | Yalnızca o araç              |
| Proje aracı          | `<workspace>/.agents/skills`                | Yalnızca o çalışma alanının aracı |
| Kişisel araç         | `~/.agents/skills`                          | O makinedeki tüm araçlar     |
| Paylaşılan yönetilen/yerel | `~/.openclaw/skills`                        | O makinedeki tüm araçlar     |
| Paylaşılan ek dizinler | `skills.load.extraDirs` (en düşük öncelik) | O makinedeki tüm araçlar     |

Birden çok yerde aynı ad → en yüksek kaynak kazanır. Çalışma alanı
proje aracını, proje aracı kişisel aracı, kişisel araç yönetilen/yereli,
yönetilen/yerel paketle geleni, paketle gelen de ek dizinleri geçersiz kılar.

## Araç skill izin listeleri

Skill **konumu** ve skill **görünürlüğü** ayrı denetimlerdir.
Konum/öncelik, aynı ada sahip bir skill'in hangi kopyasının kazanacağını belirler; araç
izin listeleri ise bir aracın gerçekten hangi skill'leri kullanabileceğini belirler.

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
    - Varsayılan olarak sınırsız skill'ler için `agents.defaults.skills` değerini atlayın.
    - `agents.defaults.skills` değerini devralmak için `agents.list[].skills` değerini atlayın.
    - Skill olmaması için `agents.list[].skills: []` ayarlayın.
    - Boş olmayan bir `agents.list[].skills` listesi, o araç için **nihai** kümedir;
      varsayılanlarla birleştirilmez.
    - Etkin izin listesi istem oluşturma, skill slash-komutu keşfi, sandbox eşitlemesi
      ve skill anlık görüntüleri genelinde uygulanır.
  </Accordion>
</AccordionGroup>

## Pluginler ve skill'ler

Pluginler, `openclaw.plugin.json` içinde `skills` dizinlerini listeleyerek
(kök Plugin'e göre göreli yollar) kendi skill'lerini gönderebilir. Plugin skill'leri
Plugin etkinleştirildiğinde yüklenir. Burası, araç açıklaması için çok uzun olan
ancak Plugin kurulu olduğu sürece kullanılabilir olması gereken araca özgü
işletim kılavuzları için doğru yerdir; örneğin tarayıcı
Plugin'i, çok adımlı tarayıcı denetimi için bir `browser-automation` skill'i gönderir.

Plugin skill dizinleri, `skills.load.extraDirs` ile aynı düşük öncelikli yola
birleştirilir; bu nedenle aynı ada sahip paketle gelen, yönetilen, araç veya
çalışma alanı skill'i bunları geçersiz kılar. Bunları Plugin'in yapılandırma
girdisinde `metadata.openclaw.requires.config` üzerinden sınırlayabilirsiniz.

Keşif/yapılandırma için [Pluginler](/tr/tools/plugin), bu skill'lerin öğrettiği
araç yüzeyi için [Araçlar](/tr/tools) bölümüne bakın.

## Skill Workshop

İsteğe bağlı, deneysel **Skill Workshop** Plugin'i, araç çalışması sırasında
gözlemlenen yeniden kullanılabilir prosedürlerden çalışma alanı skill'leri oluşturabilir
veya güncelleyebilir. Varsayılan olarak devre dışıdır ve
`plugins.entries.skill-workshop` üzerinden açıkça etkinleştirilmelidir.

Skill Workshop yalnızca `<workspace>/skills` içine yazar, oluşturulan içeriği
tarar, bekleyen onayı veya otomatik güvenli yazmaları destekler, güvenli olmayan
önerileri karantinaya alır ve başarılı yazmalardan sonra skill anlık görüntüsünü
yeniler; böylece yeni skill'ler Gateway yeniden başlatılmadan kullanılabilir olur.

Bunu _"bir dahaki sefere GIF atıfını doğrula"_ gibi düzeltmeler veya
medya QA kontrol listeleri gibi zorlukla edinilmiş iş akışları için kullanın.
Bekleyen onayla başlayın; otomatik yazmaları yalnızca önerilerini inceledikten sonra
güvenilir çalışma alanlarında kullanın. Tam kılavuz: [Skill Workshop Plugin'i](/tr/plugins/skill-workshop).

## ClawHub (kurulum ve eşitleme)

[ClawHub](https://clawhub.ai), OpenClaw için herkese açık skill kayıt yeridir.
Keşfetme/kurma/güncelleme için yerel `openclaw skills` komutlarını veya
yayımlama/eşitleme iş akışları için ayrı `clawhub` CLI'yi kullanın. Tam kılavuz:
[ClawHub](/tr/tools/clawhub).

| Eylem                              | Komut                                  |
| ---------------------------------- | -------------------------------------- |
| Çalışma alanına bir skill kur      | `openclaw skills install <skill-slug>` |
| Kurulu tüm skill'leri güncelle     | `openclaw skills update --all`         |
| Eşitle (tara + güncellemeleri yayımla) | `clawhub sync --all`                   |

Yerel `openclaw skills install`, etkin çalışma alanındaki `skills/` dizinine
kurar. Ayrı `clawhub` CLI de geçerli çalışma dizininizin altındaki
`./skills` içine kurar (veya yapılandırılmış OpenClaw çalışma alanına geri döner).
OpenClaw bunu bir sonraki oturumda `<workspace>/skills` olarak alır.
Yapılandırılmış skill kökleri, `skills/<group>/<skill>/SKILL.md` gibi
tek bir gruplama düzeyini de destekler; böylece ilgili üçüncü taraf skill'ler
geniş özyinelemeli tarama olmadan paylaşılan bir klasör altında tutulabilir.

ClawHub skill sayfaları kurulumdan önce en son güvenlik taraması durumunu,
VirusTotal, ClawScan ve statik analiz için tarayıcı ayrıntı sayfalarıyla gösterir.
`openclaw skills install <slug>` yalnızca kurulum yolu olarak kalır; yayıncılar
yanlış pozitifleri ClawHub panosu veya `clawhub skill rescan <slug>` üzerinden giderir.

## Güvenlik

<Warning>
Üçüncü taraf skill'leri **güvenilmeyen kod** olarak ele alın. Etkinleştirmeden önce okuyun.
Güvenilmeyen girdiler ve riskli araçlar için sandbox'lı çalıştırmaları tercih edin.
Araç tarafı denetimler için [Sandboxing](/tr/gateway/sandboxing) bölümüne bakın.
</Warning>

- Çalışma alanı ve ek dizin skill keşfi yalnızca çözümlenmiş realpath'i yapılandırılmış kökün içinde kalan skill köklerini ve `SKILL.md` dosyalarını kabul eder.
- Gateway destekli skill bağımlılığı kurulumları (`skills.install`, onboarding ve Skills ayarları kullanıcı arayüzü), kurulumcu metadata'sını yürütmeden önce yerleşik tehlikeli kod tarayıcısını çalıştırır. Çağıran açıkça tehlikeli geçersiz kılmayı ayarlamadıkça `critical` bulgular varsayılan olarak engeller; şüpheli bulgular yine yalnızca uyarır.
- `openclaw skills install <slug>` farklıdır; bir ClawHub skill klasörünü çalışma alanına indirir ve yukarıdaki kurulumcu metadata yolunu kullanmaz.
- `skills.entries.*.env` ve `skills.entries.*.apiKey`, sıradaki o araç turu için gizli değerleri **host** işlemine enjekte eder (sandbox'a değil). Gizli değerleri istemlerden ve günlüklerden uzak tutun.

Daha geniş bir tehdit modeli ve kontrol listeleri için [Güvenlik](/tr/gateway/security) bölümüne bakın.

## SKILL.md biçimi

`SKILL.md` en az şunları içermelidir:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw düzen/amaç için AgentSkills spesifikasyonunu izler. Gömülü araç tarafından
kullanılan ayrıştırıcı yalnızca **tek satırlı** frontmatter anahtarlarını destekler;
`metadata` bir **tek satırlı JSON nesnesi** olmalıdır. Talimatlarda skill klasörü yoluna
başvurmak için `{baseDir}` kullanın.

### İsteğe bağlı frontmatter anahtarları

<ParamField path="homepage" type="string">
  macOS Skills kullanıcı arayüzünde "Website" olarak gösterilen URL. `metadata.openclaw.homepage` üzerinden de desteklenir.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  `true` olduğunda skill, kullanıcı slash komutu olarak gösterilir.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` olduğunda OpenClaw, skill'in talimatlarını aracın normal isteminin dışında tutar.
  Skill yine de kurulu kalır ve `user-invocable` da `true` olduğunda açıkça
  slash komutu olarak çalıştırılabilir.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  `tool` olarak ayarlandığında slash komutu modeli atlar ve doğrudan bir araca gönderilir.
</ParamField>
<ParamField path="command-tool" type="string">
  `command-dispatch: tool` ayarlandığında çağrılacak araç adı.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Araç gönderimi için ham argüman dizesini araca iletir (core ayrıştırması yok). Araç `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` ile çağrılır.
</ParamField>

## Sınırlama (yükleme zamanı filtreleri)

OpenClaw, `metadata` (tek satırlı JSON) kullanarak skill'leri yükleme sırasında filtreler:

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
  `true` olduğunda skill'i her zaman dahil et (diğer kapıları atla).
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills kullanıcı arayüzü tarafından kullanılan isteğe bağlı emoji.
</ParamField>
<ParamField path="homepage" type="string">
  macOS Skills kullanıcı arayüzünde "Website" olarak gösterilen isteğe bağlı URL.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  İsteğe bağlı platform listesi. Ayarlanırsa skill yalnızca bu işletim sistemlerinde uygun olur.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Her biri `PATH` üzerinde bulunmalıdır.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  En az biri `PATH` üzerinde bulunmalıdır.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Env var bulunmalı veya yapılandırmada sağlanmalıdır.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Doğru değerli olması gereken `openclaw.json` yollarının listesi.
</ParamField>
<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` ile ilişkili Env var adı.
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills kullanıcı arayüzü tarafından kullanılan isteğe bağlı kurulumcu spesifikasyonları (brew/node/go/uv/download).
</ParamField>

`metadata.openclaw` yoksa skill her zaman uygundur (yapılandırmada devre dışı bırakılmadıysa
veya paketle gelen skill'ler için `skills.allowBundled` tarafından engellenmediyse).

<Note>
Eski `metadata.clawdbot` blokları, `metadata.openclaw` yoksa hâlâ kabul edilir;
böylece eski kurulu skill'ler bağımlılık kapılarını ve kurulumcu ipuçlarını korur.
Yeni ve güncellenen skill'ler `metadata.openclaw` kullanmalıdır.
</Note>

### Sandboxing notları

- `requires.bins`, skill yükleme sırasında **host** üzerinde denetlenir.
- Bir araç sandbox'lıysa ikili dosya **konteynerin içinde** de bulunmalıdır. Bunu `agents.defaults.sandbox.docker.setupCommand` (veya özel bir imaj) ile kurun. `setupCommand`, konteyner oluşturulduktan sonra bir kez çalışır. Paket kurulumları ayrıca ağ çıkışı, yazılabilir bir kök FS ve sandbox içinde bir root kullanıcı gerektirir.
- Örnek: `summarize` skill'i (`skills/summarize/SKILL.md`), orada çalışmak için sandbox konteynerinde `summarize` CLI'ye ihtiyaç duyar.

### Yükleyici özellikleri

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
    - Birden fazla yükleyici listelenmişse gateway tek bir tercih edilen seçenek seçer (mevcut olduğunda brew, aksi halde node).
    - Tüm yükleyiciler `download` ise OpenClaw kullanılabilir yapıtları görebilmeniz için her girdiyi listeler.
    - Yükleyici özellikleri, seçenekleri platforma göre filtrelemek için `os: ["darwin"|"linux"|"win32"]` içerebilir.
    - Node kurulumları `openclaw.json` içindeki `skills.install.nodeManager` ayarına uyar (varsayılan: npm; seçenekler: npm/pnpm/yarn/bun). Bu yalnızca skill kurulumlarını etkiler; Gateway çalışma zamanı yine Node olmalıdır - WhatsApp/Telegram için Bun önerilmez.
    - Gateway destekli yükleyici seçimi tercihe dayalıdır: kurulum özellikleri farklı türleri karıştırdığında OpenClaw, `skills.install.preferBrew` etkinse ve `brew` varsa önce Homebrew'ü, sonra `uv`'yi, sonra yapılandırılmış node yöneticisini, ardından `go` veya `download` gibi diğer yedekleri tercih eder.
    - Her kurulum özelliği `download` ise OpenClaw, tek bir tercih edilen yükleyiciye indirgemek yerine tüm indirme seçeneklerini gösterir.

  </Accordion>
  <Accordion title="Yükleyici başına ayrıntılar">
    - **Go kurulumları:** `go` eksikse ve `brew` mevcutsa gateway önce Homebrew ile Go kurar ve mümkün olduğunda `GOBIN` değerini Homebrew'ün `bin` dizinine ayarlar.
    - **İndirme kurulumları:** `url` (zorunlu), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (varsayılan: arşiv algılandığında otomatik), `stripComponents`, `targetDir` (varsayılan: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Yapılandırma geçersiz kılmaları

Paketle gelen ve yönetilen skills, `~/.openclaw/openclaw.json` içindeki `skills.entries`
altında açılıp kapatılabilir ve env değerleriyle sağlanabilir:

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
  Paketle gelen `coding-agent` skill'i isteğe bağlıdır: ajanlara sunmadan önce
  `skills.entries.coding-agent.enabled: true` ayarını yapın, ardından `claude`,
  `codex`, `opencode` veya `pi` seçeneklerinden birinin kurulu olduğundan ve
  kendi CLI'si için kimliğinin doğrulandığından emin olun.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` bildiren skills için kolaylık sağlar. Düz metin veya SecretRef destekler.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Yalnızca değişken süreçte zaten ayarlı değilse enjekte edilir.
</ParamField>
<ParamField path="config" type="object">
  Özel skill başına alanlar için isteğe bağlı çanta. Özel anahtarlar burada bulunmalıdır.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Yalnızca **paketle gelen** skills için isteğe bağlı izin listesi. Ayarlanırsa yalnızca listedeki paketle gelen skills uygun olur (yönetilen/çalışma alanı skills etkilenmez).
</ParamField>

Skill adı tire içeriyorsa anahtarı tırnak içine alın (JSON5 tırnaklı
anahtarlara izin verir). Yapılandırma anahtarları varsayılan olarak **skill adı**
ile eşleşir - bir skill `metadata.openclaw.skillKey` tanımlıyorsa
`skills.entries` altında o anahtarı kullanın.

<Note>
OpenClaw içinde stok görsel oluşturma/düzenleme için paketle gelen bir skill
yerine `agents.defaults.imageGenerationModel` ile çekirdek `image_generate`
aracını kullanın. Buradaki skill örnekleri özel veya üçüncü taraf iş akışları
içindir. Yerel görsel analizi için `agents.defaults.imageModel` ile `image`
aracını kullanın. `openai/*`, `google/*`, `fal/*` veya başka bir sağlayıcıya
özel görsel modeli seçerseniz o sağlayıcının auth/API anahtarını da ekleyin.
</Note>

## Ortam enjeksiyonu

Bir ajan çalışması başladığında OpenClaw:

1. Skill metadata'sını okur.
2. `skills.entries.<key>.env` ve `skills.entries.<key>.apiKey` değerlerini `process.env` üzerine uygular.
3. Sistem istemini **uygun** skills ile oluşturur.
4. Çalışma sona erdikten sonra özgün ortamı geri yükler.

Ortam enjeksiyonu global bir kabuk ortamı değil, **ajan çalışmasıyla sınırlıdır**.

Paketle gelen `claude-cli` backend için OpenClaw aynı uygun anlık görüntüyü
geçici bir Claude Code plugin'i olarak da oluşturur ve `--plugin-dir` ile geçirir.
Böylece Claude Code kendi yerel skill çözümleyicisini kullanabilir; OpenClaw ise
öncelik, ajan başına izin listeleri, kapılama ve `skills.entries.*` env/API
anahtarı enjeksiyonunu yine yönetir. Diğer CLI backend'leri yalnızca istem
kataloğunu kullanır.

## Anlık görüntüler ve yenileme

OpenClaw uygun skills listesinin anlık görüntüsünü **bir oturum başladığında**
alır ve aynı oturumdaki sonraki turlarda bu listeyi yeniden kullanır. Skills veya
yapılandırmadaki değişiklikler bir sonraki yeni oturumda etkili olur.

Skills iki durumda oturum ortasında yenilenebilir:

- Skills izleyicisi etkindir.
- Yeni bir uygun uzak node görünür.

Bunu bir **hot reload** olarak düşünün: yenilenmiş liste bir sonraki ajan turunda
kullanılır. O oturum için etkili ajan skill izin listesi değişirse OpenClaw anlık
görüntüyü yeniler; böylece görünen skills mevcut ajanla hizalı kalır.

### Skills izleyicisi

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

Gateway Linux üzerinde çalışıyor ancak `system.run` izni verilen (Exec onayları
güvenliği `deny` olarak ayarlanmamış) bir **macOS node** bağlıysa OpenClaw,
gerekli ikili dosyalar o node üzerinde mevcut olduğunda yalnızca macOS'a özel
skills'i uygun sayabilir. Ajan bu skills'i `host=node` ile `exec` aracı üzerinden
çalıştırmalıdır.

Bu, node'un komut desteğini raporlamasına ve `system.which` veya `system.run`
üzerinden bir bin sondasına dayanır. Çevrimdışı node'lar **uzaktan çalıştırılan**
skills'i görünür yapmaz. Bağlı bir node bin sondalarına yanıt vermeyi bırakırsa
OpenClaw önbelleğe alınmış bin eşleşmelerini temizler; böylece ajanlar o anda
orada çalıştırılamayan skills'i artık görmez.

## Token etkisi

Skills uygun olduğunda OpenClaw, sistem istemine kullanılabilir skills'in kompakt
bir XML listesini enjekte eder (`pi-coding-agent` içindeki `formatSkillsForPrompt`
üzerinden). Maliyet deterministiktir:

- **Temel ek yük** (yalnızca ≥1 skill olduğunda): 195 karakter.
- **Skill başına:** 97 karakter + XML kaçışlı `<name>`, `<description>` ve `<location>` değerlerinin uzunluğu.

Formül (karakter):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML kaçışlama `& < > " '` karakterlerini varlıklara (`&amp;`, `&lt;`, vb.)
genişleterek uzunluğu artırır. Token sayıları model tokenizer'ına göre değişir.
Kabaca OpenAI tarzı bir tahmin ~4 karakter/token olduğundan **97 karakter ≈ 24
token** her skill için, buna gerçek alan uzunluklarınız eklenir.

## Yönetilen skills yaşam döngüsü

OpenClaw, kurulumla (npm paketi veya OpenClaw.app) birlikte **paketle gelen
skills** olarak temel bir skill kümesi gönderir. `~/.openclaw/skills` yerel geçersiz
kılmalar için vardır - örneğin paketle gelen kopyayı değiştirmeden bir skill'i
sabitlemek veya yamalamak için. Çalışma alanı skills kullanıcıya aittir ve ad
çakışmalarında ikisinin de üzerine yazar.

## Daha fazla skill mi arıyorsunuz?

[https://clawhub.ai](https://clawhub.ai) adresine göz atın. Tam yapılandırma
şeması: [Skills yapılandırması](/tr/tools/skills-config).

## İlgili

- [ClawHub](/tr/tools/clawhub) - herkese açık skills kayıt defteri
- [Skills oluşturma](/tr/tools/creating-skills) - özel skills oluşturma
- [Plugins](/tr/tools/plugin) - Plugin sistemine genel bakış
- [Skill Workshop plugin](/tr/plugins/skill-workshop) - ajan çalışmasından skills oluşturma
- [Skills yapılandırması](/tr/tools/skills-config) - skill yapılandırma başvurusu
- [Eğik çizgi komutları](/tr/tools/slash-commands) - kullanılabilir tüm eğik çizgi komutları
