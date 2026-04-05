---
read_when:
    - Genel kullanıma açık sürüm kanalı tanımlarını arıyorsunuz
    - Sürüm adlandırması ve yayın sıklığı hakkında bilgi arıyorsunuz
summary: Genel kullanıma açık sürüm kanalları, sürüm adlandırması ve yayın sıklığı
title: Sürüm Politikası
x-i18n:
    generated_at: "2026-04-05T14:05:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb52a13264c802395aa55404c6baeec5c7b2a6820562e7a684057e70cc85668f
    source_path: reference/RELEASING.md
    workflow: 15
---

# Sürüm Politikası

OpenClaw'ın genel kullanıma açık üç sürüm hattı vardır:

- stable: varsayılan olarak npm `beta`'ya yayımlanan etiketli sürümler veya açıkça istendiğinde npm `latest`'e yayımlanan sürümler
- beta: npm `beta`'ya yayımlanan ön sürüm etiketleri
- dev: `main` dalının hareketli ucu

## Sürüm adlandırması

- Stable sürüm sürümü: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Stable düzeltme sürümü: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön sürüm sürümü: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ayı veya günü sıfırla doldurmayın
- `latest`, şu anda yükseltilmiş stable npm sürümü anlamına gelir
- `beta`, şu anki beta kurulum hedefi anlamına gelir
- Stable ve stable düzeltme sürümleri varsayılan olarak npm `beta`'ya yayımlanır; sürüm operatörleri açıkça `latest`'i hedefleyebilir veya daha sonra doğrulanmış bir beta derlemesini yükseltebilir
- Her OpenClaw sürümü npm paketini ve macOS uygulamasını birlikte yayımlar

## Sürüm sıklığı

- Sürümler önce beta olarak ilerler
- Stable, yalnızca en son beta doğrulandıktan sonra gelir
- Ayrıntılı sürüm prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca maintainers içindir

## Sürüm ön kontrolü

- Paket doğrulama adımı için beklenen
  `dist/*` sürüm yapıtları ve Control UI paketi mevcut olsun diye
  `pnpm release:check` komutundan önce `pnpm build && pnpm ui:build` çalıştırın
- Her etiketli sürümden önce `pnpm release:check` çalıştırın
- Main dalı npm ön kontrolü ayrıca tarball paketlenmeden önce
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  komutunu çalıştırır ve hem `OPENAI_API_KEY` hem de
  `ANTHROPIC_API_KEY` workflow secret'larını kullanır
- Onaydan önce
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  komutunu (veya eşleşen beta/düzeltme etiketini) çalıştırın
- npm yayımlamasından sonra, yayımlanmış kayıt defteri
  kurulum yolunu yeni bir geçici prefix içinde doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  komutunu (veya eşleşen beta/düzeltme sürümünü) çalıştırın
- Maintainer sürüm otomasyonu artık önce ön kontrol sonra yükseltme yaklaşımını kullanır:
  - gerçek npm yayımlaması başarılı bir npm `preflight_run_id` gerektirir
  - stable npm sürümleri varsayılan olarak `beta`'yı hedefler
  - stable npm yayımlaması workflow girdisiyle açıkça `latest`'i hedefleyebilir
  - stable npm sürümünü `beta`'dan `latest`'e yükseltme, güvenilir `OpenClaw NPM Release` workflow'unda hâlâ açık bir manuel mod olarak kullanılabilir
  - bu yükseltme modu, npm `dist-tag` yönetimi güvenilir yayımlamadan ayrı olduğu için `npm-release` ortamında hâlâ geçerli bir `NPM_TOKEN` gerektirir
  - genel kullanıma açık `macOS Release` yalnızca doğrulama içindir
  - gerçek özel mac yayımlaması başarılı özel mac
    `preflight_run_id` ve `validate_run_id` gerektirir
  - gerçek yayımlama yolları, bunları yeniden derlemek yerine hazırlanmış yapıtları yükseltir
- `YYYY.M.D-N` gibi stable düzeltme sürümlerinde, yayımlama sonrası doğrulayıcı
  ayrıca `YYYY.M.D`'den `YYYY.M.D-N`'ye aynı temp-prefix yükseltme yolunu da kontrol eder;
  böylece sürüm düzeltmeleri, eski global kurulumları sessizce temel stable payload üzerinde bırakamaz
