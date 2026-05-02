---
read_when:
    - Bir OpenClaw aracısının bir Google Meet görüşmesine katılmasını istiyorsunuz
    - Bir OpenClaw ajanının yeni bir Google Meet görüşmesi oluşturmasını istiyorsunuz
    - Google Meet taşıyıcısı olarak Chrome, Chrome düğümü veya Twilio'yu yapılandırıyorsunuz
summary: 'Google Meet Plugin: Açıkça belirtilen Meet URL''lerine Chrome veya Twilio üzerinden gerçek zamanlı ses varsayılanlarıyla katıl'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-02T09:01:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef6945172fed00e5583f655789fab9734e5232c6820bd3fafe7d7c4a48e2f33a
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet için OpenClaw katılımcı desteği — Plugin tasarımı gereği açıktır:

- Yalnızca açıkça verilen bir `https://meet.google.com/...` URL'sine katılır.
- Google Meet API aracılığıyla yeni bir Meet alanı oluşturabilir, ardından
  döndürülen URL'ye katılabilir.
- `realtime` ses varsayılan moddur.
- Realtime ses, daha derin akıl yürütme veya araçlar gerektiğinde tam OpenClaw
  ajanını geri çağırabilir.
- Ajanlar katılma davranışını `mode` ile seçer: canlı
  dinleme/konuşarak yanıt verme için `realtime`, tarayıcıyı realtime ses köprüsü
  olmadan katmak/denetlemek için `transcribe` kullanın.
- Kimlik doğrulama, kişisel Google OAuth veya zaten oturum açılmış bir Chrome profili olarak başlar.
- Otomatik rıza duyurusu yoktur.
- Varsayılan Chrome ses arka ucu `BlackHole 2ch`'dir.
- Chrome yerelde veya eşleştirilmiş bir node host üzerinde çalışabilir.
- Twilio, isteğe bağlı PIN veya DTMF dizisiyle birlikte bir arama numarasını kabul eder.
- CLI komutu `googlemeet`'tir; `meet` daha geniş ajan
  telekonferans iş akışları için ayrılmıştır.

## Hızlı başlangıç

Yerel ses bağımlılıklarını yükleyin ve bir arka uç realtime ses sağlayıcısı
yapılandırın. OpenAI varsayılandır; Google Gemini Live da
`realtime.provider: "google"` ile çalışır:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# veya
export GEMINI_API_KEY=...
```

`blackhole-2ch`, `BlackHole 2ch` sanal ses aygıtını yükler. Homebrew'ün
yükleyicisi, macOS aygıtı göstermeden önce yeniden başlatma gerektirir:

```bash
sudo reboot
```

Yeniden başlatmadan sonra iki parçayı da doğrulayın:

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

Kurulum çıktısı ajan tarafından okunabilir ve moda duyarlı olacak şekilde tasarlanmıştır. Chrome
profilini, node sabitlemesini ve realtime Chrome katılımları için BlackHole/SoX ses
köprüsünü ve gecikmeli realtime giriş kontrollerini bildirir. Yalnızca gözlem katılımları için aynı
taşıma katmanını `--mode transcribe` ile kontrol edin; bu mod realtime ses ön koşullarını atlar
çünkü köprü üzerinden dinlemez veya konuşmaz:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Twilio devri yapılandırıldığında kurulum, `voice-call` Plugin'inin,
Twilio kimlik bilgilerinin ve herkese açık Webhook erişiminin hazır olup olmadığını da bildirir.
Bir ajandan katılmasını istemeden önce, her `ok: false` kontrolünü denetlenen taşıma ve mod için
engelleyici olarak ele alın. Betikler veya makine tarafından okunabilir çıktı için
`openclaw googlemeet setup --json` kullanın. Bir ajan denemeden önce belirli bir
taşımayı ön denetimden geçirmek için `--transport chrome`,
`--transport chrome-node` veya `--transport twilio` kullanın.

Twilio için, varsayılan taşıma Chrome olduğunda taşımayı her zaman açıkça ön denetimden geçirin:

```bash
openclaw googlemeet setup --transport twilio
```

Bu, ajan toplantıyı aramaya çalışmadan önce eksik `voice-call` bağlantısını, Twilio kimlik bilgilerini
veya erişilemeyen Webhook erişimini yakalar.

Bir toplantıya katılın:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Veya bir ajanın `google_meet` aracıyla katılmasına izin verin:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Ajanın kullanacağı `google_meet` aracı, macOS olmayan host'larda artifact,
takvim, kurulum, transcribe, Twilio ve `chrome-node` akışları için kullanılabilir kalır. Yerel
Chrome realtime eylemleri burada engellenir çünkü paketlenen realtime Chrome
ses yolu şu anda macOS `BlackHole 2ch`'ye bağlıdır. Linux'ta realtime
Chrome katılımı için `mode: "transcribe"`, Twilio arama girişi veya bir macOS
`chrome-node` host'u kullanın.

Yeni bir toplantı oluşturup katılın:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

API ile oluşturulan odalar için, odanın kapı çalmadan giriş politikasının Google
hesabı varsayılanlarından devralınmak yerine açık olmasını istediğinizde Google Meet
`SpaceConfig.accessType` kullanın:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN`, Meet URL'sine sahip herkesin kapı çalmadan katılmasına izin verir. `TRUSTED`, host
kuruluşun güvenilir kullanıcılarının, davetli harici kullanıcıların ve arama ile katılan kullanıcıların
kapı çalmadan katılmasına izin verir. `RESTRICTED`, kapı çalmadan girişi davetlilerle sınırlar. Bu
ayarlar yalnızca resmi Google Meet API oluşturma yoluna uygulanır; bu yüzden OAuth
kimlik bilgileri yapılandırılmış olmalıdır.

Bu seçenek kullanılabilir olmadan önce Google Meet kimliğini doğruladıysanız, Google OAuth
rıza ekranınıza `meetings.space.settings` kapsamını ekledikten sonra
`openclaw googlemeet auth login --json` komutunu yeniden çalıştırın.

Katılmadan yalnızca URL'yi oluşturun:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` iki yola sahiptir:

- API oluşturma: Google Meet OAuth kimlik bilgileri yapılandırıldığında kullanılır. Bu,
  en deterministik yoldur ve tarayıcı UI durumuna bağlı değildir.
- Tarayıcı geri dönüşü: OAuth kimlik bilgileri olmadığında kullanılır. OpenClaw,
  sabitlenmiş Chrome node'unu kullanır, `https://meet.google.com/new` adresini açar,
  Google'ın gerçek toplantı kodu URL'sine yönlendirmesini bekler, ardından bu URL'yi döndürür. Bu yol,
  node üzerindeki OpenClaw Chrome profilinin Google'da zaten oturum açmış olmasını gerektirir.
  Tarayıcı otomasyonu Meet'in kendi ilk çalıştırma mikrofon istemini işler; bu istem
  Google oturum açma hatası olarak ele alınmaz.
  Katılma ve oluşturma akışları ayrıca yeni bir tane açmadan önce mevcut bir Meet sekmesini
  yeniden kullanmaya çalışır. Eşleştirme `authuser` gibi zararsız URL sorgu dizelerini yok sayar; bu yüzden
  ajan yeniden denemesi ikinci bir Chrome sekmesi oluşturmak yerine zaten açık olan toplantıya odaklanmalıdır.

Komut/araç çıktısı bir `source` alanı (`api` veya `browser`) içerir; böylece ajanlar
hangi yolun kullanıldığını açıklayabilir. `create` varsayılan olarak yeni toplantıya katılır ve
`joined: true` ile katılım oturumunu döndürür. Yalnızca URL üretmek için
CLI'da `create --no-join` kullanın veya araca `"join": false` geçirin.

