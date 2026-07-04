---
read_when:
    - WhatsApp/web kanal davranışı veya gelen kutusu yönlendirmesi üzerinde çalışma
summary: WhatsApp kanal desteği, erişim kontrolleri, teslim davranışı ve operasyonlar
title: WhatsApp
x-i18n:
    generated_at: "2026-07-04T10:57:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a968c08c461708fb4b8cabe4528af2514b0a5768d272abab8f88e36e24bde302
    source_path: channels/whatsapp.md
    workflow: 16
---

Durum: WhatsApp Web (Baileys) üzerinden üretime hazır. Gateway bağlı oturumların sahibidir.

## Kurulum (isteğe bağlı)

- Onboarding (`openclaw onboard`) ve `openclaw channels add --channel whatsapp`,
  WhatsApp Plugin'ini ilk seçtiğinizde kurmanız için istem gösterir.
- `openclaw channels login --channel whatsapp`, Plugin henüz mevcut değilse
  kurulum akışını da sunar.
- Geliştirme kanalı + git checkout: varsayılan olarak yerel Plugin yolunu kullanır.
- Stable/Beta: önce ClawHub'dan resmi `@openclaw/whatsapp` Plugin'ini kurar,
  yedek olarak npm kullanılır.
- WhatsApp çalışma zamanı, WhatsApp'a özgü çalışma zamanı bağımlılıkları harici Plugin'de
  kalsın diye çekirdek OpenClaw npm paketinin dışında dağıtılır.

Elle kurulum kullanılmaya devam eder:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Çıplak npm paketini (`@openclaw/whatsapp`) yalnızca kayıt defteri
yedeklemesine ihtiyaç duyduğunuzda kullanın. Tam bir sürümü yalnızca tekrarlanabilir bir kurulum
gerektiğinde sabitleyin.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bilinmeyen gönderenler için varsayılan DM politikası eşleştirmedir.
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
    başlatmadan önce canlı QR kodunu onu tarayacak telefona iletmek için
    güvenilir bir yolunuz olduğundan emin olun.

    Belirli bir hesap için:

```bash
openclaw channels login --channel whatsapp --account work
```

    Oturum açmadan önce mevcut/özel bir WhatsApp Web kimlik doğrulama dizinini eklemek için:

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
Geçerli WhatsApp kurulum akışı yalnızca QR kullanır. Terminalde işlenen QR'ların, ekran görüntülerinin,
PDF'lerin veya sohbet eklerinin süresi dolabilir ya da uzak bir makineden aktarılırken
okunamaz hale gelebilir. Uzak/başsız ana makineler için elle terminal yakalama yerine doğrudan QR görüntüsü
teslim yolunu tercih edin.
</Warning>

## Geçerli istekte bulunan kişiyi MeowCaller ile arayın (deneysel)

