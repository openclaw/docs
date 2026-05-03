---
read_when:
    - Herkese açık yayın kanalı tanımları aranıyor
    - Sürüm doğrulamasını veya paket kabulünü çalıştırma
    - Sürüm adlandırması ve yayın ritmi aranıyor
summary: Yayın kanalları, operatör kontrol listesi, doğrulama kutuları, sürüm adlandırması ve yayın periyodu
title: Sürüm politikası
x-i18n:
    generated_at: "2026-05-03T21:36:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566088d826e1e2bac21b11443b82b62cb73ed1fd9c508c3fb865149cf8a428ba
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw üç herkese açık yayın kanalına sahiptir:

- stable: varsayılan olarak npm `beta` üzerinde veya açıkça istendiğinde npm `latest` üzerinde yayımlanan etiketli yayınlar
- beta: npm `beta` üzerinde yayımlanan ön yayın etiketleri
- dev: `main` dalının hareketli başı

## Sürüm adlandırma

- Kararlı yayın sürümü: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Kararlı düzeltme yayını sürümü: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön yayın sürümü: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ayı veya günü sıfırla doldurmayın
- `latest`, şu anda yükseltilmiş kararlı npm yayınını ifade eder
- `beta`, mevcut beta kurulum hedefini ifade eder
- Kararlı ve kararlı düzeltme yayınları varsayılan olarak npm `beta` üzerinde yayımlanır; yayın operatörleri açıkça `latest` hedefleyebilir veya incelenmiş bir beta derlemesini daha sonra yükseltebilir
- Her kararlı OpenClaw yayını npm paketini ve macOS uygulamasını birlikte gönderir;
  beta yayınları normalde önce npm/paket yolunu doğrular ve yayımlar, mac
  uygulaması derleme/imzalama/noter onayı ise açıkça istenmediği sürece kararlı yayınlara ayrılır

## Yayın ritmi

- Yayınlar önce beta olacak şekilde ilerler
- Kararlı yayın yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar normalde yayınları mevcut `main` üzerinden oluşturulan bir
  `release/YYYY.M.D` dalından çıkarır; böylece yayın doğrulaması ve düzeltmeleri
  `main` üzerindeki yeni geliştirmeyi engellemez
- Bir beta etiketi gönderilmiş veya yayımlanmışsa ve düzeltme gerekiyorsa,
  bakımcılar eski beta etiketini silmek veya yeniden oluşturmak yerine sonraki
  `-beta.N` etiketini çıkarır
- Ayrıntılı yayın prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca bakımcılara özeldir

## Yayın operatörü kontrol listesi

Bu kontrol listesi yayın akışının herkese açık biçimidir. Özel kimlik bilgileri,
imzalama, noter onayı, dist-tag kurtarma ve acil geri alma ayrıntıları
yalnızca bakımcılara özel yayın çalışma kitabında kalır.

1. Mevcut `main` üzerinden başlayın: en son değişiklikleri çekin, hedef commit'in gönderildiğini
   ve mevcut `main` CI durumunun dal çıkarmak için yeterince yeşil olduğunu doğrulayın.
2. En üstteki `CHANGELOG.md` bölümünü gerçek commit geçmişinden
   `/changelog` ile yeniden yazın, girdileri kullanıcıya dönük tutun, commit'leyin, gönderin ve dal oluşturmadan önce
   bir kez daha rebase/pull yapın.
3. Yayın uyumluluk kayıtlarını
   `src/plugins/compat/registry.ts` ve
   `src/commands/doctor/shared/deprecation-compat.ts` içinde inceleyin. Süresi dolmuş
   uyumluluğu yalnızca yükseltme yolu kapsanmaya devam ediyorsa kaldırın veya neden
   bilinçli olarak taşındığını kaydedin.
4. Mevcut `main` üzerinden `release/YYYY.M.D` oluşturun; normal yayın işini
   doğrudan `main` üzerinde yapmayın.
