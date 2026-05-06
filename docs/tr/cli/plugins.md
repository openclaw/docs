---
read_when:
    - Gateway Plugin'lerini veya uyumlu paketleri yüklemek ya da yönetmek istiyorsunuz
    - Plugin yükleme hatalarında hata ayıklamak istiyorsunuz
sidebarTitle: Plugins
summary: '`openclaw plugins` için CLI referansı (list, install, marketplace, uninstall, enable/disable, doctor)'
title: Pluginler
x-i18n:
    generated_at: "2026-05-06T17:54:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 734366b6bbee5f036fdc2cfac5197ae86d2e8fbc7c977ccc4e22add2f4206951
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin’larını, hook paketlerini ve uyumlu paketleri yönetin.

<CardGroup cols={2}>
  <Card title="Plugin sistemi" href="/tr/tools/plugin">
    Plugin’leri kurma, etkinleştirme ve sorun giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Plugin’leri yönet" href="/tr/plugins/manage-plugins">
    Kurma, listeleme, güncelleme, kaldırma ve yayımlama için hızlı örnekler.
  </Card>
  <Card title="Plugin paketleri" href="/tr/plugins/bundles">
    Paket uyumluluğu modeli.
  </Card>
  <Card title="Plugin manifest’i" href="/tr/plugins/manifest">
    Manifest alanları ve yapılandırma şeması.
  </Card>
  <Card title="Güvenlik" href="/tr/gateway/security">
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

Yavaş kurulum, inceleme, kaldırma veya kayıt yenileme araştırması için komutu
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ile çalıştırın. İz, aşama zamanlamalarını
stderr’ye yazar ve JSON çıktısını ayrıştırılabilir tutar. Bkz. [Hata ayıklama](/tr/help/debugging#plugin-lifecycle-trace).

<Note>
Nix modunda (`OPENCLAW_NIX_MODE=1`), Plugin yaşam döngüsü değiştiricileri devre dışıdır. Bu kurulum için `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` veya `plugins disable` yerine Nix kaynağını kullanın; nix-openclaw için agent-first [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) belgesini kullanın.
</Note>

<Note>
Paketlenmiş Plugin’ler OpenClaw ile birlikte gelir. Bazıları varsayılan olarak etkindir (örneğin paketlenmiş model sağlayıcıları, paketlenmiş konuşma sağlayıcıları ve paketlenmiş tarayıcı Plugin’i); diğerleri `plugins enable` gerektirir.

Yerel OpenClaw Plugin’leri, satır içi JSON Schema (`configSchema`, boş olsa bile) içeren `openclaw.plugin.json` dosyasıyla gönderilmelidir. Uyumlu paketler bunun yerine kendi paket manifest’lerini kullanır.

`plugins list`, `Format: openclaw` veya `Format: bundle` gösterir. Ayrıntılı liste/bilgi çıktısı ayrıca paket alt türünü (`codex`, `claude` veya `cursor`) ve algılanan paket yeteneklerini gösterir.
</Note>

### Kurulum

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
Yalın paket adları, başlatma geçişi sırasında varsayılan olarak npm’den kurulur. ClawHub için `clawhub:<package>` kullanın. Plugin kurulumlarını kod çalıştırmak gibi değerlendirin. Sabitlenmiş sürümleri tercih edin.
</Warning>

`plugins search`, kurulabilir Plugin paketleri için ClawHub’ı sorgular ve
kuruluma hazır paket adlarını yazdırır. Skills değil, code-plugin ve bundle-plugin paketlerinde arama yapar. ClawHub Skills için `openclaw skills search` kullanın.

<Note>
ClawHub, çoğu Plugin için birincil dağıtım ve keşif yüzeyidir. Npm,
desteklenen bir yedek ve doğrudan kurulum yolu olmaya devam eder. OpenClaw’a ait
`@openclaw/*` Plugin paketleri yeniden npm’de yayımlanır; güncel listeyi
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) veya
[Plugin envanteri](/tr/plugins/plugin-inventory) üzerinden görün. Kararlı kurulumlar `latest` kullanır.
Beta kanalı kurulumları ve güncellemeleri, bu etiket kullanılabiliyorsa npm `beta` dist-tag’ini
tercih eder, ardından `latest` değerine geri döner.
</Note>

