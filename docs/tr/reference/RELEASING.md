---
read_when:
    - Herkese açık yayın kanalı tanımları aranıyor
    - Sürüm doğrulamasını veya paket kabulünü çalıştırma
    - Sürüm adlandırması ve yayın sıklığı aranıyor
summary: Yayın hatları, operatör kontrol listesi, doğrulama kutuları, sürüm adlandırması ve yayın temposu
title: Sürüm politikası
x-i18n:
    generated_at: "2026-05-04T07:08:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef50d3ef5d1e23b4e2c2b097fc4ca9f6d46bf8acb9aea0c9bca6d14e213b88b6
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw üç herkese açık sürüm hattına sahiptir:

- stable: varsayılan olarak npm `beta` kanalına, açıkça istendiğinde ise npm `latest` kanalına yayımlanan etiketli sürümler
- beta: npm `beta` kanalına yayımlanan ön sürüm etiketleri
- dev: `main` dalının hareketli en güncel ucu

## Sürüm adlandırması

- Kararlı sürüm versiyonu: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Kararlı düzeltme sürümü versiyonu: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön sürüm versiyonu: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ayı veya günü sıfırla doldurmayın
- `latest`, geçerli yükseltilmiş kararlı npm sürümü anlamına gelir
- `beta`, geçerli beta kurulum hedefi anlamına gelir
- Kararlı ve kararlı düzeltme sürümleri varsayılan olarak npm `beta` kanalına yayımlanır; sürüm operatörleri açıkça `latest` hedefleyebilir veya incelenmiş bir beta derlemesini daha sonra yükseltebilir
- Her kararlı OpenClaw sürümü npm paketini ve macOS uygulamasını birlikte gönderir;
  beta sürümleri normalde önce npm/paket yolunu doğrular ve yayımlar; mac
  uygulamasının derlenmesi/imzalanması/noter onayı ise açıkça istenmedikçe kararlı sürüme ayrılır

## Sürüm temposu

- Sürümler önce beta olarak ilerler
- Kararlı sürüm yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar normalde sürümleri geçerli `main` üzerinden oluşturulan bir
  `release/YYYY.M.D` dalından çıkarır; böylece sürüm doğrulaması ve düzeltmeler
  `main` üzerindeki yeni geliştirmeyi engellemez
- Bir beta etiketi itilmiş veya yayımlanmışsa ve düzeltme gerekiyorsa, bakımcılar
  eski beta etiketini silmek veya yeniden oluşturmak yerine sonraki `-beta.N`
  etiketini çıkarır
- Ayrıntılı sürüm prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca bakımcılara özeldir

## Sürüm operatörü kontrol listesi

Bu kontrol listesi sürüm akışının herkese açık şeklini gösterir. Özel kimlik bilgileri,
imzalama, noter onayı, dist-tag kurtarma ve acil geri alma ayrıntıları
yalnızca bakımcılara özel sürüm çalışma kitabında kalır.

1. Geçerli `main` üzerinden başlayın: en son durumu çekin, hedef commit’in itilmiş olduğunu doğrulayın
   ve geçerli `main` CI durumunun dal oluşturmak için yeterince yeşil olduğunu doğrulayın.
2. En üstteki `CHANGELOG.md` bölümünü gerçek commit geçmişinden `/changelog` ile yeniden yazın,
   girdileri kullanıcıya dönük tutun, commit’leyin, itin ve dal oluşturmadan önce bir kez daha rebase/pull
   yapın.
3. Sürüm uyumluluk kayıtlarını
   `src/plugins/compat/registry.ts` ve
   `src/commands/doctor/shared/deprecation-compat.ts` içinde gözden geçirin. Süresi dolmuş
   uyumluluğu yalnızca yükseltme yolu kapsamda kalıyorsa kaldırın veya neden
   bilinçli olarak taşındığını kaydedin.
4. Geçerli `main` üzerinden `release/YYYY.M.D` oluşturun; normal sürüm işini
   doğrudan `main` üzerinde yapmayın.
