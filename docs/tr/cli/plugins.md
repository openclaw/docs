---
read_when:
    - Gateway Plugin'lerini veya uyumlu paketleri yüklemek ya da yönetmek istiyorsunuz
    - Plugin yükleme hatalarında hata ayıklamak istiyorsunuz
sidebarTitle: Plugins
summary: '`openclaw plugins` için CLI referansı (list, install, marketplace, uninstall, enable/disable, doctor)'
title: Plugin'ler
x-i18n:
    generated_at: "2026-05-04T09:07:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3f0ac9412e24f3598e9bab6389f770b3d0d26268d9907891697919d9371f1c1
    source_path: cli/plugins.md
    workflow: 16
---

OpenClaw docs kaynaklarında Gateway Plugin'lerini, hook paketlerini ve uyumlu paketleri yönetin.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/tr/tools/plugin">
    Plugin'leri yükleme, etkinleştirme ve sorun giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Manage plugins" href="/tr/plugins/manage-plugins">
    Yükleme, listeleme, güncelleme, kaldırma ve yayımlama için hızlı örnekler.
  </Card>
  <Card title="Plugin bundles" href="/tr/plugins/bundles">
    Paket uyumluluk modeli.
  </Card>
  <Card title="Plugin manifest" href="/tr/plugins/manifest">
    Manifest alanları ve yapılandırma şeması.
  </Card>
  <Card title="Security" href="/tr/gateway/security">
    Plugin kurulumları için güvenlik sıkılaştırması.
  </Card>
</CardGroup>

