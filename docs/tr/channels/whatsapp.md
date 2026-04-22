---
read_when:
    - WhatsApp/web kanal davranışı veya gelen kutusu yönlendirmesi üzerinde çalışma
summary: WhatsApp kanal desteği, erişim denetimleri, teslimat davranışı ve işlemler
title: WhatsApp
x-i18n:
    generated_at: "2026-04-22T04:21:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c527b9f7f58f4bb7272a6d1c0f9a435d7d46a9b99790243594afb5c305606b3
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (Web kanalı)

Durum: WhatsApp Web (Baileys) üzerinden üretime hazır. Gateway, bağlı oturum(lar)ın sahibidir.

## Kurulum (gerektiğinde)

- `openclaw onboard` ve `openclaw channels add --channel whatsapp`,
  onu ilk kez seçtiğinizde WhatsApp plugin'ini kurmanızı ister.
- `openclaw channels login --channel whatsapp` da
  plugin henüz mevcut değilse kurulum akışını sunar.
- Geliştirme kanalı + git checkout: varsayılan olarak yerel plugin yolunu kullanır.
- Stable/Beta: varsayılan olarak `@openclaw/whatsapp` npm paketini kullanır.

Manuel kurulum seçeneği kullanılabilir olmaya devam eder:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bilinmeyen göndericiler için varsayılan DM ilkesi eşleştirmedir.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım kılavuzları.
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

    Eşleştirme isteklerinin süresi 1 saat sonra dolar. Bekleyen istekler kanal başına 3 ile sınırlıdır.

  </Step>
</Steps>

<Note>
OpenClaw mümkün olduğunda WhatsApp'ı ayrı bir numarada çalıştırmayı önerir. (Kanal meta verileri ve kurulum akışı bu kurulum için optimize edilmiştir, ancak kişisel numara kurulumları da desteklenir.)
</Note>

## Dağıtım kalıpları

<AccordionGroup>
  <Accordion title="Ayrı numara (önerilen)">
    Bu en temiz operasyon modudur:

    - OpenClaw için ayrı WhatsApp kimliği
    - daha net DM allowlist'leri ve yönlendirme sınırları
    - kendinle sohbet karışıklığı olasılığının daha düşük olması

    Minimum ilke kalıbı:

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
    Onboarding kişisel numara modunu destekler ve self-chat dostu bir taban yapılandırma yazar:

    - `dmPolicy: "allowlist"`
    - `allowFrom` kişisel numaranızı içerir
    - `selfChatMode: true`

    Çalışma zamanında self-chat korumaları, bağlı kendi numaranız ve `allowFrom` temel alınarak çalışır.

  </Accordion>

  <Accordion title="Yalnızca WhatsApp Web kanal kapsamı">
    Mesajlaşma platformu kanalı, mevcut OpenClaw kanal mimarisinde WhatsApp Web tabanlıdır (`Baileys`).

    Yerleşik sohbet-kanalı kayıt defterinde ayrı bir Twilio WhatsApp mesajlaşma kanalı yoktur.

  </Accordion>
</AccordionGroup>

## Çalışma zamanı modeli

