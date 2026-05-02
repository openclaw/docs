---
read_when:
    - Gateway Plugin'lerini veya uyumlu paketleri yüklemek ya da yönetmek istiyorsunuz
    - Plugin yükleme hatalarında hata ayıklamak istiyorsunuz
sidebarTitle: Plugins
summary: '`openclaw plugins` için CLI referansı (list, install, marketplace, uninstall, enable/disable, doctor)'
title: Pluginler
x-i18n:
    generated_at: "2026-05-02T20:43:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc046a04175c1b22f787920bf5ec28c24d0bb7d62eda4d9517da8f5dbac4c50
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Pluginlerini, hook paketlerini ve uyumlu paketleri yönetin.

<CardGroup cols={2}>
  <Card title="Plugin sistemi" href="/tr/tools/plugin">
    Pluginleri kurma, etkinleştirme ve sorun giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Pluginleri yönet" href="/tr/plugins/manage-plugins">
    Kurulum, listeleme, güncelleme, kaldırma ve yayımlama için hızlı örnekler.
  </Card>
  <Card title="Plugin paketleri" href="/tr/plugins/bundles">
    Paket uyumluluk modeli.
  </Card>
  <Card title="Plugin manifesti" href="/tr/plugins/manifest">
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

Yavaş kurulum, inceleme, kaldırma veya registry yenileme araştırması için komutu
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ile çalıştırın. İz, aşama zamanlamalarını
stderr'e yazar ve JSON çıktısının ayrıştırılabilir kalmasını sağlar. Bkz. [Hata Ayıklama](/tr/help/debugging#plugin-lifecycle-trace).

<Note>
Paketlenmiş pluginler OpenClaw ile birlikte gelir. Bazıları varsayılan olarak etkindir (örneğin paketlenmiş model sağlayıcıları, paketlenmiş konuşma sağlayıcıları ve paketlenmiş tarayıcı plugini); diğerleri `plugins enable` gerektirir.

Yerel OpenClaw pluginleri, satır içi JSON Schema (`configSchema`, boş olsa bile) ile birlikte `openclaw.plugin.json` göndermelidir. Uyumlu paketler bunun yerine kendi paket manifestlerini kullanır.

`plugins list`, `Format: openclaw` veya `Format: bundle` gösterir. Ayrıntılı liste/bilgi çıktısı ayrıca paket alt türünü (`codex`, `claude` veya `cursor`) ve algılanan paket yeteneklerini gösterir.
</Note>

### Kurulum

