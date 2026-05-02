---
read_when:
    - Bir OpenClaw ajanının bir Google Meet çağrısına katılmasını istiyorsunuz
    - OpenClaw ajanının yeni bir Google Meet görüşmesi oluşturmasını istiyorsunuz
    - Chrome, Chrome düğümü veya Twilio'yu Google Meet taşıması olarak yapılandırıyorsunuz
summary: 'Google Meet Plugin: açıkça belirtilen Meet URL''lerine Chrome veya Twilio üzerinden gerçek zamanlı ses varsayılanlarıyla katılın'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-02T20:48:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dc515382d2cc7beacaf18a50b75cb0f4eda3038cfd8efe73ea3ce7b5007bc43
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet katılımcı desteği OpenClaw için tasarım gereği açıktır:

- Yalnızca açıkça verilen bir `https://meet.google.com/...` URL'sine katılır.
- Google Meet API aracılığıyla yeni bir Meet alanı oluşturabilir, ardından
  döndürülen URL'ye katılabilir.
- `realtime` ses varsayılan moddur.
- Gerçek zamanlı ses, daha derin akıl yürütme veya araçlar gerektiğinde tam
  OpenClaw ajanını geri çağırabilir.
- Ajanlar katılma davranışını `mode` ile seçer: canlı dinleme/yanıt verme için
  `realtime`, gerçek zamanlı ses köprüsü olmadan tarayıcıya katılmak/onu kontrol
  etmek için `transcribe` kullanın.
- Kimlik doğrulama, kişisel Google OAuth veya zaten oturum açılmış bir Chrome profili
  olarak başlar.
- Otomatik onay duyurusu yoktur.
- Varsayılan Chrome ses arka ucu `BlackHole 2ch`'dir.
- Chrome yerel olarak veya eşleştirilmiş bir Node ana makinesinde çalışabilir.
- Twilio, arama yapılacak bir numarayı ve isteğe bağlı PIN ya da DTMF dizisini
  kabul eder; doğrudan bir Meet URL'sini arayamaz.
- CLI komutu `googlemeet`'tir; `meet` daha geniş ajan telekonferans iş akışları
  için ayrılmıştır.

## Hızlı başlangıç

Yerel ses bağımlılıklarını kurun ve bir arka uç gerçek zamanlı ses sağlayıcısı
yapılandırın. Varsayılan OpenAI'dır; Google Gemini Live da
`realtime.provider: "google"` ile çalışır:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch`, `BlackHole 2ch` sanal ses aygıtını kurar. Homebrew yükleyicisi,
macOS aygıtı göstermeden önce yeniden başlatma gerektirir:

```bash
sudo reboot
```

Yeniden başlattıktan sonra iki parçayı da doğrulayın:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Plugin'i etkinleştirin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Kurulumu kontrol edin:

```bash
openclaw googlemeet setup
```

Kurulum çıktısı, ajan tarafından okunabilir ve moda duyarlı olacak şekilde
tasarlanmıştır. Chrome profilini, Node sabitlemesini ve gerçek zamanlı Chrome
katılımları için BlackHole/SoX ses köprüsünü ve gecikmeli gerçek zamanlı giriş
kontrollerini raporlar. Yalnızca gözlem amaçlı katılımlar için aynı aktarımı
`--mode transcribe` ile kontrol edin; bu mod, köprü üzerinden dinlemediği veya
konuşmadığı için gerçek zamanlı ses ön koşullarını atlar:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Twilio devri yapılandırıldığında kurulum, `voice-call` Plugin'inin, Twilio
kimlik bilgilerinin ve herkese açık Webhook erişiminin hazır olup olmadığını da
raporlar. Ajanın katılmasını istemeden önce herhangi bir `ok: false` kontrolünü,
kontrol edilen aktarım ve mod için engelleyici olarak ele alın. Betikler veya
makine tarafından okunabilir çıktı için `openclaw googlemeet setup --json`
kullanın. Bir ajan denemeden önce belirli bir aktarımı ön kontrol etmek için
`--transport chrome`, `--transport chrome-node` veya `--transport twilio`
kullanın.

Twilio için, varsayılan aktarım Chrome olduğunda aktarımı her zaman açıkça ön
kontrol edin:

```bash
openclaw googlemeet setup --transport twilio
```

Bu, ajan toplantıyı aramayı denemeden önce eksik `voice-call` bağlantısını,
Twilio kimlik bilgilerini veya erişilemeyen Webhook erişimini yakalar.

Bir toplantıya katılın:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Veya bir ajanın `google_meet` aracı aracılığıyla katılmasına izin verin:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Ajana dönük `google_meet` aracı, macOS olmayan ana makinelerde artifact,
takvim, kurulum, transkripsiyon, Twilio ve `chrome-node` akışları için
kullanılabilir kalır. Yerel Chrome gerçek zamanlı eylemleri orada engellenir,
çünkü paketlenmiş gerçek zamanlı Chrome ses yolu şu anda macOS `BlackHole 2ch`'e
bağlıdır. Linux'ta gerçek zamanlı Chrome katılımı için `mode: "transcribe"`,
Twilio arama girişi veya bir macOS `chrome-node` ana makinesi kullanın.

Yeni bir toplantı oluşturun ve ona katılın:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

API ile oluşturulan odalarda, odanın kapı çalmadan giriş politikasının Google
hesabı varsayılanlarından devralınması yerine açık olmasını istediğinizde Google
Meet `SpaceConfig.accessType` kullanın:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN`, Meet URL'sine sahip herkesin kapı çalmadan katılmasına izin verir.
`TRUSTED`, ana kuruluşun güvenilir kullanıcılarının, davet edilen harici
kullanıcıların ve arama girişi kullanıcılarının kapı çalmadan katılmasına izin
verir. `RESTRICTED`, kapı çalmadan girişi davetlilerle sınırlar. Bu ayarlar
yalnızca resmi Google Meet API oluşturma yolu için geçerlidir, bu nedenle OAuth
kimlik bilgileri yapılandırılmış olmalıdır.

Google Meet kimlik doğrulamasını bu seçenek kullanılabilir olmadan önce
yaptıysanız, Google OAuth onay ekranınıza `meetings.space.settings` kapsamını
ekledikten sonra `openclaw googlemeet auth login --json` komutunu yeniden
çalıştırın.

Yalnızca URL'yi oluşturun, katılmayın:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` iki yola sahiptir:

- API oluşturma: Google Meet OAuth kimlik bilgileri yapılandırıldığında
  kullanılır. Bu en deterministik yoldur ve tarayıcı UI durumuna bağlı değildir.
- Tarayıcı yedeği: OAuth kimlik bilgileri yoksa kullanılır. OpenClaw sabitlenmiş
  Chrome Node'u kullanır, `https://meet.google.com/new` adresini açar,
  Google'ın gerçek bir toplantı kodu URL'sine yönlendirmesini bekler ve ardından
  bu URL'yi döndürür. Bu yol, Node üzerindeki OpenClaw Chrome profilinin Google'a
  zaten oturum açmış olmasını gerektirir.
  Tarayıcı otomasyonu, Meet'in kendi ilk çalıştırma mikrofon istemini işler; bu
  istem bir Google oturum açma hatası olarak ele alınmaz.
  Katılma ve oluşturma akışları, yeni bir Meet sekmesi açmadan önce mevcut bir
  Meet sekmesini yeniden kullanmayı da dener. Eşleştirme, `authuser` gibi
  zararsız URL sorgu dizelerini yok sayar; böylece bir ajan yeniden denemesi,
  ikinci bir Chrome sekmesi oluşturmak yerine zaten açık olan toplantıya
  odaklanmalıdır.

Komut/araç çıktısı, ajanların hangi yolun kullanıldığını açıklayabilmesi için
bir `source` alanı (`api` veya `browser`) içerir. `create`, varsayılan olarak
yeni toplantıya katılır ve `joined: true` ile katılım oturumunu döndürür.
Yalnızca URL oluşturmak için CLI'da `create --no-join` kullanın veya araca
`"join": false` iletin.

