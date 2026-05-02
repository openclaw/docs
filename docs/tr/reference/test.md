---
read_when:
    - Testleri çalıştırma veya düzeltme
summary: Testleri yerel olarak nasıl çalıştırabilirsiniz (vitest) ve zorlama/kapsam modlarını ne zaman kullanmalısınız
title: Testler
x-i18n:
    generated_at: "2026-05-02T09:06:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1100eb4c5990de1a56c8fd65c6152318316232414078cdaad122d4525bf27fee
    source_path: reference/test.md
    workflow: 16
---

- Tam test araç seti (test paketleri, canlı, Docker): [Test](/tr/help/testing)
- Güncelleme ve Plugin paketi doğrulaması: [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins)

- `pnpm test:force`: Varsayılan kontrol portunu tutan kalıcı Gateway işlemlerini sonlandırır, ardından sunucu testlerinin çalışan bir örnekle çakışmaması için tam Vitest paketini yalıtılmış bir Gateway portuyla çalıştırır. Önceki bir Gateway çalıştırması 18789 portunu dolu bıraktığında bunu kullanın.
- `pnpm test:coverage`: Birim paketini V8 kapsamıyla (`vitest.unit.config.ts` aracılığıyla) çalıştırır. Bu, tüm depo tüm dosya kapsamı değil, yüklenen dosya birim kapsam kapısıdır. Eşikler satırlar/fonksiyonlar/deyimler için %70 ve dallar için %55'tir. `coverage.all` false olduğundan, kapı her split-lane kaynak dosyasını kapsanmamış saymak yerine birim kapsam paketi tarafından yüklenen dosyaları ölçer.
- `pnpm test:coverage:changed`: Yalnızca `origin/main` sonrasından beri değişen dosyalar için birim kapsamını çalıştırır.
- `pnpm test:changed`: ucuz akıllı değişmiş test çalıştırması. Doğrudan test düzenlemelerinden, kardeş `*.test.ts` dosyalarından, açık kaynak eşlemelerinden ve yerel içe aktarma grafiğinden kesin hedefleri çalıştırır. Geniş/config/package değişiklikleri, kesin testlere eşlenmedikçe atlanır.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: açık geniş değişmiş test çalıştırması. Bir test düzeneği/config/package düzenlemesinin Vitest'in daha geniş değişmiş-test davranışına geri dönmesi gerektiğinde bunu kullanın.
- `pnpm changed:lanes`: `origin/main` ile diff tarafından tetiklenen mimari lane'leri gösterir.
- `pnpm check:changed`: `origin/main` ile diff için akıllı değişmiş denetim kapısını çalıştırır. Etkilenen mimari lane'ler için typecheck, lint ve guard komutlarını çalıştırır, ancak Vitest testlerini çalıştırmaz. Test kanıtı için `pnpm test:changed` veya açık `pnpm test <target>` kullanın.
- `pnpm test`: açık dosya/dizin hedeflerini kapsamlı Vitest lane'lerinden yönlendirir. Hedefsiz çalıştırmalar sabit shard grupları kullanır ve yerel paralel yürütme için yaprak config'lere genişler; extension grubu, tek dev bir kök-proje işlemi yerine her zaman extension başına shard config'lerine genişler.
- Test sarmalayıcı çalıştırmaları kısa bir `[test] passed|failed|skipped ... in ...` özetiyle biter. Vitest'in kendi süre satırı shard başına ayrıntı olarak kalır.
- Paylaşılan OpenClaw test durumu: Bir testin yalıtılmış `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture'ı, çalışma alanı, agent dizini veya auth-profile deposu gerektiğinde Vitest'ten `src/test-utils/openclaw-test-state.ts` kullanın.
- Process E2E yardımcıları: Bir Vitest process-level E2E testinin çalışan bir Gateway, CLI env, log yakalama ve tek yerde temizlik gerektirdiğinde `test/helpers/openclaw-test-instance.ts` kullanın.
- Docker/Bash E2E yardımcıları: `scripts/lib/docker-e2e-image.sh` dosyasını source eden lane'ler, container içine `docker_e2e_test_state_shell_b64 <label> <scenario>` geçirebilir ve bunu `scripts/lib/openclaw-e2e-instance.sh` ile decode edebilir; çok-home'lu script'ler `docker_e2e_test_state_function_b64` geçirebilir ve her akışta `openclaw_test_state_create <label> <scenario>` çağırabilir. Daha düşük seviye çağırıcılar, container içi shell snippet'i için `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` veya source edilebilir host env dosyası için `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` kullanabilir. `create` öncesindeki `--`, daha yeni Node runtime'larının `--env-file` değerini Node bayrağı olarak ele almasını engeller. Gateway başlatan Docker/Bash lane'leri entrypoint çözümleme, mock OpenAI başlatma, Gateway foreground/background başlatma, readiness probe'ları, state env export'u, log dökümleri ve işlem temizliği için container içinde `scripts/lib/openclaw-e2e-instance.sh` dosyasını source edebilir.
- Tam, extension ve include-pattern shard çalıştırmaları yerel zamanlama verilerini `.artifacts/vitest-shard-timings.json` içinde günceller; daha sonraki whole-config çalıştırmaları yavaş ve hızlı shard'ları dengelemek için bu zamanlamaları kullanır. Include-pattern CI shard'ları zamanlama anahtarına shard adını ekler; bu, filtrelenmiş shard zamanlamalarını whole-config zamanlama verilerinin yerine koymadan görünür tutar. Yerel zamanlama artifact'ini yok saymak için `OPENCLAW_TEST_PROJECTS_TIMINGS=0` ayarlayın.
- Seçili `plugin-sdk` ve `commands` test dosyaları artık yalnızca `test/setup.ts` tutan özel hafif lane'lerden yönlendirilir; runtime-ağır vakalar mevcut lane'lerinde kalır.
- Kardeş testleri olan kaynak dosyalar daha geniş dizin glob'larına geri dönmeden önce o kardeşe eşlenir. `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` ve `src/plugins/contracts` altındaki yardımcı düzenlemeleri, dependency yolu kesin olduğunda her shard'ı geniş çalıştırmak yerine içe aktaran testleri çalıştırmak için yerel içe aktarma grafiğini kullanır.
- `auto-reply` artık üç özel config'e (`core`, `top-level`, `reply`) de ayrılır; böylece reply düzeneği daha hafif top-level durum/token/helper testlerine baskın gelmez.
- Temel Vitest config'i artık varsayılan olarak `pool: "threads"` ve `isolate: false` kullanır; paylaşılan yalıtımsız runner depo config'leri genelinde etkindir.
- `pnpm test:channels`, `vitest.channels.config.ts` çalıştırır.
- `pnpm test:extensions` ve `pnpm test extensions` tüm extension/Plugin shard'larını çalıştırır. Ağır kanal Plugin'leri, tarayıcı Plugin'i ve OpenAI özel shard'lar olarak çalışır; diğer Plugin grupları toplu kalır. Tek bir paketlenmiş Plugin lane'i için `pnpm test extensions/<id>` kullanın.
- `pnpm test:perf:imports`: açık dosya/dizin hedefleri için kapsamlı lane yönlendirmesini kullanmayı sürdürürken Vitest import-duration + import-breakdown raporlamasını etkinleştirir.
- `pnpm test:perf:imports:changed`: aynı içe aktarma profilini çıkarır, ancak yalnızca `origin/main` sonrasından beri değişen dosyalar için.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` yönlendirilen changed-mode yolunu aynı commit'lenmiş git diff'i için yerel kök-proje çalıştırmasına karşı benchmark eder.
- `pnpm test:perf:changed:bench -- --worktree` mevcut worktree değişiklik kümesini önce commit'lemeden benchmark eder.
- `pnpm test:perf:profile:main`: Vitest ana thread'i için bir CPU profili yazar (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: birim runner için CPU + heap profilleri yazar (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: her full-suite Vitest yaprak config'ini seri olarak çalıştırır ve gruplandırılmış süre verileriyle config başına JSON/log artifact'leri yazar. Test Performance Agent, yavaş-test düzeltmelerini denemeden önce bunu baseline olarak kullanır.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: performans odaklı bir değişiklikten sonra gruplandırılmış raporları karşılaştırır.
- Gateway entegrasyonu: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` veya `pnpm test:gateway` ile opt-in yapılır.
- `pnpm test:e2e`: Gateway uçtan uca smoke testlerini çalıştırır (çoklu örnek WS/HTTP/node eşleşmesi). `vitest.e2e.config.ts` içinde adaptive workers ile varsayılan olarak `threads` + `isolate: false` kullanır; `OPENCLAW_E2E_WORKERS=<n>` ile ayarlayın ve ayrıntılı loglar için `OPENCLAW_E2E_VERBOSE=1` ayarlayın.
- `pnpm test:live`: Provider canlı testlerini (minimax/zai) çalıştırır. Atlamayı kaldırmak için API anahtarları ve `LIVE=1` (veya provider'a özel `*_LIVE_TEST=1`) gerekir.
- `pnpm test:docker:all`: Paylaşılan canlı-test imajını oluşturur, OpenClaw'u bir kez npm tarball olarak paketler, çıplak Node/Git runner imajı ile bu tarball'ı `/app` içine kuran işlevsel bir imaj oluşturur/yeniden kullanır, ardından ağırlıklı bir zamanlayıcı aracılığıyla `OPENCLAW_SKIP_DOCKER_BUILD=1` ile Docker smoke lane'lerini çalıştırır. Çıplak imaj (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) installer/update/plugin-dependency lane'leri için kullanılır; bu lane'ler kopyalanmış repo kaynaklarını kullanmak yerine önceden oluşturulmuş tarball'ı mount eder. İşlevsel imaj (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) normal built-app işlevsellik lane'leri için kullanılır. `scripts/package-openclaw-for-docker.mjs` tek yerel/CI package packer'ıdır ve Docker tüketmeden önce tarball'ı ve `dist/postinstall-inventory.json` dosyasını doğrular. Docker lane tanımları `scripts/lib/docker-e2e-scenarios.mjs` içinde yaşar; planner mantığı `scripts/lib/docker-e2e-plan.mjs` içinde yaşar; `scripts/test-docker-all.mjs` seçilen planı yürütür. `node scripts/test-docker-all.mjs --plan-json`, derleme yapmadan veya Docker çalıştırmadan seçili lane'ler, imaj türleri, package/live-image gereksinimleri, state senaryoları ve credential denetimleri için zamanlayıcıya ait CI planını yayar. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` işlem slotlarını kontrol eder ve varsayılanı 10'dur; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` provider'a hassas tail havuzunu kontrol eder ve varsayılanı 10'dur. Ağır lane limitleri varsayılan olarak `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` olur; provider limitleri `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` ve `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` aracılığıyla provider başına bir ağır lane varsayar. Daha büyük host'lar için `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` kullanın. Düşük paralellikli bir host'ta bir lane etkin ağırlık veya kaynak limitini aşarsa yine de boş bir havuzdan başlayabilir ve kapasiteyi serbest bırakana kadar tek başına çalışır. Yerel Docker daemon create storm'larını önlemek için lane başlangıçları varsayılan olarak 2 saniye aralıklı yapılır; `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` ile override edin. Runner varsayılan olarak Docker preflight yapar, bayat OpenClaw E2E container'larını temizler, her 30 saniyede etkin-lane durumunu yayar, provider CLI araç cache'lerini uyumlu lane'ler arasında paylaşır, geçici canlı-provider hatalarını varsayılan olarak bir kez yeniden dener (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) ve sonraki çalıştırmalarda en uzun-önce sıralaması için lane zamanlamalarını `.artifacts/docker-tests/lane-timings.json` içinde saklar. Docker çalıştırmadan lane manifestini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, durum çıktısını ayarlamak için `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` veya zamanlama yeniden kullanımını devre dışı bırakmak için `OPENCLAW_DOCKER_ALL_TIMINGS=0` kullanın. Yalnızca deterministik/yerel lane'ler için `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` veya yalnızca canlı-provider lane'leri için `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` kullanın; package alias'ları `pnpm test:docker:local:all` ve `pnpm test:docker:live:all` olur. Live-only mode, provider bucket'larının Claude, Codex ve Gemini işini birlikte paketleyebilmesi için main ve tail canlı lane'lerini tek bir longest-first havuzda birleştirir. Runner, `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` ayarlanmadıkça ilk hatadan sonra yeni havuz lane'leri planlamayı durdurur ve her lane'in `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ile override edilebilir 120 dakikalık fallback timeout'u vardır; seçili live/tail lane'ler daha sıkı lane başına limitler kullanır. CLI backend Docker kurulum komutlarının `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (varsayılan 180) aracılığıyla kendi timeout'u vardır. Lane başına loglar, `summary.json`, `failures.json` ve phase zamanlamaları `.artifacts/docker-tests/<run-id>/` altına yazılır; yavaş lane'leri incelemek için `pnpm test:docker:timings <summary.json>` ve ucuz hedefli yeniden çalıştırma komutlarını yazdırmak için `pnpm test:docker:rerun <run-id|summary.json|failures.json>` kullanın.
- `pnpm test:docker:browser-cdp-snapshot`: Chromium destekli bir kaynak E2E container'ı oluşturur, ham CDP ile yalıtılmış bir Gateway başlatır, `browser doctor --deep` çalıştırır ve CDP rol snapshot'larının bağlantı URL'lerini, cursor-promoted tıklanabilirleri, iframe refs'lerini ve frame metadata'sını içerdiğini doğrular.
- CLI backend canlı Docker probe'ları odaklı lane'ler olarak çalıştırılabilir; örneğin `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` veya `pnpm test:docker:live-cli-backend:codex:mcp`. Claude ve Gemini için de eşleşen `:resume` ve `:mcp` alias'ları vardır.
- `pnpm test:docker:openwebui`: Dockerize edilmiş OpenClaw + Open WebUI başlatır, Open WebUI üzerinden oturum açar, `/api/models` denetler, ardından `/api/chat/completions` üzerinden gerçek proxied chat çalıştırır. Kullanılabilir bir canlı model anahtarı gerektirir (örneğin `~/.profile` içinde OpenAI), harici bir Open WebUI imajı çeker ve normal unit/e2e paketleri gibi CI-stable olması beklenmez.
- `pnpm test:docker:mcp-channels`: Seed edilmiş bir Gateway container'ı ve `openclaw mcp serve` spawn eden ikinci bir client container'ı başlatır, ardından gerçek stdio köprüsü üzerinden yönlendirilmiş konuşma keşfini, transcript okumalarını, attachment metadata'sını, canlı event queue davranışını, outbound send routing'i ve Claude tarzı kanal + permission bildirimlerini doğrular. Claude bildirimi assertion'ı ham stdio MCP frame'lerini doğrudan okur; böylece smoke, köprünün gerçekten yaydığı şeyi yansıtır.
- `pnpm test:docker:upgrade-survivor`: Paketlenmiş OpenClaw tarball'ını kirli bir eski kullanıcı fixture'ının üzerine kurar, canlı sağlayıcı veya kanal anahtarları olmadan paket güncellemesini ve etkileşimsiz doctor'ı çalıştırır, ardından bir loopback Gateway başlatır ve agent'ların, kanal yapılandırmasının, Plugin izin listelerinin, çalışma alanı/oturum dosyalarının, eskimiş eski Plugin bağımlılık durumunun, başlatmanın ve RPC durumunun korunduğunu denetler.
- `pnpm test:docker:published-upgrade-survivor`: Varsayılan olarak `openclaw@latest` kurar, canlı sağlayıcı veya kanal anahtarları olmadan gerçekçi mevcut kullanıcı dosyaları tohumlar, bu temeli gömülü bir `openclaw config set` komut tarifiyle yapılandırır, yayımlanmış bu kurulumu paketlenmiş OpenClaw tarball'ına günceller, etkileşimsiz doctor'ı çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar, ardından bir loopback Gateway başlatır ve yapılandırılmış amaçların, çalışma alanı/oturum dosyalarının, eskimiş Plugin yapılandırmasının ve eski bağımlılık durumunun, başlatmanın, `/healthz`, `/readyz` ve RPC durumunun korunduğunu veya temiz biçimde onarıldığını denetler. Tek bir temeli `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile geçersiz kılın, tam bir matrisi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile genişletin veya `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` ile senaryo fixture'ları ekleyin; Package Acceptance bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar.
- `pnpm test:docker:update-migration`: Varsayılan olarak `openclaw@2026.4.23` sürümünden başlayarak, yayımlanmış yükseltme dayanıklılık donanımını temizlik ağırlıklı `plugin-deps-cleanup` senaryosunda çalıştırır. Ayrı `Update Migration` iş akışı, bu hattı `baselines=all-since-2026.4.23` ile genişletir; böylece `.23` ve sonrasındaki her kararlı yayımlanmış paket adaya güncellenir ve Full Release CI dışında yapılandırılmış Plugin bağımlılığı temizliğini kanıtlar.
- `pnpm test:docker:plugins`: Yerel yol, `file:`, yukarı taşınmış bağımlılıklara sahip npm registry paketleri, hareketli git referansları, ClawHub fixture'ları, marketplace güncellemeleri ve Claude paketi etkinleştirme/inceleme için kurulum/güncelleme smoke testlerini çalıştırır.

## Yerel PR kapısı

Yerel PR birleştirme/kapı kontrolleri için şunu çalıştırın:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` yüklü bir ana makinede düzensiz başarısız olursa, bunu regresyon olarak değerlendirmeden önce bir kez yeniden çalıştırın, ardından `pnpm test <path/to/test>` ile izole edin. Belleği kısıtlı ana makineler için şunu kullanın:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model gecikme kıyaslaması (yerel anahtarlar)

