---
read_when:
    - pnpm openclaw qa matrisini yerel olarak çalıştırma
    - Matrix QA senaryoları ekleme veya seçme
    - Matrix QA hatalarını, zaman aşımlarını veya takılı kalan temizleme işlemlerini inceleme
summary: 'Docker destekli Matrix canlı QA hattı için bakımcı başvurusu: CLI, profiller, ortam değişkenleri, senaryolar ve çıktı yapıtları.'
title: Matrix Kalite Güvencesi
x-i18n:
    generated_at: "2026-07-12T12:16:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8034570f5a52619c88bee1f6708bd710744d3cb52a1eb82726aa118844045ef
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA hattı, paketle birlikte gelen `@openclaw/matrix` Plugin'ini Docker'daki tek kullanımlık bir Tuwunel ana sunucusuna karşı çalıştırır; geçici sürücü, SUT ve gözlemci hesaplarının yanı sıra önceden oluşturulmuş odalar kullanır. Bu hat, Matrix için gerçek aktarımı kullanan canlı kapsamı sağlar.

Yalnızca bakım sorumlularına yönelik araçlar. Paketlenmiş OpenClaw sürümleri `qa-lab` içermez; bu nedenle `openclaw qa` yalnızca kaynak kod çalışma kopyasından çalışır ve paketle gelen çalıştırıcıyı herhangi bir Plugin yükleme adımı olmadan doğrudan yükler.

Daha geniş QA çerçevesi bağlamı için [QA genel bakışı](/tr/concepts/qa-e2e-automation) bölümüne bakın.

## Hızlı başlangıç

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Düz `pnpm openclaw qa matrix` komutu `--profile all` ile çalışır ve ilk hatada durmaz. Tam envanteri `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` ile paralel işler arasında parçalara ayırın.

## Hat ne yapar?