Veya bir ajana şunu söyleyin: "Bir Google Meet oluştur, realtime sesle katıl ve
bağlantıyı bana gönder." Ajan `action: "create"` ile `google_meet` çağırmalı ve
ardından döndürülen `meetingUri` değerini paylaşmalıdır.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Yalnızca gözlem/tarayıcı denetimli katılım için `"mode": "transcribe"` ayarlayın. Bu,
çift yönlü realtime model köprüsünü başlatmaz, BlackHole veya SoX gerektirmez
ve toplantıya konuşarak yanıt vermez. Bu moddaki Chrome katılımları ayrıca
OpenClaw'ın mikrofon/kamera izin verme adımından ve Meet **Use
microphone** yolundan kaçınır. Meet bir ses seçimi ara ekranı gösterirse otomasyon
mikrofonsuz yolu dener; aksi halde yerel mikrofonu açmak yerine manuel eylem bildirir.
Transcribe modunda yönetilen Chrome taşımaları ayrıca en iyi çaba Meet altyazı gözlemcisi kurar.
`googlemeet status --json` ve `googlemeet doctor`, operatörlerin tarayıcının çağrıya
katılıp katılmadığını ve Meet altyazılarının metin üretip üretmediğini anlayabilmesi için
`captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
ve kısa bir `recentTranscript` kuyruğunu gösterir.
Evet/hayır yoklamasına ihtiyacınız olduğunda
`openclaw googlemeet test-listen <meet-url> --transport chrome-node` kullanın:
transcribe modunda katılır, yeni altyazı veya transcript hareketini bekler ve
`listenVerified`, `listenTimedOut`, manuel eylem alanları ve en son altyazı sağlığını döndürür.

Realtime oturumlar sırasında `google_meet` durumu, `inCall`, `manualActionRequired`,
`providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`,
son giriş/çıkış zaman damgaları, bayt sayaçları ve köprü kapalı durumu gibi tarayıcı ve ses köprüsü
sağlığını içerir. Güvenli bir Meet sayfa istemi görünürse, tarayıcı otomasyonu yapabildiğinde onu işler.
Oturum açma, host kabulü ve tarayıcı/OS izin istemleri, ajanın aktarması için bir neden ve
mesajla manuel eylem olarak bildirilir. Yönetilen Chrome oturumları yalnızca tarayıcı sağlığı
`inCall: true` bildirdikten sonra giriş veya test ifadesini yayar; aksi halde durum
`speechReady: false` bildirir ve konuşma denemesi, ajan toplantıda konuşmuş gibi davranmak yerine
engellenir.

Yerel Chrome katılımları, oturum açılmış OpenClaw tarayıcı profili üzerinden gerçekleşir. Realtime mod,
OpenClaw tarafından kullanılan mikrofon/hoparlör yolu için `BlackHole 2ch` gerektirir. Temiz çift yönlü ses için
ayrı sanal aygıtlar veya Loopback tarzı bir grafik kullanın; tek bir BlackHole aygıtı ilk smoke test için yeterlidir
ancak yankı yapabilir.

### Yerel gateway + Parallels Chrome

Yalnızca VM'in Chrome'a sahip olmasını sağlamak için bir macOS VM içinde tam bir OpenClaw Gateway
veya model API anahtarına ihtiyacınız **yoktur**. Gateway'i ve ajanı yerelde çalıştırın, ardından VM'de bir
node host çalıştırın. VM'de paketlenmiş Plugin'i bir kez etkinleştirerek node'un
Chrome komutunu duyurmasını sağlayın:

Nerede ne çalışır:

- Gateway host: OpenClaw Gateway, ajan çalışma alanı, model/API anahtarları, realtime
  sağlayıcı ve Google Meet Plugin yapılandırması.
- Parallels macOS VM: OpenClaw CLI/node host, Google Chrome, SoX, BlackHole 2ch
  ve Google'da oturum açmış bir Chrome profili.
- VM'de gerekmeyenler: Gateway hizmeti, ajan yapılandırması, OpenAI/GPT anahtarı veya model
  sağlayıcı kurulumu.

VM bağımlılıklarını yükleyin:

```bash
brew install blackhole-2ch sox
```

BlackHole'u yükledikten sonra macOS'un `BlackHole 2ch`'yi göstermesi için VM'i yeniden başlatın:

```bash
sudo reboot
```

Yeniden başlatmadan sonra VM'in ses aygıtını ve SoX komutlarını görebildiğini doğrulayın:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

VM'de OpenClaw'ı yükleyin veya güncelleyin, ardından paketlenmiş Plugin'i orada etkinleştirin:

```bash
openclaw plugins enable google-meet
```

VM'de node host'u başlatın:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` bir LAN IP ise ve TLS kullanmıyorsanız, node bu güvenilir özel ağ için
açıkça izin vermediğiniz sürece düz metin WebSocket bağlantısını reddeder:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Node'u LaunchAgent olarak yüklerken aynı ortam değişkenini kullanın:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`, süreç ortamıdır; bir `openclaw.json` ayarı değildir.
`openclaw node install`, yükleme komutunda mevcut olduğunda bunu LaunchAgent
ortamında saklar.

Node'u Gateway host'undan onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway'in node'u gördüğünü ve node'un hem `googlemeet.chrome`
hem de tarayıcı yeteneği/`browser.proxy` duyurduğunu doğrulayın:

```bash
openclaw nodes status
```

Meet'i Gateway host'unda bu node üzerinden yönlendirin:

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

Şimdi Gateway host'undan normal şekilde katılın:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

veya ajandan `transport: "chrome-node"` ile `google_meet` aracını kullanmasını isteyin.

Oturum oluşturan veya yeniden kullanan, bilinen bir ifadeyi söyleyen
ve oturum sağlığını yazdıran tek komutluk smoke test için:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Gerçek zamanlı katılım sırasında OpenClaw tarayıcı otomasyonu konuk adını doldurur,
Join/Ask to join düğmesine tıklar ve bu istem göründüğünde Meet'in ilk çalıştırma
"Use microphone" seçimini kabul eder. Yalnızca gözlem amaçlı katılım veya yalnızca
tarayıcıyla toplantı oluşturma sırasında, bu seçenek kullanılabiliyorsa aynı istemi
mikrofonsuz şekilde geçmeye devam eder. Tarayıcı profili oturum açmamışsa, Meet
toplantı sahibinin kabulünü bekliyorsa, Chrome gerçek zamanlı katılım için
mikrofon/kamera iznine ihtiyaç duyuyorsa veya Meet otomasyonun çözemediği bir
istemde takılı kaldıysa, katılım/test-konuşma sonucu `manualActionRequired: true`
değerini `manualActionReason` ve `manualActionMessage` ile bildirir. Agent'lar
katılımı yeniden denemeyi durdurmalı, bu tam mesajı mevcut `browserUrl`/`browserTitle`
ile birlikte bildirmeli ve yalnızca manuel tarayıcı eylemi tamamlandıktan sonra
yeniden denemelidir.

`chromeNode.node` atlanırsa OpenClaw yalnızca tam olarak bir bağlı node hem
`googlemeet.chrome` hem de tarayıcı denetimi sunduğunda otomatik seçim yapar.
Birden fazla uygun node bağlıysa `chromeNode.node` değerini node kimliği,
görünen ad veya uzak IP olarak ayarlayın.

Yaygın hata denetimleri:

