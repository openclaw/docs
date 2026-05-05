---
read_when:
    - Gateway Plugin'lerini veya uyumlu paketleri yüklemek ya da yönetmek istiyorsunuz
    - Plugin yükleme hatalarında hata ayıklamak istiyorsunuz
sidebarTitle: Plugins
summary: '`openclaw plugins` için CLI referansı (list, install, marketplace, uninstall, enable/disable, doctor)'
title: Pluginler
x-i18n:
    generated_at: "2026-05-05T01:44:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24d274f33213231eaed48ac848a9266802a2179ba0311ab18462ad783219095a
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin'lerini, hook paketlerini ve uyumlu bundle'ları yönetin.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/tr/tools/plugin">
    Plugin'leri yükleme, etkinleştirme ve sorun giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Manage plugins" href="/tr/plugins/manage-plugins">
    Yükleme, listeleme, güncelleme, kaldırma ve yayımlama için hızlı örnekler.
  </Card>
  <Card title="Plugin bundles" href="/tr/plugins/bundles">
    Bundle uyumluluk modeli.
  </Card>
  <Card title="Plugin manifest" href="/tr/plugins/manifest">
    Manifest alanları ve config şeması.
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

Yavaş yükleme, inceleme, kaldırma veya registry yenileme incelemesi için komutu
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ile çalıştırın. Trace, aşama zamanlamalarını
stderr'ye yazar ve JSON çıktısını ayrıştırılabilir tutar. Bkz. [Hata ayıklama](/tr/help/debugging#plugin-lifecycle-trace).

<Note>
Birlikte gelen plugin'ler OpenClaw ile gönderilir. Bazıları varsayılan olarak etkindir (örneğin birlikte gelen model provider'ları, birlikte gelen konuşma provider'ları ve birlikte gelen tarayıcı plugin'i); diğerleri `plugins enable` gerektirir.

Yerel OpenClaw plugin'leri, satır içi JSON Schema (`configSchema`, boş olsa bile) içeren `openclaw.plugin.json` göndermelidir. Uyumlu bundle'lar bunun yerine kendi bundle manifest'lerini kullanır.

`plugins list`, `Format: openclaw` veya `Format: bundle` gösterir. Ayrıntılı liste/bilgi çıktısı ayrıca bundle alt türünü (`codex`, `claude` veya `cursor`) ve algılanan bundle yeteneklerini gösterir.
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
Çıplak paket adları, lansman geçişi sırasında varsayılan olarak npm'den yüklenir. ClawHub için `clawhub:<package>` kullanın. Plugin kurulumlarını kod çalıştırmak gibi değerlendirin. Sabitlenmiş sürümleri tercih edin.
</Warning>

`plugins search`, yüklenebilir plugin paketleri için ClawHub'ı sorgular ve
yüklemeye hazır paket adlarını yazdırır. Skills'leri değil, code-plugin ve bundle-plugin paketlerini arar. ClawHub Skills'leri için `openclaw skills search` kullanın.

