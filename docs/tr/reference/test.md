---
read_when:
    - Testleri çalıştırma veya düzeltme
summary: Testleri yerel olarak çalıştırma (vitest) ve force/coverage modlarını ne zaman kullanma
title: Testler
x-i18n:
    generated_at: "2026-07-12T12:14:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63806ea72da1579f4aa0b92c14a6d2d3e67990d6c10cb6d9b1b2bb4a63c8e140
    source_path: reference/test.md
    workflow: 16
---

- Eksiksiz test seti (paketler, canlı, Docker): [Test](/tr/help/testing)
- Güncelleme ve Plugin paketi doğrulaması: [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins)

## Agent varsayılanı

Agent oturumları, testleri ve hesaplama açısından yoğun doğrulamaları Crabbox
aracılığıyla uzaktan çalıştırır. Güvenilir bakım sorumlusu kodunda varsayılan olarak Blacksmith Testbox kullanılır.
Yapılandırılmış Testbox iş akışı kimlik bilgilerini yüklediğinden, güvenilmeyen katkıcı veya
çatallanmış depo kodu bunun yerine gizli bilgi içermeyen çatallanmış depo CI'ını ya da arındırılmış doğrudan AWS Crabbox'ı kullanmalıdır.

Güvenilir bir kod görevinin testlere veya kapsamlı kanıta ihtiyaç duyması olasıysa,
arka plandaki bir komut oturumunda hemen ön ısıtma başlatın, yükleme sürerken çalışmaya devam edin,
döndürülen `tbx_...` kimliğini yeniden kullanın, her çalıştırmada mevcut çalışma kopyasını eşitleyin ve
devretmeden önce durdurun:

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

İlk başarılı yeniden kullanımdan sonra sarmalayıcı, kiralamanın temelini,
bağımlılık ve Testbox iş akışı parmak izini `.crabbox/testbox-leases/` altında kaydeder.
Yalnızca kaynak kodu düzenlemeleri, önceden ısıtılmış kutuyu yeniden kullanmaya devam eder. Birleştirme tabanı, kilit dosyası,
paket yöneticisi girdisi, sarmalayıcı veya Testbox iş akışı değişirse işlem güvenli biçimde başarısız olur ve
yeni bir kiralama gerekir. Her çalıştırma yine de mevcut çalışma kopyasını eşitler.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` yalnızca kasıtlı tanılama içindir,
sürüm kanıtı için değildir.

Aşağıdaki yerel test komutları, insan iş akışları veya kullanıcının açıkça istediği
bir Agent geri dönüşü içindir. Uzak sağlayıcının kullanılamadığı bildirilmelidir; bu durum
kapsamlı bir yerel geçidin sessizce çalıştırılmasına izin vermez.

Güvenilmeyen kod için `--provider aws` ile ön ısıtma yapın. Her çalıştırmada
`CRABBOX_ENV_ALLOW=CI` ayarlanmalı, `--provider aws --no-hydrate` geçirilmeli ve
bağımlılıklar yüklenmeden ya da testler çalıştırılmadan önce yeni bir geçici uzak `HOME`
kullanılmalıdır. Bu güvenilmeyen kaynağa ayrılmış, yeni ısıtılmış bir kiralama kullanın; güvenilir
veya daha önce kimlik bilgileri yüklenmiş bir kiralamayı asla yeniden kullanmayın. Temiz ve güvenilir bir `main`
çalışma kopyasından kurulu güvenilir bir Crabbox ikili dosyası başlatın ve yalnızca uzak PR'ı
`--fresh-pr` ile getirin; güvenilmeyen çalışma kopyasının sarmalayıcısını veya yapılandırmasını asla yerel olarak çalıştırmayın.
`CRABBOX_AWS_INSTANCE_PROFILE` ayarını kaldırın ve çözümlenen
`aws.instanceProfile` boş değilse güvenli biçimde başarısız olun. Herhangi bir kurulum/test öncesinde, güvenilir
mutlak yollu araçlarla bir IMDSv2 belirteci zorunlu tutun, IAM kimlik bilgileri
uç noktasının 404 döndürdüğünü kanıtlayın ve uzaktaki `git rev-parse HEAD` değerinin incelenen
PR başının tam SHA değeriyle eşleştiğini doğrulayın. Kiralamayı bu SHA'ya bağlayın ve baş
değiştiğinde durdurup yeniden ısıtın. Temiz `main` üzerinden güvenilir
`scripts/crabbox-untrusted-bootstrap.sh` dosyasını `--fresh-pr` ile birlikte yükleyin; bu betik sabitlenmiş Node/pnpm sürümlerini kurar, SHA'yı
ve paket yöneticisi sabitlemesini doğrular, `HOME` ortamını yalıtır, bağımlılıkları kurar ve ardından
istenen testi çalıştırır. Aracı, rol olmadığını veya uzak PR bulunmadığını kanıtlayamazsa
gizli bilgi içermeyen çatallanmış depo CI'ını kullanın. `hydrate-github`, `--no-sync` veya
kimlik bilgileri yüklenmiş bir Testbox iş akışı kullanmayın.
Tüm `CRABBOX_TAILSCALE*` geçersiz kılmalarını kaldırın, `--network public
--tailscale=false` değerlerini zorunlu tutun, çıkış Node'u/LAN bayraklarını temizleyin ve herhangi bir betik yüklemeden önce
`crabbox inspect` çıktısının Tailscale durumu olmadan genel ağ kullanımını bildirmesini zorunlu tutun.

## Olağan yerel sıra

1. Değiştirilen kapsam için Vitest kanıtı amacıyla `pnpm test:changed`.
2. Tek bir dosya, dizin veya açık hedef için `pnpm test <path-or-filter>`.
3. Yalnızca tam yerel Vitest paketine bilinçli olarak ihtiyaç duyduğunuzda `pnpm test`.

Bir Codex çalışma ağacında veya bağlı/seyrek çalışma kopyasında Agent'lar doğrudan yerel
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run` kullanımından kaçınır:

- Kullanıcının açıkça istediği, küçük bir dosyaya yönelik yerel geri dönüş:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Değişiklik geçitleri veya kapsamlı kanıt: pnpm'in Testbox içinde çalışması için `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`.
- Sarmalayıcının son `exitCode` değeri ve zamanlama JSON'u komut sonucudur. Yetkilendirilmiş bir Blacksmith GitHub Actions çalıştırması, Testbox sürekli etkinlik eyleminin dışından durdurulduğu için başarılı bir SSH komutundan sonra `cancelled` gösterebilir; bunu hata olarak değerlendirmeden önce sarmalayıcı özetini ve komut çıktısını kontrol edin.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: `pnpm check:changed` ve hedefli `pnpm test ...` gibi komutlarda yoğun denetimlerin serileştirilmesini ortak Git dizini yerine mevcut çalışma ağacı içinde tutar. Bunu yalnızca bağlantılı çalışma ağaçlarında bağımsız denetimleri bilinçli olarak çalıştırdığınız yüksek kapasiteli yerel ana makinelerde kullanın.

## Temel komutlar

Test sarmalayıcı çalıştırmaları kısa bir `[test] passed|failed|skipped ... in ...` özetiyle sona erer; Vitest'in kendi süre satırı parça başına ayrıntı olarak kalır.

