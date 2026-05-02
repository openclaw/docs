---
read_when:
    - Testleri çalıştırma veya düzeltme
summary: Testleri yerel olarak çalıştırma (vitest) ve force/coverage modlarının ne zaman kullanılacağı
title: Testler
x-i18n:
    generated_at: "2026-05-02T21:00:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a88599d079e1ca42d73d354b582d67dd85be40fc92eed5abe6dcef37dc21f4f
    source_path: reference/test.md
    workflow: 16
---

- Tam test kiti (paketler, canlı, Docker): [Test](/tr/help/testing)
- Güncelleme ve Plugin paketi doğrulaması: [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins)

- `pnpm test:force`: Varsayılan denetim portunu tutan bekleyen gateway sürecini sonlandırır, ardından sunucu testlerinin çalışan bir örnekle çakışmaması için tam Vitest paketini yalıtılmış bir gateway portuyla çalıştırır. Önceki bir gateway çalıştırması 18789 portunu dolu bıraktığında bunu kullanın.
- `pnpm test:coverage`: Birim paketini V8 coverage ile çalıştırır (`vitest.unit.config.ts` aracılığıyla). Bu, tüm repo tüm dosya coverage değil, yüklenen dosya birim coverage kapısıdır. Eşikler satırlar/işlevler/ifadeler için %70 ve dallar için %55’tir. `coverage.all` false olduğundan kapı, her split-lane kaynak dosyasını uncovered saymak yerine birim coverage paketi tarafından yüklenen dosyaları ölçer.
- `pnpm test:coverage:changed`: Yalnızca `origin/main` sonrasında değişen dosyalar için birim coverage çalıştırır.
- `pnpm test:changed`: ucuz akıllı değişmiş test çalıştırması. Doğrudan test düzenlemelerinden, kardeş `*.test.ts` dosyalarından, açık kaynak eşlemelerinden ve yerel içe aktarma grafiğinden kesin hedefleri çalıştırır. Geniş/config/package değişiklikleri kesin testlere eşlenmedikçe atlanır.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: açık geniş değişmiş test çalıştırması. Bir test harness/config/package düzenlemesinin Vitest’in daha geniş değişmiş-test davranışına geri dönmesi gerektiğinde bunu kullanın.
- `pnpm changed:lanes`: `origin/main` ile diff tarafından tetiklenen mimari lane’leri gösterir.
- `pnpm check:changed`: `origin/main` ile diff için akıllı değişmiş kontrol kapısını çalıştırır. Etkilenen mimari lane’ler için typecheck, lint ve guard komutlarını çalıştırır, ancak Vitest testlerini çalıştırmaz. Test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` kullanın.
- `pnpm test`: açık dosya/dizin hedeflerini kapsamlı Vitest lane’leri üzerinden yönlendirir. Hedeflenmemiş çalıştırmalar sabit shard gruplarını kullanır ve yerel paralel yürütme için leaf config’lere genişler; extension grubu, tek dev bir root-project süreci yerine her zaman per-extension shard config’lerine genişler.
- Test wrapper çalıştırmaları kısa bir `[test] passed|failed|skipped ... in ...` özetiyle biter. Vitest’in kendi süre satırı per-shard ayrıntısı olarak kalır.
- Paylaşılan OpenClaw test durumu: Bir testin yalıtılmış `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture, workspace, agent dir veya auth-profile store’a ihtiyacı olduğunda Vitest’ten `src/test-utils/openclaw-test-state.ts` kullanın.
- Process E2E yardımcıları: Bir Vitest process-level E2E testinin çalışan bir Gateway’e, CLI env’e, log capture’a ve cleanup’a tek yerde ihtiyacı olduğunda `test/helpers/openclaw-test-instance.ts` kullanın.
- Docker/Bash E2E yardımcıları: `scripts/lib/docker-e2e-image.sh` kaynaklayan lane’ler container’a `docker_e2e_test_state_shell_b64 <label> <scenario>` geçirebilir ve bunu `scripts/lib/openclaw-e2e-instance.sh` ile decode edebilir; çok-home’lu betikler `docker_e2e_test_state_function_b64` geçirebilir ve her flow’da `openclaw_test_state_create <label> <scenario>` çağırabilir. Daha düşük seviyeli çağıranlar, container içi shell snippet için `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` veya source edilebilir host env dosyası için `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` kullanabilir. `create` öncesindeki `--`, daha yeni Node runtime’larının `--env-file` değerini Node flag’i olarak ele almasını engeller. Bir Gateway başlatan Docker/Bash lane’leri entrypoint çözümleme, mock OpenAI startup, Gateway foreground/background launch, readiness probe’lar, state env export, log dump’ları ve process cleanup için container içinde `scripts/lib/openclaw-e2e-instance.sh` kaynaklayabilir.
- Tam, extension ve include-pattern shard çalıştırmaları yerel zamanlama verilerini `.artifacts/vitest-shard-timings.json` içinde günceller; sonraki whole-config çalıştırmaları yavaş ve hızlı shard’ları dengelemek için bu zamanlamaları kullanır. Include-pattern CI shard’ları shard adını zamanlama anahtarına ekler; bu, filtrelenmiş shard zamanlamalarını whole-config zamanlama verilerini değiştirmeden görünür tutar. Yerel zamanlama artifact’ini yok saymak için `OPENCLAW_TEST_PROJECTS_TIMINGS=0` ayarlayın.
- Seçili `plugin-sdk` ve `commands` test dosyaları artık yalnızca `test/setup.ts` tutan özel hafif lane’lerden yönlendirilir; runtime-ağır durumlar mevcut lane’lerinde kalır.
- Kardeş testleri olan kaynak dosyalar, daha geniş dizin glob’larına geri dönmeden önce o kardeşe eşlenir. `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` ve `src/plugins/contracts` altındaki yardımcı düzenlemeleri, bağımlılık yolu kesin olduğunda her shard’ı geniş çalıştırmak yerine içe aktaran testleri çalıştırmak için yerel bir içe aktarma grafiği kullanır.
- `auto-reply` artık üç özel config’e (`core`, `top-level`, `reply`) de bölünür, böylece reply harness daha hafif top-level status/token/helper testlerine baskın gelmez.
- Temel Vitest config artık varsayılan olarak `pool: "threads"` ve `isolate: false` kullanır; paylaşılan non-isolated runner repo config’leri genelinde etkindir.
- `pnpm test:channels`, `vitest.channels.config.ts` çalıştırır.
- `pnpm test:extensions` ve `pnpm test extensions`, tüm extension/Plugin shard’larını çalıştırır. Ağır channel Plugin’leri, browser Plugin’i ve OpenAI özel shard’lar olarak çalışır; diğer Plugin grupları batched kalır. Tek bir bundled Plugin lane’i için `pnpm test extensions/<id>` kullanın.
- `pnpm test:perf:imports`: açık dosya/dizin hedefleri için kapsamlı lane yönlendirmesini kullanmaya devam ederken Vitest import-duration + import-breakdown raporlamasını etkinleştirir.
- `pnpm test:perf:imports:changed`: aynı import profilini çıkarır, ancak yalnızca `origin/main` sonrasında değişen dosyalar için.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş changed-mode yolunu aynı commit edilmiş git diff’i için native root-project çalıştırmasına karşı benchmark eder.
- `pnpm test:perf:changed:bench -- --worktree`, mevcut worktree değişiklik setini önce commit etmeden benchmark eder.
- `pnpm test:perf:profile:main`: Vitest ana thread’i için bir CPU profili yazar (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: birim runner için CPU + heap profilleri yazar (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: Her full-suite Vitest leaf config’i seri olarak çalıştırır ve gruplanmış süre verileri ile per-config JSON/log artifact’leri yazar. Test Performance Agent bunu yavaş-test düzeltmelerini denemeden önce baseline olarak kullanır.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: performans odaklı bir değişiklikten sonra gruplanmış raporları karşılaştırır.
- Gateway entegrasyonu: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` veya `pnpm test:gateway` ile opt-in.
- `pnpm test:e2e`: Gateway end-to-end smoke testlerini çalıştırır (multi-instance WS/HTTP/node pairing). Varsayılan olarak `vitest.e2e.config.ts` içinde adaptive worker’larla `threads` + `isolate: false` kullanır; `OPENCLAW_E2E_WORKERS=<n>` ile ayarlayın ve ayrıntılı loglar için `OPENCLAW_E2E_VERBOSE=1` ayarlayın.
- `pnpm test:live`: Provider live testlerini çalıştırır (minimax/zai). Atlamayı kaldırmak için API anahtarları ve `LIVE=1` (veya provider’a özgü `*_LIVE_TEST=1`) gerekir.
- `pnpm test:docker:all`: Paylaşılan live-test image’ını build eder, OpenClaw’ı npm tarball olarak bir kez paketler, yalın Node/Git runner image’ı ile bu tarball’ı `/app` içine kuran işlevsel bir image build eder/yeniden kullanır, ardından Docker smoke lane’lerini `OPENCLAW_SKIP_DOCKER_BUILD=1` ile weighted scheduler üzerinden çalıştırır. Yalın image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) installer/update/plugin-dependency lane’leri için kullanılır; bu lane’ler kopyalanmış repo kaynakları yerine önceden build edilmiş tarball’ı mount eder. İşlevsel image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) normal built-app işlevsellik lane’leri için kullanılır. `scripts/package-openclaw-for-docker.mjs` tek yerel/CI package packer’dır ve Docker onu tüketmeden önce tarball ile `dist/postinstall-inventory.json` dosyasını doğrular. Docker lane tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde yaşar; planner mantığı `scripts/lib/docker-e2e-plan.mjs` içinde yaşar; `scripts/test-docker-all.mjs` seçilen planı yürütür. `node scripts/test-docker-all.mjs --plan-json`, build veya Docker çalıştırmadan seçilen lane’ler, image türleri, package/live-image gereksinimleri, state scenario’ları ve credential check’leri için scheduler-owned CI planını yayar. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` process slotlarını denetler ve varsayılanı 10’dur; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` provider-sensitive tail pool’u denetler ve varsayılanı 10’dur. Ağır lane sınırları varsayılan olarak `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` değerleridir; provider sınırları `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` ve `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` ile provider başına varsayılan olarak bir ağır lane’dir. Daha büyük host’lar için `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` kullanın. Düşük paralellikli bir host’ta bir lane etkin ağırlık veya kaynak sınırını aşarsa, yine de boş bir pool’dan başlayabilir ve kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel Docker daemon create fırtınalarını önlemek için lane başlangıçları varsayılan olarak 2 saniye aralıklandırılır; `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` ile override edin. Runner varsayılan olarak Docker preflight yapar, eski OpenClaw E2E container’larını temizler, her 30 saniyede active-lane durumunu yayar, uyumlu lane’ler arasında provider CLI tool cache’lerini paylaşır, geçici live-provider hatalarını varsayılan olarak bir kez yeniden dener (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) ve sonraki çalıştırmalarda longest-first sıralama için lane zamanlamalarını `.artifacts/docker-tests/lane-timings.json` içinde saklar. Docker çalıştırmadan lane manifest’ini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, durum çıktısını ayarlamak için `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` veya zamanlama yeniden kullanımını devre dışı bırakmak için `OPENCLAW_DOCKER_ALL_TIMINGS=0` kullanın. Yalnızca deterministic/local lane’ler için `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` veya yalnızca live-provider lane’leri için `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` kullanın; package alias’ları `pnpm test:docker:local:all` ve `pnpm test:docker:live:all` şeklindedir. Live-only mode, provider bucket’larının Claude, Codex ve Gemini işlerini birlikte paketleyebilmesi için main ve tail live lane’leri tek longest-first pool’da birleştirir. Runner, `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` ayarlanmadıkça ilk hatadan sonra yeni pooled lane zamanlamayı durdurur ve her lane’in `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ile override edilebilen 120 dakikalık fallback timeout’u vardır; seçili live/tail lane’ler daha sıkı per-lane sınırları kullanır. CLI backend Docker setup komutlarının `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (varsayılan 180) üzerinden kendi timeout’u vardır. Per-lane loglar, `summary.json`, `failures.json` ve phase timing’ler `.artifacts/docker-tests/<run-id>/` altına yazılır; yavaş lane’leri incelemek için `pnpm test:docker:timings <summary.json>` ve ucuz hedefli rerun komutlarını yazdırmak için `pnpm test:docker:rerun <run-id|summary.json|failures.json>` kullanın.
- `pnpm test:docker:browser-cdp-snapshot`: Chromium destekli bir source E2E container build eder, raw CDP artı yalıtılmış bir Gateway başlatır, `browser doctor --deep` çalıştırır ve CDP role snapshot’larının link URL’lerini, cursor-promoted clickables’ı, iframe ref’lerini ve frame metadata’yı içerdiğini doğrular.
- CLI backend live Docker probe’ları odaklı lane’ler olarak çalıştırılabilir; örneğin `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` veya `pnpm test:docker:live-cli-backend:codex:mcp`. Claude ve Gemini için de eşleşen `:resume` ve `:mcp` alias’ları vardır.
- `pnpm test:docker:openwebui`: Dockerized OpenClaw + Open WebUI başlatır, Open WebUI üzerinden oturum açar, `/api/models` kontrol eder, ardından `/api/chat/completions` üzerinden gerçek bir proxied chat çalıştırır. Kullanılabilir bir live model anahtarı gerektirir (örneğin `~/.profile` içinde OpenAI), harici bir Open WebUI image’ı çeker ve normal unit/e2e paketleri kadar CI-stable olması beklenmez.
- `pnpm test:docker:mcp-channels`: Seed edilmiş bir Gateway container’ı ve `openclaw mcp serve` başlatan ikinci bir client container başlatır, ardından gerçek stdio bridge üzerinden yönlendirilmiş conversation discovery’yi, transcript okumalarını, attachment metadata’yı, live event queue davranışını, outbound send routing’i ve Claude-style channel + permission notification’larını doğrular. Claude notification assertion, smoke’un bridge’in gerçekten yaydığı şeyi yansıtması için raw stdio MCP frame’lerini doğrudan okur.
- `pnpm test:docker:upgrade-survivor`: Paketlenmiş OpenClaw tarball’unu kirli bir eski kullanıcı fixture’ının üzerine kurar, canlı provider veya kanal anahtarları olmadan paket güncellemesini ve etkileşimsiz doctor’ı çalıştırır, ardından bir loopback Gateway başlatır ve agent’ların, kanal yapılandırmasının, Plugin izin listelerinin, workspace/session dosyalarının, eski legacy Plugin bağımlılık durumunun, başlangıcın ve RPC durumunun korunduğunu denetler.
- `pnpm test:docker:published-upgrade-survivor`: Varsayılan olarak `openclaw@latest` kurar, canlı provider veya kanal anahtarları olmadan gerçekçi mevcut kullanıcı dosyalarını hazırlar, bu baseline’ı yerleşik bir `openclaw config set` komut tarifiyle yapılandırır, yayımlanmış kurulumu paketlenmiş OpenClaw tarball’una günceller, etkileşimsiz doctor çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar, ardından bir loopback Gateway başlatır ve yapılandırılmış intent’lerin, workspace/session dosyalarının, eski Plugin yapılandırmasının ve legacy bağımlılık durumunun, başlangıcın, `/healthz`, `/readyz` ve RPC durumunun korunduğunu veya temiz biçimde onarıldığını denetler. Tek bir baseline’ı `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile geçersiz kılın, `all-since-2026.4.23` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile tam bir matrisi genişletin veya `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` ile senaryo fixture’ları ekleyin; reported-issues kümesi, yapılandırılmış harici OpenClaw Plugin’lerinin yükseltme sırasında otomatik olarak kurulduğunu doğrulamak için `configured-plugin-installs` içerir. Package Acceptance bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar.
- `pnpm test:docker:update-migration`: Yayımlanmış yükseltme survivor harness’ını, varsayılan olarak `openclaw@2026.4.23` sürümünden başlayarak cleanup ağırlıklı `plugin-deps-cleanup` senaryosunda çalıştırır. Ayrı `Update Migration` workflow’u bu lane’i `baselines=all-since-2026.4.23` ile genişletir; böylece `.23` ve sonrasındaki her kararlı yayımlanmış paket adaya güncellenir ve yapılandırılmış Plugin bağımlılığı temizliğini Full Release CI dışında kanıtlar.
- `pnpm test:docker:plugins`: Yerel yol, `file:`, hoist edilmiş bağımlılıkları olan npm registry paketleri, git moving ref’leri, ClawHub fixture’ları, marketplace güncellemeleri ve Claude-bundle etkinleştirme/inceleme için kurulum/güncelleme smoke testini çalıştırır.

## Yerel PR geçidi

Yerel PR birleştirme/geçit kontrolleri için şunu çalıştırın:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test`, yük altındaki bir makinede aralıklı hata verirse bunu regresyon olarak değerlendirmeden önce bir kez yeniden çalıştırın, ardından `pnpm test <path/to/test>` ile izole edin. Belleği kısıtlı makineler için şunu kullanın:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model gecikme kıyaslaması (yerel anahtarlar)

Betik: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Kullanım:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- İsteğe bağlı ortam: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Varsayılan istem: “Tek bir kelimeyle yanıt ver: ok. Noktalama veya ek metin yok.”

Son çalıştırma (2025-12-31, 20 çalıştırma):

- minimax medyan 1279ms (min 1114, maks 2431)
- opus medyan 2454ms (min 1224, maks 3170)

## CLI başlangıç kıyaslaması

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

Çıktı, her komut için `sampleCount`, ortalama, p50, p95, min/maks, çıkış kodu/sinyal dağılımı ve maks RSS özetlerini içerir. İsteğe bağlı `--cpu-prof-dir` / `--heap-prof-dir`, çalıştırma başına V8 profilleri yazar; böylece zamanlama ve profil yakalama aynı düzenekle yapılır.

Kaydedilen çıktı kuralları:

- `pnpm test:startup:bench:smoke`, hedefli duman testi artifaktını `.artifacts/cli-startup-bench-smoke.json` konumuna yazar
- `pnpm test:startup:bench:save`, `runs=5` ve `warmup=1` kullanarak tam paket artifaktını `.artifacts/cli-startup-bench-all.json` konumuna yazar
- `pnpm test:startup:bench:update`, `runs=5` ve `warmup=1` kullanarak depoya eklenmiş temel fixture dosyasını `test/fixtures/cli-startup-bench.json` konumunda yeniler

Depoya eklenmiş fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` ile yenileyin
- Geçerli sonuçları fixture ile `pnpm test:startup:bench:check` kullanarak karşılaştırın

## Onboarding E2E (Docker)

Docker isteğe bağlıdır; bu yalnızca konteynerleştirilmiş onboarding duman testleri için gereklidir.

Temiz bir Linux konteynerinde tam soğuk başlangıç akışı:

```bash
scripts/e2e/onboard-docker.sh
```

Bu betik, etkileşimli sihirbazı bir pseudo-tty üzerinden yürütür, config/çalışma alanı/oturum dosyalarını doğrular, ardından Gateway'i başlatır ve `openclaw health` çalıştırır.

## QR içe aktarma duman testi (Docker)

Bakımı yapılan QR çalışma zamanı yardımcısının desteklenen Docker Node çalışma zamanlarında (varsayılan Node 24, uyumlu Node 22) yüklendiğinden emin olur:

```bash
pnpm test:docker:qr
```

## İlgili

- [Test Etme](/tr/help/testing)
- [Canlı Test Etme](/tr/help/testing-live)
- [Güncellemeleri ve Plugin'leri Test Etme](/tr/help/testing-updates-plugins)
