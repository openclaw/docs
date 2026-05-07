---
read_when:
    - Herkese açık sürüm kanalı tanımları aranıyor
    - Sürüm doğrulamasını veya paket kabulünü çalıştırma
    - Sürüm adlandırması ve yayın temposu aranıyor
    - Aylık destek veya LTS sürüm serilerini planlama
summary: Yayın hatları, operatör kontrol listesi, doğrulama kutuları, sürüm adlandırması, planlanan aylık destek hatları ve tempo
title: Sürüm politikası
x-i18n:
    generated_at: "2026-05-07T01:54:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbd86faf2aa3eeeb465203431c19c778719f291a2e2732fca1463bde89e42e80
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw'ın üç herkese açık yayın hattı vardır:

- stable: varsayılan olarak npm `beta` kanalına, açıkça istendiğinde ise npm `latest` kanalına yayımlanan etiketli sürümler
- beta: npm `beta` kanalına yayımlanan ön sürüm etiketleri
- dev: `main` dalının hareketli en güncel başı

## Sürüm adlandırması

- Kararlı yayın sürümü: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Eski kararlı düzeltme yayın sürümü: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön sürüm sürümü: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ay veya günü sıfırla doldurmayın
- `latest`, mevcut öne çıkarılmış kararlı npm yayını anlamına gelir
- `beta`, mevcut beta kurulum hedefi anlamına gelir
- Kararlı ve eski düzeltme sürümleri varsayılan olarak npm `beta` kanalına yayımlanır; yayın operatörleri açıkça `latest` hedefleyebilir veya incelenmiş bir beta derlemesini daha sonra öne çıkarabilir
- Her kararlı OpenClaw sürümü npm paketini ve macOS uygulamasını birlikte sunar;
  beta sürümleri normalde önce npm/paket yolunu doğrular ve yayımlar, mac
  uygulamasının derleme/imzalama/noter onayı ise açıkça istenmedikçe kararlı sürüme ayrılır

### Planlanan aylık destek sürümlendirmesi

OpenClaw henüz LTS veya aylık destek kanalına sahip değildir. Bakımcılar
SemVer uyumlu aylık destek hatlarına doğru çalışıyor, ancak bugün sunulan
güncelleme kanalları hâlâ `stable`, `beta` ve `dev` kanallarıdır.

Planlanan sürüm biçimi `YYYY.M.PATCH` şeklindedir:

- `YYYY` yıldır.
- `M`, başında sıfır olmadan aylık yayın hattıdır.
- `PATCH`, o aylık hat içinde artar ve gerektiği kadar yükselebilir.

Örneğin, `2026.6.0`, `2026.6.1` ve `2026.6.2` sürümlerinin tümü Haziran
2026 hattında olurdu. `stable-2026-6` veya `lts-2026-6` gibi gelecekteki bir
aylık destek dist-tag'i o hattı gösterebilirken, `latest` hızlı hareket etmeye devam eder.

Bu gelecek model, yeni `YYYY.M.D-N` düzeltme sürümlerine duyulan ihtiyacı ortadan kaldırır.
Mevcut eski düzeltme sürümleri tanınmaya devam eder, böylece eski paketler ve
yükseltme yolları çalışmayı sürdürür.

## Yayın sıklığı

- Yayınlar önce beta olarak ilerler
- Kararlı sürüm yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar normalde yayınları mevcut `main` dalından oluşturulan bir
  `release/YYYY.M.D` dalından çıkarır; böylece yayın doğrulaması ve düzeltmeleri
  `main` üzerindeki yeni geliştirmeleri engellemez
- Bir beta etiketi gönderilmiş veya yayımlanmışsa ve düzeltme gerekiyorsa,
  bakımcılar eski beta etiketini silmek veya yeniden oluşturmak yerine
  bir sonraki `-beta.N` etiketini çıkarır
- Ayrıntılı yayın prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca bakımcılara özeldir

## Yayın operatörü kontrol listesi

Bu kontrol listesi, yayın akışının herkese açık biçimidir. Özel kimlik bilgileri,
imzalama, noter onayı, dist-tag kurtarma ve acil geri alma ayrıntıları
yalnızca bakımcılara özel yayın runbook'unda kalır.

1. Mevcut `main` dalından başlayın: en son değişiklikleri çekin, hedef commit'in gönderildiğini
   onaylayın ve mevcut `main` CI'ın ondan dal oluşturmak için yeterince yeşil olduğunu doğrulayın.
2. En üstteki `CHANGELOG.md` bölümünü gerçek commit geçmişinden `/changelog` ile yeniden yazın,
   girdileri kullanıcıya yönelik tutun, commit'leyin, gönderin ve dal oluşturmadan önce
   bir kez daha rebase/pull yapın.
3. Yayın uyumluluğu kayıtlarını
   `src/plugins/compat/registry.ts` ve
   `src/commands/doctor/shared/deprecation-compat.ts` içinde gözden geçirin. Süresi dolmuş
   uyumluluğu yalnızca yükseltme yolu kapsanmaya devam ettiğinde kaldırın veya neden
   kasıtlı olarak taşındığını kaydedin.
4. Mevcut `main` üzerinden `release/YYYY.M.D` oluşturun; normal yayın işini
   doğrudan `main` üzerinde yapmayın.
