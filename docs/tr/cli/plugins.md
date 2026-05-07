---
read_when:
    - Gateway Plugin'lerini veya uyumlu paketleri yüklemek ya da yönetmek istiyorsunuz
    - Plugin yükleme hatalarında hata ayıklamak istiyorsunuz
sidebarTitle: Plugins
summary: '`openclaw plugins` için CLI referansı (list, install, marketplace, uninstall, enable/disable, doctor)'
title: Pluginler
x-i18n:
    generated_at: "2026-05-07T13:15:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73023d11309c5dc4fe9fab9cffc0f7d96de1e1c22ce1ec4d2cd22d2aa4808f1a
    source_path: cli/plugins.md
    workflow: 16
---

Yüklü Gateway Plugin'lerini, hook paketlerini ve uyumlu paketleri yönetin.

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
    Plugin yüklemeleri için güvenlik sıkılaştırması.
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

Yavaş yükleme, inceleme, kaldırma veya registry yenileme incelemesi için komutu `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ile çalıştırın. İzleme, aşama sürelerini stderr'ye yazar ve JSON çıktısının ayrıştırılabilir kalmasını sağlar. Bkz. [Hata ayıklama](/tr/help/debugging#plugin-lifecycle-trace).

<Note>
Nix modunda (`OPENCLAW_NIX_MODE=1`), Plugin yaşam döngüsü değiştiricileri devre dışıdır. Bu yükleme için `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` veya `plugins disable` yerine Nix kaynağını kullanın; nix-openclaw için agent öncelikli [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) kılavuzunu kullanın.
</Note>

<Note>
Paketlenmiş Plugin'ler OpenClaw ile birlikte gelir. Bazıları varsayılan olarak etkindir (örneğin paketlenmiş model sağlayıcıları, paketlenmiş konuşma sağlayıcıları ve paketlenmiş tarayıcı Plugin'i); diğerleri `plugins enable` gerektirir.

Yerel OpenClaw Plugin'leri, satır içi JSON Schema (`configSchema`, boş olsa bile) içeren `openclaw.plugin.json` göndermelidir. Uyumlu paketler bunun yerine kendi paket manifestlerini kullanır.

`plugins list`, `Format: openclaw` veya `Format: bundle` gösterir. Ayrıntılı list/info çıktısı ayrıca paket alt türünü (`codex`, `claude` veya `cursor`) ve algılanan paket yeteneklerini gösterir.
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
Düz paket adları, başlatma geçişi sırasında varsayılan olarak npm'den yüklenir. ClawHub için `clawhub:<package>` kullanın. Plugin yüklemelerini kod çalıştırmak gibi değerlendirin. Sabitlenmiş sürümleri tercih edin.
</Warning>

`plugins search`, yüklenebilir Plugin paketleri için ClawHub'ı sorgular ve yüklemeye hazır paket adlarını yazdırır. Skills'leri değil, kod-Plugin ve paket-Plugin paketlerini arar. ClawHub Skills'leri için `openclaw skills search` kullanın.

<Note>
ClawHub, çoğu Plugin için birincil dağıtım ve keşif yüzeyidir. Npm desteklenen bir geri dönüş ve doğrudan yükleme yolu olarak kalır. OpenClaw'a ait `@openclaw/*` Plugin paketleri yeniden npm'de yayımlanır; güncel liste için [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) veya [Plugin envanteri](/tr/plugins/plugin-inventory) sayfasına bakın. Kararlı yüklemeler `latest` kullanır. Beta kanalı yüklemeleri ve güncellemeleri, bu etiket mevcut olduğunda npm `beta` dist-tag'ini tercih eder, ardından `latest`'e geri döner.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    `plugins` bölümünüz tek dosyalı bir `$include` tarafından destekleniyorsa, `plugins install/update/enable/disable/uninstall` bu dahil edilen dosyaya yazar ve `openclaw.json` dosyasına dokunmaz. Kök include'lar, include dizileri ve kardeş geçersiz kılmaları olan include'lar düzleştirmek yerine kapalı şekilde başarısız olur. Desteklenen şekiller için [Yapılandırma include'ları](/tr/gateway/configuration) bölümüne bakın.

    Yükleme sırasında yapılandırma geçersizse, `plugins install` normalde kapalı şekilde başarısız olur ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Gateway başlangıcı ve sıcak yeniden yükleme sırasında, geçersiz Plugin yapılandırması diğer geçersiz yapılandırmalar gibi kapalı şekilde başarısız olur; `openclaw doctor --fix` geçersiz Plugin girdisini karantinaya alabilir. Belgelenen tek yükleme zamanı istisnası, açıkça `openclaw.install.allowInvalidConfigRecovery` seçeneğine katılan Plugin'ler için dar kapsamlı paketlenmiş-Plugin kurtarma yoludur.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force`, mevcut yükleme hedefini yeniden kullanır ve zaten yüklü bir Plugin'i veya hook paketini yerinde üzerine yazar. Aynı id'yi yeni bir yerel yoldan, arşivden, ClawHub paketinden veya npm yapıtından bilerek yeniden yüklüyorsanız bunu kullanın. Zaten izlenen bir npm Plugin'inin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` tercih edin.

    Zaten yüklü olan bir Plugin id'si için `plugins install` çalıştırırsanız OpenClaw durur ve normal yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna, geçerli yüklemeyi farklı bir kaynaktan gerçekten üzerine yazmak istediğinizde ise `plugins install <package> --force` komutuna yönlendirir.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` yalnızca npm yüklemelerine uygulanır. `git:` yüklemeleriyle desteklenmez; sabitlenmiş bir kaynak istediğinizde `git:github.com/acme/plugin@v1.2.3` gibi açık bir git ref'i kullanın. `--marketplace` ile desteklenmez, çünkü marketplace yüklemeleri npm spec'i yerine marketplace kaynak meta verilerini kalıcı kılar.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısındaki yanlış pozitifler için bir acil durum seçeneğidir. Yerleşik tarayıcı `critical` bulgular bildirdiğinde bile yüklemenin devam etmesine izin verir, ancak Plugin `before_install` hook ilke engellerini **atlatmaz** ve tarama hatalarını **atlatmaz**.

    Bu CLI bayrağı Plugin yükleme/güncelleme akışlarına uygulanır. Gateway destekli skill bağımlılık yüklemeleri eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanırken, `openclaw skills install` ayrı bir ClawHub skill indirme/yükleme akışı olarak kalır.

    ClawHub'da yayımladığınız bir Plugin bir registry taraması tarafından engellenirse, [ClawHub](/tr/tools/clawhub) içindeki yayıncı adımlarını kullanın.

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install`, `package.json` içinde `openclaw.hooks` sunan hook paketleri için de yükleme yüzeyidir. Paket yüklemesi için değil, filtrelenmiş hook görünürlüğü ve hook başına etkinleştirme için `openclaw hooks` kullanın.

    Npm spec'leri **yalnızca registry** içindir (paket adı + isteğe bağlı **tam sürüm** veya **dist-tag**). Git/URL/dosya spec'leri ve semver aralıkları reddedilir. Bağımlılık yüklemeleri, kabuğunuzda global npm yükleme ayarları olsa bile güvenlik için `--ignore-scripts` ile proje yerelinde çalışır. Yönetilen Plugin npm kökleri OpenClaw'ın paket düzeyi npm `overrides` değerlerini devralır, böylece ana bilgisayar güvenlik sabitlemeleri yükseltilmiş Plugin bağımlılıklarına da uygulanır.

    Npm çözümlemesini açık hale getirmek istediğinizde `npm:<package>` kullanın. Düz paket spec'leri de başlatma geçişi sırasında doğrudan npm'den yüklenir.

    Düz spec'ler ve `@latest` kararlı izde kalır. `2026.5.3-1` gibi OpenClaw tarih damgalı düzeltme sürümleri bu kontrol için kararlı yayınlardır. npm bunlardan herhangi birini ön sürüme çözümlerse OpenClaw durur ve `@beta`/`@rc` gibi bir ön sürüm etiketiyle veya `@1.2.3-beta.4` gibi tam bir ön sürümle açıkça katılmanızı ister.

    Düz bir yükleme spec'i resmi bir Plugin id'siyle eşleşirse (örneğin `diffs`), OpenClaw katalog girdisini doğrudan yükler. Aynı ada sahip bir npm paketi yüklemek için açık kapsamlı bir spec kullanın (örneğin `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Doğrudan bir git deposundan yüklemek için `git:<repo>` kullanın. Desteklenen biçimler arasında `git:github.com/owner/repo`, `git:owner/repo`, tam `https://`, `ssh://`, `git://`, `file://` ve `git@host:owner/repo.git` klon URL'leri bulunur. Yüklemeden önce bir dal, etiket veya commit'i checkout etmek için `@<ref>` veya `#<ref>` ekleyin.

    Git yüklemeleri geçici bir dizine klonlar, varsa istenen ref'i checkout eder, ardından normal Plugin dizin yükleyicisini kullanır. Bu, manifest doğrulaması, tehlikeli kod taraması, paket yöneticisi yükleme işi ve yükleme kayıtlarının npm yüklemeleri gibi davrandığı anlamına gelir. Kaydedilen git yüklemeleri, kaynak URL/ref değerini ve çözümlenen commit'i içerir; böylece `openclaw plugins update` kaynağı daha sonra yeniden çözümleyebilir.

    Git'ten yükledikten sonra Gateway yöntemleri ve CLI komutları gibi runtime kayıtlarını doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. Plugin `api.registerCli` ile bir CLI kökü kaydettiyse, o komutu doğrudan OpenClaw kök CLI üzerinden yürütün; örneğin `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Yerel OpenClaw Plugin arşivleri, çıkarılan Plugin kökünde geçerli bir `openclaw.plugin.json` içermelidir; yalnızca `package.json` içeren arşivler OpenClaw yükleme kayıtlarını yazmadan önce reddedilir.

    Dosya bir npm-pack tarball olduğunda ve registry yüklemeleri tarafından kullanılan aynı yönetilen npm-root yükleme yolunu test etmek istediğinizde `npm-pack:<path.tgz>` kullanın; buna `package-lock.json` doğrulaması, yükseltilmiş bağımlılık taraması ve npm yükleme kayıtları dahildir. Düz arşiv yolları yine de Plugin extensions kökü altında yerel arşivler olarak yüklenir.

    Claude marketplace yüklemeleri de desteklenir.

  </Accordion>
</AccordionGroup>

ClawHub yüklemeleri açık bir `clawhub:<package>` konumlayıcısı kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Düz npm açısından güvenli Plugin spec'leri, başlatma geçişi sırasında varsayılan olarak npm'den yüklenir:

```bash
openclaw plugins install openclaw-codex-app-server
```

Yalnızca npm çözümlemesini açık hale getirmek için `npm:` kullanın:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw, kurulumdan önce ilan edilen Plugin API / minimum Gateway uyumluluğunu kontrol eder. Seçilen ClawHub sürümü bir ClawPack artefaktı yayımladığında, OpenClaw sürümlendirilmiş npm-pack `.tgz` dosyasını indirir, ClawHub özet başlığını ve artefakt özetini doğrular, ardından normal arşiv yolu üzerinden kurar. ClawPack meta verisi olmayan eski ClawHub sürümleri hâlâ eski paket arşivi doğrulama yolu üzerinden kurulur. Kaydedilen kurulumlar daha sonraki güncellemeler için ClawHub kaynak meta verilerini, artefakt türünü, npm bütünlüğünü, npm shasum değerini, tarball adını ve ClawPack özet bilgilerini saklar.
Sürümlendirilmemiş ClawHub kurulumları, `openclaw plugins update` komutunun daha yeni ClawHub sürümlerini izleyebilmesi için sürümlendirilmemiş kaydedilmiş bir spec tutar; `clawhub:pkg@1.2.3` ve `clawhub:pkg@beta` gibi açık sürüm veya etiket seçicileri bu seçiciye sabitlenmiş olarak kalır.

#### Marketplace kısayolu

Marketplace adı Claude'un `~/.claude/plugins/known_marketplaces.json` konumundaki yerel registry önbelleğinde varsa `plugin@marketplace` kısayolunu kullanın:

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
    - `~/.claude/plugins/known_marketplaces.json` içinden bir Claude bilinen-marketplace adı
    - yerel bir marketplace kökü veya `marketplace.json` yolu
    - `owner/repo` gibi bir GitHub repo kısayolu
    - `https://github.com/owner/repo` gibi bir GitHub repo URL'si
    - bir git URL'si

  </Tab>
  <Tab title="Uzak marketplace kuralları">
    GitHub veya git üzerinden yüklenen uzak marketplace'ler için Plugin girdileri klonlanan marketplace repo'sunun içinde kalmalıdır. OpenClaw, bu repo'dan göreli yol kaynaklarını kabul eder ve uzak manifestlerden HTTP(S), mutlak-yol, git, GitHub ve diğer yol olmayan Plugin kaynaklarını reddeder.
  </Tab>
</Tabs>

Yerel yollar ve arşivler için OpenClaw şunları otomatik algılar:

- yerel OpenClaw Plugin'leri (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya varsayılan Claude bileşen düzeni)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

<Note>
Uyumlu paketler normal Plugin köküne kurulur ve aynı liste/bilgi/etkinleştir/devre dışı bırak akışına katılır. Bugün paket Skills'ları, Claude komut-Skills'ları, Claude `settings.json` varsayılanları, Claude `.lsp.json` / manifestte bildirilen `lspServers` varsayılanları, Cursor komut-Skills'ları ve uyumlu Codex hook dizinleri desteklenir; algılanan diğer paket yetenekleri tanılarda/bilgide gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmamıştır.
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
  Tablo görünümünden, kaynak/köken/sürüm/aktivasyon meta verileriyle Plugin başına ayrıntı satırlarına geç.
</ParamField>
<ParamField path="--json" type="boolean">
  Registry tanıları ve paket bağımlılığı kurulum durumuyla birlikte makine tarafından okunabilir envanter.
</ParamField>

<Note>
`plugins list`, registry eksik veya geçersiz olduğunda yalnızca manifestten türetilmiş bir yedekle önce kalıcı yerel Plugin registry'sini okur. Bir Plugin'in kurulu, etkin ve soğuk başlatma planlamasında görünür olup olmadığını kontrol etmek için yararlıdır, ancak zaten çalışan bir Gateway sürecinin canlı çalışma zamanı yoklaması değildir. Plugin kodunu, etkinleştirmeyi, hook politikasını veya `plugins.load.paths` değerini değiştirdikten sonra yeni `register(api)` kodunun veya hook'ların çalışmasını beklemeden önce kanala hizmet veren Gateway'i yeniden başlatın. Uzak/konteyner dağıtımlarında yalnızca bir sarmalayıcı süreci değil, gerçek `openclaw gateway run` alt sürecini yeniden başlattığınızı doğrulayın.

`plugins list --json`, her Plugin'in `package.json` içindeki `dependencies` ve `optionalDependencies` değerlerinden gelen `dependencyStatus` bilgisini içerir. OpenClaw, bu paket adlarının Plugin'in normal Node `node_modules` arama yolu boyunca bulunup bulunmadığını kontrol eder; Plugin çalışma zamanı kodunu içe aktarmaz, paket yöneticisi çalıştırmaz veya eksik bağımlılıkları onarmaz.
</Note>

`plugins search`, uzak bir ClawHub katalog aramasıdır. Yerel durumu incelemez, config'i değiştirmez, paket kurmaz veya Plugin çalışma zamanı kodu yüklemez. Arama sonuçları ClawHub paket adını, ailesini, kanalını, sürümünü, özetini ve `openclaw plugins install clawhub:<package>` gibi bir kurulum ipucunu içerir.

Paketlenmiş bir Docker imajının içindeki gömülü Plugin çalışmaları için, Plugin kaynak dizinini `/app/extensions/synology-chat` gibi eşleşen paketlenmiş kaynak yolunun üzerine bind-mount edin. OpenClaw bu bağlanmış kaynak katmanını `/app/dist/extensions/synology-chat` öncesinde keşfeder; düz kopyalanmış bir kaynak dizini etkisiz kalır, böylece normal paketlenmiş kurulumlar hâlâ derlenmiş dist kullanır.

Çalışma zamanı hook hata ayıklaması için:

- `openclaw plugins inspect <id> --runtime --json`, modül yüklü bir inceleme geçişinden kayıtlı hook'ları ve tanıları gösterir. Çalışma zamanı incelemesi bağımlılıkları asla kurmaz; eski bağımlılık durumunu temizlemek veya config tarafından başvurulan eksik indirilebilir Plugin'leri kurtarmak için `openclaw doctor --fix` kullanın.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway'i, servis/süreç ipuçlarını, config yolunu ve RPC sağlığını doğrular.
- Gömülü olmayan konuşma hook'ları (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.

Yerel bir dizini kopyalamaktan kaçınmak için `--link` kullanın (`plugins.load.paths` içine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force`, `--link` ile desteklenmez çünkü bağlantılı kurulumlar yönetilen bir kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullanır.

Varsayılan davranışı sabitlenmemiş tutarken çözümlenen tam spec'i (`name@version`) yönetilen Plugin dizinine kaydetmek için npm kurulumlarında `--pin` kullanın.
</Note>

### Plugin dizini

Plugin kurulum meta verileri kullanıcı config'i değil, makine tarafından yönetilen durumdur. Kurulumlar ve güncellemeler bunu etkin OpenClaw durum dizini altında `plugins/installs.json` içine yazar. Üst düzey `installRecords` map'i, bozuk veya eksik Plugin manifestleri için kayıtlar dahil kurulum meta verilerinin kalıcı kaynağıdır. `plugins` dizisi manifestten türetilmiş soğuk registry önbelleğidir. Dosya bir düzenlemeyin uyarısı içerir ve `openclaw plugins update`, kaldırma, tanılar ve soğuk Plugin registry'si tarafından kullanılır.

OpenClaw, config içinde gönderilmiş eski `plugins.installs` kayıtları gördüğünde, çalışma zamanı okumaları bunları `openclaw.json` dosyasını yeniden yazmadan uyumluluk girdisi olarak ele alır. Açık Plugin yazımları ve `openclaw doctor --fix`, config yazımlarına izin verildiğinde bu kayıtları Plugin dizinine taşır ve config anahtarını kaldırır; yazımlardan biri başarısız olursa kurulum meta verilerinin kaybolmaması için config kayıtları tutulur.

### Kaldırma

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, uygun olduğunda Plugin kayıtlarını `plugins.entries` içinden, kalıcı Plugin dizininden, Plugin izin/verme listesi girdilerinden ve bağlantılı `plugins.load.paths` girdilerinden kaldırır. `--keep-files` ayarlanmadıkça kaldırma, izlenen yönetilen kurulum dizini OpenClaw'un Plugin uzantıları kökünün içindeyse onu da kaldırır. Active Memory Plugin'leri için bellek slot'u `memory-core` değerine sıfırlanır.

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

Güncellemeler, yönetilen Plugin dizinindeki izlenen Plugin kurulumlarına ve `hooks.internal.installs` içindeki izlenen hook-pack kurulumlarına uygulanır.

<AccordionGroup>
  <Accordion title="Plugin id ile npm spec çözümleme">
    Bir Plugin id'si geçirdiğinizde OpenClaw o Plugin için kaydedilmiş kurulum spec'ini yeniden kullanır. Bu, daha önce depolanan `@beta` gibi dist-tag'lerin ve tam sabitlenmiş sürümlerin sonraki `update <id>` çalıştırmalarında kullanılmaya devam ettiği anlamına gelir.

    npm kurulumları için, bir dist-tag veya tam sürüm içeren açık bir npm paket spec'i de geçirebilirsiniz. OpenClaw bu paket adını izlenen Plugin kaydına geri çözümler, kurulu Plugin'i günceller ve gelecekteki id tabanlı güncellemeler için yeni npm spec'ini kaydeder.

    npm paket adını sürüm veya etiket olmadan geçirmek de izlenen Plugin kaydına geri çözümlenir. Bir Plugin tam bir sürüme sabitlenmişse ve onu registry'nin varsayılan sürüm hattına geri taşımak istiyorsanız bunu kullanın.

  </Accordion>
  <Accordion title="Beta kanal güncellemeleri">
    `openclaw plugins update`, yeni bir spec geçirmediğiniz sürece izlenen Plugin spec'ini yeniden kullanır. `openclaw update` ayrıca etkin OpenClaw güncelleme kanalını bilir: beta kanalında, varsayılan-hat npm ve ClawHub Plugin kayıtları önce `@beta` dener, ardından Plugin beta sürümü yoksa kaydedilmiş varsayılan/latest spec'e geri döner. Tam sürümler ve açık etiketler bu seçiciye sabitlenmiş olarak kalır.

  </Accordion>
  <Accordion title="Sürüm kontrolleri ve bütünlük kayması">
    Canlı bir npm güncellemesinden önce OpenClaw, kurulu paket sürümünü npm registry meta verilerine göre kontrol eder. Kurulu sürüm ve kaydedilmiş artefakt kimliği çözümlenen hedefle zaten eşleşiyorsa güncelleme indirme, yeniden kurma veya `openclaw.json` yeniden yazma olmadan atlanır.

    Depolanmış bir bütünlük hash'i bulunduğunda ve alınan artefakt hash'i değiştiğinde, OpenClaw bunu npm artefakt kayması olarak ele alır. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek hash'leri yazdırır ve devam etmeden önce onay ister. Etkileşimli olmayan güncelleme yardımcıları, çağıran açık bir devam politikası sağlamadığı sürece kapalı başarısız olur.

  </Accordion>
  <Accordion title="Güncellemede --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, Plugin güncellemeleri sırasında yerleşik tehlikeli-kod taraması yanlış pozitifleri için bir acil durum override'ı olarak `plugins update` üzerinde de kullanılabilir. Yine de Plugin `before_install` politika engellerini veya tarama-hatası engellemesini atlamaz ve yalnızca Plugin güncellemelerine uygulanır, hook-pack güncellemelerine uygulanmaz.
  </Accordion>
</AccordionGroup>

### İnceleme

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect, varsayılan olarak Plugin çalışma zamanını içe aktarmadan kimliği, yükleme durumunu, kaynağı, manifest yeteneklerini, politika bayraklarını, tanıları, kurulum meta verilerini, paket yeteneklerini ve algılanan MCP veya LSP sunucu desteğini gösterir. Plugin modülünü yüklemek ve kayıtlı hook'ları, araçları, komutları, servisleri, Gateway yöntemlerini ve HTTP route'larını dahil etmek için `--runtime` ekleyin. Çalışma zamanı incelemesi eksik Plugin bağımlılıklarını doğrudan raporlar; kurulumlar ve onarımlar `openclaw plugins install`, `openclaw plugins update` ve `openclaw doctor --fix` içinde kalır.

Plugin sahibi CLI komutları genellikle kök `openclaw` komut grupları olarak kurulur, ancak Plugin'ler `openclaw nodes` gibi bir core parent altında iç içe komutlar da kaydedebilir. `inspect --runtime`, `cliCommands` altında bir komut gösterdikten sonra onu listelenen yolda çalıştırın; örneğin `demo-git` kaydeden bir Plugin, `openclaw demo-git ping` ile doğrulanabilir.

Her Plugin, çalışma zamanında gerçekte ne kaydettiğine göre sınıflandırılır:

- **plain-capability** — tek bir yetenek türü (ör. yalnızca sağlayıcıdan oluşan bir Plugin)
- **hybrid-capability** — birden çok yetenek türü (ör. metin + konuşma + görüntüler)
- **hook-only** — yalnızca hook'lar, yetenek veya yüzey yok
- **non-capability** — araçlar/komutlar/hizmetler var ancak yetenek yok

Yetenek modeli hakkında daha fazla bilgi için [Plugin şekilleri](/tr/plugins/architecture#plugin-shapes) bölümüne bakın.

<Note>
`--json` bayrağı, betik yazma ve denetim için uygun, makine tarafından okunabilir bir rapor çıktısı verir. `inspect --all`, şekil, yetenek türleri, uyumluluk bildirimleri, paket yetenekleri ve hook özeti sütunları içeren filo genelinde bir tablo oluşturur. `info`, `inspect` için bir takma addır.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, Plugin yükleme hatalarını, manifest/keşif tanılamalarını ve uyumluluk bildirimlerini raporlar. Her şey temiz olduğunda `No plugin issues detected.` yazdırır.

Yapılandırılmış bir Plugin diskte mevcutsa ancak yükleyicinin yol güvenliği denetimleri tarafından engellenmişse, yapılandırma doğrulaması Plugin girdisini korur ve bunu `present but blocked` olarak raporlar. `plugins.entries.<id>` veya `plugins.allow` yapılandırmasını kaldırmak yerine, yol sahipliği ya da herkes tarafından yazılabilir izinler gibi önceki engellenmiş-Plugin tanılamasını düzeltin.

Eksik `register`/`activate` dışa aktarımları gibi modül şekli hataları için, tanılama çıktısına kompakt bir dışa aktarım şekli özeti eklemek üzere `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Kayıt Defteri

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Yerel Plugin kayıt defteri, OpenClaw'ın kurulu Plugin kimliği, etkinleştirme durumu, kaynak meta verileri ve katkı sahipliği için kalıcı hale getirilmiş soğuk okuma modelidir. Normal başlangıç, sağlayıcı sahibi araması, kanal kurulum sınıflandırması ve Plugin envanteri, Plugin çalışma zamanı modüllerini içe aktarmadan bunu okuyabilir.

Kalıcı kayıt defterinin mevcut, güncel veya eski olup olmadığını incelemek için `plugins registry` kullanın. Kalıcı Plugin dizininden, yapılandırma politikasından ve manifest/paket meta verilerinden yeniden oluşturmak için `--refresh` kullanın. Bu bir onarım yoludur, çalışma zamanı etkinleştirme yolu değildir.

`openclaw doctor --fix`, kayıt defteriyle ilişkili yönetilen npm sapmalarını da onarır: yönetilen Plugin npm kökü altında sahipsiz veya kurtarılmış bir `@openclaw/*` paketi paketlenmiş bir Plugin'i gölgeliyorsa, doctor bu eski paketi kaldırır ve kayıt defterini yeniden oluşturur; böylece başlangıç paketlenmiş manifest'e göre doğrulanır.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`, kayıt defteri okuma hataları için kullanımdan kaldırılmış bir acil durum uyumluluk anahtarıdır. `plugins registry --refresh` veya `openclaw doctor --fix` tercih edin; env geri dönüşü yalnızca geçiş yayına alınırken acil başlangıç kurtarması içindir.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace listeleme, yerel bir marketplace yolu, bir `marketplace.json` yolu, `owner/repo` gibi bir GitHub kısaltması, bir GitHub depo URL'si veya bir git URL'si kabul eder. `--json`, çözümlenen kaynak etiketini, ayrıştırılmış marketplace manifest'ini ve Plugin girdilerini yazdırır.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [CLI başvurusu](/tr/cli)
- [Topluluk Plugin'leri](/tr/plugins/community)
