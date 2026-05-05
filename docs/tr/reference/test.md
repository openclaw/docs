---
read_when:
    - Testleri çalıştırma veya düzeltme
summary: Testleri yerel olarak çalıştırma (vitest) ve force/coverage modlarının ne zaman kullanılacağı
title: Testler
x-i18n:
    generated_at: "2026-05-05T01:48:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e8421518d63cade24ce8c2a08fa10538b66d2332b1eb5744e47c6d5a5e84605
    source_path: reference/test.md
    workflow: 16
---

- Tam test araç seti (paketler, canlı, Docker): [Test etme](/tr/help/testing)
- Güncelleme ve Plugin paketi doğrulaması: [Güncellemeleri ve Plugin’leri test etme](/tr/help/testing-updates-plugins)

- `pnpm test:force`: Varsayılan denetim bağlantı noktasını tutan kalmış herhangi bir gateway sürecini sonlandırır, ardından sunucu testlerinin çalışan bir örnekle çakışmaması için tam Vitest paketini yalıtılmış bir gateway bağlantı noktasıyla çalıştırır. Önceki bir gateway çalıştırması 18789 bağlantı noktasını dolu bıraktığında bunu kullanın.
- `pnpm test:coverage`: Birim paketini V8 coverage ile (`vitest.unit.config.ts` üzerinden) çalıştırır. Bu, tüm depo tüm dosya coverage kapısı değil, yüklenen dosya birim coverage kapısıdır. Eşikler satırlar/işlevler/ifadeler için %70 ve dallar için %55'tir. `coverage.all` false olduğundan kapı, her bölünmüş hat kaynak dosyasını kapsanmamış saymak yerine birim coverage paketi tarafından yüklenen dosyaları ölçer.
- `pnpm test:coverage:changed`: Birim coverage'ı yalnızca `origin/main` sonrasında değişen dosyalar için çalıştırır.
- `pnpm test:changed`: ucuz akıllı değişen test çalıştırması. Doğrudan test düzenlemelerinden, kardeş `*.test.ts` dosyalarından, açık kaynak eşlemelerinden ve yerel içe aktarma grafiğinden kesin hedefleri çalıştırır. Geniş/config/package değişiklikleri, kesin testlere eşlenmedikçe atlanır.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: açık geniş değişen test çalıştırması. Bir test altyapısı/config/package düzenlemesinin Vitest'in daha geniş değişen-test davranışına geri dönmesi gerektiğinde bunu kullanın.
- `pnpm changed:lanes`: `origin/main` ile diff tarafından tetiklenen mimari hatları gösterir.
- `pnpm check:changed`: `origin/main` ile diff için akıllı değişen denetim kapısını çalıştırır. Etkilenen mimari hatlar için typecheck, lint ve guard komutlarını çalıştırır, ancak Vitest testlerini çalıştırmaz. Test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` kullanın.
- `pnpm test`: açık dosya/dizin hedeflerini kapsamlı Vitest hatları üzerinden yönlendirir. Hedefsiz çalıştırmalar sabit shard gruplarını kullanır ve yerel paralel yürütme için yaprak config'lere genişler; extension grubu her zaman tek dev bir root-project süreci yerine extension başına shard config'lerine genişler.
- Test sarmalayıcı çalıştırmaları kısa bir `[test] passed|failed|skipped ... in ...` özetiyle biter. Vitest'in kendi süre satırı shard başına ayrıntı olarak kalır.
- Paylaşılan OpenClaw test durumu: Bir testin yalıtılmış `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture'ı, çalışma alanı, agent dizini veya auth-profile deposu gerektiğinde Vitest içinden `src/test-utils/openclaw-test-state.ts` kullanın.
- Süreç E2E yardımcıları: Bir Vitest süreç düzeyi E2E testinin çalışan bir Gateway, CLI env, günlük yakalama ve tek yerde temizlik gerektirdiğinde `test/helpers/openclaw-test-instance.ts` kullanın.
- Docker/Bash E2E yardımcıları: `scripts/lib/docker-e2e-image.sh` kaynağını alan hatlar, container içine `docker_e2e_test_state_shell_b64 <label> <scenario>` geçirebilir ve bunu `scripts/lib/openclaw-e2e-instance.sh` ile decode edebilir; çoklu-home script'leri `docker_e2e_test_state_function_b64` geçirebilir ve her akışta `openclaw_test_state_create <label> <scenario>` çağırabilir. Daha düşük düzey çağırıcılar, container içi shell snippet'i için `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` veya source edilebilir host env dosyası için `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` kullanabilir. `create` öncesindeki `--`, daha yeni Node runtime'larının `--env-file` öğesini Node flag'i olarak ele almasını engeller. Bir Gateway başlatan Docker/Bash hatları, entrypoint çözümleme, mock OpenAI başlatma, Gateway ön plan/arka plan başlatma, hazır olma probe'ları, durum env dışa aktarımı, günlük dökümleri ve süreç temizliği için container içinde `scripts/lib/openclaw-e2e-instance.sh` kaynağını alabilir.
- Tam, extension ve include-pattern shard çalıştırmaları yerel zamanlama verilerini `.artifacts/vitest-shard-timings.json` içinde günceller; sonraki tüm-config çalıştırmaları yavaş ve hızlı shard'ları dengelemek için bu zamanlamaları kullanır. Include-pattern CI shard'ları zamanlama anahtarına shard adını ekler; bu, filtrelenmiş shard zamanlamalarını tüm-config zamanlama verilerini değiştirmeden görünür tutar. Yerel zamanlama artifact'ini yok saymak için `OPENCLAW_TEST_PROJECTS_TIMINGS=0` ayarlayın.
- Seçili `plugin-sdk` ve `commands` test dosyaları artık yalnızca `test/setup.ts` öğesini tutan özel hafif hatlardan yönlendirilir; runtime açısından ağır durumlar mevcut hatlarında kalır.
- Kardeş testleri olan kaynak dosyaları daha geniş dizin glob'larına geri dönmeden önce o kardeşe eşlenir. `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` ve `src/plugins/contracts` altındaki yardımcı düzenlemeleri, bağımlılık yolu kesin olduğunda her shard'ı geniş çalıştırmak yerine içe aktaran testleri çalıştırmak için yerel bir içe aktarma grafiği kullanır.
- `auto-reply` artık üç özel config'e (`core`, `top-level`, `reply`) de bölünür; böylece yanıt altyapısı daha hafif üst düzey durum/token/yardımcı testlerine baskın gelmez.
- Temel Vitest config'i artık varsayılan olarak `pool: "threads"` ve `isolate: false` kullanır; paylaşılan yalıtılmamış çalıştırıcı repo config'leri genelinde etkinleştirilmiştir.
- `pnpm test:channels`, `vitest.channels.config.ts` çalıştırır.
- `pnpm test:extensions` ve `pnpm test extensions`, tüm extension/Plugin shard'larını çalıştırır. Ağır kanal Plugin'leri, tarayıcı Plugin'i ve OpenAI özel shard'lar olarak çalışır; diğer Plugin grupları toplu kalır. Tek bir paketlenmiş Plugin hattı için `pnpm test extensions/<id>` kullanın.
- `pnpm test:perf:imports`: açık dosya/dizin hedefleri için kapsamlı hat yönlendirmesini kullanmaya devam ederken Vitest içe aktarma-süresi + içe aktarma-dökümü raporlamasını etkinleştirir.
- `pnpm test:perf:imports:changed`: aynı içe aktarma profillemesi, ancak yalnızca `origin/main` sonrasında değişen dosyalar için.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`, aynı commit'lenmiş git diff'i için yönlendirilmiş changed-mode yolunu yerel root-project çalıştırmasına karşı benchmark eder.
- `pnpm test:perf:changed:bench -- --worktree`, önce commit etmeden mevcut worktree değişiklik kümesini benchmark eder.
- `pnpm test:perf:profile:main`: Vitest ana iş parçacığı için bir CPU profili yazar (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: birim çalıştırıcı için CPU + heap profilleri yazar (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: her tam paket Vitest yaprak config'ini seri olarak çalıştırır ve gruplandırılmış süre verileriyle config başına JSON/günlük artifact'lerini yazar. Test Performance Agent bunu yavaş-test düzeltmelerini denemeden önce baseline olarak kullanır.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: performans odaklı bir değişiklikten sonra gruplandırılmış raporları karşılaştırır.
- Gateway entegrasyonu: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` veya `pnpm test:gateway` ile opt-in yapılır.
- `pnpm test:e2e`: Gateway uçtan uca smoke testlerini (çoklu örnek WS/HTTP/node eşleştirme) çalıştırır. `vitest.e2e.config.ts` içinde uyarlamalı worker'larla varsayılan olarak `threads` + `isolate: false` kullanır; `OPENCLAW_E2E_WORKERS=<n>` ile ayarlayın ve ayrıntılı günlükler için `OPENCLAW_E2E_VERBOSE=1` ayarlayın.
- `pnpm test:live`: Sağlayıcı canlı testlerini (minimax/zai) çalıştırır. Atlamayı kaldırmak için API anahtarları ve `LIVE=1` (veya sağlayıcıya özel `*_LIVE_TEST=1`) gerekir.
- `pnpm test:docker:all`: Paylaşılan canlı-test imajını oluşturur, OpenClaw'ı bir kez npm tarball olarak paketler, çıplak bir Node/Git çalıştırıcı imajı ile bu tarball'ı `/app` içine kuran işlevsel bir imajı oluşturur/yeniden kullanır, ardından Docker smoke hatlarını ağırlıklı bir zamanlayıcı üzerinden `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır. Çıplak imaj (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) installer/update/plugin-dependency hatları için kullanılır; bu hatlar kopyalanmış repo kaynaklarını kullanmak yerine önceden oluşturulmuş tarball'ı mount eder. İşlevsel imaj (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) normal built-app işlevsellik hatları için kullanılır. `scripts/package-openclaw-for-docker.mjs`, tek yerel/CI package paketleyicisidir ve Docker tüketmeden önce tarball ile `dist/postinstall-inventory.json` öğesini doğrular. Docker hat tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde bulunur; planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içinde bulunur; `scripts/test-docker-all.mjs` seçili planı yürütür. `node scripts/test-docker-all.mjs --plan-json`, seçili hatlar, imaj türleri, package/live-image gereksinimleri, durum senaryoları ve kimlik bilgisi kontrolleri için zamanlayıcının sahip olduğu CI planını Docker oluşturmadan veya çalıştırmadan yayar. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` süreç slotlarını denetler ve varsayılanı 10'dur; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` sağlayıcıya duyarlı tail havuzunu denetler ve varsayılanı 10'dur. Ağır hat sınırlarının varsayılanları `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` değerleridir; sağlayıcı sınırları `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` ve `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` ile sağlayıcı başına varsayılan olarak bir ağır hattır. Daha büyük host'lar için `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` kullanın. Düşük paralellikli bir host'ta tek bir hat etkili ağırlık veya kaynak sınırını aşarsa, yine de boş bir havuzdan başlayabilir ve kapasiteyi bırakana kadar tek başına çalışır. Yerel Docker daemon create fırtınalarını önlemek için hat başlangıçları varsayılan olarak 2 saniye aralıklandırılır; `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` ile geçersiz kılın. Çalıştırıcı varsayılan olarak Docker preflight yapar, bayat OpenClaw E2E container'larını temizler, her 30 saniyede etkin-hat durumunu yayar, uyumlu hatlar arasında sağlayıcı CLI araç cache'lerini paylaşır, geçici canlı-sağlayıcı hatalarını varsayılan olarak bir kez yeniden dener (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) ve daha sonraki çalıştırmalarda en uzundan başlayan sıralama için hat zamanlamalarını `.artifacts/docker-tests/lane-timings.json` içinde depolar. Docker çalıştırmadan hat manifest'ini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, durum çıktısını ayarlamak için `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` veya zamanlama yeniden kullanımını devre dışı bırakmak için `OPENCLAW_DOCKER_ALL_TIMINGS=0` kullanın. Yalnızca deterministik/yerel hatlar için `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` veya yalnızca canlı-sağlayıcı hatları için `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` kullanın; package alias'ları `pnpm test:docker:local:all` ve `pnpm test:docker:live:all` şeklindedir. Yalnızca-canlı mod, sağlayıcı bucket'larının Claude, Codex ve Gemini işlerini birlikte paketleyebilmesi için ana ve tail canlı hatlarını en uzundan başlayan tek bir havuzda birleştirir. Çalıştırıcı, `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` ayarlanmadıkça ilk hatadan sonra yeni havuzlanmış hatları zamanlamayı durdurur ve her hattın `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ile geçersiz kılınabilen 120 dakikalık fallback zaman aşımı vardır; seçili canlı/tail hatları daha sıkı hat başına sınırlar kullanır. CLI backend Docker kurulum komutlarının `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` üzerinden kendi zaman aşımı vardır (varsayılan 180). Hat başına günlükler, `summary.json`, `failures.json` ve aşama zamanlamaları `.artifacts/docker-tests/<run-id>/` altında yazılır; yavaş hatları incelemek için `pnpm test:docker:timings <summary.json>` ve ucuz hedefli yeniden çalıştırma komutlarını yazdırmak için `pnpm test:docker:rerun <run-id|summary.json|failures.json>` kullanın.
- `pnpm test:docker:browser-cdp-snapshot`: Chromium destekli kaynak E2E container'ı oluşturur, ham CDP ile yalıtılmış bir Gateway başlatır, `browser doctor --deep` çalıştırır ve CDP rol snapshot'larının bağlantı URL'lerini, imleçle öne çıkarılmış tıklanabilirleri, iframe ref'lerini ve frame metadata'sını içerdiğini doğrular.
- CLI backend canlı Docker probe'ları odaklı hatlar olarak çalıştırılabilir; örneğin `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` veya `pnpm test:docker:live-cli-backend:codex:mcp`. Claude ve Gemini için eşleşen `:resume` ve `:mcp` alias'ları vardır.
- `pnpm test:docker:openwebui`: Dockerize OpenClaw + Open WebUI başlatır, Open WebUI üzerinden oturum açar, `/api/models` denetler, ardından `/api/chat/completions` üzerinden gerçek bir proxy'lenmiş chat çalıştırır. Kullanılabilir bir canlı model anahtarı gerektirir (örneğin `~/.profile` içinde OpenAI), harici bir Open WebUI imajı çeker ve normal unit/e2e paketleri gibi CI-kararlı olması beklenmez.
- `pnpm test:docker:mcp-channels`: Seed edilmiş bir Gateway container'ı ve `openclaw mcp serve` oluşturan ikinci bir client container'ı başlatır, ardından yönlendirilmiş konuşma keşfini, transcript okumalarını, ek metadata'sını, canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve gerçek stdio köprüsü üzerinden Claude tarzı kanal + izin bildirimlerini doğrular. Claude bildirim assertion'ı ham stdio MCP frame'lerini doğrudan okur; böylece smoke köprünün gerçekten yaydığı şeyi yansıtır.
- `pnpm test:docker:upgrade-survivor`: Paketlenmiş OpenClaw tarball dosyasını kirli bir eski kullanıcı fixture’ının üzerine kurar, canlı sağlayıcı veya kanal anahtarları olmadan paket güncellemesini ve etkileşimsiz doctor’ı çalıştırır, ardından bir loopback Gateway başlatır ve ajanların, kanal yapılandırmasının, Plugin izin listelerinin, çalışma alanı/oturum dosyalarının, bayat eski Plugin bağımlılığı durumunun, başlatmanın ve RPC durumunun korunduğunu denetler.
- `pnpm test:docker:published-upgrade-survivor`: Varsayılan olarak `openclaw@latest` kurar, canlı sağlayıcı veya kanal anahtarları olmadan gerçekçi mevcut kullanıcı dosyalarını hazırlar, bu temel durumu yerleşik bir `openclaw config set` komut tarifiyle yapılandırır, yayımlanmış bu kurulumu paketlenmiş OpenClaw tarball dosyasına günceller, etkileşimsiz doctor’ı çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar, ardından bir loopback Gateway başlatır ve yapılandırılmış intent’lerin, çalışma alanı/oturum dosyalarının, bayat Plugin yapılandırmasının ve eski bağımlılık durumunun, başlatmanın, `/healthz`, `/readyz` ve RPC durumunun korunduğunu veya temiz biçimde onarıldığını denetler. Tek bir temel durumu `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile geçersiz kılın, `all-since-2026.4.23` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile tam bir matrisi genişletin veya `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` ile senaryo fixture’ları ekleyin; bildirilen sorunlar kümesi, yapılandırılmış harici OpenClaw Pluginlerinin yükseltme sırasında otomatik olarak kurulduğunu doğrulamak için `configured-plugin-installs` ve yalnızca kaynak Plugin gölgelerinin başlatmayı bozmasını önlemek için `stale-source-plugin-shadow` içerir. Paket Kabulü bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar.
- `pnpm test:docker:update-migration`: Temizleme ağırlıklı `plugin-deps-cleanup` senaryosunda yayımlanmış yükseltme koruma harness’ını çalıştırır ve varsayılan olarak `openclaw@2026.4.23` ile başlar. Ayrı `Update Migration` iş akışı bu hattı `baselines=all-since-2026.4.23` ile genişletir; böylece `.23` ve sonrasındaki her kararlı yayımlanmış paket adaya güncellenir ve Tam Sürüm CI dışında yapılandırılmış Plugin bağımlılığı temizliğini kanıtlar.
- `pnpm test:docker:plugins`: Yerel yol, `file:`, yukarı taşınmış bağımlılıklara sahip npm kayıt paketleri, git hareketli ref’leri, ClawHub fixture’ları, marketplace güncellemeleri ve Claude paketi etkinleştirme/inceleme için kurulum/güncelleme smoke testini çalıştırır.

## Yerel PR geçidi

Yerel PR birleştirme/geçit kontrolleri için şunu çalıştırın:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` yük altında olan bir ana makinede kararsız şekilde başarısız olursa, bunu regresyon olarak değerlendirmeden önce bir kez yeniden çalıştırın, ardından `pnpm test <path/to/test>` ile yalıtın. Bellek kısıtlı ana makineler için şunları kullanın:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model gecikme ölçümü (yerel anahtarlar)

