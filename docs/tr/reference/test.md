---
read_when:
    - Testleri çalıştırma veya düzeltme
summary: Testleri yerel olarak nasıl çalıştırırsınız (vitest) ve force/coverage modlarını ne zaman kullanmalısınız
title: Testler
x-i18n:
    generated_at: "2026-04-30T18:38:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 131f2bad3b2806d28394213cec38d632d106ddbf8ff04d06345ab8046fb8bcf2
    source_path: reference/test.md
    workflow: 16
---

- Tam test kiti (test takımları, canlı, Docker): [Test](/tr/help/testing)

- `pnpm test:force`: Varsayılan kontrol portunu tutan kalmış Gateway işlemlerini sonlandırır, ardından sunucu testlerinin çalışan bir örnekle çakışmaması için tam Vitest paketini yalıtılmış bir Gateway portuyla çalıştırır. Önceki bir Gateway çalıştırması 18789 portunu dolu bıraktığında bunu kullanın.
- `pnpm test:coverage`: Birim paketini V8 kapsamıyla (`vitest.unit.config.ts` üzerinden) çalıştırır. Bu, tüm depo ve tüm dosyalar için kapsam değil, yüklenen dosyalara yönelik birim kapsam geçididir. Eşikler satırlar/işlevler/ifadeler için %70 ve dallar için %55’tir. `coverage.all` false olduğundan geçit, her bölünmüş şerit kaynak dosyasını kapsanmamış saymak yerine birim kapsam paketi tarafından yüklenen dosyaları ölçer.
- `pnpm test:coverage:changed`: Yalnızca `origin/main` sonrasında değişen dosyalar için birim kapsamını çalıştırır.
- `pnpm test:changed`: ucuz akıllı değişen test çalıştırması. Doğrudan test düzenlemelerinden, kardeş `*.test.ts` dosyalarından, açık kaynak eşlemelerinden ve yerel içe aktarma grafiğinden kesin hedefleri çalıştırır. Geniş/config/paket değişiklikleri, kesin testlere eşlenmedikçe atlanır.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: açık geniş değişen test çalıştırması. Bir test altyapısı/config/paket düzenlemesinin Vitest’in daha geniş değişen test davranışına geri dönmesi gerektiğinde bunu kullanın.
- `pnpm changed:lanes`: `origin/main` ile diff tarafından tetiklenen mimari şeritleri gösterir.
- `pnpm check:changed`: `origin/main` ile diff için akıllı değişen kontrol geçidini çalıştırır. Etkilenen mimari şeritler için typecheck, lint ve guard komutlarını çalıştırır, ancak Vitest testlerini çalıştırmaz. Test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` kullanın.
- `pnpm test`: açık dosya/dizin hedeflerini kapsamlı Vitest şeritleri üzerinden yönlendirir. Hedefsiz çalıştırmalar sabit shard gruplarını kullanır ve yerel paralel yürütme için yaprak config’lere genişler; extension grubu her zaman tek bir dev kök-proje işlemi yerine extension başına shard config’lerine genişler.
- Test wrapper çalıştırmaları kısa bir `[test] passed|failed|skipped ... in ...` özetiyle biter. Vitest’in kendi süre satırı shard başına ayrıntı olarak kalır.
- Paylaşılan OpenClaw test durumu: bir test yalıtılmış `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fikstürü, çalışma alanı, ajan dizini veya auth-profile deposu gerektirdiğinde Vitest’ten `src/test-utils/openclaw-test-state.ts` kullanın.
- İşlem E2E yardımcıları: bir Vitest işlem düzeyi E2E testi tek yerde çalışan bir Gateway, CLI env, log yakalama ve cleanup gerektirdiğinde `test/helpers/openclaw-test-instance.ts` kullanın.
- Docker/Bash E2E yardımcıları: `scripts/lib/docker-e2e-image.sh` kaynaklayan şeritler, container içine `docker_e2e_test_state_shell_b64 <label> <scenario>` geçirebilir ve bunu `scripts/lib/openclaw-e2e-instance.sh` ile çözebilir; çoklu-home script’ler `docker_e2e_test_state_function_b64` geçirebilir ve her akışta `openclaw_test_state_create <label> <scenario>` çağırabilir. Daha düşük düzey çağırıcılar, container içi shell snippet’i için `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` veya source edilebilir host env dosyası için `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` kullanabilir. `create` öncesindeki `--`, daha yeni Node runtime’larının `--env-file` değerini Node flag’i olarak ele almasını engeller. Gateway başlatan Docker/Bash şeritleri, entrypoint çözümleme, mock OpenAI başlatma, Gateway ön plan/arka plan başlatma, readiness probe’ları, durum env export’u, log dökümleri ve işlem cleanup’ı için container içinde `scripts/lib/openclaw-e2e-instance.sh` kaynaklayabilir.
- Tam, extension ve include-pattern shard çalıştırmaları yerel zamanlama verilerini `.artifacts/vitest-shard-timings.json` içinde günceller; sonraki tüm-config çalıştırmaları bu zamanlamaları yavaş ve hızlı shard’ları dengelemek için kullanır. Include-pattern CI shard’ları zamanlama anahtarına shard adını ekler; bu, filtrelenmiş shard zamanlamalarını tüm-config zamanlama verilerini değiştirmeden görünür tutar. Yerel zamanlama artifact’ını yok saymak için `OPENCLAW_TEST_PROJECTS_TIMINGS=0` ayarlayın.
- Seçili `plugin-sdk` ve `commands` test dosyaları artık yalnızca `test/setup.ts` tutan özel hafif şeritlerden yönlenir; runtime açısından ağır durumlar mevcut şeritlerinde kalır.
- Kardeş testleri olan kaynak dosyaları, daha geniş dizin glob’larına geri dönmeden önce o kardeşe eşlenir. `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` ve `src/plugins/contracts` altındaki yardımcı düzenlemeleri, bağımlılık yolu kesin olduğunda her shard’ı geniş çalıştırmak yerine içe aktaran testleri çalıştırmak için yerel bir içe aktarma grafiği kullanır.
- `auto-reply` artık üç özel config’e (`core`, `top-level`, `reply`) de ayrılır, böylece reply altyapısı daha hafif top-level durum/token/yardımcı testlerini domine etmez.
- Temel Vitest config’i artık varsayılan olarak `pool: "threads"` ve `isolate: false` kullanır; paylaşılan yalıtımsız runner repo config’leri genelinde etkindir.
- `pnpm test:channels`, `vitest.channels.config.ts` çalıştırır.
- `pnpm test:extensions` ve `pnpm test extensions`, tüm extension/Plugin shard’larını çalıştırır. Ağır kanal Plugin’leri, browser Plugin’i ve OpenAI özel shard’lar olarak çalışır; diğer Plugin grupları toplu kalır. Tek bir paketli Plugin şeridi için `pnpm test extensions/<id>` kullanın.
- `pnpm test:perf:imports`: açık dosya/dizin hedefleri için kapsamlı şerit yönlendirmesini kullanmaya devam ederken Vitest içe aktarma süresi + içe aktarma dökümü raporlamasını etkinleştirir.
- `pnpm test:perf:imports:changed`: aynı içe aktarma profillemesi, ancak yalnızca `origin/main` sonrasında değişen dosyalar için.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` yönlendirilmiş changed-mode yolunu aynı commit’lenmiş git diff’i için native kök-proje çalıştırmasına karşı benchmark eder.
- `pnpm test:perf:changed:bench -- --worktree` mevcut worktree değişiklik kümesini önce commit etmeden benchmark eder.
- `pnpm test:perf:profile:main`: Vitest ana thread’i için CPU profili yazar (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: birim runner için CPU + heap profilleri yazar (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: her tam paket Vitest yaprak config’ini seri çalıştırır ve gruplanmış süre verileri ile config başına JSON/log artifact’ları yazar. Test Performance Agent bunu yavaş test düzeltmelerini denemeden önce baseline olarak kullanır.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: performans odaklı bir değişiklikten sonra gruplanmış raporları karşılaştırır.
- Gateway entegrasyonu: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` veya `pnpm test:gateway` ile opt-in yapılır.
- `pnpm test:e2e`: Gateway uçtan uca smoke testlerini çalıştırır (çoklu örnek WS/HTTP/node eşleştirme). Varsayılan olarak `vitest.e2e.config.ts` içinde uyarlanabilir worker’larla `threads` + `isolate: false` kullanır; `OPENCLAW_E2E_WORKERS=<n>` ile ayarlayın ve ayrıntılı loglar için `OPENCLAW_E2E_VERBOSE=1` ayarlayın.
- `pnpm test:live`: sağlayıcı canlı testlerini (minimax/zai) çalıştırır. Atlamayı kaldırmak için API anahtarları ve `LIVE=1` (veya sağlayıcıya özel `*_LIVE_TEST=1`) gerektirir.
- `pnpm test:docker:all`: Paylaşılan canlı test imajını oluşturur, OpenClaw’ı bir kez npm tarball olarak paketler, çıplak bir Node/Git runner imajı ile bu tarball’ı `/app` içine kuran işlevsel bir imajı oluşturur/yeniden kullanır, ardından Docker smoke şeritlerini ağırlıklı bir zamanlayıcı üzerinden `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır. Çıplak imaj (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) installer/update/plugin-dependency şeritleri için kullanılır; bu şeritler kopyalanmış repo kaynaklarını kullanmak yerine önceden oluşturulmuş tarball’ı mount eder. İşlevsel imaj (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) normal built-app işlevsellik şeritleri için kullanılır. `scripts/package-openclaw-for-docker.mjs` tek yerel/CI paketleyicisidir ve Docker kullanmadan önce tarball ile `dist/postinstall-inventory.json` doğrulaması yapar. Docker şerit tanımları `scripts/lib/docker-e2e-scenarios.mjs` içindedir; planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içindedir; `scripts/test-docker-all.mjs` seçili planı yürütür. `node scripts/test-docker-all.mjs --plan-json`, seçili şeritler, imaj türleri, paket/canlı imaj gereksinimleri, durum senaryoları ve kimlik bilgisi kontrolleri için zamanlayıcıya ait CI planını Docker oluşturmadan veya çalıştırmadan yayar. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` işlem slotlarını kontrol eder ve varsayılanı 10’dur; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` sağlayıcıya duyarlı tail pool’u kontrol eder ve varsayılanı 10’dur. Ağır şerit sınırları varsayılan olarak `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` değerleridir; sağlayıcı sınırları `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` ve `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` üzerinden sağlayıcı başına bir ağır şerit varsayar. Daha büyük host’lar için `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` kullanın. Düşük paralellikli bir host’ta bir şerit etkin ağırlık veya kaynak sınırını aşarsa yine de boş bir pool’dan başlayabilir ve kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel Docker daemon oluşturma fırtınalarını önlemek için şerit başlangıçları varsayılan olarak 2 saniye aralıklandırılır; `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` ile geçersiz kılın. Runner varsayılan olarak Docker preflight yapar, eski OpenClaw E2E container’larını temizler, her 30 saniyede etkin şerit durumunu yayar, uyumlu şeritler arasında sağlayıcı CLI araç cache’lerini paylaşır, geçici canlı sağlayıcı hatalarını varsayılan olarak bir kez yeniden dener (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) ve sonraki çalıştırmalarda en uzundan önce sıralama için şerit zamanlamalarını `.artifacts/docker-tests/lane-timings.json` içinde saklar. Docker çalıştırmadan şerit manifest’ini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, durum çıktısını ayarlamak için `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` veya zamanlama yeniden kullanımını devre dışı bırakmak için `OPENCLAW_DOCKER_ALL_TIMINGS=0` kullanın. Yalnızca deterministik/yerel şeritler için `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` veya yalnızca canlı sağlayıcı şeritleri için `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` kullanın; paket alias’ları `pnpm test:docker:local:all` ve `pnpm test:docker:live:all` şeklindedir. Yalnızca canlı modu, ana ve tail canlı şeritlerini tek bir en uzundan önce pool’da birleştirir, böylece sağlayıcı bucket’ları Claude, Codex ve Gemini işlerini birlikte paketleyebilir. Runner, `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` ayarlanmadıkça ilk hatadan sonra yeni pool şeritleri zamanlamayı durdurur ve her şeridin `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ile geçersiz kılınabilen 120 dakikalık fallback timeout’u vardır; seçili canlı/tail şeritler daha sıkı şerit başına sınırlar kullanır. CLI backend Docker kurulum komutlarının `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` üzerinden kendi timeout’u vardır (varsayılan 180). Şerit başına loglar, `summary.json`, `failures.json` ve faz zamanlamaları `.artifacts/docker-tests/<run-id>/` altına yazılır; yavaş şeritleri incelemek için `pnpm test:docker:timings <summary.json>` ve ucuz hedefli yeniden çalıştırma komutlarını yazdırmak için `pnpm test:docker:rerun <run-id|summary.json|failures.json>` kullanın.
- `pnpm test:docker:browser-cdp-snapshot`: Chromium destekli bir kaynak E2E container’ı oluşturur, ham CDP ile yalıtılmış bir Gateway başlatır, `browser doctor --deep` çalıştırır ve CDP rol snapshot’larının link URL’leri, cursor-promoted tıklanabilir öğeler, iframe ref’leri ve frame metadata içerdiğini doğrular.
- CLI backend canlı Docker probe’ları odaklı şeritler olarak çalıştırılabilir; örneğin `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` veya `pnpm test:docker:live-cli-backend:codex:mcp`. Claude ve Gemini için eşleşen `:resume` ve `:mcp` alias’ları vardır.
- `pnpm test:docker:openwebui`: Dockerize OpenClaw + Open WebUI başlatır, Open WebUI üzerinden oturum açar, `/api/models` kontrol eder, ardından `/api/chat/completions` üzerinden gerçek proxied chat çalıştırır. Kullanılabilir canlı model anahtarı gerektirir (örneğin `~/.profile` içinde OpenAI), harici bir Open WebUI imajı çeker ve normal unit/e2e paketleri kadar CI-kararlı olması beklenmez.
- `pnpm test:docker:mcp-channels`: Seed edilmiş bir Gateway container’ı ve `openclaw mcp serve` başlatan ikinci bir istemci container’ı başlatır; ardından gerçek stdio köprüsü üzerinden yönlendirilmiş konuşma keşfini, transcript okumalarını, ek metadata’sını, canlı event queue davranışını, outbound gönderim yönlendirmesini ve Claude tarzı kanal + izin bildirimlerini doğrular. Claude bildirimi assertion’ı ham stdio MCP frame’lerini doğrudan okur, böylece smoke köprünün gerçekte ne yaydığını yansıtır.
- `pnpm test:docker:upgrade-survivor`: Paketlenmiş OpenClaw tarball'ını kirli bir eski kullanıcı fixture'ı üzerine yükler, canlı sağlayıcı veya kanal anahtarları olmadan paket güncellemesini ve etkileşimsiz doctor'ı çalıştırır, ardından bir loopback Gateway başlatır ve aracıların, kanal yapılandırmasının, Plugin izin listelerinin, çalışma alanı/oturum dosyalarının, eski Plugin runtime-deps durumunun, başlangıcın ve RPC durumunun korunduğunu denetler.

