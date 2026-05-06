---
read_when:
    - Gateway Plugin'lerini veya uyumlu paketleri yüklemek ya da yönetmek istiyorsunuz
    - Plugin yükleme hatalarını ayıklamak istiyorsunuz
sidebarTitle: Plugins
summary: '`openclaw plugins` için CLI başvurusu (list, install, marketplace, uninstall, enable/disable, doctor)'
title: Pluginler
x-i18n:
    generated_at: "2026-05-06T09:06:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: e584092c6cdaf87681aef2ed106c299e3bab0552305b669c66b05deb61bf25ce
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin’lerini, hook paketlerini ve uyumlu paketleri yönetin.

<CardGroup cols={2}>
  <Card title="Plugin sistemi" href="/tr/tools/plugin">
    Plugin’leri kurma, etkinleştirme ve sorun giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Plugin’leri yönet" href="/tr/plugins/manage-plugins">
    Kurulum, listeleme, güncelleme, kaldırma ve yayımlama için hızlı örnekler.
  </Card>
  <Card title="Plugin paketleri" href="/tr/plugins/bundles">
    Paket uyumluluk modeli.
  </Card>
  <Card title="Plugin manifesti" href="/tr/plugins/manifest">
    Manifest alanları ve yapılandırma şeması.
  </Card>
  <Card title="Güvenlik" href="/tr/gateway/security">
    Plugin kurulumları için güvenlik sağlamlaştırması.
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

Yavaş kurulum, inceleme, kaldırma veya kayıt yenileme incelemesi için komutu
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ile çalıştırın. İzleme, aşama sürelerini
stderr’ye yazar ve JSON çıktısını ayrıştırılabilir tutar. Bkz. [Hata ayıklama](/tr/help/debugging#plugin-lifecycle-trace).

<Note>
Paketlenmiş Plugin’ler OpenClaw ile birlikte gelir. Bazıları varsayılan olarak etkindir (örneğin paketlenmiş model sağlayıcıları, paketlenmiş konuşma sağlayıcıları ve paketlenmiş tarayıcı Plugin’i); diğerleri `plugins enable` gerektirir.

Yerel OpenClaw Plugin’leri satır içi JSON Schema (`configSchema`, boş olsa bile) içeren `openclaw.plugin.json` ile gönderilmelidir. Uyumlu paketler bunun yerine kendi paket manifestlerini kullanır.

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
Çıplak paket adları, lansman geçişi sırasında varsayılan olarak npm’den kurulur. ClawHub için `clawhub:<package>` kullanın. Plugin kurulumlarını kod çalıştırmak gibi değerlendirin. Sabitlenmiş sürümleri tercih edin.
</Warning>

`plugins search`, kurulabilir Plugin paketleri için ClawHub’ı sorgular ve
kuruluma hazır paket adlarını yazdırır. Skills değil, kod Plugin’i ve paket
Plugin’i paketlerini arar. ClawHub Skills için `openclaw skills search` kullanın.

<Note>
ClawHub, çoğu Plugin için birincil dağıtım ve keşif yüzeyidir. Npm
desteklenen bir geri dönüş ve doğrudan kurulum yolu olmaya devam eder. OpenClaw’a ait
`@openclaw/*` Plugin paketleri yeniden npm’de yayımlanmaktadır; geçerli listeye
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) üzerinden veya
[Plugin envanteri](/tr/plugins/plugin-inventory) üzerinden bakın. Kararlı kurulumlar `latest` kullanır.
Beta kanalı kurulumları ve güncellemeleri, bu etiket kullanılabilir olduğunda npm `beta` dist-tag’ini
tercih eder, ardından `latest`’e geri döner.
</Note>

