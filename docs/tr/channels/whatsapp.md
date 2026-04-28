---
read_when:
    - WhatsApp/web kanal davranışı veya gelen kutusu yönlendirmesi üzerinde çalışma
summary: WhatsApp kanal desteği, erişim denetimleri, teslimat davranışı ve işlemler
title: WhatsApp
x-i18n:
    generated_at: "2026-04-26T11:24:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd4217adb673bc4c071fc1bff6994fb214966c2b28fe59253a1a6f4b4b7fcdba
    source_path: channels/whatsapp.md
    workflow: 15
---

Durum: WhatsApp Web (Baileys) aracılığıyla üretime hazır. Gateway, bağlantılı oturum(lar)ın sahibidir.

## Kurulum (gerektiğinde)

- İlk kez seçtiğinizde, eşleştirme (`openclaw onboard`) ve `openclaw channels add --channel whatsapp` WhatsApp Plugin'ini yüklemenizi ister.
- `openclaw channels login --channel whatsapp` da Plugin henüz mevcut değilse kurulum akışını sunar.
- Geliştirme kanalı + git checkout: varsayılan olarak yerel Plugin yolunu kullanır.
- Stable/Beta: varsayılan olarak npm paketi `@openclaw/whatsapp` kullanılır.

Elle kurulum seçeneği yine kullanılabilir:

```bash
openclaw plugins install @openclaw/whatsapp
```

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

    Girişten önce mevcut/özel bir WhatsApp Web kimlik doğrulama dizinini eklemek için:

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

    Eşleştirme isteklerinin süresi 1 saat sonra dolar. Bekleyen istekler kanal başına en fazla 3 ile sınırlıdır.

  </Step>
</Steps>

<Note>
OpenClaw mümkün olduğunda WhatsApp'ı ayrı bir numarada çalıştırmanızı önerir. (Kanal meta verileri ve kurulum akışı bu kurulum için optimize edilmiştir, ancak kişisel numara kurulumları da desteklenir.)
</Note>

## Dağıtım kalıpları

<AccordionGroup>
  <Accordion title="Ayrılmış numara (önerilir)">
    Bu en temiz operasyonel moddur:

    - OpenClaw için ayrı WhatsApp kimliği
    - daha net DM allowlist'leri ve yönlendirme sınırları
    - kendinle sohbet karışıklığı olasılığı daha düşük

    En az ilke kalıbı:

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
    Eşleştirme, kişisel numara modunu destekler ve kendinle sohbet dostu bir temel yazar:

    - `dmPolicy: "allowlist"`
    - `allowFrom`, kişisel numaranızı içerir
    - `selfChatMode: true`

    Çalışma zamanında, kendinle sohbet korumaları bağlantılı kendi numarasına ve `allowFrom` değerine göre anahtarlanır.

  </Accordion>

  <Accordion title="Yalnızca WhatsApp Web kanal kapsamı">
    Mesajlaşma platformu kanalı, mevcut OpenClaw kanal mimarisinde WhatsApp Web tabanlıdır (`Baileys`).

    Yerleşik sohbet kanalı kayıt defterinde ayrı bir Twilio WhatsApp mesajlaşma kanalı yoktur.

  </Accordion>
</AccordionGroup>

## Çalışma zamanı modeli

