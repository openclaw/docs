---
read_when:
    - Herkese açık sürüm kanalı tanımları aranıyor
    - Sürüm doğrulamasını veya paket kabulünü çalıştırma
    - Sürüm adlandırması ve yayın temposu aranıyor
summary: Sürüm kanalları, operatör kontrol listesi, doğrulama kutuları, sürüm adlandırması ve yayın ritmi
title: Sürüm politikası
x-i18n:
    generated_at: "2026-05-12T08:46:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01fed02c15c4d1950c055f25117fd236942a8858f843022597fe5f56ba2eb724
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw’ın üç genel kullanıma açık yayın kanalı vardır:

- stable: varsayılan olarak npm `beta` kanalına veya açıkça istendiğinde npm `latest` kanalına yayımlanan etiketli sürümler
- beta: npm `beta` kanalına yayımlanan ön sürüm etiketleri
- dev: `main` dalının hareketli başı

## Sürüm adlandırma

- Kararlı yayın sürümü: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Kararlı düzeltme yayın sürümü: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön sürüm sürümü: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ayı veya günü başına sıfır ekleyerek yazmayın
- `latest`, geçerli yükseltilmiş kararlı npm yayını anlamına gelir
- `beta`, geçerli beta kurulum hedefi anlamına gelir
- Kararlı ve kararlı düzeltme sürümleri varsayılan olarak npm `beta` kanalına yayımlanır; yayın operatörleri açıkça `latest` hedefleyebilir veya incelenmiş bir beta derlemesini daha sonra yükseltebilir
- Her kararlı OpenClaw sürümü npm paketini ve macOS uygulamasını birlikte gönderir;
  beta sürümleri normalde önce npm/paket yolunu doğrular ve yayımlar; Mac
  uygulaması derleme/imzalama/noter onayı, açıkça istenmediği sürece kararlı sürüme ayrılır

## Yayın sıklığı

- Yayınlar önce beta üzerinden ilerler
- Kararlı sürüm, yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar normalde yayınları geçerli `main` dalından oluşturulan bir
  `release/YYYY.M.D` dalından keser; böylece yayın doğrulaması ve düzeltmeleri
  `main` üzerindeki yeni geliştirmeyi engellemez
- Bir beta etiketi gönderilmiş veya yayımlanmışsa ve düzeltme gerekiyorsa, bakımcılar
  eski beta etiketini silmek veya yeniden oluşturmak yerine sonraki `-beta.N` etiketini keser
- Ayrıntılı yayın prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca bakımcılara açıktır

## Yayın operatörü kontrol listesi

Bu kontrol listesi yayın akışının genel yapısıdır. Özel kimlik bilgileri,
imzalama, noter onayı, dist-tag kurtarma ve acil geri alma ayrıntıları
yalnızca bakımcılara açık yayın çalışma kılavuzunda kalır.

1. Geçerli `main` dalından başlayın: en son değişiklikleri çekin, hedef commit’in gönderildiğini
   ve geçerli `main` CI durumunun ondan dal oluşturmak için yeterince yeşil olduğunu doğrulayın.
2. Üstteki `CHANGELOG.md` bölümünü gerçek commit geçmişinden `/changelog` ile yeniden yazın,
   girdileri kullanıcı odaklı tutun, commit’leyin, gönderin ve dallanmadan önce bir kez daha rebase/pull yapın.
3. Yayın uyumluluk kayıtlarını
   `src/plugins/compat/registry.ts` ve
   `src/commands/doctor/shared/deprecation-compat.ts` içinde gözden geçirin. Süresi dolmuş
   uyumluluğu yalnızca yükseltme yolu kapsanmaya devam ettiğinde kaldırın veya neden bilinçli olarak
   taşındığını kaydedin.
4. Geçerli `main` dalından `release/YYYY.M.D` oluşturun; normal yayın işini
   doğrudan `main` üzerinde yapmayın.
