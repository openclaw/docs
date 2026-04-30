---
read_when:
    - WhatsApp/web kanalı davranışı veya gelen kutusu yönlendirmesi üzerinde çalışma
summary: WhatsApp kanal desteği, erişim denetimleri, iletim davranışı ve operasyonlar
title: WhatsApp
x-i18n:
    generated_at: "2026-04-30T09:09:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d0268e068de0001a11a6ed87fe70df8e685d1dcc87c8142ee5b3c77d7a727f3
    source_path: channels/whatsapp.md
    workflow: 16
---

Durum: WhatsApp Web (Baileys) üzerinden üretime hazır. Gateway bağlı oturum(lar)a sahiptir.

## Kurulum (isteğe bağlı)

- Onboarding (`openclaw onboard`) ve `openclaw channels add --channel whatsapp`, ilk kez seçtiğinizde WhatsApp Plugin kurmanızı ister.
- `openclaw channels login --channel whatsapp`, Plugin henüz mevcut değilse kurulum akışını da sunar.
- Geliştirme kanalı + git checkout: varsayılan olarak yerel Plugin yolunu kullanır.
- Stable/Beta: güncel bir paket yayımlandığında npm paketi `@openclaw/whatsapp` kullanılır.

Manuel kurulum kullanılabilir kalır:

```bash
openclaw plugins install @openclaw/whatsapp
```

npm, OpenClaw tarafından sahip olunan paketi kullanımdan kaldırılmış veya eksik olarak bildirirse, npm paket hattı yetişene kadar güncel paketlenmiş bir OpenClaw derlemesi ya da yerel bir checkout kullanın.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    Bilinmeyen gönderenler için varsayılan DM ilkesi eşleştirmedir.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım çalışma kılavuzları.
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

    Oturum açmadan önce mevcut/özel bir WhatsApp Web kimlik doğrulama dizini eklemek için:

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
OpenClaw, mümkün olduğunda WhatsApp’ı ayrı bir numarada çalıştırmanızı önerir. (Kanal meta verileri ve kurulum akışı bu kurulum için optimize edilmiştir, ancak kişisel numara kurulumları da desteklenir.)
</Note>

## Dağıtım kalıpları

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
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

  <Accordion title="Personal-number fallback">
    Onboarding kişisel numara modunu destekler ve kendi kendine sohbet dostu bir temel yazar:

    - `dmPolicy: "allowlist"`
    - `allowFrom` kişisel numaranızı içerir
    - `selfChatMode: true`

    Çalışma zamanında, kendi kendine sohbet korumaları bağlı öz numara ve `allowFrom` üzerinden anahtarlanır.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Mesajlaşma platformu kanalı, mevcut OpenClaw kanal mimarisinde WhatsApp Web tabanlıdır (`Baileys`).

    Yerleşik sohbet kanalı kayıt defterinde ayrı bir Twilio WhatsApp mesajlaşma kanalı yoktur.

  </Accordion>
</AccordionGroup>

## Çalışma zamanı modeli