| Komut                                             | Ne yapar                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | Açık dosya/dizin hedefleri, kapsamlı Vitest hatları üzerinden yönlendirilir. Hedefsiz çalıştırmalar tam paket kanıtıdır: sabit parça grupları yerel paralel yürütme için yaprak yapılandırmalara genişletilir ve beklenen parça yayılımı başlatılmadan önce yazdırılır. Uzantı grubu, tek ve dev bir kök proje süreci yerine her zaman uzantı başına parça yapılandırmalarına genişletilir. |
| `pnpm test:changed`                               | Ucuz ve akıllı değiştirilmiş test çalıştırması: doğrudan test düzenlemelerinden, kardeş `*.test.ts` dosyalarından, açık kaynak eşlemelerinden ve yerel içe aktarma grafiğinden kesin hedefler belirler. Geniş kapsamlı/yapılandırma/paket değişiklikleri, kesin testlerle eşleşmedikçe atlanır.                                                                                                                     |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Açık kapsamlı değiştirilmiş test çalıştırmasıdır; bir test düzeneği/yapılandırma/paket düzenlemesinin Vitest'in daha kapsamlı değiştirilmiş test davranışına geri dönmesi gerektiğinde kullanın.                                                                                                                                                                                                              |
| `pnpm test:force`                                 | Yapılandırılmış OpenClaw Gateway bağlantı noktasını (varsayılan `18789`) serbest bırakır, ardından sunucu testlerinin çalışan bir örnekle çakışmaması için tam paketi yalıtılmış bir Gateway bağlantı noktasıyla çalıştırır.                                                                                                                                                                          |
| `pnpm test:coverage`                              | Varsayılan birim hattı (`vitest.unit.config.ts`) için bilgilendirici bir V8 kapsam raporu üretir; kapsam eşikleri uygulanmaz.                                                                                                                                                                                                                   |
| `pnpm test:coverage:changed`                      | Yalnızca `origin/main` sonrasında değiştirilen dosyalar için birim kapsamı.                                                                                                                                                                                                                                                                                             |
| `pnpm changed:lanes`                              | `origin/main` ile karşılaştırılan farkın tetiklediği mimari hatları gösterir.                                                                                                                                                                                                                                                                            |
| `pnpm check:changed`                              | CI dışında varsayılan olarak Crabbox/Testbox'a devreder, ardından uzak alt süreçte akıllı değişiklik denetimi geçidini çalıştırır: etkilenen hatlar için biçimlendirme, tür denetimi, lint ve koruma komutları. Vitest'i çalıştırmaz; test kanıtı için `pnpm test:changed` veya `pnpm test <target>` kullanın.                                                                      |

## Paylaşılan test durumu ve süreç yardımcıları

- `src/test-utils/openclaw-test-state.ts`: bir test yalıtılmış bir `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, yapılandırma fikstürü, çalışma alanı, Agent dizini veya kimlik doğrulama profili deposu gerektirdiğinde Vitest'ten kullanın.
- `pnpm test:env-mutations:report`: `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` veya ilgili ortam anahtarlarını doğrudan değiştiren testler/düzenekler hakkında engelleyici olmayan rapor. Paylaşılan test durumu yardımcısına geçiş adaylarını bulmak için kullanın.
- `test/helpers/openclaw-test-instance.ts`: çalışan bir Gateway, CLI ortamı, günlük yakalama ve temizliği tek bir yerde gerektiren süreç düzeyindeki uçtan uca testler.
- `scripts/lib/docker-e2e-image.sh` dosyasını kaynak olarak kullanan Docker/Bash uçtan uca hatları, kapsayıcıya `docker_e2e_test_state_shell_b64 <label> <scenario>` geçirebilir ve bunu `scripts/lib/openclaw-e2e-instance.sh` ile çözebilir; çoklu ana dizin betikleri `docker_e2e_test_state_function_b64` geçirebilir ve her akışta `openclaw_test_state_create <label> <scenario>` çağrısı yapabilir. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json`, kaynak olarak kullanılabilen bir ana makine ortam dosyası yazar (`create` öncesindeki `--`, yeni Node çalışma zamanlarının `--env-file` seçeneğini Node bayrağı olarak yorumlamasını önler). Gateway başlatan hatlar; giriş noktası çözümleme, sahte OpenAI başlatma, ön plan/arka plan başlatma, hazır olma yoklamaları, durum ortamını dışa aktarma, günlük dökümleri ve süreç temizliği için `scripts/lib/openclaw-e2e-instance.sh` dosyasını kaynak olarak kullanabilir.

## Control UI, TUI ve uzantı hatları

