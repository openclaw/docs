---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekiyor.
    - Başarısız GitHub Actions denetimlerinde hata ayıklıyorsunuz.
summary: CI iş grafiği, kapsam geçitleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-04-26T11:24:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a6c14f785434585f2b3a72bcd2cff3a281e51fe12cc4c14aa7613d47cd8efc4
    source_path: ci.md
    workflow: 15
---

CI, `main` dalına yapılan her push'ta ve her pull request'te çalışır. Yalnızca ilgisiz alanlar değiştiğinde pahalı işleri atlamak için akıllı kapsam belirleme kullanır.

QA Lab, ana akıllı kapsamlı iş akışının dışında özel CI hatlarına sahiptir. `Parity gate` iş akışı, eşleşen PR değişikliklerinde ve manuel tetiklemede çalışır; özel QA çalışma zamanını derler ve sahte GPT-5.5 ile Opus 4.6 agentic paketlerini karşılaştırır. `QA-Lab - All Lanes` iş akışı, `main` üzerinde her gece ve manuel tetiklemede çalışır; sahte parity gate, canlı Matrix hattı ve canlı Telegram hattını paralel işler olarak dağıtır. Canlı işler `qa-live-shared` ortamını kullanır ve Telegram hattı Convex kiralarını kullanır. `OpenClaw Release Checks` de sürüm onayı öncesinde aynı QA Lab hatlarını çalıştırır.

`Duplicate PRs After Merge` iş akışı, yayına alma sonrası yinelenenleri temizlemek için bakımcıya yönelik manuel bir iş akışıdır. Varsayılan olarak dry-run modundadır ve yalnızca `apply=true` olduğunda açıkça listelenen PR'leri kapatır. GitHub üzerinde değişiklik yapmadan önce, yayına alınan PR'nin birleştirilmiş olduğunu ve her yinelenenin ya ortak bir referans verilen issue'ya ya da çakışan değişmiş hunk'lara sahip olduğunu doğrular.

`Docs Agent` iş akışı, mevcut belgeleri yakın zamanda yayına alınan değişikliklerle uyumlu tutmak için olay güdümlü bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerinde başarılı, bot olmayan bir push CI çalışması bunu tetikleyebilir ve manuel tetikleme bunu doğrudan çalıştırabilir. Workflow-run çağrıları, `main` ilerlemişse veya son bir saat içinde atlanmamış başka bir Docs Agent çalışması oluşturulmuşsa atlanır. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından mevcut `main`'e kadar olan commit aralığını inceler; böylece saatlik tek bir çalışma, son belgeler geçişinden beri biriken tüm main değişikliklerini kapsayabilir.

`Test Performance Agent` iş akışı, yavaş testler için olay güdümlü bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerinde başarılı, bot olmayan bir push CI çalışması bunu tetikleyebilir, ancak aynı UTC gününde başka bir workflow-run çağrısı zaten çalışmışsa veya çalışıyorsa atlanır. Manuel tetikleme bu günlük etkinlik kapısını atlar. Hat, tam paket gruplu bir Vitest performans raporu oluşturur, Codex'in geniş yeniden düzenlemeler yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, sonra tam paket raporunu yeniden çalıştırır ve geçen temel test sayısını azaltan değişiklikleri reddeder. Temelde başarısız testler varsa, Codex yalnızca bariz hataları düzeltebilir ve herhangi bir şey commit edilmeden önce aracı sonrası tam paket raporunun geçmesi gerekir. Bot push'u yayına alınmadan önce `main` ilerlerse, hat doğrulanmış yamayı yeniden tabanlar, `pnpm check:changed` komutunu yeniden çalıştırır ve push'u yeniden dener; çakışan, eski yamalar atlanır. Codex eylemi docs agent ile aynı drop-sudo güvenlik duruşunu koruyabilsin diye GitHub-hosted Ubuntu kullanır.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## İş Genel Bakışı

