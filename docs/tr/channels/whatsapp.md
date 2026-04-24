---
read_when:
    - WhatsApp/web kanal davranışı veya gelen kutusu yönlendirmesi üzerinde çalışma
summary: WhatsApp kanal desteği, erişim denetimleri, teslimat davranışı ve operasyonlar
title: WhatsApp
x-i18n:
    generated_at: "2026-04-24T09:00:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51305dbf83109edb64d07bcafd5fe738ff97e3d2c779adfaef2e8406d1d93caf
    source_path: channels/whatsapp.md
    workflow: 15
---

Durum: WhatsApp Web (Baileys) üzerinden üretime hazır. Gateway, bağlı oturumları yönetir.

## Kurulum (gerektiğinde)

- İlk kez seçtiğinizde, onboarding (`openclaw onboard`) ve `openclaw channels add --channel whatsapp`
  WhatsApp Plugin'ini kurmanızı ister.
- `openclaw channels login --channel whatsapp` da
  Plugin henüz mevcut değilse kurulum akışını sunar.
- Geliştirme kanalı + git checkout: varsayılan olarak yerel Plugin yolunu kullanır.
- Stable/Beta: varsayılan olarak `@openclaw/whatsapp` npm paketini kullanır.

Elle kurulum seçeneği kullanılabilir olmaya devam eder:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bilinmeyen gönderenler için varsayılan DM politikası eşleştirmedir.
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

    Belirli bir hesap için:

```bash
openclaw channels login --channel whatsapp --account work
```

    Giriş yapmadan önce mevcut/özel bir WhatsApp Web kimlik doğrulama dizinini bağlamak için:

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

  <Step title="İlk eşleştirme isteğini onaylayın (eşleştirme modu kullanıyorsanız)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Eşleştirme isteklerinin süresi 1 saat sonra dolar. Bekleyen istekler kanal başına 3 ile sınırlıdır.

  </Step>
</Steps>

<Note>
OpenClaw, mümkün olduğunda WhatsApp'ı ayrı bir numarayla çalıştırmanızı önerir. (Kanal meta verileri ve kurulum akışı bu kurulum için optimize edilmiştir, ancak kişisel numara kurulumları da desteklenir.)
</Note>

## Dağıtım kalıpları

<AccordionGroup>
  <Accordion title="Özel numara (önerilen)">
    Bu, operasyonel olarak en temiz moddur:

    - OpenClaw için ayrı WhatsApp kimliği
    - daha net DM izin listeleri ve yönlendirme sınırları
    - kendinizle sohbet karmaşası olasılığı daha düşük

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
    Onboarding, kişisel numara modunu destekler ve kendinizle sohbet için uygun bir temel yazar:

    - `dmPolicy: "allowlist"`
    - `allowFrom` sizin kişisel numaranızı içerir
    - `selfChatMode: true`

    Çalışma zamanında, kendinizle sohbet korumaları bağlı olan kendi numaranıza ve `allowFrom` değerine göre anahtarlanır.

  </Accordion>

  <Accordion title="Yalnızca WhatsApp Web kanal kapsamı">
    Mevcut OpenClaw kanal mimarisinde mesajlaşma platformu kanalı WhatsApp Web tabanlıdır (`Baileys`).

    Yerleşik sohbet kanalı kayıt defterinde ayrı bir Twilio WhatsApp mesajlaşma kanalı yoktur.

  </Accordion>
</AccordionGroup>

## Çalışma zamanı modeli

