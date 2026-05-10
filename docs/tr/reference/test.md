---
read_when:
    - Testleri çalıştırma veya düzeltme
summary: Testleri yerel olarak nasıl çalıştırırsınız (vitest) ve zorla/kapsam modlarını ne zaman kullanmalısınız
title: Testler
x-i18n:
    generated_at: "2026-05-10T19:54:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: be939951f186df407aca8b3e4abbdbbd50f2f87c538c28c91745f9c6833df0d7
    source_path: reference/test.md
    workflow: 16
---

- Tam test kiti (paketler, canlı, Docker): [Test etme](/tr/help/testing)
- Güncelleme ve Plugin paketi doğrulaması: [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins)

- `pnpm test:force`: Varsayılan kontrol portunu tutan kalmış Gateway süreçlerini sonlandırır, ardından çalışan bir örnekle sunucu testlerinin çakışmaması için yalıtılmış bir Gateway portuyla tam Vitest paketini çalıştırır. Önceki bir Gateway çalıştırması 18789 portunu dolu bıraktığında bunu kullanın.
- `pnpm test:coverage`: Birim paketini V8 kapsamıyla (`vitest.unit.config.ts` üzerinden) çalıştırır. Bu, tüm depoda tüm dosyaları kapsayan bir kapsam değil, varsayılan birim kulvarı kapsam kapısıdır. Eşikler satırlar/fonksiyonlar/ifadeler için %70 ve dallar için %55'tir. `coverage.all` false olduğu ve varsayılan kulvar kapsam dahil etmelerini kardeş kaynak dosyaları olan hızlı olmayan birim testleriyle sınırladığı için kapı, yüklediği her geçişli import yerine bu kulvarın sahip olduğu kaynağı ölçer.
- `pnpm test:coverage:changed`: Yalnızca `origin/main` sonrasında değişen dosyalar için birim kapsamını çalıştırır.
- `pnpm test:changed`: ucuz akıllı değişen test çalıştırmasıdır. Doğrudan test düzenlemelerinden, kardeş `*.test.ts` dosyalarından, açık kaynak eşlemelerinden ve yerel import grafiğinden kesin hedefleri çalıştırır. Geniş/config/paket değişiklikleri, kesin testlere eşlenmedikçe atlanır.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: açık geniş değişen test çalıştırmasıdır. Bir test harness/config/paket düzenlemesinin Vitest'in daha geniş değişen-test davranışına geri düşmesi gerektiğinde bunu kullanın.
- `pnpm changed:lanes`: `origin/main` ile diff tarafından tetiklenen mimari kulvarları gösterir.
- `pnpm check:changed`: `origin/main` ile diff için akıllı değişen kontrol kapısını çalıştırır. Etkilenen mimari kulvarlar için typecheck, lint ve guard komutlarını çalıştırır, ancak Vitest testlerini çalıştırmaz. Test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` kullanın.
- `pnpm test`: açık dosya/dizin hedeflerini kapsamlı Vitest kulvarları üzerinden yönlendirir. Hedefsiz çalıştırmalar sabit shard gruplarını kullanır ve yerel paralel yürütme için yaprak config'lere genişler; extension grubu, tek dev bir kök-proje süreci yerine her zaman extension başına shard config'lerine genişler.
- Test wrapper çalıştırmaları kısa bir `[test] passed|failed|skipped ... in ...` özetiyle biter. Vitest'in kendi süre satırı shard başına ayrıntı olarak kalır.
- Paylaşılan OpenClaw test durumu: Bir test yalıtılmış bir `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture'ı, çalışma alanı, ajan dizini veya auth-profile deposu gerektirdiğinde Vitest içinden `src/test-utils/openclaw-test-state.ts` kullanın.
- Süreç E2E yardımcıları: Bir Vitest süreç düzeyi E2E testi çalışan bir Gateway, CLI env, log yakalama ve temizliği tek yerde gerektirdiğinde `test/helpers/openclaw-test-instance.ts` kullanın.
- Docker/Bash E2E yardımcıları: `scripts/lib/docker-e2e-image.sh` kaynaklayan kulvarlar container içine `docker_e2e_test_state_shell_b64 <label> <scenario>` geçirebilir ve bunu `scripts/lib/openclaw-e2e-instance.sh` ile decode edebilir; çok-home'lu script'ler `docker_e2e_test_state_function_b64` geçirebilir ve her akışta `openclaw_test_state_create <label> <scenario>` çağırabilir. Daha düşük seviyeli çağırıcılar, container içi shell snippet'i için `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` ya da source edilebilir host env dosyası için `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` kullanabilir. `create` öncesindeki `--`, daha yeni Node runtime'larının `--env-file` değerini Node bayrağı olarak ele almasını engeller. Gateway başlatan Docker/Bash kulvarları, entrypoint çözümleme, mock OpenAI başlatma, Gateway foreground/background başlatma, hazır olma probe'ları, durum env export'u, log dökümleri ve süreç temizliği için container içinde `scripts/lib/openclaw-e2e-instance.sh` kaynaklayabilir.
- Tam, extension ve include-pattern shard çalıştırmaları yerel zamanlama verilerini `.artifacts/vitest-shard-timings.json` içinde günceller; sonraki whole-config çalıştırmaları bu zamanlamaları yavaş ve hızlı shard'ları dengelemek için kullanır. Include-pattern CI shard'ları zamanlama anahtarına shard adını ekler; bu, filtrelenmiş shard zamanlamalarını whole-config zamanlama verilerinin yerine geçmeden görünür tutar. Yerel zamanlama artifact'ını yok saymak için `OPENCLAW_TEST_PROJECTS_TIMINGS=0` ayarlayın.
- Seçili `plugin-sdk` ve `commands` test dosyaları artık yalnızca `test/setup.ts` tutan özel hafif kulvarlardan geçer; runtime açısından ağır durumlar mevcut kulvarlarında kalır.
- Kardeş testleri olan kaynak dosyaları, daha geniş dizin glob'larına geri düşmeden önce o kardeşe eşlenir. `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` ve `src/plugins/contracts` altındaki yardımcı düzenlemeleri, bağımlılık yolu kesin olduğunda her shard'ı geniş çalıştırmak yerine import eden testleri çalıştırmak için yerel import grafiği kullanır.
- `auto-reply` artık üç özel config'e de bölünür (`core`, `top-level`, `reply`), böylece reply harness daha hafif üst düzey durum/token/yardımcı testlere baskın olmaz.
- Temel Vitest config'i artık varsayılan olarak `pool: "threads"` ve `isolate: false` kullanır; paylaşılan yalıtılmamış runner repo config'leri genelinde etkindir.
- `pnpm test:channels`, `vitest.channels.config.ts` çalıştırır.
- `pnpm test:extensions` ve `pnpm test extensions` tüm extension/Plugin shard'larını çalıştırır. Ağır kanal Plugin'leri, tarayıcı Plugin'i ve OpenAI özel shard'lar olarak çalışır; diğer Plugin grupları toplu kalır. Tek bir bundled Plugin kulvarı için `pnpm test extensions/<id>` kullanın.
- `pnpm test:perf:imports`: açık dosya/dizin hedefleri için kapsamlı kulvar yönlendirmesini kullanmayı sürdürürken Vitest import-süresi + import-dökümü raporlamasını etkinleştirir.
- `pnpm test:perf:imports:changed`: aynı import profilini çıkarır, ancak yalnızca `origin/main` sonrasında değişen dosyalar için.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` yönlendirilmiş changed-mode yolunu aynı commit'lenmiş git diff'i için yerel kök-proje çalıştırmasına karşı benchmark eder.
- `pnpm test:perf:changed:bench -- --worktree` geçerli worktree değişiklik kümesini önce commit'lemeden benchmark eder.
- `pnpm test:perf:profile:main`: Vitest ana thread'i için bir CPU profili yazar (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: birim runner için CPU + heap profilleri yazar (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: her full-suite Vitest yaprak config'ini seri olarak çalıştırır ve gruplanmış süre verileriyle config başına JSON/log artifact'larını yazar. Test Performance Agent, yavaş-test düzeltmelerine girişmeden önce bunu baseline olarak kullanır.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: performans odaklı bir değişiklikten sonra gruplanmış raporları karşılaştırır.
- Gateway entegrasyonu: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` veya `pnpm test:gateway` üzerinden isteğe bağlı etkinleştirin.
- `pnpm test:e2e`: Gateway uçtan uca smoke testlerini çalıştırır (çoklu örnek WS/HTTP/node eşleşmesi). Varsayılan olarak `vitest.e2e.config.ts` içinde uyarlanabilir worker'larla `threads` + `isolate: false` kullanır; `OPENCLAW_E2E_WORKERS=<n>` ile ayarlayın ve ayrıntılı loglar için `OPENCLAW_E2E_VERBOSE=1` ayarlayın.
- `pnpm test:live`: Sağlayıcı live testlerini çalıştırır (minimax/zai). Atlamayı kaldırmak için API anahtarları ve `LIVE=1` (veya sağlayıcıya özgü `*_LIVE_TEST=1`) gerektirir.
- `pnpm test:docker:all`: Paylaşılan live-test imajını build eder, OpenClaw'ı bir kez npm tarball olarak paketler, yalın bir Node/Git runner imajı ile o tarball'ı `/app` içine kuran işlevsel bir imajı build eder/yeniden kullanır, ardından Docker smoke kulvarlarını `OPENCLAW_SKIP_DOCKER_BUILD=1` ile ağırlıklı bir scheduler üzerinden çalıştırır. Yalın imaj (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) installer/update/plugin-dependency kulvarları için kullanılır; bu kulvarlar kopyalanmış repo kaynaklarını kullanmak yerine önceden build edilmiş tarball'ı mount eder. İşlevsel imaj (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) normal build edilmiş-uygulama işlevsellik kulvarları için kullanılır. `scripts/package-openclaw-for-docker.mjs` tek yerel/CI paket paketleyicisidir ve Docker tüketmeden önce tarball'ı ve `dist/postinstall-inventory.json` dosyasını doğrular. Docker kulvar tanımları `scripts/lib/docker-e2e-scenarios.mjs` içindedir; planner mantığı `scripts/lib/docker-e2e-plan.mjs` içindedir; `scripts/test-docker-all.mjs` seçili planı yürütür. `node scripts/test-docker-all.mjs --plan-json`, build yapmadan veya Docker çalıştırmadan seçili kulvarlar, imaj türleri, paket/live-image gereksinimleri, durum senaryoları ve kimlik bilgisi kontrolleri için scheduler'ın sahip olduğu CI planını yayar. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` süreç slotlarını kontrol eder ve varsayılanı 10'dur; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` sağlayıcıya duyarlı tail havuzunu kontrol eder ve varsayılanı 10'dur. Ağır kulvar sınırları varsayılan olarak `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` değerleridir; sağlayıcı sınırları varsayılan olarak `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` ve `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` ile sağlayıcı başına bir ağır kulvardır. Daha büyük host'lar için `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` kullanın. Bir kulvar düşük paralellikli bir host'ta etkili ağırlık veya kaynak sınırını aşarsa yine de boş bir havuzdan başlayabilir ve kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel Docker daemon oluşturma fırtınalarından kaçınmak için kulvar başlangıçları varsayılan olarak 2 saniye aralıklıdır; `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` ile geçersiz kılın. Runner varsayılan olarak Docker için preflight yapar, eskimiş OpenClaw E2E container'larını temizler, her 30 saniyede etkin-kulvar durumunu yayar, uyumlu kulvarlar arasında sağlayıcı CLI araç cache'lerini paylaşır, geçici live-sağlayıcı hatalarını varsayılan olarak bir kez yeniden dener (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) ve sonraki çalıştırmalarda en uzundan-ilke sıralama için kulvar zamanlamalarını `.artifacts/docker-tests/lane-timings.json` içinde saklar. Docker çalıştırmadan kulvar manifestini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, durum çıktısını ayarlamak için `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` veya zamanlama yeniden kullanımını devre dışı bırakmak için `OPENCLAW_DOCKER_ALL_TIMINGS=0` kullanın. Yalnızca deterministik/yerel kulvarlar için `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` ya da yalnızca live-sağlayıcı kulvarları için `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` kullanın; paket alias'ları `pnpm test:docker:local:all` ve `pnpm test:docker:live:all` şeklindedir. Live-only modu, ana ve tail live kulvarlarını tek bir en-uzundan-ilke havuzunda birleştirir; böylece sağlayıcı bucket'ları Claude, Codex ve Gemini işlerini birlikte paketleyebilir. Runner, `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` ayarlanmadıkça ilk hatadan sonra yeni havuzlanmış kulvarları schedule etmeyi durdurur ve her kulvarın `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ile geçersiz kılınabilen 120 dakikalık fallback zaman aşımı vardır; seçili live/tail kulvarları daha sıkı kulvar başına sınırlar kullanır. CLI backend Docker kurulum komutlarının `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` üzerinden kendi zaman aşımı vardır (varsayılan 180). Kulvar başına loglar, `summary.json`, `failures.json` ve aşama zamanlamaları `.artifacts/docker-tests/<run-id>/` altında yazılır; yavaş kulvarları incelemek için `pnpm test:docker:timings <summary.json>` ve ucuz hedefli yeniden çalıştırma komutlarını yazdırmak için `pnpm test:docker:rerun <run-id|summary.json|failures.json>` kullanın.
- `pnpm test:docker:browser-cdp-snapshot`: Chromium destekli kaynak E2E container'ı build eder, ham CDP ile yalıtılmış bir Gateway başlatır, `browser doctor --deep` çalıştırır ve CDP rol snapshot'larının bağlantı URL'lerini, imleçle öne çıkarılmış tıklanabilirleri, iframe ref'lerini ve frame metadata'sını içerdiğini doğrular.
- `pnpm test:docker:skill-install`: Paketlenmiş OpenClaw tarball'ını yalın bir Docker runner'a kurar, `skills.install.allowUploadedArchives` devre dışı bırakır, canlı ClawHub aramasından güncel bir skill slug'ı çözer, `openclaw skills install` üzerinden kurar ve `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` ile `skills info --json` değerlerini doğrular.
- CLI backend live Docker probe'ları odaklanmış kulvarlar olarak çalıştırılabilir; örneğin `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` veya `pnpm test:docker:live-cli-backend:codex:mcp`. Claude ve Gemini için eşleşen `:resume` ve `:mcp` alias'ları vardır.
- `pnpm test:docker:openwebui`: Dockerize OpenClaw + Open WebUI başlatır, Open WebUI üzerinden oturum açar, `/api/models` kontrol eder, ardından `/api/chat/completions` üzerinden gerçek proxied chat çalıştırır. Kullanılabilir bir live model anahtarı gerektirir (örneğin `~/.profile` içinde OpenAI), harici bir Open WebUI imajı çeker ve normal unit/e2e paketleri kadar CI-kararlı olması beklenmez.
- `pnpm test:docker:mcp-channels`: Tohumlanmış bir Gateway kapsayıcısı ve `openclaw mcp serve` komutunu başlatan ikinci bir istemci kapsayıcısı başlatır, ardından yönlendirilmiş konuşma keşfini, transkript okumalarını, ek meta verilerini, canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve gerçek stdio köprüsü üzerinden Claude tarzı kanal + izin bildirimlerini doğrular. Claude bildirim doğrulaması ham stdio MCP çerçevelerini doğrudan okur; böylece smoke, köprünün gerçekte ne yaydığını yansıtır.
- `pnpm test:docker:upgrade-survivor`: Paketlenmiş OpenClaw tarball’ını kirli bir eski kullanıcı fixture’ının üzerine kurar, canlı sağlayıcı veya kanal anahtarları olmadan paket güncellemesini ve etkileşimsiz doctor’ı çalıştırır, ardından bir loopback Gateway başlatır ve agent’ların, kanal yapılandırmasının, Plugin izin listelerinin, çalışma alanı/oturum dosyalarının, bayat eski Plugin bağımlılık durumunun, başlangıcın ve RPC durumunun korunduğunu denetler.
- `pnpm test:docker:published-upgrade-survivor`: Varsayılan olarak `openclaw@latest` kurar, canlı sağlayıcı veya kanal anahtarları olmadan gerçekçi mevcut kullanıcı dosyaları tohumlar, bu taban çizgisini hazır bir `openclaw config set` komut tarifiyle yapılandırır, yayımlanmış bu kurulumu paketlenmiş OpenClaw tarball’ına günceller, etkileşimsiz doctor çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar, ardından bir loopback Gateway başlatır ve yapılandırılmış amaçların, çalışma alanı/oturum dosyalarının, bayat Plugin yapılandırmasının ve eski bağımlılık durumunun, başlangıcın, `/healthz`, `/readyz` ve RPC durumunun korunduğunu veya temiz biçimde onarıldığını denetler. Tek bir taban çizgisini `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile geçersiz kılın, `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile tam bir yerel matrisi genişletin veya `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` ile senaryo fixture’ları ekleyin; reported-issues kümesi, yükseltme sırasında yapılandırılmış harici OpenClaw Plugin’lerinin otomatik olarak kurulduğunu doğrulamak için `configured-plugin-installs` ve salt kaynak Plugin gölgelerinin başlangıcı bozmasını önlemek için `stale-source-plugin-shadow` içerir. Package Acceptance bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar ve Docker şeritlerine tam paket spesifikasyonlarını teslim etmeden önce `last-stable-4` veya `all-since-2026.4.23` gibi meta taban çizgisi belirteçlerini çözer.
- `pnpm test:docker:update-migration`: Yayımlanmış yükseltme survivor harness’ını, varsayılan olarak `openclaw@2026.4.23` sürümünden başlayarak temizleme ağırlıklı `plugin-deps-cleanup` senaryosunda çalıştırır. Ayrı `Update Migration` workflow’u bu şeridi `baselines=all-since-2026.4.23` ile genişletir; böylece `.23` ve sonrasındaki her kararlı yayımlanmış paket adaya güncellenir ve yapılandırılmış Plugin bağımlılığı temizliğini Full Release CI dışında kanıtlar.
- `pnpm test:docker:plugins`: Yerel yol, `file:`, hoist edilmiş bağımlılıklara sahip npm registry paketleri, git hareketli ref’leri, ClawHub fixture’ları, marketplace güncellemeleri ve Claude paketini etkinleştirme/inceleme için kurulum/güncelleme smoke’u çalıştırır.

