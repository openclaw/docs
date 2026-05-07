---
read_when:
    - Gateway Plugin'lerini veya uyumlu paketleri yüklemek ya da yönetmek istiyorsunuz
    - Plugin yükleme hatalarında hata ayıklamak istiyorsunuz
sidebarTitle: Plugins
summary: '`openclaw plugins` için CLI referansı (list, install, marketplace, uninstall, enable/disable, doctor)'
title: Pluginler
x-i18n:
    generated_at: "2026-05-07T01:51:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43d51a8ecc2d420991e7beb585cbf3046d44cd6dca755377f4c050c7a155064
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin'lerini, hook paketlerini ve uyumlu bundle'ları yönetin.

<CardGroup cols={2}>
  <Card title="Plugin sistemi" href="/tr/tools/plugin">
    Plugin'leri yükleme, etkinleştirme ve sorunlarını giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Plugin'leri yönet" href="/tr/plugins/manage-plugins">
    Yükleme, listeleme, güncelleme, kaldırma ve yayımlama için hızlı örnekler.
  </Card>
  <Card title="Plugin bundle'ları" href="/tr/plugins/bundles">
    Bundle uyumluluk modeli.
  </Card>
  <Card title="Plugin manifest'i" href="/tr/plugins/manifest">
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

Yavaş yükleme, inceleme, kaldırma veya kayıt yenileme araştırması için komutu
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ile çalıştırın. İz, aşama sürelerini stderr'e
yazar ve JSON çıktısını ayrıştırılabilir tutar. Bkz. [Hata ayıklama](/tr/help/debugging#plugin-lifecycle-trace).

<Note>
Nix modunda (`OPENCLAW_NIX_MODE=1`), Plugin yaşam döngüsü değiştiricileri devre dışıdır. Bu yükleme için `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` veya `plugins disable` yerine Nix kaynağını kullanın; nix-openclaw için agent-first [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) bölümünü kullanın.
</Note>

<Note>
Paketlenmiş Plugin'ler OpenClaw ile birlikte gelir. Bazıları varsayılan olarak etkindir (örneğin paketlenmiş model sağlayıcıları, paketlenmiş konuşma sağlayıcıları ve paketlenmiş tarayıcı Plugin'i); diğerleri `plugins enable` gerektirir.

Yerel OpenClaw Plugin'leri, satır içi JSON Schema (`configSchema`, boş olsa bile) içeren `openclaw.plugin.json` ile gönderilmelidir. Uyumlu bundle'lar bunun yerine kendi bundle manifest'lerini kullanır.

`plugins list`, `Format: openclaw` veya `Format: bundle` gösterir. Ayrıntılı liste/bilgi çıktısı ayrıca bundle alt türünü (`codex`, `claude` veya `cursor`) ve algılanan bundle yeteneklerini gösterir.
</Note>

### Yükleme

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

<Warning>
Yalın paket adları, geçişin başlatılması sırasında varsayılan olarak npm'den yüklenir. ClawHub için `clawhub:<package>` kullanın. Plugin yüklemelerini kod çalıştırmak gibi değerlendirin. Sabitlenmiş sürümleri tercih edin.
</Warning>

`plugins search`, yüklenebilir Plugin paketleri için ClawHub'ı sorgular ve
yüklemeye hazır paket adlarını yazdırır. Kod-Plugin ve bundle-Plugin paketlerinde arama yapar,
Skills içinde değil. ClawHub Skills için `openclaw skills search` kullanın.

<Note>
ClawHub, çoğu Plugin için birincil dağıtım ve keşif yüzeyidir. Npm
desteklenen bir geri dönüş ve doğrudan yükleme yolu olmaya devam eder. OpenClaw'a ait
`@openclaw/*` Plugin paketleri tekrar npm'de yayımlanır; güncel listeye
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) üzerinden veya
[Plugin envanteri](/tr/plugins/plugin-inventory) bölümünden bakın. Kararlı yüklemeler `latest` kullanır.
Beta kanalı yüklemeleri ve güncellemeleri, bu etiket kullanılabilir olduğunda npm `beta` dist-tag'ini
tercih eder, ardından `latest`'e geri döner.
</Note>