Veya bir ajana şunu söyleyin: "Bir Google Meet oluştur, gerçek zamanlı sesle
katıl ve bana bağlantıyı gönder." Ajan `action: "create"` ile `google_meet`
çağırmalı ve ardından döndürülen `meetingUri` değerini paylaşmalıdır.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Yalnızca gözlem/tarayıcı kontrolü amaçlı katılım için `"mode": "transcribe"`
ayarlayın. Bu, çift yönlü gerçek zamanlı model köprüsünü başlatmaz, BlackHole
veya SoX gerektirmez ve toplantıya yanıt vermez. Bu moddaki Chrome katılımları,
OpenClaw'ın mikrofon/kamera izin verme işlemini ve Meet **Mikrofon kullan**
yolunu da önler. Meet bir ses seçimi ara ekranı gösterirse, otomasyon mikrofon
olmayan yolu dener ve aksi halde yerel mikrofonu açmak yerine manuel işlem
raporlar. Transkripsiyon modunda, yönetilen Chrome aktarımları ayrıca en iyi
çabayla çalışan bir Meet altyazı gözlemcisi kurar. `googlemeet status --json` ve
`googlemeet doctor`; operatörlerin tarayıcının çağrıya katılıp katılmadığını ve
Meet altyazılarının metin üretip üretmediğini anlayabilmesi için `captioning`,
`captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`,
`lastCaptionSpeaker`, `lastCaptionText` ve kısa bir `recentTranscript` kuyruğunu
gösterir.
Evet/hayır yoklamasına ihtiyaç duyduğunuzda
`openclaw googlemeet test-listen <meet-url> --transport chrome-node` kullanın:
transkripsiyon modunda katılır, yeni altyazı veya transkript hareketi bekler ve
`listenVerified`, `listenTimedOut`, manuel işlem alanları ve en son altyazı
sağlığını döndürür.

Gerçek zamanlı oturumlar sırasında `google_meet` durumu, `inCall`,
`manualActionRequired`, `providerConnected`, `realtimeReady`,
`audioInputActive`, `audioOutputActive`, son giriş/çıkış zaman damgaları, bayt
sayaçları ve köprünün kapalı durumu gibi tarayıcı ve ses köprüsü sağlığını
içerir. Güvenli bir Meet sayfası istemi görünürse, tarayıcı otomasyonu
yapabildiğinde bunu işler. Oturum açma, ana makine kabulü ve tarayıcı/OS izin
istemleri; ajanın iletmesi için neden ve mesajla birlikte manuel işlem olarak
raporlanır. Yönetilen Chrome oturumları, giriş veya test ifadesini yalnızca
tarayıcı sağlığı `inCall: true` raporladıktan sonra yayar; aksi halde durum
`speechReady: false` raporlar ve konuşma denemesi, ajanın toplantıda konuşmuş
gibi yapılması yerine engellenir.

Yerel Chrome katılımları, oturum açılmış OpenClaw tarayıcı profili üzerinden
yapılır. Gerçek zamanlı mod, OpenClaw tarafından kullanılan mikrofon/hoparlör
yolu için `BlackHole 2ch` gerektirir. Temiz çift yönlü ses için ayrı sanal
aygıtlar veya Loopback tarzı bir grafik kullanın; tek bir BlackHole aygıtı ilk
smoke testi için yeterlidir ancak yankı yapabilir.

### Yerel Gateway + Parallels Chrome

VM'nin Chrome'a sahip olması için macOS VM içinde tam bir OpenClaw Gateway veya
model API anahtarına ihtiyacınız **yoktur**. Gateway ve ajanı yerel olarak
çalıştırın, ardından VM'de bir Node ana makinesi çalıştırın. Node'un Chrome
komutunu duyurması için paketlenmiş Plugin'i VM'de bir kez etkinleştirin:

Nerede ne çalışır:

- Gateway ana makinesi: OpenClaw Gateway, ajan çalışma alanı, model/API
  anahtarları, gerçek zamanlı sağlayıcı ve Google Meet Plugin yapılandırması.
- Parallels macOS VM: OpenClaw CLI/Node ana makinesi, Google Chrome, SoX,
  BlackHole 2ch ve Google'a oturum açmış bir Chrome profili.
- VM'de gerekli olmayanlar: Gateway hizmeti, ajan yapılandırması, OpenAI/GPT
  anahtarı veya model sağlayıcı kurulumu.

VM bağımlılıklarını kurun:

```bash
brew install blackhole-2ch sox
```

BlackHole kurulduktan sonra macOS'un `BlackHole 2ch`'i göstermesi için VM'yi
yeniden başlatın:

```bash
sudo reboot
```

Yeniden başlattıktan sonra VM'nin ses aygıtını ve SoX komutlarını görebildiğini
doğrulayın:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

VM'de OpenClaw'ı kurun veya güncelleyin, ardından paketlenmiş Plugin'i orada
etkinleştirin:

```bash
openclaw plugins enable google-meet
```

VM'de Node ana makinesini başlatın:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` bir LAN IP'siyse ve TLS kullanmıyorsanız, Node bu güvenilir
özel ağ için açıkça izin vermediğiniz sürece düz metin WebSocket'i reddeder:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Node'u LaunchAgent olarak kurarken aynı ortam değişkenini kullanın:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`, işlem ortamıdır; bir `openclaw.json`
ayarı değildir. `openclaw node install`, kurulum komutunda mevcut olduğunda bunu
LaunchAgent ortamında saklar.

Node'u Gateway ana makinesinden onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway'in Node'u gördüğünü ve hem `googlemeet.chrome` hem de tarayıcı
yeteneği/`browser.proxy` duyurduğunu doğrulayın:

```bash
openclaw nodes status
```

Meet'i Gateway ana makinesinde o Node üzerinden yönlendirin:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Şimdi Gateway ana makinesinden normal şekilde katılın:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

veya ajandan `transport: "chrome-node"` ile `google_meet` aracını kullanmasını
isteyin.

Bir oturumu oluşturan veya yeniden kullanan, bilinen bir ifadeyi söyleyen ve
oturum sağlığını yazdıran tek komutluk smoke testi için:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Gerçek zamanlı katılma sırasında OpenClaw tarayıcı otomasyonu konuk adını doldurur, Join/Ask to join öğesine tıklar ve bu istem göründüğünde Meet'in ilk çalıştırma "Use microphone" seçimini kabul eder. Yalnızca gözlem amaçlı katılma veya yalnızca tarayıcıyla toplantı oluşturma sırasında, aynı istemde bu seçenek kullanılabiliyorsa mikrofon olmadan devam eder. Tarayıcı profili oturum açmamışsa, Meet toplantı sahibinin kabulünü bekliyorsa, Chrome gerçek zamanlı katılma için mikrofon/kamera iznine ihtiyaç duyuyorsa veya Meet otomasyonun çözemediği bir istemde takılı kaldıysa, katılma/test konuşması sonucu `manualActionRequired: true` değerini `manualActionReason` ve `manualActionMessage` ile bildirir. Aracılar katılmayı yeniden denemeyi bırakmalı, bu tam mesajı geçerli `browserUrl`/`browserTitle` ile birlikte bildirmeli ve yalnızca elle yapılan tarayıcı işlemi tamamlandıktan sonra yeniden denemelidir.

`chromeNode.node` atlanırsa OpenClaw yalnızca tam olarak bir bağlı node hem `googlemeet.chrome` hem de tarayıcı denetimi duyurduğunda otomatik seçim yapar. Birden fazla yetenekli node bağlıysa `chromeNode.node` değerini node kimliği, görünen ad veya uzak IP olarak ayarlayın.

Yaygın hata denetimleri:

- `Configured Google Meet node ... is not usable: offline`: sabitlenen node Gateway tarafından biliniyor ancak kullanılamıyor. Aracılar bu node'u kullanılabilir bir Chrome ana makinesi olarak değil, tanılama durumu olarak ele almalı ve kullanıcı bunu istemediyse başka bir aktarıma geri dönmek yerine kurulum engelini bildirmelidir.
- `No connected Google Meet-capable node`: VM içinde `openclaw node run` başlatın, eşleştirmeyi onaylayın ve VM içinde `openclaw plugins enable google-meet` ile `openclaw plugins enable browser` komutlarının çalıştırıldığından emin olun. Ayrıca Gateway ana makinesinin her iki node komutuna da `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` ile izin verdiğini doğrulayın.
- `BlackHole 2ch audio device not found`: denetlenen ana makineye `blackhole-2ch` yükleyin ve yerel Chrome sesi kullanmadan önce yeniden başlatın.
- `BlackHole 2ch audio device not found on the node`: VM içine `blackhole-2ch` yükleyin ve VM'yi yeniden başlatın.
- Chrome açılıyor ancak katılamıyorsa: VM içindeki tarayıcı profilinde oturum açın veya konuk katılımı için `chrome.guestName` değerini ayarlı tutun. Konuk otomatik katılımı, node tarayıcı proxy'si üzerinden OpenClaw tarayıcı otomasyonunu kullanır; node tarayıcı yapılandırmasının istediğiniz profili gösterdiğinden emin olun, örneğin `browser.defaultProfile: "user"` veya adlandırılmış bir mevcut oturum profili.
- Yinelenen Meet sekmeleri: `chrome.reuseExistingTab: true` ayarını etkin bırakın. OpenClaw yeni bir sekme açmadan önce aynı Meet URL'si için mevcut bir sekmeyi etkinleştirir ve tarayıcıyla toplantı oluşturma, başka bir sekme açmadan önce devam eden bir `https://meet.google.com/new` veya Google hesabı istem sekmesini yeniden kullanır.
- Ses yok: Meet içinde mikrofon/hoparlör sesini OpenClaw tarafından kullanılan sanal ses aygıtı yolu üzerinden yönlendirin; temiz çift yönlü ses için ayrı sanal aygıtlar veya Loopback tarzı yönlendirme kullanın.

