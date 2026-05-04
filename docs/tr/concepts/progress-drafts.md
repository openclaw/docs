---
read_when:
    - Uzun süren sohbet turları için görünür ilerleme güncellemelerini yapılandırma
    - Kısmi, blok ve ilerleme akışı modları arasında seçim yapma
    - OpenClaw'un çalışma devam ederken tek bir kanal mesajını nasıl güncellediğini açıklama
    - İlerleme taslakları, bağımsız ilerleme mesajları veya sonlandırma geri dönüşüyle ilgili sorunları giderme
summary: 'İlerleme taslakları: bir ajan çalışırken güncellenen tek bir görünür devam eden çalışma mesajı'
title: Taslakları ilerlet
x-i18n:
    generated_at: "2026-05-04T07:03:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: f78c07866cd7f613012a80a40413e5866c1dd2edd477088f9fc141347f5f3788
    source_path: concepts/progress-drafts.md
    workflow: 16
---

İlerleme taslakları, uzun süren ajan turlarını, konuşmayı geçici durum yanıtları yığınına dönüştürmeden sohbette canlı hissettirir.

İlerleme taslakları etkinleştirildiğinde OpenClaw, turun gerçek iş yaptığını kanıtlamasından sonra yalnızca bir görünür devam eden çalışma mesajı oluşturur, ajan okurken, planlarken, araç çağırırken veya onay beklerken bunu günceller ve kanal bunu güvenli şekilde yapabildiğinde o taslağı nihai yanıta dönüştürür.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Araç yoğun çalışma sırasında tek, düzenli bir durum mesajı ve tur bittiğinde nihai yanıt istediğinizde ilerleme taslaklarını kullanın.

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

Bu genellikle yeterlidir. OpenClaw otomatik tek sözcüklük bir etiket seçer, iş en az beş saniye sürdüğünde veya ikinci bir iş olayı yayımladığında beklemeyi bırakır, yararlı iş gerçekleşirken kompakt ilerleme satırları ekler ve o tur için yinelenen bağımsız ilerleme konuşmalarını bastırır.

## Kullanıcıların Gördükleri

Bir ilerleme taslağının iki bölümü vardır:

| Bölüm           | Amaç                                                                     |
| -------------- | --------------------------------------------------------------------------- |
| Etiket          | `Thinking...` veya `Shelling...` gibi kısa bir başlık.                       |
| İlerleme satırları | Ayrıntılı çıktıdakiyle aynı araç etiketlerini ve simgelerini kullanan kompakt çalışma güncellemeleri. |

Etiket, ajan anlamlı işe başladıktan ve beş saniye boyunca meşgul kaldıktan ya da ikinci bir iş olayı yayımladıktan sonra görünür. Yalnızca düz metin yanıtları ilerleme taslağı göstermez. İlerleme satırları yalnızca ajan yararlı iş güncellemeleri yayımladığında eklenir; örneğin `🛠️ Exec`, `🔎 Web Search` veya `✍️ Write: to /tmp/file`.
Varsayılan olarak `/verbose` ile aynı kompakt açıklama modunu kullanırlar; hata ayıklarken ham komutların/ayrıntıların da eklenmesini istiyorsanız `agents.defaults.toolProgressDetail: "raw"` ayarlayın.
Mümkün olduğunda nihai yanıt taslağın yerini alır; aksi halde OpenClaw nihai yanıtı normal şekilde gönderir ve kanalın aktarımına göre taslağı temizler ya da güncellemeyi durdurur.

## Mod Seçin

`channels.<channel>.streaming.mode` görünür devam eden iş davranışını kontrol eder:

| Mod       | En uygun olduğu durum                         | Sohbette görünen                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | Sessiz kanallar                   | Yalnızca nihai yanıt.                            |
| `partial`  | Yanıt metninin görünmesini izlemek      | En son yanıt metniyle düzenlenen tek taslak.     |
| `block`    | Daha büyük yanıt önizleme parçaları     | Daha büyük parçalarda güncellenen veya eklenen tek önizleme. |
| `progress` | Araç yoğun veya uzun süren turlar | Tek durum taslağı, ardından nihai yanıt.          |

