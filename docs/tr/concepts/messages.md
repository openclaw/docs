---
read_when:
    - Gelen mesajların nasıl yanıtlara dönüştüğünü açıklama
    - Oturumları, kuyruklama modlarını veya akış davranışını açıklığa kavuşturma
    - Akıl yürütme görünürlüğünü ve kullanım üzerindeki etkilerini belgeleme
summary: Mesaj akışı, oturumlar, kuyruğa alma ve akıl yürütme görünürlüğü
title: Mesajlar
x-i18n:
    generated_at: "2026-07-16T17:05:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2982ebb1b82b90368263826ef8f42babab9c8a559cc1409a381893a011a0ad7
    source_path: concepts/messages.md
    workflow: 16
---

Gelen mesajlar yönlendirme, yinelenenleri kaldırma/bekletme, bir aracı çalıştırması ve giden teslimat aşamalarından geçer:

```text
Gelen mesaj
  -> yönlendirme/bağlamalar -> oturum anahtarı
  -> yinelenenleri kaldırma + bekletme
  -> kuyruk (bir çalıştırma zaten etkinse)
  -> aracı çalıştırması (akış + araçlar)
  -> giden yanıtlar (kanal sınırları + parçalara ayırma)
```

Temel yapılandırma yüzeyleri:

- `messages.*`: ön ekler, kuyruğa alma, gelen mesajları bekletme ve grup davranışı için.
- `agents.defaults.*`: blok akışı, parçalara ayırma ve sessiz yanıt varsayılanları için.
- Kanal başına sınırlar ve akış geçişleri için kanal geçersiz kılmaları (`channels.telegram.*`, `channels.whatsapp.*` vb.).

Tam şema için [Yapılandırma](/tr/gateway/configuration) sayfasına bakın.

## Gelen mesajlarda yinelenenleri kaldırma

Kanallar, yeniden bağlandıktan sonra aynı mesajı tekrar teslim edebilir. OpenClaw; aracı kapsamı, kanal rotası (kanal + eş + hesap + ileti dizisi) ve mesaj kimliğiyle anahtarlanan bir bellek içi önbellek tutar; böylece yeniden teslim edilen bir mesaj ikinci bir aracı çalıştırmasını tetiklemez. Önbellek girdisi 20 dakika sonra veya 5000 girdi izlenmeye başladığında (hangisi önce gerçekleşirse) sona erer.

## Gelen mesajları bekletme