5. Amaçlanan etiket için gerekli her versiyon konumunu artırın,
   yayımlanabilir Plugin paketlerinin sürüm versiyonunu ve uyumluluk metadatasını paylaşması için
   `pnpm plugins:sync` çalıştırın, ardından yerel deterministik ön kontrolü çalıştırın:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` ve
   `pnpm release:check`.
6. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın. Etiket oluşmadan önce,
   yalnızca doğrulama amaçlı ön kontrol için 40 karakterlik tam bir release-branch SHA’sına izin verilir.
   Başarılı `preflight_run_id` değerini kaydedin.
7. Sürüm dalı, etiketi veya tam commit SHA’sı için `Full Release Validation` ile tüm
   ön sürüm testlerini başlatın. Bu, dört büyük sürüm test kutusu için tek manuel giriş noktasıdır:
   Vitest, Docker, QA Lab ve Package.
8. Doğrulama başarısız olursa, düzeltmeyi sürüm dalında yapın ve düzeltmeyi kanıtlayan en küçük başarısız
   dosyayı, hattı, workflow işini, paket profilini, sağlayıcıyı veya model izin listesini yeniden çalıştırın.
   Tam şemsiyeyi yalnızca değişen yüzey önceki kanıtları bayatlatıyorsa yeniden çalıştırın.
9. Beta için `vYYYY.M.D-beta.N` etiketini oluşturun, ardından eşleşen
   `release/YYYY.M.D` dalından `OpenClaw Release Publish` çalıştırın. Bu,
   `pnpm plugins:sync:check` doğrulaması yapar, önce tüm yayımlanabilir Plugin paketlerini npm’e yayımlar,
   aynı seti ikinci olarak ClawPack npm-pack tarball’ları şeklinde ClawHub’a yayımlar ve ardından hazırlanan
   OpenClaw npm ön kontrol artefaktını eşleşen dist-tag ile yükseltir. Yayımdan sonra, yayımlanmış
   `openclaw@YYYY.M.D-beta.N` veya `openclaw@beta` paketine karşı yayım sonrası paket
   kabulünü çalıştırın. İtilmiş veya yayımlanmış bir ön sürüm düzeltme gerektirirse,
   sonraki eşleşen ön sürüm numarasını çıkarın; eski ön sürümü silmeyin veya yeniden yazmayın.
10. Kararlı sürüm için yalnızca incelenmiş beta veya sürüm adayı gerekli doğrulama kanıtına sahip olduktan sonra
    devam edin. Kararlı npm yayımı da `preflight_run_id` üzerinden başarılı ön kontrol artefaktını yeniden kullanarak
    `OpenClaw Release Publish` içinden geçer; kararlı macOS sürüm hazır oluşu ayrıca
    paketlenmiş `.zip`, `.dmg`, `.dSYM.zip` ve `main` üzerinde güncellenmiş `appcast.xml` gerektirir.
11. Yayımdan sonra npm yayım sonrası doğrulayıcısını, yayım sonrası kanal kanıtı gerektiğinde isteğe bağlı bağımsız
    yayımlanmış-npm Telegram E2E’yi, gerektiğinde dist-tag yükseltmesini, eksiksiz eşleşen
    `CHANGELOG.md` bölümünden GitHub sürüm/ön sürüm notlarını ve sürüm duyurusu
    adımlarını çalıştırın.

## Sürüm ön kontrolü

- Sürüm ön kontrolünden önce `pnpm check:test-types` çalıştırın; böylece test TypeScript kapsamı daha hızlı yerel `pnpm check` geçidi dışında da korunur
- Sürüm ön kontrolünden önce `pnpm check:architecture` çalıştırın; böylece daha kapsamlı içe aktarma döngüsü ve mimari sınır denetimleri daha hızlı yerel geçit dışında yeşil olur
- `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın; böylece beklenen `dist/*` sürüm artifaktları ve Control UI paketi, paket doğrulama adımı için mevcut olur
- Kök sürüm artırmasından sonra ve etiketlemeden önce `pnpm plugins:sync` çalıştırın. Bu, yayınlanabilir Plugin paket sürümlerini, OpenClaw eş/API uyumluluk meta verilerini, derleme meta verilerini ve Plugin değişiklik günlüğü taslaklarını çekirdek sürüm sürümüyle eşleşecek şekilde günceller. `pnpm plugins:sync:check`, mutasyon yapmayan sürüm korumasıdır; bu adım unutulduysa yayın iş akışı herhangi bir registry mutasyonundan önce başarısız olur.
- Sürüm onayından önce tüm ön sürüm test kutularını tek bir giriş noktasından başlatmak için manuel `Full Release Validation` iş akışını çalıştırın. Bir dal, etiket veya tam commit SHA kabul eder, manuel `CI` gönderir ve kurulum smoke, paket kabulü, Docker sürüm yolu takımları, canlı/E2E, OpenWebUI, QA Lab paritesi, Matrix ve Telegram hatları için `OpenClaw Release Checks` gönderir. `release_profile=full` ve `rerun_group=all` ile, sürüm denetimlerinden gelen `release-package-under-test` artifaktına karşı paket Telegram E2E de çalıştırır. Aynı Telegram E2E’nin yayımlanan npm paketini de kanıtlaması gerektiğinde yayımlamadan sonra `npm_telegram_package_spec` sağlayın. Package Acceptance’ın paket/güncelleme matrisini SHA ile oluşturulmuş artifakt yerine yayımlanan npm paketine karşı çalıştırması gerektiğinde yayımlamadan sonra `package_acceptance_package_spec` sağlayın. Özel kanıt raporunun, Telegram E2E’yi zorlamadan doğrulamanın yayımlanmış bir npm paketiyle eşleştiğini kanıtlaması gerektiğinde `evidence_package_spec` sağlayın. Örnek:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Sürüm çalışması devam ederken bir paket adayı için yan kanal kanıtı istediğinizde manuel `Package Acceptance` iş akışını çalıştırın. `openclaw@beta`, `openclaw@latest` veya kesin bir sürüm için `source=npm`; mevcut `workflow_ref` koşumuyla güvenilir bir `package_ref` dalını/etiketini/SHA’sını paketlemek için `source=ref`; zorunlu SHA-256 içeren bir HTTPS tarball için `source=url`; ya da başka bir GitHub Actions çalıştırması tarafından yüklenen tarball için `source=artifact` kullanın. İş akışı adayı `package-under-test` olarak çözer, Docker E2E sürüm zamanlayıcısını bu tarball’a karşı yeniden kullanır ve `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` ile aynı tarball’a karşı Telegram QA çalıştırabilir. Seçilen Docker hatları `published-upgrade-survivor` içerdiğinde paket artifaktı adaydır ve `published_upgrade_survivor_baseline` yayımlanan taban sürümü seçer.
  Örnek: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Yaygın profiller:
  - `smoke`: kurulum/kanal/ajan, Gateway ağı ve yapılandırma yeniden yükleme hatları
  - `package`: OpenWebUI veya canlı ClawHub olmadan artifakta özgü paket/güncelleme/Plugin hatları
  - `product`: paket profiline ek olarak MCP kanalları, cron/alt ajan temizliği,
    OpenAI web araması ve OpenWebUI
  - `full`: OpenWebUI ile Docker sürüm yolu parçaları
  - `custom`: odaklı bir yeniden çalıştırma için kesin `docker_lanes` seçimi
