---
read_when:
    - WhatsApp/web kanal davranışı veya gelen kutusu yönlendirmesi üzerinde çalışırken
summary: WhatsApp kanal desteği, erişim denetimleri, teslimat davranışı ve işlemler
title: WhatsApp
x-i18n:
    generated_at: "2026-04-05T13:47:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c16a468b3f47fdf7e4fc3fd745b5c49c7ccebb7af0e8c87c632b78b04c583e49
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (Web kanalı)

Durum: WhatsApp Web (Baileys) üzerinden üretime hazır. Bağlı oturum(lar)ın sahibi ağ geçididir.

## Kurulum (gerektiğinde)

- Onboarding (`openclaw onboard`) ve `openclaw channels add --channel whatsapp`,
  ilk kez seçtiğinizde WhatsApp eklentisini yüklemeyi önerir.
- `openclaw channels login --channel whatsapp` da,
  eklenti henüz mevcut değilse kurulum akışını sunar.
- Geliştirme kanalı + git checkout: varsayılan olarak yerel eklenti yolunu kullanır.
- Stable/Beta: varsayılan olarak `@openclaw/whatsapp` npm paketini kullanır.

Elle kurulum seçeneği kullanılmaya devam eder:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bilinmeyen göndericiler için varsayılan DM ilkesi eşleştirmedir.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/channels/troubleshooting">
    Kanallar arası tanılama ve onarım kılavuzları.
  </Card>
  <Card title="Ağ geçidi yapılandırması" icon="settings" href="/gateway/configuration">
    Tüm kanal yapılandırma desenleri ve örnekleri.
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

  </Step>

  <Step title="Ağ geçidini başlatın">

```bash
openclaw gateway
```

  </Step>

  <Step title="İlk eşleştirme isteğini onaylayın (eşleştirme kipi kullanılıyorsa)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Eşleştirme isteklerinin süresi 1 saat sonra dolar. Bekleyen istekler kanal başına en fazla 3 ile sınırlıdır.

  </Step>
</Steps>

<Note>
OpenClaw, mümkün olduğunda WhatsApp'ı ayrı bir numarada çalıştırmanızı önerir. (Kanal meta verileri ve kurulum akışı bu kurulum için optimize edilmiştir, ancak kişisel numara kurulumları da desteklenir.)
</Note>

## Dağıtım desenleri

<AccordionGroup>
  <Accordion title="Ayrı numara (önerilen)">
    Bu en temiz operasyonel kipidir:

    - OpenClaw için ayrı WhatsApp kimliği
    - daha net DM allowlist'leri ve yönlendirme sınırları
    - kendinize sohbet karışıklığı yaşama olasılığının daha düşük olması

    Minimum ilke deseni:

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
    Onboarding kişisel numara kipini destekler ve self-chat dostu bir temel yapılandırma yazar:

    - `dmPolicy: "allowlist"`
    - `allowFrom` kişisel numaranızı içerir
    - `selfChatMode: true`

    Çalışma zamanında self-chat korumaları, bağlı self numarası ve `allowFrom` üzerinden çalışır.

  </Accordion>

  <Accordion title="Yalnızca WhatsApp Web kanal kapsamı">
    Mevcut OpenClaw kanal mimarisinde mesajlaşma platformu kanalı WhatsApp Web tabanlıdır (`Baileys`).

    Yerleşik sohbet-kanalı kayıt defterinde ayrı bir Twilio WhatsApp mesajlaşma kanalı yoktur.

  </Accordion>
</AccordionGroup>

## Çalışma zamanı modeli

