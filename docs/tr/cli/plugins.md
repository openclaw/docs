---
read_when:
    - Gateway Plugin'lerini veya uyumlu paketleri yüklemek ya da yönetmek istiyorsunuz
    - Basit bir araç plugin’i oluşturmak veya doğrulamak istiyorsunuz
    - Plugin yükleme hatalarında hata ayıklamak istiyorsunuz
sidebarTitle: Plugins
summary: '`openclaw plugins` için CLI başvurusu (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)'
title: Plugin'ler
x-i18n:
    generated_at: "2026-06-28T00:24:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4366a862f6a8996b38b624760eef407969f35a7451e3b2a1d5e82746d73b678
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
    Manifest alanları ve yapılandırma şeması.
  </Card>
  <Card title="Security" href="/tr/gateway/security">
    Plugin kurulumları için güvenlik sertleştirmesi.
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
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

Yavaş yükleme, inceleme, kaldırma veya kayıt yenileme araştırması için komutu
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ile çalıştırın. İzleme, aşama sürelerini
stderr'e yazar ve JSON çıktısının ayrıştırılabilir kalmasını sağlar. Bkz. [Hata Ayıklama](/tr/help/debugging#plugin-lifecycle-trace).

<Note>
Nix modunda (`OPENCLAW_NIX_MODE=1`), Plugin yaşam döngüsü değiştiricileri devre dışıdır. Bu kurulum için `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` veya `plugins disable` yerine Nix kaynağını kullanın; nix-openclaw için ajan öncelikli [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) bölümünü kullanın.
</Note>

<Note>
Paketlenmiş Plugin'ler OpenClaw ile birlikte gelir. Bazıları varsayılan olarak etkindir (örneğin paketlenmiş model sağlayıcıları, paketlenmiş konuşma sağlayıcıları ve paketlenmiş tarayıcı Plugin'i); diğerleri `plugins enable` gerektirir.

Yerel OpenClaw Plugin'leri, satır içi JSON Schema (`configSchema`, boş olsa bile) içeren `openclaw.plugin.json` ile gönderilmelidir. Uyumlu bundle'lar bunun yerine kendi bundle manifestlerini kullanır.

`plugins list`, `Format: openclaw` veya `Format: bundle` gösterir. Ayrıntılı liste/bilgi çıktısı ayrıca bundle alt türünü (`codex`, `claude` veya `cursor`) ve algılanan bundle yeteneklerini gösterir.
</Note>