- `Configured Google Meet node ... is not usable: offline`: sabitlenen node
  Gateway tarafından biliniyor ancak kullanılamıyor. Agent'lar bu node'u
  kullanılabilir bir Chrome host'u olarak değil, tanılama durumu olarak ele
  almalı ve kullanıcı bunu istemedikçe başka bir taşıma yöntemine geri dönmek
  yerine kurulum engelleyicisini bildirmelidir.
- `No connected Google Meet-capable node`: VM içinde `openclaw node run` başlatın,
  eşleştirmeyi onaylayın ve VM içinde `openclaw plugins enable google-meet` ile
  `openclaw plugins enable browser` komutlarının çalıştırıldığından emin olun.
  Ayrıca Gateway host'unun her iki node komutuna da
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` ile izin
  verdiğini doğrulayın.
- `BlackHole 2ch audio device not found`: denetlenen host'a `blackhole-2ch`
  yükleyin ve yerel Chrome sesini kullanmadan önce yeniden başlatın.
- `BlackHole 2ch audio device not found on the node`: VM içine `blackhole-2ch`
  yükleyin ve VM'yi yeniden başlatın.
- Chrome açılıyor ancak katılamıyorsa: VM içindeki tarayıcı profilinde oturum
  açın veya konuk katılımı için `chrome.guestName` değerini ayarlı tutun. Konuk
  otomatik katılımı, node tarayıcı proxy'si üzerinden OpenClaw tarayıcı
  otomasyonunu kullanır; node tarayıcı yapılandırmasının istediğiniz profili
  işaret ettiğinden emin olun, örneğin `browser.defaultProfile: "user"` veya
  adlandırılmış mevcut oturum profili.
- Yinelenen Meet sekmeleri: `chrome.reuseExistingTab: true` etkin kalsın.
  OpenClaw yeni bir sekme açmadan önce aynı Meet URL'si için mevcut bir sekmeyi
  etkinleştirir ve tarayıcıyla toplantı oluşturma, başka bir tane açmadan önce
  sürmekte olan bir `https://meet.google.com/new` veya Google hesabı istemi
  sekmesini yeniden kullanır.
- Ses yok: Meet içinde mikrofon/hoparlör sesini OpenClaw tarafından kullanılan
  sanal ses aygıtı yolu üzerinden yönlendirin; temiz çift yönlü ses için ayrı
  sanal aygıtlar veya Loopback tarzı yönlendirme kullanın.

## Kurulum notları

Chrome gerçek zamanlı varsayılanı iki harici araç kullanır:

- `sox`: komut satırı ses yardımcı programı. Plugin, varsayılan 24 kHz PCM16 ses
  köprüsü için açık CoreAudio aygıt komutları kullanır.
- `blackhole-2ch`: macOS sanal ses sürücüsü. Chrome/Meet'in yönlendirebileceği
  `BlackHole 2ch` ses aygıtını oluşturur.

OpenClaw iki paketi de paketlemez veya yeniden dağıtmaz. Dokümanlar,
kullanıcılardan bunları Homebrew üzerinden host bağımlılıkları olarak
yüklemelerini ister. SoX `LGPL-2.0-only AND GPL-2.0-only` lisanslıdır; BlackHole
GPL-3.0 lisanslıdır. BlackHole'u OpenClaw ile birlikte paketleyen bir kurulum
programı veya appliance oluşturursanız BlackHole'un upstream lisans koşullarını
inceleyin ya da Existential Audio'dan ayrı bir lisans alın.

## Taşıma yöntemleri

### Chrome

Chrome taşıması, Meet URL'sini OpenClaw tarayıcı denetimi üzerinden açar ve
oturum açmış OpenClaw tarayıcı profili olarak katılır. macOS'te Plugin başlatmadan
önce `BlackHole 2ch` denetimi yapar. Yapılandırılmışsa Chrome'u açmadan önce bir
ses köprüsü sağlık komutu ve başlangıç komutu da çalıştırır. Chrome/ses Gateway
host'unda çalışıyorsa `chrome` kullanın; Chrome/ses Parallels macOS VM gibi
eşleştirilmiş bir node üzerinde çalışıyorsa `chrome-node` kullanın. Yerel Chrome
için profili `browser.defaultProfile` ile seçin; `chrome.browserProfile`,
`chrome-node` host'larına aktarılır.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome mikrofon ve hoparlör sesini yerel OpenClaw ses köprüsü üzerinden
yönlendirin. `BlackHole 2ch` yüklü değilse katılım, ses yolu olmadan sessizce
katılmak yerine bir kurulum hatasıyla başarısız olur.

### Twilio

Twilio taşıması, Voice Call Plugin'e devredilen katı bir arama planıdır. Telefon
numaraları için Meet sayfalarını ayrıştırmaz.

Chrome katılımı kullanılamadığında veya telefonla arama yedeği istediğinizde bunu
kullanın. Google Meet toplantı için bir telefonla arama numarası ve PIN sunmalıdır;
OpenClaw bunları Meet sayfasından keşfetmez.

Voice Call Plugin'i Chrome node üzerinde değil, Gateway host'unda etkinleştirin:

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

Twilio kimlik bilgilerini ortam veya yapılandırma üzerinden sağlayın. Ortam,
gizli bilgileri `openclaw.json` dışında tutar:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call` etkinleştirildikten sonra Gateway'i yeniden başlatın veya yeniden
yükleyin; Plugin yapılandırma değişiklikleri yeniden yüklenene kadar zaten çalışan
bir Gateway sürecinde görünmez.

Ardından doğrulayın:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio devri bağlandığında `googlemeet setup`, başarılı
`twilio-voice-call-plugin`, `twilio-voice-call-credentials` ve
`twilio-voice-call-webhook` denetimlerini içerir.

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

## OAuth ve ön kontrol

OAuth, Meet bağlantısı oluşturmak için isteğe bağlıdır çünkü `googlemeet create`
tarayıcı otomasyonuna geri dönebilir. Resmi API ile oluşturma, alan çözümleme
veya Meet Media API ön kontrol denetimleri istediğinizde OAuth yapılandırın.

Google Meet API erişimi kullanıcı OAuth'u kullanır: bir Google Cloud OAuth
istemcisi oluşturun, gerekli kapsamları isteyin, bir Google hesabını yetkilendirin
ve ardından ortaya çıkan yenileme token'ını Google Meet Plugin yapılandırmasında
saklayın ya da `OPENCLAW_GOOGLE_MEET_*` ortam değişkenlerini sağlayın.

OAuth, Chrome katılım yolunun yerine geçmez. Chrome ve Chrome-node taşımaları,
tarayıcı katılımı kullandığınızda hâlâ oturum açmış bir Chrome profili,
BlackHole/SoX ve bağlı bir node üzerinden katılır. OAuth yalnızca resmi Google
Meet API yolu içindir: toplantı alanları oluşturma, alanları çözümleme ve Meet
Media API ön kontrol denetimleri çalıştırma.

### Google kimlik bilgileri oluşturma

Google Cloud Console içinde:

1. Bir Google Cloud projesi oluşturun veya seçin.
2. Bu proje için **Google Meet REST API**'yi etkinleştirin.
3. OAuth izin ekranını yapılandırın.
   - **Internal**, bir Google Workspace kuruluşu için en basit seçenektir.
   - **External**, kişisel/test kurulumları için çalışır; uygulama Testing
     durumundayken uygulamayı yetkilendirecek her Google hesabını test kullanıcısı
     olarak ekleyin.
4. OpenClaw'ın istediği kapsamları ekleyin:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Bir OAuth istemci kimliği oluşturun.
   - Uygulama türü: **Web application**.
   - Yetkilendirilmiş yönlendirme URI'si:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. İstemci kimliğini ve istemci gizli anahtarını kopyalayın.

`meetings.space.created`, Google Meet `spaces.create` tarafından gereklidir.
`meetings.space.readonly`, OpenClaw'ın Meet URL'lerini/kodlarını alanlara
çözümlemesini sağlar. `meetings.space.settings`, OpenClaw'ın API oda oluşturma
sırasında `accessType` gibi `SpaceConfig` ayarlarını geçirmesini sağlar.
`meetings.conference.media.readonly`, Meet Media API ön kontrolü ve medya işleri
içindir; Google, gerçek Media API kullanımı için Developer Preview kaydı
isteyebilir. Yalnızca tarayıcı tabanlı Chrome katılımlarına ihtiyacınız varsa
OAuth'u tamamen atlayın.

### Yenileme token'ını oluşturma

`oauth.clientId` ve isteğe bağlı olarak `oauth.clientSecret` yapılandırın ya da
bunları ortam değişkenleri olarak geçirin, ardından şunu çalıştırın:

```bash
openclaw googlemeet auth login --json
```

Komut, yenileme token'ı içeren bir `oauth` yapılandırma bloğu yazdırır. PKCE,
`http://localhost:8085/oauth2callback` üzerinde localhost callback'i ve
`--manual` ile manuel kopyala/yapıştır akışı kullanır.

