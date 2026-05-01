---
read_when:
    - Herkese açık sürüm kanalı tanımları aranıyor
    - Sürüm doğrulamasını veya paket kabulünü çalıştırma
    - Sürüm adlandırması ve yayın temposu aranıyor
summary: Sürüm hatları, operatör kontrol listesi, doğrulama kutuları, sürüm adlandırması ve yayın temposu
title: Sürüm politikası
x-i18n:
    generated_at: "2026-05-01T09:03:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfe579099a9580e2d0400cd0b24f26d3fa3ee917899423604ebc13aa2519b4ee
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw'ın üç herkese açık yayın kanalı vardır:

- kararlı: varsayılan olarak npm `beta` üzerinde, açıkça istendiğinde ise npm `latest` üzerinde yayımlanan etiketli yayınlar
- beta: npm `beta` üzerinde yayımlanan ön yayın etiketleri
- geliştirme: `main` dalının hareketli son noktası

## Sürüm adlandırma

- Kararlı yayın sürümü: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Kararlı düzeltme yayını sürümü: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön yayın sürümü: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ay veya günü sıfırla doldurmayın
- `latest`, mevcut yükseltilmiş kararlı npm yayını anlamına gelir
- `beta`, mevcut beta kurulum hedefi anlamına gelir
- Kararlı ve kararlı düzeltme yayınları varsayılan olarak npm `beta` üzerinde yayımlanır; yayın operatörleri açıkça `latest` hedefleyebilir veya incelenmiş bir beta derlemesini daha sonra yükseltebilir
- Her kararlı OpenClaw yayını npm paketini ve macOS uygulamasını birlikte sunar;
  beta yayınları normalde önce npm/paket yolunu doğrular ve yayımlar; mac
  uygulama derleme/imzalama/noter onayı, açıkça istenmediği sürece kararlı yayınlara ayrılır

## Yayın temposu

- Yayınlar önce beta olarak ilerler
- Kararlı yayın, yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar yayınları normalde mevcut `main` üzerinden oluşturulan bir `release/YYYY.M.D` dalından çıkarır;
  böylece yayın doğrulaması ve düzeltmeler `main` üzerindeki yeni geliştirmeyi
  engellemez
- Bir beta etiketi itilmiş veya yayımlanmışsa ve düzeltme gerekiyorsa, bakımcılar
  eski beta etiketini silmek veya yeniden oluşturmak yerine sonraki `-beta.N` etiketini çıkarır
- Ayrıntılı yayın prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca bakımcılara özeldir

## Yayın operatörü kontrol listesi

Bu kontrol listesi yayın akışının herkese açık biçimidir. Özel kimlik bilgileri,
imzalama, noter onayı, dist-tag kurtarma ve acil geri alma ayrıntıları
yalnızca bakımcılara özel yayın çalışma kitabında kalır.

1. Mevcut `main` üzerinden başlayın: en son değişiklikleri çekin, hedef commit'in itilmiş olduğunu
   doğrulayın ve mevcut `main` CI durumunun dal almak için yeterince yeşil olduğunu doğrulayın.
2. Üstteki `CHANGELOG.md` bölümünü gerçek commit geçmişinden `/changelog` ile yeniden yazın,
   girdileri kullanıcıya dönük tutun, bunu commit'leyin, itin ve dallanmadan önce bir kez daha rebase/pull
   yapın.
3. Yayın uyumluluk kayıtlarını
   `src/plugins/compat/registry.ts` ve
   `src/commands/doctor/shared/deprecation-compat.ts` içinde gözden geçirin. Süresi dolmuş
   uyumluluğu yalnızca yükseltme yolu kapsanmaya devam ediyorsa kaldırın veya neden
   bilerek taşındığını kaydedin.
4. Mevcut `main` üzerinden `release/YYYY.M.D` oluşturun; normal yayın çalışmasını
   doğrudan `main` üzerinde yapmayın.
