---
read_when:
    - Uzun süren sohbet dönüşleri için görünür ilerleme güncellemelerini yapılandırma
    - Kısmi, blok ve ilerleme akışı modları arasında seçim yapma
    - Çalışma sürerken OpenClaw'ın bir kanal mesajını nasıl güncellediğini açıklama
    - İlerleme taslakları, bağımsız ilerleme iletileri veya sonlandırma geri dönüşü sorunlarını giderme
summary: 'İlerleme taslakları: bir agent çalışırken güncellenen, görünür tek bir devam eden çalışma mesajı'
title: İlerleme taslakları
x-i18n:
    generated_at: "2026-06-28T00:30:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7cc005ed39c2a4a6d887748c769c9d2bb9c133aeeda87b2c11bfe5360f364fdd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

İlerleme taslakları, uzun süren agent dönüşlerini, konuşmayı geçici durum
yanıtları yığınına çevirmeden sohbette canlı hissettirir.

İlerleme taslakları etkinleştirildiğinde OpenClaw, ancak dönüş gerçek iş
yaptığını kanıtladıktan sonra görünür tek bir devam eden çalışma mesajı
oluşturur; agent okurken, plan yaparken, araçları çağırırken veya onay beklerken
bunu günceller ve kanal bunu güvenle yapabiliyorsa bu taslağı final yanıta
dönüştürür.

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

Araç yoğun iş sırasında tek bir düzenli durum mesajı ve dönüş tamamlandığında
final yanıt istediğinizde ilerleme taslaklarını kullanın.

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

Bu genellikle yeterlidir. OpenClaw otomatik tek kelimelik bir etiket seçer, iş
en az beş saniye sürünceye veya ikinci bir iş olayı yayınlayıncaya kadar bekler,
yararlı iş gerçekleşirken kompakt ilerleme satırları ekler ve o dönüş için
yinelenen bağımsız ilerleme konuşmalarını bastırır.

## Kullanıcıların gördükleri

Bir ilerleme taslağının iki parçası vardır:

| Parça             | Amaç                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------- |
| Etiket            | `Working` veya `Shelling` gibi kısa bir başlangıç/durum satırı.                       |
| İlerleme satırları | Ayrıntılı çıktıyla aynı araç simgelerini ve ayrıntı biçimlendiricisini kullanan kompakt çalıştırma güncellemeleri. |

Etiket, agent anlamlı işe başladıktan ve beş saniye meşgul kaldıktan ya da ikinci
bir iş olayı yayınladıktan sonra görünür. Dönen ilerleme satırı listesinin bir
parçasıdır, bu yüzden yeterince somut iş göründüğünde başlangıç durumu yukarı
kayarak görünümden çıkar.
Yalnızca düz metin yanıtları ilerleme taslağı göstermez. İlerleme satırları
yalnızca agent yararlı iş güncellemeleri yayınladığında eklenir; örneğin
`🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"` veya
`✍️ Write: to /tmp/file`.
Varsayılan olarak `/verbose` ile aynı kompakt açıklama modunu kullanırlar;
hata ayıklarken ham komutların/ayrıntıların da eklenmesini istiyorsanız
`agents.defaults.toolProgressDetail: "raw"` ayarlayın.
Mümkün olduğunda final yanıt taslağın yerini alır; aksi halde OpenClaw final
yanıtı normal şekilde gönderir ve kanalın aktarımına göre taslağı temizler veya
güncellemeyi durdurur.

## Mod seçme

`channels.<channel>.streaming.mode`, görünür devam eden çalışma davranışını
kontrol eder:

| Mod        | En uygun kullanım                 | Sohbette görünenler                                |
| ---------- | --------------------------------- | -------------------------------------------------- |
| `off`      | Sessiz kanallar                   | Yalnızca final yanıt.                              |
| `partial`  | Yanıt metninin görünmesini izleme | En son yanıt metniyle düzenlenen tek taslak.       |
| `block`    | Daha büyük yanıt önizleme parçaları | Daha büyük parçalar halinde güncellenen veya eklenen tek önizleme. |
| `progress` | Araç yoğun veya uzun süren dönüşler | Tek durum taslağı, ardından final yanıt.           |

Kullanıcılar yanıt metninin token token akmasını izlemekten çok "ne oluyor"u
önemsiyorsa `progress` seçin.

Yanıtın kendisi ilerleme sinyaliyse `partial` seçin.

