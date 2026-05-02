---
read_when:
    - WhatsApp/web kanalı davranışı veya gelen kutusu yönlendirmesi üzerinde çalışma
summary: WhatsApp kanal desteği, erişim denetimleri, teslimat davranışı ve operasyonlar
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T08:48:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a38b2338056b55364577c72b643dac28ebb0006cdc61b480555e6079fb71573
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: WhatsApp Web (Baileys) üzerinden üretime hazır. Bağlı oturum(lar) Gateway tarafından yönetilir.

## Kurulum (isteğe bağlı)

- İlk kez seçtiğinizde onboarding (`openclaw onboard`) ve `openclaw channels add --channel whatsapp`
  WhatsApp plugin'ini kurmanızı ister.
- `openclaw channels login --channel whatsapp`, plugin henüz mevcut değilse
  kurulum akışını da sunar.
- Geliştirme kanalı + git checkout: varsayılan olarak yerel plugin yolunu kullanır.
- Stable/Beta: güncel bir paket yayımlandığında npm paketi `@openclaw/whatsapp`
  kullanılır.

Elle kurulum kullanılabilir durumda kalır:

```bash
openclaw plugins install @openclaw/whatsapp
```

npm, OpenClaw'a ait paketi kullanımdan kaldırılmış veya eksik olarak bildirirse,
npm paket hattı yetişene kadar güncel paketlenmiş bir OpenClaw derlemesi ya da
yerel checkout kullanın.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bilinmeyen gönderenler için varsayılan DM ilkesi eşleştirmedir.
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

  <Step title="İlk eşleştirme isteğini onaylayın (eşleştirme modu kullanılıyorsa)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Eşleştirme istekleri 1 saat sonra sona erer. Bekleyen istekler kanal başına 3 ile sınırlıdır.

  </Step>
</Steps>

<Note>
OpenClaw, mümkün olduğunda WhatsApp'ı ayrı bir numarada çalıştırmanızı önerir. (Kanal meta verileri ve kurulum akışı bu kurulum için optimize edilmiştir, ancak kişisel numara kurulumları da desteklenir.)
</Note>

## Dağıtım kalıpları

<AccordionGroup>
  <Accordion title="Ayrılmış numara (önerilen)">
    Bu, operasyonel açıdan en temiz moddur:

    - OpenClaw için ayrı WhatsApp kimliği
    - daha net DM allowlist'leri ve yönlendirme sınırları
    - kendinizle sohbet karışıklığı olasılığının daha düşük olması

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

  <Accordion title="Kişisel numara yedeği">
    Onboarding, kişisel numara modunu destekler ve kendinizle sohbet dostu bir temel yazar:

    - `dmPolicy: "allowlist"`
    - `allowFrom` kişisel numaranızı içerir
    - `selfChatMode: true`

    Çalışma zamanında, kendinizle sohbet korumaları bağlı kendi numarasına ve `allowFrom` değerine göre çalışır.

  </Accordion>

  <Accordion title="Yalnızca WhatsApp Web kanal kapsamı">
    Mesajlaşma platformu kanalı, mevcut OpenClaw kanal mimarisinde WhatsApp Web tabanlıdır (`Baileys`).

    Yerleşik sohbet kanalı kayıt defterinde ayrı bir Twilio WhatsApp mesajlaşma kanalı yoktur.

  </Accordion>
</AccordionGroup>

## Çalışma zamanı modeli

