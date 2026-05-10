---
read_when:
    - Genel kullanıma açık sürüm kanalı tanımları aranıyor
    - Sürüm doğrulaması veya paket kabulü çalıştırma
    - Sürüm adlandırması ve yayın sıklığı aranıyor
summary: Sürüm kulvarları, operatör kontrol listesi, doğrulama kutuları, sürüm adlandırması ve yayın temposu
title: Sürüm politikası
x-i18n:
    generated_at: "2026-05-10T19:53:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ac11cfd0b5b1ebcc2fc010463c60e257a7e51802116b4b86d38d3a0da8a1dab
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw üç genel yayın kulvarına sahiptir:

- stable: varsayılan olarak npm `beta` etiketine, açıkça istendiğinde ise npm `latest` etiketine yayımlanan etiketli sürümler
- beta: npm `beta` etiketine yayımlanan ön sürüm etiketleri
- dev: `main` dalının hareketli en güncel hali

## Sürüm adlandırma

- Kararlı yayın sürümü: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Kararlı düzeltme yayın sürümü: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön sürüm sürümü: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ayı veya günü sıfırla doldurmayın
- `latest`, o anda yükseltilmiş kararlı npm sürümü anlamına gelir
- `beta`, geçerli beta kurulum hedefi anlamına gelir
- Kararlı ve kararlı düzeltme sürümleri varsayılan olarak npm `beta` etiketine yayımlanır; yayın operatörleri açıkça `latest` hedefleyebilir veya daha sonra incelenmiş bir beta derlemesini yükseltebilir
- Her kararlı OpenClaw sürümü npm paketini ve macOS uygulamasını birlikte gönderir;
  beta sürümler normalde önce npm/paket yolunu doğrular ve yayımlar; mac
  uygulaması derleme/imzalama/noter onayı işlemleri, açıkça istenmedikçe kararlı sürüme ayrılır

## Yayın temposu

- Yayınlar önce beta olarak ilerler
- Kararlı sürüm yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar normalde sürümleri mevcut `main` dalından oluşturulan bir
  `release/YYYY.M.D` dalından çıkarır; böylece yayın doğrulaması ve düzeltmeleri
  `main` üzerindeki yeni geliştirmeyi engellemez
- Bir beta etiketi gönderilmiş veya yayımlanmışsa ve düzeltme gerekiyorsa, bakımcılar
  eski beta etiketini silmek veya yeniden oluşturmak yerine sonraki `-beta.N` etiketini
  çıkarır
- Ayrıntılı yayın prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca bakımcılara özeldir

## Yayın operatörü kontrol listesi

Bu kontrol listesi yayın akışının genel biçimidir. Özel kimlik bilgileri,
imzalama, noter onayı, dist-tag kurtarma ve acil geri alma ayrıntıları
yalnızca bakımcılara özel yayın çalışma kitabında kalır.

1. Mevcut `main` dalından başlayın: en son değişiklikleri çekin, hedef commit’in gönderildiğini
   doğrulayın ve mevcut `main` CI durumunun ondan dal oluşturmak için yeterince yeşil olduğunu doğrulayın.
2. En üstteki `CHANGELOG.md` bölümünü gerçek commit geçmişinden `/changelog` ile
   yeniden yazın, girdileri kullanıcıya dönük tutun, commit’leyin, gönderin ve dal oluşturmadan önce
   bir kez daha rebase/pull yapın.
3. Yayın uyumluluk kayıtlarını
   `src/plugins/compat/registry.ts` ve
   `src/commands/doctor/shared/deprecation-compat.ts` içinde inceleyin. Süresi dolmuş
   uyumluluğu yalnızca yükseltme yolu kapsanmaya devam ettiğinde kaldırın veya neden
   kasıtlı olarak taşındığını kaydedin.
4. Mevcut `main` üzerinden `release/YYYY.M.D` oluşturun; normal yayın çalışmasını
   doğrudan `main` üzerinde yapmayın.
