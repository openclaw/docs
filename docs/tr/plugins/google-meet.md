---
read_when:
    - Bir OpenClaw ajanının bir Google Meet görüşmesine katılmasını istiyorsunuz
    - Bir OpenClaw ajanının yeni bir Google Meet çağrısı oluşturmasını istiyorsunuz
    - Chrome, Chrome düğümü veya Twilio'yu Google Meet aktarım yöntemi olarak yapılandırıyorsunuz
summary: 'Google Meet Plugin''i: aracı geri konuşma varsayılanlarıyla belirtilen Meet URL''lerine Chrome veya Twilio üzerinden katılma'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-04T07:06:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4268ad895bbf83d649b9571c0888c27eb982ad9710dfb408f22f7818cdc5dbcb
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet katılımcı desteği OpenClaw için — Plugin tasarım gereği açıktır:

- Yalnızca açıkça verilen bir `https://meet.google.com/...` URL'sine katılır.
- Google Meet API üzerinden yeni bir Meet alanı oluşturabilir, ardından döndürülen URL'ye katılabilir.
- `agent` varsayılan konuşmaya yanıt modudur: gerçek zamanlı transkripsiyon dinler, yapılandırılmış OpenClaw ajanı yanıt verir ve normal OpenClaw TTS Meet içinde konuşur.
- `bidi`, yedek doğrudan gerçek zamanlı ses modeli modu olarak kullanılabilir kalır.
- Ajanlar katılma davranışını `mode` ile seçer: canlı dinleme/konuşmaya yanıt için `agent`, doğrudan gerçek zamanlı ses yedeği için `bidi` veya konuşmaya yanıt köprüsü olmadan tarayıcıya katılmak/kontrol etmek için `transcribe` kullanın.
- Kimlik doğrulama kişisel Google OAuth veya zaten oturum açılmış bir Chrome profili olarak başlar.
- Otomatik onay duyurusu yoktur.
- Varsayılan Chrome ses arka ucu `BlackHole 2ch`'dir.
- Chrome yerel olarak veya eşleştirilmiş bir Node ana makinesinde çalışabilir.
- Twilio, çevirmeli erişim numarası artı isteğe bağlı PIN veya DTMF dizisi kabul eder; doğrudan bir Meet URL'sini arayamaz.
- CLI komutu `googlemeet`'tir; `meet` daha geniş ajan telekonferans iş akışları için ayrılmıştır.

## Hızlı başlangıç

Yerel ses bağımlılıklarını yükleyin ve gerçek zamanlı transkripsiyon sağlayıcısı ile normal OpenClaw TTS'yi yapılandırın. OpenAI varsayılan transkripsiyon sağlayıcısıdır; Google Gemini Live da `realtime.voiceProvider: "google"` ile ayrı bir `bidi` ses yedeği olarak çalışır:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch`, `BlackHole 2ch` sanal ses aygıtını yükler. Homebrew yükleyicisi, macOS aygıtı göstermeden önce yeniden başlatma gerektirir:

```bash
sudo reboot
```

Yeniden başlattıktan sonra her iki parçayı da doğrulayın:

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

Kurulumu denetleyin:

```bash
openclaw googlemeet setup
```

Kurulum çıktısı ajan tarafından okunabilir ve moda duyarlı olacak şekilde tasarlanmıştır. Chrome profilini, Node sabitlemeyi ve gerçek zamanlı Chrome katılımları için BlackHole/SoX ses köprüsünü ve gecikmeli gerçek zamanlı giriş denetimlerini raporlar. Yalnızca gözlem katılımları için aynı taşıyıcıyı `--mode transcribe` ile denetleyin; bu mod köprü üzerinden dinlemediği veya konuşmadığı için gerçek zamanlı ses önkoşullarını atlar:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Twilio devri yapılandırıldığında kurulum ayrıca `voice-call` Plugin'inin, Twilio kimlik bilgilerinin ve herkese açık Webhook erişiminin hazır olup olmadığını raporlar. Bir ajandan katılmasını istemeden önce herhangi bir `ok: false` denetimini, denetlenen taşıyıcı ve mod için engelleyici olarak ele alın. Betikler veya makine tarafından okunabilir çıktı için `openclaw googlemeet setup --json` kullanın. Bir ajan denemeden önce belirli bir taşıyıcıyı ön denetlemek için `--transport chrome`, `--transport chrome-node` veya `--transport twilio` kullanın.

Twilio için, varsayılan taşıyıcı Chrome olduğunda taşıyıcıyı her zaman açıkça ön denetleyin:

```bash
openclaw googlemeet setup --transport twilio
```

Bu, ajan toplantıyı aramayı denemeden önce eksik `voice-call` kablolamasını, Twilio kimlik bilgilerini veya erişilemeyen Webhook yayınını yakalar.

Bir toplantıya katılın:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Ya da bir ajanın `google_meet` aracı üzerinden katılmasını sağlayın:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Ajan odaklı `google_meet` aracı, yapı, takvim, kurulum, transcribe, Twilio ve `chrome-node` akışları için macOS dışı ana makinelerde kullanılabilir kalır. Yerel Chrome konuşmaya yanıt eylemleri burada engellenir çünkü paketlenen Chrome ses yolu şu anda macOS `BlackHole 2ch`'ye bağlıdır. Linux'ta Chrome konuşmaya yanıt katılımı için `mode: "transcribe"`, Twilio çevirmeli erişimi veya bir macOS `chrome-node` ana makinesi kullanın.

Yeni bir toplantı oluşturun ve katılın:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

API ile oluşturulan odalar için, odanın kapısız giriş politikasının Google hesap varsayılanlarından miras alınmak yerine açık olmasını istediğinizde Google Meet `SpaceConfig.accessType` kullanın:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN`, Meet URL'si olan herkesin kapı çalmadan katılmasına izin verir. `TRUSTED`, ana kuruluşun güvenilir kullanıcılarının, davet edilmiş harici kullanıcıların ve çevirmeli erişim kullanıcılarının kapı çalmadan katılmasına izin verir. `RESTRICTED`, kapı çalmadan girişi davetlilerle sınırlar. Bu ayarlar yalnızca resmi Google Meet API oluşturma yoluna uygulanır, bu nedenle OAuth kimlik bilgileri yapılandırılmalıdır.

Bu seçenek kullanılabilir olmadan önce Google Meet kimlik doğrulaması yaptıysanız, Google OAuth onay ekranınıza `meetings.space.settings` kapsamını ekledikten sonra `openclaw googlemeet auth login --json` komutunu yeniden çalıştırın.

Katılmadan yalnızca URL oluşturun:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` iki yola sahiptir:

- API oluşturma: Google Meet OAuth kimlik bilgileri yapılandırıldığında kullanılır. Bu en deterministik yoldur ve tarayıcı kullanıcı arayüzü durumuna bağlı değildir.
- Tarayıcı yedeği: OAuth kimlik bilgileri olmadığında kullanılır. OpenClaw sabitlenmiş Chrome Node'unu kullanır, `https://meet.google.com/new` adresini açar, Google'ın gerçek bir toplantı kodu URL'sine yönlendirmesini bekler, ardından bu URL'yi döndürür. Bu yol, Node üzerindeki OpenClaw Chrome profilinin Google'da zaten oturum açmış olmasını gerektirir. Tarayıcı otomasyonu Meet'in kendi ilk çalıştırma mikrofon istemini işler; bu istem Google oturum açma hatası olarak değerlendirilmez.
  Katılma ve oluşturma akışları ayrıca yeni bir tane açmadan önce mevcut bir Meet sekmesini yeniden kullanmayı dener. Eşleştirme, `authuser` gibi zararsız URL sorgu dizelerini yok sayar; bu nedenle bir ajan yeniden denemesi, ikinci bir Chrome sekmesi oluşturmak yerine zaten açık olan toplantıya odaklanmalıdır.

Komut/araç çıktısı, ajanların hangi yolun kullanıldığını açıklayabilmesi için bir `source` alanı (`api` veya `browser`) içerir. `create` varsayılan olarak yeni toplantıya katılır ve `joined: true` ile katılma oturumunu döndürür. Yalnızca URL üretmek için CLI'da `create --no-join` kullanın veya araca `"join": false` geçirin.