<AccordionGroup>
  <Accordion title="Yapılandırma include'ları ve geçersiz yapılandırma onarımı">
    `plugins` bölümünüz tek dosyalı bir `$include` tarafından destekleniyorsa, `plugins install/update/enable/disable/uninstall` bu dahil edilen dosyaya yazar ve `openclaw.json` dosyasına dokunmaz. Kök include'ları, include dizileri ve kardeş override'ları olan include'lar düzleştirilmek yerine kapalı başarısız olur. Desteklenen şekiller için [Yapılandırma include'ları](/tr/gateway/configuration) bölümüne bakın.

    Yükleme sırasında yapılandırma geçersizse, `plugins install` normalde kapalı başarısız olur ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Gateway başlatma ve sıcak yeniden yükleme sırasında geçersiz Plugin yapılandırması, diğer tüm geçersiz yapılandırmalar gibi kapalı başarısız olur; `openclaw doctor --fix` geçersiz Plugin girdisini karantinaya alabilir. Belgelenen tek yükleme zamanı istisnası, açıkça `openclaw.install.allowInvalidConfigRecovery` seçeneğine katılan Plugin'ler için dar bir paketlenmiş-Plugin kurtarma yoludur.

  </Accordion>
  <Accordion title="--force ve yeniden yükleme ile güncelleme karşılaştırması">
    `--force`, mevcut yükleme hedefini yeniden kullanır ve zaten yüklenmiş bir Plugin'i veya hook paketini yerinde üzerine yazar. Aynı id'yi yeni bir yerel yoldan, arşivden, ClawHub paketinden veya npm artifact'inden bilerek yeniden yüklüyorsanız bunu kullanın. Zaten izlenen bir npm Plugin'inin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` tercih edin.

    Zaten yüklenmiş bir Plugin id'si için `plugins install` çalıştırırsanız, OpenClaw durur ve normal yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna, mevcut yüklemeyi gerçekten farklı bir kaynaktan üzerine yazmak istediğinizde ise `plugins install <package> --force` komutuna yönlendirir.

  </Accordion>
  <Accordion title="--pin kapsamı">
    `--pin` yalnızca npm yüklemelerine uygulanır. `git:` yüklemeleriyle desteklenmez; sabitlenmiş bir kaynak istediğinizde `git:github.com/acme/plugin@v1.2.3` gibi açık bir git ref'i kullanın. `--marketplace` ile desteklenmez, çünkü marketplace yüklemeleri npm spec'i yerine marketplace kaynak meta verilerini kalıcı hale getirir.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısındaki yanlış pozitifler için bir acil durum seçeneğidir. Yerleşik tarayıcı `critical` bulgular bildirdiğinde bile yüklemenin devam etmesine izin verir, ancak Plugin `before_install` hook ilke engellerini **atlamaz** ve tarama hatalarını **atlamaz**.

    Bu CLI flag'i Plugin yükleme/güncelleme akışlarına uygulanır. Gateway destekli skill bağımlılığı yüklemeleri eşleşen `dangerouslyForceUnsafeInstall` istek override'ını kullanırken, `openclaw skills install` ayrı bir ClawHub skill indirme/yükleme akışı olarak kalır.

    ClawHub'da yayımladığınız bir Plugin kayıt taraması tarafından engellenirse, [ClawHub](/tr/tools/clawhub) içindeki yayımcı adımlarını kullanın.

  </Accordion>
  <Accordion title="Hook paketleri ve npm spec'leri">
    `plugins install`, `package.json` içinde `openclaw.hooks` sunan hook paketleri için de yükleme yüzeyidir. Paket yüklemesi için değil, filtrelenmiş hook görünürlüğü ve hook başına etkinleştirme için `openclaw hooks` kullanın.

    Npm spec'leri **yalnızca kayıt** içindir (paket adı + isteğe bağlı **tam sürüm** veya **dist-tag**). Git/URL/file spec'leri ve semver aralıkları reddedilir. Bağımlılık yüklemeleri, kabuğunuzda genel npm yükleme ayarları olsa bile güvenlik için `--ignore-scripts` ile proje yerelinde çalışır. Yönetilen Plugin npm kökleri OpenClaw'ın paket düzeyi npm `overrides` değerlerini devralır, böylece host güvenlik pin'leri hoist edilmiş Plugin bağımlılıklarına da uygulanır.

    Npm çözümlemesini açık hale getirmek istediğinizde `npm:<package>` kullanın. Yalın paket spec'leri de geçişin başlatılması sırasında doğrudan npm'den yüklenir.

    Yalın spec'ler ve `@latest` kararlı hatta kalır. `2026.5.3-1` gibi eski OpenClaw düzeltme sürümleri, eski paketlerin güvenli şekilde güncellenmeye devam etmesi için bu kontrolde hâlâ kararlı sürümler olarak değerlendirilir. Yeni aylık destek hattı çalışmalarının tireli düzeltme sonekleri yerine normal SemVer patch numaraları kullanması planlanır. npm varsayılan hat spec'ini bir ön sürüme çözümlerse, OpenClaw durur ve `@beta`/`@rc` gibi bir ön sürüm etiketiyle veya `@1.2.3-beta.4` gibi tam bir ön sürümle açıkça katılmanızı ister.

    Yalın bir yükleme spec'i resmi bir Plugin id'siyle eşleşirse (örneğin `diffs`), OpenClaw katalog girdisini doğrudan yükler. Aynı ada sahip bir npm paketi yüklemek için açık bir scoped spec kullanın (örneğin `@scope/diffs`).

  </Accordion>
  <Accordion title="Git depoları">
    Doğrudan bir git deposundan yüklemek için `git:<repo>` kullanın. Desteklenen biçimler arasında `git:github.com/owner/repo`, `git:owner/repo`, tam `https://`, `ssh://`, `git://`, `file://` ve `git@host:owner/repo.git` clone URL'leri bulunur. Yüklemeden önce bir branch, tag veya commit'i checkout etmek için `@<ref>` veya `#<ref>` ekleyin.

    Git yüklemeleri geçici bir dizine clone eder, varsa istenen ref'i checkout eder, ardından normal Plugin dizini yükleyicisini kullanır. Bu, manifest doğrulamasının, tehlikeli kod taramasının, package-manager yükleme işinin ve yükleme kayıtlarının npm yüklemeleri gibi davrandığı anlamına gelir. Kaydedilen git yüklemeleri, kaynak URL/ref'i ve çözümlenen commit'i içerir; böylece `openclaw plugins update` daha sonra kaynağı yeniden çözümleyebilir.

    Git'ten yükledikten sonra, gateway yöntemleri ve CLI komutları gibi runtime kayıtlarını doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. Plugin `api.registerCli` ile bir CLI kökü kaydettiyse, bu komutu doğrudan OpenClaw kök CLI üzerinden çalıştırın; örneğin `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arşivler">
    Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Yerel OpenClaw Plugin arşivleri, çıkarılan Plugin kökünde geçerli bir `openclaw.plugin.json` içermelidir; yalnızca `package.json` içeren arşivler, OpenClaw yükleme kayıtları yazmadan önce reddedilir.

    Dosya bir npm-pack tarball ise ve kayıt yüklemeleriyle aynı yönetilen npm-root yükleme yolunu test etmek istiyorsanız `npm-pack:<path.tgz>` kullanın;
    buna `package-lock.json` doğrulaması, hoist edilmiş bağımlılık taraması ve
    npm yükleme kayıtları dahildir. Düz arşiv yolları hâlâ Plugin extensions kökü altında yerel arşivler olarak yüklenir.

    Claude marketplace yüklemeleri de desteklenir.

  </Accordion>