### Yazar

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` varsayılan olarak en küçük TypeScript araç Plugin'ini oluşturur. İlk
argüman Plugin kimliğidir; görüntü adı için `--name` iletin. OpenClaw,
varsayılan çıktı dizini ve paket adlandırması için kimliği kullanır. Araç iskeletleri
`defineToolPlugin` kullanır.
`plugins build`, derlenmiş giriş noktasını içe aktarır, statik araç meta verilerini okur,
`openclaw.plugin.json` yazar ve `package.json` `openclaw.extensions` değerini uyumlu tutar.
`plugins validate`, oluşturulan manifestin, paket meta verilerinin ve
geçerli giriş dışa aktarımının hâlâ birbiriyle uyumlu olduğunu denetler. Eksiksiz
araç yazma iş akışı için bkz. [Araç Plugin'leri](/tr/plugins/tool-plugins).

İskelet TypeScript kaynağı yazar, ancak meta verileri derlenmiş
`./dist/index.js` girişinden oluşturur; böylece iş akışı yayımlanmış CLI ile de çalışır. Giriş varsayılan paket girişi değilse
`--entry <path>` kullanın. CI'da dosyaları yeniden yazmadan
oluşturulan meta veriler eskiyse başarısız olmak için `plugins build --check` kullanın.

### Sağlayıcı İskeleti

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Sağlayıcı iskeletleri, OpenAI uyumlu API anahtarı tesisatı, `clawhub package
validate` için yerleşik bir `npm run validate` betiği, ClawHub paket meta verileri
ve GitHub Actions OIDC üzerinden gelecekte güvenilir yayımlama için elle tetiklenen bir GitHub iş akışı içeren genel bir metin/model sağlayıcı Plugin'i oluşturur. Sağlayıcı iskeletleri
skills oluşturmaz ve `openclaw plugins build` veya
`openclaw plugins validate` kullanmaz; bu komutlar araç iskeletinin
oluşturulan meta veri yolu içindir.

Yayımlamadan önce yer tutucu API temel URL'sini, model kataloğunu, doküman
rotasını, kimlik bilgisi metnini ve README metnini gerçek sağlayıcı ayrıntılarıyla değiştirin. İlk kez ClawHub yayımlama ve güvenilir yayımcı kurulumu için
oluşturulan README'yi kullanın.

  ### Kurulum

  ```bash
  openclaw plugins search "calendar"                   # search ClawHub plugins
  openclaw plugins install <package>                      # source auto-detection
  openclaw plugins install clawhub:<package>              # ClawHub only
  openclaw plugins install npm:<package>                  # npm only
  openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
  openclaw plugins install git:github.com/<owner>/<repo>  # git repo
  openclaw plugins install git:github.com/<owner>/<repo>@<ref>
  openclaw plugins install <package> --force              # overwrite existing install
  openclaw plugins install <package> --pin                # pin version
  openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
  openclaw plugins install <package> --dangerously-force-unsafe-install
  openclaw plugins install <path>                         # local path
  openclaw plugins install <plugin>@<marketplace>         # marketplace
  openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
  openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
  ```

  Kurulum sırasında yüklemeleri test eden bakımcılar, otomatik Plugin kurulum
  kaynaklarını korumalı ortam değişkenleriyle geçersiz kılabilir. Bkz.
  [Plugin kurulum geçersiz kılmaları](/tr/plugins/install-overrides).

  <Warning>
  Çıplak paket adları, resmi bir Plugin kimliğiyle eşleşmedikleri sürece lansman geçişi sırasında varsayılan olarak npm'den kurulur. Paketli Plugin'lerle eşleşen ham `@openclaw/*` paket belirtimleri, geçerli OpenClaw derlemesiyle birlikte gönderilen paketli kopyayı kullanır. Bunun yerine özellikle harici bir npm paketi istediğinizde `npm:<package>` kullanın. ClawHub için `clawhub:<package>` kullanın. Plugin kurulumlarını kod çalıştırmak gibi ele alın. Sabitlenmiş sürümleri tercih edin.
  </Warning>

  `plugins search`, kurulabilir Plugin paketleri için ClawHub'ı sorgular ve
  kuruluma hazır paket adlarını yazdırır. Skills'leri değil, kod Plugin'i ve paket
  Plugin'i paketlerini arar. ClawHub Skills'leri için `openclaw skills search`
  kullanın.

  <Note>
  ClawHub, çoğu Plugin için birincil dağıtım ve keşif yüzeyidir. Npm desteklenen
  bir yedek ve doğrudan kurulum yolu olarak kalır. OpenClaw'a ait `@openclaw/*`
  Plugin paketleri yeniden npm'de yayımlanır; güncel listeye
  [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) üzerinden veya
  [Plugin envanteri](/tr/plugins/plugin-inventory) içinden bakın. Kararlı kurulumlar
  `latest` kullanır. Beta kanalı kurulumları ve güncellemeleri, bu etiket
  mevcut olduğunda npm `beta` dist-tag etiketini tercih eder, ardından `latest`
  etiketine geri döner.
  </Note>

  <AccordionGroup>
  <Accordion title="Yapılandırma eklemeleri ve geçersiz yapılandırma onarımı">
    `plugins` bölümünüz tek dosyalı bir `$include` tarafından destekleniyorsa `plugins install/update/enable/disable/uninstall`, o eklenen dosyaya yazar ve `openclaw.json` dosyasına dokunmaz. Kök eklemeler, ekleme dizileri ve kardeş geçersiz kılmalar içeren eklemeler düzleştirilmek yerine kapalı başarısız olur. Desteklenen biçimler için [Yapılandırma eklemeleri](/tr/gateway/configuration) bölümüne bakın.

    Kurulum sırasında yapılandırma geçersizse `plugins install` normalde kapalı başarısız olur ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Gateway başlatma ve sıcak yeniden yükleme sırasında geçersiz Plugin yapılandırması, diğer geçersiz yapılandırmalar gibi kapalı başarısız olur; `openclaw doctor --fix` geçersiz Plugin girdisini karantinaya alabilir. Belgelenen tek kurulum zamanı istisnası, açıkça `openclaw.install.allowInvalidConfigRecovery` seçeneğine katılan Plugin'ler için dar kapsamlı paketli Plugin kurtarma yoludur.

  </Accordion>
  <Accordion title="--force ve yeniden kurulum ile güncelleme karşılaştırması">
    `--force`, mevcut kurulum hedefini yeniden kullanır ve zaten kurulu bir Plugin'i veya hook paketini yerinde üzerine yazar. Aynı kimliği yeni bir yerel yoldan, arşivden, ClawHub paketinden veya npm yapıtından kasıtlı olarak yeniden kurduğunuzda kullanın. Zaten izlenen bir npm Plugin'inin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` komutunu tercih edin.

    Zaten kurulu olan bir Plugin kimliği için `plugins install` çalıştırırsanız OpenClaw durur ve normal yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna ya da mevcut kurulumu gerçekten farklı bir kaynaktan üzerine yazmak istediğinizde `plugins install <package> --force` komutuna yönlendirir.

  </Accordion>
  <Accordion title="--pin kapsamı">
    `--pin` yalnızca npm kurulumları için geçerlidir. `git:` kurulumlarıyla desteklenmez; sabitlenmiş bir kaynak istediğinizde `git:github.com/acme/plugin@v1.2.3` gibi açık bir git ref kullanın. `--marketplace` ile desteklenmez, çünkü marketplace kurulumları npm belirtimi yerine marketplace kaynak meta verilerini kalıcı hale getirir.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` kullanımdan kaldırılmıştır ve artık işlem yapmaz. OpenClaw artık Plugin kurulumları için yerleşik kurulum zamanı tehlikeli kod engellemesi çalıştırmaz.

    Ana makineye özgü kurulum ilkesi gerektiğinde paylaşılan, operatöre ait `security.installPolicy` yüzeyini kullanın. Plugin `before_install` hook'ları, Plugin çalışma zamanı yaşam döngüsü hook'larıdır ve CLI kurulumları için birincil ilke sınırı değildir.

    ClawHub'da yayımladığınız bir Plugin bir kayıt taraması tarafından gizlenir veya engellenirse [ClawHub yayımlama](/tr/clawhub/publishing) içindeki yayımcı adımlarını kullanın. `--dangerously-force-unsafe-install`, ClawHub'dan Plugin'i yeniden taramasını veya engellenmiş bir sürümü herkese açık yapmasını istemez.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Topluluk ClawHub kurulumları, paketi indirmeden önce seçilen sürümün güven kaydını kontrol eder. ClawHub sürüm için indirmeyi devre dışı bırakırsa, kötü amaçlı tarama bulguları bildirirse veya sürümü karantina gibi engelleyici bir moderasyon durumuna koyarsa OpenClaw sürümü reddeder. Engelleyici olmayan riskli tarama durumları, riskli moderasyon durumları veya kayıt nedenleri için OpenClaw güven ayrıntılarını gösterir ve devam etmeden önce onay ister.

    `--acknowledge-clawhub-risk` seçeneğini yalnızca ClawHub uyarısını inceleyip etkileşimli istem olmadan devam etmeye karar verdikten sonra kullanın. Bekleyen veya eski temiz güven kayıtları uyarı verir ancak onay gerektirmez. Resmi ClawHub paketleri ve paketli OpenClaw Plugin kaynakları bu sürüm güven istemini atlar.

  </Accordion>
  <Accordion title="Hook paketleri ve npm belirtimleri">
    `plugins install`, `package.json` içinde `openclaw.hooks` sunan hook paketleri için de kurulum yüzeyidir. Paket kurulumu için değil, filtrelenmiş hook görünürlüğü ve hook başına etkinleştirme için `openclaw hooks` kullanın.

    Npm belirtimleri **yalnızca kayıt tabanlıdır** (paket adı + isteğe bağlı **tam sürüm** veya **dist-tag**). Git/URL/dosya belirtimleri ve semver aralıkları reddedilir. Bağımlılık kurulumları, kabuğunuzda genel npm kurulum ayarları olsa bile güvenlik için Plugin başına tek yönetilen npm projesinde `--ignore-scripts` ile çalışır. Yönetilen Plugin npm projeleri OpenClaw'ın paket düzeyi npm `overrides` değerlerini devralır; böylece ana makine güvenlik sabitlemeleri yükseltilmiş Plugin bağımlılıklarına da uygulanır.

    Npm çözümlemesini açık hale getirmek istediğinizde `npm:<package>` kullanın. Çıplak paket belirtimleri de, resmi bir Plugin kimliğiyle eşleşmedikleri sürece lansman geçişi sırasında doğrudan npm'den kurulur.

    Raw `@openclaw/*` paket belirtimleri, pakete dahil Plugin'lerle eşleştiğinde npm geri dönüşünden önce imaja ait pakete dahil kopyaya çözümlenir. Örneğin, `openclaw plugins install @openclaw/discord@2026.5.20 --pin`, yönetilen bir npm geçersiz kılması oluşturmak yerine geçerli OpenClaw derlemesindeki pakete dahil Discord Plugin'ini kullanır. Harici npm paketini zorlamak için `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` kullanın.

    Yalın belirtimler ve `@latest` kararlı kanalda kalır. `2026.5.3-1` gibi OpenClaw tarih damgalı düzeltme sürümleri bu kontrol için kararlı sürümlerdir. npm bunlardan birini ön sürüme çözümlerse OpenClaw durur ve `@beta`/`@rc` gibi bir ön sürüm etiketiyle veya `@1.2.3-beta.4` gibi tam bir ön sürümle açıkça katılım vermenizi ister.

    Tam sürüm içermeyen npm kurulumlarında (`npm:<package>` veya `npm:<package>@latest`), OpenClaw kurulumdan önce çözümlenen paket meta verilerini denetler. En son kararlı paket daha yeni bir OpenClaw Plugin API'si veya minimum host sürümü gerektiriyorsa OpenClaw daha eski kararlı sürümleri inceler ve bunun yerine en yeni uyumlu yayını kurar. Tam sürümler ve `@beta` gibi açık dist-tag'ler katı kalır: seçilen paket uyumsuzsa komut başarısız olur ve OpenClaw'ı yükseltmenizi veya uyumlu bir sürüm seçmenizi ister.

    Yalın bir kurulum belirtimi resmi bir Plugin kimliğiyle eşleşirse (örneğin `diffs`), OpenClaw katalog girdisini doğrudan kurar. Aynı ada sahip bir npm paketini kurmak için açık kapsamlı bir belirtim kullanın (örneğin `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Bir git deposundan doğrudan kurmak için `git:<repo>` kullanın. Desteklenen biçimler arasında `git:github.com/owner/repo`, `git:owner/repo`, tam `https://`, `ssh://`, `git://`, `file://` ve `git@host:owner/repo.git` klon URL'leri bulunur. Kurulumdan önce bir branch, tag veya commit checkout etmek için `@<ref>` ya da `#<ref>` ekleyin.

    Git kurulumları geçici bir dizine klonlar, varsa istenen ref'i checkout eder ve ardından normal Plugin dizini kurucusunu kullanır. Bu, manifest doğrulamasının, operatör kurulum ilkesinin, paket yöneticisi kurulum işinin ve kurulum kayıtlarının npm kurulumları gibi davrandığı anlamına gelir. Kaydedilen git kurulumları kaynak URL/ref bilgisini ve çözümlenen commit'i içerir; böylece `openclaw plugins update` kaynağı daha sonra yeniden çözümleyebilir.

    Git'ten kurduktan sonra Gateway yöntemleri ve CLI komutları gibi runtime kayıtlarını doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. Plugin `api.registerCli` ile bir CLI kökü kaydettiyse, bu komutu doğrudan OpenClaw kök CLI'si üzerinden çalıştırın; örneğin `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Yerel OpenClaw Plugin arşivleri, çıkarılan Plugin kökünde geçerli bir `openclaw.plugin.json` içermelidir; yalnızca `package.json` içeren arşivler OpenClaw kurulum kayıtlarını yazmadan önce reddedilir.

    Dosya bir npm-pack tarball'ı olduğunda ve registry
    kurulumları tarafından kullanılan aynı Plugin başına yönetilen npm proje yolunu,
    `package-lock.json` doğrulaması, hoist edilmiş bağımlılık
    taraması ve npm kurulum kayıtları dahil test etmek istediğinizde `npm-pack:<path.tgz>` kullanın. Düz arşiv yolları yine de Plugin extensions kökü altında yerel
    arşivler olarak kurulur.

    Claude marketplace kurulumları da desteklenir.

  </Accordion>
</AccordionGroup>

ClawHub kurulumları açık bir `clawhub:<package>` konumlayıcısı kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Yalın npm uyumlu Plugin belirtimleri, resmi bir Plugin kimliğiyle eşleşmedikleri sürece lansman geçişi sırasında varsayılan olarak npm'den kurulur:

```bash
openclaw plugins install openclaw-codex-app-server
```

npm'ye özel çözümlemeyi açık hale getirmek için `npm:` kullanın:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kurulumdan önce duyurulan Plugin API / minimum gateway uyumluluğunu denetler. Seçilen ClawHub sürümü bir ClawPack artifact yayımladığında, OpenClaw sürümlenmiş npm-pack `.tgz` dosyasını indirir, ClawHub digest header'ını ve artifact digest'ini doğrular, ardından normal arşiv yolu üzerinden kurar. ClawPack meta verisi olmayan eski ClawHub sürümleri yine de eski paket arşivi doğrulama yolu üzerinden kurulur. Kaydedilen kurulumlar, sonraki güncellemeler için ClawHub kaynak meta verilerini, artifact türünü, npm integrity bilgisini, npm shasum değerini, tarball adını ve ClawPack digest olgularını saklar.
Sürümsüz ClawHub kurulumları, `openclaw plugins update` daha yeni ClawHub yayınlarını izleyebilsin diye sürümsüz bir kaydedilmiş belirtimi korur; `clawhub:pkg@1.2.3` ve `clawhub:pkg@beta` gibi açık sürüm veya etiket seçicileri o seçiciye pin'li kalır.

#### Marketplace kısayolu

Marketplace adı Claude'un `~/.claude/plugins/known_marketplaces.json` konumundaki yerel registry önbelleğinde bulunduğunda `plugin@marketplace` kısayolunu kullanın:

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
    - `owner/repo` gibi bir GitHub repo kısayolu
    - `https://github.com/owner/repo` gibi bir GitHub repo URL'si
    - bir git URL'si

  </Tab>
  <Tab title="Remote marketplace rules">
    GitHub veya git'ten yüklenen uzak marketplace'ler için Plugin girdileri klonlanan marketplace repo'sunun içinde kalmalıdır. OpenClaw bu repo'dan göreli yol kaynaklarını kabul eder ve uzak manifestlerden gelen HTTP(S), mutlak yol, git, GitHub ve diğer yol olmayan Plugin kaynaklarını reddeder.
  </Tab>
</Tabs>

Yerel yollar ve arşivler için OpenClaw otomatik algılar:

- yerel OpenClaw Plugin'leri (`openclaw.plugin.json`)
- Codex uyumlu bundle'lar (`.codex-plugin/plugin.json`)
- Claude uyumlu bundle'lar (`.claude-plugin/plugin.json` veya varsayılan Claude bileşen düzeni)
- Cursor uyumlu bundle'lar (`.cursor-plugin/plugin.json`)

Yönetilen yerel kurulumlar Plugin dizinleri veya arşivleri olmalıdır. Bağımsız `.js`,
`.mjs`, `.cjs` ve `.ts` Plugin dosyaları `plugins install` tarafından yönetilen Plugin
köküne kopyalanmaz; bunun yerine bunları `plugins.load.paths` içinde açıkça listeleyin.

<Note>
Uyumlu bundle'lar normal Plugin köküne kurulur ve aynı list/info/enable/disable akışına katılır. Bugün bundle skills, Claude command-skills, Claude `settings.json` varsayılanları, Claude `.lsp.json` / manifest tarafından bildirilen `lspServers` varsayılanları, Cursor command-skills ve uyumlu Codex hook dizinleri desteklenir; algılanan diğer bundle yetenekleri diagnostics/info içinde gösterilir ancak henüz runtime yürütmesine bağlanmamıştır.
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
  Tablo görünümünden kaynak/origin/sürüm/aktivasyon meta verileriyle Plugin başına ayrıntı satırlarına geç.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir envanter, registry diagnostics ve paket bağımlılığı kurulum durumu.
</ParamField>

<Note>
`plugins list` önce kalıcı yerel Plugin registry'sini okur; registry eksik veya geçersiz olduğunda yalnızca manifestten türetilmiş bir geri dönüş kullanır. Bir Plugin'in kurulu, etkin ve cold startup planlamasına görünür olup olmadığını denetlemek için yararlıdır, ancak zaten çalışan bir Gateway sürecinin canlı runtime probe'u değildir. Plugin kodunu, etkinleştirmeyi, hook ilkesini veya `plugins.load.paths` değerini değiştirdikten sonra yeni `register(api)` kodunun veya hook'ların çalışmasını beklemeden önce kanala hizmet veren Gateway'i yeniden başlatın. Uzak/container dağıtımlarında, yalnızca bir wrapper sürecini değil, gerçek `openclaw gateway run` child sürecini yeniden başlattığınızı doğrulayın.

`plugins list --json`, her Plugin'in `package.json` içindeki `dependencies`
ve `optionalDependencies` değerlerinden gelen `dependencyStatus` bilgisini içerir. OpenClaw bu paket
adlarının Plugin'in normal Node `node_modules` arama yolunda bulunup bulunmadığını denetler; Plugin runtime kodunu
import etmez, bir paket yöneticisi çalıştırmaz veya eksik
bağımlılıkları onarmaz.
</Note>

Başlangıç günlükleri `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` yazarsa,
Plugin kimliklerini doğrulamak ve güvenilen kimlikleri `openclaw.json` içindeki `plugins.allow` değerine kopyalamak için `openclaw plugins list --enabled --verbose` veya
listelenmiş bir Plugin kimliğiyle `openclaw plugins inspect <id>` çalıştırın. Uyarı keşfedilen her Plugin'i listeleyebildiğinde, bu kimlikleri zaten içeren yapıştırmaya hazır bir
`plugins.allow` snippet'i yazdırır. Bir Plugin kurulum/yükleme yolu provenance'ı olmadan yüklenirse, o Plugin kimliğini inceleyin, ardından güvenilen kimliği `plugins.allow` içinde pin'leyin veya OpenClaw'ın kurulum provenance'ını kaydetmesi için Plugin'i güvenilen bir kaynaktan yeniden kurun.

`plugins search`, uzak bir ClawHub katalog aramasıdır. Yerel
durumu incelemez, config'i değiştirmez, paket kurmaz veya Plugin runtime kodunu yüklemez. Arama
sonuçları ClawHub paket adını, family, channel, version, summary ve
`openclaw plugins install clawhub:<package>` gibi bir kurulum ipucunu içerir.

Paketlenmiş bir Docker imajı içindeki pakete dahil Plugin çalışması için, Plugin
kaynak dizinini eşleşen paketlenmiş kaynak yolunun üzerine bind-mount edin; örneğin
`/app/extensions/synology-chat`. OpenClaw bu bağlanmış kaynak
overlay'ini `/app/dist/extensions/synology-chat` öncesinde keşfeder; düz kopyalanmış bir kaynak
dizini etkisiz kalır, böylece normal paketlenmiş kurulumlar derlenmiş dist'i kullanmaya devam eder.

Runtime hook hata ayıklaması için:

- `openclaw plugins inspect <id> --runtime --json`, module-loaded inspection geçişinden kayıtlı hook'ları ve diagnostics'i gösterir. Runtime incelemesi asla bağımlılık kurmaz; eski bağımlılık durumunu temizlemek veya config tarafından başvurulan eksik indirilebilir Plugin'leri kurtarmak için `openclaw doctor --fix` kullanın.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway URL/profile bilgisini, hizmet/süreç ipuçlarını, config yolunu ve RPC sağlığını doğrular.
- Pakete dahil olmayan conversation hook'ları (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.

Yerel bir Plugin dizinini kopyalamaktan kaçınmak için `--link` kullanın (`plugins.load.paths` değerine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

Bağımsız Plugin dosyaları `plugins install` ile kurulmak veya doğrudan `~/.openclaw/extensions`
ya da `<workspace>/.openclaw/extensions` içine yerleştirilmek yerine `plugins.load.paths` içinde listelenmelidir. Bu otomatik keşfedilen kökler Plugin
paket veya bundle dizinlerini yüklerken, üst düzey script dosyaları yerel
yardımcılar olarak değerlendirilir ve atlanır.

<Note>
Bir çalışma alanı extensions kökünden keşfedilen çalışma alanı kökenli Plugin'ler,
açıkça etkinleştirilene kadar içe aktarılmaz veya çalıştırılmaz. Yerel geliştirme için
`openclaw plugins enable <plugin-id>` komutunu çalıştırın ya da
`plugins.entries.<plugin-id>.enabled: true` ayarını yapın; yapılandırmanız
`plugins.allow` kullanıyorsa aynı Plugin kimliğini oraya da ekleyin. Bu hata durumunda
kapalı kalma kuralı, kanal kurulumu yalnızca kurulum amaçlı yükleme için açıkça çalışma
alanı kökenli bir Plugin'i hedeflediğinde de geçerlidir; bu nedenle yerel kanal Plugin
kurulum kodu, ilgili çalışma alanı Plugin'i devre dışı kaldığı veya izin listesinin dışında
bırakıldığı sürece çalışmaz. Bağlı kurulumlar ve açık `plugins.load.paths` girdileri,
çözümlenen Plugin kökenleri için normal politikayı izler. Bkz.
[Plugin politikasını yapılandırma](/tr/tools/plugin#configure-plugin-policy)
ve [Yapılandırma başvurusu](/tr/gateway/configuration-reference#plugins).

`--force`, `--link` ile desteklenmez çünkü bağlı kurulumlar, yönetilen bir kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullanır.

Varsayılan davranışı sabitlenmemiş tutarken yönetilen Plugin dizininde çözümlenen tam belirtimi (`name@version`) kaydetmek için npm kurulumlarında `--pin` kullanın.
</Note>

### Plugin dizini

Plugin kurulum meta verileri, kullanıcı yapılandırması değil, makine tarafından yönetilen durumdur. Kurulumlar ve güncellemeler bunu etkin OpenClaw durum dizini altındaki paylaşılan SQLite durum veritabanına yazar. `installed_plugin_index` satırı, bozuk veya eksik Plugin manifest kayıtları dahil olmak üzere kalıcı `installRecords` meta verilerini ve `openclaw plugins update`, kaldırma, tanılama ve soğuk Plugin kayıt defteri tarafından kullanılan manifestten türetilmiş bir soğuk kayıt defteri önbelleğini saklar.

OpenClaw, yapılandırmada yayımlanmış eski `plugins.installs` kayıtlarını gördüğünde, çalışma zamanı okumaları bunları `openclaw.json` dosyasını yeniden yazmadan uyumluluk girdisi olarak ele alır. Açık Plugin yazmaları ve `openclaw doctor --fix`, yapılandırma yazmalarına izin verildiğinde bu kayıtları Plugin dizinine taşır ve yapılandırma anahtarını kaldırır; yazmalardan biri başarısız olursa kurulum meta verilerinin kaybolmaması için yapılandırma kayıtları korunur.

### Kaldırma

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, uygulanabilir olduğunda Plugin kayıtlarını `plugins.entries`, kalıcı Plugin dizini, Plugin izin/engelleme listesi girdileri ve bağlı `plugins.load.paths` girdilerinden kaldırır. `--keep-files` ayarlanmadığı sürece kaldırma, OpenClaw'ın Plugin extensions kökü içindeyse izlenen yönetilen kurulum dizinini de kaldırır. Active Memory Plugin'leri için bellek yuvası `memory-core` değerine sıfırlanır.

<Note>
`--keep-config`, `--keep-files` için kullanım dışı bırakılmış bir takma ad olarak desteklenir.
</Note>

### Güncelleme

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Güncellemeler, yönetilen Plugin dizinindeki izlenen Plugin kurulumlarına ve `hooks.internal.installs` içindeki izlenen hook-pack kurulumlarına uygulanır.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Bir Plugin kimliği ilettiğinizde OpenClaw, o Plugin için kayıtlı kurulum belirtimini yeniden kullanır. Bu, daha önce saklanan `@beta` gibi dist-tag'lerin ve tam sabitlenmiş sürümlerin sonraki `update <id>` çalıştırmalarında kullanılmaya devam ettiği anlamına gelir.

    Bu hedefli güncelleme kuralı, toplu `openclaw plugins update --all` bakım yolundan farklıdır. Toplu güncellemeler sıradan izlenen kurulum belirtimlerine yine saygı gösterir, ancak güvenilen resmi OpenClaw Plugin kayıtları, eski bir tam resmi pakette kalmak yerine geçerli resmi katalog hedefiyle eşitlenebilir. Tam veya etiketli bir resmi belirtimi bilerek dokunulmadan tutmak istediğinizde hedefli `update <id>` kullanın.

    npm kurulumları için dist-tag veya tam sürüm içeren açık bir npm paket belirtimi de iletebilirsiniz. OpenClaw, bu paket adını izlenen Plugin kaydına geri çözümler, kurulu Plugin'i günceller ve gelecekteki kimlik tabanlı güncellemeler için yeni npm belirtimini kaydeder.

    npm paket adını sürüm veya etiket olmadan iletmek de izlenen Plugin kaydına geri çözümlenir. Bir Plugin tam bir sürüme sabitlenmişse ve bunu kayıt defterinin varsayılan yayın çizgisine geri taşımak istiyorsanız bunu kullanın.

  </Accordion>
  <Accordion title="Beta channel updates">
    Hedefli `openclaw plugins update <id-or-npm-spec>`, yeni bir belirtim iletmediğiniz sürece izlenen Plugin belirtimini yeniden kullanır. Toplu `openclaw plugins update --all`, güvenilen resmi Plugin kayıtlarını resmi katalog hedefiyle eşitlerken yapılandırılmış `update.channel` değerini kullanır; böylece beta kanalı kurulumları, sessizce stable/latest değerine normalleştirilmek yerine beta yayın çizgisinde kalabilir.

    `openclaw update`, etkin OpenClaw güncelleme kanalını da bilir: beta kanalında, varsayılan çizgi npm ve ClawHub Plugin kayıtları önce `@beta` dener. Plugin beta yayını yoksa kayıtlı default/latest belirtimine geri dönerler; npm Plugin'leri beta paketi var olup kurulum doğrulamasından geçemediğinde de geri döner. Bu geri dönüş bir uyarı olarak bildirilir ve çekirdek güncellemeyi başarısız yapmaz. Tam sürümler ve açık etiketler hedefli güncellemeler için o seçiciye sabitlenmiş kalır.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Canlı bir npm güncellemesinden önce OpenClaw, kurulu paket sürümünü npm kayıt defteri meta verilerine karşı denetler. Kurulu sürüm ve kayıtlı yapıt kimliği çözümlenen hedefle zaten eşleşiyorsa güncelleme indirme, yeniden kurma veya `openclaw.json` yeniden yazma olmadan atlanır.

    Saklanan bir bütünlük karması varsa ve getirilen yapıt karması değişirse OpenClaw bunu npm yapıt sapması olarak ele alır. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek karmaları yazdırır ve devam etmeden önce onay ister. Etkileşimsiz güncelleme yardımcıları, çağıran açık bir devam politikası sağlamadığı sürece hata durumunda kapalı kalır.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install`, uyumluluk için `plugins update` üzerinde de kabul edilir, ancak kullanım dışıdır ve artık Plugin güncelleme davranışını değiştirmez. Operatör `security.installPolicy` güncellemeleri yine engelleyebilir; Plugin `before_install` kancaları yalnızca Plugin kancalarının yüklendiği süreçlerde uygulanır.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk on update">
    Topluluk ClawHub destekli Plugin güncellemeleri, yedek paketi indirmeden önce kurulumlarla aynı tam yayın güven denetimini çalıştırır. Seçilen ClawHub yayınında riskli bir güven uyarısı olduğunda devam etmesi gereken gözden geçirilmiş otomasyon için `--acknowledge-clawhub-risk` kullanın. Resmi ClawHub paketleri ve paketlenmiş OpenClaw Plugin kaynakları bu yayın güven istemini atlar.
  </Accordion>
</AccordionGroup>

### İnceleme

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

İnceleme, varsayılan olarak Plugin çalışma zamanını içe aktarmadan kimlik, yükleme durumu, kaynak, manifest yetenekleri, politika bayrakları, tanılamalar, kurulum meta verileri, paket yetenekleri ve algılanan MCP veya LSP sunucu desteğini gösterir. JSON çıktısı, operatörlerin bir Plugin'i etkinleştirmeden veya yeniden başlatmadan önce güvenilen yüzey bildirimlerini denetleyebilmesi için `contracts.agentToolResultMiddleware` ve `contracts.trustedToolPolicies` gibi Plugin manifest sözleşmelerini içerir. Plugin modülünü yüklemek ve kayıtlı kancaları, araçları, komutları, hizmetleri, Gateway yöntemlerini ve HTTP rotalarını dahil etmek için `--runtime` ekleyin. Çalışma zamanı incelemesi eksik Plugin bağımlılıklarını doğrudan bildirir; kurulumlar ve onarımlar `openclaw plugins install`, `openclaw plugins update` ve `openclaw doctor --fix` içinde kalır.

Plugin'e ait CLI komutları genellikle kök `openclaw` komut grupları olarak kurulur, ancak Plugin'ler `openclaw nodes` gibi çekirdek bir üst öğenin altında iç içe komutlar da kaydedebilir. `inspect --runtime`, `cliCommands` altında bir komut gösterdikten sonra komutu listelenen yolda çalıştırın; örneğin `demo-git` kaydeden bir Plugin, `openclaw demo-git ping` ile doğrulanabilir.

Her Plugin, çalışma zamanında gerçekten ne kaydettiğine göre sınıflandırılır:

- **plain-capability** — bir yetenek türü (ör. yalnızca sağlayıcı olan bir Plugin)
- **hybrid-capability** — birden çok yetenek türü (ör. metin + konuşma + görseller)
- **hook-only** — yalnızca kancalar, yetenek veya yüzey yok
- **non-capability** — araçlar/komutlar/hizmetler, ancak yetenek yok

Yetenek modeli hakkında daha fazla bilgi için [Plugin şekilleri](/tr/plugins/architecture#plugin-shapes) bölümüne bakın.

<Note>
`--json` bayrağı, betik yazma ve denetim için uygun makine tarafından okunabilir bir rapor çıktılar. `inspect --all`, şekil, yetenek türleri, uyumluluk bildirimleri, paket yetenekleri ve kanca özeti sütunlarıyla filo genelinde bir tablo işler. `info`, `inspect` için bir takma addır.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, Plugin yükleme hatalarını, manifest/keşif tanılamalarını, uyumluluk bildirimlerini ve eksik Plugin yuvaları gibi eski Plugin yapılandırma başvurularını bildirir. Kurulum ağacı ve Plugin yapılandırması temiz olduğunda `No plugin issues detected.` yazdırır. Eski yapılandırma kalmışsa ancak kurulum ağacı bunun dışında sağlıklıysa özet, tam Plugin sağlığını ima etmek yerine bunu söyler.

Yapılandırılmış bir Plugin diskte mevcutsa ancak yükleyicinin yol güvenliği denetimleri tarafından engelleniyorsa yapılandırma doğrulaması Plugin girdisini korur ve bunu `present but blocked` olarak bildirir. `plugins.entries.<id>` veya `plugins.allow` yapılandırmasını kaldırmak yerine yol sahipliği ya da herkes tarafından yazılabilir izinler gibi önceki engellenmiş Plugin tanılamasını düzeltin.

Eksik `register`/`activate` dışa aktarımları gibi modül şekli hataları için tanılama çıktısına kompakt bir dışa aktarım şekli özeti eklemek üzere `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Kayıt defteri

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Yerel Plugin kayıt defteri, OpenClaw'ın kurulu Plugin kimliği, etkinleştirme durumu, kaynak meta verileri ve katkı sahipliği için kalıcı soğuk okuma modelidir. Normal başlatma, sağlayıcı sahibi araması, kanal kurulum sınıflandırması ve Plugin envanteri bunu Plugin çalışma zamanı modüllerini içe aktarmadan okuyabilir.

Kalıcı kayıt defterinin mevcut, güncel veya eski olup olmadığını incelemek için `plugins registry` kullanın. Kalıcı Plugin dizini, yapılandırma politikası ve manifest/paket meta verilerinden yeniden oluşturmak için `--refresh` kullanın. Bu bir onarım yoludur, çalışma zamanı etkinleştirme yolu değildir.

`openclaw doctor --fix`, kayıt defterine bitişik yönetilen npm sapmasını da onarır: yönetilen Plugin npm projesi altındaki veya eski düz yönetilen npm kökü altındaki sahipsiz ya da kurtarılmış bir `@openclaw/*` paketi paketlenmiş bir Plugin'i gölgelerse doctor bu eski paketi kaldırır ve kayıt defterini yeniden oluşturur, böylece başlatma paketlenmiş manifeste göre doğrulama yapar. Doctor ayrıca `peerDependencies.openclaw` bildiren yönetilen npm Plugin'lerine ana makine `openclaw` paketini yeniden bağlar; böylece `openclaw/plugin-sdk/*` gibi paket yerel çalışma zamanı içe aktarımları güncellemelerden veya npm onarımlarından sonra çözümlenir.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`, kayıt defteri okuma hataları için kullanım dışı bırakılmış bir acil durum uyumluluk anahtarıdır. `plugins registry --refresh` veya `openclaw doctor --fix` tercih edin; env geri dönüşü yalnızca geçiş yayılırken acil başlatma kurtarması içindir.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list, yerel marketplace yolu, `marketplace.json` yolu, `owner/repo` gibi bir GitHub kısaltması, GitHub depo URL'si veya git URL'si kabul eder. `--json`, çözümlenen kaynak etiketini ve ayrıştırılmış marketplace manifestini ve Plugin girdilerini yazdırır.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [CLI başvurusu](/tr/cli)
- [ClawHub](/tr/clawhub)
