---
read_when:
    - WhatsApp/web kanalı davranışı veya gelen kutusu yönlendirmesi üzerinde çalışma
summary: WhatsApp kanal desteği, erişim denetimleri, teslim davranışı ve operasyonlar
title: WhatsApp
x-i18n:
    generated_at: "2026-06-28T00:16:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88f81adc38bd64d1e35f382dfc209e690c059d52e522e5cbdf77d1da45c9d15f
    source_path: channels/whatsapp.md
    workflow: 16
---

Durum: WhatsApp Web (Baileys) üzerinden production-ready. Gateway, bağlı oturum(lar)ın sahibidir.

## Kurulum (isteğe bağlı)

- Onboarding (`openclaw onboard`) ve `openclaw channels add --channel whatsapp`,
  WhatsApp Plugin'ini ilk kez seçtiğinizde kurmanız için istem gösterir.
- `openclaw channels login --channel whatsapp`, Plugin henüz mevcut değilse
  kurulum akışını da sunar.
- Geliştirme kanalı + git checkout: varsayılan olarak yerel Plugin yolunu kullanır.
- Stable/Beta: önce ClawHub'dan resmi `@openclaw/whatsapp` Plugin'ini kurar,
  yedek olarak npm kullanılır.
- WhatsApp runtime'ı, çekirdek OpenClaw npm paketinin dışında dağıtılır; böylece
  WhatsApp'a özgü runtime bağımlılıkları harici Plugin ile birlikte kalır.

Manuel kurulum kullanılabilir kalır:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Çıplak npm paketini (`@openclaw/whatsapp`) yalnızca registry yedeğine
ihtiyaç duyduğunuzda kullanın. Tam bir sürümü yalnızca tekrarlanabilir bir kurulum gerektiğinde sabitleyin.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bilinmeyen göndericiler için varsayılan DM politikası eşleştirmedir.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım çalışma planları.
  </Card>
  <Card title="Gateway yapılandırması" icon="settings" href="/tr/gateway/configuration">
    Tam kanal yapılandırma kalıpları ve örnekleri.
  </Card>
</CardGroup>

## Hızlı kurulum

<Steps>
  <Step title="WhatsApp erişim politikasını yapılandırın">

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

    Geçerli oturum açma QR tabanlıdır. Uzak veya başsız ortamlarda, oturum açmayı
    başlatmadan önce canlı QR kodunu tarayacak telefona ulaştırmak için güvenilir
    bir yolunuz olduğundan emin olun.

    Belirli bir hesap için:

```bash
openclaw channels login --channel whatsapp --account work
```

    Oturum açmadan önce mevcut/özel bir WhatsApp Web auth dizini eklemek için:

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

<Warning>
Geçerli WhatsApp kurulum akışı yalnızca QR kullanır. Terminalde oluşturulan QR'lar,
ekran görüntüleri, PDF'ler veya sohbet ekleri, uzak bir makineden aktarılırken
süresi dolabilir ya da okunamaz hâle gelebilir. Uzak/başsız host'lar için manuel
terminal yakalama yerine doğrudan bir QR görüntüsü teslim yolunu tercih edin.
</Warning>

## Dağıtım kalıpları

<AccordionGroup>
  <Accordion title="Ayrılmış numara (önerilir)">
    Bu, operasyonel açıdan en temiz moddur:

    - OpenClaw için ayrı WhatsApp kimliği
    - daha net DM allowlist'leri ve yönlendirme sınırları
    - kendinle sohbet karışıklığı olasılığının daha düşük olması

    Asgari politika kalıbı:

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
    Onboarding kişisel numara modunu destekler ve kendinle sohbete uygun bir temel yapı yazar:

    - `dmPolicy: "allowlist"`
    - `allowFrom` kişisel numaranızı içerir
    - `selfChatMode: true`

    Runtime'da, kendinle sohbet korumaları bağlı kendi numaranızı ve `allowFrom` değerini temel alır.

  </Accordion>

  <Accordion title="Yalnızca WhatsApp Web kanal kapsamı">
    Mesajlaşma platformu kanalı, mevcut OpenClaw kanal mimarisinde WhatsApp Web tabanlıdır (`Baileys`).

    Yerleşik sohbet kanalı registry'sinde ayrı bir Twilio WhatsApp mesajlaşma kanalı yoktur.

  </Accordion>
