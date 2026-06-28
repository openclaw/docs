---
read_when:
    - OpenClaw çalışma zamanı verilerini, önbelleği, dökümleri, görev durumunu veya geçici dosyaları SQLite'a taşıma
    - Eski JSON veya JSONL dosyalarından doctor geçişleri tasarlama
    - Yedekleme, geri yükleme, VFS veya worker depolama davranışını değiştirme
    - Oturum kilitlerini, budamayı, kırpmayı veya JSON uyumluluk yollarını kaldırma
summary: SQLite'ı birincil kalıcı durum ve önbellek katmanı yaparken yapılandırmayı dosya destekli tutmaya yönelik geçiş planı
title: Veritabanı öncelikli durum refaktörü
x-i18n:
    generated_at: "2026-06-28T01:14:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54995a9f43f740e7cc3ac3e0a4b69d73ddba6b2c30731193ab7ce3aa1dfc9d94
    source_path: refactor/database-first.md
    workflow: 16
---

# Veritabanı Öncelikli Durum Yeniden Düzenlemesi

## Karar

İki düzeyli bir SQLite düzeni kullanın:

- Genel veritabanı: `~/.openclaw/state/openclaw.sqlite`
- Aracı veritabanı: aracıya ait çalışma alanı, döküm, VFS, yapıt ve aracı başına büyük çalışma zamanı durumu için aracı başına bir SQLite veritabanı
- Yapılandırma dosya destekli kalır: `openclaw.json` veritabanının dışında kalır. Çalışma zamanı kimlik doğrulama profilleri SQLite'a taşınır; harici sağlayıcı veya CLI kimlik bilgisi dosyaları OpenClaw veritabanının dışında, sahipleri tarafından yönetilmeye devam eder.

Genel veritabanı denetim düzlemi veritabanıdır. Aracı keşfi, paylaşılan Gateway durumu, eşleştirme, cihaz/düğüm durumu, görev ve akış defterleri, Plugin durumu, zamanlayıcı çalışma zamanı durumu, yedekleme meta verileri ve taşıma durumunun sahibidir.

Aracı veritabanı veri düzlemi veritabanıdır. Aracının oturum meta verileri, döküm olay akışı, VFS çalışma alanı veya geçici ad alanı, araç yapıtları, çalıştırma yapıtları ve aranabilir/dizinlenebilir aracı yerel önbellek verilerinin sahibidir.

Bu, büyük aracı çalışma alanlarını, dökümleri ve ikili geçici verileri paylaşılan Gateway yazma hattına zorlamadan tek bir kalıcı genel görünüm sağlar.

## Katı Sözleşme

Bu taşımanın tek bir kanonik çalışma zamanı biçimi vardır:

- Oturum satırları yalnızca oturum meta verilerini kalıcı hale getirir. `transcriptLocator`, döküm dosyası yolları, kardeş JSONL yolları, kilit yolları, budama meta verileri veya dosya dönemi uyumluluk işaretçilerini kalıcı hale getirmemelidir.
- Döküm kimliği her zaman SQLite kimliğidir: `{agentId, sessionId}` ve protokolün ihtiyaç duyduğu yerlerde isteğe bağlı konu meta verileri.
- `sqlite-transcript://...` bir çalışma zamanı veya protokol kimliği değildir. Yeni kod döküm bulucularını türetmemeli, kalıcı hale getirmemeli, geçirmemeli, ayrıştırmamalı veya taşımamalıdır. Çalışma zamanı ve testler hiç sözde bulucu içermemelidir; belgeler dizeyi yalnızca yasaklamak için anabilir.
- Eski `sessions.json`, döküm JSONL, `.jsonl.lock`, budama, kesme ve eski oturum yolu mantığı yalnızca doctor taşıma/içe aktarma yoluna aittir.
- Eski oturum yapılandırma takma adları yalnızca doctor taşımasına aittir. Çalışma zamanı, başka bir yapılandırılmış aracı için `session.idleMinutes`, `session.resetByType.dm` veya aracıları aşan `agent:main:*` ana oturum takma adlarını yorumlamaz.
- Oturum yönlendirme kimliği tiplenmiş ilişkisel durumdur. Sıcak çalışma zamanı ve UI yolları `sessions.session_scope`, `sessions.account_id`, `sessions.primary_conversation_id`, `conversations` ve `session_conversations` okumalıdır; eski çağrı yerleri silinirken uyumluluk gölgesi dışında `session_key` ayrıştırmamalı veya sağlayıcı kimliği için `session_entries.entry_json` içinde arama yapmamalıdır.
- `dm` ve `direct` gibi kanal düzeyi doğrudan ileti işaretçileri yönlendirme sözlüğüdür; döküm bulucuları veya dosya deposu uyumluluk tanıtıcıları değildir.
- Eski kanca işleyici yapılandırması yalnızca doctor uyarı/taşıma yüzeylerine aittir. Çalışma zamanı `hooks.internal.handlers` yüklememelidir; kancalar yalnızca keşfedilen kanca dizinleri ve `HOOK.md` meta verileri üzerinden çalışır.
- Çalışma zamanı başlatma, sıcak yanıt yolları, Compaction, sıfırlama, kurtarma, tanılama, TTS, bellek kancaları, alt aracılar, Plugin komut yönlendirme, protokol sınırları ve kancalar çalışma zamanı boyunca `{agentId, sessionId}` geçirmelidir.
- Testler SQLite döküm satırlarını `{agentId, sessionId}` üzerinden tohumlamalı ve doğrulamalıdır. Yalnızca JSONL yolu iletmeyi, çağıranın sağladığı bulucunun korunmasını veya döküm dosyası uyumluluğunu kanıtlayan testler; doctor içe aktarma, oturum dışı destek/hata ayıklama materyalleştirme veya protokol biçimini kapsamıyorsa silinmelidir.
- `runEmbeddedPiAgent(...)`, hazırlanmış işçi çalıştırmaları ve iç gömülü deneme döküm bulucuları kabul etmemelidir. SQLite döküm yöneticisini `{agentId, sessionId}` ile açar ve bu yöneticiyi içselleştirilmiş PI uyumlu aracı oturumuna geçirir; böylece eski çağıranlar çalıştırıcının JSON/JSONL dökümleri yazmasına neden olamaz.
- Çalıştırıcı tanılamaları çalışma zamanı/önbellek/yük iz kayıtlarını SQLite'ta saklamalıdır. Çalışma zamanı tanılamaları JSONL dosyası geçersiz kılma düğmelerini veya genel döküm JSONL dışa aktarma yardımcılarını açığa çıkarmamalıdır; kullanıcıya dönük dışa aktarmalar dosya adlarını yeniden çalışma zamanına beslemeden veritabanı satırlarından açık yapıtlar materyalleştirebilir.
- Ham akış günlüğü `OPENCLAW_RAW_STREAM=1` ve SQLite tanılama satırlarını kullanır. Eski pi-mono `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH` ve `raw-openai-completions.jsonl` dosya günlüğü sözleşmesi OpenClaw çalışma zamanının veya testlerinin parçası değildir.
- QMD bellek dizinleme SQLite dökümlerini markdown dosyalarına dışa aktarmamalıdır. QMD yalnızca yapılandırılmış bellek dosyalarını dizinler; oturum dökümü araması SQLite destekli kalır.
- QMD SDK alt yolu yeni kod için yalnızca QMD'ye özeldir. SQLite oturum dökümü dizinleme yardımcıları `memory-core-host-engine-session-transcripts` üzerinde bulunur; herhangi bir QMD yeniden dışa aktarımı yalnızca uyumluluk içindir ve çalışma zamanı kodu tarafından kullanılmamalıdır.
- Yerleşik bellek dizinleri sahip olan aracı veritabanında bulunur. Çalışma zamanı yapılandırması ve çözümlenmiş çalışma zamanı sözleşmeleri `memorySearch.store.path` açığa çıkarmamalıdır; doctor bu eski yapılandırma anahtarını siler ve mevcut kod aracı `databasePath` değerini dahili olarak geçirir.

Uygulama çalışması, bu ifadeler doctor/içe aktarma/dışa aktarma/hata ayıklama sınırları dışında istisnasız doğru olana kadar kod silmeye devam etmelidir.

## Hedef durum ve ilerleme

### Katı hedef

- Tek bir genel SQLite veritabanı denetim düzlemi durumunun sahibidir:
  `state/openclaw.sqlite`.
- Aracı başına tek bir SQLite veritabanı veri düzlemi durumunun sahibidir:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- Yapılandırma dosya destekli kalır. `openclaw.json` bu veritabanı yeniden düzenlemesinin parçası değildir.
- Eski dosyalar yalnızca doctor taşıma girdileridir.
- Çalışma zamanı oturum veya döküm JSONL'yi etkin durum olarak asla yazmaz ya da okumaz.

### Hedef durumları

- `not-started`: dosya dönemi çalışma zamanı kodu hâlâ etkin durum yazıyor.
- `migrating`: doctor/içe aktarma kodu dosya verilerini SQLite'a taşıyabilir.
- `dual-read`: geçici köprü hem SQLite hem de eski dosyaları okur. Açıkça yalnızca doctor olarak belgelenmediği sürece bu durum bu yeniden düzenleme için yasaktır.
- `sqlite-runtime`: çalışma zamanı yalnızca SQLite okur ve yazar.
- `clean`: eski çalışma zamanı API'leri ve testleri kaldırılmıştır ve koruma gerilemeleri önler.
- `done`: belgeler, testler, yedekleme, doctor taşıması ve değiştirilen denetimler temiz durumu kanıtlar.

### Mevcut durum

- Oturumlar: çalışma zamanı için `clean`. Oturum satırları aracı başına veritabanında yaşar, çalışma zamanı API'leri `{agentId, sessionId}` veya `{agentId, sessionKey}` kullanır ve `sessions.json` yalnızca doctor için eski girdidir.
- Dökümler: çalışma zamanı için `clean`. Döküm olayları, kimlikleri, anlık görüntüleri ve yörünge çalışma zamanı olayları aracı başına veritabanında yaşar. Çalışma zamanı artık döküm bulucularını veya JSONL döküm yollarını kabul etmez.
- PI gömülü çalıştırıcı: `clean`. Gömülü PI çalıştırmaları, hazırlanmış işçiler, Compaction ve yeniden deneme döngüleri SQLite oturum kapsamını kullanır ve eski döküm tanıtıcılarını reddeder.
- Cron: çalışma zamanı için `clean`. Çalışma zamanı `cron_jobs` ve `cron_run_logs` kullanır; çalışma zamanı testleri SQLite `storeKey` adlandırmasını kullanır ve dosya dönemi Cron yolları yalnızca doctor eski taşıma testlerinde kalır.
- Görev kayıt defteri: `clean`. Görev ve Görev Akışı çalışma zamanı satırları `state/openclaw.sqlite` içinde yaşar; yayımlanmamış yan dosya SQLite içe aktarıcıları silinmiştir.
- Plugin durumu: `clean`. Plugin durum/blob satırları paylaşılan genel veritabanında yaşar; eski plugin-state yan dosya SQLite yardımcılarına karşı koruma vardır.
- Bellek: yerleşik bellek ve oturum dökümü dizinleme için `sqlite-runtime`. Bellek dizin tabloları aracı başına veritabanında yaşar, Plugin bellek durumu paylaşılan plugin-state satırlarını kullanır ve eski bellek dosyaları doctor taşıma girdileri veya kullanıcı çalışma alanı içeriğidir.
- Yedekleme: `sqlite-runtime`. Yedekleme aşamaları SQLite anlık görüntülerini sıkıştırır, canlı WAL/SHM yan dosyalarını atlar, SQLite bütünlüğünü doğrular ve yedekleme çalıştırmalarını genel veritabanına kaydeder.
- Doctor taşıması: bilerek `migrating`. Doctor eski JSON, JSONL ve emekliye ayrılmış yan depoları SQLite'a içe aktarır, taşıma çalıştırmalarını/kaynaklarını kaydeder ve başarılı kaynakları kaldırır.
- E2E betikleri: çalışma zamanı kapsamı için `clean`. Docker MCP tohumlama SQLite satırları yazar. runtime-context Docker betiği eski JSONL'yi yalnızca doctor taşıma tohumu içinde oluşturur ve eski oturum dizin yolunu açıkça adlandırır.

### Kalan çalışma

- [x] Cron çalışma zamanı testi depo değişkenlerini, doctor eski girdileri olmadıkları sürece `storePath` dışına yeniden adlandır.
      Dosyalar: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Kanıt: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Eski dosya dönemi dışa aktarma test mock'larını kaldır veya yeniden adlandır.
      Dosya: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Kanıt: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Docker runtime-context eski JSONL tohumunu açıkça yalnızca doctor için yap.
      Dosya: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Kanıt: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` yalnızca
      `seedBrokenLegacySessionForDoctorMigration` gösterir.
- [x] Her şema değişikliğinden sonra Kysely oluşturulmuş türlerini hizalı tut.
      Dosyalar: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Kanıt: bu geçişte şema değişikliği yok; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Dokunulan depolar, komutlar ve betikler için odaklı testleri yeniden çalıştır.
      Kanıt: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] `done` ilan etmeden önce değiştirilen kapıyı veya uzaktan geniş kanıtı çalıştır.
      Kanıt: `pnpm check:changed --timed -- <changed extension paths>`, geçici Node 24/pnpm kurulumu ve eşitlenen `.git` içermeyen çalışma alanı için açık yol yönlendirmesinden sonra
      Hetzner Crabbox çalıştırması `run_3f1cabf6b25c` üzerinde geçti.

### Geriletme yapmayın

- Döküm bulucuları yok.
- Etkin oturum dosyaları yok.
- Doctor eski taşıma testleri dışında sahte JSONL test fikstürleri yok.
- Kysely beklenen yerde ham SQLite erişimi yok.
- Yeni eski DB taşımaları yok. Bu düzen yayımlanmadı; güçlü bir neden olmadıkça şema sürümünü `1` olarak tutun.

## Kod Okuma Varsayımları

Bu planı engelleyen takip ürün kararları yok. Uygulama şu varsayımlarla ilerlemelidir:

- Bu depolama yolu için doğrudan `node:sqlite` kullanın ve Node 22+ runtime gerektirin.
- Tam olarak bir normal yapılandırma dosyası tutun. Bu refactor kapsamında config, plugin
  manifestlerini veya Git çalışma alanlarını SQLite içine taşımayın.
- Runtime uyumluluk dosyaları gerekli değildir. Eski JSON ve JSONL dosyaları
  yalnızca migration girdileridir. Dal-yerel SQLite sidecar'ları hiçbir zaman yayımlanmadı ve
  içe aktarılmak yerine silinir.
- `openclaw doctor --fix`, eski dosyadan veritabanına migration adımının sahibidir.
  Runtime başlangıcı ve `openclaw migrate`, eski OpenClaw veritabanı yükseltme yollarını
  taşımamalıdır.
- Kimlik bilgisi uyumluluğu aynı kuralı izler: runtime kimlik bilgileri
  SQLite içinde yaşar. Eski `auth-profiles.json`, ajan başına `auth.json` ve paylaşılan
  `credentials/oauth.json` dosyaları doctor migration girdileridir, sonra içe aktarma
  sonrasında kaldırılır.
- Üretilen model katalog durumu veritabanı desteklidir. Runtime kodu
  `agents/<agentId>/agent/models.json` yazmamalıdır; mevcut `models.json` dosyaları eski
  doctor girdileridir ve `agent_model_catalogs` içine aktarıldıktan sonra kaldırılır.
- Runtime, transcript locator'larını migrate etmemeli, normalize etmemeli veya köprülememelidir. Etkin
  transcript kimliği SQLite içinde `{agentId, sessionId}` şeklindedir. Dosya yolları
  yalnızca eski doctor girdileridir ve `sqlite-transcript://...`, bir
  sınır tanıtıcısı olarak ele alınmak yerine runtime, protokol, hook ve plugin yüzeylerinden
  kaybolmalıdır.
- Runtime SQLite transcript okumaları eski JSONL giriş-şekli migration'larını çalıştırmaz veya
  uyumluluk için transcript'lerin tamamını yeniden yazmaz. Eski giriş normalizasyonu açık
  doctor/içe aktarma yardımcılarında kalır. Doctor, SQLite satırları eklemeden önce eski JSONL transcript
  dosyalarını normalize eder; mevcut runtime satırları zaten geçerli transcript şemasında
  yazılır. Trajectory/session dışa aktarımı bu satırları olduğu gibi okur ve dışa aktarım sırasında
  eski migration'lar gerçekleştirmemelidir.
- Eski transcript JSONL ayrıştırma/migration yardımcıları yalnızca doctor içindir. Runtime
  transcript format kodu yalnızca mevcut SQLite transcript bağlamını oluşturur; doctor,
  satırları eklemeden önce eski JSONL giriş yükseltmelerinin sahibidir.
- Eski runtime sahipliğindeki JSONL transcript streaming yardımcısı silindi. Doctor
  içe aktarma kodu açık eski dosya okumalarının sahibidir; runtime session geçmişi
  SQLite satırlarını okur.
- Codex app-server bağlamaları, Codex plugin-state namespace içinde standart
  anahtar olarak OpenClaw `sessionId` değerini kullanır. `sessionKey`, yönlendirme/görüntüleme için
  metadata'dır ve kalıcı session id yerine geçmemeli veya transcript-dosyası kimliğini
  yeniden diriltmemelidir.
- Context engine'ler mevcut runtime sözleşmesini doğrudan alır. Registry,
  `sessionKey`, `transcriptScope` veya `prompt` değerlerini silen retry shim'leriyle
  engine'leri sarmamalıdır; mevcut veritabanı-öncelikli parametreleri kabul edemeyen engine'ler
  köprülenmek yerine yüksek sesle başarısız olmalıdır.
- Yedekleme çıktısı tek bir arşiv dosyası olarak kalmalıdır. Veritabanı içerikleri bu arşive
  ham canlı WAL sidecar'ları olarak değil, kompakt SQLite snapshot'ları olarak girmelidir.
- Transcript araması faydalıdır ancak ilk veritabanı-öncelikli geçiş için gerekli değildir.
  Şemayı FTS daha sonra eklenebilecek şekilde tasarlayın.
- Worker yürütmesi, veritabanı sınırı otururken ayarlar arkasında deneysel kalmalıdır.

## Kod Okuma Bulguları

Mevcut dal zaten proof-of-concept aşamasını geçmiş durumda. Paylaşılan
veritabanı var, Node `node:sqlite` küçük bir runtime yardımcısı üzerinden bağlanmış ve
önceki store'lar artık `state/openclaw.sqlite` veya sahibi olan
`openclaw-agent.sqlite` veritabanına yazıyor.

Kalan iş SQLite seçmek değil; yeni sınırı temiz tutmak ve hâlâ eski
dosya dünyasına benzeyen uyumluluk-şekilli arayüzleri silmektir:

- Session `storePath` artık bir runtime kimliği, test fixture şekli veya
  durum payload alanı değildir. Runtime ve bridge testleri artık
  `storePath` sözleşme adını içermez; doctor/migration kodu bu eski söz dağarcığının sahibidir.
- Session yazmaları artık eski süreç içi `store-writer.ts` kuyruğundan geçmez.
  SQLite patch yazmaları bunun yerine çakışma algılama ve sınırlı retry kullanır.
- Eski yol keşfinin hâlâ geçerli migration kullanımları vardır, ancak runtime kodu
  `sessions.json` ve transcript JSONL dosyalarını olası yazma hedefleri olarak ele almayı bırakmalıdır.
- Ajan sahipliğindeki tablolar ajan başına SQLite veritabanlarında yaşar. Global DB
  registry/control-plane satırlarını tutar; transcript kimliği ajan başına transcript satırlarında
  `{agentId, sessionId}` şeklindedir. Runtime kodu transcript dosya yollarını kalıcılaştırmamalı
  veya transcript locator'larını migrate etmemelidir.
- Doctor zaten birkaç eski dosyayı içe aktarıyor. Temizlik, bunu doctor'ın çağırdığı,
  kalıcı bir migration raporuyla birlikte tek bir açık migration uygulaması yapmaktır.

Uygulamayı engelleyen ek ürün sorusu yoktur.

## Mevcut Kod Şekli

Dalın zaten gerçek bir paylaşılan SQLite tabanı var:

- Çalışma zamanı tabanı artık Node 22+: `package.json`, CLI çalışma zamanı koruması,
  yükleyici varsayılanları, macOS çalışma zamanı bulucusu, CI ve herkese açık
  kurulum dokümanlarının tümü aynı fikirde. Eski Node 22 uyumluluk hattı
  kaldırıldı.