<Note>
ClawHub, çoğu plugin için birincil dağıtım ve keşif yüzeyidir. Npm
desteklenen bir fallback ve doğrudan yükleme yolu olmaya devam eder. OpenClaw'a ait
`@openclaw/*` plugin paketleri npm'de yeniden yayımlanır; güncel listeye
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) veya
[plugin envanteri](/tr/plugins/plugin-inventory) üzerinden bakın. Kararlı kurulumlar `latest` kullanır.
Beta kanalı kurulumları ve güncellemeleri, bu tag kullanılabilir olduğunda npm `beta` dist-tag'ini tercih eder, ardından `latest`'e geri döner.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    `plugins` bölümünüz tek dosyalı bir `$include` ile destekleniyorsa `plugins install/update/enable/disable/uninstall`, bu dahil edilen dosyaya yazar ve `openclaw.json` dosyasını değiştirmez. Kök include'lar, include dizileri ve kardeş override'ları olan include'lar düzleştirilmek yerine kapalı şekilde başarısız olur. Desteklenen biçimler için [Config include'ları](/tr/gateway/configuration) bölümüne bakın.

    Kurulum sırasında config geçersizse `plugins install` normalde kapalı şekilde başarısız olur ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Gateway başlatma ve hot reload sırasında geçersiz plugin config'i, diğer geçersiz config'ler gibi kapalı şekilde başarısız olur; `openclaw doctor --fix` geçersiz plugin girdisini karantinaya alabilir. Belgelenmiş tek kurulum zamanı istisnası, açıkça `openclaw.install.allowInvalidConfigRecovery` seçeneğine katılan plugin'ler için dar kapsamlı bir birlikte gelen plugin kurtarma yoludur.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force`, mevcut yükleme hedefini yeniden kullanır ve zaten yüklenmiş bir plugin'i veya hook paketini yerinde üzerine yazar. Aynı id'yi yeni bir yerel path, arşiv, ClawHub paketi veya npm artifact'inden bilerek yeniden yüklediğinizde kullanın. Zaten izlenen bir npm plugin'inin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` tercih edin.

    Zaten yüklü olan bir plugin id'si için `plugins install` çalıştırırsanız OpenClaw durur ve normal bir yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna ya da mevcut kurulumu gerçekten farklı bir kaynaktan üzerine yazmak istediğinizde `plugins install <package> --force` komutuna yönlendirir.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` yalnızca npm kurulumlarına uygulanır. `git:` kurulumlarıyla desteklenmez; sabitlenmiş bir kaynak istediğinizde `git:github.com/acme/plugin@v1.2.3` gibi açık bir git ref'i kullanın. Marketplace kurulumları npm spec'i yerine marketplace kaynak metadata'sını kalıcılaştırdığı için `--marketplace` ile desteklenmez.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısındaki yanlış pozitifler için son çare seçeneğidir. Yerleşik tarayıcı `critical` bulguları rapor etse bile kurulumun devam etmesine izin verir, ancak plugin `before_install` hook policy bloklarını **atlatmaz** ve tarama hatalarını **atlatmaz**.

    Bu CLI flag'i plugin yükleme/güncelleme akışlarına uygulanır. Gateway destekli skill dependency kurulumları eşleşen `dangerouslyForceUnsafeInstall` request override'ını kullanırken `openclaw skills install` ayrı bir ClawHub skill indirme/yükleme akışı olarak kalır.

    ClawHub'da yayımladığınız bir plugin registry taraması tarafından engellenirse [ClawHub](/tr/tools/clawhub) bölümündeki publisher adımlarını kullanın.

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install`, `package.json` içinde `openclaw.hooks` sunan hook paketleri için de yükleme yüzeyidir. Paket kurulumu için değil, filtrelenmiş hook görünürlüğü ve hook başına etkinleştirme için `openclaw hooks` kullanın.

    Npm spec'leri **yalnızca registry** içindir (paket adı + isteğe bağlı **tam sürüm** veya **dist-tag**). Git/URL/file spec'leri ve semver aralıkları reddedilir. Dependency kurulumları, shell'inizde global npm kurulum ayarları olsa bile güvenlik için `--ignore-scripts` ile proje yerelinde çalışır.

    Npm çözümlemesini açık hale getirmek istediğinizde `npm:<package>` kullanın. Çıplak paket spec'leri de lansman geçişi sırasında doğrudan npm'den yüklenir.

    Çıplak spec'ler ve `@latest` kararlı kanalda kalır. `2026.5.3-1` gibi OpenClaw tarih damgalı düzeltme sürümleri bu kontrol için kararlı sürümlerdir. Npm bunlardan herhangi birini prerelease'e çözümlerse OpenClaw durur ve `@beta`/`@rc` gibi bir prerelease tag'iyle veya `@1.2.3-beta.4` gibi tam bir prerelease sürümüyle açıkça opt in yapmanızı ister.

    Çıplak bir kurulum spec'i resmi bir plugin id'siyle eşleşirse (örneğin `diffs`), OpenClaw katalog girdisini doğrudan yükler. Aynı ada sahip bir npm paketini yüklemek için açık bir scoped spec kullanın (örneğin `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Doğrudan bir git repository'sinden yüklemek için `git:<repo>` kullanın. Desteklenen biçimler arasında `git:github.com/owner/repo`, `git:owner/repo`, tam `https://`, `ssh://`, `git://`, `file://` ve `git@host:owner/repo.git` clone URL'leri bulunur. Kurulumdan önce bir branch, tag veya commit'i check out etmek için `@<ref>` veya `#<ref>` ekleyin.

    Git kurulumları geçici bir dizine clone eder, varsa istenen ref'i check out eder, ardından normal plugin dizini yükleyicisini kullanır. Bu, manifest doğrulaması, tehlikeli kod taraması, package-manager kurulum işi ve kurulum kayıtlarının npm kurulumları gibi davrandığı anlamına gelir. Kaydedilen git kurulumları, kaynak URL/ref'i ve çözümlenen commit'i içerir; böylece `openclaw plugins update` kaynağı daha sonra yeniden çözümleyebilir.

    Git'ten yükledikten sonra gateway method'ları ve CLI komutları gibi runtime kayıtlarını doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. Plugin `api.registerCli` ile bir CLI root'u kaydettiyse bu komutu doğrudan OpenClaw root CLI üzerinden yürütün, örneğin `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Yerel OpenClaw plugin arşivleri, çıkarılan plugin root'unda geçerli bir `openclaw.plugin.json` içermelidir; yalnızca `package.json` içeren arşivler, OpenClaw kurulum kayıtları yazmadan önce reddedilir.

    Claude marketplace kurulumları da desteklenir.

  </Accordion>
