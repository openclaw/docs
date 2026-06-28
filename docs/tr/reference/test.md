---
read_when:
    - Testleri çalıştırma veya düzeltme
summary: Testler yerel olarak nasıl çalıştırılır (vitest) ve force/coverage modları ne zaman kullanılır
title: Testler
x-i18n:
    generated_at: "2026-06-28T01:17:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d1aed76ed59713ee320eb2d18dc8c392ea7a810096a0ef3131388001bbe5d8d
    source_path: reference/test.md
    workflow: 16
---

- Tam test kiti (paketler, canlı, Docker): [Test](/tr/help/testing)
- Güncelleme ve Plugin paketi doğrulaması: [Güncellemeleri ve Pluginleri test etme](/tr/help/testing-updates-plugins)

- Rutin yerel test sırası:
  1. Değişiklik kapsamlı Vitest kanıtı için `pnpm test:changed`.
  2. Tek dosya, dizin veya açık hedef için `pnpm test <path-or-filter>`.
  3. Yalnızca tam yerel Vitest paketine bilerek ihtiyaç duyduğunuzda `pnpm test`.
- `pnpm test:force`: Varsayılan kontrol portunu tutan kalmış Gateway işlemlerini sonlandırır, ardından çalışan bir örnekle sunucu testleri çakışmasın diye tam Vitest paketini yalıtılmış bir Gateway portuyla çalıştırır. Önceki bir Gateway çalıştırması 18789 portunu dolu bıraktığında bunu kullanın.
- `pnpm test:coverage`: Birim paketini V8 kapsamıyla (`vitest.unit.config.ts` üzerinden) çalıştırır. Bu, tüm repo tüm dosya kapsamı değil, varsayılan birim hattı kapsam kapısıdır. Eşikler satırlar/fonksiyonlar/ifadeler için %70 ve dallar için %55'tir. `coverage.all` false olduğundan ve varsayılan hat, kapsam içeriklerini kardeş kaynak dosyaları olan hızlı olmayan birim testleriyle sınırlandırdığından, kapı rastlantısal olarak yüklediği her geçişli import yerine bu hattın sahip olduğu kaynağı ölçer.
- `pnpm test:coverage:changed`: Birim kapsamını yalnızca `origin/main` sonrasında değişen dosyalar için çalıştırır.
- `pnpm test:changed`: ucuz akıllı değişiklik testi çalıştırması. Doğrudan test düzenlemelerinden, kardeş `*.test.ts` dosyalarından, açık kaynak eşlemelerinden ve yerel import grafiğinden kesin hedefleri çalıştırır. Geniş/config/paket değişiklikleri, kesin testlere eşlenmedikçe atlanır.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: açık geniş değişiklik testi çalıştırması. Bir test harness/config/paket düzenlemesi Vitest'in daha geniş değişiklik testi davranışına geri düşmeliyse bunu kullanın.
- `pnpm changed:lanes`: `origin/main` karşısındaki diff tarafından tetiklenen mimari hatları gösterir.
- `pnpm check:changed`: CI dışında varsayılan olarak Crabbox/Testbox'a devreder, ardından uzak çocuk içinde `origin/main` karşısındaki diff için akıllı değişiklik kontrol kapısını çalıştırır. Etkilenen mimari hatlar için typecheck, lint ve guard komutlarını çalıştırır, ancak Vitest testlerini çalıştırmaz. Test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` kullanın.
- Codex worktree'leri ve bağlı/sparse checkout'lar: pnpm'in bağımlılıkları uzlaştırmayacağını doğrulamadığınız sürece doğrudan yerel `pnpm test*`, `pnpm check*` ve `pnpm crabbox:run` komutlarından kaçının. Çok küçük açık dosya kanıtı için `node scripts/run-vitest.mjs <path-or-filter>` kullanın; değişiklik kapıları veya geniş kanıt için pnpm'in Testbox içinde çalışması amacıyla `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` kullanın.
- Testbox-through-Crabbox kanıtı: komut sonucu olarak wrapper'ın son `exitCode` değerini ve zamanlama JSON'unu kullanın. Yetkilendirilen Blacksmith GitHub Actions çalıştırması, başarılı bir SSH komutundan sonra `cancelled` gösterebilir çünkü Testbox keepalive action dışından durdurulur; bunu test hatası saymadan önce wrapper özetini ve komut çıktısını doğrulayın.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: `pnpm check:changed` ve hedefli `pnpm test ...` gibi komutlarda heavy-check serileştirmesini Git ortak dizini yerine geçerli worktree içinde tutar. Bunu yalnızca yüksek kapasiteli yerel hostlarda, bağlı worktree'ler arasında bağımsız kontrolleri bilerek çalıştırdığınızda kullanın.
- `pnpm test`: açık dosya/dizin hedeflerini kapsamlı Vitest hatları üzerinden yönlendirir. Hedefsiz çalıştırmalar tam paket kanıtıdır: sabit shard grupları kullanır, yerel paralel yürütme için leaf config'lere genişler ve başlamadan önce beklenen yerel shard fanout'unu yazdırır. Extension grubu her zaman tek dev bir root-project işlemi yerine extension başına shard config'lerine genişler.
- Test wrapper çalıştırmaları kısa bir `[test] passed|failed|skipped ... in ...` özetiyle biter. Vitest'in kendi süre satırı shard başına ayrıntı olarak kalır.
- Paylaşılan OpenClaw test durumu: Bir test yalıtılmış `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture, workspace, ajan dizini veya auth-profile deposuna ihtiyaç duyduğunda Vitest'ten `src/test-utils/openclaw-test-state.ts` kullanın.
- `pnpm test:env-mutations:report`: `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` veya ilgili OpenClaw env anahtarlarını doğrudan değiştiren testler ve harness'ler hakkında engellemeyen rapor. Paylaşılan test-state yardımcısına taşınacak adayları bulmak için kullanın.
- Control UI mocked E2E: Vite Control UI'yi başlatan ve mocked Gateway WebSocket'e karşı gerçek bir Chromium sayfasını süren Vitest + Playwright hattı için `pnpm test:ui:e2e` kullanın. Testler `ui/src/**/*.e2e.test.ts` içinde bulunur; paylaşılan mock'lar ve kontroller `ui/src/test-helpers/control-ui-e2e.ts` içinde bulunur. `pnpm test:e2e` bu hattı içerir. Codex worktree'lerinde, bağımlılıklar yüklendikten sonra çok küçük hedefli kanıt için `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts`, daha geniş GUI kanıtı için Testbox/Crabbox tercih edin.
- İşlem E2E yardımcıları: Vitest işlem düzeyi E2E testi tek yerde çalışan bir Gateway, CLI env, log yakalama ve temizliğe ihtiyaç duyduğunda `test/helpers/openclaw-test-instance.ts` kullanın.
- TUI PTY testleri: hızlı fake-backend PTY hattı için `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` kullanın. Yalnızca harici model endpoint'ini mock'layan daha yavaş `tui --local` smoke için `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` veya `pnpm tui:pty:test:watch --mode local` kullanın. Ham ANSI snapshot'ları değil, kararlı görünen metni veya fixture çağrılarını assert edin.
- Docker/Bash E2E yardımcıları: `scripts/lib/docker-e2e-image.sh` kaynaklayan hatlar, container'a `docker_e2e_test_state_shell_b64 <label> <scenario>` geçirebilir ve bunu `scripts/lib/openclaw-e2e-instance.sh` ile decode edebilir; çok evli betikler `docker_e2e_test_state_function_b64` geçirebilir ve her flow içinde `openclaw_test_state_create <label> <scenario>` çağırabilir. Daha düşük düzey çağırıcılar container içi shell snippet'i için `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` veya source edilebilir host env dosyası için `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` kullanabilir. `create` öncesindeki `--`, daha yeni Node runtime'larının `--env-file` değerini Node flag'i olarak değerlendirmesini engeller. Gateway başlatan Docker/Bash hatları entrypoint çözümleme, mock OpenAI başlangıcı, Gateway foreground/background başlatma, readiness probe'ları, state env dışa aktarma, log dökümleri ve işlem temizliği için container içinde `scripts/lib/openclaw-e2e-instance.sh` kaynaklayabilir.
- Tam, extension ve include-pattern shard çalıştırmaları yerel zamanlama verilerini `.artifacts/vitest-shard-timings.json` içinde günceller; sonraki whole-config çalıştırmaları yavaş ve hızlı shard'ları dengelemek için bu zamanlamaları kullanır. Include-pattern CI shard'ları shard adını zamanlama anahtarına ekler; bu, filtrelenmiş shard zamanlamalarını whole-config zamanlama verisini değiştirmeden görünür tutar. Yerel zamanlama artefaktını yok saymak için `OPENCLAW_TEST_PROJECTS_TIMINGS=0` ayarlayın.
- Seçili `plugin-sdk` ve `commands` test dosyaları artık yalnızca `test/setup.ts` tutan özel hafif hatlardan yönlendirilir; runtime ağırlıklı durumlar mevcut hatlarında kalır.
- Kardeş testleri olan kaynak dosyaları, daha geniş dizin glob'larına geri düşmeden önce o kardeşe eşlenir. `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` ve `src/plugins/contracts` altındaki yardımcı düzenlemeleri, dependency yolu kesin olduğunda her shard'ı geniş çalıştırmak yerine import eden testleri çalıştırmak için yerel import grafiği kullanır.
- `auto-reply` artık üç özel config'e (`core`, `top-level`, `reply`) de ayrılır; böylece reply harness daha hafif top-level status/token/helper testlerine baskın gelmez.
- Temel Vitest config artık repo config'leri genelinde etkin olan paylaşılan yalıtılmamış runner ile birlikte varsayılan olarak `pool: "threads"` ve `isolate: false` kullanır.
- `pnpm test:channels`, `vitest.channels.config.ts` çalıştırır.
- `pnpm test:extensions` ve `pnpm test extensions`, tüm extension/Plugin shard'larını çalıştırır. Ağır kanal Plugin'leri, browser Plugin'i ve OpenAI özel shard'lar olarak çalışır; diğer Plugin grupları toplu kalır. Tek bir paketlenmiş Plugin hattı için `pnpm test extensions/<id>` kullanın.
- `pnpm test:perf:imports`: açık dosya/dizin hedefleri için kapsamlı hat yönlendirmesini kullanmaya devam ederken Vitest import süresi + import dökümü raporlamasını etkinleştirir.
- `pnpm test:perf:imports:changed`: aynı import profillemesi, ancak yalnızca `origin/main` sonrasında değişen dosyalar için.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş changed-mode yolunu aynı commit'lenmiş git diff için native root-project çalıştırmasına karşı benchmark eder.
- `pnpm test:perf:changed:bench -- --worktree`, önce commit etmeden geçerli worktree değişiklik kümesini benchmark eder.
- `pnpm test:perf:profile:main`: Vitest ana thread'i için CPU profili yazar (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: birim runner için CPU + heap profilleri yazar (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: her full-suite Vitest leaf config'i seri olarak çalıştırır ve gruplanmış süre verilerinin yanı sıra config başına JSON/log artefaktları yazar. Test Performance Agent bunu yavaş test düzeltmelerini denemeden önce baseline olarak kullanır.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: performans odaklı bir değişiklikten sonra gruplanmış raporları karşılaştırır.
- `pnpm test:docker:timings <summary.json>`, bir Docker all çalıştırmasından sonra yavaş Docker hatlarını inceler; aynı artefaktlardan ucuz hedefli yeniden çalıştırma komutlarını yazdırmak için `pnpm test:docker:rerun <run-id|summary.json|failures.json>` kullanın.
- Gateway entegrasyonu: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` veya `pnpm test:gateway` ile opt-in.
- `pnpm test:e2e`: Repo E2E toplamını çalıştırır: gateway uçtan uca smoke testleri ve Control UI mocked browser E2E hattı.
- `pnpm test:e2e:gateway`: Gateway uçtan uca smoke testlerini çalıştırır (çoklu örnek WS/HTTP/node eşleştirmesi). `vitest.e2e.config.ts` içinde uyarlamalı worker'larla varsayılan olarak `threads` + `isolate: false` kullanır; `OPENCLAW_E2E_WORKERS=<n>` ile ayarlayın ve ayrıntılı loglar için `OPENCLAW_E2E_VERBOSE=1` ayarlayın.
- `pnpm test:live`: Sağlayıcı live testlerini (minimax/zai) çalıştırır. Atlamayı kaldırmak için API anahtarları ve `LIVE=1` (veya sağlayıcıya özel `*_LIVE_TEST=1`) gerekir.
- `pnpm test:docker:all`: Paylaşılan canlı test imajını derler, OpenClaw'ı bir kez npm tarball'ı olarak paketler, yalın bir Node/Git çalıştırıcı imajı ile bu tarball'ı `/app` içine yükleyen işlevsel bir imajı derler/yeniden kullanır, ardından ağırlıklı bir zamanlayıcı üzerinden `OPENCLAW_SKIP_DOCKER_BUILD=1` ile Docker smoke kulvarlarını çalıştırır. Yalın imaj (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) yükleyici/güncelleme/Plugin bağımlılığı kulvarları için kullanılır; bu kulvarlar kopyalanmış depo kaynakları kullanmak yerine önceden derlenmiş tarball'ı bağlar. İşlevsel imaj (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) normal derlenmiş uygulama işlevselliği kulvarları için kullanılır. `scripts/package-openclaw-for-docker.mjs`, tek yerel/CI paket paketleyicisidir ve Docker tüketmeden önce tarball'ı ve `dist/postinstall-inventory.json` dosyasını doğrular. Docker kulvar tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde bulunur; planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur; `scripts/test-docker-all.mjs` seçilen planı yürütür. `node scripts/test-docker-all.mjs --plan-json`, derleme yapmadan veya Docker çalıştırmadan seçilen kulvarlar, imaj türleri, paket/canlı imaj ihtiyaçları, durum senaryoları ve kimlik bilgisi kontrolleri için zamanlayıcıya ait CI planını üretir. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` süreç yuvalarını kontrol eder ve varsayılanı 10'dur; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` sağlayıcıya duyarlı kuyruk havuzunu kontrol eder ve varsayılanı 10'dur. Ağır kulvar sınırları varsayılan olarak `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` olur; sağlayıcı sınırları varsayılan olarak `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` ve `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` üzerinden sağlayıcı başına bir ağır kulvar olur. Daha büyük ana makineler için `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` kullanın. Düşük paralellikli bir ana makinede bir kulvar etkili ağırlık veya kaynak sınırını aşarsa yine de boş bir havuzdan başlayabilir ve kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel Docker daemon oluşturma fırtınalarından kaçınmak için kulvar başlangıçları varsayılan olarak 2 saniye aralıklandırılır; `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` ile geçersiz kılın. Çalıştırıcı varsayılan olarak Docker ön kontrollerini yapar, eski OpenClaw E2E konteynerlerini temizler, her 30 saniyede etkin kulvar durumunu üretir, uyumlu kulvarlar arasında sağlayıcı CLI araç önbelleklerini paylaşır, geçici canlı sağlayıcı hatalarını varsayılan olarak bir kez yeniden dener (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) ve sonraki çalıştırmalarda en uzundan ilk sıraya dizim için kulvar sürelerini `.artifacts/docker-tests/lane-timings.json` içinde saklar. Docker çalıştırmadan kulvar manifestini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, durum çıktısını ayarlamak için `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` veya süre yeniden kullanımını devre dışı bırakmak için `OPENCLAW_DOCKER_ALL_TIMINGS=0` kullanın. Yalnızca deterministik/yerel kulvarlar için `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` veya yalnızca canlı sağlayıcı kulvarları için `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` kullanın; paket diğer adları `pnpm test:docker:local:all` ve `pnpm test:docker:live:all` şeklindedir. Yalnızca canlı modu, sağlayıcı kovalarının Claude, Codex ve Gemini işlerini birlikte paketleyebilmesi için ana ve kuyruk canlı kulvarlarını en uzundan ilk sıraya tek bir havuzda birleştirir. Çalıştırıcı, `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` ayarlanmadığı sürece ilk hatadan sonra yeni havuzlanmış kulvarları zamanlamayı durdurur ve her kulvarın `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ile geçersiz kılınabilen 120 dakikalık yedek zaman aşımı vardır; seçili canlı/kuyruk kulvarları daha sıkı kulvar başına sınırlar kullanır. CLI arka uç Docker kurulum komutlarının `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (varsayılan 180) üzerinden kendi zaman aşımı vardır. Kulvar başına günlükler, `summary.json`, `failures.json` ve aşama süreleri `.artifacts/docker-tests/<run-id>/` altına yazılır; yavaş kulvarları incelemek için `pnpm test:docker:timings <summary.json>` ve ucuz hedefli yeniden çalıştırma komutlarını yazdırmak için `pnpm test:docker:rerun <run-id|summary.json|failures.json>` kullanın.
- `pnpm test:docker:browser-cdp-snapshot`: Chromium destekli bir kaynak E2E konteyneri derler, ham CDP ile yalıtılmış bir Gateway başlatır, `browser doctor --deep` çalıştırır ve CDP rol anlık görüntülerinin bağlantı URL'leri, imleçle öne çıkarılmış tıklanabilir öğeler, iframe başvuruları ve çerçeve üst verileri içerdiğini doğrular.
- `pnpm test:docker:skill-install`: Paketlenmiş OpenClaw tarball'ını yalın bir Docker çalıştırıcısına yükler, `skills.install.allowUploadedArchives` ayarını devre dışı bırakır, canlı ClawHub aramasından güncel bir Skills slug'ı çözer, bunu `openclaw skills install` üzerinden yükler ve `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` ile `skills info --json` çıktısını doğrular.
- CLI arka uç canlı Docker yoklamaları odaklanmış kulvarlar olarak çalıştırılabilir; örneğin `pnpm test:docker:live-cli-backend:claude`, `pnpm test:docker:live-cli-backend:claude:resume` veya `pnpm test:docker:live-cli-backend:claude:mcp`. Gemini için eşleşen `:resume` ve `:mcp` diğer adları vardır.
- `pnpm test:docker:openwebui`: Docker içinde OpenClaw + Open WebUI başlatır, Open WebUI üzerinden oturum açar, `/api/models` kontrol eder, ardından `/api/chat/completions` üzerinden gerçek bir vekilli sohbet çalıştırır. Kullanılabilir bir canlı model anahtarı gerektirir, harici bir Open WebUI imajı çeker ve normal unit/e2e paketleri gibi CI'da kararlı olması beklenmez.
- `pnpm test:docker:mcp-channels`: Önceden tohumlanmış bir Gateway konteyneri ve `openclaw mcp serve` başlatan ikinci bir istemci konteyneri başlatır; ardından yönlendirilmiş konuşma keşfini, transkript okumalarını, ek üst verilerini, canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve gerçek stdio köprüsü üzerinden Claude tarzı kanal + izin bildirimlerini doğrular. Claude bildirimi doğrulaması, smoke testin köprünün gerçekten ne ürettiğini yansıtması için ham stdio MCP çerçevelerini doğrudan okur.
- `pnpm test:docker:upgrade-survivor`: Paketlenmiş OpenClaw tarball'ını kirli bir eski kullanıcı fixture'ı üzerine yükler, canlı sağlayıcı veya kanal anahtarları olmadan paket güncellemesini ve etkileşimsiz doctor'ı çalıştırır, ardından bir local loopback Gateway başlatır ve agent'ların, kanal yapılandırmasının, Plugin izin listelerinin, çalışma alanı/oturum dosyalarının, eski miras Plugin bağımlılığı durumunun, başlatmanın ve RPC durumunun korunduğunu denetler.
- `pnpm test:docker:published-upgrade-survivor`: Varsayılan olarak `openclaw@latest` yükler, canlı sağlayıcı veya kanal anahtarları olmadan gerçekçi mevcut kullanıcı dosyaları tohumlar, bu taban çizgisini gömülü bir `openclaw config set` komut tarifiyle yapılandırır, yayımlanmış bu kurulumu paketlenmiş OpenClaw tarball'ına günceller, etkileşimsiz doctor çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar, ardından bir local loopback Gateway başlatır ve yapılandırılmış amaçların, çalışma alanı/oturum dosyalarının, eski Plugin yapılandırmasının ve miras bağımlılık durumunun, başlatmanın, `/healthz`, `/readyz` ve RPC durumunun korunduğunu veya temiz biçimde onarıldığını denetler. Tek bir taban çizgisini `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile geçersiz kılın, `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile tam bir yerel matrisi genişletin veya `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` ile senaryo fixture'ları ekleyin; bildirilen sorunlar kümesi, yapılandırılmış harici OpenClaw Plugin'lerinin yükseltme sırasında otomatik olarak yüklendiğini doğrulamak için `configured-plugin-installs` ve yalnızca kaynak Plugin gölgelerinin başlatmayı bozmasını önlemek için `stale-source-plugin-shadow` içerir. Package Acceptance bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar ve tam paket belirtimlerini Docker kulvarlarına teslim etmeden önce `last-stable-4` veya `all-since-2026.4.23` gibi meta taban çizgisi belirteçlerini çözer.
- `pnpm test:docker:update-migration`: Published-upgrade survivor harness'ını, varsayılan olarak `openclaw@2026.4.23` noktasından başlayarak temizlik ağırlıklı `plugin-deps-cleanup` senaryosunda çalıştırır. Ayrı `Update Migration` workflow'u bu kulvarı `baselines=all-since-2026.4.23` ile genişletir; böylece `.23` ve sonrasındaki yayımlanmış her kararlı paket adaya güncellenir ve Full Release CI dışında yapılandırılmış Plugin bağımlılığı temizliğini kanıtlar.
- `pnpm test:docker:plugins`: Yerel yol, `file:`, yükseltilmiş bağımlılıkları olan npm registry paketleri, git hareketli başvuruları, ClawHub fixture'ları, marketplace güncellemeleri ve Claude paketini etkinleştirme/inceleme için yükleme/güncelleme smoke testlerini çalıştırır.

## Yerel PR kapısı

Yerel PR land/gate kontrolleri için şunu çalıştırın:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` yüklü bir host üzerinde aralıklı hata verirse, bunu regresyon olarak ele almadan önce bir kez yeniden çalıştırın, ardından `pnpm test <path/to/test>` ile izole edin. Bellek kısıtlı hostlar için şunu kullanın:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model gecikme benchmark'ı (yerel anahtarlar)

