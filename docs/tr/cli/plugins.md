---
read_when:
    - Gateway Plugin'lerini veya uyumlu paketleri yüklemek ya da yönetmek istiyorsanız
    - Plugin yükleme hatalarında hata ayıklamak istiyorsunuz
sidebarTitle: Plugins
summary: '`openclaw plugins` için CLI başvurusu (list, install, marketplace, uninstall, enable/disable, deps, doctor)'
title: Pluginler
x-i18n:
    generated_at: "2026-05-01T08:59:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc4b2b753b541dd143e9c2f7e8a2153711a18e15773c65f91756d2729ca3d6fb
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin'lerini, kanca paketlerini ve uyumlu paketleri yönetin.

<CardGroup cols={2}>
  <Card title="Plugin sistemi" href="/tr/tools/plugin">
    Plugin'leri yükleme, etkinleştirme ve sorun giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Plugin paketleri" href="/tr/plugins/bundles">
    Paket uyumluluk modeli.
  </Card>
  <Card title="Plugin manifesti" href="/tr/plugins/manifest">
    Manifest alanları ve yapılandırma şeması.
  </Card>
  <Card title="Güvenlik" href="/tr/gateway/security">
    Plugin yüklemeleri için güvenlik güçlendirmesi.
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
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Yavaş yükleme, inceleme, kaldırma veya registry yenileme araştırması için komutu `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ile çalıştırın. İz, aşama zamanlamalarını stderr'ye yazar ve JSON çıktısını ayrıştırılabilir halde tutar. Bkz. [Hata ayıklama](/tr/help/debugging#plugin-lifecycle-trace).

<Note>
Paketlenmiş Plugin'ler OpenClaw ile birlikte gelir. Bazıları varsayılan olarak etkindir (örneğin paketlenmiş model sağlayıcıları, paketlenmiş konuşma sağlayıcıları ve paketlenmiş tarayıcı Plugin'i); diğerleri `plugins enable` gerektirir.

Yerel OpenClaw Plugin'leri satır içi JSON Schema (`configSchema`, boş olsa bile) içeren `openclaw.plugin.json` ile gelmelidir. Uyumlu paketler bunun yerine kendi paket manifestlerini kullanır.

`plugins list`, `Format: openclaw` veya `Format: bundle` gösterir. Ayrıntılı liste/bilgi çıktısı ayrıca paket alt türünü (`codex`, `claude` veya `cursor`) ve algılanan paket yeteneklerini gösterir.
</Note>

### Yükleme

```bash
openclaw plugins install <package>                      # Önce ClawHub, sonra npm
openclaw plugins install clawhub:<package>              # Yalnızca ClawHub
openclaw plugins install npm:<package>                  # Yalnızca npm
openclaw plugins install <package> --force              # mevcut yüklemenin üzerine yaz
openclaw plugins install <package> --pin                # sürümü sabitle
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # yerel yol
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (açıkça)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Yalın paket adları önce ClawHub, sonra npm ile denetlenir. Plugin yüklemelerini kod çalıştırmak gibi değerlendirin. Sabitlenmiş sürümleri tercih edin.
</Warning>

<Note>
ClawHub, çoğu Plugin için birincil dağıtım ve keşif yüzeyidir. Npm desteklenen bir yedek ve doğrudan yükleme yolu olmaya devam eder. ClawHub'a geçiş sırasında OpenClaw, OpenClaw'a ait bazı `@openclaw/*` Plugin paketlerini npm üzerinde yayımlamaya devam eder; bu paket sürümleri, Plugin yayın trenleri arasında paketlenmiş kaynağın gerisinde kalabilir. npm, OpenClaw'a ait bir Plugin paketini kullanımdan kaldırılmış olarak bildirirse bu yayımlanmış sürüm eski bir dış artefakttır; daha yeni bir npm paketi yayımlanana kadar güncel OpenClaw ile paketlenmiş Plugin'i veya yerel bir checkout kullanın.
</Note>

