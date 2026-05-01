---
read_when:
    - Testleri çalıştırma veya düzeltme
summary: Testleri yerel olarak (vitest) çalıştırma ve force/coverage modlarını ne zaman kullanma
title: Testler
x-i18n:
    generated_at: "2026-05-01T09:04:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07ca45e6c21016ad403ea010bd2e5460acc059c004138e04a714a3506f0e5cda
    source_path: reference/test.md
    workflow: 16
---

- Tam test kiti (paketler, canlı, Docker): [Test Etme](/tr/help/testing)

- `pnpm test:force`: Varsayılan kontrol bağlantı noktasını tutan kalıcı Gateway süreçlerini sonlandırır, ardından sunucu testlerinin çalışan bir örnekle çakışmaması için tam Vitest paketini yalıtılmış bir Gateway bağlantı noktasıyla çalıştırır. Önceki bir Gateway çalıştırması 18789 bağlantı noktasını dolu bıraktığında bunu kullanın.
- `pnpm test:coverage`: Birim paketini V8 kapsamıyla (`vitest.unit.config.ts` üzerinden) çalıştırır. Bu, tüm depo tüm dosya kapsamı değil, yüklenmiş dosya birim kapsamı kapısıdır. Eşikler satırlar/fonksiyonlar/ifadeler için %70 ve dallar için %55'tir. `coverage.all` false olduğundan, kapı her bölünmüş kulvar kaynak dosyasını kapsanmamış saymak yerine birim kapsam paketi tarafından yüklenen dosyaları ölçer.
- `pnpm test:coverage:changed`: Birim kapsamını yalnızca `origin/main` sonrasında değişen dosyalar için çalıştırır.
- `pnpm test:changed`: ucuz akıllı değişen test çalıştırması. Doğrudan test düzenlemelerinden, kardeş `*.test.ts` dosyalarından, açık kaynak eşlemelerinden ve yerel içe aktarma grafiğinden kesin hedefleri çalıştırır. Geniş/config/paket değişiklikleri, kesin testlere eşlenmedikçe atlanır.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: açık geniş değişen test çalıştırması. Bir test düzeneği/config/paket düzenlemesinin Vitest'in daha geniş değişen-test davranışına geri dönmesi gerektiğinde bunu kullanın.
- `pnpm changed:lanes`: `origin/main` ile fark tarafından tetiklenen mimari kulvarları gösterir.
- `pnpm check:changed`: `origin/main` ile fark için akıllı değişen kontrol kapısını çalıştırır. Etkilenen mimari kulvarlar için tip denetimi, lint ve koruma komutlarını çalıştırır, ancak Vitest testlerini çalıştırmaz. Test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` kullanın.
- `pnpm test`: açık dosya/dizin hedeflerini kapsamlı Vitest kulvarları üzerinden yönlendirir. Hedefsiz çalıştırmalar sabit shard gruplarını kullanır ve yerel paralel yürütme için yaprak config'lere genişler; extension grubu her zaman tek büyük kök-proje süreci yerine extension başına shard config'lerine genişler.
- Test sarmalayıcı çalıştırmaları kısa bir `[test] passed|failed|skipped ... in ...` özetiyle biter. Vitest'in kendi süre satırı shard başına ayrıntı olarak kalır.
- Paylaşılan OpenClaw test durumu: Bir testin yalıtılmış `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture'ı, workspace'i, agent dizini veya auth-profile deposuna ihtiyacı olduğunda Vitest'ten `src/test-utils/openclaw-test-state.ts` kullanın.
- Süreç E2E yardımcıları: Bir Vitest süreç düzeyi E2E testinin çalışan bir Gateway'e, CLI ortamına, günlük yakalamaya ve temizliğe tek yerde ihtiyacı olduğunda `test/helpers/openclaw-test-instance.ts` kullanın.
- Docker/Bash E2E yardımcıları: `scripts/lib/docker-e2e-image.sh` kaynaklayan kulvarlar container'a `docker_e2e_test_state_shell_b64 <label> <scenario>` geçirebilir ve bunu `scripts/lib/openclaw-e2e-instance.sh` ile çözebilir; çoklu-home betikleri `docker_e2e_test_state_function_b64` geçirebilir ve her akışta `openclaw_test_state_create <label> <scenario>` çağırabilir. Daha düşük düzeyli çağıranlar container içi shell parçası için `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` kullanabilir veya kaynaklanabilir host env dosyası için `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` kullanabilir. `create` öncesindeki `--`, daha yeni Node runtime'larının `--env-file` değerini Node bayrağı olarak ele almasını engeller. Gateway başlatan Docker/Bash kulvarları, entrypoint çözümleme, sahte OpenAI başlatma, Gateway ön plan/arka plan başlatma, hazır olma yoklamaları, durum env dışa aktarımı, günlük dökümleri ve süreç temizliği için container içinde `scripts/lib/openclaw-e2e-instance.sh` kaynaklayabilir.
- Tam, extension ve include-pattern shard çalıştırmaları yerel zamanlama verilerini `.artifacts/vitest-shard-timings.json` içinde günceller; sonraki tam-config çalıştırmaları yavaş ve hızlı shard'ları dengelemek için bu zamanlamaları kullanır. Include-pattern CI shard'ları zamanlama anahtarına shard adını ekler; bu da filtrelenmiş shard zamanlamalarını tam-config zamanlama verilerini değiştirmeden görünür tutar. Yerel zamanlama artifact'ini yok saymak için `OPENCLAW_TEST_PROJECTS_TIMINGS=0` ayarlayın.
- Seçili `plugin-sdk` ve `commands` test dosyaları artık yalnızca `test/setup.ts` dosyasını tutan özel hafif kulvarlardan yönlendirilir; runtime açısından ağır durumlar mevcut kulvarlarında kalır.
- Kardeş testleri olan kaynak dosyaları, daha geniş dizin glob'larına geri dönmeden önce bu kardeşe eşlenir. `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` ve `src/plugins/contracts` altındaki yardımcı düzenlemeleri, bağımlılık yolu kesin olduğunda her shard'ı geniş çalıştırmak yerine içe aktaran testleri çalıştırmak için yerel içe aktarma grafiği kullanır.
- `auto-reply` artık üç özel config'e (`core`, `top-level`, `reply`) de bölünür; böylece yanıt düzeneği daha hafif üst düzey durum/token/yardımcı testlerine baskın gelmez.
- Temel Vitest config'i artık varsayılan olarak `pool: "threads"` ve `isolate: false` kullanır; paylaşılan yalıtılmamış çalıştırıcı depo config'leri genelinde etkindir.
- `pnpm test:channels`, `vitest.channels.config.ts` çalıştırır.
- `pnpm test:extensions` ve `pnpm test extensions`, tüm extension/plugin shard'larını çalıştırır. Ağır kanal plugin'leri, tarayıcı plugin'i ve OpenAI özel shard'lar olarak çalışır; diğer plugin grupları toplu kalır. Tek bir paketli plugin kulvarı için `pnpm test extensions/<id>` kullanın.
- `pnpm test:perf:imports`: açık dosya/dizin hedefleri için kapsamlı kulvar yönlendirmeyi kullanmaya devam ederken Vitest içe aktarma-süresi + içe aktarma-dökümü raporlamasını etkinleştirir.
- `pnpm test:perf:imports:changed`: aynı içe aktarma profilini çıkarır, ancak yalnızca `origin/main` sonrasında değişen dosyalar için.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilen changed-mode yolunu aynı commit'lenmiş git farkı için yerel kök-proje çalıştırmasına karşı benchmark eder.
- `pnpm test:perf:changed:bench -- --worktree`, mevcut worktree değişiklik kümesini önce commit'lemeden benchmark eder.
- `pnpm test:perf:profile:main`: Vitest ana thread'i için CPU profili yazar (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: birim çalıştırıcısı için CPU + heap profilleri yazar (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: her tam-paket Vitest yaprak config'ini seri olarak çalıştırır ve config başına JSON/günlük artifact'leriyle birlikte gruplanmış süre verilerini yazar. Test Performance Agent bunu yavaş-test düzeltmelerini denemeden önce baseline olarak kullanır.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: performans odaklı bir değişiklikten sonra gruplanmış raporları karşılaştırır.
- Gateway entegrasyonu: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` veya `pnpm test:gateway` ile isteğe bağlı etkinleştirin.
- `pnpm test:e2e`: Gateway uçtan uca duman testlerini çalıştırır (çoklu örnek WS/HTTP/node eşleştirme). `vitest.e2e.config.ts` içinde uyarlanabilir worker'larla varsayılan olarak `threads` + `isolate: false` kullanır; `OPENCLAW_E2E_WORKERS=<n>` ile ayarlayın ve ayrıntılı günlükler için `OPENCLAW_E2E_VERBOSE=1` ayarlayın.
- `pnpm test:live`: Sağlayıcı canlı testlerini (minimax/zai) çalıştırır. Atlamayı kaldırmak için API anahtarları ve `LIVE=1` (veya sağlayıcıya özgü `*_LIVE_TEST=1`) gerekir.
- `pnpm test:docker:all`: Paylaşılan canlı-test imajını oluşturur, OpenClaw'ı npm tarball olarak bir kez paketler, çıplak Node/Git çalıştırıcı imajı ile bu tarball'ı `/app` içine kuran işlevsel imajı oluşturur/yeniden kullanır, ardından ağırlıklı zamanlayıcı üzerinden `OPENCLAW_SKIP_DOCKER_BUILD=1` ile Docker duman kulvarlarını çalıştırır. Çıplak imaj (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) installer/update/plugin-dependency kulvarları için kullanılır; bu kulvarlar kopyalanmış depo kaynakları kullanmak yerine önceden oluşturulmuş tarball'ı mount eder. İşlevsel imaj (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) normal oluşturulmuş uygulama işlevsellik kulvarları için kullanılır. `scripts/package-openclaw-for-docker.mjs` tek yerel/CI paket paketleyicisidir ve Docker tüketmeden önce tarball ile `dist/postinstall-inventory.json` dosyasını doğrular. Docker kulvar tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde bulunur; planlayıcı mantığı `scripts/lib/docker-e2e-plan.mjs` içindedir; `scripts/test-docker-all.mjs` seçilen planı yürütür. `node scripts/test-docker-all.mjs --plan-json`, seçili kulvarlar, imaj türleri, paket/canlı-imaj ihtiyaçları, durum senaryoları ve kimlik bilgisi kontrolleri için zamanlayıcının sahip olduğu CI planını Docker oluşturmadan veya çalıştırmadan üretir. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` süreç slotlarını kontrol eder ve varsayılanı 10'dur; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` sağlayıcıya duyarlı tail havuzunu kontrol eder ve varsayılanı 10'dur. Ağır kulvar sınırları varsayılan olarak `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` değerindedir; sağlayıcı sınırları `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` ve `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` üzerinden sağlayıcı başına varsayılan olarak bir ağır kulvardır. Daha büyük host'lar için `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` kullanın. Bir kulvar düşük paralellikli host'ta etkili ağırlık veya kaynak sınırını aşarsa, yine de boş bir havuzdan başlayabilir ve kapasiteyi bırakana kadar tek başına çalışır. Yerel Docker daemon oluşturma fırtınalarını önlemek için kulvar başlangıçları varsayılan olarak 2 saniye aralıklandırılır; `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` ile geçersiz kılın. Çalıştırıcı varsayılan olarak Docker ön denetimi yapar, eski OpenClaw E2E container'larını temizler, her 30 saniyede aktif-kulvar durumunu üretir, uyumlu kulvarlar arasında sağlayıcı CLI araç cache'lerini paylaşır, geçici canlı-sağlayıcı hatalarını varsayılan olarak bir kez yeniden dener (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) ve sonraki çalıştırmalarda en uzundan önce sıralama için kulvar zamanlamalarını `.artifacts/docker-tests/lane-timings.json` içinde depolar. Docker çalıştırmadan kulvar manifest'ini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, durum çıktısını ayarlamak için `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` veya zamanlama yeniden kullanımını devre dışı bırakmak için `OPENCLAW_DOCKER_ALL_TIMINGS=0` kullanın. Yalnızca deterministik/yerel kulvarlar için `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` veya yalnızca canlı-sağlayıcı kulvarları için `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` kullanın; paket alias'ları `pnpm test:docker:local:all` ve `pnpm test:docker:live:all` şeklindedir. Yalnızca-canlı mod, ana ve tail canlı kulvarlarını tek bir en-uzundan-önce havuzunda birleştirir; böylece sağlayıcı bucket'ları Claude, Codex ve Gemini işlerini birlikte paketleyebilir. Çalıştırıcı, `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` ayarlanmadıkça ilk hatadan sonra yeni havuzlanmış kulvarları zamanlamayı durdurur ve her kulvarın `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ile geçersiz kılınabilen 120 dakikalık fallback zaman aşımı vardır; seçili canlı/tail kulvarlar daha sıkı kulvar başına sınırlar kullanır. CLI backend Docker kurulum komutlarının `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (varsayılan 180) üzerinden kendi zaman aşımı vardır. Kulvar başına günlükler, `summary.json`, `failures.json` ve faz zamanlamaları `.artifacts/docker-tests/<run-id>/` altında yazılır; yavaş kulvarları incelemek için `pnpm test:docker:timings <summary.json>` ve ucuz hedefli yeniden çalıştırma komutlarını yazdırmak için `pnpm test:docker:rerun <run-id|summary.json|failures.json>` kullanın.
- `pnpm test:docker:browser-cdp-snapshot`: Chromium destekli bir kaynak E2E container'ı oluşturur, ham CDP ile yalıtılmış Gateway'i başlatır, `browser doctor --deep` çalıştırır ve CDP rol anlık görüntülerinin bağlantı URL'leri, imleçle yükseltilmiş tıklanabilirler, iframe ref'leri ve frame metadata'sı içerdiğini doğrular.
- CLI backend canlı Docker yoklamaları odaklı kulvarlar olarak çalıştırılabilir; örneğin `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` veya `pnpm test:docker:live-cli-backend:codex:mcp`. Claude ve Gemini için eşleşen `:resume` ve `:mcp` alias'ları vardır.
- `pnpm test:docker:openwebui`: Docker'laştırılmış OpenClaw + Open WebUI başlatır, Open WebUI üzerinden oturum açar, `/api/models` kontrol eder, ardından `/api/chat/completions` üzerinden gerçek proxied chat çalıştırır. Kullanılabilir bir canlı model anahtarı (örneğin `~/.profile` içindeki OpenAI) gerektirir, harici bir Open WebUI imajı çeker ve normal birim/e2e paketleri kadar CI-kararlı olması beklenmez.
- `pnpm test:docker:mcp-channels`: Seed edilmiş bir Gateway container'ı ve `openclaw mcp serve` başlatan ikinci bir istemci container'ı başlatır, ardından yönlendirilmiş konuşma keşfini, transcript okumalarını, ek metadata'sını, canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve gerçek stdio köprüsü üzerinden Claude tarzı kanal + izin bildirimlerini doğrular. Claude bildirim assertion'ı ham stdio MCP frame'lerini doğrudan okur; böylece duman testi köprünün gerçekte ürettiğini yansıtır.
- `pnpm test:docker:upgrade-survivor`: Paketlenmiş OpenClaw tarball'ını kirli bir eski kullanıcı test fikstürünün üzerine kurar, canlı sağlayıcı veya kanal anahtarları olmadan paket güncellemesini ve etkileşimsiz doctor'ı çalıştırır, ardından bir loopback Gateway başlatır ve ajanların, kanal yapılandırmasının, Plugin izin listelerinin, çalışma alanı/oturum dosyalarının, eski Plugin runtime-deps durumunun, başlangıcın ve RPC durumunun korunduğunu denetler.
- `pnpm test:docker:published-upgrade-survivor`: Varsayılan olarak `openclaw@latest` kurar, canlı sağlayıcı veya kanal anahtarları olmadan gerçekçi mevcut kullanıcı dosyalarını tohumlar, bu temeli yerleşik bir `openclaw config set` komut tarifiyle yapılandırır, yayımlanmış bu kurulumu paketlenmiş OpenClaw tarball'ına günceller, etkileşimsiz doctor'ı çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar, ardından bir loopback Gateway başlatır ve yapılandırılmış amaçların, çalışma alanı/oturum dosyalarının, eski Plugin yapılandırması/runtime-deps durumunun, başlangıcın, `/healthz`, `/readyz` ve RPC durumunun korunduğunu veya temiz biçimde onarıldığını denetler. Tek bir temeli `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile geçersiz kılın, kesin bir matrisi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile genişletin veya `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` ile senaryo fikstürleri ekleyin; Package Acceptance bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar.

## Yerel PR geçidi

Yerel PR birleştirme/geçit kontrolleri için şunu çalıştırın:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` yüklü bir makinede kararsız sonuç verirse, bunu regresyon olarak değerlendirmeden önce bir kez yeniden çalıştırın, ardından `pnpm test <path/to/test>` ile izole edin. Belleği kısıtlı makineler için şunları kullanın:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model gecikme süresi kıyaslaması (yerel anahtarlar)