5. Amaçlanan etiket için gerekli her sürüm konumunu yükseltin, ardından
   yerel deterministik ön kontrolü çalıştırın:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` ve `pnpm release:check`.
6. `OpenClaw NPM Release` işini `preflight_only=true` ile çalıştırın. Etiket oluşmadan önce,
   yalnızca doğrulama amaçlı ön kontrol için tam 40 karakterlik yayın dalı SHA'sına izin verilir.
   Başarılı `preflight_run_id` değerini kaydedin.
7. Yayın dalı, etiket veya tam commit SHA'sı için `Full Release Validation` ile tüm
   yayın öncesi testleri başlatın. Bu, dört büyük yayın test kutusu için tek manuel giriş noktasıdır:
   Vitest, Docker, QA Lab ve Package.
8. Doğrulama başarısız olursa, yayın dalında düzeltin ve düzeltmeyi kanıtlayan en küçük başarısız
   dosyayı, kanalı, iş akışı işini, paket profilini, sağlayıcıyı veya model izin listesini yeniden çalıştırın.
   Tam şemsiyeyi yalnızca değişen yüzey önceki kanıtı geçersiz kıldığında yeniden çalıştırın.
9. Beta için `vYYYY.M.D-beta.N` etiketini oluşturun, npm dist-tag `beta` ile yayımlayın, ardından
   yayımlanan `openclaw@YYYY.M.D-beta.N` veya `openclaw@beta` paketi üzerinde
   yayın sonrası paket kabulünü çalıştırın. İtilmiş veya yayımlanmış bir betada düzeltme gerekiyorsa,
   sonraki `-beta.N` sürümünü çıkarın; eski betayı silmeyin veya yeniden yazmayın.
10. Kararlı yayın için yalnızca incelenmiş beta veya yayın adayı gerekli doğrulama kanıtına sahipse
    devam edin. Kararlı npm yayını, başarılı ön kontrol yapıtını
    `preflight_run_id` üzerinden yeniden kullanır; kararlı macOS yayın hazırlığı ayrıca paketlenmiş
    `.zip`, `.dmg`, `.dSYM.zip` ve güncellenmiş
    `appcast.xml` dosyasının `main` üzerinde olmasını gerektirir.
11. Yayından sonra npm yayın sonrası doğrulayıcısını, yayın sonrası kanal kanıtına ihtiyacınız olduğunda
    isteğe bağlı bağımsız yayımlanmış npm Telegram E2E'yi,
    gerektiğinde dist-tag yükseltmesini, eksiksiz eşleşen `CHANGELOG.md` bölümünden GitHub yayın/ön yayın notlarını
    ve yayın duyurusu adımlarını çalıştırın.

## Yayın ön kontrolü

- Yayın ön uçuşundan önce `pnpm check:test-types` çalıştırın; böylece test TypeScript kapsamı daha hızlı yerel `pnpm check` kapısının dışında da korunur
- Yayın ön uçuşundan önce `pnpm check:architecture` çalıştırın; böylece daha geniş import döngüsü ve mimari sınır denetimleri daha hızlı yerel kapının dışında yeşil olur
- `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın; böylece beklenen `dist/*` yayın yapıları ve Control UI paketi paket doğrulama adımı için mevcut olur
- Yayın onayından önce manuel `Full Release Validation` iş akışını çalıştırarak tüm yayın öncesi test kutularını tek bir giriş noktasından başlatın. Bir branch, etiket veya tam commit SHA kabul eder, manuel `CI` başlatır ve kurulum smoke, paket kabulü, Docker yayın yolu paketleri, canlı/E2E, OpenWebUI, QA Lab paritesi, Matrix ve Telegram hatları için `OpenClaw Release Checks` başlatır. `npm_telegram_package_spec` değerini yalnızca bir paket yayımlandıktan ve yayımlama sonrası Telegram E2E de çalıştırılacaksa sağlayın. Özel kanıt raporunun, doğrulamanın Telegram E2E çalıştırmayı zorunlu kılmadan yayımlanmış bir npm paketiyle eşleştiğini kanıtlaması gerektiğinde `evidence_package_spec` sağlayın.
  Örnek:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Yayın çalışması devam ederken bir paket adayı için yan kanal kanıtı istediğinizde manuel `Package Acceptance` iş akışını çalıştırın. `openclaw@beta`, `openclaw@latest` veya tam bir yayın sürümü için `source=npm`; geçerli `workflow_ref` test düzeneğiyle güvenilir bir `package_ref` branch/etiket/SHA paketlemek için `source=ref`; zorunlu SHA-256 içeren bir HTTPS tarball için `source=url`; ya da başka bir GitHub Actions çalıştırması tarafından yüklenen bir tarball için `source=artifact` kullanın. İş akışı adayı `package-under-test` olarak çözümler, Docker E2E yayın zamanlayıcısını bu tarball üzerinde yeniden kullanır ve aynı tarball üzerinde `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` ile Telegram QA çalıştırabilir. Seçilen Docker hatları `published-upgrade-survivor` içerdiğinde paket yapısı adaydır ve `published_upgrade_survivor_baseline` yayımlanmış tabanı seçer.
  Örnek: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Yaygın profiller:
  - `smoke`: kurulum/kanal/ajan, Gateway ağı ve yapılandırma yeniden yükleme hatları
  - `package`: OpenWebUI veya canlı ClawHub olmadan yapıya özgü paket/güncelleme/Plugin hatları
  - `product`: paket profiline ek olarak MCP kanalları, cron/alt ajan temizliği,
    OpenAI web araması ve OpenWebUI
  - `full`: OpenWebUI ile Docker yayın yolu parçaları
  - `custom`: odaklı yeniden çalıştırma için tam `docker_lanes` seçimi