</AccordionGroup>

ClawHub yüklemeleri açık bir `clawhub:<package>` locator'ı kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Yalın npm güvenli Plugin spec'leri, geçişin başlatılması sırasında varsayılan olarak npm'den yüklenir:

```bash
openclaw plugins install openclaw-codex-app-server
```

Yalnızca npm çözümlemesini açık hale getirmek için `npm:` kullanın:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw, kurulumdan önce yayımlanan Plugin API / minimum Gateway uyumluluğunu denetler. Seçilen ClawHub sürümü bir ClawPack artefaktı yayımladığında OpenClaw, sürümlendirilmiş npm paket `.tgz` dosyasını indirir, ClawHub özet üst bilgisini ve artefakt özetini doğrular, ardından bunu normal arşiv yolu üzerinden kurar. ClawPack meta verisi olmayan daha eski ClawHub sürümleri, eski paket arşivi doğrulama yolu üzerinden kurulmaya devam eder. Kaydedilen kurulumlar, sonraki güncellemeler için ClawHub kaynak meta verilerini, artefakt türünü, npm bütünlüğünü, npm shasum değerini, tarball adını ve ClawPack özet bilgilerini saklar.
Sürümlendirilmemiş ClawHub kurulumları, `openclaw plugins update` komutunun daha yeni ClawHub sürümlerini izleyebilmesi için sürümlendirilmemiş kayıtlı bir spec tutar; `clawhub:pkg@1.2.3` ve `clawhub:pkg@beta` gibi açık sürüm veya etiket seçicileri o seçiciye sabitlenmiş kalır.