<AccordionGroup>
  <Accordion title="Yapılandırma include’ları ve geçersiz yapılandırma onarımı">
    `plugins` bölümünüz tek dosyalı bir `$include` tarafından destekleniyorsa, `plugins install/update/enable/disable/uninstall` bu dahil edilen dosyaya yazar ve `openclaw.json` dosyasına dokunmaz. Kök include’lar, include dizileri ve kardeş geçersiz kılmaları olan include’lar düzleştirmek yerine kapalı başarısız olur. Desteklenen şekiller için [Yapılandırma include’ları](/tr/gateway/configuration) sayfasına bakın.

    Kurulum sırasında yapılandırma geçersizse, `plugins install` normalde kapalı başarısız olur ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Gateway başlatma ve sıcak yeniden yükleme sırasında geçersiz Plugin yapılandırması, diğer tüm geçersiz yapılandırmalar gibi kapalı başarısız olur; `openclaw doctor --fix` geçersiz Plugin girdisini karantinaya alabilir. Belgelenmiş tek kurulum zamanı istisnası, açıkça `openclaw.install.allowInvalidConfigRecovery` seçeneğini kullanan Plugin’ler için dar kapsamlı bir paketlenmiş Plugin kurtarma yoludur.

  </Accordion>
  <Accordion title="--force ve güncelleme yerine yeniden kurulum">
    `--force`, mevcut kurulum hedefini yeniden kullanır ve zaten kurulmuş bir Plugin’i veya hook paketini yerinde üzerine yazar. Aynı kimliği yeni bir yerel yoldan, arşivden, ClawHub paketinden veya npm yapıtından bilinçli olarak yeniden kurarken kullanın. Zaten izlenen bir npm Plugin’inin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` tercih edin.

    Zaten kurulu olan bir Plugin kimliği için `plugins install` çalıştırırsanız, OpenClaw durur ve normal bir yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna ya da mevcut kurulumu gerçekten farklı bir kaynaktan üzerine yazmak istediğinizde `plugins install <package> --force` komutuna yönlendirir.

  </Accordion>
  <Accordion title="--pin kapsamı">
    `--pin` yalnızca npm kurulumlarına uygulanır. `git:` kurulumlarıyla desteklenmez; sabitlenmiş bir kaynak istediğinizde `git:github.com/acme/plugin@v1.2.3` gibi açık bir git ref’i kullanın. `--marketplace` ile desteklenmez, çünkü marketplace kurulumları npm spec yerine marketplace kaynak meta verilerini kalıcı hale getirir.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısındaki yanlış pozitifler için olağanüstü durum seçeneğidir. Yerleşik tarayıcı `critical` bulgular bildirse bile kurulumun devam etmesine izin verir, ancak Plugin `before_install` hook ilke engellerini **atlamaz** ve tarama hatalarını **atlamaz**.

    Bu CLI bayrağı Plugin kurulum/güncelleme akışlarına uygulanır. Gateway destekli skill bağımlılık kurulumları eşleşen `dangerouslyForceUnsafeInstall` istek geçersiz kılmasını kullanırken, `openclaw skills install` ayrı bir ClawHub skill indirme/kurulum akışı olarak kalır.

    ClawHub’da yayımladığınız bir Plugin kayıt taraması tarafından engelleniyorsa, [ClawHub](/tr/tools/clawhub) içindeki yayımcı adımlarını kullanın.

  </Accordion>
  <Accordion title="Hook paketleri ve npm spec’leri">
    `plugins install`, `package.json` içinde `openclaw.hooks` sunan hook paketleri için de kurulum yüzeyidir. Paket kurulumu için değil, filtrelenmiş hook görünürlüğü ve hook başına etkinleştirme için `openclaw hooks` kullanın.

    Npm spec’leri **yalnızca kayıt tabanlıdır** (paket adı + isteğe bağlı **tam sürüm** veya **dist-tag**). Git/URL/dosya spec’leri ve semver aralıkları reddedilir. Kabuk ortamınızda genel npm kurulum ayarları olsa bile, bağımlılık kurulumları güvenlik için `--ignore-scripts` ile proje yerelinde çalışır.

    Npm çözümlemesini açık hale getirmek istediğinizde `npm:<package>` kullanın. Çıplak paket spec’leri de lansman geçişi sırasında doğrudan npm’den kurulur.

    Çıplak spec’ler ve `@latest` kararlı kanalda kalır. `2026.5.3-1` gibi OpenClaw tarih damgalı düzeltme sürümleri bu kontrol için kararlı sürümlerdir. npm bunlardan herhangi birini ön sürüme çözümlerse, OpenClaw durur ve `@beta`/`@rc` gibi bir ön sürüm etiketiyle veya `@1.2.3-beta.4` gibi tam bir ön sürümle açıkça katılmanızı ister.

    Çıplak bir kurulum spec’i resmi bir Plugin kimliğiyle eşleşirse (örneğin `diffs`), OpenClaw katalog girdisini doğrudan kurar. Aynı ada sahip bir npm paketini kurmak için açık kapsamlı bir spec kullanın (örneğin `@scope/diffs`).

  </Accordion>
  <Accordion title="Git depoları">
    Doğrudan bir git deposundan kurmak için `git:<repo>` kullanın. Desteklenen biçimler arasında `git:github.com/owner/repo`, `git:owner/repo`, tam `https://`, `ssh://`, `git://`, `file://` ve `git@host:owner/repo.git` klon URL’leri bulunur. Kurulumdan önce bir dalı, etiketi veya commit’i çıkarmak için `@<ref>` veya `#<ref>` ekleyin.

    Git kurulumları geçici bir dizine klonlar, varsa istenen ref’i çıkarır ve ardından normal Plugin dizini kurucusunu kullanır. Bu, manifest doğrulaması, tehlikeli kod taraması, paket yöneticisi kurulum işi ve kurulum kayıtlarının npm kurulumları gibi davrandığı anlamına gelir. Kaydedilen git kurulumları, kaynak URL/ref bilgisini ve çözümlenen commit’i içerir; böylece `openclaw plugins update` kaynağı daha sonra yeniden çözümleyebilir.

    Git’ten kurduktan sonra gateway yöntemleri ve CLI komutları gibi çalışma zamanı kayıtlarını doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. Plugin `api.registerCli` ile bir CLI kökü kaydettiyse, bu komutu doğrudan OpenClaw kök CLI üzerinden çalıştırın; örneğin `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arşivler">
    Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Yerel OpenClaw Plugin arşivleri, çıkarılan Plugin kökünde geçerli bir `openclaw.plugin.json` içermelidir; yalnızca `package.json` içeren arşivler OpenClaw kurulum kayıtlarını yazmadan önce reddedilir.

    Dosya bir npm-pack tarball ise ve kayıt kurulumları tarafından kullanılan aynı yönetilen npm-root kurulum yolunu
    test etmek istiyorsanız `npm-pack:<path.tgz>` kullanın;
    buna `package-lock.json` doğrulaması, hoist edilmiş bağımlılık taraması ve
    npm kurulum kayıtları dahildir. Düz arşiv yolları, Plugin extensions kökü altında
    yerel arşivler olarak kurulmaya devam eder.

    Claude marketplace kurulumları da desteklenir.

  </Accordion>
</AccordionGroup>

ClawHub kurulumları açık bir `clawhub:<package>` konumlayıcısı kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Çıplak npm açısından güvenli Plugin spec’leri lansman geçişi sırasında varsayılan olarak npm’den kurulur:

```bash
openclaw plugins install openclaw-codex-app-server
```

Yalnızca npm çözümlemesini açık hale getirmek için `npm:` kullanın:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw, kurulumdan önce duyurulan Plugin API / minimum gateway uyumluluğunu denetler. Seçilen ClawHub sürümü bir ClawPack yapıtı yayımladığında, OpenClaw sürümlendirilmiş npm-pack `.tgz` dosyasını indirir, ClawHub özet başlığını ve yapıt özetini doğrular, ardından normal arşiv yolu üzerinden kurar. ClawPack meta verisi olmayan eski ClawHub sürümleri yine eski paket arşivi doğrulama yolu üzerinden kurulur. Kaydedilen kurulumlar, daha sonraki güncellemeler için ClawHub kaynak meta verilerini, yapıt türünü, npm integrity değerini, npm shasum değerini, tarball adını ve ClawPack özet bilgilerini tutar.
Sürümsüz ClawHub kurulumları sürümsüz kaydedilmiş bir spec tutar; böylece `openclaw plugins update` daha yeni ClawHub sürümlerini izleyebilir. `clawhub:pkg@1.2.3` ve `clawhub:pkg@beta` gibi açık sürüm veya etiket seçicileri bu seçiciye sabitlenmiş kalır.

#### Marketplace kısayolu

Marketplace adı Claude’un yerel kayıt önbelleğinde `~/.claude/plugins/known_marketplaces.json` konumunda mevcut olduğunda `plugin@marketplace` kısayolunu kullanın:

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
    - `~/.claude/plugins/known_marketplaces.json` içinden bir Claude bilinen marketplace adı
    - yerel bir marketplace kökü veya `marketplace.json` yolu
    - `owner/repo` gibi bir GitHub depo kısaltması
    - `https://github.com/owner/repo` gibi bir GitHub depo URL'si
    - bir git URL'si

  </Tab>
  <Tab title="Remote marketplace rules">
    GitHub veya git üzerinden yüklenen uzak marketplace'ler için Plugin girdileri klonlanan marketplace deposunun içinde kalmalıdır. OpenClaw, o depodan gelen göreli yol kaynaklarını kabul eder ve uzak manifestlerden gelen HTTP(S), mutlak yol, git, GitHub ve diğer yol olmayan Plugin kaynaklarını reddeder.
  </Tab>
