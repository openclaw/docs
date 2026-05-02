---
read_when:
    - Herkese açık yayın kanalı tanımları aranıyor
    - Sürüm doğrulamasını veya paket kabulünü çalıştırma
    - Sürüm adlandırması ve yayın ritmi aranıyor
summary: Sürüm hatları, operatör kontrol listesi, doğrulama kutuları, sürüm adlandırması ve yayın ritmi
title: Sürüm politikası
x-i18n:
    generated_at: "2026-05-02T20:59:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 493cb8b42f0e15f3bf5f8fb9be7d01fd626f4f16db9ac0a85e6efa747ef12d12
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw’ın dört genel yayın kanalı vardır:

- kararlı: varsayılan olarak npm `beta` altında yayımlanan veya açıkça istendiğinde npm `latest` altında yayımlanan etiketli sürümler
- alpha: npm `alpha` altında yayımlanan ön sürüm etiketleri
- beta: npm `beta` altında yayımlanan ön sürüm etiketleri
- dev: `main` dalının hareketli başı

## Sürüm adlandırma

- Kararlı sürüm versiyonu: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Kararlı düzeltme sürümü versiyonu: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Alpha ön sürüm versiyonu: `YYYY.M.D-alpha.N`
  - Git etiketi: `vYYYY.M.D-alpha.N`
- Beta ön sürüm versiyonu: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ay veya günü sıfırla doldurmayın
- `latest`, o anda terfi ettirilmiş kararlı npm sürümü anlamına gelir
- `alpha`, o andaki alpha kurulum hedefi anlamına gelir
- `beta`, o andaki beta kurulum hedefi anlamına gelir
- Kararlı ve kararlı düzeltme sürümleri varsayılan olarak npm `beta` altında yayımlanır; sürüm operatörleri açıkça `latest` hedefleyebilir veya denetlenmiş bir beta derlemesini daha sonra terfi ettirebilir
- Her kararlı OpenClaw sürümü npm paketini ve macOS uygulamasını birlikte gönderir;
  beta sürümleri normalde önce npm/paket yolunu doğrular ve yayımlar, mac
  uygulaması derleme/imzalama/noter onayı ise açıkça istenmedikçe kararlı sürüme ayrılır

## Yayın sıklığı

- Sürümler önce beta olarak ilerler
- Kararlı sürüm, yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar sürümleri normalde güncel `main` üzerinden oluşturulan bir
  `release/YYYY.M.D` dalından çıkarır; böylece sürüm doğrulama ve düzeltmeleri
  `main` üzerindeki yeni geliştirmeyi engellemez
- Bir beta etiketi gönderilmiş veya yayımlanmışsa ve düzeltme gerekiyorsa,
  bakımcılar eski beta etiketini silmek veya yeniden oluşturmak yerine sonraki
  `-beta.N` etiketini çıkarır
- Ayrıntılı sürüm prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca bakımcılara özeldir

## Sürüm operatörü kontrol listesi

Bu kontrol listesi sürüm akışının herkese açık biçimidir. Özel kimlik bilgileri,
imzalama, noter onayı, dist-tag kurtarma ve acil geri alma ayrıntıları
yalnızca bakımcılara özel sürüm runbook’unda kalır.

1. Güncel `main` üzerinden başlayın: en son değişiklikleri çekin, hedef commit’in gönderildiğini
   doğrulayın ve güncel `main` CI durumunun dal oluşturmak için yeterince yeşil olduğunu doğrulayın.
2. En üstteki `CHANGELOG.md` bölümünü gerçek commit geçmişinden
   `/changelog` ile yeniden yazın, girdileri kullanıcıya dönük tutun, commit’leyin, gönderin ve dal oluşturmadan önce
   bir kez daha rebase/pull yapın.
3. Sürüm uyumluluk kayıtlarını
   `src/plugins/compat/registry.ts` ve
   `src/commands/doctor/shared/deprecation-compat.ts` içinde gözden geçirin. Süresi dolmuş
   uyumluluğu yalnızca yükseltme yolu kapsanmaya devam ettiğinde kaldırın veya neden
   kasıtlı olarak taşındığını kaydedin.
4. Güncel `main` üzerinden `release/YYYY.M.D` oluşturun; normal sürüm işini
   doğrudan `main` üzerinde yapmayın.