5. Amaçlanan etiket için gerekli her sürüm konumunu yükseltin, ardından
   `pnpm release:prep` çalıştırın. Bu komut Plugin sürümlerini, Plugin envanterini, yapılandırma
   şemasını, paketlenmiş kanal yapılandırma meta verilerini, yapılandırma dokümanları temelini, Plugin SDK
   dışa aktarımlarını ve Plugin SDK API temelini doğru sırayla yeniler. Etiketlemeden önce oluşan
   üretilmiş sapmaları commit’leyin. Ardından yerel deterministik ön denetimi çalıştırın:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` ve `pnpm release:check`.
6. `OpenClaw NPM Release` işini `preflight_only=true` ile çalıştırın. Etiket oluşmadan önce,
   yalnızca doğrulama amaçlı ön denetim için tam 40 karakterlik yayın dalı SHA’sına izin verilir.
   Başarılı `preflight_run_id` değerini kaydedin.
7. Yayın dalı, etiketi veya tam commit SHA’sı için `Full Release Validation` ile
   tüm ön yayın testlerini başlatın. Bu, dört büyük yayın test kutusu için tek manuel giriş noktasıdır:
   Vitest, Docker, QA Lab ve Package.
8. Doğrulama başarısız olursa, yayın dalında düzeltin ve düzeltmeyi kanıtlayan en küçük başarısız
   dosyayı, kulvarı, iş akışı işini, paket profilini, sağlayıcıyı veya model izin listesini yeniden çalıştırın.
   Tam şemsiyeyi yalnızca değişen yüzey önceki kanıtı geçersiz kıldığında yeniden çalıştırın.
9. Beta için `vYYYY.M.D-beta.N` etiketini oluşturun, ardından eşleşen
   `release/YYYY.M.D` dalından `OpenClaw Release Publish` çalıştırın. Bu iş
   `pnpm plugins:sync:check` doğrulaması yapar, yayımlanabilir tüm Plugin paketlerini npm’ye ve aynı kümeyi
   paralel olarak ClawHub’a gönderir, ardından Plugin npm yayını başarılı olur olmaz
   hazırlanmış OpenClaw npm ön denetim yapıtını eşleşen dist-tag ile yükseltir.
   OpenClaw npm yayımlama alt işi başarılı olduktan sonra, tam eşleşen
   `CHANGELOG.md` bölümünden eşleşen GitHub release/prerelease sayfasını oluşturur veya günceller.
   npm `latest` etiketine yayımlanan kararlı sürümler GitHub’daki en son release olur; npm `beta`
   üzerinde tutulan kararlı bakım sürümleri GitHub `latest=false` ile oluşturulur.
   OpenClaw npm yayımlanırken ClawHub yayımlaması hâlâ çalışıyor olabilir, ancak
   yayın yayımlama iş akışı alt iş çalıştırma kimliklerini hemen yazdırır. Varsayılan olarak ClawHub’ı
   gönderdikten sonra beklemez; bu nedenle OpenClaw npm erişilebilirliği daha yavaş ClawHub onayları
   veya kayıt işleri tarafından engellenmez. ClawHub’ın iş akışının tamamlanmasını engellemesi gerektiğinde
   `wait_for_clawhub=true` ayarlayın. ClawHub yolu geçici CLI bağımlılık kurulum hatalarını yeniden dener,
   bir önizleme hücresi kesintili başarısız olsa bile önizlemeden geçen Plugin’leri yayımlar ve kısmi yayımların
   görünür ve yeniden denenebilir kalması için beklenen her Plugin sürümü için kayıt doğrulamasıyla biter.
   Yayımlamadan sonra, yayımlanmış `openclaw@YYYY.M.D-beta.N` veya
   `openclaw@beta` paketine karşı yayımlama sonrası paket
   kabulünü çalıştırın. Gönderilmiş veya yayımlanmış bir ön sürüm düzeltme gerektiriyorsa,
   sonraki eşleşen ön sürüm numarasını çıkarın; eski ön sürümü silmeyin veya yeniden yazmayın.
10. Kararlı sürüm için yalnızca incelenmiş beta veya yayın adayı gerekli doğrulama kanıtına sahip olduktan
    sonra devam edin. Kararlı npm yayımlaması da başarılı ön denetim yapıtını
    `preflight_run_id` aracılığıyla yeniden kullanarak `OpenClaw Release Publish` üzerinden gider;
    kararlı macOS yayın hazırlığı ayrıca paketlenmiş `.zip`, `.dmg`, `.dSYM.zip` ve güncellenmiş
    `appcast.xml` dosyalarının `main` üzerinde bulunmasını gerektirir.
    Özel macOS yayımlama iş akışı, yayın varlıkları doğrulandıktan sonra imzalı appcast’i otomatik olarak
    herkese açık `main` dalına yayımlar; dal koruması doğrudan gönderimi engellerse,
    bir appcast PR’ı açar veya günceller.
11. Yayımlamadan sonra npm yayımlama sonrası doğrulayıcısını, yayımlama sonrası kanal kanıtına ihtiyaç duyduğunuzda
    isteğe bağlı bağımsız yayımlanmış npm Telegram E2E’yi, gerektiğinde dist-tag yükseltmesini çalıştırın,
    oluşturulan GitHub release sayfasını doğrulayın ve yayın duyurusu adımlarını çalıştırın.

## Yayın ön denetimi

- Sürüm ön hazırlığından önce `pnpm check:test-types` çalıştırın; böylece test TypeScript kapsamı,
  daha hızlı yerel `pnpm check` kapısının dışında da korunur
- Sürüm ön hazırlığından önce `pnpm check:architecture` çalıştırın; böylece daha geniş import
  döngüsü ve mimari sınır kontrolleri, daha hızlı yerel kapının dışında yeşil olur
- `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın; böylece beklenen
  `dist/*` sürüm artifact'leri ve Control UI paketi, paket doğrulama adımı için mevcut olur
- Kök sürüm artışından sonra ve etiketlemeden önce `pnpm release:prep` çalıştırın. Sürüm/config/API değişikliğinden sonra
  sıkça sapan tüm deterministik sürüm üreteçlerini çalıştırır: Plugin sürümleri, Plugin envanteri, temel config
  şeması, paketlenmiş kanal config metadata'sı, config dokümanları baseline'ı, Plugin SDK
  dışa aktarımları ve Plugin SDK API baseline'ı. `pnpm release:check`, bu
  korumaları check modunda yeniden çalıştırır ve paket sürüm kontrollerini çalıştırmadan önce bulduğu
  tüm üretilmiş sapma hatalarını tek geçişte raporlar.
