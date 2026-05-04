---
read_when:
    - Uzun süren sohbet turları için görünür ilerleme güncellemelerini yapılandırma
    - Kısmi, blok ve ilerleme akışı modları arasında seçim yapma
    - OpenClaw'un çalışma devam ederken tek bir kanal mesajını nasıl güncellediğini açıklama
    - İlerleme taslakları, bağımsız ilerleme mesajları veya sonlandırma yedeği sorunlarını giderme
summary: 'İlerleme taslakları: bir ajan çalışırken güncellenen görünür tek bir devam eden çalışma mesajı'
title: İlerleme taslakları
x-i18n:
    generated_at: "2026-05-04T02:23:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ce19262800f1c3c3e505a3cf1d41ed5c3dffcbca168ad7b7afabdce62eee8fe
    source_path: concepts/progress-drafts.md
    workflow: 16
---

İlerleme taslakları, uzun süren aracı turlarının sohbet içinde canlı hissettirmesini sağlar ve bunu konuşmayı geçici durum yanıtları yığınına dönüştürmeden yapar.

İlerleme taslakları etkinleştirildiğinde, OpenClaw yalnızca turun gerçek iş yaptığını kanıtlamasından sonra görünür bir devam eden çalışma mesajı oluşturur; ajan okurken, plan yaparken, araçları çağırırken veya onay beklerken bu mesajı günceller ve kanal bunu güvenli biçimde yapabildiğinde bu taslağı son yanıta dönüştürür.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Araç yoğun iş sırasında tek bir düzenli durum mesajı ve tur tamamlandığında son yanıt istediğinizde ilerleme taslaklarını kullanın.

## Hızlı Başlangıç

İlerleme taslaklarını kanal başına `streaming.mode: "progress"` ile etkinleştirin:

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

Bu genellikle yeterlidir. OpenClaw otomatik tek kelimelik bir etiket seçer, iş en az beş saniye sürdüğünde veya ikinci bir iş olayı yaydığında beklemeyi bırakır, yararlı iş gerçekleşirken kompakt ilerleme satırları ekler ve o tur için yinelenen bağımsız ilerleme sohbetini bastırır.

## Kullanıcıların Gördükleri

Bir ilerleme taslağının iki bölümü vardır:

| Bölüm             | Amaç                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------- |
| Etiket            | `Thinking...` veya `Shelling...` gibi kısa bir başlık.                                |
| İlerleme satırları | Ayrıntılı çıktıyla aynı araç etiketlerini ve simgelerini kullanan kompakt çalışma güncellemeleri. |

Etiket, ajan anlamlı işe başladıktan ve ya beş saniye meşgul kaldıktan ya da ikinci bir iş olayı yaydıktan sonra görünür. Yalnızca düz metin yanıtları ilerleme taslağı göstermez. İlerleme satırları yalnızca ajan yararlı iş güncellemeleri yaydığında eklenir; örneğin `🛠️ Exec`, `🔎 Web Search` veya `✍️ Write: to /tmp/file`. Varsayılan olarak `/verbose` ile aynı kompakt açıklama modunu kullanırlar; hata ayıklarken ham komutların/ayrıntıların da eklenmesini istiyorsanız `agents.defaults.toolProgressDetail: "raw"` ayarlayın.
Mümkün olduğunda son yanıt taslağın yerini alır; aksi durumda OpenClaw son yanıtı normal şekilde gönderir ve kanalın taşımasına göre taslağı temizler veya güncellemeyi durdurur.

## Bir Mod Seçin

`channels.<channel>.streaming.mode`, görünür devam eden çalışma davranışını denetler:

