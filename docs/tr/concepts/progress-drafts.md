---
read_when:
    - Uzun süren sohbet turları için görünür ilerleme güncellemelerini yapılandırma
    - Kısmi, blok ve ilerleme akışı modları arasında seçim yapma
    - Çalışma devam ederken OpenClaw'ın tek bir kanal mesajını nasıl güncellediğini açıklama
    - Sorun giderme ilerleme taslakları, bağımsız ilerleme mesajları veya sonlandırma yedeği
summary: 'İlerleme taslakları: bir aracı çalışırken güncellenen, görünür tek bir devam eden çalışma iletisi'
title: İlerleme taslakları
x-i18n:
    generated_at: "2026-07-16T17:06:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ef66dd4d7a31c753f5faa0b88b83ec3760beecf3118cf8aae84f5e57652e809
    source_path: concepts/progress-drafts.md
    workflow: 16
---

İlerleme taslakları, bir agent çalışırken tek bir kanal mesajını canlı bir durum satırına dönüştürür; böylece geçici "hâlâ çalışıyor" yanıtları yığını oluşmaz. `channels.<channel>.streaming.mode: "progress"` ayarlandığında OpenClaw, gerçek çalışma başladıktan sonra mesajı bir kez oluşturur; agent okudukça, plan yaptıkça, araç çağırdıkça veya onay bekledikçe mesajı düzenler ve ardından nihai yanıta dönüştürür.

```text
Çalışıyor...
📖 docs/concepts/progress-drafts.md kaynağından
🔎 Web Araması: "discord mesaj düzenleme" için
🛠️ Bash: testleri çalıştır
```

<Note>
  `channels.discord.streaming` ayarlanmamışsa Discord zaten varsayılan olarak `streaming.mode: "progress"` kullanır; dolayısıyla ilerleme taslakları herhangi bir yapılandırma olmadan burada görünür. Diğer tüm kanallar varsayılan olarak `partial`
  veya `off` kullanır; kanalların tüm varsayılanlarını içeren tablo için [Akış ve parçalara ayırma](/tr/concepts/streaming#channel-mapping)
  bölümüne bakın.
</Note>

## Hızlı başlangıç

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
      },
    },
  },
}
```

Buradaki varsayılanlar: 5 saniyelik başlangıç gecikmesi, yararlı çalışma sürerken kısa ilerleme satırları ve ilgili tur için eski bağımsız ilerleme mesajlarının bastırılmasıdır. Ham araç satırı taslakları otomatik, tek sözcüklük bir etiket kullanır; açıkça bir başlık yapılandırmadığınız sürece durum başlığı bu gereksiz başlığı göstermez.

Bu sayfa, ilerleme taslağı deneyimini ve yapılandırma seçeneklerini ele alır. Akış modlarının tam matrisi, kanala özgü çalışma zamanı notları ve eski anahtarların taşınması için [Akış ve parçalara ayırma](/tr/concepts/streaming) bölümüne bakın.

## Kullanıcıların gördükleri

| Bölüm           | Amaç                                                                              |
| --------------- | --------------------------------------------------------------------------------- |
| Durum başlığı   | Discord ve Telegram'da modelin giriş açıklaması; Discord yardımcı bir dolgu ekler. |
| Etiket          | `Working` gibi isteğe bağlı başlangıç/durum satırı.                      |
| İlerleme satırları | `/verbose` ile aynı araç simgelerini ve ayrıntı biçimlendiricisini kullanan kısa çalışma güncellemeleri. |

Ham araç ilerlemesinde etiket, agent anlamlı bir çalışmaya başlayıp ilk gecikme süresince çalışmayı sürdürdüğünde görünür.
Kayan ilerleme satırları listesinin en üstünde yer aldığından, yeterince somut çalışma satırı göründüğünde kayarak görünümden çıkar. Durum başlığı, açıkça bir etiket yapılandırılmadığı sürece yalnızca agent'ın sade dille yazılmış durumunu gösterir. Yalnızca düz metinden oluşan yanıtlar hiçbir zaman ilerleme taslağı göstermez; yalnızca `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"`
veya `✍️ Write: to /tmp/file` gibi gerçek çalışma güncellemelerinde bir satır görünür.

