---
read_when:
    - Herkese açık sürüm kanalı tanımları aranıyor
    - Sürüm doğrulaması veya paket kabulü çalıştırma
    - Sürüm adlandırması ve yayın temposunu arama
summary: Yayın kulvarları, operatör kontrol listesi, doğrulama kutuları, sürüm adlandırması ve yayın temposu
title: Sürüm politikası
x-i18n:
    generated_at: "2026-05-02T09:05:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce52c9144de3c8b914954db64f6ca5b2196edbbdcc7385984235a39c208bb59e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw'ın üç herkese açık yayın hattı vardır:

- stable: varsayılan olarak npm `beta`'ya veya açıkça istendiğinde npm `latest`'e yayımlanan etiketli yayınlar
- beta: npm `beta`'ya yayımlanan ön yayın etiketleri
- dev: `main` dalının hareketli başı

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
- Kararlı ve kararlı düzeltme yayınları varsayılan olarak npm `beta`'ya yayımlanır; yayın operatörleri açıkça `latest`'i hedefleyebilir veya incelenmiş bir beta derlemesini daha sonra yükseltebilir
- Her kararlı OpenClaw yayını npm paketini ve macOS uygulamasını birlikte gönderir;
  beta yayınlar normalde önce npm/paket yolunu doğrular ve yayımlar, mac
  uygulama derleme/imzalama/noter onayı ise açıkça istenmedikçe kararlı yayınlara ayrılır

## Yayın temposu

- Yayınlar önce beta olarak ilerler
- Kararlı yayın yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar normalde yayınları mevcut `main` dalından oluşturulan bir
  `release/YYYY.M.D` dalından çıkarır; böylece yayın doğrulama ve düzeltmeleri
  `main` üzerindeki yeni geliştirmeyi engellemez
- Bir beta etiketi itilmiş veya yayımlanmışsa ve düzeltme gerekiyorsa, bakımcılar
  eski beta etiketini silmek veya yeniden oluşturmak yerine sonraki `-beta.N` etiketini çıkarır
- Ayrıntılı yayın prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca bakımcılara özeldir

## Yayın operatörü kontrol listesi

Bu kontrol listesi, yayın akışının herkese açık şeklini gösterir. Özel kimlik bilgileri,
imzalama, noter onayı, dist-tag kurtarma ve acil geri alma ayrıntıları
yalnızca bakımcılara özel yayın çalıştırma kılavuzunda kalır.

1. Mevcut `main` dalından başlayın: en son değişiklikleri çekin, hedef commit'in itilmiş olduğunu
   doğrulayın ve mevcut `main` CI durumunun ondan dal açmak için yeterince yeşil olduğunu doğrulayın.
2. En üstteki `CHANGELOG.md` bölümünü gerçek commit geçmişinden
   `/changelog` ile yeniden yazın, girdileri kullanıcıya dönük tutun, commit'leyin, itin ve dal açmadan önce
   bir kez daha rebase/pull yapın.
3. Yayın uyumluluk kayıtlarını
   `src/plugins/compat/registry.ts` ve
   `src/commands/doctor/shared/deprecation-compat.ts` içinde gözden geçirin. Süresi dolmuş
   uyumluluğu yalnızca yükseltme yolu kapsanmaya devam ettiğinde kaldırın veya neden
   bilerek taşındığını kaydedin.
4. Mevcut `main` dalından `release/YYYY.M.D` oluşturun; normal yayın işini
   doğrudan `main` üzerinde yapmayın.