5. Amaçlanan etiket için gerekli her sürüm konumunu yükseltin, yayımlanabilir Plugin paketlerinin yayın
   sürümünü ve uyumluluk metaverilerini paylaşması için `pnpm plugins:sync` çalıştırın, ardından yerel deterministik ön kontrolü çalıştırın:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` ve
   `pnpm release:check`.
6. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın. Etiket var olmadan önce,
   yalnızca doğrulama amaçlı ön kontrol için tam 40 karakterlik yayın dalı SHA'sına izin verilir.
   Başarılı `preflight_run_id` değerini kaydedin.
7. Yayın dalı, etiketi veya tam commit SHA'sı için `Full Release Validation` ile
   tüm yayın öncesi testleri başlatın. Bu, dört büyük yayın test kutusu için tek manuel giriş noktasıdır:
   Vitest, Docker, QA Lab ve Package.
8. Doğrulama başarısız olursa, yayın dalında düzeltin ve düzeltmeyi kanıtlayan en küçük başarısız
   dosyayı, hattı, iş akışı işini, paket profilini, sağlayıcıyı veya model izin listesini yeniden çalıştırın.
   Tam şemsiyeyi yalnızca değişen yüzey önceki kanıtı bayatlattığında yeniden çalıştırın.
9. Beta için `vYYYY.M.D-beta.N` etiketini oluşturun, ardından eşleşen
   `release/YYYY.M.D` dalından `OpenClaw Release Publish` çalıştırın. Bu, `pnpm plugins:sync:check` doğrulaması yapar,
   tüm yayımlanabilir Plugin paketlerini paralel olarak npm'e ve aynı kümeyi
   ClawHub'a gönderir, ardından Plugin npm yayımı başarılı olur olmaz hazırlanan OpenClaw npm ön kontrol
   artefaktını eşleşen dist-tag ile öne çıkarır.
   ClawHub yayımı OpenClaw npm yayımlanırken hâlâ çalışıyor olabilir, ancak
   yayın yayımlama iş akışı hem Plugin yayımlama yolları hem de
   OpenClaw npm yayımlama yolu başarıyla tamamlanmadan bitmez. Yayımdan sonra,
   yayımlanan `openclaw@YYYY.M.D-beta.N` veya
   `openclaw@beta` paketine karşı yayım sonrası paket
   kabulünü çalıştırın. Gönderilmiş veya yayımlanmış bir ön sürüm düzeltme gerektirirse,
   bir sonraki eşleşen ön sürüm numarasını çıkarın; eski
   ön sürümü silmeyin veya yeniden yazmayın.
10. Kararlı sürüm için yalnızca incelenmiş beta veya yayın adayı gerekli
    doğrulama kanıtına sahip olduktan sonra devam edin. Kararlı npm yayımı da
    `OpenClaw Release Publish` üzerinden gider ve başarılı ön kontrol artefaktını
    `preflight_run_id` aracılığıyla yeniden kullanır; kararlı macOS yayın hazır oluşu ayrıca
    paketlenmiş `.zip`, `.dmg`, `.dSYM.zip` ve güncellenmiş `appcast.xml` dosyasının `main` üzerinde olmasını gerektirir.
11. Yayımdan sonra npm yayım sonrası doğrulayıcıyı, yayım sonrası kanal kanıtına ihtiyaç duyduğunuzda isteğe bağlı bağımsız
    yayımlanmış-npm Telegram E2E'yi,
    gerektiğinde dist-tag öne çıkarmayı, eksiksiz eşleşen `CHANGELOG.md` bölümünden
    GitHub yayın/ön sürüm notlarını ve yayın duyurusu
    adımlarını çalıştırın.

## Yayın ön kontrolü

- Daha hızlı yerel `pnpm check` kapısı dışında test TypeScript kapsamının korunması için sürüm ön kontrolünden önce `pnpm check:test-types` çalıştırın
- Daha hızlı yerel kapı dışında daha geniş import döngüsü ve mimari sınır kontrollerinin yeşil olması için sürüm ön kontrolünden önce `pnpm check:architecture` çalıştırın
- Paket doğrulama adımı için beklenen `dist/*` sürüm yapıtları ve Control UI paketi mevcut olsun diye `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın
- Kök sürüm artışından sonra ve etiketlemeden önce `pnpm plugins:sync` çalıştırın. Bu komut yayınlanabilir Plugin paket sürümlerini, OpenClaw peer/API uyumluluk metadatasını, derleme metadatasını ve Plugin değişiklik günlüğü taslaklarını çekirdek sürümle eşleşecek şekilde günceller. `pnpm plugins:sync:check`, değişiklik yapmayan sürüm korumasıdır; bu adım unutulursa yayın iş akışı herhangi bir registry mutasyonundan önce başarısız olur.
- Sürüm onayından önce tüm sürüm öncesi test kutularını tek giriş noktasından başlatmak için manuel `Full Release Validation` iş akışını çalıştırın. Bir branch, tag veya tam commit SHA kabul eder, manuel `CI` gönderir ve kurulum smoke testi, paket kabulü, çapraz işletim sistemi paket kontrolleri, QA Lab parity, Matrix ve Telegram hatları için `OpenClaw Release Checks` gönderir. Kararlı/varsayılan çalıştırmalar, kapsamlı canlı/E2E ve Docker sürüm yolu bekletmesini `run_release_soak=true` arkasında tutar; `release_profile=full` bekletmeyi zorlar. `release_profile=full` ve `rerun_group=all` ile, sürüm kontrollerinden gelen `release-package-under-test` yapıtına karşı paket Telegram E2E de çalıştırır. Aynı Telegram E2E'nin yayımlanan npm paketini de doğrulaması gerektiğinde yayından sonra `npm_telegram_package_spec` sağlayın. Package Acceptance'ın paket/güncelleme matrisini SHA ile derlenmiş yapıt yerine gönderilmiş npm paketine karşı çalıştırması gerektiğinde yayından sonra `package_acceptance_package_spec` sağlayın. Özel kanıt raporunun, Telegram E2E'yi zorlamadan doğrulamanın yayımlanmış bir npm paketiyle eşleştiğini kanıtlaması gerektiğinde `evidence_package_spec` sağlayın. Örnek: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Sürüm çalışması devam ederken bir paket adayı için yan kanal kanıtı istediğinizde manuel `Package Acceptance` iş akışını çalıştırın. `openclaw@beta`, `openclaw@latest` veya tam bir sürüm için `source=npm`; mevcut `workflow_ref` test düzeneğiyle güvenilir bir `package_ref` branch/tag/SHA paketlemek için `source=ref`; zorunlu SHA-256 içeren bir HTTPS tarball için `source=url`; ya da başka bir GitHub Actions çalıştırması tarafından yüklenen tarball için `source=artifact` kullanın. İş akışı adayı `package-under-test` olarak çözümler, Docker E2E sürüm zamanlayıcısını bu tarball'a karşı yeniden kullanır ve aynı tarball'a karşı `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` ile Telegram QA çalıştırabilir. Seçilen Docker hatları `published-upgrade-survivor` içerdiğinde, paket yapıtı adaydır ve `published_upgrade_survivor_baseline` yayımlanmış temeli seçer. `update-restart-auth`, aday paketi hem kurulu CLI hem de package-under-test olarak kullanır; böylece aday güncelleme komutunun yönetilen yeniden başlatma yolunu test eder.
  Örnek: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Yaygın profiller:
  - `smoke`: kurulum/kanal/agent, gateway ağı ve config reload hatları
  - `package`: OpenWebUI veya canlı ClawHub olmadan yapıt yerelinde paket/güncelleme/yeniden başlatma/Plugin hatları
  - `product`: paket profiline ek olarak MCP kanalları, cron/subagent temizliği, OpenAI web araması ve OpenWebUI
  - `full`: OpenWebUI ile Docker sürüm yolu parçaları
  - `custom`: odaklı yeniden çalıştırma için tam `docker_lanes` seçimi
- Sürüm adayı için yalnızca tam normal CI kapsamına ihtiyacınız olduğunda manuel `CI` iş akışını doğrudan çalıştırın. Manuel CI gönderimleri değişiklik kapsamını atlar ve Linux Node parçalarını, paketlenmiş Plugin parçalarını, kanal contract'larını, Node 22 uyumluluğunu, `check`, `check-additional`, build smoke testini, doküman kontrollerini, Python Skills'i, Windows, macOS, Android ve Control UI i18n hatlarını zorlar.
  Örnek: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Sürüm telemetrisini doğrularken `pnpm qa:otel:smoke` çalıştırın. QA-lab'i yerel bir OTLP/HTTP receiver üzerinden çalıştırır ve dışa aktarılan trace span adlarını, sınırlı attribute'ları ve içerik/tanımlayıcı redaksiyonunu Opik, Langfuse veya başka bir harici collector gerektirmeden doğrular.
- Her etiketli sürümden önce `pnpm release:check` çalıştırın
- Etiket mevcut olduktan sonra mutasyon yapan yayın dizisi için `OpenClaw Release Publish` çalıştırın. Bunu `release/YYYY.M.D` üzerinden gönderin (veya main üzerinden erişilebilir bir tag yayımlıyorsanız `main`), sürüm tag'ini ve başarılı OpenClaw npm `preflight_run_id` değerini geçin ve odaklı bir onarımı bilerek çalıştırmadığınız sürece varsayılan Plugin yayın kapsamını `all-publishable` olarak tutun. İş akışı Plugin npm yayını, Plugin ClawHub yayını ve OpenClaw npm yayınını sıraya koyar; böylece çekirdek paket dışsallaştırılmış Plugin'lerinden önce yayımlanmaz.
- Sürüm kontrolleri artık ayrı bir manuel iş akışında çalışır:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`, sürüm onayından önce QA Lab mock parity hattını ve hızlı canlı Matrix profili ile Telegram QA hattını da çalıştırır. Canlı hatlar `qa-live-shared` environment'ını kullanır; Telegram ayrıca Convex CI kimlik bilgisi kiralamalarını kullanır. Tam Matrix taşıma, medya ve E2EE envanterini paralel istediğinizde manuel `QA-Lab - All Lanes` iş akışını `matrix_profile=all` ve `matrix_shards=true` ile çalıştırın.
- Çapraz işletim sistemi kurulum ve yükseltme runtime doğrulaması, yeniden kullanılabilir iş akışını doğrudan çağıran herkese açık `OpenClaw Release Checks` ve `Full Release Validation` kapsamındadır:
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Bu ayrım bilinçlidir: gerçek npm sürüm yolunu kısa, deterministik ve yapıt odaklı tutarken daha yavaş canlı kontrollerin kendi hattında kalmasını sağlar; böylece publish sürecini duraklatmaz veya engellemez
- Secret taşıyan sürüm kontrolleri `Full Release Validation` üzerinden ya da `main`/release workflow ref üzerinden gönderilmelidir; böylece iş akışı mantığı ve secret'lar kontrollü kalır
- `OpenClaw Release Checks`, çözümlenen commit bir OpenClaw branch'inden veya release tag'inden erişilebilir olduğu sürece bir branch, tag veya tam commit SHA kabul eder
- `OpenClaw NPM Release` yalnızca doğrulama amaçlı ön kontrolü, push edilmiş bir tag gerektirmeden mevcut tam 40 karakterlik workflow-branch commit SHA değerini de kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek bir yayına yükseltilemez
- SHA modunda iş akışı yalnızca paket metadata kontrolü için `v<package.json version>` üretir; gerçek publish yine gerçek bir release tag gerektirir
- Her iki iş akışı da gerçek publish ve promotion yolunu GitHub-hosted runner'larda tutarken, mutasyon yapmayan doğrulama yolu daha büyük Blacksmith Linux runner'larını kullanabilir
- Bu iş akışı hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` workflow secret'larını kullanarak
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  çalıştırır
- npm sürüm ön kontrolü artık ayrı sürüm kontrolleri hattını beklemez
- Onaydan önce `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (veya eşleşen beta/düzeltme tag'i) çalıştırın
- npm publish sonrasında yayımlanan registry kurulum yolunu temiz bir geçici prefix içinde doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (veya eşleşen beta/düzeltme sürümü) çalıştırın
- Bir beta publish sonrasında, paylaşılan kiralık Telegram kimlik bilgisi havuzunu kullanarak yayımlanan npm paketine karşı kurulu paket onboarding'ini, Telegram kurulumunu ve gerçek Telegram E2E'yi doğrulamak için `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` çalıştırın. Yerel maintainer tek seferlik çalıştırmaları Convex değişkenlerini atlayabilir ve üç `OPENCLAW_QA_TELEGRAM_*` env kimlik bilgisini doğrudan geçebilir.
- Tam yayın sonrası beta smoke testini bir maintainer makinesinden çalıştırmak için `pnpm release:beta-smoke -- --beta betaN` kullanın. Yardımcı komut Parallels npm update/fresh-target doğrulamasını çalıştırır, `NPM Telegram Beta E2E` gönderir, tam workflow run'ı poll eder, yapıtı indirir ve Telegram raporunu yazdırır.
- Maintainer'lar aynı yayın sonrası kontrolü GitHub Actions üzerinden manuel `NPM Telegram Beta E2E` iş akışıyla çalıştırabilir. Bilerek yalnızca manuel tutulur ve her merge'de çalışmaz.
- Maintainer sürüm otomasyonu artık preflight-then-promote kullanır:
  - gerçek npm publish başarılı bir npm `preflight_run_id` geçmelidir
  - gerçek npm publish, başarılı ön kontrol çalıştırmasıyla aynı `main` veya `release/YYYY.M.D` branch'inden gönderilmelidir
  - kararlı npm sürümleri varsayılan olarak `beta` kullanır
  - kararlı npm publish workflow input üzerinden açıkça `latest` hedefleyebilir
  - token tabanlı npm dist-tag mutasyonu artık güvenlik nedeniyle `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` içindedir; çünkü `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirirken public repo OIDC-only publish'i korur
  - public `macOS Release` yalnızca doğrulama içindir; bir tag yalnızca release branch'inde bulunuyorsa ama workflow `main` üzerinden gönderiliyorsa `public_release_branch=release/YYYY.M.D` ayarlayın
  - gerçek private mac publish başarılı private mac `preflight_run_id` ve `validate_run_id` geçmelidir
  - gerçek publish yolları hazırlanmış yapıtları yeniden derlemek yerine promote eder
- `YYYY.M.D-N` gibi eski kararlı düzeltme sürümleri için, post-publish doğrulayıcı aynı geçici prefix yükseltme yolunu `YYYY.M.D` sürümünden `YYYY.M.D-N` sürümüne de kontrol eder; böylece sürüm düzeltmeleri eski global kurulumları sessizce temel kararlı payload'da bırakamaz
- npm sürüm ön kontrolü, tarball hem `dist/control-ui/index.html` hem de boş olmayan bir `dist/control-ui/assets/` payload içermedikçe kapalı başarısız olur; böylece tekrar boş bir tarayıcı panosu göndermeyiz
- Post-publish doğrulaması, yayımlanmış Plugin entrypoint'lerinin ve paket metadatasının kurulu registry layout'unda mevcut olduğunu da kontrol eder. Eksik Plugin runtime payload'larıyla çıkan bir sürüm postpublish doğrulayıcıda başarısız olur ve `latest` sürümüne promote edilemez.
- `pnpm test:install:smoke`, aday güncelleme tarball'ında npm pack `unpackedSize` bütçesini de zorunlu kılar; böylece installer e2e, sürüm publish yolundan önce yanlışlıkla oluşan paket şişmesini yakalar
- Sürüm çalışması CI planlamasına, extension timing manifest'lerine veya extension test matrislerine dokunduysa, onaydan önce `.github/workflows/plugin-prerelease.yml` içinden planner-owned `plugin-prerelease-extension-shard` matris çıktılarını yeniden üretip gözden geçirin; böylece sürüm notları eski bir CI layout'unu tarif etmez
- Kararlı macOS sürüm hazırlığı updater yüzeylerini de içerir:
  - GitHub release sonunda paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` içermelidir
  - `main` üzerindeki `appcast.xml`, publish sonrasında yeni kararlı zip'e işaret etmelidir
  - paketlenmiş app, debug olmayan bundle id, boş olmayan Sparkle feed URL'si ve ilgili sürüm için canonical Sparkle build tabanına eşit veya üzerinde bir `CFBundleVersion` korumalıdır

## Sürüm test kutuları

`Full Release Validation`, operatörlerin tüm sürüm öncesi testleri tek giriş noktasından başlatma yoludur. Hızlı hareket eden bir branch üzerinde sabitlenmiş commit kanıtı için, her child workflow'un hedef SHA'ya sabitlenmiş geçici bir branch üzerinden çalışmasını sağlayan yardımcıyı kullanın:

```bash
pnpm ci:full-release --sha <full-sha>
```

Yardımcı `release-ci/<sha>-...` push eder, bu branch üzerinden `ref=<sha>` ile `Full Release Validation` gönderir, her child workflow `headSha` değerinin hedefle eşleştiğini doğrular, ardından geçici branch'i siler. Bu, yanlışlıkla daha yeni bir `main` child run'ını kanıtlamayı önler.

Release branch veya tag doğrulaması için, bunu güvenilir `main` workflow ref üzerinden çalıştırın ve release branch veya tag'i `ref` olarak geçin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

İş akışı hedef ref'i çözümler, `target_ref=<release-ref>` ile manuel `CI` çalıştırmasını başlatır, `OpenClaw Release Checks` çalıştırmasını başlatır, paket odaklı kontroller için üst `release-package-under-test` artefaktını hazırlar ve `release_profile=full` olup `rerun_group=all` ayarlandığında ya da `npm_telegram_package_spec` ayarlandığında bağımsız paket Telegram E2E çalıştırmasını başlatır. Ardından `OpenClaw Release Checks`; kurulum smoke, platformlar arası sürüm kontrolleri, soak etkinleştirildiğinde canlı/E2E Docker sürüm yolu kapsamı, Telegram paket QA ile Package Acceptance, QA Lab paritesi, canlı Matrix ve canlı Telegram kapsamına yayılır. Tam bir çalıştırma yalnızca `Full Release Validation` özetinde `normal_ci` ve `release_checks` başarılı göründüğünde kabul edilebilir. Full/all modunda `npm_telegram` alt çalıştırması da başarılı olmalıdır; full/all dışında, yayımlanmış bir `npm_telegram_package_spec` sağlanmadığı sürece atlanır. Son doğrulayıcı özeti, her alt çalıştırma için en yavaş iş tablolarını içerir; böylece sürüm yöneticisi günlükleri indirmeden mevcut kritik yolu görebilir.
Tam aşama matrisi, kesin iş akışı iş adları, stable ve full profil farkları, artefaktlar ve odaklı yeniden çalıştırma tanıtıcıları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.
Alt iş akışları, hedef `ref` daha eski bir sürüm dalını veya etiketini gösterse bile `Full Release Validation` çalıştıran güvenilir ref'ten, normalde `--ref main` üzerinden başlatılır. Ayrı bir Full Release Validation workflow-ref girdisi yoktur; güvenilir test koşumunu iş akışı çalıştırma ref'ini seçerek belirlersiniz.
Hareketli `main` üzerinde kesin commit kanıtı için `--ref main -f ref=<sha>` kullanmayın; ham commit SHA'leri workflow dispatch ref'i olamaz, bu yüzden sabitlenmiş geçici dalı oluşturmak için `pnpm ci:full-release --sha <sha>` kullanın.

Canlı/sağlayıcı genişliğini seçmek için `release_profile` kullanın:

- `minimum`: en hızlı sürüm açısından kritik OpenAI/core canlı ve Docker yolu
- `stable`: sürüm onayı için minimuma ek olarak stable sağlayıcı/backend kapsamı
- `full`: stable kapsamına ek olarak geniş danışma sağlayıcı/medya kapsamı

Sürümü engelleyen hatlar yeşil olduğunda ve terfi öncesinde kapsamlı canlı/E2E, Docker sürüm yolu ve sınırlı yayımlanmış yükseltme-kalıcılığı taraması istediğinizde `stable` ile `run_release_soak=true` kullanın. Bu tarama, en son dört stable paketin yanı sıra sabitlenmiş `2026.4.23` ve `2026.5.2` taban çizgilerini ve daha eski `2026.4.15` kapsamını içerir; yinelenen taban çizgileri kaldırılır ve her taban çizgisi kendi Docker runner işine shard edilir. `full`, `run_release_soak=true` anlamına gelir.

`OpenClaw Release Checks`, hedef ref'i bir kez `release-package-under-test` olarak çözümlemek için güvenilir iş akışı ref'ini kullanır ve soak çalıştığında bu artefaktı platformlar arası, Package Acceptance ve sürüm yolu Docker kontrollerinde yeniden kullanır. Bu, tüm paket odaklı kutuların aynı baytlar üzerinde kalmasını sağlar ve tekrarlanan paket derlemelerini önler. Platformlar arası OpenAI kurulum smoke, repo/kuruluş değişkeni ayarlandığında `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır; aksi halde `openai/gpt-5.4` kullanır, çünkü bu hat en yavaş varsayılan modeli kıyaslamaktan ziyade paket kurulumunu, onboarding'i, gateway başlangıcını ve bir canlı agent dönüşünü kanıtlar. Daha geniş canlı sağlayıcı matrisi, modele özgü kapsamın yeri olmaya devam eder.

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

Odaklı bir düzeltmeden sonraki ilk yeniden çalıştırma olarak tam şemsiyeyi kullanmayın. Bir kutu başarısız olursa, sonraki kanıt için başarısız alt iş akışını, işi, Docker hattını, paket profilini, model sağlayıcısını veya QA hattını kullanın. Tam şemsiyeyi yalnızca düzeltme paylaşılan sürüm orkestrasyonunu değiştirdiğinde veya önceki tüm kutu kanıtlarını eski hale getirdiğinde yeniden çalıştırın. Şemsiyenin son doğrulayıcısı kaydedilen alt iş akışı çalıştırma kimliklerini yeniden kontrol eder; bu nedenle bir alt iş akışı başarıyla yeniden çalıştırıldıktan sonra yalnızca başarısız `Verify full validation` üst işini yeniden çalıştırın.

Sınırlı kurtarma için şemsiyeye `rerun_group` geçirin. `all` gerçek sürüm adayı çalıştırmasıdır, `ci` yalnızca normal CI alt çalıştırmasını çalıştırır, `plugin-prerelease` yalnızca sürüme özel Plugin alt çalıştırmasını çalıştırır, `release-checks` her sürüm kutusunu çalıştırır ve daha dar sürüm grupları `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ve `npm-telegram` değerleridir. Odaklı `npm-telegram` yeniden çalıştırmaları `npm_telegram_package_spec` gerektirir; `release_profile=full` ile full/all çalıştırmaları release-checks paket artefaktını kullanır. Odaklı platformlar arası yeniden çalıştırmalar `cross_os_suite_filter=windows/packaged-upgrade` veya başka bir işletim sistemi/suite filtresi ekleyebilir. QA release-check hataları tavsiye niteliğindedir; yalnızca QA hatası sürüm doğrulamasını engellemez.

### Vitest

Vitest kutusu manuel `CI` alt iş akışıdır. Manuel CI, değişiklik kapsamını bilerek atlar ve sürüm adayı için normal test grafiğini zorlar: Linux Node shard'ları, paketle gelen Plugin shard'ları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, build smoke, doküman kontrolleri, Python skills, Windows, macOS, Android ve Control UI i18n.

Bu kutuyu "kaynak ağacı tam normal test paketinden geçti mi?" sorusunu yanıtlamak için kullanın. Bu, sürüm yolu ürün doğrulamasıyla aynı değildir. Saklanacak kanıtlar:

- Başlatılan `CI` çalıştırma URL'sini gösteren `Full Release Validation` özeti
- Kesin hedef SHA üzerinde yeşil `CI` çalıştırması
- Regresyonları incelerken CI işlerinden başarısız veya yavaş shard adları
- Bir çalıştırmanın performans analizi gerektiğinde `.artifacts/vitest-shard-timings.json` gibi Vitest zamanlama artefaktları

Sürüm deterministik normal CI gerektiriyor ancak Docker, QA Lab, canlı, platformlar arası veya paket kutularını gerektirmiyorsa manuel CI'yı doğrudan çalıştırın:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker kutusu, `OpenClaw Release Checks` içinde `openclaw-live-and-e2e-checks-reusable.yml` üzerinden ve sürüm modundaki `install-smoke` iş akışıyla yer alır. Sürüm adayını yalnızca kaynak düzeyi testler yerine paketlenmiş Docker ortamları üzerinden doğrular.

Sürüm Docker kapsamı şunları içerir:

- yavaş Bun global kurulum smoke etkinleştirilmiş tam kurulum smoke
- QR, root/gateway ve installer/Bun smoke işlerinin ayrı install-smoke shard'ları olarak çalıştığı, hedef SHA'ya göre root Dockerfile smoke imajı hazırlama/yeniden kullanım
- depo E2E hatları
- sürüm yolu Docker parçaları: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g` ve `plugins-runtime-install-h`
- istendiğinde `plugins-runtime-services` parçası içinde OpenWebUI kapsamı
- `bundled-plugin-install-uninstall-0` ile `bundled-plugin-install-uninstall-23` arasında bölünmüş paketle gelen Plugin kurulum/kaldırma hatları
- release checks canlı suite'leri içerdiğinde canlı/E2E sağlayıcı suite'leri ve Docker canlı model kapsamı

Yeniden çalıştırmadan önce Docker artefaktlarını kullanın. Sürüm yolu zamanlayıcısı, hat günlükleri, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı plan JSON'u ve yeniden çalıştırma komutlarıyla birlikte `.artifacts/docker-tests/` yükler. Odaklı kurtarma için tüm sürüm parçalarını yeniden çalıştırmak yerine yeniden kullanılabilir canlı/E2E iş akışında `docker_lanes=<lane[,lane]>` kullanın. Oluşturulan yeniden çalıştırma komutları, mevcut olduğunda önceki `package_artifact_run_id` ve hazırlanmış Docker imajı girdilerini içerir; böylece başarısız bir hat aynı tarball'ı ve GHCR imajlarını yeniden kullanabilir.

### QA Lab

QA Lab kutusu da `OpenClaw Release Checks` parçasıdır. Vitest ve Docker paket mekaniklerinden ayrı olarak agentic davranış ve kanal düzeyi sürüm kapısıdır.

Sürüm QA Lab kapsamı şunları içerir:

- agentic parity pack kullanarak OpenAI aday hattını Opus 4.6 taban çizgisiyle karşılaştıran mock parity hattı
- `qa-live-shared` ortamını kullanan hızlı canlı Matrix QA profili
- Convex CI credential lease'leri kullanan canlı Telegram QA hattı
- sürüm telemetrisinin açık yerel kanıta ihtiyaç duyması halinde `pnpm qa:otel:smoke`

Bu kutuyu "sürüm QA senaryolarında ve canlı kanal akışlarında doğru davranıyor mu?" sorusunu yanıtlamak için kullanın. Sürümü onaylarken parity, Matrix ve Telegram hatları için artefakt URL'lerini saklayın. Tam Matrix kapsamı, varsayılan sürüm açısından kritik hat yerine manuel shard edilmiş QA-Lab çalıştırması olarak kullanılabilir kalır.

### Paket

Package kutusu kurulabilir ürün kapısıdır. `Package Acceptance` ve çözümleyici `scripts/resolve-openclaw-package-candidate.mjs` tarafından desteklenir. Çözümleyici bir adayı Docker E2E tarafından tüketilen `package-under-test` tarball'ına normalleştirir, paket envanterini doğrular, paket sürümünü ve SHA-256 değerini kaydeder ve iş akışı test koşumu ref'ini paket kaynak ref'inden ayrı tutar.

Desteklenen aday kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya kesin bir OpenClaw sürüm versiyonu
- `source=ref`: seçilen `workflow_ref` test koşumuyla güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA'sını paketle
- `source=url`: zorunlu `package_sha256` ile bir HTTPS `.tgz` indir
- `source=artifact`: başka bir GitHub Actions çalıştırması tarafından yüklenen bir `.tgz` dosyasını yeniden kullan

`OpenClaw Release Checks`, Package Acceptance'ı `source=artifact`, hazırlanmış sürüm paket artefaktı, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`, `telegram_mode=mock-openai` ile çalıştırır. Package Acceptance; migrasyon, güncelleme, yapılandırılmış auth güncelleme yeniden başlatması, eski Plugin bağımlılığı temizliği, çevrimdışı Plugin fixture'ları, Plugin güncellemesi ve Telegram paket QA'yı aynı çözümlenmiş tarball'a karşı tutar. Engelleyici release checks, varsayılan en son yayımlanmış paket taban çizgisini kullanır; `run_release_soak=true` veya `release_profile=full`, `2026.4.23` ile `latest` arasındaki her stable npm-yayımlı taban çizgisine ve bildirilen sorun fixture'larına genişler. Zaten gönderilmiş bir aday için Package Acceptance'ı `source=npm` ile; yayımdan önce SHA destekli yerel npm tarball'ı için `source=ref`/`source=artifact` ile kullanın. Bu, daha önce Parallels gerektiren paket/güncelleme kapsamının çoğu için GitHub'a özgü yedektir. Platformlar arası release checks, işletim sistemine özgü onboarding, installer ve platform davranışı için hâlâ önemlidir; ancak paket/güncelleme ürün doğrulaması Package Acceptance'ı tercih etmelidir.

Güncelleme ve Plugin doğrulaması için kanonik kontrol listesi [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüdür. Bir Plugin kurulumu/güncellemesi, doctor temizliği veya yayımlanmış paket migrasyonu değişikliğini hangi yerel, Docker, Package Acceptance veya release-check hattının kanıtladığına karar verirken bunu kullanın. Her stable `2026.4.23+` paketten kapsamlı yayımlanmış güncelleme migrasyonu ayrı bir manuel `Update Migration` iş akışıdır, Full Release CI'nın parçası değildir.

Eski paket kabul gevşekliği bilinçli olarak zamanla sınırlandırılmıştır. `2026.4.25` sürümüne kadar olan paketler, npm’e halihazırda yayımlanmış meta veri eksikleri için uyumluluk yolunu kullanabilir: tarball’da eksik olan özel QA envanter girdileri, eksik `gateway install --wrapper`, tarball’dan türetilmiş git fixture’ında eksik yama dosyaları, eksik kalıcı `update.channel`, eski plugin install-record konumları, eksik marketplace install-record kalıcılığı ve `plugins update` sırasında config meta veri migrasyonu. Yayımlanmış `2026.4.26` paketi, halihazırda gönderilmiş yerel derleme meta veri damga dosyaları için uyarı verebilir. Daha sonraki paketler modern paket sözleşmelerini karşılamalıdır; aynı eksikler sürüm doğrulamasını başarısız kılar.

Sürüm sorusu gerçekten kurulabilir bir paketle ilgili olduğunda daha geniş Paket Kabul profillerini kullanın:

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

- `smoke`: hızlı paket kurulum/kanal/agent, gateway ağ ve config yeniden yükleme şeritleri
- `package`: canlı ClawHub olmadan install/update/restart/plugin paket sözleşmeleri; bu sürüm kontrolü varsayılanıdır
- `product`: `package` artı MCP kanalları, cron/subagent temizliği, OpenAI web araması ve OpenWebUI
- `full`: OpenWebUI ile Docker sürüm yolu parçaları
- `custom`: odaklı yeniden çalıştırmalar için tam `docker_lanes` listesi

Paket adayı Telegram kanıtı için Paket Kabul üzerinde `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` etkinleştirin. Workflow, çözümlenen `package-under-test` tarball’ını Telegram şeridine geçirir; bağımsız Telegram workflow’u yayımlama sonrası kontroller için hâlâ yayımlanmış bir npm spesifikasyonunu kabul eder.

## Sürüm yayımlama otomasyonu

`OpenClaw Release Publish` normal mutasyon yapan yayımlama giriş noktasıdır. Güvenilir yayımlayıcı workflow’larını sürümün ihtiyaç duyduğu sırayla orkestre eder:

1. Sürüm etiketini checkout et ve commit SHA’sını çözümle.
2. Etiketin `main` veya `release/*` üzerinden erişilebilir olduğunu doğrula.
3. `pnpm plugins:sync:check` çalıştır.
4. `publish_scope=all-publishable` ve `ref=<release-sha>` ile `Plugin NPM Release` dispatch et.
5. Aynı kapsam ve SHA ile `Plugin ClawHub Release` dispatch et.
6. Sürüm etiketi, npm dist-tag’i ve kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` dispatch et.

Beta yayımlama örneği:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Varsayılan beta dist-tag’ine kararlı yayımlama:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Doğrudan `latest` için kararlı promosyon açıktır:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Daha düşük seviyeli `Plugin NPM Release` ve `Plugin ClawHub Release` workflow’larını yalnızca odaklı onarım veya yeniden yayımlama işleri için kullanın. Seçilmiş bir plugin onarımı için `OpenClaw Release Publish` öğesine `plugin_publish_scope=selected` ve `plugins=@openclaw/name` geçirin veya OpenClaw paketinin yayımlanmaması gerektiğinde alt workflow’u doğrudan dispatch edin.

## NPM workflow girdileri

`OpenClaw NPM Release` şu operatör kontrollü girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya `v2026.4.2-beta.1` gibi zorunlu sürüm etiketi; `preflight_only=true` olduğunda yalnızca doğrulama amaçlı preflight için geçerli tam 40 karakterlik workflow dalı commit SHA’sı da olabilir
- `preflight_only`: yalnızca doğrulama/derleme/paket için `true`, gerçek yayımlama yolu için `false`
- `preflight_run_id`: workflow’un başarılı preflight çalıştırmasından hazırlanmış tarball’ı yeniden kullanması için gerçek yayımlama yolunda zorunludur
- `npm_dist_tag`: yayımlama yolu için npm hedef etiketi; varsayılan olarak `beta`

`OpenClaw Release Publish` şu operatör kontrollü girdileri kabul eder:

- `tag`: zorunlu sürüm etiketi; zaten mevcut olmalıdır
- `preflight_run_id`: başarılı `OpenClaw NPM Release` preflight çalıştırma kimliği; `publish_openclaw_npm=true` olduğunda zorunludur
- `npm_dist_tag`: OpenClaw paketi için npm hedef etiketi
- `plugin_publish_scope`: varsayılan olarak `all-publishable`; `selected` değerini yalnızca odaklı onarım işleri için kullanın
- `plugins`: `plugin_publish_scope=selected` olduğunda virgülle ayrılmış `@openclaw/*` paket adları
- `publish_openclaw_npm`: varsayılan olarak `true`; yalnızca workflow’u plugin’e özel onarım orkestratörü olarak kullanırken `false` ayarlayın

`OpenClaw Release Checks` şu operatör kontrollü girdileri kabul eder:

- `ref`: doğrulanacak dal, etiket veya tam commit SHA. Gizli bilgi içeren kontroller, çözümlenen commit’in bir OpenClaw dalından veya sürüm etiketinden erişilebilir olmasını gerektirir.
- `run_release_soak`: kararlı/varsayılan sürüm kontrollerinde kapsamlı canlı/E2E, Docker sürüm yolu ve tümünden beri upgrade-survivor soak için seçimi etkinleştirir. `release_profile=full` tarafından zorla etkinleştirilir.

Kurallar:

- Kararlı ve düzeltme etiketleri `beta` veya `latest` için yayımlanabilir
- Beta ön sürüm etiketleri yalnızca `beta` için yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` ve `Full Release Validation` her zaman yalnızca doğrulama amaçlıdır
- Gerçek yayımlama yolu, preflight sırasında kullanılan aynı `npm_dist_tag` değerini kullanmalıdır; workflow yayımlama devam etmeden önce bu meta veriyi doğrular

## Kararlı npm sürüm sırası

Kararlı bir npm sürümü çıkarırken:

1. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın
   - Etiket mevcut olmadan önce, preflight workflow’unun yalnızca doğrulama amaçlı deneme çalıştırması için geçerli tam workflow dalı commit SHA’sını kullanabilirsiniz
2. Normal önce-beta akışı için `npm_dist_tag=beta` seçin veya yalnızca bilinçli olarak doğrudan kararlı yayımlama istediğinizde `latest` kullanın
3. Tek bir manuel workflow’dan normal CI artı canlı prompt cache, Docker, QA Lab, Matrix ve Telegram kapsamı istediğinizde sürüm dalı, sürüm etiketi veya tam commit SHA üzerinde `Full Release Validation` çalıştırın
4. Bilinçli olarak yalnızca belirleyici normal test grafiğine ihtiyaç duyuyorsanız bunun yerine sürüm ref’i üzerinde manuel `CI` workflow’unu çalıştırın
5. Başarılı `preflight_run_id` değerini kaydedin
6. Aynı `tag`, aynı `npm_dist_tag` ve kaydedilmiş `preflight_run_id` ile `OpenClaw Release Publish` çalıştırın; OpenClaw npm paketini yükseltmeden önce dışsallaştırılmış plugin’leri npm’e ve ClawHub’a yayımlar
7. Sürüm `beta` üzerinde yayımlandıysa, bu kararlı sürümü `beta` değerinden `latest` değerine yükseltmek için özel `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` workflow’unu kullanın
8. Sürüm bilinçli olarak doğrudan `latest` için yayımlandıysa ve `beta` hemen aynı kararlı derlemeyi izlemeliyse, her iki dist-tag’i de kararlı sürüme yönlendirmek için aynı özel workflow’u kullanın veya zamanlanmış kendi kendini iyileştiren eşitlemesinin `beta` değerini daha sonra taşımasına izin verin

Dist-tag mutasyonu güvenlik için özel depoda bulunur çünkü hâlâ `NPM_TOKEN` gerektirir; herkese açık depo ise yalnızca OIDC yayımlamayı korur.

Bu, doğrudan yayımlama yolunu ve önce-beta promosyon yolunu hem belgelenmiş hem de operatör tarafından görünür tutar.

Bir maintainer yerel npm kimlik doğrulamasına geri dönmek zorundaysa, tüm 1Password CLI (`op`) komutlarını yalnızca ayrılmış bir tmux oturumu içinde çalıştırın. `op` komutunu ana agent shell’den doğrudan çağırmayın; tmux içinde tutmak prompt’ları, uyarıları ve OTP işlemeyi gözlemlenebilir kılar ve yinelenen host uyarılarını önler.

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

Maintainer’lar gerçek runbook için
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
içindeki özel sürüm belgelerini kullanır.

## İlgili

- [Sürüm kanalları](/tr/install/development-channels)
