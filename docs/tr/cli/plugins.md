---
read_when:
    - Gateway Plugin'lerini veya uyumlu paketleri yüklemek ya da yönetmek istiyorsunuz
    - Plugin yükleme hatalarını ayıklamak istiyorsunuz
sidebarTitle: Plugins
summary: 'CLI başvurusu: `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)'
title: Plugin'ler
x-i18n:
    generated_at: "2026-05-11T20:26:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ad7d6341d6c2325bfef966b00ca1956f8b337fd0ffe40dba3384ed7eefd1285
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin’lerini, hook paketlerini ve uyumlu bundle’ları yönetin.

<CardGroup cols={2}>
  <Card title="Plugin sistemi" href="/tr/tools/plugin">
    Plugin’leri yükleme, etkinleştirme ve sorun giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Plugin’leri yönet" href="/tr/plugins/manage-plugins">
    Yükleme, listeleme, güncelleme, kaldırma ve yayımlama için hızlı örnekler.
  </Card>
  <Card title="Plugin bundle’ları" href="/tr/plugins/bundles">
    Bundle uyumluluk modeli.
  </Card>
  <Card title="Plugin manifest’i" href="/tr/plugins/manifest">
    Manifest alanları ve yapılandırma şeması.
  </Card>
  <Card title="Güvenlik" href="/tr/gateway/security">
    Plugin yüklemeleri için güvenlik sertleştirmesi.
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

Yavaş yükleme, inceleme, kaldırma veya registry yenileme araştırması için
komutu `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ile çalıştırın. İz, aşama sürelerini
stderr’e yazar ve JSON çıktısını ayrıştırılabilir tutar. Bkz. [Hata Ayıklama](/tr/help/debugging#plugin-lifecycle-trace).

<Note>
Nix modunda (`OPENCLAW_NIX_MODE=1`), plugin yaşam döngüsü değiştiricileri devre dışıdır. Bu yükleme için `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` veya `plugins disable` yerine Nix kaynağını kullanın; nix-openclaw için agent odaklı [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) bölümünü kullanın.
</Note>

<Note>
Birlikte gelen plugin’ler OpenClaw ile birlikte gönderilir. Bazıları varsayılan olarak etkindir (örneğin birlikte gelen model sağlayıcıları, birlikte gelen konuşma sağlayıcıları ve birlikte gelen tarayıcı plugin’i); diğerleri `plugins enable` gerektirir.

Yerel OpenClaw plugin’leri satır içi JSON Schema (`configSchema`, boş olsa bile) içeren `openclaw.plugin.json` dosyasıyla gönderilmelidir. Uyumlu bundle’lar bunun yerine kendi bundle manifest’lerini kullanır.

`plugins list`, `Format: openclaw` veya `Format: bundle` gösterir. Ayrıntılı liste/bilgi çıktısı ayrıca bundle alt türünü (`codex`, `claude` veya `cursor`) ve algılanan bundle yeteneklerini gösterir.
</Note>

### Yükleme

```bash
openclaw plugins search "calendar"                   # ClawHub plugin’lerinde ara
openclaw plugins install <package>                      # varsayılan olarak npm
openclaw plugins install clawhub:<package>              # yalnızca ClawHub
openclaw plugins install npm:<package>                  # yalnızca npm
openclaw plugins install npm-pack:<path.tgz>            # npm install semantiğiyle yerel npm pack
openclaw plugins install git:github.com/<owner>/<repo>  # git deposu
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # mevcut yüklemenin üzerine yaz
openclaw plugins install <package> --pin                # sürümü sabitle
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # yerel yol
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (açıkça)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Kurulum zamanı yüklemelerini test eden bakımcılar, otomatik plugin yükleme
kaynaklarını korumalı ortam değişkenleriyle geçersiz kılabilir. Bkz.
[Plugin yükleme geçersiz kılmaları](/tr/plugins/install-overrides).

<Warning>
Çıplak paket adları, lansman geçişi sırasında varsayılan olarak npm’den yüklenir. ClawHub için `clawhub:<package>` kullanın. Plugin yüklemelerini kod çalıştırmak gibi değerlendirin. Sabitlenmiş sürümleri tercih edin.
</Warning>