- **Sahte Control UI E2E:** `pnpm test:ui:e2e`, Vite Control UI'ı başlatan ve gerçek bir Chromium sayfasını sahte bir Gateway WebSocket'e karşı çalıştıran Vitest + Playwright hattını yürütür. Testler `ui/src/**/*.e2e.test.ts` altında; paylaşılan sahte nesneler/denetimler `ui/src/test-helpers/control-ui-e2e.ts` içinde bulunur. `pnpm test:e2e` bu hattı içerir. Hedefli doğrulama dâhil olmak üzere ajan çalıştırmaları varsayılan olarak Testbox/Crabbox kullanır; `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` komutunu yalnızca açıkça istenen yerel geri dönüş için kullanın.
- **TUI PTY testleri:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts`, hızlı sahte arka uç PTY hattını çalıştırır. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` veya `pnpm tui:pty:test:watch --mode local`, yalnızca harici model uç noktasını taklit eden daha yavaş `tui --local` duman testini çalıştırır. Ham ANSI anlık görüntüleri yerine kararlı görünür metni veya fikstür çağrılarını doğrulayın.
- `pnpm test:extensions` ve `pnpm test extensions`, tüm uzantı/Plugin parçalarını çalıştırır. Ağır kanal Plugin'leri, tarayıcı Plugin'i ve OpenAI özel parçalar olarak çalışır; diğer Plugin grupları toplu olarak kalır. `pnpm test extensions/<id>`, tek bir paketlenmiş Plugin hattını çalıştırır.
- Kardeş testleri bulunan kaynak dosyaları, daha geniş dizin globlarına geri dönmeden önce bu kardeş testle eşleştirilir. `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` ve `src/plugins/contracts` altındaki yardımcı düzenlemeleri, bağımlılık yolu kesin olduğunda her parçayı geniş kapsamlı biçimde çalıştırmak yerine içe aktaran testleri çalıştırmak için yerel bir içe aktarma grafiği kullanır.
- Sözleşme dizini hedefleri kendi sözleşme hatlarına dağıtılır: genel `channels`/`plugins` projeleri `contracts/**` öğesini hariç tuttuğundan, `pnpm test src/channels/plugins/contracts` dört kanal sözleşmesi yapılandırmasını, `pnpm test src/plugins/contracts` ise Plugin sözleşmeleri yapılandırmasını çalıştırır.
- `auto-reply`, yanıt test düzeneğinin daha hafif üst düzey durum/token/yardımcı testlerine baskın gelmemesi için üç özel yapılandırmaya (`core`, `top-level`, `reply`) ayrılır.
- Seçilen `plugin-sdk` ve `commands` test dosyaları, yalnızca `test/setup.ts` öğesini koruyan özel hafif hatlardan yönlendirilir; çalışma zamanı açısından ağır durumlar mevcut hatlarında kalır.
- Temel Vitest yapılandırmasının varsayılanları `pool: "threads"` ve `isolate: false` değerleridir; paylaşılan yalıtımsız çalıştırıcı depo genelindeki yapılandırmalarda etkindir.
- `pnpm test:channels`, `vitest.channels.config.ts` yapılandırmasını çalıştırır.

## Gateway ve E2E

- Gateway entegrasyonu isteğe bağlıdır: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` veya `pnpm test:gateway`.
- `pnpm test:e2e`: depo E2E toplamı = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: Gateway uçtan uca duman testleri (çoklu örnek WS/HTTP/Node eşleştirmesi). Varsayılan olarak `vitest.e2e.config.ts` içindeki uyarlanabilir işçilerle `threads` + `isolate: false` kullanır; `OPENCLAW_E2E_WORKERS=<n>` ile ayarlayın, ayrıntılı günlükleri `OPENCLAW_E2E_VERBOSE=1` ile etkinleştirin.
- `pnpm test:live`: sağlayıcı canlı testleri (Claude/Minimax/DeepSeek/z.ai/vb., `*.live.test.ts` ile denetlenir). Atlamayı kaldırmak için API anahtarları ve `LIVE=1` (veya `OPENCLAW_LIVE_TEST=1`) gerekir; ayrıntılı çıktı için `OPENCLAW_LIVE_TEST_QUIET=0` kullanın.

## Tam Docker paketi (`pnpm test:docker:all`)

Paylaşılan canlı test imajını oluşturur, OpenClaw'ı bir kez npm tarball'ı olarak paketler, yalın bir Node/Git çalıştırıcı imajının yanı sıra bu tarball'ı `/app` içine kuran işlevsel bir imajı oluşturur/yeniden kullanır ve ardından Docker duman testi hatlarını ağırlıklı bir zamanlayıcı üzerinden çalıştırır. `scripts/package-openclaw-for-docker.mjs`, tek yerel/CI paketleyicisidir ve Docker kullanmadan önce tarball'ı ve `dist/postinstall-inventory.json` dosyasını doğrular.

- Yalın imaj (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): kurucu/güncelleme/Plugin bağımlılığı hatları; kopyalanmış depo kaynakları yerine önceden oluşturulmuş tarball'ı bağlar.
- İşlevsel imaj (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): normal oluşturulmuş uygulama işlevselliği hatları.
- Hat tanımları: `scripts/lib/docker-e2e-scenarios.mjs`. Planlayıcı: `scripts/lib/docker-e2e-plan.mjs`. Yürütücü: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json`, Docker'ı oluşturmadan veya çalıştırmadan zamanlayıcının yönettiği CI planını (hatlar, imaj türleri, paket/canlı imaj gereksinimleri, durum senaryoları, kimlik bilgisi kontrolleri) üretir.

