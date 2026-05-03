---
read_when:
    - Gateway Plugin'lerini veya uyumlu paketleri yüklemek ya da yönetmek istiyorsunuz
    - Plugin yükleme hatalarını ayıklamak istiyorsunuz
sidebarTitle: Plugins
summary: '`openclaw plugins` için CLI başvurusu (list, install, marketplace, uninstall, enable/disable, doctor)'
title: Pluginler
x-i18n:
    generated_at: "2026-05-03T21:29:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: d854d052b0a012a86f9c775775676a9a8fe8ae86b2c38a18118f1abf0732174c
    source_path: cli/plugins.md
    workflow: 16
---

Plugin'leri, hook paketlerini ve uyumlu bundle'ları yönetin.

<CardGroup cols={2}>
  <Card title="Plugin sistemi" href="/tr/tools/plugin">
    Plugin'leri yükleme, etkinleştirme ve sorun giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Plugin'leri yönet" href="/tr/plugins/manage-plugins">
    Yükleme, listeleme, güncelleme, kaldırma ve yayınlama için hızlı örnekler.
  </Card>
  <Card title="Plugin bundle'ları" href="/tr/plugins/bundles">
    Bundle uyumluluk modeli.
  </Card>
  <Card title="Plugin manifest'i" href="/tr/plugins/manifest">
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

