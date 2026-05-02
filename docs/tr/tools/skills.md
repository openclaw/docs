---
read_when:
    - Skills ekleme veya değiştirme
    - Beceri erişim kısıtlamalarını, izin verilenler listelerini veya yükleme kurallarını değiştirme
    - Skills önceliğini ve anlık görüntü davranışını anlama
sidebarTitle: Skills
summary: 'Skills: yönetilen ile çalışma alanı, geçit kuralları, ajan izin listeleri ve yapılandırma bağlantıları'
title: Skills
x-i18n:
    generated_at: "2026-05-02T21:01:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85d9a5305216abd277721a9cf46404505ac6bedcad78417e10862bf7f54591ea
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw, ajana araçları nasıl kullanacağını öğretmek için **[AgentSkills](https://agentskills.io) uyumlu** beceri
klasörlerini kullanır. Her beceri, YAML frontmatter ve talimatlar içeren
bir `SKILL.md` dosyasına sahip bir dizindir. OpenClaw, paketle gelen
becerileri ve isteğe bağlı yerel geçersiz kılmaları yükler; bunları yükleme
sırasında ortama, yapılandırmaya ve ikili dosya varlığına göre filtreler.

## Konumlar ve öncelik

OpenClaw becerileri şu kaynaklardan yükler, **en yüksek öncelik önce gelir**:

| #   | Kaynak                 | Yol                              |
| --- | ---------------------- | -------------------------------- |
| 1   | Çalışma alanı becerileri | `<workspace>/skills`             |
| 2   | Proje ajanı becerileri | `<workspace>/.agents/skills`     |
| 3   | Kişisel ajan becerileri | `~/.agents/skills`               |
| 4   | Yönetilen/yerel beceriler | `~/.openclaw/skills`             |
| 5   | Paketle gelen beceriler | kurulumla birlikte gelir         |
| 6   | Ek beceri klasörleri   | `skills.load.extraDirs` (yapılandırma) |

Bir beceri adı çakışırsa, en yüksek kaynak kazanır.

Codex CLI'nin yerel `$CODEX_HOME/skills` dizini bu OpenClaw beceri
köklerinden biri değildir. Codex harness modunda, yerel uygulama sunucusu
başlatmaları ajan başına izole Codex evleri kullanır; bu nedenle kişisel
Codex CLI becerileri örtük olarak yüklenmez. Bunları envanterlemek için
`openclaw migrate codex --dry-run` kullanın ve mevcut OpenClaw ajan çalışma
alanına kopyalamadan önce etkileşimli onay kutusu istemiyle beceri
dizinlerini seçmek için `openclaw migrate codex` kullanın. Etkileşimsiz
çalıştırmalarda, kopyalanacak tam beceriler için `--skill <name>` seçeneğini
tekrarlayın.

## Ajan başına ve paylaşılan beceriler

**Çok ajanlı** kurulumlarda her ajanın kendi çalışma alanı vardır:

| Kapsam               | Yol                                         | Görünür olduğu yer          |
| -------------------- | ------------------------------------------- | --------------------------- |
| Ajan başına          | `<workspace>/skills`                        | Yalnızca o ajan             |
| Proje ajanı          | `<workspace>/.agents/skills`                | Yalnızca o çalışma alanının ajanı |
| Kişisel ajan         | `~/.agents/skills`                          | O makinedeki tüm ajanlar    |
| Paylaşılan yönetilen/yerel | `~/.openclaw/skills`                        | O makinedeki tüm ajanlar    |
| Paylaşılan ek dizinler | `skills.load.extraDirs` (en düşük öncelik) | O makinedeki tüm ajanlar    |

Birden çok yerde aynı ad → en yüksek kaynak kazanır. Çalışma alanı,
proje ajanını; proje ajanı, kişisel ajanı; kişisel ajan, yönetilen/yereli;
yönetilen/yerel, paketle geleni; paketle gelen, ek dizinleri geçer.

## Ajan beceri izin listeleri

Beceri **konumu** ve beceri **görünürlüğü** ayrı denetimlerdir.
Konum/öncelik, aynı adlı becerinin hangi kopyasının kazanacağını belirler;
ajan izin listeleri ise bir ajanın gerçekte hangi becerileri kullanabileceğini
belirler.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // github, weather öğelerini devralır
      { id: "docs", skills: ["docs-search"] }, // varsayılanların yerine geçer
      { id: "locked-down", skills: [] }, // beceri yok
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="İzin listesi kuralları">
    - Varsayılan olarak sınırsız beceriler için `agents.defaults.skills` öğesini atlayın.
    - `agents.defaults.skills` öğesini devralmak için `agents.list[].skills` öğesini atlayın.
    - Beceri olmaması için `agents.list[].skills: []` ayarlayın.
    - Boş olmayan bir `agents.list[].skills` listesi, o ajan için **nihai** kümedir — varsayılanlarla birleştirilmez.
    - Etkin izin listesi istem oluşturma, beceri slash-komutu keşfi, sandbox eşitlemesi ve beceri anlık görüntüleri genelinde uygulanır.

  </Accordion>
</AccordionGroup>

## Plugin’ler ve beceriler

Plugin’ler, `openclaw.plugin.json` içinde `skills` dizinlerini listeleyerek
kendi becerilerini gönderebilir (yollar Plugin köküne görelidir). Plugin
becerileri, Plugin etkinleştirildiğinde yüklenir. Bu, araç açıklaması için
fazla uzun olan ancak Plugin yüklendiğinde kullanılabilir olması gereken
araca özgü işletim kılavuzları için doğru yerdir — örneğin tarayıcı
Plugin’i, çok adımlı tarayıcı denetimi için bir `browser-automation`
becerisi gönderir.

Plugin beceri dizinleri, `skills.load.extraDirs` ile aynı düşük öncelikli
yolda birleştirilir; bu nedenle aynı adlı paketle gelen, yönetilen, ajan
veya çalışma alanı becerisi bunların üzerine yazar. Bunları Plugin’in
yapılandırma girdisindeki `metadata.openclaw.requires.config` üzerinden
kapılayabilirsiniz.

Keşif/yapılandırma için [Plugin’ler](/tr/tools/plugin) ve bu becerilerin
öğrettiği araç yüzeyi için [Araçlar](/tr/tools) bölümüne bakın.

## Beceri Atölyesi

İsteğe bağlı, deneysel **Beceri Atölyesi** Plugin’i, ajan çalışması sırasında
gözlemlenen yeniden kullanılabilir prosedürlerden çalışma alanı becerileri
oluşturabilir veya güncelleyebilir. Varsayılan olarak devre dışıdır ve
`plugins.entries.skill-workshop` üzerinden açıkça etkinleştirilmelidir.

Beceri Atölyesi yalnızca `<workspace>/skills` içine yazar, oluşturulan
içeriği tarar, bekleyen onayı veya otomatik güvenli yazmaları destekler,
güvenli olmayan önerileri karantinaya alır ve başarılı yazmalardan sonra
beceri anlık görüntüsünü yenileyerek yeni becerilerin Gateway yeniden
başlatması olmadan kullanılabilir olmasını sağlar.

Bunu _"bir dahaki sefere GIF atfını doğrula"_ gibi düzeltmeler veya medya
QA kontrol listeleri gibi zor kazanılmış iş akışları için kullanın.
Bekleyen onayla başlayın; otomatik yazmaları yalnızca önerilerini inceledikten
sonra güvenilir çalışma alanlarında kullanın. Tam kılavuz:
[Beceri Atölyesi Plugin’i](/tr/plugins/skill-workshop).

## ClawHub (kurulum ve eşitleme)

[ClawHub](https://clawhub.ai), OpenClaw için herkese açık beceri kayıt
defteridir. Keşfetme/kurma/güncelleme için yerel `openclaw skills`
komutlarını veya yayınlama/eşitleme iş akışları için ayrı `clawhub` CLI’ını
kullanın. Tam kılavuz: [ClawHub](/tr/tools/clawhub).

| Eylem                              | Komut                                  |
| ---------------------------------- | -------------------------------------- |
| Çalışma alanına beceri kurma       | `openclaw skills install <skill-slug>` |
| Kurulu tüm becerileri güncelleme   | `openclaw skills update --all`         |
| Eşitleme (tara + güncellemeleri yayımla) | `clawhub sync --all`                   |

Yerel `openclaw skills install`, etkin çalışma alanının `skills/` dizinine
kurar. Ayrı `clawhub` CLI’ı da mevcut çalışma dizininizin altındaki
`./skills` içine kurar (veya yapılandırılmış OpenClaw çalışma alanına geri
döner). OpenClaw bunu bir sonraki oturumda `<workspace>/skills` olarak alır.
Yapılandırılmış beceri kökleri, `skills/<group>/<skill>/SKILL.md` gibi tek
bir gruplama düzeyini de destekler; böylece ilgili üçüncü taraf beceriler,
geniş özyinelemeli tarama olmadan paylaşılan bir klasör altında tutulabilir.

ClawHub beceri sayfaları, kurulumdan önce en son güvenlik taraması durumunu;
VirusTotal, ClawScan ve statik analiz için tarayıcı ayrıntı sayfalarıyla
birlikte gösterir. `openclaw skills install <slug>` yalnızca kurulum yolu
olarak kalır; yayıncılar yanlış pozitifleri ClawHub panosu veya
`clawhub skill rescan <slug>` üzerinden giderir.

## Güvenlik

<Warning>
Üçüncü taraf becerileri **güvenilmeyen kod** olarak ele alın. Etkinleştirmeden
önce okuyun. Güvenilmeyen girdiler ve riskli araçlar için sandbox’lı çalıştırmaları
tercih edin. Ajan tarafındaki denetimler için [Sandboxing](/tr/gateway/sandboxing)
bölümüne bakın.
</Warning>

- Çalışma alanı ve ek dizin beceri keşfi, yalnızca çözümlenen gerçek yolu yapılandırılmış kökün içinde kalan beceri köklerini ve `SKILL.md` dosyalarını kabul eder.
- Gateway destekli beceri bağımlılığı kurulumları (`skills.install`, ilk katılım ve Skills ayarları kullanıcı arayüzü), kurucu meta verilerini yürütmeden önce yerleşik tehlikeli kod tarayıcısını çalıştırır. `critical` bulguları, çağıran açıkça tehlikeli geçersiz kılmayı ayarlamadıkça varsayılan olarak engellenir; şüpheli bulgular ise yine yalnızca uyarır.
- `openclaw skills install <slug>` farklıdır — bir ClawHub beceri klasörünü çalışma alanına indirir ve yukarıdaki kurucu meta verisi yolunu kullanmaz.
- `skills.entries.*.env` ve `skills.entries.*.apiKey`, sırları o ajan turu için **host** sürecine enjekte eder (sandbox’a değil). Sırları istemlerden ve günlüklerden uzak tutun.

Daha geniş bir tehdit modeli ve kontrol listeleri için [Güvenlik](/tr/gateway/security)
bölümüne bakın.

## SKILL.md biçimi

`SKILL.md` en azından şunları içermelidir:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw, düzen/amaç için AgentSkills belirtimini izler. Gömülü ajan
tarafından kullanılan ayrıştırıcı yalnızca **tek satırlı** frontmatter
anahtarlarını destekler; `metadata` bir **tek satırlı JSON nesnesi** olmalıdır.
Beceri klasörü yoluna başvurmak için talimatlarda `{baseDir}` kullanın.

### İsteğe bağlı frontmatter anahtarları

<ParamField path="homepage" type="string">
  macOS Skills kullanıcı arayüzünde "Web sitesi" olarak gösterilen URL. `metadata.openclaw.homepage` üzerinden de desteklenir.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  `true` olduğunda, beceri bir kullanıcı slash komutu olarak gösterilir.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` olduğunda, OpenClaw becerinin talimatlarını ajanın normal isteminin
  dışında tutar. Beceri yine kurulu kalır ve `user-invocable` da `true`
  olduğunda slash komutu olarak açıkça çalıştırılabilir.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  `tool` olarak ayarlandığında, slash komutu modeli atlar ve doğrudan bir araca gönderilir.
</ParamField>
<ParamField path="command-tool" type="string">
  `command-dispatch: tool` ayarlandığında çağrılacak araç adı.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Araç gönderimi için ham args dizesini araca iletir (çekirdek ayrıştırma yok). Araç `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` ile çağrılır.
</ParamField>

## Kapılama (yükleme zamanı filtreleri)

OpenClaw, becerileri yükleme sırasında `metadata` (tek satırlı JSON)
kullanarak filtreler:

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
  `true` olduğunda, beceriyi her zaman dahil et (diğer kapıları atla).
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills kullanıcı arayüzü tarafından kullanılan isteğe bağlı emoji.
</ParamField>
<ParamField path="homepage" type="string">
  macOS Skills kullanıcı arayüzünde "Web sitesi" olarak gösterilen isteğe bağlı URL.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  İsteğe bağlı platform listesi. Ayarlanırsa, beceri yalnızca bu işletim sistemlerinde uygundur.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Her biri `PATH` üzerinde mevcut olmalıdır.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  En az biri `PATH` üzerinde mevcut olmalıdır.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Env var mevcut olmalı veya yapılandırmada sağlanmalıdır.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Doğru değerli olması gereken `openclaw.json` yollarının listesi.
</ParamField>
<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` ile ilişkili env var adı.
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills kullanıcı arayüzü tarafından kullanılan isteğe bağlı kurucu belirtimleri (brew/node/go/uv/download).
</ParamField>

`metadata.openclaw` yoksa, beceri her zaman uygundur (yapılandırmada devre
dışı bırakılmadıkça veya paketle gelen beceriler için `skills.allowBundled`
tarafından engellenmedikçe).

<Note>
Eski `metadata.clawdbot` blokları, `metadata.openclaw` olmadığında hâlâ
kabul edilir; böylece daha eski kurulu beceriler bağımlılık kapılarını ve
kurucu ipuçlarını korur. Yeni ve güncellenmiş beceriler `metadata.openclaw`
kullanmalıdır.
</Note>

### Sandbox notları

- `requires.bins`, beceri yükleme sırasında **host** üzerinde denetlenir.
- Bir ajan sandbox’lıysa, ikili dosya **container içinde** de mevcut olmalıdır. `agents.defaults.sandbox.docker.setupCommand` (veya özel bir imaj) üzerinden kurun. `setupCommand`, container oluşturulduktan sonra bir kez çalışır. Paket kurulumları ayrıca ağ çıkışı, yazılabilir bir kök FS ve sandbox içinde root kullanıcı gerektirir.
- Örnek: `summarize` becerisi (`skills/summarize/SKILL.md`), orada çalışmak için sandbox container içinde `summarize` CLI’ına ihtiyaç duyar.

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
  <Accordion title="Installer selection rules">
    - Birden fazla yükleyici listelenirse gateway tek bir tercih edilen seçenek seçer (kullanılabiliyorsa brew, aksi halde node).
    - Tüm yükleyiciler `download` ise OpenClaw kullanılabilir yapıtları görebilmeniz için her girdiyi listeler.
    - Yükleyici özellikleri, seçenekleri platforma göre filtrelemek için `os: ["darwin"|"linux"|"win32"]` içerebilir.
    - Node kurulumları `openclaw.json` içindeki `skills.install.nodeManager` değerine uyar (varsayılan: npm; seçenekler: npm/pnpm/yarn/bun). Bu yalnızca skill kurulumlarını etkiler; Gateway çalışma zamanı yine Node olmalıdır — Bun, WhatsApp/Telegram için önerilmez.
    - Gateway destekli yükleyici seçimi tercihe dayalıdır: kurulum özellikleri türleri karıştırdığında OpenClaw, `skills.install.preferBrew` etkinse ve `brew` varsa Homebrew'i, ardından `uv`'yi, ardından yapılandırılmış node yöneticisini, ardından `go` veya `download` gibi diğer geri dönüşleri tercih eder.
    - Her kurulum özelliği `download` ise OpenClaw tek bir tercih edilen yükleyiciye indirgemek yerine tüm indirme seçeneklerini gösterir.

  </Accordion>
  <Accordion title="Per-installer details">
    - **Go kurulumları:** `go` eksikse ve `brew` kullanılabiliyorsa gateway önce Homebrew aracılığıyla Go kurar ve mümkün olduğunda `GOBIN` değerini Homebrew'in `bin` dizinine ayarlar.
    - **İndirme kurulumları:** `url` (zorunlu), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (varsayılan: arşiv algılandığında auto), `stripComponents`, `targetDir` (varsayılan: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Yapılandırma geçersiz kılmaları

Paketle gelen ve yönetilen skill'ler, `~/.openclaw/openclaw.json`
içindeki `skills.entries` altında açılıp kapatılabilir ve env değerleriyle sağlanabilir:

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
  Paketle gelen `coding-agent` skill'i isteğe bağlıdır: ajanlara açmadan önce
  `skills.entries.coding-agent.enabled: true` ayarlayın, ardından
  `claude`, `codex`, `opencode` veya `pi` içinden birinin kurulu ve
  kendi CLI'si için kimliği doğrulanmış olduğundan emin olun.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` bildiren skill'ler için kolaylık sağlar. Düz metin veya SecretRef destekler.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Yalnızca değişken süreçte zaten ayarlı değilse enjekte edilir.
</ParamField>
<ParamField path="config" type="object">
  Skill'e özel alanlar için isteğe bağlı torba. Özel anahtarlar burada bulunmalıdır.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Yalnızca **paketle gelen** skill'ler için isteğe bağlı izin listesi. Ayarlanırsa yalnızca listedeki paketle gelen skill'ler uygun olur (yönetilen/çalışma alanı skill'leri etkilenmez).
</ParamField>

Skill adı tire içeriyorsa anahtarı tırnak içine alın (JSON5 tırnaklı
anahtarlara izin verir). Yapılandırma anahtarları varsayılan olarak
**skill adı** ile eşleşir — bir skill `metadata.openclaw.skillKey`
tanımlıyorsa `skills.entries` altında bu anahtarı kullanın.

<Note>
OpenClaw içinde stok görüntü oluşturma/düzenleme için paketle gelen bir
skill yerine `agents.defaults.imageGenerationModel` ile çekirdek
`image_generate` aracını kullanın. Buradaki skill örnekleri özel veya üçüncü taraf
iş akışları içindir. Yerel görüntü analizi için
`agents.defaults.imageModel` ile `image` aracını kullanın. `openai/*`, `google/*`,
`fal/*` veya sağlayıcıya özgü başka bir görüntü modeli seçerseniz o sağlayıcının
auth/API anahtarını da ekleyin.
</Note>

## Ortam enjeksiyonu

Bir ajan çalıştırması başladığında OpenClaw:

1. Skill metadata'sını okur.
2. `skills.entries.<key>.env` ve `skills.entries.<key>.apiKey` değerlerini `process.env` içine uygular.
3. Sistem istemini **uygun** skill'lerle oluşturur.
4. Çalıştırma bittikten sonra özgün ortamı geri yükler.

Ortam enjeksiyonu genel bir shell ortamı değil, **ajan çalıştırmasıyla sınırlıdır**.

Paketle gelen `claude-cli` arka ucu için OpenClaw aynı uygun anlık görüntüyü
geçici bir Claude Code Plugin'i olarak da oluşturur ve bunu `--plugin-dir` ile
geçirir. Claude Code daha sonra yerel skill çözümleyicisini kullanabilir; OpenClaw
ise öncelik, ajan başına izin listeleri, gating ve `skills.entries.*`
env/API anahtarı enjeksiyonunu yönetmeye devam eder. Diğer CLI arka uçları yalnızca
istem kataloğunu kullanır.

## Anlık görüntüler ve yenileme

OpenClaw, uygun skill'lerin anlık görüntüsünü **bir oturum başladığında** alır ve
aynı oturumdaki sonraki turlar için bu listeyi yeniden kullanır. Skill veya
yapılandırma değişiklikleri bir sonraki yeni oturumda etkili olur.

Skill'ler iki durumda oturum ortasında yenilenebilir:

- Skill izleyicisi etkindir.
- Yeni bir uygun uzak node görünür.

Bunu bir **hot reload** olarak düşünün: yenilenen liste sonraki ajan turunda
kullanılır. Etkili ajan skill izin listesi o oturum için değişirse OpenClaw
anlık görüntüyü yeniler, böylece görünür skill'ler geçerli ajanla hizalı kalır.

### Skill izleyicisi

Varsayılan olarak OpenClaw skill klasörlerini izler ve `SKILL.md` dosyaları
değiştiğinde skill anlık görüntüsünü artırır. `skills.load` altında yapılandırın:

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

Gateway Linux üzerinde çalışıyorsa ancak `system.run` izni olan
(Exec onayları güvenliği `deny` olarak ayarlı olmayan) bir **macOS node'u**
bağlıysa, OpenClaw gerekli ikili dosyalar o node üzerinde bulunduğunda
yalnızca macOS skill'lerini uygun kabul edebilir. Ajan, bu skill'leri
`host=node` ile `exec` aracı üzerinden yürütmelidir.

Bu, node'un komut desteğini bildirmesine ve `system.which` veya
`system.run` aracılığıyla bir bin sondasına dayanır. Çevrimdışı node'lar
yalnızca uzak skill'leri görünür yapmaz. Bağlı bir node bin sondalarına
yanıt vermeyi durdurursa OpenClaw önbelleğe alınmış bin eşleşmelerini temizler;
böylece ajanlar şu anda orada çalıştırılamayan skill'leri artık görmez.

## Token etkisi

Skill'ler uygun olduğunda OpenClaw, kullanılabilir skill'lerin kompakt bir XML listesini
sistem istemine enjekte eder (`pi-coding-agent` içindeki `formatSkillsForPrompt`
aracılığıyla). Maliyet deterministiktir:

- **Temel ek yük** (yalnızca ≥1 skill olduğunda): 195 karakter.
- **Skill başına:** 97 karakter + XML kaçışlı `<name>`, `<description>` ve `<location>` değerlerinin uzunluğu.

Formül (karakter):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML kaçışlama `& < > " '` karakterlerini entity'lere (`&amp;`, `&lt;` vb.)
genişleterek uzunluğu artırır. Token sayıları model tokenizer'ına göre değişir. Kabaca
OpenAI tarzı tahmin ~4 karakter/token olduğundan **97 karakter ≈ 24 token** eder;
buna skill başına gerçek alan uzunluklarınız eklenir.

## Yönetilen skill yaşam döngüsü

OpenClaw, kurulumla (npm paketi veya OpenClaw.app) birlikte **paketle gelen skill'ler**
olarak temel bir skill seti gönderir. `~/.openclaw/skills`, yerel geçersiz kılmalar için
vardır — örneğin paketle gelen kopyayı değiştirmeden bir skill'i sabitlemek veya
yamalamak. Çalışma alanı skill'leri kullanıcıya aittir ve ad çakışmalarında
ikisini de geçersiz kılar.

## Daha fazla skill mi arıyorsunuz?

[https://clawhub.ai](https://clawhub.ai) adresine göz atın. Tam yapılandırma
şeması: [Skill yapılandırması](/tr/tools/skills-config).

## İlgili

- [ClawHub](/tr/tools/clawhub) — genel skill kayıt defteri
- [Skill oluşturma](/tr/tools/creating-skills) — özel skill'ler oluşturma
- [Plugin'ler](/tr/tools/plugin) — Plugin sistemi genel bakışı
- [Skill Workshop Plugin'i](/tr/plugins/skill-workshop) — ajan çalışmasından skill'ler oluşturma
- [Skill yapılandırması](/tr/tools/skills-config) — skill yapılandırma başvurusu
- [Slash komutları](/tr/tools/slash-commands) — kullanılabilir tüm slash komutları