- `src/state/openclaw-state-db.ts`, `openclaw.sqlite` dosyasını açar, WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON` ayarlar ve
  `src/state/openclaw-state-schema.sql` kaynağından türetilen oluşturulmuş şema
  modülünü uygular.
- Kysely tablo türleri ve çalışma zamanı şema modülleri, commit edilmiş `.sql`
  dosyalarından oluşturulan geçici SQLite veritabanlarından üretilir; çalışma
  zamanı kodu artık global, ajan başına veya proxy yakalama veritabanları için
  kopyalanıp yapıştırılmış şema dizelerini tutmaz.
- Çalışma zamanı depoları, SQLite satır şekillerini elle gölgelemek yerine
  seçilen ve eklenen satır türlerini bu oluşturulmuş Kysely `DB`
  arayüzlerinden türetir. Ham SQL, şema uygulaması, pragma'lar ve yalnızca
  migrasyon DDL'i ile sınırlı kalır.
- SQLite şemaları `user_version = 1` değerine daraltıldı çünkü bu veritabanı
  düzeni henüz yayımlanmadı. Çalışma zamanı açıcıları yalnızca mevcut şemayı
  oluşturur; dosyadan veritabanına içe aktarma doctor kodunda kalır ve branch'e
  yerel veritabanı yükseltme yardımcıları silindi.
- Sahiplik sınırının kanonik olduğu yerlerde ilişkisel sahiplik uygulanır:
  kaynak migrasyon satırları `migration_runs` üzerinden, görev teslim durumu
  `task_runs` üzerinden ve transkript kimlik satırları transkript olayları
  üzerinden cascade yapar.
- Mevcut paylaşılan tablolar şunları içerir: `agent_databases`,
  `auth_profile_stores`, `auth_profile_state`,
  `plugin_state_entries`, `plugin_blob_entries`, `media_blobs`,
  `skill_uploads`, `capture_sessions`, `capture_events`, `capture_blobs`,
  `sandbox_registry_entries`, `cron_run_logs`, `cron_jobs`, `commitments`,
  `delivery_queue_entries`, `model_capability_cache`,
  `workspace_setup_state`, `native_hook_relay_bridges`,
  `current_conversation_bindings`, `plugin_binding_approvals`,
  `tui_last_sessions`, `acp_sessions`, `acp_replay_sessions`,
  `acp_replay_events`, `task_runs`, `task_delivery_state`, `flow_runs`,
  `subagent_runs`, `migration_runs` ve `backup_runs`.
- Rastgele Plugin sahipli durum, host sahipli typed tablolar almaz. Kurulu
  Plugin'ler, sürümlendirilmiş JSON payload'ları için `plugin_state_entries` ve
  baytlar için `plugin_blob_entries` kullanır; namespace/key sahipliği, TTL
  temizliği, yedekleme ve Plugin migrasyon kayıtlarıyla birlikte. Host'un sorgu
  sözleşmesine sahip olduğu durumlarda, örneğin `plugin_binding_approvals` gibi,
  host sahipli Plugin orkestrasyon durumu hâlâ typed tablolara sahip olabilir.
- Plugin migrasyonları, host şema migrasyonları değil, Plugin sahipli namespace'ler
  üzerinde veri migrasyonlarıdır. Bir Plugin kendi sürümlendirilmiş state/blob
  girdilerini bir migrasyon sağlayıcısı aracılığıyla migrate edebilir ve host,
  kaynak/çalıştırma durumunu normal migrasyon defterine kaydeder. Yeni Plugin
  kurulumları, host'un kendisi yeni bir Plugin'ler arası sözleşmenin sahipliğini
  üstlenmedikçe `openclaw-state-schema.sql` dosyasının değiştirilmesini gerektirmez.
- `src/state/openclaw-agent-db.ts`,
  `agents/<agentId>/agent/openclaw-agent.sqlite` dosyasını açar, veritabanını
  global DB'ye kaydeder ve ajan yerel session, transkript, VFS, artifact, cache
  ve bellek indeksi tablolarına sahip olur. Paylaşılan çalışma zamanı keşfi artık
  her çağrı noktasında bu sorguyu yeniden uygulamak yerine oluşturulmuş typed
  `agent_databases` kayıt defterini okur.
- Global ve ajan başına veritabanları, veritabanı rolü, şema sürümü, zaman
  damgaları ve ajan veritabanları için ajan id'si içeren bir `schema_meta`
  satırı kaydeder. Bu SQLite şeması henüz yayımlanmadığı için düzen hâlâ
  `user_version = 1` olarak kalır.
- Ajan başına session kimliği artık `session_id` ile anahtarlanan kanonik bir
  `sessions` kök tablosuna sahiptir; `session_key`, `session_scope`,
  `account_id`, `primary_conversation_id`, zaman damgaları, görüntüleme alanları,
  model metadata'sı, harness id'si ve parent/spawn bağlantısı sorgulanabilir
  sütunlardır. `session_routes`, `session_key` değerinden mevcut `session_id`
  değerine giden benzersiz aktif route indeksidir; böylece bir route anahtarı,
  sıcak okumaların yinelenen `sessions.session_key` satırları arasında seçim
  yapmasına neden olmadan yeni bir kalıcı session'a taşınabilir. Eski
  `session_entries.entry_json` uyumluluk şekilli payload'ı, kalıcı `session_id`
  köküne foreign key ile bağlıdır; artık bir session'ın tek şema düzeyi temsili
  değildir.
- Ajan başına harici konuşma kimliği de ilişkiseldir:
  `conversations`, normalize edilmiş provider/account/conversation kimliğini
  depolar ve `session_conversations` bir OpenClaw session'ını bir veya daha fazla
  harici konuşmaya bağlar. Bu, birden fazla eşin `session_key` içinde yanlış
  gösterilmeden kasıtlı olarak tek bir session'a eşlenebildiği paylaşılan ana DM
  session'larını kapsar. SQLite ayrıca doğal sağlayıcı kimliği için benzersizliği
  uygular; böylece aynı channel/account/kind/peer/thread demeti conversation id'leri
  arasında çatallanamaz. Paylaşılan ana doğrudan eşler `participant` rolüyle
  bağlanır; böylece bir OpenClaw session'ı, eski eşleri belirsiz ilgili satırlara
  düşürmeden birden fazla harici DM eşini temsil edebilir.
  `sessions.primary_conversation_id` hâlâ mevcut typed teslim hedefine işaret
  eder. Kapalı routing/status sütunları yalnızca TypeScript union'larına
  güvenmek yerine SQLite `CHECK` kısıtlarıyla uygulanır.
  Çalışma zamanı session projeksiyonu, typed session/conversation sütunlarını
  uygulamadan önce `session_entries.entry_json` içindeki uyumluluk routing
  gölgelerini temizler; böylece bayat JSON payload'ları teslim hedeflerini
  yeniden canlandıramaz.
  Subagent duyuru yönlendirmesi de typed SQLite teslim bağlamını gerektirir;
  artık uyumluluk `SessionEntry` route alanlarına geri düşmez.
  Gateway `chat.send` açık teslim kalıtımı, `origin`/`last*` uyumluluk alanları
  yerine typed SQLite teslim bağlamını okur.
  `tools.effective` da provider/account/thread bağlamını bayat `last*`
  session-entry gölgelerinden değil typed SQLite teslim/routing satırlarından
  türetir.
  Sistem olayı prompt bağlamı, channel/to/account/thread alanlarını `origin`
  gölgeleri yerine typed teslim alanlarından yeniden oluşturur.
  Paylaşılan `deliveryContextFromSession` yardımcısı ve session'dan conversation'a
  eşleyici artık `SessionEntry.origin` değerini tamamen yok sayar; sıcak route
  kimliğini yalnızca typed teslim alanları ve ilişkisel conversation satırları
  oluşturabilir.
  Çalışma zamanı session entry normalizasyonu, `entry_json` kalıcılaştırılmadan
  veya projekte edilmeden önce `origin` değerini çıkarır ve gelen metadata,
  yeni origin gölgeleri oluşturmak yerine typed channel/chat alanları ile
  ilişkisel conversation satırları yazar.
- Transkript olayları, transkript snapshot'ları ve trajectory çalışma zamanı
  olayları artık kanonik ajan başına `sessions` köküne referans verir ve session
  silindiğinde cascade yapar. Transkript kimlik/idempotency satırları, tam
  transkript olay satırından cascade etmeye devam eder.
- Memory-core indeksleri artık açık ajan veritabanı tabloları olan
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks` ve
  `memory_embedding_cache` tablolarını kullanır; `memory_index_state` revision
  değişikliklerini izler. İsteğe bağlı FTS/vector yan indeksleri, genel `meta`,
  `files`, `chunks`, `chunks_fts` veya `chunks_vec` tabloları yerine
  `memory_index_chunks_fts` ve `memory_index_chunks_vec` olarak adlandırılır.
  Kanonik adlar mevcut path/source satır şeklini ve serileştirilmiş embedding
  uyumluluğunu korur. Bu tablolar türetilmiş/arama cache'idir, kanonik transkript
  depolama değildir; bellek workspace dosyalarından ve yapılandırılmış
  kaynaklardan silinip yeniden oluşturulabilirler. Yayımlanmış genel adlı bir
  bellek indeksini açmak, metadata'sını, kaynaklarını, chunk'larını ve embedding
  cache'ini kanonik tablolara migrate eder; türetilmiş FTS/vector tabloları
  kanonik adları altında yeniden oluşturulur.
- Subagent çalıştırma kurtarma durumu artık indekslenmiş child, requester ve
  controller session anahtarlarıyla typed paylaşılan `subagent_runs` satırlarında
  yaşar. Eski `subagents/runs.json` dosyası yalnızca doctor migrasyon girdisidir.
- Mevcut konuşma binding'leri artık normalize edilmiş conversation id ile
  anahtarlanan typed paylaşılan `current_conversation_bindings` satırlarında
  yaşar; target agent/session sütunları, conversation kind, status, expiry ve
  metadata, yinelenen opaque bir binding kaydı yerine ilişkisel sütunlar olarak
  depolanır. Kalıcı binding anahtarı normalize edilmiş conversation kind'ını
  içerir; böylece direct/group/channel ref'leri çakışamaz ve SQLite geçersiz
  binding kind/status değerlerini reddeder. Eski
  `bindings/current-conversations.json` dosyası yalnızca doctor migrasyon
  girdisidir.
- Teslim kuyruğu kurtarma artık replay JSON üzerine channel, target, account,
  session, retry, error, platform-send ve recovery state için typed kuyruk
  sütunları bindirir. `entry_json`, replay payload'larını, hook'ları ve
  formatting payload'ını tutar; ancak typed sütunlar sıcak kuyruk
  routing/state için yetkilidir.
- TUI son session geri yükleme işaretçileri artık hashed TUI bağlantı/session
  kapsamıyla anahtarlanan typed paylaşılan `tui_last_sessions` satırlarında
  yaşar. Eski TUI JSON dosyası yalnızca doctor migrasyon girdisidir.
- Varsayılan TTS tercihleri artık `speech-core` Plugin'i altında anahtarlanan
  paylaşılan Plugin-state SQLite satırlarında yaşar. Eski `settings/tts.json`
  dosyası yalnızca doctor migrasyon girdisidir; çalışma zamanı artık TTS tercihleri
  JSON dosyalarını okumaz veya yazmaz ve legacy path resolver doctor migrasyon
  modülünde yaşar.
- Secret hedef metadata'sı artık her credential hedefinin bir config dosyası
  olduğunu varsaymak yerine store'lardan söz eder. `openclaw.json` config store
  olarak kalır; auth-profile hedefleri, JSON payload'ları olarak tutulan
  provider şekilli credential'larla typed SQLite `auth_profile_stores`
  satırlarını kullanır.
- Secret audit artık emekliye ayrılmış ajan başına `auth.json` dosyalarını taramaz.
  Doctor, bu legacy dosya hakkında uyarma, dosyayı içe aktarma ve kaldırma
  sahipliğini üstlenir.
- Legacy auth profile path yardımcıları artık doctor legacy kodunda yaşar. Core
  auth profile path yardımcıları, `auth-profiles.json` veya `auth-state.json`
  çalışma zamanı path'leri yerine SQLite auth-store kimliğini ve görüntüleme
  konumlarını açığa çıkarır.
- Subagent çalıştırma kurtarma ve OpenRouter model capability cache çalışma
  zamanı modülleri artık SQLite snapshot okuyucu/yazıcılarını, yalnızca doctor'a
  ait legacy JSON içe aktarma yardımcılarından ayrı tutar. OpenRouter capability'leri,
  tek opaque cache blob'u veya provider'a özel host tablosu yerine
  `provider_id = "openrouter"` altındaki typed genel `model_capability_cache`
  satırlarını kullanır. Subagent run `taskName`, typed
  `subagent_runs.task_name` sütununda depolanır; `payload_json` kopyası
  replay/debug verisidir, sıcak görüntüleme veya lookup alanları için kaynak
  değildir.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts`, ajan veritabanı
  `vfs_entries` tablosu üzerinde bir SQLite VFS uygular. Dizin okumaları,
  recursive export'lar, silmeler ve yeniden adlandırmalar, tüm namespace'i
  taramak veya `LIKE` path eşleşmesine dayanmak yerine indekslenmiş
  `(namespace, path)` prefix aralıklarını kullanır.
- `src/agents/runtime-worker.entry.ts`, worker'lar için çalıştırma başına SQLite
  VFS, tool artifact, run artifact ve scoped cache store'ları oluşturur.
- Workspace bootstrap tamamlanma işaretçileri artık `.openclaw/workspace-state.json`
  yerine çözümlenmiş workspace path'iyle anahtarlanan typed paylaşılan
  `workspace_setup_state` satırlarında yaşar; çalışma zamanı artık legacy
  workspace işaretçisini okumaz veya yeniden yazmaz ve yardımcı API'ler artık
  storage kimliğini türetmek için sahte bir `.openclaw/setup-state` path'ini
  dolaştırmaz.
- Exec onayları artık typed paylaşılan SQLite `exec_approvals_config` singleton
  satırında yaşar. Doctor legacy `~/.openclaw/exec-approvals.json` dosyasını
  içe aktarır; çalışma zamanı yazmaları artık bu dosyayı aktif store konumu
  olarak oluşturmaz, yeniden yazmaz veya raporlamaz. macOS companion aynı
  `state/openclaw.sqlite` tablo satırını okur ve yazar; diskte yalnızca Unix
  prompt socket'ini tutar çünkü bu IPC'dir, kalıcı çalışma zamanı durumu değildir.
- Cihaz kimliği, cihaz auth'u ve bootstrap çalışma zamanı modülleri artık SQLite
  snapshot okuyucu/yazıcılarını, yalnızca doctor'a ait legacy JSON içe aktarma
  yardımcılarından ayrı tutar. Cihaz kimliği typed `device_identities` satırlarını
  kullanır ve cihaz auth token'ları typed `device_auth_tokens` satırlarını
  kullanır. Cihaz auth yazmaları, token tablosunu truncate etmek yerine satırları
  device/role bazında uzlaştırır ve çalışma zamanı artık tek token güncellemelerini
  eski bütün-store adapter'ı üzerinden yönlendirmez. Eski
  sürüm-1 JSON yükleri yalnızca doctor içe/dışa aktarma şekilleri olarak vardır.
- GitHub Copilot belirteç değişim önbelleği, paylaşılan SQLite Plugin-state tablosunu
  `github-copilot/token-cache/default` altında kullanır. Bu, sağlayıcıya ait önbellek durumudur,
  bu yüzden kasıtlı olarak bir ana makine şema tablosu eklemez.
- GitHub Copilot Compaction artık çalışma alanı yan dosyaları olarak `openclaw-compaction-*.json`
  yazmaz. Harness, izlenen SDK oturumu için SDK geçmiş Compaction RPC'sini çağırır
  ve OpenClaw kalıcı oturum/transkript durumunu uyumluluk işaretçi dosyaları yerine
  SQLite içinde tutar.
- Paylaşılan Swift çalışma zamanı (`OpenClawKit`), cihaz kimliği ve cihaz kimlik doğrulaması için aynı
  `state/openclaw.sqlite` satırlarını kullanır. macOS uygulama yardımcıları, ikinci bir JSON veya
  SQLite yoluna sahip olmak yerine paylaşılan SQLite yardımcılarını içe aktarır. Kalan eski bir
  `identity/device.json`, doctor onu SQLite içine aktarıncaya kadar kimlik oluşturmayı engeller;
  bu, TypeScript ve Android başlangıç kapısıyla eşleşir.
- Android cihaz kimliği, yazılı `state/openclaw.sqlite#table/device_identities` satırlarında
  saklanan aynı TypeScript uyumlu anahtar malzemesini kullanır. `openclaw/identity/device.json`
  dosyasını asla okumaz veya yazmaz; kalan eski bir dosya, doctor onu SQLite içine aktarıncaya kadar
  başlangıcı engeller.
- Android önbelleğe alınmış cihaz kimlik doğrulama belirteçleri de yazılı
  `state/openclaw.sqlite#table/device_auth_tokens` satırlarını kullanır ve TypeScript ile Swift ile aynı
  sürüm-1 belirteç semantiğini paylaşır. Çalışma zamanı artık `SecurePrefs`
  `gateway.deviceToken*` uyumluluk anahtarlarını okumaz; bunlar yalnızca migration/doctor
  mantığına aittir.
- Android bildirim son paket geçmişi, yazılı
  `android_notification_recent_packages` satırlarını kullanır. Çalışma zamanı artık eski SharedPreferences CSV anahtarlarını
  taşımaz veya okumaz.
- Eski `identity/device.json` mevcut olduğunda, SQLite kimlik satırı geçersiz olduğunda veya SQLite kimlik
  deposu açılamadığında cihaz kimliği oluşturma kapalı şekilde başarısız olur. Doctor önce bu dosyayı içe aktarır
  ve kaldırır, bu yüzden çalışma zamanı başlangıcı migration öncesinde eşleştirme kimliğini sessizce döndüremez.
- Cihaz kimliği seçimi, bir JSON dosya konumlayıcısı değil, bir SQLite satır anahtarıdır. Testler
  ve Gateway yardımcıları açık kimlik anahtarları geçirir; yalnızca doctor migration ve kapalı başarısız olan başlangıç kapısı
  emekli `identity/device.json` dosya adını bilir.
- Oturum sıfırlama uyumluluğu artık doctor yapılandırma migration içinde yaşar:
  `session.idleMinutes`, `session.reset.idleMinutes` içine taşınır,
  `session.resetByType.dm`, `session.resetByType.direct` içine taşınır ve
  çalışma zamanı sıfırlama ilkesi yalnızca kanonik sıfırlama anahtarlarını okur.
- Eski yapılandırma uyumluluğu artık `src/commands/doctor/` altında yaşar. Normal
  `readConfigFileSnapshot()` doğrulaması doctor eski algılayıcılarını içe aktarmaz
  veya eski sorunlara açıklama eklemez; `runDoctorConfigPreflight()` bu sorunları
  doctor onarımı/raporlaması için ekler. Doctor yapılandırma akışı
  `src/commands/doctor/legacy-config.ts` dosyasını içe aktarır ve eski OAuth profil kimliği onarımı
  `src/commands/doctor/legacy/oauth-profile-ids.ts` altında yaşar.
- Doctor olmayan komutlar eski yapılandırma onarımını otomatik çalıştırmaz. Örneğin,
  `openclaw update --channel` artık geçersiz eski yapılandırmada başarısız olur ve
  doctor migration kodunu sessizce içe aktarmak yerine kullanıcıdan doctor çalıştırmasını ister.
- Web push, APNs, Voice Wake, güncelleme kontrolleri ve yapılandırma sağlığı artık abonelikler,
  VAPID anahtarları, Node kayıtları, tetikleyici satırları, yönlendirme satırları,
  güncelleme bildirimi durumu ve yapılandırma sağlığı girdileri için bütün opak JSON blobları yerine
  yazılı paylaşılan SQLite tabloları kullanır. Web push ve APNs anlık görüntü yazmaları artık
  abonelikleri/kayıtları tablolarını temizlemek yerine birincil anahtara göre uzlaştırır;
  yapılandırma sağlığı da aynı şeyi yapılandırma yoluna göre yapar.
  Çalışma zamanı modülleri, SQLite anlık görüntü okuyucularını/yazıcılarını yalnızca doctor'a ait eski JSON içe aktarma yardımcılarından ayrı tutar.
- Node ana makine yapılandırması artık paylaşılan SQLite veritabanında yazılı bir tekil satır kullanır;
  doctor normal çalışma zamanı kullanımından önce eski `node.json` dosyasını içe aktarır.
- Cihaz/Node eşleştirme, kanal eşleştirme, kanal izin listeleri ve bootstrap durumu
  artık bütün opak JSON blobları yerine yazılı SQLite satırları kullanır. Plugin bağlama
  onayları ve Cron iş durumu aynı ayrımı izler: çalışma zamanı modülleri
  SQLite destekli işlemler ve nötr anlık görüntü yardımcıları sunar ve eşleştirme/bootstrap
  artı Plugin bağlama onayı anlık görüntü yazmaları tabloları kısaltmak yerine satırları birincil anahtara göre
  uzlaştırırken, doctor eski JSON dosyalarını
  `src/commands/doctor/legacy/*` modülleri aracılığıyla içe aktarır/kaldırır.
- Yüklü Plugin kayıtları artık SQLite yüklü Plugin dizininde yaşar.
  Çalışma zamanı yapılandırma okuma/yazma artık eski
  `plugins.installs` yazılmış yapılandırma verilerini taşımaz veya korumaz; doctor bu eski yapılandırma
  şeklini normal çalışma zamanı kullanımından önce SQLite içine aktarır.
- QQBot kimlik bilgisi kurtarma anlık görüntüleri artık SQLite Plugin durumunda
  `qqbot/credential-backups` altında yaşar. Çalışma zamanı artık
  `qqbot/data/credential-backup*.json` yazmaz; doctor bu eski yedekleme dosyalarını
  diğer QQBot durum girdileriyle birlikte içe aktarır ve kaldırır.
- Gateway yeniden yükleme planlaması, dahili bir `installedPluginIndex.installRecords.*`
  diff ad alanı altında SQLite yüklü Plugin dizin anlık görüntülerini karşılaştırır. Çalışma zamanı
  yeniden yükleme kararları artık bu satırları sahte `plugins.installs` yapılandırma
  nesnelerine sarmaz.
- Matrix adlandırılmış hesap kimlik bilgisi yükseltmesi artık çalışma zamanı
  okumaları sırasında gerçekleşmez. Tek/varsayılan Matrix hesabı çözümlenebildiğinde eski üst düzey
  `credentials/matrix/credentials.json` yeniden adlandırmasının sahibi doctor'dır.
- Çekirdek eşleştirme ve Cron çalışma zamanı modülleri artık eski JSON yol
  oluşturucularını dışa aktarmaz. Doctor'a ait eski modüller, yalnızca içe aktarma testleri ve
  migration için `pending.json`, `paired.json`,
  `bootstrap.json` ve `cron/jobs.json` kaynak yollarını oluşturur. Eski Cron iş şekli normalleştirmesi ve Cron çalışma günlüğü içe aktarma
  `src/commands/doctor/legacy/cron*.ts` altında yaşar.
- `src/commands/doctor/legacy/runtime-state.ts`, Node ana makine yapılandırması dahil eski JSON durum
  dosyalarını doctor'dan SQLite içine aktarır. Yeni eski dosya
  içe aktarıcıları `src/commands/doctor/legacy/` altında kalır.
- `src/commands/doctor/state-migrations.ts`, eski `sessions.json` ve
  `*.jsonl` transkriptlerini doğrudan SQLite içine aktarır ve başarılı kaynakları kaldırır. Artık
  kök eski transkriptleri
  `agents/<agentId>/sessions/*.jsonl` üzerinden aşamalandırmaz veya içe aktarmadan önce
  kanonik bir JSONL hedefi oluşturmaz.
- Durum bütünlüğü doctor kontrolleri artık eski oturum dizinlerini taramaz veya
  yetim JSONL silme seçeneği sunmaz. Eski transkript dosyaları yalnızca migration girdileridir
  ve migration adımı içe aktarma ile kaynak kaldırmanın sahibidir.
- Eski sandbox kayıt defteri içe aktarması
  `src/commands/doctor/legacy/sandbox-registry.ts` altında yaşar; etkin sandbox kayıt defteri
  okumaları ve yazmaları yalnızca SQLite olarak kalır.
- Eski oturum transkript sağlığı/içe aktarma onarımı
  `src/commands/doctor/legacy/session-transcript-health.ts` altında yaşar; çalışma zamanı komut
  modülleri artık JSONL transkript ayrıştırma veya etkin dal onarım kodu taşımaz.

Tamamlanan birleştirme/silme öne çıkanları:

- Plugin durumu artık paylaşılan `state/openclaw.sqlite` veritabanını kullanıyor. Eski
  dal yerel `plugin-state/state.sqlite` yan taşıyıcı içe aktarıcısı kaldırıldı çünkü
  bu SQLite yerleşimi hiçbir zaman yayımlanmadı. Probe/test yardımcıları, Plugin
  durumuna özel bir SQLite yolu göstermek yerine paylaşılan `databasePath` değerini
  bildirir.
- Görev ve TaskFlow çalışma zamanı tabloları artık `tasks/runs.sqlite` ve
  `tasks/flows/registry.sqlite` yerine paylaşılan `state/openclaw.sqlite`
  veritabanında yer alıyor; eski yan taşıyıcı içe aktarıcıları aynı yayımlanmamış
  yerleşim gerekçesiyle kaldırıldı.