</AccordionGroup>

## Runtime modeli

- Gateway, WhatsApp soketinin ve yeniden bağlanma döngüsünün sahibidir.
- Yeniden bağlanma watchdog'u yalnızca gelen uygulama mesajı hacmini değil, WhatsApp Web aktarım etkinliğini kullanır; bu nedenle sessiz bir bağlı cihaz oturumu, sırf yakın zamanda kimse mesaj göndermediği için yeniden başlatılmaz. Daha uzun bir uygulama sessizliği sınırı, aktarım çerçeveleri gelmeye devam ettiği ancak watchdog penceresi boyunca hiçbir uygulama mesajı işlenmediği durumda yine de yeniden bağlanmayı zorlar; yakın zamanda etkin olmuş bir oturum için geçici bir yeniden bağlanmadan sonra, bu uygulama sessizliği denetimi ilk kurtarma penceresi için normal mesaj zaman aşımını kullanır.
- Baileys soket zamanlamaları `web.whatsapp.*` altında açıktır: `keepAliveIntervalMs` WhatsApp Web uygulama ping'lerini, `connectTimeoutMs` açılış el sıkışması zaman aşımını, `defaultQueryTimeoutMs` ise Baileys sorgu beklemelerini ve OpenClaw'ın yerel giden gönderim/presence ile gelen okundu bilgisi işlem sınırlarını kontrol eder.
- Giden gönderimler, hedef hesap için etkin bir WhatsApp dinleyicisi gerektirir.
- Grup gönderimleri, token geçerli WhatsApp katılımcı meta verileriyle eşleştiğinde, LID destekli gruplar dahil olmak üzere metin ve medya açıklamalarındaki `@+<digits>` ve `@<digits>` token'ları için yerel mention meta verileri ekler.
- Durum ve broadcast sohbetleri yok sayılır (`@status`, `@broadcast`).
- Yeniden bağlanma watchdog'u yalnızca gelen uygulama mesajı hacmini değil, WhatsApp Web aktarım etkinliğini izler: sessiz bağlı cihaz oturumları aktarım çerçeveleri devam ederken açık kalır, ancak aktarım durması daha sonraki uzak bağlantı kesme yolundan çok önce yeniden bağlanmayı zorlar.
- Doğrudan sohbetler DM oturum kurallarını kullanır (`session.dmScope`; varsayılan `main`, DM'leri agent ana oturumuna toplar).
- Grup oturumları izole edilir (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters, yerel `@newsletter` JID'leriyle açık giden hedefler olabilir. Giden newsletter gönderimleri, DM oturumu semantiği yerine kanal oturumu meta verilerini (`agent:<agentId>:whatsapp:channel:<jid>`) kullanır.
- WhatsApp Web aktarımı, Gateway host'undaki standart proxy ortam değişkenlerine uyar (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / küçük harf varyantları). Kanala özgü WhatsApp proxy ayarları yerine host düzeyinde proxy yapılandırmasını tercih edin.
- `messages.removeAckAfterReply` etkinleştirildiğinde, OpenClaw görünür bir yanıt teslim edildikten sonra WhatsApp ack tepkisini temizler.

## Onay istemleri

WhatsApp, exec ve Plugin onay istemlerini `👍` / `👎` tepkileriyle gösterebilir. Teslimat,
üst düzey onay iletme yapılandırmasıyla kontrol edilir:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` ve `approvals.plugin` bağımsızdır. WhatsApp'ı kanal olarak etkinleştirmek yalnızca
aktarımı bağlar; eşleşen onay ailesi etkinleştirilip WhatsApp'a yönlendirilmedikçe
onay istemleri göndermez. Oturum modu yerel emoji onaylarını yalnızca WhatsApp'tan
kaynaklanan onaylar için teslim eder. Hedef modu, açık WhatsApp hedefleri için paylaşılan
iletme hattını kullanır ve ayrı onaylayan-DM fanout'u oluşturmaz.

WhatsApp onay tepkileri, `allowFrom` veya `"*"` içinden açık WhatsApp onaylayanları gerektirir.
`defaultTo` sıradan varsayılan mesaj hedeflerini kontrol eder; bir onay onaylayanı değildir. Manuel
`/approve` komutları, onay çözümlemesinden önce yine normal WhatsApp gönderici yetkilendirme yolundan
geçer.

## Plugin hook'ları ve gizlilik

WhatsApp gelen mesajları kişisel mesaj içeriği, telefon numaraları,
grup tanımlayıcıları, gönderici adları ve oturum korelasyon alanları içerebilir. Bu nedenle,
açıkça katılmadığınız sürece WhatsApp gelen `message_received` hook payload'larını Plugin'lere
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

Katılımı tek bir hesapla sınırlayabilirsiniz:

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

Bunu yalnızca gelen WhatsApp mesaj içeriğini ve tanımlayıcılarını almasına güvendiğiniz
Plugin'ler için etkinleştirin.

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM politikası">
    `channels.whatsapp.dmPolicy` doğrudan sohbet erişimini kontrol eder:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` içinde `"*"` olmasını gerektirir)
    - `disabled`

    `allowFrom` E.164 tarzı numaraları kabul eder (dahili olarak normalize edilir).

    `allowFrom` bir DM gönderici erişim denetimi listesidir. WhatsApp grup JID'lerine veya `@newsletter` kanal JID'lerine açık giden gönderimleri kapılamaz.

    Çok hesaplı geçersiz kılma: `channels.whatsapp.accounts.<id>.dmPolicy` (ve `allowFrom`), o hesap için kanal düzeyi varsayılanlardan önceliklidir.

    Runtime davranışı ayrıntıları:

    - eşleştirmeler kanal allow-store içinde kalıcı tutulur ve yapılandırılmış `allowFrom` ile birleştirilir
    - zamanlanmış otomasyon ve Heartbeat alıcı yedeği açık teslimat hedeflerini veya yapılandırılmış `allowFrom` değerini kullanır; DM eşleştirme onayları örtük Cron veya Heartbeat alıcıları değildir
    - hiçbir allowlist yapılandırılmamışsa, bağlı kendi numarası varsayılan olarak izinlidir
    - OpenClaw giden `fromMe` DM'lerini (bağlı cihazdan kendinize gönderdiğiniz mesajlar) asla otomatik eşleştirmez

  </Tab>

  <Tab title="Grup politikası + allowlist'ler">
    Grup erişiminin iki katmanı vardır:

    1. **Grup üyeliği allowlist'i** (`channels.whatsapp.groups`)
       - `groups` atlanırsa, tüm gruplar uygundur
       - `groups` mevcutsa, grup allowlist'i gibi davranır (`"*"` izinlidir)

    2. **Grup gönderici politikası** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: gönderici allowlist'i atlanır
       - `allowlist`: gönderici `groupAllowFrom` (veya `*`) ile eşleşmelidir
       - `disabled`: tüm grup gelenlerini engeller

    Gönderici allowlist yedeği:

    - `groupAllowFrom` ayarlanmamışsa, runtime mevcut olduğunda `allowFrom` değerine geri döner
    - gönderici allowlist'leri mention/yanıt etkinleştirmesinden önce değerlendirilir

    Not: hiç `channels.whatsapp` bloğu yoksa, runtime grup politikası yedeği, `channels.defaults.groupPolicy` ayarlanmış olsa bile `allowlist` olur (uyarı günlüğüyle).

  </Tab>

  <Tab title="Mention'lar + /activation">
    Grup yanıtları varsayılan olarak mention gerektirir.

    Mention algılama şunları içerir:

    - bot kimliğinin açık WhatsApp mention'ları
    - yapılandırılmış mention regex kalıpları (`agents.list[].groupChat.mentionPatterns`, yedek `messages.groupChat.mentionPatterns`)
    - yetkili grup mesajları için gelen sesli not transkriptleri
    - örtük bota-yanıt algılama (yanıt göndericisi bot kimliğiyle eşleşir)

    Güvenlik notu:

    - alıntı/yanıt yalnızca mention kapısını karşılar; gönderici yetkilendirmesi **vermez**
    - `groupPolicy: "allowlist"` ile, allowlist'te olmayan göndericiler, allowlist'teki bir kullanıcının mesajına yanıt verseler bile yine engellenir

    Oturum düzeyi etkinleştirme komutu:

    - `/activation mention`
    - `/activation always`

    `activation` oturum durumunu günceller (global config'i değil). Sahip kapılıdır.

  </Tab>
</Tabs>

## Yapılandırılmış ACP bağlamaları

WhatsApp, üst düzey `bindings[]` girdileriyle kalıcı ACP bağlamalarını destekler:

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

- Doğrudan sohbetler `+15555550123` gibi E.164 numaralarıyla eşleşir.
- Gruplar `120363424282127706@g.us` gibi WhatsApp grup JID'leriyle eşleşir.
- Grup izin listeleri, gönderen ilkesi ve bahsetme ya da etkinleştirme kapısı, OpenClaw yapılandırılmış ACP oturumunun var olduğundan emin olmadan önce çalışır.
- Eşleşen yapılandırılmış ACP bağlaması rotanın sahibidir. WhatsApp yayın grupları bu turu sıradan WhatsApp oturumlarına dağıtmaz.

## Kişisel numara ve kendiyle sohbet davranışı

Bağlı kendi numaranız `allowFrom` içinde de varsa WhatsApp kendiyle sohbet korumaları etkinleşir:

- kendiyle sohbet turları için okundu bilgilerini atla
- aksi halde kendinize ping gönderecek mention-JID otomatik tetikleme davranışını yok say
- `messages.responsePrefix` ayarlanmamışsa kendiyle sohbet yanıtları varsayılan olarak `[{identity.name}]` veya `[openclaw]` olur

## Mesaj normalleştirme ve bağlam

<AccordionGroup>
  <Accordion title="Gelen zarf + yanıt bağlamı">
    Gelen WhatsApp mesajları paylaşılan gelen zarf içinde sarmalanır.

    Alıntılanmış bir yanıt varsa bağlam şu biçimde eklenir:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Yanıt meta veri alanları da kullanılabildiğinde doldurulur (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, gönderen JID/E.164).
    Alıntılanmış yanıt hedefi indirilebilir medya olduğunda OpenClaw bunu
    normal gelen medya deposu üzerinden kaydeder ve `MediaPath`/`MediaType` olarak
    sunar; böylece agent yalnızca `<media:image>` görmek yerine başvurulan
    görseli inceleyebilir.

  </Accordion>

  <Accordion title="Medya yer tutucuları ve konum/kişi çıkarımı">
    Yalnızca medya içeren gelen mesajlar şu tür yer tutucularla normalleştirilir:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Yetkili grup sesli notları, gövde yalnızca `<media:audio>` olduğunda
    bahsetme kapısından önce metne dökülür; böylece sesli notta bot bahsetmesini
    söylemek yanıtı tetikleyebilir. Transkript yine de bottan bahsetmiyorsa
    ham yer tutucu yerine bekleyen grup geçmişinde tutulur.

    Konum gövdeleri kısa koordinat metni kullanır. Konum etiketleri/yorumları ve kişi/vCard ayrıntıları satır içi istem metni olarak değil, fenced güvenilmeyen meta veri olarak işlenir.

  </Accordion>

  <Accordion title="Bekleyen grup geçmişi ekleme">
    Gruplar için işlenmemiş mesajlar arabelleğe alınabilir ve bot sonunda tetiklendiğinde bağlam olarak eklenebilir.

    - varsayılan sınır: `50`
    - yapılandırma: `channels.whatsapp.historyLimit`
    - yedek: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    Ekleme işaretleri:

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

    Kendiyle sohbet turları, genel olarak etkin olsa bile okundu bilgilerini atlar.

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
    - görsel, video, ses (PTT sesli notu) ve belge yüklerini destekler
    - ses medyası Baileys `audio` yükü üzerinden `ptt: true` ile gönderilir; böylece WhatsApp istemcileri bunu bas-konuş sesli notu olarak işler
    - yanıt yükleri `audioAsVoice` değerini korur; WhatsApp için TTS sesli not çıktısı, sağlayıcı MP3 veya WebM döndürse bile bu PTT yolunda kalır
    - yerel Ogg/Opus sesi, sesli not uyumluluğu için `audio/ogg; codecs=opus` olarak gönderilir
    - Microsoft Edge TTS MP3/WebM çıktısı dahil Ogg olmayan ses, PTT tesliminden önce `ffmpeg` ile 48 kHz mono Ogg/Opus'a dönüştürülür
    - `/tts latest` en son assistant yanıtını tek bir sesli not olarak gönderir ve aynı yanıt için tekrar gönderimleri bastırır; `/tts chat on|off|default` geçerli WhatsApp sohbeti için otomatik TTS'yi denetler
    - animasyonlu GIF oynatma, video gönderimlerinde `gifPlayback: true` ile desteklenir
    - `forceDocument` / `asDocument`, çözümlenen dosya adını ve MIME türünü korurken WhatsApp medya sıkıştırmasını önlemek için giden görselleri, GIF'leri ve videoları Baileys belge yükü üzerinden gönderir
    - çok medyalı yanıt yükleri gönderilirken başlıklar ilk medya öğesine uygulanır; ancak PTT sesli notları önce sesi, görünür metni ayrı gönderir çünkü WhatsApp istemcileri sesli not başlıklarını tutarlı biçimde işlemez
    - medya kaynağı HTTP(S), `file://` veya yerel yollar olabilir

  </Accordion>

  <Accordion title="Medya boyutu sınırları ve yedek davranış">
    - gelen medya kaydetme üst sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - giden medya gönderme üst sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - hesap başına geçersiz kılmalar `channels.whatsapp.accounts.<accountId>.mediaMaxMb` kullanır
    - `forceDocument` / `asDocument` belge teslimi istemedikçe görseller sınırlara sığması için otomatik optimize edilir (yeniden boyutlandırma/kalite taraması)
    - medya gönderme hatasında ilk öğe yedeği, yanıtı sessizce düşürmek yerine metin uyarısı gönderir

  </Accordion>
</AccordionGroup>

## Yanıt alıntılama

WhatsApp, giden yanıtların gelen mesajı görünür şekilde alıntıladığı yerel yanıt alıntılamayı destekler. Bunu `channels.whatsapp.replyToMode` ile denetleyin.

| Değer       | Davranış                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Asla alıntılama; düz mesaj olarak gönder                                  |
| `"first"`   | Yalnızca ilk giden yanıt parçasını alıntıla                             |
| `"all"`     | Her giden yanıt parçasını alıntıla                                      |
| `"batched"` | Anlık yanıtları alıntısız bırakırken kuyruktaki toplu yanıtları alıntıla |

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

`channels.whatsapp.reactionLevel`, agent'ın WhatsApp üzerinde emoji tepkilerini ne kadar geniş kullandığını denetler:

| Düzey         | Onay tepkileri | Agent tarafından başlatılan tepkiler | Açıklama                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | Hayır            | Hayır                        | Hiç tepki yok                              |
| `"ack"`       | Evet           | Hayır                        | Yalnızca onay tepkileri (yanıt öncesi alındı bilgisi)           |
| `"minimal"`   | Evet           | Evet (temkinli)        | Onay + temkinli yönlendirmeyle agent tepkileri |
| `"extensive"` | Evet           | Evet (teşvik edilir)          | Onay + teşvik edilen yönlendirmeyle agent tepkileri   |

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

WhatsApp, `channels.whatsapp.ackReaction` üzerinden gelen alındı bilgisinde anlık onay tepkilerini destekler.
Onay tepkileri `reactionLevel` tarafından kapılanır; `reactionLevel` `"off"` olduğunda bastırılır.

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
- `ackReaction`, `emoji` olmadan varsa WhatsApp yönlendirilen agent'ın kimlik emojisini kullanır ve "👀" değerine geri döner; onay tepkisi göndermemek için `ackReaction` değerini atlayın veya `emoji: ""` ayarlayın
- hatalar günlüğe yazılır ancak normal yanıt teslimini engellemez
- grup modu `mentions`, bahsetmeyle tetiklenen turlarda tepki verir; grup etkinleştirmesi `always` bu denetim için bypass işlevi görür
- WhatsApp `channels.whatsapp.ackReaction` kullanır (eski `messages.ackReaction` burada kullanılmaz)

## Yaşam döngüsü durumu tepkileri

WhatsApp'ın bir tur sırasında statik alındı emojisi bırakmak yerine onay tepkisini değiştirmesine izin vermek için `messages.statusReactions.enabled: true` ayarlayın. Etkinleştirildiğinde OpenClaw kuyrukta, düşünüyor, araç etkinliği, Compaction, tamamlandı ve hata gibi yaşam döngüsü durumları için aynı gelen mesaj tepki yuvasını kullanır.

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

Davranış notları:

- `channels.whatsapp.ackReaction`, durum tepkilerinin doğrudan mesajlar ve gruplar için uygun olup olmadığını yine denetler.
- Kuyruktaki durum tepkisi, düz onay tepkileriyle aynı etkili onay emojisini kullanır.
- WhatsApp'ta mesaj başına bir bot tepki yuvası vardır; bu yüzden yaşam döngüsü güncellemeleri mevcut tepkiyi yerinde değiştirir.
- `messages.removeAckAfterReply: true`, yapılandırılmış tamamlandı/hata bekletmesinden sonra son durum tepkisini temizler.
- Araç emoji kategorileri `tool`, `coding`, `web`, `deploy`, `build` ve `concierge` içerir.

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
    - `~/.openclaw/credentials/` içindeki eski varsayılan kimlik doğrulama, varsayılan hesap akışları için hâlâ tanınır/geçirilir

  </Accordion>

  <Accordion title="Oturum kapatma davranışı">
    `openclaw channels logout --channel whatsapp [--account <id>]`, o hesap için WhatsApp kimlik doğrulama durumunu temizler.

    Bir Gateway erişilebilir olduğunda oturum kapatma, bağlı oturumun bir sonraki yeniden başlatmaya kadar mesaj almaya devam etmemesi için önce seçilen hesaba ait canlı WhatsApp dinleyicisini durdurur. `openclaw channels remove --channel whatsapp` da hesap yapılandırmasını devre dışı bırakmadan veya silmeden önce canlı dinleyiciyi durdurur.

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

  <Accordion title="Bağlı ama bağlantısı kesiliyor / yeniden bağlanma döngüsü">
    Belirti: tekrarlanan bağlantı kesilmeleri veya yeniden bağlanma denemeleri olan bağlı hesap.

    Sessiz hesaplar normal mesaj zaman aşımını geçtikten sonra bağlı kalabilir; watchdog,
    WhatsApp Web taşıma etkinliği durduğunda, soket kapandığında veya
    uygulama düzeyi etkinlik daha uzun güvenlik penceresinin ötesinde sessiz kaldığında yeniden başlatır.

    Günlüklerde tekrarlanan `status=408 Request Time-out Connection was lost` görünüyorsa, `web.whatsapp` altında Baileys soket zamanlamalarını ayarlayın. Önce `keepAliveIntervalMs` değerini ağınızın boşta kalma zaman aşımının altına düşürün ve yavaş ya da kayıplı bağlantılarda `connectTimeoutMs` değerini artırın:

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
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    Ana makine bağlantısı ve zamanlama düzeltildikten sonra döngü devam ederse, hesap kimlik doğrulama dizinini yedekleyin ve o hesabı yeniden bağlayın:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    `~/.openclaw/logs/whatsapp-health.log` dosyası `Gateway inactive` diyorsa ancak `openclaw gateway status` ve `openclaw channels status --probe` Gateway ile WhatsApp'ın sağlıklı olduğunu gösteriyorsa, `openclaw doctor` çalıştırın. Linux'ta doctor, hâlâ `~/.openclaw/bin/ensure-whatsapp.sh` çağıran eski crontab girdileri hakkında uyarı verir; bu bayat girdileri `crontab -e` ile kaldırın çünkü cron systemd kullanıcı veri yolu ortamından yoksun olabilir ve bu eski betiğin Gateway sağlığını hatalı raporlamasına neden olabilir.

    Gerekirse, `channels login` ile yeniden bağlayın.

  </Accordion>

  <Accordion title="QR login times out behind a proxy">
    Belirti: `openclaw channels login --channel whatsapp`, kullanılabilir bir QR kodu göstermeden önce `status=408 Request Time-out` veya TLS soket bağlantı kesilmesi ile başarısız olur.

    WhatsApp Web oturum açma, Gateway ana makinesinin standart proxy ortamını (`HTTPS_PROXY`, `HTTP_PROXY`, küçük harfli varyantlar ve `NO_PROXY`) kullanır. Gateway sürecinin proxy ortamını devraldığını ve `NO_PROXY` değerinin `mmg.whatsapp.net` ile eşleşmediğini doğrulayın.

  </Accordion>

  <Accordion title="No active listener when sending">
    Hedef hesap için etkin bir Gateway dinleyicisi yoksa giden gönderimler hızlı şekilde başarısız olur.

    Gateway'in çalıştığından ve hesabın bağlı olduğundan emin olun.

  </Accordion>

  <Accordion title="Reply appears in transcript but not in WhatsApp">
    Transkript satırları, ajanın ürettiği içeriği kaydeder. WhatsApp teslimi ayrı olarak denetlenir: OpenClaw, bir otomatik yanıtı yalnızca Baileys en az bir görünür metin veya medya gönderimi için giden mesaj kimliği döndürdükten sonra gönderilmiş kabul eder.

    Onay tepkileri, yanıttan önceki bağımsız alındılardır. Başarılı bir tepki, daha sonraki metin veya medya yanıtının WhatsApp tarafından kabul edildiğini kanıtlamaz.

    Gateway günlüklerinde `auto-reply delivery failed` veya `auto-reply was not accepted by WhatsApp provider` olup olmadığını kontrol edin.

  </Accordion>

  <Accordion title="Group messages unexpectedly ignored">
    Şu sırayla kontrol edin:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` izin listesi girdileri
    - bahsetme geçidi (`requireMention` + bahsetme desenleri)
    - `openclaw.json` içindeki yinelenen anahtarlar (JSON5): sonraki girdiler öncekileri geçersiz kılar; bu yüzden kapsam başına tek bir `groupPolicy` tutun

    `channels.whatsapp.groups` mevcutsa, WhatsApp diğer gruplardan gelen mesajları hâlâ gözlemleyebilir, ancak OpenClaw bunları oturum yönlendirmesinden önce düşürür. Grup JID'sini `channels.whatsapp.groups` içine ekleyin veya gönderici yetkilendirmesini `groupPolicy` ve `groupAllowFrom` altında tutarken tüm grupları kabul etmek için `groups["*"]` ekleyin.

  </Accordion>

  <Accordion title="Bun runtime warning">
    WhatsApp Gateway çalışma zamanı Node kullanmalıdır. Bun, kararlı WhatsApp/Telegram Gateway işletimi için uyumsuz olarak işaretlenir.
  </Accordion>
</AccordionGroup>

## Sistem istemleri

WhatsApp, `groups` ve `direct` eşlemeleri aracılığıyla gruplar ve doğrudan sohbetler için Telegram tarzı sistem istemlerini destekler.

Grup mesajları için çözümleme hiyerarşisi:

Etkili `groups` eşlemesi önce belirlenir: hesap kendi `groups` değerini tanımlıyorsa, kök `groups` eşlemesini tamamen değiştirir (derin birleştirme yoktur). İstem araması sonra ortaya çıkan tek eşleme üzerinde çalışır:

1. **Gruba özgü sistem istemi** (`groups["<groupId>"].systemPrompt`): belirli grup girdisi eşlemede mevcut olduğunda **ve** `systemPrompt` anahtarı tanımlı olduğunda kullanılır. `systemPrompt` boş bir dizeyse (`""`), joker bastırılır ve sistem istemi uygulanmaz.
2. **Grup joker sistem istemi** (`groups["*"].systemPrompt`): belirli grup girdisi eşlemede tamamen yoksa veya mevcut olup `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

Doğrudan mesajlar için çözümleme hiyerarşisi:

Etkili `direct` eşlemesi önce belirlenir: hesap kendi `direct` değerini tanımlıyorsa, kök `direct` eşlemesini tamamen değiştirir (derin birleştirme yoktur). İstem araması sonra ortaya çıkan tek eşleme üzerinde çalışır:

1. **Doğrudan sohbete özgü sistem istemi** (`direct["<peerId>"].systemPrompt`): belirli eş girdisi eşlemede mevcut olduğunda **ve** `systemPrompt` anahtarı tanımlı olduğunda kullanılır. `systemPrompt` boş bir dizeyse (`""`), joker bastırılır ve sistem istemi uygulanmaz.
2. **Doğrudan sohbet joker sistem istemi** (`direct["*"].systemPrompt`): belirli eş girdisi eşlemede tamamen yoksa veya mevcut olup `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

<Note>
`dms`, hafif DM başına geçmiş geçersiz kılma kovası (`dms.<id>.historyLimit`) olarak kalır. İstem geçersiz kılmaları `direct` altında bulunur.
</Note>

**Telegram çok hesaplı davranışından farkı:** Telegram'da kök `groups`, bir botun ait olmadığı gruplar için grup mesajları almasını önlemek amacıyla çok hesaplı kurulumdaki tüm hesaplar için bilerek bastırılır; kendi `groups` değerini tanımlamayan hesaplarda bile. WhatsApp bu korumayı uygulamaz: kök `groups` ve kök `direct`, kaç hesap yapılandırılmış olursa olsun hesap düzeyi geçersiz kılma tanımlamayan hesaplar tarafından her zaman devralınır. Çok hesaplı bir WhatsApp kurulumunda hesap başına grup veya doğrudan sohbet istemleri istiyorsanız, kök düzeyi varsayılanlara güvenmek yerine her hesabın altında tam eşlemeyi açıkça tanımlayın.

Önemli davranış:

- `channels.whatsapp.groups`, hem grup başına yapılandırma eşlemesi hem de sohbet düzeyi grup izin listesidir. Kök veya hesap kapsamında `groups["*"]`, o kapsam için "tüm gruplar kabul edilir" anlamına gelir.
- Joker grup `systemPrompt` değerini yalnızca o kapsamın tüm grupları zaten kabul etmesini istiyorsanız ekleyin. Hâlâ yalnızca sabit bir grup kimliği kümesinin uygun olmasını istiyorsanız, istem varsayılanı için `groups["*"]` kullanmayın. Bunun yerine, istemi açıkça izin listesine alınmış her grup girdisinde tekrarlayın.
- Grup kabulü ve gönderici yetkilendirmesi ayrı denetimlerdir. `groups["*"]`, grup işleme ulaşabilecek grup kümesini genişletir, ancak bu gruplardaki her göndericiyi tek başına yetkilendirmez. Gönderici erişimi hâlâ `channels.whatsapp.groupPolicy` ve `channels.whatsapp.groupAllowFrom` tarafından ayrı olarak denetlenir.
- `channels.whatsapp.direct`, DM'ler için aynı yan etkiye sahip değildir. `direct["*"]`, yalnızca bir DM `dmPolicy` ile `allowFrom` veya eşleme deposu kuralları tarafından zaten kabul edildikten sonra varsayılan bir doğrudan sohbet yapılandırması sağlar.

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

- [Eşleme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Güvenlik](/tr/gateway/security)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Çok ajanlı yönlendirme](/tr/concepts/multi-agent)
- [Sorun giderme](/tr/channels/troubleshooting)