- Sürüm adayı için yalnızca tam normal CI kapsamına ihtiyacınız olduğunda manuel `CI` iş akışını doğrudan çalıştırın. Manuel CI gönderimleri değişiklik kapsamını atlar ve Linux Node parçalarını, paketlenmiş Plugin parçalarını, kanal sözleşmelerini, Node 22 uyumluluğunu, `check`, `check-additional`, derleme smoke, doküman denetimleri, Python becerileri, Windows, macOS, Android ve Control UI i18n hatlarını zorlar.
  Örnek: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Sürüm telemetrisini doğrularken `pnpm qa:otel:smoke` çalıştırın. QA-lab’i yerel bir OTLP/HTTP alıcısı üzerinden çalıştırır ve Opik, Langfuse veya başka bir harici toplayıcı gerektirmeden dışa aktarılan iz span adlarını, sınırlandırılmış öznitelikleri ve içerik/tanımlayıcı redaksiyonunu doğrular.
- Her etiketli sürümden önce `pnpm release:check` çalıştırın
- Etiket mevcut olduktan sonra mutasyon yapan yayımlama dizisi için `OpenClaw Release Publish` çalıştırın. Bunu `release/YYYY.M.D` üzerinden gönderin (veya main üzerinden erişilebilir bir etiketi yayımlarken `main`), sürüm etiketini ve başarılı OpenClaw npm `preflight_run_id` değerini geçirin ve bilinçli olarak odaklı bir onarım çalıştırmıyorsanız varsayılan Plugin yayımlama kapsamı `all-publishable` olarak kalsın. İş akışı Plugin npm yayımlamayı, Plugin ClawHub yayımlamayı ve OpenClaw npm yayımlamayı seri hale getirir; böylece çekirdek paket dışsallaştırılmış Plugin’lerinden önce yayımlanmaz.
- Sürüm denetimleri artık ayrı bir manuel iş akışında çalışır:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`, sürüm onayından önce QA Lab mock parite hattını, hızlı canlı Matrix profilini ve Telegram QA hattını da çalıştırır. Canlı hatlar `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI kimlik bilgisi kiralamalarını kullanır. Tam Matrix taşıma, medya ve E2EE envanterini paralel istediğinizde manuel `QA-Lab - All Lanes` iş akışını `matrix_profile=all` ve `matrix_shards=true` ile çalıştırın.
- Platformlar arası kurulum ve yükseltme çalışma zamanı doğrulaması, yeniden kullanılabilir iş akışı
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` dosyasını doğrudan çağıran herkese açık `OpenClaw Release Checks` ve `Full Release Validation` kapsamındadır
- Bu ayrım bilinçlidir: gerçek npm sürüm yolunu kısa, deterministik ve artifakt odaklı tutarken daha yavaş canlı denetimler kendi hattında kalır; böylece yayımlamayı yavaşlatmaz veya engellemez
- Gizli içeren sürüm denetimleri `Full Release Validation` üzerinden ya da `main`/sürüm iş akışı ref’inden gönderilmelidir; böylece iş akışı mantığı ve sırlar kontrollü kalır
- `OpenClaw Release Checks`, çözümlenen commit bir OpenClaw dalından veya sürüm etiketinden erişilebilir olduğu sürece dal, etiket veya tam commit SHA kabul eder
- `OpenClaw NPM Release` yalnızca doğrulama ön kontrolü, itilmiş etiket gerektirmeden geçerli tam 40 karakterli iş akışı dalı commit SHA’sını da kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek bir yayımlamaya yükseltilemez
- SHA modunda iş akışı `v<package.json version>` değerini yalnızca paket meta verisi denetimi için sentezler; gerçek yayımlama hâlâ gerçek bir sürüm etiketi gerektirir
- Her iki iş akışı da gerçek yayımlama ve yükseltme yolunu GitHub barındırmalı runner’larda tutarken, mutasyon yapmayan doğrulama yolu daha büyük Blacksmith Linux runner’larını kullanabilir
- Bu iş akışı
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  komutunu hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` iş akışı sırlarını kullanarak çalıştırır
- npm sürüm ön kontrolü artık ayrı sürüm denetimleri hattını beklemez
- Onaydan önce `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (veya eşleşen beta/düzeltme etiketi) çalıştırın
- npm yayımlamasından sonra yayımlanan registry kurulum yolunu yeni bir geçici önekte doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (veya eşleşen beta/düzeltme sürümü) çalıştırın
- Beta yayımlamasından sonra paylaşılan kiralık Telegram kimlik bilgisi havuzunu kullanarak yayımlanan npm paketine karşı kurulu paket onboarding’i, Telegram kurulumunu ve gerçek Telegram E2E’yi doğrulamak için `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` çalıştırın. Yerel maintainer tek seferlik çalıştırmaları Convex değişkenlerini atlayabilir ve üç `OPENCLAW_QA_TELEGRAM_*` ortam kimlik bilgisini doğrudan geçebilir.
- Bir maintainer makinesinden tam yayımlama sonrası beta smoke çalıştırmak için `pnpm release:beta-smoke -- --beta betaN` kullanın. Yardımcı, Parallels npm güncelleme/yeni hedef doğrulamasını çalıştırır, `NPM Telegram Beta E2E` gönderir, kesin iş akışı çalıştırmasını yoklar, artifaktı indirir ve Telegram raporunu yazdırır.
- Maintainer’lar aynı yayımlama sonrası denetimi GitHub Actions üzerinden manuel `NPM Telegram Beta E2E` iş akışıyla çalıştırabilir. Bu iş akışı bilinçli olarak yalnızca manueldir ve her birleştirmede çalışmaz.
- Maintainer sürüm otomasyonu artık ön kontrol-sonra-yükseltme kullanır:
  - gerçek npm yayımlama başarılı bir npm `preflight_run_id` geçmelidir
  - gerçek npm yayımlama, başarılı ön kontrol çalıştırmasıyla aynı `main` veya
    `release/YYYY.M.D` dalından gönderilmelidir
  - kararlı npm sürümleri varsayılan olarak `beta` kullanır
  - kararlı npm yayımlama, iş akışı girdisiyle açıkça `latest` hedefleyebilir
  - token tabanlı npm dist-tag mutasyonu artık güvenlik nedeniyle
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    içinde yaşar; çünkü herkese açık depo OIDC-only yayımlamayı korurken `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirir
  - herkese açık `macOS Release` yalnızca doğrulama içindir; bir etiket yalnızca bir sürüm dalında bulunduğunda ama iş akışı `main` üzerinden gönderildiğinde `public_release_branch=release/YYYY.M.D` ayarlayın
  - gerçek özel mac yayımlaması başarılı özel mac
    `preflight_run_id` ve `validate_run_id` değerlerini geçmelidir
  - gerçek yayımlama yolları, yeniden derlemek yerine hazırlanmış artifaktları yükseltir
