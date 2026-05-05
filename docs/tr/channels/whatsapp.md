---
read_when:
    - WhatsApp/web kanal davranışı veya gelen kutusu yönlendirmesi üzerinde çalışma
summary: WhatsApp kanal desteği, erişim denetimleri, iletim davranışı ve operasyonlar
title: WhatsApp
x-i18n:
    generated_at: "2026-05-05T06:16:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52a81fc323568e06d11606931e34465fe5a823a0699d8e0638195b8667c3ebee
    source_path: channels/whatsapp.md
    workflow: 16
---

Durum: WhatsApp Web (Baileys) üzerinden üretime hazır. Gateway bağlı oturum(lar)ın sahibidir.

## Kurulum (isteğe bağlı)

- Onboarding (`openclaw onboard`) ve `openclaw channels add --channel whatsapp`,
  WhatsApp Plugin'ini ilk kez seçtiğinizde kurmanızı ister.
- `openclaw channels login --channel whatsapp`, Plugin henüz mevcut değilse
  kurulum akışını da sunar.
- Geliştirme kanalı + git checkout: varsayılan olarak yerel Plugin yolunu kullanır.
- Stable/Beta: geçerli resmi sürüm etiketindeki npm paketi `@openclaw/whatsapp` kullanılır.

Manuel kurulum kullanılabilir kalır:

```bash
openclaw plugins install @openclaw/whatsapp
```

Geçerli resmi sürüm etiketini takip etmek için yalın paketi kullanın. Tam bir
sürümü yalnızca tekrarlanabilir bir kurulum gerektiğinde sabitleyin.

Windows'ta WhatsApp Plugin'i, npm kurulumu sırasında `PATH` üzerinde Git'e ihtiyaç duyar çünkü
Baileys/libsignal bağımlılıklarından biri bir git URL'sinden alınır. Git for Windows'ı kurun,
ardından kabuğu yeniden başlatıp kurulumu tekrar çalıştırın:

```powershell
winget install --id Git.Git -e
```

Portable Git de `bin` dizini `PATH` üzerindeyse çalışır.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    Bilinmeyen gönderenler için varsayılan DM ilkesi eşleştirmedir.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım çalışma planları.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/tr/gateway/configuration">
    Tam kanal yapılandırma desenleri ve örnekleri.
  </Card>
</CardGroup>

## Hızlı kurulum

<Steps>
  <Step title="Configure WhatsApp access policy">

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

  <Step title="Link WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Belirli bir hesap için:

```bash
openclaw channels login --channel whatsapp --account work
```

    Oturum açmadan önce mevcut/özel bir WhatsApp Web kimlik doğrulama dizini bağlamak için:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Start the gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approve first pairing request (if using pairing mode)">

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

## Dağıtım desenleri

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    Bu, en temiz operasyonel moddur:

    - OpenClaw için ayrı WhatsApp kimliği
    - daha net DM izin listeleri ve yönlendirme sınırları
    - kendi kendine sohbet karışıklığı olasılığının daha düşük olması

    En küçük ilke deseni:

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

  <Accordion title="Personal-number fallback">
    Onboarding kişisel numara modunu destekler ve kendi kendine sohbet dostu bir temel ayar yazar:

    - `dmPolicy: "allowlist"`
    - `allowFrom` kişisel numaranızı içerir
    - `selfChatMode: true`

    Çalışma zamanında, kendi kendine sohbet korumaları bağlı kendi numarasını ve `allowFrom` değerini temel alır.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Mesajlaşma platformu kanalı, geçerli OpenClaw kanal mimarisinde WhatsApp Web tabanlıdır (`Baileys`).

    Yerleşik sohbet kanalı kayıt defterinde ayrı bir Twilio WhatsApp mesajlaşma kanalı yoktur.

  </Accordion>
</AccordionGroup>

## Çalışma zamanı modeli

