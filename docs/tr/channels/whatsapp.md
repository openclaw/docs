---
read_when:
    - WhatsApp/web kanal davranışı veya gelen kutusu yönlendirmesi üzerinde çalışma
summary: WhatsApp kanal desteği, erişim denetimleri, teslimat davranışı ve operasyonlar
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T20:41:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb8afa93f0470e0454cf59e19193d8c2f204db63b428a4de579e93f01bf3ee62
    source_path: channels/whatsapp.md
    workflow: 16
---

Durum: WhatsApp Web (Baileys) üzerinden üretime hazır. Gateway bağlı oturum(lar)a sahiptir.

## Kurulum (isteğe bağlı)

- İlk kez seçtiğinizde onboarding (`openclaw onboard`) ve `openclaw channels add --channel whatsapp`
  WhatsApp Plugin'ini kurmanız için istem gösterir.
- `openclaw channels login --channel whatsapp`, Plugin henüz mevcut değilse kurulum akışını da sunar.
- Geliştirme kanalı + git checkout: varsayılan olarak yerel Plugin yolunu kullanır.
- Stable/Beta: güncel bir paket yayımlandığında npm paketi `@openclaw/whatsapp` kullanılır.

Manuel kurulum kullanılabilir kalır:

```bash
openclaw plugins install @openclaw/whatsapp
```

npm, OpenClaw sahipli paket için kullanım dışı veya eksik raporu verirse, npm paket hattı yetişene kadar güncel paketlenmiş bir OpenClaw derlemesi ya da yerel checkout kullanın.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bilinmeyen gönderenler için varsayılan DM ilkesi eşleştirmedir.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım çalışma kitapları.
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

    Oturum açmadan önce mevcut/özel bir WhatsApp Web kimlik doğrulama dizini eklemek için:

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

  <Step title="İlk eşleştirme isteğini onaylayın (eşleştirme modunu kullanıyorsanız)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Eşleştirme isteklerinin süresi 1 saat sonra dolar. Bekleyen istekler kanal başına 3 ile sınırlıdır.

  </Step>
</Steps>

<Note>
OpenClaw, mümkün olduğunda WhatsApp'ı ayrı bir numarada çalıştırmanızı önerir. (Kanal meta verileri ve kurulum akışı bu kurulum için optimize edilmiştir, ancak kişisel numara kurulumları da desteklenir.)
</Note>

## Dağıtım kalıpları

<AccordionGroup>
  <Accordion title="Ayrılmış numara (önerilir)">
    Bu, operasyonel açıdan en temiz moddur:

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

  <Accordion title="Kişisel numara yedeği">
    Onboarding kişisel numara modunu destekler ve kendi kendine sohbete uygun bir temel yazar:

    - `dmPolicy: "allowlist"`
    - `allowFrom` kişisel numaranızı içerir
    - `selfChatMode: true`

    Çalışma zamanında kendi kendine sohbet korumaları, bağlı kendi numarasını ve `allowFrom` değerini temel alır.

  </Accordion>

  <Accordion title="Yalnızca WhatsApp Web kanal kapsamı">
    Mesajlaşma platformu kanalı, mevcut OpenClaw kanal mimarisinde WhatsApp Web tabanlıdır (`Baileys`).

    Yerleşik sohbet kanalı kayıt defterinde ayrı bir Twilio WhatsApp mesajlaşma kanalı yoktur.

  </Accordion>
</AccordionGroup>

## Çalışma zamanı modeli