</Tabs>

Yerel yollar ve arşivler için OpenClaw şunları otomatik algılar:

- yerel OpenClaw Plugin'leri (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya varsayılan Claude bileşen düzeni)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

<Note>
Uyumlu paketler normal Plugin köküne kurulur ve aynı list/info/enable/disable akışına katılır. Bugün paket Skills'leri, Claude komut-Skills'leri, Claude `settings.json` varsayılanları, Claude `.lsp.json` / manifestte bildirilen `lspServers` varsayılanları, Cursor komut-Skills'leri ve uyumlu Codex hook dizinleri desteklenir; algılanan diğer paket yetenekleri diagnostics/info içinde gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmamıştır.
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
  Tablo görünümünden, kaynak/köken/sürüm/etkinleştirme metadata bilgileri içeren Plugin başına ayrıntı satırlarına geç.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir envanter, registry tanılamaları ve paket bağımlılığı kurulum durumu.
</ParamField>

<Note>
`plugins list`, önce kalıcı yerel Plugin registry'sini okur; registry eksik veya geçersiz olduğunda yalnızca manifestten türetilen bir geri dönüş kullanır. Bir Plugin'in kurulu, etkin ve soğuk başlangıç planlaması tarafından görünür olup olmadığını denetlemek için kullanışlıdır, ancak zaten çalışan bir Gateway sürecinin canlı çalışma zamanı yoklaması değildir. Plugin kodunu, etkinleştirmeyi, hook politikasını veya `plugins.load.paths` değerini değiştirdikten sonra yeni `register(api)` kodunun veya hook'ların çalışmasını beklemeden önce kanala hizmet veren Gateway'i yeniden başlatın. Uzak/container dağıtımlarında, yalnızca bir wrapper sürecini değil gerçek `openclaw gateway run` alt sürecini yeniden başlattığınızı doğrulayın.

