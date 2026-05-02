---
read_when:
    - Herkese açık sürüm kanalı tanımları aranıyor
    - Sürüm doğrulamasını veya paket kabulünü çalıştırma
    - Sürüm adlandırması ve yayın sıklığı aranıyor
summary: Yayın kulvarları, operatör kontrol listesi, doğrulama kutuları, sürüm adlandırması ve ritim
title: Yayın politikası
x-i18n:
    generated_at: "2026-05-02T23:39:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba316d1736eae8edd2fb0a71b9a3da345f8895c3b536e9a1f619718ea12fc851
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw'ın üç herkese açık yayın kanalı vardır:

- stable: varsayılan olarak npm `beta`'ya veya açıkça istendiğinde npm `latest`'e yayımlanan etiketli sürümler
- beta: npm `beta`'ya yayımlanan önsürüm etiketleri
- dev: `main` dalının hareketli başı

## Sürüm adlandırma

- Kararlı yayın sürümü: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Kararlı düzeltme yayını sürümü: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta önsürüm sürümü: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ayı veya günü başına sıfır ekleyerek yazmayın
- `latest`, geçerli terfi ettirilmiş kararlı npm yayını anlamına gelir
- `beta`, geçerli beta kurulum hedefi anlamına gelir
- Kararlı ve kararlı düzeltme yayınları varsayılan olarak npm `beta`'ya yayımlanır; yayın operatörleri açıkça `latest` hedefleyebilir veya incelenmiş bir beta derlemesini daha sonra terfi ettirebilir
- Her kararlı OpenClaw yayını npm paketini ve macOS uygulamasını birlikte gönderir;
  beta yayınları normalde önce npm/paket yolunu doğrular ve yayımlar, mac
  uygulama derleme/imzalama/noterleştirme işlemleri ise açıkça istenmedikçe kararlı sürüm için ayrılır

## Yayın temposu

- Yayınlar önce beta olacak şekilde ilerler
- Kararlı sürüm yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar normalde yayınları geçerli `main` dalından oluşturulan bir
  `release/YYYY.M.D` dalından çıkarır; böylece yayın doğrulaması ve düzeltmeleri
  `main` üzerindeki yeni geliştirmeleri engellemez
- Bir beta etiketi gönderilmiş veya yayımlanmışsa ve düzeltme gerekiyorsa, bakımcılar
  eski beta etiketini silmek veya yeniden oluşturmak yerine bir sonraki `-beta.N` etiketini çıkarır
- Ayrıntılı yayın prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca bakımcılara özeldir

## Yayın operatörü kontrol listesi

Bu kontrol listesi yayın akışının herkese açık biçimidir. Özel kimlik bilgileri,
imzalama, noterleştirme, dist-tag kurtarma ve acil geri alma ayrıntıları
yalnızca bakımcılara özel yayın çalışma kitabında kalır.

1. Geçerli `main` dalından başlayın: en son değişiklikleri çekin, hedef commit'in gönderildiğini
   doğrulayın ve geçerli `main` CI durumunun dal oluşturmak için yeterince yeşil olduğunu doğrulayın.
2. Üstteki `CHANGELOG.md` bölümünü gerçek commit geçmişinden `/changelog` ile yeniden yazın,
   girdileri kullanıcı odaklı tutun, commit'leyin, gönderin ve dal oluşturmadan önce bir kez daha rebase/pull yapın.
3. `src/plugins/compat/registry.ts` ve
   `src/commands/doctor/shared/deprecation-compat.ts` içindeki yayın uyumluluk kayıtlarını gözden geçirin. Süresi dolmuş
   uyumluluğu yalnızca yükseltme yolu kapsanmaya devam ediyorsa kaldırın veya neden
   bilinçli olarak taşındığını kaydedin.
4. Geçerli `main` dalından `release/YYYY.M.D` oluşturun; normal yayın işlerini
   doğrudan `main` üzerinde yapmayın.
