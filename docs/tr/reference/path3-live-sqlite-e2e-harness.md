---
read_when:
    - Canlı bir Gateway üzerinde Yol 3 SQLite depolama geçişini doğruluyorsunuz
    - Beklenen eski JSONL sapmasını çalışma zamanı hatalarından ayırt etmeniz gerekir
    - Ajan tarafından yönlendirilen canlı SQLite E2E test düzeneğini oluşturuyor veya inceliyorsunuz
summary: Path 3 SQLite oturum/transkript geçişinin canlı Gateway doğrulaması için tasarım
title: Yol 3 canlı SQLite E2E test düzeneği
x-i18n:
    generated_at: "2026-07-16T17:42:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2749bf47cb4967bc80a5ed37a12f2a553f3b388ed8cd90cfb3217e1b5e8afae9
    source_path: reference/path3-live-sqlite-e2e-harness.md
    workflow: 16
---

Path 3 canlı SQLite E2E düzeneği, eski JSONL dosyaları geçiş girdisi veya arşiv malzemesi olarak kalırken Gateway'in kanonik oturum ve transkript deposu olarak SQLite'ı kullandığını kanıtlar. Bu, normal bir kullanıcı tanılama aracı değil, bakım sorumlularına yönelik bir kanıt düzeneğidir.

Bir Gateway geçiş sonrası trafiği işledikten sonra, eski JSONL eşliği artık geçerli bir çalışma zamanı sağlık sinyali değildir. Yeni turların yalnızca SQLite'ı ilerletmesi gerektiğinden, sağlıklı bir şekilde geçirilmiş Gateway'deki SQLite transkript satırları eski JSONL sayılarından farklı olabilir. Bu nedenle canlı düzenek, her adımda Gateway davranışını, SQLite satır hareketini, eski dosyaların hareketsizliğini ve günlük sağlığını ölçmelidir.

## Komut biçimi

Amaçlanan canlı komut şudur:

```bash
node scripts/path3-live-sqlite-e2e.mjs \
  --url http://127.0.0.1:18789 \
  --agent main \
  --session-key agent:main:path3-live-e2e:<timestamp> \
  --json
```

Komut, hâlihazırda çalışan bir Gateway'e bağlanır. Daha sonra açık bir geçiş modu eklenmediği sürece geçişi başlatmaz, durdurmaz, içe aktarmaz veya yeniden çalıştırmaz. Bir CI veya yalıtılmış yerel varyant `test/helpers/openclaw-test-instance.ts` kullanabilir, ancak canlı kanıt yolu gerçek operatör Gateway'ini ve onun gerçek ajan başına SQLite veritabanını incelemelidir.

## Yalıtılmış derlenmiş CLI kanıtı

Derlenmiş CLI kanıt çalıştırıcısı, yalıtılmış bir eski oturum deposunu başlangıç verileriyle doldurur, yeniden derlenen Gateway'i başlatır ve başlangıç işleminin, çalışma zamanı okumaları başlamadan önce etkin eski oturumları SQLite'a aktardığını kanıtlar. İlk Gateway başlangıcından önce `openclaw doctor --fix` çalıştırılmamalıdır; çünkü bu, kullanıcıların geçişten sonraki ilk önyüklemede karşılaştığı yükseltme yolu yerine manuel geçiş yolunu kanıtlar.

Başlangıçta içe aktarma işleminden sonra yalıtılmış kanıt, tanılama kanıtı olarak `openclaw doctor --session-sqlite inspect` ve `openclaw doctor --session-sqlite validate` çalıştırabilir. Bu doctor komutları, başlangıç yükseltme kanıtının geçiş yürütücüsü değildir. Ayrı doctor içe aktarma senaryoları, eski transkript dosyalarını ve yörünge yan dosyalarını başlangıç verileriyle doldurmalı ve SQLite kanonik kalırken doctor'ın bu yapıtları arşivlediğini doğrulamalıdır.

## Ön kontrol

Ön kontrol bir temel durum toplar ve Gateway kullanılabilir değilse kanıt turu göndermeden önce başarısız olur:

- `GET /health` ve Gateway ayrıntılı durumu, çalışan ve erişilebilir bir Gateway bildirmelidir.
- CLI ve Gateway sürümleri, test edilen dalla eşleşmelidir.
- Düzenek, etkin Gateway dosya günlüğü için bir günlük imleci kaydeder.
- Düzenek; `sessions`, `session_entries`, `transcript_events`, `transcript_event_identities` ve `session_routes` için ajan başına SQLite tablo sayılarını kaydeder.
- Düzenek; eski `sessions.json`, başvurulan JSONL dosyaları ve olası kanıt oturumu JSONL yolları için `mtime`, `size` ve varlık bilgilerini kaydeder.
- `lsof -p <gateway-pid>`, SQLite DB/WAL/SHM tanıtıcılarını göstermeli ve etkin `.jsonl` veya `sessions.json` tanıtıcılarını göstermemelidir.

`openclaw doctor --session-sqlite validate`, canlı modda yalnızca bilgi amaçlıdır. Geçiş sonrası trafikten sonra eski dosyalara göre beklenen sapmayı bildirebilir. Düzenek, doctor çıktısını çalışma zamanı başarı/başarısızlık ölçütü olarak değil, sınıflandırma ve geçiş envanteri için kullanmalıdır.

## Ajan güdümlü senaryo

Canlı senaryo, özel bir kanıt oturumu anahtarı kullanır ve mümkün olan her yerde Gateway'i genel RPC yolları üzerinden çalıştırır. Sıradan kalıcılığı sınamak için tek bir ajan turu yeterli olmalıdır; ancak tam kanıt, daha önce ayrı canlı kontroller gerektiren 3.1b bağlantı noktalarını kapsamalıdır:

- Sıradan sohbet turu: kanıt oturumunu oluşturun veya yeniden kullanın, gerçek bir ajan istemi gönderin, nihai asistan sonucunu bekleyin ve `chat.history` ya da eşdeğer Gateway projeksiyonunu doğrulayın.
- Transkript kimliği: aynı işaretleyicinin Gateway geçmişinde ve varsa kararlı olay kimliği satırları dâhil olmak üzere SQLite transkript satırlarında göründüğünü doğrulayın.
- Oturum meta verisi erişimcileri: kanıt oturumunu ve seçilen mevcut canlı oturumları Gateway/oturum erişimcileri üzerinden okuyun ve SQLite satırlarıyla karşılaştırın.
- Oturum yaması projeksiyonu: kanıt oturumuna geri alınabilir bir model/oturum meta verisi değişikliği uygulayın, ardından projeksiyonu yapılan satır ile Gateway yanıtının uyuştuğunu doğrulayın.
- Compaction kontrol noktası yaşam döngüsü: yalnızca kanıt oturumunda veya düzenek tarafından oluşturulan sentetik bir sabit veri oturumunda bir kontrol noktasını listeleyin, dallandırın ve geri yükleyin.
- Yeniden başlatma kurtarması: güvenli kurtarma işaretleyicisi yolunu denetimli bir kanıt oturumuna veya yalıtılmış bir test örneğine karşı çalıştırın; canlı mod bu adımı yalnızca hedef oturum kümesi açıkça belirtilmiş ve geri alınabilir olduğunda çalıştırabilir.
- Temizleme yaşam döngüsü: kanıt oturumunu silin veya sıfırlayın, ardından SQLite yaşam döngüsü satırlarını ve arşivlenmiş transkript durumunu doğrulayın.

WhatsApp veya sesli arama girişi gibi canlı operatör Gateway'inde güvenle sınanamayan aktarıma özgü bağlantı noktaları, sahte harici aktarım yerine aynı SQLite sözleşmesine karşı sahip düzeyinde çalışma zamanı sondaları kullanmalıdır.

## Adım başına doğrulamalar

Her adım, öncesi ve sonrası durumun anlık görüntüsünü alır ve yapılandırılmış bir doğrulama kaydı yazar:

- SQLite satır sayıları yalnızca beklendiği yerlerde ilerler.
- Yörünge çalışma zamanı satırları, çalışma zamanı olaylarını kaydeden işaretleyici destekli kanıt oturumları için ilerler.
- Kanıt oturumu satırı beklenen `session_id`, durum, zaman damgaları, meta veri ve rota satırlarına sahiptir.
- Gateway geçmişi/oturum projeksiyonu, SQLite transkript kuyruğuyla eşleşir.
- Hiçbir kanıt oturumu JSONL dosyası oluşturulmaz veya değiştirilmez.
- Hiçbir kanıt oturumu `.trajectory.jsonl`, `.trajectory-path.json` veya işaretleyiciden türetilmiş `trajectory/<session>.jsonl` yan dosyası oluşturulmaz.
- Adım açıkça çevrimdışı bir geçiş veya arşivleme işlemi olmadığı sürece mevcut eski JSONL dosyaları ve `sessions.json` değişmeden kalır.
- Gateway işlemi `.jsonl` veya `sessions.json` tanıtıcılarını açmaz.
- Senaryo açıkça izin listesine eklemediği sürece önceki imleçten sonraki günlüklerde `ERROR`, `FATAL`, `SQLITE_`, `no such column`, oturum deposu kullanılamıyor, yeniden başlatma kurtarma hatası veya transkript uzlaştırma uyarısı bulunmaz.

Günlük taraması, başarı/başarısızlık sözleşmesinin parçasıdır. Sağlık kontrollerine yanıt veren ancak SQLite şema hataları veya tekrarlanan transkript uzlaştırma hataları yayan bir Gateway, Path 3 için başarılı değildir.

## Kanıt yapıtı

Düzenek, kanıtı `.artifacts/path3-live-e2e/<timestamp>/` altına yazmalı ve git'in dışında tutmalıdır:

- `summary.json`: komut bağımsız değişkenleri, Gateway sürümü, sonuç, başarısız doğrulama ve yapıt yolları.
- `sqlite-before.json` ve `sqlite-after.json`: satır sayıları ve seçilen kanıt satırları.
- `legacy-files.json`: eski dosyanın varlığı, `mtime`, boyutu ve her dosyanın değişip değişmediği.
- `gateway-log-scan.json`: imleç aralığı, eşleşen günlük satırları ve izin listesi kararları.
- `events.jsonl`: PR kanıt yorumlarına uygun, adım başına sıralı gözlemler.

PR kanıtı, tam transkriptleri veya özel mesaj içeriğini yapıştırmak yerine bu yapıtları özetlemelidir.

## Güvenlik kuralları

- Canlı mod, Gateway çalışırken eski JSONL'yi asla yeniden içe aktarmamalıdır.
- Canlı mod, açıkça seçilmiş ve geri alınabilir onarım sondaları dışında kanıt dışı oturumları değiştirmemelidir.
- Her türlü yıkıcı veya geniş kapsamlı geçiş adımı, etkilenen SQLite DB'nin ve eski oturum dizininin yeni bir yedeğini gerektirir.
- Sınırsız disk büyümesini önlemek için yedekler, dokunulan ajan DB'si/oturum diziniyle sınırlandırılmalı ve tek bir kanıt çalıştırması sırasında yeniden kullanılmalıdır.
- Çağıran `--keep-artifacts` iletmediği sürece temizleme adımı geride hiçbir kanıt oturumu, kanıt JSONL'si veya değiştirilmiş eski dosya bırakmamalıdır.

## Başarılı sonuç

Başarılı bir canlı çalıştırma; Gateway'in gerçek bir ajan güdümlü oturum akışını kabul ettiği, gözlemlenen tüm kanonik durumun SQLite'ta bulunduğu, eski çalışma zamanı dosyalarının hareketsiz kaldığı ve ölçülen zaman aralığında günlük sağlığının temiz kaldığı anlamına gelir. Bu, canlı trafikten sonra eski JSONL eşliğinin temiz kalacağı anlamına gelmez; SQLite kanonik depo olduğunda canlı sapma beklenir.
