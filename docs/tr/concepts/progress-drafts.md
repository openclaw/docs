---
read_when:
    - Uzun süren sohbet turları için görünür ilerleme güncellemelerini yapılandırma
    - Kısmi, blok ve ilerleme akışı modları arasında seçim yapma
    - OpenClaw'ın çalışma sürerken bir kanal mesajını nasıl güncellediğini açıklama
    - İlerleme taslakları, bağımsız ilerleme mesajları veya sonlandırma yedeği sorunlarını giderme
summary: 'İlerleme taslakları: bir ajan çalışırken güncellenen, görünür tek bir devam eden çalışma mesajı'
title: İlerleme taslakları
x-i18n:
    generated_at: "2026-05-03T21:31:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fc0dff38232228b49872d66f4498f065675cdd3abf3a0f4003cb34fcbb7de8c
    source_path: concepts/progress-drafts.md
    workflow: 16
---

İlerleme taslakları, konuşmayı geçici durum yanıtları yığınına dönüştürmeden
uzun süren ajan turlarının sohbette canlı hissettirmesini sağlar.

İlerleme taslakları etkinleştirildiğinde OpenClaw, görünür bir çalışma-devam
mesajı oluşturur; ajan okurken, plan yaparken, araçları çağırırken veya onay
beklerken bunu günceller ve kanal bunu güvenli şekilde yapabiliyorsa bu taslağı
son yanıta dönüştürür.

```text
Shelling
- reading recent channel context
- checking matching issues
- preparing reply
```

Araç ağırlıklı çalışma sırasında tek düzenli durum mesajı ve tur tamamlandığında
son yanıt istediğinizde ilerleme taslaklarını kullanın.

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

Bu genellikle yeterlidir. OpenClaw otomatik tek kelimelik bir etiket seçer,
yararlı iş gerçekleşirken kompakt ilerleme satırları ekler ve o tur için yinelenen
bağımsız ilerleme gevezeliğini bastırır.

## Kullanıcıların Gördükleri

Bir ilerleme taslağının iki parçası vardır:

| Parça             | Amaç                                                               |
| ----------------- | ------------------------------------------------------------------ |
| Etiket            | `Thinking` veya `Shelling` gibi kısa bir başlık.                   |
| İlerleme satırları | Araç çağrıları, görev adımları veya onaylar gibi kompakt çalışma güncellemeleri. |

Etiket, ajan yanıtlamaya başladığında hemen görünür. İlerleme satırları yalnızca
ajan yararlı iş güncellemeleri yaydığında eklenir. Mümkün olduğunda son yanıt
taslağın yerini alır; aksi halde OpenClaw son yanıtı normal şekilde gönderir ve
kanalın taşıma biçimine göre taslağı temizler veya güncellemeyi durdurur.

## Bir Mod Seçin

`channels.<channel>.streaming.mode` görünür devam eden çalışma davranışını denetler:

| Mod        | En uygun kullanım                 | Sohbette görünenler                               |
| ---------- | --------------------------------- | ------------------------------------------------- |
| `off`      | Sessiz kanallar                   | Yalnızca son yanıt.                               |
| `partial`  | Yanıt metninin görünmesini izleme | En son yanıt metniyle düzenlenen tek taslak.      |
| `block`    | Daha büyük yanıt önizleme parçaları | Daha büyük parçalar halinde güncellenen veya eklenen tek önizleme. |
| `progress` | Araç ağırlıklı veya uzun süren turlar | Tek durum taslağı, ardından son yanıt.            |

Kullanıcılar yanıt metninin token token akmasını izlemekten çok "ne oluyor" ile
ilgileniyorsa `progress` seçin.

Yanıtın kendisi ilerleme sinyaliyse `partial` seçin.

Daha büyük metin parçalarında taslak önizleme güncellemeleri istiyorsanız
`block` seçin. Discord ve Telegram üzerinde `streaming.mode: "block"` hâlâ
önizleme akışıdır, normal blok teslimi değildir. Normal blok yanıtları
istediğinizde `streaming.block.enabled` veya eski `blockStreaming` kullanın.

## Etiketleri Yapılandırma

İlerleme etiketleri `channels.<channel>.streaming.progress` altında bulunur.

Varsayılan etiket `auto` değeridir; bu, OpenClaw'ın yerleşik tek kelimelik
etiket havuzundan seçim yapar:

