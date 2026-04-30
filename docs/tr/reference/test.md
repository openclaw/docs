---
read_when:
    - Testleri çalıştırma veya düzeltme
summary: Testleri yerel olarak çalıştırma (vitest) ve force/coverage modlarının ne zaman kullanılacağı
title: Testler
x-i18n:
    generated_at: "2026-04-30T09:44:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9328d6f0383b5067fa8bb5d0f1bf22a3b9048a267908bf85167842ddc3d12e42
    source_path: reference/test.md
    workflow: 16
---

- Eksiksiz test araç seti (test paketleri, canlı, Docker): [Test Etme](/tr/help/testing)

- `pnpm test:force`: Varsayılan kontrol portunu tutan kalıcı Gateway süreçlerini sonlandırır, ardından sunucu testlerinin çalışan bir örnekle çakışmaması için tam Vitest paketini yalıtılmış bir Gateway portuyla çalıştırır. Bunu önceki bir Gateway çalıştırması 18789 portunu dolu bıraktığında kullanın.
- `pnpm test:coverage`: Birim paketini V8 kapsamıyla (`vitest.unit.config.ts` üzerinden) çalıştırır. Bu, tüm repo tüm dosya kapsamı değil, yüklenen dosyalara yönelik birim kapsam kapısıdır. Eşikler satırlar/fonksiyonlar/ifadeler için %70 ve dallar için %55’tir. `coverage.all` false olduğu için kapı, her bölünmüş kulvar kaynak dosyasını kapsanmamış saymak yerine birim kapsam paketi tarafından yüklenen dosyaları ölçer.
- `pnpm test:coverage:changed`: Birim kapsamını yalnızca `origin/main`den beri değişen dosyalar için çalıştırır.
- `pnpm test:changed`: ucuz akıllı değişen test çalıştırması. Doğrudan test düzenlemelerinden, kardeş `*.test.ts` dosyalarından, açık kaynak eşlemelerinden ve yerel içe aktarma grafiğinden kesin hedefleri çalıştırır. Geniş/config/paket değişiklikleri, kesin testlere eşlenmedikçe atlanır.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: açık geniş değişen test çalıştırması. Bir test harness/config/paket düzenlemesinin Vitest’in daha geniş değişen-test davranışına geri dönmesi gerektiğinde kullanın.
- `pnpm changed:lanes`: `origin/main`e karşı diff tarafından tetiklenen mimari kulvarları gösterir.
- `pnpm check:changed`: `origin/main`e karşı diff için akıllı değişen kontrol kapısını çalıştırır. Etkilenen mimari kulvarlar için typecheck, lint ve guard komutlarını çalıştırır, ancak Vitest testlerini çalıştırmaz. Test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` kullanın.
- `pnpm test`: açık dosya/dizin hedeflerini kapsamlı Vitest kulvarları üzerinden yönlendirir. Hedeflenmemiş çalıştırmalar sabit shard grupları kullanır ve yerel paralel yürütme için yaprak config’lere genişler; extension grubu, tek bir dev kök-proje süreci yerine her zaman extension başına shard config’lerine genişler.
- Test sarmalayıcı çalıştırmaları kısa bir `[test] passed|failed|skipped ... in ...` özetiyle biter. Vitest’in kendi süre satırı shard başına ayrıntı olarak kalır.
- Paylaşılan OpenClaw test durumu: Bir testin yalıtılmış `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture’ı, çalışma alanı, agent dizini veya auth-profile deposu gerektiğinde Vitest’ten `src/test-utils/openclaw-test-state.ts` kullanın.
- Süreç E2E yardımcıları: Bir Vitest süreç düzeyi E2E testinin çalışan bir Gateway’e, CLI env’ye, log yakalamaya ve temizliğe tek bir yerde ihtiyacı olduğunda `test/helpers/openclaw-test-instance.ts` kullanın.
- Docker/Bash E2E yardımcıları: `scripts/lib/docker-e2e-image.sh` kaynaklayan kulvarlar container’a `docker_e2e_test_state_shell_b64 <label> <scenario>` geçirebilir ve bunu `scripts/lib/openclaw-e2e-instance.sh` ile çözebilir; çoklu-home script’leri `docker_e2e_test_state_function_b64` geçirebilir ve her akışta `openclaw_test_state_create <label> <scenario>` çağırabilir. Daha düşük düzey çağırıcılar, container içi shell parçacığı için `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` veya source edilebilir host env dosyası için `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` kullanabilir. `create` öncesindeki `--`, daha yeni Node runtime’larının `--env-file`ı Node bayrağı olarak ele almasını önler. Gateway başlatan Docker/Bash kulvarları, entrypoint çözümleme, sahte OpenAI başlatma, Gateway ön plan/arka plan başlatma, hazır olma probları, durum env dışa aktarma, log dökümleri ve süreç temizliği için container içinde `scripts/lib/openclaw-e2e-instance.sh` kaynaklayabilir.
- Tam, extension ve include-pattern shard çalıştırmaları yerel zamanlama verilerini `.artifacts/vitest-shard-timings.json` içinde günceller; daha sonraki tüm-config çalıştırmaları, yavaş ve hızlı shard’ları dengelemek için bu zamanlamaları kullanır. Include-pattern CI shard’ları shard adını zamanlama anahtarına ekler; bu, filtrelenmiş shard zamanlamalarını tüm-config zamanlama verilerinin yerine geçmeden görünür tutar. Yerel zamanlama artifact’ını yok saymak için `OPENCLAW_TEST_PROJECTS_TIMINGS=0` ayarlayın.
- Seçili `plugin-sdk` ve `commands` test dosyaları artık yalnızca `test/setup.ts` tutan özel hafif kulvarlar üzerinden yönlendirilir; runtime-ağır durumlar mevcut kulvarlarında kalır.
- Kardeş testleri olan kaynak dosyalar, daha geniş dizin glob’larına geri dönmeden önce o kardeşe eşlenir. `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` ve `src/plugins/contracts` altındaki yardımcı düzenlemeleri, bağımlılık yolu kesin olduğunda her shard’ı geniş çalıştırmak yerine içe aktaran testleri çalıştırmak için yerel bir içe aktarma grafiği kullanır.
- `auto-reply` artık üç özel config’e de bölünür (`core`, `top-level`, `reply`), böylece reply harness daha hafif üst düzey durum/token/yardımcı testlerine baskın olmaz.
- Temel Vitest config artık varsayılan olarak `pool: "threads"` ve `isolate: false` kullanır; paylaşılan yalıtılmamış runner repo config’lerinin tamamında etkindir.
- `pnpm test:channels`, `vitest.channels.config.ts` çalıştırır.
- `pnpm test:extensions` ve `pnpm test extensions`, tüm extension/Plugin shard’larını çalıştırır. Ağır kanal Plugin’leri, tarayıcı Plugin’i ve OpenAI özel shard’lar olarak çalışır; diğer Plugin grupları toplu kalır. Tek bir paketli Plugin kulvarı için `pnpm test extensions/<id>` kullanın.
- `pnpm test:perf:imports`: Açık dosya/dizin hedefleri için kapsamlı kulvar yönlendirmesini kullanmaya devam ederken Vitest içe aktarma süresi + içe aktarma kırılımı raporlamasını etkinleştirir.
- `pnpm test:perf:imports:changed`: aynı içe aktarma profillemesi, ancak yalnızca `origin/main`den beri değişen dosyalar için.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş changed-mode yolunu aynı commit’lenmiş git diff’i için yerel kök-proje çalıştırmasına karşı benchmark eder.
- `pnpm test:perf:changed:bench -- --worktree`, önce commit etmeden geçerli worktree değişiklik kümesini benchmark eder.
- `pnpm test:perf:profile:main`: Vitest ana iş parçacığı için bir CPU profili yazar (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: Birim runner için CPU + heap profilleri yazar (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: Her tam paket Vitest yaprak config’ini seri olarak çalıştırır ve config başına JSON/log artifact’larıyla birlikte gruplanmış süre verilerini yazar. Test Performance Agent bunu yavaş-test düzeltmelerine girişmeden önce baseline olarak kullanır.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: Performans odaklı bir değişiklikten sonra gruplanmış raporları karşılaştırır.
- Gateway entegrasyonu: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` veya `pnpm test:gateway` ile opt-in.
- `pnpm test:e2e`: Gateway uçtan uca smoke testlerini çalıştırır (çoklu örnek WS/HTTP/node eşleştirme). `vitest.e2e.config.ts` içinde uyarlanabilir worker’larla varsayılan olarak `threads` + `isolate: false` kullanır; `OPENCLAW_E2E_WORKERS=<n>` ile ayarlayın ve ayrıntılı loglar için `OPENCLAW_E2E_VERBOSE=1` ayarlayın.
- `pnpm test:live`: Provider canlı testlerini çalıştırır (minimax/zai). Atlamayı kaldırmak için API anahtarları ve `LIVE=1` (veya provider’a özgü `*_LIVE_TEST=1`) gerekir.
- `pnpm test:docker:all`: Paylaşılan canlı-test imajını derler, OpenClaw’u bir kez npm tarball olarak paketler, çıplak Node/Git runner imajını ve bu tarball’u `/app` içine kuran işlevsel bir imajı derler/yeniden kullanır, ardından Docker smoke kulvarlarını ağırlıklı bir zamanlayıcı üzerinden `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır. Çıplak imaj (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) installer/update/plugin-dependency kulvarları için kullanılır; bu kulvarlar kopyalanmış repo kaynakları kullanmak yerine önceden derlenmiş tarball’u mount eder. İşlevsel imaj (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) normal derlenmiş uygulama işlevselliği kulvarları için kullanılır. `scripts/package-openclaw-for-docker.mjs` tek yerel/CI paket paketleyicisidir ve Docker tüketmeden önce tarball’u ve `dist/postinstall-inventory.json` dosyasını doğrular. Docker kulvar tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde yaşar; planner mantığı `scripts/lib/docker-e2e-plan.mjs` içinde yaşar; `scripts/test-docker-all.mjs` seçili planı yürütür. `node scripts/test-docker-all.mjs --plan-json`, derleme veya Docker çalıştırma yapmadan seçili kulvarlar, imaj türleri, paket/canlı-imaj ihtiyaçları, durum senaryoları ve credential kontrolleri için zamanlayıcıya ait CI planını yayımlar. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` süreç slotlarını kontrol eder ve varsayılanı 10’dur; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` provider’a duyarlı tail pool’u kontrol eder ve varsayılanı 10’dur. Ağır kulvar sınırları varsayılan olarak `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` olur; provider sınırları `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` ve `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` üzerinden provider başına bir ağır kulvar varsayılanına sahiptir. Daha büyük host’lar için `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` kullanın. Bir kulvar düşük paralellikli bir host’ta etkin ağırlık veya kaynak sınırını aşarsa yine de boş pool’dan başlayabilir ve kapasiteyi bırakana kadar tek başına çalışır. Yerel Docker daemon create fırtınalarını önlemek için kulvar başlangıçları varsayılan olarak 2 saniye aralıklandırılır; `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` ile geçersiz kılın. Runner varsayılan olarak Docker’ı preflight eder, bayat OpenClaw E2E container’larını temizler, her 30 saniyede bir aktif-kulvar durumunu yayımlar, uyumlu kulvarlar arasında provider CLI araç cache’lerini paylaşır, geçici canlı-provider hatalarını varsayılan olarak bir kez yeniden dener (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) ve sonraki çalıştırmalarda en uzundan önce sıralama için kulvar zamanlamalarını `.artifacts/docker-tests/lane-timings.json` içinde saklar. Docker çalıştırmadan kulvar manifestini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, durum çıktısını ayarlamak için `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` veya zamanlama yeniden kullanımını devre dışı bırakmak için `OPENCLAW_DOCKER_ALL_TIMINGS=0` kullanın. Yalnızca deterministik/yerel kulvarlar için `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` veya yalnızca canlı-provider kulvarları için `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` kullanın; paket alias’ları `pnpm test:docker:local:all` ve `pnpm test:docker:live:all` şeklindedir. Yalnızca canlı modu, ana ve tail canlı kulvarlarını tek bir en-uzundan-önce pool’da birleştirir, böylece provider bucket’ları Claude, Codex ve Gemini işlerini birlikte paketleyebilir. Runner, `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` ayarlanmadıkça ilk hatadan sonra yeni pooled kulvarları zamanlamayı durdurur ve her kulvarın `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ile geçersiz kılınabilen 120 dakikalık fallback timeout’u vardır; seçili canlı/tail kulvarları daha sıkı kulvar başına sınırlar kullanır. CLI backend Docker kurulum komutlarının `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (varsayılan 180) üzerinden kendi timeout’u vardır. Kulvar başına loglar, `summary.json`, `failures.json` ve faz zamanlamaları `.artifacts/docker-tests/<run-id>/` altında yazılır; yavaş kulvarları incelemek için `pnpm test:docker:timings <summary.json>` ve ucuz hedefli yeniden çalıştırma komutlarını yazdırmak için `pnpm test:docker:rerun <run-id|summary.json|failures.json>` kullanın.
- `pnpm test:docker:browser-cdp-snapshot`: Chromium destekli bir kaynak E2E container’ı derler, ham CDP ve yalıtılmış bir Gateway başlatır, `browser doctor --deep` çalıştırır ve CDP rol snapshot’larının bağlantı URL’lerini, cursor-promoted tıklanabilirleri, iframe ref’lerini ve frame metadata’sını içerdiğini doğrular.
- CLI backend canlı Docker probları odaklı kulvarlar olarak çalıştırılabilir; örneğin `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` veya `pnpm test:docker:live-cli-backend:codex:mcp`. Claude ve Gemini için de eşleşen `:resume` ve `:mcp` alias’ları vardır.
- `pnpm test:docker:openwebui`: Docker’laştırılmış OpenClaw + Open WebUI başlatır, Open WebUI üzerinden oturum açar, `/api/models` kontrol eder, ardından `/api/chat/completions` üzerinden gerçek proxied chat çalıştırır. Kullanılabilir bir canlı model anahtarı gerektirir (örneğin `~/.profile` içinde OpenAI), harici bir Open WebUI imajı çeker ve normal birim/e2e paketleri kadar CI-kararlı olması beklenmez.
- `pnpm test:docker:mcp-channels`: Seed edilmiş bir Gateway container’ı ve `openclaw mcp serve` başlatan ikinci bir client container’ı başlatır, ardından yönlendirilmiş konuşma keşfini, transcript okumalarını, ek metadata’sını, canlı olay kuyruğu davranışını, outbound gönderim yönlendirmesini ve gerçek stdio köprüsü üzerinden Claude tarzı kanal + izin bildirimlerini doğrular. Claude bildirim assertion’ı ham stdio MCP frame’lerini doğrudan okur, böylece smoke köprünün gerçekten ne yayımladığını yansıtır.

## Yerel PR kapısı

Yerel PR land/gate kontrolleri için şunu çalıştırın:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` yüklü bir host üzerinde flake verirse, bunu bir regresyon olarak ele almadan önce bir kez yeniden çalıştırın, ardından `pnpm test <path/to/test>` ile izole edin. Belleği kısıtlı hostlar için şunları kullanın:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model gecikme bench’i (yerel anahtarlar)

Betik: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Kullanım:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- İsteğe bağlı env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Varsayılan istem: “Tek bir kelimeyle yanıtla: ok. Noktalama veya ek metin yok.”

Son çalıştırma (2025-12-31, 20 çalıştırma):

- minimax medyan 1279 ms (min 1114, maks 2431)
- opus medyan 2454 ms (min 1224, maks 3170)

## CLI başlangıç bench’i

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

Preset’ler:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: her iki preset

Çıktı, her komut için `sampleCount`, ortalama, p50, p95, min/maks, çıkış kodu/sinyal dağılımı ve maks RSS özetlerini içerir. İsteğe bağlı `--cpu-prof-dir` / `--heap-prof-dir`, zamanlama ve profil yakalamanın aynı harness’i kullanması için her çalıştırma başına V8 profilleri yazar.

Kaydedilmiş çıktı kuralları:

- `pnpm test:startup:bench:smoke`, hedefli smoke artifaktını `.artifacts/cli-startup-bench-smoke.json` konumuna yazar
- `pnpm test:startup:bench:save`, `runs=5` ve `warmup=1` kullanarak tam paket artifaktını `.artifacts/cli-startup-bench-all.json` konumuna yazar
- `pnpm test:startup:bench:update`, `runs=5` ve `warmup=1` kullanarak depoya işlenmiş baseline fixture’ını `test/fixtures/cli-startup-bench.json` konumunda yeniler

Depoya işlenmiş fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` ile yenileyin
- Geçerli sonuçları fixture ile `pnpm test:startup:bench:check` kullanarak karşılaştırın

## Onboarding E2E (Docker)

Docker isteğe bağlıdır; bu yalnızca container içinde çalışan onboarding smoke testleri için gereklidir.

Temiz bir Linux container’ında tam cold-start akışı:

```bash
scripts/e2e/onboard-docker.sh
```

Bu betik etkileşimli sihirbazı bir pseudo-tty üzerinden yürütür, config/workspace/session dosyalarını doğrular, ardından Gateway’i başlatır ve `openclaw health` çalıştırır.

## QR içe aktarma smoke testi (Docker)

Bakımı yapılan QR runtime yardımcısının desteklenen Docker Node runtime’ları altında yüklendiğinden emin olur (varsayılan Node 24, uyumlu Node 22):

```bash
pnpm test:docker:qr
```

## İlgili

- [Test etme](/tr/help/testing)
- [Canlı test etme](/tr/help/testing-live)
