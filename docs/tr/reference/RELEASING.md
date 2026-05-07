---
read_when:
    - Herkese açık sürüm kanalı tanımları aranıyor
    - Sürüm doğrulamasını veya paket kabulünü çalıştırma
    - Sürüm adlandırması ve yayın temposu aranıyor
summary: Sürüm kulvarları, operatör kontrol listesi, doğrulama kutuları, sürüm adlandırması ve yayın temposu
title: Sürüm politikası
x-i18n:
    generated_at: "2026-05-07T13:26:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw'ın üç herkese açık yayın kanalı vardır:

- kararlı: varsayılan olarak npm `beta` için veya açıkça istendiğinde npm `latest` için yayımlanan etiketli yayınlar
- beta: npm `beta` için yayımlanan ön yayın etiketleri
- geliştirme: `main` dalının hareketli baş ucu

## Sürüm adlandırma

- Kararlı yayın sürümü: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Kararlı düzeltme yayını sürümü: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön yayın sürümü: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ayı veya günü başına sıfır ekleyerek yazmayın
- `latest`, geçerli yükseltilmiş kararlı npm yayını anlamına gelir
- `beta`, geçerli beta kurulum hedefi anlamına gelir
- Kararlı ve kararlı düzeltme yayınları varsayılan olarak npm `beta` için yayımlanır; yayın operatörleri açıkça `latest` hedefleyebilir veya incelenmiş bir beta derlemesini daha sonra yükseltebilir
- Her kararlı OpenClaw yayını, npm paketini ve macOS uygulamasını birlikte gönderir;
  beta yayınları normalde önce npm/paket yolunu doğrular ve yayımlar, mac
  uygulamasının derleme/imzalama/noter onayı ise açıkça istenmediği sürece kararlı yayın için ayrılır

## Yayın ritmi

- Yayınlar önce beta ile ilerler
- Kararlı yayın, yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar normalde yayınları geçerli `main` üzerinden oluşturulan bir
  `release/YYYY.M.D` dalından çıkarır; böylece yayın doğrulaması ve düzeltmeler
  `main` üzerindeki yeni geliştirmeleri engellemez
- Bir beta etiketi gönderilmiş veya yayımlanmışsa ve düzeltme gerekiyorsa bakımcılar
  eski beta etiketini silmek veya yeniden oluşturmak yerine bir sonraki `-beta.N` etiketini çıkarır
- Ayrıntılı yayın prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca bakımcılara özeldir

## Yayın operatörü kontrol listesi

Bu kontrol listesi, yayın akışının herkese açık biçimidir. Özel kimlik bilgileri,
imzalama, noter onayı, dist-tag kurtarma ve acil geri alma ayrıntıları yalnızca
bakımcılara özel yayın runbook'unda kalır.

1. Geçerli `main` üzerinden başlayın: en son değişiklikleri çekin, hedef commit'in gönderildiğini doğrulayın
   ve geçerli `main` CI durumunun dal oluşturmak için yeterince yeşil olduğunu doğrulayın.
2. Üstteki `CHANGELOG.md` bölümünü gerçek commit geçmişinden `/changelog` ile
   yeniden yazın, girdileri kullanıcıya yönelik tutun, commit'leyin, gönderin ve dallanmadan önce
   bir kez daha rebase/pull yapın.
3. Yayın uyumluluk kayıtlarını
   `src/plugins/compat/registry.ts` ve
   `src/commands/doctor/shared/deprecation-compat.ts` içinde gözden geçirin. Süresi dolmuş
   uyumluluğu yalnızca yükseltme yolu kapsanmaya devam ediyorsa kaldırın veya neden
   bilinçli olarak taşındığını kaydedin.
4. Geçerli `main` üzerinden `release/YYYY.M.D` oluşturun; normal yayın çalışmasını
   doğrudan `main` üzerinde yapmayın.