- Gateway WhatsApp soketine ve yeniden bağlanma döngüsüne sahiptir.
- Yeniden bağlanma watchdog’u yalnızca gelen uygulama iletisi hacmini değil, WhatsApp Web aktarım etkinliğini kullanır; bu nedenle sessiz bir bağlı cihaz oturumu, sırf yakın zamanda kimse ileti göndermedi diye yeniden başlatılmaz. Daha uzun bir uygulama sessizliği üst sınırı, aktarım çerçeveleri gelmeye devam etse de watchdog penceresi boyunca hiçbir uygulama iletisi işlenmezse yine de yeniden bağlanmayı zorlar; yakın zamanda etkin olan bir oturum için geçici bir yeniden bağlanmadan sonra bu uygulama sessizliği denetimi, ilk kurtarma penceresi için normal ileti zaman aşımını kullanır.
- Baileys soket zamanlamaları `web.whatsapp.*` altında açıktır: `keepAliveIntervalMs` WhatsApp Web uygulama pinglerini, `connectTimeoutMs` açılış el sıkışması zaman aşımını ve `defaultQueryTimeoutMs` Baileys sorgu zaman aşımlarını kontrol eder.
- Giden gönderimler, hedef hesap için etkin bir WhatsApp dinleyicisi gerektirir.
- Durum ve yayın sohbetleri yok sayılır (`@status`, `@broadcast`).
- Yeniden bağlanma watchdog’u yalnızca gelen uygulama iletisi hacmini değil, WhatsApp Web aktarım etkinliğini izler: sessiz bağlı cihaz oturumları aktarım çerçeveleri devam ederken açık kalır, ancak aktarım duraklaması daha sonraki uzak bağlantı kesme yolundan çok önce yeniden bağlanmayı zorlar.
- Doğrudan sohbetler DM oturum kurallarını kullanır (`session.dmScope`; varsayılan `main`, DM’leri ajan ana oturumuna daraltır).
- Grup oturumları yalıtılmıştır (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Web aktarımı, Gateway ana makinesindeki standart proxy ortam değişkenlerine uyar (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / küçük harfli varyantlar). Kanala özgü WhatsApp proxy ayarları yerine ana makine düzeyinde proxy yapılandırmasını tercih edin.
- `messages.removeAckAfterReply` etkinleştirildiğinde, OpenClaw görünür bir yanıt teslim edildikten sonra WhatsApp onay tepkisini temizler.

## Plugin kancaları ve gizlilik

WhatsApp gelen iletileri kişisel ileti içeriği, telefon numaraları, grup tanımlayıcıları, gönderen adları ve oturum korelasyon alanları içerebilir. Bu nedenle WhatsApp, açıkça katılmayı seçmediğiniz sürece gelen `message_received` kanca yüklerini Plugin’lere yayınlamaz:

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

Katılımı tek bir hesaba kapsamlayabilirsiniz:

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

Bunu yalnızca gelen WhatsApp ileti içeriğini ve tanımlayıcılarını almasına güvendiğiniz Plugin’ler için etkinleştirin.

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` doğrudan sohbet erişimini kontrol eder:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` değerinin `"*"` içermesini gerektirir)
    - `disabled`

    `allowFrom`, E.164 tarzı numaraları kabul eder (içeride normalize edilir).

    Çoklu hesap geçersiz kılması: `channels.whatsapp.accounts.<id>.dmPolicy` (ve `allowFrom`), o hesap için kanal düzeyi varsayılanlara göre önceliklidir.

    Çalışma zamanı davranışı ayrıntıları:

    - eşleştirmeler kanal izin deposunda kalıcı hale getirilir ve yapılandırılmış `allowFrom` ile birleştirilir
    - hiçbir izin listesi yapılandırılmamışsa, bağlı öz numaraya varsayılan olarak izin verilir
    - OpenClaw giden `fromMe` DM’lerini (bağlı cihazdan kendinize gönderdiğiniz iletiler) asla otomatik eşleştirmez

  </Tab>

  <Tab title="Group policy + allowlists">
    Grup erişiminin iki katmanı vardır:

    1. **Grup üyeliği izin listesi** (`channels.whatsapp.groups`)
       - `groups` atlanırsa tüm gruplar uygundur
       - `groups` mevcutsa grup izin listesi gibi davranır (`"*"` izinlidir)

    2. **Grup gönderen ilkesi** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: gönderen izin listesi atlanır
       - `allowlist`: gönderen `groupAllowFrom` (veya `*`) ile eşleşmelidir
       - `disabled`: tüm grup gelenlerini engelle

    Gönderen izin listesi yedeği:

    - `groupAllowFrom` ayarlanmamışsa, çalışma zamanı mevcut olduğunda `allowFrom` değerine geri döner
    - gönderen izin listeleri mention/yanıt etkinleştirmesinden önce değerlendirilir

    Not: hiç `channels.whatsapp` bloğu yoksa, çalışma zamanı grup ilkesi yedeği, `channels.defaults.groupPolicy` ayarlanmış olsa bile `allowlist` olur (uyarı günlüğüyle).

  </Tab>

  <Tab title="Mentions + /activation">
    Grup yanıtları varsayılan olarak mention gerektirir.

    Mention algılama şunları içerir:

    - bot kimliğine açık WhatsApp mention’ları
    - yapılandırılmış mention regex kalıpları (`agents.list[].groupChat.mentionPatterns`, yedek `messages.groupChat.mentionPatterns`)
    - yetkili grup iletileri için gelen sesli not transcript’leri
    - örtük bota-yanıt algılama (yanıt gönderen bot kimliğiyle eşleşir)

    Güvenlik notu:

    - alıntı/yanıt yalnızca mention kapısını karşılar; gönderen yetkilendirmesi vermez
    - `groupPolicy: "allowlist"` ile, izin listesinde olmayan gönderenler, izin listesinde olan bir kullanıcının iletisine yanıt verseler bile yine de engellenir

    Oturum düzeyi etkinleştirme komutu:

    - `/activation mention`
    - `/activation always`

    `activation` oturum durumunu günceller (küresel yapılandırmayı değil). Sahip kapılıdır.

  </Tab>