Zamanlama ayarları (ortam değişkenleri, varsayılanlar parantez içinde):

| Ortam değişkeni                                                                                                | Varsayılan          | Amaç                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | İşlem yuvaları.                                                                                                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | Sağlayıcıya duyarlı kuyruk sonu havuzu.                                                                                                                                                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | Ağır canlı sağlayıcı hattı sınırı.                                                                                                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | npm kaynak hattı sınırı.                                                                                                                                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | Hizmet kaynak hattı sınırı.                                                                                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | Sağlayıcı başına ağır hat sınırları.                                                                                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | Sağlayıcı başına daha dar sınırlar.                                                                                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | Daha büyük ana makineler için geçersiz kılma.                                                                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | Hat başlangıçları arasındaki gecikme; yerel Docker artalan sürecinde oluşturma fırtınalarını önler.                                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 dk)  | Hat başına geri dönüş zaman aşımı; seçilen canlı/kuyruk sonu hatları daha sıkı sınırlar kullanır.                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | Geçici canlı sağlayıcı hataları için yeniden deneme sayısı.                                                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | kapalı              | Docker'ı çalıştırmadan hat bildirimini yazdırır.                                                                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | Etkin hat durumunu yazdırma aralığı.                                                                                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | açık                | En uzundan başlayarak sıralama için `.artifacts/docker-tests/lane-timings.json` dosyasını yeniden kullanır; devre dışı bırakmak için `0` olarak ayarlayın.                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | Yalnızca belirlenimci/yerel hatlar için `skip`, yalnızca canlı sağlayıcı hatları için `only`. Takma adlar: `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. Yalnızca canlı modu, sağlayıcı kovalarının Claude/Codex/Gemini işlerini birlikte paketleyebilmesi için ana ve kuyruk sonu canlı hatlarını en uzundan başlayan tek bir havuzda birleştirir. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | CLI arka ucu Docker kurulum zaman aşımı.                                                                                                                                                                                                                                                                                                                  |

Kaynak sınırları için ortam değişkeni kalıbı `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` şeklindedir (kaynak adı büyük harfe dönüştürülür, alfasayısal olmayan karakterler `_` olarak birleştirilir).

Diğer davranışlar: çalıştırıcı varsayılan olarak Docker için ön kontrolleri gerçekleştirir, eski OpenClaw E2E konteynerlerini temizler, uyumlu hatlar arasında sağlayıcı CLI aracı önbelleklerini paylaşır ve `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` ayarlanmadığı sürece ilk hatadan sonra yeni havuzlanmış hatları zamanlamayı durdurur. Bir hat, düşük paralellikli bir ana makinede etkin ağırlık/kaynak sınırını aşarsa yine de boş bir havuzdan başlayabilir ve kapasiteyi serbest bırakana kadar tek başına çalışabilir. Hat başına günlükler, `summary.json`, `failures.json` ve aşama zamanlamaları `.artifacts/docker-tests/<run-id>/` altına yazılır; yavaş hatları incelemek için `pnpm test:docker:timings <summary.json>`, düşük maliyetli hedefli yeniden çalıştırma komutlarını yazdırmak için `pnpm test:docker:rerun <run-id|summary.json|failures.json>` kullanın.

### Dikkate değer Docker hatları

