---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekir
    - Başarısız olan bir GitHub Actions denetiminde hata ayıklıyorsunuz
    - Bir sürüm doğrulama çalıştırmasını veya yeniden çalıştırmasını koordine ediyorsunuz
    - ClawSweeper dağıtımını veya GitHub etkinlik iletimini değiştiriyorsunuz
summary: CI iş grafiği, kapsam kapıları, sürüm şemsiyeleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-07-04T18:16:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af8650cc7f194a7770c0f997d3c7a6a8f0307a9ce0a00525250e6a853ddecef1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI, `main` dalına yapılan her gönderimde ve her çekme isteğinde çalışır. Kanonik
`main` gönderimleri önce 90 saniyelik barındırılan çalıştırıcı kabul penceresinden geçer.
Mevcut `CI` eşzamanlılık grubu, daha yeni bir
commit geldiğinde bekleyen bu çalışmayı iptal eder; böylece ardışık birleştirmelerin her biri tam bir Blacksmith
matrisi kaydetmez. Çekme istekleri ve elle tetiklenen dispatch işlemleri beklemeyi atlar. Ardından `preflight` işi
farkı sınıflandırır ve yalnızca ilgisiz
alanlar değiştiğinde pahalı hatları kapatır. Elle yapılan `workflow_dispatch` çalışmaları, sürüm adayları ve geniş
doğrulama için akıllı kapsamlamayı bilerek atlar
ve tam grafiği yayar. Android hatları `include_android` üzerinden isteğe bağlı kalır. Yalnızca sürüme yönelik
Plugin kapsamı, ayrı [`Plugin Ön Sürüm`](#plugin-prerelease)
iş akışında bulunur ve yalnızca [`Tam Sürüm Doğrulaması`](#full-release-validation)
veya açık bir elle dispatch üzerinden çalışır.

## İş Hattı Genel Bakışı

| İş                                | Amaç                                                                                                   | Ne zaman çalışır                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Yalnızca dokümantasyon değişikliklerini, değişen kapsamları, değişen eklentileri algılar ve CI manifestini oluşturur                   | Taslak olmayan gönderimlerde ve çekme isteklerinde her zaman                  |
| `runner-admission`                 | Blacksmith işi kaydedilmeden önce kanonik `main` gönderimleri için barındırılan 90 saniyelik debounce                | Her CI çalışması; yalnızca kanonik `main` gönderimlerinde uyur |
| `security-fast`                    | Özel anahtar algılama, `zizmor` ile değişen iş akışı denetimi ve üretim kilit dosyası denetimi                 | Taslak olmayan gönderimlerde ve çekme isteklerinde her zaman                  |
| `check-dependencies`               | Üretim Knip yalnızca bağımlılık geçişi ve kullanılmayan dosya izin listesi koruması                                 | Node ile ilgili değişiklikler                               |
| `build-artifacts`                  | `dist/`, Control UI, derlenmiş CLI duman kontrolleri, gömülü derlenmiş yapı kontrolleri ve yeniden kullanılabilir yapıtları oluşturur | Node ile ilgili değişiklikler                               |
| `checks-fast-core`                 | Paketlenmiş, protokol, QA Smoke CI ve CI yönlendirme kontrolleri gibi hızlı Linux doğruluk hatları                | Node ile ilgili değişiklikler                               |
| `checks-fast-contracts-plugins-*`  | İki parçaya bölünmüş Plugin sözleşme kontrolü                                                                        | Node ile ilgili değişiklikler                               |
| `checks-fast-contracts-channels-*` | İki parçaya bölünmüş kanal sözleşme kontrolü                                                                       | Node ile ilgili değişiklikler                               |
| `checks-node-core-*`               | Kanal, paketlenmiş, sözleşme ve eklenti hatları hariç çekirdek Node test parçaları                          | Node ile ilgili değişiklikler                               |
| `check-*`                          | Parçalanmış ana yerel kapıya eşdeğer: üretim tipleri, lint, korumalar, test tipleri ve katı duman                | Node ile ilgili değişiklikler                               |
| `check-additional-*`               | Mimari, parçalanmış sınır/istem sapması, eklenti korumaları, paket sınırı ve çalışma zamanı topolojisi     | Node ile ilgili değişiklikler                               |
| `checks-node-compat-node22`        | Node 22 uyumluluk derlemesi ve duman hattı                                                                | Sürümler için elle CI dispatch                     |
| `check-docs`                       | Dokümantasyon biçimlendirme, lint ve kırık bağlantı kontrolleri                                                             | Dokümantasyon değişti                                        |
| `skills-python`                    | Python destekli Skills için Ruff + pytest                                                                    | Python Skill ile ilgili değişiklikler                       |
| `checks-windows`                   | Windows’a özgü süreç/yol testleri ve paylaşılan çalışma zamanı import belirteci regresyonları                      | Windows ile ilgili değişiklikler                            |
| `macos-node`                       | Paylaşılan derlenmiş yapıtları kullanan macOS TypeScript test hattı                                               | macOS ile ilgili değişiklikler                              |
| `macos-swift`                      | macOS uygulaması için Swift lint, derleme ve testler                                                            | macOS ile ilgili değişiklikler                              |
| `ios-build`                        | Xcode proje üretimi ve iOS uygulaması simülatör derlemesi                                                 | iOS uygulaması, paylaşılan uygulama kiti veya Swabble değişiklikleri         |
| `android`                          | Her iki flavor için Android birim testleri ve bir debug APK derlemesi                                              | Android ile ilgili değişiklikler                            |
| `test-performance-agent`           | Güvenilir etkinlikten sonra günlük Codex yavaş test optimizasyonu                                                 | Ana CI başarısı veya elle dispatch                  |
| `openclaw-performance`             | Mock sağlayıcı, derin profil ve GPT 5.5 canlı hatlarıyla günlük/isteğe bağlı Kova çalışma zamanı performans raporları | Zamanlanmış ve elle dispatch                       |

## Hızlı Başarısız Olma Sırası

1. `runner-admission` yalnızca kanonik `main` gönderimleri için bekler; daha yeni bir gönderim, Blacksmith kaydından önce çalışmayı iptal eder.
2. `preflight` hangi hatların var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bu işin içindeki adımlardır, bağımsız işler değildir.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` ve `skills-python`, daha ağır yapıt ve platform matrisi işlerini beklemeden hızlıca başarısız olur.
4. `build-artifacts`, hızlı Linux hatlarıyla örtüşür; böylece aşağı akış tüketicileri paylaşılan derleme hazır olur olmaz başlayabilir.
5. Daha ağır platform ve çalışma zamanı hatları bundan sonra yayılır: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` ve `android`.

Aynı çekme isteğine veya `main` ref’ine daha yeni bir gönderim geldiğinde GitHub, geçersiz kalan işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalışma da başarısız olmadıkça bunu CI gürültüsü olarak değerlendirin. Matris işleri `fail-fast: false` kullanır ve `build-artifacts`, küçük doğrulayıcı işleri kuyruğa almak yerine gömülü kanal, core-support-boundary ve gateway-watch hatalarını doğrudan raporlar. Otomatik CI eşzamanlılık anahtarı sürümlüdür (`CI-v7-*`), böylece eski bir kuyruk grubundaki GitHub taraflı takılı kalmış iş daha yeni main çalışmalarını süresiz engelleyemez. Elle yapılan tam paket çalışmaları `CI-manual-v1-*` kullanır ve sürmekte olan çalışmaları iptal etmez.

GitHub Actions’tan duvar süresi, kuyruk süresi, en yavaş işler, hatalar ve `pnpm-store-warmup` yayılım bariyerini özetlemek için `pnpm ci:timings`, `pnpm ci:timings:recent` veya `node scripts/ci-run-timings.mjs <run-id>` kullanın. CI aynı çalışma özetini `ci-timings-summary` yapıtı olarak da yükler. Derleme zamanlaması için `build-artifacts` işinin `Build dist` adımını kontrol edin: `pnpm build:ci-artifacts`, `[build-all] phase timings:` yazdırır ve `ui:build` içerir; iş ayrıca `startup-memory` yapıtını yükler.

Çekme isteği çalışmaları için, terminal zamanlama özeti işi `GH_TOKEN` değerini `gh run view` komutuna geçirmeden önce yardımcıyı güvenilir temel revizyondan çalıştırır. Bu, token kullanılan sorguyu dal tarafından kontrol edilen kodun dışında tutarken çekme isteğinin mevcut CI çalışmasını yine de özetler.

## Çekme İsteği Bağlamı ve Kanıtı

Dış katkıcı çekme istekleri, `.github/workflows/real-behavior-proof.yml` üzerinden
bir çekme isteği bağlamı ve kanıt kapısı çalıştırır. İş akışı güvenilir
temel commit’i checkout eder ve yalnızca çekme isteği gövdesini değerlendirir; katkıcı dalından kod yürütmez.

Kapı, depo sahipleri, üyeleri, işbirlikçileri veya botlar olmayan çekme isteği yazarlarına uygulanır. Çekme isteği gövdesi yazara ait
`What Problem This Solves` ve `Evidence` bölümlerini içerdiğinde geçer. Kanıt; odaklı bir
test, CI sonucu, ekran görüntüsü, kayıt, terminal çıktısı, canlı gözlem,
redakte edilmiş günlük veya yapıt bağlantısı olabilir. Gövde amaç ve yararlı doğrulama sağlar;
inceleyiciler doğruluğu değerlendirmek için kodu, testleri ve CI’ı inceler.

Kontrol başarısız olduğunda başka bir kod commit’i göndermek yerine çekme isteği gövdesini güncelleyin.

## Kapsam ve Yönlendirme

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki birim testleriyle kapsanır. Elle dispatch, değişen kapsam algılamasını atlar ve preflight manifestinin her kapsamlı alan değişmiş gibi davranmasını sağlar.

- **CI iş akışı düzenlemeleri** Node CI grafiğini ve iş akışı lint işlemini doğrular, ancak Windows, iOS, Android veya macOS yerel derlemelerini tek başına zorlamaz; bu platform hatları platform kaynak değişiklikleriyle sınırlı kalır.
- **İş Akışı Sağlamlık Kontrolü** tüm iş akışı YAML dosyaları üzerinde `actionlint`, `zizmor`, bileşik eylem interpolasyon koruması ve çakışma işaretleyici korumasını çalıştırır. Çekme isteği kapsamlı `security-fast` işi de değişen iş akışı dosyaları üzerinde `zizmor` çalıştırır; böylece iş akışı güvenlik bulguları ana CI grafiğinde erken başarısız olur.
- **`main` gönderimlerinde dokümantasyon** CI tarafından kullanılan aynı ClawHub dokümantasyon aynasıyla bağımsız `Docs` iş akışı tarafından kontrol edilir; bu nedenle karışık kod+dokümantasyon gönderimleri ayrıca CI `check-docs` parçasını kuyruğa almaz. Çekme istekleri ve elle CI, dokümantasyon değiştiğinde CI’dan `check-docs` çalıştırmaya devam eder.
- **TUI PTY**, TUI değişiklikleri için `checks-node-core-runtime-tui-pty` Linux Node parçasında çalışır. Parça `test/vitest/vitest.tui-pty.config.ts` dosyasını `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` ile çalıştırır; böylece hem deterministik `TuiBackend` fixture hattını hem de yalnızca dış model uç noktasını mock eden daha yavaş `tui --local` dumanını kapsar.
- **Yalnızca CI yönlendirme düzenlemeleri, seçili ucuz çekirdek test fixture düzenlemeleri ve dar Plugin sözleşmesi yardımcı/test yönlendirme düzenlemeleri** hızlı yalnızca Node manifest yolunu kullanır: `preflight`, güvenlik ve tek bir `checks-fast-core` görevi. Bu yol, değişiklik hızlı görevin doğrudan çalıştırdığı yönlendirme veya yardımcı yüzeylerle sınırlı olduğunda derleme yapıtlarını, Node 22 uyumluluğunu, kanal sözleşmelerini, tam çekirdek parçalarını, paketlenmiş Plugin parçalarını ve ek koruma matrislerini atlar.
- **Windows Node kontrolleri** Windows’a özgü süreç/yol sarmalayıcıları, npm/pnpm/UI çalıştırıcı yardımcıları, paket yöneticisi yapılandırması ve bu hattı yürüten CI iş akışı yüzeyleriyle sınırlıdır; ilgisiz kaynak, Plugin, kurulum dumanı ve yalnızca test değişiklikleri Linux Node hatlarında kalır.

En yavaş Node test aileleri, her işin runner'ları aşırı ayırmadan küçük kalması için bölünür veya dengelenir: Plugin sözleşmeleri ve kanal sözleşmeleri, standart GitHub runner geri dönüşüyle birlikte Blacksmith destekli iki ağırlıklı shard olarak çalışır; core unit fast/support hatları ayrı çalışır; core runtime altyapısı state, process/config, shared ve üç Cron domain shard'ı arasında bölünür; auto-reply dengeli worker'lar olarak çalışır (reply alt ağacı agent-runner, dispatch ve commands/state-routing shard'larına bölünür); agentic gateway/server config'leri ise oluşturulmuş artifact'ları beklemek yerine chat/auth/model/http-plugin/runtime/startup hatlarına bölünür. Normal CI daha sonra yalnızca izole infra include-pattern shard'larını en fazla 64 test dosyasından oluşan deterministik paketlere yerleştirir; bu, izole olmayan command/cron, stateful agents-core veya gateway/server süitlerini birleştirmeden Node matrisini azaltır. Ağır sabit süitler 8 vCPU üzerinde kalırken paketlenmiş ve daha düşük ağırlıklı hatlar 4 vCPU kullanır. Kanonik depodaki pull request'ler ek bir kompakt kabul planı kullanır: aynı config başına gruplar mevcut 34 işlik Linux Node planı içinde izole alt süreçlerde çalışır; böylece tek bir PR tam 70'ten fazla işlik Node matrisini kaydetmez. `main` push'ları, manuel dispatch'ler ve release gate'leri tam matrisi korur. Geniş browser, QA, media ve çeşitli Plugin testleri, paylaşılan Plugin catch-all yerine kendi özel Vitest config'lerini kullanır. Include-pattern shard'ları zamanlama girdilerini CI shard adıyla kaydeder; böylece `.artifacts/vitest-shard-timings.json` bütün bir config ile filtrelenmiş bir shard'ı ayırt edebilir. `check-additional-*`, package-boundary compile/canary işlerini birlikte tutar ve runtime topology architecture'ı gateway watch coverage'dan ayırır; boundary guard listesi, biri prompt ağırlıklı shard ve diğeri kalan guard şeritleri için birleşik shard olacak şekilde şeritlenir; her biri seçili bağımsız guard'ları eşzamanlı çalıştırır ve kontrol başına zamanlamaları yazdırır. Pahalı Codex happy-path prompt snapshot drift kontrolü yalnızca manuel CI ve prompt'u etkileyen değişiklikler için kendi ek işi olarak çalışır; böylece normal ilgisiz Node değişiklikleri soğuk prompt snapshot üretiminin arkasında beklemez ve boundary shard'ları dengeli kalırken prompt drift hâlâ buna neden olan PR'a sabitlenir; aynı bayrak, oluşturulmuş artifact core support-boundary shard'ı içinde prompt snapshot Vitest üretimini atlar. Gateway watch, kanal testleri ve core support-boundary shard'ı, `dist/` ve `dist-runtime/` zaten oluşturulduktan sonra `build-artifacts` içinde eşzamanlı çalışır.

Kabul edildikten sonra kanonik Linux CI, en fazla 24 eşzamanlı Node test işine ve
daha küçük fast/check hatları için 12 işe izin verir; Windows ve Android iki işte kalır çünkü
bu runner havuzları daha dardır.

Kompakt PR planı mevcut süit için 18 Node işi üretir: whole-config
grupları 120 dakikalık toplu iş zaman aşımıyla izole alt süreçlerde gruplanır,
include-pattern grupları ise aynı sınırlı iş bütçesini paylaşır.

Android CI hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır ve ardından Play debug APK'sını oluşturur. Third-party flavor için ayrı bir source set veya manifest yoktur; unit-test hattı yine de SMS/call-log BuildConfig bayraklarıyla flavor'ı derlerken, Android ile ilgili her push'ta yinelenen bir debug APK paketleme işinden kaçınır.

`check-dependencies` shard'ı `pnpm deadcode:dependencies` (en son Knip sürümüne sabitlenmiş, `dlx` kurulumu için pnpm'in minimum release age'i devre dışı bırakılmış bir production Knip yalnızca bağımlılık geçişi) ve `pnpm deadcode:unused-files` çalıştırır; bu ikinci komut Knip'in production kullanılmayan dosya bulgularını `scripts/deadcode-unused-files.allowlist.mjs` ile karşılaştırır. Unused-file guard, bir PR yeni incelenmemiş kullanılmayan dosya eklediğinde veya eski bir allowlist girdisi bıraktığında başarısız olur; Knip'in statik olarak çözemediği kasıtlı dinamik Plugin, generated, build, live-test ve package bridge yüzeylerini ise korur.

## ClawSweeper etkinlik iletimi

`.github/workflows/clawsweeper-dispatch.yml`, OpenClaw deposu etkinliğinden ClawSweeper'a hedef taraflı köprüdür. Güvenilmeyen pull request kodunu checkout etmez veya çalıştırmaz. Workflow, `CLAWSWEEPER_APP_PRIVATE_KEY` üzerinden bir GitHub App token'ı oluşturur, ardından `openclaw/clawsweeper` adresine kompakt `repository_dispatch` payload'ları gönderir.

Workflow'un dört hattı vardır:

- Tam issue ve pull request inceleme istekleri için `clawsweeper_item`;
- issue yorumlarındaki açık ClawSweeper komutları için `clawsweeper_comment`;
- `main` push'larındaki commit düzeyinde inceleme istekleri için `clawsweeper_commit_review`;
- ClawSweeper agent'ının inceleyebileceği genel GitHub etkinliği için `github_activity`.

`github_activity` hattı yalnızca normalize edilmiş metadata iletir: event türü, action, actor, repository, item number, URL, title, state ve varsa comments veya reviews için kısa alıntılar. Tam webhook body'sini iletmekten bilinçli olarak kaçınır. `openclaw/clawsweeper` içindeki alıcı workflow `.github/workflows/github-activity.yml` dosyasıdır; bu workflow normalize edilmiş event'i ClawSweeper agent'ı için OpenClaw Gateway hook'una gönderir.

Genel etkinlik gözlemdir, varsayılan olarak teslimat değildir. ClawSweeper agent'ı prompt'unda Discord hedefini alır ve yalnızca event şaşırtıcı, eyleme dönüştürülebilir, riskli veya operasyonel olarak yararlı olduğunda `#clawsweeper` kanalına göndermelidir. Rutin açılışlar, düzenlemeler, bot hareketliliği, yinelenen Webhook gürültüsü ve normal review trafiği `NO_REPLY` ile sonuçlanmalıdır.

Bu yol boyunca GitHub başlıklarını, yorumlarını, body'lerini, review metinlerini, branch adlarını ve commit mesajlarını güvenilmeyen veri olarak ele alın. Bunlar özetleme ve triyaj için girdidir; workflow veya agent runtime için talimat değildir.

## Manuel dispatch'ler

Manuel CI dispatch'leri normal CI ile aynı iş grafiğini çalıştırır ancak Android olmayan her scoped hattı zorla açar: Linux Node shard'ları, bundled-plugin shard'ları, Plugin ve kanal sözleşmesi shard'ları, Node 22 uyumluluğu, `check-*`, `check-additional-*`, built-artifact smoke kontrolleri, doküman kontrolleri, Python Skills, Windows, macOS, iOS build ve Control UI i18n. Bağımsız manuel CI dispatch'leri yalnızca `include_android=true` ile Android çalıştırır; tam release şemsiyesi Android'i `include_android=true` geçirerek etkinleştirir. Plugin prerelease statik kontrolleri, yalnızca release için olan `agentic-plugins` shard'ı, tam extension batch sweep ve Plugin prerelease Docker hatları CI kapsamı dışındadır. Docker prerelease süiti yalnızca `Full Release Validation`, release-validation gate'i etkin olarak ayrı `Plugin Prerelease` workflow'unu dispatch ettiğinde çalışır.

Manuel çalıştırmalar benzersiz bir concurrency group kullanır; böylece release-candidate tam süiti aynı ref üzerindeki başka bir push veya PR çalıştırması tarafından iptal edilmez. İsteğe bağlı `target_ref` girdisi, güvenilen bir çağıranın seçili dispatch ref'teki workflow dosyasını kullanırken bu grafiği bir branch, tag veya tam commit SHA üzerinde çalıştırmasına olanak tanır.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

Aylık yalnızca npm extended-stable yolu istisnadır: hem `OpenClaw NPM
Release` preflight'ını hem de `Full Release Validation`'ı tam
`extended-stable/YYYY.M.33` branch'inden dispatch edin, run ID'lerini koruyun ve her iki ID'yi de
doğrudan npm publish çalıştırmasına geçirin. Komutlar, kesin kimlik gereksinimleri, registry readback ve selector
onarım prosedürü için [Aylık yalnızca npm extended-stable
yayını](/tr/reference/RELEASING#monthly-npm-only-extended-stable-publication) bölümüne bakın. Bu yol Plugin, macOS, Windows, GitHub
Release, private dist-tag veya diğer platform yayınlarını dispatch etmez.

## Runner'lar

| Runner                          | İşler                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Manuel CI dispatch ve kanonik olmayan depo fallback'leri, CodeQL JavaScript/actions kalite taramaları, workflow-sanity, labeler, auto-response, CI dışındaki docs workflow'ları ve Blacksmith matrisinin daha erken kuyruğa alınabilmesi için install-smoke preflight                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, daha düşük ağırlıklı extension shard'ları, QA Smoke CI hariç `checks-fast-core`, Plugin/kanal sözleşmesi shard'ları, çoğu bundled/daha düşük ağırlıklı Linux Node shard'ı, `check-guards`, `check-prod-types`, `check-test-types`, seçili `check-additional-*` shard'ları ve `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Korunan ağır Linux Node süitleri, boundary/extension ağırlıklı `check-additional-*` shard'ları ve `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, CI ve Testbox içinde `build-artifacts`, `check-lint` (CPU hassasiyeti nedeniyle 8 vCPU, kazandırdığından daha fazla maliyet getirdi); install-smoke Docker build'leri (32 vCPU kuyruk süresi kazandırdığından daha fazla maliyet getirdi)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `openclaw/openclaw` üzerinde `macos-node`; fork'lar `macos-15`'e geri döner                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `openclaw/openclaw` üzerinde `macos-swift` ve `ios-build`; fork'lar `macos-26`'ya geri döner                                                                                                                                                                                                                     |

## Runner kayıt bütçesi

OpenClaw'ın mevcut GitHub runner-registration bucket'ı, `ghx api rate_limit` içinde 5 dakikada 10.000 self-hosted
runner kaydı bildirir. Her tuning geçişinden önce
`actions_runner_registration` yeniden kontrol edilmelidir çünkü GitHub bu
bucket'ı değiştirebilir. Limit, `openclaw` organizasyonundaki tüm Blacksmith runner kayıtları tarafından paylaşılır; bu nedenle başka bir Blacksmith kurulumu eklemek
yeni bir bucket eklemez.

Burst control için kıt kaynak olarak Blacksmith label'larını ele alın. Yalnızca
route eden, bildirim yapan, özetleyen, shard seçen veya kısa CodeQL taramaları çalıştıran işler,
ölçülmüş Blacksmith'e özel ihtiyaçları yoksa GitHub-hosted runner'larda kalmalıdır. Yeni herhangi bir Blacksmith matrisi, daha büyük `max-parallel` veya yüksek frekanslı
workflow en kötü durum kayıt sayısını göstermeli ve organizasyon düzeyi
hedefi canlı bucket'ın yaklaşık %60'ının altında tutmalıdır. Mevcut 10.000 kayıtlık
bucket ile bu, eşzamanlı depolar, yeniden denemeler ve burst çakışması için pay bırakan 6.000 kayıtlık bir işletim hedefi anlamına gelir.

Kanonik depo CI, normal push ve pull-request çalıştırmaları için varsayılan runner yolu olarak Blacksmith'i korur. `workflow_dispatch` ve kanonik olmayan depo çalıştırmaları GitHub-hosted runner'ları kullanır; ancak normal kanonik çalıştırmalar şu anda Blacksmith kuyruk sağlığını yoklamaz veya Blacksmith kullanılamadığında otomatik olarak GitHub-hosted label'lara geri dönmez.

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

## OpenClaw Performance

`OpenClaw Performance`, ürün/çalışma zamanı performans iş akışıdır. Her gün `main` üzerinde çalışır ve elle tetiklenebilir:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Elle tetikleme normalde iş akışı ref'ini karşılaştırma ölçütüne alır. Bir sürüm etiketini veya geçerli iş akışı uygulamasına sahip başka bir dalı karşılaştırma ölçütüne almak için `target_ref` ayarlayın. Yayımlanan rapor yolları ve en son işaretçiler test edilen ref'e göre anahtarlanır ve her `index.md`; test edilen ref/SHA'yı, iş akışı ref/SHA'sını, Kova ref'ini, profili, kanal kimlik doğrulama modunu, modeli, tekrar sayısını ve senaryo filtrelerini kaydeder.

İş akışı, OCM'yi sabitlenmiş bir sürümden ve Kova'yı sabitlenmiş `kova_ref` girdisindeki `openclaw/Kova` üzerinden yükler, ardından üç kanal çalıştırır:

- `mock-provider`: Belirleyici sahte OpenAI uyumlu kimlik doğrulamayla yerel derleme çalışma zamanına karşı Kova tanılama senaryoları.
- `mock-deep-profile`: Başlatma, Gateway ve ajan turu sıcak noktaları için CPU/heap/trace profillemesi.
- `live-openai-candidate`: `OPENAI_API_KEY` kullanılamadığında atlanan gerçek bir OpenAI `openai/gpt-5.5` ajan turu.

Mock-provider kanalı, Kova geçişinden sonra OpenClaw'a özgü kaynak yoklamalarını da çalıştırır: varsayılan, hook ve 50-Plugin başlatma durumlarında Gateway açılış zamanlaması ve bellek; paketlenmiş Plugin içe aktarma RSS'i, yinelenen sahte OpenAI `channel-chat-baseline` merhaba döngüleri, başlatılmış Gateway'e karşı CLI başlatma komutları ve SQLite durum smoke performans yoklaması. Test edilen ref için önceki yayımlanmış mock-provider kaynak raporu kullanılabilir olduğunda, kaynak özeti geçerli RSS ve heap değerlerini bu baseline ile karşılaştırır ve büyük RSS artışlarını `watch` olarak işaretler. Kaynak yoklama Markdown özeti rapor paketinde `source/index.md` konumunda, ham JSON ise yanında yer alır.

Her kanal GitHub artifact'leri yükler. `CLAWGRIT_REPORTS_TOKEN` yapılandırıldığında, iş akışı ayrıca `report.json`, `report.md`, paketleri, `index.md` ve kaynak yoklama artifact'lerini `openclaw/clawgrit-reports` içinde `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` altına commit eder. Geçerli test edilen ref işaretçisi `openclaw-performance/<tested-ref>/latest-<lane>.json` olarak yazılır.

## Tam Sürüm Doğrulaması

`Full Release Validation`, "sürümden önce her şeyi çalıştır" için kullanılan elle başlatılan şemsiye iş akışıdır. Bir dal, etiket veya tam commit SHA kabul eder; bu hedefle elle başlatılan `CI` iş akışını, yalnızca sürüme özgü Plugin/paket/statik/Docker kanıtı için `Plugin Prerelease` iş akışını ve kurulum smoke, paket kabulü, çapraz işletim sistemi paket kontrolleri, QA profil kanıtından olgunluk puan kartı oluşturma, QA Lab eşliği, Matrix ve Telegram kanalları için `OpenClaw Release Checks` iş akışını tetikler. Stable ve full profilleri her zaman kapsamlı canlı/E2E ve Docker sürüm yolu soak kapsamını içerir; beta profili `run_release_soak=true` ile bunu etkinleştirebilir. Kanonik paket Telegram E2E, Package Acceptance içinde çalışır; bu nedenle tam bir aday yinelenen canlı poller başlatmaz. Yayımlamadan sonra, yeniden derlemeden release checks, Package Acceptance, Docker, çapraz işletim sistemi ve Telegram genelinde yayımlanmış npm paketini yeniden kullanmak için `release_package_spec` iletin. `npm_telegram_package_spec` değerini yalnızca odaklı bir yayımlanmış paket Telegram yeniden çalıştırması için kullanın. Codex Plugin canlı paket kanalı varsayılan olarak aynı seçili durumu kullanır: yayımlanmış `release_package_spec=openclaw@<tag>`, `codex_plugin_spec=npm:@openclaw/codex@<tag>` türetir; SHA/artifact çalıştırmaları ise seçili ref'ten `extensions/codex` paketler. `npm:`, `npm-pack:` veya `git:` spec'leri gibi özel Plugin kaynakları için `codex_plugin_spec` değerini açıkça ayarlayın.

Aşama matrisi, tam iş akışı job adları, profil farkları, artifact'ler ve odaklı yeniden çalıştırma tanıtıcıları için [Tam sürüm doğrulaması](/tr/reference/full-release-validation) bölümüne bakın.

`OpenClaw Release Publish`, elle başlatılan ve değişiklik yapan sürüm iş akışıdır. Sürüm etiketi var olduktan ve OpenClaw npm ön denetimi başarılı olduktan sonra bunu `release/YYYY.M.PATCH` veya `main` üzerinden tetikleyin. `pnpm plugins:sync:check` doğrular, yayımlanabilir tüm Plugin paketleri için `Plugin NPM Release` iş akışını tetikler, aynı sürüm SHA'sı için `Plugin ClawHub Release` iş akışını tetikler ve ancak bundan sonra kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` iş akışını tetikler. Stable yayımlama ayrıca tam bir `windows_node_tag` gerektirir; iş akışı herhangi bir yayımlama alt işinden önce Windows kaynak sürümünü doğrular ve x64/ARM64 yükleyicilerini aday onaylı `windows_node_installer_digests` girdisiyle karşılaştırır; ardından GitHub sürüm taslağını yayımlamadan önce aynı sabitlenmiş yükleyici özetlerini, tam eşlikçi asset'i ve checksum sözleşmesini terfi ettirip doğrular.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Hızlı değişen bir dalda sabitlenmiş commit kanıtı için `gh workflow run ... --ref main -f ref=<sha>` yerine yardımcıyı kullanın:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub iş akışı tetikleme ref'leri ham commit SHA'ları değil, dal veya etiket olmalıdır. Yardımcı, hedef SHA'da geçici bir `release-ci/<sha>-...` dalı push eder, bu sabitlenmiş ref'ten `Full Release Validation` tetikler, her alt iş akışı `headSha` değerinin hedefle eşleştiğini doğrular ve çalıştırma tamamlandığında geçici dalı siler. Şemsiye doğrulayıcı, herhangi bir alt iş akışı farklı bir SHA'da çalıştıysa da başarısız olur.

`release_profile`, release checks'e iletilen canlı/sağlayıcı kapsamını kontrol eder. Elle başlatılan sürüm iş akışları varsayılan olarak `stable` kullanır; yalnızca geniş advisory sağlayıcı/medya matrisini özellikle istediğinizde `full` kullanın. Stable ve full release checks her zaman kapsamlı canlı/E2E ve Docker sürüm yolu soak çalıştırır; beta profili `run_release_soak=true` ile bunu etkinleştirebilir.

- `minimum`, en hızlı OpenAI/çekirdek sürüm açısından kritik kanalları tutar.
- `stable`, stable sağlayıcı/backend setini ekler.
- `full`, geniş advisory sağlayıcı/medya matrisini çalıştırır.

Şemsiye, tetiklenen alt çalıştırma kimliklerini kaydeder ve son `Verify full validation` job'ı geçerli alt çalıştırma sonuçlarını yeniden kontrol eder ve her alt çalıştırma için en yavaş job tablolarını ekler. Bir alt iş akışı yeniden çalıştırılıp yeşile dönerse, şemsiye sonucunu ve zamanlama özetini yenilemek için yalnızca üst doğrulayıcı job'ını yeniden çalıştırın.

Kurtarma için hem `Full Release Validation` hem de `OpenClaw Release Checks`, `rerun_group` kabul eder. Bir sürüm adayı için `all`, yalnızca normal tam CI alt çalıştırması için `ci`, yalnızca Plugin prerelease alt çalıştırması için `plugin-prerelease`, her sürüm alt çalıştırması için `release-checks` veya daha dar bir grup kullanın: şemsiye üzerinde `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` veya `npm-telegram`. Bu, odaklı bir düzeltmeden sonra başarısız bir sürüm kutusunun yeniden çalıştırmasını sınırlı tutar. Tek bir başarısız çapraz işletim sistemi kanalı için `rerun_group=cross-os` değerini `cross_os_suite_filter` ile birleştirin; örneğin `windows/packaged-upgrade`; uzun çapraz işletim sistemi komutları Heartbeat satırları yayar ve packaged-upgrade özetleri aşama başına zamanlamaları içerir. QA release-check kanalları, gerekli OpenClaw dinamik araçları standard tier özetinden saptığında veya kaybolduğunda engelleyen standart çalışma zamanı araç kapsamı kapısı dışında advisory niteliktedir.

`OpenClaw Release Checks`, seçili ref'i bir kez `release-package-under-test` tarball'ına çözümlemek için güvenilir iş akışı ref'ini kullanır, ardından bu artifact'i çapraz işletim sistemi kontrollerine ve Package Acceptance'a, soak kapsamı çalıştığında da canlı/E2E sürüm yolu Docker iş akışına iletir. Bu, paket byte'larını sürüm kutuları genelinde tutarlı tutar ve aynı adayın birden çok alt job'da yeniden paketlenmesini önler. Codex npm-Plugin canlı kanalı için release checks, `release_package_spec` değerinden türetilmiş eşleşen bir yayımlanmış Plugin spec'i iletir, operatör tarafından sağlanan `codex_plugin_spec` değerini iletir veya girdiyi boş bırakır; böylece Docker betiği seçili checkout'ın Codex Plugin'ini paketler.

`ref=main` ve `rerun_group=all` için yinelenen `Full Release Validation` çalıştırmaları eski şemsiyenin yerini alır. Üst izleyici, üst çalıştırma iptal edildiğinde zaten tetiklemiş olduğu tüm alt iş akışlarını iptal eder; böylece daha yeni main doğrulaması, eski iki saatlik bir release-check çalıştırmasının arkasında beklemez. Sürüm dalı/etiket doğrulaması ve odaklı yeniden çalıştırma grupları `cancel-in-progress: false` değerini korur.

## Canlı ve E2E parçaları

Release live/E2E alt çalıştırması geniş yerel `pnpm test:live` kapsamını korur, ancak bunu tek bir seri job yerine `scripts/test-live-shard.mjs` üzerinden adlandırılmış parçalar olarak çalıştırır:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- sağlayıcı filtreli `native-live-src-gateway-profiles` job'ları
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- bölünmüş medya ses/video parçaları ve sağlayıcı filtreli müzik parçaları

Bu, aynı dosya kapsamını korurken yavaş canlı sağlayıcı hatalarının yeniden çalıştırılmasını ve tanılanmasını kolaylaştırır. Toplu `native-live-extensions-o-z`, `native-live-extensions-media` ve `native-live-extensions-media-music` parça adları, elle tek seferlik yeniden çalıştırmalar için geçerli kalır.

Yerel canlı medya parçaları, `Live Media Runner Image` iş akışı tarafından oluşturulan `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` içinde çalışır. Bu imaj `ffmpeg` ve `ffprobe` önceden yüklenmiş olarak gelir; medya job'ları kurulumdan önce yalnızca ikili dosyaları doğrular. Docker destekli canlı suite'leri normal Blacksmith runner'larında tutun; container job'ları iç içe Docker testleri başlatmak için yanlış yerdir.

Docker destekli canlı model/backend shard'ları, seçilen her commit için ayrı bir paylaşılan `ghcr.io/openclaw/openclaw-live-test:<sha>` imajı kullanır. Canlı sürüm iş akışı bu imajı bir kez oluşturup gönderir; ardından Docker canlı model, sağlayıcıya göre shard'lanmış gateway, CLI backend, ACP bind ve Codex harness shard'ları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalışır. Gateway Docker shard'ları, takılmış bir container'ın veya temizlik yolunun tüm sürüm kontrolü bütçesini tüketmek yerine hızlı başarısız olması için iş akışı işi zaman aşımının altında açık script düzeyi `timeout` sınırları taşır. Bu shard'lar tam kaynak Docker hedefini bağımsız olarak yeniden oluşturuyorsa, sürüm çalıştırması yanlış yapılandırılmıştır ve yinelenen imaj derlemeleriyle geçen süreyi boşa harcar.

## Paket Kabulü

Soru "bu kurulabilir OpenClaw paketi ürün olarak çalışıyor mu?" olduğunda `Package Acceptance` kullanın. Bu normal CI'dan farklıdır: normal CI kaynak ağacını doğrularken, paket kabulü tek bir tarball'ı kullanıcıların kurulum veya güncelleme sonrasında kullandığı aynı Docker E2E harness üzerinden doğrular.

### İşler

1. `resolve_package`, `workflow_ref`'i checkout eder, bir paket adayını çözer, `.artifacts/docker-e2e-package/openclaw-current.tgz` dosyasını yazar, `.artifacts/docker-e2e-package/package-candidate.json` dosyasını yazar, ikisini de `package-under-test` artifact'ı olarak yükler ve GitHub adım özetinde kaynak, workflow ref, package ref, sürüm, SHA-256 ve profili yazdırır.
2. `docker_acceptance`, `openclaw-live-and-e2e-checks-reusable.yml` dosyasını `ref=workflow_ref` ve `package_artifact_name=package-under-test` ile çağırır. Yeniden kullanılabilir iş akışı bu artifact'ı indirir, tarball envanterini doğrular, gerektiğinde paket özeti Docker imajlarını hazırlar ve seçilen Docker lane'lerini iş akışı checkout'ını paketlemek yerine bu pakete karşı çalıştırır. Bir profil birden çok hedefli `docker_lanes` seçtiğinde, yeniden kullanılabilir iş akışı paketi ve paylaşılan imajları bir kez hazırlar, ardından bu lane'leri benzersiz artifact'lara sahip paralel hedefli Docker işleri olarak dağıtır.
3. `package_telegram` isteğe bağlı olarak `NPM Telegram Beta E2E` çağırır. `telegram_mode`, `none` olmadığında çalışır ve Package Acceptance bir paket çözdüyse aynı `package-under-test` artifact'ını kurar; bağımsız Telegram dispatch'i yine de yayımlanmış bir npm spec'i kurabilir.
4. `summary`, paket çözümleme, Docker kabulü veya isteğe bağlı Telegram lane'i başarısız olduysa iş akışını başarısız yapar.

### Aday kaynaklar

- `source=npm` yalnızca `openclaw@beta`, `openclaw@latest` veya `openclaw@2026.4.27-beta.2` gibi tam bir OpenClaw sürümünü kabul eder. Bunu yayımlanmış ön sürüm/kararlı kabulü için kullanın.
- `source=ref`, güvenilir bir `package_ref` dalını, etiketini veya tam commit SHA'sını paketler. Çözümleyici OpenClaw dallarını/etiketlerini getirir, seçilen commit'in repository dal geçmişinden veya bir sürüm etiketinden erişilebilir olduğunu doğrular, bağımlılıkları ayrılmış bir worktree içinde kurar ve `scripts/package-openclaw-for-docker.mjs` ile paketler.
- `source=url`, genel bir HTTPS `.tgz` indirir; `package_sha256` zorunludur. Bu yol URL kimlik bilgilerini, varsayılan olmayan HTTPS portlarını, özel/dahili/özel kullanım host adlarını veya çözümlenen IP'leri ve aynı genel güvenlik politikası dışına yönlendirmeleri reddeder.
- `source=trusted-url`, `.github/package-trusted-sources.json` içindeki adlandırılmış bir trusted-source politikasından HTTPS `.tgz` indirir; `package_sha256` ve `trusted_source_id` zorunludur. Bunu yalnızca yapılandırılmış host'lara, portlara, yol öneklerine, yönlendirme host'larına veya özel ağ çözümlemesine ihtiyaç duyan maintainer'a ait kurumsal mirror'lar veya özel paket repository'leri için kullanın. Politika bearer kimlik doğrulaması bildirirse, iş akışı sabit `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret'ını kullanır; URL içine gömülü kimlik bilgileri yine de reddedilir.
- `source=artifact`, `artifact_run_id` ve `artifact_name` üzerinden bir `.tgz` indirir; `package_sha256` isteğe bağlıdır ancak dışarıdan paylaşılan artifact'lar için sağlanmalıdır.

`workflow_ref` ve `package_ref` değerlerini ayrı tutun. `workflow_ref`, testi çalıştıran güvenilir iş akışı/harness kodudur. `package_ref`, `source=ref` olduğunda paketlenen kaynak commit'tir. Bu, mevcut test harness'ının eski iş akışı mantığını çalıştırmadan daha eski güvenilir kaynak commit'lerini doğrulamasını sağlar.

### Suite profilleri

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` artı `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — OpenWebUI ile tam Docker sürüm yolu parçaları
- `custom` — tam `docker_lanes`; `suite_profile=custom` olduğunda zorunludur

`package` profili çevrimdışı plugin kapsamı kullanır, böylece yayımlanmış paket doğrulaması canlı ClawHub erişilebilirliğine bağlı olmaz. İsteğe bağlı Telegram lane'i `NPM Telegram Beta E2E` içinde `package-under-test` artifact'ını yeniden kullanır; yayımlanmış npm spec yolu bağımsız dispatch'ler için korunur.

Ayrılmış güncelleme ve plugin test politikası; yerel komutlar,
Docker hatları, Package Acceptance girdileri, sürüm varsayılanları ve hata triyajı dahil olmak üzere
bkz. [Güncellemeleri ve pluginleri test etme](/tr/help/testing-updates-plugins).

Sürüm kontrolleri Package Acceptance'ı `source=artifact`, hazırlanmış sürüm paketi yapıtı, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` ve `telegram_mode=mock-openai` ile çağırır. Bu, paket migrasyonunu, güncellemeyi, canlı ClawHub skill kurulumunu, eski plugin bağımlılığı temizliğini, yapılandırılmış plugin kurulum onarımını, çevrimdışı plugini, plugin-update'i ve Telegram kanıtını aynı çözümlenmiş paket tarball'ı üzerinde tutar. Aynı matrisi yeniden derlemeden yayımlanmış npm paketine karşı çalıştırmak için bir beta yayımlandıktan sonra Full Release Validation veya OpenClaw Release Checks üzerinde `release_package_spec` ayarlayın; `package_acceptance_package_spec` değerini yalnızca Package Acceptance sürüm doğrulamasının geri kalanından farklı bir pakete ihtiyaç duyduğunda ayarlayın. Çapraz işletim sistemi sürüm kontrolleri hâlâ işletim sistemine özgü onboarding, yükleyici ve platform davranışını kapsar; paket/güncelleme ürün doğrulaması Package Acceptance ile başlamalıdır. `published-upgrade-survivor` Docker hattı, engelleyici sürüm yolunda her çalıştırmada yayımlanmış bir paket temelini doğrular. Package Acceptance içinde çözümlenen `package-under-test` tarball'ı her zaman adaydır ve `published_upgrade_survivor_baseline`, varsayılan olarak `openclaw@latest` olacak şekilde yedek yayımlanmış temeli seçer; başarısız hat yeniden çalıştırma komutları bu temeli korur. `run_release_soak=true` veya `release_profile=full` ile Full Release Validation, dört en son kararlı npm sürümüne ek olarak sabitlenmiş plugin uyumluluk sınırı sürümleri ve Feishu yapılandırması, korunmuş bootstrap/persona dosyaları, yapılandırılmış OpenClaw plugin kurulumları, tilde günlük yolları ve eski kalmış legacy plugin bağımlılık kökleri için issue biçimli fikstürler arasında genişletmek üzere `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` ve `published_upgrade_survivor_scenarios=reported-issues` ayarlar. Çok temelli published-upgrade survivor seçimleri, temele göre ayrı hedeflenmiş Docker runner işlerine bölümlenir. Ayrı `Update Migration` iş akışı, soru normal Full Release CI genişliği değil de kapsamlı yayımlanmış güncelleme temizliği olduğunda `all-since-2026.4.23` ve `plugin-deps-cleanup` ile `update-migration` Docker hattını kullanır. Yerel toplu çalıştırmalar `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile tam paket özellikleri geçebilir, `openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile tek bir hattı koruyabilir veya senaryo matrisi için `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` ayarlayabilir. Yayımlanmış hat, temeli gömülü bir `openclaw config set` komut reçetesiyle yapılandırır, reçete adımlarını `summary.json` içine kaydeder ve Gateway başladıktan sonra `/healthz`, `/readyz` ile RPC durumunu yoklar. Windows paketlenmiş ve yükleyici temiz hatları da kurulu bir paketin ham mutlak Windows yolundan browser-control geçersiz kılmasını içe aktarabildiğini doğrular. OpenAI çapraz işletim sistemi agent-turn smoke, ayarlandığında varsayılan olarak `OPENCLAW_CROSS_OS_OPENAI_MODEL` kullanır; aksi durumda `openai/gpt-5.5` kullanır. Böylece kurulum ve gateway kanıtı, GPT-4.x varsayılanlarından kaçınırken GPT-5 test modelinde kalır.

### Legacy uyumluluk pencereleri

Package Acceptance, zaten yayımlanmış paketler için sınırlı legacy uyumluluk pencerelerine sahiptir. `2026.4.25` ve `2026.4.25-beta.*` dahil olmak üzere bu sürüme kadar olan paketler uyumluluk yolunu kullanabilir:

- `dist/postinstall-inventory.json` içindeki bilinen özel QA girdileri, tarball'a dahil edilmemiş dosyalara işaret edebilir;
- paket bu bayrağı sunmuyorsa `doctor-switch`, `gateway install --wrapper` kalıcılığı alt durumunu atlayabilir;
- `update-channel-switch`, tarball'dan türetilmiş sahte git fikstüründen eksik pnpm `patchedDependencies` öğelerini budayabilir ve eksik kalıcı `update.channel` kaydı yapabilir;
- plugin smoke'ları legacy kurulum kaydı konumlarını okuyabilir veya eksik marketplace kurulum kaydı kalıcılığını kabul edebilir;
- `plugin-update`, kurulum kaydının ve yeniden kurulum yapılmama davranışının değişmeden kalmasını hâlâ gerektirirken yapılandırma metadata migrasyonuna izin verebilir.

Yayımlanmış `2026.4.26` paketi, daha önce zaten gönderilmiş yerel derleme metadata damga dosyaları için de uyarı verebilir. Daha sonraki paketler modern sözleşmeleri karşılamalıdır; aynı koşullar uyarmak veya atlamak yerine başarısız olur.

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

Başarısız bir package acceptance çalıştırmasında hata ayıklarken, paket kaynağını, sürümünü ve SHA-256 değerini doğrulamak için `resolve_package` özetiyle başlayın. Ardından `docker_acceptance` alt çalıştırmasını ve Docker yapıtlarını inceleyin: `.artifacts/docker-tests/**/summary.json`, `failures.json`, hat günlükleri, aşama zamanlamaları ve yeniden çalıştırma komutları. Tam sürüm doğrulamasını yeniden çalıştırmak yerine başarısız paket profilini veya tam Docker hatlarını yeniden çalıştırmayı tercih edin.

## Kurulum smoke'u

Ayrı `Install Smoke` iş akışı, aynı kapsam betiğini kendi `preflight` işi üzerinden yeniden kullanır. Smoke kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak ikiye ayırır.

- **Hızlı yol**, Docker/paket yüzeylerine, paketlenen plugin paket/manifest değişikliklerine veya Docker smoke işlerinin çalıştırdığı çekirdek plugin/channel/gateway/Plugin SDK yüzeylerine dokunan pull request'ler için çalışır. Yalnızca kaynak kodu değiştiren paketlenmiş plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca dokümantasyon düzenlemeleri Docker worker'larını ayırmaz. Hızlı yol, kök Dockerfile imajını bir kez derler, CLI'yi denetler, agents delete shared-workspace CLI smoke'u çalıştırır, container gateway-network e2e'yi çalıştırır, paketlenmiş bir extension build arg'ını doğrular ve sınırlı paketlenmiş-plugin Docker profilini 240 saniyelik toplam komut zaman aşımı altında çalıştırır (her senaryonun Docker çalıştırması ayrıca sınırlandırılır).
- **Tam yol**, QR paket kurulumu ve installer Docker/update kapsamını nightly zamanlanmış çalıştırmalar, manuel dispatch'ler, workflow-call release denetimleri ve gerçekten installer/package/Docker yüzeylerine dokunan pull request'ler için korur. Tam modda install-smoke, bir target-SHA GHCR kök Dockerfile smoke imajını hazırlar veya yeniden kullanır; ardından QR paket kurulumu, kök Dockerfile/gateway smoke'ları, installer/update smoke'ları ve hızlı paketlenmiş-plugin Docker E2E'yi ayrı işler olarak çalıştırır, böylece installer işi kök imaj smoke'larının arkasında beklemez.

`main` push'ları (merge commit'leri dahil) tam yolu zorlamaz; changed-scope mantığı bir push üzerinde tam kapsam istese bile workflow hızlı Docker smoke'u korur ve tam install smoke'u nightly veya release doğrulamasına bırakır.

Yavaş Bun global install image-provider smoke'u ayrıca `run_bun_global_install_smoke` ile kapılanır. Nightly takviminde ve release checks workflow'undan çalışır; manuel `Install Smoke` dispatch'leri buna dahil olmayı seçebilir, ancak pull request'ler ve `main` push'ları çalıştırmaz. Normal PR CI hâlâ Node ile ilgili değişiklikler için hızlı Bun launcher regresyon hattını çalıştırır. QR ve installer Docker testleri kendi kurulum odaklı Dockerfile'larını korur.

## Yerel Docker E2E

`pnpm test:docker:all`, bir paylaşılan live-test imajını önceden derler, OpenClaw'u bir npm tarball'ı olarak bir kez paketler ve iki paylaşılan `scripts/e2e/Dockerfile` imajı derler:

- installer/update/plugin-dependency hatları için yalın bir Node/Git runner;
- normal işlevsellik hatları için aynı tarball'ı `/app` içine kuran işlevsel bir imaj.

Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde, planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur ve runner yalnızca seçilen planı yürütür. Zamanlayıcı, hat başına imajı `OPENCLAW_DOCKER_E2E_BARE_IMAGE` ve `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` ile seçer, ardından hatları `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır.

### Ayarlanabilirler

| Değişken                               | Varsayılan | Amaç                                                                                          |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10         | Normal hatlar için ana havuz slot sayısı.                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10         | Provider'a duyarlı tail-pool slot sayısı.                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9          | Provider'ların throttling yapmaması için eşzamanlı live hat sınırı.                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5          | Eşzamanlı npm install hat sınırı.                                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7          | Eşzamanlı çok hizmetli hat sınırı.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000       | Docker daemon oluşturma fırtınalarını önlemek için hat başlangıçları arası gecikme; gecikme olmaması için `0` ayarlayın. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000    | Hat başına yedek zaman aşımı (120 dakika); seçilen live/tail hatları daha sıkı sınırlar kullanır. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset      | `1`, hatları çalıştırmadan zamanlayıcı planını yazdırır.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset      | Virgülle ayrılmış tam hat listesi; ajanların tek bir başarısız hattı yeniden üretebilmesi için cleanup smoke'u atlar. |

Etkin sınırından daha ağır bir hat, boş bir havuzdan yine de başlayabilir; ardından kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel toplam çalışma Docker preflight'larını yapar, eski OpenClaw E2E container'larını kaldırır, etkin hat durumunu yayımlar, en uzun-önce sıralaması için hat sürelerini kalıcılaştırır ve varsayılan olarak ilk hatadan sonra yeni havuzlanmış hatları zamanlamayı durdurur.

### Yeniden Kullanılabilir live/E2E workflow

Yeniden kullanılabilir live/E2E workflow, hangi paket, imaj türü, live imajı, hat ve kimlik bilgisi kapsamının gerektiğini `scripts/test-docker-all.mjs --plan-json` aracılığıyla sorar. `scripts/docker-e2e.mjs` ardından bu planı GitHub output'larına ve özetlerine dönüştürür. OpenClaw'u `scripts/package-openclaw-for-docker.mjs` üzerinden paketler, geçerli çalıştırmanın paket artifact'ını indirir veya `package_artifact_run_id` üzerinden bir paket artifact'ı indirir; tarball envanterini doğrular; plan paket kurulmuş hatlara ihtiyaç duyduğunda Blacksmith'in Docker layer cache'i üzerinden paket-digest-tag'li bare/functional GHCR Docker E2E imajlarını derleyip push'lar; ve yeniden derlemek yerine sağlanan `docker_e2e_bare_image`/`docker_e2e_functional_image` input'larını veya mevcut package-digest imajlarını yeniden kullanır. Takılmış bir registry/cache akışının CI kritik yolunun çoğunu tüketmek yerine hızla yeniden denenmesi için Docker imaj çekmeleri, deneme başına sınırlı 180 saniyelik zaman aşımıyla yeniden denenir.

### Release-path parçaları

Release Docker kapsamı, `OPENCLAW_SKIP_DOCKER_BUILD=1` ile daha küçük parçalara ayrılmış işler çalıştırır; böylece her parça yalnızca ihtiyaç duyduğu imaj türünü çeker ve aynı ağırlıklı zamanlayıcı üzerinden birden çok hattı yürütür:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Geçerli release Docker parçaları `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` ve `plugins-runtime-install-a` ile `plugins-runtime-install-h` arasıdır. `package-update-openai`, aday OpenClaw paketini kuran, Codex plugin'ini `codex_plugin_spec` üzerinden veya açık Codex CLI kurulum onayıyla aynı-ref tarball'dan kuran, Codex CLI preflight'ı çalıştıran ve ardından OpenAI'ye karşı aynı oturumda birden çok OpenClaw ajan turu çalıştıran live Codex plugin paket hattını içerir. `plugins-runtime-core`, `plugins-runtime` ve `plugins-integrations` toplu plugin/runtime alias'ları olarak kalır. `install-e2e` hat alias'ı, iki provider installer hattı için toplu manuel yeniden çalıştırma alias'ı olarak kalır.

OpenWebUI, tam release-path kapsamı istediğinde `plugins-runtime-services` içine katılır ve yalnızca OpenWebUI'ye özgü dispatch'ler için bağımsız `openwebui` parçasını korur. Paketlenmiş-channel update hatları, geçici npm ağ hataları için bir kez yeniden dener.

Her parça, hat log'ları, süreler, `summary.json`, `failures.json`, faz süreleri, zamanlayıcı plan JSON'u, yavaş hat tabloları ve hat başına yeniden çalıştırma komutlarıyla `.artifacts/docker-tests/` yükler. Workflow `docker_lanes` input'u, seçilen hatları parça işleri yerine hazırlanmış imajlara karşı çalıştırır; bu, başarısız hat hata ayıklamasını hedeflenmiş tek bir Docker işiyle sınırlar ve o çalıştırma için paket artifact'ını hazırlar, indirir veya yeniden kullanır; seçilen hat bir live Docker hattıysa hedeflenmiş iş, o yeniden çalıştırma için live-test imajını yerelde derler. Üretilen hat başına GitHub yeniden çalıştırma komutları, bu değerler mevcut olduğunda `package_artifact_run_id`, `package_artifact_name` ve hazırlanmış imaj input'larını içerir; böylece başarısız bir hat, başarısız çalıştırmadaki tam paket ve imajları yeniden kullanabilir.

```bash
pnpm test:docker:rerun <run-id>      # Docker artifact'larını indir ve birleşik/hat başına hedeflenmiş yeniden çalıştırma komutlarını yazdır
pnpm test:docker:timings <summary>   # yavaş hat ve faz kritik-yol özetleri
```

Zamanlanmış live/E2E workflow, tam release-path Docker paketini günlük çalıştırır.

## Plugin Ön Sürüm

`Plugin Prerelease` daha maliyetli ürün/paket kapsamıdır, bu yüzden `Full Release Validation` tarafından veya açık bir operatör tarafından dispatch edilen ayrı bir workflow'dur. Normal pull request'ler, `main` push'ları ve bağımsız manuel CI dispatch'leri bu paketi kapalı tutar. Paketlenmiş plugin testlerini sekiz extension worker arasında dengeler; bu extension shard işleri, import ağırlıklı plugin gruplarının ek CI işi oluşturmaması için grup başına bir Vitest worker ve daha büyük bir Node heap ile aynı anda en fazla iki plugin config grubunu çalıştırır. Yalnızca release'e ait Docker ön sürüm yolu, bir-üç dakikalık işler için onlarca runner ayırmamak amacıyla hedeflenmiş Docker hatlarını küçük gruplar halinde toplar. Workflow ayrıca `@openclaw/plugin-inspector` tarafından bilgilendirici bir `plugin-inspector-advisory` artifact'ı yükler; inspector bulguları triage girdisidir ve engelleyici Plugin Prerelease kapısını değiştirmez.

## QA Lab

QA Lab, ana smart-scoped workflow dışında ayrılmış CI hatlarına sahiptir. Agentic parity, bağımsız bir PR workflow'u değil, geniş QA ve release harness'larının altında iç içedir. Parity'nin geniş bir doğrulama çalıştırmasıyla birlikte ilerlemesi gerektiğinde `rerun_group=qa-parity` ile `Full Release Validation` kullanın.

- `QA-Lab - All Lanes` workflow'u nightly olarak `main` üzerinde ve manuel dispatch ile çalışır; mock parity hattını, live Matrix hattını ve live Telegram ile Discord hatlarını paralel işler olarak fan-out eder. Live işler `qa-live-shared` environment'ını kullanır ve Telegram/Discord Convex lease'leri kullanır.

Release checks, live model gecikmesinden ve normal provider-plugin başlangıcından channel sözleşmesini yalıtmak için deterministic mock provider ve mock-qualified modeller (`mock-openai/gpt-5.5` ve `mock-openai/gpt-5.5-alt`) ile Matrix ve Telegram live transport hatlarını çalıştırır. Live transport gateway bellek aramasını devre dışı bırakır çünkü QA parity bellek davranışını ayrıca kapsar; provider bağlantısı ayrı live model, native provider ve Docker provider paketleri tarafından kapsanır.

Matrix, zamanlanmış ve release kapıları için `--profile fast` kullanır; `--fail-fast` yalnızca checkout edilmiş CLI desteklediğinde eklenir. CLI varsayılanı ve manuel workflow input'u `all` olarak kalır; manuel `matrix_profile=all` dispatch'i, tam Matrix kapsamını her zaman `transport`, `media`, `e2ee-smoke`, `e2ee-deep` ve `e2ee-cli` işlerine shard'lar.

`OpenClaw Release Checks` ayrıca release onayından önce release açısından kritik QA Lab hatlarını çalıştırır; QA parity kapısı aday ve baseline paketleri paralel hat işleri olarak çalıştırır, ardından son parity karşılaştırması için iki artifact'ı da küçük bir rapor işine indirir.

Normal PR'lar için parity'yi zorunlu bir durum olarak ele almak yerine scoped CI/check kanıtını izleyin.

## CodeQL

`CodeQL` workflow'u, tam depo taraması değil, bilerek dar tutulmuş bir ilk-geçiş güvenlik tarayıcısıdır. Günlük, manuel ve taslak olmayan pull request guard çalıştırmaları, Actions workflow kodunu ve en yüksek riskli JavaScript/TypeScript yüzeylerini yüksek/kritik `security-severity` değerlerine filtrelenmiş yüksek güvenli güvenlik sorgularıyla tarar.

Pull request guard hafif kalır: yalnızca `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` veya süreç sahibi paketlenmiş plugin runtime yolları altındaki değişiklikler için başlar ve zamanlanmış workflow ile aynı yüksek güvenli güvenlik matrisini çalıştırır. Android ve macOS CodeQL, PR varsayılanlarının dışında kalır.

### Güvenlik kategorileri

| Kategori                                          | Yüzey                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Kimlik doğrulama, sırlar, sandbox, Cron ve Gateway temeli                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Çekirdek kanal uygulama sözleşmeleri ile kanal Plugin çalışma zamanı, Gateway, Plugin SDK, sırlar, denetim temas noktaları              |
| `/codeql-security-high/network-ssrf-boundary`     | Çekirdek SSRF, IP ayrıştırma, ağ koruması, web-fetch ve Plugin SDK SSRF ilke yüzeyleri                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP sunucuları, süreç yürütme yardımcıları, giden teslimat ve aracı araç yürütme geçitleri                                           |
| `/codeql-security-high/process-exec-boundary`     | Yerel kabuk, süreç başlatma yardımcıları, alt süreç sahibi paketli Plugin çalışma zamanları ve iş akışı betiği bağlayıcıları                             |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin kurulumu, yükleyici, manifest, kayıt defteri, paket yöneticisi kurulumu, kaynak yükleme ve Plugin SDK paket sözleşmesi güven yüzeyleri |

### Platforma özgü güvenlik parçaları

- `CodeQL Android Critical Security` — zamanlanmış Android güvenlik parçası. Android uygulamasını, iş akışı sağlama denetiminin kabul ettiği en küçük Blacksmith Linux çalıştırıcısında CodeQL için elle derler. `/codeql-critical-security/android` altında yükler.
- `CodeQL macOS Critical Security` — haftalık/manuel macOS güvenlik parçası. macOS uygulamasını Blacksmith macOS üzerinde CodeQL için elle derler, bağımlılık derleme sonuçlarını yüklenen SARIF dışına filtreler ve `/codeql-critical-security/macos` altında yükler. Temiz olduğunda bile macOS derlemesi çalışma süresini domine ettiği için günlük varsayılanların dışında tutulur.

### Critical Quality kategorileri

`CodeQL Critical Quality`, eşleşen güvenlik dışı parçadır. Kalite taramalarının Blacksmith çalıştırıcı kayıt bütçesini harcamaması için GitHub barındırmalı Linux çalıştırıcılarında dar, yüksek değerli yüzeyler üzerinde yalnızca hata önem dereceli, güvenlik dışı JavaScript/TypeScript kalite sorgularını çalıştırır. Pull request koruması, zamanlanmış profilden bilinçli olarak daha küçüktür: taslak olmayan PR'lar yalnızca aracı komut/model/araç yürütme ve yanıt dağıtım kodu, yapılandırma şeması/geçiş/IO kodu, kimlik doğrulama/sırlar/sandbox/güvenlik kodu, çekirdek kanal ve paketli kanal Plugin çalışma zamanı, Gateway protokolü/sunucu yöntemi, bellek çalışma zamanı/SDK bağlayıcısı, MCP/süreç/giden teslimat, sağlayıcı çalışma zamanı/model kataloğu, oturum tanılama/teslimat kuyrukları, Plugin yükleyici, Plugin SDK/paket sözleşmesi veya Plugin SDK yanıt çalışma zamanı değişiklikleri için eşleşen `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` ve `plugin-sdk-reply-runtime` parçalarını çalıştırır. CodeQL yapılandırması ve kalite iş akışı değişiklikleri on iki PR kalite parçasının tamamını çalıştırır.

Manuel tetikleme şunları kabul eder:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Dar profiller, tek bir kalite parçasını yalıtılmış şekilde çalıştırmak için öğretme/yineleme kancalarıdır.

| Kategori                                                | Yüzey                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kimlik doğrulama, sırlar, sandbox, Cron ve Gateway güvenlik sınırı kodu                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Yapılandırma şeması, geçiş, normalleştirme ve IO sözleşmeleri                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway protokol şemaları ve sunucu yöntemi sözleşmeleri                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Çekirdek kanal ve paketli kanal Plugin uygulama sözleşmeleri                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Komut yürütme, model/sağlayıcı dağıtımı, otomatik yanıt dağıtımı ve kuyrukları ile ACP kontrol düzlemi çalışma zamanı sözleşmeleri                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP sunucuları ve araç köprüleri, süreç gözetim yardımcıları ve giden teslimat sözleşmeleri                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Bellek ana bilgisayar SDK'sı, bellek çalışma zamanı cepheleri, bellek Plugin SDK takma adları, bellek çalışma zamanı etkinleştirme bağlayıcısı ve bellek doctor komutları                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Yanıt kuyruğu iç yapıları, oturum teslimat kuyrukları, giden oturum bağlama/teslimat yardımcıları, tanılama olayı/günlük paketi yüzeyleri ve oturum doctor CLI sözleşmeleri |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK gelen yanıt dağıtımı, yanıt yükü/parçalama/çalışma zamanı yardımcıları, kanal yanıt seçenekleri, teslimat kuyrukları ve oturum/iş parçacığı bağlama yardımcıları             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model kataloğu normalleştirme, sağlayıcı kimlik doğrulaması ve keşfi, sağlayıcı çalışma zamanı kaydı, sağlayıcı varsayılanları/katalogları ve web/search/fetch/embedding kayıt defterleri    |
| `/codeql-critical-quality/ui-control-plane`             | Kontrol UI önyüklemesi, yerel kalıcılık, Gateway kontrol akışları ve görev kontrol düzlemi çalışma zamanı sözleşmeleri                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Çekirdek web fetch/search, medya IO, medya anlama, görüntü oluşturma ve medya oluşturma çalışma zamanı sözleşmeleri                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Yükleyici, kayıt defteri, herkese açık yüzey ve Plugin SDK giriş noktası sözleşmeleri                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Yayımlanan paket tarafı Plugin SDK kaynağı ve Plugin paketi sözleşmesi yardımcıları                                                                                      |

Kalite, güvenlikten ayrı kalır; böylece kalite bulguları güvenlik sinyalini gölgelemeden zamanlanabilir, ölçülebilir, devre dışı bırakılabilir veya genişletilebilir. Swift, Python ve paketli Plugin CodeQL genişletmesi, yalnızca dar profiller kararlı çalışma süresi ve sinyale sahip olduktan sonra kapsamlı veya parçalı takip işi olarak geri eklenmelidir.

## Bakım iş akışları

### Docs Agent

`Docs Agent` iş akışı, mevcut dokümanları yakın zamanda inen değişikliklerle hizalı tutmak için olay güdümlü bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerindeki başarılı bir bot olmayan push CI çalıştırması bunu tetikleyebilir ve manuel tetikleme doğrudan çalıştırabilir. İş akışı çalıştırması çağrıları, `main` ilerlemişse veya son saat içinde atlanmamış başka bir Docs Agent çalıştırması oluşturulmuşsa atlanır. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından mevcut `main` durumuna kadar olan commit aralığını inceler; böylece saatlik tek bir çalıştırma, son doküman geçişinden bu yana biriken tüm main değişikliklerini kapsayabilir.

### Test Performance Agent

`Test Performance Agent` iş akışı, yavaş testler için olay güdümlü bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerindeki başarılı bir bot olmayan push CI çalıştırması bunu tetikleyebilir, ancak aynı UTC gününde başka bir iş akışı çalıştırması çağrısı zaten çalışmışsa veya çalışıyorsa atlanır. Manuel tetikleme bu günlük etkinlik geçidini atlar. Hat, tam paket gruplandırılmış bir Vitest performans raporu oluşturur, Codex'in geniş refactor'lar yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, ardından tam paket raporunu yeniden çalıştırır ve geçen temel test sayısını azaltan değişiklikleri reddeder. Gruplandırılmış rapor, Linux ve macOS üzerinde yapılandırma başına duvar süresini ve maksimum RSS'yi kaydeder; böylece önce/sonra karşılaştırması süre deltalarının yanında test bellek deltalarını da görünür kılar. Temel durumda başarısız testler varsa, Codex yalnızca bariz hataları düzeltebilir ve aracı sonrası tam paket raporu herhangi bir şey commit edilmeden önce geçmelidir. Bot push'u inmeden önce `main` ilerlediğinde, hat doğrulanmış yamayı rebase eder, `pnpm check:changed` komutunu yeniden çalıştırır ve push'u tekrar dener; çakışan bayat yamalar atlanır. Codex eyleminin doküman aracısıyla aynı sudo bırakma güvenliği duruşunu koruyabilmesi için GitHub barındırmalı Ubuntu kullanır.

### Birleştirmeden Sonra Yinelenen PR'lar

`Duplicate PRs After Merge` iş akışı, iniş sonrası yinelenenleri temizlemek için manuel bir bakımcı iş akışıdır. Varsayılan olarak dry-run kullanır ve yalnızca `apply=true` olduğunda açıkça listelenen PR'ları kapatır. GitHub üzerinde değişiklik yapmadan önce, inen PR'ın birleştirildiğini ve her yinelemenin ya ortak bir başvurulan issue'ya ya da örtüşen değiştirilmiş parçalara sahip olduğunu doğrular.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Yerel denetim geçitleri ve değişiklik yönlendirmesi

Yerel değişen hat mantığı `scripts/changed-lanes.mjs` içinde bulunur ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel denetim geçidi, mimari sınırlar konusunda geniş CI platform kapsamından daha katıdır:

- çekirdek üretim değişiklikleri, çekirdek prod ve çekirdek test typecheck ile çekirdek lint/korumalarını çalıştırır;
- yalnızca çekirdek test değişiklikleri, yalnızca çekirdek test typecheck ile çekirdek lint'i çalıştırır;
- extension üretim değişiklikleri, extension prod ve extension test typecheck ile extension lint'i çalıştırır;
- yalnızca extension test değişiklikleri, extension test typecheck ile extension lint'i çalıştırır;
- herkese açık Plugin SDK veya Plugin sözleşmesi değişiklikleri, extension'lar bu çekirdek sözleşmelere bağlı olduğu için extension typecheck'e genişler (Vitest extension taramaları açık test işi olarak kalır);
- yalnızca release metadata sürüm artırımları, hedefli sürüm/yapılandırma/kök bağımlılık denetimlerini çalıştırır;
- bilinmeyen kök/yapılandırma değişiklikleri güvenli şekilde tüm denetim hatlarına düşer.

Yerel değişen test yönlendirmesi `scripts/test-projects.test-support.mjs` içinde bulunur ve bilinçli olarak `check:changed` komutundan daha ucuzdur: doğrudan test düzenlemeleri kendilerini çalıştırır, kaynak düzenlemeleri açık eşlemeleri, ardından kardeş testleri ve import grafiği bağımlılarını tercih eder. Paylaşılan grup odası teslimat yapılandırması açık eşlemelerden biridir: grup görünür yanıt yapılandırması, kaynak yanıt teslimat modu veya message-tool sistem prompt'u değişiklikleri çekirdek yanıt testleri ile Discord ve Slack teslimat regresyonlarından geçer; böylece paylaşılan bir varsayılan değişiklik ilk PR push'undan önce başarısız olur. Yalnızca değişiklik, ucuz eşlenmiş kümenin güvenilir bir vekil olmadığı kadar harness genelindeyse `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` kullanın.

## Testbox doğrulaması

Crabbox, bakımcı Linux kanıtı için depo tarafından sahip olunan uzak kutu sarmalayıcısıdır. Bir kontrol yerel düzenleme döngüsü için fazla geniş olduğunda, CI eşdeğerliği önemli olduğunda veya kanıt için sırlar, Docker, paket hatları, yeniden kullanılabilir kutular ya da uzak günlükler gerektiğinde bunu depo kökünden kullanın. Normal OpenClaw arka ucu `blacksmith-testbox`’tır; sahip olunan AWS/Hetzner kapasitesi, Blacksmith kesintileri, kota sorunları veya açıkça sahip olunan kapasite testi için bir geri dönüş yoludur.

Crabbox destekli Blacksmith çalıştırmaları tek kullanımlık Testbox’ları ısıtır, talep eder, senkronize eder, çalıştırır, raporlar ve temizler. Yerleşik senkronizasyon sağlamlık kontrolü, `pnpm-lock.yaml` gibi gerekli kök dosyalar kaybolduğunda veya `git status --short` en az 200 izlenen silme gösterdiğinde hızlı başarısız olur. Kasıtlı büyük silme PR’ları için uzak komutta `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` ayarlayın.

Crabbox ayrıca senkronizasyon aşamasında beş dakikadan fazla senkronizasyon sonrası çıktı olmadan kalan yerel bir Blacksmith CLI çağrısını sonlandırır. Bu korumayı devre dışı bırakmak için `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` ayarlayın veya alışılmadık derecede büyük yerel diff’ler için daha büyük bir milisaniye değeri kullanın.

İlk çalıştırmadan önce sarmalayıcıyı depo kökünden kontrol edin:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Depo sarmalayıcısı, `blacksmith-testbox` duyurmayan eski bir Crabbox ikilisini reddeder. `.crabbox.yaml` sahip olunan bulut varsayılanlarına sahip olsa bile sağlayıcıyı açıkça geçirin. Codex worktree’lerinde veya bağlı/seyrek checkout’larda yerel `pnpm crabbox:run` betiğinden kaçının, çünkü pnpm Crabbox başlamadan önce bağımlılıkları uzlaştırabilir; bunun yerine node sarmalayıcısını doğrudan çağırın:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith destekli çalıştırmalar, sarmalayıcının güncel Testbox senkronizasyon, kuyruk ve temizleme davranışını alması için Crabbox 0.22.0 veya daha yenisini gerektirir. Kardeş checkout kullanırken, zamanlama veya kanıt işi öncesinde yok sayılan yerel ikiliyi yeniden derleyin:

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

Son JSON özetini okuyun. Yararlı alanlar `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` ve `totalMs`’dir. Yetkilendirilmiş Blacksmith Testbox çalıştırmaları için Crabbox sarmalayıcı çıkış kodu ve JSON özeti komut sonucudur. Bağlı GitHub Actions çalıştırması, hidrasyon ve canlı tutmadan sorumludur; SSH komutu zaten döndükten sonra Testbox dışarıdan durdurulduğunda `cancelled` olarak bitebilir. Sarmalayıcı `exitCode` sıfır değilse veya komut çıktısı başarısız bir test gösteriyorsa bunun dışında bunu bir temizleme/durum artifaktı olarak değerlendirin. Tek kullanımlık Blacksmith destekli Crabbox çalıştırmaları Testbox’ı otomatik olarak durdurmalıdır; bir çalıştırma kesintiye uğrarsa veya temizleme belirsizse canlı kutuları inceleyin ve yalnızca sizin oluşturduğunuz kutuları durdurun:

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

Bozuk katman Crabbox ise ancak Blacksmith’in kendisi çalışıyorsa, doğrudan Blacksmith’i yalnızca `list`, `status` ve temizleme gibi tanılama işlemleri için kullanın. Doğrudan bir Blacksmith çalıştırmasını bakımcı kanıtı olarak değerlendirmeden önce Crabbox yolunu düzeltin.

`blacksmith testbox list --all` ve `blacksmith testbox status` çalışıyor ancak yeni ısıtmalar birkaç dakika sonra IP veya Actions çalıştırma URL’si olmadan `queued` durumunda kalıyorsa bunu Blacksmith sağlayıcı, kuyruk, faturalandırma veya kuruluş sınırı baskısı olarak değerlendirin. Oluşturduğunuz kuyruktaki kimlikleri durdurun, daha fazla Testbox başlatmaktan kaçının ve biri Blacksmith panosunu, faturalandırmayı ve kuruluş sınırlarını kontrol ederken kanıtı aşağıdaki sahip olunan Crabbox kapasite yoluna taşıyın.

Sahip olunan Crabbox kapasitesine yalnızca Blacksmith kapalı olduğunda, kota ile sınırlı olduğunda, gereken ortam eksik olduğunda veya sahip olunan kapasite açıkça hedef olduğunda yükseltin:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

AWS baskısı altında, görev gerçekten 48xlarge sınıfı CPU gerektirmedikçe `class=beast` kullanmaktan kaçının. Bir `beast` isteği 192 vCPU’dan başlar ve bölgesel EC2 Spot veya On-Demand Standard kotasına takılmanın en kolay yoludur. Depo tarafından sahip olunan `.crabbox.yaml` varsayılanları `standard`, birden çok kapasite bölgesi ve `capacity.hints: true` olarak ayarlanmıştır; böylece aracılı AWS kiralamaları seçilen bölge/pazarı, kota baskısını, Spot geri dönüşünü ve yüksek baskılı sınıf uyarılarını yazdırır. Daha ağır geniş kontroller için `fast`, yalnızca standard/fast yeterli olmadıktan sonra `large` ve `beast`’i yalnızca tam paket veya tüm Plugin Docker matrisleri, açık release/blocker doğrulaması ya da yüksek çekirdekli performans profilleme gibi istisnai CPU ağırlıklı hatlar için kullanın. `pnpm check:changed`, odaklı testler, yalnızca dokümantasyon işleri, olağan lint/typecheck, küçük E2E yeniden üretimleri veya Blacksmith kesinti triyajı için `beast` kullanmayın. Kapasite tanılaması için `--market on-demand` kullanın; böylece Spot pazar dalgalanması sinyale karışmaz.

`.crabbox.yaml`, sahip olunan bulut hatları için sağlayıcı, senkronizasyon ve GitHub Actions hidrasyon varsayılanlarına sahiptir. Hidrate edilmiş Actions checkout’unun bakımcı yerel uzak Git meta verilerini ve nesne depolarını senkronize etmek yerine kendi uzak Git meta verilerini koruması için yerel `.git`’i hariç tutar ve asla aktarılmaması gereken yerel çalışma zamanı/derleme artifaktlarını hariç tutar. `.github/workflows/crabbox-hydrate.yml`, sahip olunan bulut `crabbox run --id <cbx_id>` komutları için checkout, Node/pnpm kurulumu, `origin/main` getirme ve gizli olmayan ortam devrinden sorumludur.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Geliştirme kanalları](/tr/install/development-channels)