- WhatsApp soketi ve yeniden bağlanma döngüsünün sahibi ağ geçididir.
- Giden gönderimler, hedef hesap için etkin bir WhatsApp dinleyicisi gerektirir.
- Durum ve yayın sohbetleri yok sayılır (`@status`, `@broadcast`).
- Doğrudan sohbetler DM oturum kurallarını kullanır (`session.dmScope`; varsayılan `main`, DM'leri aracının ana oturumunda birleştirir).
- Grup oturumları yalıtılmıştır (`agent:<agentId>:whatsapp:group:<jid>`).

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.whatsapp.dmPolicy` doğrudan sohbet erişimini denetler:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` değerinin `"*"` içermesini gerektirir)
    - `disabled`

    `allowFrom`, E.164 biçimli numaraları kabul eder (dahili olarak normalize edilir).

    Çoklu hesap geçersiz kılması: `channels.whatsapp.accounts.<id>.dmPolicy` (ve `allowFrom`) o hesap için kanal düzeyindeki varsayılanların önüne geçer.

    Çalışma zamanı davranışı ayrıntıları:

    - eşleştirmeler kanal izin deposunda kalıcı olarak saklanır ve yapılandırılmış `allowFrom` ile birleştirilir
    - herhangi bir allowlist yapılandırılmamışsa, bağlı self numarasına varsayılan olarak izin verilir
    - giden `fromMe` DM'leri hiçbir zaman otomatik eşleştirilmez

  </Tab>

  <Tab title="Grup ilkesi + allowlist'ler">
    Grup erişiminde iki katman vardır:

    1. **Grup üyeliği allowlist'i** (`channels.whatsapp.groups`)
       - `groups` atlanırsa tüm gruplar uygun kabul edilir
       - `groups` mevcutsa grup allowlist'i görevi görür (`"*"` izinlidir)

    2. **Grup gönderici ilkesi** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: gönderici allowlist'i atlanır
       - `allowlist`: gönderici `groupAllowFrom` ile eşleşmelidir (veya `*`)
       - `disabled`: tüm grup gelenlerini engeller

    Gönderici allowlist'i yedeği:

    - `groupAllowFrom` ayarlanmamışsa, çalışma zamanı mevcut olduğunda `allowFrom` değerine döner
    - gönderici allowlist'leri, mention/yanıt etkinleştirmesinden önce değerlendirilir

    Not: Hiç `channels.whatsapp` bloğu yoksa, `channels.defaults.groupPolicy` ayarlı olsa bile çalışma zamanı grup ilkesi yedeği `allowlist` olur (bir uyarı günlüğü ile).

  </Tab>

  <Tab title="Mention'lar + /activation">
    Grup yanıtları varsayılan olarak mention gerektirir.

    Mention algılama şunları içerir:

    - bot kimliğine yapılan açık WhatsApp mention'ları
    - yapılandırılmış mention regex desenleri (`agents.list[].groupChat.mentionPatterns`, yedek olarak `messages.groupChat.mentionPatterns`)
    - bottan gelen mesaja yanıt verme durumunun örtük algılanması (yanıt göndereni bot kimliğiyle eşleşir)

    Güvenlik notu:

    - alıntı/yanıt yalnızca mention geçitlemesini karşılar; gönderici yetkisi vermez
    - `groupPolicy: "allowlist"` ile, allowlist'te olmayan göndericiler bir allowlist kullanıcısının mesajına yanıt verseler bile yine de engellenir

    Oturum düzeyinde etkinleştirme komutu:

    - `/activation mention`
    - `/activation always`

    `activation`, oturum durumunu günceller (genel yapılandırmayı değil). Sahip geçitlidir.

  </Tab>
</Tabs>

## Kişisel numara ve self-chat davranışı

Bağlı self numarası `allowFrom` içinde de bulunduğunda, WhatsApp self-chat korumaları etkinleşir:

- self-chat dönüşleri için okundu bilgilerini atlar
- aksi halde kendinize ping atacak mention-JID otomatik tetikleme davranışını yok sayar
- `messages.responsePrefix` ayarlanmamışsa, self-chat yanıtları varsayılan olarak `[{identity.name}]` veya `[openclaw]` olur

## Mesaj normalizasyonu ve bağlam

