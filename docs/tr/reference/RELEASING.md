---
read_when:
    - Herkese açık sürüm kanalı tanımları aranıyor
    - Sürüm doğrulaması veya paket kabulü çalıştırma
    - Sürüm adlandırması ve yayın temposunu arıyorsanız
summary: Sürüm hatları, operatör kontrol listesi, doğrulama kutuları, sürüm adlandırması ve yayın temposu
title: Sürüm politikası
x-i18n:
    generated_at: "2026-05-05T06:19:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9980265c30c6a6571db5512749ec173cca79ac70494fd09968add793be9717a5
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw'un üç herkese açık yayın kanalı vardır:

- stable: varsayılan olarak npm `beta`'ya yayımlanan veya açıkça istendiğinde npm `latest`'e yayımlanan etiketli yayınlar
- beta: npm `beta`'ya yayımlanan ön yayın etiketleri
- dev: `main` dalının hareketli uç noktası

## Sürüm adlandırması

- Kararlı yayın sürümü: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Kararlı düzeltme yayını sürümü: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön yayın sürümü: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ay veya günü sıfırla doldurmayın
- `latest`, şu anda terfi ettirilmiş kararlı npm yayını anlamına gelir
- `beta`, geçerli beta kurulum hedefi anlamına gelir
- Kararlı ve kararlı düzeltme yayınları varsayılan olarak npm `beta`'ya yayımlanır; yayın operatörleri açıkça `latest` hedefleyebilir veya denetlenmiş bir beta derlemesini daha sonra terfi ettirebilir
- Her kararlı OpenClaw yayını npm paketini ve macOS uygulamasını birlikte gönderir;
  beta yayınları normalde önce npm/paket yolunu doğrular ve yayımlar; mac
  uygulamasını derleme/imzalama/noter onayı işlemleri, açıkça istenmedikçe kararlı yayınlara ayrılır

## Yayın temposu

- Yayınlar önce beta üzerinden ilerler
- Kararlı yayın yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar normalde yayınları mevcut `main` dalından oluşturulan bir
  `release/YYYY.M.D` dalından çıkarır; böylece yayın doğrulaması ve düzeltmeleri
  `main` üzerindeki yeni geliştirmeyi engellemez
- Bir beta etiketi gönderilmiş veya yayımlanmışsa ve düzeltme gerekiyorsa, bakımcılar
  eski beta etiketini silmek veya yeniden oluşturmak yerine sonraki `-beta.N`
  etiketini çıkarır
- Ayrıntılı yayın prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca bakımcılara özeldir

## Yayın operatörü kontrol listesi

Bu kontrol listesi yayın akışının herkese açık biçimidir. Özel kimlik bilgileri,
imzalama, noter onayı, dist-tag kurtarma ve acil geri alma ayrıntıları
yalnızca bakımcılara özel yayın runbook'unda kalır.

1. Mevcut `main` dalından başlayın: en son değişiklikleri çekin, hedef commit'in gönderildiğini onaylayın
   ve mevcut `main` CI durumunun dallanmak için yeterince yeşil olduğunu doğrulayın.
2. Üstteki `CHANGELOG.md` bölümünü gerçek commit geçmişinden `/changelog` ile yeniden yazın,
   girdileri kullanıcıya dönük tutun, commit'leyin, gönderin ve dallanmadan önce
   bir kez daha rebase/pull yapın.
3. Yayın uyumluluk kayıtlarını
   `src/plugins/compat/registry.ts` ve
   `src/commands/doctor/shared/deprecation-compat.ts` içinde inceleyin. Süresi dolmuş
   uyumluluğu yalnızca yükseltme yolu kapsanmaya devam ettiğinde kaldırın veya neden
   kasıtlı olarak taşındığını kaydedin.
4. Mevcut `main` dalından `release/YYYY.M.D` oluşturun; normal yayın işlerini
   doğrudan `main` üzerinde yapmayın.