| Komut                                                                       | Doğruladıkları                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Ham CDP ve yalıtılmış Gateway içeren Chromium destekli kaynak E2E konteyneri; `browser doctor --deep` CDP rolü anlık görüntüleri bağlantı URL'lerini, imleçle tıklanabilir hâle getirilen öğeleri, iframe referanslarını ve çerçeve meta verilerini içerir.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `pnpm test:docker:skill-install`                                            | Paketlenmiş tarball dosyasını `skills.install.allowUploadedArchives: false` ayarıyla yalın bir Docker çalıştırıcısına kurar, canlı ClawHub aramasından güncel bir skill kısa adı çözümler, `openclaw skills install` aracılığıyla kurar ve `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` ile `skills info --json` sonuçlarını doğrular.                                                                                                                                                                                                                                                                                                                                                                                                            |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Odaklanmış CLI arka ucu canlı yoklamaları; Gemini için eşleşen `:resume` ve `:mcp` takma adları bulunur.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `pnpm test:docker:openwebui`                                                | Docker üzerinde OpenClaw + Open WebUI: oturum açar, `/api/models` uç noktasını denetler ve `/api/chat/completions` üzerinden gerçek bir vekilli sohbet çalıştırır. Kullanılabilir bir canlı model anahtarı gerektirir ve harici bir imaj çeker; birim/E2E paketleri kadar CI kararlı olması beklenmez.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:mcp-channels`                                             | Önceden veri eklenmiş Gateway konteyneri ile `openclaw mcp serve` başlatan bir istemci konteyneri: yönlendirilmiş konuşma keşfi, transkript okumaları, ek meta verileri, canlı olay kuyruğu davranışı, giden gönderim yönlendirmesi ve gerçek stdio köprüsü üzerinden Claude tarzı kanal ve izin bildirimleri (sav, ham stdio MCP çerçevelerini doğrudan okur).                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm test:docker:upgrade-survivor`                                         | Paketlenmiş tarball dosyasını eski bir kullanıcının kirli test düzeneğinin üzerine kurar; canlı sağlayıcı/kanal anahtarları olmadan paket güncellemesini ve etkileşimsiz doctor komutunu çalıştırır; local loopback Gateway başlatır; aracılar/kanal yapılandırması/Plugin izin listeleri/çalışma alanı/oturum dosyaları/eski Plugin bağımlılık durumu/başlatma/RPC durumunun korunduğunu denetler.                                                                                                                                                                                                                                                                                                                                                                |
| `pnpm test:docker:published-upgrade-survivor`                               | Varsayılan olarak `openclaw@latest` kurar, gerçekçi mevcut kullanıcı dosyaları ekler, yerleşik bir `openclaw config set` tarifiyle yapılandırır, paketlenmiş tarball dosyasına günceller, etkileşimsiz doctor komutunu çalıştırır, `.artifacts/upgrade-survivor/summary.json` dosyasını yazar ve `/healthz`, `/readyz` ile RPC durumunu denetler. `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile geçersiz kılın, `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile bir matrisi genişletin veya `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` ile senaryo test düzenekleri ekleyin (`configured-plugin-installs` ve `stale-source-plugin-shadow` dâhildir). Paket Kabulü bunları `published_upgrade_survivor_baseline(s)` / `_scenarios` olarak sunar ve `last-stable-4` veya `all-since-2026.4.23` gibi meta belirteçlerini çözümler. |
| `pnpm test:docker:update-migration`                                         | Varsayılan olarak `openclaw@2026.4.23` sürümünden başlayarak `plugin-deps-cleanup` senaryosunda yayımlanmış yükseltmeden sağ çıkma test düzeneği. `Update Migration` iş akışı, yapılandırılmış Plugin bağımlılık temizliğini Tam Sürüm CI dışında kanıtlamak için bunu `baselines=all-since-2026.4.23` ile genişletir.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm test:docker:plugins`                                                  | Yerel yol, `file:`, yükseltilmiş bağımlılıklara sahip npm kayıt defteri paketleri, hareketli git referansları, ClawHub test düzenekleri, pazar yeri güncellemeleri ve Claude paketini etkinleştirme/inceleme için kurulum/güncelleme duman testi.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

## Yerel PR geçidi

Yerel PR birleştirme/geçit denetimleri için şunları çalıştırın:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Yüklü bir ana makinede `pnpm test` kararsız biçimde başarısız olursa bunu regresyon olarak değerlendirmeden önce bir kez yeniden çalıştırın, ardından `pnpm test <path/to/test>` ile yalıtın. Belleği kısıtlı ana makineler için:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Test performansı araçları

- `pnpm test:perf:imports`: Açık dosya/dizin hedefleri için kapsamlı hat yönlendirmesini kullanmaya devam ederken Vitest içe aktarma süresi ve içe aktarma dökümü raporlamasını etkinleştirir. `pnpm test:perf:imports:changed`, aynı profil oluşturmayı `origin/main` sonrasında değiştirilen dosyalarla sınırlar.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş değişiklik modu yolunu aynı kaydedilmiş git farkı için yerel kök proje çalıştırmasıyla karşılaştırmalı olarak ölçer; `pnpm test:perf:changed:bench -- --worktree`, önce kaydetme yapmadan geçerli çalışma ağacındaki değişiklik kümesini karşılaştırmalı olarak ölçer.
- `pnpm test:perf:profile:main`, Vitest ana iş parçacığı için bir CPU profili (`.artifacts/vitest-main-profile`) yazar; `pnpm test:perf:profile:runner`, birim çalıştırıcısı için CPU ve öbek profilleri (`.artifacts/vitest-runner-profile`) yazar.
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: Her tam paket Vitest uç yapılandırmasını seri olarak çalıştırır ve gruplandırılmış süre verileriyle birlikte yapılandırma başına JSON/günlük yapıtları yazar. Tam paket raporları, önceki dosyalardan korunan modül grafikleri ve GC duraklamalarının sonraki doğrulamalara yüklenmemesi için dosyaları varsayılan olarak yalıtır; yalnızca paylaşılan çalışan birikimini kasıtlı olarak profillerken `-- --no-isolate` iletin. Test Performansı Aracısı, yavaş test düzeltmelerini denemeden önce bunu temel çizgisi olarak kullanır. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`, performans odaklı bir değişiklikten sonra gruplandırılmış raporları karşılaştırır.
- Tam, uzantı ve dahil etme deseni parça çalıştırmaları, `.artifacts/vitest-shard-timings.json` içindeki yerel zamanlama verilerini günceller; daha sonraki tüm yapılandırma çalıştırmaları, yavaş ve hızlı parçaları dengelemek için bu zamanlamaları kullanır. Dahil etme deseni CI parçaları, parça adını zamanlama anahtarına ekler; böylece filtrelenmiş parça zamanlamaları, tüm yapılandırmanın zamanlama verilerinin yerine geçmeden görünür kalır. Yerel zamanlama yapıtını yok saymak için `OPENCLAW_TEST_PROJECTS_TIMINGS=0` ayarlayın.