Ya da bir ajana şunu söyleyin: "Bir Google Meet oluştur, ajan konuşmaya yanıt moduyla katıl ve bağlantıyı bana gönder." Ajan `action: "create"` ile `google_meet` çağırmalı ve ardından döndürülen `meetingUri` değerini paylaşmalıdır.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Yalnızca gözlem/tarayıcı kontrolü katılımı için `"mode": "transcribe"` ayarlayın. Bu, çift yönlü gerçek zamanlı ses köprüsünü başlatmaz, BlackHole veya SoX gerektirmez ve toplantıda yanıt vermez. Bu moddaki Chrome katılımları ayrıca OpenClaw'un mikrofon/kamera izin verme işlemini ve Meet **Mikrofonu kullan** yolunu önler. Meet bir ses seçimi ara ekranı gösterirse otomasyon mikrofonsuz yolu dener ve aksi durumda yerel mikrofonu açmak yerine manuel bir eylem raporlar. Transcribe modunda, yönetilen Chrome taşıyıcıları ayrıca en iyi çaba Meet altyazı gözlemcisi yükler. `googlemeet status --json` ve `googlemeet doctor`, operatörlerin tarayıcının çağrıya katılıp katılmadığını ve Meet altyazılarının metin üretip üretmediğini anlayabilmesi için `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` ve kısa bir `recentTranscript` kuyruğunu gösterir.
Evet/hayır yoklaması gerektiğinde `openclaw googlemeet test-listen <meet-url> --transport chrome-node` kullanın: transcribe modunda katılır, yeni altyazı veya transkript hareketini bekler ve `listenVerified`, `listenTimedOut`, manuel eylem alanları ve en son altyazı sağlığını döndürür.

Gerçek zamanlı oturumlar sırasında `google_meet` durumu `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, son giriş/çıkış zaman damgaları, bayt sayaçları ve köprü kapalı durumu gibi tarayıcı ve ses köprüsü sağlığını içerir. Güvenli bir Meet sayfası istemi görünürse tarayıcı otomasyonu mümkün olduğunda bunu işler. Oturum açma, ana makine kabulü ve tarayıcı/OS izin istemleri, ajanın aktarması için bir neden ve mesajla manuel eylem olarak raporlanır. Yönetilen Chrome oturumları giriş veya test cümlesini yalnızca tarayıcı sağlığı `inCall: true` raporladıktan sonra yayar; aksi durumda durum `speechReady: false` raporlar ve konuşma denemesi, ajan toplantıda konuşmuş gibi davranmak yerine engellenir.

Yerel Chrome katılımları, oturum açılmış OpenClaw tarayıcı profili üzerinden gerçekleşir. Gerçek zamanlı mod, OpenClaw tarafından kullanılan mikrofon/hoparlör yolu için `BlackHole 2ch` gerektirir. Temiz çift yönlü ses için ayrı sanal aygıtlar veya Loopback tarzı bir grafik kullanın; tek bir BlackHole aygıtı ilk duman testi için yeterlidir ancak yankı yapabilir.

### Yerel Gateway + Parallels Chrome

Yalnızca VM'nin Chrome'a sahip olması için bir macOS VM içinde tam bir OpenClaw Gateway veya model API anahtarına ihtiyacınız **yoktur**. Gateway'i ve ajanı yerel olarak çalıştırın, ardından VM içinde bir Node ana makinesi çalıştırın. Node'un Chrome komutunu duyurması için paketlenen Plugin'i VM'de bir kez etkinleştirin:

Nerede ne çalışır:

- Gateway ana makinesi: OpenClaw Gateway, ajan çalışma alanı, model/API anahtarları, gerçek zamanlı sağlayıcı ve Google Meet Plugin yapılandırması.
- Parallels macOS VM: OpenClaw CLI/Node ana makinesi, Google Chrome, SoX, BlackHole 2ch ve Google'da oturum açmış bir Chrome profili.
- VM'de gerekmeyenler: Gateway hizmeti, ajan yapılandırması, OpenAI/GPT anahtarı veya model sağlayıcı kurulumu.

VM bağımlılıklarını yükleyin:

```bash
brew install blackhole-2ch sox
```

BlackHole'u yükledikten sonra macOS'in `BlackHole 2ch` göstermesi için VM'yi yeniden başlatın:

```bash
sudo reboot
```

Yeniden başlattıktan sonra VM'nin ses aygıtını ve SoX komutlarını görebildiğini doğrulayın:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

VM'de OpenClaw'u yükleyin veya güncelleyin, ardından paketlenen Plugin'i orada etkinleştirin:

```bash
openclaw plugins enable google-meet
```

VM'de Node ana makinesini başlatın:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` bir LAN IP'siyse ve TLS kullanmıyorsanız, Node o güvenilir özel ağ için onay vermediğiniz sürece düz metin WebSocket'i reddeder:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` bir süreç ortamıdır, `openclaw.json` ayarı değildir. `openclaw node install`, yükleme komutunda mevcut olduğunda bunu LaunchAgent ortamında saklar.

Node'u Gateway ana makinesinden onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway'in Node'u gördüğünü ve hem `googlemeet.chrome` hem de tarayıcı yeteneği/`browser.proxy` duyurduğunu doğrulayın:

```bash
openclaw nodes status
```

Meet'i Gateway ana makinesinde bu Node üzerinden yönlendirin:

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

veya ajandan `google_meet` aracını `transport: "chrome-node"` ile kullanmasını isteyin.

Bir oturum oluşturan veya yeniden kullanan, bilinen bir cümle söyleyen ve oturum sağlığını yazdıran tek komutluk duman testi için:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Gerçek zamanlı katılma sırasında OpenClaw tarayıcı otomasyonu konuk adını doldurur, Katıl/Katılma iste düğmesine tıklar ve bu istem göründüğünde Meet'in ilk çalıştırmadaki "Mikrofonu kullan" seçimini kabul eder. Yalnızca gözlem katılımı veya yalnızca tarayıcıyla toplantı oluşturma sırasında, aynı istemde mikrofon olmadan devam etme seçeneği mevcutsa onu kullanarak ilerler. Tarayıcı profili oturum açmamışsa, Meet toplantı sahibinin kabulünü bekliyorsa, Chrome gerçek zamanlı katılım için mikrofon/kamera iznine ihtiyaç duyuyorsa veya Meet otomasyonun çözemediği bir istemde takılı kaldıysa, katılma/test konuşması sonucu `manualActionRequired: true` değerini `manualActionReason` ve `manualActionMessage` ile bildirir. Agent'lar katılmayı yeniden denemeyi durdurmalı, bu tam mesajı geçerli `browserUrl`/`browserTitle` ile birlikte raporlamalı ve yalnızca manuel tarayıcı işlemi tamamlandıktan sonra yeniden denemelidir.

`chromeNode.node` atlanırsa, OpenClaw yalnızca tam olarak bir bağlı node hem `googlemeet.chrome` hem de tarayıcı denetimi duyuruyorsa otomatik seçim yapar. Birden fazla yetkin node bağlıysa, `chromeNode.node` değerini node kimliği, görünen ad veya uzak IP olarak ayarlayın.

Yaygın hata denetimleri:

- `Configured Google Meet node ... is not usable: offline`: sabitlenen node Gateway tarafından biliniyor ancak kullanılamıyor. Agent'lar bu node'u kullanılabilir bir Chrome host'u olarak değil, tanılama durumu olarak ele almalı ve kullanıcı bunu istemedikçe başka bir taşıma yöntemine geri dönmek yerine kurulum engelleyicisini raporlamalıdır.
- `No connected Google Meet-capable node`: VM içinde `openclaw node run` başlatın, eşleştirmeyi onaylayın ve VM içinde `openclaw plugins enable google-meet` ile `openclaw plugins enable browser` komutlarının çalıştırıldığından emin olun. Ayrıca Gateway host'unun `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` ile her iki node komutuna da izin verdiğini doğrulayın.
- `BlackHole 2ch audio device not found`: denetlenen host'a `blackhole-2ch` yükleyin ve yerel Chrome sesini kullanmadan önce yeniden başlatın.
- `BlackHole 2ch audio device not found on the node`: VM içine `blackhole-2ch` yükleyin ve VM'i yeniden başlatın.
- Chrome açılıyor ancak katılamıyorsa: VM içindeki tarayıcı profilinde oturum açın veya konuk katılımı için `chrome.guestName` ayarlı kalsın. Konuk otomatik katılımı, node tarayıcı proxy'si üzerinden OpenClaw tarayıcı otomasyonunu kullanır; node tarayıcı yapılandırmasının istediğiniz profili gösterdiğinden emin olun, örneğin `browser.defaultProfile: "user"` veya adlandırılmış bir mevcut oturum profili.
- Yinelenen Meet sekmeleri: `chrome.reuseExistingTab: true` etkin kalsın. OpenClaw yeni bir sekme açmadan önce aynı Meet URL'si için mevcut bir sekmeyi etkinleştirir ve tarayıcıyla toplantı oluşturma, başka bir sekme açmadan önce devam eden bir `https://meet.google.com/new` veya Google hesabı istem sekmesini yeniden kullanır.
- Ses yok: Meet içinde mikrofon/hoparlör sesini OpenClaw tarafından kullanılan sanal ses aygıtı yolu üzerinden yönlendirin; temiz çift yönlü ses için ayrı sanal aygıtlar veya Loopback tarzı yönlendirme kullanın.

