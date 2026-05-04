---
read_when:
    - Gateway Plugin'lerini veya uyumlu paketleri kurmak ya da yönetmek istiyorsunuz
    - Plugin yükleme başarısızlıklarında hata ayıklamak istiyorsunuz
sidebarTitle: Plugins
summary: '`openclaw plugins` için CLI referansı (list, install, marketplace, uninstall, enable/disable, doctor)'
title: Pluginler
x-i18n:
    generated_at: "2026-05-04T09:37:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: f561ce098181b07f25db3520b1726162863469ac05fb4a3e786915257d97c9a4
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin'lerini, hook paketlerini ve uyumlu paketleri yönetin.

<CardGroup cols={2}>
  <Card title="Plugin sistemi" href="/tr/tools/plugin">
    Plugin'leri kurma, etkinleştirme ve sorun giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Plugin'leri yönet" href="/tr/plugins/manage-plugins">
    Kurulum, listeleme, güncelleme, kaldırma ve yayımlama için hızlı örnekler.
  </Card>
  <Card title="Plugin paketleri" href="/tr/plugins/bundles">
    Paket uyumluluk modeli.
  </Card>
  <Card title="Plugin manifestosu" href="/tr/plugins/manifest">
    Manifesto alanları ve yapılandırma şeması.
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

