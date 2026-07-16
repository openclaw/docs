---
read_when:
    - WhatsApp/web kanalı davranışı veya gelen kutusu yönlendirmesi üzerinde çalışma
summary: WhatsApp kanal desteği, erişim denetimleri, teslim davranışı ve operasyonlar
title: WhatsApp
x-i18n:
    generated_at: "2026-07-16T16:41:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d9d6af1b32a428e0a35794fa4b5a8a861cb404a5b6848a265bf5d43f4cdad168
    source_path: channels/whatsapp.md
    workflow: 16
---

Durum: WhatsApp Web (Baileys) üzerinden üretime hazır. Bağlı oturumların sahibi gateway'dir; ayrı bir Twilio WhatsApp kanalı yoktur.

## Kurulum

`openclaw onboard` ve `openclaw channels add --channel whatsapp`, ilk kez seçildiğinde pluginin kurulmasını ister; plugin eksikse `openclaw channels login --channel whatsapp` aynı kurulum akışını sunar. Geliştirme çalışma kopyaları yerel plugin yolunu kullanır; kararlı/beta kurulumları önce ClawHub'dan `@openclaw/whatsapp` kurar, başarısız olursa npm'e başvurur. WhatsApp çalışma zamanı, çekirdek OpenClaw npm paketinin dışında sunulduğundan çalışma zamanı bağımlılıkları harici pluginle birlikte kalır. Manuel kurulum:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Yalın npm paketini (`@openclaw/whatsapp`) yalnızca kayıt defteri geri dönüşü için kullanın; yalnızca yeniden üretilebilir bir kurulum için tam bir sürümü sabitleyin.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bilinmeyen göndericiler için varsayılan DM politikası eşleştirmedir.
  </Card>
  <Card title="Kanal sorunlarını giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım çalışma planları.
  </Card>
  <Card title="Gateway yapılandırması" icon="settings" href="/tr/gateway/configuration">
    Kapsamlı kanal yapılandırma kalıpları ve örnekleri.
  </Card>
</CardGroup>

## Hızlı kurulum

<Steps>
  <Step title="Erişim politikasını yapılandırın">

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

    Oturum açma yalnızca QR ile yapılır. Uzak veya ekransız ana makinelerde oturum açmayı başlatmadan önce canlı QR'ı telefona ulaştıracak güvenilir bir yol sağlayın; terminalde oluşturulan QR'ların, ekran görüntülerinin veya sohbet eklerinin süresi aktarım sırasında dolabilir.

    Belirli bir hesap için:

```bash
openclaw channels login --channel whatsapp --account work
```

    Oturum açmadan önce mevcut/özel bir kimlik doğrulama dizini eklemek için:

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

  <Step title="İlk eşleştirme isteğini onaylayın (eşleştirme modu)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Eşleştirme isteklerinin süresi 1 saat sonra dolar; bekleyen istekler hesap başına en fazla 3 olabilir.

  </Step>
</Steps>

<Note>
Ayrı bir WhatsApp numarası önerilir (kurulum ve meta veriler bunun için optimize edilmiştir), ancak kişisel numara/kendi kendine sohbet kurulumları tamamen desteklenir.
</Note>

## Dağıtım kalıpları

<AccordionGroup>
  <Accordion title="Ayrılmış numara (önerilen)">
    - OpenClaw için ayrı WhatsApp kimliği
    - daha açık DM izin listeleri ve yönlendirme sınırları
    - kendi kendine sohbet karışıklığı olasılığının daha düşük olması

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

  <Accordion title="Kişisel numara geri dönüşü">
    İlk katılım, kişisel numara modunu destekler ve kendi kendine sohbet için uygun bir temel yapılandırma yazar: `dmPolicy: "allowlist"`, kendi numaranızı içeren `allowFrom`, `selfChatMode: true`. Çalışma zamanındaki kendi kendine sohbet korumaları, bağlı öz numarayı ve `allowFrom` değerini temel alır.
  </Accordion>
</AccordionGroup>

## Çalışma zamanı modeli