<AccordionGroup>
  <Accordion title="Yapılandırma include’ları ve geçersiz yapılandırma onarımı">
    `plugins` bölümünüz tek dosyalı bir `$include` tarafından destekleniyorsa, `plugins install/update/enable/disable/uninstall` bu dahil edilen dosyaya yazar ve `openclaw.json` dosyasına dokunmaz. Kök include’ları, include dizileri ve kardeş geçersiz kılmalara sahip include’lar düzleştirilmek yerine kapalı şekilde başarısız olur. Desteklenen biçimler için [Yapılandırma include’ları](/tr/gateway/configuration) bölümüne bakın.

    Kurulum sırasında yapılandırma geçersizse, `plugins install` normalde kapalı şekilde başarısız olur ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Gateway başlatma ve sıcak yeniden yükleme sırasında, geçersiz Plugin yapılandırması diğer geçersiz yapılandırmalar gibi kapalı şekilde başarısız olur; `openclaw doctor --fix` geçersiz Plugin girdisini karantinaya alabilir. Belgelenen tek kurulum zamanı istisnası, açıkça `openclaw.install.allowInvalidConfigRecovery` seçeneğine dahil olan Plugin’ler için dar kapsamlı bir paketlenmiş Plugin kurtarma yoludur.

  </Accordion>
  <Accordion title="--force ve yeniden kurulum ile güncelleme karşılaştırması">
    `--force`, mevcut kurulum hedefini yeniden kullanır ve zaten kurulmuş bir Plugin’i veya hook paketini yerinde üzerine yazar. Aynı kimliği yeni bir yerel yol, arşiv, ClawHub paketi veya npm yapıtından kasıtlı olarak yeniden kurarken kullanın. Zaten izlenen bir npm Plugin’inin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` tercih edin.

    Zaten kurulu bir Plugin kimliği için `plugins install` çalıştırırsanız, OpenClaw durur ve normal yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna ya da mevcut kurulumu farklı bir kaynaktan gerçekten üzerine yazmak istediğinizde `plugins install <package> --force` komutuna yönlendirir.

  </Accordion>
  <Accordion title="--pin kapsamı">
    `--pin` yalnızca npm kurulumlarına uygulanır. `git:` kurulumlarıyla desteklenmez; sabitlenmiş bir kaynak istediğinizde `git:github.com/acme/plugin@v1.2.3` gibi açık bir git ref’i kullanın. `--marketplace` ile desteklenmez, çünkü marketplace kurulumları npm spec’i yerine marketplace kaynak meta verilerini kalıcı olarak saklar.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısındaki yanlış pozitifler için acil durum seçeneğidir. Yerleşik tarayıcı `critical` bulgular bildirdiğinde bile kurulumun devam etmesine izin verir, ancak Plugin `before_install` hook ilkesi engellerini **atlatmaz** ve tarama hatalarını **atlatmaz**.

    Bu CLI bayrağı, Plugin kurulum/güncelleme akışlarına uygulanır. Gateway destekli Skills bağımlılık kurulumları eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanırken, `openclaw skills install` ayrı bir ClawHub Skill indirme/kurma akışı olarak kalır.

    ClawHub’da yayımladığınız bir Plugin kayıt taraması tarafından engellenirse, [ClawHub](/tr/tools/clawhub) içindeki yayımcı adımlarını kullanın.

  </Accordion>
  <Accordion title="Hook paketleri ve npm spec’leri">
    `plugins install`, `package.json` içinde `openclaw.hooks` sunan hook paketleri için de kurulum yüzeyidir. Paket kurulumu için değil, filtrelenmiş hook görünürlüğü ve hook başına etkinleştirme için `openclaw hooks` kullanın.

    Npm spec’leri **yalnızca kayıt** içindir (paket adı + isteğe bağlı **tam sürüm** veya **dist-tag**). Git/URL/dosya spec’leri ve semver aralıkları reddedilir. Kabuğunuzda genel npm kurulum ayarları olsa bile, bağımlılık kurulumları güvenlik için proje yerelinde `--ignore-scripts` ile çalışır. Yönetilen Plugin npm kökleri OpenClaw’ın paket düzeyi npm `overrides` değerlerini devralır, bu yüzden ana makine güvenlik sabitlemeleri hoist edilen Plugin bağımlılıklarına da uygulanır.

    npm çözümlemesini açık hale getirmek istediğinizde `npm:<package>` kullanın. Yalın paket spec’leri de başlatma geçişi sırasında doğrudan npm’den kurulur.

    Yalın spec’ler ve `@latest` kararlı kanalda kalır. `2026.5.3-1` gibi OpenClaw tarih damgalı düzeltme sürümleri bu kontrol için kararlı sürümlerdir. npm bunlardan herhangi birini ön sürüme çözümlerse, OpenClaw durur ve `@beta`/`@rc` gibi bir ön sürüm etiketiyle veya `@1.2.3-beta.4` gibi tam bir ön sürümle açıkça katılmanızı ister.

    Yalın bir kurulum spec’i resmi bir Plugin kimliğiyle eşleşirse (örneğin `diffs`), OpenClaw katalog girdisini doğrudan kurar. Aynı ada sahip bir npm paketini kurmak için açık kapsamlı bir spec kullanın (örneğin `@scope/diffs`).

  </Accordion>
  <Accordion title="Git depoları">
    Doğrudan bir git deposundan kurulum yapmak için `git:<repo>` kullanın. Desteklenen biçimler arasında `git:github.com/owner/repo`, `git:owner/repo`, tam `https://`, `ssh://`, `git://`, `file://` ve `git@host:owner/repo.git` clone URL’leri bulunur. Kurulumdan önce bir branch, tag veya commit’i check out etmek için `@<ref>` veya `#<ref>` ekleyin.

    Git kurulumları geçici bir dizine clone eder, mevcutsa istenen ref’i check out eder, ardından normal Plugin dizini kurucusunu kullanır. Bu, manifest doğrulaması, tehlikeli kod taraması, package-manager kurulum işi ve kurulum kayıtlarının npm kurulumları gibi davrandığı anlamına gelir. Kaydedilen git kurulumları, kaynak URL/ref bilgisini ve çözümlenen commit’i içerir; böylece `openclaw plugins update` kaynağı daha sonra yeniden çözümleyebilir.

    Git’ten kurduktan sonra, gateway yöntemleri ve CLI komutları gibi runtime kayıtlarını doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. Plugin `api.registerCli` ile bir CLI kökü kaydettiyse, bu komutu doğrudan OpenClaw kök CLI’si üzerinden çalıştırın; örneğin `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arşivler">
    Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Yerel OpenClaw Plugin arşivleri, çıkarılan Plugin kökünde geçerli bir `openclaw.plugin.json` içermelidir; yalnızca `package.json` içeren arşivler, OpenClaw kurulum kayıtlarını yazmadan önce reddedilir.

    Dosya bir npm-pack tarball olduğunda ve
    `package-lock.json` doğrulaması, hoist edilmiş bağımlılık taraması ve
    npm kurulum kayıtları dahil olmak üzere registry kurulumları tarafından kullanılan aynı yönetilen npm-root kurulum yolunu test etmek istediğinizde `npm-pack:<path.tgz>` kullanın. Düz arşiv yolları yine de Plugin extensions kökü altında yerel arşivler olarak kurulur.

    Claude marketplace kurulumları da desteklenir.

  </Accordion>
</AccordionGroup>

ClawHub kurulumları açık bir `clawhub:<package>` konumlayıcısı kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Yalın npm güvenli Plugin spec’leri, başlatma geçişi sırasında varsayılan olarak npm’den kurulur:

```bash
openclaw plugins install openclaw-codex-app-server
```

Yalnızca npm çözümlemesini açık hale getirmek için `npm:` kullanın:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw, kurulumdan önce duyurulan Plugin API / minimum Gateway uyumluluğunu denetler. Seçilen ClawHub sürümü bir ClawPack yapıtı yayımladığında, OpenClaw sürümlendirilmiş npm-pack `.tgz` dosyasını indirir, ClawHub digest başlığını ve yapıt digest değerini doğrular, ardından normal arşiv yolu üzerinden kurar. ClawPack meta verisi olmayan daha eski ClawHub sürümleri yine eski paket arşivi doğrulama yolu üzerinden kurulur. Kaydedilen kurulumlar, daha sonraki güncellemeler için ClawHub kaynak meta verilerini, yapıt türünü, npm bütünlüğünü, npm shasum değerini, tarball adını ve ClawPack digest bilgilerini korur.
Sürümsüz ClawHub kurulumları, `openclaw plugins update` komutunun daha yeni ClawHub sürümlerini izleyebilmesi için sürümsüz bir kayıtlı spec tutar; `clawhub:pkg@1.2.3` ve `clawhub:pkg@beta` gibi açık sürüm veya etiket seçicileri o seçiciye sabitlenmiş kalır.

#### Marketplace kısayolu

Marketplace adı Claude'un `~/.claude/plugins/known_marketplaces.json` konumundaki yerel registry önbelleğinde varsa `plugin@marketplace` kısayolunu kullanın:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Marketplace kaynağını açıkça iletmek istediğinizde `--marketplace` kullanın:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - `~/.claude/plugins/known_marketplaces.json` içinden Claude tarafından bilinen bir marketplace adı
    - yerel bir marketplace kökü veya `marketplace.json` yolu
    - `owner/repo` gibi bir GitHub repo kısayolu
    - `https://github.com/owner/repo` gibi bir GitHub repo URL'si
    - bir git URL'si

  </Tab>
  <Tab title="Remote marketplace rules">
    GitHub veya git üzerinden yüklenen uzak marketplace'ler için Plugin girdileri klonlanan marketplace repo'sunun içinde kalmalıdır. OpenClaw, o repo'dan gelen göreli yol kaynaklarını kabul eder ve uzak manifestlerden gelen HTTP(S), mutlak yol, git, GitHub ve diğer yol olmayan Plugin kaynaklarını reddeder.
  </Tab>
