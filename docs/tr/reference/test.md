---
read_when:
    - Testleri çalıştırırken veya düzeltirken
summary: Testlerin yerelde nasıl çalıştırılacağı (vitest) ve force/coverage modlarının ne zaman kullanılacağı
title: Testler
x-i18n:
    generated_at: "2026-04-05T14:08:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 78390107a9ac2bdc4294d4d0204467c5efdd98faebaf308f3a4597ab966a6d26
    source_path: reference/test.md
    workflow: 15
---

# Testler

- Tam test kiti (paketler, live, Docker): [Testing](/tr/help/testing)

- `pnpm test:force`: Varsayılan kontrol portunu tutan bekleyen gateway süreçlerini sonlandırır, ardından sunucu testleri çalışan bir örnekle çakışmasın diye yalıtılmış bir gateway portuyla tam Vitest paketini çalıştırır. Önceki bir gateway çalıştırması port 18789'u meşgul bıraktıysa bunu kullanın.
- `pnpm test:coverage`: Birim paketini V8 coverage ile çalıştırır (`vitest.unit.config.ts` üzerinden). Genel eşikler satırlar/dallar/fonksiyonlar/ifadeler için %70'tir. Coverage, hedefin birim testine uygun mantığa odaklanmasını sağlamak için entegrasyon ağırlıklı giriş noktalarını (CLI wiring, gateway/telegram bridges, webchat static server) hariç tutar.
- `pnpm test:coverage:changed`: Yalnızca `origin/main` üzerinden değişen dosyalar için birim coverage çalıştırır.
- `pnpm test:changed`: Yerel Vitest projects yapılandırmasını `--changed origin/main` ile çalıştırır. Temel yapılandırma, gerektiğinde wiring değişikliklerinin yine geniş kapsamda yeniden çalıştırılmasını sağlamak için projects/config dosyalarını `forceRerunTriggers` olarak ele alır.
- `pnpm test`: Yerel Vitest root projects yapılandırmasını doğrudan çalıştırır. Dosya filtreleri, yapılandırılmış projeler arasında yerel olarak çalışır.
- Temel Vitest yapılandırması artık varsayılan olarak `pool: "threads"` ve `isolate: false` kullanır; paylaşılan yalıtımsız çalıştırıcı repo yapılandırmaları genelinde etkindir.
- `pnpm test:channels`, `vitest.channels.config.ts` dosyasını çalıştırır.
- `pnpm test:extensions`, `vitest.extensions.config.ts` dosyasını çalıştırır.
- `pnpm test:extensions`: Uzantı/plugin paketlerini çalıştırır.
- `pnpm test:perf:imports`: Yerel root projects çalıştırması için Vitest import-duration + import-breakdown raporlamasını etkinleştirir.
- `pnpm test:perf:imports:changed`: Aynı import profillemesi, ancak yalnızca `origin/main` üzerinden değişen dosyalar için.
- `pnpm test:perf:profile:main`: Vitest ana iş parçacığı için bir CPU profili yazar (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: Birim çalıştırıcısı için CPU + heap profilleri yazar (`.artifacts/vitest-runner-profile`).
- Gateway entegrasyonu: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` veya `pnpm test:gateway` ile isteğe bağlı olarak etkinleştirilir.
- `pnpm test:e2e`: Gateway uçtan uca smoke testlerini çalıştırır (çoklu örnek WS/HTTP/node eşleştirme). Varsayılan olarak `vitest.e2e.config.ts` içinde uyarlanabilir worker'larla `threads` + `isolate: false` kullanır; `OPENCLAW_E2E_WORKERS=<n>` ile ayarlayın ve ayrıntılı günlükler için `OPENCLAW_E2E_VERBOSE=1` kullanın.
- `pnpm test:live`: Provider live testlerini çalıştırır (minimax/zai). Atlanmamaları için API anahtarları ve `LIVE=1` (veya provider'a özgü `*_LIVE_TEST=1`) gerekir.
- `pnpm test:docker:openwebui`: Docker içinde OpenClaw + Open WebUI başlatır, Open WebUI üzerinden oturum açar, `/api/models` uç noktasını kontrol eder, ardından `/api/chat/completions` üzerinden gerçek bir proxied chat çalıştırır. Kullanılabilir bir live model anahtarı gerekir (örneğin `~/.profile` içindeki OpenAI), harici bir Open WebUI imajı çeker ve normal birim/e2e paketleri gibi CI açısından kararlı olması beklenmez.
- `pnpm test:docker:mcp-channels`: Seed edilmiş bir Gateway container'ı ve `openclaw mcp serve` başlatan ikinci bir istemci container'ını ayağa kaldırır, ardından yönlendirilmiş konuşma keşfini, transcript okumalarını, attachment metadata'sını, live event queue davranışını, giden send routing'ini ve gerçek stdio bridge üzerinden Claude tarzı kanal + izin bildirimlerini doğrular. Claude bildirim doğrulaması ham stdio MCP frame'lerini doğrudan okur; böylece smoke testi bridge'in gerçekten ne gönderdiğini yansıtır.

## Yerel PR gate

Yerel PR land/gate kontrolleri için şunları çalıştırın:

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Eğer `pnpm test` yoğun yüklü bir makinede kararsız davranırsa, bunu regresyon saymadan önce bir kez daha çalıştırın, sonra `pnpm test <path/to/test>` ile izole edin. Belleği sınırlı makineler için şunları kullanın:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model gecikme kıyaslaması (yerel anahtarlar)

Betik: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Kullanım:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- İsteğe bağlı ortam değişkenleri: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Varsayılan istem: “Reply with a single word: ok. No punctuation or extra text.”

Son çalıştırma (2025-12-31, 20 çalıştırma):

- minimax medyan 1279ms (en düşük 1114, en yüksek 2431)
- opus medyan 2454ms (en düşük 1224, en yüksek 3170)

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
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Ön ayarlar:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: her iki ön ayar

Çıktı; her komut için `sampleCount`, ortalama, p50, p95, min/max, exit-code/signal dağılımı ve en yüksek RSS özetlerini içerir. İsteğe bağlı `--cpu-prof-dir` / `--heap-prof-dir`, çalıştırma başına V8 profilleri yazar; böylece zamanlama ve profil yakalama aynı altyapıyı kullanır.

Kaydedilmiş çıktı kuralları:

- `pnpm test:startup:bench:smoke`, hedefli smoke artifact'ını `.artifacts/cli-startup-bench-smoke.json` konumuna yazar
- `pnpm test:startup:bench:save`, `runs=5` ve `warmup=1` kullanarak tam paket artifact'ını `.artifacts/cli-startup-bench-all.json` konumuna yazar
- `pnpm test:startup:bench:update`, `runs=5` ve `warmup=1` kullanarak repoya kaydedilmiş baseline fixture'ı `test/fixtures/cli-startup-bench.json` konumunda yeniler

Repoya kaydedilmiş fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` ile yenileyin
- Geçerli sonuçları fixture ile `pnpm test:startup:bench:check` kullanarak karşılaştırın

## Onboarding E2E (Docker)

Docker isteğe bağlıdır; buna yalnızca container içinde onboarding smoke testleri için ihtiyaç vardır.

Temiz bir Linux container'ında tam cold-start akışı:

```bash
scripts/e2e/onboard-docker.sh
```

Bu betik, etkileşimli sihirbazı bir pseudo-tty üzerinden çalıştırır, config/workspace/session dosyalarını doğrular, ardından gateway'i başlatır ve `openclaw health` çalıştırır.

## QR import smoke (Docker)

`qrcode-terminal` paketinin desteklenen Docker Node çalışma zamanlarında (varsayılan Node 24, uyumlu Node 22) yüklendiğini doğrular:

```bash
pnpm test:docker:qr
```
