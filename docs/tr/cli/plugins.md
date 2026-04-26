---
read_when:
    - Gateway Plugin'lerini veya uyumlu paketleri yüklemek ya da yönetmek istiyorsunuz
    - Plugin yükleme hatalarını ayıklamak istiyorsunuz
sidebarTitle: Plugins
summary: '`openclaw plugins` için CLI başvurusu (listeleme, yükleme, marketplace, kaldırma, etkinleştirme/devre dışı bırakma, doctor)'
title: Plugin'ler
x-i18n:
    generated_at: "2026-04-26T11:26:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52b02c96859e1da1d7028bce375045ef9472d1f2e01086f1318e4f38e8d5bb7d
    source_path: cli/plugins.md
    workflow: 15
---

Gateway Plugin'lerini, kanca paketlerini ve uyumlu paketleri yönetin.

<CardGroup cols={2}>
  <Card title="Plugin sistemi" href="/tr/tools/plugin">
    Plugin'leri yükleme, etkinleştirme ve sorun giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Plugin paketleri" href="/tr/plugins/bundles">
    Paket uyumluluk modeli.
  </Card>
  <Card title="Plugin manifest" href="/tr/plugins/manifest">
    Manifest alanları ve yapılandırma şeması.
  </Card>
  <Card title="Güvenlik" href="/tr/gateway/security">
    Plugin yüklemeleri için güvenlik sağlamlaştırması.
  </Card>
</CardGroup>

## Komutlar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

<Note>
Paketlenmiş Plugin'ler OpenClaw ile birlikte gelir. Bazıları varsayılan olarak etkindir (örneğin paketlenmiş model sağlayıcıları, paketlenmiş konuşma sağlayıcıları ve paketlenmiş tarayıcı Plugin'i); diğerleri için `plugins enable` gerekir.

Yerel OpenClaw Plugin'leri satır içi JSON Schema içeren `openclaw.plugin.json` dosyasıyla gönderilmelidir (`configSchema`, boş olsa bile). Uyumlu paketler bunun yerine kendi paket manifest'lerini kullanır.

`plugins list`, `Format: openclaw` veya `Format: bundle` gösterir. Ayrıntılı liste/bilgi çıktısı ayrıca paket alt türünü (`codex`, `claude` veya `cursor`) ve algılanan paket yeteneklerini de gösterir.
</Note>

### Yükleme