Örnekler:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Tarayıcı yerel callback'e ulaşamadığında manuel modu kullanın:

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

Yenileme token'ını yapılandırmada istemediğinizde ortam değişkenlerini tercih
edin. Hem yapılandırma hem de ortam değerleri varsa Plugin önce yapılandırmayı,
ardından ortam yedeğini çözümler.

OAuth izni Meet alanı oluşturma, Meet alanı okuma erişimi ve Meet konferans medya
okuma erişimini içerir. Toplantı oluşturma desteği mevcut olmadan önce kimlik
doğruladıysanız yenileme token'ının `meetings.space.created` kapsamına sahip
olması için `openclaw googlemeet auth login --json` komutunu yeniden çalıştırın.

### OAuth'u doctor ile doğrulama

Hızlı, gizli bilgi içermeyen bir sağlık denetimi istediğinizde OAuth doctor'ı
çalıştırın:

```bash
openclaw googlemeet doctor --oauth --json
```

Bu, Chrome runtime'ını yüklemez veya bağlı bir Chrome node gerektirmez. OAuth
yapılandırmasının var olduğunu ve yenileme token'ının bir erişim token'ı
oluşturabildiğini denetler. JSON raporu yalnızca `ok`, `configured`,
`tokenSource`, `expiresAt` gibi durum alanlarını ve denetim mesajlarını içerir;
erişim token'ını, yenileme token'ını veya istemci gizli anahtarını yazdırmaz.

Yaygın sonuçlar:

| Denetim             | Anlam                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`      | `oauth.clientId` artı `oauth.refreshToken` veya önbelleğe alınmış erişim token'ı mevcut. |
| `oauth-token`       | Önbelleğe alınmış erişim token'ı hâlâ geçerli veya yenileme token'ı yeni bir erişim token'ı oluşturdu. |
| `meet-spaces-get`   | İsteğe bağlı `--meeting` denetimi mevcut bir Meet alanını çözümledi.                     |
| `meet-spaces-create` | İsteğe bağlı `--create-space` denetimi yeni bir Meet alanı oluşturdu.                   |

Google Meet API etkinleştirmesini ve `spaces.create` kapsamını da kanıtlamak için
yan etkili oluşturma denetimini çalıştırın:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` tek kullanımlık bir Meet URL'si oluşturur. Google Cloud projesinde Meet API'nin etkin olduğunu ve yetkilendirilmiş hesabın `meetings.space.created` kapsamına sahip olduğunu doğrulamanız gerektiğinde bunu kullanın.

Mevcut bir toplantı alanı için okuma erişimini kanıtlamak üzere:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` ve `resolve-space`, yetkilendirilmiş Google hesabının erişebildiği mevcut bir alana okuma erişimini kanıtlar. Bu kontrollerden gelen bir `403` genellikle Google Meet REST API'nin devre dışı olduğu, onaylanmış yenileme token'ında gerekli kapsamın eksik olduğu veya Google hesabının ilgili Meet alanına erişemediği anlamına gelir. Yenileme token'ı hatası, `openclaw googlemeet auth login --json` komutunu yeniden çalıştırmanız ve yeni `oauth` bloğunu saklamanız gerektiği anlamına gelir.

Tarayıcı yedek yolu için OAuth kimlik bilgileri gerekmez. Bu modda Google kimlik doğrulaması OpenClaw yapılandırmasından değil, seçilen düğümde oturum açmış Chrome profilinden gelir.

Bu ortam değişkenleri yedek değer olarak kabul edilir:

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

Medya işinden önce ön denetimi çalıştırın:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet konferans kayıtlarını oluşturduktan sonra toplantı yapıtlarını ve katılımı listeleyin:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting` ile `artifacts` ve `attendance` varsayılan olarak en son konferans kaydını kullanır. O toplantı için saklanan her kaydı istediğinizde `--all-conference-records` geçirin.

Takvim araması, Meet yapıtlarını okumadan önce toplantı URL'sini Google Calendar'dan çözümleyebilir:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today`, Google Meet bağlantısı olan bir Calendar etkinliği için bugünün `primary` takviminde arama yapar. Eşleşen etkinlik metnini aramak için `--event <query>`, birincil olmayan bir takvim için `--calendar <id>` kullanın. Takvim araması, Calendar etkinlikleri salt okunur kapsamını içeren yeni bir OAuth oturumu açmayı gerektirir.
`calendar-events`, eşleşen Meet etkinliklerinin önizlemesini gösterir ve `latest`, `artifacts`, `attendance` veya `export` tarafından seçilecek etkinliği işaretler.

Konferans kaydı kimliğini zaten biliyorsanız, doğrudan ona başvurun:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Görüşmeden sonra odayı kapatmak istediğinizde API ile oluşturulmuş bir alan için etkin konferansı sonlandırın:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Bu, Google Meet `spaces.endActiveConference` çağrısı yapar ve yetkilendirilmiş hesabın yönetebildiği bir alan için `meetings.space.created` kapsamına sahip OAuth gerektirir. OpenClaw bir Meet URL'si, toplantı kodu veya `spaces/{id}` girdisi kabul eder ve etkin konferansı sonlandırmadan önce bunu API alan kaynağına çözümler.
Bu, `googlemeet leave` komutundan ayrıdır: `leave` OpenClaw'ın yerel/oturum katılımını durdururken, `end-active-conference` Google Meet'ten alanın etkin konferansını sonlandırmasını ister.

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

`artifacts`, Google toplantı için bunları sunduğunda konferans kaydı meta verilerinin yanı sıra katılımcı, kayıt, transkript, yapılandırılmış transkript girdisi ve akıllı not kaynak meta verilerini döndürür. Büyük toplantılarda girdi aramasını atlamak için `--no-transcript-entries` kullanın. `attendance`, katılımcıları ilk/son görülme zamanları, toplam oturum süresi, geç/erken ayrılma bayrakları ve oturum açmış kullanıcıya veya görünen ada göre birleştirilmiş yinelenen katılımcı kaynaklarıyla katılımcı oturumu satırlarına genişletir. Ham katılımcı kaynaklarını ayrı tutmak için `--no-merge-duplicates`, geç kalma algılamasını ayarlamak için `--late-after-minutes` ve erken ayrılma algılamasını ayarlamak için `--early-before-minutes` geçirin.

`export`, `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` ve `manifest.json` içeren bir klasör yazar. `manifest.json`, seçilen girdiyi, dışa aktarma seçeneklerini, konferans kayıtlarını, çıktı dosyalarını, sayıları, token kaynağını, kullanıldıysa Calendar etkinliğini ve kısmi alma uyarılarını kaydeder. Klasörün yanına taşınabilir bir arşiv de yazmak için `--zip` geçirin. Bağlantılı transkript ve akıllı not Google Docs metnini Google Drive `files.export` üzerinden dışa aktarmak için `--include-doc-bodies` geçirin; bu, Drive Meet salt okunur kapsamını içeren yeni bir OAuth oturumu açmayı gerektirir. `--include-doc-bodies` olmadan dışa aktarmalar yalnızca Meet meta verilerini ve yapılandırılmış transkript girdilerini içerir. Google akıllı not listeleme, transkript girdisi veya Drive belge gövdesi hatası gibi kısmi bir yapıt hatası döndürürse, özet ve manifest tüm dışa aktarmayı başarısız kılmak yerine uyarıyı saklar.
Aynı yapıt/katılım verilerini almak ve klasörü ya da ZIP'i oluşturmadan manifest JSON'unu yazdırmak için `--dry-run` kullanın. Bu, büyük bir dışa aktarma yazmadan önce veya bir ajanın yalnızca sayılara, seçilen kayıtlara ve uyarılara ihtiyaç duyduğu durumlarda kullanışlıdır.

Ajanlar aynı paketi `google_meet` aracıyla da oluşturabilir:

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

Ajanlar açık erişim ilkesiyle API destekli bir oda da oluşturabilir:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
  "accessType": "OPEN"
}
```