- `YYYY.M.D-N` gibi kararlı düzeltme sürümleri için yayımlama sonrası doğrulayıcı aynı geçici önek yükseltme yolunu `YYYY.M.D` sürümünden `YYYY.M.D-N` sürümüne de denetler; böylece sürüm düzeltmeleri eski global kurulumları sessizce temel kararlı yükte bırakamaz
- npm sürüm ön kontrolü, tarball hem `dist/control-ui/index.html` hem de boş olmayan `dist/control-ui/assets/` yükünü içermedikçe kapalı şekilde başarısız olur; böylece tekrar boş bir tarayıcı panosu göndermeyiz
- Yayımlama sonrası doğrulama, yayımlanan Plugin giriş noktalarının ve paket meta verilerinin kurulu registry yerleşiminde mevcut olduğunu da denetler. Eksik Plugin çalışma zamanı yükleriyle gönderilen bir sürüm postpublish doğrulayıcıda başarısız olur ve `latest` sürümüne yükseltilemez.
- `pnpm test:install:smoke`, aday güncelleme tarball’ında npm paket `unpackedSize` bütçesini de uygular; böylece installer e2e yanlışlıkla oluşan paket şişmesini sürüm yayımlama yolundan önce yakalar
- Sürüm çalışması CI planlamasına, extension zamanlama manifestlerine veya extension test matrislerine dokunduysa, sürüm notlarının bayat bir CI yerleşimini açıklamaması için onaydan önce `.github/workflows/plugin-prerelease.yml` içinden planlayıcıya ait `plugin-prerelease-extension-shard` matris çıktılarını yeniden üretin ve gözden geçirin
- Kararlı macOS sürüm hazırlığı, güncelleyici yüzeylerini de içerir:
  - GitHub sürümü paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` ile sonuçlanmalıdır
  - `main` üzerindeki `appcast.xml`, yayımlamadan sonra yeni kararlı zip’i göstermelidir
  - paketlenmiş uygulama debug olmayan bir bundle id, boş olmayan bir Sparkle feed URL’si ve o sürüm için kanonik Sparkle derleme tabanına eşit veya ondan yüksek bir `CFBundleVersion` korumalıdır

## Sürüm test kutuları

`Full Release Validation`, operatörlerin tüm ön sürüm testlerini tek bir giriş noktasından başlatma yoludur. Hızlı hareket eden bir dalda sabitlenmiş commit kanıtı için yardımcıyı kullanın; böylece her alt iş akışı hedef SHA’ya sabitlenmiş geçici bir daldan çalışır:

```bash
pnpm ci:full-release --sha <full-sha>
```

Yardımcı `release-ci/<sha>-...` dalını iter, bu daldan `Full Release Validation` iş akışını `ref=<sha>` ile gönderir, her alt iş akışı `headSha` değerinin hedefle eşleştiğini doğrular ve sonra geçici dalı siler. Bu, yanlışlıkla daha yeni bir `main` alt çalıştırmasını kanıtlamayı önler.

Sürüm dalı veya etiket doğrulaması için, güvenilir `main` iş akışı ref’inden çalıştırın ve sürüm dalını veya etiketini `ref` olarak geçin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

İş akışı hedef ref'i çözer, `target_ref=<release-ref>` ile manuel `CI` tetikler, `OpenClaw Release Checks` tetikler, paket odaklı kontroller için üst `release-package-under-test` yapıtını hazırlar ve `release_profile=full` ile `rerun_group=all` olduğunda ya da `npm_telegram_package_spec` ayarlandığında bağımsız paket Telegram E2E tetikler. Ardından `OpenClaw Release Checks`, kurulum smoke, çapraz işletim sistemi sürüm kontrolleri, canlı/E2E Docker sürüm yolu kapsamı, Telegram paket QA ile Package Acceptance, QA Lab eşliği, canlı Matrix ve canlı Telegram için dallanır. Tam bir çalıştırma yalnızca `Full Release Validation` özetinde `normal_ci` ve `release_checks` başarılı göründüğünde kabul edilebilir. Full/all modunda `npm_telegram` alt çalıştırması da başarılı olmalıdır; full/all dışında, yayımlanmış bir `npm_telegram_package_spec` sağlanmadığı sürece atlanır. Son doğrulayıcı özeti, her alt çalıştırma için en yavaş iş tablolarını içerir; böylece sürüm yöneticisi günlükleri indirmeden mevcut kritik yolu görebilir.
Tam aşama matrisi, kesin iş akışı iş adları, stable ile full profil farkları, yapıtlar ve odaklı yeniden çalıştırma tanıtıcıları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.
Alt iş akışları, hedef `ref` eski bir sürüm dalını veya etiketini gösterse bile `Full Release Validation` çalıştıran güvenilir ref'ten, normalde `--ref main` üzerinden tetiklenir. Ayrı bir Full Release Validation iş akışı ref girdisi yoktur; güvenilir test düzeneğini iş akışı çalıştırma ref'ini seçerek seçin.
Hareketli `main` üzerinde kesin commit kanıtı için `--ref main -f ref=<sha>` kullanmayın; ham commit SHA'ları iş akışı dispatch ref'leri olamaz, bu yüzden sabitlenmiş geçici dalı oluşturmak için `pnpm ci:full-release --sha <sha>` kullanın.

Canlı/provider genişliğini seçmek için `release_profile` kullanın:

- `minimum`: en hızlı, sürüm açısından kritik OpenAI/core canlı ve Docker yolu
- `stable`: sürüm onayı için minimuma ek olarak stable provider/backend kapsamı
- `full`: stable'a ek olarak geniş tavsiye provider/medya kapsamı

`OpenClaw Release Checks`, hedef ref'i `release-package-under-test` olarak bir kez çözmek için güvenilir iş akışı ref'ini kullanır ve bu yapıtı hem sürüm yolu Docker kontrollerinde hem de Package Acceptance içinde yeniden kullanır. Bu, tüm paket odaklı kutuların aynı baytlar üzerinde kalmasını sağlar ve yinelenen paket derlemelerini önler.
Çapraz işletim sistemi OpenAI kurulum smoke, repo/org değişkeni ayarlanmışsa `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır; aksi halde `openai/gpt-5.4` kullanır, çünkü bu şerit en yavaş varsayılan modeli karşılaştırmak yerine paket kurulumunu, onboarding'i, Gateway başlatmayı ve bir canlı agent turunu kanıtlar. Daha geniş canlı provider matrisi, modele özgü kapsamın yeri olmaya devam eder.