5. Amaçlanan etiket için gereken her sürüm konumunu yükseltin, ardından
   `pnpm release:prep` çalıştırın. Bu komut Plugin sürümlerini, Plugin envanterini, yapılandırma
   şemasını, paketlenmiş kanal yapılandırma metaverisini, yapılandırma belgeleri temelini, Plugin SDK
   dışa aktarımlarını ve Plugin SDK API temelini doğru sırayla yeniler. Etiketlemeden önce oluşan
   üretilmiş sapmaları commit’leyin. Ardından yerel deterministik ön kontrolü çalıştırın:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` ve `pnpm release:check`.
6. `OpenClaw NPM Release` işini `preflight_only=true` ile çalıştırın. Bir etiket var olmadan önce,
   yalnızca doğrulama amaçlı ön kontrol için tam 40 karakterlik yayın dalı SHA’sına izin verilir.
   Başarılı `preflight_run_id` değerini saklayın.
7. Yayın dalı, etiket veya tam commit SHA’sı için `Full Release Validation` ile tüm ön yayın
   testlerini başlatın. Bu, dört büyük yayın test kutusu için tek manuel giriş noktasıdır:
   Vitest, Docker, QA Lab ve Package.
8. Doğrulama başarısız olursa yayın dalında düzeltin ve düzeltmeyi kanıtlayan en küçük başarısız
   dosyayı, kanalı, workflow job’ını, paket profilini, sağlayıcıyı veya model izin listesini yeniden çalıştırın.
   Tam şemsiyeyi yalnızca değişen yüzey önceki kanıtı geçersiz kıldığında yeniden çalıştırın.
9. Beta için `vYYYY.M.D-beta.N` etiketleyin, ardından eşleşen `release/YYYY.M.D` dalından
   `OpenClaw Release Publish` çalıştırın. Bu iş `pnpm plugins:sync:check` doğrular,
   yayımlanabilir tüm Plugin paketlerini npm’e ve aynı seti paralel olarak ClawHub’a gönderir,
   ardından Plugin npm yayını başarılı olur olmaz hazırlanmış OpenClaw npm ön kontrol
   yapıtını eşleşen dist-tag ile yükseltir.
   OpenClaw npm yayın alt işi başarılı olduktan sonra, tam eşleşen
   `CHANGELOG.md` bölümünden eşleşen GitHub release/prerelease sayfasını oluşturur veya günceller.
   npm `latest` kanalına yayımlanan kararlı sürümler GitHub latest release olur; npm `beta` kanalında
   tutulan kararlı bakım sürümleri GitHub `latest=false` ile oluşturulur.
   OpenClaw npm yayımlanırken ClawHub yayımlaması hâlâ çalışıyor olabilir, ancak
   yayın yayımlama workflow’u alt çalışma kimliklerini hemen yazdırır. Varsayılan olarak ClawHub’ı
   gönderdikten sonra beklemez; bu nedenle OpenClaw npm kullanılabilirliği daha yavaş ClawHub onayları
   veya kayıt işleri tarafından engellenmez. ClawHub’ın workflow tamamlanmasını engellemesi gerektiğinde
   `wait_for_clawhub=true` ayarlayın. ClawHub yolu geçici CLI bağımlılık kurulum hatalarını yeniden dener,
   bir önizleme hücresi aksasa bile önizlemeden geçen Plugin’leri yayımlar ve kısmi yayınların görünür
   ve yeniden denenebilir kalması için beklenen her Plugin sürümü için kayıt doğrulamasıyla sona erer.
   Yayından sonra GitHub prerelease’i, npm `beta` dist-tag’lerini, npm bütünlüğünü,
   yayımlanmış kurulum yolunu, ClawHub tam sürümlerini, ClawHub yapıtlarını ve alt workflow sonuçlarını
   tek komuttan doğrulamak için
   `pnpm release:verify-beta -- YYYY.M.D-beta.N --openclaw-npm-run <run-id> --plugin-npm-run <run-id> --plugin-clawhub-run <run-id>`
   çalıştırın. ClawHub yan işi yalnızca yeniden denenebilir işlerde başarısız olduysa ve yerinde yeniden
   çalıştırılması gerekiyorsa `--rerun-failed-clawhub` ekleyin.
   Ardından yayımlanmış `openclaw@YYYY.M.D-beta.N` veya
   `openclaw@beta` paketine karşı yayın sonrası paket kabulünü çalıştırın. Gönderilmiş veya yayımlanmış
   bir ön sürümün düzeltmeye ihtiyacı varsa sonraki eşleşen ön sürüm numarasını kesin; eski ön sürümü
   silmeyin veya yeniden yazmayın.
10. Kararlı sürüm için yalnızca incelenmiş beta veya yayın adayı gerekli doğrulama kanıtına sahip olduktan
    sonra devam edin. Kararlı npm yayını da başarılı ön kontrol yapıtını `preflight_run_id` ile yeniden
    kullanarak `OpenClaw Release Publish` üzerinden geçer; kararlı macOS yayın hazırlığı ayrıca
    paketlenmiş `.zip`, `.dmg`, `.dSYM.zip` ve `main` üzerindeki güncellenmiş `appcast.xml` gerektirir.
    Özel macOS yayın workflow’u, yayın varlıkları doğrulandıktan sonra imzalı appcast’i otomatik olarak
    herkese açık `main` dalına yayımlar; dal koruması doğrudan göndermeyi engellerse bir appcast PR’ı
    açar veya günceller.
11. Yayından sonra npm yayın sonrası doğrulayıcısını, yayın sonrası kanal kanıtına ihtiyacınız olduğunda
    isteğe bağlı bağımsız yayımlanmış-npm Telegram E2E’yi, gerektiğinde dist-tag yükseltmesini çalıştırın,
    oluşturulan GitHub release sayfasını doğrulayın ve yayın duyurusu adımlarını çalıştırın.

## Yayın ön kontrolü

- Sürüm ön uçuşundan önce `pnpm check:test-types` çalıştırın; böylece test TypeScript’i daha hızlı yerel `pnpm check` geçidi dışında da kapsanır
- Sürüm ön uçuşundan önce `pnpm check:architecture` çalıştırın; böylece daha kapsamlı içe aktarma döngüsü ve mimari sınır denetimleri daha hızlı yerel geçit dışında yeşil olur
- `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın; böylece beklenen `dist/*` sürüm yapıtları ve Control UI paketi, paket doğrulama adımı için mevcut olur
- Kök sürüm artırmasından sonra ve etiketlemeden önce `pnpm release:prep` çalıştırın. Bu komut, sürüm/yapılandırma/API değişikliğinden sonra sıkça sapma gösteren tüm deterministik sürüm üreticilerini çalıştırır: plugin sürümleri, plugin envanteri, temel yapılandırma şeması, paketlenen kanal yapılandırma meta verileri, yapılandırma dokümantasyonu başlangıç değeri, plugin SDK dışa aktarımları ve plugin SDK API başlangıç değeri. `pnpm release:check`, bu korumaları denetim modunda yeniden çalıştırır ve paket sürüm denetimlerini çalıştırmadan önce bulduğu tüm üretilmiş sapma hatalarını tek geçişte raporlar.
- Sürüm onayından önce manuel `Full Release Validation` iş akışını çalıştırarak tüm ön sürüm test kutularını tek bir giriş noktasından başlatın. Bir dal, etiket veya tam commit SHA kabul eder, manuel `CI` tetikler ve kurulum smoke, paket kabulü, çapraz OS paket denetimleri, QA Lab paritesi, Matrix ve Telegram hatları için `OpenClaw Release Checks` tetikler. Kararlı/varsayılan çalıştırmalar, kapsamlı canlı/E2E ve Docker sürüm yolu bekletmesini `run_release_soak=true` arkasında tutar; `release_profile=full` bekletmeyi zorunlu kılar. `release_profile=full` ve `rerun_group=all` ile, sürüm denetimlerinden gelen `release-package-under-test` yapıtına karşı paket Telegram E2E’yi de çalıştırır. Bir beta yayımladıktan sonra, sürüm denetimleri, Package Acceptance ve paket Telegram E2E genelinde gönderilmiş npm paketini sürüm tarball’ını yeniden oluşturmadan yeniden kullanmak için `release_package_spec` sağlayın. Telegram’ın sürüm doğrulamasının geri kalanından farklı bir yayımlanmış paket kullanması gerektiğinde yalnızca `npm_telegram_package_spec` sağlayın. Package Acceptance’ın sürüm paketi belirtiminden farklı bir yayımlanmış paket kullanması gerektiğinde `package_acceptance_package_spec` sağlayın. Özel kanıt raporunun, Telegram E2E’yi zorlamadan doğrulamanın yayımlanmış bir npm paketiyle eşleştiğini kanıtlaması gerektiğinde `evidence_package_spec` sağlayın. Örnek:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Sürüm çalışması devam ederken bir paket adayı için yan kanal kanıtı istediğinizde manuel `Package Acceptance` iş akışını çalıştırın. `openclaw@beta`, `openclaw@latest` veya kesin bir sürüm için `source=npm`; geçerli `workflow_ref` donanımıyla güvenilir bir `package_ref` dalı/etiketi/SHA’sını paketlemek için `source=ref`; gerekli SHA-256 ile bir HTTPS tarball için `source=url`; ya da başka bir GitHub Actions çalıştırması tarafından yüklenen tarball için `source=artifact` kullanın. İş akışı adayı `package-under-test` olarak çözümler, Docker E2E sürüm zamanlayıcısını bu tarball’a karşı yeniden kullanır ve aynı tarball’a karşı `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` ile Telegram QA çalıştırabilir. Seçilen Docker hatları `published-upgrade-survivor` içerdiğinde, paket yapıtı adaydır ve `published_upgrade_survivor_baseline` yayımlanmış başlangıç değerini seçer. `update-restart-auth`, aday paketi hem kurulu CLI hem de package-under-test olarak kullanır; böylece aday güncelleme komutunun yönetilen yeniden başlatma yolunu çalıştırır.
  Örnek: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Yaygın profiller:
  - `smoke`: kurulum/kanal/ajan, gateway ağı ve yapılandırma yeniden yükleme hatları
  - `package`: OpenWebUI veya canlı ClawHub olmadan yapıt-yerel paket/güncelleme/yeniden başlatma/plugin hatları
  - `product`: paket profiline ek olarak MCP kanalları, cron/alt ajan temizliği,
    OpenAI web araması ve OpenWebUI
  - `full`: OpenWebUI ile Docker sürüm yolu parçaları
  - `custom`: odaklı bir yeniden çalıştırma için kesin `docker_lanes` seçimi