## Kurulum notları

Chrome gerçek zamanlı varsayılanı iki harici araç kullanır:

- `sox`: komut satırı ses yardımcı programı. Plugin, varsayılan 24 kHz PCM16 ses köprüsü için açık CoreAudio aygıt komutları kullanır.
- `blackhole-2ch`: macOS sanal ses sürücüsü. Chrome/Meet'in yönlendirme yapabileceği `BlackHole 2ch` ses aygıtını oluşturur.

OpenClaw bu paketlerin hiçbirini birlikte sunmaz veya yeniden dağıtmaz. Belgeler kullanıcılardan bunları Homebrew üzerinden ana makine bağımlılıkları olarak yüklemelerini ister. SoX, `LGPL-2.0-only AND GPL-2.0-only` lisansına sahiptir; BlackHole GPL-3.0 lisanslıdır. BlackHole'u OpenClaw ile birlikte paketleyen bir yükleyici veya cihaz oluşturuyorsanız, BlackHole'un yukarı akış lisans koşullarını inceleyin veya Existential Audio'dan ayrı bir lisans alın.

## Aktarımlar

### Chrome

Chrome aktarımı Meet URL'sini OpenClaw tarayıcı denetimi üzerinden açar ve oturum açmış OpenClaw tarayıcı profili olarak katılır. macOS üzerinde Plugin, başlatmadan önce `BlackHole 2ch` olup olmadığını denetler. Yapılandırılmışsa Chrome'u açmadan önce bir ses köprüsü sağlık komutu ve başlangıç komutu da çalıştırır. Chrome/ses Gateway ana makinesinde bulunduğunda `chrome` kullanın; Chrome/ses Parallels macOS VM gibi eşlenmiş bir node üzerinde bulunduğunda `chrome-node` kullanın. Yerel Chrome için profili `browser.defaultProfile` ile seçin; `chrome.browserProfile`, `chrome-node` ana makinelerine iletilir.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome mikrofon ve hoparlör sesini yerel OpenClaw ses köprüsü üzerinden yönlendirin. `BlackHole 2ch` yüklü değilse, katılma işlemi ses yolu olmadan sessizce katılmak yerine bir kurulum hatasıyla başarısız olur.

### Twilio

Twilio aktarımı, Voice Call Plugin'e devredilen katı bir arama planıdır. Telefon numaraları için Meet sayfalarını ayrıştırmaz.

Chrome katılımı kullanılamadığında veya telefonla arama yedeği istediğinizde bunu kullanın. Google Meet toplantı için bir telefonla arama numarası ve PIN sunmalıdır; OpenClaw bunları Meet sayfasından keşfetmez.

Voice Call Plugin'i Chrome node üzerinde değil, Gateway ana makinesinde etkinleştirin:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // or set "twilio" if Twilio should be the default
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

Twilio kimlik bilgilerini ortam veya yapılandırma üzerinden sağlayın. Ortam, gizli değerleri `openclaw.json` dışında tutar:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call` etkinleştirildikten sonra Gateway'i yeniden başlatın veya yeniden yükleyin; Plugin yapılandırma değişiklikleri, yeniden yüklenene kadar zaten çalışan bir Gateway işleminde görünmez.

Ardından doğrulayın:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio devri bağlandığında `googlemeet setup`, başarılı `twilio-voice-call-plugin`, `twilio-voice-call-credentials` ve `twilio-voice-call-webhook` denetimlerini içerir.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Toplantı özel bir sıra gerektirdiğinde `--dtmf-sequence` kullanın:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth ve ön denetim

OAuth, Meet bağlantısı oluşturmak için isteğe bağlıdır çünkü `googlemeet create` tarayıcı otomasyonuna geri dönebilir. Resmi API ile oluşturma, alan çözümleme veya Meet Media API ön denetimleri istediğinizde OAuth yapılandırın.

Google Meet API erişimi kullanıcı OAuth kullanır: bir Google Cloud OAuth istemcisi oluşturun, gerekli kapsamları isteyin, bir Google hesabını yetkilendirin ve ardından ortaya çıkan yenileme belirtecini Google Meet Plugin yapılandırmasında saklayın veya `OPENCLAW_GOOGLE_MEET_*` ortam değişkenlerini sağlayın.

OAuth, Chrome katılma yolunun yerini almaz. Chrome ve Chrome-node aktarımları, tarayıcı katılımı kullandığınızda hâlâ oturum açmış bir Chrome profili, BlackHole/SoX ve bağlı bir node üzerinden katılır. OAuth yalnızca resmi Google Meet API yolu içindir: toplantı alanları oluşturma, alanları çözümleme ve Meet Media API ön denetimlerini çalıştırma.

### Google kimlik bilgileri oluşturma

Google Cloud Console içinde:

1. Bir Google Cloud projesi oluşturun veya seçin.
2. Bu proje için **Google Meet REST API**'yi etkinleştirin.
3. OAuth onay ekranını yapılandırın.
   - **Internal**, Google Workspace kuruluşu için en basit seçenektir.
   - **External**, kişisel/test kurulumları için çalışır; uygulama Testing durumundayken uygulamayı yetkilendirecek her Google hesabını test kullanıcısı olarak ekleyin.
4. OpenClaw'ın istediği kapsamları ekleyin:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Bir OAuth istemci kimliği oluşturun.
   - Uygulama türü: **Web application**.
   - Yetkili yönlendirme URI'si:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. İstemci kimliğini ve istemci gizli anahtarını kopyalayın.

`meetings.space.created`, Google Meet `spaces.create` tarafından gereklidir.
`meetings.space.readonly`, OpenClaw'ın Meet URL'lerini/kodlarını alanlara çözümlemesini sağlar.
`meetings.space.settings`, OpenClaw'ın API oda oluşturma sırasında `accessType` gibi `SpaceConfig` ayarlarını iletmesini sağlar.
`meetings.conference.media.readonly`, Meet Media API ön denetimi ve medya çalışmaları içindir; Google gerçek Media API kullanımı için Developer Preview kaydı gerektirebilir.
Yalnızca tarayıcı tabanlı Chrome katılımlarına ihtiyacınız varsa OAuth'u tamamen atlayın.

### Yenileme belirteci üretme

`oauth.clientId` ve isteğe bağlı olarak `oauth.clientSecret` yapılandırın veya bunları ortam değişkenleri olarak iletin, ardından şunu çalıştırın:

```bash
openclaw googlemeet auth login --json
```

Komut, yenileme belirteci içeren bir `oauth` yapılandırma bloğu yazdırır. PKCE, `http://localhost:8085/oauth2callback` üzerindeki localhost geri çağrısını ve `--manual` ile elle kopyala/yapıştır akışını kullanır.

