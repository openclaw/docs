---
read_when:
    - Gateway Plugin'lerini veya uyumlu paketleri kurmak ya da yönetmek istiyorsunuz
    - Plugin yükleme hatalarını ayıklamak istiyorsunuz
sidebarTitle: Plugins
summary: '`openclaw plugins` için CLI referansı (list, install, marketplace, uninstall, enable/disable, doctor)'
title: Plugin'ler
x-i18n:
    generated_at: "2026-05-10T19:30:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6afa3ff12b3672d321d16c831672340ccde70b153671f2c328f578b5c66348b
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Pluginlerini, hook paketlerini ve uyumlu bundle'ları yönetin.

<CardGroup cols={2}>
  <Card title="Plugin sistemi" href="/tr/tools/plugin">
    Pluginleri yükleme, etkinleştirme ve sorun giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Pluginleri yönet" href="/tr/plugins/manage-plugins">
    Yükleme, listeleme, güncelleme, kaldırma ve yayımlama için hızlı örnekler.
  </Card>
  <Card title="Plugin bundle'ları" href="/tr/plugins/bundles">
    Bundle uyumluluk modeli.
  </Card>
  <Card title="Plugin manifest'i" href="/tr/plugins/manifest">
    Manifest alanları ve config şeması.
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

Yavaş yükleme, inceleme, kaldırma veya registry yenileme araştırması için komutu
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ile çalıştırın. Trace, faz zamanlamalarını
stderr'ye yazar ve JSON çıktısını ayrıştırılabilir tutar. Bkz. [Hata ayıklama](/tr/help/debugging#plugin-lifecycle-trace).

<Note>
Nix modunda (`OPENCLAW_NIX_MODE=1`), plugin yaşam döngüsü değiştiricileri devre dışıdır. Bu yükleme için `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` veya `plugins disable` yerine Nix kaynağını kullanın; nix-openclaw için agent öncelikli [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) bölümünü kullanın.
</Note>

<Note>
Bundle olarak gelen pluginler OpenClaw ile birlikte gönderilir. Bazıları varsayılan olarak etkindir (örneğin bundle model sağlayıcıları, bundle konuşma sağlayıcıları ve bundle tarayıcı plugini); diğerleri `plugins enable` gerektirir.

Yerel OpenClaw pluginleri, satır içi JSON Schema (`configSchema`, boş olsa bile) içeren `openclaw.plugin.json` dosyasıyla gönderilmelidir. Uyumlu bundle'lar bunun yerine kendi bundle manifestlerini kullanır.

`plugins list`, `Format: openclaw` veya `Format: bundle` gösterir. Ayrıntılı liste/bilgi çıktısı ayrıca bundle alt türünü (`codex`, `claude` veya `cursor`) ve algılanan bundle yeteneklerini gösterir.
</Note>

### Yükle

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
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

Kurulum zamanı yüklemelerini test eden bakımcılar, otomatik plugin yükleme
kaynaklarını korumalı ortam değişkenleriyle geçersiz kılabilir. Bkz.
[Plugin yükleme geçersiz kılmaları](/tr/plugins/install-overrides).

<Warning>
Çıplak paket adları, geçiş dönemi sırasında varsayılan olarak npm'den yüklenir. ClawHub için `clawhub:<package>` kullanın. Plugin yüklemelerini kod çalıştırmak gibi değerlendirin. Sabitlenmiş sürümleri tercih edin.
</Warning>

`plugins search`, yüklenebilir plugin paketleri için ClawHub'ı sorgular ve
yüklemeye hazır paket adlarını yazdırır. Skills değil, code-plugin ve bundle-plugin paketlerinde
arama yapar. ClawHub Skills için `openclaw skills search` kullanın.

<Note>
ClawHub, çoğu plugin için birincil dağıtım ve keşif yüzeyidir. Npm
desteklenen bir yedek ve doğrudan yükleme yolu olmaya devam eder. OpenClaw'a ait
`@openclaw/*` plugin paketleri yeniden npm'de yayımlanmaktadır; güncel liste için
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) veya
[plugin envanteri](/tr/plugins/plugin-inventory) sayfasına bakın. Kararlı yüklemeler `latest` kullanır.
Beta kanal yüklemeleri ve güncellemeleri, bu etiket mevcut olduğunda npm `beta` dist-tag'ini
tercih eder, ardından `latest` değerine geri döner.
</Note>