- Yalnızca sürüm adayı için tam normal CI kapsamına ihtiyaç duyduğunuzda manuel `CI` iş akışını doğrudan çalıştırın. Manuel CI tetiklemeleri değişiklik kapsamlandırmasını atlar ve Linux Node parçalarını, paketlenen-plugin parçalarını, kanal sözleşmelerini, Node 22 uyumluluğunu, `check`, `check-additional`, build smoke, dokümantasyon denetimlerini, Python skills, Windows, macOS, Android ve Control UI i18n hatlarını zorunlu kılar.
  Örnek: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Sürüm telemetrisini doğrularken `pnpm qa:otel:smoke` çalıştırın. QA-lab’i yerel bir OTLP/HTTP alıcısı üzerinden çalıştırır ve Opik, Langfuse veya başka bir harici toplayıcı gerektirmeden dışa aktarılan iz span adlarını, sınırlandırılmış öznitelikleri ve içerik/tanımlayıcı redaksiyonunu doğrular.
- Her etiketli sürümden önce `pnpm release:check` çalıştırın
- Etiket mevcut olduktan sonra mutasyon yapan yayımlama dizisi için `OpenClaw Release Publish` çalıştırın. Bunu `release/YYYY.M.D` üzerinden (veya main’den erişilebilir bir etiket yayımlarken `main` üzerinden) tetikleyin, sürüm etiketini ve başarılı OpenClaw npm `preflight_run_id` değerini iletin ve odaklı bir onarım çalıştırmıyorsanız varsayılan plugin yayımlama kapsamını `all-publishable` olarak bırakın. İş akışı plugin npm yayımlamasını, plugin ClawHub yayımlamasını ve OpenClaw npm yayımlamasını sıralı hale getirir; böylece çekirdek paket, dışsallaştırılmış plugin’lerinden önce yayımlanmaz.
- Sürüm denetimleri artık ayrı bir manuel iş akışında çalışır:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`, sürüm onayından önce QA Lab mock parite hattını, hızlı canlı Matrix profilini ve Telegram QA hattını da çalıştırır. Canlı hatlar `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI kimlik bilgisi kiralamalarını kullanır. Tam Matrix taşıma, medya ve E2EE envanterini paralel istediğinizde manuel `QA-Lab - All Lanes` iş akışını `matrix_profile=all` ve `matrix_shards=true` ile çalıştırın.
- Çapraz OS kurulum ve yükseltme çalışma zamanı doğrulaması, yeniden kullanılabilir iş akışını doğrudan çağıran genel `OpenClaw Release Checks` ve `Full Release Validation` kapsamındadır:
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Bu ayrım bilinçlidir: gerçek npm sürüm yolunu kısa, deterministik ve yapıt odaklı tutar; daha yavaş canlı denetimler ise yayımlamayı durdurmamak veya engellememek için kendi hattında kalır
- Sır taşıyan sürüm denetimleri `Full Release
Validation` üzerinden ya da `main`/sürüm iş akışı ref’inden tetiklenmelidir; böylece iş akışı mantığı ve sırlar kontrollü kalır
- `OpenClaw Release Checks`, çözümlenen commit bir OpenClaw dalından veya sürüm etiketinden erişilebilir olduğu sürece dal, etiket veya tam commit SHA kabul eder
- `OpenClaw NPM Release` yalnızca doğrulama ön uçuşu, itilmiş bir etiket gerektirmeden geçerli tam 40 karakterlik iş akışı dalı commit SHA’sını da kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek yayımlamaya yükseltilemez
- SHA modunda iş akışı yalnızca paket meta verisi denetimi için `v<package.json version>` sentezler; gerçek yayımlama hâlâ gerçek bir sürüm etiketi gerektirir
- Her iki iş akışı da gerçek yayımlama ve yükseltme yolunu GitHub tarafından barındırılan çalıştırıcılarda tutarken, mutasyon yapmayan doğrulama yolu daha büyük Blacksmith Linux çalıştırıcılarını kullanabilir
- Bu iş akışı
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  komutunu hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` iş akışı sırlarını kullanarak çalıştırır
- npm sürüm ön uçuşu artık ayrı sürüm denetimleri hattını beklemez
- Bir sürüm adayını yerelde etiketlemeden önce
  `RELEASE_TAG=vYYYY.M.D-beta.N pnpm release:fast-pretag-check` çalıştırın. Yardımcı, GitHub yayımlama iş akışı başlamadan önce yaygın onay engelleyici hataları yakalayan sırayla hızlı sürüm korumalarını, plugin npm/ClawHub sürüm denetimlerini, derlemeyi, UI derlemesini ve `release:openclaw:npm:check` komutunu çalıştırır.
- Onaydan önce
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  komutunu (veya eşleşen beta/düzeltme etiketini) çalıştırın
- npm yayımlamasından sonra, yayımlanmış registry kurulum yolunu yeni bir geçici önek içinde doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  komutunu (veya eşleşen beta/düzeltme sürümünü) çalıştırın
- Bir beta yayımlamasından sonra, paylaşılan kiralanmış Telegram kimlik bilgisi havuzunu kullanarak yayımlanmış npm paketine karşı kurulu paket onboarding’ini, Telegram kurulumunu ve gerçek Telegram E2E’yi doğrulamak için `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` çalıştırın. Yerel maintainer tek seferlik çalıştırmaları Convex değişkenlerini atlayabilir ve üç `OPENCLAW_QA_TELEGRAM_*` ortam kimlik bilgisini doğrudan iletebilir.
- Bir maintainer makinesinden tam yayımlama sonrası beta smoke çalıştırmak için `pnpm release:beta-smoke -- --beta betaN` kullanın. Yardımcı, Parallels npm güncelleme/yeni hedef doğrulamasını çalıştırır, `NPM Telegram Beta E2E` tetikler, kesin iş akışı çalıştırmasını yoklar, yapıtı indirir ve Telegram raporunu yazdırır.
- Maintainer’lar aynı yayımlama sonrası denetimi GitHub Actions üzerinden manuel `NPM Telegram Beta E2E` iş akışıyla çalıştırabilir. Bu iş akışı bilinçli olarak yalnızca manueldir ve her merge işleminde çalışmaz.
- Maintainer sürüm otomasyonu artık ön uçuş-sonra-yükseltme kullanır:
  - gerçek npm yayımlaması başarılı bir npm `preflight_run_id` değerini geçmelidir
  - gerçek npm yayımlaması, başarılı ön uçuş çalıştırmasıyla aynı `main` veya
    `release/YYYY.M.D` dalından tetiklenmelidir
  - kararlı npm sürümleri varsayılan olarak `beta` kullanır
  - kararlı npm yayımlaması, iş akışı girdisi üzerinden açıkça `latest` hedefleyebilir
  - token tabanlı npm dist-tag mutasyonu artık güvenlik nedeniyle
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    içinde yer alır; çünkü genel repo OIDC-only yayımlamayı korurken `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirir
  - genel `macOS Release` yalnızca doğrulama içindir; bir etiket yalnızca bir sürüm dalında bulunuyor ancak iş akışı `main` üzerinden tetikleniyorsa
    `public_release_branch=release/YYYY.M.D` ayarlayın
  - gerçek özel mac yayımlaması başarılı özel mac `preflight_run_id` ve `validate_run_id` değerlerini geçmelidir
  - gerçek yayımlama yolları, yapıtları yeniden oluşturmak yerine hazırlanmış yapıtları yükseltir