</Tabs>

Yerel yollar ve arşivler için OpenClaw şunları otomatik algılar:

- yerel OpenClaw Plugin'leri (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya varsayılan Claude bileşen düzeni)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

<Note>
Uyumlu paketler normal Plugin köküne kurulur ve aynı liste/bilgi/etkinleştirme/devre dışı bırakma akışına katılır. Bugün paket Skills'leri, Claude komut-Skills'leri, Claude `settings.json` varsayılanları, Claude `.lsp.json` / manifest tarafından bildirilen `lspServers` varsayılanları, Cursor komut-Skills'leri ve uyumlu Codex hook dizinleri desteklenir; algılanan diğer paket yetenekleri tanılarda/bilgide gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmamıştır.
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
  Yalnızca etkin Plugin'leri göster.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Tablo görünümünden, kaynak/köken/sürüm/etkinleştirme meta verilerini içeren Plugin başına ayrıntı satırlarına geç.
</ParamField>
<ParamField path="--json" type="boolean">
  Registry tanıları ve paket bağımlılığı kurulum durumu ile birlikte makine tarafından okunabilir envanter.
</ParamField>

<Note>
`plugins list`, önce kalıcı yerel Plugin registry'sini okur; registry eksik veya geçersiz olduğunda yalnızca manifestten türetilmiş bir yedeğe döner. Bir Plugin'in kurulu, etkin ve soğuk başlatma planlamasına görünür olup olmadığını denetlemek için yararlıdır, ancak zaten çalışan bir Gateway sürecinin canlı çalışma zamanı yoklaması değildir. Plugin kodunu, etkinleştirmeyi, hook politikasını veya `plugins.load.paths` değerini değiştirdikten sonra, yeni `register(api)` kodunun veya hook'ların çalışmasını beklemeden önce kanala hizmet veren Gateway'i yeniden başlatın. Uzak/container dağıtımları için yalnızca bir sarmalayıcı süreci değil, gerçek `openclaw gateway run` alt sürecini yeniden başlattığınızı doğrulayın.

