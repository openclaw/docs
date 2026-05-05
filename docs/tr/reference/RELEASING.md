---
read_when:
    - Herkese açık sürüm kanalı tanımları aranıyor
    - Sürüm doğrulamasını veya paket kabulünü çalıştırma
    - Sürüm adlandırması ve yayın ritmi aranıyor
summary: Sürüm kulvarları, operatör kontrol listesi, doğrulama kutuları, sürüm adlandırması ve yayın temposu
title: Sürüm politikası
x-i18n:
    generated_at: "2026-05-05T01:48:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41886d3bb2f970e6a86944e5ff207b1b29b1b64b1f234d45f626fed19cf032b3
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw'un üç herkese açık sürüm kanalı vardır:

- kararlı: varsayılan olarak npm `beta` etiketine, açıkça istendiğinde ise npm `latest` etiketine yayımlanan etiketli sürümler
- beta: npm `beta` etiketine yayımlanan ön sürüm etiketleri
- geliştirme: `main` dalının hareketli en güncel durumu

## Sürüm adlandırması

- Kararlı sürüm versiyonu: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Kararlı düzeltme sürümü versiyonu: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön sürüm versiyonu: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ay veya günü sıfırla doldurmayın
- `latest`, mevcut yükseltilmiş kararlı npm sürümü anlamına gelir
- `beta`, mevcut beta kurulum hedefi anlamına gelir
- Kararlı ve kararlı düzeltme sürümleri varsayılan olarak npm `beta` etiketine yayımlanır; sürüm operatörleri açıkça `latest` hedefleyebilir veya doğrulanmış bir beta derlemesini daha sonra yükseltebilir
- Her kararlı OpenClaw sürümü npm paketini ve macOS uygulamasını birlikte gönderir;
  beta sürümler normalde önce npm/paket yolunu doğrular ve yayımlar; mac
  uygulama derleme/imzalama/noter onayı ise açıkça istenmedikçe kararlı sürüme ayrılır

## Sürüm temposu

- Sürümler önce beta ilerler
- Kararlı sürüm yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar normalde sürümleri mevcut `main` dalından oluşturulan bir
  `release/YYYY.M.D` dalından çıkarır; böylece sürüm doğrulaması ve düzeltmeler
  `main` üzerindeki yeni geliştirmeyi engellemez
- Bir beta etiketi gönderilmiş veya yayımlanmışsa ve düzeltme gerekiyorsa, bakımcılar
  eski beta etiketini silmek veya yeniden oluşturmak yerine bir sonraki `-beta.N` etiketini çıkarır
- Ayrıntılı sürüm prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca bakımcılara özeldir

## Sürüm operatörü kontrol listesi

Bu kontrol listesi, sürüm akışının herkese açık biçimidir. Özel kimlik bilgileri,
imzalama, noter onayı, dist-tag kurtarma ve acil geri alma ayrıntıları
yalnızca bakımcılara özel sürüm çalışma kılavuzunda kalır.

1. Mevcut `main` dalından başlayın: en son değişiklikleri çekin, hedef commit'in gönderildiğini doğrulayın
   ve mevcut `main` CI durumunun buradan dal oluşturmak için yeterince yeşil olduğunu onaylayın.
2. En üstteki `CHANGELOG.md` bölümünü gerçek commit geçmişinden
   `/changelog` ile yeniden yazın, girdileri kullanıcıya yönelik tutun, commit'leyin, gönderin ve dal oluşturmadan önce
   bir kez daha rebase/pull yapın.
3. Sürüm uyumluluk kayıtlarını
   `src/plugins/compat/registry.ts` ve
   `src/commands/doctor/shared/deprecation-compat.ts` içinde gözden geçirin. Süresi dolmuş
   uyumluluğu yalnızca yükseltme yolu kapsanmaya devam ediyorsa kaldırın veya neden
   bilerek taşındığını kaydedin.
4. Mevcut `main` dalından `release/YYYY.M.D` oluşturun; normal sürüm çalışmasını
   doğrudan `main` üzerinde yapmayın.