- `YYYY.M.D-N` gibi kararlı düzeltme sürümleri için yayımlama sonrası doğrulayıcı, aynı geçici önek yükseltme yolunu `YYYY.M.D` sürümünden `YYYY.M.D-N` sürümüne de denetler; böylece sürüm düzeltmeleri eski global kurulumları sessizce temel kararlı yükte bırakamaz
- npm sürüm ön uçuşu, tarball hem `dist/control-ui/index.html` hem de boş olmayan bir `dist/control-ui/assets/` yükü içermedikçe kapalı başarısız olur; böylece boş bir tarayıcı panosunu yeniden göndermeyiz
- Yayımlama sonrası doğrulama, yayımlanmış plugin giriş noktalarının ve paket meta verilerinin kurulu registry düzeninde mevcut olduğunu da denetler. Eksik plugin çalışma zamanı yükleri gönderen bir sürüm, postpublish doğrulayıcısında başarısız olur ve `latest` sürümüne yükseltilemez.
- `pnpm test:install:smoke`, aday güncelleme tarball’ı üzerinde npm paket `unpackedSize` bütçesini de zorunlu kılar; böylece installer e2e, yanlışlıkla oluşan paket şişmesini sürüm yayımlama yolundan önce yakalar
- Sürüm çalışması CI planlamasına, extension zamanlama manifestlerine veya extension test matrislerine dokunduysa, sürüm notlarının eski bir CI düzenini açıklamaması için onaydan önce `.github/workflows/plugin-prerelease.yml` içinden planner-owned `plugin-prerelease-extension-shard` matris çıktılarını yeniden üretin ve gözden geçirin
- Kararlı macOS sürüm hazır oluşu, güncelleyici yüzeylerini de içerir:
  - GitHub sürümü paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` ile sonuçlanmalıdır
  - yayımlamadan sonra `main` üzerindeki `appcast.xml` yeni kararlı zip’e işaret etmelidir; özel macOS yayımlama iş akışı bunu otomatik olarak commit eder veya doğrudan push engellendiğinde bir appcast PR açar
  - paketlenmiş uygulama, hata ayıklama olmayan bir bundle id, boş olmayan bir Sparkle feed URL’si ve bu sürüm için kanonik Sparkle build tabanına eşit ya da ondan yüksek bir `CFBundleVersion` korumalıdır

## Sürüm test kutuları

`Full Release Validation`, operatörlerin tüm ön sürüm testlerini tek bir giriş
noktasından başlatma yoludur. Hızla değişen bir dalda sabitlenmiş commit kanıtı
için, her alt workflow'un hedef SHA'ya sabitlenmiş geçici bir daldan çalışması
amacıyla yardımcıyı kullanın:

```bash
pnpm ci:full-release --sha <full-sha>
```

Yardımcı `release-ci/<sha>-...` dalını gönderir, bu daldan `ref=<sha>` ile
`Full Release Validation` başlatır, her alt workflow `headSha` değerinin hedefle
eşleştiğini doğrular, ardından geçici dalı siler. Bu, yanlışlıkla daha yeni bir
`main` alt çalıştırmasını kanıtlamayı önler.

Sürüm dalı veya etiket doğrulaması için, bunu güvenilen `main` workflow
ref'inden çalıştırın ve sürüm dalını ya da etiketini `ref` olarak geçirin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow hedef ref'i çözer, `target_ref=<release-ref>` ile manuel `CI`
başlatır, `OpenClaw Release Checks` başlatır, pakete dönük kontroller için
üst `release-package-under-test` artifact'ı hazırlar ve `release_profile=full`
olup `rerun_group=all` olduğunda ya da `release_package_spec` veya
`npm_telegram_package_spec` ayarlandığında bağımsız paket Telegram E2E
başlatır. Ardından `OpenClaw Release
Checks`, kurulum smoke, çapraz işletim sistemi sürüm kontrolleri, soak
etkinken canlı/E2E Docker sürüm yolu kapsamı, Telegram paket QA ile Package
Acceptance, QA Lab eşliği, canlı Matrix ve canlı Telegram'a yayılır. Tam bir
çalıştırma yalnızca `Full Release Validation`
özetinde `normal_ci` ve `release_checks` başarılı görünüyorsa kabul edilebilir.
full/all modunda `npm_telegram` alt çalıştırması da başarılı olmalıdır; full/all
dışında, yayımlanmış bir `release_package_spec` veya `npm_telegram_package_spec`
sağlanmadıkça atlanır. Son doğrulayıcı özeti her alt çalıştırma için en yavaş
iş tablolarını içerir, böylece sürüm yöneticisi log indirmeden mevcut kritik
yolu görebilir.
Tam aşama matrisi, kesin workflow iş adları, stable ile full profil farkları,
artifact'lar ve odaklı yeniden çalıştırma tutamaçları için
[Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.
Alt workflow'lar, hedef `ref` daha eski bir sürüm dalını veya etiketini gösterse
bile `Full Release
Validation` çalıştıran güvenilen ref'ten, normalde `--ref main` üzerinden
başlatılır. Ayrı bir Full Release Validation workflow-ref girdisi yoktur;
güvenilen harness'ı workflow çalıştırma ref'ini seçerek belirleyin.
Hareketli `main` üzerinde kesin commit kanıtı için `--ref main -f ref=<sha>`
kullanmayın; ham commit SHA'ları workflow dispatch ref'i olamaz, bu nedenle
sabitlenmiş geçici dalı oluşturmak için `pnpm ci:full-release --sha <sha>`
kullanın.

Canlı/provider kapsamını seçmek için `release_profile` kullanın:

- `minimum`: en hızlı sürüm açısından kritik OpenAI/core canlı ve Docker yolu
- `stable`: sürüm onayı için minimuma ek olarak stable provider/backend kapsamı
- `full`: stable'a ek olarak geniş danışma provider/medya kapsamı

Sürümü engelleyen hatlar yeşil olduğunda ve terfi öncesinde kapsamlı canlı/E2E,
Docker sürüm yolu ve sınırlı yayımlanmış yükseltme dayanıklılığı taraması
istediğinizde `stable` ile `run_release_soak=true` kullanın. Bu tarama, son dört
stable paketin yanı sıra sabitlenmiş `2026.4.23` ve `2026.5.2` temel çizgilerini
ve daha eski `2026.4.15` kapsamını kapsar; yinelenen temel çizgiler kaldırılır
ve her temel çizgi kendi Docker runner işine bölünür. `full`,
`run_release_soak=true` anlamına gelir.

`OpenClaw Release Checks`, hedef ref'i bir kez `release-package-under-test`
olarak çözmek için güvenilen workflow ref'ini kullanır ve soak çalıştığında bu
artifact'ı çapraz işletim sistemi, Package Acceptance ve sürüm yolu Docker
kontrollerinde yeniden kullanır. Bu, pakete dönük tüm kutuları aynı baytlarda
tutar ve tekrarlanan paket derlemelerini önler.
Beta zaten npm'deyse, `release_package_spec=openclaw@YYYY.M.D-beta.N` ayarlayın;
böylece sürüm kontrolleri gönderilmiş paketi bir kez indirir, derleme kaynak
SHA'sını `dist/build-info.json` içinden çıkarır ve bu artifact'ı çapraz işletim
sistemi, Package Acceptance, sürüm yolu Docker ve paket Telegram hatları için
yeniden kullanır.
Çapraz işletim sistemi OpenAI kurulum smoke'u, repo/kuruluş değişkeni
ayarlandığında `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır; aksi halde
`openai/gpt-5.4` kullanır, çünkü bu hat en yavaş varsayılan modeli kıyaslamak
yerine paket kurulumunu, onboarding'i, gateway başlatmayı ve tek bir canlı ajan
turunu kanıtlar. Daha geniş canlı provider matrisi, modele özgü kapsamın yeridir.