## Yerel PR geçidi

Yerel PR land/gate kontrolleri için şunu çalıştırın:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` yüklü bir ana makinede aralıklı hata verirse, bunu bir regresyon olarak değerlendirmeden önce bir kez yeniden çalıştırın, ardından `pnpm test <path/to/test>` ile yalıtın. Belleği kısıtlı ana makineler için şunları kullanın:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model gecikme karşılaştırması (yerel anahtarlar)

Betik: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Kullanım:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- İsteğe bağlı ortam değişkenleri: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Varsayılan istem: "Tek bir sözcükle yanıtla: ok. Noktalama işareti veya ek metin yok."

Son çalıştırma (2025-12-31, 20 çalıştırma):

- minimax medyan 1279 ms (min 1114, maks 2431)
- opus medyan 2454 ms (min 1224, maks 3170)

## CLI başlatma karşılaştırması

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
- `all`: her iki ön ayar

Çıktı, her komut için `sampleCount`, ortalama, p50, p95, min/maks, çıkış kodu/sinyal dağılımı ve maksimum RSS özetlerini içerir. İsteğe bağlı `--cpu-prof-dir` / `--heap-prof-dir`, zamanlama ve profil yakalamanın aynı koşumla kullanılması için her çalıştırma başına V8 profilleri yazar.

Kaydedilen çıktı kuralları:

- `pnpm test:startup:bench:smoke`, hedeflenen smoke yapıtını `.artifacts/cli-startup-bench-smoke.json` konumuna yazar
- `pnpm test:startup:bench:save`, tam paket yapıtını `runs=5` ve `warmup=1` kullanarak `.artifacts/cli-startup-bench-all.json` konumuna yazar
- `pnpm test:startup:bench:update`, depoya işlenen temel fikstürü `runs=5` ve `warmup=1` kullanarak `test/fixtures/cli-startup-bench.json` konumunda yeniler

Depoya işlenen fikstür:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` ile yenileyin
- Geçerli sonuçları fikstürle `pnpm test:startup:bench:check` kullanarak karşılaştırın

## Onboarding E2E (Docker)

Docker isteğe bağlıdır; bu yalnızca kapsayıcılı onboarding smoke testleri için gereklidir.

Temiz bir Linux kapsayıcısında tam soğuk başlatma akışı:

```bash
scripts/e2e/onboard-docker.sh
```

Bu betik etkileşimli sihirbazı bir pseudo-tty üzerinden çalıştırır, config/workspace/session dosyalarını doğrular, ardından Gateway'i başlatır ve `openclaw health` çalıştırır.

## QR içe aktarma smoke testi (Docker)

Bakımı yapılan QR runtime yardımcısının desteklenen Docker Node runtime'larında (varsayılan Node 24, uyumlu Node 22) yüklendiğini doğrular:

```bash
pnpm test:docker:qr
```

## İlgili

- [Test Etme](/tr/help/testing)
- [Canlı test etme](/tr/help/testing-live)
- [Güncellemeleri ve plugin'leri test etme](/tr/help/testing-updates-plugins)