Sürüm aşamasına bağlı olarak şu varyantları kullanın:

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

Odaklı bir düzeltmeden sonraki ilk yeniden çalıştırma olarak tam şemsiyeyi kullanmayın. Bir kutu başarısız olursa, sonraki kanıt için başarısız alt iş akışını, işi, Docker şeridini, paket profilini, model provider'ını veya QA şeridini kullanın. Tam şemsiyeyi yalnızca düzeltme paylaşılan sürüm orkestrasyonunu değiştirdiğinde ya da önceki tüm kutu kanıtını bayatlattığında yeniden çalıştırın. Şemsiyenin son doğrulayıcısı kaydedilen alt iş akışı çalıştırma kimliklerini yeniden kontrol eder, bu yüzden bir alt iş akışı başarıyla yeniden çalıştırıldıktan sonra yalnızca başarısız `Verify full validation` üst işini yeniden çalıştırın.

Sınırlı kurtarma için şemsiyeye `rerun_group` geçin. `all` gerçek sürüm adayı çalıştırmasıdır, `ci` yalnızca normal CI altını çalıştırır, `plugin-prerelease` yalnızca sürüme özel Plugin altını çalıştırır, `release-checks` her sürüm kutusunu çalıştırır ve daha dar sürüm grupları `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ve `npm-telegram` değerleridir.
Odaklı `npm-telegram` yeniden çalıştırmaları `npm_telegram_package_spec` gerektirir; `release_profile=full` ile full/all çalıştırmaları release-checks paket yapıtını kullanır.

### Vitest

Vitest kutusu, manuel `CI` alt iş akışıdır. Manuel CI, değişiklik kapsamlamasını bilerek atlar ve sürüm adayı için normal test grafiğini zorlar: Linux Node parçaları, paketlenmiş Plugin parçaları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, derleme smoke, docs kontrolleri, Python Skills, Windows, macOS, Android ve Control UI i18n.

Bu kutuyu "kaynak ağacı tam normal test paketinden geçti mi?" sorusunu yanıtlamak için kullanın. Bu, sürüm yolu ürün doğrulamasıyla aynı şey değildir. Saklanacak kanıtlar:

- Tetiklenen `CI` çalıştırma URL'sini gösteren `Full Release Validation` özeti
- Kesin hedef SHA üzerinde yeşil `CI` çalıştırması
- regresyonları araştırırken CI işlerinden başarısız veya yavaş parça adları
- bir çalıştırmanın performans analizine ihtiyaç duyması halinde `.artifacts/vitest-shard-timings.json` gibi Vitest zamanlama yapıtları

Sürüm deterministik normal CI gerektirdiğinde ancak Docker, QA Lab, canlı, çapraz işletim sistemi veya paket kutularını gerektirmediğinde manuel CI'ı doğrudan çalıştırın:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker kutusu, `openclaw-live-and-e2e-checks-reusable.yml` üzerinden `OpenClaw Release Checks` içinde ve sürüm modu `install-smoke` iş akışında bulunur. Sürüm adayını yalnızca kaynak düzeyi testler yerine paketlenmiş Docker ortamları üzerinden doğrular.

Sürüm Docker kapsamı şunları içerir:

- yavaş Bun global kurulum smoke etkinleştirilmiş tam kurulum smoke
- hedef SHA'ya göre kök Dockerfile smoke imajı hazırlama/yeniden kullanma; QR, root/gateway ve installer/Bun smoke işleri ayrı install-smoke parçaları olarak çalışır
- depo E2E şeritleri
- sürüm yolu Docker parçaları: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` ve `plugins-runtime-install-h`
- istendiğinde `plugins-runtime-services` parçası içinde OpenWebUI kapsamı
- `bundled-plugin-install-uninstall-0` ile `bundled-plugin-install-uninstall-23` arasında bölünmüş paketlenmiş Plugin kurulum/kaldırma şeritleri
- release checks canlı paketleri içerdiğinde canlı/E2E provider paketleri ve Docker canlı model kapsamı