5. Hedeflenen etiket için gerekli her sürüm konumunu artırın, yayımlanabilir Plugin paketlerinin yayın
   sürümünü ve uyumluluk meta verilerini paylaşması için `pnpm plugins:sync` çalıştırın,
   ardından yerel deterministik ön kontrolü çalıştırın:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` ve
   `pnpm release:check`.
6. `OpenClaw NPM Release` işini `preflight_only=true` ile çalıştırın. Etiket yokken,
   yalnızca doğrulama amaçlı ön kontrol için 40 karakterlik tam bir yayın dalı SHA'sına izin verilir.
   Başarılı `preflight_run_id` değerini kaydedin.
7. Yayın dalı, etiketi veya tam commit SHA'sı için `Full Release Validation` ile
   tüm yayın öncesi testleri başlatın. Bu, dört büyük yayın test kutusu için tek manuel
   giriş noktasıdır: Vitest, Docker, QA Lab ve Package.
8. Doğrulama başarısız olursa yayın dalında düzeltin ve düzeltmeyi kanıtlayan en küçük başarısız
   dosyayı, kanalı, iş akışı işini, paket profilini, sağlayıcıyı veya model izin listesini yeniden çalıştırın.
   Tam şemsiyeyi yalnızca değişen yüzey önceki kanıtları bayatlattığında yeniden çalıştırın.
9. Beta için `vYYYY.M.D-beta.N` etiketini oluşturun, ardından eşleşen
   `release/YYYY.M.D` dalından `OpenClaw Release Publish` çalıştırın. Bu işlem
   `pnpm plugins:sync:check` doğrulaması yapar, tüm yayımlanabilir Plugin paketlerini önce npm'e yayımlar,
   aynı seti ikinci olarak ClawHub'a ClawPack npm-pack tarball'ları olarak yayımlar ve ardından
   hazırlanmış OpenClaw npm ön kontrol artefaktını eşleşen dist-tag ile terfi ettirir. Yayından sonra,
   yayımlanan `openclaw@YYYY.M.D-beta.N` veya
   `openclaw@beta` paketine karşı yayın sonrası paket kabulünü çalıştırın. Gönderilmiş veya yayımlanmış
   bir ön yayın düzeltme gerektirirse, sonraki eşleşen ön yayın numarasını çıkarın; eski
   ön yayını silmeyin veya yeniden yazmayın.
10. Kararlı yayın için yalnızca denetlenmiş beta veya yayın adayı gerekli doğrulama kanıtlarına sahip olduktan sonra
    devam edin. Kararlı npm yayını da `OpenClaw Release Publish` üzerinden geçer ve başarılı ön kontrol artefaktını
    `preflight_run_id` aracılığıyla yeniden kullanır; kararlı macOS yayın hazırlığı ayrıca
    paketlenmiş `.zip`, `.dmg`, `.dSYM.zip` ve güncellenmiş `appcast.xml` dosyasının `main` üzerinde bulunmasını gerektirir.
11. Yayından sonra npm yayın sonrası doğrulayıcıyı, yayın sonrası kanal kanıtı gerektiğinde isteğe bağlı bağımsız
    yayımlanmış-npm Telegram E2E'yi, gerektiğinde dist-tag terfisini, tam eşleşen
    `CHANGELOG.md` bölümünden GitHub yayın/ön yayın notlarını ve yayın duyurusu
    adımlarını çalıştırın.

## Yayın ön kontrolü

- `pnpm check:test-types` komutunu sürüm ön kontrolünden önce çalıştırın; böylece test TypeScript kapsamı daha hızlı yerel `pnpm check` kapısı dışında da korunur
- `pnpm check:architecture` komutunu sürüm ön kontrolünden önce çalıştırın; böylece daha geniş import döngüsü ve mimari sınır denetimleri daha hızlı yerel kapı dışında yeşil olur
- `pnpm build && pnpm ui:build` komutunu `pnpm release:check` öncesinde çalıştırın; böylece beklenen `dist/*` sürüm artefaktları ve Control UI paketi, paket doğrulama adımı için mevcut olur
- Kök sürüm artırmasından sonra ve etiketlemeden önce `pnpm plugins:sync` komutunu çalıştırın. Bu komut yayımlanabilir Plugin paket sürümlerini, OpenClaw eş/API uyumluluk metadatasını, derleme metadatasını ve Plugin değişiklik günlüğü taslaklarını çekirdek sürüm sürümüyle eşleşecek şekilde günceller. `pnpm plugins:sync:check`, mutasyon yapmayan sürüm korumasıdır; bu adım unutulursa yayımlama iş akışı herhangi bir registry mutasyonundan önce başarısız olur.
- Sürüm onayından önce tüm sürüm öncesi test kutularını tek bir giriş noktasından başlatmak için manuel `Full Release Validation` iş akışını çalıştırın. Bir dalı, etiketi veya tam commit SHA'sını kabul eder, manuel `CI` gönderir ve kurulum duman testi, paket kabulü, işletim sistemleri arası paket denetimleri, QA Lab paritesi, Matrix ve Telegram şeritleri için `OpenClaw Release Checks` gönderir. Kararlı/varsayılan çalıştırmalar, kapsamlı canlı/E2E ve Docker sürüm yolu bekletmesini `run_release_soak=true` arkasında tutar; `release_profile=full` bekletmeyi zorunlu kılar. `release_profile=full` ve `rerun_group=all` ile ayrıca sürüm denetimlerinden gelen `release-package-under-test` artefaktına karşı paket Telegram E2E çalıştırır. Aynı Telegram E2E'nin yayımlanan npm paketini de kanıtlaması gerektiğinde yayımlamadan sonra `npm_telegram_package_spec` sağlayın. Package Acceptance'ın paket/güncelleme matrisini SHA ile derlenmiş artefakt yerine gönderilmiş npm paketine karşı çalıştırması gerektiğinde yayımlamadan sonra `package_acceptance_package_spec` sağlayın. Özel kanıt raporunun, doğrulamanın Telegram E2E'yi zorlamadan yayımlanmış bir npm paketiyle eşleştiğini kanıtlaması gerektiğinde `evidence_package_spec` sağlayın. Örnek: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Sürüm çalışması devam ederken bir paket adayı için yan kanal kanıtı istediğinizde manuel `Package Acceptance` iş akışını çalıştırın. `openclaw@beta`, `openclaw@latest` veya tam bir sürüm için `source=npm`; mevcut `workflow_ref` koşumuyla güvenilir bir `package_ref` dalını/etiketini/SHA'sını paketlemek için `source=ref`; gerekli SHA-256 ile bir HTTPS tarball için `source=url`; ya da başka bir GitHub Actions çalıştırması tarafından yüklenmiş bir tarball için `source=artifact` kullanın. İş akışı adayı `package-under-test` olarak çözer, Docker E2E sürüm zamanlayıcısını bu tarball'a karşı yeniden kullanır ve aynı tarball'a karşı `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` ile Telegram QA çalıştırabilir. Seçilen Docker şeritleri `published-upgrade-survivor` içerdiğinde, paket artefaktı adaydır ve `published_upgrade_survivor_baseline` yayımlanmış tabanı seçer. `update-restart-auth`, aday paketi hem kurulu CLI hem de package-under-test olarak kullanır; böylece aday güncelleme komutunun yönetilen yeniden başlatma yolunu çalıştırır.
  Örnek: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Yaygın profiller:
  - `smoke`: kurulum/kanal/aracı, gateway ağı ve yapılandırma yeniden yükleme şeritleri
  - `package`: OpenWebUI veya canlı ClawHub olmadan artefakt-yerel paket/güncelleme/yeniden başlatma/Plugin şeritleri
  - `product`: paket profiline ek olarak MCP kanalları, cron/alt aracı temizliği, OpenAI web araması ve OpenWebUI
  - `full`: OpenWebUI ile Docker sürüm yolu parçaları
  - `custom`: odaklı bir yeniden çalıştırma için tam `docker_lanes` seçimi
- Sürüm adayı için yalnızca tam normal CI kapsamına ihtiyaç duyduğunuzda manuel `CI` iş akışını doğrudan çalıştırın. Manuel CI gönderimleri değişiklik kapsamını atlar ve Linux Node parçalarını, paketlenmiş Plugin parçalarını, kanal sözleşmelerini, Node 22 uyumluluğunu, `check`, `check-additional`, derleme duman testini, doküman denetimlerini, Python Skills, Windows, macOS, Android ve Control UI i18n şeritlerini zorlar.
  Örnek: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Sürüm telemetrisini doğrularken `pnpm qa:otel:smoke` komutunu çalıştırın. Bu komut QA-lab'i yerel bir OTLP/HTTP alıcısı üzerinden çalıştırır ve Opik, Langfuse veya başka bir harici toplayıcı gerektirmeden dışa aktarılan iz span adlarını, sınırlı öznitelikleri ve içerik/tanımlayıcı redaksiyonunu doğrular.
- Her etiketlenmiş sürümden önce `pnpm release:check` komutunu çalıştırın
- Etiket mevcut olduktan sonra mutasyon yapan yayımlama dizisi için `OpenClaw Release Publish` komutunu çalıştırın. Bunu `release/YYYY.M.D` üzerinden (veya main'den erişilebilen bir etiketi yayımlarken `main` üzerinden) gönderin, sürüm etiketini ve başarılı OpenClaw npm `preflight_run_id` değerini iletin ve bilinçli olarak odaklı bir onarım çalıştırmıyorsanız varsayılan Plugin yayımlama kapsamı olan `all-publishable` değerini koruyun. İş akışı Plugin npm yayımlamayı, Plugin ClawHub yayımlamayı ve OpenClaw npm yayımlamayı sıraya koyar; böylece çekirdek paket dışsallaştırılmış Plugin'lerinden önce yayımlanmaz.
- Sürüm denetimleri artık ayrı bir manuel iş akışında çalışır:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`, sürüm onayından önce QA Lab sahte parite şeridini, hızlı canlı Matrix profilini ve Telegram QA şeridini de çalıştırır. Canlı şeritler `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI kimlik bilgisi kiralarını kullanır. Tam Matrix taşıma, medya ve E2EE envanterini paralel istediğinizde manuel `QA-Lab - All Lanes` iş akışını `matrix_profile=all` ve `matrix_shards=true` ile çalıştırın.
- İşletim sistemleri arası kurulum ve yükseltme çalışma zamanı doğrulaması, yeniden kullanılabilir iş akışı olan `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` dosyasını doğrudan çağıran herkese açık `OpenClaw Release Checks` ve `Full Release Validation` kapsamındadır
- Bu ayrım bilinçlidir: gerçek npm sürüm yolunu kısa, deterministik ve artefakt odaklı tutarken daha yavaş canlı denetimler kendi şeritlerinde kalır; böylece yayımlamayı durdurmaz veya engellemezler
- Gizli bilgi taşıyan sürüm denetimleri `Full Release Validation` üzerinden veya `main`/sürüm iş akışı ref'inden gönderilmelidir; böylece iş akışı mantığı ve gizli bilgiler kontrollü kalır
- `OpenClaw Release Checks`, çözümlenen commit bir OpenClaw dalından veya sürüm etiketinden erişilebilir olduğu sürece bir dalı, etiketi veya tam commit SHA'sını kabul eder
- `OpenClaw NPM Release` yalnızca doğrulama ön kontrolü, etiket itilmesini gerektirmeden mevcut tam 40 karakterli iş akışı dalı commit SHA'sını da kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek bir yayımlamaya terfi ettirilemez
- SHA modunda iş akışı, yalnızca paket metadata denetimi için `v<package.json version>` üretir; gerçek yayımlama hâlâ gerçek bir sürüm etiketi gerektirir
- Her iki iş akışı da gerçek yayımlama ve terfi yolunu GitHub tarafından barındırılan runner'larda tutarken, mutasyon yapmayan doğrulama yolu daha büyük Blacksmith Linux runner'larını kullanabilir
- Bu iş akışı hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` iş akışı gizli bilgilerini kullanarak `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` çalıştırır
- npm sürüm ön kontrolü artık ayrı sürüm denetimleri şeridini beklemez
- Onaydan önce `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` komutunu (veya eşleşen beta/düzeltme etiketini) çalıştırın
- npm yayımlamadan sonra yayımlanan registry kurulum yolunu taze bir geçici prefix içinde doğrulamak için `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` komutunu (veya eşleşen beta/düzeltme sürümünü) çalıştırın
- Bir beta yayımlamasından sonra, paylaşılan kiralık Telegram kimlik bilgisi havuzunu kullanarak yayımlanan npm paketine karşı kurulu paket onboarding'ini, Telegram kurulumunu ve gerçek Telegram E2E'yi doğrulamak için `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` komutunu çalıştırın. Yerel bakımcı tek seferlik çalıştırmaları Convex değişkenlerini atlayabilir ve üç `OPENCLAW_QA_TELEGRAM_*` ortam kimlik bilgisini doğrudan iletebilir.
- Tam yayımlama sonrası beta duman testini bir bakımcı makinesinden çalıştırmak için `pnpm release:beta-smoke -- --beta betaN` kullanın. Yardımcı Parallels npm update/fresh-target doğrulamasını çalıştırır, `NPM Telegram Beta E2E` gönderir, tam iş akışı çalıştırmasını yoklar, artefaktı indirir ve Telegram raporunu yazdırır.
- Bakımcılar aynı yayımlama sonrası denetimi GitHub Actions üzerinden manuel `NPM Telegram Beta E2E` iş akışıyla çalıştırabilir. Bu bilinçli olarak yalnızca manueldir ve her merge işleminde çalışmaz.
- Bakımcı sürüm otomasyonu artık ön kontrol-sonra-terfi kullanır:
  - gerçek npm yayımlama, başarılı bir npm `preflight_run_id` değerinden geçmelidir
  - gerçek npm yayımlama, başarılı ön kontrol çalıştırmasıyla aynı `main` veya `release/YYYY.M.D` dalından gönderilmelidir
  - kararlı npm sürümleri varsayılan olarak `beta` hedefine gider
  - kararlı npm yayımlama, iş akışı girdisiyle açıkça `latest` hedefleyebilir
  - token tabanlı npm dist-tag mutasyonu artık güvenlik için `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` içinde bulunur; çünkü herkese açık repo yalnızca OIDC yayımlaması tutarken `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirir
  - herkese açık `macOS Release` yalnızca doğrulama içindir; bir etiket yalnızca bir sürüm dalındaysa ama iş akışı `main` üzerinden gönderiliyorsa `public_release_branch=release/YYYY.M.D` ayarlayın
  - gerçek özel mac yayımlama başarılı özel mac `preflight_run_id` ve `validate_run_id` değerlerinden geçmelidir
  - gerçek yayımlama yolları artefaktları yeniden derlemek yerine hazırlanmış artefaktları terfi ettirir
- `YYYY.M.D-N` gibi kararlı düzeltme sürümleri için yayımlama sonrası doğrulayıcı, aynı geçici prefix yükseltme yolunu `YYYY.M.D` sürümünden `YYYY.M.D-N` sürümüne de denetler; böylece sürüm düzeltmeleri eski global kurulumları sessizce temel kararlı yükte bırakamaz
- npm sürüm ön kontrolü, tarball hem `dist/control-ui/index.html` hem de boş olmayan bir `dist/control-ui/assets/` yükü içermediği sürece kapalı başarısız olur; böylece bir daha boş tarayıcı panosu göndermeyiz
- Yayımlama sonrası doğrulama, yayımlanan Plugin giriş noktalarının ve paket metadatasının kurulu registry düzeninde mevcut olduğunu da denetler. Eksik Plugin çalışma zamanı yükleriyle gönderilen bir sürüm postpublish doğrulayıcıda başarısız olur ve `latest` hedefine terfi ettirilemez.
- `pnpm test:install:smoke`, aday güncelleme tarball'ında npm paketinin `unpackedSize` bütçesini de zorunlu kılar; böylece kurucu e2e, sürüm yayımlama yolundan önce yanlışlıkla oluşan paket şişmesini yakalar
- Sürüm çalışması CI planlamasına, Plugin zamanlama manifestlerine veya Plugin test matrislerine dokunduysa, onaydan önce `.github/workflows/plugin-prerelease.yml` dosyasından planlayıcıya ait `plugin-prerelease-extension-shard` matris çıktılarını yeniden üretin ve gözden geçirin; böylece sürüm notları bayat bir CI düzenini tarif etmez
- Kararlı macOS sürüm hazırlığı, güncelleyici yüzeylerini de içerir:
  - GitHub sürümü paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` ile sonuçlanmalıdır
  - `main` üzerindeki `appcast.xml`, yayımlamadan sonra yeni kararlı zip'e işaret etmelidir
  - paketlenmiş uygulama debug olmayan bir bundle id, boş olmayan bir Sparkle feed URL'si ve o sürüm için kanonik Sparkle derleme tabanında ya da üzerinde bir `CFBundleVersion` korumalıdır

## Sürüm test kutuları

`Full Release Validation`, operatörlerin tüm sürüm öncesi testleri tek bir giriş noktasından başlatma yoludur. Hızlı hareket eden bir dalda sabitlenmiş commit kanıtı için, her alt iş akışının hedef SHA'ya sabitlenmiş geçici bir daldan çalışması amacıyla yardımcıyı kullanın:

```bash
pnpm ci:full-release --sha <full-sha>
```

Yardımcı `release-ci/<sha>-...` dalını iter, bu daldan `ref=<sha>` ile `Full Release Validation` gönderir, her alt iş akışı `headSha` değerinin hedefle eşleştiğini doğrular ve sonra geçici dalı siler. Bu, yanlışlıkla daha yeni bir `main` alt çalıştırmasını kanıtlamayı önler.

Sürüm dalı veya etiket doğrulaması için, güvenilir `main` iş akışı ref'inden çalıştırın ve sürüm dalını veya etiketini `ref` olarak iletin:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

İş akışı hedef ref'i çözer, manuel `CI` iş akışını
`target_ref=<release-ref>` ile tetikler, `OpenClaw Release Checks` iş akışını tetikler, paket odaklı kontroller için bir üst
`release-package-under-test` artefaktı hazırlar ve `release_profile=full` ile
`rerun_group=all` olduğunda ya da `npm_telegram_package_spec` ayarlandığında bağımsız paket Telegram E2E iş akışını tetikler. `OpenClaw Release
Checks` ardından install smoke, çapraz işletim sistemi release kontrolleri, soak etkinleştirildiğinde canlı/E2E Docker
release yolu kapsamı, Telegram paket QA ile Package Acceptance, QA Lab eşliği, canlı Matrix ve canlı Telegram kontrollerine yayılır. Tam bir çalıştırma yalnızca
`Full Release Validation`
özetinde `normal_ci` ve `release_checks` başarılı göründüğünde kabul edilebilir. full/all modunda,
`npm_telegram` alt iş akışı da başarılı olmalıdır; full/all dışında yayımlanmış bir `npm_telegram_package_spec` sağlanmadıkça atlanır. Son
doğrulayıcı özeti, her alt çalıştırma için en yavaş iş tablolarını içerir; böylece release
yöneticisi logları indirmeden geçerli kritik yolu görebilir.
Tam aşama matrisi, kesin iş akışı iş adları, stable ile full profil
farkları, artefaktlar ve odaklı yeniden çalıştırma tutamaçları için
[Tam release doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.
Alt iş akışları, hedef `ref` daha eski bir release dalına veya etiketine işaret etse bile `Full Release
Validation` çalıştıran güvenilir ref'ten, normalde `--ref main` üzerinden tetiklenir. Ayrı bir Full Release Validation
workflow-ref girdisi yoktur; güvenilir çalışma düzeneğini iş akışı çalıştırma ref'ini seçerek seçin.
Hareketli `main` üzerinde kesin commit kanıtı için `--ref main -f ref=<sha>` kullanmayın;
ham commit SHA'ları workflow dispatch ref'i olamaz, bu yüzden sabitlenmiş geçici dalı oluşturmak için
`pnpm ci:full-release --sha <sha>` kullanın.

Canlı/provider kapsamını seçmek için `release_profile` kullanın:

- `minimum`: en hızlı release açısından kritik OpenAI/çekirdek canlı ve Docker yolu
- `stable`: release onayı için minimuma ek olarak stable provider/backend kapsamı
- `full`: stable kapsamına ek olarak geniş danışma amaçlı provider/medya kapsamı

Release engelleyici hatlar yeşil olduğunda ve promotion öncesi kapsamlı canlı/E2E, Docker release yolu ve
sınırlı yayımlanmış upgrade-survivor taramasını istediğinizde `stable` ile `run_release_soak=true` kullanın. Bu tarama,
en son dört stable paketi, sabitlenmiş `2026.4.23` ve `2026.5.2`
başlangıçlarını ve ayrıca daha eski `2026.4.15` kapsamını kapsar; yinelenen başlangıçlar kaldırılır ve
her başlangıç kendi Docker runner işine parçalanır. `full`, `run_release_soak=true` anlamına gelir.

`OpenClaw Release Checks`, hedef ref'i bir kez `release-package-under-test` olarak çözmek için güvenilir iş akışı ref'ini kullanır ve soak çalıştığında bu artefaktı çapraz işletim sistemi,
Package Acceptance ve release yolu Docker kontrollerinde yeniden kullanır. Bu, paket odaklı tüm kutuların aynı baytlar üzerinde çalışmasını sağlar ve tekrarlı paket derlemelerini önler.
Çapraz işletim sistemi OpenAI install smoke, repo/org değişkeni ayarlandığında `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır, aksi halde `openai/gpt-5.4` kullanır; çünkü bu hat,
en yavaş varsayılan modeli benchmark etmek yerine paket kurulumunu, onboarding'i, Gateway başlatmayı ve bir canlı agent turunu kanıtlar. Daha geniş canlı provider
matrisi model özel kapsam için kullanılmaya devam eder.

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

Odaklı bir düzeltmeden sonraki ilk yeniden çalıştırma olarak tam şemsiyeyi kullanmayın. Bir kutu
başarısız olursa, sonraki kanıt için başarısız alt iş akışını, işi, Docker hattını, paket profilini, model
provider'ını veya QA hattını kullanın. Tam şemsiyeyi yalnızca düzeltme paylaşılan release orkestrasyonunu değiştirdiyse veya önceki tüm kutu kanıtını
geçersiz kıldıysa yeniden çalıştırın. Şemsiyenin son doğrulayıcısı kaydedilmiş alt iş akışı çalıştırma
kimliklerini yeniden kontrol eder; bu nedenle bir alt iş akışı başarıyla yeniden çalıştırıldıktan sonra yalnızca başarısız
`Verify full validation` üst işini yeniden çalıştırın.

Sınırlı kurtarma için şemsiyeye `rerun_group` iletin. `all` gerçek
release adayı çalıştırmasıdır, `ci` yalnızca normal CI alt iş akışını çalıştırır, `plugin-prerelease`
yalnızca release'e özel Plugin alt iş akışını çalıştırır, `release-checks` her release
kutusunu çalıştırır ve daha dar release grupları `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` ve `npm-telegram` şeklindedir.
Odaklı `npm-telegram` yeniden çalıştırmaları `npm_telegram_package_spec` gerektirir; `release_profile=full` ile full/all çalıştırmaları release-checks paket artefaktını kullanır. Odaklı
çapraz işletim sistemi yeniden çalıştırmaları `cross_os_suite_filter=windows/packaged-upgrade` veya
başka bir işletim sistemi/suite filtresi ekleyebilir. QA release-check hataları danışma amaçlıdır; yalnızca QA hatası
release doğrulamasını engellemez.

### Vitest

Vitest kutusu manuel `CI` alt iş akışıdır. Manuel CI bilinçli olarak
değişiklik kapsamını atlar ve release adayı için normal test grafiğini zorlar:
Linux Node shard'ları, bundled-plugin shard'ları, kanal sözleşmeleri, Node 22
uyumluluğu, `check`, `check-additional`, build smoke, doküman kontrolleri, Python
Skills, Windows, macOS, Android ve Control UI i18n.

Bu kutuyu "kaynak ağacı tam normal test paketini geçti mi?" sorusunu yanıtlamak için kullanın.
Bu, release yolu ürün doğrulamasıyla aynı değildir. Saklanacak kanıtlar:

- gönderilmiş `CI` çalıştırma URL'sini gösteren `Full Release Validation` özeti
- kesin hedef SHA üzerinde yeşil `CI` çalıştırması
- regresyonları incelerken CI işlerindeki başarısız veya yavaş shard adları
- bir çalıştırmanın performans analizine ihtiyaç duyduğu durumlarda
  `.artifacts/vitest-shard-timings.json` gibi Vitest zamanlama artefaktları

Release'in deterministik normal CI'ye ihtiyaç duyduğu, ancak Docker, QA Lab, canlı, çapraz işletim sistemi veya paket kutularına ihtiyaç duymadığı durumlarda manuel CI'yi doğrudan çalıştırın:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker kutusu, `openclaw-live-and-e2e-checks-reusable.yml` üzerinden
`OpenClaw Release Checks` içinde ve release modu
`install-smoke` iş akışında bulunur. Release adayını yalnızca kaynak düzeyi testlerle değil, paketlenmiş
Docker ortamları üzerinden doğrular.

Release Docker kapsamı şunları içerir:

- yavaş Bun global install smoke etkin tam install smoke
- hedef SHA'ya göre kök Dockerfile smoke imajı hazırlama/yeniden kullanma; QR,
  root/Gateway ve installer/Bun smoke işleri ayrı install-smoke
  shard'ları olarak çalışır
- depo E2E hatları
- release yolu Docker parçaları: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` ve `plugins-runtime-install-h`
- istendiğinde `plugins-runtime-services` parçası içinde OpenWebUI kapsamı
- bölünmüş bundled Plugin kurulum/kaldırma hatları
  `bundled-plugin-install-uninstall-0` ile
  `bundled-plugin-install-uninstall-23` arası
- release kontrolleri canlı suite'leri içerdiğinde canlı/E2E provider suite'leri ve Docker canlı model kapsamı

Yeniden çalıştırmadan önce Docker artefaktlarını kullanın. Release yolu zamanlayıcısı
hat logları, `summary.json`, `failures.json`,
aşama zamanlamaları, zamanlayıcı plan JSON'u ve yeniden çalıştırma komutlarıyla `.artifacts/docker-tests/` yükler. Odaklı kurtarma için,
tüm release parçalarını yeniden çalıştırmak yerine yeniden kullanılabilir canlı/E2E iş akışında `docker_lanes=<lane[,lane]>` kullanın. Üretilen yeniden çalıştırma komutları, kullanılabilir olduğunda önceki
`package_artifact_run_id` ve hazırlanmış Docker imaj girdilerini içerir; böylece
başarısız bir hat aynı tarball'ı ve GHCR imajlarını yeniden kullanabilir.

### QA Lab

QA Lab kutusu da `OpenClaw Release Checks` parçasıdır. Vitest ve Docker
paket mekaniğinden ayrı, agentic davranış ve kanal düzeyi release kapısıdır.

Release QA Lab kapsamı şunları içerir:

- agentic parity pack kullanarak OpenAI aday hattını Opus 4.6
  başlangıcıyla karşılaştıran mock parity hattı
- `qa-live-shared` ortamını kullanan hızlı canlı Matrix QA profili
- Convex CI kimlik bilgisi kiralamalarını kullanan canlı Telegram QA hattı
- release telemetrisinin açık yerel kanıta ihtiyaç duyduğu durumlarda `pnpm qa:otel:smoke`

Bu kutuyu "release QA senaryolarında ve canlı kanal akışlarında doğru davranıyor mu?" sorusunu yanıtlamak için kullanın.
Release'i onaylarken parity, Matrix ve Telegram
hatları için artefakt URL'lerini saklayın. Tam Matrix kapsamı varsayılan release açısından kritik hat yerine
manuel parçalanmış QA-Lab çalıştırması olarak kullanılmaya devam eder.

### Paket

Paket kutusu kurulabilir ürün kapısıdır. `Package Acceptance` ve
`scripts/resolve-openclaw-package-candidate.mjs` resolver'ı tarafından desteklenir. Resolver bir
adayı Docker E2E tarafından tüketilen `package-under-test` tarball'ına normalleştirir, paket envanterini doğrular,
paket sürümünü ve SHA-256 değerini kaydeder ve iş akışı çalışma düzeneği ref'ini paket kaynak ref'inden ayrı tutar.

Desteklenen aday kaynakları:

- `source=npm`: `openclaw@beta`, `openclaw@latest` veya kesin bir OpenClaw release
  sürümü
- `source=ref`: seçili `workflow_ref` çalışma düzeneğiyle güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA'sını paketler
- `source=url`: gerekli `package_sha256` ile bir HTTPS `.tgz` indirir
- `source=artifact`: başka bir GitHub Actions çalıştırması tarafından yüklenen bir `.tgz` dosyasını yeniden kullanır

`OpenClaw Release Checks`, hazırlanmış release paket artefaktı, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` ile Package Acceptance'ı `source=artifact` olarak çalıştırır. Package Acceptance; migration, update,
configured-auth update restart, eski Plugin bağımlılığı temizliği, çevrimdışı Plugin
fixture'ları, Plugin update ve Telegram paket QA'yı aynı çözülmüş
tarball'a karşı tutar. Engelleyici release kontrolleri varsayılan en son yayımlanmış paket
başlangıcını kullanır; `run_release_soak=true` veya
`release_profile=full`, `2026.4.23` ile `latest` arasındaki her stable npm'de yayımlanmış başlangıca ve bildirilen sorun fixture'larına genişler.
Zaten gönderilmiş bir aday için `source=npm` ile Package Acceptance kullanın veya
publish öncesi SHA destekli yerel npm tarball'ı için `source=ref`/`source=artifact` kullanın. Bu, daha önce
Parallels gerektiren paket/update kapsamının çoğu için GitHub-native
yerine geçer. Çapraz işletim sistemi release kontrolleri işletim sistemine özel onboarding,
installer ve platform davranışı için hâlâ önemlidir, ancak paket/update ürün doğrulaması
Package Acceptance'ı tercih etmelidir.

Update ve Plugin doğrulaması için kanonik kontrol listesi
[Update ve Plugin testleri](/tr/help/testing-updates-plugins) bölümüdür. Bir
Plugin install/update, doctor cleanup veya yayımlanmış paket migration değişikliğini hangi yerel, Docker, Package Acceptance veya release-check hattının kanıtladığına karar verirken bunu kullanın.
Her stable `2026.4.23+` paketinden kapsamlı yayımlanmış update migration'ı
Full Release CI'nın parçası değil, ayrı manuel `Update Migration` iş akışıdır.

Eski paket kabulü esnekliği bilerek zamanla sınırlandırılmıştır. `2026.4.25` dahil önceki paketler, npm'de zaten yayımlanmış meta veri boşlukları için uyumluluk yolunu kullanabilir: tarball'da eksik olan özel QA envanter girdileri, eksik `gateway install --wrapper`, tarball'dan türetilmiş git fixture içinde eksik patch dosyaları, eksik kalıcı `update.channel`, eski Plugin kurulum kaydı konumları, eksik marketplace kurulum kaydı kalıcılığı ve `plugins update` sırasında yapılandırma meta verisi geçişi. Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel build meta verisi damga dosyaları için uyarı verebilir. Daha sonraki paketler modern paket sözleşmelerini karşılamalıdır; aynı boşluklar yayın doğrulamasını başarısız kılar.

Yayın sorusu gerçek bir kurulabilir paketle ilgili olduğunda daha geniş Paket Kabulü profillerini kullanın:

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

- `smoke`: hızlı paket kurulumu/kanal/agent, gateway ağı ve yapılandırma yeniden yükleme hatları
- `package`: canlı ClawHub olmadan kurulum/güncelleme/yeniden başlatma/Plugin paket sözleşmeleri; bu, yayın kontrolü varsayılanıdır
- `product`: `package` artı MCP kanalları, cron/subagent temizliği, OpenAI web araması ve OpenWebUI
- `full`: OpenWebUI ile Docker yayın yolu parçaları
- `custom`: odaklı yeniden çalıştırmalar için tam `docker_lanes` listesi

Paket adayı Telegram kanıtı için Paket Kabulü üzerinde `telegram_mode=mock-openai` veya `telegram_mode=live-frontier` etkinleştirin. İş akışı çözümlenen `package-under-test` tarball'unu Telegram hattına iletir; bağımsız Telegram iş akışı, yayın sonrası kontroller için yayımlanmış bir npm spec kabul etmeye devam eder.

## Yayın yayımlama otomasyonu

`OpenClaw Release Publish` normal değişiklik yapan yayımlama giriş noktasıdır. Yayının gerektirdiği sırada güvenilir yayımcı iş akışlarını düzenler:

1. Yayın etiketini checkout yapın ve commit SHA'sını çözümleyin.
2. Etiketin `main` veya `release/*` üzerinden erişilebilir olduğunu doğrulayın.
3. `pnpm plugins:sync:check` çalıştırın.
4. `publish_scope=all-publishable` ve `ref=<release-sha>` ile `Plugin NPM Release` gönderin.
5. Aynı kapsam ve SHA ile `Plugin ClawHub Release` gönderin.
6. Yayın etiketi, npm dist-tag ve kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` gönderin.

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

Alt düzey `Plugin NPM Release` ve `Plugin ClawHub Release` iş akışlarını yalnızca odaklı onarım veya yeniden yayımlama işleri için kullanın. Seçilmiş bir Plugin onarımı için `OpenClaw Release Publish`'e `plugin_publish_scope=selected` ve `plugins=@openclaw/name` iletin ya da OpenClaw paketinin yayımlanmaması gerektiğinde alt iş akışını doğrudan gönderin.

## NPM iş akışı girdileri

`OpenClaw NPM Release` operatör tarafından denetlenen şu girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya `v2026.4.2-beta.1` gibi zorunlu yayın etiketi; `preflight_only=true` olduğunda, yalnızca doğrulama amaçlı preflight için mevcut tam 40 karakterlik iş akışı dalı commit SHA'sı da olabilir
- `preflight_only`: yalnızca doğrulama/build/paket için `true`, gerçek yayımlama yolu için `false`
- `preflight_run_id`: iş akışının başarılı preflight çalıştırmasından hazırlanmış tarball'u yeniden kullanması için gerçek yayımlama yolunda zorunludur
- `npm_dist_tag`: yayımlama yolu için npm hedef etiketi; varsayılanı `beta`

`OpenClaw Release Publish` operatör tarafından denetlenen şu girdileri kabul eder:

- `tag`: zorunlu yayın etiketi; önceden mevcut olmalıdır
- `preflight_run_id`: başarılı `OpenClaw NPM Release` preflight çalıştırma kimliği; `publish_openclaw_npm=true` olduğunda zorunludur
- `npm_dist_tag`: OpenClaw paketi için npm hedef etiketi
- `plugin_publish_scope`: varsayılanı `all-publishable`; `selected` değerini yalnızca odaklı onarım işi için kullanın
- `plugins`: `plugin_publish_scope=selected` olduğunda virgülle ayrılmış `@openclaw/*` paket adları
- `publish_openclaw_npm`: varsayılanı `true`; yalnızca iş akışını sadece Plugin onarım düzenleyicisi olarak kullanırken `false` ayarlayın

`OpenClaw Release Checks` operatör tarafından denetlenen şu girdileri kabul eder:

- `ref`: doğrulanacak dal, etiket veya tam commit SHA. Gizli bilgi taşıyan kontroller, çözümlenen commit'in bir OpenClaw dalından veya yayın etiketinden erişilebilir olmasını gerektirir.
- `run_release_soak`: kararlı/varsayılan yayın kontrollerinde kapsamlı canlı/E2E, Docker yayın yolu ve all-since yükseltme-survivor soak için katılmayı sağlar. `release_profile=full` tarafından zorunlu olarak açılır.

Kurallar:

- Kararlı ve düzeltme etiketleri `beta` veya `latest` değerlerinden herhangi birine yayımlanabilir
- Beta ön yayın etiketleri yalnızca `beta` değerine yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` ve `Full Release Validation` her zaman yalnızca doğrulama amaçlıdır
- Gerçek yayımlama yolu, preflight sırasında kullanılan aynı `npm_dist_tag` değerini kullanmalıdır; iş akışı, yayımlama öncesinde meta verinin devam ettiğini doğrular

## Kararlı npm yayın sırası

Kararlı bir npm yayını çıkarırken:

1. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın
   - Etiket mevcut olmadan önce, preflight iş akışının yalnızca doğrulama amaçlı kuru çalıştırması için mevcut tam iş akışı dalı commit SHA'sını kullanabilirsiniz
2. Normal önce-beta akışı için `npm_dist_tag=beta` seçin ya da yalnızca doğrudan kararlı yayımlamayı bilerek istediğinizde `latest` seçin
3. Tek bir manuel iş akışından normal CI artı canlı prompt cache, Docker, QA Lab, Matrix ve Telegram kapsamı istediğinizde yayın dalı, yayın etiketi veya tam commit SHA üzerinde `Full Release Validation` çalıştırın
4. Bilerek yalnızca deterministik normal test grafiğine ihtiyacınız varsa bunun yerine yayın ref'i üzerinde manuel `CI` iş akışını çalıştırın
5. Başarılı `preflight_run_id` değerini kaydedin
6. Aynı `tag`, aynı `npm_dist_tag` ve kaydedilmiş `preflight_run_id` ile `OpenClaw Release Publish` çalıştırın; OpenClaw npm paketini yükseltmeden önce dışsallaştırılmış Plugin'leri npm ve ClawHub'a yayımlar
7. Yayın `beta` üzerinde yer aldıysa, bu kararlı sürümü `beta` değerinden `latest` değerine yükseltmek için özel `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` iş akışını kullanın
8. Yayın bilerek doğrudan `latest` değerine yayımlandıysa ve `beta` aynı kararlı build'i hemen izlemeliyse, her iki dist-tag'i de kararlı sürüme yöneltmek için aynı özel iş akışını kullanın ya da zamanlanmış kendi kendini onaran senkronizasyonunun `beta` değerini daha sonra taşımasına izin verin

Dist-tag değişikliği güvenlik nedeniyle özel depoda bulunur, çünkü hâlâ `NPM_TOKEN` gerektirir; public repo ise yalnızca OIDC yayımlamasını korur.

Bu, doğrudan yayımlama yolunu ve önce-beta yükseltme yolunu hem belgelenmiş hem de operatör tarafından görünür tutar.

Bir maintainer yerel npm kimlik doğrulamasına geri dönmek zorunda kalırsa, tüm 1Password CLI (`op`) komutlarını yalnızca ayrılmış bir tmux oturumu içinde çalıştırın. `op` komutunu doğrudan ana agent shell'inden çağırmayın; tmux içinde tutmak istemleri, uyarıları ve OTP işlemeyi gözlemlenebilir kılar ve yinelenen host uyarılarını önler.

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

Maintainer'lar gerçek runbook için özel yayın belgelerini
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
içinde kullanır.

## İlgili

- [Yayın kanalları](/tr/install/development-channels)