- Gateway, WhatsApp soketinin ve yeniden bağlanma döngüsünün sahibidir.
- Yeniden bağlanma izleyicisi, yalnızca gelen uygulama iletisi hacmini değil, WhatsApp Web aktarım etkinliğini kullanır; bu nedenle sessiz bir bağlı cihaz oturumu yalnızca yakın zamanda kimse ileti göndermediği için yeniden başlatılmaz. Daha uzun bir uygulama sessizliği üst sınırı, aktarım çerçeveleri gelmeye devam etse ancak izleyici penceresi boyunca hiçbir uygulama iletisi işlenmese yine de yeniden bağlanmayı zorlar; yakın zamanda etkin olan bir oturum için geçici bir yeniden bağlanmadan sonra, bu uygulama sessizliği denetimi ilk kurtarma penceresinde normal ileti zaman aşımını kullanır.
- Baileys soket zamanlamaları `web.whatsapp.*` altında açıktır: `keepAliveIntervalMs` WhatsApp Web uygulama ping'lerini, `connectTimeoutMs` açılış el sıkışması zaman aşımını ve `defaultQueryTimeoutMs` Baileys sorgu zaman aşımlarını kontrol eder.
- Giden gönderimler, hedef hesap için etkin bir WhatsApp dinleyicisi gerektirir.
- Grup gönderimleri, metin ve medya açıklamalarındaki `@+<digits>` ve `@<digits>` belirteçleri geçerli WhatsApp katılımcı meta verileriyle eşleştiğinde, LID destekli gruplar dahil olmak üzere yerel bahsetme meta verilerini ekler.
- Durum ve yayın sohbetleri yok sayılır (`@status`, `@broadcast`).
- Yeniden bağlanma izleyicisi, yalnızca gelen uygulama iletisi hacmini değil, WhatsApp Web aktarım etkinliğini izler: sessiz bağlı cihaz oturumları aktarım çerçeveleri devam ederken açık kalır, ancak aktarım durması daha sonraki uzak bağlantı kesme yolundan çok önce yeniden bağlanmayı zorlar.
- Doğrudan sohbetler DM oturum kurallarını kullanır (`session.dmScope`; varsayılan `main`, DM'leri temsilcinin ana oturumuna toplar).
- Grup oturumları yalıtılmıştır (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters, yerel `@newsletter` JID'leriyle açık giden hedefler olabilir. Giden newsletter gönderimleri, DM oturum semantiği yerine kanal oturumu meta verilerini (`agent:<agentId>:whatsapp:channel:<jid>`) kullanır.
- WhatsApp Web aktarımı, Gateway ana makinesindeki standart proxy ortam değişkenlerini dikkate alır (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / küçük harfli varyantlar). Kanal özelindeki WhatsApp proxy ayarları yerine ana makine düzeyi proxy yapılandırmasını tercih edin.
- `messages.removeAckAfterReply` etkinleştirildiğinde OpenClaw, görünür bir yanıt teslim edildikten sonra WhatsApp ack tepkisini temizler.

## Plugin kancaları ve gizlilik

WhatsApp gelen iletileri kişisel ileti içeriği, telefon numaraları,
grup tanımlayıcıları, gönderen adları ve oturum korelasyon alanları içerebilir. Bu nedenle,
WhatsApp, açıkça dahil olmadığınız sürece gelen `message_received` kanca yüklerini Plugin'lere
yayınlamaz:

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

Dahil olmayı tek bir hesaba kapsamlandırabilirsiniz:

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

Bunu yalnızca gelen WhatsApp ileti içeriğini ve tanımlayıcılarını almasına
güvendiğiniz Plugin'ler için etkinleştirin.

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` doğrudan sohbet erişimini kontrol eder:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` değerinin `"*"` içermesini gerektirir)
    - `disabled`

    `allowFrom`, E.164 tarzı numaraları kabul eder (dahili olarak normalleştirilir).

    `allowFrom`, bir DM gönderen erişim denetimi listesidir. WhatsApp grup JID'lerine veya `@newsletter` kanal JID'lerine açık giden gönderimleri kısıtlamaz.

    Çok hesaplı geçersiz kılma: `channels.whatsapp.accounts.<id>.dmPolicy` (ve `allowFrom`), o hesap için kanal düzeyi varsayılanlara göre önceliklidir.

    Çalışma zamanı davranış ayrıntıları:

    - eşleştirmeler kanal izin deposunda kalıcılaştırılır ve yapılandırılmış `allowFrom` ile birleştirilir
    - zamanlanmış otomasyon ve Heartbeat alıcı yedeği, açık teslim hedeflerini veya yapılandırılmış `allowFrom` değerini kullanır; DM eşleştirme onayları örtük cron veya Heartbeat alıcıları değildir
    - hiçbir izin listesi yapılandırılmamışsa bağlı kendi numarası varsayılan olarak izinlidir
    - OpenClaw, giden `fromMe` DM'lerini (bağlı cihazdan kendinize gönderdiğiniz iletiler) hiçbir zaman otomatik eşleştirmez

  </Tab>

  <Tab title="Group policy + allowlists">
    Grup erişiminin iki katmanı vardır:

    1. **Grup üyeliği izin listesi** (`channels.whatsapp.groups`)
       - `groups` atlanırsa tüm gruplar uygundur
       - `groups` mevcutsa grup izin listesi gibi davranır (`"*"` izinlidir)

    2. **Grup gönderen ilkesi** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: gönderen izin listesi atlanır
       - `allowlist`: gönderen `groupAllowFrom` (veya `*`) ile eşleşmelidir
       - `disabled`: tüm grup gelenlerini engeller

    Gönderen izin listesi yedeği:

    - `groupAllowFrom` ayarlanmamışsa çalışma zamanı, varsa `allowFrom` değerine geri döner
    - gönderen izin listeleri bahsetme/yanıt etkinleştirmesinden önce değerlendirilir

    Not: Hiç `channels.whatsapp` bloğu yoksa çalışma zamanı grup ilkesi yedeği, `channels.defaults.groupPolicy` ayarlı olsa bile `allowlist` olur (uyarı günlüğüyle).

  </Tab>

  <Tab title="Mentions + /activation">
    Grup yanıtları varsayılan olarak bahsetme gerektirir.

    Bahsetme algılama şunları içerir:

    - bot kimliğinin açık WhatsApp bahsetmeleri
    - yapılandırılmış bahsetme regex desenleri (`agents.list[].groupChat.mentionPatterns`, yedek `messages.groupChat.mentionPatterns`)
    - yetkili grup iletileri için gelen sesli not dökümleri
    - örtük bota yanıt algılama (yanıt gönderen bot kimliğiyle eşleşir)

    Güvenlik notu:

    - alıntı/yanıt yalnızca bahsetme geçidini karşılar; gönderen yetkisi **vermez**
    - `groupPolicy: "allowlist"` ile, izin listesinde olmayan gönderenler, izin listesinde olan bir kullanıcının iletisine yanıt verseler bile engellenir

    Oturum düzeyi etkinleştirme komutu:

    - `/activation mention`
    - `/activation always`

    `activation` oturum durumunu günceller (global yapılandırmayı değil). Sahip geçidine tabidir.

  </Tab>
</Tabs>

## Kişisel numara ve kendi kendine sohbet davranışı

Bağlı kendi numarası `allowFrom` içinde de mevcut olduğunda, WhatsApp kendi kendine sohbet korumaları etkinleşir:

- kendi kendine sohbet turları için okundu bilgilerini atla
- aksi halde kendinize ping atacak bahsetme-JID otomatik tetikleme davranışını yok say
- `messages.responsePrefix` ayarlanmamışsa kendi kendine sohbet yanıtları varsayılan olarak `[{identity.name}]` veya `[openclaw]` olur

## İleti normalleştirme ve bağlam

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    Gelen WhatsApp iletileri paylaşılan gelen zarfına sarılır.

    Alıntılanmış bir yanıt varsa bağlam şu biçimde eklenir:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Yanıt meta verisi alanları da mevcut olduğunda doldurulur (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, gönderen JID/E.164).
    Alıntılanan yanıt hedefi indirilebilir medya olduğunda OpenClaw bunu
    normal gelen medya deposu üzerinden kaydeder ve `MediaPath`/`MediaType` olarak sunar; böylece
    temsilci yalnızca `<media:image>` görmek yerine başvurulan görseli inceleyebilir.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Yalnızca medya içeren gelen iletiler şu gibi yer tutucularla normalleştirilir:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Yetkili grup sesli notları, gövde yalnızca `<media:audio>` olduğunda bahsetme geçidinden önce
    yazıya dökülür; bu nedenle sesli notta bot bahsetmesini söylemek
    yanıtı tetikleyebilir. Döküm yine de bottan bahsetmiyorsa,
    ham yer tutucu yerine bekleyen grup geçmişinde tutulur.

    Konum gövdeleri kısa koordinat metni kullanır. Konum etiketleri/yorumları ve kişi/vCard ayrıntıları, satır içi istem metni olarak değil, çitle çevrilmiş güvenilmeyen meta veri olarak işlenir.

  </Accordion>

  <Accordion title="Pending group history injection">
    Gruplar için, işlenmemiş iletiler arabelleğe alınabilir ve bot en sonunda tetiklendiğinde bağlam olarak enjekte edilebilir.

    - varsayılan sınır: `50`
    - config: `channels.whatsapp.historyLimit`
    - yedek: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    Enjeksiyon işaretçileri:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Okundu bilgileri">
    Okundu bilgileri, kabul edilen gelen WhatsApp mesajları için varsayılan olarak etkindir.

    Genel olarak devre dışı bırakma:

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

    Kendi kendine sohbet turları, genel olarak etkin olsa bile okundu bilgilerini atlar.

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
    - görsel, video, ses (PTT sesli not) ve belge yüklerini destekler
    - ses medyası Baileys `audio` yükü üzerinden `ptt: true` ile gönderilir, bu yüzden WhatsApp istemcileri bunu bas-konuş sesli notu olarak işler
    - yanıt yükleri `audioAsVoice` değerini korur; WhatsApp için TTS sesli not çıktısı, sağlayıcı MP3 veya WebM döndürse bile bu PTT yolunda kalır
    - yerel Ogg/Opus ses, sesli not uyumluluğu için `audio/ogg; codecs=opus` olarak gönderilir
    - Microsoft Edge TTS MP3/WebM çıktısı dahil Ogg olmayan sesler, PTT tesliminden önce `ffmpeg` ile 48 kHz mono Ogg/Opus biçimine dönüştürülür
    - `/tts latest` en son asistan yanıtını tek bir sesli not olarak gönderir ve aynı yanıt için tekrarlı gönderimleri bastırır; `/tts chat on|off|default` geçerli WhatsApp sohbeti için otomatik TTS'yi kontrol eder
    - animasyonlu GIF oynatma, video gönderimlerinde `gifPlayback: true` ile desteklenir
    - çoklu medya yanıt yükleri gönderilirken altyazılar ilk medya öğesine uygulanır; ancak PTT sesli notları sesi önce, görünür metni ayrı gönderir çünkü WhatsApp istemcileri sesli not altyazılarını tutarlı biçimde göstermez
    - medya kaynağı HTTP(S), `file://` veya yerel yollar olabilir

  </Accordion>

  <Accordion title="Medya boyutu sınırları ve yedek davranış">
    - gelen medya kaydetme üst sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - giden medya gönderme üst sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - hesap başına geçersiz kılmalar `channels.whatsapp.accounts.<accountId>.mediaMaxMb` kullanır
    - görseller, sınırlara sığacak şekilde otomatik optimize edilir (yeniden boyutlandırma/kalite taraması)
    - medya gönderme hatasında, ilk öğe yedeği yanıtı sessizce düşürmek yerine metin uyarısı gönderir

  </Accordion>
</AccordionGroup>

## Yanıt alıntılama

WhatsApp, giden yanıtların gelen mesajı görünür biçimde alıntıladığı yerel yanıt alıntılamayı destekler. Bunu `channels.whatsapp.replyToMode` ile kontrol edin.

| Değer       | Davranış                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Asla alıntılama; düz mesaj olarak gönder                              |
| `"first"`   | Yalnızca ilk giden yanıt parçasını alıntıla                           |
| `"all"`     | Her giden yanıt parçasını alıntıla                                    |
| `"batched"` | Anlık yanıtları alıntılamadan bırakırken kuyruğa alınmış toplu yanıtları alıntıla |

Varsayılan `"off"` olur. Hesap başına geçersiz kılmalar `channels.whatsapp.accounts.<id>.replyToMode` kullanır.

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

`channels.whatsapp.reactionLevel`, ajanın WhatsApp üzerinde emoji reaksiyonlarını ne kadar geniş kullandığını kontrol eder:

| Düzey         | Onay reaksiyonları | Ajan tarafından başlatılan reaksiyonlar | Açıklama                                      |
| ------------- | ------------------ | --------------------------------------- | -------------------------------------------- |
| `"off"`       | Hayır              | Hayır                                   | Hiç reaksiyon yok                            |
| `"ack"`       | Evet               | Hayır                                   | Yalnızca onay reaksiyonları (yanıt öncesi alındı bilgisi) |
| `"minimal"`   | Evet               | Evet (temkinli)                         | Temkinli yönlendirmeyle onay + ajan reaksiyonları |
| `"extensive"` | Evet               | Evet (teşvik edilir)                    | Teşvik edilen yönlendirmeyle onay + ajan reaksiyonları |

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

## Onay reaksiyonları

WhatsApp, `channels.whatsapp.ackReaction` aracılığıyla gelen alındı bilgisinde anında onay reaksiyonlarını destekler.
Onay reaksiyonları `reactionLevel` tarafından kapılanır — `reactionLevel` `"off"` olduğunda bastırılır.

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

- gelen mesaj kabul edildikten hemen sonra gönderilir (yanıt öncesi)
- hatalar günlüğe kaydedilir ancak normal yanıt teslimini engellemez
- grup modu `mentions`, bahsetmeyle tetiklenen turlarda reaksiyon verir; grup etkinleştirme `always` bu denetim için baypas görevi görür
- WhatsApp `channels.whatsapp.ackReaction` kullanır (eski `messages.ackReaction` burada kullanılmaz)

## Çoklu hesap ve kimlik bilgileri

<AccordionGroup>
  <Accordion title="Hesap seçimi ve varsayılanlar">
    - hesap kimlikleri `channels.whatsapp.accounts` içinden gelir
    - varsayılan hesap seçimi: varsa `default`, aksi halde ilk yapılandırılmış hesap kimliği (sıralı)
    - hesap kimlikleri arama için dahili olarak normalleştirilir

  </Accordion>

  <Accordion title="Kimlik bilgisi yolları ve eski uyumluluk">
    - geçerli kimlik doğrulama yolu: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - yedek dosya: `creds.json.bak`
    - `~/.openclaw/credentials/` içindeki eski varsayılan kimlik doğrulama, varsayılan hesap akışları için hâlâ tanınır/taşınır

  </Accordion>

  <Accordion title="Çıkış davranışı">
    `openclaw channels logout --channel whatsapp [--account <id>]`, bu hesap için WhatsApp kimlik doğrulama durumunu temizler.

    Bir Gateway erişilebilir olduğunda, çıkış önce seçilen hesap için canlı WhatsApp dinleyicisini durdurur; böylece bağlı oturum bir sonraki yeniden başlatmaya kadar mesaj almaya devam etmez. `openclaw channels remove --channel whatsapp`, hesap yapılandırmasını devre dışı bırakmadan veya silmeden önce canlı dinleyiciyi de durdurur.

    Eski kimlik doğrulama dizinlerinde, Baileys kimlik doğrulama dosyaları kaldırılırken `oauth.json` korunur.

  </Accordion>
</AccordionGroup>

## Araçlar, eylemler ve config yazmaları

- Ajan araç desteği WhatsApp reaksiyon eylemini (`react`) içerir.
- Eylem kapıları:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Kanal tarafından başlatılan config yazmaları varsayılan olarak etkindir (`channels.whatsapp.configWrites=false` ile devre dışı bırakılır).

## Sorun giderme

<AccordionGroup>
  <Accordion title="Bağlı değil (QR gerekli)">
    Belirti: kanal durumu bağlı değil bildirir.

    Düzeltme:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Bağlı ama bağlantı kesiliyor / yeniden bağlanma döngüsü">
    Belirti: tekrarlı bağlantı kesilmeleri veya yeniden bağlanma denemeleri olan bağlı hesap.

    Sessiz hesaplar normal mesaj zaman aşımının ötesinde bağlı kalabilir; gözetleyici,
    WhatsApp Web aktarım etkinliği durduğunda, soket kapandığında veya
    uygulama düzeyi etkinlik daha uzun güvenlik penceresinin ötesinde sessiz kaldığında yeniden başlatır.

    Günlükler tekrarlı `status=408 Request Time-out Connection was lost` gösteriyorsa,
    Baileys soket zamanlamalarını `web.whatsapp` altında ayarlayın. Önce
    `keepAliveIntervalMs` değerini ağınızın boşta kalma zaman aşımının altına kısaltın ve
    yavaş veya kayıplı bağlantılarda `connectTimeoutMs` değerini artırın:

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

    `~/.openclaw/logs/whatsapp-health.log` dosyası `Gateway inactive` diyorsa ancak
    `openclaw gateway status` ve `openclaw channels status --probe` Gateway'in
    ve WhatsApp'ın sağlıklı olduğunu gösteriyorsa, `openclaw doctor` çalıştırın. Linux'ta doctor,
    hâlâ `~/.openclaw/bin/ensure-whatsapp.sh` çağıran eski crontab girdileri hakkında uyarır;
    bu eski girdileri `crontab -e` ile kaldırın çünkü cron systemd kullanıcı veri yolu ortamından yoksun olabilir ve
    bu eski betiğin Gateway sağlığını yanlış raporlamasına neden olabilir.

    Gerekirse `channels login` ile yeniden bağlayın.

  </Accordion>

  <Accordion title="QR girişi proxy arkasında zaman aşımına uğruyor">
    Belirti: `openclaw channels login --channel whatsapp`, `status=408 Request Time-out` veya TLS soket bağlantı kesilmesiyle kullanılabilir bir QR kodu göstermeden önce başarısız olur.

    WhatsApp Web girişi, Gateway ana makinesinin standart proxy ortamını (`HTTPS_PROXY`, `HTTP_PROXY`, küçük harfli varyantlar ve `NO_PROXY`) kullanır. Gateway sürecinin proxy env değerlerini devraldığını ve `NO_PROXY` değerinin `mmg.whatsapp.net` ile eşleşmediğini doğrulayın.

  </Accordion>

  <Accordion title="Gönderirken etkin dinleyici yok">
    Giden gönderimler, hedef hesap için etkin Gateway dinleyicisi olmadığında hızlı başarısız olur.

    Gateway'in çalıştığından ve hesabın bağlı olduğundan emin olun.

  </Accordion>

  <Accordion title="Yanıt transkriptte görünüyor ama WhatsApp'ta görünmüyor">
    Transkript satırları ajanın ürettiğini kaydeder. WhatsApp teslimi ayrı olarak denetlenir: OpenClaw bir otomatik yanıtı yalnızca Baileys en az bir görünür metin veya medya gönderimi için giden mesaj kimliği döndürdükten sonra gönderilmiş sayar.

    Onay reaksiyonları bağımsız yanıt öncesi alındı bilgileridir. Başarılı bir reaksiyon, sonraki metin veya medya yanıtının WhatsApp tarafından kabul edildiğini kanıtlamaz.

    Gateway günlüklerinde `auto-reply delivery failed` veya `auto-reply was not accepted by WhatsApp provider` olup olmadığını denetleyin.

  </Accordion>

  <Accordion title="Grup mesajları beklenmedik biçimde yok sayılıyor">
    Şu sırayla denetleyin:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` izin listesi girdileri
    - bahsetme kapılaması (`requireMention` + bahsetme kalıpları)
    - `openclaw.json` içinde yinelenen anahtarlar (JSON5): sonraki girdiler öncekileri geçersiz kılar, bu yüzden kapsam başına tek bir `groupPolicy` tutun

  </Accordion>

  <Accordion title="Bun çalışma zamanı uyarısı">
    WhatsApp Gateway çalışma zamanı Node kullanmalıdır. Bun, kararlı WhatsApp/Telegram Gateway çalışması için uyumsuz olarak işaretlenir.
  </Accordion>
</AccordionGroup>

## Sistem istemleri

WhatsApp, `groups` ve `direct` haritaları aracılığıyla gruplar ve doğrudan sohbetler için Telegram tarzı sistem istemlerini destekler.

Grup mesajları için çözümleme hiyerarşisi:

Etkili `groups` haritası önce belirlenir: hesap kendi `groups` değerini tanımlıyorsa, kök `groups` haritasını tamamen değiştirir (derin birleştirme yok). Ardından istem araması ortaya çıkan tek haritada çalışır:

1. **Gruba özgü sistem istemi** (`groups["<groupId>"].systemPrompt`): belirli grup girdisi haritada bulunduğunda **ve** `systemPrompt` anahtarı tanımlı olduğunda kullanılır. `systemPrompt` boş bir dize (`""`) ise joker bastırılır ve sistem istemi uygulanmaz.
2. **Grup joker sistem istemi** (`groups["*"].systemPrompt`): belirli grup girdisi haritada tamamen yoksa veya var olup `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

Doğrudan mesajlar için çözümleme hiyerarşisi:

Etkili `direct` haritası önce belirlenir: hesap kendi `direct` değerini tanımlıyorsa, kök `direct` haritasını tamamen değiştirir (derin birleştirme yok). Ardından istem araması ortaya çıkan tek haritada çalışır:

1. **Doğrudan eşe özgü sistem istemi** (`direct["<peerId>"].systemPrompt`): haritada ilgili eş girdisi bulunduğunda **ve** bu girdinin `systemPrompt` anahtarı tanımlı olduğunda kullanılır. `systemPrompt` boş dize (`""`) ise joker bastırılır ve hiçbir sistem istemi uygulanmaz.
2. **Doğrudan joker sistem istemi** (`direct["*"].systemPrompt`): ilgili eş girdisi haritada hiç yoksa veya varsa ancak `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

<Note>
`dms`, DM başına hafif geçmiş geçersiz kılma kovası olarak kalır (`dms.<id>.historyLimit`). İstem geçersiz kılmaları `direct` altında bulunur.
</Note>

**Telegram çok hesaplı davranışından farkı:** Telegram'da, çok hesaplı bir kurulumda kök `groups`, kendi `groups` ayarını tanımlamayan hesaplar dahil tüm hesaplar için kasıtlı olarak bastırılır; bunun amacı, bir botun ait olmadığı gruplardan grup mesajları almasını önlemektir. WhatsApp bu korumayı uygulamaz: kök `groups` ve kök `direct`, kaç hesap yapılandırılmış olursa olsun, hesap düzeyinde geçersiz kılma tanımlamayan hesaplar tarafından her zaman devralınır. Çok hesaplı bir WhatsApp kurulumunda hesap başına grup veya doğrudan istemler istiyorsanız, kök düzey varsayılanlara güvenmek yerine her hesabın altında haritanın tamamını açıkça tanımlayın.

Önemli davranış:

- `channels.whatsapp.groups`, hem grup başına yapılandırma haritası hem de sohbet düzeyi grup izin listesidir. Kök veya hesap kapsamında `groups["*"]`, o kapsam için "tüm gruplar kabul edilir" anlamına gelir.
- Bir joker grup `systemPrompt` değerini yalnızca o kapsamın tüm grupları zaten kabul etmesini istiyorsanız ekleyin. Hâlâ yalnızca sabit bir grup ID kümesinin uygun olmasını istiyorsanız, istem varsayılanı için `groups["*"]` kullanmayın. Bunun yerine istemi açıkça izin verilen her grup girdisinde tekrarlayın.
- Grup kabulü ve gönderen yetkilendirmesi ayrı denetimlerdir. `groups["*"]`, grup işlemeye ulaşabilen grup kümesini genişletir, ancak tek başına bu gruplardaki her göndereni yetkilendirmez. Gönderen erişimi hâlâ ayrı olarak `channels.whatsapp.groupPolicy` ve `channels.whatsapp.groupAllowFrom` ile kontrol edilir.
- `channels.whatsapp.direct`, DM'ler için aynı yan etkiye sahip değildir. `direct["*"]`, yalnızca bir DM `dmPolicy` artı `allowFrom` veya eşleme deposu kurallarıyla zaten kabul edildikten sonra varsayılan bir doğrudan sohbet yapılandırması sağlar.

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

## Yapılandırma başvurusu işaretçileri

Birincil başvuru:

- [Yapılandırma başvurusu - WhatsApp](/tr/gateway/config-channels#whatsapp)

Yüksek değerli WhatsApp alanları:

- erişim: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- teslim: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- çok hesaplı: `accounts.<id>.enabled`, `accounts.<id>.authDir`, hesap düzeyi geçersiz kılmalar
- operasyonlar: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- oturum davranışı: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- istemler: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## İlgili

- [Eşleme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Güvenlik](/tr/gateway/security)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Çok aracılı yönlendirme](/tr/concepts/multi-agent)
- [Sorun giderme](/tr/channels/troubleshooting)
