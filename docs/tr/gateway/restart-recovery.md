---
read_when:
    - Gateway'i yeniden başlatmanın devam eden agent çalışmalarını kaybettirip kaybettirmediğini bilmek istiyorsunuz
    - Bir ajan çalışması yeniden başlatma, çökme veya yapılandırmanın yeniden yüklenmesi nedeniyle kesintiye uğradı
    - Gateway yeniden çalışmaya başladıktan sonra otomatik oturum kurtarma işleminde hata ayıklıyorsunuz
summary: 'Gateway yeniden başlatıldığında veya çöktüğünde neler korunur: kesintiye uğrayan aracı işlemleri otomatik olarak devam eder, alt aracılar ve arka plan görevleri kurtarılır, kuyruğa alınan iletiler gönderilir'
title: Yeniden başlatma sonrası kurtarma
x-i18n:
    generated_at: "2026-07-16T17:27:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2fc0263d792e78e75fb97be44671b44287d469b949e11640f11b6ff651dafb9
    source_path: gateway/restart-recovery.md
    workflow: 16
---

Gateway'i yeniden başlatmak agent durumunun kaybolmasına neden olmaz. Konuşmalar, transkriptler,
zamanlanmış işler, arka plan görev kayıtları ve kuyruğa alınmış giden mesajların tümü
diskte tutulur; turun ortasında kesintiye uğrayan işler algılanır ve Gateway yeniden
çalışmaya başladıktan sonra otomatik olarak sürdürülür. Manuel müdahale
gerekmez ve yapılandırılacak hiçbir şey yoktur: kurtarma her zaman etkindir.

Bu sayfa, yeniden başlatmadan sonra nelerin korunduğunu, kesintiye uğrayan işlerin nasıl algılandığını
ve otomatik sürdürmenin nasıl gerçekleştiğini açıklar.

## Yeniden başlatmadan sonra korunanlar

| Durum                         | Depolama                                     | Yeniden başlatma sırasındaki davranış                                  |
| ----------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| Konuşma geçmişi               | Agent başına SQLite veritabanı               | Değişmeden kalır; oturumlar saklanan transkriptten devam eder           |
| Kesintiye uğrayan ana oturum turu | Agent başına SQLite oturum satırı ve transkript | Başlatmadan birkaç saniye sonra otomatik olarak sürdürülür veya uzlaştırılır |
| Alt agent çalıştırmaları      | SQLite (paylaşılan durum veritabanı)         | Kayıt defteri açılışta geri yüklenir; kesintiye uğrayan çalıştırmalar sürdürülür |
| Arka plan görevleri           | SQLite (paylaşılan durum veritabanı)         | Açılışta uzlaştırılır; sahipsiz çalıştırmalar kurtarılır veya kayıp olarak işaretlenir |
| Kuyruğa alınmış giden teslimatlar | SQLite teslimat kuyruğu                  | Yeniden başlatmadan sonra boşaltılır; teslim edilmemiş yanıtlar yeniden denenir |
| Zamanlanmış (cron) işler      | SQLite cron deposu                           | Zamanlamalar korunur; zamanlayıcı açılışta yeniden kurulur              |
| Yeniden başlatma devamı       | SQLite yeniden başlatma nöbetçisi            | Yeniden başlatmayı isteyen oturuma tek seferlik takip turu gönderilir   |

## Kontrollü yeniden başlatmalarda önce mevcut işler tamamlanır

İstenen bir yeniden başlatma (`openclaw gateway restart`, yeniden başlatma gerektiren bir yapılandırma
değişikliği veya Gateway güncellemesi), yürütülmekte olan işi hemen sonlandırmaz.
Gateway yeni iş kabul etmeyi durdurur, ardından etkin agent turlarının ve
arka plan görevlerinin tamamlanmasını mevcut işleri tamamlama bütçesi kadar (varsayılan olarak 5 dakika) bekler. Bu nedenle
çoğu yeniden başlatma hiçbir şeyi kesintiye uğratmaz.

Yalnızca mevcut işleri tamamlama bütçesi içinde bitirilemeyen işler (veya zorunlu yeniden başlatma
ya da çökme nedeniyle kesintiye uğrayan herhangi bir çalıştırma) iptal edilir; bu gerçekleşmeden önce
etkilenen her oturum kurtarma için işaretlenir.

## Kesintiye uğrayan işler nasıl algılanır?

Turu tamamlanmayan oturumları üç tamamlayıcı mekanizma işaretler:

- **Tur kabulünde:** mevcut bir ana oturumdaki sıradan bir metin turunda
  Gateway, model veya `before_agent_reply` kancası yürütülmeden önce kullanıcı mesajını ekler,
  oturumu çalışıyor olarak işaretler ve kurtarma teslimatı talebini tek bir SQLite işlemi içinde
  kaydeder. Control UI bunu `started` onayını döndürmeden önce yapar; kanal gönderimi ise
  hazırlanmış tur agent çalıştırmasını benimsediğinde yapar.
  Komutlar, ekler, tur başına geçersiz kılmalar, bekleyen teslimatlar, önceki iptal
  ipuçları, plugin'e ait oturumlar ve yürütme kancaları bulunan turlar kendi
  özel kabul yollarını kullanır.
  Bir `before_agent_reply` kancası yüklüyse kabul işlemi bunun aşamasını da kaydeder.
  Kurtarma, çağrının ortasında kesintiye uğrayan bir kancayı hiçbir zaman yeniden yürütmez. İşlenmemiş bir kanca
  tamamlandığında denetim noktası bu sonucu kaydeder, ancak söz konusu kanca etkin kaldığı sürece
  kurtarma yine güvenli biçimde başarısız olur: bir denetim noktası, yeniden başlatmadan sonra aynı
  plugin kodu ve yapılandırmasının yüklendiğini kanıtlayamaz. İşlenmiş metin ve
  sessiz sonuçlar, belirlenimci sonuçlandırma için ayrı ayrı denetim noktalarına kaydedilir.
  Eski sürümlerin yazdığı kalıcı kurtarma taleplerinde kaynak sahipliği
  işaretçisi bulunmadığından yükseltme sırasında aynı güvenli biçimde başarısız olma kanca denetimine tabi tutulurlar.
- **Kapatma sırasında:** yeniden başlatma için mevcut işler tamamlanırken etkin çalıştırması bulunan
  her oturum, çalıştırma iptal edilmeden önce oturum deposunda bir kurtarma işaretçisiyle
  damgalanır.
- **Başlatma sırasında:** Gateway, hâlâ çalıştığını iddia eden ancak yeni süreçte
  canlı bir sahibi bulunmayan oturumları bulmak için oturum depolarını tarar. Bu işlem,
  hiçbir kapatma kodunun çalışmadığı ani çökmeleri ve sonlandırmaları yakalar. Eski transkript kilit
  dosyaları da aynı anda temizlenir.

## Otomatik sürdürme

Başlatmadan birkaç saniye sonra Gateway, işaretlenmiş her oturumu
agent'a önceki turunun yeniden başlatma nedeniyle kesintiye uğradığını ve mevcut transkriptten
devam etmesi gerektiğini bildiren sentetik bir sistem mesajıyla yeniden gönderir. Nihai bir
yanıt zaten oluşturulmuş ancak teslim edilmemişse agent'ın işi yeniden yapmak yerine
bu yanıtı teslim edebilmesi için metni eklenir. Kurtarma, üstel geri çekilmeyle en fazla
3 kez yeniden denenir. Her yeniden deneme aynı kalıcı gönderim
tanımlayıcısını yeniden kullanır; böylece sonucu belirsiz bir bağlantı hatası aynı kurtarmayı
iki kez başlatamaz. Tamamlanmış ve sürdürülemeyen Control UI turları da sınırlandırılmış kalıcı
yinelenmezlik mezar taşlarını korur; böylece yeniden bağlanan bir giden kutusu, isteği
yeniden yürütmeden bunları sonlandırabilir.

Yalnızca mesaj aracı yanıtları ikinci bir kalıcı korelasyon kullanır. Aynı konuşmaya yapılan
sonlandırıcı bir gönderim kanala ulaşmadan önce Gateway, tam oturum ve kaynak tur üzerinde çözümlenmemiş
bir teslimat niyeti kaydeder. Doğrulanmış bir sağlayıcı
başarısı bunu kalıcı bir teslim edildi makbuzuna dönüştürür; doğrulanmış bir hata ise
temizler. Kurtarma, araçları yeniden çalıştırmadan teslim edildi makbuzunu tamamlar. Bir çökme
sağlayıcı sonucunu belirsiz bırakırsa kurtarma, harici bir etkiyi yeniden yürütmek yerine
güvenli biçimde başarısız olur.

Teslim edilen yanıt, kaynak mesaj kimliğiyle birlikte transkripte de yansıtılır.
Sonlandırıcı yansıtmalar ayrı bir makbuz anahtarı kullanır; böylece aynı sağlayıcı yinelenmezlik
anahtarına sahip bir ilerleme gönderimi sonlandırıcı işaretçiyi maskeleyemez. Önceki turlardan gelen ilerleme
gönderimleri ve makbuzlar mevcut turu tamamlayamaz. Yalnızca
kalıcı kanal giriş talepleri mesaj eylemi yetkisini geri yükleyebilir. Sürdürülen
bir çalıştırma, istekte bulunanın kimliği ve aynı kanal/ileti dizisi kısıtlamaları dâhil olmak üzere
özgün kaynak teslimat modunu ve kaynak korelasyonunu korur; böylece kurtarma sırasında başka bir yeniden başlatma
gerçekleşse bile aynı makbuz yetkili kalır.
Yeniden oluşturulabilir kanal yetkisi bulunmayan yalnızca mesaj aracı turu
güvenli biçimde başarısız olur ve tek seferlik yeniden gönderme bildirimini alır.

