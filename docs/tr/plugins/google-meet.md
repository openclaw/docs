---
read_when:
    - Bir OpenClaw ajanının bir Google Meet görüşmesine katılmasını istiyorsunuz
    - Bir OpenClaw ajanının yeni bir Google Meet görüşmesi oluşturmasını istiyorsunuz
    - Chrome, Chrome node veya Twilio'yu Google Meet taşıması olarak yapılandırıyorsunuz
summary: 'Google Meet Plugin: ajan yanıt verme varsayılanlarıyla Chrome veya Twilio üzerinden belirtilen Meet URL''lerine katılma'
title: Google Meet Plugin’i
x-i18n:
    generated_at: "2026-06-28T00:54:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e85d531897e3aeadf0ac718f82a7aac5ce73715e182e96ceba77cb76eff094c4
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet katılımcı desteği OpenClaw için tasarım gereği açıktır:

- Yalnızca açık bir `https://meet.google.com/...` URL'sine katılır.
- Google Meet API aracılığıyla yeni bir Meet alanı oluşturabilir, ardından
  döndürülen URL'ye katılabilir.
- `agent` varsayılan geri konuşma modudur: gerçek zamanlı transkripsiyon dinler,
  yapılandırılmış OpenClaw agent yanıt verir ve normal OpenClaw TTS Meet içinde konuşur.
- `bidi`, yedek doğrudan gerçek zamanlı ses modeli modu olarak kullanılabilir kalır.
- Agents katılma davranışını `mode` ile seçer: canlı
  dinleme/geri konuşma için `agent`, doğrudan gerçek zamanlı ses yedeği için `bidi` veya geri konuşma köprüsü olmadan tarayıcıya katılmak/kontrol etmek için `transcribe` kullanın.
- Auth kişisel Google OAuth veya zaten oturum açılmış bir Chrome profili olarak başlar.
- Otomatik onay duyurusu yoktur.
- Varsayılan Chrome ses arka ucu `BlackHole 2ch`'dir.
- Chrome yerel olarak veya eşleştirilmiş bir node host üzerinde çalışabilir.
- Twilio bir arama numarası ve isteğe bağlı PIN veya DTMF dizisi kabul eder;
  bir Meet URL'sini doğrudan arayamaz.
- CLI komutu `googlemeet`tir; `meet` daha geniş agent
  telekonferans iş akışları için ayrılmıştır.

## Hızlı başlangıç

Yerel ses bağımlılıklarını kurun ve bir gerçek zamanlı transkripsiyon
sağlayıcısı ile normal OpenClaw TTS'yi yapılandırın. OpenAI varsayılan transkripsiyon
sağlayıcısıdır; Google Gemini Live ayrıca `realtime.voiceProvider: "google"` ile ayrı bir `bidi` ses yedeği olarak çalışır:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch`, `BlackHole 2ch` sanal ses aygıtını kurar. Homebrew'in
kurucusu, macOS aygıtı göstermeden önce yeniden başlatma gerektirir:

```bash
sudo reboot
```

Yeniden başlattıktan sonra, iki parçayı da doğrulayın:

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

Kurulum çıktısı agent tarafından okunabilir ve moda duyarlı olacak şekilde tasarlanmıştır. Chrome
profilini, node sabitlemeyi ve gerçek zamanlı Chrome katılımları için BlackHole/SoX ses
köprüsünü ve gecikmeli gerçek zamanlı giriş kontrollerini raporlar. Yalnızca gözlem katılımları için aynı
transportu `--mode transcribe` ile kontrol edin; bu mod gerçek zamanlı ses ön koşullarını atlar
çünkü köprü üzerinden dinlemez veya konuşmaz:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Twilio delegasyonu yapılandırıldığında, setup ayrıca
`voice-call` Plugin'inin, Twilio kimlik bilgilerinin ve herkese açık Webhook erişiminin hazır olup olmadığını raporlar.
Herhangi bir `ok: false` kontrolünü, bir agent'tan katılmasını istemeden önce kontrol edilen transport ve mod için engelleyici kabul edin. Scriptler veya makine tarafından okunabilir çıktı için `openclaw googlemeet setup --json` kullanın. Bir agent denemeden önce belirli bir
transportu ön kontrolden geçirmek için `--transport chrome`,
`--transport chrome-node` veya `--transport twilio` kullanın.

Twilio için, varsayılan transport Chrome olduğunda transportu her zaman açıkça ön kontrolden geçirin:

```bash
openclaw googlemeet setup --transport twilio
```

Bu, agent toplantıyı aramayı denemeden önce eksik `voice-call` bağlantısını, Twilio kimlik bilgilerini veya erişilemeyen
Webhook erişimini yakalar.

Bir toplantıya katılın:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Ya da bir agent'ın `google_meet` aracı üzerinden katılmasına izin verin:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Agent'a dönük `google_meet` aracı, macOS olmayan hostlarda artifact, calendar, setup, transcribe, Twilio ve `chrome-node` akışları için kullanılabilir kalır. Yerel
Chrome geri konuşma eylemleri orada engellenir çünkü paketli Chrome ses yolu
şu anda macOS `BlackHole 2ch`'ye bağlıdır. Linux'ta Chrome geri konuşmalı katılım için `mode: "transcribe"`,
Twilio araması veya bir macOS `chrome-node` host kullanın.

Yeni bir toplantı oluşturun ve katılın:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

API ile oluşturulan odalar için, odanın kapı çalmadan katılım politikasının Google
hesabı varsayılanlarından devralınmak yerine açık olmasını istediğinizde Google Meet `SpaceConfig.accessType` kullanın:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN`, Meet URL'sine sahip herkesin kapı çalmadan katılmasına izin verir. `TRUSTED`,
host kuruluşun güvenilir kullanıcılarının, davet edilmiş harici kullanıcıların ve aramayla katılan kullanıcıların
kapı çalmadan katılmasına izin verir. `RESTRICTED`, kapı çalmadan girişi davetlilerle sınırlar. Bu
ayarlar yalnızca resmi Google Meet API oluşturma yolu için geçerlidir, bu nedenle OAuth
kimlik bilgileri yapılandırılmış olmalıdır.

Bu seçenek kullanılabilir olmadan önce Google Meet kimlik doğrulaması yaptıysanız,
Google OAuth onay ekranınıza `meetings.space.settings` kapsamını ekledikten sonra
`openclaw googlemeet auth login --json` komutunu yeniden çalıştırın.

Katılmadan yalnızca URL oluşturun:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` iki yola sahiptir:

- API oluşturma: Google Meet OAuth kimlik bilgileri yapılandırıldığında kullanılır. Bu,
  en deterministik yoldur ve tarayıcı UI durumuna bağlı değildir.
- Tarayıcı yedeği: OAuth kimlik bilgileri yokken kullanılır. OpenClaw
  sabitlenmiş Chrome node'unu kullanır, `https://meet.google.com/new` adresini açar, Google'ın gerçek bir toplantı kodu URL'sine
  yönlendirmesini bekler, ardından bu URL'yi döndürür. Bu yol,
  node üzerindeki OpenClaw Chrome profilinin Google'da zaten oturum açmış olmasını gerektirir.
  Tarayıcı otomasyonu Meet'in kendi ilk çalıştırma mikrofon istemini yönetir; bu istem
  bir Google giriş hatası olarak değerlendirilmez.
  Katılma ve oluşturma akışları ayrıca yeni bir sekme açmadan önce mevcut bir Meet sekmesini yeniden kullanmayı dener.
  Eşleştirme, `authuser` gibi zararsız URL sorgu dizelerini yok sayar; böylece bir
  agent yeniden denemesi ikinci bir Chrome sekmesi oluşturmak yerine zaten açık toplantıya odaklanmalıdır.

Komut/araç çıktısı bir `source` alanı (`api` veya `browser`) içerir; böylece agents
hangi yolun kullanıldığını açıklayabilir. `create`, varsayılan olarak yeni toplantıya katılır ve
`joined: true` ile katılım oturumunu döndürür. Yalnızca URL oluşturmak için
CLI'da `create --no-join` kullanın veya araca `"join": false` geçirin.