Daha büyük metin parçaları halinde taslak önizleme güncellemeleri istiyorsanız
`block` seçin. Discord ve Telegram'da `streaming.mode: "block"` hâlâ önizleme
akışıdır, normal blok teslimi değildir. Normal blok yanıtları istediğinizde
`streaming.block.enabled` veya eski `blockStreaming` kullanın.

## Etiketleri yapılandırma

İlerleme etiketleri `channels.<channel>.streaming.progress` altında bulunur.

Varsayılan etiket `auto` değeridir; bu, OpenClaw'ın yerleşik tek kelimelik etiket
havuzundan seçim yapar:

```text
Working
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

## İlerleme satırlarını kontrol etme

İlerleme satırları ilerleme modunda varsayılan olarak etkindir. Gerçek çalıştırma
olaylarından gelirler: araç başlangıçları, öğe güncellemeleri, görev planları,
onaylar, komut çıktısı, yama özetleri ve benzer agent etkinlikleri.

Araçlar, tek bir araç çağrısı hâlâ çalışırken de türlendirilmiş ilerleme
yayınlayabilir. Yavaş bir getirme veya aramanın, araç final sonucunu döndürmeden
önce görünür taslağı güncelleyebilmesi böyle sağlanır. İlerleme güncellemesi,
boş model içeriği ve açık genel kanal metaverileri içeren kısmi bir araç
sonucudur:

```json
{
  "content": [],
  "progress": {
    "text": "Fetching page content...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw kanal ilerleme kullanıcı arayüzünde yalnızca `progress.text` değerini
gösterir. Normal araç sonucu daha sonra `content` ve `details` olarak gelir ve
modele döndürülen tek parça odur.

Bir araca ilerleme eklerken kısa, genel bir mesaj kullanın ve bunu, işlem yararlı
olacak kadar uzun süre beklemede kaldıktan sonra geciktirin:

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Fetching page content...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

Bu kalıp, hızlı çağrıların ilerleme satırı göstermemesi, uzun çağrıların hâlâ
beklemedeyken bir satır göstermesi ve iptal edilen çağrıların eski ilerleme
görünmeden önce zamanlayıcıyı temizlemesi anlamına gelir. İlerleme metni herkese
açık bir kullanıcı arayüzü yan kanalıdır; bu yüzden gizli bilgiler, ham
argümanlar, getirilen içerik, komut çıktısı veya sayfa metni içermemelidir.

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

`"explain"` varsayılandır ve taslakları
`🛠️ check JS syntax for /tmp/app.js` gibi özlü etiketlerle kararlı tutar.
`"raw"` mevcut olduğunda alttaki komutu/ayrıntıyı ekler; bu hata ayıklarken
yararlıdır ancak sohbette daha gürültülüdür.

Örneğin aynı komut, ayrıntı moduna bağlı olarak farklı görünür:

| Mod       | İlerleme satırı                                                |
| --------- | -------------------------------------------------------------- |
| `explain` | `🛠️ check JS syntax for /tmp/app.js`                           |
| `raw`     | `🛠️ check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

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

OpenClaw, yinelenen taslak düzenlemelerinin her güncellemede farklı sarılmaması
için uzun ilerleme satırlarını varsayılan olarak kısaltır. Varsayılan satır başı
bütçe 120 karakterdir. Düzyazı bir kelime sınırında kesilir; yollar veya ham
komutlar gibi uzun ayrıntılar ise sonek görünür kalacak şekilde ortadan üç nokta
ile kısaltılır.

Satır başı bütçeyi ayarlayın:

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

Slack, ilerleme satırlarını tek bir metin gövdesi yerine yapılandırılmış Block
Kit alanları olarak gösterebilir:

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

Zengin gösterim aynı düz metin yedeğini korur; böylece daha zengin biçimi
desteklemeyen kanallar ve istemciler yine de kompakt ilerleme metnini
gösterebilir.

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

`toolProgress: false` ile OpenClaw, o dönüş için eski bağımsız araç ilerleme
mesajlarını yine de bastırır. Bir etiket yapılandırılmışsa etiket dışında kanal,
final yanıta kadar görsel olarak sessiz kalır.

## Kanal davranışı

Her kanal desteklediği en temiz aktarımı kullanır:

| Kanal           | İlerleme aktarımı                      | Notlar                                                                |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Bir mesaj gönderir, sonra düzenler.    | Final metin tek güvenli önizleme mesajına sığdığında yerinde düzenlenir. |
| Matrix          | Bir olay gönderir, sonra düzenler.     | Hesap düzeyi akış yapılandırması hesap düzeyi taslakları kontrol eder. |
| Microsoft Teams | Kişisel sohbetlerde yerel Teams akışı. | `streaming.mode: "block"` Teams blok teslimiyle eşleşir.              |
| Slack           | Yerel akış veya düzenlenebilir taslak gönderisi. | İş parçacığı kullanılabilirliği, yerel akışın kullanılıp kullanılamayacağını etkiler. |
| Telegram        | Bir mesaj gönderir, sonra düzenler.    | Eski görünür taslaklar, final zaman damgaları yararlı kalsın diye değiştirilebilir. |
| Mattermost      | Düzenlenebilir taslak gönderisi.       | Araç etkinliği aynı taslak tarzı gönderiye katlanır.                  |

Güvenli düzenleme desteği olmayan kanallar genellikle yazıyor göstergelerine
veya yalnızca final teslimine geri döner.

## Sonlandırma

Final yanıt hazır olduğunda OpenClaw sohbeti temiz tutmaya çalışır:

- Taslak güvenli şekilde final yanıta dönüşebiliyorsa OpenClaw onu yerinde
  düzenler.
- Kanal yerel ilerleme akışı kullanıyorsa OpenClaw, yerel aktarım final metni
  kabul ettiğinde o akışı sonlandırır.
- Final yanıtta medya, bir onay istemi, açık bir yanıt hedefi, çok fazla parça
  veya başarısız bir düzenleme/gönderme varsa OpenClaw final yanıtı normal kanal
  teslim yolu üzerinden gönderir.

Yedek yol bilinçlidir. Metni kaybetmekten, bir yanıtı yanlış iş parçacığına
bağlamaktan veya bir taslağın kanalın güvenle temsil edemeyeceği bir yükle
üzerine yazılmasındansa yeni bir final yanıt göndermek daha iyidir.

## Sorun giderme

**Yalnızca final yanıtı görüyorum.**

Mesajı işleyen hesap veya kanal için `channels.<channel>.streaming.mode`
değerinin `progress` olarak ayarlandığını kontrol edin. Bazı grup veya alıntı
yanıt yolları, kanal doğru mesajı güvenle düzenleyemediğinde bir dönüş için
taslak önizlemelerini devre dışı bırakabilir.

**Etiketi görüyorum ama araç satırlarını görmüyorum.**

`streaming.progress.toolProgress` değerini kontrol edin. `false` ise OpenClaw
tek taslak davranışını korur ancak araç ve görev ilerleme satırlarını gizler.

**Düzenlenmiş taslak yerine yeni bir final mesaj görüyorum.**

Bu bir güvenlik yedeğidir. Medya yanıtları, uzun yanıtlar, açık yanıt hedefleri,
eski Telegram taslakları, eksik Slack iş parçacığı hedefleri, silinmiş önizleme
mesajları veya başarısız yerel akış sonlandırması nedeniyle gerçekleşebilir.

**Hâlâ bağımsız ilerleme mesajları görüyorum.**

İlerleme modu, bir taslak etkinken varsayılan bağımsız araç ilerleme mesajlarını
bastırır. Bağımsız mesajlar hâlâ görünüyorsa dönüşün gerçekten ilerleme modunu
kullandığını ve `streaming.mode: "off"` ya da o mesaj için taslak oluşturamayan
bir kanal yolu olmadığını doğrulayın.

**Teams, Discord veya Telegram'dan farklı davranıyor.**

Microsoft Teams, kişisel sohbetlerde genel gönder-ve-düzenle önizleme taşıması yerine yerel bir akış kullanır. Teams ayrıca `streaming.mode: "block"` değerini Teams blok teslimi olarak ele alır çünkü Discord ve Telegram tarafından kullanılan aynı taslak önizleme blok moduna sahip değildir.

## İlgili

- [Akış ve parçalama](/tr/concepts/streaming)
- [Mesajlar](/tr/concepts/messages)
- [Kanal yapılandırması](/tr/gateway/config-channels)
- [Discord](/tr/channels/discord)
- [Matrix](/tr/channels/matrix)
- [Microsoft Teams](/tr/channels/msteams)
- [Slack](/tr/channels/slack)
- [Telegram](/tr/channels/telegram)
