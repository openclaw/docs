---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerektiğinde
    - Başarısız GitHub Actions kontrollerinde hata ayıklarken
summary: CI iş grafiği, kapsam geçitleri ve yerel komut eşdeğerleri
title: CI Ardışık Düzeni
x-i18n:
    generated_at: "2026-04-05T13:47:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a95b6e584b4309bc249866ea436b4dfe30e0298ab8916eadbc344edae3d1194
    source_path: ci.md
    workflow: 15
---

# CI Ardışık Düzeni

CI, `main` dalına yapılan her push işleminde ve her pull request'te çalışır. Yalnızca ilgisiz alanlar değiştiğinde pahalı işleri atlamak için akıllı kapsam belirleme kullanır.

## İş Genel Bakışı

| İş                       | Amaç                                                                                       | Ne zaman çalışır                      |
| ------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------- |
| `preflight`              | Yalnızca dokümantasyon değişikliklerini, değişen kapsamları, değişen eklentileri tespit etmek ve CI manifestini oluşturmak | Taslak olmayan push ve PR'lerde her zaman |
| `security-fast`          | Özel anahtar tespiti, `zizmor` ile workflow denetimi, üretim bağımlılığı denetimi         | Taslak olmayan push ve PR'lerde her zaman |
| `build-artifacts`        | `dist/` ve Control UI'ı bir kez derlemek, alt işler için yeniden kullanılabilir artifact'ları yüklemek | Node ile ilgili değişiklikler         |
| `checks-fast-core`       | Paketlenmiş/eklenti-sözleşmesi/protokol denetimleri gibi hızlı Linux doğruluk yolları      | Node ile ilgili değişiklikler         |
| `checks-fast-extensions` | `checks-fast-extensions-shard` tamamlandıktan sonra eklenti shard yollarını toplamak       | Node ile ilgili değişiklikler         |
| `extension-fast`         | Yalnızca değişen paketlenmiş eklentiler için odaklı testler                                | Eklenti değişiklikleri tespit edildiğinde |
| `check`                  | CI'daki ana yerel geçit: `pnpm check` ve `pnpm build:strict-smoke`                         | Node ile ilgili değişiklikler         |
| `check-additional`       | Mimari ve sınır korumaları ile gateway watch regresyon düzeneği                            | Node ile ilgili değişiklikler         |
| `build-smoke`            | Derlenmiş CLI smoke testleri ve başlangıç bellek smoke testi                              | Node ile ilgili değişiklikler         |
| `checks`                 | Daha ağır Linux Node yolları: tam testler, kanal testleri ve yalnızca push için Node 22 uyumluluğu | Node ile ilgili değişiklikler         |
| `check-docs`             | Dokümantasyon biçimlendirme, lint ve bozuk bağlantı kontrolleri                            | Dokümantasyon değiştiğinde            |
| `skills-python`          | Python destekli Skills için Ruff + pytest                                                  | Python Skill ile ilgili değişiklikler |
| `checks-windows`         | Windows'a özgü test yolları                                                                | Windows ile ilgili değişiklikler      |
| `macos-node`             | Paylaşılan derleme artifact'larını kullanan macOS TypeScript test yolu                     | macOS ile ilgili değişiklikler        |
| `macos-swift`            | macOS uygulaması için Swift lint, derleme ve testler                                       | macOS ile ilgili değişiklikler        |
| `android`                | Android derleme ve test matrisi                                                            | Android ile ilgili değişiklikler      |

## Hızlı Başarısız Olma Sırası

İşler, pahalı olanlar çalışmadan önce ucuz kontroller başarısız olacak şekilde sıralanır:

1. `preflight`, hangi yolların var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bağımsız işler değil, bu işin içindeki adımlardır.
2. `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matris işleri beklenmeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux yollarıyla çakışacak şekilde çalışır; böylece alt tüketiciler paylaşılan derleme hazır olur olmaz başlayabilir.
4. Daha ağır platform ve çalışma zamanı yolları bundan sonra yayılır: `checks-fast-core`, `checks-fast-extensions`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde yer alır ve `src/scripts/ci-changed-scope.test.ts` içindeki birim testlerle kapsanır.
Ayrı `install-smoke` workflow'u, aynı kapsam betiğini kendi `preflight` işi üzerinden yeniden kullanır. `run_install_smoke` değerini daha dar changed-smoke sinyalinden hesaplar; bu nedenle Docker/install smoke yalnızca kurulum, paketleme ve container ile ilgili değişiklikler için çalışır.

Push işlemlerinde `checks` matrisi yalnızca push için olan `compat-node22` yolunu ekler. Pull request'lerde bu yol atlanır ve matris normal test/kanal yollarına odaklı kalır.

## Çalıştırıcılar

| Çalıştırıcı                      | İşler                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, Linux kontrolleri, dokümantasyon kontrolleri, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                       |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                            |

## Yerel Eşdeğerler

```bash
pnpm check          # türler + lint + biçimlendirme
pnpm build:strict-smoke
pnpm test:gateway:watch-regression
pnpm test           # vitest testleri
pnpm test:channels
pnpm check:docs     # dokümantasyon biçimlendirme + lint + bozuk bağlantılar
pnpm build          # CI artifact/build-smoke yolları önemli olduğunda dist derle
```
