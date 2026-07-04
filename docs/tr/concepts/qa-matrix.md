---
read_when:
    - pnpm openclaw qa matrix komutunu yerel olarak çalıştırma
    - Matrix QA senaryoları ekleme veya seçme
    - Matrix QA hatalarını, zaman aşımlarını veya takılmış temizliği triyaj etme
summary: 'OpenClaw dokümanları i18n girdisi: Docker destekli Matrix canlı QA hattı için bakımcı başvurusu: CLI, profiller, ortam değişkenleri, senaryolar ve çıktı yapıtları.'
title: OpenClaw belgeleri i18n girdisi
x-i18n:
    generated_at: "2026-07-04T20:40:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4f7fd98b5e7fef7a30c8820c5a1fc48c199e4d09db34255e8b2287a047b339f
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA kulvarı, birlikte gelen `@openclaw/matrix` Plugin paketini Docker'da tek kullanımlık bir Tuwunel homeserver'a karşı, geçici driver, SUT ve observer hesapları ile önceden doldurulmuş odalar kullanarak çalıştırır. Bu, Matrix için canlı, gerçek taşıma kapsamıdır.

Bu yalnızca bakımcı araçlamasıdır. Paketlenmiş OpenClaw sürümleri bilerek `qa-lab` içermez; bu nedenle `openclaw qa` yalnızca bir kaynak çalışma kopyasından kullanılabilir. Kaynak çalışma kopyaları birlikte gelen çalıştırıcıyı doğrudan yükler; Plugin kurulum adımı gerekmez.

Daha geniş QA çerçevesi bağlamı için bkz. [QA genel bakışı](/tr/concepts/qa-e2e-automation).

## Hızlı başlangıç

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Düz `pnpm openclaw qa matrix`, `--profile all` çalıştırır ve ilk hatada durmaz. Bir sürüm kapısı için `--profile fast --fail-fast` kullanın; tam envanteri paralel çalıştırırken kataloğu `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` ile shard'lara ayırın.

## Kulvarın yaptıkları

