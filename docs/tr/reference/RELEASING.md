---
read_when:
    - Genel sürüm kanalı tanımlarını arıyorsunuz
    - Sürüm adlandırmasını ve yayın sıklığını arıyorsunuz
summary: Genel sürüm kanalları, sürüm adlandırması ve yayın sıklığı
title: Sürüm politikası
x-i18n:
    generated_at: "2026-04-26T11:39:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ac0ca7d9c6a6ce011e8adda54e1e49beab30456c0dc2bffaec6acec41094df
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw'ın üç genel sürüm hattı vardır:

- stable: varsayılan olarak npm `beta`'ya yayımlanan etiketli sürümler veya açıkça istendiğinde npm `latest`'e yayımlanan sürümler
- beta: npm `beta`'ya yayımlanan ön sürüm etiketleri
- dev: `main` dalının hareketli ucu

## Sürüm adlandırması

- Stable sürüm versiyonu: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Stable düzeltme sürümü versiyonu: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön sürüm versiyonu: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ay veya günü sıfırla doldurmayın
- `latest`, şu anda yükseltilmiş stable npm sürümü anlamına gelir
- `beta`, şu anki beta kurulum hedefi anlamına gelir
- Stable ve stable düzeltme sürümleri varsayılan olarak npm `beta`'ya yayımlanır; sürüm operatörleri açıkça `latest` hedefleyebilir veya daha sonra doğrulanmış bir beta yapısını yükseltebilir
- Her stable OpenClaw sürümü npm paketini ve macOS uygulamasını birlikte yayımlar;
  beta sürümleri normalde önce npm/paket yolunu doğrular ve yayımlar;
  mac uygulaması oluşturma/imzalama/noter onayı, açıkça istenmedikçe stable için ayrılmıştır

## Sürüm sıklığı

- Sürümler önce beta olarak ilerler
- Stable, yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar normalde sürümleri, mevcut `main` dalından oluşturulan bir `release/YYYY.M.D` dalından çıkarır; böylece sürüm doğrulama ve düzeltmeleri `main` üzerindeki yeni geliştirmeleri engellemez
- Bir beta etiketi gönderildiyse veya yayımlandıysa ve düzeltme gerekiyorsa, bakımcılar eski beta etiketini silmek veya yeniden oluşturmak yerine bir sonraki `-beta.N` etiketini çıkarır
- Ayrıntılı sürüm prosedürü, onaylar, kimlik bilgileri ve kurtarma notları yalnızca bakımcılara yöneliktir

## Sürüm ön kontrolü

- Test TypeScript kapsamının daha hızlı yerel `pnpm check` kontrolünün dışında da korunması için sürüm ön kontrolünden önce `pnpm check:test-types` çalıştırın
- Daha geniş içe aktarma döngüsü ve mimari sınır kontrollerinin daha hızlı yerel kontrolün dışında da yeşil olması için sürüm ön kontrolünden önce `pnpm check:architecture` çalıştırın
- Paket doğrulama adımı için beklenen `dist/*` sürüm yapıtlarının ve Control UI paketinin mevcut olması amacıyla `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın
- Sürüm telemetrisini doğrularken `pnpm qa:otel:smoke` çalıştırın. Bu,
  QA-lab'ı yerel bir OTLP/HTTP alıcısı üzerinden çalıştırır ve dış bir toplayıcıya
  gerek duymadan dışa aktarılan iz span adlarını, sınırlı öznitelikleri ve içerik/tanımlayıcı sansürlemesini doğrular.
- Her etiketli sürümden önce `pnpm release:check` çalıştırın
- Sürüm kontrolleri artık ayrı bir manuel iş akışında çalışır:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`, sürüm onayından önce QA Lab sahte parity kontrolünü ve canlı
  Matrix ile Telegram QA hatlarını da çalıştırır. Canlı hatlar
  `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI kimlik bilgisi kiralamalarını da kullanır.
- İşletim sistemleri arası kurulum ve yükseltme çalışma zamanı doğrulaması,
  özel çağıran iş akışı
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  üzerinden tetiklenir; bu iş akışı yeniden kullanılabilir genel iş akışı
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` dosyasını çağırır
- Bu ayrım kasıtlıdır: gerçek npm sürüm yolunu kısa,
  deterministik ve yapıt odaklı tutarken, daha yavaş canlı kontroller kendi
  hatlarında kalır; böylece yayımlamayı geciktirmez veya engellemezler
- Sürüm kontrolleri `main` iş akışı referansından veya
  bir `release/YYYY.M.D` iş akışı referansından tetiklenmelidir; böylece iş akışı mantığı ve gizli bilgiler kontrol altında kalır
- Bu iş akışı ya mevcut bir sürüm etiketini ya da mevcut tam
  40 karakterlik iş akışı dalı commit SHA'sını kabul eder
- Commit-SHA modunda yalnızca mevcut iş akışı dalı HEAD'i kabul edilir; daha eski sürüm commit'leri için bir sürüm etiketi kullanın
- `OpenClaw NPM Release` yalnızca doğrulama amaçlı ön kontrolü de, gönderilmiş bir etikete gerek olmadan mevcut
  tam 40 karakterlik iş akışı dalı commit SHA'sını kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek bir yayıma yükseltilemez