`plugins list --json`, her Plugin'in `package.json` içindeki `dependencies` ve `optionalDependencies` değerlerinden gelen `dependencyStatus` bilgisini içerir. OpenClaw, bu paket adlarının Plugin'in normal Node `node_modules` arama yolu boyunca mevcut olup olmadığını denetler; Plugin çalışma zamanı kodunu import etmez, bir paket yöneticisi çalıştırmaz veya eksik bağımlılıkları onarmaz.
</Note>

`plugins search`, uzak bir ClawHub katalog sorgusudur. Yerel durumu incelemez, config'i değiştirmez, paket kurmaz veya Plugin çalışma zamanı kodunu yüklemez. Arama sonuçları ClawHub paket adını, ailesini, kanalını, sürümünü, özetini ve `openclaw plugins install clawhub:<package>` gibi bir kurulum ipucunu içerir.

Paketlenmiş bir Docker imajı içinde bundled Plugin çalışması için Plugin kaynak dizinini `/app/extensions/synology-chat` gibi eşleşen paketlenmiş kaynak yolunun üzerine bind-mount edin. OpenClaw, bu mount edilmiş kaynak overlay'ini `/app/dist/extensions/synology-chat` öncesinde keşfeder; düz kopyalanmış bir kaynak dizini pasif kalır, böylece normal paketlenmiş kurulumlar hâlâ derlenmiş dist kullanır.

Çalışma zamanı hook hata ayıklaması için:

- `openclaw plugins inspect <id> --runtime --json`, modül yüklemeli bir inceleme geçişinden kayıtlı hook'ları ve tanılamaları gösterir. Çalışma zamanı incelemesi hiçbir zaman bağımlılık kurmaz; eski bağımlılık durumunu temizlemek veya config tarafından başvurulan eksik indirilebilir Plugin'leri kurtarmak için `openclaw doctor --fix` kullanın.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway'i, hizmet/süreç ipuçlarını, config yolunu ve RPC sağlığını doğrular.
- Bundled olmayan konuşma hook'ları (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.