5. Amaçlanan etiket için gereken her sürüm konumunu artırın, yayımlanabilir Plugin paketlerinin sürüm
   versiyonunu ve uyumluluk metadatasını paylaşması için
   `pnpm plugins:sync` çalıştırın, ardından yerel deterministik ön kontrolü çalıştırın:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` ve
   `pnpm release:check`.
6. `OpenClaw NPM Release` iş akışını `preflight_only=true` ile çalıştırın. Etiket yokken,
   yalnızca doğrulama amaçlı ön kontrol için tam 40 karakterlik bir sürüm dalı SHA'sına izin verilir.
   Başarılı `preflight_run_id` değerini kaydedin.
7. Sürüm dalı, etiketi veya tam commit SHA'sı için
   `Full Release Validation` ile tüm ön sürüm testlerini başlatın. Bu, dört büyük sürüm test kutusu için
   tek manuel giriş noktasıdır: Vitest, Docker, QA Lab ve Package.
8. Doğrulama başarısız olursa, sürüm dalında düzeltin ve düzeltmeyi kanıtlayan en küçük başarısız
   dosyayı, kanalı, iş akışı işini, paket profilini, sağlayıcıyı veya model izin listesini yeniden çalıştırın.
   Tam şemsiyeyi yalnızca değişen yüzey önceki kanıtı bayatlattığında yeniden çalıştırın.
9. Beta için `vYYYY.M.D-beta.N` etiketini oluşturun, ardından eşleşen
   `release/YYYY.M.D` dalından `OpenClaw Release Publish` çalıştırın. Bu, `pnpm plugins:sync:check` doğrulaması yapar,
   tüm yayımlanabilir Plugin paketlerini önce npm'e yayımlar, aynı kümeyi ikinci olarak ClawPack npm-pack tarball'ları olarak
   ClawHub'a yayımlar ve ardından hazırlanmış OpenClaw npm ön kontrol artefaktını eşleşen dist-tag ile yükseltir.
   Yayımlamadan sonra, yayımlanan `openclaw@YYYY.M.D-beta.N` veya
   `openclaw@beta` paketine karşı yayımlama sonrası paket
   kabulünü çalıştırın. Gönderilmiş veya yayımlanmış bir ön sürümün düzeltmeye ihtiyacı varsa,
   bir sonraki eşleşen ön sürüm numarasını çıkarın; eski
   ön sürümü silmeyin veya yeniden yazmayın.
10. Kararlı için yalnızca doğrulanmış beta veya sürüm adayı gerekli doğrulama kanıtına sahip olduktan sonra devam edin.
    Kararlı npm yayını da `preflight_run_id` aracılığıyla başarılı ön kontrol artefaktını yeniden kullanarak
    `OpenClaw Release Publish` üzerinden geçer; kararlı macOS sürüm hazır oluşu ayrıca paketlenmiş
    `.zip`, `.dmg`, `.dSYM.zip` ve `main` üzerinde güncellenmiş `appcast.xml` gerektirir.
11. Yayımlamadan sonra npm yayımlama sonrası doğrulayıcısını, yayımlama sonrası kanal kanıtı gerektiğinde isteğe bağlı bağımsız
    yayımlanmış-npm Telegram E2E'yi, gerektiğinde dist-tag yükseltmesini, eksiksiz eşleşen
    `CHANGELOG.md` bölümünden GitHub sürüm/ön sürüm notlarını ve sürüm duyurusu
    adımlarını çalıştırın.

## Sürüm ön kontrolü

- Test TypeScript'inin daha hızlı yerel `pnpm check` geçidi dışında da kapsanması için yayın ön kontrolünden önce `pnpm check:test-types` çalıştırın
- Daha geniş import döngüsü ve mimari sınır kontrollerinin daha hızlı yerel geçit dışında yeşil olduğundan emin olmak için yayın ön kontrolünden önce `pnpm check:architecture` çalıştırın
- Paket doğrulama adımı için beklenen `dist/*` yayın yapıtları ve Control UI paketi mevcut olsun diye `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın
- Kök sürüm artışından sonra ve etiketlemeden önce `pnpm plugins:sync` çalıştırın. Bu komut, yayımlanabilir Plugin paket sürümlerini, OpenClaw eş/API uyumluluk metadatasını, derleme metadatasını ve Plugin changelog taslaklarını çekirdek yayın sürümüyle eşleşecek şekilde günceller. `pnpm plugins:sync:check`, değişiklik yapmayan yayın korumasıdır; bu adım unutulmuşsa yayımlama workflow'u herhangi bir registry değişikliği yapmadan önce başarısız olur.
- Yayın onayından önce tüm yayın öncesi test kutularını tek bir giriş noktasından başlatmak için manuel `Full Release Validation` workflow'unu çalıştırın. Bir dal, etiket veya tam commit SHA kabul eder, manuel `CI` başlatır ve kurulum smoke, paket kabulü, çapraz işletim sistemi paket kontrolleri, QA Lab parity, Matrix ve Telegram hatları için `OpenClaw Release Checks` başlatır. Stable/varsayılan çalıştırmalar, kapsamlı canlı/E2E ve Docker yayın yolu soak kontrollerini `run_release_soak=true` arkasında tutar; `release_profile=full` soak'ı zorunlu kılar. `release_profile=full` ve `rerun_group=all` ile, yayın kontrollerinden gelen `release-package-under-test` yapıtına karşı paket Telegram E2E'yi de çalıştırır. Aynı Telegram E2E'nin yayımlanan npm paketini de kanıtlaması gerektiğinde yayımlamadan sonra `npm_telegram_package_spec` sağlayın. Package Acceptance'ın paket/güncelleme matrisini SHA ile oluşturulan yapıt yerine gönderilmiş npm paketine karşı çalıştırması gerektiğinde yayımlamadan sonra `package_acceptance_package_spec` sağlayın. Özel kanıt raporunun, Telegram E2E'yi zorunlu kılmadan doğrulamanın yayımlanmış bir npm paketiyle eşleştiğini kanıtlaması gerektiğinde `evidence_package_spec` sağlayın. Örnek: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Yayın işi sürerken bir paket adayı için yan kanal kanıtı istediğinizde manuel `Package Acceptance` workflow'unu çalıştırın. `openclaw@beta`, `openclaw@latest` veya tam bir yayın sürümü için `source=npm`; mevcut `workflow_ref` test koşumuyla güvenilir bir `package_ref` dalı/etiketi/SHA'sını paketlemek için `source=ref`; zorunlu SHA-256 içeren bir HTTPS tarball için `source=url`; ya da başka bir GitHub Actions çalıştırması tarafından yüklenen bir tarball için `source=artifact` kullanın. Workflow, adayı `package-under-test` olarak çözer, Docker E2E yayın zamanlayıcısını bu tarball'a karşı yeniden kullanır ve aynı tarball'a karşı `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` ile Telegram QA çalıştırabilir. Seçilen Docker hatları `published-upgrade-survivor` içerdiğinde paket yapıtı adaydır ve `published_upgrade_survivor_baseline` yayımlanmış baseline'ı seçer. Örnek: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Yaygın profiller:
  - `smoke`: kurulum/kanal/ajan, Gateway ağı ve yapılandırma yeniden yükleme hatları
  - `package`: OpenWebUI veya canlı ClawHub olmadan yapıt-yerel paket/güncelleme/Plugin hatları
  - `product`: paket profiline ek olarak MCP kanalları, Cron/alt ajan temizliği, OpenAI web araması ve OpenWebUI
  - `full`: OpenWebUI ile Docker yayın yolu parçaları
  - `custom`: odaklı bir yeniden çalıştırma için tam `docker_lanes` seçimi
- Yalnızca yayın adayı için tam normal CI kapsamına ihtiyacınız olduğunda manuel `CI` workflow'unu doğrudan çalıştırın. Manuel CI başlatmaları değişiklik kapsamını atlar ve Linux Node shard'larını, paketlenmiş Plugin shard'larını, kanal sözleşmelerini, Node 22 uyumluluğunu, `check`, `check-additional`, derleme smoke, doküman kontrollerini, Python Skills'i, Windows, macOS, Android ve Control UI i18n hatlarını zorunlu kılar. Örnek: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Yayın telemetrisini doğrularken `pnpm qa:otel:smoke` çalıştırın. QA-lab'i yerel bir OTLP/HTTP alıcısı üzerinden çalıştırır ve Opik, Langfuse veya başka bir harici toplayıcı gerektirmeden dışa aktarılan trace span adlarını, sınırlı nitelikleri ve içerik/tanımlayıcı redaksiyonunu doğrular.
- Her etiketli yayından önce `pnpm release:check` çalıştırın
- Etiket var olduktan sonra değişiklik yapan yayımlama sırası için `OpenClaw Release Publish` çalıştırın. Bunu `release/YYYY.M.D` dalından (veya main'den erişilebilir bir etiketi yayımlarken `main` üzerinden) başlatın, yayın etiketini ve başarılı OpenClaw npm `preflight_run_id` değerini iletin ve bilerek odaklı bir onarım çalıştırmıyorsanız varsayılan Plugin yayımlama kapsamı olan `all-publishable` değerini koruyun. Workflow, çekirdek paketin haricileştirilmiş Plugin'lerinden önce yayımlanmaması için Plugin npm yayımlamasını, Plugin ClawHub yayımlamasını ve OpenClaw npm yayımlamasını sıraya koyar.
- Yayın kontrolleri artık ayrı bir manuel workflow içinde çalışır: `OpenClaw Release Checks`
- `OpenClaw Release Checks`, yayın onayından önce QA Lab mock parity hattını, hızlı canlı Matrix profilini ve Telegram QA hattını da çalıştırır. Canlı hatlar `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI kimlik bilgisi kiralarını kullanır. Tam Matrix taşıma, medya ve E2EE envanterini paralel istediğinizde `matrix_profile=all` ve `matrix_shards=true` ile manuel `QA-Lab - All Lanes` workflow'unu çalıştırın.
- Çapraz işletim sistemi kurulum ve yükseltme çalışma zamanı doğrulaması, yeniden kullanılabilir workflow'u doğrudan çağıran herkese açık `OpenClaw Release Checks` ve `Full Release Validation` kapsamındadır: `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Bu ayrım bilinçlidir: gerçek npm yayın yolunu kısa, deterministik ve yapıt odaklı tutarken, daha yavaş canlı kontrolleri kendi hattında tutar; böylece yayımlamayı geciktirmez veya engellemezler
- Gizli taşıyan yayın kontrolleri, workflow mantığı ve gizliler kontrollü kalsın diye `Full Release Validation` üzerinden veya `main`/yayın workflow ref'inden başlatılmalıdır
- `OpenClaw Release Checks`, çözümlenen commit bir OpenClaw dalından veya yayın etiketinden erişilebilir olduğu sürece dal, etiket veya tam commit SHA kabul eder
- `OpenClaw NPM Release` yalnızca doğrulama ön kontrolü, itilmiş bir etiket gerektirmeden mevcut tam 40 karakterli workflow dalı commit SHA'sını da kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek bir yayımlamaya yükseltilemez
- SHA modunda workflow, yalnızca paket metadata kontrolü için `v<package.json version>` üretir; gerçek yayımlama hâlâ gerçek bir yayın etiketi gerektirir
- Her iki workflow da gerçek yayımlama ve yükseltme yolunu GitHub-hosted runner'larda tutarken, değişiklik yapmayan doğrulama yolu daha büyük Blacksmith Linux runner'larını kullanabilir
- Bu workflow, hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` workflow gizlilerini kullanarak `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` çalıştırır
- npm yayın ön kontrolü artık ayrı yayın kontrolleri hattını beklemez
- Onaydan önce `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (veya eşleşen beta/düzeltme etiketi) çalıştırın
- npm yayımlamasından sonra, yeni bir geçici prefix içinde yayımlanmış registry kurulum yolunu doğrulamak için `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (veya eşleşen beta/düzeltme sürümü) çalıştırın
- Bir beta yayımlamasından sonra, paylaşılan kiralık Telegram kimlik bilgisi havuzunu kullanarak yayımlanan npm paketine karşı kurulu paket onboarding'ini, Telegram kurulumunu ve gerçek Telegram E2E'yi doğrulamak için `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` çalıştırın. Yerel bakımcı tek seferlik çalıştırmaları Convex değişkenlerini atlayabilir ve üç `OPENCLAW_QA_TELEGRAM_*` env kimlik bilgisini doğrudan iletebilir.
- Bir bakımcı makinesinden tam yayımlama sonrası beta smoke çalıştırmak için `pnpm release:beta-smoke -- --beta betaN` kullanın. Yardımcı, Parallels npm update/fresh-target doğrulamasını çalıştırır, `NPM Telegram Beta E2E` başlatır, tam workflow çalıştırmasını yoklar, yapıtı indirir ve Telegram raporunu yazdırır.
- Bakımcılar aynı yayımlama sonrası kontrolü GitHub Actions üzerinden manuel `NPM Telegram Beta E2E` workflow'u ile çalıştırabilir. Bu workflow bilinçli olarak yalnızca manueldir ve her merge işleminde çalışmaz.
- Bakımcı yayın otomasyonu artık önce ön kontrol, sonra yükseltme kullanır:
  - gerçek npm yayımlaması başarılı bir npm `preflight_run_id` geçmelidir
  - gerçek npm yayımlaması, başarılı ön kontrol çalıştırmasıyla aynı `main` veya `release/YYYY.M.D` dalından başlatılmalıdır
  - stable npm yayınları varsayılan olarak `beta` hedefler
  - stable npm yayımlaması workflow girdisiyle açıkça `latest` hedefleyebilir
  - token tabanlı npm dist-tag değişikliği artık güvenlik için `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` içinde yer alır; çünkü `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirirken public repo yalnızca OIDC yayımlaması tutar
  - herkese açık `macOS Release` yalnızca doğrulama içindir; bir etiket yalnızca yayın dalında yaşıyor ancak workflow `main` üzerinden başlatılıyorsa `public_release_branch=release/YYYY.M.D` ayarlayın
  - gerçek private mac yayımlaması başarılı private mac `preflight_run_id` ve `validate_run_id` geçmelidir
  - gerçek yayımlama yolları, yeniden derlemek yerine hazırlanmış yapıtları yükseltir
- `YYYY.M.D-N` gibi stable düzeltme yayınları için yayımlama sonrası doğrulayıcı aynı geçici prefix yükseltme yolunu `YYYY.M.D` sürümünden `YYYY.M.D-N` sürümüne de kontrol eder; böylece yayın düzeltmeleri eski global kurulumları sessizce temel stable yükünde bırakamaz
- npm yayın ön kontrolü, tarball hem `dist/control-ui/index.html` hem de boş olmayan bir `dist/control-ui/assets/` yükü içermedikçe kapalı şekilde başarısız olur; böylece boş bir tarayıcı dashboard'unu tekrar göndermeyiz
- Yayımlama sonrası doğrulama, yayımlanmış Plugin giriş noktalarının ve paket metadatasının kurulu registry düzeninde mevcut olduğunu da kontrol eder. Eksik Plugin çalışma zamanı yükleri gönderen bir yayın, postpublish doğrulayıcısında başarısız olur ve `latest` olarak yükseltilemez.
- `pnpm test:install:smoke`, aday güncelleme tarball'ında npm pack `unpackedSize` bütçesini de uygular; böylece installer e2e, yanlışlıkla oluşan paket şişmesini yayın yayımlama yolundan önce yakalar
- Yayın işi CI planlamasına, extension zamanlama manifestlerine veya extension test matrislerine dokunduysa, yayın notları eski bir CI düzenini anlatmasın diye onaydan önce `.github/workflows/plugin-prerelease.yml` içinden planner sahipliğindeki `plugin-prerelease-extension-shard` matris çıktılarını yeniden üretin ve gözden geçirin
- Stable macOS yayın hazır olma durumu, güncelleyici yüzeylerini de içerir:
  - GitHub release, paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` ile sonuçlanmalıdır
  - `main` üzerindeki `appcast.xml`, yayımlamadan sonra yeni stable zip'e işaret etmelidir
  - paketlenmiş uygulama debug olmayan bir bundle id, boş olmayan bir Sparkle feed URL'si ve o yayın sürümü için kanonik Sparkle derleme tabanına eşit veya üzerinde bir `CFBundleVersion` korumalıdır

## Yayın test kutuları

`Full Release Validation`, operatörlerin tüm yayın öncesi testleri tek bir giriş noktasından başlatma yoludur. Hızlı hareket eden bir dalda sabitlenmiş commit kanıtı için, her alt workflow'un hedef SHA'ya sabitlenmiş geçici bir daldan çalışması amacıyla yardımcıyı kullanın:

```bash
pnpm ci:full-release --sha <full-sha>
```

Yardımcı `release-ci/<sha>-...` dalını iter, `Full Release Validation` workflow'unu bu daldan `ref=<sha>` ile başlatır, her alt workflow `headSha` değerinin hedefle eşleştiğini doğrular ve ardından geçici dalı siler. Bu, yanlışlıkla daha yeni bir `main` alt çalıştırmasını kanıtlamayı önler.

Yayın dalı veya etiket doğrulaması için, bunu güvenilir `main` workflow ref'inden çalıştırın ve yayın dalını ya da etiketini `ref` olarak iletin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

İş akışı hedef ref’i çözümler, `target_ref=<release-ref>` ile manuel `CI` gönderir, `OpenClaw Release Checks` gönderir, paket odaklı kontroller için bir üst `release-package-under-test` artifact’ı hazırlar ve `release_profile=full` ile `rerun_group=all` olduğunda ya da `npm_telegram_package_spec` ayarlandığında bağımsız paket Telegram E2E’yi gönderir. `OpenClaw Release Checks` daha sonra kurulum smoke kontrollerini, çapraz işletim sistemi sürüm kontrollerini, soak etkinleştirildiğinde live/E2E Docker sürüm yolu kapsamını, Telegram paket QA ile Package Acceptance’ı, QA Lab paritesini, live Matrix’i ve live Telegram’ı genişletir. Tam bir çalıştırma yalnızca `Full Release Validation` özeti `normal_ci` ve `release_checks` öğelerini başarılı olarak gösterdiğinde kabul edilebilir. full/all modunda `npm_telegram` alt öğesi de başarılı olmalıdır; full/all dışında, yayımlanmış bir `npm_telegram_package_spec` sağlanmadıkça atlanır. Son doğrulayıcı özeti, her alt çalıştırma için en yavaş iş tablolarını içerir; böylece sürüm yöneticisi günlükleri indirmeden mevcut kritik yolu görebilir.
Eksiksiz aşama matrisi, tam iş akışı iş adları, stable ile full profili farkları, artifact’lar ve odaklanmış yeniden çalıştırma tutamaçları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.
Alt iş akışları, hedef `ref` daha eski bir sürüm dalını veya etiketini gösterse bile `Full Release Validation` çalıştıran güvenilir ref’ten, normalde `--ref main` üzerinden gönderilir. Ayrı bir Full Release Validation workflow-ref girdisi yoktur; iş akışı çalıştırma ref’ini seçerek güvenilir koşumu seçin.
Hareketli `main` üzerinde kesin commit kanıtı için `--ref main -f ref=<sha>` kullanmayın; ham commit SHA’ları iş akışı gönderim ref’i olamaz, bu nedenle sabitlenmiş geçici dalı oluşturmak için `pnpm ci:full-release --sha <sha>` kullanın.

Live/sağlayıcı kapsamını seçmek için `release_profile` kullanın:

- `minimum`: en hızlı sürüm açısından kritik OpenAI/çekirdek live ve Docker yolu
- `stable`: sürüm onayı için minimuma ek olarak stable sağlayıcı/backend kapsamı
- `full`: stable’a ek olarak geniş danışma sağlayıcısı/medya kapsamı

Sürümü engelleyen hatlar yeşil olduğunda ve terfi öncesinde kapsamlı live/E2E, Docker sürüm yolu ve 2026.4.23’ten bu yana tüm yükseltme dayanıklılığı taramasını istediğinizde `stable` ile `run_release_soak=true` kullanın. `full`, `run_release_soak=true` anlamına gelir.

`OpenClaw Release Checks`, hedef ref’i `release-package-under-test` olarak bir kez çözümlemek için güvenilir iş akışı ref’ini kullanır ve soak çalıştığında bu artifact’ı çapraz işletim sistemi, Package Acceptance ve sürüm yolu Docker kontrollerinde yeniden kullanır. Bu, paket odaklı tüm kutuları aynı baytlar üzerinde tutar ve tekrarlanan paket derlemelerini önler.
Çapraz işletim sistemi OpenAI kurulum smoke’u, repo/org değişkeni ayarlandığında `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır; aksi takdirde `openai/gpt-5.4` kullanır, çünkü bu hat en yavaş varsayılan modeli kıyaslamak yerine paket kurulumu, onboarding, Gateway başlatma ve bir live agent turunu kanıtlar. Daha geniş live sağlayıcı matrisi, modele özgü kapsamın yeri olmaya devam eder.

Sürüm aşamasına göre şu varyantları kullanın:

```bash
# Yayımlanmamış bir sürüm adayı dalını doğrula.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Kesin bir pushed commit’i doğrula.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# Beta yayımlandıktan sonra yayımlanmış paket Telegram E2E ekle.
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

Odaklanmış bir düzeltmeden sonraki ilk yeniden çalıştırma olarak tam şemsiyeyi kullanmayın. Bir kutu başarısız olursa, sonraki kanıt için başarısız alt iş akışını, işi, Docker hattını, paket profilini, model sağlayıcısını veya QA hattını kullanın. Tam şemsiyeyi yalnızca düzeltme paylaşılan sürüm orkestrasyonunu değiştirdiyse veya önceki tüm kutu kanıtlarını bayat hale getirdiyse yeniden çalıştırın. Şemsiyenin son doğrulayıcısı kaydedilmiş alt iş akışı çalıştırma kimliklerini yeniden kontrol eder; bu nedenle bir alt iş akışı başarıyla yeniden çalıştırıldıktan sonra yalnızca başarısız `Verify full validation` üst işini yeniden çalıştırın.

Sınırlı kurtarma için şemsiyeye `rerun_group` geçirin. `all` gerçek sürüm adayı çalıştırmasıdır, `ci` yalnızca normal CI alt öğesini çalıştırır, `plugin-prerelease` yalnızca sürüme özel Plugin alt öğesini çalıştırır, `release-checks` her sürüm kutusunu çalıştırır ve daha dar sürüm grupları `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ve `npm-telegram` şeklindedir.
Odaklanmış `npm-telegram` yeniden çalıştırmaları `npm_telegram_package_spec` gerektirir; `release_profile=full` olan full/all çalıştırmaları release-checks paket artifact’ını kullanır. Odaklanmış çapraz işletim sistemi yeniden çalıştırmaları `cross_os_suite_filter=windows/packaged-upgrade` veya başka bir işletim sistemi/suite filtresi ekleyebilir. QA release-check hataları danışma niteliğindedir; yalnızca QA hatası sürüm doğrulamasını engellemez.

### Vitest

Vitest kutusu manuel `CI` alt iş akışıdır. Manuel CI, changed kapsamını bilerek atlar ve sürüm adayı için normal test grafiğini zorlar: Linux Node shard’ları, paketlenmiş Plugin shard’ları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, build smoke, doküman kontrolleri, Python Skills, Windows, macOS, Android ve Control UI i18n.

Bu kutuyu "kaynak ağacı tam normal test paketinden geçti mi?" sorusunu yanıtlamak için kullanın. Bu, sürüm yolu ürün doğrulamasıyla aynı değildir. Saklanacak kanıtlar:

- Gönderilmiş `CI` çalıştırma URL’sini gösteren `Full Release Validation` özeti
- Tam hedef SHA üzerinde yeşil `CI` çalıştırması
- Regresyonları araştırırken CI işlerindeki başarısız veya yavaş shard adları
- Bir çalıştırmanın performans analizine ihtiyacı olduğunda `.artifacts/vitest-shard-timings.json` gibi Vitest zamanlama artifact’ları

Sürümün deterministik normal CI’ye ihtiyacı olduğunda ancak Docker, QA Lab, live, çapraz işletim sistemi veya paket kutularına ihtiyacı olmadığında manuel CI’yi doğrudan çalıştırın:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker kutusu, `OpenClaw Release Checks` içinde `openclaw-live-and-e2e-checks-reusable.yml` üzerinden ve ayrıca release-mode `install-smoke` iş akışıyla yer alır. Sürüm adayını yalnızca kaynak düzeyi testler yerine paketlenmiş Docker ortamları üzerinden doğrular.

Sürüm Docker kapsamı şunları içerir:

- yavaş Bun global kurulum smoke’u etkinleştirilmiş tam kurulum smoke’u
- hedef SHA’ya göre kök Dockerfile smoke imajı hazırlama/yeniden kullanma; QR, root/gateway ve installer/Bun smoke işleri ayrı install-smoke shard’ları olarak çalışır
- repository E2E hatları
- sürüm yolu Docker parçaları: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g` ve `plugins-runtime-install-h`
- istendiğinde `plugins-runtime-services` parçası içinde OpenWebUI kapsamı
- `bundled-plugin-install-uninstall-0` ile `bundled-plugin-install-uninstall-23` arasındaki bölünmüş paketlenmiş Plugin kurulum/kaldırma hatları
- sürüm kontrolleri live suite’leri içerdiğinde live/E2E sağlayıcı suite’leri ve Docker live model kapsamı

Yeniden çalıştırmadan önce Docker artifact’larını kullanın. Sürüm yolu zamanlayıcısı, hat günlükleri, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı planı JSON’u ve yeniden çalıştırma komutlarıyla birlikte `.artifacts/docker-tests/` yükler. Odaklanmış kurtarma için tüm sürüm parçalarını yeniden çalıştırmak yerine yeniden kullanılabilir live/E2E iş akışında `docker_lanes=<lane[,lane]>` kullanın. Oluşturulan yeniden çalıştırma komutları, mevcut olduğunda önceki `package_artifact_run_id` ve hazırlanmış Docker imaj girdilerini içerir; böylece başarısız bir hat aynı tarball’ı ve GHCR imajlarını yeniden kullanabilir.

### QA Lab

QA Lab kutusu da `OpenClaw Release Checks` parçasıdır. Vitest ve Docker paket mekaniğinden ayrı olarak agentic davranış ve kanal düzeyi sürüm kapısıdır.

Sürüm QA Lab kapsamı şunları içerir:

- agentic parity pack kullanarak OpenAI aday hattını Opus 4.6 baseline’ı ile karşılaştıran mock parity hattı
- `qa-live-shared` ortamını kullanan hızlı live Matrix QA profili
- Convex CI credential lease’lerini kullanan live Telegram QA hattı
- sürüm telemetrisi açık yerel kanıt gerektirdiğinde `pnpm qa:otel:smoke`

Bu kutuyu "sürüm QA senaryolarında ve live kanal akışlarında doğru davranıyor mu?" sorusunu yanıtlamak için kullanın. Sürümü onaylarken parity, Matrix ve Telegram hatları için artifact URL’lerini saklayın. Tam Matrix kapsamı, varsayılan sürüm açısından kritik hat yerine manuel shard’lı QA-Lab çalıştırması olarak kullanılabilir olmaya devam eder.

### Package

Package kutusu, kurulabilir ürün kapısıdır. `Package Acceptance` ve `scripts/resolve-openclaw-package-candidate.mjs` çözümleyicisi tarafından desteklenir. Çözümleyici bir adayı Docker E2E tarafından tüketilen `package-under-test` tarball’ına normalleştirir, paket envanterini doğrular, paket sürümünü ve SHA-256’yı kaydeder ve iş akışı koşum ref’ini paket kaynak ref’inden ayrı tutar.

Desteklenen aday kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya kesin bir OpenClaw sürüm versiyonu
- `source=ref`: seçili `workflow_ref` koşumuyla güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA’sını paketle
- `source=url`: gerekli `package_sha256` ile bir HTTPS `.tgz` indir
- `source=artifact`: başka bir GitHub Actions çalıştırması tarafından yüklenen bir `.tgz` yeniden kullan

`OpenClaw Release Checks`, hazırlanmış sürüm paketi artifact’ı, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`, `telegram_mode=mock-openai` ile `source=artifact` kullanarak Package Acceptance çalıştırır. Package Acceptance, migration, update, eski Plugin bağımlılığı temizliği, çevrimdışı Plugin fixture’ları, Plugin update ve Telegram paket QA’yı aynı çözümlenmiş tarball’a karşı tutar. Engelleyici sürüm kontrolleri varsayılan latest yayımlanmış paket baseline’ını kullanır; `run_release_soak=true` veya `release_profile=full`, `2026.4.23` ile `latest` arasındaki her stable npm-yayımlı baseline’a ve bildirilen sorun fixture’larına genişletir. Zaten gönderilmiş bir aday için `source=npm` ile Package Acceptance kullanın veya yayımlamadan önce SHA destekli yerel npm tarball’ı için `source=ref`/`source=artifact` kullanın. Bu, daha önce Parallels gerektiren paket/update kapsamının çoğu için GitHub-native alternatiftir. Çapraz işletim sistemi sürüm kontrolleri, işletim sistemine özgü onboarding, installer ve platform davranışı için hâlâ önemlidir, ancak paket/update ürün doğrulaması Package Acceptance’ı tercih etmelidir.

Update ve Plugin doğrulaması için kanonik kontrol listesi [Update’leri ve Plugin’leri test etme](/tr/help/testing-updates-plugins) bölümündedir. Plugin install/update, doctor cleanup veya yayımlanmış paket migration değişikliğini hangi yerel, Docker, Package Acceptance veya release-check hattının kanıtladığına karar verirken bunu kullanın.
Her stable `2026.4.23+` paketinden kapsamlı yayımlanmış update migration’ı, Full Release CI’nin parçası olmayan ayrı bir manuel `Update Migration` iş akışıdır.

Eski package-acceptance toleransı bilerek zamanla sınırlandırılmıştır. `2026.4.25` dahil paketler, npm’e zaten yayımlanmış metadata boşlukları için uyumluluk yolunu kullanabilir: tarball’da eksik private QA envanter girdileri, eksik `gateway install --wrapper`, tarball’dan türetilmiş git fixture’ında eksik patch dosyaları, kalıcı hale getirilmemiş `update.channel`, eski Plugin install-record konumları, eksik marketplace install-record kalıcılığı ve `plugins update` sırasında config metadata migration’ı. Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel build metadata stamp dosyaları için uyarı verebilir. Daha sonraki paketler modern paket sözleşmelerini karşılamalıdır; aynı boşluklar sürüm doğrulamasını başarısız kılar.

Sürüm sorusu gerçek bir kurulabilir paketle ilgili olduğunda daha geniş Package Acceptance profillerini kullanın:

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
- `package`: canlı ClawHub olmadan kurulum/güncelleme/Plugin paketi sözleşmeleri; bu, release-check
  varsayılanıdır
- `product`: `package` artı MCP kanalları, cron/alt ajan temizliği, OpenAI web
  araması ve OpenWebUI
- `full`: OpenWebUI ile Docker yayın yolu parçaları
- `custom`: odaklı yeniden çalıştırmalar için tam `docker_lanes` listesi

Paket adayı Telegram kanıtı için Package Acceptance üzerinde `telegram_mode=mock-openai` veya
`telegram_mode=live-frontier` etkinleştirin. İş akışı, çözümlenen
`package-under-test` tarball dosyasını Telegram hattına geçirir; bağımsız
Telegram iş akışı, yayın sonrası kontroller için yayınlanmış bir npm tanımını hâlâ kabul eder.

## Yayın yayımlama otomasyonu

`OpenClaw Release Publish`, normal değişiklik yapan yayımlama giriş noktasıdır.
Güvenilir yayımlayıcı iş akışlarını yayının ihtiyaç duyduğu sırayla koordine eder:

1. Yayın etiketini checkout yapın ve commit SHA’sını çözümleyin.
2. Etiketin `main` veya `release/*` üzerinden erişilebilir olduğunu doğrulayın.
3. `pnpm plugins:sync:check` çalıştırın.
4. `publish_scope=all-publishable` ve `ref=<release-sha>` ile `Plugin NPM Release` tetikleyin.
5. Aynı kapsam ve SHA ile `Plugin ClawHub Release` tetikleyin.
6. Yayın etiketi, npm dist-tag ve kaydedilmiş `preflight_run_id` ile
   `OpenClaw NPM Release` tetikleyin.

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

Doğrudan `latest` hedefine kararlı yükseltme açıkça belirtilir:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Daha düşük seviyeli `Plugin NPM Release` ve `Plugin ClawHub Release` iş akışlarını
yalnızca odaklı onarım veya yeniden yayımlama işleri için kullanın. Seçili bir Plugin onarımı için
`plugin_publish_scope=selected` ve `plugins=@openclaw/name` değerlerini
`OpenClaw Release Publish` içine geçirin ya da OpenClaw paketinin yayımlanmaması
gerektiğinde alt iş akışını doğrudan tetikleyin.

## NPM iş akışı girdileri

`OpenClaw NPM Release`, operatör tarafından denetlenen şu girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya `v2026.4.2-beta.1` gibi zorunlu yayın etiketi; `preflight_only=true` olduğunda, yalnızca doğrulama amaçlı ön kontrol için mevcut tam 40 karakterlik iş akışı dalı commit SHA’sı da olabilir
- `preflight_only`: yalnızca doğrulama/derleme/paket için `true`, gerçek yayımlama yolu için `false`
- `preflight_run_id`: iş akışının başarılı ön kontrol çalıştırmasından hazırlanan tarball dosyasını yeniden kullanması için gerçek yayımlama yolunda zorunludur
- `npm_dist_tag`: yayımlama yolu için npm hedef etiketi; varsayılan olarak `beta`

`OpenClaw Release Publish`, operatör tarafından denetlenen şu girdileri kabul eder:

- `tag`: zorunlu yayın etiketi; önceden var olmalıdır
- `preflight_run_id`: başarılı `OpenClaw NPM Release` ön kontrol çalıştırma kimliği; `publish_openclaw_npm=true` olduğunda zorunludur
- `npm_dist_tag`: OpenClaw paketi için npm hedef etiketi
- `plugin_publish_scope`: varsayılan olarak `all-publishable`; yalnızca odaklı onarım işleri için `selected` kullanın
- `plugins`: `plugin_publish_scope=selected` olduğunda virgülle ayrılmış `@openclaw/*` paket adları
- `publish_openclaw_npm`: varsayılan olarak `true`; yalnızca iş akışını sadece Plugin onarımı koordine edicisi olarak kullanırken `false` olarak ayarlayın

`OpenClaw Release Checks`, operatör tarafından denetlenen şu girdileri kabul eder:

- `ref`: doğrulanacak dal, etiket veya tam commit SHA. Gizli bilgi içeren kontroller,
  çözümlenen commit’in bir OpenClaw dalından veya yayın etiketinden erişilebilir olmasını gerektirir.
- `run_release_soak`: kararlı/varsayılan yayın kontrollerinde kapsamlı canlı/E2E, Docker yayın yolu ve tümünden itibaren yükseltme sağ kalım soak işlemlerini seçer. `release_profile=full` tarafından zorunlu olarak açılır.

Kurallar:

- Kararlı ve düzeltme etiketleri `beta` veya `latest` hedefine yayımlanabilir
- Beta ön yayın etiketleri yalnızca `beta` hedefine yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` ve `Full Release Validation` her zaman yalnızca doğrulama amaçlıdır
- Gerçek yayımlama yolu, ön kontrol sırasında kullanılan aynı `npm_dist_tag` değerini kullanmalıdır; iş akışı yayımlama öncesinde bu metadata’nın devam ettiğini doğrular

## Kararlı npm yayın sırası

Kararlı bir npm yayını çıkarırken:

1. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın
   - Etiket oluşmadan önce, ön kontrol iş akışının yalnızca doğrulama amaçlı kuru çalıştırması için mevcut tam iş akışı dalı commit SHA’sını kullanabilirsiniz
2. Normal önce beta akışı için `npm_dist_tag=beta` seçin veya yalnızca bilinçli olarak doğrudan kararlı yayımlama istediğinizde `latest` seçin
3. Tek bir manuel iş akışından normal CI artı canlı prompt önbelleği, Docker, QA Lab, Matrix ve Telegram kapsamı istediğinizde yayın dalı, yayın etiketi veya tam commit SHA üzerinde `Full Release Validation` çalıştırın
4. Bilinçli olarak yalnızca belirlenimci normal test grafiğine ihtiyacınız varsa bunun yerine yayın ref’i üzerinde manuel `CI` iş akışını çalıştırın
5. Başarılı `preflight_run_id` değerini kaydedin
6. Aynı `tag`, aynı `npm_dist_tag` ve kaydedilmiş `preflight_run_id` ile `OpenClaw Release Publish` çalıştırın; bu, OpenClaw npm paketini yükseltmeden önce dışa alınmış Plugin'leri npm ve ClawHub üzerinde yayımlar
7. Yayın `beta` üzerine geldiyse, bu kararlı sürümü `beta` öğesinden `latest` öğesine yükseltmek için özel `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` iş akışını kullanın
8. Yayın bilinçli olarak doğrudan `latest` öğesine yayımlandıysa ve `beta` aynı kararlı derlemeyi hemen izlemeliyse, her iki dist-tag’i kararlı sürüme yönlendirmek için aynı özel iş akışını kullanın veya zamanlanmış kendi kendini iyileştiren senkronizasyonunun `beta` öğesini daha sonra taşımasına izin verin

Dist-tag değişikliği güvenlik nedeniyle özel depoda yaşar; çünkü hâlâ
`NPM_TOKEN` gerektirir, genel depo ise yalnızca OIDC yayımlamasını korur.

Bu, doğrudan yayımlama yolunu ve önce beta yükseltme yolunu hem belgelenmiş hem de operatör tarafından görülebilir tutar.

Bir bakımcının yerel npm kimlik doğrulamasına geri dönmesi gerekiyorsa, tüm 1Password
CLI (`op`) komutlarını yalnızca ayrılmış bir tmux oturumu içinde çalıştırın. `op` komutunu
ana ajan kabuğundan doğrudan çağırmayın; tmux içinde tutmak istemleri,
uyarıları ve OTP işlemesini gözlemlenebilir kılar ve tekrarlanan ana makine uyarılarını önler.

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

Bakımcılar gerçek çalışma kılavuzu için
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
içindeki özel yayın belgelerini kullanır.

## İlgili

- [Yayın kanalları](/tr/install/development-channels)