Gateway sürdürmeden önce transkript sonunun devam etmek için güvenli olup olmadığını
denetler. Güvenli değilse (örneğin tur eski ve bekleyen bir onayla sona erdiyse)
oturum körü körüne yeniden çalıştırılmaz; bunun yerine agent, kullanıcıdan son isteği
yeniden göndermesini isteyen kısa bir bildirim yayınlar. WebChat'te bu bildirim,
yeniden bağlanıldıktan sonra da görünür kalması için doğrudan oturum geçmişine yazılır.

OpenClaw, kesintiye uğrayan salt okunur [Kod Modu](/tr/reference/code-mode)
işlerini de yeniden oluşturabilir. Kod Modu bu çalıştırmaları yeniden başlatmaya karşı güvenli olarak işaretler ve yan etkili
katalog araçlarını veya plugin ad alanlarını yürütülmeden önce reddeder. Yeniden başlatma
`wait` denetiminde gerçekleşirse yeni Gateway, turu transkriptinden yeniden oluşturur
ve model bu bayrağı atlasa veya temizlese bile yeniden oluşturulan yürütmenin yeniden başlatmaya karşı güvenli
kalmasını zorunlu kılar. Ana makine, yeniden oluşturulan turun tamamını denetlenmiş salt okunur
çekirdek araçları ve yeniden yürütme açısından açıkça güvenli plugin araçlarıyla sınırlar;
bu, yeniden başlatmadan sonra Kod Modu devre dışı bırakılsa bile geçerlidir. Yan etkili işler,
yinelenen yazma riski yerine yeniden gönderme bildirimiyle korunmaya devam eder.

### Alt agent'lar

Alt agent çalıştırmaları paylaşılan SQLite durum veritabanında kalıcı olarak saklandığından
alt agent kayıt defteri süreç sonrasında da korunur. Açılışta kayıt defteri geri yüklenir ve
kesintiye uğrayan alt agent oturumları özgün görev bağlamlarıyla sürdürülür.
İki güvenlik mekanizması uygulanır:

- 2 saatten daha uzun süre önce kesintiye uğrayan çalıştırmalar sürdürülmek yerine sonuçlandırılır; böylece
  gece boyunca kapalı kalan bir Gateway eski işleri yeniden canlandırmaz.
- Kurtarma işlemi art arda başarısız olan bir oturum, sıkışmış olarak mezar taşına dönüştürülür; böylece
  kurtarma sonsuza kadar döngüye giremez.

### Arka plan görevleri

[Arka plan görev kayıt defteri](/tr/automation/tasks) SQLite tabanlıdır ve
açılışta ve düzenli aralıklarla uzlaştırılır: tamamlanan çalıştırmaların kaydettiği kalıcı sonuçlar
kurtarılır ve sahip süreci ortadan kaybolan çalıştırmalar sonsuza kadar askıda kalmak yerine
bir bekleme süresinin ardından kayıp olarak işaretlenir.

### Agent tarafından istenen yeniden başlatmalar

Agent'ın kendisi bir yeniden başlatmayı tetiklediğinde (bir yapılandırma değişikliğini uygulama, Gateway'i
güncelleme veya açık bir yeniden başlatma isteği) süreç kapanmadan önce SQLite'a bir yeniden başlatma
nöbetçisi yazılır. Açılıştan sonra Gateway sonucu kaynak sohbete geri gönderir ve
agent'ın aynı kanal ve ileti dizisinde tam olarak kaldığı yerden devam etmesi için tek seferlik bir devam turu
gönderir.

## Güvenlik mekanizmaları ve gözlemlenebilirlik

- **Çökme döngüsü kesicisi:** 5 dakika içinde 3 temiz olmayan açılış, sonraki açılışta
  otomatik başlatılan yan hizmetleri engelleyen bir kesiciyi tetikler; böylece çöken bir Gateway
  kendi etkisini büyütmez. Temiz olmayan açılış penceresi boşaldığında düzelir.
- **Metrikler:** kurtarma etkinliği
  [Prometheus](/tr/gateway/prometheus) aracılığıyla `openclaw_session_recovery_total` ve
  `openclaw_session_recovery_age_seconds` olarak dışa aktarılır.
- **Günlükler:** kurtarma kararları
  `main-session-restart-recovery` ve `subagent-interrupted-resume`
  alt sistemleri altında günlüğe kaydedilir.

## Sürdürülmeyenler

- Başka bir sahip tarafından zaten işlendiği için ana oturum kurtarmasının dışında bırakılan
  oturumlar: alt agent oturumları (alt agent kurtarması), cron oturumları (zamanlayıcı bunları
  programa göre yeniden çalıştırır) ve ACP tarafından yönetilen oturumlar (sürdürmenin sahibi bağlı IDE
  veya istemcidir).
- Transkript sonundan güvenli biçimde devam edilemeyen oturumlar; bunlar sessizce yeniden çalıştırılmak yerine
  yukarıda açıklanan yeniden gönderme bildirimini alır.
- Hiç kabul edilmemiş işler: mevcut işleri tamamlama penceresi sırasında gelen mesajlar,
  sonlanmakta olan bir süreçte sessizce kuyruğa alınmak yerine açık bir yeniden başlatma hatasıyla reddedilir.
