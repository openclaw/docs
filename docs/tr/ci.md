---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekir
    - GitHub Actions denetimlerinde başarısızlıkları ayıklıyorsunuz
summary: CI iş grafiği, kapsam geçitleri ve yerel komut eşdeğerleri
title: CI Ardışık Düzeni
x-i18n:
    generated_at: "2026-04-22T04:21:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae08bad6cbd0f2eced6c88a792a11bc1c2b1a2bfb003a56f70ff328a2739d3fc
    source_path: ci.md
    workflow: 15
---

# CI Ardışık Düzeni

CI, `main` dalına her push işleminde ve her pull request’te çalışır. Yalnızca ilgisiz alanlar değiştiğinde pahalı işleri atlamak için akıllı kapsamlandırma kullanır.

## İş Genel Görünümü

| İş                               | Amaç                                                                                         | Ne zaman çalışır                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Yalnızca doküman değişikliklerini, değişen kapsamları, değişen eklentileri saptamak ve CI manifestini oluşturmak | Taslak olmayan push ve PR’lerde her zaman |
| `security-scm-fast`              | `zizmor` ile özel anahtar tespiti ve workflow denetimi                                      | Taslak olmayan push ve PR’lerde her zaman |
| `security-dependency-audit`      | npm advisory’lerine karşı bağımlılıksız üretim lockfile denetimi                            | Taslak olmayan push ve PR’lerde her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için gerekli toplu iş                                                 | Taslak olmayan push ve PR’lerde her zaman |
| `build-artifacts`                | `dist/` ve Control UI’yi bir kez derlemek, aşağı akış işleri için yeniden kullanılabilir artifact’leri yüklemek | Node ile ilgili değişiklikler      |
| `checks-fast-core`               | Paketlenmiş/plugin-contract/protocol denetimleri gibi hızlı Linux doğruluk hatları          | Node ile ilgili değişiklikler      |
| `checks-fast-contracts-channels` | Kararlı bir toplu denetim sonucu ile shard’lanmış kanal sözleşmesi denetimleri              | Node ile ilgili değişiklikler      |
| `checks-node-extensions`         | eklenti paketi genelinde paketlenmiş plugin’ler için tam test shard’ları                    | Node ile ilgili değişiklikler      |
| `checks-node-core-test`          | Kanal, paketlenmiş, sözleşme ve eklenti hatları hariç çekirdek Node test shard’ları         | Node ile ilgili değişiklikler      |
| `extension-fast`                 | Yalnızca değişen paketlenmiş plugin’ler için odaklı testler                                 | Eklenti değişiklikleri algılandığında |
| `check`                          | shard’lanmış ana yerel geçit eşdeğeri: üretim tipleri, lint, guard’lar, test tipleri ve katı smoke | Node ile ilgili değişiklikler      |
| `check-additional`               | Mimari, sınır, eklenti-yüzeyi guard’ları, paket sınırı ve gateway-watch shard’ları          | Node ile ilgili değişiklikler      |
| `build-smoke`                    | Derlenmiş CLI smoke testleri ve başlangıç belleği smoke testi                               | Node ile ilgili değişiklikler      |
| `checks`                         | Kalan Linux Node hatları: kanal testleri ve yalnızca push için Node 22 uyumluluğu           | Node ile ilgili değişiklikler      |
| `check-docs`                     | Doküman biçimlendirme, lint ve bozuk bağlantı denetimleri                                   | Dokümanlar değiştiğinde            |
| `skills-python`                  | Python destekli Skills için Ruff + pytest                                                   | Python-Skills ile ilgili değişiklikler |
| `checks-windows`                 | Windows’a özgü test hatları                                                                  | Windows ile ilgili değişiklikler   |
| `macos-node`                     | Paylaşılan derlenmiş artifact’leri kullanan macOS TypeScript test hattı                     | macOS ile ilgili değişiklikler     |
| `macos-swift`                    | macOS uygulaması için Swift lint, build ve testler                                          | macOS ile ilgili değişiklikler     |
| `android`                        | Android build ve test matrisi                                                               | Android ile ilgili değişiklikler   |