Kanal bunu güvenle yapabiliyorsa nihai yanıt taslağın yerini aynı konumda alır; aksi takdirde OpenClaw nihai yanıtı normal teslimat yoluyla gönderir ve taslağı temizler veya güncellemeyi durdurur (bkz. [Sonlandırma](#finalization)).

## Mod seçme

`channels.<channel>.streaming.mode`, devam eden çalışmanın görünür davranışını denetler:

| Mod        | En uygun olduğu durum            | Sohbette görünenler                               |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off` | Sessiz kanallar                  | Yalnızca nihai yanıt.                             |
| `partial` | Yanıt metninin görünmesini izleme | En son yanıt metniyle düzenlenen tek bir taslak.  |
| `block` | Daha büyük yanıt önizleme parçaları | Daha büyük parçalar hâlinde güncellenen veya genişletilen tek bir önizleme. |
| `progress` | Araç kullanımının yoğun olduğu veya uzun süren turlar | Bir durum taslağı, ardından nihai yanıt.           |

Kullanıcılar, yanıt metninin token token akışını izlemekten çok "ne oluyor" sorusuyla ilgileniyorsa `progress`; ilerleme sinyali yanıt metninin kendisiyse `partial`; daha büyük önizleme parçaları için `block` seçin. Discord ve Telegram'da `streaming.mode: "block"` hâlâ önizleme akışıdır, normal blok yanıt teslimatı değildir — bunun için `streaming.block.enabled` kullanın.

## Etiketleri yapılandırma

İlerleme etiketleri `channels.<channel>.streaming.progress` altında bulunur. Varsayılan ham araç satırı etiketi, yerleşik düz `Working` etiketini kullanan `"auto"` değeridir. Durum başlığı bu örtük etiketi gizler; üzerinde de bir etiket istiyorsanız `label: "auto"` değerini açıkça ayarlayın:

```text
Çalışıyor
```

Sabit bir etiket kullanın:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "İnceleniyor",
        },
      },
    },
  },
}
```

Kendi etiket havuzunuzu kullanın (`label: "auto"` olduğunda yine rastgele/tohuma göre seçilir):

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Kontrol ediliyor", "Okunuyor", "Test ediliyor", "Tamamlanıyor"],
        },
      },
    },
  },
}
```

Etiketi gizleyip yalnızca ilerleme satırlarını gösterin:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: false,
        },
      },
    },
  },
}
```

## İlerleme satırlarını denetleme

İlerleme satırları gerçek çalışma olaylarından gelir: araç başlangıçları, öğe güncellemeleri, görev planları, onaylar, komut çıktısı, yama özetleri ve benzer agent etkinlikleri.
Bunlar varsayılan olarak etkindir (`progress.toolProgress`, varsayılan `true`).

Araçlar, tek bir çağrı hâlâ çalışırken türü belirlenmiş ilerleme güncellemeleri de yayınlayabilir. Yavaş bir getirme veya arama işleminin, araç nihai sonucunu döndürmeden önce görünür taslağı güncellemesi bu şekilde sağlanır. İlerleme güncellemesi, boş model içeriğine ve açık genel kanal meta verilerine sahip kısmi bir araç sonucudur:

```json
{
  "content": [],
  "progress": {
    "text": "Sayfa içeriği getiriliyor...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw, kanalın ilerleme kullanıcı arayüzünde yalnızca `progress.text` öğesini işler. Normal araç sonucu daha sonra yine `content`/`details` olarak gelir ve modele döndürülen tek bölümdür.

Bir araca ilerleme eklerken kısa ve genel bir mesaj yayınlayın ve işlem, gösterilmesinin yararlı olacağı kadar uzun süre beklemede kalana dek mesajı geciktirin. `web_fetch`, 5 saniyelik gecikmeyle tam olarak bunu yapar:

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Sayfa içeriği getiriliyor...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

Hızlı çağrılar ilerleme satırı göstermez; uzun çağrılar hâlâ beklemedeyken bir satır gösterir; iptal edilen çağrılar, güncelliğini yitirmiş ilerleme görünmeden önce zamanlayıcıyı temizler. İlerleme metni, genel bir kullanıcı arayüzü yan kanalıdır; bu nedenle hiçbir zaman gizli bilgiler, ham bağımsız değişkenler, getirilen içerik, komut çıktısı veya sayfa metni içermemelidir.

### Ayrıntı modu

OpenClaw, ilerleme taslakları ve `/verbose` için aynı biçimlendiriciyi kullanır:

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` varsayılandır ve kısa etiketlerle taslakların kararlı kalmasını sağlar.
`"raw"`, kullanılabilir olduğunda temel komutu ekler; bu, hata ayıklama sırasında yararlıdır ancak sohbette daha fazla gürültü oluşturur. Örneğin bir `node --check /tmp/app.js` çağrısı moda göre farklı işlenir:

