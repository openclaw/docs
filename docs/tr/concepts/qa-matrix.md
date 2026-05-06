---
read_when:
    - pnpm openclaw qa matrix komutunu yerel olarak çalıştırma
    - Matrix QA senaryoları ekleme veya seçme
    - Matrix QA hatalarını, zaman aşımlarını veya takılı kalan temizleme işlemlerini triyajlama
summary: 'Docker destekli Matrix canlı QA hattı için bakımcı referansı: CLI, profiller, ortam değişkenleri, senaryolar ve çıktı artefaktları.'
title: Matris Kalite Güvencesi
x-i18n:
    generated_at: "2026-05-06T09:10:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c6d836492368c470468547950d3765a64187694852222a5a1f0ae4185569abe
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA hattı, paketle birlikte gelen `@openclaw/matrix` Plugin'ini Docker içinde tek kullanımlık bir Tuwunel homeserver üzerinde, geçici sürücü, SUT ve gözlemci hesapları ile önceden hazırlanmış odalarla çalıştırır. Matrix için canlı, gerçek taşıma kapsamıdır.

Bu yalnızca bakımcıya yönelik araçtır. Paketlenmiş OpenClaw sürümleri bilinçli olarak `qa-lab` içermez, bu nedenle `openclaw qa` yalnızca kaynak kod checkout'undan kullanılabilir. Kaynak kod checkout'ları paketle gelen runner'ı doğrudan yükler - Plugin kurulum adımı gerekmez.

Daha geniş QA framework bağlamı için [QA genel bakışı](/tr/concepts/qa-e2e-automation) sayfasına bakın.

## Hızlı başlangıç

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Düz `pnpm openclaw qa matrix`, `--profile all` ile çalışır ve ilk hatada durmaz. Bir sürüm kapısı için `--profile fast --fail-fast` kullanın; tam envanteri paralel çalıştırırken kataloğu `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` ile parçalara ayırın.

## Hattın yaptığı işler