5. Amaçlanan etiket için gereken her sürüm konumunu artırın, yayımlanabilir Plugin paketlerinin yayın
   sürümünü ve uyumluluk meta verilerini paylaşması için `pnpm plugins:sync` çalıştırın, ardından yerel belirlenimci ön kontrolü çalıştırın:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` ve
   `pnpm release:check`.
6. `OpenClaw NPM Release` işini `preflight_only=true` ile çalıştırın. Bir etiket var olmadan önce,
   yalnızca doğrulama amaçlı ön kontrol için tam 40 karakterlik yayın dalı SHA'sına izin verilir.
   Başarılı `preflight_run_id` değerini kaydedin.
7. Yayın dalı, etiket veya tam commit SHA'sı için `Full Release Validation` ile tüm yayın öncesi testleri başlatın.
   Bu, dört büyük yayın test kutusu için tek manuel giriş noktasıdır: Vitest, Docker, QA Lab ve Package.
8. Doğrulama başarısız olursa, yayın dalında düzeltin ve düzeltmeyi kanıtlayan en küçük başarısız
   dosyayı, kanalı, workflow işini, paket profilini, sağlayıcıyı veya model izin listesini yeniden çalıştırın.
   Tam şemsiyeyi yalnızca değişen yüzey önceki kanıtları bayatlattığında yeniden çalıştırın.
9. Beta için `vYYYY.M.D-beta.N` etiketini oluşturun, ardından eşleşen `release/YYYY.M.D` dalından
   `OpenClaw Release Publish` çalıştırın. Bu, `pnpm plugins:sync:check` doğrulaması yapar,
   tüm yayımlanabilir Plugin paketlerini önce npm'ye yayımlar, aynı seti ikinci olarak ClawHub'a yayımlar
   ve ardından hazırlanan OpenClaw npm ön kontrol yapıtını eşleşen dist-tag ile terfi ettirir.
   Yayından sonra, yayımlanan `openclaw@YYYY.M.D-beta.N` veya
   `openclaw@beta` paketine karşı yayın sonrası paket kabulünü çalıştırın. Gönderilmiş veya yayımlanmış bir önsürüm
   düzeltme gerektiriyorsa, bir sonraki eşleşen önsürüm numarasını çıkarın; eski
   önsürümü silmeyin veya yeniden yazmayın.
10. Kararlı sürüm için yalnızca incelenmiş beta veya yayın adayının gerekli doğrulama kanıtı varsa devam edin.
    Kararlı npm yayını da `OpenClaw Release Publish` üzerinden gider ve başarılı ön kontrol yapıtını
    `preflight_run_id` ile yeniden kullanır; kararlı macOS yayın hazırlığı ayrıca
    paketlenmiş `.zip`, `.dmg`, `.dSYM.zip` ve `main` üzerinde güncellenmiş `appcast.xml` gerektirir.
11. Yayından sonra npm yayın sonrası doğrulayıcısını, yayın sonrası kanal kanıtı gerektiğinde isteğe bağlı bağımsız
    published-npm Telegram E2E'yi, gerektiğinde dist-tag terfisini, eksiksiz eşleşen
    `CHANGELOG.md` bölümünden GitHub yayın/önsürüm notlarını ve yayın duyurusu
    adımlarını çalıştırın.

## Yayın ön kontrolü

- Sürüm ön kontrolünden önce `pnpm check:test-types` çalıştırın; böylece test TypeScript’i daha hızlı yerel `pnpm check` kapısı dışında da kapsanmış olur
- Sürüm ön kontrolünden önce `pnpm check:architecture` çalıştırın; böylece daha geniş import döngüsü ve mimari sınır denetimleri daha hızlı yerel kapı dışında yeşil olur
- `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın; böylece beklenen `dist/*` sürüm yapıtları ve Control UI paketi paket doğrulama adımı için mevcut olur
- Kök sürüm artırmasından sonra ve etiketlemeden önce `pnpm plugins:sync` çalıştırın. Yayınlanabilir plugin paket sürümlerini, OpenClaw eş/API uyumluluk meta verilerini, derleme meta verilerini ve plugin değişiklik günlüğü taslaklarını çekirdek sürümle eşleşecek şekilde günceller. `pnpm plugins:sync:check` değişiklik yapmayan sürüm korumasıdır; bu adım unutulursa yayın iş akışı herhangi bir registry değişikliğinden önce başarısız olur.
- Sürüm onayından önce tüm sürüm öncesi test kutularını tek bir giriş noktasından başlatmak için manuel `Full Release Validation` iş akışını çalıştırın. Bir dal, etiket veya tam commit SHA kabul eder, manuel `CI` tetikler ve kurulum smoke, paket kabulü, Docker sürüm yolu paketleri, canlı/E2E, OpenWebUI, QA Lab paritesi, Matrix ve Telegram hatları için `OpenClaw Release Checks` tetikler. `release_profile=full` ve `rerun_group=all` ile, sürüm denetimlerinden gelen `release-package-under-test` yapıtına karşı paket Telegram E2E’yi de çalıştırır. Aynı Telegram E2E’nin yayınlanan npm paketini de kanıtlaması gerektiğinde yayımlamadan sonra `npm_telegram_package_spec` sağlayın. Package Acceptance’ın paket/güncelleme matrisini SHA ile derlenmiş yapıt yerine gönderilmiş npm paketine karşı çalıştırması gerektiğinde yayımlamadan sonra `package_acceptance_package_spec` sağlayın. Özel kanıt raporunun doğrulamanın yayınlanmış bir npm paketiyle eşleştiğini Telegram E2E’yi zorlamadan kanıtlaması gerektiğinde `evidence_package_spec` sağlayın. Örnek:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Sürüm çalışması devam ederken bir paket adayı için yan kanal kanıtı istediğinizde manuel `Package Acceptance` iş akışını çalıştırın. `openclaw@beta`, `openclaw@latest` veya tam bir sürüm için `source=npm`; güvenilir bir `package_ref` dalını/etiketini/SHA’sını geçerli `workflow_ref` düzeniyle paketlemek için `source=ref`; zorunlu SHA-256 içeren HTTPS tarball için `source=url`; veya başka bir GitHub Actions çalıştırması tarafından yüklenmiş tarball için `source=artifact` kullanın. İş akışı adayı `package-under-test` olarak çözümler, Docker E2E sürüm zamanlayıcısını bu tarball’a karşı yeniden kullanır ve `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` ile aynı tarball’a karşı Telegram QA çalıştırabilir. Seçilen Docker hatları `published-upgrade-survivor` içerdiğinde, paket yapıtı adaydır ve `published_upgrade_survivor_baseline` yayınlanmış temel sürümü seçer.
  Örnek: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Yaygın profiller:
  - `smoke`: kurulum/kanal/ajan, gateway ağı ve yapılandırma yeniden yükleme hatları
  - `package`: OpenWebUI veya canlı ClawHub olmadan yapıt yerel paket/güncelleme/plugin hatları
  - `product`: paket profiline ek olarak MCP kanalları, cron/alt ajan temizliği, OpenAI web araması ve OpenWebUI
  - `full`: OpenWebUI ile Docker sürüm yolu parçaları
  - `custom`: odaklı yeniden çalıştırma için tam `docker_lanes` seçimi