- Gateway, WhatsApp soketinin ve yeniden bağlanma döngüsünün sahibidir.
- Giden gönderimler, hedef hesap için etkin bir WhatsApp dinleyicisi gerektirir.
- Durum ve yayın sohbetleri yok sayılır (`@status`, `@broadcast`).
- Doğrudan sohbetler DM oturum kurallarını kullanır (`session.dmScope`; varsayılan `main`, DM'leri aracının ana oturumunda birleştirir).
- Grup oturumları yalıtılmıştır (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Web taşıması, Gateway ana makinesindeki standart proxy ortam değişkenlerine uyar (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / küçük harfli varyantları). Kanala özel WhatsApp proxy ayarları yerine ana makine düzeyinde proxy yapılandırmasını tercih edin.
- `messages.removeAckAfterReply` etkinleştirildiğinde OpenClaw, görünür bir yanıt teslim edildikten sonra WhatsApp onay tepkisini temizler.

## Plugin kancaları ve gizlilik

WhatsApp gelen mesajları kişisel mesaj içeriği, telefon numaraları,
grup tanımlayıcıları, gönderen adları ve oturum ilişkilendirme alanları içerebilir. Bu nedenle
WhatsApp, açıkça etkinleştirmediğiniz sürece gelen `message_received` kanca yüklerini Plugin'lere
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

Etkinleştirmeyi tek bir hesaba daraltabilirsiniz:

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

Bunu yalnızca gelen WhatsApp mesaj
içeriğini ve tanımlayıcılarını almasına güvendiğiniz Plugin'ler için etkinleştirin.

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.whatsapp.dmPolicy`, doğrudan sohbet erişimini denetler:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` içine `"*"` dahil edilmesini gerektirir)
    - `disabled`

    `allowFrom`, E.164 tarzı numaraları kabul eder (dahili olarak normalize edilir).

    Çoklu hesap geçersiz kılması: `channels.whatsapp.accounts.<id>.dmPolicy` (ve `allowFrom`), o hesap için kanal düzeyindeki varsayılanların önüne geçer.

    Çalışma zamanı davranış ayrıntıları:

    - eşleştirmeler kanal allow-store içinde kalıcı olarak saklanır ve yapılandırılmış `allowFrom` ile birleştirilir
    - herhangi bir allowlist yapılandırılmamışsa, bağlantılı kendi numarasına varsayılan olarak izin verilir
    - OpenClaw, giden `fromMe` DM'lerini (bağlantılı cihazdan kendinize gönderdiğiniz mesajlar) asla otomatik eşleştirmez

  </Tab>

  <Tab title="Grup ilkesi + allowlist'ler">
    Grup erişiminin iki katmanı vardır:

    1. **Grup üyeliği allowlist'i** (`channels.whatsapp.groups`)
       - `groups` atlanırsa tüm gruplar uygun kabul edilir
       - `groups` varsa, grup allowlist'i olarak davranır (`"*"` kabul edilir)

    2. **Grup gönderen ilkesi** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: gönderen allowlist'i atlanır
       - `allowlist`: gönderen `groupAllowFrom` ile eşleşmelidir (veya `*`)
       - `disabled`: tüm grup gelenlerini engeller

    Gönderen allowlist'i geri dönüşü:

    - `groupAllowFrom` ayarlanmamışsa, çalışma zamanı mevcut olduğunda `allowFrom` değerine geri döner
    - gönderen allowlist'leri, bahsetme/yanıt etkinleştirmesinden önce değerlendirilir

    Not: hiç `channels.whatsapp` bloğu yoksa, çalışma zamanı grup ilkesi geri dönüşü, `channels.defaults.groupPolicy` ayarlı olsa bile `allowlist` olur (bir uyarı günlüğü ile).

  </Tab>

  <Tab title="Bahsetmeler + /activation">
    Grup yanıtları varsayılan olarak bahsetme gerektirir.

    Bahsetme algılama şunları içerir:

    - bot kimliğine açık WhatsApp bahsetmeleri
    - yapılandırılmış bahsetme regex kalıpları (`agents.list[].groupChat.mentionPatterns`, geri dönüş olarak `messages.groupChat.mentionPatterns`)
    - yetkili grup mesajları için gelen sesli not dökümleri
    - örtük bota-yanıt algılama (yanıt göndereni bot kimliğiyle eşleşir)

    Güvenlik notu:

    - alıntı/yanıt yalnızca bahsetme geçidini karşılar; gönderen yetkilendirmesi sağlamaz
    - `groupPolicy: "allowlist"` ile, allowlist'te olmayan gönderenler allowlist'te olan bir kullanıcının mesajına yanıt verseler bile yine engellenir

    Oturum düzeyinde etkinleştirme komutu:

    - `/activation mention`
    - `/activation always`

    `activation`, oturum durumunu günceller (genel yapılandırmayı değil). Sahip denetimlidir.

  </Tab>
</Tabs>

## Kişisel numara ve kendinle sohbet davranışı

Bağlantılı kendi numarası `allowFrom` içinde de yer alıyorsa, WhatsApp kendinle sohbet korumaları etkinleşir:

- kendinle sohbet dönüşleri için okundu bilgilerini atla
- aksi halde kendinize ping atacak olan mention-JID otomatik tetikleme davranışını yok say
- `messages.responsePrefix` ayarlanmamışsa, kendinle sohbet yanıtları varsayılan olarak `[{identity.name}]` veya `[openclaw]` kullanır

## Mesaj normalizasyonu ve bağlam

<AccordionGroup>
  <Accordion title="Gelen zarfı + yanıt bağlamı">
    Gelen WhatsApp mesajları paylaşılan gelen zarfına sarılır.

    Alıntılanmış bir yanıt varsa, bağlam şu biçimde eklenir:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Yanıt meta veri alanları da mevcut olduğunda doldurulur (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, gönderen JID/E.164).

  </Accordion>

  <Accordion title="Medya yer tutucuları ve konum/kişi çıkarımı">
    Yalnızca medya içeren gelen mesajlar şu tür yer tutucularla normalize edilir:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Yetkili grup sesli notları, gövde yalnızca `<media:audio>` olduğunda bahsetme geçidinden önce yazıya dökülür; böylece sesli notta botun adını söylemek yanıtı tetikleyebilir. Döküm yine de bottan bahsetmiyorsa, döküm ham yer tutucu yerine bekleyen grup geçmişinde tutulur.

    Konum gövdeleri kısa koordinat metni kullanır. Konum etiketleri/yorumları ve kişi/vCard ayrıntıları satır içi istem metni olarak değil, çitlenmiş güvenilmeyen meta veri olarak işlenir.

  </Accordion>

  <Accordion title="Bekleyen grup geçmişi ekleme">
    Gruplar için işlenmemiş mesajlar arabelleğe alınabilir ve bot sonunda tetiklendiğinde bağlam olarak eklenebilir.

    - varsayılan sınır: `50`
    - yapılandırma: `channels.whatsapp.historyLimit`
    - geri dönüş: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    Ekleme işaretçileri:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Okundu bilgileri">
    Okundu bilgileri, kabul edilen gelen WhatsApp mesajları için varsayılan olarak etkindir.

    Genel olarak devre dışı bırakmak için:

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

    Kendinle sohbet dönüşleri, genel olarak etkin olsa bile okundu bilgilerini atlar.

  </Accordion>
</AccordionGroup>

## Teslimat, parçalama ve medya

<AccordionGroup>
  <Accordion title="Metin parçalama">
    - varsayılan parça sınırı: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` modu paragraf sınırlarını (boş satırlar) tercih eder, ardından uzunluk açısından güvenli parçalamaya geri döner

  </Accordion>

  <Accordion title="Giden medya davranışı">
    - görsel, video, ses (PTT sesli not) ve belge yüklerini destekler
    - ses medyası, Baileys `audio` yükü üzerinden `ptt: true` ile gönderilir; böylece WhatsApp istemcileri bunu bas-konuş sesli notu olarak işler
    - yanıt yükleri `audioAsVoice` değerini korur; WhatsApp için TTS sesli not çıktısı, sağlayıcı MP3 veya WebM döndürse bile bu PTT yolunda kalır
    - yerel Ogg/Opus ses, sesli not uyumluluğu için `audio/ogg; codecs=opus` olarak gönderilir
    - Microsoft Edge TTS MP3/WebM çıktısı dahil Ogg olmayan sesler, PTT teslimatından önce `ffmpeg` ile 48 kHz mono Ogg/Opus biçimine dönüştürülür
    - `/tts latest`, en son yardımcı yanıtını tek bir sesli not olarak gönderir ve aynı yanıt için tekrar gönderimi bastırır; `/tts chat on|off|default` geçerli WhatsApp sohbeti için otomatik TTS'yi denetler
    - hareketli GIF oynatımı, video gönderimlerinde `gifPlayback: true` ile desteklenir
    - çoklu medya yanıt yükleri gönderilirken başlıklar ilk medya öğesine uygulanır; ancak PTT sesli notları sesi önce ve görünür metni ayrı gönderir, çünkü WhatsApp istemcileri sesli not başlıklarını tutarlı şekilde işlemez
    - medya kaynağı HTTP(S), `file://` veya yerel yollar olabilir

  </Accordion>

  <Accordion title="Medya boyutu sınırları ve geri dönüş davranışı">
    - gelen medya kaydetme sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - giden medya gönderme sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - hesap başına geçersiz kılmalar `channels.whatsapp.accounts.<accountId>.mediaMaxMb` kullanır
    - görseller sınırlara uyması için otomatik olarak optimize edilir (yeniden boyutlandırma/kalite taraması)
    - medya gönderimi başarısız olduğunda, ilk öğe geri dönüşü yanıtı sessizce düşürmek yerine metin uyarısı gönderir

  </Accordion>
</AccordionGroup>

## Yanıt alıntılama

WhatsApp, giden yanıtların gelen mesajı görünür şekilde alıntıladığı yerel yanıt alıntılamayı destekler. Bunu `channels.whatsapp.replyToMode` ile kontrol edin.

| Değer      | Davranış                                                            |
| ---------- | ------------------------------------------------------------------- |
| `"off"`    | Asla alıntılama; düz mesaj olarak gönder                            |
| `"first"`  | Yalnızca ilk giden yanıt parçasını alıntıla                         |
| `"all"`    | Her giden yanıt parçasını alıntıla                                  |
| `"batched"` | Kuyruktaki toplu yanıtları alıntıla, anlık yanıtları alıntılama    |

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

`channels.whatsapp.reactionLevel`, aracının WhatsApp'ta emoji tepkilerini ne kadar geniş kullandığını denetler:

| Düzey        | Onay tepkileri | Aracı tarafından başlatılan tepkiler | Açıklama                                          |
| ------------ | -------------- | ------------------------------------ | ------------------------------------------------- |
| `"off"`      | Hayır          | Hayır                                | Hiç tepki yok                                     |
| `"ack"`      | Evet           | Hayır                                | Yalnızca onay tepkileri (yanıt öncesi alındı)     |
| `"minimal"`  | Evet           | Evet (temkinli)                      | Onay + temkinli yönlendirmeyle aracı tepkileri    |
| `"extensive"` | Evet          | Evet (teşvikli)                      | Onay + teşvikli yönlendirmeyle aracı tepkileri    |

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

WhatsApp, `channels.whatsapp.ackReaction` aracılığıyla gelen alımda anında onay tepkilerini destekler.
Onay tepkileri `reactionLevel` tarafından geçitlenir — `reactionLevel` `"off"` olduğunda bastırılır.

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
- grup modu `mentions`, bahsetmeyle tetiklenen dönüşlerde tepki verir; grup etkinleştirme `always` bu denetim için baypas görevi görür
- WhatsApp `channels.whatsapp.ackReaction` kullanır (eski `messages.ackReaction` burada kullanılmaz)

## Çoklu hesap ve kimlik bilgileri

<AccordionGroup>
  <Accordion title="Hesap seçimi ve varsayılanlar">
    - hesap kimlikleri `channels.whatsapp.accounts` içinden gelir
    - varsayılan hesap seçimi: varsa `default`, aksi halde ilk yapılandırılmış hesap kimliği (sıralı)
    - hesap kimlikleri arama için dahili olarak normalize edilir

  </Accordion>

  <Accordion title="Kimlik bilgisi yolları ve eski sürüm uyumluluğu">
    - mevcut kimlik doğrulama yolu: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - yedek dosya: `creds.json.bak`
    - `~/.openclaw/credentials/` içindeki eski varsayılan kimlik doğrulama, varsayılan hesap akışları için hâlâ tanınır/taşınır

  </Accordion>

  <Accordion title="Çıkış davranışı">
    `openclaw channels logout --channel whatsapp [--account <id>]`, o hesap için WhatsApp kimlik doğrulama durumunu temizler.

    Eski kimlik doğrulama dizinlerinde `oauth.json` korunur, Baileys kimlik doğrulama dosyaları ise kaldırılır.

  </Accordion>
</AccordionGroup>

## Araçlar, eylemler ve yapılandırma yazımları

- Aracı araç desteği, WhatsApp tepki eylemini (`react`) içerir.
- Eylem geçitleri:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Kanal tarafından başlatılan yapılandırma yazımları varsayılan olarak etkindir (`channels.whatsapp.configWrites=false` ile devre dışı bırakın).

## Sorun giderme

<AccordionGroup>
  <Accordion title="Bağlı değil (QR gerekli)">
    Belirti: kanal durumu bağlı olmadığını bildiriyor.

    Düzeltme:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Bağlı ama bağlantı kesik / yeniden bağlanma döngüsü">
    Belirti: tekrar eden bağlantı kesilmeleri veya yeniden bağlanma denemeleri olan bağlı hesap.

    Düzeltme:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Gerekirse `channels login` ile yeniden bağlayın.

  </Accordion>

  <Accordion title="Gönderim sırasında etkin dinleyici yok">
    Hedef hesap için etkin bir gateway dinleyicisi yoksa giden gönderimler hızlıca başarısız olur.

    Gateway'in çalıştığından ve hesabın bağlı olduğundan emin olun.

  </Accordion>

  <Accordion title="Grup mesajları beklenmedik şekilde yok sayılıyor">
    Şu sırayla kontrol edin:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` allowlist girdileri
    - bahsetme geçidi (`requireMention` + bahsetme kalıpları)
    - `openclaw.json` içindeki yinelenen anahtarlar (JSON5): sonraki girdiler öncekileri geçersiz kılar, bu yüzden kapsam başına tek bir `groupPolicy` tutun

  </Accordion>

  <Accordion title="Bun çalışma zamanı uyarısı">
    WhatsApp Gateway çalışma zamanı Node kullanmalıdır. Bun, kararlı WhatsApp/Telegram Gateway işlemiyle uyumsuz olarak işaretlenir.
  </Accordion>
</AccordionGroup>

## Sistem istemleri

WhatsApp, gruplar ve doğrudan sohbetler için `groups` ve `direct` haritaları aracılığıyla Telegram tarzı sistem istemlerini destekler.

Grup mesajları için çözümleme hiyerarşisi:

Önce etkin `groups` haritası belirlenir: hesap kendi `groups` değerini tanımlıyorsa, kök `groups` haritasını tamamen değiştirir (derin birleştirme yoktur). İstem araması daha sonra ortaya çıkan bu tek harita üzerinde yürütülür:

1. **Gruba özgü sistem istemi** (`groups["<groupId>"].systemPrompt`): belirli grup girdisi haritada mevcutsa **ve** `systemPrompt` anahtarı tanımlıysa kullanılır. `systemPrompt` boş dize (`""`) ise joker bastırılır ve hiçbir sistem istemi uygulanmaz.
2. **Grup joker sistem istemi** (`groups["*"].systemPrompt`): belirli grup girdisi haritada hiç yoksa veya mevcut olsa bile `systemPrompt` anahtarını tanımlamıyorsa kullanılır.

Doğrudan mesajlar için çözümleme hiyerarşisi:

Önce etkin `direct` haritası belirlenir: hesap kendi `direct` değerini tanımlıyorsa, kök `direct` haritasını tamamen değiştirir (derin birleştirme yoktur). İstem araması daha sonra ortaya çıkan bu tek harita üzerinde yürütülür:

1. **Doğrudan sohbete özgü sistem istemi** (`direct["<peerId>"].systemPrompt`): belirli eş girdisi haritada mevcutsa **ve** `systemPrompt` anahtarı tanımlıysa kullanılır. `systemPrompt` boş dize (`""`) ise joker bastırılır ve hiçbir sistem istemi uygulanmaz.
2. **Doğrudan sohbet joker sistem istemi** (`direct["*"].systemPrompt`): belirli eş girdisi haritada hiç yoksa veya mevcut olsa bile `systemPrompt` anahtarını tanımlamıyorsa kullanılır.

Not: `dms`, hafif DM başına geçmiş geçersiz kılma bölmesi olarak kalır (`dms.<id>.historyLimit`); istem geçersiz kılmaları `direct` altında yaşar.

**Telegram çoklu hesap davranışından farkı:** Telegram'da, çoklu hesap kurulumunda kök `groups`, kendi `groups` değerlerini tanımlamayan hesaplar için bile kasıtlı olarak bastırılır — bunun amacı bir botun üyesi olmadığı gruplardan grup mesajları almasını önlemektir. WhatsApp bu korumayı uygulamaz: kök `groups` ve kök `direct`, kaç hesap yapılandırılmış olduğuna bakılmaksızın hesap düzeyinde geçersiz kılma tanımlamayan hesaplar tarafından her zaman devralınır. Çoklu hesaplı bir WhatsApp kurulumunda, hesap başına grup veya doğrudan istemler istiyorsanız, kök düzey varsayılanlara güvenmek yerine tam haritayı her hesap altında açıkça tanımlayın.

Önemli davranış:

- `channels.whatsapp.groups`, hem grup başına yapılandırma haritası hem de sohbet düzeyinde grup allowlist'idir. Kök veya hesap kapsamında `groups["*"]`, o kapsam için "tüm gruplar kabul edilir" anlamına gelir.
- Joker grup `systemPrompt` değerini yalnızca ilgili kapsamın zaten tüm grupları kabul etmesini istiyorsanız ekleyin. Yalnızca sabit bir grup kimliği kümesinin uygun kalmasını istiyorsanız, istem varsayılanı için `groups["*"]` kullanmayın. Bunun yerine, istemi açıkça allowlist'e alınmış her grup girdisinde tekrarlayın.
- Grup kabulü ile gönderen yetkilendirmesi ayrı denetimlerdir. `groups["*"]`, grup işlemeye ulaşabilen grup kümesini genişletir, ancak tek başına bu gruplardaki her göndereni yetkilendirmez. Gönderen erişimi hâlâ ayrı olarak `channels.whatsapp.groupPolicy` ve `channels.whatsapp.groupAllowFrom` ile denetlenir.
- `channels.whatsapp.direct`, DM'ler için aynı yan etkiye sahip değildir. `direct["*"]`, yalnızca bir DM zaten `dmPolicy` ile `allowFrom` veya eşleştirme deposu kuralları tarafından kabul edildikten sonra varsayılan doğrudan sohbet yapılandırmasını sağlar.

Örnek:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Yalnızca tüm gruplar kök kapsamda kabul edilmeliyse kullanın.
        // Kendi groups haritasını tanımlamayan tüm hesaplar için geçerlidir.
        "*": { systemPrompt: "Tüm gruplar için varsayılan istem." },
      },
      direct: {
        // Kendi direct haritasını tanımlamayan tüm hesaplar için geçerlidir.
        "*": { systemPrompt: "Tüm doğrudan sohbetler için varsayılan istem." },
      },
      accounts: {
        work: {
          groups: {
            // Bu hesap kendi groups değerini tanımlar, bu yüzden kök groups
            // tamamen değiştirilir. Jokeri korumak için burada da "*" açıkça tanımlayın.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Proje yönetimine odaklan.",
            },
            // Yalnızca bu hesapta tüm gruplar kabul edilmeliyse kullanın.
            "*": { systemPrompt: "İş grupları için varsayılan istem." },
          },
          direct: {
            // Bu hesap kendi direct haritasını tanımlar, bu yüzden kök direct girdileri
            // tamamen değiştirilir. Jokeri korumak için burada da "*" açıkça tanımlayın.
            "+15551234567": { systemPrompt: "Belirli bir iş doğrudan sohbeti için istem." },
            "*": { systemPrompt: "İş doğrudan sohbetleri için varsayılan istem." },
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

Yüksek sinyalli WhatsApp alanları:

- erişim: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- teslimat: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- çoklu hesap: `accounts.<id>.enabled`, `accounts.<id>.authDir`, hesap düzeyinde geçersiz kılmalar
- işlemler: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- oturum davranışı: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- istemler: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Güvenlik](/tr/gateway/security)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Çoklu aracı yönlendirme](/tr/concepts/multi-agent)
- [Sorun giderme](/tr/channels/troubleshooting)