Ya da bir agent'a şunu söyleyin: "Bir Google Meet oluştur, agent geri konuşma moduyla katıl
ve bağlantıyı bana gönder." Agent, `action: "create"` ile `google_meet` çağırmalı
ve ardından döndürülen `meetingUri` değerini paylaşmalıdır.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Yalnızca gözlem/tarayıcı kontrolüyle katılım için `"mode": "transcribe"` ayarlayın. Bu,
duplex gerçek zamanlı ses köprüsünü başlatmaz, BlackHole veya SoX gerektirmez
ve toplantıya geri konuşmaz. Bu moddaki Chrome katılımları ayrıca
OpenClaw'ın mikrofon/kamera izin verme işleminden ve Meet **Mikrofon kullan**
yolundan kaçınır. Meet bir ses seçimi ara ekranı gösterirse, otomasyon
mikrofonsuz yolu dener ve aksi halde yerel mikrofonu açmak yerine
manuel işlem bildirir. Transcribe modunda, yönetilen Chrome transportları ayrıca
en iyi çaba Meet altyazı gözlemcisi kurar. `googlemeet status --json` ve
`googlemeet doctor`, operatörlerin tarayıcının aramaya katılıp katılmadığını ve Meet altyazılarının metin üretip üretmediğini anlayabilmesi için `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`
ve kısa bir `recentTranscript` kuyruğunu gösterir.
Evet/hayır probuna ihtiyaç duyduğunuzda `openclaw googlemeet test-listen <meet-url> --transport chrome-node` kullanın:
transcribe modunda katılır, yeni altyazı veya transkript hareketini bekler
ve `listenVerified`, `listenTimedOut`, manuel işlem alanları ile en son altyazı sağlığını döndürür.

Gerçek zamanlı oturumlar sırasında, `google_meet` durumu `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, son giriş/çıkış
zaman damgaları, bayt sayaçları ve köprünün kapanma durumu gibi tarayıcı ve ses köprüsü
sağlığını içerir. Güvenli bir Meet sayfası istemi görünürse, tarayıcı otomasyonu mümkün olduğunda
bunu yönetir. Giriş, host kabulü ve tarayıcı/OS izin istemleri, agent'ın iletmesi için bir neden ve
mesajla manuel işlem olarak raporlanır. Yönetilen Chrome oturumları giriş veya
test ifadesini yalnızca tarayıcı sağlığı `inCall: true` raporladıktan sonra yayınlar; aksi halde durum
`speechReady: false` bildirir ve konuşma denemesi, agent toplantıya konuşmuş gibi davranmak yerine engellenir.

Yerel Chrome katılımları, oturum açılmış OpenClaw tarayıcı profili üzerinden yapılır. Gerçek zamanlı mod,
OpenClaw tarafından kullanılan mikrofon/hoparlör yolu için `BlackHole 2ch` gerektirir. Temiz
duplex ses için ayrı sanal aygıtlar veya Loopback tarzı bir grafik kullanın; tek
bir BlackHole aygıtı ilk smoke test için yeterlidir ancak yankı yapabilir.

### Yerel Gateway + Parallels Chrome

Yalnızca VM'nin Chrome'a sahip olmasını sağlamak için bir macOS VM içinde tam bir OpenClaw Gateway'e
veya model API anahtarına ihtiyacınız **yoktur**. Gateway'i ve agent'ı yerel olarak çalıştırın, ardından VM'de bir
node host çalıştırın. Node'un Chrome komutunu duyurması için paketli Plugin'i VM'de bir kez etkinleştirin:

Nerede ne çalışır:

- Gateway host: OpenClaw Gateway, agent workspace, model/API anahtarları, gerçek zamanlı
  sağlayıcı ve Google Meet Plugin yapılandırması.
- Parallels macOS VM: OpenClaw CLI/node host, Google Chrome, SoX, BlackHole 2ch
  ve Google'da oturum açmış bir Chrome profili.
- VM'de gerekli olmayanlar: Gateway servisi, agent yapılandırması, OpenAI/GPT anahtarı veya model
  sağlayıcı kurulumu.

VM bağımlılıklarını kurun:

```bash
brew install blackhole-2ch sox
```

macOS'un `BlackHole 2ch` aygıtını göstermesi için BlackHole'u kurduktan sonra VM'yi yeniden başlatın:

```bash
sudo reboot
```

Yeniden başlatmadan sonra, VM'nin ses aygıtını ve SoX komutlarını görebildiğini doğrulayın:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

VM'de OpenClaw'ı kurun veya güncelleyin, ardından paketli Plugin'i orada etkinleştirin:

```bash
openclaw plugins enable google-meet
```

VM'de node host'u başlatın:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` bir LAN IP'siyse ve TLS kullanmıyorsanız, node bu güvenilir özel ağ için açıkça izin vermediğiniz sürece
düz metin WebSocket'i reddeder:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`, `openclaw.json` ayarı değil, process ortamıdır. `openclaw node install`, kurulum komutunda mevcut olduğunda bunu LaunchAgent
ortamına kaydeder.

Node'u Gateway host'tan onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway'in node'u gördüğünü ve hem `googlemeet.chrome`
hem de tarayıcı capability/`browser.proxy` duyurduğunu doğrulayın:

```bash
openclaw nodes status
```

Meet'i Gateway host üzerinde bu node üzerinden yönlendirin:

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

Şimdi Gateway host'tan normal şekilde katılın:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

veya agent'tan `transport: "chrome-node"` ile `google_meet` aracını kullanmasını isteyin.

Bir oturum oluşturan veya yeniden kullanan, bilinen bir ifadeyi söyleyen
ve oturum sağlığını yazdıran tek komutluk smoke test için:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Gerçek zamanlı katılma sırasında OpenClaw tarayıcı otomasyonu konuk adını doldurur,
Join/Ask to join düğmesine tıklar ve bu istem göründüğünde Meet'in ilk çalıştırma
"Use microphone" seçimini kabul eder. Yalnızca gözlem katılımı veya yalnızca
tarayıcıyla toplantı oluşturma sırasında, aynı istemde bu seçenek kullanılabiliyorsa
mikrofon olmadan devam eder. Tarayıcı profili oturum açmamışsa, Meet toplantı
sahibi kabulünü bekliyorsa, Chrome gerçek zamanlı katılım için mikrofon/kamera izni
gerektiriyorsa veya Meet otomasyonun çözemediği bir istemde takılı kaldıysa,
join/test-speech sonucu `manualActionRequired: true` değerini `manualActionReason`
ve `manualActionMessage` ile bildirir. Aracılar katılmayı yeniden denemeyi bırakmalı,
bu tam mesajı geçerli `browserUrl`/`browserTitle` ile birlikte bildirmeli ve yalnızca
manuel tarayıcı işlemi tamamlandıktan sonra yeniden denemelidir.

`chromeNode.node` atlanırsa, OpenClaw yalnızca tam olarak bir bağlı node hem
`googlemeet.chrome` hem de tarayıcı denetimi ilan ettiğinde otomatik seçim yapar.
Birden çok uygun node bağlıysa, `chromeNode.node` değerini node kimliği, görünen ad
veya uzak IP olarak ayarlayın.

Yaygın hata denetimleri:

- `Configured Google Meet node ... is not usable: offline`: sabitlenmiş node
  Gateway tarafından biliniyor ancak kullanılamıyor. Aracılar bu node'u kullanılabilir
  bir Chrome ana makinesi olarak değil, tanılama durumu olarak ele almalı ve kullanıcı
  bunu istemedikçe başka bir taşıma yöntemine geri düşmek yerine kurulum engelini
  bildirmelidir.
- `No connected Google Meet-capable node`: VM içinde `openclaw node run` başlatın,
  eşleştirmeyi onaylayın ve VM içinde `openclaw plugins enable google-meet` ile
  `openclaw plugins enable browser` komutlarının çalıştırıldığından emin olun. Ayrıca
  Gateway ana makinesinin her iki node komutuna da
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` ile izin
  verdiğini doğrulayın.
- `BlackHole 2ch audio device not found`: denetlenen ana makineye `blackhole-2ch`
  yükleyin ve yerel Chrome sesi kullanmadan önce yeniden başlatın.
- `BlackHole 2ch audio device not found on the node`: VM içine `blackhole-2ch`
  yükleyin ve VM'i yeniden başlatın.
- Chrome açılıyor ancak katılamıyorsa: VM içindeki tarayıcı profiline oturum açın
  veya konuk katılımı için `chrome.guestName` değerini ayarlı tutun. Konuk otomatik
  katılımı, node tarayıcı proxy'si üzerinden OpenClaw tarayıcı otomasyonunu kullanır;
  node tarayıcı yapılandırmasının istediğiniz profile işaret ettiğinden emin olun,
  örneğin `browser.defaultProfile: "user"` veya adlandırılmış bir mevcut oturum profili.
- Yinelenen Meet sekmeleri: `chrome.reuseExistingTab: true` etkin kalsın. OpenClaw
  yeni bir sekme açmadan önce aynı Meet URL'si için var olan sekmeyi etkinleştirir ve
  tarayıcıyla toplantı oluşturma, başka bir sekme açmadan önce devam eden bir
  `https://meet.google.com/new` veya Google hesabı istem sekmesini yeniden kullanır.