WhatsApp Plugin'i, WhatsApp kaynaklı agent dönüşlerinde `whatsapp_call` aracını açığa çıkarabilir. Araç,
geçerli yetkili istekte bulunan kişiye WhatsApp sesli araması yapmak için [MeowCaller](https://github.com/purpshell/meowcaller) kullanır
ve yanıt verdikten sonra bir OpenClaw TTS mesajı oynatır. Araç
hedef numara kabul etmez, bu nedenle bir istem aramayı üçüncü bir tarafa yönlendiremez.
Bu deneysel yetenek varsayılan olarak devre dışıdır.

<Warning>
MeowCaller deneyseldir, etiketlenmiş bir sürümü yoktur ve ayrı olarak eşleştirilmiş bir whatsmeow
bağlı cihaz oturumu kullanır. WhatsApp Plugin'inin Baileys kimlik bilgilerini yeniden kullanamaz. Eşleştirme,
aynı WhatsApp hesabına başka bir bağlı cihaz ekler. OpenClaw tarafından kullanılan WhatsApp kimliğiyle tarayın.
Kişisel numara/kendiyle sohbet modu kendini arayamaz; kişisel numaranızı aramak için ayrılmış bir OpenClaw numarası
kullanın.
</Warning>

<Steps>
  <Step title="Deneysel aramaları etkinleştirin">

    `openclaw.json` içindeki WhatsApp kanalına `actions.calls: true` ekleyin:

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    Bunu mevcut WhatsApp yapılandırmanızla birleştirin, ardından Gateway'i yeniden başlatın. Ayar
    yoksa veya `false` ise, OpenClaw `whatsapp_call` aracını agent'a açığa çıkarmaz.

  </Step>

  <Step title="İncelenmiş MeowCaller CLI'yi kurun">

    Bağdaştırıcı, Gateway ana makinesinin `PATH` değerinde `meowcaller` adlı bir yürütülebilir dosya bekler.
    [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) birleşene kadar,
    `752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f` commit'indeki incelenmiş dalı derleyin:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    `$HOME/.local/bin` öğesinin Gateway hizmetinin `PATH` değerinde de olduğundan emin olun. Bu revizyon,
    açık `pair` ve yalnızca gönderimli `notify` komutları sağlar. `notify` mikrofon, hoparlör,
    video cihazı, gelen ses alıcısı veya tanılama yakalaması açmaz. Örnek
    CLI'nin `play` komutunu onun yerine kullanmayın.

  </Step>

  <Step title="MeowCaller bağlı cihazını eşleştirin">

    WhatsApp agent'ından arama kurulumunu kontrol etmesini isteyin. `whatsapp_call` durum eylemi,
    hesaba özgü durum dizinini ve eşleştirme komutunu bildirir. Varsayılan hesap için:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Komutu etkileşimli bir terminalde çalıştırın. QR'ını **WhatsApp > Bağlı cihazlar** üzerinden tarayın
    ve `MeowCaller linked device ready` bekleyin. Komut ardından çıkar. `wa-voip.db` dosyasını
    gizli tutun; bu MeowCaller bağlı cihaz oturumudur. Varsayılan olmayan bir hesap kullandığınızda
    `whatsapp_call` durum eylemi hesaba özgü komutu ve kabuğu döndürür. Windows'ta
    PowerShell komutunu çalıştırın; MeowCaller depo dizinini oluşturur.

  </Step>

  <Step title="TTS'yi yapılandırın ve WhatsApp'tan arayın">

    Telefonla aramaya uygun bir [TTS sağlayıcısı](/tr/tools/tts) yapılandırın, Gateway'i yeniden başlatın, ardından
    `Call me and say the build finished.` gibi bir WhatsApp isteği gönderin. Araç, göndereni
    güvenilir gelen bağlamdan çözer, geçici özel bir WAV dosyası sentezler, MeowCaller'ı
    sınırlı bir arama penceresi boyunca çalıştırır ve ardından ses dosyasını siler. OpenClaw, hesabın
    deposunu açıkça geçirir; yanıt, oynatma ve kapatma sonrasında sıfır çıkış durumu bekler ve
    zaman aşımını veya sıfır olmayan çıkışı başarısız araç çağrısı olarak değerlendirir.

  </Step>
</Steps>

Geçerli sınırlar:

- yalnızca bire bir giden sesli aramalar
- rastgele hedef numara yok
- sohbet bağlantısıyla paylaşılan kimlik doğrulama yok
- kişisel numara/kendiyle sohbet modundan kendi kendine arama yok
- sentezlenen ses 60 saniyeyle sınırlıdır
- MeowCaller'ın yanıt/oynatma/kapatma tamamlanması dışında telefon tarafı duyulabilirlik alındısı yok
- OpenClaw, MeowCaller'ın bağlantı, yanıt, oynatma ve kapatma aşamaları dahil olmak üzere
  sınırlı 115-175 saniyelik bir pencereden sonra yardımcı süreci durdurur

## Dağıtım kalıpları

<AccordionGroup>
  <Accordion title="Ayrılmış numara (önerilir)">
    Bu en temiz operasyonel moddur:

    - OpenClaw için ayrı WhatsApp kimliği
    - daha net DM izin listeleri ve yönlendirme sınırları
    - kendiyle sohbet karışıklığı olasılığı daha düşük

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
    Onboarding, kişisel numara modunu destekler ve kendiyle sohbet dostu bir temel yazar:

    - `dmPolicy: "allowlist"`
    - `allowFrom` kişisel numaranızı içerir
    - `selfChatMode: true`

    Çalışma zamanında, kendiyle sohbet korumaları bağlı kendi numarasına ve `allowFrom` değerine göre çalışır.

  </Accordion>

  <Accordion title="Yalnızca WhatsApp Web kanal kapsamı">
    Mesajlaşma platformu kanalı, geçerli OpenClaw kanal mimarisinde WhatsApp Web tabanlıdır (`Baileys`).

    Yerleşik sohbet kanalı kayıt defterinde ayrı bir Twilio WhatsApp mesajlaşma kanalı yoktur.

  </Accordion>
</AccordionGroup>

## Çalışma zamanı modeli

- Gateway, WhatsApp soketinin ve yeniden bağlanma döngüsünün sahibidir.
- Yeniden bağlanma watchdog'u yalnızca gelen uygulama mesajı hacmini değil, WhatsApp Web aktarım etkinliğini kullanır; böylece sessiz bir bağlı cihaz oturumu, yalnızca yakın zamanda kimse mesaj göndermedi diye yeniden başlatılmaz. Daha uzun bir uygulama sessizliği sınırı, aktarım çerçeveleri gelmeye devam ederken watchdog penceresi boyunca hiçbir uygulama mesajı işlenmezse yine de yeniden bağlanmayı zorlar; yakın zamanda etkin olmuş bir oturum için geçici yeniden bağlanmadan sonra, bu uygulama sessizliği kontrolü ilk kurtarma penceresi için normal mesaj zaman aşımını kullanır.
- Baileys soket zamanlamaları `web.whatsapp.*` altında açıktır: `keepAliveIntervalMs` WhatsApp Web uygulama ping'lerini kontrol eder, `connectTimeoutMs` açılış el sıkışması zaman aşımını kontrol eder ve `defaultQueryTimeoutMs`, Baileys sorgu beklemelerini ve OpenClaw'ın yerel giden gönderim/varlık ile gelen okundu bilgisi işlem sınırlarını kontrol eder.
- Giden gönderimler, hedef hesap için etkin bir WhatsApp dinleyicisi gerektirir.
- Grup gönderimleri, token geçerli WhatsApp katılımcı meta verileriyle eşleştiğinde, LID destekli gruplar dahil olmak üzere metin ve medya açıklamalarındaki `@+<digits>` ve `@<digits>` token'ları için yerel bahsetme meta verileri ekler.
- Durum ve yayın sohbetleri yok sayılır (`@status`, `@broadcast`).
- Yeniden bağlanma watchdog'u yalnızca gelen uygulama mesajı hacmini değil, WhatsApp Web aktarım etkinliğini izler: aktarım çerçeveleri devam ederken sessiz bağlı cihaz oturumları açık kalır, ancak aktarım durması daha sonraki uzak bağlantı kesme yolundan çok önce yeniden bağlanmayı zorlar.
- Doğrudan sohbetler DM oturum kurallarını kullanır (`session.dmScope`; varsayılan `main`, DM'leri agent ana oturumuna daraltır).
- Grup oturumları yalıtılmıştır (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Kanalları/Bültenleri, yerel `@newsletter` JID'leriyle açık giden hedefler olabilir. Giden bülten gönderimleri, DM oturum semantiği yerine kanal oturumu meta verilerini (`agent:<agentId>:whatsapp:channel:<jid>`) kullanır.
- WhatsApp Web aktarımı, Gateway ana makinesindeki standart proxy ortam değişkenlerine uyar (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / küçük harfli varyantlar). Kanala özgü WhatsApp proxy ayarları yerine ana makine düzeyinde proxy yapılandırmasını tercih edin.
- `messages.removeAckAfterReply` etkinleştirildiğinde, OpenClaw görünür bir yanıt teslim edildikten sonra WhatsApp ack tepkisini temizler.

## Onay istemleri

WhatsApp, exec ve Plugin onay istemlerini `👍` / `👎` tepkileriyle işleyebilir. Teslimat,
üst düzey onay iletme yapılandırması tarafından kontrol edilir:

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
aktarımı bağlar; eşleşen onay ailesi etkinleştirilip WhatsApp'a yönlendirilmedikçe onay istemleri
göndermez. Oturum modu, yerel emoji onaylarını yalnızca WhatsApp'tan kaynaklanan onaylar için
teslim eder. Hedef modu, açık WhatsApp hedefleri için paylaşılan iletme işlem hattını kullanır
ve ayrı onaylayıcı-DM yayılımı oluşturmaz.

WhatsApp onay tepkileri, `allowFrom` veya `"*"` üzerinden açık WhatsApp onaylayıcıları gerektirir.
`defaultTo`, olağan varsayılan mesaj hedeflerini kontrol eder; bir onay onaylayıcısı değildir. Elle
`/approve` komutları, onay çözümlemesinden önce yine normal WhatsApp gönderen yetkilendirme yolundan
geçer.

## Plugin kancaları ve gizlilik

WhatsApp gelen iletileri kişisel ileti içeriği, telefon numaraları,
grup tanımlayıcıları, gönderen adları ve oturum ilişkilendirme alanları içerebilir. Bu nedenle,
WhatsApp, siz açıkça etkinleştirmediğiniz sürece gelen `message_received` hook yüklerini Plugin'lere
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

Bunu yalnızca gelen WhatsApp ileti içeriğini ve tanımlayıcılarını almasına
güvendiğiniz Plugin'ler için etkinleştirin.

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.whatsapp.dmPolicy` doğrudan sohbet erişimini denetler:

    - `pairing` (varsayılan)
    - `allowlist`
    - `open` (`allowFrom` değerinin `"*"` içermesini gerektirir)
    - `disabled`

    `allowFrom`, E.164 tarzı numaraları kabul eder (dahili olarak normalleştirilir).

    `allowFrom`, DM gönderen erişim denetimi listesidir. WhatsApp grup JID'lerine veya `@newsletter` kanal JID'lerine açık giden gönderimleri engellemez.

    Çok hesaplı geçersiz kılma: `channels.whatsapp.accounts.<id>.dmPolicy` (ve `allowFrom`), bu hesap için kanal düzeyi varsayılanlara göre önceliklidir.

    Çalışma zamanı davranışı ayrıntıları:

    - eşleştirmeler kanal izin deposunda kalıcı hale getirilir ve yapılandırılmış `allowFrom` ile birleştirilir
    - zamanlanmış otomasyon ve Heartbeat alıcı yedeği, açık teslim hedeflerini veya yapılandırılmış `allowFrom` değerini kullanır; DM eşleştirme onayları örtük Cron veya Heartbeat alıcıları değildir
    - hiçbir izin listesi yapılandırılmamışsa, bağlı kendi numarası varsayılan olarak izinlidir
    - OpenClaw, giden `fromMe` DM'lerini (bağlı cihazdan kendinize gönderdiğiniz iletiler) asla otomatik eşleştirmez

  </Tab>

  <Tab title="Grup ilkesi + izin listeleri">
    Grup erişiminin iki katmanı vardır:

    1. **Grup üyeliği izin listesi** (`channels.whatsapp.groups`)
       - `groups` atlanırsa tüm gruplar uygundur
       - `groups` varsa, grup izin listesi olarak davranır (`"*"` izinlidir)

    2. **Grup gönderen ilkesi** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: gönderen izin listesi atlanır
       - `allowlist`: gönderen `groupAllowFrom` (veya `*`) ile eşleşmelidir
       - `disabled`: tüm gelen grup iletilerini engeller

    Gönderen izin listesi yedeği:

    - `groupAllowFrom` ayarlanmamışsa, çalışma zamanı kullanılabilir olduğunda `allowFrom` değerine geri döner
    - gönderen izin listeleri, bahsetme/yanıt etkinleştirmesinden önce değerlendirilir

    Not: Hiç `channels.whatsapp` bloğu yoksa, `channels.defaults.groupPolicy` ayarlanmış olsa bile çalışma zamanı grup ilkesi yedeği `allowlist` olur (uyarı günlüğüyle).

  </Tab>

  <Tab title="Bahsetmeler + /activation">
    Grup yanıtları varsayılan olarak bahsetme gerektirir.

    Bahsetme algılama şunları içerir:

    - bot kimliğine yönelik açık WhatsApp bahsetmeleri
    - yapılandırılmış bahsetme regex kalıpları (`agents.list[].groupChat.mentionPatterns`, yedek `messages.groupChat.mentionPatterns`)
    - yetkili grup iletileri için gelen sesli not dökümleri
    - örtük bota-yanıt algılama (yanıt göndereni bot kimliğiyle eşleşir)

    Güvenlik notu:

    - alıntı/yanıt yalnızca bahsetme denetimini karşılar; gönderen yetkilendirmesi **vermez**
    - `groupPolicy: "allowlist"` ile, izin listesinde olmayan gönderenler izin listesindeki bir kullanıcının iletisine yanıt verse bile yine de engellenir

    Oturum düzeyi etkinleştirme komutu:

    - `/activation mention`
    - `/activation always`

    `activation`, oturum durumunu günceller (genel yapılandırmayı değil). Sahip denetimlidir.

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
- Grup izin listeleri, gönderen ilkesi ve bahsetme veya etkinleştirme denetimi, OpenClaw yapılandırılmış ACP oturumunun var olduğundan emin olmadan önce çalışır.
- Eşleşen yapılandırılmış ACP bağlaması rotanın sahibidir. WhatsApp yayın grupları bu turu sıradan WhatsApp oturumlarına dağıtmaz.

## Kişisel numara ve kendiyle sohbet davranışı

Bağlı kendi numarası `allowFrom` içinde de bulunduğunda, WhatsApp kendiyle sohbet korumaları etkinleşir:

- kendiyle sohbet turları için okundu bilgilerini atla
- aksi halde kendinize bildirim gönderecek bahsetme-JID otomatik tetikleme davranışını yoksay
- `messages.responsePrefix` ayarlanmamışsa, kendiyle sohbet yanıtları varsayılan olarak `[{identity.name}]` veya `[openclaw]` olur

## İleti normalleştirme ve bağlam

<AccordionGroup>
  <Accordion title="Gelen zarf + yanıt bağlamı">
    Gelen WhatsApp iletileri paylaşılan gelen zarfın içine sarılır.

    Alıntılanmış bir yanıt varsa, bağlam şu biçimde eklenir:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Yanıt meta veri alanları da kullanılabilir olduğunda doldurulur (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, gönderen JID/E.164).
    Alıntılanan yanıt hedefi indirilebilir medya olduğunda, OpenClaw bunu
    normal gelen medya deposu üzerinden kaydeder ve `MediaPath`/`MediaType` olarak sunar; böylece
    ajan yalnızca `<media:image>` görmek yerine başvurulan görseli inceleyebilir.

  </Accordion>

  <Accordion title="Medya yer tutucuları ve konum/kişi çıkarımı">
    Yalnızca medya içeren gelen iletiler şu tür yer tutucularla normalleştirilir:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Yetkili grup sesli notları, gövde yalnızca `<media:audio>` olduğunda bahsetme denetiminden önce
    yazıya dökülür; böylece sesli notta bot bahsetmesini söylemek
    yanıtı tetikleyebilir. Döküm yine de bottan bahsetmiyorsa,
    döküm ham yer tutucu yerine bekleyen grup geçmişinde tutulur.

    Konum gövdeleri kısa koordinat metni kullanır. Konum etiketleri/yorumları ve kişi/vCard ayrıntıları, satır içi istem metni olarak değil, çitli güvenilmeyen meta veri olarak işlenir.

  </Accordion>

  <Accordion title="Bekleyen grup geçmişi ekleme">
    Gruplar için işlenmemiş iletiler arabelleğe alınabilir ve bot sonunda tetiklendiğinde bağlam olarak eklenebilir.

    - varsayılan sınır: `50`
    - yapılandırma: `channels.whatsapp.historyLimit`
    - yedek: `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    Ekleme işaretçileri:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Okundu bilgileri">
    Kabul edilen gelen WhatsApp iletileri için okundu bilgileri varsayılan olarak etkindir.

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

    Hesap bazında geçersiz kılma:

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

## Teslim, parçalara ayırma ve medya

<AccordionGroup>
  <Accordion title="Metin parçalama">
    - varsayılan parça sınırı: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` modu paragraf sınırlarını (boş satırlar) tercih eder, ardından uzunluk açısından güvenli parçalamaya geri döner

  </Accordion>

  <Accordion title="Giden medya davranışı">
    - görsel, video, ses (PTT sesli not) ve belge yüklerini destekler
    - ses medyası Baileys `audio` yükü üzerinden `ptt: true` ile gönderilir; böylece WhatsApp istemcileri bunu bas-konuş sesli notu olarak işler
    - yanıt yükleri `audioAsVoice` değerini korur; WhatsApp için TTS sesli not çıktısı, sağlayıcı MP3 veya WebM döndürse bile bu PTT yolunda kalır
    - yerel Ogg/Opus sesi, sesli not uyumluluğu için `audio/ogg; codecs=opus` olarak gönderilir
    - Microsoft Edge TTS MP3/WebM çıktısı dahil Ogg olmayan ses, PTT tesliminden önce `ffmpeg` ile 48 kHz mono Ogg/Opus biçimine dönüştürülür
    - `/tts latest`, en son asistan yanıtını tek bir sesli not olarak gönderir ve aynı yanıt için tekrar gönderimleri bastırır; `/tts chat on|off|default` geçerli WhatsApp sohbeti için otomatik TTS'yi denetler
    - animasyonlu GIF oynatma, video gönderimlerinde `gifPlayback: true` ile desteklenir
    - `forceDocument` / `asDocument`, çözümlenen dosya adını ve MIME türünü korurken WhatsApp medya sıkıştırmasını önlemek için giden görselleri, GIF'leri ve videoları Baileys belge yükü üzerinden gönderir
    - çoklu medya yanıt yükleri gönderilirken altyazılar ilk medya öğesine uygulanır; ancak PTT sesli notları sesi önce, görünür metni ayrı gönderir çünkü WhatsApp istemcileri sesli not altyazılarını tutarlı biçimde işlemez
    - medya kaynağı HTTP(S), `file://` veya yerel yollar olabilir

  </Accordion>

  <Accordion title="Medya boyutu sınırları ve yedek davranış">
    - gelen medya kaydetme üst sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - giden medya gönderme üst sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - hesap bazında geçersiz kılmalar `channels.whatsapp.accounts.<accountId>.mediaMaxMb` kullanır
    - `forceDocument` / `asDocument` belge teslimi istemediği sürece görseller sınırlara sığacak şekilde otomatik optimize edilir (yeniden boyutlandırma/kalite taraması)
    - medya gönderimi başarısız olduğunda, ilk öğe yedeği yanıtı sessizce düşürmek yerine metin uyarısı gönderir

  </Accordion>
</AccordionGroup>

## Yanıt alıntılama

WhatsApp, giden yanıtların gelen iletiyi görünür şekilde alıntıladığı yerel yanıt alıntılamayı destekler. Bunu `channels.whatsapp.replyToMode` ile denetleyin.

| Değer       | Davranış                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Asla alıntılama; düz ileti olarak gönder                              |
| `"first"`   | Yalnızca ilk giden yanıt parçasını alıntıla                           |
| `"all"`     | Her giden yanıt parçasını alıntıla                                    |
| `"batched"` | Anlık yanıtları alıntısız bırakırken kuyruğa alınmış toplu yanıtları alıntıla |

Varsayılan `"off"` değeridir. Hesap bazında geçersiz kılmalar `channels.whatsapp.accounts.<id>.replyToMode` kullanır.

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

`channels.whatsapp.reactionLevel`, ajanın WhatsApp üzerinde emoji tepkilerini ne kadar geniş kullandığını denetler:

| Düzey         | Onay tepkileri | Ajan tarafından başlatılan tepkiler | Açıklama                                      |
| ------------- | -------------- | ----------------------------------- | -------------------------------------------- |
| `"off"`       | Hayır          | Hayır                               | Hiç tepki yok                                |
| `"ack"`       | Evet           | Hayır                               | Yalnızca onay tepkileri (yanıt öncesi alındı) |
| `"minimal"`   | Evet           | Evet (ölçülü)                       | Onay + ölçülü yönergelerle ajan tepkileri    |
| `"extensive"` | Evet           | Evet (teşvik edilir)                | Onay + teşvik edilen yönergelerle ajan tepkileri |

Varsayılan: `"minimal"`.

Hesap bazında geçersiz kılmalar `channels.whatsapp.accounts.<id>.reactionLevel` kullanır.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Alındı onayı tepkileri

WhatsApp, `channels.whatsapp.ackReaction` üzerinden gelen alındığında anlık onay tepkilerini destekler.
Onay tepkileri `reactionLevel` tarafından denetlenir; `reactionLevel` `"off"` olduğunda bastırılır.

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

- gelen mesaj kabul edildikten hemen sonra gönderilir (yanıttan önce)
- `ackReaction`, `emoji` olmadan varsa WhatsApp yönlendirilen ajanın kimlik emojisini kullanır, yoksa "👀" kullanır; onay tepkisi göndermemek için `ackReaction` öğesini atlayın veya `emoji: ""` ayarlayın
- hatalar günlüğe kaydedilir ancak normal yanıt teslimini engellemez
- grup modu `mentions`, bahsetmeyle tetiklenen turlarda tepki verir; grup etkinleştirme `always`, bu kontrol için atlama görevi görür
- WhatsApp `channels.whatsapp.ackReaction` kullanır (eski `messages.ackReaction` burada kullanılmaz)

## Yaşam döngüsü durum tepkileri

WhatsApp'ın bir tur sırasında statik bir alındı emojisi bırakmak yerine onay tepkisini değiştirmesine izin vermek için `messages.statusReactions.enabled: true` ayarlayın. Etkinleştirildiğinde OpenClaw, sıraya alındı, düşünüyor, araç etkinliği, Compaction, tamamlandı ve hata gibi yaşam döngüsü durumları için aynı gelen mesaj tepki yuvasını kullanır.

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

- `channels.whatsapp.ackReaction`, durum tepkilerinin doğrudan mesajlar ve gruplar için uygun olup olmadığını hâlâ denetler.
- Sıraya alındı durum tepkisi, düz onay tepkileriyle aynı etkili onay emojisini kullanır.
- WhatsApp'ta mesaj başına bir bot tepki yuvası vardır, bu nedenle yaşam döngüsü güncellemeleri mevcut tepkiyi yerinde değiştirir.
- `messages.removeAckAfterReply: true`, yapılandırılan tamamlandı/hata bekletmesinden sonra son durum tepkisini temizler.
- Araç emoji kategorileri `tool`, `coding`, `web`, `deploy`, `build` ve `concierge` içerir.

## Çoklu hesap ve kimlik bilgileri

<AccordionGroup>
  <Accordion title="Hesap seçimi ve varsayılanlar">
    - hesap kimlikleri `channels.whatsapp.accounts` içinden gelir
    - varsayılan hesap seçimi: varsa `default`, aksi takdirde ilk yapılandırılmış hesap kimliği (sıralı)
    - hesap kimlikleri arama için dahili olarak normalleştirilir

  </Accordion>

  <Accordion title="Kimlik bilgisi yolları ve eski uyumluluk">
    - geçerli kimlik doğrulama yolu: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - yedek dosya: `creds.json.bak`
    - `~/.openclaw/credentials/` içindeki eski varsayılan kimlik doğrulaması, varsayılan hesap akışları için hâlâ tanınır/geçirilir

  </Accordion>

  <Accordion title="Çıkış davranışı">
    `openclaw channels logout --channel whatsapp [--account <id>]`, o hesap için WhatsApp kimlik doğrulama durumunu temizler.

    Bir Gateway erişilebilir olduğunda, çıkış işlemi önce seçilen hesap için canlı WhatsApp dinleyicisini durdurur; böylece bağlı oturum bir sonraki yeniden başlatmaya kadar mesaj almaya devam etmez. `openclaw channels remove --channel whatsapp` da hesap yapılandırmasını devre dışı bırakmadan veya silmeden önce canlı dinleyiciyi durdurur.

    Eski kimlik doğrulama dizinlerinde, Baileys kimlik doğrulama dosyaları kaldırılırken `oauth.json` korunur.

  </Accordion>
</AccordionGroup>

## Araçlar, eylemler ve yapılandırma yazımları

- Ajan araç desteği WhatsApp tepki eylemini (`react`) içerir.
- Eylem kapıları:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Kanal tarafından başlatılan yapılandırma yazımları varsayılan olarak etkindir (`channels.whatsapp.configWrites=false` ile devre dışı bırakın).

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

  <Accordion title="Bağlı ama bağlantı kesildi / yeniden bağlanma döngüsü">
    Belirti: tekrarlanan bağlantı kesilmeleri veya yeniden bağlanma girişimleri olan bağlı hesap.

    Sessiz hesaplar normal mesaj zaman aşımını geçtikten sonra da bağlı kalabilir; izleme mekanizması
    WhatsApp Web taşıma etkinliği durduğunda, soket kapandığında veya
    uygulama düzeyi etkinlik daha uzun güvenlik penceresini aşacak kadar sessiz kaldığında yeniden başlatır.

    Günlükler tekrarlanan `status=408 Request Time-out Connection was lost` gösteriyorsa,
    `web.whatsapp` altındaki Baileys soket zamanlamalarını ayarlayın. Önce
    `keepAliveIntervalMs` değerini ağınızın boşta kalma zaman aşımının altına düşürerek ve yavaş
    veya kayıplı bağlantılarda `connectTimeoutMs` değerini artırarak başlayın:

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

    Ana makine bağlantısı ve zamanlama düzeltildikten sonra döngü sürerse,
    hesap kimlik doğrulama dizinini yedekleyin ve o hesabı yeniden bağlayın:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    `~/.openclaw/logs/whatsapp-health.log` içinde `Gateway inactive` yazıyorsa ancak
    `openclaw gateway status` ve `openclaw channels status --probe` Gateway'in
    ve WhatsApp'ın sağlıklı olduğunu gösteriyorsa, `openclaw doctor` çalıştırın. Linux'ta doctor,
    hâlâ `~/.openclaw/bin/ensure-whatsapp.sh` çağıran eski crontab girdileri hakkında
    uyarır; bu eski girdileri `crontab -e` ile kaldırın çünkü cron systemd kullanıcı veri yolu
    ortamından yoksun olabilir ve bu eski betiğin Gateway sağlığını yanlış bildirmesine neden olabilir.

    Gerekirse `channels login` ile yeniden bağlayın.

  </Accordion>

  <Accordion title="QR oturumu proxy arkasında zaman aşımına uğruyor">
    Belirti: `openclaw channels login --channel whatsapp`, kullanılabilir bir QR kodu göstermeden önce `status=408 Request Time-out` veya TLS soket bağlantı kesilmesiyle başarısız olur.

    WhatsApp Web oturum açma, Gateway ana makinesinin standart proxy ortamını (`HTTPS_PROXY`, `HTTP_PROXY`, küçük harfli varyantlar ve `NO_PROXY`) kullanır. Gateway sürecinin proxy env değerlerini devraldığını ve `NO_PROXY` değerinin `mmg.whatsapp.net` ile eşleşmediğini doğrulayın.

  </Accordion>

  <Accordion title="Gönderirken etkin dinleyici yok">
    Hedef hesap için etkin Gateway dinleyicisi yoksa giden gönderimler hızlıca başarısız olur.

    Gateway'in çalıştığından ve hesabın bağlı olduğundan emin olun.

  </Accordion>

  <Accordion title="Yanıt dökümde görünüyor ama WhatsApp'ta görünmüyor">
    Döküm satırları ajanın ne ürettiğini kaydeder. WhatsApp teslimi ayrı olarak kontrol edilir: OpenClaw, bir otomatik yanıtı yalnızca Baileys en az bir görünür metin veya medya gönderimi için giden mesaj kimliği döndürdükten sonra gönderilmiş sayar.

    Onay tepkileri bağımsız yanıt öncesi alındılardır. Başarılı bir tepki, daha sonraki metin veya medya yanıtının WhatsApp tarafından kabul edildiğini kanıtlamaz.

    Gateway günlüklerinde `auto-reply delivery failed` veya `auto-reply was not accepted by WhatsApp provider` arayın.

  </Accordion>

  <Accordion title="Grup mesajları beklenmedik şekilde yok sayılıyor">
    Şu sırayla kontrol edin:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` izin listesi girdileri
    - bahsetme kapısı (`requireMention` + bahsetme kalıpları)
    - `openclaw.json` içinde yinelenen anahtarlar (JSON5): sonraki girdiler öncekileri geçersiz kılar, bu nedenle kapsam başına tek bir `groupPolicy` tutun

    `channels.whatsapp.groups` varsa WhatsApp diğer gruplardan gelen mesajları hâlâ gözlemleyebilir, ancak OpenClaw bunları oturum yönlendirmesinden önce düşürür. Grup JID'sini `channels.whatsapp.groups` içine ekleyin veya gönderen yetkilendirmesini `groupPolicy` ve `groupAllowFrom` altında tutarken tüm grupları kabul etmek için `groups["*"]` ekleyin.

  </Accordion>

  <Accordion title="Bun çalışma zamanı uyarısı">
    WhatsApp Gateway çalışma zamanı Node kullanmalıdır. Bun, kararlı WhatsApp/Telegram Gateway çalışması için uyumsuz olarak işaretlenir.
  </Accordion>
</AccordionGroup>

## Sistem istemleri

WhatsApp, `groups` ve `direct` eşlemeleri aracılığıyla gruplar ve doğrudan sohbetler için Telegram tarzı sistem istemlerini destekler.

Grup mesajları için çözümleme hiyerarşisi:

Etkili `groups` eşlemesi önce belirlenir: hesap kendi `groups` değerini tanımlıyorsa, kök `groups` eşlemesinin tamamen yerini alır (derin birleştirme yok). İstem araması daha sonra ortaya çıkan tek eşleme üzerinde çalışır:

1. **Gruba özel sistem istemi** (`groups["<groupId>"].systemPrompt`): belirli grup girdisi eşlemede varsa **ve** `systemPrompt` anahtarı tanımlıysa kullanılır. `systemPrompt` boş bir dizeyse (`""`), joker bastırılır ve sistem istemi uygulanmaz.
2. **Grup joker sistem istemi** (`groups["*"].systemPrompt`): belirli grup girdisi eşlemede tamamen yoksa veya varsa ancak `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

Doğrudan mesajlar için çözümleme hiyerarşisi:

Etkili `direct` eşlemesi önce belirlenir: hesap kendi `direct` değerini tanımlıyorsa, kök `direct` eşlemesinin tamamen yerini alır (derin birleştirme yok). İstem araması daha sonra ortaya çıkan tek eşleme üzerinde çalışır:

1. **Doğrudana özel sistem istemi** (`direct["<peerId>"].systemPrompt`): belirli eş girdisi eşlemede varsa **ve** `systemPrompt` anahtarı tanımlıysa kullanılır. `systemPrompt` boş bir dizeyse (`""`), joker bastırılır ve sistem istemi uygulanmaz.
2. **Doğrudan joker sistem istemi** (`direct["*"].systemPrompt`): belirli eş girdisi eşlemede tamamen yoksa veya varsa ancak `systemPrompt` anahtarı tanımlamıyorsa kullanılır.

<Note>
`dms`, DM başına hafif geçmiş geçersiz kılma bölmesi olarak kalır (`dms.<id>.historyLimit`). İstem geçersiz kılmaları `direct` altında bulunur.
</Note>

**Telegram çoklu hesap davranışından farkı:** Telegram'da kök `groups`, çoklu hesap kurulumundaki tüm hesaplar için, kendi `groups` değerini tanımlamayan hesaplar dahil, kasıtlı olarak bastırılır; bu, bir botun ait olmadığı gruplar için grup mesajları almasını önler. WhatsApp bu korumayı uygulamaz: kök `groups` ve kök `direct`, kaç hesap yapılandırılmış olursa olsun hesap düzeyi geçersiz kılma tanımlamayan hesaplar tarafından her zaman devralınır. Çoklu hesaplı bir WhatsApp kurulumunda hesap başına grup veya doğrudan istemler istiyorsanız, kök düzey varsayılanlara güvenmek yerine tam eşlemeyi her hesabın altında açıkça tanımlayın.

Önemli davranış:

- `channels.whatsapp.groups`, hem grup başına yapılandırma eşlemesi hem de sohbet düzeyi grup izin listesidir. Kök veya hesap kapsamında `groups["*"]`, o kapsam için "tüm gruplar kabul edilir" anlamına gelir.
- Joker grup `systemPrompt` değerini yalnızca o kapsamın zaten tüm grupları kabul etmesini istediğinizde ekleyin. Yine de yalnızca sabit bir grup kimliği kümesinin uygun olmasını istiyorsanız, istem varsayılanı için `groups["*"]` kullanmayın. Bunun yerine istemi açıkça izin listesine alınmış her grup girdisinde tekrarlayın.
- Grup kabulü ve gönderen yetkilendirmesi ayrı kontrollerdir. `groups["*"]`, grup işlemeye ulaşabilecek grup kümesini genişletir, ancak tek başına bu gruplardaki her göndereni yetkilendirmez. Gönderen erişimi hâlâ ayrı olarak `channels.whatsapp.groupPolicy` ve `channels.whatsapp.groupAllowFrom` tarafından denetlenir.
- `channels.whatsapp.direct`, DM'ler için aynı yan etkiye sahip değildir. `direct["*"]`, yalnızca bir DM `dmPolicy` artı `allowFrom` veya eşleştirme deposu kuralları tarafından zaten kabul edildikten sonra varsayılan doğrudan sohbet yapılandırması sağlar.

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

Önemli WhatsApp alanları:

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
- [Çoklu ajan yönlendirme](/tr/concepts/multi-agent)
- [Sorun giderme](/tr/channels/troubleshooting)