Aynı göndericiden hızla art arda gelen metin mesajları, `messages.inbound` aracılığıyla tek bir aracı turunda toplu işlenebilir. Bekletme, kanal + konuşma başına kapsamlandırılır ve yanıt ileti dizisi/kimlikleri için en son mesajı kullanır.

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        discord: 1500,
        slack: 1500,
        whatsapp: 5000,
      },
    },
  },
}
```

- Bekletme yalnızca metin içeren mesajlara uygulanır; medya/ekler hemen gönderilir.
- Denetim komutları (durdurma/iptal/durum vb.) bekletmeyi atlar ve hemen gönderilir.
- Varsayılan olarak devre dışıdır: `messages.inbound.debounceMs` yerleşik bir varsayılana sahip değildir; dolayısıyla bekletme yalnızca bunu ayarladığınızda (genel olarak veya kanal başına) etkinleşir.
- iMessage'ın isteğe bağlı `coalesceSameSenderDms` ayarı tek istisnadır: Apple'ın komut+URL biçimindeki bölünmüş gönderiminin tek tur olarak ulaşabilmesi için aynı göndericiden gelen tüm doğrudan mesaj metinlerini (komutlar dâhil) yeterince uzun süre tutar. Grup sohbetleri, bu ayardan bağımsız olarak her zaman anında gönderilir.

## Oturumlar ve cihazlar

Oturumların sahibi istemciler değil, Gateway'dir.

- Doğrudan sohbetler, aracının ana oturum anahtarında birleştirilir.
- Gruplar/kanallar kendi oturum anahtarlarını alır.
- Oturum deposu ve dökümler Gateway ana makinesinde bulunur.

Birden fazla cihaz/kanal aynı oturumla eşlenebilir, ancak geçmiş her istemciye tamamen geri eşitlenmez. Bağlamın ayrışmasını önlemek için uzun konuşmalarda tek bir birincil cihaz kullanın. Denetim Arayüzü ve TUI her zaman Gateway destekli oturum dökümünü gösterir; bu nedenle doğruluk kaynağı bunlardır.

Ayrıntılar: [Oturum yönetimi](/tr/concepts/session).

## İstem gövdeleri ve geçmiş bağlamı

Kanal Plugin'leri, gelen bağlamdaki çeşitli metin alanlarını en çok tercih edilenden en az tercih edilene doğru doldurur:

| Alan              | Amaç                                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | Geçerli tur için modele yönelik metin. Ayarlanmamışsa `CommandBody` / `RawBody` / `Body` kullanılır.        |
| `BodyForCommands` | Yönerge/komut ayrıştırmada kullanılan temiz metin. Ayarlanmamışsa `CommandBody` / `RawBody` / `Body` kullanılır. |
| `CommandBody`     | Eski ara gövde; `BodyForCommands` tercih edilmelidir.                                                                       |
| `RawBody`         | `CommandBody` için kullanımdan kaldırılmış diğer ad.                                                                         |
| `Body`            | Eski istem gövdesi; kanal zarflarını ve geçmiş sarmalayıcılarını içerebilir.                                                 |

Bir kanal geçmiş sağladığında bunu şunlarla sarmalar:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Doğrudan olmayan sohbetlerde (gruplar/kanallar/odalar), geçerli mesaj gövdesinin başına geçmiş girdilerinde kullanılan biçimle eşleşen gönderici etiketi eklenir. Yönerge ayıklama yalnızca geçerli mesaj bölümüne uygulanır; böylece geçmiş bozulmadan kalır. Geçmişi sarmalayan kanallar, `BodyForCommands` (veya eski `CommandBody` / `RawBody`) değerini özgün mesaj metnine ayarlamalı ve `Body` değerini birleştirilmiş istem olarak tutmalıdır.

Geçmiş arabellekleri yalnızca bekleyenleri içerir: bir çalıştırmayı tetiklemeyen grup mesajlarını (örneğin, bahsetme koşullu mesajlar) içerir ve oturum dökümünde zaten bulunan mesajları hariç tutar. Yapılandırılmış geçmiş, yanıt, iletilmiş mesaj ve kanal meta verileri, istem oluşturma sırasında güvenilmeyen kullanıcı rolü bağlam blokları olarak işlenir.

Geçmiş boyutunu `messages.groupChat.historyLimit` (genel varsayılan) veya `channels.slack.historyLimit` ve `channels.telegram.accounts.<id>.historyLimit` gibi kanal başına geçersiz kılmalarla yapılandırın (devre dışı bırakmak için `0` ayarlayın).

## Araç sonucu meta verileri

Araç sonucu `content`, modelin görebildiği sonuçtur; `details` ise kullanıcı arayüzünde işleme, tanılama, medya teslimatı ve Plugin'ler için çalışma zamanı meta verileridir.

- `toolResult.details`, sağlayıcıya yeniden oynatılmadan ve Compaction girdisinden önce kaldırılır.
- Kalıcı oturum dökümleri yalnızca sınırlandırılmış `details` verilerini tutar; aşırı büyük meta veriler, `persistedDetailsTruncated: true` olarak işaretlenmiş kompakt bir özetle değiştirilir.
- Plugin'ler ve araçlar, modelin okuması gereken metni yalnızca `details` içine değil, `content` içine koymalıdır.

## Kuyruğa alma ve takipler

Bir çalıştırma zaten etkinken, gelen mesajlar varsayılan olarak ona yön verir. `messages.queue` modu denetler:

| Mod               | Davranış                                                     |
| ----------------- | ------------------------------------------------------------ |
| `steer` (varsayılan) | Yeni istemi etkin çalıştırmaya ekler.                        |
| `followup`        | Mesajı etkin çalıştırma bittikten sonra çalıştırır.           |
| `collect`         | Uyumlu mesajları daha sonraki tek bir turda toplu işler.      |
| `interrupt`       | Etkin çalıştırmayı iptal eder, ardından en yeni istemi başlatır. |

Varsayılanlar: `messages.queue.debounceMs` 500ms'dir (yönlendirme, takip ve toplama işlemlerinin tümüne uygulanır), `messages.queue.cap` 20 kuyruklanmış mesajdır ve `messages.queue.drop`, `summarize` değeridir (`old` ve `new` da kullanılabilir). Kanal başına geçersiz kılmaları `messages.queue.byChannel` ve `messages.queue.debounceMsByChannel` aracılığıyla yapılandırın.

Ayrıntılar: [Komut kuyruğu](/tr/concepts/queue) ve [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

## Kanal çalıştırmasının sahipliği

Kanal Plugin'leri, bir mesaj oturum kuyruğuna girmeden önce sıralamayı koruyabilir, girdiyi bekletebilir ve aktarım geri basıncı uygulayabilir. Aracı turunun çevresine ayrıca bir zaman aşımı koymamalıdırlar. Bir mesaj oturuma yönlendirildikten sonra uzun süren işleri oturum, araç ve çalışma zamanı yaşam döngüsü yönetir; böylece tüm kanallar yavaş turları tutarlı biçimde bildirir ve bunlardan kurtulur.

## Akış, parçalara ayırma ve toplu işleme

Blok akışı, model metin blokları ürettikçe kısmi yanıtlar gönderir; parçalara ayırma kanal metin sınırlarına uyar ve çitli kodu bölmekten kaçınır.

- `agents.defaults.blockStreamingDefault` (`on|off`, varsayılan `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (boşta kalma temelli toplu işleme)
- `agents.defaults.humanDelay` (blok yanıtları arasında insan benzeri duraklama)
- Kanal geçersiz kılmaları: paketlenmiş kanallarda `*.streaming.block.enabled` ve `*.streaming.block.coalesce`; güncelliğini yitirmiş düz anahtarlar `openclaw doctor --fix` tarafından taşınır. Blok akışı, Telegram dâhil her kanalda açıkça etkinleştirilmediği sürece kapalıdır. QQ Bot istisnadır: `streaming.block` anahtarları yoktur ve `channels.qqbot.streaming.mode`, `"off"` olmadığı sürece blok yanıtlarını akışla gönderir.

