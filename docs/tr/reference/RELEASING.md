---
read_when:
    - Herkese açık sürüm kanalı tanımları aranıyor
    - Sürüm doğrulamasını veya paket kabulünü çalıştırma
    - Sürüm adlandırması ve yayın temposunu arıyorsunuz
summary: Yayın hatları, operatör kontrol listesi, doğrulama kutuları, sürüm adlandırması ve ritim
title: Sürüm politikası
x-i18n:
    generated_at: "2026-05-11T20:36:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4f3aaa53534bb6d1af5e72900a48f52fc89ff8188af7b19ecf75543bfcb1ecb
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw'ın üç genel yayın kulvarı vardır:

- stable: varsayılan olarak npm `beta` kanalına, açıkça istendiğinde ise npm `latest` kanalına yayımlanan etiketli yayınlar
- beta: npm `beta` kanalına yayımlanan ön yayın etiketleri
- dev: `main` dalının hareketli baş ucu

## Sürüm adlandırma

- Kararlı yayın sürümü: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Kararlı düzeltme yayını sürümü: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön yayın sürümü: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ay veya günü sıfırla doldurmayın
- `latest`, geçerli yükseltilmiş kararlı npm yayını anlamına gelir
- `beta`, geçerli beta kurulum hedefi anlamına gelir
- Kararlı ve kararlı düzeltme yayınları varsayılan olarak npm `beta` kanalına yayımlanır; yayın operatörleri açıkça `latest` hedefleyebilir veya incelenmiş bir beta derlemesini daha sonra yükseltebilir
- Her kararlı OpenClaw yayını npm paketini ve macOS uygulamasını birlikte gönderir;
  beta yayınlar normalde önce npm/paket yolunu doğrular ve yayımlar, mac
  uygulamasını derleme/imzalama/noter onayı ise açıkça istenmedikçe kararlı yayınlara ayrılır

## Yayın sıklığı

- Yayınlar önce beta olarak ilerler
- Kararlı yayın, yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar genellikle yayınları geçerli `main` dalından oluşturulan bir
  `release/YYYY.M.D` dalından çıkarır; böylece yayın doğrulaması ve düzeltmeleri
  `main` üzerindeki yeni geliştirmeyi engellemez
- Bir beta etiketi itilmiş veya yayımlanmışsa ve düzeltme gerekiyorsa, bakımcılar
  eski beta etiketini silmek veya yeniden oluşturmak yerine sonraki `-beta.N`
  etiketini çıkarır
- Ayrıntılı yayın prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca bakımcılara özeldir

## Yayın operatörü kontrol listesi

Bu kontrol listesi yayın akışının genel biçimidir. Özel kimlik bilgileri,
imzalama, noter onayı, dist-tag kurtarma ve acil geri alma ayrıntıları
yalnızca bakımcılara özel yayın runbook'unda kalır.

1. Geçerli `main` dalından başlayın: en son değişiklikleri çekin, hedef commit'in itilmiş olduğunu
   doğrulayın ve geçerli `main` CI durumunun ondan dal oluşturmak için yeterince yeşil olduğunu doğrulayın.
2. Gerçek commit geçmişinden `/changelog` ile en üstteki `CHANGELOG.md` bölümünü yeniden yazın,
   girdileri kullanıcıya dönük tutun, commit'leyin, itin ve dallanmadan önce
   bir kez daha rebase/pull yapın.
3. Yayın uyumluluk kayıtlarını
   `src/plugins/compat/registry.ts` ve
   `src/commands/doctor/shared/deprecation-compat.ts` içinde gözden geçirin. Süresi dolmuş
   uyumluluğu yalnızca yükseltme yolu kapsanmaya devam ediyorsa kaldırın veya neden
   bilerek taşındığını kaydedin.
4. Geçerli `main` dalından `release/YYYY.M.D` oluşturun; normal yayın işini
   doğrudan `main` üzerinde yapmayın.
5. Amaçlanan etiket için gereken her sürüm konumunu artırın, ardından
   `pnpm release:prep` çalıştırın. Bu komut Plugin sürümlerini, Plugin envanterini, config
   şemasını, paketlenmiş kanal config metadata'sını, config dokümanları temel çizgisini, Plugin SDK
   dışa aktarımlarını ve Plugin SDK API temel çizgisini doğru sırayla yeniler. Etiketlemeden önce oluşan
   üretilmiş sapmaları commit'leyin. Ardından yerel deterministik ön kontrolü çalıştırın:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` ve `pnpm release:check`.
6. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın. Bir etiket yokken,
   yalnızca doğrulama amaçlı ön kontrol için tam 40 karakterlik yayın dalı SHA'sına izin verilir.
   Başarılı `preflight_run_id` değerini kaydedin.
7. Yayın dalı, etiket veya tam commit SHA'sı için `Full Release Validation` ile
   tüm ön yayın testlerini başlatın. Bu, dört büyük yayın test kutusu için tek manuel giriş noktasıdır:
   Vitest, Docker, QA Lab ve Package.
8. Doğrulama başarısız olursa, yayın dalında düzeltin ve düzeltmeyi kanıtlayan
   en küçük başarısız dosyayı, kulvarı, workflow job'ını, paket profilini, provider'ı veya model izin listesini
   yeniden çalıştırın. Tam şemsiyeyi yalnızca değişen yüzey önceki kanıtları bayatlatıyorsa
   yeniden çalıştırın.