5. Amaçlanan etiket için gereken her sürüm konumunu artırın, yayımlanabilir Plugin paketlerinin yayın
   sürümünü ve uyumluluk meta verilerini paylaşması için
   `pnpm plugins:sync` çalıştırın, ardından yerel deterministik ön kontrolü çalıştırın:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` ve
   `pnpm release:check`.
6. `OpenClaw NPM Release` işini `preflight_only=true` ile çalıştırın. Etiket mevcut olmadan önce,
   yalnızca doğrulama amaçlı ön kontrol için tam 40 karakterlik yayın dalı SHA'sına izin verilir.
   Başarılı `preflight_run_id` değerini kaydedin.
7. Yayın dalı, etiketi veya tam commit SHA'sı için
   `Full Release Validation` ile tüm ön yayın testlerini başlatın. Bu, dört büyük yayın test kutusu
   için tek manuel giriş noktasıdır: Vitest, Docker, QA Lab ve Package.
8. Doğrulama başarısız olursa, yayın dalında düzeltin ve düzeltmeyi kanıtlayan en küçük başarısız
   dosyayı, hattı, workflow işini, paket profilini, sağlayıcıyı veya model izin listesini yeniden çalıştırın.
   Tam şemsiyeyi yalnızca değişen yüzey önceki kanıtları bayatlattığında yeniden çalıştırın.
9. Beta için `vYYYY.M.D-beta.N` etiketini oluşturun, ardından eşleşen
   `release/YYYY.M.D` dalından `OpenClaw Release Publish` çalıştırın. Bu, `pnpm plugins:sync:check` doğrulaması yapar,
   tüm yayımlanabilir Plugin paketlerini önce npm'ye yayımlar, aynı kümeyi ikinci olarak
   ClawHub'a yayımlar ve ardından hazırlanmış OpenClaw npm ön kontrol artifaktını
   dist-tag `beta` ile yükseltir. Yayımdan sonra, yayımlanan
   `openclaw@YYYY.M.D-beta.N` veya `openclaw@beta` paketine karşı yayımdan sonraki paket
   kabul testini çalıştırın. İtilmiş veya yayımlanmış bir beta düzeltme gerektirirse, sonraki `-beta.N` sürümünü çıkarın;
   eski betayı silmeyin veya yeniden yazmayın.
10. Kararlı yayın için yalnızca incelenmiş beta veya yayın adayı gerekli doğrulama kanıtına sahip olduktan sonra devam edin.
    Kararlı npm yayını da `OpenClaw Release Publish` üzerinden gider ve başarılı ön kontrol artifaktını
    `preflight_run_id` aracılığıyla yeniden kullanır; kararlı macOS yayın hazırlığı ayrıca
    paketlenmiş `.zip`, `.dmg`, `.dSYM.zip` ve güncellenmiş `appcast.xml` dosyasının `main` üzerinde bulunmasını gerektirir.
11. Yayımdan sonra npm yayımdan sonrası doğrulayıcısını, yayımdan sonra kanal kanıtı gerektiğinde isteğe bağlı bağımsız
    yayımlanmış-npm Telegram E2E testini, gerektiğinde dist-tag yükseltmeyi, eksiksiz eşleşen
    `CHANGELOG.md` bölümünden GitHub yayın/ön yayın notlarını ve yayın duyurusu
    adımlarını çalıştırın.

## Yayın ön kontrolü

- Yayın öncesi ön kontrolden önce `pnpm check:test-types` çalıştırın; böylece test TypeScript'i daha hızlı yerel `pnpm check` kapısının dışında da kapsanmış kalır
- Yayın öncesi ön kontrolden önce `pnpm check:architecture` çalıştırın; böylece daha geniş import döngüsü ve mimari sınır kontrolleri daha hızlı yerel kapının dışında yeşil olur
- `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın; böylece beklenen `dist/*` yayın yapıtları ve Control UI paketi, paket doğrulama adımı için mevcut olur
- Kök sürüm artırıldıktan sonra ve etiketlemeden önce `pnpm plugins:sync` çalıştırın. Bu komut, yayımlanabilir Plugin paket sürümlerini, OpenClaw eş/API uyumluluğu meta verilerini, derleme meta verilerini ve Plugin değişiklik günlüğü taslaklarını çekirdek yayın sürümüyle eşleşecek şekilde günceller. `pnpm plugins:sync:check`, değişiklik yapmayan yayın korumasıdır; bu adım unutulursa yayımlama iş akışı herhangi bir kayıt mutasyonundan önce başarısız olur.
- Yayın onayından önce manuel `Full Release Validation` iş akışını çalıştırarak tüm yayın öncesi test kutularını tek giriş noktasından başlatın. Bir dal, etiket veya tam commit SHA'sı kabul eder; manuel `CI` gönderir ve kurulum duman testi, paket kabulü, Docker yayın yolu takımları, canlı/E2E, OpenWebUI, QA Lab paritesi, Matrix ve Telegram hatları için `OpenClaw Release Checks` gönderir. `release_profile=full` ve `rerun_group=all` ile ayrıca yayın kontrollerinden gelen `release-package-under-test` yapıtına karşı paket Telegram E2E çalıştırır. Aynı Telegram E2E'nin yayımlanmış npm paketini de kanıtlaması gerektiğinde yayımlamadan sonra `npm_telegram_package_spec` sağlayın. Özel kanıt raporunun, Telegram E2E'yi zorlamadan doğrulamanın yayımlanmış bir npm paketiyle eşleştiğini kanıtlaması gerektiğinde `evidence_package_spec` sağlayın.
  Örnek:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Yayın çalışması devam ederken bir paket adayı için yan kanal kanıtı istediğinizde manuel `Package Acceptance` iş akışını çalıştırın. `openclaw@beta`, `openclaw@latest` veya tam bir yayın sürümü için `source=npm`; geçerli `workflow_ref` donanımıyla güvenilir bir `package_ref` dalını/etiketini/SHA'sını paketlemek için `source=ref`; zorunlu SHA-256 ile bir HTTPS tarball için `source=url`; ya da başka bir GitHub Actions çalıştırması tarafından yüklenen bir tarball için `source=artifact` kullanın. İş akışı adayı `package-under-test` olarak çözer, Docker E2E yayın zamanlayıcısını bu tarball'a karşı yeniden kullanır ve `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` ile aynı tarball'a karşı Telegram QA çalıştırabilir. Seçilen Docker hatları `published-upgrade-survivor` içerdiğinde, paket yapıtı adaydır ve `published_upgrade_survivor_baseline` yayımlanmış taban sürümü seçer.
  Örnek: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Yaygın profiller:
  - `smoke`: kurulum/kanal/ajan, Gateway ağı ve yapılandırma yeniden yükleme hatları
  - `package`: OpenWebUI veya canlı ClawHub olmadan yapıt-yerel paket/güncelleme/Plugin hatları
  - `product`: paket profiline ek olarak MCP kanalları, cron/alt ajan temizliği,
    OpenAI web araması ve OpenWebUI
  - `full`: OpenWebUI ile Docker yayın yolu parçaları
  - `custom`: odaklı yeniden çalıştırma için tam `docker_lanes` seçimi