- Ses yok: Meet içinde mikrofon/hoparlör sesini OpenClaw tarafından kullanılan
  sanal ses aygıtı yolundan yönlendirin; temiz çift yönlü ses için ayrı sanal aygıtlar
  veya Loopback tarzı yönlendirme kullanın.

## Kurulum notları

Chrome geri konuşma varsayılanı iki harici araç kullanır:

- `sox`: komut satırı ses yardımcı programı. Plugin, varsayılan 24 kHz PCM16 ses
  köprüsü için açık CoreAudio aygıt komutları kullanır.
- `blackhole-2ch`: macOS sanal ses sürücüsü. Chrome/Meet'in üzerinden yönlendirme
  yapabileceği `BlackHole 2ch` ses aygıtını oluşturur.

OpenClaw bu paketlerden hiçbirini paketlemez veya yeniden dağıtmaz. Belgeler,
kullanıcılardan bunları Homebrew aracılığıyla ana makine bağımlılıkları olarak
yüklemelerini ister. SoX `LGPL-2.0-only AND GPL-2.0-only`; BlackHole ise GPL-3.0
lisanslıdır. BlackHole'u OpenClaw ile birlikte paketleyen bir yükleyici veya cihaz
oluşturuyorsanız, BlackHole'un upstream lisans koşullarını inceleyin veya Existential
Audio'dan ayrı bir lisans alın.

## Taşımalar

### Chrome

Chrome taşıması Meet URL'sini OpenClaw tarayıcı denetimi üzerinden açar ve oturum
açmış OpenClaw tarayıcı profili olarak katılır. macOS üzerinde Plugin, başlatmadan
önce `BlackHole 2ch` denetimi yapar. Yapılandırılmışsa, Chrome'u açmadan önce bir
ses köprüsü sağlık komutu ve başlangıç komutu da çalıştırır. Chrome/ses Gateway
ana makinesinde çalışıyorsa `chrome`; Chrome/ses Parallels macOS VM gibi eşleştirilmiş
bir node üzerinde çalışıyorsa `chrome-node` kullanın. Yerel Chrome için profili
`browser.defaultProfile` ile seçin; `chrome.browserProfile`, `chrome-node` ana
makinelerine geçirilir.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome mikrofon ve hoparlör sesini yerel OpenClaw ses köprüsü üzerinden yönlendirin.
`BlackHole 2ch` yüklü değilse, katılım ses yolu olmadan sessizce katılmak yerine bir
kurulum hatasıyla başarısız olur.

### Twilio

Twilio taşıması, Voice Call plugin'e devredilen katı bir arama planıdır. Telefon
numaraları için Meet sayfalarını ayrıştırmaz.

Bunu Chrome katılımı kullanılamadığında veya telefonla arama yedeği istediğinizde
kullanın. Google Meet, toplantı için telefonla arama numarası ve PIN göstermelidir;
OpenClaw bunları Meet sayfasından keşfetmez.