</Tabs>

## Kişisel numara ve kendi kendine sohbet davranışı

Bağlı öz numara `allowFrom` içinde de mevcut olduğunda, WhatsApp kendi kendine sohbet korumaları etkinleşir:

- kendi kendine sohbet dönüşleri için okundu bilgilerini atla
- aksi takdirde kendinize ping atacak mention-JID otomatik tetikleme davranışını yok say
- `messages.responsePrefix` ayarlanmamışsa, kendi kendine sohbet yanıtları varsayılan olarak `[{identity.name}]` veya `[openclaw]` olur

## İleti normalleştirme ve bağlam

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    Gelen WhatsApp iletileri paylaşılan gelen zarf içinde sarılır.

    Alıntılanmış bir yanıt varsa, bağlam şu biçimde eklenir:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Yanıt meta veri alanları da mevcut olduğunda doldurulur (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, gönderen JID/E.164).

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Yalnızca medya içeren gelen iletiler şu tür yer tutucularla normalleştirilir:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Yetkili grup sesli notları, gövde yalnızca `<media:audio>` olduğunda mention kapısından önce transkribe edilir; bu nedenle sesli notta bot mention’ını söylemek yanıtı tetikleyebilir. Transcript yine de botu mention etmiyorsa, ham yer tutucu yerine bekleyen grup geçmişinde tutulur.

    Konum gövdeleri kısa koordinat metni kullanır. Konum etiketleri/yorumları ve kişi/vCard ayrıntıları, satır içi prompt metni olarak değil, çitli güvenilmeyen meta veri olarak işlenir.

  </Accordion>

  <Accordion title="Pending group history injection">
    Gruplar için işlenmemiş iletiler ara belleğe alınabilir ve bot nihayet tetiklendiğinde bağlam olarak enjekte edilebilir.

    - varsayılan sınır: `50`
    - yapılandırma: `channels.whatsapp.historyLimit`
    - yedek: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    Enjeksiyon işaretçileri:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Okundu bilgileri, kabul edilen gelen WhatsApp iletileri için varsayılan olarak etkindir.

    Küresel olarak devre dışı bırakma:

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

    Kendi kendine sohbet dönüşleri, küresel olarak etkin olsa bile okundu bilgilerini atlar.

  </Accordion>
</AccordionGroup>

## Teslimat, parçalama ve medya

<AccordionGroup>
  <Accordion title="Text chunking">
    - varsayılan parça sınırı: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` modu paragraf sınırlarını (boş satırlar) tercih eder, ardından uzunluk açısından güvenli parçalamaya geri döner

  </Accordion>

  <Accordion title="Giden medya davranışı">
    - görüntü, video, ses (PTT sesli not) ve belge yüklerini destekler
    - ses medyası, Baileys `audio` yükü üzerinden `ptt: true` ile gönderilir; böylece WhatsApp istemcileri bunu bas-konuş sesli notu olarak işler
    - yanıt yükleri `audioAsVoice` değerini korur; WhatsApp için TTS sesli not çıktısı, sağlayıcı MP3 veya WebM döndürse bile bu PTT yolunda kalır
    - yerel Ogg/Opus sesi, sesli not uyumluluğu için `audio/ogg; codecs=opus` olarak gönderilir
    - Microsoft Edge TTS MP3/WebM çıktısı dahil Ogg olmayan sesler, PTT tesliminden önce `ffmpeg` ile 48 kHz mono Ogg/Opus biçimine dönüştürülür
    - `/tts latest`, en son asistan yanıtını tek bir sesli not olarak gönderir ve aynı yanıt için tekrar gönderimleri bastırır; `/tts chat on|off|default`, geçerli WhatsApp sohbeti için otomatik TTS'yi denetler
    - animasyonlu GIF oynatma, video gönderimlerinde `gifPlayback: true` ile desteklenir
    - çoklu medya yanıt yükleri gönderilirken altyazılar ilk medya öğesine uygulanır; ancak PTT sesli notları, WhatsApp istemcileri sesli not altyazılarını tutarlı biçimde işlemediği için sesi önce, görünür metni ayrı gönderir
    - medya kaynağı HTTP(S), `file://` veya yerel yollar olabilir

  </Accordion>

  <Accordion title="Medya boyutu sınırları ve geri dönüş davranışı">
    - gelen medya kaydetme sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - giden medya gönderme sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
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
| `"batched"` | Anlık yanıtları alıntılamadan bırakırken kuyruğa alınmış toplu yanıtları alıntıla |

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