Örnekler:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Tarayıcı yerel geri çağrıya ulaşamadığında manuel modu kullanın:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

JSON çıktısı şunları içerir:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

`oauth` nesnesini Google Meet Plugin yapılandırmasının altına kaydedin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

Yenileme belirtecini yapılandırmada istemediğinizde ortam değişkenlerini tercih edin. Hem yapılandırma hem de ortam değerleri varsa Plugin önce yapılandırmayı çözer, ardından ortam geri dönüşünü kullanır.

OAuth onayı Meet alanı oluşturma, Meet alanı okuma erişimi ve Meet konferans medyası okuma erişimini içerir. Toplantı oluşturma desteği var olmadan önce kimlik doğruladıysanız, yenileme belirtecinin `meetings.space.created` kapsamına sahip olması için `openclaw googlemeet auth login --json` komutunu yeniden çalıştırın.

### OAuth'u doctor ile doğrulama

Hızlı, gizli değer içermeyen bir sağlık denetimi istediğinizde OAuth doctor'ı çalıştırın:

```bash
openclaw googlemeet doctor --oauth --json
```

Bu, Chrome çalışma zamanını yüklemez veya bağlı bir Chrome node gerektirmez. OAuth yapılandırmasının var olduğunu ve yenileme belirtecinin bir erişim belirteci üretebildiğini denetler. JSON raporu yalnızca `ok`, `configured`, `tokenSource`, `expiresAt` gibi durum alanlarını ve denetim mesajlarını içerir; erişim belirtecini, yenileme belirtecini veya istemci gizli anahtarını yazdırmaz.

Yaygın sonuçlar:

| Denetim             | Anlam                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `oauth-config`      | `oauth.clientId` artı `oauth.refreshToken` veya önbelleğe alınmış bir erişim belirteci mevcut.  |
| `oauth-token`       | Önbelleğe alınmış erişim belirteci hâlâ geçerli veya yenileme belirteci yeni bir erişim belirteci üretti. |
| `meet-spaces-get`   | İsteğe bağlı `--meeting` denetimi mevcut bir Meet alanını çözümledi.                             |
| `meet-spaces-create` | İsteğe bağlı `--create-space` denetimi yeni bir Meet alanı oluşturdu.                           |

Google Meet API etkinleştirmesini ve `spaces.create` kapsamını da kanıtlamak için yan etkili oluşturma denetimini çalıştırın:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space`, tek kullanımlık bir Meet URL'si oluşturur. Google Cloud projesinde Meet API'nin etkin olduğunu ve yetkilendirilmiş hesabın `meetings.space.created` kapsamına sahip olduğunu doğrulamanız gerektiğinde kullanın.

Mevcut bir toplantı alanı için okuma erişimini kanıtlamak için:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` ve `resolve-space`, yetkilendirilmiş Google hesabının erişebildiği mevcut bir alana okuma erişimini kanıtlar. Bu denetimlerden gelen bir `403`, genellikle Google Meet REST API'nin devre dışı olduğu, onaylanan yenileme belirtecinde gerekli kapsamın eksik olduğu veya Google hesabının ilgili Meet alanına erişemediği anlamına gelir. Yenileme belirteci hatası, `openclaw googlemeet auth login
--json` komutunu yeniden çalıştırmanız ve yeni `oauth` bloğunu saklamanız gerektiği anlamına gelir.

Tarayıcı yedeği için OAuth kimlik bilgileri gerekmez. Bu modda Google kimlik doğrulaması, OpenClaw yapılandırmasından değil, seçilen Node üzerinde oturum açılmış Chrome profilinden gelir.

Bu ortam değişkenleri yedek olarak kabul edilir:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` veya `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` veya `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` veya `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` veya `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` veya
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` veya `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` veya `GOOGLE_MEET_PREVIEW_ACK`

Bir Meet URL'sini, kodunu veya `spaces/{id}` değerini `spaces.get` üzerinden çözümleyin:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Medya çalışmasından önce ön denetimi çalıştırın:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet konferans kayıtlarını oluşturduktan sonra toplantı yapıtlarını ve katılımı listeleyin:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting` ile `artifacts` ve `attendance` varsayılan olarak en son konferans kaydını kullanır. İlgili toplantı için saklanan tüm kayıtları istediğinizde `--all-conference-records` geçirin.

Takvim araması, Meet yapıtlarını okumadan önce toplantı URL'sini Google Calendar'dan çözümleyebilir:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today`, Google Meet bağlantısı olan bir Calendar etkinliği için bugünün `primary` takviminde arama yapar. Eşleşen etkinlik metnini aramak için `--event <query>`, birincil olmayan bir takvim için `--calendar <id>` kullanın. Takvim araması, Calendar etkinlikleri salt okunur kapsamını içeren yeni bir OAuth oturum açma işlemi gerektirir.
`calendar-events`, eşleşen Meet etkinliklerini önizler ve `latest`, `artifacts`, `attendance` veya `export` tarafından seçilecek etkinliği işaretler.

Konferans kayıt kimliğini zaten biliyorsanız doğrudan adresleyin:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Aramadan sonra odayı kapatmak istediğinizde API ile oluşturulmuş bir alan için etkin konferansı sonlandırın:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Bu, Google Meet `spaces.endActiveConference` çağrısını yapar ve yetkilendirilmiş hesabın yönetebildiği bir alan için `meetings.space.created` kapsamına sahip OAuth gerektirir.
OpenClaw, Meet URL'si, toplantı kodu veya `spaces/{id}` girdisi kabul eder ve etkin konferansı sonlandırmadan önce bunu API alan kaynağına çözümler.
Bu, `googlemeet leave` komutundan ayrıdır: `leave`, OpenClaw'ın yerel/oturum katılımını durdururken `end-active-conference`, Google Meet'ten alan için etkin konferansı sonlandırmasını ister.

Okunabilir bir rapor yazın:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts`, Google toplantı için sunduğunda konferans kaydı üst verilerinin yanı sıra katılımcı, kayıt, transkript, yapılandırılmış transkript girdisi ve akıllı not kaynak üst verilerini döndürür. Büyük toplantılarda girdi aramasını atlamak için `--no-transcript-entries` kullanın. `attendance`, katılımcıları ilk/son görülme zamanları, toplam oturum süresi, geç/erken ayrılma işaretleri ve oturum açmış kullanıcıya veya görüntü adına göre birleştirilmiş yinelenen katılımcı kaynakları içeren katılımcı oturumu satırlarına genişletir. Ham katılımcı kaynaklarını ayrı tutmak için `--no-merge-duplicates`, geç kalma algılamasını ayarlamak için `--late-after-minutes` ve erken ayrılma algılamasını ayarlamak için `--early-before-minutes` geçirin.