</AccordionGroup>

ClawHub kurulumları açık bir `clawhub:<package>` locator'ı kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Çıplak npm açısından güvenli plugin spec'leri, lansman geçişi sırasında varsayılan olarak npm'den yüklenir:

```bash
openclaw plugins install openclaw-codex-app-server
```

Npm'e özel çözümlemeyi açık hale getirmek için `npm:` kullanın:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw, kurulumdan önce duyurulan plugin API / minimum gateway uyumluluğunu kontrol eder. Seçilen ClawHub sürümü bir ClawPack artifact'i yayımladığında OpenClaw sürümlü npm-pack `.tgz` dosyasını indirir, ClawHub digest header'ını ve artifact digest'ini doğrular, ardından normal arşiv yolu üzerinden kurar. ClawPack metadata'sı olmayan eski ClawHub sürümleri hâlâ legacy paket arşivi doğrulama yolu üzerinden yüklenir. Kaydedilen kurulumlar daha sonraki güncellemeler için ClawHub kaynak metadata'sını, artifact türünü, npm integrity'sini, npm shasum'unu, tarball adını ve ClawPack digest bilgilerini saklar.
Sürümsüz ClawHub kurulumları, `openclaw plugins update` daha yeni ClawHub sürümlerini takip edebilsin diye sürümsüz bir kaydedilmiş spec tutar; `clawhub:pkg@1.2.3` ve `clawhub:pkg@beta` gibi açık sürüm veya tag seçicileri o seçiciye sabitlenmiş kalır.

#### Marketplace kısayolu

Marketplace adı Claude'un `~/.claude/plugins/known_marketplaces.json` konumundaki yerel registry cache'inde mevcut olduğunda `plugin@marketplace` kısayolunu kullanın:

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
  <Tab title="Pazar yeri kaynakları">
    - `~/.claude/plugins/known_marketplaces.json` içinden Claude tarafından bilinen bir pazar yeri adı
    - yerel bir pazar yeri kökü veya `marketplace.json` yolu
    - `owner/repo` gibi bir GitHub depo kısaltması
    - `https://github.com/owner/repo` gibi bir GitHub depo URL'si
    - bir git URL'si

  </Tab>
  <Tab title="Uzak pazar yeri kuralları">
    GitHub veya git üzerinden yüklenen uzak pazar yerlerinde, plugin girdileri klonlanan pazar yeri deposunun içinde kalmalıdır. OpenClaw, bu depodan gelen göreli yol kaynaklarını kabul eder ve uzak manifestlerden gelen HTTP(S), mutlak yol, git, GitHub ve diğer yol olmayan plugin kaynaklarını reddeder.
  </Tab>
</Tabs>

Yerel yollar ve arşivler için OpenClaw şunları otomatik algılar:

- yerel OpenClaw plugins (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya varsayılan Claude bileşen düzeni)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

<Note>
Uyumlu paketler normal plugin köküne kurulur ve aynı liste/bilgi/etkinleştirme/devre dışı bırakma akışına katılır. Bugün paket skills, Claude komut-skills, Claude `settings.json` varsayılanları, Claude `.lsp.json` / manifestte bildirilen `lspServers` varsayılanları, Cursor komut-skills ve uyumlu Codex hook dizinleri desteklenir; algılanan diğer paket yetenekleri tanılarda/bilgide gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmamıştır.
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
  Yalnızca etkin plugins göster.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Tablo görünümünden kaynak/köken/sürüm/etkinleştirme meta verileriyle plugin başına ayrıntı satırlarına geç.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir envanter, kayıt defteri tanıları ve paket bağımlılığı kurulum durumu.