```bash
openclaw plugins search "calendar"                   # ClawHub pluginlerini ara
openclaw plugins install <package>                      # varsayılan olarak npm
openclaw plugins install clawhub:<package>              # yalnızca ClawHub
openclaw plugins install npm:<package>                  # yalnızca npm
openclaw plugins install git:github.com/<owner>/<repo>  # git deposu
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # mevcut kurulumu üzerine yaz
openclaw plugins install <package> --pin                # sürümü sabitle
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # yerel yol
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (açık)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Çıplak paket adları, başlatma geçişi sırasında varsayılan olarak npm'den kurulur. ClawHub için `clawhub:<package>` kullanın. Plugin kurulumlarını kod çalıştırmak gibi değerlendirin. Sabitlenmiş sürümleri tercih edin.
</Warning>

`plugins search`, kurulabilir plugin paketleri için ClawHub'ı sorgular ve
kuruluma hazır paket adlarını yazdırır. Skills değil, kod plugini ve paket plugini paketlerini arar. ClawHub Skills için `openclaw skills search` kullanın.

<Note>
ClawHub çoğu plugin için birincil dağıtım ve keşif yüzeyidir. Npm
desteklenen bir geri dönüş ve doğrudan kurulum yolu olmaya devam eder. ClawHub'a geçiş sırasında
OpenClaw, OpenClaw'a ait bazı `@openclaw/*` plugin paketlerini hâlâ
npm üzerinde gönderir; bu paket sürümleri, plugin yayın
trenleri arasında paketlenmiş kaynağın gerisinde kalabilir. npm, OpenClaw'a ait bir plugin paketini kullanımdan kaldırılmış olarak bildirirse, o
yayımlanmış sürüm eski bir harici artefakttır; daha yeni bir npm paketi yayımlanana kadar
güncel OpenClaw ile paketlenmiş plugini veya yerel bir checkout kullanın.
</Note>

<AccordionGroup>
  <Accordion title="Yapılandırma include'ları ve geçersiz yapılandırma kurtarma">
    `plugins` bölümünüz tek dosyalı bir `$include` tarafından destekleniyorsa, `plugins install/update/enable/disable/uninstall` o dahil edilen dosyaya yazar ve `openclaw.json` dosyasına dokunmaz. Kök include'lar, include dizileri ve kardeş geçersiz kılmalar içeren include'lar düzleştirilmek yerine kapalı şekilde başarısız olur. Desteklenen biçimler için [Yapılandırma include'ları](/tr/gateway/configuration) bölümüne bakın.

    Kurulum sırasında yapılandırma geçersizse, `plugins install` normalde kapalı şekilde başarısız olur ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Gateway başlatılırken, bir pluginin geçersiz yapılandırması o pluginle sınırlandırılır, böylece diğer kanallar ve pluginler çalışmaya devam edebilir; `openclaw doctor --fix` geçersiz plugin girdisini karantinaya alabilir. Belgelenmiş tek kurulum zamanı istisnası, açıkça `openclaw.install.allowInvalidConfigRecovery` seçeneğine katılan pluginler için dar bir paketlenmiş-plugin kurtarma yoludur.

  </Accordion>
  <Accordion title="--force ve yeniden kurulum ile güncelleme">
    `--force`, mevcut kurulum hedefini yeniden kullanır ve zaten kurulmuş bir plugini veya hook paketini yerinde üzerine yazar. Aynı kimliği yeni bir yerel yoldan, arşivden, ClawHub paketinden veya npm artefaktından bilinçli olarak yeniden kurduğunuzda kullanın. Zaten izlenen bir npm plugininin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` komutunu tercih edin.

    Zaten kurulu olan bir plugin kimliği için `plugins install` çalıştırırsanız, OpenClaw durur ve normal yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna ya da geçerli kurulumu gerçekten farklı bir kaynaktan üzerine yazmak istediğinizde `plugins install <package> --force` komutuna yönlendirir.

  </Accordion>
  <Accordion title="--pin kapsamı">
    `--pin` yalnızca npm kurulumlarına uygulanır. `git:` kurulumlarıyla desteklenmez; sabitlenmiş bir kaynak istediğinizde `git:github.com/acme/plugin@v1.2.3` gibi açık bir git ref kullanın. `--marketplace` ile desteklenmez, çünkü marketplace kurulumları npm spec yerine marketplace kaynak meta verilerini kalıcı hale getirir.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısındaki yanlış pozitifler için acil durum seçeneğidir. Yerleşik tarayıcı `critical` bulguları bildirse bile kurulumun devam etmesine izin verir, ancak plugin `before_install` hook ilke engellerini **atlamaz** ve tarama hatalarını **atlamaz**.

    Bu CLI bayrağı plugin kurulum/güncelleme akışlarına uygulanır. Gateway destekli skill bağımlılık kurulumları eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanırken, `openclaw skills install` ayrı bir ClawHub skill indirme/kurulum akışı olarak kalır.

    ClawHub'da yayımladığınız bir plugin registry taraması tarafından engellenirse, [ClawHub](/tr/tools/clawhub) bölümündeki yayımcı adımlarını kullanın.

  </Accordion>
  <Accordion title="Hook paketleri ve npm spec'leri">
    `plugins install`, `package.json` içinde `openclaw.hooks` sunan hook paketleri için de kurulum yüzeyidir. Paket kurulumu için değil, filtrelenmiş hook görünürlüğü ve hook başına etkinleştirme için `openclaw hooks` kullanın.

    Npm spec'leri **yalnızca registry** kapsamındadır (paket adı + isteğe bağlı **tam sürüm** veya **dist-tag**). Git/URL/dosya spec'leri ve semver aralıkları reddedilir. Bağımlılık kurulumları, kabuğunuzda global npm kurulum ayarları olsa bile güvenlik için `--ignore-scripts` ile proje yerelinde çalışır.

    npm çözümlemesini açık hale getirmek istediğinizde `npm:<package>` kullanın. Çıplak paket spec'leri de başlatma geçişi sırasında doğrudan npm'den kurulur.

    Çıplak spec'ler ve `@latest` kararlı kanalda kalır. npm bunlardan birini ön sürüme çözümlerse, OpenClaw durur ve `@beta`/`@rc` gibi bir ön sürüm etiketiyle veya `@1.2.3-beta.4` gibi tam bir ön sürümle açıkça katılmanızı ister.

    Çıplak kurulum spec'i resmi bir plugin kimliğiyle eşleşirse (örneğin `diffs`), OpenClaw katalog girdisini doğrudan kurar. Aynı ada sahip bir npm paketi kurmak için açık kapsamlı bir spec kullanın (örneğin `@scope/diffs`).

  </Accordion>
  <Accordion title="Git depoları">
    Doğrudan bir git deposundan kurulum yapmak için `git:<repo>` kullanın. Desteklenen biçimler arasında `git:github.com/owner/repo`, `git:owner/repo`, tam `https://`, `ssh://`, `git://`, `file://` ve `git@host:owner/repo.git` klon URL'leri bulunur. Kurulumdan önce bir dalı, etiketi veya commit'i checkout etmek için `@<ref>` veya `#<ref>` ekleyin.

    Git kurulumları geçici bir dizine klonlar, varsa istenen ref'i checkout eder, ardından normal plugin dizini kurucusunu kullanır. Bu, manifest doğrulaması, tehlikeli kod taraması, paket yöneticisi kurulum işi ve kurulum kayıtlarının npm kurulumları gibi davrandığı anlamına gelir. Kaydedilen git kurulumları, kaynak URL/ref'i ve çözümlenen commit'i içerir, böylece `openclaw plugins update` kaynağı daha sonra yeniden çözümleyebilir.

    Git'ten kurduktan sonra gateway yöntemleri ve CLI komutları gibi runtime kayıtlarını doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. Plugin `api.registerCli` ile bir CLI kökü kaydettiyse, bu komutu doğrudan OpenClaw kök CLI üzerinden çalıştırın; örneğin `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arşivler">
    Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Yerel OpenClaw plugin arşivleri, çıkarılan plugin kökünde geçerli bir `openclaw.plugin.json` içermelidir; yalnızca `package.json` içeren arşivler, OpenClaw kurulum kayıtlarını yazmadan önce reddedilir.

    Claude marketplace kurulumları da desteklenir.

  </Accordion>
</AccordionGroup>

ClawHub kurulumları açık bir `clawhub:<package>` konumlandırıcısı kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Çıplak npm güvenli plugin spec'leri, başlatma geçişi sırasında varsayılan olarak npm'den kurulur:

```bash
openclaw plugins install openclaw-codex-app-server
```

Yalnızca npm çözümlemesini açık hale getirmek için `npm:` kullanın:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw, kurulumdan önce duyurulan plugin API / minimum gateway uyumluluğunu denetler. Seçilen ClawHub sürümü bir ClawPack artefaktı yayımladığında, OpenClaw sürümlendirilmiş npm-pack `.tgz` dosyasını indirir, ClawHub digest header'ını ve artefakt digest'ini doğrular, ardından normal arşiv yolu üzerinden kurar. ClawPack meta verisi olmayan eski ClawHub sürümleri, eski paket arşivi doğrulama yolu üzerinden kurulmaya devam eder. Kaydedilen kurulumlar, sonraki güncellemeler için ClawHub kaynak meta verilerini, artefakt türünü, npm integrity değerini, npm shasum değerini, tarball adını ve ClawPack digest bilgilerini korur.
Sürümsüz ClawHub kurulumları, `openclaw plugins update` komutunun daha yeni ClawHub yayınlarını takip edebilmesi için sürümsüz kaydedilmiş bir spec tutar; `clawhub:pkg@1.2.3` ve `clawhub:pkg@beta` gibi açık sürüm veya etiket seçicileri o seçiciye sabitlenmiş kalır.

#### Marketplace kısaltması

Marketplace adı Claude'un `~/.claude/plugins/known_marketplaces.json` konumundaki yerel registry önbelleğinde mevcut olduğunda `plugin@marketplace` kısaltmasını kullanın:

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
    GitHub veya git üzerinden yüklenen uzak marketplace'ler için, Plugin girdileri klonlanan marketplace reposunun içinde kalmalıdır. OpenClaw bu repodan göreli yol kaynaklarını kabul eder ve uzak manifestlerden gelen HTTP(S), mutlak yol, git, GitHub ve diğer yol olmayan Plugin kaynaklarını reddeder.
  </Tab>
</Tabs>

Yerel yollar ve arşivler için OpenClaw şunları otomatik algılar:

- yerel OpenClaw Plugin'leri (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya varsayılan Claude bileşen düzeni)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

<Note>
Uyumlu paketler normal Plugin köküne kurulur ve aynı liste/bilgi/etkinleştirme/devre dışı bırakma akışına katılır. Bugün paket Skills, Claude komut-Skills'leri, Claude `settings.json` varsayılanları, Claude `.lsp.json` / manifest tarafından bildirilen `lspServers` varsayılanları, Cursor komut-Skills'leri ve uyumlu Codex hook dizinleri desteklenir; algılanan diğer paket yetenekleri tanılarda/bilgide gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmamıştır.
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
  Yalnızca etkinleştirilmiş Plugin'leri göster.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Tablo görünümünden Plugin başına kaynak/köken/sürüm/etkinleştirme meta verilerini içeren ayrıntı satırlarına geç.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir envanter, registry tanıları ve paket bağımlılığı kurulum durumu.
</ParamField>

<Note>
`plugins list`, kalıcı yerel Plugin registry'sini önce okur; registry eksik veya geçersizse yalnızca manifestten türetilmiş bir yedeğe düşer. Bir Plugin'in kurulu, etkin ve soğuk başlangıç planlamasına görünür olup olmadığını denetlemek için kullanışlıdır, ancak zaten çalışan bir Gateway sürecinin canlı çalışma zamanı sondası değildir. Plugin kodunu, etkinleştirmeyi, hook politikasını veya `plugins.load.paths` değerini değiştirdikten sonra, yeni `register(api)` kodunun veya hook'ların çalışmasını beklemeden önce kanala hizmet veren Gateway'i yeniden başlatın. Uzak/konteyner dağıtımları için yalnızca bir sarmalayıcı süreci değil, gerçek `openclaw gateway run` alt sürecini yeniden başlattığınızı doğrulayın.

`plugins list --json`, her Plugin'in `package.json` içindeki `dependencies` ve `optionalDependencies` üzerinden gelen `dependencyStatus` bilgisini içerir. OpenClaw bu paket adlarının Plugin'in normal Node `node_modules` arama yolu üzerinde bulunup bulunmadığını denetler; Plugin çalışma zamanı kodunu içe aktarmaz, paket yöneticisi çalıştırmaz veya eksik bağımlılıkları onarmaz.
</Note>

`plugins search`, uzak bir ClawHub katalog aramasıdır. Yerel durumu incelemez, config'i değiştirmez, paket kurmaz veya Plugin çalışma zamanı kodunu yüklemez. Arama sonuçları ClawHub paket adını, ailesini, kanalını, sürümünü, özetini ve `openclaw plugins install clawhub:<package>` gibi bir kurulum ipucunu içerir.

Paketlenmiş bir Docker imajı içindeki gömülü Plugin çalışmaları için, Plugin kaynak dizinini `/app/extensions/synology-chat` gibi eşleşen paketlenmiş kaynak yolunun üzerine bind-mount edin. OpenClaw bu bağlanan kaynak katmanını `/app/dist/extensions/synology-chat` öncesinde keşfeder; düz kopyalanmış bir kaynak dizini inert kalır, böylece normal paketlenmiş kurulumlar derlenmiş dist'i kullanmaya devam eder.

Çalışma zamanı hook hata ayıklaması için:

- `openclaw plugins inspect <id> --runtime --json`, modül yüklemeli bir inceleme geçişinden kayıtlı hook'ları ve tanıları gösterir. Çalışma zamanı incelemesi hiçbir zaman bağımlılık kurmaz; eski bağımlılık durumunu temizlemek veya eksik yapılandırılmış indirilebilir Plugin'leri kurmak için `openclaw doctor --fix` kullanın.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway'i, hizmet/süreç ipuçlarını, config yolunu ve RPC sağlığını doğrular.
- Gömülü olmayan konuşma hook'ları (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.

Yerel bir dizini kopyalamaktan kaçınmak için `--link` kullanın (`plugins.load.paths` içine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force`, `--link` ile desteklenmez çünkü bağlantılı kurulumlar yönetilen kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullanır.

Varsayılan davranışı sabitlenmemiş tutarken, çözümlenen tam spec'i (`name@version`) yönetilen Plugin dizinine kaydetmek için npm kurulumlarında `--pin` kullanın.
</Note>

### Plugin dizini

Plugin kurulum meta verileri kullanıcı config'i değil, makine tarafından yönetilen durumdur. Kurulumlar ve güncellemeler bunu etkin OpenClaw durum dizini altında `plugins/installs.json` dosyasına yazar. Üst düzey `installRecords` haritası, bozuk veya eksik Plugin manifestlerine ait kayıtlar dahil olmak üzere kurulum meta verilerinin kalıcı kaynağıdır. `plugins` dizisi, manifestten türetilmiş soğuk registry önbelleğidir. Dosya bir düzenlemeyin uyarısı içerir ve `openclaw plugins update`, kaldırma, tanılar ve soğuk Plugin registry'si tarafından kullanılır.

OpenClaw config içinde gönderilmiş eski `plugins.installs` kayıtları gördüğünde, bunları Plugin dizinine taşır ve config anahtarını kaldırır; yazma işlemlerinden biri başarısız olursa, kurulum meta verilerinin kaybolmaması için config kayıtları tutulur.

### Kaldır

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, uygun olduğunda Plugin kayıtlarını `plugins.entries` içinden, kalıcı Plugin dizininden, Plugin izin/verme listesi girdilerinden ve bağlantılı `plugins.load.paths` girdilerinden kaldırır. `--keep-files` ayarlanmadığı sürece kaldırma işlemi, OpenClaw'ın Plugin uzantıları kökü içindeyse izlenen yönetilen kurulum dizinini de kaldırır. Active Memory Plugin'leri için bellek slotu `memory-core` değerine sıfırlanır.

<Note>
`--keep-config`, `--keep-files` için kullanımdan kaldırılmış bir takma ad olarak desteklenir.
</Note>

### Güncelle

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Güncellemeler, yönetilen Plugin dizinindeki izlenen Plugin kurulumlarına ve `hooks.internal.installs` içindeki izlenen hook-pack kurulumlarına uygulanır.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Bir Plugin id'si verdiğinizde OpenClaw o Plugin için kaydedilmiş kurulum spec'ini yeniden kullanır. Bu, önceden saklanan `@beta` gibi dist-tag'lerin ve tam sabitlenmiş sürümlerin sonraki `update <id>` çalıştırmalarında kullanılmaya devam edeceği anlamına gelir.

    npm kurulumları için dist-tag veya tam sürüm içeren açık bir npm paket spec'i de verebilirsiniz. OpenClaw bu paket adını izlenen Plugin kaydına geri çözümler, kurulu Plugin'i günceller ve gelecekte id tabanlı güncellemeler için yeni npm spec'ini kaydeder.

    npm paket adını sürüm veya etiket olmadan vermek de izlenen Plugin kaydına geri çözümlenir. Bir Plugin tam bir sürüme sabitlenmişse ve onu registry'nin varsayılan yayın hattına geri taşımak istiyorsanız bunu kullanın.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update`, yeni bir spec vermediğiniz sürece izlenen Plugin spec'ini yeniden kullanır. `openclaw update` ayrıca etkin OpenClaw güncelleme kanalını bilir: beta kanalında, varsayılan hat npm ve ClawHub Plugin kayıtları önce `@beta` değerini dener, sonra Plugin beta yayını yoksa kaydedilmiş varsayılan/latest spec'e geri döner. Tam sürümler ve açık etiketler o seçiciye sabitlenmiş kalır.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Canlı bir npm güncellemesinden önce OpenClaw, kurulu paket sürümünü npm registry meta verilerine karşı denetler. Kurulu sürüm ve kaydedilmiş artifact kimliği çözümlenen hedefle zaten eşleşiyorsa, güncelleme indirme, yeniden kurma veya `openclaw.json` yeniden yazma olmadan atlanır.

    Saklanan bir integrity hash'i mevcutsa ve getirilen artifact hash'i değişirse, OpenClaw bunu npm artifact sapması olarak ele alır. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek hash'leri yazdırır ve devam etmeden önce onay ister. Etkileşimsiz güncelleme yardımcıları, çağıran açık bir devam politikası sağlamadıkça kapalı başarısız olur.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install`, Plugin güncellemeleri sırasında yerleşik tehlikeli kod taraması yanlış pozitifleri için acil durum geçersiz kılması olarak `plugins update` üzerinde de kullanılabilir. Yine de Plugin `before_install` politika engellerini veya tarama hatası engellemesini baypas etmez ve yalnızca Plugin güncellemelerine uygulanır, hook-pack güncellemelerine uygulanmaz.
  </Accordion>
</AccordionGroup>

### İncele

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect, varsayılan olarak Plugin çalışma zamanını içe aktarmadan kimliği, yükleme durumunu, kaynağı, manifest yeteneklerini, politika bayraklarını, tanıları, kurulum meta verilerini, paket yeteneklerini ve algılanan MCP veya LSP sunucu desteğini gösterir. Plugin modülünü yüklemek ve kayıtlı hook'ları, araçları, komutları, hizmetleri, gateway yöntemlerini ve HTTP rotalarını dahil etmek için `--runtime` ekleyin. Çalışma zamanı incelemesi eksik Plugin bağımlılıklarını doğrudan bildirir; kurulumlar ve onarımlar `openclaw plugins install`, `openclaw plugins update` ve `openclaw doctor --fix` içinde kalır.

Plugin tarafından sahiplenilen CLI komutları kök `openclaw` komut grupları olarak kurulur. `inspect --runtime`, `cliCommands` altında bir komut gösterdikten sonra onu `openclaw <command> ...` olarak çalıştırın; örneğin `demo-git` kaydeden bir Plugin, `openclaw demo-git ping` ile doğrulanabilir.

Her Plugin çalışma zamanında gerçekte ne kaydettiğine göre sınıflandırılır:

- **plain-capability** — tek bir yetenek türü (ör. yalnızca sağlayıcı olan bir Plugin)
- **hybrid-capability** — birden fazla yetenek türü (ör. metin + konuşma + görüntüler)
- **hook-only** — yalnızca hook'lar, yetenek veya yüzey yok
- **non-capability** — araçlar/komutlar/hizmetler var ama yetenek yok

Yetenek modeli hakkında daha fazlası için [Plugin şekilleri](/tr/plugins/architecture#plugin-shapes) bölümüne bakın.

<Note>
`--json` bayrağı, betikleme ve denetim için uygun makine tarafından okunabilir bir rapor üretir. `inspect --all`, şekil, yetenek türleri, uyumluluk bildirimleri, paket yetenekleri ve hook özeti sütunları içeren filo genelinde bir tablo oluşturur. `info`, `inspect` için bir takma addır.
</Note>

### Doktor

```bash
openclaw plugins doctor
```

`doctor`, Plugin yükleme hatalarını, manifest/keşif tanılarını ve uyumluluk bildirimlerini bildirir. Her şey temiz olduğunda `No plugin issues detected.` yazdırır.

Eksik `register`/`activate` dışa aktarımları gibi modül şekli hataları için, tanı çıktısına kompakt bir dışa aktarım şekli özeti eklemek üzere `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Yerel Plugin registry'si, OpenClaw'ın kurulu Plugin kimliği, etkinleştirme, kaynak meta verileri ve katkı sahipliği için kalıcı soğuk okuma modelidir. Normal başlangıç, sağlayıcı sahibi araması, kanal kurulum sınıflandırması ve Plugin envanteri, Plugin çalışma zamanı modüllerini içe aktarmadan bunu okuyabilir.

Kalıcı registry'nin mevcut, güncel veya bayat olup olmadığını incelemek için `plugins registry` kullanın. Kalıcı Plugin dizininden, config politikasından ve manifest/paket meta verilerinden yeniden oluşturmak için `--refresh` kullanın. Bu bir onarım yoludur, çalışma zamanı etkinleştirme yolu değildir.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`, kayıt defteri okuma hataları için kullanımdan kaldırılmış bir acil durum uyumluluk anahtarıdır. `plugins registry --refresh` veya `openclaw doctor --fix` tercih edin; ortam değişkeni geri dönüşü, geçiş kullanıma alınırken yalnızca acil başlangıç kurtarması içindir.
</Warning>

### Pazar Yeri

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Pazar yeri listesi yerel bir pazar yeri yolunu, bir `marketplace.json` yolunu, `owner/repo` gibi bir GitHub kısaltmasını, bir GitHub repo URL'sini veya bir git URL'sini kabul eder. `--json`, çözümlenen kaynak etiketinin yanı sıra ayrıştırılan pazar yeri manifestini ve Plugin girdilerini yazdırır.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [CLI başvurusu](/tr/cli)
- [Topluluk Plugin'leri](/tr/plugins/community)
