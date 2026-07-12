---
read_when:
    - Gateway pluginlerini veya uyumlu paketleri yüklemek ya da yönetmek istiyorsunuz
    - Basit bir araç Plugin'i için iskelet oluşturmak veya bunu doğrulamak istiyorsunuz
    - Plugin yükleme hatalarında hata ayıklamak istiyorsunuz
sidebarTitle: Plugins
summary: '`openclaw plugins` için CLI referansı (başlatma, derleme, doğrulama, listeleme, yükleme, pazar yeri, kaldırma, etkinleştirme/devre dışı bırakma, doctor)'
title: Pluginler
x-i18n:
    generated_at: "2026-07-12T12:10:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 729e74103a302936dc45da3be31306803b16e9dae182e78b3742783b892a9027
    source_path: cli/plugins.md
    workflow: 16
---

Gateway Pluginlerini, kanca paketlerini ve uyumlu paketleri yönetin.

<CardGroup cols={2}>
  <Card title="Plugin sistemi" href="/tr/tools/plugin">
    Pluginleri yükleme, etkinleştirme ve sorunlarını giderme hakkında son kullanıcı kılavuzu.
  </Card>
  <Card title="Pluginleri yönetme" href="/tr/plugins/manage-plugins">
    Yükleme, listeleme, güncelleme, kaldırma ve yayımlama için hızlı örnekler.
  </Card>
  <Card title="Plugin paketleri" href="/tr/plugins/bundles">
    Paket uyumluluk modeli.
  </Card>
  <Card title="Plugin manifesti" href="/tr/plugins/manifest">
    Manifest alanları ve yapılandırma şeması.
  </Card>
  <Card title="Güvenlik" href="/tr/gateway/security">
    Plugin yüklemeleri için güvenlik sıkılaştırması.
  </Card>
</CardGroup>

## Komutlar

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # alias for inspect
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id> [--dry-run] [--keep-files] [--force]
openclaw plugins update <id-or-npm-spec> | --all [--dry-run]
openclaw plugins registry [--refresh] [--json]
openclaw plugins doctor
openclaw plugins init <id> [--name <name>] [--type tool|provider] [--directory <path>]
openclaw plugins build [--entry <path>] [--check]
openclaw plugins validate [--entry <path>]
openclaw plugins marketplace entries [--offline] [--feed-profile <name>] [--json]
openclaw plugins marketplace list <source> [--json]
openclaw plugins marketplace refresh [--feed-profile <name>] [--expected-sha256 <sha256>] [--json]
```

Yavaş yükleme, inceleme, kaldırma veya kayıt yenileme işlemlerini araştırmak için
komutu `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ile çalıştırın. İz, aşama sürelerini
stderr'e yazar ve JSON çıktısının ayrıştırılabilir kalmasını sağlar. Bkz. [Hata ayıklama](/tr/help/debugging#plugin-lifecycle-trace).

<Note>
Nix modunda (`OPENCLAW_NIX_MODE=1`) `openclaw.json` değiştirilemez. `install`, `update`, `uninstall`, `enable` ve `disable` komutlarının tümü çalışmayı reddeder. Bunun yerine bu yüklemeye ait Nix kaynağını (`programs.openclaw.config` veya nix-openclaw için `instances.<name>.config`) düzenleyip yeniden derleyin. Öncelikle ajan yaklaşımını kullanan [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) bölümüne bakın.
</Note>

<Note>
Birlikte gelen Pluginler OpenClaw ile dağıtılır. Bazıları varsayılan olarak etkindir (örneğin birlikte gelen model sağlayıcıları, konuşma sağlayıcıları ve tarayıcı Plugini); diğerleri için `plugins enable` gerekir.

Yerel OpenClaw Pluginleri, satır içi JSON Şeması (`configSchema`, boş olsa bile) içeren `openclaw.plugin.json` dosyasıyla dağıtılır. Uyumlu paketler ise kendi paket manifestlerini kullanır.

`plugins list`, `Format: openclaw` veya `Format: bundle` gösterir. Ayrıntılı liste/bilgi çıktısı ayrıca paket alt türünü (`codex`, `claude` veya `cursor`) ve algılanan paket yeteneklerini gösterir.
</Note>

## Geliştirme

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init`, varsayılan olarak asgari bir TypeScript araç Plugini oluşturur. İlk
bağımsız değişken Plugin kimliğidir; `--name` görünen adı belirler. OpenClaw,
varsayılan çıktı dizini ve paket adlandırması için kimliği kullanır. Araç iskeletleri
`defineToolPlugin` kullanır ve önce derleme yapan, ardından `openclaw plugins build`/`validate`
komutlarını çağıran `package.json` betikleri `plugin:build` ile `plugin:validate` oluşturur.

`plugins build`, derlenmiş giriş noktasını içe aktarır, statik araç meta verilerini okur,
`openclaw.plugin.json` dosyasını yazar ve `package.json` içindeki `openclaw.extensions`
alanını uyumlu tutar. `plugins validate`, oluşturulan manifestin, paket meta verilerinin ve
geçerli giriş noktası dışa aktarımının hâlâ birbiriyle uyumlu olduğunu denetler. Eksiksiz
geliştirme iş akışı için [Araç Pluginleri](/tr/plugins/tool-plugins) bölümüne bakın.

İskelet TypeScript kaynak kodu yazar ancak meta verileri derlenmiş `./dist/index.js`
giriş noktasından oluşturur; dolayısıyla iş akışı yayımlanmış CLI ile de çalışır.
Giriş noktası varsayılan paket giriş noktası değilse `--entry <path>` kullanın.
Oluşturulan meta veriler eskimişse dosyaları yeniden yazmadan işlemi başarısız kılmak
için CI'da `plugins build --check` kullanın.

### Sağlayıcı iskeleti

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Sağlayıcı iskeletleri; API anahtarı kimlik doğrulama tesisatına, `clawhub package validate`
komutunu çalıştıran bir `npm run validate` betiğine, ClawHub paket meta verilerine ve
gelecekte GitHub OIDC üzerinden güvenilir yayımlama için elle tetiklenen bir GitHub Actions
iş akışına sahip, OpenAI ile uyumlu genel bir model sağlayıcı Plugini oluşturur. Sağlayıcı
iskeletleri Skills oluşturmaz ve `openclaw plugins build`/`validate` kullanmaz; bu komutlar
araç iskeletinin oluşturulan meta veri yolu içindir.

Yayımlamadan önce yer tutucu API temel URL'sini, model kataloğunu, dokümantasyon yolunu,
kimlik bilgisi metnini ve README içeriğini gerçek sağlayıcı ayrıntılarıyla değiştirin.
İlk ClawHub yayımlaması ve güvenilir yayımcı kurulumu için oluşturulan README'yi kullanın.

## Yükleme

```bash
openclaw plugins search "calendar"                      # search ClawHub plugins
openclaw plugins install <package>                       # source auto-detection
openclaw plugins install clawhub:<package>                # ClawHub only
openclaw plugins install npm:<package>                    # npm only
openclaw plugins install npm-pack:<path.tgz>               # local npm-pack tarball
openclaw plugins install git:github.com/<owner>/<repo>     # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # local path or archive
openclaw plugins install -l <path>                         # link instead of copy
openclaw plugins install <plugin>@<marketplace>             # marketplace shorthand
openclaw plugins install <plugin> --marketplace <name>      # marketplace (explicit)
openclaw plugins install <package> --force                  # overwrite existing install
openclaw plugins install <package> --pin                    # pin resolved npm version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

