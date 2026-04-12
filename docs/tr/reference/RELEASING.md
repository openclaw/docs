---
read_when:
    - Genel yayın kanalı tanımlarını arıyor
    - Sürüm adlandırması ve yayın sıklığını arıyor
summary: Genel yayın kanalları, sürüm adlandırması ve yayın sıklığı
title: Yayın Politikası
x-i18n:
    generated_at: "2026-04-12T23:33:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: dffc1ee5fdbb20bd1bf4b3f817d497fc0d87f70ed6c669d324fea66dc01d0b0b
    source_path: reference/RELEASING.md
    workflow: 15
---

# Yayın Politikası

OpenClaw’un üç genel yayın hattı vardır:

- stable: varsayılan olarak npm `beta`’ya yayımlanan etiketli sürümler veya açıkça istendiğinde npm `latest`’e yayımlanan sürümler
- beta: npm `beta`’ya yayımlanan ön sürüm etiketleri
- dev: `main` dalının hareketli ucu

## Sürüm adlandırma

- Stable yayın sürümü: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Stable düzeltme sürümü: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön sürüm sürümü: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ay veya günü sıfırla doldurmayın
- `latest`, şu anki yükseltilmiş stable npm sürümü anlamına gelir
- `beta`, şu anki beta kurulum hedefi anlamına gelir
- Stable ve stable düzeltme sürümleri varsayılan olarak npm `beta`’ya yayımlanır; yayın operatörleri açıkça `latest`’i hedefleyebilir veya doğrulanmış bir beta derlemesini daha sonra yükseltebilir
- Her OpenClaw sürümü, npm paketini ve macOS uygulamasını birlikte yayımlar

## Yayın sıklığı

- Yayınlar önce beta olarak ilerler
- Stable, yalnızca en son beta doğrulandıktan sonra gelir
- Ayrıntılı yayın prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca maintainers içindir

## Yayın öncesi kontrol

- Beklenen `dist/*` yayın yapıtları ile Control UI paketinin paket
  doğrulama adımı için hazır olması amacıyla `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın
- Etiketli her sürümden önce `pnpm release:check` çalıştırın
- Yayın kontrolleri artık ayrı bir manuel iş akışında çalışır:
  `OpenClaw Release Checks`
- Bu ayrım kasıtlıdır: gerçek npm yayın yolunu kısa,
  deterministik ve yapıt odaklı tutarken daha yavaş canlı kontrollerin kendi
  hattında kalmasını sağlayın; böylece yayımlamayı durdurmaz veya engellemezler
- Yayın kontrolleri `main` iş akışı referansından tetiklenmelidir; böylece
  iş akışı mantığı ve gizli bilgiler kanonik kalır
- Bu iş akışı mevcut bir yayın etiketini veya geçerli tam
  40 karakterlik `main` commit SHA’sını kabul eder
- Commit-SHA modunda yalnızca geçerli `origin/main` HEAD kabul edilir; daha eski yayın commit’leri için bir
  yayın etiketi kullanın
- `OpenClaw NPM Release` yalnızca doğrulama amaçlı ön kontrolü de itilmiş bir etiket gerektirmeden geçerli
  tam 40 karakterlik `main` commit SHA’sını kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek bir yayıma yükseltilemez
- SHA modunda iş akışı, paket meta veri kontrolü için yalnızca `v<package.json version>` üretir; gerçek yayımlama yine de gerçek bir yayın etiketi gerektirir
- Her iki iş akışı da gerçek yayımlama ve yükseltme yolunu GitHub tarafından barındırılan
  çalıştırıcılarda tutarken, durumu değiştirmeyen doğrulama yolu daha büyük
  Blacksmith Linux çalıştırıcılarını kullanabilir
- Bu iş akışı,
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  komutunu hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` iş akışı gizli bilgilerini kullanarak çalıştırır
- npm yayın ön kontrolü artık ayrı yayın kontrolleri hattını beklemez
- Onaydan önce
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  komutunu (veya eşleşen beta/düzeltme etiketini) çalıştırın
- npm yayımlandıktan sonra, temiz bir geçici önek içinde yayımlanmış kayıt defteri
  kurulum yolunu doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  komutunu (veya eşleşen beta/düzeltme sürümünü) çalıştırın
- Maintainer yayın otomasyonu artık ön kontrol ve ardından yükseltme kullanır:
  - gerçek npm yayımlaması, başarılı bir npm `preflight_run_id` değerini geçmelidir
  - stable npm sürümleri varsayılan olarak `beta` kullanır
  - stable npm yayımlaması, iş akışı girdisi yoluyla açıkça `latest`’i hedefleyebilir
  - `beta`’dan `latest`’e stable npm yükseltmesi, güvenilen `OpenClaw NPM Release` iş akışında açık bir manuel mod olarak hâlâ kullanılabilir
  - bu yükseltme modu, npm `dist-tag` yönetimi güvenilir yayımlamadan ayrı olduğu için `npm-release` ortamında hâlâ geçerli bir `NPM_TOKEN` gerektirir
  - genel `macOS Release` yalnızca doğrulama içindir
  - gerçek özel mac yayımlaması, başarılı özel mac
    `preflight_run_id` ve `validate_run_id` değerlerini geçmelidir
  - gerçek yayımlama yolları, bunları yeniden derlemek yerine hazırlanmış yapıtları yükseltir
- `YYYY.M.D-N` gibi stable düzeltme sürümlerinde, yayımlama sonrası doğrulayıcı
  aynı geçici önek yükseltme yolunu `YYYY.M.D`’den `YYYY.M.D-N`’ye de kontrol eder;
  böylece sürüm düzeltmeleri daha eski global kurulumları temel stable yük üzerinde
  sessizce bırakamaz