Yeniden çalıştırmadan önce Docker yapıtlarını kullanın. Sürüm yolu zamanlayıcısı, şerit günlükleri, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı plan JSON'u ve yeniden çalıştırma komutları ile `.artifacts/docker-tests/` yükler. Odaklı kurtarma için tüm sürüm parçalarını yeniden çalıştırmak yerine yeniden kullanılabilir canlı/E2E iş akışında `docker_lanes=<lane[,lane]>` kullanın. Üretilen yeniden çalıştırma komutları, mevcut olduğunda önceki `package_artifact_run_id` ve hazırlanmış Docker imaj girdilerini içerir; böylece başarısız bir şerit aynı tarball ve GHCR imajlarını yeniden kullanabilir.

### QA Lab

QA Lab kutusu da `OpenClaw Release Checks` parçasıdır. Vitest ve Docker paket mekaniklerinden ayrı olarak agent davranışı ve kanal düzeyi sürüm geçididir.

Sürüm QA Lab kapsamı şunları içerir:

- agentic parity pack kullanarak OpenAI aday şeridini Opus 4.6 taban çizgisiyle karşılaştıran mock eşlik şeridi
- `qa-live-shared` ortamını kullanan hızlı canlı Matrix QA profili
- Convex CI kimlik bilgisi kiralamalarını kullanan canlı Telegram QA şeridi
- sürüm telemetrisi açık yerel kanıta ihtiyaç duyduğunda `pnpm qa:otel:smoke`

Bu kutuyu "sürüm QA senaryolarında ve canlı kanal akışlarında doğru davranıyor mu?" sorusunu yanıtlamak için kullanın. Sürümü onaylarken eşlik, Matrix ve Telegram şeritleri için yapıt URL'lerini saklayın. Tam Matrix kapsamı, varsayılan sürüm açısından kritik şerit yerine manuel parçalı QA-Lab çalıştırması olarak kullanılabilir olmaya devam eder.

### Paket

Paket kutusu, kurulabilir ürün geçididir. `Package Acceptance` ve `scripts/resolve-openclaw-package-candidate.mjs` çözücüsü tarafından desteklenir. Çözücü, adayı Docker E2E tarafından tüketilen `package-under-test` tarball'ına normalleştirir, paket envanterini doğrular, paket sürümünü ve SHA-256 değerini kaydeder ve iş akışı test düzeneği ref'ini paket kaynak ref'inden ayrı tutar.

Desteklenen aday kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya kesin bir OpenClaw sürüm versiyonu
- `source=ref`: seçilen `workflow_ref` test düzeneğiyle güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA'sını paketle
- `source=url`: zorunlu `package_sha256` ile bir HTTPS `.tgz` indir
- `source=artifact`: başka bir GitHub Actions çalıştırması tarafından yüklenmiş bir `.tgz` yeniden kullan

