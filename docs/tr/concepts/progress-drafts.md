---
read_when:
    - Uzun süren sohbet turları için görünür ilerleme güncellemelerini yapılandırma
    - Kısmi, blok ve ilerleme akışı modları arasında seçim yapma
    - OpenClaw'ın çalışma devam ederken tek bir kanal mesajını nasıl güncellediğini açıklama
    - İlerleme taslakları, bağımsız ilerleme mesajları veya sonlandırma yedek mekanizmasıyla ilgili sorunları giderme
summary: 'İlerleme taslakları: bir agent çalışırken güncellenen, görünür tek bir devam eden çalışma iletisi'
title: Taslakları ilerlet
x-i18n:
    generated_at: "2026-05-06T09:09:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b55c016dd7c8f719237d0cf2481e8259c99ac6dc9320c637eaea23c097e910
    source_path: concepts/progress-drafts.md
    workflow: 16
---

İlerleme taslakları, uzun süren agent dönüşlerinin sohbeti geçici durum yanıtları yığınına çevirmeden canlı hissettirmesini sağlar.

İlerleme taslakları etkinleştirildiğinde OpenClaw, yalnızca dönüş gerçek iş yaptığını kanıtladıktan sonra görünen tek bir devam eden iş mesajı oluşturur, agent okurken, plan yaparken, araç çağırırken veya onay beklerken bunu günceller ve kanal bunu güvenli şekilde yapabildiğinde bu taslağı son yanıta dönüştürür.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Araç ağırlıklı işler sırasında tek ve düzenli bir durum mesajı, dönüş tamamlandığında da son yanıt istediğinizde ilerleme taslaklarını kullanın.

## Hızlı başlangıç

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

Bu genellikle yeterlidir. OpenClaw otomatik tek kelimelik bir etiket seçer, çalışma en az beş saniye sürünceye veya ikinci bir iş olayı yayınlayıncaya kadar bekler, yararlı iş gerçekleşirken kompakt ilerleme satırları ekler ve bu dönüş için yinelenen bağımsız ilerleme sohbetini bastırır.

## Kullanıcıların gördükleri

Bir ilerleme taslağının iki bölümü vardır:

| Bölüm             | Amaç                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------ |
| Etiket            | `Thinking...` veya `Shelling...` gibi kısa bir başlık.                               |
| İlerleme satırları | Ayrıntılı çıktıdakiyle aynı araç etiketleri ve simgeleriyle kompakt çalışma güncellemeleri. |

Etiket, agent anlamlı işe başladıktan ve beş saniye boyunca meşgul kaldıktan veya ikinci bir iş olayı yayınladıktan sonra görünür. Yalnızca düz metin yanıtları ilerleme taslağı göstermez. İlerleme satırları yalnızca agent yararlı iş güncellemeleri yayınladığında eklenir; örneğin `🛠️ Exec`, `🔎 Web Search` veya `✍️ Write: to /tmp/file`.
Varsayılan olarak `/verbose` ile aynı kompakt açıklama modunu kullanırlar; hata ayıklarken ham komutların/ayrıntıların da eklenmesini istediğinizde `agents.defaults.toolProgressDetail: "raw"` ayarlayın.
Mümkün olduğunda son yanıt taslağın yerini alır; aksi takdirde OpenClaw son yanıtı normal şekilde gönderir ve kanalın aktarımına göre taslağı temizler veya güncellemeyi bırakır.

## Mod seçme

`channels.<channel>.streaming.mode`, görünen devam eden iş davranışını kontrol eder:

| Mod        | En uygun kullanım                 | Sohbette görünenler                                    |
| ---------- | --------------------------------- | ------------------------------------------------------ |
| `off`      | Sessiz kanallar                   | Yalnızca son yanıt.                                    |
| `partial`  | Yanıt metninin belirmesini izleme | En son yanıt metniyle düzenlenen tek bir taslak.       |
| `block`    | Daha büyük yanıt önizleme parçaları | Daha büyük parçalar halinde güncellenen veya eklenen tek bir önizleme. |
| `progress` | Araç ağırlıklı veya uzun süren dönüşler | Tek bir durum taslağı, ardından son yanıt.             |

Kullanıcılar yanıt metninin token token akmasını izlemekten çok "ne oluyor" bilgisini önemsediğinde `progress` seçin.

Yanıtın kendisi ilerleme sinyali olduğunda `partial` seçin.

Daha büyük metin parçaları halinde taslak önizleme güncellemeleri istediğinizde `block` seçin. Discord ve Telegram'da `streaming.mode: "block"` hâlâ önizleme akışıdır, normal blok teslimi değildir. Normal blok yanıtları istediğinizde `streaming.block.enabled` veya eski `blockStreaming` kullanın.

## Etiketleri yapılandırma

İlerleme etiketleri `channels.<channel>.streaming.progress` altında bulunur.

Varsayılan etiket `auto` değeridir; bu, OpenClaw'ın yerleşik üç noktalı tek kelimelik etiket havuzundan seçim yapar:

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

## İlerleme satırlarını kontrol etme

İlerleme satırları ilerleme modunda varsayılan olarak etkindir. Gerçek çalışma olaylarından gelirler: araç başlangıçları, öğe güncellemeleri, görev planları, onaylar, komut çıktısı, yama özetleri ve benzer agent etkinlikleri.

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

`"explain"` varsayılandır ve taslakları `🛠️ Exec: check JS syntax for /tmp/app.js` gibi kısa etiketlerle kararlı tutar. `"raw"`, mevcut olduğunda alttaki komutu/ayrıntıyı ekler; bu hata ayıklarken yararlıdır ancak sohbette daha gürültülüdür.