- Gateway, WhatsApp soketine ve yeniden bağlanma döngüsüne sahiptir.
- Yeniden bağlanma izleyicisi yalnızca gelen uygulama mesajı hacmini değil, WhatsApp Web aktarım etkinliğini kullanır; bu nedenle sessiz bir bağlı cihaz oturumu, yalnızca yakın zamanda kimse mesaj göndermedi diye yeniden başlatılmaz. Daha uzun bir uygulama sessizliği üst sınırı, aktarım çerçeveleri gelmeye devam etse ancak izleyici penceresi boyunca hiçbir uygulama mesajı işlenmese de yine yeniden bağlanmayı zorlar; yakın zamanda etkin bir oturum için geçici bir yeniden bağlanmadan sonra, bu uygulama sessizliği denetimi ilk kurtarma penceresi için normal mesaj zaman aşımını kullanır.
- Baileys soket zamanlamaları `web.whatsapp.*` altında açıktır: `keepAliveIntervalMs` WhatsApp Web uygulama ping'lerini kontrol eder, `connectTimeoutMs` açılış el sıkışması zaman aşımını kontrol eder ve `defaultQueryTimeoutMs` Baileys sorgu zaman aşımlarını kontrol eder.
- Giden gönderimler, hedef hesap için etkin bir WhatsApp dinleyicisi gerektirir.
- Durum ve yayın sohbetleri yok sayılır (`@status`, `@broadcast`).
- Yeniden bağlanma izleyicisi yalnızca gelen uygulama mesajı hacmini değil, WhatsApp Web aktarım etkinliğini izler: aktarım çerçeveleri sürdüğü sürece sessiz bağlı cihaz oturumları açık kalır, ancak aktarım duraklaması daha sonraki uzak bağlantı kesme yolundan çok önce yeniden bağlanmayı zorlar.
- Doğrudan sohbetler DM oturum kurallarını kullanır (`session.dmScope`; varsayılan `main`, DM'leri ajanın ana oturumunda birleştirir).
- Grup oturumları yalıtılmıştır (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Kanalları/Bültenleri, yerel `@newsletter` JID'leriyle açık giden hedefler olabilir. Giden bülten gönderimleri, DM oturum semantiği yerine kanal oturum meta verilerini (`agent:<agentId>:whatsapp:channel:<jid>`) kullanır.
- WhatsApp Web aktarımı, Gateway ana makinesindeki standart proxy ortam değişkenlerini dikkate alır (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / küçük harfli varyantlar). Kanala özgü WhatsApp proxy ayarları yerine ana makine düzeyi proxy yapılandırmasını tercih edin.
- `messages.removeAckAfterReply` etkinleştirildiğinde, OpenClaw görünür bir yanıt teslim edildikten sonra WhatsApp onay tepkisini temizler.

## Plugin kancaları ve gizlilik

WhatsApp gelen mesajları kişisel mesaj içeriği, telefon numaraları,
grup tanımlayıcıları, gönderen adları ve oturum korelasyon alanları içerebilir. Bu nedenle,
WhatsApp, açıkça dahil olmayı seçmediğiniz sürece gelen `message_received` kanca yüklerini Plugin'lere yayınlamaz:

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

Dahil olmayı tek bir hesapla sınırlayabilirsiniz:

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

Bunu yalnızca gelen WhatsApp mesaj içeriğini ve tanımlayıcılarını almasına güvendiğiniz Plugin'ler için etkinleştirin.

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.whatsapp.dmPolicy` doğrudan sohbet erişimini kontrol eder:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` değerinin `"*"` içermesini gerektirir)
    - `disabled`

    `allowFrom`, E.164 tarzı numaraları kabul eder (dahili olarak normalleştirilir).

    `allowFrom` bir DM gönderen erişim denetimi listesidir. WhatsApp grup JID'lerine veya `@newsletter` kanal JID'lerine açık giden gönderimleri sınırlamaz.

    Çok hesaplı geçersiz kılma: `channels.whatsapp.accounts.<id>.dmPolicy` (ve `allowFrom`) o hesap için kanal düzeyi varsayılanlara göre önceliklidir.

    Çalışma zamanı davranış ayrıntıları:

    - eşleştirmeler kanal izin deposunda kalıcı hale getirilir ve yapılandırılmış `allowFrom` ile birleştirilir
    - zamanlanmış otomasyon ve Heartbeat alıcı yedeği açık teslim hedeflerini veya yapılandırılmış `allowFrom` değerini kullanır; DM eşleştirme onayları örtük cron veya heartbeat alıcıları değildir
    - izin listesi yapılandırılmamışsa, bağlı kendi numarası varsayılan olarak izinlidir
    - OpenClaw giden `fromMe` DM'lerini (bağlı cihazdan kendinize gönderdiğiniz mesajlar) asla otomatik eşleştirmez

  </Tab>

  <Tab title="Grup ilkesi + izin listeleri">
    Grup erişiminin iki katmanı vardır:

    1. **Grup üyeliği izin listesi** (`channels.whatsapp.groups`)
       - `groups` atlanırsa, tüm gruplar uygundur
       - `groups` mevcutsa, grup izin listesi olarak çalışır (`"*"` izinlidir)

    2. **Grup gönderen ilkesi** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: gönderen izin listesi atlanır
       - `allowlist`: gönderen `groupAllowFrom` (veya `*`) ile eşleşmelidir
       - `disabled`: tüm grup gelenlerini engeller

    Gönderen izin listesi yedeği:

    - `groupAllowFrom` ayarlanmamışsa, çalışma zamanı mevcut olduğunda `allowFrom` değerine geri döner
    - gönderen izin listeleri, bahsetme/yanıtlama etkinleştirmesinden önce değerlendirilir

    Not: Hiç `channels.whatsapp` bloğu yoksa, `channels.defaults.groupPolicy` ayarlanmış olsa bile çalışma zamanı grup ilkesi yedeği `allowlist` olur (uyarı günlüğüyle).

  </Tab>

  <Tab title="Bahsetmeler + /activation">
    Grup yanıtları varsayılan olarak bahsetme gerektirir.

    Bahsetme algılaması şunları içerir:

    - bot kimliğinden açık WhatsApp bahsetmeleri
    - yapılandırılmış bahsetme regex kalıpları (`agents.list[].groupChat.mentionPatterns`, yedek `messages.groupChat.mentionPatterns`)
    - yetkili grup mesajları için gelen sesli not dökümleri
    - örtük bota yanıt algılama (yanıt gönderen bot kimliğiyle eşleşir)

    Güvenlik notu:

    - alıntı/yanıt yalnızca bahsetme kapısını karşılar; gönderen yetkilendirmesi **vermez**
    - `groupPolicy: "allowlist"` ile izin listesinde olmayan gönderenler, izin listesindeki bir kullanıcının mesajına yanıt verseler bile engellenmeye devam eder

    Oturum düzeyi etkinleştirme komutu:

    - `/activation mention`
    - `/activation always`

    `activation` oturum durumunu günceller (genel yapılandırmayı değil). Sahip kapılıdır.

  </Tab>
</Tabs>

## Kişisel numara ve kendi kendine sohbet davranışı

Bağlı kendi numarası `allowFrom` içinde de mevcut olduğunda, WhatsApp kendi kendine sohbet güvenlik önlemleri etkinleşir:

- kendi kendine sohbet dönüşleri için okundu bilgilerini atla
- aksi halde kendinize ping gönderecek bahsetme JID otomatik tetikleme davranışını yok say
- `messages.responsePrefix` ayarlanmamışsa, kendi kendine sohbet yanıtları varsayılan olarak `[{identity.name}]` veya `[openclaw]` olur

## Mesaj normalleştirme ve bağlam

<AccordionGroup>
  <Accordion title="Gelen zarf + yanıt bağlamı">
    Gelen WhatsApp mesajları paylaşılan gelen zarfına sarılır.

    Alıntılanmış bir yanıt varsa, bağlam şu biçimde eklenir:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Yanıt meta veri alanları da mevcut olduğunda doldurulur (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, gönderen JID/E.164).
    Alıntılanan yanıt hedefi indirilebilir medya olduğunda, OpenClaw bunu
    normal gelen medya deposu üzerinden kaydeder ve `MediaPath`/`MediaType`
    olarak sunar; böylece ajan yalnızca `<media:image>` görmek yerine
    başvurulan görüntüyü inceleyebilir.

  </Accordion>

  <Accordion title="Medya yer tutucuları ve konum/kişi çıkarımı">
    Yalnızca medyadan oluşan gelen mesajlar şu gibi yer tutucularla normalleştirilir:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Yetkili grup sesli notları, gövde yalnızca `<media:audio>` olduğunda bahsetme kapısından önce döküme çevrilir; böylece sesli notta bottan bahsetmek
    yanıtı tetikleyebilir. Döküm hâlâ bottan bahsetmiyorsa,
    döküm ham yer tutucu yerine bekleyen grup geçmişinde tutulur.

    Konum gövdeleri kısa koordinat metni kullanır. Konum etiketleri/yorumları ve kişi/vCard ayrıntıları, satır içi istem metni olarak değil, fenced güvenilmeyen meta veri olarak işlenir.

  </Accordion>

  <Accordion title="Bekleyen grup geçmişi enjeksiyonu">
    Gruplar için işlenmemiş mesajlar arabelleğe alınabilir ve bot sonunda tetiklendiğinde bağlam olarak enjekte edilebilir.

    - varsayılan sınır: `50`
    - yapılandırma: `channels.whatsapp.historyLimit`
    - yedek: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    Enjeksiyon işaretleri:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Okundu bilgileri">
    Kabul edilen gelen WhatsApp mesajları için okundu bilgileri varsayılan olarak etkindir.

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

    Hesap başına geçersiz kılma:

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

    Kendiyle sohbet turları, genel olarak etkinleştirilmiş olsa bile okundu bilgilerini atlar.

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
    - görüntü, video, ses (PTT sesli notu) ve belge payload'larını destekler
    - ses medyası Baileys `audio` payload'ı üzerinden `ptt: true` ile gönderilir; böylece WhatsApp istemcileri bunu bas-konuş sesli notu olarak işler
    - yanıt payload'ları `audioAsVoice` değerini korur; sağlayıcı MP3 veya WebM döndürse bile WhatsApp için TTS sesli not çıktısı bu PTT yolunda kalır
    - yerel Ogg/Opus ses, sesli not uyumluluğu için `audio/ogg; codecs=opus` olarak gönderilir
    - Microsoft Edge TTS MP3/WebM çıktısı dahil Ogg olmayan sesler, PTT tesliminden önce `ffmpeg` ile 48 kHz mono Ogg/Opus'a dönüştürülür
    - `/tts latest` en son asistan yanıtını tek bir sesli not olarak gönderir ve aynı yanıt için tekrarlanan gönderimleri bastırır; `/tts chat on|off|default` mevcut WhatsApp sohbeti için otomatik TTS'yi denetler
    - animasyonlu GIF oynatma, video gönderimlerinde `gifPlayback: true` ile desteklenir
    - çoklu medya yanıt payload'ları gönderilirken açıklamalar ilk medya öğesine uygulanır; PTT sesli notları ise sesi önce, görünür metni ayrı gönderir çünkü WhatsApp istemcileri sesli not açıklamalarını tutarlı şekilde işlemez
    - medya kaynağı HTTP(S), `file://` veya yerel yollar olabilir

  </Accordion>

  <Accordion title="Medya boyutu sınırları ve geri dönüş davranışı">
    - gelen medya kaydetme üst sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - giden medya gönderme üst sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - hesap başına geçersiz kılmalar `channels.whatsapp.accounts.<accountId>.mediaMaxMb` kullanır
    - görüntüler sınırlara sığacak şekilde otomatik optimize edilir (yeniden boyutlandırma/kalite taraması)
    - medya gönderimi başarısız olduğunda, ilk öğe geri dönüşü yanıtı sessizce düşürmek yerine metin uyarısı gönderir

  </Accordion>
</AccordionGroup>

## Yanıt alıntılama

WhatsApp, giden yanıtların gelen mesajı görünür şekilde alıntıladığı yerel yanıt alıntılamayı destekler. Bunu `channels.whatsapp.replyToMode` ile denetleyin.

| Değer       | Davranış                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Asla alıntılama; düz mesaj olarak gönder                              |
| `"first"`   | Yalnızca ilk giden yanıt parçasını alıntıla                           |
| `"all"`     | Her giden yanıt parçasını alıntıla                                    |
| `"batched"` | Kuyruğa alınmış toplu yanıtları alıntıla, anlık yanıtları alıntısız bırak |

Varsayılan `"off"` değeridir. Hesap başına geçersiz kılmalar `channels.whatsapp.accounts.<id>.replyToMode` kullanır.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Tepki düzeyi

`channels.whatsapp.reactionLevel`, ajanın WhatsApp'ta emoji tepkilerini ne kadar geniş kapsamda kullanacağını denetler:

| Düzey         | Onay tepkileri | Ajan başlatımlı tepkiler | Açıklama                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | Hayır         | Hayır                     | Hiç tepki yok                              |
| `"ack"`       | Evet          | Hayır                     | Yalnızca onay tepkileri (yanıt öncesi alındı bilgisi) |
| `"minimal"`   | Evet          | Evet (temkinli)           | Temkinli rehberlikle onay + ajan tepkileri |
| `"extensive"` | Evet          | Evet (teşvik edilir)      | Teşvik edilen rehberlikle onay + ajan tepkileri   |

Varsayılan: `"minimal"`.

Hesap başına geçersiz kılmalar `channels.whatsapp.accounts.<id>.reactionLevel` kullanır.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Onay tepkileri

WhatsApp, `channels.whatsapp.ackReaction` aracılığıyla gelen alındı bilgisinde anında onay tepkilerini destekler.
Onay tepkileri `reactionLevel` tarafından sınırlandırılır; `reactionLevel` `"off"` olduğunda bastırılır.

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
- grup modu `mentions`, bahsetmeyle tetiklenen turlarda tepki verir; grup etkinleştirme `always` bu denetim için baypas görevi görür
- WhatsApp `channels.whatsapp.ackReaction` kullanır (eski `messages.ackReaction` burada kullanılmaz)

## Çoklu hesap ve kimlik bilgileri

<AccordionGroup>
  <Accordion title="Hesap seçimi ve varsayılanlar">
    - hesap kimlikleri `channels.whatsapp.accounts` üzerinden gelir
    - varsayılan hesap seçimi: varsa `default`, yoksa ilk yapılandırılmış hesap kimliği (sıralı)
    - hesap kimlikleri arama için dahili olarak normalleştirilir

  </Accordion>

  <Accordion title="Kimlik bilgisi yolları ve eski uyumluluk">
    - geçerli kimlik doğrulama yolu: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - yedek dosya: `creds.json.bak`
    - `~/.openclaw/credentials/` içindeki eski varsayılan kimlik doğrulama, varsayılan hesap akışları için hâlâ tanınır/taşınır

  </Accordion>

  <Accordion title="Çıkış davranışı">
    `openclaw channels logout --channel whatsapp [--account <id>]` bu hesap için WhatsApp kimlik doğrulama durumunu temizler.

    Bir Gateway erişilebilir olduğunda çıkış, bağlı oturumun bir sonraki yeniden başlatmaya kadar mesaj almaya devam etmemesi için önce seçili hesaba ait canlı WhatsApp dinleyicisini durdurur. `openclaw channels remove --channel whatsapp` da hesap yapılandırmasını devre dışı bırakmadan veya silmeden önce canlı dinleyiciyi durdurur.

    Eski kimlik doğrulama dizinlerinde, Baileys kimlik doğrulama dosyaları kaldırılırken `oauth.json` korunur.

  </Accordion>
</AccordionGroup>

## Araçlar, eylemler ve yapılandırma yazımları

- Ajan araç desteği WhatsApp tepki eylemini (`react`) içerir.
- Eylem kapıları:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Kanal başlatımlı yapılandırma yazımları varsayılan olarak etkindir (`channels.whatsapp.configWrites=false` ile devre dışı bırakın).

## Sorun giderme

<AccordionGroup>
  <Accordion title="Bağlı değil (QR gerekli)">
    Belirti: kanal durumu bağlı değil olarak bildirilir.

    Düzeltme:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Bağlı ama bağlantı kesiliyor / yeniden bağlanma döngüsü">
    Belirti: tekrarlanan bağlantı kesilmeleri veya yeniden bağlanma denemeleri olan bağlı hesap.

    Sessiz hesaplar normal mesaj zaman aşımını geçtikten sonra da bağlı kalabilir; watchdog
    WhatsApp Web aktarım etkinliği durduğunda, soket kapandığında veya
    uygulama düzeyi etkinlik daha uzun güvenlik penceresinin ötesinde sessiz kaldığında yeniden başlatır.

    Günlükler tekrarlanan `status=408 Request Time-out Connection was lost` gösteriyorsa
    `web.whatsapp` altındaki Baileys soket zamanlamalarını ayarlayın. Ağınızın
    boşta kalma zaman aşımının altına `keepAliveIntervalMs` değerini kısaltarak ve
    yavaş ya da kayıplı bağlantılarda `connectTimeoutMs` değerini artırarak başlayın:

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

    `~/.openclaw/logs/whatsapp-health.log` `Gateway inactive` diyorsa ancak
    `openclaw gateway status` ve `openclaw channels status --probe`
    Gateway'in ve WhatsApp'ın sağlıklı olduğunu gösteriyorsa `openclaw doctor` çalıştırın. Linux'ta doctor,
    hâlâ `~/.openclaw/bin/ensure-whatsapp.sh` çağıran eski crontab girdileri
    hakkında uyarır; bu eski girdileri `crontab -e` ile kaldırın çünkü cron
    systemd kullanıcı veri yolu ortamından yoksun olabilir ve bu eski betiğin Gateway sağlığını hatalı bildirmesine
    neden olabilir.

    Gerekirse `channels login` ile yeniden bağlayın.

  </Accordion>

  <Accordion title="QR oturum açma proxy arkasında zaman aşımına uğruyor">
    Belirti: `openclaw channels login --channel whatsapp`, `status=408 Request Time-out` veya TLS soket bağlantı kesilmesiyle kullanılabilir bir QR kodu göstermeden önce başarısız olur.

    WhatsApp Web oturum açma, Gateway ana makinesinin standart proxy ortamını (`HTTPS_PROXY`, `HTTP_PROXY`, küçük harfli varyantlar ve `NO_PROXY`) kullanır. Gateway sürecinin proxy env değerlerini devraldığını ve `NO_PROXY` değerinin `mmg.whatsapp.net` ile eşleşmediğini doğrulayın.

  </Accordion>

  <Accordion title="Gönderirken etkin dinleyici yok">
    Hedef hesap için etkin bir Gateway dinleyicisi yoksa giden gönderimler hızlı şekilde başarısız olur.

    Gateway'in çalıştığından ve hesabın bağlı olduğundan emin olun.

  </Accordion>

  <Accordion title="Yanıt transkriptte görünüyor ama WhatsApp'ta görünmüyor">
    Transkript satırları ajanın ürettiği şeyi kaydeder. WhatsApp teslimi ayrı olarak denetlenir: OpenClaw, bir otomatik yanıtı yalnızca Baileys en az bir görünür metin veya medya gönderimi için giden mesaj kimliği döndürdükten sonra gönderilmiş sayar.

    Onay tepkileri bağımsız yanıt öncesi alındı bilgileridir. Başarılı bir tepki, sonraki metin veya medya yanıtının WhatsApp tarafından kabul edildiğini kanıtlamaz.

    Gateway günlüklerinde `auto-reply delivery failed` veya `auto-reply was not accepted by WhatsApp provider` olup olmadığını kontrol edin.

  </Accordion>

  <Accordion title="Grup mesajları beklenmedik şekilde yok sayılıyor">
    Bu sırayla kontrol edin:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` izin listesi girdileri
    - bahsetme kapısı (`requireMention` + bahsetme desenleri)
    - `openclaw.json` (JSON5) içinde yinelenen anahtarlar: sonraki girdiler öncekileri geçersiz kılar, bu yüzden kapsam başına tek bir `groupPolicy` tutun

  </Accordion>

  <Accordion title="Bun çalışma zamanı uyarısı">
    WhatsApp Gateway çalışma zamanı Node kullanmalıdır. Bun, kararlı WhatsApp/Telegram Gateway işlemi için uyumsuz olarak işaretlenir.
  </Accordion>
</AccordionGroup>

## Sistem istemleri

WhatsApp, `groups` ve `direct` haritaları aracılığıyla gruplar ve doğrudan sohbetler için Telegram tarzı sistem istemlerini destekler.

Grup mesajları için çözümleme hiyerarşisi:

Etkili `groups` haritası önce belirlenir: hesap kendi `groups` değerini tanımlıyorsa, kök `groups` haritasının tamamen yerine geçer (derin birleştirme yok). İstem araması daha sonra ortaya çıkan tek harita üzerinde çalışır:

1. **Gruba özgü sistem istemi** (`groups["<groupId>"].systemPrompt`): haritada belirli grup girdisi mevcut olduğunda **ve** `systemPrompt` anahtarı tanımlı olduğunda kullanılır. `systemPrompt` boş dize (`""`) ise joker bastırılır ve hiçbir sistem istemi uygulanmaz.
2. **Grup joker sistem istemi** (`groups["*"].systemPrompt`): belirli grup girdisi haritada tamamen yoksa veya mevcut olup `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

Doğrudan mesajlar için çözümleme hiyerarşisi:

Etkili `direct` haritası önce belirlenir: hesap kendi `direct` değerini tanımlıyorsa, kök `direct` haritasının tamamen yerine geçer (derin birleştirme yok). İstem araması daha sonra ortaya çıkan tek harita üzerinde çalışır:

1. **Doğrudan mesaja özgü sistem istemi** (`direct["<peerId>"].systemPrompt`): haritada belirli eş girdisi mevcut olduğunda **ve** `systemPrompt` anahtarı tanımlı olduğunda kullanılır. `systemPrompt` boş dize (`""`) ise joker bastırılır ve hiçbir sistem istemi uygulanmaz.
2. **Doğrudan mesaj joker sistem istemi** (`direct["*"].systemPrompt`): belirli eş girdisi haritada tamamen yoksa veya mevcut olup `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

<Note>
`dms`, DM başına hafif geçmiş geçersiz kılma kovası olarak kalır (`dms.<id>.historyLimit`). İstem geçersiz kılmaları `direct` altında bulunur.
</Note>

**Telegram çoklu hesap davranışından farkı:** Telegram’da, birden çok hesaplı kurulumda kök `groups`, kendi `groups` değerini tanımlamayan hesaplar dahil tüm hesaplar için özellikle bastırılır; bunun amacı, bir botun ait olmadığı gruplar için grup mesajları almasını önlemektir. WhatsApp bu korumayı uygulamaz: kaç hesap yapılandırılmış olursa olsun, hesap düzeyinde geçersiz kılma tanımlamayan hesaplar her zaman kök `groups` ve kök `direct` değerlerini devralır. Birden çok hesaplı WhatsApp kurulumunda hesap başına grup veya doğrudan sohbet istemleri istiyorsanız, kök düzeyindeki varsayılanlara güvenmek yerine tam eşlemeyi her hesabın altında açıkça tanımlayın.

Önemli davranış:

- `channels.whatsapp.groups` hem grup başına yapılandırma eşlemesi hem de sohbet düzeyi grup izin listesidir. Kök veya hesap kapsamında, `groups["*"]` o kapsam için "tüm gruplar kabul edilir" anlamına gelir.
- Joker grup `systemPrompt` değerini yalnızca ilgili kapsamın tüm grupları kabul etmesini zaten istiyorsanız ekleyin. Hâlâ yalnızca sabit bir grup ID kümesinin uygun olmasını istiyorsanız, istem varsayılanı için `groups["*"]` kullanmayın. Bunun yerine istemi açıkça izin listesine alınmış her grup girdisinde tekrarlayın.
- Grup kabulü ve gönderen yetkilendirmesi ayrı denetimlerdir. `groups["*"]`, grup işleme erişebilen grup kümesini genişletir, ancak tek başına bu gruplardaki her göndereni yetkilendirmez. Gönderen erişimi hâlâ ayrı olarak `channels.whatsapp.groupPolicy` ve `channels.whatsapp.groupAllowFrom` tarafından denetlenir.
- `channels.whatsapp.direct`, DM’ler için aynı yan etkiye sahip değildir. `direct["*"]`, yalnızca bir DM `dmPolicy` ile `allowFrom` veya eşleştirme deposu kuralları tarafından zaten kabul edildikten sonra varsayılan bir doğrudan sohbet yapılandırması sağlar.

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

## Yapılandırma başvuru işaretçileri

Birincil başvuru:

- [Yapılandırma başvurusu - WhatsApp](/tr/gateway/config-channels#whatsapp)

Yüksek sinyalli WhatsApp alanları:

- erişim: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- teslim: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- çoklu hesap: `accounts.<id>.enabled`, `accounts.<id>.authDir`, hesap düzeyi geçersiz kılmalar
- işlemler: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- oturum davranışı: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- istemler: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Güvenlik](/tr/gateway/security)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Çok ajanlı yönlendirme](/tr/concepts/multi-agent)
- [Sorun giderme](/tr/channels/troubleshooting)