Voice Call plugin'i Chrome node üzerinde değil, Gateway ana makinesinde etkinleştirin:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
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
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Join this Google Meet as an OpenClaw agent. Be brief.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                silenceDurationMs: 500,
                startSensitivity: "high",
              },
            },
          },
        },
      },
      google: {
        enabled: true,
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
export GEMINI_API_KEY=...
```

Gerçek zamanlı ses sağlayıcınız buysa bunun yerine OpenAI sağlayıcı plugin'i ve
`OPENAI_API_KEY` ile `realtime.provider: "openai"` kullanın.

`voice-call` etkinleştirildikten sonra Gateway'i yeniden başlatın veya yeniden
yükleyin; Plugin yapılandırma değişiklikleri, yeniden yüklenene kadar zaten çalışan
bir Gateway sürecinde görünmez.

Ardından doğrulayın:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio devri bağlandığında, `googlemeet setup` başarılı `twilio-voice-call-plugin`,
`twilio-voice-call-credentials` ve `twilio-voice-call-webhook` denetimlerini içerir.

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

OAuth, Meet bağlantısı oluşturmak için isteğe bağlıdır çünkü `googlemeet create`
tarayıcı otomasyonuna geri düşebilir. Resmi API ile oluşturma, alan çözümleme veya
Meet Media API ön denetimleri istediğinizde OAuth yapılandırın.

Google Meet API erişimi kullanıcı OAuth kullanır: bir Google Cloud OAuth istemcisi
oluşturun, gerekli kapsamları isteyin, bir Google hesabını yetkilendirin, ardından
ortaya çıkan yenileme belirtecini Google Meet plugin yapılandırmasında saklayın veya
`OPENCLAW_GOOGLE_MEET_*` ortam değişkenlerini sağlayın.

OAuth, Chrome katılım yolunun yerini almaz. Chrome ve Chrome-node taşımaları,
tarayıcı katılımı kullandığınızda hâlâ oturum açmış bir Chrome profili, BlackHole/SoX
ve bağlı bir node üzerinden katılır. OAuth yalnızca resmi Google Meet API yolu içindir:
toplantı alanları oluşturma, alanları çözümleme ve Meet Media API ön denetimlerini
çalıştırma.

### Google kimlik bilgilerini oluşturun

Google Cloud Console içinde:

1. Bir Google Cloud projesi oluşturun veya seçin.
2. Bu proje için **Google Meet REST API** özelliğini etkinleştirin.
3. OAuth izin ekranını yapılandırın.
   - Bir Google Workspace kuruluşu için **Internal** en basit seçenektir.
   - **External** kişisel/test kurulumları için çalışır; uygulama Testing
     durumundayken, uygulamayı yetkilendirecek her Google hesabını test kullanıcısı
     olarak ekleyin.
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
`meetings.space.readonly`, OpenClaw'ın Meet URL'lerini/kodlarını alanlara çözmesine
izin verir. `meetings.space.settings`, OpenClaw'ın API oda oluşturma sırasında
`accessType` gibi `SpaceConfig` ayarlarını geçirmesine izin verir.
`meetings.conference.media.readonly`, Meet Media API ön denetimi ve medya çalışması
içindir; Google gerçek Media API kullanımı için Developer Preview kaydı gerektirebilir.
Yalnızca tarayıcı tabanlı Chrome katılımlarına ihtiyacınız varsa OAuth'u tamamen
atlayın.

### Yenileme belirtecini üretin

`oauth.clientId` ve isteğe bağlı olarak `oauth.clientSecret` yapılandırın ya da bunları
ortam değişkenleri olarak geçirin, ardından şunu çalıştırın:

```bash
openclaw googlemeet auth login --json
```

Komut, yenileme belirteci içeren bir `oauth` yapılandırma bloğu yazdırır. PKCE,
`http://localhost:8085/oauth2callback` üzerinde localhost geri çağrısı ve `--manual`
ile manuel kopyala/yapıştır akışı kullanır.

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

`oauth` nesnesini Google Meet plugin yapılandırmasının altında saklayın:

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

Yenileme belirtecini yapılandırmada istemediğinizde ortam değişkenlerini tercih edin.
Hem yapılandırma hem de ortam değerleri varsa, Plugin önce yapılandırmayı çözer ve
sonra ortam geri düşüşünü kullanır.

OAuth izni Meet alanı oluşturma, Meet alanı okuma erişimi ve Meet konferans medyası
okuma erişimini içerir. Toplantı oluşturma desteği var olmadan önce kimlik doğruladıysanız,
yenileme belirtecinin `meetings.space.created` kapsamına sahip olması için
`openclaw googlemeet auth login --json` komutunu yeniden çalıştırın.

### OAuth'u doctor ile doğrulayın

Hızlı, gizli bilgi içermeyen bir sağlık denetimi istediğinizde OAuth doctor çalıştırın:

```bash
openclaw googlemeet doctor --oauth --json
```

Bu, Chrome çalışma zamanını yüklemez veya bağlı bir Chrome node gerektirmez. OAuth
yapılandırmasının var olduğunu ve yenileme belirtecinin bir erişim belirteci
üretebildiğini denetler. JSON raporu yalnızca `ok`, `configured`, `tokenSource`,
`expiresAt` ve denetim mesajları gibi durum alanlarını içerir; erişim belirtecini,
yenileme belirtecini veya istemci gizli anahtarını yazdırmaz.

Yaygın sonuçlar:

| Kontrol              | Anlam                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` ile `oauth.refreshToken` veya önbelleğe alınmış bir erişim token'ı mevcut.       |
| `oauth-token`        | Önbelleğe alınmış erişim token'ı hâlâ geçerli veya yenileme token'ı yeni bir erişim token'ı üretti. |
| `meet-spaces-get`    | İsteğe bağlı `--meeting` kontrolü mevcut bir Meet alanını çözdü.                                  |
| `meet-spaces-create` | İsteğe bağlı `--create-space` kontrolü yeni bir Meet alanı oluşturdu.                             |

Google Meet API etkinleştirmesini ve `spaces.create` kapsamını da kanıtlamak
için yan etkili oluşturma kontrolünü çalıştırın:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` kullan-at bir Meet URL'si oluşturur. Google Cloud projesinde
Meet API'nin etkin olduğunu ve yetkilendirilmiş hesabın
`meetings.space.created` kapsamına sahip olduğunu doğrulamanız gerektiğinde
bunu kullanın.

Mevcut bir toplantı alanı için okuma erişimini kanıtlamak üzere:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` ve `resolve-space`, yetkilendirilmiş Google hesabının
erişebildiği mevcut bir alana okuma erişimini kanıtlar. Bu kontrollerden gelen
bir `403` genellikle Google Meet REST API'nin devre dışı olduğu, onaylanmış
yenileme token'ında gerekli kapsamın eksik olduğu veya Google hesabının o Meet
alanına erişemediği anlamına gelir. Yenileme token'ı hatası, `openclaw
googlemeet auth login --json` komutunu yeniden çalıştırmanız ve yeni `oauth`
bloğunu saklamanız gerektiği anlamına gelir.

Tarayıcı yedeği için OAuth kimlik bilgileri gerekmez. Bu modda Google kimlik
doğrulaması OpenClaw yapılandırmasından değil, seçili node'da oturum açılmış
Chrome profilinden gelir.

Bu ortam değişkenleri yedek olarak kabul edilir:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` veya `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` veya `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` veya `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` veya `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` veya
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` veya `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` veya `GOOGLE_MEET_PREVIEW_ACK`

Bir Meet URL'sini, kodunu veya `spaces/{id}` değerini `spaces.get` üzerinden
çözün:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Medya çalışmasından önce ön kontrolü çalıştırın:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet konferans kayıtlarını oluşturduktan sonra toplantı yapıtlarını ve katılımı
listeleyin:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting` ile `artifacts` ve `attendance` varsayılan olarak en son konferans
kaydını kullanır. O toplantı için saklanan her kaydı istediğinizde
`--all-conference-records` geçirin.

Takvim araması, Meet yapıtlarını okumadan önce toplantı URL'sini Google
Calendar'dan çözebilir:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today`, Google Meet bağlantısı olan bir Calendar etkinliği için bugünün
`primary` takviminde arama yapar. Eşleşen etkinlik metnini aramak için
`--event <query>`, birincil olmayan bir takvim için `--calendar <id>` kullanın.
Takvim araması, Calendar events readonly kapsamını içeren yeni bir OAuth oturumu
gerektirir. `calendar-events`, eşleşen Meet etkinliklerini önizler ve `latest`,
`artifacts`, `attendance` veya `export` tarafından seçilecek etkinliği işaretler.

Konferans kaydı kimliğini zaten biliyorsanız, doğrudan adresleyin:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Aramadan sonra odayı kapatmak istediğinizde API ile oluşturulmuş bir alan için
aktif konferansı sonlandırın:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Bu, Google Meet `spaces.endActiveConference` çağrısını yapar ve yetkilendirilmiş
hesabın yönetebildiği bir alan için `meetings.space.created` kapsamına sahip
OAuth gerektirir. OpenClaw bir Meet URL'si, toplantı kodu veya `spaces/{id}`
girdisini kabul eder ve aktif konferansı sonlandırmadan önce bunu API alan
kaynağına çözer. Bu, `googlemeet leave` komutundan ayrıdır: `leave` OpenClaw'ın
yerel/oturum katılımını durdururken, `end-active-conference` Google Meet'ten o
alanın aktif konferansını sonlandırmasını ister.

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

`artifacts`, Google toplantı için sunduğunda konferans kaydı meta verilerinin
yanı sıra katılımcı, kayıt, transkript, yapılandırılmış transkript girdisi ve
akıllı not kaynak meta verilerini döndürür. Büyük toplantılarda girdi aramasını
atlamak için `--no-transcript-entries` kullanın. `attendance`, katılımcıları
ilk/son görülme zamanları, toplam oturum süresi, geç/erken ayrılma bayrakları ve
oturum açmış kullanıcıya veya görünen ada göre birleştirilmiş yinelenen
katılımcı kaynaklarıyla katılımcı oturumu satırlarına genişletir. Ham katılımcı
kaynaklarını ayrı tutmak için `--no-merge-duplicates`, geç algılamayı ayarlamak
için `--late-after-minutes` ve erken ayrılma algılamasını ayarlamak için
`--early-before-minutes` geçirin.

`export`, `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`,
`attendance.json` ve `manifest.json` içeren bir klasör yazar. `manifest.json`
seçilen girdiyi, dışa aktarma seçeneklerini, konferans kayıtlarını, çıktı
dosyalarını, sayımları, token kaynağını, kullanıldıysa Calendar etkinliğini ve
kısmi alma uyarılarını kaydeder. Klasörün yanına taşınabilir bir arşiv de yazmak
için `--zip` geçirin. Bağlantılı transkript ve akıllı not Google Docs metnini
Google Drive `files.export` üzerinden dışa aktarmak için `--include-doc-bodies`
geçirin; bu, Drive Meet readonly kapsamını içeren yeni bir OAuth oturumu
gerektirir. `--include-doc-bodies` olmadan dışa aktarımlar yalnızca Meet meta
verilerini ve yapılandırılmış transkript girdilerini içerir. Google akıllı not
listeleme, transkript girdisi veya Drive belge gövdesi hatası gibi kısmi bir
yapıt hatası döndürürse, özet ve manifest tüm dışa aktarımı başarısız yapmak
yerine uyarıyı korur. Klasörü veya ZIP'i oluşturmadan aynı yapıt/katılım
verilerini almak ve manifest JSON'unu yazdırmak için `--dry-run` kullanın. Bu,
büyük bir dışa aktarma yazmadan önce veya bir agent yalnızca sayımlara, seçilen
kayıtlara ve uyarılara ihtiyaç duyduğunda kullanışlıdır.

Agent'lar aynı paketi `google_meet` aracı üzerinden de oluşturabilir:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Yalnızca dışa aktarma manifestini döndürmek ve dosya yazımlarını atlamak için
`"dryRun": true` ayarlayın.

Agent'lar açık erişim politikasıyla API destekli bir oda da oluşturabilir:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

Ayrıca bilinen bir oda için aktif konferansı sonlandırabilirler:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Önce dinleme doğrulaması için agent'lar toplantının kullanışlı olduğunu iddia
etmeden önce `test_listen` kullanmalıdır:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Korunan canlı duman testini gerçek bir saklanmış toplantıya karşı çalıştırın:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Canlı önce dinleme tarayıcı probunu, birinin konuşacağı ve Meet altyazılarının
kullanılabilir olduğu bir toplantıya karşı çalıştırın:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Canlı duman testi ortamı:

- `OPENCLAW_LIVE_TEST=1` korunan canlı testleri etkinleştirir.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` saklanmış bir Meet URL'sini, kodunu veya
  `spaces/{id}` değerini gösterir.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` veya `GOOGLE_MEET_CLIENT_ID` OAuth istemci
  kimliğini sağlar.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` veya `GOOGLE_MEET_REFRESH_TOKEN`
  yenileme token'ını sağlar.
- İsteğe bağlı: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ve
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`, `OPENCLAW_` öneki olmadan
  aynı yedek adları kullanır.

Temel yapıt/katılım canlı duman testi
`https://www.googleapis.com/auth/meetings.space.readonly` ve
`https://www.googleapis.com/auth/meetings.conference.media.readonly` gerektirir.
Takvim araması `https://www.googleapis.com/auth/calendar.events.readonly`
gerektirir. Drive belge gövdesi dışa aktarma
`https://www.googleapis.com/auth/drive.meet.readonly` gerektirir.

Yeni bir Meet alanı oluşturun:

```bash
openclaw googlemeet create
```

Komut yeni `meeting uri` değerini, kaynağı ve katılım oturumunu yazdırır. OAuth
kimlik bilgileriyle resmi Google Meet API'yi kullanır. OAuth kimlik bilgileri
olmadan, yedek olarak sabitlenmiş Chrome node'unun oturum açılmış tarayıcı
profilini kullanır. Agent'lar tek adımda oluşturmak ve katılmak için
`action: "create"` ile `google_meet` aracını kullanabilir. Yalnızca URL
oluşturma için `"join": false` geçirin.

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

Tarayıcı yedeği URL'yi oluşturamadan önce Google oturum açma veya Meet izin
engeline takılırsa, Gateway yöntemi başarısız bir yanıt döndürür ve
`google_meet` aracı düz bir dize yerine yapılandırılmış ayrıntılar döndürür:

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

Bir agent `manualActionRequired: true` gördüğünde, `manualActionMessage` ile
tarayıcı node/sekme bağlamını bildirmeli ve operatör tarayıcı adımını
tamamlayana kadar yeni Meet sekmeleri açmayı durdurmalıdır.

API oluşturma işleminden örnek JSON çıktısı:

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

Meet oluşturmak varsayılan olarak katılım sağlar. Chrome veya Chrome-node taşıması,
tarayıcı üzerinden katılmak için yine de oturum açılmış bir Google Chrome profiline
ihtiyaç duyar. Profilde oturum kapalıysa OpenClaw `manualActionRequired: true`
veya bir tarayıcı geri dönüş hatası bildirir ve operatörden yeniden denemeden önce
Google oturum açma işlemini tamamlamasını ister.

`preview.enrollmentAcknowledged: true` değerini yalnızca Cloud projenizin, OAuth
sorumlusunun ve toplantı katılımcılarının Meet medya API’leri için Google
Workspace Developer Preview Program’a kaydedildiğini doğruladıktan sonra ayarlayın.

## Yapılandırma

Ortak Chrome ajan yolu yalnızca Plugin’in etkinleştirilmesini, BlackHole’u, SoX’u,
gerçek zamanlı bir yazıya döküm sağlayıcısı anahtarını ve yapılandırılmış bir
OpenClaw TTS sağlayıcısını gerektirir. OpenAI varsayılan yazıya döküm sağlayıcısıdır;
varsayılan ajan modu yazıya döküm sağlayıcısını değiştirmeden `bidi` modu için
Google Gemini Live kullanmak üzere `realtime.voiceProvider` değerini `"google"` ve
`realtime.model` değerini ayarlayın:

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
- `defaultMode: "agent"` (`"realtime"` yalnızca `"agent"` için eski uyumluluk
  takma adı olarak kabul edilir; yeni araç çağrıları `"agent"` demelidir)
- `chromeNode.node`: `chrome-node` için isteğe bağlı node kimliği/adı/IP’si
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: oturum açılmamış Meet konuk ekranında
  kullanılan ad
- `chrome.autoJoin: true`: `chrome-node` üzerinde OpenClaw tarayıcı otomasyonu
  aracılığıyla en iyi çabayla konuk adı doldurma ve Şimdi Katıl tıklaması
- `chrome.reuseExistingTab: true`: yinelenen sekmeler açmak yerine mevcut bir
  Meet sekmesini etkinleştirir
- `chrome.waitForInCallMs: 20000`: konuşarak yanıt girişinin tetiklenmesinden
  önce Meet sekmesinin çağrı içinde olduğunu bildirmesini bekler
- `chrome.audioFormat: "pcm16-24khz"`: komut çifti ses biçimi. `"g711-ulaw-8khz"`
  değerini yalnızca hâlâ telefon sesi yayan eski/özel komut çiftleri için kullanın.
- `chrome.audioBufferBytes: 4096`: oluşturulan Chrome komut çifti ses komutları
  için SoX işleme arabelleği. Bu, SoX’un varsayılan 8192 baytlık arabelleğinin
  yarısıdır; yoğun ana makinelerde artırmaya alan bırakırken varsayılan boru
  gecikmesini azaltır. SoX’un minimumunun altındaki değerler 17 bayta sabitlenir.
- `chrome.audioInputCommand`: CoreAudio `BlackHole 2ch` üzerinden okuyan ve sesi
  `chrome.audioFormat` biçiminde yazan SoX komutu
- `chrome.audioOutputCommand`: sesi `chrome.audioFormat` biçiminde okuyan ve
  CoreAudio `BlackHole 2ch` hedefine yazan SoX komutu
- `chrome.bargeInInputCommand`: asistan oynatımı etkinken insan araya girme
  algılaması için işaretli 16 bit little-endian mono PCM yazan isteğe bağlı yerel
  mikrofon komutu. Bu şu anda Gateway üzerinde barındırılan `chrome` komut çifti
  köprüsüne uygulanır.
- `chrome.bargeInRmsThreshold: 650`: `chrome.bargeInInputCommand` üzerinde insan
  kesintisi sayılan RMS düzeyi
- `chrome.bargeInPeakThreshold: 2500`: `chrome.bargeInInputCommand` üzerinde insan
  kesintisi sayılan tepe düzeyi
- `chrome.bargeInCooldownMs: 900`: yinelenen insan kesintisi temizlemeleri
  arasındaki minimum gecikme
- `mode: "agent"`: varsayılan konuşarak yanıt modu. Katılımcı konuşması
  yapılandırılmış gerçek zamanlı yazıya döküm sağlayıcısı tarafından yazıya
  dökülür, toplantı başına alt ajan oturumunda yapılandırılmış OpenClaw ajanına
  gönderilir ve normal OpenClaw TTS çalışma zamanı üzerinden seslendirilir.
- `mode: "bidi"`: geri dönüş doğrudan çift yönlü gerçek zamanlı model modu.
  Gerçek zamanlı ses sağlayıcısı katılımcı konuşmasını doğrudan yanıtlar ve daha
  derin/araç destekli yanıtlar için `openclaw_agent_consult` çağırabilir.
- `mode: "transcribe"`: konuşarak yanıt köprüsü olmayan yalnızca gözlem modu.
- `realtime.provider: "openai"`: aşağıdaki kapsamlı sağlayıcı alanları
  ayarlanmamışsa kullanılan uyumluluk geri dönüşü.
- `realtime.transcriptionProvider: "openai"`: `agent` modu tarafından gerçek
  zamanlı yazıya döküm için kullanılan sağlayıcı kimliği.
- `realtime.voiceProvider`: `bidi` modu tarafından doğrudan gerçek zamanlı ses için
  kullanılan sağlayıcı kimliği. Ajan modu yazıya dökümünü OpenAI üzerinde tutarken
  Gemini Live kullanmak için bunu `"google"` olarak ayarlayın.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: daha derin yanıtlar için `openclaw_agent_consult` ile
  kısa sözlü yanıtlar
- `realtime.introMessage`: gerçek zamanlı köprü bağlandığında kısa sözlü hazır olma
  denetimi; sessiz katılmak için bunu `""` olarak ayarlayın
- `realtime.agentId`: `openclaw_agent_consult` için isteğe bağlı OpenClaw ajan
  kimliği; varsayılanı `main`

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
  defaultMode: "agent",
  realtime: {
    provider: "openai",
    transcriptionProvider: "openai",
    voiceProvider: "google",
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        speakerVoice: "Kore",
      },
    },
  },
}
```

Ajan modu dinleme ve konuşma için ElevenLabs:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        },
      },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        config: {
          realtime: {
            transcriptionProvider: "elevenlabs",
            providers: {
              elevenlabs: {
                modelId: "scribe_v2_realtime",
                audioFormat: "ulaw_8000",
                sampleRate: 8000,
                commitStrategy: "vad",
              },
            },
          },
        },
      },
    },
  },
}
```

