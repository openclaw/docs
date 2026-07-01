---
read_when:
    - OpenClaw çalışma zamanı verilerini, önbelleği, transkriptleri, görev durumunu veya geçici dosyaları SQLite’a taşıma
    - Eski JSON veya JSONL dosyalarından doctor migrasyonları tasarlama
    - Yedekleme, geri yükleme, VFS veya worker depolama davranışını değiştirme
    - Oturum kilitlerini kaldırma, budama, kısaltma veya JSON uyumluluk yolları
summary: SQLite'i birincil kalıcı durum ve önbellek katmanı hâline getirirken yapılandırmayı dosya tabanlı tutmaya yönelik geçiş planı
title: Veritabanı öncelikli durum yeniden düzenlemesi
x-i18n:
    generated_at: "2026-07-01T20:33:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 566e6aacfaa6aff0db2d1d143ef313d0ce97b82428152bc8940856e317a149ff
    source_path: refactor/database-first.md
    workflow: 16
---

# Veritabanı Öncelikli Durum Refaktörü

## Karar

İki seviyeli SQLite yerleşimi kullanın:

- Global veritabanı: `~/.openclaw/state/openclaw.sqlite`
- Agent veritabanı: agent’a ait çalışma alanı, döküm,
  VFS, artifact ve agent başına büyük runtime durumu için agent başına bir SQLite veritabanı
- Yapılandırma dosya destekli kalır: `openclaw.json` veritabanının dışında
  kalır. Runtime auth profilleri SQLite’a taşınır; harici sağlayıcı veya CLI
  kimlik bilgisi dosyaları OpenClaw’ın veritabanı dışında sahipleri tarafından yönetilmeye devam eder.

Global veritabanı control-plane veritabanıdır. Agent keşfi,
paylaşılan gateway durumu, eşleştirme, cihaz/node durumu, görev ve akış defterleri, plugin
durumu, zamanlayıcı runtime durumu, yedekleme meta verileri ve migration durumunun sahibidir.

Agent veritabanı data-plane veritabanıdır. Agent’ın oturum
meta verilerinin, döküm olay akışının, VFS çalışma alanının veya scratch ad alanının, araç
artifact’lerinin, çalıştırma artifact’lerinin ve aranabilir/dizinlenebilir agent’a yerel cache verilerinin sahibidir.

Bu, büyük agent çalışma alanlarını, dökümleri ve ikili scratch verilerini
paylaşılan Gateway yazma yoluna zorlamadan tek bir kalıcı global görünüm sağlar.

## Katı Sözleşme

Bu migration’ın tek bir kanonik runtime şekli vardır:

- Oturum satırları yalnızca oturum meta verilerini kalıcılaştırır. `transcriptLocator`,
  döküm dosyası yolları, sibling JSONL yolları, kilit yolları,
  pruning meta verileri veya dosya dönemi uyumluluk işaretçileri kalıcılaştırmamalıdır.
- Döküm kimliği her zaman SQLite kimliğidir: `{agentId, sessionId}` artı
  protokolün ihtiyaç duyduğu yerde isteğe bağlı konu meta verileri.
- `sqlite-transcript://...` bir runtime veya protokol kimliği değildir. Yeni kod
  döküm locator’ları türetmemeli, kalıcılaştırmamalı, geçirmemeli, parse etmemeli veya migrate etmemelidir. Runtime ve
  testler hiçbir pseudo-locator içermemelidir; dokümanlar bu dizeyi
  yalnızca yasaklamak için anabilir.
- Eski `sessions.json`, döküm JSONL, `.jsonl.lock`, pruning, kısaltma
  ve eski oturum yolu mantığı yalnızca doctor migration/import yoluna aittir.
- Eski oturum yapılandırma alias’ları yalnızca doctor migration’a aittir. Runtime
  `session.idleMinutes`, `session.resetByType.dm` veya
  başka bir yapılandırılmış agent için agent’lar arası `agent:main:*` ana oturum alias’larını yorumlamaz.
- Oturum yönlendirme kimliği typed relational state’tir. Sıcak runtime ve UI yolları
  `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations` ve
  `session_conversations` okumalıdır; eski çağrı noktaları silinirken bir uyumluluk
  gölgesi dışında `session_key` parse etmemeli veya sağlayıcı kimliği için
  `session_entries.entry_json` kazımamalıdır.
- `dm` ile `direct` gibi kanal seviyesindeki direct-message işaretçileri yönlendirme
  sözlüğüdür; döküm locator’ları veya dosya deposu uyumluluk handle’ları değildir.
- Eski hook handler yapılandırması yalnızca doctor uyarı/migration yüzeylerine aittir.
  Runtime `hooks.internal.handlers` yüklememelidir; hook’lar yalnızca keşfedilen
  hook dizinleri ve `HOOK.md` meta verileri üzerinden çalışır.
- Runtime başlatma, sıcak yanıt yolları, Compaction, reset, kurtarma, tanılama,
  TTS, bellek hook’ları, alt agent’lar, plugin komut yönlendirme, protokol sınırları ve
  hook’lar runtime boyunca `{agentId, sessionId}` geçirmelidir.
- Testler SQLite döküm satırlarını `{agentId, sessionId}` üzerinden seed etmeli ve doğrulamalıdır.
  Yalnızca JSONL yolu iletmeyi, çağıranın sağladığı locator korumasını veya
  döküm dosyası uyumluluğunu kanıtlayan testler, doctor import’u, oturum dışı destek/debug
  materialization veya protokol şeklini kapsamıyorsa silinmelidir.
- `runEmbeddedPiAgent(...)`, hazırlanmış worker çalıştırmaları ve iç embedded
  deneme döküm locator’larını kabul etmemelidir. SQLite döküm
  yöneticisini `{agentId, sessionId}` ile açar ve bu yöneticiyi içselleştirilmiş
  PI uyumlu agent oturumuna geçirirler; böylece eski çağıranlar runner’ın
  JSON/JSONL dökümleri yazmasına neden olamaz.
- Runner tanılamaları runtime/cache/payload trace kayıtlarını SQLite’ta saklamalıdır.
  Runtime tanılamaları JSONL dosya override düğmeleri veya genel
  döküm JSONL export helper’ları sunmamalıdır; kullanıcıya dönük export’lar, dosya adlarını runtime’a geri beslemeden veritabanı satırlarından açık
  artifact’ler materialize edebilir.
- Ham stream logging, `OPENCLAW_RAW_STREAM=1` artı SQLite tanılama satırlarını kullanır.
  Eski pi-mono `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH` ve
  `raw-openai-completions.jsonl` dosya logger sözleşmesi OpenClaw
  runtime’ının veya testlerinin parçası değildir.
- QMD bellek dizinleme SQLite dökümlerini markdown dosyalarına export etmemelidir.
  QMD yalnızca yapılandırılmış bellek dosyalarını dizinler; oturum dökümü araması
  SQLite destekli kalır.
- QMD SDK alt yolu yeni kod için yalnızca QMD’ye özeldir. SQLite oturum dökümü
  dizinleme helper’ları `memory-core-host-engine-session-transcripts` üzerinde bulunur; herhangi bir
  QMD re-export’u yalnızca uyumluluk içindir ve runtime kodu tarafından kullanılmamalıdır.
- Yerleşik bellek dizinleri sahip agent veritabanında bulunur. Runtime yapılandırması ve
  çözümlenmiş runtime sözleşmeleri `memorySearch.store.path` sunmamalıdır; doctor
  bu eski yapılandırma anahtarını siler ve mevcut kod agent
  `databasePath` değerini dahili olarak geçirir.

Uygulama çalışması, bu ifadeler doctor/import/export/debug sınırları dışında istisnasız doğru olana kadar kod silmeye devam etmelidir.

## Hedef durum ve ilerleme

### Katı hedef

- Bir global SQLite veritabanı control-plane durumunun sahibidir:
  `state/openclaw.sqlite`.
- Agent başına bir SQLite veritabanı data-plane durumunun sahibidir:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- Yapılandırma dosya destekli kalır. `openclaw.json` bu veritabanı
  refaktörünün parçası değildir.
- Eski dosyalar yalnızca doctor migration girdileridir.
- Runtime etkin durum olarak asla oturum veya döküm JSONL yazmaz ya da okumaz.

### Hedef durumlar

- `not-started`: dosya dönemi runtime kodu hâlâ etkin durum yazar.
- `migrating`: doctor/import kodu dosya verilerini SQLite’a taşıyabilir.
- `dual-read`: geçici köprü hem SQLite hem de eski dosyaları okur. Bu durum
  açıkça doctor-only olarak belgelenmedikçe bu refaktör için yasaktır.
- `sqlite-runtime`: runtime yalnızca SQLite okur ve yazar.
- `clean`: eski runtime API’leri ve testleri kaldırılmıştır ve guard
  regressions’ı önler.
- `done`: dokümanlar, testler, yedekleme, doctor migration ve changed check’ler
  temiz durumu kanıtlar.

### Mevcut durum

- Oturumlar: runtime için `clean`. Oturum satırları agent başına veritabanında bulunur,
  runtime API’leri `{agentId, sessionId}` veya `{agentId, sessionKey}` kullanır ve
  `sessions.json` yalnızca doctor’a özel eski girdidir.
- Dökümler: runtime için `clean`. Döküm olayları, kimlikleri, snapshot’ları
  ve trajectory runtime olayları agent başına veritabanında bulunur. Runtime artık
  döküm locator’larını veya JSONL döküm yollarını kabul etmez.
- PI embedded runner: `clean`. Embedded PI çalıştırmaları, hazırlanmış worker’lar, Compaction
  ve retry döngüleri SQLite oturum scope’u kullanır ve eski döküm handle’larını reddeder.
- Cron: runtime için `clean`. Runtime `cron_jobs` ve `cron_run_logs` kullanır;
  runtime testleri SQLite `storeKey` adlandırmasını kullanır ve dosya dönemi Cron yolları
  yalnızca doctor eski migration testlerinde kalır.
- Görev kayıt yeri: `clean`. Görev ve TaskFlow runtime satırları
  `state/openclaw.sqlite` içinde bulunur; yayımlanmamış sidecar SQLite importer’ları silinmiştir.
- Plugin durumu: `clean`. Plugin durum/blob satırları paylaşılan global
  veritabanında bulunur; eski plugin-state sidecar SQLite helper’ları engellenir.
- Bellek: yerleşik bellek ve oturum dökümü dizinleme için `sqlite-runtime`.
  Bellek dizin tabloları agent başına veritabanında bulunur, plugin bellek durumu
  paylaşılan plugin-state satırlarını kullanır ve eski bellek dosyaları doctor migration girdileri
  veya kullanıcı çalışma alanı içeriğidir.
- Yedekleme: `sqlite-runtime`. Yedekleme aşamaları SQLite snapshot’larını compact eder, canlı
  WAL/SHM sidecar’larını atlar, SQLite bütünlüğünü doğrular ve yedekleme çalıştırmalarını
  global veritabanına kaydeder.
- Doctor migration: kasıtlı olarak `migrating`. Doctor eski JSON,
  JSONL ve kullanımdan kaldırılmış sidecar depolarını SQLite’a import eder, migration çalıştırmalarını/kaynaklarını kaydeder
  ve başarılı kaynakları kaldırır.
- E2E betikleri: runtime kapsamı için `clean`. Docker MCP seeding SQLite
  satırları yazar. Runtime-context Docker betiği eski JSONL’yi yalnızca
  doctor migration seed’i içinde oluşturur ve eski oturum dizin yolu adını açıkça verir.

### Kalan çalışma

- [x] Cron runtime-test store değişkenlerini, doctor eski girdileri olmadıkça `storePath` dışına
      yeniden adlandır.
      Dosyalar: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Kanıt: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Geçersizleşmiş dosya dönemi export test mock’larını kaldır veya yeniden adlandır.
      Dosya: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Kanıt: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Docker runtime-context eski JSONL seed’ini açıkça doctor-only yap.
      Dosya: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Kanıt: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` yalnızca
      `seedBrokenLegacySessionForDoctorMigration` gösterir.
- [x] Herhangi bir şema değişikliğinden sonra Kysely oluşturulmuş tiplerini hizalı tut.
      Dosyalar: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Kanıt: bu geçişte şema değişikliği yok; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Dokunulan store’lar, komutlar ve betikler için odaklı testleri yeniden çalıştır.
      Kanıt: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] `done` ilan etmeden önce changed gate’i veya uzaktan geniş kanıtı çalıştır.
      Kanıt: `pnpm check:changed --timed -- <changed extension paths>`, geçici Node 24/pnpm kurulumu ve
      senkronize edilmiş `.git` olmayan çalışma alanı için açık path routing sonrasında
      Hetzner Crabbox çalıştırması `run_3f1cabf6b25c` üzerinde geçti.

### Regresyon yapma

- Döküm locator’ı yok.
- Etkin oturum dosyası yok.
- Doctor eski migration testleri dışında sahte JSONL test fixture’ı yok.
- Kysely beklenen yerlerde ham SQLite erişimi yok.
- Yeni eski DB migration’ı yok. Bu yerleşim yayımlanmadı; güçlü bir neden olmadıkça şema sürümünü
  `1` olarak tutun.

## Kod Okuma Varsayımları

Hiçbir takip ürün kararı bu planı engellemiyor. Uygulama şu varsayımlarla
ilerlemelidir:

- Bu depolama yolu için doğrudan `node:sqlite` kullanın ve Node 22+ çalışma
  zamanını zorunlu kılın.
- Tam olarak bir normal yapılandırma dosyası tutun. Bu refaktörde yapılandırmayı,
  Plugin manifestlerini veya Git çalışma alanlarını SQLite'a taşımayın.
- Çalışma zamanı uyumluluk dosyaları gerekli değildir. Eski JSON ve JSONL
  dosyaları yalnızca migrasyon girdileridir. Dal yerel SQLite yan dosyaları hiç
  yayımlanmadı ve içe aktarılmak yerine silinir.
- Eski dosyadan veritabanına migrasyon adımının sahibi `openclaw doctor --fix`tir.
  Çalışma zamanı başlatması ve `openclaw migrate`, eski OpenClaw
  veritabanı yükseltme yollarını taşımamalıdır.
- Kimlik bilgisi uyumluluğu aynı kuralı izler: çalışma zamanı kimlik bilgileri
  SQLite'ta yaşar. Eski `auth-profiles.json`, ajan başına `auth.json` ve paylaşılan
  `credentials/oauth.json` dosyaları doctor migrasyon girdileridir, ardından içe
  aktarmadan sonra kaldırılır.
- Oluşturulan model katalog durumu veritabanı desteklidir. Çalışma zamanı kodu
  `agents/<agentId>/agent/models.json` yazmamalıdır; mevcut `models.json`
  dosyaları eski doctor girdileridir ve `agent_model_catalogs` içine aktarıldıktan
  sonra kaldırılır.
- Çalışma zamanı transkript konumlayıcılarını migrate etmemeli, normalleştirmemeli
  veya köprülememelidir. Etkin transkript kimliği SQLite'ta `{agentId, sessionId}`dir.
  Dosya yolları yalnızca eski doctor girdileridir ve `sqlite-transcript://...`,
  sınır tanıtıcısı olarak ele alınmak yerine çalışma zamanı, protokol, hook ve
  Plugin yüzeylerinden kaybolmalıdır.
- Çalışma zamanı SQLite transkript okumaları eski JSONL girdi biçimi migrasyonlarını
  çalıştırmaz veya uyumluluk için tüm transkriptleri yeniden yazmaz. Eski girdi
  normalleştirmesi açık doctor/içe aktarma yardımcılarında kalır. Doctor, SQLite
  satırları eklemeden önce eski JSONL transkript dosyalarını normalleştirir;
  mevcut çalışma zamanı satırları zaten geçerli transkript şemasında yazılmıştır.
  Yörünge/oturum dışa aktarımı bu satırları olduğu gibi okur ve dışa aktarım
  zamanında eski migrasyonlar gerçekleştirmemelidir.
- Eski transkript JSONL ayrıştırma/migrasyon yardımcıları yalnızca doctor içindir.
  Çalışma zamanı transkript biçimi kodu yalnızca geçerli SQLite transkript
  bağlamını oluşturur; doctor, satırları eklemeden önce eski JSONL girdi
  yükseltmelerine sahiptir.
- Çalışma zamanının sahip olduğu eski JSONL transkript akış yardımcısı silindi.
  Doctor içe aktarma kodu açık eski dosya okumalarına sahiptir; çalışma zamanı
  oturum geçmişi SQLite satırlarını okur.
- Codex app-server bağlamaları, Codex Plugin durum ad alanında OpenClaw
  `sessionId` değerini kanonik anahtar olarak kullanır. `sessionKey`, yönlendirme/
  gösterim için metaveridir ve kalıcı oturum kimliğinin yerini almamalı veya
  transkript dosyası kimliğini yeniden canlandırmamalıdır.
- Bağlam motorları geçerli çalışma zamanı sözleşmesini doğrudan alır. Kayıt defteri,
  motorları `sessionKey`, `transcriptScope` veya `prompt` silen yeniden deneme
  shim'leriyle sarmamalıdır; geçerli veritabanı öncelikli parametreleri kabul
  edemeyen motorlar köprülenmek yerine açıkça hata vermelidir.
- Yedekleme çıktısı tek bir arşiv dosyası olarak kalmalıdır. Veritabanı içerikleri
  bu arşive ham canlı WAL yan dosyaları olarak değil, kompakt SQLite anlık
  görüntüleri olarak girmelidir.
- Transkript araması yararlıdır ancak ilk veritabanı öncelikli kesim için gerekli
  değildir. Şemayı, FTS daha sonra eklenebilecek şekilde tasarlayın.
- Worker yürütmesi, veritabanı sınırı otururken ayarların arkasında deneysel
  kalmalıdır.

## Kod Okuma Bulguları

Geçerli dal, kavram kanıtı aşamasını çoktan geçmiş durumda. Paylaşılan
veritabanı mevcut, Node `node:sqlite` küçük bir çalışma zamanı yardımcısı
üzerinden bağlanmış ve eski depolar artık `state/openclaw.sqlite` veya sahip
olan `openclaw-agent.sqlite` veritabanına yazıyor.

Kalan iş SQLite'ı seçmek değil; yeni sınırı temiz tutmak ve hâlâ eski dosya
dünyasına benzeyen uyumluluk biçimli arayüzleri silmektir:

- Oturum `storePath` artık bir çalışma zamanı kimliği, test fikstürü biçimi veya
  durum yükü alanı değildir. Çalışma zamanı ve köprü testleri artık `storePath`
  sözleşme adını içermez; doctor/migrasyon kodu bu eski söz dağarcığına sahiptir.
- Oturum yazmaları artık eski süreç içi `store-writer.ts` kuyruğundan geçmez.
  SQLite yama yazmaları bunun yerine çakışma algılama ve sınırlı yeniden deneme
  kullanır.
- Eski yol keşfinin hâlâ geçerli migrasyon kullanımları vardır, ancak çalışma
  zamanı kodu `sessions.json` ve transkript JSONL dosyalarını olası yazma
  hedefleri olarak ele almayı bırakmalıdır.
- Ajan sahipli tablolar ajan başına SQLite veritabanlarında yaşar. Global DB,
  kayıt defteri/kontrol düzlemi satırlarını tutar; transkript kimliği ajan başına
  transkript satırlarında `{agentId, sessionId}`dir. Çalışma zamanı kodu transkript
  dosya yollarını kalıcılaştırmamalı veya transkript konumlayıcılarını migrate
  etmemelidir.
- Doctor zaten birkaç eski dosyayı içe aktarıyor. Temizlik, bunu doctor'ın
  çağırdığı tek bir açık migrasyon uygulaması haline getirmek ve kalıcı bir
  migrasyon raporu sağlamaktır.

Uygulamayı engelleyen ek ürün soruları yok.

## Geçerli Kod Şekli

Dalın zaten gerçek bir paylaşılan SQLite temeli var:

- Çalışma zamanı tabanı artık Node 22+: `package.json`, CLI çalışma zamanı koruması,
  yükleyici varsayılanları, macOS çalışma zamanı bulucu, CI ve herkese açık kurulum
  belgeleri artık aynı fikirde. Eski Node 22 uyumluluk hattı kaldırıldı.