## Komutlar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
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
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Yavaş yükleme, inceleme, kaldırma veya kayıt yenileme araştırması için komutu `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ile çalıştırın. İz, aşama sürelerini stderr'ye yazar ve JSON çıktısını ayrıştırılabilir tutar. Bkz. [Hata ayıklama](/tr/help/debugging#plugin-lifecycle-trace).

<Note>
Birlikte gelen Plugin'ler OpenClaw ile gönderilir. Bazıları varsayılan olarak etkindir (örneğin birlikte gelen model sağlayıcıları, birlikte gelen konuşma sağlayıcıları ve birlikte gelen tarayıcı Plugin'i); diğerleri `plugins enable` gerektirir.

Yerel OpenClaw Plugin'leri satır içi JSON Schema (`configSchema`, boş olsa bile) içeren `openclaw.plugin.json` ile gönderilmelidir. Uyumlu paketler bunun yerine kendi paket manifestlerini kullanır.

`plugins list`, `Format: openclaw` veya `Format: bundle` gösterir. Ayrıntılı liste/bilgi çıktısı ayrıca paket alt türünü (`codex`, `claude` veya `cursor`) ve algılanan paket yeteneklerini gösterir.
</Note>

### Yükleme

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Düz paket adları, lansman geçişi sırasında varsayılan olarak npm'den yüklenir. ClawHub için `clawhub:<package>` kullanın. Plugin kurulumlarını kod çalıştırmak gibi ele alın. Sabitlenmiş sürümleri tercih edin.
</Warning>

`plugins search`, yüklenebilir Plugin paketleri için ClawHub'ı sorgular ve yüklemeye hazır paket adlarını yazdırır. Kod Plugin'i ve paket Plugin'i paketlerinde arama yapar, Skills içinde değil. ClawHub Skills için `openclaw skills search` kullanın.

<Note>
ClawHub, çoğu Plugin için birincil dağıtım ve keşif yüzeyidir. Npm desteklenen bir yedek ve doğrudan yükleme yolu olmaya devam eder. OpenClaw'a ait `@openclaw/*` Plugin paketleri yeniden npm'de yayımlanır; geçerli liste için [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) veya [Plugin envanteri](/tr/plugins/plugin-inventory) sayfasına bakın. Kararlı kurulumlar `latest` kullanır. Beta kanalı kurulumları ve güncellemeleri, bu etiket kullanılabilir olduğunda npm `beta` dist-tag'ini tercih eder, sonra `latest` sürümüne geri döner.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    `plugins` bölümünüz tek dosyalı bir `$include` tarafından destekleniyorsa, `plugins install/update/enable/disable/uninstall` bu dahil edilen dosyaya yazar ve `openclaw.json` dosyasına dokunmaz. Kök dahil etmeler, dahil etme dizileri ve kardeş geçersiz kılmaları olan dahil etmeler düzleştirilmek yerine kapalı şekilde başarısız olur. Desteklenen biçimler için [Yapılandırma dahil etmeleri](/tr/gateway/configuration) bölümüne bakın.

    Yükleme sırasında yapılandırma geçersizse, `plugins install` normalde kapalı şekilde başarısız olur ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Gateway başlatma ve hot reload sırasında geçersiz Plugin yapılandırması, diğer tüm geçersiz yapılandırmalar gibi kapalı şekilde başarısız olur; `openclaw doctor --fix` geçersiz Plugin girdisini karantinaya alabilir. Belgelenen tek yükleme zamanı istisnası, açıkça `openclaw.install.allowInvalidConfigRecovery` seçeneğine katılan Plugin'ler için dar kapsamlı bir birlikte gelen Plugin kurtarma yoludur.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force`, mevcut yükleme hedefini yeniden kullanır ve zaten yüklenmiş bir Plugin'i veya hook paketini yerinde üzerine yazar. Aynı kimliği yeni bir yerel yoldan, arşivden, ClawHub paketinden veya npm yapıtından bilerek yeniden yüklüyorsanız kullanın. Zaten izlenen bir npm Plugin'inin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` tercih edin.

    Zaten yüklü olan bir Plugin kimliği için `plugins install` çalıştırırsanız OpenClaw durur ve normal yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna, mevcut kurulumu farklı bir kaynaktan gerçekten üzerine yazmak istediğinizde ise `plugins install <package> --force` komutuna yönlendirir.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` yalnızca npm kurulumlarına uygulanır. `git:` kurulumlarıyla desteklenmez; sabitlenmiş bir kaynak istediğinizde `git:github.com/acme/plugin@v1.2.3` gibi açık bir git ref kullanın. `--marketplace` ile desteklenmez, çünkü marketplace kurulumları npm spec'i yerine marketplace kaynak meta verilerini kalıcı hale getirir.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısındaki yanlış pozitifler için acil durum seçeneğidir. Yerleşik tarayıcı `critical` bulguları bildirse bile kuruluma devam edilmesini sağlar, ancak Plugin `before_install` hook ilke engellerini **atlamaz** ve tarama hatalarını **atlamaz**.

    Bu CLI bayrağı Plugin yükleme/güncelleme akışlarına uygulanır. Gateway destekli skill bağımlılığı kurulumları eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanırken, `openclaw skills install` ayrı bir ClawHub skill indirme/yükleme akışı olmaya devam eder.

    ClawHub'da yayımladığınız bir Plugin kayıt taraması tarafından engellenirse [ClawHub](/tr/tools/clawhub) içindeki yayımlayıcı adımlarını kullanın.

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install`, `package.json` içinde `openclaw.hooks` sunan hook paketleri için de yükleme yüzeyidir. Paket kurulumu için değil, filtrelenmiş hook görünürlüğü ve hook başına etkinleştirme için `openclaw hooks` kullanın.

    Npm spec'leri **yalnızca kayıt** içindir (paket adı + isteğe bağlı **tam sürüm** veya **dist-tag**). Git/URL/dosya spec'leri ve semver aralıkları reddedilir. Bağımlılık kurulumları, kabuğunuzda genel npm kurulum ayarları olsa bile güvenlik için `--ignore-scripts` ile proje yerelinde çalışır.

    Npm çözümlemesini açık hale getirmek istediğinizde `npm:<package>` kullanın. Düz paket spec'leri de lansman geçişi sırasında doğrudan npm'den yüklenir.

    Düz spec'ler ve `@latest` kararlı hatta kalır. `2026.5.3-1` gibi OpenClaw tarih damgalı düzeltme sürümleri bu kontrol için kararlı sürümlerdir. npm bunlardan herhangi birini ön sürüme çözümlerse OpenClaw durur ve `@beta`/`@rc` gibi bir ön sürüm etiketiyle veya `@1.2.3-beta.4` gibi tam bir ön sürümle açıkça katılmanızı ister.

    Düz bir yükleme spec'i resmi bir Plugin kimliğiyle eşleşirse (örneğin `diffs`), OpenClaw katalog girdisini doğrudan yükler. Aynı ada sahip bir npm paketini yüklemek için açık kapsamlı bir spec kullanın (örneğin `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Bir git deposundan doğrudan yüklemek için `git:<repo>` kullanın. Desteklenen biçimler arasında `git:github.com/owner/repo`, `git:owner/repo`, tam `https://`, `ssh://`, `git://`, `file://` ve `git@host:owner/repo.git` klon URL'leri bulunur. Yüklemeden önce bir branch, etiket veya commit'i check out yapmak için `@<ref>` veya `#<ref>` ekleyin.

    Git kurulumları geçici bir dizine klonlar, varsa istenen ref'i check out yapar, ardından normal Plugin dizini yükleyicisini kullanır. Bu, manifest doğrulamasının, tehlikeli kod taramasının, paket yöneticisi kurulum işinin ve yükleme kayıtlarının npm kurulumları gibi davrandığı anlamına gelir. Kaydedilen git kurulumları, kaynak URL/ref'i ve çözümlenen commit'i içerir; böylece `openclaw plugins update` daha sonra kaynağı yeniden çözümleyebilir.

    Git'ten yükledikten sonra, Gateway yöntemleri ve CLI komutları gibi çalışma zamanı kayıtlarını doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. Plugin `api.registerCli` ile bir CLI kökü kaydettiyse, bu komutu doğrudan OpenClaw kök CLI üzerinden yürütün, örneğin `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Yerel OpenClaw Plugin arşivleri, çıkarılan Plugin kökünde geçerli bir `openclaw.plugin.json` içermelidir; yalnızca `package.json` içeren arşivler OpenClaw yükleme kayıtlarını yazmadan önce reddedilir.

    Claude marketplace kurulumları da desteklenir.

  </Accordion>
</AccordionGroup>

ClawHub kurulumları açık bir `clawhub:<package>` konumlayıcısı kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Düz npm güvenli Plugin spec'leri, lansman geçişi sırasında varsayılan olarak npm'den yüklenir:

```bash
openclaw plugins install openclaw-codex-app-server
```

Yalnızca npm çözümlemesini açık hale getirmek için `npm:` kullanın:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw, yüklemeden önce duyurulan Plugin API / minimum Gateway uyumluluğunu denetler. Seçilen ClawHub sürümü bir ClawPack yapıtı yayımladığında, OpenClaw sürümlü npm-pack `.tgz` dosyasını indirir, ClawHub özet başlığını ve yapıt özetini doğrular, ardından normal arşiv yolu üzerinden yükler. ClawPack meta verisi olmayan eski ClawHub sürümleri yine de eski paket arşivi doğrulama yolu üzerinden yüklenir. Kaydedilen kurulumlar, sonraki güncellemeler için ClawHub kaynak meta verilerini, yapıt türünü, npm bütünlüğünü, npm shasum'unu, tarball adını ve ClawPack özet bilgilerini saklar.
Sürümsüz ClawHub kurulumları, `openclaw plugins update` komutunun daha yeni ClawHub sürümlerini izleyebilmesi için sürümsüz kaydedilmiş spec'i korur; `clawhub:pkg@1.2.3` ve `clawhub:pkg@beta` gibi açık sürüm veya etiket seçicileri bu seçiciye sabitlenmiş kalır.

#### Marketplace kısaltması

Marketplace adı Claude'un `~/.claude/plugins/known_marketplaces.json` konumundaki yerel kayıt önbelleğinde mevcut olduğunda `plugin@marketplace` kısaltmasını kullanın:

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
    - `~/.claude/plugins/known_marketplaces.json` içinden Claude tarafından bilinen bir marketplace adı
    - yerel bir marketplace kökü veya `marketplace.json` yolu
    - `owner/repo` gibi bir GitHub repo kısaltması
    - `https://github.com/owner/repo` gibi bir GitHub repo URL'si
    - bir git URL'si

  </Tab>
  <Tab title="Uzak marketplace kuralları">
    GitHub veya git üzerinden yüklenen uzak marketplace'ler için, plugin girdileri klonlanan marketplace reposunun içinde kalmalıdır. OpenClaw bu repodan göreli yol kaynaklarını kabul eder ve uzak manifestlerden HTTP(S), mutlak yol, git, GitHub ve diğer yol olmayan plugin kaynaklarını reddeder.
  </Tab>
</Tabs>

Yerel yollar ve arşivler için OpenClaw şunları otomatik algılar:

- yerel OpenClaw pluginleri (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya varsayılan Claude bileşen düzeni)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

<Note>
Uyumlu paketler normal plugin köküne kurulur ve aynı liste/bilgi/etkinleştirme/devre dışı bırakma akışına katılır. Bugün paket Skills, Claude komut-skilleri, Claude `settings.json` varsayılanları, Claude `.lsp.json` / manifest tarafından bildirilen `lspServers` varsayılanları, Cursor komut-skilleri ve uyumlu Codex hook dizinleri desteklenir; algılanan diğer paket yetenekleri tanılarda/bilgide gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmamıştır.
</Note>

### Liste

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  Yalnızca etkinleştirilmiş pluginleri göster.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Tablo görünümünden kaynak/köken/sürüm/etkinleştirme meta verileriyle plugin başına ayrıntı satırlarına geç.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir envanter, ayrıca registry tanıları ve paket bağımlılığı kurulum durumu.
</ParamField>

<Note>
`plugins list` önce kalıcı yerel plugin registry'sini okur; registry eksik veya geçersiz olduğunda yalnızca manifestten türetilmiş bir geri dönüş kullanır. Bir pluginin kurulu, etkin ve soğuk başlangıç planlaması tarafından görünür olup olmadığını denetlemek için kullanışlıdır, ancak zaten çalışan bir Gateway sürecinin canlı çalışma zamanı yoklaması değildir. Plugin kodunu, etkinleştirmeyi, hook politikasını veya `plugins.load.paths` değerini değiştirdikten sonra, yeni `register(api)` kodunun veya hookların çalışmasını beklemeden önce kanala hizmet veren Gateway'i yeniden başlatın. Uzak/konteyner dağıtımları için yalnızca bir sarmalayıcı süreci değil, gerçek `openclaw gateway run` alt sürecini yeniden başlattığınızı doğrulayın.

`plugins list --json`, her pluginin `package.json` içindeki `dependencies` ve `optionalDependencies` kaynaklı `dependencyStatus` bilgisini içerir. OpenClaw bu paket adlarının pluginin normal Node `node_modules` arama yolunda mevcut olup olmadığını denetler; plugin çalışma zamanı kodunu içe aktarmaz, paket yöneticisi çalıştırmaz veya eksik bağımlılıkları onarmaz.
</Note>

`plugins search`, uzak bir ClawHub katalog aramasıdır. Yerel durumu incelemez, config'i değiştirmez, paket kurmaz veya plugin çalışma zamanı kodunu yüklemez. Arama sonuçları ClawHub paket adını, ailesini, kanalını, sürümünü, özetini ve `openclaw plugins install clawhub:<package>` gibi bir kurulum ipucunu içerir.

Paketlenmiş bir Docker imajı içindeki yerleşik plugin çalışması için, plugin kaynak dizinini `/app/extensions/synology-chat` gibi eşleşen paketlenmiş kaynak yolunun üzerine bind-mount edin. OpenClaw bu monte edilmiş kaynak örtüşmesini `/app/dist/extensions/synology-chat` öncesinde keşfeder; düz kopyalanmış bir kaynak dizini pasif kalır, böylece normal paketlenmiş kurulumlar derlenmiş dist'i kullanmaya devam eder.

Çalışma zamanı hook hata ayıklaması için:

- `openclaw plugins inspect <id> --runtime --json`, modül yüklemeli bir inceleme geçişinden kayıtlı hookları ve tanıları gösterir. Çalışma zamanı incelemesi hiçbir zaman bağımlılık kurmaz; eski bağımlılık durumunu temizlemek veya eksik yapılandırılmış indirilebilir pluginleri kurmak için `openclaw doctor --fix` kullanın.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway'i, hizmet/süreç ipuçlarını, config yolunu ve RPC sağlığını doğrular.
- Yerleşik olmayan konuşma hookları (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.

Yerel bir dizini kopyalamaktan kaçınmak için `--link` kullanın (`plugins.load.paths` değerine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force`, `--link` ile desteklenmez çünkü bağlantılı kurulumlar yönetilen bir kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullanır.

Varsayılan davranışı sabitlenmemiş tutarken çözümlenen kesin spec'i (`name@version`) yönetilen plugin dizinine kaydetmek için npm kurulumlarında `--pin` kullanın.
</Note>

### Plugin dizini

Plugin kurulum meta verileri kullanıcı config'i değil, makine tarafından yönetilen durumdur. Kurulumlar ve güncellemeler bunu etkin OpenClaw durum dizini altında `plugins/installs.json` dosyasına yazar. Üst düzey `installRecords` haritası, bozuk veya eksik plugin manifestlerine ait kayıtlar dahil olmak üzere kurulum meta verilerinin kalıcı kaynağıdır. `plugins` dizisi, manifestten türetilmiş soğuk registry önbelleğidir. Dosya, düzenlemeyin uyarısı içerir ve `openclaw plugins update`, kaldırma, tanılar ve soğuk plugin registry'si tarafından kullanılır.

OpenClaw config içinde gönderilmiş eski `plugins.installs` kayıtları gördüğünde, bunları plugin dizinine taşır ve config anahtarını kaldırır; yazma işlemlerinden biri başarısız olursa, kurulum meta verilerinin kaybolmaması için config kayıtları korunur.

### Kaldırma

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, plugin kayıtlarını `plugins.entries`, kalıcı plugin dizini, plugin izin/ret listesi girdileri ve geçerli olduğunda bağlantılı `plugins.load.paths` girdilerinden kaldırır. `--keep-files` ayarlanmadığı sürece kaldırma, OpenClaw'ın plugin extensions kökü içinde olduğunda izlenen yönetilen kurulum dizinini de kaldırır. Active Memory pluginleri için bellek slotu `memory-core` değerine sıfırlanır.

<Note>
`--keep-config`, `--keep-files` için kullanımdan kaldırılmış bir alias olarak desteklenir.
</Note>

### Güncelleme

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Güncellemeler, yönetilen plugin dizinindeki izlenen plugin kurulumlarına ve `hooks.internal.installs` içindeki izlenen hook paketi kurulumlarına uygulanır.

<AccordionGroup>
  <Accordion title="Plugin id ile npm spec çözümleme">
    Bir plugin id ilettiğinizde OpenClaw, o plugin için kaydedilmiş kurulum spec'ini yeniden kullanır. Bu, `@beta` gibi daha önce saklanmış dist-tag'lerin ve kesin sabitlenmiş sürümlerin sonraki `update <id>` çalıştırmalarında kullanılmaya devam edeceği anlamına gelir.

    npm kurulumları için dist-tag veya kesin sürüm içeren açık bir npm paket spec'i de iletebilirsiniz. OpenClaw bu paket adını izlenen plugin kaydına geri çözümler, o kurulu plugini günceller ve gelecekte id tabanlı güncellemeler için yeni npm spec'ini kaydeder.

    Sürüm veya etiket olmadan npm paket adını iletmek de izlenen plugin kaydına geri çözümlenir. Bir plugin kesin bir sürüme sabitlenmişse ve onu registry'nin varsayılan yayın hattına geri taşımak istiyorsanız bunu kullanın.

  </Accordion>
  <Accordion title="Beta kanal güncellemeleri">
    `openclaw plugins update`, yeni bir spec iletmediğiniz sürece izlenen plugin spec'ini yeniden kullanır. `openclaw update` ayrıca etkin OpenClaw güncelleme kanalını bilir: beta kanalında, varsayılan hat npm ve ClawHub plugin kayıtları önce `@beta` dener, ardından plugin beta yayını yoksa kaydedilmiş varsayılan/latest spec'e geri döner. Kesin sürümler ve açık etiketler o seçiciye sabitlenmiş kalır.

  </Accordion>
  <Accordion title="Sürüm denetimleri ve bütünlük sapması">
    Canlı bir npm güncellemesinden önce OpenClaw, kurulu paket sürümünü npm registry meta verileriyle karşılaştırır. Kurulu sürüm ve kaydedilmiş artifact kimliği çözümlenen hedefle zaten eşleşiyorsa, güncelleme indirme, yeniden kurma veya `openclaw.json` dosyasını yeniden yazma olmadan atlanır.

    Saklanmış bir bütünlük hash'i mevcutsa ve getirilen artifact hash'i değişirse, OpenClaw bunu npm artifact sapması olarak ele alır. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek hash'leri yazdırır ve devam etmeden önce onay ister. Etkileşimsiz güncelleme yardımcıları, çağıran açık bir devam politikası sağlamadıkça kapalı şekilde başarısız olur.

  </Accordion>
  <Accordion title="Güncellemede --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, plugin güncellemeleri sırasında yerleşik tehlikeli kod taraması yanlış pozitifleri için acil durum override'ı olarak `plugins update` üzerinde de kullanılabilir. Yine de plugin `before_install` politika engellerini veya tarama hatası engellemeyi aşmaz ve hook paketi güncellemelerine değil yalnızca plugin güncellemelerine uygulanır.
  </Accordion>
</AccordionGroup>

### İnceleme

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect, varsayılan olarak plugin çalışma zamanını içe aktarmadan kimliği, yükleme durumunu, kaynağı, manifest yeteneklerini, politika bayraklarını, tanıları, kurulum meta verilerini, paket yeteneklerini ve algılanan MCP veya LSP sunucu desteğini gösterir. Plugin modülünü yüklemek ve kayıtlı hookları, araçları, komutları, hizmetleri, gateway yöntemlerini ve HTTP rotalarını dahil etmek için `--runtime` ekleyin. Çalışma zamanı incelemesi eksik plugin bağımlılıklarını doğrudan bildirir; kurulumlar ve onarımlar `openclaw plugins install`, `openclaw plugins update` ve `openclaw doctor --fix` içinde kalır.

Pluginin sahip olduğu CLI komutları kök `openclaw` komut grupları olarak kurulur. `inspect --runtime`, `cliCommands` altında bir komut gösterdikten sonra bunu `openclaw <command> ...` olarak çalıştırın; örneğin `demo-git` kaydeden bir plugin `openclaw demo-git ping` ile doğrulanabilir.

Her plugin, çalışma zamanında gerçekten kaydettiklerine göre sınıflandırılır:

- **plain-capability** — tek bir yetenek türü (ör. yalnızca sağlayıcı plugini)
- **hybrid-capability** — birden çok yetenek türü (ör. metin + konuşma + görüntüler)
- **hook-only** — yalnızca hooklar, yetenek veya yüzey yok
- **non-capability** — araçlar/komutlar/hizmetler var ancak yetenek yok

Yetenek modeli hakkında daha fazlası için [Plugin şekilleri](/tr/plugins/architecture#plugin-shapes) bölümüne bakın.

<Note>
`--json` bayrağı, betik yazma ve denetim için uygun makine tarafından okunabilir bir rapor çıktılar. `inspect --all`, şekil, yetenek türleri, uyumluluk bildirimleri, paket yetenekleri ve hook özeti sütunlarıyla filo genelinde bir tablo işler. `info`, `inspect` için bir alias'tır.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, plugin yükleme hatalarını, manifest/keşif tanılarını ve uyumluluk bildirimlerini bildirir. Her şey temiz olduğunda `No plugin issues detected.` yazdırır.

Yapılandırılmış bir plugin diskte mevcutsa ancak loader'ın yol güvenliği denetimleri tarafından engelleniyorsa, config doğrulaması plugin girdisini korur ve bunu `present but blocked` olarak bildirir. `plugins.entries.<id>` veya `plugins.allow` config'ini kaldırmak yerine yol sahipliği veya herkes tarafından yazılabilir izinler gibi önceki engellenmiş plugin tanısını düzeltin.

Eksik `register`/`activate` dışa aktarımları gibi modül şekli hataları için, tanı çıktısına kompakt bir dışa aktarım şekli özeti eklemek üzere `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Yerel plugin registry'si, kurulu plugin kimliği, etkinleştirme, kaynak meta verileri ve katkı sahipliği için OpenClaw'ın kalıcı soğuk okuma modelidir. Normal başlangıç, sağlayıcı sahibi araması, kanal kurulum sınıflandırması ve plugin envanteri, plugin çalışma zamanı modüllerini içe aktarmadan bunu okuyabilir.

Kalıcı kayıt defterinin mevcut, güncel veya eski olup olmadığını incelemek için `plugins registry` kullanın. Kalıcı Plugin dizininden, yapılandırma politikasından ve manifest/paket meta verilerinden yeniden oluşturmak için `--refresh` kullanın. Bu bir onarım yoludur, çalışma zamanı etkinleştirme yolu değildir.

`openclaw doctor --fix`, kayıt defteriyle ilişkili yönetilen npm sapmalarını da onarır: yönetilen Plugin npm kökü altındaki sahipsiz bir `@openclaw/*` paketi paketle gelen bir Plugin’i gölgelerse, doctor bu eski paketi kaldırır ve başlangıcın paketle gelen manifeste göre doğrulanması için kayıt defterini yeniden oluşturur.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`, kayıt defteri okuma hataları için kullanımı önerilmeyen bir son çare uyumluluk anahtarıdır. `plugins registry --refresh` veya `openclaw doctor --fix` tercih edin; env geri dönüşü yalnızca geçiş kullanıma alınırken acil başlangıç kurtarma içindir.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace listesi yerel bir marketplace yolunu, bir `marketplace.json` yolunu, `owner/repo` gibi bir GitHub kısaltmasını, bir GitHub repo URL’sini veya bir git URL’sini kabul eder. `--json`, çözümlenen kaynak etiketinin yanı sıra ayrıştırılmış marketplace manifestini ve Plugin girdilerini yazdırır.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [CLI başvurusu](/tr/cli)
- [Topluluk Plugin’leri](/tr/plugins/community)
