---
read_when:
    - Skills ekleme veya değiştirme
    - Skill geçitlemesini, izin listelerini veya yükleme kurallarını değiştirme
    - Skill önceliğini ve anlık görüntü davranışını anlama
sidebarTitle: Skills
summary: 'Skills: yönetilen ve çalışma alanı, geçitleme kuralları, aracı izin listeleri ve yapılandırma bağlantıları'
title: Skills
x-i18n:
    generated_at: "2026-04-26T11:43:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd880e88051db9d4d9090a64123a2dc5a16a6211fa46879ddecaa86f25149c
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw, aracıya araçları nasıl kullanacağını öğretmek için **[AgentSkills](https://agentskills.io)-uyumlu** skill klasörleri kullanır. Her skill, YAML frontmatter ve talimatlar içeren bir `SKILL.md` dosyası barındıran bir dizindir. OpenClaw paketlenmiş skill'leri ve isteğe bağlı yerel geçersiz kılmaları yükler, ardından bunları ortam, yapılandırma ve ikili dosya varlığına göre yükleme zamanında filtreler.

## Konumlar ve öncelik

OpenClaw skill'leri şu kaynaklardan yükler, **en yüksek öncelik önce gelecek şekilde**:

| #   | Kaynak               | Yol                              |
| --- | -------------------- | -------------------------------- |
| 1   | Çalışma alanı Skills | `<workspace>/skills`             |
| 2   | Proje aracı Skills   | `<workspace>/.agents/skills`     |
| 3   | Kişisel aracı Skills | `~/.agents/skills`               |
| 4   | Yönetilen/yerel Skills | `~/.openclaw/skills`           |
| 5   | Paketlenmiş Skills   | kurulumla birlikte gelir         |
| 6   | Ek skill klasörleri  | `skills.load.extraDirs` (yapılandırma) |

Bir skill adı çakışırsa, en üstteki kaynak kazanır.

## Aracı başına ve paylaşılan Skills

**Çok aracılı** kurulumlarda her aracının kendi çalışma alanı vardır:

| Kapsam               | Yol                                         | Görünür olduğu yer            |
| -------------------- | ------------------------------------------- | ----------------------------- |
| Aracı başına         | `<workspace>/skills`                        | Yalnızca o aracı              |
| Proje aracı          | `<workspace>/.agents/skills`                | Yalnızca o çalışma alanının aracısı |
| Kişisel aracı        | `~/.agents/skills`                          | O makinedeki tüm aracılar     |
| Paylaşılan yönetilen/yerel | `~/.openclaw/skills`                  | O makinedeki tüm aracılar     |
| Paylaşılan ek dizinler | `skills.load.extraDirs` (en düşük öncelik) | O makinedeki tüm aracılar   |

Aynı ad birden çok yerde varsa → en üstteki kaynak kazanır. Çalışma alanı,
proje aracısını; proje aracısı kişisel aracıyı; kişisel aracı yönetilen/yereli; yönetilen/yerel paketlenmişi; paketlenmiş de ek dizinleri geçersiz kılar.

## Aracı skill izin listeleri

Skill **konumu** ile skill **görünürlüğü** ayrı denetimlerdir.
Konum/öncelik, aynı adlı skill'in hangi kopyasının kazanacağını belirler; aracı izin listeleri ise bir aracının gerçekte hangi skill'leri kullanabileceğini belirler.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // github, weather'ı devralır
      { id: "docs", skills: ["docs-search"] }, // varsayılanların yerine geçer
      { id: "locked-down", skills: [] }, // skill yok
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="İzin listesi kuralları">
    - Varsayılan olarak sınırsız skill için `agents.defaults.skills` alanını atlayın.
    - `agents.defaults.skills` değerini devralmak için `agents.list[].skills` alanını atlayın.
    - Hiç skill olmaması için `agents.list[].skills: []` ayarlayın.
    - Boş olmayan bir `agents.list[].skills` listesi, o aracı için **nihai** kümedir — varsayılanlarla birleştirilmez.
    - Etkili izin listesi; istem oluşturma, skill eğik çizgi komutu keşfi, sandbox eşzamanlama ve skill anlık görüntüleri genelinde uygulanır.
  </Accordion>
</AccordionGroup>

## Plugin'ler ve Skills

Plugin'ler, `openclaw.plugin.json` içinde `skills` dizinlerini listeleyerek
(kök Plugin dizinine göre göreli yollar) kendi skill'lerini gönderebilir.
Plugin skill'leri, Plugin etkin olduğunda yüklenir. Bu, araç açıklamasına sığmayacak kadar uzun ama Plugin kurulu olduğunda her zaman kullanılabilir olması gereken araca özgü işletim kılavuzları için doğru yerdir — örneğin, tarayıcı Plugin çok adımlı tarayıcı denetimi için bir `browser-automation` skill'i gönderir.

Plugin skill dizinleri, `skills.load.extraDirs` ile aynı düşük öncelikli yolda birleştirilir; bu nedenle aynı adlı paketlenmiş, yönetilen, aracı veya çalışma alanı skill'i bunları geçersiz kılar. Bunları Plugin'in yapılandırma girdisindeki `metadata.openclaw.requires.config` ile geçitleyebilirsiniz.

Keşif/yapılandırma için [Plugins](/tr/tools/plugin) ve bu skill'lerin öğrettiği araç yüzeyi için [Tools](/tr/tools) bölümlerine bakın.

## Skill Workshop

İsteğe bağlı, deneysel **Skill Workshop** Plugin'i, aracı çalışması sırasında gözlemlenen yeniden kullanılabilir prosedürlerden çalışma alanı skill'leri oluşturabilir veya güncelleyebilir. Varsayılan olarak devre dışıdır ve `plugins.entries.skill-workshop` ile açıkça etkinleştirilmelidir.

Skill Workshop yalnızca `<workspace>/skills` içine yazar, üretilen içeriği tarar, bekleyen onayı veya otomatik güvenli yazmaları destekler, güvenli olmayan önerileri karantinaya alır ve başarılı yazmalardan sonra skill anlık görüntüsünü yenileyerek yeni skill'lerin Gateway yeniden başlatması olmadan kullanılabilir olmasını sağlar.

Bunu _"bir dahaki sefere GIF ilişkilendirmesini doğrula"_ gibi düzeltmeler veya medya QA kontrol listeleri gibi emek verilmiş iş akışları için kullanın. Bekleyen onayla başlayın; otomatik yazmaları yalnızca güvenilir çalışma alanlarında, önerilerini gözden geçirdikten sonra kullanın. Tam kılavuz: [Skill Workshop Plugin](/tr/plugins/skill-workshop).

## ClawHub (kurulum ve eşzamanlama)

[ClawHub](https://clawhub.ai), OpenClaw için herkese açık skill kayıt defteridir.
Keşfetme/kurma/güncelleme için yerel `openclaw skills` komutlarını veya yayınlama/eşzamanlama iş akışları için ayrı `clawhub` CLI'ı kullanın. Tam kılavuz:
[ClawHub](/tr/tools/clawhub).

| Eylem                               | Komut                                 |
| ----------------------------------- | ------------------------------------- |
| Bir skill'i çalışma alanına kur     | `openclaw skills install <skill-slug>` |
| Kurulu tüm skill'leri güncelle      | `openclaw skills update --all`        |
| Eşzamanla (tara + güncellemeleri yayımla) | `clawhub sync --all`            |

Yerel `openclaw skills install`, etkin çalışma alanı
`skills/` dizinine kurar. Ayrı `clawhub` CLI da
geçerli çalışma dizininiz altındaki `./skills` içine kurar (veya yapılandırılmış OpenClaw çalışma alanına geri döner). OpenClaw bunu bir sonraki oturumda
`<workspace>/skills` olarak algılar.

## Güvenlik

<Warning>
Üçüncü taraf skill'leri **güvenilmeyen kod** olarak ele alın. Etkinleştirmeden önce okuyun.
Güvenilmeyen girdiler ve riskli araçlar için sandbox içi çalıştırmaları tercih edin. Aracı tarafı denetimler için
[Sandboxing](/tr/gateway/sandboxing) bölümüne bakın.
</Warning>

- Çalışma alanı ve ek dizin skill keşfi yalnızca çözümlenmiş realpath'i yapılandırılmış kök içinde kalan skill köklerini ve `SKILL.md` dosyalarını kabul eder.
- Gateway destekli skill bağımlılığı kurulumları (`skills.install`, ilk katılım ve Skills ayarları UI'ı), kurucu meta verilerini yürütmeden önce yerleşik tehlikeli kod tarayıcısını çalıştırır. `critical` bulgular, çağıran açıkça tehlikeli geçersiz kılmayı ayarlamadıkça varsayılan olarak engellenir; şüpheli bulgular ise yalnızca uyarı verir.
- `openclaw skills install <slug>` farklıdır — bir ClawHub skill klasörünü çalışma alanına indirir ve yukarıdaki kurucu meta veri yolunu kullanmaz.
- `skills.entries.*.env` ve `skills.entries.*.apiKey`, gizli bilgileri sandbox'a değil, o aracı sırası için **ana makine** sürecine enjekte eder. Gizli bilgileri istemlerin ve günlüklerin dışında tutun.

Daha geniş bir tehdit modeli ve kontrol listeleri için [Security](/tr/gateway/security) bölümüne bakın.

## SKILL.md biçimi

`SKILL.md` en az şunları içermelidir:

```markdown
---
name: image-lab
description: Sağlayıcı destekli bir görsel iş akışı üzerinden görseller oluşturun veya düzenleyin
---
```

OpenClaw, düzen/amaç için AgentSkills belirtimini izler. Gömülü aracının kullandığı ayrıştırıcı yalnızca **tek satırlık** frontmatter anahtarlarını destekler;
`metadata`, **tek satırlık JSON nesnesi** olmalıdır. Skill klasörü yoluna başvurmak için talimatlarda `{baseDir}` kullanın.

### İsteğe bağlı frontmatter anahtarları

<ParamField path="homepage" type="string">
  macOS Skills UI'ında "Website" olarak gösterilen URL. `metadata.openclaw.homepage` üzerinden de desteklenir.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  `true` olduğunda skill, kullanıcı eğik çizgi komutu olarak gösterilir.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` olduğunda skill model isteminden çıkarılır (kullanıcı çağrısı ile yine kullanılabilir).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  `tool` olarak ayarlandığında, eğik çizgi komutu modeli atlar ve doğrudan bir araca gönderilir.
</ParamField>
<ParamField path="command-tool" type="string">
  `command-dispatch: tool` ayarlandığında çağrılacak araç adı.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Araç gönderimi için ham argüman dizesini araca iletir (çekirdek ayrıştırma yok). Araç şu şekilde çağrılır: `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Geçitleme (yükleme zamanı filtreleri)

OpenClaw, skill'leri `metadata` (tek satırlık JSON) kullanarak yükleme zamanında filtreler:

```markdown
---
name: image-lab
description: Sağlayıcı destekli bir görsel iş akışı üzerinden görseller oluşturun veya düzenleyin
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
  `true` olduğunda skill'i her zaman dahil et (diğer geçitleri atla).
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills UI'ı tarafından kullanılan isteğe bağlı emoji.
</ParamField>
<ParamField path="homepage" type="string">
  macOS Skills UI'ında "Website" olarak gösterilen isteğe bağlı URL.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  İsteğe bağlı platform listesi. Ayarlanırsa, skill yalnızca bu işletim sistemlerinde uygun olur.
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
  Truthy olması gereken `openclaw.json` yolları listesi.
</ParamField>
<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` ile ilişkilendirilen ortam değişkeni adı.
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills UI'ı tarafından kullanılan isteğe bağlı kurucu belirtimleri (brew/node/go/uv/download).
</ParamField>

`metadata.openclaw` yoksa, skill her zaman uygundur (`always` etkin değilse ve paketlenmiş skill'ler için `skills.allowBundled` tarafından engellenmiyorsa).

<Note>
Eski `metadata.clawdbot` blokları, `metadata.openclaw` yoksa hâlâ kabul edilir; böylece daha önce kurulmuş skill'ler bağımlılık geçitlerini ve kurucu ipuçlarını korur. Yeni ve güncellenmiş skill'ler `metadata.openclaw` kullanmalıdır.
</Note>

### Sandboxing notları

- `requires.bins`, skill yükleme zamanında **ana makinede** kontrol edilir.
- Bir aracı sandbox içindeyse, ikili dosya **kapsayıcının içinde de** bulunmalıdır. Bunu `agents.defaults.sandbox.docker.setupCommand` (veya özel bir imaj) üzerinden kurun. `setupCommand`, kapsayıcı oluşturulduktan sonra bir kez çalışır. Paket kurulumları ayrıca ağ çıkışı, yazılabilir bir kök FS ve sandbox içinde bir root kullanıcı gerektirir.
- Örnek: `summarize` skill'i (`skills/summarize/SKILL.md`) orada çalışması için `summarize` CLI'ın sandbox kapsayıcısında bulunmasını gerektirir.

### Kurucu belirtimleri

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
              "label": "Gemini CLI'ı kur (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="Kurucu seçimi kuralları">
    - Birden fazla kurucu listelenmişse gateway tek bir tercih edilen seçeneği seçer (varsa brew, aksi takdirde node).
    - Tüm kurucular `download` ise OpenClaw, mevcut yapıları görebilmeniz için her girdiyi listeler.
    - Kurucu belirtimleri, seçenekleri platforma göre filtrelemek için `os: ["darwin"|"linux"|"win32"]` içerebilir.
    - Node kurulumları, `openclaw.json` içindeki `skills.install.nodeManager` ayarına uyar (varsayılan: npm; seçenekler: npm/pnpm/yarn/bun). Bu yalnızca skill kurulumlarını etkiler; Gateway çalışma zamanı yine de Node olmalıdır — Bun, WhatsApp/Telegram için önerilmez.
    - Gateway destekli kurucu seçimi tercih odaklıdır: kurucu belirtimleri türleri karıştırıyorsa OpenClaw, `skills.install.preferBrew` etkinken ve `brew` mevcutsa önce Homebrew'ı, sonra `uv`'yi, sonra yapılandırılmış node yöneticisini, ardından `go` veya `download` gibi diğer geri dönüşleri tercih eder.
    - Her kurulum belirtimi `download` ise OpenClaw, tek bir tercih edilen kurucuya daraltmak yerine tüm indirme seçeneklerini gösterir.
  </Accordion>
  <Accordion title="Kurucu başına ayrıntılar">
    - **Go kurulumları:** `go` yoksa ve `brew` varsa gateway önce Homebrew ile Go'yu kurar ve mümkün olduğunda `GOBIN` değerini Homebrew'ın `bin` dizinine ayarlar.
    - **İndirme kurulumları:** `url` (zorunlu), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (varsayılan: arşiv algılanırsa otomatik), `stripComponents`, `targetDir` (varsayılan: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
</AccordionGroup>

## Yapılandırma geçersiz kılmaları

Paketlenmiş ve yönetilen skill'ler, `~/.openclaw/openclaw.json` içindeki
`skills.entries` altında açılıp kapatılabilir ve ortam değerleri alabilir:

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

<ParamField path="enabled" type="boolean">
  `false`, skill paketlenmiş veya kurulu olsa bile onu devre dışı bırakır.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` bildiren skill'ler için kolaylık sağlar. Düz metin veya SecretRef destekler.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Yalnızca değişken süreçte zaten ayarlı değilse enjekte edilir.
</ParamField>
<ParamField path="config" type="object">
  Özel skill başına alanlar için isteğe bağlı çanta. Özel anahtarlar burada bulunmalıdır.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Yalnızca **paketlenmiş** skill'ler için isteğe bağlı izin listesi. Ayarlanırsa yalnızca listedeki paketlenmiş skill'ler uygun olur (yönetilen/çalışma alanı skill'leri etkilenmez).
</ParamField>

Skill adı tire içeriyorsa anahtarı tırnak içine alın (JSON5 tırnaklı
anahtarlara izin verir). Yapılandırma anahtarları varsayılan olarak **skill adıyla**
eşleşir — bir skill `metadata.openclaw.skillKey` tanımlıyorsa `skills.entries` altında o anahtarı kullanın.

<Note>
OpenClaw içinde stok görsel oluşturma/düzenleme için paketlenmiş bir skill yerine
`agents.defaults.imageGenerationModel` ile çekirdek
`image_generate` aracını kullanın. Buradaki skill örnekleri özel veya üçüncü taraf
iş akışları içindir. Yerel görsel analizi için
`agents.defaults.imageModel` ile `image` aracını kullanın. `openai/*`, `google/*`,
`fal/*` veya başka bir sağlayıcıya özgü görsel modeli seçerseniz, o sağlayıcının
kimlik doğrulamasını/API anahtarını da ekleyin.
</Note>

## Ortam enjeksiyonu

Bir aracı çalıştırması başladığında OpenClaw:

1. Skill meta verilerini okur.
2. `skills.entries.<key>.env` ve `skills.entries.<key>.apiKey` değerlerini `process.env` içine uygular.
3. Sistem istemini **uygun** skill'lerle oluşturur.
4. Çalıştırma bittikten sonra özgün ortamı geri yükler.

Ortam enjeksiyonu, genel kabuk ortamı değil, **aracı çalıştırmasına
özgüdür**.

Paketlenmiş `claude-cli` arka ucu için OpenClaw ayrıca aynı
uygun anlık görüntüyü geçici bir Claude Code Plugin'i olarak somutlaştırır
ve bunu `--plugin-dir` ile iletir. Claude Code daha sonra yerel skill çözücüsünü kullanabilir; OpenClaw ise öncelik, aracı başına izin listeleri, geçitleme ve
`skills.entries.*` env/API anahtarı enjeksiyonuna sahip olmaya devam eder. Diğer CLI arka uçları yalnızca istem kataloğunu kullanır.

## Anlık görüntüler ve yenileme

OpenClaw, bir oturum başladığında uygun skill'lerin **anlık görüntüsünü alır**
ve aynı oturumdaki sonraki sıralar için bu listeyi yeniden kullanır. Skill'lerde veya yapılandırmada yapılan değişiklikler bir sonraki yeni oturumda etkili olur.

Skill'ler iki durumda oturum ortasında yenilenebilir:

- Skills izleyicisi etkindir.
- Yeni bir uygun uzak node görünür.

Bunu bir **hot reload** gibi düşünün: yenilenen liste bir sonraki
aracı sırasında alınır. Bu oturum için etkili aracı skill izin listesi değişirse, OpenClaw görünür skill'lerin geçerli aracıyla uyumlu kalması için anlık görüntüyü yeniler.

### Skills izleyicisi

Varsayılan olarak OpenClaw, skill klasörlerini izler ve `SKILL.md` dosyaları değiştiğinde skills anlık görüntüsünü artırır. `skills.load` altında yapılandırın:

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

Gateway Linux üzerinde çalışıyor ancak
`system.run` izinli bir **macOS node** bağlıysa (yürütme onayları güvenliği `deny` olarak ayarlanmamışsa),
OpenClaw gerekli ikili dosyalar o node üzerinde mevcut olduğunda yalnızca macOS'a özgü skill'leri uygun kabul edebilir. Aracının bu skill'leri `host=node` ile `exec` aracı üzerinden yürütmesi gerekir.

Bu, node'un komut desteğini bildirmesine ve
`system.which` veya `system.run` üzerinden bir ikili dosya yoklamasına dayanır.
Çevrimdışı node'lar yalnızca uzak olan skill'leri görünür yapmaz. Bağlı bir node ikili dosya yoklamalarına yanıt vermeyi bırakırsa OpenClaw önbelleğe alınmış ikili eşleşmelerini temizler, böylece aracılar artık şu anda orada çalışamayacak skill'leri görmez.

## Token etkisi

Skill'ler uygun olduğunda OpenClaw, kullanılabilir
skill'lerin sıkıştırılmış bir XML listesini sistem istemine enjekte eder (`pi-coding-agent` içindeki `formatSkillsForPrompt` aracılığıyla). Maliyeti deterministiktir:

- **Temel ek yük** (yalnızca ≥1 skill olduğunda): 195 karakter.
- **Skill başına:** 97 karakter + XML'den kaçırılmış `<name>`, `<description>` ve `<location>` değerlerinin uzunluğu.

Formül (karakter):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML kaçırma, `& < > " '` karakterlerini varlıklara (`&amp;`, `&lt;` vb.)
genişletir ve uzunluğu artırır. Token sayıları model tokenizer'ına göre değişir. Yaklaşık
OpenAI tarzı tahmin ~4 karakter/token olduğundan **97 karakter ≈ 24 token** eder;
buna gerçek alan uzunluklarınız da eklenir.

## Yönetilen Skills yaşam döngüsü

OpenClaw, kurulumla birlikte (npm paketi veya OpenClaw.app) temel bir skill kümesini **paketlenmiş skill'ler** olarak gönderir. `~/.openclaw/skills`, yerel geçersiz kılmalar için vardır — örneğin, paketlenmiş kopyayı değiştirmeden bir skill'i sabitlemek veya yamalamak için. Çalışma alanı skill'leri kullanıcıya aittir ve ad çakışmalarında her ikisini de geçersiz kılar.

## Daha fazla skill mi arıyorsunuz?

[https://clawhub.ai](https://clawhub.ai) sitesine göz atın. Tam yapılandırma
şeması: [Skills config](/tr/tools/skills-config).

## İlgili

- [ClawHub](/tr/tools/clawhub) — herkese açık skill kayıt defteri
- [Creating skills](/tr/tools/creating-skills) — özel skill'ler oluşturma
- [Plugins](/tr/tools/plugin) — Plugin sistemi genel bakışı
- [Skill Workshop Plugin](/tr/plugins/skill-workshop) — aracı çalışmasından skill üretme
- [Skills config](/tr/tools/skills-config) — skill yapılandırma başvurusu
- [Slash commands](/tr/tools/slash-commands) — tüm kullanılabilir eğik çizgi komutları