Sürüm aşamasına göre bu varyantları kullanın:

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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Odaklı bir düzeltmeden sonraki ilk yeniden çalıştırma olarak tam şemsiyeyi
kullanmayın. Bir kutu başarısız olursa, sonraki kanıt için başarısız alt
workflow'u, işi, Docker hattını, paket profilini, model provider'ını veya QA
hattını kullanın. Tam şemsiyeyi yalnızca düzeltme paylaşılan sürüm orkestrasyonunu
değiştirdiyse ya da önceki tüm kutu kanıtlarını bayat hale getirdiyse yeniden
çalıştırın. Şemsiyenin son doğrulayıcısı kaydedilmiş alt workflow çalıştırma
kimliklerini yeniden kontrol eder, bu nedenle bir alt workflow başarıyla yeniden
çalıştırıldıktan sonra yalnızca başarısız `Verify full validation` üst işini
yeniden çalıştırın.

Sınırlı kurtarma için şemsiyeye `rerun_group` geçirin. `all` gerçek sürüm adayı
çalıştırmasıdır, `ci` yalnızca normal CI altını çalıştırır, `plugin-prerelease`
yalnızca sürüme özel plugin altını çalıştırır, `release-checks` her sürüm
kutusunu çalıştırır ve daha dar sürüm grupları `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ve `npm-telegram`dır.
Odaklı `npm-telegram` yeniden çalıştırmaları `release_package_spec` veya
`npm_telegram_package_spec` gerektirir; `release_profile=full` ile full/all
çalıştırmaları release-checks paket artifact'ını kullanır. Odaklı çapraz işletim
sistemi yeniden çalıştırmaları `cross_os_suite_filter=windows/packaged-upgrade`
veya başka bir işletim sistemi/suite filtresi ekleyebilir. QA release-check
başarısızlıkları danışma niteliğindedir; yalnızca QA başarısızlığı sürüm
doğrulamasını engellemez.

### Vitest

Vitest kutusu manuel `CI` alt workflow'udur. Manuel CI, changed kapsamını bilerek
atlar ve sürüm adayı için normal test grafiğini zorunlu kılar: Linux Node
parçaları, paketlenmiş Plugin parçaları, kanal sözleşmeleri, Node 22 uyumluluğu,
`check`, `check-additional`, build smoke, doküman kontrolleri, Python skills,
Windows, macOS, Android ve Control UI i18n.

Bu kutuyu "kaynak ağacı tam normal test suite'ini geçti mi?" sorusunu yanıtlamak
için kullanın. Bu, sürüm yolu ürün doğrulamasıyla aynı değildir. Saklanacak
kanıtlar:

- başlatılan `CI` çalıştırma URL'sini gösteren `Full Release Validation` özeti
- kesin hedef SHA üzerinde yeşil `CI` çalıştırması
- regresyonları incelerken CI işlerinden başarısız veya yavaş parça adları
- bir çalıştırmanın performans analizine ihtiyaç duyduğu durumlarda
  `.artifacts/vitest-shard-timings.json` gibi Vitest zamanlama artifact'ları

Manuel CI'yi doğrudan yalnızca sürüm deterministik normal CI gerektiriyor ancak
Docker, QA Lab, canlı, çapraz işletim sistemi veya paket kutularını
gerektirmiyorsa çalıştırın:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker kutusu, `openclaw-live-and-e2e-checks-reusable.yml` üzerinden
`OpenClaw Release Checks` içinde ve sürüm modu `install-smoke` workflow'unda
yer alır. Sürüm adayını yalnızca kaynak düzeyi testler yerine paketlenmiş Docker
ortamları üzerinden doğrular.

Sürüm Docker kapsamı şunları içerir:

- yavaş Bun global kurulum smoke'u etkin olan tam kurulum smoke'u
- hedef SHA'ya göre kök Dockerfile smoke imajı hazırlama/yeniden kullanımı; QR,
  root/gateway ve installer/Bun smoke işleri ayrı install-smoke parçaları olarak
  çalışır
- depo E2E hatları
- sürüm yolu Docker parçaları: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` ve `plugins-runtime-install-h`
- istendiğinde `plugins-runtime-services` parçası içinde OpenWebUI kapsamı
- bölünmüş paketlenmiş plugin kurulum/kaldırma hatları
  `bundled-plugin-install-uninstall-0` ile
  `bundled-plugin-install-uninstall-23` arası