Kalıcı Meet sesi `messages.tts.providers.elevenlabs.speakerVoiceId` değerinden
gelir. TTS model geçersiz kılmaları etkinse ajan yanıtları yanıt başına
`[[tts:speakerVoiceId=... model=eleven_v3]]` yönergelerini de kullanabilir, ancak
toplantılar için belirleyici varsayılan yapılandırmadır. Katılım sırasında günlükler
`transcriptionProvider=elevenlabs` göstermeli ve her sözlü yanıt
`provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>` günlüğünü yazmalıdır.

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
çağrısını, DTMF’yi ve giriş selamlamasını Voice Call Plugin’e devreder. Voice Call,
gerçek zamanlı medya akışını açmadan önce DTMF dizisini oynatır, ardından kaydedilen
giriş metnini ilk gerçek zamanlı selamlama olarak kullanır. `voice-call` etkin
değilse Google Meet yine de arama planını doğrulayabilir ve kaydedebilir, ancak
Twilio çağrısını gerçekleştiremez.

## Araç

Ajanlar `google_meet` aracını kullanabilir:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Chrome Gateway ana makinesinde çalıştığında `transport: "chrome"` kullanın. Chrome,
Parallels VM gibi eşleştirilmiş bir node üzerinde çalıştığında `transport:
"chrome-node"` kullanın. Her iki durumda da model sağlayıcıları ve
`openclaw_agent_consult` Gateway ana makinesinde çalışır, bu nedenle model kimlik
bilgileri orada kalır. Varsayılan `mode: "agent"` ile gerçek zamanlı yazıya döküm
sağlayıcısı dinlemeyi yürütür, yapılandırılmış OpenClaw ajanı yanıtı üretir ve
normal OpenClaw TTS bunu Meet içine seslendirir. Gerçek zamanlı ses modelinin
doğrudan yanıtlamasını istediğinizde `mode: "bidi"` kullanın. Ham
`mode: "realtime"` değeri `mode: "agent"` için eski uyumluluk takma adı olarak
kabul edilmeye devam eder, ancak artık ajan araç şemasında duyurulmaz. Ajan modu
günlükleri, köprü başlangıcında çözümlenen yazıya döküm sağlayıcısını/modelini ve
her sentezlenmiş yanıttan sonra TTS sağlayıcısını, modelini, sesini, çıktı biçimini
ve örnekleme hızını içerir.