Örneğin, aynı komut ayrıntı moduna bağlı olarak farklı görünür:

| Mod       | İlerleme satırı                                                     |
| --------- | ------------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                           |
| `raw`     | `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

Görünür kalacak satır sayısını sınırlayın:

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

OpenClaw, yinelenen taslak düzenlemelerinin her güncellemede farklı sarılmaması için uzun ilerleme satırlarını varsayılan olarak kısaltır. Önek okunabilir kalır; yollar veya ham komutlar gibi uzun ayrıntılar üç noktayla kısaltılır.

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

Zengin işleme aynı düz metin geri dönüşünü korur; böylece daha zengin biçimi desteklemeyen kanallar ve istemciler de kompakt ilerleme metnini gösterebilir.

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

`toolProgress: false` ile OpenClaw, o dönüş için eski bağımsız araç ilerleme mesajlarını yine de bastırır. Bir etiket yapılandırılmışsa etiket dışında kanal son yanıta kadar görsel olarak sessiz kalır.

## Kanal davranışı

Her kanal desteklediği en temiz aktarımı kullanır:

| Kanal           | İlerleme aktarımı                       | Notlar                                                                 |
| --------------- | --------------------------------------- | ---------------------------------------------------------------------- |
| Discord         | Bir mesaj gönderir, sonra düzenler.     | Son metin güvenli tek bir önizleme mesajına sığdığında yerinde düzenlenir. |
| Matrix          | Bir olay gönderir, sonra düzenler.      | Hesap düzeyi akış yapılandırması hesap düzeyi taslakları kontrol eder. |
| Microsoft Teams | Kişisel sohbetlerde yerel Teams akışı.  | `streaming.mode: "block"` Teams blok teslimine eşlenir.                |
| Slack           | Yerel akış veya düzenlenebilir taslak gönderisi. | İş parçacığı kullanılabilirliği yerel akışın kullanılıp kullanılamayacağını etkiler. |
| Telegram        | Bir mesaj gönderir, sonra düzenler.     | Eski görünen taslaklar, son zaman damgalarının yararlı kalması için değiştirilebilir. |
| Mattermost      | Düzenlenebilir taslak gönderisi.        | Araç etkinliği aynı taslak tarzı gönderinin içine katlanır.            |

Güvenli düzenleme desteği olmayan kanallar genellikle yazıyor göstergelerine veya yalnızca son teslimata geri döner.

## Sonlandırma

Son yanıt hazır olduğunda OpenClaw sohbeti temiz tutmaya çalışır:

- Taslak güvenli şekilde son yanıta dönüşebiliyorsa OpenClaw onu yerinde düzenler.
- Kanal yerel ilerleme akışını kullanıyorsa, yerel aktarım son metni kabul ettiğinde OpenClaw bu akışı sonlandırır.
- Son yanıtta medya, onay istemi, açık bir yanıt hedefi, çok fazla parça veya başarısız bir düzenleme/gönderme varsa OpenClaw son yanıtı normal kanal teslimat yolu üzerinden gönderir.

Geri dönüş yolu bilinçli bir tercihtir. Metni kaybetmekten, bir yanıtı yanlış iş parçacığına bağlamaktan veya bir taslağı kanalın güvenli şekilde temsil edemeyeceği bir yükle üzerine yazmaktansa yeni bir son yanıt göndermek daha iyidir.

## Sorun giderme

**Yalnızca son yanıtı görüyorum.**

Mesajı işleyen hesap veya kanal için `channels.<channel>.streaming.mode` değerinin `progress` olarak ayarlandığını kontrol edin. Bazı grup veya alıntılı yanıt yolları, kanal doğru mesajı güvenli şekilde düzenleyemediğinde bir dönüş için taslak önizlemelerini devre dışı bırakabilir.

**Etiketi görüyorum ama araç satırlarını görmüyorum.**

`streaming.progress.toolProgress` değerini kontrol edin. `false` ise OpenClaw tek taslak davranışını korur ancak araç ve görev ilerleme satırlarını gizler.

**Düzenlenmiş taslak yerine yeni bir son mesaj görüyorum.**

Bu bir güvenlik geri dönüşüdür. Medya yanıtları, uzun yanıtlar, açık yanıt hedefleri, eski Telegram taslakları, eksik Slack iş parçacığı hedefleri, silinmiş önizleme mesajları veya başarısız yerel akış sonlandırması nedeniyle olabilir.

**Hâlâ bağımsız ilerleme mesajları görüyorum.**

Taslak etkin olduğunda ilerleme modu varsayılan bağımsız araç ilerleme mesajlarını bastırır. Bağımsız mesajlar hâlâ görünüyorsa dönüşün gerçekten ilerleme modunu kullandığını ve `streaming.mode: "off"` ya da bu mesaj için taslak oluşturamayan bir kanal yolu kullanmadığını doğrulayın.

**Teams, Discord veya Telegram'dan farklı davranıyor.**

Microsoft Teams, genel gönder-ve-düzenle önizleme aktarımı yerine kişisel sohbetlerde yerel bir akış kullanır. Teams ayrıca `streaming.mode: "block"` değerini Teams blok teslimi olarak ele alır; çünkü Discord ve Telegram tarafından kullanılan aynı taslak önizleme blok moduna sahip değildir.

## İlgili

- [Akış ve parçalama](/tr/concepts/streaming)
- [Mesajlar](/tr/concepts/messages)
- [Kanal yapılandırması](/tr/gateway/config-channels)
- [Discord](/tr/channels/discord)
- [Matrix](/tr/channels/matrix)
- [Microsoft Teams](/tr/channels/msteams)
- [Slack](/tr/channels/slack)
- [Telegram](/tr/channels/telegram)