- sürüm kontrolleri canlı suite'leri içerdiğinde canlı/E2E provider suite'leri
  ve Docker canlı model kapsamı

Yeniden çalıştırmadan önce Docker artifact'larını kullanın. Sürüm yolu zamanlayıcı
`.artifacts/docker-tests/` dizinini hat logları, `summary.json`,
`failures.json`, aşama zamanlamaları, zamanlayıcı plan JSON'u ve yeniden
çalıştırma komutlarıyla birlikte yükler. Odaklı kurtarma için tüm sürüm
parçalarını yeniden çalıştırmak yerine yeniden kullanılabilir canlı/E2E
workflow'unda `docker_lanes=<lane[,lane]>` kullanın. Oluşturulan yeniden
çalıştırma komutları, kullanılabilir olduğunda önceki `package_artifact_run_id`
ve hazırlanmış Docker imajı girdilerini içerir; böylece başarısız bir hat aynı
tarball'ı ve GHCR imajlarını yeniden kullanabilir.

### QA Lab

QA Lab kutusu da `OpenClaw Release Checks` parçasıdır. Vitest ve Docker paket
mekaniklerinden ayrı olarak ajan davranışı ve kanal düzeyi sürüm kapısıdır.

Sürüm QA Lab kapsamı şunları içerir:

- ajan eşlik paketiyle OpenAI aday hattını Opus 4.6 temel çizgisiyle karşılaştıran
  mock eşlik hattı
- `qa-live-shared` ortamını kullanan hızlı canlı Matrix QA profili
- Convex CI kimlik bilgisi kiralamalarını kullanan canlı Telegram QA hattı
- sürüm telemetrisinin açık yerel kanıta ihtiyaç duyduğu durumlarda
  `pnpm qa:otel:smoke`

Bu kutuyu "sürüm QA senaryolarında ve canlı kanal akışlarında doğru davranıyor
mu?" sorusunu yanıtlamak için kullanın. Sürümü onaylarken eşlik, Matrix ve
Telegram hatları için artifact URL'lerini saklayın. Tam Matrix kapsamı, varsayılan
sürüm açısından kritik hat yerine manuel parçalanmış QA-Lab çalıştırması olarak
kullanılabilir kalır.

### Paket