Ayrıca bilinen bir oda için etkin konferansı sonlandırabilirler:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Önce dinleme doğrulaması için ajanlar, toplantının işe yaradığını iddia etmeden önce `test_listen` kullanmalıdır:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Korunan canlı duman testini gerçek ve saklanan bir toplantıya karşı çalıştırın:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Canlı önce dinle tarayıcı yoklamasını, birinin Meet altyazıları kullanılabilirken konuşacağı bir toplantıya karşı çalıştırın:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Canlı duman testi ortamı:

- `OPENCLAW_LIVE_TEST=1` korunan canlı testleri etkinleştirir.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` saklanan bir Meet URL'sini, kodunu veya
  `spaces/{id}` değerini gösterir.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` veya `GOOGLE_MEET_CLIENT_ID` OAuth istemci kimliğini sağlar.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` veya `GOOGLE_MEET_REFRESH_TOKEN` yenileme token'ını sağlar.
- İsteğe bağlı: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ve
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`, `OPENCLAW_` öneki olmadan aynı yedek adları kullanır.

Temel yapıt/katılım canlı duman testi `https://www.googleapis.com/auth/meetings.space.readonly` ve `https://www.googleapis.com/auth/meetings.conference.media.readonly` gerektirir. Takvim araması `https://www.googleapis.com/auth/calendar.events.readonly` gerektirir. Drive belge gövdesi dışa aktarımı `https://www.googleapis.com/auth/drive.meet.readonly` gerektirir.

Yeni bir Meet alanı oluşturun:

```bash
openclaw googlemeet create
```

Komut yeni `meeting uri`, kaynağı ve katılma oturumunu yazdırır. OAuth kimlik bilgileriyle resmi Google Meet API'yi kullanır. OAuth kimlik bilgileri olmadan, sabitlenmiş Chrome düğümünün oturum açmış tarayıcı profilini yedek yol olarak kullanır. Ajanlar tek adımda oluşturmak ve katılmak için `google_meet` aracını `action: "create"` ile kullanabilir. Yalnızca URL oluşturmak için `"join": false` geçirin.

Tarayıcı yedek yolundan örnek JSON çıktısı:

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

Tarayıcı yedek yolu, URL'yi oluşturamadan önce Google oturum açma veya Meet izin engelleyicisiyle karşılaşırsa, Gateway yöntemi başarısız bir yanıt döndürür ve `google_meet` aracı düz bir dize yerine yapılandırılmış ayrıntılar döndürür:

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

Bir ajan `manualActionRequired: true` gördüğünde, `manualActionMessage` ile tarayıcı düğüm/sekme bağlamını bildirmeli ve operatör tarayıcı adımını tamamlayana kadar yeni Meet sekmeleri açmayı durdurmalıdır.

API ile oluşturma için örnek JSON çıktısı:

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

Meet oluşturma varsayılan olarak katılır. Chrome veya Chrome-node taşıması, tarayıcı üzerinden katılmak için yine de oturum açmış bir Google Chrome profiline ihtiyaç duyar. Profilde oturum kapalıysa, OpenClaw `manualActionRequired: true` veya bir tarayıcı yedek yolu hatası bildirir ve yeniden denemeden önce operatörden Google oturum açma işlemini tamamlamasını ister.

`preview.enrollmentAcknowledged: true` değerini yalnızca Cloud projenizin, OAuth sorumlunuzun ve toplantı katılımcılarının Meet medya API'leri için Google Workspace Developer Preview Program'a kaydolduğunu doğruladıktan sonra ayarlayın.

## Yapılandırma

Yaygın Chrome gerçek zamanlı yolu yalnızca Plugin'in etkin olmasına, BlackHole'a, SoX'a ve bir arka uç gerçek zamanlı ses sağlayıcısı anahtarına ihtiyaç duyar. OpenAI varsayılandır; Google Gemini Live kullanmak için `realtime.provider: "google"` ayarlayın:

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
- `chromeNode.node`: `chrome-node` için isteğe bağlı node kimliği/adı/IP adresi
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: oturum açmamış Meet misafir ekranında
  kullanılan ad
- `chrome.autoJoin: true`: `chrome-node` üzerinde OpenClaw tarayıcı otomasyonu
  aracılığıyla en iyi çabayla misafir adını doldurma ve Join Now tıklaması
- `chrome.reuseExistingTab: true`: kopyalarını açmak yerine mevcut bir Meet
  sekmesini etkinleştir
- `chrome.waitForInCallMs: 20000`: gerçek zamanlı giriş tetiklenmeden önce Meet
  sekmesinin görüşmede olduğunu bildirmesini bekle
- `chrome.audioFormat: "pcm16-24khz"`: komut çifti ses biçimi. Hâlâ telefon sesi
  yayan eski/özel komut çiftleri için yalnızca `"g711-ulaw-8khz"` kullanın.
- `chrome.audioInputCommand`: CoreAudio `BlackHole 2ch` kaynağından okuyan ve
  sesi `chrome.audioFormat` biçiminde yazan SoX komutu
- `chrome.audioOutputCommand`: sesi `chrome.audioFormat` biçiminde okuyan ve
  CoreAudio `BlackHole 2ch` hedefine yazan SoX komutu
- `chrome.bargeInInputCommand`: asistan oynatımı etkinken insan müdahalesi
  algılama için işaretli 16 bit little-endian mono PCM yazan isteğe bağlı yerel
  mikrofon komutu. Bu şu anda Gateway tarafından barındırılan `chrome` komut
  çifti köprüsü için geçerlidir.
- `chrome.bargeInRmsThreshold: 650`: `chrome.bargeInInputCommand` üzerinde insan
  kesintisi sayılan RMS seviyesi
- `chrome.bargeInPeakThreshold: 2500`: `chrome.bargeInInputCommand` üzerinde
  insan kesintisi sayılan tepe seviyesi
- `chrome.bargeInCooldownMs: 900`: yinelenen insan kesintisi temizlemeleri
  arasındaki minimum gecikme
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: daha derin yanıtlar için `openclaw_agent_consult` ile
  kısa sözlü yanıtlar