- Sürüm onayından önce manuel `Full Release Validation` workflow'unu çalıştırarak
  tüm ön sürüm test kutularını tek entrypoint'ten başlatın. Bir branch,
  tag veya tam commit SHA kabul eder, manuel `CI` başlatır ve install smoke, package acceptance, cross-OS
  paket kontrolleri, QA Lab parity, Matrix ve Telegram hatları için
  `OpenClaw Release Checks` başlatır. Stable/default çalıştırmalar,
  kapsamlı canlı/E2E ve Docker release-path soak işlemini
  `run_release_soak=true` arkasında tutar; `release_profile=full` soak işlemini zorlar. `release_profile=full`
  ve `rerun_group=all` ile, release checks'ten gelen `release-package-under-test` artifact'ine karşı paket Telegram
  E2E de çalıştırır. Aynı
  Telegram E2E'nin yayınlanmış npm paketini de kanıtlaması gerektiğinde, yayınlamadan sonra
  `npm_telegram_package_spec` sağlayın. Package Acceptance'ın
  paket/update matrisini SHA ile oluşturulmuş artifact yerine yayımlanan npm paketine karşı çalıştırması
  gerektiğinde, yayınlamadan sonra `package_acceptance_package_spec` sağlayın.
  Özel evidence raporunun doğrulamanın yayınlanmış bir npm paketiyle eşleştiğini
  Telegram E2E'yi zorlamadan kanıtlaması gerektiğinde `evidence_package_spec`
  sağlayın. Örnek:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Sürüm çalışması devam ederken bir paket adayı için yan kanal kanıtı istediğinizde
  manuel `Package Acceptance` workflow'unu çalıştırın. `openclaw@beta`,
  `openclaw@latest` veya tam bir sürüm için `source=npm`; geçerli
  `workflow_ref` harness'ı ile güvenilir bir `package_ref` branch/tag/SHA paketlemek için `source=ref`;
  zorunlu SHA-256 içeren HTTPS tarball için `source=url`; ya da başka bir GitHub
  Actions çalıştırmasının yüklediği tarball için `source=artifact` kullanın. Workflow,
  adayı `package-under-test` olarak çözer, Docker E2E sürüm zamanlayıcısını bu tarball'a karşı yeniden kullanır
  ve aynı tarball'a karşı `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` ile
  Telegram QA çalıştırabilir. Seçilen Docker hatları `published-upgrade-survivor` içerdiğinde,
  paket artifact'i adaydır ve `published_upgrade_survivor_baseline`
  yayımlanan baseline'ı seçer. `update-restart-auth`, aday paketi hem kurulu CLI
  hem de package-under-test olarak kullanır; böylece aday update komutunun yönetilen restart yolunu
  çalıştırır.
  Örnek: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Yaygın profiller:
  - `smoke`: install/channel/agent, gateway network ve config reload hatları
  - `package`: OpenWebUI veya canlı ClawHub olmadan artifact-native package/update/restart/plugin hatları
  - `product`: package profili artı MCP kanalları, cron/subagent temizliği,
    OpenAI web search ve OpenWebUI
  - `full`: OpenWebUI ile Docker release-path parçaları
  - `custom`: odaklı bir yeniden çalıştırma için tam `docker_lanes` seçimi
- Yalnızca sürüm adayı için tam normal CI kapsamına ihtiyacınız olduğunda manuel `CI`
  workflow'unu doğrudan çalıştırın. Manuel CI dispatch'leri changed scoping'i atlar
  ve Linux Node shard'larını, paketlenmiş-Plugin shard'larını, kanal
  sözleşmelerini, Node 22 uyumluluğunu, `check`, `check-additional`, build smoke,
  doküman kontrolleri, Python skills, Windows, macOS, Android ve Control UI i18n
  hatlarını zorlar.
  Örnek: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Sürüm telemetrisini doğrularken `pnpm qa:otel:smoke` çalıştırın. Bu,
  yerel bir OTLP/HTTP receiver üzerinden QA-lab'i çalıştırır ve dışa aktarılan trace
  span adlarını, sınırlı öznitelikleri ve içerik/tanımlayıcı redaksiyonunu
  Opik, Langfuse veya başka bir harici collector gerektirmeden doğrular.
- Her etiketli sürümden önce `pnpm release:check` çalıştırın
- Etiket var olduktan sonra değişiklik yapan publish sırası için `OpenClaw Release Publish` çalıştırın.
  Bunu `release/YYYY.M.D` üzerinden başlatın (veya main'den erişilebilen bir tag yayımlarken
  `main` üzerinden), release tag'i ve başarılı OpenClaw npm
  `preflight_run_id` iletin ve özellikle odaklı bir onarım çalıştırmıyorsanız varsayılan Plugin publish scope'u
  `all-publishable` olarak bırakın. Workflow, Plugin npm publish, Plugin ClawHub publish ve OpenClaw
  npm publish işlemlerini seri hale getirir; böylece core paket, dışsallaştırılmış
  Plugin'lerinden önce yayımlanmaz.
- Sürüm kontrolleri artık ayrı bir manuel workflow'da çalışır:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`, sürüm onayından önce QA Lab mock parity hattını, hızlı
  canlı Matrix profilini ve Telegram QA hattını da çalıştırır. Canlı
  hatlar `qa-live-shared` environment'ını kullanır; Telegram ayrıca Convex CI
  credential lease'lerini kullanır. Tam Matrix
  transport, media ve E2EE envanterini paralel istediğinizde manuel `QA-Lab - All Lanes` workflow'unu
  `matrix_profile=all` ve `matrix_shards=true` ile çalıştırın.
- Cross-OS kurulum ve yükseltme runtime doğrulaması, reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` dosyasını doğrudan çağıran public
  `OpenClaw Release Checks` ve `Full Release Validation` kapsamındadır
- Bu ayrım kasıtlıdır: gerçek npm release path kısa,
  deterministik ve artifact odaklı kalır; daha yavaş canlı kontroller kendi
  hattında kalır, böylece publish işlemini geciktirmez veya engellemez
- Gizli bilgi içeren sürüm kontrolleri, workflow mantığı ve
  secret'lar kontrollü kalsın diye `Full Release