`plugins search`, yüklenebilir plugin paketleri için ClawHub’ı sorgular ve
yüklemeye hazır paket adlarını yazdırır. Skills’leri değil, kod-plugin ve bundle-plugin paketlerini arar. ClawHub Skills’leri için `openclaw skills search` kullanın.

<Note>
ClawHub, çoğu plugin için birincil dağıtım ve keşif yüzeyidir. Npm
desteklenen bir yedek ve doğrudan yükleme yolu olmaya devam eder. OpenClaw’a ait
`@openclaw/*` plugin paketleri yeniden npm’de yayımlanır; güncel listeye
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) veya
[plugin envanteri](/tr/plugins/plugin-inventory) üzerinden bakın. Kararlı yüklemeler `latest` kullanır.
Beta kanalı yüklemeleri ve güncellemeleri, bu etiket kullanılabilir olduğunda npm `beta` dist-tag’ini tercih eder, ardından `latest`’e geri döner.
</Note>

<AccordionGroup>
  <Accordion title="Yapılandırma include’ları ve geçersiz yapılandırma onarımı">
    `plugins` bölümünüz tek dosyalı bir `$include` tarafından destekleniyorsa, `plugins install/update/enable/disable/uninstall` bu eklenen dosyaya yazar ve `openclaw.json` dosyasına dokunmaz. Kök include’lar, include dizileri ve kardeş geçersiz kılmaları olan include’lar düzleştirilmek yerine kapalı şekilde başarısız olur. Desteklenen biçimler için [Yapılandırma include’ları](/tr/gateway/configuration) bölümüne bakın.

    Yükleme sırasında yapılandırma geçersizse, `plugins install` normalde kapalı şekilde başarısız olur ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Gateway başlangıcı ve sıcak yeniden yükleme sırasında, geçersiz plugin yapılandırması diğer tüm geçersiz yapılandırmalar gibi kapalı şekilde başarısız olur; `openclaw doctor --fix` geçersiz plugin girdisini karantinaya alabilir. Belgelenmiş tek yükleme zamanı istisnası, açıkça `openclaw.install.allowInvalidConfigRecovery` seçeneğine katılan plugin’ler için dar kapsamlı bir birlikte gelen plugin kurtarma yoludur.

  </Accordion>
  <Accordion title="--force ve yeniden yükleme ile güncelleme karşılaştırması">
    `--force`, mevcut yükleme hedefini yeniden kullanır ve zaten yüklü olan bir plugin’in veya hook paketinin üzerine yerinde yazar. Aynı kimliği yeni bir yerel yoldan, arşivden, ClawHub paketinden veya npm yapıtından bilinçli olarak yeniden yüklüyorsanız bunu kullanın. Zaten izlenen bir npm plugin’inin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` komutunu tercih edin.

    Zaten yüklü olan bir plugin kimliği için `plugins install` çalıştırırsanız, OpenClaw durur ve normal yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna ya da geçerli yüklemenin üzerine gerçekten farklı bir kaynaktan yazmak istediğinizde `plugins install <package> --force` komutuna yönlendirir.

  </Accordion>
  <Accordion title="--pin kapsamı">
    `--pin` yalnızca npm yüklemelerine uygulanır. `git:` yüklemeleriyle desteklenmez; sabitlenmiş bir kaynak istediğinizde `git:github.com/acme/plugin@v1.2.3` gibi açık bir git ref’i kullanın. `--marketplace` ile desteklenmez, çünkü marketplace yüklemeleri npm spec’i yerine marketplace kaynak meta verilerini kalıcı hale getirir.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısındaki yanlış pozitifler için son çare seçeneğidir. Yerleşik tarayıcı `critical` bulgular bildirdiğinde bile yüklemenin devam etmesine izin verir, ancak plugin `before_install` hook ilke engellerini **atlamaz** ve tarama hatalarını **atlamaz**.

    Bu CLI bayrağı plugin yükleme/güncelleme akışlarına uygulanır. Gateway destekli skill bağımlılık yüklemeleri eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanırken, `openclaw skills install` ayrı bir ClawHub skill indirme/yükleme akışı olarak kalır.

    ClawHub’da yayımladığınız bir plugin registry taraması tarafından engellenirse, [ClawHub](/tr/clawhub/security) bölümündeki yayımlayıcı adımlarını kullanın.

  </Accordion>
  <Accordion title="Hook paketleri ve npm spec’leri">
    `plugins install`, `package.json` içinde `openclaw.hooks` açığa çıkaran hook paketleri için de yükleme yüzeyidir. Paket yüklemesi için değil, filtrelenmiş hook görünürlüğü ve hook başına etkinleştirme için `openclaw hooks` kullanın.

    Npm spec’leri **yalnızca registry** içindir (paket adı + isteğe bağlı **kesin sürüm** veya **dist-tag**). Git/URL/dosya spec’leri ve semver aralıkları reddedilir. Kabuk ortamınızda genel npm yükleme ayarları olsa bile, bağımlılık yüklemeleri güvenlik için proje yerelinde `--ignore-scripts` ile çalışır. Yönetilen plugin npm kökleri OpenClaw’ın paket düzeyi npm `overrides` değerlerini devralır, böylece ana makine güvenlik pin’leri hoist edilmiş plugin bağımlılıklarına da uygulanır.

    npm çözümlemesini açık hale getirmek istediğinizde `npm:<package>` kullanın. Çıplak paket spec’leri de lansman geçişi sırasında doğrudan npm’den yüklenir.

    Çıplak spec’ler ve `@latest` kararlı kanalda kalır. `2026.5.3-1` gibi OpenClaw tarih damgalı düzeltme sürümleri bu kontrol için kararlı sürümlerdir. npm bunlardan herhangi birini ön sürüme çözümlerse, OpenClaw durur ve `@beta`/`@rc` gibi bir ön sürüm etiketiyle veya `@1.2.3-beta.4` gibi kesin bir ön sürümle açıkça katılmanızı ister.

    Çıplak bir yükleme spec’i resmi bir plugin kimliğiyle eşleşirse (örneğin `diffs`), OpenClaw katalog girdisini doğrudan yükler. Aynı ada sahip bir npm paketini yüklemek için açık kapsamlı bir spec kullanın (örneğin `@scope/diffs`).

  </Accordion>
  <Accordion title="Git depoları">
    Bir git deposundan doğrudan yüklemek için `git:<repo>` kullanın. Desteklenen biçimler arasında `git:github.com/owner/repo`, `git:owner/repo`, tam `https://`, `ssh://`, `git://`, `file://` ve `git@host:owner/repo.git` clone URL’leri bulunur. Yüklemeden önce bir dal, etiket veya commit’i check out etmek için `@<ref>` veya `#<ref>` ekleyin.

    Git yüklemeleri geçici bir dizine clone eder, mevcut olduğunda istenen ref’i check out eder, ardından normal plugin dizin yükleyicisini kullanır. Bu, manifest doğrulaması, tehlikeli kod taraması, paket yöneticisi yükleme işi ve yükleme kayıtlarının npm yüklemeleri gibi davrandığı anlamına gelir. Kaydedilen git yüklemeleri, kaynak URL/ref değerinin yanı sıra çözümlenen commit’i de içerir; böylece `openclaw plugins update` daha sonra kaynağı yeniden çözümleyebilir.

    Git’ten yükledikten sonra, gateway yöntemleri ve CLI komutları gibi çalışma zamanı kayıtlarını doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. Plugin `api.registerCli` ile bir CLI kökü kaydettiyse, bu komutu doğrudan OpenClaw kök CLI üzerinden yürütün; örneğin `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arşivler">
    Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Yerel OpenClaw plugin arşivleri, çıkarılan plugin kökünde geçerli bir `openclaw.plugin.json` içermelidir; yalnızca `package.json` içeren arşivler, OpenClaw yükleme kayıtlarını yazmadan önce reddedilir.

    Dosya bir npm-pack tarball’ı olduğunda ve registry yüklemeleri tarafından kullanılan aynı yönetilen npm kökü yükleme yolunu test etmek istediğinizde
    `npm-pack:<path.tgz>` kullanın;
    buna `package-lock.json` doğrulaması, hoist edilmiş bağımlılık taraması ve
    npm yükleme kayıtları dahildir. Düz arşiv yolları ise plugin extensions kökü altında
    yerel arşivler olarak yüklenmeye devam eder.

    Claude marketplace yüklemeleri de desteklenir.

  </Accordion>
</AccordionGroup>

ClawHub yüklemeleri açık bir `clawhub:<package>` konum belirleyicisi kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Çıplak npm güvenli plugin spec’leri, lansman geçişi sırasında varsayılan olarak npm’den yüklenir:

```bash
openclaw plugins install openclaw-codex-app-server
```

Yalnızca npm çözümlemesini açık hale getirmek için `npm:` kullanın:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw, kurulumdan önce duyurulan Plugin API / minimum Gateway uyumluluğunu denetler. Seçilen ClawHub sürümü bir ClawPack yapıtı yayımladığında, OpenClaw sürümlendirilmiş npm-pack `.tgz` dosyasını indirir, ClawHub özet başlığını ve yapıt özetini doğrular, ardından normal arşiv yolu üzerinden kurar. ClawPack meta verisi olmayan eski ClawHub sürümleri, eski paket arşivi doğrulama yolu üzerinden kurulmaya devam eder. Kaydedilen kurulumlar, sonraki güncellemeler için ClawHub kaynak meta verilerini, yapıt türünü, npm bütünlüğünü, npm shasum değerini, tarball adını ve ClawPack özet bilgilerini saklar.
Sürümlendirilmemiş ClawHub kurulumları, `openclaw plugins update` komutunun daha yeni ClawHub sürümlerini izleyebilmesi için sürümlendirilmemiş bir kayıtlı spec tutar; `clawhub:pkg@1.2.3` ve `clawhub:pkg@beta` gibi açık sürüm veya etiket seçicileri bu seçiciye sabitlenmiş kalır.

#### Marketplace kısayolu

Marketplace adı Claude'un `~/.claude/plugins/known_marketplaces.json` konumundaki yerel kayıt defteri önbelleğinde varsa `plugin@marketplace` kısayolunu kullanın:

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
    - `owner/repo` gibi bir GitHub repo kısayolu
    - `https://github.com/owner/repo` gibi bir GitHub repo URL'si
    - bir git URL'si

  </Tab>
  <Tab title="Remote marketplace rules">
    GitHub veya git üzerinden yüklenen uzak marketplace'ler için Plugin girdileri klonlanan marketplace reposunun içinde kalmalıdır. OpenClaw, bu repodan gelen göreli yol kaynaklarını kabul eder ve uzak manifestlerden gelen HTTP(S), mutlak-yol, git, GitHub ve diğer yol olmayan Plugin kaynaklarını reddeder.
  </Tab>