- `src/config/sessions/store.ts` artık gelen meta veriler, rota güncellemeleri veya
  updated-at okumaları için `storePath` gerektirmiyor. Komut kalıcılığı, CLI oturum
  temizliği, alt ajan derinliği, auth geçersiz kılmaları ve transcript oturum
  kimliği agent/session satır API'lerini kullanır. Yazmalar iyimser çakışma yeniden
  denemesiyle SQLite satır yamaları olarak uygulanır.
- Oturum hedef çözümlemesi artık eski `sessions.json` yollarını değil, ajan başına
  veritabanı hedeflerini sunar. Paylaşılan Gateway, ACP meta verileri, doctor rota
  onarımı ve `openclaw sessions`, `agent_databases` ile yapılandırılmış ajanları
  listeler.
- Gateway oturum yönlendirmesi artık `resolveGatewaySessionDatabaseTarget` kullanır;
  döndürülen hedef, eski bir session-store dosya yolu yerine `databasePath` ve aday
  SQLite satır anahtarlarını taşır.
- Kanal oturumu çalışma zamanı türleri artık updated-at okumaları, gelen meta veriler
  ve son rota güncellemeleri için `{agentId, sessionKey}` sunar. Eski
  `saveSessionStore(storePath, store)` uyumluluk türü kaldırıldı.
- Plugin çalışma zamanı, extension API ve `config/sessions` barrel yüzeyleri artık
  Plugin kodunu SQLite destekli oturum satırı yardımcılarına yönlendirir. Kök
  kütüphane uyumluluk dışa aktarımları (`loadSessionStore`, `saveSessionStore`,
  `resolveStorePath`) mevcut tüketiciler için kullanımdan kaldırılmış shim'ler
  olarak kalır. Eski `resolveLegacySessionStorePath` yardımcısı kaldırıldı; eski
  `sessions.json` yol oluşturma artık migration ve test fixture'larına yereldir.
- `src/config/sessions/session-entries.sqlite.ts` artık kanonik oturum girdilerini
  ajan başına veritabanında saklar ve satır düzeyinde read/upsert/delete yama
  desteğine sahiptir. Çalışma zamanı upsert/patch/delete artık büyük-küçük harf
  varyantlarını taramaz veya eski alias anahtarlarını budamaz; kanonikleştirme
  doctor'a aittir. Bağımsız JSON içe aktarma yardımcısı kaldırıldı ve migration,
  tüm oturum tablosunu değiştirmek yerine daha yeni satırları upsert ederek
  birleştirir. Genel read/list/load yardımcıları sıcak oturum meta verilerini
  türlenmiş `sessions` ve `conversations` satırlarından projekte eder; `entry_json`
  bir uyumluluk/hata ayıklama gölgesidir ve türlenmiş oturum kimliği veya teslimat
  bağlamı kaybolmadan eski ya da geçersiz olabilir.
- `src/config/sessions/delivery-info.ts` artık teslimat bağlamını türlenmiş ajan
  başına `sessions` + `conversations` + `session_conversations` satırlarından
  çözümler. Artık çalışma zamanı teslimat kimliğini `session_entries.entry_json`
  içinden yeniden oluşturmaz; eksik bir türlenmiş konuşma satırı çalışma zamanı
  fallback'i değil, bir doctor migration/repair sorunudur.
- Saklanan oturum sıfırlama kararları artık türlenmiş `sessions.session_scope`,
  `sessions.chat_type` ve `sessions.channel` meta verilerini tercih eder.
  `sessionKey` ayrıştırma yalnızca komut hedeflerindeki açık thread/topic suffix'leri
  için kalır; grup ve doğrudan sıfırlama sınıflandırması artık anahtar şeklinden
  gelmez.
- Oturum liste/durum görüntüleme sınıflandırması artık türlenmiş sohbet meta
  verilerini ve Gateway oturum türünü kullanır. Artık `session_key` içindeki
  `:group:` veya `:channel:` alt dizelerini kalıcı grup/doğrudan gerçeği olarak
  kabul etmez.
- Sessiz yanıt politika seçimi artık yalnızca açık konuşma türünü veya yüzey meta
  verilerini kullanır. Artık doğrudan/grup politikasını `session_key` alt
  dizelerinden tahmin etmez.
- Oturum görüntüleme modeli çözümlemesi artık ajan kimliğini `session_key` içinden
  ayırmak yerine SQLite oturum veritabanı hedefinden alır.
- Ajanlar arası duyuru hedefi hidrasyonu artık yalnızca türlenmiş `sessions.list`
  `deliveryContext` değerini kullanır. Artık eski `origin`, yansıtılmış `last*`
  alanları veya `session_key` şekli üzerinden kanal/hesap/thread yönlendirmesi
  kurtarmaz.
- `sessions_send` thread hedefi reddi artık türlenmiş SQLite yönlendirme meta
  verilerini okur. Artık hedef anahtardan thread suffix'leri ayrıştırarak hedefleri
  reddetmez veya kabul etmez.
- Grup kapsamlı araç politikası doğrulaması artık mevcut veya başlatılan oturum için
  türlenmiş SQLite konuşma yönlendirmesini okur. Artık `sessionKey` çözerek
  grup/kanal kimliğine güvenmez; çağıranın sağladığı grup kimlikleri, bunlara kefil
  olan türlenmiş oturum satırı yoksa atılır.
- Kanal model geçersiz kılma eşleştirmesi artık açık grup ve üst konuşma meta
  verilerini kullanır. Artık üst konuşma kimliklerini `parentSessionKey` içinden
  çözmez.
- Saklanan model geçersiz kılma kalıtımı artık türlenmiş oturum bağlamından açık bir
  üst oturum anahtarı gerektirir. Artık üst geçersiz kılmaları `sessionKey` içindeki
  `:thread:` veya `:topic:` suffix'lerinden türetmez.
- Eski oturum thread-info sarmalayıcısı ve yüklü Plugin thread ayrıştırıcısı
  kaldırıldı; hiçbir çalışma zamanı kodu `config/sessions/thread-info` içe aktarmaz.
- Kanal konuşma yardımcısı artık tam oturum anahtarı ayrıştırma köprüleri sunmaz.
  Core hâlâ sağlayıcıya ait ham konuşma kimliklerini
  `resolveSessionConversation(...)` üzerinden normalleştirir, ancak `sessionKey`
  içinden rota olgularını yeniden oluşturmaz.
- Tamamlama teslimatı, gönderme politikası ve görev bakımı artık sohbet türünü
  `session_key` şeklinden türetmez. Eski sohbet türü anahtar ayrıştırıcısı silindi;
  bu yollar türlenmiş oturum meta verisi, türlenmiş teslimat bağlamı veya açık
  teslimat hedefi sözlüğü gerektirir.
- Oturum liste/durum, tanılama, onay hesap bağlama, TUI Heartbeat filtreleme ve
  kullanım özetleri artık sağlayıcı/hesap/thread/görüntü yönlendirmesi için
  `SessionEntry.origin` değerini taramaz. Kalan tek çalışma zamanı `origin` okumaları
  oturum dışı kavramlar veya mevcut tur teslimat nesneleridir.
- Onay isteği yerel konuşma araması artık türlenmiş ajan başına oturum yönlendirme
  satırlarını okur. Artık kanal/grup/thread konuşma kimliğini `sessionKey` içinden
  ayrıştırmaz; eksik türlenmiş meta veriler bir migration/repair sorunudur.
- Gateway oturum değişti/sohbet/oturum olay payload'ları artık `SessionEntry.origin`
  veya `last*` rota gölgelerini yansıtmaz; istemciler türlenmiş `channel`,
  `chatType` ve `deliveryContext` alır.
- Heartbeat teslimat çözümlemesi artık türlenmiş SQLite `deliveryContext` değerini
  doğrudan alabilir ve Heartbeat çalışma zamanı mevcut yönlendirme için uyumluluk
  `session_entries` gölgelerine dayanmak yerine ajan başına oturum teslimat satırını
  geçirir.
- Cron izole ajan teslimat hedefi çözümlemesi de uyumluluk girdi payload'ına fallback
  yapmadan önce mevcut rotasını türlenmiş ajan başına oturum teslimat satırından
  hidrate eder.
- Alt ajan duyuru origin çözümlemesi artık türlenmiş istek sahibi oturum teslimat
  bağlamını `loadRequesterSessionEntry` üzerinden taşır ve bu satırı uyumluluk
  `last*`/`deliveryContext` gölgelerine tercih eder.
- Gelen oturum meta veri güncellemeleri artık önce türlenmiş ajan başına teslimat
  satırıyla birleştirilir; eski `SessionEntry` teslimat alanları yalnızca türlenmiş
  konuşma satırı yoksa fallback'tir.
- Yeniden başlatma/güncelleme teslimat çıkarımı artık türlenmiş SQLite teslimat
  `threadId` değerinin `sessionKey` içinden ayrıştırılan topic/thread parçalarına
  üstün gelmesini sağlar; ayrıştırma yalnızca eski thread biçimli anahtarlar için
  fallback'tir.
- Hook ajan bağlamı kanal kimlikleri artık türlenmiş SQLite konuşma kimliğini,
  ardından açık mesaj meta verilerini tercih eder. Artık provider/grup/kanal
  parçalarını `sessionKey` içinden ayrıştırmaz.
- Gateway `chat.send` harici rota kalıtımı artık kanal/doğrudan/grup kapsamını
  `sessionKey` parçalarından çıkarmak yerine türlenmiş SQLite oturum yönlendirme
  meta verilerini okur. Kanal kapsamlı oturumlar yalnızca türlenmiş oturum kanalı ve
  sohbet türü saklanan teslimat bağlamıyla eşleştiğinde miras alır; shared-main
  oturumları daha sıkı CLI/istemci-meta-verisi-yok kuralını korur.
- Yeniden başlatma sentinel uyandırma ve devam yönlendirmesi artık Heartbeat
  uyandırmalarını veya yönlendirilmiş ajan turu devamlarını kuyruğa almadan önce
  türlenmiş SQLite teslimat/yönlendirme satırlarını okur. Artık teslimat bağlamını
  session-entry JSON gölgesinden yeniden oluşturmaz.
- Gateway `tools.effective` bağlam çözümlemesi artık sağlayıcı, hesap, hedef, thread
  ve yanıt modu girdileri için türlenmiş SQLite teslimat/yönlendirme satırlarını
  okur. Artık bu sıcak yönlendirme alanlarını eski `session_entries.entry_json`
  origin gölgelerinden kurtarmaz.
- Gerçek zamanlı ses danışma yönlendirmesi artık üst/arama teslimatını türlenmiş ajan
  başına SQLite oturum satırlarından çözümler. Gömülü ajan mesaj rotasını seçerken
  artık uyumluluk `SessionEntry.deliveryContext` gölgelerine fallback yapmaz.
- ACP spawn Heartbeat relay ve üst akış yönlendirmesi artık üst teslimatı türlenmiş
  SQLite oturum satırlarından okur. Artık üst teslimat bağlamını uyumluluk
  session-entry gölgelerinden yeniden oluşturmaz.
- Oturum teslimat rota koruması artık türlenmiş sohbet meta verilerini ve kalıcı
  teslimat sütunlarını izler. Artık kanal ipuçlarını, doğrudan/main işaretçilerini
  veya thread şeklini `sessionKey` içinden çıkarmaz; dahili webchat rotaları yalnızca
  SQLite oturum için zaten türlenmiş/kalıcı teslimat kimliğine sahipse harici hedefi
  miras alır.
- Genel oturum teslimat çıkarımı artık yalnızca tam türlenmiş SQLite oturum teslimat
  satırını okur. Artık thread/topic suffix'lerini ayrıştırmaz veya thread biçimli bir
  anahtardan temel oturum anahtarına fallback yapmaz.
- Yanıt dispatch'i, yeniden başlatma sentinel kurtarma ve gerçek zamanlı ses danışma
  yönlendirmesi artık thread yönlendirmesi için tam türlenmiş SQLite
  oturum/konuşma satırlarını kullanır. Artık thread biçimli oturum anahtarlarını
  ayrıştırarak thread kimliklerini veya temel oturum teslimat bağlamını kurtarmaz.
- Gömülü PI geçmiş sınırlaması artık sağlayıcı, sohbet türü ve eş kimliği için
  türlenmiş SQLite oturum yönlendirme projeksiyonunu (`sessions` + birincil
  `conversations`) kullanır. Artık provider, DM, grup veya thread şeklini
  `sessionKey` içinden ayrıştırmaz.
- Cron araç teslimat çıkarımı artık yalnızca açık teslimatı veya mevcut türlenmiş
  teslimat bağlamını kullanır. Artık kanal, eş, hesap veya thread hedeflerini
  `agentSessionKey` içinden çözmez.
- Çalışma zamanı oturum satırları artık eski `lastProvider` rota alias'ını taşımaz.
  Yardımcılar ve testler türlenmiş `lastChannel` ve `deliveryContext` alanlarını
  kullanır; eski rota alias'larını veya kalıcı `origin` gölgelerini çevirmesi gereken
  tek yer doctor migration'dır.
- Transcript olayları, VFS satırları ve araç artifact satırları artık ajan başına
  veritabanına yazılır. Yayımlanmamış global transcript-file eşleme tablosu
  kaldırıldı; doctor bunun yerine eski kaynak yollarını kalıcı migration satırlarına
  kaydeder.
- Çalışma zamanı transcript araması artık JSONL byte offset'lerini taramaz veya eski
  transcript dosyalarını yoklamaz. Gateway chat/media/history yolları transcript
  satırlarını SQLite'tan okur; oturum JSONL artık bir çalışma zamanı durumu veya dışa
  aktarma biçimi değil, yalnızca eski doctor girdisidir.
- Transcript üst ve dal ilişkileri, yol benzeri
  `agent-db:...transcript_events...` konumlandırıcı dizeleri yerine SQLite transcript
  başlıklarında yapılandırılmış `parentTranscriptScope: {agentId, sessionId}` meta
  verilerini kullanır.
- Transcript yöneticisi sözleşmesi artık örtük kalıcı `create(cwd)` veya
  `continueRecent(cwd)` constructor'larını sunmaz. Kalıcı transcript yöneticileri
  açık bir `{agentId, sessionId}` kapsamıyla açılır; yalnızca bellek içi yöneticiler
  testler ve saf transcript dönüşümleri için kapsamsız kalır.
- Çalışma zamanı transcript store API'leri dosya sistemi yollarını değil SQLite
  kapsamını çözümler. Eski `resolve...ForPath` yardımcısı ve kullanılmayan
  `transcriptPath` yazma seçenekleri çalışma zamanı çağıranlarından kaldırıldı.
- Çalışma zamanı oturum çözümlemesi artık `{agentId, sessionId}` kullanır ve harici
  sınırlar için `sqlite-transcript://<agent>/<session>` dizeleri türetmemelidir.
  Eski mutlak JSONL yolları yalnızca doctor migration girdileridir.
- Yerel hook relay doğrudan köprü kayıtları artık relay kimliğiyle anahtarlanan
  türlenmiş paylaşılan `native_hook_relay_bridges` satırlarında yaşar. Çalışma
  zamanı artık bu kısa ömürlü köprü kayıtları için `/tmp` JSON registry veya opak
  genel kayıtlar yazmaz.
- `runEmbeddedPiAgent(...)` artık transcript-locator parametresine sahip değildir.
  Hazırlanan worker tanımlayıcıları transkript konumlayıcılarını da atlar. Runtime oturum
  durumu ve kuyruğa alınmış takip çalıştırmaları, türetilmiş transkript
  tanıtıcıları yerine `{agentId, sessionId}` taşır.
- Gömülü Compaction artık SQLite kapsamını `agentId` ve `sessionId` değerlerinden alır.
  Compaction kancaları, context-engine çağrıları, CLI yetkilendirmesi ve protokol yanıtları
  türetilmiş `sqlite-transcript://...` tanıtıcıları almamalıdır. Dışa aktarma/hata ayıklama kodu
  satırlardan açık kullanıcı yapıtları oluşturabilir, ancak genel bir oturum JSONL dışa aktarma yolu
  sağlamaz veya dosya adlarını tekrar runtime kimliğine beslemez.
- `/export-session`, transkript satırlarını SQLite'tan okur ve yalnızca istenen
  bağımsız HTML görünümünü yazar. Gömülü görüntüleyici artık bu satırlardan oturum JSONL'sini
  yeniden oluşturmaz veya indirmez.
- Context-engine yetkilendirmesi artık ajan kimliğini kurtarmak için bir transkript konumlayıcısını
  ayrıştırmaz. Hazırlanan runtime bağlamı, çözümlenen `agentId` değerini
  yerleşik Compaction bağdaştırıcısına taşır.
- Transkript yeniden yazma ve canlı araç sonucu kısaltma artık transkript durumunu
  `{agentId, sessionId}` ile okur ve kalıcılaştırır; transkript güncelleme olay yükleri için
  geçici konumlayıcılar türetmez.
- Transkript durumu yardımcı yüzeyinde artık konumlayıcı tabanlı
  `readTranscriptState`, `replaceTranscriptStateEvents` veya
  `persistTranscriptStateMutation` varyantları yoktur. Runtime çağıranları
  `{agentId, sessionId}` API'lerini kullanmalıdır. Doctor içe aktarımı eski dosyaları açık dosya
  yoluyla okur ve SQLite satırları yazar; konumlayıcı dizelerini taşımaz.
- Runtime oturum yöneticisi sözleşmesi artık `open(locator)`,
  `forkFrom(locator)` veya `setTranscriptLocator(...)` sunmaz. Kalıcı oturum
  yöneticileri yalnızca `{agentId, sessionId}` ile açılır; liste/çatallama yardımcıları
  transkript yöneticisi cephesi yerine satır odaklı oturum ve checkpoint API'lerinde yaşar.
- Gateway transkript okuyucu API'leri önce kapsamlıdır. Bunlar
  `{agentId, sessionId}` alır ve yanlışlıkla runtime kimliğine dönüşebilecek konumsal bir
  transkript konumlayıcısını kabul etmez. Etkin transkript konumlayıcısı ayrıştırması kaldırıldı;
  eski kaynak yolları yalnızca Doctor içe aktarma kodu tarafından okunur.
- Transkript güncelleme olayları da önce kapsamlıdır. `emitSessionTranscriptUpdate`
  artık çıplak bir konumlayıcı dizesi kabul etmez ve dinleyiciler bir tanıtıcıyı ayrıştırmadan
  `{agentId, sessionId}` ile yönlendirir.
- Gateway oturum iletisi yayını, oturum anahtarlarını transkript konumlayıcısından değil
  ajan/oturum kapsamından çözer. Eski transkript-konumlayıcısından-oturum anahtarına
  çözücü/önbellek kaldırıldı.
- Gateway oturum geçmişi SSE filtreleri canlı güncellemeleri ajan/oturum kapsamına göre alır. Artık
  bir akışın güncelleme alıp almaması gerektiğine karar vermek için transkript konumlayıcısı adaylarını,
  realpath'leri veya dosya biçimli transkript kimliklerini kurallı hale getirmez.
- Oturum yaşam döngüsü kancaları artık `session_end` üzerinde transkript konumlayıcıları
  türetmez veya sunmaz. Kanca tüketicileri `sessionId`, `sessionKey`, sonraki oturum
  kimlikleri ve ajan bağlamını alır; transkript dosyaları yaşam döngüsü sözleşmesinin
  parçası değildir.
- Sıfırlama kancaları da artık transkript konumlayıcıları türetmez veya sunmaz.
  `before_reset` yükü kurtarılan SQLite iletilerini ve sıfırlama nedenini taşırken,
  oturum kimliği kanca bağlamında kalır.
- Ajan test düzeneği sıfırlaması artık bir transkript konumlayıcısı kabul etmez. Sıfırlama dağıtımı
  nedenle birlikte `sessionId`/`sessionKey` kapsamındadır.
- Ajan extension oturum türleri artık `transcriptLocator` sunmaz; extension'lar
  dosya biçimli bir transkript kimliğine uzanmak yerine oturum bağlamını ve runtime API'lerini
  kullanmalıdır.
- Plugin Compaction kancaları artık transkript konumlayıcıları sunmaz. Kanca bağlamı
  zaten oturum kimliğini taşır ve transkript okumaları dosya biçimli tanıtıcılar yerine
  SQLite kapsamını bilen API'ler üzerinden yapılmalıdır.
- `before_agent_finalize` kancaları, yerel kanca aktarma yükleri dahil olmak üzere
  artık `transcriptPath` sunmaz. Sonlandırma kancaları yalnızca oturum bağlamını kullanır.
- Gateway sıfırlama yanıtları artık döndürülen girdide bir transkript konumlayıcısı
  sentezlemez. Sıfırlama SQLite transkript satırları oluşturur, temiz oturum girdisini döndürür
  ve transkript erişimini kapsamı bilen okuyuculara bırakır.
- Gömülü çalıştırma ve Compaction sonuçları artık oturum muhasebesi için transkript
  konumlayıcıları yüzeye çıkarmaz. Otomatik Compaction yalnızca etkin `sessionId`,
  Compaction sayaçları ve token meta verilerini günceller.
- Gömülü deneme sonuçları artık `transcriptLocatorUsed` döndürmez ve
  context-engine `compact()` sonuçları artık transkript konumlayıcıları döndürmez.
  Runtime yeniden deneme döngüleri yalnızca ardıl bir `sessionId` kabul eder.
- Delivery-mirror transkript ekleme sonuçları artık transkript konumlayıcıları
  döndürmez. Çağıranlar eklenen `messageId` değerini alır; transkript güncelleme sinyalleri
  SQLite kapsamını kullanır.
- Üst oturum çatallama yardımcıları yalnızca çatallanan `sessionId` değerini döndürür. Alt ajan
  hazırlığı, alt ajan/oturum kapsamını motorlara geçirir.
- CLI runner parametreleri ve geçmiş yeniden tohumlama artık transkript konumlayıcılarını kabul etmez.
  CLI geçmiş okumaları SQLite transkript kapsamını `{agentId,
sessionId}` ve oturum anahtarı bağlamından çözer.
- CLI ve gömülü runner test fixture'ları artık etkin oturumları `*.jsonl` dosyalarıymış gibi
  göstermeden veya runtime parametreleri içinden bir `sqlite-transcript://...` dizesi
  geçirmeden SQLite transkript satırlarını oturum kimliğine göre tohumlar ve okur.
- Oturum araç sonucu guard olayları, bellek içi bir yöneticinin türetilmiş konumlayıcısı
  olmadığında bile bilinen oturum kapsamından yayar. Testleri artık etkin
  `/tmp/*.jsonl` transkript dosyaları taklidi yapmaz.
- BTW ve Compaction-checkpoint yardımcıları artık transkript satırlarını SQLite kapsamına göre
  okur ve çatallar. Checkpoint meta verileri artık yalnızca oturum kimliklerini ve yaprak/girdi
  kimliklerini saklar; türetilmiş konumlayıcılar artık checkpoint yüklerine yazılmaz.
- Gateway transkript anahtarı araması, protokol sınırlarında SQLite transkript kapsamını kullanır
  ve artık transkript dosya adları için realpath veya stat yapmaz.