| İş                               | Amaç                                                                                         | Ne zaman çalışır                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Yalnızca docs değişikliklerini, değişen kapsamları, değişen eklentileri tespit eder ve CI manifestini oluşturur | Draft olmayan push ve PR'lerde her zaman |
| `security-scm-fast`              | `zizmor` aracılığıyla özel anahtar tespiti ve iş akışı denetimi                              | Draft olmayan push ve PR'lerde her zaman |
| `security-dependency-audit`      | npm advisories'e karşı bağımlılıksız üretim lockfile denetimi                                | Draft olmayan push ve PR'lerde her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için gerekli toplu iş                                                  | Draft olmayan push ve PR'lerde her zaman |
| `build-artifacts`                | `dist/`, Control UI, derlenmiş yapıt denetimleri ve yeniden kullanılabilir alt akış yapıtlarını derler | Node ile ilgili değişiklikler       |
| `checks-fast-core`               | Paketlenmiş/Plugin sözleşmesi/protokol denetimleri gibi hızlı Linux doğruluk hatları         | Node ile ilgili değişiklikler       |
| `checks-fast-contracts-channels` | Kararlı bir toplu denetim sonucu ile shard'lanmış kanal sözleşmesi denetimleri               | Node ile ilgili değişiklikler       |
| `checks-node-extensions`         | Eklenti paketi genelinde tam paketlenmiş Plugin test shard'ları                              | Node ile ilgili değişiklikler       |
| `checks-node-core-test`          | Kanal, paketlenmiş, sözleşme ve eklenti hatları hariç çekirdek Node test shard'ları          | Node ile ilgili değişiklikler       |
| `extension-fast`                 | Yalnızca değişen paketlenmiş eklentiler için odaklı testler                                  | Eklenti değişiklikleri içeren pull request'ler |
| `check`                          | Shard'lanmış ana yerel geçit eşdeğeri: üretim türleri, lint, korumalar, test türleri ve katı smoke | Node ile ilgili değişiklikler       |
| `check-additional`               | Mimari, sınır, eklenti yüzeyi korumaları, paket sınırı ve gateway-watch shard'ları          | Node ile ilgili değişiklikler       |
| `build-smoke`                    | Derlenmiş CLI smoke testleri ve başlangıç belleği smoke testi                                | Node ile ilgili değişiklikler       |
| `checks`                         | Derlenmiş yapıt kanal testleri artı yalnızca push'a özel Node 22 uyumluluğu için doğrulayıcı | Node ile ilgili değişiklikler       |
| `check-docs`                     | Docs biçimlendirme, lint ve bozuk bağlantı denetimleri                                       | Docs değiştiğinde                   |
| `skills-python`                  | Python tabanlı Skills için Ruff + pytest                                                     | Python skill ile ilgili değişiklikler |
| `checks-windows`                 | Windows'a özgü test hatları                                                                   | Windows ile ilgili değişiklikler    |
| `macos-node`                     | Paylaşılan derlenmiş yapıtları kullanan macOS TypeScript test hattı                          | macOS ile ilgili değişiklikler      |
| `macos-swift`                    | macOS uygulaması için Swift lint, derleme ve testler                                         | macOS ile ilgili değişiklikler      |
| `android`                        | Her iki flavor için Android birim testleri ve bir debug APK derlemesi                        | Android ile ilgili değişiklikler    |
| `test-performance-agent`         | Güvenilir etkinlik sonrası günlük Codex yavaş test optimizasyonu                             | Main CI başarısı veya manuel tetikleme |

## Hızlı başarısız olma sırası

İşler, pahalı olanlar çalışmadan önce ucuz denetimler başarısız olacak şekilde sıralanır:

1. `preflight`, hangi hatların var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bağımsız işler değil, bu işin içindeki adımlardır.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır yapıt ve platform matris işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux hatlarıyla çakışacak şekilde çalışır, böylece alt tüketiciler paylaşılan derleme hazır olur olmaz başlayabilir.
4. Daha ağır platform ve çalışma zamanı hatları bundan sonra fan-out olur: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, yalnızca PR için `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki birim testlerle kapsanır.
CI iş akışı düzenlemeleri Node CI grafiğini ve iş akışı lint denetimini doğrular, ancak tek başına Windows, Android veya macOS yerel derlemelerini zorlamaz; bu platform hatları platform kaynak değişikliklerine göre kapsamlandırılmış kalır.
Yalnızca CI yönlendirme düzenlemeleri, seçili ucuz çekirdek test fixture düzenlemeleri ve dar plugin sözleşmesi yardımcı/test-yönlendirme düzenlemeleri hızlı bir yalnızca-Node manifest yolunu kullanır: preflight, security ve tek bir `checks-fast-core` görevi. Bu yol, değişen dosyalar hızlı görevin doğrudan çalıştırdığı yönlendirme veya yardımcı yüzeylerle sınırlı olduğunda build artifacts, Node 22 uyumluluğu, kanal sözleşmeleri, tam çekirdek shard'ları, paketlenmiş Plugin shard'ları ve ek koruma matrislerinden kaçınır.
Windows Node denetimleri, Windows'a özgü process/path sarmalayıcıları, npm/pnpm/UI çalıştırıcı yardımcıları, paket yöneticisi yapılandırması ve bu hattı yürüten CI iş akışı yüzeyleriyle kapsamlandırılır; ilgisiz kaynak, plugin, install-smoke ve yalnızca test değişiklikleri Linux Node hatlarında kalır, böylece normal test shard'larında zaten çalıştırılan kapsam için 16-vCPU'lu bir Windows worker ayrılmaz.
Ayrı `install-smoke` iş akışı, kendi `preflight` işi üzerinden aynı kapsam betiğini yeniden kullanır. Smoke kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak böler. Pull request'ler, Docker/paket yüzeyleri, paketlenmiş plugin paket/manifest değişiklikleri ve Docker smoke işlerinin çalıştırdığı çekirdek plugin/kanal/gateway/Plugin SDK yüzeyleri için hızlı yolu çalıştırır. Yalnızca kaynak niteliğindeki paketlenmiş plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca docs düzenlemeleri Docker worker ayırmaz. Hızlı yol kök Dockerfile imajını bir kez derler, CLI'yi denetler, ajanların paylaşılan çalışma alanını silen CLI smoke testini çalıştırır, kapsayıcı gateway-network e2e testini çalıştırır, paketlenmiş bir extension build arg'ını doğrular ve sınırlı paketlenmiş plugin Docker profilini 240 saniyelik toplam komut zaman aşımı altında, her senaryonun Docker çalıştırması ayrı ayrı sınırlandırılmış şekilde yürütür. Tam yol, QR paket kurulumu ve yükleyici Docker/güncelleme kapsamını gecelik zamanlanmış çalıştırmalar, manuel tetiklemeler, workflow-call sürüm denetimleri ve gerçekten yükleyici/paket/Docker yüzeylerine dokunan pull request'ler için korur. Birleştirme commit'leri dahil `main` push'ları tam yolu zorlamaz; changed-scope mantığı bir push için tam kapsam istese bile iş akışı hızlı Docker smoke testini sürdürür ve tam install smoke testini gece çalışmasına veya sürüm doğrulamasına bırakır. Yavaş Bun global install image-provider smoke testi ayrı olarak `run_bun_global_install_smoke` ile kapılanır; gecelik zamanlamada ve release checks iş akışından çalışır, manuel `install-smoke` tetiklemeleri buna isteğe bağlı olarak dahil olabilir, ancak pull request'ler ve `main` push'ları bunu çalıştırmaz. QR ve yükleyici Docker testleri kendi kuruluma odaklı Dockerfile'larını korur. Yerel `test:docker:all`, paylaşılan bir live-test imajı ile paylaşılan bir `scripts/e2e/Dockerfile` built-app imajını önceden derler, sonra live/E2E smoke hatlarını ağırlıklı bir zamanlayıcı ve `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır; varsayılan ana havuz yuva sayısı 10'u `OPENCLAW_DOCKER_ALL_PARALLELISM` ile, sağlayıcıya duyarlı kuyruk sonu havuz yuva sayısı 10'u `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` ile ayarlayın. Ağır hat sınırları varsayılan olarak `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` şeklindedir; böylece npm install ve çok hizmetli hatlar Docker'ı aşırı taahhüt etmezken daha hafif hatlar kullanılabilir yuvaları doldurabilir. Hat başlangıçları, yerel Docker daemon oluşturma fırtınalarını önlemek için varsayılan olarak 2 saniye aralıklıdır; `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` veya başka bir milisaniye değeriyle geçersiz kılın. Yerel toplu ön denetim Docker'ı doğrular, eski OpenClaw E2E kapsayıcılarını kaldırır, etkin hat durumunu yayımlar, en uzundan kısaya sıralama için hat zamanlamalarını kalıcı hale getirir ve zamanlayıcı incelemesi için `OPENCLAW_DOCKER_ALL_DRY_RUN=1` desteği sunar. Varsayılan olarak ilk hatadan sonra yeni havuzlanmış hatları planlamayı durdurur ve her hattın `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ile geçersiz kılınabilen 120 dakikalık bir yedek zaman aşımı vardır; seçili live/tail hatları daha sıkı hat başına sınırlar kullanır. Yeniden kullanılabilir live/E2E iş akışı, Docker matrisinden önce SHA etiketli tek bir GHCR Docker E2E imajı derleyip yayımlayarak aynı paylaşılan imaj desenini yansıtır, ardından matrisi `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır. Zamanlanmış live/E2E iş akışı tam sürüm yolu Docker paketini günlük olarak çalıştırır. Paketlenmiş güncelleme matrisi güncelleme hedefine göre bölünür, böylece tekrarlanan npm update ve doctor repair geçişleri diğer paketlenmiş denetimlerle shard'lanabilir.

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde bulunur ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel geçit, geniş CI platform kapsamına göre mimari sınırlar konusunda daha katıdır: çekirdek üretim değişiklikleri çekirdek prod typecheck artı çekirdek testlerini çalıştırır, yalnızca çekirdek test değişiklikleri yalnızca çekirdek test typecheck/testlerini çalıştırır, extension üretim değişiklikleri extension prod typecheck artı extension testlerini çalıştırır ve yalnızca extension test değişiklikleri yalnızca extension test typecheck/testlerini çalıştırır. Herkese açık Plugin SDK veya plugin-contract değişiklikleri, extension'lar bu çekirdek sözleşmelere bağlı olduğu için extension doğrulamasını genişletir. Yalnızca sürüm meta verisi içeren version bump'lar hedefli sürüm/yapılandırma/kök bağımlılık denetimlerini çalıştırır. Bilinmeyen kök/yapılandırma değişiklikleri güvenli tarafta kalıp tüm hatlara düşer.