<AccordionGroup>
  <Accordion title="Config include'ları ve geçersiz config onarımı">
    `plugins` bölümünüz tek dosyalı bir `$include` tarafından destekleniyorsa, `plugins install/update/enable/disable/uninstall` o dahil edilen dosyaya yazar ve `openclaw.json` dosyasına dokunmaz. Kök include'lar, include dizileri ve kardeş geçersiz kılmalara sahip include'lar düzleştirmek yerine kapalı başarısız olur. Desteklenen şekiller için [Config include'ları](/tr/gateway/configuration) bölümüne bakın.

    Yükleme sırasında config geçersizse, `plugins install` normalde kapalı başarısız olur ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Gateway başlatması ve hot reload sırasında, geçersiz plugin config'i diğer tüm geçersiz config'ler gibi kapalı başarısız olur; `openclaw doctor --fix` geçersiz plugin girdisini karantinaya alabilir. Belgelenmiş tek yükleme zamanı istisnası, açıkça `openclaw.install.allowInvalidConfigRecovery` özelliğine katılan pluginler için dar kapsamlı bir bundle-plugin kurtarma yoludur.

  </Accordion>
  <Accordion title="--force ve güncelleme yerine yeniden yükleme">
    `--force`, mevcut yükleme hedefini yeniden kullanır ve zaten yüklü bir plugini veya hook paketini yerinde üzerine yazar. Aynı id'yi yeni bir yerel yoldan, arşivden, ClawHub paketinden veya npm artifact'inden kasıtlı olarak yeniden yüklediğinizde kullanın. Zaten izlenen bir npm plugininin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` tercih edin.

    Zaten yüklü bir plugin id'si için `plugins install` çalıştırırsanız OpenClaw durur ve normal yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna, mevcut yüklemeyi gerçekten farklı bir kaynaktan üzerine yazmak istediğinizde ise `plugins install <package> --force` komutuna yönlendirir.

  </Accordion>
  <Accordion title="--pin kapsamı">
    `--pin` yalnızca npm yüklemeleri için geçerlidir. `git:` yüklemeleriyle desteklenmez; sabitlenmiş bir kaynak istediğinizde `git:github.com/acme/plugin@v1.2.3` gibi açık bir git ref kullanın. `--marketplace` ile desteklenmez, çünkü marketplace yüklemeleri npm spec yerine marketplace kaynak metadata'sını kalıcılaştırır.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısındaki yanlış pozitifler için acil durum seçeneğidir. Yerleşik tarayıcı `critical` bulgular raporladığında bile yüklemenin devam etmesine izin verir, ancak plugin `before_install` hook politika engellerini **atlamaz** ve tarama hatalarını **atlamaz**.

    Bu CLI bayrağı, plugin yükleme/güncelleme akışları için geçerlidir. Gateway destekli skill bağımlılık yüklemeleri eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanırken, `openclaw skills install` ayrı bir ClawHub skill indirme/yükleme akışı olarak kalır.

    ClawHub'da yayımladığınız bir plugin registry taraması tarafından engellenirse, [ClawHub](/tr/clawhub/security) bölümündeki yayımcı adımlarını kullanın.

  </Accordion>
  <Accordion title="Hook paketleri ve npm spec'leri">
    `plugins install`, `package.json` içinde `openclaw.hooks` sunan hook paketleri için de yükleme yüzeyidir. Paket yüklemesi için değil, filtrelenmiş hook görünürlüğü ve hook başına etkinleştirme için `openclaw hooks` kullanın.

    Npm spec'leri **yalnızca registry** içindir (paket adı + isteğe bağlı **tam sürüm** veya **dist-tag**). Git/URL/file spec'leri ve semver aralıkları reddedilir. Bağımlılık yüklemeleri, kabuğunuzda global npm yükleme ayarları olsa bile güvenlik için `--ignore-scripts` ile proje yerelinde çalışır. Yönetilen plugin npm kökleri OpenClaw'ın paket düzeyi npm `overrides` değerlerini devralır; böylece host güvenlik pin'leri hoist edilmiş plugin bağımlılıklarına da uygulanır.

    npm çözümlemesini açık yapmak istediğinizde `npm:<package>` kullanın. Çıplak paket spec'leri de geçiş dönemi sırasında doğrudan npm'den yüklenir.

    Çıplak spec'ler ve `@latest` kararlı hatta kalır. `2026.5.3-1` gibi OpenClaw tarih damgalı düzeltme sürümleri bu kontrol için kararlı sürümlerdir. npm bunlardan birini prerelease olarak çözümlerse OpenClaw durur ve `@beta`/`@rc` gibi bir prerelease etiketiyle veya `@1.2.3-beta.4` gibi tam bir prerelease sürümüyle açıkça katılmanızı ister.

    Çıplak bir yükleme spec'i resmi bir plugin id'siyle eşleşirse (örneğin `diffs`), OpenClaw katalog girdisini doğrudan yükler. Aynı ada sahip bir npm paketi yüklemek için açık kapsamlı bir spec kullanın (örneğin `@scope/diffs`).

  </Accordion>
  <Accordion title="Git depoları">
    Doğrudan bir git deposundan yüklemek için `git:<repo>` kullanın. Desteklenen biçimler arasında `git:github.com/owner/repo`, `git:owner/repo`, tam `https://`, `ssh://`, `git://`, `file://` ve `git@host:owner/repo.git` clone URL'leri bulunur. Yüklemeden önce bir branch, tag veya commit'e geçmek için `@<ref>` veya `#<ref>` ekleyin.

    Git yüklemeleri geçici bir dizine clone eder, varsa istenen ref'i check out eder ve ardından normal plugin dizini yükleyicisini kullanır. Bu, manifest doğrulamasının, tehlikeli kod taramasının, package manager yükleme işinin ve yükleme kayıtlarının npm yüklemeleri gibi davrandığı anlamına gelir. Kaydedilen git yüklemeleri, kaynak URL/ref ile çözümlenen commit'i içerir; böylece `openclaw plugins update` kaynağı daha sonra yeniden çözümleyebilir.

    Git'ten yükledikten sonra Gateway yöntemleri ve CLI komutları gibi runtime kayıtlarını doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. Plugin `api.registerCli` ile bir CLI kökü kaydettiyse, bu komutu doğrudan OpenClaw kök CLI üzerinden yürütün, örneğin `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arşivler">
    Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Yerel OpenClaw plugin arşivleri, çıkarılan plugin kökünde geçerli bir `openclaw.plugin.json` içermelidir; yalnızca `package.json` içeren arşivler OpenClaw yükleme kayıtlarını yazmadan önce reddedilir.

    Dosya bir npm-pack tarball'ı olduğunda ve registry yüklemeleriyle kullanılan aynı yönetilen npm-root yükleme yolunu,
    `package-lock.json` doğrulaması, hoist edilmiş bağımlılık taraması ve
    npm yükleme kayıtları dahil test etmek istediğinizde `npm-pack:<path.tgz>` kullanın.
    Düz arşiv yolları yine de plugin extensions kökü altında yerel arşivler
    olarak yüklenir.

    Claude marketplace yüklemeleri de desteklenir.

  </Accordion>
</AccordionGroup>

ClawHub yüklemeleri açık bir `clawhub:<package>` locator'ı kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Çıplak npm açısından güvenli plugin spec'leri, geçiş dönemi sırasında varsayılan olarak npm'den yüklenir:

```bash
openclaw plugins install openclaw-codex-app-server
```

Yalnızca npm çözümlemesini açık yapmak için `npm:` kullanın:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw, kurulumdan önce duyurulan plugin API / minimum Gateway uyumluluğunu denetler. Seçilen ClawHub sürümü bir ClawPack yapıtı yayımladığında OpenClaw, sürümlenmiş npm-pack `.tgz` dosyasını indirir, ClawHub özet üst bilgisini ve yapıt özetini doğrular, ardından bunu normal arşiv yolu üzerinden kurar. ClawPack meta verisi olmayan eski ClawHub sürümleri, eski paket arşivi doğrulama yolu üzerinden kurulmaya devam eder. Kaydedilen kurulumlar, sonraki güncellemeler için ClawHub kaynak meta verilerini, yapıt türünü, npm bütünlüğünü, npm shasum değerini, tarball adını ve ClawPack özet bilgilerini saklar.
Sürümlenmemiş ClawHub kurulumları, `openclaw plugins update` komutunun daha yeni ClawHub sürümlerini izleyebilmesi için sürümlenmemiş bir kayıtlı belirtim tutar; `clawhub:pkg@1.2.3` ve `clawhub:pkg@beta` gibi açık sürüm veya etiket seçicileri bu seçiciye sabitlenmiş kalır.

#### Marketplace kısayolu

Marketplace adı Claude'un `~/.claude/plugins/known_marketplaces.json` konumundaki yerel kayıt önbelleğinde mevcut olduğunda `plugin@marketplace` kısayolunu kullanın:

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
  <Tab title="Marketplace sources">
    - `~/.claude/plugins/known_marketplaces.json` içinden bir Claude bilinen-marketplace adı
    - yerel bir marketplace kökü veya `marketplace.json` yolu
    - `owner/repo` gibi bir GitHub depo kısayolu
    - `https://github.com/owner/repo` gibi bir GitHub depo URL'si
    - bir git URL'si

  </Tab>
  <Tab title="Remote marketplace rules">
    GitHub veya git üzerinden yüklenen uzak marketplace'ler için plugin girdileri klonlanan marketplace deposunun içinde kalmalıdır. OpenClaw, bu depodan gelen göreli yol kaynaklarını kabul eder ve uzak manifestlerden gelen HTTP(S), mutlak-yol, git, GitHub ve diğer yol olmayan plugin kaynaklarını reddeder.
  </Tab>
</Tabs>

Yerel yollar ve arşivler için OpenClaw şunları otomatik algılar:

- yerel OpenClaw plugin'leri (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya varsayılan Claude bileşen yerleşimi)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

<Note>
Uyumlu paketler normal plugin köküne kurulur ve aynı liste/bilgi/etkinleştirme/devre dışı bırakma akışına katılır. Bugün paket skills'leri, Claude komut-skills'leri, Claude `settings.json` varsayılanları, Claude `.lsp.json` / manifest tarafından bildirilen `lspServers` varsayılanları, Cursor komut-skills'leri ve uyumlu Codex hook dizinleri desteklenir; algılanan diğer paket yetenekleri tanılarda/bilgide gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmamıştır.
</Note>

### Listeleme

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
  Yalnızca etkin plugin'leri göster.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Tablo görünümünden, kaynak/köken/sürüm/etkinleştirme meta verileriyle plugin başına ayrıntı satırlarına geç.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir envanterin yanı sıra kayıt tanıları ve paket bağımlılığı kurulum durumu.
</ParamField>

<Note>
`plugins list`, önce kalıcı yerel plugin kaydını okur; kayıt eksik veya geçersiz olduğunda yalnızca manifestten türetilmiş bir yedeği kullanır. Bir plugin'in kurulu, etkin ve soğuk başlatma planlamasında görünür olup olmadığını denetlemek için yararlıdır, ancak zaten çalışan bir Gateway sürecinin canlı çalışma zamanı yoklaması değildir. Plugin kodunu, etkinleştirmeyi, hook ilkesini veya `plugins.load.paths` değerini değiştirdikten sonra, yeni `register(api)` kodunun ya da hook'ların çalışmasını beklemeden önce kanala hizmet veren Gateway'i yeniden başlatın. Uzak/konteyner dağıtımları için, yalnızca bir sarmalayıcı süreci değil, gerçek `openclaw gateway run` alt sürecini yeniden başlattığınızı doğrulayın.

`plugins list --json`, her plugin'in `package.json` içindeki `dependencies` ve `optionalDependencies` değerlerinden gelen `dependencyStatus` bilgisini içerir. OpenClaw, bu paket adlarının plugin'in normal Node `node_modules` arama yolu boyunca mevcut olup olmadığını denetler; plugin çalışma zamanı kodunu içe aktarmaz, paket yöneticisi çalıştırmaz veya eksik bağımlılıkları onarmaz.
</Note>

`plugins search`, uzak bir ClawHub katalog aramasıdır. Yerel durumu incelemez, yapılandırmayı değiştirmez, paket kurmaz veya plugin çalışma zamanı kodunu yüklemez. Arama sonuçları ClawHub paket adını, ailesini, kanalını, sürümünü, özetini ve `openclaw plugins install clawhub:<package>` gibi bir kurulum ipucunu içerir.

Paketlenmiş bir Docker imajı içinde paketli plugin çalışması için, plugin kaynak dizinini eşleşen paketlenmiş kaynak yolu üzerine bind-mount edin; örneğin `/app/extensions/synology-chat`. OpenClaw, bu bağlanan kaynak örtüsünü `/app/dist/extensions/synology-chat` öncesinde keşfeder; düz kopyalanmış bir kaynak dizini etkisiz kalır, böylece normal paketlenmiş kurulumlar derlenmiş dist'i kullanmaya devam eder.

Çalışma zamanı hook hata ayıklaması için:

- `openclaw plugins inspect <id> --runtime --json`, modül yüklemeli bir inceleme geçişinden kayıtlı hook'ları ve tanıları gösterir. Çalışma zamanı incelemesi bağımlılıkları asla kurmaz; eski bağımlılık durumunu temizlemek veya yapılandırmada başvurulan eksik indirilebilir plugin'leri kurtarmak için `openclaw doctor --fix` kullanın.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway'i, hizmet/süreç ipuçlarını, yapılandırma yolunu ve RPC sağlığını doğrular.
- Paketli olmayan konuşma hook'ları (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.

Yerel bir dizini kopyalamaktan kaçınmak için `--link` kullanın (`plugins.load.paths` değerine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
Bağlantılı kurulumlar yönetilen bir kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullandığından `--force`, `--link` ile desteklenmez.

Varsayılan davranışı sabitlenmemiş halde tutarken yönetilen plugin dizininde çözümlenen tam belirtimi (`name@version`) kaydetmek için npm kurulumlarında `--pin` kullanın.
</Note>

### Plugin dizini

Plugin kurulum meta verisi kullanıcı yapılandırması değil, makine tarafından yönetilen durumdur. Kurulumlar ve güncellemeler bunu etkin OpenClaw durum dizini altında `plugins/installs.json` dosyasına yazar. Üst düzey `installRecords` haritası, bozuk veya eksik plugin manifestleri için kayıtlar dahil olmak üzere kurulum meta verilerinin kalıcı kaynağıdır. `plugins` dizisi manifestten türetilmiş soğuk kayıt önbelleğidir. Dosya, düzenlemeyin uyarısı içerir ve `openclaw plugins update`, kaldırma, tanılar ve soğuk plugin kaydı tarafından kullanılır.

OpenClaw, yapılandırmada gönderilmiş eski `plugins.installs` kayıtları gördüğünde, çalışma zamanı okumaları bunları `openclaw.json` dosyasını yeniden yazmadan uyumluluk girdisi olarak ele alır. Açık plugin yazmaları ve `openclaw doctor --fix`, yapılandırma yazmalarına izin verildiğinde bu kayıtları plugin dizinine taşır ve yapılandırma anahtarını kaldırır; yazmalardan biri başarısız olursa kurulum meta verilerinin kaybolmaması için yapılandırma kayıtları tutulur.

### Kaldırma

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, plugin kayıtlarını `plugins.entries` içinden, kalıcı plugin dizininden, plugin izin/engelleme listesi girdilerinden ve uygunsa bağlı `plugins.load.paths` girdilerinden kaldırır. `--keep-files` ayarlanmadığı sürece kaldırma, OpenClaw'ın plugin extensions kökü içinde olduğunda izlenen yönetilen kurulum dizinini de kaldırır. Active Memory plugin'leri için bellek yuvası `memory-core` değerine sıfırlanır.

<Note>
`--keep-config`, `--keep-files` için kullanımdan kaldırılmış bir takma ad olarak desteklenir.
</Note>

### Güncelleme

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Güncellemeler, yönetilen plugin dizininde izlenen plugin kurulumlarına ve `hooks.internal.installs` içindeki izlenen hook-pack kurulumlarına uygulanır.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Bir plugin kimliği geçirdiğinizde OpenClaw, o plugin için kayıtlı kurulum belirtimini yeniden kullanır. Bu, daha önce saklanan `@beta` gibi dist-tag'lerin ve tam sabitlenmiş sürümlerin sonraki `update <id>` çalıştırmalarında kullanılmaya devam edeceği anlamına gelir.

    npm kurulumları için dist-tag veya tam sürüm içeren açık bir npm paket belirtimi de geçirebilirsiniz. OpenClaw bu paket adını izlenen plugin kaydına geri çözümler, kurulu plugin'i günceller ve gelecekte kimlik tabanlı güncellemeler için yeni npm belirtimini kaydeder.

    Sürüm veya etiket olmadan npm paket adını geçirmek de izlenen plugin kaydına geri çözümlenir. Bunu, bir plugin tam bir sürüme sabitlenmişken onu kaydın varsayılan yayın hattına geri taşımak istediğinizde kullanın.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update`, yeni bir belirtim geçirmediğiniz sürece izlenen plugin belirtimini yeniden kullanır. `openclaw update` ayrıca etkin OpenClaw güncelleme kanalını bilir: beta kanalında, varsayılan hat npm ve ClawHub plugin kayıtları önce `@beta` değerini dener, ardından plugin beta yayını yoksa kayıtlı varsayılan/latest belirtimine geri döner. Tam sürümler ve açık etiketler bu seçiciye sabitlenmiş kalır.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Canlı bir npm güncellemesinden önce OpenClaw, kurulu paket sürümünü npm kayıt meta verilerine göre denetler. Kurulu sürüm ve kayıtlı yapıt kimliği çözümlenen hedefle zaten eşleşiyorsa güncelleme indirme, yeniden kurma veya `openclaw.json` dosyasını yeniden yazma olmadan atlanır.

    Saklanan bir bütünlük hash'i mevcut olduğunda ve alınan yapıt hash'i değiştiğinde OpenClaw bunu npm yapıt sapması olarak ele alır. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek hash'leri yazdırır ve devam etmeden önce onay ister. Etkileşimsiz güncelleme yardımcıları, çağıran açık bir devam ilkesi sağlamadığı sürece kapalı başarısız olur.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install`, plugin güncellemeleri sırasında yerleşik tehlikeli-kod taraması yanlış pozitifleri için acil durum geçersiz kılması olarak `plugins update` üzerinde de kullanılabilir. Yine de plugin `before_install` ilke engellerini veya tarama-başarısızlığı engellemesini aşmaz ve hook-pack güncellemelerine değil, yalnızca plugin güncellemelerine uygulanır.
  </Accordion>
</AccordionGroup>

### İnceleme

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect, varsayılan olarak plugin çalışma zamanını içe aktarmadan kimliği, yükleme durumunu, kaynağı, manifest yeteneklerini, ilke bayraklarını, tanıları, kurulum meta verilerini, paket yeteneklerini ve algılanan MCP veya LSP sunucu desteğini gösterir. Plugin modülünü yüklemek ve kayıtlı hook'ları, araçları, komutları, hizmetleri, gateway yöntemlerini ve HTTP rotalarını dahil etmek için `--runtime` ekleyin. Çalışma zamanı incelemesi eksik plugin bağımlılıklarını doğrudan bildirir; kurulumlar ve onarımlar `openclaw plugins install`, `openclaw plugins update` ve `openclaw doctor --fix` içinde kalır.

Plugin'e ait CLI komutları genellikle kök `openclaw` komut grupları olarak kurulur, ancak plugin'ler `openclaw nodes` gibi bir çekirdek üst öğenin altında iç içe komutlar da kaydedebilir. `inspect --runtime`, `cliCommands` altında bir komut gösterdikten sonra bunu listelenen yolda çalıştırın; örneğin `demo-git` kaydeden bir plugin `openclaw demo-git ping` ile doğrulanabilir.

Her plugin, çalışma zamanında gerçekten ne kaydettiğine göre sınıflandırılır:

- **düz-yetenek** — tek bir yetenek türü (örn. yalnızca sağlayıcı olan bir Plugin)
- **karma-yetenek** — birden çok yetenek türü (örn. metin + konuşma + görüntüler)
- **yalnızca-hook** — yalnızca hook'lar, yetenek veya yüzey yok
- **yeteneksiz** — araçlar/komutlar/hizmetler var ama yetenek yok

Yetenek modeli hakkında daha fazla bilgi için [Plugin şekilleri](/tr/plugins/architecture#plugin-shapes) bölümüne bakın.

<Note>
`--json` bayrağı, betik yazımı ve denetim için uygun, makine tarafından okunabilir bir rapor üretir. `inspect --all`, şekil, yetenek türleri, uyumluluk bildirimleri, paket yetenekleri ve hook özeti sütunları içeren filo genelinde bir tablo oluşturur. `info`, `inspect` için bir takma addır.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, Plugin yükleme hatalarını, manifest/keşif tanılamalarını ve uyumluluk bildirimlerini raporlar. Her şey temiz olduğunda `No plugin issues detected.` yazdırır.

Yapılandırılmış bir Plugin diskte mevcutsa ancak yükleyicinin yol güvenliği denetimleri tarafından engelleniyorsa, yapılandırma doğrulaması Plugin girdisini korur ve bunu `present but blocked` olarak raporlar. `plugins.entries.<id>` veya `plugins.allow` yapılandırmasını kaldırmak yerine, yol sahipliği ya da herkes tarafından yazılabilir izinler gibi önceki engellenmiş Plugin tanılamasını düzeltin.

Eksik `register`/`activate` dışa aktarımları gibi modül şekli hatalarında, tanılama çıktısına kompakt bir dışa aktarım şekli özeti eklemek için `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Yerel Plugin Registry, OpenClaw'ın kurulu Plugin kimliği, etkinleştirme, kaynak meta verileri ve katkı sahipliği için kalıcı soğuk okuma modelidir. Normal başlatma, sağlayıcı sahibi araması, kanal kurulum sınıflandırması ve Plugin envanteri, Plugin çalışma zamanı modüllerini içe aktarmadan bunu okuyabilir.

Kalıcı Registry'nin mevcut, güncel veya eski olup olmadığını incelemek için `plugins registry` kullanın. Kalıcı Plugin dizini, yapılandırma ilkesi ve manifest/paket meta verilerinden yeniden oluşturmak için `--refresh` kullanın. Bu bir onarım yoludur, çalışma zamanı etkinleştirme yolu değildir.

`openclaw doctor --fix`, Registry'ye yakın yönetilen npm sapmalarını da onarır: yönetilen Plugin npm kökü altında artık veya kurtarılmış bir `@openclaw/*` paketi paketlenmiş bir Plugin'i gölgeliyorsa, doctor bu eski paketi kaldırır ve Registry'yi yeniden oluşturarak başlatmanın paketlenmiş manifest'e göre doğrulanmasını sağlar.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`, Registry okuma hataları için kullanımı önerilmeyen bir acil durum uyumluluk anahtarıdır. `plugins registry --refresh` veya `openclaw doctor --fix` tercih edin; env geri dönüşü yalnızca geçiş kullanıma alınırken acil başlatma kurtarması içindir.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace listesi yerel bir marketplace yolu, bir `marketplace.json` yolu, `owner/repo` gibi bir GitHub kısaltması, bir GitHub depo URL'si veya bir git URL'si kabul eder. `--json`, çözümlenen kaynak etiketini ve ayrıştırılmış marketplace manifest'i ile Plugin girdilerini yazdırır.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [CLI referansı](/tr/cli)
- [ClawHub](/tr/clawhub)