- Yalnızca yayın adayı için tam normal CI kapsamına ihtiyaç duyduğunuzda manuel `CI` iş akışını doğrudan çalıştırın. Manuel CI gönderimleri değişiklik kapsamını atlar ve Linux Node parçalarını, paketlenmiş Plugin parçalarını, kanal sözleşmelerini, Node 22 uyumluluğunu, `check`, `check-additional`, derleme duman testini, doküman kontrollerini, Python Skills, Windows, macOS, Android ve Control UI i18n hatlarını zorlar.
  Örnek: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Yayın telemetrisini doğrularken `pnpm qa:otel:smoke` çalıştırın. Bu komut, QA-lab'i yerel bir OTLP/HTTP alıcısı üzerinden çalıştırır ve Opik, Langfuse veya başka bir harici toplayıcı gerektirmeden dışa aktarılan iz span adlarını, sınırlandırılmış öznitelikleri ve içerik/tanımlayıcı redaksiyonunu doğrular.
- Her etiketli yayından önce `pnpm release:check` çalıştırın
- Etiket mevcut olduktan sonra mutasyon yapan yayımlama sırası için `OpenClaw Release Publish` çalıştırın. Bunu `release/YYYY.M.D` üzerinden gönderin (veya main üzerinden erişilebilir bir etiket yayımlanıyorsa `main` üzerinden), yayın etiketini ve başarılı OpenClaw npm `preflight_run_id` değerini geçirin ve bilinçli olarak odaklı bir onarım çalıştırmadığınız sürece varsayılan Plugin yayımlama kapsamını `all-publishable` olarak bırakın. İş akışı, çekirdek paketin dışsallaştırılmış Plugin'lerinden önce yayımlanmaması için Plugin npm yayımlamayı, Plugin ClawHub yayımlamayı ve OpenClaw npm yayımlamayı seri hale getirir.
- Yayın kontrolleri artık ayrı bir manuel iş akışında çalışır:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`, yayın onayından önce QA Lab sahte parite kapısını, hızlı canlı Matrix profilini ve Telegram QA hattını da çalıştırır. Canlı hatlar `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI kimlik bilgisi kiralamalarını kullanır. Tam Matrix aktarımı, medya ve E2EE envanterini paralel istediğinizde manuel `QA-Lab - All Lanes` iş akışını `matrix_profile=all` ve `matrix_shards=true` ile çalıştırın.
- Çapraz işletim sistemi kurulum ve yükseltme çalışma zamanı doğrulaması, yeniden kullanılabilir iş akışını
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` doğrudan çağıran herkese açık
  `OpenClaw Release Checks` ve `Full Release Validation` kapsamındadır
- Bu ayrım bilinçlidir: gerçek npm yayın yolunu kısa, deterministik ve yapıt odaklı tutarken daha yavaş canlı kontroller kendi hatlarında kalır; böylece yayımlamayı duraklatmaz veya engellemezler
- Gizli bilgi taşıyan yayın kontrolleri, iş akışı mantığı ve gizli bilgiler kontrollü kalacak şekilde `Full Release
Validation` üzerinden veya `main`/yayın iş akışı ref'inden gönderilmelidir
- `OpenClaw Release Checks`, çözümlenen commit bir OpenClaw dalından veya yayın etiketinden erişilebilir olduğu sürece bir dal, etiket veya tam commit SHA'sı kabul eder
- `OpenClaw NPM Release` yalnızca doğrulama ön kontrolü, itilmiş bir etiket gerektirmeden geçerli tam 40 karakterlik iş akışı dalı commit SHA'sını da kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek bir yayımlamaya yükseltilemez
- SHA modunda iş akışı, yalnızca paket meta verisi kontrolü için `v<package.json version>` üretir; gerçek yayımlama yine gerçek bir yayın etiketi gerektirir
- Her iki iş akışı da gerçek yayımlama ve yükseltme yolunu GitHub barındırmalı çalıştırıcılarda tutarken, mutasyon yapmayan doğrulama yolu daha büyük Blacksmith Linux çalıştırıcılarını kullanabilir
- Bu iş akışı hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` iş akışı gizli bilgilerini kullanarak
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  çalıştırır
- npm yayın ön kontrolü artık ayrı yayın kontrolleri hattını beklemez
- Onaydan önce `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (veya eşleşen beta/düzeltme etiketi) çalıştırın
- npm yayımlamadan sonra yayımlanmış kayıt kurulum yolunu yeni bir geçici önekte doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (veya eşleşen beta/düzeltme sürümü) çalıştırın
- Beta yayımlamasından sonra, paylaşılan kiralanmış Telegram kimlik bilgisi havuzunu kullanarak yayımlanmış npm paketine karşı kurulu paket onboarding'ini, Telegram kurulumunu ve gerçek Telegram E2E'yi doğrulamak için `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` çalıştırın. Yerel bakımcı tek seferlik çalıştırmaları Convex değişkenlerini atlayabilir ve üç `OPENCLAW_QA_TELEGRAM_*` ortam kimlik bilgisini doğrudan geçirebilir.
- Bakımcılar aynı yayımlama sonrası kontrolü GitHub Actions üzerinden manuel `NPM Telegram Beta E2E` iş akışıyla çalıştırabilir. Bu bilinçli olarak yalnızca manueldir ve her birleştirmede çalışmaz.
- Bakımcı yayın otomasyonu artık ön kontrol-sonra-yükseltme kullanır:
  - gerçek npm yayımlama başarılı bir npm `preflight_run_id` geçmelidir
  - gerçek npm yayımlama, başarılı ön kontrol çalıştırmasıyla aynı `main` veya
    `release/YYYY.M.D` dalından gönderilmelidir
  - kararlı npm yayınları varsayılan olarak `beta` kullanır
  - kararlı npm yayımlama, iş akışı girdisiyle açıkça `latest` hedefleyebilir
  - token tabanlı npm dist-tag mutasyonu artık güvenlik için
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    içinde yer alır; çünkü `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirirken herkese açık repo yalnızca OIDC yayımlamayı tutar
  - herkese açık `macOS Release` yalnızca doğrulamadır; bir etiket yalnızca bir yayın dalında yaşıyorsa ama iş akışı `main` üzerinden gönderiliyorsa
    `public_release_branch=release/YYYY.M.D` ayarlayın
  - gerçek özel mac yayımlama başarılı özel mac
    `preflight_run_id` ve `validate_run_id` geçmelidir
  - gerçek yayımlama yolları hazırlanmış yapıtları yeniden derlemek yerine yükseltir