Kurulum sırasındaki yüklemeleri test eden bakımcılar, korumalı ortam değişkenleriyle
otomatik Plugin yükleme kaynaklarını geçersiz kılabilir. Bkz.
[Plugin yükleme geçersiz kılmaları](/tr/plugins/install-overrides).

<Warning>
Yalın paket adları, birlikte gelen veya resmî bir Plugin kimliğiyle eşleşmediği sürece geçiş döneminde varsayılan olarak npm'den yüklenir; eşleşme durumunda OpenClaw, npm kayıt defterine erişmek yerine bu yerel/resmî kopyayı kullanır. Bilerek haricî bir npm paketi kullanmak istediğinizde `npm:<package>` kullanın. ClawHub için `clawhub:<package>` kullanın. Plugin yüklemelerini kod çalıştırmak gibi değerlendirin; sabitlenmiş sürümleri tercih edin.
</Warning>

`plugins search`, yüklenebilir `code-plugin` ve `bundle-plugin` paketleri için
ClawHub'ı sorgular (Skills için değildir; onlar için `openclaw skills search` kullanın).
Varsayılan `--limit` değeri 20'dir ve en fazla 100 olabilir. Yalnızca uzak kataloğu okur:
yerel durum incelemesi, yapılandırma değişikliği, paket yüklemesi veya Plugin çalışma zamanı
yüklemesi yapmaz. Sonuçlar ClawHub paket adını, ailesini, kanalını, sürümünü, özetini ve
`openclaw plugins install clawhub:<package>` gibi bir yükleme ipucunu içerir.

<Note>
ClawHub, çoğu Plugin için birincil dağıtım ve keşif yüzeyidir. Npm, desteklenen bir
yedek ve doğrudan yükleme yolu olmaya devam eder. OpenClaw'a ait `@openclaw/*` Plugin
paketleri yeniden npm'de yayımlanmaktadır; güncel liste için
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) veya
[Plugin envanteri](/tr/plugins/plugin-inventory) bölümüne bakın. Kararlı yüklemeler `latest`
kullanır. Beta kanalı yüklemeleri ve güncellemeleri, mevcut olduğunda npm `beta`
dağıtım etiketini tercih eder; mevcut değilse `latest` kullanılır. Uzatılmış kararlı
kanalda, yalın/varsayılan veya `latest` amacı taşıyan resmî npm Pluginleri, yüklü çekirdeğin
tam sürümüne çözümlenir. Tam sürüm sabitlemeleri ve `latest` dışındaki açık etiketler,
üçüncü taraf paketleri ve npm dışı kaynaklar yeniden yazılmaz.
</Note>

