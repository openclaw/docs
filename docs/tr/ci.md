---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekiyor
    - Başarısız GitHub Actions kontrollerinde hata ayıklıyorsunuz
summary: CI iş grafiği, kapsam geçitleri ve yerel komut eşdeğerleri
title: CI ardışık düzeni
x-i18n:
    generated_at: "2026-04-24T09:00:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 489ac05725a316b25f56f7f754d6a8652abbd60481fbe6e692572b81581fe405
    source_path: ci.md
    workflow: 15
---

CI, `main` dalına yapılan her push'ta ve her pull request'te çalışır. Yalnızca alakasız alanlar değiştiğinde pahalı işleri atlamak için akıllı kapsamlandırma kullanır.

QA Lab, ana akıllı kapsamlı iş akışının dışında özel CI hatlarına sahiptir.
`Parity gate` iş akışı, eşleşen PR değişikliklerinde ve manuel dispatch'te çalışır; özel QA çalışma zamanını
derler ve sahte GPT-5.4 ile Opus 4.6 agentic pack'lerini karşılaştırır. `QA-Lab - All Lanes` iş akışı, `main` üzerinde gecelik olarak ve
manuel dispatch ile çalışır; sahte parity gate, canlı Matrix hattı ve canlı
Telegram hattını paralel işler olarak dağıtır. Canlı işler `qa-live-shared`
ortamını kullanır ve Telegram hattı Convex lease'leri kullanır. `OpenClaw Release
Checks` de sürüm onayından önce aynı QA Lab hatlarını çalıştırır.

`Duplicate PRs After Merge` iş akışı, merge sonrası yinelenen PR temizliği için
manuel bir maintainer iş akışıdır. Varsayılan olarak dry-run modundadır ve yalnızca
`apply=true` olduğunda açıkça listelenmiş PR'leri kapatır. GitHub'da değişiklik yapmadan önce,
merge edilen PR'nin gerçekten merge edildiğini ve her yinelenenin ya ortak referans verilen bir issue'ya
ya da çakışan değişiklik hunk'larına sahip olduğunu doğrular.

`Docs Agent` iş akışı, mevcut belgeleri yakın zamanda merge edilmiş değişikliklerle uyumlu tutmak için
olay tetiklemeli bir Codex bakım hattıdır. Salt zamanlama temelli değildir: `main` üzerinde
bot olmayan başarılı bir push CI çalışması bunu tetikleyebilir ve manuel dispatch
doğrudan çalıştırabilir. Workflow-run çağrıları, `main` ilerlemişse veya son bir saat içinde
atlanmamış başka bir Docs Agent çalışması oluşturulmuşsa atlanır. Çalıştığında,
önceki atlanmamış Docs Agent kaynak SHA'sından mevcut `main`'e kadar olan commit aralığını
inceler; böylece saatlik tek bir çalışma, son belgeler geçişinden bu yana biriken
tüm `main` değişikliklerini kapsayabilir.

`Test Performance Agent` iş akışı, yavaş testler için olay tetiklemeli bir Codex
bakım hattıdır. Salt zamanlama temelli değildir: `main` üzerinde bot olmayan başarılı bir push CI çalışması
bunu tetikleyebilir, ancak aynı UTC gününde başka bir workflow-run çağrısı zaten çalışmış
veya çalışıyor ise atlanır. Manuel dispatch bu günlük etkinlik kapısını aşar.
Hat, tam paket gruplanmış bir Vitest performans raporu oluşturur, Codex'in geniş kapsamlı
refactor'lar yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir,
ardından tam paket raporunu yeniden çalıştırır ve geçen temel test sayısını azaltan değişiklikleri reddeder.
Temel hatta başarısız testler varsa, Codex yalnızca bariz hataları düzeltebilir ve agent sonrası
tam paket raporu herhangi bir şey commit edilmeden önce geçmelidir. Bot push'u merge edilmeden önce `main`
ilerlerse, hat doğrulanmış yama üzerinde rebase yapar, `pnpm check:changed` komutunu yeniden çalıştırır
ve push'u tekrar dener; çakışan eski yamalar atlanır. GitHub-hosted Ubuntu kullanır; böylece Codex
eylemi docs agent ile aynı drop-sudo güvenlik duruşunu koruyabilir.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## İş Genel Bakışı

| İş                               | Amaç                                                                                         | Ne zaman çalışır                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Yalnızca docs değişikliklerini, değişen kapsamları, değişen extension'ları algılamak ve CI manifest'ini oluşturmak | Taslak olmayan push ve PR'lerde her zaman |
| `security-scm-fast`              | `zizmor` ile özel anahtar tespiti ve iş akışı denetimi                                       | Taslak olmayan push ve PR'lerde her zaman |
| `security-dependency-audit`      | npm advisories'e karşı bağımlılıksız üretim lockfile denetimi                               | Taslak olmayan push ve PR'lerde her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için gerekli toplulaştırıcı                                            | Taslak olmayan push ve PR'lerde her zaman |
| `build-artifacts`                | `dist/`, Control UI, built-artifact kontrolleri ve yeniden kullanılabilir downstream artifact'leri derlemek | Node ile ilgili değişiklikler       |
| `checks-fast-core`               | Paketli/plugin-contract/protocol kontrolleri gibi hızlı Linux doğruluk hatları              | Node ile ilgili değişiklikler       |
| `checks-fast-contracts-channels` | Kararlı bir toplu kontrol sonucu ile shard'lanmış kanal sözleşmesi kontrolleri              | Node ile ilgili değişiklikler       |
| `checks-node-extensions`         | Extension paketi genelinde tam paketli plugin test shard'ları                               | Node ile ilgili değişiklikler       |
| `checks-node-core-test`          | Kanal, paketli, sözleşme ve extension hatları hariç çekirdek Node test shard'ları           | Node ile ilgili değişiklikler       |
| `extension-fast`                 | Yalnızca değişen paketli plugin'ler için odaklı testler                                     | Extension değişiklikleri içeren pull request'ler |
| `check`                          | Shard'lanmış ana yerel geçit eşdeğeri: üretim türleri, lint, guard'lar, test türleri ve strict smoke | Node ile ilgili değişiklikler       |
| `check-additional`               | Mimari, sınır, extension-surface guard'ları, package-boundary ve gateway-watch shard'ları   | Node ile ilgili değişiklikler       |
| `build-smoke`                    | Built-CLI smoke testleri ve başlangıç bellek smoke testi                                    | Node ile ilgili değişiklikler       |
| `checks`                         | Built-artifact kanal testleri artı yalnızca push için Node 22 uyumluluğu doğrulayıcısı      | Node ile ilgili değişiklikler       |
| `check-docs`                     | Docs biçimlendirme, lint ve bozuk bağlantı kontrolleri                                      | Docs değişti                        |
| `skills-python`                  | Python destekli Skills için Ruff + pytest                                                   | Python-skill ile ilgili değişiklikler |
| `checks-windows`                 | Windows'a özgü test hatları                                                                  | Windows ile ilgili değişiklikler    |
| `macos-node`                     | Paylaşılan built artifact'leri kullanan macOS TypeScript test hattı                         | macOS ile ilgili değişiklikler      |
| `macos-swift`                    | macOS uygulaması için Swift lint, derleme ve testler                                        | macOS ile ilgili değişiklikler      |
| `android`                        | Her iki flavor için Android birim testleri artı bir debug APK derlemesi                     | Android ile ilgili değişiklikler    |
| `test-performance-agent`         | Güvenilir etkinlikten sonra günlük Codex yavaş test optimizasyonu                           | Main CI başarısı veya manuel dispatch |

## Fail-Fast Sırası

İşler, pahalı olanlar çalışmadan önce ucuz kontroller başarısız olacak şekilde sıralanmıştır:

1. `preflight`, hangi hatların var olacağını belirler. `docs-scope` ve `changed-scope` mantığı, bağımsız işler değil bu iş içindeki adımlardır.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matrix işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux hatlarıyla örtüşür; böylece downstream tüketiciler paylaşılan derleme hazır olur olmaz başlayabilir.
4. Daha ağır platform ve çalışma zamanı hatları bundan sonra fan-out yapar: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, yalnızca PR için `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde yaşar ve `src/scripts/ci-changed-scope.test.ts` içindeki birim testleriyle kapsanır.
CI iş akışı düzenlemeleri Node CI grafiğini ve iş akışı linting'ini doğrular, ancak
tek başlarına Windows, Android veya macOS yerel derlemelerini zorlamaz; bu platform hatları
platform kaynak değişiklikleriyle sınırlı kalır.
Windows Node kontrolleri, Windows'a özgü süreç/yol wrapper'ları, npm/pnpm/UI runner helper'ları,
paket yöneticisi yapılandırması ve o hattı çalıştıran CI iş akışı yüzeyleriyle sınırlıdır;
ilgisiz kaynak, plugin, install-smoke ve yalnızca test değişiklikleri normal test shard'ları tarafından
zaten kapsanan kapsam için 16-vCPU'lu bir Windows worker ayırmamak adına Linux Node hatlarında kalır.
Ayrı `install-smoke` iş akışı, kendi `preflight` işi üzerinden aynı kapsam betiğini yeniden kullanır.
Smoke kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak böler.
Pull request'ler, Docker/package yüzeyleri, paketli plugin package/manifest değişiklikleri
ve Docker smoke işlerinin kullandığı çekirdek plugin/channel/gateway/Plugin SDK yüzeyleri için
hızlı yolu çalıştırır. Yalnızca kaynak paketli plugin değişiklikleri, yalnızca test düzenlemeleri
ve yalnızca docs düzenlemeleri Docker worker ayırmaz. Hızlı yol, kök Dockerfile imajını bir kez derler,
CLI'yi kontrol eder, container gateway-network e2e'yi çalıştırır, paketli bir extension build arg'ını doğrular
ve sınırlandırılmış paketli-plugin Docker profilini 120 saniyelik komut zaman aşımı altında çalıştırır.
Tam yol, gecelik planlanmış çalışmalar, manuel dispatch'ler, workflow-call sürüm kontrolleri
ve gerçekten installer/package/Docker yüzeylerine dokunan pull request'ler için QR package install
ve installer Docker/update kapsamını korur. Merge commit'leri dahil `main` push'ları tam yolu zorlamaz;
changed-scope mantığı bir push'ta tam kapsam isterse, iş akışı hızlı Docker smoke'u korur ve
tam install smoke'u gece çalışmasına veya sürüm doğrulamasına bırakır. Yavaş Bun global install
image-provider smoke ayrı olarak `run_bun_global_install_smoke` ile kapılanır; gecelik zamanlamada
ve release checks iş akışından çalışır, manuel `install-smoke` dispatch'leri buna dahil olmayı seçebilir,
ancak pull request'ler ve `main` push'ları bunu çalıştırmaz. QR ve installer Docker testleri kendi
kurulum odaklı Dockerfile'larını korur. Yerel `test:docker:all`, bir paylaşılan live-test imajı ve
bir paylaşılan `scripts/e2e/Dockerfile` built-app imajı önceden derler, ardından live/E2E smoke hatlarını
`OPENCLAW_SKIP_DOCKER_BUILD=1` ile paralel çalıştırır; varsayılan 8'lik ana havuz eşzamanlılığını
`OPENCLAW_DOCKER_ALL_PARALLELISM` ile ve sağlayıcıya duyarlı 8'lik kuyruk havuzu eşzamanlılığını
`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` ile ayarlayın. Hat başlangıçları, yerel Docker daemon create
fırtınalarını önlemek için varsayılan olarak 2 saniye aralıklıdır; `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0`
veya başka bir milisaniye değeriyle geçersiz kılın. Yerel toplulaştırıcı varsayılan olarak ilk hatadan sonra
yeni havuzlanmış hatları planlamayı durdurur ve her hattın `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ile
geçersiz kılınabilen 120 dakikalık zaman aşımı vardır. Yeniden kullanılabilir live/E2E iş akışı,
Docker matrix'ten önce SHA etiketli tek bir GHCR Docker E2E imajı derleyip push ederek,
ardından matrix'i `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırarak paylaşılan imaj desenini yansıtır.
Zamanlanmış live/E2E iş akışı, tam sürüm yolu Docker paketini günlük çalıştırır. Tam paketli
update/channel matrix'i, tekrarlanan gerçek npm update ve doctor repair geçişleri yaptığı için
manuel/tam paket olarak kalır.

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde bulunur ve `scripts/check-changed.mjs`
tarafından yürütülür. Bu yerel geçit, geniş CI platform kapsamına göre mimari sınırlar konusunda daha katıdır:
çekirdek üretim değişiklikleri çekirdek üretim typecheck artı çekirdek testlerini çalıştırır,
yalnızca çekirdek test değişiklikleri yalnızca çekirdek test typecheck/testlerini çalıştırır,
extension üretim değişiklikleri extension üretim typecheck artı extension testlerini çalıştırır
ve yalnızca extension test değişiklikleri yalnızca extension test typecheck/testlerini çalıştırır.
Genel Plugin SDK veya plugin-contract değişiklikleri extension doğrulamasını genişletir çünkü
extension'lar bu çekirdek sözleşmelere bağlıdır. Yalnızca sürüm meta verisi sürüm artırımları
hedefli sürüm/yapılandırma/kök-bağımlılık kontrolleri çalıştırır. Bilinmeyen kök/yapılandırma değişiklikleri
güvenli tarafta kalmak için tüm hatlara düşer.

