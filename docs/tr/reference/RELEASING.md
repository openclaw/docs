---
read_when:
    - Herkese açık sürüm kanalı tanımları aranıyor
    - Sürüm doğrulaması veya paket kabulü çalıştırma
    - Sürüm adlandırması ve yayın temposu aranıyor
summary: Sürüm hatları, operatör kontrol listesi, doğrulama kutuları, sürüm adlandırması ve periyot
title: Yayın politikası
x-i18n:
    generated_at: "2026-07-04T18:19:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00772c1a2ad62eb7138b1eda581786390835add0a96996114cac2fd77edb367
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw şu anda kullanıcıya dönük üç güncelleme kanalını sunar:

- stable: ayrı CLI/kanal kilometre taşı tamamlanana kadar hâlâ npm `latest`
  üzerinden çözümlenen mevcut yükseltilmiş yayın kanalı
- beta: npm `beta` olarak yayımlanan ön yayın etiketleri
- dev: `main` dalının hareketli başı

Ayrıca, yayın operatörleri tamamlanan önceki ayın çekirdek paketini patch `33`
ile başlayarak npm `extended-stable` olarak yayımlayabilir. Geçerli ayın normal
final hattı npm `latest` üzerinde devam eder; bu operatör tarafındaki yayın ayrımı
tek başına CLI güncelleme kanalı çözümlemesini değiştirmez.

## Sürüm adlandırma

- Aylık npm extended-stable yayın sürümü: `YYYY.M.PATCH`, `PATCH >= 33` ile
  - Git etiketi: `vYYYY.M.PATCH`
- Günlük/normal final yayın sürümü: `YYYY.M.PATCH`, `PATCH < 33` ile
  - Git etiketi: `vYYYY.M.PATCH`
- Normal geri dönüş düzeltme yayın sürümü: `YYYY.M.PATCH-N`
  - Git etiketi: `vYYYY.M.PATCH-N`
- Beta ön yayın sürümü: `YYYY.M.PATCH-beta.N`
  - Git etiketi: `vYYYY.M.PATCH-beta.N`
- Ay veya patch değerini başına sıfır ekleyerek yazmayın
- Haziran 2026 yayın süreci güncellemesiyle başlayarak, üçüncü bileşen artık bir
  takvim günü değil, sıralı aylık yayın treni numarasıdır. Stable ve beta
  yayınlar geçerli treni belirler; yalnızca alpha etiketleri beta/stable patch
  numarasını tüketmez veya ilerletmez. Güncelleme öncesi etiketler ve npm
  sürümleri mevcut adlarını korur ve geçerli kalır; yayın otomasyonu bunları yıl,
  ay, patch, kanal ve ön yayın veya düzeltme numarasına göre karşılaştırmaya
  devam eder.
- Alpha/gecelik derlemeler bir sonraki yayımlanmamış patch trenini kullanır ve
  tekrarlanan derlemeler için yalnızca `alpha.N` değerini artırır. Bu patch bir
  beta aldıktan sonra yeni alpha derlemeler sonraki patch'e geçer. Bir beta veya
  stable treni seçerken daha yüksek patch numaralarına sahip eski yalnızca alpha
  etiketlerini yok sayın.
- npm sürümleri değiştirilemez. Bir beta etiketi zaten yayımlandıysa onu
  silmeyin, yeniden yayımlamayın veya tekrar kullanmayın; bunun yerine sonraki
  beta numarasını ya da sonraki aylık patch'i kesin. Geçiş sırasında
  `2026.6.5-beta.1` zaten yayımlandığı için, Haziran 2026 yayın trenleri patch
  `5` veya daha yüksek bir değer kullanmalıdır. Yeni Haziran 2026 stable veya
  beta trenlerini `2026.6.2`, `2026.6.3` ya da `2026.6.4` olarak yayımlamayın.
- Normal final `2026.6.5` sonrasında, daha yüksek patch numaralarına sahip
  otomatik yalnızca alpha etiketleri zaten mevcut olsa bile, bir sonraki yeni
  beta treni `2026.6.6-beta.1` olur.
- `latest` geçerli normal/günlük npm hattını izlemeye devam eder
- `beta` geçerli beta kurulum hedefi anlamına gelir
- `extended-stable`, patch `33` ile başlayan desteklenen önceki ay npm paketi
  anlamına gelir; patch `34` ve sonrası bu aylık hattaki bakım yayınlarıdır
- Ayrılmış aylık extended-stable yolu yalnızca çekirdek npm paketini yayımlar.
  Plugin'leri, macOS veya Windows yapıtlarını, bir GitHub Release'i, özel depo
  dist-tag'lerini, Docker imajlarını, mobil yapıtları veya web sitesi
  indirmelerini yayımlamaz.

## Yayın temposu

- Yayınlar önce beta olarak ilerler
- Stable yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar normalde yayınları geçerli `main` dalından oluşturulan bir
  `release/YYYY.M.PATCH` dalından keser; böylece yayın doğrulaması ve düzeltmeler
  `main` üzerindeki yeni geliştirmeyi engellemez
- Bir beta etiketi gönderilmiş veya yayımlanmışsa ve düzeltme gerekiyorsa,
  bakımcılar eski beta etiketini silmek ya da yeniden oluşturmak yerine sonraki
  `-beta.N` etiketini keser
- Ayrıntılı yayın prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca bakımcılara özeldir

## Aylık yalnızca npm extended-stable yayını

Bu, aşağıdaki normal yayın prosedürüne ayrılmış bir istisnadır. Tamamlanmış bir
`YYYY.M` ayı için `extended-stable/YYYY.M.33` oluşturun; `vYYYY.M.33` etiketini ve
sonraki bakım patch'lerini aynı daldan yayımlayın. Yayın etiketi, dal ucu,
checkout, paket sürümü, npm ön kontrolü ve Full Release Validation çalışmasının
tamamı aynı commit'i tanımlamalıdır. Korumalı `main`, patch `33` değerinin altında
kesin olarak daha sonraki bir takvim ayının final sürümünü zaten içermelidir;
bakım patch'leri `main` bir aydan fazla ilerledikten sonra da uygun kalır.

npm ön kontrolünü ve Full Release Validation çalışmasını tam extended-stable
dalından çalıştırın, ardından iki çalışma kimliğini de kaydedin:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

`release_profile=stable` mevcut doğrulama derinliği profilidir; npm
`extended-stable` dist-tag'inden ayrıdır ve kasıtlı olarak değiştirilmemiştir.

Her iki çalışma da başarılı olduktan ve npm yayın ortamı hazır olduğunda, tam ön
kontrol tarball'ını yükseltin. Patch `P`, `33` veya daha büyük olmalıdır:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

Aylık `.33` veya korumalı-`main` ay politikasını kasıtlı olarak karşılayamayan
bir fork ya da üretim dışı prova için, hem npm ön kontrolüne hem de yayımlama
dispatch'lerine `-f bypass_extended_stable_guard=true` ekleyin. Varsayılan değer
`false` olur. Bypass yalnızca `npm_dist_tag=extended-stable` ile kabul edilir ve
workflow özetine kaydedilir. Kanonik `extended-stable/YYYY.M.33` workflow ref'ini,
dal ucu/etiket/checkout eşitliğini, final etiketi söz dizimini, paket/etiket
sürüm eşitliğini, başvurulan çalışma ve manifest kimliğini, tarball kökenini,
ortam onayını, registry okuma doğrulamasını veya seçici onarım kanıtını bypass
etmez.

Yayımlama workflow'u başvurulan çalışma kimliklerini, hazırlanmış tarball
özetini ve her iki npm registry seçicisini doğrular. Workflow başarılı olduktan
sonra sonucu bağımsız olarak doğrulayın:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Her iki komut da `YYYY.M.P` döndürmelidir. Yayımlama başarılı olur ancak seçici
okuma doğrulaması başarısız olursa, değiştirilemez paket sürümünü yeniden
yayımlamayın. Başarısız workflow'un her zaman çalışan özetinde yazdırılan tek
`npm dist-tag add openclaw@YYYY.M.P extended-stable` onarım komutunu kullanın,
ardından iki bağımsız okuma doğrulamasını da tekrarlayın. Önceki seçiciye geri
alma, okuma doğrulaması onarım yolu değil, ayrı bir operatör kararıdır.

Aşağıdaki normal kontrol listesi beta, `latest`, GitHub Release, Plugin'ler,
macOS, Windows ve diğer platform yayınlarından sorumlu olmaya devam eder. Bu
yalnızca npm extended-stable yolu için bu adımları çalıştırmayın.