```bash
openclaw plugins install <package>                      # Önce ClawHub, sonra npm
openclaw plugins install clawhub:<package>              # Yalnızca ClawHub
openclaw plugins install <package> --force              # mevcut yüklemenin üzerine yaz
openclaw plugins install <package> --pin                # sürümü sabitle
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # yerel yol
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (açık)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Çıplak paket adları önce ClawHub'a, sonra npm'e karşı denetlenir. Plugin yüklemelerini kod çalıştırmak gibi değerlendirin. Sabitlenmiş sürümleri tercih edin.
</Warning>

<AccordionGroup>
  <Accordion title="Yapılandırma include'ları ve geçersiz yapılandırma kurtarma">
    `plugins` bölümünüz tek dosyalı bir `$include` ile destekleniyorsa `plugins install/update/enable/disable/uninstall` yazma işlemlerini o include edilen dosyaya geçirir ve `openclaw.json` dosyasına dokunmaz. Kök include'lar, include dizileri ve kardeş geçersiz kılmaları olan include'lar düzleştirilmek yerine kapalı hata verir. Desteklenen şekiller için bkz. [Config includes](/tr/gateway/configuration).

    Yapılandırma geçersizse `plugins install` normalde kapalı hata verir ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Belgelenmiş tek istisna, açıkça `openclaw.install.allowInvalidConfigRecovery` ile katılan Plugin'ler için dar kapsamlı bir paketlenmiş Plugin kurtarma yoludur.

  </Accordion>
  <Accordion title="--force ve yeniden yükleme ile güncelleme farkı">
    `--force`, mevcut yükleme hedefini yeniden kullanır ve zaten yüklenmiş olan bir Plugin'i veya kanca paketini yerinde üzerine yazar. Aynı kimliği yeni bir yerel yol, arşiv, ClawHub paketi veya npm artifaktından bilerek yeniden yüklediğinizde bunu kullanın. Zaten izlenen bir npm Plugin'inin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` tercih edin.

    Zaten yüklenmiş bir Plugin kimliği için `plugins install` çalıştırırsanız OpenClaw durur ve normal bir yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna ya da gerçekten mevcut yüklemeyi farklı bir kaynaktan üzerine yazmak istediğinizde `plugins install <package> --force` komutuna yönlendirir.

  </Accordion>
  <Accordion title="--pin kapsamı">
    `--pin` yalnızca npm yüklemelerine uygulanır. `--marketplace` ile desteklenmez, çünkü marketplace yüklemeleri npm belirtimi yerine marketplace kaynak metadata'sını kalıcı olarak saklar.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısındaki yanlış pozitifler için son çare seçeneğidir. Yerleşik tarayıcı `critical` bulguları bildirse bile yüklemenin sürmesine izin verir, ancak Plugin `before_install` kanca politika engellerini **atlamaz** ve tarama hatalarını **atlamaz**.

    Bu CLI bayrağı Plugin yükleme/güncelleme akışlarına uygulanır. Gateway destekli Skill bağımlılığı yüklemeleri eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanırken `openclaw skills install` ayrı bir ClawHub Skill indirme/yükleme akışı olarak kalır.

  </Accordion>
  <Accordion title="Kanca paketleri ve npm belirtimleri">
    `plugins install`, `package.json` içinde `openclaw.hooks` sunan kanca paketleri için de yükleme yüzeyidir. Filtrelenmiş kanca görünürlüğü ve kanca başına etkinleştirme için paket yükleme yerine `openclaw hooks` kullanın.

    Npm belirtimleri **yalnızca kayıt defteri** içindir (paket adı + isteğe bağlı **tam sürüm** veya **dist-tag**). Git/URL/dosya belirtimleri ve semver aralıkları reddedilir. Bağımlılık yüklemeleri, kabuğunuzda genel npm yükleme ayarları olsa bile güvenlik için proje-yerel olarak `--ignore-scripts` ile çalışır.

    Çıplak belirtimler ve `@latest`, kararlı kanalda kalır. npm bunlardan herhangi birini bir ön sürüme çözümlerse OpenClaw durur ve sizden `@beta`/`@rc` gibi bir ön sürüm etiketi veya `@1.2.3-beta.4` gibi tam bir ön sürüm ile açık katılım ister.

    Çıplak bir yükleme belirtimi paketlenmiş bir Plugin kimliğiyle eşleşirse (örneğin `diffs`) OpenClaw paketlenmiş Plugin'i doğrudan yükler. Aynı adı taşıyan bir npm paketini yüklemek için açık kapsamlı bir belirtim kullanın (örneğin `@scope/diffs`).

  </Accordion>
  <Accordion title="Arşivler">
    Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Yerel OpenClaw Plugin arşivleri, çıkarılmış Plugin kökünde geçerli bir `openclaw.plugin.json` içermelidir; yalnızca `package.json` içeren arşivler OpenClaw yükleme kayıtlarını yazmadan önce reddedilir.

    Claude marketplace yüklemeleri de desteklenir.

  </Accordion>
</AccordionGroup>

ClawHub yüklemeleri açık bir `clawhub:<package>` konumlayıcısı kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw artık çıplak npm-güvenli Plugin belirtimleri için de ClawHub'ı tercih eder. Yalnızca ClawHub'da bu paket veya sürüm yoksa npm'e geri düşer:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw paket arşivini ClawHub'dan indirir, ilan edilen Plugin API / minimum gateway uyumluluğunu denetler, ardından normal arşiv yolu üzerinden yükler. Kaydedilen yüklemeler daha sonraki güncellemeler için ClawHub kaynak metadata'sını korur.

#### Marketplace kısaltması

