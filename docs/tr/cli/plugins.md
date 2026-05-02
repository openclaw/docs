---
read_when:
    - Gateway Plugin'lerini veya uyumlu paketleri kurmak ya da yönetmek istiyorsunuz
    - Plugin yükleme hatalarında hata ayıklamak istiyorsunuz
sidebarTitle: Plugins
summary: '`openclaw plugins` için CLI başvurusu (list, install, marketplace, uninstall, enable/disable, doctor)'
title: Pluginler
x-i18n:
    generated_at: "2026-05-02T22:17:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b077ab0739e2453ccba434aa3b02b1d441bab792b7b131216221a8048d551cd
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Pluginlarını, hook paketlerini ve uyumlu paketleri yönetin.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/tr/tools/plugin">
    Pluginları yükleme, etkinleştirme ve sorun giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Manage plugins" href="/tr/plugins/manage-plugins">
    Yükleme, listeleme, güncelleme, kaldırma ve yayımlama için hızlı örnekler.
  </Card>
  <Card title="Plugin bundles" href="/tr/plugins/bundles">
    Paket uyumluluğu modeli.
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

Yavaş yükleme, inceleme, kaldırma veya kayıt yenileme araştırması için komutu
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ile çalıştırın. İz, aşama sürelerini stderr'ye
yazar ve JSON çıktısını ayrıştırılabilir tutar. Bkz. [Hata ayıklama](/tr/help/debugging#plugin-lifecycle-trace).

<Note>
Paketlenmiş Pluginlar OpenClaw ile birlikte gelir. Bazıları varsayılan olarak etkindir (örneğin paketlenmiş model sağlayıcıları, paketlenmiş konuşma sağlayıcıları ve paketlenmiş tarayıcı Pluginı); diğerleri `plugins enable` gerektirir.

Yerel OpenClaw Pluginları, satır içi JSON Schema (`configSchema`, boş olsa bile) ile `openclaw.plugin.json` göndermelidir. Uyumlu paketler bunun yerine kendi paket manifestlerini kullanır.

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
Yalın paket adları, başlatma geçişi sırasında varsayılan olarak npm'den yüklenir. ClawHub için `clawhub:<package>` kullanın. Plugin yüklemelerini kod çalıştırmak gibi değerlendirin. Sabitlenmiş sürümleri tercih edin.
</Warning>

`plugins search`, yüklenebilir Plugin paketleri için ClawHub'ı sorgular ve
yüklemeye hazır paket adlarını yazdırır. Kod-Plugin ve paket-Plugin paketlerini
arar, Skills aramaz. ClawHub Skills için `openclaw skills search` kullanın.

<Note>
ClawHub, çoğu Plugin için birincil dağıtım ve keşif yüzeyidir. Npm
desteklenen bir yedek ve doğrudan yükleme yolu olarak kalır. OpenClaw'a ait
`@openclaw/*` Plugin paketleri yeniden npm'de yayımlanmaktadır; güncel listeye
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) veya
[Plugin envanteri](/tr/plugins/plugin-inventory) üzerinden bakın. Kararlı yüklemeler `latest` kullanır.
Beta kanalı yüklemeleri ve güncellemeleri, bu etiket mevcut olduğunda npm `beta` dist-tag'ini
tercih eder, ardından `latest` değerine geri döner.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config recovery">
    `plugins` bölümünüz tek dosyalık bir `$include` tarafından destekleniyorsa, `plugins install/update/enable/disable/uninstall` bu dahil edilen dosyaya yazar ve `openclaw.json` dosyasını dokunmadan bırakır. Kök include'lar, include dizileri ve kardeş geçersiz kılmaları olan include'lar düzleştirmek yerine kapalı şekilde başarısız olur. Desteklenen biçimler için [Yapılandırma include'ları](/tr/gateway/configuration) bölümüne bakın.

    Yükleme sırasında yapılandırma geçersizse, `plugins install` normalde kapalı şekilde başarısız olur ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Gateway başlatılırken, bir Plugin için geçersiz yapılandırma o Plugin ile sınırlanır, böylece diğer kanallar ve Pluginlar çalışmaya devam edebilir; `openclaw doctor --fix` geçersiz Plugin girdisini karantinaya alabilir. Belgelenmiş tek yükleme zamanı istisnası, açıkça `openclaw.install.allowInvalidConfigRecovery` seçeneğine dahil olan Pluginlar için dar kapsamlı bir paketlenmiş-Plugin kurtarma yoludur.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force`, mevcut yükleme hedefini yeniden kullanır ve zaten yüklü olan bir Pluginın veya hook paketinin üzerine yerinde yazar. Aynı kimliği yeni bir yerel yoldan, arşivden, ClawHub paketinden veya npm yapıtından bilinçli olarak yeniden yüklüyorsanız bunu kullanın. Zaten izlenen bir npm Pluginının rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` tercih edin.

    Zaten yüklü olan bir Plugin kimliği için `plugins install` çalıştırırsanız, OpenClaw durur ve normal bir yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna ya da mevcut yüklemenin gerçekten farklı bir kaynaktan üzerine yazmak istediğinizde `plugins install <package> --force` komutuna yönlendirir.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` yalnızca npm yüklemeleri için geçerlidir. `git:` yüklemeleriyle desteklenmez; sabitlenmiş bir kaynak istediğinizde `git:github.com/acme/plugin@v1.2.3` gibi açık bir git ref kullanın. `--marketplace` ile desteklenmez, çünkü marketplace yüklemeleri npm spec yerine marketplace kaynak meta verilerini kalıcı hale getirir.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısındaki yanlış pozitifler için acil durum seçeneğidir. Yerleşik tarayıcı `critical` bulgular bildirse bile yüklemenin devam etmesine izin verir, ancak Plugin `before_install` hook ilke engellerini **atlamaz** ve tarama hatalarını **atlamaz**.

    Bu CLI bayrağı, Plugin yükleme/güncelleme akışları için geçerlidir. Gateway destekli skill bağımlılığı yüklemeleri eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanırken, `openclaw skills install` ayrı bir ClawHub skill indirme/yükleme akışı olarak kalır.

    ClawHub'da yayımladığınız bir Plugin kayıt taraması tarafından engelleniyorsa, [ClawHub](/tr/tools/clawhub) bölümündeki yayımcı adımlarını kullanın.

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install`, `package.json` içinde `openclaw.hooks` sunan hook paketleri için de yükleme yüzeyidir. Paket yüklemesi için değil, filtrelenmiş hook görünürlüğü ve hook başına etkinleştirme için `openclaw hooks` kullanın.

    Npm spec'leri **yalnızca kayıt tabanlıdır** (paket adı + isteğe bağlı **tam sürüm** veya **dist-tag**). Git/URL/dosya spec'leri ve semver aralıkları reddedilir. Kabuk ortamınızda global npm yükleme ayarları olsa bile, bağımlılık yüklemeleri güvenlik için proje yerelinde `--ignore-scripts` ile çalışır.

    Npm çözümlemesini açık hale getirmek istediğinizde `npm:<package>` kullanın. Yalın paket spec'leri de başlatma geçişi sırasında doğrudan npm'den yüklenir.

    Yalın spec'ler ve `@latest` kararlı izde kalır. npm bunlardan herhangi birini ön sürüme çözümlerse, OpenClaw durur ve `@beta`/`@rc` gibi bir ön sürüm etiketiyle veya `@1.2.3-beta.4` gibi tam bir ön sürümle açıkça dahil olmanızı ister.

    Yalın bir yükleme spec'i resmi bir Plugin kimliğiyle eşleşirse (örneğin `diffs`), OpenClaw katalog girdisini doğrudan yükler. Aynı ada sahip bir npm paketini yüklemek için açık kapsamlı bir spec kullanın (örneğin `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Doğrudan bir git deposundan yüklemek için `git:<repo>` kullanın. Desteklenen biçimler arasında `git:github.com/owner/repo`, `git:owner/repo`, tam `https://`, `ssh://`, `git://`, `file://` ve `git@host:owner/repo.git` klon URL'leri bulunur. Yüklemeden önce bir branch, tag veya commit'i check out etmek için `@<ref>` ya da `#<ref>` ekleyin.

    Git yüklemeleri geçici bir dizine klonlar, varsa istenen ref'i check out eder, ardından normal Plugin dizini yükleyicisini kullanır. Bu, manifest doğrulaması, tehlikeli kod taraması, paket yöneticisi yükleme işi ve yükleme kayıtlarının npm yüklemeleri gibi davrandığı anlamına gelir. Kaydedilen git yüklemeleri, kaynak URL/ref bilgisini ve çözümlenen commit'i içerir; böylece `openclaw plugins update` daha sonra kaynağı yeniden çözümleyebilir.

    Git'ten yükledikten sonra, gateway yöntemleri ve CLI komutları gibi çalışma zamanı kayıtlarını doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. Plugin `api.registerCli` ile bir CLI kökü kaydettiyse, bu komutu doğrudan OpenClaw kök CLI üzerinden çalıştırın; örneğin `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Yerel OpenClaw Plugin arşivleri, çıkarılan Plugin kökünde geçerli bir `openclaw.plugin.json` içermelidir; yalnızca `package.json` içeren arşivler, OpenClaw yükleme kayıtlarını yazmadan önce reddedilir.

    Claude marketplace yüklemeleri de desteklenir.

  </Accordion>
</AccordionGroup>

ClawHub yüklemeleri açık bir `clawhub:<package>` konumlayıcısı kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Yalın npm açısından güvenli Plugin spec'leri, başlatma geçişi sırasında varsayılan olarak npm'den yüklenir:

```bash
openclaw plugins install openclaw-codex-app-server
```

Yalnızca npm çözümlemesini açık hale getirmek için `npm:` kullanın:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw, yüklemeden önce duyurulan Plugin API / minimum gateway uyumluluğunu kontrol eder. Seçilen ClawHub sürümü bir ClawPack yapıtı yayımladığında, OpenClaw sürümlü npm-pack `.tgz` dosyasını indirir, ClawHub özet üst bilgisini ve yapıt özetini doğrular, ardından normal arşiv yolu üzerinden yükler. ClawPack meta verisi olmayan eski ClawHub sürümleri, eski paket arşivi doğrulama yolu üzerinden yüklenmeye devam eder. Kaydedilen yüklemeler, daha sonraki güncellemeler için ClawHub kaynak meta verilerini, yapıt türünü, npm bütünlüğünü, npm shasum değerini, tarball adını ve ClawPack özet bilgilerini korur.
Sürümsüz ClawHub yüklemeleri, `openclaw plugins update` komutunun daha yeni ClawHub sürümlerini izleyebilmesi için sürümsüz bir kayıtlı spec tutar; `clawhub:pkg@1.2.3` ve `clawhub:pkg@beta` gibi açık sürüm veya etiket seçicileri bu seçiciye sabitlenmiş kalır.

#### Marketplace kısaltması

Marketplace adı, Claude'un `~/.claude/plugins/known_marketplaces.json` konumundaki yerel kayıt önbelleğinde mevcut olduğunda `plugin@marketplace` kısaltmasını kullanın:

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
  <Tab title="Pazaryeri kaynakları">
    - `~/.claude/plugins/known_marketplaces.json` içinden Claude tarafından bilinen bir pazaryeri adı
    - yerel bir pazaryeri kökü veya `marketplace.json` yolu
    - `owner/repo` gibi bir GitHub repo kısaltması
    - `https://github.com/owner/repo` gibi bir GitHub repo URL'si
    - bir git URL'si

  </Tab>
  <Tab title="Uzak pazaryeri kuralları">
    GitHub veya git üzerinden yüklenen uzak pazaryerlerinde, Plugin girdileri klonlanan pazaryeri reposunun içinde kalmalıdır. OpenClaw bu repodan gelen göreli yol kaynaklarını kabul eder ve uzak manifestlerden gelen HTTP(S), mutlak yol, git, GitHub ve diğer yol olmayan Plugin kaynaklarını reddeder.
  </Tab>
</Tabs>

Yerel yollar ve arşivler için OpenClaw şunları otomatik algılar:

- yerel OpenClaw Plugin'leri (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya varsayılan Claude bileşen düzeni)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

<Note>
Uyumlu paketler normal Plugin köküne kurulur ve aynı liste/bilgi/etkinleştirme/devre dışı bırakma akışına katılır. Bugün paket Skills'leri, Claude komut Skills'leri, Claude `settings.json` varsayılanları, Claude `.lsp.json` / manifestte bildirilen `lspServers` varsayılanları, Cursor komut Skills'leri ve uyumlu Codex hook dizinleri desteklenir; algılanan diğer paket yetenekleri tanılarda/bilgide gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmamıştır.
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
  Tablo görünümünden, kaynak/köken/sürüm/aktivasyon meta verileriyle birlikte Plugin başına ayrıntı satırlarına geç.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir envanter, kayıt tanıları ve paket bağımlılığı kurulum durumu.
</ParamField>

<Note>
`plugins list`, önce kalıcı yerel Plugin kaydını okur; kayıt eksik veya geçersizse yalnızca manifestten türetilen bir geri dönüş kullanır. Bir Plugin'in kurulu, etkin ve soğuk başlangıç planlamasına görünür olup olmadığını denetlemek için kullanışlıdır, ancak zaten çalışan bir Gateway sürecinin canlı çalışma zamanı sondası değildir. Plugin kodunu, etkinleştirmeyi, hook politikasını veya `plugins.load.paths` değerini değiştirdikten sonra, yeni `register(api)` kodunun veya hook'ların çalışmasını beklemeden önce kanala hizmet veren Gateway'i yeniden başlatın. Uzak/konteyner dağıtımlarında, yalnızca bir sarmalayıcı süreci değil, gerçek `openclaw gateway run` alt sürecini yeniden başlattığınızı doğrulayın.

`plugins list --json`, her Plugin'in `package.json` `dependencies` ve `optionalDependencies` alanlarından gelen `dependencyStatus` bilgisini içerir. OpenClaw bu paket adlarının Plugin'in normal Node `node_modules` arama yolunda mevcut olup olmadığını denetler; Plugin çalışma zamanı kodunu içe aktarmaz, bir paket yöneticisi çalıştırmaz veya eksik bağımlılıkları onarmaz.
</Note>

`plugins search`, uzak bir ClawHub katalog aramasıdır. Yerel durumu incelemez, yapılandırmayı değiştirmez, paket kurmaz veya Plugin çalışma zamanı kodunu yüklemez. Arama sonuçları ClawHub paket adını, ailesini, kanalını, sürümünü, özetini ve `openclaw plugins install clawhub:<package>` gibi bir kurulum ipucunu içerir.

Paketlenmiş bir Docker imajı içinde yerleşik Plugin çalışması için, Plugin kaynak dizinini `/app/extensions/synology-chat` gibi eşleşen paketlenmiş kaynak yolunun üzerine bind-mount edin. OpenClaw bu bağlanan kaynak katmanını `/app/dist/extensions/synology-chat` yolundan önce keşfeder; düz kopyalanmış bir kaynak dizini etkisiz kalır, böylece normal paketlenmiş kurulumlar derlenmiş dist'i kullanmaya devam eder.

Çalışma zamanı hook hata ayıklaması için:

- `openclaw plugins inspect <id> --runtime --json`, modül yüklemeli bir inceleme geçişinden kayıtlı hook'ları ve tanıları gösterir. Çalışma zamanı incelemesi hiçbir zaman bağımlılık kurmaz; eski bağımlılık durumunu temizlemek veya eksik yapılandırılmış indirilebilir Plugin'leri kurmak için `openclaw doctor --fix` kullanın.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway'i, hizmet/süreç ipuçlarını, yapılandırma yolunu ve RPC sağlığını doğrular.
- Yerleşik olmayan konuşma hook'ları (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.

Yerel bir dizini kopyalamaktan kaçınmak için `--link` kullanın (`plugins.load.paths` değerine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
Bağlantılı kurulumlar yönetilen bir kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullandığı için `--force`, `--link` ile desteklenmez.

Varsayılan davranışı sabitlemeden korurken çözümlenen kesin belirtimi (`name@version`) yönetilen Plugin dizinine kaydetmek için npm kurulumlarında `--pin` kullanın.
</Note>

### Plugin dizini

Plugin kurulum meta verileri kullanıcı yapılandırması değil, makine tarafından yönetilen durumdur. Kurulumlar ve güncellemeler bunu etkin OpenClaw durum dizini altındaki `plugins/installs.json` dosyasına yazar. Üst düzey `installRecords` haritası, bozuk veya eksik Plugin manifestlerine ait kayıtlar dahil olmak üzere kurulum meta verilerinin kalıcı kaynağıdır. `plugins` dizisi, manifestten türetilen soğuk kayıt önbelleğidir. Dosya düzenlemeyin uyarısı içerir ve `openclaw plugins update`, kaldırma, tanılar ve soğuk Plugin kaydı tarafından kullanılır.

OpenClaw yapılandırmada gönderilmiş eski `plugins.installs` kayıtlarını gördüğünde bunları Plugin dizinine taşır ve yapılandırma anahtarını kaldırır; yazma işlemlerinden biri başarısız olursa, kurulum meta verilerinin kaybolmaması için yapılandırma kayıtları korunur.

### Kaldır

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, Plugin kayıtlarını `plugins.entries`, kalıcı Plugin dizini, Plugin izin/engelleme listesi girdileri ve uygulanabiliyorsa bağlantılı `plugins.load.paths` girdilerinden kaldırır. `--keep-files` ayarlanmadığı sürece kaldırma, OpenClaw'ın Plugin uzantıları kökü içindeyse izlenen yönetilen kurulum dizinini de kaldırır. Active Memory Plugin'leri için bellek yuvası `memory-core` değerine sıfırlanır.

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
  <Accordion title="Plugin kimliğini npm belirtiminden ayırma">
    Bir Plugin kimliği verdiğinizde OpenClaw, o Plugin için kaydedilmiş kurulum belirtimini yeniden kullanır. Bu, `@beta` gibi önceden depolanmış dist-tag'lerin ve kesin sabitlenmiş sürümlerin sonraki `update <id>` çalıştırmalarında kullanılmaya devam edeceği anlamına gelir.

    npm kurulumları için dist-tag veya kesin sürüm içeren açık bir npm paket belirtimi de verebilirsiniz. OpenClaw bu paket adını izlenen Plugin kaydına geri çözümler, kurulu Plugin'i günceller ve gelecekteki kimlik tabanlı güncellemeler için yeni npm belirtimini kaydeder.

    npm paket adını sürüm veya etiket olmadan vermek de izlenen Plugin kaydına geri çözümlenir. Bir Plugin kesin bir sürüme sabitlendiğinde ve onu kaydın varsayılan yayın hattına geri taşımak istediğinizde bunu kullanın.

  </Accordion>
  <Accordion title="Beta kanal güncellemeleri">
    `openclaw plugins update`, yeni bir belirtim vermediğiniz sürece izlenen Plugin belirtimini yeniden kullanır. `openclaw update` ayrıca etkin OpenClaw güncelleme kanalını bilir: beta kanalında, varsayılan hat npm ve ClawHub Plugin kayıtları önce `@beta` değerini dener, sonra Plugin beta yayını yoksa kaydedilmiş varsayılan/latest belirtimine geri döner. Kesin sürümler ve açık etiketler o seçiciye sabitlenmiş kalır.

  </Accordion>
  <Accordion title="Sürüm denetimleri ve bütünlük sapması">
    Canlı bir npm güncellemesinden önce OpenClaw, kurulu paket sürümünü npm kayıt meta verilerine göre denetler. Kurulu sürüm ve kaydedilmiş yapıt kimliği çözümlenen hedefle zaten eşleşiyorsa güncelleme indirme, yeniden kurma veya `openclaw.json` dosyasını yeniden yazma olmadan atlanır.

    Depolanmış bir bütünlük karması varsa ve getirilen yapıt karması değişirse, OpenClaw bunu npm yapıt sapması olarak ele alır. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek karmaları yazdırır ve devam etmeden önce onay ister. Etkileşimsiz güncelleme yardımcıları, çağıran açık bir devam politikası sağlamadığı sürece kapalı şekilde başarısız olur.

  </Accordion>
  <Accordion title="Güncellemede --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, Plugin güncellemeleri sırasında yerleşik tehlikeli kod taraması yanlış pozitifleri için acil durum geçersiz kılması olarak `plugins update` üzerinde de kullanılabilir. Yine de Plugin `before_install` politika engellerini veya tarama hatası engellemesini atlamaz ve yalnızca Plugin güncellemelerine uygulanır, hook paketi güncellemelerine değil.
  </Accordion>
</AccordionGroup>

### İncele

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect varsayılan olarak Plugin çalışma zamanını içe aktarmadan kimliği, yükleme durumunu, kaynağı, manifest yeteneklerini, politika bayraklarını, tanıları, kurulum meta verilerini, paket yeteneklerini ve algılanan MCP veya LSP sunucu desteğini gösterir. Plugin modülünü yüklemek ve kayıtlı hook'ları, araçları, komutları, hizmetleri, Gateway yöntemlerini ve HTTP rotalarını dahil etmek için `--runtime` ekleyin. Çalışma zamanı incelemesi eksik Plugin bağımlılıklarını doğrudan bildirir; kurulumlar ve onarımlar `openclaw plugins install`, `openclaw plugins update` ve `openclaw doctor --fix` içinde kalır.

Plugin'e ait CLI komutları kök `openclaw` komut grupları olarak kurulur. `inspect --runtime`, `cliCommands` altında bir komut gösterdikten sonra onu `openclaw <command> ...` olarak çalıştırın; örneğin `demo-git` kaydeden bir Plugin, `openclaw demo-git ping` ile doğrulanabilir.

Her Plugin, çalışma zamanında gerçekten ne kaydettiğine göre sınıflandırılır:

- **plain-capability** — tek yetenek türü (ör. yalnızca sağlayıcı olan bir Plugin)
- **hybrid-capability** — birden fazla yetenek türü (ör. metin + konuşma + görseller)
- **hook-only** — yalnızca hook'lar, yetenek veya yüzey yok
- **non-capability** — araçlar/komutlar/hizmetler var ama yetenek yok

Yetenek modeli hakkında daha fazla bilgi için [Plugin şekilleri](/tr/plugins/architecture#plugin-shapes) bölümüne bakın.

<Note>
`--json` bayrağı, betik yazma ve denetim için uygun makine tarafından okunabilir bir rapor üretir. `inspect --all`, şekil, yetenek türleri, uyumluluk bildirimleri, paket yetenekleri ve hook özeti sütunlarıyla filo genelinde bir tablo oluşturur. `info`, `inspect` için bir takma addır.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, Plugin yükleme hatalarını, manifest/keşif tanılarını ve uyumluluk bildirimlerini bildirir. Her şey temiz olduğunda `No plugin issues detected.` yazdırır.

Eksik `register`/`activate` dışa aktarımları gibi modül şekli hataları için, tanı çıktısına kompakt bir dışa aktarım şekli özeti eklemek üzere `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Kayıt

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Yerel Plugin kaydı, OpenClaw'ın kurulu Plugin kimliği, etkinleştirme, kaynak meta verileri ve katkı sahipliği için kalıcı soğuk okuma modelidir. Normal başlangıç, sağlayıcı sahibi araması, kanal kurulum sınıflandırması ve Plugin envanteri, Plugin çalışma zamanı modüllerini içe aktarmadan bunu okuyabilir.

Kalıcı kaydın mevcut, güncel veya bayat olup olmadığını incelemek için `plugins registry` kullanın. Kalıcı Plugin dizininden, yapılandırma politikasından ve manifest/paket meta verilerinden yeniden oluşturmak için `--refresh` kullanın. Bu bir onarım yoludur, çalışma zamanı aktivasyon yolu değildir.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`, kayıt defteri okuma hataları için kullanımdan kaldırılmış bir acil durum uyumluluk anahtarıdır. `plugins registry --refresh` veya `openclaw doctor --fix` tercih edin; env yedeği yalnızca geçiş kullanıma alınırken acil başlangıç kurtarması içindir.
</Warning>

### Pazar yeri

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list, yerel bir pazar yeri yolunu, bir `marketplace.json` yolunu, `owner/repo` gibi bir GitHub kısaltmasını, bir GitHub repo URL'sini veya bir git URL'sini kabul eder. `--json`, çözümlenen kaynak etiketinin yanı sıra ayrıştırılmış pazar yeri manifestini ve Plugin girdilerini yazdırır.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [CLI referansı](/tr/cli)
- [Topluluk Plugin'leri](/tr/plugins/community)