Push'larda `checks` matrisi yalnızca push'a özgü `compat-node22` hattını ekler. Pull request'lerde bu hat atlanır ve matris normal test/kanal hatlarına odaklı kalır.

En yavaş Node test aileleri, her iş küçük kalsın ama runner'lar gereksiz ayrılmasın diye bölünür veya dengelenir: kanal sözleşmeleri üç ağırlıklı shard olarak çalışır, paketlenmiş plugin testleri altı extension worker arasında dengelenir, küçük çekirdek birim hatları eşlenir, auto-reply dört dengeli worker ile çalışır ve reply alt ağacı agent-runner, dispatch ve commands/state-routing shard'larına bölünür, agentic gateway/plugin yapılandırmaları ise built artifacts beklemek yerine mevcut yalnızca-kaynak agentic Node işlerine dağıtılır. Geniş browser, QA, medya ve çeşitli plugin testleri, paylaşılan plugin catch-all yerine kendi özel Vitest yapılandırmalarını kullanır. Extension shard işleri, import ağırlıklı plugin toplulukları ek CI işleri oluşturmasın diye bir seferde en fazla iki plugin yapılandırma grubunu grup başına bir Vitest worker ve daha büyük bir Node heap ile çalıştırır. Geniş agents hattı, tek bir yavaş test dosyasına ait olmaktan çok import/zamanlama ağırlıklı olduğu için paylaşılan Vitest dosya-paralel zamanlayıcısını kullanır. `runtime-config`, paylaşılan runtime shard'ının kuyruğun sonuna kalmaması için infra core-runtime shard'ı ile birlikte çalışır. Include-pattern shard'ları, CI shard adını kullanarak zamanlama girdileri kaydeder; böylece `.artifacts/vitest-shard-timings.json` bütün bir yapılandırmayı filtrelenmiş bir shard'dan ayırt edebilir. `check-additional`, package-boundary derleme/canary işlerini birlikte tutar ve runtime topology architecture'ı gateway watch kapsamından ayırır; boundary guard shard'ı küçük bağımsız korumalarını tek bir iş içinde eşzamanlı çalıştırır. Gateway watch, kanal testleri ve çekirdek support-boundary shard'ı, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır; böylece eski denetim adları hafif doğrulayıcı işler olarak korunurken iki ek Blacksmith worker ve ikinci bir artifact-consumer kuyruğundan kaçınılır.
Android CI hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır, ardından Play debug APK'sını derler. Third-party flavor'ın ayrı bir kaynak seti veya manifest'i yoktur; birim test hattı yine de bu flavor'ı SMS/call-log BuildConfig bayraklarıyla derler, ancak her Android ile ilgili push'ta yinelenen bir debug APK paketleme işinden kaçınır.
`extension-fast` yalnızca PR içindir çünkü push çalıştırmaları zaten tam paketlenmiş plugin shard'larını yürütür. Bu, `checks-node-extensions` içinde zaten mevcut olan kapsam için `main` üzerinde ek bir Blacksmith worker ayırmadan incelemeler için değişen plugin geri bildirimi sağlar.