Yerel bir dizini kopyalamaktan kaçınmak için `--link` kullanın (`plugins.load.paths` öğesine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
Bağlantılı kurulumlar yönetilen bir kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullandığı için `--force`, `--link` ile desteklenmez.

npm kurulumlarında çözümlenen tam spec'i (`name@version`) yönetilen Plugin dizinine kaydetmek, varsayılan davranışı ise sabitlenmemiş tutmak için `--pin` kullanın.
</Note>

### Plugin dizini

Plugin kurulum metadata'sı kullanıcı config'i değil, makine tarafından yönetilen durumdur. Kurulumlar ve güncellemeler bunu etkin OpenClaw durum dizini altındaki `plugins/installs.json` dosyasına yazar. Üst düzey `installRecords` map'i, bozuk veya eksik Plugin manifest kayıtları dahil kurulum metadata'sının kalıcı kaynağıdır. `plugins` dizisi manifestten türetilen soğuk registry önbelleğidir. Dosya bir düzenlemeyin uyarısı içerir ve `openclaw plugins update`, kaldırma, tanılamalar ve soğuk Plugin registry'si tarafından kullanılır.

OpenClaw, config içinde gönderilmiş eski `plugins.installs` kayıtlarını gördüğünde bunları Plugin dizinine taşır ve config anahtarını kaldırır; yazma işlemlerinden biri başarısız olursa kurulum metadata'sı kaybolmasın diye config kayıtları korunur.

### Kaldırma

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, uygulanabildiğinde Plugin kayıtlarını `plugins.entries` içinden, kalıcı Plugin dizininden, Plugin izin/engelleme listesi girdilerinden ve bağlantılı `plugins.load.paths` girdilerinden kaldırır. `--keep-files` ayarlanmadığı sürece uninstall, OpenClaw'ın Plugin extensions kökü içinde olduğunda izlenen yönetilen kurulum dizinini de kaldırır. Active Memory Plugin'leri için bellek slotu `memory-core` değerine sıfırlanır.

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
  <Accordion title="Resolving plugin id vs npm spec">
    Bir Plugin id'si verdiğinizde OpenClaw, o Plugin için kaydedilmiş kurulum spec'ini yeniden kullanır. Bu, `@beta` gibi daha önce saklanmış dist-tag'lerin ve tam sabitlenmiş sürümlerin sonraki `update <id>` çalıştırmalarında kullanılmaya devam edeceği anlamına gelir.

    npm kurulumları için dist-tag veya tam sürüm içeren açık bir npm paket spec'i de verebilirsiniz. OpenClaw bu paket adını izlenen Plugin kaydına geri çözümler, kurulu Plugin'i günceller ve gelecekteki id tabanlı güncellemeler için yeni npm spec'ini kaydeder.

    npm paket adını sürüm veya tag olmadan geçirmek de izlenen Plugin kaydına geri çözümlenir. Bir Plugin tam bir sürüme sabitlenmişken onu registry'nin varsayılan yayın hattına geri taşımak istediğinizde bunu kullanın.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update`, yeni bir spec vermediğiniz sürece izlenen Plugin spec'ini yeniden kullanır. `openclaw update` ayrıca etkin OpenClaw güncelleme kanalını bilir: beta kanalında, varsayılan hat npm ve ClawHub Plugin kayıtları önce `@beta` dener, sonra Plugin beta yayını yoksa kaydedilmiş varsayılan/latest spec'e geri döner. Tam sürümler ve açık tag'ler o seçiciye sabitlenmiş kalır.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Canlı bir npm güncellemesinden önce OpenClaw, kurulu paket sürümünü npm registry metadata'sına göre denetler. Kurulu sürüm ve kaydedilmiş artifact kimliği zaten çözümlenen hedefle eşleşiyorsa güncelleme indirme, yeniden kurma veya `openclaw.json` dosyasını yeniden yazma olmadan atlanır.

    Saklanan bir integrity hash'i mevcut olduğunda ve getirilen artifact hash'i değiştiğinde OpenClaw bunu npm artifact kayması olarak değerlendirir. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek hash'leri yazdırır ve devam etmeden önce onay ister. Etkileşimli olmayan güncelleme yardımcıları, çağıran açık bir devam politikası sağlamadıkça kapalı başarısız olur.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install`, Plugin güncellemeleri sırasında yerleşik dangerous-code taraması yanlış pozitifleri için bir break-glass override olarak `plugins update` üzerinde de kullanılabilir. Yine de Plugin `before_install` politika engellerini veya tarama hatası engellemesini atlatmaz ve hook-pack güncellemelerine değil yalnızca Plugin güncellemelerine uygulanır.
  </Accordion>
</AccordionGroup>

### İnceleme

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect; kimliği, yükleme durumunu, kaynağı, manifest yeteneklerini, politika bayraklarını, tanılamaları, kurulum metadata'sını, paket yeteneklerini ve varsayılan olarak Plugin çalışma zamanını import etmeden algılanan MCP veya LSP server desteğini gösterir. Plugin modülünü yüklemek ve kayıtlı hook'ları, araçları, komutları, hizmetleri, gateway yöntemlerini ve HTTP route'larını dahil etmek için `--runtime` ekleyin. Çalışma zamanı incelemesi eksik Plugin bağımlılıklarını doğrudan bildirir; kurulumlar ve onarımlar `openclaw plugins install`, `openclaw plugins update` ve `openclaw doctor --fix` içinde kalır.

Plugin'e ait CLI komutları kök `openclaw` komut grupları olarak kurulur. `inspect --runtime`, `cliCommands` altında bir komut gösterdikten sonra onu `openclaw <command> ...` olarak çalıştırın; örneğin `demo-git` kaydeden bir Plugin, `openclaw demo-git ping` ile doğrulanabilir.

Her Plugin, çalışma zamanında gerçekten ne kaydettiğine göre sınıflandırılır:

- **plain-capability** — tek bir yetenek türü (örn. yalnızca provider olan bir Plugin)
- **hybrid-capability** — birden çok yetenek türü (örn. metin + konuşma + görüntüler)
- **hook-only** — yalnızca hook'lar, yetenek veya yüzey yok
- **non-capability** — araçlar/komutlar/hizmetler ancak yetenek yok

Yetenek modeli hakkında daha fazla bilgi için [Plugin şekilleri](/tr/plugins/architecture#plugin-shapes) bölümüne bakın.

<Note>
`--json` bayrağı, betik yazma ve denetim için uygun makine tarafından okunabilir bir rapor çıktılar. `inspect --all`; şekil, yetenek türleri, uyumluluk bildirimleri, paket yetenekleri ve hook özeti sütunlarıyla filo genelinde bir tablo render eder. `info`, `inspect` için bir alias'tır.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, Plugin yükleme hatalarını, manifest/keşif tanılamalarını ve uyumluluk bildirimlerini raporlar. Her şey temiz olduğunda `No plugin issues detected.` yazdırır.

Yapılandırılmış bir Plugin diskte mevcutsa ancak loader'ın yol güvenliği denetimleri tarafından engelleniyorsa config doğrulaması Plugin girdisini korur ve onu `present but blocked` olarak raporlar. `plugins.entries.<id>` veya `plugins.allow` config'ini kaldırmak yerine, yol sahipliği veya world-writable izinler gibi önceki engellenmiş-Plugin tanılamasını düzeltin.

Eksik `register`/`activate` export'ları gibi modül şekli hataları için tanılama çıktısına kompakt bir export şekli özeti eklemek üzere `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Yerel Plugin kayıt defteri, yüklü Plugin kimliği, etkinleştirme, kaynak meta verileri ve katkı sahipliği için OpenClaw'ın kalıcı soğuk okuma modelidir. Normal başlangıç, sağlayıcı sahibi araması, kanal kurulum sınıflandırması ve Plugin envanteri, Plugin çalışma zamanı modüllerini içe aktarmadan bunu okuyabilir.

Kalıcı kayıt defterinin mevcut, güncel veya eski olup olmadığını denetlemek için `plugins registry` kullanın. Kalıcı Plugin dizini, yapılandırma ilkesi ve manifest/paket meta verilerinden yeniden oluşturmak için `--refresh` kullanın. Bu bir onarım yoludur, çalışma zamanı etkinleştirme yolu değildir.

`openclaw doctor --fix`, kayıt defteriyle ilişkili yönetilen npm sapmasını da onarır: yönetilen Plugin npm kökü altında sahipsiz veya kurtarılmış bir `@openclaw/*` paketi paketlenmiş bir Plugin'i gölgeliyorsa, doctor bu eski paketi kaldırır ve başlangıcın paketlenmiş manifest'e göre doğrulanması için kayıt defterini yeniden oluşturur.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`, kayıt defteri okuma hataları için kullanımdan kaldırılmış acil durum uyumluluk anahtarıdır. `plugins registry --refresh` veya `openclaw doctor --fix` tercih edin; env geri dönüşü yalnızca geçiş kullanıma sunulurken acil başlangıç kurtarması içindir.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list, yerel bir marketplace yolu, bir `marketplace.json` yolu, `owner/repo` gibi bir GitHub kısaltması, bir GitHub repo URL'si veya bir git URL'si kabul eder. `--json`, çözümlenen kaynak etiketini, ayrıştırılmış marketplace manifest'i ve Plugin girdileriyle birlikte yazdırır.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [CLI başvurusu](/tr/cli)
- [Topluluk Plugin'leri](/tr/plugins/community)