<AccordionGroup>
  <Accordion title="Yapılandırma include'ları ve geçersiz yapılandırma kurtarma">
    `plugins` bölümünüz tek dosyalı bir `$include` ile destekleniyorsa `plugins install/update/enable/disable/uninstall`, bu dahil edilen dosyaya yazar ve `openclaw.json` dosyasına dokunmaz. Kök include'lar, include dizileri ve kardeş override'lara sahip include'lar düzleştirmek yerine kapalı şekilde başarısız olur. Desteklenen biçimler için [Yapılandırma include'ları](/tr/gateway/configuration) bölümüne bakın.

    Yükleme sırasında yapılandırma geçersizse `plugins install` normalde kapalı şekilde başarısız olur ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Gateway başlatılırken bir Plugin için geçersiz yapılandırma o Plugin ile sınırlandırılır, böylece diğer kanallar ve Plugin'ler çalışmaya devam edebilir; `openclaw doctor --fix` geçersiz Plugin girdisini karantinaya alabilir. Belgelenmiş tek yükleme zamanı istisnası, açıkça `openclaw.install.allowInvalidConfigRecovery` seçeneğine katılan Plugin'ler için dar kapsamlı paketlenmiş Plugin kurtarma yoludur.

  </Accordion>
  <Accordion title="--force ve yeniden yükleme ile güncelleme karşılaştırması">
    `--force`, mevcut yükleme hedefini yeniden kullanır ve zaten yüklenmiş bir Plugin'in veya kanca paketinin üzerine yerinde yazar. Aynı kimliği yeni bir yerel yoldan, arşivden, ClawHub paketinden veya npm artefaktından bilinçli olarak yeniden yüklüyorsanız bunu kullanın. Zaten izlenen bir npm Plugin'inin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` tercih edin.

    Zaten yüklü olan bir Plugin kimliği için `plugins install` çalıştırırsanız OpenClaw durur ve normal yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna, mevcut yüklemenin üzerine gerçekten farklı bir kaynaktan yazmak istediğinizde ise `plugins install <package> --force` komutuna yönlendirir.

  </Accordion>
  <Accordion title="--pin kapsamı">
    `--pin` yalnızca npm yüklemeleri için geçerlidir. `--marketplace` ile desteklenmez, çünkü marketplace yüklemeleri npm spec yerine marketplace kaynak metaverilerini kalıcı hale getirir.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısındaki yanlış pozitifler için son çare seçeneğidir. Yerleşik tarayıcı `critical` bulgular bildirse bile yüklemenin devam etmesine izin verir, ancak Plugin `before_install` kanca ilkesi engellerini atlatmaz ve tarama hatalarını atlatmaz.

    Bu CLI bayrağı, Plugin yükleme/güncelleme akışları için geçerlidir. Gateway destekli skill bağımlılığı yüklemeleri eşleşen `dangerouslyForceUnsafeInstall` istek override'ını kullanırken, `openclaw skills install` ayrı bir ClawHub skill indirme/yükleme akışı olarak kalır.

    ClawHub üzerinde yayımladığınız bir Plugin registry taraması tarafından engellenirse [ClawHub](/tr/tools/clawhub) bölümündeki yayımcı adımlarını kullanın.

  </Accordion>
  <Accordion title="Kanca paketleri ve npm spec'leri">
    `plugins install`, `package.json` içinde `openclaw.hooks` sunan kanca paketleri için de yükleme yüzeyidir. Paket yükleme için değil, filtrelenmiş kanca görünürlüğü ve kanca bazında etkinleştirme için `openclaw hooks` kullanın.

    Npm spec'leri **yalnızca registry** içindir (paket adı + isteğe bağlı **tam sürüm** veya **dist-tag**). Git/URL/file spec'leri ve semver aralıkları reddedilir. Bağımlılık yüklemeleri, kabuğunuzda global npm yükleme ayarları olsa bile güvenlik için `--ignore-scripts` ile proje yerelinde çalışır.

    ClawHub aramasını atlayıp doğrudan npm'den yüklemek istediğinizde `npm:<package>` kullanın. Yalın paket spec'leri yine ClawHub'ı tercih eder ve yalnızca ClawHub'da o paket veya sürüm yoksa npm'ye geri döner.

    Yalın spec'ler ve `@latest` kararlı kanalda kalır. npm bunlardan birini bir ön sürüme çözümlerse OpenClaw durur ve `@beta`/`@rc` gibi bir ön sürüm etiketiyle veya `@1.2.3-beta.4` gibi tam bir ön sürümle açıkça katılmanızı ister.

    Yalın yükleme spec'i paketlenmiş bir Plugin kimliğiyle eşleşirse (örneğin `diffs`), OpenClaw paketlenmiş Plugin'i doğrudan yükler. Aynı ada sahip bir npm paketi yüklemek için açık kapsamlı bir spec kullanın (örneğin `@scope/diffs`).

  </Accordion>
  <Accordion title="Arşivler">
    Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Yerel OpenClaw Plugin arşivleri, çıkarılmış Plugin kökünde geçerli bir `openclaw.plugin.json` içermelidir; yalnızca `package.json` içeren arşivler, OpenClaw yükleme kayıtları yazmadan önce reddedilir.

    Claude marketplace yüklemeleri de desteklenir.

  </Accordion>
</AccordionGroup>

ClawHub yüklemeleri açık bir `clawhub:<package>` konumlayıcısı kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw artık yalın npm güvenli Plugin spec'leri için de ClawHub'ı tercih eder. Yalnızca ClawHub'da o paket veya sürüm yoksa npm'ye geri döner:

```bash
openclaw plugins install openclaw-codex-app-server
```

Örneğin ClawHub'a erişilemiyorsa veya paketin yalnızca npm'de bulunduğunu biliyorsanız npm'ye özel çözümlemeyi zorlamak için `npm:` kullanın:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw paket arşivini ClawHub'dan indirir, bildirilen Plugin API / minimum Gateway uyumluluğunu denetler, ardından normal arşiv yolu üzerinden yükler. Kaydedilen yüklemeler, sonraki güncellemeler için ClawHub kaynak metaverilerini korur.
Sürümsüz ClawHub yüklemeleri, `openclaw plugins update` komutunun daha yeni ClawHub sürümlerini izleyebilmesi için sürümsüz kaydedilmiş spec'i korur; `clawhub:pkg@1.2.3` ve `clawhub:pkg@beta` gibi açık sürüm veya etiket seçicileri o seçiciye sabitlenmiş olarak kalır.

#### Marketplace kısaltması

Marketplace adı Claude'un `~/.claude/plugins/known_marketplaces.json` konumundaki yerel registry önbelleğinde varsa `plugin@marketplace` kısaltmasını kullanın:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Marketplace kaynağını açıkça geçirmek istediğinizde `--marketplace` kullanın:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace kaynakları">
    - `~/.claude/plugins/known_marketplaces.json` içinden bir Claude bilinen marketplace adı
    - yerel bir marketplace kökü veya `marketplace.json` yolu
    - `owner/repo` gibi bir GitHub repo kısaltması
    - `https://github.com/owner/repo` gibi bir GitHub repo URL'si
    - bir git URL'si

  </Tab>
  <Tab title="Uzak marketplace kuralları">
    GitHub veya git üzerinden yüklenen uzak marketplace'ler için Plugin girdileri klonlanan marketplace repo'sunun içinde kalmalıdır. OpenClaw, o repo'dan göreli yol kaynaklarını kabul eder ve uzak manifestlerden HTTP(S), mutlak yol, git, GitHub ve diğer yol olmayan Plugin kaynaklarını reddeder.
  </Tab>
