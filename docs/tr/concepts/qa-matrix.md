---
read_when:
    - pnpm openclaw qa matrix komutunu yerel olarak çalıştırma
    - Matrix QA senaryolarını ekleme veya seçme
    - Matrix QA hatalarını, zaman aşımlarını veya takılı kalan temizleme işlemlerini inceleme
summary: 'Docker destekli Matrix canlı QA hattı için bakımcı başvuru kaynağı: CLI, profiller, ortam değişkenleri, senaryolar ve çıktı yapıtları.'
title: Matrix Kalite Güvencesi
x-i18n:
    generated_at: "2026-04-30T09:18:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab862474e2abe45a1dcd66f025e3a3dd52a3417b0c1f42a26cd7944dd4053f5
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA hattı, birlikte gelen `@openclaw/matrix` Plugin'ini Docker'da tek kullanımlık bir Tuwunel homeserver'a karşı, geçici driver, SUT ve observer hesapları ile önceden hazırlanmış odalar kullanarak çalıştırır. Matrix için canlı taşımanın gerçek kapsamasıdır.

Bu yalnızca bakımcı araçlarıdır. Paketlenmiş OpenClaw sürümleri bilerek `qa-lab` içermez, bu nedenle `openclaw qa` yalnızca kaynak kod checkout'undan kullanılabilir. Kaynak kod checkout'ları birlikte gelen çalıştırıcıyı doğrudan yükler; Plugin kurulum adımı gerekmez.

Daha geniş QA framework bağlamı için [QA genel bakışı](/tr/concepts/qa-e2e-automation) bölümüne bakın.

## Hızlı başlangıç

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Düz `pnpm openclaw qa matrix`, `--profile all` çalıştırır ve ilk hatada durmaz. Bir sürüm geçidi için `--profile fast --fail-fast` kullanın; tam envanteri paralel çalıştırırken kataloğu `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` ile shard'lara ayırın.

## Hat ne yapar?

1. Docker'da tek kullanımlık bir Tuwunel homeserver hazırlar (varsayılan imaj `ghcr.io/matrix-construct/tuwunel:v1.5.1`, sunucu adı `matrix-qa.test`, port `28008`).
2. Üç geçici kullanıcı kaydeder: `driver` (gelen trafiği gönderir), `sut` (test edilen OpenClaw Matrix hesabı), `observer` (üçüncü taraf trafik yakalama).
3. Seçilen senaryoların gerektirdiği odaları hazırlar (main, threading, media, restart, secondary, allowlist, E2EE, verification DM vb.).
4. SUT hesabına kapsamlandırılmış gerçek Matrix Plugin'iyle bir alt OpenClaw Gateway başlatır; `qa-channel` alt süreçte yüklenmez.
5. Senaryoları sırayla çalıştırır ve driver/observer Matrix istemcileri üzerinden olayları gözlemler.
6. Homeserver'ı kaldırır, rapor ve özet artifact'larını yazar, ardından çıkar.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Yaygın bayraklar