| Mod       | İlerleme satırı                                                 |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                                      |
| `raw` | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js`                                      |

### Komut/exec metni

`streaming.progress.commandText` (varsayılan `"raw"`), yukarıdaki ayrıntı modundan bağımsız olarak exec/bash ilerleme satırlarının yanında ne kadar komut ayrıntısı gösterileceğini denetler. Komut metnini tamamen gizlerken araç ilerleme satırının görünür kalması için bunu `"status"` olarak ayarlayın:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          commandText: "status",
        },
      },
    },
  },
}
```

### Yorum şeridi

`streaming.progress.commentary` (varsayılan `false`), modelin araç öncesi yorum/giriş anlatımını (💬, örneğin "Kontrol edeceğim... ardından ...") taslaktaki araç satırlarıyla iç içe geçirir. Kanallar arasında paylaşılan yapılandırma biçimi için [Akış ve parçalara ayırma](/tr/concepts/streaming#commentary-progress-lane) bölümüne bakın.

Yorum şeridi etkinleştirildiğinde giriş açıklamaları yalnızca iç içe geçmiş 💬 satırları olarak işlenir; aşağıdaki durum başlığı aradan çekilir ve şerit belgelenmiş biçimini korur.

### Durum başlığı

Discord ve Telegram'da ilerleme modundayken modelin türü belirlenmiş araç öncesi giriş açıklaması, kullanılabilir olduğunda taslağın durum başlığına dönüşür. İlerleme modundaki diğer kanallar mevcut durum davranışlarını korur. Başlık varsayılan olarak açıktır ve kısa turlarda normal etkinlik eşiğini atlamaz;
`streaming.progress.commentary` etkinleştirildiğinde giriş açıklamaları bunun yerine iç içe geçmiş yorum şeridine aktarılır.

Discord'da agent için bir yardımcı model çözümlendiğinde — açık bir [`utilityModel`](/tr/gateway/config-agents#utilitymodel) veya birincil sağlayıcının bildirdiği küçük model varsayılanı (OpenAI → `gpt-5.6-luna`,
Anthropic → `claude-haiku-4-5`) — model hiçbir giriş açıklaması yayınlamadığında veya yaklaşık 20 saniyedir sessiz kaldığında kısa ve sade dille yazılmış bir dolgu sağlar
(Telegram'ın başlığı bugün yalnızca giriş açıklamasını kullanır):

```text
Yapılandırmanızdaki varsayılan model güncelleniyor, ardından değişikliği
uygulamak için gateway yeniden başlatılıyor. Bir agent listeleme çağrısı başarısız oldu ve yeniden deneniyor.
```

Yardımcı anlatım varsayılan olarak açıktır (`streaming.progress.narration`, varsayılan
`true`) ve hiçbir zaman birincil modele geri dönmez: yalnızca açık bir
`utilityModel` veya agent'ın birincil sağlayıcısı için sağlayıcı tarafından bildirilmiş bir varsayılan olduğunda çalışır. Yardımcı yönlendirmeyi tamamen devre dışı bırakmak için `utilityModel: ""` ayarını kullanın. Araç satırları altta birikmeye devam eder ve her iki durum kaynağı da durursa yeniden görünür. Taslak düzenlemeleri yine normal etkinlik eşiğini ve gerçek bir metin değişikliğini bekler; bu, hızlı turlardaki yanıp sönmeleri önler ve yoğun kanallardaki düzenleme yükünü azaltır. Yalnızca yardımcı model dolgusunu devre dışı bırakmak için `narration: false` ayarını kullanın; modelin giriş açıklaması başlıkları etkin kalır:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          narration: false,
        },
      },
    },
  },
}
```

Anlatım girdisi sınırlanır ve hassas bilgilerden arındırılır: yardımcı model, gelen istek metninin yanı sıra taslağın işleyeceği aynı kısa ve hassas bilgilerden arındırılmış araç özetlerini alır; ham komut çıktısını veya araç sonuçlarını hiçbir zaman almaz. `commandText: "status"` kullanıldığında anlatım girdisi, taslakta gösterilenle uyumlu biçimde exec/bash komut metnini de dışarıda bırakır.

### Satır sınırları

Kaç satırın görünür kalacağını sınırlayın (varsayılan 8):

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 4,
        },
      },
    },
  },
}
```