- Tarball hem `dist/control-ui/index.html` hem de boş olmayan bir
  `dist/control-ui/assets/` payload içermiyorsa npm sürüm ön kontrolü kapalı başarısız olur;
  böylece yine boş bir tarayıcı panosunu yayımlamayız
- Sürüm çalışması CI planlamasına, eklenti zamanlama manifest'lerine veya hızlı
  test matrislerine dokunduysa, onaydan önce `.github/workflows/ci.yml`
  içindeki planlayıcıya ait `checks-fast-extensions` workflow matris çıktısını
  yeniden üretin ve gözden geçirin; böylece sürüm notları eski bir CI düzenini açıklamaz
- Stable macOS sürüm hazır olma durumu güncelleyici yüzeylerini de içerir:
  - GitHub sürümünde paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` bulunmalıdır
  - `main` üzerindeki `appcast.xml`, yayımlamadan sonra yeni stable zip'i işaret etmelidir
  - paketlenmiş uygulama, hata ayıklama olmayan bir bundle id, boş olmayan bir Sparkle feed
    URL'si ve bu sürüm sürümü için kanonik Sparkle derleme tabanında veya üzerinde bir `CFBundleVersion`
    korumalıdır

## NPM workflow girdileri

`OpenClaw NPM Release`, operatör tarafından kontrol edilen şu girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya
  `v2026.4.2-beta.1` gibi gerekli sürüm etiketi
- `preflight_only`: yalnızca doğrulama/derleme/paketleme için `true`, gerçek
  yayımlama yolu için `false`
- `preflight_run_id`: workflow'un başarılı ön kontrolden hazırlanan tarball'ı
  yeniden kullanması için gerçek yayımlama yolunda gereklidir
- `npm_dist_tag`: yayımlama yolu için npm hedef etiketi; varsayılan `beta`
- `promote_beta_to_latest`: yayımlamayı atlayıp daha önce yayımlanmış bir
  stable `beta` derlemesini `latest` üzerine taşımak için `true`

Kurallar:

- Stable ve düzeltme etiketleri `beta` veya `latest`'e yayımlanabilir
- Beta ön sürüm etiketleri yalnızca `beta`'ya yayımlanabilir
- Gerçek yayımlama yolu, ön kontrolde kullanılan aynı `npm_dist_tag` değerini kullanmalıdır;
  workflow, yayımlama devam etmeden önce bu meta veriyi doğrular
- Yükseltme modu stable veya düzeltme etiketi, `preflight_only=false`,
  boş bir `preflight_run_id` ve `npm_dist_tag=beta` kullanmalıdır
- Yükseltme modu ayrıca `npm-release`
  ortamında geçerli bir `NPM_TOKEN` gerektirir çünkü `npm dist-tag add` hâlâ normal npm kimlik doğrulaması ister

## Stable npm sürüm sırası

Bir stable npm sürümü çıkarırken:

1. `OpenClaw NPM Release` komutunu `preflight_only=true` ile çalıştırın
2. Normal beta-önce akışı için `npm_dist_tag=beta` seçin veya yalnızca
   doğrudan stable yayımlama yapmak istediğinizde `latest` seçin
3. Başarılı `preflight_run_id` değerini kaydedin
4. `OpenClaw NPM Release` komutunu tekrar `preflight_only=false`, aynı
   `tag`, aynı `npm_dist_tag` ve kaydedilmiş `preflight_run_id` ile çalıştırın
5. Sürüm `beta`'ya yayımlandıysa, bu yayımlanmış derlemeyi `latest`'e taşımak
   istediğinizde `OpenClaw NPM Release` komutunu daha sonra aynı stable `tag`,
   `promote_beta_to_latest=true`, `preflight_only=false`,
   boş `preflight_run_id` ve `npm_dist_tag=beta` ile çalıştırın

Yükseltme modu yine de `npm-release` ortam onayını ve bu ortamda geçerli bir
`NPM_TOKEN` gerektirir.

Bu, doğrudan yayımlama yolunu ve beta-önce yükseltme yolunu hem
belgelenmiş hem de operatör tarafından görünür tutar.

## Genel kullanıma açık başvurular

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainers, gerçek runbook için
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
içindeki özel sürüm belgelerini kullanır.