</ParamField>

<Note>
`plugins list` önce kalıcı yerel plugin kayıt defterini okur; kayıt defteri eksik veya geçersizse yalnızca manifestten türetilmiş bir geri dönüş kullanır. Bir plugin'in kurulu, etkin ve soğuk başlangıç planlaması tarafından görünür olup olmadığını denetlemek için kullanışlıdır; ancak zaten çalışan bir Gateway sürecinin canlı çalışma zamanı yoklaması değildir. Plugin kodunu, etkinleştirmeyi, hook ilkesini veya `plugins.load.paths` değerini değiştirdikten sonra, yeni `register(api)` kodunun veya hook'ların çalışmasını beklemeden önce kanala hizmet veren Gateway'i yeniden başlatın. Uzak/konteyner dağıtımları için yalnızca bir sarmalayıcı süreci değil, gerçek `openclaw gateway run` alt sürecini yeniden başlattığınızı doğrulayın.

`plugins list --json`, her plugin'in `package.json` içindeki `dependencies` ve `optionalDependencies` değerlerinden gelen `dependencyStatus` bilgisini içerir. OpenClaw, bu paket adlarının plugin'in normal Node `node_modules` arama yolu boyunca mevcut olup olmadığını denetler; plugin çalışma zamanı kodunu içe aktarmaz, paket yöneticisi çalıştırmaz veya eksik bağımlılıkları onarmaz.
</Note>

`plugins search` uzak bir ClawHub katalog aramasıdır. Yerel durumu incelemez, yapılandırmayı değiştirmez, paket kurmaz veya plugin çalışma zamanı kodunu yüklemez. Arama sonuçları ClawHub paket adını, ailesini, kanalını, sürümünü, özetini ve `openclaw plugins install clawhub:<package>` gibi bir kurulum ipucunu içerir.

Paketlenmiş bir Docker imajı içindeki gömülü plugin çalışmaları için, plugin kaynak dizinini `/app/extensions/synology-chat` gibi eşleşen paketlenmiş kaynak yolunun üzerine bind-mount edin. OpenClaw, bu bağlanan kaynak kaplamasını `/app/dist/extensions/synology-chat` öncesinde keşfeder; düz kopyalanmış bir kaynak dizini etkisiz kalır, böylece normal paketlenmiş kurulumlar derlenmiş dist kullanmaya devam eder.

Çalışma zamanı hook hata ayıklaması için:

- `openclaw plugins inspect <id> --runtime --json`, modül yüklemeli bir inceleme geçişinden kayıtlı hook'ları ve tanıları gösterir. Çalışma zamanı incelemesi bağımlılıkları asla kurmaz; eski bağımlılık durumunu temizlemek veya yapılandırmada başvurulan eksik indirilebilir plugins kurtarmak için `openclaw doctor --fix` kullanın.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway'i, hizmet/süreç ipuçlarını, yapılandırma yolunu ve RPC sağlığını doğrular.
- Gömülü olmayan konuşma hook'ları (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.