- Otomatik Compaction transkript rotasyonu, ardıl transkript satırlarını doğrudan
  SQLite transkript deposu üzerinden yazar. Oturum satırları dayanıklı bir JSONL yolu veya
  kalıcı konumlayıcı değil, yalnızca ardıl oturum kimliğini tutar.
- Gömülü context-engine Compaction, SQLite adlandırmalı transkript rotasyonu
  yardımcılarını kullanır. Rotasyon testleri artık JSONL ardıl yolları oluşturmaz veya
  etkin oturumları dosya olarak modellemez.
- Yönetilen giden görüntü tutma, transkript-ileti önbelleğini dosya sistemi stat çağrıları
  yerine SQLite transkript istatistiklerinden anahtarlar.
- Runtime oturum kilitleri ve bağımsız eski `.jsonl.lock` Doctor
  şeridi kaldırıldı.
- Microsoft Teams runtime barrel'ı ve genel Plugin SDK artık eski dosya kilidi yardımcısını
  yeniden dışa aktarmaz; dayanıklı Plugin durum yolları SQLite desteklidir.
- Oturum yaş/sayı budaması ve açık oturum temizliği kaldırıldı.
  Doctor eski içe aktarımın sahibidir; bayat oturumlar açıkça sıfırlanır veya silinir.
- Doctor bütünlük kontrolleri artık eski bir JSONL dosyasını SQLite oturum satırı için geçerli etkin
  transkript olarak saymaz. Etkin transkript sağlığı yalnızca SQLite'tır;
  eski JSONL dosyaları taşıma/yetim temizleme girdileri olarak raporlanır.
- Doctor artık `agents/<agent>/sessions/` dizinini gerekli runtime
  durumu olarak ele almaz. Bu dizini yalnızca zaten varsa, eski içe aktarım
  veya yetim temizleme girdisi olarak tarar.
- Gateway `sessions.resolve`, oturum patch/sıfırlama/compact yolları, alt ajan
  oluşturma, hızlı iptal, ACP meta verileri, heartbeat ile yalıtılmış oturumlar ve TUI
  patch uygulama artık normal runtime işinin yan etkisi olarak eski oturum anahtarlarını
  taşımaz veya budamaz.
- CLI komut oturumu çözümlemesi artık `storePath` yerine sahip `agentId` değerini döndürür
  ve normal `--to` veya `--session-id` çözümlemesi sırasında eski ana oturum satırlarını
  artık kopyalamaz. Eski ana satır kurallılaştırması yalnızca Doctor'a aittir.
- Runtime alt ajan derinlik çözümlemesi artık `sessions.json` veya JSON5
  oturum depolarını okumaz. Ajan kimliğine göre SQLite `session_entries` okur ve eski
  derinlik/oturum meta verileri yalnızca Doctor içe aktarma yolu üzerinden girebilir.
- Kimlik doğrulama profili oturum geçersiz kılmaları, dosya biçimli bir oturum deposu runtime'ını
  tembel yüklemek yerine doğrudan `{agentId, sessionKey}` satır upsert'leriyle kalıcılaşır.
- Otomatik yanıt ayrıntılı kapılama ve oturum güncelleme yardımcıları artık SQLite
  oturum satırlarını oturum kimliğine göre okur/upsert eder ve kalıcı satır durumuna dokunmadan
  önce artık eski bir depo yolu gerektirmez.
- Komut çalıştırma oturum meta verisi yardımcıları artık girdi odaklı adlar ve modül
  yolları kullanır; eski `session-store` komut yardımcı yüzeyi kaldırıldı.
- Bootstrap başlık tohumlama ve manuel Compaction sınırı sertleştirme artık SQLite transkript
  satırlarını doğrudan değiştirir. Runtime çağıranları yazılabilir `.jsonl` yolları değil,
  oturum kimliği geçirir.
- Sessiz oturum rotasyonu yeniden oynatması, son kullanıcı/asistan dönüşlerini
  SQLite transkript satırlarından `{agentId, sessionId}` ile kopyalar. Artık kaynak
  veya hedef transkript konumlayıcılarını kabul etmez.
- Yeni runtime oturum satırları artık transkript konumlayıcıları saklamaz. Çağıranlar
  `{agentId, sessionId}` değerini doğrudan kullanır; dışa aktarma/hata ayıklama komutları
  satırları oluşturduklarında çıktı dosya adlarını seçebilir.
- Yeni bir kalıcı transkript oturumu başlatmak artık her zaman SQLite satırlarını
  kapsama göre açar. Oturum yöneticisi artık önceki dosya dönemi transkript
  yolunu veya konumlayıcısını yeni oturumun kimliği olarak yeniden kullanmaz.
- Kalıcı transkript oturumları açık
  `openTranscriptSessionManagerForSession({agentId, sessionId})` API'sini kullanır. Eski
  statik `SessionManager.create/openForSession/list/forkFromSession` cepheleri
  kaldırıldı; böylece testler ve runtime kodu yanlışlıkla dosya dönemi oturum
  keşfini yeniden oluşturamaz.
- Plugin runtime artık `api.runtime.agent.session.resolveTranscriptLocatorPath` sunmaz;
  Plugin kodu SQLite satır yardımcılarını ve kapsam değerlerini kullanır.
- Genel `session-store-runtime` SDK yüzeyi artık yalnızca oturum satırı
  ve transkript satırı yardımcılarını dışa aktarır. Odaklı SQLite şema/yol/işlem yardımcıları
  `sqlite-runtime` içinde yaşar; ham açma/kapama/sıfırlama yardımcıları birinci taraf testler için
  yalnızca yerel kalır.
- Eski `.jsonl` yörünge/checkpoint dosya adı sınıflandırıcıları artık
  Doctor eski oturum dosyası modülünde yaşar. Çekirdek oturum doğrulaması artık normal SQLite
  oturum kimliklerine karar vermek için dosya yapıtı yardımcılarını içe aktarmaz.
- Active Memory engelleyici alt ajan çalıştırmaları, Plugin durumu altında
  geçici veya kalıcı `session.jsonl` dosyaları oluşturmak yerine SQLite transkript satırlarını kullanır. Eski
  `transcriptDir` seçeneği kaldırıldı.
- Tek seferlik slug üretimi ve Crestodian planlayıcı çalıştırmaları, geçici
  `session.jsonl` dosyaları oluşturmak yerine SQLite transkript satırlarını kullanır.
- `llm-task` yardımcı çalıştırmaları ve gizli taahhüt çıkarımı da SQLite
  transkript satırlarını kullanır; bu yüzden yalnızca model kullanılan bu yardımcı oturumlar artık
  geçici JSON/JSONL transkript dosyaları oluşturmaz.
- `TranscriptSessionManager` artık yalnızca açılmış bir SQLite transkript kapsamıdır.
  Runtime kodu bunu `openTranscriptSessionManagerForSession({agentId,
sessionId})` ile açar; oluşturma, dallandırma, devam ettirme, listeleme ve çatallama akışları
  statik yönetici cepheleri yerine sahip oldukları SQLite satır yardımcılarında yaşar.
  Doctor/içe aktarma/hata ayıklama kodu, runtime oturum yöneticisi dışında açık eski kaynak dosyaları
  işler.
- Bayat `SessionManager.newSession()` ve
  `SessionManager.createBranchedSession()` cephe yöntemleri kaldırıldı. Yeni
  oturumlar ve transkript alt öğeleri, zaten açık bir yöneticiyi farklı bir
  kalıcı oturuma dönüştürmek yerine sahip oldukları SQLite iş akışı tarafından oluşturulur.
- Üst transkript çatallama kararları ve çatal oluşturma artık
  `storePath` veya `sessionsDir` kabul etmez; tutulmuş dosya sistemi yolu meta verileri yerine
  `{agentId, sessionId}` SQLite transkript kapsamını kullanır.
- Memory-host artık no-op oturum dizini transkript sınıflandırma
  yardımcılarını dışa aktarmaz; transkript filtreleme artık girdi oluşturma sırasında SQLite satır
  meta verilerinden türetilir.
- Memory-host ve QMD oturum dışa aktarma testleri SQLite transkript kapsamlarını kullanır. Eski
  `agents/<agentId>/sessions/*.jsonl` yolları yalnızca bir test bilerek Doctor/içe aktarma/dışa aktarma
  uyumluluğunu kanıtladığında kapsamda kalır.
- QA-lab ham oturum incelemesi artık Gateway üzerinden `sessions.list` kullanır
  `agents/qa/sessions/sessions.json` okumak yerine; MSteams geri bildirimi,
  JSONL yolu uydurmadan doğrudan SQLite transkriptlerine ekler.
- Paylaşılan gelen kanal dönüşleri artık eski bir `storePath` yerine
  `{agentId, sessionKey}` taşır. LINE, WhatsApp, Slack, Discord, Telegram,
  Matrix, Signal, iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch ve QQBot kayıt yolları artık updated-at meta verilerini okur ve gelen
  oturum satırlarını SQLite kimliği üzerinden kaydeder.
- Transkript konum belirleyici kalıcılığı etkin oturum satırlarından kaldırıldı.
  `resolveSessionTranscriptTarget`, `agentId`, `sessionId` ve isteğe bağlı
  konu meta verilerini döndürür; eski transkript dosya adlarını içe aktaran tek
  kod doctor'dır.
- Çalışma zamanı transkript başlıkları SQLite sürümü `1` ile başlar. Eski JSONL V1/V2/V3
  biçim yükseltmeleri yalnızca doctor içe aktarmasında yaşar ve içe aktarılan başlıkları,
  satırlar depolanmadan önce geçerli SQLite transkript sürümüne normalleştirir.
- Veritabanı-öncelikli koruma artık `SessionManager.listAll` ve
  `SessionManager.forkFromSession` kullanımını yasaklar; oturum listeleme ve
  fork/geri yükleme iş akışları satır/kapsamlı SQLite API'lerinde kalmalıdır.
- Koruma ayrıca doctor/içe aktarma kodu dışında eski transkript JSONL ayrıştırma/etkin dal
  onarım yardımcı adlarını da yasaklar; böylece çalışma zamanı ikinci bir eski
  transkript geçiş yolu geliştiremez.
- Gömülü PI çalıştırmaları gelen transkript tanıtıcılarını reddeder. Worker başlatılmadan
  önce ve deneme transkript durumuna dokunmadan önce tekrar SQLite
  `{agentId, sessionId}` kimliğini kullanırlar. Eski bir `/tmp/*.jsonl` girdisi
  çalışma zamanı yazma hedefi seçemez.