- Yalnızca sürüm adayı için tam normal CI kapsamına ihtiyacınız olduğunda manuel `CI` iş akışını doğrudan çalıştırın. Manuel CI tetiklemeleri değişiklik kapsamını atlar ve Linux Node parçalarını, paketli plugin parçalarını, kanal sözleşmelerini, Node 22 uyumluluğunu, `check`, `check-additional`, derleme smoke, dokümantasyon denetimleri, Python skills, Windows, macOS, Android ve Control UI i18n hatlarını zorlar.
  Örnek: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Sürüm telemetrisini doğrularken `pnpm qa:otel:smoke` çalıştırın. QA-lab’ı yerel bir OTLP/HTTP alıcısı üzerinden çalıştırır ve Opik, Langfuse veya başka bir harici toplayıcı gerektirmeden dışa aktarılan iz span adlarını, sınırlı öznitelikleri ve içerik/tanımlayıcı redaksiyonunu doğrular.
- Her etiketli sürümden önce `pnpm release:check` çalıştırın
- Etiket mevcut olduktan sonra değişiklik yapan yayımlama dizisi için `OpenClaw Release Publish` çalıştırın. Bunu `release/YYYY.M.D` üzerinden tetikleyin (veya main’den erişilebilen bir etiket yayımlarken `main` üzerinden), sürüm etiketini ve başarılı OpenClaw npm `preflight_run_id` değerini geçirin ve bilerek odaklı bir onarım çalıştırmadığınız sürece varsayılan plugin yayımlama kapsamını `all-publishable` olarak tutun. İş akışı, çekirdek paket dışsallaştırılmış plugin’lerinden önce yayımlanmasın diye plugin npm yayımlamayı, plugin ClawHub yayımlamayı ve OpenClaw npm yayımlamayı seri hale getirir.
- Sürüm denetimleri artık ayrı bir manuel iş akışında çalışır:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`, sürüm onayından önce QA Lab mock parite hattını, hızlı canlı Matrix profilini ve Telegram QA hattını da çalıştırır. Canlı hatlar `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI kimlik bilgisi kiralamalarını kullanır. Tam Matrix taşıma, medya ve E2EE envanterini paralel istediğinizde `matrix_profile=all` ve `matrix_shards=true` ile manuel `QA-Lab - All Lanes` iş akışını çalıştırın.
- İşletim sistemleri arası kurulum ve yükseltme çalışma zamanı doğrulaması, yeniden kullanılabilir iş akışı `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` dosyasını doğrudan çağıran herkese açık `OpenClaw Release Checks` ve `Full Release Validation` kapsamındadır
- Bu ayrım kasıtlıdır: gerçek npm sürüm yolunu kısa, deterministik ve yapıt odaklı tutarken daha yavaş canlı denetimleri kendi hattında bırakın; böylece yayımlamayı duraklatmaz veya engellemezler
- Gizli içeren sürüm denetimleri `Full Release Validation` üzerinden veya `main`/sürüm iş akışı ref’inden tetiklenmelidir; böylece iş akışı mantığı ve gizliler kontrollü kalır
- `OpenClaw Release Checks`, çözümlenen commit bir OpenClaw dalından veya sürüm etiketinden erişilebilir olduğu sürece bir dal, etiket veya tam commit SHA kabul eder
- `OpenClaw NPM Release` yalnızca doğrulama ön kontrolü, itilmiş bir etiket gerektirmeden geçerli tam 40 karakterli iş akışı dalı commit SHA’sını da kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek yayımlamaya yükseltilemez
- SHA modunda iş akışı yalnızca paket meta verisi denetimi için `v<package.json version>` sentezler; gerçek yayımlama yine gerçek bir sürüm etiketi gerektirir
- Her iki iş akışı da gerçek yayımlama ve yükseltme yolunu GitHub tarafından barındırılan çalıştırıcılarda tutarken, değişiklik yapmayan doğrulama yolu daha büyük Blacksmith Linux çalıştırıcılarını kullanabilir
- Bu iş akışı, hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` iş akışı gizlilerini kullanarak `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` çalıştırır
- npm sürüm ön kontrolü artık ayrı sürüm denetimleri hattını beklemez
- Onaydan önce `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (veya eşleşen beta/düzeltme etiketi) çalıştırın
- npm yayımlamasından sonra, yayınlanan registry kurulum yolunu yeni bir geçici önekte doğrulamak için `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (veya eşleşen beta/düzeltme sürümü) çalıştırın
- Bir beta yayımlamasından sonra, paylaşılan kiralık Telegram kimlik bilgisi havuzunu kullanarak yayınlanan npm paketine karşı kurulu paket onboarding’ini, Telegram kurulumunu ve gerçek Telegram E2E’yi doğrulamak için `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` çalıştırın. Yerel maintainer tek seferlik çalıştırmaları Convex değişkenlerini atlayabilir ve üç `OPENCLAW_QA_TELEGRAM_*` ortam kimlik bilgisini doğrudan geçirebilir.
- Maintainer’lar aynı yayımlama sonrası denetimi GitHub Actions üzerinden manuel `NPM Telegram Beta E2E` iş akışıyla çalıştırabilir. Bu bilerek yalnızca manueldir ve her merge işleminde çalışmaz.
- Maintainer sürüm otomasyonu artık ön kontrol-sonra-yükselt modelini kullanır:
  - gerçek npm yayımlama başarılı bir npm `preflight_run_id` geçmelidir
  - gerçek npm yayımlama, başarılı ön kontrol çalıştırmasıyla aynı `main` veya `release/YYYY.M.D` dalından tetiklenmelidir
  - kararlı npm sürümleri varsayılan olarak `beta` kullanır
  - kararlı npm yayımlaması iş akışı girdisiyle açıkça `latest` hedefleyebilir
  - token tabanlı npm dist-tag değişikliği artık güvenlik nedeniyle `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` içinde yer alır; çünkü `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirirken herkese açık repo yalnızca OIDC yayımlamayı korur
  - herkese açık `macOS Release` yalnızca doğrulama içindir; bir etiket yalnızca bir sürüm dalında yaşıyorsa ancak iş akışı `main` üzerinden tetikleniyorsa `public_release_branch=release/YYYY.M.D` ayarlayın
  - gerçek özel mac yayımlama başarılı özel mac `preflight_run_id` ve `validate_run_id` geçmelidir
  - gerçek yayımlama yolları yapıtları yeniden derlemek yerine hazırlanmış yapıtları yükseltir