Taslak düzenlenirken sohbet balonunun yeniden akışını azaltmak için ilerleme satırları otomatik olarak sıkıştırılır ve OpenClaw uzun satırları kısaltır; böylece tekrarlanan taslak düzenlemelerinde metin her güncellemede farklı şekilde kaymaz. Satır başına varsayılan sınır 120 karakterdir; düz yazı sözcük sınırında kesilirken yollar veya ham komutlar gibi uzun ayrıntılar, son ek görünür kalacak şekilde ortadan üç noktayla kısaltılır.

Satır başına sınırı ayarlayın:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLineChars: 160,
        },
      },
    },
  },
}
```

### Zengin işleme (Slack)

Slack, ilerleme satırlarını düz metin yerine yapılandırılmış Block Kit alanları olarak işleyebilir:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          render: "rich",
        },
      },
    },
  },
}
```

Zengin işleme, Block Kit alanlarının yanında her zaman aynı düz metin gövdesini de gönderir; böylece daha zengin biçimi işleyemeyen istemciler de kısa ilerleme metnini göstermeye devam eder.

### Araç/görev satırlarını gizleme

Tek ilerleme taslağını koruyup araç ve görev satırlarını gizleyin:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          toolProgress: false,
        },
      },
    },
  },
}
```

`toolProgress: false` ile OpenClaw, söz konusu tur için eski bağımsız
araç ilerleme mesajlarını yine de bastırır — yapılandırılmışsa etiket dışında kanal,
nihai yanıta kadar görsel olarak sessiz kalır.

## Kanal davranışı

| Kanal           | İlerleme aktarımı                         | Notlar                                                                                                                                                          |
| --------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Bir mesaj gönderir, ardından düzenler.     | Varsayılan olarak `progress` modunu kullanır; nihai yanıt bir `-#` etkinlik makbuzu içerir ve durum taslağı, yanıt ulaştıktan sonra silinir. |
| Matrix          | Bir etkinlik gönderir, ardından düzenler.  | Hesap düzeyindeki akış yapılandırması, hesap düzeyindeki taslakları denetler.                                                                                    |
| Microsoft Teams | Kişisel sohbetlerde yerel Teams akışı.     | `streaming.mode: "block"`, bunun yerine Teams blok teslimine eşlenir.                                                                                                   |
| Slack           | Yerel akış veya düzenlenebilir taslak gönderisi. | Bir yanıt dizisi hedefi gerektirir; böyle bir hedefi olmayan üst düzey doğrudan mesajlarda yine de taslak önizleme gönderileri ve düzenlemeleri kullanılır. |
| Telegram        | Bir mesaj gönderir, ardından düzenler.     | İlerleme taslağı ile yanıt arasına bir mesaj gelirse taslak, istemcinin kaydırma konumunu sıçratmak yerine onun altında yeniden yayımlanır (önce yeniyi gönderip sonra eskiyi silme). |
| Mattermost      | Düzenlenebilir taslak gönderisi.           | `block` modu, tamamlanmış metin ile araç etkinliği gönderileri arasında geçiş yapar; diğer modlar araç etkinliğini aynı taslak tarzı gönderide birleştirir. |

Güvenli düzenleme desteği olmayan kanallar, yazıyor göstergelerine veya
yalnızca nihai yanıt teslimine geri döner. Kanal başına tam çalışma zamanı
davranışı dökümü için [Akış ve parçalama](/tr/concepts/streaming) bölümüne bakın.

