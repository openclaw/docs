---
read_when:
    - WhatsApp/web kanalı davranışı veya gelen kutusu yönlendirmesi üzerinde çalışma
summary: WhatsApp kanal desteği, erişim kontrolleri, teslimat davranışı ve operasyonlar
title: WhatsApp
x-i18n:
    generated_at: "2026-05-03T08:54:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f12709fc8ecb45e1b060647daf9a4624485d52b7b6436c3d07f171e6807babf
    source_path: channels/whatsapp.md
    workflow: 16
---

Durum: WhatsApp Web (Baileys) üzerinden üretime hazır. Gateway bağlı oturum(lar)ın sahibidir.

## Kurulum (isteğe bağlı)

- Onboarding (`openclaw onboard`) ve `openclaw channels add --channel whatsapp`, WhatsApp Plugin'i ilk kez seçtiğinizde yüklemenizi ister.
- `openclaw channels login --channel whatsapp`, Plugin henüz mevcut olmadığında kurulum akışını da sunar.
- Geliştirme kanalı + git checkout: varsayılan olarak yerel Plugin yolunu kullanır.
- Stable/Beta: geçerli resmi yayın etiketindeki npm paketi `@openclaw/whatsapp` kullanılır.

Elle kurulum kullanılabilir kalır:

```bash
openclaw plugins install @openclaw/whatsapp
```

Geçerli resmi yayın etiketini takip etmek için yalın paketi kullanın. Tam bir
sürümü yalnızca tekrarlanabilir bir kurulum gerektiğinde sabitleyin.

<CardGroup cols={3}>
  <Card title="Eşleme" icon="link" href="/tr/channels/pairing">
    Varsayılan DM ilkesi, bilinmeyen gönderenler için eşlemedir.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım playbook'ları.
  </Card>
  <Card title="Gateway yapılandırması" icon="settings" href="/tr/gateway/configuration">
    Tam kanal yapılandırma kalıpları ve örnekleri.
  </Card>
</CardGroup>

## Hızlı kurulum

<Steps>
  <Step title="WhatsApp erişim ilkesini yapılandırın">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="WhatsApp'ı bağlayın (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Belirli bir hesap için:

```bash
openclaw channels login --channel whatsapp --account work
```

    Oturum açmadan önce mevcut/özel bir WhatsApp Web kimlik doğrulama dizinini eklemek için:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Gateway'i başlatın">

```bash
openclaw gateway
```

  </Step>

  <Step title="İlk eşleme isteğini onaylayın (eşleme modu kullanılıyorsa)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Eşleme isteklerinin süresi 1 saat sonra dolar. Bekleyen istekler kanal başına 3 ile sınırlıdır.

  </Step>
</Steps>

<Note>
OpenClaw, mümkün olduğunda WhatsApp'ı ayrı bir numarada çalıştırmayı önerir. (Kanal meta verileri ve kurulum akışı bu kurulum için optimize edilmiştir, ancak kişisel numara kurulumları da desteklenir.)
</Note>

## Dağıtım kalıpları

<AccordionGroup>
  <Accordion title="Ayrılmış numara (önerilir)">
    Bu en temiz operasyonel moddur:

    - OpenClaw için ayrı WhatsApp kimliği
    - daha net DM izin listeleri ve yönlendirme sınırları
    - kendi kendine sohbet karışıklığı olasılığının daha düşük olması

    Minimal ilke kalıbı:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Kişisel numara geri dönüşü">
    Onboarding, kişisel numara modunu destekler ve kendi kendine sohbet dostu bir temel yazar:

    - `dmPolicy: "allowlist"`
    - `allowFrom` kişisel numaranızı içerir
    - `selfChatMode: true`

    Çalışma zamanında, kendi kendine sohbet korumaları bağlı kendi numarasına ve `allowFrom` değerine göre anahtarlanır.

  </Accordion>

  <Accordion title="Yalnızca WhatsApp Web kanal kapsamı">
    Mesajlaşma platformu kanalı, mevcut OpenClaw kanal mimarisinde WhatsApp Web tabanlıdır (`Baileys`).

    Yerleşik sohbet kanalı kayıt defterinde ayrı bir Twilio WhatsApp mesajlaşma kanalı yoktur.

  </Accordion>