Push'larda, `checks` matrix'i yalnızca push'a özel `compat-node22` hattını ekler.
Pull request'lerde bu hat atlanır ve matrix normal test/kanal hatlarına odaklı kalır.

En yavaş Node test aileleri bölünür veya dengelenir; böylece her iş küçük kalır ve runner'lar gereğinden fazla rezerve edilmez: kanal sözleşmeleri üç ağırlıklı shard olarak çalışır, paketli plugin testleri altı extension worker arasında dengelenir, küçük çekirdek birim hatları eşleştirilir, auto-reply altı minicik worker yerine üç dengeli worker olarak çalışır ve agentic gateway/plugin yapılandırmaları, built artifact'leri beklemek yerine mevcut yalnızca kaynak agentic Node işleri arasında dağıtılır. Geniş tarayıcı, QA, medya ve çeşitli plugin testleri, paylaşılan plugin catch-all yerine kendilerine ayrılmış Vitest yapılandırmalarını kullanır. Extension shard işleri, import ağırlıklı plugin partileri küçük CI runner'larını aşırı yüklemesin diye plugin config gruplarını tek bir Vitest worker ve daha büyük bir Node heap ile seri olarak çalıştırır. Geniş agents hattı, tek bir yavaş test dosyasına ait olmaktan çok import/zamanlama ağırlıklı olduğu için paylaşılan Vitest dosya-paralel zamanlayıcısını kullanır. `runtime-config`, paylaşılan runtime shard'ının kuyruğu tek başına taşımaması için infra core-runtime shard'ı ile birlikte çalışır. `check-additional`, package-boundary derleme/canary işlerini birlikte tutar ve çalışma zamanı topolojisi mimarisini gateway watch kapsamından ayırır; boundary guard shard'ı, küçük bağımsız guard'larını tek bir iş içinde eşzamanlı çalıştırır. Gateway watch, kanal testleri ve çekirdek support-boundary shard'ı, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır; bu da iki ek Blacksmith worker ve ikinci bir artifact-consumer kuyruğundan kaçınırken eski kontrol adlarını hafif doğrulayıcı işler olarak korur.