Marketplace adı Claude'un `~/.claude/plugins/known_marketplaces.json` içindeki yerel kayıt defteri önbelleğinde varsa `plugin@marketplace` kısaltmasını kullanın:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Marketplace kaynağını açıkça vermek istediğinizde `--marketplace` kullanın:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace kaynakları">
    - `~/.claude/plugins/known_marketplaces.json` içindeki bir Claude bilinen-marketplace adı
    - yerel bir marketplace kökü veya `marketplace.json` yolu
    - `owner/repo` gibi bir GitHub repo kısaltması
    - `https://github.com/owner/repo` gibi bir GitHub repo URL'si
    - bir git URL'si
  </Tab>
  <Tab title="Uzak marketplace kuralları">
    GitHub veya git'ten yüklenen uzak marketplace'lerde Plugin girdileri klonlanan marketplace repo'su içinde kalmalıdır. OpenClaw bu repo'dan göreli yol kaynaklarını kabul eder ve uzak manifest'lerden HTTP(S), mutlak yol, git, GitHub ve diğer yol dışı Plugin kaynaklarını reddeder.
  </Tab>
</Tabs>

Yerel yollar ve arşivler için OpenClaw şunları otomatik algılar:

- yerel OpenClaw Plugin'leri (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya varsayılan Claude bileşen düzeni)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

<Note>
Uyumlu paketler normal Plugin köküne yüklenir ve aynı liste/bilgi/etkinleştirme/devre dışı bırakma akışına katılır. Bugün paket Skills, Claude komut-Skills, Claude `settings.json` varsayılanları, Claude `.lsp.json` / manifest tarafından beyan edilen `lspServers` varsayılanları, Cursor komut-Skills ve uyumlu Codex kanca dizinleri desteklenmektedir; algılanan diğer paket yetenekleri tanılamalarda/bilgide gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmış değildir.
</Note>

### Listeleme

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Yalnızca etkin Plugin'leri gösterir.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Tablo görünümünden, kaynak/köken/sürüm/etkinleştirme metadata'sı içeren Plugin başına ayrıntı satırlarına geçer.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir envanter ve kayıt defteri tanılamaları.
</ParamField>

<Note>
`plugins list`, önce kalıcı yerel Plugin kayıt defterini okur; kayıt defteri eksik veya geçersizse manifest-only türetilmiş geri dönüşü kullanır. Bir Plugin'in yüklenip yüklenmediğini, etkin olup olmadığını ve soğuk başlangıç planlamasına görünür olup olmadığını denetlemek için yararlıdır, ancak zaten çalışan bir Gateway sürecinin canlı çalışma zamanı yoklaması değildir. Plugin kodunu, etkinleştirmeyi, kanca politikasını veya `plugins.load.paths` değerini değiştirdikten sonra yeni `register(api)` kodunun veya kancaların çalışmasını beklemeden önce kanalı sunan Gateway'i yeniden başlatın. Uzak/konteyner dağıtımlarında yalnızca bir sarmalayıcı süreci değil, gerçek `openclaw gateway run` alt sürecini yeniden başlattığınızı doğrulayın.
</Note>

Paketlenmiş bir Docker image içindeki paketlenmiş Plugin çalışmaları için Plugin
kaynak dizinini, eşleşen paketlenmiş kaynak yolu üzerine bind-mount edin; örneğin
`/app/extensions/synology-chat`. OpenClaw bu mount edilmiş kaynak
örtüsünü `/app/dist/extensions/synology-chat` öncesinde keşfeder; düz bir kopyalanmış kaynak
dizini etkisiz kalır, böylece normal paketlenmiş yüklemeler derlenmiş dist kullanmaya devam eder.

Çalışma zamanı kanca hata ayıklaması için:

- `openclaw plugins inspect <id> --json`, modül yüklenmiş inceleme geçişinden kayıtlı kancaları ve tanılamaları gösterir.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway'i, servis/süreç ipuçlarını, yapılandırma yolunu ve RPC sağlığını doğrular.
- Paketlenmemiş konuşma kancaları (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) için `plugins.entries.<id>.hooks.allowConversationAccess=true` gerekir.