5. Amaçlanan etiket için gereken her sürüm konumunu artırın, yayımlanabilir Plugin paketlerinin sürüm
   versiyonunu ve uyumluluk metadata’sını paylaşması için
   `pnpm plugins:sync` çalıştırın, ardından yerel deterministik ön kontrolü çalıştırın:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` ve
   `pnpm release:check`.
6. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın. Bir etiket oluşmadan önce,
   yalnızca doğrulama amaçlı ön kontrol için 40 karakterlik tam bir sürüm dalı SHA’sına izin verilir.
   Başarılı `preflight_run_id` değerini kaydedin.
7. Sürüm dalı, etiket veya tam commit SHA’sı için `Full Release Validation` ile
   tüm ön sürüm testlerini başlatın. Bu, dört büyük sürüm test kutusu için tek manuel giriş noktasıdır:
   Vitest, Docker, QA Lab ve Package.
8. Doğrulama başarısız olursa sürüm dalında düzeltin ve düzeltmeyi kanıtlayan en küçük başarısız
   dosyayı, kanalı, workflow işini, paket profilini, sağlayıcıyı veya model izin listesini yeniden çalıştırın.
   Tam üst kapsamı yalnızca değişen yüzey önceki kanıtı geçersiz kıldığında yeniden çalıştırın.
9. Alpha veya beta için `vYYYY.M.D-alpha.N` ya da `vYYYY.M.D-beta.N` etiketini oluşturun, ardından eşleşen
   `release/YYYY.M.D` dalından `OpenClaw Release Publish` çalıştırın. Bu işlem `pnpm plugins:sync:check` doğrular,
   önce tüm yayımlanabilir Plugin paketlerini npm’ye yayımlar, aynı
   seti ikinci olarak ClawHub’a yayımlar ve ardından hazırlanmış OpenClaw npm ön kontrol
   artifaktını eşleşen dist-tag ile terfi ettirir. Yayımdan sonra, yayımlanan
   `openclaw@YYYY.M.D-alpha.N`, `openclaw@alpha`,
   `openclaw@YYYY.M.D-beta.N` veya `openclaw@beta` paketine karşı yayımlama sonrası paket
   kabulünü çalıştırın. Gönderilmiş veya yayımlanmış bir ön sürüm düzeltme gerektirirse,
   sonraki eşleşen ön sürüm numarasını çıkarın;
   eski ön sürümü silmeyin veya yeniden yazmayın.
10. Kararlı için, yalnızca denetlenmiş beta veya sürüm adayının
    gerekli doğrulama kanıtına sahip olmasından sonra devam edin. Kararlı npm yayımı da
    `OpenClaw Release Publish` üzerinden ilerler ve başarılı ön kontrol artifaktını
    `preflight_run_id` ile yeniden kullanır; kararlı macOS sürüm hazırlığı ayrıca
    paketlenmiş `.zip`, `.dmg`, `.dSYM.zip` ve `main` üzerinde güncellenmiş `appcast.xml` gerektirir.
11. Yayımdan sonra npm yayımlama sonrası doğrulayıcısını, yayımlama sonrası kanal kanıtına ihtiyaç duyduğunuzda isteğe bağlı bağımsız
    yayımlanmış-npm Telegram E2E’yi,
    gerektiğinde dist-tag terfisini, eşleşen eksiksiz `CHANGELOG.md` bölümünden GitHub release/prerelease notlarını
    ve sürüm duyurusu
    adımlarını çalıştırın.

## Sürüm ön kontrolü

- Test TypeScript'in daha hızlı yerel `pnpm check` kapısının dışında da kapsanması için yayın ön uçuşundan önce `pnpm check:test-types` çalıştırın
- Daha geniş import döngüsü ve mimari sınır denetimlerinin daha hızlı yerel kapının dışında yeşil olması için yayın ön uçuşundan önce `pnpm check:architecture` çalıştırın
- Beklenen `dist/*` yayın yapıtlarının ve Control UI paketinin paket doğrulama adımı için mevcut olması adına `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın
- Kök sürüm artırmasından sonra ve etiketlemeden önce `pnpm plugins:sync` çalıştırın. Bu komut, yayınlanabilir Plugin paket sürümlerini, OpenClaw eş/API uyumluluk meta verilerini, derleme meta verilerini ve Plugin değişiklik günlüğü taslaklarını çekirdek yayın sürümüyle eşleşecek şekilde günceller. `pnpm plugins:sync:check`, değişiklik yapmayan yayın korumasıdır; bu adım unutulduysa yayın iş akışı herhangi bir registry mutasyonundan önce başarısız olur.
- Yayın onayından önce tüm yayın öncesi test kutularını tek bir giriş noktasından başlatmak için manuel `Full Release Validation` iş akışını çalıştırın. Bir dal, etiket veya tam commit SHA kabul eder, manuel `CI` gönderir ve kurulum smoke, paket kabulü, Docker yayın yolu süitleri, live/E2E, OpenWebUI, QA Lab parity, Matrix ve Telegram hatları için `OpenClaw Release Checks` gönderir. `release_profile=full` ve `rerun_group=all` ile ayrıca yayın denetimlerinden gelen `release-package-under-test` yapıtına karşı paket Telegram E2E çalıştırır. Aynı Telegram E2E'nin yayımlanan npm paketini de kanıtlaması gerektiğinde yayımdan sonra `npm_telegram_package_spec` sağlayın. Package Acceptance'ın paket/güncelleme matrisini SHA ile derlenen yapıt yerine gönderilmiş npm paketine karşı çalıştırması gerektiğinde yayımdan sonra `package_acceptance_package_spec` sağlayın. Özel kanıt raporunun, Telegram E2E'yi zorlamadan doğrulamanın yayımlanmış bir npm paketiyle eşleştiğini kanıtlaması gerektiğinde `evidence_package_spec` sağlayın. Örnek: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Yayın çalışması devam ederken bir paket adayı için yan kanal kanıtı istediğinizde manuel `Package Acceptance` iş akışını çalıştırın. `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` veya tam bir yayın sürümü için `source=npm`; mevcut `workflow_ref` koşumuyla güvenilir bir `package_ref` dalı/etiketi/SHA'sını paketlemek için `source=ref`; gerekli SHA-256 ile bir HTTPS tarball için `source=url`; ya da başka bir GitHub Actions çalıştırması tarafından yüklenen tarball için `source=artifact` kullanın. İş akışı adayı `package-under-test` olarak çözümler, Docker E2E yayın zamanlayıcısını bu tarball'a karşı yeniden kullanır ve `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` ile aynı tarball'a karşı Telegram QA çalıştırabilir. Seçilen Docker hatları `published-upgrade-survivor` içerdiğinde paket yapıtı adaydır ve `published_upgrade_survivor_baseline` yayımlanmış temel sürümü seçer.
  Örnek: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Yaygın profiller:
  - `smoke`: kurulum/kanal/ajan, gateway ağı ve yapılandırma yeniden yükleme hatları
  - `package`: OpenWebUI veya live ClawHub olmadan yapıt-yerel paket/güncelleme/Plugin hatları
  - `product`: paket profiline ek olarak MCP kanalları, cron/alt ajan temizliği, OpenAI web araması ve OpenWebUI
  - `full`: OpenWebUI ile Docker yayın yolu parçaları
  - `custom`: odaklanmış yeniden çalıştırma için tam `docker_lanes` seçimi
- Yayın adayı için yalnızca tam normal CI kapsamına ihtiyacınız olduğunda manuel `CI` iş akışını doğrudan çalıştırın. Manuel CI gönderimleri değişiklik kapsamını atlar ve Linux Node parçalarını, paketlenmiş Plugin parçalarını, kanal sözleşmelerini, Node 22 uyumluluğunu, `check`, `check-additional`, derleme smoke, dokümantasyon denetimleri, Python skills, Windows, macOS, Android ve Control UI i18n hatlarını zorlar.
  Örnek: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Yayın telemetrisini doğrularken `pnpm qa:otel:smoke` çalıştırın. QA-lab'i yerel bir OTLP/HTTP alıcısı üzerinden çalıştırır ve Opik, Langfuse veya başka bir harici collector gerektirmeden dışa aktarılan trace span adlarını, sınırlı öznitelikleri ve içerik/tanımlayıcı redaksiyonunu doğrular.
- Her etiketli yayından önce `pnpm release:check` çalıştırın
- Etiket mevcut olduktan sonra mutasyon yapan yayın dizisi için `OpenClaw Release Publish` çalıştırın. Bunu `release/YYYY.M.D` üzerinden (veya main tarafından erişilebilir bir etiketi yayımlarken `main` üzerinden) gönderin, yayın etiketini ve başarılı OpenClaw npm `preflight_run_id` değerini geçin ve bilinçli olarak odaklanmış bir onarım çalıştırmıyorsanız varsayılan Plugin yayın kapsamını `all-publishable` olarak tutun. İş akışı, çekirdek paketin haricileştirilmiş Plugin'lerinden önce yayımlanmaması için Plugin npm yayınını, Plugin ClawHub yayınını ve OpenClaw npm yayınını sıraya alır.
- Yayın denetimleri artık ayrı bir manuel iş akışında çalışır:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`, yayın onayından önce QA Lab mock parity hattını, hızlı live Matrix profilini ve Telegram QA hattını da çalıştırır. Live hatları `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI kimlik bilgisi kiralamalarını kullanır. Tam Matrix aktarımı, medya ve E2EE envanterini paralel istediğinizde manuel `QA-Lab - All Lanes` iş akışını `matrix_profile=all` ve `matrix_shards=true` ile çalıştırın.
- Cross-OS kurulum ve yükseltme çalışma zamanı doğrulaması, yeniden kullanılabilir iş akışını doğrudan çağıran herkese açık `OpenClaw Release Checks` ve `Full Release Validation` kapsamındadır: `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Bu ayrım kasıtlıdır: gerçek npm yayın yolunu kısa, deterministik ve yapıt odaklı tutarken, daha yavaş live denetimler kendi hatlarında kalır; böylece yayını durdurmaz veya engellemezler
- Sır taşıyan yayın denetimleri, iş akışı mantığı ve sırların denetimli kalması için `Full Release Validation` üzerinden veya `main`/yayın iş akışı ref'inden gönderilmelidir
- `OpenClaw Release Checks`, çözümlenen commit bir OpenClaw dalından veya yayın etiketinden erişilebilir olduğu sürece bir dal, etiket veya tam commit SHA kabul eder
- `OpenClaw NPM Release` yalnızca doğrulama ön uçuşu, gönderilmiş bir etiket gerektirmeden mevcut tam 40 karakterlik iş akışı dalı commit SHA'sını da kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek bir yayına yükseltilemez
- SHA modunda iş akışı, yalnızca paket meta verisi denetimi için `v<package.json version>` sentezler; gerçek yayın yine gerçek bir yayın etiketi gerektirir
- Her iki iş akışı da gerçek yayın ve yükseltme yolunu GitHub-hosted runner'larda tutarken, mutasyon yapmayan doğrulama yolu daha büyük Blacksmith Linux runner'larını kullanabilir
- Bu iş akışı hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` iş akışı sırlarını kullanarak `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` çalıştırır
- npm yayın ön uçuşu artık ayrı yayın denetimleri hattını beklemez
- Onaydan önce `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (veya eşleşen beta/düzeltme etiketi) çalıştırın
- npm yayımından sonra, yayımlanmış registry kurulum yolunu taze bir temp prefix içinde doğrulamak için `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (veya eşleşen beta/düzeltme sürümü) çalıştırın
- Beta yayımından sonra, paylaşılan kiralanmış Telegram kimlik bilgisi havuzunu kullanarak yayımlanmış npm paketine karşı kurulu paket onboarding'i, Telegram kurulumunu ve gerçek Telegram E2E'yi doğrulamak için `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` çalıştırın. Yerel bakımcı tek seferlik çalıştırmaları Convex değişkenlerini atlayabilir ve üç `OPENCLAW_QA_TELEGRAM_*` ortam kimlik bilgisini doğrudan geçebilir.
- Bakımcılar aynı yayımdan sonrası denetimi GitHub Actions üzerinden manuel `NPM Telegram Beta E2E` iş akışıyla çalıştırabilir. Bu kasıtlı olarak yalnızca manueldir ve her merge işleminde çalışmaz.
- Bakımcı yayın otomasyonu artık preflight-then-promote kullanır:
  - gerçek npm yayını başarılı bir npm `preflight_run_id` geçmelidir
  - gerçek npm yayını, başarılı ön uçuş çalıştırmasıyla aynı `main` veya `release/YYYY.M.D` dalından gönderilmelidir
  - kararlı npm yayınları varsayılan olarak `beta` olur
  - kararlı npm yayını, iş akışı girdisi üzerinden açıkça `latest` hedefleyebilir
  - token tabanlı npm dist-tag mutasyonu artık güvenlik için `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` içindedir; çünkü herkese açık repo OIDC-only yayınını korurken `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirir
  - herkese açık `macOS Release` yalnızca doğrulama içindir; bir etiket yalnızca yayın dalında bulunuyor ancak iş akışı `main` üzerinden gönderiliyorsa `public_release_branch=release/YYYY.M.D` ayarlayın
  - gerçek özel mac yayını başarılı özel mac `preflight_run_id` ve `validate_run_id` geçmelidir
  - gerçek yayın yolları, yeniden derlemek yerine hazırlanmış yapıtları yükseltir
- `YYYY.M.D-N` gibi kararlı düzeltme yayınları için yayımdan sonrası doğrulayıcı, aynı temp-prefix yükseltme yolunu `YYYY.M.D` sürümünden `YYYY.M.D-N` sürümüne de denetler; böylece yayın düzeltmeleri eski global kurulumları sessizce temel kararlı payload üzerinde bırakamaz
- npm yayın ön uçuşu, tarball hem `dist/control-ui/index.html` hem de boş olmayan bir `dist/control-ui/assets/` payload içermediği sürece kapalı başarısız olur; böylece tekrar boş bir tarayıcı dashboard'u göndermeyiz
- Yayımdan sonrası doğrulama, yayımlanmış Plugin giriş noktalarının ve paket meta verilerinin kurulu registry düzeninde mevcut olduğunu da denetler. Eksik Plugin runtime payload'ları gönderen bir yayın, postpublish doğrulayıcısında başarısız olur ve `latest` sürümüne yükseltilemez.
- `pnpm test:install:smoke`, aday güncelleme tarball'ında npm pack `unpackedSize` bütçesini de uygular; böylece installer e2e, yanlışlıkla oluşan paket şişmesini yayın yolu öncesinde yakalar
- Yayın çalışması CI planlamasına, Plugin zamanlama manifestlerine veya Plugin test matrislerine dokunduysa, onaydan önce `.github/workflows/plugin-prerelease.yml` içindeki planner-owned `plugin-prerelease-extension-shard` matris çıktıları yeniden üretin ve gözden geçirin; böylece yayın notları eski bir CI düzenini açıklamaz
- Kararlı macOS yayın hazırlığı updater yüzeylerini de içerir:
  - GitHub yayını paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` ile sonuçlanmalıdır
  - `main` üzerindeki `appcast.xml`, yayımdan sonra yeni kararlı zip'i göstermelidir
  - paketlenmiş uygulama debug olmayan bir bundle id, boş olmayan bir Sparkle feed URL'si ve bu yayın sürümü için kanonik Sparkle derleme tabanına eşit veya ondan yüksek bir `CFBundleVersion` korumalıdır

## Yayın test kutuları

`Full Release Validation`, operatörlerin tüm yayın öncesi testleri tek bir giriş noktasından başlatma yoludur. Hızlı hareket eden bir dalda sabitlenmiş commit kanıtı için, her alt iş akışının hedef SHA'ya sabitlenmiş geçici bir daldan çalışması adına yardımcıyı kullanın:

```bash
pnpm ci:full-release --sha <full-sha>
```

Yardımcı `release-ci/<sha>-...` dalını push eder, bu daldan `ref=<sha>` ile `Full Release Validation` gönderir, her alt iş akışının `headSha` değerinin hedefle eşleştiğini doğrular ve ardından geçici dalı siler. Bu, yanlışlıkla daha yeni bir `main` alt çalıştırmasını kanıtlamayı önler.

Yayın dalı veya etiket doğrulaması için, güvenilir `main` iş akışı ref'inden çalıştırın ve yayın dalını veya etiketini `ref` olarak geçin:

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
`target_ref=<release-ref>` ile tetikler, `OpenClaw Release Checks` iş akışını tetikler ve
`release_profile=full` ile `rerun_group=all` olduğunda veya `npm_telegram_package_spec` ayarlandığında
bağımsız paket Telegram E2E'yi tetikler. Ardından `OpenClaw Release
Checks`; kurulum smoke, çapraz işletim sistemi release kontrolleri, canlı/E2E Docker
release yolu kapsamı, Telegram paketi QA ile Package Acceptance, QA Lab
paritesi, canlı Matrix ve canlı Telegram işlerini yayar. Tam çalıştırma yalnızca
`Full Release Validation`
özeti `normal_ci` ve `release_checks` işlerini başarılı gösterdiğinde kabul edilebilir. full/all modunda,
`npm_telegram` alt işinin de başarılı olması gerekir; full/all dışında yayımlanmış bir
`npm_telegram_package_spec` sağlanmadıkça atlanır. Nihai
doğrulayıcı özeti her alt çalıştırma için en yavaş iş tablolarını içerir; böylece release
yöneticisi günlükleri indirmeden mevcut kritik yolu görebilir.
Eksiksiz aşama matrisi, tam iş akışı iş adları, stable ve full profil
farkları, artifact'ler ve odaklı yeniden çalıştırma tutamaçları için
[Tam release doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.
Alt iş akışları, hedef `ref` daha eski bir release branch'ine veya tag'e işaret etse bile
`Full Release
Validation` çalıştıran güvenilir ref'ten, normalde `--ref main` üzerinden tetiklenir. Ayrı bir Full Release Validation
workflow-ref girdisi yoktur; güvenilir harness'i iş akışı çalıştırma ref'ini seçerek belirleyin.
Hareketli `main` üzerinde kesin commit kanıtı için `--ref main -f ref=<sha>` kullanmayın;
ham commit SHA'ları workflow dispatch ref'i olamaz, bu nedenle sabitlenmiş geçici branch'i oluşturmak için
`pnpm ci:full-release --sha <sha>` kullanın.

Canlı/provider kapsamını seçmek için `release_profile` kullanın:

- `minimum`: en hızlı release açısından kritik OpenAI/core canlı ve Docker yolu
- `stable`: release onayı için minimuma ek olarak stable provider/backend kapsamı
- `full`: stable'a ek olarak geniş advisory provider/media kapsamı

`OpenClaw Release Checks`, hedef
ref'i bir kez `release-package-under-test` olarak çözmek için güvenilir iş akışı ref'ini kullanır ve bu artifact'i hem
release yolu Docker kontrollerinde hem de Package Acceptance içinde yeniden kullanır. Bu, tüm
paket odaklı kutuların aynı baytlar üzerinde kalmasını sağlar ve tekrarlı paket derlemelerinden kaçınır.
Çapraz işletim sistemi OpenAI kurulum smoke'u, repo/org değişkeni ayarlandığında
`OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır, aksi halde `openai/gpt-5.4` kullanır; çünkü bu lane
en yavaş varsayılan modeli benchmark etmekten çok paket kurulumu, onboarding, gateway başlatma ve tek bir canlı agent turunu
kanıtlar. Daha geniş canlı provider
matrisi, modele özel kapsamın yeri olmaya devam eder.

Release aşamasına bağlı olarak şu varyantları kullanın:

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

Odaklı bir düzeltmeden sonra ilk yeniden çalıştırma olarak full umbrella'yı kullanmayın. Bir kutu
başarısız olursa, sonraki kanıt için başarısız alt iş akışını, işi, Docker lane'ini, paket profilini, model
provider'ını veya QA lane'ini kullanın. Full umbrella'yı yalnızca
düzeltme paylaşılan release orkestrasyonunu değiştirdiğinde veya önceki tüm kutu kanıtlarını
geçersiz kıldığında yeniden çalıştırın. Umbrella'nın nihai doğrulayıcısı kaydedilen alt iş akışı çalıştırma
id'lerini yeniden kontrol eder; bu nedenle bir alt iş akışı başarıyla yeniden çalıştırıldıktan sonra yalnızca başarısız
`Verify full validation` üst işini yeniden çalıştırın.

Sınırlı kurtarma için umbrella'ya `rerun_group` iletin. `all` gerçek
release-candidate çalıştırmasıdır, `ci` yalnızca normal CI alt işini çalıştırır, `plugin-prerelease`
yalnızca release'e özel Plugin alt işini çalıştırır, `release-checks` her release
kutusunu çalıştırır ve daha dar release grupları `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ve `npm-telegram` şeklindedir.
Odaklı `npm-telegram` yeniden çalıştırmaları `npm_telegram_package_spec` gerektirir; `release_profile=full` ile full/all çalıştırmaları
release-checks paket artifact'ini kullanır.

### Vitest

Vitest kutusu manuel `CI` alt iş akışıdır. Manuel CI kasıtlı olarak
changed scoping'i atlar ve release candidate için normal test grafiğini zorunlu kılar: Linux Node shard'ları, bundled-plugin shard'ları, channel kontratları, Node 22
uyumluluğu, `check`, `check-additional`, build smoke, docs kontrolleri, Python
Skills, Windows, macOS, Android ve Control UI i18n.

"Kaynak ağacı tam normal test paketini geçti mi?" sorusunu yanıtlamak için bu kutuyu kullanın.
Bu, release yolu ürün doğrulamasıyla aynı şey değildir. Saklanacak kanıtlar:

- tetiklenen `CI` çalıştırma URL'sini gösteren `Full Release Validation` özeti
- tam hedef SHA üzerinde yeşil `CI` çalıştırması
- regresyonları incelerken CI işlerinden başarısız veya yavaş shard adları
- bir çalıştırmanın performans analizi gerektirdiği durumlarda `.artifacts/vitest-shard-timings.json` gibi Vitest zamanlama artifact'leri

Release deterministik normal CI gerektiriyor ama Docker, QA Lab, canlı, çapraz işletim sistemi veya paket kutularını gerektirmiyorsa
manuel CI'ı doğrudan çalıştırın:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker kutusu, `OpenClaw Release Checks` içinde
`openclaw-live-and-e2e-checks-reusable.yml` üzerinden ve release modu
`install-smoke` iş akışıyla yer alır. Release candidate'i yalnızca kaynak düzeyi testler yerine paketlenmiş
Docker ortamları üzerinden doğrular.

Release Docker kapsamı şunları içerir:

- yavaş Bun global kurulum smoke'u etkinleştirilmiş tam kurulum smoke'u
- QR,
  root/gateway ve installer/Bun smoke işlerinin ayrı install-smoke
  shard'ları olarak çalıştığı, hedef SHA'ya göre root Dockerfile smoke image hazırlığı/yeniden kullanımı
- depo E2E lane'leri
- release yolu Docker parçaları: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` ve `plugins-runtime-install-h`
- istendiğinde `plugins-runtime-services` parçası içinde OpenWebUI kapsamı
- bölünmüş bundled Plugin kurulum/kaldırma lane'leri:
  `bundled-plugin-install-uninstall-0` ile
  `bundled-plugin-install-uninstall-23` arası
- release kontrolleri canlı paketleri içerdiğinde canlı/E2E provider paketleri ve Docker canlı model kapsamı

Yeniden çalıştırmadan önce Docker artifact'lerini kullanın. Release yolu planlayıcı,
lane günlükleri, `summary.json`, `failures.json`,
faz zamanlamaları, planlayıcı plan JSON'u ve yeniden çalıştırma komutlarıyla `.artifacts/docker-tests/` yükler. Odaklı kurtarma için
tüm release parçalarını yeniden çalıştırmak yerine yeniden kullanılabilir canlı/E2E iş akışında
`docker_lanes=<lane[,lane]>` kullanın. Oluşturulan yeniden çalıştırma komutları, varsa önceki
`package_artifact_run_id` ve hazırlanmış Docker image girdilerini içerir; böylece
başarısız bir lane aynı tarball'ı ve GHCR image'larını yeniden kullanabilir.

### QA Lab

QA Lab kutusu da `OpenClaw Release Checks` parçasıdır. Vitest ve Docker
paket mekaniğinden ayrı, agentic davranış ve kanal düzeyi release kapısıdır.

Release QA Lab kapsamı şunları içerir:

- agentic parity pack kullanarak OpenAI candidate lane'ini Opus 4.6
  baseline'ı ile karşılaştıran mock parity lane'i
- `qa-live-shared` ortamını kullanan hızlı canlı Matrix QA profili
- Convex CI credential lease'leri kullanan canlı Telegram QA lane'i
- release telemetrisinin açık yerel kanıt gerektirdiği durumlarda `pnpm qa:otel:smoke`

"Release, QA senaryolarında ve canlı kanal akışlarında doğru davranıyor mu?" sorusunu yanıtlamak için bu kutuyu kullanın.
Release'i onaylarken parity, Matrix ve Telegram
lane'leri için artifact URL'lerini saklayın. Tam Matrix kapsamı, varsayılan release açısından kritik lane yerine
manuel sharded QA-Lab çalıştırması olarak kullanılabilir kalır.

### Paket

Paket kutusu kurulabilir ürün kapısıdır. `Package Acceptance` ve
`scripts/resolve-openclaw-package-candidate.mjs` resolver'ı tarafından desteklenir. Resolver, bir
candidate'i Docker E2E tarafından tüketilen `package-under-test` tarball'ına normalleştirir, paket envanterini doğrular,
paket sürümünü ve SHA-256'yı kaydeder ve
iş akışı harness ref'ini paket kaynak ref'inden ayrı tutar.

Desteklenen candidate kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya tam bir OpenClaw release
  sürümü
- `source=ref`: seçili `workflow_ref` harness ile güvenilir bir `package_ref` branch'ini, tag'ini veya tam commit SHA'sını paketler
- `source=url`: zorunlu `package_sha256` ile bir HTTPS `.tgz` indirir
- `source=artifact`: başka bir GitHub Actions çalıştırması tarafından yüklenen bir `.tgz` dosyasını yeniden kullanır

`OpenClaw Release Checks`, Package Acceptance'ı `source=artifact`, hazırlanmış release package artifact'i,
`suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` ve
`telegram_mode=mock-openai` ile çalıştırır. Package Acceptance; migration, update, eski
Plugin dependency cleanup, offline Plugin fixture'ları, Plugin update ve Telegram
package QA'yı aynı çözümlenmiş tarball'a karşı tutar. Upgrade matrisi `2026.4.23` sürümünden `latest` sürümüne kadar npm'de yayımlanmış her stable baseline'ı kapsar; hâlihazırda gönderilmiş bir candidate için
`source=npm` ile Package Acceptance kullanın veya yayımlamadan önce SHA destekli yerel npm tarball'ı için
`source=ref`/`source=artifact` kullanın. Bu, daha önce
Parallels gerektiren paket/update kapsamının çoğu için GitHub yerel
yerine geçendir. Çapraz işletim sistemi release kontrolleri, işletim sistemine özel onboarding,
installer ve platform davranışı için hâlâ önemlidir, ancak paket/update ürün doğrulaması
Package Acceptance'ı tercih etmelidir.

Update ve Plugin doğrulaması için kanonik kontrol listesi
[Update'leri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüdür. Bir
Plugin kurulumu/update'i, doctor cleanup veya yayımlanmış paket migration değişikliğini hangi yerel, Docker, Package Acceptance veya release-check lane'inin kanıtladığına
karar verirken bunu kullanın.
Her stable `2026.4.23+` paketinden kapsamlı yayımlanmış update migration,
Full Release CI'ın parçası değil, ayrı bir manuel `Update Migration` iş akışıdır.

Eski package-acceptance esnekliği kasıtlı olarak zamanla sınırlıdır. `2026.4.25` dahil
paketler, npm'e zaten yayımlanmış metadata boşlukları için uyumluluk yolunu kullanabilir:
tarball'da eksik özel QA envanter girişleri, eksik
`gateway install --wrapper`, tarball'dan türetilmiş git
fixture'ında eksik patch dosyaları, kalıcılaştırılmış `update.channel` eksikliği, eski Plugin install-record
konumları, marketplace install-record kalıcılığı eksikliği ve `plugins update` sırasında config metadata
migration. Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel build metadata stamp dosyaları için uyarı verebilir. Daha sonraki paketler
modern paket kontratlarını karşılamalıdır; aynı boşluklar release
doğrulamasını başarısız kılar.

Release sorusu gerçek bir kurulabilir paketle ilgili olduğunda daha geniş Package Acceptance profillerini kullanın:

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

- `smoke`: hızlı paket kurulum/kanal/agent, gateway ağı ve config
  reload lane'leri
- `package`: canlı ClawHub olmadan kurulum/update/Plugin paket kontratları; bu release-check
  varsayılanıdır
- `product`: `package` artı MCP kanalları, cron/subagent cleanup, OpenAI web
  search ve OpenWebUI
- `full`: OpenWebUI ile Docker release yolu parçaları
- `custom`: odaklı yeniden çalıştırmalar için tam `docker_lanes` listesi

Paket adayı Telegram kanıtı için Package Acceptance üzerinde `telegram_mode=mock-openai` veya
`telegram_mode=live-frontier` etkinleştirin. İş akışı, çözümlenen
`package-under-test` tarball'unu Telegram hattına geçirir; bağımsız
Telegram iş akışı, yayımlama sonrası denetimler için yayımlanmış bir npm tanımını hâlâ kabul eder.

## Sürüm yayımlama otomasyonu

`OpenClaw Release Publish` normal değişiklik yapan yayımlama giriş noktasıdır.
Güvenilir yayımlayıcı iş akışlarını sürümün ihtiyaç duyduğu sırada düzenler:

1. Sürüm etiketini checkout yapın ve commit SHA'sını çözümleyin.
2. Etiketin `main` veya `release/*` üzerinden erişilebilir olduğunu doğrulayın.
3. `pnpm plugins:sync:check` çalıştırın.
4. `Plugin NPM Release` iş akışını `publish_scope=all-publishable` ve
   `ref=<release-sha>` ile başlatın.
5. `Plugin ClawHub Release` iş akışını aynı kapsam ve SHA ile başlatın.
6. `OpenClaw NPM Release` iş akışını sürüm etiketi, npm dist-tag ve
   kaydedilmiş `preflight_run_id` ile başlatın.

Beta yayımlama örneği:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Alpha yayımlama örneği:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-alpha.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=alpha
```

Varsayılan beta dist-tag'e kararlı yayımlama:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Doğrudan `latest` için kararlı yükseltme açıkça belirtilir:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Daha alt düzey `Plugin NPM Release` ve `Plugin ClawHub Release` iş akışlarını
yalnızca odaklı onarım veya yeniden yayımlama işi için kullanın. Seçili bir plugin onarımı için
`plugin_publish_scope=selected` ve `plugins=@openclaw/name` değerlerini
`OpenClaw Release Publish` iş akışına geçirin veya OpenClaw paketinin yayımlanmaması
gerektiğinde alt iş akışını doğrudan başlatın.

## NPM iş akışı girdileri

`OpenClaw NPM Release` operatör tarafından denetlenen şu girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya
  `v2026.4.2-alpha.1` ya da `v2026.4.2-beta.1` gibi zorunlu sürüm etiketi; `preflight_only=true` olduğunda, yalnızca doğrulama preflight'ı için mevcut
  tam 40 karakterli iş akışı dalı commit SHA'sı da olabilir
- `preflight_only`: yalnızca doğrulama/derleme/paket için `true`, gerçek
  yayımlama yolu için `false`
- `preflight_run_id`: iş akışının başarılı preflight çalışmasından hazırlanan
  tarball'u yeniden kullanması için gerçek yayımlama yolunda zorunludur
- `npm_dist_tag`: yayımlama yolu için npm hedef etiketi; varsayılanı `beta`

`OpenClaw Release Publish` operatör tarafından denetlenen şu girdileri kabul eder:

- `tag`: zorunlu sürüm etiketi; zaten var olmalıdır
- `preflight_run_id`: başarılı `OpenClaw NPM Release` preflight çalışma kimliği;
  `publish_openclaw_npm=true` olduğunda zorunludur
- `npm_dist_tag`: OpenClaw paketi için npm hedef etiketi
- `plugin_publish_scope`: varsayılanı `all-publishable`; `selected` değerini yalnızca
  odaklı onarım işi için kullanın
- `plugins`: `plugin_publish_scope=selected` olduğunda virgülle ayrılmış
  `@openclaw/*` paket adları
- `publish_openclaw_npm`: varsayılanı `true`; yalnızca iş akışını
  plugin'e özel onarım düzenleyicisi olarak kullanırken `false` ayarlayın

`OpenClaw Release Checks` operatör tarafından denetlenen şu girdileri kabul eder:

- `ref`: doğrulanacak dal, etiket veya tam commit SHA. Gizli içeren denetimler,
  çözümlenen commit'in bir OpenClaw dalından veya sürüm etiketinden
  erişilebilir olmasını gerektirir.

Kurallar:

- Kararlı ve düzeltme etiketleri `beta` veya `latest` etiketlerinden birine yayımlanabilir
- Alpha ön sürüm etiketleri yalnızca `alpha` etiketine yayımlanabilir
- Beta ön sürüm etiketleri yalnızca `beta` etiketine yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca
  `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` ve `Full Release Validation` her zaman
  yalnızca doğrulama amaçlıdır
- Gerçek yayımlama yolu, preflight sırasında kullanılan aynı `npm_dist_tag` değerini kullanmalıdır;
  iş akışı, yayımlamadan önce bu metadata'nın devam ettiğini doğrular

## Kararlı npm sürüm sırası

Kararlı bir npm sürümü çıkarırken:

1. `OpenClaw NPM Release` iş akışını `preflight_only=true` ile çalıştırın
   - Bir etiket mevcut olmadan önce, preflight iş akışının yalnızca doğrulama amaçlı kuru çalıştırması için mevcut tam iş akışı dalı commit
     SHA'sını kullanabilirsiniz
2. Normal önce-beta akışı için `npm_dist_tag=beta` seçin veya yalnızca
   bilinçli olarak doğrudan kararlı yayımlama istediğinizde `latest` seçin
3. Tek bir manuel iş akışından normal CI artı canlı prompt önbelleği, Docker, QA Lab,
   Matrix ve Telegram kapsamı istediğinizde sürüm dalı, sürüm etiketi veya tam
   commit SHA üzerinde `Full Release Validation` çalıştırın
4. Bilinçli olarak yalnızca deterministik normal test grafiğine ihtiyacınız varsa,
   bunun yerine sürüm ref'i üzerinde manuel `CI` iş akışını çalıştırın
5. Başarılı `preflight_run_id` değerini kaydedin
6. Aynı `tag`, aynı `npm_dist_tag` ve kaydedilmiş `preflight_run_id` ile
   `OpenClaw Release Publish` çalıştırın; OpenClaw npm paketini yükseltmeden önce
   dışsallaştırılmış plugin'leri npm ve ClawHub'a yayımlar
7. Sürüm `beta` üzerine indiyse, bu kararlı sürümü `beta` etiketinden `latest` etiketine yükseltmek için özel
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   iş akışını kullanın
8. Sürüm bilinçli olarak doğrudan `latest` etiketine yayımlandıysa ve `beta`
   aynı kararlı derlemeyi hemen takip etmeliyse, her iki dist-tag'i de kararlı sürüme işaret etmek için aynı özel
   iş akışını kullanın veya zamanlanmış kendi kendini iyileştiren senkronizasyonunun
   `beta` etiketini daha sonra taşımasına izin verin

Dist-tag değişikliği güvenlik nedeniyle özel repoda bulunur, çünkü hâlâ
`NPM_TOKEN` gerektirir; public repo ise yalnızca OIDC yayımlamayı tutar.

Bu, doğrudan yayımlama yolunu ve önce-beta yükseltme yolunu hem
belgelenmiş hem de operatör tarafından görünür tutar.

Bir maintainer'ın yerel npm kimlik doğrulamasına geri dönmesi gerekirse, tüm 1Password
CLI (`op`) komutlarını yalnızca ayrılmış bir tmux oturumu içinde çalıştırın. `op` komutunu
doğrudan ana agent shell'den çağırmayın; tmux içinde tutmak prompt'ları,
uyarıları ve OTP işlemlerini gözlemlenebilir kılar ve tekrarlanan host uyarılarını önler.

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

Maintainer'lar gerçek runbook için
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
içindeki özel sürüm belgelerini kullanır.

## İlgili

- [Sürüm kanalları](/tr/install/development-channels)