- `src/state/openclaw-state-db.ts`, `openclaw.sqlite` dosyasını açar, WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON` ayarlarını yapar ve
  `src/state/openclaw-state-schema.sql` dosyasından türetilen oluşturulmuş şema
  modülünü uygular.
- Kysely tablo türleri ve çalışma zamanı şema modülleri, commit edilmiş `.sql`
  dosyalarından oluşturulan geçici SQLite veritabanlarından üretilir; çalışma
  zamanı kodu artık global, ajan başına veya proxy yakalama veritabanları için
  kopyalanıp yapıştırılmış şema dizgeleri tutmaz.
- Çalışma zamanı depoları, seçilen ve eklenen satır türlerini SQLite satır
  biçimlerini elle gölgelemek yerine bu oluşturulmuş Kysely `DB` arayüzlerinden
  türetir. Ham SQL, şema uygulaması, pragmalar ve yalnızca migrasyona ait DDL ile
  sınırlı kalır.
- SQLite şemaları `user_version = 1` değerine indirgenmiştir, çünkü bu veritabanı
  düzeni henüz yayımlanmadı. Çalışma zamanı açıcıları yalnızca geçerli şemayı
  oluşturur; dosyadan veritabanına içe aktarma doctor kodunda kalır ve dala özgü
  veritabanı yükseltme yardımcıları silinmiştir.
- İlişkisel sahiplik, sahiplik sınırının kanonik olduğu yerlerde zorunlu kılınır:
  kaynak migrasyon satırları `migration_runs` üzerinden, görev teslim durumu
  `task_runs` üzerinden ve transkript kimliği satırları transkript olayları
  üzerinden kademeli olarak silinir.
- Geçerli paylaşılan tablolar şunları içerir: `agent_databases`,
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
- Rastgele Plugin sahipliğindeki durum, host sahipliğinde tipli tablolar almaz.
  Kurulu pluginler, sürümlü JSON yükleri için `plugin_state_entries` ve baytlar
  için `plugin_blob_entries` kullanır; namespace/key sahipliği, TTL temizliği,
  yedekleme ve Plugin migrasyon kayıtlarıyla birlikte. Host, sorgu sözleşmesine
  sahip olduğunda host sahipliğindeki Plugin orkestrasyon durumu hâlâ tipli
  tablolara sahip olabilir; örneğin `plugin_binding_approvals`.
- Plugin migrasyonları, host şema migrasyonları değil, Plugin sahipliğindeki
  namespace’ler üzerinde veri migrasyonlarıdır. Bir Plugin, kendi sürümlü
  durum/blob girdilerini bir migrasyon sağlayıcısı üzerinden migrate edebilir ve
  host, kaynak/çalıştırma durumunu normal migrasyon defterine kaydeder. Yeni
  Plugin kurulumları, host yeni bir pluginler arası sözleşmenin sahipliğini
  bizzat üstlenmediği sürece `openclaw-state-schema.sql` dosyasını değiştirmeyi
  gerektirmez.
- `src/state/openclaw-agent-db.ts`,
  `agents/<agentId>/agent/openclaw-agent.sqlite` dosyasını açar, veritabanını
  global DB’ye kaydeder ve ajan yerel oturum, transkript, VFS, artifact, önbellek
  ve bellek dizini tablolarının sahipliğini üstlenir. Paylaşılan çalışma zamanı
  keşfi artık her çağrı noktasında bu sorguyu yeniden uygulamak yerine
  oluşturulmuş tipli `agent_databases` kayıt defterini okur.
- Global ve ajan başına veritabanları, veritabanı rolü, şema sürümü, zaman
  damgaları ve ajan veritabanları için ajan kimliği içeren bir `schema_meta`
  satırı kaydeder. Bu SQLite şeması henüz yayımlanmadığı için düzen hâlâ
  `user_version = 1` değerinde kalır.
- Ajan başına oturum kimliğinin artık `session_id` ile anahtarlanan kanonik bir
  `sessions` kök tablosu vardır; `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, zaman damgaları, görüntü alanları, model metadatası,
  harness kimliği ve üst/başlatma bağlantısı sorgulanabilir sütunlardır.
  `session_routes`, `session_key` değerinden geçerli `session_id` değerine giden
  benzersiz aktif rota dizinidir; böylece bir rota anahtarı, sıcak okumaları
  yinelenen `sessions.session_key` satırları arasında seçim yapmaya zorlamadan
  yeni kalıcı bir oturuma taşınabilir. Eski uyumluluk biçimli
  `session_entries.entry_json` yükü, yabancı anahtar ile kalıcı `session_id`
  köküne bağlıdır; artık bir oturumun şema düzeyindeki tek temsili değildir.
- Ajan başına harici konuşma kimliği de ilişkiseldir:
  `conversations`, normalize edilmiş sağlayıcı/hesap/konuşma kimliğini depolar ve
  `session_conversations`, bir OpenClaw oturumunu bir veya daha fazla harici
  konuşmaya bağlar. Bu, birden fazla eşin `session_key` içinde yanıltmadan kasıtlı
  olarak tek bir oturuma eşlenebildiği paylaşılan ana DM oturumlarını kapsar.
  SQLite ayrıca doğal sağlayıcı kimliği için benzersizliği zorunlu kılar; böylece
  aynı channel/account/kind/peer/thread demeti conversation id’ler arasında
  çatallanamaz. Paylaşılan ana doğrudan eşler `participant` rolüyle bağlanır; bu
  sayede tek bir OpenClaw oturumu, eski eşleri belirsiz ilişkili satırlara
  düşürmeden birden fazla harici DM eşini temsil edebilir.
  `sessions.primary_conversation_id` hâlâ geçerli tipli teslim hedefine işaret
  eder. Kapalı yönlendirme/durum sütunları, yalnızca TypeScript union’larına
  güvenmek yerine SQLite `CHECK` kısıtlarıyla zorunlu kılınır.
  Çalışma zamanı oturum projeksiyonu, tipli oturum/konuşma sütunlarını uygulamadan
  önce `session_entries.entry_json` içindeki uyumluluk yönlendirme gölgelerini
  temizler; böylece bayat JSON yükleri teslim hedeflerini yeniden canlandıramaz.
  Subagent duyuru yönlendirmesi de aynı şekilde tipli SQLite teslim bağlamını
  gerektirir; artık uyumluluk `SessionEntry` rota alanlarına geri düşmez.
  Gateway `chat.send` açık teslim kalıtımı, `origin`/`last*` uyumluluk alanları
  yerine tipli SQLite teslim bağlamını okur.
  `tools.effective` de sağlayıcı/hesap/thread bağlamını bayat `last*`
  oturum-girdisi gölgelerinden değil, tipli SQLite teslim/yönlendirme
  satırlarından türetir.
  Sistem olayı prompt bağlamı, channel/to/account/thread alanlarını `origin`
  gölgeleri yerine tipli teslim alanlarından yeniden oluşturur.
  Paylaşılan `deliveryContextFromSession` yardımcısı ve oturumdan konuşmaya
  eşleyici artık `SessionEntry.origin` değerini tamamen yok sayar; sıcak rota
  kimliğini yalnızca tipli teslim alanları ve ilişkisel konuşma satırları
  oluşturabilir.
  Çalışma zamanı oturum girdisi normalleştirmesi, `entry_json` kalıcılaştırılmadan
  veya projekte edilmeden önce `origin` değerini çıkarır ve gelen metadata, yeni
  origin gölgeleri oluşturmak yerine tipli channel/chat alanları ile ilişkisel
  konuşma satırları yazar.
- Transkript olayları, transkript anlık görüntüleri ve trajectory çalışma zamanı
  olayları artık kanonik ajan başına `sessions` köküne referans verir ve oturum
  silindiğinde kademeli olarak silinir. Transkript kimliği/idempotency satırları
  tam transkript olayı satırından kademeli olarak silinmeye devam eder.
- Memory-core dizinleri artık açık ajan-veritabanı tabloları olan
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks` ve
  `memory_embedding_cache` tablolarını kullanır; `memory_index_state` revizyon
  değişikliklerini izler. İsteğe bağlı FTS/vector yan dizinleri, genel `meta`,
  `files`, `chunks`, `chunks_fts` veya `chunks_vec` tabloları yerine
  `memory_index_chunks_fts` ve `memory_index_chunks_vec` olarak adlandırılır.
  Kanonik adlar geçerli path/source satır biçimini ve serileştirilmiş embedding
  uyumluluğunu korur. Bu tablolar türetilmiş/arama önbelleğidir, kanonik
  transkript depolaması değildir; bellek çalışma alanı dosyalarından ve
  yapılandırılmış kaynaklardan silinip yeniden oluşturulabilirler.
  Yayımlanmış genel adlı bir bellek dizinini açmak; metadatasını, kaynaklarını,
  chunk’larını ve embedding önbelleğini kanonik tablolara migrate eder;
  türetilmiş FTS/vector tabloları kanonik adları altında yeniden oluşturulur.
- Subagent çalıştırma kurtarma durumu artık dizinlenmiş child, requester ve
  controller oturum anahtarlarıyla tipli paylaşılan `subagent_runs` satırlarında
  yaşar. Eski `subagents/runs.json` dosyası yalnızca doctor migrasyon girdisidir.
- Geçerli konuşma bağları artık normalize edilmiş konuşma id’siyle anahtarlanan
  tipli paylaşılan `current_conversation_bindings` satırlarında yaşar; hedef
  ajan/oturum sütunları, konuşma türü, durum, son kullanma ve metadata yinelenmiş
  opak bir bağ kaydı yerine ilişkisel sütunlar olarak depolanır. Kalıcı bağ
  anahtarı normalize edilmiş konuşma türünü içerir; böylece doğrudan/grup/kanal
  referansları çakışamaz ve SQLite geçersiz bağ türü/durum değerlerini reddeder.
  Eski `bindings/current-conversations.json` dosyası yalnızca doctor migrasyon
  girdisidir.
- Teslim kuyruğu kurtarma artık channel, hedef, hesap, oturum, yeniden deneme,
  hata, platform-gönderimi ve kurtarma durumu için tipli kuyruk sütunlarını replay
  JSON üzerine bindirir. `entry_json` replay yüklerini, hook’ları ve biçimlendirme
  yükünü tutar; ancak sıcak kuyruk yönlendirme/durumu için tipli sütunlar
  otoritatiftir.
- TUI son oturum geri yükleme işaretçileri artık hash’lenmiş TUI bağlantı/oturum
  kapsamıyla anahtarlanan tipli paylaşılan `tui_last_sessions` satırlarında yaşar.
  Eski TUI JSON dosyası yalnızca doctor migrasyon girdisidir.
- Varsayılan TTS tercihleri artık `speech-core` Plugin’i altında anahtarlanan
  paylaşılan Plugin durumu SQLite satırlarında yaşar. Eski `settings/tts.json`
  dosyası yalnızca doctor migrasyon girdisidir; çalışma zamanı artık TTS tercihleri
  JSON dosyalarını okumaz veya yazmaz ve eski path çözücü doctor migrasyon
  modülünde yaşar.
- Gizli hedef metadatası artık her kimlik bilgisi hedefi bir config dosyasıymış
  gibi davranmak yerine depolardan söz eder. `openclaw.json` config deposu olarak
  kalır; auth-profile hedefleri, JSON yükleri olarak tutulan sağlayıcı biçimli
  kimlik bilgileriyle tipli SQLite `auth_profile_stores` satırlarını kullanır.
- Gizli denetimi artık emekli edilmiş ajan başına `auth.json` dosyalarını taramaz.
  Doctor, bu eski dosya hakkında uyarma, onu içe aktarma ve kaldırma işlerinin
  sahibidir.
- Eski auth profil path yardımcıları artık doctor eski kodunda yaşar. Çekirdek
  auth profil path yardımcıları, `auth-profiles.json` veya `auth-state.json`
  çalışma zamanı path’lerini değil, SQLite auth-store kimliğini ve görüntü
  konumlarını açığa çıkarır.
- Subagent çalıştırma kurtarma ve OpenRouter model capability cache çalışma
  zamanı modülleri artık SQLite snapshot okuyucu/yazıcılarını yalnızca doctor’a
  ait eski JSON içe aktarma yardımcılarından ayrı tutar. OpenRouter capability’leri,
  tek bir opak önbellek blob’u veya sağlayıcıya özgü host tablosu yerine
  `provider_id = "openrouter"` altındaki tipli genel `model_capability_cache`
  satırlarını kullanır. Subagent çalıştırma `taskName` değeri tipli
  `subagent_runs.task_name` sütununda depolanır; `payload_json` kopyası
  replay/debug verisidir, sıcak görüntüleme veya arama alanlarının kaynağı
  değildir.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts`, ajan veritabanı
  `vfs_entries` tablosu üzerinde bir SQLite VFS uygular. Dizin okumaları,
  özyinelemeli dışa aktarmalar, silmeler ve yeniden adlandırmalar, tüm namespace’i
  taramak veya `LIKE` path eşleşmesine güvenmek yerine dizinlenmiş
  `(namespace, path)` prefix aralıklarını kullanır.
- `src/agents/runtime-worker.entry.ts`, çalışanlar için çalıştırma başına SQLite
  VFS, tool artifact, run artifact ve kapsamlı önbellek depoları oluşturur.
- Çalışma alanı bootstrap tamamlama işaretçileri artık
  `.openclaw/workspace-state.json` yerine çözümlenmiş çalışma alanı path’iyle
  anahtarlanan tipli paylaşılan `workspace_setup_state` satırlarında yaşar;
  çalışma zamanı artık eski çalışma alanı işaretçisini okumaz veya yeniden yazmaz
  ve yardımcı API’ler yalnızca depolama kimliğini türetmek için sahte bir
  `.openclaw/setup-state` path’ini ortalıkta taşımaz.
- Exec onayları artık tipli paylaşılan SQLite `exec_approvals_config` singleton
  satırında yaşar. Doctor eski `~/.openclaw/exec-approvals.json` dosyasını içe
  aktarır; çalışma zamanı yazımları artık bu dosyayı aktif depo konumu olarak
  oluşturmaz, yeniden yazmaz veya raporlamaz. macOS companion aynı
  `state/openclaw.sqlite` tablo satırını okur ve yazar; diskte yalnızca Unix
  prompt socket’ini tutar, çünkü bu IPC’dir, kalıcı çalışma zamanı durumu
  değildir.
- Cihaz kimliği, cihaz auth ve bootstrap çalışma zamanı modülleri artık SQLite
  snapshot okuyucu/yazıcılarını yalnızca doctor’a ait eski JSON içe aktarma
  yardımcılarından ayrı tutar. Cihaz kimliği tipli `device_identities` satırlarını
  ve cihaz auth token’ları tipli `device_auth_tokens` satırlarını kullanır. Cihaz
  auth yazımları, token tablosunu kesmek yerine satırları cihaz/rol bazında
  uzlaştırır ve çalışma zamanı artık tek-token güncellemelerini eski tüm-depo
  adaptörü üzerinden yönlendirmez. Eski
  sürüm-1 JSON yükleri yalnızca doctor içe/dışa aktarma şekilleri olarak bulunur.
- GitHub Copilot belirteç değişimi önbelleği, `github-copilot/token-cache/default` altında paylaşılan SQLite Plugin durum tablosunu kullanır. Sağlayıcıya ait önbellek durumudur, bu nedenle bilerek bir ana makine şema tablosu eklemez.
- GitHub Copilot Compaction artık çalışma alanı yan dosyaları olarak `openclaw-compaction-*.json` yazmaz. Harness, izlenen SDK oturumu için SDK geçmiş Compaction RPC'sini çağırır ve OpenClaw dayanıklı oturum/transkript durumunu uyumluluk işaretçi dosyaları yerine SQLite'ta tutar.
- Paylaşılan Swift çalışma zamanı (`OpenClawKit`), cihaz kimliği ve cihaz kimlik doğrulaması için aynı `state/openclaw.sqlite` satırlarını kullanır. macOS uygulama yardımcıları, ikinci bir JSON veya SQLite yolu sahiplenmek yerine paylaşılan SQLite yardımcılarını içe aktarır. Artık kalan eski bir `identity/device.json`, doctor bunu SQLite'a aktarana kadar kimlik oluşturmayı engeller; bu TypeScript ve Android başlangıç kapısıyla eşleşir.
- Android cihaz kimliği, türlendirilmiş `state/openclaw.sqlite#table/device_identities` satırlarında saklanan aynı TypeScript uyumlu anahtar malzemesini kullanır. `openclaw/identity/device.json` dosyasını asla okumaz veya yazmaz; artık kalan eski bir dosya, doctor bunu SQLite'a aktarana kadar başlangıcı engeller.
- Android önbelleğe alınmış cihaz kimlik doğrulama belirteçleri de türlendirilmiş `state/openclaw.sqlite#table/device_auth_tokens` satırlarını kullanır ve TypeScript ile Swift ile aynı sürüm-1 belirteç semantiğini paylaşır. Çalışma zamanı artık `SecurePrefs` `gateway.deviceToken*` uyumluluk anahtarlarını okumaz; bunlar yalnızca migration/doctor mantığına aittir.
- Android bildirim son paket geçmişi, türlendirilmiş `android_notification_recent_packages` satırlarını kullanır. Çalışma zamanı artık eski SharedPreferences CSV anahtarlarını taşımaz veya okumaz.
- Eski `identity/device.json` mevcut olduğunda, SQLite kimlik satırı geçersiz olduğunda veya SQLite kimlik deposu açılamadığında cihaz kimliği oluşturma güvenli kapalı şekilde başarısız olur. Doctor önce bu dosyayı içe aktarır ve kaldırır, böylece çalışma zamanı başlangıcı migration öncesinde eşleme kimliğini sessizce döndüremez.
- Cihaz kimliği seçimi, bir JSON dosya bulucusu değil, bir SQLite satır anahtarıdır. Testler ve Gateway yardımcıları açık kimlik anahtarları geçirir; kullanımdan kaldırılmış `identity/device.json` dosya adını yalnızca doctor migration ve güvenli kapalı başlangıç kapısı bilir.
- Oturum sıfırlama uyumluluğu artık doctor yapılandırma migration içinde yaşar: `session.idleMinutes`, `session.reset.idleMinutes` içine taşınır; `session.resetByType.dm`, `session.resetByType.direct` içine taşınır ve çalışma zamanı sıfırlama ilkesi yalnızca kanonik sıfırlama anahtarlarını okur.
- Eski yapılandırma uyumluluğu artık `src/commands/doctor/` altında yaşar. Normal `readConfigFileSnapshot()` doğrulaması doctor eski algılayıcılarını içe aktarmaz veya eski sorunlara açıklama eklemez; `runDoctorConfigPreflight()` bu sorunları doctor onarımı/raporlaması için ekler. Doctor yapılandırma akışı `src/commands/doctor/legacy-config.ts` dosyasını içe aktarır ve eski OAuth profil kimliği onarımı `src/commands/doctor/legacy/oauth-profile-ids.ts` altında yaşar.
- Doctor olmayan komutlar eski yapılandırma onarımını otomatik çalıştırmaz. Örneğin, `openclaw update --channel` artık geçersiz eski yapılandırmada başarısız olur ve doctor migration kodunu sessizce içe aktarmak yerine kullanıcıdan doctor çalıştırmasını ister.
- Web push, APNs, Voice Wake, güncelleme kontrolleri ve yapılandırma sağlığı artık abonelikler, VAPID anahtarları, Node kayıtları, tetikleyici satırları, yönlendirme satırları, güncelleme bildirimi durumu ve yapılandırma sağlığı girdileri için bütün opak JSON blobları yerine türlendirilmiş paylaşılan SQLite tablolarını kullanır. Web push ve APNs anlık görüntü yazımları artık tablolarını temizlemek yerine abonelikleri/kayıtları birincil anahtara göre uzlaştırır; yapılandırma sağlığı da aynısını yapılandırma yoluna göre yapar.
  Çalışma zamanı modülleri, SQLite anlık görüntü okuyucularını/yazıcılarını yalnızca doctor'a ait eski JSON içe aktarma yardımcılarından ayrı tutar.
- Node ana makine yapılandırması artık paylaşılan SQLite veritabanında türlendirilmiş tekil bir satır kullanır; doctor eski `node.json` dosyasını normal çalışma zamanı kullanımından önce içe aktarır.
- Cihaz/Node eşlemesi, kanal eşlemesi, kanal izin listeleri ve bootstrap durumu artık bütün opak JSON blobları yerine türlendirilmiş SQLite satırlarını kullanır. Plugin bağlama onayları ve Cron iş durumu da aynı ayrımı izler: çalışma zamanı modülleri SQLite destekli işlemler ve nötr anlık görüntü yardımcıları sunar; eşleme/bootstrap ile Plugin bağlama onayı anlık görüntü yazımları tabloları kırpmak yerine satırları birincil anahtara göre uzlaştırır, doctor ise eski JSON dosyalarını `src/commands/doctor/legacy/*` modülleri üzerinden içe aktarır/kaldırır.
- Kurulu Plugin kayıtları artık SQLite kurulu-Plugin dizininde yaşar. Çalışma zamanı yapılandırma okuma/yazma artık eski `plugins.installs` yazılmış-yapılandırma verilerini taşımaz veya korumaz; doctor bu eski yapılandırma şeklini normal çalışma zamanı kullanımından önce SQLite'a aktarır.
- QQBot kimlik bilgisi kurtarma anlık görüntüleri artık `qqbot/credential-backups` altında SQLite Plugin durumunda yaşar. Çalışma zamanı artık `qqbot/data/credential-backup*.json` yazmaz; QQBot doctor sözleşmesi bu eski yedekleme dosyalarını etkin durum dizininden içe aktarır ve arşivler.
- Gateway yeniden yükleme planlaması, dahili `installedPluginIndex.installRecords.*` diff ad alanı altında SQLite kurulu-Plugin dizini anlık görüntülerini karşılaştırır. Çalışma zamanı yeniden yükleme kararları artık bu satırları sahte `plugins.installs` yapılandırma nesnelerine sarmaz.
- Matrix adlandırılmış hesap kimlik bilgisi yükseltmesi artık çalışma zamanı okumaları sırasında gerçekleşmez. Tek/varsayılan bir Matrix hesabı çözümlenebildiğinde eski üst düzey `credentials/matrix/credentials.json` yeniden adlandırmasını doctor sahiplenir.
- Core eşleme ve Cron çalışma zamanı modülleri artık eski JSON yolu oluşturucuları dışa aktarmaz. Doctor'a ait eski modüller `pending.json`, `paired.json`, `bootstrap.json` ve `cron/jobs.json` kaynak yollarını yalnızca içe aktarma testleri ve migration için oluşturur. Eski Cron iş şekli normalizasyonu ve Cron çalışma günlüğü içe aktarımı `src/commands/doctor/legacy/cron*.ts` altında yaşar.
- `src/commands/doctor/legacy/runtime-state.ts`, Node ana makine yapılandırması dahil eski JSON durum dosyalarını doctor üzerinden SQLite'a aktarır. Yeni eski dosya içe aktarıcıları `src/commands/doctor/legacy/` altında kalır.
- `src/commands/doctor/state-migrations.ts`, eski `sessions.json` ve `*.jsonl` transkriptleri doğrudan SQLite'a aktarır ve başarılı kaynakları kaldırır. Artık kök eski transkriptleri `agents/<agentId>/sessions/*.jsonl` üzerinden aşamalandırmaz veya içe aktarma öncesinde kanonik bir JSONL hedefi oluşturmaz.
- Durum bütünlüğü doctor kontrolleri artık eski oturum dizinlerini taramaz veya sahipsiz JSONL silme seçeneği sunmaz. Eski transkript dosyaları yalnızca migration girdileridir ve migration adımı içe aktarma ile kaynak kaldırmayı sahiplenir.
- Eski sandbox kayıt defteri içe aktarımı `src/commands/doctor/legacy/sandbox-registry.ts` altında yaşar; etkin sandbox kayıt defteri okumaları ve yazmaları yalnızca SQLite olarak kalır.
- Eski oturum transkript sağlığı/içe aktarma onarımı `src/commands/doctor/legacy/session-transcript-health.ts` altında yaşar; çalışma zamanı komut modülleri artık JSONL transkript ayrıştırması veya etkin dal onarım kodu taşımaz.