9. Beta için `vYYYY.M.D-beta.N` etiketini oluşturun, ardından eşleşen
   `release/YYYY.M.D` dalından `OpenClaw Release Publish` çalıştırın. Bu komut
   `pnpm plugins:sync:check` doğrulaması yapar, yayımlanabilir tüm Plugin paketlerini npm'ye ve aynı seti
   paralel olarak ClawHub'a gönderir, sonra Plugin npm yayını başarılı olur olmaz
   hazırlanmış OpenClaw npm ön kontrol yapıtını eşleşen dist-tag ile yükseltir.
   OpenClaw npm yayın alt görevi başarılı olduktan sonra, eksiksiz eşleşen
   `CHANGELOG.md` bölümünden eşleşen GitHub release/prerelease sayfasını oluşturur veya günceller.
   npm `latest` kanalına yayımlanan kararlı yayınlar GitHub latest release olur; npm `beta` kanalında tutulan
   kararlı bakım yayınları GitHub `latest=false` ile oluşturulur.
   OpenClaw npm yayımlanırken ClawHub yayını hâlâ çalışıyor olabilir, ancak
   release publish workflow'u alt çalışma kimliklerini hemen yazdırır. Varsayılan olarak
   ClawHub'ı gönderdikten sonra beklemez; bu nedenle OpenClaw npm erişilebilirliği
   daha yavaş ClawHub onayları veya registry işleri tarafından engellenmez. ClawHub'ın workflow tamamlanmasını
   engellemesi gerektiğinde `wait_for_clawhub=true` ayarlayın.
   ClawHub yolu geçici CLI dependency kurulum hatalarını yeniden dener, bir preview hücresi dalgalansa bile
   preview'dan geçen Plugin'leri yayımlar ve her beklenen Plugin sürümü için
   registry doğrulamasıyla biter; böylece kısmi yayımlar görünür ve yeniden denenebilir kalır. Yayımdan sonra
   yayımlanmış `openclaw@YYYY.M.D-beta.N` veya
   `openclaw@beta` paketine karşı yayın sonrası paket
   kabulünü çalıştırın. İtilmiş veya yayımlanmış bir ön yayının düzeltmeye ihtiyacı varsa,
   sonraki eşleşen ön yayın numarasını çıkarın; eski ön yayını silmeyin veya yeniden yazmayın.
10. Kararlı yayın için, yalnızca incelenmiş beta veya release candidate gerekli
    doğrulama kanıtına sahipse devam edin. Kararlı npm yayını da
    başarılı ön kontrol yapıtını `preflight_run_id` ile yeniden kullanarak
    `OpenClaw Release Publish` üzerinden geçer; kararlı macOS yayın hazırlığı ayrıca
    paketlenmiş `.zip`, `.dmg`, `.dSYM.zip` ve `main` üzerindeki güncellenmiş `appcast.xml` dosyalarını gerektirir.
    Özel macOS publish workflow'u, release asset'leri doğrulandıktan sonra imzalı appcast'i otomatik olarak
    herkese açık `main` dalına yayımlar; branch protection doğrudan push'u engellerse
    bir appcast PR'ı açar veya günceller.
11. Yayımdan sonra npm yayın sonrası doğrulayıcıyı, yayın sonrası kanal kanıtı gerektiğinde isteğe bağlı bağımsız
    yayımlanmış-npm Telegram E2E'yi, gerektiğinde dist-tag yükseltmesini çalıştırın,
    üretilen GitHub release sayfasını doğrulayın
    ve yayın duyurusu adımlarını çalıştırın.

## Yayın ön kontrolü

- Sürüm ön kontrolünden önce `pnpm check:test-types` çalıştırın; böylece test TypeScript’i,
  daha hızlı yerel `pnpm check` kapısının dışında da kapsanmış olur
- Sürüm ön kontrolünden önce `pnpm check:architecture` çalıştırın; böylece daha geniş import
  döngüsü ve mimari sınır kontrolleri, daha hızlı yerel kapının dışında yeşil olur