- `YYYY.M.D-N` gibi kararlı düzeltme sürümleri için yayımlama sonrası doğrulayıcı, sürüm düzeltmelerinin eski global kurulumları temel kararlı payload üzerinde sessizce bırakmaması için aynı geçici önek yükseltme yolunu `YYYY.M.D` sürümünden `YYYY.M.D-N` sürümüne de denetler
- npm sürüm ön kontrolü, tarball hem `dist/control-ui/index.html` hem de boş olmayan bir `dist/control-ui/assets/` payload içermedikçe kapalı şekilde başarısız olur; böylece tekrar boş bir tarayıcı panosu göndermeyiz
- Yayımlama sonrası doğrulama, yayınlanmış plugin giriş noktalarının ve paket meta verilerinin kurulu registry düzeninde mevcut olduğunu da denetler. Eksik plugin çalışma zamanı payload’ları gönderen bir sürüm, postpublish doğrulayıcıda başarısız olur ve `latest` sürümüne yükseltilemez.
- `pnpm test:install:smoke`, aday güncelleme tarball’ında npm pack `unpackedSize` bütçesini de zorunlu kılar; böylece kurulum e2e, kazara paket şişmesini sürüm yayımlama yolundan önce yakalar
- Sürüm çalışması CI planlamasına, plugin zamanlama manifestlerine veya plugin test matrislerine dokunduysa, sürüm notlarının bayat bir CI düzenini açıklamaması için onaydan önce `.github/workflows/plugin-prerelease.yml` içinden planlayıcının sahip olduğu `plugin-prerelease-extension-shard` matris çıktısını yeniden üretin ve gözden geçirin
- Kararlı macOS sürüm hazırlığı ayrıca güncelleyici yüzeylerini içerir:
  - GitHub sürümü paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` ile sonuçlanmalıdır
  - `main` üzerindeki `appcast.xml`, yayımlamadan sonra yeni kararlı zip’i göstermelidir
  - paketlenmiş uygulama debug olmayan bir bundle id, boş olmayan bir Sparkle feed URL’si ve o sürüm için kanonik Sparkle derleme tabanına eşit veya üzerinde bir `CFBundleVersion` korumalıdır

## Sürüm test kutuları

`Full Release Validation`, operatörlerin tüm sürüm öncesi testleri tek bir giriş noktasından başlatma yoludur. Hızla değişen bir dalda sabitlenmiş commit kanıtı için yardımcıyı kullanın; böylece her alt iş akışı hedef SHA’ya sabitlenmiş geçici bir daldan çalışır:

```bash
pnpm ci:full-release --sha <full-sha>
```

Yardımcı `release-ci/<sha>-...` dalını iter, `Full Release Validation` iş akışını bu daldan `ref=<sha>` ile tetikler, her alt iş akışı `headSha` değerinin hedefle eşleştiğini doğrular, ardından geçici dalı siler. Bu, yanlışlıkla daha yeni bir `main` alt çalıştırmasını kanıtlamayı önler.

Sürüm dalı veya etiket doğrulaması için güvenilir `main` iş akışı ref’inden çalıştırın ve sürüm dalını veya etiketi `ref` olarak geçirin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

İş akışı hedef ref değerini çözer, `target_ref=<release-ref>` ile manuel `CI` tetikler, `OpenClaw Release Checks` tetikler ve `release_profile=full` ile `rerun_group=all` olduğunda veya `npm_telegram_package_spec` ayarlandığında bağımsız paket Telegram E2E tetikler. Ardından `OpenClaw Release Checks`; install smoke, cross-OS release checks, live/E2E Docker release-path kapsamı, Telegram paket QA ile Package Acceptance, QA Lab parity, canlı Matrix ve canlı Telegram işlerini genişletir. Tam bir çalıştırma yalnızca `Full Release Validation` özetinde `normal_ci` ve `release_checks` başarılı göründüğünde kabul edilebilir. Full/all modunda `npm_telegram` alt işi de başarılı olmalıdır; full/all dışında, yayımlanmış bir `npm_telegram_package_spec` sağlanmadığı sürece atlanır. Son doğrulayıcı özeti her alt çalıştırma için en yavaş iş tablolarını içerir; böylece release yöneticisi günlükleri indirmeden mevcut kritik yolu görebilir.
Tam aşama matrisi, kesin iş akışı iş adları, stable ile full profil farkları, artefaktlar ve odaklı yeniden çalıştırma tanıtıcıları için [Tam release doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.
Alt iş akışları, hedef `ref` daha eski bir release dalını veya etiketini işaret etse bile `Full Release Validation` çalıştıran güvenilir ref üzerinden, normalde `--ref main`, tetiklenir. Ayrı bir Full Release Validation workflow-ref girdisi yoktur; güvenilir harness değerini iş akışı çalıştırma ref değerini seçerek belirlersiniz.
Hareketli `main` üzerinde kesin commit kanıtı için `--ref main -f ref=<sha>` kullanmayın; ham commit SHA değerleri iş akışı dispatch ref olamaz, bu nedenle sabitlenmiş geçici dalı oluşturmak için `pnpm ci:full-release --sha <sha>` kullanın.

Canlı/provider kapsamını seçmek için `release_profile` kullanın:

- `minimum`: en hızlı release açısından kritik OpenAI/çekirdek canlı ve Docker yolu
- `stable`: release onayı için minimum artı stable provider/backend kapsamı
- `full`: stable artı geniş advisory provider/media kapsamı

`OpenClaw Release Checks`, hedef ref değerini bir kez `release-package-under-test` olarak çözmek için güvenilir iş akışı ref değerini kullanır ve bu artefaktı hem release-path Docker kontrollerinde hem Package Acceptance içinde yeniden kullanır. Bu, paketle yüzleşen tüm kutuları aynı baytlar üzerinde tutar ve tekrarlanan paket derlemelerini önler.
Cross-OS OpenAI install smoke, repo/org değişkeni ayarlandığında `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır; aksi halde `openai/gpt-5.4` kullanır, çünkü bu hat en yavaş varsayılan modeli benchmark etmek yerine paket kurulumunu, onboarding sürecini, gateway başlangıcını ve bir canlı agent turunu kanıtlar. Daha geniş canlı provider matrisi, modele özel kapsamın yeri olmaya devam eder.