GitHub, aynı PR veya `main` referansına daha yeni bir push geldiğinde geçersiz kılınmış işleri `cancelled` olarak işaretleyebilir. Aynı referans için en yeni çalışma da başarısız olmadıkça bunu CI gürültüsü olarak değerlendirin. Toplu shard denetimleri `!cancelled() && always()` kullanır; böylece normal shard hatalarını yine bildirirler ama tüm iş akışı zaten geçersiz kılınmışsa kuyruğa girmezler.
CI concurrency anahtarı sürümlüdür (`CI-v7-*`), böylece eski bir kuyruk grubundaki GitHub taraflı zombi bir öğe daha yeni main çalışmalarını süresiz engelleyemez.

## Runner'lar

| Runner                           | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve toplamaları (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protokol/sözleşme/paketlenmiş denetimler, shard'lanmış kanal sözleşmesi denetimleri, lint dışındaki `check` shard'ları, `check-additional` shard'ları ve toplamaları, Node test toplu doğrulayıcıları, docs denetimleri, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight da GitHub-hosted Ubuntu kullanır, böylece Blacksmith matrisi daha erken kuyruğa girebilir |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shard'ları, paketlenmiş Plugin test shard'ları, `android`                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`; bu iş CPU'ya yeterince duyarlı kaldığından 8 vCPU tasarruf ettiğinden daha pahalıya mal oldu; ayrıca 32-vCPU kuyruk süresi kazandırdığından daha pahalıya mal olduğu için install-smoke Docker derlemeleri                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork'lar `macos-latest`'e geri düşer                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork'lar `macos-latest`'e geri düşer                                                                                                                                                                                                                                                                                                                                                                                         |

## Yerel eşdeğerler

```bash
pnpm changed:lanes   # origin/main...HEAD için yerel changed-lane sınıflandırıcısını incele
pnpm check:changed   # akıllı yerel geçit: sınır hattına göre değişen typecheck/lint/testler
pnpm check          # hızlı yerel geçit: üretim tsgo + shard'lanmış lint + paralel hızlı korumalar
pnpm check:test-types
pnpm check:timed    # aşama başına zamanlamalarla aynı geçit
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest testleri
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs biçimlendirme + lint + bozuk bağlantılar
pnpm build          # CI artifact/build-smoke hatları önemli olduğunda dist derle
pnpm ci:timings                               # en son origin/main push CI çalışmasını özetle
pnpm ci:timings:recent                        # son başarılı main CI çalışmalarını karşılaştır
node scripts/ci-run-timings.mjs <run-id>      # duvar süresi, kuyruk süresi ve en yavaş işleri özetle
node scripts/ci-run-timings.mjs --latest-main # issue/yorum gürültüsünü yok say ve origin/main push CI'yi seç
node scripts/ci-run-timings.mjs --recent 10   # son başarılı main CI çalışmalarını karşılaştır
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Sürüm kanalları](/tr/install/development-channels)