## Fail-Fast sırası

İşler, pahalı işler çalışmadan önce ucuz denetimlerin başarısız olacağı şekilde sıralanır:

1. `preflight`, hangi hatların var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bağımsız işler değil, bu işin içindeki adımlardır.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matrisi işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux hatlarıyla örtüşür; böylece aşağı akış tüketicileri paylaşılan build hazır olur olmaz başlayabilir.
4. Daha ağır platform ve çalışma zamanı hatları bundan sonra fan-out yapar: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde yaşar ve `src/scripts/ci-changed-scope.test.ts` içindeki birim testleriyle kapsanır.
Ayrı `install-smoke` workflow, aynı kapsam betiğini kendi `preflight` işi üzerinden yeniden kullanır. `run_install_smoke` değerini daha dar changed-smoke sinyalinden hesaplar; bu nedenle Docker/install smoke yalnızca kurulum, paketleme ve kapsayıcıyla ilgili değişikliklerde çalışır.

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde yaşar ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel geçit, geniş CI platform kapsamına göre mimari sınırlar konusunda daha katıdır: çekirdek üretim değişiklikleri çekirdek üretim typecheck ile birlikte çekirdek testlerini çalıştırır, yalnızca çekirdek test değişiklikleri sadece çekirdek test typecheck/testlerini çalıştırır, eklenti üretim değişiklikleri eklenti üretim typecheck ile birlikte eklenti testlerini çalıştırır ve yalnızca eklenti test değişiklikleri sadece eklenti test typecheck/testlerini çalıştırır. Public Plugin SDK veya plugin-contract değişiklikleri, eklentiler bu çekirdek sözleşmelere bağımlı olduğu için eklenti doğrulamasını genişletir. Yalnızca release metadata sürüm artışları hedeflenmiş sürüm/yapılandırma/kök-bağımlılık denetimlerini çalıştırır. Bilinmeyen kök/yapılandırma değişiklikleri güvenli tarafta kalıp tüm hatlara gider.

Push işlemlerinde `checks` matrisi yalnızca push için olan `compat-node22` hattını ekler. Pull request’lerde bu hat atlanır ve matris normal test/kanal hatlarına odaklı kalır.

En yavaş Node test aileleri, her iş küçük kalsın diye include-file shard’larına bölünür: kanal sözleşmeleri registry ve çekirdek kapsamını sekizer ağırlıklı shard’a böler, auto-reply reply command testleri dörder include-pattern shard’a ayrılır ve diğer büyük auto-reply reply prefix grupları ikişer shard’a bölünür. `check-additional` ayrıca paket sınırı compile/canary işlerini çalışma zamanı topolojisi gateway/mimari işlerinden ayırır.

Aynı PR veya `main` ref’i üzerine daha yeni bir push geldiğinde GitHub, yerini almış işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalışma da başarısız değilse bunu CI gürültüsü olarak değerlendirin. Toplu shard denetimleri bu iptal durumunu açıkça belirtir; böylece bunu bir test başarısızlığından ayırmak daha kolay olur.

## Runner’lar

| Runner                           | İşler                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, Linux denetimleri, doküman denetimleri, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-node`, `macos-swift`; fork’lar `macos-latest` değerine geri döner                                              |

## Yerel eşdeğerler

```bash
pnpm changed:lanes   # origin/main...HEAD için yerel changed-lane sınıflandırıcısını inceleyin
pnpm check:changed   # akıllı yerel geçit: sınır hattına göre değişen typecheck/lint/testler
pnpm check          # hızlı yerel geçit: production tsgo + shard’lanmış lint + paralel hızlı guard’lar
pnpm check:test-types
pnpm check:timed    # aynı geçit, aşama başına zamanlamalarla
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest testleri
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # doküman biçimlendirme + lint + bozuk bağlantılar
pnpm build          # CI artifact/build-smoke hatları önemliyse dist derlemesi
```