Betik: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Kullanım:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- İsteğe bağlı ortam değişkenleri: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Varsayılan istem: “Tek bir sözcükle yanıt ver: ok. Noktalama veya ek metin yok.”

Son çalıştırma (2025-12-31, 20 çalıştırma):

- minimax medyan 1279 ms (min 1114, maks 2431)
- opus medyan 2454 ms (min 1224, maks 3170)

## CLI başlangıç ölçümü

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

Önayarlar:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: iki önayar da

Çıktı, her komut için `sampleCount`, ortalama, p50, p95, min/maks, çıkış kodu/sinyal dağılımı ve maks RSS özetlerini içerir. İsteğe bağlı `--cpu-prof-dir` / `--heap-prof-dir`, her çalıştırma için V8 profilleri yazar; böylece zamanlama ve profil yakalama aynı test düzeneğini kullanır.

Kaydedilen çıktı kuralları:

- `pnpm test:startup:bench:smoke`, hedeflenen smoke artefaktını `.artifacts/cli-startup-bench-smoke.json` konumuna yazar
- `pnpm test:startup:bench:save`, `runs=5` ve `warmup=1` kullanarak tam paket artefaktını `.artifacts/cli-startup-bench-all.json` konumuna yazar
- `pnpm test:startup:bench:update`, `runs=5` ve `warmup=1` kullanarak depoya işlenmiş temel fixture'ı `test/fixtures/cli-startup-bench.json` konumunda yeniler

Depoya işlenmiş fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` ile yenileyin
- Mevcut sonuçları fixture ile `pnpm test:startup:bench:check` kullanarak karşılaştırın

## Onboarding E2E (Docker)

Docker isteğe bağlıdır; bu yalnızca konteynerleştirilmiş onboarding smoke testleri için gereklidir.

Temiz bir Linux konteynerinde tam soğuk başlangıç akışı:

```bash
scripts/e2e/onboard-docker.sh
```

Bu betik, etkileşimli sihirbazı bir pseudo-tty üzerinden çalıştırır, yapılandırma/çalışma alanı/oturum dosyalarını doğrular, ardından Gateway'i başlatır ve `openclaw health` çalıştırır.

## QR içe aktarma smoke testi (Docker)

Bakımı yapılan QR çalışma zamanı yardımcısının desteklenen Docker Node çalışma zamanlarında yüklendiğini doğrular (varsayılan Node 24, uyumlu Node 22):

```bash
pnpm test:docker:qr
```

## İlgili

- [Test Etme](/tr/help/testing)
- [Canlı test etme](/tr/help/testing-live)
- [Güncellemeleri ve plugin'leri test etme](/tr/help/testing-updates-plugins)