## Kurulum notları

Chrome geri konuşma varsayılanı iki harici araç kullanır:

- `sox`: komut satırı ses aracı. Plugin, varsayılan 24 kHz PCM16 ses köprüsü için açık CoreAudio aygıt komutları kullanır.
- `blackhole-2ch`: macOS sanal ses sürücüsü. Chrome/Meet'in üzerinden yönlendirebileceği `BlackHole 2ch` ses aygıtını oluşturur.

OpenClaw bu paketlerin hiçbirini paketlemez veya yeniden dağıtmaz. Belgeler, kullanıcılardan bunları Homebrew üzerinden host bağımlılıkları olarak yüklemelerini ister. SoX `LGPL-2.0-only AND GPL-2.0-only` lisanslıdır; BlackHole GPL-3.0 lisanslıdır. BlackHole'u OpenClaw ile paketleyen bir yükleyici veya aygıt oluşturuyorsanız, BlackHole'un upstream lisans koşullarını gözden geçirin veya Existential Audio'dan ayrı bir lisans alın.

## Taşıma yöntemleri

### Chrome

Chrome taşıma yöntemi, OpenClaw tarayıcı denetimi üzerinden Meet URL'sini açar ve oturum açmış OpenClaw tarayıcı profili olarak katılır. macOS üzerinde Plugin, başlatmadan önce `BlackHole 2ch` varlığını denetler. Yapılandırılmışsa, Chrome'u açmadan önce bir ses köprüsü sağlık komutu ve başlangıç komutu da çalıştırır. Chrome/ses Gateway host'unda çalışıyorsa `chrome`; Chrome/ses Parallels macOS VM gibi eşleştirilmiş bir node üzerinde çalışıyorsa `chrome-node` kullanın. Yerel Chrome için profili `browser.defaultProfile` ile seçin; `chrome.browserProfile`, `chrome-node` host'larına iletilir.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome mikrofon ve hoparlör sesini yerel OpenClaw ses köprüsü üzerinden yönlendirin. `BlackHole 2ch` yüklü değilse, katılım ses yolu olmadan sessizce katılmak yerine bir kurulum hatasıyla başarısız olur.

### Twilio

Twilio taşıma yöntemi, Voice Call Plugin'ine devredilen katı bir arama planıdır. Meet sayfalarını telefon numaraları için ayrıştırmaz.

Chrome katılımı kullanılamadığında veya telefonla arama yedeği istediğinizde bunu kullanın. Google Meet, toplantı için bir telefonla arama numarası ve PIN göstermelidir; OpenClaw bunları Meet sayfasından keşfetmez.

Voice Call Plugin'ini Chrome node'unda değil, Gateway host'unda etkinleştirin:

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

Twilio kimlik bilgilerini ortam veya yapılandırma üzerinden sağlayın. Ortam, gizli değerleri `openclaw.json` dışında tutar:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Gerçek zamanlı ses sağlayıcınız buysa bunun yerine OpenAI sağlayıcı Plugin'i ve `OPENAI_API_KEY` ile `realtime.provider: "openai"` kullanın.

`voice-call` etkinleştirildikten sonra Gateway'i yeniden başlatın veya yeniden yükleyin; Plugin yapılandırma değişiklikleri, yeniden yüklenene kadar zaten çalışan bir Gateway işleminde görünmez.

Ardından doğrulayın:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio devri bağlandığında, `googlemeet setup` başarılı `twilio-voice-call-plugin`, `twilio-voice-call-credentials` ve `twilio-voice-call-webhook` denetimlerini içerir.

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

Google Meet API erişimi kullanıcı OAuth'u kullanır: bir Google Cloud OAuth istemcisi oluşturun, gerekli kapsamları isteyin, bir Google hesabını yetkilendirin, ardından ortaya çıkan yenileme token'ını Google Meet Plugin yapılandırmasında saklayın veya `OPENCLAW_GOOGLE_MEET_*` ortam değişkenlerini sağlayın.

OAuth, Chrome katılma yolunun yerine geçmez. Chrome ve Chrome-node taşıma yöntemleri, tarayıcı katılımı kullandığınızda hâlâ oturum açmış bir Chrome profili, BlackHole/SoX ve bağlı bir node üzerinden katılır. OAuth yalnızca resmi Google Meet API yolu içindir: toplantı alanları oluşturma, alanları çözümleme ve Meet Media API ön denetimleri çalıştırma.

### Google kimlik bilgileri oluşturma

Google Cloud Console içinde:

1. Bir Google Cloud projesi oluşturun veya seçin.
2. Bu proje için **Google Meet REST API**'yi etkinleştirin.
3. OAuth izin ekranını yapılandırın.
   - **Internal**, bir Google Workspace kuruluşu için en basitidir.
   - **External**, kişisel/test kurulumları için çalışır; uygulama Testing durumundayken, uygulamayı yetkilendirecek her Google hesabını test kullanıcısı olarak ekleyin.
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

6. İstemci kimliğini ve istemci sırrını kopyalayın.

`meetings.space.created`, Google Meet `spaces.create` tarafından gereklidir. `meetings.space.readonly`, OpenClaw'ın Meet URL'lerini/kodlarını alanlara çözümlemesini sağlar. `meetings.space.settings`, OpenClaw'ın API odası oluşturma sırasında `accessType` gibi `SpaceConfig` ayarlarını iletmesini sağlar. `meetings.conference.media.readonly`, Meet Media API ön denetimi ve medya çalışmaları içindir; Google, gerçek Media API kullanımı için Developer Preview kaydı gerektirebilir. Yalnızca tarayıcı tabanlı Chrome katılımlarına ihtiyacınız varsa OAuth'u tamamen atlayın.

### Yenileme token'ını üretme

`oauth.clientId` ve isteğe bağlı olarak `oauth.clientSecret` yapılandırın veya bunları ortam değişkenleri olarak iletin, ardından şunu çalıştırın:

```bash
openclaw googlemeet auth login --json
```

Komut, yenileme token'ı içeren bir `oauth` yapılandırma bloğu yazdırır. PKCE, `http://localhost:8085/oauth2callback` üzerinde localhost geri çağrısı ve `--manual` ile manuel kopyala/yapıştır akışı kullanır.

Örnekler:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Tarayıcı yerel geri çağrıya erişemediğinde manuel modu kullanın:

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

`oauth` nesnesini Google Meet Plugin yapılandırması altına kaydedin:

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

Yenileme token'ını yapılandırmada istemediğinizde ortam değişkenlerini tercih edin. Hem yapılandırma hem de ortam değerleri mevcutsa, Plugin önce yapılandırmayı çözer ve sonra ortam geri dönüşünü kullanır.

OAuth izni Meet alanı oluşturmayı, Meet alanı okuma erişimini ve Meet konferans medya okuma erişimini içerir. Toplantı oluşturma desteği var olmadan önce kimlik doğrulaması yaptıysanız, yenileme token'ının `meetings.space.created` kapsamına sahip olması için `openclaw googlemeet auth login --json` komutunu yeniden çalıştırın.

### OAuth'u doctor ile doğrulama

Hızlı, gizli bilgi içermeyen bir sağlık denetimi istediğinizde OAuth doctor'ı çalıştırın:

```bash
openclaw googlemeet doctor --oauth --json
```