</AccordionGroup>

## Çalışma zamanı modeli

- Gateway, WhatsApp soketinin ve yeniden bağlanma döngüsünün sahibidir.
- Yeniden bağlanma izleyicisi yalnızca gelen uygulama mesajı hacmini değil, WhatsApp Web aktarım etkinliğini kullanır; bu nedenle sessiz bir bağlı cihaz oturumu, yakın zamanda kimse mesaj göndermedi diye tek başına yeniden başlatılmaz. Daha uzun bir uygulama sessizliği sınırı, aktarım çerçeveleri gelmeye devam ediyor ancak izleyici penceresi boyunca hiçbir uygulama mesajı işlenmiyorsa yine de yeniden bağlanmayı zorlar; yakın zamanda aktif olan bir oturum için geçici bir yeniden bağlanmadan sonra, bu uygulama sessizliği denetimi ilk kurtarma penceresi için normal mesaj zaman aşımını kullanır.
- Baileys soket zamanlamaları `web.whatsapp.*` altında açıktır: `keepAliveIntervalMs` WhatsApp Web uygulama ping'lerini denetler, `connectTimeoutMs` açılış el sıkışması zaman aşımını denetler ve `defaultQueryTimeoutMs` Baileys sorgu zaman aşımlarını denetler.
- Giden gönderimler, hedef hesap için aktif bir WhatsApp dinleyicisi gerektirir.
- Grup gönderimleri, metin ve medya açıklamalarındaki `@+<digits>` ve `@<digits>` token'ları geçerli WhatsApp katılımcı meta verileriyle eşleştiğinde, LID destekli gruplar dahil olmak üzere yerel bahsetme meta verileri ekler.
- Durum ve yayın sohbetleri yok sayılır (`@status`, `@broadcast`).
- Yeniden bağlanma izleyicisi yalnızca gelen uygulama mesajı hacmini değil, WhatsApp Web aktarım etkinliğini izler: sessiz bağlı cihaz oturumları aktarım çerçeveleri devam ettiği sürece açık kalır, ancak aktarım durması daha sonraki uzak bağlantı kesme yolundan çok önce yeniden bağlanmayı zorlar.
- Doğrudan sohbetler DM oturum kurallarını kullanır (`session.dmScope`; varsayılan `main`, DM'leri aracının ana oturumuna daraltır).
- Grup oturumları yalıtılmıştır (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Kanalları/Bültenleri, yerel `@newsletter` JID ile açık giden hedefler olabilir. Giden bülten gönderimleri, DM oturum semantiği yerine kanal oturumu meta verilerini (`agent:<agentId>:whatsapp:channel:<jid>`) kullanır.
- WhatsApp Web aktarımı, Gateway ana makinesindeki standart proxy ortam değişkenlerine uyar (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / küçük harfli varyantlar). Kanal özelindeki WhatsApp proxy ayarları yerine ana makine düzeyinde proxy yapılandırmasını tercih edin.
- `messages.removeAckAfterReply` etkinleştirildiğinde, görünür bir yanıt teslim edildikten sonra OpenClaw WhatsApp onay tepkisini temizler.

## Plugin hook'ları ve gizlilik

WhatsApp gelen mesajları kişisel mesaj içeriği, telefon numaraları,
grup tanımlayıcıları, gönderen adları ve oturum korelasyon alanları içerebilir.
Bu nedenle WhatsApp, açıkça etkinleştirmediğiniz sürece gelen `message_received`
hook yüklerini Plugin'lere yayınlamaz:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Etkinleştirmeyi tek bir hesapla sınırlayabilirsiniz:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

Bunu yalnızca gelen WhatsApp mesaj içeriğini ve tanımlayıcılarını almasına
güvendiğiniz Plugin'ler için etkinleştirin.

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.whatsapp.dmPolicy` doğrudan sohbet erişimini denetler:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    `allowFrom`, E.164 tarzı numaraları kabul eder (içeride normalleştirilir).

    `allowFrom` bir DM gönderen erişim denetim listesidir. WhatsApp grup JID'lerine veya `@newsletter` kanal JID'lerine açık giden gönderimleri sınırlamaz.

    Çoklu hesap geçersiz kılma: `channels.whatsapp.accounts.<id>.dmPolicy` (ve `allowFrom`), o hesap için kanal düzeyindeki varsayılanlardan önceliklidir.

    Çalışma zamanı davranış ayrıntıları:

    - eşlemeler kanal izin deposunda kalıcı hale getirilir ve yapılandırılmış `allowFrom` ile birleştirilir
    - zamanlanmış otomasyon ve Heartbeat alıcı geri dönüşü açık teslim hedeflerini veya yapılandırılmış `allowFrom` değerini kullanır; DM eşleme onayları örtük cron veya Heartbeat alıcıları değildir
    - izin listesi yapılandırılmamışsa, bağlı kendi numarası varsayılan olarak izinlidir
    - OpenClaw giden `fromMe` DM'leri (bağlı cihazdan kendinize gönderdiğiniz mesajlar) hiçbir zaman otomatik eşlemez

  </Tab>

  <Tab title="Grup ilkesi + izin listeleri">
    Grup erişiminin iki katmanı vardır:

    1. **Grup üyeliği izin listesi** (`channels.whatsapp.groups`)
       - `groups` atlanırsa tüm gruplar uygundur
       - `groups` mevcutsa bir grup izin listesi gibi davranır (`"*"` izinlidir)

    2. **Grup gönderen ilkesi** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: gönderen izin listesi atlanır
       - `allowlist`: gönderen `groupAllowFrom` (veya `*`) ile eşleşmelidir
       - `disabled`: tüm grup gelenlerini engeller

    Gönderen izin listesi geri dönüşü:

    - `groupAllowFrom` ayarlanmamışsa çalışma zamanı, mevcut olduğunda `allowFrom` değerine geri döner
    - gönderen izin listeleri bahsetme/yanıt etkinleştirmesinden önce değerlendirilir

    Not: Hiç `channels.whatsapp` bloğu yoksa, çalışma zamanı grup ilkesi geri dönüşü, `channels.defaults.groupPolicy` ayarlanmış olsa bile `allowlist` olur (bir uyarı günlüğüyle).

  </Tab>

  <Tab title="Bahsetmeler + /activation">
    Grup yanıtları varsayılan olarak bahsetme gerektirir.

    Bahsetme algılama şunları içerir:

    - bot kimliğinden açık WhatsApp bahsetmeleri
    - yapılandırılmış bahsetme regex kalıpları (`agents.list[].groupChat.mentionPatterns`, geri dönüş `messages.groupChat.mentionPatterns`)
    - yetkili grup mesajları için gelen sesli not dökümleri
    - örtük bota yanıt algılama (yanıt gönderen bot kimliğiyle eşleşir)

    Güvenlik notu:

    - alıntı/yanıt yalnızca bahsetme kapısını karşılar; gönderen yetkilendirmesi **vermez**
    - `groupPolicy: "allowlist"` ile, izin listesinde olmayan gönderenler, izin listesindeki bir kullanıcının mesajına yanıt verseler bile yine de engellenir

    Oturum düzeyi etkinleştirme komutu:

    - `/activation mention`
    - `/activation always`

    `activation`, oturum durumunu günceller (genel yapılandırmayı değil). Sahip kapılıdır.

  </Tab>
</Tabs>

## Kişisel numara ve kendi kendine sohbet davranışı

Bağlı kendi numarası `allowFrom` içinde de mevcut olduğunda, WhatsApp kendi kendine sohbet korumaları etkinleşir:

- kendi kendine sohbet turları için okundu bilgilerini atla
- aksi halde kendinize ping atacak bahsetme-JID otomatik tetikleme davranışını yok say
- `messages.responsePrefix` ayarlanmamışsa, kendi kendine sohbet yanıtları varsayılan olarak `[{identity.name}]` veya `[openclaw]` olur

## Mesaj normalleştirme ve bağlam

<AccordionGroup>
  <Accordion title="Gelen zarf + yanıt bağlamı">
    Gelen WhatsApp mesajları paylaşılan gelen zarfın içine sarılır.

    Alıntılanmış bir yanıt varsa, bağlam şu biçimde eklenir:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Yanıt meta veri alanları da mevcut olduğunda doldurulur (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, gönderen JID/E.164).
    Alıntılanmış yanıt hedefi indirilebilir medya olduğunda OpenClaw bunu
    normal gelen medya deposu üzerinden kaydeder ve `MediaPath`/`MediaType`
    olarak sunar; böylece aracı yalnızca `<media:image>` görmek yerine
    başvurulan görüntüyü inceleyebilir.

  </Accordion>

  <Accordion title="Medya yer tutucuları ve konum/kişi çıkarımı">
    Yalnızca medya içeren gelen mesajlar şu tür yer tutucularla normalleştirilir:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Yetkili grup sesli notları, gövde yalnızca `<media:audio>` olduğunda
    bahsetme kapısından önce yazıya dökülür; böylece sesli notta bot
    bahsetmesini söylemek yanıtı tetikleyebilir. Döküm yine de bottan
    bahsetmiyorsa, ham yer tutucu yerine bekleyen grup geçmişinde tutulur.

    Konum gövdeleri kısa koordinat metni kullanır. Konum etiketleri/yorumları ve kişi/vCard ayrıntıları, satır içi istem metni olarak değil, fenced güvenilmeyen meta veriler olarak işlenir.

  </Accordion>

  <Accordion title="Bekleyen grup geçmişi enjeksiyonu">
    Gruplar için işlenmemiş mesajlar ara belleğe alınabilir ve bot sonunda tetiklendiğinde bağlam olarak enjekte edilebilir.

    - varsayılan sınır: `50`
    - yapılandırma: `channels.whatsapp.historyLimit`
    - geri dönüş: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    Enjeksiyon işaretleyicileri:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Okundu bilgileri">
    Okundu bilgileri, kabul edilen gelen WhatsApp mesajları için varsayılan olarak etkindir.

    Genel olarak devre dışı bırakın:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Hesap bazında geçersiz kılma:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Kendinle sohbet turları, genel olarak etkin olsa bile okundu bilgilerini atlar.

  </Accordion>
</AccordionGroup>

## Teslim, parçalama ve medya

<AccordionGroup>
  <Accordion title="Metin parçalama">
    - varsayılan parça sınırı: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` modu paragraf sınırlarını (boş satırlar) tercih eder, ardından uzunluk açısından güvenli parçalamaya geri döner

  </Accordion>

  <Accordion title="Giden medya davranışı">
    - görüntü, video, ses (PTT sesli not) ve belge yüklerini destekler
    - ses medyası Baileys `audio` yükü üzerinden `ptt: true` ile gönderilir, böylece WhatsApp istemcileri bunu bas-konuş sesli not olarak işler
    - yanıt yükleri `audioAsVoice` değerini korur; WhatsApp için TTS sesli not çıktısı, sağlayıcı MP3 veya WebM döndürse bile bu PTT yolunda kalır
    - yerel Ogg/Opus ses, sesli not uyumluluğu için `audio/ogg; codecs=opus` olarak gönderilir
    - Microsoft Edge TTS MP3/WebM çıktısı dahil Ogg olmayan ses, PTT tesliminden önce `ffmpeg` ile 48 kHz mono Ogg/Opus biçimine dönüştürülür
    - `/tts latest`, en son asistan yanıtını tek bir sesli not olarak gönderir ve aynı yanıt için tekrar gönderimleri bastırır; `/tts chat on|off|default` mevcut WhatsApp sohbeti için otomatik TTS'yi kontrol eder
    - animasyonlu GIF oynatma, video gönderimlerinde `gifPlayback: true` ile desteklenir
    - çoklu medya yanıt yükleri gönderilirken altyazılar ilk medya öğesine uygulanır; ancak PTT sesli notlarda ses önce, görünür metin ayrı gönderilir çünkü WhatsApp istemcileri sesli not altyazılarını tutarlı şekilde işlemez
    - medya kaynağı HTTP(S), `file://` veya yerel yollar olabilir

  </Accordion>

  <Accordion title="Medya boyutu sınırları ve geri dönüş davranışı">
    - gelen medya kaydetme üst sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - giden medya gönderme üst sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - hesap bazında geçersiz kılmalar `channels.whatsapp.accounts.<accountId>.mediaMaxMb` kullanır
    - görüntüler sınırlara sığacak şekilde otomatik optimize edilir (yeniden boyutlandırma/kalite taraması)
    - medya gönderimi başarısız olduğunda, ilk öğe geri dönüşü yanıtı sessizce düşürmek yerine metin uyarısı gönderir

  </Accordion>
</AccordionGroup>

## Yanıt alıntılama

WhatsApp, giden yanıtların gelen mesajı görünür şekilde alıntıladığı yerel yanıt alıntılamayı destekler. Bunu `channels.whatsapp.replyToMode` ile kontrol edin.

| Değer       | Davranış                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Hiç alıntılama; düz mesaj olarak gönder                               |
| `"first"`   | Yalnızca ilk giden yanıt parçasını alıntıla                           |
| `"all"`     | Her giden yanıt parçasını alıntıla                                    |
| `"batched"` | Hemen gönderilen yanıtları alıntılamadan bırakırken kuyruktaki toplu yanıtları alıntıla |

Varsayılan `"off"` değeridir. Hesap bazında geçersiz kılmalar `channels.whatsapp.accounts.<id>.replyToMode` kullanır.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Reaksiyon düzeyi

`channels.whatsapp.reactionLevel`, ajanın WhatsApp üzerinde emoji reaksiyonlarını ne kadar geniş kullanacağını kontrol eder:

| Düzey         | Onay reaksiyonları | Ajan tarafından başlatılan reaksiyonlar | Açıklama                                      |
| ------------- | ------------------ | --------------------------------------- | -------------------------------------------- |
| `"off"`       | Hayır              | Hayır                                   | Hiç reaksiyon yok                            |
| `"ack"`       | Evet               | Hayır                                   | Yalnızca onay reaksiyonları (yanıt öncesi alındı bilgisi) |
| `"minimal"`   | Evet               | Evet (temkinli)                         | Onay + temkinli yönlendirmeyle ajan reaksiyonları |
| `"extensive"` | Evet               | Evet (teşvik edilir)                    | Onay + teşvik edilen yönlendirmeyle ajan reaksiyonları |

Varsayılan: `"minimal"`.

Hesap bazında geçersiz kılmalar `channels.whatsapp.accounts.<id>.reactionLevel` kullanır.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Onay reaksiyonları

WhatsApp, `channels.whatsapp.ackReaction` aracılığıyla gelen alındı bilgisinde anında onay reaksiyonlarını destekler.
Onay reaksiyonları `reactionLevel` ile sınırlandırılır; `reactionLevel` `"off"` olduğunda bastırılır.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Davranış notları:

- gelen kabul edildikten hemen sonra gönderilir (yanıt öncesi)
- hatalar günlüğe kaydedilir ancak normal yanıt teslimini engellemez
- grup modu `mentions`, bahsetmeyle tetiklenen turlarda reaksiyon verir; grup etkinleştirme `always`, bu kontrol için baypas görevi görür
- WhatsApp `channels.whatsapp.ackReaction` kullanır (eski `messages.ackReaction` burada kullanılmaz)

## Çoklu hesap ve kimlik bilgileri

<AccordionGroup>
  <Accordion title="Hesap seçimi ve varsayılanlar">
    - hesap kimlikleri `channels.whatsapp.accounts` içinden gelir
    - varsayılan hesap seçimi: varsa `default`, yoksa yapılandırılmış ilk hesap kimliği (sıralanmış)
    - hesap kimlikleri arama için dahili olarak normalleştirilir

  </Accordion>

  <Accordion title="Kimlik bilgisi yolları ve eski uyumluluk">
    - mevcut kimlik doğrulama yolu: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - yedek dosya: `creds.json.bak`
    - `~/.openclaw/credentials/` içindeki eski varsayılan kimlik doğrulama, varsayılan hesap akışları için hâlâ tanınır/taşınır

  </Accordion>

  <Accordion title="Çıkış davranışı">
    `openclaw channels logout --channel whatsapp [--account <id>]`, o hesabın WhatsApp kimlik doğrulama durumunu temizler.

    Bir Gateway erişilebilir olduğunda, çıkış önce seçilen hesap için canlı WhatsApp dinleyicisini durdurur; böylece bağlı oturum bir sonraki yeniden başlatmaya kadar mesaj almaya devam etmez. `openclaw channels remove --channel whatsapp` da hesap yapılandırmasını devre dışı bırakmadan veya silmeden önce canlı dinleyiciyi durdurur.

    Eski kimlik doğrulama dizinlerinde, Baileys kimlik doğrulama dosyaları kaldırılırken `oauth.json` korunur.

  </Accordion>
</AccordionGroup>

## Araçlar, eylemler ve yapılandırma yazımları

- Ajan araç desteği WhatsApp reaksiyon eylemini (`react`) içerir.
- Eylem kapıları:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Kanal tarafından başlatılan yapılandırma yazımları varsayılan olarak etkindir (`channels.whatsapp.configWrites=false` ile devre dışı bırakın).

## Sorun giderme

<AccordionGroup>
  <Accordion title="Bağlı değil (QR gerekli)">
    Belirti: kanal durumu bağlı olmadığını bildirir.

    Düzeltme:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Bağlı ama bağlantı kesildi / yeniden bağlanma döngüsü">
    Belirti: tekrarlanan bağlantı kesilmeleri veya yeniden bağlanma girişimleri olan bağlı hesap.

    Sessiz hesaplar normal mesaj zaman aşımından sonra da bağlı kalabilir; watchdog,
    WhatsApp Web taşıma etkinliği durduğunda, soket kapandığında veya
    uygulama düzeyi etkinlik daha uzun güvenlik penceresinin ötesinde sessiz kaldığında yeniden başlatır.

    Günlükler tekrarlanan `status=408 Request Time-out Connection was lost` gösteriyorsa,
    `web.whatsapp` altındaki Baileys soket zamanlamalarını ayarlayın. Ağınızın boşta kalma zaman aşımının altına
    `keepAliveIntervalMs` değerini kısaltarak ve yavaş ya da kayıplı bağlantılarda
    `connectTimeoutMs` değerini artırarak başlayın:

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    Düzeltme:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    `~/.openclaw/logs/whatsapp-health.log`, `Gateway inactive` diyorsa ancak
    `openclaw gateway status` ve `openclaw channels status --probe`
    Gateway ile WhatsApp'ın sağlıklı olduğunu gösteriyorsa, `openclaw doctor` çalıştırın. Linux'ta doctor,
    hâlâ `~/.openclaw/bin/ensure-whatsapp.sh` çağıran eski crontab girdileri konusunda uyarır;
    bu eski girdileri `crontab -e` ile kaldırın çünkü cron systemd kullanıcı veri yolu ortamından yoksun olabilir ve
    eski betiğin gateway sağlığını yanlış bildirmesine neden olabilir.

    Gerekirse, `channels login` ile yeniden bağlayın.

  </Accordion>

  <Accordion title="QR oturum açma bir proxy arkasında zaman aşımına uğruyor">
    Belirti: `openclaw channels login --channel whatsapp`, kullanılabilir bir QR kodu göstermeden önce `status=408 Request Time-out` veya TLS soket bağlantı kesilmesiyle başarısız olur.

    WhatsApp Web oturum açması, Gateway konağının standart proxy ortamını (`HTTPS_PROXY`, `HTTP_PROXY`, küçük harfli varyantlar ve `NO_PROXY`) kullanır. Gateway işleminin proxy ortamını devraldığını ve `NO_PROXY` değerinin `mmg.whatsapp.net` ile eşleşmediğini doğrulayın.

  </Accordion>

  <Accordion title="Gönderirken etkin dinleyici yok">
    Hedef hesap için etkin bir Gateway dinleyicisi yoksa giden gönderimler hızlı şekilde başarısız olur.

    Gateway'in çalıştığından ve hesabın bağlı olduğundan emin olun.

  </Accordion>

  <Accordion title="Yanıt transkriptte görünüyor ama WhatsApp'ta görünmüyor">
    Transkript satırları ajanın ürettiği şeyi kaydeder. WhatsApp teslimi ayrı kontrol edilir: OpenClaw, otomatik yanıtı yalnızca Baileys en az bir görünür metin veya medya gönderimi için giden mesaj kimliği döndürdükten sonra gönderilmiş sayar.

    Onay reaksiyonları bağımsız yanıt öncesi alındı bilgileridir. Başarılı bir reaksiyon, sonraki metin veya medya yanıtının WhatsApp tarafından kabul edildiğini kanıtlamaz.

    Gateway günlüklerinde `auto-reply delivery failed` veya `auto-reply was not accepted by WhatsApp provider` arayın.

  </Accordion>

  <Accordion title="Grup mesajları beklenmedik şekilde yok sayılıyor">
    Şu sırayla kontrol edin:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` izin listesi girdileri
    - bahsetme kapısı (`requireMention` + bahsetme kalıpları)
    - `openclaw.json` (JSON5) içinde yinelenen anahtarlar: sonraki girdiler öncekileri geçersiz kılar, bu nedenle kapsam başına tek bir `groupPolicy` tutun

  </Accordion>

  <Accordion title="Bun çalışma zamanı uyarısı">
    WhatsApp Gateway çalışma zamanı Node kullanmalıdır. Bun, kararlı WhatsApp/Telegram Gateway çalışması için uyumsuz olarak işaretlenir.
  </Accordion>
</AccordionGroup>

## Sistem istemleri

WhatsApp, `groups` ve `direct` haritaları aracılığıyla gruplar ve doğrudan sohbetler için Telegram tarzı sistem istemlerini destekler.

Grup mesajları için çözümleme hiyerarşisi:

Etkin `groups` haritası önce belirlenir: hesap kendi `groups` değerini tanımlıyorsa, kök `groups` haritasını tamamen değiştirir (derin birleştirme yoktur). Ardından istem araması ortaya çıkan tek harita üzerinde çalışır:

1. **Gruba özgü sistem istemi** (`groups["<groupId>"].systemPrompt`): belirli grup girdisi haritada mevcut olduğunda **ve** `systemPrompt` anahtarı tanımlı olduğunda kullanılır. `systemPrompt` boş bir dizeyse (`""`), joker bastırılır ve sistem istemi uygulanmaz.
2. **Grup joker sistem istemi** (`groups["*"].systemPrompt`): belirli grup girdisi haritada tamamen yoksa veya mevcut olup `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

Doğrudan mesajlar için çözümleme hiyerarşisi:

Etkin `direct` haritası önce belirlenir: hesap kendi `direct` değerini tanımlıyorsa, kök `direct` haritasını tamamen değiştirir (derin birleştirme yoktur). Ardından istem araması ortaya çıkan tek harita üzerinde çalışır:

1. **Doğrudan kişiye özgü sistem istemi** (`direct["<peerId>"].systemPrompt`): belirli eş girdisi haritada mevcut olduğunda **ve** `systemPrompt` anahtarı tanımlı olduğunda kullanılır. `systemPrompt` boş bir dizeyse (`""`), joker bastırılır ve sistem istemi uygulanmaz.
2. **Doğrudan joker sistem istemi** (`direct["*"].systemPrompt`): belirli eş girdisi haritada tamamen yoksa veya mevcut olup `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

<Note>
`dms`, DM başına hafif geçmiş geçersiz kılma kovası olarak kalır (`dms.<id>.historyLimit`). İstem geçersiz kılmaları `direct` altında bulunur.
</Note>

**Telegram çok hesaplı davranışından farkı:** Telegram’da kök `groups`, bir botun ait olmadığı gruplardan grup mesajları almasını önlemek için çok hesaplı bir kurulumdaki tüm hesaplar için kasıtlı olarak bastırılır; buna kendi `groups` değerini tanımlamayan hesaplar da dahildir. WhatsApp bu korumayı uygulamaz: yapılandırılmış hesap sayısı kaç olursa olsun, hesap düzeyinde geçersiz kılma tanımlamayan hesaplar kök `groups` ve kök `direct` değerlerini her zaman devralır. Çok hesaplı bir WhatsApp kurulumunda hesap başına grup veya doğrudan sohbet istemleri istiyorsanız, kök düzeyi varsayılanlara güvenmek yerine tam eşlemeyi her hesabın altında açıkça tanımlayın.

Önemli davranış:

- `channels.whatsapp.groups` hem grup başına yapılandırma eşlemesi hem de sohbet düzeyinde grup izin listesidir. Kök veya hesap kapsamının herhangi birinde `groups["*"]`, o kapsam için "tüm gruplar kabul edilir" anlamına gelir.
- Yalnızca o kapsamın tüm grupları kabul etmesini zaten istiyorsanız joker grup `systemPrompt` ekleyin. Yine de yalnızca sabit bir grup ID kümesinin uygun olmasını istiyorsanız, istem varsayılanı için `groups["*"]` kullanmayın. Bunun yerine istemi açıkça izin listesine alınmış her grup girdisinde tekrarlayın.
- Grup kabulü ve gönderen yetkilendirmesi ayrı denetimlerdir. `groups["*"]`, grup işleme ulaşabilecek grup kümesini genişletir, ancak tek başına bu gruplardaki her göndereni yetkilendirmez. Gönderen erişimi yine `channels.whatsapp.groupPolicy` ve `channels.whatsapp.groupAllowFrom` tarafından ayrı olarak denetlenir.
- `channels.whatsapp.direct`, DM'ler için aynı yan etkiye sahip değildir. `direct["*"]`, yalnızca bir DM `dmPolicy` ile birlikte `allowFrom` veya eşleme deposu kuralları tarafından zaten kabul edildikten sonra varsayılan bir doğrudan sohbet yapılandırması sağlar.

Örnek:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Yapılandırma referansı işaretçileri

Birincil referans:

- [Yapılandırma referansı - WhatsApp](/tr/gateway/config-channels#whatsapp)

Yüksek sinyal değerli WhatsApp alanları:

- erişim: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- teslim: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- çok hesaplı: `accounts.<id>.enabled`, `accounts.<id>.authDir`, hesap düzeyinde geçersiz kılmalar
- işlemler: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- oturum davranışı: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- istemler: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## İlgili

- [Eşleme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Güvenlik](/tr/gateway/security)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Çok aracılı yönlendirme](/tr/concepts/multi-agent)
- [Sorun giderme](/tr/channels/troubleshooting)