Tamamlanan birleştirme/silme öne çıkanları:

- Plugin durumu artık paylaşılan `state/openclaw.sqlite` veritabanını kullanır. Eski
  branch yerel `plugin-state/state.sqlite` sidecar içe aktarıcısı kaldırıldı çünkü
  bu SQLite yerleşimi hiç yayımlanmadı. Probe/test yardımcıları, Plugin durumuna özel
  bir SQLite yolu göstermek yerine paylaşılan `databasePath` değerini bildirir.
- Görev ve Görev Akışı çalışma zamanı tabloları artık `tasks/runs.sqlite` ve
  `tasks/flows/registry.sqlite` yerine paylaşılan `state/openclaw.sqlite`
  veritabanında bulunur; eski sidecar içe aktarıcıları aynı yayımlanmamış yerleşim
  gerekçesiyle kaldırıldı.
- `src/config/sessions/store.ts` artık gelen metadata, rota güncellemeleri veya
  updated-at okumaları için `storePath` değerine ihtiyaç duymaz. Komut kalıcılığı, CLI
  oturum temizliği, alt ajan derinliği, kimlik doğrulama geçersiz kılmaları ve
  transkript oturum kimliği ajan/oturum satırı API'lerini kullanır. Yazmalar, iyimser
  çakışma yeniden denemesiyle SQLite satır yamaları olarak uygulanır.
- Oturum hedefi çözümleme artık eski `sessions.json` yollarını değil, ajan başına
  veritabanı hedeflerini sunar. Paylaşılan Gateway, ACP metadata, doctor rota onarımı ve
  `openclaw sessions`, `agent_databases` ile yapılandırılmış ajanları listeler.
- Gateway oturum yönlendirmesi artık `resolveGatewaySessionDatabaseTarget` kullanır;
  döndürülen hedef, eski bir oturum deposu dosya yolu yerine `databasePath` ve aday
  SQLite satır anahtarlarını taşır.
- Kanal oturumu çalışma zamanı türleri artık updated-at okumaları, gelen metadata ve
  son rota güncellemeleri için `{agentId, sessionKey}` sunar. Eski
  `saveSessionStore(storePath, store)` uyumluluk türü kaldırıldı.