Betik: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Kullanım:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- İsteğe bağlı env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Varsayılan prompt: "Reply with a single word: ok. No punctuation or extra text."

Son çalıştırma (2025-12-31, 20 çalıştırma):

- minimax medyan 1279ms (min 1114, maks 2431)
- opus medyan 2454ms (min 1224, maks 3170)

## CLI başlangıç benchmark'ı

Betik: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Kullanım:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Ön ayarlar:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: iki ön ayarın ikisi de

Çıktı her komut için `sampleCount`, ortalama, p50, p95, min/maks, exit-code/sinyal dağılımı ve maks RSS özetlerini içerir. İsteğe bağlı `--cpu-prof-dir` / `--heap-prof-dir`, zamanlama ve profil yakalama aynı harness'i kullansın diye her çalıştırma için V8 profilleri yazar.

Kaydedilmiş çıktı konvansiyonları:

- `pnpm test:startup:bench:smoke`, hedeflenen smoke yapıtını `.artifacts/cli-startup-bench-smoke.json` konumuna yazar
- `pnpm test:startup:bench:save`, `runs=5` ve `warmup=1` kullanarak tam paket yapıtını `.artifacts/cli-startup-bench-all.json` konumuna yazar
- `pnpm test:startup:bench:update`, `runs=5` ve `warmup=1` kullanarak depoya işlenmiş baseline fixture'ını `test/fixtures/cli-startup-bench.json` konumunda yeniler

