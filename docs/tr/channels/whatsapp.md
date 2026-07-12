---
read_when:
    - WhatsApp/web kanal davranışı veya gelen kutusu yönlendirmesi üzerinde çalışma
summary: WhatsApp kanal desteği, erişim denetimleri, teslimat davranışı ve operasyonlar
title: WhatsApp
x-i18n:
    generated_at: "2026-07-12T11:31:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f416d2b7a75e9c4798ded34a1ec5d9d7f49ab99a56977f1383347936fe47af55
    source_path: channels/whatsapp.md
    workflow: 16
---

Durum: WhatsApp Web (Baileys) üzerinden üretime hazır. Bağlı oturumların sahipliği Gateway'e aittir; ayrı bir Twilio WhatsApp kanalı yoktur.

## Kurulum

`openclaw onboard` ve `openclaw channels add --channel whatsapp`, kanalı ilk seçtiğinizde Plugin'i yüklemenizi ister; Plugin eksikse `openclaw channels login --channel whatsapp` da aynı yükleme akışını sunar. Geliştirme çalışma kopyaları yerel Plugin yolunu kullanır; kararlı/beta kurulumları önce ClawHub'dan `@openclaw/whatsapp` paketini yükler, bu başarısız olursa npm'e başvurur. WhatsApp çalışma zamanı, temel OpenClaw npm paketinin dışında dağıtıldığından çalışma zamanı bağımlılıkları harici Plugin ile birlikte kalır. Manuel kurulum:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Çıplak npm paketini (`@openclaw/whatsapp`) yalnızca kayıt defteri geri dönüşü için kullanın; tam sürümü yalnızca tekrarlanabilir bir kurulum için sabitleyin.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bilinmeyen göndericiler için varsayılan DM politikası eşleştirmedir.
  </Card>
  <Card title="Kanal sorunlarını giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım kılavuzları.
  </Card>
  <Card title="Gateway yapılandırması" icon="settings" href="/tr/gateway/configuration">
    Eksiksiz kanal yapılandırma kalıpları ve örnekleri.
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

    Oturum açma yalnızca QR ile yapılır. Uzak veya ekransız ana makinelerde oturum açmayı başlatmadan önce canlı QR'ı telefona güvenilir biçimde ulaştırabileceğiniz bir yöntem hazırlayın; terminalde görüntülenen QR'ların, ekran görüntülerinin veya sohbet eklerinin geçerlilik süresi aktarım sırasında dolabilir.

    Belirli bir hesap için:

```bash
openclaw channels login --channel whatsapp --account work
```

    Oturum açmadan önce mevcut/özel bir kimlik doğrulama dizini bağlamak için:

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

    Eşleştirme isteklerinin süresi 1 saat sonra dolar; bekleyen istekler hesap başına 3 ile sınırlıdır.

  </Step>
</Steps>

<Note>
Ayrı bir WhatsApp numarası önerilir (kurulum ve meta veriler buna göre optimize edilmiştir), ancak kişisel numara/kendi kendine sohbet kurulumları tamamen desteklenir.
</Note>

## Dağıtım kalıpları

<AccordionGroup>
  <Accordion title="Ayrılmış numara (önerilir)">
    - OpenClaw için ayrı WhatsApp kimliği
    - daha anlaşılır DM izin listeleri ve yönlendirme sınırları
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

  <Accordion title="Kişisel numaraya geri dönüş">
    İlk katılım, kişisel numara modunu destekler ve kendi kendine sohbete uygun bir temel yapılandırma yazar: `dmPolicy: "allowlist"`, kendi numaranızı içeren `allowFrom`, `selfChatMode: true`. Çalışma zamanındaki kendi kendine sohbet korumaları, bağlı kişisel numara ile `allowFrom` değerini temel alır.
  </Accordion>
</AccordionGroup>

## Çalışma zamanı modeli