<AccordionGroup>
  <Accordion title="Gelen zarfı + yanıt bağlamı">
    Gelen WhatsApp mesajları, paylaşılan gelen zarfına sarılır.

    Alıntılanmış bir yanıt varsa, bağlam şu biçimde eklenir:

    ```text
    [<sender> id:<stanzaId> mesajına yanıt veriliyor]
    <alıntılanan gövde veya medya yer tutucusu>
    [/Yanıt veriliyor]
    ```

    Mevcut olduğunda yanıt meta veri alanları da doldurulur (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, gönderen JID/E.164).

  </Accordion>

  <Accordion title="Medya yer tutucuları ve konum/kişi çıkarımı">
    Yalnızca medya içeren gelen mesajlar şu tür yer tutucularla normalize edilir:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Konum ve kişi payload'ları yönlendirmeden önce metinsel bağlama normalize edilir.

  </Accordion>

  <Accordion title="Bekleyen grup geçmişi ekleme">
    Gruplarda, işlenmemiş mesajlar arabelleğe alınabilir ve bot sonunda tetiklendiğinde bağlam olarak eklenebilir.

    - varsayılan sınır: `50`
    - yapılandırma: `channels.whatsapp.historyLimit`
    - yedek: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    Ekleme işaretçileri:

    - `[Son yanıtınızdan bu yana sohbet mesajları - bağlam için]`
    - `[Geçerli mesaj - buna yanıt verin]`

  </Accordion>

  <Accordion title="Okundu bilgileri">
    Kabul edilen gelen WhatsApp mesajları için okundu bilgileri varsayılan olarak etkindir.

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

    Self-chat dönüşleri, genel olarak etkin olsa bile okundu bilgilerini atlar.

  </Accordion>
</AccordionGroup>

## Teslimat, parçalama ve medya

<AccordionGroup>
  <Accordion title="Metin parçalama">
    - varsayılan parça sınırı: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` kipi paragraf sınırlarını (boş satırlar) tercih eder, ardından uzunluk açısından güvenli parçalamaya döner
  </Accordion>

  <Accordion title="Giden medya davranışı">
    - resim, video, ses (PTT sesli not) ve belge payload'larını destekler
    - `audio/ogg`, sesli not uyumluluğu için `audio/ogg; codecs=opus` olarak yeniden yazılır
    - hareketli GIF oynatımı, video gönderimlerinde `gifPlayback: true` ile desteklenir
    - çoklu medya yanıt payload'ları gönderilirken başlıklar ilk medya öğesine uygulanır
    - medya kaynağı HTTP(S), `file://` veya yerel yollar olabilir
  </Accordion>

  <Accordion title="Medya boyutu sınırları ve yedek davranış">
    - gelen medya kaydetme sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - giden medya gönderme sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - hesap başına geçersiz kılmalar `channels.whatsapp.accounts.<accountId>.mediaMaxMb` kullanır
    - resimler sınırlara sığması için otomatik olarak optimize edilir (yeniden boyutlandırma/kalite taraması)
    - medya gönderme hatasında, sessizce yanıtı düşürmek yerine ilk öğe yedeği metin uyarısı gönderir
  </Accordion>
</AccordionGroup>

## Tepki düzeyi

`channels.whatsapp.reactionLevel`, aracının WhatsApp'ta emoji tepkilerini ne kadar geniş kullandığını denetler:

| Düzey         | Ack tepkileri | Aracının başlattığı tepkiler | Açıklama                                        |
| ------------- | ------------- | ---------------------------- | ----------------------------------------------- |
| `"off"`       | Hayır         | Hayır                        | Hiç tepki yok                                   |
| `"ack"`       | Evet          | Hayır                        | Yalnızca ack tepkileri (yanıt öncesi alındı)    |
| `"minimal"`   | Evet          | Evet (temkinli)              | Ack + temkinli yönlendirmeyle aracı tepkileri   |
| `"extensive"` | Evet          | Evet (teşvik edilir)         | Ack + teşvik edilen yönlendirmeyle aracı tepkileri |

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