`export`, `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` ve `manifest.json` içeren bir klasör yazar.
`manifest.json`, seçilen girdiyi, dışa aktarma seçeneklerini, konferans kayıtlarını, çıktı dosyalarını, sayımları, belirteç kaynağını, kullanıldıysa Calendar etkinliğini ve tüm kısmi alma uyarılarını kaydeder. Klasörün yanına taşınabilir bir arşiv de yazmak için `--zip` geçirin. Bağlantılı transkript ve akıllı not Google Docs metinlerini Google Drive `files.export` üzerinden dışa aktarmak için `--include-doc-bodies` geçirin; bu, Drive Meet salt okunur kapsamını içeren yeni bir OAuth oturum açma işlemi gerektirir. `--include-doc-bodies` olmadan, dışa aktarmalar yalnızca Meet üst verilerini ve yapılandırılmış transkript girdilerini içerir. Google, akıllı not listeleme, transkript girdisi veya Drive belge gövdesi hatası gibi kısmi bir yapıt hatası döndürürse özet ve manifest, tüm dışa aktarmayı başarısız kılmak yerine uyarıyı saklar.
Aynı yapıt/katılım verilerini almak ve klasörü ya da ZIP'i oluşturmadan manifest JSON'unu yazdırmak için `--dry-run` kullanın. Bu, büyük bir dışa aktarma yazmadan önce veya bir aracının yalnızca sayımlara, seçili kayıtlara ve uyarılara ihtiyaç duyduğu durumlarda kullanışlıdır.

Aracılar aynı paketi `google_meet` aracıyla da oluşturabilir:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Yalnızca dışa aktarma manifestini döndürmek ve dosya yazımlarını atlamak için `"dryRun": true` ayarlayın.

Aracılar, açık bir erişim ilkesiyle API destekli bir oda da oluşturabilir:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
  "accessType": "OPEN"
}
```

Ve bilinen bir oda için etkin konferansı sonlandırabilirler:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Önce dinleme doğrulaması için aracılar, toplantının yararlı olduğunu iddia etmeden önce `test_listen` kullanmalıdır:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Koruma altındaki canlı smoke testini gerçek ve saklanan bir toplantıya karşı çalıştırın:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Canlı önce dinleme tarayıcı probunu, Meet altyazıları kullanılabilirken birinin konuşacağı bir toplantıya karşı çalıştırın:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Canlı smoke ortamı:

- `OPENCLAW_LIVE_TEST=1`, koruma altındaki canlı testleri etkinleştirir.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`, saklanan bir Meet URL'sine, koduna veya
  `spaces/{id}` değerine işaret eder.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` veya `GOOGLE_MEET_CLIENT_ID`, OAuth istemci kimliğini sağlar.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` veya `GOOGLE_MEET_REFRESH_TOKEN`, yenileme belirtecini sağlar.
- İsteğe bağlı: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ve
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`, `OPENCLAW_` öneki olmadan aynı yedek adları kullanır.

Temel yapıt/katılım canlı smoke testi
`https://www.googleapis.com/auth/meetings.space.readonly` ve
`https://www.googleapis.com/auth/meetings.conference.media.readonly` gerektirir. Takvim araması `https://www.googleapis.com/auth/calendar.events.readonly` gerektirir. Drive belge gövdesi dışa aktarması
`https://www.googleapis.com/auth/drive.meet.readonly` gerektirir.

Yeni bir Meet alanı oluşturun:

```bash
openclaw googlemeet create
```

Komut yeni `meeting uri`, kaynak ve katılma oturumunu yazdırır. OAuth kimlik bilgileriyle resmi Google Meet API'yi kullanır. OAuth kimlik bilgileri olmadan, yedek olarak sabitlenmiş Chrome Node'un oturum açılmış tarayıcı profilini kullanır. Aracılar, tek adımda oluşturmak ve katılmak için `action: "create"` ile `google_meet` aracını kullanabilir. Yalnızca URL oluşturma için `"join": false` geçirin.

Tarayıcı yedeğinden örnek JSON çıktısı:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Tarayıcı yedeği, URL'yi oluşturmadan önce Google oturum açma veya Meet izin engelleyicisiyle karşılaşırsa Gateway yöntemi başarısız bir yanıt döndürür ve `google_meet` aracı düz bir dize yerine yapılandırılmış ayrıntılar döndürür:

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

Bir aracı `manualActionRequired: true` gördüğünde, `manualActionMessage` ile birlikte tarayıcı Node/sekme bağlamını bildirmeli ve operatör tarayıcı adımını tamamlayana kadar yeni Meet sekmeleri açmayı durdurmalıdır.

API oluşturmasından örnek JSON çıktısı:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Meet oluşturma varsayılan olarak katılır. Chrome veya Chrome-node taşıması, tarayıcı üzerinden katılmak için yine de oturum açılmış bir Google Chrome profiline ihtiyaç duyar. Profilin oturumu kapalıysa OpenClaw `manualActionRequired: true` veya bir tarayıcı yedeği hatası bildirir ve yeniden denemeden önce operatörden Google oturum açma işlemini tamamlamasını ister.

`preview.enrollmentAcknowledged: true` değerini yalnızca Cloud projenizin, OAuth yetkilinizin ve toplantı katılımcılarının Meet medya API'leri için Google Workspace Developer Preview Program'a kayıtlı olduğunu doğruladıktan sonra ayarlayın.

## Yapılandırma

Yaygın Chrome gerçek zamanlı yolu yalnızca Plugin'in etkinleştirilmesine, BlackHole'a, SoX'a ve bir arka uç gerçek zamanlı ses sağlayıcısı anahtarına ihtiyaç duyar. Varsayılan OpenAI'dır; Google Gemini Live kullanmak için `realtime.provider: "google"` ayarlayın:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Plugin yapılandırmasını `plugins.entries.google-meet.config` altında ayarlayın:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Varsayılanlar:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: `chrome-node` için isteğe bağlı node kimliği/adı/IP'si
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: oturum açmamış Meet misafir ekranında
  kullanılan ad
- `chrome.autoJoin: true`: `chrome-node` üzerinde OpenClaw tarayıcı otomasyonu
  aracılığıyla en iyi çaba ile misafir adı doldurma ve Join Now tıklaması
- `chrome.reuseExistingTab: true`: yinelenen sekmeler açmak yerine mevcut bir
  Meet sekmesini etkinleştir
- `chrome.waitForInCallMs: 20000`: gerçek zamanlı giriş tetiklenmeden önce Meet
  sekmesinin aramada olduğunu bildirmesini bekle
- `chrome.audioFormat: "pcm16-24khz"`: komut çifti ses biçimi. Hâlâ telefon sesi
  yayan eski/özel komut çiftleri için yalnızca `"g711-ulaw-8khz"` kullanın.
- `chrome.audioInputCommand`: CoreAudio `BlackHole 2ch` üzerinden okuyan ve sesi
  `chrome.audioFormat` içinde yazan SoX komutu
- `chrome.audioOutputCommand`: `chrome.audioFormat` içinde ses okuyan ve
  CoreAudio `BlackHole 2ch` üzerine yazan SoX komutu
- `chrome.bargeInInputCommand`: asistan oynatması etkinken insan söz kesme
  algılaması için imzalı 16 bit küçük endian mono PCM yazan isteğe bağlı yerel
  mikrofon komutu. Bu şu anda Gateway tarafından barındırılan `chrome` komut
  çifti köprüsü için geçerlidir.
- `chrome.bargeInRmsThreshold: 650`: `chrome.bargeInInputCommand` üzerinde insan
  kesintisi sayılan RMS düzeyi
- `chrome.bargeInPeakThreshold: 2500`: `chrome.bargeInInputCommand` üzerinde
  insan kesintisi sayılan tepe düzeyi
- `chrome.bargeInCooldownMs: 900`: yinelenen insan kesintisi temizlemeleri
  arasındaki minimum gecikme
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: daha derin yanıtlar için `openclaw_agent_consult` ile
  kısa konuşma yanıtları
- `realtime.introMessage`: gerçek zamanlı köprü bağlandığında kısa konuşmalı
  hazır olma kontrolü; sessiz katılmak için bunu `""` olarak ayarlayın
- `realtime.agentId`: `openclaw_agent_consult` için isteğe bağlı OpenClaw ajan
  kimliği; varsayılan `main`