1. Docker içinde tek kullanımlık bir Tuwunel homeserver sağlar (varsayılan imaj `ghcr.io/matrix-construct/tuwunel:v1.5.1`, sunucu adı `matrix-qa.test`, port `28008`).
2. Üç geçici kullanıcı kaydeder - `driver` (gelen trafiği gönderir), `sut` (test edilen OpenClaw Matrix hesabı), `observer` (üçüncü taraf trafik yakalama).
3. Seçilen senaryoların gerektirdiği odaları hazırlar (ana, iş parçacığı, medya, yeniden başlatma, ikincil, allowlist, E2EE, doğrulama DM'i vb.).
4. SUT hesabıyla sınırlandırılmış gerçek Matrix Plugin'i ile bir alt OpenClaw Gateway başlatır; `qa-channel` alt süreçte yüklenmez.
5. Senaryoları sırayla çalıştırır ve olayları sürücü/gözlemci Matrix istemcileri üzerinden gözlemler.
6. Homeserver'ı kapatır, rapor ve özet artefaktlarını yazar, ardından çıkar.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Yaygın bayraklar

| Bayrak                | Varsayılan                                   | Açıklama                                                                                                                  |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Senaryo profili. Bkz. [Profiller](#profiles).                                                                            |
| `--fail-fast`         | kapalı                                        | İlk başarısız kontrolden veya senaryodan sonra dur.                                                                       |
| `--scenario <id>`     | -                                             | Yalnızca bu senaryoyu çalıştır. Tekrarlanabilir. Bkz. [Senaryolar](#scenarios).                                           |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Raporların, özetin, gözlemlenen olayların ve çıktı günlüğünün yazıldığı yer. Göreli yollar `--repo-root` temel alınarak çözülür. |
| `--repo-root <path>`  | `process.cwd()`                               | Tarafsız bir çalışma dizininden çağırırken depo kökü.                                                                     |
| `--sut-account <id>`  | `sut`                                         | QA Gateway yapılandırması içindeki Matrix hesap kimliği.                                                                  |

### Sağlayıcı bayrakları

Hat gerçek bir Matrix taşıması kullanır, ancak model sağlayıcısı yapılandırılabilir:

| Bayrak                   | Varsayılan        | Açıklama                                                                                                                                     |
| ------------------------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | Belirleyici mock gönderimi için `mock-openai` veya canlı frontier sağlayıcıları için `live-frontier`. Eski takma ad `live-openai` hâlâ çalışır. |
| `--model <ref>`          | sağlayıcı varsayılanı | Birincil `provider/model` ref'i.                                                                                                             |
| `--alt-model <ref>`      | sağlayıcı varsayılanı | Senaryolar çalışmanın ortasında geçiş yaptığında kullanılan alternatif `provider/model` ref'i.                                                |
| `--fast`                 | kapalı           | Desteklendiği yerlerde sağlayıcı hızlı modunu etkinleştir.                                                                                   |

Matrix QA, `--credential-source` veya `--credential-role` kabul etmez. Hat, tek kullanımlık kullanıcıları yerel olarak sağlar; kiralanacak paylaşımlı bir kimlik bilgisi havuzu yoktur.

## Profiller

Seçilen profil hangi senaryoların çalışacağını belirler.

| Profil          | Kullanım amacı                                                                                                                                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (varsayılan) | Tam katalog. Yavaş ama kapsamlı.                                                                                                                                                                                                  |
| `fast`          | Canlı taşıma sözleşmesini sınayan sürüm kapısı alt kümesi: canary, mention geçitleme, allowlist engeli, yanıt şekli, yeniden başlatma sonrası sürdürme, iş parçacığı takibi, iş parçacığı yalıtımı, tepki gözlemi ve exec onayı meta veri teslimi. |
| `transport`     | Taşıma düzeyinde iş parçacığı, DM, oda, otomatik katılım, mention/allowlist, onay ve tepki senaryoları.                                                                                                                           |
| `media`         | Görsel, ses, video, PDF, EPUB ek kapsamı.                                                                                                                                                                                         |
| `e2ee-smoke`    | Asgari E2EE kapsamı - temel şifreli yanıt, iş parçacığı takibi, bootstrap başarısı.                                                                                                                                               |
| `e2ee-deep`     | Kapsamlı E2EE durum kaybı, yedekleme, anahtar ve kurtarma senaryoları.                                                                                                                                                            |
| `e2ee-cli`      | QA harness üzerinden yürütülen `openclaw matrix encryption setup` ve `verify *` CLI senaryoları.                                                                                                                                  |

Kesin eşleme `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` içinde yer alır.

## Senaryolar

Tam senaryo kimliği listesi, `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` içindeki `MatrixQaScenarioId` union'ıdır. Kategoriler şunları içerir:

- iş parçacığı - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- üst düzey / DM / oda - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- akış ve araç ilerlemesi - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- medya - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- yönlendirme - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- tepkiler - `matrix-reaction-*`
- onaylar - `matrix-approval-*` (exec/Plugin meta verileri, parçalı fallback, reddetme tepkileri, iş parçacıkları ve `target: "both"` yönlendirmesi)
- yeniden başlatma ve yeniden oynatma - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- mention geçitleme, bot-bota ve allowlist'ler - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (temel yanıt, iş parçacığı takibi, bootstrap, kurtarma anahtarı yaşam döngüsü, durum kaybı varyantları, sunucu yedekleme davranışı, cihaz hijyeni, SAS / QR / DM doğrulaması, yeniden başlatma, artefakt redaksiyonu)
- E2EE CLI - `matrix-e2ee-cli-*` (şifreleme kurulumu, idempotent kurulum, bootstrap hatası, kurtarma anahtarı yaşam döngüsü, çoklu hesap, gateway-reply gidiş dönüşü, öz doğrulama)

Elle seçilmiş bir kümeyi çalıştırmak için `--scenario <id>` (tekrarlanabilir) iletin; profil geçitlemesini yok saymak için `--profile all` ile birleştirin.

## Ortam değişkenleri

| Değişken                                | Varsayılan                                | Etki                                                                                                                                                                                            |
| --------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 dk)                         | Tüm çalıştırma için kesin üst sınır.                                                                                                                                                            |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | İlk kanarya yanıtı için sınır. Release CI, paylaşılan runner’larda bunu artırır; böylece yavaş bir ilk Gateway turu, senaryo kapsamı başlamadan önce başarısız olmaz.                          |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Negatif yanıtsızlık doğrulamaları için sessiz pencere. Çalıştırma zaman aşımına `≤` olacak şekilde sınırlandırılır.                                                                             |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker kapatma işlemi için sınır. Hata yüzeyleri, kurtarma `docker compose ... down --remove-orphans` komutunu içerir.                                                                          |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Farklı bir Tuwunel sürümüne karşı doğrulama yaparken homeserver imajını geçersiz kılın.                                                                                                         |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | açık                                      | `0`, stderr üzerindeki `[matrix-qa] ...` ilerleme satırlarını susturur. `1` bunları zorla etkinleştirir.                                                                                         |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | redakte edilmiş                           | `1`, ileti gövdesini ve `formatted_body` alanını `matrix-qa-observed-events.json` içinde tutar. Varsayılan, CI artifact’larını güvenli tutmak için redakte eder.                                |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | kapalı                                    | `1`, artifact yazımından sonra deterministik `process.exit` işlemini atlar. Varsayılan çıkışı zorlar çünkü matrix-js-sdk'nin yerel crypto handle’ları, artifact tamamlandıktan sonra event loop’u canlı tutabilir. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | ayarlanmamış                              | Dış bir başlatıcı tarafından ayarlandığında (örn. `scripts/run-node.mjs`), Matrix QA kendi tee işlemini başlatmak yerine bu günlük yolunu yeniden kullanır.                                      |

## Çıktı artifact’ları

`--output-dir` konumuna yazılır:

- `matrix-qa-report.md` - Markdown protokol raporu (nelerin geçtiği, başarısız olduğu, atlandığı ve nedenleri).
- `matrix-qa-summary.json` - CI ayrıştırması ve panolar için uygun yapılandırılmış özet.
- `matrix-qa-observed-events.json` - Sürücü ve gözlemci istemcilerinden gözlemlenen Matrix event’leri. `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` olmadığı sürece gövdeler redakte edilir; onay metadataları, seçili güvenli alanlar ve kısaltılmış komut önizlemesiyle özetlenir.
- `matrix-qa-output.log` - Çalıştırmadan gelen birleşik stdout/stderr. `OPENCLAW_RUN_NODE_OUTPUT_LOG` ayarlıysa bunun yerine dış başlatıcının günlüğü yeniden kullanılır.

Varsayılan çıktı dizini `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` olduğundan ardışık çalıştırmalar birbirinin üzerine yazmaz.

## Triage ipuçları

- **Çalıştırma sona yakın takılıyor:** `matrix-js-sdk` yerel crypto handle’ları harness’tan daha uzun süre yaşayabilir. Varsayılan, artifact yazımından sonra temiz bir `process.exit` zorlar; `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` ayarını kaldırdıysanız sürecin beklemede kalmasını bekleyin.
- **Temizleme hatası:** yazdırılan kurtarma komutunu (`docker compose ... down --remove-orphans` çağrısı) bulun ve homeserver portunu serbest bırakmak için elle çalıştırın.
- **CI’da kararsız negatif doğrulama pencereleri:** CI hızlı olduğunda `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` değerini düşürün (varsayılan 8 sn); yavaş paylaşılan runner’larda artırın.
- **Hata raporu için redakte edilmiş gövdeler gerekiyor:** `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` ile yeniden çalıştırın ve `matrix-qa-observed-events.json` dosyasını ekleyin. Oluşan artifact’ı hassas kabul edin.
- **Farklı Tuwunel sürümü:** `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` değişkenini test edilen sürüme yönlendirin. Hat yalnızca sabitlenmiş varsayılan imajı denetler.

## Canlı aktarım sözleşmesi

Matrix, [QA genel bakış → Canlı aktarım kapsamı](/tr/concepts/qa-e2e-automation#live-transport-coverage) içinde tanımlanan tek bir sözleşme kontrol listesini paylaşan üç canlı aktarım hattından biridir (Matrix, Telegram, Discord). `qa-channel` geniş sentetik paket olarak kalır ve kasıtlı olarak bu matrisin parçası değildir.

## İlgili

- [QA genel bakış](/tr/concepts/qa-e2e-automation) - genel QA yığını ve canlı aktarım sözleşmesi
- [QA Channel](/tr/channels/qa-channel) - repo destekli senaryolar için sentetik kanal bağdaştırıcısı
- [Test Etme](/tr/help/testing) - testleri çalıştırma ve QA kapsamı ekleme
- [Matrix](/tr/channels/matrix) - test edilen kanal Plugin’i
