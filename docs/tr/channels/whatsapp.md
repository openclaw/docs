---
read_when:
    - WhatsApp/web kanalı davranışı veya gelen kutusu yönlendirmesi üzerinde çalışma
summary: WhatsApp kanal desteği, erişim denetimleri, teslim davranışı ve operasyonlar
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T22:16:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffe2fce121dd1230fbcf20d55ec3855beb22c39f80b926eed41bf56183178ab2
    source_path: channels/whatsapp.md
    workflow: 16
---

Durum: WhatsApp Web (Baileys) üzerinden üretime hazır. Gateway bağlı oturumların sahibidir.

## Kurulum (isteğe bağlı)

- Onboarding (`openclaw onboard`) ve `openclaw channels add --channel whatsapp`, ilk kez seçtiğinizde WhatsApp plugin'ini kurmanızı ister.
- `openclaw channels login --channel whatsapp`, plugin henüz mevcut değilse kurulum akışını da sunar.
- Dev kanalı + git checkout: varsayılan olarak yerel plugin yolunu kullanır.
- Stable/Beta: geçerli resmi release etiketindeki npm paketi `@openclaw/whatsapp` kullanılır.

Manuel kurulum kullanılmaya devam eder:

```bash
openclaw plugins install @openclaw/whatsapp
```

Geçerli resmi release etiketini takip etmek için çıplak paketi kullanın. Tam bir sürümü yalnızca tekrarlanabilir bir kurulum gerektiğinde sabitleyin.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    Bilinmeyen gönderenler için varsayılan DM ilkesi eşleştirmedir.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım runbook'ları.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/tr/gateway/configuration">
    Tam kanal yapılandırma kalıpları ve örnekleri.
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

    Oturum açmadan önce mevcut/özel bir WhatsApp Web kimlik doğrulama dizinini bağlamak için:

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

## Dağıtım kalıpları

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    Bu, operasyonel açıdan en temiz moddur:

    - OpenClaw için ayrı WhatsApp kimliği
    - daha net DM izin listeleri ve yönlendirme sınırları
    - kendi kendine sohbet karışıklığı olasılığının daha düşük olması

    En küçük ilke kalıbı:

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
    Onboarding, kişisel numara modunu destekler ve kendi kendine sohbet dostu bir temel yazar:

    - `dmPolicy: "allowlist"`
    - `allowFrom` kişisel numaranızı içerir
    - `selfChatMode: true`

    Çalışma zamanında kendi kendine sohbet korumaları, bağlı kendi numaranıza ve `allowFrom` değerine göre çalışır.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Mesajlaşma platformu kanalı, geçerli OpenClaw kanal mimarisinde WhatsApp Web tabanlıdır (`Baileys`).

    Yerleşik sohbet kanalı kayıt defterinde ayrı bir Twilio WhatsApp mesajlaşma kanalı yoktur.

  </Accordion>
</AccordionGroup>

## Çalışma zamanı modeli

