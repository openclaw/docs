---
read_when:
    - Testleri çalıştırma veya düzeltme
summary: Vitest ile testleri yerelde nasıl çalıştıracağınız ve force/coverage modlarını ne zaman kullanmanız gerektiği
title: Testler
x-i18n:
    generated_at: "2026-04-22T04:27:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed665840ef2c7728da8ec923eb3ea2878d9b20a841cb2fe4116a7f6334567b8e
    source_path: reference/test.md
    workflow: 15
---

# Testler

- Tam test kiti (suiteler, canlı, Docker): [Testing](/tr/help/testing)

- `pnpm test:force`: Varsayılan denetim portunu elinde tutan artakalmış gateway sürecini sonlandırır, ardından sunucu testleri çalışan bir örnekle çakışmasın diye yalıtılmış bir gateway portuyla tam Vitest paketini çalıştırır. Önceki bir gateway çalıştırması 18789 portunu dolu bıraktığında bunu kullanın.
- `pnpm test:coverage`: V8 kapsamıyla birim paketini çalıştırır (`vitest.unit.config.ts` üzerinden). Bu, tüm depo için tüm dosyaları kapsayan kapsam değil, yüklenmiş dosya birim kapsam geçididir. Eşikler satırlar/fonksiyonlar/ifadeler için %70, dallar için %55’tir. `coverage.all` false olduğu için geçit, her parçalanmış hat kaynak dosyasını kapsanmamış saymak yerine birim kapsam paketi tarafından yüklenen dosyaları ölçer.
- `pnpm test:coverage:changed`: Birim kapsamını yalnızca `origin/main` sonrasındaki değişmiş dosyalar için çalıştırır.
- `pnpm test:changed`: Git’te değişen yolları, fark yalnızca yönlendirilebilir kaynak/test dosyalarına dokunuyorsa kapsamlı Vitest hatlarına genişletir. Yapılandırma/kurulum değişiklikleri, gerektiğinde bağlantı düzenlemeleri geniş çapta yeniden çalışsın diye yine yerel kök proje çalıştırmasına geri düşer.
- `pnpm changed:lanes`: `origin/main` karşısındaki farkın tetiklediği mimari hatları gösterir.
- `pnpm check:changed`: `origin/main` karşısındaki fark için akıllı changed geçidini çalıştırır. Çekirdek işi çekirdek test hatlarıyla, eklenti işini eklenti test hatlarıyla, yalnızca test işini sadece test typecheck/testleriyle çalıştırır, herkese açık Plugin SDK veya plugin-contract değişikliklerini eklenti doğrulamasına genişletir ve yalnızca release metadata sürüm artışlarını hedeflenmiş sürüm/yapılandırma/kök-bağımlılık denetimlerinde tutar.
- `pnpm test`: Açık dosya/dizin hedeflerini kapsamlı Vitest hatları üzerinden yönlendirir. Hedefsiz çalıştırmalar sabit shard grupları kullanır ve yerelde paralel yürütme için yaprak yapılandırmalara genişler; eklenti grubu her zaman tek bir dev kök proje süreci yerine eklenti başına shard yapılandırmalarına genişler.
- Tam ve eklenti shard çalıştırmaları `.artifacts/vitest-shard-timings.json` içinde yerel zamanlama verilerini günceller; sonraki çalıştırmalar bu zamanlamaları yavaş ve hızlı shard’ları dengelemek için kullanır. Yerel zamanlama artifact’ini yok saymak için `OPENCLAW_TEST_PROJECTS_TIMINGS=0` ayarlayın.
- Seçili `plugin-sdk` ve `commands` test dosyaları artık yalnızca `test/setup.ts` tutan özel hafif hatlar üzerinden yönlendirilir; çalışma zamanı ağır durumlar mevcut hatlarında kalır.
- Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları ayrıca `pnpm test:changed` komutunu bu hafif hatlardaki açık kardeş testlere eşler; böylece küçük yardımcı düzenlemeleri ağır çalışma zamanı destekli paketleri yeniden çalıştırmaz.
- `auto-reply` artık üç özel yapılandırmaya da bölünür (`core`, `top-level`, `reply`); böylece reply harness daha hafif top-level status/token/helper testlerine baskın çıkmaz.
- Temel Vitest yapılandırması artık varsayılan olarak `pool: "threads"` ve `isolate: false` kullanır; paylaşılan yalıtımsız çalıştırıcı depo yapılandırmaları genelinde etkindir.
- `pnpm test:channels`, `vitest.channels.config.ts` dosyasını çalıştırır.
- `pnpm test:extensions` ve `pnpm test extensions` tüm extension/plugin shard’larını çalıştırır. Ağır kanal extension’ları ve OpenAI özel shard’lar olarak çalışır; diğer extension grupları toplu kalır. Tek bir paketlenmiş plugin hattı için `pnpm test extensions/<id>` kullanın.
- `pnpm test:perf:imports`: Açık dosya/dizin hedefleri için kapsamlı hat yönlendirmesini kullanmaya devam ederken Vitest import-duration + import-breakdown raporlamasını etkinleştirir.
- `pnpm test:perf:imports:changed`: Aynı import profillemesi, ancak yalnızca `origin/main` sonrasındaki değişmiş dosyalar için.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` aynı commit edilmiş git farkı için yönlendirilmiş changed-mode yolunu yerel kök proje çalıştırmasına karşı kıyaslar.
- `pnpm test:perf:changed:bench -- --worktree` önce commit etmeden mevcut worktree değişiklik kümesini kıyaslar.
- `pnpm test:perf:profile:main`: Vitest ana iş parçacığı için bir CPU profili yazar (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: Birim çalıştırıcı için CPU + heap profilleri yazar (`.artifacts/vitest-runner-profile`).
- Gateway entegrasyonu: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` veya `pnpm test:gateway` ile isteğe bağlı etkinleştirilir.
- `pnpm test:e2e`: Gateway uçtan uca smoke testlerini çalıştırır (çoklu örnek WS/HTTP/node eşleştirmesi). Varsayılan olarak `vitest.e2e.config.ts` içinde uyarlamalı worker’larla `threads` + `isolate: false` kullanır; `OPENCLAW_E2E_WORKERS=<n>` ile ayarlayın ve ayrıntılı günlükler için `OPENCLAW_E2E_VERBOSE=1` ayarlayın.
- `pnpm test:live`: Sağlayıcı canlı testlerini çalıştırır (minimax/zai). Atlananları çalıştırmak için API anahtarları ve `LIVE=1` (veya sağlayıcıya özgü `*_LIVE_TEST=1`) gerekir.
- `pnpm test:docker:openwebui`: Docker’lı OpenClaw + Open WebUI başlatır, Open WebUI üzerinden oturum açar, `/api/models` denetler, ardından `/api/chat/completions` üzerinden gerçek proxy’lenmiş bir sohbet çalıştırır. Kullanılabilir bir canlı model anahtarı gerektirir (örneğin `~/.profile` içindeki OpenAI), harici bir Open WebUI image’ı çeker ve normal birim/e2e paketleri gibi CI açısından kararlı olması beklenmez.
- `pnpm test:docker:mcp-channels`: Tohumlanmış bir Gateway kapsayıcısı ve `openclaw mcp serve` başlatan ikinci bir istemci kapsayıcısı başlatır; ardından yönlendirilmiş konuşma keşfini, transcript okumalarını, ek meta verilerini, canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve Claude tarzı kanal + izin bildirimlerini gerçek stdio köprüsü üzerinden doğrular. Claude bildirim doğrulaması ham stdio MCP çerçevelerini doğrudan okur; böylece smoke, köprünün gerçekten ne yaydığını yansıtır.