Depoya işlenmiş fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` ile yenileyin
- Güncel sonuçları fixture ile `pnpm test:startup:bench:check` kullanarak karşılaştırın

## Gateway başlangıç benchmark'ı

Betik: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

Benchmark varsayılan olarak `dist/entry.js` konumundaki derlenmiş CLI girişini kullanır; package-script komutlarını kullanmadan önce
`pnpm build` çalıştırın. Bunun yerine kaynak runner'ı ölçmek için `--entry scripts/run-node.mjs` geçin ve bu sonuçları derlenmiş giriş baseline'larından
ayrı tutun.

Kullanım:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

Case kimlikleri:

- `default`: normal Gateway başlangıcı.
- `skipChannels`: kanal başlangıcı atlanmış Gateway başlangıcı.
- `oneInternalHook`: yapılandırılmış bir internal hook.
- `allInternalHooks`: tüm internal hook'lar.
- `fiftyPlugins`: 50 manifest plugin'i.
- `fiftyStartupLazyPlugins`: 50 startup-lazy manifest plugin'i.

Çıktı ilk süreç çıktısını, `/healthz`, `/readyz`, HTTP dinleme log zamanını,
Gateway hazır log zamanını, CPU zamanını, CPU çekirdek oranını, maks RSS'i, heap'i, başlangıç izleme
metriklerini, event-loop gecikmesini ve Plugin arama tablosu ayrıntı metriklerini içerir. Betik,
alt Gateway ortamında `OPENCLAW_GATEWAY_STARTUP_TRACE=1` etkinleştirir.

`/healthz` değerini liveness olarak okuyun: HTTP sunucusu yanıt verebilir. `/readyz` değerini
kullanılabilir readiness olarak okuyun: başlangıç Plugin sidecar'ları, kanallar ve ready-critical
post-attach işi tamamlanmıştır. Gateway başlangıç hook'ları asenkron gönderilir
ve readiness garantisinin parçası değildir. Hazır log zamanı,
Gateway'in dahili hazır log zaman damgasıdır; süreç tarafı ilişkilendirme için yararlıdır
ancak harici `/readyz` probe'unun yerine geçmez.

Değişiklikleri karşılaştırırken JSON çıktısı veya `--output` kullanın. `--cpu-prof-dir` seçeneğini yalnızca
izleme çıktısı import, compile veya yalnızca faz zamanlamalarıyla açıklanamayan CPU-bound işe
işaret ettikten sonra kullanın. Kaynak runner sonuçlarını derlenmiş `dist/entry.js` sonuçlarıyla
aynı baseline olarak karşılaştırmayın.

## Gateway yeniden başlatma benchmark'ı

Betik: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

Yeniden başlatma benchmark'ı yalnızca macOS ve Linux üzerinde desteklenir. Süreç içi yeniden başlatmalar için
SIGUSR1 kullanır ve Windows üzerinde hemen başarısız olur.

Benchmark varsayılan olarak `dist/entry.js` konumundaki derlenmiş CLI girişini kullanır; package-script komutlarını kullanmadan önce
`pnpm build` çalıştırın. Bunun yerine kaynak runner'ı ölçmek için `--entry scripts/run-node.mjs` geçin ve bu sonuçları
derlenmiş giriş baseline'larından ayrı tutun.

Kullanım:

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

Case kimlikleri:

- `skipChannels`: kanallar atlanmış yeniden başlatma.
- `skipChannelsAcpxProbe`: kanallar atlanmış ve ACPX başlangıç probe'u açık yeniden başlatma.
- `skipChannelsNoAcpxProbe`: kanallar atlanmış ve ACPX başlangıç probe'u kapalı yeniden başlatma.
- `default`: normal yeniden başlatma.
- `fiftyPlugins`: 50 manifest plugin'iyle yeniden başlatma.

Çıktı bir sonraki `/healthz`, bir sonraki `/readyz`, kesinti süresi, yeniden başlatma hazır zamanlaması,
CPU, RSS, replacement süreç için başlangıç izleme metrikleri ve sinyal işleme, aktif iş boşaltma,
kapatma fazları, bir sonraki başlangıç, hazır zamanlaması ve bellek anlık görüntüleri için yeniden başlatma izleme
metriklerini içerir. Betik,
alt Gateway ortamında `OPENCLAW_GATEWAY_STARTUP_TRACE=1` ve `OPENCLAW_GATEWAY_RESTART_TRACE=1` etkinleştirir.

Bir değişiklik yeniden başlatma sinyallemesini, kapatma handler'larını,
startup-after-restart, sidecar kapatmayı, servis devrini veya yeniden başlatma sonrası readiness'i
etkilediğinde bu benchmark'ı kullanın. Gateway mekaniklerini kanal
başlangıcından izole ederken `skipChannels` ile başlayın. `default` veya Plugin ağırlıklı case'leri yalnızca dar case
yeniden başlatma yolunu açıkladıktan sonra kullanın.

İzleme metrikleri ilişkilendirme ipuçlarıdır, hüküm değildir. Bir yeniden başlatma değişikliği
birden fazla örnekten, eşleşen sahip span'inden, `/healthz` ve `/readyz`
davranışından ve kullanıcıya görünür yeniden başlatma sözleşmesinden değerlendirilmelidir.

## Onboarding E2E (Docker)

Docker isteğe bağlıdır; bu yalnızca containerized onboarding smoke testleri için gereklidir.

Temiz bir Linux container'ında tam cold-start akışı:

```bash
scripts/e2e/onboard-docker.sh
```

Bu betik etkileşimli wizard'ı bir pseudo-tty üzerinden yürütür, config/workspace/session dosyalarını doğrular, ardından gateway'i başlatır ve `openclaw health` çalıştırır.

## QR import smoke (Docker)

Bakımı yapılan QR runtime helper'ının desteklenen Docker Node runtime'ları altında yüklendiğinden emin olur (varsayılan Node 24, uyumlu Node 22):

```bash
pnpm test:docker:qr
```

## İlgili

- [Test Etme](/tr/help/testing)
- [Canlı test etme](/tr/help/testing-live)
- [Güncellemeleri ve plugin'leri test etme](/tr/help/testing-updates-plugins)