Validation` üzerinden veya `main`/release workflow ref'inden başlatılmalıdır
- `OpenClaw Release Checks`, çözümlenen commit bir OpenClaw branch'inden veya release tag'inden erişilebilir olduğu sürece
  branch, tag veya tam commit SHA kabul eder
- `OpenClaw NPM Release` yalnızca doğrulama preflight'ı, pushed tag gerektirmeden geçerli
  tam 40 karakterlik workflow-branch commit SHA'sını da kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek publish'e yükseltilemez
- SHA modunda workflow, yalnızca paket metadata kontrolü için `v<package.json version>`
  sentezler; gerçek publish yine gerçek bir release tag gerektirir
- Her iki workflow da gerçek publish ve promotion path'i GitHub-hosted
  runner'larda tutarken, değişiklik yapmayan doğrulama path'i daha büyük
  Blacksmith Linux runner'larını kullanabilir
- Bu workflow,
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  komutunu hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` workflow secret'larıyla çalıştırır
- npm release preflight artık ayrı release checks hattını beklemez
- Onaydan önce
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  komutunu (veya eşleşen beta/correction tag'i) çalıştırın
- npm publish sonrasında, yayınlanmış registry install path'ini yeni bir temp prefix içinde doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  komutunu (veya eşleşen beta/correction sürümünü) çalıştırın
- Beta publish sonrasında, paylaşılan leased Telegram credential havuzunu kullanarak yayınlanmış npm paketine karşı
  kurulu-paket onboarding'ini, Telegram kurulumunu ve gerçek Telegram E2E'yi doğrulamak için
  `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  çalıştırın. Yerel maintainer tek seferlik çalışmaları Convex var'larını atlayabilir ve üç
  `OPENCLAW_QA_TELEGRAM_*` env credential'ını doğrudan iletebilir.
- Bir maintainer makinesinden tam post-publish beta smoke çalıştırmak için `pnpm release:beta-smoke -- --beta betaN` kullanın. Helper, Parallels npm update/fresh-target doğrulamasını çalıştırır, `NPM Telegram Beta E2E` başlatır, tam workflow run'ını poll eder, artifact'i indirir ve Telegram raporunu yazdırır.
- Maintainer'lar aynı post-publish kontrolünü GitHub Actions üzerinden manuel
  `NPM Telegram Beta E2E` workflow'u ile çalıştırabilir. Bu özellikle yalnızca manuel olacak şekilde tasarlanmıştır ve
  her merge'de çalışmaz.
- Maintainer sürüm otomasyonu artık preflight-then-promote kullanır:
  - gerçek npm publish başarılı bir npm `preflight_run_id` geçmelidir
  - gerçek npm publish, başarılı preflight run ile aynı `main` veya
    `release/YYYY.M.D` branch'inden başlatılmalıdır
  - stable npm sürümleri varsayılan olarak `beta` kullanır
  - stable npm publish, workflow input'u üzerinden açıkça `latest` hedefleyebilir
  - token tabanlı npm dist-tag değişikliği artık güvenlik için
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    içindedir; çünkü public repo OIDC-only publish tutarken
    `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirir
  - public `macOS Release` yalnızca doğrulama içindir; bir tag yalnızca bir
    release branch'inde yaşıyorsa ama workflow `main` üzerinden başlatılıyorsa
    `public_release_branch=release/YYYY.M.D` ayarlayın
  - gerçek private mac publish, başarılı private mac
    `preflight_run_id` ve `validate_run_id` geçmelidir
  - gerçek publish path'leri artifact'leri yeniden build etmek yerine hazırlanmış artifact'leri promote eder
- `YYYY.M.D-N` gibi stable correction sürümleri için post-publish verifier,
  aynı temp-prefix upgrade path'ini `YYYY.M.D` sürümünden `YYYY.M.D-N` sürümüne de kontrol eder;
  böylece release correction'lar eski global install'ları base stable payload'da sessizce bırakamaz
- npm release preflight, tarball hem `dist/control-ui/index.html` hem de boş olmayan
  `dist/control-ui/assets/` payload'u içermedikçe kapalı şekilde başarısız olur;
  böylece tekrar boş bir tarayıcı dashboard'u göndermeyiz
- Post-publish doğrulaması, yayınlanmış Plugin entrypoint'lerinin ve
  paket metadata'sının kurulu registry layout'unda bulunduğunu da kontrol eder. Eksik
  Plugin runtime payload'larıyla çıkan bir sürüm, postpublish verifier'da başarısız olur ve
  `latest`'e promote edilemez.
- `pnpm test:install:smoke`, aday update tarball'ı üzerinde npm pack `unpackedSize` bütçesini de
  zorunlu kılar; böylece installer e2e, release publish path'inden önce kazara paket şişmesini yakalar
- Sürüm çalışması CI planlamasına, Plugin zamanlama manifestlerine veya
  Plugin test matrislerine dokunduysa, release notes eski bir CI layout'u tanımlamasın diye onaydan önce
  `.github/workflows/plugin-prerelease.yml` içindeki planner-owned
  `plugin-prerelease-extension-shard` matrix çıktılarını yeniden üretin ve gözden geçirin
- Stable macOS release readiness ayrıca updater yüzeylerini içerir:
  - GitHub release, paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` ile sonuçlanmalıdır
  - `main` üzerindeki `appcast.xml`, publish sonrasında yeni stable zip'i göstermelidir;
    private macOS publish workflow'u bunu otomatik commit eder veya direct push engellendiğinde bir appcast
    PR'ı açar
  - paketlenmiş app, non-debug bundle id'yi, boş olmayan Sparkle feed
    URL'sini ve ilgili release version için canonical Sparkle build floor değerinde veya üzerinde bir
    `CFBundleVersion` korumalıdır

## Sürüm test kutuları

`Full Release Validation`, operatörlerin tüm ön sürüm testlerini tek entrypoint'ten
başlatma yöntemidir. Hızlı hareket eden bir branch üzerinde pinned commit kanıtı için,
her child workflow'un hedef SHA'ya sabitlenmiş geçici bir branch'ten çalışması amacıyla
helper'ı kullanın:

```bash
pnpm ci:full-release --sha <full-sha>
```

Yardımcı, `release-ci/<sha>-...` dalını iter, bu daldan `ref=<sha>` ile `Full Release Validation`
çalıştırır, her alt iş akışının `headSha` değerinin hedefle eşleştiğini doğrular, ardından geçici dalı siler. Bu, yanlışlıkla daha yeni bir `main` alt çalıştırmasını kanıtlamayı önler.

Sürüm dalı veya etiket doğrulaması için bunu güvenilir `main` iş akışı
ref’inden çalıştırın ve sürüm dalını ya da etiketini `ref` olarak geçirin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

İş akışı hedef ref’i çözer, `target_ref=<release-ref>` ile manuel `CI` çalıştırır, `OpenClaw Release Checks` çalıştırır, paket odaklı denetimler için bir üst `release-package-under-test` artefaktı hazırlar ve `release_profile=full` ile `rerun_group=all` olduğunda veya `npm_telegram_package_spec` ayarlandığında bağımsız paket Telegram E2E çalıştırır. Ardından `OpenClaw Release
Checks`, kurulum smoke testlerine, çapraz OS sürüm denetimlerine, soak etkinleştirildiğinde canlı/E2E Docker sürüm yolu kapsamına, Telegram paket QA ile Package Acceptance’a, QA Lab eşliğine, canlı Matrix’e ve canlı Telegram’a genişler. Tam bir çalıştırma yalnızca `Full Release Validation` özetinde `normal_ci` ve `release_checks` başarılı olarak gösterildiğinde kabul edilebilir. Full/all modunda `npm_telegram` alt çalıştırması da başarılı olmalıdır; full/all dışında yayımlanmış bir `npm_telegram_package_spec` sağlanmadıkça atlanır. Son doğrulayıcı özeti, her alt çalıştırma için en yavaş iş tablolarını içerir; böylece sürüm yöneticisi günlükleri indirmeden mevcut kritik yolu görebilir.
Eksiksiz aşama matrisi, tam iş akışı işi adları, stable ile full profil farkları, artefaktlar ve odaklı yeniden çalıştırma tanıtıcıları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.
Alt iş akışları, hedef `ref` daha eski bir sürüm dalını veya etiketini gösterse bile `Full Release
Validation` çalıştıran güvenilir ref’ten, normalde `--ref main` üzerinden çalıştırılır. Ayrı bir Full Release Validation iş akışı ref girişi yoktur; güvenilir harness’i iş akışı çalıştırma ref’ini seçerek seçin.
Hareketli `main` üzerinde tam commit kanıtı için `--ref main -f ref=<sha>` kullanmayın; ham commit SHA’ları iş akışı dispatch ref’i olamaz, bu nedenle sabitlenmiş geçici dalı oluşturmak için `pnpm ci:full-release --sha <sha>` kullanın.

Canlı/provider kapsamını seçmek için `release_profile` kullanın:

- `minimum`: en hızlı sürüm açısından kritik OpenAI/çekirdek canlı ve Docker yolu
- `stable`: sürüm onayı için minimuma ek olarak stable provider/backend kapsamı
- `full`: stable’a ek olarak geniş advisory provider/medya kapsamı

Sürümü engelleyen hatlar yeşil olduğunda ve yükseltme öncesinde kapsamlı canlı/E2E, Docker sürüm yolu ve sınırlı yayımlanmış yükseltme dayanıklılığı taraması istediğinizde `stable` ile `run_release_soak=true` kullanın. Bu tarama, en son dört stable paketi ile sabitlenmiş `2026.4.23` ve `2026.5.2` başlangıçlarını ve daha eski `2026.4.15` kapsamını içerir; yinelenen başlangıçlar kaldırılır ve her başlangıç kendi Docker runner işine shard edilir. `full`, `run_release_soak=true` anlamına gelir.

`OpenClaw Release Checks`, hedef ref’i bir kez `release-package-under-test` olarak çözmek için güvenilir iş akışı ref’ini kullanır ve soak çalıştığında bu artefaktı çapraz OS, Package Acceptance ve sürüm yolu Docker denetimlerinde yeniden kullanır. Bu, paket odaklı tüm kutuları aynı byte’larda tutar ve tekrarlanan paket derlemelerini önler.
Çapraz OS OpenAI kurulum smoke testi, repo/org değişkeni ayarlandığında `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır; aksi halde `openai/gpt-5.4` kullanır, çünkü bu hat en yavaş varsayılan modeli kıyaslamak yerine paket kurulumunu, onboarding’i, Gateway başlatmayı ve bir canlı agent turunu kanıtlar. Daha geniş canlı provider matrisi, modele özel kapsamın yeridir.

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

Odaklı bir düzeltmeden sonraki ilk yeniden çalıştırma olarak tam şemsiyeyi kullanmayın. Bir kutu başarısız olursa, sonraki kanıt için başarısız alt iş akışını, işi, Docker hattını, paket profilini, model provider’ını veya QA hattını kullanın. Tam şemsiyeyi yalnızca düzeltme paylaşılan sürüm orkestrasyonunu değiştirdiğinde veya önceki tüm kutu kanıtını bayatlattığında tekrar çalıştırın. Şemsiyenin son doğrulayıcısı kaydedilen alt iş akışı çalıştırma kimliklerini yeniden denetler; bu nedenle bir alt iş akışı başarıyla yeniden çalıştırıldıktan sonra yalnızca başarısız `Verify full validation` üst işini yeniden çalıştırın.

Sınırlı kurtarma için şemsiyeye `rerun_group` geçirin. `all` gerçek sürüm adayı çalıştırmasıdır, `ci` yalnızca normal CI altını çalıştırır, `plugin-prerelease` yalnızca sürüme özel Plugin altını çalıştırır, `release-checks` her sürüm kutusunu çalıştırır ve daha dar sürüm grupları `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ve `npm-telegram` şeklindedir.
Odaklı `npm-telegram` yeniden çalıştırmaları `npm_telegram_package_spec` gerektirir; `release_profile=full` ile full/all çalıştırmaları release-checks paket artefaktını kullanır. Odaklı çapraz OS yeniden çalıştırmaları `cross_os_suite_filter=windows/packaged-upgrade` veya başka bir OS/suite filtresi ekleyebilir. QA release-check hataları advisory niteliktedir; yalnızca QA hatası sürüm doğrulamasını engellemez.

### Vitest

Vitest kutusu manuel `CI` alt iş akışıdır. Manuel CI, değişiklik kapsamını bilinçli olarak atlar ve sürüm adayı için normal test grafiğini zorlar: Linux Node shard’ları, paketlenmiş Plugin shard’ları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, derleme smoke testi, doküman denetimleri, Python Skills, Windows, macOS, Android ve Control UI i18n.

Bu kutuyu “kaynak ağacı tam normal test paketinden geçti mi?” sorusunu yanıtlamak için kullanın. Bu, sürüm yolu ürün doğrulamasıyla aynı değildir. Saklanacak kanıtlar:

- çalıştırılan `CI` çalışma URL’sini gösteren `Full Release Validation` özeti
- tam hedef SHA üzerinde yeşil olan `CI` çalıştırması
- regresyonları incelerken CI işlerindeki başarısız veya yavaş shard adları
- bir çalıştırmanın performans analizi gerektirdiği durumlarda `.artifacts/vitest-shard-timings.json` gibi Vitest zamanlama artefaktları

Manuel CI’yi doğrudan yalnızca sürüm deterministik normal CI gerektiriyor ancak Docker, QA Lab, canlı, çapraz OS veya paket kutuları gerektirmiyorsa çalıştırın:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker kutusu, `openclaw-live-and-e2e-checks-reusable.yml` üzerinden `OpenClaw Release Checks` içinde ve sürüm modu `install-smoke` iş akışında yer alır. Sürüm adayını yalnızca kaynak düzeyi testler yerine paketlenmiş Docker ortamları üzerinden doğrular.

Sürüm Docker kapsamı şunları içerir:

- yavaş Bun global kurulum smoke testi etkinleştirilmiş tam kurulum smoke testi
- hedef SHA’ya göre kök Dockerfile smoke görüntüsü hazırlama/yeniden kullanma; QR, kök/Gateway ve installer/Bun smoke işleri ayrı install-smoke shard’ları olarak çalışır
- depo E2E hatları
- sürüm yolu Docker parçaları: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g` ve `plugins-runtime-install-h`
- istendiğinde `plugins-runtime-services` parçası içinde OpenWebUI kapsamı
- `bundled-plugin-install-uninstall-0` ile `bundled-plugin-install-uninstall-23` arasında bölünmüş paketlenmiş Plugin kurulum/kaldırma hatları
- release checks canlı paketleri içerdiğinde canlı/E2E provider paketleri ve Docker canlı model kapsamı

Yeniden çalıştırmadan önce Docker artefaktlarını kullanın. Sürüm yolu zamanlayıcısı, hat günlükleri, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı plan JSON’u ve yeniden çalıştırma komutlarıyla birlikte `.artifacts/docker-tests/` yükler. Odaklı kurtarma için tüm sürüm parçalarını yeniden çalıştırmak yerine yeniden kullanılabilir canlı/E2E iş akışında `docker_lanes=<lane[,lane]>` kullanın. Üretilen yeniden çalıştırma komutları, mevcut olduğunda önceki `package_artifact_run_id` ve hazırlanmış Docker görüntüsü girişlerini içerir; böylece başarısız bir hat aynı tarball’ı ve GHCR görüntülerini yeniden kullanabilir.

### QA Lab

QA Lab kutusu da `OpenClaw Release Checks` parçasıdır. Vitest ve Docker paket mekaniklerinden ayrı olarak agentic davranış ve kanal düzeyi sürüm kapısıdır.

Sürüm QA Lab kapsamı şunları içerir:

- agentic parity paketi kullanılarak OpenAI aday hattını Opus 4.6 başlangıcıyla karşılaştıran mock parity hattı
- `qa-live-shared` ortamını kullanan hızlı canlı Matrix QA profili
- Convex CI kimlik bilgisi kiralamalarını kullanan canlı Telegram QA hattı
- sürüm telemetrisinin açık yerel kanıt gerektirdiği durumlarda `pnpm qa:otel:smoke`

Bu kutuyu “sürüm QA senaryolarında ve canlı kanal akışlarında doğru davranıyor mu?” sorusunu yanıtlamak için kullanın. Sürümü onaylarken parity, Matrix ve Telegram hatları için artefakt URL’lerini saklayın. Tam Matrix kapsamı, varsayılan sürüm açısından kritik hat yerine manuel shard’lı QA-Lab çalıştırması olarak kullanılabilir kalır.

### Paket

Paket kutusu, kurulabilir ürün kapısıdır. `Package Acceptance` ve `scripts/resolve-openclaw-package-candidate.mjs` resolver’ı tarafından desteklenir. Resolver, bir adayı Docker E2E tarafından tüketilen `package-under-test` tarball’ına normalleştirir, paket envanterini doğrular, paket sürümünü ve SHA-256’yı kaydeder ve iş akışı harness ref’ini paket kaynak ref’inden ayrı tutar.

Desteklenen aday kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya tam bir OpenClaw sürüm sürümü
- `source=ref`: seçili `workflow_ref` harness’iyle güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA’sını paketle
- `source=url`: gerekli `package_sha256` ile bir HTTPS `.tgz` indir
- `source=artifact`: başka bir GitHub Actions çalıştırması tarafından yüklenmiş bir `.tgz` yeniden kullan

`OpenClaw Release Checks`, `source=artifact`, hazırlanmış sürüm paket artefaktı, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`, `telegram_mode=mock-openai` ile Package Acceptance çalıştırır. Package Acceptance; migration, update, yapılandırılmış-auth update restart, canlı ClawHub Skills kurulumu, bayat Plugin bağımlılığı temizleme, çevrimdışı Plugin fixture’ları, Plugin update ve Telegram paket QA’yı aynı çözülmüş tarball’a karşı tutar. Engelleyici sürüm denetimleri varsayılan olarak en son yayımlanmış paket başlangıcını kullanır; `run_release_soak=true` veya `release_profile=full`, `2026.4.23` ile `latest` arasındaki her stable npm-yayımlı başlangıca ve bildirilen sorun fixture’larına genişler. Halihazırda gönderilmiş bir aday için `source=npm` ile, yayımlamadan önce SHA destekli yerel npm tarball’ı için `source=ref`/`source=artifact` ile Package Acceptance kullanın. Bu, daha önce Parallels gerektiren paket/update kapsamının çoğu için GitHub-native yerine geçer. Çapraz OS sürüm denetimleri OS’ye özgü onboarding, installer ve platform davranışı için hâlâ önemlidir, ancak paket/update ürün doğrulaması Package Acceptance’ı tercih etmelidir.

Güncelleme ve Plugin doğrulaması için kanonik kontrol listesi
[Testing updates and plugins](/tr/help/testing-updates-plugins) sayfasıdır. Bir
plugin kurulumu/güncellemesi, doctor temizliği veya yayımlanmış paket geçişi
değişikliğini hangi yerel, Docker, Package Acceptance ya da sürüm denetimi
hattının kanıtladığına karar verirken bunu kullanın. Her kararlı `2026.4.23+`
paketinden kapsamlı yayımlanmış güncelleme geçişi, Full Release CI'ın parçası
değil, ayrı bir manuel `Update Migration` iş akışıdır.

Eski paket kabul toleransı bilinçli olarak zaman sınırlıdır. `2026.4.25`
dahil paketler, npm'de zaten yayımlanmış metadata boşlukları için uyumluluk
yolunu kullanabilir: tarball'da eksik özel QA envanter girdileri, eksik
`gateway install --wrapper`, tarball'dan türetilmiş git fixture'ında eksik patch
dosyaları, eksik kalıcı `update.channel`, eski plugin kurulum kaydı konumları,
eksik marketplace kurulum kaydı kalıcılığı ve `plugins update` sırasında yapılandırma
metadata geçişi. Yayımlanmış `2026.4.26` paketi, daha önce gönderilmiş yerel
derleme metadata damga dosyaları için uyarı verebilir. Daha sonraki paketler
modern paket sözleşmelerini karşılamalıdır; aynı boşluklar sürüm doğrulamasını
başarısız kılar.

Sürüm sorusu gerçekten kurulabilir bir paketle ilgiliyse daha geniş Package
Acceptance profilleri kullanın:

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

- `smoke`: hızlı paket kurulum/kanal/agent, Gateway ağı ve yapılandırma yeniden
  yükleme hatları
- `package`: kurulum/güncelleme/yeniden başlatma/plugin paket sözleşmeleri ve canlı
  ClawHub skill kurulum kanıtı; sürüm denetimi varsayılanı budur
- `product`: `package` artı MCP kanalları, cron/subagent temizliği, OpenAI web
  araması ve OpenWebUI
- `full`: OpenWebUI ile Docker sürüm yolu parçaları
- `custom`: odaklı yeniden çalıştırmalar için tam `docker_lanes` listesi

Paket adayı Telegram kanıtı için Package Acceptance üzerinde
`telegram_mode=mock-openai` veya `telegram_mode=live-frontier` etkinleştirin. İş akışı,
çözümlenen `package-under-test` tarball'unu Telegram hattına iletir; bağımsız
Telegram iş akışı, yayımlama sonrası kontroller için yayımlanmış bir npm spec
kabul etmeyi sürdürür.

## Sürüm yayımlama otomasyonu

`OpenClaw Release Publish`, normal değişiklik yapan yayımlama giriş noktasıdır.
Güvenilir yayımlayıcı iş akışlarını sürümün ihtiyaç duyduğu sırayla orkestre eder:

1. Sürüm tag'ini check out eder ve commit SHA'sını çözümler.
2. Tag'in `main` veya `release/*` üzerinden erişilebilir olduğunu doğrular.
3. `pnpm plugins:sync:check` çalıştırır.
4. `publish_scope=all-publishable` ve `ref=<release-sha>` ile
   `Plugin NPM Release` tetikler.
5. Aynı scope ve SHA ile `Plugin ClawHub Release` tetikler.
6. Sürüm tag'i, npm dist-tag'i ve kaydedilmiş `preflight_run_id` ile
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

Doğrudan `latest` için kararlı yükseltme açıktır:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Daha düşük düzeyli `Plugin NPM Release` ve `Plugin ClawHub Release` iş akışlarını
yalnızca odaklı onarım veya yeniden yayımlama işleri için kullanın. Seçilmiş bir
plugin onarımı için `OpenClaw Release Publish`'e `plugin_publish_scope=selected`
ve `plugins=@openclaw/name` iletin ya da OpenClaw paketinin yayımlanmaması
gerektiğinde alt iş akışını doğrudan tetikleyin.

## NPM iş akışı girdileri

`OpenClaw NPM Release` şu operatör kontrollü girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya `v2026.4.2-beta.1` gibi zorunlu sürüm
  tag'i; `preflight_only=true` olduğunda yalnızca doğrulama preflight'ı için
  mevcut tam 40 karakterli iş akışı dalı commit SHA'sı da olabilir
- `preflight_only`: yalnızca doğrulama/derleme/paket için `true`, gerçek yayımlama
  yolu için `false`
- `preflight_run_id`: gerçek yayımlama yolunda zorunludur; böylece iş akışı başarılı
  preflight çalışmasından hazırlanmış tarball'u yeniden kullanır
- `npm_dist_tag`: yayımlama yolu için npm hedef tag'i; varsayılanı `beta`

`OpenClaw Release Publish` şu operatör kontrollü girdileri kabul eder:

- `tag`: zorunlu sürüm tag'i; zaten mevcut olmalıdır
- `preflight_run_id`: başarılı `OpenClaw NPM Release` preflight çalışma id'si;
  `publish_openclaw_npm=true` olduğunda zorunludur
- `npm_dist_tag`: OpenClaw paketi için npm hedef tag'i
- `plugin_publish_scope`: varsayılanı `all-publishable`; `selected` değerini
  yalnızca odaklı onarım işleri için kullanın
- `plugins`: `plugin_publish_scope=selected` olduğunda virgülle ayrılmış
  `@openclaw/*` paket adları
- `publish_openclaw_npm`: varsayılanı `true`; yalnızca iş akışını plugin'e özel
  onarım orkestratörü olarak kullanırken `false` ayarlayın

`OpenClaw Release Checks` şu operatör kontrollü girdileri kabul eder:

- `ref`: doğrulanacak dal, tag veya tam commit SHA'sı. Gizli bilgi içeren
  kontroller, çözümlenen commit'in bir OpenClaw dalından veya sürüm tag'inden
  erişilebilir olmasını gerektirir.
- `run_release_soak`: kararlı/varsayılan sürüm kontrollerinde kapsamlı canlı/E2E,
  Docker sürüm yolu ve all-since upgrade-survivor soak'ı seçer. `release_profile=full`
  tarafından zorunlu olarak açılır.

Kurallar:

- Kararlı ve düzeltme tag'leri `beta` veya `latest` için yayımlanabilir
- Beta ön sürüm tag'leri yalnızca `beta` için yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca
  `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` ve `Full Release Validation` her zaman yalnızca
  doğrulama amaçlıdır
- Gerçek yayımlama yolu, preflight sırasında kullanılan aynı `npm_dist_tag`
  değerini kullanmalıdır; iş akışı yayımlama öncesinde metadata'nın bunu
  sürdürdüğünü doğrular

## Kararlı npm sürüm sırası

Kararlı bir npm sürümü çıkarırken:

1. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın
   - Bir tag oluşmadan önce, preflight iş akışının yalnızca doğrulama amaçlı
     dry run'ı için mevcut tam iş akışı dalı commit SHA'sını kullanabilirsiniz
2. Normal önce-beta akışı için `npm_dist_tag=beta` seçin ya da yalnızca bilinçli
   olarak doğrudan kararlı yayımlama istediğinizde `latest` kullanın
3. Tek bir manuel iş akışından normal CI artı canlı prompt cache, Docker, QA Lab,
   Matrix ve Telegram kapsamı istediğinizde sürüm dalı, sürüm tag'i veya tam
   commit SHA üzerinde `Full Release Validation` çalıştırın
4. Bilinçli olarak yalnızca deterministik normal test grafiğine ihtiyacınız varsa
   bunun yerine sürüm ref'i üzerinde manuel `CI` iş akışını çalıştırın
5. Başarılı `preflight_run_id` değerini kaydedin
6. Aynı `tag`, aynı `npm_dist_tag` ve kaydedilmiş `preflight_run_id` ile
   `OpenClaw Release Publish` çalıştırın; OpenClaw npm paketini yükseltmeden önce
   dışsallaştırılmış plugin'leri npm ve ClawHub'a yayımlar
7. Sürüm `beta` üzerine çıktıysa, bu kararlı sürümü `beta`'dan `latest`'e yükseltmek
   için özel `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   iş akışını kullanın
8. Sürüm bilinçli olarak doğrudan `latest`'e yayımlandıysa ve `beta` da hemen aynı
   kararlı derlemeyi izlemeliyse, iki dist-tag'i de kararlı sürüme yönlendirmek
   için aynı özel iş akışını kullanın ya da zamanlanmış kendi kendini iyileştirme
   eşitlemesinin `beta` değerini daha sonra taşımasına izin verin

Dist-tag değişikliği güvenlik nedeniyle özel repo'da bulunur; çünkü hâlâ
`NPM_TOKEN` gerektirir, public repo ise yalnızca OIDC yayımlamayı korur.

Bu, doğrudan yayımlama yolunu ve önce-beta yükseltme yolunu hem belgelenmiş hem
de operatör tarafından görülebilir tutar.

Bir maintainer yerel npm kimlik doğrulamasına geri dönmek zorundaysa, tüm
1Password CLI (`op`) komutlarını yalnızca ayrılmış bir tmux oturumu içinde
çalıştırın. `op` komutunu ana agent shell'inden doğrudan çağırmayın; tmux içinde
tutmak prompt'ları, uyarıları ve OTP işlemlerini gözlemlenebilir kılar ve
tekrarlanan host uyarılarını önler.

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

Maintainer'lar gerçek runbook için özel sürüm belgelerini
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
altında kullanır.

## İlgili

- [Sürüm kanalları](/tr/install/development-channels)