- WhatsApp soketinin ve yeniden bağlanma döngüsünün sahipliği Gateway'e aittir.
- Bir gözetleyici iki sinyali bağımsız olarak izler: ham WhatsApp Web aktarım etkinliği ve uygulama mesajı etkinliği. Sessiz ancak bağlı bir oturum, yalnızca yakın zamanda mesaj gelmediği için yeniden başlatılmaz; yalnızca aktarım çerçeveleri sabit bir dahili süre boyunca (kullanıcı tarafından yapılandırılamaz) gelmezse veya uygulama mesajları normal mesaj zaman aşımının 4 katını aşacak kadar sessiz kalırsa yeniden bağlanmaya zorlanır. Yakın zamanda etkin olan bir oturum yeniden bağlandıktan hemen sonra ilk zaman aralığında 4 katlık süre yerine daha kısa olan normal mesaj zaman aşımı kullanılır. OpenClaw, Baileys'in bu yeniden bağlanmanın erken aşamasında teslim ettiği çevrimdışı mesajları, gelen mesaj kimliği tekilleştirme ömrüyle sınırlı olmak üzere otomatik yanıtlayabilir; ilk başlatmada kısa eski geçmiş koruması korunur.
- Baileys soket zamanlamaları `web.whatsapp.*` altında açıkça belirtilir: `keepAliveIntervalMs` (uygulama ping aralığı), `connectTimeoutMs` (başlangıç el sıkışması zaman aşımı), `defaultQueryTimeoutMs` (Baileys sorgu beklemelerinin yanı sıra OpenClaw'ın giden gönderim/durum ve gelen okundu bilgisi zaman aşımları).
- Giden gönderimler, hedef hesap için etkin bir WhatsApp dinleyicisi gerektirir; aksi durumda gönderimler hemen başarısız olur.
- Grup gönderimleri, belirteç mevcut katılımcı meta verileriyle eşleştiğinde metin ve medya açıklamalarındaki `@+<digits>` ve `@<digits>` belirteçlerine, LID destekli gruplar da dahil olmak üzere yerel bahsetme meta verileri ekler.
- Durum ve yayın sohbetleri (`@status`, `@broadcast`) yok sayılır.
- Doğrudan sohbetler DM oturum kurallarını kullanır (`session.dmScope`; varsayılan `main`, DM'leri ajanın ana oturumunda birleştirir). Grup oturumları JID başına yalıtılır (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Kanalları/Bültenleri, DM anlamlandırması yerine kanal oturumu meta verileri (`agent:<agentId>:whatsapp:channel:<jid>`) kullanılarak yerel `@newsletter` JID'leri üzerinden açık giden hedefler olabilir.
- WhatsApp Web aktarımı, Gateway ana makinesindeki standart proxy ortam değişkenlerini (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`, küçük harfli çeşitleri) dikkate alır. Kanal başına ayarlar yerine ana makine düzeyinde proxy yapılandırmasını tercih edin.
- `messages.removeAckAfterReply` etkinleştirildiğinde OpenClaw, görünür bir yanıt teslim edildikten sonra onay tepkisini temizler.

## MeowCaller ile mevcut istekte bulunan kişiyi arayın (deneysel)

Plugin, WhatsApp kaynaklı ajan dönüşlerinde `whatsapp_call` aracını sunabilir. [MeowCaller](https://github.com/purpshell/meowcaller) kullanarak mevcut yetkili istekte bulunan kişiye WhatsApp sesli araması yapar ve kişi yanıt verdikten sonra bir OpenClaw TTS mesajı oynatır. Araçta hedef numara parametresi bulunmadığından bir istem aramayı başka bir yere yönlendiremez. Varsayılan olarak devre dışıdır.

<Warning>
MeowCaller deneyseldir, etiketlenmiş bir sürümü yoktur ve ayrı olarak eşleştirilmiş bir whatsmeow bağlı cihaz oturumu kullanır; Plugin'in Baileys kimlik bilgilerini yeniden kullanamaz. Eşleştirme, aynı WhatsApp hesabına başka bir bağlı cihaz ekler; OpenClaw tarafından kullanılan kimlikle tarayın. Kişisel numara/kendi kendine sohbet modu kendisini arayamaz; kişisel numaranızı aramak için ayrılmış bir OpenClaw numarası kullanın.
</Warning>

<Steps>
  <Step title="Deneysel aramaları etkinleştirin">

    WhatsApp kanal yapılandırmasına `actions.calls: true` ekleyin ve Gateway'i yeniden başlatın:

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

    Değer yoksa veya `false` ise OpenClaw, `whatsapp_call` aracını sunmaz.

  </Step>

  <Step title="İncelenmiş MeowCaller CLI'ını yükleyin">

    Bağdaştırıcı, Gateway ana makinesinin `PATH` değişkeninde bir `meowcaller` yürütülebilir dosyası olmasını bekler. [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) birleştirilene kadar incelenmiş dalı derleyin:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    `$HOME/.local/bin` dizininin Gateway hizmetinin `PATH` değişkeninde bulunduğundan emin olun. Bu revizyonda açık `pair` ve yalnızca gönderim yapan `notify` komutları bulunur; `notify` herhangi bir mikrofonu, hoparlörü, video cihazını veya tanılama kaydını açmaz. Yukarı akış örnek CLI'ındaki `play` komutunu bunun yerine kullanmayın.

  </Step>

  <Step title="MeowCaller bağlı cihazını eşleştirin">

    WhatsApp ajanından arama kurulumunu kontrol etmesini isteyin (`whatsapp_call` durum eylemi, hesaba özgü durum dizinini ve eşleştirme komutunu bildirir). Varsayılan hesap için:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Bunu etkileşimli olarak çalıştırın, QR'ı **WhatsApp > Linked devices** üzerinden tarayın ve `MeowCaller linked device ready` iletisini bekleyin. `wa-voip.db` dosyasını gizli tutun; bu, MeowCaller oturumudur. Varsayılan olmayan hesaplar, durum eyleminden kendi depolama yollarını alır; Windows'ta ilgili PowerShell komutunu çalıştırın.

  </Step>

  <Step title="TTS'yi yapılandırın ve WhatsApp'tan arama yapın">

    Telefon görüşmelerine uygun bir [TTS sağlayıcısı](/tr/tools/tts) yapılandırın, Gateway'i yeniden başlatın ve ardından `Call me and say the build finished.` gibi bir istek gönderin. Araç, göndericiyi güvenilir gelen bağlamdan çözümler, geçici ve özel bir WAV dosyası sentezler, MeowCaller'ı sınırlı bir arama süresi boyunca çalıştırır ve sonrasında ses dosyasını siler. OpenClaw, hesabın deposunu açıkça iletir; yanıt/oynatma/kapatma sonrasında sıfır çıkış durumunu bekler ve zaman aşımını veya sıfır olmayan çıkışı başarısız bir araç çağrısı olarak değerlendirir.

  </Step>
</Steps>

Sınırlar: yalnızca bire bir giden sesli aramalar, rastgele hedef numara yok, sohbet bağlantısıyla paylaşılan kimlik doğrulaması yok, kişisel numara/kendi kendine sohbet modundan kişinin kendisini araması yok, sentezlenen ses en fazla 60 saniye, MeowCaller'ın yanıt/oynatma/kapatma tamamlanması dışında telefon tarafında duyulabilirlik alındısı yoktur ve OpenClaw, yardımcı işlemi MeowCaller'ın bağlantı, yanıt, oynatma ve kapatma aşamalarını kapsayan 115-175 saniyelik sınırlı bir sürenin ardından durdurur.

## Onay istemleri

WhatsApp, üst düzey onay yönlendirme yapılandırmasıyla kontrol edilen çalıştırma ve Plugin onay istemlerini `👍`/`👎` tepkileri olarak gösterebilir:

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

`approvals.exec` ve `approvals.plugin` birbirinden bağımsızdır; WhatsApp'ı kanal olarak etkinleştirmek yalnızca aktarımı bağlar ve eşleşen onay ailesi etkinleştirilip oraya yönlendirilmediği sürece hiçbir şey göndermez. Oturum modu, yerel emoji onaylarını yalnızca WhatsApp kaynaklı onaylara teslim eder. Hedef modu, açık hedefler için paylaşılan yönlendirme işlem hattını kullanır ve onaylayıcı DM'lerine ayrı bir dağıtım oluşturmaz.

WhatsApp onay tepkileri, `allowFrom` (veya `"*"`) içinde açıkça belirtilmiş onaylayıcılar gerektirir. `defaultTo`, onaylayıcı listesini değil sıradan varsayılan mesaj hedeflerini belirler. Manuel `/approve` komutları, onay çözümlenmeden önce normal WhatsApp gönderici yetkilendirme yolundan geçmeye devam eder.

## Plugin kancaları ve gizlilik

Gelen WhatsApp mesajları kişisel içerik, telefon numaraları, grup tanımlayıcıları, gönderici adları ve oturum ilişkilendirme alanları içerebilir. Siz açıkça etkinleştirmediğiniz sürece WhatsApp, gelen `message_received` kanca yüklerini Plugin'lere yayınlamaz:

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

Etkinleştirmeyi `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived` altında tek bir hesapla sınırlandırın. Bunu yalnızca gelen WhatsApp içeriği ve tanımlayıcıları konusunda güvendiğiniz Plugin'ler için etkinleştirin.

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

    `allowFrom`, E.164 biçimindeki numaraları kabul eder (dahili olarak normalleştirilir). Yalnızca bir DM göndericisi erişim denetimi listesidir; grup JID'lerine veya `@newsletter` kanal JID'lerine yapılan açık giden gönderimleri kısıtlamaz.

    Çok hesaplı geçersiz kılma: `channels.whatsapp.accounts.<id>.dmPolicy` (ve `.allowFrom`), ilgili hesap için kanal düzeyindeki varsayılanlardan önceliklidir.

    Çalışma zamanı notları:

    - eşleştirmeler kanalın izin deposunda kalıcıdır ve yapılandırılmış `allowFrom` ile birleştirilir
    - zamanlanmış otomasyon ve Heartbeat alıcısı geri dönüşü, açık teslimat hedeflerini veya yapılandırılmış `allowFrom` değerini kullanır; doğrudan mesaj eşleştirme onayları örtük Cron/Heartbeat alıcıları değildir
    - hiçbir izin listesi yapılandırılmamışsa bağlı kişisel numaraya varsayılan olarak izin verilir
    - OpenClaw, giden `fromMe` doğrudan mesajlarını (bağlı cihazdan kendinize gönderdiğiniz mesajları) hiçbir zaman otomatik olarak eşleştirmez

  </Tab>

  <Tab title="Grup politikası ve izin listeleri">
    Grup erişiminin iki katmanı vardır:

    1. **Grup üyeliği izin listesi** (`channels.whatsapp.groups`): `groups` belirtilmezse tüm gruplar uygundur; mevcutsa grup izin listesi işlevi görür (`"*"` tümünü kabul eder).
    2. **Grup gönderen politikası** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` gönderen izin listesini atlar, `allowlist` bir `groupAllowFrom` (veya `*`) eşleşmesi gerektirir, `disabled` gruplardan gelen tüm iletileri engeller.

    `groupAllowFrom` ayarlanmamışsa ve `allowFrom` girdiler içeriyorsa gönderen denetimleri `allowFrom` değerine geri döner. Gönderen izin listeleri, bahsetme/yanıt etkinleştirmesinden önce değerlendirilir.

    Hiç `channels.whatsapp` bloğu yoksa çalışma zamanı, `channels.defaults.groupPolicy` başka bir değere ayarlanmış olsa bile `groupPolicy: "allowlist"` değerine geri döner (bir uyarı günlüğüyle).

    <Note>
    Grup üyeliği çözümlemesinde tek hesaplı bir güvenlik ağı vardır: yalnızca bir WhatsApp hesabı yapılandırılmışsa ve bu hesabın `accounts.<id>.groups` değeri açıkça boş bir nesneyse (`{}`), bu değer "ayarlanmamış" kabul edilir ve her grubu sessizce engellemek yerine kökteki `channels.whatsapp.groups` eşlemesine geri dönülür. 2 veya daha fazla hesap yapılandırıldığında, açıkça boş bir hesap eşlemesi boş kalır ve geri dönüş yapılmaz; bu, bir hesabın diğer hesapları etkilemeden tüm grupları kasıtlı olarak devre dışı bırakmasını sağlar.
    </Note>

  </Tab>

  <Tab title="Bahsetmeler ve /activation">
    Grup yanıtları varsayılan olarak bahsetme gerektirir. Bahsetme algılaması şunları kapsar:

    - bot kimliğinden açıkça bahseden WhatsApp bahsetmeleri
    - yapılandırılmış bahsetme regex kalıpları (`agents.list[].groupChat.mentionPatterns`, geri dönüş olarak `messages.groupChat.mentionPatterns`)
    - yetkilendirilmiş grup mesajlarına ait gelen sesli not dökümleri
    - örtük bota-yanıt algılaması (yanıt göndereni bot kimliğiyle eşleşir)

    Güvenlik: alıntı/yanıt yalnızca bahsetme geçidini karşılar; gönderen yetkilendirmesi **sağlamaz**. `groupPolicy: "allowlist"` kullanıldığında, izin listesinde olmayan gönderenler izin listesindeki bir kullanıcının mesajına yanıt verseler bile engellenmeye devam eder.

    Oturum düzeyinde etkinleştirme komutu: `/activation mention` veya `/activation always`. Bu, oturum durumunu günceller (genel yapılandırmayı değil) ve yalnızca sahip tarafından kullanılabilir.

  </Tab>
</Tabs>

## Yapılandırılmış ACP bağlamaları

WhatsApp, üst düzey `bindings[]` aracılığıyla kalıcı ACP bağlamalarını destekler:

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

Doğrudan sohbetler E.164 numaralarıyla, gruplar ise WhatsApp grup JID'leriyle eşleşir. Grup izin listeleri, gönderen politikası ve bahsetme/etkinleştirme geçidi, OpenClaw bağlı ACP oturumunun varlığını sağlamadan önce çalışır. Eşleşen bağlama yönlendirmenin sahibidir; yayın grupları bu turu sıradan WhatsApp oturumlarına dağıtmaz.

## Kişisel numara ve kendi kendine sohbet davranışı

Bağlı kişisel numara `allowFrom` içinde de bulunduğunda kendi kendine sohbet korumaları etkinleşir: kendi kendine sohbet turlarında okundu bilgileri atlanır, kendinize bildirim gönderecek bahsetme JID'si otomatik tetikleme davranışı yok sayılır ve `messages.responsePrefix` ayarlanmamışsa yanıtlar varsayılan olarak `[{identity.name}]` (veya `[openclaw]`) ile başlar.

## Mesaj normalleştirme ve bağlam

<AccordionGroup>
  <Accordion title="Gelen zarf ve yanıt bağlamı">
    Gelen mesajlar paylaşılan gelen zarfla sarmalanır. Alıntılı bir yanıt, bağlamı şu biçimde ekler:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Kullanılabilir olduğunda yanıt meta verileri (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, gönderen JID'si/E.164) doldurulur. Alıntılanan hedef indirilebilir bir medyaysa OpenClaw bunu normal gelen medya deposu aracılığıyla kaydeder ve ajanın yalnızca `<media:image>` görmek yerine doğrudan inceleyebilmesi için `MediaPath`/`MediaType` değerlerini sunar.

  </Accordion>

  <Accordion title="Medya yer tutucuları ve konum/kişi çıkarımı">
    Yalnızca medya içeren mesajlar şu yer tutuculara normalleştirilir: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Gövde yalnızca `<media:audio>` olduğunda, yetkilendirilmiş grup sesli notları bahsetme geçidinden önce yazıya dökülür; böylece sesli notta botun adını söylemek yanıtı tetikleyebilir. Döküm hâlâ bottan bahsetmiyorsa ham yer tutucu yerine bekleyen grup geçmişinde kalır.

    Konum gövdeleri kısa koordinat metni olarak görüntülenir. Konum etiketleri/yorumları ve kişi/vCard ayrıntıları, satır içi istem metni olarak değil, kod çitiyle çevrelenmiş güvenilmeyen meta veriler olarak görüntülenir.

  </Accordion>

  <Accordion title="Bekleyen grup geçmişinin eklenmesi">
    İşlenmemiş grup mesajları arabelleğe alınır ve bot sonunda tetiklendiğinde bağlam olarak eklenir.

    - varsayılan sınır: `50`
    - yapılandırma: `channels.whatsapp.historyLimit`, geri dönüş olarak `messages.groupChat.historyLimit`
    - `0` devre dışı bırakır

    Ekleme işaretçileri: `[Chat messages since your last reply - for context]` ve `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="Okundu bilgileri">
    Kabul edilen gelen mesajlar için varsayılan olarak etkindir. Genel olarak devre dışı bırakmak için:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Hesap başına geçersiz kılma: `channels.whatsapp.accounts.<id>.sendReadReceipts`. Genel olarak etkin olsa bile kendi kendine sohbet turlarında okundu bilgileri atlanır.

  </Accordion>
</AccordionGroup>

## Teslimat, parçalara ayırma ve medya

<AccordionGroup>
  <Accordion title="Metni parçalara ayırma">
    - varsayılan parça sınırı: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`; `newline` paragraf sınırlarını (boş satırları) tercih eder, ardından uzunluk açısından güvenli parçalara ayırmaya geri döner

  </Accordion>

  <Accordion title="Giden medya davranışı">
    - görüntü, video, ses (PTT sesli not) ve belge yüklerini destekler
    - ses, `ptt: true` ile Baileys `audio` yükü olarak gönderilir ve bas-konuş sesli notu şeklinde görüntülenir; sağlayıcının kaynak biçiminden bağımsız olarak TTS sesli not çıktısının bu yolda kalması için `audioAsVoice` yanıt yüklerinde korunur
    - yerel Ogg/Opus sesi `audio/ogg; codecs=opus` olarak gönderilir; diğer her şey (Microsoft Edge TTS MP3/WebM çıktısı dahil), PTT teslimatından önce `ffmpeg` ile 48 kHz mono Ogg/Opus biçimine dönüştürülür
    - `/tts latest`, en son asistan yanıtını tek bir sesli not olarak gönderir ve aynı yanıtın tekrar gönderilmesini engeller; `/tts chat on|off|default`, geçerli sohbet için otomatik TTS'yi denetler
    - video gönderimlerinde `gifPlayback: true`, animasyonlu GIF oynatmayı etkinleştirir
    - `forceDocument`/`asDocument`, WhatsApp'ın medya sıkıştırmasını önlemek için giden görüntüleri, GIF'leri ve videoları Baileys belge yükü üzerinden yönlendirerek çözümlenen dosya adını ve MIME türünü korur
    - açıklamalar, çoklu medya yanıtındaki ilk medya öğesine uygulanır; PTT sesli notları bunun dışındadır: ses önce açıklamasız gönderilir, ardından açıklama ayrı bir metin mesajı olarak gönderilir (WhatsApp istemcileri sesli not açıklamalarını tutarlı biçimde görüntülemez)
    - medya kaynağı HTTP(S), `file://` veya yerel bir yol olabilir

  </Accordion>

  <Accordion title="Medya boyutu sınırları ve geri dönüş davranışı">
    - gelen kaydetme üst sınırı ve giden gönderme üst sınırı: `channels.whatsapp.mediaMaxMb` (varsayılan `50`)
    - hesap başına geçersiz kılma: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - `forceDocument`/`asDocument` belge teslimatı istemediği sürece görüntüler sınırlara uymak için otomatik olarak optimize edilir (yeniden boyutlandırma/kalite taraması)
    - medya gönderimi başarısız olduğunda, ilk öğe için geri dönüş yanıtı sessizce bırakmak yerine metin uyarısı gönderir

  </Accordion>
</AccordionGroup>

## Yanıt alıntılama

`channels.whatsapp.replyToMode`, yerel yanıt alıntılamayı denetler (giden yanıtlar gelen mesajı görünür biçimde alıntılar):

| Değer             | Davranış                                                       |
| ----------------- | -------------------------------------------------------------- |
| `"off"` (varsayılan) | Hiçbir zaman alıntılama; düz mesaj olarak gönder             |
| `"first"`         | Yalnızca ilk giden yanıt parçasını alıntıla                    |
| `"all"`           | Her giden yanıt parçasını alıntıla                             |
| `"batched"`       | Kuyruğa alınmış toplu yanıtları alıntıla; anlık yanıtları alıntısız bırak |

Hesap başına geçersiz kılma: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Tepki düzeyi

`channels.whatsapp.reactionLevel`, ajanın emoji tepkilerini ne ölçüde kullandığını denetler:

| Düzey                 | Alındı tepkileri | Ajanın başlattığı tepkiler  |
| --------------------- | ---------------- | --------------------------- |
| `"off"`               | Hayır            | Hayır                       |
| `"ack"`               | Evet             | Hayır                       |
| `"minimal"` (varsayılan) | Evet          | Evet, ölçülü kullanım       |
| `"extensive"`         | Evet             | Evet, teşvik edilen kullanım |

Hesap başına geçersiz kılma: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Alındı tepkileri

`channels.whatsapp.ackReaction`, gelen ileti alındığında `reactionLevel` tarafından denetlenen anlık bir tepki gönderir (`"off"` olduğunda bastırılır):

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

Notlar: gelen ileti kabul edildikten hemen sonra (yanıttan önce) gönderilir; `ackReaction`, `emoji` olmadan mevcutsa WhatsApp yönlendirilen ajanın kimlik emojisini kullanır ve bulunamazsa "👀" değerine geri döner (alındı tepkisi olmaması için `ackReaction` değerini belirtmeyin veya `emoji: ""` ayarlayın); hatalar günlüğe kaydedilir ancak yanıt teslimatını engellemez; `mentions` grup modu yalnızca bahsetmeyle tetiklenen turlarda tepki verirken `always` grup etkinleştirmesi bu denetimi atlar; WhatsApp yalnızca `channels.whatsapp.ackReaction` değerini kullanır (eski `messages.ackReaction` burada geçerli değildir).

## Yaşam döngüsü durum tepkileri

WhatsApp'ın bir tur sırasında sabit bir alındı emojisi bırakmak yerine alındı tepkisini kuyrukta, düşünüyor, araç etkinliği, Compaction, tamamlandı ve hata gibi durumlar arasında geçiş yaparak değiştirmesine izin vermek için `messages.statusReactions.enabled: true` ayarlayın:

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

Notlar: `channels.whatsapp.ackReaction`, doğrudan mesajlar ve gruplar için uygunluğu denetlemeye devam eder; kuyrukta durumu, düz alındı tepkileriyle aynı geçerli emojiyi kullanır; WhatsApp'ta mesaj başına bir bot tepki yuvası bulunduğundan yaşam döngüsü güncellemeleri geçerli tepkiyi yerinde değiştirir; `messages.removeAckAfterReply: true`, yapılandırılmış tamamlandı/hata bekleme süresinden sonra son durum tepkisini temizler; araç emoji kategorileri `tool`, `coding`, `web`, `deploy`, `build` ve `concierge` değerlerini içerir.

## Birden çok hesap ve kimlik bilgileri

<AccordionGroup>
  <Accordion title="Hesap seçimi ve varsayılanlar">
    Hesap kimlikleri `channels.whatsapp.accounts` içinden gelir. Varsayılan hesap seçimi, mevcutsa `default`; aksi takdirde yapılandırılmış ilk hesap kimliğidir (alfabetik olarak sıralanır). Hesap kimlikleri arama için dahili olarak normalleştirilir.
  </Accordion>

  <Accordion title="Kimlik bilgisi yolları ve eski sürüm uyumluluğu">
    - geçerli kimlik doğrulama yolu: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (yedek: `creds.json.bak`)
    - `~/.openclaw/credentials/` içindeki eski varsayılan kimlik doğrulama hâlâ tanınır ve varsayılan hesap akışları için taşınır

  </Accordion>

  <Accordion title="Oturumu kapatma davranışı">
    `openclaw channels logout --channel whatsapp [--account <id>]`, ilgili hesabın WhatsApp kimlik doğrulama durumunu temizler. Bir gateway erişilebilir durumdaysa oturum kapatma işlemi önce ilgili hesabın etkin dinleyicisini durdurur; böylece bağlı oturum, bir sonraki yeniden başlatmadan önce mesaj almayı bırakır. `openclaw channels remove --channel whatsapp` da hesap yapılandırmasını devre dışı bırakmadan veya silmeden önce etkin dinleyiciyi durdurur.

    Eski kimlik doğrulama dizinlerinde Baileys kimlik doğrulama dosyaları kaldırılırken `oauth.json` korunur.

  </Accordion>
</AccordionGroup>

## Araçlar, eylemler ve yapılandırma yazımları

- Aracı araç desteği, WhatsApp tepki eylemini (`react`) içerir.
- Eylem geçitleri: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (mevcut eylemler varsayılan olarak `true`), `channels.whatsapp.actions.calls` (varsayılan `false`; yukarıdaki MeowCaller bölümüne bakın).
- Kanal tarafından başlatılan yapılandırma yazımları varsayılan olarak etkindir; `channels.whatsapp.configWrites: false` ile devre dışı bırakın.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Bağlı değil (QR gerekli)">
    Belirti: kanal durumu, bağlantı kurulmadığını bildirir.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="Bağlı ancak bağlantı kesiliyor / yeniden bağlanma döngüsü">
    Belirti: bağlı hesapta tekrarlanan bağlantı kesilmeleri veya yeniden bağlanma girişimleri görülür.

    Sessiz hesaplar normal mesaj zaman aşımından daha uzun süre bağlı kalabilir; izleme mekanizması yalnızca WhatsApp Web aktarım etkinliği durduğunda, soket kapandığında veya uygulama düzeyindeki etkinlik daha uzun güvenlik penceresi boyunca sessiz kaldığında yeniden başlatır (yukarıdaki Çalışma zamanı modeli bölümüne bakın).

    Günlüklerde tekrar tekrar `status=408 Request Time-out Connection was lost` gösteriliyorsa `web.whatsapp` altındaki Baileys soket zamanlamalarını ayarlayın. Önce `keepAliveIntervalMs` değerini ağınızın boşta kalma zaman aşımının altına düşürün ve yavaş veya kayıplı bağlantılarda `connectTimeoutMs` değerini artırın:

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

    `~/.openclaw/logs/whatsapp-health.log` dosyasında `Gateway inactive` yazmasına rağmen hem `openclaw gateway status` hem de `openclaw channels status --probe` sağlıklı durum gösteriyorsa `openclaw doctor` komutunu çalıştırın. Linux'ta doctor, kullanımdan kaldırılan `~/.openclaw/bin/ensure-whatsapp.sh` betiğini çağıran eski crontab girdileri hakkında uyarır; bu girdileri `crontab -e` ile kaldırın — Cron, systemd kullanıcı veri yolu ortamından yoksun olabilir ve eski betiğin Gateway sağlığını yanlış bildirmesine neden olabilir.

  </Accordion>

  <Accordion title="Proxy arkasında QR oturum açma zaman aşımına uğruyor">
    Belirti: `openclaw channels login --channel whatsapp`, kullanılabilir bir QR göstermeden önce `status=408 Request Time-out` veya TLS soket bağlantısının kesilmesiyle başarısız olur.

    WhatsApp Web oturum açma işlemi, Gateway ana makinesinin standart proxy ortamını (`HTTPS_PROXY`, `HTTP_PROXY`, küçük harfli değişkenleri, `NO_PROXY`) kullanır. Gateway işleminin proxy ortamını devraldığını ve `NO_PROXY` değerinin `mmg.whatsapp.net` ile eşleşmediğini doğrulayın.

  </Accordion>

  <Accordion title="Gönderim sırasında etkin dinleyici yok">
    Hedef hesap için etkin bir Gateway dinleyicisi yoksa giden gönderimler hızla başarısız olur. Gateway'in çalıştığını ve hesabın bağlı olduğunu doğrulayın.
  </Accordion>

  <Accordion title="Yanıt dökümde görünüyor ancak WhatsApp'ta görünmüyor">
    Döküm satırları aracının ne ürettiğini kaydeder; WhatsApp teslimatı ayrı olarak denetlenir. OpenClaw, otomatik yanıtı yalnızca Baileys en az bir görünür metin veya medya gönderimi için giden mesaj kimliği döndürdükten sonra gönderilmiş sayar.

    Alındı tepkileri, yanıt öncesinde gönderilen bağımsız alındı bildirimleridir — başarılı bir tepki, sonraki metin/medya yanıtının kabul edildiğini kanıtlamaz. Gateway günlüklerinde `auto-reply delivery failed` veya `auto-reply was not accepted by WhatsApp provider` ifadelerini arayın.

  </Accordion>

  <Accordion title="Grup mesajları beklenmedik biçimde yok sayılıyor">
    Şu sırayla denetleyin: `groupPolicy`, `groupAllowFrom`/`allowFrom`, `groups` izin listesi girdileri, bahsetme geçidi (`requireMention` + bahsetme kalıpları) ve `openclaw.json` içindeki yinelenen anahtarlar (JSON5'te sonraki girdiler öncekileri geçersiz kılar — her kapsamda yalnızca bir `groupPolicy` bulundurun).

    `channels.whatsapp.groups` mevcutsa WhatsApp diğer gruplardan gelen mesajları yine de gözlemleyebilir, ancak OpenClaw bunları oturum yönlendirmesinden önce bırakır. Grup JID'sini `channels.whatsapp.groups` öğesine ekleyin veya gönderen yetkilendirmesini `groupPolicy`/`groupAllowFrom` altında tutarken tüm grupları kabul etmek için `groups["*"]` ekleyin.

  </Accordion>

  <Accordion title="Bun çalışma zamanı uyarısı">
    WhatsApp Gateway çalışma zamanı Node kullanmalıdır. Bun, kararlı WhatsApp/Telegram Gateway çalışmasıyla uyumsuz olarak işaretlenmiştir.
  </Accordion>
</AccordionGroup>

## Sistem istemleri

WhatsApp, `groups` ve `direct` eşlemeleri üzerinden gruplar ve doğrudan sohbetler için Telegram tarzı sistem istemlerini destekler.

Grup mesajlarının çözümlenmesi: Önce etkin `groups` eşlemesi belirlenir — hesap kendi `groups` anahtarını herhangi bir şekilde tanımlıyorsa kök `groups` eşlemesini tamamen değiştirir (derin birleştirme yapılmaz). Ardından istem araması, ortaya çıkan bu tek eşleme üzerinde çalışır:

1. **Gruba özgü istem** (`groups["<groupId>"].systemPrompt`): grup girdisi mevcut olduğunda **ve** `systemPrompt` anahtarı tanımlandığında kullanılır. Boş dize (`""`) joker karakteri baskılar ve hiçbir istem uygulamaz.
2. **Grup joker karakter istemi** (`groups["*"].systemPrompt`): belirli grup girdisi bulunmadığında veya `systemPrompt` anahtarı olmadan bulunduğunda kullanılır.

Doğrudan mesajların çözümlenmesi, `direct` eşlemesi ve `direct["*"]` üzerinde aynı kalıbı izler.

<Note>
`dms`, DM başına hafif geçmiş geçersiz kılma grubu (`dms.<id>.historyLimit`) olarak kalır. İstem geçersiz kılmaları `direct` altında bulunur.
</Note>

<Note>
İstem çözümlemesinde hesabın kökün yerini alması davranışı, basit bir sığ geçersiz kılmadır: açıkça belirtilmiş boş bir nesne dâhil olmak üzere herhangi bir hesap `groups`/`direct` anahtarı, kök eşlemenin yerini alır. Bu davranış, yukarıda açıklanan ve yanlışlıkla boş bırakılmış bir `groups: {}` için tek hesaplı bir güvenlik ağı bulunan grup üyeliği izin listesi denetiminden farklıdır.
</Note>

**Telegram'dan farkı:** Telegram, çok hesaplı bir kurulumda botun üyesi olmadığı gruplardan grup mesajları almasını engellemek için her hesapta kök `groups` öğesini baskılar (kendi `groups` öğesi olmayan hesaplarda bile). WhatsApp bu korumayı uygulamaz — hesap sayısından bağımsız olarak, kendi geçersiz kılması olmayan her hesap kök `groups`/`direct` öğelerini devralır. Çok hesaplı bir WhatsApp kurulumunda hesap başına istemler istiyorsanız tam eşlemeyi her hesabın altında açıkça tanımlayın.

Önemli davranış:

- `channels.whatsapp.groups`, hem grup başına yapılandırma eşlemesi hem de sohbet düzeyindeki grup izin listesidir. Kök veya hesap kapsamında `groups["*"]`, ilgili kapsam için "tüm gruplar kabul edilir" anlamına gelir.
- Yalnızca ilgili kapsamın tüm grupları kabul etmesini zaten istiyorsanız joker karakterli bir `systemPrompt` ekleyin. Yalnızca sabit bir grup kimliği kümesini uygun tutmak için `groups["*"]` kullanmak yerine istemi açıkça izin verilen her girdide yineleyin.
- Grup kabulü ile gönderen yetkilendirmesi ayrı denetimlerdir. `groups["*"]`, grup işlemeye ulaşan grupların kapsamını genişletir; bu gruplardaki her gönderene yetki vermez — bu, `groupPolicy`/`groupAllowFrom` tarafından denetlenmeye devam eder.
- `channels.whatsapp.direct` öğesinin DM'ler için eşdeğer bir yan etkisi yoktur: `direct["*"]`, yalnızca bir DM `dmPolicy` ile `allowFrom` veya eşleştirme deposu kuralları tarafından zaten kabul edildikten sonra varsayılan yapılandırma sağlar.

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
            // Bu hesap kendi groups öğesini tanımladığından kök groups öğesinin
            // yerini tamamen alır. Joker karakteri korumak için "*" öğesini burada da açıkça tanımlayın.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Proje yönetimine odaklan.",
            },
            // Yalnızca tüm grupların bu hesapta kabul edilmesi gerekiyorsa kullanın.
            "*": { systemPrompt: "İş grupları için varsayılan istem." },
          },
          direct: {
            // Bu hesap kendi direct eşlemesini tanımladığından kök direct girdilerinin
            // yerini tamamen alır. Joker karakteri korumak için "*" öğesini burada da açıkça tanımlayın.
            "+15551234567": { systemPrompt: "Belirli bir iş doğrudan sohbeti için istem." },
            "*": { systemPrompt: "Doğrudan iş sohbetleri için varsayılan istem." },
          },
        },
      },
    },
  },
}
```

## Yapılandırma başvurusu yönlendirmeleri

Birincil başvuru: [Yapılandırma başvurusu - WhatsApp](/tr/gateway/config-channels#whatsapp)

| Alan             | Alanlar                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| Erişim           | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| Teslimat         | `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`                |
| Çoklu hesap      | `accounts.<id>.enabled`, `accounts.<id>.authDir` ve hesap başına diğer geçersiz kılmalar                        |
| İşlemler         | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| Oturum davranışı | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| İstemler         | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## İlgili konular

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Güvenlik](/tr/gateway/security)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Çok aracılı yönlendirme](/tr/concepts/multi-agent)
- [Sorun giderme](/tr/channels/troubleshooting)