- Gateway, WhatsApp soketini ve yeniden bağlanma döngüsünü yönetir.
- Giden gönderimler, hedef hesap için etkin bir WhatsApp dinleyicisi gerektirir.
- Durum ve yayın sohbetleri yok sayılır (`@status`, `@broadcast`).
- Doğrudan sohbetler DM oturum kurallarını kullanır (`session.dmScope`; varsayılan `main`, DM'leri ajanın ana oturumunda birleştirir).
- Grup oturumları yalıtılmıştır (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Web taşıması, Gateway ana makinesindeki standart proxy ortam değişkenlerine uyar (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / küçük harfli varyantlar). Kanala özel WhatsApp proxy ayarları yerine ana makine düzeyi proxy yapılandırmasını tercih edin.

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM politikası">
    `channels.whatsapp.dmPolicy`, doğrudan sohbet erişimini kontrol eder:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    `allowFrom`, E.164 tarzı numaraları kabul eder (içeride normalize edilir).

    Çok hesaplı geçersiz kılma: `channels.whatsapp.accounts.<id>.dmPolicy` (ve `allowFrom`), o hesap için kanal düzeyi varsayılanlardan önceliklidir.

    Çalışma zamanı davranış ayrıntıları:

    - eşleştirmeler kanal izin deposunda kalıcı olur ve yapılandırılmış `allowFrom` ile birleştirilir
    - yapılandırılmış izin listesi yoksa, bağlı kendi numaranıza varsayılan olarak izin verilir
    - OpenClaw hiçbir zaman giden `fromMe` DM'lerini otomatik olarak eşleştirmez (bağlı cihazdan kendinize gönderdiğiniz mesajlar)

  </Tab>

  <Tab title="Grup politikası + izin listeleri">
    Grup erişiminde iki katman vardır:

    1. **Grup üyeliği izin listesi** (`channels.whatsapp.groups`)
       - `groups` atlanırsa, tüm gruplar uygundur
       - `groups` mevcutsa, bir grup izin listesi görevi görür (`"*"` kabul edilir)

    2. **Grup gönderen politikası** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: gönderen izin listesi atlanır
       - `allowlist`: gönderen `groupAllowFrom` ile (veya `*` ile) eşleşmelidir
       - `disabled`: tüm grup gelenlerini engelle

    Gönderen izin listesi yedeği:

    - `groupAllowFrom` ayarlanmamışsa, çalışma zamanı mevcut olduğunda `allowFrom` değerine geri döner
    - gönderen izin listeleri, bahsetme/yanıt etkinleştirmesinden önce değerlendirilir

    Not: Hiç `channels.whatsapp` bloğu yoksa, çalışma zamanındaki grup politikası yedeği `allowlist` olur (uyarı günlüğüyle), `channels.defaults.groupPolicy` ayarlanmış olsa bile.

  </Tab>

  <Tab title="Bahsetmeler + /activation">
    Grup yanıtları varsayılan olarak bahsetme gerektirir.

    Bahsetme algılama şunları içerir:

    - bot kimliğinin açık WhatsApp bahsetmeleri
    - yapılandırılmış bahsetme regex kalıpları (`agents.list[].groupChat.mentionPatterns`, yedek olarak `messages.groupChat.mentionPatterns`)
    - örtük bottan-yanıt algılama (yanıt göndereni bot kimliğiyle eşleşir)

    Güvenlik notu:

    - alıntı/yanıt yalnızca bahsetme geçidini karşılar; gönderen yetkilendirmesi vermez
    - `groupPolicy: "allowlist"` ile, izin listesinde olmayan gönderenler, izinli bir kullanıcının mesajına yanıt verseler bile yine engellenir

    Oturum düzeyi etkinleştirme komutu:

    - `/activation mention`
    - `/activation always`

    `activation`, oturum durumunu günceller (genel yapılandırmayı değil). Sahip geçidiyle korunur.

  </Tab>
</Tabs>

## Kişisel numara ve kendinizle sohbet davranışı

Bağlı kendi numaranız `allowFrom` içinde de mevcutsa, WhatsApp kendinizle sohbet korumaları etkinleşir:

- kendinizle sohbet dönüşlerinde okundu bilgilerini atla
- aksi halde kendinizi pingleyecek olan mention-JID otomatik tetikleme davranışını yok say
- `messages.responsePrefix` ayarlanmamışsa, kendinizle sohbet yanıtları varsayılan olarak `[{identity.name}]` veya `[openclaw]` kullanır

## Mesaj normalleştirme ve bağlam

<AccordionGroup>
  <Accordion title="Gelen zarfı + yanıt bağlamı">
    Gelen WhatsApp mesajları, paylaşılan gelen zarfı içinde sarılır.

    Alıntılanmış bir yanıt varsa, bağlam şu biçimde eklenir:

    ```text
    [<sender> kullanıcısına yanıt veriliyor id:<stanzaId>]
    <alıntılanmış gövde veya medya yer tutucusu>
    [/Yanıt veriliyor]
    ```

    Yanıt meta veri alanları da mevcut olduğunda doldurulur (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, gönderen JID/E.164).

  </Accordion>

  <Accordion title="Medya yer tutucuları ve konum/kişi çıkarımı">
    Yalnızca medyadan oluşan gelen mesajlar, şu gibi yer tutucularla normalize edilir:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Konum gövdeleri kısa koordinat metni kullanır. Konum etiketleri/yorumları ve kişi/vCard ayrıntıları, satır içi istem metni olarak değil, çitle çevrili güvenilmeyen meta veriler olarak işlenir.

  </Accordion>

  <Accordion title="Bekleyen grup geçmişi enjeksiyonu">
    Gruplar için, işlenmemiş mesajlar arabelleğe alınabilir ve bot nihayet tetiklendiğinde bağlam olarak enjekte edilebilir.

    - varsayılan sınır: `50`
    - yapılandırma: `channels.whatsapp.historyLimit`
    - yedek: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    Enjeksiyon işaretleri:

    - `[Son yanıtınızdan beri gelen sohbet mesajları - bağlam için]`
    - `[Geçerli mesaj - buna yanıt verin]`

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

    Kendinizle sohbet dönüşleri, genel olarak etkin olsa bile okundu bilgilerini atlar.

  </Accordion>
</AccordionGroup>

## Teslimat, parçalama ve medya

<AccordionGroup>
  <Accordion title="Metin parçalama">
    - varsayılan parça sınırı: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` modu paragraf sınırlarını (boş satırlar) tercih eder, sonra uzunluk açısından güvenli parçalara geri döner
  </Accordion>

  <Accordion title="Giden medya davranışı">
    - resim, video, ses (PTT sesli not) ve belge yüklerini destekler
    - `audio/ogg`, sesli not uyumluluğu için `audio/ogg; codecs=opus` olarak yeniden yazılır
    - hareketli GIF oynatma, video gönderimlerinde `gifPlayback: true` ile desteklenir
    - çoklu medya yanıt yükleri gönderilirken açıklamalar ilk medya öğesine uygulanır
    - medya kaynağı HTTP(S), `file://` veya yerel yollar olabilir
  </Accordion>

  <Accordion title="Medya boyutu sınırları ve yedek davranış">
    - gelen medya kaydetme sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - giden medya gönderme sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - hesap başına geçersiz kılmalar `channels.whatsapp.accounts.<accountId>.mediaMaxMb` kullanır
    - resimler, sınırlara sığması için otomatik olarak optimize edilir (yeniden boyutlandırma/kalite taraması)
    - medya gönderimi başarısız olursa, ilk öğe yedeği yanıtı sessizce düşürmek yerine metin uyarısı gönderir
  </Accordion>
</AccordionGroup>

## Yanıt alıntılama

WhatsApp, giden yanıtların gelen mesajı görünür şekilde alıntıladığı yerel yanıt alıntılamayı destekler. Bunu `channels.whatsapp.replyToMode` ile kontrol edin.

| Değer    | Davranış                                                                           |
| -------- | ---------------------------------------------------------------------------------- |
| `"auto"` | Sağlayıcı destekliyorsa gelen mesajı alıntılar; aksi halde alıntılamayı atlar      |
| `"on"`   | Gelen mesajı her zaman alıntılar; alıntılama reddedilirse düz gönderime geri döner |
| `"off"`  | Asla alıntılamaz; düz mesaj olarak gönderir                                        |

Varsayılan değer `"auto"`dur. Hesap başına geçersiz kılmalar `channels.whatsapp.accounts.<id>.replyToMode` kullanır.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## Tepki düzeyi

`channels.whatsapp.reactionLevel`, ajanın WhatsApp'ta emoji tepkilerini ne kadar geniş kullandığını kontrol eder:

| Düzey        | Onay tepkileri | Ajan tarafından başlatılan tepkiler | Açıklama                                         |
| ------------ | -------------- | ----------------------------------- | ------------------------------------------------ |
| `"off"`      | Hayır          | Hayır                               | Hiç tepki yok                                    |
| `"ack"`      | Evet           | Hayır                               | Yalnızca onay tepkileri (yanıt öncesi alındı)    |
| `"minimal"`  | Evet           | Evet (temkinli)                     | Onay + temkinli yönlendirmeyle ajan tepkileri    |
| `"extensive"`| Evet           | Evet (teşvikli)                     | Onay + teşvikli yönlendirmeyle ajan tepkileri    |

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

WhatsApp, `channels.whatsapp.ackReaction` aracılığıyla gelen iletinin alınması anında anlık onay tepkilerini destekler.
Onay tepkileri `reactionLevel` tarafından denetlenir — `reactionLevel` değeri `"off"` olduğunda bastırılırlar.

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
- grup modu `mentions`, bahsetmeyle tetiklenen dönüşlerde tepki verir; grup etkinleştirmesi `always` ise bu denetimi atlama işlevi görür
- WhatsApp `channels.whatsapp.ackReaction` kullanır (eski `messages.ackReaction` burada kullanılmaz)

## Çok hesap ve kimlik bilgileri

<AccordionGroup>
  <Accordion title="Hesap seçimi ve varsayılanlar">
    - hesap kimlikleri `channels.whatsapp.accounts` içinden gelir
    - varsayılan hesap seçimi: varsa `default`, yoksa yapılandırılmış ilk hesap kimliği (sıralanmış)
    - hesap kimlikleri arama için içeride normalize edilir
  </Accordion>

  <Accordion title="Kimlik bilgisi yolları ve eski uyumluluk">
    - geçerli kimlik doğrulama yolu: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - yedek dosya: `creds.json.bak`
    - `~/.openclaw/credentials/` içindeki eski varsayılan kimlik doğrulama, varsayılan hesap akışları için hâlâ tanınır/geçirilir
  </Accordion>

  <Accordion title="Çıkış yapma davranışı">
    `openclaw channels logout --channel whatsapp [--account <id>]`, o hesap için WhatsApp kimlik doğrulama durumunu temizler.

    Eski kimlik doğrulama dizinlerinde `oauth.json` korunur, Baileys kimlik doğrulama dosyaları ise kaldırılır.

  </Accordion>
</AccordionGroup>

## Araçlar, eylemler ve yapılandırma yazımları

- Ajan araç desteği, WhatsApp tepki eylemini (`react`) içerir.
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
    Belirti: bağlı hesapta tekrar eden bağlantı kesilmeleri veya yeniden bağlanma denemeleri.

    Düzeltme:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Gerekirse `channels login` ile yeniden bağlayın.

  </Accordion>

  <Accordion title="Gönderimde etkin dinleyici yok">
    Hedef hesap için etkin bir Gateway dinleyicisi yoksa giden gönderimler hızlıca başarısız olur.

    Gateway'in çalıştığından ve hesabın bağlı olduğundan emin olun.

  </Accordion>

  <Accordion title="Grup mesajları beklenmedik şekilde yok sayılıyor">
    Şu sırayla kontrol edin:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` izin listesi girdileri
    - bahsetme geçidi (`requireMention` + bahsetme kalıpları)
    - `openclaw.json` içindeki yinelenen anahtarlar (JSON5): sonraki girdiler öncekileri geçersiz kılar, bu nedenle kapsam başına tek bir `groupPolicy` kullanın

  </Accordion>

  <Accordion title="Bun çalışma zamanı uyarısı">
    WhatsApp Gateway çalışma zamanı Node kullanmalıdır. Bun, kararlı WhatsApp/Telegram Gateway çalışması için uyumsuz olarak işaretlenir.
  </Accordion>
</AccordionGroup>

## Sistem istemleri

WhatsApp, `groups` ve `direct` eşlemeleri aracılığıyla gruplar ve doğrudan sohbetler için Telegram tarzı sistem istemlerini destekler.

Grup mesajları için çözümleme hiyerarşisi:

Önce etkin `groups` eşlemesi belirlenir: hesap kendi `groups` eşlemesini tanımlıyorsa, kökteki `groups` eşlemesini tamamen değiştirir (derin birleştirme yoktur). İstem araması daha sonra ortaya çıkan bu tek eşleme üzerinde çalışır:

1. **Gruba özgü sistem istemi** (`groups["<groupId>"].systemPrompt`): belirli grup girdisi bir `systemPrompt` tanımlıyorsa kullanılır.
2. **Grup joker sistem istemi** (`groups["*"].systemPrompt`): belirli grup girdisi yoksa veya `systemPrompt` tanımlamıyorsa kullanılır.

Doğrudan mesajlar için çözümleme hiyerarşisi:

Önce etkin `direct` eşlemesi belirlenir: hesap kendi `direct` eşlemesini tanımlıyorsa, kökteki `direct` eşlemesini tamamen değiştirir (derin birleştirme yoktur). İstem araması daha sonra ortaya çıkan bu tek eşleme üzerinde çalışır:

1. **Doğrudan sohbete özgü sistem istemi** (`direct["<peerId>"].systemPrompt`): belirli eş düzeyi girdisi bir `systemPrompt` tanımlıyorsa kullanılır.
2. **Doğrudan joker sistem istemi** (`direct["*"].systemPrompt`): belirli eş düzeyi girdisi yoksa veya `systemPrompt` tanımlamıyorsa kullanılır.

Not: `dms`, hafif DM başına geçmiş geçersiz kılma kovası olmaya devam eder (`dms.<id>.historyLimit`); istem geçersiz kılmaları `direct` altında bulunur.

**Telegram çok hesap davranışından farkı:** Telegram'da, çok hesaplı bir kurulumda, kendi `groups` eşlemesini tanımlamayan hesaplarda bile kök `groups` kasıtlı olarak tüm hesaplar için bastırılır; bunun amacı bir botun üyesi olmadığı gruplardan grup mesajları almasını önlemektir. WhatsApp bu korumayı uygulamaz: kök `groups` ve kök `direct`, kaç hesap yapılandırılmış olduğuna bakılmaksızın, hesap düzeyinde geçersiz kılma tanımlamayan hesaplar tarafından her zaman devralınır. Çok hesaplı bir WhatsApp kurulumunda, hesap başına grup veya doğrudan istemler istiyorsanız, kök düzeyi varsayılanlara güvenmek yerine tam eşlemeyi her hesabın altında açıkça tanımlayın.

Önemli davranış:

- `channels.whatsapp.groups`, hem grup başına yapılandırma eşlemesi hem de sohbet düzeyi grup izin listesidir. Kök veya hesap kapsamında `groups["*"]`, o kapsam için "tüm gruplar kabul edilir" anlamına gelir.
- Joker grup `systemPrompt` yalnızca o kapsamın zaten tüm grupları kabul etmesini istiyorsanız eklenmelidir. Yalnızca sabit bir grup kimliği kümesinin uygun olmasını istiyorsanız, istem varsayılanı için `groups["*"]` kullanmayın. Bunun yerine istemi açıkça izin verilen her grup girdisinde tekrarlayın.
- Grup kabulü ve gönderen yetkilendirmesi ayrı denetimlerdir. `groups["*"]`, grup işlemeye ulaşabilecek grup kümesini genişletir, ancak bu gruplardaki her gönderene kendiliğinden yetki vermez. Gönderen erişimi yine `channels.whatsapp.groupPolicy` ve `channels.whatsapp.groupAllowFrom` ile ayrı olarak kontrol edilir.
- `channels.whatsapp.direct`, DM'ler için aynı yan etkiye sahip değildir. `direct["*"]`, yalnızca bir DM zaten `dmPolicy` artı `allowFrom` veya eşleştirme deposu kuralları tarafından kabul edildikten sonra varsayılan doğrudan sohbet yapılandırmasını sağlar.

Örnek:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Yalnızca kök kapsamda tüm gruplar kabul edilecekse kullanın.
        // Kendi groups eşlemesini tanımlamayan tüm hesaplara uygulanır.
        "*": { systemPrompt: "Tüm gruplar için varsayılan istem." },
      },
      direct: {
        // Kendi direct eşlemesini tanımlamayan tüm hesaplara uygulanır.
        "*": { systemPrompt: "Tüm doğrudan sohbetler için varsayılan istem." },
      },
      accounts: {
        work: {
          groups: {
            // Bu hesap kendi groups eşlemesini tanımlar, bu yüzden kök groups tamamen
            // değiştirilir. Jokeri korumak için burada da "*" açıkça tanımlayın.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Proje yönetimine odaklan.",
            },
            // Yalnızca bu hesapta tüm gruplar kabul edilecekse kullanın.
            "*": { systemPrompt: "İş grupları için varsayılan istem." },
          },
          direct: {
            // Bu hesap kendi direct eşlemesini tanımlar, bu yüzden kök direct girdileri
            // tamamen değiştirilir. Jokeri korumak için burada da "*" açıkça tanımlayın.
            "+15551234567": { systemPrompt: "Belirli bir iş amaçlı doğrudan sohbet için istem." },
            "*": { systemPrompt: "İş amaçlı doğrudan sohbetler için varsayılan istem." },
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

Yüksek öncelikli WhatsApp alanları:

- erişim: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- teslimat: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- çok hesap: `accounts.<id>.enabled`, `accounts.<id>.authDir`, hesap düzeyi geçersiz kılmalar
- işlemler: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- oturum davranışı: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- istemler: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Güvenlik](/tr/gateway/security)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Çok ajanlı yönlendirme](/tr/concepts/multi-agent)
- [Sorun giderme](/tr/channels/troubleshooting)