`OpenClaw Release Checks`, Package Acceptance'ı `source=artifact`, hazırlanmış sürüm paket yapıtı, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` ve `telegram_mode=mock-openai` ile çalıştırır. Package Acceptance, migration, update, eski Plugin bağımlılığı temizliği, çevrimdışı Plugin fixture'ları, Plugin update ve Telegram paket QA'yı aynı çözülmüş tarball'a karşı tutar. Yükseltme matrisi, `2026.4.23` ile `latest` arasındaki her stable npm yayımlanmış taban çizgisini kapsar; zaten gönderilmiş bir aday için `source=npm` ile Package Acceptance, yayımlama öncesi SHA destekli yerel npm tarball için `source=ref`/`source=artifact` kullanın. Bu, daha önce Parallels gerektiren paket/update kapsamının çoğu için GitHub'a özgü yerini alır. Çapraz işletim sistemi sürüm kontrolleri işletim sistemine özgü onboarding, installer ve platform davranışı için hâlâ önemlidir, ancak paket/update ürün doğrulaması Package Acceptance'ı tercih etmelidir.

Update ve Plugin doğrulaması için kanonik kontrol listesi [Update ve Plugin testleri](/tr/help/testing-updates-plugins) bölümüdür. Bir Plugin install/update, doctor cleanup veya yayımlanmış paket migration değişikliğini hangi yerel, Docker, Package Acceptance ya da release-check şeridinin kanıtladığına karar verirken bunu kullanın.
Her stable `2026.4.23+` paketinden kapsamlı yayımlanmış update migration, Full Release CI'ın parçası değil, ayrı bir manuel `Update Migration` iş akışıdır.

Eski package-acceptance esnekliği bilerek zamanla sınırlıdır. `2026.4.25` dahil paketler, npm'e zaten yayımlanmış metadata boşlukları için uyumluluk yolunu kullanabilir: tarball'da eksik özel QA envanter girdileri, eksik `gateway install --wrapper`, tarball'dan türetilmiş git fixture'ında eksik patch dosyaları, eksik kalıcı `update.channel`, eski Plugin install-record konumları, eksik marketplace install-record kalıcılığı ve `plugins update` sırasında config metadata migration. Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel derleme metadata damga dosyaları için uyarı verebilir. Daha sonraki paketler modern paket sözleşmelerini karşılamalıdır; aynı boşluklar sürüm doğrulamasında başarısız olur.

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

- `smoke`: hızlı paket kurulumu/kanal/ajan, Gateway ağı ve yapılandırma
  yeniden yükleme hatları
- `package`: canlı ClawHub olmadan kurulum/güncelleme/Plugin paket sözleşmeleri; bu, release-check
  varsayılanıdır
- `product`: `package` artı MCP kanalları, cron/alt ajan temizliği, OpenAI web
  araması ve OpenWebUI
- `full`: OpenWebUI ile Docker yayın yolu parçaları
- `custom`: odaklı yeniden çalıştırmalar için tam `docker_lanes` listesi

Paket adayı Telegram kanıtı için Package Acceptance üzerinde `telegram_mode=mock-openai` veya
`telegram_mode=live-frontier` etkinleştirin. İş akışı, çözümlenen
`package-under-test` tarball dosyasını Telegram hattına geçirir; bağımsız
Telegram iş akışı, yayın sonrası kontroller için hâlâ yayınlanmış bir npm tanımını kabul eder.

## Yayın yayımlama otomasyonu

`OpenClaw Release Publish`, normal değişiklik yapan yayımlama giriş noktasıdır. Yayının ihtiyaç duyduğu sırada güvenilir yayımlayıcı iş akışlarını
orkestre eder:

1. Yayın etiketini çıkar ve commit SHA değerini çözümle.
2. Etiketin `main` veya `release/*` üzerinden erişilebilir olduğunu doğrula.
3. `pnpm plugins:sync:check` çalıştır.
4. `publish_scope=all-publishable` ve
   `ref=<release-sha>` ile `Plugin NPM Release` tetikle.
5. Aynı kapsam ve SHA ile `Plugin ClawHub Release` tetikle.
6. Yayın etiketi, npm dist-tag ve kaydedilmiş
   `preflight_run_id` ile `OpenClaw NPM Release` tetikle.

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

Doğrudan `latest` değerine kararlı yükseltme açıkça belirtilir:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Daha düşük seviyeli `Plugin NPM Release` ve `Plugin ClawHub Release` iş akışlarını
yalnızca odaklı onarım veya yeniden yayımlama işleri için kullanın. Seçilmiş bir Plugin onarımı için
`OpenClaw Release Publish` öğesine `plugin_publish_scope=selected` ve `plugins=@openclaw/name` geçirin
ya da OpenClaw paketinin yayımlanmaması gerektiğinde alt iş akışını doğrudan tetikleyin.

## NPM iş akışı girdileri

`OpenClaw NPM Release`, operatör tarafından denetlenen şu girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya
  `v2026.4.2-beta.1` gibi gerekli yayın etiketi; `preflight_only=true` olduğunda, yalnızca doğrulama amaçlı ön kontrol için geçerli
  tam 40 karakterlik iş akışı dalı commit SHA değeri de olabilir