Bu, Chrome çalışma zamanını yüklemez veya bağlı bir Chrome node'u gerektirmez. OAuth yapılandırmasının var olduğunu ve yenileme token'ının bir erişim token'ı üretebildiğini denetler. JSON raporu yalnızca `ok`, `configured`, `tokenSource`, `expiresAt` ve denetim mesajları gibi durum alanlarını içerir; erişim token'ını, yenileme token'ını veya istemci sırrını yazdırmaz.

Yaygın sonuçlar:

| Kontrol              | Anlam                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` ile `oauth.refreshToken` veya önbelleğe alınmış bir erişim belirteci mevcut. |
| `oauth-token`        | Önbelleğe alınmış erişim belirteci hâlâ geçerli veya yenileme belirteci yeni bir erişim belirteci üretti. |
| `meet-spaces-get`    | İsteğe bağlı `--meeting` kontrolü mevcut bir Meet alanını çözdü.                         |
| `meet-spaces-create` | İsteğe bağlı `--create-space` kontrolü yeni bir Meet alanı oluşturdu.                    |

Google Meet API etkinleştirmesini ve `spaces.create` kapsamını da kanıtlamak için
yan etki oluşturan oluşturma kontrolünü çalıştırın:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` tek kullanımlık bir Meet URL'si oluşturur. Google Cloud projesinde
Meet API'nin etkin olduğunu ve yetkilendirilmiş hesabın
`meetings.space.created` kapsamına sahip olduğunu doğrulamanız gerektiğinde bunu kullanın.

Mevcut bir toplantı alanı için okuma erişimini kanıtlamak için:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` ve `resolve-space`, yetkilendirilmiş Google hesabının
erişebildiği mevcut bir alana okuma erişimini kanıtlar. Bu kontrollerden gelen
bir `403` genellikle Google Meet REST API'nin devre dışı olduğu, onaylanan
yenileme belirtecinde gerekli kapsamın eksik olduğu veya Google hesabının bu Meet
alanına erişemediği anlamına gelir. Bir yenileme belirteci hatası, `openclaw googlemeet auth login
--json` komutunu yeniden çalıştırmanız ve yeni `oauth` bloğunu saklamanız gerektiği anlamına gelir.

Tarayıcı yedek yolu için OAuth kimlik bilgileri gerekmez. Bu modda Google
kimlik doğrulaması OpenClaw yapılandırmasından değil, seçilen Node üzerindeki
oturum açmış Chrome profilinden gelir.

Bu ortam değişkenleri yedek olarak kabul edilir:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` or `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` or `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` or `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` or `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` or
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` or `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` or `GOOGLE_MEET_PREVIEW_ACK`

Bir Meet URL'sini, kodunu veya `spaces/{id}` değerini `spaces.get` üzerinden çözün:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Medya çalışmasından önce ön kontrolü çalıştırın:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet konferans kayıtlarını oluşturduktan sonra toplantı yapıtlarını ve katılımı listeleyin:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting` ile `artifacts` ve `attendance` varsayılan olarak en son konferans
kaydını kullanır. Bu toplantı için saklanan tüm kayıtları istediğinizde
`--all-conference-records` değerini iletin.

Takvim araması, Meet yapıtlarını okumadan önce toplantı URL'sini Google Calendar'dan çözebilir:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today`, Google Meet bağlantısı olan bir Calendar etkinliği için bugünün
`primary` takviminde arama yapar. Eşleşen etkinlik metnini aramak için
`--event <query>`, birincil olmayan bir takvim için `--calendar <id>` kullanın.
Takvim araması, Calendar etkinlikleri salt okunur kapsamını içeren yeni bir
OAuth oturumu gerektirir. `calendar-events`, eşleşen Meet etkinliklerini önizler
ve `latest`, `artifacts`, `attendance` veya `export` tarafından seçilecek
etkinliği işaretler.

Konferans kayıt kimliğini zaten biliyorsanız, doğrudan ona başvurun:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Aramadan sonra odayı kapatmak istediğinizde API ile oluşturulmuş bir alan için
etkin konferansı sonlandırın:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Bu, Google Meet `spaces.endActiveConference` çağrısını yapar ve yetkilendirilmiş
hesabın yönetebildiği bir alan için `meetings.space.created` kapsamına sahip OAuth
gerektirir. OpenClaw bir Meet URL'si, toplantı kodu veya `spaces/{id}` girdisi
kabul eder ve etkin konferansı sonlandırmadan önce bunu API alan kaynağına çözer.
Bu, `googlemeet leave` komutundan ayrıdır: `leave`, OpenClaw'ın yerel/oturum
katılımını durdururken `end-active-conference`, Google Meet'ten alanın etkin
konferansını sonlandırmasını ister.

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

`artifacts`, Google toplantı için sunduğunda konferans kayıt meta verilerini,
katılımcı, kayıt, döküm, yapılandırılmış döküm girdisi ve akıllı not kaynak meta
verileriyle birlikte döndürür. Büyük toplantılarda girdi aramasını atlamak için
`--no-transcript-entries` kullanın. `attendance`, katılımcıları ilk/son görülme
zamanları, toplam oturum süresi, geç/erken ayrılma bayrakları ve oturum açmış
kullanıcıya ya da görünen ada göre birleştirilmiş yinelenen katılımcı
kaynaklarıyla katılımcı oturumu satırlarına genişletir. Ham katılımcı kaynaklarını
ayrı tutmak için `--no-merge-duplicates`, geç kalma algılamasını ayarlamak için
`--late-after-minutes` ve erken ayrılma algılamasını ayarlamak için
`--early-before-minutes` iletin.

`export`, `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`,
`attendance.json` ve `manifest.json` içeren bir klasör yazar. `manifest.json`,
seçilen girdiyi, dışa aktarma seçeneklerini, konferans kayıtlarını, çıktı
dosyalarını, sayıları, belirteç kaynağını, kullanıldıysa Calendar etkinliğini ve
kısmi alma uyarılarını kaydeder. Klasörün yanına taşınabilir bir arşiv de yazmak
için `--zip` iletin. Bağlantılı döküm ve akıllı not Google Docs metnini Google
Drive `files.export` üzerinden dışa aktarmak için `--include-doc-bodies` iletin;
bu, Drive Meet salt okunur kapsamını içeren yeni bir OAuth oturumu gerektirir.
`--include-doc-bodies` olmadan dışa aktarmalar yalnızca Meet meta verilerini ve
yapılandırılmış döküm girdilerini içerir. Google akıllı not listeleme, döküm
girdisi veya Drive belge gövdesi hatası gibi kısmi bir yapıt hatası döndürürse,
özet ve manifest tüm dışa aktarmayı başarısız kılmak yerine uyarıyı saklar.
Klasör veya ZIP oluşturmadan aynı yapıt/katılım verilerini almak ve manifest
JSON'unu yazdırmak için `--dry-run` kullanın. Bu, büyük bir dışa aktarma yazmadan
önce veya bir ajanın yalnızca sayılara, seçilen kayıtlara ve uyarılara ihtiyaç
duyduğu durumlarda kullanışlıdır.

Ajanlar aynı paketi `google_meet` aracı üzerinden de oluşturabilir:

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

Ajanlar açık bir erişim ilkesiyle API destekli bir oda da oluşturabilir:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
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

Önce dinleme doğrulaması için ajanlar, toplantının yararlı olduğunu iddia etmeden
önce `test_listen` kullanmalıdır:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Gerçek bir saklanan toplantıya karşı korumalı canlı smoke testini çalıştırın:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Birinin konuşacağı ve Meet altyazılarının kullanılabilir olacağı bir toplantıya
karşı canlı önce dinleme tarayıcı sondasını çalıştırın:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Canlı smoke ortamı:

- `OPENCLAW_LIVE_TEST=1` korumalı canlı testleri etkinleştirir.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` saklanan bir Meet URL'sini, kodunu veya
  `spaces/{id}` değerini gösterir.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` or `GOOGLE_MEET_CLIENT_ID` OAuth
  istemci kimliğini sağlar.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` or `GOOGLE_MEET_REFRESH_TOKEN` yenileme
  belirtecini sağlar.
