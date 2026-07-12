---
read_when:
    - Skills ekleme veya değiştirme
    - Skill kısıtlamalarını, izin listelerini veya yükleme kurallarını değiştirme
    - Skills önceliğini ve anlık görüntü davranışını anlama
sidebarTitle: Skills
summary: Skills, ajanınıza araçları nasıl kullanacağını öğretir. Nasıl yüklendiklerini, önceliğin nasıl işlediğini ve geçit denetimi, izin listeleri ile ortam eklemenin nasıl yapılandırılacağını öğrenin.
title: Skills
x-i18n:
    generated_at: "2026-07-12T12:50:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skills, ajana araçları nasıl ve ne zaman kullanacağını öğreten Markdown talimat dosyalarıdır. Her skill, YAML frontmatter ve Markdown gövdesine sahip bir `SKILL.md` dosyası içeren bir dizinde bulunur. OpenClaw, paketle gelen skill'leri ve tüm yerel geçersiz kılmaları yükler; yükleme sırasında bunları ortama, yapılandırmaya ve ikili dosyaların varlığına göre filtreler.

<CardGroup cols={2}>
  <Card title="Skill oluşturma" href="/tr/tools/creating-skills" icon="hammer">
    Sıfırdan özel bir skill oluşturun ve test edin.
  </Card>
  <Card title="Skill Atölyesi" href="/tr/tools/skill-workshop" icon="flask">
    Ajan tarafından taslak hâline getirilen skill önerilerini inceleyin ve onaylayın.
  </Card>
  <Card title="Skill yapılandırması" href="/tr/tools/skills-config" icon="gear">
    Tam `skills.*` yapılandırma şeması ve ajan izin listeleri.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Topluluk skill'lerine göz atın ve bunları yükleyin.
  </Card>
</CardGroup>

## Yükleme sırası

OpenClaw aşağıdaki kaynaklardan, **önceliği en yüksek olandan başlayarak** yükleme yapar. Aynı skill adı birden fazla yerde bulunursa en yüksek öncelikli kaynak geçerli olur.

| Öncelik      | Kaynak                    | Yol                                     |
| ------------ | ------------------------- | --------------------------------------- |
| 1 — en yüksek | Çalışma alanı skill'leri  | `<workspace>/skills`                    |
| 2            | Proje ajanı skill'leri    | `<workspace>/.agents/skills`            |
| 3            | Kişisel ajan skill'leri   | `~/.agents/skills`                      |
| 4            | Yönetilen / yerel skill'ler | `~/.openclaw/skills`                  |
| 5            | Paketle gelen skill'ler   | kurulumla birlikte sunulur              |
| 6 — en düşük | Ek dizinler               | `skills.load.extraDirs` + plugin skill'leri |

Skill kökleri gruplandırılmış düzenleri destekler. OpenClaw, yapılandırılmış bir kökün altında herhangi bir yerde (en fazla 6 düzey derinlikte) `SKILL.md` bulunduğunda bir skill keşfeder:

```text
<workspace>/skills/research/SKILL.md          ✓ "research" olarak bulundu
<workspace>/skills/personal/research/SKILL.md ✓ yine "research" olarak bulundu
```

Klasör yolu yalnızca düzenleme amacıyla kullanılır. Skill'in adı ve eğik çizgi komutu, frontmatter içindeki `name` alanından (`name` yoksa dizin adından) alınır. Ajan izin listeleri de (aşağıda) bu `name` ile eşleşir.

<Note>
  Codex CLI'nin yerel `$CODEX_HOME/skills` dizini bir OpenClaw skill kökü **değildir**. Bu skill'lerin envanterini çıkarmak için `openclaw migrate plan codex`, ardından bunları OpenClaw çalışma alanınıza kopyalamak için `openclaw migrate codex` kullanın.
</Note>

## Node üzerinde barındırılan skill'ler