| Mod        | En uygun kullanım                  | Sohbette görünen                                      |
| ---------- | ---------------------------------- | ----------------------------------------------------- |
| `off`      | Sessiz kanallar                    | Yalnızca son yanıt.                                   |
| `partial`  | Yanıt metninin görünmesini izlemek | En son yanıt metniyle düzenlenen tek bir taslak.      |
| `block`    | Daha büyük yanıt önizleme parçaları | Daha büyük parçalarda güncellenen veya eklenen tek bir önizleme. |
| `progress` | Araç yoğun veya uzun süren turlar  | Tek bir durum taslağı, ardından son yanıt.            |

Kullanıcılar yanıt metninin token token akmasını izlemekten çok “neler oluyor” sorusunu önemsediğinde `progress` seçin.

Yanıtın kendisi ilerleme sinyali olduğunda `partial` seçin.

Taslak önizleme güncellemelerini daha büyük metin parçaları halinde istediğinizde `block` seçin. Discord ve Telegram’da `streaming.mode: "block"` hâlâ önizleme akışıdır, normal blok teslimi değildir. Normal blok yanıtları istediğinizde `streaming.block.enabled` veya eski `blockStreaming` kullanın.

## Etiketleri Yapılandırın

İlerleme etiketleri `channels.<channel>.streaming.progress` altında bulunur.

Varsayılan etiket `auto` değeridir; bu, OpenClaw’ın yerleşik tek-kelime-ve-üç-nokta etiket havuzundan seçim yapar:

```text
Thinking...
Shelling...
Scuttling...
Clawing...
Pinching...
Molting...
Bubbling...
Tiding...
Reefing...
Cracking...
Sifting...
Brining...
Nautiling...
Krilling...
Barnacling...
Lobstering...
Tidepooling...
Pearling...
Snapping...
Surfacing...
```

Sabit bir etiket kullanın:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Investigating",
        },
      },
    },
  },
}
```

Kendi otomatik etiket havuzunuzu kullanın:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Checking", "Reading", "Testing", "Finishing"],
        },
      },
    },
  },
}
```

Etiketi gizleyin ve yalnızca ilerleme satırlarını gösterin:

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

## İlerleme Satırlarını Denetleyin

İlerleme satırları, ilerleme modunda varsayılan olarak etkindir. Bunlar gerçek çalışma olaylarından gelir: araç başlangıçları, öğe güncellemeleri, görev planları, onaylar, komut çıktısı, yama özetleri ve benzer ajan etkinlikleri.

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

`"explain"` varsayılandır ve taslakları `🛠️ Exec: check JS syntax for /tmp/app.js` gibi kısa etiketlerle sabit tutar. `"raw"` mevcut olduğunda alttaki komutu/ayrıntıyı ekler; bu, hata ayıklarken yararlıdır ama sohbette daha gürültülüdür.

Örneğin aynı komut, ayrıntı moduna bağlı olarak farklı görünür:

| Mod       | İlerleme satırı                                                     |
| --------- | ------------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                           |
| `raw`     | `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

Kaç satırın görünür kalacağını sınırlayın:

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

Tek ilerleme taslağını koruyun ancak araç ve görev satırlarını gizleyin:

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

`toolProgress: false` ile OpenClaw, o tur için eski bağımsız araç ilerleme mesajlarını yine de bastırır. Yapılandırılmış bir etiket varsa o etiket dışında, kanal son yanıta kadar görsel olarak sessiz kalır.

## Kanal Davranışı

Her kanal desteklediği en temiz taşımayı kullanır:

| Kanal           | İlerleme taşıması                         | Notlar                                                                    |
| --------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| Discord         | Tek bir mesaj gönderir, sonra düzenler.    | Son metin, tek bir güvenli önizleme mesajına sığdığında yerinde düzenlenir. |
| Matrix          | Tek bir olay gönderir, sonra düzenler.     | Hesap düzeyi akış yapılandırması hesap düzeyi taslakları denetler.        |
| Microsoft Teams | Kişisel sohbetlerde yerel Teams akışı.     | `streaming.mode: "block"` Teams blok teslimine eşlenir.                   |
| Slack           | Yerel akış veya düzenlenebilir taslak gönderisi. | İş parçacığı kullanılabilirliği, yerel akışın kullanılıp kullanılamayacağını etkiler. |
| Telegram        | Tek bir mesaj gönderir, sonra düzenler.    | Daha eski görünür taslaklar, son zaman damgalarının yararlı kalması için değiştirilebilir. |
| Mattermost      | Düzenlenebilir taslak gönderisi.           | Araç etkinliği aynı taslak tarzı gönderiye katlanır.                      |

Güvenli düzenleme desteği olmayan kanallar genellikle yazıyor göstergelerine veya yalnızca son yanıt teslimine geri döner.

## Sonlandırma

Son yanıt hazır olduğunda OpenClaw sohbeti temiz tutmaya çalışır:

- Taslak güvenli biçimde son yanıta dönüşebiliyorsa OpenClaw bunu yerinde düzenler.
- Kanal yerel ilerleme akışı kullanıyorsa, yerel taşıma son metni kabul ettiğinde OpenClaw bu akışı sonlandırır.
- Son yanıtta medya, bir onay istemi, açık bir yanıt hedefi, çok fazla parça veya başarısız bir düzenleme/gönderme varsa OpenClaw son yanıtı normal kanal teslim yolu üzerinden gönderir.

Geri dönüş yolu bilinçli bir tercihtir. Metni kaybetmekten, yanıtı yanlış iş parçacığına bağlamaktan veya taslağı kanalın güvenli biçimde temsil edemeyeceği bir yükle üzerine yazmaktansa yeni bir son yanıt göndermek daha iyidir.

## Sorun Giderme

**Yalnızca son yanıtı görüyorum.**

Mesajı işleyen hesap veya kanal için `channels.<channel>.streaming.mode` değerinin `progress` olarak ayarlandığını kontrol edin. Bazı grup veya alıntı-yanıt yolları, kanal doğru mesajı güvenli biçimde düzenleyemediğinde bir tur için taslak önizlemelerini devre dışı bırakabilir.

**Etiketi görüyorum ama araç satırlarını görmüyorum.**

`streaming.progress.toolProgress` değerini kontrol edin. `false` ise OpenClaw tek taslak davranışını korur ancak araç ve görev ilerleme satırlarını gizler.

**Düzenlenmiş taslak yerine yeni bir son mesaj görüyorum.**

Bu bir güvenlik geri dönüşüdür. Medya yanıtlarında, uzun yanıtlarda, açık yanıt hedeflerinde, eski Telegram taslaklarında, eksik Slack iş parçacığı hedeflerinde, silinmiş önizleme mesajlarında veya başarısız yerel akış sonlandırmasında gerçekleşebilir.

**Hâlâ bağımsız ilerleme mesajları görüyorum.**

İlerleme modu, taslak etkin olduğunda varsayılan bağımsız araç ilerleme mesajlarını bastırır. Bağımsız mesajlar hâlâ görünüyorsa, turun gerçekten ilerleme modunu kullandığını ve `streaming.mode: "off"` ya da o mesaj için taslak oluşturamayan bir kanal yolu kullanmadığını doğrulayın.

**Teams, Discord veya Telegram’dan farklı davranıyor.**

Microsoft Teams, kişisel sohbetlerde genel gönder-ve-düzenle önizleme taşıması yerine yerel bir akış kullanır. Teams ayrıca `streaming.mode: "block"` değerini Teams blok teslimi olarak ele alır, çünkü Discord ve Telegram tarafından kullanılan aynı taslak-önizleme blok moduna sahip değildir.

## İlgili

- [Akış ve parçalama](/tr/concepts/streaming)
- [Mesajlar](/tr/concepts/messages)
- [Kanal yapılandırması](/tr/gateway/config-channels)
- [Discord](/tr/channels/discord)
- [Matrix](/tr/channels/matrix)
- [Microsoft Teams](/tr/channels/msteams)
- [Slack](/tr/channels/slack)
- [Telegram](/tr/channels/telegram)