#### Pazar yeri kısaltması

Pazar yeri adı Claude'un yerel kayıt önbelleğinde `~/.claude/plugins/known_marketplaces.json` konumunda varsa `plugin@marketplace` kısaltmasını kullanın:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Pazar yeri kaynağını açıkça geçirmek istediğinizde `--marketplace` kullanın:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - `~/.claude/plugins/known_marketplaces.json` içinden bir Claude bilinen pazar yeri adı
    - yerel bir pazar yeri kökü veya `marketplace.json` yolu
    - `owner/repo` gibi bir GitHub repo kısaltması
    - `https://github.com/owner/repo` gibi bir GitHub repo URL'si
    - bir git URL'si

  </Tab>
  <Tab title="Remote marketplace rules">
    GitHub veya git üzerinden yüklenen uzak pazar yerleri için Plugin girdileri klonlanan pazar yeri reposunun içinde kalmalıdır. OpenClaw, bu repodan gelen göreli yol kaynaklarını kabul eder ve uzak manifestlerden HTTP(S), mutlak yol, git, GitHub ve yol olmayan diğer Plugin kaynaklarını reddeder.
  </Tab>
</Tabs>

Yerel yollar ve arşivler için OpenClaw otomatik olarak şunları algılar:

- yerel OpenClaw Plugin'leri (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya varsayılan Claude bileşen düzeni)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

<Note>
Uyumlu paketler normal Plugin köküne kurulur ve aynı liste/bilgi/etkinleştirme/devre dışı bırakma akışına katılır. Bugün paket Skills, Claude komut-skills'leri, Claude `settings.json` varsayılanları, Claude `.lsp.json` / manifestte bildirilen `lspServers` varsayılanları, Cursor komut-skills'leri ve uyumlu Codex hook dizinleri desteklenir; algılanan diğer paket yetenekleri tanılama/bilgi çıktılarında gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmamıştır.
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
  Yalnızca etkin Plugin'leri göster.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Tablo görünümünden, kaynak/köken/sürüm/aktivasyon meta verileriyle Plugin başına ayrıntı satırlarına geç.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir envanter, ayrıca kayıt tanılamaları ve paket bağımlılığı kurulum durumu.
</ParamField>

<Note>
`plugins list`, önce kalıcı yerel Plugin kaydını okur; kayıt eksik veya geçersizse yalnızca manifestten türetilmiş bir geri dönüş kullanır. Bir Plugin'in kurulu, etkin ve soğuk başlangıç planlamasında görünür olup olmadığını denetlemek için kullanışlıdır, ancak zaten çalışan bir Gateway sürecinin canlı çalışma zamanı yoklaması değildir. Plugin kodunu, etkinleştirmeyi, hook politikasını veya `plugins.load.paths` değerini değiştirdikten sonra yeni `register(api)` kodunun veya hook'ların çalışmasını beklemeden önce kanala hizmet veren Gateway'i yeniden başlatın. Uzak/kapsayıcı dağıtımlarda, yalnızca bir sarmalayıcı süreci değil, gerçek `openclaw gateway run` alt sürecini yeniden başlattığınızı doğrulayın.