## Normal yayın operatörü kontrol listesi

Bu kontrol listesi yayın akışının herkese açık biçimidir. Özel kimlik bilgileri,
imzalama, noter tasdiki, dist-tag kurtarma ve acil geri alma ayrıntıları
yalnızca bakımcılara özel yayın çalışma kitabında kalır.

1. Geçerli `main` dalından başlayın: en son değişiklikleri çekin, hedef commit'in push edildiğini doğrulayın
   ve geçerli `main` CI durumunun buradan dal açmak için yeterince yeşil olduğunu doğrulayın.
2. En üst `CHANGELOG.md` bölümünü, son erişilebilir sürüm etiketinden bu yana birleştirilmiş PR'lardan ve tüm doğrudan
   commit'lerden oluşturun. Girdileri kullanıcıya dönük tutun,
   çakışan PR/doğrudan-commit girdilerini tekilleştirin, yeniden yazımı commit'leyin, push edin
   ve dal açmadan önce bir kez daha rebase/pull yapın.
3. Sürüm uyumluluk kayıtlarını
   `src/plugins/compat/registry.ts` ve
   `src/commands/doctor/shared/deprecation-compat.ts` içinde gözden geçirin. Süresi dolmuş
   uyumluluğu yalnızca yükseltme yolu kapsanmaya devam ediyorsa kaldırın veya neden
   bilinçli olarak taşındığını kaydedin.
4. Geçerli `main` dalından `release/YYYY.M.PATCH` oluşturun; normal sürüm işini
   doğrudan `main` üzerinde yapmayın.
5. Amaçlanan etiket için gereken her sürüm konumunu artırın, ardından
   `pnpm release:prep` çalıştırın. Bu, Plugin sürümlerini, Plugin envanterini, config
   şemasını, paketli kanal config meta verilerini, config dokümanları taban çizgisini, Plugin SDK
   dışa aktarımlarını ve Plugin SDK API taban çizgisini doğru sırayla yeniler. Etiketlemeden önce oluşan
   tüm üretilmiş drift'i commit'leyin. Ardından yerel deterministik ön denetimi çalıştırın:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` ve `pnpm release:check`.
6. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın. Bir etiket var olmadan önce,
   yalnızca doğrulama amaçlı ön denetim için tam 40 karakterlik sürüm dalı SHA'sına izin verilir.
   Ön denetim, tam olarak checkout edilmiş bağımlılık grafiği için bağımlılık sürüm kanıtı oluşturur
   ve bunu npm ön denetim artifact'inde saklar. Başarılı `preflight_run_id` değerini kaydedin.
7. Sürüm dalı, etiket veya tam commit SHA'sı için `Full Release Validation` ile
   tüm sürüm öncesi testleri başlatın. Bu, dört büyük sürüm test kutusu için tek manuel giriş noktasıdır:
   Vitest, Docker, QA Lab ve Package.
8. Doğrulama başarısız olursa, sürüm dalında düzeltin ve düzeltmeyi kanıtlayan en küçük başarısız
   dosyayı, lane'i, workflow job'ını, paket profilini, provider'ı veya model izin listesini yeniden çalıştırın.
   Tam şemsiyeyi yalnızca değişen yüzey önceki kanıtları bayatlattığında yeniden çalıştırın.
9. Etiketlenmiş beta adayı için, eşleşen
   `release/YYYY.M.PATCH` dalından
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` çalıştırın. Stable için, gerekli Windows kaynak
   sürümünü de geçirin:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   Yardımcı, yerel üretilmiş-sürüm kontrollerini çalıştırır, tam sürüm doğrulama ve npm ön denetim kanıtını
   dispatch eder veya doğrular, tam hazırlanmış tarball'a karşı Parallels
   fresh/update kanıtını ve Telegram paket kanıtını çalıştırır, Plugin npm ve ClawHub planlarını kaydeder
   ve yalnızca kanıt paketi yeşil olduktan sonra tam
   `OpenClaw Release Publish` komutunu yazdırır.
   `OpenClaw Release Publish`, seçili veya yayımlanabilir tüm Plugin
   paketlerini npm'e ve aynı seti paralel olarak ClawHub'a dispatch eder, ardından
   Plugin npm publish başarılı olur olmaz hazırlanmış OpenClaw npm ön denetim artifact'ini eşleşen dist-tag ile terfi ettirir.
   OpenClaw npm publish alt işi başarılı olduktan sonra, tam eşleşen
   `CHANGELOG.md` bölümünden eşleşen GitHub release/prerelease sayfasını oluşturur veya günceller.
   npm `latest` olarak yayımlanan stable sürümler GitHub latest release olur; npm `beta` üzerinde tutulan
   stable bakım sürümleri GitHub `latest=false` ile oluşturulur. Workflow ayrıca, sürüm sonrası olay müdahalesi için
   ön denetim bağımlılık kanıtını, tam doğrulama manifest'ini ve publish sonrası registry doğrulama kanıtını
   GitHub release'e yükler. Publish workflow'u alt run ID'lerini hemen yazdırır, workflow token'ının onaylamasına izin verilen
   release environment gate'lerini otomatik onaylar, başarısız alt job'ları log sonlarıyla özetler,
   OpenClaw npm publish başarılı olur olmaz GitHub release'i ve bağımlılık kanıtını kapatır,
   OpenClaw npm yayımlanıyorsa ClawHub'ı bekler, ardından `pnpm release:verify-beta` çalıştırır ve
   GitHub release, npm paketi, seçili Plugin npm paketleri, seçili ClawHub paketleri, alt workflow run ID'leri
   ve isteğe bağlı NPM Telegram run ID'si için publish sonrası kanıt yükler. ClawHub yolu, geçici CLI
   bağımlılık kurulum hatalarını yeniden dener, bir preview hücresi dalgalansa bile preview'dan geçen Plugin'leri yayımlar
   ve kısmi publish'lerin görünür ve yeniden denenebilir kalması için beklenen her
   Plugin sürümüne yönelik registry doğrulamasıyla biter. Ardından yayımlanmış
   `openclaw@YYYY.M.PATCH-beta.N` veya
   `openclaw@beta` paketine karşı publish sonrası
   paket kabulünü çalıştırın. Push edilmiş veya yayımlanmış bir prerelease düzeltme gerektirirse,
   sonraki eşleşen prerelease numarasını kesin; eski
   prerelease'i silmeyin veya yeniden yazmayın.
10. Stable için, yalnızca incelenmiş beta veya release candidate gerekli
    doğrulama kanıtına sahip olduktan sonra devam edin. Stable npm publish de
    `OpenClaw Release Publish` üzerinden geçer ve başarılı ön denetim artifact'ini
    `preflight_run_id` aracılığıyla yeniden kullanır; stable macOS sürüm hazırlığı ayrıca
    paketlenmiş `.zip`, `.dmg`, `.dSYM.zip` ve `main` üzerinde güncellenmiş `appcast.xml` gerektirir.
    macOS publish workflow'u, release asset'leri doğrulandıktan sonra imzalı appcast'i otomatik olarak public `main` dalına yayımlar;
    branch protection doğrudan push'u engellerse, bir appcast PR'ı açar veya günceller. Stable Windows Hub
    hazırlığı, OpenClaw GitHub release üzerinde imzalı `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe` ve
    `OpenClawCompanion-SHA256SUMS.txt` asset'lerini gerektirir.
    Tam imzalı `openclaw/openclaw-windows-node` release etiketini
    `windows_node_tag` olarak ve candidate-onaylı installer digest map'ini
    `windows_node_installer_digests` olarak geçirin; `OpenClaw Release Publish`,
    release taslağını tutar, `Windows Node Release` dispatch eder ve yayımlamadan önce üç
    asset'in tamamını doğrular.