`plugins list --json`, her Plugin'in `package.json` içindeki `dependencies` ve `optionalDependencies` değerlerinden gelen `dependencyStatus` alanını içerir. OpenClaw, bu paket adlarının Plugin'in normal Node `node_modules` arama yolunda bulunup bulunmadığını denetler; Plugin çalışma zamanı kodunu import etmez, paket yöneticisi çalıştırmaz veya eksik bağımlılıkları onarmaz.
</Note>

`plugins search`, uzak bir ClawHub katalog sorgusudur. Yerel durumu incelemez, yapılandırmayı değiştirmez, paket kurmaz veya Plugin çalışma zamanı kodunu yüklemez. Arama sonuçları ClawHub paket adını, ailesini, kanalını, sürümünü, özetini ve `openclaw plugins install clawhub:<package>` gibi bir kurulum ipucunu içerir.

Paketlenmiş bir Docker imajı içinde gömülü Plugin çalışması için Plugin kaynak dizinini `/app/extensions/synology-chat` gibi eşleşen paketlenmiş kaynak yolunun üzerine bind-mount edin. OpenClaw bu bağlanan kaynak overlay'ini `/app/dist/extensions/synology-chat` konumundan önce keşfeder; düz kopyalanmış bir kaynak dizini etkisiz kalır, böylece normal paketlenmiş kurulumlar derlenmiş dist'i kullanmaya devam eder.

