---
read_when:
    - Gateway Plugin'lerini veya uyumlu paketleri yüklemek ya da yönetmek istiyorsunuz
    - Plugin yükleme hatalarında hata ayıklamak istiyorsunuz
sidebarTitle: Plugins
summary: '`openclaw plugins` için CLI başvurusu (list, install, marketplace, uninstall, enable/disable, doctor)'
title: Plugin'ler
x-i18n:
    generated_at: "2026-05-04T07:03:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36ae7edb12986ead7e126f25e0761bf312b2644b35017181b674082105886776
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Pluginlerini, hook paketlerini ve uyumlu paketleri yönetin.

<CardGroup cols={2}>
  <Card title="Plugin sistemi" href="/tr/tools/plugin">
    Pluginleri yükleme, etkinleştirme ve sorun giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Pluginleri yönet" href="/tr/plugins/manage-plugins">
    Yükleme, listeleme, güncelleme, kaldırma ve yayımlama için hızlı örnekler.
  </Card>
  <Card title="Plugin paketleri" href="/tr/plugins/bundles">
    Paket uyumluluk modeli.
  </Card>
  <Card title="Plugin manifestosu" href="/tr/plugins/manifest">
    Manifesto alanları ve yapılandırma şeması.
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

Yavaş yükleme, inceleme, kaldırma veya kayıt yenileme araştırması için komutu
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ile çalıştırın. İz, aşama sürelerini
stderr'ye yazar ve JSON çıktısının ayrıştırılabilir kalmasını sağlar. Bkz. [Hata Ayıklama](/tr/help/debugging#plugin-lifecycle-trace).

<Note>
Birlikte gelen Pluginler OpenClaw ile gönderilir. Bazıları varsayılan olarak etkindir (örneğin birlikte gelen model sağlayıcıları, birlikte gelen konuşma sağlayıcıları ve birlikte gelen tarayıcı Plugini); diğerleri `plugins enable` gerektirir.

Yerel OpenClaw Pluginleri satır içi JSON Schema (`configSchema`, boş olsa bile) içeren `openclaw.plugin.json` göndermelidir. Uyumlu paketler bunun yerine kendi paket manifestolarını kullanır.

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
Çıplak paket adları, geçiş dönemi sırasında varsayılan olarak npm'den yüklenir. ClawHub için `clawhub:<package>` kullanın. Plugin yüklemelerini kod çalıştırmak gibi değerlendirin. Sabitlenmiş sürümleri tercih edin.
</Warning>

`plugins search`, yüklenebilir Plugin paketleri için ClawHub'ı sorgular ve
yüklemeye hazır paket adlarını yazdırır. Skills değil, kod-Plugin ve paket-Plugin paketlerini arar. ClawHub Skills için `openclaw skills search` kullanın.

<Note>
ClawHub, çoğu Plugin için birincil dağıtım ve keşif yüzeyidir. Npm
desteklenen bir yedek ve doğrudan yükleme yolu olarak kalır. OpenClaw'a ait
`@openclaw/*` Plugin paketleri yeniden npm'de yayımlanır; güncel listeye
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) üzerinden veya
[Plugin envanteri](/tr/plugins/plugin-inventory) üzerinden bakın. Kararlı yüklemeler `latest` kullanır.
Beta kanalı yüklemeleri ve güncellemeleri, bu etiket mevcut olduğunda npm `beta` dist-tag'ini
tercih eder, ardından `latest`'e geri döner.
</Note>