- Plugin çalışma zamanı, extension API ve `config/sessions` barrel yüzeyleri artık
  Plugin kodunu SQLite destekli oturum satırı yardımcılarına yönlendirir. Kök kitaplık
  uyumluluk dışa aktarımları (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`)
  mevcut tüketiciler için kullanımdan kaldırılmış shim'ler olarak kalır. Eski
  `resolveLegacySessionStorePath` yardımcısı kaldırıldı; eski `sessions.json` yolu
  oluşturma artık migration ve test fixture'larına yereldir.
- `src/config/sessions/session-entries.sqlite.ts` artık kanonik oturum girdilerini ajan
  başına veritabanında saklar ve satır düzeyinde okuma/upsert/silme yaması desteğine
  sahiptir. Çalışma zamanı upsert/yama/silme artık büyük/küçük harf varyantlarını
  taramaz veya eski alias anahtarlarını budamaz; kanonikleştirme doctor'a aittir.
  Bağımsız JSON içe aktarma yardımcısı kaldırıldı ve migration birleştirmesi, tüm
  oturum tablosunu değiştirmek yerine daha yeni satırları upsert eder. Genel
  okuma/listeleme/yükleme yardımcıları, sıcak oturum metadata'sını tipli `sessions` ve
  `conversations` satırlarından projekte eder; `entry_json` bir uyumluluk/hata ayıklama
  gölgesidir ve tipli oturum kimliği veya teslimat bağlamı kaybedilmeden bayat ya da
  geçersiz olabilir.
- `src/config/sessions/delivery-info.ts` artık teslimat bağlamını tipli ajan başına
  `sessions` + `conversations` + `session_conversations` satırlarından çözümler.
  Artık çalışma zamanı teslimat kimliğini `session_entries.entry_json` üzerinden yeniden
  oluşturmaz; eksik bir tipli konuşma satırı, çalışma zamanı fallback'i değil bir doctor
  migration/onarım sorunudur.
- Saklanan oturum sıfırlama kararları artık tipli `sessions.session_scope`,
  `sessions.chat_type` ve `sessions.channel` metadata'sını tercih eder. `sessionKey`
  ayrıştırması yalnızca komut hedeflerindeki açık thread/topic sonekleri için kalır;
  grup ve doğrudan sıfırlama sınıflandırması artık anahtar şeklinden gelmez.
- Oturum liste/durum gösterimi sınıflandırması artık tipli sohbet metadata'sını ve
  Gateway oturum türünü kullanır. Artık `session_key` içindeki `:group:` veya
  `:channel:` alt dizelerini kalıcı grup/doğrudan doğrusu olarak değerlendirmez.
- Sessiz yanıt ilkesi seçimi artık yalnızca açık konuşma türünü veya yüzey metadata'sını
  kullanır. Artık `session_key` alt dizelerinden doğrudan/grup ilkesi tahmin etmez.
- Oturum görüntüleme modeli çözümlemesi artık ajan kimliğini `session_key` içinden
  ayırmak yerine SQLite oturum veritabanı hedefinden alır.
- Ajandan ajana duyuru hedefi hydration'ı artık yalnızca tipli `sessions.list`
  `deliveryContext` kullanır. Artık eski `origin`, yansıtılmış `last*` alanları veya
  `session_key` şeklinden kanal/hesap/thread yönlendirmesi kurtarmaz.
- `sessions_send` thread hedefi reddi artık tipli SQLite yönlendirme metadata'sını okur.
  Artık hedef anahtardan thread sonekleri ayrıştırarak hedefleri reddetmez veya kabul
  etmez.
- Grup kapsamlı araç ilkesi doğrulaması artık geçerli veya spawn edilmiş oturum için
  tipli SQLite konuşma yönlendirmesini okur. Artık `sessionKey` çözerek grup/kanal
  kimliğine güvenmez; çağıranın sağladığı grup kimlikleri, onları doğrulayan tipli
  oturum satırı olmadığında atılır.
- Kanal modeli geçersiz kılma eşleştirmesi artık açık grup ve üst konuşma metadata'sını
  kullanır. Artık üst konuşma kimliklerini `parentSessionKey` değerinden çözmez.
- Saklanan model geçersiz kılma mirası artık tipli oturum bağlamından açık bir üst
  oturum anahtarı gerektirir. Artık üst geçersiz kılmaları `sessionKey` içindeki
  `:thread:` veya `:topic:` soneklerinden türetmez.
- Eski oturum thread-info wrapper'ı ve yüklenen-Plugin thread ayrıştırıcısı kaldırıldı;
  hiçbir çalışma zamanı kodu `config/sessions/thread-info` içe aktarmaz.
- Kanal konuşma yardımcısı artık tam oturum anahtarı ayrıştırma köprüleri sunmaz. Core
  hâlâ provider'a ait ham konuşma kimliklerini `resolveSessionConversation(...)`
  üzerinden normalleştirir, ancak rota bilgilerini `sessionKey` değerinden yeniden
  oluşturmaz.
- Tamamlama teslimatı, gönderme ilkesi ve görev bakımı artık sohbet türünü `session_key`
  şeklinden türetmez. Eski sohbet türü anahtar ayrıştırıcısı silindi; bu yollar tipli
  oturum metadata'sı, tipli teslimat bağlamı veya açık teslimat hedefi söz varlığı
  gerektirir.
- Oturum liste/durum, tanılamalar, onay hesabı bağlama, TUI Heartbeat filtreleme ve
  kullanım özetleri artık provider/hesap/thread/görüntüleme yönlendirmesi için
  `SessionEntry.origin` kazımaz. Kalan tek çalışma zamanı `origin` okumaları oturum dışı
  kavramlar veya geçerli tur teslimat nesneleridir.
- Onay isteği yerel konuşma araması artık tipli ajan başına oturum yönlendirme satırlarını
  okur. Artık kanal/grup/thread konuşma kimliğini `sessionKey` değerinden ayrıştırmaz;
  eksik tipli metadata bir migration/onarım sorunudur.
- Gateway oturum değişti/sohbet/oturum olay payload'ları artık `SessionEntry.origin` veya
  `last*` rota gölgelerini yinelemez; istemciler tipli `channel`, `chatType` ve
  `deliveryContext` alır.
- Heartbeat teslimat çözümlemesi artık tipli SQLite `deliveryContext` değerini doğrudan
  alabilir ve Heartbeat çalışma zamanı, geçerli yönlendirme için uyumluluk
  `session_entries` gölgelerine güvenmek yerine ajan başına oturum teslimat satırını
  geçirir.
- Cron yalıtılmış ajan teslimat hedefi çözümlemesi de uyumluluk girdi payload'ına fallback
  yapmadan önce geçerli rotasını tipli ajan başına oturum teslimat satırından hydrate
  eder.
- Alt ajan duyuru origin çözümlemesi artık tipli istekte bulunan oturum teslimat bağlamını
  `loadRequesterSessionEntry` üzerinden geçirir ve bu satırı uyumluluk `last*`/
  `deliveryContext` gölgelerine tercih eder.
- Gelen oturum metadata güncellemeleri artık önce tipli ajan başına teslimat satırıyla
  birleştirilir; eski `SessionEntry` teslimat alanları yalnızca tipli konuşma satırı
  olmadığında fallback'tir.
- Yeniden başlatma/güncelleme teslimat çıkarımı artık tipli SQLite teslimat `threadId`
  değerinin `sessionKey` değerinden ayrıştırılmış topic/thread parçalarına üstün gelmesini
  sağlar; ayrıştırma yalnızca eski thread şekilli anahtarlar için fallback'tir.
- Hook ajan bağlamı kanal kimlikleri artık tipli SQLite konuşma kimliğini, ardından açık
  mesaj metadata'sını tercih eder. Artık `sessionKey` değerinden provider/grup/kanal
  parçalarını ayrıştırmaz.
- Gateway `chat.send` dış rota mirası artık kanal/doğrudan/grup kapsamını `sessionKey`
  parçalarından çıkarsamak yerine tipli SQLite oturum yönlendirme metadata'sını okur.
  Kanal kapsamlı oturumlar yalnızca tipli oturum kanalı ve sohbet türü saklanan teslimat
  bağlamıyla eşleştiğinde miras alır; paylaşılan-main oturumları daha sıkı
  CLI/istemci-metadata-yok kuralını korur.
- Yeniden başlatma sentinel wake ve devam yönlendirmesi artık Heartbeat wake'leri veya
  yönlendirilmiş ajan turu devamlarını kuyruğa almadan önce tipli SQLite teslimat/
  yönlendirme satırlarını okur. Artık teslimat bağlamını oturum girdisi JSON gölgesinden
  yeniden oluşturmaz.
- Gateway `tools.effective` bağlam çözümlemesi artık provider, hesap, hedef, thread ve
  yanıt modu girdileri için tipli SQLite teslimat/yönlendirme satırlarını okur. Artık bu
  sıcak yönlendirme alanlarını bayat `session_entries.entry_json` origin gölgelerinden
  kurtarmaz.
- Realtime sesli danışma yönlendirmesi artık üst/arama teslimatını tipli ajan başına
  SQLite oturum satırlarından çözümler. Artık gömülü ajan mesaj rotasını seçerken
  uyumluluk `SessionEntry.deliveryContext` gölgelerine fallback yapmaz.
- ACP spawn Heartbeat relay ve üst stream yönlendirmesi artık üst teslimatı tipli SQLite
  oturum satırlarından okur. Artık üst teslimat bağlamını uyumluluk oturum girdisi
  gölgelerinden yeniden oluşturmaz.
- Oturum teslimat rotası koruması artık tipli sohbet metadata'sını ve kalıcı teslimat
  sütunlarını izler. Artık `sessionKey` değerinden kanal ipuçları, doğrudan/main
  işaretleri veya thread şekli çıkarmaz; dahili webchat rotaları yalnızca SQLite zaten
  oturum için tipli/kalıcı teslimat kimliğine sahip olduğunda dış bir hedefi miras alır.
- Genel oturum teslimat çıkarımı artık yalnızca tam tipli SQLite oturum teslimat satırını
  okur. Artık thread/topic soneklerini ayrıştırmaz veya thread şekilli bir anahtardan
  temel oturum anahtarına fallback yapmaz.
- Yanıt gönderimi, yeniden başlatma sentinel kurtarması ve realtime sesli danışma
  yönlendirmesi artık thread yönlendirmesi için tam tipli SQLite oturum/konuşma
  satırlarını kullanır. Artık thread şekilli oturum anahtarlarını ayrıştırarak thread
  kimliklerini veya temel oturum teslimat bağlamını kurtarmaz.
- Gömülü Pi geçmiş sınırlaması artık provider, sohbet türü ve eş kimliği için tipli
  SQLite oturum yönlendirme projeksiyonunu (`sessions` + birincil `conversations`)
  kullanır. Artık provider, DM, grup veya thread şeklini `sessionKey` değerinden
  ayrıştırmaz.
- Cron araç teslimat çıkarımı artık yalnızca açık teslimatı veya geçerli tipli teslimat
  bağlamını kullanır. Artık kanal, eş, hesap veya thread hedeflerini `agentSessionKey`
  değerinden çözmez.
- Çalışma zamanı oturum satırları artık eski `lastProvider` rota alias'ını taşımaz.
  Yardımcılar ve testler tipli `lastChannel` ve `deliveryContext` alanlarını kullanır;
  eski rota alias'larını veya kalıcı `origin` gölgelerini çevirmesi gereken tek yer
  doctor migration'dır.
- Transkript olayları, VFS satırları ve araç artifact satırları artık ajan başına
  veritabanına yazar. Yayımlanmamış global transkript dosyası eşleme tablosu kaldırıldı;
  doctor bunun yerine eski kaynak yollarını kalıcı migration satırlarına kaydeder.
- Çalışma zamanı transkript araması artık JSONL byte offset'lerini taramaz veya eski
  transkript dosyalarını yoklamaz. Gateway sohbet/medya/geçmiş yolları transkript
  satırlarını SQLite'tan okur; oturum JSONL artık çalışma zamanı durumu veya dışa aktarma
  biçimi değil, yalnızca eski bir doctor girdisidir.
- Transkript üst ve branch ilişkileri, yol benzeri
  `agent-db:...transcript_events...` konumlayıcı dizeleri yerine SQLite transkript
  başlıklarında yapılandırılmış `parentTranscriptScope: {agentId, sessionId}` metadata'sı
  kullanır.
- Transkript yöneticisi sözleşmesi artık örtük kalıcı `create(cwd)` veya
  `continueRecent(cwd)` constructor'ları sunmaz. Kalıcı transkript yöneticileri açık bir
  `{agentId, sessionId}` kapsamıyla açılır; yalnızca bellek içi yöneticiler testler ve
  saf transkript dönüşümleri için kapsamsız kalır.
- Çalışma zamanı transkript deposu API'leri dosya sistemi yollarını değil, SQLite kapsamını
  çözümler. Eski `resolve...ForPath` yardımcısı ve kullanılmayan `transcriptPath` yazma
  seçenekleri çalışma zamanı çağıranlarından kaldırıldı.
- Çalışma zamanı oturum çözümlemesi artık `{agentId, sessionId}` kullanır ve dış sınırlar
  için `sqlite-transcript://<agent>/<session>` dizeleri türetmemelidir. Eski mutlak JSONL
  yolları yalnızca doctor migration girdileridir.
- Yerel hook relay doğrudan köprü kayıtları artık relay kimliğine göre anahtarlanan tipli
  paylaşılan `native_hook_relay_bridges` satırlarında bulunur. Çalışma zamanı artık bu
  kısa ömürlü köprü kayıtları için bir `/tmp` JSON kayıt defteri veya opaque genel
  kayıtlar yazmaz.
- `runEmbeddedPiAgent(...)` artık bir transkript konumlayıcı parametresine sahip değildir.
  Hazırlanan worker tanımlayıcıları da transcript konumlayıcılarını atlar. Çalışma zamanı oturum
  durumu ve kuyruğa alınmış takip çalıştırmaları, türetilmiş transcript tanıtıcıları yerine
  `{agentId, sessionId}` taşır.
- Gömülü Compaction artık SQLite kapsamını `agentId` ve `sessionId` üzerinden alır.
  Compaction hook'ları, context-engine çağrıları, CLI yetkilendirmesi ve protokol yanıtları
  türetilmiş `sqlite-transcript://...` tanıtıcıları almamalıdır. Dışa aktarma/hata ayıklama kodu
  satırlardan açık kullanıcı artefaktları oluşturabilir, ancak genel bir oturum JSONL dışa aktarma yolu sağlamaz veya dosya adlarını çalışma zamanı kimliğine geri beslemez.
- `/export-session`, transcript satırlarını SQLite'tan okur ve yalnızca istenen
  bağımsız HTML görünümünü yazar. Gömülü görüntüleyici artık bu satırlardan oturum JSONL'sini yeniden oluşturmaz veya indirmez.
- Context-engine yetkilendirmesi artık ajan kimliğini geri kazanmak için bir transcript konumlayıcısını ayrıştırmaz. Hazırlanan çalışma zamanı bağlamı, çözümlenen `agentId` değerini yerleşik Compaction adaptörüne taşır.
- Transcript yeniden yazma ve canlı araç sonucu kısaltma artık transcript durumunu
  `{agentId, sessionId}` ile okur ve kalıcı hale getirir; transcript güncelleme olayı yükleri için geçici konumlayıcılar türetmez.
- Transcript durumu yardımcı yüzeyinde artık konumlayıcı tabanlı
  `readTranscriptState`, `replaceTranscriptStateEvents` veya
  `persistTranscriptStateMutation` varyantları yoktur. Çalışma zamanı çağıranları
  `{agentId, sessionId}` API'lerini kullanmalıdır. Doctor içe aktarma, eski dosyaları açık dosya yolu ile okur ve SQLite satırları yazar; konumlayıcı dizelerini taşımaz.
- Çalışma zamanı oturum yöneticisi sözleşmesi artık `open(locator)`,
  `forkFrom(locator)` veya `setTranscriptLocator(...)` sunmaz. Kalıcı oturum yöneticileri yalnızca `{agentId, sessionId}` ile açılır; listeleme/çatallama yardımcıları transcript yöneticisi cephesi yerine satır odaklı oturum ve checkpoint API'lerinde yaşar.
- Gateway transcript okuyucu API'leri kapsam önceliklidir. `{agentId, sessionId}` alırlar ve yanlışlıkla çalışma zamanı kimliğine dönüşebilecek konumsal bir transcript konumlayıcısını kabul etmezler. Etkin transcript konumlayıcı ayrıştırması kaldırıldı; eski kaynak yolları yalnızca doctor içe aktarma kodu tarafından okunur.
- Transcript güncelleme olayları da kapsam önceliklidir. `emitSessionTranscriptUpdate`
  artık yalın bir konumlayıcı dizesi kabul etmez ve dinleyiciler bir tanıtıcı ayrıştırmadan
  `{agentId, sessionId}` ile yönlendirir.
- Gateway oturum iletisi yayını, oturum anahtarlarını transcript konumlayıcısından değil, ajan/oturum kapsamından çözümler. Eski transcript-konumlayıcıdan-oturum-anahtarına çözümleyici/önbellek kaldırıldı.
- Gateway session-history SSE, canlı güncellemeleri ajan/oturum kapsamına göre filtreler. Bir akışın güncelleme alıp almaması gerektiğine karar vermek için artık transcript konumlayıcı adaylarını, realpath'leri veya dosya biçimli transcript kimliklerini kanonik hale getirmez.
- Oturum yaşam döngüsü hook'ları artık `session_end` üzerinde transcript konumlayıcıları türetmez veya sunmaz. Hook tüketicileri `sessionId`, `sessionKey`, sonraki oturum id'leri ve ajan bağlamını alır; transcript dosyaları yaşam döngüsü sözleşmesinin parçası değildir.
- Reset hook'ları da artık transcript konumlayıcıları türetmez veya sunmaz. `before_reset` yükü kurtarılan SQLite iletilerini ve reset nedenini taşırken, oturum kimliği hook bağlamında kalır.
- Ajan harness reset artık transcript konumlayıcısı kabul etmez. Reset dağıtımı, nedenle birlikte `sessionId`/`sessionKey` kapsamındadır.
- Ajan eklenti oturum türleri artık `transcriptLocator` sunmaz; eklentiler dosya biçimli bir transcript kimliğine uzanmak yerine oturum bağlamını ve çalışma zamanı API'lerini kullanmalıdır.
- Plugin Compaction hook'ları artık transcript konumlayıcıları sunmaz. Hook bağlamı zaten oturum kimliğini taşır ve transcript okumaları dosya biçimli tanıtıcılar yerine SQLite kapsamına duyarlı API'ler üzerinden yapılmalıdır.
- `before_agent_finalize` hook'ları, yerel hook aktarma yükleri dahil olmak üzere artık `transcriptPath` sunmaz. Sonlandırma hook'ları yalnızca oturum bağlamını kullanır.
- Gateway reset yanıtları artık döndürülen girdide bir transcript konumlayıcısı sentezlemez. Reset, SQLite transcript satırları oluşturur, temiz oturum girdisini döndürür ve transcript erişimini kapsam farkındalıklı okuyuculara bırakır.
- Gömülü çalıştırma ve Compaction sonuçları artık oturum muhasebesi için transcript konumlayıcıları yüzeye çıkarmaz. Otomatik Compaction yalnızca etkin `sessionId`, Compaction sayaçları ve token metadata'sını günceller.
- Gömülü deneme sonuçları artık `transcriptLocatorUsed` döndürmez ve
  context-engine `compact()` sonuçları artık transcript konumlayıcıları döndürmez.
  Çalışma zamanı yeniden deneme döngüleri yalnızca ardıl bir `sessionId` kabul eder.
- Teslimat aynası transcript ekleme sonuçları artık transcript konumlayıcıları döndürmez. Çağıranlar eklenen `messageId` değerini alır; transcript güncelleme sinyalleri SQLite kapsamını kullanır.
- Üst oturum çatallama yardımcıları yalnızca çatallanan `sessionId` değerini döndürür. Alt ajan hazırlığı, alt ajan/oturum kapsamını motorlara geçirir.
- CLI runner parametreleri ve geçmiş yeniden tohumlama artık transcript konumlayıcıları kabul etmez. CLI geçmiş okumaları, SQLite transcript kapsamını `{agentId,
sessionId}` ve oturum anahtarı bağlamından çözümler.
- CLI ve gömülü runner test fikstürleri artık etkin oturumları `*.jsonl` dosyaları gibi göstermeye veya çalışma zamanı parametrelerinden bir `sqlite-transcript://...` dizesi geçirmeye çalışmak yerine, SQLite transcript satırlarını oturum id'siyle tohumlar ve okur.
- Oturum araç sonucu koruma olayları, bellek içi yöneticinin türetilmiş bir konumlayıcısı olmasa bile bilinen oturum kapsamından yayılır. Testleri artık etkin
  `/tmp/*.jsonl` transcript dosyalarını taklit etmez.
- BTW ve Compaction checkpoint yardımcıları artık transcript satırlarını SQLite kapsamına göre okur ve çatallar. Checkpoint metadata'sı artık yalnızca oturum id'lerini ve yaprak/girdi id'lerini saklar; türetilmiş konumlayıcılar artık checkpoint yüklerine yazılmaz.
- Gateway transcript-key araması, protokol sınırlarında SQLite transcript kapsamını kullanır ve artık transcript dosya adlarına realpath veya stat uygulamaz.
- Otomatik Compaction transcript rotasyonu, ardıl transcript satırlarını doğrudan SQLite transcript deposu üzerinden yazar. Oturum satırları yalnızca ardıl oturum kimliğini tutar; kalıcı bir JSONL yolu veya kalıcı konumlayıcı tutmaz.
- Gömülü context-engine Compaction, SQLite adlı transcript rotasyonu yardımcılarını kullanır. Rotasyon testleri artık JSONL ardıl yolları oluşturmaz veya etkin oturumları dosya olarak modellemez.
- Yönetilen giden görüntü saklama, transcript ileti önbelleğini dosya sistemi stat çağrıları yerine SQLite transcript istatistiklerinden anahtarlar.
- Çalışma zamanı oturum kilitleri ve bağımsız eski `.jsonl.lock` doctor hattı kaldırıldı.
- Microsoft Teams çalışma zamanı barrel'ı ve herkese açık Plugin SDK artık eski dosya kilidi yardımcısını yeniden dışa aktarmaz; dayanıklı Plugin durum yolları SQLite desteklidir.
- Oturum yaş/sayı budaması ve açık oturum temizliği kaldırıldı. Doctor eski içe aktarmaya sahiptir; eski oturumlar açıkça resetlenir veya silinir.
- Doctor bütünlük denetimleri artık eski bir JSONL dosyasını SQLite oturum satırı için geçerli etkin transcript olarak saymaz. Etkin transcript sağlığı yalnızca SQLite'tır; eski JSONL dosyaları taşıma/yetim temizleme girdileri olarak raporlanır.
- Doctor artık `agents/<agent>/sessions/` dizinini gerekli çalışma zamanı durumu olarak ele almaz. Bu dizini yalnızca zaten varsa, eski içe aktarma veya yetim temizleme girdisi olarak tarar.
- Gateway `sessions.resolve`, oturum patch/reset/compact yolları, alt ajan oluşturma, hızlı iptal, ACP metadata'sı, Heartbeat ile yalıtılmış oturumlar ve TUI patchleme artık normal çalışma zamanı işinin yan etkisi olarak eski oturum anahtarlarını taşımaz veya budamaz.
- CLI komut oturumu çözümlemesi artık `storePath` yerine sahip `agentId` değerini döndürür ve normal `--to` veya `--session-id` çözümlemesi sırasında eski ana oturum satırlarını artık kopyalamaz. Eski ana satır kanonikleştirme yalnızca doctor'a aittir.
- Çalışma zamanı alt ajan derinlik çözümlemesi artık `sessions.json` veya JSON5 oturum depolarını okumaz. SQLite `session_entries` öğelerini ajan id'sine göre okur ve eski derinlik/oturum metadata'sı yalnızca doctor içe aktarma yolundan girebilir.
- Kimlik doğrulama profili oturum geçersiz kılmaları, dosya biçimli bir oturum deposu çalışma zamanını lazy-loading yapmak yerine doğrudan `{agentId, sessionKey}` satır upsert'leriyle kalıcı hale gelir.
- Otomatik yanıt ayrıntılı gating'i ve oturum güncelleme yardımcıları artık SQLite oturum satırlarını oturum kimliğine göre okur/upsert eder ve kalıcı satır durumuna dokunmadan önce eski bir depo yolu gerektirmez.
- Komut çalıştırma oturum metadata yardımcıları artık girdi odaklı adlar ve modül yolları kullanır; eski `session-store` komut yardımcısı yüzeyi kaldırıldı.
- Bootstrap başlığı tohumlama ve manuel Compaction sınırı sertleştirme artık SQLite transcript satırlarını doğrudan değiştirir. Çalışma zamanı çağıranları yazılabilir `.jsonl` yolları değil, oturum kimliğini geçirir.
- Sessiz oturum rotasyonu yeniden oynatma, son kullanıcı/asistan dönüşlerini SQLite transcript satırlarından `{agentId, sessionId}` ile kopyalar. Artık kaynak veya hedef transcript konumlayıcılarını kabul etmez.
- Yeni çalışma zamanı oturum satırları artık transcript konumlayıcıları saklamaz. Çağıranlar doğrudan `{agentId, sessionId}` kullanır; dışa aktarma/hata ayıklama komutları satırları materyalize ederken çıktı dosya adlarını seçebilir.
- Yeni bir kalıcı transcript oturumu başlatmak artık her zaman SQLite satırlarını kapsama göre açar. Oturum yöneticisi artık yeni oturumun kimliği olarak önceki dosya dönemi transcript yolunu veya konumlayıcısını yeniden kullanmaz.
- Kalıcı transcript oturumları açık
  `openTranscriptSessionManagerForSession({agentId, sessionId})` API'sini kullanır. Eski
  statik `SessionManager.create/openForSession/list/forkFromSession` cepheleri kaldırıldı; böylece testler ve çalışma zamanı kodu yanlışlıkla dosya dönemi oturum keşfini yeniden oluşturamaz.
- Plugin çalışma zamanı artık `api.runtime.agent.session.resolveTranscriptLocatorPath` sunmaz;
  Plugin kodu SQLite satır yardımcılarını ve kapsam değerlerini kullanır.
- Herkese açık `session-store-runtime` SDK yüzeyi artık yalnızca oturum satırı
  ve transcript satırı yardımcılarını dışa aktarır. Odaklanmış SQLite şema/yol/işlem yardımcıları `sqlite-runtime` içinde yaşar; ham açma/kapatma/reset yardımcıları birinci taraf testleri için yalnızca yerelde kalır.
- Eski `.jsonl` trajectory/checkpoint dosya adı sınıflandırıcıları artık doctor eski oturum dosyası modülünde yaşar. Çekirdek oturum doğrulama, normal SQLite oturum id'lerine karar vermek için artık dosya artefaktı yardımcılarını içe aktarmaz.
- Active Memory engelleyen alt ajan çalıştırmaları, Plugin durumu altında geçici veya kalıcı `session.jsonl` dosyaları oluşturmak yerine SQLite transcript satırlarını kullanır. Eski `transcriptDir` seçeneği kaldırıldı.
- Tek seferlik slug oluşturma ve Crestodian planlayıcı çalıştırmaları, geçici `session.jsonl` dosyaları oluşturmak yerine SQLite transcript satırlarını kullanır.
- `llm-task` yardımcı çalıştırmaları ve gizli taahhüt çıkarımı da SQLite
  transcript satırlarını kullanır; bu nedenle yalnızca model amaçlı bu yardımcı oturumlar artık geçici JSON/JSONL transcript dosyaları oluşturmaz.
- `TranscriptSessionManager` artık yalnızca açılmış bir SQLite transcript kapsamıdır.
  Çalışma zamanı kodu onu `openTranscriptSessionManagerForSession({agentId,
sessionId})` ile açar; oluşturma, dallandırma, devam etme, listeleme ve çatallama akışları, statik yönetici cepheleri yerine sahip oldukları SQLite satır yardımcılarında yaşar.
  Doctor/içe aktarma/hata ayıklama kodu, çalışma zamanı oturum yöneticisinin dışındaki açık eski kaynak dosyaları işler.
- Eski `SessionManager.newSession()` ve
  `SessionManager.createBranchedSession()` cephe yöntemleri kaldırıldı. Yeni
  oturumlar ve transcript ardılları, zaten açık bir yöneticiyi farklı bir kalıcı oturuma dönüştürmek yerine sahip oldukları SQLite iş akışı tarafından oluşturulur.
- Üst transcript çatallama kararları ve çatal oluşturma artık
  `storePath` veya `sessionsDir` kabul etmez; tutulan dosya sistemi yolu metadata'sı yerine `{agentId, sessionId}` SQLite transcript kapsamını kullanır.
- Memory-host artık no-op oturum dizini transcript sınıflandırma yardımcılarını dışa aktarmaz; transcript filtreleme artık girdi oluşturma sırasında SQLite satır metadata'sından türetilir.
- Memory-host ve QMD oturum dışa aktarma testleri SQLite transcript kapsamlarını kullanır. Eski
  `agents/<agentId>/sessions/*.jsonl` yolları yalnızca bir test özellikle doctor/içe aktarma/dışa aktarma uyumluluğunu kanıtladığında kapsanır.
- QA-lab ham oturum incelemesi artık Gateway üzerinden `sessions.list` kullanır
  `agents/qa/sessions/sessions.json` okumak yerine; MSteams geri bildirimi,
  bir JSONL yolu uydurmadan doğrudan SQLite transkriptlerine eklenir.
- Paylaşılan gelen kanal turları artık eski bir `storePath` yerine
  `{agentId, sessionKey}` taşır. LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch ve QQBot kayıt yolları artık updated-at meta verisini okur ve gelen
  oturum satırlarını SQLite kimliği üzerinden kaydeder.
- Transkript bulucu kalıcılığı etkin oturum satırlarından kaldırıldı.
  `resolveSessionTranscriptTarget`, `agentId`, `sessionId` ve isteğe bağlı
  konu meta verisini döndürür; eski transkript dosya adlarını içe aktaran tek
  kod doctor’dır.
- Çalışma zamanı transkript başlıkları SQLite sürümü `1` ile başlar. Eski JSONL V1/V2/V3
  şekil yükseltmeleri yalnızca doctor içe aktarmasında bulunur ve içe aktarılan başlıkları
  satırlar depolanmadan önce geçerli SQLite transkript sürümüne normalleştirir.
- Veritabanı öncelikli koruma artık `SessionManager.listAll` ve
  `SessionManager.forkFromSession` kullanımını yasaklar; oturum listeleme ve fork/geri yükleme
  iş akışları satır/kapsamlı SQLite API’lerinde kalmalıdır.
- Koruma ayrıca doctor/içe aktarma kodu dışında eski transkript JSONL ayrıştırma/etkin dal
  onarım yardımcı adlarını yasaklar; böylece çalışma zamanı ikinci bir eski
  transkript geçiş yolu geliştiremez.
- Gömülü PI çalıştırmaları gelen transkript tanıtıcılarını reddeder. Worker başlatılmadan önce
  ve deneme transkript durumuna dokunmadan önce SQLite `{agentId, sessionId}` kimliğini kullanırlar.
  Eski bir `/tmp/*.jsonl` girdisi çalışma zamanı yazma hedefi seçemez.
- Önbellek izi, Anthropic yükü, ham akış ve tanılama zaman çizelgesi kayıtları
  artık türlendirilmiş SQLite `diagnostic_events` satırlarına yazılır. Gateway kararlılık paketleri
  artık türlendirilmiş SQLite `diagnostic_stability_bundles` satırlarına yazılır. Eski
  `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` ve
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` JSONL geçersiz kılma yolları kaldırıldı ve
  normal kararlılık yakalama artık `logs/stability/*.json` dosyaları yazmaz.
- Cron kalıcılığı artık her kayıtta tüm iş tablosunu
  silip yeniden eklemek yerine SQLite `cron_jobs` satırlarını uzlaştırır. Plugin hedef
  geri yazmaları eşleşen cron satırlarını doğrudan günceller ve çalışma zamanı cron durumunu
  aynı durum veritabanı işlemi içinde tutar.
- Cron çalışma zamanı çağıranları artık kararlı bir SQLite cron depo anahtarı kullanır. Eski
  `cron.store` yolları yalnızca doctor içe aktarma girdileridir; üretim Gateway, görev
  bakımı, durum, çalışma günlüğü ve Telegram hedef geri yazma yolları
  `resolveCronStoreKey` kullanır ve artık anahtarı yol olarak normalleştirmez. Cron durumu artık
  eski dosya biçimli `storePath` alanı yerine `storeKey` bildirir.
- Cron çalışma zamanı yükleme ve zamanlama artık `jobId`, `schedule.cron`, sayısal `atMs`,
  string boolean’lar veya eksik `sessionTarget` gibi eski kalıcı iş şekillerini
  normalleştirmez. Satırlar SQLite’a eklenmeden önce bu onarımların sahibi doctor eski içe aktarmasıdır.
- ACP spawn artık transkript JSONL dosya yollarını çözümlemez veya kalıcılaştırmaz. Spawn
  ve thread-bind kurulumu SQLite oturum satırını doğrudan kalıcılaştırır ve oturum kimliğini
  korunan transkript kimliği olarak tutar.
- ACP oturum meta veri API’leri artık SQLite satırlarını `agentId` ile okur/listeler/upsert eder ve
  ACP oturum girdisi sözleşmesinin parçası olarak artık `storePath` sunmaz.
- Oturum kullanım muhasebesi ve Gateway kullanım toplama artık transkriptleri
  yalnızca `{agentId, sessionId}` ile çözer. Maliyet/kullanım önbelleği ve keşfedilen oturum
  özetleri artık transkript bulucu dizeleri sentezlemez veya döndürmez.
- Gateway sohbet ekleme, abort-partial kalıcılığı, `/sessions.send` ve
  webchat medya transkript yazmaları doğrudan SQLite transkript kapsamı üzerinden ekler.
  Gateway transkript enjeksiyon yardımcısı artık `transcriptLocator` parametresi kabul etmez.
- SQLite transkript keşfi artık yalnızca transkript kapsamlarını ve istatistikleri listeler:
  `{agentId, sessionId, updatedAt, eventCount}`. Ölü
  `listSqliteSessionTranscriptLocators` uyumluluk yardımcısı ve satır başına
  `locator` alanı kaldırıldı.
- Transkript onarım çalışma zamanı artık yalnızca
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})` sunar. Eski
  bulucu tabanlı onarım yardımcısı silindi; doctor/debug kodu açık
  kaynak dosya yollarını okur ve bulucu dizelerini asla geçirmez.
- ACP replay ledger çalışma zamanı artık oturum başına replay satırlarını
  `acp/event-ledger.json` yerine paylaşılan SQLite durum veritabanında depolar; doctor eski dosyayı
  içe aktarır ve kaldırır.
- Gateway transkript okuyucu yardımcıları artık eski
  `session-utils.fs` modül adı yerine `src/gateway/session-transcript-readers.ts` içinde yaşar.
  Fallback retry geçmişi denetimi, eski dosya yardımcısı yüzeyi yerine
  SQLite transkript içeriğine göre adlandırılır.
- Gateway enjekte edilmiş sohbet ve Compaction yardımcıları artık değerleri transkript yolları veya
  kaynak dosyalar olarak adlandırmak yerine iç yardımcı API’ler üzerinden SQLite transkript kapsamı geçirir.
- Bootstrap devam algılama artık SQLite transkript satırlarını
  `hasCompletedBootstrapTranscriptTurn` üzerinden denetler; artık dosya biçimli
  bir yardımcı adı sunmaz.
- Gömülü çalıştırıcı testleri artık SQLite transkript kimliği kullanır ve yeni bir
  transkript yöneticisi açmak her zaman açık bir `sessionId` gerektirir.
- Bellek dizinleme yardımcıları artık uçtan uca SQLite transkript terminolojisi kullanır:
  host `listSessionTranscriptScopesForAgent` ve
  `sessionTranscriptKeyForScope` dışa aktarır, hedefli eşitleme kuyrukları `sessionTranscripts` kullanır,
  genel oturum arama isabetleri opak `transcript:<agent>:<session>` yolları sunar
  ve dahili DB kaynak anahtarı sahte bir dosya yolu yerine
  `source_kind='sessions'` altında `session:<session>` olur.
- Genel Plugin SDK kalıcı tekilleştirme yardımcısı artık dosya biçimli
  seçenekler sunmaz. Çağıranlar SQLite kapsam anahtarları sağlar ve dayanıklı tekilleştirme satırları
  paylaşılan Plugin durumunda yaşar.
- Microsoft Teams SSO token’ları kilitli JSON dosyalarından SQLite Plugin
  durumuna taşındı. Doctor `msteams-sso-tokens.json` dosyasını içe aktarır, payload’lardan
  kanonik SSO token anahtarlarını yeniden oluşturur ve kaynak dosyayı kaldırır. Yetkilendirilmiş OAuth
  token’ları mevcut özel kimlik bilgisi dosyası sınırında kalır.
- Matrix eşitleme önbellek durumu `bot-storage.json` dosyasından SQLite Plugin
  durumuna taşındı. Doctor eski ham veya sarılmış eşitleme payload’larını içe aktarır ve
  kaynak dosyayı kaldırır. Etkin Matrix ve QA Matrix istemcileri sahte bir
  `sync-store.json` veya `bot-storage.json` yolu değil, bir SQLite sync-store kök
  dizini geçirir.
- Matrix eski crypto geçiş durumu
  `legacy-crypto-migration.json` dosyasından SQLite Plugin durumuna taşındı. Doctor
  eski durum dosyasını içe aktarır; Matrix SDK IndexedDB anlık görüntüleri
  `crypto-idb-snapshot.json` dosyasından SQLite Plugin blob’larına taşındı. Matrix kurtarma anahtarları ve
  kimlik bilgileri SQLite Plugin durum satırlarıdır; eski JSON dosyaları yalnızca doctor
  geçiş girdileridir.
- Memory Wiki etkinlik günlükleri artık `.openclaw-wiki/log.jsonl` yerine SQLite Plugin durumu kullanır.
  Memory Wiki geçiş sağlayıcısı eski JSONL günlüklerini içe aktarır; wiki markdown ve kullanıcı kasası
  içeriği çalışma alanı içeriği olarak dosya destekli kalır.
- Memory Wiki artık `.openclaw-wiki/state.json` veya kullanılmayan
  `.openclaw-wiki/locks` dizinini oluşturmaz. Geçiş sağlayıcısı, daha eski bir kasada hâlâ varsa
  bu emekli Plugin meta veri dosyalarını kaldırır.
- Crestodian denetim girdileri artık `audit/crestodian.jsonl` yerine çekirdek SQLite Plugin
  durumunu kullanır. Doctor eski JSONL denetim günlüğünü içe aktarır ve
  başarılı içe aktarmadan sonra kaldırır.
- Config yazma/gözlem denetim girdileri artık `logs/config-audit.jsonl` yerine çekirdek SQLite Plugin
  durumunu kullanır. Doctor eski JSONL denetim günlüğünü içe aktarır ve
  başarılı içe aktarmadan sonra kaldırır.
- macOS yardımcı uygulaması artık `openclaw.json` düzenlerken uygulama yerel
  `logs/config-audit.jsonl` veya `logs/config-health.json` sidecar’ları yazmaz. Config
  dosyası dosya destekli kalır, kurtarma anlık görüntüleri config dosyasının yanında kalır
  ve dayanıklı config denetim/sağlık durumu Gateway SQLite deposuna aittir.
- Crestodian rescue bekleyen onayları artık `crestodian/rescue-pending/*.json` yerine
  çekirdek SQLite Plugin durumunu kullanır. Doctor eski bekleyen onay
  dosyalarını içe aktarır ve başarılı içe aktarmadan sonra kaldırır.
- Phone Control geçici arm durumu artık `plugins/phone-control/armed.json` yerine
  SQLite Plugin durumu kullanır. Doctor eski armed-state
  dosyasını `phone-control/arm-state` namespace’ine içe aktarır ve dosyayı kaldırır.
- Doctor artık JSONL transkriptlerini yerinde onarmaz veya yedek JSONL
  dosyaları oluşturmaz. Etkin dalı SQLite’a içe aktarır ve eski kaynağı kaldırır.
- Session-memory hook transkript araması `{agentId, sessionId}` kapsamına özel
  SQLite okumaları kullanır. Yardımcısı artık transkript bulucuları, eski dosya okumaları
  veya dosya yeniden yazma seçenekleri kabul etmez ya da türetmez.
- Codex app-server konuşma bağlamaları artık SQLite Plugin durumunu
  OpenClaw oturum anahtarı veya açık `{agentId, sessionId}` kapsamı ile anahtarlar. Transkript yolu
  fallback bağlamalarını korumamalıdırlar.
- Codex app-server aynalanmış geçmiş okumaları yalnızca SQLite transkript kapsamını kullanır;
  kimliği transkript dosya yollarından kurtarmamalıdırlar.
- Rol sıralama ve Compaction sıfırlama yolları artık eski transkript
  dosyalarının bağlantısını kaldırmaz; sıfırlama yalnızca SQLite oturum satırını ve transkript kimliğini döndürür.
- Gateway sıfırlama ve checkpoint yanıtları temiz oturum satırları artı oturum
  kimlikleri döndürür. Artık istemciler için SQLite transkript bulucuları sentezlemezler.
- Memory-core dreaming artık eksik JSONL dosyalarını yoklayarak oturum satırlarını budamaz.
  Subagent temizliği dosya sistemi varlık denetimleri yerine oturum çalışma zamanı API’si üzerinden gider.
  Transkript alma testleri `agents/<id>/sessions` fixture’ları veya bulucu
  placeholder’ları oluşturmak yerine SQLite satırlarını doğrudan seed eder.
- Bellek transkript dizinleme, alıntı/okuma yardımcıları için sanal arama isabeti yolu olarak
  `transcript:<agentId>:<sessionId>` sunabilir. Dayanıklı dizin kaynağı
  ilişkiseldir (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), bu nedenle değer bir çalışma zamanı transkript bulucusu,
  dosya sistemi yolu değildir ve asla oturum çalışma zamanı API’lerine geri geçirilmemelidir.
- Gateway doctor bellek durumu, kısa süreli hatırlama ve phase-signal sayılarını
  `memory/.dreams/*.json` yerine SQLite Plugin durum satırlarından okur; CLI ve
  doctor çıktısı artık bu depolamayı yol değil SQLite deposu olarak etiketler.
- Memory-core çalışma zamanı, CLI durumu, Gateway doctor yöntemleri ve Plugin SDK
  facade’ları artık eski `.dreams/session-corpus` dosyalarını denetlemez veya arşivlemez.
  Bu dosyalar yalnızca geçiş girdileridir; doctor bunları SQLite’a içe aktarır ve
  doğrulamadan sonra kaynağı siler. Etkin oturum alma kanıtı satırları
  artık sanal SQLite yolu `memory/session-ingestion/<day>.txt` kullanır; çalışma zamanı
  `.dreams/session-corpus` üzerinden asla durum yazmaz veya türetmez.
- Memory-core genel artifaktları SQLite host olaylarını sanal JSON
  artifaktı `memory/events/memory-host-events.json` olarak sunar; artık eski
  `.dreams/events.jsonl` kaynak yolunu yeniden kullanmaz.
- Sandbox container/browser kayıtları artık türlendirilmiş oturum, image, zaman damgası,
  backend/config ve browser port sütunları olan paylaşılan
  `sandbox_registry_entries` SQLite tablosunu kullanır. Doctor eski monolitik ve
  parçalı JSON kayıt dosyalarını içe aktarır ve başarılı kaynakları kaldırır. Çalışma zamanı okumaları
  gerçeğin kaynağı olarak türlendirilmiş satır sütunlarını kullanır; `entry_json` yalnızca replay/debug
  kopyasıdır.
- Commitments artık tüm depo JSON blob’u yerine türlendirilmiş paylaşılan
  `commitments` tablosu kullanır. Anlık görüntü kayıtları commitment id’ye göre upsert eder ve
  tabloyu temizleyip yeniden eklemek yerine yalnızca eksik satırları siler. Çalışma zamanı
  commitment’ları türlendirilmiş kapsam, delivery-window, durum, deneme ve metin
  sütunlarından yükler; `record_json` yalnızca replay/debug kopyasıdır. Doctor eski
  `commitments.json` dosyasını içe aktarır ve başarılı içe aktarmadan sonra kaldırır.
- Cron iş tanımları, zamanlama durumu ve çalışma geçmişinde artık çalışma zamanı
  JSON yazıcıları veya okuyucuları yoktur. Çalışma zamanı türlendirilmiş zamanlama ile `cron_jobs` satırlarını kullanır,
  payload, delivery, failure-alert, session, status ve runtime-state sütunları ile durum, tanılama özeti, teslim durumu/hatası,
  session/run, model ve token toplamları için türlü
  `cron_run_logs` meta verileri. `job_json` yalnızca bir yeniden oynatma/hata ayıklama kopyasıdır; `state_json`, henüz sıcak sorgu alanları olmayan iç içe
  çalışma zamanı tanılamalarını tutarken çalışma zamanı, sıcak durum alanlarını türlü sütunlardan yeniden hidratlar. Doctor,
  eski `jobs.json`, `jobs-state.json` ve `runs/*.jsonl` dosyalarını içe aktarır ve
  içe aktarılan kaynakları kaldırır. Plugin hedef geri yazımları, tüm cron deposunu yükleyip değiştirmek yerine eşleşen `cron_jobs`
  satırlarını günceller.
- Gateway başlangıcı, çalışma zamanı projeksiyonundaki eski `notify: true` işaretlerini yok sayar. Doctor, `cron.webhook` geçerliyse bunları açık SQLite teslimine çevirir, ayarlanmamışsa etkisiz işaretleri kaldırır ve yapılandırılmış webhook geçersizse
  bunları bir uyarıyla korur.
- Giden ve oturum teslim kuyrukları artık kuyruk durumunu, giriş türünü,
  oturum anahtarını, kanalı, hedefi, hesap kimliğini, yeniden deneme sayısını, son deneme/hatayı,
  kurtarma durumunu ve platform gönderim işaretlerini paylaşılan
  `delivery_queue_entries` tablosunda türlü sütunlar olarak depolar. Çalışma zamanı kurtarması bu sıcak alanları
  türlü sütunlardan okur ve yeniden deneme/kurtarma mutasyonları, yeniden oynatma JSON'unu yeniden yazmadan bu sütunları doğrudan günceller. Tam JSON yükü yalnızca
  ileti gövdeleri ve diğer soğuk yeniden oynatma verileri için yeniden oynatma/hata ayıklama blobu olarak kalır.
- Yönetilen giden görsel kayıtları artık medya baytları hâlâ
  `media_blobs` içinde depolanırken türlü paylaşılan
  `managed_outgoing_image_records` satırlarını kullanır. JSON kaydı yalnızca yeniden oynatma/hata ayıklama kopyası olarak kalır.
- Discord model seçici tercihleri, komut dağıtım karmaları ve konu bağlamaları
  artık paylaşılan SQLite Plugin durumunu kullanır. Eski JSON içe aktarma planları
  çekirdek geçiş kodunda değil, Discord Plugin kurulum/doctor geçiş yüzeyinde yaşar.
- Plugin eski içe aktarma algılayıcıları,
  `doctor-legacy-state.ts` veya `doctor-state-imports.ts` gibi doctor adlandırmalı modüller kullanır; normal kanal çalışma zamanı
  modülleri eski JSON algılayıcılarını içe aktarmamalıdır.
- BlueBubbles yakalama imleçleri ve gelen tekilleştirme işaretleri artık paylaşılan SQLite
  Plugin durumunu kullanır. Eski JSON içe aktarma planları çekirdek geçiş kodunda değil, BlueBubbles Plugin
  kurulum/doctor geçiş yüzeyinde yaşar.
- Telegram güncelleme ofsetleri, çıkartma önbelleği satırları, gönderilmiş ileti önbelleği satırları,
  konu adı önbelleği satırları ve konu bağlamaları artık paylaşılan SQLite Plugin
  durumunu kullanır. Eski JSON içe aktarma planları çekirdek geçiş kodunda değil, Telegram Plugin
  kurulum/doctor geçiş yüzeyinde yaşar.
- iMessage yakalama imleçleri, yanıt kısa kimlik eşlemeleri ve gönderilmiş yankı tekilleştirme satırları
  artık paylaşılan SQLite Plugin durumunu kullanır. Eski `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` ve `imessage/sent-echoes.jsonl` dosyaları
  yalnızca doctor girdileridir.
- Feishu ileti tekilleştirme satırları artık
  `feishu/dedup/*.json` dosyaları yerine paylaşılan SQLite Plugin durumunu kullanır. Eski JSON içe aktarma planı çekirdek geçiş kodunda değil, Feishu
  Plugin kurulum/doctor geçiş yüzeyinde yaşar.
- Microsoft Teams konuşmaları, anketleri, bekleyen yükleme arabellekleri ve geri bildirim
  öğrenimleri artık paylaşılan SQLite Plugin durum/blob tablolarını kullanır. Bekleyen yükleme
  yolu `plugin_blob_entries` kullanır; böylece medya arabellekleri base64 JSON yerine SQLite BLOB'ları olarak depolanır. Çalışma zamanı yardımcı adları artık
  `*-fs` dosya deposu adlandırması yerine SQLite/durum adlandırmasını kullanır ve eski `storePath` shim'i bu depolardan kaldırılmıştır. Eski JSON içe aktarma planı Microsoft Teams
  Plugin kurulum/doctor geçiş yüzeyinde yaşar.
- Zalo barındırılan giden medyası artık `openclaw-zalo-outbound-media` JSON/bin geçici yan dosyaları yerine paylaşılan SQLite `plugin_blob_entries`
  kullanır.
- Diffs görüntüleyici HTML'i ve meta verileri artık `meta.json`/`viewer.html` geçici dosyaları yerine paylaşılan SQLite `plugin_blob_entries`
  kullanır. Oluşturulmuş PNG/PDF çıktıları geçici materyalleştirmeler olarak kalır
  çünkü kanal teslimi hâlâ bir dosya yoluna ihtiyaç duyar.
- Canvas yönetilen belgeleri artık varsayılan `state/canvas/documents` dizini yerine paylaşılan SQLite `plugin_blob_entries` kullanır. Canvas ana makinesi bu
  blobları doğrudan sunar; yerel dosyalar yalnızca açık `host.root`
  operatör içeriği veya aşağı akış medya okuyucusu bir yol gerektirdiğinde geçici materyalleştirme için oluşturulur.
- File Transfer denetim kararları artık sınırsız `audit/file-transfer.jsonl` çalışma zamanı günlüğü yerine paylaşılan SQLite `plugin_state_entries`
  kullanır. Doctor,
  eski JSONL denetim dosyasını Plugin durumuna içe aktarır ve temiz bir içe aktarmadan sonra kaynağı kaldırır.
- ACPX süreç kiraları ve gateway örnek kimliği artık paylaşılan SQLite Plugin
  durumunu kullanır. Doctor, eski `gateway-instance-id` dosyasını Plugin durumuna içe aktarır
  ve kaynağı kaldırır.
- ACPX oluşturulan sarmalayıcı betikleri ve yalıtılmış Codex ana dizini,
  kalıcı OpenClaw durumu değil, OpenClaw geçici kökü altında geçici materyalleştirmedir. Kalıcı ACPX çalışma zamanı kayıtları SQLite kira ve gateway-instance satırlarıdır;
  eski ACPX `stateDir` yapılandırma yüzeyi kaldırılmıştır çünkü artık oraya hiçbir çalışma zamanı durumu yazılmaz.
- Gateway medya ekleri artık kanonik bayt deposu olarak paylaşılan `media_blobs` SQLite tablosunu kullanır. Kanal ve sandbox
  uyumluluk yüzeylerine döndürülen yerel yollar, kalıcı medya deposu değil, veritabanı satırının geçici materyalleştirmeleridir. Çalışma zamanı medya izin listeleri artık eski
  `$OPENCLAW_STATE_DIR/media` veya yapılandırma dizini `media` köklerini içermez; bu dizinler
  yalnızca doctor içe aktarma kaynaklarıdır.
- Kabuk tamamlama artık `$OPENCLAW_STATE_DIR/completions/*` önbellek
  dosyaları yazmaz. Kurulum, doctor, güncelleme ve sürüm smoke yolları, kalıcı tamamlama önbellek
  dosyaları yerine oluşturulmuş tamamlama çıktısı veya profil kaynaklaması kullanır.
- Gateway skill-upload hazırlığı artık paylaşılan `skill_uploads` satırlarını kullanır. Yükleme
  meta verileri, idempotency anahtarları ve arşiv baytları SQLite içinde yaşar; yükleyici
  yalnızca bir kurulum çalışırken geçici materyalleştirilmiş arşiv yolu alır.
- Alt ajan satır içi ekleri artık çalışma alanı
  `.openclaw/attachments/*` altında materyalleştirilmez. Spawn yolu SQLite VFS seed girişleri hazırlar,
  satır içi çalıştırmalar bu girişleri ajan başına çalışma zamanı scratch ad alanına seed eder
  ve disk destekli araçlar ek yolları için bu SQLite scratch üzerine bindirir. Eski alt ajan çalıştırma attachment-dir kayıt sütunları ve temizleme kancaları kaldırılmıştır.
- CLI görsel hidratasyonu artık kararlı `openclaw-cli-images` önbellek
  dosyalarını sürdürmez. Harici CLI arka uçları hâlâ dosya yolları alır, ancak bu yollar
  temizleme ile birlikte çalıştırma başına geçici materyalleştirmelerdir.
- Cache-trace tanılamaları, Anthropic yük tanılamaları, ham model akış
  tanılamaları, tanılama zaman çizelgesi olayları ve Gateway kararlılık paketleri artık
  `logs/*.jsonl` veya `logs/stability/*.json` dosyaları yerine SQLite satırları yazar.
  Çalışma zamanı yol geçersiz kılma bayrakları ve env vars kaldırılmıştır; dışa aktarma/hata ayıklama
  komutları dosyaları veritabanı satırlarından açıkça materyalleştirebilir.
- macOS yardımcı uygulamasında artık dönen bir `diagnostics.jsonl` yazıcısı yoktur. Uygulama
  günlükleri unified logging'e gider ve kalıcı Gateway tanılamaları SQLite destekli kalır.
- macOS port-guardian kayıt listesi artık Application Support JSON dosyası
  veya opak tekil blob yerine türlü paylaşılan SQLite
  `macos_port_guardian_records` satırlarını kullanır.
- Gateway singleton kilitleri artık geçici dizin kilit dosyaları yerine
  `gateway_locks` kapsamı altında türlü paylaşılan SQLite `state_leases` satırlarını kullanır. Fly ve OAuth
  sorun giderme dokümanları artık bayat dosya kilidi temizliği yerine SQLite kira/auth yenileme kilidine işaret eder.
- Gateway yeniden başlatma sentinel durumu artık `restart-sentinel.json` yerine türlü paylaşılan SQLite
  `gateway_restart_sentinel` satırlarını kullanır; çalışma zamanı
  sentinel türünü, durumunu, yönlendirmeyi, iletiyi, devamı ve istatistikleri
  türlü sütunlardan okur. `payload_json` yalnızca bir yeniden oynatma/hata ayıklama kopyasıdır. Çalışma zamanı kodu
  SQLite satırını doğrudan temizler ve artık dosya temizleme tesisatı taşımaz.
- Gateway yeniden başlatma niyeti ve supervisor devir durumu artık
  `gateway-restart-intent.json` ve
  `gateway-supervisor-restart-handoff.json` yan dosyaları yerine türlü paylaşılan
  SQLite `gateway_restart_intent` ve `gateway_restart_handoff` satırlarını kullanır.
- Gateway singleton koordinasyonu artık `gateway.<hash>.lock` dosyaları yazmak yerine
  `gateway_locks` altında türlü `state_leases` satırlarını kullanır. Kira satırı
  kilit sahibini, süre bitimini, Heartbeat'i ve hata ayıklama yükünü sahiplenir; atomik edinme/bırakma sınırını SQLite sahiplenir. Kullanımdan kaldırılan dosya kilidi dizin seçeneği
  kaldırılmıştır; testler doğrudan SQLite satır kimliğini kullanır.
- `cron/runs/*.jsonl` dosyalarını tarayan eski başvurulmayan cron kullanım raporu yardımcısı
  silindi. Cron çalıştırma geçmişi raporları türlü
  `cron_run_logs` SQLite satırlarını okumalıdır.
- Ana oturum yeniden başlatma kurtarması artık `agents/*/sessions`
  dizinlerini taramak yerine SQLite `agent_databases` kayıt defteri üzerinden aday ajanları keşfeder.
- Gemini oturum bozulması kurtarması artık yalnızca SQLite oturum satırını siler;
  artık eski `storePath` kapısına ihtiyaç duymaz veya türetilmiş bir transcript JSONL yolunun bağlantısını kaldırmaya çalışmaz.
- Yol geçersiz kılma işleme artık gerçek `undefined`/`null` ortam
  değerlerini ayarlanmamış kabul eder; testler veya kabuk devirleri sırasında yanlışlıkla repo kökü `undefined/state/*.sqlite`
  veritabanlarının oluşmasını engeller.
- Yapılandırma sağlık parmak izleri artık `logs/config-health.json` yerine türlü paylaşılan SQLite `config_health_entries`
  satırlarını kullanır ve normal yapılandırma dosyasını tek kimlik bilgisi olmayan yapılandırma belgesi olarak tutar. macOS yardımcı uygulaması yalnızca
  süreç yerel sağlık durumunu tutar ve eski JSON yan dosyasını yeniden oluşturmaz.
- Auth profil çalışma zamanı artık kimlik bilgisi JSON dosyalarını içe aktarmaz veya yazmaz. Kanonik kimlik bilgisi deposu SQLite'tır; `auth-profiles.json`, ajan başına
  `auth.json` ve paylaşılan `credentials/oauth.json`, içe aktarmadan sonra kaldırılan doctor geçiş girdileridir.
- Auth profil kaydetme/durum testleri artık türlü SQLite auth tablolarını doğrudan doğrular
  ve eski auth-profile dosya adlarını yalnızca doctor geçiş girdileri için kullanır.
- `openclaw secrets apply` yalnızca yapılandırma dosyasını, env dosyasını ve SQLite
  auth-profile deposunu temizler. Artık kullanımdan kaldırılmış ajan başına `auth.json` dosyasını düzenleyen uyumluluk mantığını taşımaz; o dosyayı içe aktarma ve silme işini doctor sahiplenir.
- Hermes gizli geçiş planları ve uygulamaları, içe aktarılan API-key profillerini doğrudan SQLite auth-profile deposuna aktarır. Artık
  ara hedef olarak `auth-profiles.json` yazmaz veya doğrulamaz.
- Kullanıcıya dönük auth dokümanları artık
  kullanıcılara `auth-profiles.json` incelemelerini veya kopyalamalarını söylemek yerine
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` öğesini açıklar; eski OAuth/auth JSON
  adları yalnızca doctor içe aktarma girdileri olarak belgelenmiş kalır.
- Çekirdek durum yolu yardımcıları artık kullanımdan kaldırılmış `credentials/oauth.json`
  dosyasını dışa açmaz. Eski dosya adı doctor auth içe aktarma yoluna yereldir.
- Kurulum, güvenlik, onboarding, model-auth ve SecretRef dokümanları artık
  ajan başına auth-profile JSON dosyaları yerine SQLite auth-profile satırlarını ve tüm durum yedekleme/geçişini açıklar.
- PI model keşfi artık kanonik kimlik bilgilerini bellek içi
  `pi-coding-agent` auth depolamasına geçirir. Keşif sırasında artık
  ajan başına `auth.json` oluşturmaz, temizlemez veya yazmaz.
- Voice Wake tetikleyici ve yönlendirme ayarları artık `settings/voicewake.json`, `settings/voicewake-routing.json` veya opak genel satırlar yerine türlü paylaşılan SQLite tabloları kullanır; doctor eski JSON dosyalarını içe aktarır ve başarılı bir
  geçişten sonra kaldırır.
- Güncelleme denetimi durumu artık `update-check.json` veya opak genel blob yerine türlü paylaşılan `update_check_state` satırı kullanır; doctor
  eski JSON dosyasını içe aktarır ve başarılı bir geçişten sonra kaldırır.
- Yapılandırma sağlık durumu artık `logs/config-health.json` veya opak genel blob yerine türlü paylaşılan `config_health_entries` satırları kullanır; doctor
  eski JSON dosyasını içe aktarır ve başarılı bir geçişten sonra kaldırır.
- Plugin konuşma bağlama onayları artık opak paylaşılan SQLite durumu veya yerine türlü
  `plugin_binding_approvals` satırları kullanır
  `plugin-binding-approvals.json`; eski dosya bir doctor migrasyon girdisidir.
- Genel geçerli-konuşma bağlamaları artık `bindings/current-conversations.json` dosyasını yeniden yazmak yerine türlendirilmiş `current_conversation_bindings` satırları depolar; doctor eski JSON dosyasını içe aktarır ve başarılı bir migrasyondan sonra kaldırır.
- Memory Wiki içe aktarılmış-kaynak eşitleme defterleri artık `.openclaw-wiki/source-sync.json` dosyasını yeniden yazmak yerine vault/kaynak anahtarı başına bir SQLite Plugin-state satırı depolar; migrasyon sağlayıcısı eski JSON defterini içe aktarır ve kaldırır.
- Memory Wiki ChatGPT içe aktarma-çalıştırma kayıtları artık `.openclaw-wiki/import-runs/*.json` yazmak yerine vault/çalıştırma kimliği başına bir SQLite Plugin-state satırı depolar.
  Geri alma anlık görüntüleri, içe aktarma-çalıştırma anlık görüntü arşivleme blob depolamaya taşınana kadar açık vault dosyaları olarak kalır.
- Memory Wiki derlenmiş özetleri artık `.openclaw-wiki/cache/agent-digest.json` ve `.openclaw-wiki/cache/claims.jsonl` yazmak yerine SQLite Plugin blob satırları depolar. Migrasyon sağlayıcısı eski önbellek dosyalarını içe aktarır ve boşaldığında önbellek dizinini kaldırır.
- ClawHub skill kurulum takibi artık çalışma alanı/skill başına bir SQLite Plugin-state satırı depolar; çalışma zamanında `.clawhub/lock.json` ve `.clawhub/origin.json` yan dosyalarını yazmaz veya okumaz. Çalışma zamanı kodu, dosya-biçimli lockfile/origin soyutlamaları yerine izlenen-kurulum durumu nesnelerini kullanır. Doctor eski yan dosyaları yapılandırılmış aracı çalışma alanlarından içe aktarır ve temiz bir içe aktarmadan sonra kaldırır.
- Kurulu Plugin dizini artık `plugins/installs.json` yerine türlendirilmiş paylaşılan SQLite `installed_plugin_index` tekil satırını okur ve yazar; eski JSON dosyası yalnızca bir doctor migrasyon girdisidir ve içe aktarmadan sonra kaldırılır.
- Eski `plugins/installs.json` yol yardımcısı artık doctor eski kodunda yaşar. Çalışma zamanı Plugin-index modülleri JSON dosya yolu değil, yalnızca SQLite destekli kalıcılık seçeneklerini dışa açar.
- Gateway yeniden başlatma işaretleyicisi, yeniden başlatma amacı ve supervisor devir durumu artık genel opak bloblar yerine türlendirilmiş paylaşılan SQLite satırları (`gateway_restart_sentinel`, `gateway_restart_intent` ve `gateway_restart_handoff`) kullanır. Çalışma zamanı yeniden başlatma kodunun dosya-biçimli işaretleyici/amaç/devir sözleşmesi yoktur.
- Matrix eşitleme önbelleği, depolama meta verileri, iş parçacığı bağlamaları, gelen tekilleştirme işaretleyicileri, başlangıç doğrulama bekleme durumu, SDK IndexedDB kripto anlık görüntüleri, kimlik bilgileri ve kurtarma anahtarları artık paylaşılan SQLite Plugin state/blob tablolarını kullanır. Çalışma zamanı yol struct'ları artık `storage-meta.json` meta veri yolunu dışa açmaz; bu dosya adı yalnızca eski migrasyon girdisidir. Bunların eski JSON içe aktarma planı Matrix Plugin kurulum/doctor migrasyon yüzeyinde yaşar.
- Matrix başlangıcı artık eski Matrix dosya durumunu taramaz, raporlamaz veya tamamlamaz. Matrix dosya algılama, eski kripto anlık görüntü oluşturma, oda-anahtarı geri yükleme migrasyon durumu, içe aktarma ve kaynak kaldırma işlemlerinin tümü doctor'a aittir.
- Matrix çalışma zamanı migrasyon barrel'ları kaldırıldı. Eski durum/kripto algılama ve mutasyon yardımcıları, çalışma zamanı API yüzeyinin parçası olmak yerine Matrix doctor tarafından doğrudan içe aktarılır.
- Matrix migrasyon anlık görüntü yeniden kullanım işaretleyicileri artık `matrix/migration-snapshot.json` yerine SQLite Plugin state içinde yaşar; doctor aynı doğrulanmış migrasyon-öncesi arşivi yan durum dosyası yazmadan hâlâ yeniden kullanabilir.
- Nostr bus imleçleri ve profil yayımlama durumu artık paylaşılan SQLite Plugin state kullanır. Bunların eski JSON içe aktarma planı Nostr Plugin kurulum/doctor migrasyon yüzeyinde yaşar.
- Active Memory oturum açma/kapama seçenekleri artık `session-toggles.json` yerine paylaşılan SQLite Plugin state kullanır; belleği yeniden açmak bir JSON nesnesini yeniden yazmak yerine satırı siler.
- Skill Workshop teklifleri ve inceleme sayaçları artık çalışma alanı başına `skill-workshop/<workspace>.json` depoları yerine paylaşılan SQLite Plugin state kullanır. Her teklif `skill-workshop/proposals` altında ayrı bir satırdır ve inceleme sayacı `skill-workshop/reviews` altında ayrı bir satırdır.
- Skill Workshop inceleyici alt aracı çalıştırmaları artık `skill-workshop/<sessionId>.json` yan oturum yolları oluşturmak yerine çalışma zamanı oturum transkript çözümleyicisini kullanır.
- ACPX süreç kiraları artık tüm-dosya `process-leases.json` kaydı yerine `acpx/process-leases` altında paylaşılan SQLite Plugin state kullanır.
  Her kira kendi satırı olarak depolanır ve çalışma zamanı JSON yeniden yazma yolu olmadan başlangıçtaki bayat-süreç temizlemeyi korur.
- ACPX sarmalayıcı betikleri ve yalıtılmış Codex home, OpenClaw geçici kökünde oluşturulur. Gerektiğinde yeniden oluşturulurlar ve yedekleme veya migrasyon girdisi değildirler.
- Alt aracı çalıştırma kayıt kalıcılığı türlendirilmiş paylaşılan `subagent_runs` satırlarını kullanır. Eski `subagents/runs.json` yolu artık yalnızca bir doctor migrasyon girdisidir ve çalışma zamanı yardımcı adları artık durum katmanını disk destekli olarak tanımlamaz.
  Çalışma zamanı testleri artık kayıt davranışını kanıtlamak için geçersiz veya boş `runs.json` fixture'ları oluşturmaz; SQLite satırlarını doğrudan tohumlar/okur.
- Yedekleme, arşivlemeden önce durum dizinini aşamaya alır, veritabanı olmayan dosyaları kopyalar, `VACUUM INTO` ile `*.sqlite` veritabanlarının anlık görüntüsünü alır, canlı WAL/SHM yan dosyalarını atlar, arşiv manifestine anlık görüntü meta verilerini kaydeder ve tamamlanan yedekleme çalıştırmalarını arşiv manifestiyle birlikte SQLite'a kaydeder. `openclaw backup create` yazılan arşivi varsayılan olarak doğrular; `--no-verify` açık hızlı yoldur.
- `openclaw backup restore` çıkarmadan önce arşivi doğrular, doğrulayıcının normalleştirilmiş manifestini yeniden kullanır ve doğrulanmış manifest varlıklarını kayıtlı kaynak yollarına geri yükler. Yazmalar için `--yes` gerektirir ve geri yükleme planı için `--dry-run` destekler.
- Eski yedekleme volatil-yol filtresi silindi. Yedekleme artık eski oturum veya cron JSON/JSONL dosyaları için canlı-tar atlama listesine ihtiyaç duymaz, çünkü SQLite anlık görüntüleri arşiv oluşturmadan önce aşamaya alınır.
- Düz kurulum ve onboarding çalışma alanı hazırlığı artık `agents/<agentId>/sessions/` dizinleri oluşturmaz. Yalnızca config/çalışma alanı oluştururlar; SQLite oturum satırları ve transkript satırları, aracı başına veritabanında gerektiğinde oluşturulur.
- Güvenlik izin onarımı artık `sessions.json` ve transkript JSONL dosyaları yerine global ve aracı başına SQLite veritabanlarını ve WAL/SHM yan dosyalarını hedefler.
- Sandbox kayıt çalışma zamanı adları artık aktif depoda eski JSON kayıt terminolojisini taşımak yerine SQLite kayıt türlerini doğrudan tanımlar.
- `openclaw reset --scope config+creds+sessions`, yalnızca eski `sessions/` dizinlerini değil, aracı başına `openclaw-agent.sqlite` veritabanlarını ve WAL/SHM yan dosyalarını da kaldırır.
- Gateway birleşik oturum yardımcıları artık girdi-odaklı adlar kullanır:
  `loadCombinedSessionEntriesForGateway`, `{ databasePath, entries }` döndürür.
  Eski birleşik-depo adlandırması çalışma zamanı çağıranlarından kaldırıldı.
- Docker MCP kanal tohumlama artık `sessions.json` ve JSONL transkript oluşturmak yerine ana oturum satırını ve transkript olaylarını aracı başına SQLite veritabanına yazar.
- Paketli session-memory hook artık önceki-oturum bağlamını SQLite'tan `{agentId, sessionId}` ile çözümler. Artık transkript yollarını veya `workspace/sessions` dizinlerini taramaz, depolamaz veya sentezlemez.
- Paketli command-logger hook artık `logs/commands.log` dosyasına eklemek yerine komut denetim satırlarını paylaşılan SQLite `command_log_entries` tablosuna yazar.
- Kanal eşleştirme izin listeleri artık çalışma zamanında ve Plugin SDK içinde yalnızca SQLite destekli okuma/yazma yardımcılarını dışa açar. Eski `*-allowFrom.json` yol çözümleyicisi ve dosya okuyucusu yalnızca doctor eski içe aktarma kodu altında yaşar.
- `migration_runs`, eski-durum migrasyon yürütmelerini durum, zaman damgaları ve JSON raporlarıyla kaydeder.
- `migration_sources`, içe aktarılan her eski dosya kaynağını hash, boyut, kayıt sayısı, hedef tablo, çalıştırma kimliği, durum ve kaynak-kaldırma durumuyla kaydeder.
- `backup_runs`, yedekleme arşiv yollarını, durumunu ve JSON manifestlerini kaydeder.
- Global şema kullanılmayan bir `agents` kayıt tablosu tutmaz. Aracı veritabanı keşfi, çalışma zamanının gerçek bir aracı-kayıt sahibi olana kadar kanonik `agent_databases` kaydıdır.
- Oluşturulan model katalog config'i, aracı dizinine göre anahtarlanan türlendirilmiş global SQLite `agent_model_catalogs` satırlarında depolanır. Çalışma zamanı çağıranları `ensureOpenClawModelCatalog` kullanır; çalışma zamanı kodunda `models.json` uyumluluk API'si yoktur. Uygulama SQLite yazar ve gömülü PI kaydı, `models.json` dosyası oluşturmadan depolanan payload'dan doldurulur.
- QMD oturum transkript markdown dışa aktarımı ve `memory.qmd.sessions` config'i kaldırıldı. QMD transkript koleksiyonu, `qmd/sessions*` çalışma zamanı yolu veya dosya destekli oturum belleği köprüsü yoktur.
- Memory-core çalışma zamanı, SQLite transkript dizinleme yardımcılarını QMD SDK alt yolundan değil, `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts` üzerinden içe aktarır. QMD alt yolu, büyük bir SDK temizliği kaldırana kadar yalnızca dış çağıranlar için uyumluluk yeniden dışa aktarımını tutar.
- QMD'nin kendi `index.sqlite` dosyası artık ana SQLite `plugin_blob_entries` tablosu tarafından desteklenen geçici bir çalışma zamanı materyalleştirmesidir. Çalışma zamanı artık kalıcı bir `~/.openclaw/agents/<agentId>/qmd` yan dosyası oluşturmaz.
- İsteğe bağlı `memory-lancedb` Plugin artık örtük OpenClaw-yönetimli depo olarak `~/.openclaw/memory/lancedb` oluşturmaz. Bu bir dış LanceDB arka ucudur ve operatör açık bir `dbPath` yapılandırana kadar devre dışı kalır.
- `check:database-first-legacy-stores`, eski depo adlarını yazma-tarzı dosya sistemi API'leriyle eşleştiren yeni çalışma zamanı kaynağında başarısız olur. Ayrıca emekliye ayrılmış transkript köprüsü işaretleyicileri `transcriptLocator` veya `sqlite-transcript://...` öğelerini yeniden tanıtan çalışma zamanı kaynağında da başarısız olur. Migrasyon, doctor, içe aktarma ve açık oturum-dışı dışa aktarma koduna izin verilmeye devam eder. `sessionFile`, `storePath` gibi daha geniş eski sözleşme adlarının ve eski `SessionManager` dosya-dönemi facade'larının hâlâ geçerli sahipleri vardır ve zorunlu preflight kontrolüne dönüşmeden önce ayrı migrasyon guard çalışması gerekir. Guard artık çalışma zamanı `cache/*.json` depolarını, genel `thread-bindings.json` yan dosyalarını, cron durum/çalıştırma günlüğü JSON'unu, config sağlık JSON'unu, yeniden başlatma ve kilit yan dosyalarını, Voice Wake ayarlarını, Plugin bağlama onaylarını, kurulu Plugin dizini JSON'unu, File Transfer denetim JSONL'sini, Memory Wiki etkinlik günlüklerini, eski paketli `command-logger` metin günlüğünü ve pi-mono ham-akış JSONL tanılama düğmelerini de kapsar. Ayrıca eski kök-düzeyi doctor legacy modül adlarını yasaklar, böylece uyumluluk kodu `src/commands/doctor/` altında kalır. Android hata ayıklama işleyicileri de `camera_debug.log` veya `debug_logs.txt` önbellek dosyalarını aşamaya almak yerine logcat/bellek-içi çıktı kullanır.

## Hedef Şema Yapısı

Şemaları açık tutun. Ana makineye ait çalışma zamanı durumu tipli tablolar kullanır. Plugin’e ait
opak durum `plugin_state_entries` / `plugin_blob_entries` kullanır; genel bir
ana makine `kv` tablosu yoktur.

Genel veritabanı:

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

Ajan veritabanı:

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

Gelecekte arama, kanonik olay tablolarını değiştirmeden FTS tabloları ekleyebilir:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

Büyük değerler JSON dizesi kodlaması yerine `blob` sütunlarını kullanmalıdır. Düz
SQLite araçlarıyla incelenebilir kalması gereken küçük yapılandırılmış veriler için
`value_json` öğesini koruyun.

`agent_databases` bu dal için kanonik kayıttır. Gerçek bir ajan kaydı sahibi oluşana kadar
`agents` tablosu eklemeyin; ajan yapılandırması `openclaw.json` içinde kalır.

## Doctor Geçiş Yapısı

Doctor, raporlanabilir ve yeniden çalıştırılması güvenli olan tek bir açık geçiş
adımını çağırmalıdır:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix`, sıradan yapılandırma ön denetiminden sonra durum geçişi
uygulamasını çağırır ve içe aktarmadan önce doğrulanmış bir yedek oluşturur. Çalışma zamanı
başlatması ve `openclaw migrate`, eski OpenClaw durum dosyalarını içe aktarmamalıdır.

Geçiş özellikleri:

- Tek bir geçiş turu, tüm eski dosya kaynaklarını keşfeder ve herhangi bir şeyi
  değiştirmeden önce bir plan üretir.
- Doctor, eski dosyaları içe aktarmadan önce doğrulanmış bir geçiş öncesi yedek arşivi oluşturur.
- İçe aktarmalar idempotenttir ve kaynak yolu, mtime, boyut, hash ve hedef
  tabloya göre anahtarlanır.
- Başarılı kaynak dosyaları, hedef veritabanı commit edildikten sonra
  kaldırılır veya arşivlenir.
- Başarısız içe aktarmalar kaynağı dokunulmamış bırakır ve
  `migration_runs` içinde bir uyarı kaydeder.
- Çalışma zamanı kodu, geçiş oluşturulduktan sonra yalnızca SQLite okur.
- Sürüm düşürme/çalışma zamanı dosyalarına dışa aktarma yolu gerekli değildir.

## Geçiş Envanteri

Bunları genel veritabanına taşıyın:

- Görev kayıt defteri çalışma zamanı yazmaları artık paylaşılan veritabanını kullanıyor; gönderilmemiş
  `tasks/runs.sqlite` sidecar içe aktarıcısı silindi. Anlık görüntü kayıtları görev
  kimliğine göre upsert yapar ve yalnızca eksik görev/teslim satırlarını siler.
- Görev Akışı çalışma zamanı yazmaları artık paylaşılan veritabanını kullanıyor; gönderilmemiş
  `tasks/flows/registry.sqlite` sidecar içe aktarıcısı silindi. Anlık görüntü kayıtları
  akış kimliğine göre upsert yapar ve yalnızca eksik akış satırlarını siler.
- Plugin durumu çalışma zamanı yazmaları artık paylaşılan veritabanını kullanıyor; gönderilmemiş
  `plugin-state/state.sqlite` sidecar içe aktarıcısı silindi.
- Yerleşik bellek araması artık varsayılan olarak `memory/<agentId>.sqlite` kullanmıyor; dizin tabloları
  sahip ajan veritabanında bulunuyor ve açık
  `memorySearch.store.path` sidecar katılımı doctor yapılandırma
  geçişine kaldırıldı.
- Yerleşik bellek yeniden dizinleme yalnızca ajan veritabanındaki belleğe ait tabloları sıfırlar.
  Aynı veritabanı oturumları, transkriptleri, VFS satırlarını, yapıtları ve çalışma zamanı önbelleklerini
  de sahiplendiği için tüm SQLite dosyasını değiştirmemelidir.
- Tek parça ve parçalanmış JSON'dan sandbox kapsayıcı/tarayıcı kayıtları. Çalışma zamanı
  yazmaları artık paylaşılan veritabanını kullanıyor; eski JSON içe aktarımı kalıyor.
- Cron iş tanımları, zamanlama durumu ve çalıştırma geçmişi artık paylaşılan SQLite kullanıyor;
  doctor eski `jobs.json`, `jobs-state.json` ve
  `cron/runs/*.jsonl` dosyalarını içe aktarır/kaldırır
- Cihaz kimliği/kimlik doğrulaması, push, güncelleme denetimi, taahhütler, OpenRouter model
  önbelleği, yüklü Plugin dizini ve uygulama sunucusu bağlamaları
- Cihaz/düğüm eşleştirme ve bootstrap kayıtları artık tipli SQLite tabloları kullanıyor
- Cihaz eşleme bildirimi aboneleri ve teslim edilen istek işaretçileri artık
  `device-pair-notify.json` yerine paylaşılan SQLite plugin-state tablosunu kullanıyor.
- Sesli arama kayıtları artık `calls.jsonl` yerine
  `voice-call` / `calls` ad alanı altında paylaşılan SQLite plugin-state tablosunu kullanıyor; Plugin CLI
  SQLite destekli arama geçmişini takip eder ve özetler.
- QQBot Gateway oturumları, bilinen kullanıcı kayıtları ve ref-index alıntı önbelleği artık
  `session-*.json`, `known-users.json` ve `ref-index.jsonl` yerine
  `qqbot` ad alanları (`gateway-sessions`,
  `known-users`, `ref-index`) altında SQLite Plugin durumunu kullanıyor. Bu eski dosyalar önbellektir ve geçirilmez.
- Discord model seçici tercihleri, komut dağıtım hash'leri ve iş parçacığı bağlamaları
  artık `model-picker-preferences.json`, `command-deploy-cache.json` ve
  `thread-bindings.json` yerine `discord` ad alanları
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  altında SQLite Plugin durumunu kullanıyor; Discord doctor/setup geçişi eski dosyaları içe aktarır ve
  kaldırır.
- BlueBubbles yakalama imleçleri ve gelen tekilleştirme işaretçileri artık
  `bluebubbles/catchup/*.json` ve
  `bluebubbles/inbound-dedupe/*.json` yerine `bluebubbles` ad alanları (`catchup-cursors`, `inbound-dedupe`)
  altında SQLite Plugin durumunu kullanıyor; BlueBubbles doctor/setup geçişi
  eski dosyaları içe aktarır ve kaldırır.
- Telegram güncelleme ofsetleri, çıkartma önbelleği girdileri, yanıt zinciri ileti önbelleği
  girdileri, gönderilen ileti önbelleği girdileri, konu adı önbelleği girdileri ve iş parçacığı
  bağlamaları artık `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` ve
  `thread-bindings-*.json` yerine `telegram` ad alanları
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) altında SQLite Plugin durumunu kullanıyor; Telegram doctor/setup geçişi
  eski dosyaları içe aktarır ve kaldırır.
- iMessage yakalama imleçleri, yanıt kısa kimlik eşlemeleri ve gönderilen yankı tekilleştirme satırları
  artık `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` ve `imessage/sent-echoes.jsonl` yerine
  `imessage` ad alanları (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) altında SQLite Plugin durumunu kullanıyor; iMessage
  doctor/setup geçişi eski dosyaları içe aktarır ve kaldırır.
- Microsoft Teams konuşmaları, anketleri, SSO token'ları ve geri bildirim öğrenimleri artık
  `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json` ve `*.learnings.json` yerine
  SQLite Plugin durumu ad alanlarını (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) kullanıyor; Microsoft Teams doctor/setup geçişi eski dosyaları içe aktarır ve arşivler.
  Bekleyen yüklemeler kısa ömürlü bir SQLite önbelleğidir ve eski JSON önbellek dosyaları
  geçirilmez.
- Matrix senkronizasyon önbelleği, depolama metaverileri, iş parçacığı bağlamaları, gelen tekilleştirme işaretçileri,
  başlangıç doğrulama bekleme durumu, kimlik bilgileri, kurtarma anahtarları ve SDK
  IndexedDB kripto anlık görüntüleri artık `matrix` altında SQLite Plugin durumu/blob ad alanlarını
  (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  kullanıyor; bunlar `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` ve `crypto-idb-snapshot.json` yerine geçer; Matrix doctor/setup
  geçişi bu eski dosyaları hesap kapsamlı Matrix depolama köklerinden içe aktarır ve kaldırır.
- Nostr veri yolu imleçleri ve profil yayımlama durumu artık
  `bus-state-*.json` ve `profile-state-*.json` yerine
  `nostr` ad alanları (`bus-state`, `profile-state`) altında SQLite Plugin durumunu kullanıyor; Nostr doctor/setup
  geçişi eski dosyaları içe aktarır ve kaldırır.
- Active Memory oturum aç/kapat ayarları artık
  `session-toggles.json` yerine `active-memory/session-toggles` altında SQLite Plugin durumunu kullanıyor.
- Skill Workshop öneri kuyrukları ve inceleme sayaçları artık
  çalışma alanı başına `skill-workshop/<workspace>.json` dosyaları yerine
  `skill-workshop/proposals` ve `skill-workshop/reviews` altında SQLite Plugin durumunu kullanıyor.
- Giden teslim ve oturum teslim kuyrukları artık kalıcı
  `delivery-queue/*.json`, `delivery-queue/failed/*.json` ve
  `session-delivery-queue/*.json` dosyaları yerine ayrı kuyruk adları
  (`outbound-delivery`, `session-delivery`) altında genel SQLite
  `delivery_queue_entries` tablosunu paylaşıyor. Doctor eski-durum adımı
  bekleyen ve başarısız satırları içe aktarır, eski teslim edilmiş işaretçilerini kaldırır ve içe aktarmadan sonra eski
  JSON dosyalarını siler. Sıcak yönlendirme ve yeniden deneme alanları tipli sütunlardır; JSON yükü
  yalnızca yeniden oynatma/hata ayıklama için tutulur.
- ACPX süreç kiraları artık `process-leases.json` yerine `acpx/process-leases`
  altında SQLite Plugin durumunu kullanıyor.
- Yedekleme ve geçiş çalıştırma metaverileri

Bunları ajan veritabanlarına taşıyın:

- Ajan oturum kökleri ve uyumluluk biçimli session-entry yükleri. Çalışma zamanı
  yazmaları için tamamlandı: sıcak oturum metaverileri `sessions` içinde sorgulanabilirken
  eski biçimli tam `SessionEntry` yükü `session_entries` içinde kalır.
- Ajan transkript olayları. Çalışma zamanı yazmaları için tamamlandı.
- Compaction denetim noktaları ve transkript anlık görüntüleri. Çalışma zamanı yazmaları için tamamlandı:
  denetim noktası transkript kopyaları SQLite transkript satırlarıdır ve denetim noktası
  metaverileri `transcript_snapshots` içine kaydedilir. Gateway denetim noktası yardımcıları
  artık bu değerleri kaynak dosyalar yerine transkript anlık görüntüleri olarak adlandırır.
- Ajan VFS scratch/çalışma alanı ad alanları. Çalışma zamanı VFS yazmaları için tamamlandı.
- Alt ajan ek yükleri. Çalışma zamanı yazmaları için tamamlandı: bunlar SQLite VFS
  seed girdileridir ve asla kalıcı çalışma alanı dosyaları değildir.
- Araç yapıtları. Çalışma zamanı yazmaları için tamamlandı.
- Çalıştırma yapıtları. Worker çalışma zamanı yazmaları için ajan başına
  `run_artifacts` tablosu üzerinden tamamlandı.
- Ajan yerel çalışma zamanı önbellekleri. Worker çalışma zamanı kapsamlı önbellek yazmaları için
  ajan başına `cache_entries` tablosu üzerinden tamamlandı. Gateway genelindeki model önbellekleri,
  ajan özelinde hale gelmedikçe genel veritabanında kalır.
- ACP üst akış günlükleri. Çalışma zamanı yazmaları için tamamlandı.
- ACP yeniden oynatma defteri oturumları. Çalışma zamanı yazmaları için
  `acp_replay_sessions` ve `acp_replay_events` üzerinden tamamlandı; eski `acp/event-ledger.json`
  yalnızca doctor girdisi olarak kalır.
- ACP oturum metaverileri. Çalışma zamanı yazmaları için `acp_sessions` üzerinden tamamlandı; eski
  `sessions.json` içindeki `entry.acp` blokları yalnızca doctor geçiş girdisidir.
- Açık dışa aktarma dosyaları olmadıklarında yörünge sidecar'ları. Çalışma zamanı
  yazmaları için tamamlandı: yörünge yakalama, ajan veritabanı `trajectory_runtime_events`
  satırlarını yazar ve çalıştırma kapsamlı yapıtları SQLite'a yansıtır. Eski sidecar'lar yalnızca doctor
  içe aktarma girdileridir; dışa aktarma yeni JSONL destek paketi çıktıları oluşturabilir
  ancak çalışma zamanında eski yörünge/transkript sidecar'larını okumaz veya geçirmez.
  Çalışma zamanı yörünge yakalama SQLite kapsamını açığa çıkarır; JSONL yol yardımcıları
  dışa aktarma/hata ayıklama desteğine izole edilmiştir ve çalışma zamanı modülünden yeniden dışa aktarılmaz.
  Gömülü çalıştırıcı yörünge metaverileri, bir transkript konumlandırıcısını kalıcı hale getirmek yerine
  `{agentId, sessionId, sessionKey}` kimliğini kaydeder.

Bunları şimdilik dosya destekli tutun:

- `openclaw.json`
- sağlayıcı veya CLI kimlik bilgisi dosyaları
- Plugin/paket manifestleri
- disk modu seçildiğinde kullanıcı çalışma alanları ve Git depoları
- belirli bir günlük yüzeyi taşınmadıkça, operatörün takip etmesi amaçlanan günlükler

## Geçiş Planı

### Aşama 0: Sınırı Dondur

Daha fazla satır taşımadan önce kalıcı durum sınırını açık hale getirin:

- Genel veritabanına bir `migration_runs` tablosu ekleyin.
  Eski durum geçişi yürütme raporları için tamamlandı.
- Dosyadan veritabanına içe aktarma için doctor'a ait tek bir durum geçiş hizmeti ekleyin.
  Tamamlandı: `openclaw doctor --fix` eski durum geçişi uygulamasını kullanır.
- `plan` salt okunur olsun ve `apply` bir yedek oluştursun, içe aktarsın, doğrulasın ve
  ardından eski dosyaları silsin veya karantinaya alsın.
  Tamamlandı: doctor doğrulanmış bir geçiş öncesi yedek oluşturur, yedek yolunu
  `migration_runs` içine geçirir ve içe aktarıcı/kaldırma yollarını yeniden kullanır.
- Yeni çalışma zamanı kodunun eski durum dosyaları yazamaması, geçiş kodu ve testlerin ise
  bunları hâlâ seed edebilmesi/okuyabilmesi için statik yasaklar ekleyin.
  Şu anda geçirilmiş eski depolar için tamamlandı; koruma ayrıca yasaklı çalışma zamanı
  transkript konumlandırıcı sözleşmeleri için iç içe testleri de tarar.

### Aşama 1: Genel Denetim Düzlemini Tamamla

Paylaşılan koordinasyon durumunu `state/openclaw.sqlite` içinde tutun:

- Ajanlar ve ajan veritabanı kayıt defteri
- Görev ve Görev Akışı defterleri
- Plugin durumu
- Sandbox kapsayıcı/tarayıcı kayıt defteri
- Cron/zamanlayıcı çalıştırma geçmişi
- Eşleştirme, cihaz, push, güncelleme denetimi, TUI, OpenRouter/model önbellekleri ve diğer
  küçük Gateway kapsamlı çalışma zamanı durumu
- Yedekleme ve geçiş metaverileri
- Gateway medya eki baytları. Çalışma zamanı yazmaları için tamamlandı; doğrudan dosya yolları
  kanal göndericileri ve sandbox hazırlama ile uyumluluk için geçici materyalizasyonlardır.
  Çalışma zamanı izin listeleri, eski durum/yapılandırma medya köklerini değil SQLite materyalizasyon yollarını kabul eder.
  Doctor eski medya dosyalarını `media_blobs` içine aktarır ve başarılı satır yazmalarından sonra
  kaynak dosyaları kaldırır.
- Hata ayıklama proxy yakalama oturumları, olayları ve yük blob'ları. Tamamlandı: yakalamalar
  paylaşılan durum veritabanında yaşar ve paylaşılan durum veritabanı bootstrap, şema,
  WAL ve busy-timeout ayarları üzerinden açılır. Yük baytları
  `capture_blobs.data` içinde gzip ile sıkıştırılır; hata ayıklama proxy çalışma zamanı sidecar DB geçersiz kılması,
  blob dizini veya yalnızca proxy-capture için üretilmiş şema/codegen hedefi yoktur.
  Doctor/başlangıç geçişi, etkin eski DB/blob ortamı
  geçersiz kılmaları dahil gönderilmiş `debug-proxy/capture.sqlite` satırlarını
  ve başvurulan yük blob'larını içe aktarır, ardından CA sertifikalarını olduğu gibi bırakarak bu kaynakları arşivler.

Bu aşama ayrıca bu alt sistemlerden yinelenen sidecar açıcılarını, izin yardımcılarını, WAL
kurulumunu, dosya sistemi budamasını ve uyumluluk yazıcılarını siler.

### Aşama 2: Ajan Başına Veritabanlarını Tanıt

Ajan başına bir veritabanı oluşturun ve bunu genel DB'den kaydedin:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

Genel `agent_databases` satırı yolu, şema sürümünü, son görülme
zaman damgasını ve temel boyut/bütünlük metaverilerini saklar. Çalışma zamanı kodu,
dosya yollarını doğrudan türetmek yerine kayıt defterinden ajan DB'sini ister.

Ajan DB şunlara sahiptir:

- kanonik oturum kökü olarak `sessions`; bu köke bağlı
  uyumluluk biçimli yük tablosu olarak `session_entries` ve
  benzersiz etkin `session_key` araması olarak `session_routes`
- oturumlara bağlı normalleştirilmiş sağlayıcı yönlendirme kimliği olarak
  `conversations` ve `session_conversations`
- `transcript_events`
- transkript anlık görüntüleri ve Compaction kontrol noktaları. Çalışma zamanı yazmaları için tamamlandı.
- `vfs_entries`
- `tool_artifacts` ve çalıştırma artefaktları
- aracıya yerel çalışma zamanı/önbellek satırları. İşçi kapsamlı önbellekler için tamamlandı.
- ACP üst akış olayları
- açık dışa aktarma artefaktları olmadıklarında yörünge çalışma zamanı olayları

### Aşama 3: Oturum Deposu API’lerini Değiştir

Çalışma zamanı için tamamlandı. Dosya biçimli oturum deposu yüzeyi etkin bir
çalışma zamanı sözleşmesi değildir:

- Çalışma zamanı artık `loadSessionStore(storePath)` çağırmaz veya `storePath` değerini
  oturum kimliği olarak ele almaz.
- Çalışma zamanı satır işlemleri `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry` ve `listSessionEntries` şeklindedir.
- Tüm depo yeniden yazma yardımcıları, dosya yazıcıları, kuyruk testleri, takma ad ayıklama ve
  eski anahtar silme parametreleri çalışma zamanından kaldırıldı.
- Kullanımdan kaldırılmış kök paket uyumluluk dışa aktarımları hâlâ kanonik
  `sessions.json` yollarını SQLite satır API’lerine uyarlar.
- `sessions.json` ayrıştırması yalnızca doctor geçiş/içe aktarma kodunda ve
  doctor testlerinde kalır.
- Çalışma zamanı yaşam döngüsü yedek okuması JSONL ilk satırlarını değil,
  SQLite transkript başlıklarını okur.

Dosya kilidi parametrelerini, dosya bakımı olarak ayıklama/kesme söz varlığını,
depo yolu kimliğini veya tek iddiası JSON kalıcılığı olan testleri yeniden
getiren her şeyi silmeye devam edin.

### Aşama 4: Transkriptleri, ACP Akışlarını, Yörüngeleri ve VFS’yi Taşı

Her aracı veri akışını veritabanı yerel yap:

- Transkript ekleme yazmaları; oturum başlığını güvenceye alan, ileti idempotentliğini
  denetleyen, üst kuyruğu seçen, `transcript_events` içine ekleyen ve sorgulanabilir
  kimlik meta verilerini `transcript_event_identities` içinde kaydeden tek bir SQLite
  işlemi üzerinden geçer. Doğrudan transkript ileti eklemeleri ve normal kalıcı
  `TranscriptSessionManager` eklemeleri için tamamlandı; açık dal işlemleri
  kendi açık üst seçimlerini korur ve herhangi bir dosya konumlayıcı türetmeden
  SQLite satırları yazmaya devam eder.
- ACP üst akış günlükleri `.acp-stream.jsonl` dosyaları değil, satırlar olur. Tamamlandı.
- ACP başlatma kurulumu artık transkript JSONL yollarını kalıcılaştırmaz. Tamamlandı.
- Çalışma zamanı yörünge yakalama, olay satırlarını/artefaktlarını doğrudan yazar. Açık
  destek/dışa aktarma komutu hâlâ destek paketi JSONL artefaktlarını dışa aktarma biçimi
  olarak üretebilir, ancak oturum dışa aktarma oturum JSONL’sini yeniden oluşturmaz. Tamamlandı.
- Disk çalışma alanları, disk modu olarak yapılandırıldığında diskte kalır.
- VFS geçici alanı ve deneysel yalnızca VFS çalışma alanı modu aracı veritabanını kullanır.

Geçiş eski JSONL dosyalarını bir kez içe aktarır, sayıları/karmaları
`migration_runs` içinde kaydeder ve bütünlük denetimlerinden sonra içe aktarılan dosyaları kaldırır.

### Aşama 5: Yedekle, Geri Yükle, Vacuum ve Doğrula

Yedekler tek bir arşiv dosyası olarak kalır:

- Her küresel ve aracı veritabanını kontrol noktasına al.
- Her veritabanının anlık görüntüsünü SQLite yedekleme semantiğiyle veya `VACUUM INTO` ile al.
- Sıkıştırılmış veritabanı anlık görüntülerini, yapılandırmayı, harici kimlik bilgilerini ve istenen
  çalışma alanı dışa aktarımlarını arşivle.
- Ham canlı `*.sqlite-wal` ve `*.sqlite-shm` dosyalarını dışarıda bırak.
- Her veritabanı anlık görüntüsünü açıp `PRAGMA integrity_check` çalıştırarak doğrula.
  `openclaw backup create` bu arşiv doğrulamasını varsayılan olarak yapar;
  `--no-verify` yalnızca yazma sonrası arşiv geçişini atlar, anlık görüntü
  oluşturma bütünlük denetimini değil.
- Geri yükleme, anlık görüntüleri hedef yollarına geri kopyalar. Bu dal, gönderilmemiş
  SQLite düzenini `user_version = 1` değerine sıfırlar; gelecekte gönderilmiş şema değişiklikleri
  gerektiğinde açık geçişler ekleyebilir.

### Aşama 6: İşçi Çalışma Zamanı

Veritabanı ayrımı yerleşirken işçi modunu deneysel tut:

- İşçiler aracı kimliği, çalıştırma kimliği, dosya sistemi modu ve veritabanı kayıt kimliği alır.
- Her işçi kendi SQLite bağlantısını açar.
- Üst süreç kanal teslimini, onayları, yapılandırmayı ve iptal yetkisini elinde tutar.
- Etkin çalıştırma başına bir işçiyle başla; havuzlamayı yalnızca yaşam döngüsü ve veritabanı
  bağlantı sahipliği kararlı olduktan sonra ekle.

### Aşama 7: Eski Dünyayı Sil

Çalışma zamanı oturum yönetimi için tamamlandı. Eski dünyaya yalnızca açık
doctor girdisi veya destek/dışa aktarma çıktısı olarak izin verilir:

- Çalışma zamanında `sessions.json`, transkript JSONL, sandbox kayıt JSON’u, görev
  yan SQLite’ı veya Plugin durumu yan SQLite yazmaları yok.
- JSON/oturum dosyası ayıklama, dosya transkript kesme, oturum dosyası kilitleri
  veya kilit biçimli oturum testleri yok.
- Amacı eski oturum dosyalarını güncel tutmak olan çalışma zamanı uyumluluk dışa aktarımları yok.
- Açık destek dışa aktarımları kullanıcı tarafından istenen arşiv/malzemelendirme
  biçimleri olarak kalır ve dosya adlarını çalışma zamanı kimliğine geri beslememelidir.

## Yedekleme ve Geri Yükleme

Yedekler tek bir arşiv dosyası olmalıdır, ancak veritabanı yakalama
SQLite yerel olmalıdır:

1. Uzun süre çalışan yazma etkinliğini durdur veya kısa bir yedekleme bariyerine gir.
2. Her küresel ve aracı veritabanı için bir kontrol noktası çalıştır.
3. Her veritabanının anlık görüntüsünü SQLite yedekleme semantiğiyle veya `VACUUM INTO` ile
   geçici bir yedekleme dizinine al.
4. Sıkıştırılmış veritabanı anlık görüntülerini, yapılandırma dosyasını, kimlik bilgileri dizinini,
   seçili çalışma alanlarını ve bir manifestoyu arşivle.
5. Dahil edilen her SQLite anlık görüntüsünü açıp `PRAGMA integrity_check`
   çalıştırarak arşivi doğrula.
   `openclaw backup create` bunu varsayılan olarak yapar; `--no-verify` yalnızca
   yazma sonrası arşiv geçişini bilinçli olarak atlamak içindir.

Birincil yedekleme biçimi olarak ham canlı `*.sqlite`, `*.sqlite-wal` ve `*.sqlite-shm`
kopyalarına güvenme. Arşiv manifestosu veritabanı rolünü, aracı kimliğini, şema sürümünü,
kaynak yolunu, anlık görüntü yolunu, bayt boyutunu ve bütünlük durumunu kaydetmelidir.

Geri yükleme, küresel veritabanını ve aracı veritabanı dosyalarını arşiv anlık
görüntülerinden yeniden oluşturmalıdır. SQLite düzeni henüz gönderilmediği için bu yeniden
düzenleme yalnızca sürüm 1 şemasını ve doctor dosyadan veritabanına içe aktarmasını korur.
Geri yükleme komutu önce arşivi doğrular, ardından her manifesto varlığını doğrulanmış
çıkarılmış yükten değiştirir.

## Çalışma Zamanı Yeniden Düzenleme Planı

1. Veritabanı kayıt API’leri ekle.
   - Küresel veritabanı ve aracı başına veritabanı yollarını çöz.
   - Gönderilmemiş şemaları `user_version = 1` değerinde tut; gönderilmiş bir şema
     gerektirene kadar şema geçiş çalıştırıcı kodu ekleme.
   - Testler, yedekleme ve doctor tarafından kullanılan kapatma/kontrol noktası/bütünlük yardımcıları ekle.

2. Yan SQLite depolarını birleştir.
   - Plugin durumu tablolarını küresel veritabanına taşı. Çalışma zamanı
     yazmaları için tamamlandı; gönderilmemiş eski yan içe aktarıcı silindi.
   - Görev kayıt tablolarını küresel veritabanına taşı. Çalışma zamanı
     yazmaları için tamamlandı; gönderilmemiş eski yan içe aktarıcı silindi.
   - Task Flow tablolarını küresel veritabanına taşı. Çalışma zamanı yazmaları için
     tamamlandı; gönderilmemiş eski yan içe aktarıcı silindi.
   - Yerleşik bellek arama tablolarını her aracı veritabanına taşı. Tamamlandı; açık
     özel `memorySearch.store.path` artık doctor yapılandırma geçişiyle kaldırılır.
     Tam yeniden indeksleme yalnızca bellek tablolarına karşı yerinde çalışır; eski tüm dosya
     takas yolu ve yan indeks takas yardımcısı silindi.
   - Bu alt sistemlerden yinelenen veritabanı açıcılarını, WAL kurulumunu, izin yardımcılarını ve
     kapatma yollarını sil.

3. Aracıya ait tabloları aracı başına veritabanlarına taşı.
   - Küresel veritabanı kaydı üzerinden gerektiğinde aracı veritabanı oluştur. Tamamlandı.
   - Çalışma zamanı oturum girdilerini, transkript olaylarını, VFS satırlarını ve araç
     artefaktlarını aracı veritabanlarına taşı. Tamamlandı.
   - Dal yerel paylaşılan veritabanı oturum girdilerini, transkript olaylarını,
     VFS satırlarını veya araç artefaktlarını geçirme; o düzen hiç gönderilmedi. Yalnızca eski
     dosyadan veritabanına içe aktarmayı doctor içinde tut.

4. Oturum deposu API’lerini değiştir.
   - Çalışma zamanı kimliği olarak `storePath` değerini kaldır. Çalışma zamanı için tamamlandı ve
     `check:database-first-legacy-stores` tarafından korunuyor: oturum meta verileri, rota güncellemeleri,
     komut kalıcılığı, CLI oturum temizliği, Feishu akıl yürütme önizlemeleri,
     transkript durumu kalıcılığı, alt aracı derinliği, kimlik doğrulama profili oturum
     geçersiz kılmaları, üst çatallama mantığı ve QA-lab incelemesi artık veritabanını
     kanonik aracı/oturum anahtarlarından çözüyor.
     Gateway/TUI/UI/macOS oturum listesi yanıtları artık eski `path` yerine `databasePath`
     sunuyor; macOS hata ayıklama yüzeyleri aracı başına veritabanını `session.store`
     yapılandırması yazmak yerine salt okunur durum olarak gösteriyor.
     `/status`, sohbet odaklı yörünge dışa aktarma ve CLI bağımlılık vekilleri artık
     eski depo yollarını yaymıyor; transkript kullanım yedeği SQLite’ı
     aracı/oturum kimliğine göre okuyor. Çalışma zamanı ve köprü testleri artık
     `storePath` sunmuyor; doctor/geçiş girdileri bu eski alan adının sahibidir.
     Gateway birleşik oturum yüklemesi artık şablonlanmamış `session.store` değerleri için
     özel bir çalışma zamanı dalına sahip değil; aracı başına SQLite satırlarını toplar.
     Eski oturum kilidi doctor yolu ve onun `.jsonl.lock` temizleme yardımcısı kaldırıldı;
     SQLite artık oturum eşzamanlılık sınırıdır.
     Sıcak çalışma zamanı çağrı noktaları `resolveSessionRowEntry` gibi satır odaklı
     yardımcı adları kullanır; eski `resolveSessionStoreEntry` uyumluluk takma adı
     çalışma zamanı ve Plugin SDK dışa aktarımlarından kaldırıldı.

- `{ agentId, sessionKey }` satır işlemlerini kullan.
  Tamamlandı: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry` ve `listSessionEntries`, oturum deposu yolu gerektirmeyen
  SQLite öncelikli API’lerdir. Durum özeti, yerel aracı durumu, sağlık ve
  `openclaw sessions` listeleme komutu artık aracı başına satırları doğrudan okur
  ve `sessions.json` yolları yerine aracı başına SQLite veritabanı yollarını gösterir.
- Tüm depo silme/ekleme işlemini `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries` ve SQL temizleme sorgularıyla değiştir.
  Çalışma zamanı için tamamlandı: sıcak yollar artık satır API’leri ve çakışma durumunda
  yeniden denenen satır yamaları kullanıyor; kalan tüm depo içe aktarma/değiştirme yardımcıları
  geçiş içe aktarma kodu ve SQLite arka uç testleriyle sınırlıdır.
  - `store-writer.ts` ve yazıcı kuyruğu testlerini sil. Tamamlandı.
  - Çalışma zamanı eski anahtar ayıklama ve takma ad silme parametrelerini oturum
    satırı upsert/yamalarından sil. Tamamlandı.

5. Çalışma zamanı JSON kayıt davranışını sil.
   - Sandbox kayıt okumalarını ve yazmalarını yalnızca SQLite yap. Tamamlandı.
   - Monolitik ve parçalanmış JSON’u yalnızca geçiş adımından içe aktar. Tamamlandı.
   - Parçalanmış kayıt kilitlerini ve JSON yazmalarını kaldır. Tamamlandı.

- Biçim sıcak yol operasyonel durumu olarak kalıyorsa kayıt satırlarını genel
  opak JSON olarak depolamak yerine tek bir tipli kayıt tablosu tut. Tamamlandı.

6. Dosya kilidi biçimli oturum mutasyonunu sil.
   - Çalışma zamanı kilit oluşturma ve çalışma zamanı kilit API’leri için tamamlandı.
   - Bağımsız eski `.jsonl.lock` doctor temizleme yolu kaldırıldı.
   - `session.writeLock` tipli bir çalışma zamanı ayarı değil, doctor tarafından geçirilen eski yapılandırmadır.
   - Durum bütünlüğünün artık ayrı bir sahipsiz transkript dosyası ayıklama yolu yoktur;
     doctor geçişi eski JSONL kaynaklarını tek yerde içe aktarır/kaldırır.
   - Gateway tekil koordinasyonu, `gateway_locks` altında tipli SQLite `state_leases`
     satırları kullanır ve artık dosya kilidi dizini yüzeyi sunmaz.
   - Genel Plugin SDK tekilleştirme kalıcılığı artık dosya kilitleri veya JSON
     dosyaları kullanmaz; paylaşılan SQLite Plugin durumu satırları yazar. Tamamlandı.
   - QMD gömme koordinasyonu `qmd/embed.lock` yerine bir SQLite durum kirası kullanır. Tamamlandı.

7. İşçileri veritabanından haberdar yap.
   - İşçiler kendi SQLite bağlantılarını açar.
   - Üst süreç teslimin, kanal geri çağrılarının ve yapılandırmanın sahibidir.
   - İşçi canlı tanıtıcılar değil, aracı kimliği, çalıştırma kimliği, dosya sistemi modu ve veritabanı
     kayıt kimliği alır.
   - `vfs-only` deneysel kalır ve depolama kökü olarak aracı veritabanını kullanır.
   - Önce etkin çalıştırma başına bir işçi tut. Havuzlama, veritabanı bağlantısı
     ömrü ve iptal davranışı sıradan hale gelene kadar bekleyebilir.

8. Yedekleme entegrasyonu.
   - Yedeklemeye, SQLite yedeklemesi veya `VACUUM INTO` ile genel ve ajan veritabanlarının anlık görüntüsünü almayı öğret. Durum varlığı altındaki keşfedilen `*.sqlite` dosyaları için tamamlandı.
   - SQLite bütünlüğü ve şema sürümü için yedekleme doğrulaması ekle. Yedek oluşturma ve varsayılan arşiv doğrulama bütünlük kontrolleri için tamamlandı.
   - Yedekleme çalıştırma meta verilerini SQLite'a kaydet. Arşiv yolu, durum ve manifest JSON'u içeren paylaşılan `backup_runs` tablosu aracılığıyla tamamlandı.
   - Doğrulanmış arşiv anlık görüntülerinden geri yükleme ekle. Tamamlandı: `openclaw backup
restore`, çıkarmadan önce doğrular, doğrulayıcının normalleştirilmiş manifestini kullanır, `--dry-run` desteği sağlar ve kayıtlı kaynak yollarını değiştirmeden önce `--yes` gerektirir.
   - VFS/çalışma alanı dışa aktarımını yalnızca istendiğinde dahil et; oturum iç bileşenlerini JSON veya JSONL olarak dışa aktarma.

9. Eski testleri ve kodu sil. Bilinen çalışma zamanı oturum yüzeyleri için tamamlandı.

- `sessions.json` veya transkript JSONL dosyalarının çalışma zamanı tarafından oluşturulduğunu doğrulayan testleri kaldır. Çekirdek oturum deposu, sohbet, Gateway transkript olayları, önizleme, yaşam döngüsü, komut oturum girdisi güncellemeleri, otomatik yanıt sıfırlama/izleme ve memory-core dreaming fixture'ları, onay hedef yönlendirmesi, oturum transkripti onarımı, güvenlik izni onarımı, trajectory dışa aktarımı ve oturum dışa aktarımı için tamamlandı.
  Active-memory transkript testleri artık SQLite kapsamlarını ve geçici ya da kalıcı JSONL dosyası oluşturulmadığını doğruluyor.
  Eski heartbeat transkript budama regresyonu kaldırıldı çünkü çalışma zamanı artık JSONL transkriptlerini kısaltmıyor.
  Ajan oturum listesi aracı testleri artık eski `sessions.json` yollarını Gateway yanıt şekli olarak modellemiyor; app/UI/macOS testleri `databasePath` kullanıyor.
  `/status` transkript kullanımı testleri artık JSONL dosyaları yazmak yerine SQLite transkript satırlarını doğrudan tohumluyor.
  Gateway oturum yaşam döngüsü testleri artık SQLite transkript tohumlama yardımcılarını doğrudan kullanıyor; eski tek satırlı oturum dosyası fixture şekli sıfırlama ve silme kapsamından kaldırıldı.
  `sessions.delete` artık dosya dönemi `archived: []` alanını döndürmüyor; silme yalnızca satır mutasyonu sonucunu bildiriyor. Eski `deleteTranscript` seçeneği de kaldırıldı: bir oturumu silmek, kanonik `sessions` kökünü kaldırır ve SQLite'ın oturuma ait transkript, anlık görüntü ve trajectory satırlarını cascade ile temizlemesine izin verir; böylece hiçbir çağıran transkript kalıntısı bırakamaz veya bir temizleme dalını unutamaz.
  Context-engine trajectory yakalama testleri artık `session.trajectory.jsonl` okumak yerine yalıtılmış bir ajan veritabanından `trajectory_runtime_events` satırlarını okuyor.
  Docker MCP kanal tohum betikleri artık SQLite satırlarını doğrudan tohumluyor. Doğrudan `sessions.json` yazımları doctor fixture'larıyla sınırlı.
  Tool Search Gateway E2E, `agents/<agentId>/sessions/*.jsonl` dosyalarını taramak yerine araç çağrısı kanıtını SQLite transkript satırlarından okuyor.
  Memory-core ana makine olayları ve session-corpus geçici satırları artık paylaşılan SQLite Plugin durumunda yaşıyor; `events.jsonl` ve `session-corpus/*.txt` yalnızca eski doctor migration girdileridir. Etkin satırlar `.dreams/session-corpus` değil, `memory/session-ingestion/` sanal yollarını kullanır. Eski memory-core dreaming onarım modülü ve CLI/Gateway testleri kaldırıldı çünkü çalışma zamanı artık bu corpus için dosya arşivi onarımına sahip değil. Memory-core bridge/public-artifact testleri artık `.dreams/events.jsonl` yüzeye çıkarmıyor; SQLite destekli sanal JSON artefakt adını kullanıyorlar.
  Herkese açık SDK/Codex test dokümanları artık oturum dosyaları yerine SQLite oturum durumu diyor ve channel-turn örneği artık `storePath` argümanını göstermiyor.
  Matrix eşitleme durumu artık SQLite Plugin durum deposunu doğrudan kullanıyor. Etkin istemci/çalışma zamanı sözleşmeleri bir `bot-storage.json` yolu değil, bir hesap depolama kökü geçiriyor ve doctor, kaynağı silmeden önce eski `bot-storage.json` dosyasını SQLite'a içe aktarıyor. QA Matrix yeniden başlatma/yıkıcı senaryoları artık sahte `bot-storage.json` dosyaları oluşturmak veya silmek yerine SQLite eşitleme satırını doğrudan değiştiriyor ve E2EE substratı sahte `sync-store.json` yolu yerine bir sync-store kökü geçiriyor.
  Matrix storage-root seçimi artık kökleri eski sync/thread JSON dosyalarına göre puanlamıyor; kalıcı kök meta verileri ile gerçek kripto durumunu kullanıyor.
  Çalışma zamanı SQLite oturum backend test paketi artık `sessions.json` üretmiyor; eski kaynak fixture'ları artık onları içe aktaran doctor testlerinde yaşıyor.
  Gateway oturum testleri artık `createSessionStoreDir` yardımcısını veya kullanılmayan geçici oturum deposu yolu kurulumunu göstermiyor; fixture dizinleri açık ve doğrudan satır kurulumu SQLite session-row adlandırmasını kullanıyor.
  Yalnızca doctor'a ait JSON5 oturum deposu ayrıştırıcı kapsamı infra testlerinden doctor migration testlerine taşındı; böylece çalışma zamanı test paketleri artık eski oturum dosyası ayrıştırmasına sahip değil.
  Microsoft Teams çalışma zamanı SSO/bekleyen yükleme testleri artık JSON sidecar fixture'ları veya ayrıştırıcıları taşımıyor; eski SSO token ayrıştırması yalnızca Plugin migration modülünde yaşıyor. Telegram testleri artık sahte `/tmp/*.json` depo yolları tohumlamıyor; SQLite destekli mesaj önbelleğini doğrudan sıfırlıyor. Genel OpenClaw test-state yardımcısı artık eski `auth-profiles.json` yazıcısını göstermiyor; doctor auth migration testleri bu fixture'a yerel olarak sahip.
  TUI son oturum işaretçileri, exec onayları, active-memory anahtarları, Matrix tekilleştirme/başlangıç doğrulaması, Memory Wiki kaynak eşitlemesi, geçerli konuşma bağlamaları, onboarding auth ve Hermes secret içe aktarımları için çalışma zamanı testleri artık eski sidecar dosyaları üretmiyor veya eski dosya adlarının bulunmadığını doğrulamıyor. Davranışı SQLite satırları ve herkese açık depo API'leri üzerinden kanıtlıyorlar; eski kaynak dosya adlarının bulunacağı tek yer doctor/migration testleridir.
  Cihaz/node eşleştirme, kanal allowFrom, yeniden başlatma niyetleri, yeniden başlatma devri, oturum teslim kuyruğu girdileri, yapılandırma sağlığı, iMessage önbellekleri, Cron işleri, PI transkript başlıkları, alt ajan registry'leri ve yönetilen görüntü ekleri için çalışma zamanı testleri de artık kullanımdan kaldırılmış JSON/JSONL dosyalarını yalnızca yok sayıldıklarını veya bulunmadıklarını kanıtlamak için oluşturmuyor.
  PI taşma kurtarma artık SessionManager yeniden yazma/kısaltma fallback'ine sahip değil: araç sonucu kısaltma ve context-engine transkript yeniden yazımları SQLite transkript satırlarını değiştirir, ardından etkin prompt durumunu veritabanından yeniler.
  Kalıcı SessionManager mesaj eklemeleri, ebeveyn seçimi ve idempotency için atomik SQLite transkript ekleme yardımcısına devreder. Normal meta veri/özel girdi eklemeleri de geçerli ebeveyni SQLite içinde seçer; böylece eski manager örnekleri SQLite öncesi parent-chain race'lerini diriltmez.
  Tur ortası ön kontroller ve `sessions_yield` için sentetik PI kuyruk temizliği artık SQLite transkript durumunu doğrudan kırpar; eski SessionManager tail-removal bridge ve testleri silindi.
  Compaction checkpoint yakalama da yalnızca SQLite'tan anlık görüntü alır; çağıranlar artık alternatif transkript kaynağı olarak canlı bir SessionManager geçirmez.
- Eski dosyaları yalnızca migration için tohumlayan testleri tut.
- Etkin çalışma zamanı yüzeyleri için JSON dosyası kanıtı, SQL satırı kanıtıyla değiştirildi.

- Eski oturum/önbellek JSON yollarına çalışma zamanı yazımları için statik yasaklar ekle.
  Repo guard için tamamlandı.

10. Migration raporunu denetlenebilir hale getir.
    - Migration çalıştırmalarını başlangıç/bitiş zaman damgaları, kaynak yolları, kaynak hash'leri, sayılar, uyarılar ve yedek yolu ile SQLite'a kaydet.
      Tamamlandı: legacy-state migration yürütmeleri artık kaynak yolu/tablo envanteri, kaynak dosya SHA-256, boyutlar, kayıt sayıları, uyarılar ve yedek yolu içeren bir `migration_runs` raporunu kalıcılaştırıyor.
      Tamamlandı: legacy-state migration yürütmeleri ayrıca kaynak düzeyinde denetim ve gelecekteki atlama/backfill kararları için `migration_sources` satırlarını kalıcılaştırıyor.
    - Apply işlemini idempotent yap. Kısmi içe aktarmadan sonra yeniden çalıştırma, zaten içe aktarılmış bir kaynağı atlamalı veya stable key ile birleştirmelidir.
      Tamamlandı: oturum indeksleri, transkriptler, teslim kuyrukları, Plugin durumu, görev defterleri ve ajan sahipli genel SQLite satırları stable key'ler veya upsert/replace semantikleri üzerinden içe aktarılır; böylece yeniden çalıştırmalar kalıcı satırları çoğaltmadan birleştirir.
    - Başarısız içe aktarmalar, özgün kaynak dosyayı yerinde tutmalıdır.
      Tamamlandı: başarısız transkript içe aktarmaları artık özgün JSONL kaynağını algılanan yolunda bırakıyor ve `migration_sources`, bir sonraki doctor çalıştırması için kaynağı `removed_source=0` ile `warning` olarak kaydediyor.

## Performans Kuralları

- Thread/process başına bir bağlantı uygundur; handle'ları worker'lar arasında paylaşma.
- WAL, `foreign_keys=ON`, 30 sn busy timeout ve kısa `BEGIN IMMEDIATE` yazma transaction'ları kullan.
- Async transaction API'si açık mutex/backpressure semantikleri ekleyene kadar yazma transaction yardımcılarını senkron tut.
- Ebeveyn teslim yazımlarını küçük ve transaction'lı tut.
- Tüm depoyu yeniden yazmaktan kaçın; satır düzeyinde upsert/delete kullan.
- Sıcak kodu taşımadan önce list-by-agent, list-by-session, updated-at, run id ve expiration yolları için index ekle.
- Büyük artefaktları, medyayı ve vektörleri base64 veya numeric-array JSON olarak değil, BLOB'lar ya da parçalanmış BLOB satırları olarak depola.
- Opak Plugin-state girdilerini küçük ve kapsamlı tut.
- Dosya sistemi budaması yerine TTL/expiration için SQL temizliği ekle.
  Veritabanı sahipli çalışma zamanı depoları için tamamlandı: medya, Plugin durumu, Plugin blob'ları, kalıcı tekilleştirme ve ajan önbelleği SQLite satırları üzerinden sona erer. Kalan dosya sistemi temizliği geçici materialization'lar veya açık kaldırma komutlarıyla sınırlıdır.

## Statik Yasaklar

Eski durum yollarına yeni çalışma zamanı yazımlarında başarısız olan bir repo kontrolü ekle:

- `sessions.json`
- somutlaştırılmış destek paketi çıktıları hariç `*.trajectory.jsonl`
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
- korumalı alan kayıt defteri parça JSON dosyaları
- yerel kanca aktarma `/tmp` köprü JSON dosyaları
- `plugin-state/state.sqlite`
- geçici `openclaw-state.sqlite` çalışma zamanı yan dosyaları
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
- tarayıcı profili süslemesi `.openclaw-profile-decorated`
- `SessionManager.open(...)` dosya destekli oturum açıcıları
- `SessionManager.listAll(...)` ve `TranscriptSessionManager.listAll(...)`
  transkript listeleme cepheleri
- `SessionManager.forkFromSession(...)` ve
  `TranscriptSessionManager.forkFromSession(...)` transkript çatallama cepheleri
- `SessionManager.newSession(...)` ve `TranscriptSessionManager.newSession(...)`
  değiştirilebilir oturum değiştirme cepheleri
- `SessionManager.createBranchedSession(...)` ve
  `TranscriptSessionManager.createBranchedSession(...)` dal oturumu cepheleri

Yasak, testlerin eski fikstürler oluşturmasına ve migrasyon kodunun eski dosya
kaynaklarını okumasına/içe aktarmasına/kaldırmasına izin vermelidir. Yayınlanmamış SQLite yan dosyaları yasaklı kalır
ve doctor içe aktarma izinleri almaz.

## Tamamlanma Kriterleri

- Çalışma zamanı verileri ve önbellek yazımları küresel veya aracı SQLite veritabanına gider.
- Çalışma zamanı artık oturum dizinleri, transkript JSONL, korumalı alan kayıt defteri
  JSON, görev yan dosya SQLite veya plugin-state yan dosya SQLite yazmaz. Yayınlanmamış görev
  ve plugin-state yan dosya SQLite içe aktarıcıları silinir.
- Eski dosya içe aktarma yalnızca doctor tarafından yapılır.
- Yedekleme, kompakt SQLite anlık görüntüleri ve bütünlük kanıtı içeren tek bir arşiv üretir.
- Aracı çalışanları disk, VFS karalama alanı veya deneysel yalnızca VFS
  depolama ile çalışabilir.
- Yapılandırma ve açık kimlik bilgisi dosyaları, beklenen tek kalıcı
  veritabanı dışı kontrol dosyaları olarak kalır.
- Repo kontrolleri, eski çalışma zamanı dosya depolarının yeniden kullanılmasını engeller.