`plugins list --json`, her Plugin'in `package.json` içindeki `dependencies` ve `optionalDependencies` değerlerinden gelen `dependencyStatus` bilgisini içerir. OpenClaw, bu paket adlarının Plugin'in normal Node `node_modules` arama yolu boyunca mevcut olup olmadığını denetler; Plugin çalışma zamanı kodunu içe aktarmaz, paket yöneticisi çalıştırmaz veya eksik bağımlılıkları onarmaz.
</Note>

`plugins search`, uzak bir ClawHub katalog aramasıdır. Yerel durumu incelemez, yapılandırmayı değiştirmez, paket kurmaz veya Plugin çalışma zamanı kodunu yüklemez. Arama sonuçları ClawHub paket adını, ailesini, kanalını, sürümünü, özetini ve `openclaw plugins install clawhub:<package>` gibi bir kurulum ipucunu içerir.

Paketlenmiş Docker imajı içindeki yerleşik Plugin çalışmaları için Plugin kaynak dizinini `/app/extensions/synology-chat` gibi eşleşen paketlenmiş kaynak yolunun üzerine bind-mount edin. OpenClaw bu bağlanmış kaynak katmanını `/app/dist/extensions/synology-chat` öncesinde keşfeder; düz kopyalanmış bir kaynak dizini etkisiz kalır, böylece normal paketlenmiş kurulumlar derlenmiş dist kullanmaya devam eder.

Çalışma zamanı hook hata ayıklaması için:

- `openclaw plugins inspect <id> --runtime --json`, modül yüklenmiş bir inceleme geçişinden kayıtlı hook'ları ve tanılamaları gösterir. Çalışma zamanı incelemesi bağımlılıkları asla kurmaz; eski bağımlılık durumunu temizlemek veya yapılandırmada başvurulan eksik indirilebilir Plugin'leri kurtarmak için `openclaw doctor --fix` kullanın.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway'i, hizmet/süreç ipuçlarını, yapılandırma yolunu ve RPC sağlığını doğrular.
- Yerleşik olmayan konuşma hook'ları (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.

