---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekiyor
    - Başarısız olan bir GitHub Actions kontrolünde hata ayıklıyorsunuz
    - Bir sürüm doğrulama çalıştırmasını veya yeniden çalıştırmasını koordine ediyorsunuz
    - ClawSweeper dispatch'ini veya GitHub etkinliği yönlendirmesini değiştiriyorsunuz
summary: CI iş grafiği, kapsam kapıları, sürüm şemsiyeleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-07-04T06:46:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e97c378598fadcbaef12e5f9abd1d99261dd4594ce88ce4aa3293af0744fc5a
    source_path: ci.md
    workflow: 16
---

OpenClaw CI, `main` dalına yapılan her push'ta ve her pull request'te çalışır. Kanonik
`main` push'ları önce 90 saniyelik barındırılan çalıştırıcı kabul penceresinden geçer.
Mevcut `CI` eşzamanlılık grubu, daha yeni bir commit geldiğinde bekleyen bu çalışmayı iptal eder;
böylece ardışık merge'lerin her biri tam bir Blacksmith matrisini kaydetmez.
Pull request'ler ve elle dispatch'ler beklemeyi atlar. Ardından `preflight` işi
diff'i sınıflandırır ve yalnızca ilgisiz alanlar değiştiğinde maliyetli hatları kapatır.
Elle yapılan `workflow_dispatch` çalışmaları, sürüm adayları ve geniş
doğrulama için akıllı kapsamlamayı bilerek atlar ve tüm grafiği genişletir. Android hatları
`include_android` üzerinden isteğe bağlı kalır. Yalnızca sürüme özgü
Plugin kapsamı ayrı [`Plugin Ön Sürümü`](#plugin-prerelease)
workflow'unda yaşar ve yalnızca [`Tam Sürüm Doğrulaması`](#full-release-validation)
veya açık bir elle dispatch ile çalışır.

## Pipeline genel bakışı

| İş                                 | Amaç                                                                                                      | Ne zaman çalışır                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `preflight`                        | Yalnızca dokümantasyon değişikliklerini, değişen kapsamları, değişen uzantıları algılar ve CI manifestini oluşturur | Taslak olmayan push'larda ve PR'lerde her zaman    |
| `runner-admission`                 | Blacksmith işi kaydedilmeden önce kanonik `main` push'ları için barındırılan 90 saniyelik debounce        | Her CI çalışmasında; yalnızca kanonik `main` push'larında uyur |
| `security-fast`                    | Özel anahtar algılama, `zizmor` ile değişen workflow denetimi ve üretim lockfile denetimi                 | Taslak olmayan push'larda ve PR'lerde her zaman    |
| `check-dependencies`               | Üretim Knip yalnızca bağımlılık geçişi ve kullanılmayan dosya allowlist koruması                          | Node ile ilgili değişiklikler                      |
| `build-artifacts`                  | `dist/`, Control UI, derlenmiş CLI smoke kontrolleri, gömülü derlenmiş artifact kontrolleri ve yeniden kullanılabilir artifact'ler oluşturur | Node ile ilgili değişiklikler                      |
| `checks-fast-core`                 | Bundled, protokol, QA Smoke CI ve CI yönlendirme kontrolleri gibi hızlı Linux doğruluk hatları            | Node ile ilgili değişiklikler                      |
| `checks-fast-contracts-plugins-*`  | İki shard'lı Plugin sözleşme kontrolü                                                                     | Node ile ilgili değişiklikler                      |
| `checks-fast-contracts-channels-*` | İki shard'lı kanal sözleşme kontrolü                                                                      | Node ile ilgili değişiklikler                      |
| `checks-node-core-*`               | Kanal, bundled, sözleşme ve uzantı hatları hariç çekirdek Node test shard'ları                            | Node ile ilgili değişiklikler                      |
| `check-*`                          | Shard'lı ana yerel kapı eşdeğeri: üretim tipleri, lint, korumalar, test tipleri ve katı smoke             | Node ile ilgili değişiklikler                      |
| `check-additional-*`               | Mimari, shard'lı sınır/prompt sapması, uzantı korumaları, paket sınırı ve çalışma zamanı topolojisi       | Node ile ilgili değişiklikler                      |
| `checks-node-compat-node22`        | Node 22 uyumluluk derlemesi ve smoke hattı                                                                | Sürümler için elle CI dispatch                     |
| `check-docs`                       | Dokümantasyon biçimlendirme, lint ve bozuk bağlantı kontrolleri                                           | Dokümantasyon değiştiğinde                         |
| `skills-python`                    | Python destekli Skills için Ruff + pytest                                                                 | Python-skill ile ilgili değişiklikler              |
| `checks-windows`                   | Windows'a özgü süreç/yol testleri ve paylaşılan çalışma zamanı import specifier regresyonları             | Windows ile ilgili değişiklikler                   |
| `macos-node`                       | Paylaşılan derlenmiş artifact'leri kullanan macOS TypeScript test hattı                                   | macOS ile ilgili değişiklikler                     |
| `macos-swift`                      | macOS uygulaması için Swift lint, derleme ve testler                                                      | macOS ile ilgili değişiklikler                     |
| `ios-build`                        | Xcode proje oluşturma ve iOS uygulaması simülatör derlemesi                                               | iOS uygulaması, paylaşılan uygulama kiti veya Swabble değişiklikleri |
| `android`                          | Her iki flavor için Android birim testleri ve bir debug APK derlemesi                                     | Android ile ilgili değişiklikler                   |
| `test-performance-agent`           | Güvenilir etkinlikten sonra günlük Codex yavaş test optimizasyonu                                         | Ana CI başarısı veya elle dispatch                 |
| `openclaw-performance`             | Mock sağlayıcı, derin profil ve GPT 5.5 canlı hatlarıyla günlük/isteğe bağlı Kova çalışma zamanı performans raporları | Zamanlanmış ve elle dispatch                       |

## Fail-fast sırası

1. `runner-admission` yalnızca kanonik `main` push'ları için bekler; daha yeni bir push, Blacksmith kaydından önce çalışmayı iptal eder.
2. `preflight`, hangi hatların var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı, bağımsız işler değil, bu işin içindeki adımlardır.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matrisi işlerini beklemeden hızla başarısız olur.
4. `build-artifacts`, hızlı Linux hatlarıyla çakışır; böylece downstream tüketiciler paylaşılan derleme hazır olur olmaz başlayabilir.
5. Daha ağır platform ve çalışma zamanı hatları bundan sonra genişler: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` ve `android`.

Aynı PR veya `main` ref'ine daha yeni bir push geldiğinde GitHub, yerini yeni çalışmaya bırakan işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalışma da başarısız olmadığı sürece bunu CI gürültüsü olarak değerlendirin. Matris işleri `fail-fast: false` kullanır ve `build-artifacts`, küçük doğrulayıcı işleri kuyruğa almak yerine gömülü kanal, core-support-boundary ve gateway-watch hatalarını doğrudan raporlar. Otomatik CI eşzamanlılık anahtarı sürümlüdür (`CI-v7-*`); böylece eski bir kuyruk grubundaki GitHub taraflı bir zombi, daha yeni main çalışmalarını süresiz engelleyemez. Elle tam paket çalışmaları `CI-manual-v1-*` kullanır ve devam eden çalışmaları iptal etmez.

GitHub Actions'tan duvar süresini, kuyruk süresini, en yavaş işleri, hataları ve `pnpm-store-warmup` fanout bariyerini özetlemek için `pnpm ci:timings`, `pnpm ci:timings:recent` veya `node scripts/ci-run-timings.mjs <run-id>` kullanın. CI aynı çalışma özetini `ci-timings-summary` artifact'i olarak da yükler. Derleme zamanlaması için `build-artifacts` işinin `Build dist` adımını kontrol edin: `pnpm build:ci-artifacts`, `[build-all] phase timings:` yazdırır ve `ui:build` içerir; iş ayrıca `startup-memory` artifact'ini de yükler.

Pull request çalışmaları için terminal timing-summary işi, `GH_TOKEN` değerini `gh run view` komutuna iletmeden önce yardımcıyı güvenilir base revizyondan çalıştırır. Bu, token'lı sorguyu branch kontrollü kodun dışında tutarken pull request'in mevcut CI çalışmasını yine de özetler.

## PR bağlamı ve kanıt

Harici katkıcı PR'leri,
`.github/workflows/real-behavior-proof.yml` üzerinden bir PR bağlamı ve kanıt kapısı çalıştırır. Workflow, güvenilir
base commit'i checkout eder ve yalnızca PR gövdesini değerlendirir; katkıcı branch'inden kod çalıştırmaz.

Kapı; depo sahipleri, üyeleri, collaborator'ları veya botlar dışındaki PR yazarlarına uygulanır. PR gövdesi yazar tarafından yazılmış
`What Problem This Solves` ve `Evidence` bölümleri içerdiğinde geçer. Kanıt; odaklı bir
test, CI sonucu, ekran görüntüsü, kayıt, terminal çıktısı, canlı gözlem,
redakte edilmiş log veya artifact bağlantısı olabilir. Gövde niyeti ve faydalı doğrulamayı sağlar;
reviewer'lar doğruluğu değerlendirmek için kodu, testleri ve CI'ı inceler.

Kontrol başarısız olduğunda, başka bir kod commit'i push'lamak yerine PR gövdesini güncelleyin.

## Kapsam ve yönlendirme

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde yaşar ve `src/scripts/ci-changed-scope.test.ts` içindeki birim testlerle kapsanır. Elle dispatch, changed-scope algılamasını atlar ve preflight manifestinin her kapsamlı alan değişmiş gibi davranmasını sağlar.

- **CI workflow düzenlemeleri** Node CI grafiğini ve workflow linting'i doğrular, ancak tek başına Windows, iOS, Android veya macOS native derlemelerini zorlamaz; bu platform hatları platform kaynak değişikliklerine kapsamlı kalır.
- **Workflow Sanity**, tüm workflow YAML dosyaları üzerinde `actionlint`, `zizmor`, composite-action interpolation koruması ve conflict-marker koruması çalıştırır. PR kapsamlı `security-fast` işi de değişen workflow dosyaları üzerinde `zizmor` çalıştırır; böylece workflow güvenlik bulguları ana CI grafiğinde erken başarısız olur.
- **`main` push'larında dokümantasyon**, CI tarafından kullanılan aynı ClawHub dokümantasyon mirror'ı ile bağımsız `Docs` workflow'u tarafından kontrol edilir; böylece karma kod+dokümantasyon push'ları CI `check-docs` shard'ını da kuyruğa almaz. Pull request'ler ve elle CI, dokümantasyon değiştiğinde CI içinden `check-docs` çalıştırmaya devam eder.
- **TUI PTY**, TUI değişiklikleri için `checks-node-core-runtime-tui-pty` Linux Node shard'ında çalışır. Shard, `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` ile `test/vitest/vitest.tui-pty.config.ts` çalıştırır; böylece hem deterministik `TuiBackend` fixture hattını hem de yalnızca harici model endpoint'ini mock'layan daha yavaş `tui --local` smoke'u kapsar.
- **Yalnızca CI yönlendirme düzenlemeleri, seçili ucuz çekirdek test fixture düzenlemeleri ve dar Plugin sözleşme yardımcı/test yönlendirme düzenlemeleri** hızlı bir yalnızca Node manifest yolu kullanır: `preflight`, güvenlik ve tek bir `checks-fast-core` görevi. Bu yol; değişiklik hızlı görevin doğrudan çalıştırdığı yönlendirme veya yardımcı yüzeylerle sınırlı olduğunda build artifact'lerini, Node 22 uyumluluğunu, kanal sözleşmelerini, tam çekirdek shard'larını, bundled-plugin shard'larını ve ek koruma matrislerini atlar.
- **Windows Node kontrolleri** Windows'a özgü süreç/yol wrapper'larına, npm/pnpm/UI çalıştırıcı yardımcılarına, paket yöneticisi yapılandırmasına ve bu hattı yürüten CI workflow yüzeylerine kapsamlıdır; ilgisiz kaynak, Plugin, install-smoke ve yalnızca test değişiklikleri Linux Node hatlarında kalır.

En yavaş Node test aileleri, her işin runner'ları aşırı rezerve etmeden küçük kalması için bölünür veya dengelenir: Plugin sözleşmeleri ve kanal sözleşmeleri, standart GitHub runner yedeğiyle birlikte Blacksmith destekli iki ağırlıklı shard olarak çalışır; core unit fast/support hatları ayrı çalışır; core runtime infra, state, process/config, shared ve üç cron domain shard'ı arasında bölünür; auto-reply dengeli worker'lar olarak çalışır (reply alt ağacı agent-runner, dispatch ve commands/state-routing shard'larına bölünür); agentic gateway/server yapılandırmaları ise oluşturulmuş artifact'ları beklemek yerine chat/auth/model/http-plugin/runtime/startup hatlarına bölünür. Normal CI daha sonra yalnızca izole infra include-pattern shard'larını en fazla 64 test dosyasından oluşan deterministik paketlere yerleştirir; böylece izole olmayan command/cron, durumlu agents-core veya gateway/server paketlerini birleştirmeden Node matrisi azaltılır. Ağır sabit paketler 8 vCPU üzerinde kalırken paketlenmiş ve daha düşük ağırlıklı hatlar 4 vCPU kullanır. Canonical depodaki pull request'ler ek bir kompakt kabul planı kullanır: aynı config başına gruplar mevcut 34 işlik Linux Node planı içinde izole alt süreçlerde çalışır; böylece tek bir PR, 70'ten fazla işlik tam Node matrisini kaydetmez. `main` push'ları, manuel dispatch'ler ve release gate'leri tam matrisi korur. Geniş browser, QA, media ve çeşitli Plugin testleri, paylaşılan Plugin catch-all yerine kendi ayrılmış Vitest config'lerini kullanır. Include-pattern shard'ları zamanlama kayıtlarını CI shard adıyla kaydeder; böylece `.artifacts/vitest-shard-timings.json` bütün bir config ile filtrelenmiş bir shard'ı ayırt edebilir. `check-additional-*`, paket sınırı compile/canary işini birlikte tutar ve runtime topology mimarisini gateway watch kapsamından ayırır; boundary guard listesi bir prompt-ağırlıklı shard'a ve kalan guard şeritleri için bir birleşik shard'a çizgilenir; her biri seçilen bağımsız guard'ları eşzamanlı çalıştırır ve check başına zamanlamaları yazdırır. Pahalı Codex happy-path prompt snapshot drift check'i, yalnızca manuel CI ve prompt'u etkileyen değişiklikler için kendi ek işi olarak çalışır; böylece normal alakasız Node değişiklikleri soğuk prompt snapshot üretiminin arkasında beklemez ve boundary shard'ları dengeli kalırken prompt drift hâlâ buna neden olan PR'a sabitlenir. Aynı bayrak, oluşturulmuş-artifact core support-boundary shard'ı içinde prompt snapshot Vitest üretimini atlar. Gateway watch, kanal testleri ve core support-boundary shard'ı, `dist/` ve `dist-runtime/` zaten oluşturulduktan sonra `build-artifacts` içinde eşzamanlı çalışır.

Kabul edildikten sonra canonical Linux CI en fazla 24 eşzamanlı Node test işine ve
daha küçük fast/check hatları için 12 işe izin verir; Windows ve Android iki işte kalır çünkü
bu runner havuzları daha dardır.

Kompakt PR planı mevcut paket için 18 Node işi üretir: whole-config
grupları 120 dakikalık batch zaman aşımıyla izole alt süreçlerde batch'lenir,
include-pattern grupları ise aynı sınırlı iş bütçesini paylaşır.

Android CI hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır ve ardından Play debug APK'sını oluşturur. Third-party flavor'ın ayrı bir source set'i veya manifest'i yoktur; unit-test hattı yine de SMS/call-log BuildConfig bayraklarıyla flavor'ı compile ederken Android ile ilgili her push'ta yinelenen bir debug APK paketleme işinden kaçınır.

`check-dependencies` shard'ı `pnpm deadcode:dependencies` (en son Knip sürümüne sabitlenmiş, `dlx` kurulumu için pnpm'in minimum release yaşı devre dışı bırakılmış üretim Knip yalnızca-bağımlılık geçişi) ve `pnpm deadcode:unused-files` çalıştırır; bu ikincisi Knip'in üretim unused-file bulgularını `scripts/deadcode-unused-files.allowlist.mjs` ile karşılaştırır. Unused-file guard'ı, bir PR yeni gözden geçirilmemiş unused file eklediğinde veya stale allowlist girdisi bıraktığında başarısız olur; Knip'in statik olarak çözemediği kasıtlı dinamik Plugin, generated, build, live-test ve package bridge yüzeylerini korur.

## ClawSweeper etkinlik yönlendirme

`.github/workflows/clawsweeper-dispatch.yml`, OpenClaw depo etkinliğinden ClawSweeper'a hedef taraf köprüsüdür. Güvenilmeyen pull request kodunu checkout etmez veya çalıştırmaz. Workflow, `CLAWSWEEPER_APP_PRIVATE_KEY` içinden bir GitHub App token'ı oluşturur, ardından `openclaw/clawsweeper` deposuna kompakt `repository_dispatch` payload'ları dispatch eder.

Workflow'un dört hattı vardır:

- Tam issue ve pull request inceleme istekleri için `clawsweeper_item`;
- issue yorumlarındaki açık ClawSweeper komutları için `clawsweeper_comment`;
- `main` push'larındaki commit düzeyi inceleme istekleri için `clawsweeper_commit_review`;
- ClawSweeper agent'ının inceleyebileceği genel GitHub etkinliği için `github_activity`.

`github_activity` hattı yalnızca normalize edilmiş metadata iletir: event type, action, actor, repository, item number, URL, title, state ve mevcut olduğunda yorumlar veya incelemeler için kısa alıntılar. Tam webhook gövdesini iletmekten özellikle kaçınır. `openclaw/clawsweeper` içindeki alıcı workflow, normalize edilmiş event'i ClawSweeper agent'ı için OpenClaw Gateway hook'una gönderen `.github/workflows/github-activity.yml` dosyasıdır.

Genel etkinlik gözlemdir, varsayılan olarak teslimat değildir. ClawSweeper agent'ı prompt'unda Discord hedefini alır ve yalnızca event şaşırtıcı, eyleme geçirilebilir, riskli veya operasyonel olarak yararlı olduğunda `#clawsweeper` kanalına gönderi yapmalıdır. Rutin açılışlar, düzenlemeler, bot hareketliliği, yinelenen webhook gürültüsü ve normal review trafiği `NO_REPLY` ile sonuçlanmalıdır.

Bu yol boyunca GitHub başlıklarını, yorumlarını, gövdelerini, review metinlerini, branch adlarını ve commit mesajlarını güvenilmeyen veri olarak ele alın. Bunlar özetleme ve triage için girdidir; workflow veya agent runtime için talimat değildir.

## Manuel dispatch'ler

Manuel CI dispatch'leri normal CI ile aynı iş grafiğini çalıştırır, ancak Android dışındaki her scoped hattı açık olmaya zorlar: Linux Node shard'ları, bundled-plugin shard'ları, Plugin ve channel contract shard'ları, Node 22 uyumluluğu, `check-*`, `check-additional-*`, built-artifact smoke check'leri, docs check'leri, Python Skills, Windows, macOS, iOS build ve Control UI i18n. Bağımsız manuel CI dispatch'leri Android'i yalnızca `include_android=true` ile çalıştırır; tam release şemsiyesi Android'i `include_android=true` geçirerek etkinleştirir. Plugin prerelease static check'leri, release'e özel `agentic-plugins` shard'ı, tam extension batch sweep'i ve Plugin prerelease Docker hatları CI'dan hariç tutulur. Docker prerelease paketi yalnızca `Full Release Validation`, release-validation gate'i etkinleştirilmiş ayrı `Plugin Prerelease` workflow'unu dispatch ettiğinde çalışır.

Manuel çalıştırmalar benzersiz bir concurrency group kullanır; böylece release-candidate tam paketi aynı ref üzerindeki başka bir push veya PR çalıştırması tarafından iptal edilmez. İsteğe bağlı `target_ref` girdisi, güvenilir bir çağıranın seçilen dispatch ref'ten workflow dosyasını kullanırken bu grafiği bir branch, tag veya tam commit SHA'ya karşı çalıştırmasına izin verir.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner'lar

| Runner                          | İşler                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Manuel CI dispatch ve canonical olmayan depo fallback'leri, CodeQL JavaScript/actions kalite taramaları, workflow-sanity, labeler, auto-response, CI dışındaki docs workflow'ları ve install-smoke preflight; böylece Blacksmith matrisi daha erken kuyruğa girebilir                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, daha düşük ağırlıklı extension shard'ları, QA Smoke CI hariç `checks-fast-core`, Plugin/channel contract shard'ları, çoğu bundled/daha düşük ağırlıklı Linux Node shard'ı, `check-guards`, `check-prod-types`, `check-test-types`, seçili `check-additional-*` shard'ları ve `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Korunan ağır Linux Node paketleri, boundary/extension-ağır `check-additional-*` shard'ları ve `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, CI ve Testbox içinde `build-artifacts`, `check-lint` (8 vCPU'nun sağladığından daha fazla maliyet çıkardığı kadar CPU-duyarlı); install-smoke Docker build'leri (32-vCPU kuyruk süresi sağladığından daha fazla maliyet çıkardı)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` üzerinde `macos-node`; fork'lar `macos-15`'e fallback eder                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` üzerinde `macos-swift` ve `ios-build`; fork'lar `macos-26`'ya fallback eder                                                                                                                                                                                                                     |

## Runner kayıt bütçesi

OpenClaw'ın mevcut GitHub runner-registration bucket'ı, `ghx api rate_limit` içinde 5 dakikada 10.000 self-hosted
runner registration bildirir. Her tuning geçişinden önce
`actions_runner_registration` değerini yeniden kontrol edin; çünkü GitHub bu bucket'ı değiştirebilir. Limit,
`openclaw` organizasyonundaki tüm Blacksmith runner registration'ları tarafından paylaşılır; bu nedenle başka bir Blacksmith kurulumu eklemek
yeni bir bucket eklemez.

Blacksmith label'larını burst kontrolü için kıt kaynak olarak ele alın. Yalnızca route eden, bildiren, özetleyen, shard seçen veya kısa CodeQL taramaları çalıştıran işler, ölçülmüş Blacksmith'e özgü ihtiyaçları yoksa GitHub-hosted runner'larda kalmalıdır. Her yeni Blacksmith matrisi, daha büyük `max-parallel` veya yüksek frekanslı workflow en kötü durum registration sayısını göstermeli ve organizasyon düzeyi hedefi canlı bucket'ın yaklaşık %60'ının altında tutmalıdır. Mevcut 10.000-registration bucket ile bu, eşzamanlı depolar, retry'lar ve burst çakışması için boşluk bırakarak 6.000-registration işletim hedefi anlamına gelir.

Canonical-repo CI, normal push ve pull-request çalıştırmaları için varsayılan runner yolu olarak Blacksmith'i korur. `workflow_dispatch` ve canonical olmayan depo çalıştırmaları GitHub-hosted runner'ları kullanır, ancak normal canonical çalıştırmalar şu anda Blacksmith queue sağlığını probe etmez veya Blacksmith kullanılamadığında otomatik olarak GitHub-hosted label'lara fallback etmez.

## Yerel eşdeğerler

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw Performansı

`OpenClaw Performance`, ürün/çalışma zamanı performans iş akışıdır. Her gün `main` üzerinde çalışır ve elle de başlatılabilir:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Elle başlatma normalde iş akışı ref'ini benchmark eder. Bir sürüm etiketini veya başka bir dalı mevcut iş akışı uygulamasıyla benchmark etmek için `target_ref` değerini ayarlayın. Yayımlanan rapor yolları ve en son işaretçiler test edilen ref'e göre anahtarlanır ve her `index.md` test edilen ref/SHA'yı, iş akışı ref/SHA'sını, Kova ref'ini, profili, lane auth modunu, modeli, tekrar sayısını ve senaryo filtrelerini kaydeder.

İş akışı OCM'yi sabitlenmiş bir sürümden ve Kova'yı sabitlenmiş `kova_ref` girdisindeki `openclaw/Kova` deposundan kurar, ardından üç lane çalıştırır:

- `mock-provider`: Deterministik sahte OpenAI uyumlu auth ile yerel derleme çalışma zamanına karşı Kova tanılama senaryoları.
- `mock-deep-profile`: Başlatma, gateway ve agent-turn sıcak noktaları için CPU/heap/trace profillemesi.
- `live-openai-candidate`: Gerçek bir OpenAI `openai/gpt-5.5` agent turn; `OPENAI_API_KEY` yoksa atlanır.

mock-provider lane'i ayrıca Kova geçişinden sonra OpenClaw yerel kaynak problarını çalıştırır: varsayılan, hook ve 50-plugin başlatma durumlarında gateway açılış zamanlaması ve bellek; bundled plugin içe aktarma RSS'i, tekrarlanan mock-OpenAI `channel-chat-baseline` merhaba döngüleri, başlatılmış gateway'e karşı CLI başlatma komutları ve SQLite durum smoke performans probu. Test edilen ref için önceki yayımlanmış mock-provider kaynak raporu mevcut olduğunda, kaynak özeti mevcut RSS ve heap değerlerini bu taban çizgiyle karşılaştırır ve büyük RSS artışlarını `watch` olarak işaretler. Kaynak probu Markdown özeti rapor paketinde `source/index.md` konumunda, ham JSON ise yanında bulunur.

Her lane GitHub artifact'leri yükler. `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında, iş akışı ayrıca `report.json`, `report.md`, paketleri, `index.md` dosyasını ve kaynak-prob artifact'lerini `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` altında `openclaw/clawgrit-reports` deposuna commit eder. Geçerli test edilmiş ref işaretçisi `openclaw-performance/<tested-ref>/latest-<lane>.json` olarak yazılır.

## Tam Sürüm Doğrulaması

`Full Release Validation`, "sürümden önce her şeyi çalıştır" için elle kullanılan şemsiye iş akışıdır. Bir dalı, etiketi veya tam commit SHA'sını kabul eder; elle kullanılan `CI` iş akışını bu hedefle başlatır, yalnızca sürüme özel Plugin/paket/statik/Docker kanıtı için `Plugin Prerelease` iş akışını başlatır ve kurulum smoke, paket kabulü, çapraz işletim sistemi paket kontrolleri, QA profil kanıtından olgunluk puan kartı oluşturma, QA Lab eşliği, Matrix ve Telegram lane'leri için `OpenClaw Release Checks` iş akışını başlatır. Stable ve full profilleri her zaman kapsamlı live/E2E ve Docker sürüm yolu soak kapsamını içerir; beta profili `run_release_soak=true` ile buna dahil olabilir. Kanonik paket Telegram E2E'si Package Acceptance içinde çalışır, bu nedenle tam aday yinelenen bir canlı poller başlatmaz. Yayımlamadan sonra, yeniden derlemeden release checks, Package Acceptance, Docker, çapraz işletim sistemi ve Telegram genelinde yayımlanmış npm paketini yeniden kullanmak için `release_package_spec` iletin. Yalnızca odaklı bir yayımlanmış paket Telegram yeniden çalıştırması için `npm_telegram_package_spec` kullanın. Codex Plugin canlı paket lane'i varsayılan olarak aynı seçilmiş durumu kullanır: yayımlanmış `release_package_spec=openclaw@<tag>`, `codex_plugin_spec=npm:@openclaw/codex@<tag>` değerini türetir; SHA/artifact çalıştırmaları ise seçilen ref'ten `extensions/codex` paketler. `npm:`, `npm-pack:` veya `git:` spec'leri gibi özel Plugin kaynakları için `codex_plugin_spec` değerini açıkça ayarlayın.

Aşama matrisi, kesin iş akışı job adları, profil farkları, artifact'ler ve odaklı yeniden çalıştırma tanıtıcıları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.

`OpenClaw Release Publish`, elle kullanılan ve değişiklik yapan sürüm iş akışıdır. Sürüm etiketi mevcut olduktan ve OpenClaw npm preflight başarılı olduktan sonra bunu `release/YYYY.M.PATCH` veya `main` üzerinden başlatın. `pnpm plugins:sync:check` komutunu doğrular, yayımlanabilir tüm Plugin paketleri için `Plugin NPM Release` iş akışını başlatır, aynı sürüm SHA'sı için `Plugin ClawHub Release` iş akışını başlatır ve ancak bundan sonra kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` iş akışını başlatır. Stable yayımlama ayrıca tam bir `windows_node_tag` gerektirir; iş akışı Windows kaynak sürümünü doğrular ve herhangi bir yayımlama alt iş akışından önce onun x64/ARM64 kurucularını aday onaylı `windows_node_installer_digests` girdisiyle karşılaştırır, ardından GitHub sürüm taslağını yayımlamadan önce aynı sabitlenmiş kurucu digest'lerini ve tam eşlik eden asset ile checksum sözleşmesini tanıtır ve doğrular.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Hızla değişen bir dalda sabitlenmiş commit kanıtı için `gh workflow run ... --ref main -f ref=<sha>` yerine yardımcıyı kullanın:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub iş akışı başlatma ref'leri ham commit SHA'ları değil, dal veya etiket olmalıdır. Yardımcı, hedef SHA'da geçici bir `release-ci/<sha>-...` dalı push eder, bu sabitlenmiş ref'ten `Full Release Validation` iş akışını başlatır, her alt iş akışının `headSha` değerinin hedefle eşleştiğini doğrular ve çalıştırma tamamlandığında geçici dalı siler. Şemsiye doğrulayıcı, herhangi bir alt iş akışı farklı bir SHA'da çalıştıysa da başarısız olur.

`release_profile`, release checks'e aktarılan live/provider kapsamını kontrol eder. Elle kullanılan sürüm iş akışları varsayılan olarak `stable` kullanır; `full` değerini yalnızca geniş advisory provider/media matrisini özellikle istediğinizde kullanın. Stable ve full release checks her zaman kapsamlı live/E2E ve Docker sürüm yolu soak çalıştırır; beta profili `run_release_soak=true` ile buna dahil olabilir.

- `minimum`, en hızlı OpenAI/çekirdek sürüm açısından kritik lane'leri tutar.
- `stable`, stable provider/backend kümesini ekler.
- `full`, geniş advisory provider/media matrisini çalıştırır.

Şemsiye, başlatılan alt çalıştırma kimliklerini kaydeder ve son `Verify full validation` job'u geçerli alt çalıştırma sonuçlarını yeniden kontrol ederek her alt çalıştırma için en yavaş job tablolarını ekler. Bir alt iş akışı yeniden çalıştırılıp yeşile dönerse, şemsiye sonucunu ve zamanlama özetini yenilemek için yalnızca üst doğrulayıcı job'unu yeniden çalıştırın.

Kurtarma için hem `Full Release Validation` hem de `OpenClaw Release Checks` `rerun_group` kabul eder. Bir sürüm adayı için `all`, yalnızca normal tam CI alt iş akışı için `ci`, yalnızca Plugin prerelease alt iş akışı için `plugin-prerelease`, her sürüm alt iş akışı için `release-checks` veya daha dar bir grup kullanın: şemsiyede `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` veya `npm-telegram`. Bu, odaklı bir düzeltmeden sonra başarısız bir sürüm kutusu yeniden çalıştırmasını sınırlı tutar. Tek bir başarısız çapraz işletim sistemi lane'i için `rerun_group=cross-os` ile `cross_os_suite_filter` değerini birleştirin; örneğin `windows/packaged-upgrade`; uzun çapraz işletim sistemi komutları heartbeat satırları yayar ve packaged-upgrade özetleri faz başına zamanlamaları içerir. QA release-check lane'leri, zorunlu OpenClaw dinamik araçları standart tier özetinden saptığında veya kaybolduğunda bloklayan standart çalışma zamanı araç kapsamı kapısı dışında advisory niteliktedir.

`OpenClaw Release Checks`, seçilen ref'i bir kez `release-package-under-test` tarball'ına çözümlemek için güvenilir iş akışı ref'ini kullanır, ardından bu artifact'i çapraz işletim sistemi kontrollerine ve Package Acceptance'a, ayrıca soak kapsamı çalıştığında live/E2E sürüm yolu Docker iş akışına geçirir. Bu, paket baytlarını sürüm kutuları genelinde tutarlı tutar ve aynı adayın birden fazla alt job'da yeniden paketlenmesini önler. Codex npm-plugin canlı lane'i için release checks, `release_package_spec` değerinden türetilen eşleşen bir yayımlanmış Plugin spec'i geçirir, operatör tarafından sağlanan `codex_plugin_spec` değerini geçirir veya girdiyi boş bırakır; böylece Docker betiği seçilen checkout'ın Codex Plugin'ini paketler.

`ref=main` ve `rerun_group=all` için yinelenen `Full Release Validation` çalıştırmaları eski şemsiyenin yerine geçer. Üst izleyici, üst çalıştırma iptal edildiğinde önceden başlattığı tüm alt iş akışlarını iptal eder; böylece daha yeni main doğrulaması eskimiş iki saatlik bir release-check çalıştırmasının arkasında beklemez. Sürüm dalı/etiket doğrulaması ve odaklı yeniden çalıştırma grupları `cancel-in-progress: false` değerini korur.

## Canlı ve E2E shard'ları

Sürüm live/E2E alt iş akışı geniş yerel `pnpm test:live` kapsamını korur, ancak bunu tek bir seri job yerine `scripts/test-live-shard.mjs` üzerinden adlandırılmış shard'lar olarak çalıştırır:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider filtreli `native-live-src-gateway-profiles` job'ları
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- bölünmüş medya ses/video shard'ları ve provider filtreli müzik shard'ları

Bu, aynı dosya kapsamını korurken yavaş canlı provider hatalarını yeniden çalıştırmayı ve tanılamayı kolaylaştırır. Toplu `native-live-extensions-o-z`, `native-live-extensions-media` ve `native-live-extensions-media-music` shard adları elle tek seferlik yeniden çalıştırmalar için geçerli kalır.

Yerel canlı medya shard'ları, `Live Media Runner Image` iş akışı tarafından oluşturulan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` içinde çalışır. Bu imaj `ffmpeg` ve `ffprobe` araçlarını önceden kurar; medya job'ları kurulumdan önce yalnızca ikili dosyaları doğrular. Docker destekli canlı suite'leri normal Blacksmith runner'larında tutun; container job'ları iç içe Docker testleri başlatmak için yanlış yerdir.

Docker destekli canlı model/arka uç shard'ları, seçilen her commit için ayrı bir paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` imajı kullanır. Canlı sürüm iş akışı bu imajı bir kez derleyip gönderir; ardından Docker canlı model, sağlayıcıya göre shard'lanmış gateway, CLI arka ucu, ACP bind ve Codex harness shard'ları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalışır. Gateway Docker shard'ları, takılmış bir container veya temizleme yolunun tüm release-check bütçesini tüketmek yerine hızlıca başarısız olması için iş akışı job zaman aşımının altında açık script düzeyi `timeout` sınırları taşır. Bu shard'lar tam kaynak Docker hedefini bağımsız olarak yeniden derlerse, sürüm çalıştırması yanlış yapılandırılmıştır ve yinelenen imaj derlemelerinde duvar saati süresi harcar.

## Paket Kabulü

Soru "bu kurulabilir OpenClaw paketi ürün olarak çalışıyor mu?" olduğunda `Package Acceptance` kullanın. Bu normal CI'dan farklıdır: normal CI kaynak ağacını doğrularken, paket kabulü tek bir tarball'ı kullanıcıların kurulum veya güncelleme sonrasında kullandığı aynı Docker E2E harness üzerinden doğrular.

### Job'lar

1. `resolve_package`, `workflow_ref` checkout eder, tek bir paket adayını çözer, `.artifacts/docker-e2e-package/openclaw-current.tgz` yazar, `.artifacts/docker-e2e-package/package-candidate.json` yazar, ikisini de `package-under-test` artifact'ı olarak yükler ve GitHub adım özetinde kaynağı, iş akışı ref'ini, paket ref'ini, sürümü, SHA-256'yı ve profili yazdırır.
2. `docker_acceptance`, `ref=workflow_ref` ve `package_artifact_name=package-under-test` ile `openclaw-live-and-e2e-checks-reusable.yml` çağırır. Yeniden kullanılabilir iş akışı bu artifact'ı indirir, tarball envanterini doğrular, gerektiğinde package-digest Docker imajlarını hazırlar ve seçilen Docker lane'lerini iş akışı checkout'unu paketlemek yerine bu pakete karşı çalıştırır. Bir profil birden çok hedefli `docker_lanes` seçtiğinde, yeniden kullanılabilir iş akışı paketi ve paylaşılan imajları bir kez hazırlar, ardından bu lane'leri benzersiz artifact'lara sahip paralel hedefli Docker job'ları olarak dağıtır.
3. `package_telegram` isteğe bağlı olarak `NPM Telegram Beta E2E` çağırır. `telegram_mode`, `none` olmadığında çalışır ve Package Acceptance bir paket çözdüyse aynı `package-under-test` artifact'ını kurar; bağımsız Telegram dispatch yine yayımlanmış bir npm spec'i kurabilir.
4. `summary`, paket çözümleme, Docker kabulü veya isteğe bağlı Telegram lane'i başarısız olduysa iş akışını başarısız yapar.

### Aday kaynakları

- `source=npm` yalnızca `openclaw@beta`, `openclaw@latest` veya `openclaw@2026.4.27-beta.2` gibi tam bir OpenClaw sürüm versiyonunu kabul eder. Bunu yayımlanmış ön sürüm/kararlı kabulü için kullanın.
- `source=ref`, güvenilir bir `package_ref` branch, tag veya tam commit SHA'sını paketler. Çözücü OpenClaw branch'lerini/tag'lerini fetch eder, seçilen commit'in repository branch geçmişinden veya bir release tag'inden erişilebilir olduğunu doğrular, bağımlılıkları ayrılmış bir worktree içinde kurar ve `scripts/package-openclaw-for-docker.mjs` ile paketler.
- `source=url` herkese açık bir HTTPS `.tgz` indirir; `package_sha256` zorunludur. Bu yol URL kimlik bilgilerini, varsayılan olmayan HTTPS portlarını, özel/dahili/özel kullanımlı host adlarını veya çözümlenen IP'leri ve aynı herkese açık güvenlik politikasının dışına yönlendirmeleri reddeder.
- `source=trusted-url`, `.github/package-trusted-sources.json` içindeki adlandırılmış bir trusted-source politikasından bir HTTPS `.tgz` indirir; `package_sha256` ve `trusted_source_id` zorunludur. Bunu yalnızca yapılandırılmış host'lara, portlara, yol prefix'lerine, yönlendirme host'larına veya private-network çözümlemesine ihtiyaç duyan maintainer sahipli kurumsal mirror'lar ya da özel paket repository'leri için kullanın. Politika bearer auth bildirirse, iş akışı sabit `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret'ını kullanır; URL içine gömülü kimlik bilgileri yine reddedilir.
- `source=artifact`, `artifact_run_id` ve `artifact_name` içinden bir `.tgz` indirir; `package_sha256` isteğe bağlıdır ama dışarıyla paylaşılan artifact'lar için sağlanmalıdır.

`workflow_ref` ve `package_ref` değerlerini ayrı tutun. `workflow_ref`, testi çalıştıran güvenilir iş akışı/harness kodudur. `package_ref`, `source=ref` olduğunda paketlenen kaynak commit'tir. Bu, güncel test harness'inin eski iş akışı mantığını çalıştırmadan daha eski güvenilir kaynak commit'lerini doğrulamasını sağlar.

### Suite profilleri

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` artı `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI ile tam Docker release-path parçaları
- `custom` — tam `docker_lanes`; `suite_profile=custom` olduğunda zorunludur

`package` profili offline plugin kapsamı kullanır, böylece yayımlanmış paket doğrulaması canlı ClawHub kullanılabilirliğine bağlı olmaz. İsteğe bağlı Telegram lane'i `NPM Telegram Beta E2E` içinde `package-under-test` artifact'ını yeniden kullanır; yayımlanmış npm spec yolu bağımsız dispatch'ler için korunur.

Yerel komutlar, Docker lane'leri, Package Acceptance girdileri, sürüm varsayılanları ve hata triage'ı dahil olmak üzere özel güncelleme ve plugin test politikası için [Güncellemeleri ve plugin'leri test etme](/tr/help/testing-updates-plugins) bölümüne bakın.

Sürüm kontrolleri Package Acceptance'ı `source=artifact`, hazırlanmış sürüm paketi artifact'ı, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` ve `telegram_mode=mock-openai` ile çağırır. Bu, paket migrasyonunu, güncellemeyi, canlı ClawHub skill kurulumunu, eski-plugin-bağımlılığı temizliğini, yapılandırılmış-plugin kurulum onarımını, offline plugin'i, plugin-update'i ve Telegram kanıtını aynı çözümlenmiş paket tarball'ında tutar. Bir beta yayımlandıktan sonra aynı matrisi yeniden derlemeden gönderilmiş npm paketine karşı çalıştırmak için Full Release Validation veya OpenClaw Release Checks üzerinde `release_package_spec` ayarlayın; `package_acceptance_package_spec` değerini yalnızca Package Acceptance, sürüm doğrulamasının geri kalanından farklı bir pakete ihtiyaç duyduğunda ayarlayın. Cross-OS sürüm kontrolleri OS'e özgü onboarding, installer ve platform davranışını hâlâ kapsar; paket/güncelleme ürün doğrulaması Package Acceptance ile başlamalıdır. `published-upgrade-survivor` Docker lane'i engelleyici release path'te her çalıştırma için bir yayımlanmış paket baseline'ını doğrular. Package Acceptance içinde çözümlenen `package-under-test` tarball'ı her zaman adaydır ve `published_upgrade_survivor_baseline` fallback yayımlanmış baseline'ı seçer; varsayılanı `openclaw@latest` olur; başarısız-lane yeniden çalıştırma komutları bu baseline'ı korur. `run_release_soak=true` veya `release_profile=full` ile Full Release Validation, en son dört kararlı npm sürümü artı sabitlenmiş plugin-uyumluluk sınır sürümleri ve Feishu config, korunmuş bootstrap/persona dosyaları, yapılandırılmış OpenClaw plugin kurulumları, tilde log yolları ve eski legacy plugin bağımlılık kökleri için issue biçimli fixture'lar arasında genişletmek üzere `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` ve `published_upgrade_survivor_scenarios=reported-issues` ayarlar. Çoklu-baseline published-upgrade survivor seçimleri baseline'a göre ayrı hedefli Docker runner job'larına shard'lanır. Ayrı `Update Migration` iş akışı, soru normal Full Release CI genişliği değil de yayımlanmış güncelleme temizliğinin kapsamlılığı olduğunda `all-since-2026.4.23` ve `plugin-deps-cleanup` ile `update-migration` Docker lane'ini kullanır. Yerel toplu çalıştırmalar `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile tam paket spec'leri geçebilir, `openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile tek bir lane tutabilir veya senaryo matrisi için `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ayarlayabilir. Yayımlanmış lane, baseline'ı gömülü bir `openclaw config set` komut reçetesiyle yapılandırır, reçete adımlarını `summary.json` içine kaydeder ve Gateway başlatıldıktan sonra `/healthz`, `/readyz` ve RPC durumunu yoklar. Windows paketlenmiş ve installer fresh lane'leri ayrıca kurulmuş bir paketin raw mutlak Windows yolundan browser-control override import edebildiğini doğrular. OpenAI cross-OS agent-turn smoke, ayarlandığında varsayılan olarak `OPENCLAW_CROSS_OS_OPENAI_MODEL` değerini, aksi halde `openai/gpt-5.5` değerini kullanır; böylece kurulum ve gateway kanıtı GPT-4.x varsayılanlarından kaçınırken GPT-5 test modelinde kalır.

### Legacy uyumluluk pencereleri

Package Acceptance, zaten yayımlanmış paketler için sınırlı legacy-uyumluluk pencerelerine sahiptir. `2026.4.25` dahil, `2026.4.25-beta.*` dahil paketler uyumluluk yolunu kullanabilir:

- `dist/postinstall-inventory.json` içindeki bilinen özel QA girdileri tarball'da atlanmış dosyalara işaret edebilir;
- paket bu flag'i sunmuyorsa `doctor-switch`, `gateway install --wrapper` kalıcılık alt durumunu atlayabilir;
- `update-channel-switch`, tarball'dan türetilmiş sahte git fixture'ından eksik pnpm `patchedDependencies` öğelerini budayabilir ve eksik kalıcı `update.channel` loglayabilir;
- plugin smoke'ları legacy install-record konumlarını okuyabilir veya eksik marketplace install-record kalıcılığını kabul edebilir;
- `plugin-update`, install record ve no-reinstall davranışının değişmeden kalmasını hâlâ gerektirirken config metadata migrasyonuna izin verebilir.

Yayımlanmış `2026.4.26` paketi, zaten gönderilmiş yerel build metadata stamp dosyaları için de uyarı verebilir. Daha sonraki paketler modern sözleşmeleri karşılamalıdır; aynı koşullar uyarı veya atlama yerine başarısız olur.

### Örnekler

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Başarısız bir paket kabulü çalıştırmasında hata ayıklarken, paket kaynağını, sürümünü ve SHA-256 değerini doğrulamak için `resolve_package` özetinden başlayın. Ardından `docker_acceptance` alt çalıştırmasını ve Docker artifact'larını inceleyin: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logları, aşama süreleri ve yeniden çalıştırma komutları. Tam sürüm doğrulamasını yeniden çalıştırmak yerine başarısız paket profilini veya tam Docker lane'lerini yeniden çalıştırmayı tercih edin.

## Kurulum smoke'u

Ayrı `Install Smoke` iş akışı, aynı kapsam script'ini kendi `preflight` job'ı üzerinden yeniden kullanır. Smoke kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak böler.

- **Hızlı yol**, Docker/paket yüzeylerine, paketlenmiş Plugin paket/manifest değişikliklerine veya Docker smoke işlerinin çalıştırdığı çekirdek Plugin/kanal/Gateway/Plugin SDK yüzeylerine dokunan pull request'ler için çalışır. Yalnızca kaynak kodu içeren paketlenmiş Plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca dokümantasyon düzenlemeleri Docker worker'larını ayırmaz. Hızlı yol, kök Dockerfile imajını bir kez derler, CLI'yi denetler, agents delete shared-workspace CLI smoke'u çalıştırır, container gateway-network e2e'yi çalıştırır, paketlenmiş bir uzantı derleme argümanını doğrular ve sınırlı paketlenmiş-Plugin Docker profilini 240 saniyelik toplu komut zaman aşımı altında çalıştırır (her senaryonun Docker çalıştırması ayrı ayrı sınırlandırılır).
- **Tam yol**, QR paket kurulumu ve installer Docker/güncelleme kapsamını gece zamanlanmış çalıştırmalar, manuel dispatch'ler, workflow-call sürüm denetimleri ve gerçekten installer/paket/Docker yüzeylerine dokunan pull request'ler için saklar. Tam modda install-smoke, bir hedef-SHA GHCR kök Dockerfile smoke imajını hazırlar veya yeniden kullanır; ardından QR paket kurulumunu, kök Dockerfile/Gateway smoke'larını, installer/güncelleme smoke'larını ve hızlı paketlenmiş-Plugin Docker E2E'yi ayrı işler olarak çalıştırır; böylece installer işi kök imaj smoke'larının arkasında beklemez.

`main` push'ları (merge commit'leri dahil) tam yolu zorunlu kılmaz; değişen-kapsam mantığı bir push için tam kapsam istediğinde, workflow hızlı Docker smoke'u korur ve tam install smoke'u gece veya sürüm doğrulamasına bırakır.

Yavaş Bun global install image-provider smoke'u ayrıca `run_bun_global_install_smoke` ile kapılanır. Gece zamanlamasında ve sürüm denetimleri workflow'undan çalışır; manuel `Install Smoke` dispatch'leri buna dahil olmayı seçebilir, ancak pull request'ler ve `main` push'ları çalıştırmaz. Normal PR CI yine de Node ile ilgili değişiklikler için hızlı Bun başlatıcı regresyon hattını çalıştırır. QR ve installer Docker testleri kendi kurulum odaklı Dockerfile'larını korur.

## Yerel Docker E2E

`pnpm test:docker:all` tek bir paylaşılan canlı test imajını önceden derler, OpenClaw'ı bir npm tarball'ı olarak bir kez paketler ve iki paylaşılan `scripts/e2e/Dockerfile` imajı derler:

- installer/güncelleme/Plugin bağımlılığı hatları için yalın bir Node/Git runner;
- normal işlevsellik hatları için aynı tarball'ı `/app` içine kuran işlevsel bir imaj.

Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde, planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur ve runner yalnızca seçilen planı yürütür. Zamanlayıcı, hat başına imajı `OPENCLAW_DOCKER_E2E_BARE_IMAGE` ve `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` ile seçer, ardından hatları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır.

### Ayarlanabilirler

| Değişken                               | Varsayılan | Amaç                                                                                         |
| -------------------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | Normal hatlar için ana havuz slot sayısı.                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | Provider'a duyarlı kuyruk havuzu slot sayısı.                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | Provider'ların kısıtlama uygulamaması için eşzamanlı canlı hat sınırı.                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5          | Eşzamanlı npm kurulum hattı sınırı.                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | Eşzamanlı çok servisli hat sınırı.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker daemon oluşturma fırtınalarını önlemek için hat başlangıçları arasındaki gecikme; gecikme olmaması için `0` ayarlayın. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | Hat başına yedek zaman aşımı (120 dakika); seçilen canlı/kuyruk hatları daha sıkı sınırlar kullanır. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | ayarlanmamış | `1`, hatları çalıştırmadan zamanlayıcı planını yazdırır.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | ayarlanmamış | Virgülle ayrılmış kesin hat listesi; agent'ların başarısız olan tek bir hattı yeniden üretebilmesi için cleanup smoke'u atlar. |

Etkili sınırından daha ağır bir hat, boş bir havuzdan yine de başlayabilir ve kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel toplu çalışma Docker ön denetimlerini yapar, eski OpenClaw E2E container'larını kaldırır, etkin hat durumunu yayımlar, en uzundan en kısaya sıralama için hat zamanlamalarını kalıcılaştırır ve varsayılan olarak ilk hatadan sonra yeni havuzlanmış hatları zamanlamayı durdurur.

### Yeniden kullanılabilir canlı/E2E workflow

Yeniden kullanılabilir canlı/E2E workflow, hangi paket, imaj türü, canlı imaj, hat ve kimlik bilgisi kapsamının gerektiğini `scripts/test-docker-all.mjs --plan-json` komutuna sorar. Ardından `scripts/docker-e2e.mjs` bu planı GitHub çıktılarına ve özetlerine dönüştürür. OpenClaw'ı `scripts/package-openclaw-for-docker.mjs` üzerinden paketler, mevcut çalıştırmadan bir paket artifact'i indirir veya `package_artifact_run_id` içinden bir paket artifact'i indirir; tarball envanterini doğrular; plan paket kurulmuş hatlara ihtiyaç duyduğunda Blacksmith'in Docker katman önbelleği üzerinden paket-özet-etiketli yalın/işlevsel GHCR Docker E2E imajlarını derleyip push'lar; ve yeniden derlemek yerine sağlanan `docker_e2e_bare_image`/`docker_e2e_functional_image` girdilerini veya mevcut paket-özet imajlarını yeniden kullanır. Docker imaj çekmeleri, takılmış bir registry/önbellek akışının CI kritik yolunun çoğunu tüketmek yerine hızla yeniden denenmesi için her deneme başına sınırlı 180 saniyelik zaman aşımıyla yeniden denenir.

### Sürüm yolu parçaları

Sürüm Docker kapsamı, `OPENCLAW_SKIP_DOCKER_BUILD=1` ile daha küçük parçalı işlerde çalışır; böylece her parça yalnızca ihtiyaç duyduğu imaj türünü çeker ve aynı ağırlıklı zamanlayıcı üzerinden birden fazla hattı yürütür:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Geçerli sürüm Docker parçaları `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` ve `plugins-runtime-install-a` ile `plugins-runtime-install-h` arasındakilerdir. `package-update-openai`, aday OpenClaw paketini kuran, Codex Plugin'ini `codex_plugin_spec` içinden veya açık Codex CLI kurulum onayıyla aynı ref tarball'ından kuran, Codex CLI ön denetimini çalıştıran ve ardından OpenAI karşısında aynı oturumda birden fazla OpenClaw agent turu çalıştıran canlı Codex Plugin paket hattını içerir. `plugins-runtime-core`, `plugins-runtime` ve `plugins-integrations` toplu Plugin/runtime alias'ları olarak kalır. `install-e2e` hat alias'ı, her iki provider installer hattı için toplu manuel yeniden çalıştırma alias'ı olarak kalır.

OpenWebUI, tam sürüm yolu kapsamı istediğinde `plugins-runtime-services` içine katlanır ve yalnızca OpenWebUI'a özel dispatch'ler için bağımsız bir `openwebui` parçası tutar. Paketlenmiş kanal güncelleme hatları, geçici npm ağ hataları için bir kez yeniden dener.

Her parça, hat günlükleri, zamanlamalar, `summary.json`, `failures.json`, aşama zamanlamaları, zamanlayıcı plan JSON'u, yavaş hat tabloları ve hat başına yeniden çalıştırma komutlarıyla birlikte `.artifacts/docker-tests/` yükler. Workflow `docker_lanes` girdisi, parça işleri yerine hazırlanan imajlara karşı seçili hatları çalıştırır; bu, başarısız hat hata ayıklamasını tek bir hedefli Docker işiyle sınırlı tutar ve o çalıştırma için paket artifact'ini hazırlar, indirir veya yeniden kullanır; seçili hat canlı bir Docker hattıysa hedefli iş, o yeniden çalıştırma için canlı test imajını yerel olarak derler. Üretilen hat başına GitHub yeniden çalıştırma komutları, bu değerler mevcut olduğunda `package_artifact_run_id`, `package_artifact_name` ve hazırlanmış imaj girdilerini içerir; böylece başarısız bir hat, başarısız çalıştırmadaki tam paketi ve imajları yeniden kullanabilir.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zamanlanmış canlı/E2E workflow, tam sürüm yolu Docker paketini günlük olarak çalıştırır.

## Plugin Ön Sürümü

`Plugin Prerelease` daha pahalı ürün/paket kapsamıdır; bu yüzden `Full Release Validation` tarafından veya açık bir operatör tarafından dispatch edilen ayrı bir workflow'dur. Normal pull request'ler, `main` push'ları ve bağımsız manuel CI dispatch'leri bu paketi kapalı tutar. Paketlenmiş Plugin testlerini sekiz uzantı worker'ı arasında dengeler; bu uzantı shard işleri, içe aktarma ağırlıklı Plugin toplu işlerinin ek CI işleri oluşturmaması için grup başına bir Vitest worker ve daha büyük Node heap ile aynı anda en fazla iki Plugin yapılandırma grubunu çalıştırır. Yalnızca sürüme özel Docker ön sürüm yolu, bir-üç dakikalık işler için onlarca runner ayırmamak adına hedefli Docker hatlarını küçük gruplar halinde toplar. Workflow ayrıca `@openclaw/plugin-inspector` içinden bilgilendirici bir `plugin-inspector-advisory` artifact'i yükler; inspector bulguları triage girdisidir ve engelleyici Plugin Prerelease kapısını değiştirmez.

## QA Lab

QA Lab, ana akıllı-kapsamlı workflow'un dışında özel CI hatlarına sahiptir. Agentic eşdeğerlik, bağımsız bir PR workflow'u değil, geniş QA ve sürüm harness'larının altında iç içedir. Eşdeğerlik geniş bir doğrulama çalıştırmasıyla birlikte ilerlemeliyse `rerun_group=qa-parity` ile `Full Release Validation` kullanın.

- `QA-Lab - All Lanes` workflow'u her gece `main` üzerinde ve manuel dispatch ile çalışır; mock eşdeğerlik hattını, canlı Matrix hattını ve canlı Telegram ile Discord hatlarını paralel işler olarak dağıtır. Canlı işler `qa-live-shared` ortamını kullanır, Telegram/Discord ise Convex lease'lerini kullanır.

Sürüm denetimleri, Matrix ve Telegram canlı taşıma hatlarını deterministik mock provider ve mock nitelikli modellerle (`mock-openai/gpt-5.5` ve `mock-openai/gpt-5.5-alt`) çalıştırır; böylece kanal kontratı canlı model gecikmesinden ve normal provider-Plugin başlangıcından izole edilir. Canlı taşıma Gateway'i bellek aramasını devre dışı bırakır çünkü QA eşdeğerliği bellek davranışını ayrı olarak kapsar; provider bağlantısı ayrı canlı model, yerel provider ve Docker provider paketleri tarafından kapsanır.

Matrix, zamanlanmış ve sürüm kapıları için `--profile fast` kullanır; yalnızca checkout edilen CLI desteklediğinde `--fail-fast` ekler. CLI varsayılanı ve manuel workflow girdisi `all` olarak kalır; manuel `matrix_profile=all` dispatch'i tam Matrix kapsamını her zaman `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine shard'lar.

`OpenClaw Release Checks`, sürüm onayından önce sürüm açısından kritik QA Lab hatlarını da çalıştırır; QA eşdeğerlik kapısı aday ve baseline paketlerini paralel hat işleri olarak çalıştırır, ardından son eşdeğerlik karşılaştırması için iki artifact'i de küçük bir rapor işine indirir.

Normal PR'lar için eşdeğerliği zorunlu bir durum olarak görmek yerine kapsamlı CI/denetim kanıtını izleyin.

## CodeQL

`CodeQL` workflow'u kasıtlı olarak dar kapsamlı bir ilk geçiş güvenlik tarayıcısıdır; tam repository taraması değildir. Günlük, manuel ve taslak olmayan pull request koruma çalıştırmaları, Actions workflow kodunu ve en yüksek riskli JavaScript/TypeScript yüzeylerini yüksek/kritik `security-severity` ile filtrelenmiş yüksek güvenilirlikli güvenlik sorgularıyla tarar.

Pull request koruması hafif kalır: yalnızca `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` veya süreç sahibi paketlenmiş Plugin runtime yolları altındaki değişiklikler için başlar ve zamanlanmış workflow ile aynı yüksek güvenilirlikli güvenlik matrisini çalıştırır. Android ve macOS CodeQL, PR varsayılanlarının dışında kalır.

### Güvenlik kategorileri

| Kategori                                          | Yüzey                                                                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, gizli bilgiler, sandbox, cron ve gateway temel çizgisi                                                                        |
| `/codeql-security-high/channel-runtime-boundary`  | Çekirdek kanal uygulama sözleşmeleri ile kanal plugin çalışma zamanı, gateway, Plugin SDK, gizli bilgiler, denetim temas noktaları  |
| `/codeql-security-high/network-ssrf-boundary`     | Çekirdek SSRF, IP ayrıştırma, ağ koruması, web-fetch ve Plugin SDK SSRF ilke yüzeyleri                                              |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP sunucuları, süreç yürütme yardımcıları, dışa teslim ve ajan araç yürütme kapıları                                               |
| `/codeql-security-high/process-exec-boundary`     | Yerel shell, süreç başlatma yardımcıları, alt süreç sahibi paketlenmiş plugin çalışma zamanları ve iş akışı betik bağlantısı        |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin kurulumu, loader, manifest, registry, package-manager kurulumu, kaynak yükleme ve Plugin SDK paket sözleşmesi güven yüzeyleri |

### Platforma özgü güvenlik parçaları

- `CodeQL Android Critical Security` — zamanlanmış Android güvenlik parçası. İş akışı sağlama denetiminin kabul ettiği en küçük Blacksmith Linux runner üzerinde CodeQL için Android uygulamasını elle derler. `/codeql-critical-security/android` altında yükler.
- `CodeQL macOS Critical Security` — haftalık/elle macOS güvenlik parçası. Blacksmith macOS üzerinde CodeQL için macOS uygulamasını elle derler, bağımlılık derleme sonuçlarını yüklenen SARIF dışına filtreler ve `/codeql-critical-security/macos` altında yükler. Temiz olduğunda bile macOS derlemesi çalışma süresine baskın geldiği için günlük varsayılanların dışında tutulur.

### Kritik Kalite kategorileri

`CodeQL Critical Quality`, buna karşılık gelen güvenlik dışı parçadır. Kalite taramalarının Blacksmith runner kayıt bütçesini harcamaması için GitHub tarafından barındırılan Linux runner'larda, dar ve yüksek değerli yüzeyler üzerinde yalnızca hata önem dereceli, güvenlik dışı JavaScript/TypeScript kalite sorgularını çalıştırır. Pull request koruması, zamanlanmış profilden bilinçli olarak daha küçüktür: taslak olmayan PR'lar yalnızca ajan komut/model/araç yürütme ve yanıt dağıtım kodu, config şeması/migration/IO kodu, auth/gizli bilgiler/sandbox/güvenlik kodu, çekirdek kanal ve paketlenmiş kanal plugin çalışma zamanı, gateway protokol/sunucu-yöntemi, bellek çalışma zamanı/SDK bağlantısı, MCP/süreç/dışa teslim, sağlayıcı çalışma zamanı/model kataloğu, oturum tanılama/teslim kuyrukları, plugin loader, Plugin SDK/paket sözleşmesi veya Plugin SDK yanıt çalışma zamanı değişiklikleri için eşleşen `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` ve `plugin-sdk-reply-runtime` parçalarını çalıştırır. CodeQL config ve kalite iş akışı değişiklikleri on iki PR kalite parçasının tamamını çalıştırır.

Elle dispatch şunları kabul eder:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Dar profiller, tek bir kalite parçasını yalıtılmış olarak çalıştırmaya yönelik öğretim/iterasyon kancalarıdır.

| Kategori                                                | Yüzey                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, gizli bilgiler, sandbox, cron ve gateway güvenlik sınırı kodu                                                                                             |
| `/codeql-critical-quality/config-boundary`              | Config şeması, migration, normalizasyon ve IO sözleşmeleri                                                                                                      |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protokol şemaları ve sunucu yöntemi sözleşmeleri                                                                                                        |
| `/codeql-critical-quality/channel-runtime-boundary`     | Çekirdek kanal ve paketlenmiş kanal plugin uygulama sözleşmeleri                                                                                                |
| `/codeql-critical-quality/agent-runtime-boundary`       | Komut yürütme, model/sağlayıcı dispatch, otomatik yanıt dispatch ve kuyruklar ile ACP kontrol düzlemi çalışma zamanı sözleşmeleri                              |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP sunucuları ve araç köprüleri, süreç gözetim yardımcıları ve dışa teslim sözleşmeleri                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Bellek host SDK'sı, bellek çalışma zamanı facade'leri, bellek Plugin SDK alias'ları, bellek çalışma zamanı etkinleştirme bağlantısı ve bellek doctor komutları |
| `/codeql-critical-quality/session-diagnostics-boundary` | Yanıt kuyruğu iç yapıları, oturum teslim kuyrukları, dışa oturum bağlama/teslim yardımcıları, tanılama olayı/günlük paketi yüzeyleri ve oturum doctor CLI sözleşmeleri |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK gelen yanıt dispatch, yanıt payload/parçalama/çalışma zamanı yardımcıları, kanal yanıt seçenekleri, teslim kuyrukları ve oturum/thread bağlama yardımcıları |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model kataloğu normalizasyonu, sağlayıcı auth ve keşfi, sağlayıcı çalışma zamanı kaydı, sağlayıcı varsayılanları/katalogları ve web/search/fetch/embedding registry'leri |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap, yerel kalıcılık, gateway kontrol akışları ve görev kontrol düzlemi çalışma zamanı sözleşmeleri                                            |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Çekirdek web fetch/search, medya IO, medya anlama, image-generation ve media-generation çalışma zamanı sözleşmeleri                                              |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, public-surface ve Plugin SDK entrypoint sözleşmeleri                                                                                          |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Yayımlanmış paket tarafı Plugin SDK kaynağı ve plugin paket sözleşmesi yardımcıları                                                                             |

Kalite, güvenlikten ayrı kalır; böylece kalite bulguları güvenlik sinyalini gölgelemeden zamanlanabilir, ölçülebilir, devre dışı bırakılabilir veya genişletilebilir. Swift, Python ve paketlenmiş plugin CodeQL genişletmesi, yalnızca dar profiller kararlı çalışma zamanı ve sinyal elde ettikten sonra kapsamlı veya parçalı takip işi olarak geri eklenmelidir.

## Bakım iş akışları

### Docs Agent

`Docs Agent` iş akışı, mevcut dokümanları yakın zamanda gelen değişikliklerle uyumlu tutmak için olay güdümlü bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerindeki başarılı bir bot dışı push CI çalışması onu tetikleyebilir ve elle dispatch doğrudan çalıştırabilir. Workflow-run çağrıları, `main` ilerlediyse veya son bir saat içinde atlanmamış başka bir Docs Agent çalışması oluşturulduysa atlanır. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından geçerli `main` durumuna kadar olan commit aralığını gözden geçirir; böylece saatlik tek bir çalışma, son doküman geçişinden beri biriken tüm main değişikliklerini kapsayabilir.

### Test Performance Agent

`Test Performance Agent` iş akışı, yavaş testler için olay güdümlü bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerindeki başarılı bir bot dışı push CI çalışması onu tetikleyebilir, ancak başka bir workflow-run çağrısı o UTC gününde zaten çalıştıysa veya çalışıyorsa atlanır. Elle dispatch bu günlük etkinlik kapısını atlar. Hat, tam-suite gruplanmış Vitest performans raporu oluşturur, Codex'in geniş refactor'lar yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, ardından tam-suite raporu yeniden çalıştırır ve geçen temel test sayısını azaltan değişiklikleri reddeder. Gruplanmış rapor, Linux ve macOS üzerinde config başına duvar süresini ve maksimum RSS'i kaydeder; böylece önce/sonra karşılaştırması süre deltalarının yanında test bellek deltalarını da ortaya çıkarır. Temel çizgide başarısız testler varsa Codex yalnızca bariz hataları düzeltebilir ve agent sonrası tam-suite raporu herhangi bir şey commit edilmeden önce geçmelidir. Bot push'u ulaşmadan önce `main` ilerlediğinde hat doğrulanmış yamayı rebase eder, `pnpm check:changed` komutunu yeniden çalıştırır ve push'u yeniden dener; çakışan bayat yamalar atlanır. GitHub-hosted Ubuntu kullanır; böylece Codex action, docs agent ile aynı drop-sudo güvenlik duruşunu koruyabilir.

### Merge Sonrası Yinelenen PR'lar

`Duplicate PRs After Merge` iş akışı, land sonrası yinelenenleri temizlemek için elle çalıştırılan bir maintainer iş akışıdır. Varsayılanı dry-run'dır ve yalnızca `apply=true` olduğunda açıkça listelenen PR'ları kapatır. GitHub üzerinde değişiklik yapmadan önce, land edilen PR'ın merge edildiğini ve her yinelemenin ya paylaşılan referanslı bir issue'ya ya da örtüşen değişmiş hunk'lara sahip olduğunu doğrular.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Yerel denetim kapıları ve değişiklik yönlendirmesi

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde bulunur ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel denetim kapısı, mimari sınırlar konusunda geniş CI platform kapsamından daha katıdır:

- çekirdek prodüksiyon değişiklikleri core prod ve core test typecheck ile core lint/guard'ları çalıştırır;
- yalnızca çekirdek test değişiklikleri yalnızca core test typecheck ile core lint çalıştırır;
- extension prodüksiyon değişiklikleri extension prod ve extension test typecheck ile extension lint çalıştırır;
- yalnızca extension test değişiklikleri extension test typecheck ile extension lint çalıştırır;
- public Plugin SDK veya plugin-contract değişiklikleri extension typecheck'e genişler, çünkü extension'lar bu çekirdek sözleşmelere bağlıdır (Vitest extension sweep'leri açık test işi olarak kalır);
- yalnızca release metadata version bump'ları hedefli version/config/root-dependency denetimleri çalıştırır;
- bilinmeyen root/config değişiklikleri tüm denetim hatlarına fail safe yapar.

Yerel changed-test yönlendirmesi `scripts/test-projects.test-support.mjs` içinde bulunur ve bilinçli olarak `check:changed` komutundan daha ucuzdur: doğrudan test düzenlemeleri kendilerini çalıştırır, kaynak düzenlemeleri önce açık eşlemeleri, ardından sibling testleri ve import-graph bağımlılarını tercih eder. Paylaşılan grup odası teslim config'i açık eşlemelerden biridir: grup görünür yanıt config'i, kaynak yanıt teslim modu veya message-tool sistem prompt'undaki değişiklikler, çekirdek yanıt testleri ile Discord ve Slack teslim regresyonları üzerinden yönlendirilir; böylece paylaşılan varsayılan değişikliği ilk PR push'undan önce başarısız olur. Ucuz eşlenmiş setin güvenilir bir temsilci olmadığı kadar harness genelinde bir değişiklik olduğunda yalnızca `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanın.

## Testbox doğrulaması

Crabbox, bakımcı Linux kanıtı için repo tarafından sahip olunan uzak kutu sarmalayıcısıdır. Bir kontrol yerel düzenleme döngüsü için fazla geniş olduğunda, CI eşdeğerliği önemli olduğunda veya kanıtın secret'lara, Docker'a, paket hatlarına, yeniden kullanılabilir kutulara ya da uzak günlüklere ihtiyaç duyduğu durumlarda repo kökünden kullanın. Normal OpenClaw backend'i `blacksmith-testbox`'tır; sahip olunan AWS/Hetzner kapasitesi, Blacksmith kesintileri, kota sorunları veya açıkça sahip olunan kapasite testi için bir geri dönüş yoludur.

Crabbox destekli Blacksmith çalıştırmaları tek kullanımlık Testbox'ları ısıtır, talep eder, eşitler, çalıştırır, raporlar ve temizler. Yerleşik eşitleme sağlama kontrolü, `pnpm-lock.yaml` gibi gerekli kök dosyalar kaybolduğunda veya `git status --short` en az 200 izlenen silme gösterdiğinde hızlı başarısız olur. Kasıtlı büyük silme PR'ları için uzak komutta `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` ayarlayın.

Crabbox ayrıca eşitleme aşamasında beş dakikadan uzun süre eşitleme sonrası çıktı olmadan kalan yerel bir Blacksmith CLI çağrısını sonlandırır. Bu korumayı devre dışı bırakmak için `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` ayarlayın veya alışılmadık derecede büyük yerel diff'ler için daha büyük bir milisaniye değeri kullanın.

İlk çalıştırmadan önce sarmalayıcıyı repo kökünden kontrol edin:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Repo sarmalayıcısı, `blacksmith-testbox` duyurmayan eski bir Crabbox ikilisini reddeder. `.crabbox.yaml` sahip olunan bulut varsayılanlarına sahip olsa bile sağlayıcıyı açıkça iletin. Codex worktree'lerinde veya bağlı/seyrek checkout'larda yerel `pnpm crabbox:run` betiğinden kaçının, çünkü pnpm Crabbox başlamadan önce bağımlılıkları uzlaştırabilir; bunun yerine node sarmalayıcısını doğrudan çağırın:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith destekli çalıştırmalar Crabbox 0.22.0 veya daha yenisini gerektirir; böylece sarmalayıcı güncel Testbox eşitleme, kuyruk ve temizleme davranışını alır. Kardeş checkout'u kullanırken zamanlama veya kanıt çalışmasından önce yok sayılan yerel ikiliyi yeniden derleyin:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Değişiklik kapısı:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm check:changed"
```

Odaklı test yeniden çalıştırması:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

Tam paket:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

Son JSON özetini okuyun. Yararlı alanlar `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` ve `totalMs` alanlarıdır. Devredilmiş Blacksmith Testbox çalıştırmaları için Crabbox sarmalayıcı çıkış kodu ve JSON özeti komut sonucudur. Bağlı GitHub Actions çalıştırması hidrasyonu ve keepalive'ı sahiplenir; SSH komutu zaten döndükten sonra Testbox dışarıdan durdurulduğunda `cancelled` olarak bitebilir. Sarmalayıcı `exitCode` sıfır değilse veya komut çıktısı başarısız bir test gösteriyorsa bunun dışında bunu bir temizleme/durum artefaktı olarak değerlendirin. Tek kullanımlık Blacksmith destekli Crabbox çalıştırmaları Testbox'ı otomatik olarak durdurmalıdır; bir çalıştırma kesintiye uğrarsa veya temizleme belirsizse canlı kutuları inceleyin ve yalnızca sizin oluşturduğunuz kutuları durdurun:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Yeniden kullanımı yalnızca aynı hidrate edilmiş kutuda kasıtlı olarak birden çok komuta ihtiyaç duyduğunuzda kullanın:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Bozuk katman Crabbox ise ancak Blacksmith'in kendisi çalışıyorsa doğrudan Blacksmith'i yalnızca `list`, `status` ve temizleme gibi tanılamalar için kullanın. Doğrudan Blacksmith çalıştırmasını bakımcı kanıtı olarak değerlendirmeden önce Crabbox yolunu düzeltin.

`blacksmith testbox list --all` ve `blacksmith testbox status` çalışıyor ancak yeni ısıtmalar birkaç dakika sonra IP veya Actions çalıştırma URL'si olmadan `queued` durumunda kalıyorsa bunu Blacksmith sağlayıcısı, kuyruk, faturalandırma veya kuruluş sınırı baskısı olarak değerlendirin. Oluşturduğunuz kuyruğa alınmış id'leri durdurun, daha fazla Testbox başlatmaktan kaçının ve biri Blacksmith panosunu, faturalandırmayı ve kuruluş sınırlarını kontrol ederken kanıtı aşağıdaki sahip olunan Crabbox kapasitesi yoluna taşıyın.

Sahip olunan Crabbox kapasitesine yalnızca Blacksmith kapalıysa, kota ile sınırlanmışsa, gereken ortam eksikse veya sahip olunan kapasite açıkça hedefse yükseltin:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS baskısı altında, görev gerçekten 48xlarge sınıfı CPU gerektirmedikçe `class=beast` kullanmaktan kaçının. Bir `beast` isteği 192 vCPU ile başlar ve bölgesel EC2 Spot veya On-Demand Standard kotasını tetiklemenin en kolay yoludur. Repo tarafından sahip olunan `.crabbox.yaml` varsayılan olarak `standard`, birden çok kapasite bölgesi ve `capacity.hints: true` kullanır; böylece aracılı AWS kiralamaları seçilen bölge/pazar, kota baskısı, Spot geri dönüşü ve yüksek baskılı sınıf uyarılarını yazdırır. Daha ağır geniş kontroller için `fast` kullanın, `large`'ı yalnızca standard/fast yeterli olmadıktan sonra kullanın ve `beast`'i yalnızca tam paket veya tüm Plugin Docker matrisleri, açık release/blocker doğrulaması ya da yüksek çekirdekli performans profilleme gibi istisnai CPU ağırlıklı hatlar için kullanın. `pnpm check:changed`, odaklı testler, yalnızca dokümantasyon işi, sıradan lint/typecheck, küçük E2E yeniden üretimleri veya Blacksmith kesinti triyajı için `beast` kullanmayın. Spot pazar dalgalanmasının sinyale karışmaması için kapasite tanılamasında `--market on-demand` kullanın.

`.crabbox.yaml`, sahip olunan bulut hatları için sağlayıcı, eşitleme ve GitHub Actions hidrasyon varsayılanlarını sahiplenir. Yerel `.git` dosyasını hariç tutar; böylece hidrate edilmiş Actions checkout'u, bakımcıya yerel remote'ları ve object store'ları eşitlemek yerine kendi uzak Git metadata'sını korur ve asla aktarılmaması gereken yerel runtime/build artefaktlarını hariç tutar. `.github/workflows/crabbox-hydrate.yml`, sahip olunan bulut `crabbox run --id <cbx_id>` komutları için checkout'u, Node/pnpm kurulumunu, `origin/main` getirmeyi ve secret olmayan ortam aktarımını sahiplenir.

## İlgili

- [Kurulum özeti](/tr/install)
- [Geliştirme kanalları](/tr/install/development-channels)