Etkin oturumları listelemek veya bir oturum kimliğini incelemek için
`action: "status"` kullanın. Gerçek zamanlı ajanın hemen konuşmasını sağlamak için
`sessionId` ve `message` ile `action: "speak"` kullanın. Oturumu oluşturmak veya
yeniden kullanmak, bilinen bir ifadeyi tetiklemek ve Chrome ana makinesi bunu
bildirebildiğinde `inCall` sağlığını döndürmek için `action: "test_speech"` kullanın.
`test_speech` her zaman `mode: "agent"` değerini zorlar ve `mode: "transcribe"`
içinde çalıştırılması istenirse başarısız olur; çünkü yalnızca gözlem oturumları
bilerek konuşma yayamaz. `speechOutputVerified` sonucu, bu test çağrısı sırasında
gerçek zamanlı ses çıkışı baytlarının artmasına dayanır; bu nedenle eski sesi olan
yeniden kullanılan bir oturum yeni başarılı konuşma denetimi sayılmaz. Bir oturumu
sonlandı olarak işaretlemek için `action: "leave"` kullanın.

`status`, mevcut olduğunda Chrome sağlığını içerir:

- `inCall`: Chrome Meet çağrısının içinde görünüyor
- `micMuted`: en iyi çabayla Meet mikrofon durumu
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: konuşmanın
  çalışabilmesi için tarayıcı profilinin manuel oturum açmaya, Meet sahibi kabulüne,
  izinlere veya tarayıcı denetimi onarımına ihtiyacı var
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: yönetilen Chrome
  konuşmasına şu anda izin verilip verilmediği. `speechReady: false`, OpenClaw’ın
  giriş/test ifadesini ses köprüsüne göndermediği anlamına gelir.
- `providerConnected` / `realtimeReady`: gerçek zamanlı ses köprüsü durumu
- `lastInputAt` / `lastOutputAt`: köprüden görülen veya köprüye gönderilen son ses
- `audioOutputRouted` / `audioOutputDeviceLabel`: Meet sekmesinin medya çıkışının
  köprü tarafından kullanılan BlackHole aygıtına etkin şekilde yönlendirilip
  yönlendirilmediği
- `lastSuppressedInputAt` / `suppressedInputBytes`: asistan oynatımı etkinken
  yok sayılan local loopback girişi

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Ajan ve bidi modları

Chrome `agent` modu, "ajanım toplantıda" davranışı için optimize edilmiştir.
Gerçek zamanlı yazıya döküm sağlayıcısı toplantı sesini duyar, son katılımcı
dökümleri yapılandırılmış OpenClaw ajanı üzerinden yönlendirilir ve yanıt normal
OpenClaw TTS çalışma zamanı üzerinden seslendirilir. Gerçek zamanlı ses modelinin
doğrudan yanıtlamasını istediğinizde `mode: "bidi"` ayarlayın. Bir sözlü turun
birkaç eski kısmi yanıt üretmemesi için yakındaki nihai döküm parçaları danışmadan
önce birleştirilir. Gerçek zamanlı giriş, sıradaki asistan sesi hâlâ oynatılırken
de bastırılır ve BlackHole local loopback’inin ajanın kendi konuşmasına yanıt
vermesine neden olmaması için son asistan benzeri döküm yankıları ajan danışmasından
önce yok sayılır.

| Mod     | Yanıta kim karar verir       | Konuşma çıkışı yolu                  | Ne zaman kullanılır                                      |
| ------- | ---------------------------- | ------------------------------------ | -------------------------------------------------------- |
| `agent` | Yapılandırılmış OpenClaw ajanı | Normal OpenClaw TTS çalışma zamanı   | "Ajanım toplantıda" davranışı istediğinizde              |
| `bidi`  | Gerçek zamanlı ses modeli     | Gerçek zamanlı ses sağlayıcı yanıtı  | En düşük gecikmeli konuşma ses döngüsünü istediğinizde   |

`bidi` modunda, gerçek zamanlı model daha derin akıl yürütmeye, güncel bilgilere
veya normal OpenClaw araçlarına ihtiyaç duyduğunda `openclaw_agent_consult`
çağırabilir.

Consult aracı, sahne arkasında düzenli OpenClaw agent'ını son toplantı dökümü bağlamıyla çalıştırır ve kısa, sözlü bir yanıt döndürür. `agent` modunda OpenClaw bu yanıtı doğrudan TTS runtime'ına gönderir; `bidi` modunda gerçek zamanlı ses modeli consult sonucunu toplantıya geri seslendirebilir. Voice Call ile aynı paylaşılan consult mekanizmasını kullanır.

Varsayılan olarak consult'lar `main` agent'ına karşı çalışır. Bir Meet hattının özel bir OpenClaw agent çalışma alanına, model varsayılanlarına, araç ilkesine, belleğe ve oturum geçmişine danışması gerekiyorsa `realtime.agentId` ayarlayın.

Agent modundaki consult'lar, takip sorularının yapılandırılan agent'tan normal agent ilkesini devralırken toplantı bağlamını koruması için toplantı başına `agent:<id>:subagent:google-meet:<session>` oturum anahtarı kullanır.

`realtime.toolPolicy`, consult çalıştırmasını denetler:

- `safe-read-only`: consult aracını açığa çıkarın ve düzenli agent'ı `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` ve `memory_get` ile sınırlayın.
- `owner`: consult aracını açığa çıkarın ve düzenli agent'ın normal agent araç ilkesini kullanmasına izin verin.
- `none`: consult aracını gerçek zamanlı ses modeline açığa çıkarmayın.

Consult oturum anahtarı Meet oturumu başına kapsamlanır; bu nedenle takip consult çağrıları aynı toplantı sırasında önceki consult bağlamını yeniden kullanabilir.

Chrome çağrıya tamamen katıldıktan sonra sesli hazır olma denetimini zorlamak için:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Tam katıl-ve-konuş smoke için:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Canlı test kontrol listesi

Bir toplantıyı gözetimsiz bir agent'a devretmeden önce şu sırayı kullanın:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Beklenen Chrome-node durumu:

- `googlemeet setup` tamamen yeşildir.
- Chrome-node varsayılan aktarım olduğunda veya bir düğüm sabitlendiğinde `googlemeet setup`, `chrome-node-connected` içerir.
- `nodes status`, seçilen düğümün bağlı olduğunu gösterir.
- Seçilen düğüm hem `googlemeet.chrome` hem de `browser.proxy` duyurur.
- Meet sekmesi çağrıya katılır ve `test-speech`, `inCall: true` ile Chrome sağlık durumunu döndürür.

Parallels macOS VM gibi uzak bir Chrome ana makinesi için, Gateway veya VM güncellendikten sonraki en kısa güvenli denetim şudur:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Bu, bir agent gerçek toplantı sekmesi açmadan önce Gateway Plugin'inin yüklendiğini, VM düğümünün mevcut token ile bağlı olduğunu ve Meet ses köprüsünün kullanılabilir olduğunu kanıtlar.

Twilio smoke için telefonla arama ayrıntılarını sunan bir toplantı kullanın:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Beklenen Twilio durumu:

- `googlemeet setup`, yeşil `twilio-voice-call-plugin`, `twilio-voice-call-credentials` ve `twilio-voice-call-webhook` denetimlerini içerir.
- Gateway yeniden yüklendikten sonra CLI'da `voicecall` kullanılabilir.
- Döndürülen oturumda `transport: "twilio"` ve bir `twilio.voiceCallId` bulunur.
- `openclaw logs --follow`, gerçek zamanlı TwiML'den önce DTMF TwiML'nin sunulduğunu, ardından ilk selamlamanın kuyruğa alındığı bir gerçek zamanlı köprüyü gösterir.
- `googlemeet leave <sessionId>` devredilmiş sesli çağrıyı kapatır.