Yerel bir dizini kopyalamaktan kaçınmak için `--link` kullanın (`plugins.load.paths` içine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force`, `--link` ile desteklenmez çünkü linklenmiş yüklemeler yönetilen bir yükleme hedefinin üzerine kopyalamak yerine kaynak yolu yeniden kullanır.

Yönetilen Plugin dizininde varsayılan davranışı sabitlenmemiş tutarken çözümlenen tam belirtimi (`name@version`) kaydetmek için npm yüklemelerinde `--pin` kullanın.
</Note>

### Plugin dizini

Plugin yükleme metadata'sı kullanıcı yapılandırması değil, makine tarafından yönetilen durumdur. Yüklemeler ve güncellemeler bunu etkin OpenClaw durum dizini altında `plugins/installs.json` dosyasına yazar. Üst düzey `installRecords` eşlemi, bozuk veya eksik Plugin manifest'lerine ait kayıtlar dâhil olmak üzere yükleme metadata'sının kalıcı kaynağıdır. `plugins` dizisi, manifest'ten türetilen soğuk kayıt defteri önbelleğidir. Dosya bir düzenlemeyin uyarısı içerir ve `openclaw plugins update`, kaldırma, tanılama ve soğuk Plugin kayıt defteri tarafından kullanılır.

OpenClaw, yapılandırmada gönderilmiş eski `plugins.installs` kayıtlarını gördüğünde bunları Plugin dizinine taşır ve yapılandırma anahtarını kaldırır; yazma işlemlerinden biri başarısız olursa yükleme metadata'sı kaybolmasın diye yapılandırma kayıtları korunur.

### Kaldırma

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, Plugin kayıtlarını `plugins.entries`, kalıcı Plugin dizini, Plugin izin/verme engelleme listesi girdileri ve uygunsa linklenmiş `plugins.load.paths` girdilerinden kaldırır. `--keep-files` ayarlı değilse kaldırma işlemi ayrıca, izlenen yönetilen yükleme dizinini OpenClaw'un Plugin uzantıları kökü içindeyse siler. Active Memory Plugin'leri için bellek yuvası `memory-core` olarak sıfırlanır.

<Note>
`--keep-config`, kullanımdan kaldırılmış bir takma ad olarak `--keep-files` yerine desteklenir.
</Note>

### Güncelleme

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Güncellemeler, yönetilen Plugin dizinindeki izlenen Plugin yüklemelerine ve `hooks.internal.installs` içindeki izlenen kanca paketi yüklemelerine uygulanır.

<AccordionGroup>
  <Accordion title="Plugin kimliği ile npm belirtimini çözümleme">
    Bir Plugin kimliği verdiğinizde OpenClaw, o Plugin için kaydedilmiş yükleme belirtimini yeniden kullanır. Bu, `@beta` gibi önceden saklanan dist-tag'lerin ve tam sabitlenmiş sürümlerin sonraki `update <id>` çalıştırmalarında da kullanılmaya devam ettiği anlamına gelir.

    npm yüklemeleri için bir dist-tag veya tam sürüm içeren açık bir npm paket belirtimi de verebilirsiniz. OpenClaw bu paket adını izlenen Plugin kaydına geri çözümler, o yüklü Plugin'i günceller ve gelecekte kimlik tabanlı güncellemeler için yeni npm belirtimini kaydeder.

    Sürüm veya etiket olmadan npm paket adını vermek de izlenen Plugin kaydına geri çözümlenir. Bir Plugin tam bir sürüme sabitlenmişse ve bunu kayıt defterinin varsayılan yayın hattına geri taşımak istiyorsanız bunu kullanın.

  </Accordion>
  <Accordion title="Sürüm denetimleri ve bütünlük sapması">
    Canlı bir npm güncellemesinden önce OpenClaw, yüklü paket sürümünü npm kayıt defteri metadata'sına göre denetler. Yüklü sürüm ile kaydedilen artifakt kimliği zaten çözümlenen hedefle eşleşiyorsa güncelleme indirme, yeniden yükleme veya `openclaw.json` dosyasını yeniden yazma olmadan atlanır.

    Depolanmış bir bütünlük hash'i varsa ve getirilen artifakt hash'i değişirse OpenClaw bunu npm artifakt sapması olarak değerlendirir. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek hash'leri yazdırır ve sürmeden önce onay ister. Etkileşimli olmayan güncelleme yardımcıları, çağıran açık bir devam politikası sağlamadıkça kapalı hata verir.

  </Accordion>
  <Accordion title="Güncellemede --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, Plugin güncellemeleri sırasında yerleşik tehlikeli kod taraması yanlış pozitifleri için son çare geçersiz kılması olarak `plugins update` üzerinde de kullanılabilir. Yine de Plugin `before_install` politika engellerini veya tarama hatası engellemesini atlamaz ve yalnızca Plugin güncellemelerine uygulanır, kanca paketi güncellemelerine uygulanmaz.
  </Accordion>
</AccordionGroup>

### İnceleme

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Tek bir Plugin için derin içgörü. Kimlik, yükleme durumu, kaynak, kaydedilmiş yetenekler, kancalar, araçlar, komutlar, servisler, Gateway yöntemleri, HTTP yolları, politika bayrakları, tanılamalar, yükleme metadata'sı, paket yetenekleri ve algılanan MCP veya LSP sunucusu desteğini gösterir.

Her Plugin, çalışma anında gerçekten ne kaydettiğine göre sınıflandırılır:

- **plain-capability** — tek bir yetenek türü (ör. yalnızca sağlayıcı olan bir Plugin)
- **hybrid-capability** — birden fazla yetenek türü (ör. metin + konuşma + görseller)
- **hook-only** — yalnızca kancalar, yetenek veya yüzey yok
- **non-capability** — araçlar/komutlar/servisler var ama yetenek yok

Yetenek modeli hakkında daha fazlası için bkz. [Plugin shapes](/tr/plugins/architecture#plugin-shapes).

<Note>
`--json` bayrağı, betik yazma ve denetim için uygun makine tarafından okunabilir bir rapor üretir. `inspect --all`, şekil, yetenek türleri, uyumluluk bildirimleri, paket yetenekleri ve kanca özeti sütunlarıyla tüm filo genelinde bir tablo üretir. `info`, `inspect` için bir takma addır.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, Plugin yükleme hatalarını, manifest/keşif tanılamalarını ve uyumluluk bildirimlerini raporlar. Her şey temiz olduğunda `No plugin issues detected.` yazdırır.

Eksik `register`/`activate` export'ları gibi modül şekli hataları için tanılama çıktısına kompakt bir export şekli özeti eklemek üzere `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Kayıt defteri

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Yerel Plugin kayıt defteri, yüklü Plugin kimliği, etkinleştirme, kaynak metadata'sı ve katkı sahipliği için OpenClaw'un kalıcı soğuk okuma modelidir. Normal başlangıç, sağlayıcı sahip araması, kanal kurulum sınıflandırması ve Plugin envanteri, çalışma zamanı Plugin modüllerini içe aktarmadan bunu okuyabilir.

Kalıcı kayıt defterinin mevcut, güncel veya bayat olup olmadığını incelemek için `plugins registry` kullanın. Kalıcı Plugin dizini, yapılandırma politikası ve manifest/package metadata'sından yeniden oluşturmak için `--refresh` kullanın. Bu bir onarım yoludur, çalışma zamanı etkinleştirme yolu değildir.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`, kayıt defteri okuma hataları için kullanımdan kaldırılmış bir son çare uyumluluk anahtarıdır. `plugins registry --refresh` veya `openclaw doctor --fix` tercih edin; env geri dönüşü yalnızca geçiş yayılırken acil başlangıç kurtarması içindir.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace listeleme; yerel bir marketplace yolu, bir `marketplace.json` yolu, `owner/repo` gibi bir GitHub kısaltması, bir GitHub repo URL'si veya bir git URL'si kabul eder. `--json`, çözümlenen kaynak etiketini ve ayrıştırılmış marketplace manifest'ini ve Plugin girdilerini yazdırır.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [CLI başvurusu](/tr/cli)
- [Topluluk Plugin'leri](/tr/plugins/community)