- `realtime.introMessage`: gerçek zamanlı köprü bağlandığında kısa sözlü
  hazırlık denetimi; sessiz katılmak için bunu `""` olarak ayarlayın
- `realtime.agentId`: `openclaw_agent_consult` için isteğe bağlı OpenClaw aracı
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

`voiceCall.enabled` varsayılan olarak `true` olur; Twilio taşımasıyla gerçek PSTN
aramasını, DTMF'yi ve giriş selamlamasını Voice Call Plugin'e devreder. Voice
Call, gerçek zamanlı medya akışını açmadan önce DTMF dizisini oynatır, ardından
kaydedilen giriş metnini ilk gerçek zamanlı selamlama olarak kullanır.
`voice-call` etkin değilse Google Meet arama planını yine de doğrulayabilir ve
kaydedebilir, ancak Twilio aramasını yapamaz.

## Araç

Aracılar `google_meet` aracını kullanabilir:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Chrome Gateway ana bilgisayarında çalıştığında `transport: "chrome"` kullanın.
Chrome, Parallels VM gibi eşleştirilmiş bir node üzerinde çalıştığında
`transport: "chrome-node"` kullanın. Her iki durumda da gerçek zamanlı model ve
`openclaw_agent_consult` Gateway ana bilgisayarında çalışır, bu nedenle model
kimlik bilgileri orada kalır.

Etkin oturumları listelemek veya bir oturum kimliğini incelemek için
`action: "status"` kullanın. Gerçek zamanlı aracının hemen konuşmasını sağlamak
için `sessionId` ve `message` ile `action: "speak"` kullanın. Oturumu oluşturmak
veya yeniden kullanmak, bilinen bir ifadeyi tetiklemek ve Chrome ana bilgisayarı
bildirebildiğinde `inCall` sağlığını döndürmek için `action: "test_speech"`
kullanın. `test_speech` her zaman `mode: "realtime"` kullanmaya zorlar ve
`mode: "transcribe"` ile çalışması istenirse başarısız olur; çünkü yalnızca
gözlem oturumları kasıtlı olarak konuşma yayamaz. `speechOutputVerified` sonucu,
bu test çağrısı sırasında gerçek zamanlı ses çıkışı baytlarının artmasına
dayanır; bu nedenle daha eski sesi olan yeniden kullanılan bir oturum, yeni ve
başarılı bir konuşma denetimi sayılmaz. Bir oturumu sona ermiş olarak işaretlemek
için `action: "leave"` kullanın.

`status`, kullanılabilir olduğunda Chrome sağlığını içerir:

- `inCall`: Chrome, Meet aramasının içinde görünüyor
- `micMuted`: en iyi çabayla Meet mikrofon durumu
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: konuşma
  çalışmadan önce tarayıcı profilinin manuel oturum açmaya, Meet ana bilgisayar
  kabulüne, izinlere veya tarayıcı denetimi onarımına ihtiyacı var
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: yönetilen
  Chrome konuşmasının şu anda izinli olup olmadığı. `speechReady: false`,
  OpenClaw'ın giriş/test ifadesini ses köprüsüne göndermediği anlamına gelir.
- `providerConnected` / `realtimeReady`: gerçek zamanlı ses köprüsü durumu
- `lastInputAt` / `lastOutputAt`: köprüden görülen veya köprüye gönderilen son
  ses
- `lastSuppressedInputAt` / `suppressedInputBytes`: asistan oynatımı etkinken
  yok sayılan loopback girişi

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Gerçek zamanlı aracı danışması

Chrome gerçek zamanlı modu, canlı bir ses döngüsü için optimize edilmiştir.
Gerçek zamanlı ses sağlayıcısı toplantı sesini duyar ve yapılandırılmış ses
köprüsü üzerinden konuşur. Gerçek zamanlı model daha derin akıl yürütmeye, güncel
bilgiye veya normal OpenClaw araçlarına ihtiyaç duyduğunda
`openclaw_agent_consult` çağırabilir.

Danışma aracı, son toplantı dökümü bağlamıyla normal OpenClaw aracını arka
planda çalıştırır ve gerçek zamanlı ses oturumuna kısa bir sözlü yanıt döndürür.
Ses modeli daha sonra bu yanıtı toplantıda sesli olarak iletebilir. Voice Call
ile aynı paylaşılan gerçek zamanlı danışma aracını kullanır.

Varsayılan olarak danışmalar `main` aracına karşı çalışır. Bir Meet hattının
ayrılmış bir OpenClaw aracı çalışma alanına, model varsayılanlarına, araç
politikasına, belleğe ve oturum geçmişine danışması gerektiğinde
`realtime.agentId` ayarlayın.

`realtime.toolPolicy`, danışma çalışmasını denetler:

- `safe-read-only`: danışma aracını açığa çıkar ve normal aracı `read`,
  `web_search`, `web_fetch`, `x_search`, `memory_search` ve `memory_get` ile
  sınırla.
- `owner`: danışma aracını açığa çıkar ve normal aracın olağan aracı politikasını
  kullanmasına izin ver.
- `none`: danışma aracını gerçek zamanlı ses modeline açığa çıkarma.

Danışma oturum anahtarı Meet oturumu başına kapsamlanır, bu nedenle takip
danışma çağrıları aynı toplantı sırasında önceki danışma bağlamını yeniden
kullanabilir.

Chrome aramaya tamamen katıldıktan sonra sözlü bir hazırlık denetimini zorlamak
için:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Tam katıl-ve-konuş denemesi için:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Canlı test kontrol listesi

Bir toplantıyı gözetimsiz bir aracıya devretmeden önce bu sırayı kullanın:

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
- Seçilen node hem `googlemeet.chrome` hem de `browser.proxy` bildirir.
- Meet sekmesi aramaya katılır ve `test-speech`, `inCall: true` ile Chrome
  sağlığını döndürür.

Parallels macOS VM gibi uzak bir Chrome ana bilgisayarı için Gateway'i veya VM'yi
güncelledikten sonraki en kısa güvenli denetim şudur:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Bu, bir aracı gerçek bir toplantı sekmesi açmadan önce Gateway Plugin'in
yüklendiğini, VM node'unun güncel token ile bağlı olduğunu ve Meet ses köprüsünün
kullanılabilir olduğunu kanıtlar.

Twilio denemesi için telefonla katılma ayrıntılarını gösteren bir toplantı
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
  `twilio-voice-call-credentials` ve `twilio-voice-call-webhook` denetimlerini
  içerir.
- Gateway yeniden yüklendikten sonra CLI'da `voicecall` kullanılabilir.
- Döndürülen oturumda `transport: "twilio"` ve bir `twilio.voiceCallId` bulunur.
- `openclaw logs --follow`, gerçek zamanlı TwiML'den önce DTMF TwiML'nin
  sunulduğunu, ardından ilk selamlaması kuyruğa alınmış bir gerçek zamanlı köprü
  olduğunu gösterir.
- `googlemeet leave <sessionId>` devredilen sesli aramayı kapatır.

## Sorun giderme

### Aracı Google Meet aracını göremiyor

Plugin'in Gateway yapılandırmasında etkin olduğunu doğrulayın ve Gateway'i
yeniden yükleyin:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

`plugins.entries.google-meet` öğesini yeni düzenlediyseniz Gateway'i yeniden
başlatın veya yeniden yükleyin. Çalışan aracı yalnızca geçerli Gateway işlemi
tarafından kaydedilen Plugin araçlarını görür.