Release aşamasına göre şu varyantları kullanın:

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

Odaklı bir düzeltmeden sonraki ilk yeniden çalıştırma olarak tam umbrella kullanmayın. Bir kutu başarısız olursa, sonraki kanıt için başarısız alt iş akışını, işi, Docker hattını, paket profilini, model provider değerini veya QA hattını kullanın. Tam umbrella değerini yalnızca düzeltme paylaşılan release orkestrasyonunu değiştirdiğinde veya önceki tüm kutu kanıtlarını güncelliğini yitirmiş hale getirdiğinde yeniden çalıştırın. Umbrella içindeki son doğrulayıcı, kaydedilmiş alt iş akışı çalıştırma kimliklerini yeniden kontrol eder; bu nedenle bir alt iş akışı başarıyla yeniden çalıştırıldıktan sonra yalnızca başarısız `Verify full validation` parent işini yeniden çalıştırın.

Sınırlı kurtarma için umbrella değerine `rerun_group` geçirin. `all` gerçek release-candidate çalıştırmasıdır, `ci` yalnızca normal CI alt işini çalıştırır, `plugin-prerelease` yalnızca release’e özel Plugin alt işini çalıştırır, `release-checks` her release kutusunu çalıştırır ve daha dar release grupları `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ve `npm-telegram` şeklindedir.
Odaklı `npm-telegram` yeniden çalıştırmaları `npm_telegram_package_spec` gerektirir; `release_profile=full` ile full/all çalıştırmaları release-checks paket artefaktını kullanır.

### Vitest

Vitest kutusu manuel `CI` alt iş akışıdır. Manuel CI, changed scoping işlemini özellikle atlar ve release candidate için normal test grafiğini zorunlu kılar: Linux Node shard’ları, bundled-plugin shard’ları, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS, Android ve Control UI i18n.

Bu kutuyu "kaynak ağacı tam normal test paketini geçti mi?" sorusunu yanıtlamak için kullanın. Bu, release-path ürün doğrulamasıyla aynı şey değildir. Saklanacak kanıtlar:

- gönderilen `CI` çalıştırma URL’sini gösteren `Full Release Validation` özeti
- kesin hedef SHA üzerinde yeşil `CI` çalıştırması
- regresyonlar araştırılırken CI işlerindeki başarısız veya yavaş shard adları
- bir çalıştırma performans analizi gerektirdiğinde `.artifacts/vitest-shard-timings.json` gibi Vitest zamanlama artefaktları

Manuel CI’yi doğrudan yalnızca release deterministik normal CI gerektirdiğinde ancak Docker, QA Lab, canlı, cross-OS veya paket kutularını gerektirmediğinde çalıştırın:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker kutusu, `OpenClaw Release Checks` içinde `openclaw-live-and-e2e-checks-reusable.yml` üzerinden ve release-mode `install-smoke` iş akışı üzerinden bulunur. Release candidate değerini yalnızca kaynak düzeyi testler yerine paketlenmiş Docker ortamları üzerinden doğrular.

Release Docker kapsamı şunları içerir:

- yavaş Bun global install smoke etkinleştirilmiş tam install smoke
- hedef SHA ile root Dockerfile smoke image hazırlama/yeniden kullanımı; QR, root/gateway ve installer/Bun smoke işleri ayrı install-smoke shard’ları olarak çalışır
- repository E2E hatları
- release-path Docker parçaları: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` ve `plugins-runtime-install-h`
- istendiğinde `plugins-runtime-services` parçası içinde OpenWebUI kapsamı
- ayrılmış bundled Plugin kurulum/kaldırma hatları:
  `bundled-plugin-install-uninstall-0` ile
  `bundled-plugin-install-uninstall-23` arası