</Tabs>

Yerel yollar ve arşivler için OpenClaw şunları otomatik algılar:

- yerel OpenClaw Plugin'leri (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya varsayılan Claude bileşen düzeni)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

<Note>
Uyumlu paketler normal Plugin köküne kurulur ve aynı liste/bilgi/etkinleştirme/devre dışı bırakma akışına katılır. Bugün paket Skills'ları, Claude komut-Skills'ları, Claude `settings.json` varsayılanları, Claude `.lsp.json` / manifestte bildirilen `lspServers` varsayılanları, Cursor komut-Skills'ları ve uyumlu Codex hook dizinleri desteklenir; algılanan diğer paket yetenekleri tanılarda/bilgide gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmamıştır.
</Note>

### Listele

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
  Makine tarafından okunabilir envanter ile kayıt defteri tanıları ve paket bağımlılığı kurulum durumu.
</ParamField>

<Note>
`plugins list` önce kalıcı yerel Plugin kayıt defterini okur; kayıt defteri eksik veya geçersiz olduğunda yalnızca manifestten türetilen bir geri dönüş kullanır. Bir Plugin'in kurulu, etkin ve soğuk başlangıç planlamasına görünür olup olmadığını denetlemek için yararlıdır, ancak zaten çalışan bir Gateway işleminin canlı çalışma zamanı yoklaması değildir. Plugin kodunu, etkinleştirmeyi, hook ilkesini veya `plugins.load.paths` değerini değiştirdikten sonra yeni `register(api)` kodunun veya hook'ların çalışmasını beklemeden önce kanala hizmet veren Gateway'i yeniden başlatın. Uzak/konteyner dağıtımları için yalnızca bir sarmalayıcı işlemi değil, gerçek `openclaw gateway run` alt işlemini yeniden başlattığınızı doğrulayın.