Bağlı, başsız bir Node, etkin OpenClaw skill dizinine (varsayılan olarak `~/.openclaw/skills`; profil ortamı geçersiz kılmaları uygulanır) yüklenmiş skill'leri yayımlayabilir. Node bağlıyken normal ajan skill listesinde görünür, bağlantısı kesildiğinde kaybolurlar. Ad çakışmasında yerel veya Gateway skill'i adını korur; Node skill'i deterministik, Node önekli bir ad alır. Node üzerinde barındırılan v1, dizin adının skill'in frontmatter içindeki `name` alanıyla eşleşmesini gerektirir.

Skill girdisi Node konum belirleyicisini içerir. Dosyaları, göreli referansları ve ikili dosyaları Node üzerinde bulunduğundan skill'i `exec host=node node=<node-id>` ile yükleyip çalıştırın. Skill dosyalarını değiştirdikten sonra Node ana makinesini yeniden başlatın. Eşleştirme ve devre dışı bırakma seçenekleri için [Node'lar](/tr/nodes#node-hosted-skills) bölümüne bakın.

## Ajan başına ve paylaşılan skill'ler

Çok ajanlı kurulumlarda her ajanın kendi çalışma alanı vardır. İstediğiniz görünürlüğe karşılık gelen yolu kullanın:

| Kapsam           | Yol                          | Görünür olduğu yer              |
| ---------------- | ---------------------------- | ------------------------------- |
| Ajan başına      | `<workspace>/skills`         | Yalnızca ilgili ajan            |
| Proje ajanı      | `<workspace>/.agents/skills` | Yalnızca ilgili çalışma alanının ajanı |
| Kişisel ajan     | `~/.agents/skills`           | Bu makinedeki tüm ajanlar       |
| Paylaşılan yönetilen | `~/.openclaw/skills`     | Bu makinedeki tüm ajanlar       |
| Ek dizinler      | `skills.load.extraDirs`      | Bu makinedeki tüm ajanlar       |

## Ajan izin listeleri

Skill **konumu** (öncelik) ve skill **görünürlüğü** (hangi ajanın kullanabileceği) ayrı denetimlerdir. Yüklendikleri yerden bağımsız olarak bir ajanın hangi skill'leri görebileceğini kısıtlamak için izin listelerini kullanın.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // paylaşılan temel küme
    },
    list: [
      { id: "writer" }, // github ve weather değerlerini devralır
      { id: "docs", skills: ["docs-search"] }, // varsayılanları tamamen değiştirir
      { id: "locked-down", skills: [] }, // skill yok
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="İzin listesi kuralları">
    - Tüm skill'lerin varsayılan olarak kısıtlanmadan kalması için `agents.defaults.skills` alanını belirtmeyin.
    - `agents.defaults.skills` değerini devralmak için `agents.list[].skills` alanını belirtmeyin.
    - İlgili ajana hiçbir skill göstermemek için `agents.list[].skills: []` ayarlayın.
    - Boş olmayan bir `agents.list[].skills` listesi **nihai** kümedir; varsayılanlarla birleştirilmez.
    - Etkin izin listesi; istem oluşturma, eğik çizgi komutlarını keşfetme, sandbox eşitlemesi ve skill anlık görüntülerinin tamamında uygulanır.
    - Bu, ana makine kabuğu için bir yetkilendirme sınırı değildir. Aynı ajan `exec` kullanabiliyorsa bu kabuğu ayrıca sandbox, işletim sistemi kullanıcısı yalıtımı, exec engelleme/izin listeleri ve kaynak başına kimlik bilgileriyle kısıtlayın.
  </Accordion>
</AccordionGroup>

## Plugin'ler ve skill'ler

Plugin'ler, `openclaw.plugin.json` içinde `skills` dizinlerini (Plugin köküne göreli yollarla) listeleyerek kendi skill'lerini sunabilir. Plugin skill'leri Plugin etkinleştirildiğinde yüklenir; örneğin tarayıcı Plugin'i, çok adımlı tarayıcı denetimi için bir `browser-automation` skill'i sunar.

Plugin skill dizinleri `skills.load.extraDirs` ile aynı düşük öncelik düzeyinde birleştirilir; dolayısıyla aynı ada sahip paketle gelen, yönetilen, ajan veya çalışma alanı skill'i bunları geçersiz kılar. Bir Plugin skill'inin uygunluğunu, diğer tüm skill'lerde olduğu gibi frontmatter içindeki `metadata.openclaw.requires` aracılığıyla sınırlayın.

Tam Plugin sistemi için [Plugin'ler](/tr/tools/plugin) ve [Araçlar](/tr/tools) bölümlerine bakın.

## Skill Atölyesi

[Skill Atölyesi](/tr/tools/skill-workshop), ajan ile etkin skill dosyalarınız arasındaki bir öneri kuyruğudur. Ajan yeniden kullanılabilir bir çalışma belirlediğinde doğrudan `SKILL.md` dosyasına yazmak yerine bir öneri taslağı oluşturur. Herhangi bir şey değişmeden önce öneriyi inceler ve onaylarsınız.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Tam yaşam döngüsü, CLI referansı ve yapılandırma için [Skill Atölyesi](/tr/tools/skill-workshop) bölümüne bakın.

## ClawHub'dan yükleme

[ClawHub](https://clawhub.ai), herkese açık skill kayıt defteridir. Yükleme ve güncelleme için `openclaw skills` komutlarını, yayımlama ve eşitleme içinse `clawhub` CLI'yi kullanın.

| Eylem                                      | Komut                                                  |
| ------------------------------------------ | ------------------------------------------------------ |
| Çalışma alanına bir skill yükle            | `openclaw skills install @owner/<slug>`                |
| Bir Git deposundan yükle                   | `openclaw skills install git:owner/repo@ref`           |
| Yerel bir skill dizini yükle               | `openclaw skills install ./path/to/skill --as my-tool` |
| Tüm yerel ajanlar için yükle               | `openclaw skills install @owner/<slug> --global`       |
| Tüm çalışma alanı skill'lerini güncelle    | `openclaw skills update --all`                         |
| Paylaşılan yönetilen bir skill'i güncelle  | `openclaw skills update @owner/<slug> --global`        |
| Tüm paylaşılan yönetilen skill'leri güncelle | `openclaw skills update --all --global`              |
| Bir skill'in güven sınırını doğrula        | `openclaw skills verify @owner/<slug>`                 |
| Oluşturulan Skill Kartını yazdır           | `openclaw skills verify @owner/<slug> --card`          |
| ClawHub CLI aracılığıyla yayımla / eşitle  | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Yükleme ayrıntıları">
    `openclaw skills install`, varsayılan olarak etkin çalışma alanının `skills/` dizinine yükleme yapar. Tüm yerel ajanların görebildiği paylaşılan `~/.openclaw/skills` dizinine yüklemek için `--global` ekleyin; ajan izin listeleri bunu daraltabilir.

    Git ve yerel yüklemeler, kaynak kökünde `SKILL.md` bulunmasını bekler. Geçerliyse kısa ad `SKILL.md` frontmatter içindeki `name` değerinden alınır; aksi hâlde dizin veya depo adı kullanılır. Geçersiz kılmak için `--as <slug>` kullanın. `openclaw skills update` yalnızca ClawHub yüklemelerini izler; Git veya yerel kaynakları yenilemek için yeniden yükleyin.

  </Accordion>
  <Accordion title="Doğrulama ve güvenlik taraması">
    `openclaw skills verify @owner/<slug>`, ClawHub'dan skill'in `clawhub.skill.verify.v1` güven sınırını ister. Yüklü ClawHub skill'leri, `.clawhub/origin.json` içinde kaydedilen sürüm ve kayıt defterine göre doğrulanır. Mevcut yüklü veya anlamı açık skill'ler için sahip belirtilmeyen kısa adlar kabul edilmeye devam eder; ancak sahip nitelemeli referanslar yayıncı belirsizliğini önler.

    ClawHub skill sayfaları, yükleme öncesinde en son güvenlik taraması durumunu ve VirusTotal, ClawScan ile statik analiz ayrıntı sayfalarını gösterir. ClawHub doğrulamayı başarısız olarak işaretlediğinde komut sıfırdan farklı bir kodla çıkar. Yayıncılar yanlış pozitifleri ClawHub panosu veya `clawhub skill rescan @owner/<slug>` aracılığıyla giderebilir.

  </Accordion>
  <Accordion title="Özel arşiv yüklemeleri">
    ClawHub dışı dağıtıma ihtiyaç duyan Gateway istemcileri, `skills.upload.begin`, `skills.upload.chunk` ve `skills.upload.commit` ile bir zip skill arşivini hazırlayıp ardından `skills.install({ source: "upload", ... })` ile yükleyebilir. Bu yol varsayılan olarak kapalıdır ve `openclaw.json` içinde `skills.install.allowUploadedArchives: true` ayarını gerektirir. Normal ClawHub yüklemelerinde bu ayara hiçbir zaman gerek yoktur.
  </Accordion>
</AccordionGroup>

## Güvenlik

<Warning>
  Üçüncü taraf skill'leri **güvenilmeyen kod** olarak değerlendirin. Etkinleştirmeden önce bunları okuyun. Güvenilmeyen girdiler ve riskli araçlar için sandbox içinde çalıştırmayı tercih edin. Ajan tarafındaki denetimler için [Sandbox](/tr/gateway/sandboxing) bölümüne bakın.
</Warning>

<AccordionGroup>
  <Accordion title="Yol sınırlaması">
    Çalışma alanı, proje ajanı ve ek dizin skill keşfi, `skills.load.allowSymlinkTargets` bir hedef köke açıkça güvenmediği sürece yalnızca çözümlenmiş gerçek yolu yapılandırılmış kökün içinde kalan skill köklerini kabul eder. Skill Atölyesi, bu güvenilen hedefler üzerinden yalnızca `skills.workshop.allowSymlinkTargetWrites` etkinleştirildiğinde yazar. Yönetilen `~/.openclaw/skills` ve kişisel `~/.agents/skills`, sembolik bağlantılı skill klasörleri içerebilir; ancak her `SKILL.md` gerçek yolu yine de çözümlenmiş skill dizininin içinde kalmalıdır.
  </Accordion>
  <Accordion title="Operatör yükleme politikası">
    Skill yüklemeleri devam etmeden önce güvenilen bir yerel politika komutu çalıştırmak için `security.installPolicy` yapılandırın. Politika, meta verileri ve hazırlanmış kaynak yolunu alır; ClawHub, karşıya yüklenen, Git, yerel, güncelleme ve bağımlılık yükleyici yollarına uygulanır ve komut geçerli bir karar döndüremezse güvenli biçimde işlemi reddeder.
  </Accordion>
  <Accordion title="Gizli bilgi ekleme kapsamı">
    `skills.entries.*.env` ve `skills.entries.*.apiKey`, gizli bilgileri yalnızca ilgili ajan dönüşü için **ana makine** işlemine ekler; sandbox içine eklemez. Gizli bilgileri istemlerden ve günlüklerden uzak tutun.
  </Accordion>
</AccordionGroup>

Daha geniş tehdit modeli ve güvenlik kontrol listeleri için [Güvenlik](/tr/gateway/security) bölümüne bakın.

## SKILL.md biçimi

Her skill'in frontmatter bölümünde en az bir `name` ve `description` bulunmalıdır:

```markdown
---
name: image-lab
description: Bir sağlayıcı destekli görüntü iş akışı aracılığıyla görüntüler oluşturun veya düzenleyin
---

Kullanıcı bir görüntü oluşturulmasını istediğinde `image_generate` aracını kullanın...
```

<Note>
  OpenClaw, [AgentSkills](https://agentskills.io) belirtimini izler. Frontmatter
  önce YAML olarak ayrıştırılır; bu başarısız olursa yalnızca tek satırlı
  ayrıştırıcıya geri döner. İç içe `metadata` blokları (çok satırlı YAML eşlemeleri
  dâhil) bir JSON dizesine düzleştirilir ve JSON5 olarak yeniden ayrıştırılır;
  dolayısıyla [Geçitler](#gating) altında gösterilen blok biçimi çalışır. Skills
  klasör yoluna başvurmak için gövdede `{baseDir}` kullanın.
</Note>

### İsteğe bağlı frontmatter anahtarları

<ParamField path="homepage" type="string">
  macOS Skills kullanıcı arayüzünde "Website" olarak gösterilen URL. Ayrıca
  `metadata.openclaw.homepage` aracılığıyla da desteklenir.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  `true` olduğunda Skills, kullanıcı tarafından çağrılabilen bir eğik çizgi komutu
  olarak sunulur.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` olduğunda OpenClaw, Skills talimatlarını ajanın normal isteminin dışında
  tutar. `user-invocable` da `true` olduğunda Skills, eğik çizgi komutu olarak
  kullanılmaya devam eder.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  `tool` olarak ayarlandığında eğik çizgi komutu modeli atlar ve doğrudan kayıtlı
  bir araca yönlendirilir.
</ParamField>

<ParamField path="command-tool" type="string">
  `command-dispatch: tool` ayarlandığında çağrılacak araç adı.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Araç yönlendirmesinde, ham argüman dizesini çekirdek ayrıştırması olmadan araca
  iletir. Araç
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`
  değerini alır.
</ParamField>

## Geçitler

OpenClaw, yükleme sırasında Skills öğelerini `metadata.openclaw` kullanarak
filtreler (frontmatter içine gömülü JSON5 nesnesi; yukarıdaki ayrıştırma notuna
bakın). `metadata.openclaw` bloğu bulunmayan bir Skills öğesi, açıkça devre dışı
bırakılmadığı sürece her zaman uygundur.

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
  `true` olduğunda Skills öğesini her zaman dâhil eder ve diğer tüm geçitleri
  atlar.
</ParamField>

<ParamField path="emoji" type="string">
  macOS Skills kullanıcı arayüzünde gösterilen isteğe bağlı emoji.
</ParamField>

<ParamField path="homepage" type="string">
  macOS Skills kullanıcı arayüzünde "Website" olarak gösterilen isteğe bağlı URL.
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  Platform filtresi. Ayarlandığında Skills yalnızca listelenen bir işletim
  sisteminde uygundur.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Her ikili dosyanın `PATH` üzerinde bulunması gerekir.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  En az bir ikili dosyanın `PATH` üzerinde bulunması gerekir.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Her ortam değişkeni süreçte bulunmalı veya yapılandırma aracılığıyla
  sağlanmalıdır.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Her `openclaw.json` yolu doğruluk değeri taşımalıdır.
</ParamField>

<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` ile ilişkilendirilmiş ortam değişkeni adı.
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills kullanıcı arayüzü tarafından kullanılan isteğe bağlı yükleyici
  tanımları (brew / node / go / uv / download).
</ParamField>

<Note>
  `metadata.openclaw` bulunmadığında eski `metadata.clawdbot` blokları hâlâ
  kabul edilir; böylece daha önce yüklenmiş Skills öğeleri bağımlılık geçitlerini
  ve yükleyici ipuçlarını korur. Yeni Skills öğeleri `metadata.openclaw`
  kullanmalıdır.
</Note>

### Yükleyici tanımları

Yükleyici tanımları, macOS Skills kullanıcı arayüzüne bir bağımlılığın nasıl
yükleneceğini bildirir:

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
    - Birden fazla yükleyici listelendiğinde Gateway tercih edilen bir seçeneği
      seçer (kullanılabiliyorsa brew, aksi takdirde node).
    - Tüm yükleyiciler `download` ise OpenClaw, kullanılabilir tüm yapıtları
      görebilmeniz için her girdiyi listeler.
    - Tanımlar, platforma göre filtreleme yapmak için
      `os: ["darwin"|"linux"|"win32"]` içerebilir.
    - Node yüklemeleri, `openclaw.json` içindeki `skills.install.nodeManager`
      ayarını dikkate alır (varsayılan: npm; seçenekler: npm / pnpm / yarn / bun).
      Bu yalnızca Skills yüklemelerini etkiler; Gateway çalışma zamanı yine Node
      olmalıdır.
    - Gateway yükleyici tercihi: Homebrew → uv → yapılandırılmış node yöneticisi →
      go → download.
  </Accordion>
  <Accordion title="Yükleyiciye özgü ayrıntılar">
    - **Homebrew:** OpenClaw, Homebrew'ü otomatik olarak yüklemez veya brew
      formüllerini sistem paketi komutlarına dönüştürmez. `brew` bulunmayan Linux
      kapsayıcılarında yalnızca brew kullanan yükleyiciler gizlenir; özel bir
      imaj kullanın veya bağımlılığı elle yükleyin.
    - **Go:** OpenClaw, otomatik Skills yüklemeleri için Go 1.21 veya daha yeni
      bir sürüm gerektirir. `go` eksikse ve Homebrew kullanılabiliyorsa OpenClaw
      önce Homebrew aracılığıyla Go'yu yükler; Homebrew bulunmayan Linux'ta ise
      yenilenmiş `golang-go` adayı asgari sürümü karşılıyorsa bunun yerine root
      olarak veya parolasız `sudo` üzerinden `apt-get` kullanabilir. Bağımlılık
      için gerçek `go install`, yapılandırılmış `GOBIN` yerine her zaman OpenClaw
      tarafından yönetilen özel bir ikili dosya dizinini (yeni bir yüklemede
      Homebrew'ün `bin` dizini, aksi takdirde `~/.local/bin`) hedefler — kendi
      `GOBIN`, `GOPATH` ve `GOTOOLCHAIN` ortam değişkenleriniz okunur ancak asla
      üzerlerine yazılmaz.
    - **İndirme:** `url` (zorunlu), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (varsayılan: arşiv algılandığında otomatik), `stripComponents`,
      `targetDir` (varsayılan: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Korumalı alan notları">
    `requires.bins`, Skills yükleme sırasında **ana makinede** denetlenir. Bir
    ajan korumalı alanda çalışıyorsa ikili dosyanın **kapsayıcının içinde** de
    bulunması gerekir. Dosyayı `agents.defaults.sandbox.docker.setupCommand`
    veya özel bir imaj aracılığıyla yükleyin. `setupCommand`, kapsayıcı
    oluşturulduktan sonra bir kez çalışır ve korumalı alanda ağ çıkışı,
    yazılabilir bir kök dosya sistemi ve root kullanıcı gerektirir.
  </Accordion>
</AccordionGroup>

## Yapılandırma geçersiz kılmaları

Paketle birlikte gelen veya yönetilen Skills öğelerini
`~/.openclaw/openclaw.json` içindeki `skills.entries` altında etkinleştirin,
devre dışı bırakın ve yapılandırın:

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
  `false`, paketle birlikte gelse veya yüklü olsa bile Skills öğesini devre dışı
  bırakır. Paketle birlikte gelen `coding-agent` Skills öğesi isteğe bağlıdır —
  `skills.entries.coding-agent.enabled: true` olarak ayarlayın ve `claude`,
  `codex`, `opencode` veya desteklenen başka bir CLI'ın yüklü ve kimliği
  doğrulanmış olduğundan emin olun.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` bildiren Skills öğeleri için kolaylık alanı.
  Düz metin dizesini veya SecretRef nesnesini destekler.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Ajan çalıştırması için enjekte edilen ortam değişkenleri. Yalnızca değişken
  süreçte zaten ayarlanmamışsa enjekte edilir.
</ParamField>

<ParamField path="config" type="object">
  Skills öğesine özgü özel yapılandırma alanları için isteğe bağlı nesne.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Yalnızca **paketle birlikte gelen** Skills öğeleri için isteğe bağlı izin
  listesi. Ayarlandığında yalnızca listedeki paketle birlikte gelen Skills
  öğeleri uygun olur. Yönetilen ve çalışma alanındaki Skills öğeleri etkilenmez.
</ParamField>

<Note>
  Yapılandırma anahtarları varsayılan olarak **Skills adıyla** eşleşir. Bir Skills
  öğesi `metadata.openclaw.skillKey` tanımlıyorsa bunun yerine `skills.entries`
  altında bu anahtarı kullanın. Tireli adları tırnak içine alın: JSON5, tırnaklı
  anahtarlara izin verir.
</Note>

## Ortam enjeksiyonu

Bir ajan çalıştırması başladığında OpenClaw:

<Steps>
  <Step title="Skills meta verilerini okur">
    OpenClaw; geçit kurallarını, izin listelerini ve yapılandırma geçersiz
    kılmalarını uygulayarak ajan için geçerli Skills listesini çözümler.
  </Step>
  <Step title="Ortam değişkenlerini ve API anahtarlarını enjekte eder">
    `skills.entries.<key>.env` ve `skills.entries.<key>.apiKey`, çalıştırma
    süresince `process.env` üzerine uygulanır.
  </Step>
  <Step title="Sistem istemini oluşturur">
    Uygun Skills öğeleri derlenerek kompakt bir XML bloğuna dönüştürülür ve
    sistem istemine enjekte edilir.
  </Step>
  <Step title="Ortamı geri yükler">
    Çalıştırma sona erdikten sonra özgün ortam geri yüklenir.
  </Step>
</Steps>

<Warning>
  Ortam enjeksiyonu korumalı alanı değil, **ana makinedeki** ajan çalıştırmasını
  kapsar. Korumalı alan içinde `env` ve `apiKey` etkisizdir. Gizli değerlerin
  korumalı alan çalıştırmalarına nasıl aktarılacağını öğrenmek için
  [Skills yapılandırması](/tr/tools/skills-config#sandboxed-skills-and-env-vars)
  bölümüne bakın.
</Warning>

Paketle birlikte gelen `claude-cli` arka ucu için OpenClaw, aynı uygun Skills
anlık görüntüsünü geçici bir Claude Code Plugin'i olarak da oluşturur ve
`--plugin-dir` aracılığıyla iletir. Diğer CLI arka uçları yalnızca istem
kataloğunu kullanır.

## Anlık görüntüler ve yenileme

OpenClaw, uygun Skills öğelerinin anlık görüntüsünü **bir oturum başladığında**
alır ve bu listeyi oturumdaki sonraki tüm turlarda yeniden kullanır. Skills veya
yapılandırma değişiklikleri bir sonraki yeni oturumda geçerli olur.

Skills, oturumun ortasında iki durumda yenilenir:

- Skills izleyicisi bir `SKILL.md` değişikliği algılar.
- Yeni bir uygun uzak node bağlanır.

Yenilenen liste bir sonraki ajan turunda kullanılır. Etkin ajan izin listesi
değişirse OpenClaw, görünür Skills öğelerini uyumlu tutmak için anlık görüntüyü
yeniler.

<AccordionGroup>
  <Accordion title="Skills izleyicisi">
    OpenClaw varsayılan olarak Skills klasörlerini izler ve `SKILL.md` dosyaları
    değiştiğinde anlık görüntü sürümünü artırır. `skills.load` altında
    yapılandırın:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // default
          watchDebounceMs: 250, // default
        },
      },
    }
    ```

    Skills kökü sembolik bağlantısının yapılandırılmış kökün dışına işaret ettiği
    kasıtlı sembolik bağlantı düzenlerinde `allowSymlinkTargets` kullanın; örneğin
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    `skills.workshop.allowSymlinkTargetWrites` ayarını yalnızca Skill Workshop'un
    bu güvenilir sembolik bağlantılı yollar üzerinden önerileri de uygulaması
    gerektiğinde etkinleştirin.

  </Accordion>
  <Accordion title="Uzak macOS node'ları (Linux gateway)">
    Gateway Linux'ta çalışıyor ancak `system.run` izni bulunan bir **macOS node**
    bağlıysa OpenClaw, gerekli ikili dosyalar bu node üzerinde bulunduğunda
    yalnızca macOS'a özgü Skills öğelerini uygun kabul edebilir. Ajan bu Skills
    öğelerini `host=node` ile `exec` aracını kullanarak çalıştırmalıdır.

    Çevrimdışı node'lar yalnızca uzakta kullanılabilen Skills öğelerini görünür
    kılmaz. Bir node ikili dosya yoklamalarına yanıt vermeyi bırakırsa OpenClaw,
    önbelleğe alınmış ikili dosya eşleşmelerini temizler.

  </Accordion>
</AccordionGroup>

## Token etkisi

Skills öğeleri uygun olduğunda OpenClaw, sistem istemine kompakt bir XML bloğu
enjekte eder. Maliyet belirlenimseldir ve Skills başına doğrusal olarak ölçeklenir:

- **Temel ek yük** (yalnızca 1 veya daha fazla Skills öğesi uygun olduğunda):
  giriş metninden ve `<available_skills>` sarmalayıcısından oluşan sabit bir blok.
- **Skills başına:** ~97 karakter + `name`, `description` ve `location`
  alanlarınızın uzunlukları.
- XML kaçış işlemi `& < > " '` karakterlerini varlıklara dönüştürerek her oluşum
  başına birkaç karakter ekler.
- ~4 karakter/token oranında, alan uzunluklarından önce 97 karakter ≈ Skills
  başına 24 token eder.

İşlenen blok, yapılandırılmış istem bütçesini
(`skills.limits.maxSkillsPromptChars`) aşacaksa OpenClaw önce açıklamasız kompakt
biçime sığabilecek mümkün olduğunca çok Skills kimliğini (ad, konum ve sürüm)
korur. Ardından kalan bütçeyi kısaltılmış açıklamalar için kullanır. Açıklamalar
için bütçe kalmazsa açıklamalar atlanır. Kompakt biçimlendirme veya listeyi
kısaltma gerektiğinde istem, `openclaw skills check` komutunu işaret eden bir
not içerir.

İstem ek yükünü en aza indirmek için açıklamaları kısa ve açıklayıcı tutun.

## İlgili

<CardGroup cols={2}>
  <Card title="Skills oluşturma" href="/tr/tools/creating-skills" icon="hammer">
    Özel bir skill yazmaya yönelik adım adım kılavuz.
  </Card>
  <Card title="Skill Atölyesi" href="/tr/tools/skill-workshop" icon="flask">
    Aracı tarafından taslak hâline getirilen skill'ler için öneri kuyruğu.
  </Card>
  <Card title="Skills yapılandırması" href="/tr/tools/skills-config" icon="gear">
    Tam `skills.*` yapılandırma şeması ve aracı izin listeleri.
  </Card>
  <Card title="Eğik çizgi komutları" href="/tr/tools/slash-commands" icon="terminal">
    Skill eğik çizgi komutlarının nasıl kaydedildiği ve yönlendirildiği.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Herkese açık kayıt defterinde skill'lere göz atın ve bunları yayımlayın.
  </Card>
  <Card title="Plugin'ler" href="/tr/tools/plugin" icon="plug">
    Plugin'ler, belgeledikleri araçlarla birlikte skill'leri sunabilir.
  </Card>
</CardGroup>