## Karşılaştırmalı ölçümler

<Accordion title="Model gecikmesi (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

İsteğe bağlı ortam değişkenleri: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`. Varsayılan istem: "Tek bir sözcükle yanıt ver: ok. Noktalama veya ek metin kullanma."

</Accordion>

<Accordion title="CLI başlatma (scripts/bench-cli-startup.ts)">

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

Ön ayarlar:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: iki ön ayarın birleşimi

Çıktı; `sampleCount`, ortalama, p50, p95, en düşük/en yüksek, çıkış kodu/sinyal dağılımı ve komut başına en yüksek RSS değerini içerir. `--cpu-prof-dir` / `--heap-prof-dir`, her çalıştırma için V8 profilleri yazar.

Kaydedilen çıktı: `pnpm test:startup:bench:smoke`, `.artifacts/cli-startup-bench-smoke.json` dosyasını; `pnpm test:startup:bench:save`, `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`) dosyasını yazar. Depoya kaydedilmiş sabit veri: `pnpm test:startup:bench:update` tarafından yenilenen ve `pnpm test:startup:bench:check` tarafından karşılaştırılan `test/fixtures/cli-startup-bench.json`.

</Accordion>

<Accordion title="Gateway başlatma (scripts/bench-gateway-startup.ts)">

Varsayılan olarak `dist/entry.js` konumundaki derlenmiş CLI girişini kullanır; önce `pnpm build` komutunu çalıştırın. Bunun yerine kaynak çalıştırıcısını ölçmek için `--entry scripts/run-node.mjs` iletin ve bu sonuçları derlenmiş giriş temel çizgilerinden ayrı tutun.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

Durum kimlikleri: `default`, `skipChannels` (kanal başlatma atlanır), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 manifest plugini), `fiftyStartupLazyPlugins` (başlatmada tembel yüklenen 50 manifest plugini).

Çıktı; ilk işlem çıktısını, `/healthz`, `/readyz`, HTTP dinleme günlüğü zamanını, Gateway hazır günlüğü zamanını, CPU süresini, CPU çekirdek oranını, en yüksek RSS değerini, öbeği, başlatma izleme metriklerini, olay döngüsü gecikmesini ve plugin arama tablosu ayrıntı metriklerini içerir. Betik, alt Gateway ortamında `OPENCLAW_GATEWAY_STARTUP_TRACE=1` ayarlar.

`/healthz`, canlılık göstergesidir (HTTP sunucusu yanıt verebilir). `/readyz`, kullanılabilir hazır olma durumudur (başlatma plugini yardımcı süreçleri, kanallar ve hazır olma açısından kritik bağlantı sonrası çalışmalar tamamlanmıştır). Başlatma kancaları eşzamansız olarak yürütülür ve hazır olma garantisinin parçası değildir. Hazır günlüğü zamanı, Gateway'in dahili zaman damgasıdır; işlem tarafında ilişkilendirme için kullanışlıdır ancak harici `/readyz` yoklamasının yerine geçmez.

Değişiklikleri karşılaştırırken JSON çıktısını veya `--output` seçeneğini kullanın. `--cpu-prof-dir` seçeneğini yalnızca izleme çıktısı, tek başına aşama zamanlamalarının açıklayamadığı içe aktarma, derleme veya CPU'ya bağımlı bir çalışmayı işaret ettikten sonra kullanın.

</Accordion>

<Accordion title="Gateway yeniden başlatma (scripts/bench-gateway-restart.ts)">

Yalnızca macOS ve Linux (işlem içi yeniden başlatmalar için SIGUSR1 kullanır; Windows'ta hemen başarısız olur). Yukarıdaki Gateway başlatmayla aynı derlenmiş giriş varsayılanını ve `--entry scripts/run-node.mjs` geçersiz kılmasını kullanır.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

Durum kimlikleri: `skipChannels`, `skipChannelsAcpxProbe` (ACPX başlatma yoklaması açık), `skipChannelsNoAcpxProbe` (yoklama kapalı), `default`, `fiftyPlugins`.

Çıktı; sonraki `/healthz` ve `/readyz` sonuçlarını, kesinti süresini, yeniden başlatmanın hazır olma zamanlamasını, CPU'yu, RSS'yi, yerine geçen işlemin başlatma izleme metriklerini ve sinyal işleme, etkin işin boşaltılması, kapatma aşamaları, sonraki başlatma, hazır olma zamanlaması ve bellek anlık görüntüleri için yeniden başlatma izleme metriklerini içerir. Betik, `OPENCLAW_GATEWAY_STARTUP_TRACE=1` ve `OPENCLAW_GATEWAY_RESTART_TRACE=1` ayarlar.

Bir değişiklik yeniden başlatma sinyallemesini, kapatma işleyicilerini, yeniden başlatma sonrası başlatmayı, yardımcı süreç kapatmayı, hizmet devrini veya yeniden başlatma sonrası hazır olma durumunu etkiliyorsa bu karşılaştırmalı ölçümü kullanın. Gateway işleyişini kanal başlatmadan yalıtmak için `skipChannels` ile başlayın; `default` veya plugin ağırlıklı durumları yalnızca dar kapsamlı durum yeniden başlatma yolunu açıkladıktan sonra kullanın. İzleme metrikleri ilişkilendirme ipuçlarıdır, kesin kararlar değildir — bir yeniden başlatma değişikliğini birden çok örneğe, eşleşen sahip kapsamına, `/healthz`/`/readyz` davranışına ve kullanıcıya görünür yeniden başlatma sözleşmesine göre değerlendirin.

</Accordion>

## İlk kullanım E2E'si (Docker)

İsteğe bağlıdır; yalnızca kapsayıcı tabanlı ilk kullanım duman testleri için gereklidir. Temiz bir Linux kapsayıcısında tam soğuk başlatma akışı:

```bash
scripts/e2e/onboard-docker.sh
```

Etkileşimli sihirbazı sözde tty üzerinden yönlendirir, yapılandırma/çalışma alanı/oturum dosyalarını doğrular, ardından Gateway'i başlatır ve `openclaw health` komutunu çalıştırır.

## QR içe aktarma duman testi (Docker)

Bakımı yapılan QR çalışma zamanı yardımcısının desteklenen Docker Node çalışma zamanlarında (varsayılan Node 24, uyumlu Node 22) yüklenmesini sağlar:

```bash
pnpm test:docker:qr
```

## İlgili

- [Test etme](/tr/help/testing)
- [Canlı test etme](/tr/help/testing-live)
- [Güncellemeleri ve pluginleri test etme](/tr/help/testing-updates-plugins)