- Önbellek izi, Anthropic yükü, ham akış ve tanılama zaman çizelgesi kayıtları
  artık türlendirilmiş SQLite `diagnostic_events` satırlarına yazılır. Gateway kararlılık
  paketleri artık türlendirilmiş SQLite `diagnostic_stability_bundles` satırlarına
  yazılır. Eski `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` ve
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` JSONL geçersiz kılma yolları kaldırıldı ve
  normal kararlılık yakalama artık `logs/stability/*.json` dosyaları yazmaz.
- Cron kalıcılığı artık her kaydetmede tüm iş tablosunu silip yeniden eklemek yerine
  SQLite `cron_jobs` satırlarını uzlaştırır. Plugin hedefi geri yazımları eşleşen
  Cron satırlarını doğrudan günceller ve çalışma zamanı Cron durumunu aynı durum
  veritabanı işlemi içinde tutar.
- Cron çalışma zamanı çağırıcıları artık kararlı bir SQLite Cron depo anahtarı kullanır. Eski
  `cron.store` yolları yalnızca doctor içe aktarma girdileridir; üretim Gateway'i, görev
  bakımı, durum, çalışma günlüğü ve Telegram hedef geri yazma yolları
  `resolveCronStoreKey` kullanır ve artık anahtarı yol olarak normalleştirmez. Cron durumu artık
  eski dosya biçimli `storePath` alanı yerine `storeKey` bildirir.
- Cron çalışma zamanı yükleme ve zamanlama artık `jobId`, `schedule.cron`, sayısal
  `atMs`, dize boole değerleri veya eksik `sessionTarget` gibi eski kalıcı iş
  biçimlerini normalleştirmez. Doctor eski içe aktarma, satırlar SQLite'a eklenmeden önce
  bu onarımlara sahip olur.
- ACP spawn artık transkript JSONL dosya yollarını çözmez veya kalıcılaştırmaz. Spawn
  ve thread-bind kurulumu SQLite oturum satırını doğrudan kalıcılaştırır ve oturum
  kimliğini tutulan transkript kimliği olarak korur.
- ACP oturum meta veri API'leri artık SQLite satırlarını `agentId` ile okur/listeler/upsert eder
  ve artık ACP oturum girdisi sözleşmesinin parçası olarak `storePath` açığa çıkarmaz.
- Oturum kullanım muhasebesi ve Gateway kullanım toplaması artık transkriptleri yalnızca
  `{agentId, sessionId}` ile çözer. Maliyet/kullanım önbelleği ve keşfedilen oturum
  özetleri artık transkript konum belirleyici dizeleri üretmez veya döndürmez.
- Gateway sohbet ekleme, kısmi iptal kalıcılığı, `/sessions.send` ve
  webchat medya transkript yazmaları doğrudan SQLite transkript kapsamı üzerinden ekler.
  Gateway transkript enjeksiyon yardımcısı artık `transcriptLocator` parametresi kabul etmez.
- SQLite transkript keşfi artık yalnızca transkript kapsamlarını ve istatistiklerini listeler:
  `{agentId, sessionId, updatedAt, eventCount}`. Kullanılmayan
  `listSqliteSessionTranscriptLocators` uyumluluk yardımcısı ve satır başına
  `locator` alanı kaldırıldı.
- Transkript onarım çalışma zamanı artık yalnızca
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})` açığa çıkarır. Eski
  konum belirleyici tabanlı onarım yardımcısı silindi; doctor/debug kodu açık
  kaynak dosya yollarını okur ve konum belirleyici dizelerini asla taşımaz.
- ACP replay defteri çalışma zamanı artık oturum başına replay satırlarını
  `acp/event-ledger.json` yerine paylaşılan SQLite durum veritabanında depolar; doctor
  eski dosyayı içe aktarır ve kaldırır.
- Gateway transkript okuyucu yardımcıları artık eski `session-utils.fs` modül adı yerine
  `src/gateway/session-transcript-readers.ts` içinde yaşar. Yedek yeniden deneme geçmişi
  kontrolü, eski dosya-yardımcısı yüzeyi yerine SQLite transkript içeriğine göre adlandırılır.
- Gateway enjekte edilen sohbet ve Compaction yardımcıları artık iç yardımcı API'leri
  üzerinden SQLite transkript kapsamını geçirir; değerleri transkript yolları veya
  kaynak dosyalar olarak adlandırmaz.
- Bootstrap devam algılama artık SQLite transkript satırlarını
  `hasCompletedBootstrapTranscriptTurn` üzerinden denetler; artık dosya biçimli bir
  yardımcı adı açığa çıkarmaz.
- Gömülü çalıştırıcı testleri artık SQLite transkript kimliği kullanır ve yeni bir
  transkript yöneticisi açmak her zaman açık bir `sessionId` gerektirir.
- Bellek dizinleme yardımcıları artık uçtan uca SQLite transkript terminolojisini kullanır:
  host `listSessionTranscriptScopesForAgent` ve
  `sessionTranscriptKeyForScope` dışa aktarır, hedefli eşitleme kuyrukları
  `sessionTranscripts` kullanır, herkese açık oturum arama sonuçları opak
  `transcript:<agent>:<session>` yolları açığa çıkarır ve dahili DB kaynak anahtarı,
  sahte bir dosya yolu yerine `source_kind='sessions'` altında `session:<session>` olur.
- Genel Plugin SDK kalıcı dedupe yardımcısı artık dosya biçimli seçenekler açığa çıkarmaz.
  Çağırıcılar SQLite kapsam anahtarları sağlar ve kalıcı dedupe satırları paylaşılan
  Plugin durumunda yaşar.
- Microsoft Teams SSO token'ları kilitli JSON dosyalarından SQLite Plugin durumuna taşındı.
  Doctor `msteams-sso-tokens.json` dosyasını içe aktarır, yüklerden kanonik SSO token
  anahtarlarını yeniden oluşturur ve kaynak dosyayı kaldırır. Yetki devredilmiş OAuth
  token'ları mevcut özel kimlik bilgisi dosyası sınırında kalır.
- Matrix eşitleme önbelleği durumu `bot-storage.json` dosyasından SQLite Plugin durumuna
  taşındı. Doctor eski ham veya sarmalanmış eşitleme yüklerini içe aktarır ve kaynak
  dosyayı kaldırır. Etkin Matrix ve QA Matrix istemcileri sahte bir `sync-store.json`
  veya `bot-storage.json` yolu değil, SQLite eşitleme deposu kök dizini geçirir.
- Matrix eski kripto geçiş durumu `legacy-crypto-migration.json` dosyasından SQLite Plugin
  durumuna taşındı. Doctor eski durum dosyasını içe aktarır; Matrix SDK IndexedDB
  anlık görüntüleri `crypto-idb-snapshot.json` dosyasından SQLite Plugin blob'larına taşındı.
  Matrix kurtarma anahtarları ve kimlik bilgileri SQLite Plugin durumu satırlarıdır; eski
  JSON dosyaları yalnızca doctor geçiş girdileridir.
- Memory Wiki etkinlik günlükleri artık `.openclaw-wiki/log.jsonl` yerine SQLite Plugin
  durumu kullanır. Memory Wiki geçiş sağlayıcısı eski JSONL günlüklerini içe aktarır;
  wiki markdown ve kullanıcı kasa içeriği çalışma alanı içeriği olarak dosya destekli kalır.
- Memory Wiki artık `.openclaw-wiki/state.json` veya kullanılmayan
  `.openclaw-wiki/locks` dizinini oluşturmaz. Geçiş sağlayıcısı, daha eski bir kasada
  hâlâ varsa bu kullanımdan kaldırılmış Plugin meta veri dosyalarını kaldırır.
- Crestodian denetim girdileri artık `audit/crestodian.jsonl` yerine çekirdek SQLite
  Plugin durumunu kullanır. Doctor eski JSONL denetim günlüğünü içe aktarır ve başarılı
  içe aktarmadan sonra kaldırır.
- Config yazma/gözlemleme denetim girdileri artık `logs/config-audit.jsonl` yerine
  çekirdek SQLite Plugin durumunu kullanır. Doctor eski JSONL denetim günlüğünü içe
  aktarır ve başarılı içe aktarmadan sonra kaldırır.
- macOS companion artık `openclaw.json` düzenlerken uygulama yerel
  `logs/config-audit.jsonl` veya `logs/config-health.json` yan dosyaları yazmaz. Config
  dosyası dosya destekli kalır, kurtarma anlık görüntüleri config dosyasının yanında kalır
  ve kalıcı config denetim/sağlık durumu Gateway SQLite deposuna aittir.
- Crestodian kurtarma bekleyen onayları artık `crestodian/rescue-pending/*.json` yerine
  çekirdek SQLite Plugin durumunu kullanır. Doctor eski bekleyen onay dosyalarını içe
  aktarır ve başarılı içe aktarmadan sonra kaldırır.
- Phone Control geçici arm durumu artık `plugins/phone-control/armed.json` yerine SQLite
  Plugin durumunu kullanır. Doctor eski arm-durumu dosyasını `phone-control/arm-state`
  ad alanına içe aktarır ve dosyayı kaldırır.
- Doctor artık JSONL transkriptlerini yerinde onarmaz veya yedek JSONL dosyaları oluşturmaz.
  Etkin dalı SQLite'a içe aktarır ve eski kaynağı kaldırır.
- Oturum belleği hook transkript araması `{agentId, sessionId}` kapsamına özel SQLite
  okumaları kullanır. Yardımcısı artık transkript konum belirleyicilerini, eski dosya
  okumalarını veya dosya-yeniden yazma seçeneklerini kabul etmez ya da türetmez.
- Codex app-server konuşma bağlamaları artık SQLite Plugin durumunu OpenClaw oturum
  anahtarı veya açık `{agentId, sessionId}` kapsamı ile anahtarlar. Transkript-yolu
  yedek bağlamalarını korumamalıdır.
- Codex app-server yansıtılmış-geçmiş okumaları yalnızca SQLite transkript kapsamını kullanır;
  kimliği transkript dosya yollarından kurtarmamalıdır.
- Rol sıralama ve Compaction sıfırlama yolları artık eski transkript dosyalarını unlink etmez;
  sıfırlama yalnızca SQLite oturum satırını ve transkript kimliğini döndürür.
- Gateway sıfırlama ve checkpoint yanıtları temiz oturum satırları ile oturum kimlikleri
  döndürür. Artık istemciler için SQLite transkript konum belirleyicileri üretmez.
- Bellek-çekirdeği Dreaming artık eksik JSONL dosyalarını yoklayarak oturum satırlarını
  budamaz. Subagent temizliği, dosya sistemi varlık kontrolleri yerine oturum çalışma zamanı
  API'si üzerinden gider. Transkript-alım testleri, `agents/<id>/sessions` fixture'ları
  veya konum belirleyici yer tutucuları oluşturmak yerine SQLite satırlarını doğrudan eker.
- Bellek transkript dizinleme, alıntı/okuma yardımcıları için sanal arama sonucu yolu olarak
  `transcript:<agentId>:<sessionId>` açığa çıkarabilir. Kalıcı dizin kaynağı ilişkisel
  olduğundan (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), değer bir çalışma zamanı transkript konum belirleyicisi
  değildir, dosya sistemi yolu değildir ve asla oturum çalışma zamanı API'lerine geri
  geçirilmemelidir.
- Gateway doctor bellek durumu, kısa vadeli hatırlama ve phase-signal sayılarını
  `memory/.dreams/*.json` yerine SQLite Plugin durumu satırlarından okur; CLI ve
  doctor çıktısı artık bu depolamayı yol değil SQLite deposu olarak etiketler.
- Bellek-çekirdeği çalışma zamanı, CLI durumu, Gateway doctor yöntemleri ve Plugin SDK
  facade'ları artık eski `.dreams/session-corpus` dosyalarını denetlemez veya arşivlemez.
  Bu dosyalar yalnızca geçiş girdileridir; doctor bunları SQLite'a içe aktarır ve doğrulamadan
  sonra kaynağı siler. Etkin oturum-alım kanıt satırları artık sanal SQLite yolu
  `memory/session-ingestion/<day>.txt` kullanır; çalışma zamanı asla
  `.dreams/session-corpus` üzerinden durum yazmaz veya türetmez.
- Bellek-çekirdeği herkese açık yapıtları SQLite host olaylarını sanal JSON yapıtı
  `memory/events/memory-host-events.json` olarak açığa çıkarır; artık eski
  `.dreams/events.jsonl` kaynak yolunu yeniden kullanmaz.
- Sandbox container/tarayıcı kayıtları artık türlendirilmiş oturum, image, zaman damgası,
  backend/config ve tarayıcı portu sütunlarına sahip paylaşılan
  `sandbox_registry_entries` SQLite tablosunu kullanır. Doctor eski monolitik ve parçalı
  JSON kayıt dosyalarını içe aktarır ve başarılı kaynakları kaldırır. Çalışma zamanı
  okumaları doğruluk kaynağı olarak türlendirilmiş satır sütunlarını kullanır; `entry_json`
  yalnızca replay/debug kopyasıdır.
- Commitments artık tüm depoyu kapsayan JSON blob'u yerine türlendirilmiş paylaşılan
  `commitments` tablosunu kullanır. Anlık görüntü kaydetmeleri commitment kimliğine göre
  upsert eder ve tabloyu temizleyip yeniden eklemek yerine yalnızca eksik satırları siler.
  Çalışma zamanı commitment'ları türlendirilmiş kapsam, teslimat penceresi, durum, deneme
  ve metin sütunlarından yükler; `record_json` yalnızca replay/debug kopyasıdır. Doctor
  eski `commitments.json` dosyasını içe aktarır ve başarılı içe aktarmadan sonra kaldırır.
- Cron iş tanımları, zamanlama durumu ve çalışma geçmişi artık çalışma zamanı JSON
  yazıcılarına veya okuyucularına sahip değildir. Çalışma zamanı türlendirilmiş zamanlamaya sahip
  `cron_jobs` satırlarını kullanır,
  yük, teslim, arıza-uyarısı, oturum, durum ve çalışma-zamanı-durumu sütunları ile durum, tanılama özeti, teslim durumu/hatası,
  oturum/çalıştırma, model ve token toplamları için türlendirilmiş
  `cron_run_logs` üst verileri. `job_json` yalnızca bir yeniden oynatma/hata ayıklama kopyasıdır; `state_json`, henüz sıcak sorgu alanları olmayan iç içe çalışma zamanı tanılamalarını tutarken, çalışma zamanı
  sıcak durum alanlarını türlendirilmiş sütunlardan yeniden yükler. Doktor,
  eski `jobs.json`, `jobs-state.json` ve `runs/*.jsonl` dosyalarını içe aktarır ve
  içe aktarılan kaynakları kaldırır. Plugin hedef geri yazımları, tüm cron deposunu yükleyip değiştirmek yerine eşleşen `cron_jobs`
  satırlarını günceller.
- Gateway başlangıcı, çalışma zamanı projeksiyonundaki eski `notify: true` işaretlerini yok sayar. Doktor, `cron.webhook` geçerliyse bunları açık SQLite teslimine çevirir, ayarlanmamışsa etkisiz işaretleri kaldırır ve yapılandırılmış webhook geçersizse
  bunları bir uyarıyla korur.
- Giden ve oturum teslim kuyrukları artık kuyruk durumunu, giriş türünü,
  oturum anahtarını, kanalı, hedefi, hesap kimliğini, yeniden deneme sayısını, son deneme/hatayı,
  kurtarma durumunu ve platform-gönderim işaretlerini paylaşılan
  `delivery_queue_entries` tablosunda türlendirilmiş sütunlar olarak saklıyor. Çalışma zamanı kurtarması bu sıcak alanları
  türlendirilmiş sütunlardan okur ve yeniden deneme/kurtarma mutasyonları, yeniden oynatma JSON'unu yeniden yazmadan bu sütunları doğrudan
  günceller. Tam JSON yükü yalnızca ileti gövdeleri ve diğer soğuk yeniden oynatma verileri için
  yeniden oynatma/hata ayıklama blob'u olarak kalır.
- Yönetilen giden görüntü kayıtları artık medya baytları hâlâ
  `media_blobs` içinde saklanırken türlendirilmiş paylaşılan
  `managed_outgoing_image_records` satırlarını kullanıyor. JSON kaydı yalnızca bir yeniden oynatma/hata ayıklama kopyası olarak kalır.
- Discord model seçici tercihleri, komut dağıtım hash'leri ve iş parçacığı bağlamaları
  artık paylaşılan SQLite Plugin durumunu kullanıyor. Eski JSON içe aktarma planları çekirdek geçiş kodunda değil,
  Discord Plugin kurulum/doktor geçiş yüzeyinde yaşar.
- Plugin eski içe aktarma algılayıcıları
  `doctor-legacy-state.ts` veya `doctor-state-imports.ts` gibi doktor adlı modülleri kullanır; normal kanal çalışma zamanı
  modülleri eski JSON algılayıcılarını içe aktarmamalıdır.
- BlueBubbles yakalama imleçleri ve gelen tekilleştirme işaretleri artık paylaşılan SQLite
  Plugin durumunu kullanıyor. Eski JSON içe aktarma planları çekirdek geçiş kodunda değil, BlueBubbles Plugin
  kurulum/doktor geçiş yüzeyinde yaşar.
- Telegram güncelleme ofsetleri, çıkartma önbelleği satırları, gönderilen-ileti önbelleği satırları,
  konu-adı önbelleği satırları ve iş parçacığı bağlamaları artık paylaşılan SQLite Plugin
  durumunu kullanıyor. Eski JSON içe aktarma planları çekirdek geçiş kodunda değil, Telegram Plugin
  kurulum/doktor geçiş yüzeyinde yaşar.
- iMessage yakalama imleçleri, yanıt kısa-kimlik eşlemeleri ve gönderilen-yankı tekilleştirme satırları
  artık paylaşılan SQLite Plugin durumunu kullanıyor. Eski `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` ve `imessage/sent-echoes.jsonl` dosyaları
  yalnızca doktor girdileridir.
- Feishu ileti tekilleştirme satırları artık
  `feishu/dedup/*.json` dosyaları yerine paylaşılan SQLite Plugin durumunu kullanıyor. Eski JSON içe aktarma planı çekirdek geçiş kodunda değil, Feishu
  Plugin kurulum/doktor geçiş yüzeyinde yaşar.
- Microsoft Teams konuşmaları, anketleri, bekleyen yükleme tamponları ve geri bildirim
  öğrenimleri artık paylaşılan SQLite Plugin durum/blob tablolarını kullanıyor. Bekleyen yükleme
  yolu `plugin_blob_entries` kullanır, böylece medya tamponları base64 JSON yerine SQLite BLOB'ları olarak
  saklanır. Çalışma zamanı yardımcı adları artık `*-fs` dosya deposu adlandırması yerine SQLite/durum adlandırmasını
  kullanıyor ve eski `storePath` shim'i bu depolardan kaldırıldı.
  Eski JSON içe aktarma planı Microsoft Teams
  Plugin kurulum/doktor geçiş yüzeyinde yaşar.
- Zalo barındırılan giden medyası artık `openclaw-zalo-outbound-media` JSON/bin geçici yan dosyaları yerine paylaşılan SQLite `plugin_blob_entries`
  kullanıyor.
- Fark görüntüleyici HTML'i ve üst verileri artık `meta.json`/`viewer.html` geçici dosyaları yerine paylaşılan SQLite `plugin_blob_entries`
  kullanıyor. Oluşturulan PNG/PDF çıktıları geçici somutlaştırmalar olarak kalır
  çünkü kanal teslimi hâlâ bir dosya yolu gerektirir.
- Canvas yönetilen belgeleri artık varsayılan `state/canvas/documents` dizini yerine paylaşılan SQLite `plugin_blob_entries`
  kullanıyor. Canvas sunucusu bu blob'ları doğrudan sunar; yerel dosyalar yalnızca açık `host.root`
  operatör içeriği için veya aşağı akış medya okuyucusu bir yol gerektirdiğinde geçici somutlaştırma için
  oluşturulur.
- File Transfer denetim kararları artık sınırsız `audit/file-transfer.jsonl` çalışma zamanı günlüğü yerine paylaşılan SQLite `plugin_state_entries`
  kullanıyor. Doktor, eski JSONL denetim dosyasını Plugin durumuna
  içe aktarır ve temiz bir içe aktarmadan sonra kaynağı kaldırır.
- ACPX süreç kiralamaları ve gateway örneği kimliği artık paylaşılan SQLite Plugin
  durumunu kullanıyor. Doktor, eski `gateway-instance-id` dosyasını Plugin durumuna
  içe aktarır ve kaynağı kaldırır.
- ACPX tarafından oluşturulan sarmalayıcı betikleri ve yalıtılmış Codex home, kalıcı OpenClaw durumu değil,
  OpenClaw geçici kökü altında geçici somutlaştırmadır. Kalıcı ACPX çalışma zamanı kayıtları SQLite kiralama ve gateway-instance satırlarıdır;
  eski ACPX `stateDir` yapılandırma yüzeyi kaldırıldı çünkü artık oraya çalışma zamanı durumu
  yazılmıyor.
- Gateway medya ekleri artık kanonik bayt deposu olarak paylaşılan `media_blobs` SQLite tablosunu
  kullanıyor. Kanal ve sandbox uyumluluk yüzeylerine döndürülen yerel yollar,
  kalıcı medya deposu değil, veritabanı satırının geçici somutlaştırmalarıdır. Çalışma zamanı medya izin listeleri artık eski
  `$OPENCLAW_STATE_DIR/media` veya yapılandırma dizini `media` köklerini içermez; bu dizinler
  yalnızca doktor içe aktarma kaynaklarıdır.
- Kabuk tamamlama artık `$OPENCLAW_STATE_DIR/completions/*` önbellek
  dosyaları yazmıyor. Kurulum, doktor, güncelleme ve sürüm smoke yolları, kalıcı tamamlama önbellek
  dosyaları yerine oluşturulan tamamlama çıktısını veya profil kaynaklamayı kullanır.
- Gateway skill-upload hazırlaması artık paylaşılan `skill_uploads` satırlarını kullanıyor. Yükleme
  üst verileri, idempotency anahtarları ve arşiv baytları SQLite içinde yaşar; yükleyici
  yalnızca bir kurulum çalışırken geçici olarak somutlaştırılmış bir arşiv yolu
  alır.
- Alt ajan satır içi ekleri artık çalışma alanı
  `.openclaw/attachments/*` altında somutlaştırılmıyor. Başlatma yolu SQLite VFS tohum girişleri hazırlar,
  satır içi çalıştırmalar bu girişleri ajan başına çalışma zamanı scratch ad alanına tohumlar
  ve disk destekli araçlar ek yolları için bu SQLite scratch alanını bindirir. Eski alt ajan çalıştırma ek-dizini kayıt sütunları ve temizleme hook'ları kaldırıldı.
- CLI görüntü hidratasyonu artık kararlı `openclaw-cli-images` önbellek
  dosyalarını korumuyor. Harici CLI arka uçları hâlâ dosya yolları alır, ancak bu yollar
  temizleme ile çalıştırma başına geçici somutlaştırmalardır.
- Önbellek izleme tanılamaları, Anthropic yük tanılamaları, ham model akışı
  tanılamaları, tanılama zaman çizelgesi olayları ve Gateway kararlılık paketleri artık
  `logs/*.jsonl` veya `logs/stability/*.json` dosyaları yerine SQLite satırları
  yazar.
  Çalışma zamanı yol geçersiz kılma bayrakları ve env var'ları kaldırıldı; dışa aktarma/hata ayıklama
  komutları dosyaları veritabanı satırlarından açıkça somutlaştırabilir.
- macOS companion artık dönen bir `diagnostics.jsonl` yazıcısına sahip değil. Uygulama
  günlükleri unified logging'e gider ve kalıcı Gateway tanılamaları SQLite destekli kalır.
- macOS port-koruyucu kayıt listesi artık Application Support JSON dosyası
  veya opak singleton blob yerine türlendirilmiş paylaşılan SQLite
  `macos_port_guardian_records` satırlarını kullanıyor.
- Gateway singleton kilitleri artık geçici dizin kilit dosyaları yerine
  `gateway_locks` kapsamı altında türlendirilmiş paylaşılan SQLite `state_leases` satırlarını kullanıyor. Fly ve OAuth
  sorun giderme dokümanları artık eski dosya-kilidi temizliği yerine SQLite kiralama/auth yenileme kilidine
  işaret ediyor.
- Gateway yeniden başlatma sentinel durumu artık `restart-sentinel.json` yerine türlendirilmiş paylaşılan SQLite
  `gateway_restart_sentinel` satırlarını kullanıyor; çalışma zamanı
  sentinel türünü, durumunu, yönlendirmeyi, iletiyi, devamı ve istatistikleri
  türlendirilmiş sütunlardan okur. `payload_json` yalnızca bir yeniden oynatma/hata ayıklama kopyasıdır. Çalışma zamanı kodu
  SQLite satırını doğrudan temizler ve artık dosya temizleme tesisatı taşımaz.
- Gateway yeniden başlatma niyeti ve supervisor handoff durumu artık
  `gateway-restart-intent.json` ve
  `gateway-supervisor-restart-handoff.json` yan dosyaları yerine türlendirilmiş paylaşılan
  `gateway_restart_intent` ve `gateway_restart_handoff` satırlarını kullanıyor.
- Gateway singleton koordinasyonu artık `gateway.<hash>.lock` dosyaları yazmak yerine
  `gateway_locks` altında türlendirilmiş `state_leases` satırlarını kullanıyor. Kiralama satırı
  kilit sahibini, süre sonunu, heartbeat'i ve hata ayıklama yükünü sahiplenir; SQLite
  atomik edinme/bırakma sınırını sahiplenir. Kullanımdan kaldırılan dosya-kilidi dizini seçeneği
  kaldırıldı; testler SQLite satır kimliğini doğrudan kullanır.
- `cron/runs/*.jsonl` dosyalarını tarayan eski, başvurulmayan cron kullanım-raporu yardımcısı silindi. Cron çalıştırma geçmişi raporları türlendirilmiş
  `cron_run_logs` SQLite satırlarını okumalıdır.
- Ana oturum yeniden başlatma kurtarması artık `agents/*/sessions`
  dizinlerini taramak yerine aday ajanları SQLite `agent_databases` kayıt defteri üzerinden keşfediyor.
- Gemini oturum bozulması kurtarması artık yalnızca SQLite oturum satırını siler;
  artık eski bir `storePath` kapısına ihtiyaç duymaz veya türetilmiş
  transcript JSONL yolunun bağlantısını kaldırmaya çalışmaz.
- Yol geçersiz kılma işleme artık değişmez `undefined`/`null` ortam
  değerlerini ayarlanmamış olarak ele alır; bu, testler veya kabuk devirleri sırasında yanlışlıkla repo kökü `undefined/state/*.sqlite`
  veritabanlarının oluşmasını önler.
- Yapılandırma sağlığı parmak izleri artık `logs/config-health.json` yerine türlendirilmiş paylaşılan SQLite `config_health_entries`
  satırlarını kullanıyor ve normal yapılandırma dosyasını tek kimlik bilgisi dışı yapılandırma belgesi olarak tutuyor. macOS companion yalnızca
  süreç-yerel sağlık durumunu tutar ve eski JSON yan dosyasını yeniden oluşturmaz.
- Auth profili çalışma zamanı artık kimlik bilgisi JSON dosyalarını içe aktarmıyor veya yazmıyor. Kanonik kimlik bilgisi deposu SQLite'tır; `auth-profiles.json`, ajan başına
  `auth.json` ve paylaşılan `credentials/oauth.json`, içe aktarmadan sonra kaldırılan
  doktor geçiş girdileridir.
- Auth profili kaydetme/durum testleri artık türlendirilmiş SQLite auth tablolarını doğrudan
  doğrular ve eski auth-profile dosya adlarını yalnızca doktor geçiş girdileri için kullanır.
- `openclaw secrets apply` yalnızca yapılandırma dosyasını, env dosyasını ve SQLite
  auth-profile deposunu temizler. Artık kullanımdan kaldırılmış ajan başına `auth.json` dosyasını düzenleyen uyumluluk mantığını taşımaz;
  doktor bu dosyayı içe aktarmayı ve silmeyi sahiplenir.
- Hermes secret geçiş planları ve uygulamaları, içe aktarılan API-key profillerini doğrudan
  SQLite auth-profile deposuna aktarır. Artık ara hedef olarak
  `auth-profiles.json` yazmaz veya doğrulamaz.
- Kullanıcıya yönelik auth dokümanları artık
  kullanıcılara `auth-profiles.json` dosyasını incelemelerini veya kopyalamalarını söylemek yerine
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` öğesini açıklar; eski OAuth/auth JSON
  adları yalnızca doktor-içe aktarma girdileri olarak belgelenmiş kalır.
- Çekirdek durum-yolu yardımcıları artık kullanımdan kaldırılmış `credentials/oauth.json`
  dosyasını açığa çıkarmaz. Eski dosya adı doktor auth içe aktarma yoluna yereldir.
- Kurulum, güvenlik, onboarding, model-auth ve SecretRef dokümanları artık
  ajan başına auth-profile JSON dosyaları yerine SQLite auth-profile satırlarını ve tüm-durum yedekleme/geçişini açıklar.
- PI model keşfi artık kanonik kimlik bilgilerini bellek içi
  `pi-coding-agent` auth depolamasına geçirir. Keşif sırasında artık
  ajan başına `auth.json` oluşturmaz, temizlemez veya yazmaz.
- Voice Wake tetikleyicisi ve yönlendirme ayarları artık `settings/voicewake.json`, `settings/voicewake-routing.json` veya
  opak genel satırlar yerine türlendirilmiş paylaşılan SQLite tablolarını kullanıyor; doktor eski JSON dosyalarını içe aktarır ve başarılı bir
  geçişten sonra bunları kaldırır.
- Güncelleme-denetimi durumu artık `update-check.json` veya opak genel blob yerine türlendirilmiş paylaşılan bir `update_check_state` satırı kullanıyor; doktor
  eski JSON dosyasını içe aktarır ve başarılı bir geçişten sonra kaldırır.
- Yapılandırma sağlığı durumu artık `logs/config-health.json` veya opak genel blob yerine türlendirilmiş paylaşılan `config_health_entries` satırlarını kullanıyor; doktor
  eski JSON dosyasını içe aktarır ve başarılı bir geçişten sonra kaldırır.
- Plugin konuşma bağlama onayları artık opak paylaşılan SQLite durumu veya yerine türlendirilmiş
  `plugin_binding_approvals` satırlarını kullanıyor
  `plugin-binding-approvals.json`; eski dosya bir doctor migrasyon girdisidir.
- Genel geçerli konuşma bağlamaları artık
  `bindings/current-conversations.json` dosyasını yeniden yazmak yerine tipli
  `current_conversation_bindings` satırları depolar; doctor eski JSON dosyasını içe aktarır ve
  başarılı bir migrasyondan sonra kaldırır.
- Memory Wiki içe aktarılan kaynak eşitleme defterleri artık
  `.openclaw-wiki/source-sync.json` dosyasını yeniden yazmak yerine kasa/kaynak anahtarı başına bir SQLite Plugin durumu satırı depolar;
  migrasyon sağlayıcısı eski JSON defterini içe aktarır ve kaldırır.
- Memory Wiki ChatGPT içe aktarma çalıştırma kayıtları artık
  `.openclaw-wiki/import-runs/*.json` dosyasına yazmak yerine kasa/çalıştırma kimliği başına bir SQLite Plugin durumu satırı depolar.
  Geri alma anlık görüntüleri, içe aktarma çalıştırması anlık görüntü
  arşivleme blob depolamaya taşınana kadar açık kasa dosyaları olarak kalır.
- Memory Wiki derlenmiş özetleri artık
  `.openclaw-wiki/cache/agent-digest.json` ve
  `.openclaw-wiki/cache/claims.jsonl` dosyalarına yazmak yerine SQLite Plugin blob satırları depolar. Migrasyon sağlayıcısı eski önbellek
  dosyalarını içe aktarır ve önbellek dizini boşaldığında kaldırır.
- ClawHub skill kurulum izleme artık çalışma zamanında
  `.clawhub/lock.json` ve
  `.clawhub/origin.json` yan dosyalarını yazmak veya okumak yerine çalışma alanı/skill başına bir SQLite Plugin durumu satırı depolar. Çalışma zamanı kodu, dosya biçimli kilit dosyası/kaynak soyutlamaları yerine izlenen kurulum
  durumu nesnelerini kullanır. Doctor, yapılandırılmış ajan çalışma alanlarından eski yan dosyaları
  içe aktarır ve temiz bir içe aktarmadan sonra kaldırır.
- Kurulu Plugin dizini artık `plugins/installs.json` yerine tipli paylaşılan SQLite
  `installed_plugin_index` tekil satırını okur ve yazar; eski
  JSON dosyası yalnızca bir doctor migrasyon girdisidir ve içe aktarmadan sonra kaldırılır.
- Eski `plugins/installs.json` yol yardımcısı artık doctor eski kodunda
  yaşar. Çalışma zamanı Plugin dizini modülleri, JSON dosya yolu değil, yalnızca SQLite destekli kalıcılık
  seçenekleri sunar.
- Gateway yeniden başlatma işaretçisi, yeniden başlatma niyeti ve süpervizör devir durumu artık genel
  opak bloblar yerine tipli paylaşılan SQLite satırlarını (`gateway_restart_sentinel`,
  `gateway_restart_intent` ve `gateway_restart_handoff`) kullanır. Çalışma zamanı yeniden başlatma kodunda dosya biçimli işaretçi/niyet/devir
  sözleşmesi yoktur.
- Matrix eşitleme önbelleği, depolama meta verileri, iş parçacığı bağlamaları, gelen tekilleştirme işaretleri,
  başlangıç doğrulama bekleme durumu, SDK IndexedDB kripto anlık görüntüleri,
  kimlik bilgileri ve kurtarma anahtarları artık paylaşılan SQLite Plugin durumu/blob
  tablolarını kullanır. Çalışma zamanı yol yapıları artık `storage-meta.json` meta veri
  yolunu sunmaz; bu dosya adı yalnızca eski bir migrasyon girdisidir. Bunların eski JSON içe aktarma
  planı Matrix Plugin kurulum/doctor migrasyon yüzeyinde yaşar.
- Matrix başlangıcı artık eski Matrix dosya
  durumunu taramaz, raporlamaz veya tamamlamaz. Matrix dosya algılama, eski kripto anlık görüntüsü oluşturma, oda anahtarı
  geri yükleme migrasyon durumu, içe aktarma ve kaynak kaldırma tamamen doctor'a aittir.
- Matrix çalışma zamanı migrasyon barrel'ları kaldırıldı. Eski durum/kripto algılama
  ve mutasyon yardımcıları, çalışma zamanı API yüzeyinin parçası olmak yerine Matrix doctor tarafından doğrudan içe aktarılır.
- Matrix migrasyon anlık görüntüsü yeniden kullanım işaretleri artık
  `matrix/migration-snapshot.json` yerine SQLite Plugin durumunda yaşar; doctor, yan durum dosyası yazmadan aynı
  doğrulanmış migrasyon öncesi arşivi yeniden kullanabilir.
- Nostr veri yolu imleçleri ve profil yayımlama durumu artık paylaşılan SQLite Plugin
  durumunu kullanır. Bunların eski JSON içe aktarma planı Nostr Plugin kurulum/doctor
  migrasyon yüzeyinde yaşar.
- Active Memory oturum anahtarları artık
  `session-toggles.json` yerine paylaşılan SQLite Plugin durumunu kullanır; belleği tekrar açmak, JSON nesnesini yeniden yazmak yerine
  satırı siler.
- Skill Workshop önerileri ve inceleme sayaçları artık çalışma alanı başına
  `skill-workshop/<workspace>.json` depoları yerine paylaşılan SQLite Plugin
  durumunu kullanır. Her öneri `skill-workshop/proposals` altında ayrı bir satırdır ve inceleme
  sayacı `skill-workshop/reviews` altında ayrı bir satırdır.
- Skill Workshop inceleyici alt ajan çalıştırmaları artık
  `skill-workshop/<sessionId>.json` yan oturum
  yolları oluşturmak yerine çalışma zamanı oturum transkript çözümleyicisini kullanır.
- ACPX süreç kiralamaları artık bütün dosya
  `process-leases.json` kayıt defteri yerine `acpx/process-leases` altında paylaşılan SQLite Plugin durumunu kullanır.
  Her kiralama kendi satırı olarak depolanır ve çalışma zamanı JSON yeniden yazma yolu olmadan başlangıçta eski süreçleri temizlemeyi
  korur.
- ACPX sarmalayıcı betikleri ve izole Codex ana dizini
  OpenClaw geçici kökünde oluşturulur. Gerektiğinde yeniden oluşturulurlar ve yedekleme veya
  migrasyon girdisi değildirler.
- Alt ajan çalıştırma kayıt defteri kalıcılığı tipli paylaşılan `subagent_runs` satırlarını kullanır. Eski
  `subagents/runs.json` yolu artık yalnızca bir doctor migrasyon girdisidir ve
  çalışma zamanı yardımcı adları artık durum katmanını disk destekli olarak tanımlamaz.
  Çalışma zamanı testleri artık kayıt defteri davranışını kanıtlamak için geçersiz veya boş `runs.json` fikstürleri oluşturmaz;
  doğrudan SQLite satırları tohumlar/okur.
- Yedekleme arşivlemeden önce durum dizinini hazırlar, veritabanı dışı dosyaları kopyalar,
  `VACUUM INTO` ile `*.sqlite` veritabanlarının anlık görüntüsünü alır, canlı WAL/SHM
  yan dosyalarını atlar, arşiv bildiriminde anlık görüntü meta verilerini kaydeder ve tamamlanmış
  yedekleme çalıştırmalarını arşiv bildirimiyle birlikte SQLite'a kaydeder. `openclaw backup
create` varsayılan olarak yazılan arşivi doğrular; `--no-verify` açık
  hızlı yoldur.
- `openclaw backup restore` çıkarma işleminden önce arşivi doğrular, doğrulayıcının
  normalize edilmiş bildirimini yeniden kullanır ve doğrulanmış bildirim varlıklarını kaydedilmiş
  kaynak yollarına geri yükler. Yazmalar için `--yes` gerektirir ve geri yükleme planı için `--dry-run`
  destekler.
- Eski yedekleme geçici yol filtresi silindi. Yedekleme artık eski oturum veya cron JSON/JSONL dosyaları için
  canlı tar atlama listesine ihtiyaç duymaz çünkü SQLite
  anlık görüntüleri arşiv oluşturulmadan önce hazırlanır.
- Düz kurulum ve onboarding çalışma alanı hazırlığı artık
  `agents/<agentId>/sessions/` dizinleri oluşturmaz. Yalnızca yapılandırma/çalışma alanı oluştururlar;
  SQLite oturum satırları ve transkript satırları, ajan başına veritabanında
  talep üzerine oluşturulur.
- Güvenlik izni onarımı artık `sessions.json` ve transkript
  JSONL dosyaları yerine genel ve ajan başına SQLite
  veritabanlarını ve WAL/SHM yan dosyalarını hedefler.
- Sandbox kayıt defteri çalışma zamanı adları artık etkin depoda eski JSON kayıt defteri terminolojisini taşımak yerine
  SQLite kayıt defteri türlerini doğrudan tanımlar.
- `openclaw reset --scope config+creds+sessions`, yalnızca eski
  `sessions/` dizinlerini değil, ajan başına
  `openclaw-agent.sqlite` veritabanlarını ve WAL/SHM yan dosyalarını kaldırır.
- Gateway birleşik oturum yardımcıları artık girdi odaklı adlar kullanır:
  `loadCombinedSessionEntriesForGateway`, `{ databasePath, entries }` döndürür.
  Eski birleşik depo adlandırması çalışma zamanı çağıranlarından kaldırıldı.
- Docker MCP kanal tohumlama artık
  `sessions.json` ve JSONL transkripti oluşturmak yerine ana oturum satırını ve transkript
  olaylarını ajan başına SQLite veritabanına yazar.
- Paketlenmiş session-memory kancası artık önceki oturum bağlamını
  SQLite'tan `{agentId, sessionId}` ile çözer. Artık transkript yollarını veya `workspace/sessions`
  dizinlerini taramaz, depolamaz veya sentezlemez.
- Paketlenmiş command-logger kancası artık komut denetim satırlarını
  `logs/commands.log` dosyasına eklemek yerine paylaşılan SQLite
  `command_log_entries` tablosuna yazar.
- Kanal eşleştirme izin listeleri artık çalışma zamanında ve Plugin SDK'da yalnızca SQLite destekli okuma/yazma yardımcıları sunar.
  Eski `*-allowFrom.json` yol çözümleyici ve
  dosya okuyucu yalnızca doctor eski içe aktarma kodu altında yaşar.
- `migration_runs`, eski durum migrasyon yürütmelerini durum,
  zaman damgaları ve JSON raporlarıyla kaydeder.
- `migration_sources`, içe aktarılan her eski dosya kaynağını hash, boyut,
  kayıt sayısı, hedef tablo, çalıştırma kimliği, durum ve kaynak kaldırma durumuyla kaydeder.
- `backup_runs`, yedekleme arşiv yollarını, durumu ve JSON bildirimlerini kaydeder.
- Genel şema kullanılmayan bir `agents` kayıt defteri tablosu tutmaz. Ajan
  veritabanı keşfi, çalışma zamanının gerçek bir ajan kaydı sahibi olana kadar kanonik `agent_databases` kayıt defteridir.
- Oluşturulan model kataloğu yapılandırması, ajan dizinine göre anahtarlanmış tipli genel SQLite
  `agent_model_catalogs` satırlarında depolanır. Çalışma zamanı çağıranları
  `ensureOpenClawModelCatalog` kullanır; çalışma zamanı kodunda `models.json` uyumluluk API'si yoktur.
  Uygulama SQLite'a yazar ve gömülü PI kayıt defteri, `models.json` dosyası oluşturmadan depolanan yükten
  beslenir.
- QMD oturum transkripti markdown dışa aktarma ve `memory.qmd.sessions` yapılandırması
  kaldırıldı. QMD transkript koleksiyonu, `qmd/sessions*` çalışma zamanı
  yolu ve dosya destekli oturum belleği köprüsü yoktur.
- Memory-core çalışma zamanı, SQLite transkript dizinleme yardımcılarını
  QMD SDK alt yolu yerine
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts` üzerinden içe aktarır. QMD alt yolu, büyük bir SDK temizliği kaldırana kadar
  harici çağıranlar için yalnızca uyumluluk yeniden dışa aktarımı tutar.
- QMD'nin kendi `index.sqlite` dosyası artık ana SQLite
  `plugin_blob_entries` tablosu tarafından desteklenen geçici bir çalışma zamanı somutlaştırmasıdır. Çalışma zamanı artık kalıcı
  `~/.openclaw/agents/<agentId>/qmd` yan deposu oluşturmaz.
- İsteğe bağlı `memory-lancedb` Plugin'i artık
  `~/.openclaw/memory/lancedb` dizinini örtük OpenClaw yönetimli depo olarak oluşturmaz. Bu, harici bir LanceDB arka ucudur ve operatör açık bir
  `dbPath` yapılandırana kadar devre dışı kalır.
- `check:database-first-legacy-stores`, eski depo adlarını yazma tarzı dosya sistemi API'leriyle eşleştiren yeni çalışma zamanı kaynağında başarısız olur.
  Ayrıca kullanımdan kaldırılmış transkript köprüsü işaretleri
  `transcriptLocator` veya `sqlite-transcript://...` öğelerini yeniden getiren çalışma zamanı
  kaynağında da başarısız olur. Migrasyon, doctor, içe aktarma
  ve açık oturum dışı dışa aktarma kodu izinli kalır. `sessionFile`, `storePath` ve eski `SessionManager` dosya dönemi
  facade'leri gibi daha geniş eski sözleşme adlarının hâlâ geçerli sahipleri vardır ve gerekli bir preflight kontrolü
  haline gelmeden önce ayrı migrasyon koruması çalışması gerektirir. Koruma artık çalışma zamanı
  `cache/*.json` depolarını, genel
  `thread-bindings.json` yan dosyalarını, cron durum/çalıştırma günlüğü JSON'unu, yapılandırma sağlık JSON'unu,
  yeniden başlatma ve kilit yan dosyalarını, Voice Wake ayarlarını, Plugin bağlama onaylarını,
  kurulu Plugin dizini JSON'unu, File Transfer denetim JSONL'ini, Memory Wiki etkinlik
  günlüklerini, eski paketlenmiş `command-logger` metin günlüğünü ve pi-mono ham akış JSONL
  tanılama düğmelerini de kapsar. Ayrıca uyumluluk kodunun `src/commands/doctor/` altında kalması için eski kök düzeyi doctor eski modül adlarını da yasaklar.
  Android hata ayıklama işleyicileri de `camera_debug.log` veya
  `debug_logs.txt` önbellek dosyaları hazırlamak yerine logcat/bellek içi çıktı kullanır.

## Hedef Şema Şekli

Şemaları açık tutun. Host tarafından sahip olunan runtime durumu tipli tablolar kullanır. Plugin tarafından sahip olunan
opak durum `plugin_state_entries` / `plugin_blob_entries` kullanır; genel amaçlı
host `kv` tablosu yoktur.

Global veritabanı:

```text
state_leases(scope, lease_key, owner, expires_at, heartbeat_at, payload_json, created_at, updated_at)
exec_approvals_config(config_key, raw_json, socket_path, has_socket_token, default_security, default_ask, default_ask_fallback, auto_allow_skills, agent_count, allowlist_count, updated_at_ms)
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
agent_databases(agent_id, path, schema_version, last_seen_at, size_bytes)
task_runs(...)
task_delivery_state(...)
flow_runs(...)
subagent_runs(run_id, child_session_key, requester_session_key, controller_session_key, created_at, ended_at, cleanup_handled, payload_json)
current_conversation_bindings(binding_key, binding_id, target_agent_id, target_session_id, target_session_key, channel, account_id, conversation_kind, parent_conversation_id, conversation_id, target_kind, status, bound_at, expires_at, metadata_json, updated_at)
plugin_binding_approvals(plugin_root, channel, account_id, plugin_id, plugin_name, approved_at)
tui_last_sessions(scope_key, session_key, updated_at)
plugin_state_entries(plugin_id, namespace, entry_key, value_json, created_at, expires_at)
plugin_blob_entries(plugin_id, namespace, entry_key, metadata_json, blob, created_at, expires_at)
media_blobs(subdir, id, content_type, size_bytes, blob, created_at, updated_at)
skill_uploads(upload_id, kind, slug, force, size_bytes, sha256, actual_sha256, received_bytes, archive_blob, created_at, expires_at, committed, committed_at, idempotency_key_hash)
web_push_subscriptions(endpoint_hash, subscription_id, endpoint, p256dh, auth, created_at_ms, updated_at_ms)
web_push_vapid_keys(key_id, public_key, private_key, subject, updated_at_ms)
apns_registrations(node_id, transport, token, relay_handle, send_grant, installation_id, topic, environment, distribution, token_debug_suffix, updated_at_ms)
node_host_config(config_key, version, node_id, token, display_name, gateway_host, gateway_port, gateway_tls, gateway_tls_fingerprint, updated_at_ms)
device_identities(identity_key, device_id, public_key_pem, private_key_pem, created_at_ms, updated_at_ms)
device_auth_tokens(device_id, role, token, scopes_json, updated_at_ms)
macos_port_guardian_records(pid, port, command, mode, timestamp)
workspace_setup_state(workspace_key, workspace_path, version, bootstrap_seeded_at, setup_completed_at, updated_at)
native_hook_relay_bridges(relay_id, pid, hostname, port, token, expires_at_ms, updated_at_ms)
model_capability_cache(provider_id, model_id, name, input_text, input_image, reasoning, supports_tools, context_window, max_tokens, cost_input, cost_output, cost_cache_read, cost_cache_write, updated_at_ms)
agent_model_catalogs(catalog_key, agent_dir, raw_json, updated_at)
managed_outgoing_image_records(attachment_id, session_key, message_id, created_at, updated_at, retention_class, alt, original_media_id, original_media_subdir, original_content_type, original_width, original_height, original_size_bytes, original_filename, record_json)
gateway_restart_sentinel(sentinel_key, version, kind, status, ts, session_key, thread_id, delivery_channel, delivery_to, delivery_account_id, message, continuation_json, doctor_hint, stats_json, payload_json, updated_at_ms)
channel_pairing_requests(channel_key, account_id, request_id, code, created_at, last_seen_at, meta_json)
channel_pairing_allow_entries(channel_key, account_id, entry, sort_order, updated_at)
voicewake_triggers(config_key, position, trigger, updated_at_ms)
voicewake_routing_config(config_key, version, default_target_mode, default_target_agent_id, default_target_session_key, updated_at_ms)
voicewake_routing_routes(config_key, position, trigger, target_mode, target_agent_id, target_session_key, updated_at_ms)
update_check_state(state_key, last_checked_at, last_notified_version, last_notified_tag, last_available_version, last_available_tag, auto_install_id, auto_first_seen_version, auto_first_seen_tag, auto_first_seen_at, auto_last_attempt_version, auto_last_attempt_at, auto_last_success_version, auto_last_success_at, updated_at_ms)
config_health_entries(config_path, last_known_good_json, last_promoted_good_json, last_observed_suspicious_signature, updated_at_ms)
sandbox_registry_entries(registry_kind, container_name, session_key, backend_id, runtime_label, image, created_at_ms, last_used_at_ms, config_label_kind, config_hash, cdp_port, no_vnc_port, entry_json, updated_at)
cron_run_logs(store_key, job_id, seq, ts, status, error, summary, diagnostics_summary, delivery_status, delivery_error, delivered, session_id, session_key, run_id, run_at_ms, duration_ms, next_run_at_ms, model, provider, total_tokens, entry_json, created_at)
cron_jobs(store_key, job_id, name, description, enabled, delete_after_run, created_at_ms, agent_id, session_key, schedule_kind, schedule_expr, schedule_tz, every_ms, anchor_ms, at, stagger_ms, session_target, wake_mode, payload_kind, payload_message, payload_model, payload_fallbacks_json, payload_thinking, payload_timeout_seconds, payload_allow_unsafe_external_content, payload_external_content_source_json, payload_light_context, payload_tools_allow_json, delivery_mode, delivery_channel, delivery_to, delivery_thread_id, delivery_account_id, delivery_best_effort, failure_delivery_mode, failure_delivery_channel, failure_delivery_to, failure_delivery_account_id, failure_alert_disabled, failure_alert_after, failure_alert_channel, failure_alert_to, failure_alert_cooldown_ms, failure_alert_include_skipped, failure_alert_mode, failure_alert_account_id, next_run_at_ms, running_at_ms, last_run_at_ms, last_run_status, last_error, last_duration_ms, consecutive_errors, consecutive_skipped, schedule_error_count, last_delivery_status, last_delivery_error, last_delivered, last_failure_alert_at_ms, job_json, state_json, runtime_updated_at_ms, schedule_identity, sort_order, updated_at)
delivery_queue_entries(queue_name, id, status, entry_kind, session_key, channel, target, account_id, retry_count, last_attempt_at, last_error, recovery_state, platform_send_started_at, entry_json, enqueued_at, updated_at, failed_at)
commitments(id, agent_id, session_key, channel, account_id, recipient_id, thread_id, sender_id, kind, sensitivity, source, status, reason, suggested_text, dedupe_key, confidence, due_earliest_ms, due_latest_ms, due_timezone, source_message_id, source_run_id, created_at_ms, updated_at_ms, attempts, last_attempt_at_ms, sent_at_ms, dismissed_at_ms, snoozed_until_ms, expired_at_ms, record_json)
migration_runs(id, started_at, finished_at, status, report_json)
migration_sources(source_key, migration_kind, source_path, target_table, source_sha256, source_size_bytes, source_record_count, last_run_id, status, imported_at, removed_source, report_json)
backup_runs(id, created_at, archive_path, status, manifest_json)
```

Agent veritabanı:

```text
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
sessions(session_id, session_key, session_scope, created_at, updated_at, started_at, ended_at, status, chat_type, channel, account_id, primary_conversation_id, model_provider, model, agent_harness_id, parent_session_key, spawned_by, display_name)
conversations(conversation_id, channel, account_id, kind, peer_id, parent_conversation_id, thread_id, native_channel_id, native_direct_user_id, label, metadata_json, created_at, updated_at)
session_conversations(session_id, conversation_id, role, first_seen_at, last_seen_at)
session_routes(session_key, session_id, updated_at)
session_entries(session_id, session_key, entry_json, updated_at)
transcript_events(session_id, seq, event_json, created_at)
transcript_event_identities(session_id, event_id, seq, event_type, has_parent, parent_id, message_idempotency_key, created_at)
transcript_snapshots(session_id, snapshot_id, reason, event_count, created_at, metadata_json)
vfs_entries(namespace, path, kind, content_blob, metadata_json, updated_at)
tool_artifacts(run_id, artifact_id, kind, metadata_json, blob, created_at)
run_artifacts(run_id, path, kind, metadata_json, blob, created_at)
trajectory_runtime_events(session_id, run_id, seq, event_json, created_at)
memory_index_meta(key, value)
memory_index_sources(path, source, hash, mtime, size)
memory_index_chunks(id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
memory_embedding_cache(provider, model, provider_key, hash, embedding, dims, updated_at)
memory_index_state(id, revision)
cache_entries(scope, key, value_json, blob, expires_at, updated_at)
```

Gelecekte arama, kanonik event tablolarını değiştirmeden FTS tabloları ekleyebilir:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

Büyük değerler JSON string kodlaması yerine `blob` sütunlarını kullanmalıdır. Düz
SQLite araçlarıyla incelenebilir kalması gereken küçük yapılandırılmış veriler için
`value_json` değerini koruyun.

`agent_databases` bu dal için kanonik kayıt defteridir. Gerçek bir agent kaydı sahibi
var olana kadar bir `agents` tablosu eklemeyin; agent yapılandırması
`openclaw.json` içinde kalır.

## Doctor Geçiş Şekli

Doctor, raporlanabilir ve yeniden çalıştırılması güvenli olan tek bir açık geçiş adımını çağırmalıdır:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix`, olağan yapılandırma ön kontrolünden sonra durum geçişi
uygulamasını çağırır ve içe aktarmadan önce doğrulanmış bir yedek oluşturur. Runtime
başlatma ve `openclaw migrate`, eski OpenClaw durum dosyalarını içe aktarmamalıdır.

Geçiş özellikleri:

- Tek bir geçiş turu, tüm eski dosya kaynaklarını keşfeder ve herhangi bir şeyi
  değiştirmeden önce bir plan üretir.
- Doctor, eski dosyaları içe aktarmadan önce doğrulanmış bir geçiş öncesi yedek arşivi oluşturur.
- İçe aktarmalar idempotenttir ve kaynak yolu, mtime, boyut, hash ve hedef
  tabloya göre anahtarlanır.
- Başarılı kaynak dosyalar, hedef veritabanı commit ettikten sonra kaldırılır veya arşivlenir.
- Başarısız içe aktarmalar kaynağa dokunmadan bırakılır ve
  `migration_runs` içinde bir uyarı kaydeder.
- Runtime kodu, geçiş var olduktan sonra yalnızca SQLite okur.
- Sürüm düşürme/runtime dosyalarına dışa aktarma yolu gerekli değildir.

## Geçiş Envanteri

Bunları global veritabanına taşıyın:

- Görev kayıt defteri çalışma zamanı yazmaları artık paylaşılan veritabanını kullanır; gönderilmemiş
  `tasks/runs.sqlite` yan dosya içe aktarıcısı silindi. Anlık görüntü kayıtları görev
  kimliğine göre upsert yapar ve yalnızca eksik görev/teslimat satırlarını siler.
- Task Flow çalışma zamanı yazmaları artık paylaşılan veritabanını kullanır; gönderilmemiş
  `tasks/flows/registry.sqlite` yan dosya içe aktarıcısı silindi. Anlık görüntü kayıtları
  akış kimliğine göre upsert yapar ve yalnızca eksik akış satırlarını siler.
- Plugin durum çalışma zamanı yazmaları artık paylaşılan veritabanını kullanır; gönderilmemiş
  `plugin-state/state.sqlite` yan dosya içe aktarıcısı silindi.
- Yerleşik bellek araması artık varsayılan olarak `memory/<agentId>.sqlite` kullanmaz;
  dizin tabloları sahip ajan veritabanında yaşar ve açık
  `memorySearch.store.path` yan dosya açık tercihi doctor yapılandırma
  migration işlemine emekli edildi.
- Yerleşik bellek yeniden dizinleme, ajan veritabanında yalnızca belleğe ait tabloları sıfırlar.
  Aynı veritabanı oturumları, transkriptleri, VFS satırlarını, artifact'leri ve çalışma zamanı önbelleklerini
  de sahiplendiği için tüm SQLite dosyasını değiştirmemelidir.
- Monolitik ve parçalanmış JSON'dan sandbox kapsayıcı/tarayıcı kayıt defterleri. Çalışma zamanı
  yazmaları artık paylaşılan veritabanını kullanır; eski JSON içe aktarımı kalır.
- Cron iş tanımları, zamanlama durumu ve çalışma geçmişi artık paylaşılan SQLite kullanır;
  doctor eski `jobs.json`, `jobs-state.json` ve
  `cron/runs/*.jsonl` dosyalarını içe aktarır/kaldırır
- Cihaz kimliği/auth, push, güncelleme denetimi, taahhütler, OpenRouter model
  önbelleği, yüklü plugin dizini ve app-server bağlamaları
- Cihaz/node eşleştirme ve bootstrap kayıtları artık türlendirilmiş SQLite tabloları kullanır
- Device-pair bildirim aboneleri ve teslim edilmiş istek işaretçileri artık
  `device-pair-notify.json` yerine paylaşılan SQLite plugin-state tablosunu kullanır.
- Voice-call çağrı kayıtları artık `calls.jsonl` yerine
  `voice-call` / `calls` namespace'i altında paylaşılan SQLite plugin-state tablosunu kullanır; plugin CLI
  SQLite destekli çağrı geçmişini takip eder ve özetler.
- QQBot gateway oturumları, bilinen kullanıcı kayıtları ve ref-index alıntı önbelleği artık
  `session-*.json`, `known-users.json` ve
  `ref-index.jsonl` yerine `qqbot` namespace'leri (`sessions`, `known-users`,
  `ref-index`) altında SQLite plugin durumunu kullanır; QQBot doctor/setup migration işlemi
  eski dosyaları içe aktarır ve kaldırır.
- Discord model seçici tercihleri, komut dağıtım hash'leri ve thread bağlamaları
  artık `model-picker-preferences.json`, `command-deploy-cache.json` ve
  `thread-bindings.json` yerine `discord` namespace'leri
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  altında SQLite plugin durumunu kullanır; Discord doctor/setup migration işlemi içe aktarır ve
  eski dosyaları kaldırır.
- BlueBubbles catchup imleçleri ve gelen dedupe işaretçileri artık
  `bluebubbles/catchup/*.json` ve
  `bluebubbles/inbound-dedupe/*.json` yerine `bluebubbles` namespace'leri (`catchup-cursors`, `inbound-dedupe`)
  altında SQLite plugin durumunu kullanır; BlueBubbles doctor/setup migration işlemi
  eski dosyaları içe aktarır ve kaldırır.
- Telegram güncelleme offset'leri, sticker önbellek girdileri, yanıt zinciri mesaj önbelleği
  girdileri, gönderilen mesaj önbelleği girdileri, konu adı önbelleği girdileri ve thread
  bağlamaları artık `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` ve
  `thread-bindings-*.json` yerine `telegram` namespace'leri
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) altında SQLite plugin durumunu kullanır; Telegram doctor/setup migration işlemi içe aktarır ve
  eski dosyaları kaldırır.
- iMessage catchup imleçleri, yanıt kısa kimlik eşlemeleri ve sent-echo dedupe satırları
  artık `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` ve `imessage/sent-echoes.jsonl` yerine
  `imessage` namespace'leri (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) altında SQLite plugin durumunu kullanır; iMessage
  doctor/setup migration işlemi eski dosyaları içe aktarır ve kaldırır.
- Microsoft Teams konuşmaları, anketleri, SSO token'ları ve geri bildirim öğrenimleri artık
  `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json` ve `*.learnings.json` yerine
  SQLite plugin durum namespace'lerini (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) kullanır; Microsoft Teams doctor/setup migration işlemi
  eski dosyaları içe aktarır ve arşivler.
  Bekleyen yüklemeler kısa ömürlü bir SQLite önbelleğidir ve eski JSON önbellek dosyaları
  migrate edilmez.
- Matrix sync önbelleği, depolama metadata'sı, thread bağlamaları, gelen dedupe işaretçileri,
  başlangıç doğrulama cooldown durumu, kimlik bilgileri, kurtarma anahtarları ve SDK
  IndexedDB kripto anlık görüntüleri artık
  `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` ve `crypto-idb-snapshot.json` yerine
  `matrix` altında SQLite plugin durum/blob namespace'lerini
  (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  kullanır; Matrix doctor/setup migration işlemi bu eski dosyaları hesap kapsamlı Matrix
  depolama köklerinden içe aktarır ve kaldırır.
- Nostr bus imleçleri ve profil yayımlama durumu artık
  `bus-state-*.json` ve `profile-state-*.json` yerine
  `nostr` namespace'leri (`bus-state`, `profile-state`) altında SQLite plugin durumunu kullanır; Nostr doctor/setup
  migration işlemi eski dosyaları içe aktarır ve kaldırır.
- Active Memory oturum geçişleri artık `session-toggles.json` yerine
  `active-memory/session-toggles` altında SQLite plugin durumunu kullanır.
- Skill Workshop öneri kuyrukları ve inceleme sayaçları artık
  çalışma alanı başına `skill-workshop/<workspace>.json` dosyaları yerine
  `skill-workshop/proposals` ve `skill-workshop/reviews` altında SQLite plugin durumunu kullanır.
- Giden teslimat ve oturum teslimat kuyrukları artık dayanıklı
  `delivery-queue/*.json`, `delivery-queue/failed/*.json` ve
  `session-delivery-queue/*.json` dosyaları yerine ayrı kuyruk adları
  (`outbound-delivery`, `session-delivery`) altında genel SQLite
  `delivery_queue_entries` tablosunu paylaşır. Doctor legacy-state adımı
  bekleyen ve başarısız satırları içe aktarır, eski teslim edildi işaretçilerini kaldırır ve içe aktarmadan sonra eski
  JSON dosyalarını siler. Sıcak yönlendirme ve yeniden deneme alanları türlendirilmiş sütunlardır;
  JSON payload yalnızca tekrar oynatma/debug için tutulur.
- ACPX işlem kiraları artık `process-leases.json` yerine `acpx/process-leases`
  altında SQLite plugin durumunu kullanır.
- Yedekleme ve migration çalışma metadata'sı

Bunları ajan veritabanlarına taşıyın:

- Ajan oturum kökleri ve uyumluluk şekilli session-entry payload'ları. Çalışma zamanı
  yazmaları için tamamlandı: sıcak oturum metadata'sı `sessions` içinde sorgulanabilirken
  eski şekilli tam `SessionEntry` payload'ı `session_entries` içinde kalır.
- Ajan transkript olayları. Çalışma zamanı yazmaları için tamamlandı.
- Compaction checkpoint'leri ve transkript anlık görüntüleri. Çalışma zamanı yazmaları için tamamlandı:
  checkpoint transkript kopyaları SQLite transkript satırlarıdır ve checkpoint
  metadata'sı `transcript_snapshots` içine kaydedilir. Gateway checkpoint yardımcıları
  artık bu değerleri kaynak dosyalar yerine transkript anlık görüntüleri olarak adlandırır.
- Ajan VFS scratch/çalışma alanı namespace'leri. Çalışma zamanı VFS yazmaları için tamamlandı.
- Alt ajan ek payload'ları. Çalışma zamanı yazmaları için tamamlandı: bunlar SQLite VFS
  seed girdileridir ve asla dayanıklı çalışma alanı dosyaları değildir.
- Araç artifact'leri. Çalışma zamanı yazmaları için tamamlandı.
- Çalışma artifact'leri. Çalışan çalışma zamanı yazmaları için ajan başına
  `run_artifacts` tablosu üzerinden tamamlandı.
- Ajan-yerel çalışma zamanı önbellekleri. Çalışan çalışma zamanı kapsamlı önbellek yazmaları için
  ajan başına `cache_entries` tablosu üzerinden tamamlandı. Gateway genelindeki model önbellekleri
  ajan özelinde hale gelmedikçe genel veritabanında kalır.
- ACP üst akış logları. Çalışma zamanı yazmaları için tamamlandı.
- ACP replay ledger oturumları. Çalışma zamanı yazmaları için
  `acp_replay_sessions` ve `acp_replay_events` üzerinden tamamlandı; eski `acp/event-ledger.json`
  yalnızca doctor girdisi olarak kalır.
- ACP oturum metadata'sı. Çalışma zamanı yazmaları için `acp_sessions` üzerinden tamamlandı; eski
  `sessions.json` içindeki `entry.acp` blokları yalnızca doctor migration girdisidir.
- Açık export dosyaları olmadıklarında trajectory yan dosyaları. Çalışma zamanı
  yazmaları için tamamlandı: trajectory yakalama ajan-veritabanı `trajectory_runtime_events`
  satırlarını yazar ve çalışma kapsamlı artifact'leri SQLite içine yansıtır. Eski yan dosyalar yalnızca doctor
  içe aktarma girdileridir; export yeni JSONL support-bundle çıktıları oluşturabilir
  ancak çalışma zamanında eski trajectory/transkript yan dosyalarını okumaz veya migrate etmez.
  Çalışma zamanı trajectory yakalama SQLite kapsamını açığa çıkarır; JSONL path yardımcıları
  export/debug desteğine izole edilmiştir ve çalışma zamanı modülünden yeniden export edilmez.
  Embedded-runner trajectory metadata'sı bir transkript konumlayıcısı kalıcılaştırmak yerine
  `{agentId, sessionId, sessionKey}` kimliğini kaydeder.

Bunları şimdilik dosya destekli tutun:

- `openclaw.json`
- sağlayıcı veya CLI kimlik bilgisi dosyaları
- plugin/paket manifest'leri
- disk modu seçildiğinde kullanıcı çalışma alanları ve Git depoları
- belirli bir log yüzeyi taşınmadıkça operatör takibi için amaçlanan loglar

## Migration Planı

### Aşama 0: Sınırı Dondur

Daha fazla satır taşımadan önce dayanıklı durum sınırını açık hale getirin:

- Genel veritabanına bir `migration_runs` tablosu ekleyin.
  Eski durum migration yürütme raporları için tamamlandı.
- Dosyadan veritabanına içe aktarma için doctor'a ait tek bir durum migration servisi ekleyin.
  Tamamlandı: `openclaw doctor --fix` legacy-state migration uygulamasını kullanır.
- `plan` öğesini salt okunur yapın ve `apply` öğesinin yedek oluşturmasını, içe aktarmasını, doğrulamasını ve
  ardından eski dosyaları silmesini veya karantinaya almasını sağlayın.
  Tamamlandı: doctor doğrulanmış bir migration öncesi yedek oluşturur, yedek path'ini
  `migration_runs` içine geçirir ve içe aktarıcı/kaldırma path'lerini yeniden kullanır.
- Yeni çalışma zamanı kodunun eski durum dosyaları yazamaması, migration kodu ve testlerin ise
  bunları hâlâ seed edebilmesi/okuyabilmesi için statik yasaklar ekleyin.
  Şu anda migrate edilmiş eski depolar için tamamlandı; guard ayrıca yasaklı çalışma zamanı transkript konumlayıcı sözleşmeleri için
  iç içe testleri tarar.

### Aşama 1: Genel Kontrol Düzlemini Bitir

Paylaşılan koordinasyon durumunu `state/openclaw.sqlite` içinde tutun:

- Ajanlar ve ajan veritabanı kayıt defteri
- Görev ve Task Flow ledger'ları
- Plugin durumu
- Sandbox kapsayıcı/tarayıcı kayıt defteri
- Cron/zamanlayıcı çalışma geçmişi
- Eşleştirme, cihaz, push, güncelleme denetimi, TUI, OpenRouter/model önbellekleri ve diğer
  küçük Gateway kapsamlı çalışma zamanı durumu
- Yedekleme ve migration metadata'sı
- Gateway medya eki baytları. Çalışma zamanı yazmaları için tamamlandı; doğrudan dosya path'leri
  kanal göndericileri ve sandbox staging ile uyumluluk için geçici materialization'lardır. Çalışma zamanı allowlist'leri eski
  state/config medya köklerini değil, SQLite materialization path'lerini kabul eder. Doctor eski medya dosyalarını
  `media_blobs` içine içe aktarır ve başarılı satır yazmalarından sonra kaynak dosyaları kaldırır.
- Debug proxy yakalama oturumları, olayları ve payload blob'ları. Tamamlandı: yakalamalar
  paylaşılan durum veritabanında yaşar ve paylaşılan durum veritabanı bootstrap, şema,
  WAL ve busy-timeout ayarları üzerinden açılır. Payload baytları
  `capture_blobs.data` içinde gzip ile sıkıştırılır; debug proxy çalışma zamanı yan dosya DB override'ı,
  blob dizini veya yalnızca proxy-capture için oluşturulmuş şema/codegen hedefi yoktur.
  Doctor/başlangıç migration işlemi gönderilmiş `debug-proxy/capture.sqlite` satırlarını
  ve başvurulan payload blob'larını, etkin eski DB/blob ortamı
  override'ları dahil, içe aktarır; ardından CA sertifikalarını olduğu gibi bırakıp bu kaynakları arşivler.

Bu aşama ayrıca bu alt sistemlerden yinelenen yan dosya açıcıları, izin yardımcılarını, WAL
kurulumunu, dosya sistemi budamasını ve uyumluluk yazarlarını siler.

### Aşama 2: Ajan Başına Veritabanları Tanıt

Ajan başına bir veritabanı oluşturun ve bunu genel DB'den kaydedin:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

Genel `agent_databases` satırı path'i, şema sürümünü, son-görülme
zaman damgasını ve temel boyut/bütünlük metadata'sını saklar. Çalışma zamanı kodu,
dosya path'lerini doğrudan türetmek yerine ajan DB'sini kayıt defterinden ister.

Ajan DB şunları sahiplenir:

- Kanonik oturum kökü olarak `sessions`; bu köke bağlı uyumluluk biçimli yük tablosu olarak `session_entries` ve benzersiz etkin `session_key` araması olarak `session_routes`
- Oturumlara bağlı normalize edilmiş sağlayıcı yönlendirme kimliği olarak `conversations` ve `session_conversations`
- `transcript_events`
- transkript anlık görüntüleri ve Compaction kontrol noktaları. Çalışma zamanı yazmaları için tamamlandı.
- `vfs_entries`
- `tool_artifacts` ve çalıştırma artifact’leri
- aracı yerel çalışma zamanı/önbellek satırları. Çalışan kapsamlı önbellekler için tamamlandı.
- ACP üst akış olayları
- açık dışa aktarma artifact’leri olmadıklarında trajectory çalışma zamanı olayları

### Aşama 3: Oturum Deposu API’lerini Değiştir

Çalışma zamanı için tamamlandı. Dosya biçimli oturum deposu yüzeyi etkin bir
çalışma zamanı sözleşmesi değildir:

- Çalışma zamanı artık `loadSessionStore(storePath)` çağırmaz veya `storePath` değerini
  oturum kimliği olarak ele almaz.
- Çalışma zamanı satır işlemleri `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry` ve `listSessionEntries` şeklindedir.
- Tüm depoyu yeniden yazan yardımcılar, dosya yazıcıları, kuyruk testleri, alias ayıklama ve
  eski anahtar silme parametreleri çalışma zamanından kaldırıldı.
- Kullanımdan kaldırılmış kök paket uyumluluk dışa aktarımları hâlâ kanonik
  `sessions.json` yollarını SQLite satır API’lerine uyarlar.
- `sessions.json` ayrıştırması yalnızca doctor migration/import kodunda ve
  doctor testlerinde kalır.
- Çalışma zamanı yaşam döngüsü fallback okumaları JSONL ilk satırlarını değil,
  SQLite transkript başlıklarını okur.

Dosya kilidi parametrelerini, dosya bakımı olarak ayıklama/kesme söz dağarcığını,
depo yolu kimliğini veya tek iddiası JSON kalıcılığı olan testleri yeniden getiren
her şeyi silmeye devam edin.

### Aşama 4: Transkriptleri, ACP Akışlarını, Trajectory’leri ve VFS’yi Taşı

Her aracı veri akışını veritabanı yerel hale getir:

- Transkript ekleme yazmaları, oturum başlığını sağlayan, mesaj idempotency’sini
  kontrol eden, üst kuyruğu seçen, `transcript_events` içine ekleyen ve sorgulanabilir
  kimlik metadata’sını `transcript_event_identities` içine kaydeden tek bir SQLite
  transaction üzerinden geçer. Doğrudan transkript mesaj eklemeleri ve normal kalıcı
  `TranscriptSessionManager` eklemeleri için tamamlandı; açık branch işlemleri açık
  üst seçimlerini korur ve yine de herhangi bir dosya konumlayıcı türetmeden SQLite
  satırları yazar.
- ACP üst akış logları `.acp-stream.jsonl` dosyaları değil, satırlar haline gelir. Tamamlandı.
- ACP spawn kurulumu artık transkript JSONL yollarını kalıcılaştırmaz. Tamamlandı.
- Çalışma zamanı trajectory yakalama, olay satırlarını/artifact’leri doğrudan yazar. Açık
  destek/dışa aktarma komutu, bir dışa aktarma biçimi olarak destek paketi JSONL artifact’leri
  üretmeye devam edebilir, ancak oturum dışa aktarma oturum JSONL’yi yeniden oluşturmaz. Tamamlandı.
- Disk çalışma alanları, disk modu olarak yapılandırıldığında diskte kalır.
- VFS scratch ve deneysel yalnızca VFS çalışma alanı modu aracı DB’sini kullanır.

Migration eski JSONL dosyalarını bir kez import eder, sayıları/hash’leri
`migration_runs` içine kaydeder ve bütünlük kontrollerinden sonra import edilen dosyaları kaldırır.

### Aşama 5: Yedekleme, Geri Yükleme, Vacuum ve Doğrulama

Yedekler tek bir arşiv dosyası olarak kalır:

- Her global ve aracı veritabanı için checkpoint al.
- Her DB’yi SQLite backup semantiği veya `VACUUM INTO` ile anlık görüntüle.
- Kompakt DB anlık görüntülerini, config’i, harici kimlik bilgilerini ve istenen
  çalışma alanı dışa aktarımlarını arşivle.
- Ham canlı `*.sqlite-wal` ve `*.sqlite-shm` dosyalarını dahil etme.
- Her DB anlık görüntüsünü açıp `PRAGMA integrity_check` çalıştırarak doğrula.
  `openclaw backup create` bu arşiv doğrulamasını varsayılan olarak yapar;
  `--no-verify` yalnızca yazma sonrası arşiv geçişini atlar, anlık görüntü
  oluşturma bütünlük kontrolünü atlamaz.
- Geri yükleme, anlık görüntüleri hedef yollarına geri kopyalar. Bu branch,
  henüz yayımlanmamış SQLite düzenini `user_version = 1` olarak sıfırlar; gelecekteki
  yayımlanmış şema değişiklikleri gerektiğinde açık migration’lar ekleyebilir.

### Aşama 6: Çalışan Çalışma Zamanı

Veritabanı ayrımı yerleşirken çalışan modunu deneysel tut:

- Çalışanlar aracı id’si, çalıştırma id’si, dosya sistemi modu ve DB registry kimliği alır.
- Her çalışan kendi SQLite connection’ını açar.
- Üst süreç kanal teslimini, onayları, config’i ve iptal yetkisini elinde tutar.
- Etkin çalıştırma başına bir çalışanla başla; pooling’i yalnızca yaşam döngüsü ve DB
  connection sahipliği kararlı hale geldikten sonra ekle.

### Aşama 7: Eski Dünyayı Sil

Çalışma zamanı oturum yönetimi için tamamlandı. Eski dünyaya yalnızca açık
doctor girdisi veya destek/dışa aktarma çıktısı olarak izin verilir:

- Çalışma zamanında `sessions.json`, transkript JSONL, sandbox registry JSON, görev
  sidecar SQLite veya plugin-state sidecar SQLite yazmaları yok.
- JSON/oturum dosyası ayıklama, dosya transkripti kesme, oturum dosyası kilitleri
  veya kilit biçimli oturum testleri yok.
- Eski oturum dosyalarını güncel tutma amacı taşıyan çalışma zamanı uyumluluk
  dışa aktarımları yok.
- Açık destek dışa aktarımları kullanıcı tarafından istenen arşiv/materialization
  biçimleri olarak kalır ve dosya adlarını çalışma zamanı kimliğine geri beslememelidir.

## Yedekleme ve Geri Yükleme

Yedekler tek bir arşiv dosyası olmalıdır, ancak veritabanı yakalama
SQLite yerel olmalıdır:

1. Uzun süren yazma etkinliğini durdur veya kısa bir yedekleme bariyerine gir.
2. Her global ve aracı veritabanı için checkpoint çalıştır.
3. Her veritabanını SQLite backup semantiği veya `VACUUM INTO` kullanarak geçici bir
   yedekleme dizinine anlık görüntüle.
4. Sıkıştırılmış veritabanı anlık görüntülerini, config dosyasını, credentials dizinini,
   seçili çalışma alanlarını ve bir manifest’i arşivle.
5. Dahil edilen her SQLite anlık görüntüsünü açıp `PRAGMA integrity_check`
   çalıştırarak arşivi doğrula.
   `openclaw backup create` bunu varsayılan olarak yapar; `--no-verify` yalnızca
   yazma sonrası arşiv geçişini kasıtlı olarak atlamak içindir.

Birincil yedekleme biçimi olarak ham canlı `*.sqlite`, `*.sqlite-wal` ve
`*.sqlite-shm` kopyalarına güvenme. Arşiv manifest’i veritabanı rolünü, aracı id’sini,
şema sürümünü, kaynak yolunu, anlık görüntü yolunu, bayt boyutunu ve bütünlük
durumunu kaydetmelidir.

Geri yükleme, global veritabanını ve aracı veritabanı dosyalarını arşiv anlık
görüntülerinden yeniden oluşturmalıdır. SQLite düzeni henüz yayımlanmadığı için bu
refactor yalnızca sürüm-1 şemasını ve doctor dosyadan veritabanına import işlemini
korur. Geri yükleme komutu önce arşivi doğrular, ardından her manifest varlığını
doğrulanmış çıkarılmış payload’dan değiştirir.

## Çalışma Zamanı Refactor Planı

1. Veritabanı registry API’leri ekle.
   - Global DB ve aracı başına DB yollarını çözümle.
   - Henüz yayımlanmamış şemaları `user_version = 1` olarak tut; yayımlanmış bir
     şema gerektirmedikçe şema migration runner kodu ekleme.
   - Testler, yedekleme ve doctor tarafından kullanılan close/checkpoint/integrity
     yardımcılarını ekle.

2. Sidecar SQLite depolarını birleştir.
   - Plugin state tablolarını global veritabanına taşı. Çalışma zamanı yazmaları için
     tamamlandı; henüz yayımlanmamış eski sidecar importer silindi.
   - Görev registry tablolarını global veritabanına taşı. Çalışma zamanı yazmaları için
     tamamlandı; henüz yayımlanmamış eski sidecar importer silindi.
   - Task Flow tablolarını global veritabanına taşı. Çalışma zamanı yazmaları için
     tamamlandı; henüz yayımlanmamış eski sidecar importer silindi.
   - Yerleşik memory-search tablolarını her aracı veritabanına taşı. Tamamlandı; açık
     özel `memorySearch.store.path` artık doctor config migration tarafından kaldırılır.
     Tam reindex yalnızca memory tablolarına karşı yerinde çalışır; eski tüm dosya
     swap yolu ve sidecar index swap yardımcısı silindi.
   - Bu alt sistemlerden yinelenen veritabanı açıcıları, WAL kurulumu, permission
     yardımcıları ve close yollarını sil.

3. Aracıya ait tabloları aracı başına veritabanlarına taşı.
   - Aracı DB’sini global veritabanı registry’si üzerinden ihtiyaç halinde oluştur. Tamamlandı.
   - Çalışma zamanı oturum girdilerini, transkript olaylarını, VFS satırlarını ve tool
     artifact’lerini aracı DB’lerine taşı. Tamamlandı.
   - Branch-local shared-DB oturum girdilerini, transkript olaylarını, VFS satırlarını
     veya tool artifact’lerini migrate etme; bu düzen hiç yayımlanmadı. Yalnızca
     doctor içinde eski dosyadan veritabanına import’u koru.

4. Oturum deposu API’lerini değiştir.
   - Çalışma zamanı kimliği olarak `storePath` değerini kaldır. Çalışma zamanı için
     tamamlandı ve `check:database-first-legacy-stores` tarafından korunuyor:
     oturum metadata’sı, route güncellemeleri, komut kalıcılığı, CLI oturum temizliği,
     Feishu reasoning preview’ları, transcript-state kalıcılığı, subagent derinliği,
     auth profile oturum override’ları, parent-fork mantığı ve QA-lab incelemesi artık
     veritabanını kanonik aracı/oturum anahtarlarından çözümler.
     Gateway/TUI/UI/macOS oturum listesi yanıtları artık eski `path` yerine `databasePath`
     gösterir; macOS debug yüzeyleri `session.store` config’i yazmak yerine aracı başına
     veritabanını salt okunur durum olarak gösterir.
     `/status`, sohbet kaynaklı trajectory dışa aktarma ve CLI dependency proxy’leri
     artık eski depo yollarını yaymaz; transkript kullanım fallback’i SQLite’ı
     aracı/oturum kimliğiyle okur. Çalışma zamanı ve bridge testleri artık `storePath`
     göstermez; doctor/migration girdileri bu eski alan adının sahibidir.
     Gateway birleşik oturum yükleme artık şablonlanmamış `session.store` değerleri için
     özel bir çalışma zamanı branch’ine sahip değildir; aracı başına SQLite satırlarını
     toplar.
     Eski oturum kilidi doctor lane’i ve onun `.jsonl.lock` temizleme yardımcısı kaldırıldı;
     artık SQLite oturum concurrency sınırıdır.
     Sıcak çalışma zamanı çağrı noktaları `resolveSessionRowEntry` gibi satır odaklı
     yardımcı adları kullanır; eski `resolveSessionStoreEntry` uyumluluk alias’ı çalışma
     zamanından ve Plugin SDK dışa aktarımlarından kaldırıldı.

- `{ agentId, sessionKey }` satır işlemlerini kullan.
  Tamamlandı: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry` ve `listSessionEntries`, oturum deposu yolu gerektirmeyen
  SQLite-first API’lerdir. Durum özeti, yerel aracı durumu, health ve
  `openclaw sessions` listeleme komutu artık aracı başına satırları doğrudan okur
  ve `sessions.json` yolları yerine aracı başına SQLite veritabanı yollarını gösterir.
- Tüm depoyu delete/insert ile değiştirmek yerine `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries` ve SQL cleanup sorgularını kullan.
  Çalışma zamanı için tamamlandı: sıcak yollar artık satır API’lerini ve conflict
  durumunda yeniden denenen satır patch’lerini kullanır; kalan tüm depo import/replace
  yardımcıları migration import kodu ve SQLite backend testleriyle sınırlıdır.
  - `store-writer.ts` ve writer-queue testlerini sil. Tamamlandı.
  - Oturum satırı upsert/patch işlemlerinden çalışma zamanı eski anahtar ayıklamayı
    ve alias-delete parametrelerini sil. Tamamlandı.

5. Çalışma zamanı JSON registry davranışını sil.
   - Sandbox registry okuma ve yazmalarını yalnızca SQLite yap. Tamamlandı.
   - Monolithic ve sharded JSON’u yalnızca migration adımından import et. Tamamlandı.
   - Sharded registry kilitlerini ve JSON yazmalarını kaldır. Tamamlandı.

- Şekil sıcak yol operasyonel durumu olarak kalıyorsa registry satırlarını genel
  opaque JSON olarak saklamak yerine tek bir typed registry tablosu tut. Tamamlandı.

6. Dosya kilidi biçimli oturum mutation’ını sil.
   - Çalışma zamanı kilit oluşturma ve çalışma zamanı kilit API’leri için tamamlandı.
   - Bağımsız eski `.jsonl.lock` doctor cleanup lane’i kaldırıldı.
   - `session.writeLock`, typed çalışma zamanı ayarı değil, doctor tarafından migrate
     edilen eski config’tir.
   - State integrity artık ayrı bir orphan transkript dosyası ayıklama yoluna sahip değil;
     doctor migration eski JSONL kaynaklarını tek yerde import eder/kaldırır.
   - Gateway singleton coordination, `gateway_locks` altında typed SQLite `state_leases`
     satırları kullanır ve artık dosya kilidi dizini yüzeyi göstermez.
   - Genel Plugin SDK dedupe kalıcılığı artık dosya kilitleri veya JSON dosyaları kullanmaz;
     shared SQLite plugin-state satırları yazar. Tamamlandı.
   - QMD embed coordination, `qmd/embed.lock` yerine bir SQLite state lease kullanır. Tamamlandı.

7. Çalışanları veritabanı farkında yap.
   - Çalışanlar kendi SQLite connection’larını açar.
   - Üst süreç teslimin, kanal callback’lerinin ve config’in sahibidir.
   - Çalışan canlı handle’lar değil, aracı id’si, çalıştırma id’si, dosya sistemi modu
     ve DB registry kimliği alır.
   - `vfs-only` deneysel kalır ve depolama kökü olarak aracı veritabanını kullanır.
   - Önce etkin çalıştırma başına bir çalışan tut. Pooling, DB connection ömrü ve iptal
     davranışı sıradan hale gelene kadar bekleyebilir.

8. Yedekleme entegrasyonu.
   - Yedeklemeye, SQLite yedekleme veya `VACUUM INTO` aracılığıyla global ve aracı veritabanlarının anlık görüntüsünü almayı öğretin. Durum varlığı altında keşfedilen `*.sqlite` dosyaları için tamamlandı.
   - SQLite bütünlüğü ve şema sürümü için yedekleme doğrulaması ekleyin. Yedekleme oluşturma ve varsayılan arşiv doğrulama bütünlük kontrolleri için tamamlandı.
   - Yedekleme çalıştırma meta verilerini SQLite'a kaydedin. Arşiv yolu, durum ve bildirim JSON'u içeren paylaşılan `backup_runs` tablosu üzerinden tamamlandı.
   - Doğrulanmış arşiv anlık görüntülerinden geri yükleme ekleyin. Tamamlandı: `openclaw backup
restore` çıkarmadan önce doğrular, doğrulayıcının normalleştirilmiş bildirimini kullanır, `--dry-run` destekler ve kaydedilmiş kaynak yollarını değiştirmeden önce `--yes` gerektirir.
   - VFS/çalışma alanı dışa aktarımını yalnızca istendiğinde dahil edin; oturum iç bileşenlerini JSON veya JSONL olarak dışa aktarmayın.

9. Eski testleri ve kodu silin. Bilinen çalışma zamanı oturum yüzeyleri için tamamlandı.

- `sessions.json` veya transkript JSONL dosyalarının çalışma zamanı tarafından oluşturulduğunu doğrulayan testleri kaldırın. Çekirdek oturum deposu, sohbet, Gateway transkript olayları, önizleme, yaşam döngüsü, komut oturum girişi güncellemeleri, otomatik yanıt sıfırlama/izleme ve memory-core dreaming fixture'ları, onay hedef yönlendirmesi, oturum transkripti onarımı, güvenlik izni onarımı, yörünge dışa aktarımı ve oturum dışa aktarımı için tamamlandı.
  Active-memory transkript testleri artık SQLite kapsamlarını ve geçici ya da kalıcı JSONL dosyası oluşturulmadığını doğruluyor.
  Eski heartbeat transkript budama regresyonu kaldırıldı çünkü çalışma zamanı artık JSONL transkriptlerini kısaltmıyor.
  Aracı oturum listesi aracı testleri artık eski `sessions.json` yollarını gateway yanıt şekli olarak modellemiyor; app/UI/macOS testleri `databasePath` kullanıyor.
  `/status` transkript kullanımı testleri artık JSONL dosyaları yazmak yerine SQLite transkript satırlarını doğrudan tohumluyor.
  Gateway oturum yaşam döngüsü testleri artık SQLite transkript tohumlama yardımcılarını doğrudan kullanıyor; eski tek satırlı oturum dosyası fixture şekli sıfırlama ve silme kapsamından kaldırıldı.
  `sessions.delete` artık dosya dönemine ait `archived: []` alanı döndürmüyor; silme yalnızca satır mutasyonu sonucunu bildiriyor. Eski `deleteTranscript` seçeneği de kaldırıldı: bir oturumu silmek kanonik `sessions` kökünü kaldırır ve SQLite'ın oturuma ait transkript, anlık görüntü ve yörünge satırlarını kademeli olarak silmesine izin verir; böylece hiçbir çağıran geride transkript yetimleri bırakamaz veya bir temizlik dalını unutamaz.
  Context-engine yörünge yakalama testleri artık `session.trajectory.jsonl` okumak yerine izole edilmiş bir aracı veritabanından `trajectory_runtime_events` satırlarını okuyor.
  Docker MCP kanal tohum betikleri artık SQLite satırlarını doğrudan tohumluyor. Doğrudan `sessions.json` yazımları doktor fixture'larıyla sınırlıdır.
  Tool Search Gateway E2E, `agents/<agentId>/sessions/*.jsonl` dosyalarını taramak yerine araç çağrısı kanıtını SQLite transkript satırlarından okuyor.
  Memory-core ana makine olayları ve session-corpus scratch satırları artık paylaşılan SQLite Plugin durumu içinde yaşıyor; `events.jsonl` ve `session-corpus/*.txt` yalnızca eski doktor geçiş girdileridir. Etkin satırlar `.dreams/session-corpus` değil, `memory/session-ingestion/` sanal yollarını kullanır. Eski memory-core dreaming onarım modülü ve onun CLI/Gateway testleri kaldırıldı çünkü çalışma zamanı artık bu korpus için dosya arşivi onarımına sahip değil. Memory-core bridge/public-artifact testleri artık `.dreams/events.jsonl` yüzeye çıkarmıyor; SQLite destekli sanal JSON artifact adını kullanıyorlar.
  Genel SDK/Codex test dokümanları artık oturum dosyaları yerine SQLite oturum durumu diyor ve kanal dönüşü örneği artık `storePath` bağımsız değişkenini açığa çıkarmıyor.
  Matrix senkronizasyon durumu artık SQLite Plugin durumu deposunu doğrudan kullanıyor. Etkin istemci/çalışma zamanı sözleşmeleri bir hesap depolama kökü geçirir, `bot-storage.json` yolu değil; doktor eski `bot-storage.json` verisini kaynağı silmeden önce SQLite'a içe aktarır. QA Matrix yeniden başlatma/yıkıcı senaryoları artık sahte `bot-storage.json` dosyaları oluşturmak veya silmek yerine SQLite senkronizasyon satırını doğrudan değiştiriyor ve E2EE substrate sahte bir `sync-store.json` yolu yerine bir senkronizasyon deposu kökü geçiriyor.
  Matrix depolama kökü seçimi artık kökleri eski senkronizasyon/thread JSON dosyalarına göre puanlamıyor; dayanıklı kök meta verilerini ve gerçek kripto durumunu kullanıyor.
  Çalışma zamanı SQLite oturum backend test paketi artık `sessions.json` üretmiyor; eski kaynak fixture'ları artık onları içe aktaran doktor testlerinde bulunuyor.
  Gateway oturum testleri artık bir `createSessionStoreDir` yardımcısı veya kullanılmayan geçici oturum deposu yolu kurulumu açığa çıkarmıyor; fixture dizinleri açıktır ve doğrudan satır kurulumu SQLite oturum satırı adlandırmasını kullanır.
  Yalnızca doktora ait JSON5 oturum deposu ayrıştırıcı kapsamı altyapı testlerinden doktor geçiş testlerine taşındı; böylece çalışma zamanı test paketleri artık eski oturum dosyası ayrıştırmasına sahip değil.
  Microsoft Teams çalışma zamanı SSO/bekleyen yükleme testleri artık JSON sidecar fixture'ları veya ayrıştırıcıları taşımıyor; eski SSO token ayrıştırması yalnızca Plugin geçiş modülünde yaşıyor. Telegram testleri artık sahte `/tmp/*.json` depo yollarını tohumlamıyor; SQLite destekli ileti önbelleğini doğrudan sıfırlıyorlar. Genel OpenClaw test durumu yardımcısı artık eski `auth-profiles.json` yazıcısını açığa çıkarmıyor; doktor kimlik doğrulama geçiş testleri bu fixture'a yerel olarak sahip.
  TUI son oturum işaretçileri, exec onayları, active-memory geçişleri, Matrix tekilleştirme/başlangıç doğrulaması, Memory Wiki kaynak senkronizasyonu, geçerli konuşma bağlamaları, onboarding kimlik doğrulaması ve Hermes gizli bilgi içe aktarımları için çalışma zamanı testleri artık eski sidecar dosyaları üretmiyor veya eski dosya adlarının bulunmadığını doğrulamıyor. Davranışı SQLite satırları ve genel depo API'leri üzerinden kanıtlıyorlar; eski kaynak dosya adlarının ait olduğu tek yer doktor/geçiş testleridir.
  Cihaz/node eşleştirmesi, kanal allowFrom, yeniden başlatma niyetleri, yeniden başlatma devri, oturum teslim kuyruğu girişleri, config sağlığı, iMessage önbellekleri, cron işleri, PI transkript başlıkları, alt aracı kayıtları ve yönetilen görüntü ekleri için çalışma zamanı testleri de artık yalnızca yok sayıldıklarını veya bulunmadıklarını kanıtlamak için kullanımdan kaldırılmış JSON/JSONL dosyaları oluşturmuyor.
  PI taşma kurtarma artık bir SessionManager yeniden yazma/kısaltma fallback'ine sahip değil: araç sonucu kısaltma ve context-engine transkript yeniden yazımları SQLite transkript satırlarını değiştirir, ardından etkin prompt durumunu veritabanından yeniler. Kalıcı SessionManager ileti eklemeleri, üst öğe seçimi ve idempotency için atomik SQLite transkript ekleme yardımcısına devreder. Normal meta veri/özel giriş eklemeleri de geçerli üst öğeyi SQLite içinde seçer; böylece eski yönetici örnekleri SQLite öncesi üst zincir yarışlarını yeniden canlandırmaz.
  Orta dönüş ön kontrolleri ve `sessions_yield` için sentetik PI kuyruk temizliği artık SQLite transkript durumunu doğrudan kırpar; eski SessionManager kuyruk kaldırma köprüsü ve testleri silindi.
  Compaction checkpoint yakalama da yalnızca SQLite'tan anlık görüntü alır; çağıranlar artık alternatif transkript kaynağı olarak canlı bir SessionManager geçirmez.
- Eski dosyaları yalnızca geçiş için tohumlayan testleri koruyun.
- Etkin çalışma zamanı yüzeyleri için JSON dosyası kanıtı SQL satır kanıtıyla değiştirildi.

- Eski oturum/önbellek JSON yollarına çalışma zamanı yazımları için statik yasaklar ekleyin.
  Repo guard için tamamlandı.

10. Geçiş raporunu denetlenebilir yapın.
    - Geçiş çalıştırmalarını başlangıç/bitiş zaman damgaları, kaynak yolları, kaynak hash'leri, sayımlar, uyarılar ve yedekleme yolu ile SQLite'a kaydedin.
      Tamamlandı: eski durum geçişi yürütmeleri artık kaynak yolu/tablo envanteri, kaynak dosya SHA-256, boyutlar, kayıt sayıları, uyarılar ve yedekleme yolu içeren bir `migration_runs` raporunu kalıcı hale getiriyor.
      Tamamlandı: eski durum geçişi yürütmeleri ayrıca kaynak düzeyi denetim ve gelecekteki atlama/backfill kararları için `migration_sources` satırlarını kalıcı hale getiriyor.
    - Uygulamayı idempotent yapın. Kısmi bir içe aktarmadan sonra yeniden çalıştırma, zaten içe aktarılmış bir kaynağı atlamalı veya kararlı anahtara göre birleştirmelidir.
      Tamamlandı: oturum dizinleri, transkriptler, teslim kuyrukları, Plugin durumu, görev defterleri ve aracıya ait global SQLite satırları kararlı anahtarlar veya upsert/replace semantiği üzerinden içe aktarılır; böylece yeniden çalıştırmalar dayanıklı satırları çoğaltmadan birleştirir.
    - Başarısız içe aktarmalar özgün kaynak dosyasını yerinde tutmalıdır.
      Tamamlandı: başarısız transkript içe aktarmaları artık özgün JSONL kaynağını algılanan yolunda bırakıyor ve `migration_sources` kaynağı bir sonraki doktor çalıştırması için `removed_source=0` ile `warning` olarak kaydediyor.

## Performans Kuralları

- Thread/process başına bir bağlantı uygundur; handle'ları worker'lar arasında paylaşmayın.
- WAL, `foreign_keys=ON`, 30 sn busy timeout ve kısa `BEGIN IMMEDIATE` yazma işlemleri kullanın.
- Async transaction API açık mutex/backpressure semantiği ekleyene kadar yazma transaction yardımcılarını senkron tutun.
- Üst teslim yazımlarını küçük ve transaction'lı tutun.
- Tüm depoyu yeniden yazmaktan kaçının; satır düzeyi upsert/delete kullanın.
- Sıcak kodu taşımadan önce list-by-agent, list-by-session, updated-at, run id ve expiration yolları için indeksler ekleyin.
- Büyük artifact'ları, medyayı ve vektörleri base64 veya numeric-array JSON olarak değil, BLOB'lar veya parçalı BLOB satırları olarak saklayın.
- Opak Plugin durumu girişlerini küçük ve kapsamlı tutun.
- Dosya sistemi budaması yerine TTL/expiration için SQL temizliği ekleyin.
  Veritabanı sahipli çalışma zamanı depoları için tamamlandı: medya, Plugin durumu, Plugin blob'ları, kalıcı tekilleştirme ve aracı önbelleğinin tümü SQLite satırları üzerinden sona erer. Kalan dosya sistemi temizliği geçici materyalleştirmeler veya açık kaldırma komutlarıyla sınırlıdır.

## Statik Yasaklar

Eski durum yollarına yeni çalışma zamanı yazımlarını başarısız kılan bir repo kontrolü ekleyin:

- `sessions.json`
- Gerçekleştirilmiş destek paketi çıktıları hariç `*.trajectory.jsonl`
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- `cache/*.json` çalışma zamanı önbellek dosyaları
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- Matrix `credentials*.json` ve `recovery-key.json`
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json`
- `devices/paired.json`
- `devices/bootstrap.json`
- `nodes/pending.json`
- `nodes/paired.json`
- `identity/device.json`
- `identity/device-auth.json`
- `push/web-push-subscriptions.json`
- `push/vapid-keys.json`
- `push/apns-registrations.json`
- `process-leases.json`
- `gateway-instance-id`
- `session-toggles.json`
- Memory-core `.dreams/events.jsonl`
- Memory-core `.dreams/session-corpus/`
- Memory-core `.dreams/daily-ingestion.json`
- Memory-core `.dreams/session-ingestion.json`
- Memory-core `.dreams/short-term-recall.json`
- Memory-core `.dreams/phase-signals.json`
- Memory-core `.dreams/short-term-promotion.lock`
- Skill Workshop `skill-workshop/<workspace>.json`
- Skill Workshop `skill-workshop/skill-workshop-review-*.json`
- Nostr `bus-state-*.json`
- Nostr `profile-state-*.json`
- `calls.jsonl`
- `known-users.json`
- `ref-index.jsonl`
- QQBot `session-*.json`
- BlueBubbles `bluebubbles/catchup/*.json`
- BlueBubbles `bluebubbles/inbound-dedupe/*.json`
- Telegram `update-offset-*.json`
- Telegram `sticker-cache.json`
- Telegram `*.telegram-messages.json`
- Telegram `*.telegram-sent-messages.json`
- Telegram `*.telegram-topic-names.json`
- Telegram `thread-bindings-*.json`
- iMessage `catchup/*.json`
- iMessage `reply-cache.jsonl`
- iMessage `sent-echoes.jsonl`
- Microsoft Teams `msteams-conversations.json`
- Microsoft Teams `msteams-polls.json`
- Microsoft Teams `msteams-sso-tokens.json`
- Microsoft Teams `*.learnings.json`
- Matrix `bot-storage.json`
- Matrix `sync-store.json`
- Matrix `thread-bindings.json`
- Matrix `inbound-dedupe.json`
- Matrix `startup-verification.json`
- Matrix `storage-meta.json`
- Matrix `crypto-idb-snapshot.json`
- Discord `model-picker-preferences.json`
- Discord `command-deploy-cache.json`
- sandbox kayıt defteri parçası JSON dosyaları
- yerel hook relay `/tmp` bridge JSON dosyaları
- `plugin-state/state.sqlite`
- geçici `openclaw-state.sqlite` çalışma zamanı sidecar’ları
- `tasks/runs.sqlite`
- `tasks/flows/registry.sqlite`
- `bindings/current-conversations.json`
- `restart-sentinel.json`
- `gateway-restart-intent.json`
- `gateway-supervisor-restart-handoff.json`
- `gateway.<hash>.lock`
- `qmd/embed.lock`
- `commands.log`
- `config-health.json`
- `port-guard.json`
- `settings/voicewake.json`
- `settings/voicewake-routing.json`
- `plugin-binding-approvals.json`
- `plugins/installs.json`
- `audit/file-transfer.jsonl`
- `audit/crestodian.jsonl`
- `crestodian/rescue-pending/*.json`
- `plugins/phone-control/armed.json`
- Memory Wiki `.openclaw-wiki/log.jsonl`
- Memory Wiki `.openclaw-wiki/state.json`
- Memory Wiki `.openclaw-wiki/locks/`
- Memory Wiki `.openclaw-wiki/source-sync.json`
- Memory Wiki `.openclaw-wiki/import-runs/*.json`
- Memory Wiki `.openclaw-wiki/cache/agent-digest.json`
- Memory Wiki `.openclaw-wiki/cache/claims.jsonl`
- ClawHub `.clawhub/lock.json`
- ClawHub `.clawhub/origin.json`
- Tarayıcı profili süslemesi `.openclaw-profile-decorated`
- `SessionManager.open(...)` dosya destekli oturum açıcıları
- `SessionManager.listAll(...)` ve `TranscriptSessionManager.listAll(...)`
  transkript listeleme cepheleri
- `SessionManager.forkFromSession(...)` ve
  `TranscriptSessionManager.forkFromSession(...)` transkript çatallama cepheleri
- `SessionManager.newSession(...)` ve `TranscriptSessionManager.newSession(...)`
  değiştirilebilir oturum değiştirme cepheleri
- `SessionManager.createBranchedSession(...)` ve
  `TranscriptSessionManager.createBranchedSession(...)` dal oturumu cepheleri

Yasak, testlerin eski fikstürler oluşturmasına ve migration kodunun eski dosya kaynaklarını
okumasına/içe aktarmasına/kaldırmasına izin vermelidir. Yayınlanmamış SQLite sidecar’ları yasaklı kalır
ve doctor içe aktarma izinleri almaz.

## Tamamlanma Kriterleri

- Çalışma zamanı verileri ve önbellek yazımları global veya agent SQLite veritabanına gider.
- Çalışma zamanı artık oturum dizinleri, transkript JSONL, sandbox kayıt defteri
  JSON’u, görev sidecar SQLite’ı veya plugin-state sidecar SQLite’ı yazmaz. Yayınlanmamış görev
  ve plugin-state sidecar SQLite içe aktarıcıları silinir.
- Eski dosya içe aktarma yalnızca doctor kapsamındadır.
- Backup, kompakt SQLite anlık görüntüleri ve bütünlük kanıtı içeren tek bir arşiv üretir.
- Agent işçileri disk, VFS scratch veya deneysel yalnızca VFS
  depolama ile çalışabilir.
- Config ve açık credential dosyaları, veritabanı dışı beklenen tek kalıcı
  kontrol dosyaları olarak kalır.
- Repo kontrolleri, eski çalışma zamanı dosya depolarının yeniden eklenmesini önler.
