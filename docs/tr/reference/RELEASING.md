---
read_when:
    - Herkese açık sürüm kanalı tanımları aranıyor
    - Sürüm doğrulamasını veya paket kabulünü çalıştırma
    - Sürüm adlandırması ve yayın ritmi aranıyor
summary: Sürüm hatları, operatör kontrol listesi, doğrulama kutuları, sürüm adlandırması ve yayın ritmi
title: Sürüm politikası
x-i18n:
    generated_at: "2026-05-07T15:08:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6843c7bd0d0a4f3815661f7d392ae7e60b0485a03f1cc53a4c3f13ad3e9a5f8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw'ın üç herkese açık sürüm hattı vardır:

- kararlı: varsayılan olarak npm `beta` üzerine, açıkça istendiğinde ise npm `latest` üzerine yayımlanan etiketli sürümler
- beta: npm `beta` üzerine yayımlanan ön sürüm etiketleri
- geliştirme: `main` dalının hareketli uç noktası

## Sürüm adlandırması

- Kararlı sürüm versiyonu: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Kararlı düzeltme sürümü versiyonu: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön sürüm versiyonu: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ay veya gün başına sıfır eklemeyin
- `latest`, şu anda öne çıkarılmış kararlı npm sürümü anlamına gelir
- `beta`, geçerli beta kurulum hedefi anlamına gelir
- Kararlı ve kararlı düzeltme sürümleri varsayılan olarak npm `beta` üzerine yayımlanır; sürüm operatörleri açıkça `latest` hedefleyebilir veya denetlenmiş bir beta derlemesini daha sonra öne çıkarabilir
- Her kararlı OpenClaw sürümü npm paketini ve macOS uygulamasını birlikte gönderir;
  beta sürümleri normalde önce npm/paket yolunu doğrular ve yayımlar; mac
  uygulamasını derleme/imzalama/noterleştirme ise açıkça istenmediği sürece kararlı sürüme ayrılır

## Sürüm ritmi

- Sürümler önce beta olarak ilerler
- Kararlı sürüm yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar sürümleri normalde güncel `main` dalından oluşturulan bir
  `release/YYYY.M.D` dalından çıkarır; böylece sürüm doğrulaması ve düzeltmeler
  `main` üzerindeki yeni geliştirmeyi engellemez
- Bir beta etiketi gönderilmiş veya yayımlanmışsa ve düzeltme gerekiyorsa, bakımcılar
  eski beta etiketini silmek veya yeniden oluşturmak yerine sonraki `-beta.N` etiketini çıkarır
- Ayrıntılı sürüm prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca bakımcılara özeldir

## Sürüm operatörü kontrol listesi

Bu kontrol listesi, sürüm akışının herkese açık yapısıdır. Özel kimlik bilgileri,
imzalama, noterleştirme, dist-tag kurtarma ve acil geri alma ayrıntıları
yalnızca bakımcılara özel sürüm çalışma kitabında kalır.

1. Güncel `main` ile başlayın: en son değişiklikleri çekin, hedef commit'in gönderildiğini
   doğrulayın ve mevcut `main` CI durumunun dal çıkarmak için yeterince yeşil olduğunu doğrulayın.
2. Gerçek commit geçmişinden `/changelog` ile en üst `CHANGELOG.md` bölümünü yeniden yazın,
   girdileri kullanıcıya dönük tutun, bunu commit edin, gönderin ve dal oluşturmadan önce
   bir kez daha rebase/pull yapın.
3. Sürüm uyumluluk kayıtlarını
   `src/plugins/compat/registry.ts` ve
   `src/commands/doctor/shared/deprecation-compat.ts` içinde gözden geçirin. Süresi dolmuş
   uyumluluğu yalnızca yükseltme yolu kapsamda kalıyorsa kaldırın ya da neden
   bilinçli olarak taşındığını kaydedin.
4. Güncel `main` üzerinden `release/YYYY.M.D` oluşturun; normal sürüm çalışmasını
   doğrudan `main` üzerinde yapmayın.