Betik: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Kullanım:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- İsteğe bağlı env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Varsayılan istem: “Tek bir kelimeyle yanıtla: ok. Noktalama veya ek metin yok.”

Son çalıştırma (2025-12-31, 20 çalıştırma):

- minimax medyan 1279ms (min 1114, maks 2431)
- opus medyan 2454ms (min 1224, maks 3170)

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
- `all`: iki ön ayarın ikisi de

Çıktı, her komut için `sampleCount`, ortalama, p50, p95, min/maks, çıkış kodu/sinyal dağılımı ve maks RSS özetlerini içerir. İsteğe bağlı `--cpu-prof-dir` / `--heap-prof-dir`, zamanlama ve profil yakalamanın aynı düzenekle yapılması için her çalıştırma başına V8 profilleri yazar.

Kaydedilen çıktı kuralları:

- `pnpm test:startup:bench:smoke`, hedeflenen smoke artefaktını `.artifacts/cli-startup-bench-smoke.json` konumuna yazar
- `pnpm test:startup:bench:save`, tam paket artefaktını `runs=5` ve `warmup=1` kullanarak `.artifacts/cli-startup-bench-all.json` konumuna yazar
- `pnpm test:startup:bench:update`, depoya eklenmiş temel fixture'ı `runs=5` ve `warmup=1` kullanarak `test/fixtures/cli-startup-bench.json` konumunda yeniler

Depoya eklenmiş fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` ile yenileyin
- Geçerli sonuçları fixture ile `pnpm test:startup:bench:check` kullanarak karşılaştırın

## Onboarding E2E (Docker)

Docker isteğe bağlıdır; bu yalnızca konteynerleştirilmiş onboarding smoke testleri için gereklidir.

Temiz bir Linux konteynerinde tam soğuk başlatma akışı:

```bash
scripts/e2e/onboard-docker.sh
```

Bu betik, etkileşimli sihirbazı bir pseudo-tty üzerinden çalıştırır, config/workspace/session dosyalarını doğrular, ardından gateway'i başlatır ve `openclaw health` çalıştırır.

## QR içe aktarma smoke testi (Docker)

Bakımı sürdürülen QR runtime yardımcısının desteklenen Docker Node runtime'ları altında yüklendiğinden emin olur (Node 24 varsayılan, Node 22 uyumlu):

```bash
pnpm test:docker:qr
```

## İlgili

- [Test Etme](/tr/help/testing)
- [Canlı test etme](/tr/help/testing-live)
- [Güncellemeleri ve plugin'leri test etme](/tr/help/testing-updates-plugins)
