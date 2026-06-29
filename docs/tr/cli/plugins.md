---
read_when:
    - Gateway Pluginlerini veya uyumlu paketleri kurmak ya da yönetmek istiyorsunuz
    - Basit bir araç Plugin’ini yapılandırmak veya doğrulamak istiyorsunuz
    - Plugin yükleme hatalarını ayıklamak istiyorsunuz
sidebarTitle: Plugins
summary: '`openclaw plugins` için CLI başvurusu (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)'
title: Pluginler
x-i18n:
    generated_at: "2026-06-28T22:33:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 528a7ead224eab330bc0a83314d205a68c7f814ad336441aee7b19170c105e43
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Plugin’lerini, hook paketlerini ve uyumlu paketleri yönetin.

<CardGroup cols={2}>
  <Card title="Plugin sistemi" href="/tr/tools/plugin">
    Plugin’leri yükleme, etkinleştirme ve sorun giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Plugin’leri yönet" href="/tr/plugins/manage-plugins">
    Yükleme, listeleme, güncelleme, kaldırma ve yayımlama için hızlı örnekler.
  </Card>
  <Card title="Plugin paketleri" href="/tr/plugins/bundles">
    Paket uyumluluk modeli.
  </Card>
  <Card title="Plugin bildirimi" href="/tr/plugins/manifest">
    Bildirim alanları ve yapılandırma şeması.
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
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
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