Paket kutusu kurulabilir ürün kapısıdır. `Package Acceptance` ve
`scripts/resolve-openclaw-package-candidate.mjs` çözücüsü tarafından desteklenir.
Çözücü, adayı Docker E2E tarafından tüketilen `package-under-test` tarball'ına
normalleştirir, paket envanterini doğrular, paket sürümünü ve SHA-256 değerini
kaydeder ve workflow harness ref'ini paket kaynak ref'inden ayrı tutar.

Desteklenen aday kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya kesin bir OpenClaw sürüm
  version
- `source=ref`: seçilen `workflow_ref` harness'ı ile güvenilen bir `package_ref`
  dalını, etiketini veya tam commit SHA'sını paketle
- `source=url`: gerekli `package_sha256` ile bir HTTPS `.tgz` indir
- `source=artifact`: başka bir GitHub Actions çalıştırması tarafından yüklenen
  `.tgz` dosyasını yeniden kullan

`OpenClaw Release Checks`, Package Acceptance'ı `source=artifact`, hazırlanmış sürüm paket artifaktı, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`, `telegram_mode=mock-openai` ile çalıştırır. Package Acceptance; geçiş, güncelleme, yapılandırılmış kimlik doğrulama güncellemesi yeniden başlatması, canlı ClawHub Skills kurulumu, eski Plugin bağımlılığı temizliği, çevrimdışı Plugin fikstürleri, Plugin güncellemesi ve Telegram paket QA kapsamını aynı çözümlenmiş tarball üzerinde tutar. Engelleyici sürüm denetimleri varsayılan en son yayımlanmış paket temelini kullanır; `run_release_soak=true` veya `release_profile=full`, `2026.4.23` sürümünden `latest` sürümüne kadar tüm kararlı npm'de yayımlanmış temellere ve bildirilen sorun fikstürlerine genişler. Zaten gönderilmiş bir aday için Package Acceptance'ı `source=npm` ile, yayımlamadan önce SHA destekli yerel npm tarball için `source=ref`/`source=artifact` ile kullanın. Bu, daha önce Parallels gerektiren paket/güncelleme kapsamının çoğu için GitHub yerelindeki alternatiftir. İşletim sistemine özgü onboarding, yükleyici ve platform davranışı için çapraz işletim sistemi sürüm denetimleri hâlâ önemlidir, ancak paket/güncelleme ürün doğrulaması Package Acceptance'ı tercih etmelidir.

Güncelleme ve Plugin doğrulaması için kanonik kontrol listesi
[Testing updates and plugins](/tr/help/testing-updates-plugins) sayfasıdır. Bir
Plugin kurulumu/güncellemesi, doctor temizliği veya yayımlanmış paket geçiş değişikliğini hangi yerel, Docker, Package Acceptance ya da sürüm denetimi kulvarının kanıtladığına karar verirken bunu kullanın.
Her kararlı `2026.4.23+` paketinden kapsamlı yayımlanmış güncelleme geçişi,
Full Release CI'ın parçası değil, ayrı bir manuel `Update Migration` iş akışıdır.

Eski package-acceptance toleransı bilinçli olarak süreyle sınırlanmıştır. `2026.4.25` sürümüne kadar paketler, npm'e zaten yayımlanmış metadata boşlukları için uyumluluk yolunu kullanabilir: tarball'da eksik özel QA envanter girdileri, eksik `gateway install --wrapper`, tarball'dan türetilmiş git fikstüründe eksik yama dosyaları, eksik kalıcı `update.channel`, eski Plugin kurulum kaydı konumları, eksik marketplace kurulum kaydı kalıcılığı ve `plugins update` sırasında yapılandırma metadata geçişi. Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel derleme metadata damga dosyaları için uyarı verebilir. Daha sonraki paketler modern paket sözleşmelerini karşılamalıdır; aynı boşluklar sürüm doğrulamasını başarısız kılar.

Sürüm sorusu gerçek bir kurulabilir paketle ilgili olduğunda daha geniş Package Acceptance profilleri kullanın:

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

- `smoke`: hızlı paket kurulumu/kanal/agent, Gateway ağı ve yapılandırma
  yeniden yükleme kulvarları
- `package`: kurulum/güncelleme/yeniden başlatma/Plugin paket sözleşmeleri ve canlı ClawHub
  Skills kurulum kanıtı; bu, sürüm denetimi varsayılanıdır
- `product`: `package` artı MCP kanalları, cron/subagent temizliği, OpenAI web
  araması ve OpenWebUI
- `full`: OpenWebUI ile Docker sürüm yolu parçaları
- `custom`: odaklı yeniden çalıştırmalar için tam `docker_lanes` listesi

Paket adayı Telegram kanıtı için Package Acceptance üzerinde `telegram_mode=mock-openai` veya
`telegram_mode=live-frontier` etkinleştirin. İş akışı çözümlenmiş
`package-under-test` tarball'ını Telegram kulvarına geçirir; bağımsız
Telegram iş akışı, yayım sonrası denetimler için yayımlanmış bir npm spesifikasyonunu hâlâ kabul eder.

## Sürüm yayımlama otomasyonu

`OpenClaw Release Publish`, normal değişiklik yapan yayımlama giriş noktasıdır. Sürümün ihtiyaç duyduğu sırayla trusted-publisher iş akışlarını düzenler:

1. Sürüm etiketini checkout yapar ve commit SHA'sını çözümler.
2. Etiketin `main` veya `release/*` üzerinden erişilebilir olduğunu doğrular.
3. `pnpm plugins:sync:check` çalıştırır.
4. `publish_scope=all-publishable` ve `ref=<release-sha>` ile
   `Plugin NPM Release` tetikler.
5. Aynı scope ve SHA ile `Plugin ClawHub Release` tetikler.
6. Sürüm etiketi, npm dist-tag ve kaydedilmiş `preflight_run_id` ile
   `OpenClaw NPM Release` tetikler.

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

Doğrudan `latest` sürümüne kararlı yükseltme açıkça belirtilir:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Daha düşük seviyeli `Plugin NPM Release` ve `Plugin ClawHub Release` iş akışlarını yalnızca odaklı onarım veya yeniden yayımlama işleri için kullanın. Seçili bir Plugin onarımı için
`plugin_publish_scope=selected` ve `plugins=@openclaw/name` değerlerini
`OpenClaw Release Publish` iş akışına geçirin ya da OpenClaw paketinin yayımlanmaması gerektiğinde alt iş akışını doğrudan tetikleyin.