5. Amaçlanan etiket için gerekli her sürüm konumunu artırın, yayımlanabilir Plugin paketlerinin yayın
   sürümünü ve uyumluluk meta verilerini paylaşması için `pnpm plugins:sync` çalıştırın, ardından yerel deterministik ön denetimi çalıştırın:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` ve
   `pnpm release:check`.
6. `OpenClaw NPM Release` işini `preflight_only=true` ile çalıştırın. Etiket oluşmadan önce,
   yalnızca doğrulama amaçlı ön denetim için tam 40 karakterlik bir yayın dalı SHA'sına izin verilir.
   Başarılı `preflight_run_id` değerini kaydedin.
7. Yayın dalı, etiketi veya tam commit SHA'sı için `Full Release Validation` ile
   tüm yayın öncesi testleri başlatın. Bu, dört büyük yayın test kutusu için tek manuel giriş noktasıdır:
   Vitest, Docker, QA Lab ve Package.
8. Doğrulama başarısız olursa yayın dalında düzeltin ve düzeltmeyi kanıtlayan en küçük başarısız
   dosyayı, kanalı, workflow işini, paket profilini, sağlayıcıyı veya model allowlist'ini yeniden çalıştırın.
   Tam şemsiyeyi yalnızca değişen yüzey önceki kanıtları bayat hale getirdiğinde yeniden çalıştırın.
9. Beta için `vYYYY.M.D-beta.N` etiketini oluşturun, ardından eşleşen
   `release/YYYY.M.D` dalından `OpenClaw Release Publish` çalıştırın. Bu işlem `pnpm plugins:sync:check` doğrulaması yapar,
   önce tüm yayımlanabilir Plugin paketlerini npm'ye yayımlar, ardından aynı seti
   ClawPack npm-pack tarball'ları olarak ClawHub'a yayımlar ve sonra eşleşen dist-tag ile hazırlanmış OpenClaw npm ön denetim artifact'ini yükseltir. Yayından sonra, yayımlanan `openclaw@YYYY.M.D-beta.N` veya
   `openclaw@beta` paketine karşı yayın sonrası paket kabulünü çalıştırın.
   Gönderilmiş veya yayımlanmış bir ön yayın düzeltme gerektirirse, sonraki eşleşen ön yayın numarasını çıkarın; eski
   ön yayını silmeyin veya yeniden yazmayın.
10. Kararlı yayın için yalnızca incelenmiş beta veya yayın adayının gerekli doğrulama kanıtı
    olduğunda devam edin. Kararlı npm yayını da `OpenClaw Release Publish` üzerinden geçer ve başarılı ön denetim artifact'ini
    `preflight_run_id` ile yeniden kullanır; kararlı macOS yayın hazırlığı ayrıca paketlenmiş
    `.zip`, `.dmg`, `.dSYM.zip` ve `main` üzerindeki güncellenmiş `appcast.xml` dosyasını gerektirir.
11. Yayından sonra npm yayın sonrası doğrulayıcıyı, yayın sonrası kanal kanıtı gerektiğinde isteğe bağlı bağımsız
    yayımlanmış npm Telegram E2E'yi, gerektiğinde dist-tag yükseltmesini, tamamı eşleşen
    `CHANGELOG.md` bölümünden GitHub yayın/ön yayın notlarını ve yayın duyurusu
    adımlarını çalıştırın.

## Yayın ön denetimi

- Yayın öncesi denetimden önce `pnpm check:test-types` çalıştırın; böylece test TypeScript'i, daha hızlı yerel `pnpm check` kapısı dışında da kapsanmış olur
- Yayın öncesi denetimden önce `pnpm check:architecture` çalıştırın; böylece daha geniş import döngüsü ve mimari sınır denetimleri, daha hızlı yerel kapı dışında yeşil olur
- `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın; böylece beklenen `dist/*` yayın artifaktları ve Control UI paketi, paket doğrulama adımı için mevcut olur
- Kök sürüm artırmasından sonra ve etiketlemeden önce `pnpm plugins:sync` çalıştırın. Bu komut, yayımlanabilir Plugin paket sürümlerini, OpenClaw eş/API uyumluluk metadatasını, derleme metadatasını ve Plugin changelog taslaklarını çekirdek yayın sürümüyle eşleşecek şekilde günceller. `pnpm plugins:sync:check`, değişiklik yapmayan yayın korumasıdır; bu adım unutulursa yayımlama workflow'u herhangi bir registry mutasyonundan önce başarısız olur.
- Yayın onayından önce manuel `Full Release Validation` workflow'unu çalıştırarak tüm yayın öncesi test kutularını tek bir giriş noktasından başlatın. Bu workflow bir dal, etiket veya tam commit SHA'sı kabul eder, manuel `CI` tetikler ve yükleme smoke testi, paket kabulü, Docker yayın yolu paketleri, canlı/E2E, OpenWebUI, QA Lab eşdeğerliği, Matrix ve Telegram kanalları için `OpenClaw Release Checks` tetikler. `release_profile=full` ve `rerun_group=all` ile, yayın kontrollerinden gelen `release-package-under-test` artifaktına karşı paket Telegram E2E'yi de çalıştırır. Aynı Telegram E2E'nin yayımlanmış npm paketini de kanıtlaması gerektiğinde yayımlamadan sonra `npm_telegram_package_spec` sağlayın. Package Acceptance'ın paket/güncelleme matrisini SHA ile oluşturulmuş artifakt yerine gönderilmiş npm paketine karşı çalıştırması gerektiğinde yayımlamadan sonra `package_acceptance_package_spec` sağlayın. Özel kanıt raporunun Telegram E2E'yi zorlamadan doğrulamanın yayımlanmış bir npm paketiyle eşleştiğini kanıtlaması gerektiğinde `evidence_package_spec` sağlayın. Örnek:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Yayın çalışması devam ederken bir paket adayı için yan kanal kanıtı istediğinizde manuel `Package Acceptance` workflow'unu çalıştırın. `openclaw@beta`, `openclaw@latest` veya kesin bir yayın sürümü için `source=npm`; mevcut `workflow_ref` test düzeneğiyle güvenilir bir `package_ref` dalını/etiketini/SHA'sını paketlemek için `source=ref`; zorunlu SHA-256 içeren bir HTTPS tarball için `source=url`; ya da başka bir GitHub Actions çalıştırması tarafından yüklenmiş bir tarball için `source=artifact` kullanın. Workflow adayı `package-under-test` olarak çözümler, Docker E2E yayın zamanlayıcısını bu tarball'a karşı yeniden kullanır ve `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` ile aynı tarball'a karşı Telegram QA çalıştırabilir. Seçilen Docker kanalları `published-upgrade-survivor` içerdiğinde, paket artifaktı adaydır ve `published_upgrade_survivor_baseline` yayımlanmış temel sürümü seçer.
  Örnek: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Yaygın profiller:
  - `smoke`: yükleme/kanal/agent, Gateway ağı ve config yeniden yükleme kanalları
  - `package`: OpenWebUI veya canlı ClawHub olmadan artifakta yerel paket/güncelleme/Plugin kanalları
  - `product`: paket profiline ek olarak MCP kanalları, cron/subagent temizliği, OpenAI web araması ve OpenWebUI
  - `full`: OpenWebUI ile Docker yayın yolu parçaları
  - `custom`: odaklı yeniden çalıştırma için kesin `docker_lanes` seçimi
