---
read_when:
    - Testleri çalıştırma veya düzeltme
summary: Testleri yerel olarak çalıştırma (vitest) ve force/coverage modlarını ne zaman kullanma
title: Testler
x-i18n:
    generated_at: "2026-05-06T09:30:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 794589ee8362795c949626203e8129d6a8bb1d2e5ccf9a18f0d9b4bbd347156e
    source_path: reference/test.md
    workflow: 16
---

- Tam test kiti (test paketleri, canlı, Docker): [Test Etme](/tr/help/testing)
- Güncelleme ve Plugin paketi doğrulaması: [Güncellemeleri ve Pluginleri test etme](/tr/help/testing-updates-plugins)

- `pnpm test:force`: Varsayılan denetim portunu tutan kalmış Gateway süreçlerini sonlandırır, ardından çalışan bir örnekle sunucu testleri çakışmasın diye tam Vitest paketini yalıtılmış bir Gateway portuyla çalıştırır. Önceki bir Gateway çalıştırması port 18789’u dolu bıraktığında bunu kullanın.
- `pnpm test:docker:mcp-channels`: Tohumlanmış bir Gateway kapsayıcısı ve `openclaw mcp serve` başlatan ikinci bir istemci kapsayıcısı başlatır; ardından yönlendirilmiş konuşma keşfini, transkript okumalarını, ek meta verilerini, canlı olay kuyruğu davranışını, dışa giden gönderim yönlendirmesini ve gerçek stdio köprüsü üzerinden Claude tarzı kanal + izin bildirimlerini doğrular. Claude bildirim doğrulaması, ham stdio MCP çerçevelerini doğrudan okur; böylece smoke, köprünün gerçekte ne yaydığını yansıtır.
- `pnpm test:docker:upgrade-survivor`: Paketlenmiş OpenClaw tarball'ını kirli bir eski kullanıcı fikstürünün üzerine kurar, canlı sağlayıcı veya kanal anahtarları olmadan paket güncellemesini ve etkileşimsiz doctor'ı çalıştırır, ardından bir loopback Gateway başlatır ve aracıların, kanal yapılandırmasının, Plugin izin listelerinin, çalışma alanı/oturum dosyalarının, eski kalmış legacy Plugin bağımlılık durumunun, başlatmanın ve RPC durumunun korunduğunu denetler.
- `pnpm test:docker:published-upgrade-survivor`: Varsayılan olarak `openclaw@latest` kurar, canlı sağlayıcı veya kanal anahtarları olmadan gerçekçi mevcut kullanıcı dosyalarını tohumlar, bu temel durumu yerleşik bir `openclaw config set` komut tarifiyle yapılandırır, yayımlanmış kurulumu paketlenmiş OpenClaw tarball'ına günceller, etkileşimsiz doctor çalıştırır, `.artifacts/upgrade-survivor/summary.json` yazar, ardından bir loopback Gateway başlatır ve yapılandırılmış amaçların, çalışma alanı/oturum dosyalarının, eski kalmış Plugin yapılandırmasının ve legacy bağımlılık durumunun, başlatmanın, `/healthz`, `/readyz` ve RPC durumunun korunduğunu veya temiz biçimde onarıldığını denetler. Tek bir temel durumu `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ile geçersiz kılın, `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` gibi `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ile tam bir yerel matrisi genişletin veya `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` ile senaryo fikstürleri ekleyin; reported-issues kümesi, yapılandırılmış harici OpenClaw Plugin'lerinin yükseltme sırasında otomatik olarak kurulduğunu doğrulamak için `configured-plugin-installs` ve yalnızca kaynak Plugin gölgelerinin başlatmayı bozmasını önlemek için `stale-source-plugin-shadow` içerir. Package Acceptance bunları `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` ve `published_upgrade_survivor_scenarios` olarak sunar ve Docker hatlarına tam paket belirtimlerini vermeden önce `last-stable-4` veya `all-since-2026.4.23` gibi meta temel durum belirteçlerini çözer.
- `pnpm test:docker:update-migration`: Varsayılan olarak `openclaw@2026.4.23` ile başlayarak, published-upgrade survivor donanımını yoğun temizlik gerektiren `plugin-deps-cleanup` senaryosunda çalıştırır. Ayrı `Update Migration` iş akışı, bu hattı `baselines=all-since-2026.4.23` ile genişletir; böylece `.23` ve sonrasındaki her kararlı yayımlanmış paket adaya güncellenir ve yapılandırılmış Plugin bağımlılığı temizliğini Full Release CI dışında kanıtlar.
- `pnpm test:docker:plugins`: Yerel yol, `file:`, hoist edilmiş bağımlılıklara sahip npm kayıt paketleri, git hareketli ref'leri, ClawHub fikstürleri, marketplace güncellemeleri ve Claude paketini etkinleştirme/inceleme için kurulum/güncelleme smoke'unu çalıştırır.