Yerel bir dizini kopyalamaktan kaçınmak için `--link` kullanın (`plugins.load.paths` içine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force`, `--link` ile desteklenmez çünkü bağlı kurulumlar yönetilen bir kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullanır.

Varsayılan davranışı sabitlenmemiş tutarken çözümlenen kesin spec'i (`name@version`) yönetilen plugin dizinine kaydetmek için npm kurulumlarında `--pin` kullanın.
</Note>

### Plugin dizini

Plugin kurulum meta verileri kullanıcı yapılandırması değil, makine tarafından yönetilen durumdur. Kurulumlar ve güncellemeler bunu etkin OpenClaw durum dizini altında `plugins/installs.json` dosyasına yazar. Üst düzey `installRecords` haritası, bozuk veya eksik plugin manifestleri için kayıtlar da dahil olmak üzere kurulum meta verilerinin kalıcı kaynağıdır. `plugins` dizisi manifestten türetilmiş soğuk kayıt defteri önbelleğidir. Dosya, düzenlemeyin uyarısı içerir ve `openclaw plugins update`, kaldırma, tanılar ve soğuk plugin kayıt defteri tarafından kullanılır.

OpenClaw yapılandırmada gönderilmiş eski `plugins.installs` kayıtlarını gördüğünde, bunları plugin dizinine taşır ve yapılandırma anahtarını kaldırır; yazma işlemlerinden biri başarısız olursa, kurulum meta verilerinin kaybolmaması için yapılandırma kayıtları korunur.

### Kaldırma

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, plugin kayıtlarını `plugins.entries` içinden, kalıcı plugin dizininden, plugin izin/verme listesi girdilerinden ve uygulanabildiğinde bağlı `plugins.load.paths` girdilerinden kaldırır. `--keep-files` ayarlanmadıkça, kaldırma işlemi izlenen yönetilen kurulum dizini OpenClaw'ın plugin extensions kökünün içindeyse onu da kaldırır. Aktif bellek plugins için bellek yuvası `memory-core` değerine sıfırlanır.

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

Güncellemeler, yönetilen plugin dizinindeki izlenen plugin kurulumlarına ve `hooks.internal.installs` içindeki izlenen hook-pack kurulumlarına uygulanır.

<AccordionGroup>
  <Accordion title="Plugin id ile npm spec çözümleme">
    Bir plugin id geçirdiğinizde OpenClaw, o plugin için kaydedilmiş kurulum spec'ini yeniden kullanır. Bu, `@beta` gibi daha önce saklanan dist-tags değerlerinin ve kesin sabitlenmiş sürümlerin daha sonraki `update <id>` çalıştırmalarında kullanılmaya devam edeceği anlamına gelir.

    npm kurulumları için dist-tag veya kesin sürüm içeren açık bir npm paket spec'i de geçirebilirsiniz. OpenClaw bu paket adını izlenen plugin kaydına geri çözümler, o kurulu plugin'i günceller ve gelecekteki id tabanlı güncellemeler için yeni npm spec'ini kaydeder.

    npm paket adını sürüm veya etiket olmadan geçirmek de izlenen plugin kaydına geri çözümlenir. Bir plugin kesin bir sürüme sabitlenmişse ve onu kayıt defterinin varsayılan yayın hattına geri taşımak istiyorsanız bunu kullanın.

  </Accordion>
  <Accordion title="Beta kanal güncellemeleri">
    `openclaw plugins update`, yeni bir spec geçirmediğiniz sürece izlenen plugin spec'ini yeniden kullanır. `openclaw update` ayrıca etkin OpenClaw güncelleme kanalını bilir: beta kanalında, varsayılan hat npm ve ClawHub plugin kayıtları önce `@beta` dener, plugin beta yayını yoksa kaydedilmiş varsayılan/latest spec'e geri döner. Kesin sürümler ve açık etiketler bu seçiciye sabitlenmiş kalır.

  </Accordion>
  <Accordion title="Sürüm denetimleri ve bütünlük sapması">
    Canlı bir npm güncellemesinden önce OpenClaw, kurulu paket sürümünü npm kayıt defteri meta verileriyle karşılaştırır. Kurulu sürüm ve kaydedilmiş yapıt kimliği çözümlenen hedefle zaten eşleşiyorsa, güncelleme indirme, yeniden kurma veya `openclaw.json` yeniden yazma yapılmadan atlanır.

    Saklanan bir bütünlük karması mevcut olduğunda ve getirilen yapıt karması değiştiğinde, OpenClaw bunu npm yapıt sapması olarak ele alır. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek karmaları yazdırır ve devam etmeden önce onay ister. Etkileşimsiz güncelleme yardımcıları, çağıran açık bir devam ilkesi sağlamadıkça kapalı başarısız olur.

  </Accordion>
  <Accordion title="Güncellemede --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, plugin güncellemeleri sırasında yerleşik tehlikeli kod taraması yanlış pozitifleri için son çare geçersiz kılma olarak `plugins update` üzerinde de kullanılabilir. Yine de plugin `before_install` ilke engellerini veya tarama hatası engellemesini baypas etmez ve yalnızca plugin güncellemelerine uygulanır, hook-pack güncellemelerine değil.
  </Accordion>
</AccordionGroup>

### İnceleme

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect, varsayılan olarak plugin çalışma zamanını içe aktarmadan kimliği, yükleme durumunu, kaynağı, manifest yeteneklerini, ilke bayraklarını, tanıları, kurulum meta verilerini, paket yeteneklerini ve algılanan MCP veya LSP sunucu desteğini gösterir. Plugin modülünü yüklemek ve kayıtlı hook'ları, araçları, komutları, hizmetleri, gateway yöntemlerini ve HTTP rotalarını dahil etmek için `--runtime` ekleyin. Çalışma zamanı incelemesi eksik plugin bağımlılıklarını doğrudan bildirir; kurulumlar ve onarımlar `openclaw plugins install`, `openclaw plugins update` ve `openclaw doctor --fix` içinde kalır.

Plugin'e ait CLI komutları kök `openclaw` komut grupları olarak kurulur. `inspect --runtime`, `cliCommands` altında bir komut gösterdikten sonra onu `openclaw <command> ...` olarak çalıştırın; örneğin `demo-git` kaydeden bir plugin `openclaw demo-git ping` ile doğrulanabilir.

Her plugin, çalışma zamanında gerçekten kaydettiklerine göre sınıflandırılır:

- **plain-capability** — bir yetenek türü (ör. yalnızca provider plugin'i)
- **hybrid-capability** — birden çok yetenek türü (ör. metin + konuşma + görüntüler)
- **hook-only** — yalnızca hook'lar, yetenek veya yüzey yok
- **non-capability** — araçlar/komutlar/hizmetler var ancak yetenek yok

Yetenek modeli hakkında daha fazla bilgi için [Plugin şekilleri](/tr/plugins/architecture#plugin-shapes) bölümüne bakın.

<Note>
`--json` bayrağı, betikleme ve denetim için uygun makine tarafından okunabilir bir rapor çıktılar. `inspect --all`, şekil, yetenek türleri, uyumluluk bildirimleri, paket yetenekleri ve hook özeti sütunlarıyla genel bir tablo işler. `info`, `inspect` için bir takma addır.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, plugin yükleme hatalarını, manifest/keşif tanılarını ve uyumluluk bildirimlerini bildirir. Her şey temiz olduğunda `No plugin issues detected.` yazdırır.

Yapılandırılmış bir plugin diskte mevcutsa ancak yükleyicinin yol güvenliği denetimleri tarafından engelleniyorsa, yapılandırma doğrulaması plugin girdisini korur ve onu `present but blocked` olarak bildirir. `plugins.entries.<id>` veya `plugins.allow` yapılandırmasını kaldırmak yerine yol sahipliği veya world-writable izinler gibi önceki engellenmiş plugin tanısını düzeltin.

Eksik `register`/`activate` dışa aktarımları gibi modül şekli hataları için tanı çıktısına kompakt bir dışa aktarma şekli özeti eklemek üzere `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Kayıt defteri

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Yerel plugin kayıt defteri, OpenClaw'ın kurulu plugin kimliği, etkinleştirme, kaynak meta verileri ve katkı sahipliği için kalıcı soğuk okuma modelidir. Normal başlangıç, provider sahibi araması, kanal kurulum sınıflandırması ve plugin envanteri, plugin çalışma zamanı modüllerini içe aktarmadan bunu okuyabilir.

Kalıcı registry'nin mevcut, güncel veya eski olup olmadığını incelemek için `plugins registry` kullanın. Kalıcı Plugin dizininden, yapılandırma ilkesinden ve manifest/paket meta verilerinden yeniden oluşturmak için `--refresh` kullanın. Bu bir onarım yoludur, çalışma zamanı etkinleştirme yolu değildir.

`openclaw doctor --fix`, registry ile ilişkili yönetilen npm sapmasını da onarır: yönetilen Plugin npm kökü altında yetim kalmış veya kurtarılmış bir `@openclaw/*` paketi, paketlenmiş bir Plugin'i gölgeliyorsa doctor bu eski paketi kaldırır ve başlangıcın paketlenmiş manifest'e göre doğrulama yapması için registry'yi yeniden oluşturur.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`, registry okuma hataları için kullanımdan kaldırılmış bir acil durum uyumluluk anahtarıdır. `plugins registry --refresh` veya `openclaw doctor --fix` tercih edin; env geri dönüşü yalnızca geçiş kullanıma alınırken acil başlangıç kurtarma içindir.
</Warning>

### Pazar yeri

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Pazar yeri listesi yerel bir pazar yeri yolunu, bir `marketplace.json` yolunu, `owner/repo` gibi bir GitHub kısaltmasını, bir GitHub depo URL'sini veya bir git URL'sini kabul eder. `--json`, çözümlenen kaynak etiketini, ayrıştırılmış pazar yeri manifest'i ve Plugin girdileriyle birlikte yazdırır.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [CLI başvurusu](/tr/cli)
- [Topluluk Plugin'leri](/tr/plugins/community)