`plugins list --json`, her Plugin'in `package.json` içindeki `dependencies` ve `optionalDependencies` değerlerinden gelen `dependencyStatus` alanını içerir. OpenClaw, bu paket adlarının Plugin'in normal Node `node_modules` arama yolu boyunca bulunup bulunmadığını denetler; Plugin çalışma zamanı kodunu içe aktarmaz, paket yöneticisi çalıştırmaz veya eksik bağımlılıkları onarmaz.
</Note>

`plugins search`, uzak bir ClawHub katalog aramasıdır. Yerel durumu incelemez, yapılandırmayı değiştirmez, paket kurmaz veya Plugin çalışma zamanı kodunu yüklemez. Arama sonuçları ClawHub paket adını, aileyi, kanalı, sürümü, özeti ve `openclaw plugins install clawhub:<package>` gibi bir kurulum ipucunu içerir.

Paketlenmiş bir Docker imajının içindeki paketlenmiş Plugin çalışması için Plugin kaynak dizinini `/app/extensions/synology-chat` gibi eşleşen paketlenmiş kaynak yolunun üzerine bind-mount edin. OpenClaw, bu bağlanan kaynak overlay'ini `/app/dist/extensions/synology-chat` öncesinde keşfeder; düz kopyalanmış bir kaynak dizini etkisiz kalır, böylece normal paketlenmiş kurulumlar derlenmiş dist kullanmaya devam eder.

