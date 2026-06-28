---
read_when:
    - Gateway Plugin'lerini veya uyumlu paketleri yüklemek ya da yönetmek istiyorsunuz
    - Basit bir araç Plugin'inin iskeletini oluşturmak veya doğrulamak istiyorsunuz
    - Plugin yükleme hatalarını ayıklamak istiyorsunuz
sidebarTitle: Plugins
summary: '`openclaw plugins` için CLI referansı (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)'
title: Pluginler
x-i18n:
    generated_at: "2026-06-28T20:43:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a703adb93af2490282f73b25cbbd95c7bc1d54c9c9c656fdb9b75465683f4ec8
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin'lerini, hook paketlerini ve uyumlu bundle'ları yönetin.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/tr/tools/plugin">
    Plugin yükleme, etkinleştirme ve sorun giderme için son kullanıcı kılavuzu.
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
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile clawhub-public --json
openclaw plugins marketplace refresh --feed-url https://clawhub.ai/v1/feeds/plugins --expected-sha256 <sha256>
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

Yavaş yükleme, inceleme, kaldırma veya registry yenileme araştırması için komutu
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ile çalıştırın. İz, aşama sürelerini stderr'e
yazar ve JSON çıktısının ayrıştırılabilir kalmasını sağlar. Bkz. [Hata ayıklama](/tr/help/debugging#plugin-lifecycle-trace).

<Note>
Nix modunda (`OPENCLAW_NIX_MODE=1`), Plugin yaşam döngüsü değiştiricileri devre dışıdır. Bu kurulum için `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` veya `plugins disable` yerine Nix kaynağını kullanın; nix-openclaw için agent-first [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) yolunu kullanın.
</Note>

<Note>
Bundle olarak gelen Plugin'ler OpenClaw ile birlikte gönderilir. Bazıları varsayılan olarak etkindir (örneğin bundle model sağlayıcıları, bundle konuşma sağlayıcıları ve bundle tarayıcı Plugin'i); diğerleri `plugins enable` gerektirir.

Yerel OpenClaw Plugin'leri, satır içi JSON Schema (`configSchema`, boş olsa bile) içeren `openclaw.plugin.json` göndermelidir. Uyumlu bundle'lar bunun yerine kendi bundle manifestlerini kullanır.

`plugins list`, `Format: openclaw` veya `Format: bundle` gösterir. Ayrıntılı liste/bilgi çıktısı ayrıca bundle alt türünü (`codex`, `claude` veya `cursor`) ve algılanan bundle yeteneklerini gösterir.
</Note>