1. Docker'da, sınırlandırılmış ve hassas bilgileri maskeleyen bir istek/yanıt kaydedicisinin arkasında tek kullanımlık bir Tuwunel ana sunucusu oluşturur (varsayılan imaj `ghcr.io/matrix-construct/tuwunel:v1.5.1`, sunucu adı `matrix-qa.test`, bağlantı noktası `28008`).
2. Üç geçici kullanıcı kaydeder: `driver` (gelen trafiği gönderir), `sut` (test edilen OpenClaw Matrix hesabı), `observer` (üçüncü taraf trafiğini yakalar).
3. Seçilen senaryoların gerektirdiği odaları önceden oluşturur (ana, iş parçacığı, medya, yeniden başlatma, ikincil, izin listesi, E2EE, doğrulama DM'si vb.).
4. Kaydedilen Tuwunel sınırına karşı alt katmandan bağımsız `matrix-qa-v1` protokol yoklamasını çalıştırır. Birim testleri, Matrix protokol fikstürüyle yoklama sözleşmesini doğrular; [#99707](https://github.com/openclaw/openclaw/pull/99707) içindeki standart QA aktarım bağdaştırıcısı konağı, gerçek Crabline hedef bağlantılarını yönetir.
5. SUT hesabıyla sınırlandırılmış gerçek Matrix Plugin'ini kullanan bir alt OpenClaw Gateway başlatır.
6. Senaryoları sırayla çalıştırır, olayları sürücü/gözlemci Matrix istemcileri üzerinden gözlemler ve yönlendirme/durum beklentilerini kaydedilen trafikten türetir.
7. Ana sunucuyu kapatır, rapor ve kanıt yapıtlarını yazar, ardından çıkar.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Yaygın bayraklar

| Bayrak                | Varsayılan                                    | Açıklama                                                                                                                                                             |
| --------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Senaryo profili. Bkz. [Profiller](#profiles).                                                                                                                        |
| `--fail-fast`         | kapalı                                        | İlk başarısız denetimden veya senaryodan sonra durur.                                                                                                                |
| `--scenario <id>`     | -                                             | Yalnızca bu senaryoyu çalıştırır. Tekrarlanabilir. Bkz. [Senaryolar](#scenarios).                                                                                     |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Raporların, özetin, yönlendirme/durum envanterinin, gözlemlenen olayların ve çıktı günlüğünün yazıldığı konum. Göreli yollar `--repo-root` temel alınarak çözümlenir. |
| `--repo-root <path>`  | `process.cwd()`                               | Tarafsız bir çalışma dizininden çağrılırken depo kökü.                                                                                                               |
| `--sut-account <id>`  | `sut`                                         | QA Gateway yapılandırmasındaki Matrix hesap kimliği.                                                                                                                 |

### Sağlayıcı bayrakları

Hat gerçek bir Matrix aktarımı kullanır, ancak model sağlayıcısı yapılandırılabilir:

| Bayrak                   | Varsayılan          | Açıklama                                                                                                                                                                                   |
| ------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--provider-mode <mode>` | `live-frontier`     | Belirlenimsel sahte dağıtım için `mock-openai` veya canlı öncü sağlayıcılar için `live-frontier`. Eski `live-openai` takma adı çalışmaya devam eder.                                         |
| `--model <ref>`          | sağlayıcı varsayılanı | Birincil `provider/model` başvurusu.                                                                                                                                                      |
| `--alt-model <ref>`      | sağlayıcı varsayılanı | Senaryoların çalıştırma sırasında geçiş yaptığı alternatif `provider/model` başvurusu.                                                                                                    |
| `--fast`                 | kapalı              | Desteklendiği durumlarda sağlayıcının hızlı modunu etkinleştirir.                                                                                                                          |

Matrix QA, `--credential-source` veya `--credential-role` kabul etmez. Hat, tek kullanımlık kullanıcıları yerel olarak oluşturur; kiralanabilecek paylaşımlı bir kimlik bilgisi havuzu yoktur.

## Profiller

| Profil          | Kullanım amacı                                                                                                                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (varsayılan) | Tam katalog. Yavaştır ancak kapsamlıdır.                                                                                                                                                                                                        |
| `fast`          | Zorunlu canlı aktarım sözleşmesini kullanan sürüm geçidi alt kümesi: bahsetme geçidi, izin listesi engellemesi, yanıt biçimi, yeniden başlatma sonrası sürdürme, tepki gözlemi, yürütme onayı meta verilerinin teslimi ve temel E2EE yanıtı.        |
| `transport`     | Aktarım düzeyinde iş parçacığı, DM, oda, otomatik katılım, bahsetme/izin listesi, onay ve tepki senaryoları.                                                                                                                                       |
| `media`         | Görsel, ses, video, PDF ve EPUB ekleri kapsamı.                                                                                                                                                                                                   |
| `e2ee-smoke`    | Asgari E2EE kapsamı: temel şifreli yanıt, iş parçacığı takibi, başarılı önyükleme.                                                                                                                                                                 |
| `e2ee-deep`     | Kapsamlı E2EE durum kaybı, yedekleme, anahtar ve kurtarma senaryoları.                                                                                                                                                                             |
| `e2ee-cli`      | QA çalıştırma düzeneği üzerinden yürütülen `openclaw matrix encryption setup` ve `verify *` CLI senaryoları.                                                                                                                                      |

Tam eşleme `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` dosyasında bulunur.

## Senaryolar

Paylaşılan Matrix bağdaştırıcısı, aşağıdaki standart YAML senaryolarını `openclaw qa suite --channel-driver live --channel matrix` üzerinden sunar:

- `channel-chat-baseline`
- `thread-follow-up`
- `thread-isolation`
- `thread-reply-override`
- `dm-shared-session`
- `dm-per-room-session`

`subagent-thread-spawn`, açıkça `--scenario subagent-thread-spawn`
seçimiyle kullanılabilir olmaya devam eder ancak canlı alt süreç tamamlama kanıtı kararlı hâle gelene kadar varsayılan paylaşılan Matrix kümesinin parçası değildir.

Kalan zorunlu senaryo kimlikleri listesi, `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` içindeki `MatrixQaScenarioId` birleşimidir. Kategoriler:

- iş parçacığı: `matrix-thread-root-preservation`, `matrix-thread-nested-reply-shape`
- üst düzey / DM / oda: `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- akış ve araç ilerlemesi: `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- medya: `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- yönlendirme: `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- tepkiler: `matrix-reaction-*`
- onaylar: `matrix-approval-*` (yürütme/Plugin meta verileri, parçalara ayrılmış geri dönüş, reddetme tepkileri, iş parçacıkları ve `target: "both"` yönlendirmesi)
- yeniden başlatma ve yeniden oynatma: `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- bahsetme geçidi, botlar arası iletişim ve izin listeleri: `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE: `matrix-e2ee-*` (temel yanıt, iş parçacığı takibi, önyükleme, kurtarma anahtarı yaşam döngüsü, durum kaybı çeşitleri, sunucu yedekleme davranışı, cihaz hijyeni, SAS / QR / DM doğrulaması, yeniden başlatma, yapıt maskeleme)
- E2EE CLI: `matrix-e2ee-cli-*` (şifreleme kurulumu, birden çok kez güvenle çalıştırılabilen kurulum, önyükleme hatası, kurtarma anahtarı yaşam döngüsü, çoklu hesap, Gateway yanıtı gidiş-dönüşü, kendi kendini doğrulama)

Elle seçilmiş bir kümeyi çalıştırmak için `--scenario <id>` seçeneğini (tekrarlanabilir) iletin; profil geçidini yok saymak için `--profile all` ile birleştirin.

## Ortam değişkenleri

| Değişken                                | Varsayılan                                | Etki                                                                                                                                                                                           |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 dk.)                        | Tüm çalıştırma için kesin üst sınır.                                                                                                                                                            |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | İlk kanarya yanıtının süre sınırı. Sürüm CI'ı, paylaşımlı çalıştırıcılarda bu değeri artırır; böylece yavaş bir ilk Gateway turu, senaryo kapsamı başlamadan önce başarısızlığa yol açmaz.          |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Yanıt gelmemesine ilişkin negatif doğrulamalar için sessiz pencere. Çalıştırma zaman aşımına `<=` olacak şekilde sınırlandırılır.                                                                |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker kapatma işleminin süre sınırı. Hata çıktıları, kurtarma amaçlı `docker compose ... down --remove-orphans` komutunu içerir.                                                                |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Farklı bir Tuwunel sürümüne karşı doğrulama yaparken ana sunucu imajını geçersiz kılar.                                                                                                          |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | açık                                      | `0`, stderr'deki `[matrix-qa] ...` ilerleme satırlarını susturur. `1`, bunları zorunlu olarak etkinleştirir.                                                                                     |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | sansürlenmiş                              | `1`, ileti gövdesini ve `formatted_body` alanını `matrix-qa-observed-events.json` içinde tutar. Varsayılan olarak CI yapıtlarını güvende tutmak için bunlar sansürlenir.                          |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | kapalı                                    | `1`, yapıt yazıldıktan sonraki deterministik `process.exit` çağrısını atlar. matrix-js-sdk'nin yerel kripto tanıtıcıları, yapıt tamamlandıktan sonra olay döngüsünü canlı tutabildiği için varsayılan davranış çıkışı zorlar. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | ayarlanmamış                              | Bir dış başlatıcı (ör. `scripts/run-node.mjs`) tarafından ayarlandığında Matrix QA, kendi tee işlemini başlatmak yerine bu günlük yolunu yeniden kullanır.                                      |

## Çıktı yapıtları

`--output-dir` dizinine yazılır (varsayılan olarak `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`; böylece ardışık çalıştırmalar birbirinin üzerine yazmaz):

- `matrix-qa-report.md`: Markdown protokol raporu (nelerin geçtiği, başarısız olduğu veya atlandığı ve nedenleri).
- `matrix-qa-summary.json`: CI ayrıştırması ve panolar için uygun yapılandırılmış özet.
- `matrix-qa-route-state-manifest.json`: Senaryo kimliğine göre anahtarlanan dinamik `matrix-qa-v1` envanteri. Bu envanter, sansürlenmiş rota/gövde şekillerini, istek sıralamasını, gözlemlenen yeniden denemeleri, hataları, eşitleme belirteci sürekliliğini ve o çalıştırma sırasında gözlemlenen cihaz/anahtar/medya/yedekleme durum ailelerini kaydeder. Bu, yürütülebilir kanıttır; depoya eklenen bir temel değer değildir.
- `matrix-qa-observed-events.json`: Sürücü ve gözlemci istemcilerinden gözlemlenen Matrix olayları. `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` olmadığı sürece gövdeler sansürlenir; onay meta verileri, seçilmiş güvenli alanlar ve kısaltılmış bir komut önizlemesiyle özetlenir.
- `matrix-qa-output.log`: Çalıştırmanın birleştirilmiş stdout/stderr çıktısı. `OPENCLAW_RUN_NODE_OUTPUT_LOG` ayarlanmışsa bunun yerine dış başlatıcının günlüğü yeniden kullanılır.

## Sorun giderme ipuçları

- **Çalıştırma sona doğru takılıyor:** `matrix-js-sdk` yerel kripto tanıtıcıları test düzeneğinden daha uzun süre yaşayabilir. Varsayılan davranış, yapıt yazıldıktan sonra temiz bir `process.exit` çağrısını zorlar; `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` ayarlarsanız işlemin bir süre daha devam etmesini bekleyin.
- **Temizleme hatası:** Yazdırılan kurtarma komutunu (`docker compose ... down --remove-orphans` çağrısı) bulun ve ana sunucu bağlantı noktasını serbest bırakmak için elle çalıştırın.
- **CI'da kararsız negatif doğrulama pencereleri:** CI hızlıysa `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` değerini düşürün (varsayılan 8 sn.); yavaş paylaşımlı çalıştırıcılarda artırın.
- **Hata raporu için sansürlenmiş gövdeler gerekiyor:** `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` ile yeniden çalıştırın ve `matrix-qa-observed-events.json` dosyasını ekleyin. Ortaya çıkan yapıtı hassas olarak değerlendirin.
- **Farklı Tuwunel sürümü:** `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` değişkenini test edilen sürüme yönlendirin. Hat, yalnızca sabitlenmiş varsayılan imajı depoya kaydeder.

## Canlı taşıma sözleşmesi

Matrix, [QA genel bakışı: Canlı taşıma kapsamı](/tr/concepts/qa-e2e-automation#live-transport-coverage) bölümünde tanımlanan tek bir sözleşme denetim listesini paylaşan üç canlı taşıma hattından (Matrix, Telegram, Discord) biridir. `qa-channel`, geniş kapsamlı sentetik paket olarak kalır ve bilinçli olarak bu matrisin parçası değildir.

## İlgili

- [QA genel bakışı](/tr/concepts/qa-e2e-automation): genel QA yığını ve canlı taşıma sözleşmesi
- [QA Kanalı](/tr/channels/qa-channel): depo destekli senaryolar için sentetik kanal bağdaştırıcısı
- [Test](/tr/help/testing): testleri çalıştırma ve QA kapsamı ekleme
- [Matrix](/tr/channels/matrix): test edilen kanal plugini