- `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın; böylece beklenen
  `dist/*` sürüm artefaktları ve Control UI paketi, paket doğrulama adımı için mevcut olur
- Kök sürüm artırmasından sonra ve etiketlemeden önce `pnpm release:prep` çalıştırın. Bu komut,
  sürüm/yapılandırma/API değişikliğinden sonra sıkça sapan tüm deterministik sürüm üreticilerini çalıştırır:
  Plugin sürümleri, Plugin envanteri, temel yapılandırma şeması, paketlenen kanal yapılandırma metadatası,
  yapılandırma dokümanları taban çizgisi, Plugin SDK dışa aktarımları ve Plugin SDK API taban çizgisi.
  `pnpm release:check`, bu korumaları kontrol modunda yeniden çalıştırır ve paket sürüm kontrollerini çalıştırmadan
  önce bulduğu tüm üretilmiş sapma hatalarını tek geçişte raporlar.
- Sürüm onayından önce manuel `Full Release Validation` iş akışını çalıştırarak tüm ön sürüm test kutularını
  tek giriş noktasından başlatın. Bir dal, etiket veya tam commit SHA kabul eder; manuel `CI` başlatır ve
  kurulum smoke, paket kabulü, çapraz işletim sistemi paket kontrolleri, QA Lab paritesi, Matrix ve Telegram
  hatları için `OpenClaw Release Checks` başlatır. Kararlı/varsayılan çalıştırmalar, kapsamlı canlı/E2E ve
  Docker sürüm yolu soak kontrollerini `run_release_soak=true` arkasında tutar; `release_profile=full`
  soak işlemini zorunlu kılar. `release_profile=full` ve `rerun_group=all` ile, sürüm kontrollerinden gelen
  `release-package-under-test` artefaktına karşı paket Telegram E2E de çalıştırır. Bir beta yayımladıktan sonra,
  gönderilmiş npm paketini sürüm kontrolleri, Package Acceptance ve paket Telegram E2E genelinde sürüm tarball’ını
  yeniden oluşturmadan kullanmak için `release_package_spec` sağlayın. Telegram’ın sürüm doğrulamasının geri kalanından
  farklı bir yayımlanmış paket kullanması gerektiğinde yalnızca `npm_telegram_package_spec` sağlayın.
  Package Acceptance’ın sürüm paketi belirtiminden farklı bir yayımlanmış paket kullanması gerektiğinde
  `package_acceptance_package_spec` sağlayın. Özel kanıt raporunun, doğrulamanın Telegram E2E’yi zorlamadan
  yayımlanmış bir npm paketiyle eşleştiğini kanıtlaması gerektiğinde `evidence_package_spec` sağlayın.
  Örnek:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Sürüm çalışması devam ederken bir paket adayı için yan kanal kanıtı istediğinizde manuel `Package Acceptance`
  iş akışını çalıştırın. `openclaw@beta`, `openclaw@latest` veya tam bir sürüm için `source=npm`; mevcut
  `workflow_ref` koşumuyla güvenilir bir `package_ref` dalını/etiketini/SHA’sını paketlemek için `source=ref`;
  gerekli SHA-256 değerine sahip bir HTTPS tarball için `source=url`; ya da başka bir GitHub Actions çalıştırması
  tarafından yüklenen bir tarball için `source=artifact` kullanın. İş akışı adayı `package-under-test` olarak çözer,
  Docker E2E sürüm zamanlayıcısını bu tarball’a karşı yeniden kullanır ve aynı tarball’a karşı
  `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` ile Telegram QA çalıştırabilir. Seçilen Docker
  hatları `published-upgrade-survivor` içerdiğinde, paket artefaktı adaydır ve
  `published_upgrade_survivor_baseline` yayımlanmış taban çizgisini seçer. `update-restart-auth`, aday paketi hem
  kurulu CLI hem de package-under-test olarak kullanır; böylece aday güncelleme komutunun yönetilen yeniden başlatma
  yolunu çalıştırır.
  Örnek: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Yaygın profiller:
  - `smoke`: kurulum/kanal/ajan, Gateway ağı ve yapılandırma yeniden yükleme hatları
  - `package`: OpenWebUI veya canlı ClawHub olmadan artefakt yerel paket/güncelleme/yeniden başlatma/Plugin hatları
  - `product`: paket profiline ek olarak MCP kanalları, cron/alt ajan temizliği,
    OpenAI web araması ve OpenWebUI
  - `full`: OpenWebUI ile Docker sürüm yolu parçaları
  - `custom`: odaklı yeniden çalıştırma için tam `docker_lanes` seçimi
- Sürüm adayı için yalnızca tam normal CI kapsamına ihtiyacınız olduğunda manuel `CI` iş akışını doğrudan çalıştırın.
  Manuel CI başlatmaları değişiklik kapsamını atlar ve Linux Node shard’larını, paketlenen-Plugin shard’larını,
  kanal sözleşmelerini, Node 22 uyumluluğunu, `check`, `check-additional`, build smoke, doküman kontrollerini,
  Python Skills, Windows, macOS, Android ve Control UI i18n hatlarını zorunlu kılar.
  Örnek: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Sürüm telemetrisini doğrularken `pnpm qa:otel:smoke` çalıştırın. Bu komut, QA-lab’i yerel bir OTLP/HTTP
  alıcısı üzerinden çalıştırır ve dışa aktarılan trace span adlarını, sınırlı öznitelikleri ve içerik/tanımlayıcı
  redaksiyonunu Opik, Langfuse veya başka bir harici toplayıcı gerektirmeden doğrular.
- Her etiketli sürümden önce `pnpm release:check` çalıştırın
- Etiket mevcut olduktan sonra değişiklik yapan yayımlama dizisi için `OpenClaw Release Publish` çalıştırın.
  Bunu `release/YYYY.M.D` üzerinden (veya main’den erişilebilen bir etiketi yayımlarken `main` üzerinden) başlatın,
  sürüm etiketini ve başarılı OpenClaw npm `preflight_run_id` değerini iletin ve odaklı bir onarımı bilinçli olarak
  çalıştırmıyorsanız varsayılan Plugin yayımlama kapsamını `all-publishable` olarak tutun. İş akışı Plugin npm
  yayımlamayı, Plugin ClawHub yayımlamayı ve OpenClaw npm yayımlamayı sıralı hale getirir; böylece çekirdek paket,
  dışsallaştırılmış Plugin’lerinden önce yayımlanmaz.
- Sürüm kontrolleri artık ayrı bir manuel iş akışında çalışır:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`, sürüm onayından önce QA Lab mock parite hattını, hızlı canlı Matrix profilini ve
  Telegram QA hattını da çalıştırır. Canlı hatlar `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI
  kimlik bilgisi kiralamalarını kullanır. Tam Matrix aktarımı, medya ve E2EE envanterini paralel istediğinizde,
  manuel `QA-Lab - All Lanes` iş akışını `matrix_profile=all` ve `matrix_shards=true` ile çalıştırın.
- Çapraz işletim sistemi kurulum ve yükseltme çalışma zamanı doğrulaması, herkese açık `OpenClaw Release Checks`
  ve `Full Release Validation` kapsamındadır; bunlar yeniden kullanılabilir iş akışı olan
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` dosyasını doğrudan çağırır
- Bu ayrım bilinçlidir: gerçek npm sürüm yolunu kısa, deterministik ve artefakt odaklı tutarken, daha yavaş canlı
  kontroller kendi hattında kalır; böylece yayımlamayı duraksatmaz veya engellemez
- Gizli taşıyan sürüm kontrolleri, iş akışı mantığı ve sırlar kontrollü kalsın diye `Full Release
Validation` üzerinden ya da `main`/sürüm iş akışı ref’inden başlatılmalıdır
- `OpenClaw Release Checks`, çözümlenen commit bir OpenClaw dalından veya sürüm etiketinden erişilebilir olduğu sürece
  bir dal, etiket veya tam commit SHA kabul eder
- `OpenClaw NPM Release` yalnızca doğrulama ön kontrolü, itilmiş bir etiket gerektirmeden mevcut tam 40 karakterlik
  iş akışı dalı commit SHA’sını da kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek yayımlamaya yükseltilemez
- SHA modunda iş akışı, yalnızca paket metadatası kontrolü için `v<package.json version>` üretir; gerçek yayımlama
  yine de gerçek bir sürüm etiketi gerektirir
- Her iki iş akışı da gerçek yayımlama ve yükseltme yolunu GitHub barındırmalı runner’larda tutarken, değişiklik yapmayan
  doğrulama yolu daha büyük Blacksmith Linux runner’larını kullanabilir
- Bu iş akışı,
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  komutunu hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` iş akışı sırlarını kullanarak çalıştırır
- npm sürüm ön kontrolü artık ayrı sürüm kontrolleri hattını beklemez
- Onaydan önce
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  komutunu (veya eşleşen beta/düzeltme etiketini) çalıştırın
- npm yayımlamasından sonra, yayımlanmış registry kurulum yolunu yeni bir geçici prefix içinde doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  komutunu (veya eşleşen beta/düzeltme sürümünü) çalıştırın
- Bir beta yayımlamasından sonra,
  `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  komutunu çalıştırarak paylaşılan kiralık Telegram kimlik bilgisi havuzunu kullanıp yayımlanmış npm paketine karşı
  kurulu paket onboarding’i, Telegram kurulumunu ve gerçek Telegram E2E’yi doğrulayın. Yerel bakımcı tek seferlik
  çalıştırmaları Convex değişkenlerini atlayabilir ve üç `OPENCLAW_QA_TELEGRAM_*` ortam kimlik bilgisini doğrudan
  iletebilir.
- Bir bakımcı makinesinden tam yayımlama sonrası beta smoke çalıştırmak için `pnpm release:beta-smoke -- --beta betaN` kullanın. Yardımcı, Parallels npm güncelleme/yeni hedef doğrulamasını çalıştırır, `NPM Telegram Beta E2E` başlatır, tam iş akışı çalıştırmasını yoklar, artefaktı indirir ve Telegram raporunu yazdırır.
- Bakımcılar aynı yayımlama sonrası kontrolü GitHub Actions üzerinden manuel `NPM Telegram Beta E2E` iş akışıyla
  çalıştırabilir. Bu kasıtlı olarak yalnızca manueldir ve her merge’de çalışmaz.
- Bakımcı sürüm otomasyonu artık önce-ön-kontrol-sonra-yükseltme kullanır:
  - gerçek npm yayımlaması başarılı bir npm `preflight_run_id` geçmelidir
  - gerçek npm yayımlaması, başarılı ön kontrol çalıştırmasıyla aynı `main` veya
    `release/YYYY.M.D` dalından başlatılmalıdır
  - kararlı npm sürümleri varsayılan olarak `beta` kullanır
  - kararlı npm yayımlaması, iş akışı girdisiyle açıkça `latest` hedefleyebilir
  - token tabanlı npm dist-tag değişikliği artık güvenlik nedeniyle
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    içindedir; çünkü `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirirken herkese açık repo yalnızca OIDC yayımlamayı tutar
  - herkese açık `macOS Release` yalnızca doğrulamadır; bir etiket yalnızca sürüm dalında yaşıyorsa ama iş akışı
    `main` üzerinden başlatılıyorsa `public_release_branch=release/YYYY.M.D` ayarlayın
  - gerçek özel mac yayımlaması başarılı özel mac `preflight_run_id` ve `validate_run_id` geçmelidir
  - gerçek yayımlama yolları, artefaktları yeniden oluşturmak yerine hazırlanmış artefaktları yükseltir
- `YYYY.M.D-N` gibi kararlı düzeltme sürümleri için yayımlama sonrası doğrulayıcı aynı geçici-prefix yükseltme yolunu
  `YYYY.M.D` sürümünden `YYYY.M.D-N` sürümüne de kontrol eder; böylece sürüm düzeltmeleri, eski global kurulumları
  temel kararlı payload’da sessizce bırakamaz
- npm sürüm ön kontrolü, tarball hem `dist/control-ui/index.html` hem de boş olmayan
  `dist/control-ui/assets/` payload’u içermedikçe kapalı başarısız olur; böylece tekrar boş bir tarayıcı panosu
  göndermeyiz
- Yayımlama sonrası doğrulama, yayımlanmış Plugin giriş noktalarının ve paket metadatasının kurulu registry yerleşiminde
  mevcut olduğunu da kontrol eder. Eksik Plugin çalışma zamanı payload’ları gönderen bir sürüm, postpublish doğrulayıcıda
  başarısız olur ve `latest` sürümüne yükseltilemez.
- `pnpm test:install:smoke`, aday güncelleme tarball’ında npm pack `unpackedSize` bütçesini de uygular; böylece
  kurulum e2e, kazara paket şişmesini sürüm yayımlama yolundan önce yakalar
- Sürüm çalışması CI planlamasına, extension zamanlama manifestlerine veya extension test matrislerine dokunduysa,
  onaydan önce `.github/workflows/plugin-prerelease.yml` içindeki planlayıcı sahipli
  `plugin-prerelease-extension-shard` matris çıktılarını yeniden üretin ve gözden geçirin; böylece sürüm notları
  eski bir CI düzenini açıklamaz
- Kararlı macOS sürüm hazırlığı, güncelleyici yüzeylerini de içerir:
  - GitHub sürümü, paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` dosyalarıyla sonuçlanmalıdır
  - yayımlamadan sonra `main` üzerindeki `appcast.xml` yeni kararlı zip’e işaret etmelidir; özel macOS yayımlama
    iş akışı bunu otomatik olarak commit eder veya doğrudan push engellenirse bir appcast PR açar
  - paketlenmiş uygulama, debug olmayan bir bundle id, boş olmayan bir Sparkle feed URL’si ve o sürüm için kanonik
    Sparkle build tabanının üzerinde veya ona eşit bir `CFBundleVersion` tutmalıdır

## Sürüm test kutuları

`Full Release Validation`, operatörlerin tüm ön sürüm testlerini tek giriş noktasından başlatma yoludur.
Hızlı hareket eden bir dalda sabitlenmiş commit kanıtı için yardımcıyı kullanın; böylece her alt iş akışı hedef
SHA’ya sabitlenmiş geçici bir daldan çalışır:

```bash
pnpm ci:full-release --sha <full-sha>
```

Yardımcı `release-ci/<sha>-...` dalını gönderir, o daldan `ref=<sha>` ile `Full Release Validation` başlatır, her alt iş akışının `headSha` değerinin hedefle eşleştiğini doğrular, ardından geçici dalı siler. Bu, yanlışlıkla daha yeni bir `main` alt çalıştırmasını kanıtlamayı önler.

Yayın dalı veya etiket doğrulaması için, güvenilir `main` iş akışı referansından çalıştırın ve yayın dalını ya da etiketini `ref` olarak geçirin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

İş akışı hedef referansı çözer, `target_ref=<release-ref>` ile manuel `CI` başlatır, `OpenClaw Release Checks` başlatır, paket odaklı denetimler için üst `release-package-under-test` artefaktını hazırlar ve `release_profile=full` olduğunda `rerun_group=all` ile ya da `release_package_spec` veya `npm_telegram_package_spec` ayarlandığında bağımsız paket Telegram E2E başlatır. Ardından `OpenClaw Release Checks`; kurulum smoke testleri, çapraz işletim sistemi yayın denetimleri, soak etkinleştirildiğinde live/E2E Docker yayın yolu kapsamı, Telegram paket QA ile Package Acceptance, QA Lab eşliği, live Matrix ve live Telegram için dallanır. Tam bir çalıştırma yalnızca `Full Release Validation` özetinde `normal_ci` ve `release_checks` başarılı göründüğünde kabul edilebilir. Full/all modunda `npm_telegram` alt çalıştırması da başarılı olmalıdır; full/all dışında, yayımlanmış bir `release_package_spec` veya `npm_telegram_package_spec` sağlanmadıkça atlanır. Son doğrulayıcı özeti her alt çalıştırma için en yavaş iş tablolarını içerir; böylece yayın yöneticisi günlükleri indirmeden mevcut kritik yolu görebilir. Tam aşama matrisi, kesin iş akışı iş adları, stable ile full profil farkları, artefaktlar ve odaklı yeniden çalıştırma tutamaçları için [Tam yayın doğrulaması](/tr/reference/full-release-validation) bölümüne bakın. Alt iş akışları, hedef `ref` daha eski bir yayın dalını veya etiketi işaret etse bile `Full Release Validation` çalıştıran güvenilir referanstan, normalde `--ref main` üzerinden başlatılır. Ayrı bir Full Release Validation iş akışı referansı girdisi yoktur; güvenilir koşum takımını iş akışı çalıştırma referansını seçerek seçin. Hareketli `main` üzerinde kesin commit kanıtı için `--ref main -f ref=<sha>` kullanmayın; ham commit SHA’ları iş akışı başlatma referansı olamaz, bu yüzden sabitlenmiş geçici dalı oluşturmak için `pnpm ci:full-release --sha <sha>` kullanın.

Live/sağlayıcı kapsamını seçmek için `release_profile` kullanın:

- `minimum`: en hızlı yayın açısından kritik OpenAI/çekirdek live ve Docker yolu
- `stable`: yayın onayı için minimuma ek olarak stable sağlayıcı/backend kapsamı
- `full`: stable’a ek olarak geniş danışma sağlayıcı/medya kapsamı

Yayın engelleyici hatlar yeşil olduğunda ve terfi öncesinde kapsamlı live/E2E, Docker yayın yolu ve sınırlı yayımlanmış yükseltme dayanıklılığı taraması istediğinizde `stable` ile `run_release_soak=true` kullanın. Bu tarama, son dört stable paketin yanı sıra sabitlenmiş `2026.4.23` ve `2026.5.2` temel sürümlerini ve daha eski `2026.4.15` kapsamını içerir; yinelenen temel sürümler kaldırılır ve her temel sürüm kendi Docker runner işine parçalanır. `full`, `run_release_soak=true` anlamına gelir.

`OpenClaw Release Checks`, hedef referansı bir kez `release-package-under-test` olarak çözmek için güvenilir iş akışı referansını kullanır ve soak çalıştığında bu artefaktı çapraz işletim sistemi, Package Acceptance ve yayın yolu Docker denetimlerinde yeniden kullanır. Bu, tüm paket odaklı kutuları aynı baytlar üzerinde tutar ve yinelenen paket derlemelerini önler. Bir beta zaten npm üzerinde olduğunda `release_package_spec=openclaw@YYYY.M.D-beta.N` ayarlayın; böylece yayın denetimleri yayımlanan paketi bir kez indirir, derleme kaynak SHA’sını `dist/build-info.json` içinden çıkarır ve bu artefaktı çapraz işletim sistemi, Package Acceptance, yayın yolu Docker ve paket Telegram hatlarında yeniden kullanır. Çapraz işletim sistemi OpenAI kurulum smoke testi, repo/org değişkeni ayarlandığında `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır; aksi halde `openai/gpt-5.4` kullanır, çünkü bu hat en yavaş varsayılan modeli kıyaslamak yerine paket kurulumu, onboarding, gateway başlatma ve bir live ajan turunu kanıtlar. Daha geniş live sağlayıcı matrisi, modele özgü kapsamın yeri olarak kalır.

Yayın aşamasına bağlı olarak bu varyantları kullanın:

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

Odaklı bir düzeltmeden sonraki ilk yeniden çalıştırma olarak tam şemsiyeyi kullanmayın. Bir kutu başarısız olursa, sonraki kanıt için başarısız alt iş akışını, işi, Docker hattını, paket profilini, model sağlayıcısını veya QA hattını kullanın. Tam şemsiyeyi yalnızca düzeltme paylaşılan yayın orkestrasyonunu değiştirdiyse ya da önceki tüm kutu kanıtını bayat hale getirdiyse yeniden çalıştırın. Şemsiyenin son doğrulayıcısı kaydedilmiş alt iş akışı çalıştırma kimliklerini tekrar denetler; bu yüzden bir alt iş akışı başarıyla yeniden çalıştırıldıktan sonra yalnızca başarısız `Verify full validation` üst işini yeniden çalıştırın.

Sınırlı kurtarma için şemsiyeye `rerun_group` geçirin. `all` gerçek yayın adayı çalıştırmasıdır, `ci` yalnızca normal CI alt çalıştırmasını çalıştırır, `plugin-prerelease` yalnızca yayına özel Plugin alt çalıştırmasını çalıştırır, `release-checks` her yayın kutusunu çalıştırır ve daha dar yayın grupları `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ve `npm-telegram` şeklindedir. Odaklı `npm-telegram` yeniden çalıştırmaları `release_package_spec` veya `npm_telegram_package_spec` gerektirir; `release_profile=full` ile full/all çalıştırmaları release-checks paket artefaktını kullanır. Odaklı çapraz işletim sistemi yeniden çalıştırmaları `cross_os_suite_filter=windows/packaged-upgrade` veya başka bir işletim sistemi/suite filtresi ekleyebilir. QA release-check hataları danışma niteliğindedir; yalnızca QA hatası yayın doğrulamasını engellemez.

### Vitest

Vitest kutusu manuel `CI` alt iş akışıdır. Manuel CI, değişiklik kapsamını bilinçli olarak atlar ve yayın adayı için normal test grafiğini zorlar: Linux Node parçaları, paketli Plugin parçaları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, derleme smoke testi, dokümantasyon denetimleri, Python skills, Windows, macOS, Android ve Control UI i18n.

Bu kutuyu “kaynak ağacı tam normal test paketinden geçti mi?” sorusunu yanıtlamak için kullanın. Bu, yayın yolu ürün doğrulamasıyla aynı şey değildir. Saklanacak kanıtlar:

- Başlatılan `CI` çalıştırma URL’sini gösteren `Full Release Validation` özeti
- Kesin hedef SHA üzerinde yeşil `CI` çalıştırması
- Regresyonları incelerken CI işlerinden başarısız veya yavaş parça adları
- Bir çalıştırma performans analizi gerektirdiğinde `.artifacts/vitest-shard-timings.json` gibi Vitest zamanlama artefaktları

Yayın deterministik normal CI gerektiriyor ancak Docker, QA Lab, live, çapraz işletim sistemi veya paket kutularını gerektirmiyorsa manuel CI’yi doğrudan çalıştırın:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker kutusu, `openclaw-live-and-e2e-checks-reusable.yml` üzerinden `OpenClaw Release Checks` içinde ve yayın modu `install-smoke` iş akışında bulunur. Yayın adayını yalnızca kaynak düzeyi testler yerine paketlenmiş Docker ortamları üzerinden doğrular.

Yayın Docker kapsamı şunları içerir:

- yavaş Bun global kurulum smoke testi etkinleştirilmiş tam kurulum smoke testi
- hedef SHA’ya göre kök Dockerfile smoke imajı hazırlama/yeniden kullanım; QR, root/gateway ve installer/Bun smoke işleri ayrı install-smoke parçaları olarak çalışır
- depo E2E hatları
- yayın yolu Docker parçaları: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g` ve `plugins-runtime-install-h`
- istendiğinde `plugins-runtime-services` parçası içinde OpenWebUI kapsamı
- bölünmüş paketli Plugin kurulum/kaldırma hatları: `bundled-plugin-install-uninstall-0` ile `bundled-plugin-install-uninstall-23` arası
- yayın denetimleri live suite’leri içerdiğinde live/E2E sağlayıcı suite’leri ve Docker live model kapsamı

Yeniden çalıştırmadan önce Docker artefaktlarını kullanın. Yayın yolu zamanlayıcısı; hat günlükleri, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı planı JSON’u ve yeniden çalıştırma komutlarıyla birlikte `.artifacts/docker-tests/` yükler. Odaklı kurtarma için tüm yayın parçalarını yeniden çalıştırmak yerine yeniden kullanılabilir live/E2E iş akışında `docker_lanes=<lane[,lane]>` kullanın. Üretilen yeniden çalıştırma komutları, uygun olduğunda önceki `package_artifact_run_id` ve hazırlanmış Docker imajı girdilerini içerir; böylece başarısız bir hat aynı tarball ve GHCR imajlarını yeniden kullanabilir.

### QA Lab

QA Lab kutusu da `OpenClaw Release Checks` parçasıdır. Vitest ve Docker paket mekaniklerinden ayrı olarak ajan davranışı ve kanal düzeyi yayın kapısıdır.

Yayın QA Lab kapsamı şunları içerir:

- ajan eşlik paketi kullanılarak OpenAI aday hattını Opus 4.6 temel sürümüyle karşılaştıran mock eşlik hattı
- `qa-live-shared` ortamını kullanan hızlı live Matrix QA profili
- Convex CI kimlik bilgisi kiralamalarını kullanan live Telegram QA hattı
- yayın telemetrisi açık yerel kanıt gerektirdiğinde `pnpm qa:otel:smoke`

Bu kutuyu “yayın QA senaryolarında ve live kanal akışlarında doğru davranıyor mu?” sorusunu yanıtlamak için kullanın. Yayını onaylarken eşlik, Matrix ve Telegram hatları için artefakt URL’lerini saklayın. Tam Matrix kapsamı, varsayılan yayın açısından kritik hat yerine manuel parçalı QA-Lab çalıştırması olarak kullanılmaya devam eder.

### Paket

Paket kutusu kurulabilir ürün kapısıdır. `Package Acceptance` ve `scripts/resolve-openclaw-package-candidate.mjs` çözümleyicisi tarafından desteklenir. Çözümleyici, bir adayı Docker E2E tarafından tüketilen `package-under-test` tarball’ına normalize eder, paket envanterini doğrular, paket sürümünü ve SHA-256 değerini kaydeder ve iş akışı koşum referansını paket kaynak referansından ayrı tutar.

Desteklenen aday kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya kesin bir OpenClaw yayın sürümü
- `source=ref`: seçilen `workflow_ref` koşum takımıyla güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA’sını paketle
- `source=url`: gerekli `package_sha256` ile bir HTTPS `.tgz` indir
- `source=artifact`: başka bir GitHub Actions çalıştırması tarafından yüklenen bir `.tgz` dosyasını yeniden kullan

`OpenClaw Release Checks`, hazırlanmış yayın paketi artefaktı, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`, `telegram_mode=mock-openai` ile `source=artifact` kullanarak Package Acceptance çalıştırır. Package Acceptance; migration, update, yapılandırılmış kimlik doğrulamayla update restart, live ClawHub skill kurulumu, bayat Plugin bağımlılığı temizliği, çevrimdışı Plugin fixture’ları, Plugin güncellemesi ve Telegram paket QA’yı aynı çözülmüş tarball üzerinde tutar. Engelleyici yayın denetimleri varsayılan en son yayımlanmış paket temel sürümünü kullanır; `run_release_soak=true` veya `release_profile=full`, `2026.4.23` sürümünden `latest` sürümüne kadar npm’de yayımlanmış her stable temel sürüme ve bildirilen sorun fixture’larına genişler. Zaten yayımlanmış bir aday için `source=npm` ile Package Acceptance kullanın veya yayın öncesinde SHA destekli yerel npm tarball için `source=ref`/`source=artifact` kullanın. Daha önce Parallels gerektiren paket/güncelleme kapsamının çoğu için GitHub yerel yerine geçer. Çapraz işletim sistemi yayın denetimleri işletim sistemine özgü onboarding, installer ve platform davranışı için hâlâ önemlidir, ancak paket/güncelleme ürün doğrulamasında Package Acceptance tercih edilmelidir.

Güncelleme ve Plugin doğrulaması için kanonik kontrol listesi
[Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) sayfasıdır. Bir
Plugin kurulumu/güncellemesi, doctor temizliği veya yayımlanmış paket geçiş
değişikliğini hangi yerel, Docker, Package Acceptance ya da release-check hattının
kanıtladığına karar verirken bunu kullanın. Her kararlı `2026.4.23+` paketinden
kapsamlı yayımlanmış güncelleme geçişi, Full Release CI'ın parçası olmayan ayrı
bir manuel `Update Migration` iş akışıdır.

Eski package-acceptance esnekliği bilinçli olarak zamanla sınırlandırılmıştır. `2026.4.25`
dahil paketler, npm'e zaten yayımlanmış metadata boşlukları için uyumluluk yolunu
kullanabilir: tarball'da eksik olan özel QA envanter girdileri, eksik
`gateway install --wrapper`, tarball türevi git fixture'ında eksik patch dosyaları,
eksik kalıcı `update.channel`, eski Plugin install-record konumları, eksik
marketplace install-record kalıcılığı ve `plugins update` sırasında config metadata
geçişi. Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel build metadata
damga dosyaları için uyarı verebilir. Daha sonraki paketler modern paket
sözleşmelerini karşılamalıdır; aynı boşluklar release doğrulamasını başarısız yapar.

Release sorusu gerçekten kurulabilir bir paket hakkındaysa daha geniş Package
Acceptance profillerini kullanın:

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

- `smoke`: hızlı paket kurulum/kanal/agent, Gateway ağı ve config yeniden
  yükleme hatları
- `package`: kurulum/güncelleme/yeniden başlatma/Plugin paket sözleşmeleri ve
  canlı ClawHub skill kurulum kanıtı; release-check varsayılanı budur
- `product`: `package` artı MCP kanalları, cron/subagent temizliği, OpenAI web
  araması ve OpenWebUI
- `full`: OpenWebUI ile Docker release-path parçaları
- `custom`: odaklı yeniden çalıştırmalar için tam `docker_lanes` listesi

Paket adayı Telegram kanıtı için Package Acceptance üzerinde
`telegram_mode=mock-openai` veya `telegram_mode=live-frontier` etkinleştirin. İş akışı
çözümlenen `package-under-test` tarball'unu Telegram hattına aktarır; bağımsız
Telegram iş akışı, yayım sonrası kontroller için hâlâ yayımlanmış bir npm spec kabul eder.

## Release yayımlama otomasyonu

`OpenClaw Release Publish` normal mutasyon yapan yayımlama giriş noktasıdır.
Güvenilir yayımlayıcı iş akışlarını release'in ihtiyaç duyduğu sırada orkestre eder:

1. Release tag'ini check out edin ve commit SHA'sını çözümleyin.
2. Tag'in `main` veya `release/*` üzerinden erişilebilir olduğunu doğrulayın.
3. `pnpm plugins:sync:check` çalıştırın.
4. `publish_scope=all-publishable` ve `ref=<release-sha>` ile `Plugin NPM Release` dispatch edin.
5. Aynı scope ve SHA ile `Plugin ClawHub Release` dispatch edin.
6. Release tag'i, npm dist-tag'i ve kaydedilmiş `preflight_run_id` ile
   `OpenClaw NPM Release` dispatch edin.

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

Doğrudan `latest` için kararlı yükseltme açıkça belirtilir:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Daha düşük seviyeli `Plugin NPM Release` ve `Plugin ClawHub Release` iş akışlarını
yalnızca odaklı onarım veya yeniden yayımlama işi için kullanın. Seçilmiş bir
Plugin onarımı için `OpenClaw Release Publish`e `plugin_publish_scope=selected`
ve `plugins=@openclaw/name` aktarın ya da OpenClaw paketinin yayımlanmaması
gerektiğinde alt iş akışını doğrudan dispatch edin.

## NPM iş akışı girdileri

`OpenClaw NPM Release` şu operatör denetimli girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya `v2026.4.2-beta.1` gibi gerekli release
  tag'i; `preflight_only=true` olduğunda yalnızca doğrulama amaçlı preflight için
  mevcut tam 40 karakterlik workflow-branch commit SHA'sı da olabilir
- `preflight_only`: yalnızca doğrulama/build/paket için `true`, gerçek yayımlama yolu
  için `false`
- `preflight_run_id`: iş akışının başarılı preflight çalıştırmasından hazırlanan
  tarball'u yeniden kullanması için gerçek yayımlama yolunda gereklidir
- `npm_dist_tag`: yayımlama yolu için npm hedef tag'i; varsayılanı `beta`

`OpenClaw Release Publish` şu operatör denetimli girdileri kabul eder:

- `tag`: gerekli release tag'i; zaten var olmalıdır
- `preflight_run_id`: başarılı `OpenClaw NPM Release` preflight çalıştırma id'si;
  `publish_openclaw_npm=true` olduğunda gereklidir
- `npm_dist_tag`: OpenClaw paketi için npm hedef tag'i
- `plugin_publish_scope`: varsayılanı `all-publishable`; yalnızca odaklı onarım
  işi için `selected` kullanın
- `plugins`: `plugin_publish_scope=selected` olduğunda virgülle ayrılmış
  `@openclaw/*` paket adları
- `publish_openclaw_npm`: varsayılanı `true`; yalnızca iş akışını Plugin'e özel
  onarım orkestratörü olarak kullanırken `false` ayarlayın

`OpenClaw Release Checks` şu operatör denetimli girdileri kabul eder:

- `ref`: doğrulanacak branch, tag veya tam commit SHA. Secret taşıyan kontroller,
  çözümlenen commit'in bir OpenClaw branch'i veya release tag'i üzerinden
  erişilebilir olmasını gerektirir.
- `run_release_soak`: kararlı/varsayılan release kontrollerinde kapsamlı canlı/E2E,
  Docker release-path ve all-since upgrade-survivor soak'a dahil olun. Bu,
  `release_profile=full` ile zorunlu kılınır.

Kurallar:

- Kararlı ve düzeltme tag'leri `beta` ya da `latest` için yayımlanabilir
- Beta prerelease tag'leri yalnızca `beta` için yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca
  `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` ve `Full Release Validation` her zaman yalnızca
  doğrulama amaçlıdır
- Gerçek yayımlama yolu, preflight sırasında kullanılan aynı `npm_dist_tag`'i
  kullanmalıdır; iş akışı yayımlamadan önce metadata'nın bunu sürdürdüğünü doğrular

## Kararlı npm release sırası

Kararlı bir npm release'i çıkarırken:

1. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın
   - Tag mevcut olmadan önce, preflight iş akışının yalnızca doğrulama amaçlı
     dry run'ı için mevcut tam workflow-branch commit SHA'sını kullanabilirsiniz
2. Normal beta-first akışı için `npm_dist_tag=beta` seçin veya yalnızca doğrudan
   kararlı yayımlamayı bilinçli olarak istediğinizde `latest` seçin
3. Tek bir manuel iş akışından normal CI artı canlı prompt cache, Docker, QA Lab,
   Matrix ve Telegram kapsamı istediğinizde release branch'i, release tag'i veya
   tam commit SHA üzerinde `Full Release Validation` çalıştırın
4. Bilinçli olarak yalnızca deterministik normal test grafiğine ihtiyacınız varsa
   release ref üzerinde manuel `CI` iş akışını çalıştırın
5. Başarılı `preflight_run_id`'yi kaydedin
6. Aynı `tag`, aynı `npm_dist_tag` ve kaydedilmiş `preflight_run_id` ile
   `OpenClaw Release Publish` çalıştırın; OpenClaw npm paketini yükseltmeden önce
   dışsallaştırılmış Plugin'leri npm'e ve ClawHub'a yayımlar
7. Release `beta` üzerinde yayımlandıysa, bu kararlı sürümü `beta`den `latest`e
   yükseltmek için özel
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   iş akışını kullanın
8. Release bilinçli olarak doğrudan `latest`e yayımlandıysa ve `beta` de hemen aynı
   kararlı build'i izlemeliyse, her iki dist-tag'i kararlı sürüme yönlendirmek için
   aynı özel iş akışını kullanın ya da zamanlanmış kendi kendini iyileştiren
   senkronizasyonunun `beta`yi daha sonra taşımasına izin verin

Dist-tag mutasyonu güvenlik nedeniyle özel repoda bulunur; çünkü hâlâ
`NPM_TOKEN` gerektirir, public repo ise OIDC-only yayımlamayı korur.

Bu, doğrudan yayımlama yolunu ve beta-first yükseltme yolunu hem belgelenmiş hem de
operatöre görünür tutar.

Bir maintainer yerel npm kimlik doğrulamasına geri dönmek zorundaysa, tüm
1Password CLI (`op`) komutlarını yalnızca ayrılmış bir tmux oturumu içinde
çalıştırın. `op` komutunu ana agent shell'den doğrudan çağırmayın; tmux içinde
tutmak prompt'ları, uyarıları ve OTP işlemlerini gözlemlenebilir kılar ve tekrarlanan
host uyarılarını önler.

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
içindeki özel release dokümanlarını kullanır.

## İlgili

- [Release kanalları](/tr/install/development-channels)