- SHA modunda iş akışı, paket meta veri kontrolü için yalnızca
  `v<package.json version>` sentezler; gerçek yayımlama için yine de gerçek bir sürüm etiketi gerekir
- Her iki iş akışı da gerçek yayımlama ve yükseltme yolunu GitHub-hosted
  runner'larda tutarken, değişiklik yapmayan doğrulama yolu daha büyük
  Blacksmith Linux runner'larını kullanabilir
- Bu iş akışı
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  komutunu hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` iş akışı gizli bilgileriyle çalıştırır
- npm sürüm ön kontrolü artık ayrı sürüm kontrolleri hattını beklemez
- Onaydan önce
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (veya eşleşen beta/düzeltme etiketi) çalıştırın
- npm yayımlandıktan sonra,
  yayımlanan registry kurulum yolunu temiz bir geçici önek içinde doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (veya eşleşen beta/düzeltme versiyonu) çalıştırın
- Bir beta yayımdan sonra, yayımlanmış npm paketine karşı,
  paylaşılan kiralanmış Telegram kimlik bilgisi havuzunu kullanarak kurulu paket onboarding'ini, Telegram kurulumunu ve gerçek Telegram E2E'yi doğrulamak için
  `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  çalıştırın. Yerel bakımcıya özel tek seferlik çalıştırmalarda Convex değişkenleri atlanabilir ve üç
  `OPENCLAW_QA_TELEGRAM_*` ortam kimlik bilgisi doğrudan verilebilir.
- Bakımcılar aynı yayımlama sonrası kontrolü GitHub Actions içinden manuel
  `NPM Telegram Beta E2E` iş akışıyla çalıştırabilir. Bu iş akışı bilerek yalnızca manueldir ve
  her birleştirmede çalışmaz.