- Tarball hem
  `dist/control-ui/index.html` hem de boş olmayan bir `dist/control-ui/assets/` yükünü içermediği sürece npm yayın ön kontrolü kapalı şekilde başarısız olur;
  böylece yine boş bir tarayıcı panosu yayımlamayız
- Yayın çalışması CI planlamasını, uzantı zamanlama bildirimlerini veya
  uzantı test matrislerini etkilediyse, onaydan önce `.github/workflows/ci.yml`
  içindeki planlayıcı sahipliğindeki `checks-node-extensions` iş akışı matris çıktılarını yeniden üretip gözden geçirin;
  böylece yayın notları eski bir CI düzenini açıklamaz
- Stable macOS yayın hazır oluşu, güncelleyici yüzeylerini de içerir:
  - GitHub sürümünde paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` bulunmalıdır
  - `main` üzerindeki `appcast.xml`, yayımlamadan sonra yeni stable zip’i işaret etmelidir
  - paketlenmiş uygulama, hata ayıklama olmayan bir bundle id, boş olmayan bir Sparkle besleme
    URL’si ve bu sürüm versiyonu için kanonik Sparkle derleme tabanının
    en azında bir `CFBundleVersion` değerini korumalıdır

## NPM iş akışı girdileri

`OpenClaw NPM Release`, operatör denetimli şu girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya
  `v2026.4.2-beta.1` gibi gerekli yayın etiketi; `preflight_only=true` olduğunda yalnızca doğrulama amaçlı ön kontrol için
  geçerli tam 40 karakterlik `main` commit SHA’sı da olabilir
- `preflight_only`: yalnızca doğrulama/derleme/paket için `true`, gerçek
  yayımlama yolu için `false`
- `preflight_run_id`: gerçek yayımlama yolunda gereklidir; böylece iş akışı
  başarılı ön kontrol çalıştırmasından hazırlanan tarball’ı yeniden kullanır
- `npm_dist_tag`: yayımlama yolu için npm hedef etiketi; varsayılanı `beta`’dır
- `promote_beta_to_latest`: yayımlamayı atlamak ve zaten yayımlanmış bir
  stable `beta` derlemesini `latest` üzerine taşımak için `true`

`OpenClaw Release Checks`, operatör denetimli şu girdileri kabul eder:

- `ref`: doğrulanacak mevcut yayın etiketi veya geçerli tam 40 karakterlik `main` commit
  SHA’sı

Kurallar:

- Stable ve düzeltme etiketleri `beta` veya `latest`’e yayımlanabilir
- Beta ön sürüm etiketleri yalnızca `beta`’ya yayımlanabilir
- Tam commit SHA girdisine yalnızca `preflight_only=true` olduğunda izin verilir
- Yayın kontrollerinin commit-SHA modu da geçerli `origin/main` HEAD değerini gerektirir
- Gerçek yayımlama yolu, ön kontrolde kullanılan aynı `npm_dist_tag` değerini kullanmalıdır;
  iş akışı yayımlama devam etmeden önce bu meta veriyi doğrular
- Yükseltme modu, stable veya düzeltme etiketi, `preflight_only=false`,
  boş bir `preflight_run_id` ve `npm_dist_tag=beta` kullanmalıdır
- Yükseltme modu ayrıca `npm-release`
  ortamında geçerli bir `NPM_TOKEN` gerektirir; çünkü `npm dist-tag add` hâlâ normal npm kimlik doğrulaması ister

## Stable npm yayın sırası

Bir stable npm sürümü keserken:

1. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın
   - Etiket henüz yokken, ön kontrol iş akışının
     yalnızca doğrulama amaçlı kuru çalıştırması için geçerli tam `main` commit SHA’sını kullanabilirsiniz
2. Normal beta öncelikli akış için `npm_dist_tag=beta` seçin veya yalnızca
   kasıtlı olarak doğrudan stable yayımlamak istediğinizde `latest` seçin
3. Canlı prompt cache kapsamı istediğinizde aynı etiketle veya
   geçerli tam `main` commit SHA’sı ile `OpenClaw Release Checks` iş akışını ayrıca çalıştırın
   - Bu, kasıtlı olarak ayrıdır; böylece canlı kapsam,
     uzun süren veya kararsız kontrolleri yayımlama iş akışına yeniden bağlamadan kullanılabilir kalır
4. Başarılı `preflight_run_id` değerini kaydedin
5. Aynı `tag`, aynı `npm_dist_tag` ve kaydedilmiş `preflight_run_id`
   ile bu kez `preflight_only=false` olacak şekilde `OpenClaw NPM Release` iş akışını yeniden çalıştırın
6. Sürüm `beta` üzerine geldiyse, bu yayımlanmış derlemeyi `latest`’e
   taşımak istediğinizde daha sonra aynı stable `tag`, `promote_beta_to_latest=true`, `preflight_only=false`,
   boş `preflight_run_id` ve `npm_dist_tag=beta` ile `OpenClaw NPM Release` çalıştırın

Yükseltme modu yine de `npm-release` ortam onayını ve bu ortamda
geçerli bir `NPM_TOKEN` gerektirir.

Bu, hem doğrudan yayımlama yolunun hem de beta öncelikli yükseltme yolunun
belgelendirilmiş ve operatör tarafından görünür olmasını sağlar.

## Genel başvurular

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainers, gerçek çalışma kılavuzu için
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
içindeki özel yayın belgelerini kullanır.