- `YYYY.M.D-N` gibi kararlı düzeltme yayınları için yayımlama sonrası doğrulayıcı, aynı geçici önek yükseltme yolunu `YYYY.M.D` sürümünden `YYYY.M.D-N` sürümüne de kontrol eder; böylece yayın düzeltmeleri eski global kurulumları sessizce temel kararlı yük üzerinde bırakamaz
- npm yayın ön kontrolü, tarball hem `dist/control-ui/index.html` hem de boş olmayan bir `dist/control-ui/assets/` yükü içermedikçe kapalı başarısız olur; böylece boş bir tarayıcı panosunu tekrar göndermeyiz
- Yayımlama sonrası doğrulama, yayımlanmış Plugin giriş noktalarının ve paket meta verilerinin kurulu kayıt düzeninde mevcut olduğunu da kontrol eder. Eksik Plugin çalışma zamanı yükleriyle gönderilen bir yayın, yayımlama sonrası doğrulayıcıda başarısız olur ve `latest` sürümüne yükseltilemez.
- `pnpm test:install:smoke`, aday güncelleme tarball'ında npm paket `unpackedSize` bütçesini de uygular; böylece kurucu e2e, yayın yayımlama yolundan önce kazara paket şişmesini yakalar
- Yayın çalışması CI planlamasına, Plugin zamanlama manifestlerine veya
  Plugin test matrislerine dokunduysa, onaydan önce
  `.github/workflows/plugin-prerelease.yml` içinden planlayıcıya ait
  `plugin-prerelease-extension-shard` matris çıktılarını yeniden oluşturup gözden geçirin; böylece yayın notları eski bir CI düzenini tarif etmez
