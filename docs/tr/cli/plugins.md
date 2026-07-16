---
read_when:
    - Gateway eklentilerini veya uyumlu paketleri kurmak ya da yönetmek istiyorsunuz
    - Basit bir araç Plugin'i için iskelet oluşturmak veya bunu doğrulamak istiyorsunuz
    - Plugin yükleme hatalarında hata ayıklamak istiyorsunuz
sidebarTitle: Plugins
summary: '`openclaw plugins` için CLI referansı (başlatma, derleme, doğrulama, listeleme, yükleme, pazar yeri, kaldırma, etkinleştirme/devre dışı bırakma, doctor)'
title: Pluginler
x-i18n:
    generated_at: "2026-07-16T17:01:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dadc182cd931672d98c3d1c6ddc1f1defdf0384b25feff7bd4b5324a7fc2e26c
    source_path: cli/plugins.md
    workflow: 16
---

Gateway pluginlerini, hook paketlerini ve uyumlu paketleri yönetin.

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
    Plugin yüklemeleri için güvenlik güçlendirmesi.
  </Card>
</CardGroup>

## Komutlar

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # inspect için takma ad
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

Yavaş yükleme, inceleme, kaldırma veya kayıt yenileme işlemlerini araştırmak için komutu
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ile çalıştırın. İz, aşama zamanlamalarını stderr'e yazar
ve JSON çıktısını ayrıştırılabilir durumda tutar. Bkz. [Hata ayıklama](/tr/help/debugging#plugin-lifecycle-trace).

<Note>
Nix modunda (`OPENCLAW_NIX_MODE=1`), `openclaw.json` değiştirilemez. `install`, `update`, `uninstall`, `enable` ve `disable` komutlarının tümü çalışmayı reddeder. Bunun yerine bu yüklemenin Nix kaynağını (`programs.openclaw.config` veya nix-openclaw için `instances.<name>.config`) düzenleyin, ardından yeniden derleyin. Önce ajan yaklaşımını kullanan [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) bölümüne bakın.
</Note>

<Note>
Paketlenmiş pluginler OpenClaw ile birlikte sunulur. Bazıları varsayılan olarak etkindir (örneğin paketlenmiş model sağlayıcıları, paketlenmiş konuşma sağlayıcıları ve paketlenmiş tarayıcı plugini); diğerleri `plugins enable` gerektirir.

Yerel OpenClaw pluginleri, satır içi JSON Schema (`configSchema`, boş olsa bile) içeren `openclaw.plugin.json` dosyasını sunar. Uyumlu paketler bunun yerine kendi paket manifestlerini kullanır.

`plugins list`, `Format: openclaw` veya `Format: bundle` gösterir. Ayrıntılı liste/bilgi çıktısı ayrıca paket alt türünü (`codex`, `claude` veya `cursor`) ve algılanan paket yeteneklerini gösterir.
</Note>

## Yazma

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` varsayılan olarak asgari bir TypeScript araç plugini oluşturur. İlk
argüman plugin kimliğidir; `--name` görünen adı ayarlar. OpenClaw,
varsayılan çıktı dizini ve paket adlandırması için kimliği kullanır. Araç iskeletleri
`defineToolPlugin` kullanır ve derleme yapıp ardından `openclaw plugins build`/`validate`
çağıran `package.json` betikleri `plugin:build` ve
`plugin:validate` oluşturur.

`plugins build` derlenmiş giriş noktasını içe aktarır, statik araç meta verilerini okur,
`openclaw.plugin.json` dosyasını yazar ve `package.json` dosyasındaki `openclaw.extensions`
değerini uyumlu tutar. `plugins validate`, oluşturulan manifestin, paket meta verilerinin ve
geçerli giriş noktası dışa aktarımının hâlâ birbiriyle uyuştuğunu denetler. Tam yazma iş akışı
için [Araç Pluginleri](/tr/plugins/tool-plugins) bölümüne bakın.

İskelet TypeScript kaynak kodu yazar ancak meta verileri derlenmiş
`./dist/index.js` giriş noktasından oluşturur; dolayısıyla iş akışı yayımlanmış CLI ile de
çalışır. Giriş noktası varsayılan paket giriş noktası değilse `--entry <path>` kullanın.
Dosyaları yeniden yazmadan, oluşturulan meta veriler güncel olmadığında başarısız olmak için
CI'da `plugins build --check` kullanın.

### Sağlayıcı iskeleti

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Sağlayıcı iskeletleri; API anahtarı kimlik doğrulama altyapısı, `clawhub package validate`
çalıştıran bir `npm run validate` betiği, ClawHub paket meta verileri ve gelecekte GitHub
OIDC aracılığıyla güvenilir yayımlama için elle tetiklenen bir GitHub Actions iş akışı içeren,
OpenAI ile uyumlu genel bir model sağlayıcı plugini oluşturur. Sağlayıcı iskeletleri Skills
oluşturmaz ve `openclaw plugins build`/`validate` kullanmaz; bu komutlar araç
iskeletinin oluşturulan meta veri yolu içindir.

Yayımlamadan önce yer tutucu API temel URL'sini, model kataloğunu, belge rotasını,
kimlik bilgisi metnini ve README içeriğini gerçek sağlayıcı ayrıntılarıyla değiştirin. İlk
ClawHub yayını ve güvenilir yayımcı kurulumu için oluşturulan README'yi kullanın.

## Yükleme

```bash
openclaw plugins search "calendar"                      # ClawHub pluginlerini ara
openclaw plugins install @openclaw/<package>            # güvenilir resmî katalog
openclaw plugins install <package>                       # isteğe bağlı npm paketi
openclaw plugins install clawhub:<package>                # yalnızca ClawHub
openclaw plugins install npm:<package>                    # yalnızca npm
openclaw plugins install npm-pack:<path.tgz>               # yerel npm-pack tar arşivi
openclaw plugins install git:github.com/<owner>/<repo>     # git deposu
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # yerel yol veya arşiv
openclaw plugins install -l <path>                         # kopyalamak yerine bağla
openclaw plugins install <plugin>@<marketplace>             # pazar yeri kısa gösterimi
openclaw plugins install <plugin> --marketplace <name>      # pazar yeri (açıkça belirtilmiş)
openclaw plugins install <package> --force                  # kaynağı onayla / mevcut olanın üzerine yaz
openclaw plugins install <package> --pin                    # çözümlenen npm sürümünü sabitle
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

Kurulum sırasındaki yüklemeleri test eden bakımcılar, korumalı ortam değişkenleriyle
otomatik plugin yükleme kaynaklarını geçersiz kılabilir. Bkz.
[Plugin yükleme geçersiz kılmaları](/tr/plugins/install-overrides).

<Warning>
Geçiş döneminde yalın paket adları varsayılan olarak npm'den yüklenir; ancak paket adı paketlenmiş veya resmî bir plugin kimliğiyle eşleşirse OpenClaw, npm kayıt defterine başvurmak yerine bu yerel/resmî kopyayı kullanır. Bilerek haricî bir npm paketi istediğinizde `npm:<package>` kullanın. ClawHub için `clawhub:<package>` kullanın. Plugin yüklemelerini kod çalıştırmak gibi değerlendirin; sabitlenmiş sürümleri tercih edin.
</Warning>

<Warning>
ClawHub paketleri ile OpenClaw'ın paketlenmiş/resmî kataloğu güvenilir yükleme
kaynaklarıdır. Yeni ve isteğe bağlı bir npm, `npm-pack:`, git, yerel yol/arşiv veya
pazar yeri kaynağı, devam etmeden önce uyarı gösterip onay ister. Etkileşimsiz isteğe bağlı
yüklemelerde, kaynağı inceleyip güvenilir olduğunu doğruladıktan sonra `--force`
iletilmelidir. Aynı bayrak gerektiğinde mevcut bir yükleme hedefinin üzerine yazar. Zaten
izlenen bir yüklemenin normal güncellemelerinde bu gerekmez. Bu onay, yalnızca riskli
ClawHub sürümü güven uyarıları için geçerli olan `--acknowledge-clawhub-risk` onayından ayrıdır.
`--force`, `security.installPolicy` veya kalan yükleme güvenliği denetimlerini atlamaz.
</Warning>

`plugins search`, yüklenebilir `code-plugin` ve `bundle-plugin`
paketleri için ClawHub'ı sorgular (Skills için değildir; onlar için `openclaw skills search`
kullanın). Varsayılan `--limit` değeri 20'dir ve üst sınır 100'dür. Yalnızca
uzak kataloğu okur: yerel durum incelemesi, yapılandırma değişikliği, paket yükleme veya
plugin çalışma zamanı yüklemesi yapmaz. Sonuçlar ClawHub paket adını, ailesini, kanalını,
sürümünü, özetini ve `openclaw plugins install clawhub:<package>` gibi bir yükleme ipucunu içerir.