## Yerel PR geçidi

Yerel PR land/gate denetimleri için şunu çalıştırın:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` yüklü bir host üzerinde kesintili hata verirse, bunu bir regresyon olarak değerlendirmeden önce bir kez yeniden çalıştırın, ardından `pnpm test <path/to/test>` ile izole edin. Belleği kısıtlı host'lar için şunu kullanın:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model gecikme kıyaslaması (yerel anahtarlar)

Betik: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Kullanım:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- İsteğe bağlı ortam değişkenleri: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Varsayılan prompt: "Tek bir sözcükle yanıt ver: ok. Noktalama işareti veya fazladan metin yok."

Son çalıştırma (2025-12-31, 20 çalıştırma):

- minimax medyan 1279 ms (min 1114, maks 2431)
- opus medyan 2454 ms (min 1224, maks 3170)

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
- `all`: iki ön ayar da

Çıktı, her komut için `sampleCount`, ortalama, p50, p95, min/maks, çıkış kodu/sinyal dağılımı ve maks RSS özetlerini içerir. İsteğe bağlı `--cpu-prof-dir` / `--heap-prof-dir`, zamanlama ve profil yakalamanın aynı harness'i kullanması için her çalıştırma başına V8 profilleri yazar.

Kaydedilmiş çıktı kuralları:

- `pnpm test:startup:bench:smoke`, hedefli smoke artifact'ini `.artifacts/cli-startup-bench-smoke.json` konumuna yazar
- `pnpm test:startup:bench:save`, `runs=5` ve `warmup=1` kullanarak tam suite artifact'ini `.artifacts/cli-startup-bench-all.json` konumuna yazar
- `pnpm test:startup:bench:update`, `runs=5` ve `warmup=1` kullanarak depoya işlenmiş baseline fixture'ını `test/fixtures/cli-startup-bench.json` konumunda yeniler

Depoya işlenmiş fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` ile yenileyin
- Geçerli sonuçları fixture ile `pnpm test:startup:bench:check` kullanarak karşılaştırın

## Onboarding E2E (Docker)

Docker isteğe bağlıdır; bu yalnızca container içinde çalışan onboarding smoke testleri için gerekir.

Temiz bir Linux container'ında tam cold-start akışı:

```bash
scripts/e2e/onboard-docker.sh
```

Bu betik etkileşimli sihirbazı bir pseudo-tty üzerinden yürütür, config/workspace/session dosyalarını doğrular, ardından Gateway'i başlatır ve `openclaw health` çalıştırır.

## QR içe aktarma smoke testi (Docker)

Bakımı yapılan QR runtime yardımcısının desteklenen Docker Node runtime'ları altında yüklendiğinden emin olur (Node 24 varsayılan, Node 22 uyumlu):

```bash
pnpm test:docker:qr
```

## İlgili

- [Test Etme](/tr/help/testing)
- [Canlı test etme](/tr/help/testing-live)
- [Güncellemeleri ve Plugin'leri test etme](/tr/help/testing-updates-plugins)