## NPM iş akışı girdileri

`OpenClaw NPM Release` şu operatör kontrollü girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya `v2026.4.2-beta.1` gibi zorunlu sürüm etiketi; `preflight_only=true` olduğunda yalnızca doğrulama preflight'ı için mevcut tam 40 karakterlik iş akışı dalı commit SHA'sı da olabilir
- `preflight_only`: yalnızca doğrulama/derleme/paket için `true`, gerçek yayımlama yolu için `false`
- `preflight_run_id`: gerçek yayımlama yolunda zorunludur; böylece iş akışı başarılı preflight çalışmasından hazırlanmış tarball'ı yeniden kullanır
- `npm_dist_tag`: yayımlama yolu için npm hedef etiketi; varsayılanı `beta`

`OpenClaw Release Publish` şu operatör kontrollü girdileri kabul eder:

- `tag`: zorunlu sürüm etiketi; zaten mevcut olmalıdır
- `preflight_run_id`: başarılı `OpenClaw NPM Release` preflight çalışma kimliği;
  `publish_openclaw_npm=true` olduğunda zorunludur
- `npm_dist_tag`: OpenClaw paketi için npm hedef etiketi
- `plugin_publish_scope`: varsayılanı `all-publishable`; `selected` değerini yalnızca odaklı onarım işleri için kullanın
- `plugins`: `plugin_publish_scope=selected` olduğunda virgülle ayrılmış `@openclaw/*` paket adları
- `publish_openclaw_npm`: varsayılanı `true`; yalnızca iş akışını sadece Plugin onarım düzenleyicisi olarak kullanırken `false` yapın
- `wait_for_clawhub`: varsayılanı `false`; böylece npm kullanılabilirliği ClawHub sidecar tarafından engellenmez; yalnızca iş akışı tamamlanmasının ClawHub tamamlanmasını da içermesi gerektiğinde `true` yapın

`OpenClaw Release Checks` şu operatör kontrollü girdileri kabul eder:

- `ref`: doğrulanacak dal, etiket veya tam commit SHA. Gizli içeren denetimler,
  çözümlenmiş commit'in bir OpenClaw dalından veya sürüm etiketinden erişilebilir olmasını gerektirir.
- `run_release_soak`: kararlı/varsayılan sürüm denetimlerinde kapsamlı canlı/E2E, Docker sürüm yolu ve all-since upgrade-survivor soak kapsamını seçer. `release_profile=full` tarafından zorunlu olarak açılır.

Kurallar:

- Kararlı ve düzeltme etiketleri `beta` veya `latest` etiketlerinden birine yayımlanabilir
- Beta ön sürüm etiketleri yalnızca `beta` etiketine yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca
  `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` ve `Full Release Validation` her zaman yalnızca doğrulamadır
- Gerçek yayımlama yolu, preflight sırasında kullanılan aynı `npm_dist_tag` değerini kullanmalıdır;
  iş akışı yayımlamadan önce bu metadata'nın devam ettiğini doğrular

## Kararlı npm sürüm sırası

Kararlı bir npm sürümü çıkarırken:

1. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın
   - Bir etiket mevcut olmadan önce, preflight iş akışının yalnızca doğrulama amaçlı kuru çalıştırması için mevcut tam iş akışı dalı commit SHA'sını kullanabilirsiniz
2. Normal önce beta akışı için `npm_dist_tag=beta` seçin veya yalnızca bilinçli olarak doğrudan kararlı yayımlama istediğinizde `latest` seçin
3. Tek bir manuel iş akışından normal CI artı canlı prompt cache, Docker, QA Lab,
   Matrix ve Telegram kapsamı istediğinizde sürüm dalı, sürüm etiketi veya tam commit SHA üzerinde `Full Release Validation` çalıştırın
4. Bilinçli olarak yalnızca deterministik normal test grafiğine ihtiyacınız varsa, bunun yerine sürüm ref'i üzerinde manuel `CI` iş akışını çalıştırın
5. Başarılı `preflight_run_id` değerini kaydedin
6. Aynı `tag`, aynı `npm_dist_tag` ve kaydedilmiş `preflight_run_id` ile
   `OpenClaw Release Publish` çalıştırın; OpenClaw npm paketini yükseltmeden önce dışsallaştırılmış Plugin'leri npm ve ClawHub'a yayımlar
7. Sürüm `beta` üzerinde yayımlandıysa, bu kararlı sürümü `beta` etiketinden `latest` etiketine yükseltmek için özel
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   iş akışını kullanın
8. Sürüm bilinçli olarak doğrudan `latest` etiketine yayımlandıysa ve `beta` aynı kararlı derlemeyi hemen izlemeliyse, her iki dist-tag'i de kararlı sürüme yönlendirmek için aynı özel iş akışını kullanın veya zamanlanmış kendi kendini iyileştiren senkronizasyonunun `beta` etiketini daha sonra taşımasına izin verin

Dist-tag değişikliği güvenlik nedeniyle özel repoda yaşar; çünkü hâlâ `NPM_TOKEN` gerektirirken, herkese açık repo yalnızca OIDC yayımlamayı korur.

Bu, doğrudan yayımlama yolunu ve önce beta yükseltme yolunu hem belgelenmiş hem de operatörün görebileceği durumda tutar.

Bir maintainer yerel npm kimlik doğrulamasına geri dönmek zorundaysa, tüm 1Password
CLI (`op`) komutlarını yalnızca ayrılmış bir tmux oturumu içinde çalıştırın. `op` komutunu ana agent kabuğundan doğrudan çağırmayın; bunu tmux içinde tutmak prompt'ları, uyarıları ve OTP işlemeyi gözlemlenebilir kılar ve yinelenen host uyarılarını önler.

## Herkese açık referanslar

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer'lar gerçek runbook için özel sürüm dokümanlarını
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
konumunda kullanır.

## İlgili

- [Sürüm kanalları](/tr/install/development-channels)
