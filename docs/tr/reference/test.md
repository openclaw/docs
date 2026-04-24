---
read_when:
    - Testleri çalıştırma veya düzeltme
summary: Vitest ile testleri yerelde nasıl çalıştıracağınız ve force/coverage modlarını ne zaman kullanacağınız
title: Testler
x-i18n:
    generated_at: "2026-04-24T09:30:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26cdb5fe005e738ddd00b183e91ccebe08c709bd64eed377d573a37b76e3a3bf
    source_path: reference/test.md
    workflow: 15
---

- Tam test kiti (suite'ler, live, Docker): [Testing](/tr/help/testing)

- `pnpm test:force`: Varsayılan kontrol portunu elinde tutan kalan Gateway sürecini sonlandırır, ardından sunucu testleri çalışan bir örnekle çakışmasın diye yalıtılmış bir Gateway portuyla tam Vitest suite'ini çalıştırır. Önceki bir Gateway çalıştırması 18789 portunu dolu bıraktığında bunu kullanın.
- `pnpm test:coverage`: Birim suite'ini V8 coverage ile çalıştırır (`vitest.unit.config.ts` aracılığıyla). Bu, tüm depo için tüm dosyaları kapsayan coverage değil, yüklenen dosyalar için birim coverage kapısıdır. Eşikler satır/fonksiyon/statement için %70 ve branch için %55'tir. `coverage.all` false olduğu için kapı, bölünmüş lane kaynak dosyalarının tamamını kapsanmamış saymak yerine birim coverage suite'i tarafından yüklenen dosyaları ölçer.
- `pnpm test:coverage:changed`: Yalnızca `origin/main` üzerinden değişen dosyalar için birim coverage çalıştırır.
- `pnpm test:changed`: Git'te değişen yolları, diff yalnızca yönlendirilebilir kaynak/test dosyalarına dokunuyorsa kapsamlı Vitest lane'lerine genişletir. Yapılandırma/kurulum değişiklikleri ise yerel kök proje çalıştırmasına fallback yapar; böylece bağlantı düzenlemeleri gerektiğinde geniş yeniden çalıştırma yapılır.
- `pnpm changed:lanes`: `origin/main` karşısındaki diff tarafından tetiklenen mimari lane'leri gösterir.
- `pnpm check:changed`: `origin/main` karşısındaki diff için akıllı değişiklik kapısını çalıştırır. Çekirdek işi çekirdek test lane'leriyle, extension işini extension test lane'leriyle, yalnızca test işini yalnızca test typecheck/testleriyle çalıştırır, genel Plugin SDK veya plugin-contract değişikliklerini tek bir extension doğrulama geçişine genişletir ve yalnızca sürüm metaverisine ait sürüm artışlarında hedefli sürüm/yapılandırma/kök bağımlılık denetimlerini korur.
- `pnpm test`: Açık dosya/dizin hedeflerini kapsamlı Vitest lane'leri üzerinden yönlendirir. Hedefsiz çalıştırmalar sabit shard grupları kullanır ve yerel paralel yürütme için leaf config'lere genişler; extension grubu her zaman tek bir dev kök-proje süreci yerine extension başına shard config'lere genişler.
- Tam ve extension shard çalıştırmaları, yerel zamanlama verilerini `.artifacts/vitest-shard-timings.json` içinde günceller; sonraki çalıştırmalar bu zamanlamaları yavaş ve hızlı shard'ları dengelemek için kullanır. Yerel zamanlama yapıtını yok saymak için `OPENCLAW_TEST_PROJECTS_TIMINGS=0` ayarlayın.
- Seçili `plugin-sdk` ve `commands` test dosyaları artık yalnızca `test/setup.ts` kullanan ayrılmış hafif lane'lere yönlendirilir; çalışma zamanı açısından ağır durumlar mevcut lane'lerinde kalır.
- Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da `pnpm test:changed` komutunu bu hafif lane'lerdeki açık kardeş testlere eşler; böylece küçük yardımcı düzenlemeleri ağır çalışma zamanı destekli suite'leri yeniden çalıştırmaktan kaçınır.
- `auto-reply` artık üç ayrılmış config'e de bölünür (`core`, `top-level`, `reply`); böylece reply harness daha hafif üst düzey status/token/helper testlerine baskın gelmez.
- Temel Vitest yapılandırması artık varsayılan olarak `pool: "threads"` ve `isolate: false` kullanır; paylaşılan yalıtımsız çalıştırıcı depo yapılandırmaları genelinde etkinleştirilmiştir.
- `pnpm test:channels`, `vitest.channels.config.ts` dosyasını çalıştırır.
- `pnpm test:extensions` ve `pnpm test extensions`, tüm extension/plugin shard'larını çalıştırır. Ağır kanal Plugin'leri, tarayıcı Plugin'i ve OpenAI ayrılmış shard'lar olarak çalışır; diğer Plugin grupları toplu kalır. Tek bir paketlenmiş Plugin lane'i için `pnpm test extensions/<id>` kullanın.
- `pnpm test:perf:imports`: Vitest import süresi + import kırılımı raporlamasını etkinleştirir, ancak açık dosya/dizin hedefleri için yine de kapsamlı lane yönlendirmesini kullanır.
- `pnpm test:perf:imports:changed`: Aynı import profillemesi, ancak yalnızca `origin/main` üzerinden değişen dosyalar için.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`, aynı commit'lenmiş git diff'i için yönlendirilmiş changed-mode yolunu yerel kök-proje çalıştırmasıyla kıyaslar.
- `pnpm test:perf:changed:bench -- --worktree`, önce commit atmadan mevcut worktree değişiklik kümesini kıyaslar.
- `pnpm test:perf:profile:main`: Vitest ana iş parçacığı için bir CPU profili yazar (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: Birim çalıştırıcı için CPU + heap profilleri yazar (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: Her tam-suite Vitest leaf config'ini seri olarak çalıştırır ve gruplanmış süre verilerini, ayrıca config başına JSON/log yapılarını yazar. Test Performance Agent bunu yavaş test düzeltmelerine girişmeden önce başlangıç noktası olarak kullanır.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: performans odaklı bir değişiklikten sonra gruplanmış raporları karşılaştırır.
- Gateway entegrasyonu: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` veya `pnpm test:gateway` ile isteğe bağlı etkinleştirilir.
- `pnpm test:e2e`: Gateway uçtan uca smoke testlerini çalıştırır (çoklu örnek WS/HTTP/Node eşleştirme). Varsayılan olarak `vitest.e2e.config.ts` içinde uyarlanabilir worker'larla `threads` + `isolate: false` kullanır; `OPENCLAW_E2E_WORKERS=<n>` ile ayarlayın ve ayrıntılı loglar için `OPENCLAW_E2E_VERBOSE=1` ayarlayın.
- `pnpm test:live`: Sağlayıcı live testlerini çalıştırır (minimax/zai). Atlama durumundan çıkması için API key'ler ve `LIVE=1` (veya sağlayıcıya özel `*_LIVE_TEST=1`) gerekir.
- `pnpm test:docker:all`: Paylaşılan live-test görselini ve Docker E2E görselini bir kez derler, sonra Docker smoke lane'lerini varsayılan olarak eşzamanlılık 8 ile `OPENCLAW_SKIP_DOCKER_BUILD=1` kullanarak çalıştırır. Ana havuzu `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` ile, sağlayıcı duyarlı kuyruk sonu havuzunu `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` ile ayarlayın; ikisi de varsayılan olarak 8'dir. Yerel Docker daemon create fırtınalarını önlemek için lane başlangıçları varsayılan olarak 2 saniye aralıklandırılır; `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` ile geçersiz kılın. Çalıştırıcı, `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` ayarlanmadıkça ilk hatadan sonra havuzlanmış yeni lane'leri planlamayı durdurur ve her lane için `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ile geçersiz kılınabilen 120 dakikalık bir zaman aşımı vardır. Lane başına loglar `.artifacts/docker-tests/<run-id>/` altında yazılır.
- `pnpm test:docker:openwebui`: Docker ile OpenClaw + Open WebUI başlatır, Open WebUI üzerinden oturum açar, `/api/models` yolunu denetler, sonra `/api/chat/completions` üzerinden gerçek bir proxied sohbet çalıştırır. Kullanılabilir bir live model anahtarı gerekir (örneğin `~/.profile` içindeki OpenAI), harici bir Open WebUI görseli çeker ve normal birim/e2e suite'leri gibi CI açısından kararlı olması beklenmez.
- `pnpm test:docker:mcp-channels`: Tohumlanmış bir Gateway container'ı ve `openclaw mcp serve` başlatan ikinci bir istemci container'ı başlatır; sonra yönlendirilmiş konuşma keşfini, transkript okumalarını, ek meta verilerini, canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve gerçek stdio köprüsü üzerinden Claude tarzı kanal + izin bildirimlerini doğrular. Claude bildirim doğrulaması, smoke testinin köprünün gerçekten ne yaydığını yansıtması için ham stdio MCP frame'lerini doğrudan okur.

## Yerel PR kapısı

Yerel PR land/gate denetimleri için şunları çalıştırın:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` yoğun bir ana makinede flake verirse, bunu regresyon kabul etmeden önce bir kez yeniden çalıştırın; sonra `pnpm test <path/to/test>` ile izole edin. Bellek kısıtlı ana makineler için şunları kullanın:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model gecikme kıyası (yerel anahtarlar)

Betik: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Kullanım:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- İsteğe bağlı env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Varsayılan istem: “Reply with a single word: ok. No punctuation or extra text.”

Son çalıştırma (2025-12-31, 20 çalıştırma):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

## CLI başlangıç kıyası

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
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Ön ayarlar:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: her iki ön ayar

Çıktı, her komut için `sampleCount`, avg, p50, p95, min/max, exit-code/signal dağılımı ve en yüksek RSS özetlerini içerir. İsteğe bağlı `--cpu-prof-dir` / `--heap-prof-dir`, çalıştırma başına V8 profilleri yazar; böylece zamanlama ve profil yakalama aynı harness'i kullanır.

Kaydedilen çıktı kuralları:

- `pnpm test:startup:bench:smoke`, hedefli smoke yapıtını `.artifacts/cli-startup-bench-smoke.json` konumuna yazar
- `pnpm test:startup:bench:save`, tam-suite yapıtını `runs=5` ve `warmup=1` ile `.artifacts/cli-startup-bench-all.json` konumuna yazar
- `pnpm test:startup:bench:update`, checked-in baseline fixture'ı `runs=5` ve `warmup=1` ile `test/fixtures/cli-startup-bench.json` konumunda yeniler

Checked-in fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` ile yenileyin
- Mevcut sonuçları fixture ile `pnpm test:startup:bench:check` kullanarak karşılaştırın

## Onboarding E2E (Docker)

Docker isteğe bağlıdır; buna yalnızca container içinde onboarding smoke testleri için ihtiyaç vardır.

Temiz bir Linux container içinde tam cold-start akışı:

```bash
scripts/e2e/onboard-docker.sh
```

Bu betik etkileşimli sihirbazı bir pseudo-tty aracılığıyla sürer, config/workspace/session dosyalarını doğrular, ardından Gateway'i başlatır ve `openclaw health` çalıştırır.

## QR içe aktarma smoke (Docker)

Bakımı yapılan QR çalışma zamanı yardımcısının desteklenen Docker Node çalışma zamanlarında yüklendiğini garanti eder (Node 24 varsayılan, Node 22 uyumlu):

```bash
pnpm test:docker:qr
```

## İlgili

- [Testing](/tr/help/testing)
- [Testing live](/tr/help/testing-live)