<Note>
ClawHub, çoğu plugin için birincil dağıtım ve keşif yüzeyidir. Npm, desteklenen bir yedek
ve doğrudan yükleme yolu olmaya devam eder. OpenClaw'a ait `@openclaw/*` plugin
paketleri yeniden npm'de yayımlanmaktadır; güncel liste için
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) veya
[plugin envanteri](/tr/plugins/plugin-inventory) bölümüne bakın. Kararlı yüklemeler
`latest` kullanır. Beta kanalı yüklemeleri ve güncellemeleri, mevcutsa npm
`beta` dist-tag'ini tercih eder; yoksa `latest` kullanır. Uzatılmış
kararlı kanalda, yalın/varsayılan veya `latest` amacı taşıyan resmî npm pluginleri,
tam olarak yüklü çekirdek sürümüne çözümlenir. Tam sabitlemeler ve açıkça belirtilen
`latest` dışındaki etiketler, üçüncü taraf paketleri ve npm dışı kaynaklar yeniden
yazılmaz.
</Note>

<AccordionGroup>
  <Accordion title="Yapılandırma eklemeleri ve geçersiz yapılandırma onarımı">
    `plugins` bölümünüz tek dosyalı bir `$include` ile destekleniyorsa, `plugins install/update/enable/disable/uninstall` işlemleri bu eklenen dosyaya yazılır ve `openclaw.json` değiştirilmeden bırakılır. Kök eklemeler, ekleme dizileri ve kardeş geçersiz kılmaları olan eklemeler, düzleştirmek yerine kapalı durumda başarısız olur. Desteklenen biçimler için [Yapılandırma eklemeleri](/tr/gateway/configuration) bölümüne bakın.

    Yükleme sırasında yapılandırma geçersizse `plugins install` normalde kapalı durumda başarısız olur ve önce `openclaw doctor --fix` çalıştırmanızı söyler. Gateway başlangıcı ve çalışırken yeniden yükleme sırasında geçersiz plugin yapılandırması, diğer tüm geçersiz yapılandırmalar gibi kapalı durumda başarısız olur; `openclaw doctor --fix` geçersiz plugin girdisini karantinaya alabilir. Belgelenmiş tek yükleme zamanı istisnası, açıkça `openclaw.install.allowInvalidConfigRecovery` seçeneğini etkinleştiren pluginler için dar kapsamlı bir paketlenmiş plugin kurtarma yoludur.

  </Accordion>
  <Accordion title="--force onayı ve yeniden yükleme ile güncelleme arasındaki fark">
    `--force`, ClawHub dışındaki bir kaynağı istem göstermeden onaylar. `security.installPolicy` veya kalan yükleme güvenliği denetimlerini atlamaz. Plugin veya hook paketi zaten yüklüyse mevcut hedefi yeniden kullanır ve yerinde üzerine yazar. İsteğe bağlı bir npm, yerel, arşiv, git veya pazar yeri kaynağını inceledikten sonra ya da aynı kimliği bilerek yeniden yüklerken kullanın. Zaten izlenen bir npm plugininin rutin yükseltmeleri için `openclaw plugins update <id-or-npm-spec>` tercih edin.

    Zaten yüklü bir plugin kimliği için `plugins install` çalıştırırsanız OpenClaw durur ve normal bir yükseltme için `plugins update <id-or-npm-spec>` komutuna ya da mevcut yüklemenin üzerine gerçekten farklı bir kaynaktan yazmak istediğinizde `plugins install <package> --force` komutuna yönlendirir. İsteğe bağlı kaynaklar yine etkileşimli kaynak uyarısını gösterir; etkileşimsiz yüklemelerde, incelemenin ardından `--force` iletilmelidir. Güvenilir ClawHub ve OpenClaw katalog kaynaklarında buna gerek yoktur. `--link` ile `--force` kaynağı onaylar ancak bağlı yol yükleme modunu değiştirmez.

  </Accordion>
  <Accordion title="--pin kapsamı">
    `--pin` yalnızca npm yüklemelerine uygulanır ve çözümlenen tam `<name>@<version>` değerini kaydeder. `git:` yüklemelerinde desteklenmez (bunun yerine başvuruyu belirtimde sabitleyin; ör. `git:github.com/acme/plugin@v1.2.3`) ve `--marketplace` ile de desteklenmez (pazar yeri yüklemeleri, npm belirtimi yerine pazar yeri kaynak meta verilerini kalıcı olarak saklar).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` kullanım dışıdır ve artık hiçbir işlem yapmaz. OpenClaw artık plugin yüklemelerinde yerleşik yükleme zamanı tehlikeli kod engellemesini çalıştırmaz.

    Ana bilgisayara özgü yükleme politikası gerektiğinde operatöre ait `security.installPolicy` yüzeyini kullanın. Plugin `before_install` kancaları, CLI yüklemeleri için birincil politika sınırı değil, Plugin çalışma zamanı yaşam döngüsü kancalarıdır.

    ClawHub'da yayımladığınız bir Plugin kayıt defteri taraması tarafından gizlenir veya engellenirse [ClawHub'da yayımlama](/tr/clawhub/publishing) bölümündeki yayımcı adımlarını kullanın. `--dangerously-force-unsafe-install`, ClawHub'dan Plugin'i yeniden taramasını veya engellenmiş bir sürümü herkese açık hâle getirmesini istemez.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Topluluk ClawHub yüklemeleri, indirmeden önce seçilen sürümün güven kaydını denetler. ClawHub sürümün indirilmesini devre dışı bırakırsa, kötü amaçlı tarama bulguları bildirirse veya sürümü engelleyici bir moderasyon durumuna (karantinaya alınmış, iptal edilmiş) geçirirse OpenClaw, bu bayraktan bağımsız olarak sürümü kesin olarak reddeder. Engelleyici olmayan riskli tarama durumları veya moderasyon durumlarında OpenClaw güven ayrıntılarını gösterir ve devam etmeden önce onay ister.

    `--acknowledge-clawhub-risk` seçeneğini yalnızca ClawHub uyarısını inceledikten ve etkileşimli bir istem olmadan devam etmeye karar verdikten sonra kullanın. Bekleyen veya güncelliğini yitirmiş (henüz temiz olmayan) tarama sonuçları uyarı verir ancak onay gerektirmez. Resmî ClawHub paketleri ve paketlenmiş OpenClaw Plugin kaynakları bu sürüm güveni denetimini tamamen atlar.

  </Accordion>
  <Accordion title="Kanca paketleri ve npm belirtimleri">
    `plugins install`, `package.json` içinde `openclaw.hooks` sunan kanca paketlerinin yükleme yüzeyidir. Paket yüklemek için değil, filtrelenmiş kanca görünürlüğü ve kanca bazında etkinleştirme için `openclaw hooks` kullanın.

    Npm belirtimleri **yalnızca kayıt defterine yöneliktir** (paket adı ve isteğe bağlı **tam sürüm** veya **dist-tag**). Git/URL/dosya belirtimleri ve semver aralıkları reddedilir. Bağımlılık yüklemeleri, kabuğunuzda genel npm yükleme ayarları bulunsa bile güvenlik için `--ignore-scripts` ile Plugin başına tek bir yönetilen npm projesinde çalışır. Yönetilen Plugin npm projeleri, OpenClaw'ın paket düzeyindeki npm `overrides` ayarını devralır; böylece ana bilgisayar güvenlik sabitlemeleri üst düzeye çıkarılan Plugin bağımlılıklarına da uygulanır.

    Npm çözümlemesini açıkça belirtmek için `npm:<package>` kullanın. Yalın paket belirtimleri de resmî bir Plugin kimliğiyle eşleşmedikleri sürece lansman geçişi sırasında doğrudan npm'den yüklenir.

    Paketlenmiş Plugin'lerle eşleşen ham `@openclaw/*` belirtimleri, npm geri dönüşünden önce imajın sahip olduğu paketlenmiş kopyaya çözümlenir. Örneğin `openclaw plugins install @openclaw/discord@2026.5.20 --pin`, yönetilen bir npm geçersiz kılması oluşturmak yerine geçerli OpenClaw derlemesindeki paketlenmiş Discord Plugin'ini kullanır. Haricî npm paketini zorunlu kılmak için `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` kullanın.

    Yalın belirtimler ve `@latest`, kararlı kanalda kalır. `2026.5.3-1` gibi OpenClaw'ın tarih damgalı düzeltme sürümleri bu denetim için kararlı sayılır. Npm bu biçimlerden herhangi birini bir ön sürüme çözümlerse OpenClaw durur ve bir ön sürüm etiketiyle (`@beta`/`@rc`) veya tam bir ön sürüm numarasıyla (`@1.2.3-beta.4`) açıkça kabul etmenizi ister.

    Tam sürüm içermeyen npm yüklemelerinde (`npm:<package>` veya `npm:<package>@latest`) OpenClaw, yüklemeden önce çözümlenen paket meta verilerini denetler. En son kararlı paket daha yeni bir OpenClaw Plugin API'si veya daha yüksek bir asgari ana bilgisayar sürümü gerektiriyorsa OpenClaw eski kararlı sürümleri inceler ve bunun yerine en yeni uyumlu sürümü yükler. Tam sürümler ve açık dist-tag'ler katı kalır: uyumsuz bir seçim başarısız olur ve OpenClaw'ı yükseltmenizi veya uyumlu bir sürüm seçmenizi ister.

    Yalın bir yükleme belirtimi resmî bir Plugin kimliğiyle eşleşirse (örneğin `diffs`) OpenClaw doğrudan katalog girdisini yükler. Aynı ada sahip bir npm paketini yüklemek için açık bir kapsamlı belirtim kullanın (örneğin `@scope/diffs`).

  </Accordion>
  <Accordion title="Git depoları">
    Doğrudan bir git deposundan yüklemek için `git:<repo>` kullanın. Desteklenen biçimler: `git:github.com/owner/repo`, `git:owner/repo`, tam `https://`, `ssh://`, `git://`, `file://` ve `git@host:owner/repo.git` klonlama URL'leri. Yüklemeden önce bir dalı, etiketi veya commit'i kullanıma almak için `@<ref>` ya da `#<ref>` ekleyin.

    Git yüklemeleri geçici bir dizine klonlar, varsa istenen referansı kullanıma alır ve ardından normal Plugin dizini yükleyicisini kullanır; dolayısıyla manifest doğrulaması, operatör yükleme politikası, paket yöneticisi yükleme işlemleri ve yükleme kayıtları npm yüklemelerindeki gibi davranır. Kaydedilen git yüklemeleri, kaynak URL'sini/referansını ve çözümlenen commit'i içerir; böylece `openclaw plugins update` daha sonra kaynağı yeniden çözümleyebilir.

    Git'ten yükledikten sonra Gateway yöntemleri ve CLI komutları gibi çalışma zamanı kayıtlarını doğrulamak için `openclaw plugins inspect <id> --runtime --json` kullanın. Plugin, `api.registerCli` ile bir CLI kökü kaydettiyse bu komutu doğrudan OpenClaw kök CLI'si üzerinden çalıştırın; örneğin `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Arşivler">
    Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Yerel OpenClaw Plugin arşivleri, çıkarılan Plugin kökünde geçerli bir `openclaw.plugin.json` içermelidir; yalnızca `package.json` içeren arşivler, OpenClaw yükleme kayıtlarını yazmadan önce reddedilir.

    Dosya bir npm-pack tarball'ıysa ve kayıt defteri yüklemelerinin kullandığı,
    `package-lock.json` doğrulaması, üst düzeye çıkarılmış bağımlılık taraması
    ve npm yükleme kayıtları dâhil olmak üzere Plugin başına aynı yönetilen npm
    proje yolunu istiyorsanız `npm-pack:<path.tgz>` kullanın. Düz arşiv yolları,
    Plugin uzantıları kökü altında yerel arşivler olarak yüklenmeye devam eder.

    Claude marketplace yüklemeleri de desteklenir.

  </Accordion>
</AccordionGroup>

ClawHub yüklemeleri açık bir `clawhub:<package>` konumlandırıcısı kullanır:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Npm için güvenli yalın Plugin belirtimleri, resmî bir Plugin kimliğiyle eşleşmedikleri sürece lansman geçişi sırasında varsayılan olarak npm'den yüklenir:

```bash
openclaw plugins install openclaw-codex-app-server
```

Yalnızca npm çözümlemesini açıkça belirtmek için `npm:` kullanın:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw, yüklemeden önce ilan edilen Plugin API'si / asgari Gateway uyumluluğunu denetler. Seçilen ClawHub sürümü bir ClawPack yapıtı yayımladığında OpenClaw sürümlendirilmiş npm-pack `.tgz` dosyasını indirir, ClawHub özet üstbilgisini ve yapıt özetini doğrular, ardından normal arşiv yolu üzerinden yükler. ClawPack meta verileri bulunmayan eski ClawHub sürümleri, eski paket arşivi doğrulama yolu üzerinden yüklenmeye devam eder. Kaydedilen yüklemeler, sonraki güncellemeler için ClawHub kaynak meta verilerini, yapıt türünü, npm bütünlük değerini, npm shasum değerini, tarball adını ve ClawPack özet bilgilerini korur.
Sürümlendirilmemiş ClawHub yüklemeleri, `openclaw plugins update` komutunun daha yeni ClawHub sürümlerini takip edebilmesi için sürümlendirilmemiş bir kayıtlı belirtimi korur; `clawhub:pkg@1.2.3` ve `clawhub:pkg@beta` gibi açık sürüm veya etiket seçicileri ilgili seçiciye sabitlenmiş olarak kalır.

### Marketplace kısa gösterimi

Marketplace adı, Claude'un `~/.claude/plugins/known_marketplaces.json` konumundaki yerel kayıt defteri önbelleğinde mevcutsa `plugin@marketplace` kısa gösterimini kullanın:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Marketplace kaynağını açıkça iletmek için `--marketplace` kullanın:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace kaynakları">
    - a `~/.claude/plugins/known_marketplaces.json` içindeki bilinen bir Claude marketplace adı
    - a yerel bir marketplace kökü veya `marketplace.json` yolu
    - `owner/repo` gibi bir GitHub depo kısa gösterimi
    - `https://github.com/owner/repo` gibi bir GitHub depo URL'si
    - bir git URL'si

  </Tab>
  <Tab title="Uzak marketplace kuralları">
    GitHub veya git'ten yüklenen uzak marketplace'ler için Plugin girdileri klonlanan marketplace deposunun içinde kalmalıdır. OpenClaw, bu depodaki göreli yol kaynaklarını kabul eder; uzak manifestlerdeki HTTP(S), mutlak yol, git, GitHub ve yol olmayan diğer Plugin kaynaklarını reddeder.
  </Tab>
</Tabs>

OpenClaw, yerel yollar ve arşivler için şunları otomatik olarak algılar:

- yerel OpenClaw Plugin'leri (`openclaw.plugin.json`)
- Codex uyumlu paketler (`.codex-plugin/plugin.json`)
- Claude uyumlu paketler (`.claude-plugin/plugin.json` veya bu manifest dosyası yoksa varsayılan Claude bileşen düzeni)
- Cursor uyumlu paketler (`.cursor-plugin/plugin.json`)

Yönetilen yerel yüklemeler Plugin dizinleri veya arşivleri olmalıdır. Bağımsız `.js`,
`.mjs`, `.cjs` ve `.ts` Plugin dosyaları `plugins install` tarafından yönetilen Plugin
köküne kopyalanmaz ve doğrudan
`~/.openclaw/extensions` veya `<workspace>/.openclaw/extensions` içine yerleştirilerek yüklenmez; bu
otomatik keşfedilen kökler Plugin paketi veya paket dizinlerini yükler ve
üst düzey betik dosyalarını yerel yardımcılar olarak atlar. Bunun yerine bağımsız dosyaları
`plugins.load.paths` içinde açıkça listeleyin.

<Note>
Uyumlu paketler normal Plugin köküne yüklenir ve aynı listeleme/bilgi/etkinleştirme/devre dışı bırakma akışına katılır. Şu anda paket Skills'ları, Claude komut Skills'ları, Claude `settings.json` varsayılanları, Claude `.lsp.json` / manifestte bildirilen `lspServers` varsayılanları, Cursor komut Skills'ları ve uyumlu Codex kanca dizinleri desteklenmektedir; algılanan diğer paket yetenekleri tanılama/bilgi bölümünde gösterilir ancak henüz çalışma zamanı yürütmesine bağlanmamıştır.
</Note>

Yerel bir Plugin dizinini kopyalamadan göstermek için `-l`/`--link` kullanın
(`plugins.load.paths` öğesine ekler):

```bash
openclaw plugins install -l ./my-plugin
```

`--link`, `--marketplace` veya `git:` yüklemeleriyle desteklenmez ve
zaten var olan bir yerel yol gerektirir. Etkileşimsiz bir yerel bağlantı için
kaynağı inceledikten sonra `--force` iletin; bu, kaynağın kökenini onaylar ancak
bağlantılı dizini kopyalamaz veya üzerine yazmaz.

<Note>
Bir çalışma alanı uzantıları kökünden keşfedilen çalışma alanı kaynaklı Plugin'ler,
açıkça etkinleştirilene kadar içe aktarılmaz veya çalıştırılmaz. Yerel geliştirme için
`openclaw plugins enable <plugin-id>` komutunu çalıştırın veya
`plugins.entries.<plugin-id>.enabled: true` ayarını yapın; yapılandırmanız
`plugins.allow` kullanıyorsa aynı Plugin kimliğini oraya da ekleyin. Bu güvenli biçimde kapalı kuralı,
kanal kurulumu yalnızca kurulum amacıyla yükleme için çalışma alanı kaynaklı bir Plugin'i açıkça hedeflediğinde de
geçerlidir; dolayısıyla bu çalışma alanı Plugin'i devre dışı kaldığı veya izin verilenler listesinden
çıkarıldığı sürece yerel kanal Plugin'i kurulum kodu çalışmaz. Bağlantılı yüklemeler
ve açık `plugins.load.paths` girdileri, çözümlenen Plugin kökenleri için
normal politikayı izler. Bkz.
[Plugin politikasını yapılandırma](/tr/tools/plugin#configure-plugin-policy)
ve [Yapılandırma başvurusu](/tr/gateway/configuration-reference#plugins).

Yönetilen Plugin dizininde çözümlenen tam belirtimi (`name@version`) kaydetmek ve varsayılan davranışı sabitlenmemiş olarak korumak için npm yüklemelerinde `--pin` kullanın.
</Note>

## Listeleme

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Yalnızca etkinleştirilmiş Plugin'leri gösterir.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Tablo görünümünden biçim/kaynak/köken/sürüm/etkinleştirme meta verilerini içeren Plugin başına ayrıntı satırlarına geçer.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir envanterin yanı sıra kayıt defteri tanılamalarını ve paket bağımlılığı yükleme durumunu gösterir.
</ParamField>

<Note>
`plugins list` önce kalıcı yerel plugin kayıt defterini okur; kayıt defteri eksik veya geçersizse yalnızca manifestten türetilen geri dönüşü kullanır. Bir pluginin yüklü, etkin ve soğuk başlangıç planlaması tarafından görünür olup olmadığını denetlemek için kullanışlıdır; ancak hâlihazırda çalışan bir Gateway işleminin canlı çalışma zamanı yoklaması değildir. Plugin kodunu, etkinleştirmeyi, kanca politikasını veya `plugins.load.paths` öğesini değiştirdikten sonra yeni `register(api)` kodunun ya da kancalarının çalışmasını beklemeden önce kanala hizmet veren Gateway'i yeniden başlatın. Uzak/kapsayıcı dağıtımlarda yalnızca bir sarmalayıcı işlemi değil, gerçek `openclaw gateway run` alt işlemini yeniden başlattığınızı doğrulayın.

`plugins list --json`, her pluginin `package.json`
`dependencies` ve `optionalDependencies` içindeki `dependencyStatus` öğesini içerir. OpenClaw, bu paket
adlarının pluginin normal Node `node_modules` arama yolunda bulunup bulunmadığını
denetler; plugin çalışma zamanı kodunu içe aktarmaz, bir paket yöneticisi çalıştırmaz
veya eksik bağımlılıkları onarmaz.
</Note>

Başlangıç günlüklerinde `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` yer alıyorsa plugin
kimliklerini doğrulamak için listelenen bir plugin kimliğiyle `openclaw plugins list --enabled --verbose` veya
`openclaw plugins inspect <id>` komutunu çalıştırın ve güvenilir kimlikleri `openclaw.json` içindeki
`plugins.allow` öğesine kopyalayın. Uyarı keşfedilen tüm pluginleri listeleyebildiğinde,
bu kimlikleri zaten içeren ve doğrudan yapıştırılmaya hazır bir
`plugins.allow` parçacığı yazdırır. Bir plugin kurulum/yükleme yolu kaynağı olmadan
yükleniyorsa söz konusu plugin kimliğini inceleyin; ardından güvenilir kimliği
`plugins.allow` içinde sabitleyin veya OpenClaw'ın kurulum kaynağını kaydetmesi için
plugini güvenilir bir kaynaktan yeniden yükleyin.

Paketlenmiş bir Docker görüntüsü içinde gömülü plugin üzerinde çalışırken plugin
kaynak dizinini, `/app/extensions/synology-chat` gibi eşleşen paketlenmiş kaynak yolunun
üzerine bağlama ile ekleyin. OpenClaw, bağlanan bu kaynak katmanını
`/app/dist/extensions/synology-chat` öncesinde keşfeder; yalnızca kopyalanmış bir kaynak dizini
etkisiz kalır, dolayısıyla normal paketlenmiş kurulumlar derlenmiş dist'i kullanmaya devam eder.

Çalışma zamanı kancalarında hata ayıklamak için:

- `openclaw plugins inspect <id> --runtime --json`, modül yüklenmiş bir inceleme geçişindeki kayıtlı kancaları ve tanılamaları gösterir. Çalışma zamanı incelemesi hiçbir zaman bağımlılık yüklemez; eski bağımlılık durumunu temizlemek veya yapılandırmada başvurulan eksik indirilebilir pluginleri kurtarmak için `openclaw doctor --fix` kullanın.
- `openclaw gateway status --deep --require-rpc`, erişilebilir Gateway URL'sini/profilini, hizmet/işlem ipuçlarını, yapılandırma yolunu ve RPC durumunu doğrular.
- Gömülü olmayan konuşma kancaları (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) `plugins.entries.<id>.hooks.allowConversationAccess=true` gerektirir.

### Plugin dizini

Plugin kurulum meta verileri, kullanıcı yapılandırması değil, makine tarafından yönetilen durumdur. Kurulumlar ve güncellemeler bunları etkin OpenClaw durum dizininin altındaki paylaşılan SQLite durum veritabanına yazar. `installed_plugin_index` satırı; bozuk veya eksik plugin manifestlerine ilişkin kayıtların yanı sıra `openclaw plugins update`, kaldırma, tanılama ve soğuk plugin kayıt defteri tarafından kullanılan, manifestten türetilmiş bir soğuk kayıt defteri önbelleği dâhil olmak üzere kalıcı `installRecords` meta verilerini depolar.

OpenClaw, yapılandırmada yayımlanmış eski `plugins.installs` kayıtlarını gördüğünde çalışma zamanı okumaları bunları `openclaw.json` yeniden yazılmadan uyumluluk girdisi olarak işler. Açık plugin yazmaları ve `openclaw doctor --fix`, bu kayıtları plugin dizinine taşır ve yapılandırma yazmalarına izin verildiğinde yapılandırma anahtarını kaldırır; yazmalardan biri başarısız olursa kurulum meta verilerinin kaybolmaması için yapılandırma kayıtları korunur.

## Kaldırma

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall`, plugin kayıtlarını `plugins.entries`, kalıcı plugin dizini, plugin izin/ret listesi girdileri ve uygun olduğunda bağlantılı `plugins.load.paths` girdilerinden kaldırır. `--keep-files` ayarlanmadığı sürece kaldırma işlemi, izlenen yönetilen kurulum dizinini de kaldırır; ancak bunu yalnızca dizin OpenClaw'ın plugin uzantıları kökü içinde çözümleniyorsa yapar. Plugin şu anda `memory` veya `contextEngine` yuvasına sahipse bu yuva varsayılanına sıfırlanır (bellek için `memory-core`, bağlam motoru için `legacy`).

`uninstall`, kaldırılacakların önizlemesini yazdırır ve değişiklik yapmadan önce `Uninstall plugin "<id>"?` istemini gösterir. Onay istemini atlamak için `--force` geçirin (betikler ve etkileşimsiz çalıştırmalar için kullanışlıdır); bu seçenek olmadan kaldırma işlemi etkileşimli bir TTY gerektirir. `--dry-run`, aynı önizlemeyi yazdırır ve istem göstermeden veya herhangi bir şeyi değiştirmeden çıkar.

<Note>
`--keep-config`, `--keep-files` için kullanımdan kaldırılmış bir takma ad olarak desteklenir.
</Note>

## Güncelleme

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update @acme/demo
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Güncellemeler, yönetilen plugin dizinindeki izlenen plugin kurulumlarına ve `hooks.internal.installs` içindeki izlenen kanca paketi kurulumlarına uygulanır. Kullanıcının plugini yüklerken zaten seçtiği kaynağı yeniden kullanırlar; bu nedenle ikinci bir kaynak onayı gerektirmezler.

<AccordionGroup>
  <Accordion title="Plugin kimliği ile npm belirtiminin çözümlenmesi">
    Bir plugin kimliği geçirdiğinizde OpenClaw, o plugin için kaydedilmiş kurulum belirtimini yeniden kullanır. Bu, `@beta` gibi daha önce depolanmış dist-tag'lerin ve tam sabitlenmiş sürümlerin sonraki `update <id>` çalıştırmalarında kullanılmaya devam edeceği anlamına gelir.

    `update <id> --dry-run` sırasında tam sabitlenmiş npm kurulumları sabit kalır. OpenClaw ayrıca paketin kayıt defteri varsayılan hattını çözümleyebiliyorsa ve bu varsayılan hat yüklü sabitlenmiş sürümden daha yeniyse deneme çalıştırması sabitlemeyi bildirir ve kayıt defteri varsayılan hattını izlemek için açık `@latest` paket güncelleme komutunu yazdırır.

    Bu hedefli güncelleme kuralı, toplu `openclaw plugins update --all` bakım yolundan farklıdır. Toplu güncellemeler normal izlenen kurulum belirtimlerine uymaya devam eder; ancak güvenilir resmî OpenClaw plugin kayıtları, eski bir tam resmî pakette kalmak yerine geçerli resmî katalog hedefine eşitlenebilir. Tam veya etiketli resmî bir belirtimi bilerek değiştirmeden korumak istediğinizde hedefli `update <id>` kullanın.

    npm kurulumları için dist-tag veya tam sürüm içeren açık bir npm paket belirtimi de geçirebilirsiniz. OpenClaw bu paket adını izlenen plugin kaydına geri çözümleyerek yüklü plugini günceller ve gelecekteki kimlik tabanlı güncellemeler için yeni npm belirtimini kaydeder.

    npm paket adının sürüm veya etiket olmadan geçirilmesi de izlenen plugin kaydına geri çözümlenir. Bir plugin tam bir sürüme sabitlenmişse ve onu kayıt defterinin varsayılan sürüm hattına geri taşımak istiyorsanız bunu kullanın.

  </Accordion>
  <Accordion title="Beta kanalı güncellemeleri">
    Hedefli `openclaw plugins update <id-or-npm-spec>`, yeni bir belirtim geçirmediğiniz sürece izlenen plugin belirtimini yeniden kullanır. Toplu `openclaw plugins update --all`, güvenilir resmî plugin kayıtlarını resmî katalog hedefine eşitlerken yapılandırılmış `update.channel` değerini kullanır; böylece beta kanalı kurulumları sessizce kararlı/latest sürümüne normalleştirilmek yerine beta sürüm hattında kalabilir.

    `openclaw update` ayrıca etkin OpenClaw güncelleme kanalını bilir: beta kanalında, varsayılan hat npm ve ClawHub plugin kayıtları önce `@beta` öğesini dener. Pluginin beta sürümü yoksa kaydedilmiş varsayılan/latest belirtimine geri dönerler; npm pluginleri, beta paketi mevcut ancak kurulum doğrulamasında başarısız olduğunda da geri döner. Bu geri dönüş bir uyarı olarak bildirilir ve çekirdek güncellemesini başarısız kılmaz. Tam sürümler ve açık etiketler, hedefli güncellemelerde bu seçiciye sabitlenmiş olarak kalır.

  </Accordion>
  <Accordion title="Sürüm denetimleri ve bütünlük sapması">
    Canlı bir npm güncellemesinden önce OpenClaw, yüklü paket sürümünü npm kayıt defteri meta verileriyle karşılaştırır. Yüklü sürüm ve kaydedilmiş yapıt kimliği çözümlenen hedefle zaten eşleşiyorsa güncelleme; indirme, yeniden yükleme veya `openclaw.json` yeniden yazılmadan atlanır.

    Depolanmış bir bütünlük özeti mevcutken getirilen yapıt özeti değişirse OpenClaw bunu npm yapıt sapması olarak değerlendirir. Etkileşimli `openclaw plugins update` komutu beklenen ve gerçek özetleri yazdırır ve devam etmeden önce onay ister. Etkileşimsiz güncelleme yardımcıları, çağıran açık bir devam politikası sağlamadığı sürece güvenli biçimde başarısız olur.

  </Accordion>
  <Accordion title="Güncellemede --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install`, uyumluluk amacıyla `plugins update` üzerinde de kabul edilir; ancak kullanımdan kaldırılmıştır ve artık plugin güncelleme davranışını değiştirmez. Operatör `security.installPolicy` yine de güncellemeleri engelleyebilir; plugin `before_install` kancaları yalnızca plugin kancalarının yüklendiği işlemlerde uygulanır.
  </Accordion>
  <Accordion title="Güncellemede --acknowledge-clawhub-risk">
    Topluluk ClawHub destekli plugin güncellemeleri, yedek paketi indirmeden önce kurulumlarla aynı tam sürüm güven denetimini çalıştırır. Seçilen ClawHub sürümünde riskli bir güven uyarısı bulunduğunda devam etmesi gereken incelenmiş otomasyon için `--acknowledge-clawhub-risk` kullanın. Resmî ClawHub paketleri ve gömülü OpenClaw plugin kaynakları bu sürüm güven istemini atlar.
  </Accordion>
</AccordionGroup>

## İnceleme

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

İnceleme, varsayılan olarak plugin çalışma zamanını içe aktarmadan kimliği, yükleme durumunu, kaynağı, manifest yeteneklerini, politika bayraklarını, tanılamaları, kurulum meta verilerini, paket yeteneklerini ve algılanan tüm MCP veya LSP sunucu desteğini gösterir. JSON çıktısı, operatörlerin bir plugini etkinleştirmeden veya yeniden başlatmadan önce güvenilir yüzey bildirimlerini denetleyebilmesi için `contracts.agentToolResultMiddleware` ve `contracts.trustedToolPolicies` gibi plugin manifest sözleşmelerini içerir. Plugin modülünü yüklemek ve kayıtlı kancaları, araçları, komutları, hizmetleri, gateway yöntemlerini ve HTTP rotalarını dâhil etmek için `--runtime` ekleyin. Çalışma zamanı incelemesi eksik plugin bağımlılıklarını doğrudan bildirir; kurulumlar ve onarımlar `openclaw plugins install`, `openclaw plugins update` ve `openclaw doctor --fix` içinde kalır.

Pluginlerin sahip olduğu CLI komutları genellikle kök `openclaw` komut grupları olarak yüklenir; ancak pluginler `openclaw nodes` gibi bir çekirdek üst öğenin altında iç içe komutlar da kaydedebilir. `inspect --runtime`, `cliCommands` altında bir komut gösterdikten sonra komutu listelenen yolda çalıştırın; örneğin `demo-git` kaydeden bir plugin `openclaw demo-git ping` ile doğrulanabilir.

Her plugin, çalışma zamanında gerçekten kaydettiği öğelere göre sınıflandırılır:

| Biçim              | Anlamı                                                            |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | tam olarak bir yetenek türü (ör. yalnızca sağlayıcı olan bir plugin) |
| `hybrid-capability` | birden fazla yetenek türü (ör. metin + konuşma + görüntüler)       |
| `hook-only`         | yalnızca kancalar; yetenek, araç, komut, hizmet veya rota yok      |
| `non-capability`    | araçlar/komutlar/hizmetler var ancak yetenek yok                   |

Yetenek modeli hakkında daha fazla bilgi için [Plugin biçimleri](/tr/plugins/architecture#plugin-shapes) bölümüne bakın.

<Note>
`--json` bayrağı, betik oluşturma ve denetim için uygun, makine tarafından okunabilir bir rapor çıktılar. `inspect --all`; biçim, yetenek türleri, uyumluluk bildirimleri, paket yetenekleri ve kanca özeti sütunlarını içeren filo genelinde bir tablo oluşturur. `info`, `inspect` için bir takma addır.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor`; plugin yükleme hatalarını, manifest/keşif tanılamalarını, uyumluluk bildirimlerini ve eksik plugin yuvaları gibi eski plugin yapılandırması başvurularını bildirir. Kurulum ağacı ve plugin yapılandırması temiz olduğunda `No plugin issues detected.` yazdırır. Eski yapılandırma kalmış ancak kurulum ağacı bunun dışında sağlıklıysa özet, plugin durumunun tamamen sağlıklı olduğunu ima etmek yerine bunu belirtir.

Yapılandırılmış bir plugin diskte mevcut ancak yükleyicinin yol güvenliği denetimleri tarafından engelleniyorsa yapılandırma doğrulaması plugin girdisini korur ve bunu `present but blocked` olarak bildirir. `plugins.entries.<id>` veya `plugins.allow` yapılandırmasını kaldırmak yerine yol sahipliği ya da herkesçe yazılabilir izinler gibi önceki engellenmiş plugin tanılamasını düzeltin.

Eksik `register`/`activate` dışa aktarımları gibi modül biçimi hatalarında, tanılama çıktısına kısa bir dışa aktarım biçimi özeti eklemek için `OPENCLAW_PLUGIN_LOAD_DEBUG=1` ile yeniden çalıştırın.

## Kayıt Defteri

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Yerel plugin kayıt defteri; kurulu plugin kimliği, etkinleştirme durumu, kaynak meta verileri ve katkı sahipliği için OpenClaw'ın kalıcı soğuk okuma modelidir. Normal başlatma, sağlayıcı sahibi araması, kanal kurulumu sınıflandırması ve plugin envanteri, plugin çalışma zamanı modüllerini içe aktarmadan bunu okuyabilir.

Kalıcı kayıt defterinin mevcut, güncel veya eski olup olmadığını incelemek için `plugins registry` kullanın. Kalıcı plugin dizini, yapılandırma politikası ve manifest/paket meta verilerinden yeniden oluşturmak için `--refresh` kullanın. Bu bir onarım yoludur, çalışma zamanı etkinleştirme yolu değildir.

`openclaw doctor --fix` ayrıca kayıt defteriyle ilişkili yönetilen npm sapmalarını da onarır: yönetilen bir plugin npm projesinin veya eski düz yönetilen npm kökünün altındaki sahipsiz ya da kurtarılmış bir `@openclaw/*` paketi, paketle birlikte gelen bir plugini gölgeliyorsa doctor bu eski paketi kaldırır ve başlangıç doğrulamasının paketle birlikte gelen manifest üzerinden yapılması için kayıt defterini yeniden oluşturur. Doctor ayrıca ana makinenin `openclaw` paketini, `peerDependencies.openclaw` bildiren yönetilen npm pluginlerine yeniden bağlar; böylece `openclaw/plugin-sdk/*` gibi paket içi çalışma zamanı içe aktarımları güncellemelerden veya npm onarımlarından sonra çözümlenir.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1`, kayıt defteri okuma hataları için kullanımdan kaldırılmış bir acil durum uyumluluk anahtarıdır. `plugins registry --refresh` veya `openclaw doctor --fix` tercih edin; ortam değişkeni geri dönüşü yalnızca geçiş kullanıma sunulurken acil başlangıç kurtarması içindir.
</Warning>

## Pazar Yeri

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

`plugins marketplace entries`, yapılandırılmış OpenClaw pazar yeri akışındaki girdileri listeler. Varsayılan olarak barındırılan akışı kullanmayı dener ve başarısız olursa kabul edilen en son anlık görüntüye veya paketle birlikte gelen verilere geri döner. Belirli bir yapılandırılmış profili okumak için `--feed-profile <name>`, açık bir barındırılan akış URL'sini okumak için `--feed-url <url>` ve akışı getirmeden kabul edilen en son anlık görüntüyü okumak için `--offline` kullanın.

`plugins marketplace refresh`, yapılandırılmış barındırılan akışın anlık görüntüsünü yeniler ve OpenClaw'ın barındırılan verileri, barındırılan bir anlık görüntüyü veya paketle birlikte gelen geri dönüş verilerini kabul edip etmediğini bildirir. Bir çağıranın, yeni bir barındırılan yük sabitlenmiş sağlama toplamıyla eşleşmediği sürece komutun başarısız olmasına ihtiyaç duyduğu durumlarda `--expected-sha256` kullanın.

Pazar yeri `list`; yerel bir pazar yeri yolunu, bir `marketplace.json` yolunu, `owner/repo` gibi bir GitHub kısaltmasını, bir GitHub depo URL'sini veya bir git URL'sini kabul eder. `--json`, çözümlenen kaynak etiketinin yanı sıra ayrıştırılmış pazar yeri manifestini ve plugin girdilerini yazdırır.

Pazar yeri yenilemesi, barındırılan bir OpenClaw pazar yeri akışını yükler ve
doğrulanmış yanıtı yerel barındırılan akış anlık görüntüsü olarak kalıcı hâle getirir. Seçenek verilmediğinde
yapılandırılmış varsayılan akış profilini kullanır. Belirli bir
yapılandırılmış profili yenilemek için `--feed-profile <name>`, açık bir barındırılan
akış URL'sini yenilemek için `--feed-url <url>`, eşleşen bir yük sağlama toplamını
(`sha256:<hex>` veya yalnızca 64 karakterli onaltılık özet) zorunlu kılmak için `--expected-sha256 <sha256>` ve
makinece okunabilir çıktı için `--json` kullanın. Açık barındırılan akış URL'leri
kimlik bilgileri, sorgu dizeleri veya parçalar içermemelidir. Sabitlenmemiş yenilemeler,
komutu başarısız kılmadan barındırılan bir anlık görüntü veya paketle birlikte gelen bir geri dönüş sonucu
bildirebilir. Sabitlenmiş yenilemeler, yeni bir barındırılan yükü kabul etmedikçe başarısız olur;
başarılı barındırılan yenilemeler ise OpenClaw doğrulanmış anlık görüntüyü kalıcı hâle getiremezse
başarısız olur.

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [CLI başvurusu](/tr/cli)
- [ClawHub](/clawhub)