Çalışma zamanı hook hata ayıklaması için:

- `openclaw plugins inspect <id> --runtime --json`, modül yüklemeli bir inceleme geçişinden kayıtlı hook'ları ve tanıları gösterir. Çalışma zamanı incelemesi hiçbir zaman bağımlılık kurmaz; eski bağımlılık durumunu temizlemek veya yapılandırmada başvurulan eksik indirilebilir Plugin'leri kurtarmak için `openclaw doctor --fix` kullanın.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway'i, hizmet/işlem ipuçlarını, yapılandırma yolunu ve RPC sağlığını doğrular.
- Paketlenmemiş konuşma hook'ları (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.

Yerel bir dizini kopyalamaktan kaçınmak için `--link` kullanın (`plugins.load.paths` öğesine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
Bağlantılı kurulumlar yönetilen bir kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullandığından `--force`, `--link` ile desteklenmez.

Varsayılan davranışı sabitlenmemiş tutarken çözümlenen tam spec'i (`name@version`) yönetilen Plugin dizinine kaydetmek için npm kurulumlarında `--pin` kullanın.
</Note>

### Plugin dizini

Plugin kurulum meta verisi kullanıcı yapılandırması değil, makine tarafından yönetilen durumdur. Kurulumlar ve güncellemeler bunu etkin OpenClaw durum dizini altındaki `plugins/installs.json` dosyasına yazar. En üst düzey `installRecords` haritası, bozuk veya eksik Plugin manifestleri için kayıtlar dahil olmak üzere kurulum meta verisinin kalıcı kaynağıdır. `plugins` dizisi, manifestten türetilen soğuk kayıt defteri önbelleğidir. Dosya düzenlememe uyarısı içerir ve `openclaw plugins update`, kaldırma, tanılar ve soğuk Plugin kayıt defteri tarafından kullanılır.

OpenClaw, yapılandırmada gönderilmiş eski `plugins.installs` kayıtlarını gördüğünde, çalışma zamanı okumaları bunları `openclaw.json` dosyasını yeniden yazmadan uyumluluk girdisi olarak ele alır. Açık Plugin yazmaları ve `openclaw doctor --fix`, yapılandırma yazmalarına izin verildiğinde bu kayıtları Plugin dizinine taşır ve yapılandırma anahtarını kaldırır; yazmalardan biri başarısız olursa kurulum meta verisi kaybolmasın diye yapılandırma kayıtları tutulur.

### Kaldır

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, uygulanabildiğinde Plugin kayıtlarını `plugins.entries` öğesinden, kalıcı Plugin dizininden, Plugin izin/verme listesi girdilerinden ve bağlantılı `plugins.load.paths` girdilerinden kaldırır. `--keep-files` ayarlanmadığı sürece kaldırma, OpenClaw'un Plugin uzantıları kökü içindeyse izlenen yönetilen kurulum dizinini de kaldırır. Active Memory Plugin'leri için bellek slotu `memory-core` değerine sıfırlanır.

<Note>
`--keep-config`, `--keep-files` için kullanımdan kaldırılmış bir takma ad olarak desteklenir.
</Note>

### Güncelle

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
    Bir Plugin id'si geçirdiğinizde OpenClaw, o Plugin için kaydedilmiş kurulum spec'ini yeniden kullanır. Bu, `@beta` gibi daha önce depolanan dist-tag'lerin ve tam sabitlenmiş sürümlerin sonraki `update <id>` çalıştırmalarında kullanılmaya devam edeceği anlamına gelir.

    npm kurulumları için, dist-tag veya tam sürüm içeren açık bir npm paket spec'i de geçirebilirsiniz. OpenClaw, bu paket adını izlenen Plugin kaydına geri çözümler, kurulu Plugin'i günceller ve gelecekteki id tabanlı güncellemeler için yeni npm spec'ini kaydeder.

    npm paket adını sürüm veya etiket olmadan geçirmek de izlenen Plugin kaydına geri çözümlenir. Bir Plugin tam bir sürüme sabitlendiğinde ve onu kayıt defterinin varsayılan yayın hattına geri taşımak istediğinizde bunu kullanın.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update`, yeni bir spec geçirmediğiniz sürece izlenen Plugin spec'ini yeniden kullanır. `openclaw update` ayrıca etkin OpenClaw güncelleme kanalını bilir: beta kanalında, varsayılan hat npm ve ClawHub Plugin kayıtları önce `@beta` değerini dener, ardından Plugin beta sürümü yoksa kaydedilmiş varsayılan/latest spec'e geri döner. Bu geri dönüş uyarı olarak bildirilir ve çekirdek güncellemeyi başarısız yapmaz. Tam sürümler ve açık etiketler o seçiciye sabitlenmiş kalır.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Canlı bir npm güncellemesinden önce OpenClaw, kurulu paket sürümünü npm kayıt defteri meta verileriyle denetler. Kurulu sürüm ve kaydedilmiş yapıt kimliği çözümlenen hedefle zaten eşleşiyorsa güncelleme indirme, yeniden kurma veya `openclaw.json` yeniden yazma yapmadan atlanır.

    Depolanmış bir bütünlük karması varsa ve getirilen yapıt karması değişirse OpenClaw bunu npm yapıt sapması olarak ele alır. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek karmaları yazdırır ve devam etmeden önce onay ister. Etkileşimsiz güncelleme yardımcıları, çağıran açık bir devam ilkesi sağlamadıkça kapalı başarısız olur.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install`, Plugin güncellemeleri sırasında yerleşik tehlikeli-kod taraması yanlış pozitifleri için son çare geçersiz kılması olarak `plugins update` üzerinde de kullanılabilir. Yine de Plugin `before_install` ilke engellerini veya tarama-başarısızlığı engellemesini atlamaz ve yalnızca Plugin güncellemelerine uygulanır, hook-pack güncellemelerine uygulanmaz.
  </Accordion>
</AccordionGroup>

### İncele

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect, varsayılan olarak Plugin çalışma zamanını içe aktarmadan kimliği, yükleme durumunu, kaynağı, manifest yeteneklerini, ilke bayraklarını, tanıları, kurulum meta verilerini, paket yeteneklerini ve algılanan MCP veya LSP sunucu desteğini gösterir. Plugin modülünü yüklemek ve kayıtlı hook'ları, araçları, komutları, hizmetleri, Gateway yöntemlerini ve HTTP rotalarını dahil etmek için `--runtime` ekleyin. Çalışma zamanı incelemesi eksik Plugin bağımlılıklarını doğrudan bildirir; kurulumlar ve onarımlar `openclaw plugins install`, `openclaw plugins update` ve `openclaw doctor --fix` içinde kalır.

Plugin'e ait CLI komutları genellikle kök `openclaw` komut grupları olarak kurulur, ancak Plugin'ler `openclaw nodes` gibi bir çekirdek üst öğenin altında iç içe komutlar da kaydedebilir. `inspect --runtime`, `cliCommands` altında bir komut gösterdikten sonra bunu listelenen yolda çalıştırın; örneğin `demo-git` kaydeden bir Plugin, `openclaw demo-git ping` ile doğrulanabilir.

Her Plugin, çalışma zamanında gerçekte kaydettiklerine göre sınıflandırılır:

- **düz-yetenek** — tek bir yetenek türü (örn. yalnızca sağlayıcı olan bir plugin)
- **karma-yetenek** — birden fazla yetenek türü (örn. metin + konuşma + görseller)
- **yalnızca-kanca** — yalnızca kancalar, yetenek veya yüzey yok
- **yeteneksiz** — araçlar/komutlar/hizmetler var ancak yetenek yok

Yetenek modeli hakkında daha fazla bilgi için [Plugin şekilleri](/tr/plugins/architecture#plugin-shapes) bölümüne bakın.

<Note>
`--json` bayrağı, betik oluşturma ve denetim için uygun, makine tarafından okunabilir bir rapor üretir. `inspect --all`, şekil, yetenek türleri, uyumluluk bildirimleri, paket yetenekleri ve kanca özeti sütunları içeren filo genelinde bir tablo işler. `info`, `inspect` için bir takma addır.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, Plugin yükleme hatalarını, bildirim/keşif tanılamalarını ve uyumluluk bildirimlerini raporlar. Her şey temiz olduğunda `No plugin issues detected.` yazdırır.

Yapılandırılmış bir plugin diskte mevcutsa ancak yükleyicinin yol güvenliği denetimleri tarafından engelleniyorsa, yapılandırma doğrulaması plugin girdisini korur ve bunu `present but blocked` olarak raporlar. `plugins.entries.<id>` veya `plugins.allow` yapılandırmasını kaldırmak yerine, yol sahipliği ya da herkes tarafından yazılabilir izinler gibi önceki engellenmiş-plugin tanılamasını düzeltin.

Eksik `register`/`activate` dışa aktarımları gibi modül şekli hataları için, tanılama çıktısına kompakt bir dışa aktarım şekli özeti eklemek üzere `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Kayıt Defteri

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Yerel plugin kayıt defteri, OpenClaw’un yüklü plugin kimliği, etkinleştirme, kaynak meta verileri ve katkı sahipliği için kalıcı soğuk okuma modelidir. Normal başlangıç, sağlayıcı sahibi araması, kanal kurulumu sınıflandırması ve plugin envanteri, plugin çalışma zamanı modüllerini içe aktarmadan bunu okuyabilir.

Kalıcı kayıt defterinin mevcut, güncel veya eski olup olmadığını incelemek için `plugins registry` kullanın. Kalıcı plugin dizini, yapılandırma politikası ve bildirim/paket meta verilerinden yeniden oluşturmak için `--refresh` kullanın. Bu bir onarım yoludur, çalışma zamanı etkinleştirme yolu değildir.

`openclaw doctor --fix`, kayıt defterine bitişik yönetilen npm sapmalarını da onarır: yönetilen plugin npm kökü altında artık kalmış veya kurtarılmış bir `@openclaw/*` paketi paketlenmiş bir plugini gölgelerse, doctor bu eski paketi kaldırır ve başlangıcın paketlenmiş bildirime göre doğrulanması için kayıt defterini yeniden oluşturur.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`, kayıt defteri okuma hataları için kullanımdan kaldırılmış bir acil durum uyumluluk anahtarıdır. `plugins registry --refresh` veya `openclaw doctor --fix` tercih edin; ortam geri dönüşü yalnızca geçiş yayılırken acil başlangıç kurtarması içindir.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list, yerel bir marketplace yolu, bir `marketplace.json` yolu, `owner/repo` gibi bir GitHub kısaltması, bir GitHub depo URL’si veya bir git URL’si kabul eder. `--json`, çözümlenen kaynak etiketini, ayrıştırılmış marketplace bildirimi ve plugin girdileriyle birlikte yazdırır.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [CLI başvurusu](/tr/cli)
- [ClawHub](/tr/clawhub)