```text
Thinking
Shelling
Scuttling
Clawing
Pinching
Molting
Bubbling
Tiding
Reefing
Cracking
Sifting
Brining
Nautiling
Krilling
Barnacling
Lobstering
Tidepooling
Pearling
Snapping
Surfacing
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

## İlerleme Satırlarını Denetleme

İlerleme satırları ilerleme modunda varsayılan olarak etkindir. Bunlar gerçek
çalışma olaylarından gelir: araç başlangıçları, öğe güncellemeleri, görev
planları, onaylar, komut çıktısı, yama özetleri ve benzer ajan etkinliği.

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

`toolProgress: false` ile OpenClaw yine de o tur için eski bağımsız araç ilerleme
mesajlarını bastırır. Yapılandırılmışsa etiket dışında kanal son yanıta kadar
görsel olarak sessiz kalır.

## Kanal Davranışı

Her kanal desteklediği en temiz taşıma biçimini kullanır:

| Kanal           | İlerleme taşıma biçimi                 | Notlar                                                                |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Tek mesaj gönderir, sonra düzenler.    | Son metin, güvenli tek önizleme mesajına sığdığında yerinde düzenlenir. |
| Matrix          | Tek olay gönderir, sonra düzenler.     | Hesap düzeyindeki akış yapılandırması hesap düzeyindeki taslakları denetler. |
| Microsoft Teams | Kişisel sohbetlerde yerel Teams akışı. | `streaming.mode: "block"` Teams blok teslimine eşlenir.               |
| Slack           | Yerel akış veya düzenlenebilir taslak gönderisi. | Konu kullanılabilirliği, yerel akışın kullanılıp kullanılamayacağını etkiler. |
| Telegram        | Tek mesaj gönderir, sonra düzenler.    | Eski görünür taslaklar, son zaman damgaları yararlı kalsın diye değiştirilebilir. |
| Mattermost      | Düzenlenebilir taslak gönderisi.       | Araç etkinliği aynı taslak tarzı gönderiye katlanır.                  |

Güvenli düzenleme desteği olmayan kanallar genellikle yazıyor göstergelerine veya
yalnızca son teslimata geri döner.

## Sonlandırma

Son yanıt hazır olduğunda OpenClaw sohbeti temiz tutmaya çalışır:

- Taslak güvenli şekilde son yanıta dönüşebiliyorsa OpenClaw onu yerinde düzenler.
- Kanal yerel ilerleme akışı kullanıyorsa OpenClaw, yerel taşıma son metni kabul
  ettiğinde bu akışı sonlandırır.
- Son yanıtta medya, onay istemi, açık yanıt hedefi, çok fazla parça veya
  başarısız düzenleme/gönderme varsa OpenClaw son yanıtı normal kanal teslim
  yolundan gönderir.

Geri dönüş yolu bilinçli bir tercihtir. Metni kaybetmekten, bir yanıtı yanlış
konuya bağlamaktan veya taslağın üzerine kanalın güvenli şekilde temsil edemeyeceği
bir payload yazmaktansa yeni bir son yanıt göndermek daha iyidir.

## Sorun Giderme

**Yalnızca son yanıtı görüyorum.**

Mesajı işleyen hesap veya kanal için `channels.<channel>.streaming.mode`
değerinin `progress` olarak ayarlandığını kontrol edin. Bazı grup veya alıntılı
yanıt yolları, kanal doğru mesajı güvenli şekilde düzenleyemediğinde bir tur için
taslak önizlemelerini devre dışı bırakabilir.

**Etiketi görüyorum ama araç satırlarını görmüyorum.**

`streaming.progress.toolProgress` ayarını kontrol edin. `false` ise OpenClaw tek
taslak davranışını korur ancak araç ve görev ilerleme satırlarını gizler.

**Düzenlenmiş taslak yerine yeni bir son mesaj görüyorum.**

Bu bir güvenlik geri dönüşüdür. Medya yanıtlarında, uzun yanıtlarda, açık yanıt
hedeflerinde, eski Telegram taslaklarında, eksik Slack konu hedeflerinde, silinmiş
önizleme mesajlarında veya başarısız yerel akış sonlandırmasında gerçekleşebilir.

**Hâlâ bağımsız ilerleme mesajları görüyorum.**

İlerleme modu, bir taslak etkin olduğunda varsayılan bağımsız araç ilerleme
mesajlarını bastırır. Bağımsız mesajlar hâlâ görünüyorsa turun gerçekten ilerleme
modunu kullandığını ve `streaming.mode: "off"` ya da o mesaj için taslak
oluşturamayan bir kanal yolu olmadığını doğrulayın.

**Teams, Discord veya Telegram'dan farklı davranıyor.**

Microsoft Teams, genel gönder-ve-düzenle önizleme taşıma biçimi yerine kişisel
sohbetlerde yerel akış kullanır. Teams ayrıca `streaming.mode: "block"` değerini
Teams blok teslimi olarak ele alır; çünkü Discord ve Telegram tarafından kullanılan
aynı taslak önizleme blok moduna sahip değildir.

## İlgili

- [Akış ve parçalara ayırma](/tr/concepts/streaming)
- [Mesajlar](/tr/concepts/messages)
- [Kanal yapılandırması](/tr/gateway/config-channels)
- [Discord](/tr/channels/discord)
- [Matrix](/tr/channels/matrix)
- [Microsoft Teams](/tr/channels/msteams)
- [Slack](/tr/channels/slack)
- [Telegram](/tr/channels/telegram)