Yavaş kurulum, inceleme, kaldırma veya kayıt yenileme araştırmaları için komutu `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ile çalıştırın. İz, aşama zamanlamalarını stderr'ye yazar ve JSON çıktısını ayrıştırılabilir tutar. Bkz. [Hata ayıklama](/tr/help/debugging#plugin-lifecycle-trace).

<Note>
Paketli Plugin'ler OpenClaw ile birlikte gelir. Bazıları varsayılan olarak etkindir (örneğin paketli model sağlayıcıları, paketli konuşma sağlayıcıları ve paketli tarayıcı Plugin'i); diğerleri `plugins enable` gerektirir.

Yerel OpenClaw Plugin'leri, satır içi JSON Schema (`configSchema`, boş olsa bile) içeren `openclaw.plugin.json` ile gönderilmelidir. Uyumlu paketler bunun yerine kendi paket manifestolarını kullanır.

`plugins list`, `Format: openclaw` veya `Format: bundle` gösterir. Ayrıntılı liste/bilgi çıktısı ayrıca paket alt türünü (`codex`, `claude` veya `cursor`) ve algılanan paket yeteneklerini gösterir.
</Note>

### Kurulum

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
Yalın paket adları, lansman geçişi sırasında varsayılan olarak npm'den kurulur. ClawHub için `clawhub:<package>` kullanın. Plugin kurulumlarını kod çalıştırmak gibi ele alın. Sabitlenmiş sürümleri tercih edin.
</Warning>

`plugins search`, kurulabilir Plugin paketleri için ClawHub'ı sorgular ve kuruluma hazır paket adlarını yazdırır. Kod-Plugin ve paket-Plugin paketlerinde arama yapar, Skills içinde değil. ClawHub Skills için `openclaw skills search` kullanın.

<Note>
ClawHub, çoğu Plugin için birincil dağıtım ve keşif yüzeyidir. Npm desteklenen bir yedek ve doğrudan kurulum yolu olmaya devam eder. OpenClaw'a ait `@openclaw/*` Plugin paketleri yeniden npm'de yayımlanır; geçerli liste için [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) veya [Plugin envanteri](/tr/plugins/plugin-inventory) sayfasına bakın. Kararlı kurulumlar `latest` kullanır. Beta kanalı kurulumları ve güncellemeleri, bu etiket mevcut olduğunda npm `beta` dist-tag'ini tercih eder, ardından `latest`'e geri döner.
</Note>

<AccordionGroup>
  <Accordion title="Yapılandırma include'ları ve geçersiz yapılandırma onarımı">
    `plugins` bölümünüz tek dosyalı bir `$include` tarafından destekleniyorsa, `plugins install/update/enable/disable/uninstall` bu eklenen dosyaya yazar ve `openclaw.json` dosyasına dokunmaz. Kök include'lar, include dizileri ve kardeş geçersiz kılmalar içeren include'lar düzleştirilmek yerine kapalı başarısız olur. Desteklenen biçimler için [Yapılandırma include'ları](/tr/gateway/configuration) bölümüne bakın.

    Kurulum sırasında yapılandırma geçersizse, `plugins install` normalde kapalı başarısız olur ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Gateway başlatma ve sıcak yeniden yükleme sırasında, geçersiz Plugin yapılandırması diğer geçersiz yapılandırmalar gibi kapalı başarısız olur; `openclaw doctor --fix` geçersiz Plugin girdisini karantinaya alabilir. Belgelenen tek kurulum zamanı istisnası, açıkça `openclaw.install.allowInvalidConfigRecovery` seçeneğine dahil olan Plugin'ler için dar kapsamlı paketli-Plugin kurtarma yoludur.

  </Accordion>
  <Accordion title="--force ve yeniden kurulum ile güncelleme farkı">
    `--force` mevcut kurulum hedefini yeniden kullanır ve zaten kurulu bir Plugin'i veya hook paketini yerinde üzerine yazar. Aynı kimliği yeni bir yerel yoldan, arşivden, ClawHub paketinden veya npm yapısından bilerek yeniden kurarken bunu kullanın. Zaten izlenen bir npm Plugin'inin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` tercih edin.

    Zaten kurulu olan bir Plugin kimliği için `plugins install` çalıştırırsanız, OpenClaw durur ve normal yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna veya geçerli kurulumu gerçekten farklı bir kaynaktan üzerine yazmak istediğinizde `plugins install <package> --force` komutuna yönlendirir.

  </Accordion>
  <Accordion title="--pin kapsamı">
    `--pin` yalnızca npm kurulumlarına uygulanır. `git:` kurulumlarıyla desteklenmez; sabitlenmiş bir kaynak istediğinizde `git:github.com/acme/plugin@v1.2.3` gibi açık bir git ref kullanın. `--marketplace` ile desteklenmez, çünkü marketplace kurulumları npm spec yerine marketplace kaynak meta verilerini kalıcı hale getirir.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısındaki yanlış pozitifler için acil durum seçeneğidir. Yerleşik tarayıcı `critical` bulgular bildirse bile kurulumun devam etmesine izin verir, ancak Plugin `before_install` hook ilke engellerini **atlamaz** ve tarama hatalarını **atlamaz**.

    Bu CLI bayrağı Plugin kurulum/güncelleme akışlarına uygulanır. Gateway destekli Skills bağımlılık kurulumları eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanırken, `openclaw skills install` ayrı bir ClawHub skill indirme/kurulum akışı olarak kalır.

    ClawHub'da yayımladığınız bir Plugin kayıt taraması tarafından engellenirse, [ClawHub](/tr/tools/clawhub) içindeki yayımlayıcı adımlarını kullanın.

  </Accordion>
  <Accordion title="Hook paketleri ve npm spec'leri">
    `plugins install`, `package.json` içinde `openclaw.hooks` sunan hook paketleri için de kurulum yüzeyidir. Paket kurulumu için değil, filtrelenmiş hook görünürlüğü ve hook başına etkinleştirme için `openclaw hooks` kullanın.

    Npm spec'leri **yalnızca kayıt** içindir (paket adı + isteğe bağlı **tam sürüm** veya **dist-tag**). Git/URL/dosya spec'leri ve semver aralıkları reddedilir. Bağımlılık kurulumları, kabuğunuzda global npm kurulum ayarları olsa bile güvenlik için `--ignore-scripts` ile proje yerelinde çalışır.

    npm çözümlemesini açık hale getirmek istediğinizde `npm:<package>` kullanın. Yalın paket spec'leri de lansman geçişi sırasında doğrudan npm'den kurulur.

    Yalın spec'ler ve `@latest` kararlı hatta kalır. `2026.5.3-1` gibi OpenClaw tarih damgalı düzeltme sürümleri bu kontrol için kararlı sürümlerdir. npm bunlardan birini ön sürüme çözümlerse, OpenClaw durur ve `@beta`/`@rc` gibi bir ön sürüm etiketiyle veya `@1.2.3-beta.4` gibi tam bir ön sürümle açıkça dahil olmanızı ister.

    Yalın bir kurulum spec'i resmi bir Plugin kimliğiyle eşleşirse (örneğin `diffs`), OpenClaw katalog girdisini doğrudan kurar. Aynı ada sahip bir npm paketi kurmak için açık kapsamlı bir spec kullanın (örneğin `@scope/diffs`).

  </Accordion>
  <Accordion title="Git depoları">
    Doğrudan bir git deposundan kurmak için `git:<repo>` kullanın. Desteklenen biçimler arasında `git:github.com/owner/repo`, `git:owner/repo`, tam `https://`, `ssh://`, `git://`, `file://` ve `git@host:owner/repo.git` klon URL'leri bulunur. Kurulumdan önce bir dalı, etiketi veya commit'i check out etmek için `@<ref>` veya `#<ref>` ekleyin.

    Git kurulumları geçici bir dizine klonlar, mevcutsa istenen ref'i check out eder, ardından normal Plugin dizini kurucusunu kullanır. Bu, manifesto doğrulaması, tehlikeli kod taraması, paket yöneticisi kurulum işi ve kurulum kayıtlarının npm kurulumları gibi davrandığı anlamına gelir. Kaydedilen git kurulumları, `openclaw plugins update` komutunun kaynağı daha sonra yeniden çözümleyebilmesi için kaynak URL/ref bilgisine ek olarak çözümlenen commit'i içerir.

    Git'ten kurduktan sonra, Gateway yöntemleri ve CLI komutları gibi çalışma zamanı kayıtlarını doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. Plugin `api.registerCli` ile bir CLI kökü kaydettiyse, o komutu doğrudan OpenClaw kök CLI üzerinden çalıştırın; örneğin `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arşivler">
    Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Yerel OpenClaw Plugin arşivleri, çıkarılan Plugin kökünde geçerli bir `openclaw.plugin.json` içermelidir; yalnızca `package.json` içeren arşivler, OpenClaw kurulum kayıtlarını yazmadan önce reddedilir.

    Claude marketplace kurulumları da desteklenir.

  </Accordion>
</AccordionGroup>

ClawHub kurulumları açık bir `clawhub:<package>` konumlandırıcısı kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Yalın npm güvenli Plugin spec'leri, lansman geçişi sırasında varsayılan olarak npm'den kurulur:

```bash
openclaw plugins install openclaw-codex-app-server
```

Yalnızca npm çözümlemesini açık hale getirmek için `npm:` kullanın:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw, kurulumdan önce duyurulan Plugin API / minimum Gateway uyumluluğunu kontrol eder. Seçilen ClawHub sürümü bir ClawPack yapısı yayımladığında, OpenClaw sürümlendirilmiş npm-pack `.tgz` dosyasını indirir, ClawHub özet üst bilgisini ve yapı özetini doğrular, ardından normal arşiv yoluyla kurar. ClawPack meta verisi olmayan eski ClawHub sürümleri hâlâ eski paket arşivi doğrulama yoluyla kurulur. Kaydedilen kurulumlar, sonraki güncellemeler için ClawHub kaynak meta verilerini, yapı türünü, npm bütünlüğünü, npm shasum değerini, tarball adını ve ClawPack özet bilgilerini saklar.
Sürümsüz ClawHub kurulumları, `openclaw plugins update` komutunun daha yeni ClawHub sürümlerini izleyebilmesi için sürümsüz bir kaydedilmiş spec tutar; `clawhub:pkg@1.2.3` ve `clawhub:pkg@beta` gibi açık sürüm veya etiket seçicileri bu seçiciye sabitlenmiş olarak kalır.

#### Marketplace kısaltması

Marketplace adı Claude'un `~/.claude/plugins/known_marketplaces.json` konumundaki yerel kayıt önbelleğinde varsa `plugin@marketplace` kısaltmasını kullanın:

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
  <Tab title="Pazaryeri kaynakları">
    - `~/.claude/plugins/known_marketplaces.json` içinden Claude tarafından bilinen bir pazaryeri adı
    - yerel bir pazaryeri kökü veya `marketplace.json` yolu
    - `owner/repo` gibi bir GitHub repo kısaltması
    - `https://github.com/owner/repo` gibi bir GitHub repo URL'si
    - bir git URL'si

  </Tab>
  <Tab title="Uzak pazaryeri kuralları">
    GitHub veya git üzerinden yüklenen uzak pazaryerleri için Plugin girdileri klonlanan pazaryeri reposunun içinde kalmalıdır. OpenClaw, o repodan gelen göreli yol kaynaklarını kabul eder ve uzak manifestlerden gelen HTTP(S), mutlak yol, git, GitHub ve diğer yol olmayan Plugin kaynaklarını reddeder.
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
  Tablo görünümünden, kaynak/köken/sürüm/etkinleştirme meta verileriyle Plugin başına ayrıntı satırlarına geç.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir envanter ile kayıt defteri tanıları ve paket bağımlılığı kurulum durumu.
</ParamField>

<Note>
`plugins list`, önce kalıcı yerel Plugin kayıt defterini okur; kayıt defteri eksik veya geçersiz olduğunda yalnızca manifestten türetilmiş bir yedeğe döner. Bir Plugin'in kurulu, etkin ve soğuk başlatma planlamasında görünür olup olmadığını denetlemek için yararlıdır, ancak halihazırda çalışan bir Gateway sürecinin canlı çalışma zamanı yoklaması değildir. Plugin kodunu, etkinleştirmeyi, hook politikasını veya `plugins.load.paths` ayarını değiştirdikten sonra yeni `register(api)` kodunun ya da hook'ların çalışmasını beklemeden önce kanala hizmet veren Gateway'i yeniden başlatın. Uzak/konteyner dağıtımlarında, yalnızca bir sarmalayıcı süreci değil, gerçek `openclaw gateway run` alt sürecini yeniden başlattığınızı doğrulayın.

`plugins list --json`, her Plugin'in `package.json` içindeki `dependencies` ve
`optionalDependencies` alanlarından gelen `dependencyStatus` bilgisini içerir. OpenClaw, bu paket
adlarının Plugin'in normal Node `node_modules` arama yolunda bulunup bulunmadığını denetler; Plugin çalışma zamanı kodunu
içe aktarmaz, paket yöneticisi çalıştırmaz veya eksik bağımlılıkları onarmaz.
</Note>

`plugins search`, uzak bir ClawHub katalog aramasıdır. Yerel durumu incelemez,
yapılandırmayı değiştirmez, paket kurmaz veya Plugin çalışma zamanı kodunu yüklemez. Arama
sonuçları ClawHub paket adını, ailesini, kanalını, sürümünü, özetini ve
`openclaw plugins install clawhub:<package>` gibi bir kurulum ipucunu içerir.

Paketlenmiş bir Docker imajının içinde paketlenmiş Plugin çalışması için Plugin
kaynak dizinini, örneğin `/app/extensions/synology-chat` gibi eşleşen paketlenmiş kaynak yolunun
üzerine bind-mount edin. OpenClaw bu bağlanan kaynak
katmanını `/app/dist/extensions/synology-chat` öncesinde keşfeder; düz kopyalanmış bir kaynak
dizini pasif kalır, böylece normal paketlenmiş kurulumlar derlenmiş dist'i kullanmaya devam eder.

Çalışma zamanı hook hata ayıklaması için:

- `openclaw plugins inspect <id> --runtime --json`, modül yüklemeli inceleme geçişinden kayıtlı hook'ları ve tanıları gösterir. Çalışma zamanı incelemesi bağımlılıkları asla kurmaz; eski bağımlılık durumunu temizlemek veya eksik yapılandırılmış indirilebilir Plugin'leri kurmak için `openclaw doctor --fix` kullanın.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway'i, hizmet/süreç ipuçlarını, yapılandırma yolunu ve RPC sağlığını doğrular.
- Paketlenmemiş konuşma hook'ları (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.

Yerel bir dizini kopyalamaktan kaçınmak için `--link` kullanın (`plugins.load.paths` içine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
Bağlantılı kurulumlar yönetilen kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullandığı için `--force`, `--link` ile desteklenmez.

Varsayılan davranışı sabitlenmemiş tutarken çözümlenen kesin spec'i (`name@version`) yönetilen Plugin dizinine kaydetmek için npm kurulumlarında `--pin` kullanın.
</Note>

### Plugin dizini

Plugin kurulum meta verileri kullanıcı yapılandırması değil, makine tarafından yönetilen durumdur. Kurulumlar ve güncellemeler bunu etkin OpenClaw durum dizini altında `plugins/installs.json` dosyasına yazar. En üst düzey `installRecords` haritası, bozuk veya eksik Plugin manifest kayıtları dahil olmak üzere kurulum meta verilerinin kalıcı kaynağıdır. `plugins` dizisi, manifestten türetilmiş soğuk kayıt defteri önbelleğidir. Dosya düzenlemeyin uyarısı içerir ve `openclaw plugins update`, kaldırma, tanılar ve soğuk Plugin kayıt defteri tarafından kullanılır.

OpenClaw, yapılandırmada gönderilmiş eski `plugins.installs` kayıtlarını gördüğünde bunları Plugin dizinine taşır ve yapılandırma anahtarını kaldırır; yazma işlemlerinden biri başarısız olursa kurulum meta verilerinin kaybolmaması için yapılandırma kayıtları korunur.

### Kaldırma

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, uygulanabildiğinde Plugin kayıtlarını `plugins.entries` içinden, kalıcı Plugin dizininden, Plugin izin/ret listesi girdilerinden ve bağlantılı `plugins.load.paths` girdilerinden kaldırır. `--keep-files` ayarlanmadığı sürece kaldırma, OpenClaw'ın Plugin extensions kökünün içindeyse izlenen yönetilen kurulum dizinini de kaldırır. Active Memory Plugin'leri için bellek slotu `memory-core` değerine sıfırlanır.

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

Güncellemeler, yönetilen Plugin dizinindeki izlenen Plugin kurulumlarına ve `hooks.internal.installs` içindeki izlenen hook paketi kurulumlarına uygulanır.

<AccordionGroup>
  <Accordion title="Plugin kimliğini npm spec'e karşı çözümleme">
    Bir Plugin kimliği ilettiğinizde OpenClaw, o Plugin için kaydedilmiş kurulum spec'ini yeniden kullanır. Bu, daha önce saklanan `@beta` gibi dist-tag'lerin ve tam sabitlenmiş sürümlerin sonraki `update <id>` çalıştırmalarında kullanılmaya devam edeceği anlamına gelir.

    npm kurulumları için dist-tag veya tam sürüm içeren açık bir npm paket spec'i de iletebilirsiniz. OpenClaw bu paket adını izlenen Plugin kaydına geri çözümler, kurulu Plugin'i günceller ve gelecekte kimlik tabanlı güncellemeler için yeni npm spec'ini kaydeder.

    npm paket adını sürüm veya etiket olmadan iletmek de izlenen Plugin kaydına geri çözümlenir. Bir Plugin tam bir sürüme sabitlenmişse ve onu kayıt defterinin varsayılan yayın çizgisine geri taşımak istiyorsanız bunu kullanın.

  </Accordion>
  <Accordion title="Beta kanal güncellemeleri">
    `openclaw plugins update`, yeni bir spec iletmediğiniz sürece izlenen Plugin spec'ini yeniden kullanır. `openclaw update` ayrıca etkin OpenClaw güncelleme kanalını bilir: beta kanalında, varsayılan çizgi npm ve ClawHub Plugin kayıtları önce `@beta` denemesi yapar, ardından Plugin beta yayını yoksa kaydedilmiş varsayılan/latest spec'e geri döner. Tam sürümler ve açık etiketler o seçiciye sabitlenmiş kalır.

  </Accordion>
  <Accordion title="Sürüm denetimleri ve bütünlük sapması">
    Canlı bir npm güncellemesinden önce OpenClaw, kurulu paket sürümünü npm kayıt defteri meta verilerine göre denetler. Kurulu sürüm ve kaydedilmiş artifact kimliği çözümlenen hedefle zaten eşleşiyorsa güncelleme indirmeden, yeniden kurmadan veya `openclaw.json` dosyasını yeniden yazmadan atlanır.

    Saklanan bir bütünlük hash'i varsa ve getirilen artifact hash'i değişirse OpenClaw bunu npm artifact sapması olarak ele alır. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek hash'leri yazdırır ve devam etmeden önce onay ister. Etkileşimsiz güncelleme yardımcıları, çağıran açık bir devam politikası sağlamadığı sürece kapalı şekilde başarısız olur.

  </Accordion>
  <Accordion title="Güncellemede --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, Plugin güncellemeleri sırasında yerleşik tehlikeli kod taraması yanlış pozitifleri için acil durum geçersiz kılması olarak `plugins update` üzerinde de kullanılabilir. Yine de Plugin `before_install` politika engellerini veya tarama hatası engellemesini atlamaz ve hook paketi güncellemelerine değil, yalnızca Plugin güncellemelerine uygulanır.
  </Accordion>
</AccordionGroup>

### İnceleme

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect varsayılan olarak Plugin çalışma zamanını içe aktarmadan kimliği, yükleme durumunu, kaynağı, manifest yeteneklerini, politika bayraklarını, tanıları, kurulum meta verilerini, paket yeteneklerini ve algılanan MCP veya LSP sunucu desteğini gösterir. Plugin modülünü yüklemek ve kayıtlı hook'ları, araçları, komutları, hizmetleri, Gateway yöntemlerini ve HTTP rotalarını dahil etmek için `--runtime` ekleyin. Çalışma zamanı incelemesi eksik Plugin bağımlılıklarını doğrudan raporlar; kurulumlar ve onarımlar `openclaw plugins install`, `openclaw plugins update` ve `openclaw doctor --fix` içinde kalır.

Plugin'in sahip olduğu CLI komutları kök `openclaw` komut grupları olarak kurulur. `inspect --runtime`, `cliCommands` altında bir komut gösterdikten sonra bunu `openclaw <command> ...` olarak çalıştırın; örneğin `demo-git` kaydeden bir Plugin, `openclaw demo-git ping` ile doğrulanabilir.

Her Plugin, çalışma zamanında gerçekten kaydettiği şeye göre sınıflandırılır:

- **plain-capability** — tek bir yetenek türü (ör. yalnızca sağlayıcı olan bir Plugin)
- **hybrid-capability** — birden fazla yetenek türü (ör. metin + konuşma + görüntüler)
- **hook-only** — yalnızca hook'lar, yetenek veya yüzey yok
- **non-capability** — araçlar/komutlar/hizmetler var ancak yetenek yok

Yetenek modeli hakkında daha fazla bilgi için [Plugin biçimleri](/tr/plugins/architecture#plugin-shapes) bölümüne bakın.

<Note>
`--json` bayrağı, betikleme ve denetim için uygun makine tarafından okunabilir bir rapor üretir. `inspect --all`, şekil, yetenek türleri, uyumluluk bildirimleri, paket yetenekleri ve hook özeti sütunlarıyla tüm filoyu kapsayan bir tablo oluşturur. `info`, `inspect` için bir takma addır.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, Plugin yükleme hatalarını, manifest/keşif tanılarını ve uyumluluk bildirimlerini raporlar. Her şey temiz olduğunda `No plugin issues detected.` yazdırır.

Yapılandırılmış bir Plugin diskte mevcutsa ancak yükleyicinin yol güvenliği denetimleri tarafından engelleniyorsa yapılandırma doğrulaması Plugin girdisini korur ve onu `present but blocked` olarak raporlar. `plugins.entries.<id>` veya `plugins.allow` yapılandırmasını kaldırmak yerine yol sahipliği ya da herkes tarafından yazılabilir izinler gibi önceki engellenmiş Plugin tanısını düzeltin.

Eksik `register`/`activate` dışa aktarımları gibi modül şekli hataları için tanı çıktısına kompakt bir dışa aktarım şekli özeti eklemek üzere `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Kayıt defteri

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Yerel Plugin kayıt defteri, OpenClaw'ın kurulu Plugin kimliği, etkinleştirme, kaynak meta verileri ve katkı sahipliği için kalıcı soğuk okuma modelidir. Normal başlatma, sağlayıcı sahip araması, kanal kurulumu sınıflandırması ve Plugin envanteri, Plugin çalışma zamanı modüllerini içe aktarmadan bunu okuyabilir.

`plugins registry` komutunu kullanarak kalıcı registry'nin mevcut, güncel veya eski olup olmadığını inceleyin. Kalıcı Plugin dizini, yapılandırma ilkesi ve manifest/paket meta verilerinden yeniden oluşturmak için `--refresh` kullanın. Bu bir onarım yoludur, çalışma zamanı etkinleştirme yolu değildir.

`openclaw doctor --fix` ayrıca registry ile ilişkili yönetilen npm sapmasını onarır: yönetilen Plugin npm kökü altında sahipsiz veya kurtarılmış bir `@openclaw/*` paketi birlikte gelen bir Plugin'i gölgeliyorsa, doctor bu eski paketi kaldırır ve startup'ın birlikte gelen manifest'e göre doğrulama yapması için registry'yi yeniden oluşturur.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`, registry okuma hataları için kullanımdan kaldırılmış bir acil durum uyumluluk anahtarıdır. `plugins registry --refresh` veya `openclaw doctor --fix` tercih edin; env yedek yolu, geçiş kullanıma alınırken yalnızca acil startup kurtarma içindir.
</Warning>

### Pazar Yeri

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Pazar yeri listesi yerel bir pazar yeri yolunu, bir `marketplace.json` yolunu, `owner/repo` gibi bir GitHub kısaltmasını, bir GitHub repo URL'sini veya bir git URL'sini kabul eder. `--json`, çözümlenen kaynak etiketinin yanı sıra ayrıştırılan pazar yeri manifest'ini ve Plugin girdilerini yazdırır.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [CLI başvurusu](/tr/cli)
- [Topluluk Plugin'leri](/tr/plugins/community)