Android CI, hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır, ardından Play debug APK'sını derler. Üçüncü taraf flavor'ının ayrı bir source set'i veya manifest'i yoktur; birim test hattı yine de bu flavor'ı SMS/çağrı günlüğü BuildConfig bayraklarıyla derlerken, Android ile ilgili her push'ta yinelenen bir debug APK paketleme işinden kaçınır.
`extension-fast` yalnızca PR içindir; çünkü push çalışmaları zaten tam paketli plugin shard'larını yürütür. Bu, incelemeler için değişen plugin geri bildirimini korurken `main` üzerinde `checks-node-extensions` içinde zaten bulunan kapsam için ek bir Blacksmith worker ayırmaz.

GitHub, aynı PR veya `main` ref üzerine daha yeni bir push geldiğinde yerine geçen işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalışma da başarısız olmadıkça bunu CI gürültüsü olarak değerlendirin. Toplu shard kontrolleri `!cancelled() && always()` kullanır; böylece normal shard hatalarını yine de bildirir, ancak tüm iş akışı zaten yerine geçmişse kuyruğa girmez.
CI eşzamanlılık anahtarı sürümlüdür (`CI-v7-*`); böylece eski bir kuyruk grubundaki GitHub kaynaklı bir zombi, daha yeni main çalışmalarını süresiz engelleyemez.

