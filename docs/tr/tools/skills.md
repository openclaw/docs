---
read_when:
    - Skills ekleme veya değiştirme
    - Beceri geçitlemesini, izin listelerini veya yükleme kurallarını değiştirme
    - Skill önceliğini ve anlık görüntü davranışını anlama
sidebarTitle: Skills
summary: 'Skills: yönetilen ve çalışma alanı, geçit kuralları, ajan izin listeleri ve yapılandırma bağlantıları'
title: Skills
x-i18n:
    generated_at: "2026-04-30T20:05:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58d690786756bd3539940aae9f2abcb8a497798ed7b6afeb5e6d6e255fcf257
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw, agente araçları nasıl kullanacağını öğretmek için **[AgentSkills](https://agentskills.io) uyumlu** beceri
klasörleri kullanır. Her beceri, YAML frontmatter ve talimatlar içeren
bir `SKILL.md` dosyası barındıran bir dizindir. OpenClaw, paketle gelen
becerileri ve isteğe bağlı yerel geçersiz kılmaları yükler; bunları yükleme
zamanında ortama, yapılandırmaya ve ikili dosya varlığına göre filtreler.

## Konumlar ve öncelik

OpenClaw becerileri şu kaynaklardan yükler, **en yüksek öncelik ilk sırada**:

| #   | Kaynak                    | Yol                              |
| --- | ------------------------- | -------------------------------- |
| 1   | Çalışma alanı becerileri  | `<workspace>/skills`             |
| 2   | Proje agent becerileri    | `<workspace>/.agents/skills`     |
| 3   | Kişisel agent becerileri  | `~/.agents/skills`               |
| 4   | Yönetilen/yerel beceriler | `~/.openclaw/skills`             |
| 5   | Paketle gelen beceriler   | kurulumla birlikte gelir         |
| 6   | Ek beceri klasörleri      | `skills.load.extraDirs` (config) |

Bir beceri adı çakışırsa, en yüksek kaynak kazanır.

Codex CLI'nin yerel `$CODEX_HOME/skills` dizini bu OpenClaw beceri
köklerinden biri değildir. Codex harness modunda, yerel app-server başlatmaları
agent başına izole Codex home'ları kullanır; bu yüzden kişisel Codex CLI
becerileri örtük olarak yüklenmez. Bunların envanterini çıkarmak için
`openclaw migrate codex --dry-run` kullanın ve mevcut OpenClaw agent çalışma
alanına kopyalamadan önce etkileşimli onay kutusu istemiyle beceri dizinlerini
seçmek için `openclaw migrate codex` kullanın. Etkileşimsiz çalıştırmalar için,
kopyalanacak tam beceriler adına `--skill <name>` seçeneğini tekrarlayın.

## Agent başına ve paylaşılan beceriler

**Çoklu agent** kurulumlarında her agent'in kendi çalışma alanı vardır:

| Kapsam                | Yol                                         | Görünür olduğu yer              |
| --------------------- | ------------------------------------------- | ------------------------------- |
| Agent başına          | `<workspace>/skills`                        | Yalnızca o agent                |
| Proje agent'i         | `<workspace>/.agents/skills`                | Yalnızca o çalışma alanı agent'i |
| Kişisel agent         | `~/.agents/skills`                          | O makinedeki tüm agent'ler      |
| Paylaşılan yönetilen/yerel | `~/.openclaw/skills`                    | O makinedeki tüm agent'ler      |
| Paylaşılan ek dizinler | `skills.load.extraDirs` (en düşük öncelik) | O makinedeki tüm agent'ler      |

Aynı ad birden fazla yerdeyse → en yüksek kaynak kazanır. Çalışma alanı,
proje agent'ini; proje agent'i, kişisel agent'i; kişisel agent, yönetilen/yereli;
yönetilen/yerel, paketle geleni; paketle gelen de ek dizinleri geçer.

## Agent beceri izin listeleri

Beceri **konumu** ve beceri **görünürlüğü** ayrı denetimlerdir.
Konum/öncelik aynı ada sahip becerinin hangi kopyasının kazanacağını belirler;
agent izin listeleri ise bir agent'in hangi becerileri gerçekten kullanabileceğini
belirler.

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
    - Varsayılan olarak kısıtlanmamış beceriler için `agents.defaults.skills` değerini atlayın.
    - `agents.defaults.skills` değerini devralmak için `agents.list[].skills` değerini atlayın.
    - Hiç beceri olmaması için `agents.list[].skills: []` ayarlayın.
    - Boş olmayan bir `agents.list[].skills` listesi, o agent için **nihai** kümedir — varsayılanlarla birleştirilmez.
    - Etkili izin listesi prompt oluşturma, beceri slash komutu keşfi, sandbox eşitlemesi ve beceri anlık görüntüleri genelinde uygulanır.

  </Accordion>
</AccordionGroup>

## Plugin'ler ve beceriler

Plugin'ler kendi becerilerini, `openclaw.plugin.json` içinde `skills`
dizinlerini listeleyerek gönderebilir (yollar Plugin köküne görelidir).
Plugin becerileri, Plugin etkinleştirildiğinde yüklenir. Bu, araç açıklaması
için fazla uzun olan ancak Plugin yüklendiğinde kullanılabilir olması gereken
araca özgü işletim kılavuzları için doğru yerdir; örneğin, tarayıcı
Plugin'i çok adımlı tarayıcı denetimi için bir `browser-automation` becerisi
gönderir.

Plugin beceri dizinleri, `skills.load.extraDirs` ile aynı düşük öncelikli
yolla birleştirilir; bu yüzden aynı ada sahip paketle gelen, yönetilen,
agent veya çalışma alanı becerisi bunların üzerine yazar. Bunları Plugin'in
config girdisindeki `metadata.openclaw.requires.config` aracılığıyla geçitleyebilirsiniz.

Keşif/yapılandırma için [Plugin'ler](/tr/tools/plugin), bu becerilerin öğrettiği
araç yüzeyi için [Araçlar](/tr/tools) bölümüne bakın.

## Beceri Atölyesi

İsteğe bağlı, deneysel **Beceri Atölyesi** Plugin'i, agent çalışması sırasında
gözlemlenen yeniden kullanılabilir prosedürlerden çalışma alanı becerileri
oluşturabilir veya güncelleyebilir. Varsayılan olarak devre dışıdır ve
`plugins.entries.skill-workshop` üzerinden açıkça etkinleştirilmelidir.

Beceri Atölyesi yalnızca `<workspace>/skills` içine yazar, oluşturulan
içeriği tarar, bekleyen onayı veya otomatik güvenli yazmaları destekler,
güvenli olmayan önerileri karantinaya alır ve başarılı yazmalardan sonra
beceri anlık görüntüsünü yeniler; böylece yeni beceriler Gateway yeniden
başlatması olmadan kullanılabilir hale gelir.

Bunu _"bir dahaki sefere GIF atfını doğrula"_ gibi düzeltmeler veya medya
QA kontrol listeleri gibi zor edinilmiş iş akışları için kullanın. Bekleyen
onayla başlayın; otomatik yazmaları yalnızca önerilerini inceledikten sonra
güvenilir çalışma alanlarında kullanın. Tam kılavuz: [Beceri Atölyesi Plugin'i](/tr/plugins/skill-workshop).

## ClawHub (kurulum ve eşitleme)

[ClawHub](https://clawhub.ai), OpenClaw için herkese açık beceri kayıt defteridir.
Keşfetme/kurma/güncelleme için yerel `openclaw skills` komutlarını veya
yayınlama/eşitleme iş akışları için ayrı `clawhub` CLI'yi kullanın. Tam kılavuz:
[ClawHub](/tr/tools/clawhub).

| Eylem                              | Komut                                  |
| ---------------------------------- | -------------------------------------- |
| Çalışma alanına beceri kur         | `openclaw skills install <skill-slug>` |
| Kurulu tüm becerileri güncelle     | `openclaw skills update --all`         |
| Eşitle (tara + güncellemeleri yayınla) | `clawhub sync --all`                |

Yerel `openclaw skills install`, etkin çalışma alanındaki `skills/` dizinine
kurulum yapar. Ayrı `clawhub` CLI de geçerli çalışma dizininizin altındaki
`./skills` konumuna kurulum yapar (veya yapılandırılmış OpenClaw çalışma
alanına geri döner). OpenClaw bunu bir sonraki oturumda `<workspace>/skills`
olarak alır.
Yapılandırılmış beceri kökleri, `skills/<group>/<skill>/SKILL.md` gibi tek
bir gruplama seviyesini de destekler; böylece ilişkili üçüncü taraf beceriler
geniş özyinelemeli tarama olmadan paylaşılan bir klasör altında tutulabilir.

ClawHub beceri sayfaları, kurulumdan önce en son güvenlik taraması durumunu
VirusTotal, ClawScan ve statik analiz için tarayıcı ayrıntı sayfalarıyla birlikte
gösterir. `openclaw skills install <slug>` yalnızca kurulum yolu olarak kalır;
yayıncılar yanlış pozitifleri ClawHub panosu veya `clawhub skill rescan <slug>`
üzerinden düzeltir.

## Güvenlik

<Warning>
Üçüncü taraf becerileri **güvenilmeyen kod** olarak ele alın. Etkinleştirmeden
önce okuyun. Güvenilmeyen girdiler ve riskli araçlar için sandbox içinde
çalıştırmaları tercih edin. Agent tarafı denetimleri için
[Sandboxing](/tr/gateway/sandboxing) bölümüne bakın.
</Warning>

- Çalışma alanı ve ek dizin beceri keşfi yalnızca çözümlenen realpath'i yapılandırılmış kökün içinde kalan beceri köklerini ve `SKILL.md` dosyalarını kabul eder.
- Gateway destekli beceri bağımlılığı kurulumları (`skills.install`, onboarding ve Skills ayarları arayüzü), kurulum metadatasını çalıştırmadan önce yerleşik tehlikeli kod tarayıcısını çalıştırır. `critical` bulgular, çağıran taraf tehlikeli geçersiz kılmayı açıkça ayarlamadıkça varsayılan olarak engeller; şüpheli bulgular ise yine yalnızca uyarır.
- `openclaw skills install <slug>` farklıdır — bir ClawHub beceri klasörünü çalışma alanına indirir ve yukarıdaki kurulum metadata yolunu kullanmaz.
- `skills.entries.*.env` ve `skills.entries.*.apiKey`, sırları o agent turu için **host** sürecine enjekte eder (sandbox'a değil). Sırları prompt'lardan ve günlüklerden uzak tutun.

Daha geniş tehdit modeli ve kontrol listeleri için [Güvenlik](/tr/gateway/security) bölümüne bakın.

## SKILL.md biçimi

`SKILL.md` en az şunları içermelidir:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw düzen/amaç için AgentSkills spesifikasyonunu izler. Gömülü agent
tarafından kullanılan ayrıştırıcı yalnızca **tek satırlı** frontmatter
anahtarlarını destekler; `metadata` bir **tek satırlı JSON nesnesi** olmalıdır.
Beceri klasörü yoluna başvurmak için talimatlarda `{baseDir}` kullanın.

### İsteğe bağlı frontmatter anahtarları

<ParamField path="homepage" type="string">
  macOS Skills arayüzünde "Web sitesi" olarak gösterilen URL. `metadata.openclaw.homepage` üzerinden de desteklenir.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  `true` olduğunda beceri kullanıcı slash komutu olarak gösterilir.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` olduğunda beceri model prompt'undan çıkarılır (kullanıcı çağrısıyla hâlâ kullanılabilir).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  `tool` olarak ayarlandığında slash komutu modeli atlar ve doğrudan bir araca iletilir.
</ParamField>
<ParamField path="command-tool" type="string">
  `command-dispatch: tool` ayarlandığında çağrılacak araç adı.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Araç iletimi için ham argüman dizesini araca iletir (çekirdek ayrıştırma yoktur). Araç `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` ile çağrılır.
</ParamField>

## Geçitleme (yükleme zamanı filtreleri)

OpenClaw, becerileri yükleme zamanında `metadata` (tek satırlı JSON) kullanarak filtreler:

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
  `true` olduğunda beceriyi her zaman dahil et (diğer geçitleri atla).
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills arayüzü tarafından kullanılan isteğe bağlı emoji.
</ParamField>
<ParamField path="homepage" type="string">
  macOS Skills arayüzünde "Web sitesi" olarak gösterilen isteğe bağlı URL.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  İsteğe bağlı platform listesi. Ayarlanırsa beceri yalnızca bu OS'lerde uygun olur.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Her biri `PATH` üzerinde mevcut olmalıdır.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  En az biri `PATH` üzerinde mevcut olmalıdır.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Env var mevcut olmalı veya config içinde sağlanmalıdır.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Truthy olması gereken `openclaw.json` yollarının listesi.
</ParamField>
<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` ile ilişkili env var adı.
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills arayüzü tarafından kullanılan isteğe bağlı kurulum spesifikasyonları (brew/node/go/uv/download).
</ParamField>

`metadata.openclaw` yoksa, beceri her zaman uygun kabul edilir (config içinde
devre dışı bırakılmadığı veya paketle gelen beceriler için `skills.allowBundled`
tarafından engellenmediği sürece).

<Note>
Eski `metadata.clawdbot` blokları, `metadata.openclaw` olmadığında hâlâ kabul
edilir; böylece daha eski kurulu beceriler bağımlılık geçitlerini ve kurulum
ipuçlarını korur. Yeni ve güncellenen beceriler `metadata.openclaw` kullanmalıdır.
</Note>

### Sandbox notları

- `requires.bins`, beceri yükleme zamanında **host** üzerinde denetlenir.
- Bir agent sandbox içindeyse, ikili dosya **container içinde** de mevcut olmalıdır. Bunu `agents.defaults.sandbox.docker.setupCommand` (veya özel bir image) üzerinden kurun. `setupCommand`, container oluşturulduktan sonra bir kez çalışır. Paket kurulumları ayrıca ağ çıkışı, yazılabilir root FS ve sandbox içinde bir root kullanıcı gerektirir.
- Örnek: `summarize` becerisi (`skills/summarize/SKILL.md`) orada çalışmak için sandbox container içinde `summarize` CLI'ye ihtiyaç duyar.

### Kurulum spesifikasyonları

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
  <Accordion title="Kurucu seçim kuralları">
    - Birden çok kurucu listelenmişse gateway tek bir tercih edilen seçenek seçer (varsa brew, aksi halde node).
    - Tüm kurucular `download` ise OpenClaw her girdiyi listeler, böylece kullanılabilir yapıtları görebilirsiniz.
    - Kurucu belirtimleri, seçenekleri platforma göre filtrelemek için `os: ["darwin"|"linux"|"win32"]` içerebilir.
    - Node kurulumları `openclaw.json` içindeki `skills.install.nodeManager` değerini dikkate alır (varsayılan: npm; seçenekler: npm/pnpm/yarn/bun). Bu yalnızca Skills kurulumlarını etkiler; Gateway çalışma zamanı yine Node olmalıdır — Bun, WhatsApp/Telegram için önerilmez.
    - Gateway destekli kurucu seçimi tercihe dayalıdır: kurulum belirtimleri farklı türleri karıştırdığında OpenClaw, `skills.install.preferBrew` etkinse ve `brew` mevcutsa Homebrew'ı tercih eder, ardından `uv`, sonra yapılandırılmış node yöneticisi, sonra `go` veya `download` gibi diğer yedekler gelir.
    - Her kurulum belirtimi `download` ise OpenClaw, tek bir tercih edilen kurucuya indirgemek yerine tüm indirme seçeneklerini gösterir.

  </Accordion>
  <Accordion title="Kurucu bazında ayrıntılar">
    - **Go kurulumları:** `go` yoksa ve `brew` kullanılabiliyorsa gateway önce Homebrew üzerinden Go kurar ve mümkün olduğunda `GOBIN` değerini Homebrew'ın `bin` dizinine ayarlar.
    - **İndirme kurulumları:** `url` (zorunlu), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (varsayılan: arşiv algılandığında otomatik), `stripComponents`, `targetDir` (varsayılan: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Yapılandırma geçersiz kılmaları

Paketle gelen ve yönetilen Skills, `~/.openclaw/openclaw.json` içindeki
`skills.entries` altında açılıp kapatılabilir ve env değerleriyle sağlanabilir:

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
  `false`, paketle gelmiş veya kurulmuş olsa bile Skill'i devre dışı bırakır.
  Paketle gelen `coding-agent` Skill'i isteğe bağlıdır: agent'lara açmadan önce
  `skills.entries.coding-agent.enabled: true` ayarlayın,
  ardından `claude`, `codex`, `opencode` veya `pi` seçeneklerinden birinin kurulu olduğundan ve
  kendi CLI'ı için kimlik doğrulamasının yapıldığından emin olun.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` bildiren Skills için kolaylık sağlar. Düz metin veya SecretRef destekler.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Yalnızca değişken süreçte zaten ayarlanmamışsa enjekte edilir.
</ParamField>
<ParamField path="config" type="object">
  Özel Skill bazlı alanlar için isteğe bağlı torba. Özel anahtarlar burada bulunmalıdır.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Yalnızca **paketle gelen** Skills için isteğe bağlı izin listesi. Ayarlanırsa yalnızca listedeki paketle gelen Skills uygun olur (yönetilen/çalışma alanı Skills etkilenmez).
</ParamField>

Skill adı kısa çizgiler içeriyorsa anahtarı tırnak içine alın (JSON5 tırnaklı
anahtarlara izin verir). Yapılandırma anahtarları varsayılan olarak **Skill adı** ile eşleşir — bir Skill
`metadata.openclaw.skillKey` tanımlıyorsa `skills.entries` altında bu anahtarı kullanın.

<Note>
OpenClaw içinde hazır görüntü oluşturma/düzenleme için paketle gelen bir Skill yerine
`agents.defaults.imageGenerationModel` ile çekirdek
`image_generate` aracını kullanın. Buradaki Skill örnekleri özel veya üçüncü taraf
iş akışları içindir. Yerel görüntü analizi için
`agents.defaults.imageModel` ile `image` aracını kullanın. `openai/*`, `google/*`,
`fal/*` veya başka bir sağlayıcıya özgü görüntü modeli seçerseniz o sağlayıcının
auth/API anahtarını da ekleyin.
</Note>

## Ortam enjeksiyonu

Bir agent çalıştırması başladığında OpenClaw:

1. Skill metadata'sını okur.
2. `skills.entries.<key>.env` ve `skills.entries.<key>.apiKey` değerlerini `process.env` üzerine uygular.
3. Sistem istemini **uygun** Skills ile oluşturur.
4. Çalıştırma sona erdikten sonra özgün ortamı geri yükler.

Ortam enjeksiyonu genel bir shell ortamı değil, **agent çalıştırmasıyla sınırlıdır**.

Paketle gelen `claude-cli` arka ucu için OpenClaw aynı
uygun anlık görüntüyü geçici bir Claude Code Plugin'i olarak da oluşturur ve bunu
`--plugin-dir` ile geçirir. Claude Code daha sonra kendi yerel Skill çözücüsünü kullanabilir; OpenClaw ise
öncelik, agent bazlı izin listeleri, gating ve
`skills.entries.*` env/API anahtarı enjeksiyonunun sahibi olmaya devam eder. Diğer CLI arka uçları yalnızca
istem kataloğunu kullanır.

## Anlık görüntüler ve yenileme

OpenClaw, **bir oturum başladığında** uygun Skills'in anlık görüntüsünü alır ve
aynı oturumdaki sonraki turlarda bu listeyi yeniden kullanır. Skills veya yapılandırmadaki değişiklikler
bir sonraki yeni oturumda etkili olur.

Skills oturum ortasında iki durumda yenilenebilir:

- Skills izleyicisi etkindir.
- Yeni uygun bir uzak node görünür.

Bunu bir **sıcak yeniden yükleme** olarak düşünün: yenilenmiş liste
bir sonraki agent turunda alınır. O oturum için etkili agent Skill izin listesi değişirse
OpenClaw anlık görüntüyü yeniler, böylece görünür Skills geçerli agent ile uyumlu kalır.

### Skills izleyicisi

Varsayılan olarak OpenClaw Skill klasörlerini izler ve `SKILL.md` dosyaları değiştiğinde
Skills anlık görüntüsünü artırır. `skills.load` altında yapılandırın:

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

Gateway Linux üzerinde çalışıyor ancak `system.run` izinli bir **macOS node'u**
bağlıysa (Exec onayları güvenliği `deny` olarak ayarlanmamışsa),
gerekli binary'ler o node üzerinde bulunduğunda OpenClaw yalnızca macOS'a özgü Skills'i uygun kabul edebilir.
Agent bu Skills'i `host=node` ile `exec` aracı üzerinden yürütmelidir.

Bu, node'un komut desteğini bildirmesine ve `system.which` veya `system.run` üzerinden
bir bin yoklamasına dayanır. Çevrimdışı node'lar **yalnızca uzak** Skills'i görünür yapmaz.
Bağlı bir node bin yoklamalarına yanıt vermeyi durdurursa OpenClaw önbelleğe alınmış bin eşleşmelerini temizler,
böylece agent'lar artık şu anda orada çalıştırılamayan Skills'i görmez.

## Token etkisi

Skills uygun olduğunda OpenClaw, sistem istemine kullanılabilir Skills'in kompakt bir XML listesini
(`pi-coding-agent` içindeki `formatSkillsForPrompt` üzerinden) enjekte eder.
Maliyet deterministiktir:

- **Temel ek yük** (yalnızca ≥1 Skill olduğunda): 195 karakter.
- **Skill başına:** 97 karakter + XML kaçışlı `<name>`, `<description>` ve `<location>` değerlerinin uzunluğu.

Formül (karakter):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML kaçışı `& < > " '` karakterlerini entity'lere (`&amp;`, `&lt;` vb.) genişletir,
bu da uzunluğu artırır. Token sayıları model tokenizer'ına göre değişir. Kabaca
OpenAI tarzı bir tahmin ~4 karakter/token olduğundan **97 karakter ≈ 24 token** eder;
buna Skill başına gerçek alan uzunluklarınız eklenir.

## Yönetilen Skills yaşam döngüsü

OpenClaw, kurulumla (npm paketi veya OpenClaw.app) birlikte temel bir Skills kümesini
**paketle gelen Skills** olarak gönderir. `~/.openclaw/skills`, yerel geçersiz kılmalar için vardır —
örneğin paketle gelen kopyayı değiştirmeden bir Skill'i sabitlemek veya yamamak için.
Çalışma alanı Skills kullanıcıya aittir ve ad çakışmalarında ikisini de geçersiz kılar.

## Daha fazla Skill mi arıyorsunuz?

[https://clawhub.ai](https://clawhub.ai) adresine göz atın. Tam yapılandırma
şeması: [Skills yapılandırması](/tr/tools/skills-config).

## İlgili

- [ClawHub](/tr/tools/clawhub) — herkese açık Skills kayıt defteri
- [Skills oluşturma](/tr/tools/creating-skills) — özel Skills oluşturma
- [Plugins](/tr/tools/plugin) — Plugin sistemi genel bakışı
- [Skill Workshop Plugin'i](/tr/plugins/skill-workshop) — agent çalışmasından Skills oluşturma
- [Skills yapılandırması](/tr/tools/skills-config) — Skill yapılandırma başvurusu
- [Eğik çizgi komutları](/tr/tools/slash-commands) — kullanılabilir tüm eğik çizgi komutları