Kullanıcılar yanıt metninin token token akmasını izlemekten çok “ne oluyor” sorusuna önem veriyorsa `progress` seçin.

Yanıtın kendisi ilerleme sinyaliyse `partial` seçin.

Daha büyük metin parçaları halinde taslak önizleme güncellemeleri istiyorsanız `block` seçin. Discord ve Telegram’da `streaming.mode: "block"` hâlâ normal blok teslimi değil, önizleme akışıdır. Normal blok yanıtları istediğinizde `streaming.block.enabled` veya eski `blockStreaming` kullanın.

## Etiketleri Yapılandırın

İlerleme etiketleri `channels.<channel>.streaming.progress` altında bulunur.

Varsayılan etiket `auto` olup OpenClaw’un yerleşik üç noktalı tek sözcük etiket havuzundan seçim yapar:

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

## İlerleme Satırlarını Kontrol Edin

İlerleme satırları, ilerleme modunda varsayılan olarak etkindir. Gerçek çalışma olaylarından gelirler: araç başlangıçları, öğe güncellemeleri, görev planları, onaylar, komut çıktısı, yama özetleri ve benzer ajan etkinlikleri.

OpenClaw ilerleme taslakları ve `/verbose` için aynı biçimlendiriciyi kullanır:

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` varsayılandır ve taslakları `🛠️ Exec: check JS syntax for /tmp/app.js` gibi kısa etiketlerle kararlı tutar. `"raw"`, mevcut olduğunda alttaki komutu/ayrıntıyı ekler; bu hata ayıklarken yararlıdır ancak sohbette daha gürültülüdür.

Örneğin aynı komut, ayrıntı moduna bağlı olarak farklı görünür:

| Mod      | İlerleme satırı                                                        |
| --------- | -------------------------------------------------------------------- |
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

Taslak düzenlenirken sohbet balonu yeniden akışını azaltmak için ilerleme satırları otomatik olarak sıkıştırılır.

OpenClaw uzun ilerleme satırlarını varsayılan olarak kırpar; böylece yinelenen taslak düzenlemeleri her güncellemede farklı şekilde sarılmaz. Ön ek okunabilir kalır ve yollar ya da ham komutlar gibi uzun ayrıntılar üç noktayla kısaltılır.

Slack, ilerleme satırlarını tek bir metin gövdesi yerine yapılandırılmış Block Kit alanları olarak işleyebilir:

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

Zengin işleme aynı düz metin geri dönüşünü korur; böylece daha zengin yapıyı desteklemeyen kanallar ve istemciler yine de kompakt ilerleme metnini gösterebilir.

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

`toolProgress: false` ile OpenClaw o tur için eski bağımsız araç ilerlemesi mesajlarını yine de bastırır. Bir etiket yapılandırılmışsa etiket dışında, kanal nihai yanıta kadar görsel olarak sessiz kalır.

## Kanal Davranışı

Her kanal desteklediği en temiz aktarımı kullanır:

| Kanal         | İlerleme aktarımı                     | Notlar                                                                 |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Tek mesaj gönderir, ardından düzenler.        | Tek güvenli önizleme mesajına sığdığında nihai metin yerinde düzenlenir.      |
| Matrix          | Tek olay gönderir, ardından düzenler.          | Hesap düzeyi akış yapılandırması hesap düzeyi taslakları kontrol eder.         |
| Microsoft Teams | Kişisel sohbetlerde yerel Teams akışı. | `streaming.mode: "block"` Teams blok teslimine eşlenir.               |
| Slack           | Yerel akış veya düzenlenebilir taslak gönderisi.  | Konu kullanılabilirliği yerel akışın kullanılıp kullanılamayacağını etkiler.     |
| Telegram        | Tek mesaj gönderir, ardından düzenler.        | Daha eski görünür taslaklar, nihai zaman damgaları yararlı kalsın diye değiştirilebilir. |
| Mattermost      | Düzenlenebilir taslak gönderisi.                   | Araç etkinliği aynı taslak tarzı gönderiye katlanır.               |

Güvenli düzenleme desteği olmayan kanallar genellikle yazıyor göstergelerine veya yalnızca nihai teslimata geri döner.

## Sonlandırma

Nihai yanıt hazır olduğunda OpenClaw sohbeti temiz tutmaya çalışır:

- Taslak güvenli şekilde nihai yanıta dönüşebiliyorsa OpenClaw onu yerinde düzenler.
- Kanal yerel ilerleme akışı kullanıyorsa, yerel aktarım nihai metni kabul ettiğinde OpenClaw bu akışı sonlandırır.
- Nihai yanıtta medya, onay istemi, açık bir yanıt hedefi, çok fazla parça veya başarısız bir düzenleme/gönderme varsa OpenClaw nihai yanıtı normal kanal teslim yolu üzerinden gönderir.

Geri dönüş yolu bilinçli bir tercihtir. Metni kaybetmekten, yanıtı yanlış konuya bağlamaktan veya bir taslağı kanalın güvenli şekilde temsil edemeyeceği bir yükle ezmektense yeni bir nihai yanıt göndermek daha iyidir.

## Sorun Giderme

**Yalnızca nihai yanıtı görüyorum.**

`channels.<channel>.streaming.mode` değerinin, mesajı işleyen hesap veya kanal için `progress` olarak ayarlandığını kontrol edin. Bazı grup veya alıntılı yanıt yolları, kanal doğru mesajı güvenli şekilde düzenleyemediğinde bir tur için taslak önizlemelerini devre dışı bırakabilir.

**Etiketi görüyorum ama araç satırlarını görmüyorum.**

`streaming.progress.toolProgress` değerini kontrol edin. `false` ise OpenClaw tek taslak davranışını korur ancak araç ve görev ilerleme satırlarını gizler.

**Düzenlenmiş taslak yerine yeni bir nihai mesaj görüyorum.**

Bu bir güvenlik geri dönüşüdür. Medya yanıtlarında, uzun yanıtlarda, açık yanıt hedeflerinde, eski Telegram taslaklarında, eksik Slack konu hedeflerinde, silinmiş önizleme mesajlarında veya başarısız yerel akış sonlandırmasında gerçekleşebilir.

**Hâlâ bağımsız ilerleme mesajları görüyorum.**

İlerleme modu, bir taslak etkin olduğunda varsayılan bağımsız araç ilerlemesi mesajlarını bastırır. Bağımsız mesajlar hâlâ görünüyorsa turun gerçekten ilerleme modunu kullandığını ve `streaming.mode: "off"` ya da o mesaj için taslak oluşturamayan bir kanal yolu olmadığını doğrulayın.

**Teams, Discord veya Telegram’dan farklı davranıyor.**

Microsoft Teams, genel gönder-ve-düzenle önizleme aktarımı yerine kişisel sohbetlerde yerel akış kullanır. Teams ayrıca `streaming.mode: "block"` değerini Teams blok teslimi olarak ele alır; çünkü Discord ve Telegram tarafından kullanılan aynı taslak önizleme blok moduna sahip değildir.

## İlgili

- [Akış ve parçalama](/tr/concepts/streaming)
- [Mesajlar](/tr/concepts/messages)
- [Kanal yapılandırması](/tr/gateway/config-channels)
- [Discord](/tr/channels/discord)
- [Matrix](/tr/channels/matrix)
- [Microsoft Teams](/tr/channels/msteams)
- [Slack](/tr/channels/slack)
- [Telegram](/tr/channels/telegram)
