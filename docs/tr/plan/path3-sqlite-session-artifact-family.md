---
read_when:
    - clawdbot-d63.2 / clawdbot-04b'yi uyguluyorsunuz
    - SQLite oturumu saklama, sıfırlama, silme veya ajan silme arşivlemesini değiştiriyorsunuz
    - SQLite dönemi yapıt ailelerini eski JSONL yan dosyalarından ayırt etmeniz gerekir
summary: Bir oturuma ait tüm SQLite transkript yapıtlarını arşivlemeye yönelik Yol 3 planı
title: Yol 3 SQLite oturum yapıtı ailesi
x-i18n:
    generated_at: "2026-07-16T17:35:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: adb2c31293ab63cb80449d037600d78fbb228e91f380d1ccaf15fb00728a9057
    source_path: plan/path3-sqlite-session-artifact-family.md
    workflow: 16
---

# Yol 3 SQLite Oturum Yapıtı Ailesi

Bu not, `clawdbot-d63.1` kapsamındaki `src/config/sessions/session-accessor.sqlite.ts` içinde yer alan ve kapsamı örtüşen
sıfırlama/silme arşiv yardımcısından ayrı olarak `clawdbot-d63.2` kapsamını tanımlar.
Bu geçiş sırasında uygulama dosyasında kaydedilmemiş değişiklikler bulunduğundan bu yapıt,
diğer çalışanın çalışmasıyla çakışmadan kesin sözleşmeyi ve yama noktalarını kaydeder.

## Yetkili aile

SQLite geçişinden sonra etkin oturum dökümleri SQLite satırlarıdır. Bir oturumun
arşiv ailesi şunlardan oluşur:

- Girdinin geçerli `sessionId` değeri için `transcript_events`, `transcript_event_identities`
  ve `sessions` satırları.
- `entry.compactionCheckpoints[*].preCompaction.sessionId` tarafından başvurulan her `sessionId` için aynı
  SQLite döküm satırı kümesi.
- `entry.compactionCheckpoints[*].postCompaction.sessionId` tarafından başvurulan her `sessionId` için aynı
  SQLite döküm satırı kümesi.
- `entry.usageFamilySessionIds` içindeki her `sessionId` için aynı SQLite
  döküm satırı kümesi.

Yalnızca kalan herhangi bir `session_entries` satırı veya kalan herhangi bir girdinin
Compaction ya da kullanım ailesi meta verileri tarafından artık başvurulmayan satırları
arşivleyin. Böylece son canlı başvuru ortadan kalkana kadar kontrol noktası dallandırma/geri
yükleme ve kullanım toplama durumu korunur.

## Geçişten sonraki aile dışı yapıtlar

Oluşturulan konu döküm dosyası çeşitleri ve yörünge yardımcı dosyaları etkin
SQLite çalışma zamanı durumu değildir. Bunlar eski dosya yapıtlarıdır:

- `<sessionId>-topic-<thread>.jsonl` gibi konu çeşitleri yalnızca dosya tabanlı döküm
  biçiminde bulunur. SQLite, konu başına JSONL dosyaları yerine standart oturum kimliğini
  ve `session_routes`/girdi teslim meta verilerini kullanır.
- `.trajectory.jsonl` ve `.trajectory-path.json` gibi yörünge yardımcı dosyaları
  gerçek JSONL `sessionFile` yollarından adlandırılır. SQLite `sessionFile`
  değerleri `sqlite:<agentId>:<sessionId>:<storePath>` işaretçileridir ve yardımcı dosyaları
  adlandırmaz.
- Arşiv katmanı okuyucuları eski arşivlenmiş JSONL dosyalarını okumaya
  devam etmelidir; ancak çalışma zamanı saklama işlemi etkin oturum dizinlerini taramamalı
  veya SQLite oturumları için JSONL döküm dosyalarını yeniden açmamalıdır.

Eski birincil JSONL dosyalarının ve bunların bitişiğindeki yörünge yardımcı dosyalarının
geçiş sahibi Doctor içe aktarma işlemidir. Çalışma zamanı SQLite saklama işlemi ikinci bir
içe aktarıcı veya dosya geri dönüşü eklememelidir.

## Yama noktaları

Paralel bir yol eklemek yerine `clawdbot-d63.1` tarafından kullanıma sunulan SQLite
arşiv yardımcısını genişletin.

1. `deleteSqliteSessionStateIfUnreferenced` yakınına yerel bir toplayıcı ekleyin:
   - `collectSqliteSessionArtifactFamily(entry: SessionEntry): Set<string>`
   - `entry.sessionId`, kontrol noktası öncesi/sonrası oturum kimlikleri
     ve `usageFamilySessionIds` değerini dahil edin.
   - Boş dizeleri filtreleyin ve yinelenenleri belirlenimsel biçimde kaldırın.

2. Silme sonrası depo için bir başvuru toplayıcı ekleyin:
   - `readReferencedSqliteSessionArtifactFamilyIds(database): Set<string>`
   - Geçerli `session_entries` üzerinde yineleyin, her `entry_json`
     değerini ayrıştırın ve ayakta kalan her girdiden aynı aile kimliklerini toplayın.

3. Şu anda kaldırılmış tek bir `sessionId` değerini arşivleyen
   sıfırlama/silme/bakım çağrılarını, kaldırılmış girdinin tam ailesini iletecek şekilde değiştirin.

4. Her aile kimliği için SQLite döküm satırlarını çağıranın gerekçesiyle
   (`reset` veya `deleted`) arşivleyin, ardından yalnızca aile kimliği
   silme sonrası başvuru kümesinde yoksa `sessions` satırını silin.

5. Döküm olayı silme işlemini mevcut SQLite oturum satırı temizleme yolu
   üzerinden merkezî tutun. Etkin JSONL okumaları eklemeyin.

## Odaklı testler

`clawdbot-d63.1` kaydedildikten sonra `src/config/sessions/session-accessor.conformance.test.ts` dosyasına
veya diğer yaşam döngüsü testine yalnızca SQLite testleri ekleyin:

- Compaction öncesi dökümü bulunan bir girdinin silinmesi hem geçerli
  oturumu hem de Compaction öncesi oturumu arşivler, ardından her iki SQLite satır kümesini kaldırır.
- Compaction öncesi bir oturumu paylaşan iki girdiden birinin silinmesi,
  son başvuran girdi kaldırılana kadar paylaşılan ön oturum için hiçbir şeyi arşivlemez.
- `usageFamilySessionIds` içeren bir girdinin silinmesi, başka hiçbir girdi
  bu kullanım ailesine başvurmuyorsa önceki SQLite döküm satırlarını arşivler.
- SQLite işaretçisi bulunan konu biçimli bir oturum anahtarı, oluşturulan
  herhangi bir konu JSONL okumasına veya yardımcı dosya aramasına neden olmaz.

Odaklı doğrulamada şunu kullanın:

```bash
node scripts/run-vitest.mjs src/config/sessions/session-accessor.conformance.test.ts
```

Son testler `store.session-lifecycle-mutation.test.ts` içinde bulunuyorsa aynı sarmalayıcıyla bu
dosyayı açıkça çalıştırın. Bu Codex çalışma ağacı için geniş `pnpm`
kapıları Crabbox/Testbox üzerinde kalmalıdır.