- İsteğe bağlı: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ve
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`, `OPENCLAW_` öneki olmadan
  aynı yedek adları kullanır.

Temel yapıt/katılım canlı smoke testi
`https://www.googleapis.com/auth/meetings.space.readonly` ve
`https://www.googleapis.com/auth/meetings.conference.media.readonly` gerektirir.
Takvim araması `https://www.googleapis.com/auth/calendar.events.readonly`
gerektirir. Drive belge gövdesi dışa aktarması
`https://www.googleapis.com/auth/drive.meet.readonly` gerektirir.

Yeni bir Meet alanı oluşturun:

```bash
openclaw googlemeet create
```

Komut yeni `meeting uri` değerini, kaynağı ve katılma oturumunu yazdırır. OAuth
kimlik bilgileriyle resmi Google Meet API'yi kullanır. OAuth kimlik bilgileri
olmadan, yedek olarak sabitlenmiş Chrome Node'un oturum açmış tarayıcı profilini
kullanır. Ajanlar tek adımda oluşturmak ve katılmak için `action: "create"` ile
`google_meet` aracını kullanabilir. Yalnızca URL oluşturmak için `"join": false`
iletin.

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

Tarayıcı yedek yolu, URL'yi oluşturamadan önce Google oturum açma veya Meet izin
engelleyicisine takılırsa, Gateway yöntemi başarısız bir yanıt döndürür ve
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

Bir ajan `manualActionRequired: true` gördüğünde, `manualActionMessage` değerini
tarayıcı Node/sekme bağlamıyla birlikte bildirmeli ve operatör tarayıcı adımını
tamamlayana kadar yeni Meet sekmeleri açmayı durdurmalıdır.

API ile oluşturmadan örnek JSON çıktısı:

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

Meet oluşturmak varsayılan olarak katılım sağlar. Chrome veya Chrome-node aktarımı yine de tarayıcı üzerinden katılmak için oturum açılmış bir Google Chrome profiline ihtiyaç duyar. Profilin oturumu kapalıysa OpenClaw `manualActionRequired: true` ya da bir tarayıcı geri dönüş hatası bildirir ve operatörden yeniden denemeden önce Google girişini tamamlamasını ister.

`preview.enrollmentAcknowledged: true` değerini yalnızca Cloud projenizin, OAuth yetkilinizin ve toplantı katılımcılarınızın Meet medya API'leri için Google Workspace Developer Preview Program'a kayıtlı olduğunu doğruladıktan sonra ayarlayın.

## Yapılandırma

