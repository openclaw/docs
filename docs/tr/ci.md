---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekiyor
    - Başarısız GitHub Actions kontrollerinde hata ayıklıyorsunuz
summary: CI iş grafiği, kapsam geçitleri ve yerel komut eşdeğerleri
title: CI Hattı
x-i18n:
    generated_at: "2026-04-09T08:49:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: d104f2510fadd674d7952aa08ad73e10f685afebea8d7f19adc1d428e2bdc908
    source_path: ci.md
    workflow: 15
---

# CI Hattı

CI, `main` dalına yapılan her push işleminde ve her pull request'te çalışır. Yalnızca ilgisiz alanlar değiştiğinde pahalı işleri atlamak için akıllı kapsamlandırma kullanır.

## İşlere Genel Bakış

| İş                       | Amaç                                                                                         | Ne zaman çalışır                     |
| ------------------------ | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`              | Yalnızca dokümantasyon değişikliklerini, değişen kapsamları, değişen uzantıları tespit eder ve CI manifestini oluşturur | Taslak olmayan push ve PR'lerde her zaman |
| `security-fast`          | Özel anahtar tespiti, `zizmor` aracılığıyla iş akışı denetimi, üretim bağımlılığı denetimi  | Taslak olmayan push ve PR'lerde her zaman |
| `build-artifacts`        | `dist/` ve Control UI'ı bir kez derler, alt işlerde yeniden kullanılacak artifact'leri yükler | Node ile ilgili değişiklikler       |
| `checks-fast-core`       | Paketlenmiş/eklenti sözleşmesi/protokol kontrolleri gibi hızlı Linux doğruluk yolları        | Node ile ilgili değişiklikler       |
| `checks-fast-extensions` | `checks-fast-extensions-shard` tamamlandıktan sonra uzantı parça yollarını toplar           | Node ile ilgili değişiklikler       |
| `extension-fast`         | Yalnızca değişen paketlenmiş eklentiler için odaklı testler                                  | Uzantı değişiklikleri tespit edildiğinde |
| `check`                  | CI içindeki ana yerel geçit: `pnpm check` artı `pnpm build:strict-smoke`                     | Node ile ilgili değişiklikler       |
| `check-additional`       | Mimari, sınır, import-cycle korumaları ve gateway watch regresyon düzeneği                   | Node ile ilgili değişiklikler       |
| `build-smoke`            | Derlenmiş CLI smoke testleri ve başlangıç belleği smoke testi                                | Node ile ilgili değişiklikler       |
| `checks`                 | Daha ağır Linux Node yolları: tam testler, kanal testleri ve yalnızca push için Node 22 uyumluluğu | Node ile ilgili değişiklikler       |
| `check-docs`             | Dokümantasyon biçimlendirme, lint ve bozuk bağlantı kontrolleri                              | Dokümanlar değiştiğinde             |
| `skills-python`          | Python tabanlı Skills için Ruff + pytest                                                     | Python Skill ile ilgili değişiklikler |
| `checks-windows`         | Windows'a özgü test yolları                                                                   | Windows ile ilgili değişiklikler    |
| `macos-node`             | Paylaşılan derlenmiş artifact'leri kullanan macOS TypeScript test yolu                       | macOS ile ilgili değişiklikler      |
| `macos-swift`            | macOS uygulaması için Swift lint, derleme ve testler                                         | macOS ile ilgili değişiklikler      |
| `android`                | Android derleme ve test matrisi                                                              | Android ile ilgili değişiklikler    |

## Hızlı Başarısız Olma Sırası

İşler, pahalı işler çalışmadan önce ucuz kontroller başarısız olacak şekilde sıralanır:

1. `preflight`, hangi yolların var olacağına en baştan karar verir. `docs-scope` ve `changed-scope` mantığı bağımsız işler değil, bu işin içindeki adımlardır.
2. `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matris işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux yollarıyla çakışacak şekilde çalışır; böylece alt tüketiciler paylaşılan derleme hazır olur olmaz başlayabilir.
4. Daha ağır platform ve çalışma zamanı yolları bundan sonra paralel açılır: `checks-fast-core`, `checks-fast-extensions`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki birim testleriyle kapsanır.
Ayrı `install-smoke` iş akışı, aynı kapsam betiğini kendi `preflight` işi üzerinden yeniden kullanır. `run_install_smoke` değerini daha dar changed-smoke sinyalinden hesaplar; bu nedenle Docker/install smoke yalnızca kurulum, paketleme ve container ile ilgili değişikliklerde çalışır.

Push işlemlerinde `checks` matrisi, yalnızca push için olan `compat-node22` yolunu ekler. Pull request'lerde bu yol atlanır ve matris normal test/kanal yollarına odaklı kalır.

## Çalıştırıcılar

| Çalıştırıcı                      | İşler                                                                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, Linux kontrolleri, doküman kontrolleri, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                     |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                          |

## Yerel Eşdeğerler

```bash
pnpm check          # türler + lint + biçimlendirme
pnpm build:strict-smoke
pnpm check:import-cycles
pnpm test:gateway:watch-regression
pnpm test           # vitest testleri
pnpm test:channels
pnpm check:docs     # doküman biçimlendirme + lint + bozuk bağlantılar
pnpm build          # CI artifact/build-smoke yolları önemli olduğunda dist derlemesi
```