5. Amaçlanan etiket için gerekli her sürüm konumunu artırın, ardından
   `pnpm release:prep` çalıştırın. Bu komut Plugin sürümlerini, Plugin envanterini, yapılandırma
   şemasını, paketlenmiş kanal yapılandırma meta verilerini, yapılandırma dokümanları temelini, Plugin SDK
   dışa aktarımlarını ve Plugin SDK API temelini doğru sırada yeniler. Etiketlemeden önce oluşan
   üretilmiş farkları commit edin. Ardından yerel belirleyici ön kontrolü çalıştırın:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` ve `pnpm release:check`.
6. `OpenClaw NPM Release` işini `preflight_only=true` ile çalıştırın. Etiket olmadan önce,
   yalnızca doğrulama amaçlı ön kontrol için 40 karakterlik tam sürüm dalı SHA'sına izin verilir.
   Başarılı `preflight_run_id` değerini kaydedin.
7. Sürüm dalı, etiketi veya tam commit SHA'sı için `Full Release Validation` ile tüm
   ön sürüm testlerini başlatın. Bu, dört büyük sürüm test kutusu için tek manuel
   giriş noktasıdır: Vitest, Docker, QA Lab ve Package.
8. Doğrulama başarısız olursa, sürüm dalında düzeltin ve düzeltmeyi kanıtlayan en küçük başarısız
   dosyayı, hattı, iş akışı işini, paket profilini, sağlayıcıyı veya model izin listesini yeniden çalıştırın.
   Tam üst şemsiyeyi yalnızca değişen yüzey önceki kanıtları geçersiz kılıyorsa yeniden çalıştırın.
9. Beta için `vYYYY.M.D-beta.N` etiketini oluşturun, ardından eşleşen `release/YYYY.M.D`
   dalından `OpenClaw Release Publish` çalıştırın. Bu, `pnpm plugins:sync:check` doğrular,
   yayımlanabilir tüm Plugin paketlerini npm'e ve aynı seti paralel olarak
   ClawHub'a gönderir, ardından Plugin npm yayımı başarılı olur olmaz hazırlanmış OpenClaw npm ön kontrol
   yapıtını eşleşen dist-tag ile öne çıkarır. OpenClaw npm yayımlanırken ClawHub yayımı
   hâlâ çalışıyor olabilir, ancak sürüm yayımlama iş akışı alt çalışma kimliklerini hemen yazdırır.
   Varsayılan olarak ClawHub'ı gönderdikten sonra beklemez; böylece OpenClaw npm erişilebilirliği
   daha yavaş ClawHub onayları veya kayıt çalışmaları tarafından engellenmez; ClawHub'ın iş akışı
   tamamlanmasını engellemesi gerektiğinde `wait_for_clawhub=true` ayarlayın. ClawHub yolu geçici CLI
   bağımlılık kurulum hatalarını yeniden dener, bir önizleme hücresi kararsız davransa bile önizlemeden geçen
   Plugin'leri yayımlar ve kısmi yayımların görünür ve yeniden denenebilir kalması için beklenen her Plugin
   sürümü için kayıt doğrulamasıyla biter. Yayımdan sonra,
   yayımlanan `openclaw@YYYY.M.D-beta.N` veya
   `openclaw@beta` paketine karşı yayım sonrası paket
   kabulünü çalıştırın. Gönderilmiş veya yayımlanmış bir ön sürüm düzeltme gerektirirse,
   sonraki eşleşen ön sürüm numarasını çıkarın; eski ön sürümü silmeyin veya yeniden yazmayın.
10. Kararlı sürüm için yalnızca denetlenmiş beta veya sürüm adayı gerekli doğrulama kanıtına sahip olduktan sonra
    devam edin. Kararlı npm yayımı da
    `preflight_run_id` aracılığıyla başarılı ön kontrol yapıtını yeniden kullanarak
    `OpenClaw Release Publish` üzerinden yapılır; kararlı macOS sürüm hazırlığı ayrıca
    paketlenmiş `.zip`, `.dmg`, `.dSYM.zip` ve güncellenmiş `appcast.xml` dosyalarının `main` üzerinde olmasını gerektirir.
11. Yayımdan sonra npm yayım sonrası doğrulayıcısını, yayım sonrası kanal kanıtı gerektiğinde isteğe bağlı bağımsız
    yayımlanmış-npm Telegram E2E'yi, gerektiğinde dist-tag öne çıkarmasını, eksiksiz eşleşen
    `CHANGELOG.md` bölümünden GitHub sürüm/ön sürüm notlarını ve sürüm duyurusu
    adımlarını çalıştırın.

## Sürüm ön kontrolü

- Daha hızlı yerel `pnpm check` geçidi dışında test TypeScript'inin kapsamda
  kalması için yayın ön denetiminden önce `pnpm check:test-types` çalıştırın
- Daha kapsamlı içe aktarma döngüsü ve mimari sınır kontrollerinin daha hızlı
  yerel geçit dışında yeşil olması için yayın ön denetiminden önce
  `pnpm check:architecture` çalıştırın
- Beklenen `dist/*` yayın yapıtlarının ve Control UI paketinin paket doğrulama
  adımı için var olması amacıyla `pnpm release:check` öncesinde
  `pnpm build && pnpm ui:build` çalıştırın
- Kök sürüm artışından sonra ve etiketlemeden önce `pnpm release:prep`
  çalıştırın. Sürüm/yapılandırma/API değişikliğinden sonra yaygın olarak sapan
  tüm deterministik yayın üreticilerini çalıştırır: Plugin sürümleri, Plugin
  envanteri, temel yapılandırma şeması, paketlenmiş kanal yapılandırma meta
  verileri, yapılandırma dokümanları temel çizgisi, Plugin SDK dışa aktarımları
  ve Plugin SDK API temel çizgisi. `pnpm release:check` bu korumaları kontrol
  modunda yeniden çalıştırır ve paket yayın kontrollerini çalıştırmadan önce
  bulduğu tüm üretilmiş sapma hatalarını tek geçişte raporlar.
- Yayın onayından önce manuel `Full Release Validation` iş akışını çalıştırarak
  tüm yayın öncesi test kutularını tek bir giriş noktasından başlatın. Bir dal,
  etiket veya tam commit SHA kabul eder, manuel `CI` başlatır ve kurulum smoke,
  paket kabulü, çapraz işletim sistemi paket kontrolleri, QA Lab paritesi,
  Matrix ve Telegram hatları için `OpenClaw Release Checks` başlatır.
  Kararlı/varsayılan çalıştırmalar, kapsamlı canlı/E2E ve Docker yayın yolu
  soak testini `run_release_soak=true` arkasında tutar; `release_profile=full`
  soak testini zorunlu kılar. `release_profile=full` ve `rerun_group=all` ile,
  yayın kontrollerinden gelen `release-package-under-test` yapıtına karşı paket
  Telegram E2E'yi de çalıştırır. Aynı Telegram E2E'nin yayımlanmış npm paketini
  de kanıtlaması gerektiğinde yayımlamadan sonra `npm_telegram_package_spec`
  sağlayın. Package Acceptance'ın paket/güncelleme matrisini SHA ile
  oluşturulmuş yapıt yerine gönderilmiş npm paketine karşı çalıştırması
  gerektiğinde yayımlamadan sonra `package_acceptance_package_spec` sağlayın.
  Özel kanıt raporunun, Telegram E2E'yi zorlamadan doğrulamanın yayımlanmış bir
  npm paketiyle eşleştiğini kanıtlaması gerektiğinde `evidence_package_spec`
  sağlayın.
  Örnek:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Yayın çalışması devam ederken bir paket adayı için yan kanal kanıtı
  istediğinizde manuel `Package Acceptance` iş akışını çalıştırın. `openclaw@beta`,
  `openclaw@latest` veya tam bir yayın sürümü için `source=npm`; mevcut
  `workflow_ref` düzeneğiyle güvenilir bir `package_ref` dalını/etiketini/SHA'sını
  paketlemek için `source=ref`; zorunlu SHA-256 içeren bir HTTPS tarball için
  `source=url`; ya da başka bir GitHub Actions çalıştırması tarafından yüklenmiş
  bir tarball için `source=artifact` kullanın. İş akışı adayı
  `package-under-test` olarak çözer, Docker E2E yayın zamanlayıcısını bu
  tarball'a karşı yeniden kullanır ve aynı tarball'a karşı
  `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` ile Telegram QA
  çalıştırabilir. Seçili Docker hatları `published-upgrade-survivor` içerdiğinde,
  paket yapıtı adaydır ve `published_upgrade_survivor_baseline` yayımlanmış temel
  çizgiyi seçer. `update-restart-auth`, aday paketi hem kurulu CLI hem de
  package-under-test olarak kullanır; böylece aday güncelleme komutunun yönetilen
  yeniden başlatma yolunu sınar.
  Örnek: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Yaygın profiller:
  - `smoke`: kurulum/kanal/ajan, Gateway ağı ve yapılandırma yeniden yükleme hatları
  - `package`: OpenWebUI veya canlı ClawHub olmadan yapıt yerel paket/güncelleme/yeniden başlatma/Plugin hatları
  - `product`: paket profiline ek olarak MCP kanalları, cron/alt ajan temizliği,
    OpenAI web araması ve OpenWebUI
  - `full`: OpenWebUI ile Docker yayın yolu parçaları
  - `custom`: odaklı bir yeniden çalıştırma için tam `docker_lanes` seçimi
- Yalnızca yayın adayı için tam normal CI kapsamına ihtiyaç duyduğunuzda manuel
  `CI` iş akışını doğrudan çalıştırın. Manuel CI başlatmaları değişiklik
  kapsamını atlar ve Linux Node parçalarını, paketlenmiş Plugin parçalarını,
  kanal sözleşmelerini, Node 22 uyumluluğunu, `check`, `check-additional`,
  build smoke, doküman kontrolleri, Python Skills, Windows, macOS, Android ve
  Control UI i18n hatlarını zorunlu kılar.
  Örnek: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Yayın telemetrisini doğrularken `pnpm qa:otel:smoke` çalıştırın. QA-lab'i
  yerel bir OTLP/HTTP alıcısı üzerinden çalıştırır ve Opik, Langfuse veya başka
  bir harici toplayıcı gerektirmeden dışa aktarılan trace span adlarını, sınırlı
  öznitelikleri ve içerik/tanımlayıcı redaksiyonunu doğrular.
- Her etiketli yayından önce `pnpm release:check` çalıştırın
- Etiket var olduktan sonra değişiklik yapan yayımlama dizisi için
  `OpenClaw Release Publish` çalıştırın. Bunu `release/YYYY.M.D` üzerinden
  (veya main üzerinden erişilebilen bir etiketi yayımlarken `main` üzerinden)
  başlatın, yayın etiketini ve başarılı OpenClaw npm `preflight_run_id` değerini
  iletin ve bilinçli olarak odaklı bir onarım çalıştırmıyorsanız varsayılan
  Plugin yayımlama kapsamını `all-publishable` olarak bırakın. İş akışı Plugin
  npm yayımlamayı, Plugin ClawHub yayımlamayı ve OpenClaw npm yayımlamayı
  serileştirir; böylece çekirdek paket, haricileştirilmiş Plugin'lerinden önce
  yayımlanmaz.
- Yayın kontrolleri artık ayrı bir manuel iş akışında çalışır:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`, yayın onayından önce QA Lab mock parite hattını,
  hızlı canlı Matrix profilini ve Telegram QA hattını da çalıştırır. Canlı
  hatlar `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI kimlik
  bilgisi kiralarını kullanır. Tam Matrix taşıma, medya ve E2EE envanterini
  paralel olarak istediğinizde manuel `QA-Lab - All Lanes` iş akışını
  `matrix_profile=all` ve `matrix_shards=true` ile çalıştırın.
- Çapraz işletim sistemi kurulum ve yükseltme çalışma zamanı doğrulaması,
  yeniden kullanılabilir iş akışı
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` dosyasını
  doğrudan çağıran herkese açık `OpenClaw Release Checks` ve
  `Full Release Validation` kapsamındadır
- Bu ayrım kasıtlıdır: gerçek npm yayın yolunu kısa, deterministik ve yapıt
  odaklı tutarken daha yavaş canlı kontroller kendi hattında kalır; böylece
  yayımlamayı yavaşlatmaz veya engellemezler
- Gizli bilgi taşıyan yayın kontrolleri `Full Release Validation` üzerinden
veya `main`/yayın iş akışı referansından başlatılmalıdır; böylece iş akışı mantığı ve
  gizli bilgiler kontrollü kalır
- `OpenClaw Release Checks`, çözümlenen commit bir OpenClaw dalından veya yayın
  etiketinden erişilebilir olduğu sürece bir dal, etiket veya tam commit SHA
  kabul eder
- `OpenClaw NPM Release` yalnızca doğrulama ön denetimi, itilen bir etiket
  gerektirmeden mevcut tam 40 karakterli iş akışı dalı commit SHA'sını da kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek yayımlamaya yükseltilemez
- SHA modunda iş akışı yalnızca paket meta verisi kontrolü için
  `v<package.json version>` sentezler; gerçek yayımlama hâlâ gerçek bir yayın
  etiketi gerektirir
- Her iki iş akışı da gerçek yayımlama ve tanıtım yolunu GitHub barındırmalı
  runner'larda tutarken, değişiklik yapmayan doğrulama yolu daha büyük
  Blacksmith Linux runner'larını kullanabilir
- Bu iş akışı, hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` iş akışı
  gizli bilgilerini kullanarak
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  çalıştırır
- npm yayın ön denetimi artık ayrı yayın kontrolleri hattını beklemez
- Onaydan önce
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (veya eşleşen beta/düzeltme etiketi) çalıştırın
- npm yayımlamasından sonra, yayımlanmış registry kurulum yolunu yeni bir geçici
  prefix içinde doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (veya eşleşen beta/düzeltme sürümü) çalıştırın
- Bir beta yayımlamasından sonra, paylaşılan kiralanmış Telegram kimlik bilgisi
  havuzunu kullanarak yayımlanmış npm paketine karşı kurulu paket onboarding'ini,
  Telegram kurulumunu ve gerçek Telegram E2E'yi doğrulamak için
  `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  çalıştırın. Yerel maintainer tek seferlik çalıştırmaları Convex değişkenlerini
  atlayabilir ve üç `OPENCLAW_QA_TELEGRAM_*` ortam kimlik bilgisini doğrudan
  iletebilir.
- Bir maintainer makinesinden tam yayımlama sonrası beta smoke çalıştırmak için `pnpm release:beta-smoke -- --beta betaN` kullanın. Yardımcı, Parallels npm güncelleme/yeni hedef doğrulamasını çalıştırır, `NPM Telegram Beta E2E` başlatır, tam iş akışı çalıştırmasını yoklar, yapıtı indirir ve Telegram raporunu yazdırır.
- Maintainer'lar aynı yayımlama sonrası kontrolü GitHub Actions üzerinden manuel
  `NPM Telegram Beta E2E` iş akışıyla çalıştırabilir. Bu kasıtlı olarak yalnızca
  manueldir ve her merge işleminde çalışmaz.
- Maintainer yayın otomasyonu artık ön denetimden sonra tanıtım modelini kullanır:
  - gerçek npm yayımlaması başarılı bir npm `preflight_run_id` geçmelidir
  - gerçek npm yayımlaması, başarılı ön denetim çalıştırmasıyla aynı `main` veya
    `release/YYYY.M.D` dalından başlatılmalıdır
  - kararlı npm yayınları varsayılan olarak `beta` hedefine gider
  - kararlı npm yayımlaması iş akışı girdisiyle açıkça `latest` hedefleyebilir
  - token tabanlı npm dist-tag değişikliği artık güvenlik için
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    içindedir; çünkü herkese açık repo OIDC-only yayımlamayı korurken
    `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirir
  - herkese açık `macOS Release` yalnızca doğrulamadır; bir etiket yalnızca bir
    yayın dalında yaşıyorsa ama iş akışı `main` üzerinden başlatılıyorsa
    `public_release_branch=release/YYYY.M.D` ayarlayın
  - gerçek özel mac yayımlaması başarılı özel mac `preflight_run_id` ve
    `validate_run_id` geçmelidir
  - gerçek yayımlama yolları, yapıtları yeniden oluşturmak yerine hazırlanmış
    yapıtları tanıtır
- `YYYY.M.D-N` gibi kararlı düzeltme yayınlarında, yayımlama sonrası doğrulayıcı
  aynı geçici prefix yükseltme yolunu `YYYY.M.D` sürümünden `YYYY.M.D-N`
  sürümüne de kontrol eder; böylece yayın düzeltmeleri eski global kurulumları
  sessizce temel kararlı payload üzerinde bırakamaz
- npm yayın ön denetimi, tarball hem `dist/control-ui/index.html` hem de boş
  olmayan bir `dist/control-ui/assets/` payload içermedikçe kapalı başarısız
  olur; böylece tekrar boş bir tarayıcı paneli göndermeyiz
- Yayımlama sonrası doğrulama, yayımlanmış Plugin giriş noktalarının ve paket
  meta verilerinin kurulu registry düzeninde mevcut olduğunu da kontrol eder.
  Eksik Plugin çalışma zamanı payload'ları gönderen bir yayın, postpublish
  doğrulayıcıda başarısız olur ve `latest` hedefine tanıtılamaz.
- `pnpm test:install:smoke`, aday güncelleme tarball'ında npm pack
  `unpackedSize` bütçesini de uygular; böylece kurulum e2e'si, yayın yayımlama
  yolundan önce istemeden oluşan paket şişmesini yakalar
- Yayın çalışması CI planlamasına, Plugin zamanlama manifestlerine veya Plugin
  test matrislerine dokunduysa, yayın notlarının eski bir CI düzenini
  açıklamaması için onaydan önce `.github/workflows/plugin-prerelease.yml`
  içindeki planner sahipli `plugin-prerelease-extension-shard` matris
  çıktılarını yeniden üretin ve inceleyin
- Kararlı macOS yayın hazırlığı, updater yüzeylerini de içerir:
  - GitHub yayını paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` ile sonuçlanmalıdır
  - `main` üzerindeki `appcast.xml`, yayımlamadan sonra yeni kararlı zip'e işaret etmelidir
  - paketlenmiş uygulama hata ayıklama olmayan bir bundle id, boş olmayan bir
    Sparkle feed URL'si ve bu yayın sürümü için kanonik Sparkle build tabanında
    veya üzerinde bir `CFBundleVersion` korumalıdır

## Yayın test kutuları

`Full Release Validation`, operatörlerin tüm yayın öncesi testleri tek giriş
noktasından başlatma yoludur. Hızlı değişen bir dalda sabitlenmiş commit kanıtı
için yardımcıyı kullanın; böylece her alt iş akışı hedef SHA'ya sabitlenmiş geçici
bir daldan çalışır:

```bash
pnpm ci:full-release --sha <full-sha>
```

Yardımcı `release-ci/<sha>-...` dalını iter, bu daldan `ref=<sha>` ile
`Full Release Validation` başlatır, her alt iş akışı `headSha` değerinin hedefle
eşleştiğini doğrular ve ardından geçici dalı siler. Bu, yanlışlıkla daha yeni bir
`main` alt çalıştırmasını kanıtlamayı önler.

Sürüm dalı veya etiket doğrulaması için bunu güvenilir `main` iş akışı
ref’inden çalıştırın ve sürüm dalını ya da etiketi `ref` olarak geçirin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

İş akışı hedef ref’i çözümler, manuel `CI` iş akışını
`target_ref=<release-ref>` ile tetikler, `OpenClaw Release Checks` iş akışını tetikler,
paket odaklı kontroller için bir üst `release-package-under-test` artifact’ı hazırlar ve
`release_profile=full` ile `rerun_group=all` olduğunda ya da
`npm_telegram_package_spec` ayarlandığında bağımsız paket Telegram E2E’yi tetikler. Ardından
`OpenClaw Release Checks`; install smoke, çapraz işletim sistemi sürüm kontrolleri, soak etkinleştirildiğinde canlı/E2E Docker
sürüm yolu kapsamı, Telegram paket QA’sı ile Package Acceptance, QA Lab parity, canlı Matrix ve canlı Telegram genelinde dağıtılır. Tam çalıştırma yalnızca
`Full Release Validation`
özeti `normal_ci` ve `release_checks` sonuçlarını başarılı gösterdiğinde kabul edilebilir. Full/all modunda
`npm_telegram` alt iş akışı da başarılı olmalıdır; full/all dışında yayımlanmış bir `npm_telegram_package_spec` sağlanmadıysa atlanır. Son
doğrulayıcı özeti her alt çalıştırma için en yavaş iş tablolarını içerir; böylece sürüm
yöneticisi logları indirmeden güncel kritik yolu görebilir.
Eksiksiz aşama matrisi, kesin iş akışı iş adları, stable ile full profil
farkları, artifact’lar ve odaklı yeniden çalıştırma tutamakları için
[Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.
Alt iş akışları, hedef `ref` daha eski bir sürüm dalını veya etiketi gösterse bile
`Full Release Validation` çalıştıran güvenilir ref’ten, normalde `--ref main` üzerinden tetiklenir. Ayrı bir Full Release Validation
workflow-ref girdisi yoktur; güvenilir harness’ı iş akışı çalıştırma ref’ini seçerek seçin.
Hareket eden `main` üzerinde kesin commit kanıtı için `--ref main -f ref=<sha>` kullanmayın;
ham commit SHA’ları workflow dispatch ref’i olamaz, bu nedenle sabitlenmiş geçici dalı oluşturmak için
`pnpm ci:full-release --sha <sha>` kullanın.

Canlı/provider kapsamını seçmek için `release_profile` kullanın:

- `minimum`: en hızlı, sürüm açısından kritik OpenAI/çekirdek canlı ve Docker yolu
- `stable`: minimum kapsam artı sürüm onayı için stable provider/backend kapsamı
- `full`: stable kapsam artı geniş advisory provider/medya kapsamı

Sürümü engelleyen lane’ler yeşil olduğunda ve terfi öncesinde kapsamlı canlı/E2E, Docker sürüm yolu ve
sınırlandırılmış yayımlanmış upgrade-survivor taramasını istediğinizde `stable` ile `run_release_soak=true` kullanın. Bu tarama
son dört stable paketi, sabitlenmiş `2026.4.23` ve `2026.5.2`
başlangıç noktalarını ve daha eski `2026.4.15` kapsamını içerir; yinelenen başlangıç noktaları kaldırılır ve
her başlangıç noktası kendi Docker runner işine shard’lanır. `full`,
`run_release_soak=true` anlamına gelir.

`OpenClaw Release Checks`, hedef ref’i bir kez `release-package-under-test`
olarak çözümlemek için güvenilir iş akışı ref’ini kullanır ve soak çalıştığında bu artifact’ı çapraz işletim sistemi,
Package Acceptance ve sürüm yolu Docker kontrollerinde yeniden kullanır. Bu, tüm paket odaklı kutuları aynı baytlar üzerinde tutar ve yinelenen paket derlemelerini önler.
Çapraz işletim sistemi OpenAI install smoke, repo/org değişkeni ayarlandığında
`OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır; aksi halde `openai/gpt-5.4` kullanır, çünkü bu lane
en yavaş varsayılan modeli benchmark etmek yerine paket kurulumunu, onboarding’i, Gateway başlangıcını ve bir canlı agent turunu
kanıtlar. Daha geniş canlı provider matrisi model özelindeki kapsam için uygun yerdir.

Sürüm aşamasına bağlı olarak şu varyantları kullanın:

```bash
# Yayımlanmamış bir sürüm adayı dalını doğrulayın.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Kesin bir push edilmiş commit’i doğrulayın.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# Bir beta yayımladıktan sonra yayımlanmış paket Telegram E2E ekleyin.
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

Odaklı bir düzeltmeden sonraki ilk yeniden çalıştırma olarak tam şemsiyeyi kullanmayın. Bir kutu
başarısız olursa sonraki kanıt için başarısız alt iş akışını, işi, Docker lane’ini, paket profilini, model
provider’ını veya QA lane’ini kullanın. Tam şemsiyeyi ancak düzeltme paylaşılan sürüm orkestrasyonunu değiştirdiyse veya önceki tüm kutu kanıtlarını
geçersiz kıldıysa yeniden çalıştırın. Şemsiyenin son doğrulayıcısı kaydedilmiş alt iş akışı çalıştırma
kimliklerini yeniden kontrol eder; bu yüzden bir alt iş akışı başarıyla yeniden çalıştırıldıktan sonra yalnızca başarısız
`Verify full validation` üst işini yeniden çalıştırın.

Sınırlandırılmış kurtarma için şemsiyeye `rerun_group` geçirin. `all` gerçek
sürüm adayı çalıştırmasıdır, `ci` yalnızca normal CI alt iş akışını çalıştırır, `plugin-prerelease`
yalnızca sürüme özel Plugin alt iş akışını çalıştırır, `release-checks` her sürüm
kutusunu çalıştırır ve daha dar sürüm grupları `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ve `npm-telegram` şeklindedir.
Odaklı `npm-telegram` yeniden çalıştırmaları `npm_telegram_package_spec` gerektirir; `release_profile=full` ile full/all çalıştırmaları
release-checks paket artifact’ını kullanır. Odaklı
cross-OS yeniden çalıştırmaları `cross_os_suite_filter=windows/packaged-upgrade` veya
başka bir OS/suite filtresi ekleyebilir. QA release-check hataları advisory niteliktedir; yalnızca QA hatası
sürüm doğrulamasını engellemez.

### Vitest

Vitest kutusu manuel `CI` alt iş akışıdır. Manuel CI bilinçli olarak
değişiklik kapsamını atlar ve sürüm adayı için normal test grafiğini zorunlu kılar:
Linux Node shard’ları, bundled-plugin shard’ları, kanal contract’ları, Node 22
uyumluluğu, `check`, `check-additional`, build smoke, doküman kontrolleri, Python
skills, Windows, macOS, Android ve Control UI i18n.

Bu kutuyu “kaynak ağacı tam normal test paketinden geçti mi?” sorusunu yanıtlamak için kullanın.
Bu, sürüm yolu ürün doğrulamasıyla aynı şey değildir. Saklanacak kanıtlar:

- Tetiklenen `CI` çalıştırma URL’sini gösteren `Full Release Validation` özeti
- Kesin hedef SHA üzerinde yeşil `CI` çalıştırması
- regresyonları araştırırken CI işlerinden başarısız veya yavaş shard adları
- bir çalıştırmanın performans analizine ihtiyaç duyduğu durumlarda
  `.artifacts/vitest-shard-timings.json` gibi Vitest zamanlama artifact’ları

Sürüm deterministik normal CI gerektiriyor ancak Docker, QA Lab, canlı, çapraz işletim sistemi veya paket kutularını
gerektirmiyorsa manuel CI’ı doğrudan çalıştırın:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker kutusu, `openclaw-live-and-e2e-checks-reusable.yml` aracılığıyla
`OpenClaw Release Checks` içinde ve ayrıca sürüm modu
`install-smoke` iş akışında bulunur. Sürüm adayını yalnızca kaynak düzeyi testler yerine paketlenmiş
Docker ortamları üzerinden doğrular.

Sürüm Docker kapsamı şunları içerir:

- yavaş Bun global install smoke etkinleştirilmiş tam install smoke
- hedef SHA’ya göre kök Dockerfile smoke imajı hazırlama/yeniden kullanma; QR,
  kök/Gateway ve installer/Bun smoke işleri ayrı install-smoke
  shard’ları olarak çalışır
- repository E2E lane’leri
- sürüm yolu Docker parçaları: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` ve `plugins-runtime-install-h`
- istendiğinde `plugins-runtime-services` parçası içinde OpenWebUI kapsamı
- bölünmüş bundled plugin kurulum/kaldırma lane’leri:
  `bundled-plugin-install-uninstall-0` ile
  `bundled-plugin-install-uninstall-23` arası
- release checks canlı paketleri içerdiğinde canlı/E2E provider paketleri ve Docker canlı model kapsamı

Yeniden çalıştırmadan önce Docker artifact’larını kullanın. Sürüm yolu zamanlayıcısı
lane logları, `summary.json`, `failures.json`,
faz zamanlamaları, zamanlayıcı planı JSON’u ve yeniden çalıştırma komutları ile birlikte
`.artifacts/docker-tests/` yükler. Odaklı kurtarma için
tüm sürüm parçalarını yeniden çalıştırmak yerine yeniden kullanılabilir canlı/E2E iş akışında `docker_lanes=<lane[,lane]>` kullanın.
Oluşturulan yeniden çalıştırma komutları, mevcut olduğunda önceki
`package_artifact_run_id` ve hazırlanmış Docker imajı girdilerini içerir; böylece
başarısız bir lane aynı tarball’ı ve GHCR imajlarını yeniden kullanabilir.

### QA Lab

QA Lab kutusu da `OpenClaw Release Checks` kapsamındadır. Bu, Vitest ve Docker
paket mekaniklerinden ayrı olarak agentic davranış ve kanal düzeyi sürüm kapısıdır.

Sürüm QA Lab kapsamı şunları içerir:

- agentic parity pack kullanarak OpenAI aday lane’ini Opus 4.6
  başlangıç noktasıyla karşılaştıran mock parity lane’i
- `qa-live-shared` ortamını kullanan hızlı canlı Matrix QA profili
- Convex CI kimlik bilgisi lease’lerini kullanan canlı Telegram QA lane’i
- sürüm telemetry açık yerel kanıt gerektirdiğinde `pnpm qa:otel:smoke`

Bu kutuyu “sürüm QA senaryolarında ve canlı kanal akışlarında doğru davranıyor mu?”
sorusunu yanıtlamak için kullanın. Sürümü onaylarken parity, Matrix ve Telegram
lane’leri için artifact URL’lerini saklayın. Tam Matrix kapsamı varsayılan sürüm açısından kritik lane yerine
manuel shard’lanmış QA-Lab çalıştırması olarak kullanılabilir kalır.

### Paket

Paket kutusu kurulabilir ürün kapısıdır. `Package Acceptance` ve
`scripts/resolve-openclaw-package-candidate.mjs` çözümleyicisi tarafından desteklenir. Çözümleyici bir
adayı Docker E2E tarafından tüketilen `package-under-test` tarball’ına normalleştirir, paket envanterini doğrular,
paket sürümünü ve SHA-256’yı kaydeder ve
iş akışı harness ref’ini paket kaynak ref’inden ayrı tutar.

Desteklenen aday kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya kesin bir OpenClaw sürüm
  versiyonu
- `source=ref`: seçilen `workflow_ref` harness’ı ile güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA’sını
  paketleyin
- `source=url`: zorunlu `package_sha256` ile bir HTTPS `.tgz` indirin
- `source=artifact`: başka bir GitHub Actions çalıştırması tarafından yüklenen bir `.tgz` yeniden kullanın

`OpenClaw Release Checks`, Package Acceptance’ı `source=artifact`, hazırlanmış sürüm paket artifact’ı,
`suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` ile çalıştırır. Package Acceptance; migration, update,
configured-auth update restart, eski Plugin bağımlılığı temizliği, offline Plugin
fixture’ları, Plugin update ve Telegram paket QA’sını aynı çözülmüş
tarball’a karşı tutar. Engelleyici sürüm kontrolleri varsayılan olarak en son yayımlanmış paket
başlangıç noktasını kullanır; `run_release_soak=true` veya
`release_profile=full`, `2026.4.23` ile `latest` arasındaki her stable npm-yayımlı başlangıç noktasına
ve bildirilen sorun fixture’larına genişler. Zaten gönderilmiş bir aday için
Package Acceptance’ı `source=npm` ile, yayımlamadan önce SHA destekli yerel npm tarball’ı için
`source=ref`/`source=artifact` ile kullanın. Bu, daha önce
Parallels gerektiren paket/update kapsamının çoğu için GitHub’a yerel
yerine geçendir. OS özelindeki onboarding,
installer ve platform davranışı için çapraz işletim sistemi sürüm kontrolleri hâlâ önemlidir, ancak paket/update ürün doğrulaması
Package Acceptance’ı tercih etmelidir.

Update ve Plugin doğrulaması için kanonik kontrol listesi
[Update’leri ve Plugin’leri test etme](/tr/help/testing-updates-plugins) bölümündedir. Bir
Plugin install/update, doctor cleanup veya yayımlanmış paket migration değişikliğini hangi yerel, Docker, Package Acceptance ya da release-check lane’inin kanıtladığına
karar verirken bunu kullanın.
Her stable `2026.4.23+` paketten kapsamlı yayımlanmış update migration,
Full Release CI’ın parçası değil, ayrı bir manuel `Update Migration` iş akışıdır.

Eski paket kabulü esnekliği bilinçli olarak zamanla sınırlanmıştır. `2026.4.25` sürümüne kadar olan paketler, npm'de zaten yayımlanmış metadata boşlukları için uyumluluk yolunu kullanabilir: tarball'da eksik olan özel QA envanteri girdileri, eksik `gateway install --wrapper`, tarball'dan türetilmiş git fixture'ında eksik patch dosyaları, eksik kalıcı `update.channel`, eski plugin kurulum kaydı konumları, eksik marketplace kurulum kaydı kalıcılığı ve `plugins update` sırasında config metadata migration. Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel build metadata damga dosyaları için uyarı verebilir. Daha sonraki paketler modern paket sözleşmelerini karşılamalıdır; aynı boşluklar release doğrulamasında başarısız olur.

Release sorusu gerçek bir kurulabilir paketle ilgili olduğunda daha geniş Paket Kabulü profilleri kullanın:

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

- `smoke`: hızlı paket kurulum/kanal/agent, Gateway ağı ve config yeniden yükleme hatları
- `package`: canlı ClawHub olmadan kurulum/güncelleme/yeniden başlatma/plugin paket sözleşmeleri; bu release-check varsayılanıdır
- `product`: `package` artı MCP kanalları, cron/subagent temizliği, OpenAI web araması ve OpenWebUI
- `full`: OpenWebUI ile Docker release-yolu parçaları
- `custom`: odaklı yeniden çalıştırmalar için tam `docker_lanes` listesi

Paket adayı Telegram kanıtı için Paket Kabulü üzerinde `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` etkinleştirin. İş akışı çözümlenen `package-under-test` tarball'ını Telegram hattına geçirir; bağımsız Telegram iş akışı, yayımlama sonrası kontroller için yayımlanmış bir npm spec'ini hâlâ kabul eder.

## Release yayımlama otomasyonu

`OpenClaw Release Publish` normal değişiklik yapan yayımlama giriş noktasıdır. Release'in ihtiyaç duyduğu sırayla trusted-publisher iş akışlarını orkestre eder:

1. Release tag'ini check out edin ve commit SHA'sını çözümleyin.
2. Tag'in `main` veya `release/*` üzerinden erişilebilir olduğunu doğrulayın.
3. `pnpm plugins:sync:check` çalıştırın.
4. `publish_scope=all-publishable` ve `ref=<release-sha>` ile `Plugin NPM Release` dispatch edin.
5. Aynı scope ve SHA ile `Plugin ClawHub Release` dispatch edin.
6. Release tag'i, npm dist-tag'i ve kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` dispatch edin.

Beta yayımlama örneği:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Varsayılan beta dist-tag'ine kararlı yayımlama:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Doğrudan `latest` sürümüne kararlı promotion açıkça belirtilir:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Daha düşük seviyeli `Plugin NPM Release` ve `Plugin ClawHub Release` iş akışlarını yalnızca odaklı onarım veya yeniden yayımlama işleri için kullanın. Seçilmiş bir plugin onarımı için `OpenClaw Release Publish` öğesine `plugin_publish_scope=selected` ve `plugins=@openclaw/name` geçirin ya da OpenClaw paketi yayımlanmamalıysa alt iş akışını doğrudan dispatch edin.

## NPM iş akışı girdileri

`OpenClaw NPM Release` şu operatör kontrollü girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya `v2026.4.2-beta.1` gibi gerekli release tag'i; `preflight_only=true` olduğunda, yalnızca doğrulama amaçlı preflight için geçerli tam 40 karakterlik iş akışı dalı commit SHA'sı da olabilir
- `preflight_only`: yalnızca doğrulama/build/paket için `true`, gerçek yayımlama yolu için `false`
- `preflight_run_id`: iş akışının başarılı preflight çalıştırmasından hazırlanmış tarball'ı yeniden kullanması için gerçek yayımlama yolunda gereklidir
- `npm_dist_tag`: yayımlama yolu için npm hedef tag'i; varsayılanı `beta`

`OpenClaw Release Publish` şu operatör kontrollü girdileri kabul eder:

- `tag`: gerekli release tag'i; zaten mevcut olmalıdır
- `preflight_run_id`: başarılı `OpenClaw NPM Release` preflight çalıştırma id'si; `publish_openclaw_npm=true` olduğunda gereklidir
- `npm_dist_tag`: OpenClaw paketi için npm hedef tag'i
- `plugin_publish_scope`: varsayılanı `all-publishable`; `selected` değerini yalnızca odaklı onarım işleri için kullanın
- `plugins`: `plugin_publish_scope=selected` olduğunda virgülle ayrılmış `@openclaw/*` paket adları
- `publish_openclaw_npm`: varsayılanı `true`; yalnızca iş akışını plugin'e özel onarım orkestratörü olarak kullanırken `false` olarak ayarlayın

`OpenClaw Release Checks` şu operatör kontrollü girdileri kabul eder:

- `ref`: doğrulanacak dal, tag veya tam commit SHA'sı. Secret taşıyan kontroller, çözümlenen commit'in bir OpenClaw dalından veya release tag'inden erişilebilir olmasını gerektirir.
- `run_release_soak`: kararlı/varsayılan release kontrollerinde kapsamlı canlı/E2E, Docker release-yolu ve all-since upgrade-survivor soak'a katılın. `release_profile=full` tarafından zorunlu olarak etkinleştirilir.

Kurallar:

- Kararlı ve düzeltme tag'leri `beta` veya `latest` seçeneklerinden birine yayımlanabilir
- Beta prerelease tag'leri yalnızca `beta` sürümüne yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` ve `Full Release Validation` her zaman yalnızca doğrulama amaçlıdır
- Gerçek yayımlama yolu, preflight sırasında kullanılan aynı `npm_dist_tag` değerini kullanmalıdır; iş akışı yayımlamadan önce metadata'nın devam ettiğini doğrular

## Kararlı npm release sırası

Kararlı bir npm release'i keserken:

1. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın
   - Bir tag mevcut olmadan önce, preflight iş akışının yalnızca doğrulama amaçlı dry run'ı için geçerli tam iş akışı dalı commit SHA'sını kullanabilirsiniz
2. Normal önce-beta akışı için `npm_dist_tag=beta` seçin veya yalnızca bilinçli olarak doğrudan kararlı yayımlama istediğinizde `latest` seçin
3. Tek bir manuel iş akışından normal CI artı canlı prompt cache, Docker, QA Lab, Matrix ve Telegram kapsamı istediğinizde release dalı, release tag'i veya tam commit SHA üzerinde `Full Release Validation` çalıştırın
4. Bilinçli olarak yalnızca deterministik normal test grafiğine ihtiyacınız varsa bunun yerine release ref'i üzerinde manuel `CI` iş akışını çalıştırın
5. Başarılı `preflight_run_id` değerini kaydedin
6. Aynı `tag`, aynı `npm_dist_tag` ve kaydedilmiş `preflight_run_id` ile `OpenClaw Release Publish` çalıştırın; OpenClaw npm paketini promote etmeden önce dışsallaştırılmış plugin'leri npm'e ve ClawHub'a yayımlar
7. Release `beta` üzerinde landed olduysa, bu kararlı sürümü `beta` sürümünden `latest` sürümüne promote etmek için özel `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` iş akışını kullanın
8. Release bilinçli olarak doğrudan `latest` sürümüne yayımlandıysa ve `beta` hemen aynı kararlı build'i izlemeliyse, her iki dist-tag'i kararlı sürüme yönlendirmek için aynı özel iş akışını kullanın veya zamanlanmış kendi kendini onaran sync'in `beta` değerini daha sonra taşımasına izin verin

Dist-tag değişikliği güvenlik nedeniyle özel repoda bulunur, çünkü hâlâ `NPM_TOKEN` gerektirir; public repo ise yalnızca OIDC yayımlamayı korur.

Bu, doğrudan yayımlama yolunu ve önce-beta promotion yolunu hem dokümante edilmiş hem de operatör tarafından görünür tutar.

Bir maintainer yerel npm kimlik doğrulamasına geri dönmek zorundaysa, tüm 1Password CLI (`op`) komutlarını yalnızca ayrılmış bir tmux oturumu içinde çalıştırın. `op` komutunu ana agent shell'inden doğrudan çağırmayın; onu tmux içinde tutmak istemleri, uyarıları ve OTP işlemeyi gözlemlenebilir kılar ve tekrarlanan host uyarılarını önler.

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
konumunda kullanır.

## İlgili

- [Release kanalları](/tr/install/development-channels)