- release checks canlı paketleri içerdiğinde live/E2E provider paketleri ve Docker canlı model kapsamı

Yeniden çalıştırmadan önce Docker artefaktlarını kullanın. Release-path scheduler, hat günlükleri, `summary.json`, `failures.json`, aşama zamanlamaları, scheduler plan JSON’u ve yeniden çalıştırma komutları ile `.artifacts/docker-tests/` yükler. Odaklı kurtarma için tüm release parçalarını yeniden çalıştırmak yerine yeniden kullanılabilir live/E2E iş akışında `docker_lanes=<lane[,lane]>` kullanın. Oluşturulan yeniden çalıştırma komutları, mevcut olduğunda önceki `package_artifact_run_id` ve hazırlanmış Docker image girdilerini içerir; böylece başarısız bir hat aynı tarball ve GHCR image’larını yeniden kullanabilir.

### QA Lab

QA Lab kutusu da `OpenClaw Release Checks` parçasıdır. Vitest ve Docker paket mekaniklerinden ayrı olan agentic davranış ve kanal düzeyi release kapısıdır.

Release QA Lab kapsamı şunları içerir:

- agentic parity pack kullanarak OpenAI candidate hattını Opus 4.6 baseline ile karşılaştıran mock parity hattı
- `qa-live-shared` ortamını kullanan hızlı canlı Matrix QA profili
- Convex CI credential lease’leri kullanan canlı Telegram QA hattı
- release telemetry açık yerel kanıt gerektirdiğinde `pnpm qa:otel:smoke`

Bu kutuyu "release, QA senaryolarında ve canlı kanal akışlarında doğru davranıyor mu?" sorusunu yanıtlamak için kullanın. Release onaylanırken parity, Matrix ve Telegram hatları için artefakt URL’lerini saklayın. Tam Matrix kapsamı, varsayılan release açısından kritik hat yerine manuel sharded QA-Lab çalıştırması olarak kullanılabilir olmaya devam eder.

### Paket

Paket kutusu kurulabilir ürün kapısıdır. `Package Acceptance` ve `scripts/resolve-openclaw-package-candidate.mjs` resolver tarafından desteklenir. Resolver bir candidate değerini Docker E2E tarafından tüketilen `package-under-test` tarball değerine normalize eder, paket envanterini doğrular, paket sürümünü ve SHA-256 değerini kaydeder ve iş akışı harness ref değerini paket kaynak ref değerinden ayrı tutar.

Desteklenen candidate kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya kesin bir OpenClaw release sürümü
- `source=ref`: seçili `workflow_ref` harness ile güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA değerini paketler
- `source=url`: gerekli `package_sha256` ile bir HTTPS `.tgz` indirir
- `source=artifact`: başka bir GitHub Actions çalıştırması tarafından yüklenen bir `.tgz` değerini yeniden kullanır