`channels.whatsapp.reactionLevel`, agent'ın WhatsApp üzerinde emoji tepkilerini ne kadar geniş kapsamda kullanacağını denetler:

| Düzey         | Ack tepkileri | Agent tarafından başlatılan tepkiler | Açıklama                                      |
| ------------- | ------------- | ------------------------------------ | -------------------------------------------- |
| `"off"`       | Hayır         | Hayır                                | Hiç tepki yok                                |
| `"ack"`       | Evet          | Hayır                                | Yalnızca ack tepkileri (yanıt öncesi alındı bilgisi) |
| `"minimal"`   | Evet          | Evet (muhafazakar)                   | Muhafazakar yönlendirmeyle ack + agent tepkileri |
| `"extensive"` | Evet          | Evet (teşvik edilir)                 | Teşvik edilen yönlendirmeyle ack + agent tepkileri |

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

WhatsApp, `channels.whatsapp.ackReaction` üzerinden gelen alındığında anlık ack tepkilerini destekler.
Ack tepkileri `reactionLevel` tarafından kapılanır — `reactionLevel` `"off"` olduğunda bastırılır.

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
- hatalar günlüğe yazılır ancak normal yanıt teslimini engellemez
- grup modu `mentions`, bahsetme ile tetiklenen turlarda tepki verir; grup etkinleştirme `always`, bu denetim için atlama yolu olarak davranır
- WhatsApp `channels.whatsapp.ackReaction` kullanır (eski `messages.ackReaction` burada kullanılmaz)

## Çoklu hesap ve kimlik bilgileri

<AccordionGroup>
  <Accordion title="Hesap seçimi ve varsayılanlar">
    - hesap kimlikleri `channels.whatsapp.accounts` öğesinden gelir
    - varsayılan hesap seçimi: varsa `default`, yoksa ilk yapılandırılmış hesap kimliği (sıralanmış)
    - hesap kimlikleri arama için dahili olarak normalleştirilir

  </Accordion>

  <Accordion title="Kimlik bilgisi yolları ve eski uyumluluk">
    - geçerli kimlik doğrulama yolu: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - yedek dosya: `creds.json.bak`
    - `~/.openclaw/credentials/` içindeki eski varsayılan kimlik doğrulama, varsayılan hesap akışları için hâlâ tanınır/taşınır

  </Accordion>

  <Accordion title="Çıkış davranışı">
    `openclaw channels logout --channel whatsapp [--account <id>]`, ilgili hesap için WhatsApp kimlik doğrulama durumunu temizler.

    Eski kimlik doğrulama dizinlerinde, Baileys kimlik doğrulama dosyaları kaldırılırken `oauth.json` korunur.

  </Accordion>
</AccordionGroup>

## Araçlar, eylemler ve yapılandırma yazmaları

- Agent araç desteği WhatsApp tepki eylemini (`react`) içerir.
- Eylem kapıları:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Kanal tarafından başlatılan yapılandırma yazmaları varsayılan olarak etkindir (`channels.whatsapp.configWrites=false` ile devre dışı bırakın).

## Sorun giderme