<AccordionGroup>
  <Accordion title="Yapılandırma eklemeleri ve geçersiz yapılandırmayı onarma">
    `plugins` bölümünüz tek dosyalı bir `$include` tarafından destekleniyorsa `plugins install/update/enable/disable/uninstall`, doğrudan bu eklenen dosyaya yazar ve `openclaw.json` dosyasına dokunmaz. Kök eklemeler, ekleme dizileri ve kardeş geçersiz kılmalara sahip eklemeler düzleştirilmek yerine güvenli biçimde başarısız olur. Desteklenen biçimler için [Yapılandırma eklemeleri](/tr/gateway/configuration) bölümüne bakın.

    Yükleme sırasında yapılandırma geçersizse `plugins install` normalde güvenli biçimde başarısız olur ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Gateway başlangıcı ve çalışırken yeniden yükleme sırasında, geçersiz Plugin yapılandırması diğer tüm geçersiz yapılandırmalar gibi güvenli biçimde başarısız olur; `openclaw doctor --fix`, geçersiz Plugin girdisini karantinaya alabilir. Belgelenmiş tek yükleme zamanı istisnası, açıkça `openclaw.install.allowInvalidConfigRecovery` seçeneğini etkinleştiren Pluginlere yönelik dar kapsamlı bir birlikte gelen Plugin kurtarma yoludur.

  </Accordion>
  <Accordion title="--force ve yeniden yükleme ile güncelleme arasındaki fark">
    `--force`, mevcut yükleme hedefini yeniden kullanır ve zaten yüklü bir Plugini veya kanca paketini yerinde üzerine yazar. Aynı kimliği yeni bir yerel yoldan, arşivden, ClawHub paketinden veya npm yapısından bilerek yeniden yüklerken kullanın. Zaten izlenen bir npm Plugininin olağan yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` komutunu tercih edin.

    Zaten yüklü bir Plugin kimliği için `plugins install` çalıştırırsanız OpenClaw durur ve normal yükseltme için sizi `plugins update <id-or-npm-spec>` komutuna, geçerli yüklemenin üzerine gerçekten farklı bir kaynaktan yazmak istediğinizde ise `plugins install <package> --force` komutuna yönlendirir. `--force`, `--link` ile desteklenmez.

  </Accordion>
  <Accordion title="--pin kapsamı">
    `--pin` yalnızca npm yüklemelerine uygulanır ve çözümlenen tam `<name>@<version>` değerini kaydeder. `git:` yüklemelerinde (bunun yerine başvuruyu belirtimde sabitleyin; örneğin `git:github.com/acme/plugin@v1.2.3`) veya `--marketplace` ile desteklenmez (pazar yeri yüklemeleri npm belirtimi yerine pazar yeri kaynak meta verilerini kalıcı olarak saklar).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` kullanımdan kaldırılmıştır ve artık hiçbir işlem yapmaz. OpenClaw, Plugin yüklemeleri için yerleşik yükleme zamanı tehlikeli kod engellemesini artık çalıştırmaz.

    Ana bilgisayara özgü bir yükleme ilkesi gerektiğinde operatörün yönettiği `security.installPolicy` yüzeyini kullanın. Plugin `before_install` kancaları, Plugin çalışma zamanı yaşam döngüsü kancalarıdır; CLI yüklemelerinin birincil ilke sınırı değildir.

    ClawHub'da yayımladığınız bir Plugin kayıt taraması nedeniyle gizlenmiş veya engellenmişse [ClawHub'da yayımlama](/tr/clawhub/publishing) bölümündeki yayımcı adımlarını kullanın. `--dangerously-force-unsafe-install`, ClawHub'dan Plugini yeniden taramasını veya engellenmiş bir sürümü herkese açık hâle getirmesini istemez.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Topluluk ClawHub yüklemeleri, indirmeden önce seçilen sürümün güven kaydını denetler. ClawHub sürümün indirilmesini devre dışı bırakırsa, kötü amaçlı tarama bulguları bildirirse veya sürümü engelleyici bir denetim durumuna (karantinaya alınmış, iptal edilmiş) getirirse OpenClaw bu bayraktan bağımsız olarak sürümü kesinlikle reddeder. Engelleyici olmayan riskli tarama durumlarında veya denetim durumlarında OpenClaw güven ayrıntılarını gösterir ve devam etmeden önce onay ister.

    `--acknowledge-clawhub-risk` seçeneğini yalnızca ClawHub uyarısını inceledikten ve etkileşimli istem olmadan devam etmeye karar verdikten sonra kullanın. Bekleyen veya eski (henüz temiz olmayan) tarama sonuçları uyarı verir ancak onay gerektirmez. Resmî ClawHub paketleri ve birlikte gelen OpenClaw Plugin kaynakları bu sürüm güven denetimini tamamen atlar.

  </Accordion>
  <Accordion title="Kanca paketleri ve npm belirtimleri">
    `plugins install`, `package.json` içinde `openclaw.hooks` sunan kanca paketlerinin de yükleme yüzeyidir. Paket yüklemek için değil, filtrelenmiş kanca görünürlüğü ve kanca başına etkinleştirme için `openclaw hooks` kullanın.

    Npm belirtimleri **yalnızca kayıt deposu** içindir (paket adı ve isteğe bağlı **tam sürüm** veya **dist-tag**). Git/URL/dosya belirtimleri ve semver aralıkları reddedilir. Bağımlılık kurulumları, kabuğunuzda genel npm kurulum ayarları olsa bile güvenlik amacıyla `--ignore-scripts` kullanılarak her eklenti için yönetilen tek bir npm projesinde çalıştırılır. Yönetilen eklenti npm projeleri, OpenClaw'ın paket düzeyindeki npm `overrides` ayarlarını devralır; böylece ana makinenin güvenlik sabitlemeleri üst düzeye çıkarılan eklenti bağımlılıklarına da uygulanır.

    npm çözümlemesini açıkça belirtmek için `npm:<package>` kullanın. Yalın paket belirtimleri de resmî bir eklenti kimliğiyle eşleşmedikleri sürece lansman geçişi sırasında doğrudan npm'den kurulur.

    Paketlenmiş eklentilerle eşleşen ham `@openclaw/*` belirtimleri, npm geri dönüşünden önce imajın sahip olduğu paketlenmiş kopyaya çözümlenir. Örneğin `openclaw plugins install @openclaw/discord@2026.5.20 --pin`, yönetilen bir npm geçersiz kılması oluşturmak yerine geçerli OpenClaw derlemesindeki paketlenmiş Discord eklentisini kullanır. Haricî npm paketini zorunlu kılmak için `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` kullanın.

    Yalın belirtimler ve `@latest`, kararlı kanalda kalır. `2026.5.3-1` gibi OpenClaw tarih damgalı düzeltme sürümleri bu denetimde kararlı kabul edilir. npm bu biçimlerden herhangi birini bir ön sürüme çözümlerse OpenClaw durur ve bir ön sürüm etiketi (`@beta`/`@rc`) veya tam bir ön sürüm (`@1.2.3-beta.4`) ile açıkça onay vermenizi ister.

    Tam sürüm içermeyen npm kurulumlarında (`npm:<package>` veya `npm:<package>@latest`) OpenClaw, kurulumdan önce çözümlenen paket meta verilerini denetler. En son kararlı paket daha yeni bir OpenClaw eklenti API'si veya daha yüksek bir asgari ana makine sürümü gerektiriyorsa OpenClaw eski kararlı sürümleri inceler ve bunun yerine uyumlu en yeni sürümü kurar. Tam sürümler ve açık dist-tag değerleri katı kalır: Uyumsuz bir seçim başarısız olur ve OpenClaw'ı yükseltmenizi veya uyumlu bir sürüm seçmenizi ister.

    Yalın bir kurulum belirtimi resmî bir eklenti kimliğiyle eşleşirse (örneğin `diffs`) OpenClaw katalog girdisini doğrudan kurar. Aynı ada sahip bir npm paketini kurmak için açık bir kapsamlı belirtim kullanın (örneğin `@scope/diffs`).

  </Accordion>
  <Accordion title="Git depoları">
    Doğrudan bir git deposundan kurmak için `git:<repo>` kullanın. Desteklenen biçimler: `git:github.com/owner/repo`, `git:owner/repo`, tam `https://`, `ssh://`, `git://`, `file://` ve `git@host:owner/repo.git` klonlama URL'leri. Kurulumdan önce bir dalı, etiketi veya commit'i kullanıma almak için `@<ref>` ya da `#<ref>` ekleyin.

    Git kurulumları geçici bir dizine klonlar, varsa istenen referansı kullanıma alır ve ardından normal eklenti dizini kurucusunu kullanır; böylece manifest doğrulaması, operatör kurulum politikası, paket yöneticisi kurulum işlemleri ve kurulum kayıtları npm kurulumlarındaki gibi davranır. Kaydedilen git kurulumları, kaynak URL'sini/referansını ve çözümlenen commit'i içerir; böylece `openclaw plugins update` kaynağı daha sonra yeniden çözümleyebilir.

    Git'ten kurulum yaptıktan sonra Gateway yöntemleri ve CLI komutları gibi çalışma zamanı kayıtlarını doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. Eklenti `api.registerCli` ile bir CLI kökü kaydettiyse bu komutu doğrudan OpenClaw kök CLI'sı üzerinden çalıştırın; örneğin `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arşivler">
    Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Yerel OpenClaw eklenti arşivleri, ayıklanan eklenti kökünde geçerli bir `openclaw.plugin.json` içermelidir; yalnızca `package.json` içeren arşivler, OpenClaw kurulum kayıtlarını yazmadan önce reddedilir.

    Dosya bir npm-pack tarball'ı olduğunda ve kayıt deposu kurulumlarının kullandığı
    her eklentiye özel yönetilen npm proje yolunun aynısını kullanmak istediğinizde
    `npm-pack:<path.tgz>` kullanın; buna `package-lock.json` doğrulaması, üst düzeye
    çıkarılan bağımlılıkların taranması ve npm kurulum kayıtları dahildir. Düz arşiv
    yolları ise eklenti uzantıları kökü altında yerel arşivler olarak kurulmaya devam eder.

    Claude pazar yeri kurulumları da desteklenir.

  </Accordion>
</AccordionGroup>

ClawHub kurulumları açık bir `clawhub:<package>` konum belirleyicisi kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

npm açısından güvenli yalın eklenti belirtimleri, resmî bir eklenti kimliğiyle eşleşmedikleri sürece lansman geçişi sırasında varsayılan olarak npm'den kurulur:

```bash
openclaw plugins install openclaw-codex-app-server
```

Yalnızca npm çözümlemesini açıkça belirtmek için `npm:` kullanın:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw, kurulumdan önce ilan edilen eklenti API'si / asgari Gateway uyumluluğunu denetler. Seçilen ClawHub sürümü bir ClawPack yapıtı yayımladığında OpenClaw sürümlendirilmiş npm-pack `.tgz` dosyasını indirir, ClawHub özet üstbilgisini ve yapıt özetini doğrular, ardından normal arşiv yolu üzerinden kurar. ClawPack meta verisi bulunmayan eski ClawHub sürümleri, eski paket arşivi doğrulama yolu üzerinden kurulmaya devam eder. Kaydedilen kurulumlar, sonraki güncellemeler için ClawHub kaynak meta verilerini, yapıt türünü, npm bütünlük değerini, npm shasum değerini, tarball adını ve ClawPack özet bilgilerini saklar.
Sürümsüz ClawHub kurulumları, `openclaw plugins update` komutunun daha yeni ClawHub sürümlerini izleyebilmesi için sürümsüz bir kayıtlı belirtim tutar; `clawhub:pkg@1.2.3` ve `clawhub:pkg@beta` gibi açık sürüm veya etiket seçicileri ilgili seçiciye sabitlenmiş olarak kalır.

### Pazar yeri kısaltması

Pazar yeri adı Claude'un `~/.claude/plugins/known_marketplaces.json` konumundaki yerel kayıt deposu önbelleğinde bulunuyorsa `plugin@marketplace` kısaltmasını kullanın:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Pazar yeri kaynağını açıkça iletmek için `--marketplace` kullanın:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Pazar yeri kaynakları">
    - `~/.claude/plugins/known_marketplaces.json` içindeki bilinen bir Claude pazar yeri adı
    - yerel bir pazar yeri kökü veya `marketplace.json` yolu
    - `owner/repo` gibi bir GitHub deposu kısaltması
    - `https://github.com/owner/repo` gibi bir GitHub deposu URL'si
    - bir git URL'si

  </Tab>
  <Tab title="Uzak pazar yeri kuralları">
    GitHub veya git üzerinden yüklenen uzak pazar yerlerinde eklenti girdileri klonlanan pazar yeri deposunun içinde kalmalıdır. OpenClaw bu depodaki göreli yol kaynaklarını kabul eder; uzak manifestlerdeki HTTP(S), mutlak yol, git, GitHub ve yol olmayan diğer eklenti kaynaklarını reddeder.
  </Tab>