- Kararlı macOS yayın hazırlığı güncelleyici yüzeylerini de içerir:
  - GitHub yayını paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` ile sonuçlanmalıdır
  - `main` üzerindeki `appcast.xml`, yayımlamadan sonra yeni kararlı zip'e işaret etmelidir
  - paketlenmiş uygulama, debug olmayan bir bundle id, boş olmayan bir Sparkle feed
    URL'si ve bu yayın sürümü için kanonik Sparkle derleme tabanına eşit veya onun üzerinde bir `CFBundleVersion` korumalıdır

## Yayın test kutuları

`Full Release Validation`, operatörlerin tüm yayın öncesi testleri tek giriş noktasından başlatma yöntemidir. Hızlı değişen bir dalda sabitlenmiş commit kanıtı için yardımcıyı kullanın; böylece her alt iş akışı hedef SHA'da sabitlenmiş geçici bir daldan çalışır:

```bash
pnpm ci:full-release --sha <full-sha>
```

Yardımcı `release-ci/<sha>-...` dalını iter, bu daldan `ref=<sha>` ile `Full Release Validation` gönderir, her alt iş akışının `headSha` değerinin hedefle eşleştiğini doğrular, ardından geçici dalı siler. Bu, yanlışlıkla daha yeni bir `main` alt çalıştırmasını kanıtlamayı önler.

Yayın dalı veya etiket doğrulaması için bunu güvenilir `main` iş akışı ref'inden çalıştırın ve yayın dalını veya etiketini `ref` olarak geçirin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

İş akışı hedef ref'i çözümler, `target_ref=<release-ref>` ile manuel `CI` çalıştırır, `OpenClaw Release Checks` çalıştırır ve `release_profile=full` ile `rerun_group=all` olduğunda veya `npm_telegram_package_spec` ayarlandığında bağımsız paket Telegram E2E çalıştırır. Ardından `OpenClaw Release Checks`; kurulum duman testi, çapraz işletim sistemi sürüm kontrolleri, canlı/E2E Docker sürüm yolu kapsamı, Telegram paket QA ile Package Acceptance, QA Lab paritesi, canlı Matrix ve canlı Telegram için dağıtılır. Tam çalıştırma yalnızca `Full Release Validation` özetinde `normal_ci` ve `release_checks` başarılı gösterildiğinde kabul edilebilir. full/all modunda `npm_telegram` alt çalışması da başarılı olmalıdır; full/all dışında, yayımlanmış bir `npm_telegram_package_spec` sağlanmadıkça atlanır. Son doğrulayıcı özeti, her alt çalışma için en yavaş iş tablolarını içerir; böylece sürüm yöneticisi günlükleri indirmeden mevcut kritik yolu görebilir.
Tam aşama matrisi, kesin iş akışı iş adları, stable ve full profil farkları, yapıtlar ve odaklı yeniden çalıştırma tutamaçları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.
Alt iş akışları, hedef `ref` daha eski bir sürüm dalını veya etiketini gösterse bile `Full Release Validation` çalıştıran güvenilir ref'ten, normalde `--ref main` üzerinden çalıştırılır. Ayrı bir Full Release Validation workflow-ref girdisi yoktur; güvenilir koşumu iş akışı çalıştırma ref'ini seçerek belirleyin.
Hareketli `main` üzerinde kesin commit kanıtı için `--ref main -f ref=<sha>` kullanmayın; ham commit SHA'ları iş akışı dispatch ref'i olamaz, bu nedenle sabitlenmiş geçici dalı oluşturmak için `pnpm ci:full-release --sha <sha>` kullanın.

Canlı/provider kapsamını seçmek için `release_profile` kullanın:

- `minimum`: en hızlı sürüm açısından kritik OpenAI/core canlı ve Docker yolu
- `stable`: sürüm onayı için minimum artı kararlı provider/backend kapsamı
- `full`: stable artı geniş danışma provider/medya kapsamı

`OpenClaw Release Checks`, hedef ref'i bir kez `release-package-under-test` olarak çözmek için güvenilir iş akışı ref'ini kullanır ve bu yapıtı hem sürüm yolu Docker kontrollerinde hem de Package Acceptance içinde yeniden kullanır. Bu, tüm paket odaklı kutuların aynı baytlar üzerinde kalmasını sağlar ve tekrarlanan paket derlemelerini önler.
Çapraz işletim sistemi OpenAI kurulum duman testi, repo/kuruluş değişkeni ayarlandığında `OPENCLAW_CROSS_OS_OPENAI_MODEL`, aksi halde `openai/gpt-5.5` kullanır; çünkü bu hat en yavaş varsayılan modeli kıyaslamak yerine paket kurulumunu, onboarding'i, Gateway başlatmayı ve tek bir canlı agent turunu kanıtlar. Daha geniş canlı provider matrisi, modele özgü kapsam için kullanılan yerdir.

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

Odaklı bir düzeltmeden sonraki ilk yeniden çalıştırma olarak tam şemsiyeyi kullanmayın. Bir kutu başarısız olursa, sonraki kanıt için başarısız olan alt iş akışını, işi, Docker hattını, paket profilini, model provider'ını veya QA hattını kullanın. Tam şemsiyeyi yalnızca düzeltme paylaşılan sürüm orkestrasyonunu değiştirdiğinde veya önceki tüm kutu kanıtlarını bayatlattığında yeniden çalıştırın. Şemsiyenin son doğrulayıcısı kaydedilmiş alt iş akışı çalışma kimliklerini yeniden kontrol eder; bu nedenle bir alt iş akışı başarıyla yeniden çalıştırıldıktan sonra yalnızca başarısız `Verify full validation` üst işini yeniden çalıştırın.

Sınırlı kurtarma için şemsiyeye `rerun_group` geçirin. `all` gerçek sürüm adayı çalıştırmasıdır, `ci` yalnızca normal CI alt çalışmasını çalıştırır, `plugin-prerelease` yalnızca sürüme özel Plugin alt çalışmasını çalıştırır, `release-checks` her sürüm kutusunu çalıştırır ve daha dar sürüm grupları `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ve `npm-telegram` değerleridir.
Odaklı `npm-telegram` yeniden çalıştırmaları `npm_telegram_package_spec` gerektirir; `release_profile=full` ile full/all çalışmaları release-checks paket yapıtını kullanır.

### Vitest