`OpenClaw Release Checks`, Package Acceptance işini `source=artifact`, hazırlanmış release paket artefaktı, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` ve `telegram_mode=mock-openai` ile çalıştırır. Package Acceptance; migration, update, stale Plugin dependency cleanup, offline Plugin fixture’ları, Plugin update ve Telegram package QA işlemlerini aynı çözümlenmiş tarball üzerinde tutar. Upgrade matrisi, `2026.4.23` ile `latest` arasındaki her stable npm-yayımlı baseline değerini kapsar; zaten gönderilmiş bir candidate için `source=npm` ile Package Acceptance kullanın veya publish öncesinde SHA destekli yerel npm tarball için `source=ref`/`source=artifact` kullanın. Bu, daha önce Parallels gerektiren paket/update kapsamının çoğu için GitHub-native alternatiftir. Cross-OS release checks, OS’ye özel onboarding, installer ve platform davranışı için hâlâ önemlidir; ancak paket/update ürün doğrulaması Package Acceptance tercih etmelidir.

Update ve Plugin doğrulaması için kanonik kontrol listesi [Update ve Plugin’leri test etme](/tr/help/testing-updates-plugins) sayfasıdır. Bir Plugin install/update, doctor cleanup veya yayımlanmış paket migration değişikliğini hangi yerel, Docker, Package Acceptance veya release-check hattının kanıtladığına karar verirken bunu kullanın.
Her stable `2026.4.23+` paketinden kapsamlı yayımlanmış update migration, Full Release CI parçası değil, ayrı bir manuel `Update Migration` iş akışıdır.

Eski package-acceptance toleransı özellikle zamanla sınırlıdır. `2026.4.25` dahil paketler, npm’e zaten yayımlanmış metadata boşlukları için compatibility path kullanabilir: tarball’da eksik private QA inventory girişleri, eksik `gateway install --wrapper`, tarball’dan türetilmiş git fixture içinde eksik patch dosyaları, eksik kalıcı `update.channel`, eski Plugin install-record konumları, eksik marketplace install-record kalıcılığı ve `plugins update` sırasında config metadata migration. Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel build metadata stamp dosyaları için uyarı verebilir. Daha sonraki paketler modern paket sözleşmelerini karşılamalıdır; aynı boşluklar release doğrulamasını başarısız kılar.

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

- `smoke`: hızlı paket install/channel/agent, gateway network ve config reload hatları
- `package`: canlı ClawHub olmadan install/update/Plugin paket sözleşmeleri; release-check varsayılanı budur
- `product`: `package` artı MCP kanalları, cron/subagent cleanup, OpenAI web search ve OpenWebUI
- `full`: OpenWebUI ile Docker release-path parçaları
- `custom`: odaklı yeniden çalıştırmalar için kesin `docker_lanes` listesi

Paket adayı Telegram kanıtı için Package Acceptance üzerinde `telegram_mode=mock-openai` veya
`telegram_mode=live-frontier` seçeneğini etkinleştirin. İş akışı, çözümlenen
`package-under-test` tarball dosyasını Telegram hattına geçirir; bağımsız
Telegram iş akışı, yayımlama sonrası kontroller için yayımlanmış bir npm
belirtimini kabul etmeyi sürdürür.

## Sürüm yayımlama otomasyonu

`OpenClaw Release Publish`, normal değişiklik yapan yayımlama giriş noktasıdır. Sürümün
gerektirdiği sırayla güvenilir yayımcı iş akışlarını düzenler:

1. Sürüm etiketini checkout yapın ve commit SHA değerini çözümleyin.
2. Etiketin `main` veya `release/*` üzerinden erişilebilir olduğunu doğrulayın.
3. `pnpm plugins:sync:check` çalıştırın.
4. `publish_scope=all-publishable` ve `ref=<release-sha>` ile
   `Plugin NPM Release` tetikleyin.
5. Aynı kapsam ve SHA ile `Plugin ClawHub Release` tetikleyin.
6. Sürüm etiketi, npm dist etiketi ve kaydedilmiş `preflight_run_id` ile
   `OpenClaw NPM Release` tetikleyin.

Beta yayımlama örneği:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Varsayılan beta dist etiketine kararlı sürüm yayımlama:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Doğrudan `latest` sürümüne kararlı terfi açıkça belirtilir:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Daha düşük seviyeli `Plugin NPM Release` ve `Plugin ClawHub Release` iş akışlarını
yalnızca odaklı onarım veya yeniden yayımlama çalışmaları için kullanın. Seçili
bir Plugin onarımı için `OpenClaw Release Publish` iş akışına
`plugin_publish_scope=selected` ve `plugins=@openclaw/name` geçirin ya da
OpenClaw paketi yayımlanmamalıysa alt iş akışını doğrudan tetikleyin.

## NPM iş akışı girdileri

`OpenClaw NPM Release`, operatör tarafından denetlenen şu girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya `v2026.4.2-beta.1` gibi gerekli sürüm etiketi; `preflight_only=true` olduğunda, yalnızca doğrulama amaçlı preflight için geçerli tam 40 karakterlik iş akışı dalı commit SHA değeri de olabilir
- `preflight_only`: yalnızca doğrulama/derleme/paket için `true`, gerçek yayımlama yolu için `false`
- `preflight_run_id`: başarılı preflight çalıştırmasından hazırlanan tarball dosyasını iş akışının yeniden kullanması için gerçek yayımlama yolunda gereklidir
- `npm_dist_tag`: yayımlama yolu için npm hedef etiketi; varsayılanı `beta`

`OpenClaw Release Publish`, operatör tarafından denetlenen şu girdileri kabul eder:

- `tag`: gerekli sürüm etiketi; önceden var olmalıdır
- `preflight_run_id`: başarılı `OpenClaw NPM Release` preflight çalıştırma kimliği; `publish_openclaw_npm=true` olduğunda gereklidir
- `npm_dist_tag`: OpenClaw paketi için npm hedef etiketi
- `plugin_publish_scope`: varsayılanı `all-publishable`; `selected` değerini yalnızca odaklı onarım çalışması için kullanın
- `plugins`: `plugin_publish_scope=selected` olduğunda virgülle ayrılmış `@openclaw/*` paket adları
- `publish_openclaw_npm`: varsayılanı `true`; yalnızca iş akışını sadece Plugin onarımı düzenleyicisi olarak kullanırken `false` olarak ayarlayın

`OpenClaw Release Checks`, operatör tarafından denetlenen şu girdileri kabul eder:

- `ref`: doğrulanacak dal, etiket veya tam commit SHA. Gizli bilgi içeren kontroller, çözümlenen commit’in bir OpenClaw dalından veya sürüm etiketinden erişilebilir olmasını gerektirir.

Kurallar:

- Kararlı ve düzeltme etiketleri `beta` veya `latest` hedeflerinden birine yayımlanabilir
- Beta ön sürüm etiketleri yalnızca `beta` hedeflerine yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` ve `Full Release Validation` her zaman yalnızca doğrulama amaçlıdır
- Gerçek yayımlama yolu, preflight sırasında kullanılan aynı `npm_dist_tag` değerini kullanmalıdır; iş akışı, yayımlamadan önce metadata doğrulamasının devam ettiğini doğrular

## Kararlı npm sürüm sırası

Kararlı bir npm sürümü çıkarırken:

1. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın
   - Etiket oluşmadan önce, preflight iş akışının yalnızca doğrulama amaçlı kuru çalıştırması için mevcut tam iş akışı dalı commit SHA değerini kullanabilirsiniz
2. Normal önce beta akışı için `npm_dist_tag=beta` seçin veya yalnızca doğrudan kararlı yayımlamayı özellikle istiyorsanız `latest` seçin
3. Tek bir manuel iş akışından normal CI ile birlikte canlı istem önbelleği, Docker, QA Lab, Matrix ve Telegram kapsamı istediğinizde sürüm dalı, sürüm etiketi veya tam commit SHA üzerinde `Full Release Validation` çalıştırın
4. Bilinçli olarak yalnızca deterministik normal test grafiğine ihtiyacınız varsa, bunun yerine sürüm ref’i üzerinde manuel `CI` iş akışını çalıştırın
5. Başarılı `preflight_run_id` değerini kaydedin
6. Aynı `tag`, aynı `npm_dist_tag` ve kaydedilmiş `preflight_run_id` ile `OpenClaw Release Publish` çalıştırın; bu, OpenClaw npm paketini terfi ettirmeden önce dışsallaştırılmış Plugin’leri npm ve ClawHub üzerinde yayımlar
7. Sürüm `beta` üzerinde yayımlandıysa, bu kararlı sürümü `beta` konumundan `latest` konumuna terfi ettirmek için özel `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` iş akışını kullanın
8. Sürüm bilerek doğrudan `latest` konumuna yayımlandıysa ve `beta` hemen aynı kararlı derlemeyi izlemeliyse, iki dist etiketini de kararlı sürüme yönlendirmek için aynı özel iş akışını kullanın veya zamanlanmış kendi kendini iyileştiren eşitlemesinin `beta` değerini daha sonra taşımasına izin verin

Dist etiketi değişikliği, hâlâ `NPM_TOKEN` gerektirdiği için güvenlik amacıyla özel repoda bulunur; public repo ise yalnızca OIDC yayımlamayı korur.

Bu, hem doğrudan yayımlama yolunu hem de önce beta terfi yolunu belgelenmiş ve operatör tarafından görülebilir tutar.

Bir bakım sorumlusu yerel npm kimlik doğrulamasına geri dönmek zorundaysa, 1Password CLI (`op`) komutlarını yalnızca ayrılmış bir tmux oturumu içinde çalıştırın. `op` komutunu ana agent kabuğundan doğrudan çağırmayın; tmux içinde tutmak istemleri, uyarıları ve OTP işlemeyi gözlemlenebilir kılar ve yinelenen host uyarılarını önler.

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

Bakım sorumluları, gerçek çalıştırma kılavuzu için
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
içindeki özel sürüm belgelerini kullanır.

## İlgili

- [Sürüm kanalları](/tr/install/development-channels)