Ortak Chrome ajan yolu yalnızca Plugin'in etkin olmasına, BlackHole'a, SoX'a, bir gerçek zamanlı transkripsiyon sağlayıcı anahtarına ve yapılandırılmış bir OpenClaw TTS sağlayıcısına ihtiyaç duyar. OpenAI varsayılan transkripsiyon sağlayıcısıdır; varsayılan ajan modu transkripsiyon sağlayıcısını değiştirmeden `bidi` modu için Google Gemini Live kullanmak üzere `realtime.voiceProvider` değerini `"google"` ve `realtime.model` değerini ayarlayın:

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
- `defaultMode: "agent"` (`"realtime"` yalnızca `"agent"` için eski uyumluluk takma adı olarak kabul edilir; yeni araç çağrıları `"agent"` demelidir)
- `chromeNode.node`: `chrome-node` için isteğe bağlı Node kimliği/adı/IP'si
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: oturumu kapalı Meet konuk ekranında kullanılan ad
- `chrome.autoJoin: true`: `chrome-node` üzerinde OpenClaw tarayıcı otomasyonu aracılığıyla en iyi çabayla konuk adı doldurma ve Join Now tıklaması
- `chrome.reuseExistingTab: true`: kopyalar açmak yerine mevcut bir Meet sekmesini etkinleştir
- `chrome.waitForInCallMs: 20000`: geri konuşma girişi tetiklenmeden önce Meet sekmesinin çağrı içinde olduğunu bildirmesini bekle
- `chrome.audioFormat: "pcm16-24khz"`: komut çifti ses biçimi. `"g711-ulaw-8khz"` değerini yalnızca hâlâ telefon sesi yayan eski/özel komut çiftleri için kullanın.
- `chrome.audioBufferBytes: 4096`: oluşturulan Chrome komut çifti ses komutları için SoX işleme arabelleği. Bu, SoX'un varsayılan 8192 baytlık arabelleğinin yarısıdır; yoğun ana makinelerde yükseltmek için alan bırakırken varsayılan boru gecikmesini azaltır. SoX'un minimumunun altındaki değerler 17 bayta sabitlenir.
- `chrome.audioInputCommand`: CoreAudio `BlackHole 2ch` kaynağından okuyan ve `chrome.audioFormat` içinde ses yazan SoX komutu
- `chrome.audioOutputCommand`: `chrome.audioFormat` içinde ses okuyan ve CoreAudio `BlackHole 2ch` hedefine yazan SoX komutu
- `chrome.bargeInInputCommand`: asistan oynatması etkinken insan araya girmesini algılamak için işaretli 16 bit küçük endian mono PCM yazan isteğe bağlı yerel mikrofon komutu. Bu şu anda Gateway tarafından barındırılan `chrome` komut çifti köprüsü için geçerlidir.
- `chrome.bargeInRmsThreshold: 650`: `chrome.bargeInInputCommand` üzerinde insan kesintisi olarak sayılan RMS düzeyi
- `chrome.bargeInPeakThreshold: 2500`: `chrome.bargeInInputCommand` üzerinde insan kesintisi olarak sayılan tepe düzeyi
- `chrome.bargeInCooldownMs: 900`: yinelenen insan kesintisi temizlemeleri arasındaki minimum gecikme
- `mode: "agent"`: varsayılan geri konuşma modu. Katılımcı konuşması yapılandırılmış gerçek zamanlı transkripsiyon sağlayıcısı tarafından yazıya dökülür, toplantı başına alt ajan oturumunda yapılandırılmış OpenClaw ajanına gönderilir ve normal OpenClaw TTS çalışma zamanı üzerinden seslendirilir.
- `mode: "bidi"`: geri dönüş amaçlı doğrudan çift yönlü gerçek zamanlı model modu. Gerçek zamanlı ses sağlayıcısı katılımcı konuşmasını doğrudan yanıtlar ve daha derin/araç destekli yanıtlar için `openclaw_agent_consult` çağırabilir.
- `mode: "transcribe"`: geri konuşma köprüsü olmayan yalnızca gözlem modu.
- `realtime.provider: "openai"`: aşağıdaki kapsamlı sağlayıcı alanları ayarlanmadığında kullanılan uyumluluk geri dönüşü.
- `realtime.transcriptionProvider: "openai"`: `agent` modunun gerçek zamanlı transkripsiyon için kullandığı sağlayıcı kimliği.
- `realtime.voiceProvider`: `bidi` modunun doğrudan gerçek zamanlı ses için kullandığı sağlayıcı kimliği. Ajan modu transkripsiyonunu OpenAI üzerinde tutarken Gemini Live kullanmak için bunu `"google"` olarak ayarlayın.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: daha derin yanıtlar için `openclaw_agent_consult` ile kısa sözlü yanıtlar
- `realtime.introMessage`: gerçek zamanlı köprü bağlandığında kısa sözlü hazır olma denetimi; sessiz katılmak için bunu `""` olarak ayarlayın
- `realtime.agentId`: `openclaw_agent_consult` için isteğe bağlı OpenClaw ajan kimliği; varsayılan `main`

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
        voice: "Kore",
      },
    },
  },
}
```

Hem ajan modu dinleme hem de konuşma için ElevenLabs:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
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

Kalıcı Meet sesi `messages.tts.providers.elevenlabs.voiceId` kaynağından gelir. TTS modeli geçersiz kılmaları etkinleştirildiğinde ajan yanıtları yanıt başına `[[tts:voiceId=... model=eleven_v3]]` yönergelerini de kullanabilir, ancak yapılandırma toplantılar için deterministik varsayılandır. Katılımda günlükler `transcriptionProvider=elevenlabs` göstermeli ve her sözlü yanıt `provider=elevenlabs model=eleven_v3 voice=<voiceId>` kaydetmelidir.

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

`voiceCall.enabled` varsayılan olarak `true` değerindedir; Twilio aktarımıyla gerçek PSTN çağrısını, DTMF'yi ve giriş selamlamasını Voice Call Plugin'e devreder. Voice Call gerçek zamanlı medya akışını açmadan önce DTMF dizisini çalar, ardından kaydedilmiş giriş metnini ilk gerçek zamanlı selamlama olarak kullanır. `voice-call` etkin değilse Google Meet arama planını yine de doğrulayabilir ve kaydedebilir, ancak Twilio çağrısını başlatamaz.

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

Chrome Gateway ana makinesinde çalıştığında `transport: "chrome"` kullanın. Chrome, Parallels VM gibi eşleştirilmiş bir Node üzerinde çalıştığında `transport: "chrome-node"` kullanın. Her iki durumda da model sağlayıcıları ve `openclaw_agent_consult` Gateway ana makinesinde çalışır, böylece model kimlik bilgileri orada kalır. Varsayılan `mode: "agent"` ile gerçek zamanlı transkripsiyon sağlayıcısı dinlemeyi işler, yapılandırılmış OpenClaw ajanı yanıtı üretir ve normal OpenClaw TTS bunu Meet'e seslendirir. Gerçek zamanlı ses modelinin doğrudan yanıt vermesini istediğinizde `mode: "bidi"` kullanın. Ham `mode: "realtime"`, `mode: "agent"` için eski uyumluluk takma adı olarak kabul edilmeye devam eder, ancak artık ajan araç şemasında duyurulmaz. Ajan modu günlükleri, köprü başlangıcında çözümlenen transkripsiyon sağlayıcısını/modelini ve her sentezlenen yanıt sonrasında TTS sağlayıcısını, modelini, sesini, çıktı biçimini ve örnekleme hızını içerir.

Etkin oturumları listelemek veya bir oturum kimliğini incelemek için `action: "status"` kullanın. Gerçek zamanlı ajanın hemen konuşmasını sağlamak için `sessionId` ve `message` ile `action: "speak"` kullanın. Oturumu oluşturmak veya yeniden kullanmak, bilinen bir ifadeyi tetiklemek ve Chrome ana makinesi bunu bildirebildiğinde `inCall` sağlığını döndürmek için `action: "test_speech"` kullanın. `test_speech` her zaman `mode: "agent"` zorlar ve `mode: "transcribe"` içinde çalıştırılması istenirse başarısız olur; çünkü yalnızca gözlem oturumları kasıtlı olarak konuşma yayamaz. `speechOutputVerified` sonucu, bu test çağrısı sırasında gerçek zamanlı ses çıkışı baytlarının artmasına dayanır; bu nedenle eski sesi olan yeniden kullanılan bir oturum yeni başarılı konuşma denetimi olarak sayılmaz. Bir oturumu sonlandı olarak işaretlemek için `action: "leave"` kullanın.

`status`, kullanılabilir olduğunda Chrome sağlığını içerir:

- `inCall`: Chrome Meet çağrısının içinde görünüyor
- `micMuted`: en iyi çabayla Meet mikrofon durumu
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: konuşmanın çalışabilmesi için tarayıcı profilinin manuel girişe, Meet sahibi kabulüne, izinlere veya tarayıcı denetimi onarımına ihtiyacı var
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: yönetilen Chrome konuşmasına şu anda izin verilip verilmediği. `speechReady: false`, OpenClaw'ın giriş/test ifadesini ses köprüsüne göndermediği anlamına gelir.
- `providerConnected` / `realtimeReady`: gerçek zamanlı ses köprüsü durumu
- `lastInputAt` / `lastOutputAt`: köprüden görülen veya köprüye gönderilen son ses
- `audioOutputRouted` / `audioOutputDeviceLabel`: Meet sekmesinin medya çıkışının köprünün kullandığı BlackHole aygıtına etkin olarak yönlendirilip yönlendirilmediği
- `lastSuppressedInputAt` / `suppressedInputBytes`: asistan oynatması etkinken yok sayılan loopback girdisi

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Ajan ve Bidi Modları

Chrome `agent` modu, "ajanım toplantıda" davranışı için optimize edilmiştir. Gerçek zamanlı transkripsiyon sağlayıcısı toplantı sesini duyar, nihai katılımcı transkriptleri yapılandırılmış OpenClaw ajanı üzerinden yönlendirilir ve yanıt normal OpenClaw TTS çalışma zamanı üzerinden seslendirilir. Gerçek zamanlı ses modelinin doğrudan yanıt vermesini istediğinizde `mode: "bidi"` ayarlayın.
Yakındaki nihai transkript parçaları danışmadan önce birleştirilir; böylece tek bir sözlü sıra birkaç eski kısmi yanıt üretmez. Kuyruğa alınmış asistan sesi hâlâ çalarken gerçek zamanlı girdi de bastırılır ve yakın tarihli asistan benzeri transkript yankıları ajan danışmasından önce yok sayılır; böylece BlackHole loopback ajanının kendi konuşmasına yanıt vermesine neden olmaz.

| Mod     | Yanıta kim karar verir        | Konuşma çıkış yolu                     | Ne zaman kullanılır                                   |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | Yapılandırılmış OpenClaw ajanı | Normal OpenClaw TTS çalışma zamanı     | "ajanım toplantıda" davranışı istediğinizde           |
| `bidi`  | Gerçek zamanlı ses modeli      | Gerçek zamanlı ses sağlayıcısı yanıtı  | En düşük gecikmeli konuşmalı ses döngüsünü istediğinizde |

`bidi` modunda, gerçek zamanlı model daha derin akıl yürütmeye, güncel bilgilere veya normal OpenClaw araçlarına ihtiyaç duyduğunda `openclaw_agent_consult` çağırabilir.

Danışma aracı, perde arkasında düzenli OpenClaw ajanını son toplantı dökümü bağlamıyla çalıştırır ve kısa bir sözlü yanıt döndürür. `agent` modunda OpenClaw bu yanıtı doğrudan TTS çalışma zamanına gönderir; `bidi` modunda gerçek zamanlı ses modeli danışma sonucunu toplantıya geri seslendirebilir. Voice Call ile aynı paylaşılan danışma mekanizmasını kullanır.

Varsayılan olarak danışmalar `main` ajanına karşı çalışır. Bir Meet hattının özel bir OpenClaw ajan çalışma alanına, model varsayılanlarına, araç ilkesine, belleğe ve oturum geçmişine danışması gerektiğinde `realtime.agentId` ayarını yapın.

Ajan modu danışmaları, takip sorularının yapılandırılan ajandan normal ajan ilkesini devralırken toplantı bağlamını koruması için toplantı başına bir `agent:<id>:subagent:google-meet:<session>` oturum anahtarı kullanır.

`realtime.toolPolicy`, danışma çalıştırmasını denetler:

- `safe-read-only`: danışma aracını kullanıma açar ve düzenli ajanı `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` ve `memory_get` ile sınırlar.
- `owner`: danışma aracını kullanıma açar ve düzenli ajanın normal ajan araç ilkesini kullanmasına izin verir.
- `none`: danışma aracını gerçek zamanlı ses modeline açmaz.

Danışma oturum anahtarı Meet oturumu başına kapsamlandırılır, böylece takip danışma çağrıları aynı toplantı sırasında önceki danışma bağlamını yeniden kullanabilir.

Chrome çağrıya tamamen katıldıktan sonra sözlü bir hazır olma denetimini zorlamak için:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Tam katıl-ve-konuş smoke testi için:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Canlı test kontrol listesi

Bir toplantıyı gözetimsiz bir ajana devretmeden önce bu sırayı kullanın:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Beklenen Chrome-node durumu:

- `googlemeet setup` tamamen yeşildir.
- Chrome-node varsayılan aktarım olduğunda veya bir node sabitlendiğinde `googlemeet setup`, `chrome-node-connected` içerir.
- `nodes status`, seçili node'un bağlı olduğunu gösterir.
- Seçili node hem `googlemeet.chrome` hem de `browser.proxy` duyurur.
- Meet sekmesi çağrıya katılır ve `test-speech`, `inCall: true` ile Chrome sağlığını döndürür.

Parallels macOS VM gibi uzak bir Chrome ana makinesi için, Gateway veya VM güncellendikten sonra en kısa güvenli denetim şudur:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Bu, gerçek bir toplantı sekmesi açmadan önce Gateway Plugin'in yüklendiğini, VM node'unun geçerli token ile bağlı olduğunu ve Meet ses köprüsünün kullanılabilir olduğunu kanıtlar.

Twilio smoke testi için telefonla arama bilgilerini gösteren bir toplantı kullanın:

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
- `openclaw logs --follow`, gerçek zamanlı TwiML'den önce DTMF TwiML'in sunulduğunu, ardından ilk selamlamanın kuyruğa alındığı gerçek zamanlı bir köprüyü gösterir.
- `googlemeet leave <sessionId>`, devredilmiş sesli çağrıyı kapatır.

## Sorun giderme

### Ajan Google Meet aracını göremiyor

Plugin'in Gateway yapılandırmasında etkin olduğunu doğrulayın ve Gateway'i yeniden yükleyin:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

`plugins.entries.google-meet` ayarını yeni düzenlediyseniz Gateway'i yeniden başlatın veya yeniden yükleyin. Çalışan ajan yalnızca geçerli Gateway işlemi tarafından kaydedilen Plugin araçlarını görür.

macOS dışı Gateway ana makinelerinde, ajana dönük `google_meet` aracı görünür kalır, ancak yerel Chrome talk-back eylemleri ses köprüsüne ulaşmadan önce engellenir. Yerel Chrome talk-back sesi şu anda macOS `BlackHole 2ch` bağımlıdır; bu nedenle Linux ajanları varsayılan yerel Chrome ajan yolu yerine `mode: "transcribe"`, Twilio telefonla katılım veya macOS `chrome-node` ana makinesi kullanmalıdır.

### Bağlı Google Meet özellikli node yok

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

Node bağlı olmalı ve `browser.proxy` ile birlikte `googlemeet.chrome` listelemelidir. Gateway yapılandırması bu node komutlarına izin vermelidir:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup`, `chrome-node-connected` aşamasında başarısız olursa veya Gateway günlüğü `gateway token mismatch` bildirirse node'u geçerli Gateway token ile yeniden kurun veya yeniden başlatın. Bir LAN Gateway için bu genellikle şu anlama gelir:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Ardından node servisini yeniden yükleyin ve tekrar çalıştırın:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Tarayıcı açılıyor ama ajan katılamıyor