Yavaş yükleme, inceleme, kaldırma veya kayıt yenileme araştırması için komutu
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ile çalıştırın. İz, aşama sürelerini stderr’ye
yazar ve JSON çıktısını ayrıştırılabilir tutar. Bkz. [Hata Ayıklama](/tr/help/debugging#plugin-lifecycle-trace).

<Note>
Nix modunda (`OPENCLAW_NIX_MODE=1`), plugin yaşam döngüsü değiştiricileri devre dışıdır. Bu yükleme için `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` veya `plugins disable` yerine Nix kaynağını kullanın; nix-openclaw için ajan öncelikli [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) bölümünü kullanın.
</Note>

<Note>
Paketlenmiş plugin’ler OpenClaw ile birlikte gelir. Bazıları varsayılan olarak etkindir (örneğin paketlenmiş model sağlayıcıları, paketlenmiş konuşma sağlayıcıları ve paketlenmiş tarayıcı plugin’i); diğerleri `plugins enable` gerektirir.

Yerel OpenClaw plugin’leri satır içi JSON Schema (`configSchema`, boş olsa bile) içeren `openclaw.plugin.json` ile gönderilmelidir. Uyumlu paketler bunun yerine kendi paket bildirimlerini kullanır.

`plugins list`, `Format: openclaw` veya `Format: bundle` gösterir. Ayrıntılı liste/bilgi çıktısı ayrıca paket alt türünü (`codex`, `claude` veya `cursor`) ve algılanan paket yeteneklerini gösterir.
</Note>

### Yazar

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` varsayılan olarak minimal bir TypeScript araç plugin’i oluşturur. İlk
argüman plugin kimliğidir; görüntü adı için `--name` iletin. OpenClaw, kimliği
varsayılan çıktı dizini ve paket adlandırması için kullanır. Araç iskeletleri
`defineToolPlugin` kullanır.
`plugins build`, derlenmiş girişi içe aktarır, statik araç meta verilerini okur,
`openclaw.plugin.json` yazar ve `package.json` `openclaw.extensions` değerini hizalı tutar.
`plugins validate`, oluşturulan bildirimin, paket meta verilerinin ve geçerli
giriş dışa aktarımının hâlâ uyumlu olduğunu denetler. Tam araç yazma iş akışı için
[Araç Plugin’leri](/tr/plugins/tool-plugins) bölümüne bakın.

İskelet TypeScript kaynağı yazar ancak meta verileri derlenmiş `./dist/index.js`
girişinden oluşturur; böylece iş akışı yayımlanmış CLI ile de çalışır. Giriş,
varsayılan paket girişi değilse `--entry <path>` kullanın. CI’da dosyaları yeniden
yazmadan oluşturulan meta veriler eskiyse başarısız olmak için
`plugins build --check` kullanın.

### Sağlayıcı İskeleti

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Sağlayıcı iskeletleri OpenAI uyumlu API anahtarı tesisatı, `clawhub package
validate` için yerleşik bir `npm run validate` betiği, ClawHub paket meta verileri
ve GitHub Actions OIDC üzerinden gelecekte güvenilir yayımlama için elle tetiklenen
bir GitHub iş akışı içeren genel bir metin/model sağlayıcı plugin’i oluşturur.
Sağlayıcı iskeletleri Skills oluşturmaz ve `openclaw plugins build` veya
`openclaw plugins validate` kullanmaz; bu komutlar araç iskeletinin oluşturulan
meta veri yolu içindir.

Yayımlamadan önce yer tutucu API temel URL’sini, model kataloğunu, dokümantasyon
rotasını, kimlik bilgisi metnini ve README kopyasını gerçek sağlayıcı ayrıntılarıyla
değiştirin. İlk kez ClawHub yayımlama ve güvenilir yayımlayıcı kurulumu için
oluşturulan README’yi kullanın.

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

Kurulum zamanı yüklemelerini test eden bakımcılar, korumalı ortam değişkenleriyle
otomatik plugin yükleme kaynaklarını geçersiz kılabilir. Bkz.
[Plugin yükleme geçersiz kılmaları](/tr/plugins/install-overrides).

<Warning>
Çıplak paket adları, resmi bir plugin kimliğiyle eşleşmedikleri sürece lansman geçişi sırasında varsayılan olarak npm’den yüklenir. Paketlenmiş plugin’lerle eşleşen ham `@openclaw/*` paket belirtimleri, geçerli OpenClaw derlemesiyle gönderilen paketlenmiş kopyayı kullanır. Bunun yerine bilerek harici bir npm paketi istiyorsanız `npm:<package>` kullanın. ClawHub için `clawhub:<package>` kullanın. Plugin yüklemelerini kod çalıştırmak gibi ele alın. Sabitlenmiş sürümleri tercih edin.
</Warning>

`plugins search`, yüklenebilir plugin paketleri için ClawHub’ı sorgular ve
yüklemeye hazır paket adlarını yazdırır. Skills’i değil, code-plugin ve
bundle-plugin paketlerini arar. ClawHub Skills için `openclaw skills search`
kullanın.

<Note>
ClawHub çoğu plugin için birincil dağıtım ve keşif yüzeyidir. Npm desteklenen
bir yedek ve doğrudan yükleme yolu olmaya devam eder. OpenClaw’a ait
`@openclaw/*` plugin paketleri tekrar npm’de yayımlanır; geçerli listeye
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) veya
[plugin envanteri](/tr/plugins/plugin-inventory) üzerinden bakın. Kararlı yüklemeler
`latest` kullanır. Beta kanalı yüklemeleri ve güncellemeleri, bu etiket mevcut
olduğunda npm `beta` dist-tag’ini tercih eder, ardından `latest` değerine geri döner.
</Note>

<AccordionGroup>
  <Accordion title="Yapılandırma include’ları ve geçersiz yapılandırma onarımı">
    `plugins` bölümünüz tek dosyalı bir `$include` ile destekleniyorsa, `plugins install/update/enable/disable/uninstall` bu dahil edilen dosyaya yazar ve `openclaw.json` dosyasına dokunmaz. Kök include’lar, include dizileri ve kardeş geçersiz kılmaları olan include’lar düzleştirmek yerine kapalı başarısız olur. Desteklenen şekiller için [Yapılandırma include’ları](/tr/gateway/configuration) bölümüne bakın.

    Yükleme sırasında yapılandırma geçersizse, `plugins install` normalde kapalı başarısız olur ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Gateway başlangıcı ve hot reload sırasında geçersiz plugin yapılandırması, diğer tüm geçersiz yapılandırmalar gibi kapalı başarısız olur; `openclaw doctor --fix` geçersiz plugin girdisini karantinaya alabilir. Belgelenmiş tek yükleme zamanı istisnası, açıkça `openclaw.install.allowInvalidConfigRecovery` seçeneğine dahil olan plugin’ler için dar bir paketlenmiş plugin kurtarma yoludur.

  </Accordion>
  <Accordion title="--force ve güncelleme yerine yeniden yükleme">
    `--force`, mevcut yükleme hedefini yeniden kullanır ve zaten yüklü bir plugin’i veya hook paketini yerinde üzerine yazar. Aynı kimliği yeni bir yerel yol, arşiv, ClawHub paketi veya npm yapıtından bilerek yeniden yüklüyorsanız bunu kullanın. Zaten izlenen bir npm plugin’inin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` tercih edin.

    Zaten yüklü olan bir plugin kimliği için `plugins install` çalıştırırsanız OpenClaw durur ve normal yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna, geçerli yüklemeyi gerçekten farklı bir kaynaktan üzerine yazmak istiyorsanız `plugins install <package> --force` komutuna yönlendirir.

  </Accordion>
  <Accordion title="--pin kapsamı">
    `--pin` yalnızca npm yüklemeleri için geçerlidir. `git:` yüklemeleriyle desteklenmez; sabitlenmiş bir kaynak istediğinizde `git:github.com/acme/plugin@v1.2.3` gibi açık bir git ref’i kullanın. `--marketplace` ile desteklenmez, çünkü marketplace yüklemeleri npm belirtimi yerine marketplace kaynak meta verilerini kalıcı hale getirir.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` kullanımdan kaldırılmıştır ve artık etkisizdir. OpenClaw artık plugin yüklemeleri için yerleşik yükleme zamanı tehlikeli kod engellemesi çalıştırmaz.

    Ana makineye özgü yükleme politikası gerektiğinde paylaşılan operatör sahipli `security.installPolicy` yüzeyini kullanın. Plugin `before_install` hook’ları plugin çalışma zamanı yaşam döngüsü hook’larıdır ve CLI yüklemeleri için birincil politika sınırı değildir.

    ClawHub’da yayımladığınız bir plugin kayıt taraması tarafından gizlenir veya engellenirse [ClawHub yayımlama](/tr/clawhub/publishing) bölümündeki yayımlayıcı adımlarını kullanın. `--dangerously-force-unsafe-install`, ClawHub’dan plugin’i yeniden taramasını veya engellenmiş bir sürümü herkese açık yapmasını istemez.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Topluluk ClawHub yüklemeleri, paketi indirmeden önce seçilen sürüm güven kaydını denetler. ClawHub sürüm için indirmeyi devre dışı bırakırsa, kötü amaçlı tarama bulguları bildirirse veya sürümü karantina gibi engelleyici bir moderasyon durumuna koyarsa OpenClaw sürümü reddeder. Engelleyici olmayan riskli tarama durumları, riskli moderasyon durumları veya kayıt nedenleri için OpenClaw güven ayrıntılarını gösterir ve devam etmeden önce onay ister.

    `--acknowledge-clawhub-risk` seçeneğini yalnızca ClawHub uyarısını inceledikten ve etkileşimli istem olmadan devam etmeye karar verdikten sonra kullanın. Bekleyen veya eskimiş temiz güven kayıtları uyarır ancak onay gerektirmez. Resmi ClawHub paketleri ve paketlenmiş OpenClaw plugin kaynakları bu sürüm güven istemini atlar.

  </Accordion>
  <Accordion title="Hook paketleri ve npm belirtimleri">
    `plugins install`, `package.json` içinde `openclaw.hooks` açığa çıkaran hook paketleri için de yükleme yüzeyidir. Paket yüklemesi için değil, filtrelenmiş hook görünürlüğü ve hook başına etkinleştirme için `openclaw hooks` kullanın.

    Npm belirtimleri **yalnızca kayıt defteri** içindir (paket adı + isteğe bağlı **tam sürüm** veya **dist-tag**). Git/URL/dosya belirtimleri ve semver aralıkları reddedilir. Bağımlılık kurulumları, kabuğunuzda global npm kurulum ayarları olsa bile güvenlik için `--ignore-scripts` ile Plugin başına tek bir yönetilen npm projesinde çalışır. Yönetilen Plugin npm projeleri, OpenClaw'ın paket düzeyi npm `overrides` ayarlarını devralır; böylece host güvenlik sabitlemeleri hoist edilmiş Plugin bağımlılıklarına da uygulanır.

    npm çözümlemesini açık hale getirmek istediğinizde `npm:<package>` kullanın. Yalın paket belirtimleri de, resmi bir Plugin kimliğiyle eşleşmedikleri sürece lansman geçişi sırasında doğrudan npm'den kurulur.

    Paketlenmiş Plugin'lerle eşleşen ham `@openclaw/*` paket belirtimleri, npm geri dönüşünden önce imaja ait paketlenmiş kopyaya çözülür. Örneğin, `openclaw plugins install @openclaw/discord@2026.5.20 --pin`, yönetilen bir npm override oluşturmak yerine mevcut OpenClaw derlemesindeki paketlenmiş Discord Plugin'ini kullanır. Harici npm paketini zorlamak için `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` kullanın.

    Yalın belirtimler ve `@latest` kararlı kanalda kalır. `2026.5.3-1` gibi OpenClaw tarih damgalı düzeltme sürümleri bu kontrol için kararlı sürümlerdir. npm bunlardan birini ön sürüme çözümlerse OpenClaw durur ve `@beta`/`@rc` gibi bir ön sürüm etiketi veya `@1.2.3-beta.4` gibi tam bir ön sürümle açıkça katılmanızı ister.

    Tam sürüm içermeyen npm kurulumları için (`npm:<package>` veya `npm:<package>@latest`), OpenClaw kurulumdan önce çözümlenen paket meta verilerini kontrol eder. En son kararlı paket daha yeni bir OpenClaw Plugin API'si veya minimum host sürümü gerektiriyorsa OpenClaw eski kararlı sürümleri inceler ve bunun yerine en yeni uyumlu sürümü kurar. Tam sürümler ve `@beta` gibi açık dist-tag'ler katıdır: seçilen paket uyumsuzsa komut başarısız olur ve OpenClaw'ı yükseltmenizi veya uyumlu bir sürüm seçmenizi ister.

    Yalın bir kurulum belirtimi resmi bir Plugin kimliğiyle eşleşirse (örneğin `diffs`), OpenClaw katalog girdisini doğrudan kurar. Aynı ada sahip bir npm paketini kurmak için açık kapsamlı bir belirtim kullanın (örneğin `@scope/diffs`).

  </Accordion>
  <Accordion title="Git depoları">
    Doğrudan bir git deposundan kurmak için `git:<repo>` kullanın. Desteklenen biçimler arasında `git:github.com/owner/repo`, `git:owner/repo`, tam `https://`, `ssh://`, `git://`, `file://` ve `git@host:owner/repo.git` klon URL'leri bulunur. Kurulumdan önce bir dalı, etiketi veya commit'i checkout etmek için `@<ref>` veya `#<ref>` ekleyin.

    Git kurulumları geçici bir dizine klonlar, varsa istenen ref'i checkout eder, ardından normal Plugin dizini kurucusunu kullanır. Bu, manifest doğrulamasının, operatör kurulum politikasının, paket yöneticisi kurulum işinin ve kurulum kayıtlarının npm kurulumları gibi davrandığı anlamına gelir. Kaydedilen git kurulumları kaynak URL/ref bilgisini ve çözümlenen commit'i içerir; böylece `openclaw plugins update` kaynağı daha sonra yeniden çözümleyebilir.

    Git'ten kurduktan sonra Gateway yöntemleri ve CLI komutları gibi runtime kayıtlarını doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. Plugin `api.registerCli` ile bir CLI kökü kaydettiyse, bu komutu doğrudan OpenClaw kök CLI üzerinden çalıştırın; örneğin `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arşivler">
    Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Yerel OpenClaw Plugin arşivleri, çıkarılan Plugin kökünde geçerli bir `openclaw.plugin.json` içermelidir; yalnızca `package.json` içeren arşivler, OpenClaw kurulum kayıtlarını yazmadan önce reddedilir.

    Dosya bir npm-pack tarball ise ve kayıt defteri kurulumları tarafından kullanılan aynı Plugin başına yönetilen npm proje yolunu test etmek istiyorsanız `npm-pack:<path.tgz>` kullanın; buna `package-lock.json` doğrulaması, hoist edilmiş bağımlılık taraması ve npm kurulum kayıtları dahildir. Düz arşiv yolları ise Plugin extensions kökü altında yerel arşivler olarak kurulmaya devam eder.

    Claude pazar yeri kurulumları da desteklenir.

  </Accordion>
</AccordionGroup>

ClawHub kurulumları açık bir `clawhub:<package>` bulucusu kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Yalın npm uyumlu Plugin belirtimleri, resmi bir Plugin kimliğiyle eşleşmedikleri sürece lansman geçişi sırasında varsayılan olarak npm'den kurulur:

```bash
openclaw plugins install openclaw-codex-app-server
```

Yalnızca npm çözümlemesini açık hale getirmek için `npm:` kullanın:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw, kurulumdan önce duyurulan Plugin API / minimum Gateway uyumluluğunu kontrol eder. Seçilen ClawHub sürümü bir ClawPack yapıtı yayımladığında OpenClaw sürümlendirilmiş npm-pack `.tgz` dosyasını indirir, ClawHub digest üst bilgisini ve yapıt digest'ini doğrular, ardından normal arşiv yolu üzerinden kurar. ClawPack meta verisi olmayan eski ClawHub sürümleri eski paket arşivi doğrulama yolu üzerinden kurulmaya devam eder. Kaydedilen kurulumlar, sonraki güncellemeler için ClawHub kaynak meta verilerini, yapıt türünü, npm bütünlüğünü, npm shasum değerini, tarball adını ve ClawPack digest bilgilerini saklar.
Sürümlendirilmemiş ClawHub kurulumları, `openclaw plugins update` daha yeni ClawHub sürümlerini izleyebilsin diye sürümlendirilmemiş kayıtlı belirtimi korur; `clawhub:pkg@1.2.3` ve `clawhub:pkg@beta` gibi açık sürüm veya etiket seçicileri bu seçiciye sabitlenmiş kalır.

#### Pazar yeri kısaltması

Pazar yeri adı Claude'un `~/.claude/plugins/known_marketplaces.json` konumundaki yerel kayıt defteri önbelleğinde varsa `plugin@marketplace` kısaltmasını kullanın:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Pazar yeri kaynağını açıkça geçirmek istediğinizde `--marketplace` kullanın:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Pazar yeri kaynakları">
    - `~/.claude/plugins/known_marketplaces.json` içinden bir Claude bilinen-pazar-yeri adı
    - yerel bir pazar yeri kökü veya `marketplace.json` yolu
    - `owner/repo` gibi bir GitHub depo kısaltması
    - `https://github.com/owner/repo` gibi bir GitHub depo URL'si
    - bir git URL'si

  </Tab>
  <Tab title="Uzak pazar yeri kuralları">
    GitHub veya git üzerinden yüklenen uzak pazar yerlerinde, Plugin girdileri klonlanan pazar yeri deposunun içinde kalmalıdır. OpenClaw bu depodan göreli yol kaynaklarını kabul eder ve uzak manifestlerden HTTP(S), mutlak yol, git, GitHub ve diğer yol olmayan Plugin kaynaklarını reddeder.
  </Tab>
</Tabs>

Yerel yollar ve arşivler için OpenClaw otomatik algılar:

- yerel OpenClaw Plugin'leri (`openclaw.plugin.json`)
- Codex uyumlu bundle'lar (`.codex-plugin/plugin.json`)
- Claude uyumlu bundle'lar (`.claude-plugin/plugin.json` veya varsayılan Claude bileşen düzeni)
- Cursor uyumlu bundle'lar (`.cursor-plugin/plugin.json`)

Yönetilen yerel kurulumlar Plugin dizinleri veya arşivler olmalıdır. Bağımsız `.js`,
`.mjs`, `.cjs` ve `.ts` Plugin dosyaları `plugins install` tarafından yönetilen
Plugin köküne kopyalanmaz; bunun yerine bunları açıkça `plugins.load.paths` içinde listeleyin.

<Note>
Uyumlu bundle'lar normal Plugin köküne kurulur ve aynı list/info/enable/disable akışına katılır. Bugün bundle skills, Claude komut-skills, Claude `settings.json` varsayılanları, Claude `.lsp.json` / manifest tarafından bildirilen `lspServers` varsayılanları, Cursor komut-skills ve uyumlu Codex hook dizinleri desteklenir; algılanan diğer bundle yetenekleri tanılarda/info içinde gösterilir ancak henüz runtime yürütmesine bağlanmamıştır.
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
  Tablo görünümünden kaynak/köken/sürüm/etkinleştirme meta verileriyle Plugin başına ayrıntı satırlarına geç.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir envanter, kayıt defteri tanıları ve paket bağımlılığı kurulum durumu.
</ParamField>

<Note>
`plugins list` önce kalıcı yerel Plugin kayıt defterini okur; kayıt defteri eksik veya geçersizse yalnızca manifestten türetilmiş bir geri dönüş kullanır. Bir Plugin'in kurulu, etkin ve soğuk başlangıç planlaması için görünür olup olmadığını kontrol etmek için kullanışlıdır; ancak halihazırda çalışan bir Gateway süreci için canlı bir runtime yoklaması değildir. Plugin kodunu, etkinleştirmeyi, hook politikasını veya `plugins.load.paths` ayarını değiştirdikten sonra yeni `register(api)` kodunun ya da hook'ların çalışmasını beklemeden önce kanala hizmet veren Gateway'i yeniden başlatın. Uzak/container dağıtımlarında yalnızca bir sarmalayıcı süreci değil, gerçek `openclaw gateway run` alt sürecini yeniden başlattığınızı doğrulayın.

`plugins list --json`, her Plugin'in `package.json` içindeki `dependencies` ve
`optionalDependencies` üzerinden gelen `dependencyStatus` değerini içerir. OpenClaw, bu paket
adlarının Plugin'in normal Node `node_modules` arama yolu boyunca mevcut olup olmadığını kontrol eder;
Plugin runtime kodunu içe aktarmaz, paket yöneticisi çalıştırmaz veya eksik
bağımlılıkları onarmaz.
</Note>

Başlangıç günlükleri `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` yazarsa,
Plugin kimliklerini doğrulamak için `openclaw plugins list --enabled --verbose` veya
listelenen bir Plugin kimliğiyle `openclaw plugins inspect <id>` çalıştırın ve
güvenilen kimlikleri `openclaw.json` içindeki `plugins.allow` alanına kopyalayın. Uyarı keşfedilen
her Plugin'i listeleyebildiğinde, bu kimlikleri zaten içeren yapıştırmaya hazır bir
`plugins.allow` parçacığı yazdırır. Bir Plugin kurulum/yükleme-yolu kökeni olmadan yüklenirse
bu Plugin kimliğini inceleyin, ardından güvenilen kimliği `plugins.allow` içinde sabitleyin
veya OpenClaw'ın kurulum kökenini kaydetmesi için Plugin'i güvenilen bir kaynaktan yeniden kurun.

`plugins search` uzak bir ClawHub katalog aramasıdır. Yerel durumu incelemez,
yapılandırmayı değiştirmez, paket kurmaz veya Plugin runtime kodunu yüklemez. Arama
sonuçları ClawHub paket adını, familyasını, kanalını, sürümünü, özetini ve
`openclaw plugins install clawhub:<package>` gibi bir kurulum ipucunu içerir.

Paketlenmiş bir Docker imajı içindeki paketlenmiş Plugin çalışmaları için Plugin
kaynak dizinini `/app/extensions/synology-chat` gibi eşleşen paketlenmiş kaynak yolu üzerine
bind-mount edin. OpenClaw bu mount edilmiş kaynak overlay'ini
`/app/dist/extensions/synology-chat` konumundan önce keşfeder; düz kopyalanmış bir kaynak
dizini etkisiz kalır, böylece normal paketlenmiş kurulumlar derlenmiş dist'i kullanmaya devam eder.

Runtime hook hata ayıklaması için:

- `openclaw plugins inspect <id> --runtime --json`, modül yüklenmiş bir inceleme geçişinden kayıtlı hook'ları ve tanıları gösterir. Runtime incelemesi hiçbir zaman bağımlılık kurmaz; eski bağımlılık durumunu temizlemek veya yapılandırmada başvurulan eksik indirilebilir Plugin'leri kurtarmak için `openclaw doctor --fix` kullanın.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway URL/profilini, hizmet/süreç ipuçlarını, yapılandırma yolunu ve RPC sağlığını doğrular.
- Paketlenmemiş konuşma hook'ları (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.

Yerel bir Plugin dizinini kopyalamamak için `--link` kullanın (`plugins.load.paths` alanına ekler):

```bash
openclaw plugins install -l ./my-plugin
```

Bağımsız Plugin dosyaları, `plugins install` ile kurulmak veya doğrudan
`~/.openclaw/extensions` ya da `<workspace>/.openclaw/extensions` içine yerleştirilmek yerine
`plugins.load.paths` içinde listelenmelidir. Bu otomatik keşfedilen kökler Plugin
paket veya bundle dizinlerini yükler; üst düzey betik dosyaları ise yerel
yardımcılar olarak değerlendirilir ve atlanır.

<Note>
Çalışma alanı extensions kökünden keşfedilen çalışma alanı kökenli Plugin'ler,
açıkça etkinleştirilene kadar içe aktarılmaz veya çalıştırılmaz. Yerel geliştirme için
`openclaw plugins enable <plugin-id>` komutunu çalıştırın ya da
`plugins.entries.<plugin-id>.enabled: true` ayarlayın; yapılandırmanız
`plugins.allow` kullanıyorsa aynı Plugin kimliğini oraya da ekleyin. Bu kapalı kalma
kuralı, kanal kurulumu yalnızca kurulum için yükleme amacıyla açıkça çalışma alanı
kökenli bir Plugin'i hedeflediğinde de geçerlidir; bu nedenle yerel kanal Plugin kurulum
kodu, ilgili çalışma alanı Plugin'i devre dışı kaldığı veya izin listesinden dışlandığı
sürece çalışmaz. Bağlantılı kurulumlar ve açık `plugins.load.paths` girdileri,
çözümlenen Plugin kökenleri için normal politikayı izler. Bkz.
[Plugin politikasını yapılandırma](/tr/tools/plugin#configure-plugin-policy)
ve [Yapılandırma başvurusu](/tr/gateway/configuration-reference#plugins).

`--force`, `--link` ile desteklenmez çünkü bağlantılı kurulumlar yönetilen bir kurulum hedefinin üzerine kopyalamak yerine kaynak yolunu yeniden kullanır.

Varsayılan davranışı sabitlenmemiş tutarken, çözümlenen kesin belirtimi (`name@version`) yönetilen Plugin dizinine kaydetmek için npm kurulumlarında `--pin` kullanın.
</Note>

### Plugin dizini

Plugin kurulum meta verileri, kullanıcı yapılandırması değil makine tarafından yönetilen durumdur. Kurulumlar ve güncellemeler bunu etkin OpenClaw durum dizini altındaki paylaşılan SQLite durum veritabanına yazar. `installed_plugin_index` satırı, bozuk veya eksik Plugin manifest kayıtları dahil kalıcı `installRecords` meta verilerini ve `openclaw plugins update`, kaldırma, tanılama ve soğuk Plugin kayıt defteri tarafından kullanılan manifestten türetilmiş bir soğuk kayıt defteri önbelleğini depolar.

OpenClaw yapılandırmada gönderilmiş eski `plugins.installs` kayıtlarını gördüğünde, çalışma zamanı okumaları bunları `openclaw.json` dosyasını yeniden yazmadan uyumluluk girdisi olarak ele alır. Açık Plugin yazmaları ve `openclaw doctor --fix`, yapılandırma yazmalarına izin verildiğinde bu kayıtları Plugin dizinine taşır ve yapılandırma anahtarını kaldırır; yazmalardan biri başarısız olursa, kurulum meta verilerinin kaybolmaması için yapılandırma kayıtları tutulur.

### Kaldırma

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall`, uygulanabildiğinde Plugin kayıtlarını `plugins.entries`, kalıcı Plugin dizini, Plugin izin/ret listesi girdileri ve bağlantılı `plugins.load.paths` girdilerinden kaldırır. `--keep-files` ayarlanmadıkça kaldırma, OpenClaw'ın Plugin extensions kökünün içinde olduğunda izlenen yönetilen kurulum dizinini de kaldırır. Active Memory Plugin'leri için bellek yuvası `memory-core` değerine sıfırlanır.

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
  <Accordion title="Resolving plugin id vs npm spec">
    Bir Plugin kimliği verdiğinizde OpenClaw, o Plugin için kaydedilmiş kurulum belirtimini yeniden kullanır. Bu, `@beta` gibi daha önce saklanmış dist-tag'lerin ve kesin sabitlenmiş sürümlerin sonraki `update <id>` çalıştırmalarında kullanılmaya devam edeceği anlamına gelir.

    `update <id> --dry-run` sırasında, kesin sabitlenmiş npm kurulumları sabit kalır. OpenClaw paketin kayıt defteri varsayılan hattını da çözümleyebiliyorsa ve bu varsayılan hat kurulu sabitlenmiş sürümden daha yeniyse, dry run sabitlemeyi bildirir ve kayıt defteri varsayılan hattını izlemek için açık `@latest` paket güncelleme komutunu yazdırır.

    Bu hedefli güncelleme kuralı, toplu `openclaw plugins update --all` bakım yolundan farklıdır. Toplu güncellemeler olağan izlenen kurulum belirtimlerine yine saygı gösterir, ancak güvenilir resmi OpenClaw Plugin kayıtları, eski bir kesin resmi pakette kalmak yerine geçerli resmi katalog hedefiyle eşitlenebilir. Kesin veya etiketli bir resmi belirtimi bilerek olduğu gibi tutmak istediğinizde hedefli `update <id>` kullanın.

    npm kurulumları için, dist-tag veya kesin sürüm içeren açık bir npm paket belirtimi de verebilirsiniz. OpenClaw bu paket adını izlenen Plugin kaydına geri çözümler, ilgili kurulu Plugin'i günceller ve gelecekteki kimlik tabanlı güncellemeler için yeni npm belirtimini kaydeder.

    npm paket adını sürüm veya etiket olmadan vermek de izlenen Plugin kaydına geri çözümlenir. Bir Plugin kesin bir sürüme sabitlenmişken onu kayıt defterinin varsayılan yayın hattına geri taşımak istediğinizde bunu kullanın.

  </Accordion>
  <Accordion title="Beta channel updates">
    Hedefli `openclaw plugins update <id-or-npm-spec>`, yeni bir belirtim vermediğiniz sürece izlenen Plugin belirtimini yeniden kullanır. Toplu `openclaw plugins update --all`, güvenilir resmi Plugin kayıtlarını resmi katalog hedefiyle eşitlerken yapılandırılmış `update.channel` değerini kullanır; böylece beta kanalı kurulumları sessizce stable/latest değerine normalleştirilmek yerine beta yayın hattında kalabilir.

    `openclaw update` etkin OpenClaw güncelleme kanalını da bilir: beta kanalında, varsayılan hat npm ve ClawHub Plugin kayıtları önce `@beta` dener. Plugin beta yayını yoksa kaydedilmiş default/latest belirtimine geri dönerler; npm Plugin'leri, beta paketi var olup kurulum doğrulamasında başarısız olduğunda da geri döner. Bu geri dönüş bir uyarı olarak bildirilir ve çekirdek güncellemeyi başarısız yapmaz. Kesin sürümler ve açık etiketler, hedefli güncellemeler için o seçiciye sabit kalır.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Canlı bir npm güncellemesinden önce OpenClaw, kurulu paket sürümünü npm kayıt defteri meta verileriyle karşılaştırır. Kurulu sürüm ve kaydedilmiş artifact kimliği çözümlenen hedefle zaten eşleşiyorsa güncelleme indirme, yeniden kurma veya `openclaw.json` dosyasını yeniden yazma yapılmadan atlanır.

    Saklanan bir bütünlük hash'i mevcutsa ve getirilen artifact hash'i değişirse, OpenClaw bunu npm artifact sapması olarak ele alır. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek hash'leri yazdırır ve devam etmeden önce onay ister. Etkileşimsiz güncelleme yardımcıları, çağıran açık bir devam politikası sağlamadıkça kapalı kalır.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install`, uyumluluk için `plugins update` üzerinde de kabul edilir, ancak kullanımdan kaldırılmıştır ve artık Plugin güncelleme davranışını değiştirmez. Operatör `security.installPolicy` güncellemeleri yine engelleyebilir; Plugin `before_install` hook'ları yalnızca Plugin hook'larının yüklendiği süreçlerde uygulanır.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk on update">
    Topluluk ClawHub destekli Plugin güncellemeleri, yedek paketi indirmeden önce kurulumlarla aynı kesin yayın güven denetimini çalıştırır. Seçilen ClawHub yayını riskli bir güven uyarısına sahip olduğunda devam etmesi gereken incelenmiş otomasyon için `--acknowledge-clawhub-risk` kullanın. Resmi ClawHub paketleri ve paketlenmiş OpenClaw Plugin kaynakları bu yayın güveni istemini atlar.
  </Accordion>
</AccordionGroup>

### İnceleme

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect, varsayılan olarak Plugin çalışma zamanını içe aktarmadan kimliği, yükleme durumunu, kaynağı, manifest yeteneklerini, politika bayraklarını, tanılamaları, kurulum meta verilerini, paket yeteneklerini ve algılanan MCP veya LSP sunucu desteğini gösterir. JSON çıktısı `contracts.agentToolResultMiddleware` ve `contracts.trustedToolPolicies` gibi Plugin manifest sözleşmelerini içerir; böylece operatörler bir Plugin'i etkinleştirmeden veya yeniden başlatmadan önce güvenilir yüzey bildirimlerini denetleyebilir. Plugin modülünü yüklemek ve kayıtlı hook'ları, araçları, komutları, hizmetleri, Gateway yöntemlerini ve HTTP rotalarını dahil etmek için `--runtime` ekleyin. Çalışma zamanı incelemesi eksik Plugin bağımlılıklarını doğrudan bildirir; kurulumlar ve onarımlar `openclaw plugins install`, `openclaw plugins update` ve `openclaw doctor --fix` içinde kalır.

Plugin'e ait CLI komutları genellikle kök `openclaw` komut grupları olarak kurulur, ancak Plugin'ler `openclaw nodes` gibi bir çekirdek üst öğe altında iç içe komutlar da kaydedebilir. `inspect --runtime`, `cliCommands` altında bir komut gösterdikten sonra komutu listelenen yolda çalıştırın; örneğin `demo-git` kaydeden bir Plugin, `openclaw demo-git ping` ile doğrulanabilir.

Her Plugin, çalışma zamanında gerçekten ne kaydettiğine göre sınıflandırılır:

- **plain-capability** — bir yetenek türü (örn. yalnızca sağlayıcı Plugin'i)
- **hybrid-capability** — birden çok yetenek türü (örn. metin + konuşma + görüntüler)
- **hook-only** — yalnızca hook'lar, yetenek veya yüzey yok
- **non-capability** — araçlar/komutlar/hizmetler var, ancak yetenek yok

Yetenek modeli hakkında daha fazla bilgi için [Plugin şekilleri](/tr/plugins/architecture#plugin-shapes) bölümüne bakın.

<Note>
`--json` bayrağı, betik oluşturma ve denetim için uygun, makine tarafından okunabilir bir rapor çıktılar. `inspect --all`, şekil, yetenek türleri, uyumluluk bildirimleri, paket yetenekleri ve hook özeti sütunları içeren filo genelinde bir tablo oluşturur. `info`, `inspect` için bir takma addır.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor`, Plugin yükleme hatalarını, manifest/keşif tanılamalarını, uyumluluk bildirimlerini ve eksik Plugin yuvaları gibi eski Plugin yapılandırma başvurularını bildirir. Kurulum ağacı ve Plugin yapılandırması temiz olduğunda `No plugin issues detected.` yazdırır. Eski yapılandırma kalmış ancak kurulum ağacı bunun dışında sağlıklıysa, özet tam Plugin sağlığı ima etmek yerine bunu belirtir.

Yapılandırılmış bir Plugin diskte mevcutsa ancak yükleyicinin yol güvenliği denetimleri tarafından engelleniyorsa, yapılandırma doğrulaması Plugin girdisini tutar ve bunu `present but blocked` olarak bildirir. `plugins.entries.<id>` veya `plugins.allow` yapılandırmasını kaldırmak yerine yol sahipliği ya da herkes tarafından yazılabilir izinler gibi önceki engellenmiş Plugin tanılamasını düzeltin.

Eksik `register`/`activate` dışa aktarımları gibi modül şekli hataları için, tanılama çıktısına kompakt bir dışa aktarım şekli özeti eklemek üzere `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

### Kayıt defteri

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Yerel Plugin kayıt defteri, kurulu Plugin kimliği, etkinleştirme, kaynak meta verileri ve katkı sahipliği için OpenClaw'ın kalıcı soğuk okuma modelidir. Normal başlatma, sağlayıcı sahibi arama, kanal kurulumu sınıflandırması ve Plugin envanteri bunu Plugin çalışma zamanı modüllerini içe aktarmadan okuyabilir.

Kalıcı kayıt defterinin mevcut, güncel veya eski olup olmadığını incelemek için `plugins registry` kullanın. Kalıcı Plugin dizini, yapılandırma politikası ve manifest/paket meta verilerinden yeniden oluşturmak için `--refresh` kullanın. Bu bir onarım yoludur, çalışma zamanı etkinleştirme yolu değildir.

`openclaw doctor --fix`, kayıt defterine yakın yönetilen npm sapmasını da onarır: yönetilen bir Plugin npm projesi altındaki veya eski düz yönetilen npm kökü altındaki sahipsiz ya da kurtarılmış bir `@openclaw/*` paketi paketlenmiş bir Plugin'i gölgeliyorsa, doctor bu eski paketi kaldırır ve kayıt defterini yeniden oluşturur; böylece başlatma paketlenmiş manifest üzerinden doğrulama yapar. Doctor ayrıca, `peerDependencies.openclaw` bildiren yönetilen npm Plugin'lerine ana `openclaw` paketini yeniden bağlar; böylece `openclaw/plugin-sdk/*` gibi paket yerel çalışma zamanı içe aktarımları güncellemelerden veya npm onarımlarından sonra çözümlenir.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`, kayıt defteri okuma hataları için kullanımdan kaldırılmış bir acil durum uyumluluk anahtarıdır. `plugins registry --refresh` veya `openclaw doctor --fix` tercih edin; env geri dönüşü yalnızca geçiş yayımlanırken acil başlatma kurtarma içindir.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

`plugins marketplace entries`, yapılandırılmış OpenClaw pazaryeri akışındaki girdileri listeler. Varsayılan olarak barındırılan akışı denemeye çalışır ve en son kabul edilen anlık görüntüye ya da pakete dahil verilere geri döner. Belirli bir yapılandırılmış profili okumak için `--feed-profile <name>`, açık bir barındırılan akış URL'sini okumak için `--feed-url <url>` ve akışı getirmeden en son kabul edilen anlık görüntüyü okumak için `--offline` kullanın.

`plugins marketplace refresh`, yapılandırılmış barındırılan akış anlık görüntüsünü yeniler ve OpenClaw'ın barındırılan verileri, bir barındırılan anlık görüntüyü ya da pakete dahil yedek verileri kabul edip etmediğini bildirir. Çağıranın, yeni bir barındırılan yük sabitlenmiş bir sağlama toplamıyla eşleşmediği sürece komutun başarısız olmasına ihtiyaç duyduğu durumlarda `--expected-sha256` kullanın.

Pazaryeri `list`; yerel bir pazaryeri yolunu, bir `marketplace.json` yolunu, `owner/repo` gibi bir GitHub kısaltmasını, bir GitHub depo URL'sini ya da bir git URL'sini kabul eder. `--json`, çözümlenen kaynak etiketinin yanı sıra ayrıştırılmış pazaryeri manifestini ve Plugin girdilerini yazdırır.

Pazaryeri yenilemesi, barındırılan bir OpenClaw pazaryeri akışını yükler ve
doğrulanmış yanıtı yerel barındırılan akış anlık görüntüsü olarak kalıcı hale getirir. Seçenek olmadan,
yapılandırılmış varsayılan akış profilini kullanır. Belirli bir yapılandırılmış profili yenilemek için
`--feed-profile <name>`, açık bir barındırılan akış URL'sini yenilemek için `--feed-url <url>`,
eşleşen bir yük sağlama toplamı gerektirmek için `--expected-sha256 <sha256>`
(`sha256:<hex>` veya çıplak 64 karakterlik onaltılık özet) ve makine tarafından okunabilir çıktı için
`--json` kullanın. Açık barındırılan akış URL'leri kimlik bilgileri,
sorgu dizeleri veya parçalar içermemelidir. Sabitlenmemiş yenilemeler, komutu başarısız kılmadan
barındırılan anlık görüntü ya da pakete dahil yedek sonucu bildirebilir. Sabitlenmiş
yenilemeler, yeni bir barındırılan yükü kabul etmedikleri sürece başarısız olur ve başarılı barındırılan
yenilemeler, OpenClaw doğrulanmış anlık görüntüyü kalıcı hale getiremezse başarısız olur.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [CLI başvurusu](/tr/cli)
- [ClawHub](/tr/clawhub)