Vitest kutusu manuel `CI` alt iş akışıdır. Manuel CI, değişiklik kapsamını kasıtlı olarak atlar ve sürüm adayı için normal test grafiğini zorunlu kılar: Linux Node shard'ları, paketlenmiş Plugin shard'ları, kanal sözleşmeleri, Node 22 uyumluluğu, `check`, `check-additional`, derleme duman testi, doküman kontrolleri, Python Skills, Windows, macOS, Android ve Control UI i18n.

Bu kutuyu "kaynak ağacı tam normal test paketinden geçti mi?" sorusunu yanıtlamak için kullanın. Bu, sürüm yolu ürün doğrulamasıyla aynı değildir. Saklanacak kanıtlar:

- çalıştırılan `CI` çalışma URL'sini gösteren `Full Release Validation` özeti
- kesin hedef SHA üzerinde yeşil `CI` çalışması
- regresyonlar araştırılırken CI işlerinden başarısız veya yavaş shard adları
- bir çalıştırmanın performans analizi gerektiğinde `.artifacts/vitest-shard-timings.json` gibi Vitest zamanlama yapıtları

Manuel CI'ı doğrudan yalnızca sürüm deterministik normal CI gerektiriyor ancak Docker, QA Lab, canlı, çapraz işletim sistemi veya paket kutularını gerektirmiyorsa çalıştırın:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker kutusu, `OpenClaw Release Checks` içinde `openclaw-live-and-e2e-checks-reusable.yml` üzerinden ve sürüm modu `install-smoke` iş akışıyla bulunur. Sürüm adayını yalnızca kaynak düzeyi testler yerine paketlenmiş Docker ortamları üzerinden doğrular.

Sürüm Docker kapsamı şunları içerir:

- yavaş Bun genel kurulum duman testi etkinleştirilmiş tam kurulum duman testi
- hedef SHA'ya göre kök Dockerfile duman testi imajı hazırlama/yeniden kullanma; QR, kök/gateway ve installer/Bun duman testi işleri ayrı install-smoke shard'ları olarak çalışır
- depo E2E hatları
- sürüm yolu Docker parçaları: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g` ve `plugins-runtime-install-h`
- istendiğinde `plugins-runtime-services` parçası içinde OpenWebUI kapsamı
- `bundled-plugin-install-uninstall-0` ile `bundled-plugin-install-uninstall-23` arasında bölünmüş paketlenmiş Plugin kurulum/kaldırma hatları
- sürüm kontrolleri canlı paketleri içerdiğinde canlı/E2E provider paketleri ve Docker canlı model kapsamı

Yeniden çalıştırmadan önce Docker yapıtlarını kullanın. Sürüm yolu zamanlayıcısı, hat günlükleri, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı planı JSON'u ve yeniden çalıştırma komutlarıyla `.artifacts/docker-tests/` yükler. Odaklı kurtarma için tüm sürüm parçalarını yeniden çalıştırmak yerine yeniden kullanılabilir canlı/E2E iş akışında `docker_lanes=<lane[,lane]>` kullanın. Oluşturulan yeniden çalıştırma komutları, mevcut olduğunda önceki `package_artifact_run_id` ve hazırlanmış Docker imajı girdilerini içerir; böylece başarısız bir hat aynı tarball'ı ve GHCR imajlarını yeniden kullanabilir.

### QA Lab

QA Lab kutusu da `OpenClaw Release Checks` öğesinin parçasıdır. Vitest ve Docker paket mekaniklerinden ayrı agentic davranış ve kanal düzeyi sürüm kapısıdır.

Sürüm QA Lab kapsamı şunları içerir:

- agentic parite paketi kullanılarak OpenAI aday hattını Opus 4.6 taban çizgisiyle karşılaştıran mock parite kapısı
- `qa-live-shared` ortamını kullanan hızlı canlı Matrix QA profili
- Convex CI kimlik bilgisi kiralamalarını kullanan canlı Telegram QA hattı
- sürüm telemetrisi açık yerel kanıt gerektirdiğinde `pnpm qa:otel:smoke`

Bu kutuyu "sürüm QA senaryolarında ve canlı kanal akışlarında doğru davranıyor mu?" sorusunu yanıtlamak için kullanın. Sürümü onaylarken parite, Matrix ve Telegram hatları için yapıt URL'lerini saklayın. Tam Matrix kapsamı, varsayılan sürüm açısından kritik hat yerine manuel shard'lı QA-Lab çalışması olarak kullanılabilir durumda kalır.

### Paket

Paket kutusu kurulabilir ürün kapısıdır. `Package Acceptance` ve `scripts/resolve-openclaw-package-candidate.mjs` çözümleyicisi tarafından desteklenir. Çözümleyici bir adayı Docker E2E tarafından tüketilen `package-under-test` tarball'ına normalleştirir, paket envanterini doğrular, paket sürümünü ve SHA-256 değerini kaydeder ve iş akışı koşum ref'ini paket kaynak ref'inden ayrı tutar.

Desteklenen aday kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya kesin bir OpenClaw sürüm versiyonu
- `source=ref`: seçilen `workflow_ref` koşumuyla güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA'sını paketle
- `source=url`: gerekli `package_sha256` ile bir HTTPS `.tgz` indir
- `source=artifact`: başka bir GitHub Actions çalışması tarafından yüklenen `.tgz` dosyasını yeniden kullan

`OpenClaw Release Checks`, Package Acceptance'ı `source=artifact`, hazırlanmış sürüm paketi yapıtı, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` ve `telegram_mode=mock-openai` ile çalıştırır. Package Acceptance; migration, update, eski Plugin bağımlılığı temizliği, çevrimdışı Plugin fixture'ları, Plugin update ve Telegram paket QA çalışmalarını aynı çözülmüş tarball'a karşı tutar. Bu, daha önce Parallels gerektiren paket/update kapsamının çoğu için GitHub yerel yerine geçer. Çapraz işletim sistemi sürüm kontrolleri işletim sistemine özgü onboarding, installer ve platform davranışı için hâlâ önemlidir; ancak paket/update ürün doğrulaması Package Acceptance'ı tercih etmelidir.