</Tabs>

Yerel yollar ve arşivler için OpenClaw otomatik algılama yapar:

- yerel OpenClaw Plugin'leri (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya varsayılan Claude bileşen yerleşimi)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

<Note>
Uyumlu paketler normal Plugin köküne yüklenir ve aynı liste/bilgi/etkinleştirme/devre dışı bırakma akışına katılır. Bugün paket skill'leri, Claude komut skill'leri, Claude `settings.json` varsayılanları, Claude `.lsp.json` / manifest beyanlı `lspServers` varsayılanları, Cursor komut skill'leri ve uyumlu Codex kanca dizinleri desteklenir; algılanan diğer paket yetenekleri tanılarda/bilgide gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmamıştır.
</Note>

### Liste

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Yalnızca etkin Plugin'leri göster.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Tablo görünümünden, kaynak/köken/sürüm/etkinleştirme metaverileri içeren Plugin başına ayrıntı satırlarına geç.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir envanter ve registry tanılamaları.
</ParamField>

<Note>
`plugins list`, önce kalıcı yerel Plugin kayıt defterini okur; kayıt defteri eksik veya geçersiz olduğunda yalnızca manifestten türetilmiş bir yedeğe döner. Bir Plugin'in kurulu, etkin ve soğuk başlatma planlamasında görünür olup olmadığını kontrol etmek için kullanışlıdır, ancak zaten çalışan bir Gateway işleminin canlı çalışma zamanı yoklaması değildir. Plugin kodunu, etkinleştirmeyi, hook ilkesini veya `plugins.load.paths` değerini değiştirdikten sonra, yeni `register(api)` kodunun veya hook'ların çalışmasını beklemeden önce kanala hizmet veren Gateway'i yeniden başlatın. Uzak/container dağıtımları için yalnızca bir sarmalayıcı işlemi değil, gerçek `openclaw gateway run` alt işlemini yeniden başlattığınızı doğrulayın.
</Note>