## Sorun giderme

### Agent Google Meet aracını göremiyor

Plugin'in Gateway yapılandırmasında etkin olduğunu doğrulayın ve Gateway'i yeniden yükleyin:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

`plugins.entries.google-meet` değerini yeni düzenlediyseniz Gateway'i yeniden başlatın veya yeniden yükleyin. Çalışan agent yalnızca geçerli Gateway süreci tarafından kaydedilen Plugin araçlarını görür.

macOS olmayan Gateway ana makinelerinde, agent'a dönük `google_meet` aracı görünür kalır; ancak yerel Chrome konuşma-geri eylemleri ses köprüsüne ulaşmadan engellenir. Yerel Chrome konuşma-geri sesi şu anda macOS `BlackHole 2ch` bağımlıdır; bu nedenle Linux agent'ları varsayılan yerel Chrome agent yolu yerine `mode: "transcribe"`, Twilio telefonla arama veya bir macOS `chrome-node` ana makinesi kullanmalıdır.

### Bağlı Google Meet yetenekli düğüm yok

Düğüm ana makinesinde şunu çalıştırın:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway ana makinesinde düğümü onaylayın ve komutları doğrulayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Düğüm bağlı olmalı ve `googlemeet.chrome` ile `browser.proxy` listelemelidir. Gateway yapılandırması bu düğüm komutlarına izin vermelidir:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup`, `chrome-node-connected` aşamasında başarısız olursa veya Gateway günlüğü `gateway token mismatch` bildirirse düğümü mevcut Gateway token ile yeniden yükleyin veya yeniden başlatın. Bir LAN Gateway için bu genellikle şu anlama gelir:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Ardından düğüm hizmetini yeniden yükleyin ve tekrar çalıştırın:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Tarayıcı açılıyor ancak agent katılamıyor

Yalnızca gözlem katılımları için `googlemeet test-listen` veya gerçek zamanlı katılımlar için `googlemeet test-speech` çalıştırın, ardından döndürülen Chrome sağlık durumunu inceleyin. Herhangi bir yoklama `manualActionRequired: true` bildirirse operatöre `manualActionMessage` gösterin ve tarayıcı eylemi tamamlanana kadar yeniden denemeyi bırakın.

Yaygın manuel eylemler:

- Chrome profiline oturum açın.
- Konuğu Meet ana makine hesabından kabul edin.
- Chrome'un yerel izin istemi göründüğünde Chrome mikrofon/kamera izinlerini verin.
- Takılı kalmış bir Meet izin iletişim kutusunu kapatın veya onarın.

Meet yalnızca "Do you want people to hear you in the meeting?" gösterdiği için "oturum açılmamış" bildirmeyin. Bu, Meet'in ses seçimi ara ekranıdır; OpenClaw, kullanılabilir olduğunda tarayıcı otomasyonu aracılığıyla **Use microphone** seçeneğine tıklar ve gerçek toplantı durumunu beklemeye devam eder. Yalnızca oluşturma amaçlı tarayıcı fallback'i için OpenClaw **Continue without microphone** seçeneğine tıklayabilir, çünkü URL oluşturmak gerçek zamanlı ses yolunu gerektirmez.

### Toplantı oluşturma başarısız oluyor

`googlemeet create`, OAuth kimlik bilgileri yapılandırıldığında önce Google Meet API `spaces.create` uç noktasını kullanır. OAuth kimlik bilgileri olmadan sabitlenmiş Chrome düğümü tarayıcısına fallback yapar. Şunları doğrulayın:

- API oluşturma için: `oauth.clientId` ve `oauth.refreshToken` yapılandırılmıştır veya eşleşen `OPENCLAW_GOOGLE_MEET_*` ortam değişkenleri vardır.
- API oluşturma için: yenileme token'ı oluşturma desteği eklendikten sonra üretilmiştir. Eski token'larda `meetings.space.created` kapsamı eksik olabilir; `openclaw googlemeet auth login --json` komutunu yeniden çalıştırın ve Plugin yapılandırmasını güncelleyin.
- Tarayıcı fallback'i için: `defaultTransport: "chrome-node"` ve `chromeNode.node`, `browser.proxy` ve `googlemeet.chrome` içeren bağlı bir düğümü işaret eder.
- Tarayıcı fallback'i için: o düğümdeki OpenClaw Chrome profili Google'da oturum açmıştır ve `https://meet.google.com/new` açabilir.
- Tarayıcı fallback'i için: yeniden denemeler yeni bir sekme açmadan önce mevcut bir `https://meet.google.com/new` veya Google hesabı istemi sekmesini yeniden kullanır. Bir agent zaman aşımına uğrarsa başka bir Meet sekmesini manuel olarak açmak yerine araç çağrısını yeniden deneyin.
- Tarayıcı fallback'i için: araç `manualActionRequired: true` döndürürse operatörü yönlendirmek için döndürülen `browser.nodeId`, `browser.targetId`, `browserUrl` ve `manualActionMessage` değerlerini kullanın. Bu eylem tamamlanana kadar döngü içinde yeniden denemeyin.
- Tarayıcı fallback'i için: Meet "Do you want people to hear you in the meeting?" gösterirse sekmeyi açık bırakın. OpenClaw, tarayıcı otomasyonu aracılığıyla **Use microphone** veya yalnızca oluşturma fallback'i için **Continue without microphone** seçeneğine tıklamalı ve oluşturulan Meet URL'sini beklemeye devam etmelidir. Bunu yapamazsa hata `google-login-required` değil `meet-audio-choice-required` belirtmelidir.

### Agent katılıyor ancak konuşmuyor

Gerçek zamanlı yolu denetleyin:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Normal STT -> OpenClaw agent -> TTS konuşma-geri yolu için `mode: "agent"` veya doğrudan gerçek zamanlı ses fallback'i için `mode: "bidi"` kullanın. `mode: "transcribe"` bilinçli olarak konuşma-geri köprüsünü başlatmaz. Yalnızca gözlem hata ayıklaması için katılımcılar konuştuktan sonra `openclaw googlemeet status --json <session-id>` çalıştırın ve `captioning`, `transcriptLines` ve `lastCaptionText` değerlerini denetleyin. `inCall` true ise ancak `transcriptLines` `0` olarak kalıyorsa Meet altyazıları devre dışı olabilir, gözlemci yüklendiğinden beri kimse konuşmamış olabilir, Meet kullanıcı arayüzü değişmiş olabilir veya canlı altyazılar toplantı dili/hesabı için kullanılamıyor olabilir.

`googlemeet test-speech` her zaman gerçek zamanlı yolu denetler ve bu çağrı için köprü çıkış baytlarının gözlemlenip gözlemlenmediğini bildirir. `speechOutputVerified` false ve `speechOutputTimedOut` true ise gerçek zamanlı sağlayıcı ifadeyi kabul etmiş olabilir, ancak OpenClaw yeni çıkış baytlarının Chrome ses köprüsüne ulaştığını görmemiştir.

Ayrıca şunları doğrulayın:

- Gateway ana makinesinde `OPENAI_API_KEY` veya `GEMINI_API_KEY` gibi bir gerçek zamanlı sağlayıcı anahtarı kullanılabilir.
- `BlackHole 2ch`, Chrome ana makinesinde görünür.
- `sox`, Chrome ana makinesinde mevcuttur.
- Meet mikrofonu ve hoparlörü OpenClaw tarafından kullanılan sanal ses yolundan yönlendirilir. Yerel Chrome gerçek zamanlı katılımları için `doctor`, `meet output routed: yes` göstermelidir.

`googlemeet doctor [session-id]`; oturumu, düğümü, çağrı içi durumunu, manuel eylem nedenini, gerçek zamanlı sağlayıcı bağlantısını, `realtimeReady` değerini, ses giriş/çıkış etkinliğini, son ses zaman damgalarını, bayt sayaçlarını ve tarayıcı URL'sini yazdırır. Ham JSON gerektiğinde `googlemeet status [session-id] --json` kullanın. Token'ları açığa çıkarmadan Google Meet OAuth yenilemesini doğrulamanız gerektiğinde `googlemeet doctor --oauth` kullanın; ayrıca Google Meet API kanıtı gerektiğinde `--meeting` veya `--create-space` ekleyin.