Yerel bir dizini kopyalamaktan kaçınmak için `--link` kullanın (`plugins.load.paths` içine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
Bağlantılı kurulumlar yönetilen bir kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullandığı için `--force`, `--link` ile desteklenmez.

Varsayılan davranışı sabitlenmemiş tutarken çözümlenen kesin spec'i (`name@version`) yönetilen Plugin dizinine kaydetmek için npm kurulumlarında `--pin` kullanın.
</Note>

### Plugin dizini

Plugin kurulum meta verisi kullanıcı yapılandırması değil, makine tarafından yönetilen durumdur. Kurulumlar ve güncellemeler bunu etkin OpenClaw durum dizini altında `plugins/installs.json` dosyasına yazar. Üst düzey `installRecords` haritası, bozuk veya eksik Plugin manifestlerine ait kayıtlar dahil olmak üzere kurulum meta verisinin kalıcı kaynağıdır. `plugins` dizisi, manifestten türetilmiş soğuk kayıt önbelleğidir. Dosya, düzenlemeyin uyarısı içerir ve `openclaw plugins update`, kaldırma, tanılamalar ve soğuk Plugin kaydı tarafından kullanılır.

OpenClaw, yapılandırmada gönderilmiş eski `plugins.installs` kayıtlarını gördüğünde, çalışma zamanı okumaları bunları `openclaw.json` dosyasını yeniden yazmadan uyumluluk girdisi olarak ele alır. Açık Plugin yazımları ve `openclaw doctor --fix`, yapılandırma yazımlarına izin verildiğinde bu kayıtları Plugin dizinine taşır ve yapılandırma anahtarını kaldırır; yazımlardan biri başarısız olursa kurulum meta verisinin kaybolmaması için yapılandırma kayıtları tutulur.

### Kaldırma

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, Plugin kayıtlarını `plugins.entries` içinden, kalıcı Plugin dizininden, Plugin izin/verme listesi girdilerinden ve uygulanabildiğinde bağlı `plugins.load.paths` girdilerinden kaldırır. `--keep-files` ayarlanmadığı sürece kaldırma işlemi, OpenClaw'ın Plugin uzantıları kökü içindeyse izlenen yönetilen kurulum dizinini de kaldırır. Active Memory Plugin'leri için bellek slotu `memory-core` değerine sıfırlanır.

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

Güncellemeler, yönetilen Plugin dizinindeki izlenen Plugin kurulumlarına ve `hooks.internal.installs` içindeki izlenen hook-pack kurulumlarına uygulanır.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Bir Plugin id'si geçirdiğinizde OpenClaw, o Plugin için kayıtlı kurulum spec'ini yeniden kullanır. Bu, `@beta` gibi daha önce saklanan dist-tag'lerin ve kesin sabitlenmiş sürümlerin sonraki `update <id>` çalıştırmalarında kullanılmaya devam edeceği anlamına gelir.

    npm kurulumları için dist-tag veya kesin sürüm içeren açık bir npm paket spec'i de geçirebilirsiniz. OpenClaw bu paket adını izlenen Plugin kaydına geri çözümler, kurulu Plugin'i günceller ve gelecekte id tabanlı güncellemeler için yeni npm spec'ini kaydeder.

    npm paket adını sürüm veya etiket olmadan geçirmek de izlenen Plugin kaydına geri çözümlenir. Bir Plugin kesin bir sürüme sabitlendiğinde ve onu kaydın varsayılan yayın çizgisine geri taşımak istediğinizde bunu kullanın.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update`, yeni bir spec geçirmediğiniz sürece izlenen Plugin spec'ini yeniden kullanır. `openclaw update` ayrıca etkin OpenClaw güncelleme kanalını bilir: beta kanalında, varsayılan çizgi npm ve ClawHub Plugin kayıtları önce `@beta` dener, ardından Plugin beta yayını yoksa kayıtlı varsayılan/latest spec'e geri döner. Kesin sürümler ve açık etiketler o seçiciye sabitlenmiş kalır.

    OpenClaw henüz LTS veya aylık destek Plugin kanallarını sunmaz. Planlanan destek çizgisi çalışması, Plugin paket ve ClawHub etiketlerinin çekirdek paketle aynı destek çizgisini izlemesini gerektirecektir.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Canlı npm güncellemesinden önce OpenClaw, kurulu paket sürümünü npm kayıt meta verilerine göre denetler. Kurulu sürüm ve kayıtlı artefakt kimliği zaten çözümlenen hedefle eşleşiyorsa güncelleme indirme, yeniden kurma veya `openclaw.json` yeniden yazma olmadan atlanır.

    Saklanan bir bütünlük hash'i mevcutsa ve getirilen artefakt hash'i değişirse OpenClaw bunu npm artefakt sapması olarak ele alır. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek hash'leri yazdırır ve devam etmeden önce onay ister. Etkileşimsiz güncelleme yardımcıları, çağıran açık bir devam politikası sağlamadığı sürece kapalı şekilde başarısız olur.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install`, Plugin güncellemeleri sırasında yerleşik tehlikeli kod taraması yanlış pozitifleri için son çare geçersiz kılması olarak `plugins update` üzerinde de kullanılabilir. Yine de Plugin `before_install` politika engellerini veya tarama hatası engellemesini aşmaz ve yalnızca Plugin güncellemelerine uygulanır, hook-pack güncellemelerine uygulanmaz.
  </Accordion>
</AccordionGroup>

### İnceleme

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect, varsayılan olarak Plugin çalışma zamanını içe aktarmadan kimliği, yükleme durumunu, kaynağı, manifest yeteneklerini, politika bayraklarını, tanılamaları, kurulum meta verilerini, paket yeteneklerini ve algılanan MCP veya LSP sunucu desteğini gösterir. Plugin modülünü yüklemek ve kayıtlı hook'ları, araçları, komutları, hizmetleri, gateway yöntemlerini ve HTTP rotalarını dahil etmek için `--runtime` ekleyin. Çalışma zamanı incelemesi eksik Plugin bağımlılıklarını doğrudan bildirir; kurulumlar ve onarımlar `openclaw plugins install`, `openclaw plugins update` ve `openclaw doctor --fix` içinde kalır.

Plugin'e ait CLI komutları kök `openclaw` komut grupları olarak kurulur. `inspect --runtime`, `cliCommands` altında bir komut gösterdikten sonra bunu `openclaw <command> ...` olarak çalıştırın; örneğin `demo-git` kaydeden bir Plugin, `openclaw demo-git ping` ile doğrulanabilir.

Her Plugin, çalışma zamanında gerçekten kaydettiği şeye göre sınıflandırılır:

- **plain-capability** — bir yetenek türü (örn. yalnızca sağlayıcı Plugin'i)
- **hybrid-capability** — birden çok yetenek türü (örn. metin + konuşma + görseller)
- **hook-only** — yalnızca kancalar, yetenek veya yüzey yok
- **non-capability** — araçlar/komutlar/hizmetler, ancak yetenek yok

Yetenek modeli hakkında daha fazla bilgi için bkz. [Plugin şekilleri](/tr/plugins/architecture#plugin-shapes).

<Note>
`--json` bayrağı, betik yazma ve denetim için uygun, makine tarafından okunabilir bir rapor çıktılar. `inspect --all`; şekil, yetenek türleri, uyumluluk bildirimleri, paket yetenekleri ve kanca özeti sütunları içeren filo genelinde bir tablo oluşturur. `info`, `inspect` için bir takma addır.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, Plugin yükleme hatalarını, bildirim/keşif tanılarını ve uyumluluk bildirimlerini raporlar. Her şey temiz olduğunda `No plugin issues detected.` yazdırır.

Yapılandırılmış bir Plugin diskte mevcutsa ancak yükleyicinin yol güvenliği denetimleri tarafından engelleniyorsa, yapılandırma doğrulaması Plugin girdisini korur ve bunu `present but blocked` olarak raporlar. `plugins.entries.<id>` veya `plugins.allow` yapılandırmasını kaldırmak yerine, yol sahipliği ya da herkes tarafından yazılabilir izinler gibi önceki engellenmiş-Plugin tanısını düzeltin.

Eksik `register`/`activate` dışa aktarımları gibi modül şekli hataları için, tanı çıktısına kompakt bir dışa aktarım şekli özeti eklemek üzere `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Kayıt Defteri

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Yerel Plugin kayıt defteri, OpenClaw'ın yüklü Plugin kimliği, etkinleştirme durumu, kaynak meta verileri ve katkı sahipliği için kalıcı soğuk okuma modelidir. Normal başlatma, sağlayıcı sahibi araması, kanal kurulum sınıflandırması ve Plugin envanteri, Plugin çalışma zamanı modüllerini içe aktarmadan bunu okuyabilir.

Kalıcı kayıt defterinin mevcut, güncel veya bayat olup olmadığını incelemek için `plugins registry` kullanın. Kalıcı Plugin dizininden, yapılandırma ilkesinden ve bildirim/paket meta verilerinden yeniden oluşturmak için `--refresh` kullanın. Bu bir onarım yoludur, çalışma zamanı etkinleştirme yolu değildir.

`openclaw doctor --fix` ayrıca kayıt defteriyle ilişkili yönetilen npm sapmasını onarır: yönetilen Plugin npm kökü altındaki sahipsiz veya kurtarılmış bir `@openclaw/*` paketi paketli bir Plugin'i gölgelerse, doctor bu bayat paketi kaldırır ve kayıt defterini yeniden oluşturur; böylece başlatma, paketli bildirime göre doğrulama yapar.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`, kayıt defteri okuma hataları için kullanımdan kaldırılmış bir acil uyumluluk anahtarıdır. `plugins registry --refresh` veya `openclaw doctor --fix` tercih edin; env geri dönüşü yalnızca geçiş kullanıma alınırken acil başlatma kurtarma içindir.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace listesi; yerel bir marketplace yolunu, bir `marketplace.json` yolunu, `owner/repo` gibi bir GitHub kısaltmasını, bir GitHub depo URL'sini veya bir git URL'sini kabul eder. `--json`, çözümlenen kaynak etiketinin yanı sıra ayrıştırılmış marketplace bildirimini ve Plugin girdilerini yazdırır.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [CLI başvurusu](/tr/cli)
- [Topluluk Plugin'leri](/tr/plugins/community)