- Gateway, WhatsApp soketinin ve yeniden bağlanma döngüsünün sahibidir.
- Yeniden bağlanma watchdog'u yalnızca gelen uygulama mesajı hacmini değil, WhatsApp Web taşıma etkinliğini kullanır; bu yüzden sessiz bir bağlı cihaz oturumu sırf yakın zamanda kimse mesaj göndermedi diye yeniden başlatılmaz. Daha uzun bir uygulama sessizliği sınırı, taşıma çerçeveleri gelmeye devam etse bile watchdog penceresi boyunca hiçbir uygulama mesajı işlenmezse yine de yeniden bağlanmayı zorlar; yakın zamanda etkin olmuş bir oturum için geçici bir yeniden bağlanmadan sonra bu uygulama sessizliği denetimi, ilk kurtarma penceresi için normal mesaj zaman aşımını kullanır.
- Baileys soket zamanlamaları `web.whatsapp.*` altında açıkça belirtilir: `keepAliveIntervalMs` WhatsApp Web uygulama ping'lerini, `connectTimeoutMs` açılış el sıkışması zaman aşımını ve `defaultQueryTimeoutMs` Baileys sorgu zaman aşımlarını denetler.
- Giden gönderimler, hedef hesap için etkin bir WhatsApp dinleyicisi gerektirir.
- Durum ve yayın sohbetleri yok sayılır (`@status`, `@broadcast`).
- Yeniden bağlanma watchdog'u yalnızca gelen uygulama mesajı hacmini değil, WhatsApp Web taşıma etkinliğini izler: sessiz bağlı cihaz oturumları taşıma çerçeveleri devam ettiği sürece ayakta kalır, ancak bir taşıma durması daha sonraki uzak bağlantı kesme yolundan çok önce yeniden bağlanmayı zorlar.
- Doğrudan sohbetler DM oturumu kurallarını kullanır (`session.dmScope`; varsayılan `main`, DM'leri ajanın ana oturumuna daraltır).
- Grup oturumları yalıtılmıştır (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Kanalları/Bültenleri, yerel `@newsletter` JID'leriyle açık giden hedefler olabilir. Giden bülten gönderimleri, DM oturumu semantiği yerine kanal oturumu meta verilerini (`agent:<agentId>:whatsapp:channel:<jid>`) kullanır.
- WhatsApp Web taşıması, Gateway ana makinesindeki standart proxy ortam değişkenlerini (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / küçük harfli varyantlar) dikkate alır. Kanala özel WhatsApp proxy ayarları yerine ana makine düzeyinde proxy yapılandırmasını tercih edin.
- `messages.removeAckAfterReply` etkinleştirildiğinde OpenClaw, görünür bir yanıt teslim edildikten sonra WhatsApp onay tepkisini temizler.

## Plugin hook'ları ve gizlilik

WhatsApp gelen mesajları kişisel mesaj içeriği, telefon numaraları,
grup tanımlayıcıları, gönderen adları ve oturum korelasyon alanları içerebilir. Bu nedenle,
WhatsApp, siz açıkça kabul etmediğiniz sürece gelen `message_received` hook yüklerini plugin'lere yayınlamaz:

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

Kabulü tek bir hesapla sınırlandırabilirsiniz:

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

Bunu yalnızca gelen WhatsApp mesaj içeriğini ve tanımlayıcılarını almasına güvendiğiniz plugin'ler için etkinleştirin.

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` doğrudan sohbet erişimini denetler:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` değerinin `"*"` içermesini gerektirir)
    - `disabled`

    `allowFrom`, E.164 tarzı numaraları kabul eder (dahili olarak normalleştirilir).

    `allowFrom`, bir DM gönderen erişim denetimi listesidir. WhatsApp grup JID'lerine veya `@newsletter` kanal JID'lerine açık giden gönderimleri sınırlamaz.

    Çok hesaplı geçersiz kılma: `channels.whatsapp.accounts.<id>.dmPolicy` (ve `allowFrom`) o hesap için kanal düzeyindeki varsayılanlardan önceliklidir.

    Çalışma zamanı davranış ayrıntıları:

    - eşleştirmeler kanal izin deposunda kalıcı hale getirilir ve yapılandırılmış `allowFrom` ile birleştirilir
    - zamanlanmış otomasyon ve Heartbeat alıcı yedeği açık teslim hedeflerini veya yapılandırılmış `allowFrom` değerini kullanır; DM eşleştirme onayları örtük Cron veya Heartbeat alıcıları değildir
    - izin listesi yapılandırılmamışsa bağlı kendi numarası varsayılan olarak izinlidir
    - OpenClaw, giden `fromMe` DM'lerini (bağlı cihazdan kendinize gönderdiğiniz mesajlar) hiçbir zaman otomatik eşleştirmez

  </Tab>

  <Tab title="Group policy + allowlists">
    Grup erişiminin iki katmanı vardır:

    1. **Grup üyeliği izin listesi** (`channels.whatsapp.groups`)
       - `groups` atlanırsa tüm gruplar uygundur
       - `groups` mevcutsa grup izin listesi görevi görür (`"*"` izinlidir)

    2. **Grup gönderen ilkesi** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: gönderen izin listesi atlanır
       - `allowlist`: gönderen `groupAllowFrom` (veya `*`) ile eşleşmelidir
       - `disabled`: tüm grup gelenlerini engeller

    Gönderen izin listesi yedeği:

    - `groupAllowFrom` ayarlanmamışsa çalışma zamanı, varsa `allowFrom` değerine geri döner
    - gönderen izin listeleri bahsetme/yanıt etkinleştirmesinden önce değerlendirilir

    Not: Hiç `channels.whatsapp` bloğu yoksa çalışma zamanı grup ilkesi yedeği, `channels.defaults.groupPolicy` ayarlanmış olsa bile `allowlist` olur (uyarı günlüğüyle).

  </Tab>

  <Tab title="Mentions + /activation">
    Grup yanıtları varsayılan olarak bahsetme gerektirir.

    Bahsetme algılama şunları içerir:

    - bot kimliğine açık WhatsApp bahsetmeleri
    - yapılandırılmış bahsetme regex kalıpları (`agents.list[].groupChat.mentionPatterns`, yedek `messages.groupChat.mentionPatterns`)
    - yetkili grup mesajları için gelen sesli not transkriptleri
    - örtük bota yanıt algılama (yanıt gönderen bot kimliğiyle eşleşir)

    Güvenlik notu:

    - alıntı/yanıt yalnızca bahsetme geçidini karşılar; gönderen yetkilendirmesi **vermez**
    - `groupPolicy: "allowlist"` ile, izin listesinde olmayan gönderenler izin listesindeki bir kullanıcının mesajına yanıt verseler bile yine engellenir

    Oturum düzeyinde etkinleştirme komutu:

    - `/activation mention`
    - `/activation always`

    `activation`, oturum durumunu günceller (küresel yapılandırmayı değil). Sahip denetimlidir.

  </Tab>
</Tabs>

## Kişisel numara ve kendi kendine sohbet davranışı

Bağlı kendi numarası `allowFrom` içinde de mevcut olduğunda WhatsApp kendi kendine sohbet korumaları etkinleşir:

- kendi kendine sohbet dönüşleri için okundu bilgilerini atlar
- aksi halde kendinizi ping'leyecek bahsetme JID otomatik tetikleme davranışını yok sayar
- `messages.responsePrefix` ayarlanmamışsa kendi kendine sohbet yanıtları varsayılan olarak `[{identity.name}]` veya `[openclaw]` olur

## Mesaj normalleştirme ve bağlam

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    Gelen WhatsApp mesajları paylaşılan gelen zarf içinde sarmalanır.

    Alıntılanmış bir yanıt varsa bağlam şu biçimde eklenir:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Yanıt meta veri alanları da mevcut olduğunda doldurulur (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, gönderen JID/E.164).
    Alıntılanan yanıt hedefi indirilebilir medya olduğunda OpenClaw bunu
    normal gelen medya deposu üzerinden kaydeder ve `MediaPath`/`MediaType` olarak
    açığa çıkarır; böylece ajan yalnızca `<media:image>` görmek yerine
    başvurulan görseli inceleyebilir.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Yalnızca medya içeren gelen mesajlar şu tür yer tutucularla normalleştirilir:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Yetkili grup sesli notları, gövde yalnızca `<media:audio>` olduğunda bahsetme geçidinden önce yazıya dökülür; böylece sesli notta bot bahsetmesini söylemek
    yanıtı tetikleyebilir. Transkript yine de bottan bahsetmiyorsa,
    ham yer tutucu yerine bekleyen grup geçmişinde tutulur.

    Konum gövdeleri kısa koordinat metni kullanır. Konum etiketleri/yorumları ve kişi/vCard ayrıntıları satır içi prompt metni olarak değil, çitlenmiş güvenilmeyen meta veri olarak işlenir.

  </Accordion>

  <Accordion title="Pending group history injection">
    Gruplar için işlenmemiş mesajlar tamponlanabilir ve bot en sonunda tetiklendiğinde bağlam olarak eklenebilir.

    - varsayılan sınır: `50`
    - yapılandırma: `channels.whatsapp.historyLimit`
    - yedek: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    Ekleme işaretleyicileri:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Kabul edilen gelen WhatsApp mesajları için okundu bilgileri varsayılan olarak etkindir.

    Küresel olarak devre dışı bırakın:

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

## Teslimat, parçalara ayırma ve medya

<AccordionGroup>
  <Accordion title="Metni parçalara ayırma">
    - varsayılan parça sınırı: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` modu paragraf sınırlarını (boş satırlar) tercih eder, ardından uzunluk açısından güvenli parçalara ayırmaya geri döner

  </Accordion>

  <Accordion title="Giden medya davranışı">
    - görüntü, video, ses (PTT ses notu) ve belge yüklerini destekler
    - ses medyası Baileys `audio` yükü üzerinden `ptt: true` ile gönderilir; böylece WhatsApp istemcileri bunu bas-konuş ses notu olarak işler
    - yanıt yükleri `audioAsVoice` değerini korur; WhatsApp için TTS ses notu çıktısı, sağlayıcı MP3 veya WebM döndürse bile bu PTT yolunda kalır
    - yerel Ogg/Opus sesi, ses notu uyumluluğu için `audio/ogg; codecs=opus` olarak gönderilir
    - Microsoft Edge TTS MP3/WebM çıktısı dahil Ogg olmayan sesler, PTT teslimatından önce `ffmpeg` ile 48 kHz mono Ogg/Opus biçimine dönüştürülür
    - `/tts latest` en son asistan yanıtını tek bir ses notu olarak gönderir ve aynı yanıt için tekrar gönderimleri bastırır; `/tts chat on|off|default` geçerli WhatsApp sohbeti için otomatik TTS'yi denetler
    - animasyonlu GIF oynatma, video gönderimlerinde `gifPlayback: true` ile desteklenir
    - çoklu medya yanıt yükleri gönderilirken altyazılar ilk medya öğesine uygulanır; ancak PTT ses notları sesi önce, görünür metni ayrı gönderir çünkü WhatsApp istemcileri ses notu altyazılarını tutarlı şekilde işlemez
    - medya kaynağı HTTP(S), `file://` veya yerel yollar olabilir

  </Accordion>

  <Accordion title="Medya boyutu sınırları ve geri dönüş davranışı">
    - gelen medya kaydetme üst sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - giden medya gönderme üst sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - hesap başına geçersiz kılmalar `channels.whatsapp.accounts.<accountId>.mediaMaxMb` kullanır
    - görüntüler sınırlara sığacak şekilde otomatik optimize edilir (yeniden boyutlandırma/kalite taraması)
    - medya gönderme hatasında, ilk öğe geri dönüşü yanıtı sessizce düşürmek yerine metin uyarısı gönderir

  </Accordion>
</AccordionGroup>

## Yanıt alıntılama

WhatsApp yerel yanıt alıntılamayı destekler; bu özellikte giden yanıtlar gelen mesajı görünür şekilde alıntılar. Bunu `channels.whatsapp.replyToMode` ile denetleyin.

| Değer       | Davranış                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Asla alıntılama; düz mesaj olarak gönder                              |
| `"first"`   | Yalnızca ilk giden yanıt parçasını alıntıla                           |
| `"all"`     | Her giden yanıt parçasını alıntıla                                    |
| `"batched"` | Hemen gönderilen yanıtları alıntısız bırakırken kuyruktaki toplu yanıtları alıntıla |

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

`channels.whatsapp.reactionLevel`, ajanın WhatsApp üzerinde emoji tepkilerini ne kadar geniş kullanacağını denetler:

| Düzey         | Onay tepkileri | Ajan tarafından başlatılan tepkiler | Açıklama                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | Hayır         | Hayır                     | Hiç tepki yok                                  |
| `"ack"`       | Evet          | Hayır                     | Yalnızca onay tepkileri (yanıt öncesi alındı onayı) |
| `"minimal"`   | Evet          | Evet (temkinli)           | Temkinli yönlendirmeyle onay + ajan tepkileri |
| `"extensive"` | Evet          | Evet (teşvik edilir)      | Teşvik edilen yönlendirmeyle onay + ajan tepkileri |

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

WhatsApp, `channels.whatsapp.ackReaction` aracılığıyla gelen alındı anında hemen onay tepkilerini destekler.
Onay tepkileri `reactionLevel` tarafından kapılanır — `reactionLevel` `"off"` olduğunda bastırılır.

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
- hatalar günlüğe kaydedilir ancak normal yanıt teslimatını engellemez
- grup modu `mentions`, bahsetme ile tetiklenen turlarda tepki verir; grup etkinleştirme `always` bu denetim için atlama olarak davranır
- WhatsApp `channels.whatsapp.ackReaction` kullanır (eski `messages.ackReaction` burada kullanılmaz)

## Çoklu hesap ve kimlik bilgileri

<AccordionGroup>
  <Accordion title="Hesap seçimi ve varsayılanlar">
    - hesap kimlikleri `channels.whatsapp.accounts` içinden gelir
    - varsayılan hesap seçimi: varsa `default`, yoksa ilk yapılandırılmış hesap kimliği (sıralanmış)
    - hesap kimlikleri arama için dahili olarak normalleştirilir

  </Accordion>

  <Accordion title="Kimlik bilgisi yolları ve eski uyumluluk">
    - geçerli kimlik doğrulama yolu: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - yedek dosya: `creds.json.bak`
    - `~/.openclaw/credentials/` içindeki eski varsayılan kimlik doğrulaması, varsayılan hesap akışları için hâlâ tanınır/taşınır

  </Accordion>

  <Accordion title="Oturum kapatma davranışı">
    `openclaw channels logout --channel whatsapp [--account <id>]`, o hesap için WhatsApp kimlik doğrulama durumunu temizler.

    Bir Gateway'e erişilebildiğinde, oturum kapatma önce seçili hesap için canlı WhatsApp dinleyicisini durdurur; böylece bağlı oturum bir sonraki yeniden başlatmaya kadar mesaj almaya devam etmez. `openclaw channels remove --channel whatsapp` da hesap yapılandırmasını devre dışı bırakmadan veya silmeden önce canlı dinleyiciyi durdurur.

    Eski kimlik doğrulama dizinlerinde, Baileys kimlik doğrulama dosyaları kaldırılırken `oauth.json` korunur.

  </Accordion>
</AccordionGroup>

## Araçlar, eylemler ve yapılandırma yazmaları

- Ajan araç desteği WhatsApp tepki eylemini (`react`) içerir.
- Eylem kapıları:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Kanal tarafından başlatılan yapılandırma yazmaları varsayılan olarak etkindir (`channels.whatsapp.configWrites=false` ile devre dışı bırakılır).

## Sorun giderme

<AccordionGroup>
  <Accordion title="Bağlı değil (QR gerekli)">
    Belirti: kanal durumu bağlı olmadığını bildirir.

    Çözüm:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Bağlı ancak bağlantı kesik / yeniden bağlanma döngüsü">
    Belirti: bağlı hesapta tekrarlanan bağlantı kesilmeleri veya yeniden bağlanma girişimleri.

    Sessiz hesaplar normal ileti zaman aşımını geçtikten sonra da bağlı kalabilir; watchdog,
    WhatsApp Web taşıma etkinliği durduğunda, soket kapandığında veya
    uygulama düzeyi etkinlik daha uzun güvenlik penceresinin ötesinde sessiz kaldığında yeniden başlatılır.

    Günlükler tekrarlanan `status=408 Request Time-out Connection was lost` gösteriyorsa,
    `web.whatsapp` altında Baileys soket zamanlamalarını ayarlayın. Önce
    `keepAliveIntervalMs` değerini ağınızın boşta kalma zaman aşımının altına düşürün ve yavaş
    ya da kayıplı bağlantılarda `connectTimeoutMs` değerini artırın:

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

    Çözüm:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    `~/.openclaw/logs/whatsapp-health.log`, `Gateway inactive` diyorsa ancak
    `openclaw gateway status` ve `openclaw channels status --probe` Gateway'in
    ve WhatsApp'ın sağlıklı olduğunu gösteriyorsa `openclaw doctor` çalıştırın. Linux'ta doctor,
    hâlâ `~/.openclaw/bin/ensure-whatsapp.sh` çağıran eski crontab girdileri
    hakkında uyarır; bu eski girdileri `crontab -e` ile kaldırın çünkü cron,
    systemd kullanıcı veri yolu ortamından yoksun olabilir ve bu eski betiğin
    Gateway sağlığını yanlış raporlamasına neden olabilir.

    Gerekirse `channels login` ile yeniden bağlayın.

  </Accordion>

  <Accordion title="QR oturum açma bir proxy arkasında zaman aşımına uğruyor">
    Belirti: `openclaw channels login --channel whatsapp`, kullanılabilir bir QR kodu göstermeden önce `status=408 Request Time-out` veya TLS soket bağlantısı kesilmesiyle başarısız olur.

    WhatsApp Web oturum açma, Gateway ana makinesinin standart proxy ortamını (`HTTPS_PROXY`, `HTTP_PROXY`, küçük harfli varyantlar ve `NO_PROXY`) kullanır. Gateway sürecinin proxy ortamını devraldığını ve `NO_PROXY` değerinin `mmg.whatsapp.net` ile eşleşmediğini doğrulayın.

  </Accordion>

  <Accordion title="Gönderirken etkin dinleyici yok">
    Hedef hesap için etkin bir Gateway dinleyicisi yoksa giden gönderimler hızlıca başarısız olur.

    Gateway'in çalıştığından ve hesabın bağlı olduğundan emin olun.

  </Accordion>

  <Accordion title="Yanıt transkriptte görünüyor ancak WhatsApp'ta görünmüyor">
    Transkript satırları ajanın ürettiği şeyi kaydeder. WhatsApp teslimi ayrı olarak kontrol edilir: OpenClaw, bir otomatik yanıtı yalnızca Baileys en az bir görünür metin veya medya gönderimi için giden ileti kimliği döndürdükten sonra gönderilmiş kabul eder.

    Onay tepkileri bağımsız ön yanıt alındılarıdır. Başarılı bir tepki, daha sonraki metin veya medya yanıtının WhatsApp tarafından kabul edildiğini kanıtlamaz.

    Gateway günlüklerinde `auto-reply delivery failed` veya `auto-reply was not accepted by WhatsApp provider` olup olmadığını kontrol edin.

  </Accordion>

  <Accordion title="Grup iletileri beklenmedik şekilde yok sayılıyor">
    Şu sırayla kontrol edin:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` izin listesi girdileri
    - bahsetme geçitlemesi (`requireMention` + bahsetme desenleri)
    - `openclaw.json` (JSON5) içinde yinelenen anahtarlar: sonraki girdiler öncekileri geçersiz kılar, bu yüzden kapsam başına tek bir `groupPolicy` tutun

  </Accordion>

  <Accordion title="Bun çalışma zamanı uyarısı">
    WhatsApp Gateway çalışma zamanı Node kullanmalıdır. Bun, kararlı WhatsApp/Telegram Gateway işlemi için uyumsuz olarak işaretlenir.
  </Accordion>
</AccordionGroup>

## Sistem istemleri

WhatsApp, `groups` ve `direct` haritaları aracılığıyla gruplar ve doğrudan sohbetler için Telegram tarzı sistem istemlerini destekler.

Grup iletileri için çözümleme hiyerarşisi:

Etkin `groups` haritası önce belirlenir: hesap kendi `groups` haritasını tanımlıyorsa, kök `groups` haritasını tamamen değiştirir (derin birleştirme yoktur). İstem araması daha sonra ortaya çıkan tek harita üzerinde çalışır:

1. **Gruba özgü sistem istemi** (`groups["<groupId>"].systemPrompt`): belirli grup girdisi haritada mevcut olduğunda **ve** `systemPrompt` anahtarı tanımlı olduğunda kullanılır. `systemPrompt` boş bir dizeyse (`""`), joker bastırılır ve hiçbir sistem istemi uygulanmaz.
2. **Grup joker sistem istemi** (`groups["*"].systemPrompt`): belirli grup girdisi haritada tamamen yoksa veya mevcut olup `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

Doğrudan iletiler için çözümleme hiyerarşisi:

Etkin `direct` haritası önce belirlenir: hesap kendi `direct` haritasını tanımlıyorsa, kök `direct` haritasını tamamen değiştirir (derin birleştirme yoktur). İstem araması daha sonra ortaya çıkan tek harita üzerinde çalışır:

1. **Doğrudan kişiye özgü sistem istemi** (`direct["<peerId>"].systemPrompt`): belirli eş girdisi haritada mevcut olduğunda **ve** `systemPrompt` anahtarı tanımlı olduğunda kullanılır. `systemPrompt` boş bir dizeyse (`""`), joker bastırılır ve hiçbir sistem istemi uygulanmaz.
2. **Doğrudan joker sistem istemi** (`direct["*"].systemPrompt`): belirli eş girdisi haritada tamamen yoksa veya mevcut olup `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

<Note>
`dms`, DM başına hafif geçmiş geçersiz kılma kovası olarak kalır (`dms.<id>.historyLimit`). İstem geçersiz kılmaları `direct` altında bulunur.
</Note>

**Telegram çok hesaplı davranışından farkı:** Telegram’da, çok hesaplı bir kurulumda kök `groups`, bir botun ait olmadığı gruplardan grup iletileri almasını önlemek için tüm hesaplarda bilinçli olarak bastırılır; kendi `groups` değerini tanımlamayan hesaplarda bile. WhatsApp bu korumayı uygulamaz: kaç hesap yapılandırılmış olursa olsun, hesap düzeyinde geçersiz kılma tanımlamayan hesaplar kök `groups` ve kök `direct` değerlerini her zaman devralır. Çok hesaplı bir WhatsApp kurulumunda hesap başına grup veya doğrudan istemler istiyorsanız kök düzey varsayılanlara güvenmek yerine tam eşlemeyi her hesabın altında açıkça tanımlayın.

Önemli davranış:

- `channels.whatsapp.groups` hem grup başına yapılandırma eşlemesi hem de sohbet düzeyinde grup izin verilenler listesidir. Kök veya hesap kapsamının herhangi birinde `groups["*"]`, o kapsam için "tüm gruplar kabul edilir" anlamına gelir.
- Joker grup `systemPrompt` değerini yalnızca o kapsamın tüm grupları kabul etmesini zaten istiyorsanız ekleyin. Yine de yalnızca sabit bir grup kimliği kümesinin uygun olmasını istiyorsanız istem varsayılanı için `groups["*"]` kullanmayın. Bunun yerine istemi açıkça izin verilenler listesine eklenmiş her grup girdisinde tekrarlayın.
- Grup kabulü ve gönderen yetkilendirmesi ayrı denetimlerdir. `groups["*"]`, grup işlemeye ulaşabilecek grup kümesini genişletir, ancak tek başına bu gruplardaki her göndereni yetkilendirmez. Gönderen erişimi hâlâ `channels.whatsapp.groupPolicy` ve `channels.whatsapp.groupAllowFrom` tarafından ayrı olarak denetlenir.
- `channels.whatsapp.direct`, DM’ler için aynı yan etkiye sahip değildir. `direct["*"]`, yalnızca bir DM `dmPolicy` ile birlikte `allowFrom` veya eşleştirme deposu kuralları tarafından zaten kabul edildikten sonra varsayılan bir doğrudan sohbet yapılandırması sağlar.

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

Yüksek sinyalli WhatsApp alanları:

- erişim: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- teslim: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- çok hesaplı: `accounts.<id>.enabled`, `accounts.<id>.authDir`, hesap düzeyi geçersiz kılmalar
- işlemler: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- oturum davranışı: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- istemler: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Güvenlik](/tr/gateway/security)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Çoklu aracı yönlendirme](/tr/concepts/multi-agent)
- [Sorun giderme](/tr/channels/troubleshooting)