### Yazar

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` varsayılan olarak minimal bir TypeScript araç Plugin'i oluşturur. İlk
argüman Plugin kimliğidir; görünen ad için `--name` iletin. OpenClaw,
varsayılan çıktı dizini ve paket adlandırması için kimliği kullanır. Araç iskeletleri
`defineToolPlugin` kullanır.
`plugins build`, derlenmiş entry'yi içe aktarır, statik araç meta verilerini okur,
`openclaw.plugin.json` yazar ve `package.json` `openclaw.extensions` değerini hizalı tutar.
`plugins validate`, oluşturulan manifestin, paket meta verilerinin ve
geçerli entry export'unun hâlâ uyumlu olduğunu denetler. Tam araç yazma iş akışı için
[Araç Plugin'leri](/tr/plugins/tool-plugins) bölümüne bakın.

İskelet TypeScript kaynağı yazar ancak meta verileri derlenmiş
`./dist/index.js` entry'sinden üretir; böylece iş akışı yayımlanmış CLI ile de çalışır. Entry varsayılan paket entry'si değilse
`--entry <path>` kullanın. CI'da, oluşturulan meta veriler eskiyse dosyaları
yeniden yazmadan başarısız olmak için `plugins build --check` kullanın.

### Sağlayıcı İskeleti

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Sağlayıcı iskeletleri, OpenAI uyumlu API anahtarı altyapısına, `clawhub package
validate` için yerleşik bir `npm run validate` betiğine, ClawHub paket meta verilerine ve GitHub Actions OIDC üzerinden gelecekte güvenilir yayımlama için elle tetiklenen bir GitHub workflow'una sahip genel bir metin/model sağlayıcı Plugin'i oluşturur. Sağlayıcı iskeletleri
Skills üretmez ve `openclaw plugins build` veya
`openclaw plugins validate` kullanmaz; bu komutlar araç iskeletinin
oluşturulan meta veri yolu içindir.

Yayımlamadan önce yer tutucu API temel URL'sini, model kataloğunu, belge
rotasını, kimlik bilgisi metnini ve README kopyasını gerçek sağlayıcı ayrıntılarıyla değiştirin. İlk kez ClawHub yayımlama ve güvenilir yayıncı kurulumu için
oluşturulan README'yi kullanın.

### Yükleme

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

Kurulum zamanı yüklemelerini test eden bakımcılar, korumalı ortam değişkenleriyle otomatik Plugin yükleme
kaynaklarını geçersiz kılabilir. Bkz.
[Plugin yükleme geçersiz kılmaları](/tr/plugins/install-overrides).

<Warning>
Çıplak paket adları, resmi bir Plugin kimliğiyle eşleşmedikleri sürece lansman geçişi sırasında varsayılan olarak npm'den yüklenir. Bundle Plugin'lerle eşleşen ham `@openclaw/*` paket spec'leri, geçerli OpenClaw derlemesiyle gönderilen bundle kopyayı kullanır. Bilerek harici bir npm paketi istediğinizde `npm:<package>` kullanın. ClawHub için `clawhub:<package>` kullanın. Plugin kurulumlarını kod çalıştırmak gibi ele alın. Sabitlenmiş sürümleri tercih edin.
</Warning>

`plugins search`, yüklenebilir Plugin paketleri için ClawHub'ı sorgular ve
yüklemeye hazır paket adlarını yazdırır. Skills değil, code-plugin ve bundle-plugin paketlerinde arama yapar. ClawHub Skills için `openclaw skills search` kullanın.

<Note>
ClawHub, çoğu Plugin için birincil dağıtım ve keşif yüzeyidir. Npm
desteklenen bir fallback ve doğrudan yükleme yolu olarak kalır. OpenClaw'a ait
`@openclaw/*` Plugin paketleri yeniden npm'de yayımlanır; güncel listeyi
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) üzerinde veya
[Plugin envanteri](/tr/plugins/plugin-inventory) bölümünde görebilirsiniz. Kararlı kurulumlar `latest` kullanır.
Beta kanalı kurulumları ve güncellemeleri, bu etiket kullanılabiliyorsa npm `beta` dist-tag'ini tercih eder, ardından `latest` değerine döner.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    `plugins` bölümünüz tek dosyalı bir `$include` ile destekleniyorsa, `plugins install/update/enable/disable/uninstall` bu dahil edilen dosyaya yazar ve `openclaw.json` dosyasını değiştirmez. Kök include'lar, include dizileri ve kardeş geçersiz kılmaları olan include'lar düzleştirilmek yerine kapalı şekilde başarısız olur. Desteklenen şekiller için [Config include'ları](/tr/gateway/configuration) bölümüne bakın.

    Kurulum sırasında config geçersizse, `plugins install` normalde kapalı şekilde başarısız olur ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Gateway başlangıcı ve hot reload sırasında, geçersiz Plugin config'i diğer tüm geçersiz config'ler gibi kapalı şekilde başarısız olur; `openclaw doctor --fix` geçersiz Plugin girdisini karantinaya alabilir. Belgelenmiş tek kurulum zamanı istisnası, açıkça `openclaw.install.allowInvalidConfigRecovery` seçeneğine dahil olan Plugin'ler için dar bir bundle Plugin kurtarma yoludur.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force`, mevcut kurulum hedefini yeniden kullanır ve zaten yüklenmiş bir Plugin'i veya hook paketini yerinde üzerine yazar. Aynı kimliği yeni bir yerel yoldan, arşivden, ClawHub paketinden veya npm artefaktından bilerek yeniden yüklerken kullanın. Zaten izlenen bir npm Plugin'inin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` tercih edin.

    Zaten yüklenmiş bir Plugin kimliği için `plugins install` çalıştırırsanız OpenClaw durur ve normal yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna, mevcut kurulumu gerçekten farklı bir kaynaktan üzerine yazmak istediğinizde ise `plugins install <package> --force` komutuna yönlendirir.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` yalnızca npm kurulumları için geçerlidir. `git:` kurulumlarıyla desteklenmez; sabitlenmiş bir kaynak istediğinizde `git:github.com/acme/plugin@v1.2.3` gibi açık bir git ref kullanın. `--marketplace` ile desteklenmez; çünkü marketplace kurulumları npm spec yerine marketplace kaynak meta verilerini kalıcılaştırır.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` kullanımdan kaldırılmıştır ve artık no-op'tur. OpenClaw artık Plugin kurulumları için yerleşik kurulum zamanı tehlikeli kod engellemesi çalıştırmaz.

    Ana makineye özgü kurulum politikası gerektiğinde paylaşılan operatör sahipli `security.installPolicy` yüzeyini kullanın. Plugin `before_install` hook'ları Plugin runtime yaşam döngüsü hook'larıdır ve CLI kurulumları için birincil politika sınırı değildir.

    ClawHub'da yayımladığınız bir Plugin registry taraması tarafından gizlenir veya engellenirse [ClawHub yayımlama](/tr/clawhub/publishing) bölümündeki yayıncı adımlarını kullanın. `--dangerously-force-unsafe-install`, ClawHub'dan Plugin'i yeniden taramasını veya engellenmiş bir sürümü herkese açık yapmasını istemez.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Topluluk ClawHub kurulumları, paketi indirmeden önce seçilen sürümün güven kaydını denetler. ClawHub sürüm için indirmeyi devre dışı bırakırsa, kötü amaçlı tarama bulguları bildirirse veya sürümü karantina gibi engelleyici bir moderasyon durumuna alırsa OpenClaw sürümü reddeder. Engelleyici olmayan riskli tarama durumları, riskli moderasyon durumları veya registry nedenleri için OpenClaw güven ayrıntılarını gösterir ve devam etmeden önce onay ister.

    `--acknowledge-clawhub-risk` seçeneğini yalnızca ClawHub uyarısını inceleyip etkileşimli istem olmadan devam etmeye karar verdikten sonra kullanın. Bekleyen veya eski temiz güven kayıtları uyarı verir ancak onay gerektirmez. Resmi ClawHub paketleri ve bundle OpenClaw Plugin kaynakları bu sürüm güven istemini atlar.

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install`, `package.json` içinde `openclaw.hooks` sunan hook paketleri için de kurulum yüzeyidir. Paket kurulumu için değil, filtrelenmiş hook görünürlüğü ve hook başına etkinleştirme için `openclaw hooks` kullanın.

    Npm belirtimleri **yalnızca kayıt defteri** içindir (paket adı + isteğe bağlı **tam sürüm** veya **dist-tag**). Git/URL/dosya belirtimleri ve semver aralıkları reddedilir. Bağımlılık kurulumları, kabuğunuzda genel npm kurulum ayarları olsa bile güvenlik için `--ignore-scripts` ile Plugin başına tek bir yönetilen npm projesinde çalışır. Yönetilen Plugin npm projeleri, OpenClaw'ın paket düzeyi npm `overrides` ayarlarını devralır; böylece ana makine güvenlik sabitlemeleri hoisted Plugin bağımlılıklarına da uygulanır.

    npm çözümlemesini açık yapmak istediğinizde `npm:<package>` kullanın. Çıplak paket belirtimleri de, resmi bir Plugin kimliğiyle eşleşmedikleri sürece başlatma geçişi sırasında doğrudan npm üzerinden kurulur.

    Paketlenmiş Plugin'lerle eşleşen ham `@openclaw/*` paket belirtimleri, npm geri dönüşünden önce imaja ait paketlenmiş kopyaya çözümlenir. Örneğin, `openclaw plugins install @openclaw/discord@2026.5.20 --pin`, yönetilen bir npm geçersiz kılması oluşturmak yerine mevcut OpenClaw derlemesindeki paketlenmiş Discord Plugin'ini kullanır. Harici npm paketini zorlamak için `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` kullanın.

    Çıplak belirtimler ve `@latest` kararlı hatta kalır. `2026.5.3-1` gibi OpenClaw tarih damgalı düzeltme sürümleri bu kontrol için kararlı sürümlerdir. npm bunlardan herhangi birini ön sürüme çözümlerse, OpenClaw durur ve `@beta`/`@rc` gibi bir ön sürüm etiketiyle veya `@1.2.3-beta.4` gibi tam bir ön sürümle açıkça katılmanızı ister.

    Tam sürüm olmadan yapılan npm kurulumlarında (`npm:<package>` veya `npm:<package>@latest`), OpenClaw kurulumdan önce çözümlenen paket meta verilerini kontrol eder. En son kararlı paket daha yeni bir OpenClaw Plugin API'si veya minimum ana makine sürümü gerektiriyorsa, OpenClaw daha eski kararlı sürümleri inceler ve bunun yerine en yeni uyumlu sürümü kurar. Tam sürümler ve `@beta` gibi açık dist-tag'ler katı kalır: seçilen paket uyumsuzsa komut başarısız olur ve OpenClaw'ı yükseltmenizi veya uyumlu bir sürüm seçmenizi ister.

    Çıplak kurulum belirtimi resmi bir Plugin kimliğiyle eşleşirse (örneğin `diffs`), OpenClaw katalog girdisini doğrudan kurar. Aynı ada sahip bir npm paketi kurmak için açık kapsamlı bir belirtim kullanın (örneğin `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Doğrudan bir git deposundan kurulum yapmak için `git:<repo>` kullanın. Desteklenen biçimler arasında `git:github.com/owner/repo`, `git:owner/repo`, tam `https://`, `ssh://`, `git://`, `file://` ve `git@host:owner/repo.git` klon URL'leri bulunur. Kurulumdan önce bir dalı, etiketi veya commit'i checkout etmek için `@<ref>` veya `#<ref>` ekleyin.

    Git kurulumları geçici bir dizine klonlar, varsa istenen ref'i checkout eder, ardından normal Plugin dizini kurucusunu kullanır. Bu, manifest doğrulamasının, operatör kurulum politikasının, paket yöneticisi kurulum işinin ve kurulum kayıtlarının npm kurulumları gibi davrandığı anlamına gelir. Kaydedilen git kurulumları kaynak URL/ref bilgisini ve çözümlenen commit'i içerir; böylece `openclaw plugins update` kaynağı daha sonra yeniden çözümleyebilir.

    Git üzerinden kurulum yaptıktan sonra gateway yöntemleri ve CLI komutları gibi çalışma zamanı kayıtlarını doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. Plugin `api.registerCli` ile bir CLI kökü kaydettiyse, bu komutu doğrudan OpenClaw kök CLI üzerinden çalıştırın; örneğin `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Yerel OpenClaw Plugin arşivleri, çıkarılan Plugin kökünde geçerli bir `openclaw.plugin.json` içermelidir; yalnızca `package.json` içeren arşivler, OpenClaw kurulum kayıtlarını yazmadan önce reddedilir.

    Dosya bir npm-pack tarball'ı olduğunda ve kayıt defteri kurulumları tarafından kullanılan aynı Plugin başına yönetilen npm projesi yolunu test etmek istediğinizde `npm-pack:<path.tgz>` kullanın; buna `package-lock.json` doğrulaması, hoisted bağımlılık taraması ve npm kurulum kayıtları dahildir. Düz arşiv yolları yine de Plugin uzantıları kökü altında yerel arşivler olarak kurulur.

    Claude marketplace kurulumları da desteklenir.

  </Accordion>
</AccordionGroup>

ClawHub kurulumları açık bir `clawhub:<package>` konumlayıcısı kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Çıplak npm açısından güvenli Plugin belirtimleri, resmi bir Plugin kimliğiyle eşleşmedikleri sürece başlatma geçişi sırasında varsayılan olarak npm üzerinden kurulur:

```bash
openclaw plugins install openclaw-codex-app-server
```

Yalnızca npm çözümlemesini açık yapmak için `npm:` kullanın:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw, kurulumdan önce duyurulan Plugin API'si / minimum gateway uyumluluğunu kontrol eder. Seçilen ClawHub sürümü bir ClawPack yapıtı yayımladığında, OpenClaw sürümlenmiş npm-pack `.tgz` dosyasını indirir, ClawHub digest üst bilgisini ve yapıt digest'ini doğrular, ardından normal arşiv yolu üzerinden kurar. ClawPack meta verisi olmayan daha eski ClawHub sürümleri yine de eski paket arşivi doğrulama yolu üzerinden kurulur. Kaydedilen kurulumlar daha sonraki güncellemeler için ClawHub kaynak meta verilerini, yapıt türünü, npm bütünlüğünü, npm shasum değerini, tarball adını ve ClawPack digest bilgilerini tutar.
Sürümlenmemiş ClawHub kurulumları, `openclaw plugins update` komutunun daha yeni ClawHub sürümlerini izleyebilmesi için sürümlenmemiş bir kayıtlı belirtim tutar; `clawhub:pkg@1.2.3` ve `clawhub:pkg@beta` gibi açık sürüm veya etiket seçicileri bu seçiciye sabitlenmiş olarak kalır.

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
    - `~/.claude/plugins/known_marketplaces.json` içinden bir Claude bilinen marketplace adı
    - yerel bir marketplace kökü veya `marketplace.json` yolu
    - `owner/repo` gibi bir GitHub repo kısaltması
    - `https://github.com/owner/repo` gibi bir GitHub repo URL'si
    - bir git URL'si

  </Tab>
  <Tab title="Remote marketplace rules">
    GitHub veya git'ten yüklenen uzak marketplace'ler için Plugin girdileri klonlanan marketplace reposunun içinde kalmalıdır. OpenClaw bu repodan göreli yol kaynaklarını kabul eder ve uzak manifestlerden gelen HTTP(S), mutlak yol, git, GitHub ve diğer yol olmayan Plugin kaynaklarını reddeder.
  </Tab>
</Tabs>

Yerel yollar ve arşivler için OpenClaw otomatik olarak algılar:

- yerel OpenClaw Plugin'leri (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya varsayılan Claude bileşen düzeni)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

Yönetilen yerel kurulumlar Plugin dizinleri veya arşivleri olmalıdır. Bağımsız `.js`,
`.mjs`, `.cjs` ve `.ts` Plugin dosyaları `plugins install` tarafından yönetilen Plugin
köküne kopyalanmaz; bunun yerine bunları `plugins.load.paths` içinde açıkça listeleyin.

<Note>
Uyumlu paketler normal Plugin köküne kurulur ve aynı liste/bilgi/etkinleştirme/devre dışı bırakma akışına katılır. Bugün paket Skills, Claude komut-skills, Claude `settings.json` varsayılanları, Claude `.lsp.json` / manifest tarafından bildirilen `lspServers` varsayılanları, Cursor komut-skills ve uyumlu Codex hook dizinleri desteklenir; algılanan diğer paket yetenekleri tanılarda/bilgide gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmamıştır.
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
  Tablo görünümünden, kaynak/köken/sürüm/etkinleştirme meta verileri içeren Plugin başına ayrıntı satırlarına geç.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir envanter ile kayıt tanıları ve paket bağımlılığı kurulum durumu.
</ParamField>

<Note>
`plugins list` önce kalıcı yerel Plugin kayıt defterini okur; kayıt defteri eksik veya geçersizse yalnızca manifestten türetilen bir geri dönüş kullanır. Bir Plugin'in kurulu, etkin ve soğuk başlatma planlamasına görünür olup olmadığını denetlemek için kullanışlıdır, ancak zaten çalışan bir Gateway sürecinin canlı çalışma zamanı yoklaması değildir. Plugin kodunu, etkinleştirmeyi, hook ilkesini veya `plugins.load.paths` değerini değiştirdikten sonra yeni `register(api)` kodunun ya da hook'ların çalışmasını beklemeden önce kanala hizmet veren Gateway'i yeniden başlatın. Uzak/konteyner dağıtımları için yalnızca bir sarmalayıcı süreci değil, gerçek `openclaw gateway run` alt sürecini yeniden başlattığınızı doğrulayın.

`plugins list --json`, her Plugin'in `package.json` içindeki `dependencies` ve
`optionalDependencies` değerlerinden gelen `dependencyStatus` alanını içerir. OpenClaw bu paket
adlarının Plugin'in normal Node `node_modules` arama yolu boyunca mevcut olup olmadığını denetler;
Plugin çalışma zamanı kodunu içe aktarmaz, paket yöneticisi çalıştırmaz veya eksik
bağımlılıkları onarmaz.
</Note>

Başlatma günlükleri `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` gösterirse,
Plugin kimliklerini doğrulamak için `openclaw plugins list --enabled --verbose` veya listelenen bir Plugin kimliğiyle
`openclaw plugins inspect <id>` çalıştırın ve güvenilir kimlikleri `openclaw.json` içindeki `plugins.allow` alanına kopyalayın. Uyarı keşfedilen her Plugin'i listeleyebildiğinde, bu kimlikleri zaten içeren yapıştırmaya hazır bir
`plugins.allow` parçacığı yazdırır. Bir Plugin kurulum/yükleme yolu kökeni olmadan yüklenirse,
o Plugin kimliğini inceleyin, ardından güvenilir kimliği `plugins.allow` içine sabitleyin ya da OpenClaw'ın kurulum kökenini kaydetmesi için Plugin'i güvenilir bir kaynaktan yeniden kurun.

`plugins search`, uzak bir ClawHub katalog aramasıdır. Yerel
durumu incelemez, yapılandırmayı değiştirmez, paket kurmaz veya Plugin çalışma zamanı kodunu yüklemez. Arama
sonuçları ClawHub paket adını, ailesini, kanalını, sürümünü, özetini ve
`openclaw plugins install clawhub:<package>` gibi bir kurulum ipucunu içerir.

Paketlenmiş bir Docker imajı içinde paketlenmiş Plugin çalışması için Plugin
kaynak dizinini, `/app/extensions/synology-chat` gibi eşleşen paketlenmiş kaynak yolunun üzerine bind-mount yapın. OpenClaw bu bağlanan kaynak
örtüsünü `/app/dist/extensions/synology-chat` konumundan önce keşfeder; düz kopyalanmış bir kaynak
dizini etkisiz kalır, böylece normal paketlenmiş kurulumlar derlenmiş dist'i kullanmaya devam eder.

Çalışma zamanı hook hata ayıklaması için:

- `openclaw plugins inspect <id> --runtime --json`, modül yüklenmiş bir inceleme geçişinden kayıtlı hook'ları ve tanıları gösterir. Çalışma zamanı incelemesi bağımlılıkları asla kurmaz; eski bağımlılık durumunu temizlemek veya yapılandırmada başvurulan eksik indirilebilir Plugin'leri kurtarmak için `openclaw doctor --fix` kullanın.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway URL'sini/profilini, hizmet/süreç ipuçlarını, yapılandırma yolunu ve RPC sağlığını doğrular.
- Paketlenmemiş konuşma hook'ları (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.

Yerel bir Plugin dizinini kopyalamaktan kaçınmak için `--link` kullanın (`plugins.load.paths` alanına ekler):

```bash
openclaw plugins install -l ./my-plugin
```

Bağımsız Plugin dosyaları, `plugins install` ile kurulmak veya doğrudan
`~/.openclaw/extensions` ya da `<workspace>/.openclaw/extensions` içine yerleştirilmek yerine `plugins.load.paths` içinde listelenmelidir. Bu otomatik keşfedilen kökler Plugin
paketi veya paket dizinlerini yüklerken, üst düzey betik dosyaları yerel
yardımcılar olarak değerlendirilir ve atlanır.

<Note>
Bir çalışma alanı extensions kökünden keşfedilen çalışma alanı kökenli Plugin'ler,
açıkça etkinleştirilene kadar içe aktarılmaz veya çalıştırılmaz. Yerel geliştirme için
`openclaw plugins enable <plugin-id>` komutunu çalıştırın ya da
`plugins.entries.<plugin-id>.enabled: true` ayarını yapın; yapılandırmanız
`plugins.allow` kullanıyorsa aynı Plugin kimliğini oraya da ekleyin. Bu kapalı durumda başarısız olma kuralı,
kanal kurulumu yalnızca kurulum için yükleme amacıyla açıkça çalışma alanı kökenli bir Plugin'i hedeflediğinde de
geçerlidir; bu nedenle ilgili çalışma alanı Plugin'i devre dışı kaldığı veya izin listesinden hariç tutulduğu sürece
yerel kanal Plugin kurulum kodu çalışmaz. Bağlantılı kurulumlar
ve açık `plugins.load.paths` girdileri, çözümlenen Plugin kökenleri için normal politikayı izler. Bkz.
[Plugin politikasını yapılandırma](/tr/tools/plugin#configure-plugin-policy)
ve [Yapılandırma başvurusu](/tr/gateway/configuration-reference#plugins).

`--force`, `--link` ile desteklenmez; çünkü bağlantılı kurulumlar yönetilen kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullanır.

Varsayılan davranışı sabitlenmemiş halde tutarken, çözümlenen kesin belirtimi (`name@version`) yönetilen Plugin dizinine kaydetmek için npm kurulumlarında `--pin` kullanın.
</Note>

### Plugin dizini

Plugin kurulum meta verileri, kullanıcı yapılandırması değil, makine tarafından yönetilen durumdur. Kurulumlar ve güncellemeler bunu etkin OpenClaw durum dizini altındaki paylaşılan SQLite durum veritabanına yazar. `installed_plugin_index` satırı, bozuk veya eksik Plugin manifest kayıtları dahil olmak üzere kalıcı `installRecords` meta verilerini ve `openclaw plugins update`, kaldırma, tanılama ve soğuk Plugin kayıt defteri tarafından kullanılan manifestten türetilmiş soğuk kayıt defteri önbelleğini saklar.

OpenClaw, yapılandırmada gönderilmiş eski `plugins.installs` kayıtları gördüğünde, çalışma zamanı okumaları bunları `openclaw.json` dosyasını yeniden yazmadan uyumluluk girdisi olarak ele alır. Açık Plugin yazmaları ve `openclaw doctor --fix`, yapılandırma yazmalarına izin verildiğinde bu kayıtları Plugin dizinine taşır ve yapılandırma anahtarını kaldırır; yazmalardan biri başarısız olursa kurulum meta verilerinin kaybolmaması için yapılandırma kayıtları korunur.

### Kaldırma

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, uygulanabilir olduğunda Plugin kayıtlarını `plugins.entries`, kalıcı Plugin dizini, Plugin izin/engelleme listesi girdileri ve bağlantılı `plugins.load.paths` girdilerinden kaldırır. `--keep-files` ayarlanmadığı sürece, kaldırma işlemi OpenClaw'ın Plugin extensions kökü içindeyse izlenen yönetilen kurulum dizinini de kaldırır. Active Memory Plugin'leri için bellek yuvası `memory-core` değerine sıfırlanır.

<Note>
`--keep-config`, `--keep-files` için kullanımdan kaldırılmış bir takma ad olarak desteklenir.
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

Güncellemeler, yönetilen Plugin dizinindeki izlenen Plugin kurulumlarına ve `hooks.internal.installs` içindeki izlenen hook paketi kurulumlarına uygulanır.

<AccordionGroup>
  <Accordion title="Plugin kimliği ile npm belirtimini çözümleme">
    Bir Plugin kimliği geçirdiğinizde OpenClaw, o Plugin için kaydedilmiş kurulum belirtimini yeniden kullanır. Bu, `@beta` gibi daha önce saklanan dist-tag'lerin ve kesin sabitlenmiş sürümlerin sonraki `update <id>` çalıştırmalarında kullanılmaya devam edeceği anlamına gelir.

    `update <id> --dry-run` sırasında, kesin sabitlenmiş npm kurulumları sabit kalır. OpenClaw paketin kayıt defteri varsayılan hattını da çözümleyebiliyorsa ve bu varsayılan hat kurulu sabitlenmiş sürümden daha yeniyse, kuru çalıştırma sabitlemeyi bildirir ve kayıt defteri varsayılan hattını izlemek için açık `@latest` paket güncelleme komutunu yazdırır.

    Bu hedefli güncelleme kuralı, toplu `openclaw plugins update --all` bakım yolundan farklıdır. Toplu güncellemeler sıradan izlenen kurulum belirtimlerine hâlâ uyar, ancak güvenilir resmi OpenClaw Plugin kayıtları, eski bir kesin resmi pakette kalmak yerine geçerli resmi katalog hedefine eşitlenebilir. Kesin veya etiketli bir resmi belirtimi bilerek dokunulmadan tutmak istediğinizde hedefli `update <id>` kullanın.

    npm kurulumları için dist-tag veya kesin sürüm içeren açık bir npm paket belirtimi de geçirebilirsiniz. OpenClaw bu paket adını izlenen Plugin kaydına geri çözümler, o kurulu Plugin'i günceller ve gelecekteki kimlik tabanlı güncellemeler için yeni npm belirtimini kaydeder.

    Sürüm veya etiket olmadan npm paket adını geçirmek de izlenen Plugin kaydına geri çözümlenir. Bir Plugin kesin bir sürüme sabitlendiğinde ve onu kayıt defterinin varsayılan yayın hattına geri taşımak istediğinizde bunu kullanın.

  </Accordion>
  <Accordion title="Beta kanal güncellemeleri">
    Hedefli `openclaw plugins update <id-or-npm-spec>`, yeni bir belirtim geçirmediğiniz sürece izlenen Plugin belirtimini yeniden kullanır. Toplu `openclaw plugins update --all`, güvenilir resmi Plugin kayıtlarını resmi katalog hedefine eşitlerken yapılandırılmış `update.channel` değerini kullanır; böylece beta kanal kurulumları sessizce stable/latest değerine normalleştirilmek yerine beta yayın hattında kalabilir.

    `openclaw update` etkin OpenClaw güncelleme kanalını da bilir: beta kanalında varsayılan hat npm ve ClawHub Plugin kayıtları önce `@beta` dener. Plugin beta yayını yoksa kaydedilmiş default/latest belirtimine geri dönerler; npm Plugin'leri ayrıca beta paket mevcut olsa da kurulum doğrulaması başarısız olduğunda geri döner. Bu geri dönüş uyarı olarak bildirilir ve çekirdek güncellemeyi başarısız yapmaz. Kesin sürümler ve açık etiketler, hedefli güncellemeler için o seçiciye sabit kalır.

  </Accordion>
  <Accordion title="Sürüm kontrolleri ve bütünlük sapması">
    Canlı bir npm güncellemesinden önce OpenClaw, kurulu paket sürümünü npm kayıt defteri meta verilerine göre denetler. Kurulu sürüm ve kaydedilmiş yapıt kimliği çözümlenen hedefle zaten eşleşiyorsa, güncelleme indirme, yeniden kurma veya `openclaw.json` dosyasını yeniden yazma olmadan atlanır.

    Saklanan bir bütünlük karması mevcut olduğunda ve getirilen yapıt karması değiştiğinde OpenClaw bunu npm yapıt sapması olarak ele alır. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek karmaları yazdırır ve devam etmeden önce onay ister. Etkileşimsiz güncelleme yardımcıları, çağıran açık bir devam politikası sağlamadıkça kapalı durumda başarısız olur.

  </Accordion>
  <Accordion title="Güncellemede --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, uyumluluk için `plugins update` üzerinde de kabul edilir, ancak kullanımdan kaldırılmıştır ve artık Plugin güncelleme davranışını değiştirmez. Operatör `security.installPolicy` güncellemeleri hâlâ engelleyebilir; Plugin `before_install` hook'ları yalnızca Plugin hook'larının yüklendiği süreçlerde uygulanır.
  </Accordion>
  <Accordion title="Güncellemede --acknowledge-clawhub-risk">
    Topluluk ClawHub destekli Plugin güncellemeleri, yedek paketi indirmeden önce kurulumlarla aynı kesin yayın güven denetimini çalıştırır. Seçilen ClawHub yayını riskli bir güven uyarısına sahip olduğunda devam etmesi gereken gözden geçirilmiş otomasyon için `--acknowledge-clawhub-risk` kullanın. Resmi ClawHub paketleri ve paketlenmiş OpenClaw Plugin kaynakları bu yayın güven istemini atlar.
  </Accordion>
</AccordionGroup>

### İnceleme

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect, varsayılan olarak Plugin çalışma zamanını içe aktarmadan kimliği, yükleme durumunu, kaynağı, manifest yeteneklerini, politika bayraklarını, tanılamaları, kurulum meta verilerini, paket yeteneklerini ve algılanan MCP veya LSP sunucu desteğini gösterir. JSON çıktısı, `contracts.agentToolResultMiddleware` ve `contracts.trustedToolPolicies` gibi Plugin manifest sözleşmelerini içerir; böylece operatörler bir Plugin'i etkinleştirmeden veya yeniden başlatmadan önce güvenilir yüzey bildirimlerini denetleyebilir. Plugin modülünü yüklemek ve kayıtlı hook'ları, araçları, komutları, hizmetleri, Gateway yöntemlerini ve HTTP rotalarını dahil etmek için `--runtime` ekleyin. Çalışma zamanı incelemesi eksik Plugin bağımlılıklarını doğrudan bildirir; kurulumlar ve onarımlar `openclaw plugins install`, `openclaw plugins update` ve `openclaw doctor --fix` içinde kalır.

Plugin'e ait CLI komutları genellikle kök `openclaw` komut grupları olarak kurulur, ancak Plugin'ler `openclaw nodes` gibi bir çekirdek üst öğe altında iç içe komutlar da kaydedebilir. `inspect --runtime`, `cliCommands` altında bir komut gösterdikten sonra komutu listelenen yolda çalıştırın; örneğin `demo-git` kaydeden bir Plugin, `openclaw demo-git ping` ile doğrulanabilir.

Her Plugin, çalışma zamanında gerçekten ne kaydettiğine göre sınıflandırılır:

- **plain-capability** — tek yetenek türü (ör. yalnızca sağlayıcı Plugin'i)
- **hybrid-capability** — birden fazla yetenek türü (ör. metin + konuşma + görseller)
- **hook-only** — yalnızca hook'lar, yetenek veya yüzey yok
- **non-capability** — araçlar/komutlar/hizmetler var, ancak yetenek yok

Yetenek modeli hakkında daha fazla bilgi için [Plugin şekilleri](/tr/plugins/architecture#plugin-shapes) bölümüne bakın.

<Note>
`--json` bayrağı, betik oluşturma ve denetim için uygun, makine tarafından okunabilir bir rapor çıktılar. `inspect --all`, şekil, yetenek türleri, uyumluluk bildirimleri, paket yetenekleri ve hook özeti sütunları içeren filo genelinde bir tablo işler. `info`, `inspect` için bir takma addır.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, Plugin yükleme hatalarını, manifest/keşif tanılamalarını, uyumluluk bildirimlerini ve eksik Plugin yuvaları gibi eski Plugin yapılandırma başvurularını bildirir. Kurulum ağacı ve Plugin yapılandırması temiz olduğunda `No plugin issues detected.` yazdırır. Eski yapılandırma kalmış ancak kurulum ağacı bunun dışında sağlıklıysa, özet tam Plugin sağlığı ima etmek yerine bunu belirtir.

Yapılandırılmış bir Plugin diskte mevcutsa ancak yükleyicinin yol güvenliği denetimleri tarafından engelleniyorsa, yapılandırma doğrulaması Plugin girdisini korur ve bunu `present but blocked` olarak bildirir. `plugins.entries.<id>` veya `plugins.allow` yapılandırmasını kaldırmak yerine, yol sahipliği veya herkes tarafından yazılabilir izinler gibi önceki engellenmiş Plugin tanılamasını düzeltin.

Eksik `register`/`activate` dışa aktarımları gibi modül şekli hataları için, tanılama çıktısına kompakt bir dışa aktarım şekli özeti eklemek üzere `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Kayıt Defteri

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Yerel Plugin kayıt defteri, kurulu Plugin kimliği, etkinleştirme, kaynak meta verileri ve katkı sahipliği için OpenClaw'ın kalıcı soğuk okuma modelidir. Normal başlatma, sağlayıcı sahip araması, kanal kurulum sınıflandırması ve Plugin envanteri bunu Plugin çalışma zamanı modüllerini içe aktarmadan okuyabilir.

Kalıcı kayıt defterinin mevcut, güncel veya eski olup olmadığını incelemek için `plugins registry` kullanın. Kalıcı Plugin dizini, yapılandırma politikası ve manifest/paket meta verilerinden yeniden oluşturmak için `--refresh` kullanın. Bu bir onarım yoludur, çalışma zamanı etkinleştirme yolu değildir.

`openclaw doctor --fix` ayrıca kayıt defterine komşu yönetilen npm sapmasını da onarır: yönetilen bir Plugin npm projesi altında veya eski düz yönetilen npm kökünde yetim kalmış ya da kurtarılmış bir `@openclaw/*` paketi paketlenmiş bir Plugin'i gölgeliyorsa, doctor bu eski paketi kaldırır ve başlangıcın paketlenmiş manifesti doğrulaması için kayıt defterini yeniden oluşturur. Doctor ayrıca `peerDependencies.openclaw` bildiren yönetilen npm Plugin'lerine ana makine `openclaw` paketini yeniden bağlar; böylece `openclaw/plugin-sdk/*` gibi paket yerel çalışma zamanı içe aktarımları güncellemelerden veya npm onarımlarından sonra çözümlenir.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`, kayıt defteri okuma hataları için kullanımdan kaldırılmış acil durum uyumluluk anahtarıdır. `plugins registry --refresh` veya `openclaw doctor --fix` tercih edin; env geri dönüşü yalnızca geçiş yayılırken acil başlatma kurtarması içindir.
</Warning>

### Pazaryeri

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

Marketplace list yerel bir marketplace yolunu, bir `marketplace.json` yolunu, `owner/repo` gibi bir GitHub kısaltmasını, bir GitHub depo URL'sini veya bir git URL'sini kabul eder. `--json`, çözümlenen kaynak etiketinin yanı sıra ayrıştırılan marketplace manifestini ve Plugin girişlerini yazdırır.

Marketplace refresh, barındırılan bir OpenClaw marketplace akışını yükler ve doğrulanmış yanıtı yerel barındırılan akış anlık görüntüsü olarak kalıcı hale getirir. Seçenek olmadan, yapılandırılmış varsayılan akış profilini kullanır. Belirli bir yapılandırılmış profili yenilemek için `--feed-profile <name>`, açık bir barındırılan akış URL'sini yenilemek için `--feed-url <url>`, eşleşen bir yük sağlama toplamı (`sha256:<hex>` veya düz 64 karakterlik hex özet) gerektirmek için `--expected-sha256 <sha256>` ve makine tarafından okunabilir çıktı için `--json` kullanın. Açık barındırılan akış URL'leri kimlik bilgileri, sorgu dizeleri veya parçalar içermemelidir. Sabitlenmemiş yenilemeler, komutu başarısız kılmadan barındırılan bir anlık görüntü veya paketlenmiş yedek sonucu bildirebilir. Sabitlenmiş yenilemeler, yeni bir barındırılan yükü kabul etmedikçe başarısız olur ve başarılı barındırılan yenilemeler, OpenClaw doğrulanmış anlık görüntüyü kalıcı hale getiremezse başarısız olur.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [CLI başvurusu](/tr/cli)
- [ClawHub](/tr/clawhub)