## Runner'lar

| Runner                           | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve toplulaştırıcıları (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protocol/contract/paketli kontroller, shard'lanmış kanal sözleşmesi kontrolleri, lint dışındaki `check` shard'ları, `check-additional` shard'ları ve toplulaştırıcıları, Node test toplu doğrulayıcıları, docs kontrolleri, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight da GitHub-hosted Ubuntu kullanır, böylece Blacksmith matrix daha erken kuyruğa girebilir |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shard'ları, paketli plugin test shard'ları, `android`                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, burada 8 vCPU kazandırdığından daha pahalı olmaya devam eder; 32-vCPU kuyruk süresi kazandırdığından daha pahalı olduğu için install-smoke Docker derlemeleri                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork'lar `macos-latest`'e geri düşer                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork'lar `macos-latest`'e geri düşer                                                                                                                                                                                                                                                                                                                                                                                          |

## Yerel Eşdeğerler

```bash
pnpm changed:lanes   # origin/main...HEAD için yerel changed-lane sınıflandırıcısını incele
pnpm check:changed   # akıllı yerel geçit: sınır hattına göre değişen typecheck/lint/testler
pnpm check          # hızlı yerel geçit: üretim tsgo + shard'lanmış lint + paralel hızlı guard'lar
pnpm check:test-types
pnpm check:timed    # sahne başına zamanlamalarla aynı geçit
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest testleri
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs biçimlendirme + lint + bozuk bağlantılar
pnpm build          # CI artifact/build-smoke hatları önemli olduğunda dist derle
node scripts/ci-run-timings.mjs <run-id>      # duvar süresi, kuyruk süresi ve en yavaş işleri özetle
node scripts/ci-run-timings.mjs --recent 10   # son başarılı main CI çalışmalarını karşılaştır
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## İlgili

- [Install overview](/tr/install)
- [Release channels](/tr/install/development-channels)