macOS olmayan Gateway ana bilgisayarlarında aracıya dönük `google_meet` aracı
görünür kalır, ancak yerel Chrome gerçek zamanlı eylemleri ses köprüsüne
ulaşmadan önce engellenir. Yerel Chrome gerçek zamanlı sesi şu anda macOS
`BlackHole 2ch` bağımlıdır; bu nedenle Linux aracıları varsayılan yerel Chrome
gerçek zamanlı yolu yerine `mode: "transcribe"`, Twilio telefonla katılımını veya
bir macOS `chrome-node` ana bilgisayarını kullanmalıdır.

### Bağlı Google Meet uyumlu node yok

Node ana bilgisayarında şunu çalıştırın:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway ana bilgisayarında node'u onaylayın ve komutları doğrulayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node bağlı olmalı ve `browser.proxy` ile birlikte `googlemeet.chrome` listelemelidir.
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

`googlemeet setup`, `chrome-node-connected` denetiminde başarısız olursa veya
Gateway günlüğü `gateway token mismatch` bildirirse, node'u güncel Gateway token
ile yeniden kurun veya yeniden başlatın. Bir LAN Gateway için bu genellikle şu
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

### Tarayıcı açılıyor ancak aracı katılamıyor

Yalnızca gözlem katılımları için `googlemeet test-listen` veya gerçek zamanlı
katılımlar için `googlemeet test-speech` çalıştırın, ardından döndürülen Chrome
sağlığını inceleyin. Herhangi bir yoklama `manualActionRequired: true`
bildirirse operatöre `manualActionMessage` gösterin ve tarayıcı eylemi
tamamlanana kadar yeniden denemeyi durdurun.

Yaygın manuel eylemler:

- Chrome profiline oturum açın.
- Misafiri Meet ana bilgisayar hesabından kabul edin.
- Chrome'un yerel izin istemi göründüğünde Chrome mikrofon/kamera izinlerini
  verin.
- Takılmış bir Meet izin iletişim kutusunu kapatın veya onarın.

Meet "İnsanların toplantıda sizi duymasını ister misiniz?" gösterdiği için bunu "oturum açılmadı" olarak bildirmeyin. Bu, Meet'in ses seçimi ara ekranıdır; OpenClaw kullanılabilir olduğunda tarayıcı otomasyonu üzerinden **Mikrofonu kullan** seçeneğine tıklar ve gerçek toplantı durumunu beklemeyi sürdürür. Yalnızca oluşturma amaçlı tarayıcı geri dönüşünde, URL oluşturmak gerçek zamanlı ses yolunu gerektirmediği için OpenClaw **Mikrofon olmadan devam et** seçeneğine tıklayabilir.

### Toplantı oluşturma başarısız oluyor

`googlemeet create`, OAuth kimlik bilgileri yapılandırıldığında önce Google Meet API `spaces.create` endpoint'ini kullanır. OAuth kimlik bilgileri yoksa sabitlenmiş Chrome Node tarayıcısına geri döner. Şunları doğrulayın:

- API ile oluşturma için: `oauth.clientId` ve `oauth.refreshToken` yapılandırılmıştır veya eşleşen `OPENCLAW_GOOGLE_MEET_*` ortam değişkenleri mevcuttur.
- API ile oluşturma için: refresh token, oluşturma desteği eklendikten sonra üretilmiştir. Daha eski token'larda `meetings.space.created` scope'u eksik olabilir; `openclaw googlemeet auth login --json` komutunu yeniden çalıştırın ve Plugin yapılandırmasını güncelleyin.
- Tarayıcı geri dönüşü için: `defaultTransport: "chrome-node"` ve `chromeNode.node`, `browser.proxy` ve `googlemeet.chrome` bulunan bağlı bir Node'a işaret eder.
- Tarayıcı geri dönüşü için: o Node'daki OpenClaw Chrome profili Google'da oturum açmıştır ve `https://meet.google.com/new` adresini açabilir.
- Tarayıcı geri dönüşü için: yeniden denemeler yeni sekme açmadan önce mevcut bir `https://meet.google.com/new` sekmesini veya Google hesabı istemi sekmesini yeniden kullanır. Bir ajan zaman aşımına uğrarsa, elle başka bir Meet sekmesi açmak yerine araç çağrısını yeniden deneyin.
- Tarayıcı geri dönüşü için: araç `manualActionRequired: true` döndürürse operatöre yol göstermek için döndürülen `browser.nodeId`, `browser.targetId`, `browserUrl` ve `manualActionMessage` değerlerini kullanın. Bu eylem tamamlanana kadar döngü içinde yeniden denemeyin.
- Tarayıcı geri dönüşü için: Meet "İnsanların toplantıda sizi duymasını ister misiniz?" gösterirse sekmeyi açık bırakın. OpenClaw, tarayıcı otomasyonu üzerinden **Mikrofonu kullan** seçeneğine veya yalnızca oluşturma geri dönüşünde **Mikrofon olmadan devam et** seçeneğine tıklamalı ve oluşturulan Meet URL'sini beklemeyi sürdürmelidir. Bunu yapamıyorsa hata `google-login-required` değil, `meet-audio-choice-required` belirtmelidir.

### Ajan katılıyor ama konuşmuyor

Gerçek zamanlı yolu denetleyin:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Dinleme/konuşarak yanıt verme için `mode: "realtime"` kullanın. `mode: "transcribe"` bilinçli olarak çift yönlü gerçek zamanlı ses köprüsünü başlatmaz. Yalnızca gözlem amaçlı hata ayıklama için, katılımcılar konuştuktan sonra `openclaw googlemeet status --json <session-id>` çalıştırın ve `captioning`, `transcriptLines` ve `lastCaptionText` değerlerini denetleyin. `inCall` true ise ancak `transcriptLines` `0` olarak kalıyorsa Meet altyazıları devre dışı olabilir, gözlemci kurulduktan sonra kimse konuşmamış olabilir, Meet UI değişmiş olabilir veya canlı altyazılar toplantı dili/hesabı için kullanılamıyor olabilir.

`googlemeet test-speech` her zaman gerçek zamanlı yolu denetler ve o çağrı için köprü çıkış baytlarının gözlemlenip gözlemlenmediğini bildirir. `speechOutputVerified` false ve `speechOutputTimedOut` true ise gerçek zamanlı sağlayıcı sözü kabul etmiş olabilir, ancak OpenClaw yeni çıkış baytlarının Chrome ses köprüsüne ulaştığını görmemiştir.

Ayrıca şunları doğrulayın:

- Gateway ana makinesinde `OPENAI_API_KEY` veya `GEMINI_API_KEY` gibi bir gerçek zamanlı sağlayıcı anahtarı kullanılabilir durumdadır.
- Chrome ana makinesinde `BlackHole 2ch` görünür durumdadır.
- Chrome ana makinesinde `sox` vardır.
- Meet mikrofonu ve hoparlörü, OpenClaw tarafından kullanılan sanal ses yolu üzerinden yönlendirilir.

`googlemeet doctor [session-id]` oturumu, Node'u, çağrı içi durumunu, elle eylem nedenini, gerçek zamanlı sağlayıcı bağlantısını, `realtimeReady` değerini, ses giriş/çıkış etkinliğini, son ses zaman damgalarını, bayt sayaçlarını ve tarayıcı URL'sini yazdırır. Ham JSON gerektiğinde `googlemeet status [session-id] --json` kullanın. Token'ları açığa çıkarmadan Google Meet OAuth refresh doğrulaması gerektiğinde `googlemeet doctor --oauth` kullanın; ayrıca Google Meet API kanıtı gerektiğinde `--meeting` veya `--create-space` ekleyin.