Bir agent zaman aşımına uğradıysa ve zaten açık bir Meet sekmesi görebiliyorsanız, başka bir sekme açmadan o sekmeyi inceleyin:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Eşdeğer araç eylemi `recover_current_tab` değeridir. Seçilen aktarım için mevcut bir Meet sekmesine odaklanır ve onu inceler. `chrome` ile Gateway üzerinden yerel tarayıcı denetimini kullanır; `chrome-node` ile yapılandırılan Chrome düğümünü kullanır. Yeni sekme açmaz veya yeni oturum oluşturmaz; oturum açma, kabul, izinler veya ses seçimi durumu gibi mevcut engelleyiciyi bildirir. CLI komutu yapılandırılmış Gateway ile konuşur, bu nedenle Gateway çalışıyor olmalıdır; `chrome-node` ayrıca Chrome düğümünün bağlı olmasını gerektirir.

### Twilio kurulum denetimleri başarısız oluyor

`voice-call` izinli veya etkin olmadığında `twilio-voice-call-plugin` başarısız olur. Bunu `plugins.allow` içine ekleyin, `plugins.entries.voice-call` etkinleştirin ve Gateway'i yeniden yükleyin.

Twilio arka ucunda hesap SID'si, auth token'ı veya arayan numara eksik olduğunda `twilio-voice-call-credentials` başarısız olur. Bunları Gateway ana makinesinde ayarlayın:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call` için herkese açık Webhook erişimi olmadığında veya `publicUrl` loopback ya da özel ağ alanını işaret ettiğinde `twilio-voice-call-webhook` başarısız olur. `plugins.entries.voice-call.config.publicUrl` değerini herkese açık sağlayıcı URL'sine ayarlayın veya bir `voice-call` tüneli/Tailscale erişimi yapılandırın.

Loopback ve özel URL'ler operatör callback'leri için geçerli değildir. `publicUrl` olarak `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` veya `fd00::/8` kullanmayın.

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

Yerel geliştirme için özel bir ana makine URL'si yerine bir tünel veya Tailscale
açılımı kullanın:

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

`voicecall smoke` varsayılan olarak yalnızca hazırlık denetimidir. Belirli bir numara için deneme çalıştırması yapmak üzere:

```bash
openclaw voicecall smoke --to "+15555550123"
```

`--yes` seçeneğini yalnızca bilerek canlı bir giden bildirim araması yapmak
istediğinizde ekleyin:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio araması başlıyor ancak toplantıya hiç girmiyor

Meet etkinliğinin telefonla katılma ayrıntılarını sunduğunu doğrulayın. Tam telefonla katılma
numarasını ve PIN'i veya özel bir DTMF dizisini geçirin:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Sağlayıcı PIN'i girmeden önce duraklama gerektiriyorsa `--dtmf-sequence` içinde başta `w`
veya virgüller kullanın.

Telefon araması oluşturuluyor ancak Meet katılımcı listesi telefonla katılan
katılımcıyı hiç göstermiyorsa:

- Delege edilen Twilio arama kimliğini, DTMF'nin kuyruğa alınıp alınmadığını ve giriş selamlamasının istenip istenmediğini doğrulamak için `openclaw googlemeet doctor <session-id>` çalıştırın.
- `openclaw voicecall status --call-id <id>` çalıştırın ve aramanın hâlâ
  etkin olduğunu doğrulayın.
- `openclaw voicecall tail` çalıştırın ve Twilio Webhook'larının Gateway'e
  ulaştığını kontrol edin.
- `openclaw logs --follow` çalıştırın ve Twilio Meet dizisini arayın: Google
  Meet katılmayı delege eder, Voice Call bağlantı öncesi DTMF TwiML'yi depolar ve sunar,
  Voice Call Twilio araması için gerçek zamanlı TwiML sunar, ardından Google Meet
  `voicecall.speak` ile giriş konuşması ister.
- `openclaw googlemeet setup --transport twilio` komutunu yeniden çalıştırın; yeşil kurulum denetimi
  gereklidir ancak toplantı PIN dizisinin doğru olduğunu kanıtlamaz.
- Telefonla katılma numarasının PIN ile aynı Meet davetine ve bölgesine ait olduğunu doğrulayın.
- Meet yavaş yanıt veriyorsa veya arama transkripti bağlantı öncesi DTMF gönderildikten sonra bile
  PIN isteyen istemi göstermeye devam ediyorsa `voiceCall.dtmfDelayMs` değerini 12 saniyelik varsayılandan artırın.
- Katılımcı katılıyor ancak selamlamayı duymuyorsanız, DTMF sonrası `voicecall.speak` isteği ve
  medya akışı TTS oynatımı ya da Twilio `<Say>` yedeği için
  `openclaw logs --follow` çıktısını kontrol edin. Arama transkripti hâlâ "enter the meeting PIN" içeriyorsa,
  telefon bacağı Meet odasına henüz katılmamıştır, bu nedenle toplantı katılımcıları konuşmayı duymayacaktır.

Webhook'lar gelmiyorsa önce Voice Call plugin'inde hata ayıklayın: sağlayıcının
`plugins.entries.voice-call.config.publicUrl` adresine veya yapılandırılmış tünele
erişebilmesi gerekir.
Bkz. [Sesli arama sorun giderme](/tr/plugins/voice-call#troubleshooting).

## Notlar

Google Meet'in resmi medya API'si alma odaklıdır, bu nedenle bir Meet
aramasında konuşmak hâlâ bir katılımcı yolu gerektirir. Bu Plugin bu sınırı görünür tutar:
Chrome tarayıcı katılımını ve yerel ses yönlendirmesini yönetir; Twilio
telefonla katılma katılımını yönetir.

Chrome geri konuşma modları `BlackHole 2ch` ve ayrıca şunlardan birini gerektirir:

- `chrome.audioInputCommand` ile `chrome.audioOutputCommand`: OpenClaw köprüyü sahiplenir ve sesi
  `chrome.audioFormat` içinde bu komutlar ile seçilen sağlayıcı arasında borular. Agent modu gerçek zamanlı transkripsiyon ve normal TTS kullanır;
  bidi modu gerçek zamanlı ses sağlayıcısını kullanır. Varsayılan Chrome yolu,
  `chrome.audioBufferBytes: 4096` ile 24 kHz PCM16'dır; 8 kHz G.711 mu-law eski komut çiftleri için
  kullanılabilir kalır.
- `chrome.audioBridgeCommand`: harici bir köprü komutu tüm yerel
  ses yolunu sahiplenir ve daemon'unu başlattıktan veya doğruladıktan sonra çıkmalıdır. Bu yalnızca
  `bidi` için geçerlidir çünkü `agent` modu TTS için doğrudan komut çifti erişimine ihtiyaç duyar.

Bir agent, agent modunda `google_meet` aracını çağırdığında, toplantı danışmanı
oturumu katılımcı konuşmasına yanıt vermeden önce çağıranın mevcut transkriptini çatallar. Meet oturumu yine de ayrı kalır (`agent:<agentId>:subagent:google-meet:<sessionId>`)
böylece toplantı takipleri çağıran transkriptini doğrudan değiştirmez.

Temiz çift yönlü ses için Meet çıkışını ve Meet mikrofonunu ayrı sanal cihazlar
veya Loopback tarzı bir sanal cihaz grafiği üzerinden yönlendirin. Tek bir paylaşılan
BlackHole cihazı diğer katılımcıları aramaya geri yankılayabilir.

Komut çifti Chrome köprüsüyle, `chrome.bargeInInputCommand` ayrı bir yerel mikrofonu dinleyebilir ve insan konuşmaya başladığında asistan oynatımını temizleyebilir. Bu, paylaşılan
BlackHole loopback girişi asistan oynatımı sırasında geçici olarak bastırılsa bile
insan konuşmasını asistan çıktısının önünde tutar.
`chrome.audioInputCommand` ve `chrome.audioOutputCommand` gibi, bu da
operatör tarafından yapılandırılmış yerel bir komuttur. Açık bir güvenilir komut yolu veya
bağımsız değişken listesi kullanın ve güvenilmeyen konumlardaki betiklere yönlendirmeyin.

`googlemeet speak`, bir Chrome oturumu için etkin geri konuşma ses köprüsünü tetikler.
`googlemeet leave` bu köprüyü durdurur. Voice Call plugin'i üzerinden delege edilen
Twilio oturumları için `leave` ayrıca alttaki sesli aramayı kapatır.
API tarafından yönetilen bir alan için etkin Google Meet konferansını da kapatmak istediğinizde
`googlemeet end-active-conference` kullanın.

## İlgili

- [Voice Call plugin'i](/tr/plugins/voice-call)
- [Konuşma modu](/tr/nodes/talk)
- [Plugin oluşturma](/tr/plugins/building-plugins)