- `preflight_only`: yalnızca doğrulama/derleme/paket için `true`, gerçek yayımlama yolu için `false`
- `preflight_run_id`: iş akışının başarılı ön kontrol çalıştırmasından hazırlanan tarball dosyasını yeniden kullanması için gerçek yayımlama yolunda gereklidir
- `npm_dist_tag`: yayımlama yolu için npm hedef etiketi; varsayılanı `beta`

`OpenClaw Release Publish`, operatör tarafından denetlenen şu girdileri kabul eder:

- `tag`: gerekli yayın etiketi; zaten var olmalıdır
- `preflight_run_id`: başarılı `OpenClaw NPM Release` ön kontrol çalıştırma kimliği;
  `publish_openclaw_npm=true` olduğunda gereklidir
- `npm_dist_tag`: OpenClaw paketi için npm hedef etiketi
- `plugin_publish_scope`: varsayılanı `all-publishable`; `selected` yalnızca
  odaklı onarım işi için kullanılır
- `plugins`: `plugin_publish_scope=selected` olduğunda virgülle ayrılmış `@openclaw/*` paket adları
- `publish_openclaw_npm`: varsayılanı `true`; yalnızca iş akışını
  sadece Plugin onarım orkestratörü olarak kullanırken `false` olarak ayarlayın

`OpenClaw Release Checks`, operatör tarafından denetlenen şu girdileri kabul eder:

- `ref`: doğrulanacak dal, etiket veya tam commit SHA. Gizli bilgi içeren kontroller,
  çözümlenen commit'in bir OpenClaw dalından veya
  yayın etiketinden erişilebilir olmasını gerektirir.

Kurallar:

- Kararlı ve düzeltme etiketleri `beta` veya `latest` değerlerinden birine yayımlanabilir
- Beta ön yayın etiketleri yalnızca `beta` değerine yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca
  `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` ve `Full Release Validation` her zaman
  yalnızca doğrulama amaçlıdır
- Gerçek yayımlama yolu, ön kontrol sırasında kullanılan aynı `npm_dist_tag` değerini kullanmalıdır;
  iş akışı, yayımlama öncesi meta verilerin devam ettiğini doğrular

## Kararlı npm yayın sırası

Kararlı bir npm yayını çıkarırken:

1. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın
   - Etiket var olmadan önce, ön kontrol iş akışının yalnızca doğrulama amaçlı deneme çalıştırması için geçerli tam iş akışı dalı commit
     SHA değerini kullanabilirsiniz
2. Normal önce beta akışı için `npm_dist_tag=beta` seçin veya yalnızca
   kasıtlı olarak doğrudan kararlı yayımlama istediğinizde `latest` seçin
3. Tek bir manuel iş akışından normal CI ile birlikte canlı prompt önbelleği, Docker, QA Lab,
   Matrix ve Telegram kapsamı istediğinizde yayın dalı, yayın etiketi veya tam
   commit SHA üzerinde `Full Release Validation` çalıştırın
4. Kasıtlı olarak yalnızca deterministik normal test grafiğine ihtiyacınız varsa, bunun yerine
   yayın ref'i üzerinde manuel `CI` iş akışını çalıştırın
5. Başarılı `preflight_run_id` değerini kaydedin
6. Aynı `tag`, aynı `npm_dist_tag` ve kaydedilmiş `preflight_run_id` ile
   `OpenClaw Release Publish` çalıştırın; bu, OpenClaw npm paketini yükseltmeden önce haricileştirilmiş Plugin'leri npm ve ClawHub'a yayımlar
7. Yayın `beta` üzerinde gerçekleştiyse, bu kararlı sürümü `beta` değerinden `latest` değerine yükseltmek için özel
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   iş akışını kullanın
8. Yayın kasıtlı olarak doğrudan `latest` değerine yayımlandıysa ve `beta` hemen
   aynı kararlı derlemeyi izlemeliyse, her iki dist-tag'i kararlı sürüme yönlendirmek için aynı özel
   iş akışını kullanın veya zamanlanmış
   kendi kendini onarma eşitlemesinin `beta` değerini daha sonra taşımasına izin verin

Dist-tag değişikliği güvenlik için özel depoda bulunur, çünkü hâlâ
`NPM_TOKEN` gerektirir; herkese açık depo ise yalnızca OIDC ile yayımlamayı korur.

Bu, doğrudan yayımlama yolunu ve önce beta yükseltme yolunu hem
belgelenmiş hem de operatör tarafından görülebilir tutar.

Bir bakımcının yerel npm kimlik doğrulamasına geri dönmesi gerekirse, 1Password
CLI (`op`) komutlarını yalnızca ayrılmış bir tmux oturumu içinde çalıştırın. `op` komutunu
doğrudan ana ajan shell üzerinden çağırmayın; tmux içinde tutmak prompt'ları,
uyarıları ve OTP işlemeyi gözlemlenebilir kılar ve tekrarlanan ana makine uyarılarını önler.

## Herkese açık başvurular

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Bakımcılar gerçek çalışma kılavuzu için
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
içindeki özel yayın belgelerini kullanır.

## İlgili

- [Yayın kanalları](/tr/install/development-channels)
