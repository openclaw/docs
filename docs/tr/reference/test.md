---
read_when:
    - Testleri çalıştırma veya düzeltme
summary: Testleri yerel olarak çalıştırma (vitest) ve force/coverage modlarının ne zaman kullanılacağı
title: Testler
x-i18n:
    generated_at: "2026-05-05T06:18:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc31ab27a63607ec5134306a0129bd164e4235f26631da4f691f657adda70eed
    source_path: reference/test.md
    workflow: 16
---

- Tam test kiti (test paketleri, canlı, Docker): [Test Etme](/tr/help/testing)
- Güncelleme ve Plugin paketi doğrulaması: [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins)

- `pnpm test:force`: Varsayılan denetim portunu tutan kalmış herhangi bir gateway sürecini sonlandırır, ardından sunucu testlerinin çalışan bir örnekle çakışmaması için tam Vitest paketini yalıtılmış bir Gateway portuyla çalıştırır. Bunu, önceki bir Gateway çalıştırması 18789 portunu dolu bıraktığında kullanın.
- `pnpm test:coverage`: Birim paketini V8 kapsamıyla (`vitest.unit.config.ts` üzerinden) çalıştırır. Bu, tüm repo tüm dosya kapsamı değil, yüklenmiş dosya birim kapsamı kapısıdır. Eşikler satırlar/fonksiyonlar/ifadeler için %70 ve dallar için %55’tir. `coverage.all` false olduğundan kapı, her bölünmüş hat kaynak dosyasını kapsanmamış saymak yerine birim kapsam paketi tarafından yüklenen dosyaları ölçer.
- `pnpm test:coverage:changed`: Yalnızca `origin/main` sonrasındaki değişen dosyalar için birim kapsamını çalıştırır.
- `pnpm test:changed`: ucuz akıllı değişen test çalıştırması. Doğrudan test düzenlemelerinden, kardeş `*.test.ts` dosyalarından, açık kaynak eşlemelerinden ve yerel içe aktarma grafiğinden kesin hedefleri çalıştırır. Geniş/config/paket değişiklikleri, kesin testlere eşlenmedikçe atlanır.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: açık geniş değişen test çalıştırması. Bir test donanımı/config/paket düzenlemesinin Vitest'in daha geniş değişen-test davranışına geri düşmesi gerektiğinde kullanın.
- `pnpm changed:lanes`: `origin/main` ile diff tarafından tetiklenen mimari hatları gösterir.
- `pnpm check:changed`: `origin/main` ile diff için akıllı değişen denetim kapısını çalıştırır. Etkilenen mimari hatlar için typecheck, lint ve guard komutlarını çalıştırır, ancak Vitest testlerini çalıştırmaz. Test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` kullanın.
- `pnpm test`: açık dosya/dizin hedeflerini kapsamlı Vitest hatları üzerinden yönlendirir. Hedefsiz çalıştırmalar sabit shard gruplarını kullanır ve yerel paralel yürütme için yaprak config’lere genişler; extension grubu, tek bir dev kök-proje süreci yerine her zaman extension başına shard config’lerine genişler.
- Test sarmalayıcı çalıştırmaları kısa bir `[test] passed|failed|skipped ... in ...` özetiyle biter. Vitest'in kendi süre satırı shard başına ayrıntı olarak kalır.
- Paylaşılan OpenClaw test durumu: Bir testin yalıtılmış `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture’ı, çalışma alanı, agent dizini veya auth-profile deposuna ihtiyacı olduğunda Vitest’ten `src/test-utils/openclaw-test-state.ts` kullanın.
- Süreç E2E yardımcıları: Bir Vitest süreç düzeyi E2E testinin çalışan bir Gateway’e, CLI env’ye, günlük yakalamaya ve temizliğe tek yerde ihtiyacı olduğunda `test/helpers/openclaw-test-instance.ts` kullanın.
- Docker/Bash E2E yardımcıları: `scripts/lib/docker-e2e-image.sh` kaynaklayan hatlar, konteynere `docker_e2e_test_state_shell_b64 <label> <scenario>` aktarabilir ve bunu `scripts/lib/openclaw-e2e-instance.sh` ile decode edebilir; çoklu-home betikleri `docker_e2e_test_state_function_b64` aktarabilir ve her akışta `openclaw_test_state_create <label> <scenario>` çağırabilir. Daha alt düzey çağıranlar, konteyner içi shell snippet’i için `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` kullanabilir veya kaynaklanabilir host env dosyası için `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` kullanabilir. `create` öncesindeki `--`, daha yeni Node runtime’larının `--env-file` değerini bir Node flag’i olarak işlemesini engeller. Gateway başlatan Docker/Bash hatları, entrypoint çözümleme, mock OpenAI başlatma, Gateway ön plan/arka plan başlatma, hazır olma yoklamaları, durum env dışa aktarımı, günlük dökümleri ve süreç temizliği için konteyner içinde `scripts/lib/openclaw-e2e-instance.sh` kaynaklayabilir.
- Tam, extension ve include-pattern shard çalıştırmaları yerel zamanlama verilerini `.artifacts/vitest-shard-timings.json` içinde günceller; sonraki bütün-config çalıştırmaları, yavaş ve hızlı shard’ları dengelemek için bu zamanlamaları kullanır. Include-pattern CI shard’ları shard adını zamanlama anahtarına ekler; bu, filtrelenmiş shard zamanlamalarını bütün-config zamanlama verisinin yerini almadan görünür tutar. Yerel zamanlama yapıtını yok saymak için `OPENCLAW_TEST_PROJECTS_TIMINGS=0` ayarlayın.
- Seçili `plugin-sdk` ve `commands` test dosyaları artık yalnızca `test/setup.ts` tutan özel hafif hatlar üzerinden yönlendirilir; runtime-ağır vakalar mevcut hatlarında kalır.
- Kardeş testleri olan kaynak dosyalar, daha geniş dizin glob’larına geri düşmeden önce o kardeşe eşlenir. `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` ve `src/plugins/contracts` altındaki yardımcı düzenlemeleri, dependency yolu kesin olduğunda her shard’ı geniş çalıştırmak yerine içe aktaran testleri çalıştırmak için yerel içe aktarma grafiği kullanır.
- `auto-reply` artık üç özel config’e (`core`, `top-level`, `reply`) de bölünür; böylece reply donanımı daha hafif top-level durum/token/yardımcı testlerine baskın gelmez.
- Temel Vitest config’i artık varsayılan olarak `pool: "threads"` ve `isolate: false` kullanır; paylaşılan yalıtılmamış runner repo config’leri genelinde etkindir.
- `pnpm test:channels`, `vitest.channels.config.ts` çalıştırır.
- `pnpm test:extensions` ve `pnpm test extensions`, tüm extension/Plugin shard’larını çalıştırır. Ağır kanal Plugin’leri, tarayıcı Plugin’i ve OpenAI özel shard’lar olarak çalışır; diğer Plugin grupları toplu kalır. Tek bir paketli Plugin hattı için `pnpm test extensions/<id>` kullanın.
- `pnpm test:perf:imports`: açık dosya/dizin hedefleri için kapsamlı hat yönlendirmesini kullanmaya devam ederken Vitest içe aktarma-süresi + içe aktarma-dökümü raporlamasını etkinleştirir.
- `pnpm test:perf:imports:changed`: aynı içe aktarma profillemesi, ancak yalnızca `origin/main` sonrasındaki değişen dosyalar için.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş changed-mode yolunu aynı commit’lenmiş git diff’i için yerel kök-proje çalıştırmasına karşı benchmark eder.
- `pnpm test:perf:changed:bench -- --worktree`, önce commit etmeden geçerli worktree değişiklik kümesini benchmark eder.
- `pnpm test:perf:profile:main`: Vitest ana thread’i için CPU profili yazar (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: birim runner için CPU + heap profilleri yazar (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: her tam-paket Vitest yaprak config’ini seri çalıştırır ve gruplandırılmış süre verilerini, config başına JSON/günlük yapıtlarıyla birlikte yazar. Test Performansı Aracısı, yavaş-test düzeltmelerini denemeden önce bunu baseline olarak kullanır.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: performans odaklı bir değişiklikten sonra gruplandırılmış raporları karşılaştırır.
- Gateway entegrasyonu: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` veya `pnpm test:gateway` ile opt-in.
- `pnpm test:e2e`: Gateway uçtan uca smoke testlerini çalıştırır (çoklu örnek WS/HTTP/node eşleştirmesi). `vitest.e2e.config.ts` içinde uyarlanabilir worker’larla varsayılan olarak `threads` + `isolate: false` kullanır; `OPENCLAW_E2E_WORKERS=<n>` ile ayarlayın ve ayrıntılı günlükler için `OPENCLAW_E2E_VERBOSE=1` ayarlayın.
- `pnpm test:live`: sağlayıcı canlı testlerini (minimax/zai) çalıştırır. Atlamayı kaldırmak için API anahtarları ve `LIVE=1` (veya sağlayıcıya özgü `*_LIVE_TEST=1`) gerektirir.
- `pnpm test:docker:all`: Paylaşılan canlı-test imajını build eder, OpenClaw’u bir kez npm tarball olarak paketler, çıplak Node/Git runner imajı ile bu tarball’u `/app` içine kuran işlevsel imajı build eder/yeniden kullanır, ardından Docker smoke hatlarını ağırlıklı scheduler üzerinden `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır. Çıplak imaj (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) installer/update/plugin-dependency hatları için kullanılır; bu hatlar kopyalanmış repo kaynaklarını kullanmak yerine önceden build edilmiş tarball’u mount eder. İşlevsel imaj (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) normal build edilmiş-app işlevsellik hatları için kullanılır. `scripts/package-openclaw-for-docker.mjs`, tek yerel/CI paketleyicisidir ve Docker tüketmeden önce tarball ile `dist/postinstall-inventory.json` değerini doğrular. Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içindedir; planner mantığı `scripts/lib/docker-e2e-plan.mjs` içindedir; `scripts/test-docker-all.mjs` seçili planı yürütür. `node scripts/test-docker-all.mjs --plan-json`, build etmeden veya Docker çalıştırmadan seçili hatlar, imaj türleri, paket/canlı-imaj ihtiyaçları, durum senaryoları ve kimlik bilgisi denetimleri için scheduler’ın sahip olduğu CI planını yayar. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` süreç slotlarını denetler ve varsayılanı 10’dur; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` sağlayıcıya duyarlı tail pool’u denetler ve varsayılanı 10’dur. Ağır hat sınırları varsayılan olarak `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` değerleridir; sağlayıcı sınırları, `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` ve `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` üzerinden sağlayıcı başına varsayılan olarak bir ağır hattır. Daha büyük host’lar için `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` kullanın. Düşük paralellikli bir host’ta bir hat etkin ağırlık veya kaynak sınırını aşarsa yine de boş pool’dan başlayabilir ve kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel Docker daemon create fırtınalarını önlemek için hat başlangıçları varsayılan olarak 2 saniye aralıklandırılır; `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` ile geçersiz kılın. Runner varsayılan olarak Docker preflight yapar, bayat OpenClaw E2E konteynerlerini temizler, her 30 saniyede etkin-hat durumu yayar, uyumlu hatlar arasında sağlayıcı CLI araç cache’lerini paylaşır, geçici canlı-sağlayıcı hatalarını varsayılan olarak bir kez yeniden dener (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) ve sonraki çalıştırmalarda en uzundan ilke sıralaması için hat zamanlamalarını `.artifacts/docker-tests/lane-timings.json` içinde saklar. Docker çalıştırmadan hat manifest’ini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, durum çıktısını ayarlamak için `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` veya zamanlama yeniden kullanımını devre dışı bırakmak için `OPENCLAW_DOCKER_ALL_TIMINGS=0` kullanın. Yalnızca deterministik/yerel hatlar için `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` veya yalnızca canlı-sağlayıcı hatları için `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` kullanın; paket alias’ları `pnpm test:docker:local:all` ve `pnpm test:docker:live:all` değerleridir. Live-only modu, ana ve tail canlı hatlarını tek bir en-uzundan-ilke pool’da birleştirir; böylece sağlayıcı bucket’ları Claude, Codex ve Gemini işlerini birlikte paketleyebilir. Runner, `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` ayarlanmadıkça ilk hatadan sonra yeni pool hatları zamanlamayı durdurur ve her hattın `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ile geçersiz kılınabilen 120 dakikalık fallback timeout’u vardır; seçili live/tail hatları daha sıkı hat başına sınırlar kullanır. CLI backend Docker kurulum komutlarının `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` üzerinden kendi timeout’u vardır (varsayılan 180). Hat başına günlükler, `summary.json`, `failures.json` ve aşama zamanlamaları `.artifacts/docker-tests/<run-id>/` altına yazılır; yavaş hatları incelemek için `pnpm test:docker:timings <summary.json>`, ucuz hedefli yeniden çalıştırma komutlarını yazdırmak için `pnpm test:docker:rerun <run-id|summary.json|failures.json>` kullanın.
- `pnpm test:docker:browser-cdp-snapshot`: Chromium destekli bir kaynak E2E konteyneri build eder, ham CDP ve yalıtılmış bir Gateway başlatır, `browser doctor --deep` çalıştırır ve CDP rol snapshot’larının link URL’lerini, cursor-promoted clickables öğelerini, iframe ref’lerini ve frame metadata’sını içerdiğini doğrular.
- CLI backend canlı Docker yoklamaları odaklı hatlar olarak çalıştırılabilir; örneğin `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` veya `pnpm test:docker:live-cli-backend:codex:mcp`. Claude ve Gemini için eşleşen `:resume` ve `:mcp` alias’ları vardır.
- `pnpm test:docker:openwebui`: Dockerized OpenClaw + Open WebUI başlatır, Open WebUI üzerinden oturum açar, `/api/models` denetler, ardından `/api/chat/completions` üzerinden gerçek proxied chat çalıştırır. Kullanılabilir bir canlı model anahtarı gerektirir (örneğin `~/.profile` içindeki OpenAI), harici bir Open WebUI imajı çeker ve normal unit/e2e paketleri gibi CI-kararlı olması beklenmez.
- `pnpm test:docker:mcp-channels`: Seed edilmiş bir Gateway konteyneri ve `openclaw mcp serve` başlatan ikinci bir istemci konteyneri başlatır; ardından gerçek stdio köprüsü üzerinden yönlendirilmiş konuşma keşfini, transcript okumalarını, attachment metadata’sını, canlı event queue davranışını, outbound send yönlendirmesini ve Claude tarzı kanal + izin bildirimlerini doğrular. Claude bildirim assertion’ı ham stdio MCP frame’lerini doğrudan okur; böylece smoke köprünün gerçekten yaydığı şeyi yansıtır.
- `pnpm test:docker:upgrade-survivor`: Paketlenmiş OpenClaw tarball'ını kirli bir eski kullanıcı fixture'ının üzerine kurar, canlı sağlayıcı veya kanal anahtarları olmadan paket güncellemesini ve etkileşimsiz doctor'ı çalıştırır, ardından bir loopback Gateway başlatır ve agent'ların, kanal yapılandırmasının, Plugin allowlist'lerinin, workspace/session dosyalarının, eskimiş eski Plugin bağımlılık durumunun, başlatmanın ve RPC durumunun korunduğunu denetler.
- `pnpm test:docker:published-upgrade-survivor`: Varsayılan olarak `openclaw@latest` kurar, canlı sağlayıcı veya kanal anahtarları olmadan gerçekçi mevcut kullanıcı dosyaları hazırlar, bu temeli gömülü bir `openclaw config set` komut tarifiyle yapılandırır, yayımlanmış bu kurulumu paketlenmiş OpenClaw tarball'ına günceller, etkileşimsiz doctor çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar, ardından bir loopback Gateway başlatır ve yapılandırılmış intent'lerin, workspace/session dosyalarının, eskimiş Plugin yapılandırmasının ve eski bağımlılık durumunun, başlatmanın, `/healthz`, `/readyz` ve RPC durumunun korunduğunu veya temiz biçimde onarıldığını denetler. Tek bir temeli `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile geçersiz kılın, `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile kesin bir yerel matrisi genişletin veya `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` ile senaryo fixture'ları ekleyin; reported-issues kümesi, yapılandırılmış harici OpenClaw Plugin'lerinin yükseltme sırasında otomatik olarak kurulduğunu doğrulamak için `configured-plugin-installs` ve yalnızca kaynakta bulunan Plugin gölgelerinin başlatmayı bozmasını önlemek için `stale-source-plugin-shadow` içerir. Package Acceptance bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar ve Docker hatlarına kesin paket spesifikasyonlarını vermeden önce `last-stable-4` veya `all-since-2026.4.23` gibi meta temel belirteçlerini çözümler.
- `pnpm test:docker:update-migration`: Varsayılan olarak `openclaw@2026.4.23` ile başlayıp, yayımlanmış yükseltme dayanıklılık koşumunu temizliği yoğun `plugin-deps-cleanup` senaryosunda çalıştırır. Ayrı `Update Migration` iş akışı bu hattı `baselines=all-since-2026.4.23` ile genişletir; böylece `.23` sürümünden itibaren yayımlanmış her kararlı paket adaya güncellenir ve yapılandırılmış Plugin bağımlılığı temizliğini Full Release CI dışında kanıtlar.
- `pnpm test:docker:plugins`: Yerel yol, `file:`, yukarı taşınmış bağımlılıklara sahip npm registry paketleri, git hareketli ref'leri, ClawHub fixture'ları, marketplace güncellemeleri ve Claude-bundle etkinleştirme/inceleme için kurulum/güncelleme smoke testlerini çalıştırır.

## Yerel PR geçidi

Yerel PR land/gate denetimleri için şunları çalıştırın:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` yüklü bir host üzerinde düzensiz başarısız olursa, bunu regresyon olarak değerlendirmeden önce bir kez yeniden çalıştırın, ardından `pnpm test <path/to/test>` ile izole edin. Belleği kısıtlı host'lar için şunları kullanın:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model gecikme benchmark'ı (yerel anahtarlar)

Betik: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Kullanım:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- İsteğe bağlı env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Varsayılan prompt: “Tek bir kelimeyle yanıt ver: ok. Noktalama veya ek metin yok.”

Son çalıştırma (2025-12-31, 20 çalıştırma):

- minimax medyan 1279 ms (min 1114, maks 2431)
- opus medyan 2454 ms (min 1224, maks 3170)

## CLI başlatma benchmark'ı

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

Preset'ler:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: her iki preset

Çıktı, her komut için `sampleCount`, ortalama, p50, p95, min/maks, çıkış kodu/sinyal dağılımı ve maks RSS özetlerini içerir. İsteğe bağlı `--cpu-prof-dir` / `--heap-prof-dir`, zamanlama ve profil yakalamanın aynı harness'i kullanması için her çalıştırma başına V8 profilleri yazar.

Kaydedilen çıktı kuralları:

- `pnpm test:startup:bench:smoke`, hedeflenen smoke artifact'ini `.artifacts/cli-startup-bench-smoke.json` konumuna yazar
- `pnpm test:startup:bench:save`, `runs=5` ve `warmup=1` kullanarak tam paket artifact'ini `.artifacts/cli-startup-bench-all.json` konumuna yazar
- `pnpm test:startup:bench:update`, `runs=5` ve `warmup=1` kullanarak depoya işlenmiş baseline fixture'ını `test/fixtures/cli-startup-bench.json` konumunda yeniler

Depoya işlenmiş fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` ile yenileyin
- Geçerli sonuçları `pnpm test:startup:bench:check` ile fixture'a göre karşılaştırın

## Onboarding E2E (Docker)

Docker isteğe bağlıdır; bu yalnızca container'laştırılmış onboarding smoke testleri için gereklidir.

Temiz bir Linux container'ında tam cold-start akışı:

```bash
scripts/e2e/onboard-docker.sh
```

Bu betik, etkileşimli wizard'ı bir pseudo-tty üzerinden çalıştırır, config/workspace/session dosyalarını doğrular, ardından Gateway'i başlatır ve `openclaw health` çalıştırır.

## QR içe aktarma smoke testi (Docker)

Bakımı yapılan QR runtime yardımcısının desteklenen Docker Node runtime'ları altında (Node 24 varsayılan, Node 22 uyumlu) yüklendiğinden emin olur:

```bash
pnpm test:docker:qr
```

## İlgili

- [Test Etme](/tr/help/testing)
- [Canlı test etme](/tr/help/testing-live)
- [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins)