Çalışma zamanı hook hata ayıklaması için:

- `openclaw plugins inspect <id> --runtime --json`, modül yüklemeli bir inceleme geçişinden kayıtlı hook'ları ve tanıları gösterir. Çalışma zamanı incelemesi asla bağımlılık kurmaz; eski bağımlılık durumunu temizlemek veya yapılandırmada başvurulan eksik indirilebilir Plugin'leri kurtarmak için `openclaw doctor --fix` kullanın.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway'i, servis/süreç ipuçlarını, yapılandırma yolunu ve RPC sağlığını doğrular.
- Gömülü olmayan konuşma hook'ları (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) için `plugins.entries.<id>.hooks.allowConversationAccess=true` gerekir.

Yerel bir dizini kopyalamaktan kaçınmak için `--link` kullanın (`plugins.load.paths` içine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
Bağlantılı kurulumlar yönetilen bir kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullandığından `--force`, `--link` ile desteklenmez.

Varsayılan davranışı sabitlenmemiş tutarken çözümlenen kesin spec'i (`name@version`) yönetilen Plugin dizinine kaydetmek için npm kurulumlarında `--pin` kullanın.
</Note>

### Plugin dizini

Plugin kurulum meta verileri kullanıcı yapılandırması değil, makine tarafından yönetilen durumdur. Kurulumlar ve güncellemeler bunu etkin OpenClaw durum dizini altındaki `plugins/installs.json` dosyasına yazar. Üst düzey `installRecords` map'i, bozuk veya eksik Plugin manifestleri için kayıtlar dahil olmak üzere kurulum meta verilerinin kalıcı kaynağıdır. `plugins` dizisi, manifestten türetilmiş soğuk registry önbelleğidir. Dosya, düzenlemeyin uyarısı içerir ve `openclaw plugins update`, kaldırma, tanılar ve soğuk Plugin registry'si tarafından kullanılır.

OpenClaw yapılandırmada gönderilmiş eski `plugins.installs` kayıtları gördüğünde, çalışma zamanı okumaları bunları `openclaw.json` dosyasını yeniden yazmadan uyumluluk girdisi olarak ele alır. Açık Plugin yazımları ve `openclaw doctor --fix`, yapılandırma yazımlarına izin verildiğinde bu kayıtları Plugin dizinine taşır ve yapılandırma anahtarını kaldırır; yazımlardan biri başarısız olursa kurulum meta verilerinin kaybolmaması için yapılandırma kayıtları tutulur.

### Kaldırma

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, Plugin kayıtlarını `plugins.entries` içinden, kalıcı Plugin dizininden, Plugin izin/verme listesi girdilerinden ve geçerli olduğunda bağlantılı `plugins.load.paths` girdilerinden kaldırır. `--keep-files` ayarlanmadığı sürece kaldırma işlemi, OpenClaw'un Plugin extensions kökünün içindeyse izlenen yönetilen kurulum dizinini de kaldırır. Active Memory Plugin'leri için bellek slotu `memory-core` değerine sıfırlanır.

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
    Bir Plugin id'si ilettiğinizde OpenClaw o Plugin için kayıtlı kurulum spec'ini yeniden kullanır. Bu, daha önce saklanan `@beta` gibi dist-tag'lerin ve kesin sabitlenmiş sürümlerin sonraki `update <id>` çalıştırmalarında kullanılmaya devam edeceği anlamına gelir.

    npm kurulumları için bir dist-tag veya kesin sürüm içeren açık bir npm paket spec'i de iletebilirsiniz. OpenClaw bu paket adını izlenen Plugin kaydına geri çözer, o kurulu Plugin'i günceller ve gelecekte id tabanlı güncellemeler için yeni npm spec'ini kaydeder.

    npm paket adını sürüm veya etiket olmadan iletmek de izlenen Plugin kaydına geri çözümlenir. Bir Plugin kesin bir sürüme sabitlendiğinde ve onu registry'nin varsayılan sürüm hattına geri taşımak istediğinizde bunu kullanın.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update`, yeni bir spec iletmediğiniz sürece izlenen Plugin spec'ini yeniden kullanır. `openclaw update` ayrıca etkin OpenClaw güncelleme kanalını bilir: beta kanalında, varsayılan hat npm ve ClawHub Plugin kayıtları önce `@beta` dener, Plugin beta sürümü yoksa kayıtlı varsayılan/latest spec'e geri döner. Kesin sürümler ve açık etiketler o seçiciye sabitlenmiş kalır.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Canlı bir npm güncellemesinden önce OpenClaw, kurulu paket sürümünü npm registry meta verilerine göre denetler. Kurulu sürüm ve kayıtlı yapıt kimliği çözümlenen hedefle zaten eşleşiyorsa güncelleme indirme, yeniden kurma veya `openclaw.json` dosyasını yeniden yazma olmadan atlanır.

    Saklanan bir integrity hash'i varsa ve getirilen yapıt hash'i değişirse OpenClaw bunu npm yapıt sapması olarak ele alır. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek hash'leri yazdırır ve devam etmeden önce onay ister. Etkileşimsiz güncelleme yardımcıları, çağıran taraf açık bir devam politikası sağlamadıkça kapalı hata verir.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install`, Plugin güncellemeleri sırasında yerleşik tehlikeli kod taraması yanlış pozitifleri için bir acil durum geçersiz kılması olarak `plugins update` üzerinde de kullanılabilir. Yine de Plugin `before_install` politika engellerini veya tarama hatası engellemesini atlatmaz ve yalnızca Plugin güncellemelerine uygulanır, hook-pack güncellemelerine uygulanmaz.
  </Accordion>
</AccordionGroup>

### İnceleme

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect, varsayılan olarak Plugin çalışma zamanını import etmeden kimliği, yükleme durumunu, kaynağı, manifest yeteneklerini, politika bayraklarını, tanıları, kurulum meta verilerini, paket yeteneklerini ve algılanan MCP veya LSP sunucu desteğini gösterir. Plugin modülünü yüklemek ve kayıtlı hook'ları, araçları, komutları, servisleri, Gateway yöntemlerini ve HTTP rotalarını eklemek için `--runtime` ekleyin. Çalışma zamanı incelemesi eksik Plugin bağımlılıklarını doğrudan bildirir; kurulumlar ve onarımlar `openclaw plugins install`, `openclaw plugins update` ve `openclaw doctor --fix` içinde kalır.

Plugin'in sahip olduğu CLI komutları kök `openclaw` komut grupları olarak kurulur. `inspect --runtime`, `cliCommands` altında bir komut gösterdikten sonra bunu `openclaw <command> ...` olarak çalıştırın; örneğin `demo-git` kaydeden bir Plugin `openclaw demo-git ping` ile doğrulanabilir.

Her Plugin, çalışma zamanında gerçekten ne kaydettiğine göre sınıflandırılır:

- **plain-capability** — tek capability türü (ör. yalnızca sağlayıcı plugin'i)
- **hybrid-capability** — birden fazla capability türü (ör. metin + konuşma + görüntüler)
- **hook-only** — yalnızca hook'lar, capability veya yüzey yok
- **non-capability** — araçlar/komutlar/hizmetler, ancak capability yok

Capability modeli hakkında daha fazla bilgi için [Plugin şekilleri](/tr/plugins/architecture#plugin-shapes) bölümüne bakın.

<Note>
`--json` bayrağı, betik yazımı ve denetim için uygun, makine tarafından okunabilir bir rapor çıktılar. `inspect --all`, şekil, capability türleri, uyumluluk bildirimleri, paket capability'leri ve hook özeti sütunlarını içeren filo genelinde bir tablo oluşturur. `info`, `inspect` için bir takma addır.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, plugin yükleme hatalarını, manifest/keşif tanılamalarını ve uyumluluk bildirimlerini raporlar. Her şey temiz olduğunda `No plugin issues detected.` yazdırır.

Yapılandırılmış bir plugin diskte mevcutsa ancak yükleyicinin yol güvenliği kontrolleri tarafından engelleniyorsa, yapılandırma doğrulaması plugin girdisini korur ve bunu `present but blocked` olarak raporlar. `plugins.entries.<id>` veya `plugins.allow` yapılandırmasını kaldırmak yerine, yol sahipliği veya herkes tarafından yazılabilir izinler gibi önceki engellenmiş-plugin tanılamasını düzeltin.

Eksik `register`/`activate` dışa aktarımları gibi modül şekli hataları için, tanılama çıktısına kompakt bir dışa aktarım şekli özeti eklemek üzere `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Kayıt Defteri

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Yerel plugin kayıt defteri, kurulu plugin kimliği, etkinleştirme, kaynak meta verileri ve katkı sahipliği için OpenClaw'ın kalıcı soğuk okuma modelidir. Normal başlatma, sağlayıcı sahibi araması, kanal kurulum sınıflandırması ve plugin envanteri, plugin çalışma zamanı modüllerini içe aktarmadan bunu okuyabilir.

Kalıcı kayıt defterinin mevcut, güncel veya eski olup olmadığını incelemek için `plugins registry` kullanın. Kalıcı plugin dizininden, yapılandırma politikasından ve manifest/paket meta verilerinden bunu yeniden oluşturmak için `--refresh` kullanın. Bu bir onarım yoludur, çalışma zamanı etkinleştirme yolu değildir.

`openclaw doctor --fix` ayrıca kayıt defteriyle ilişkili yönetilen npm sapmasını onarır: yönetilen plugin npm kökü altındaki yetim veya kurtarılmış bir `@openclaw/*` paketi paketlenmiş bir plugin'i gölgelerse, doctor bu eski paketi kaldırır ve kayıt defterini yeniden oluşturur, böylece başlatma paketlenmiş manifest'e göre doğrulanır.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`, kayıt defteri okuma hataları için kullanımdan kaldırılmış bir acil durum uyumluluk anahtarıdır. `plugins registry --refresh` veya `openclaw doctor --fix` tercih edin; env yedeği yalnızca geçiş kullanıma alınırken acil başlatma kurtarması içindir.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace listesi yerel bir marketplace yolunu, bir `marketplace.json` yolunu, `owner/repo` gibi bir GitHub kısaltmasını, bir GitHub repo URL'sini veya bir git URL'sini kabul eder. `--json`, çözümlenmiş kaynak etiketini, ayrıştırılmış marketplace manifest'i ve plugin girdileriyle birlikte yazdırır.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [CLI başvurusu](/tr/cli)
- [Topluluk plugin'leri](/tr/plugins/community)
