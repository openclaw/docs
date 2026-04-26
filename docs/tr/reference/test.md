---
read_when:
    - Testleri çalıştırma veya düzeltme
summary: Testlerin yerelde nasıl çalıştırılacağı (vitest) ve force/coverage modlarının ne zaman kullanılacağı
title: Testler
x-i18n:
    generated_at: "2026-04-26T11:40:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24eb2d122c806237bd4b90dffbd293479763c11a42cfcd195e1aed59efc71a5b
    source_path: reference/test.md
    workflow: 15
---

- Tam test kiti (paketler, live, Docker): [Testing](/tr/help/testing)

- `pnpm test:force`: Varsayılan kontrol portunu tutan kalmış Gateway sürecini sonlandırır, sonra tam Vitest paketini yalıtılmış bir Gateway portuyla çalıştırır; böylece sunucu testleri çalışan bir örnekle çakışmaz. Önceki bir Gateway çalıştırması 18789 portunu dolu bıraktığında bunu kullanın.
- `pnpm test:coverage`: Birim paketini V8 coverage ile çalıştırır (`vitest.unit.config.ts` üzerinden). Bu, tüm depo için all-file coverage değil, yüklenen dosya birim coverage kapısıdır. Eşikler satırlar/fonksiyonlar/ifadeler için %70, branch’ler için %55’tir. `coverage.all` false olduğu için kapı, her split-lane kaynak dosyasını kapsanmamış saymak yerine birim coverage paketi tarafından yüklenen dosyaları ölçer.
- `pnpm test:coverage:changed`: Yalnızca `origin/main` sonrasındaki değişen dosyalar için birim coverage çalıştırır.
- `pnpm test:changed`: Değişen git yollarını, fark yalnızca yönlendirilebilir kaynak/test dosyalarına dokunuyorsa kapsamlı Vitest lane’lerine genişletir. Config/setup değişiklikleri yine yerel root project çalıştırmasına geri döner; böylece wiring düzenlemeleri gerektiğinde geniş kapsamlı yeniden çalışır.
- `pnpm test:changed:focused`: İç döngü değişen test çalıştırması. Yalnızca doğrudan test düzenlemelerinden, kardeş `*.test.ts` dosyalarından, açık kaynak eşlemelerinden ve yerel import grafiğinden kesin hedefleri çalıştırır. Geniş/config/package değişiklikleri, tam changed-test geri dönüşüne genişlemek yerine atlanır.
- `pnpm changed:lanes`: `origin/main` karşısındaki farkın tetiklediği mimari lane’leri gösterir.
- `pnpm check:changed`: `origin/main` karşısındaki fark için akıllı changed gate’i çalıştırır. Core işleri core test lane’leriyle, extension işlerini extension test lane’leriyle, yalnızca test işlerini sadece test typecheck/test’lerle çalıştırır, genel Plugin SDK veya plugin-contract değişikliklerini tek bir extension doğrulama geçişine genişletir ve yalnızca release metadata sürüm artışlarını hedefli sürüm/config/root-dependency kontrollerinde tutar.
- `pnpm test`: Açık dosya/dizin hedeflerini kapsamlı Vitest lane’leri üzerinden yönlendirir. Hedefsiz çalıştırmalar sabit shard grupları kullanır ve yerel paralel yürütme için leaf config’lere genişler; extension grubu her zaman tek büyük bir root-project süreci yerine extension başına shard config’lere genişler.
- Tam, extension ve include-pattern shard çalıştırmaları yerel zamanlama verisini `.artifacts/vitest-shard-timings.json` içinde günceller; sonraki whole-config çalıştırmaları bu zamanlamaları yavaş ve hızlı shard’ları dengelemek için kullanır. Include-pattern CI shard’ları timing anahtarına shard adını ekler; bu da filtrelenmiş shard zamanlamalarını whole-config zamanlama verisini değiştirmeden görünür tutar. Yerel zamanlama artefaktını yok saymak için `OPENCLAW_TEST_PROJECTS_TIMINGS=0` ayarlayın.
- Seçili `plugin-sdk` ve `commands` test dosyaları artık yalnızca `test/setup.ts` tutan özel hafif lane’ler üzerinden yönlendirilir; çalışma zamanı ağır durumlar mevcut lane’lerinde kalır.
- Kardeş testleri olan kaynak dosyaları, daha geniş dizin glob’larına dönmeden önce o kardeşe eşlenir. `test/helpers/channels` ve `test/helpers/plugins` altındaki yardımcı düzenlemeleri, bağımlılık yolu kesin olduğunda her shard’ı geniş çalıştırmak yerine import eden testleri çalıştırmak için yerel import grafiği kullanır.
- `auto-reply` artık üç özel config’e (`core`, `top-level`, `reply`) ayrılır; böylece reply harness daha hafif top-level status/token/helper testlerine baskın gelmez.
- Temel Vitest config’i artık varsayılan olarak `pool: "threads"` ve `isolate: false` kullanır; paylaşılan non-isolated runner depo config’leri genelinde etkindir.
- `pnpm test:channels`, `vitest.channels.config.ts` çalıştırır.
- `pnpm test:extensions` ve `pnpm test extensions`, tüm extension/plugin shard’larını çalıştırır. Ağır kanal Plugin’leri, browser Plugin’i ve OpenAI özel shard’lar olarak çalışır; diğer Plugin grupları paketli kalır. Tek bir paketlenmiş Plugin lane’i için `pnpm test extensions/<id>` kullanın.
- `pnpm test:perf:imports`: Açık dosya/dizin hedefleri için kapsamlı lane yönlendirmesini korurken Vitest import-duration + import-breakdown raporlamasını etkinleştirir.
- `pnpm test:perf:imports:changed`: Aynı import profillemesi, ancak yalnızca `origin/main` sonrasındaki değişen dosyalar için.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`: Aynı commit edilmiş git farkı için yönlendirilmiş changed-mode yolunu yerel root-project çalıştırmasına karşı kıyaslar.
- `pnpm test:perf:changed:bench -- --worktree`: Önce commit etmeden geçerli worktree değişiklik kümesini kıyaslar.
- `pnpm test:perf:profile:main`: Vitest ana iş parçacığı için CPU profili yazar (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: Birim runner için CPU + heap profilleri yazar (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: Her full-suite Vitest leaf config’ini seri olarak çalıştırır ve gruplanmış süre verilerini config başına JSON/log artefaktlarıyla birlikte yazar. Test Performance Agent bunu yavaş test düzeltmelerine başlamadan önce taban çizgisi olarak kullanır.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: Performans odaklı bir değişiklikten sonra gruplanmış raporları karşılaştırır.
- Gateway entegrasyonu: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` veya `pnpm test:gateway` ile isteğe bağlı etkinleştirilir.
- `pnpm test:e2e`: Gateway uçtan uca smoke testlerini çalıştırır (çoklu örnek WS/HTTP/Node eşleştirme). `vitest.e2e.config.ts` içinde varsayılan olarak `threads` + `isolate: false` ve uyarlamalı worker’larla çalışır; `OPENCLAW_E2E_WORKERS=<n>` ile ayarlayın ve ayrıntılı loglar için `OPENCLAW_E2E_VERBOSE=1` ayarlayın.
- `pnpm test:live`: Sağlayıcı live testlerini çalıştırır (minimax/zai). Atlanmaması için API anahtarları ve `LIVE=1` (veya sağlayıcıya özgü `*_LIVE_TEST=1`) gerekir.
- `pnpm test:docker:all`: Paylaşılan live-test görüntüsünü ve Docker E2E görüntüsünü bir kez derler, sonra Docker smoke lane’lerini `OPENCLAW_SKIP_DOCKER_BUILD=1` ile ağırlıklı zamanlayıcı üzerinden çalıştırır. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` süreç yuvalarını denetler ve varsayılanı 10’dur; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` sağlayıcıya duyarlı tail havuzunu denetler ve varsayılanı 10’dur. Ağır lane sınırları varsayılan olarak `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; sağlayıcı sınırları ise sağlayıcı başına bir ağır lane olacak şekilde varsayılan olarak `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` ve `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` değerlerini kullanır. Daha büyük ana makineler için `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` kullanın. Yerel Docker daemon create fırtınalarını önlemek için lane başlangıçları varsayılan olarak 2 saniye aralıklıdır; `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` ile geçersiz kılın. Runner varsayılan olarak Docker ön kontrolü yapar, bayat OpenClaw E2E container’larını temizler, her 30 saniyede bir etkin lane durumu üretir, uyumlu lane’ler arasında sağlayıcı CLI araç önbelleklerini paylaşır, geçici live-provider hatalarını varsayılan olarak bir kez yeniden dener (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) ve sonraki çalıştırmalarda en uzundan başlayarak sıralama için lane zamanlamalarını `.artifacts/docker-tests/lane-timings.json` içinde saklar. Docker çalıştırmadan lane manifest’ini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, durum çıktısını ayarlamak için `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` veya zamanlama yeniden kullanımını kapatmak için `OPENCLAW_DOCKER_ALL_TIMINGS=0` kullanın. Yalnızca deterministik/yerel lane’ler için `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip`, yalnızca live-provider lane’leri için `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` kullanın; paket takma adları `pnpm test:docker:local:all` ve `pnpm test:docker:live:all` şeklindedir. Live-only modu main ve tail live lane’lerini tek bir en-uzun-önce havuzunda birleştirir; böylece sağlayıcı paketleri Claude, Codex ve Gemini işlerini birlikte yerleştirebilir. `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` ayarlanmadıkça runner ilk hatadan sonra yeni havuz lane’leri zamanlamayı durdurur ve her lane’in `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ile geçersiz kılınabilen 120 dakikalık geri dönüş zaman aşımı vardır; seçili live/tail lane’leri daha sıkı lane başına sınırlamalar kullanır. CLI backend Docker kurulum komutlarının kendi zaman aşımı `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` ile belirlenir (varsayılan 180). Lane başına loglar `.artifacts/docker-tests/<run-id>/` altında yazılır.
- `pnpm test:docker:browser-cdp-snapshot`: Chromium destekli bir kaynak E2E container’ı derler, ham CDP ile yalıtılmış bir Gateway başlatır, `browser doctor --deep` çalıştırır ve CDP rol snapshot’larının bağlantı URL’lerini, cursor-promoted clickables’ı, iframe başvurularını ve frame meta verilerini içerdiğini doğrular.
- CLI backend live Docker probları odaklı lane’ler olarak çalıştırılabilir; örneğin `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` veya `pnpm test:docker:live-cli-backend:codex:mcp`. Claude ve Gemini için eşleşen `:resume` ve `:mcp` takma adları vardır.
- `pnpm test:docker:openwebui`: Docker’lı OpenClaw + Open WebUI başlatır, Open WebUI üzerinden oturum açar, `/api/models` denetler, sonra `/api/chat/completions` üzerinden gerçek bir proxy’lenmiş sohbet çalıştırır. Kullanılabilir bir live model anahtarı gerektirir (örneğin `~/.profile` içinde OpenAI), harici bir Open WebUI görüntüsü çeker ve normal birim/e2e paketleri gibi CI-kararlı olması beklenmez.
- `pnpm test:docker:mcp-channels`: Tohumlanmış bir Gateway container’ı ve `openclaw mcp serve` başlatan ikinci bir istemci container’ı çalıştırır; sonra yönlendirilmiş konuşma keşfini, transcript okumalarını, ek meta verilerini, live event queue davranışını, giden gönderim yönlendirmesini ve gerçek stdio köprüsü üzerinden Claude tarzı kanal + izin bildirimlerini doğrular. Claude bildirim doğrulaması ham stdio MCP framelerini doğrudan okur; böylece smoke test köprünün gerçekten ne yaydığını yansıtır.

