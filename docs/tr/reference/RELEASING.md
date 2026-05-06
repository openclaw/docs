---
read_when:
    - Herkese açık sürüm kanalı tanımları aranıyor
    - Sürüm doğrulamasını veya paket kabulünü çalıştırma
    - Sürüm adlandırması ve yayın sıklığı aranıyor
summary: Sürüm hatları, operatör kontrol listesi, doğrulama kutuları, sürüm adlandırması ve yayın ritmi
title: Sürüm politikası
x-i18n:
    generated_at: "2026-05-06T18:00:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw'ın üç herkese açık yayın kanalı vardır:

- kararlı: varsayılan olarak npm `beta`'ya yayımlanan, açıkça istendiğinde ise npm `latest`'a yayımlanan etiketli sürümler
- beta: npm `beta`'ya yayımlanan ön sürüm etiketleri
- dev: `main` dalının hareketli en güncel ucu

## Sürüm adlandırma

- Kararlı yayın sürümü: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Kararlı düzeltme yayın sürümü: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön sürüm sürümü: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ayı veya günü başına sıfır ekleyerek yazmayın
- `latest`, mevcut yükseltilmiş kararlı npm sürümü anlamına gelir
- `beta`, mevcut beta kurulum hedefi anlamına gelir
- Kararlı ve kararlı düzeltme sürümleri varsayılan olarak npm `beta`'ya yayımlanır; yayın operatörleri açıkça `latest` hedefleyebilir veya incelenmiş bir beta derlemesini daha sonra yükseltebilir
- Her kararlı OpenClaw sürümü npm paketini ve macOS uygulamasını birlikte gönderir;
  beta sürümleri normalde önce npm/paket yolunu doğrular ve yayımlar, mac
  uygulamasının derlenmesi/imzalanması/noter onayı ise açıkça istenmedikçe kararlı sürüme ayrılır

## Yayın temposu

- Yayınlar önce beta olarak ilerler
- Kararlı sürüm yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar normalde sürümleri mevcut `main` dalından oluşturulan bir `release/YYYY.M.D` dalından çıkarır;
  böylece yayın doğrulaması ve düzeltmeler `main` üzerindeki yeni
  geliştirmeyi engellemez
- Bir beta etiketi gönderilmiş veya yayımlanmışsa ve düzeltme gerekiyorsa, bakımcılar eski beta etiketini silmek veya yeniden oluşturmak yerine
  sonraki `-beta.N` etiketini çıkarır
- Ayrıntılı yayın prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca bakımcılara özeldir

## Yayın operatörü kontrol listesi

Bu kontrol listesi yayın akışının herkese açık biçimidir. Özel kimlik bilgileri,
imzalama, noter onayı, dist-tag kurtarma ve acil geri alma ayrıntıları
yalnızca bakımcılara özel yayın çalışma kitabında kalır.

1. Mevcut `main` dalından başlayın: en son değişiklikleri çekin, hedef commit'in gönderildiğini doğrulayın
   ve mevcut `main` CI durumunun dal oluşturmak için yeterince yeşil olduğunu doğrulayın.
2. En üstteki `CHANGELOG.md` bölümünü gerçek commit geçmişinden `/changelog` ile yeniden yazın, girdileri kullanıcıya yönelik tutun, commit'leyin, gönderin ve dal oluşturmadan önce
   bir kez daha rebase/pull yapın.
3. Yayın uyumluluğu kayıtlarını
   `src/plugins/compat/registry.ts` ve
   `src/commands/doctor/shared/deprecation-compat.ts` içinde gözden geçirin. Süresi dolmuş
   uyumluluğu yalnızca yükseltme yolu kapsanmaya devam ettiğinde kaldırın veya neden
   bilerek taşındığını kaydedin.
4. Mevcut `main` dalından `release/YYYY.M.D` oluşturun; normal yayın işini
   doğrudan `main` üzerinde yapmayın.