Paketlenmiş bir Docker imajı içinde paketli Plugin çalışması için Plugin
kaynak dizinini, `/app/extensions/synology-chat` gibi eşleşen paketlenmiş kaynak
yolunun üzerine bind-mount edin. OpenClaw, bu bağlanmış kaynak overlay'ini
`/app/dist/extensions/synology-chat` yolundan önce keşfeder; düz şekilde kopyalanmış
bir kaynak dizini etkisiz kalır, böylece normal paketlenmiş kurulumlar derlenmiş dist'i kullanmaya devam eder.

Çalışma zamanı hook hata ayıklaması için:

- `openclaw plugins inspect <id> --runtime --json`, modül yüklenmiş bir inceleme geçişinden kayıtlı hook'ları ve tanıları gösterir. Çalışma zamanı incelemesi, eksik paketli çalışma zamanı bağımlılıklarını asla indirmez; onarım gerektiğinde `openclaw plugins deps --repair` kullanın.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway'i, hizmet/işlem ipuçlarını, yapılandırma yolunu ve RPC sağlığını doğrular.
- Paketli olmayan konuşma hook'ları (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) için `plugins.entries.<id>.hooks.allowConversationAccess=true` gerekir.

Yerel bir dizini kopyalamaktan kaçınmak için `--link` kullanın (`plugins.load.paths` içine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force`, `--link` ile desteklenmez çünkü bağlantılı kurulumlar yönetilen kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullanır.

Varsayılan davranışı sabitlenmemiş tutarken çözümlenen kesin spec'i (`name@version`) yönetilen Plugin dizinine kaydetmek için npm kurulumlarında `--pin` kullanın.
</Note>

### Plugin dizini

Plugin kurulum meta verileri kullanıcı yapılandırması değil, makine tarafından yönetilen durumdur. Kurulumlar ve güncellemeler bunu etkin OpenClaw durum dizini altında `plugins/installs.json` dosyasına yazar. Üst düzey `installRecords` haritası, bozuk veya eksik Plugin manifest kayıtları dahil olmak üzere kurulum meta verilerinin kalıcı kaynağıdır. `plugins` dizisi, manifestten türetilmiş soğuk kayıt defteri önbelleğidir. Dosya bir düzenlemeyin uyarısı içerir ve `openclaw plugins update`, kaldırma, tanılar ve soğuk Plugin kayıt defteri tarafından kullanılır.

OpenClaw, yapılandırmada gönderilmiş eski `plugins.installs` kayıtlarını gördüğünde bunları Plugin dizinine taşır ve yapılandırma anahtarını kaldırır; yazma işlemlerinden biri başarısız olursa kurulum meta verileri kaybolmasın diye yapılandırma kayıtları korunur.

### Çalışma zamanı bağımlılıkları

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps`, Plugin yapılandırması, etkin/yapılandırılmış kanallar, yapılandırılmış model sağlayıcıları veya paketli manifest varsayılanları tarafından seçilen OpenClaw'a ait paketli Plugin'ler için paketlenmiş çalışma zamanı bağımlılık aşamasını inceler. Üçüncü taraf npm veya ClawHub Plugin'leri için kurulum/güncelleme yolu değildir.

Paketlenmiş bir kurulum, Gateway başlatma sırasında veya `plugins doctor` içinde eksik paketli çalışma zamanı bağımlılıkları bildirdiğinde `--repair` kullanın. Onarım yalnızca eksik etkin paketli-Plugin bağımlılıklarını yaşam döngüsü betikleri devre dışıyken kurar. Eski paketlenmiş düzenlerden kalan eski bilinmeyen harici çalışma zamanı bağımlılığı köklerini kaldırmak için `--prune` kullanın.

Tam plan, hazırlama ve onarım yaşam döngüsü için bkz. [Plugin bağımlılık çözümleme](/tr/plugins/dependency-resolution).

### Kaldırma

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, Plugin kayıtlarını `plugins.entries` içinden, kalıcı Plugin dizininden, Plugin izin/engelleme listesi girdilerinden ve geçerliyse bağlantılı `plugins.load.paths` girdilerinden kaldırır. `--keep-files` ayarlanmadığı sürece kaldırma, OpenClaw'ın Plugin uzantıları kökü içindeyse izlenen yönetilen kurulum dizinini de kaldırır. Active Memory Plugin'leri için bellek yuvası `memory-core` değerine sıfırlanır.

<Note>
`--keep-config`, `--keep-files` için kullanımdan kaldırılmış bir takma ad olarak desteklenir.
</Note>

### Güncelleme

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Güncellemeler, yönetilen Plugin dizinindeki izlenen Plugin kurulumlarına ve `hooks.internal.installs` içindeki izlenen hook-pack kurulumlarına uygulanır.

<AccordionGroup>
  <Accordion title="Plugin id ile npm spec çözümleme">
    Bir Plugin id'si verdiğinizde OpenClaw, o Plugin için kaydedilmiş kurulum spec'ini yeniden kullanır. Bu, `@beta` gibi daha önce saklanmış dist-tag'lerin ve kesin sabitlenmiş sürümlerin sonraki `update <id>` çalıştırmalarında kullanılmaya devam edeceği anlamına gelir.

    npm kurulumları için dist-tag veya kesin sürüm içeren açık bir npm paket spec'i de verebilirsiniz. OpenClaw bu paket adını izlenen Plugin kaydına geri çözümler, kurulu Plugin'i günceller ve gelecekteki id tabanlı güncellemeler için yeni npm spec'ini kaydeder.

    npm paket adını sürüm veya etiket olmadan vermek de izlenen Plugin kaydına geri çözümlenir. Bunu, bir Plugin kesin bir sürüme sabitlendiğinde ve onu kayıt defterinin varsayılan yayın hattına geri taşımak istediğinizde kullanın.

  </Accordion>
  <Accordion title="Sürüm kontrolleri ve bütünlük sapması">
    Canlı bir npm güncellemesinden önce OpenClaw, kurulu paket sürümünü npm kayıt defteri meta verilerine göre kontrol eder. Kurulu sürüm ve kaydedilmiş artifact kimliği çözümlenen hedefle zaten eşleşiyorsa güncelleme indirme, yeniden kurma veya `openclaw.json` dosyasını yeniden yazma olmadan atlanır.

    Saklanan bir bütünlük hash'i mevcutsa ve getirilen artifact hash'i değişirse OpenClaw bunu npm artifact sapması olarak değerlendirir. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek hash'leri yazdırır ve devam etmeden önce onay ister. Etkileşimsiz güncelleme yardımcıları, çağıran açık bir devam ilkesi sağlamadığı sürece kapalı şekilde başarısız olur.

  </Accordion>
  <Accordion title="Güncellemede --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, Plugin güncellemeleri sırasında yerleşik tehlikeli kod taraması yanlış pozitifleri için acil durum geçersiz kılması olarak `plugins update` üzerinde de kullanılabilir. Yine de Plugin `before_install` ilke engellerini veya tarama hatası engellemeyi atlamaz ve yalnızca Plugin güncellemelerine uygulanır, hook-pack güncellemelerine uygulanmaz.
  </Accordion>
</AccordionGroup>

### İnceleme

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect varsayılan olarak Plugin çalışma zamanını içe aktarmadan kimliği, yükleme durumunu, kaynağı, manifest yeteneklerini, ilke bayraklarını, tanıları, kurulum meta verilerini, paket yeteneklerini ve algılanan MCP veya LSP sunucu desteğini gösterir. Plugin modülünü yüklemek ve kayıtlı hook'ları, araçları, komutları, hizmetleri, gateway yöntemlerini ve HTTP rotalarını dahil etmek için `--runtime` ekleyin. Paketli çalışma zamanı bağımlılıkları eksik olduğunda çalışma zamanı incelemesi bir onarım ipucuyla başarısız olur; bunları açıkça onarmak için `openclaw plugins deps --repair` kullanın.

Her Plugin, çalışma zamanında gerçekten kaydettiklerine göre sınıflandırılır:

- **plain-capability** — tek yetenek türü (örn. yalnızca sağlayıcı Plugin'i)
- **hybrid-capability** — birden çok yetenek türü (örn. metin + konuşma + görseller)
- **hook-only** — yalnızca hook'lar, yetenek veya yüzey yok
- **non-capability** — araçlar/komutlar/hizmetler var ama yetenek yok

Yetenek modeli hakkında daha fazla bilgi için bkz. [Plugin şekilleri](/tr/plugins/architecture#plugin-shapes).

<Note>
`--json` bayrağı, betikleme ve denetim için uygun makine tarafından okunabilir bir rapor üretir. `inspect --all`, şekil, yetenek türleri, uyumluluk bildirimleri, paket yetenekleri ve hook özeti sütunları içeren filo genelinde bir tablo oluşturur. `info`, `inspect` için bir takma addır.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, Plugin yükleme hatalarını, manifest/keşif tanılarını ve uyumluluk bildirimlerini raporlar. Her şey temiz olduğunda `No plugin issues detected.` yazdırır.

Eksik `register`/`activate` dışa aktarımları gibi modül şekli hataları için tanı çıktısına kompakt bir dışa aktarım şekli özeti eklemek üzere `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Kayıt defteri

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Yerel Plugin kayıt defteri, kurulu Plugin kimliği, etkinleştirme, kaynak meta verileri ve katkı sahipliği için OpenClaw'ın kalıcı soğuk okuma modelidir. Normal başlatma, sağlayıcı sahibi arama, kanal kurulum sınıflandırması ve Plugin envanteri, Plugin çalışma zamanı modüllerini içe aktarmadan bunu okuyabilir.

Kalıcı kayıt defterinin mevcut, güncel veya eski olup olmadığını incelemek için `plugins registry` kullanın. Kalıcı Plugin dizininden, yapılandırma ilkesinden ve manifest/paket meta verilerinden yeniden oluşturmak için `--refresh` kullanın. Bu bir onarım yoludur, çalışma zamanı etkinleştirme yolu değildir.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`, kayıt defteri okuma hataları için kullanımdan kaldırılmış bir acil durum uyumluluk anahtarıdır. `plugins registry --refresh` veya `openclaw doctor --fix` tercih edin; env yedeği yalnızca geçiş yayına alınırken acil başlatma kurtarması içindir.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list yerel marketplace yolunu, `marketplace.json` yolunu, `owner/repo` gibi bir GitHub kısaltmasını, GitHub depo URL'sini veya git URL'sini kabul eder. `--json`, çözümlenen kaynak etiketini, ayrıştırılmış marketplace manifestini ve Plugin girdilerini yazdırır.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [CLI başvurusu](/tr/cli)
- [Topluluk Plugin'leri](/tr/plugins/community)