## Yerel PR geçidi

Yerel PR land/gate kontrolleri için şunları çalıştırın:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` yoğun yüklü bir ana makinede kararsız davranırsa, bunu bir regresyon kabul etmeden önce bir kez daha çalıştırın; sonra `pnpm test <path/to/test>` ile yalıtın. Bellek kısıtlı ana makineler için şunları kullanın:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model gecikme kıyası (yerel anahtarlar)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Kullanım:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- İsteğe bağlı env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Varsayılan istem: “Reply with a single word: ok. No punctuation or extra text.”

Son çalıştırma (2025-12-31, 20 çalıştırma):

- minimax medyan 1279ms (min 1114, maks 2431)
- opus medyan 2454ms (min 1224, maks 3170)

## CLI başlangıç kıyası

Script: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

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
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Ön ayarlar:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: her iki ön ayar da

Çıktı; her komut için `sampleCount`, ortalama, p50, p95, min/maks, exit-code/signal dağılımı ve max RSS özetlerini içerir. İsteğe bağlı `--cpu-prof-dir` / `--heap-prof-dir`, çalıştırma başına V8 profilleri yazar; böylece zamanlama ve profil yakalama aynı harness’i kullanır.

Kaydedilmiş çıktı kuralları:

- `pnpm test:startup:bench:smoke`, hedeflenmiş smoke artefaktını `.artifacts/cli-startup-bench-smoke.json` konumuna yazar
- `pnpm test:startup:bench:save`, tam paket artefaktını `runs=5` ve `warmup=1` kullanarak `.artifacts/cli-startup-bench-all.json` konumuna yazar
- `pnpm test:startup:bench:update`, `runs=5` ve `warmup=1` kullanarak sürüm denetimine eklenmiş taban çizgisi fixture’ını `test/fixtures/cli-startup-bench.json` konumunda yeniler

Sürüm denetimine eklenmiş fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` ile yenileyin
- Geçerli sonuçları fixture ile `pnpm test:startup:bench:check` kullanarak karşılaştırın

## Onboarding E2E (Docker)

Docker isteğe bağlıdır; buna yalnızca container’lı onboarding smoke testleri için ihtiyaç vardır.

Temiz bir Linux container’ında tam cold-start akışı:

```bash
scripts/e2e/onboard-docker.sh
```

Bu script etkileşimli sihirbazı pseudo-tty üzerinden sürer, config/çalışma alanı/oturum dosyalarını doğrular, sonra Gateway’i başlatır ve `openclaw health` çalıştırır.

## QR içe aktarma smoke testi (Docker)

Bakımı yapılan QR çalışma zamanı yardımcısının desteklenen Docker Node çalışma zamanlarında (varsayılan Node 24, uyumlu Node 22) yüklendiğini doğrular:

```bash
pnpm test:docker:qr
```

## İlgili

- [Testing](/tr/help/testing)
- [Testing live](/tr/help/testing-live)