Bir ajan zaman aşımına uğradıysa ve zaten açık bir Meet sekmesi görebiliyorsanız, başka bir sekme açmadan o sekmeyi inceleyin:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Eşdeğer araç eylemi `recover_current_tab` değeridir. Seçilen taşıma için mevcut bir Meet sekmesine odaklanır ve onu inceler. `chrome` ile Gateway üzerinden yerel tarayıcı denetimini kullanır; `chrome-node` ile yapılandırılmış Chrome Node'u kullanır. Yeni sekme açmaz veya yeni oturum oluşturmaz; oturum açma, kabul, izinler ya da ses seçimi durumu gibi geçerli engelleyiciyi bildirir. CLI komutu yapılandırılmış Gateway ile konuşur, bu yüzden Gateway çalışıyor olmalıdır; `chrome-node` ayrıca Chrome Node'un bağlı olmasını gerektirir.

### Twilio kurulum denetimleri başarısız oluyor

`voice-call` izinli veya etkin olmadığında `twilio-voice-call-plugin` başarısız olur. Bunu `plugins.allow` içine ekleyin, `plugins.entries.voice-call` değerini etkinleştirin ve Gateway'i yeniden yükleyin.

Twilio arka ucunda hesap SID'si, auth token'ı veya arayan numara eksik olduğunda `twilio-voice-call-credentials` başarısız olur. Bunları Gateway ana makinesinde ayarlayın:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call` için herkese açık Webhook erişimi yoksa veya `publicUrl` loopback ya da özel ağ alanına işaret ediyorsa `twilio-voice-call-webhook` başarısız olur. `plugins.entries.voice-call.config.publicUrl` değerini herkese açık sağlayıcı URL'sine ayarlayın veya bir `voice-call` tüneli/Tailscale erişimi yapılandırın.

Loopback ve özel URL'ler operatör geri çağrıları için geçerli değildir. `publicUrl` olarak `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` veya `fd00::/8` kullanmayın.

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

`voicecall smoke` varsayılan olarak yalnızca hazırlık durumunu denetler. Belirli bir numara için dry-run yapmak üzere:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Yalnızca bilinçli olarak canlı bir giden bildirim çağrısı yapmak istediğinizde `--yes` ekleyin:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio çağrısı başlıyor ama toplantıya hiç girmiyor

Meet etkinliğinin telefonla arama ayrıntılarını sunduğunu doğrulayın. Tam arama numarasını ve PIN'i ya da özel bir DTMF dizisini geçirin:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Sağlayıcının PIN'i girmeden önce duraklamaya ihtiyacı varsa `--dtmf-sequence` içinde başta `w` veya virgüller kullanın.

Telefon çağrısı oluşturuluyorsa ancak Meet katılımcı listesinde arama ile katılan katılımcı hiç görünmüyorsa:

- Devredilen Twilio çağrı kimliğini, DTMF'nin kuyruğa alınıp alınmadığını ve giriş selamlamasının istenip istenmediğini doğrulamak için `openclaw googlemeet doctor <session-id>` çalıştırın.
- `openclaw voicecall status --call-id <id>` çalıştırın ve çağrının hâlâ aktif olduğunu doğrulayın.
- `openclaw voicecall tail` çalıştırın ve Twilio Webhook'larının Gateway'e ulaştığını denetleyin.
- `openclaw logs --follow` çalıştırın ve Twilio Meet dizisini arayın: Google Meet katılmayı devreder, Voice Call bağlantı öncesi DTMF TwiML'i depolar, bu ilk TwiML'i sunar, ardından gerçek zamanlı TwiML'i sunar ve gerçek zamanlı köprüyü `initialGreeting=queued` ile başlatır.
- `openclaw googlemeet setup --transport twilio` komutunu yeniden çalıştırın; yeşil bir kurulum denetimi gereklidir ancak toplantı PIN dizisinin doğru olduğunu kanıtlamaz.
- Arama numarasının PIN ile aynı Meet davetine ve bölgesine ait olduğunu doğrulayın.
- Meet yavaş yanıt veriyorsa `--dtmf-sequence` içindeki baştaki duraklamaları artırın; örneğin `wwww123456#`.
- Katılımcı katılıyor ama selamlamayı duymuyorsanız gerçek zamanlı TwiML, gerçek zamanlı köprü başlangıcı ve `initialGreeting=queued` için `openclaw logs --follow` çıktısını denetleyin. Selamlama, gerçek zamanlı köprü bağlandıktan sonra ilk `voicecall.start` mesajından oluşturulur.

Webhook'lar ulaşmıyorsa önce Voice Call Plugin'i hata ayıklayın: sağlayıcı `plugins.entries.voice-call.config.publicUrl` değerine veya yapılandırılmış tünele erişebilmelidir. Bkz. [Sesli çağrı sorun giderme](/tr/plugins/voice-call#troubleshooting).

## Notlar

Google Meet'in resmi medya API'si almaya yöneliktir, bu yüzden bir Meet çağrısında konuşmak hâlâ bir katılımcı yolu gerektirir. Bu Plugin bu sınırı görünür tutar: Chrome tarayıcı katılımını ve yerel ses yönlendirmesini yönetir; Twilio telefonla arama katılımını yönetir.

Chrome gerçek zamanlı modu `BlackHole 2ch` ve şunlardan birini gerektirir:

- `chrome.audioInputCommand` ve `chrome.audioOutputCommand`: OpenClaw gerçek zamanlı model köprüsüne sahip olur ve sesi bu komutlarla seçilen gerçek zamanlı ses sağlayıcısı arasında `chrome.audioFormat` biçiminde aktarır. Varsayılan Chrome yolu 24 kHz PCM16'dır; 8 kHz G.711 mu-law eski komut çiftleri için kullanılabilir kalır.
- `chrome.audioBridgeCommand`: harici bir köprü komutu tüm yerel ses yoluna sahip olur ve daemon'unu başlattıktan veya doğruladıktan sonra çıkmalıdır.

Temiz çift yönlü ses için Meet çıkışını ve Meet mikrofonunu ayrı sanal cihazlar ya da Loopback tarzı bir sanal cihaz grafiği üzerinden yönlendirin. Tek bir paylaşılan BlackHole cihazı, diğer katılımcıları çağrıya geri yankılayabilir.

Komut çifti Chrome köprüsüyle, insan konuşmaya başladığında `chrome.bargeInInputCommand` ayrı bir yerel mikrofonu dinleyebilir ve asistan oynatmasını temizleyebilir. Bu, asistan oynatma sırasında paylaşılan BlackHole loopback girişi geçici olarak bastırılsa bile insan konuşmasını asistan çıkışının önünde tutar. `chrome.audioInputCommand` ve `chrome.audioOutputCommand` gibi, bu da operatör tarafından yapılandırılan yerel bir komuttur. Açıkça güvenilen bir komut yolu veya argüman listesi kullanın ve bunu güvenilmeyen konumlardaki betiklere yönlendirmeyin.

`googlemeet speak`, bir Chrome oturumu için aktif gerçek zamanlı ses köprüsünü tetikler. `googlemeet leave` bu köprüyü durdurur. Voice Call Plugin üzerinden devredilen Twilio oturumlarında `leave` ayrıca alttaki sesli çağrıyı da kapatır. API tarafından yönetilen bir alan için aktif Google Meet konferansını da kapatmak istediğinizde `googlemeet end-active-conference` kullanın.

## İlgili

- [Voice Call Plugin](/tr/plugins/voice-call)
- [Konuşma modu](/tr/nodes/talk)
- [Plugin oluşturma](/tr/plugins/building-plugins)