Update ve Plugin doğrulaması için kanonik kontrol listesi [Update ve Plugin testleri](/tr/help/testing-updates-plugins) bölümüdür. Bir Plugin kurulum/update, doctor cleanup veya yayımlanmış paket migration değişikliğini hangi yerel, Docker, Package Acceptance veya release-check hattının kanıtladığına karar verirken bunu kullanın.
Her kararlı `2026.4.23+` paketinden kapsamlı yayımlanmış update migration'ı, Full Release CI'ın parçası değil, ayrı bir manuel `Update Migration` iş akışıdır.

Eski package-acceptance toleransı kasıtlı olarak zaman sınırlıdır. `2026.4.25` dahil paketler, npm'e zaten yayımlanmış metadata boşlukları için uyumluluk yolunu kullanabilir: tarball'da eksik özel QA envanter girdileri, eksik `gateway install --wrapper`, tarball türevi git fixture içinde eksik patch dosyaları, eksik kalıcı `update.channel`, eski Plugin install-record konumları, eksik marketplace install-record kalıcılığı ve `plugins update` sırasında config metadata migration. Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel build metadata stamp dosyaları için uyarı verebilir. Daha sonraki paketler modern paket sözleşmelerini karşılamalıdır; aynı boşluklar sürüm doğrulamasını başarısız kılar.

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

- `smoke`: hızlı paket kurulum/kanal/agent, Gateway ağı ve config yeniden yükleme hatları
- `package`: canlı ClawHub olmadan install/update/Plugin paket sözleşmeleri; bu release-check varsayılanıdır
- `product`: `package` artı MCP kanalları, cron/subagent cleanup, OpenAI web araması ve OpenWebUI
- `full`: OpenWebUI ile Docker sürüm yolu parçaları
- `custom`: odaklı yeniden çalıştırmalar için kesin `docker_lanes` listesi

Paket adayı Telegram kanıtı için Package Acceptance üzerinde `telegram_mode=mock-openai` veya
`telegram_mode=live-frontier` etkinleştirin. İş akışı, çözümlenen
`package-under-test` tarball dosyasını Telegram hattına geçirir; bağımsız
Telegram iş akışı, yayın sonrası kontroller için yayınlanmış bir npm belirtimini hâlâ kabul eder.

## Sürüm yayınlama otomasyonu

`OpenClaw Release Publish`, normal değişiklik yapan yayınlama giriş noktasıdır. Sürümün ihtiyaç duyduğu sırayla güvenilir yayıncı iş akışlarını düzenler:

1. Sürüm etiketini checkout yapın ve commit SHA değerini çözümleyin.
2. Etiketin `main` veya `release/*` üzerinden erişilebilir olduğunu doğrulayın.
3. `pnpm plugins:sync:check` çalıştırın.
4. `publish_scope=all-publishable` ve `ref=<release-sha>` ile `Plugin NPM Release` tetikleyin.
5. Aynı kapsam ve SHA ile `Plugin ClawHub Release` tetikleyin.
6. Sürüm etiketi, npm dist-tag ve kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` tetikleyin.

Beta yayınlama örneği:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Varsayılan beta dist-tag için kararlı yayınlama:

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

Daha düşük düzeyli `Plugin NPM Release` ve `Plugin ClawHub Release` iş akışlarını yalnızca odaklanmış onarım veya yeniden yayınlama işleri için kullanın. Seçili bir Plugin onarımı için `OpenClaw Release Publish` öğesine `plugin_publish_scope=selected` ve `plugins=@openclaw/name` iletin ya da OpenClaw paketinin yayınlanmaması gerekiyorsa alt iş akışını doğrudan tetikleyin.

## NPM iş akışı girdileri

`OpenClaw NPM Release` şu operatör denetimli girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya `v2026.4.2-beta.1` gibi zorunlu sürüm etiketi; `preflight_only=true` olduğunda, yalnızca doğrulama ön kontrolü için geçerli tam 40 karakterli iş akışı dalı commit SHA değeri de olabilir
- `preflight_only`: yalnızca doğrulama/derleme/paket için `true`, gerçek yayınlama yolu için `false`
- `preflight_run_id`: iş akışının başarılı ön kontrol çalıştırmasından hazırlanan tarball dosyasını yeniden kullanması için gerçek yayınlama yolunda zorunludur
- `npm_dist_tag`: yayınlama yolu için npm hedef etiketi; varsayılanı `beta`

`OpenClaw Release Publish` şu operatör denetimli girdileri kabul eder:

- `tag`: zorunlu sürüm etiketi; önceden var olmalıdır
- `preflight_run_id`: başarılı `OpenClaw NPM Release` ön kontrol çalıştırma kimliği; `publish_openclaw_npm=true` olduğunda zorunludur
- `npm_dist_tag`: OpenClaw paketi için npm hedef etiketi
- `plugin_publish_scope`: varsayılanı `all-publishable`; `selected` değerini yalnızca odaklanmış onarım çalışması için kullanın
- `plugins`: `plugin_publish_scope=selected` olduğunda virgülle ayrılmış `@openclaw/*` paket adları
- `publish_openclaw_npm`: varsayılanı `true`; yalnızca iş akışını Plugin-only onarım düzenleyicisi olarak kullanırken `false` ayarlayın

`OpenClaw Release Checks` şu operatör denetimli girdileri kabul eder:

- `ref`: doğrulanacak dal, etiket veya tam commit SHA. Gizli içeren kontroller, çözümlenen commit'in bir OpenClaw dalından veya sürüm etiketinden erişilebilir olmasını gerektirir.

Kurallar:

- Kararlı ve düzeltme etiketleri `beta` veya `latest` olarak yayınlanabilir
- Beta ön sürüm etiketleri yalnızca `beta` olarak yayınlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` ve `Full Release Validation` her zaman yalnızca doğrulama amaçlıdır
- Gerçek yayınlama yolu, ön kontrol sırasında kullanılan aynı `npm_dist_tag` değerini kullanmalıdır; iş akışı, yayınlamadan önce bu metadata bilgisinin devam ettiğini doğrular

## Kararlı npm sürüm sırası

Kararlı bir npm sürümü çıkarırken:

1. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın
   - Bir etiket var olmadan önce, ön kontrol iş akışının yalnızca doğrulama amaçlı deneme çalıştırması için geçerli tam iş akışı dalı commit SHA değerini kullanabilirsiniz
2. Normal beta öncelikli akış için `npm_dist_tag=beta` seçin veya yalnızca doğrudan kararlı yayınlama istediğinizde `latest` seçin
3. Tek bir manuel iş akışından normal CI ile canlı istem önbelleği, Docker, QA Lab, Matrix ve Telegram kapsamı istediğinizde sürüm dalı, sürüm etiketi veya tam commit SHA üzerinde `Full Release Validation` çalıştırın
4. Bilinçli olarak yalnızca deterministik normal test grafiğine ihtiyacınız varsa, bunun yerine sürüm ref üzerinde manuel `CI` iş akışını çalıştırın
5. Başarılı `preflight_run_id` değerini kaydedin
6. Aynı `tag`, aynı `npm_dist_tag` ve kaydedilmiş `preflight_run_id` ile `OpenClaw Release Publish` çalıştırın; OpenClaw npm paketini yükseltmeden önce dışsallaştırılmış plugins öğelerini npm ve ClawHub üzerinde yayınlar
7. Sürüm `beta` üzerinde yayınlandıysa, bu kararlı sürümü `beta` etiketinden `latest` etiketine yükseltmek için özel `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` iş akışını kullanın
8. Sürüm kasıtlı olarak doğrudan `latest` üzerinde yayınlandıysa ve `beta` aynı kararlı derlemeyi hemen izlemeliyse, her iki dist-tag değerini de kararlı sürüme yönlendirmek için aynı özel iş akışını kullanın veya zamanlanmış kendi kendini iyileştiren eşitlemesinin `beta` değerini daha sonra taşımasına izin verin

Dist-tag değişikliği, hâlâ `NPM_TOKEN` gerektirdiği için güvenlik nedeniyle özel depoda bulunur; public depo ise yalnızca OIDC yayınlamasını korur.

Bu, doğrudan yayınlama yolunu ve beta öncelikli yükseltme yolunu hem belgelenmiş hem de operatör tarafından görünür tutar.

Bir bakımcının yerel npm kimlik doğrulamasına geri dönmesi gerekiyorsa, tüm 1Password CLI (`op`) komutlarını yalnızca ayrılmış bir tmux oturumu içinde çalıştırın. `op` komutunu ana ajan kabuğundan doğrudan çağırmayın; tmux içinde tutmak istemleri, uyarıları ve OTP işlemeyi gözlemlenebilir kılar ve tekrarlanan ana makine uyarılarını önler.

## Genel başvurular

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Bakımcılar, gerçek çalıştırma kılavuzu için
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
konumundaki özel sürüm belgelerini kullanır.

## İlgili

- [Sürüm kanalları](/tr/install/development-channels)