5. Amaçlanan etiket için gerekli her sürüm konumunu yükseltin,
   yayımlanabilir Plugin paketlerinin yayın
   sürümünü ve uyumluluk meta verilerini paylaşması için `pnpm plugins:sync` çalıştırın, ardından yerel deterministik ön denetimi çalıştırın:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` ve
   `pnpm release:check`.
6. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın. Bir etiket var olmadan önce,
   yalnızca doğrulama ön denetimi için tam 40 karakterlik bir yayın dalı SHA'sına izin verilir.
   Başarılı `preflight_run_id` değerini kaydedin.
7. Yayın dalı, etiket veya tam commit SHA'sı için `Full Release Validation` ile tüm yayın öncesi testleri başlatın. Bu, dört büyük yayın test kutusu için tek manuel giriş noktasıdır: Vitest, Docker, QA Lab ve Package.
8. Doğrulama başarısız olursa yayın dalında düzeltin ve düzeltmeyi kanıtlayan en küçük başarısız
   dosyayı, kanalı, workflow işini, paket profilini, sağlayıcıyı veya model izin listesini yeniden çalıştırın. Tam üst akışı yalnızca değişen yüzey
   önceki kanıtı geçersiz kıldığında yeniden çalıştırın.
9. Beta için `vYYYY.M.D-beta.N` etiketleyin, ardından eşleşen
   `release/YYYY.M.D` dalından `OpenClaw Release Publish` çalıştırın. Bu, `pnpm plugins:sync:check` doğrular,
   yayımlanabilir tüm Plugin paketlerini npm'e ve aynı kümeyi paralel olarak
   ClawHub'a gönderir, ardından Plugin npm yayımı başarılı olur olmaz hazırlanmış OpenClaw npm ön denetim
   artifact'ini eşleşen dist-tag ile yükseltir.
   OpenClaw npm yayımlanırken ClawHub yayını hâlâ çalışıyor olabilir, ancak
   yayın workflow'u hem Plugin yayın yolları hem de
   OpenClaw npm yayın yolu başarıyla tamamlanana kadar bitmez. Yayından sonra, yayımlanmış
   `openclaw@YYYY.M.D-beta.N` veya
   `openclaw@beta` paketine karşı yayın sonrası paket
   kabulünü çalıştırın. Gönderilmiş veya yayımlanmış bir ön sürüm düzeltme gerektirirse,
   sonraki eşleşen ön sürüm numarasını çıkarın; eski ön sürümü silmeyin veya yeniden yazmayın.
10. Kararlı için yalnızca incelenmiş beta veya yayın adayının
    gerekli doğrulama kanıtına sahip olmasından sonra devam edin. Kararlı npm yayını da
    `OpenClaw Release Publish` üzerinden geçer ve başarılı ön denetim artifact'ini
    `preflight_run_id` aracılığıyla yeniden kullanır; kararlı macOS yayın hazırlığı ayrıca
    paketlenmiş `.zip`, `.dmg`, `.dSYM.zip` ve güncellenmiş `appcast.xml` dosyasının `main` üzerinde olmasını gerektirir.
11. Yayından sonra npm yayın sonrası doğrulayıcısını, yayın sonrası kanal kanıtına ihtiyaç duyduğunuzda isteğe bağlı bağımsız
    yayımlanmış-npm Telegram E2E'yi,
    gerektiğinde dist-tag yükseltmesini, eksiksiz eşleşen `CHANGELOG.md` bölümünden GitHub yayın/ön sürüm notlarını ve yayın duyurusu
    adımlarını çalıştırın.

## Yayın ön denetimi

- Daha hızlı yerel `pnpm check` geçidi dışında test TypeScript kapsamının
  korunması için sürüm ön kontrolünden önce `pnpm check:test-types` çalıştırın
- Daha geniş içe aktarma döngüsü ve mimari sınır kontrollerinin daha hızlı
  yerel geçit dışında yeşil olması için sürüm ön kontrolünden önce
  `pnpm check:architecture` çalıştırın
- Beklenen `dist/*` sürüm artefaktlarının ve Control UI paketinin paket
  doğrulama adımı için mevcut olması amacıyla `pnpm release:check` öncesinde
  `pnpm build && pnpm ui:build` çalıştırın
- Kök sürüm yükseltmesinden sonra ve etiketlemeden önce `pnpm plugins:sync`
  çalıştırın. Bu komut, yayımlanabilir Plugin paket sürümlerini, OpenClaw eş/API
  uyumluluk meta verilerini, derleme meta verilerini ve Plugin değişiklik
  günlüğü taslaklarını çekirdek sürümle eşleşecek şekilde günceller.
  `pnpm plugins:sync:check`, değişiklik yapmayan sürüm korumasıdır; bu adım
  unutulduysa yayımlama iş akışı herhangi bir kayıt defteri değişikliğinden
  önce başarısız olur.
- Sürüm onayından önce, tüm ön sürüm test kutularını tek bir giriş noktasından
  başlatmak için manuel `Full Release Validation` iş akışını çalıştırın. Bir
  dal, etiket veya tam commit SHA kabul eder, manuel `CI` tetikler ve kurulum
  smoke, paket kabulü, işletim sistemleri arası paket kontrolleri, QA Lab
  eşliği, Matrix ve Telegram hatları için `OpenClaw Release Checks` tetikler.
  Kararlı/varsayılan çalıştırmalar, kapsamlı canlı/E2E ve Docker sürüm yolu
  bekletmesini `run_release_soak=true` arkasında tutar; `release_profile=full`
  bekletmeyi zorunlu kılar. `release_profile=full` ve `rerun_group=all` ile,
  sürüm kontrollerinden gelen `release-package-under-test` artefaktına karşı
  paket Telegram E2E de çalıştırır. Aynı Telegram E2E'nin yayımlanmış npm
  paketini de kanıtlaması gerektiğinde yayımlamadan sonra
  `npm_telegram_package_spec` sağlayın. Package Acceptance, paket/güncelleme
  matrisini SHA ile oluşturulmuş artefakt yerine gönderilmiş npm paketine karşı
  çalıştırmalıysa yayımlamadan sonra `package_acceptance_package_spec` sağlayın.
  Özel kanıt raporunun doğrulamanın yayımlanmış bir npm paketiyle eşleştiğini
  Telegram E2E'yi zorlamadan kanıtlaması gerektiğinde `evidence_package_spec`
  sağlayın. Örnek:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Sürüm çalışması devam ederken bir paket adayı için yan kanal kanıtı istediğinizde
  manuel `Package Acceptance` iş akışını çalıştırın. `openclaw@beta`,
  `openclaw@latest` veya kesin bir sürüm için `source=npm`; geçerli
  `workflow_ref` donanımıyla güvenilir bir `package_ref` dalı/etiketi/SHA'sı
  paketlemek için `source=ref`; zorunlu SHA-256 içeren bir HTTPS tarball için
  `source=url`; ya da başka bir GitHub Actions çalıştırması tarafından yüklenen
  tarball için `source=artifact` kullanın. İş akışı adayı
  `package-under-test` olarak çözümler, Docker E2E sürüm zamanlayıcısını bu
  tarball'a karşı yeniden kullanır ve aynı tarball'a karşı
  `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` ile Telegram QA
  çalıştırabilir. Seçilen Docker hatları `published-upgrade-survivor` içerdiğinde
  paket artefaktı adaydır ve `published_upgrade_survivor_baseline` yayımlanmış
  temel sürümü seçer. `update-restart-auth`, aday paketi hem kurulu CLI hem de
  package-under-test olarak kullanır; böylece aday güncelleme komutunun yönetilen
  yeniden başlatma yolunu çalıştırır.
  Örnek: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Yaygın profiller:
  - `smoke`: kurulum/kanal/ajan, Gateway ağı ve yapılandırma yeniden yükleme hatları
  - `package`: OpenWebUI veya canlı ClawHub olmadan artefakta özgü paket/güncelleme/yeniden başlatma/Plugin hatları
  - `product`: paket profiline ek olarak MCP kanalları, cron/alt ajan temizliği,
    OpenAI web araması ve OpenWebUI
  - `full`: OpenWebUI ile Docker sürüm yolu parçaları
  - `custom`: odaklı yeniden çalıştırma için kesin `docker_lanes` seçimi
- Sürüm adayı için yalnızca tam normal CI kapsamına ihtiyacınız olduğunda manuel
  `CI` iş akışını doğrudan çalıştırın. Manuel CI tetiklemeleri değişiklik
  kapsamını atlar ve Linux Node parçalarını, paketli-Plugin parçalarını, kanal
  sözleşmelerini, Node 22 uyumluluğunu, `check`, `check-additional`, derleme
  smoke, doküman kontrolleri, Python Skills, Windows, macOS, Android ve Control
  UI i18n hatlarını zorunlu kılar.
  Örnek: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Sürüm telemetrisini doğrularken `pnpm qa:otel:smoke` çalıştırın. Bu komut,
  QA-lab'i yerel bir OTLP/HTTP alıcısı üzerinden çalıştırır ve Opik, Langfuse
  veya başka bir dış toplayıcı gerektirmeden dışa aktarılan iz span adlarını,
  sınırlandırılmış öznitelikleri ve içerik/tanımlayıcı redaksiyonunu doğrular.
- Her etiketli sürümden önce `pnpm release:check` çalıştırın
- Etiket var olduktan sonra değişiklik yapan yayımlama sırası için
  `OpenClaw Release Publish` çalıştırın. Bunu `release/YYYY.M.D` üzerinden
  (veya main tarafından erişilebilir bir etiket yayımlarken `main` üzerinden)
  tetikleyin, sürüm etiketini ve başarılı OpenClaw npm `preflight_run_id`
  değerini geçirin ve bilinçli olarak odaklı bir onarım çalıştırmadığınız sürece
  varsayılan Plugin yayımlama kapsamını `all-publishable` olarak bırakın. İş
  akışı Plugin npm yayımlamayı, Plugin ClawHub yayımlamayı ve OpenClaw npm
  yayımlamayı sıraya koyar; böylece çekirdek paket, dışsallaştırılmış
  Pluginlerinden önce yayımlanmaz.
- Sürüm kontrolleri artık ayrı bir manuel iş akışında çalışır:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`, sürüm onayından önce QA Lab mock eşlik hattını,
  hızlı canlı Matrix profilini ve Telegram QA hattını da çalıştırır. Canlı
  hatlar `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI kimlik
  bilgisi kiralamalarını kullanır. Tam Matrix taşıma, medya ve E2EE envanterini
  paralel istediğinizde manuel `QA-Lab - All Lanes` iş akışını
  `matrix_profile=all` ve `matrix_shards=true` ile çalıştırın.
- İşletim sistemleri arası kurulum ve yükseltme çalışma zamanı doğrulaması,
  yeniden kullanılabilir iş akışını doğrudan çağıran genel
  `OpenClaw Release Checks` ve `Full Release Validation` kapsamındadır:
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Bu ayrım bilinçlidir: gerçek npm sürüm yolunu kısa, belirleyici ve artefakt
  odaklı tutarken daha yavaş canlı kontrolleri kendi hattında bırakır; böylece
  yayımlamayı yavaşlatmaz veya engellemezler
- Sır taşıyan sürüm kontrolleri, iş akışı mantığı ve sırlar kontrollü kalsın
  diye `Full Release Validation` üzerinden veya `main`/sürüm iş akışı ref'inden
  tetiklenmelidir
- `OpenClaw Release Checks`, çözümlenen commit bir OpenClaw dalından veya sürüm
  etiketinden erişilebilir olduğu sürece bir dal, etiket veya tam commit SHA
  kabul eder
- `OpenClaw NPM Release` yalnızca doğrulama amaçlı ön kontrolü, gönderilmiş bir
  etiket gerektirmeden geçerli tam 40 karakterli iş akışı dalı commit SHA'sını
  da kabul eder
- Bu SHA yolu yalnızca doğrulama amaçlıdır ve gerçek bir yayımlamaya terfi
  ettirilemez
- SHA modunda iş akışı, yalnızca paket meta verisi kontrolü için
  `v<package.json version>` üretir; gerçek yayımlama hâlâ gerçek bir sürüm
  etiketi gerektirir
- Her iki iş akışı da gerçek yayımlama ve terfi yolunu GitHub tarafından
  barındırılan çalıştırıcılarda tutarken, değişiklik yapmayan doğrulama yolu
  daha büyük Blacksmith Linux çalıştırıcılarını kullanabilir
- Bu iş akışı, hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` iş akışı
  sırlarını kullanarak
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  çalıştırır
- npm sürüm ön kontrolü artık ayrı sürüm kontrolleri hattını beklemez
- Onaydan önce
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (veya eşleşen beta/düzeltme etiketi) çalıştırın
- npm yayımlamasından sonra, yayımlanmış kayıt defteri kurulum yolunu yeni bir
  geçici önekte doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (veya eşleşen beta/düzeltme sürümü) çalıştırın
- Beta yayımlamasından sonra, paylaşılan kiralanmış Telegram kimlik bilgisi
  havuzunu kullanarak yayımlanmış npm paketine karşı kurulu paket onboarding,
  Telegram kurulumu ve gerçek Telegram E2E doğrulamak için
  `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  çalıştırın. Yerel bakımcı tek seferlik çalıştırmaları Convex değişkenlerini
  atlayabilir ve üç `OPENCLAW_QA_TELEGRAM_*` ortam kimlik bilgisini doğrudan
  geçebilir.
- Tam yayımlama sonrası beta smoke'u bir bakımcı makinesinden çalıştırmak için `pnpm release:beta-smoke -- --beta betaN` kullanın. Yardımcı, Parallels npm güncelleme/yeni-hedef doğrulamasını çalıştırır, `NPM Telegram Beta E2E` tetikler, kesin iş akışı çalıştırmasını yoklar, artefaktı indirir ve Telegram raporunu yazdırır.
- Bakımcılar aynı yayımlama sonrası kontrolü GitHub Actions üzerinden manuel
  `NPM Telegram Beta E2E` iş akışıyla çalıştırabilir. Bu kasıtlı olarak
  yalnızca manueldir ve her birleştirmede çalışmaz.
- Bakımcı sürüm otomasyonu artık önce ön kontrol, sonra terfi kullanır:
  - gerçek npm yayımlaması başarılı bir npm `preflight_run_id` geçmelidir
  - gerçek npm yayımlaması, başarılı ön kontrol çalıştırmasıyla aynı `main` veya
    `release/YYYY.M.D` dalından tetiklenmelidir
  - kararlı npm sürümleri varsayılan olarak `beta` değerini kullanır
  - kararlı npm yayımlaması, iş akışı girdisiyle açıkça `latest` hedefleyebilir
  - token tabanlı npm dist-tag değişikliği artık güvenlik için
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    içindedir; çünkü genel repo OIDC-only yayımlamayı korurken
    `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirir
  - genel `macOS Release` yalnızca doğrulama amaçlıdır; bir etiket yalnızca bir
    sürüm dalında bulunuyorsa ancak iş akışı `main` üzerinden tetikleniyorsa,
    `public_release_branch=release/YYYY.M.D` ayarlayın
  - gerçek özel mac yayımlaması başarılı özel mac `preflight_run_id` ve
    `validate_run_id` değerlerini geçmelidir
  - gerçek yayımlama yolları, artefaktları yeniden derlemek yerine hazırlanmış
    artefaktları terfi ettirir
- `YYYY.M.D-N` gibi kararlı düzeltme sürümleri için, yayımlama sonrası
  doğrulayıcı aynı geçici önek yükseltme yolunu `YYYY.M.D` sürümünden
  `YYYY.M.D-N` sürümüne de kontrol eder; böylece sürüm düzeltmeleri eski global
  kurulumları sessizce temel kararlı yükte bırakamaz
- npm sürüm ön kontrolü, tarball hem `dist/control-ui/index.html` hem de boş
  olmayan bir `dist/control-ui/assets/` yükü içermedikçe kapalı başarısız olur;
  böylece tekrar boş bir tarayıcı panosu göndermeyiz
- Yayımlama sonrası doğrulama, yayımlanmış Plugin giriş noktalarının ve paket
  meta verilerinin kurulu kayıt defteri düzeninde mevcut olduğunu da kontrol
  eder. Eksik Plugin çalışma zamanı yükleri gönderen bir sürüm, postpublish
  doğrulayıcısında başarısız olur ve `latest` değerine terfi ettirilemez.
- `pnpm test:install:smoke`, aday güncelleme tarball'ında npm pack
  `unpackedSize` bütçesini de zorunlu kılar; böylece kurulum E2E, sürüm
  yayımlama yolundan önce yanlışlıkla oluşan paket şişmesini yakalar
- Sürüm çalışması CI planlamasına, uzantı zamanlama manifestlerine veya uzantı
  test matrislerine dokunduysa, onaydan önce
  `.github/workflows/plugin-prerelease.yml` içindeki planlayıcıya ait
  `plugin-prerelease-extension-shard` matris çıktılarını yeniden üretin ve
  gözden geçirin; böylece sürüm notları eski bir CI düzenini açıklamaz
- Kararlı macOS sürüm hazırlığı güncelleyici yüzeylerini de içerir:
  - GitHub sürümü paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` ile sonuçlanmalıdır
  - `main` üzerindeki `appcast.xml`, yayımlamadan sonra yeni kararlı zip'e işaret etmelidir
  - paketlenmiş uygulama debug olmayan bir bundle id, boş olmayan bir Sparkle
    feed URL'si ve ilgili sürüm için kanonik Sparkle derleme tabanına eşit veya
    onun üzerinde bir `CFBundleVersion` korumalıdır

## Sürüm test kutuları

`Full Release Validation`, operatörlerin tüm ön sürüm testlerini tek bir giriş
noktasından başlatma yoludur. Hızla hareket eden bir dalda sabitlenmiş commit
kanıtı için yardımcıyı kullanın; böylece her alt iş akışı hedef SHA'ya sabitli
geçici bir daldan çalışır:

```bash
pnpm ci:full-release --sha <full-sha>
```

Yardımcı `release-ci/<sha>-...` dalını gönderir, bu daldan `ref=<sha>` ile
`Full Release Validation` tetikler, her alt iş akışı `headSha` değerinin hedefle
eşleştiğini doğrular ve ardından geçici dalı siler. Bu, yanlışlıkla daha yeni
bir `main` alt çalıştırmasını kanıtlamayı önler.

Sürüm dalı veya etiket doğrulaması için, bunu güvenilir `main` iş akışı ref'inden
çalıştırın ve sürüm dalını veya etiketini `ref` olarak geçirin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

İş akışı hedef ref'i çözümler, `target_ref=<release-ref>` ile manuel `CI` gönderir, `OpenClaw Release Checks` gönderir, paket odaklı denetimler için üst `release-package-under-test` yapıtını hazırlar ve `release_profile=full` ile `rerun_group=all` olduğunda veya `npm_telegram_package_spec` ayarlandığında bağımsız paket Telegram E2E gönderir. Ardından `OpenClaw Release Checks`, yükleme smoke denetimlerine, çapraz işletim sistemi sürüm denetimlerine, soak etkinleştirildiğinde canlı/E2E Docker sürüm yolu kapsamına, Telegram paket QA ile Package Acceptance'a, QA Lab paritesine, canlı Matrix'e ve canlı Telegram'a yayılır. Tam çalıştırma yalnızca `Full Release Validation` özeti `normal_ci` ve `release_checks` değerlerini başarılı gösterdiğinde kabul edilebilir. Full/all modunda `npm_telegram` alt çalıştırması da başarılı olmalıdır; full/all dışında, yayımlanmış bir `npm_telegram_package_spec` sağlanmadıkça atlanır. Son doğrulayıcı özeti her alt çalıştırma için en yavaş iş tablolarını içerir; böylece sürüm yöneticisi günlükleri indirmeden mevcut kritik yolu görebilir.
Eksiksiz aşama matrisi, tam iş akışı iş adları, stable ile full profil farkları, yapıtlar ve odaklı yeniden çalıştırma tanıtıcıları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.
Alt iş akışları, hedef `ref` daha eski bir sürüm dalını veya etiketini gösterse bile, normalde `--ref main` olan `Full Release Validation` çalıştıran güvenilir ref'ten gönderilir. Ayrı bir Full Release Validation workflow-ref girdisi yoktur; güvenilir harness'i iş akışı çalıştırma ref'ini seçerek seçin. Hareket eden `main` üzerinde kesin commit kanıtı için `--ref main -f ref=<sha>` kullanmayın; ham commit SHA'ları workflow dispatch ref'i olamaz, bu yüzden sabitlenmiş geçici dalı oluşturmak için `pnpm ci:full-release --sha <sha>` kullanın.

Canlı/provider kapsamını seçmek için `release_profile` kullanın:

- `minimum`: en hızlı sürüm açısından kritik OpenAI/çekirdek canlı ve Docker yolu
- `stable`: sürüm onayı için minimuma ek olarak stable provider/backend kapsamı
- `full`: stable'a ek olarak geniş advisory provider/medya kapsamı

Sürüm engelleyen hatlar yeşil olduğunda ve yükseltme öncesinde kapsamlı canlı/E2E, Docker sürüm yolu ve sınırlı yayımlanmış upgrade-survivor taraması istediğinizde `stable` ile `run_release_soak=true` kullanın. Bu tarama, en son dört stable paketi ve sabitlenmiş `2026.4.23` ile `2026.5.2` temel çizgilerini, ayrıca daha eski `2026.4.15` kapsamını kapsar; yinelenen temel çizgiler kaldırılır ve her temel çizgi kendi Docker runner işine parçalanır. `full`, `run_release_soak=true` anlamına gelir.

`OpenClaw Release Checks`, hedef ref'i bir kez `release-package-under-test` olarak çözümlemek için güvenilir iş akışı ref'ini kullanır ve soak çalıştığında çapraz işletim sistemi, Package Acceptance ve sürüm yolu Docker denetimlerinde bu yapıtı yeniden kullanır. Bu, paket odaklı tüm kutuların aynı baytlar üzerinde kalmasını sağlar ve tekrarlanan paket derlemelerini önler. Çapraz işletim sistemi OpenAI yükleme smoke denetimi, repo/org değişkeni ayarlandığında `OPENCLAW_CROSS_OS_OPENAI_MODEL` değerini, aksi halde `openai/gpt-5.4` değerini kullanır; çünkü bu hat en yavaş varsayılan modeli kıyaslamak yerine paket yüklemeyi, onboarding'i, Gateway başlatmayı ve bir canlı agent turunu kanıtlar. Daha geniş canlı provider matrisi model özel kapsamının yeridir.

Sürüm aşamasına göre şu varyantları kullanın:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
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
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Odaklı bir düzeltmeden sonra ilk yeniden çalıştırma olarak tam şemsiyeyi kullanmayın. Bir kutu başarısız olursa, sonraki kanıt için başarısız alt iş akışını, işi, Docker hattını, paket profilini, model provider'ını veya QA hattını kullanın. Tam şemsiyeyi yalnızca düzeltme paylaşılan sürüm orkestrasyonunu değiştirdiğinde veya önceki tüm kutu kanıtını bayatlattığında yeniden çalıştırın. Şemsiyenin son doğrulayıcısı kaydedilmiş alt iş akışı çalıştırma kimliklerini yeniden denetler; bu yüzden bir alt iş akışı başarıyla yeniden çalıştırıldıktan sonra yalnızca başarısız `Verify full validation` üst işini yeniden çalıştırın.

Sınırlı kurtarma için şemsiyeye `rerun_group` geçirin. `all` gerçek sürüm adayı çalıştırmasıdır, `ci` yalnızca normal CI alt çalıştırmasını çalıştırır, `plugin-prerelease` yalnızca sürüme özel Plugin alt çalıştırmasını çalıştırır, `release-checks` her sürüm kutusunu çalıştırır ve daha dar sürüm grupları `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ve `npm-telegram` değerleridir. Odaklı `npm-telegram` yeniden çalıştırmaları `npm_telegram_package_spec` gerektirir; `release_profile=full` ile full/all çalıştırmaları release-checks paket yapıtını kullanır. Odaklı çapraz işletim sistemi yeniden çalıştırmaları `cross_os_suite_filter=windows/packaged-upgrade` veya başka bir işletim sistemi/suite filtresi ekleyebilir. QA release-check hataları advisory niteliğindedir; yalnızca QA hatası sürüm doğrulamasını engellemez.

### Vitest

Vitest kutusu manuel `CI` alt iş akışıdır. Manuel CI, değişiklik kapsamını kasıtlı olarak atlar ve sürüm adayı için normal test grafiğini zorunlu kılar: Linux Node parçaları, paketlenmiş Plugin parçaları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, build smoke, docs denetimleri, Python Skills, Windows, macOS, Android ve Control UI i18n.

Bu kutuyu "kaynak ağacı tam normal test paketinden geçti mi?" sorusunu yanıtlamak için kullanın. Sürüm yolu ürün doğrulamasıyla aynı değildir. Saklanacak kanıtlar:

- gönderilen `CI` çalıştırma URL'sini gösteren `Full Release Validation` özeti
- kesin hedef SHA üzerinde yeşil `CI` çalıştırması
- regresyonları araştırırken CI işlerinden başarısız veya yavaş parça adları
- bir çalıştırmanın performans analizi gerektirdiği durumlarda `.artifacts/vitest-shard-timings.json` gibi Vitest zamanlama yapıtları

Manuel CI'ı doğrudan yalnızca sürüm deterministik normal CI gerektirdiğinde, ancak Docker, QA Lab, canlı, çapraz işletim sistemi veya paket kutularını gerektirmediğinde çalıştırın:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker kutusu, `openclaw-live-and-e2e-checks-reusable.yml` üzerinden `OpenClaw Release Checks` içinde ve ayrıca sürüm modu `install-smoke` iş akışında yer alır. Sürüm adayını yalnızca kaynak düzeyi testler yerine paketlenmiş Docker ortamları üzerinden doğrular.

Sürüm Docker kapsamı şunları içerir:

- yavaş Bun global yükleme smoke denetimi etkinleştirilmiş tam yükleme smoke denetimi
- hedef SHA'ya göre kök Dockerfile smoke imajı hazırlama/yeniden kullanma; QR, kök/Gateway ve installer/Bun smoke işleri ayrı install-smoke parçaları olarak çalışır
- repository E2E hatları
- sürüm yolu Docker parçaları: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` ve `plugins-runtime-install-h`
- istendiğinde `plugins-runtime-services` parçası içinde OpenWebUI kapsamı
- `bundled-plugin-install-uninstall-0` ile
  `bundled-plugin-install-uninstall-23` arasındaki bölünmüş paketlenmiş Plugin yükleme/kaldırma hatları
- release checks canlı suiteleri içerdiğinde canlı/E2E provider suiteleri ve Docker canlı model kapsamı

Yeniden çalıştırmadan önce Docker yapıtlarını kullanın. Sürüm yolu zamanlayıcısı, hat günlükleri, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı planı JSON'u ve yeniden çalıştırma komutlarıyla birlikte `.artifacts/docker-tests/` yükler. Odaklı kurtarma için tüm sürüm parçalarını yeniden çalıştırmak yerine yeniden kullanılabilir canlı/E2E iş akışında `docker_lanes=<lane[,lane]>` kullanın. Oluşturulan yeniden çalıştırma komutları, mevcut olduğunda önceki `package_artifact_run_id` ve hazırlanmış Docker imaj girdilerini içerir; böylece başarısız bir hat aynı tarball'ı ve GHCR imajlarını yeniden kullanabilir.

### QA Lab

QA Lab kutusu da `OpenClaw Release Checks` parçasıdır. Vitest ve Docker paket mekaniklerinden ayrı olarak agentic davranış ve kanal düzeyi sürüm kapısıdır.

Sürüm QA Lab kapsamı şunları içerir:

- agentic parity pack kullanarak OpenAI aday hattını Opus 4.6 temel çizgisiyle karşılaştıran mock parite hattı
- `qa-live-shared` ortamını kullanan hızlı canlı Matrix QA profili
- Convex CI kimlik bilgisi kiralamalarını kullanan canlı Telegram QA hattı
- sürüm telemetrisinin açık yerel kanıt gerektirdiği durumlarda `pnpm qa:otel:smoke`

Bu kutuyu "sürüm QA senaryolarında ve canlı kanal akışlarında doğru davranıyor mu?" sorusunu yanıtlamak için kullanın. Sürümü onaylarken parite, Matrix ve Telegram hatları için yapıt URL'lerini saklayın. Tam Matrix kapsamı, varsayılan sürüm açısından kritik hat yerine manuel parçalanmış QA-Lab çalıştırması olarak kullanılabilir kalır.

### Paket

Paket kutusu yüklenebilir ürün kapısıdır. `Package Acceptance` ve `scripts/resolve-openclaw-package-candidate.mjs` çözümleyicisi tarafından desteklenir. Çözümleyici, bir adayı Docker E2E tarafından tüketilen `package-under-test` tarball'ına normalleştirir, paket envanterini doğrular, paket sürümünü ve SHA-256 değerini kaydeder ve iş akışı harness ref'ini paket kaynak ref'inden ayrı tutar.

Desteklenen aday kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya kesin bir OpenClaw sürüm versiyonu
- `source=ref`: seçilen `workflow_ref` harness'iyle güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA'sını paketle
- `source=url`: gerekli `package_sha256` ile bir HTTPS `.tgz` indir
- `source=artifact`: başka bir GitHub Actions çalıştırması tarafından yüklenen bir `.tgz` dosyasını yeniden kullan

`OpenClaw Release Checks`, `source=artifact`, hazırlanmış sürüm paketi yapıtı, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`, `telegram_mode=mock-openai` ile Package Acceptance çalıştırır. Package Acceptance; migration, update, configured-auth update restart, eski Plugin bağımlılığı temizliği, çevrimdışı Plugin fixture'ları, Plugin update ve Telegram paket QA'yı aynı çözümlenmiş tarball üzerinde tutar. Engelleyici release checks varsayılan en son yayımlanmış paket temel çizgisini kullanır; `run_release_soak=true` veya `release_profile=full`, `2026.4.23` ile `latest` arasındaki her stable npm-yayımlanmış temel çizgiye ve bildirilen sorun fixture'larına genişler. Zaten yayımlanmış bir aday için Package Acceptance'ı `source=npm` ile, yayımlamadan önce SHA destekli yerel npm tarball için `source=ref`/`source=artifact` ile kullanın. Daha önce Parallels gerektiren paket/update kapsamının çoğu için GitHub-native yedektir. Çapraz işletim sistemi release checks, işletim sistemine özel onboarding, installer ve platform davranışı için hâlâ önemlidir; ancak paket/update ürün doğrulaması Package Acceptance'ı tercih etmelidir.

Update ve Plugin doğrulaması için kanonik kontrol listesi [Update ve Plugin testleri](/tr/help/testing-updates-plugins) bölümüdür. Bir Plugin yükleme/update, doctor cleanup veya yayımlanmış paket migration değişikliğini hangi yerel, Docker, Package Acceptance ya da release-check hattının kanıtladığına karar verirken bunu kullanın. Her stable `2026.4.23+` paketten kapsamlı yayımlanmış update migration, Full Release CI'ın parçası değil, ayrı bir manuel `Update Migration` iş akışıdır.

Eski paket kabul esnekliği kasıtlı olarak zamanla sınırlıdır. `2026.4.25` dahil paketler, npm'e zaten yayımlanmış metadata boşlukları için uyumluluk yolunu kullanabilir: tarball içinde eksik olan özel QA envanter girdileri, eksik `gateway install --wrapper`, tarball'dan türetilmiş git fixture içinde eksik patch dosyaları, eksik kalıcı `update.channel`, eski Plugin install-record konumları, eksik marketplace install-record kalıcılığı ve `plugins update` sırasında config metadata geçişi. Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel build metadata damga dosyaları için uyarı verebilir. Daha sonraki paketler modern paket sözleşmelerini karşılamalıdır; aynı boşluklar release doğrulamasında başarısız olur.

Release sorusu gerçek bir kurulabilir paketle ilgili olduğunda daha geniş Package Acceptance profilleri kullanın:

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

- `smoke`: hızlı paket install/channel/agent, Gateway ağı ve config yeniden yükleme hatları
- `package`: canlı ClawHub olmadan install/update/restart/Plugin paket sözleşmeleri; release-check varsayılanı budur
- `product`: `package` artı MCP kanalları, cron/subagent cleanup, OpenAI web araması ve OpenWebUI
- `full`: OpenWebUI ile Docker release-path parçaları
- `custom`: odaklı yeniden çalıştırmalar için tam `docker_lanes` listesi

Paket adayı Telegram kanıtı için Package Acceptance üzerinde `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` etkinleştirin. Workflow, çözümlenen `package-under-test` tarball'unu Telegram hattına geçirir; bağımsız Telegram workflow'u yayın sonrası kontroller için yayımlanmış bir npm spec kabul etmeye devam eder.

## Release yayımlama otomasyonu

`OpenClaw Release Publish` normal değişiklik yapan yayımlama giriş noktasıdır. Release'in ihtiyaç duyduğu sırayla trusted-publisher workflow'larını orkestre eder:

1. Release tag'ini checkout eder ve commit SHA'sını çözümler.
2. Tag'in `main` veya `release/*` üzerinden erişilebilir olduğunu doğrular.
3. `pnpm plugins:sync:check` çalıştırır.
4. `publish_scope=all-publishable` ve `ref=<release-sha>` ile `Plugin NPM Release` başlatır.
5. Aynı scope ve SHA ile `Plugin ClawHub Release` başlatır.
6. Release tag'i, npm dist-tag'i ve kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` başlatır.

Beta yayımlama örneği:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Varsayılan beta dist-tag'e kararlı yayımlama:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Doğrudan `latest` için kararlı promotion açıkça belirtilir:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Daha düşük seviyeli `Plugin NPM Release` ve `Plugin ClawHub Release` workflow'larını yalnızca odaklı onarım veya yeniden yayımlama işleri için kullanın. Seçili bir Plugin onarımı için `plugin_publish_scope=selected` ve `plugins=@openclaw/name` değerlerini `OpenClaw Release Publish`'e geçirin ya da OpenClaw paketinin yayımlanmaması gerektiğinde child workflow'u doğrudan başlatın.

## NPM workflow girdileri

`OpenClaw NPM Release` şu operatör kontrollü girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya `v2026.4.2-beta.1` gibi zorunlu release tag'i; `preflight_only=true` olduğunda yalnızca doğrulama preflight'ı için mevcut tam 40 karakterlik workflow branch commit SHA'sı da olabilir
- `preflight_only`: yalnızca doğrulama/build/package için `true`, gerçek yayımlama yolu için `false`
- `preflight_run_id`: workflow'un başarılı preflight çalıştırmasından hazırlanmış tarball'u yeniden kullanması için gerçek yayımlama yolunda zorunludur
- `npm_dist_tag`: yayımlama yolu için npm hedef tag'i; varsayılanı `beta`

`OpenClaw Release Publish` şu operatör kontrollü girdileri kabul eder:

- `tag`: zorunlu release tag'i; zaten var olmalıdır
- `preflight_run_id`: başarılı `OpenClaw NPM Release` preflight çalıştırma id'si; `publish_openclaw_npm=true` olduğunda zorunludur
- `npm_dist_tag`: OpenClaw paketi için npm hedef tag'i
- `plugin_publish_scope`: varsayılanı `all-publishable`; yalnızca odaklı onarım işi için `selected` kullanın
- `plugins`: `plugin_publish_scope=selected` olduğunda virgülle ayrılmış `@openclaw/*` paket adları
- `publish_openclaw_npm`: varsayılanı `true`; yalnızca workflow'u sadece Plugin onarım orkestratörü olarak kullanırken `false` ayarlayın

`OpenClaw Release Checks` şu operatör kontrollü girdileri kabul eder:

- `ref`: doğrulanacak branch, tag veya tam commit SHA. Secret içeren kontroller, çözümlenen commit'in bir OpenClaw branch'i veya release tag'i üzerinden erişilebilir olmasını gerektirir.
- `run_release_soak`: kararlı/varsayılan release kontrollerinde kapsamlı canlı/E2E, Docker release-path ve all-since upgrade-survivor soak'a dahil olur. `release_profile=full` tarafından zorla etkinleştirilir.

Kurallar:

- Kararlı ve düzeltme tag'leri `beta` veya `latest` üzerine yayımlanabilir
- Beta prerelease tag'leri yalnızca `beta` üzerine yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` ve `Full Release Validation` her zaman yalnızca doğrulama amaçlıdır
- Gerçek yayımlama yolu, preflight sırasında kullanılan aynı `npm_dist_tag` değerini kullanmalıdır; workflow, yayımlamadan önce devam eden metadata'yı doğrular

## Kararlı npm release sırası

Kararlı bir npm release'i çıkarırken:

1. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın
   - Bir tag var olmadan önce, preflight workflow'unun yalnızca doğrulama amaçlı dry run'ı için mevcut tam workflow branch commit SHA'sını kullanabilirsiniz
2. Normal beta-first akışı için `npm_dist_tag=beta` seçin veya yalnızca doğrudan kararlı yayımlamayı bilerek istediğinizde `latest` kullanın
3. Tek bir manuel workflow'dan normal CI artı canlı prompt cache, Docker, QA Lab, Matrix ve Telegram kapsamı istediğinizde release branch'i, release tag'i veya tam commit SHA üzerinde `Full Release Validation` çalıştırın
4. Bilerek yalnızca deterministik normal test grafiğine ihtiyacınız varsa, bunun yerine release ref üzerinde manuel `CI` workflow'unu çalıştırın
5. Başarılı `preflight_run_id` değerini kaydedin
6. Aynı `tag`, aynı `npm_dist_tag` ve kaydedilmiş `preflight_run_id` ile `OpenClaw Release Publish` çalıştırın; OpenClaw npm paketini promote etmeden önce externalized Plugin'leri npm ve ClawHub'a yayımlar
7. Release `beta` üzerinde yayımlandıysa, bu kararlı sürümü `beta`'dan `latest`'e promote etmek için özel `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` workflow'unu kullanın
8. Release bilerek doğrudan `latest` üzerine yayımlandıysa ve `beta` hemen aynı kararlı build'i izlemeliyse, her iki dist-tag'i de kararlı sürüme yönlendirmek için aynı özel workflow'u kullanın ya da zamanlanmış self-healing sync'in `beta`yı daha sonra taşımasına izin verin

Dist-tag değişikliği güvenlik nedeniyle özel repoda yaşar; çünkü hâlâ `NPM_TOKEN` gerektirir, public repo ise yalnızca OIDC publish'i korur.

Bu, doğrudan yayımlama yolunu ve beta-first promotion yolunu hem belgelenmiş hem de operatöre görünür tutar.

Bir maintainer yerel npm kimlik doğrulamasına geri dönmek zorundaysa, tüm 1Password CLI (`op`) komutlarını yalnızca ayrılmış bir tmux oturumu içinde çalıştırın. Ana agent shell'den doğrudan `op` çağırmayın; tmux içinde tutmak prompt'ları, uyarıları ve OTP işlemlerini gözlemlenebilir kılar ve tekrarlanan host uyarılarını önler.

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

Maintainer'lar gerçek runbook için özel release dokümanlarını
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
kullanır.

## İlgili

- [Release kanalları](/tr/install/development-channels)