- Yalnızca yayın adayı için tam normal CI kapsamına ihtiyacınız olduğunda manuel `CI` workflow'unu doğrudan çalıştırın. Manuel CI tetiklemeleri değişiklik kapsamlandırmasını atlar ve Linux Node parçalarını, paketlenmiş Plugin parçalarını, kanal sözleşmelerini, Node 22 uyumluluğunu, `check`, `check-additional`, derleme smoke testini, docs denetimlerini, Python skills'lerini, Windows, macOS, Android ve Control UI i18n kanallarını zorlar.
  Örnek: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Yayın telemetrisini doğrularken `pnpm qa:otel:smoke` çalıştırın. Bu komut QA-lab'i yerel bir OTLP/HTTP alıcısı üzerinden çalıştırır ve Opik, Langfuse veya başka bir harici collector gerektirmeden dışa aktarılan trace span adlarını, sınırlandırılmış öznitelikleri ve içerik/tanımlayıcı redaksiyonunu doğrular.
- Her etiketli yayından önce `pnpm release:check` çalıştırın
- Etiket mevcut olduktan sonra mutasyon yapan yayımlama dizisi için `OpenClaw Release Publish` çalıştırın. Bunu `release/YYYY.M.D` üzerinden (veya main'den erişilebilir bir etiketi yayımlarken `main` üzerinden) tetikleyin, yayın etiketini ve başarılı OpenClaw npm `preflight_run_id` değerini iletin ve kasıtlı olarak odaklı bir onarım yapmıyorsanız varsayılan Plugin yayımlama kapsamı `all-publishable` olarak kalsın. Workflow, çekirdek paketin dışsallaştırılmış Plugin'lerinden önce yayımlanmaması için Plugin npm yayımlamasını, Plugin ClawHub yayımlamasını ve OpenClaw npm yayımlamasını sıraya koyar.
- Yayın denetimleri artık ayrı bir manuel workflow'da çalışır:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`, yayın onayından önce QA Lab mock eşdeğerlik kanalını, hızlı canlı Matrix profilini ve Telegram QA kanalını da çalıştırır. Canlı kanallar `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI kimlik bilgisi kiralamalarını kullanır. Tam Matrix aktarımı, medya ve E2EE envanterini paralel istediğinizde manuel `QA-Lab - All Lanes` workflow'unu `matrix_profile=all` ve `matrix_shards=true` ile çalıştırın.
- Platformlar arası yükleme ve yükseltme çalışma zamanı doğrulaması, yeniden kullanılabilir workflow'u doğrudan çağıran herkese açık `OpenClaw Release Checks` ve `Full Release Validation` kapsamındadır:
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Bu ayrım kasıtlıdır: gerçek npm yayın yolunu kısa, deterministik ve artifakt odaklı tutarken, daha yavaş canlı denetimleri kendi kanalında kalır; böylece yayımlamayı geciktirmez veya engellemez
- Gizli bilgi içeren yayın denetimleri `Full Release Validation` üzerinden veya `main`/yayın workflow ref'inden tetiklenmelidir; böylece workflow mantığı ve gizli bilgiler denetim altında kalır
- `OpenClaw Release Checks`, çözümlenen commit bir OpenClaw dalından veya yayın etiketinden erişilebilir olduğu sürece bir dal, etiket veya tam commit SHA'sı kabul eder
- `OpenClaw NPM Release` yalnızca doğrulama amaçlı ön denetimi, itilmiş bir etiket gerektirmeden mevcut tam 40 karakterli workflow dalı commit SHA'sını da kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek yayıma yükseltilemez
- SHA modunda workflow, yalnızca paket metadata denetimi için `v<package.json version>` sentezler; gerçek yayımlama yine de gerçek bir yayın etiketi gerektirir
- Her iki workflow da gerçek yayımlama ve yükseltme yolunu GitHub tarafından barındırılan runner'larda tutarken, mutasyon yapmayan doğrulama yolu daha büyük Blacksmith Linux runner'larını kullanabilir
- Bu workflow şu komutu çalıştırır:
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` workflow gizli bilgilerini kullanarak
- npm yayın ön denetimi artık ayrı yayın denetimleri kanalını beklemez
- Onaydan önce `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` komutunu (veya eşleşen beta/düzeltme etiketini) çalıştırın
- npm yayımlamasından sonra, yayımlanmış registry yükleme yolunu yeni bir geçici prefix içinde doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  komutunu (veya eşleşen beta/düzeltme sürümünü) çalıştırın
- Beta yayımlamasından sonra, paylaşılan kiralanmış Telegram kimlik bilgisi havuzunu kullanarak yayımlanmış npm paketine karşı yüklü paket onboarding'ini, Telegram kurulumunu ve gerçek Telegram E2E'yi doğrulamak için `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` çalıştırın. Yerel maintainer tek seferlik çalıştırmaları Convex değişkenlerini atlayabilir ve üç `OPENCLAW_QA_TELEGRAM_*` ortam kimlik bilgisini doğrudan verebilir.
- Maintainer'lar aynı yayımlama sonrası denetimini GitHub Actions üzerinden manuel `NPM Telegram Beta E2E` workflow'u ile çalıştırabilir. Bu kasıtlı olarak yalnızca manueldir ve her merge'de çalışmaz.
- Maintainer yayın otomasyonu artık ön denetim ve sonra yükseltme kullanır:
  - gerçek npm yayımlaması başarılı bir npm `preflight_run_id` değerinden geçmelidir
  - gerçek npm yayımlaması, başarılı ön denetim çalıştırmasıyla aynı `main` veya `release/YYYY.M.D` dalından tetiklenmelidir
  - kararlı npm yayınları varsayılan olarak `beta` hedefler
  - kararlı npm yayımlaması workflow girdisiyle açıkça `latest` hedefleyebilir
  - token tabanlı npm dist-tag mutasyonu artık güvenlik nedeniyle `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` içinde yaşar; çünkü herkese açık repo OIDC-only yayımlamayı korurken `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirir
  - herkese açık `macOS Release` yalnızca doğrulama amaçlıdır; bir etiket yalnızca yayın dalında bulunuyor ama workflow `main` üzerinden tetikleniyorsa `public_release_branch=release/YYYY.M.D` ayarlayın
  - gerçek özel mac yayımlaması başarılı özel mac `preflight_run_id` ve `validate_run_id` değerlerinden geçmelidir
  - gerçek yayımlama yolları hazırlanmış artifaktları yeniden derlemek yerine yükseltir
- `YYYY.M.D-N` gibi kararlı düzeltme yayınları için yayımlama sonrası doğrulayıcı aynı geçici prefix yükseltme yolunu `YYYY.M.D` sürümünden `YYYY.M.D-N` sürümüne de denetler; böylece yayın düzeltmeleri eski global yüklemeleri temel kararlı payload üzerinde sessizce bırakamaz
- npm yayın ön denetimi, tarball hem `dist/control-ui/index.html` hem de boş olmayan bir `dist/control-ui/assets/` payload'u içermediği sürece kapalı şekilde başarısız olur; böylece tekrar boş bir tarayıcı dashboard'u göndermeyiz
- Yayımlama sonrası doğrulama, yayımlanmış Plugin entrypoint'lerinin ve paket metadatasının yüklü registry düzeninde mevcut olduğunu da denetler. Eksik Plugin çalışma zamanı payload'ları gönderen bir yayın, postpublish doğrulayıcıda başarısız olur ve `latest` hedefine yükseltilemez.
- `pnpm test:install:smoke`, aday güncelleme tarball'ında npm pack `unpackedSize` bütçesini de uygular; böylece installer e2e, kazara paket şişmesini yayın yayımlama yolundan önce yakalar
- Yayın çalışması CI planlamasına, extension zamanlama manifestlerine veya extension test matrislerine dokunduysa, onaydan önce `.github/workflows/plugin-prerelease.yml` içindeki planner-owned `plugin-prerelease-extension-shard` matris çıktısını yeniden oluşturup gözden geçirin; böylece yayın notları bayat bir CI düzenini açıklamaz
- Kararlı macOS yayın hazırlığı updater yüzeylerini de içerir:
  - GitHub yayını paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` ile sonuçlanmalıdır
  - `main` üzerindeki `appcast.xml`, yayımlamadan sonra yeni kararlı zip'e işaret etmelidir
  - paketlenmiş uygulama debug olmayan bir bundle id, boş olmayan bir Sparkle feed URL'si ve ilgili yayın sürümü için kanonik Sparkle derleme tabanına eşit veya ondan yüksek bir `CFBundleVersion` korumalıdır

## Yayın test kutuları

`Full Release Validation`, operatörlerin tüm yayın öncesi testleri tek bir giriş noktasından başlatma yoludur. Hızlı hareket eden bir dalda sabitlenmiş commit kanıtı için yardımcıyı kullanın; böylece her child workflow hedef SHA'ya sabitlenmiş geçici bir daldan çalışır:

```bash
pnpm ci:full-release --sha <full-sha>
```

Yardımcı `release-ci/<sha>-...` dalını iter, `Full Release Validation` workflow'unu bu daldan `ref=<sha>` ile tetikler, her child workflow `headSha` değerinin hedefle eşleştiğini doğrular ve sonra geçici dalı siler. Bu, kazara daha yeni bir `main` child çalıştırmasını kanıtlamayı önler.

Yayın dalı veya etiket doğrulaması için bunu güvenilir `main` workflow ref'inden çalıştırın ve yayın dalını veya etiketini `ref` olarak iletin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

İş akışı hedef ref'i çözümler, manuel `CI` iş akışını
`target_ref=<release-ref>` ile tetikler, `OpenClaw Release Checks` iş akışını tetikler,
paket odaklı kontroller için bir üst `release-package-under-test` artefaktı hazırlar ve
`release_profile=full` ile `rerun_group=all` olduğunda veya
`npm_telegram_package_spec` ayarlandığında bağımsız paket Telegram E2E'yi tetikler.
Ardından `OpenClaw Release Checks`; kurulum smoke kontrollerine, çapraz işletim sistemi
sürüm kontrollerine, canlı/E2E Docker sürüm yolu kapsamına, Telegram paket QA ile
Package Acceptance'a, QA Lab paritesine, canlı Matrix'e ve canlı Telegram'a yayılır.
Tam bir çalıştırma yalnızca `Full Release Validation` özetinde `normal_ci` ve
`release_checks` başarılı göründüğünde kabul edilebilir. full/all modunda
`npm_telegram` alt çalıştırması da başarılı olmalıdır; full/all dışında, yayımlanmış bir
`npm_telegram_package_spec` sağlanmadıkça atlanır. Son doğrulayıcı özeti her alt
çalıştırma için en yavaş iş tablolarını içerir; böylece sürüm yöneticisi günlükleri
indirmeden mevcut kritik yolu görebilir.
Tam aşama matrisi, kesin iş akışı işi adları, stable ve full profil farkları,
artefaktlar ve odaklı yeniden çalıştırma tutamaçları için
[Full release validation](/tr/reference/full-release-validation) sayfasına bakın.
Alt iş akışları, hedef `ref` daha eski bir sürüm dalını veya etiketini gösterse bile,
`Full Release Validation` iş akışını çalıştıran güvenilir ref'ten, normalde
`--ref main` üzerinden tetiklenir. Ayrı bir Full Release Validation workflow-ref
girdisi yoktur; güvenilir çalıştırma kablo takımını iş akışı çalıştırma ref'ini seçerek
belirleyin.
Hareketli `main` üzerinde kesin commit kanıtı için `--ref main -f ref=<sha>`
kullanmayın; ham commit SHA'ları iş akışı dispatch ref'leri olamaz, bu nedenle
sabitlenmiş geçici dalı oluşturmak için `pnpm ci:full-release --sha <sha>` kullanın.

Canlı/provider genişliğini seçmek için `release_profile` kullanın:

- `minimum`: en hızlı, sürüm açısından kritik OpenAI/core canlı ve Docker yolu
- `stable`: minimuma ek olarak sürüm onayı için stable provider/backend kapsamı
- `full`: stable'a ek olarak geniş advisory provider/medya kapsamı

`OpenClaw Release Checks`, hedef ref'i bir kez `release-package-under-test` olarak
çözümlemek için güvenilir iş akışı ref'ini kullanır ve bu artefaktı hem sürüm yolu
Docker kontrollerinde hem de Package Acceptance'ta yeniden kullanır. Bu, paket odaklı
tüm kutuların aynı baytlar üzerinde kalmasını sağlar ve yinelenen paket derlemelerini
önler.
Çapraz işletim sistemi OpenAI kurulum smoke kontrolü, repo/org değişkeni ayarlıysa
`OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır; aksi halde `openai/gpt-5.4` kullanır,
çünkü bu hat en yavaş varsayılan modeli benchmark etmek yerine paket kurulumunu,
onboarding'i, Gateway başlatmayı ve bir canlı ajan turunu kanıtlar. Daha geniş canlı
provider matrisi, modele özgü kapsamın yeri olmaya devam eder.

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

Odaklı bir düzeltmeden sonraki ilk yeniden çalıştırma olarak tam şemsiyeyi kullanmayın.
Bir kutu başarısız olursa, sonraki kanıt için başarısız alt iş akışını, işi, Docker
hattını, paket profilini, model provider'ını veya QA hattını kullanın. Tam şemsiyeyi
yalnızca düzeltme paylaşılan sürüm orkestrasyonunu değiştirdiyse veya önceki tüm kutu
kanıtını eski hale getirdiyse yeniden çalıştırın. Şemsiyenin son doğrulayıcısı kayıtlı
alt iş akışı çalıştırma kimliklerini yeniden kontrol eder; bu nedenle bir alt iş akışı
başarıyla yeniden çalıştırıldıktan sonra yalnızca başarısız `Verify full validation`
üst işini yeniden çalıştırın.

Sınırlı kurtarma için şemsiyeye `rerun_group` geçirin. `all` gerçek sürüm adayı
çalıştırmasıdır, `ci` yalnızca normal CI altını çalıştırır, `plugin-prerelease` yalnızca
sürüme özel Plugin altını çalıştırır, `release-checks` her sürüm kutusunu çalıştırır ve
daha dar sürüm grupları `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` ve `npm-telegram` değerleridir. Odaklı `npm-telegram` yeniden
çalıştırmaları `npm_telegram_package_spec` gerektirir; `release_profile=full` ile
full/all çalıştırmaları release-checks paket artefaktını kullanır.

### Vitest

Vitest kutusu manuel `CI` alt iş akışıdır. Manuel CI, değiştirilmiş kapsam belirlemeyi
bilerek atlar ve sürüm adayı için normal test grafiğini zorlar: Linux Node shard'ları,
paketlenen Plugin shard'ları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`,
`check-additional`, derleme smoke kontrolü, dokümantasyon kontrolleri, Python Skills,
Windows, macOS, Android ve Control UI i18n.

Bu kutuyu "kaynak ağaç tam normal test paketinden geçti mi?" sorusunu yanıtlamak için
kullanın. Sürüm yolu ürün doğrulamasıyla aynı şey değildir. Saklanacak kanıtlar:

- Tetiklenen `CI` çalıştırma URL'sini gösteren `Full Release Validation` özeti
- Kesin hedef SHA üzerinde yeşil `CI` çalıştırması
- regresyonları araştırırken CI işlerindeki başarısız veya yavaş shard adları
- bir çalıştırmanın performans analizine ihtiyacı olduğunda
  `.artifacts/vitest-shard-timings.json` gibi Vitest zamanlama artefaktları

Manuel CI'yi yalnızca sürüm deterministik normal CI'ye ihtiyaç duyduğunda, ancak Docker,
QA Lab, canlı, çapraz işletim sistemi veya paket kutularına ihtiyaç duymadığında doğrudan
çalıştırın:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker kutusu, `openclaw-live-and-e2e-checks-reusable.yml` üzerinden
`OpenClaw Release Checks` içinde ve ayrıca sürüm modu `install-smoke` iş akışında yer
alır. Sürüm adayını yalnızca kaynak düzeyi testler yerine paketlenmiş Docker ortamları
üzerinden doğrular.

Sürüm Docker kapsamı şunları içerir:

- yavaş Bun global kurulum smoke kontrolü etkin tam kurulum smoke kontrolü
- hedef SHA'ya göre kök Dockerfile smoke imajı hazırlama/yeniden kullanma; QR,
  root/gateway ve installer/Bun smoke işleri ayrı install-smoke shard'ları olarak çalışır
- depo E2E hatları
- sürüm yolu Docker parçaları: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` ve `plugins-runtime-install-h`
- istendiğinde `plugins-runtime-services` parçası içinde OpenWebUI kapsamı
- bölünmüş paketlenen Plugin kurulum/kaldırma hatları:
  `bundled-plugin-install-uninstall-0` ile
  `bundled-plugin-install-uninstall-23` arası
- release checks canlı paketleri içerdiğinde canlı/E2E provider paketleri ve Docker canlı model kapsamı

Yeniden çalıştırmadan önce Docker artefaktlarını kullanın. Sürüm yolu zamanlayıcısı
hat günlükleri, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı plan
JSON'u ve yeniden çalıştırma komutlarıyla birlikte `.artifacts/docker-tests/` yükler.
Odaklı kurtarma için tüm sürüm parçalarını yeniden çalıştırmak yerine yeniden
kullanılabilir canlı/E2E iş akışında `docker_lanes=<lane[,lane]>` kullanın. Oluşturulan
yeniden çalıştırma komutları, mevcut olduğunda önceki `package_artifact_run_id` ve
hazırlanmış Docker imajı girdilerini içerir; böylece başarısız bir hat aynı tarball'ı ve
GHCR imajlarını yeniden kullanabilir.

### QA Lab

QA Lab kutusu da `OpenClaw Release Checks` parçasıdır. Vitest ve Docker paket
mekaniğinden ayrı olarak, agentic davranış ve kanal düzeyinde sürüm kapısıdır.

Sürüm QA Lab kapsamı şunları içerir:

- agentic parite paketiyle OpenAI aday hattını Opus 4.6 baseline'ı ile karşılaştıran mock parite hattı
- `qa-live-shared` ortamını kullanan hızlı canlı Matrix QA profili
- Convex CI kimlik bilgisi kiralamalarını kullanan canlı Telegram QA hattı
- sürüm telemetrisinin açık yerel kanıta ihtiyacı olduğunda `pnpm qa:otel:smoke`

Bu kutuyu "sürüm QA senaryolarında ve canlı kanal akışlarında doğru davranıyor mu?"
sorusunu yanıtlamak için kullanın. Sürümü onaylarken parite, Matrix ve Telegram hatları
için artefakt URL'lerini saklayın. Tam Matrix kapsamı, varsayılan sürüm açısından kritik
hat yerine manuel shard'lı bir QA-Lab çalıştırması olarak kullanılabilir kalır.

### Package

Package kutusu kurulabilir ürün kapısıdır. `Package Acceptance` ve
`scripts/resolve-openclaw-package-candidate.mjs` çözücüsüyle desteklenir. Çözücü, bir
adayı Docker E2E tarafından tüketilen `package-under-test` tarball'ına normalleştirir,
paket envanterini doğrular, paket sürümünü ve SHA-256 değerini kaydeder ve iş akışı
kablo takımı ref'ini paket kaynak ref'inden ayrı tutar.

Desteklenen aday kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya kesin bir OpenClaw sürüm
  versiyonu
- `source=ref`: seçilen `workflow_ref` kablo takımıyla güvenilir bir `package_ref`
  dalını, etiketini veya tam commit SHA'sını paketler
- `source=url`: gerekli `package_sha256` ile bir HTTPS `.tgz` indirir
- `source=artifact`: başka bir GitHub Actions çalıştırması tarafından yüklenen `.tgz` dosyasını yeniden kullanır

`OpenClaw Release Checks`, hazırlanmış sürüm paket artefaktı, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` ve `telegram_mode=mock-openai`
ile `source=artifact` kullanarak Package Acceptance çalıştırır. Package Acceptance;
geçiş, güncelleme, eski Plugin bağımlılığı temizliği, çevrimdışı Plugin fixture'ları,
Plugin güncellemesi ve Telegram paket QA'yı aynı çözümlenmiş tarball üzerinde tutar.
Yükseltme matrisi, `2026.4.23` ile `latest` arasındaki her stable npm yayımlı baseline'ı
kapsar; zaten gönderilmiş bir aday için `source=npm` ile Package Acceptance kullanın ya
da yayımdan önce SHA destekli yerel npm tarball'ı için `source=ref`/`source=artifact`
kullanın. Bu, daha önce Parallels gerektiren paket/güncelleme kapsamının çoğu için
GitHub yerel yerine geçendir. Çapraz işletim sistemi sürüm kontrolleri, işletim
sistemine özgü onboarding, installer ve platform davranışı için hâlâ önemlidir, ancak
paket/güncelleme ürün doğrulaması Package Acceptance'ı tercih etmelidir.

Güncelleme ve Plugin doğrulaması için kanonik kontrol listesi
[Testing updates and plugins](/tr/help/testing-updates-plugins) sayfasıdır. Bir Plugin
kurulum/güncellemesini, doctor temizliğini veya yayımlanmış paket geçişi değişikliğini
hangi yerel, Docker, Package Acceptance veya release-check hattının kanıtladığına karar
verirken bunu kullanın. Her stable `2026.4.23+` paketinden kapsamlı yayımlanmış
güncelleme geçişi, Full Release CI'ın parçası olmayan ayrı bir manuel
`Update Migration` iş akışıdır.

Eski package-acceptance esnekliği bilerek zamanla sınırlanmıştır. `2026.4.25` dahil
paketler, npm'e zaten yayımlanmış metadata boşlukları için uyumluluk yolunu
kullanabilir: tarball'da eksik özel QA envanter girdileri, eksik `gateway install --wrapper`,
tarball'dan türetilmiş git fixture'ında eksik patch dosyaları, eksik kalıcı
`update.channel`, eski Plugin kurulum kaydı konumları, eksik marketplace kurulum kaydı
kalıcılığı ve `plugins update` sırasında config metadata geçişi. Yayımlanmış
`2026.4.26` paketi, zaten gönderilmiş yerel derleme metadata damga dosyaları için uyarı
verebilir. Daha sonraki paketler modern paket sözleşmelerini karşılamalıdır; aynı
boşluklar sürüm doğrulamasını başarısız kılar.

Sürüm sorusu gerçek bir kurulabilir paketle ilgili olduğunda daha geniş Package Acceptance
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

- `smoke`: hızlı paket kurulumu/kanal/ajan, Gateway ağı ve yapılandırma
  yeniden yükleme hatları
- `package`: canlı ClawHub olmadan kurulum/güncelleme/Plugin paketi sözleşmeleri; bu, sürüm denetiminin
  varsayılanıdır
- `product`: `package` artı MCP kanalları, cron/alt ajan temizliği, OpenAI web
  araması ve OpenWebUI
- `full`: OpenWebUI ile Docker sürüm yolu parçaları
- `custom`: odaklı yeniden çalıştırmalar için tam `docker_lanes` listesi

Paket adayı Telegram kanıtı için Package Acceptance üzerinde `telegram_mode=mock-openai` veya
`telegram_mode=live-frontier` etkinleştirin. İş akışı, çözümlenen
`package-under-test` tarball dosyasını Telegram hattına geçirir; bağımsız
Telegram iş akışı, yayın sonrası denetimler için yayımlanmış bir npm belirtimini hâlâ kabul eder.

## Sürüm yayımlama otomasyonu

`OpenClaw Release Publish`, normal değişiklik yapan yayımlama giriş noktasıdır. Sürümün ihtiyaç duyduğu sırayla güvenilir yayımlayıcı iş akışlarını düzenler:

1. Sürüm etiketini checkout yapın ve commit SHA’sını çözümleyin.
2. Etiketin `main` veya `release/*` üzerinden erişilebilir olduğunu doğrulayın.
3. `pnpm plugins:sync:check` çalıştırın.
4. `publish_scope=all-publishable` ve `ref=<release-sha>` ile `Plugin NPM Release` başlatın.
5. Aynı kapsam ve SHA ile `Plugin ClawHub Release` başlatın.
6. Sürüm etiketi, npm dist-tag ve kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` başlatın.

Beta yayımlama örneği:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Varsayılan beta dist-tag’e kararlı yayımlama:

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
yalnızca odaklı onarım veya yeniden yayımlama işleri için kullanın. Seçili bir Plugin onarımı için
`plugin_publish_scope=selected` ve `plugins=@openclaw/name` değerlerini
`OpenClaw Release Publish` içine geçirin ya da OpenClaw paketinin yayımlanmaması
gerektiğinde alt iş akışını doğrudan başlatın.

## NPM iş akışı girdileri

`OpenClaw NPM Release` şu operatör denetimli girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya `v2026.4.2-beta.1` gibi gerekli sürüm etiketi; `preflight_only=true` olduğunda, yalnızca doğrulama amaçlı ön denetim için mevcut tam 40 karakterlik iş akışı dalı commit SHA’sı da olabilir
- `preflight_only`: yalnızca doğrulama/derleme/paket için `true`, gerçek yayımlama yolu için `false`
- `preflight_run_id`: iş akışının başarılı ön denetim çalıştırmasından hazırlanmış tarball dosyasını yeniden kullanması için gerçek yayımlama yolunda gereklidir
- `npm_dist_tag`: yayımlama yolu için npm hedef etiketi; varsayılanı `beta`

`OpenClaw Release Publish` şu operatör denetimli girdileri kabul eder:

- `tag`: gerekli sürüm etiketi; zaten mevcut olmalıdır
- `preflight_run_id`: başarılı `OpenClaw NPM Release` ön denetim çalıştırma kimliği; `publish_openclaw_npm=true` olduğunda gereklidir
- `npm_dist_tag`: OpenClaw paketi için npm hedef etiketi
- `plugin_publish_scope`: varsayılanı `all-publishable`; `selected` değerini yalnızca odaklı onarım işleri için kullanın
- `plugins`: `plugin_publish_scope=selected` olduğunda virgülle ayrılmış `@openclaw/*` paket adları
- `publish_openclaw_npm`: varsayılanı `true`; yalnızca iş akışını sadece Plugin onarım düzenleyicisi olarak kullanırken `false` olarak ayarlayın

`OpenClaw Release Checks` şu operatör denetimli girdileri kabul eder:

- `ref`: doğrulanacak dal, etiket veya tam commit SHA. Gizli bilgi taşıyan denetimler, çözümlenen commit’in bir OpenClaw dalından veya sürüm etiketinden erişilebilir olmasını gerektirir.

Kurallar:

- Kararlı ve düzeltme etiketleri `beta` veya `latest` için yayımlanabilir
- Beta ön sürüm etiketleri yalnızca `beta` için yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` ve `Full Release Validation` her zaman yalnızca doğrulama amaçlıdır
- Gerçek yayımlama yolu, ön denetim sırasında kullanılan aynı `npm_dist_tag` değerini kullanmalıdır; iş akışı, yayımlamadan önce bu metadata’nın devam ettiğini doğrular

## Kararlı npm sürüm sırası

Kararlı bir npm sürümü çıkarırken:

1. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın
   - Etiket mevcut olmadan önce, ön denetim iş akışının yalnızca doğrulama amaçlı kuru çalıştırması için mevcut tam iş akışı dalı commit SHA’sını kullanabilirsiniz
2. Normal önce beta akışı için `npm_dist_tag=beta` seçin veya yalnızca bilerek doğrudan kararlı yayımlama istediğinizde `latest` seçin
3. Tek bir manuel iş akışından normal CI artı canlı prompt önbelleği, Docker, QA Lab, Matrix ve Telegram kapsamı istediğinizde sürüm dalı, sürüm etiketi veya tam commit SHA üzerinde `Full Release Validation` çalıştırın
4. Bilerek yalnızca deterministik normal test grafiğine ihtiyacınız varsa bunun yerine sürüm ref’i üzerinde manuel `CI` iş akışını çalıştırın
5. Başarılı `preflight_run_id` değerini kaydedin
6. Aynı `tag`, aynı `npm_dist_tag` ve kaydedilmiş `preflight_run_id` ile `OpenClaw Release Publish` çalıştırın; OpenClaw npm paketini yükseltmeden önce dışsallaştırılmış Plugin’leri npm ve ClawHub üzerinde yayımlar
7. Sürüm `beta` üzerinde yayımlandıysa, bu kararlı sürümü `beta` üzerinden `latest` değerine yükseltmek için özel `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` iş akışını kullanın
8. Sürüm bilerek doğrudan `latest` için yayımlandıysa ve `beta` aynı kararlı derlemeyi hemen izlemeliyse, her iki dist-tag’i de kararlı sürüme işaret etmek için aynı özel iş akışını kullanın ya da zamanlanmış kendini onaran eşitlemenin `beta` değerini daha sonra taşımasına izin verin

Dist-tag değişikliği güvenlik nedeniyle özel repoda bulunur, çünkü hâlâ `NPM_TOKEN` gerektirir; public repo ise yalnızca OIDC yayımlamayı korur.

Bu, doğrudan yayımlama yolunu ve önce beta yükseltme yolunu hem belgelenmiş hem de operatör tarafından görülebilir tutar.

Bir maintainer yerel npm kimlik doğrulamasına geri dönmek zorunda kalırsa, tüm 1Password CLI (`op`) komutlarını yalnızca ayrılmış bir tmux oturumu içinde çalıştırın. `op` komutunu ana ajan kabuğundan doğrudan çağırmayın; tmux içinde tutmak istemleri, uyarıları ve OTP işlemlerini gözlemlenebilir kılar ve tekrarlanan host uyarılarını önler.

## Public başvurular

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer’lar gerçek çalıştırma kitabı için
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
içindeki özel sürüm belgelerini kullanır.

## İlgili

- [Sürüm kanalları](/tr/install/development-channels)