## Sonlandırma

Nihai yanıt hazır olduğunda OpenClaw, sohbeti temiz tutmaya çalışır:

- Discord'da `progress` modunda nihai yanıt, sonuna küçük bir
  `-#` etkinlik makbuzu eklenmiş yeni bir mesaj olarak gönderilir
  (örneğin `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`) ve durum taslağı,
  bu yanıt teslim edildiğinde silinir. Yoğun kanallarda yanıtın üzerinde sahipsiz
  bir araç günlüğü kalmaz; hatalı nihai yanıtlarda taslak, başarısız turun görünür
  kaydı olarak korunur.
- Taslak güvenli bir şekilde nihai yanıta dönüştürülebiliyorsa (`partial`/`block` modları),
  OpenClaw taslağı yerinde düzenler.
- Kanal yerel ilerleme akışı kullanıyorsa OpenClaw,
  yerel aktarım nihai metni kabul ettiğinde bu akışı sonlandırır.
- Aksi takdirde (medya, bir onay istemi, açık bir yanıt hedefi, çok fazla
  parça veya başarısız bir düzenleme/gönderme) OpenClaw, taslağın üzerine yazmak yerine
  nihai yanıtı normal kanal teslim yolu üzerinden gönderir.

Bu geri dönüş kasıtlıdır: Yeni bir nihai yanıt göndermek; metni kaybetmekten,
bir yanıtı yanlış diziye bağlamaktan veya kanalın güvenli biçimde temsil edemeyeceği
bir yükle taslağın üzerine yazmaktan daha iyidir.

## Sorun giderme

**Yalnızca nihai yanıtı görüyorum.**

Mesajı işleyen hesap veya kanal için `channels.<channel>.streaming.mode` değerinin
`progress` olduğunu kontrol edin. Kanal doğru mesajı güvenli biçimde
düzenleyemediğinde bazı grup veya alıntılı yanıt yolları, ilgili tur için
taslak önizlemelerini devre dışı bırakır.

**Etiketi görüyorum ancak araç satırlarını görmüyorum.**

`streaming.progress.toolProgress` değerini kontrol edin. Değer `false` ise
OpenClaw tek taslak davranışını korur ancak araç ve görev ilerleme satırlarını gizler.

**Düzenlenmiş bir taslak yerine yeni bir nihai mesaj görüyorum.**

Bu, [Sonlandırma](#finalization) bölümünde açıklanan güvenlik geri dönüşüdür.
Medya yanıtları, uzun yanıtlar, açık yanıt hedefleri, eski Telegram taslakları,
eksik Slack yanıt dizisi hedefleri, silinmiş önizleme mesajları veya başarısız
yerel akış sonlandırması nedeniyle gerçekleşebilir.

**Hâlâ bağımsız ilerleme mesajları görüyorum.**

Taslak etkin olduğunda ilerleme modu, varsayılan bağımsız araç ilerleme mesajlarını
bastırır. Bağımsız mesajlar hâlâ görünüyorsa turun gerçekten `progress`
modunu kullandığını ve `streaming.mode: "off"` modunu ya da söz konusu mesaj için
taslak oluşturamayan bir kanal yolunu kullanmadığını doğrulayın.

**Teams, Discord veya Telegram'dan farklı davranıyor.**

Microsoft Teams, genel gönderip düzenlemeli önizleme aktarımı yerine kişisel
sohbetlerde yerel akış kullanır ve Discord ile Telegram'daki gibi bir taslak
önizleme blok modu bulunmadığından `streaming.mode: "block"` değerini Teams blok
teslimine eşler.

## İlgili

- [Akış ve parçalama](/tr/concepts/streaming)
- [Mesajlar](/tr/concepts/messages)
- [Kanal yapılandırması](/tr/gateway/config-channels)
- [Discord](/tr/channels/discord)
- [Matrix](/tr/channels/matrix)
- [Microsoft Teams](/tr/channels/msteams)
- [Slack](/tr/channels/slack)
- [Telegram](/tr/channels/telegram)
- [Mattermost](/tr/channels/mattermost)