1. Sınırlı, redaksiyon yapan bir istek/yanıt kaydedicisinin arkasında Docker'da tek kullanımlık bir Tuwunel homeserver (varsayılan imaj `ghcr.io/matrix-construct/tuwunel:v1.5.1`, sunucu adı `matrix-qa.test`, port `28008`) hazırlar.
2. Üç geçici kullanıcı kaydeder: `driver` (gelen trafiği gönderir), `sut` (test edilen OpenClaw Matrix hesabı), `observer` (üçüncü taraf trafik yakalama).
3. Seçilen senaryoların gerektirdiği odaları önceden doldurur (ana, threading, medya, yeniden başlatma, ikincil, allowlist, E2EE, doğrulama DM'si vb.).
4. Kaydedilen Tuwunel sınırına karşı taşıma katmanından bağımsız `matrix-qa-v1` protokol yoklamasını çalıştırır. Birim testleri, Matrix protokol fixture'ı ile yoklama sözleşmesini kanıtlar; [#99707](https://github.com/openclaw/openclaw/pull/99707) içindeki kanonik QA taşıma bağdaştırıcısı ana makinesi gerçek Crabline hedef bağlamasını sahiplenir.
5. SUT hesabına kapsamlanmış gerçek Matrix Plugin'i ile bir alt OpenClaw Gateway başlatır; `qa-channel` alt süreçte yüklenmez.
6. Senaryoları sırayla çalıştırır, driver/observer Matrix istemcileri üzerinden olayları gözlemler ve kaydedilen trafikten rota/durum beklentilerini türetir.
7. Homeserver'ı kapatır, rapor ve kanıt artefaktlarını yazar, ardından çıkar.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Yaygın bayraklar

| Bayrak                | Varsayılan                                   | Açıklama                                                                                                                                       |
| --------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                        | Senaryo profili. Bkz. [Profiller](#profiles).                                                                                                  |
| `--fail-fast`         | kapalı                                       | İlk başarısız kontrolden veya senaryodan sonra dur.                                                                                            |
| `--scenario <id>`     | -                                            | Yalnızca bu senaryoyu çalıştır. Tekrarlanabilir. Bkz. [Senaryolar](#scenarios).                                                                |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Raporların, özetin, rota/durum envanterinin, gözlemlenen olayların ve çıktı günlüğünün yazıldığı yer. Göreli yollar `--repo-root` temel alınarak çözümlenir. |
| `--repo-root <path>`  | `process.cwd()`                              | Nötr bir çalışma dizininden çağırırken depo kökü.                                                                                              |
| `--sut-account <id>`  | `sut`                                        | QA Gateway yapılandırması içindeki Matrix hesap id'si.                                                                                         |

### Sağlayıcı bayrakları

Kulvar gerçek bir Matrix taşıması kullanır, ancak model sağlayıcısı yapılandırılabilir:

| Bayrak                   | Varsayılan      | Açıklama                                                                                                                                   |
| ------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `--provider-mode <mode>` | `live-frontier` | Deterministik mock dispatch için `mock-openai` veya canlı frontier sağlayıcıları için `live-frontier`. Eski alias `live-openai` hâlâ çalışır. |
| `--model <ref>`          | sağlayıcı varsayılanı | Birincil `provider/model` ref'i.                                                                                                           |
| `--alt-model <ref>`      | sağlayıcı varsayılanı | Senaryoların çalıştırma ortasında değiştirdiği alternatif `provider/model` ref'i.                                                          |
| `--fast`                 | kapalı          | Desteklendiği yerlerde sağlayıcı hızlı modunu etkinleştir.                                                                                 |

Matrix QA, `--credential-source` veya `--credential-role` kabul etmez. Kulvar tek kullanımlık kullanıcıları yerel olarak hazırlar; kiralanacak paylaşılan bir kimlik bilgisi havuzu yoktur.

## Profiller

Seçilen profil hangi senaryoların çalışacağını belirler.

| Profil          | Kullanım amacı                                                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (varsayılan) | Tam katalog. Yavaş ama kapsamlı.                                                                                                                                                                                                   |
| `fast`          | Canlı taşıma sözleşmesini çalıştıran sürüm kapısı alt kümesi: canary, mention gating, allowlist engeli, yanıt şekli, yeniden başlatma sonrası sürdürme, thread takibi, thread izolasyonu, reaction gözlemi ve exec onay metadata teslimi. |
| `transport`     | Taşıma düzeyinde threading, DM, oda, otomatik katılma, mention/allowlist, onay ve reaction senaryoları.                                                                                                                              |
| `media`         | Görsel, ses, video, PDF, EPUB ek kapsamı.                                                                                                                                                                                           |
| `e2ee-smoke`    | Asgari E2EE kapsamı: temel şifreli yanıt, thread takibi, bootstrap başarısı.                                                                                                                                                         |
| `e2ee-deep`     | Kapsamlı E2EE durum kaybı, yedekleme, anahtar ve kurtarma senaryoları.                                                                                                                                                               |
| `e2ee-cli`      | QA harness üzerinden yürütülen `openclaw matrix encryption setup` ve `verify *` CLI senaryoları.                                                                                                                                     |

Tam eşleme `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` içinde yer alır.

## Senaryolar

Tam senaryo id listesi, `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` içindeki `MatrixQaScenarioId` union'ıdır. Kategoriler şunları içerir:

- threading - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- üst düzey / DM / oda - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming ve araç ilerlemesi - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- medya - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- yönlendirme - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reactions - `matrix-reaction-*`
- onaylar - `matrix-approval-*` (exec/Plugin metadata, parçalı fallback, reddetme reactions, threads ve `target: "both"` yönlendirmesi)
- yeniden başlatma ve yeniden oynatma - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- mention gating, bottan bota ve allowlist'ler - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (temel yanıt, thread takibi, bootstrap, kurtarma anahtarı yaşam döngüsü, durum kaybı varyantları, sunucu yedekleme davranışı, cihaz hijyeni, SAS / QR / DM doğrulama, yeniden başlatma, artefakt redaksiyonu)
- E2EE CLI - `matrix-e2ee-cli-*` (şifreleme kurulumu, idempotent kurulum, bootstrap hatası, kurtarma anahtarı yaşam döngüsü, çok hesaplı, gateway yanıtı gidiş dönüşü, kendini doğrulama)

Elle seçilmiş bir küme çalıştırmak için `--scenario <id>` (tekrarlanabilir) geçirin; profil kısıtlamasını yok saymak için `--profile all` ile birleştirin.

## Ortam değişkenleri

| Değişken                                | Varsayılan                                 | Etki                                                                                                                                                                                               |
| --------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 dk)                          | Tüm çalıştırma için kesin üst sınır.                                                                                                                                                               |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                    | İlk kanarya yanıtı için sınır. Yayın CI, paylaşılan runner'larda bunu yükseltir; böylece yavaş bir ilk gateway turu, senaryo kapsamı başlamadan önce hata vermez.                                  |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                     | Negatif yanıtsızlık doğrulamaları için sessiz pencere. Çalıştırma zaman aşımına `≤` olacak şekilde sınırlandırılır.                                                                                |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                    | Docker kapatma işlemi için sınır. Hata çıktıları, kurtarma `docker compose ... down --remove-orphans` komutunu içerir.                                                                             |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1`  | Farklı bir Tuwunel sürümüne karşı doğrulama yaparken homeserver imajını geçersiz kılar.                                                                                                            |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | açık                                       | `0`, stderr üzerindeki `[matrix-qa] ...` ilerleme satırlarını susturur. `1` bunları zorla açar.                                                                                                     |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | redakte edilmiş                            | `1`, mesaj gövdesini ve `formatted_body` alanını `matrix-qa-observed-events.json` içinde tutar. Varsayılan, CI yapıtlarını güvenli tutmak için redakte eder.                                       |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | kapalı                                     | `1`, yapıt yazımından sonra belirleyici `process.exit` çağrısını atlar. Varsayılan çıkışı zorlar çünkü matrix-js-sdk'nin yerel kripto tanıtıcıları, yapıt tamamlandıktan sonra olay döngüsünü canlı tutabilir. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | ayarlanmamış                               | Bir dış başlatıcı (örn. `scripts/run-node.mjs`) tarafından ayarlandığında, Matrix QA kendi tee işlemini başlatmak yerine o günlük yolunu yeniden kullanır.                                         |

## Çıktı yapıtları

`--output-dir` içine yazılır:

- `matrix-qa-report.md` - Markdown protokol raporu (nelerin geçtiği, başarısız olduğu, atlandığı ve nedenleri).
- `matrix-qa-summary.json` - CI ayrıştırması ve panolar için uygun yapılandırılmış özet.
- `matrix-qa-route-state-manifest.json` - Senaryo kimliğine göre anahtarlanan dinamik `matrix-qa-v1` envanteri. O çalıştırma sırasında gözlenen redakte edilmiş rota/gövde şekillerini, istek sıralamasını, gözlenen yeniden denemeleri, hataları, sync-token sürekliliğini ve cihaz/anahtar/medya/yedekleme durum ailelerini kaydeder. Bu, çalıştırılabilir kanıttır; depoya işlenen bir baseline değildir.
- `matrix-qa-observed-events.json` - Sürücü ve gözlemci istemcilerinden gözlenen Matrix olayları. `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` olmadığı sürece gövdeler redakte edilir; onay metadata'sı seçili güvenli alanlarla ve kısaltılmış komut önizlemesiyle özetlenir.
- `matrix-qa-output.log` - Çalıştırmadan gelen birleştirilmiş stdout/stderr. `OPENCLAW_RUN_NODE_OUTPUT_LOG` ayarlanmışsa bunun yerine dış başlatıcının günlüğü yeniden kullanılır.

Varsayılan çıktı dizini `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` olur; böylece ardışık çalıştırmalar birbirinin üzerine yazmaz.

## Triyaj ipuçları

- **Çalıştırma sona yakın takılıyor:** `matrix-js-sdk` yerel kripto tanıtıcıları harness'tan daha uzun yaşayabilir. Varsayılan, yapıt yazımından sonra temiz bir `process.exit` çağrısını zorlar; `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` ayarını kaldırdıysanız sürecin bir süre daha kalmasını bekleyin.
- **Temizleme hatası:** yazdırılan kurtarma komutunu (`docker compose ... down --remove-orphans` çağrısı) bulun ve homeserver portunu serbest bırakmak için el ile çalıştırın.
- **CI'da değişken negatif doğrulama pencereleri:** CI hızlıyken `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` değerini düşürün (varsayılan 8 sn); yavaş paylaşılan runner'larda yükseltin.
- **Bir hata raporu için redakte edilmiş gövdeler gerekiyor:** `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` ile yeniden çalıştırın ve `matrix-qa-observed-events.json` dosyasını ekleyin. Ortaya çıkan yapıtı hassas kabul edin.
- **Farklı Tuwunel sürümü:** `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` değerini test edilen sürüme yönlendirin. Lane yalnızca sabitlenmiş varsayılan imajı kontrol eder.

## Canlı transport sözleşmesi

Matrix, [QA genel bakış → Canlı transport kapsamı](/tr/concepts/qa-e2e-automation#live-transport-coverage) içinde tanımlanan tek bir sözleşme kontrol listesini paylaşan üç canlı transport lane'inden biridir (Matrix, Telegram, Discord). `qa-channel` geniş sentetik suite olarak kalır ve bilinçli olarak bu matrisin parçası değildir.

## İlgili

- [QA genel bakış](/tr/concepts/qa-e2e-automation) - genel QA yığını ve canlı transport sözleşmesi
- [QA Channel](/tr/channels/qa-channel) - depo destekli senaryolar için sentetik kanal adaptörü
- [Test Etme](/tr/help/testing) - testleri çalıştırma ve QA kapsamı ekleme
- [Matrix](/tr/channels/matrix) - test edilen kanal Plugin'i
