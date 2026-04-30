---
read_when:
    - Gateway Plugin'lerini veya uyumlu paketleri kurmak ya da yönetmek istiyorsunuz
    - Plugin yükleme hatalarında hata ayıklamak istiyorsunuz
sidebarTitle: Plugins
summary: '`openclaw plugins` için CLI referansı (list, install, marketplace, uninstall, enable/disable, deps, doctor)'
title: Plugin'ler
x-i18n:
    generated_at: "2026-04-30T09:14:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 381e3243eaefb5b5e31db8fd2ba459773649a6ef427080a12018ea92b25f707c
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Pluginlerini, hook paketlerini ve uyumlu paketleri yönetin.

<CardGroup cols={2}>
  <Card title="Plugin sistemi" href="/tr/tools/plugin">
    Pluginleri yükleme, etkinleştirme ve sorunlarını giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Plugin paketleri" href="/tr/plugins/bundles">
    Paket uyumluluk modeli.
  </Card>
  <Card title="Plugin manifesti" href="/tr/plugins/manifest">
    Manifest alanları ve yapılandırma şeması.
  </Card>
  <Card title="Güvenlik" href="/tr/gateway/security">
    Plugin yüklemeleri için güvenlik sıkılaştırması.
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

Yavaş yükleme, inceleme, kaldırma veya kayıt yenileme araştırmaları için komutu `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ile çalıştırın. İz, aşama zamanlamalarını stderr’ye yazar ve JSON çıktısını ayrıştırılabilir tutar. Bkz. [Hata Ayıklama](/tr/help/debugging#plugin-lifecycle-trace).

<Note>
Birlikte gelen pluginler OpenClaw ile gönderilir. Bazıları varsayılan olarak etkindir (örneğin birlikte gelen model sağlayıcıları, birlikte gelen konuşma sağlayıcıları ve birlikte gelen tarayıcı Plugini); diğerleri `plugins enable` gerektirir.

Yerel OpenClaw pluginleri, satır içi JSON Schema (`configSchema`, boş olsa bile) içeren `openclaw.plugin.json` ile gönderilmelidir. Uyumlu paketler bunun yerine kendi paket manifestlerini kullanır.

`plugins list`, `Format: openclaw` veya `Format: bundle` gösterir. Ayrıntılı liste/bilgi çıktısı ayrıca paket alt türünü (`codex`, `claude` veya `cursor`) ve algılanan paket yeteneklerini gösterir.
</Note>

### Yükleme

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Çıplak paket adları önce ClawHub’a, ardından npm’ye göre denetlenir. Plugin yüklemelerini kod çalıştırmak gibi değerlendirin. Sabitlenmiş sürümleri tercih edin.
</Warning>

<Note>
ClawHub, çoğu plugin için birincil dağıtım ve keşif yüzeyidir. Npm desteklenen bir yedek ve doğrudan yükleme yolu olarak kalır. ClawHub’a geçiş sırasında OpenClaw, OpenClaw’a ait bazı `@openclaw/*` plugin paketlerini hâlâ npm üzerinde gönderir; bu paket sürümleri, plugin yayın trenleri arasında birlikte gelen kaynağın gerisinde kalabilir. Npm, OpenClaw’a ait bir plugin paketini kullanımdan kaldırılmış olarak bildirirse, yayımlanan o sürüm eski bir harici yapıdır; daha yeni bir npm paketi yayımlanana kadar mevcut OpenClaw ile birlikte gelen Plugini veya yerel bir checkout kullanın.
</Note>

<AccordionGroup>
  <Accordion title="Yapılandırma include’ları ve geçersiz yapılandırma kurtarma">
    `plugins` bölümünüz tek dosyalı bir `$include` tarafından destekleniyorsa, `plugins install/update/enable/disable/uninstall` bu dahil edilen dosyaya yazar ve `openclaw.json` dosyasına dokunmaz. Kök include’lar, include dizileri ve kardeş geçersiz kılmaları olan include’lar düzleştirilmek yerine kapalı hata verir. Desteklenen biçimler için bkz. [Yapılandırma include’ları](/tr/gateway/configuration).

    Yükleme sırasında yapılandırma geçersizse, `plugins install` normalde kapalı hata verir ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Gateway başlangıcında, bir plugin için geçersiz yapılandırma o plugine izole edilir; böylece diğer kanallar ve pluginler çalışmaya devam edebilir. `openclaw doctor --fix`, geçersiz plugin girdisini karantinaya alabilir. Belgelenmiş tek yükleme zamanı istisnası, açıkça `openclaw.install.allowInvalidConfigRecovery` seçeneğine dahil olan pluginler için dar kapsamlı bir birlikte gelen plugin kurtarma yoludur.

  </Accordion>
  <Accordion title="--force ve yeniden yükleme ile güncelleme karşılaştırması">
    `--force`, mevcut yükleme hedefini yeniden kullanır ve zaten yüklü olan bir plugini veya hook paketini yerinde üzerine yazar. Aynı kimliği yeni bir yerel yoldan, arşivden, ClawHub paketinden veya npm yapısından kasıtlı olarak yeniden yüklüyorsanız bunu kullanın. Zaten izlenen bir npm plugininin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` komutunu tercih edin.

    Zaten yüklü bir plugin kimliği için `plugins install` çalıştırırsanız OpenClaw durur ve normal yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna, geçerli yüklemeyi farklı bir kaynaktan gerçekten üzerine yazmak istediğinizde ise `plugins install <package> --force` komutuna yönlendirir.

  </Accordion>
  <Accordion title="--pin kapsamı">
    `--pin` yalnızca npm yüklemeleri için geçerlidir. `--marketplace` ile desteklenmez, çünkü marketplace yüklemeleri npm belirtimi yerine marketplace kaynak meta verilerini kalıcı hale getirir.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısındaki hatalı pozitifler için acil durum seçeneğidir. Yerleşik tarayıcı `critical` bulguları bildirdiğinde bile yüklemenin devam etmesine izin verir, ancak plugin `before_install` hook ilke engellerini **atlamaz** ve tarama hatalarını **atlamaz**.

    Bu CLI bayrağı, plugin yükleme/güncelleme akışlarına uygulanır. Gateway destekli skill bağımlılık yüklemeleri eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanırken, `openclaw skills install` ayrı bir ClawHub skill indirme/yükleme akışı olarak kalır.

    ClawHub’da yayımladığınız bir plugin kayıt taraması tarafından engelleniyorsa [ClawHub](/tr/tools/clawhub) bölümündeki yayıncı adımlarını kullanın.

  </Accordion>
  <Accordion title="Hook paketleri ve npm belirtimleri">
    `plugins install`, `package.json` içinde `openclaw.hooks` sunan hook paketleri için de yükleme yüzeyidir. Paket yüklemesi için değil, filtrelenmiş hook görünürlüğü ve hook başına etkinleştirme için `openclaw hooks` kullanın.

    Npm belirtimleri **yalnızca kayıt** içindir (paket adı + isteğe bağlı **tam sürüm** veya **dist-tag**). Git/URL/dosya belirtimleri ve semver aralıkları reddedilir. Bağımlılık yüklemeleri, kabuğunuzda genel npm yükleme ayarları olsa bile güvenlik için `--ignore-scripts` ile proje yerelinde çalışır.

    ClawHub aramasını atlayıp doğrudan npm’den yüklemek istediğinizde `npm:<package>` kullanın. Çıplak paket belirtimleri yine de ClawHub’ı tercih eder ve yalnızca ClawHub’da ilgili paket veya sürüm yoksa npm’ye geri döner.

    Çıplak belirtimler ve `@latest` kararlı kanalda kalır. npm bunlardan birini ön sürüme çözerse OpenClaw durur ve `@beta`/`@rc` gibi bir ön sürüm etiketiyle ya da `@1.2.3-beta.4` gibi tam bir ön sürümle açıkça dahil olmanızı ister.

    Çıplak bir yükleme belirtimi birlikte gelen bir plugin kimliğiyle eşleşirse (örneğin `diffs`), OpenClaw birlikte gelen plugini doğrudan yükler. Aynı ada sahip bir npm paketi yüklemek için açık kapsamlı bir belirtim kullanın (örneğin `@scope/diffs`).

  </Accordion>
  <Accordion title="Arşivler">
    Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Yerel OpenClaw plugin arşivleri, çıkarılan plugin kökünde geçerli bir `openclaw.plugin.json` içermelidir; yalnızca `package.json` içeren arşivler, OpenClaw yükleme kayıtlarını yazmadan önce reddedilir.

    Claude marketplace yüklemeleri de desteklenir.

  </Accordion>
</AccordionGroup>

ClawHub yüklemeleri açık bir `clawhub:<package>` konumlayıcısı kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw artık çıplak npm güvenli plugin belirtimleri için de ClawHub’ı tercih eder. Yalnızca ClawHub’da ilgili paket veya sürüm yoksa npm’ye geri döner:

```bash
openclaw plugins install openclaw-codex-app-server
```

Örneğin ClawHub erişilemez olduğunda veya paketin yalnızca npm’de bulunduğunu bildiğinizde npm’ye özel çözümlemeyi zorlamak için `npm:` kullanın:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw paket arşivini ClawHub’dan indirir, bildirilen plugin API / minimum gateway uyumluluğunu denetler, ardından normal arşiv yolu üzerinden yükler. Kaydedilen yüklemeler, sonraki güncellemeler için ClawHub kaynak meta verilerini korur.
Sürümsüz ClawHub yüklemeleri, `openclaw plugins update` komutunun daha yeni ClawHub sürümlerini izleyebilmesi için sürümsüz kaydedilmiş bir belirtim tutar; `clawhub:pkg@1.2.3` ve `clawhub:pkg@beta` gibi açık sürüm veya etiket seçicileri bu seçiciye sabitlenmiş kalır.

#### Marketplace kısayolu

Marketplace adı Claude’un `~/.claude/plugins/known_marketplaces.json` konumundaki yerel kayıt önbelleğinde varsa `plugin@marketplace` kısayolunu kullanın:

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
    - `owner/repo` gibi bir GitHub repo kısayolu
    - `https://github.com/owner/repo` gibi bir GitHub repo URL’si
    - bir git URL’si

  </Tab>
  <Tab title="Uzak marketplace kuralları">
    GitHub veya git üzerinden yüklenen uzak marketplace’ler için plugin girdileri klonlanan marketplace reposunun içinde kalmalıdır. OpenClaw, o repodan göreli yol kaynaklarını kabul eder; uzak manifestlerden HTTP(S), mutlak yol, git, GitHub ve diğer yol olmayan plugin kaynaklarını reddeder.
  </Tab>
</Tabs>

Yerel yollar ve arşivler için OpenClaw otomatik algılar:

- yerel OpenClaw pluginleri (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya varsayılan Claude bileşen düzeni)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

<Note>
Uyumlu paketler normal plugin köküne yüklenir ve aynı liste/bilgi/etkinleştirme/devre dışı bırakma akışına katılır. Bugün paket skill’leri, Claude command-skill’leri, Claude `settings.json` varsayılanları, Claude `.lsp.json` / manifest tarafından bildirilen `lspServers` varsayılanları, Cursor command-skill’leri ve uyumlu Codex hook dizinleri desteklenir; algılanan diğer paket yetenekleri tanılama/bilgi içinde gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmamıştır.
</Note>

### Liste

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Yalnızca etkin pluginleri göster.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Tablo görünümünden kaynak/köken/sürüm/etkinleştirme meta verilerini içeren plugin başına ayrıntı satırlarına geç.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir envanter ve kayıt tanılamaları.
</ParamField>

<Note>
`plugins list` önce kalıcı yerel Plugin kayıt defterini okur; kayıt defteri eksik veya geçersiz olduğunda yalnızca manifestten türetilen bir geri dönüş kullanır. Bir Plugin’in kurulu, etkin ve soğuk başlangıç planlamasına görünür olup olmadığını denetlemek için yararlıdır, ancak zaten çalışan bir Gateway sürecinin canlı çalışma zamanı yoklaması değildir. Plugin kodunu, etkinleştirmeyi, hook ilkesini veya `plugins.load.paths` değerini değiştirdikten sonra, yeni `register(api)` kodunun veya hook’ların çalışmasını beklemeden önce kanala hizmet veren Gateway’i yeniden başlatın. Uzak/konteyner dağıtımlarında, yalnızca bir sarmalayıcı süreci değil, gerçek `openclaw gateway run` alt sürecini yeniden başlattığınızı doğrulayın.
</Note>

Paketlenmiş bir Docker imajı içinde paketle birlikte gelen Plugin çalışması için, Plugin
kaynak dizinini eşleşen paketlenmiş kaynak yolunun üzerine bind-mount edin; örneğin
`/app/extensions/synology-chat`. OpenClaw bu bağlanan kaynak
katmanını `/app/dist/extensions/synology-chat` öncesinde keşfeder; düz kopyalanmış bir kaynak
dizini etkisiz kalır, böylece normal paketlenmiş kurulumlar derlenmiş dist’i kullanmaya devam eder.

Çalışma zamanı hook hata ayıklaması için:

- `openclaw plugins inspect <id> --json`, modül yüklenmiş bir inceleme geçişinden kayıtlı hook’ları ve tanıları gösterir.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway’i, hizmet/süreç ipuçlarını, yapılandırma yolunu ve RPC sağlığını doğrular.
- Paketle gelmeyen konuşma hook’ları (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.

Yerel bir dizini kopyalamaktan kaçınmak için `--link` kullanın (`plugins.load.paths` içine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force`, `--link` ile desteklenmez çünkü bağlantılı kurulumlar yönetilen bir kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullanır.

Varsayılan davranışı sabitlenmemiş bırakırken çözümlenen tam spec’i (`name@version`) yönetilen Plugin dizinine kaydetmek için npm kurulumlarında `--pin` kullanın.
</Note>

### Plugin dizini

Plugin kurulum meta verileri kullanıcı yapılandırması değil, makine tarafından yönetilen durumdur. Kurulumlar ve güncellemeler bunu etkin OpenClaw durum dizini altında `plugins/installs.json` içine yazar. Üst düzey `installRecords` haritası, bozuk veya eksik Plugin manifestleri için kayıtlar dahil olmak üzere kurulum meta verilerinin kalıcı kaynağıdır. `plugins` dizisi, manifestten türetilen soğuk kayıt defteri önbelleğidir. Dosya, düzenlemeyin uyarısı içerir ve `openclaw plugins update`, kaldırma, tanılama ve soğuk Plugin kayıt defteri tarafından kullanılır.

OpenClaw yapılandırmada gönderilmiş eski `plugins.installs` kayıtlarını gördüğünde, bunları Plugin dizinine taşır ve yapılandırma anahtarını kaldırır; yazma işlemlerinden biri başarısız olursa kurulum meta verilerinin kaybolmaması için yapılandırma kayıtları korunur.

### Çalışma zamanı bağımlılıkları

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps`, Plugin yapılandırması, etkin/yapılandırılmış kanallar, yapılandırılmış model sağlayıcıları veya paketle gelen manifest varsayılanları tarafından seçilen OpenClaw’a ait paketle gelen Plugin’ler için paketlenmiş çalışma zamanı bağımlılık aşamasını inceler. Üçüncü taraf npm veya ClawHub Plugin’leri için kurulum/güncelleme yolu değildir.

Paketlenmiş bir kurulum Gateway başlangıcı sırasında veya `plugins doctor` içinde eksik paketle gelen çalışma zamanı bağımlılıkları bildirdiğinde `--repair` kullanın. Onarım, yalnızca eksik etkin paketle gelen Plugin bağımlılıklarını yaşam döngüsü betikleri devre dışı olarak kurar. Eski paketlenmiş düzenlerden kalan bayat bilinmeyen harici çalışma zamanı bağımlılığı köklerini kaldırmak için `--prune` kullanın.

### Kaldırma

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, uygulanabildiğinde Plugin kayıtlarını `plugins.entries` içinden, kalıcı Plugin dizininden, Plugin izin/veri listesi girdilerinden ve bağlantılı `plugins.load.paths` girdilerinden kaldırır. `--keep-files` ayarlanmadıkça kaldırma, OpenClaw’ın Plugin uzantıları kökü içindeyse izlenen yönetilen kurulum dizinini de kaldırır. Active Memory Plugin’leri için bellek yuvası `memory-core` değerine sıfırlanır.

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

Güncellemeler, yönetilen Plugin dizinindeki izlenen Plugin kurulumlarına ve `hooks.internal.installs` içindeki izlenen hook paketi kurulumlarına uygulanır.

<AccordionGroup>
  <Accordion title="Plugin id ile npm spec çözümleme">
    Bir Plugin id’si verdiğinizde OpenClaw, o Plugin için kaydedilmiş kurulum spec’ini yeniden kullanır. Bu, `@beta` gibi önceden depolanmış dist-tag’lerin ve tam sabitlenmiş sürümlerin sonraki `update <id>` çalıştırmalarında kullanılmaya devam edeceği anlamına gelir.

    npm kurulumları için, dist-tag veya tam sürüm içeren açık bir npm paket spec’i de verebilirsiniz. OpenClaw bu paket adını izlenen Plugin kaydına geri çözümler, kurulu Plugin’i günceller ve gelecekteki id tabanlı güncellemeler için yeni npm spec’ini kaydeder.

    npm paket adını sürüm veya etiket olmadan vermek de izlenen Plugin kaydına geri çözümlenir. Bir Plugin tam bir sürüme sabitlenmişse ve onu kayıt defterinin varsayılan sürüm hattına geri taşımak istiyorsanız bunu kullanın.

  </Accordion>
  <Accordion title="Sürüm denetimleri ve bütünlük kayması">
    Canlı bir npm güncellemesinden önce OpenClaw, kurulu paket sürümünü npm kayıt defteri meta verilerine göre denetler. Kurulu sürüm ve kaydedilmiş yapıt kimliği zaten çözümlenen hedefle eşleşiyorsa güncelleme indirme, yeniden kurma veya `openclaw.json` yeniden yazma yapmadan atlanır.

    Depolanmış bir bütünlük hash’i varsa ve getirilen yapıt hash’i değişirse OpenClaw bunu npm yapıt kayması olarak ele alır. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek hash’leri yazdırır ve devam etmeden önce onay ister. Etkileşimsiz güncelleme yardımcıları, çağıran açık bir devam ilkesi sağlamadıkça kapalı şekilde başarısız olur.

  </Accordion>
  <Accordion title="Güncellemede --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, Plugin güncellemeleri sırasında yerleşik tehlikeli kod taraması yanlış pozitifleri için acil durum geçersiz kılması olarak `plugins update` üzerinde de kullanılabilir. Yine de Plugin `before_install` ilke engellerini veya tarama hatası engellemesini atlamaz ve yalnızca Plugin güncellemelerine uygulanır, hook paketi güncellemelerine uygulanmaz.
  </Accordion>
</AccordionGroup>

### İnceleme

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Tek bir Plugin için derin içgözlem. Kimliği, yükleme durumunu, kaynağı, kayıtlı yetenekleri, hook’ları, araçları, komutları, hizmetleri, Gateway yöntemlerini, HTTP rotalarını, ilke bayraklarını, tanıları, kurulum meta verilerini, paket yeteneklerini ve algılanan MCP veya LSP sunucu desteğini gösterir.

Her Plugin, çalışma zamanında gerçekten kaydettiklerine göre sınıflandırılır:

- **plain-capability** — tek yetenek türü (ör. yalnızca sağlayıcı Plugin’i)
- **hybrid-capability** — birden çok yetenek türü (ör. metin + konuşma + görüntüler)
- **hook-only** — yalnızca hook’lar, yetenek veya yüzey yok
- **non-capability** — araçlar/komutlar/hizmetler var ama yetenek yok

Yetenek modeli hakkında daha fazla bilgi için [Plugin şekilleri](/tr/plugins/architecture#plugin-shapes) bölümüne bakın.

<Note>
`--json` bayrağı, betik yazma ve denetim için uygun, makine tarafından okunabilir bir rapor çıktılar. `inspect --all`, şekil, yetenek türleri, uyumluluk bildirimleri, paket yetenekleri ve hook özeti sütunlarını içeren filo genelinde bir tablo işler. `info`, `inspect` için bir takma addır.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, Plugin yükleme hatalarını, manifest/keşif tanılarını ve uyumluluk bildirimlerini raporlar. Her şey temiz olduğunda `No plugin issues detected.` yazdırır.

Eksik `register`/`activate` dışa aktarımları gibi modül şekli hatalarında, tanı çıktısına kompakt bir dışa aktarım şekli özeti eklemek için `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Kayıt defteri

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Yerel Plugin kayıt defteri, kurulu Plugin kimliği, etkinleştirme, kaynak meta verileri ve katkı sahipliği için OpenClaw’ın kalıcı soğuk okuma modelidir. Normal başlangıç, sağlayıcı sahibi araması, kanal kurulum sınıflandırması ve Plugin envanteri, Plugin çalışma zamanı modüllerini içe aktarmadan bunu okuyabilir.

Kalıcı kayıt defterinin mevcut, güncel veya bayat olup olmadığını incelemek için `plugins registry` kullanın. Kalıcı Plugin dizininden, yapılandırma ilkesinden ve manifest/paket meta verilerinden yeniden oluşturmak için `--refresh` kullanın. Bu bir onarım yoludur, çalışma zamanı etkinleştirme yolu değildir.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`, kayıt defteri okuma hataları için kullanımdan kaldırılmış bir acil durum uyumluluk anahtarıdır. `plugins registry --refresh` veya `openclaw doctor --fix` tercih edin; env geri dönüşü yalnızca geçiş yayılırken acil başlangıç kurtarması içindir.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list yerel bir marketplace yolunu, bir `marketplace.json` yolunu, `owner/repo` gibi bir GitHub kısaltmasını, bir GitHub repo URL’sini veya bir git URL’sini kabul eder. `--json`, çözümlenen kaynak etiketinin yanı sıra ayrıştırılan marketplace manifestini ve Plugin girdilerini yazdırır.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [CLI başvurusu](/tr/cli)
- [Topluluk Plugin’leri](/tr/plugins/community)