| Bayrak                | Varsayılan                                   | Açıklama                                                                                                                       |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `--profile <profile>` | `all`                                         | Senaryo profili. [Profiller](#profiles) bölümüne bakın.                                                                        |
| `--fail-fast`         | kapalı                                        | İlk başarısız denetim veya senaryodan sonra dur.                                                                               |
| `--scenario <id>`     | —                                             | Yalnızca bu senaryoyu çalıştır. Tekrarlanabilir. [Senaryolar](#scenarios) bölümüne bakın.                                      |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Raporların, özetin, gözlemlenen olayların ve çıktı günlüğünün yazılacağı yer. Göreli yollar `--repo-root` temelinde çözülür.   |
| `--repo-root <path>`  | `process.cwd()`                               | Nötr bir çalışma dizininden çağırırken repository kökü.                                                                        |
| `--sut-account <id>`  | `sut`                                         | QA Gateway yapılandırması içindeki Matrix hesap kimliği.                                                                       |

### Sağlayıcı bayrakları

Hat gerçek bir Matrix taşıması kullanır, ancak model sağlayıcısı yapılandırılabilir:

| Bayrak                   | Varsayılan        | Açıklama                                                                                                                                          |
| ------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | Deterministik mock dispatch için `mock-openai` veya canlı frontier sağlayıcıları için `live-frontier`. Eski alias `live-openai` hâlâ çalışır.     |
| `--model <ref>`          | sağlayıcı varsayılanı | Birincil `provider/model` ref'i.                                                                                                              |
| `--alt-model <ref>`      | sağlayıcı varsayılanı | Senaryoların çalışma sırasında geçiş yaptığı alternatif `provider/model` ref'i.                                                               |
| `--fast`                 | kapalı           | Desteklendiği yerlerde sağlayıcı hızlı modunu etkinleştir.                                                                                        |

Matrix QA, `--credential-source` veya `--credential-role` kabul etmez. Hat tek kullanımlık kullanıcıları yerel olarak hazırlar; kiralanacak paylaşılan kimlik bilgisi havuzu yoktur.

## Profiller

Seçilen profil hangi senaryoların çalışacağını belirler.

| Profil          | Şunun için kullanın                                                                                                                                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (varsayılan) | Tam katalog. Yavaş ama kapsamlı.                                                                                                                                                                                                   |
| `fast`          | Canlı taşıma sözleşmesini çalıştıran sürüm geçidi alt kümesi: canary, mention gating, allowlist block, reply shape, restart resume, thread follow-up, thread isolation, reaction observation ve exec approval metadata delivery.       |
| `transport`     | Taşıma düzeyi threading, DM, room, autojoin, mention/allowlist, approval ve reaction senaryoları.                                                                                                                                       |
| `media`         | Image, audio, video, PDF, EPUB ek kapsamı.                                                                                                                                                                                            |
| `e2ee-smoke`    | Minimum E2EE kapsamı: temel encrypted reply, thread follow-up, bootstrap success.                                                                                                                                                      |
| `e2ee-deep`     | Kapsamlı E2EE state-loss, backup, key ve recovery senaryoları.                                                                                                                                                                         |
| `e2ee-cli`      | QA harness üzerinden yürütülen `openclaw matrix encryption setup` ve `verify *` CLI senaryoları.                                                                                                                                       |

Tam eşleme `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` içinde bulunur.

## Senaryolar

Tam senaryo kimliği listesi, `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` içindeki `MatrixQaScenarioId` union'ıdır. Kategoriler şunları içerir:

- threading — `matrix-thread-*`, `matrix-subagent-thread-spawn`
- üst düzey / DM / oda — `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming ve araç ilerlemesi — `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- medya — `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- yönlendirme — `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- tepkiler — `matrix-reaction-*`
- onaylar — `matrix-approval-*` (exec/Plugin metadata, chunked fallback, deny reactions, threads ve `target: "both"` yönlendirmesi)
- yeniden başlatma ve yeniden oynatma — `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- mention gating, bot-to-bot ve allowlist'ler — `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE — `matrix-e2ee-*` (basic reply, thread follow-up, bootstrap, recovery key lifecycle, state-loss varyantları, server backup davranışı, device hygiene, SAS / QR / DM verification, restart, artifact redaction)
- E2EE CLI — `matrix-e2ee-cli-*` (encryption setup, idempotent setup, bootstrap failure, recovery-key lifecycle, multi-account, gateway-reply round-trip, self-verification)

Elle seçilmiş bir kümeyi çalıştırmak için `--scenario <id>` iletin (tekrarlanabilir); profil gating'i yok saymak için `--profile all` ile birleştirin.

## Ortam değişkenleri

| Değişken                                | Varsayılan                                | Etki                                                                                                                                                                                                |
| --------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 dk)                         | Tüm çalıştırma için kesin üst sınır.                                                                                                                                                                |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | İlk kanarya yanıtı için sınır. Release CI, yavaş bir ilk gateway dönüşünün senaryo kapsamı başlamadan önce başarısız olmaması için paylaşımlı çalıştırıcılarda bunu yükseltir.                    |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Negatif yanıtsızlık doğrulamaları için sessiz pencere. Çalıştırma zaman aşımına `≤` olacak şekilde sınırlandırılır.                                                                                |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker kapatma işlemi için sınır. Hata yüzeyleri, kurtarma `docker compose ... down --remove-orphans` komutunu içerir.                                                                             |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Farklı bir Tuwunel sürümüne karşı doğrulama yaparken homeserver görüntüsünü geçersiz kılar.                                                                                                         |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | açık                                      | `0`, stderr üzerindeki `[matrix-qa] ...` ilerleme satırlarını susturur. `1` bunları zorla açar.                                                                                                     |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | redakte edilmiş                           | `1`, ileti gövdesini ve `formatted_body` alanını `matrix-qa-observed-events.json` içinde tutar. Varsayılan, CI yapıtlarını güvenli tutmak için redakte eder.                                      |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | kapalı                                    | `1`, yapıt yazıldıktan sonraki deterministik `process.exit` işlemini atlar. Varsayılan çıkışı zorlar çünkü matrix-js-sdk'nin yerel kripto tanıtıcıları, yapıt tamamlandıktan sonra olay döngüsünü canlı tutabilir. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | ayarlanmamış                              | Bir dış başlatıcı tarafından ayarlandığında (örn. `scripts/run-node.mjs`), Matrix QA kendi tee işlemini başlatmak yerine bu günlük yolunu yeniden kullanır.                                       |

## Çıktı yapıtları

`--output-dir` konumuna yazılır:

- `matrix-qa-report.md` — Markdown protokol raporu (nelerin geçtiği, başarısız olduğu, atlandığı ve nedenleri).
- `matrix-qa-summary.json` — CI ayrıştırması ve panolar için uygun yapılandırılmış özet.
- `matrix-qa-observed-events.json` — Sürücü ve gözlemci istemcilerinden gözlemlenen Matrix olayları. `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` olmadığı sürece gövdeler redakte edilir; onay metadata'sı seçili güvenli alanlar ve kısaltılmış komut önizlemesiyle özetlenir.
- `matrix-qa-output.log` — Çalıştırmadan birleşik stdout/stderr. `OPENCLAW_RUN_NODE_OUTPUT_LOG` ayarlanmışsa bunun yerine dış başlatıcının günlüğü yeniden kullanılır.

Varsayılan çıktı dizini `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` olur, böylece ardışık çalıştırmalar birbirinin üzerine yazmaz.

## Triage ipuçları

- **Çalıştırma sona yakın takılıyor:** `matrix-js-sdk` yerel kripto tanıtıcıları harness'tan daha uzun yaşayabilir. Varsayılan, yapıt yazıldıktan sonra temiz bir `process.exit` zorlar; `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` ayarını kaldırdıysanız sürecin beklemesini bekleyin.
- **Temizleme hatası:** yazdırılan kurtarma komutunu (bir `docker compose ... down --remove-orphans` çağrısı) bulun ve homeserver portunu serbest bırakmak için elle çalıştırın.
- **CI'da kararsız negatif doğrulama pencereleri:** CI hızlı olduğunda `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` değerini (varsayılan 8 sn) düşürün; yavaş paylaşımlı çalıştırıcılarda yükseltin.
- **Bir hata raporu için redakte edilmiş gövdeler gerekiyor:** `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` ile yeniden çalıştırın ve `matrix-qa-observed-events.json` dosyasını ekleyin. Ortaya çıkan yapıtı hassas kabul edin.
- **Farklı Tuwunel sürümü:** `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` değerini test edilen sürüme yönlendirin. Hat yalnızca sabitlenmiş varsayılan görüntüyü denetler.

## Canlı taşıma sözleşmesi

Matrix, [QA genel bakışı → Canlı taşıma kapsamı](/tr/concepts/qa-e2e-automation#live-transport-coverage) içinde tanımlanan tek bir sözleşme kontrol listesini paylaşan üç canlı taşıma hattından biridir (Matrix, Telegram, Discord). `qa-channel` geniş sentetik paket olarak kalır ve kasıtlı olarak bu matrisin parçası değildir.

## İlgili

- [QA genel bakışı](/tr/concepts/qa-e2e-automation) — genel QA yığını ve canlı taşıma sözleşmesi
- [QA Kanalı](/tr/channels/qa-channel) — repo destekli senaryolar için sentetik kanal adaptörü
- [Test etme](/tr/help/testing) — testleri çalıştırma ve QA kapsamı ekleme
- [Matrix](/tr/channels/matrix) — test edilen kanal Plugin'i