- Gateway, WhatsApp soketi ve yeniden bağlanma döngüsünün sahibidir.
- Giden gönderimler, hedef hesap için etkin bir WhatsApp dinleyicisi gerektirir.
- Durum ve yayın sohbetleri yok sayılır (`@status`, `@broadcast`).
- Doğrudan sohbetler DM oturum kurallarını kullanır (`session.dmScope`; varsayılan `main`, DM'leri agent ana oturumunda birleştirir).
- Grup oturumları yalıtılmıştır (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Web taşıması, Gateway host'unda standart proxy ortam değişkenlerine uyar (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / küçük harfli varyantları). Kanala özgü WhatsApp proxy ayarları yerine host düzeyi proxy yapılandırmasını tercih edin.

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.whatsapp.dmPolicy`, doğrudan sohbet erişimini kontrol eder:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` içine `"*"` eklenmesini gerektirir)
    - `disabled`

    `allowFrom`, E.164 tarzı numaraları kabul eder (dahili olarak normalize edilir).

    Çoklu hesap geçersiz kılması: `channels.whatsapp.accounts.<id>.dmPolicy` (ve `allowFrom`), o hesap için kanal düzeyi varsayılanlara göre önceliklidir.

    Çalışma zamanı davranışı ayrıntıları:

    - eşleştirmeler kanal allow-store içinde kalıcıdır ve yapılandırılmış `allowFrom` ile birleştirilir
    - yapılandırılmış bir allowlist yoksa, bağlı kendi numaranıza varsayılan olarak izin verilir
    - giden `fromMe` DM'leri hiçbir zaman otomatik eşleştirilmez

  </Tab>

  <Tab title="Grup ilkesi + allowlist'ler">
    Grup erişiminde iki katman vardır:

    1. **Grup üyeliği allowlist'i** (`channels.whatsapp.groups`)
       - `groups` atlanırsa tüm gruplar uygun kabul edilir
       - `groups` varsa, grup allowlist'i olarak davranır (`"*"` kabul edilir)

    2. **Grup gönderici ilkesi** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: gönderici allowlist'i atlanır
       - `allowlist`: gönderici `groupAllowFrom` ile eşleşmelidir (veya `*`)
       - `disabled`: tüm grup gelenlerini engelle

    Gönderici allowlist'i geri dönüşü:

    - `groupAllowFrom` ayarlı değilse, çalışma zamanı mümkün olduğunda `allowFrom` değerine geri döner
    - gönderici allowlist'leri, mention/yanıt etkinleştirmesinden önce değerlendirilir

    Not: Hiç `channels.whatsapp` bloğu yoksa, çalışma zamanı grup ilkesi geri dönüşü `allowlist` olur (uyarı günlüğüyle), `channels.defaults.groupPolicy` ayarlı olsa bile.

  </Tab>

  <Tab title="Mention'lar + /activation">
    Grup yanıtları varsayılan olarak mention gerektirir.

    Mention algılama şunları içerir:

    - bot kimliğine yapılan açık WhatsApp mention'ları
    - yapılandırılmış mention regex kalıpları (`agents.list[].groupChat.mentionPatterns`, geri dönüş olarak `messages.groupChat.mentionPatterns`)
    - bota yanıt verme durumunun örtük algılanması (yanıt gönderen bot kimliğiyle eşleşir)

    Güvenlik notu:

    - alıntı/yanıt yalnızca mention geçitlemesini karşılar; gönderici yetkilendirmesi vermez
    - `groupPolicy: "allowlist"` ile, allowlist'te olmayan göndericiler, allowlist'teki bir kullanıcının mesajına yanıt verseler bile yine de engellenir

    Oturum düzeyinde etkinleştirme komutu:

    - `/activation mention`
    - `/activation always`

    `activation`, oturum durumunu günceller (genel yapılandırmayı değil). Sahip denetimlidir.

  </Tab>
</Tabs>

## Kişisel numara ve self-chat davranışı

Bağlı kendi numaranız `allowFrom` içinde de varsa, WhatsApp self-chat korumaları etkinleşir:

- self-chat turları için okundu bilgilerini atla
- aksi halde kendinize ping atacak mention-JID otomatik tetikleme davranışını yok say
- `messages.responsePrefix` ayarlı değilse, self-chat yanıtları varsayılan olarak `[{identity.name}]` veya `[openclaw]` kullanır

## Mesaj normalizasyonu ve bağlam

<AccordionGroup>
  <Accordion title="Gelen zarf + yanıt bağlamı">
    Gelen WhatsApp mesajları, paylaşılan gelen zarfı içine alınır.

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

    Konum ve kişi payload'ları yönlendirmeden önce metinsel bağlama normalize edilir.

  </Accordion>

  <Accordion title="Bekleyen grup geçmişi ekleme">
    Gruplar için, işlenmemiş mesajlar tamponlanabilir ve bot nihayet tetiklendiğinde bağlam olarak eklenebilir.

    - varsayılan sınır: `50`
    - yapılandırma: `channels.whatsapp.historyLimit`
    - geri dönüş: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    Ekleme işaretleyicileri:

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

    Self-chat turları, genel olarak etkin olsa bile okundu bilgilerini atlar.

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
    - görsel, video, ses (PTT sesli not) ve belge payload'larını destekler
    - `audio/ogg`, sesli not uyumluluğu için `audio/ogg; codecs=opus` olarak yeniden yazılır
    - animasyonlu GIF oynatımı, video gönderimlerinde `gifPlayback: true` ile desteklenir
    - çoklu medya yanıt payload'ları gönderilirken başlıklar ilk medya öğesine uygulanır
    - medya kaynağı HTTP(S), `file://` veya yerel yollar olabilir
  </Accordion>

  <Accordion title="Medya boyut sınırları ve geri dönüş davranışı">
    - gelen medya kaydetme üst sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - giden medya gönderme üst sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - hesap başına geçersiz kılmalar `channels.whatsapp.accounts.<accountId>.mediaMaxMb` kullanır
    - görseller sınırlara uyması için otomatik optimize edilir (yeniden boyutlandırma/kalite taraması)
    - medya gönderimi başarısız olursa, ilk öğe geri dönüşü yanıtı sessizce düşürmek yerine metin uyarısı gönderir
  </Accordion>
</AccordionGroup>

## Tepki düzeyi

`channels.whatsapp.reactionLevel`, agent'ın WhatsApp'ta emoji tepkilerini ne kadar geniş kullandığını kontrol eder:

| Düzey        | Alındı tepkileri | Agent tarafından başlatılan tepkiler | Açıklama                                      |
| ------------ | ---------------- | ------------------------------------ | --------------------------------------------- |
| `"off"`      | Hayır            | Hayır                                | Hiç tepki yok                                 |
| `"ack"`      | Evet             | Hayır                                | Yalnızca alındı tepkileri (yanıt öncesi alındı) |
| `"minimal"`  | Evet             | Evet (temkinli)                      | Alındı + temkinli yönlendirmeyle agent tepkileri |
| `"extensive"`| Evet             | Evet (teşvik edilir)                 | Alındı + teşvik edilen yönlendirmeyle agent tepkileri |

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

## Alındı tepkileri

WhatsApp, `channels.whatsapp.ackReaction` aracılığıyla gelen alındığında anında alındı tepkilerini destekler.
Alındı tepkileri `reactionLevel` ile denetlenir — `reactionLevel` `"off"` olduğunda bastırılırlar.

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
- hatalar günlüğe yazılır ancak normal yanıt teslimatını engellemez
- grup modu `mentions`, mention ile tetiklenen turlarda tepki verir; grup etkinleştirmesi `always` bu denetim için baypas görevi görür
- WhatsApp `channels.whatsapp.ackReaction` kullanır (eski `messages.ackReaction` burada kullanılmaz)

## Çoklu hesap ve kimlik bilgileri

<AccordionGroup>
  <Accordion title="Hesap seçimi ve varsayılanlar">
    - hesap kimlikleri `channels.whatsapp.accounts` üzerinden gelir
    - varsayılan hesap seçimi: varsa `default`, yoksa ilk yapılandırılmış hesap kimliği (sıralı)
    - hesap kimlikleri arama için dahili olarak normalize edilir
  </Accordion>

  <Accordion title="Kimlik bilgisi yolları ve eski sürüm uyumluluğu">
    - güncel kimlik doğrulama yolu: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - yedek dosya: `creds.json.bak`
    - `~/.openclaw/credentials/` içindeki eski varsayılan kimlik doğrulama, varsayılan hesap akışları için hâlâ tanınır/geçirilir
  </Accordion>

  <Accordion title="Çıkış yapma davranışı">
    `openclaw channels logout --channel whatsapp [--account <id>]`, o hesap için WhatsApp kimlik doğrulama durumunu temizler.

    Eski kimlik doğrulama dizinlerinde, `oauth.json` korunurken Baileys kimlik doğrulama dosyaları kaldırılır.

  </Accordion>
</AccordionGroup>

## Araçlar, eylemler ve yapılandırma yazımları

- Agent araç desteği, WhatsApp tepki eylemini (`react`) içerir.
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
    Belirti: tekrarlanan bağlantı kesilmeleri veya yeniden bağlanma girişimleri olan bağlı hesap.

    Düzeltme:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Gerekirse `channels login` ile yeniden bağlayın.

  </Accordion>

  <Accordion title="Gönderim sırasında etkin dinleyici yok">
    Hedef hesap için etkin Gateway dinleyicisi yoksa giden gönderimler hızlıca başarısız olur.

    Gateway'in çalıştığından ve hesabın bağlı olduğundan emin olun.

  </Accordion>

  <Accordion title="Grup mesajları beklenmedik şekilde yok sayılıyor">
    Şu sırayla kontrol edin:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` allowlist girdileri
    - mention geçitlemesi (`requireMention` + mention kalıpları)
    - `openclaw.json` içinde yinelenen anahtarlar (JSON5): sonraki girdiler öncekileri geçersiz kılar, bu nedenle her kapsam için tek bir `groupPolicy` tutun

  </Accordion>

  <Accordion title="Bun çalışma zamanı uyarısı">
    WhatsApp Gateway çalışma zamanı Node kullanmalıdır. Bun, kararlı WhatsApp/Telegram Gateway işlemi için uyumsuz olarak işaretlenir.
  </Accordion>
</AccordionGroup>

## Sistem istemleri

WhatsApp, grup ve doğrudan sohbetler için `groups` ve `direct` haritaları üzerinden Telegram tarzı sistem istemlerini destekler.

Grup mesajları için çözümleme hiyerarşisi:

Önce etkili `groups` haritası belirlenir: hesap kendi `groups` alanını tanımlıyorsa, kök `groups` haritasını tamamen değiştirir (derin birleştirme yoktur). Ardından istem araması ortaya çıkan tek harita üzerinde çalışır:

1. **Gruba özgü sistem istemi** (`groups["<groupId>"].systemPrompt`): belirli grup girdisi bir `systemPrompt` tanımlıyorsa kullanılır.
2. **Grup joker sistem istemi** (`groups["*"].systemPrompt`): belirli grup girdisi yoksa veya `systemPrompt` tanımlamıyorsa kullanılır.

Doğrudan mesajlar için çözümleme hiyerarşisi:

Önce etkili `direct` haritası belirlenir: hesap kendi `direct` alanını tanımlıyorsa, kök `direct` haritasını tamamen değiştirir (derin birleştirme yoktur). Ardından istem araması ortaya çıkan tek harita üzerinde çalışır:

1. **Doğrudan mesaja özgü sistem istemi** (`direct["<peerId>"].systemPrompt`): belirli eş girdisi bir `systemPrompt` tanımlıyorsa kullanılır.
2. **Doğrudan mesaj joker sistem istemi** (`direct["*"].systemPrompt`): belirli eş girdisi yoksa veya `systemPrompt` tanımlamıyorsa kullanılır.

Not: `dms`, hafif DM başına geçmiş geçersiz kılma bölümü olarak kalır (`dms.<id>.historyLimit`); istem geçersiz kılmaları `direct` altında bulunur.

**Telegram çoklu hesap davranışından farkı:** Telegram'da, bir botun üyesi olmadığı gruplardan grup mesajları almasını önlemek için, çoklu hesap kurulumunda kök `groups` tüm hesaplar için bilinçli olarak bastırılır — kendi `groups` alanını tanımlamayan hesaplarda bile. WhatsApp bu korumayı uygulamaz: kök `groups` ve kök `direct`, kaç hesap yapılandırılmış olursa olsun, hesap düzeyinde geçersiz kılma tanımlamayan hesaplar tarafından her zaman devralınır. Çoklu hesaplı bir WhatsApp kurulumunda hesap başına grup veya doğrudan mesaj istemleri istiyorsanız, kök düzey varsayılanlara güvenmek yerine tam haritayı her hesap altında açıkça tanımlayın.

Önemli davranış:

- `channels.whatsapp.groups`, hem grup başına yapılandırma haritası hem de sohbet düzeyinde grup allowlist'idir. Kökte veya hesap kapsamında `groups["*"]`, o kapsam için "tüm gruplar kabul edilir" anlamına gelir.
- Yalnızca o kapsamda tüm grupların kabul edilmesini zaten istiyorsanız joker grup `systemPrompt` ekleyin. Hâlâ yalnızca sabit bir grup kimliği kümesinin uygun olmasını istiyorsanız, istem varsayılanı için `groups["*"]` kullanmayın. Bunun yerine, istemi açıkça allowlist'e alınmış her grup girdisinde tekrarlayın.
- Grup kabulü ile gönderen yetkilendirmesi ayrı denetimlerdir. `groups["*"]`, grup işleme aşamasına ulaşabilecek grup kümesini genişletir, ancak bu gruplardaki her göndereni tek başına yetkilendirmez. Gönderen erişimi yine ayrı olarak `channels.whatsapp.groupPolicy` ve `channels.whatsapp.groupAllowFrom` ile kontrol edilir.
- `channels.whatsapp.direct`, DM'ler için aynı yan etkiye sahip değildir. `direct["*"]`, yalnızca bir DM zaten `dmPolicy` artı `allowFrom` veya pairing-store kurallarıyla kabul edildikten sonra varsayılan doğrudan sohbet yapılandırmasını sağlar.

Örnek:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Yalnızca tüm grupların kök kapsamda kabul edilmesi gerekiyorsa kullanın.
        // Kendi groups haritasını tanımlamayan tüm hesaplara uygulanır.
        "*": { systemPrompt: "Tüm gruplar için varsayılan istem." },
      },
      direct: {
        // Kendi direct haritasını tanımlamayan tüm hesaplara uygulanır.
        "*": { systemPrompt: "Tüm doğrudan sohbetler için varsayılan istem." },
      },
      accounts: {
        work: {
          groups: {
            // Bu hesap kendi groups alanını tanımlar, bu nedenle kök groups tamamen
            // değiştirilir. Jokeri korumak için burada da "*" değerini açıkça tanımlayın.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Proje yönetimine odaklan.",
            },
            // Yalnızca bu hesapta tüm grupların kabul edilmesi gerekiyorsa kullanın.
            "*": { systemPrompt: "İş grupları için varsayılan istem." },
          },
          direct: {
            // Bu hesap kendi direct haritasını tanımlar, bu nedenle kök direct girdileri
            // tamamen değiştirilir. Jokeri korumak için burada da "*" değerini açıkça tanımlayın.
            "+15551234567": { systemPrompt: "Belirli bir iş doğrudan sohbeti için istem." },
            "*": { systemPrompt: "İş doğrudan sohbetleri için varsayılan istem." },
          },
        },
      },
    },
  },
}
```

## Yapılandırma başvuru işaretçileri

Birincil başvuru:

- [Configuration reference - WhatsApp](/tr/gateway/configuration-reference#whatsapp)

Yüksek önem taşıyan WhatsApp alanları:

- erişim: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- teslimat: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- çoklu hesap: `accounts.<id>.enabled`, `accounts.<id>.authDir`, hesap düzeyi geçersiz kılmalar
- işlemler: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- oturum davranışı: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- istemler: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## İlgili

- [Pairing](/tr/channels/pairing)
- [Groups](/tr/channels/groups)
- [Security](/tr/gateway/security)
- [Channel routing](/tr/channels/channel-routing)
- [Multi-agent routing](/tr/concepts/multi-agent)
- [Troubleshooting](/tr/channels/troubleshooting)