</Tabs>

OpenClaw, yerel yollar ve arşivler için şunları otomatik olarak algılar:

- yerel OpenClaw eklentileri (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya bu manifest dosyası yoksa varsayılan Claude bileşen düzeni)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

Yönetilen yerel kurulumlar eklenti dizinleri veya arşivler olmalıdır. Bağımsız `.js`,
`.mjs`, `.cjs` ve `.ts` eklenti dosyaları `plugins install` tarafından yönetilen
eklenti köküne kopyalanmaz; doğrudan `~/.openclaw/extensions` veya
`<workspace>/.openclaw/extensions` içine yerleştirildiklerinde de yüklenmez. Otomatik
algılanan bu kökler eklenti paketi veya paket dizinlerini yükler ve üst düzey betik
dosyalarını yerel yardımcılar olarak atlar. Bunun yerine bağımsız dosyaları
`plugins.load.paths` içinde açıkça listeleyin.

<Note>
Uyumlu paketler normal eklenti köküne kurulur ve aynı listeleme/bilgi/etkinleştirme/devre dışı bırakma akışına katılır. Günümüzde paket Skills öğeleri, Claude komut Skills öğeleri, Claude `settings.json` varsayılanları, Claude `.lsp.json` / manifestte bildirilen `lspServers` varsayılanları, Cursor komut Skills öğeleri ve uyumlu Codex kanca dizinleri desteklenmektedir; algılanan diğer paket yetenekleri tanılama/bilgi çıktısında gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmamıştır.
</Note>