- WhatsApp soketinin ve yeniden bağlanma döngüsünün sahibi gateway'dir.
- Bir gözetleyici iki sinyali bağımsız olarak izler: ham WhatsApp Web aktarım etkinliği ve uygulama mesajı etkinliği. Sessiz ancak bağlı bir oturum, yalnızca yakın zamanda mesaj gelmediği için yeniden başlatılmaz; yalnızca aktarım çerçeveleri sabit bir dahili süre boyunca (kullanıcı tarafından yapılandırılamaz) gelmeyi durdurduğunda veya uygulama mesajları normal mesaj zaman aşımının 4 katını aşacak şekilde sessiz kaldığında yeniden bağlanmaya zorlanır. Yakın zamanda etkin olan bir oturum yeniden bağlandıktan hemen sonra bu ilk zaman aralığı, 4 katlık süre yerine daha kısa olan normal mesaj zaman aşımını kullanır. OpenClaw, Baileys'in bu yeniden bağlanmanın erken aşamasında teslim ettiği çevrimdışı mesajlara, gelen mesaj kimliği tekilleştirme süresiyle sınırlı olarak otomatik yanıt verebilir; ilk başlatma, kısa eski geçmiş korumasını sürdürür.
- Baileys soket zamanlamaları `web.whatsapp.*` altında açıkça belirtilir: `keepAliveIntervalMs` (uygulama ping aralığı), `connectTimeoutMs` (açılış el sıkışması zaman aşımı), `defaultQueryTimeoutMs` (Baileys sorgu beklemelerinin yanı sıra OpenClaw'ın giden gönderim/mevcudiyet ve gelen okundu bilgisi zaman aşımları).
- Giden gönderimler, hedef hesap için etkin bir WhatsApp dinleyicisi gerektirir; aksi takdirde gönderimler hemen başarısız olur.
- Grup gönderimleri, belirteç güncel katılımcı meta verileriyle eşleştiğinde LID destekli gruplar dâhil olmak üzere `@+<digits>` ve `@<digits>` belirteçleri için (metinde ve medya açıklamalarında) yerel bahsetme meta verileri ekler.
- Durum ve yayın sohbetleri (`@status`, `@broadcast`) yok sayılır.
- Doğrudan sohbetler DM oturum kurallarını kullanır (`session.dmScope`; varsayılan `main`, DM'leri agent ana oturumunda birleştirir). Grup oturumları JID başına yalıtılır (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Kanalları/Bültenleri, DM anlam bilimi yerine kanal oturumu meta verilerini (`agent:<agentId>:whatsapp:channel:<jid>`) kullanarak yerel `@newsletter` JID'leri aracılığıyla açık giden hedefler olabilir.
- WhatsApp Web aktarımı, gateway ana makinesindeki standart proxy ortam değişkenlerine uyar (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`, küçük harfli biçimleri). Kanal başına ayarlar yerine ana makine düzeyinde proxy yapılandırmasını tercih edin.
- `messages.removeAckAfterReply` etkinleştirildiğinde OpenClaw, görünür bir yanıt teslim edildikten sonra alındı onayı tepkisini temizler.

## Mevcut istekte bulunan kişiyi MeowCaller ile arama (deneysel)

Plugin, WhatsApp kaynaklı agent turlarında `whatsapp_call` özelliğini kullanıma sunabilir. Mevcut yetkili istekte bulunan kişiye WhatsApp sesli araması yapmak ve yanıt verdikten sonra OpenClaw TTS mesajını oynatmak için [MeowCaller](https://github.com/purpshell/meowcaller) kullanır. Araçta hedef numara parametresi bulunmadığından bir istem aramayı başka yere yönlendiremez. Varsayılan olarak devre dışıdır.

<Warning>
MeowCaller deneyseldir, etiketlenmiş bir sürümü yoktur ve ayrıca eşleştirilmiş bir whatsmeow bağlı cihaz oturumu kullanır; pluginin Baileys kimlik bilgilerini yeniden kullanamaz. Eşleştirme, aynı WhatsApp hesabına başka bir bağlı cihaz ekler; OpenClaw'ın kullandığı kimlikle tarayın. Kişisel numara/kendi kendine sohbet modu kendisini arayamaz; kişisel numaranızı aramak için OpenClaw'a ayrılmış bir numara kullanın.
</Warning>

<Steps>
  <Step title="Deneysel aramaları etkinleştirin">

    WhatsApp kanal yapılandırmasına `actions.calls: true` ekleyin ve gateway'i yeniden başlatın:

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

    Bulunmadığında veya `false` olduğunda OpenClaw, `whatsapp_call` aracını kullanıma sunmaz.

  </Step>

  <Step title="İncelenmiş MeowCaller CLI'ını kurun">

    Bağdaştırıcı, gateway ana makinesinin `PATH` değişkeninde bir `meowcaller` yürütülebilir dosyası bekler. [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) birleştirilene kadar incelenmiş dalı derleyin:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    `$HOME/.local/bin` değerinin gateway hizmetinin `PATH` değişkeninde bulunduğundan emin olun. Bu revizyonda açık `pair` ve yalnızca gönderim yapan `notify` komutları bulunur; `notify` hiçbir mikrofonu, hoparlörü, video cihazını veya tanılama yakalamasını açmaz. Bunun yerine yukarı akış örnek CLI'ının `play` komutunu kullanmayın.

  </Step>

  <Step title="MeowCaller bağlı cihazını eşleştirin">

    WhatsApp agentından arama kurulumunu kontrol etmesini isteyin (`whatsapp_call` durum eylemi, hesaba özgü durum dizinini ve eşleştirme komutunu bildirir). Varsayılan hesap için:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Bunu etkileşimli olarak çalıştırın, QR'ı **WhatsApp > Linked devices** konumundan tarayın ve `MeowCaller linked device ready` için bekleyin. `wa-voip.db` değerini gizli tutun; bu, MeowCaller oturumudur. Varsayılan olmayan hesaplar durum eyleminden kendi depolama yollarını alır; Windows'ta ilgili PowerShell komutunu çalıştırın.

  </Step>

  <Step title="TTS'yi yapılandırın ve WhatsApp'tan arama yapın">

    Telefon görüşmesi yapabilen bir [TTS sağlayıcısı](/tr/tools/tts) yapılandırın, gateway'i yeniden başlatın ve ardından `Call me and say the build finished.` gibi bir istek gönderin. Araç, göndericiyi güvenilir gelen bağlamdan çözümler, geçici ve özel bir WAV dosyası sentezler, MeowCaller'ı sınırlı bir arama süresi boyunca çalıştırır ve sonrasında ses dosyasını siler. OpenClaw hesabın deposunu açıkça iletir, yanıtlama/oynatma/kapatma işlemlerinden sonra sıfır çıkış durumu bekler ve zaman aşımını ya da sıfır olmayan çıkışı başarısız bir araç çağrısı olarak değerlendirir.

  </Step>
</Steps>

Sınırlar: yalnızca bire bir giden sesli aramalar, rastgele hedef numaralar yok, sohbet bağlantısıyla paylaşılan kimlik doğrulama yok, kişisel numara/kendi kendine sohbet modundan kendi kendini arama yok, sentezlenen ses en fazla 60 saniye, MeowCaller'ın yanıtlama/oynatma/kapatma tamamlanmasının ötesinde telefon tarafında duyulabilirlik alındısı yoktur ve OpenClaw, eşlik eden işlemi 115-175 saniyelik sınırlı bir zaman aralığından sonra durdurur (MeowCaller'ın bağlantı, yanıtlama, oynatma ve kapatma aşamalarını kapsar).

## Onay istemleri

WhatsApp, yürütme ve plugin onay istemlerini `👍`/`👎` tepkileri olarak görüntüleyebilir; bunlar üst düzey onay yönlendirme yapılandırmasıyla denetlenir:

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

`approvals.exec` ve `approvals.plugin` birbirinden bağımsızdır; WhatsApp'ı kanal olarak etkinleştirmek yalnızca aktarımı bağlar ve eşleşen onay ailesi etkinleştirilip oraya yönlendirilmediği sürece hiçbir şey göndermez. Oturum modu, yalnızca WhatsApp'tan kaynaklanan onaylar için yerel emoji onayları teslim eder. Hedef modu, açık hedefler için paylaşılan yönlendirme işlem hattını kullanır ve ayrı bir onaylayıcı DM dağıtımı oluşturmaz.

WhatsApp onay tepkileri, `allowFrom` (veya `"*"`) içinde açıkça belirtilmiş onaylayıcılar gerektirir. `defaultTo`, onaylayıcı listesi değil, sıradan varsayılan mesaj hedeflerini ayarlar. Manuel `/approve` komutları, onay çözümlenmeden önce normal WhatsApp gönderici yetkilendirme yolundan geçmeye devam eder.

## Plugin kancaları ve gizlilik

Gelen WhatsApp mesajları kişisel içerik, telefon numaraları, grup tanımlayıcıları, gönderici adları ve oturum ilişkilendirme alanları içerebilir. Siz etkinleştirmediğiniz sürece WhatsApp, gelen `message_received` kanca yüklerini pluginlere yayınlamaz:

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

Etkinleştirme kapsamını `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived` altında tek bir hesapla sınırlandırın. Bunu yalnızca gelen WhatsApp içeriği ve tanımlayıcıları konusunda güvendiğiniz pluginler için etkinleştirin.

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM politikası">
    `channels.whatsapp.dmPolicy`:

    | Değer | Davranış |
    | --- | --- |
    | `pairing` (varsayılan) | Bilinmeyen göndericiler eşleştirme ister; sahip onaylar |
    | `allowlist` | Yalnızca `allowFrom` göndericileri kabul edilir |
    | `open` | `allowFrom` değerinin `"*"` içermesini gerektirir |
    | `disabled` | Tüm DM'leri engeller |

    `allowFrom`, E.164 biçimindeki numaraları kabul eder (dâhili olarak normalleştirilir). Bu yalnızca bir DM gönderici erişim denetimi listesidir; grup JID'lerine veya `@newsletter` kanal JID'lerine yapılan açık giden gönderimleri kısıtlamaz.

    Çoklu hesap geçersiz kılması: `channels.whatsapp.accounts.<id>.dmPolicy` (ve `.allowFrom`), ilgili hesap için kanal düzeyindeki varsayılanlardan önceliklidir.

    Çalışma zamanı notları:

    - eşleştirmeler kanal izin deposunda kalıcı olur ve yapılandırılmış `allowFrom` ile birleştirilir
    - zamanlanmış otomasyon ve Heartbeat alıcısı için geri dönüş, açık teslimat hedeflerini veya yapılandırılmış `allowFrom` değerini kullanır; DM eşleştirme onayları örtük Cron/Heartbeat alıcıları değildir
    - hiçbir izin listesi yapılandırılmamışsa, bağlı kişisel numaraya varsayılan olarak izin verilir
    - OpenClaw, giden `fromMe` DM'lerini (bağlı cihazdan kendinize gönderdiğiniz mesajları) hiçbir zaman otomatik olarak eşleştirmez

  </Tab>

  <Tab title="Grup ilkesi ve izin listeleri">
    Grup erişiminin iki katmanı vardır:

    1. **Grup üyeliği izin listesi** (`channels.whatsapp.groups`): `groups` belirtilmezse tüm gruplar uygundur; mevcutsa grup izin listesi işlevi görür (`"*"` tümünü kabul eder).
    2. **Grup gönderen ilkesi** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` gönderen izin listesini atlar, `allowlist` bir `groupAllowFrom` (veya `*`) eşleşmesi gerektirir, `disabled` gruplardan gelen tüm iletileri engeller.

    `groupAllowFrom` ayarlanmamışsa, girdileri bulunduğunda gönderen kontrolleri `allowFrom` değerine geri döner. Gönderen izin listeleri, bahsetme/yanıt etkinleştirmesinden önce değerlendirilir.

    Hiç `channels.whatsapp` bloğu yoksa, `channels.defaults.groupPolicy` başka bir değere ayarlanmış olsa bile çalışma zamanı `groupPolicy: "allowlist"` değerine geri döner (bir uyarı günlüğüyle).

    <Note>
    Grup üyeliği çözümlemesinde tek hesaplı bir güvenlik ağı vardır: yalnızca bir WhatsApp hesabı yapılandırılmışsa ve hesabın `accounts.<id>.groups` değeri açıkça boş bir nesneyse (`{}`), bu değer "ayarlanmamış" olarak kabul edilir ve her grubu sessizce engellemek yerine kök `channels.whatsapp.groups` eşlemesine geri dönülür. 2+ hesap yapılandırıldığında, açıkça boş bir hesap eşlemesi boş kalır ve geri dönüş yapmaz — böylece bir hesap, diğer hesapları etkilemeden tüm grupları kasıtlı olarak devre dışı bırakabilir.
    </Note>

  </Tab>

  <Tab title="Bahsetmeler ve /activation">
    Grup yanıtları varsayılan olarak bahsetme gerektirir. Bahsetme algılaması şunları kapsar:

    - bot kimliğine yönelik açık WhatsApp bahsetmeleri
    - yapılandırılmış bahsetme regex kalıpları (`agents.list[].groupChat.mentionPatterns`, geri dönüş `messages.groupChat.mentionPatterns`)
    - yetkilendirilmiş grup mesajlarındaki gelen sesli not dökümleri
    - örtük bota yanıt algılaması (yanıt göndereni bot kimliğiyle eşleşir)

    Güvenlik: alıntı/yanıt yalnızca bahsetme kapısını karşılar — gönderen yetkilendirmesi **sağlamaz**. `groupPolicy: "allowlist"` ile izin listesinde bulunmayan gönderenler, izin listesindeki bir kullanıcının mesajına yanıt verseler bile engellenmeye devam eder.

    Oturum düzeyinde etkinleştirme komutu: `/activation mention` veya `/activation always`. Bu, oturum durumunu günceller (genel yapılandırmayı değil) ve sahip denetimine tabidir.

  </Tab>
</Tabs>

## Yapılandırılmış ACP bağlamaları

WhatsApp, üst düzey `bindings[]` üzerinden kalıcı ACP bağlamalarını destekler:

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

Doğrudan sohbetler E.164 numaralarıyla, gruplar ise WhatsApp grup JID'leriyle eşleşir. Grup izin listeleri, gönderen ilkesi ve bahsetme/etkinleştirme kapısı, OpenClaw bağlı ACP oturumunun varlığını sağlamadan önce çalışır. Eşleşen bir bağlama rotanın sahibi olur — yayın grupları bu etkileşimi sıradan WhatsApp oturumlarına dağıtmaz.

## Kişisel numara ve kendi kendine sohbet davranışı

Bağlı kişisel numara `allowFrom` içinde de bulunduğunda kendi kendine sohbet korumaları etkinleşir: kendi kendine sohbet etkileşimlerinde okundu bilgileri atlanır, kendinize bildirim gönderecek bahsetme JID'si otomatik tetikleme davranışı yok sayılır ve `messages.responsePrefix` ayarlanmamışsa yanıtlar varsayılan olarak `[{identity.name}]` (veya `[openclaw]`) hedefine yönlendirilir.

## Mesaj normalleştirme ve bağlam

<AccordionGroup>
  <Accordion title="Gelen zarf ve yanıt bağlamı">
    Gelen mesajlar, paylaşılan gelen zarfla sarmalanır. Alıntılanmış bir yanıt, bağlamı şu biçimde ekler:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Yanıt meta verileri (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, gönderen JID'si/E.164) mevcut olduğunda doldurulur. Alıntılanan hedef indirilebilir bir medyaysa OpenClaw bunu normal gelen medya deposu üzerinden kaydeder ve `MediaPath`/`MediaType` değerlerini sunar; böylece agent yalnızca `<media:image>` görmek yerine medyayı doğrudan inceleyebilir.

  </Accordion>

  <Accordion title="Medya yer tutucuları ve konum/kişi çıkarımı">
    Yalnızca medya içeren mesajlar şu yer tutuculara normalleştirilir: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Gövde yalnızca `<media:audio>` olduğunda, yetkilendirilmiş grup sesli notları bahsetme kapısından önce yazıya dökülür; böylece sesli notta bot bahsetmesinin söylenmesi yanıtı tetikleyebilir. Döküm yine de bottan bahsetmiyorsa ham yer tutucu yerine bekleyen grup geçmişinde kalır.

    Konum gövdeleri kısa koordinat metni olarak işlenir. Konum etiketleri/yorumları ve kişi/vCard ayrıntıları, satır içi istem metni olarak değil, çitle çevrili güvenilmeyen meta veriler olarak işlenir.

  </Accordion>

  <Accordion title="Bekleyen grup geçmişinin eklenmesi">
    İşlenmemiş grup mesajları arabelleğe alınır ve bot nihayet tetiklendiğinde bağlam olarak eklenir.

    - varsayılan sınır: `50`
    - yapılandırma: `channels.whatsapp.historyLimit`, geri dönüş `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    Ekleme işaretçileri: `[Chat messages since your last reply - for context]` ve `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="Okundu bilgileri">
    Kabul edilen gelen mesajlar için varsayılan olarak etkindir. Genel olarak devre dışı bırakmak için:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Hesap başına geçersiz kılma: `channels.whatsapp.accounts.<id>.sendReadReceipts`. Genel olarak etkin olsa bile kendi kendine sohbet etkileşimlerinde okundu bilgileri atlanır.

  </Accordion>
</AccordionGroup>

## Teslimat, parçalara ayırma ve medya

<AccordionGroup>
  <Accordion title="Metni parçalara ayırma">
    - varsayılan parça sınırı: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.streaming.chunkMode = "length" | "newline"`; `newline` paragraf sınırlarını (boş satırları) tercih eder, ardından uzunluk açısından güvenli parçalara ayırmaya geri döner

  </Accordion>

  <Accordion title="Giden medya davranışı">
    - görsel, video, ses (PTT sesli not) ve belge yüklerini destekler
    - ses, `ptt: true` ile Baileys `audio` yükü olarak gönderilir ve bas-konuş sesli notu biçiminde görüntülenir; TTS sesli not çıktısının sağlayıcının kaynak biçiminden bağımsız olarak bu yolu kullanmaya devam etmesi için `audioAsVoice` yanıt yüklerinde korunur
    - yerel Ogg/Opus ses `audio/ogg; codecs=opus` olarak gönderilir; diğer tüm biçimler (Microsoft Edge TTS MP3/WebM çıktısı dâhil) PTT teslimatından önce `ffmpeg` ile 48 kHz mono Ogg/Opus biçimine dönüştürülür
    - `/tts latest` en son asistan yanıtını tek bir sesli not olarak gönderir ve aynı yanıtın tekrar gönderilmesini engeller; `/tts chat on|off|default` mevcut sohbet için otomatik TTS'yi denetler
    - videoda `gifPlayback: true` gönderimleri, animasyonlu GIF oynatımını etkinleştirir
    - `forceDocument`/`asDocument`, WhatsApp'ın medya sıkıştırmasını önlemek için giden görselleri, GIF'leri ve videoları Baileys belge yükü üzerinden yönlendirerek çözümlenen dosya adını ve MIME türünü korur
    - altyazılar, birden çok medya içeren yanıttaki ilk medya öğesine uygulanır; PTT sesli notları bunun dışındadır: ses önce altyazısız gönderilir, ardından altyazı ayrı bir metin mesajı olarak gönderilir (WhatsApp istemcileri sesli not altyazılarını tutarlı biçimde görüntülemez)
    - medya kaynağı HTTP(S), `file://` veya yerel bir yol olabilir

  </Accordion>

  <Accordion title="Medya boyutu sınırları ve geri dönüş davranışı">
    - gelen kaydetme üst sınırı ve giden gönderme üst sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - hesap başına geçersiz kılma: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - `forceDocument`/`asDocument` belge teslimatı istemediği sürece görseller sınırlara sığacak şekilde otomatik olarak optimize edilir (yeniden boyutlandırma/kalite taraması)
    - medya gönderimi başarısız olduğunda, ilk öğe için geri dönüş yanıtı sessizce bırakmak yerine bir metin uyarısı gönderir

  </Accordion>
</AccordionGroup>

## Yanıt alıntılama

`channels.whatsapp.replyToMode`, yerel yanıt alıntılamasını denetler (giden yanıtlar gelen mesajı görünür biçimde alıntılar):

| Değer             | Davranış                                                       |
| ----------------- | -------------------------------------------------------------- |
| `"off"` (varsayılan) | Hiçbir zaman alıntılama; düz mesaj olarak gönder                           |
| `"first"`         | Yalnızca ilk giden yanıt parçasını alıntıla                      |
| `"all"`           | Her giden yanıt parçasını alıntıla                               |
| `"batched"`       | Kuyruğa alınmış toplu yanıtları alıntıla; anlık yanıtları alıntısız bırak |

Hesap başına geçersiz kılma: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Tepki düzeyi

`channels.whatsapp.reactionLevel`, agent'ın emoji tepkilerini ne ölçüde kullandığını denetler:

| Düzey                 | Onay tepkileri | Agent tarafından başlatılan tepkiler  |
| --------------------- | ------------- | -------------------------- |
| `"off"`               | Hayır            | Hayır                         |
| `"ack"`               | Evet           | Hayır                         |
| `"minimal"` (varsayılan) | Evet           | Evet, ölçülü yönlendirme |
| `"extensive"`         | Evet           | Evet, teşvik edilen yönlendirme   |

Hesap başına geçersiz kılma: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Alındı onayı tepkileri

`channels.whatsapp.ackReaction`, gelen ileti alındığında `reactionLevel` tarafından denetlenen anlık bir tepki gönderir (`"off"` olduğunda engellenir):

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

Notlar: gelen ileti kabul edildikten hemen sonra (yanıt öncesinde) gönderilir; `ackReaction`, `emoji` olmadan mevcutsa WhatsApp, yönlendirilen agent'ın kimlik emojisini kullanır ve bulunamazsa "👀" değerine geri döner (onay tepkisi olmaması için `ackReaction` değerini belirtmeyin veya `emoji: ""` olarak ayarlayın); hatalar günlüğe kaydedilir ancak yanıt teslimatını engellemez; `mentions` grup modu yalnızca bahsetmeyle tetiklenen etkileşimlerde tepki verirken `always` grup etkinleştirmesi bu denetimi atlar; WhatsApp yalnızca `channels.whatsapp.ackReaction` kullanır (eski `messages.ackReaction` burada geçerli değildir).

## Yaşam döngüsü durum tepkileri

WhatsApp'ın bir etkileşim sırasında statik bir alındı emojisi bırakmak yerine onay tepkisini değiştirmesi ve kuyruğa alınmış, düşünüyor, araç etkinliği, Compaction, tamamlandı ve hata gibi durumlar arasında geçiş yapması için `messages.statusReactions.enabled: true` değerini ayarlayın:

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

Notlar: `channels.whatsapp.ackReaction` doğrudan mesajlar ve gruplar için uygunluğu denetlemeye devam eder; kuyruğa alınmış durumu, düz onay tepkileriyle aynı etkin emojiyi kullanır; WhatsApp'ta mesaj başına bir bot tepki yuvası vardır, bu nedenle yaşam döngüsü güncellemeleri mevcut tepkiyi yerinde değiştirir; `messages.removeAckAfterReply: true`, yapılandırılmış tamamlandı/hata bekleme süresinden sonra nihai durum tepkisini temizler; araç emoji kategorileri `tool`, `coding`, `web`, `deploy`, `build` ve `concierge` değerlerini içerir.

## Birden çok hesap ve kimlik bilgileri

<AccordionGroup>
  <Accordion title="Hesap seçimi ve varsayılanlar">
    Hesap kimlikleri `channels.whatsapp.accounts` kaynağından gelir. Varsayılan hesap seçimi, mevcutsa `default`; aksi takdirde yapılandırılmış ilk hesap kimliğidir (alfabetik olarak sıralanır). Hesap kimlikleri, arama için dahili olarak normalleştirilir.
  </Accordion>

  <Accordion title="Kimlik bilgisi yolları ve eski sürüm uyumluluğu">
    - geçerli kimlik doğrulama yolu: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (yedek: `creds.json.bak`)
    - `~/.openclaw/credentials/` içindeki eski varsayılan kimlik doğrulama, varsayılan hesap akışları için hâlâ tanınır/taşınır

  </Accordion>

  <Accordion title="Oturumu kapatma davranışı">
    `openclaw channels logout --channel whatsapp [--account <id>]`, bu hesabın WhatsApp kimlik doğrulama durumunu temizler. Bir gateway erişilebilir olduğunda oturum kapatma işlemi önce bu hesabın etkin dinleyicisini durdurur; böylece bağlı oturum, bir sonraki yeniden başlatmadan önce mesaj almayı bırakır. `openclaw channels remove --channel whatsapp` ayrıca hesap yapılandırmasını devre dışı bırakmadan veya silmeden önce etkin dinleyiciyi durdurur.

    Eski kimlik doğrulama dizinlerinde, Baileys kimlik doğrulama dosyaları kaldırılırken `oauth.json` korunur.

  </Accordion>
</AccordionGroup>

## Araçlar, eylemler ve yapılandırma yazma işlemleri

- Agent araç desteği, WhatsApp tepki eylemini (`react`) içerir.
- Eylem geçitleri: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (mevcut eylemler varsayılan olarak `true` değerini kullanır), `channels.whatsapp.actions.calls` (varsayılan `false`, yukarıdaki MeowCaller bölümüne bakın).
- Kanal tarafından başlatılan yapılandırma yazma işlemleri varsayılan olarak etkindir; `channels.whatsapp.configWrites: false` aracılığıyla devre dışı bırakın.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Bağlı değil (QR gerekli)">
    Belirti: kanal durumu, bağlantı kurulmadığını bildirir.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="Bağlı ancak bağlantı kesik / yeniden bağlanma döngüsü">
    Belirti: bağlı hesapta tekrarlanan bağlantı kesilmeleri veya yeniden bağlanma girişimleri.

    Etkinliği düşük hesaplar normal mesaj zaman aşımından sonra da bağlı kalabilir; watchdog yalnızca WhatsApp Web aktarım etkinliği durduğunda, soket kapandığında veya uygulama düzeyindeki etkinlik daha uzun güvenlik aralığı boyunca sessiz kaldığında yeniden başlatır (yukarıdaki Çalışma zamanı modeli bölümüne bakın).

    Günlüklerde tekrarlanan `status=408 Request Time-out Connection was lost` gösteriliyorsa `web.whatsapp` altındaki Baileys soket zamanlamalarını ayarlayın. Önce `keepAliveIntervalMs` değerini ağınızın boşta kalma zaman aşımının altına düşürün ve yavaş veya kayıplı bağlantılarda `connectTimeoutMs` değerini artırın:

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

    Ana makine bağlantısı ve zamanlama düzeltildikten sonra döngü devam ederse hesabın kimlik doğrulama dizinini yedekleyip yeniden bağlayın:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    `~/.openclaw/logs/whatsapp-health.log`, `Gateway inactive` diyorsa ancak `openclaw gateway status` ve `openclaw channels status --probe` durumlarının ikisi de sağlıklı görünüyorsa `openclaw doctor` komutunu çalıştırın. Linux'ta doctor, kullanımdan kaldırılmış `~/.openclaw/bin/ensure-whatsapp.sh` betiğini çağıran eski crontab girdileri hakkında uyarır; bu girdileri `crontab -e` ile kaldırın — cron, systemd kullanıcı veri yolu ortamına sahip olmayabilir ve bu eski betiğin gateway durumunu yanlış bildirmesine neden olabilir.

  </Accordion>

  <Accordion title="Proxy arkasında QR ile oturum açma zaman aşımına uğruyor">
    Belirti: `openclaw channels login --channel whatsapp`, kullanılabilir bir QR göstermeden önce `status=408 Request Time-out` veya TLS soket bağlantısının kesilmesi nedeniyle başarısız olur.

    WhatsApp Web oturum açma işlemi, gateway ana makinesinin standart proxy ortamını (`HTTPS_PROXY`, `HTTP_PROXY`, küçük harfli değişkenler, `NO_PROXY`) kullanır. Gateway işleminin proxy ortamını devraldığını ve `NO_PROXY` değerinin `mmg.whatsapp.net` ile eşleşmediğini doğrulayın.

  </Accordion>

  <Accordion title="Gönderim sırasında etkin dinleyici yok">
    Hedef hesap için etkin bir gateway dinleyicisi bulunmadığında giden gönderimler hızlıca başarısız olur. Gateway'in çalıştığını ve hesabın bağlı olduğunu doğrulayın.
  </Accordion>

  <Accordion title="Yanıt transkriptte görünüyor ancak WhatsApp'ta görünmüyor">
    Transkript satırları Agent'ın oluşturduğu içeriği kaydeder; WhatsApp teslimatı ayrıca denetlenir. OpenClaw, yalnızca Baileys en az bir görünür metin veya medya gönderimi için giden mesaj kimliği döndürdükten sonra otomatik yanıtı gönderilmiş sayar.

    Onay tepkileri, yanıttan bağımsız ön alındılardır — başarılı bir tepki, sonraki metin/medya yanıtının kabul edildiğini kanıtlamaz. Gateway günlüklerinde `auto-reply delivery failed` veya `auto-reply was not accepted by WhatsApp provider` olup olmadığını kontrol edin.

  </Accordion>

  <Accordion title="Grup mesajları beklenmedik şekilde yok sayılıyor">
    Şu sırayla kontrol edin: `groupPolicy`, `groupAllowFrom`/`allowFrom`, `groups` izin listesi girdileri, bahsetme geçidi (`requireMention` + bahsetme kalıpları) ve `openclaw.json` içindeki yinelenen anahtarlar (JSON5'te sonraki girdiler öncekileri geçersiz kılar — her kapsamda yalnızca bir `groupPolicy` bulundurun).

    `channels.whatsapp.groups` mevcutsa WhatsApp diğer gruplardan gelen mesajları yine de gözlemleyebilir, ancak OpenClaw bunları oturum yönlendirmesinden önce bırakır. Grup JID'sini `channels.whatsapp.groups` listesine ekleyin veya gönderen yetkilendirmesini `groupPolicy`/`groupAllowFrom` altında tutarak tüm grupları kabul etmek için `groups["*"]` ekleyin.

  </Accordion>

  <Accordion title="Bun çalışma zamanı uyarısı">
    OpenClaw gateway'leri Node gerektirir. Bun, kanonik durum deposunun kullandığı `node:sqlite` API'sini sağlamaz ve doctor eski Bun hizmetlerini Node'a taşır.
  </Accordion>
</AccordionGroup>

## Sistem istemleri

WhatsApp, `groups` ve `direct` eşlemeleri aracılığıyla gruplar ve doğrudan sohbetler için Telegram tarzı sistem istemlerini destekler.

Grup mesajlarının çözümlenmesi: önce etkili `groups` eşlemesi belirlenir — hesap kendi `groups` anahtarını herhangi bir şekilde tanımlarsa kök `groups` eşlemesini tamamen değiştirir (derin birleştirme yapılmaz). Ardından istem araması yalnızca elde edilen bu eşleme üzerinde çalışır:

1. **Gruba özel istem** (`groups["<groupId>"].systemPrompt`): grup girdisi mevcutsa **ve** `systemPrompt` anahtarı tanımlıysa kullanılır. Boş bir dize (`""`) joker karakteri engeller ve hiçbir istem uygulamaz.
2. **Grup joker karakter istemi** (`groups["*"].systemPrompt`): belirli grup girdisi yoksa veya `systemPrompt` anahtarı olmadan mevcutsa kullanılır.

Doğrudan mesajların çözümlenmesi, `direct` eşlemesi ve `direct["*"]` üzerinde aynı kalıbı izler.

<Note>
`dms`, DM başına hafif geçmiş geçersiz kılma grubu (`dms.<id>.historyLimit`) olarak kalır. İstem geçersiz kılmaları `direct` altında bulunur.
</Note>

<Note>
İstem çözümlemesine yönelik bu hesabın kökün yerini alması davranışı, basit bir sığ geçersiz kılmadır: açıkça belirtilmiş boş bir nesne dâhil olmak üzere herhangi bir hesap `groups`/`direct` anahtarı kök eşlemenin yerini alır. Bu davranış, yukarıda açıklanan ve yanlışlıkla boş bırakılmış bir `groups: {}` için tek hesaplı bir güvenlik ağına sahip grup üyeliği izin listesi denetiminden farklıdır.
</Note>

**Telegram'dan farkı:** Telegram, bir botun üyesi olmadığı gruplardan grup mesajları almasını engellemek için çok hesaplı bir kurulumdaki her hesapta kök `groups` değerini engeller (kendine ait `groups` değeri olmayan hesaplarda bile). WhatsApp bu korumayı uygulamaz — hesap sayısından bağımsız olarak, kendi geçersiz kılması olmayan her hesap kök `groups`/`direct` değerlerini devralır. Çok hesaplı bir WhatsApp kurulumunda hesap başına istemler istiyorsanız tam eşlemeyi her hesabın altında açıkça tanımlayın.

Önemli davranışlar:

- `channels.whatsapp.groups`, hem grup başına yapılandırma eşlemesi hem de sohbet düzeyindeki grup izin listesidir. Kök veya hesap kapsamında `groups["*"]`, bu kapsam için "tüm gruplar kabul edilir" anlamına gelir.
- Yalnızca bu kapsamın tüm grupları kabul etmesini zaten istiyorsanız joker karakter `systemPrompt` ekleyin. Yalnızca sabit bir grup kimliği kümesini uygun tutmak için `groups["*"]` kullanmak yerine istemi açıkça izin verilen her girdide tekrarlayın.
- Grup kabulü ve gönderen yetkilendirmesi ayrı denetimlerdir. `groups["*"]`, hangi grupların grup işlemeye ulaşacağını genişletir; bu gruplardaki her göndereni yetkilendirmez — bu, `groupPolicy`/`groupAllowFrom` tarafından denetlenmeye devam eder.
- `channels.whatsapp.direct`, DM'ler için eşdeğer bir yan etkiye sahip değildir: `direct["*"]`, yalnızca bir DM `dmPolicy` ile `allowFrom` veya eşleştirme deposu kuralları tarafından zaten kabul edildikten sonra varsayılan yapılandırmayı sağlar.

Örnek:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Yalnızca tüm grupların kök kapsamında kabul edilmesi gerekiyorsa kullanın.
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
            // Bu hesap kendi groups eşlemesini tanımladığından kök groups eşlemesi tamamen
            // değiştirilir. Joker karakteri korumak için "*" değerini burada da açıkça tanımlayın.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Proje yönetimine odaklan.",
            },
            // Yalnızca tüm grupların bu hesapta kabul edilmesi gerekiyorsa kullanın.
            "*": { systemPrompt: "İş grupları için varsayılan istem." },
          },
          direct: {
            // Bu hesap kendi direct eşlemesini tanımladığından kök direct girdileri
            // tamamen değiştirilir. Joker karakteri korumak için "*" değerini burada da açıkça tanımlayın.
            "+15551234567": { systemPrompt: "Belirli bir doğrudan iş sohbeti için istem." },
            "*": { systemPrompt: "Doğrudan iş sohbetleri için varsayılan istem." },
          },
        },
      },
    },
  },
}
```

## Yapılandırma referansı işaretçileri

Birincil referans: [Yapılandırma referansı - WhatsApp](/tr/gateway/config-channels#whatsapp)

| Alan             | Alanlar                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| Erişim           | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| Teslimat         | `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`      |
| Çoklu hesap      | `accounts.<id>.enabled`, `accounts.<id>.authDir` ve diğer hesap başına geçersiz kılmalar                              |
| İşlemler         | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| Oturum davranışı | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| İstemler         | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Güvenlik](/tr/gateway/security)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Çoklu Agent yönlendirme](/tr/concepts/multi-agent)
- [Sorun giderme](/tr/channels/troubleshooting)