<AccordionGroup>
  <Accordion title="Yapılandırma include'ları ve geçersiz yapılandırma onarımı">
    `plugins` bölümünüz tek dosyalı bir `$include` tarafından destekleniyorsa, `plugins install/update/enable/disable/uninstall` bu dahil edilen dosyaya yazar ve `openclaw.json` dosyasına dokunmaz. Kök include'ları, include dizileri ve kardeş geçersiz kılmalar içeren include'lar düzleştirilmek yerine kapalı başarısız olur. Desteklenen biçimler için [Yapılandırma include'ları](/tr/gateway/configuration) bölümüne bakın.

    Yükleme sırasında yapılandırma geçersizse, `plugins install` normalde kapalı başarısız olur ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Gateway başlatma ve sıcak yeniden yükleme sırasında, geçersiz Plugin yapılandırması diğer geçersiz yapılandırmalar gibi kapalı başarısız olur; `openclaw doctor --fix` geçersiz Plugin girdisini karantinaya alabilir. Belgelenmiş tek yükleme zamanı istisnası, açıkça `openclaw.install.allowInvalidConfigRecovery` seçeneğine dahil olan Pluginler için dar kapsamlı bir birlikte gelen Plugin kurtarma yoludur.

  </Accordion>
  <Accordion title="--force ve yeniden yükleme ile güncelleme farkı">
    `--force`, mevcut yükleme hedefini yeniden kullanır ve zaten yüklü olan bir Plugini veya hook paketini yerinde üzerine yazar. Aynı kimliği yeni bir yerel yoldan, arşivden, ClawHub paketinden veya npm artefaktından bilinçli olarak yeniden yüklediğinizde kullanın. Zaten izlenen bir npm Plugininin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` tercih edin.

    Zaten yüklü olan bir Plugin kimliği için `plugins install` çalıştırırsanız, OpenClaw durur ve normal yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna, geçerli yüklemeyi farklı bir kaynaktan gerçekten üzerine yazmak istediğinizde ise `plugins install <package> --force` komutuna yönlendirir.

  </Accordion>
  <Accordion title="--pin kapsamı">
    `--pin` yalnızca npm yüklemeleri için geçerlidir. `git:` yüklemeleriyle desteklenmez; sabitlenmiş bir kaynak istediğinizde `git:github.com/acme/plugin@v1.2.3` gibi açık bir git ref kullanın. `--marketplace` ile desteklenmez, çünkü marketplace yüklemeleri npm spec yerine marketplace kaynak meta verilerini kalıcı hale getirir.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısındaki yanlış pozitifler için acil durum seçeneğidir. Yerleşik tarayıcı `critical` bulgular bildirse bile yüklemenin devam etmesini sağlar, ancak Plugin `before_install` hook ilke engellerini **atlamaz** ve tarama hatalarını **atlamaz**.

    Bu CLI bayrağı Plugin yükleme/güncelleme akışları için geçerlidir. Gateway destekli skill bağımlılığı yüklemeleri eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanırken, `openclaw skills install` ayrı bir ClawHub skill indirme/yükleme akışı olarak kalır.

    ClawHub'da yayımladığınız bir Plugin kayıt taraması tarafından engellenirse, [ClawHub](/tr/tools/clawhub) bölümündeki yayımcı adımlarını kullanın.

  </Accordion>
  <Accordion title="Hook paketleri ve npm spec'leri">
    `plugins install`, `package.json` içinde `openclaw.hooks` sunan hook paketleri için de yükleme yüzeyidir. Paket yüklemesi için değil, filtrelenmiş hook görünürlüğü ve hook bazında etkinleştirme için `openclaw hooks` kullanın.

    Npm spec'leri **yalnızca kayıt tabanlıdır** (paket adı + isteğe bağlı **tam sürüm** veya **dist-tag**). Git/URL/file spec'leri ve semver aralıkları reddedilir. Bağımlılık yüklemeleri, kabuğunuzda genel npm yükleme ayarları olsa bile güvenlik için `--ignore-scripts` ile proje yerelinde çalışır.

    npm çözümlemesini açık hale getirmek istediğinizde `npm:<package>` kullanın. Çıplak paket spec'leri de geçiş dönemi sırasında doğrudan npm'den yüklenir.

    Çıplak spec'ler ve `@latest` kararlı kanalda kalır. `2026.5.3-1` gibi OpenClaw tarih damgalı düzeltme sürümleri bu kontrol için kararlı sürümlerdir. npm bunlardan birini ön sürüme çözümlerse, OpenClaw durur ve `@beta`/`@rc` gibi bir ön sürüm etiketiyle veya `@1.2.3-beta.4` gibi tam bir ön sürümle açıkça dahil olmanızı ister.

    Çıplak yükleme spec'i resmi bir Plugin kimliğiyle eşleşirse (örneğin `diffs`), OpenClaw katalog girdisini doğrudan yükler. Aynı ada sahip bir npm paketini yüklemek için açık kapsamlı bir spec kullanın (örneğin `@scope/diffs`).

  </Accordion>
  <Accordion title="Git depoları">
    Bir git deposundan doğrudan yüklemek için `git:<repo>` kullanın. Desteklenen biçimler arasında `git:github.com/owner/repo`, `git:owner/repo`, tam `https://`, `ssh://`, `git://`, `file://` ve `git@host:owner/repo.git` klon URL'leri bulunur. Yüklemeden önce bir dalı, etiketi veya commit'i check out etmek için `@<ref>` veya `#<ref>` ekleyin.

    Git yüklemeleri geçici bir dizine klonlar, mevcutsa istenen ref'i check out eder, ardından normal Plugin dizini yükleyicisini kullanır. Bu, manifesto doğrulaması, tehlikeli kod taraması, paket yöneticisi yükleme işi ve yükleme kayıtlarının npm yüklemeleri gibi davrandığı anlamına gelir. Kaydedilen git yüklemeleri kaynak URL/ref'ini ve çözümlenen commit'i içerir, böylece `openclaw plugins update` kaynağı daha sonra yeniden çözümleyebilir.

    Git'ten yükledikten sonra gateway yöntemleri ve CLI komutları gibi runtime kayıtlarını doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. Plugin `api.registerCli` ile bir CLI kökü kaydettiyse, bu komutu doğrudan OpenClaw kök CLI üzerinden çalıştırın, örneğin `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arşivler">
    Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Yerel OpenClaw Plugin arşivleri, çıkarılan Plugin kökünde geçerli bir `openclaw.plugin.json` içermelidir; yalnızca `package.json` içeren arşivler, OpenClaw yükleme kayıtları yazmadan önce reddedilir.

    Claude marketplace yüklemeleri de desteklenir.

  </Accordion>
</AccordionGroup>

ClawHub yüklemeleri açık bir `clawhub:<package>` konum belirleyicisi kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Çıplak npm açısından güvenli Plugin spec'leri geçiş dönemi sırasında varsayılan olarak npm'den yüklenir:

```bash
openclaw plugins install openclaw-codex-app-server
```

Yalnızca npm çözümlemesini açık hale getirmek için `npm:` kullanın:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw, yüklemeden önce ilan edilen Plugin API / minimum gateway uyumluluğunu kontrol eder. Seçilen ClawHub sürümü bir ClawPack artefaktı yayımladığında, OpenClaw sürümlü npm-pack `.tgz` dosyasını indirir, ClawHub digest başlığını ve artefakt digest'ini doğrular, ardından normal arşiv yolu üzerinden yükler. ClawPack meta verisi olmayan eski ClawHub sürümleri hâlâ eski paket arşivi doğrulama yolu üzerinden yüklenir. Kaydedilen yüklemeler, sonraki güncellemeler için ClawHub kaynak meta verilerini, artefakt türünü, npm bütünlüğünü, npm shasum değerini, tarball adını ve ClawPack digest bilgilerini tutar.
Sürümsüz ClawHub yüklemeleri, `openclaw plugins update` daha yeni ClawHub sürümlerini takip edebilsin diye sürümsüz kaydedilmiş bir spec tutar; `clawhub:pkg@1.2.3` ve `clawhub:pkg@beta` gibi açık sürüm veya etiket seçicileri o seçiciye sabitlenmiş kalır.

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
  <Tab title="Pazar yeri kaynakları">
    - `~/.claude/plugins/known_marketplaces.json` içinden Claude tarafından bilinen bir pazar yeri adı
    - yerel bir pazar yeri kökü veya `marketplace.json` yolu
    - `owner/repo` gibi bir GitHub repo kısaltması
    - `https://github.com/owner/repo` gibi bir GitHub repo URL'si
    - bir git URL'si

  </Tab>
  <Tab title="Uzak pazar yeri kuralları">
    GitHub veya git üzerinden yüklenen uzak pazar yerleri için, plugin girdileri klonlanan pazar yeri reposunun içinde kalmalıdır. OpenClaw bu repodaki göreli yol kaynaklarını kabul eder ve uzak manifestlerden gelen HTTP(S), mutlak yol, git, GitHub ve yol olmayan diğer plugin kaynaklarını reddeder.
  </Tab>
</Tabs>

Yerel yollar ve arşivler için OpenClaw şunları otomatik algılar:

- yerel OpenClaw pluginleri (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya varsayılan Claude bileşen düzeni)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

<Note>
Uyumlu paketler normal plugin köküne kurulur ve aynı liste/bilgi/etkinleştirme/devre dışı bırakma akışına katılır. Bugün paket Skills, Claude komut-skilleri, Claude `settings.json` varsayılanları, Claude `.lsp.json` / manifestte beyan edilen `lspServers` varsayılanları, Cursor komut-skilleri ve uyumlu Codex hook dizinleri desteklenir; algılanan diğer paket yetenekleri tanılarda/bilgide gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmamıştır.
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
  Yalnızca etkin pluginleri gösterir.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Tablo görünümünden, kaynak/köken/sürüm/etkinleştirme meta verileriyle birlikte plugin başına ayrıntı satırlarına geçer.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir envanterin yanı sıra kayıt defteri tanıları ve paket bağımlılığı kurulum durumu.
</ParamField>

<Note>
`plugins list` önce kalıcı yerel plugin kayıt defterini okur; kayıt defteri eksik veya geçersizse yalnızca manifestten türetilmiş bir geri dönüş kullanır. Bir pluginin kurulu, etkin ve soğuk başlatma planlamasında görünür olup olmadığını denetlemek için kullanışlıdır, ancak zaten çalışan bir Gateway sürecinin canlı çalışma zamanı yoklaması değildir. Plugin kodunu, etkinleştirmeyi, hook ilkesini veya `plugins.load.paths` değerini değiştirdikten sonra, yeni `register(api)` kodunun veya hookların çalışmasını beklemeden önce kanala hizmet veren Gateway'i yeniden başlatın. Uzak/kapsayıcı dağıtımlarda yalnızca bir sarmalayıcı süreci değil, gerçek `openclaw gateway run` alt sürecini yeniden başlattığınızı doğrulayın.

`plugins list --json`, her pluginin `package.json` içindeki `dependencies` ve `optionalDependencies` kaynaklı `dependencyStatus` değerini içerir. OpenClaw bu paket adlarının pluginin normal Node `node_modules` arama yolunda bulunup bulunmadığını denetler; plugin çalışma zamanı kodunu içe aktarmaz, bir paket yöneticisi çalıştırmaz veya eksik bağımlılıkları onarmaz.
</Note>

`plugins search`, uzak bir ClawHub katalog aramasıdır. Yerel durumu incelemez, yapılandırmayı değiştirmez, paket kurmaz veya plugin çalışma zamanı kodu yüklemez. Arama sonuçları ClawHub paket adını, ailesini, kanalını, sürümünü, özetini ve `openclaw plugins install clawhub:<package>` gibi bir kurulum ipucunu içerir.

Paketlenmiş bir Docker imajının içinde gömülü plugin çalışmaları için, plugin kaynak dizinini eşleşen paketlenmiş kaynak yolunun üzerine bind-mount edin; örneğin `/app/extensions/synology-chat`. OpenClaw bu bağlanmış kaynak katmanını `/app/dist/extensions/synology-chat` öncesinde keşfeder; düz kopyalanmış bir kaynak dizini etkisiz kalır, böylece normal paketlenmiş kurulumlar derlenmiş dist kullanmayı sürdürür.

Çalışma zamanı hook hata ayıklaması için:

- `openclaw plugins inspect <id> --runtime --json`, modül yüklemeli inceleme geçişinden kayıtlı hookları ve tanıları gösterir. Çalışma zamanı incelemesi hiçbir zaman bağımlılık kurmaz; eski bağımlılık durumunu temizlemek veya eksik yapılandırılmış indirilebilir pluginleri kurmak için `openclaw doctor --fix` kullanın.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway'i, hizmet/süreç ipuçlarını, yapılandırma yolunu ve RPC sağlığını doğrular.
- Gömülü olmayan konuşma hookları (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.

Yerel bir dizini kopyalamaktan kaçınmak için `--link` kullanın (`plugins.load.paths` öğesine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force`, `--link` ile desteklenmez çünkü bağlantılı kurulumlar yönetilen bir kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullanır.

Varsayılan davranışı sabitlenmemiş tutarken çözümlenen tam belirtimi (`name@version`) yönetilen plugin dizinine kaydetmek için npm kurulumlarında `--pin` kullanın.
</Note>

### Plugin dizini

Plugin kurulum meta verileri kullanıcı yapılandırması değil, makine tarafından yönetilen durumdur. Kurulumlar ve güncellemeler bunu etkin OpenClaw durum dizini altında `plugins/installs.json` dosyasına yazar. Üst düzey `installRecords` haritası, bozuk veya eksik plugin manifestleri için kayıtlar dahil olmak üzere kurulum meta verilerinin kalıcı kaynağıdır. `plugins` dizisi, manifestten türetilmiş soğuk kayıt defteri önbelleğidir. Dosya düzenlemeyin uyarısı içerir ve `openclaw plugins update`, kaldırma, tanılar ve soğuk plugin kayıt defteri tarafından kullanılır.

OpenClaw yapılandırmada gönderilmiş eski `plugins.installs` kayıtları gördüğünde bunları plugin dizinine taşır ve yapılandırma anahtarını kaldırır; yazma işlemlerinden biri başarısız olursa kurulum meta verilerinin kaybolmaması için yapılandırma kayıtları korunur.

### Kaldırma

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, plugin kayıtlarını `plugins.entries`, kalıcı plugin dizini, plugin izin/engelleme listesi girdileri ve uygulanabildiğinde bağlantılı `plugins.load.paths` girdilerinden kaldırır. `--keep-files` ayarlanmadıkça kaldırma, OpenClaw'ın plugin uzantıları kökünün içinde olduğunda izlenen yönetilen kurulum dizinini de kaldırır. Active Memory pluginleri için bellek yuvası `memory-core` değerine sıfırlanır.

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

Güncellemeler, yönetilen plugin dizinindeki izlenen plugin kurulumlarına ve `hooks.internal.installs` içindeki izlenen hook paketi kurulumlarına uygulanır.

<AccordionGroup>
  <Accordion title="Plugin kimliğini npm belirtimine karşı çözümleme">
    Bir plugin kimliği ilettiğinizde OpenClaw bu plugin için kaydedilmiş kurulum belirtimini yeniden kullanır. Bu, `@beta` gibi daha önce saklanan dist-tag'lerin ve kesin sabitlenmiş sürümlerin sonraki `update <id>` çalıştırmalarında kullanılmaya devam edeceği anlamına gelir.

    npm kurulumları için dist-tag veya kesin sürüm içeren açık bir npm paket belirtimi de iletebilirsiniz. OpenClaw bu paket adını izlenen plugin kaydına geri çözümler, kurulu plugini günceller ve gelecekteki kimlik tabanlı güncellemeler için yeni npm belirtimini kaydeder.

    npm paket adını sürüm veya etiket olmadan iletmek de izlenen plugin kaydına geri çözümlenir. Bir plugin kesin bir sürüme sabitlenmişse ve bunu kayıt defterinin varsayılan yayın hattına geri taşımak istiyorsanız bunu kullanın.

  </Accordion>
  <Accordion title="Beta kanalı güncellemeleri">
    `openclaw plugins update`, yeni bir belirtim iletmediğiniz sürece izlenen plugin belirtimini yeniden kullanır. `openclaw update` ayrıca etkin OpenClaw güncelleme kanalını bilir: beta kanalında, varsayılan hat npm ve ClawHub plugin kayıtları önce `@beta` değerini dener, ardından plugin beta sürümü yoksa kaydedilmiş varsayılan/latest belirtimine geri döner. Kesin sürümler ve açık etiketler bu seçiciye sabitlenmiş kalır.

  </Accordion>
  <Accordion title="Sürüm denetimleri ve bütünlük sapması">
    Canlı bir npm güncellemesinden önce OpenClaw kurulu paket sürümünü npm kayıt defteri meta verileriyle karşılaştırır. Kurulu sürüm ve kaydedilmiş yapıt kimliği çözümlenen hedefle zaten eşleşiyorsa güncelleme indirme, yeniden kurma veya `openclaw.json` yeniden yazma olmadan atlanır.

    Saklanan bir bütünlük özeti varsa ve getirilen yapıt özeti değişirse OpenClaw bunu npm yapıt sapması olarak ele alır. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek özetleri yazdırır ve devam etmeden önce onay ister. Etkileşimli olmayan güncelleme yardımcıları, çağıran açık bir devam ilkesi sağlamadıkça kapalı başarısız olur.

  </Accordion>
  <Accordion title="Güncellemede --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, plugin güncellemeleri sırasında yerleşik tehlikeli kod taramasındaki yanlış pozitifler için acil durum geçersiz kılma olarak `plugins update` üzerinde de kullanılabilir. Yine de plugin `before_install` ilke engellerini veya tarama hatası engellemeyi atlatmaz ve yalnızca plugin güncellemelerine uygulanır, hook paketi güncellemelerine uygulanmaz.
  </Accordion>
</AccordionGroup>

### İnceleme

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect, varsayılan olarak plugin çalışma zamanını içe aktarmadan kimliği, yükleme durumunu, kaynağı, manifest yeteneklerini, ilke bayraklarını, tanıları, kurulum meta verilerini, paket yeteneklerini ve algılanan MCP veya LSP sunucu desteğini gösterir. Plugin modülünü yüklemek ve kayıtlı hookları, araçları, komutları, hizmetleri, gateway yöntemlerini ve HTTP rotalarını dahil etmek için `--runtime` ekleyin. Çalışma zamanı incelemesi eksik plugin bağımlılıklarını doğrudan bildirir; kurulumlar ve onarımlar `openclaw plugins install`, `openclaw plugins update` ve `openclaw doctor --fix` içinde kalır.

Pluginin sahip olduğu CLI komutları kök `openclaw` komut grupları olarak kurulur. `inspect --runtime`, `cliCommands` altında bir komut gösterdikten sonra bunu `openclaw <command> ...` olarak çalıştırın; örneğin `demo-git` kaydeden bir plugin `openclaw demo-git ping` ile doğrulanabilir.

Her plugin çalışma zamanında gerçekten kaydettiği şeye göre sınıflandırılır:

- **plain-capability** — tek bir yetenek türü (ör. yalnızca sağlayıcı plugini)
- **hybrid-capability** — birden çok yetenek türü (ör. metin + konuşma + görseller)
- **hook-only** — yalnızca hooklar, yetenek veya yüzey yok
- **non-capability** — araçlar/komutlar/hizmetler var ancak yetenek yok

Yetenek modeli hakkında daha fazla bilgi için [Plugin şekilleri](/tr/plugins/architecture#plugin-shapes) bölümüne bakın.

<Note>
`--json` bayrağı, betikleme ve denetim için uygun makine tarafından okunabilir bir rapor çıktılar. `inspect --all`, şekil, yetenek türleri, uyumluluk bildirimleri, paket yetenekleri ve hook özeti sütunlarıyla filo genelinde bir tablo render eder. `info`, `inspect` için bir takma addır.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, plugin yükleme hatalarını, manifest/keşif tanılarını ve uyumluluk bildirimlerini raporlar. Her şey temiz olduğunda `No plugin issues detected.` yazdırır.

Yapılandırılmış bir plugin diskte mevcutsa ancak yükleyicinin yol güvenliği denetimleri tarafından engelleniyorsa, yapılandırma doğrulaması plugin girdisini korur ve bunu `present but blocked` olarak raporlar. `plugins.entries.<id>` veya `plugins.allow` yapılandırmasını kaldırmak yerine, yol sahipliği veya herkes tarafından yazılabilir izinler gibi önceki engellenmiş plugin tanısını düzeltin.

Eksik `register`/`activate` dışa aktarımları gibi modül şekli hataları için, tanı çıktısına kompakt bir dışa aktarım şekli özeti eklemek üzere `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Kayıt defteri

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Yerel plugin kayıt defteri, kurulu plugin kimliği, etkinleştirme, kaynak meta verileri ve katkı sahipliği için OpenClaw'ın kalıcı soğuk okuma modelidir. Normal başlatma, sağlayıcı sahibi araması, kanal kurulumu sınıflandırması ve plugin envanteri, plugin çalışma zamanı modüllerini içe aktarmadan bunu okuyabilir.

`plugins registry` komutunu, kalıcı kayıt defterinin mevcut, güncel veya eski olup olmadığını incelemek için kullanın. Kalıcı Plugin dizininden, yapılandırma ilkesinden ve manifest/package meta verilerinden yeniden oluşturmak için `--refresh` kullanın. Bu bir onarım yoludur, çalışma zamanı etkinleştirme yolu değildir.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`, kayıt defteri okuma hataları için kullanım dışı bırakılmış bir acil uyumluluk anahtarıdır. `plugins registry --refresh` veya `openclaw doctor --fix` tercih edin; env geri dönüşü yalnızca geçiş yayıma alınırken acil başlangıç kurtarması içindir.
</Warning>

### Pazar Yeri

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Pazar yeri listesi yerel bir pazar yeri yolunu, bir `marketplace.json` yolunu, `owner/repo` gibi bir GitHub kısaltmasını, bir GitHub repo URL'sini veya bir git URL'sini kabul eder. `--json`, çözümlenen kaynak etiketinin yanı sıra ayrıştırılmış pazar yeri manifestini ve Plugin girdilerini yazdırır.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [CLI başvurusu](/tr/cli)
- [Topluluk Plugin'leri](/tr/plugins/community)
