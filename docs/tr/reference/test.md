---
read_when:
    - Testleri çalıştırma veya düzeltme
summary: Testler yerel olarak nasıl çalıştırılır (vitest) ve force/coverage modları ne zaman kullanılır?
title: Testler
x-i18n:
    generated_at: "2026-07-16T17:56:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 391185703e853bb523e1396eb22da4693d10d47b1644d3b2a51707d329f67dae
    source_path: reference/test.md
    workflow: 16
---

- Tam test kiti (paketler, canlı, Docker): [Testler](/tr/help/testing)
- Güncelleme ve plugin paketi doğrulaması: [Güncellemeleri ve plugin'leri test etme](/tr/help/testing-updates-plugins)

## Agent varsayılanı

Agent oturumları, yalnızca kaynak güvenilir olduğunda ve mevcut bağımlılık
kurulumu hazır olduğunda bir/birkaç odaklı testi ve düşük maliyetli statik
kontrolü yerel olarak çalıştırır. Güvenilmeyen depo araçlarını asla yerel olarak
çalıştırmayın. Daha büyük test paketleri, tür denetimi/lint dağılımı içeren
değişiklik kapıları, derlemeler, Docker, paket hatları, E2E, canlı kanıt ve
platformlar arası doğrulama, Crabbox üzerinden uzaktan çalıştırılır. Güvenilir
bakımcıların yoğun kanıt işlemleri varsayılan olarak Blacksmith Testbox kullanır.
Yapılandırılan Testbox iş akışı kimlik bilgilerini yüklediğinden, güvenilmeyen
katkıda bulunan veya fork kodu bunun yerine gizli bilgi içermeyen fork CI ya da
yalıtılmış doğrudan AWS Crabbox kullanmalıdır.

Öngörülen işler için önceden ısıtma yapmayın. İlk yoğun komut hazır olduğunda
arka ucu gecikmeli olarak edinin, döndürülen `tbx_...` kimliğini sonraki yoğun
komutlarda yeniden kullanın, her çalıştırmada geçerli checkout'u eşitleyin ve
devretmeden önce durdurun.

İlk başarılı yeniden kullanımdan sonra sarmalayıcı, kiralamanın taban,
bağımlılık ve Testbox iş akışı parmak izini `.crabbox/testbox-leases/` altında
kaydeder. Yalnızca kaynak kodu içeren düzenlemeler, ısıtılmış kutuyu yeniden
kullanmaya devam eder. Değişen birleştirme tabanı, kilit dosyası, paket
yöneticisi girdisi, sarmalayıcı veya Testbox iş akışı kapalı biçimde başarısız
olur ve yeni bir kiralama gerektirir. Her çalıştırma yine de geçerli checkout'u
eşitler.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` yalnızca kasıtlı tanılamalar içindir, sürüm
kanıtı için değildir.

Aşağıdaki yerel test komutları insan iş akışları ve sınırlandırılmış agent
kanıtı içindir. Uzak sağlayıcının kullanılamaması bildirilmelidir; bu durum,
geniş kapsamlı bir yerel kapıyı sessizce çalıştırma izni vermez.

Güvenilmeyen yoğun kanıt için `--provider aws` ile gecikmeli olarak ısıtın. Her çalıştırma
`CRABBOX_ENV_ALLOW=CI` değerini ayarlamalı, `--provider aws --no-hydrate` geçirmeli ve
bağımlılıkları kurmadan ya da testleri çalıştırmadan önce yeni bir geçici uzak
`HOME` kullanmalıdır. Bu güvenilmeyen kaynağa ayrılmış, yeni ısıtılmış bir
kiralama kullanın; güvenilir veya daha önce kimlik bilgileri yüklenmiş bir
kiralamayı asla yeniden kullanmayın. Temiz ve güvenilir bir `main`
checkout'undan kurulu, güvenilir bir Crabbox ikili dosyasını başlatın ve yalnızca
uzak PR'ı `--fresh-pr` ile getirin; güvenilmeyen checkout'un sarmalayıcısını veya
yapılandırmasını asla yerel olarak çalıştırmayın.
`CRABBOX_AWS_INSTANCE_PROFILE` ayarını kaldırın ve çözümlenen
`aws.instanceProfile` boş olmadığı sürece kapalı biçimde başarısız olun. Herhangi bir
kurulum/test öncesinde, IMDSv2 belirteci gerektirmek, IAM kimlik bilgileri uç
noktasının 404 döndürdüğünü kanıtlamak ve uzak `git rev-parse HEAD` değerinin
incelenen PR başının tam SHA'sına eşit olduğunu doğrulamak için güvenilir mutlak
yollu araçlar kullanın. Kiralamayı bu SHA'ya bağlayın ve baş değiştiğinde
durdurup yeniden ısıtın. Temiz `main` içinden güvenilir
`scripts/crabbox-untrusted-bootstrap.sh` dosyasını `--fresh-pr` ile birlikte yükleyin; bu dosya sabitlenmiş
Node/pnpm sürümlerini kurar, SHA'yı ve paket yöneticisi sabitlemesini doğrular,
`HOME` öğesini yalıtır, bağımlılıkları kurar ve ardından istenen testi
çalıştırır. Aracı, rol olmadığını kanıtlayamazsa veya uzak PR yoksa gizli bilgi
içermeyen fork CI kullanın. `hydrate-github`, `--no-sync` veya kimlik
bilgileri yüklenmiş bir Testbox iş akışı kullanmayın.
Tüm `CRABBOX_TAILSCALE*` geçersiz kılmalarını kaldırın, `--network public
--tailscale=false` kullanımını zorunlu
kılın, çıkış düğümü/LAN bayraklarını temizleyin ve herhangi bir betiği yüklemeden
önce `crabbox inspect` çıktısının Tailscale durumu olmadan genel ağ kullanımını
bildirmesini zorunlu kılın.

## Rutin yerel sıra

1. Değişiklik kapsamlı Vitest kanıtı için `pnpm test:changed`.
2. Tek bir dosya, dizin veya açık hedef için `pnpm test <path-or-filter>`.
3. Yalnızca tam yerel Vitest paketine kasıtlı olarak ihtiyaç duyduğunuzda `pnpm test`.

Bir Codex çalışma ağacında veya bağlı/seyrek checkout'ta agent'lar doğrudan
yerel `pnpm test*` / `pnpm check*` / `pnpm crabbox:run` kullanımından kaçınır:

- Hazır bağımlılıklarla sınırlandırılmış odaklı kanıt:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Önce sınıflandırılan değişiklik kontrolü: `node scripts/check-changed.mjs`; yalnızca doküman,
  değişiklik olmayan ve küçük meta veri planları bağımlılıklar hazır olduğunda
  yerel kalırken, yoğun veya bağımlılıkları eksik planlar Testbox'a devredilir.
- Açıkça tutulan kiralamayla geniş kapsamlı kanıt: pnpm'nin Testbox içinde çalışması için `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`.
- Sarmalayıcının son `exitCode` değeri ve zamanlama JSON'u komut sonucudur. Devredilmiş bir Blacksmith GitHub Actions çalıştırması, Testbox canlı tutma eyleminin dışından durdurulduğu için başarılı bir SSH komutundan sonra `cancelled` gösterebilir; bunu hata olarak değerlendirmeden önce sarmalayıcı özetini ve komut çıktısını kontrol edin.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: `pnpm check:changed` ve hedefli `pnpm test ...` gibi komutlarda yoğun kontrol serileştirmesini Git ortak dizini yerine geçerli çalışma ağacının içinde tutar. Yalnızca yüksek kapasiteli yerel ana makinelerde, bağlı çalışma ağaçları arasında bağımsız kontrolleri kasıtlı olarak çalıştırdığınızda kullanın.

## Temel komutlar

Test sarmalayıcısı çalıştırmaları kısa bir `[test] passed|failed|skipped ... in ...` özetiyle sona erer; Vitest'in kendi süre satırı parça başına ayrıntı olarak kalır.

| Komut                                             | İşlevi                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | Açık dosya/dizin hedefleri, kapsamlı Vitest hatları üzerinden yönlendirilir. Hedefsiz çalıştırmalar tam paket kanıtıdır: sabit parça grupları, yerel paralel çalıştırma için yaprak yapılandırmalara genişletilir ve beklenen parça dağılımı başlamadan önce yazdırılır. Uzantı grubu, tek bir dev kök proje işlemi yerine her zaman uzantı başına parça yapılandırmalarına genişletilir. |
| `pnpm test:changed`                               | Düşük maliyetli akıllı değiştirilmiş test çalıştırması: doğrudan test düzenlemelerinden, kardeş `*.test.ts` dosyalarından, açık kaynak eşlemelerinden ve yerel içe aktarma grafiğinden kesin hedefler belirler. Geniş/yapılandırma/paket değişiklikleri, kesin testlerle eşlenmedikçe atlanır.                                                                                      |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Açık geniş kapsamlı değiştirilmiş test çalıştırması; bir test düzeneği/yapılandırma/paket düzenlemesinin Vitest'in daha geniş değiştirilmiş test davranışına geri dönmesi gerektiğinde kullanın.                                                                                                                                                                  |
| `pnpm test:force`                                 | Yapılandırılmış OpenClaw Gateway bağlantı noktasını (varsayılan `18789`) boşaltır, ardından sunucu testlerinin çalışan bir örnekle çakışmaması için tam paketi yalıtılmış bir Gateway bağlantı noktasıyla çalıştırır.                                                                                                                                           |
| `pnpm test:coverage`                              | Varsayılan birim hattı (`vitest.unit.config.ts`) için bilgilendirici bir V8 kapsam raporu oluşturur; kapsam eşikleri uygulanmaz.                                                                                                                                                                                                                                   |
| `pnpm test:coverage:changed`                      | Yalnızca `origin/main` tarihinden beri değişen dosyalar için birim kapsamı.                                                                                                                                                                                                                                                                                     |
| `pnpm changed:lanes`                              | `origin/main` ile karşılaştırılan farkın tetiklediği mimari hatları gösterir.                                                                                                                                                                                                                                                                                   |
| `pnpm check:changed`                              | Çalıştırmayı seçmeden önce değişen hatları sınıflandırır. Yalnızca doküman, değişiklik olmayan ve küçük meta veri planları bağımlılıklar hazır olduğunda yerel kalır; tür denetimi/lint dağılımı, diğer yoğun hatlar veya eksik yerel bağımlılıklar içeren planlar CI dışında Crabbox/Testbox'a devredilir. Vitest çalıştırmaz; test kanıtı için `pnpm test:changed` veya `pnpm test <target>` kullanın. |

## Paylaşılan test durumu ve işlem yardımcıları

- `src/test-utils/openclaw-test-state.ts`: bir test yalıtılmış bir `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, yapılandırma fikstürü, çalışma alanı, agent dizini veya kimlik doğrulama profili deposu gerektirdiğinde Vitest içinden kullanın.
- `pnpm test:env-mutations:report`: `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` veya ilgili ortam anahtarlarını doğrudan değiştiren testlerin/düzeneklerin engellemesiz raporu. Paylaşılan test durumu yardımcısı için geçiş adaylarını bulmak üzere kullanın.
- `test/helpers/openclaw-test-instance.ts`: çalışan bir Gateway, CLI ortamı, günlük yakalama ve temizlemeyi tek bir yerde gerektiren işlem düzeyinde E2E testleri.
- `scripts/lib/docker-e2e-image.sh` dosyasını kaynak olarak alan Docker/Bash E2E hatları, `docker_e2e_test_state_shell_b64 <label> <scenario>` değerini konteynere geçirebilir ve `scripts/lib/openclaw-e2e-instance.sh` ile çözebilir; çoklu ana dizin betikleri `docker_e2e_test_state_function_b64` değerini geçirebilir ve her akışta `openclaw_test_state_create <label> <scenario>` çağırabilir. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json`, kaynak olarak alınabilir bir ana makine ortam dosyası yazar (`create` öncesindeki `--`, yeni Node çalışma zamanlarının `--env-file` değerini bir Node bayrağı olarak değerlendirmesini önler). Gateway başlatan hatlar; giriş noktası çözümleme, sahte OpenAI başlatma, ön plan/arka plan başlatma, hazır olma yoklamaları, durum ortamını dışa aktarma, günlük dökümleri ve işlem temizliği için `scripts/lib/openclaw-e2e-instance.sh` dosyasını kaynak olarak alabilir.

## Control UI, TUI ve uzantı hatları

- **Sahte Control UI E2E:** `pnpm test:ui:e2e`, Vite Control UI'yi başlatan ve sahte bir Gateway WebSocket'e karşı gerçek bir Chromium sayfasını yönlendiren Vitest + Playwright hattını çalıştırır. Testler `ui/src/**/*.e2e.test.ts` içinde; paylaşılan sahte nesneler/denetimler `ui/src/test-helpers/control-ui-e2e.ts` içinde bulunur. `pnpm test:e2e` bu hattı içerir. Hedefli doğrulama dahil olmak üzere Agent çalıştırmaları varsayılan olarak Testbox/Crabbox kullanır; `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` yalnızca açıkça belirtilen yerel bir geri dönüş için kullanılmalıdır.
- **TUI PTY testleri:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts`, hızlı sahte arka uç PTY hattını çalıştırır. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` veya `pnpm tui:pty:test:watch --mode local`, yalnızca harici model uç noktasını taklit eden daha yavaş `tui --local` duman testini çalıştırır. Ham ANSI anlık görüntüleri yerine kararlı görünür metni veya fikstür çağrılarını doğrulayın.
- `pnpm test:extensions` ve `pnpm test extensions`, tüm uzantı/plugin parçalarını çalıştırır. Ağır kanal plugin'leri, tarayıcı plugin'i ve OpenAI özel parçalar olarak çalışır; diğer plugin grupları toplu olarak kalır. `pnpm test extensions/<id>`, tek bir paketlenmiş plugin hattını çalıştırır.
- Kardeş testleri bulunan kaynak dosyalar, daha geniş dizin globlarına geri dönmeden önce bu kardeş testlerle eşleştirilir. `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` ve `src/plugins/contracts` altındaki yardımcı düzenlemeleri, bağımlılık yolu kesin olduğunda her parçayı geniş kapsamlı çalıştırmak yerine içe aktaran testleri çalıştırmak için yerel bir içe aktarma grafiği kullanır.
- Sözleşme dizini hedefleri kendi sözleşme hatlarına dağıtılır: genel `channels`/`plugins` projeleri `contracts/**` öğesini hariç tuttuğundan, `pnpm test src/channels/plugins/contracts` dört kanal sözleşmesi yapılandırmasını, `pnpm test src/plugins/contracts` ise plugin sözleşmeleri yapılandırmasını çalıştırır.
- `auto-reply`, yanıt test düzeneğinin daha hafif üst düzey durum/token/yardımcı testlerine baskın gelmemesi için üç özel yapılandırmaya (`core`, `top-level`, `reply`) ayrılır.
- Seçilen `plugin-sdk` ve `commands` test dosyaları, yalnızca `test/setup.ts` öğesini tutan özel hafif hatlar üzerinden yönlendirilir; çalışma zamanı açısından ağır durumlar mevcut hatlarında bırakılır.
- Temel Vitest yapılandırması varsayılan olarak `pool: "threads"` ve `isolate: false` kullanır; paylaşılan yalıtılmamış çalıştırıcı repo yapılandırmalarının tamamında etkindir.
- `pnpm test:channels`, `vitest.channels.config.ts` öğesini çalıştırır.

## Gateway ve E2E

- Gateway entegrasyonu isteğe bağlıdır: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` veya `pnpm test:gateway`.
- `pnpm test:e2e`: repo E2E toplamı = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: Gateway uçtan uca duman testleri (çoklu örnek WS/HTTP/Node eşleştirmesi). `vitest.e2e.config.ts` içindeki uyarlanabilir işçilerle varsayılan olarak `threads` + `isolate: false` kullanır; `OPENCLAW_E2E_WORKERS=<n>` ile ayarlayın, ayrıntılı günlükler için `OPENCLAW_E2E_VERBOSE=1` kullanın.
- `pnpm test:live`: sağlayıcı canlı testleri (Claude/Minimax/DeepSeek/z.ai/vb., `*.live.test.ts` tarafından denetlenir). Atlamayı kaldırmak için API anahtarları ve `LIVE=1` (veya `OPENCLAW_LIVE_TEST=1`) gerekir; ayrıntılı çıktı için `OPENCLAW_LIVE_TEST_QUIET=0` kullanılır.

## Tam Docker paketi (`pnpm test:docker:all`)

Paylaşılan canlı test imajını oluşturur, OpenClaw'ı bir npm tarball'ı olarak bir kez paketler, yalın bir Node/Git çalıştırıcı imajı ile bu tarball'ı `/app` içine yükleyen işlevsel bir imajı oluşturur/yeniden kullanır ve ardından Docker duman testi hatlarını ağırlıklı bir zamanlayıcı aracılığıyla çalıştırır. `scripts/package-openclaw-for-docker.mjs`, tek yerel/CI paketleyicisidir ve Docker tarball'ı kullanmadan önce tarball'ı ve `dist/postinstall-inventory.json` öğesini doğrular.

- Yalın imaj (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): yükleyici/güncelleme/plugin bağımlılığı hatları; kopyalanmış repo kaynakları yerine önceden oluşturulmuş tarball'ı bağlar.
- İşlevsel imaj (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): normal oluşturulmuş uygulama işlevselliği hatları.
- Hat tanımları: `scripts/lib/docker-e2e-scenarios.mjs`. Planlayıcı: `scripts/lib/docker-e2e-plan.mjs`. Yürütücü: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json`, Docker'ı oluşturmadan veya çalıştırmadan zamanlayıcının sahip olduğu CI planını (hatlar, imaj türleri, paket/canlı imaj gereksinimleri, durum senaryoları, kimlik bilgisi denetimleri) üretir.

Zamanlama ayarları (ortam değişkenleri, varsayılanlar parantez içinde):

| Ortam değişkeni                                                                                                 | Varsayılan          | Amaç                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | İşlem yuvaları.                                                                                                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | Sağlayıcıya duyarlı kuyruk havuzu.                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | Ağır canlı sağlayıcı hattı üst sınırı.                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | npm kaynağı hattı üst sınırı.                                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | Hizmet kaynağı hattı üst sınırı.                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | Sağlayıcı başına ağır hat üst sınırları.                                                                                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | Sağlayıcı başına daha dar üst sınırlar.                                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | Daha büyük ana makineler için geçersiz kılma.                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | Hat başlatmaları arasındaki gecikme; yerel Docker daemon oluşturma fırtınalarını önler.                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 dk)  | Hat başına geri dönüş zaman aşımı; seçilen canlı/kuyruk hatları daha sıkı üst sınırlar kullanır.                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | Geçici canlı sağlayıcı hataları için yeniden denemeler.                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | kapalı              | Docker'ı çalıştırmadan hat manifestini yazdırır.                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | Etkin hat durumunu yazdırma aralığı.                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | açık                | En uzundan en kısaya sıralama için `.artifacts/docker-tests/lane-timings.json` öğesini yeniden kullanır; devre dışı bırakmak için `0` olarak ayarlayın.                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | Yalnızca belirlenimci/yerel hatlar için `skip`, yalnızca canlı sağlayıcı hatları için `only`. Diğer adlar: `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. Yalnızca canlı modu, sağlayıcı kovalarının Claude/Codex/Gemini işlerini birlikte paketlemesi için ana ve kuyruk canlı hatlarını en uzundan en kısaya sıralanmış tek bir havuzda birleştirir. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | CLI arka ucu Docker kurulum zaman aşımı.                                                                                                                                                                                                                                                   |

Kaynak üst sınırlarına yönelik ortam değişkeni kalıbı `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` şeklindedir (kaynak adı büyük harfe dönüştürülür, alfasayısal olmayan karakterler `_` biçiminde daraltılır).

Diğer davranışlar: çalıştırıcı varsayılan olarak Docker ön denetimini gerçekleştirir, eski OpenClaw E2E konteynerlerini temizler, uyumlu hatlar arasında sağlayıcı CLI aracı önbelleklerini paylaşır ve `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` ayarlanmadığı sürece ilk hatadan sonra yeni havuzlanmış hatları zamanlamayı durdurur. Bir hat, düşük paralellikli bir ana makinede etkin ağırlık/kaynak sınırını aşarsa yine de boş bir havuzdan başlayabilir ve kapasiteyi serbest bırakana kadar tek başına çalışabilir. Hat başına günlükler, `summary.json`, `failures.json` ve aşama zamanlamaları `.artifacts/docker-tests/<run-id>/` altında yazılır; yavaş hatları incelemek için `pnpm test:docker:timings <summary.json>`, düşük maliyetli hedefli yeniden çalıştırma komutlarını yazdırmak için `pnpm test:docker:rerun <run-id|summary.json|failures.json>` kullanın.

### Dikkate değer Docker hatları

| Komut                                                                     | Doğruladıkları                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Ham CDP + yalıtılmış Gateway içeren Chromium destekli kaynak E2E konteyneri; `browser doctor --deep` CDP rol anlık görüntüleri bağlantı URL'lerini, imleçle tıklanabilir hâle getirilen öğeleri, iframe referanslarını ve çerçeve meta verilerini içerir.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:skill-install`                                            | Paketlenmiş tarball'ı `skills.install.allowUploadedArchives: false` ile yalın bir Docker çalıştırıcısına kurar, canlı ClawHub aramasından güncel bir skill slug'ını çözümler, `openclaw skills install` aracılığıyla kurar ve `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` ile `skills info --json` öğelerini doğrular.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Odaklanmış CLI arka uç canlı yoklamaları; Gemini için eşleşen `:resume` ve `:mcp` takma adları vardır.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:docker:openwebui`                                                | Docker üzerinde OpenClaw + Open WebUI: oturum açar, `/api/models` öğesini denetler ve `/api/chat/completions` üzerinden gerçek bir vekilli sohbet çalıştırır. Kullanılabilir bir canlı model anahtarı gerektirir ve harici bir imaj çeker; birim/e2e paketleri gibi CI açısından kararlı olması beklenmez.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:mcp-channels`                                             | Başlangıç verileri yüklenmiş Gateway konteyneri ve `openclaw mcp serve` başlatan bir istemci konteyneri: yönlendirilmiş konuşma keşfi, transkript okumaları, ek meta verileri, canlı olay kuyruğu davranışı, giden gönderim yönlendirmesi ve gerçek stdio köprüsü üzerinden Claude tarzı kanal + izin bildirimleri (sav doğrudan ham stdio MCP çerçevelerini okur).                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm test:docker:upgrade-survivor`                                         | Paketlenmiş tarball'ı eski bir kullanıcıya ait kirli bir fikstür üzerine kurar; canlı sağlayıcı/kanal anahtarları olmadan paket güncellemesini ve etkileşimsiz doctor işlemini çalıştırır; geri döngü Gateway'i başlatır; aracılar/kanal yapılandırması/Plugin izin listeleri/çalışma alanı/oturum dosyaları/eski Plugin bağımlılık durumu/başlangıç/RPC durumunun korunduğunu denetler.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:published-upgrade-survivor`                               | Varsayılan olarak `openclaw@latest` kurar, gerçekçi mevcut kullanıcı dosyalarını başlangıç verileriyle doldurur, yerleşik bir `openclaw config set` tarifiyle yapılandırır, paketlenmiş tarball'a günceller, etkileşimsiz doctor işlemini çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar ve `/healthz`, `/readyz` ile RPC durumunu denetler. `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile geçersiz kılın, `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile bir matrisi genişletin veya `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` ile senaryo fikstürleri ekleyin (`configured-plugin-installs` ve `stale-source-plugin-shadow` dâhildir). Paket Kabulü bunları `published_upgrade_survivor_baseline(s)` / `_scenarios` olarak sunar ve `last-stable-4` veya `all-since-2026.4.23` gibi meta belirteçleri çözümler. |
| `pnpm test:docker:update-migration`                                         | `plugin-deps-cleanup` senaryosunda yayımlanmış yükseltmeden sonra korunumu doğrulayan test düzeneği; varsayılan olarak `openclaw@2026.4.23` sürümünden başlar. `Update Migration` iş akışı, Tam Sürüm CI dışında yapılandırılmış Plugin bağımlılık temizliğini kanıtlamak için bunu `baselines=all-since-2026.4.23` ile genişletir.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:plugins`                                                  | Yerel yol, `file:`, yukarı taşınmış bağımlılıklara sahip npm kayıt defteri paketleri, hareketli git referansları, ClawHub fikstürleri, pazar yeri güncellemeleri ve Claude paketini etkinleştirme/inceleme için kurulum/güncelleme duman testi.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## Yerel PR geçidi

Yerel PR birleştirme/geçit denetimleri için şunları çalıştırın:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` yüklü bir ana makinede kararsız sonuç verirse bunu regresyon olarak değerlendirmeden önce bir kez yeniden çalıştırın, ardından `pnpm test <path/to/test>` ile yalıtın. Belleği kısıtlı ana makineler için:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Test performansı araçları

- `pnpm test:perf:imports`: açık dosya/dizin hedefleri için kapsamlı hat yönlendirmesini kullanmaya devam ederken Vitest içe aktarma süresi + içe aktarma dökümü raporlamasını etkinleştirir. `pnpm test:perf:imports:changed`, aynı profillemeyi `origin/main` tarihinden beri değişen dosyalarla sınırlar.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş değişiklik modundaki yolu aynı kaydedilmiş git farkı için yerel kök proje çalıştırmasıyla karşılaştırmalı olarak ölçer; `pnpm test:perf:changed:bench -- --worktree`, önce kaydetmeden mevcut çalışma ağacı değişiklik kümesini karşılaştırmalı olarak ölçer.
- `pnpm test:perf:profile:main`, Vitest ana iş parçacığı için bir CPU profili yazar (`.artifacts/vitest-main-profile`); `pnpm test:perf:profile:runner`, birim çalıştırıcısı için CPU + yığın profilleri yazar (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: her tam paket Vitest yaprak yapılandırmasını seri olarak çalıştırır ve gruplandırılmış süre verilerinin yanı sıra yapılandırma başına JSON/günlük eserleri yazar. Tam paket raporları, önceki dosyalardan kalan modül grafiklerinin ve GC duraklamalarının sonraki savlara yüklenmemesi için varsayılan olarak dosyaları yalıtır; `-- --no-isolate` parametresini yalnızca paylaşımlı çalışan birikimini bilinçli olarak profillerken geçirin. Test Performansı Aracısı, yavaş test düzeltmelerini denemeden önce bunu temel çizgi olarak kullanır. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`, performans odaklı bir değişiklikten sonra gruplandırılmış raporları karşılaştırır.
- Tam, uzantı ve içerme deseni parça çalıştırmaları `.artifacts/vitest-shard-timings.json` içindeki yerel zamanlama verilerini günceller; sonraki tüm yapılandırma çalıştırmaları, yavaş ve hızlı parçaları dengelemek için bu zamanlamaları kullanır. İçerme deseni CI parçaları, filtrelenmiş parça zamanlamalarını tüm yapılandırma zamanlama verilerinin yerine koymadan görünür tutmak için parça adını zamanlama anahtarına ekler. Yerel zamanlama eserini yok saymak için `OPENCLAW_TEST_PROJECTS_TIMINGS=0` ayarlayın.

## Karşılaştırmalı ölçümler

<Accordion title="Model gecikmesi (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

İsteğe bağlı ortam değişkenleri: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`. Varsayılan istem: "Tek bir kelimeyle yanıt ver: ok. Noktalama işareti veya ek metin kullanma."

</Accordion>

<Accordion title="CLI başlangıcı (scripts/bench-cli-startup.ts)">

```bash
pnpm test:startup:bench
pnpm test:startup:bench:smoke
pnpm test:startup:bench:save
pnpm test:startup:bench:update
pnpm test:startup:bench:check
pnpm tsx scripts/bench-cli-startup.ts --runs 12
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3
pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all
```

Önayarlar:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: iki önayarın birleşimi

Çıktı; komut başına `sampleCount`, ortalama, p50, p95, min/maks, çıkış kodu/sinyal dağılımı ve maksimum RSS değerlerini içerir. `--cpu-prof-dir` / `--heap-prof-dir`, her çalıştırma için V8 profilleri yazar.

Kaydedilen çıktı: `pnpm test:startup:bench:smoke`, `.artifacts/cli-startup-bench-smoke.json` dosyasını; `pnpm test:startup:bench:save` ise `.artifacts/cli-startup-bench-all.json` dosyasını (`runs=5 warmup=1`) yazar. Depoya eklenmiş fikstür: `test/fixtures/cli-startup-bench.json`; `pnpm test:startup:bench:update` tarafından yenilenir ve `pnpm test:startup:bench:check` tarafından karşılaştırılır.

</Accordion>

<Accordion title="Gateway başlatma (scripts/bench-gateway-startup.ts)">

Varsayılan olarak `dist/entry.js` konumundaki derlenmiş CLI girişini kullanır; önce `pnpm build` komutunu çalıştırın. Bunun yerine kaynak çalıştırıcısını ölçmek için `--entry scripts/run-node.mjs` iletin ve bu sonuçları derlenmiş giriş temel değerlerinden ayrı tutun.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

Durum kimlikleri: `default`, `skipChannels` (kanal başlatma atlanır), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 manifest Plugin'i), `fiftyStartupLazyPlugins` (başlatmada tembel yüklenen 50 manifest Plugin'i).

Çıktı; ilk işlem çıktısını, `/healthz`, `/readyz`, HTTP dinleme günlüğü süresini, Gateway hazır günlüğü süresini, CPU süresini, CPU çekirdeği oranını, maksimum RSS'yi, heap'i, başlatma izleme metriklerini, olay döngüsü gecikmesini ve Plugin arama tablosunun ayrıntılı metriklerini içerir. Betik, alt Gateway ortamında `OPENCLAW_GATEWAY_STARTUP_TRACE=1` değerini ayarlar.

`/healthz` canlılık durumudur (HTTP sunucusu yanıt verebilir). `/readyz` kullanılabilir hazır olma durumudur (başlatma Plugin yardımcı işlemleri, kanallar ve ekleme sonrasında hazır olma açısından kritik işler tamamlanmıştır). Başlatma kancaları eşzamansız olarak gönderilir ve hazır olma garantisinin bir parçası değildir. Hazır günlüğü süresi, Gateway'in dahili zaman damgasıdır; işlem tarafı ilişkilendirmesi için kullanışlıdır ancak harici `/readyz` yoklamasının yerine geçmez.

Değişiklikleri karşılaştırırken JSON çıktısını veya `--output` kullanın. `--cpu-prof-dir` seçeneğini yalnızca izleme çıktısı, yalnızca aşama zamanlamalarının açıklayamadığı içe aktarma, derleme veya CPU'ya bağlı bir işi işaret ettikten sonra kullanın.

</Accordion>

<Accordion title="Gateway yeniden başlatma (scripts/bench-gateway-restart.ts)">

Yalnızca macOS ve Linux (işlem içi yeniden başlatmalar için SIGUSR1 kullanır; Windows'ta hemen başarısız olur). Yukarıdaki Gateway başlatmayla aynı derlenmiş giriş varsayılanını ve `--entry scripts/run-node.mjs` geçersiz kılmasını kullanır.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

Durum kimlikleri: `skipChannels`, `skipChannelsAcpxProbe` (ACPX başlatma yoklaması açık), `skipChannelsNoAcpxProbe` (yoklama kapalı), `default`, `fiftyPlugins`.

Çıktı; sonraki `/healthz`, sonraki `/readyz`, kesinti süresi, yeniden başlatmada hazır olma zamanlaması, CPU, RSS, yedek işlem için başlatma izleme metrikleri ile sinyal işleme, etkin işlerin tamamlanmasını bekleme, kapatma aşamaları, sonraki başlatma, hazır olma zamanlaması ve bellek anlık görüntülerine ilişkin yeniden başlatma izleme metriklerini içerir. Betik, `OPENCLAW_GATEWAY_STARTUP_TRACE=1` ve `OPENCLAW_GATEWAY_RESTART_TRACE=1` değerlerini ayarlar.

Bir değişiklik yeniden başlatma sinyallerini, kapatma işleyicilerini, yeniden başlatma sonrası başlatmayı, yardımcı işlem kapatmayı, hizmet devrini veya yeniden başlatma sonrası hazır olma durumunu etkiliyorsa bu kıyaslamayı kullanın. Gateway mekaniklerini kanal başlatmadan ayırmak için `skipChannels` ile başlayın; `default` veya Plugin yoğun durumları yalnızca dar kapsamlı durum yeniden başlatma yolunu açıkladıktan sonra kullanın. İzleme metrikleri ilişkilendirme ipuçlarıdır, kesin sonuçlar değildir — bir yeniden başlatma değişikliğini birden fazla örneğe, eşleşen sahip kapsamına, `/healthz`/`/readyz` davranışına ve kullanıcının gördüğü yeniden başlatma sözleşmesine göre değerlendirin.

</Accordion>

## İlk kurulum E2E'si (Docker)

İsteğe bağlıdır; yalnızca konteyner tabanlı ilk kurulum duman testleri için gereklidir. Temiz bir Linux konteynerinde tam soğuk başlatma akışı:

```bash
scripts/e2e/onboard-docker.sh
```

Etkileşimli sihirbazı sözde tty üzerinden çalıştırır, yapılandırma/çalışma alanı/oturum dosyalarını doğrular, ardından Gateway'i başlatır ve `openclaw health` komutunu çalıştırır.

## QR içe aktarma duman testi (Docker)

Bakımı yapılan QR çalışma zamanı yardımcısının desteklenen Docker Node çalışma zamanlarında (varsayılan Node 24, Node 22 ile uyumlu) yüklenmesini sağlar:

```bash
pnpm test:docker:qr
```

## İlgili

- [Testler](/tr/help/testing)
- [Canlı testler](/tr/help/testing-live)
- [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins)