## Yerel PR geçidi

Yerel PR land/geçit denetimleri için şunu çalıştırın:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` yük altındaki bir ana makinede kararsız başarısız olursa, bunu bir regresyon olarak değerlendirmeden önce bir kez yeniden çalıştırın, ardından `pnpm test <path/to/test>` ile izole edin. Bellek kısıtlı ana makineler için şunu kullanın:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model gecikme karşılaştırması (yerel anahtarlar)

Betik: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Kullanım:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- İsteğe bağlı ortam: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Varsayılan istem: “Tek bir sözcükle yanıt ver: ok. Noktalama işareti veya ek metin yok.”

Son çalıştırma (2025-12-31, 20 çalıştırma):

- minimax medyanı 1279 ms (min 1114, maks 2431)
- opus medyanı 2454 ms (min 1224, maks 3170)

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
- `all`: iki ön ayar da

Çıktı, her komut için `sampleCount`, ortalama, p50, p95, min/maks, çıkış kodu/sinyal dağılımı ve maks RSS özetlerini içerir. İsteğe bağlı `--cpu-prof-dir` / `--heap-prof-dir`, çalıştırma başına V8 profilleri yazar; böylece zamanlama ve profil yakalama aynı harness'i kullanır.

Kaydedilen çıktı kuralları:

- `pnpm test:startup:bench:smoke`, hedefli smoke yapıtını `.artifacts/cli-startup-bench-smoke.json` konumuna yazar
- `pnpm test:startup:bench:save`, `runs=5` ve `warmup=1` kullanarak tam paket yapıtını `.artifacts/cli-startup-bench-all.json` konumuna yazar
- `pnpm test:startup:bench:update`, `runs=5` ve `warmup=1` kullanarak depoya işlenmiş temel fixture'ı `test/fixtures/cli-startup-bench.json` konumunda yeniler

Depoya işlenmiş fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` ile yenileyin
- Mevcut sonuçları `pnpm test:startup:bench:check` ile fixture'a karşı karşılaştırın

## Onboarding E2E (Docker)

Docker isteğe bağlıdır; bu yalnızca konteynerleştirilmiş onboarding smoke testleri için gereklidir.

Temiz bir Linux konteynerinde tam cold-start akışı:

```bash
scripts/e2e/onboard-docker.sh
```

Bu betik, etkileşimli sihirbazı bir pseudo-tty üzerinden sürer, yapılandırma/çalışma alanı/oturum dosyalarını doğrular, ardından Gateway'i başlatır ve `openclaw health` çalıştırır.

## QR içe aktarma smoke testi (Docker)

Bakımı yapılan QR runtime yardımcısının desteklenen Docker Node runtime'ları altında yüklendiğinden emin olur (Node 24 varsayılan, Node 22 uyumlu):

```bash
pnpm test:docker:qr
```

## İlgili

- [Test Etme](/tr/help/testing)
- [Canlı test etme](/tr/help/testing-live)
