---
read_when:
    - Bir CI işinin neden çalıştığını veya neden çalışmadığını anlamanız gerekir
    - Başarısız GitHub Actions kontrollerinde hata ayıklıyorsunuz
summary: CI iş grafiği, kapsam geçitleri ve yerel komut eşdeğerleri
title: CI Ardışık Düzeni
x-i18n:
    generated_at: "2026-04-11T02:44:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca7e355b7f73bfe8ea8c6971e78164b8b2e68cbb27966964955e267fed89fce6
    source_path: ci.md
    workflow: 15
---

# CI Ardışık Düzeni

CI, `main` dalına yapılan her push işleminde ve her pull request için çalışır. Yalnızca ilgisiz alanlar değiştiğinde pahalı işleri atlamak için akıllı kapsamlandırma kullanır.

## İş Genel Görünümü

| İş                       | Amaç                                                                                    | Ne zaman çalışır                    |
| ------------------------ | --------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`              | Yalnızca dokümantasyon değişikliklerini, değişen kapsamları, değişen extension'ları tespit eder ve CI manifest'ini oluşturur | Draft olmayan push'larda ve PR'larda her zaman |
| `security-fast`          | Özel anahtar tespiti, `zizmor` ile workflow denetimi, production bağımlılık denetimi   | Draft olmayan push'larda ve PR'larda her zaman |
| `build-artifacts`        | `dist/` ve Control UI'ı bir kez derler, sonraki işler için yeniden kullanılabilir artifact'lar yükler | Node ile ilgili değişiklikler       |
| `checks-fast-core`       | Bundled/plugin-contract/protocol kontrolleri gibi hızlı Linux doğruluk aşamaları        | Node ile ilgili değişiklikler       |
| `checks-node-extensions` | Extension paketi genelinde tam bundled-plugin test shard'ları                           | Node ile ilgili değişiklikler       |
| `checks-node-core-test`  | Kanal, bundled, contract ve extension aşamaları hariç olmak üzere çekirdek Node test shard'ları | Node ile ilgili değişiklikler       |
| `extension-fast`         | Yalnızca değişen bundled plugin'ler için odaklı testler                                | Extension değişiklikleri tespit edildiğinde |
| `check`                  | CI'daki ana yerel geçit: `pnpm check` artı `pnpm build:strict-smoke`                   | Node ile ilgili değişiklikler       |
| `check-additional`       | Mimari, sınır, import-cycle korumaları ve gateway watch regression harness             | Node ile ilgili değişiklikler       |
| `build-smoke`            | Derlenmiş CLI smoke testleri ve başlangıç bellek smoke testleri                        | Node ile ilgili değişiklikler       |
| `checks`                 | Kalan Linux Node aşamaları: kanal testleri ve yalnızca push için Node 22 uyumluluğu   | Node ile ilgili değişiklikler       |
| `check-docs`             | Doküman biçimlendirme, lint ve bozuk bağlantı kontrolleri                              | Dokümanlar değiştiğinde             |
| `skills-python`          | Python tabanlı Skills için Ruff + pytest                                               | Python-skill ile ilgili değişiklikler |
| `checks-windows`         | Windows'a özgü test aşamaları                                                          | Windows ile ilgili değişiklikler    |
| `macos-node`             | Paylaşılan derlenmiş artifact'ları kullanan macOS TypeScript test aşaması              | macOS ile ilgili değişiklikler      |
| `macos-swift`            | macOS uygulaması için Swift lint, derleme ve testler                                   | macOS ile ilgili değişiklikler      |
| `android`                | Android build ve test matrisi                                                          | Android ile ilgili değişiklikler    |

## Fail-Fast Sıralaması

İşler, pahalı olanlar çalışmadan önce ucuz kontroller başarısız olacak şekilde sıralanır:

1. `preflight`, hangi aşamaların var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı, bağımsız işler değil, bu işin içindeki adımlardır.
2. `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matrisi işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux aşamalarıyla paralel çalışır; böylece sonraki tüketiciler paylaşılan build hazır olur olmaz başlayabilir.
4. Daha ağır platform ve çalışma zamanı aşamaları bundan sonra yayılır: `checks-fast-core`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki birim testlerle kapsanır.
Ayrı `install-smoke` workflow'u, kendi `preflight` işi aracılığıyla aynı kapsam betiğini yeniden kullanır. `run_install_smoke` değerini daha dar changed-smoke sinyalinden hesaplar; bu nedenle Docker/install smoke yalnızca install, packaging ve container ile ilgili değişikliklerde çalışır.

Push işlemlerinde `checks` matrisi, yalnızca push için olan `compat-node22` aşamasını ekler. Pull request'lerde bu aşama atlanır ve matris normal test/kanal aşamalarına odaklı kalır.

## Çalıştırıcılar

| Çalıştırıcı                      | İşler                                                                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, Linux kontrolleri, doküman kontrolleri, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                     |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                          |

## Yerel Eşdeğerler

```bash
pnpm check          # türler + lint + format
pnpm build:strict-smoke
pnpm check:import-cycles
pnpm test:gateway:watch-regression
pnpm test           # vitest testleri
pnpm test:channels
pnpm check:docs     # doküman formatı + lint + bozuk bağlantılar
pnpm build          # CI artifact/build-smoke aşamaları önemliyse dist derlemesi
```