Betik: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Kullanım:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- İsteğe bağlı ortam değişkenleri: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Varsayılan istem: “Tek bir sözcükle yanıt ver: ok. Noktalama işareti veya ekstra metin kullanma.”

Son çalıştırma (2025-12-31, 20 çalıştırma):

- minimax medyanı 1279ms (min 1114, maks 2431)
- opus medyanı 2454ms (min 1224, maks 3170)

## CLI başlatma kıyaslaması

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

Çıktı, her komut için `sampleCount`, ortalama, p50, p95, min/maks, çıkış kodu/sinyal dağılımı ve maksimum RSS özetlerini içerir. İsteğe bağlı `--cpu-prof-dir` / `--heap-prof-dir`, zamanlama ve profil yakalamanın aynı koşum takımını kullanması için her çalıştırma başına V8 profilleri yazar.

Kaydedilen çıktı kuralları:

- `pnpm test:startup:bench:smoke`, hedeflenen duman testi yapıtını `.artifacts/cli-startup-bench-smoke.json` konumuna yazar
- `pnpm test:startup:bench:save`, `runs=5` ve `warmup=1` kullanarak tam paket yapıtını `.artifacts/cli-startup-bench-all.json` konumuna yazar
- `pnpm test:startup:bench:update`, `runs=5` ve `warmup=1` kullanarak depoya eklenmiş temel çizgi fikstürünü `test/fixtures/cli-startup-bench.json` konumunda yeniler

Depoya eklenmiş fikstür:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` ile yenileyin
- Geçerli sonuçları fikstürle `pnpm test:startup:bench:check` kullanarak karşılaştırın

## Onboarding E2E (Docker)

Docker isteğe bağlıdır; bu yalnızca konteynerleştirilmiş onboarding duman testleri için gereklidir.

Temiz bir Linux konteynerinde tam soğuk başlatma akışı:

```bash
scripts/e2e/onboard-docker.sh
```

Bu betik, etkileşimli sihirbazı bir sözde TTY üzerinden yürütür, config/workspace/session dosyalarını doğrular, ardından Gateway’i başlatır ve `openclaw health` çalıştırır.

## QR içe aktarma duman testi (Docker)

Bakımı sürdürülen QR çalışma zamanı yardımcısının desteklenen Docker Node çalışma zamanlarında (varsayılan Node 24, uyumlu Node 22) yüklendiğinden emin olur:

```bash
pnpm test:docker:qr
```

## İlgili

- [Test Etme](/tr/help/testing)
- [Canlı Test Etme](/tr/help/testing-live)