- Yayın adayı için yalnızca tam normal CI kapsamına ihtiyacınız olduğunda manuel `CI` iş akışını doğrudan çalıştırın. Manuel CI başlatmaları değişiklik kapsamını atlar ve Linux Node parçalarını, paketlenmiş Plugin parçalarını, kanal sözleşmelerini, Node 22 uyumluluğunu, `check`, `check-additional`, build smoke, dokümantasyon denetimlerini, Python skills, Windows, macOS, Android ve Control UI i18n hatlarını zorlar.
  Örnek: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Yayın telemetrisini doğrularken `pnpm qa:otel:smoke` çalıştırın. QA-lab’i yerel bir OTLP/HTTP alıcısı üzerinden çalıştırır ve dışa aktarılan trace span adlarını, sınırlı öznitelikleri ve içerik/tanımlayıcı redaksiyonunu Opik, Langfuse veya başka bir dış toplayıcı gerektirmeden doğrular.
- Her etiketli yayından önce `pnpm release:check` çalıştırın
- Yayın denetimleri artık ayrı bir manuel iş akışında çalışır:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`, yayın onayından önce QA Lab mock parite kapısını, hızlı canlı Matrix profilini ve Telegram QA hattını da çalıştırır. Canlı hatlar `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI kimlik bilgisi kiralamalarını kullanır. Tam Matrix taşıma, medya ve E2EE envanterini paralel istediğinizde manuel `QA-Lab - All Lanes` iş akışını `matrix_profile=all` ve `matrix_shards=true` ile çalıştırın.
- Çapraz işletim sistemi kurulum ve yükseltme çalışma zamanı doğrulaması, yeniden kullanılabilir iş akışını doğrudan çağıran herkese açık `OpenClaw Release Checks` ve `Full Release Validation` parçalarının bir parçasıdır:
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Bu ayrım kasıtlıdır: gerçek npm yayın yolunu kısa, deterministik ve yapı odaklı tutarken daha yavaş canlı denetimler kendi hattında kalır; böylece yayımlamayı geciktirmez veya engellemezler
- Gizli içeren yayın denetimleri `Full Release Validation` üzerinden ya da `main`/yayın iş akışı ref’inden başlatılmalıdır; böylece iş akışı mantığı ve gizliler kontrollü kalır
- `OpenClaw Release Checks`, çözümlenen commit bir OpenClaw branch’inden veya yayın etiketinden erişilebilir olduğu sürece branch, etiket veya tam commit SHA kabul eder
- `OpenClaw NPM Release` yalnızca doğrulama ön uçuşu, itilmiş bir etiket gerektirmeden geçerli tam 40 karakterli iş akışı branch commit SHA’sını da kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek yayımlamaya yükseltilemez
- SHA modunda iş akışı yalnızca paket meta veri denetimi için `v<package.json version>` üretir; gerçek yayımlama yine de gerçek bir yayın etiketi gerektirir
- Her iki iş akışı da gerçek yayımlama ve yükseltme yolunu GitHub-hosted runner’larda tutar; değişiklik yapmayan doğrulama yolu ise daha büyük Blacksmith Linux runner’ları kullanabilir
- Bu iş akışı hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` iş akışı gizlilerini kullanarak
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  çalıştırır
- npm yayın ön uçuşu artık ayrı yayın denetimleri hattını beklemez
- Onaydan önce `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (veya eşleşen beta/düzeltme etiketi) çalıştırın
- npm yayımlamasından sonra, yayımlanmış registry kurulum yolunu taze bir geçici prefix içinde doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (veya eşleşen beta/düzeltme sürümü) çalıştırın
- Beta yayımlamasından sonra, yayımlanmış npm paketine karşı paylaşılan kiralık Telegram kimlik bilgisi havuzunu kullanarak kurulu paket onboarding’i, Telegram kurulumunu ve gerçek Telegram E2E’yi doğrulamak için `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` çalıştırın. Yerel bakımcı tek seferlik çalıştırmaları Convex değişkenlerini atlayabilir ve üç `OPENCLAW_QA_TELEGRAM_*` env kimlik bilgisini doğrudan geçebilir.
- Bakımcılar aynı yayımlama sonrası denetimi GitHub Actions üzerinden manuel `NPM Telegram Beta E2E` iş akışıyla çalıştırabilir. Bu bilerek yalnızca manueldir ve her merge’de çalışmaz.
- Bakımcı yayın otomasyonu artık ön uçuş-sonra-yükselt modelini kullanır:
  - gerçek npm yayımlaması başarılı bir npm `preflight_run_id` geçmelidir
  - gerçek npm yayımlaması, başarılı ön uçuş çalıştırmasıyla aynı `main` veya `release/YYYY.M.D` branch’inden başlatılmalıdır
  - kararlı npm yayınları varsayılan olarak `beta` kullanır
  - kararlı npm yayımlaması iş akışı girdisiyle açıkça `latest` hedefleyebilir
  - token tabanlı npm dist-tag mutasyonu artık güvenlik için
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    içinde yaşar; çünkü herkese açık repo OIDC-only yayımlamayı korurken `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirir
  - herkese açık `macOS Release` yalnızca doğrulamadır; bir etiket yalnızca yayın branch’inde bulunuyor ancak iş akışı `main` üzerinden başlatılıyorsa `public_release_branch=release/YYYY.M.D` ayarlayın
  - gerçek özel mac yayımlaması başarılı özel mac `preflight_run_id` ve `validate_run_id` geçmelidir
  - gerçek yayımlama yolları, yapıları yeniden inşa etmek yerine hazırlanmış yapıları yükseltir
- `YYYY.M.D-N` gibi kararlı düzeltme yayınları için yayımlama sonrası doğrulayıcı aynı geçici prefix yükseltme yolunu `YYYY.M.D` sürümünden `YYYY.M.D-N` sürümüne de denetler; böylece yayın düzeltmeleri eski global kurulumları sessizce temel kararlı yükte bırakamaz
- Tarball hem `dist/control-ui/index.html` hem de boş olmayan bir `dist/control-ui/assets/` yükü içermedikçe npm yayın ön uçuşu kapalı başarısız olur; böylece yeniden boş bir tarayıcı panosu göndermeyiz
- Yayımlama sonrası doğrulama, yayımlanmış registry kurulumunun kök `dist/*` düzeni altında boş olmayan paketlenmiş Plugin çalışma zamanı bağımlılıkları içerdiğini de denetler. Eksik veya boş paketlenmiş Plugin bağımlılık yükleriyle gönderilen bir yayın, postpublish doğrulayıcısında başarısız olur ve `latest` konumuna yükseltilemez.
- `pnpm test:install:smoke`, aday güncelleme tarball’ında npm pack `unpackedSize` bütçesini de zorunlu kılar; böylece installer e2e, yayın yayımlama yolundan önce yanlışlıkla oluşan paket şişmesini yakalar
- Yayın çalışması CI planlamasına, Plugin zamanlama manifestlerine veya Plugin test matrislerine dokunduysa, onaydan önce `.github/workflows/plugin-prerelease.yml` içindeki planlayıcı sahipli `plugin-prerelease-extension-shard` matris çıktılarını yeniden üretin ve gözden geçirin; böylece yayın notları eski bir CI düzenini tarif etmez
- Kararlı macOS yayın hazırlığı güncelleyici yüzeylerini de içerir:
  - GitHub yayını paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` ile sonuçlanmalıdır
  - `main` üzerindeki `appcast.xml` yayımlamadan sonra yeni kararlı zip’i göstermelidir
  - paketlenmiş uygulama debug olmayan bir bundle id, boş olmayan bir Sparkle feed URL’si ve o yayın sürümü için kanonik Sparkle build tabanına eşit veya daha yüksek bir `CFBundleVersion` korumalıdır

## Yayın test kutuları

`Full Release Validation`, operatörlerin tüm yayın öncesi testleri tek bir giriş noktasından başlatma yoludur. Güvenilir `main` iş akışı ref’inden çalıştırın ve yayın branch’ini, etiketini veya tam commit SHA’sını `ref` olarak geçin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

İş akışı hedef ref’i çözümler, `target_ref=<release-ref>` ile manuel `CI` başlatır, `OpenClaw Release Checks` başlatır ve `npm_telegram_package_spec` ayarlandığında isteğe bağlı olarak bağımsız yayımlama sonrası Telegram E2E başlatır. Ardından `OpenClaw Release Checks` kurulum smoke, çapraz işletim sistemi yayın denetimleri, canlı/E2E Docker yayın yolu kapsamı, Telegram paket QA ile Package Acceptance, QA Lab paritesi, canlı Matrix ve canlı Telegram hatlarına yayılır. Tam bir çalıştırma yalnızca `Full Release Validation` özetinde `normal_ci` ve `release_checks` başarılı görünüyorsa ve isteğe bağlı `npm_telegram` alt çalıştırması başarılı ya da bilerek atlanmışsa kabul edilebilir. Son doğrulayıcı özeti, her alt çalıştırma için en yavaş iş tablolarını içerir; böylece yayın yöneticisi günlükleri indirmeden geçerli kritik yolu görebilir.
Tam aşama matrisi, kesin iş akışı job adları, kararlı ve tam profil farkları, yapılar ve odaklı yeniden çalıştırma tutamaçları için [Tam yayın doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.
Alt iş akışları, hedef `ref` daha eski bir yayın branch’ine veya etikete işaret etse bile `Full Release Validation` çalıştıran güvenilir ref’ten, normalde `--ref main` üzerinden başlatılır. Ayrı bir Full Release Validation workflow-ref girdisi yoktur; güvenilir test düzeneğini iş akışı çalıştırma ref’ini seçerek belirleyin.

Canlı/provider genişliğini seçmek için `release_profile` kullanın:

- `minimum`: en hızlı yayın açısından kritik OpenAI/core canlı ve Docker yolu
- `stable`: minimuma ek olarak yayın onayı için kararlı provider/backend kapsamı
- `full`: kararlı profile ek olarak geniş advisory provider/medya kapsamı

`OpenClaw Release Checks`, hedef ref'i bir kez `release-package-under-test` olarak çözmek ve bu artifact'i hem release-path Docker kontrollerinde hem de Package Acceptance'ta yeniden kullanmak için güvenilir workflow ref'ini kullanır. Bu, paketle ilgili tüm kutuları aynı baytlar üzerinde tutar ve tekrarlanan paket derlemelerini önler. Cross-OS OpenAI kurulum duman testi, repo/org değişkeni ayarlandığında `OPENCLAW_CROSS_OS_OPENAI_MODEL` değerini, aksi halde `openai/gpt-5.4-mini` değerini kullanır; çünkü bu hat en yavaş varsayılan modeli kıyaslamak yerine paket kurulumunu, onboarding'i, gateway başlangıcını ve bir canlı ajan turunu kanıtlar. Daha geniş canlı sağlayıcı matrisi, modele özgü kapsamın yeri olmaya devam eder.

Release aşamasına bağlı olarak bu varyantları kullanın:

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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Odaklı bir düzeltmeden sonraki ilk yeniden çalıştırma olarak tam şemsiyeyi kullanmayın. Bir kutu başarısız olursa, sonraki kanıt için başarısız alt workflow'u, işi, Docker hattını, paket profilini, model sağlayıcısını veya QA hattını kullanın. Tam şemsiyeyi yeniden yalnızca düzeltme paylaşılan release orkestrasyonunu değiştirdiyse veya önceki tüm-kutu kanıtını bayatlattıysa çalıştırın. Şemsiyenin son doğrulayıcısı kaydedilen alt workflow çalıştırma kimliklerini yeniden kontrol eder; bu yüzden bir alt workflow başarıyla yeniden çalıştırıldıktan sonra yalnızca başarısız `Verify full validation` üst işini yeniden çalıştırın.

Sınırlı kurtarma için şemsiyeye `rerun_group` geçirin. `all` gerçek release-candidate çalıştırmasıdır, `ci` yalnızca normal CI altını çalıştırır, `plugin-prerelease` yalnızca release'e özel Plugin altını çalıştırır, `release-checks` her release kutusunu çalıştırır ve daha dar release grupları, bağımsız paket Telegram hattı sağlandığında `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ve `npm-telegram` olur.

### Vitest

Vitest kutusu manuel `CI` alt workflow'udur. Manuel CI, changed scoping'i bilerek atlar ve release candidate için normal test grafiğini zorlar: Linux Node shard'ları, paketlenmiş Plugin shard'ları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, build duman testi, doküman kontrolleri, Python Skills, Windows, macOS, Android ve Control UI i18n.

Bu kutuyu "kaynak ağacı tam normal test paketinden geçti mi?" sorusunu yanıtlamak için kullanın. Release-path ürün doğrulamasıyla aynı şey değildir. Saklanacak kanıtlar:

- Gönderilen `CI` çalıştırma URL'sini gösteren `Full Release Validation` özeti
- Tam hedef SHA üzerinde yeşil `CI` çalıştırması
- Regresyonları araştırırken CI işlerindeki başarısız veya yavaş shard adları
- Bir çalıştırmanın performans analizi gerektiğinde `.artifacts/vitest-shard-timings.json` gibi Vitest zamanlama artifact'leri

Manuel CI'ı doğrudan yalnızca release deterministik normal CI gerektiriyor ama Docker, QA Lab, canlı, cross-OS veya paket kutularını gerektirmiyorsa çalıştırın:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker kutusu, `openclaw-live-and-e2e-checks-reusable.yml` üzerinden `OpenClaw Release Checks` içinde ve release modu `install-smoke` workflow'unda yaşar. Release candidate'ı yalnızca kaynak seviyesindeki testler yerine paketlenmiş Docker ortamları üzerinden doğrular.

Release Docker kapsamı şunları içerir:

- yavaş Bun global kurulum duman testi etkinleştirilmiş tam kurulum duman testi
- QR, root/gateway ve installer/Bun duman işlerinin ayrı install-smoke shard'ları olarak çalıştığı, hedef SHA'ya göre kök Dockerfile duman imajı hazırlama/yeniden kullanma
- depo E2E hatları
- release-path Docker parçaları: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, `plugins-runtime-install-h`,
  `bundled-channels-core`, `bundled-channels-update-a`,
  `bundled-channels-update-discord`, `bundled-channels-update-b` ve
  `bundled-channels-contracts`
- istendiğinde `plugins-runtime-services` parçası içinde OpenWebUI kapsamı
- büyük tek bir paketlenmiş kanal işi yerine kanal-smoke, update-target ve setup/runtime sözleşme parçaları arasında bölünmüş paketlenmiş-kanal bağımlılık hatları
- bölünmüş paketlenmiş Plugin kurulum/kaldırma hatları
  `bundled-plugin-install-uninstall-0` ile
  `bundled-plugin-install-uninstall-23` arası
- release kontrolleri canlı paketleri içerdiğinde canlı/E2E sağlayıcı paketleri ve Docker canlı model kapsamı

Yeniden çalıştırmadan önce Docker artifact'lerini kullanın. Release-path zamanlayıcısı, hat logları, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı plan JSON'u ve yeniden çalıştırma komutlarıyla `.artifacts/docker-tests/` yükler. Odaklı kurtarma için tüm release parçalarını yeniden çalıştırmak yerine yeniden kullanılabilir canlı/E2E workflow'unda `docker_lanes=<lane[,lane]>` kullanın. Üretilen yeniden çalıştırma komutları, mevcut olduğunda önceki `package_artifact_run_id` ve hazırlanmış Docker imajı girdilerini içerir; böylece başarısız bir hat aynı tarball'u ve GHCR imajlarını yeniden kullanabilir.

### QA Lab

QA Lab kutusu da `OpenClaw Release Checks` kapsamındadır. Vitest ve Docker paket mekaniklerinden ayrı olarak ajan davranışı ve kanal seviyesi release kapısıdır.

Release QA Lab kapsamı şunları içerir:

- ajan parity paketi kullanılarak OpenAI candidate hattını Opus 4.6 baseline'ı ile karşılaştıran mock parity kapısı
- `qa-live-shared` ortamını kullanan hızlı canlı Matrix QA profili
- Convex CI credential lease'lerini kullanan canlı Telegram QA hattı
- release telemetry açık yerel kanıt gerektirdiğinde `pnpm qa:otel:smoke`

Bu kutuyu "release, QA senaryolarında ve canlı kanal akışlarında doğru davranıyor mu?" sorusunu yanıtlamak için kullanın. Release onaylanırken parity, Matrix ve Telegram hatları için artifact URL'lerini saklayın. Tam Matrix kapsamı, varsayılan release açısından kritik hat yerine manuel shard'lı QA-Lab çalıştırması olarak kullanılabilir kalır.

### Paket

Paket kutusu kurulabilir-ürün kapısıdır. `Package Acceptance` ve `scripts/resolve-openclaw-package-candidate.mjs` çözücüsüyle desteklenir. Çözücü bir candidate'ı Docker E2E tarafından tüketilen `package-under-test` tarball'una normalleştirir, paket envanterini doğrular, paket sürümünü ve SHA-256 değerini kaydeder ve workflow harness ref'ini paket kaynak ref'inden ayrı tutar.

Desteklenen candidate kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya tam bir OpenClaw release sürümü
- `source=ref`: seçilen `workflow_ref` harness'iyle güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA'sını paketle
- `source=url`: gerekli `package_sha256` ile bir HTTPS `.tgz` indir
- `source=artifact`: başka bir GitHub Actions çalıştırması tarafından yüklenen bir `.tgz` dosyasını yeniden kullan

`OpenClaw Release Checks`, Package Acceptance'ı `source=ref`, `package_ref=<release-ref>`, `suite_profile=custom`, `docker_lanes=bundled-channel-deps-compat plugins-offline` ve `telegram_mode=mock-openai` ile çalıştırır. Release-path Docker parçaları çakışan kurulum, güncelleme ve Plugin güncelleme hatlarını kapsar; Package Acceptance artifact-native paketlenmiş-kanal uyumluluğunu, çevrimdışı Plugin fixture'larını ve aynı çözümlenmiş tarball'a karşı Telegram paket QA'sını korur. Daha önce Parallels gerektiren paket/güncelleme kapsamının çoğu için GitHub-native alternatiftir. Cross-OS release kontrolleri OS'ye özgü onboarding, installer ve platform davranışı için hâlâ önemlidir; ancak paket/güncelleme ürün doğrulaması Package Acceptance'ı tercih etmelidir.

Eski package-acceptance esnekliği bilerek zaman sınırlıdır. `2026.4.25` dahil paketler, npm'e zaten yayımlanmış metadata eksikleri için uyumluluk yolunu kullanabilir: tarball'da eksik private QA inventory girdileri, eksik `gateway install --wrapper`, tarball'dan türetilmiş git fixture'ında eksik patch dosyaları, eksik kalıcı `update.channel`, eski Plugin kurulum kaydı konumları, eksik marketplace kurulum kaydı kalıcılığı ve `plugins update` sırasında config metadata migration. Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel build metadata stamp dosyaları için uyarı verebilir. Daha sonraki paketler modern paket sözleşmelerini karşılamalıdır; aynı eksikler release doğrulamasını başarısız kılar.

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

- `smoke`: hızlı paket kurulum/kanal/ajan, Gateway ağı ve config yeniden yükleme hatları
- `package`: canlı ClawHub olmadan kurulum/güncelleme/Plugin paket sözleşmeleri; release-check varsayılanı budur
- `product`: `package` artı MCP kanalları, cron/subagent cleanup, OpenAI web araması ve OpenWebUI
- `full`: OpenWebUI ile Docker release-path parçaları
- `custom`: odaklı yeniden çalıştırmalar için tam `docker_lanes` listesi

Paket-candidate Telegram kanıtı için Package Acceptance üzerinde `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` etkinleştirin. Workflow çözümlenmiş `package-under-test` tarball'unu Telegram hattına geçirir; bağımsız Telegram workflow'u, publish sonrası kontroller için hâlâ yayımlanmış bir npm spec kabul eder.

## NPM workflow girdileri

`OpenClaw NPM Release` şu operatör kontrollü girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya `v2026.4.2-beta.1` gibi gerekli release etiketi; `preflight_only=true` olduğunda, yalnızca doğrulama preflight'ı için geçerli tam 40 karakterlik workflow-branch commit SHA'sı da olabilir
- `preflight_only`: yalnızca doğrulama/build/paket için `true`, gerçek publish yolu için `false`
- `preflight_run_id`: workflow'un başarılı preflight çalıştırmasından hazırlanmış tarball'u yeniden kullanması için gerçek publish yolunda gereklidir
- `npm_dist_tag`: publish yolu için npm hedef etiketi; varsayılan `beta`

`OpenClaw Release Checks` şu operatör kontrollü girdileri kabul eder:

- `ref`: doğrulanacak dal, etiket veya tam commit SHA. Secret içeren kontroller, çözümlenmiş commit'in bir OpenClaw dalından veya release etiketinden erişilebilir olmasını gerektirir.

Kurallar:

- Stable ve correction etiketleri `beta` veya `latest` değerine publish edilebilir
- Beta prerelease etiketleri yalnızca `beta` değerine publish edilebilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` ve `Full Release Validation` her zaman yalnızca doğrulama içindir
- Gerçek publish yolu, preflight sırasında kullanılan aynı `npm_dist_tag` değerini kullanmalıdır; workflow publish öncesinde metadata'nın devam ettiğini doğrular

## Stable npm release sırası

Stable bir npm release çıkarırken:

1. `OpenClaw NPM Release` iş akışını `preflight_only=true` ile çalıştırın
   - Etiket oluşmadan önce, preflight iş akışının yalnızca doğrulama amaçlı
     deneme çalıştırması için geçerli tam iş akışı dalı commit
     SHA'sını kullanabilirsiniz
2. Normal önce beta akışı için `npm_dist_tag=beta` seçin; doğrudan kararlı
   yayınlamayı bilinçli olarak istediğinizde yalnızca `latest` seçin
3. Normal CI ile canlı prompt önbelleği, Docker, QA Lab, Matrix ve Telegram
   kapsamını tek bir manuel iş akışından istediğinizde yayın dalında, yayın
   etiketinde veya tam commit SHA'sında `Full Release Validation` çalıştırın
4. Bilinçli olarak yalnızca deterministik normal test grafiğine ihtiyacınız
   varsa, bunun yerine yayın ref'i üzerinde manuel `CI` iş akışını çalıştırın
5. Başarılı `preflight_run_id` değerini kaydedin
6. `OpenClaw NPM Release` iş akışını aynı `tag`, aynı `npm_dist_tag` ve
   kaydedilmiş `preflight_run_id` ile, bu kez `preflight_only=false` olarak
   tekrar çalıştırın
7. Yayın `beta` üzerine indiyse, bu kararlı sürümü `beta`'dan `latest`'e
   yükseltmek için özel
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   iş akışını kullanın
8. Yayın bilinçli olarak doğrudan `latest` üzerine yapıldıysa ve `beta`
   hemen aynı kararlı derlemeyi izlemeliyse, iki dist-tag'i de kararlı sürüme
   yönlendirmek için aynı özel iş akışını kullanın veya zamanlanmış kendi
   kendini iyileştiren eşitlemenin `beta`'yı daha sonra taşımasına izin verin

dist-tag değişikliği güvenlik nedeniyle özel repoda bulunur, çünkü hâlâ
`NPM_TOKEN` gerektirir; public repo ise yalnızca OIDC ile yayınlamayı korur.

Bu, doğrudan yayın yolunu ve önce beta yükseltme yolunu hem belgelenmiş hem de
operatör tarafından görülebilir tutar.

Bir maintainer yerel npm kimlik doğrulamasına geri dönmek zorunda kalırsa,
1Password CLI (`op`) komutlarını yalnızca ayrılmış bir tmux oturumu içinde
çalıştırın. `op` komutunu doğrudan ana agent shell içinden çağırmayın; onu
tmux içinde tutmak prompt'ları, uyarıları ve OTP işlemeyi gözlemlenebilir kılar
ve tekrarlanan host uyarılarını önler.

## Public referanslar

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
içindeki özel yayın belgelerini kullanır.

## İlgili

- [Yayın kanalları](/tr/install/development-channels)