- Gateway, WhatsApp soketini ve yeniden bağlanma döngüsünü yönetir.
- Yeniden bağlanma watchdog'u yalnızca gelen uygulama mesajı hacmini değil, WhatsApp Web taşıma etkinliğini kullanır; bu yüzden sessiz bir bağlı cihaz oturumu, yalnızca yakın zamanda kimse mesaj göndermedi diye yeniden başlatılmaz. Daha uzun bir uygulama sessizliği sınırı, taşıma çerçeveleri gelmeye devam ettiği halde watchdog penceresi boyunca hiçbir uygulama mesajı işlenmezse yine de yeniden bağlanmayı zorlar; yakın zamanda etkin olmuş bir oturum için geçici bir yeniden bağlanmadan sonra bu uygulama sessizliği denetimi, ilk kurtarma penceresi için normal mesaj zaman aşımını kullanır.
- Baileys soket zamanlamaları `web.whatsapp.*` altında açıktır: `keepAliveIntervalMs` WhatsApp Web uygulama ping'lerini, `connectTimeoutMs` açılış el sıkışması zaman aşımını ve `defaultQueryTimeoutMs` Baileys sorgu zaman aşımlarını kontrol eder.
- Giden gönderimler, hedef hesap için etkin bir WhatsApp dinleyicisi gerektirir.
- Durum ve yayın sohbetleri yok sayılır (`@status`, `@broadcast`).
- Yeniden bağlanma watchdog'u yalnızca gelen uygulama mesajı hacmini değil, WhatsApp Web taşıma etkinliğini izler: sessiz bağlı cihaz oturumları taşıma çerçeveleri devam ederken açık kalır, ancak taşıma durması daha sonraki uzak bağlantı kesme yolundan çok önce yeniden bağlanmayı zorlar.
- Doğrudan sohbetler DM oturum kurallarını kullanır (`session.dmScope`; varsayılan `main`, DM'leri ajan ana oturumuna daraltır).
- Grup oturumları yalıtılmıştır (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Web taşıması, gateway ana makinesindeki standart proxy ortam değişkenlerine uyar (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / küçük harfli varyantlar). Kanala özgü WhatsApp proxy ayarları yerine ana makine düzeyinde proxy yapılandırmasını tercih edin.
- `messages.removeAckAfterReply` etkinleştirildiğinde, OpenClaw görünür bir yanıt teslim edildikten sonra WhatsApp onay tepkisini temizler.

## Plugin kancaları ve gizlilik

WhatsApp gelen mesajları kişisel mesaj içeriği, telefon numaraları,
grup tanımlayıcıları, gönderen adları ve oturum korelasyon alanları içerebilir.
Bu nedenle WhatsApp, siz açıkça etkinleştirmediğiniz sürece gelen
`message_received` kanca payload'larını plugin'lere yayınlamaz:

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

Etkinleştirmeyi tek bir hesapla sınırlandırabilirsiniz:

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
güvendiğiniz plugin'ler için etkinleştirin.

## Erişim kontrolü ve etkinleştirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.whatsapp.dmPolicy` doğrudan sohbet erişimini kontrol eder:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` değerinin `"*"` içermesini gerektirir)
    - `disabled`

    `allowFrom`, E.164 tarzı numaraları kabul eder (dahili olarak normalleştirilir).

    Çok hesaplı geçersiz kılma: `channels.whatsapp.accounts.<id>.dmPolicy` (ve `allowFrom`) o hesap için kanal düzeyi varsayılanlardan önceliklidir.

    Çalışma zamanı davranış ayrıntıları:

    - eşleştirmeler kanal allow-store içinde kalıcı tutulur ve yapılandırılmış `allowFrom` ile birleştirilir
    - zamanlanmış otomasyon ve Heartbeat alıcı yedeği, açık teslim hedeflerini veya yapılandırılmış `allowFrom` değerini kullanır; DM eşleştirme onayları örtük Cron ya da Heartbeat alıcıları değildir
    - herhangi bir allowlist yapılandırılmamışsa, bağlı kendi numarası varsayılan olarak izinlidir
    - OpenClaw, giden `fromMe` DM'lerini (bağlı cihazdan kendinize gönderdiğiniz mesajlar) asla otomatik eşleştirmez

  </Tab>

  <Tab title="Grup ilkesi + allowlist'ler">
    Grup erişiminin iki katmanı vardır:

    1. **Grup üyeliği allowlist'i** (`channels.whatsapp.groups`)
       - `groups` atlanırsa tüm gruplar uygundur
       - `groups` mevcutsa grup allowlist'i gibi davranır (`"*"` izinlidir)

    2. **Grup gönderen ilkesi** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: gönderen allowlist'i atlanır
       - `allowlist`: gönderen `groupAllowFrom` (veya `*`) ile eşleşmelidir
       - `disabled`: tüm grup gelenlerini engelle

    Gönderen allowlist yedeği:

    - `groupAllowFrom` ayarlanmamışsa, çalışma zamanı mevcut olduğunda `allowFrom` değerine geri döner
    - gönderen allowlist'leri mention/yanıt etkinleştirmesinden önce değerlendirilir

    Not: hiçbir `channels.whatsapp` bloğu yoksa, `channels.defaults.groupPolicy` ayarlanmış olsa bile çalışma zamanı grup ilkesi yedeği `allowlist` olur (uyarı günlüğüyle).

  </Tab>

  <Tab title="Mention'lar + /activation">
    Grup yanıtları varsayılan olarak mention gerektirir.

    Mention algılama şunları içerir:

    - bot kimliğine açık WhatsApp mention'ları
    - yapılandırılmış mention regex kalıpları (`agents.list[].groupChat.mentionPatterns`, yedek `messages.groupChat.mentionPatterns`)
    - yetkili grup mesajları için gelen sesli not transkriptleri
    - örtük bota-yanıt algılama (yanıt gönderen bot kimliğiyle eşleşir)

    Güvenlik notu:

    - alıntı/yanıt yalnızca mention geçidini karşılar; gönderen yetkilendirmesi **sağlamaz**
    - `groupPolicy: "allowlist"` ile, allowlist'te olmayan gönderenler allowlist'teki bir kullanıcının mesajını yanıtlasalar bile engellenir

    Oturum düzeyi etkinleştirme komutu:

    - `/activation mention`
    - `/activation always`

    `activation`, oturum durumunu günceller (genel yapılandırmayı değil). Sahip kapılıdır.

  </Tab>
</Tabs>

## Kişisel numara ve kendinizle sohbet davranışı

Bağlı kendi numarası `allowFrom` içinde de mevcut olduğunda, WhatsApp kendinizle sohbet korumaları etkinleşir:

- kendinizle sohbet turları için okundu bilgilerini atla
- aksi halde kendinize ping atacak mention-JID otomatik tetikleme davranışını yok say
- `messages.responsePrefix` ayarlanmamışsa, kendinizle sohbet yanıtları varsayılan olarak `[{identity.name}]` veya `[openclaw]` olur

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
    Alıntılanmış yanıt hedefi indirilebilir medya olduğunda, OpenClaw bunu
    normal gelen medya deposu üzerinden kaydeder ve `MediaPath`/`MediaType` olarak
    açığa çıkarır; böylece ajan yalnızca `<media:image>` görmek yerine başvurulan
    görüntüyü inceleyebilir.

  </Accordion>

  <Accordion title="Medya yer tutucuları ve konum/kişi çıkarımı">
    Yalnızca medya içeren gelen mesajlar şu tür yer tutucularla normalleştirilir:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Yetkili grup sesli notları, gövde yalnızca `<media:audio>` olduğunda mention
    geçidinden önce yazıya dökülür; böylece sesli notta bot mention'ını söylemek
    yanıtı tetikleyebilir. Transkript yine de bottan bahsetmiyorsa, transkript
    ham yer tutucu yerine bekleyen grup geçmişinde tutulur.

    Konum gövdeleri kısa koordinat metni kullanır. Konum etiketleri/yorumları ve kişi/vCard ayrıntıları satır içi prompt metni olarak değil, fenced güvenilmeyen meta veri olarak işlenir.

  </Accordion>

  <Accordion title="Bekleyen grup geçmişi enjeksiyonu">
    Gruplar için, işlenmemiş mesajlar tamponlanabilir ve bot en sonunda tetiklendiğinde bağlam olarak enjekte edilebilir.

    - varsayılan sınır: `50`
    - yapılandırma: `channels.whatsapp.historyLimit`
    - yedek: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    Enjeksiyon işaretleri:

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

    Kendinizle sohbet turları, genel olarak etkin olsa bile okundu bilgilerini atlar.

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
    - ses medyası Baileys `audio` yükü üzerinden `ptt: true` ile gönderilir, böylece WhatsApp istemcileri bunu bas-konuş sesli notu olarak işler
    - yanıt yükleri `audioAsVoice` değerini korur; WhatsApp için TTS sesli not çıktısı, sağlayıcı MP3 veya WebM döndürse bile bu PTT yolunda kalır
    - yerel Ogg/Opus sesi, sesli not uyumluluğu için `audio/ogg; codecs=opus` olarak gönderilir
    - Microsoft Edge TTS MP3/WebM çıktısı dahil Ogg olmayan sesler, PTT tesliminden önce `ffmpeg` ile 48 kHz mono Ogg/Opus biçimine dönüştürülür
    - `/tts latest` en son asistan yanıtını tek bir sesli not olarak gönderir ve aynı yanıt için yinelenen gönderimleri bastırır; `/tts chat on|off|default` geçerli WhatsApp sohbeti için otomatik TTS'yi denetler
    - animasyonlu GIF oynatma, video gönderimlerinde `gifPlayback: true` ile desteklenir
    - çoklu medya yanıt yükleri gönderilirken altyazılar ilk medya öğesine uygulanır; ancak PTT sesli notlarda ses önce, görünür metin ayrı gönderilir çünkü WhatsApp istemcileri sesli not altyazılarını tutarlı biçimde işlemez
    - medya kaynağı HTTP(S), `file://` veya yerel yollar olabilir

  </Accordion>

  <Accordion title="Medya boyutu sınırları ve geri dönüş davranışı">
    - gelen medya kaydetme üst sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - giden medya gönderme üst sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - hesap başına geçersiz kılmalar `channels.whatsapp.accounts.<accountId>.mediaMaxMb` kullanır
    - görüntüler sınırlara sığacak şekilde otomatik olarak iyileştirilir (yeniden boyutlandırma/kalite taraması)
    - medya gönderme hatasında, ilk öğe geri dönüşü yanıtı sessizce düşürmek yerine metin uyarısı gönderir

  </Accordion>
</AccordionGroup>

## Yanıt alıntılama

WhatsApp, giden yanıtların gelen iletiyi görünür şekilde alıntıladığı yerel yanıt alıntılamayı destekler. Bunu `channels.whatsapp.replyToMode` ile denetleyin.

| Değer       | Davranış                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Asla alıntılama; düz ileti olarak gönder                                  |
| `"first"`   | Yalnızca ilk giden yanıt parçasını alıntıla                             |
| `"all"`     | Her giden yanıt parçasını alıntıla                                      |
| `"batched"` | Anında yanıtları alıntılamadan bırakırken kuyruğa alınmış toplu yanıtları alıntıla |

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

`channels.whatsapp.reactionLevel`, aracının WhatsApp üzerinde emoji tepkilerini ne kadar geniş kullandığını denetler:

| Düzey         | Onay tepkileri | Aracı tarafından başlatılan tepkiler | Açıklama                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | Hayır            | Hayır                        | Hiç tepki yok                              |
| `"ack"`       | Evet           | Hayır                        | Yalnızca onay tepkileri (yanıt öncesi alındı bildirimi)           |
| `"minimal"`   | Evet           | Evet (temkinli)        | Onay + temkinli yönergelerle aracı tepkileri |
| `"extensive"` | Evet           | Evet (teşvik edilir)          | Onay + teşvik edilen yönergelerle aracı tepkileri   |

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

WhatsApp, `channels.whatsapp.ackReaction` üzerinden gelen alındı bildirimi için anında onay tepkilerini destekler.
Onay tepkileri `reactionLevel` tarafından denetlenir — `reactionLevel` `"off"` olduğunda bastırılır.

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

- gelen ileti kabul edildikten hemen sonra gönderilir (yanıt öncesi)
- hatalar günlüğe kaydedilir ancak normal yanıt teslimini engellemez
- grup modu `mentions`, bahsetme ile tetiklenen turlarda tepki verir; grup etkinleştirme `always` bu kontrol için atlama olarak davranır
- WhatsApp `channels.whatsapp.ackReaction` kullanır (eski `messages.ackReaction` burada kullanılmaz)

## Çoklu hesap ve kimlik bilgileri

<AccordionGroup>
  <Accordion title="Hesap seçimi ve varsayılanlar">
    - hesap kimlikleri `channels.whatsapp.accounts` öğesinden gelir
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

    Bir Gateway erişilebilir olduğunda, çıkış önce seçili hesap için canlı WhatsApp dinleyicisini durdurur; böylece bağlı oturum bir sonraki yeniden başlatmaya kadar ileti almaya devam etmez. `openclaw channels remove --channel whatsapp`, hesap yapılandırmasını devre dışı bırakmadan veya silmeden önce canlı dinleyiciyi de durdurur.

    Eski kimlik doğrulama dizinlerinde, Baileys kimlik doğrulama dosyaları kaldırılırken `oauth.json` korunur.

  </Accordion>
</AccordionGroup>

## Araçlar, eylemler ve yapılandırma yazımları

- Aracı araç desteği WhatsApp tepki eylemini (`react`) içerir.
- Eylem geçitleri:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Kanal tarafından başlatılan yapılandırma yazımları varsayılan olarak etkindir (`channels.whatsapp.configWrites=false` ile devre dışı bırakın).

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

  <Accordion title="Bağlı ama bağlantı kesiliyor / yeniden bağlanma döngüsü">
    Belirti: tekrarlanan bağlantı kesilmeleri veya yeniden bağlanma girişimleri olan bağlı hesap.

    Sessiz hesaplar normal ileti zaman aşımını geçtikten sonra bağlı kalabilir; watchdog
    WhatsApp Web taşıma etkinliği durduğunda, soket kapandığında veya
    uygulama düzeyi etkinlik daha uzun güvenlik penceresinin ötesinde sessiz kaldığında yeniden başlatır.

    Günlükler tekrarlanan `status=408 Request Time-out Connection was lost` gösteriyorsa,
    `web.whatsapp` altında Baileys soket zamanlamalarını ayarlayın. `keepAliveIntervalMs` değerini
    ağınızın boşta kalma zaman aşımının altına düşürerek ve yavaş ya da kayıplı bağlantılarda
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

    `~/.openclaw/logs/whatsapp-health.log` dosyası `Gateway inactive` diyorsa ancak
    `openclaw gateway status` ve `openclaw channels status --probe` gateway ve WhatsApp'ın
    sağlıklı olduğunu gösteriyorsa, `openclaw doctor` çalıştırın. Linux'ta doctor,
    hâlâ `~/.openclaw/bin/ensure-whatsapp.sh` çağıran eski crontab girişleri hakkında
    uyarır; bu eski girişleri `crontab -e` ile kaldırın çünkü cron, systemd kullanıcı veri yolu
    ortamından yoksun olabilir ve bu eski betiğin gateway sağlığını yanlış raporlamasına
    neden olabilir.

    Gerekirse `channels login` ile yeniden bağlayın.

  </Accordion>

  <Accordion title="QR oturum açma bir proxy arkasında zaman aşımına uğruyor">
    Belirti: `openclaw channels login --channel whatsapp`, kullanılabilir bir QR kodu göstermeden önce `status=408 Request Time-out` veya TLS soket bağlantı kesilmesiyle başarısız olur.

    WhatsApp Web oturum açma, gateway ana makinesinin standart proxy ortamını (`HTTPS_PROXY`, `HTTP_PROXY`, küçük harfli varyantlar ve `NO_PROXY`) kullanır. Gateway sürecinin proxy ortamını devraldığını ve `NO_PROXY` değerinin `mmg.whatsapp.net` ile eşleşmediğini doğrulayın.

  </Accordion>

  <Accordion title="Gönderirken etkin dinleyici yok">
    Hedef hesap için etkin bir gateway dinleyicisi yoksa giden gönderimler hızlı şekilde başarısız olur.

    Gateway'in çalıştığından ve hesabın bağlı olduğundan emin olun.

  </Accordion>

  <Accordion title="Yanıt transkriptte görünüyor ama WhatsApp'ta görünmüyor">
    Transkript satırları aracının ne ürettiğini kaydeder. WhatsApp teslimi ayrı olarak denetlenir: OpenClaw, otomatik yanıtı yalnızca Baileys en az bir görünür metin veya medya gönderimi için giden ileti kimliği döndürdükten sonra gönderilmiş kabul eder.

    Onay tepkileri bağımsız yanıt öncesi alındı bildirimleridir. Başarılı bir tepki, sonraki metin veya medya yanıtının WhatsApp tarafından kabul edildiğini kanıtlamaz.

    Gateway günlüklerinde `auto-reply delivery failed` veya `auto-reply was not accepted by WhatsApp provider` arayın.

  </Accordion>

  <Accordion title="Grup iletileri beklenmedik şekilde yok sayılıyor">
    Şu sırayla kontrol edin:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` izin listesi girişleri
    - bahsetme geçidi (`requireMention` + bahsetme desenleri)
    - `openclaw.json` içinde yinelenen anahtarlar (JSON5): sonraki girişler önceki girişleri geçersiz kılar, bu yüzden kapsam başına tek bir `groupPolicy` tutun

  </Accordion>

  <Accordion title="Bun runtime uyarısı">
    WhatsApp gateway runtime Node kullanmalıdır. Bun, kararlı WhatsApp/Telegram gateway işlemi için uyumsuz olarak işaretlenir.
  </Accordion>
</AccordionGroup>

## Sistem istemleri

WhatsApp, `groups` ve `direct` haritaları üzerinden gruplar ve doğrudan sohbetler için Telegram tarzı sistem istemlerini destekler.

Grup iletileri için çözümleme hiyerarşisi:

Etkin `groups` haritası önce belirlenir: hesap kendi `groups` değerini tanımlıyorsa, kök `groups` haritasının tamamen yerine geçer (derin birleştirme yok). İstem araması ardından ortaya çıkan tek harita üzerinde çalışır:

1. **Gruba özgü sistem istemi** (`groups["<groupId>"].systemPrompt`): belirli grup girişi haritada bulunduğunda **ve** `systemPrompt` anahtarı tanımlı olduğunda kullanılır. `systemPrompt` boş bir dizeyse (`""`), joker bastırılır ve sistem istemi uygulanmaz.
2. **Grup joker sistem istemi** (`groups["*"].systemPrompt`): belirli grup girişi haritada tamamen yoksa veya var olup `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

Doğrudan iletiler için çözümleme hiyerarşisi:

Etkin `direct` haritası önce belirlenir: hesap kendi `direct` değerini tanımlıyorsa, kök `direct` haritasının tamamen yerine geçer (derin birleştirme yok). İstem araması ardından ortaya çıkan tek harita üzerinde çalışır:

1. **Doğrudana özgü sistem istemi** (`direct["<peerId>"].systemPrompt`): belirli eş girişi haritada bulunduğunda **ve** `systemPrompt` anahtarı tanımlı olduğunda kullanılır. `systemPrompt` boş bir dizeyse (`""`), joker bastırılır ve sistem istemi uygulanmaz.
2. **Doğrudan joker sistem istemi** (`direct["*"].systemPrompt`): belirli eş girişi haritada tamamen yoksa veya var olup `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

<Note>
`dms`, DM başına hafif geçmiş geçersiz kılma kovası olarak kalır (`dms.<id>.historyLimit`). İstem geçersiz kılmaları `direct` altında bulunur.
</Note>

**Telegram çok hesaplı davranışından farkı:** Telegram'da kök `groups`, çok hesaplı bir kurulumdaki tüm hesaplar için kasıtlı olarak bastırılır — kendi `groups` tanımı olmayan hesaplar için bile — böylece bir botun ait olmadığı gruplardan grup iletileri alması önlenir. WhatsApp bu korumayı uygulamaz: kök `groups` ve kök `direct`, kaç hesap yapılandırılmış olursa olsun, hesap düzeyinde geçersiz kılma tanımlamayan hesaplar tarafından her zaman devralınır. Çok hesaplı bir WhatsApp kurulumunda hesap başına grup veya doğrudan sohbet istemleri istiyorsanız, kök düzeyindeki varsayılanlara güvenmek yerine her hesabın altında tam eşlemeyi açıkça tanımlayın.

Önemli davranış:

- `channels.whatsapp.groups` hem grup başına yapılandırma eşlemesi hem de sohbet düzeyi grup izin listesidir. Kök veya hesap kapsamında `groups["*"]`, o kapsam için "tüm gruplar kabul edilir" anlamına gelir.
- Joker grup `systemPrompt` değerini yalnızca o kapsamın tüm grupları kabul etmesini zaten istediğinizde ekleyin. Yalnızca sabit bir grup kimliği kümesinin uygun olmasını hâlâ istiyorsanız, istem varsayılanı için `groups["*"]` kullanmayın. Bunun yerine istemi açıkça izin verilen her grup girdisinde tekrarlayın.
- Grup kabulü ve gönderen yetkilendirmesi ayrı denetimlerdir. `groups["*"]`, grup işleme ulaşabilen grup kümesini genişletir, ancak tek başına bu gruplardaki her göndereni yetkilendirmez. Gönderen erişimi yine ayrı olarak `channels.whatsapp.groupPolicy` ve `channels.whatsapp.groupAllowFrom` tarafından denetlenir.
- `channels.whatsapp.direct`, DM'ler için aynı yan etkiye sahip değildir. `direct["*"]`, bir DM `dmPolicy` ile `allowFrom` veya eşleme deposu kuralları tarafından zaten kabul edildikten sonra yalnızca varsayılan doğrudan sohbet yapılandırması sağlar.

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

## Yapılandırma başvurusu bağlantıları

Birincil başvuru:

- [Yapılandırma başvurusu - WhatsApp](/tr/gateway/config-channels#whatsapp)

Öne çıkan WhatsApp alanları:

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
- [Kanal yönlendirmesi](/tr/channels/channel-routing)
- [Çoklu aracı yönlendirmesi](/tr/concepts/multi-agent)
- [Sorun giderme](/tr/channels/troubleshooting)