Yerel bir eklenti dizinini kopyalamadan işaret etmek için `-l`/`--link` kullanın
(`plugins.load.paths` listesine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

`--link`, `--force` ile (bağlı eklentiler doğrudan kaynak yolunu işaret ettiğinden
yerinde üzerine yazılacak bir şey yoktur), `--marketplace` ile veya `git:`
kurulumlarıyla desteklenmez ve zaten var olan bir yerel yol gerektirir.

<Note>
Bir çalışma alanı uzantıları kökünden algılanan çalışma alanı kaynaklı eklentiler,
açıkça etkinleştirilene kadar içe aktarılmaz veya yürütülmez. Yerel geliştirme için
`openclaw plugins enable <plugin-id>` komutunu çalıştırın veya
`plugins.entries.<plugin-id>.enabled: true` değerini ayarlayın; yapılandırmanız
`plugins.allow` kullanıyorsa aynı eklenti kimliğini buraya da ekleyin. Bu varsayılan
olarak kapalı kuralı, kanal kurulumu yalnızca kurulum amacıyla yükleme için çalışma
alanı kaynaklı bir eklentiyi açıkça hedeflediğinde de geçerlidir; dolayısıyla ilgili
çalışma alanı eklentisi devre dışı kaldığı veya izin listesinden çıkarıldığı sürece
yerel kanal eklentisi kurulum kodu çalışmaz. Bağlı kurulumlar ve açık
`plugins.load.paths` girdileri, çözümlenen eklenti kaynakları için normal politikayı
izler. Bkz.
[Eklenti politikasını yapılandırma](/tr/tools/plugin#configure-plugin-policy)
ve [Yapılandırma başvurusu](/tr/gateway/configuration-reference#plugins).

Yönetilen eklenti dizininde çözümlenen tam belirtimi (`name@version`) kaydetmek için npm kurulumlarında `--pin` kullanın; varsayılan davranış sabitlenmemiş olarak kalır.
</Note>

## Listeleme

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Yalnızca etkinleştirilmiş eklentileri gösterir.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Tablo görünümünden biçim/kaynak/köken/sürüm/etkinleştirme meta verilerini içeren eklenti başına ayrıntı satırlarına geçer.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir envanterin yanı sıra kayıt deposu tanılamalarını ve paket bağımlılığı kurulum durumunu gösterir.
</ParamField>

<Note>
`plugins list`, önce kalıcı yerel eklenti kayıt deposunu okur; kayıt deposu eksik veya geçersizse yalnızca manifestten türetilen geri dönüşü kullanır. Bir eklentinin kurulu, etkin ve soğuk başlangıç planlaması tarafından görülebilir olup olmadığını denetlemek için kullanışlıdır ancak hâlihazırda çalışan bir Gateway işleminin canlı çalışma zamanı yoklaması değildir. Eklenti kodunu, etkinleştirme durumunu, kanca politikasını veya `plugins.load.paths` değerini değiştirdikten sonra yeni `register(api)` kodunun ya da kancaların çalışmasını beklemeden önce kanala hizmet veren Gateway'i yeniden başlatın. Uzak/konteyner dağıtımlarında yalnızca bir sarmalayıcı işlemi değil, gerçek `openclaw gateway run` alt işlemini yeniden başlattığınızı doğrulayın.

`plugins list --json`, her eklentinin `package.json` içindeki `dependencies` ve
`optionalDependencies` alanlarından elde edilen `dependencyStatus` değerini içerir.
OpenClaw, bu paket adlarının eklentinin normal Node `node_modules` arama yolu boyunca
bulunup bulunmadığını denetler; eklenti çalışma zamanı kodunu içe aktarmaz, paket
yöneticisi çalıştırmaz veya eksik bağımlılıkları onarmaz.
</Note>

Başlangıç günlüğünde `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
görünürse eklenti kimliklerini doğrulamak için `openclaw plugins list --enabled --verbose`
komutunu veya listelenen bir eklenti kimliğiyle `openclaw plugins inspect <id>`
komutunu çalıştırın ve güvenilir kimlikleri `openclaw.json` içindeki `plugins.allow`
alanına kopyalayın. Uyarı algılanan tüm eklentileri listeleyebildiğinde, bu kimlikleri
zaten içeren ve doğrudan yapıştırılmaya hazır bir `plugins.allow` parçacığı yazdırır.
Bir eklenti kurulum/yükleme yolu kökeni olmadan yükleniyorsa ilgili eklenti kimliğini
inceleyin; ardından güvenilir kimliği `plugins.allow` içinde sabitleyin veya OpenClaw'ın
kurulum kökenini kaydedebilmesi için eklentiyi güvenilir bir kaynaktan yeniden kurun.

Paketlenmiş bir Docker imajı içindeki paketlenmiş eklenti çalışmaları için eklenti
kaynak dizinini `/app/extensions/synology-chat` gibi eşleşen paketlenmiş kaynak
yolunun üzerine bağlama yoluyla bağlayın. OpenClaw, bağlanan bu kaynak katmanını
`/app/dist/extensions/synology-chat` yolundan önce algılar; düz biçimde kopyalanmış
bir kaynak dizini etkisiz kalır, böylece normal paketlenmiş kurulumlar derlenmiş
dist çıktısını kullanmaya devam eder.

Çalışma zamanı kancalarında hata ayıklamak için:

- `openclaw plugins inspect <id> --runtime --json`, modül yüklenmiş bir inceleme geçişinden kaydedilmiş kancaları ve tanılamaları gösterir. Çalışma zamanı incelemesi hiçbir zaman bağımlılıkları yüklemez; eski bağımlılık durumunu temizlemek veya yapılandırmada başvurulan eksik indirilebilir plugin'leri kurtarmak için `openclaw doctor --fix` kullanın.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway URL'sini/profilini, hizmet/işlem ipuçlarını, yapılandırma yolunu ve RPC durumunu doğrular.
- Paketle birlikte gelmeyen konuşma kancaları (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) için `plugins.entries.<id>.hooks.allowConversationAccess=true` gerekir.

### Plugin dizini

Plugin yükleme meta verileri, kullanıcı yapılandırması değil, makine tarafından yönetilen durumdur. Yüklemeler ve güncellemeler bunları etkin OpenClaw durum dizini altındaki paylaşılan SQLite durum veritabanına yazar. `installed_plugin_index` satırı; bozuk veya eksik plugin manifestlerine ait kayıtların yanı sıra `openclaw plugins update`, kaldırma, tanılama ve soğuk plugin kayıt defteri tarafından kullanılan, manifestten türetilmiş bir soğuk kayıt defteri önbelleği dâhil olmak üzere kalıcı `installRecords` meta verilerini saklar.

OpenClaw, yapılandırmada yayımlanmış eski `plugins.installs` kayıtları gördüğünde çalışma zamanı okumaları bunları `openclaw.json` dosyasını yeniden yazmadan uyumluluk girdisi olarak değerlendirir. Açık plugin yazma işlemleri ve `openclaw doctor --fix`, yapılandırma yazmalarına izin verildiğinde bu kayıtları plugin dizinine taşır ve yapılandırma anahtarını kaldırır; yazma işlemlerinden herhangi biri başarısız olursa yükleme meta verilerinin kaybolmaması için yapılandırma kayıtları korunur.

## Kaldırma

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall`, plugin kayıtlarını `plugins.entries` içinden, kalıcı plugin dizininden, plugin izin/verme listesi girdilerinden ve uygun olduğunda bağlantılı `plugins.load.paths` girdilerinden kaldırır. `--keep-files` ayarlanmadığı sürece kaldırma işlemi izlenen yönetilen yükleme dizinini de kaldırır; ancak bunu yalnızca dizin OpenClaw'ın plugin uzantıları kökü içinde çözümleniyorsa yapar. Plugin şu anda `memory` veya `contextEngine` yuvasının sahibiyse bu yuva varsayılanına sıfırlanır (bellek için `memory-core`, bağlam motoru için `legacy`).

`uninstall`, değişiklik yapmadan önce kaldırılacak öğelerin önizlemesini yazdırır ve ardından `Uninstall plugin "<id>"?` istemini gösterir. Onay istemini atlamak için `--force` geçirin (betikler ve etkileşimsiz çalıştırmalar için kullanışlıdır); bu seçenek olmadan kaldırma işlemi etkileşimli bir TTY gerektirir. `--dry-run`, aynı önizlemeyi yazdırır ve istem göstermeden veya herhangi bir değişiklik yapmadan çıkar.

<Note>
`--keep-config`, `--keep-files` için kullanımdan kaldırılmış bir takma ad olarak desteklenir.
</Note>

## Güncelleme

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Güncellemeler, yönetilen plugin dizinindeki izlenen plugin yüklemelerine ve `hooks.internal.installs` içindeki izlenen kanca paketi yüklemelerine uygulanır.

<AccordionGroup>
  <Accordion title="Plugin kimliğinin npm belirtimine karşı çözümlenmesi">
    Bir plugin kimliği geçirdiğinizde OpenClaw, o plugin için kaydedilmiş yükleme belirtimini yeniden kullanır. Bu, `@beta` gibi önceden saklanan dağıtım etiketlerinin ve tam sabitlenmiş sürümlerin sonraki `update <id>` çalıştırmalarında kullanılmaya devam edeceği anlamına gelir.

    `update <id> --dry-run` sırasında tam sabitlenmiş npm yüklemeleri sabit kalır. OpenClaw paketin kayıt defteri varsayılan serisini de çözümleyebiliyorsa ve bu varsayılan seri yüklü sabitlenmiş sürümden daha yeniyse deneme çalıştırması sabitlemeyi bildirir ve kayıt defterinin varsayılan serisini izlemek için açık `@latest` paket güncelleme komutunu yazdırır.

    Bu hedefli güncelleme kuralı, toplu `openclaw plugins update --all` bakım yolundan farklıdır. Toplu güncellemeler normal izlenen yükleme belirtimlerine uymaya devam eder; ancak güvenilir resmî OpenClaw plugin kayıtları, eski bir tam resmî pakette kalmak yerine geçerli resmî katalog hedefine eşitlenebilir. Tam veya etiketli bir resmî belirtimi bilerek değiştirmeden korumak istediğinizde hedefli `update <id>` kullanın.

    npm yüklemelerinde dağıtım etiketi veya tam sürüm içeren açık bir npm paket belirtimi de geçirebilirsiniz. OpenClaw bu paket adını izlenen plugin kaydıyla yeniden eşleştirir, yüklü plugin'i günceller ve gelecekte kimlik tabanlı güncellemeler için yeni npm belirtimini kaydeder.

    npm paket adını sürüm veya etiket olmadan geçirmek de izlenen plugin kaydıyla yeniden eşleştirilir. Bir plugin tam bir sürüme sabitlenmişse ve onu kayıt defterinin varsayılan sürüm serisine geri taşımak istiyorsanız bunu kullanın.

  </Accordion>
  <Accordion title="Beta kanalı güncellemeleri">
    Hedefli `openclaw plugins update <id-or-npm-spec>`, yeni bir belirtim geçirmediğiniz sürece izlenen plugin belirtimini yeniden kullanır. Toplu `openclaw plugins update --all`, güvenilir resmî plugin kayıtlarını resmî katalog hedefine eşitlerken yapılandırılmış `update.channel` değerini kullanır; böylece beta kanalı yüklemeleri sessizce kararlı/en son sürüme normalleştirilmek yerine beta sürüm serisinde kalabilir.

    `openclaw update`, etkin OpenClaw güncelleme kanalını da bilir: beta kanalında varsayılan seri npm ve ClawHub plugin kayıtları önce `@beta` etiketini dener. Plugin'in beta sürümü yoksa kaydedilmiş varsayılan/en son belirtime geri dönerler; npm plugin'leri ayrıca beta paketi mevcut olup yükleme doğrulamasında başarısız olduğunda da geri döner. Bu geri dönüş bir uyarı olarak bildirilir ve çekirdek güncellemesinin başarısız olmasına neden olmaz. Tam sürümler ve açık etiketler, hedefli güncellemelerde ilgili seçiciye sabitlenmiş olarak kalır.

  </Accordion>
  <Accordion title="Sürüm denetimleri ve bütünlük sapması">
    Canlı bir npm güncellemesinden önce OpenClaw, yüklü paket sürümünü npm kayıt defteri meta verileriyle karşılaştırır. Yüklü sürüm ve kaydedilmiş yapıt kimliği çözümlenen hedefle zaten eşleşiyorsa güncelleme; indirme, yeniden yükleme veya `openclaw.json` dosyasını yeniden yazma olmadan atlanır.

    Saklanan bir bütünlük karması mevcutsa ve getirilen yapıt karması değişmişse OpenClaw bunu npm yapıt sapması olarak değerlendirir. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek karmaları yazdırır ve devam etmeden önce onay ister. Etkileşimsiz güncelleme yardımcıları, çağıran açık bir devam politikası sağlamadığı sürece güvenli biçimde başarısız olur.

  </Accordion>
  <Accordion title="Güncellemede --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, uyumluluk amacıyla `plugins update` komutunda da kabul edilir; ancak kullanımdan kaldırılmıştır ve artık plugin güncelleme davranışını değiştirmez. İşletmeci `security.installPolicy` ayarı güncellemeleri yine de engelleyebilir; plugin `before_install` kancaları yalnızca plugin kancalarının yüklendiği işlemlerde uygulanır.
  </Accordion>
  <Accordion title="Güncellemede --acknowledge-clawhub-risk">
    Topluluk ClawHub destekli plugin güncellemeleri, ikame paketi indirmeden önce yüklemelerle aynı tam sürüm güven denetimini çalıştırır. Seçilen ClawHub sürümünde riskli bir güven uyarısı bulunduğunda devam etmesi gereken, incelenmiş otomasyon için `--acknowledge-clawhub-risk` kullanın. Resmî ClawHub paketleri ve paketle birlikte gelen OpenClaw plugin kaynakları bu sürüm güven istemini atlar.
  </Accordion>
</AccordionGroup>

## İnceleme

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

İnceleme, varsayılan olarak plugin çalışma zamanını içe aktarmadan kimliği, yükleme durumunu, kaynağı, manifest yeteneklerini, politika bayraklarını, tanılamaları, yükleme meta verilerini, paket yeteneklerini ve algılanan MCP veya LSP sunucu desteğini gösterir. JSON çıktısı, işletmecilerin bir plugin'i etkinleştirmeden veya yeniden başlatmadan önce güvenilir yüzey bildirimlerini denetleyebilmesi için `contracts.agentToolResultMiddleware` ve `contracts.trustedToolPolicies` gibi plugin manifest sözleşmelerini içerir. Plugin modülünü yüklemek ve kayıtlı kancaları, araçları, komutları, hizmetleri, Gateway yöntemlerini ve HTTP rotalarını dâhil etmek için `--runtime` ekleyin. Çalışma zamanı incelemesi eksik plugin bağımlılıklarını doğrudan bildirir; yükleme ve onarım işlemleri `openclaw plugins install`, `openclaw plugins update` ve `openclaw doctor --fix` içinde kalır.

Plugin'e ait CLI komutları genellikle kök `openclaw` komut grupları olarak yüklenir; ancak plugin'ler `openclaw nodes` gibi bir çekirdek üst öğenin altında iç içe komutlar da kaydedebilir. `inspect --runtime`, `cliCommands` altında bir komut gösterdikten sonra komutu listelenen yolda çalıştırın; örneğin `demo-git` kaydeden bir plugin, `openclaw demo-git ping` ile doğrulanabilir.

Her plugin, çalışma zamanında gerçekten kaydettiği öğelere göre sınıflandırılır:

| Biçim              | Anlam                                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| `plain-capability`  | tam olarak bir yetenek türü (ör. yalnızca sağlayıcı içeren bir plugin)   |
| `hybrid-capability` | birden fazla yetenek türü (ör. metin + konuşma + görseller)              |
| `hook-only`         | yalnızca kancalar; yetenek, araç, komut, hizmet veya rota yok             |
| `non-capability`    | araçlar/komutlar/hizmetler var ancak yetenek yok                          |

Yetenek modeli hakkında daha fazla bilgi için [Plugin biçimleri](/tr/plugins/architecture#plugin-shapes) bölümüne bakın.

<Note>
`--json` bayrağı, betiklerde ve denetimlerde kullanıma uygun, makine tarafından okunabilir bir rapor çıktılar. `inspect --all`; biçim, yetenek türleri, uyumluluk bildirimleri, paket yetenekleri ve kanca özeti sütunlarını içeren, tüm filoyu kapsayan bir tablo oluşturur. `info`, `inspect` için bir takma addır.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor`; plugin yükleme hatalarını, manifest/keşif tanılamalarını, uyumluluk bildirimlerini ve eksik plugin yuvaları gibi eski plugin yapılandırma başvurularını bildirir. Yükleme ağacı ve plugin yapılandırması temiz olduğunda `No plugin issues detected.` yazdırır. Eski yapılandırma kalmış ancak yükleme ağacı bunun dışında sağlıklıysa özet, tam plugin sağlığı izlenimi vermek yerine bunu belirtir.

Yapılandırılmış bir plugin diskte mevcut ancak yükleyicinin yol güvenliği denetimleri tarafından engelleniyorsa yapılandırma doğrulaması plugin girdisini korur ve bunu `present but blocked` olarak bildirir. `plugins.entries.<id>` veya `plugins.allow` yapılandırmasını kaldırmak yerine yol sahipliği ya da herkes tarafından yazılabilir izinler gibi önceki engellenmiş plugin tanılamasını düzeltin.

Eksik `register`/`activate` dışa aktarımları gibi modül biçimi hatalarında, tanılama çıktısına kısa bir dışa aktarım biçimi özeti eklemek için `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

## Kayıt defteri

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Yerel plugin kayıt defteri; yüklü plugin kimliği, etkinleştirme durumu, kaynak meta verileri ve katkı sahipliği için OpenClaw'ın kalıcı soğuk okuma modelidir. Normal başlangıç, sağlayıcı sahibi araması, kanal kurulum sınıflandırması ve plugin envanteri, plugin çalışma zamanı modüllerini içe aktarmadan bu modeli okuyabilir.

Kalıcı kayıt defterinin mevcut, güncel veya eski olup olmadığını incelemek için `plugins registry` kullanın. Kalıcı plugin dizini, yapılandırma politikası ve manifest/paket meta verilerinden yeniden oluşturmak için `--refresh` kullanın. Bu bir onarım yoludur; çalışma zamanı etkinleştirme yolu değildir.

`openclaw doctor --fix`, kayıt defteriyle ilişkili yönetilen npm sapmasını da onarır: yönetilen bir plugin npm projesi altındaki veya eski düz yönetilen npm kökündeki sahipsiz ya da kurtarılmış bir `@openclaw/*` paketi, paketle birlikte gelen bir plugin'i gölgeliyorsa Doctor bu eski paketi kaldırır ve başlangıcın paketle birlikte gelen manifeste göre doğrulama yapması için kayıt defterini yeniden oluşturur. Doctor ayrıca `peerDependencies.openclaw` bildiren yönetilen npm plugin'lerine ana makinenin `openclaw` paketini yeniden bağlar; böylece `openclaw/plugin-sdk/*` gibi paket içi çalışma zamanı içe aktarımları güncellemelerden veya npm onarımlarından sonra çözümlenir.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`, kayıt defteri okuma hataları için kullanımdan kaldırılmış bir acil durum uyumluluk anahtarıdır. `plugins registry --refresh` veya `openclaw doctor --fix` tercih edin; ortam değişkeni geri dönüşü yalnızca geçiş kullanıma sunulurken acil başlangıç kurtarması içindir.
</Warning>

## Pazar yeri

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

`plugins marketplace entries`, yapılandırılmış OpenClaw pazar yeri akışındaki girdileri listeler. Varsayılan olarak barındırılan akışı kullanmayı dener ve başarısız olursa en son kabul edilen anlık görüntüye veya paketlenmiş verilere geri döner. Belirli bir yapılandırılmış profili okumak için `--feed-profile <name>`, açıkça belirtilen bir barındırılmış akış URL'sini okumak için `--feed-url <url>`, akışı getirmeden en son kabul edilen anlık görüntüyü okumak için `--offline` kullanın.

`plugins marketplace refresh`, yapılandırılmış barındırılmış akışın anlık görüntüsünü yeniler ve OpenClaw'ın barındırılmış verileri, barındırılmış bir anlık görüntüyü veya paketlenmiş yedek verileri kabul edip etmediğini bildirir. Çağıranın, yeni bir barındırılmış yük sabitlenmiş bir sağlama toplamıyla eşleşmediği sürece komutun başarısız olmasını istediği durumlarda `--expected-sha256` kullanın.

Pazar yeri `list` komutu; yerel bir pazar yeri yolunu, bir `marketplace.json` yolunu, `owner/repo` gibi bir GitHub kısa gösterimini, bir GitHub depo URL'sini veya bir git URL'sini kabul eder. `--json`, çözümlenmiş kaynak etiketiyle birlikte ayrıştırılmış pazar yeri manifestini ve Plugin girdilerini yazdırır.

Pazar yeri yenileme işlemi, barındırılmış bir OpenClaw pazar yeri akışını yükler ve doğrulanmış yanıtı yerel barındırılmış akış anlık görüntüsü olarak kalıcı hâle getirir. Seçenek verilmediğinde yapılandırılmış varsayılan akış profilini kullanır. Belirli bir yapılandırılmış profili yenilemek için `--feed-profile <name>`, açıkça belirtilen bir barındırılmış akış URL'sini yenilemek için `--feed-url <url>`, yükün sağlama toplamının eşleşmesini zorunlu kılmak için `--expected-sha256 <sha256>` (`sha256:<hex>` veya yalnızca 64 karakterlik onaltılık özet) ve makine tarafından okunabilir çıktı için `--json` kullanın. Açıkça belirtilen barındırılmış akış URL'leri kimlik bilgileri, sorgu dizeleri veya parçalar içermemelidir. Sabitlenmemiş yenilemeler, komutu başarısız kılmadan barındırılmış bir anlık görüntü veya paketlenmiş yedek sonuç bildirebilir. Sabitlenmiş yenilemeler, yeni bir barındırılmış yükü kabul etmedikçe başarısız olur; başarılı barındırılmış yenilemeler ise OpenClaw doğrulanmış anlık görüntüyü kalıcı hâle getiremezse başarısız olur.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [CLI başvurusu](/tr/cli)
- [ClawHub](/clawhub)