## Alındı onay tepkileri

WhatsApp, `channels.whatsapp.ackReaction` aracılığıyla gelen alımında anında ack tepkilerini destekler.
Ack tepkileri `reactionLevel` ile geçitlenir — `reactionLevel` `"off"` olduğunda bastırılırlar.

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
- grup kipi `mentions`, mention ile tetiklenen dönüşlerde tepki verir; grup etkinleştirmesi `always` ise bu denetimi atlama görevi görür
- WhatsApp, `channels.whatsapp.ackReaction` kullanır (eski `messages.ackReaction` burada kullanılmaz)

## Çoklu hesap ve kimlik bilgileri

<AccordionGroup>
  <Accordion title="Hesap seçimi ve varsayılanlar">
    - hesap kimlikleri `channels.whatsapp.accounts` içinden gelir
    - varsayılan hesap seçimi: varsa `default`, yoksa yapılandırılmış ilk hesap kimliği (sıralı)
    - hesap kimlikleri arama için dahili olarak normalize edilir
  </Accordion>

  <Accordion title="Kimlik bilgisi yolları ve eski uyumluluk">
    - geçerli kimlik doğrulama yolu: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - yedek dosya: `creds.json.bak`
    - `~/.openclaw/credentials/` içindeki eski varsayılan kimlik doğrulama, varsayılan hesap akışları için hâlâ tanınır/taşınır
  </Accordion>

  <Accordion title="Çıkış yapma davranışı">
    `openclaw channels logout --channel whatsapp [--account <id>]`, o hesap için WhatsApp kimlik doğrulama durumunu temizler.

    Eski kimlik doğrulama dizinlerinde, Baileys kimlik doğrulama dosyaları kaldırılırken `oauth.json` korunur.

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

  <Accordion title="Bağlı ama bağlantısı kesilmiş / yeniden bağlanma döngüsü">
    Belirti: bağlı hesapta tekrarlanan bağlantı kopmaları veya yeniden bağlanma denemeleri var.

    Düzeltme:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Gerekirse `channels login` ile yeniden bağlayın.

  </Accordion>

  <Accordion title="Gönderim sırasında etkin dinleyici yok">
    Hedef hesap için etkin bir ağ geçidi dinleyicisi olmadığında giden gönderimler hızlıca başarısız olur.

    Ağ geçidinin çalıştığından ve hesabın bağlı olduğundan emin olun.

  </Accordion>

  <Accordion title="Grup mesajları beklenmedik şekilde yok sayılıyor">
    Şu sırayla kontrol edin:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` allowlist girdileri
    - mention geçitlemesi (`requireMention` + mention desenleri)
    - `openclaw.json` içindeki yinelenen anahtarlar (JSON5): sonraki girdiler öncekileri geçersiz kılar, bu yüzden kapsam başına tek bir `groupPolicy` tutun

  </Accordion>

  <Accordion title="Bun çalışma zamanı uyarısı">
    WhatsApp ağ geçidi çalışma zamanı Node kullanmalıdır. Bun, kararlı WhatsApp/Telegram ağ geçidi çalışması için uyumsuz olarak işaretlenmiştir.
  </Accordion>
</AccordionGroup>

## Yapılandırma başvuru işaretçileri

Birincil başvuru:

- [Yapılandırma başvurusu - WhatsApp](/gateway/configuration-reference#whatsapp)

Yüksek sinyalli WhatsApp alanları:

- erişim: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- teslimat: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- çoklu hesap: `accounts.<id>.enabled`, `accounts.<id>.authDir`, hesap düzeyi geçersiz kılmaları
- işlemler: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- oturum davranışı: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Güvenlik](/gateway/security)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Çoklu aracı yönlendirme](/concepts/multi-agent)
- [Sorun giderme](/channels/troubleshooting)