Ayrıntılar: [Akış + parçalara ayırma](/tr/concepts/streaming).

## Akıl yürütme görünürlüğü ve token'lar

- `/reasoning on|off|stream` görünürlüğü denetler.
- Model ürettiğinde akıl yürütme içeriği yine token kullanımına dâhil edilir.
- Telegram, akıl yürütmenin son teslimattan sonra silinen geçici bir taslak balonuna akışla gönderilmesini destekler; kalıcı akıl yürütme çıktısı için `/reasoning on` kullanın.

Ayrıntılar: [Düşünme + akıl yürütme yönergeleri](/tr/tools/thinking) ve [Token kullanımı](/tr/reference/token-use).

## Ön ekler, ileti dizileri ve yanıtlar

- Giden ön ek zinciri: `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`. WhatsApp ayrıca gelen ön eki için `channels.whatsapp.messagePrefix` değerine sahiptir.
- `replyToMode` ve kanal başına varsayılanlar aracılığıyla yanıtları ileti dizisine bağlama.

Ayrıntılar: [Yapılandırma](/tr/gateway/config-agents#messages) ve kanal belgeleri.

## Sessiz yanıtlar

Sessiz token `NO_REPLY` (büyük/küçük harfe duyarsızdır; dolayısıyla `no_reply` de eşleşir), "kullanıcının görebileceği bir yanıt teslim etme" anlamına gelir. Bir turda oluşturulan TTS sesi gibi bekleyen araç medyası da olduğunda OpenClaw sessiz metni kaldırır, ancak medya ekini yine teslim eder.

Sessizlik politikası konuşma türüne göre çözümlenir:

- Doğrudan konuşmalar hiçbir zaman `NO_REPLY` istem yönlendirmesi almaz. Doğrudan bir çalıştırma yanlışlıkla tek başına sessiz token döndürürse OpenClaw bunu yeniden yazmak veya teslim etmek yerine bastırır.
- Gruplar/kanallar varsayılan olarak sessizliğe izin verir. `message_tool` görünür yanıt modunda sessizlik, modelin `message(action=send)` çağrısını yapmaması anlamına gelir.
- Dâhilî orkestrasyon varsayılan olarak sessizliğe izin verir.

Varsayılanlar `agents.defaults.silentReply` altında bulunur; `surfaces.<id>.silentReply`, yüzey başına grup/dâhilî politikasını geçersiz kılabilir.

OpenClaw ayrıca doğrudan olmayan sohbetlerdeki genel dâhilî çalıştırıcı hataları için sessiz yanıtları kullanır; böylece gruplar/kanallar Gateway hata standart metnini görmez. Eksik kimlik doğrulama, hız sınırı veya aşırı yük bildirimleri gibi kullanıcıya yönelik kurtarma metni içeren sınıflandırılmış hatalar yine de teslim edilebilir. Doğrudan sohbetler varsayılan olarak kompakt hata metnini gösterir; ham çalıştırıcı ayrıntıları yalnızca `/verbose full` etkinleştirildiğinde gösterilir.

Tek başına sessiz yanıtlar tüm yüzeylerde bırakılır; böylece üst oturumlar, gözcü metnini yedek konuşmaya dönüştürmek yerine sessiz kalır.

## İlgili

- [Mesaj yaşam döngüsü yeniden düzenlemesi](/tr/concepts/message-lifecycle-refactor) - kalıcı gönderme ve alma tasarımı hedefi
- [Akış](/tr/concepts/streaming) - gerçek zamanlı mesaj teslimatı
- [Yeniden deneme](/tr/concepts/retry) - mesaj teslimatını yeniden deneme davranışı
- [Kuyruk](/tr/concepts/queue) - mesaj işleme kuyruğu
- [Kanallar](/tr/channels) - mesajlaşma platformu entegrasyonları