5. Amaçlanan etiket için gerekli tüm sürüm konumlarını artırın,
   yayımlanabilir Plugin paketlerinin yayın sürümünü ve uyumluluk meta verilerini paylaşması için
   `pnpm plugins:sync` çalıştırın, ardından yerel deterministik ön denetimi çalıştırın:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` ve
   `pnpm release:check`.
6. `OpenClaw NPM Release` işlemini `preflight_only=true` ile çalıştırın. Etiket yokken,
   yalnızca doğrulama amaçlı ön denetim için tam 40 karakterlik release dalı SHA'sına izin verilir.
   Başarılı `preflight_run_id` değerini kaydedin.
7. Yayın dalı, etiket veya tam commit SHA'sı için `Full Release Validation` ile
   tüm yayın öncesi testleri başlatın. Bu, dört büyük yayın test kutusu için tek elle başlatılan
   giriş noktasıdır: Vitest, Docker, QA Lab ve Package.
8. Doğrulama başarısız olursa yayın dalında düzeltin ve düzeltmeyi kanıtlayan en küçük başarısız
   dosyayı, kanalı, workflow işini, paket profilini, sağlayıcıyı veya model izin listesini yeniden çalıştırın.
   Tam şemsiyeyi yalnızca değişen yüzey önceki kanıtları geçersiz kıldığında yeniden çalıştırın.
9. Beta için `vYYYY.M.D-beta.N` etiketleyin, ardından eşleşen `release/YYYY.M.D` dalından
   `OpenClaw Release Publish` çalıştırın. Bu işlem `pnpm plugins:sync:check` doğrulaması yapar,
   tüm yayımlanabilir Plugin paketlerini npm'e ve aynı kümeyi paralel olarak
   ClawHub'a gönderir, ardından Plugin npm yayını başarılı olur olmaz hazırlanmış OpenClaw npm ön denetim
   yapıtını eşleşen dist-tag ile yükseltir.
   OpenClaw npm yayımlanırken ClawHub yayını hâlâ çalışıyor olabilir; ancak
   yayın yayımlama workflow'u, hem Plugin yayın yolları hem de
   OpenClaw npm yayın yolu başarıyla tamamlanmadan bitmez. Yayımdan sonra,
   yayımlanan `openclaw@YYYY.M.D-beta.N` veya
   `openclaw@beta` paketine karşı yayın sonrası paket
   kabulünü çalıştırın. Gönderilmiş veya yayımlanmış bir ön yayın düzeltme gerektirirse,
   bir sonraki eşleşen ön yayın numarasını çıkarın; eski
   ön yayını silmeyin veya yeniden yazmayın.
10. Kararlı yayın için, yalnızca incelenmiş beta veya yayın adayında gerekli
    doğrulama kanıtı olduğunda devam edin. Kararlı npm yayını da
    başarılı ön denetim yapıtını `preflight_run_id` üzerinden yeniden kullanarak
    `OpenClaw Release Publish` üzerinden geçer; kararlı macOS yayın hazırlığı ayrıca
    paketlenmiş `.zip`, `.dmg`, `.dSYM.zip` ve `main` üzerindeki güncellenmiş `appcast.xml` dosyasını gerektirir.
11. Yayımdan sonra npm yayın sonrası doğrulayıcısını, yayın sonrası kanal kanıtı gerektiğinde isteğe bağlı bağımsız
    yayımlanmış-npm Telegram E2E'yi,
    gerektiğinde dist-tag yükseltmesini, eksiksiz eşleşen `CHANGELOG.md` bölümünden GitHub yayın/ön yayın notlarını
    ve yayın duyurusu adımlarını çalıştırın.

## Yayın ön denetimi

- Sürüm öncesi kontrolden önce `pnpm check:test-types` komutunu çalıştırın; böylece test TypeScript'i daha hızlı yerel `pnpm check` kapısının dışında kapsamda kalır
- Sürüm öncesi kontrolden önce `pnpm check:architecture` komutunu çalıştırın; böylece daha geniş import döngüsü ve mimari sınır denetimleri daha hızlı yerel kapının dışında yeşil olur
- `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` komutunu çalıştırın; böylece beklenen `dist/*` sürüm yapıtları ve Control UI paketi, paket doğrulama adımı için mevcut olur
- Kök sürüm yükseltmesinden sonra ve etiketlemeden önce `pnpm plugins:sync` komutunu çalıştırın. Bu, yayımlanabilir Plugin paketi sürümlerini, OpenClaw peer/API uyumluluk metaverilerini, derleme metaverilerini ve Plugin changelog taslaklarını çekirdek sürümle eşleşecek şekilde günceller. `pnpm plugins:sync:check` değiştirme yapmayan sürüm korumasıdır; bu adım unutulduysa yayımlama iş akışı herhangi bir kayıt defteri değişikliğinden önce başarısız olur.
- Sürüm onayından önce tüm sürüm öncesi test kutularını tek bir giriş noktasından başlatmak için manuel `Full Release Validation` iş akışını çalıştırın. Bir dal, etiket veya tam commit SHA kabul eder; manuel `CI` iş akışını ve kurulum smoke, paket kabulü, platformlar arası paket denetimleri, QA Lab paritesi, Matrix ve Telegram hatları için `OpenClaw Release Checks` iş akışını tetikler. Kararlı/varsayılan çalıştırmalar, kapsamlı canlı/E2E ve Docker sürüm yolu bekletmesini `run_release_soak=true` arkasında tutar; `release_profile=full` bekletmeyi zorla açar. `release_profile=full` ve `rerun_group=all` ile ayrıca paket Telegram E2E'yi sürüm denetimlerinden gelen `release-package-under-test` yapıtına karşı çalıştırır. Aynı Telegram E2E'nin yayımlanmış npm paketini de kanıtlaması gerektiğinde yayımlamadan sonra `npm_telegram_package_spec` sağlayın. Package Acceptance'ın paket/güncelleme matrisini SHA ile oluşturulan yapıt yerine gönderilen npm paketine karşı çalıştırması gerektiğinde yayımlamadan sonra `package_acceptance_package_spec` sağlayın. Özel kanıt raporunun doğrulamanın yayımlanmış bir npm paketiyle eşleştiğini Telegram E2E'yi zorlamadan kanıtlaması gerektiğinde `evidence_package_spec` sağlayın. Örnek:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Sürüm çalışması devam ederken bir paket adayı için yan kanal kanıtı istediğinizde manuel `Package Acceptance` iş akışını çalıştırın. `openclaw@beta`, `openclaw@latest` veya tam bir sürüm için `source=npm`; mevcut `workflow_ref` test düzeneğiyle güvenilir bir `package_ref` dalını/etiketini/SHA'sını paketlemek için `source=ref`; gerekli SHA-256 ile bir HTTPS tarball için `source=url`; ya da başka bir GitHub Actions çalıştırması tarafından yüklenen bir tarball için `source=artifact` kullanın. İş akışı adayı `package-under-test` olarak çözer, Docker E2E sürüm zamanlayıcısını bu tarball'a karşı yeniden kullanır ve aynı tarball'a karşı `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` ile Telegram QA çalıştırabilir. Seçilen Docker hatları `published-upgrade-survivor` içerdiğinde paket yapıtı adaydır ve `published_upgrade_survivor_baseline` yayımlanmış temel sürümü seçer. `update-restart-auth`, aday paketi hem kurulu CLI hem de package-under-test olarak kullanır; böylece aday güncelleme komutunun yönetilen yeniden başlatma yolunu çalıştırır.
  Örnek: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Yaygın profiller:
  - `smoke`: kurulum/kanal/ajan, Gateway ağı ve yapılandırma yeniden yükleme hatları
  - `package`: OpenWebUI veya canlı ClawHub olmadan yapıt-yerel paket/güncelleme/yeniden başlatma/Plugin hatları
  - `product`: paket profiline ek olarak MCP kanalları, cron/alt ajan temizliği,
    OpenAI web araması ve OpenWebUI
  - `full`: OpenWebUI ile Docker sürüm yolu parçaları
  - `custom`: odaklı bir yeniden çalıştırma için tam `docker_lanes` seçimi
- Sürüm adayı için yalnızca tam normal CI kapsamına ihtiyacınız olduğunda manuel `CI` iş akışını doğrudan çalıştırın. Manuel CI tetiklemeleri değişiklik kapsamlandırmasını atlar ve Linux Node parçalarını, paketli-Plugin parçalarını, kanal sözleşmelerini, Node 22 uyumluluğunu, `check`, `check-additional`, derleme smoke, doküman denetimleri, Python Skills, Windows, macOS, Android ve Control UI i18n hatlarını zorlar.
  Örnek: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Sürüm telemetrisini doğrularken `pnpm qa:otel:smoke` komutunu çalıştırın. Bu, yerel bir OTLP/HTTP alıcısı üzerinden QA-lab'i çalıştırır ve dışa aktarılan trace span adlarını, sınırlı öznitelikleri ve içerik/tanımlayıcı redaksiyonunu Opik, Langfuse veya başka bir harici toplayıcı gerektirmeden doğrular.
- Her etiketli sürümden önce `pnpm release:check` komutunu çalıştırın
- Etiket mevcut olduktan sonra değişiklik yapan yayımlama dizisi için `OpenClaw Release Publish` iş akışını çalıştırın. Bunu `release/YYYY.M.D` üzerinden tetikleyin (veya main üzerinden erişilebilir bir etiketi yayımlarken `main`), sürüm etiketini ve başarılı OpenClaw npm `preflight_run_id` değerini geçin ve bilinçli olarak odaklı bir onarım çalıştırmıyorsanız varsayılan Plugin yayımlama kapsamı `all-publishable` değerini koruyun. İş akışı Plugin npm yayımlamayı, Plugin ClawHub yayımlamayı ve OpenClaw npm yayımlamayı serileştirir; böylece çekirdek paket dışsallaştırılmış Plugin'lerinden önce yayımlanmaz.
- Sürüm denetimleri artık ayrı bir manuel iş akışında çalışır:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ayrıca sürüm onayından önce QA Lab mock parite hattını, hızlı canlı Matrix profilini ve Telegram QA hattını çalıştırır. Canlı hatlar `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI kimlik bilgisi kiralamalarını kullanır. Tam Matrix taşıması, medya ve E2EE envanterini paralel istediğinizde manuel `QA-Lab - All Lanes` iş akışını `matrix_profile=all` ve `matrix_shards=true` ile çalıştırın.
- Platformlar arası kurulum ve yükseltme çalışma zamanı doğrulaması, yeniden kullanılabilir iş akışını doğrudan çağıran herkese açık `OpenClaw Release Checks` ve `Full Release Validation` parçalarıdır:
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Bu ayrım bilinçlidir: gerçek npm sürüm yolunu kısa, deterministik ve yapıt odaklı tutarken, daha yavaş canlı denetimler yayımlamayı durdurmamaları veya engellememeleri için kendi hatlarında kalır
- Gizli bilgi içeren sürüm denetimleri `Full Release
Validation` üzerinden veya `main`/sürüm iş akışı ref'inden tetiklenmelidir; böylece iş akışı mantığı ve gizli bilgiler kontrollü kalır
- `OpenClaw Release Checks`, çözümlenen commit bir OpenClaw dalından veya sürüm etiketinden erişilebilir olduğu sürece bir dal, etiket veya tam commit SHA kabul eder
- `OpenClaw NPM Release` yalnızca doğrulama amaçlı ön kontrolü, itilmiş bir etiket gerektirmeden mevcut tam 40 karakterli iş akışı dalı commit SHA'sını da kabul eder
- Bu SHA yolu yalnızca doğrulama amaçlıdır ve gerçek yayımlamaya terfi ettirilemez
- SHA modunda iş akışı `v<package.json version>` değerini yalnızca paket metaverisi denetimi için sentezler; gerçek yayımlama hâlâ gerçek bir sürüm etiketi gerektirir
- Her iki iş akışı da gerçek yayımlama ve terfi yolunu GitHub tarafından barındırılan runner'larda tutarken, değişiklik yapmayan doğrulama yolu daha büyük Blacksmith Linux runner'larını kullanabilir
- Bu iş akışı hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` iş akışı gizli bilgilerini kullanarak
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  komutunu çalıştırır
- npm sürüm ön kontrolü artık ayrı sürüm denetimleri hattını beklemez
- Onaydan önce `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  komutunu (veya eşleşen beta/düzeltme etiketini) çalıştırın
- npm yayımlamadan sonra yayımlanmış kayıt defteri kurulum yolunu yeni bir geçici prefix içinde doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  komutunu (veya eşleşen beta/düzeltme sürümünü) çalıştırın
- Beta yayımlamadan sonra, paylaşılan kiralanmış Telegram kimlik bilgisi havuzunu kullanarak yayımlanmış npm paketine karşı kurulu paket onboarding'ini, Telegram kurulumunu ve gerçek Telegram E2E'yi doğrulamak için `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` komutunu çalıştırın. Yerel bakımcı tek seferlik çalıştırmaları Convex değişkenlerini atlayabilir ve üç `OPENCLAW_QA_TELEGRAM_*` ortam kimlik bilgisini doğrudan geçebilir.
- Bir bakımcı makinesinden tam yayımlama sonrası beta smoke çalıştırmak için `pnpm release:beta-smoke -- --beta betaN` kullanın. Yardımcı, Parallels npm güncelleme/yeni-hedef doğrulamasını çalıştırır, `NPM Telegram Beta E2E` tetikler, tam iş akışı çalıştırmasını yoklar, yapıtı indirir ve Telegram raporunu yazdırır.
- Bakımcılar aynı yayımlama sonrası denetimi GitHub Actions üzerinden manuel `NPM Telegram Beta E2E` iş akışıyla çalıştırabilir. Bu kasıtlı olarak yalnızca manueldir ve her merge işleminde çalışmaz.
- Bakımcı sürüm otomasyonu artık önce ön kontrol-sonra terfi kullanır:
  - gerçek npm yayımlaması başarılı bir npm `preflight_run_id` geçmelidir
  - gerçek npm yayımlaması, başarılı ön kontrol çalıştırmasıyla aynı `main` veya
    `release/YYYY.M.D` dalından tetiklenmelidir
  - kararlı npm sürümleri varsayılan olarak `beta` kullanır
  - kararlı npm yayımlama, iş akışı girdisiyle açıkça `latest` hedefleyebilir
  - token tabanlı npm dist-tag değişikliği artık güvenlik için
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    içinde bulunur; çünkü `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirirken herkese açık repo yalnızca OIDC yayımlamayı korur
  - herkese açık `macOS Release` yalnızca doğrulama amaçlıdır; bir etiket yalnızca bir sürüm dalında yaşıyorsa ancak iş akışı `main` üzerinden tetikleniyorsa
    `public_release_branch=release/YYYY.M.D` ayarlayın
  - gerçek özel mac yayımlaması başarılı özel mac
    `preflight_run_id` ve `validate_run_id` geçmelidir
  - gerçek yayımlama yolları hazırlanmış yapıtları yeniden derlemek yerine terfi ettirir
- `YYYY.M.D-N` gibi kararlı düzeltme sürümleri için, yayımlama sonrası doğrulayıcı aynı geçici-prefix yükseltme yolunu `YYYY.M.D` sürümünden `YYYY.M.D-N` sürümüne de denetler; böylece sürüm düzeltmeleri eski global kurulumları sessizce temel kararlı payload üzerinde bırakamaz
- npm sürüm ön kontrolü, tarball hem `dist/control-ui/index.html` hem de boş olmayan bir `dist/control-ui/assets/` payload içermedikçe kapalı şekilde başarısız olur; böylece boş bir tarayıcı panosunu tekrar göndermeyiz
- Yayımlama sonrası doğrulama ayrıca yayımlanmış Plugin giriş noktalarının ve paket metaverilerinin kurulu kayıt defteri düzeninde mevcut olduğunu denetler. Eksik Plugin çalışma zamanı payload'ları gönderen bir sürüm, postpublish doğrulayıcıda başarısız olur ve `latest` sürümüne terfi ettirilemez.
- `pnpm test:install:smoke` ayrıca aday güncelleme tarball'ı üzerinde npm pack `unpackedSize` bütçesini uygular; böylece kurulum E2E'si yanlışlıkla oluşan paket şişmesini sürüm yayımlama yolundan önce yakalar
- Sürüm çalışması CI planlamasına, uzantı zamanlama manifestlerine veya uzantı test matrislerine dokunduysa, onaydan önce `.github/workflows/plugin-prerelease.yml` içindeki planlayıcıya ait `plugin-prerelease-extension-shard` matris çıktılarını yeniden oluşturup gözden geçirin; böylece sürüm notları eski bir CI düzenini açıklamaz
- Kararlı macOS sürüm hazır olma durumu ayrıca güncelleyici yüzeylerini içerir:
  - GitHub sürümü paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` ile sonuçlanmalıdır
  - `main` üzerindeki `appcast.xml` yayımlamadan sonra yeni kararlı zip'e işaret etmelidir
  - paketlenmiş uygulama debug olmayan bir bundle id, boş olmayan bir Sparkle feed URL'si ve bu sürüm için kanonik Sparkle derleme tabanında veya üzerinde bir `CFBundleVersion` korumalıdır

## Sürüm test kutuları

`Full Release Validation`, operatörlerin tüm sürüm öncesi testleri tek bir giriş noktasından başlatma yöntemidir. Hızlı hareket eden bir dalda sabitlenmiş commit kanıtı için yardımcıyı kullanın; böylece her alt iş akışı hedef SHA'da sabitlenmiş geçici bir daldan çalışır:

```bash
pnpm ci:full-release --sha <full-sha>
```

Yardımcı `release-ci/<sha>-...` dalını iter, bu daldan `ref=<sha>` ile `Full Release Validation` tetikler, her alt iş akışı `headSha` değerinin hedefle eşleştiğini doğrular, ardından geçici dalı siler. Bu, yanlışlıkla daha yeni bir `main` alt çalıştırmasını kanıtlamayı önler.

Sürüm dalı veya etiket doğrulaması için, bunu güvenilir `main` iş akışı ref'inden çalıştırın ve sürüm dalını veya etiketini `ref` olarak geçin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

İş akışı hedef ref'i çözer, `target_ref=<release-ref>` ile manuel `CI` çalıştırmasını başlatır, `OpenClaw Release Checks` çalıştırmasını başlatır, paket odaklı kontroller için üst `release-package-under-test` artifact'ını hazırlar ve `release_profile=full` olduğunda `rerun_group=all` ile ya da `npm_telegram_package_spec` ayarlandığında bağımsız paket Telegram E2E çalıştırmasını başlatır. Ardından `OpenClaw Release Checks`; kurulum smoke, çapraz OS sürüm kontrolleri, soak etkinleştirildiğinde canlı/E2E Docker sürüm yolu kapsamı, Telegram paket QA ile Package Acceptance, QA Lab parity, canlı Matrix ve canlı Telegram alanlarına yayılır. Tam bir çalıştırma yalnızca `Full Release Validation` özetinde `normal_ci` ve `release_checks` başarılı göründüğünde kabul edilebilir. full/all modunda `npm_telegram` alt çalıştırması da başarılı olmalıdır; full/all dışında, yayımlanmış bir `npm_telegram_package_spec` sağlanmadığı sürece atlanır. Son doğrulayıcı özeti her alt çalıştırma için en yavaş iş tablolarını içerir; böylece sürüm yöneticisi logları indirmeden mevcut kritik yolu görebilir. Eksiksiz aşama matrisi, tam iş akışı job adları, stable ile full profil farkları, artifact'lar ve odaklı yeniden çalıştırma tanıtıcıları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın. Alt iş akışları, `Full Release Validation` çalıştıran güvenilir ref'ten, normalde `--ref main` üzerinden başlatılır; hedef `ref` daha eski bir sürüm dalını veya tag'i gösterse bile bu geçerlidir. Ayrı bir Full Release Validation iş akışı ref girdisi yoktur; güvenilir harness'i iş akışı çalıştırma ref'ini seçerek seçin. Hareket eden `main` üzerinde kesin commit kanıtı için `--ref main -f ref=<sha>` kullanmayın; ham commit SHA'ları iş akışı dispatch ref'i olamaz, bu nedenle sabitlenmiş geçici dalı oluşturmak için `pnpm ci:full-release --sha <sha>` kullanın.

Canlı/provider kapsamını seçmek için `release_profile` kullanın:

- `minimum`: en hızlı sürüm açısından kritik OpenAI/core canlı ve Docker yolu
- `stable`: sürüm onayı için minimuma ek olarak stable provider/backend kapsamı
- `full`: stable'a ek olarak geniş advisory provider/medya kapsamı

Sürüm engelleyici şeritler yeşil olduğunda ve yükseltme öncesinde kapsamlı canlı/E2E, Docker sürüm yolu ve sınırlı yayımlanmış upgrade-survivor taramasını istediğinizde `stable` ile `run_release_soak=true` kullanın. Bu tarama en son dört stable paketi, sabitlenmiş `2026.4.23` ve `2026.5.2` baseline'larını ve daha eski `2026.4.15` kapsamını içerir; yinelenen baseline'lar kaldırılır ve her baseline kendi Docker runner job'una shard edilir. `full`, `run_release_soak=true` anlamına gelir.

`OpenClaw Release Checks`, hedef ref'i bir kez `release-package-under-test` olarak çözmek için güvenilir iş akışı ref'ini kullanır ve soak çalıştığında bu artifact'ı çapraz OS, Package Acceptance ve sürüm yolu Docker kontrollerinde yeniden kullanır. Bu, tüm paket odaklı kutuları aynı baytlarda tutar ve tekrarlanan paket derlemelerini önler. Çapraz OS OpenAI kurulum smoke, repo/org değişkeni ayarlandığında `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır; aksi halde `openai/gpt-5.4` kullanır, çünkü bu şerit en yavaş varsayılan modeli benchmark etmek yerine paket kurulumunu, onboarding'i, gateway başlangıcını ve bir canlı agent turunu kanıtlar. Daha geniş canlı provider matrisi, modele özgü kapsamın yeridir.

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

Odaklı bir düzeltmeden sonraki ilk yeniden çalıştırma olarak tam şemsiyeyi kullanmayın. Bir kutu başarısız olursa sonraki kanıt için başarısız alt iş akışını, job'u, Docker şeridini, paket profilini, model provider'ını veya QA şeridini kullanın. Tam şemsiyeyi yalnızca düzeltme paylaşılan sürüm orkestrasyonunu değiştirdiğinde veya önceki tüm-kutu kanıtını bayatlattığında tekrar çalıştırın. Şemsiyenin son doğrulayıcısı kaydedilen alt iş akışı çalıştırma id'lerini yeniden kontrol eder; bu nedenle bir alt iş akışı başarıyla yeniden çalıştırıldıktan sonra yalnızca başarısız `Verify full validation` üst job'unu yeniden çalıştırın.

Sınırlı kurtarma için şemsiyeye `rerun_group` geçin. `all` gerçek release-candidate çalıştırmasıdır, `ci` yalnızca normal CI alt çalıştırmasını çalıştırır, `plugin-prerelease` yalnızca sürüme özel plugin alt çalıştırmasını çalıştırır, `release-checks` her sürüm kutusunu çalıştırır ve daha dar sürüm grupları `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ve `npm-telegram` değerleridir. Odaklı `npm-telegram` yeniden çalıştırmaları `npm_telegram_package_spec` gerektirir; `release_profile=full` ile full/all çalıştırmaları release-checks paket artifact'ını kullanır. Odaklı çapraz OS yeniden çalıştırmaları `cross_os_suite_filter=windows/packaged-upgrade` veya başka bir OS/suite filtresi ekleyebilir. QA release-check başarısızlıkları advisory niteliğindedir; yalnızca QA başarısızlığı sürüm doğrulamasını engellemez.

### Vitest

Vitest kutusu manuel `CI` alt iş akışıdır. Manuel CI, release candidate için değişiklik kapsamını bilerek atlar ve normal test grafiğini zorunlu kılar: Linux Node shard'ları, bundled-plugin shard'ları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, build smoke, docs kontrolleri, Python skills, Windows, macOS, Android ve Control UI i18n.

Bu kutuyu "kaynak ağacı tam normal test paketinden geçti mi?" sorusunu yanıtlamak için kullanın. Bu, sürüm yolu ürün doğrulamasıyla aynı şey değildir. Saklanacak kanıtlar:

- Başlatılan `CI` çalıştırma URL'sini gösteren `Full Release Validation` özeti
- Tam hedef SHA üzerinde yeşil `CI` çalıştırması
- Regresyonları incelerken CI job'larından başarısız veya yavaş shard adları
- Bir çalıştırmanın performans analizi gerektiğinde `.artifacts/vitest-shard-timings.json` gibi Vitest zamanlama artifact'ları

Manuel CI'ı doğrudan yalnızca sürümün deterministik normal CI'a ihtiyacı olduğunda ancak Docker, QA Lab, canlı, çapraz OS veya paket kutularına ihtiyacı olmadığında çalıştırın:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker kutusu, `OpenClaw Release Checks` içinde `openclaw-live-and-e2e-checks-reusable.yml` üzerinden ve sürüm modu `install-smoke` iş akışında bulunur. Release candidate'ı yalnızca kaynak düzeyi testler yerine paketlenmiş Docker ortamları üzerinden doğrular.

Sürüm Docker kapsamı şunları içerir:

- Yavaş Bun global install smoke etkinleştirilmiş tam kurulum smoke
- Hedef SHA'ya göre kök Dockerfile smoke image hazırlama/yeniden kullanma; QR, root/gateway ve installer/Bun smoke job'ları ayrı install-smoke shard'ları olarak çalışır
- Repository E2E şeritleri
- Sürüm yolu Docker parçaları: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g` ve `plugins-runtime-install-h`
- İstendiğinde `plugins-runtime-services` parçası içinde OpenWebUI kapsamı
- `bundled-plugin-install-uninstall-0` ile `bundled-plugin-install-uninstall-23` arasında bölünmüş bundled plugin kurulum/kaldırma şeritleri
- Sürüm kontrolleri canlı suite'leri içerdiğinde canlı/E2E provider suite'leri ve Docker canlı model kapsamı

Yeniden çalıştırmadan önce Docker artifact'larını kullanın. Sürüm yolu zamanlayıcısı, şerit logları, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı plan JSON'u ve yeniden çalıştırma komutları ile `.artifacts/docker-tests/` yükler. Odaklı kurtarma için tüm sürüm parçalarını yeniden çalıştırmak yerine yeniden kullanılabilir canlı/E2E iş akışında `docker_lanes=<lane[,lane]>` kullanın. Üretilen yeniden çalıştırma komutları, kullanılabilir olduğunda önceki `package_artifact_run_id` ve hazırlanmış Docker image girdilerini içerir; böylece başarısız bir şerit aynı tarball'ı ve GHCR image'larını yeniden kullanabilir.

### QA Lab

QA Lab kutusu da `OpenClaw Release Checks` parçasıdır. Vitest ve Docker paket mekaniklerinden ayrı olarak agentic davranış ve kanal düzeyi sürüm kapısıdır.

Sürüm QA Lab kapsamı şunları içerir:

- Agentic parity pack kullanarak OpenAI candidate şeridini Opus 4.6 baseline ile karşılaştıran mock parity şeridi
- `qa-live-shared` ortamını kullanan hızlı canlı Matrix QA profili
- Convex CI credential lease'leri kullanan canlı Telegram QA şeridi
- Sürüm telemetrisinin açık yerel kanıta ihtiyacı olduğunda `pnpm qa:otel:smoke`

Bu kutuyu "sürüm QA senaryolarında ve canlı kanal akışlarında doğru davranıyor mu?" sorusunu yanıtlamak için kullanın. Sürümü onaylarken parity, Matrix ve Telegram şeritleri için artifact URL'lerini saklayın. Tam Matrix kapsamı, varsayılan sürüm açısından kritik şerit yerine manuel shard edilmiş QA-Lab çalıştırması olarak kullanılabilir kalır.

### Paket

Paket kutusu kurulabilir ürün kapısıdır. `Package Acceptance` ve resolver `scripts/resolve-openclaw-package-candidate.mjs` tarafından desteklenir. Resolver bir candidate'ı Docker E2E tarafından tüketilen `package-under-test` tarball'ına normalleştirir, paket envanterini doğrular, paket sürümünü ve SHA-256 değerini kaydeder ve iş akışı harness ref'ini paket kaynak ref'inden ayrı tutar.

Desteklenen candidate kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya tam bir OpenClaw sürüm versiyonu
- `source=ref`: seçilen `workflow_ref` harness ile güvenilir bir `package_ref` dalını, tag'ini veya tam commit SHA'sını paketle
- `source=url`: gerekli `package_sha256` ile bir HTTPS `.tgz` indir
- `source=artifact`: başka bir GitHub Actions çalıştırması tarafından yüklenen bir `.tgz` dosyasını yeniden kullan

`OpenClaw Release Checks`, Package Acceptance'ı `source=artifact`, hazırlanmış sürüm paket artifact'ı, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`, `telegram_mode=mock-openai` ile çalıştırır. Package Acceptance; migration, update, yapılandırılmış-auth update restart, eski plugin bağımlılığı temizliği, çevrimdışı plugin fixture'ları, plugin update ve Telegram paket QA işlemlerini aynı çözülmüş tarball'a karşı tutar. Engelleyici sürüm kontrolleri varsayılan en son yayımlanmış paket baseline'ını kullanır; `run_release_soak=true` veya `release_profile=full`, `2026.4.23` ile `latest` arasındaki her stable npm'de yayımlanmış baseline'a ve raporlanmış sorun fixture'larına genişler. Zaten gönderilmiş bir candidate için `source=npm` ile Package Acceptance kullanın veya yayımlamadan önce SHA destekli yerel npm tarball'ı için `source=ref`/`source=artifact` kullanın. Bu, daha önce Parallels gerektiren paket/update kapsamının çoğu için GitHub-native alternatiftir. Çapraz OS sürüm kontrolleri OS'e özgü onboarding, installer ve platform davranışı için hâlâ önemlidir, ancak paket/update ürün doğrulaması Package Acceptance'ı tercih etmelidir.

Update ve plugin doğrulaması için kanonik kontrol listesi [Güncellemeleri ve pluginleri test etme](/tr/help/testing-updates-plugins) bölümüdür. Bir plugin kurulumu/update'i, doctor temizliği veya yayımlanmış paket migration değişikliğini hangi yerel, Docker, Package Acceptance veya release-check şeridinin kanıtladığına karar verirken bunu kullanın. Her stable `2026.4.23+` paketinden kapsamlı yayımlanmış update migration, Full Release CI'ın parçası değil, ayrı bir manuel `Update Migration` iş akışıdır.

Eski paket kabul esnekliği kasıtlı olarak zamanla sınırlandırılmıştır. `2026.4.25` dahil paketler, npm üzerinde zaten yayımlanmış metadata boşlukları için uyumluluk yolunu kullanabilir: tarball içinde eksik özel QA envanter girdileri, eksik `gateway install --wrapper`, tarball türetilmiş git fixture içinde eksik yama dosyaları, eksik kalıcı `update.channel`, eski Plugin kurulum kaydı konumları, eksik marketplace kurulum kaydı kalıcılığı ve `plugins update` sırasında yapılandırma metadata geçişi. Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel derleme metadata damga dosyaları için uyarı verebilir. Daha sonraki paketler modern paket sözleşmelerini karşılamalıdır; aynı boşluklar release doğrulamasında başarısız olur.

Release sorusu gerçek kurulabilir bir paketle ilgili olduğunda daha geniş Package Acceptance profillerini kullanın:

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

- `smoke`: hızlı paket kurulum/kanal/ajan, Gateway ağı ve yapılandırma yeniden yükleme hatları
- `package`: canlı ClawHub olmadan kurulum/güncelleme/yeniden başlatma/Plugin paket sözleşmeleri; bu release denetimi varsayılanıdır
- `product`: `package` artı MCP kanalları, cron/alt ajan temizliği, OpenAI web araması ve OpenWebUI
- `full`: OpenWebUI ile Docker release yolu parçaları
- `custom`: odaklı yeniden çalıştırmalar için tam `docker_lanes` listesi

Paket adayı Telegram kanıtı için Package Acceptance üzerinde `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` etkinleştirin. İş akışı, çözümlenen `package-under-test` tarball dosyasını Telegram hattına geçirir; bağımsız Telegram iş akışı, yayın sonrası kontroller için yayımlanmış npm belirtimini hâlâ kabul eder.

## Release yayımlama otomasyonu

`OpenClaw Release Publish` normal değişiklik yapan yayımlama giriş noktasıdır. Güvenilir yayımcı iş akışlarını release’in ihtiyaç duyduğu sırayla düzenler:

1. Release etiketini checkout yapın ve commit SHA değerini çözümleyin.
2. Etiketin `main` veya `release/*` üzerinden erişilebilir olduğunu doğrulayın.
3. `pnpm plugins:sync:check` çalıştırın.
4. `Plugin NPM Release` iş akışını `publish_scope=all-publishable` ve `ref=<release-sha>` ile tetikleyin.
5. `Plugin ClawHub Release` iş akışını aynı kapsam ve SHA ile tetikleyin.
6. Release etiketi, npm dist-tag ve kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` iş akışını tetikleyin.

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

Doğrudan `latest` sürümüne kararlı yükseltme açıkça belirtilir:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Daha düşük seviyeli `Plugin NPM Release` ve `Plugin ClawHub Release` iş akışlarını yalnızca odaklı onarım veya yeniden yayımlama işleri için kullanın. Seçili bir Plugin onarımı için `OpenClaw Release Publish` iş akışına `plugin_publish_scope=selected` ve `plugins=@openclaw/name` geçirin veya OpenClaw paketi yayımlanmamalıysa alt iş akışını doğrudan tetikleyin.

## NPM iş akışı girdileri

`OpenClaw NPM Release` operatör tarafından denetlenen şu girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya `v2026.4.2-beta.1` gibi zorunlu release etiketi; `preflight_only=true` olduğunda, yalnızca doğrulama amaçlı ön denetim için geçerli tam 40 karakterlik iş akışı dalı commit SHA değeri de olabilir
- `preflight_only`: yalnızca doğrulama/derleme/paket için `true`, gerçek yayımlama yolu için `false`
- `preflight_run_id`: iş akışının başarılı ön denetim çalıştırmasından hazırlanmış tarball dosyasını yeniden kullanması için gerçek yayımlama yolunda zorunludur
- `npm_dist_tag`: yayımlama yolu için npm hedef etiketi; varsayılanı `beta`

`OpenClaw Release Publish` operatör tarafından denetlenen şu girdileri kabul eder:

- `tag`: zorunlu release etiketi; zaten var olmalıdır
- `preflight_run_id`: başarılı `OpenClaw NPM Release` ön denetim çalıştırma kimliği; `publish_openclaw_npm=true` olduğunda zorunludur
- `npm_dist_tag`: OpenClaw paketi için npm hedef etiketi
- `plugin_publish_scope`: varsayılanı `all-publishable`; `selected` yalnızca odaklı onarım işi için kullanılmalıdır
- `plugins`: `plugin_publish_scope=selected` olduğunda virgülle ayrılmış `@openclaw/*` paket adları
- `publish_openclaw_npm`: varsayılanı `true`; yalnızca iş akışını sadece Plugin onarım düzenleyicisi olarak kullanırken `false` olarak ayarlayın

`OpenClaw Release Checks` operatör tarafından denetlenen şu girdileri kabul eder:

- `ref`: doğrulanacak dal, etiket veya tam commit SHA. Secret içeren kontroller, çözümlenen commit’in bir OpenClaw dalından veya release etiketinden erişilebilir olmasını gerektirir.
- `run_release_soak`: kararlı/varsayılan release kontrollerinde kapsamlı canlı/E2E, Docker release yolu ve tüm-geçmişten yükseltme-sağ kalan soak kapsamını etkinleştirir. `release_profile=full` tarafından zorunlu kılınır.

Kurallar:

- Kararlı ve düzeltme etiketleri `beta` veya `latest` etiketlerinden birine yayımlanabilir
- Beta ön release etiketleri yalnızca `beta` etiketine yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` ve `Full Release Validation` her zaman yalnızca doğrulama amaçlıdır
- Gerçek yayımlama yolu, ön denetim sırasında kullanılan aynı `npm_dist_tag` değerini kullanmalıdır; iş akışı, yayımlamadan önce metadata değerinin devam ettiğini doğrular

## Kararlı npm release sırası

Kararlı bir npm release’i çıkarırken:

1. `OpenClaw NPM Release` iş akışını `preflight_only=true` ile çalıştırın
   - Etiket oluşmadan önce, ön denetim iş akışının yalnızca doğrulama amaçlı kuru çalıştırması için geçerli tam iş akışı dalı commit SHA değerini kullanabilirsiniz
2. Normal önce-beta akışı için `npm_dist_tag=beta` seçin veya yalnızca doğrudan kararlı yayımlamayı kasıtlı olarak istediğinizde `latest` seçin
3. Tek bir manuel iş akışından normal CI artı canlı prompt önbelleği, Docker, QA Lab, Matrix ve Telegram kapsamı istediğinizde `Full Release Validation` iş akışını release dalı, release etiketi veya tam commit SHA üzerinde çalıştırın
4. Kasıtlı olarak yalnızca deterministik normal test grafiğine ihtiyacınız varsa bunun yerine release ref üzerinde manuel `CI` iş akışını çalıştırın
5. Başarılı `preflight_run_id` değerini kaydedin
6. Aynı `tag`, aynı `npm_dist_tag` ve kaydedilmiş `preflight_run_id` ile `OpenClaw Release Publish` iş akışını çalıştırın; OpenClaw npm paketini yükseltmeden önce dışsallaştırılmış Plugin’leri npm ve ClawHub’a yayımlar
7. Release `beta` üzerinde yayımlandıysa, kararlı sürümü `beta` değerinden `latest` değerine yükseltmek için özel `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` iş akışını kullanın
8. Release kasıtlı olarak doğrudan `latest` üzerine yayımlandıysa ve `beta` hemen aynı kararlı derlemeyi izlemeliyse, iki dist-tag’i de kararlı sürüme yönlendirmek için aynı özel iş akışını kullanın veya zamanlanmış kendi kendini iyileştiren eşitlemesinin `beta` değerini daha sonra taşımasına izin verin

Dist-tag değişikliği güvenlik nedeniyle özel repoda yaşar, çünkü hâlâ `NPM_TOKEN` gerektirir; public repo ise yalnızca OIDC yayımlamasını korur.

Bu, doğrudan yayımlama yolunu ve önce-beta yükseltme yolunu hem belgelenmiş hem de operatör tarafından görünür tutar.

Bir maintainer yerel npm kimlik doğrulamasına geri dönmek zorundaysa, 1Password CLI (`op`) komutlarını yalnızca ayrılmış bir tmux oturumu içinde çalıştırın. Ana ajan kabuğundan doğrudan `op` çağırmayın; tmux içinde tutmak istemleri, uyarıları ve OTP işlemeyi gözlemlenebilir kılar ve yinelenen host uyarılarını önler.

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

Maintainer’lar, gerçek runbook için özel release dokümanlarını
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
konumunda kullanır.

## İlgili

- [Release kanalları](/tr/install/development-channels)