11. Publish sonrasında, npm publish sonrası doğrulayıcısını, publish sonrası kanal kanıtına ihtiyaç duyduğunuzda isteğe bağlı bağımsız
    yayımlanmış-npm Telegram E2E'yi, gerektiğinde dist-tag terfisini çalıştırın,
    üretilmiş GitHub release sayfasını doğrulayın, release duyurusu adımlarını çalıştırın,
    ardından stable release'i bitmiş saymadan önce [Stable main
    closeout](#stable-main-closeout) tamamlayın.

## Stable main closeout

Stable yayımlama, `main` gerçek gönderilmiş
sürüm durumunu taşımadan tamamlanmış değildir.

1. Taze en son `main` dalından başlayın. `release/YYYY.M.PATCH` dalını buna karşı denetleyin ve
   `main` üzerinde bulunmayan gerçek düzeltmeleri forward-port edin. Release'e özel uyumluluk,
   test veya doğrulama adapter'larını daha yeni `main` dalına körlemesine merge etmeyin.
2. `main` dalını spekülatif bir sonraki trene değil, gönderilmiş stable sürüme ayarlayın. Root sürüm değişikliğinden sonra
   `pnpm release:prep`, ardından
   `pnpm deps:shrinkwrap:generate` çalıştırın.
3. `main` üzerindeki `CHANGELOG.md` dosyasının `## YYYY.M.PATCH` bölümünü
   etiketlenmiş release dalıyla tam olarak eşleştirin. Mac
   release bir tane yayımladıysa stable `appcast.xml` güncellemesini dahil edin.
4. Operatör bu release trenini açıkça başlatana kadar `main` dalına
   `YYYY.M.PATCH+1`, beta sürüm veya boş bir gelecek changelog
   bölümü eklemeyin.
5. `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` ve
   `OPENCLAW_TESTBOX=1 pnpm check:changed` çalıştırın. Push edin, ardından stable release'i tamamlandı saymadan önce
   `origin/main` dalının gönderilmiş sürümü ve changelog'u içerdiğini doğrulayın.
6. Her private rollback drill sonrasında repository variable'ları `RELEASE_ROLLBACK_DRILL_ID` ve
   `RELEASE_ROLLBACK_DRILL_DATE` güncel tutun.
   `OpenClaw Stable Main Closeout`, stable yayımlamadan sonra gönderilmiş
   sürümü, changelog'u ve appcast'i taşıyan `main` push'undan başlar. Gönderilmiş etiketi Full Release
   Validation ve Publish run'larına bağlamak için değiştirilemez publish sonrası kanıtı okur,
   ardından stable main durumunu, release'i, zorunlu stable soak'ı ve engelleyici performans kanıtını doğrular.
   GitHub release'e değiştirilemez bir closeout manifest'i ve checksum ekler. Otomatik
   push tetikleyicisi, değiştirilemez publish sonrası kanıttan önceki eski release'leri atlar;
   bu atlamayı asla tamamlanmış closeout olarak ele almaz. Tam bir
   closeout hem asset'leri hem de eşleşen checksum'ı gerektirir. Kısmi bir manifest,
   aynı byte'ları yeniden oluşturmak için kaydedilmiş `main` SHA'sını ve rollback drill'i tekrar oynatır,
   ardından eksik checksum'ı ekler; geçersiz bir çift veya manifest olmadan checksum
   engelleyici kalır. Rollback drill repository variable'ları olmayan push tetiklemeli bir run,
   closeout'u tamamlamadan atlar; eksik veya 90 günden eski drill kaydı da manuel kanıt destekli
   closeout'u engellemeye devam eder. Private recovery komutları yalnızca maintainer runbook'unda kalır.
   Manuel dispatch'i yalnızca kanıt destekli stable closeout'u onarmak veya tekrar oynatmak için kullanın.
   Eski fallback correction etiketi, yalnızca correction etiketi base stable etiketiyle aynı source commit'e çözümlendiğinde
   base-package kanıtını yeniden kullanabilir.
   Farklı source'a sahip correction kendi paket kanıtını yayımlamalı ve doğrulamalıdır.

## Release preflight

- Test TypeScript'inin daha hızlı yerel `pnpm check` kapısı dışında da kapsandığından emin olmak için sürüm ön denetiminden önce `pnpm check:test-types` çalıştırın
- Daha geniş import döngüsü ve mimari sınır denetimlerinin daha hızlı yerel kapı dışında yeşil olduğundan emin olmak için sürüm ön denetiminden önce `pnpm check:architecture` çalıştırın
- Beklenen `dist/*` sürüm yapıtlarının ve Control UI paketinin paket doğrulama adımı için mevcut olması amacıyla `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın
- Kök sürüm artırmasından sonra ve etiketlemeden önce `pnpm release:prep` çalıştırın. Sürüm/config/API değişikliğinden sonra sıkça kayma yapan tüm belirleyici sürüm üreticilerini çalıştırır: plugin sürümleri, plugin envanteri, temel config şeması, paketli kanal config meta verileri, config dokümanları temeli, plugin SDK dışa aktarımları ve plugin SDK API temeli. `pnpm release:check` bu korumaları denetim modunda yeniden çalıştırır ve paket sürüm denetimlerini çalıştırmadan önce bulduğu tüm üretilmiş kayma hatalarını tek geçişte raporlar.
- Plugin sürüm eşitlemesi, resmi plugin paket sürümlerini ve mevcut `openclaw.compat.pluginApi` tabanlarını varsayılan olarak OpenClaw sürümüne günceller. Bu alanı yalnızca paket sürümünün kopyası olarak değil, plugin SDK/runtime API tabanı olarak ele alın: daha eski OpenClaw host'larıyla uyumlu kalması özellikle amaçlanan yalnızca plugin sürümleri için tabanı desteklenen en eski host API'sinde tutun ve bu seçimi plugin sürüm kanıtında belgeleyin.
- Tüm ön sürüm test kutularını tek giriş noktasından başlatmak için sürüm onayından önce manuel `Full Release Validation` iş akışını çalıştırın. Bir dal, etiket veya tam commit SHA kabul eder, manuel `CI` tetikler ve kurulum duman testi, paket kabulü, çapraz işletim sistemi paket denetimleri, QA Lab eşliği, Matrix ve Telegram hatları için `OpenClaw Release Checks` tetikler. Kararlı ve tam çalıştırmalar her zaman kapsamlı canlı/E2E ve Docker sürüm yolu bekletmesini içerir; `run_release_soak=true` açık bir beta bekletmesi için korunur. Package Acceptance, aday doğrulaması sırasında kanonik paket Telegram E2E'sini sağlar ve ikinci bir eşzamanlı canlı yoklayıcıyı önler.
  Beta yayımlandıktan sonra, gönderilmiş npm paketini sürüm denetimleri, Package Acceptance ve paket Telegram E2E genelinde sürüm tarball'ını yeniden oluşturmadan yeniden kullanmak için `release_package_spec` sağlayın. Telegram'ın sürüm doğrulamasının geri kalanından farklı bir yayımlanmış paket kullanması gerektiğinde yalnızca `npm_telegram_package_spec` sağlayın. Package Acceptance'ın sürüm paket belirtiminden farklı bir yayımlanmış paket kullanması gerektiğinde `package_acceptance_package_spec` sağlayın. Sürüm kanıtı raporunun doğrulamanın Telegram E2E'yi zorlamadan yayımlanmış bir npm paketiyle eşleştiğini kanıtlaması gerektiğinde `evidence_package_spec` sağlayın.
  Örnek:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Sürüm çalışması devam ederken bir paket adayı için yan kanal kanıtı istediğinizde manuel `Package Acceptance` iş akışını çalıştırın. `openclaw@beta`, `openclaw@latest` veya tam bir sürüm için `source=npm`; geçerli `workflow_ref` test düzeniyle güvenilir bir `package_ref` dalını/etiketini/SHA'sını paketlemek için `source=ref`; gerekli SHA-256 ve katı genel URL politikası olan herkese açık HTTPS tarball'ı için `source=url`; gerekli `trusted_source_id` ve SHA-256 kullanan adlandırılmış güvenilir kaynak politikası için `source=trusted-url`; veya başka bir GitHub Actions çalıştırması tarafından yüklenmiş tarball için `source=artifact` kullanın. İş akışı adayı `package-under-test` olarak çözer, Docker E2E sürüm zamanlayıcısını bu tarball'a karşı yeniden kullanır ve aynı tarball'a karşı `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` ile Telegram QA çalıştırabilir. Seçilen Docker hatları `published-upgrade-survivor` içerdiğinde, paket yapıtı adaydır ve `published_upgrade_survivor_baseline` yayımlanmış temeli seçer. `update-restart-auth`, aday paketini hem kurulu CLI hem de package-under-test olarak kullanır, böylece aday güncelleme komutunun yönetilen yeniden başlatma yolunu çalıştırır.
  Örnek: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Yaygın profiller:
  - `smoke`: kurulum/kanal/agent, gateway ağı ve config yeniden yükleme hatları
  - `package`: OpenWebUI veya canlı ClawHub olmadan yapıt yerel paket/güncelleme/yeniden başlatma/plugin hatları
  - `product`: paket profiline ek olarak MCP kanalları, cron/subagent temizliği, OpenAI web araması ve OpenWebUI
  - `full`: OpenWebUI ile Docker sürüm yolu parçaları
  - `custom`: odaklı yeniden çalıştırma için tam `docker_lanes` seçimi
- Sürüm adayı için yalnızca belirleyici normal CI kapsamına ihtiyacınız olduğunda manuel `CI` iş akışını doğrudan çalıştırın. Manuel CI tetiklemeleri değişiklik kapsamlandırmasını atlar ve Linux Node parçalarını, paketli-plugin parçalarını, plugin ve kanal sözleşmesi parçalarını, Node 22 uyumluluğunu, `check-*`, `check-additional-*`, derlenmiş yapıt duman denetimlerini, doküman denetimlerini, Python skills, Windows, macOS ve Control UI i18n hatlarını zorlar. Bağımsız manuel CI çalıştırmaları Android'i yalnızca `include_android=true` ile tetiklendiğinde çalıştırır; `Full Release Validation` bu girdiyi kendi CI çocuğuna iletir.
  Android ile örnek: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Sürüm telemetrisini doğrularken `pnpm qa:otel:smoke` çalıştırın. QA-lab'i yerel bir OTLP/HTTP alıcısı üzerinden çalıştırır ve Opik, Langfuse veya başka bir harici toplayıcı gerektirmeden iz, metrik ve günlük dışa aktarımını, ayrıca sınırlı iz özniteliklerini ve içerik/tanımlayıcı redaksiyonunu doğrular.
- Toplayıcı uyumluluğunu doğrularken `pnpm qa:otel:collector-smoke` çalıştırın. Aynı QA-lab OTLP dışa aktarımını yerel alıcı doğrulamalarından önce gerçek bir OpenTelemetry Collector Docker konteyneri üzerinden yönlendirir.
- Korumalı Prometheus scraping doğrularken `pnpm qa:prometheus:smoke` çalıştırın. QA-lab'i çalıştırır, kimlik doğrulamasız scrape isteklerini reddeder ve sürüm açısından kritik metrik ailelerinin prompt içeriği, ham tanımlayıcılar, auth token'ları ve yerel yollardan arınmış kaldığını doğrular.
- Kaynak checkout OpenTelemetry ve Prometheus duman hatlarını arka arkaya istediğinizde `pnpm qa:observability:smoke` çalıştırın.
- Her etiketli sürümden önce `pnpm release:check` çalıştırın
- `OpenClaw NPM Release` ön denetimi, npm tarball'ını paketlemeden önce bağımlılık sürüm kanıtı üretir. npm advisory zafiyet kapısı sürümü engelleyicidir. Geçişli manifest riski, bağımlılık sahipliği/kurulum yüzeyi ve bağımlılık değişiklik raporları yalnızca sürüm kanıtıdır. Bağımlılık değişiklik raporu, sürüm adayını önceki erişilebilir sürüm etiketiyle karşılaştırır.
- Ön denetim, bağımlılık kanıtını `openclaw-release-dependency-evidence-<tag>` olarak yükler ve ayrıca hazırlanmış npm ön denetim yapıtının içinde `dependency-evidence/` altında gömer. Gerçek yayımlama yolu bu ön denetim yapıtını yeniden kullanır, ardından aynı kanıtı GitHub sürümüne `openclaw-<version>-dependency-evidence.zip` olarak ekler.
- Etiket mevcut olduktan sonra değişiklik yapan yayımlama dizisi için `OpenClaw Release Publish` çalıştırın. Bunu `release/YYYY.M.PATCH` üzerinden tetikleyin (veya main'den erişilebilir bir etiket yayımlarken `main` üzerinden), sürüm etiketini, başarılı OpenClaw npm `preflight_run_id` değerini ve başarılı `full_release_validation_run_id` değerini geçirin ve özellikle odaklı bir onarım çalıştırmıyorsanız varsayılan plugin yayımlama kapsamı olan `all-publishable` değerini koruyun. İş akışı plugin npm yayımlamayı, plugin ClawHub yayımlamayı ve OpenClaw npm yayımlamayı sıraya koyar; böylece çekirdek paket dışsallaştırılmış plugin'lerinden önce yayımlanmaz.
- Kararlı `OpenClaw Release Publish`, eşleşen ön sürüm olmayan `openclaw/openclaw-windows-node` sürümü mevcut olduktan sonra tam bir `windows_node_tag` gerektirir. Ayrıca aday onaylı `windows_node_installer_digests` haritasını gerektirir. Herhangi bir yayımlama çocuğunu tetiklemeden önce, kaynak sürümün yayımlanmış, ön sürüm olmayan, gerekli x64/ARM64 yükleyicilerini içeren ve hâlâ o onaylı haritayla eşleşen durumda olduğunu doğrular. Ardından OpenClaw sürümü hâlâ taslakken `Windows Node Release` tetikler ve sabitlenmiş yükleyici digest haritasını değiştirmeden taşır. Çocuk iş akışı, imzalı Windows Hub yükleyicilerini tam o etiketten indirir, sabitlenmiş digest'lerle eşleştirir, Authenticode imzalarının bir Windows runner üzerinde beklenen OpenClaw Foundation imzalayanını kullandığını doğrular, bir SHA-256 manifesti yazar ve yükleyicileri manifestle birlikte kanonik OpenClaw GitHub sürümüne yükler; ardından terfi ettirilen varlıkları yeniden indirir ve manifest üyeliğini ve hash'leri doğrular. Üst iş akışı yayımlamadan önce geçerli x64, ARM64 ve checksum varlık sözleşmesini doğrular. Doğrudan kurtarma, beklenen sözleşme varlıklarını sabitlenmiş kaynak baytlarıyla değiştirmeden önce beklenmeyen `OpenClawCompanion-*` varlık adlarını reddeder. `Windows Node Release` iş akışını yalnızca kurtarma için manuel tetikleyin ve her zaman tam bir etiket geçirin, asla `latest` geçirmeyin; ayrıca onaylı kaynak sürümden açık `expected_installer_digests` JSON haritasını iletin. Web sitesi indirme bağlantıları geçerli kararlı sürüm için tam OpenClaw sürüm varlığı URL'lerini hedeflemelidir veya `releases/latest/download/...` yalnızca GitHub'ın latest yönlendirmesinin aynı sürüme işaret ettiğini doğruladıktan sonra kullanılmalıdır; yalnızca companion repo sürüm sayfasına bağlantı vermeyin.
- Sürüm denetimleri artık ayrı bir manuel iş akışında çalışır:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`, sürüm onayından önce QA Lab mock eşlik hattını, hızlı canlı Matrix profilini ve Telegram QA hattını da çalıştırır. Canlı hatlar `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI kimlik bilgisi kiralamalarını kullanır. Tam Matrix aktarımı, medya ve E2EE envanterini paralel istediğinizde `matrix_profile=all` ve `matrix_shards=true` ile manuel `QA-Lab - All Lanes` iş akışını çalıştırın.
- Çapraz işletim sistemi kurulum ve yükseltme runtime doğrulaması, yeniden kullanılabilir iş akışı olan `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` dosyasını doğrudan çağıran herkese açık `OpenClaw Release Checks` ve `Full Release Validation` kapsamındadır
- Bu ayrım bilinçlidir: gerçek npm sürüm yolunu kısa, belirleyici ve yapıt odaklı tutarken, daha yavaş canlı denetimler yayımlamayı duraklatmaması veya engellememesi için kendi hattında kalır
- Gizli içeren sürüm denetimleri `Full Release Validation` üzerinden veya `main`/sürüm iş akışı ref'inden tetiklenmelidir; böylece iş akışı mantığı ve gizliler denetimli kalır
- `OpenClaw Release Checks`, çözümlenen commit bir OpenClaw dalından veya sürüm etiketinden erişilebilir olduğu sürece dal, etiket veya tam commit SHA kabul eder
- `OpenClaw NPM Release` yalnızca doğrulama ön denetimi, gönderilmiş bir etiket gerektirmeden geçerli tam 40 karakterli iş akışı dalı commit SHA'sını da kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek yayımlamaya terfi ettirilemez
- SHA modunda iş akışı yalnızca paket meta verisi denetimi için `v<package.json version>` sentezler; gerçek yayımlama yine gerçek bir sürüm etiketi gerektirir
- Her iki iş akışı da gerçek yayımlama ve terfi yolunu GitHub-hosted runner'larda tutarken, değişiklik yapmayan doğrulama yolu daha büyük Blacksmith Linux runner'larını kullanabilir
- Bu iş akışı hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` iş akışı gizlilerini kullanarak
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  çalıştırır
- npm sürüm ön denetimi artık ayrı sürüm denetimleri hattını beklemez
- Bir sürüm adayını yerelde etiketlemeden önce `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` çalıştırın. Yardımcı, GitHub yayımlama iş akışı başlamadan önce yaygın onay engelleyici hataları yakalayan sırayla hızlı sürüm korumalarını, plugin npm/ClawHub sürüm denetimlerini, build'i, UI build'i ve `release:openclaw:npm:check` çalıştırır.
- Onaydan önce `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` çalıştırın (veya eşleşen beta/düzeltme etiketini)
- npm yayımlamasından sonra çalıştırın
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (veya eşleşen beta/düzeltme sürümü) yayımlanan registry
  kurulum yolunu yeni bir geçici prefix içinde doğrulamak için
- Bir beta yayımlamasından sonra, paylaşılan kiralanmış Telegram kimlik bilgisi
  havuzunu kullanarak yayımlanan npm paketine karşı kurulu paket onboarding'ini,
  Telegram kurulumunu ve gerçek Telegram E2E'yi doğrulamak için `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  komutunu çalıştırın. Yerel bakımcı tek seferlik çalıştırmaları Convex değişkenlerini
  atlayabilir ve üç `OPENCLAW_QA_TELEGRAM_*` ortam kimlik bilgisini doğrudan geçebilir.
- Bir bakımcı makinesinden tam yayımlama sonrası beta smoke testini çalıştırmak için `pnpm release:beta-smoke -- --beta betaN` kullanın. Yardımcı, Parallels npm güncelleme/yeni hedef doğrulamasını çalıştırır, `NPM Telegram Beta E2E` işini tetikler, tam workflow çalıştırmasını yoklar, artifact'i indirir ve Telegram raporunu yazdırır.
- Bakımcılar aynı yayımlama sonrası kontrolü GitHub Actions üzerinden manuel
  `NPM Telegram Beta E2E` workflow'u ile çalıştırabilir. Bu özellikle yalnızca manuel olacak şekilde tasarlanmıştır ve
  her merge'de çalışmaz.
- Bakımcı release otomasyonu artık önce ön kontrol, sonra promote kullanır:
  - gerçek npm yayımlaması başarılı bir npm `preflight_run_id` değerinden geçmelidir
  - gerçek npm yayımlaması, başarılı ön kontrol çalıştırmasıyla aynı `main` veya
    `release/YYYY.M.PATCH` branch'inden tetiklenmelidir
  - stable npm release'leri varsayılan olarak `beta` kullanır
  - stable npm yayımlaması workflow girdisiyle açıkça `latest` hedefleyebilir
  - token tabanlı npm dist-tag mutasyonu artık
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` içinde bulunur çünkü
    kaynak repo OIDC-only yayımlamayı korurken `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirir
  - herkese açık `macOS Release` yalnızca doğrulama içindir; bir tag yalnızca bir
    release branch'inde bulunuyorsa ancak workflow `main` üzerinden tetikleniyorsa
    `public_release_branch=release/YYYY.M.PATCH` ayarlayın
  - gerçek macOS yayımlaması başarılı macOS `preflight_run_id` ve
    `validate_run_id` değerlerinden geçmelidir
  - gerçek yayımlama yolları, artifact'leri yeniden derlemek yerine hazırlanmış
    artifact'leri promote eder
- `YYYY.M.PATCH-N` gibi stable düzeltme release'leri için yayımlama sonrası doğrulayıcı,
  `YYYY.M.PATCH` sürümünden `YYYY.M.PATCH-N` sürümüne aynı geçici prefix yükseltme yolunu da
  kontrol eder; böylece release düzeltmeleri eski global kurulumları sessizce
  temel stable payload üzerinde bırakamaz
- npm release ön kontrolü, tarball hem `dist/control-ui/index.html` hem de boş olmayan
  `dist/control-ui/assets/` payload'u içermedikçe güvenli biçimde başarısız olur;
  böylece yeniden boş bir tarayıcı dashboard'u göndermeyiz
- Yayımlama sonrası doğrulama, yayımlanan Plugin giriş noktalarının ve
  paket üst verilerinin kurulu registry düzeninde mevcut olduğunu da kontrol eder. Eksik Plugin runtime payload'ları
  gönderen bir release, postpublish doğrulayıcıda başarısız olur ve
  `latest` konumuna promote edilemez.
- `pnpm test:install:smoke`, aday güncelleme tarball'ında npm pack `unpackedSize` bütçesini de zorunlu kılar;
  böylece yükleyici e2e, release yayımlama yolundan önce yanlışlıkla oluşan paket şişmesini yakalar
- Release çalışması CI planlamasına, uzantı zamanlama manifestlerine veya
  uzantı test matrislerine dokunduysa, onaydan önce
  `.github/workflows/plugin-prerelease.yml` içindeki planner-owned
  `plugin-prerelease-extension-shard` matris çıktılarını yeniden oluşturup gözden geçirin; böylece release notları
  eski bir CI düzenini açıklamaz
- Stable macOS release hazırlığı updater yüzeylerini de içerir:
  - GitHub release'i paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` ile sonuçlanmalıdır
  - `main` üzerindeki `appcast.xml`, yayımlamadan sonra yeni stable zip'i göstermelidir; macOS yayımlama workflow'u
    bunu otomatik olarak commit'ler veya doğrudan push engellendiğinde bir appcast
    PR'ı açar
  - paketlenmiş uygulama, debug olmayan bir bundle id, boş olmayan bir Sparkle feed
    URL'si ve o release sürümü için canonical Sparkle build floor değerinde veya üzerinde bir `CFBundleVersion`
    korumalıdır

## Sürüm test kutuları

`Full Release Validation`, operatörlerin tüm sürüm öncesi testleri tek bir
giriş noktasından başlatma yoludur. Hızlı hareket eden bir dalda sabitlenmiş
commit kanıtı için yardımcıyı kullanın; böylece her alt workflow, hedef SHA'ya
sabitlenmiş geçici bir daldan çalışır:

```bash
pnpm ci:full-release --sha <full-sha>
```

Yardımcı `release-ci/<sha>-...` dalını push eder, bu daldan `ref=<sha>` ile
`Full Release Validation` dispatch eder, her alt workflow `headSha` değerinin
hedefle eşleştiğini doğrular ve ardından geçici dalı siler. Bu, yanlışlıkla
daha yeni bir `main` alt çalıştırmasını kanıtlamayı önler.

Sürüm dalı veya etiket doğrulaması için güvenilir `main` workflow ref'inden
çalıştırın ve sürüm dalını ya da etiketini `ref` olarak geçin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

Workflow hedef ref'i çözer, `target_ref=<release-ref>` ile manuel `CI` dispatch
eder ve ardından `OpenClaw Release Checks` dispatch eder.
`OpenClaw Release Checks`; kurulum smoke, çapraz işletim sistemi sürüm
kontrolleri, soak etkin olduğunda live/E2E Docker sürüm yolu kapsamı, kanonik
Telegram paketi E2E ile Package Acceptance, QA Lab eşitliği, canlı Matrix ve
canlı Telegram için fan-out yapar. Odaklı bir yeniden çalıştırma ayrı `Plugin
Prerelease` altını bilinçli olarak atlamadıysa, full/all çalıştırması yalnızca
`Full Release Validation` özetinde `normal_ci`, `plugin_prerelease` ve
`release_checks` başarılı göründüğünde kabul edilebilir. Bağımsız `npm-telegram`
altını yalnızca `release_package_spec` veya `npm_telegram_package_spec` ile
odaklı yayımlanmış paket yeniden çalıştırması için kullanın. Son doğrulayıcı
özeti, her alt çalıştırma için en yavaş iş tablolarını içerir; böylece sürüm
yöneticisi log indirmeden mevcut kritik yolu görebilir.
Tam aşama matrisi, kesin workflow iş adları, stable ve full profil farkları,
artifact'ler ve odaklı yeniden çalıştırma tanıtıcıları için [Tam sürüm
doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.
Alt workflow'lar, hedef `ref` eski bir sürüm dalını veya etiketini gösterse
bile, `Full Release Validation` çalıştıran güvenilir ref'ten, normalde
`--ref main` üzerinden dispatch edilir. Ayrı bir Full Release Validation
workflow-ref girdisi yoktur; güvenilir harness'ı workflow çalıştırma ref'ini
seçerek seçin. Hareket eden `main` üzerinde kesin commit kanıtı için
`--ref main -f ref=<sha>` kullanmayın; ham commit SHA'ları workflow dispatch
ref'i olamaz, bu nedenle sabitlenmiş geçici dalı oluşturmak için
`pnpm ci:full-release --sha <sha>` kullanın.

Canlı/provider genişliğini seçmek için `release_profile` kullanın:

- `minimum`: en hızlı sürüm açısından kritik OpenAI/core canlı ve Docker yolu
- `stable`: sürüm onayı için minimum artı stable provider/backend kapsamı
- `full`: stable artı geniş danışma provider/medya kapsamı

Stable ve full doğrulama, promosyondan önce her zaman kapsamlı live/E2E, Docker
sürüm yolu ve sınırlandırılmış yayımlanmış yükseltme dayanıklılığı taramasını
çalıştırır. Aynı taramayı bir beta için istemek üzere `run_release_soak=true`
kullanın. Bu tarama, en son dört stable paketi ve sabitlenmiş `2026.4.23` ile
`2026.5.2` temel çizgilerini, ayrıca eski `2026.4.15` kapsamını içerir; yinelenen
temel çizgiler kaldırılır ve her temel çizgi kendi Docker runner işine
shard'lanır.

`OpenClaw Release Checks`, hedef ref'i bir kez `release-package-under-test`
olarak çözmek için güvenilir workflow ref'ini kullanır ve soak çalıştığında bu
artifact'i çapraz işletim sistemi, Package Acceptance ve sürüm yolu Docker
kontrollerinde yeniden kullanır. Bu, paketle yüzleşen tüm kutuların aynı
byte'lar üzerinde kalmasını sağlar ve tekrarlanan paket build'lerini önler.
Bir beta npm üzerinde zaten yayımlandıktan sonra
`release_package_spec=openclaw@YYYY.M.PATCH-beta.N` ayarlayın; böylece sürüm
kontrolleri yayımlanan paketi bir kez indirir, build kaynak SHA'sını
`dist/build-info.json` içinden çıkarır ve bu artifact'i çapraz işletim sistemi,
Package Acceptance, sürüm yolu Docker ve paket Telegram hatlarında yeniden
kullanır.
Çapraz işletim sistemi OpenAI kurulum smoke testi, repo/org değişkeni
ayarlandığında `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır; aksi halde
`openai/gpt-5.4` kullanır, çünkü bu hat en yavaş varsayılan modeli benchmark
etmek yerine paket kurulumunu, onboarding'i, gateway başlangıcını ve bir canlı
agent turunu kanıtlar. Daha geniş canlı provider matrisi model özelindeki
kapsamın yeri olmaya devam eder.

Sürüm aşamasına göre şu varyantları kullanın:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Odaklı bir düzeltmeden sonraki ilk yeniden çalıştırma olarak full umbrella'yı
kullanmayın. Bir kutu başarısız olursa sonraki kanıt için başarısız alt
workflow'u, işi, Docker hattını, paket profilini, model provider'ını veya QA
hattını kullanın. Full umbrella'yı yalnızca düzeltme paylaşılan sürüm
orkestrasyonunu değiştirdiğinde veya önceki tüm kutu kanıtını eskittiğinde
yeniden çalıştırın. Umbrella'nın son doğrulayıcısı kaydedilmiş alt workflow
çalıştırma kimliklerini yeniden kontrol eder; bu nedenle bir alt workflow
başarıyla yeniden çalıştırıldıktan sonra yalnızca başarısız `Verify full
validation` üst işini yeniden çalıştırın.

Sınırlı kurtarma için umbrella'ya `rerun_group` geçin. `all` gerçek sürüm adayı
çalıştırmasıdır, `ci` yalnızca normal CI altını çalıştırır,
`plugin-prerelease` yalnızca sürüme özel Plugin altını çalıştırır,
`release-checks` her sürüm kutusunu çalıştırır ve daha dar sürüm grupları
`install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`
ve `npm-telegram` şeklindedir. Odaklı `npm-telegram` yeniden çalıştırmaları
`release_package_spec` veya `npm_telegram_package_spec` gerektirir; full/all
çalıştırmaları Package Acceptance içindeki kanonik paket Telegram E2E'yi
kullanır. Odaklı çapraz işletim sistemi yeniden çalıştırmaları
`cross_os_suite_filter=windows/packaged-upgrade` veya başka bir işletim
sistemi/suite filtresi ekleyebilir. QA release-check başarısızlıkları, standart
katmandaki gerekli OpenClaw dinamik tool drift dahil olmak üzere normal sürüm
doğrulamasını engeller. Tideclaw alpha çalıştırmaları, paket güvenliği dışı
release-check hatlarını yine de danışma niteliğinde ele alabilir.
`live_suite_filter` Discord, WhatsApp veya Slack gibi kapılı bir QA canlı
hattını açıkça istediğinde, eşleşen `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`
repo değişkeni etkin olmalıdır; aksi halde girdi yakalama, hattı sessizce
atlamak yerine başarısız olur.

### Vitest

Vitest kutusu manuel `CI` alt workflow'udur. Manuel CI, değişiklik kapsamını
bilinçli olarak bypass eder ve sürüm adayı için normal test grafiğini zorlar:
Linux Node shard'ları, bundled-plugin shard'ları, Plugin ve kanal contract
shard'ları, Node 22 uyumluluğu, `check-*`, `check-additional-*`, build edilmiş
artifact smoke kontrolleri, docs kontrolleri, Python Skills, Windows, macOS ve
Control UI i18n. `Full Release Validation` kutuyu çalıştırdığında Android dahil
edilir çünkü umbrella `include_android=true` geçirir; bağımsız manuel CI,
Android kapsamı için `include_android=true` gerektirir.

Bu kutuyu "kaynak ağacı tam normal test paketinden geçti mi?" sorusunu yanıtlamak
için kullanın. Bu, sürüm yolu ürün doğrulamasıyla aynı şey değildir. Saklanacak
kanıtlar:

- dispatch edilen `CI` çalıştırma URL'sini gösteren `Full Release Validation` özeti
- kesin hedef SHA üzerinde yeşil `CI` çalıştırması
- regresyonları araştırırken CI işlerinden başarısız veya yavaş shard adları
- bir çalıştırma performans analizi gerektirdiğinde
  `.artifacts/vitest-shard-timings.json` gibi Vitest zamanlama artifact'leri

Manuel CI'yi doğrudan yalnızca sürüm deterministik normal CI gerektirdiğinde
ancak Docker, QA Lab, canlı, çapraz işletim sistemi veya paket kutularını
gerektirmediğinde çalıştırın. Android dışı doğrudan CI için ilk komutu kullanın.
Doğrudan sürüm adayı CI Android'i kapsamalıysa `include_android=true` ekleyin:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker kutusu, `openclaw-live-and-e2e-checks-reusable.yml` üzerinden
`OpenClaw Release Checks` içinde ve sürüm modundaki `install-smoke` workflow'unda
yaşar. Sürüm adayını yalnızca kaynak düzeyi testler yerine paketlenmiş Docker
ortamları üzerinden doğrular.

Sürüm Docker kapsamı şunları içerir:

- yavaş Bun global kurulum smoke etkinleştirilmiş tam kurulum smoke
- hedef SHA'ya göre root Dockerfile smoke image hazırlama/yeniden kullanımı;
  QR, root/gateway ve installer/Bun smoke işleri ayrı install-smoke shard'ları
  olarak çalışır
- depo E2E hatları
- sürüm yolu Docker parçaları: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` ve `plugins-runtime-install-h`
- istendiğinde `plugins-runtime-services` parçası içinde OpenWebUI kapsamı
- bölünmüş bundled Plugin install/uninstall hatları:
  `bundled-plugin-install-uninstall-0` ile
  `bundled-plugin-install-uninstall-23` arası
- release checks canlı suite'leri içerdiğinde live/E2E provider suite'leri ve
  Docker canlı model kapsamı

Yeniden çalıştırmadan önce Docker artifact'lerini kullanın. Sürüm yolu
scheduler'ı hat logları, `summary.json`, `failures.json`, phase zamanlamaları,
scheduler plan JSON'u ve yeniden çalıştırma komutlarıyla birlikte
`.artifacts/docker-tests/` yükler. Odaklı kurtarma için tüm sürüm parçalarını
yeniden çalıştırmak yerine yeniden kullanılabilir live/E2E workflow üzerinde
`docker_lanes=<lane[,lane]>` kullanın. Üretilen yeniden çalıştırma komutları,
mevcut olduğunda önceki `package_artifact_run_id` ve hazırlanmış Docker image
girdilerini içerir; böylece başarısız bir hat aynı tarball'ı ve GHCR image'larını
yeniden kullanabilir.

### QA Lab

QA Lab kutusu da `OpenClaw Release Checks` parçasıdır. Bu, Vitest ve Docker
paket mekaniklerinden ayrı agentic davranış ve kanal düzeyi sürüm kapısıdır.

Sürüm QA Lab kapsamı şunları içerir:

- OpenAI aday hattını agentic parity pack kullanarak Opus 4.6 temel çizgisiyle
  karşılaştıran mock parity hattı
- `qa-live-shared` ortamını kullanan hızlı canlı Matrix QA profili
- Convex CI credential lease'lerini kullanan canlı Telegram QA hattı
- sürüm telemetrisinin açık yerel kanıt gerektirdiği durumlarda
  `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke` veya
  `pnpm qa:observability:smoke`

Bu kutuyu "sürüm QA senaryolarında ve canlı kanal akışlarında doğru davranıyor
mu?" sorusunu yanıtlamak için kullanın. Sürümü onaylarken parity, Matrix ve
Telegram hatları için artifact URL'lerini saklayın. Tam Matrix kapsamı, varsayılan
sürüm açısından kritik hat yerine manuel shard'lanmış QA-Lab çalıştırması olarak
erişilebilir kalır.

### Paket

Paket kutusu kurulabilir ürün kapısıdır. `Package Acceptance` ve
`scripts/resolve-openclaw-package-candidate.mjs` resolver'ı tarafından
desteklenir. Resolver, bir adayı Docker E2E tarafından tüketilen
`package-under-test` tarball'ına normalize eder, paket envanterini doğrular,
paket sürümünü ve SHA-256'yı kaydeder ve workflow harness ref'ini paket kaynak
ref'inden ayrı tutar.

Desteklenen aday kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya tam bir OpenClaw sürüm
  versiyonu
- `source=ref`: seçilen `workflow_ref` sınama düzeneğiyle güvenilir bir `package_ref`
  dalını, etiketini veya tam commit SHA'sını paketleyin
- `source=url`: gerekli `package_sha256` ile herkese açık bir HTTPS `.tgz` indirin;
  URL kimlik bilgileri, varsayılan olmayan HTTPS portları, özel/dahili/özel kullanımlı
  ana makine adları veya çözümlenmiş adresler ve güvenli olmayan yönlendirmeler reddedilir
- `source=trusted-url`: `.github/package-trusted-sources.json` içindeki adlandırılmış
  bir politikadan gerekli `package_sha256` ve `trusted_source_id` ile bir HTTPS `.tgz`
  indirin; `source=url` için girdi düzeyinde özel ağ atlaması eklemek yerine bakımcıya ait
  kurumsal aynalar veya özel paket depoları için bunu kullanın
- `source=artifact`: başka bir GitHub Actions çalıştırması tarafından yüklenen bir `.tgz`
  dosyasını yeniden kullanın

`OpenClaw Release Checks`, Package Acceptance'ı `source=artifact`, hazırlanmış sürüm
paketi artifact'ı, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` ile çalıştırır. Package Acceptance; migration, update,
yapılandırılmış kimlik doğrulamalı update restart, canlı ClawHub skill kurulumu, eski Plugin bağımlılığı temizliği, çevrimdışı Plugin
fixture'ları, Plugin update ve Telegram paket QA'sını aynı çözümlenmiş
tarball'a karşı tutar. Engelleyici sürüm kontrolleri varsayılan en son yayımlanmış paket
baseline'ını kullanır; `run_release_soak=true`, `release_profile=stable` veya
`release_profile=full` içeren beta profili, `2026.4.23` ile `latest` arasındaki
npm'de yayımlanmış tüm stable baseline'lara ve bildirilen sorun fixture'larına genişler.
Zaten gönderilmiş bir aday için `source=npm`, yayımdan önce SHA destekli yerel npm tarball'ı
için `source=ref`, bakımcıya ait kurumsal/özel ayna için `source=trusted-url` veya
başka bir GitHub Actions çalıştırması tarafından yüklenen hazırlanmış tarball için
`source=artifact` ile Package Acceptance kullanın. Bu, daha önce Parallels gerektiren
paket/update kapsamının çoğu için GitHub'a yerel alternatiftir. Cross-OS sürüm kontrolleri
OS'ye özgü onboarding, installer ve platform davranışı için hâlâ önemlidir, ancak
paket/update ürün doğrulaması Package Acceptance'ı tercih etmelidir.

Update ve Plugin doğrulaması için kanonik kontrol listesi
[Update'leri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) sayfasıdır. Bir
Plugin install/update, doctor cleanup veya yayımlanmış paket migration değişikliğini hangi
yerel, Docker, Package Acceptance veya sürüm kontrol şeridinin kanıtladığına karar verirken
bunu kullanın. Her stable `2026.4.23+` paketinden kapsamlı yayımlanmış update migration'ı,
Full Release CI'ın parçası değil, ayrı bir manuel `Update Migration` workflow'udur.

Eski package-acceptance toleransı bilinçli olarak zamanla sınırlıdır. `2026.4.25` dahil
paketler, npm'e zaten yayımlanmış metadata boşlukları için compatibility yolunu kullanabilir:
tarball'da eksik özel QA envanter girdileri, eksik `gateway install --wrapper`, tarball'dan
türetilmiş git fixture'ında eksik patch dosyaları, eksik kalıcı `update.channel`, eski Plugin
install-record konumları, eksik marketplace install-record kalıcılığı ve `plugins update`
sırasında config metadata migration'ı. Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş
yerel build metadata damga dosyaları için uyarı verebilir. Daha sonraki paketler modern
paket sözleşmelerini karşılamalıdır; aynı boşluklar sürüm doğrulamasını başarısız kılar.

Sürüm sorusu gerçekten kurulabilir bir paketle ilgili olduğunda daha geniş Package Acceptance
profillerini kullanın:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Yaygın paket profilleri:

- `smoke`: hızlı paket install/channel/agent, gateway network ve config
  reload şeritleri
- `package`: install/update/restart/Plugin paket sözleşmeleri ve canlı ClawHub
  skill install kanıtı; bu, sürüm kontrolü varsayılanıdır
- `product`: `package` artı MCP kanalları, cron/subagent cleanup, OpenAI web
  search ve OpenWebUI
- `full`: OpenWebUI ile Docker release-path parçaları
- `custom`: odaklı yeniden çalıştırmalar için tam `docker_lanes` listesi

Paket adayı Telegram kanıtı için Package Acceptance üzerinde `telegram_mode=mock-openai`
veya `telegram_mode=live-frontier` etkinleştirin. Workflow, çözümlenmiş
`package-under-test` tarball'ını Telegram şeridine geçirir; bağımsız Telegram workflow'u,
yayım sonrası kontroller için hâlâ yayımlanmış bir npm spec kabul eder.

## Düzenli sürüm yayımlama otomasyonu

Beta, `latest`, Plugin, GitHub Release ve platform yayını için
`OpenClaw Release Publish` normal değişiklik yapan giriş noktasıdır. Aylık `.33+`
yalnızca npm extended-stable yolu bu orkestratörü kullanmaz. Düzenli workflow,
trusted-publisher workflow'larını sürümün gerektirdiği sırada orkestre eder:

1. Sürüm etiketini checkout yapın ve commit SHA'sını çözümleyin.
2. Etiketin `main` veya `release/*` üzerinden erişilebilir olduğunu doğrulayın.
3. `pnpm plugins:sync:check` çalıştırın.
4. `publish_scope=all-publishable` ve `ref=<release-sha>` ile `Plugin NPM Release`
   dispatch edin.
5. Aynı scope ve SHA ile `Plugin ClawHub Release` dispatch edin.
6. Kaydedilmiş `full_release_validation_run_id` doğrulandıktan sonra sürüm etiketi,
   npm dist-tag ve kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release`
   dispatch edin.
7. Stable sürümler için GitHub release'i taslak olarak oluşturun veya güncelleyin,
   açık `windows_node_tag` ve aday onaylı `windows_node_installer_digests` ile
   `Windows Node Release` dispatch edin ve taslağı yayımlamadan önce kanonik
   installer/checksum asset'lerini doğrulayın.

Beta yayımlama örneği:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Varsayılan beta dist-tag'e stable yayımlama:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Doğrudan `latest` için stable promotion açıktır:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

Alt düzey `Plugin NPM Release` ve `Plugin ClawHub Release` workflow'larını yalnızca
odaklı repair veya republish çalışmaları için kullanın. `OpenClaw Release Publish`,
`publish_openclaw_npm=true` olduğunda `plugin_publish_scope=selected` değerini reddeder;
böylece core paket, `@openclaw/diffs-language-pack` dahil yayımlanabilir tüm resmi
Plugin'ler olmadan gönderilemez. Seçili bir Plugin repair için
`publish_openclaw_npm=false` değerini `plugin_publish_scope=selected` ve
`plugins=@openclaw/name` ile ayarlayın veya child workflow'u doğrudan dispatch edin.

## NPM workflow girdileri

`OpenClaw NPM Release` şu operatör kontrollü girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya `v2026.4.2-beta.1` gibi gerekli sürüm
  etiketi; `preflight_only=true` olduğunda yalnızca doğrulama preflight'ı için mevcut
  tam 40 karakterlik workflow-branch commit SHA'sı da olabilir
- `preflight_only`: yalnızca doğrulama/build/package için `true`, gerçek publish yolu için
  `false`
- `preflight_run_id`: gerçek publish yolunda gereklidir; böylece workflow başarılı
  preflight çalıştırmasından hazırlanmış tarball'ı yeniden kullanır
- `full_release_validation_run_id`: gerçek aylık extended-stable ve düzenli
  beta olmayan yayın için gereklidir; böylece workflow tam doğrulama çalıştırmasını
  doğrular
- `npm_dist_tag`: publish yolu için npm hedef etiketi; `alpha`, `beta`, `latest`
  veya `extended-stable` kabul eder ve varsayılanı `beta`dir. Son patch `33` ve sonrası
  `extended-stable` kullanmalıdır; varsayılan olarak `extended-stable` daha erken patch'leri
  reddeder ve final olmayan etiketleri her zaman reddeder.
- `bypass_extended_stable_guard`: yalnızca test amaçlı boolean, varsayılan `false`;
  `npm_dist_tag=extended-stable` ile sürüm kimliği, artifact, onay ve readback
  kontrollerini korurken aylık extended-stable uygunluğunu atlar.

`OpenClaw Release Publish` şu operatör kontrollü girdileri kabul eder:

- `tag`: gerekli sürüm etiketi; zaten var olmalıdır
- `preflight_run_id`: başarılı `OpenClaw NPM Release` preflight run id'si;
  `publish_openclaw_npm=true` olduğunda gereklidir
- `full_release_validation_run_id`: başarılı `Full Release Validation` run
  id'si; `publish_openclaw_npm=true` olduğunda gereklidir
- `windows_node_tag`: tam, prerelease olmayan `openclaw/openclaw-windows-node`
  sürüm etiketi; stable OpenClaw publish için gereklidir
- `windows_node_installer_digests`: mevcut Windows installer adlarının sabitlenmiş
  `sha256:` digest'lerine aday onaylı kompakt JSON haritası; stable OpenClaw publish
  için gereklidir
- `npm_dist_tag`: OpenClaw paketi için npm hedef etiketi
- `plugin_publish_scope`: varsayılanı `all-publishable`; yalnızca
  `publish_openclaw_npm=false` ile odaklı yalnızca Plugin repair çalışması için
  `selected` kullanın
- `plugins`: `plugin_publish_scope=selected` olduğunda virgülle ayrılmış
  `@openclaw/*` paket adları
- `publish_openclaw_npm`: varsayılanı `true`; yalnızca workflow'u yalnızca Plugin
  repair orkestratörü olarak kullanırken `false` ayarlayın
- `wait_for_clawhub`: varsayılanı `false`; böylece npm kullanılabilirliği ClawHub
  sidecar tarafından engellenmez; yalnızca workflow tamamlanmasının ClawHub tamamlanmasını
  da içermesi gerektiğinde `true` ayarlayın

`OpenClaw Release Checks` şu operatör kontrollü girdileri kabul eder:

- `ref`: doğrulanacak dal, etiket veya tam commit SHA. Secret içeren kontroller,
  çözümlenen commit'in bir OpenClaw dalından veya sürüm etiketinden erişilebilir olmasını
  gerektirir.
- `run_release_soak`: beta sürüm kontrolleri için kapsamlı live/E2E, Docker release-path
  ve all-since upgrade-survivor soak'a dahil olun. `release_profile=stable` ve
  `release_profile=full` tarafından zorunlu olarak açılır.

Kurallar:

- Patch `33` altındaki düzenli final ve düzeltme sürümleri `beta` veya `latest`
  değerlerinden birine yayımlanabilir. Patch `33` veya üzerindeki final sürümler
  `extended-stable` değerine yayımlanmalıdır ve bu sınırdaki correction-suffix sürümleri
  reddedilir.
- Beta prerelease etiketleri yalnızca `beta` değerine yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca
  `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` ve `Full Release Validation` her zaman yalnızca
  doğrulama içindir
- Gerçek publish yolu, preflight sırasında kullanılan aynı `npm_dist_tag` değerini
  kullanmalıdır; workflow, publish öncesinde metadata'nın bunu sürdürdüğünü doğrular

## Düzenli beta/latest stable sürüm sırası

Bu eski sıra, Plugin'leri, GitHub Release'i, Windows'u ve diğer platform çalışmalarını
da sahiplenen düzenli orkestre edilmiş sürüm içindir. Bu sayfanın başında belgelenen
aylık `.33+` yalnızca npm extended-stable yolu değildir.

Düzenli orkestre edilmiş bir stable sürüm keserken:

1. `OpenClaw NPM Release` iş akışını `preflight_only=true` ile çalıştırın
   - Bir etiket mevcut olmadan önce, ön kontrol iş akışının yalnızca doğrulama
     amaçlı kuru çalıştırması için mevcut tam iş akışı dalı commit SHA’sını
     kullanabilirsiniz
2. Normal önce beta akışı için `npm_dist_tag=beta` seçin; yalnızca doğrudan
   kararlı yayımlama yapmak istediğinizde `latest` seçin
3. Tek bir manuel iş akışından normal CI ile birlikte canlı prompt önbelleği,
   Docker, QA Lab, Matrix ve Telegram kapsamı istediğinizde yayın dalında,
   yayın etiketinde veya tam commit SHA’sında `Full Release Validation`
   çalıştırın
4. Özellikle yalnızca belirleyici normal test grafiğine ihtiyacınız varsa, bunun
   yerine yayın ref’i üzerinde manuel `CI` iş akışını çalıştırın
5. İmzalı x64 ve ARM64 yükleyicileri yayımlanacak tam ön sürüm olmayan
   `openclaw/openclaw-windows-node` yayın etiketini seçin. Bunu
   `windows_node_tag` olarak kaydedin ve doğrulanmış digest haritalarını
   `windows_node_installer_digests` olarak kaydedin. Yayın adayı yardımcısı
   her ikisini de kaydeder ve oluşturduğu yayımlama komutuna dahil eder.
6. Başarılı `preflight_run_id` ve `full_release_validation_run_id` değerlerini
   kaydedin
7. Aynı `tag`, aynı `npm_dist_tag`, seçilen `windows_node_tag`, kaydedilmiş
   `windows_node_installer_digests`, kaydedilmiş `preflight_run_id` ve
   kaydedilmiş `full_release_validation_run_id` ile `OpenClaw Release Publish`
   çalıştırın; OpenClaw npm paketini yükseltmeden önce dışsallaştırılmış
   Plugin’leri npm ve ClawHub’a yayımlar
8. Yayın `beta` üzerine geldiyse, bu kararlı sürümü `beta`dan `latest`e
   yükseltmek için
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   iş akışını kullanın
9. Yayın bilerek doğrudan `latest`e yayımlandıysa ve `beta` hemen aynı kararlı
   derlemeyi izlemeliyse, her iki dist-tag’i de kararlı sürüme yönlendirmek için
   aynı yayın iş akışını kullanın veya zamanlanmış kendi kendini iyileştiren
   senkronizasyonunun `beta`yı daha sonra taşımasına izin verin

dist-tag değişikliği yayın defteri deposunda bulunur çünkü hâlâ `NPM_TOKEN`
gerektirir; kaynak depo ise yalnızca OIDC yayımlamayı korur.

Bu, doğrudan yayımlama yolunu ve önce beta yükseltme yolunu hem belgelenmiş hem
de operatör tarafından görülebilir tutar.

Bir bakımcının yerel npm kimlik doğrulamasına geri dönmesi gerekirse, tüm
1Password CLI (`op`) komutlarını yalnızca ayrılmış bir tmux oturumu içinde
çalıştırın. `op` komutunu ana ajan kabuğundan doğrudan çağırmayın; tmux içinde
tutmak istemleri, uyarıları ve OTP işlemlerini gözlemlenebilir kılar ve
yinelenen ana makine uyarılarını önler.

## Genel referanslar

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Bakımcılar asıl çalışma kılavuzu için
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
içindeki özel yayın belgelerini kullanır.

## İlgili

- [Yayın kanalları](/tr/install/development-channels)