<AccordionGroup>
  <Accordion title="Bağlı değil (QR gerekli)">
    Belirti: kanal durumu bağlı değil olarak raporlanır.

    Düzeltme:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Bağlı ama bağlantısı kesilmiş / yeniden bağlanma döngüsü">
    Belirti: tekrarlanan bağlantı kesilmeleri veya yeniden bağlanma denemeleri olan bağlı hesap.

    Sessiz hesaplar normal mesaj zaman aşımını geçtikten sonra bağlı kalabilir; watchdog
    WhatsApp Web taşıma etkinliği durduğunda, soket kapandığında veya
    uygulama düzeyi etkinlik daha uzun güvenlik penceresini aşacak şekilde sessiz kaldığında yeniden başlatır.

    Günlükler tekrarlanan `status=408 Request Time-out Connection was lost` gösteriyorsa,
    `web.whatsapp` altında Baileys soket zamanlamalarını ayarlayın. Önce
    `keepAliveIntervalMs` değerini ağınızın boşta kalma zaman aşımının altına kısaltın ve
    yavaş ya da kayıplı bağlantılarda `connectTimeoutMs` değerini artırın:

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

    Gerekirse `channels login` ile yeniden bağlayın.

  </Accordion>

  <Accordion title="Proxy arkasında QR girişi zaman aşımına uğruyor">
    Belirti: `openclaw channels login --channel whatsapp`, `status=408 Request Time-out` veya TLS soket bağlantısı kesilmesiyle kullanılabilir bir QR kodu göstermeden önce başarısız olur.

    WhatsApp Web girişi, Gateway ana makinesinin standart proxy ortamını (`HTTPS_PROXY`, `HTTP_PROXY`, küçük harfli varyantlar ve `NO_PROXY`) kullanır. Gateway sürecinin proxy env değerlerini devraldığını ve `NO_PROXY` değerinin `mmg.whatsapp.net` ile eşleşmediğini doğrulayın.

  </Accordion>

  <Accordion title="Gönderirken etkin dinleyici yok">
    Hedef hesap için etkin Gateway dinleyicisi olmadığında giden gönderimler hızlı başarısız olur.

    Gateway'in çalıştığından ve hesabın bağlı olduğundan emin olun.

  </Accordion>

  <Accordion title="Yanıt transkriptte görünüyor ama WhatsApp'ta görünmüyor">
    Transkript satırları agent'ın ne ürettiğini kaydeder. WhatsApp teslimi ayrı denetlenir: OpenClaw, otomatik yanıtı yalnızca Baileys en az bir görünür metin veya medya gönderimi için giden mesaj kimliği döndürdükten sonra gönderilmiş sayar.

    Ack tepkileri bağımsız yanıt öncesi alındı bilgileridir. Başarılı bir tepki, sonraki metin veya medya yanıtının WhatsApp tarafından kabul edildiğini kanıtlamaz.

    Gateway günlüklerinde `auto-reply delivery failed` veya `auto-reply was not accepted by WhatsApp provider` arayın.

  </Accordion>

  <Accordion title="Grup mesajları beklenmedik şekilde yok sayılıyor">
    Şu sırayla kontrol edin:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` izin listesi girdileri
    - bahsetme kapılaması (`requireMention` + bahsetme desenleri)
    - `openclaw.json` içinde yinelenen anahtarlar (JSON5): sonraki girdiler öncekileri geçersiz kılar; bu yüzden kapsam başına tek bir `groupPolicy` tutun

  </Accordion>

  <Accordion title="Bun çalışma zamanı uyarısı">
    WhatsApp Gateway çalışma zamanı Node kullanmalıdır. Bun, kararlı WhatsApp/Telegram Gateway işlemi için uyumsuz olarak işaretlenir.
  </Accordion>
</AccordionGroup>

## Sistem istemleri

WhatsApp, `groups` ve `direct` haritaları üzerinden gruplar ve doğrudan sohbetler için Telegram tarzı sistem istemlerini destekler.

Grup mesajları için çözümleme hiyerarşisi:

Etkili `groups` haritası önce belirlenir: hesap kendi `groups` değerini tanımlıyorsa, kök `groups` haritasını tamamen değiştirir (derin birleştirme yok). İstem araması sonra elde edilen tek haritada çalışır:

1. **Gruba özgü sistem istemi** (`groups["<groupId>"].systemPrompt`): belirli grup girdisi haritada mevcut olduğunda **ve** `systemPrompt` anahtarı tanımlı olduğunda kullanılır. `systemPrompt` boş bir dizeyse (`""`), joker bastırılır ve sistem istemi uygulanmaz.
2. **Grup joker sistem istemi** (`groups["*"].systemPrompt`): belirli grup girdisi haritada tamamen yoksa veya mevcut olup `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