Yavaş yükleme, inceleme, kaldırma veya kayıt defteri yenileme incelemesi için
komutu `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ile çalıştırın. İz, aşama zamanlamalarını
stderr'e yazar ve JSON çıktısının ayrıştırılabilir kalmasını sağlar. Bkz. [Hata ayıklama](/tr/help/debugging#plugin-lifecycle-trace).

<Note>
Bundle olarak gelen plugin'ler OpenClaw ile birlikte gönderilir. Bazıları varsayılan olarak etkindir (örneğin bundle olarak gelen model sağlayıcıları, bundle olarak gelen konuşma sağlayıcıları ve bundle olarak gelen tarayıcı Plugin'i); diğerleri `plugins enable` gerektirir.

Yerel OpenClaw plugin'leri satır içi JSON Schema (`configSchema`, boş olsa bile) içeren `openclaw.plugin.json` dosyasını göndermelidir. Uyumlu bundle'lar bunun yerine kendi bundle manifest'lerini kullanır.

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
Düz paket adları, geçiş lansmanı sırasında varsayılan olarak npm'den yüklenir. ClawHub için `clawhub:<package>` kullanın. Plugin yüklemelerini kod çalıştırmak gibi değerlendirin. Sabitlenmiş sürümleri tercih edin.
</Warning>

`plugins search`, yüklenebilir Plugin paketleri için ClawHub'ı sorgular ve
yüklemeye hazır paket adlarını yazdırır. Skills'leri değil, code-plugin ve bundle-plugin paketlerini arar. ClawHub Skills'leri için `openclaw skills search` kullanın.

<Note>
ClawHub, çoğu Plugin için birincil dağıtım ve keşif yüzeyidir. Npm
desteklenen bir geri dönüş ve doğrudan yükleme yolu olmaya devam eder. OpenClaw'a ait
`@openclaw/*` Plugin paketleri yeniden npm'de yayınlanmaktadır; güncel listeye
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) veya
[Plugin envanteri](/tr/plugins/plugin-inventory) üzerinden bakın. Kararlı yüklemeler `latest` kullanır.
Beta kanalı yüklemeleri ve güncellemeleri, bu etiket mevcut olduğunda npm `beta` dist-tag'ini
tercih eder, ardından `latest` değerine geri döner.
</Note>

<AccordionGroup>
  <Accordion title="Yapılandırma include'ları ve geçersiz yapılandırma onarımı">
    `plugins` bölümünüz tek dosyalı bir `$include` ile destekleniyorsa, `plugins install/update/enable/disable/uninstall` bu dahil edilen dosyaya yazar ve `openclaw.json` dosyasına dokunmaz. Kök include'ları, include dizileri ve kardeş geçersiz kılmaları olan include'lar düzleştirilmek yerine kapalı başarısız olur. Desteklenen biçimler için bkz. [Yapılandırma include'ları](/tr/gateway/configuration).

    Yükleme sırasında yapılandırma geçersizse, `plugins install` normalde kapalı başarısız olur ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Gateway başlatma ve hot reload sırasında geçersiz Plugin yapılandırması diğer geçersiz yapılandırmalar gibi kapalı başarısız olur; `openclaw doctor --fix` geçersiz Plugin girişini karantinaya alabilir. Belgelenmiş tek yükleme zamanı istisnası, açıkça `openclaw.install.allowInvalidConfigRecovery` seçeneğine katılan Plugin'ler için dar kapsamlı bundle Plugin kurtarma yoludur.

  </Accordion>
  <Accordion title="--force ve yeniden yükleme ile güncelleme karşılaştırması">
    `--force`, mevcut yükleme hedefini yeniden kullanır ve zaten yüklenmiş bir Plugin'i veya hook paketini yerinde üzerine yazar. Aynı id'yi yeni bir yerel yoldan, arşivden, ClawHub paketinden veya npm yapıtından bilerek yeniden yüklüyorsanız bunu kullanın. Zaten izlenen bir npm Plugin'inin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` tercih edin.

    Zaten yüklü olan bir Plugin id'si için `plugins install` çalıştırırsanız, OpenClaw durur ve normal yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna, mevcut yüklemeyi gerçekten farklı bir kaynaktan üzerine yazmak istediğinizde ise `plugins install <package> --force` komutuna yönlendirir.

  </Accordion>
  <Accordion title="--pin kapsamı">
    `--pin` yalnızca npm yüklemeleri için geçerlidir. `git:` yüklemeleriyle desteklenmez; sabitlenmiş bir kaynak istediğinizde `git:github.com/acme/plugin@v1.2.3` gibi açık bir git ref'i kullanın. `--marketplace` ile desteklenmez, çünkü marketplace yüklemeleri npm spec'i yerine marketplace kaynak meta verilerini kalıcılaştırır.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısındaki yanlış pozitifler için bir acil durum seçeneğidir. Yerleşik tarayıcı `critical` bulguları bildirdiğinde bile yüklemenin devam etmesine izin verir, ancak Plugin `before_install` hook ilke engellerini **atlamaz** ve tarama hatalarını **atlamaz**.

    Bu CLI bayrağı Plugin yükleme/güncelleme akışları için geçerlidir. Gateway destekli Skill bağımlılık yüklemeleri eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanırken, `openclaw skills install` ayrı bir ClawHub Skill indirme/yükleme akışı olarak kalır.

    ClawHub'da yayınladığınız bir Plugin kayıt defteri taraması tarafından engellenirse, [ClawHub](/tr/tools/clawhub) içindeki yayıncı adımlarını kullanın.

  </Accordion>
  <Accordion title="Hook paketleri ve npm spec'leri">
    `plugins install`, `package.json` içinde `openclaw.hooks` sunan hook paketleri için de yükleme yüzeyidir. Paket yüklemesi için değil, filtrelenmiş hook görünürlüğü ve hook başına etkinleştirme için `openclaw hooks` kullanın.

    Npm spec'leri **yalnızca kayıt defteri** içindir (paket adı + isteğe bağlı **tam sürüm** veya **dist-tag**). Git/URL/dosya spec'leri ve semver aralıkları reddedilir. Kabuk ortamınızda genel npm yükleme ayarları olsa bile bağımlılık yüklemeleri güvenlik için `--ignore-scripts` ile proje yerelinde çalışır.

    npm çözümlemesini açık hale getirmek istediğinizde `npm:<package>` kullanın. Düz paket spec'leri de geçiş lansmanı sırasında doğrudan npm'den yüklenir.

    Düz spec'ler ve `@latest` kararlı kanalda kalır. npm bunlardan herhangi birini bir ön sürüme çözümlerse, OpenClaw durur ve `@beta`/`@rc` gibi bir ön sürüm etiketiyle veya `@1.2.3-beta.4` gibi tam bir ön sürümle açıkça katılmanızı ister.

    Düz bir yükleme spec'i resmi bir Plugin id'siyle eşleşirse (örneğin `diffs`), OpenClaw katalog girişini doğrudan yükler. Aynı ada sahip bir npm paketini yüklemek için açık kapsamlı bir spec kullanın (örneğin `@scope/diffs`).

  </Accordion>
  <Accordion title="Git depoları">
    Doğrudan bir git deposundan yüklemek için `git:<repo>` kullanın. Desteklenen biçimler arasında `git:github.com/owner/repo`, `git:owner/repo`, tam `https://`, `ssh://`, `git://`, `file://` ve `git@host:owner/repo.git` klon URL'leri bulunur. Yüklemeden önce bir branch, tag veya commit'i check out etmek için `@<ref>` veya `#<ref>` ekleyin.

    Git yüklemeleri geçici bir dizine klonlar, varsa istenen ref'i check out eder, ardından normal Plugin dizini yükleyicisini kullanır. Bu, manifest doğrulamasının, tehlikeli kod taramasının, paket yöneticisi yükleme işinin ve yükleme kayıtlarının npm yüklemeleri gibi davrandığı anlamına gelir. Kaydedilen git yüklemeleri, kaynak URL/ref bilgisinin yanı sıra çözümlenen commit'i de içerir; böylece `openclaw plugins update` daha sonra kaynağı yeniden çözümleyebilir.

    Git'ten yükledikten sonra, gateway yöntemleri ve CLI komutları gibi çalışma zamanı kayıtlarını doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. Plugin `api.registerCli` ile bir CLI kökü kaydettiyse, bu komutu doğrudan OpenClaw kök CLI'si üzerinden çalıştırın, örneğin `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arşivler">
    Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Yerel OpenClaw Plugin arşivleri, çıkarılan Plugin kökünde geçerli bir `openclaw.plugin.json` içermelidir; yalnızca `package.json` içeren arşivler, OpenClaw yükleme kayıtlarını yazmadan önce reddedilir.

    Claude marketplace yüklemeleri de desteklenir.

  </Accordion>
</AccordionGroup>

ClawHub yüklemeleri açık bir `clawhub:<package>` konumlayıcısı kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Düz npm güvenli Plugin spec'leri, geçiş lansmanı sırasında varsayılan olarak npm'den yüklenir:

```bash
openclaw plugins install openclaw-codex-app-server
```

Yalnızca npm çözümlemesini açık hale getirmek için `npm:` kullanın:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw, yüklemeden önce duyurulan Plugin API / minimum gateway uyumluluğunu denetler. Seçilen ClawHub sürümü bir ClawPack yapıtı yayınladığında, OpenClaw sürümlü npm-pack `.tgz` dosyasını indirir, ClawHub digest üst bilgisini ve yapıt digest'ini doğrular, ardından normal arşiv yolu üzerinden yükler. ClawPack meta verisi olmayan eski ClawHub sürümleri, legacy paket arşivi doğrulama yolu üzerinden yüklenmeye devam eder. Kaydedilen yüklemeler, daha sonraki güncellemeler için ClawHub kaynak meta verilerini, yapıt türünü, npm bütünlüğünü, npm shasum değerini, tarball adını ve ClawPack digest bilgilerini saklar.
Sürümsüz ClawHub yüklemeleri, `openclaw plugins update` komutunun daha yeni ClawHub sürümlerini takip edebilmesi için sürümsüz bir kayıtlı spec tutar; `clawhub:pkg@1.2.3` ve `clawhub:pkg@beta` gibi açık sürüm veya tag seçicileri o seçiciye sabitlenmiş kalır.

#### Marketplace kısaltması

Marketplace adı Claude'un `~/.claude/plugins/known_marketplaces.json` konumundaki yerel kayıt defteri önbelleğinde mevcut olduğunda `plugin@marketplace` kısaltmasını kullanın:

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
    - `~/.claude/plugins/known_marketplaces.json` içinden Claude tarafından bilinen bir marketplace adı
    - yerel bir marketplace kökü veya `marketplace.json` yolu
    - `owner/repo` gibi bir GitHub repo kısaltması
    - `https://github.com/owner/repo` gibi bir GitHub repo URL'si
    - bir git URL'si

  </Tab>
  <Tab title="Remote marketplace rules">
    GitHub veya git üzerinden yüklenen uzak marketplace'ler için Plugin girdileri klonlanan marketplace reposunun içinde kalmalıdır. OpenClaw, bu repodan göreli yol kaynaklarını kabul eder ve uzak manifestlerden HTTP(S), mutlak yol, git, GitHub ve diğer yol olmayan Plugin kaynaklarını reddeder.
  </Tab>
</Tabs>

Yerel yollar ve arşivler için OpenClaw şunları otomatik algılar:

- yerel OpenClaw plugin'leri (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya varsayılan Claude bileşen düzeni)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

<Note>
Uyumlu paketler normal Plugin köküne kurulur ve aynı liste/bilgi/etkinleştirme/devre dışı bırakma akışına katılır. Bugün paket Skills, Claude komut-Skills'leri, Claude `settings.json` varsayılanları, Claude `.lsp.json` / manifestte bildirilen `lspServers` varsayılanları, Cursor komut-Skills'leri ve uyumlu Codex hook dizinleri desteklenir; algılanan diğer paket yetenekleri tanılarda/bilgide gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmamıştır.
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
  Yalnızca etkinleştirilmiş plugin'leri göster.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Tablo görünümünden kaynak/köken/sürüm/etkinleştirme meta verileriyle Plugin başına ayrıntı satırlarına geç.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir envanter ile kayıt tanıları ve paket bağımlılığı kurulum durumu.
</ParamField>

<Note>
`plugins list` önce kalıcı yerel Plugin kaydını okur; kayıt eksik veya geçersizse yalnızca manifestten türetilen bir geri dönüş kullanır. Bir Plugin'in kurulu, etkin ve soğuk başlangıç planlamasında görünür olup olmadığını denetlemek için kullanışlıdır, ancak zaten çalışan bir Gateway işleminin canlı çalışma zamanı yoklaması değildir. Plugin kodunu, etkinleştirmeyi, hook ilkesini veya `plugins.load.paths` değerini değiştirdikten sonra yeni `register(api)` kodunun veya hook'ların çalışmasını beklemeden önce kanala hizmet veren Gateway'i yeniden başlatın. Uzak/konteyner dağıtımları için yalnızca bir sarmalayıcı işlemi değil, gerçek `openclaw gateway run` alt işlemini yeniden başlattığınızı doğrulayın.

`plugins list --json`, her Plugin'in `package.json` `dependencies` ve `optionalDependencies` alanlarından gelen `dependencyStatus` değerini içerir. OpenClaw, bu paket adlarının Plugin'in normal Node `node_modules` arama yolunda bulunup bulunmadığını denetler; Plugin çalışma zamanı kodunu içe aktarmaz, bir paket yöneticisi çalıştırmaz veya eksik bağımlılıkları onarmaz.
</Note>

`plugins search`, uzak ClawHub katalog aramasıdır. Yerel durumu incelemez, yapılandırmayı değiştirmez, paket kurmaz veya Plugin çalışma zamanı kodu yüklemez. Arama sonuçları ClawHub paket adını, ailesini, kanalını, sürümünü, özetini ve `openclaw plugins install clawhub:<package>` gibi bir kurulum ipucunu içerir.

Paketlenmiş Docker imajı içinde paketlenmiş Plugin çalışmaları için Plugin kaynak dizinini `/app/extensions/synology-chat` gibi eşleşen paketlenmiş kaynak yolunun üzerine bind-mount edin. OpenClaw, bu mount edilmiş kaynak katmanını `/app/dist/extensions/synology-chat` öncesinde keşfeder; düz kopyalanmış bir kaynak dizini etkisiz kalır, böylece normal paketlenmiş kurulumlar hâlâ derlenmiş dist'i kullanır.

Çalışma zamanı hook hata ayıklaması için:

- `openclaw plugins inspect <id> --runtime --json`, modül yüklemeli bir inceleme geçişinden kayıtlı hook'ları ve tanıları gösterir. Çalışma zamanı incelemesi hiçbir zaman bağımlılık kurmaz; eski bağımlılık durumunu temizlemek veya eksik yapılandırılmış indirilebilir plugin'leri kurmak için `openclaw doctor --fix` kullanın.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway'i, hizmet/işlem ipuçlarını, yapılandırma yolunu ve RPC sağlığını doğrular.
- Paketlenmemiş konuşma hook'ları (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.

Yerel bir dizini kopyalamaktan kaçınmak için `--link` kullanın (`plugins.load.paths` alanına ekler):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
Bağlantılı kurulumlar yönetilen bir kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullandığından `--force`, `--link` ile desteklenmez.

npm kurulumlarında, varsayılan davranışı sabitlenmemiş halde tutarken çözümlenen kesin belirtimi (`name@version`) yönetilen Plugin dizinine kaydetmek için `--pin` kullanın.
</Note>

### Plugin dizini

Plugin kurulum meta verileri kullanıcı yapılandırması değil, makine tarafından yönetilen durumdur. Kurulumlar ve güncellemeler bunu etkin OpenClaw durum dizini altında `plugins/installs.json` dosyasına yazar. Üst düzey `installRecords` haritası, bozuk veya eksik Plugin manifestleri için kayıtlar dahil olmak üzere kurulum meta verilerinin kalıcı kaynağıdır. `plugins` dizisi manifestten türetilen soğuk kayıt önbelleğidir. Dosya düzenlemeyin uyarısı içerir ve `openclaw plugins update`, kaldırma, tanılar ve soğuk Plugin kaydı tarafından kullanılır.

OpenClaw yapılandırmada gönderilmiş eski `plugins.installs` kayıtlarını gördüğünde bunları Plugin dizinine taşır ve yapılandırma anahtarını kaldırır; yazma işlemlerinden biri başarısız olursa kurulum meta verileri kaybolmasın diye yapılandırma kayıtları korunur.

### Kaldır

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, uygulanabiliyorsa Plugin kayıtlarını `plugins.entries`, kalıcı Plugin dizini, Plugin izin/engelleme listesi girdileri ve bağlantılı `plugins.load.paths` girdilerinden kaldırır. `--keep-files` ayarlanmadığı sürece kaldırma, OpenClaw'ın Plugin extensions kökü içindeyse izlenen yönetilen kurulum dizinini de kaldırır. Active Memory plugin'leri için bellek yuvası `memory-core` değerine sıfırlanır.

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

Güncellemeler, yönetilen Plugin dizinindeki izlenen Plugin kurulumlarına ve `hooks.internal.installs` içindeki izlenen hook paketi kurulumlarına uygulanır.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Bir Plugin id'si verdiğinizde OpenClaw, o Plugin için kaydedilmiş kurulum belirtimini yeniden kullanır. Bu, `@beta` gibi önceden saklanmış dist-tag'lerin ve kesin sabitlenmiş sürümlerin daha sonraki `update <id>` çalıştırmalarında kullanılmaya devam edeceği anlamına gelir.

    npm kurulumları için dist-tag veya kesin sürüm içeren açık bir npm paket belirtimi de verebilirsiniz. OpenClaw bu paket adını izlenen Plugin kaydına geri çözümler, kurulu Plugin'i günceller ve gelecekteki id tabanlı güncellemeler için yeni npm belirtimini kaydeder.

    npm paket adını sürüm veya etiket olmadan vermek de izlenen Plugin kaydına geri çözümlenir. Bir Plugin kesin bir sürüme sabitlenmişse ve onu kaydın varsayılan yayın hattına geri taşımak istiyorsanız bunu kullanın.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update`, yeni bir belirtim vermediğiniz sürece izlenen Plugin belirtimini yeniden kullanır. `openclaw update` ayrıca etkin OpenClaw güncelleme kanalını bilir: beta kanalında, varsayılan hat npm ve ClawHub Plugin kayıtları önce `@beta` dener, ardından Plugin beta sürümü yoksa kaydedilmiş varsayılan/latest belirtimine geri döner. Kesin sürümler ve açık etiketler bu seçiciye sabitlenmiş kalır.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Canlı bir npm güncellemesinden önce OpenClaw, kurulu paket sürümünü npm kayıt meta verilerine göre denetler. Kurulu sürüm ve kaydedilmiş yapıt kimliği çözümlenen hedefle zaten eşleşiyorsa güncelleme indirme, yeniden kurma veya `openclaw.json` yeniden yazma olmadan atlanır.

    Saklanan bir bütünlük hash'i varsa ve getirilen yapıt hash'i değişirse OpenClaw bunu npm yapıt sapması olarak ele alır. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek hash'leri yazdırır ve devam etmeden önce onay ister. Etkileşimli olmayan güncelleme yardımcıları, çağıran açık bir devam ilkesi sağlamadığı sürece güvenli şekilde başarısız olur.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install`, Plugin güncellemeleri sırasında yerleşik tehlikeli kod taraması yanlış pozitifleri için bir acil durum geçersiz kılması olarak `plugins update` üzerinde de kullanılabilir. Yine de Plugin `before_install` ilke bloklarını veya tarama hatası engellemesini atlatmaz ve hook paketi güncellemelerine değil yalnızca Plugin güncellemelerine uygulanır.
  </Accordion>
</AccordionGroup>

### İncele

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect, varsayılan olarak Plugin çalışma zamanını içe aktarmadan kimliği, yükleme durumunu, kaynağı, manifest yeteneklerini, ilke bayraklarını, tanıları, kurulum meta verilerini, paket yeteneklerini ve algılanan MCP veya LSP sunucusu desteğini gösterir. Plugin modülünü yüklemek ve kayıtlı hook'ları, araçları, komutları, hizmetleri, Gateway yöntemlerini ve HTTP rotalarını dahil etmek için `--runtime` ekleyin. Çalışma zamanı incelemesi eksik Plugin bağımlılıklarını doğrudan bildirir; kurulumlar ve onarımlar `openclaw plugins install`, `openclaw plugins update` ve `openclaw doctor --fix` içinde kalır.

Plugin'e ait CLI komutları kök `openclaw` komut grupları olarak kurulur. `inspect --runtime`, `cliCommands` altında bir komut gösterdikten sonra onu `openclaw <command> ...` olarak çalıştırın; örneğin `demo-git` kaydeden bir Plugin, `openclaw demo-git ping` ile doğrulanabilir.

Her Plugin, çalışma zamanında gerçekten kaydettiği şeye göre sınıflandırılır:

- **plain-capability** — tek yetenek türü (ör. yalnızca sağlayıcı Plugin'i)
- **hybrid-capability** — birden çok yetenek türü (ör. metin + konuşma + görüntüler)
- **hook-only** — yalnızca hook'lar, yetenek veya yüzey yok
- **non-capability** — araçlar/komutlar/hizmetler var ama yetenek yok

Yetenek modeli hakkında daha fazlası için [Plugin şekilleri](/tr/plugins/architecture#plugin-shapes) bölümüne bakın.

<Note>
`--json` bayrağı, betikleme ve denetim için uygun makine tarafından okunabilir bir rapor çıktılar. `inspect --all`, şekil, yetenek türleri, uyumluluk bildirimleri, paket yetenekleri ve hook özeti sütunlarıyla filo genelinde bir tablo oluşturur. `info`, `inspect` için bir takma addır.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, Plugin yükleme hatalarını, manifest/keşif tanılarını ve uyumluluk bildirimlerini bildirir. Her şey temiz olduğunda `No plugin issues detected.` yazdırır.

Yapılandırılmış bir Plugin diskte varsa ancak yükleyicinin yol güvenliği denetimleri tarafından engelleniyorsa yapılandırma doğrulaması Plugin girdisini korur ve `present but blocked` olarak bildirir. `plugins.entries.<id>` veya `plugins.allow` yapılandırmasını kaldırmak yerine yol sahipliği ya da herkes tarafından yazılabilir izinler gibi önceki engellenmiş-Plugin tanısını düzeltin.

Eksik `register`/`activate` dışa aktarımları gibi modül şekli hataları için tanı çıktısına kompakt bir dışa aktarım şekli özeti eklemek üzere `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Kayıt

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Yerel Plugin kaydı, kurulu Plugin kimliği, etkinleştirme, kaynak meta verileri ve katkı sahipliği için OpenClaw'ın kalıcı soğuk okuma modelidir. Normal başlangıç, sağlayıcı sahibi araması, kanal kurulum sınıflandırması ve Plugin envanteri, Plugin çalışma zamanı modüllerini içe aktarmadan bunu okuyabilir.

Kalıcı kayıt defterinin mevcut, güncel veya eski olup olmadığını incelemek için `plugins registry` kullanın. Kalıcı Plugin dizini, yapılandırma ilkesi ve manifest/package meta verilerinden yeniden oluşturmak için `--refresh` kullanın. Bu bir onarım yoludur, çalışma zamanı etkinleştirme yolu değildir.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`, kayıt defteri okuma hataları için kullanımdan kaldırılmış bir acil durum uyumluluk anahtarıdır. `plugins registry --refresh` veya `openclaw doctor --fix` tercih edin; env geri dönüşü, geçiş kullanıma alınırken yalnızca acil başlangıç kurtarması içindir.
</Warning>

### Pazar Yeri

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Pazar yeri listesi yerel bir pazar yeri yolunu, bir `marketplace.json` yolunu, `owner/repo` gibi bir GitHub kısaltmasını, bir GitHub repo URL'sini veya bir git URL'sini kabul eder. `--json`, çözümlenen kaynak etiketini, ayrıştırılmış pazar yeri manifestini ve Plugin girdilerini yazdırır.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [CLI referansı](/tr/cli)
- [Topluluk Plugin'leri](/tr/plugins/community)