Yalnızca gözlem katılımları için `googlemeet test-listen` veya gerçek zamanlı katılımlar için `googlemeet test-speech` çalıştırın, ardından döndürülen Chrome sağlığını inceleyin. Sorgulardan biri `manualActionRequired: true` bildirirse operatöre `manualActionMessage` gösterin ve tarayıcı eylemi tamamlanana kadar yeniden denemeyi durdurun.

Yaygın manuel eylemler:

- Chrome profiline giriş yapın.
- Misafiri Meet ana makine hesabından kabul edin.
- Chrome'un yerel izin istemi göründüğünde Chrome mikrofon/kamera izinlerini verin.
- Takılı kalmış bir Meet izin iletişim kutusunu kapatın veya onarın.

Meet yalnızca "Do you want people to hear you in the meeting?" gösterdiği için "giriş yapılmamış" bildirmeyin. Bu, Meet'in ses seçimi ara ekranıdır; OpenClaw uygun olduğunda tarayıcı otomasyonu aracılığıyla **Use microphone** seçeneğine tıklar ve gerçek toplantı durumunu beklemeyi sürdürür. Yalnızca oluşturma tarayıcı fallback'i için OpenClaw **Continue without microphone** seçeneğine tıklayabilir, çünkü URL oluşturmak gerçek zamanlı ses yoluna ihtiyaç duymaz.

### Toplantı oluşturma başarısız oluyor

`googlemeet create`, OAuth kimlik bilgileri yapılandırıldığında önce Google Meet API `spaces.create` uç noktasını kullanır. OAuth kimlik bilgileri olmadığında sabitlenmiş Chrome node tarayıcısına fallback yapar. Şunları doğrulayın:

- API oluşturma için: `oauth.clientId` ve `oauth.refreshToken` yapılandırılmıştır veya eşleşen `OPENCLAW_GOOGLE_MEET_*` ortam değişkenleri mevcuttur.
- API oluşturma için: refresh token, oluşturma desteği eklendikten sonra üretilmiştir. Daha eski token'larda `meetings.space.created` kapsamı eksik olabilir; `openclaw googlemeet auth login --json` komutunu yeniden çalıştırın ve Plugin yapılandırmasını güncelleyin.
- Tarayıcı fallback'i için: `defaultTransport: "chrome-node"` ve `chromeNode.node`, `browser.proxy` ve `googlemeet.chrome` bulunan bağlı bir node'u gösterir.
- Tarayıcı fallback'i için: bu node üzerindeki OpenClaw Chrome profili Google'a giriş yapmıştır ve `https://meet.google.com/new` açabilir.
- Tarayıcı fallback'i için: yeniden denemeler yeni bir sekme açmadan önce mevcut bir `https://meet.google.com/new` veya Google hesabı istemi sekmesini yeniden kullanır. Bir ajan zaman aşımına uğrarsa başka bir Meet sekmesini manuel açmak yerine araç çağrısını yeniden deneyin.
- Tarayıcı fallback'i için: araç `manualActionRequired: true` döndürürse operatöre yol göstermek için döndürülen `browser.nodeId`, `browser.targetId`, `browserUrl` ve `manualActionMessage` değerlerini kullanın. Bu eylem tamamlanana kadar döngü içinde yeniden denemeyin.
- Tarayıcı fallback'i için: Meet "Do you want people to hear you in the meeting?" gösterirse sekmeyi açık bırakın. OpenClaw, tarayıcı otomasyonu aracılığıyla **Use microphone** veya yalnızca oluşturma fallback'i için **Continue without microphone** seçeneğine tıklamalı ve oluşturulan Meet URL'sini beklemeye devam etmelidir. Bunu yapamazsa hata `google-login-required` değil, `meet-audio-choice-required` belirtmelidir.

### Ajan katılıyor ama konuşmuyor

Gerçek zamanlı yolu denetleyin:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Normal STT -> OpenClaw ajanı -> TTS talk-back yolu için `mode: "agent"` kullanın veya doğrudan gerçek zamanlı ses fallback'i için `mode: "bidi"` kullanın. `mode: "transcribe"` kasıtlı olarak talk-back köprüsünü başlatmaz. Yalnızca gözlem hata ayıklaması için katılımcılar konuştuktan sonra `openclaw googlemeet status --json <session-id>` çalıştırın ve `captioning`, `transcriptLines` ile `lastCaptionText` değerlerini denetleyin. `inCall` true ise ancak `transcriptLines` `0` değerinde kalıyorsa Meet altyazıları devre dışı olabilir, gözlemci kurulduğundan beri kimse konuşmamış olabilir, Meet UI değişmiş olabilir veya toplantı dili/hesabı için canlı altyazılar kullanılamıyor olabilir.

`googlemeet test-speech` her zaman gerçek zamanlı yolu denetler ve bu çağrı için köprü çıktı byte'larının gözlenip gözlenmediğini bildirir. `speechOutputVerified` false ve `speechOutputTimedOut` true ise gerçek zamanlı sağlayıcı ifadeyi kabul etmiş olabilir, ancak OpenClaw Chrome ses köprüsüne ulaşan yeni çıktı byte'larını görmemiştir.

Ayrıca şunları doğrulayın:

- Gateway ana makinesinde `OPENAI_API_KEY` veya `GEMINI_API_KEY` gibi bir gerçek zamanlı sağlayıcı anahtarı kullanılabilir.
- Chrome ana makinesinde `BlackHole 2ch` görünür.
- Chrome ana makinesinde `sox` vardır.
- Meet mikrofonu ve hoparlörü OpenClaw tarafından kullanılan sanal ses yolu üzerinden yönlendirilir. Yerel Chrome gerçek zamanlı katılımları için `doctor`, `meet output routed: yes` göstermelidir.

`googlemeet doctor [session-id]`, oturumu, node'u, çağrı içi durumu, manuel eylem nedenini, gerçek zamanlı sağlayıcı bağlantısını, `realtimeReady`, ses giriş/çıkış etkinliğini, son ses zaman damgalarını, byte sayaçlarını ve tarayıcı URL'sini yazdırır. Ham JSON gerektiğinde `googlemeet status [session-id] --json` kullanın. Token'ları açığa çıkarmadan Google Meet OAuth yenilemeyi doğrulamanız gerektiğinde `googlemeet doctor --oauth` kullanın; Google Meet API kanıtı da gerektiğinde `--meeting` veya `--create-space` ekleyin.