## Yerel PR geçidi

Yerel PR land/geçit denetimleri için şunları çalıştırın:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Eğer `pnpm test` yoğun yüklü bir hostta dalgalanırsa, bunu bir regresyon saymadan önce bir kez yeniden çalıştırın, sonra `pnpm test <path/to/test>` ile yalıtın. Bellek kısıtlı host’lar için şunları kullanın:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model gecikme kıyası (yerel anahtarlar)

Betik: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Kullanım:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- İsteğe bağlı env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Varsayılan istem: “Reply with a single word: ok. No punctuation or extra text.”

Son çalışma (2025-12-31, 20 çalıştırma):

- minimax medyan 1279ms (en düşük 1114, en yüksek 2431)
- opus medyan 2454ms (en düşük 1224, en yüksek 3170)

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

Çıktı, her komut için `sampleCount`, ortalama, p50, p95, min/max, exit-code/signal dağılımı ve en yüksek RSS özetlerini içerir. İsteğe bağlı `--cpu-prof-dir` / `--heap-prof-dir`, çalıştırma başına V8 profilleri yazar; böylece zamanlama ve profil yakalama aynı harness’i kullanır.

Kaydedilmiş çıktı kuralları:

- `pnpm test:startup:bench:smoke`, hedefli smoke artifact’ini `.artifacts/cli-startup-bench-smoke.json` içine yazar
- `pnpm test:startup:bench:save`, tam paket artifact’ini `.artifacts/cli-startup-bench-all.json` içine `runs=5` ve `warmup=1` ile yazar
- `pnpm test:startup:bench:update`, depo içinde tutulan temel fixture’ı `test/fixtures/cli-startup-bench.json` içinde `runs=5` ve `warmup=1` ile yeniler

Depoda tutulan fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` ile yenileyin
- Geçerli sonuçları fixture ile karşılaştırmak için `pnpm test:startup:bench:check` kullanın

## Onboarding E2E (Docker)

Docker isteğe bağlıdır; buna yalnızca kapsayıcılaştırılmış onboarding smoke testleri için ihtiyaç vardır.

Temiz bir Linux kapsayıcısında tam soğuk başlangıç akışı:

```bash
scripts/e2e/onboard-docker.sh
```

Bu betik etkileşimli sihirbazı bir pseudo-tty üzerinden sürer, config/workspace/session dosyalarını doğrular, ardından gateway’i başlatır ve `openclaw health` çalıştırır.

## QR içe aktarma smoke (Docker)

`qrcode-terminal` bileşeninin desteklenen Docker Node çalışma zamanlarında (varsayılan Node 24, uyumlu Node 22) yüklendiğini doğrular:

```bash
pnpm test:docker:qr
```