Doğrudan mesajlar için çözümleme hiyerarşisi:

Etkili `direct` haritası önce belirlenir: hesap kendi `direct` değerini tanımlıyorsa, kök `direct` haritasını tamamen değiştirir (derin birleştirme yok). İstem araması sonra elde edilen tek haritada çalışır:

1. **Doğrudan sohbete özgü sistem istemi** (`direct["<peerId>"].systemPrompt`): belirli eş girdisi haritada mevcut olduğunda **ve** `systemPrompt` anahtarı tanımlı olduğunda kullanılır. `systemPrompt` boş bir dizeyse (`""`), joker bastırılır ve sistem istemi uygulanmaz.
2. **Doğrudan sohbet joker sistem istemi** (`direct["*"].systemPrompt`): belirli eş girdisi haritada tamamen yoksa veya mevcut olup `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

<Note>
`dms`, DM başına hafif geçmiş geçersiz kılma kovası olarak kalır (`dms.<id>.historyLimit`). İstem geçersiz kılmaları `direct` altında bulunur.
</Note>

**Telegram çoklu hesap davranışından farkı:** Telegram'da, root `groups`, bir botun ait olmadığı gruplar için grup mesajları almasını önlemek amacıyla çoklu hesap kurulumundaki tüm hesaplar için kasıtlı olarak bastırılır — kendi `groups` değerini tanımlamayan hesaplar dahil. WhatsApp bu korumayı uygulamaz: root `groups` ve root `direct`, kaç hesap yapılandırılmış olursa olsun hesap düzeyinde geçersiz kılma tanımlamayan hesaplar tarafından her zaman devralınır. Çoklu hesaplı bir WhatsApp kurulumunda, hesap başına grup veya doğrudan sohbet istemleri istiyorsanız kök düzey varsayılanlara güvenmek yerine tam haritayı her hesap altında açıkça tanımlayın.

Önemli davranış:

- `channels.whatsapp.groups` hem grup başına yapılandırma haritası hem de sohbet düzeyindeki grup izin listesidir. Kök veya hesap kapsamında, `groups["*"]` o kapsam için "tüm gruplar kabul edilir" anlamına gelir.
- Joker grup `systemPrompt` değerini yalnızca ilgili kapsamın tüm grupları kabul etmesini zaten istiyorsanız ekleyin. Hâlâ yalnızca sabit bir grup kimliği kümesinin uygun olmasını istiyorsanız, istem varsayılanı için `groups["*"]` kullanmayın. Bunun yerine, istemi açıkça izin verilen her grup girdisinde tekrarlayın.
- Grup kabulü ve gönderici yetkilendirmesi ayrı denetimlerdir. `groups["*"]`, grup işlemeye ulaşabilen grup kümesini genişletir, ancak tek başına bu gruplardaki her göndericiyi yetkilendirmez. Gönderici erişimi yine ayrı olarak `channels.whatsapp.groupPolicy` ve `channels.whatsapp.groupAllowFrom` tarafından denetlenir.
- `channels.whatsapp.direct`, DM'ler için aynı yan etkiye sahip değildir. `direct["*"]`, bir DM `dmPolicy` ile birlikte `allowFrom` veya eşleştirme deposu kuralları tarafından zaten kabul edildikten sonra yalnızca varsayılan bir doğrudan sohbet yapılandırması sağlar.

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
- çoklu hesap: `accounts.<id>.enabled`, `accounts.<id>.authDir`, hesap düzeyi geçersiz kılmalar
- işlemler: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- oturum davranışı: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- istemler: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Güvenlik](/tr/gateway/security)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Çok aracılı yönlendirme](/tr/concepts/multi-agent)
- [Sorun giderme](/tr/channels/troubleshooting)