Bir ajan zaman aşımına uğradıysa ve zaten açık bir Meet sekmesi görüyorsanız başka bir sekme açmadan o sekmeyi inceleyin:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Eşdeğer araç eylemi `recover_current_tab` olur. Seçili aktarım için mevcut bir Meet sekmesine odaklanır ve onu inceler. `chrome` ile Gateway üzerinden yerel tarayıcı denetimini kullanır; `chrome-node` ile yapılandırılmış Chrome node'u kullanır. Yeni bir sekme açmaz veya yeni bir oturum oluşturmaz; oturum açma, kabul, izinler veya ses seçimi durumu gibi geçerli engelleyiciyi bildirir. CLI komutu yapılandırılmış Gateway ile konuşur, bu nedenle Gateway çalışıyor olmalıdır; `chrome-node` ayrıca Chrome node'unun bağlı olmasını gerektirir.

### Twilio kurulum denetimleri başarısız oluyor

`twilio-voice-call-plugin`, `voice-call` izin verilmediğinde veya etkin olmadığında başarısız olur. Bunu `plugins.allow` içine ekleyin, `plugins.entries.voice-call` ayarını etkinleştirin ve Gateway'i yeniden yükleyin.

`twilio-voice-call-credentials`, Twilio backend'inde hesap SID'si, auth token veya arayan numarası eksik olduğunda başarısız olur. Bunları Gateway ana makinesinde ayarlayın:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook`, `voice-call` için herkese açık Webhook erişimi olmadığında veya `publicUrl` local loopback ya da özel ağ alanını gösterdiğinde başarısız olur. `plugins.entries.voice-call.config.publicUrl` ayarını herkese açık sağlayıcı URL'sine ayarlayın veya bir `voice-call` tüneli/Tailscale erişimi yapılandırın.

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

Yerel geliştirme için özel ana makine URL'si yerine bir tünel veya Tailscale
erişimi kullanın:

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

### Twilio araması başlıyor ama toplantıya hiç girmiyor

Meet etkinliğinin telefonla arama bilgilerini sunduğunu doğrulayın. Tam arama
numarasını ve PIN'i ya da özel bir DTMF dizisini geçirin:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Sağlayıcının PIN'i girmeden önce duraklamaya ihtiyacı varsa `--dtmf-sequence`
içinde başta `w` veya virgüller kullanın.

Telefon araması oluşturuluyor ancak Meet katılımcı listesi arayan katılımcıyı hiç
göstermiyorsa:

- Yetki verilen Twilio arama kimliğini, DTMF'nin kuyruğa alınıp alınmadığını ve giriş selamlamasının istenip istenmediğini doğrulamak için `openclaw googlemeet doctor <session-id>` çalıştırın.
- `openclaw voicecall status --call-id <id>` çalıştırın ve aramanın hâlâ etkin olduğunu doğrulayın.
- `openclaw voicecall tail` çalıştırın ve Twilio Webhook'larının Gateway'e ulaştığını kontrol edin.
- `openclaw logs --follow` çalıştırın ve Twilio Meet dizisini arayın: Google Meet katılımı devreder, Voice Call telefon ayağını başlatır, Google Meet `voiceCall.dtmfDelayMs` kadar bekler, `voicecall.dtmf` ile DTMF gönderir, `voiceCall.postDtmfSpeechDelayMs` kadar bekler, ardından `voicecall.speak` ile giriş konuşması ister.
- `openclaw googlemeet setup --transport twilio` komutunu yeniden çalıştırın; yeşil bir kurulum denetimi gereklidir ancak toplantı PIN dizisinin doğru olduğunu kanıtlamaz.
- Arama numarasının PIN ile aynı Meet davetine ve bölgesine ait olduğunu doğrulayın.
- Meet yavaş yanıtlıyorsa veya arama transkripti DTMF gönderildikten sonra hâlâ PIN isteyen istemi gösteriyorsa `voiceCall.dtmfDelayMs` değerini artırın.
- Katılımcı katılıyor ancak selamlamayı duymuyorsanız, DTMF sonrası `voicecall.speak` isteği ve medya akışı TTS oynatımı ya da Twilio `<Say>` geri dönüşü için `openclaw logs --follow` komutunu kontrol edin. Arama transkripti hâlâ "enter the meeting PIN" içeriyorsa telefon ayağı Meet odasına henüz katılmamıştır, bu yüzden toplantı katılımcıları konuşmayı duyamaz.

Webhook'lar ulaşmıyorsa önce Voice Call Plugin'inde hata ayıklayın: sağlayıcı
`plugins.entries.voice-call.config.publicUrl` adresine veya yapılandırılmış
tünele erişebilmelidir. Bkz. [Sesli arama sorunlarını giderme](/tr/plugins/voice-call#troubleshooting).

## Notlar

Google Meet'in resmi medya API'si alma odaklıdır, bu yüzden bir Meet aramasında
konuşmak hâlâ bir katılımcı yolu gerektirir. Bu Plugin bu sınırı görünür tutar:
Chrome tarayıcı katılımını ve yerel ses yönlendirmesini yönetir; Twilio telefonla
arama katılımını yönetir.

Chrome konuşma geri bildirim modları `BlackHole 2ch` ve ek olarak şunlardan birini gerektirir:

- `chrome.audioInputCommand` ve `chrome.audioOutputCommand`: OpenClaw köprüyü sahiplenir ve seçili sağlayıcı ile bu komutlar arasında `chrome.audioFormat` içinde ses aktarır. Agent modu gerçek zamanlı transkripsiyon ve normal TTS kullanır; bidi modu gerçek zamanlı ses sağlayıcısını kullanır. Varsayılan Chrome yolu `chrome.audioBufferBytes: 4096` ile 24 kHz PCM16'dır; 8 kHz G.711 mu-law eski komut çiftleri için kullanılabilir kalır.
- `chrome.audioBridgeCommand`: harici bir köprü komutu tüm yerel ses yolunu sahiplenir ve daemon'unu başlattıktan veya doğruladıktan sonra çıkmalıdır. Bu yalnızca `bidi` için geçerlidir çünkü `agent` modu TTS için doğrudan komut çifti erişimine ihtiyaç duyar.

Bir agent, agent modunda `google_meet` aracını çağırdığında, toplantı danışmanı
oturumu katılımcı konuşmasını yanıtlamadan önce çağıranın mevcut transkriptini
çatallar. Meet oturumu yine de ayrı kalır (`agent:<agentId>:subagent:google-meet:<sessionId>`),
böylece toplantı takipleri çağıran transkriptini doğrudan değiştirmez.

Temiz çift yönlü ses için Meet çıkışını ve Meet mikrofonunu ayrı sanal cihazlar
veya Loopback tarzı bir sanal cihaz grafiği üzerinden yönlendirin. Tek bir
paylaşılan BlackHole cihazı diğer katılımcıların sesini aramaya geri yankılayabilir.

Komut çifti Chrome köprüsüyle `chrome.bargeInInputCommand` ayrı bir yerel
mikrofonu dinleyebilir ve insan konuşmaya başladığında asistan oynatımını
temizleyebilir. Bu, paylaşılan BlackHole loopback girdisi asistan oynatımı
sırasında geçici olarak bastırılsa bile insan konuşmasını asistan çıktısının
önünde tutar. `chrome.audioInputCommand` ve `chrome.audioOutputCommand` gibi, bu
da operatör tarafından yapılandırılan yerel bir komuttur. Açık bir güvenilir
komut yolu veya argüman listesi kullanın ve güvenilmeyen konumlardaki betiklere
yönlendirmeyin.

`googlemeet speak`, bir Chrome oturumu için etkin konuşma geri bildirim ses
köprüsünü tetikler. `googlemeet leave` bu köprüyü durdurur. Voice Call Plugin'i
üzerinden devredilen Twilio oturumlarında `leave`, alttaki sesli aramayı da
kapatır. API tarafından yönetilen bir alan için etkin Google Meet konferansını
da kapatmak istediğinizde `googlemeet end-active-conference` kullanın.

## İlgili

- [Voice call Plugin'i](/tr/plugins/voice-call)
- [Konuşma modu](/tr/nodes/talk)
- [Plugin oluşturma](/tr/plugins/building-plugins)