İsteğe bağlı geçersiz kılmalar:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  browser: {
    defaultProfile: "openclaw",
  },
  chrome: {
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
    bargeInInputCommand: [
      "sox",
      "-q",
      "-t",
      "coreaudio",
      "External Microphone",
      "-r",
      "24000",
      "-c",
      "1",
      "-b",
      "16",
      "-e",
      "signed-integer",
      "-t",
      "raw",
      "-",
    ],
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

Yalnızca Twilio yapılandırması:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled` varsayılan olarak `true` değerindedir; Twilio taşımasıyla
gerçek PSTN aramasını, DTMF'yi ve giriş selamlamasını Voice Call Plugin'ine
devreder. Voice Call, gerçek zamanlı medya akışını açmadan önce DTMF dizisini
çalar, ardından kaydedilen giriş metnini ilk gerçek zamanlı selamlama olarak
kullanır. `voice-call` etkin değilse Google Meet yine de arama planını
doğrulayabilir ve kaydedebilir, ancak Twilio aramasını başlatamaz.

## Araç

Ajanlar `google_meet` aracını kullanabilir:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Chrome Gateway ana makinesinde çalıştığında `transport: "chrome"` kullanın.
Chrome, Parallels VM gibi eşleştirilmiş bir node üzerinde çalıştığında
`transport: "chrome-node"` kullanın. Her iki durumda da gerçek zamanlı model ve
`openclaw_agent_consult` Gateway ana makinesinde çalışır; böylece model kimlik
bilgileri orada kalır.

Etkin oturumları listelemek veya bir oturum kimliğini incelemek için
`action: "status"` kullanın. Gerçek zamanlı ajanın hemen konuşmasını sağlamak
için `sessionId` ve `message` ile `action: "speak"` kullanın. Oturumu oluşturmak
veya yeniden kullanmak, bilinen bir ifadeyi tetiklemek ve Chrome ana makinesi
bunu bildirebiliyorsa `inCall` durumunu döndürmek için `action: "test_speech"`
kullanın. `test_speech` her zaman `mode: "realtime"` değerini zorlar ve
`mode: "transcribe"` içinde çalıştırılması istenirse başarısız olur; çünkü
yalnızca gözlem oturumları bilinçli olarak konuşma yayamaz. `speechOutputVerified`
sonucu, bu test çağrısı sırasında gerçek zamanlı ses çıkışı baytlarının artmasına
dayanır; bu nedenle eski sesi olan yeniden kullanılan bir oturum yeni ve başarılı
bir konuşma kontrolü sayılmaz. Bir oturumu sona ermiş olarak işaretlemek için
`action: "leave"` kullanın.

`status`, mevcut olduğunda Chrome durumunu içerir:

- `inCall`: Chrome Meet aramasının içinde görünüyor
- `micMuted`: en iyi çaba ile Meet mikrofon durumu
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: konuşma
  çalışmadan önce tarayıcı profilinin manuel oturum açma, Meet sahibi kabulü,
  izinler veya tarayıcı denetimi onarımı gerektirmesi
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: yönetilen
  Chrome konuşmasının şu anda izinli olup olmadığı. `speechReady: false`,
  OpenClaw'ın giriş/test ifadesini ses köprüsüne göndermediği anlamına gelir.
- `providerConnected` / `realtimeReady`: gerçek zamanlı ses köprüsü durumu
- `lastInputAt` / `lastOutputAt`: köprüden görülen veya köprüye gönderilen son
  ses
- `lastSuppressedInputAt` / `suppressedInputBytes`: asistan oynatması etkinken
  yok sayılan loopback girişi

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Gerçek zamanlı ajan danışması

Chrome gerçek zamanlı modu, canlı bir ses döngüsü için optimize edilmiştir.
Gerçek zamanlı ses sağlayıcısı toplantı sesini duyar ve yapılandırılmış ses
köprüsü üzerinden konuşur. Gerçek zamanlı model daha derin akıl yürütmeye,
güncel bilgilere veya normal OpenClaw araçlarına ihtiyaç duyduğunda
`openclaw_agent_consult` çağırabilir.

Danışma aracı, son toplantı dökümü bağlamıyla birlikte normal OpenClaw ajanını
arka planda çalıştırır ve gerçek zamanlı ses oturumuna kısa bir konuşma yanıtı
döndürür. Ses modeli daha sonra bu yanıtı toplantıya geri söyleyebilir. Voice
Call ile aynı paylaşılan gerçek zamanlı danışma aracını kullanır.

Varsayılan olarak danışmalar `main` ajanına karşı çalışır. Bir Meet hattının
özel bir OpenClaw ajan çalışma alanına, model varsayılanlarına, araç politikasına,
belleğe ve oturum geçmişine danışması gerekiyorsa `realtime.agentId` ayarlayın.

`realtime.toolPolicy` danışma çalışmasını denetler:

- `safe-read-only`: danışma aracını kullanıma aç ve normal ajanı `read`,
  `web_search`, `web_fetch`, `x_search`, `memory_search` ve `memory_get` ile
  sınırla.
- `owner`: danışma aracını kullanıma aç ve normal ajanın olağan ajan araç
  politikasını kullanmasına izin ver.
- `none`: danışma aracını gerçek zamanlı ses modeline kullanıma açma.

Danışma oturum anahtarı her Meet oturumu için kapsamlanır; böylece takip eden
danışma çağrıları aynı toplantı sırasında önceki danışma bağlamını yeniden
kullanabilir.

Chrome aramaya tamamen katıldıktan sonra konuşmalı hazır olma kontrolünü
zorlamak için:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Tam katıl-ve-konuş duman testi için:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Canlı test kontrol listesi

Bir toplantıyı gözetimsiz bir ajana devretmeden önce bu diziyi kullanın:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Beklenen Chrome-node durumu:

- `googlemeet setup` tamamen yeşildir.
- Chrome-node varsayılan taşıma olduğunda veya bir node sabitlendiğinde
  `googlemeet setup`, `chrome-node-connected` içerir.
- `nodes status` seçilen node'un bağlı olduğunu gösterir.
- Seçilen node hem `googlemeet.chrome` hem de `browser.proxy` duyurur.
- Meet sekmesi aramaya katılır ve `test-speech`, `inCall: true` ile Chrome
  durumunu döndürür.

Parallels macOS VM gibi uzak bir Chrome ana makinesi için Gateway veya VM
güncellendikten sonraki en kısa güvenli kontrol şudur:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Bu, bir ajan gerçek bir toplantı sekmesi açmadan önce Gateway Plugin'inin
yüklendiğini, VM node'unun geçerli token ile bağlı olduğunu ve Meet ses
köprüsünün kullanılabilir olduğunu kanıtlar.

Twilio duman testi için telefonla arama ayrıntılarını açığa çıkaran bir toplantı
kullanın:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Beklenen Twilio durumu:

- `googlemeet setup`, yeşil `twilio-voice-call-plugin`,
  `twilio-voice-call-credentials` ve `twilio-voice-call-webhook` kontrollerini
  içerir.
- Gateway yeniden yüklendikten sonra CLI içinde `voicecall` kullanılabilir.
- Döndürülen oturumda `transport: "twilio"` ve bir `twilio.voiceCallId` bulunur.
- `openclaw logs --follow`, gerçek zamanlı TwiML'den önce DTMF TwiML'nin
  sunulduğunu, ardından ilk selamlamanın kuyruğa alındığı bir gerçek zamanlı
  köprü olduğunu gösterir.
- `googlemeet leave <sessionId>` devredilen sesli aramayı kapatır.

## Sorun giderme

### Ajan Google Meet aracını göremiyor

Plugin'in Gateway yapılandırmasında etkin olduğunu doğrulayın ve Gateway'i
yeniden yükleyin:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

`plugins.entries.google-meet` öğesini yeni düzenlediyseniz Gateway'i yeniden
başlatın veya yeniden yükleyin. Çalışan ajan yalnızca mevcut Gateway işlemi
tarafından kaydedilen Plugin araçlarını görür.

macOS olmayan Gateway ana makinelerinde, ajana dönük `google_meet` aracı görünür
kalır, ancak yerel Chrome gerçek zamanlı eylemleri ses köprüsüne ulaşmadan önce
engellenir. Yerel Chrome gerçek zamanlı sesi şu anda macOS `BlackHole 2ch`
bağımlılığına sahiptir; bu nedenle Linux ajanları varsayılan yerel Chrome gerçek
zamanlı yolu yerine `mode: "transcribe"`, Twilio araması veya bir macOS
`chrome-node` ana makinesi kullanmalıdır.

### Bağlı Google Meet yetenekli node yok

Node ana makinesinde şunu çalıştırın:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway ana makinesinde node'u onaylayın ve komutları doğrulayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node bağlı olmalı ve `googlemeet.chrome` ile `browser.proxy` listelemelidir.
Gateway yapılandırması bu node komutlarına izin vermelidir:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup`, `chrome-node-connected` için başarısız olursa veya Gateway
günlüğü `gateway token mismatch` bildirirse node'u geçerli Gateway token ile
yeniden kurun veya yeniden başlatın. Bir LAN Gateway için bu genellikle şu
anlama gelir:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Ardından node hizmetini yeniden yükleyin ve yeniden çalıştırın:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Tarayıcı açılıyor ancak ajan katılamıyor

Yalnızca gözlem katılımları için `googlemeet test-listen` veya gerçek zamanlı
katılımlar için `googlemeet test-speech` çalıştırın, ardından döndürülen Chrome
durumunu inceleyin. Sorgulardan biri `manualActionRequired: true` bildirirse
operatöre `manualActionMessage` gösterin ve tarayıcı eylemi tamamlanana kadar
yeniden denemeyi durdurun.

Yaygın manuel eylemler:

- Chrome profiline oturum açın.
- Meet sahibi hesabından misafiri kabul edin.
- Chrome'un yerel izin istemi göründüğünde Chrome mikrofon/kamera izinlerini
  verin.
- Takılmış bir Meet izin iletişim kutusunu kapatın veya onarın.

Meet "Toplantıdaki kişilerin sizi duymasını istiyor musunuz?" ekranını gösteriyor diye "oturum açılmamış" bildirmeyin. Bu, Meet'in ses seçimi ara ekranıdır; OpenClaw mümkün olduğunda tarayıcı otomasyonu üzerinden **Mikrofonu kullan** seçeneğine tıklar ve gerçek toplantı durumunu beklemeye devam eder. Yalnızca oluşturma amaçlı tarayıcı yedeğinde, URL oluşturmak gerçek zamanlı ses yoluna ihtiyaç duymadığı için OpenClaw **Mikrofonsuz devam et** seçeneğine tıklayabilir.

### Toplantı oluşturma başarısız oluyor

`googlemeet create`, OAuth kimlik bilgileri yapılandırıldığında önce Google Meet API `spaces.create` uç noktasını kullanır. OAuth kimlik bilgileri olmadan sabitlenmiş Chrome node tarayıcısına geri döner. Şunları doğrulayın:

- API oluşturması için: `oauth.clientId` ve `oauth.refreshToken` yapılandırılmıştır ya da eşleşen `OPENCLAW_GOOGLE_MEET_*` ortam değişkenleri mevcuttur.
- API oluşturması için: yenileme token'ı, oluşturma desteği eklendikten sonra üretilmiştir. Eski token'larda `meetings.space.created` kapsamı eksik olabilir; `openclaw googlemeet auth login --json` komutunu yeniden çalıştırın ve plugin yapılandırmasını güncelleyin.
- Tarayıcı yedeği için: `defaultTransport: "chrome-node"` ve `chromeNode.node`, `browser.proxy` ve `googlemeet.chrome` içeren bağlı bir node'u gösterir.
- Tarayıcı yedeği için: o node üzerindeki OpenClaw Chrome profili Google'da oturum açmıştır ve `https://meet.google.com/new` adresini açabilir.
- Tarayıcı yedeği için: yeniden denemeler, yeni bir sekme açmadan önce mevcut bir `https://meet.google.com/new` ya da Google hesabı istemi sekmesini yeniden kullanır. Bir agent zaman aşımına uğrarsa, başka bir Meet sekmesini elle açmak yerine araç çağrısını yeniden deneyin.
- Tarayıcı yedeği için: araç `manualActionRequired: true` döndürürse, operatörü yönlendirmek için döndürülen `browser.nodeId`, `browser.targetId`, `browserUrl` ve `manualActionMessage` değerlerini kullanın. Bu işlem tamamlanmadan döngü içinde yeniden denemeyin.
- Tarayıcı yedeği için: Meet "Toplantıdaki kişilerin sizi duymasını istiyor musunuz?" ekranını gösterirse, sekmeyi açık bırakın. OpenClaw, tarayıcı otomasyonu üzerinden **Mikrofonu kullan** seçeneğine ya da yalnızca oluşturma yedeği için **Mikrofonsuz devam et** seçeneğine tıklamalı ve oluşturulan Meet URL'sini beklemeye devam etmelidir. Bunu yapamazsa hata `google-login-required` değil, `meet-audio-choice-required` belirtmelidir.

### Agent katılıyor ancak konuşmuyor

Gerçek zamanlı yolu kontrol edin:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Dinleme/yanıt konuşması için `mode: "realtime"` kullanın. `mode: "transcribe"` bilerek çift yönlü gerçek zamanlı ses köprüsünü başlatmaz. Yalnızca gözlem amaçlı hata ayıklama için katılımcılar konuştuktan sonra `openclaw googlemeet status --json <session-id>` çalıştırın ve `captioning`, `transcriptLines` ve `lastCaptionText` değerlerini kontrol edin. `inCall` true ise ancak `transcriptLines` `0` olarak kalıyorsa, Meet altyazıları devre dışı olabilir, gözlemci kurulduğundan beri kimse konuşmamış olabilir, Meet UI değişmiş olabilir ya da toplantı dili/hesabı için canlı altyazılar kullanılamıyor olabilir.

`googlemeet test-speech` her zaman gerçek zamanlı yolu kontrol eder ve o çağrı için köprü çıkış baytlarının gözlemlenip gözlemlenmediğini bildirir. `speechOutputVerified` false ve `speechOutputTimedOut` true ise, gerçek zamanlı sağlayıcı ifadeyi kabul etmiş olabilir ancak OpenClaw yeni çıkış baytlarının Chrome ses köprüsüne ulaştığını görmemiştir.

Ayrıca şunları doğrulayın:

- Gateway ana makinesinde `OPENAI_API_KEY` veya `GEMINI_API_KEY` gibi bir gerçek zamanlı sağlayıcı anahtarı kullanılabilir.
- `BlackHole 2ch`, Chrome ana makinesinde görünür.
- `sox`, Chrome ana makinesinde mevcuttur.
- Meet mikrofonu ve hoparlörü, OpenClaw tarafından kullanılan sanal ses yolu üzerinden yönlendirilmiştir.

`googlemeet doctor [session-id]` oturumu, node'u, çağrı içi durumu, elle işlem nedenini, gerçek zamanlı sağlayıcı bağlantısını, `realtimeReady` durumunu, ses giriş/çıkış etkinliğini, son ses zaman damgalarını, bayt sayaçlarını ve tarayıcı URL'sini yazdırır. Ham JSON gerektiğinde `googlemeet status [session-id] --json` kullanın. Token'ları açığa çıkarmadan Google Meet OAuth yenilemeyi doğrulamanız gerektiğinde `googlemeet doctor --oauth` kullanın; ayrıca Google Meet API kanıtı gerektiğinde `--meeting` veya `--create-space` ekleyin.

Bir agent zaman aşımına uğradıysa ve zaten açık bir Meet sekmesi görebiliyorsanız, başka bir sekme açmadan o sekmeyi inceleyin:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Eşdeğer araç eylemi `recover_current_tab` olur. Seçilen aktarım için mevcut bir Meet sekmesine odaklanır ve onu inceler. `chrome` ile Gateway üzerinden yerel tarayıcı denetimini kullanır; `chrome-node` ile yapılandırılmış Chrome node'u kullanır. Yeni sekme açmaz veya yeni oturum oluşturmaz; oturum açma, kabul, izinler ya da ses seçimi durumu gibi geçerli engelleyiciyi bildirir. CLI komutu yapılandırılmış Gateway ile konuşur, bu yüzden Gateway çalışıyor olmalıdır; `chrome-node` ayrıca Chrome node'un bağlı olmasını gerektirir.

### Twilio kurulum kontrolleri başarısız oluyor

`twilio-voice-call-plugin`, `voice-call` izinli olmadığında veya etkinleştirilmediğinde başarısız olur. Bunu `plugins.allow` içine ekleyin, `plugins.entries.voice-call` öğesini etkinleştirin ve Gateway'i yeniden yükleyin.

`twilio-voice-call-credentials`, Twilio arka ucunda hesap SID'si, auth token'ı veya arayan numara eksik olduğunda başarısız olur. Bunları Gateway ana makinesinde ayarlayın:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook`, `voice-call` için herkese açık Webhook erişimi olmadığında ya da `publicUrl` geri döngü veya özel ağ alanını gösterdiğinde başarısız olur. `plugins.entries.voice-call.config.publicUrl` değerini herkese açık sağlayıcı URL'sine ayarlayın veya bir `voice-call` tüneli/Tailscale erişimi yapılandırın.

Geri döngü ve özel URL'ler operatör geri çağrıları için geçerli değildir. `publicUrl` olarak `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` veya `fd00::/8` kullanmayın.

Kararlı bir herkese açık URL için:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          fromNumber: "+15550001234",
          publicUrl: "https://voice.example.com/voice/webhook",
        },
      },
    },
  },
}
```

Yerel geliştirme için özel ana makine URL'si yerine bir tünel veya Tailscale erişimi kullanın:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Ardından Gateway'i yeniden başlatın veya yeniden yükleyin ve şunu çalıştırın:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` varsayılan olarak yalnızca hazır olma denetimidir. Belirli bir numara için deneme çalıştırması yapmak üzere:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Yalnızca bilerek canlı bir giden bildirim çağrısı yapmak istediğinizde `--yes` ekleyin:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio çağrısı başlıyor ancak toplantıya hiç girmiyor

Meet etkinliğinin telefonla arama ayrıntılarını sunduğunu doğrulayın. Tam telefonla arama numarasını ve PIN'i ya da özel bir DTMF dizisini geçirin:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Sağlayıcının PIN girilmeden önce duraklamaya ihtiyacı varsa `--dtmf-sequence` içinde başta `w` veya virgül kullanın.

Telefon çağrısı oluşturuluyor ancak Meet katılımcı listesi telefonla arayan katılımcıyı hiç göstermiyorsa:

- Devredilen Twilio çağrı kimliğini, DTMF'nin kuyruğa alınıp alınmadığını ve giriş selamlamasının istenip istenmediğini doğrulamak için `openclaw googlemeet doctor <session-id>` çalıştırın.
- `openclaw voicecall status --call-id <id>` çalıştırın ve çağrının hâlâ aktif olduğunu doğrulayın.
- `openclaw voicecall tail` çalıştırın ve Twilio Webhook'larının Gateway'e ulaştığını kontrol edin.
- `openclaw logs --follow` çalıştırın ve Twilio Meet dizisini arayın: Google Meet katılmayı devreder, Voice Call telefon bacağını başlatır, Google Meet `voiceCall.dtmfDelayMs` kadar bekler, `voicecall.dtmf` ile DTMF gönderir, `voiceCall.postDtmfSpeechDelayMs` kadar bekler, ardından `voicecall.speak` ile giriş konuşmasını ister.
- `openclaw googlemeet setup --transport twilio` komutunu yeniden çalıştırın; yeşil bir kurulum kontrolü gereklidir ancak toplantı PIN dizisinin doğru olduğunu kanıtlamaz.
- Telefonla arama numarasının PIN ile aynı Meet davetine ve bölgesine ait olduğunu doğrulayın.
- Meet yavaş yanıtlıyorsa veya DTMF gönderildikten sonra çağrı transkripti hâlâ PIN isteyen istemi gösteriyorsa `voiceCall.dtmfDelayMs` değerini artırın.
- Katılımcı katılıyor ancak selamlamayı duymuyorsanız, DTMF sonrası `voicecall.speak` isteği ve media-stream TTS oynatması ya da Twilio `<Say>` yedeği için `openclaw logs --follow` çıktısını kontrol edin. Çağrı transkripti hâlâ "toplantı PIN'ini girin" içeriyorsa, telefon bacağı henüz Meet odasına katılmamıştır; bu yüzden toplantı katılımcıları konuşmayı duymayacaktır.

Webhook'lar gelmiyorsa önce Voice Call plugin'inin hatasını ayıklayın: sağlayıcı `plugins.entries.voice-call.config.publicUrl` adresine veya yapılandırılmış tünele ulaşmalıdır. Bkz. [Sesli çağrı sorun giderme](/tr/plugins/voice-call#troubleshooting).

## Notlar

Google Meet'in resmi medya API'si alma odaklıdır, bu yüzden bir Meet çağrısında konuşmak hâlâ bir katılımcı yolu gerektirir. Bu plugin bu sınırı görünür tutar: Chrome tarayıcı katılımını ve yerel ses yönlendirmesini işler; Twilio telefonla arama katılımını işler.

Chrome gerçek zamanlı modu `BlackHole 2ch` ve ayrıca şunlardan birini gerektirir:

- `chrome.audioInputCommand` ve `chrome.audioOutputCommand`: OpenClaw gerçek zamanlı model köprüsünün sahibidir ve bu komutlar ile seçilen gerçek zamanlı ses sağlayıcısı arasında `chrome.audioFormat` içinde sesi borular. Varsayılan Chrome yolu 24 kHz PCM16'dır; 8 kHz G.711 mu-law eski komut çiftleri için kullanılabilir kalır.
- `chrome.audioBridgeCommand`: Harici bir köprü komutu tüm yerel ses yolunun sahibidir ve daemon'unu başlattıktan veya doğruladıktan sonra çıkmalıdır.

Temiz çift yönlü ses için Meet çıkışını ve Meet mikrofonunu ayrı sanal aygıtlar ya da Loopback tarzı bir sanal aygıt grafiği üzerinden yönlendirin. Tek bir paylaşılan BlackHole aygıtı, diğer katılımcıları çağrıya geri yankılayabilir.

Komut çifti Chrome köprüsüyle `chrome.bargeInInputCommand`, ayrı bir yerel mikrofonu dinleyebilir ve insan konuşmaya başladığında asistan oynatmasını temizleyebilir. Bu, paylaşılan BlackHole geri döngü girişi asistan oynatması sırasında geçici olarak bastırılsa bile insan konuşmasını asistan çıktısının önünde tutar. `chrome.audioInputCommand` ve `chrome.audioOutputCommand` gibi, bu da operatör tarafından yapılandırılan yerel bir komuttur. Açık bir güvenilir komut yolu veya argüman listesi kullanın ve bunu güvenilmeyen konumlardaki betiklere yöneltmeyin.

`googlemeet speak`, bir Chrome oturumu için aktif gerçek zamanlı ses köprüsünü tetikler. `googlemeet leave` bu köprüyü durdurur. Voice Call plugin'i üzerinden devredilen Twilio oturumları için `leave`, alttaki sesli çağrıyı da kapatır. API tarafından yönetilen bir alan için aktif Google Meet konferansını da kapatmak istediğinizde `googlemeet end-active-conference` kullanın.

## İlgili

- [Voice Call plugin'i](/tr/plugins/voice-call)
- [Konuşma modu](/tr/nodes/talk)
- [Plugin oluşturma](/tr/plugins/building-plugins)