- Bakımcı sürüm otomasyonu artık ön kontrol-sonra-yükseltme modelini kullanır:
  - gerçek npm yayımı başarılı bir npm `preflight_run_id` ön kontrolünden geçmelidir
  - gerçek npm yayımı, başarılı ön kontrol çalıştırmasıyla aynı `main` veya
    `release/YYYY.M.D` dalından tetiklenmelidir
  - stable npm sürümleri varsayılan olarak `beta` kullanır
  - stable npm yayımı iş akışı girdisi aracılığıyla açıkça `latest` hedefleyebilir
  - token tabanlı npm dist-tag değiştirme artık güvenlik nedeniyle
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    içinde yer alır; çünkü `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirirken genel repo yalnızca OIDC yayımlamayı korur
  - genel `macOS Release` yalnızca doğrulama içindir
  - gerçek özel mac yayımı başarılı özel mac
    `preflight_run_id` ve `validate_run_id` kontrollerinden geçmelidir
  - gerçek yayımlama yolları yapıtları yeniden oluşturmaktansa hazırlanmış
    yapıtları yükseltir
- `YYYY.M.D-N` gibi stable düzeltme sürümlerinde, yayımlama sonrası doğrulayıcı
  aynı geçici önek yükseltme yolunu `YYYY.M.D` sürümünden `YYYY.M.D-N` sürümüne de kontrol eder; böylece sürüm düzeltmeleri eski genel kurulumları sessizce temel stable yükünde bırakamaz
- npm sürüm ön kontrolü, tarball hem
  `dist/control-ui/index.html` hem de boş olmayan bir `dist/control-ui/assets/` yükü içermediği sürece kapalı şekilde başarısız olur; böylece yeniden boş bir tarayıcı panosu yayımlamayız
- Yayımlama sonrası doğrulama ayrıca yayımlanmış registry kurulumunun,
  kök `dist/*` düzeni altında boş olmayan paketlenmiş Plugin çalışma zamanı bağımlılıkları içerdiğini de kontrol eder. Eksik veya boş paketlenmiş Plugin
  bağımlılık yükleriyle yayımlanan bir sürüm, yayımlama sonrası doğrulayıcıda başarısız olur ve
  `latest` sürümüne yükseltilemez.
- `pnpm test:install:smoke` ayrıca aday güncelleme tarball'ı üzerinde npm pack `unpackedSize` bütçesini de uygular; böylece kurucu e2e, sürüm yayım yolundan önce yanlışlıkla oluşan paket şişmesini yakalar
- Sürüm çalışması CI planlamasını, extension zamanlama manifest'lerini veya
  extension test matrislerini etkilediyse, sürüm notlarının bayat bir CI düzenini anlatmaması için onaydan önce
  `.github/workflows/ci.yml` içindeki planlayıcıya ait
  `checks-node-extensions` iş akışı matris çıktılarını yeniden oluşturun ve gözden geçirin
- Stable macOS sürümü hazırlığı ayrıca güncelleyici yüzeylerini de içerir:
  - GitHub sürümüne paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` dosyaları eklenmiş olmalıdır
  - yayımdan sonra `main` üzerindeki `appcast.xml` yeni stable zip'i işaret etmelidir
  - paketlenmiş uygulama hata ayıklama dışı bir bundle id, boş olmayan bir Sparkle feed URL'si ve o sürüm versiyonu için kanonik Sparkle build taban seviyesine eşit veya ondan yüksek bir `CFBundleVersion` korumalıdır

## NPM iş akışı girdileri

`OpenClaw NPM Release` şu operatör kontrollü girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya
  `v2026.4.2-beta.1` gibi gerekli sürüm etiketi; `preflight_only=true` olduğunda,
  yalnızca doğrulama amaçlı ön kontrol için mevcut tam 40 karakterli
  iş akışı dalı commit SHA'sı da olabilir
- `preflight_only`: yalnızca doğrulama/oluşturma/paketleme için `true`, gerçek
  yayımlama yolu için `false`
- `preflight_run_id`: gerçek yayımlama yolunda gereklidir; böylece iş akışı başarılı ön kontrol çalıştırmasından hazırlanan tarball'ı yeniden kullanır
- `npm_dist_tag`: yayımlama yolu için npm hedef etiketi; varsayılan `beta`'dır

`OpenClaw Release Checks` şu operatör kontrollü girdileri kabul eder:

- `ref`: `main` üzerinden tetiklendiğinde doğrulanacak mevcut sürüm etiketi veya mevcut tam 40 karakterli `main` commit
  SHA'sı; sürüm dalından tetikleniyorsa mevcut bir sürüm etiketi veya mevcut tam 40 karakterli sürüm dalı commit
  SHA'sını kullanın

Kurallar:

- Stable ve düzeltme etiketleri `beta` veya `latest` sürümlerinden birine yayımlanabilir
- Beta ön sürüm etiketleri yalnızca `beta`'ya yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca
  `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` her zaman yalnızca doğrulama içindir ve ayrıca
  mevcut iş akışı dalı commit SHA'sını da kabul eder
- Sürüm kontrollerinin commit-SHA modu ayrıca mevcut iş akışı dalı HEAD'ini de gerektirir
- Gerçek yayımlama yolu, ön kontrol sırasında kullanılan aynı `npm_dist_tag` değerini kullanmalıdır;
  iş akışı, yayımlama devam etmeden önce bu meta veriyi doğrular

## Stable npm sürüm sırası

Bir stable npm sürümü çıkarırken:

1. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın
   - Henüz bir etiket yoksa, ön kontrol iş akışının yalnızca doğrulama amaçlı kuru çalıştırması için mevcut tam iş akışı dalı commit
     SHA'sını kullanabilirsiniz
2. Normal beta-önce akışı için `npm_dist_tag=beta` seçin veya yalnızca
   bilerek doğrudan stable yayımlamak istediğinizde `latest` seçin
3. Canlı prompt cache,
   QA Lab parity, Matrix ve Telegram kapsamı istediğinizde aynı etiket veya
   mevcut tam iş akışı dalı commit SHA'sı ile `OpenClaw Release Checks` iş akışını ayrıca çalıştırın
   - Bu ayrım bilerek yapılmıştır; böylece uzun süren veya kararsız kontroller yayımlama iş akışına yeniden bağlanmadan canlı kapsam korunur
4. Başarılı `preflight_run_id` değerini kaydedin
5. `preflight_only=false`, aynı
   `tag`, aynı `npm_dist_tag` ve kaydedilen `preflight_run_id` ile `OpenClaw NPM Release` iş akışını tekrar çalıştırın
6. Sürüm `beta` üzerinde yayımlandıysa, bu stable versiyonu `beta`'dan `latest`'e yükseltmek için özel
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   iş akışını kullanın
7. Sürüm bilerek doğrudan `latest` olarak yayımlandıysa ve `beta`
   hemen aynı stable yapıyı izlemeliyse, aynı özel iş akışını kullanarak her iki dist-tag'i stable versiyona yönlendirin veya zamanlanmış kendi kendini iyileştirme eşitlemesinin `beta`yı daha sonra taşımasına izin verin

Dist-tag değiştirme güvenlik nedeniyle özel repoda bulunur çünkü hâlâ
`NPM_TOKEN` gerektirir; genel repo ise yalnızca OIDC yayımlamayı korur.

Bu, hem doğrudan yayımlama yolunu hem de beta-önce yükseltme yolunu
belgelenmiş ve operatörler tarafından görünür tutar.

Bir bakımcının yerel npm kimlik doğrulamasına geri dönmesi gerekirse, tüm 1Password
CLI (`op`) komutlarını yalnızca özel bir tmux oturumu içinde çalıştırın. Ana agent kabuğundan `op`
komutunu doğrudan çağırmayın; bunu tmux içinde tutmak istemleri,
uyarıları ve OTP işlemeyi gözlemlenebilir kılar ve yinelenen ana makine uyarılarını önler.

## Genel referanslar

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Bakımcılar, gerçek çalışma kılavuzu için
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
içindeki özel sürüm belgelerini kullanır.

## İlgili

- [Sürüm kanalları](/tr/install/development-channels)
