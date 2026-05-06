---
read_when:
    - Bir OpenClaw ajanının bir Google Meet görüşmesine katılmasını istiyorsunuz
    - Bir OpenClaw aracısının yeni bir Google Meet toplantısı oluşturmasını istiyorsunuz
    - Google Meet taşıyıcısı olarak Chrome, Chrome Node veya Twilio’yu yapılandırıyorsunuz
summary: 'Google Meet Plugin: ajan geri konuşma varsayılanlarıyla belirtilen Meet URL''lerine Chrome veya Twilio üzerinden katılın'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-06T09:23:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c1de7528ddabe6411598eea362d4a21c6f95f374700046c18294b215a1333d3
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet katılımcı desteği OpenClaw için tasarım gereği açıktır:

- Yalnızca açık bir `https://meet.google.com/...` URL'sine katılır.
- Google Meet API aracılığıyla yeni bir Meet alanı oluşturabilir, ardından döndürülen URL'ye katılabilir.
- `agent` varsayılan geri konuşma modudur: gerçek zamanlı transkripsiyon dinler, yapılandırılmış OpenClaw ajanı yanıtlar ve normal OpenClaw TTS Meet içine konuşur.
- `bidi`, yedek doğrudan gerçek zamanlı ses modeli modu olarak kullanılmaya devam eder.
- Ajanlar katılma davranışını `mode` ile seçer: canlı dinleme/geri konuşma için `agent`, doğrudan gerçek zamanlı ses yedeği için `bidi` veya geri konuşma köprüsü olmadan tarayıcıya katılmak/kontrol etmek için `transcribe` kullanın.
- Kimlik doğrulama kişisel Google OAuth veya zaten oturum açılmış bir Chrome profili olarak başlar.
- Otomatik onay duyurusu yoktur.
- Varsayılan Chrome ses arka ucu `BlackHole 2ch`'dir.
- Chrome yerel olarak veya eşleştirilmiş bir node host üzerinde çalışabilir.
- Twilio, arama numarası ile isteğe bağlı PIN veya DTMF dizisini kabul eder; Meet URL'sini doğrudan arayamaz.
- CLI komutu `googlemeet`'tir; `meet` daha geniş ajan telekonferans iş akışları için ayrılmıştır.

## Hızlı başlangıç

Yerel ses bağımlılıklarını yükleyin ve bir gerçek zamanlı transkripsiyon sağlayıcısı ile normal OpenClaw TTS yapılandırın. OpenAI varsayılan transkripsiyon sağlayıcısıdır; Google Gemini Live ayrıca `realtime.voiceProvider: "google"` ile ayrı bir `bidi` ses yedeği olarak da çalışır:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# yalnızca bidi modu için realtime.voiceProvider "google" olduğunda gerekir
export GEMINI_API_KEY=...
```

`blackhole-2ch`, `BlackHole 2ch` sanal ses aygıtını yükler. Homebrew yükleyicisi, macOS'un aygıtı göstermesinden önce yeniden başlatma gerektirir:

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

Kurulumu denetleyin:

```bash
openclaw googlemeet setup
```

Kurulum çıktısı ajan tarafından okunabilir ve mod farkında olacak şekilde tasarlanmıştır. Chrome profilini, node sabitlemeyi ve gerçek zamanlı Chrome katılımları için BlackHole/SoX ses köprüsünü ve gecikmeli gerçek zamanlı giriş kontrollerini raporlar. Yalnızca gözlem katılımları için aynı aktarımı `--mode transcribe` ile denetleyin; bu mod köprü üzerinden dinlemediği veya konuşmadığı için gerçek zamanlı ses ön koşullarını atlar:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Twilio delegasyonu yapılandırıldığında kurulum ayrıca `voice-call` Plugin'inin, Twilio kimlik bilgilerinin ve genel Webhook erişiminin hazır olup olmadığını raporlar. Bir ajandan katılmasını istemeden önce herhangi bir `ok: false` kontrolünü denetlenen aktarım ve mod için engelleyici olarak değerlendirin. Betikler veya makine tarafından okunabilir çıktı için `openclaw googlemeet setup --json` kullanın. Bir ajan denemeden önce belirli bir aktarımı ön denetlemek için `--transport chrome`, `--transport chrome-node` veya `--transport twilio` kullanın.

Twilio için varsayılan aktarım Chrome olduğunda aktarımı her zaman açıkça ön denetleyin:

```bash
openclaw googlemeet setup --transport twilio
```

Bu, ajan toplantıyı aramaya çalışmadan önce eksik `voice-call` bağlantısını, Twilio kimlik bilgilerini veya erişilemeyen Webhook yayınını yakalar.

Bir toplantıya katılın:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Veya bir ajanın `google_meet` aracı üzerinden katılmasına izin verin:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Ajanlara yönelik `google_meet` aracı, macOS dışı hostlarda artifact, takvim, kurulum, transcribe, Twilio ve `chrome-node` akışları için kullanılmaya devam eder. Yerel Chrome geri konuşma eylemleri orada engellenir çünkü paketlenmiş Chrome ses yolu şu anda macOS `BlackHole 2ch`'ye bağlıdır. Linux'ta Chrome geri konuşmalı katılım için `mode: "transcribe"`, Twilio arama girişi veya bir macOS `chrome-node` host kullanın.

Yeni bir toplantı oluşturup ona katılın:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

API ile oluşturulan odalar için, odanın kapı çalmadan giriş politikasının Google hesabı varsayılanlarından devralınmak yerine açık olmasını istediğinizde Google Meet `SpaceConfig.accessType` kullanın:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN`, Meet URL'sine sahip herkesin kapı çalmadan katılmasına izin verir. `TRUSTED`, host kuruluşun güvenilir kullanıcılarının, davet edilmiş dış kullanıcıların ve arayarak katılan kullanıcıların kapı çalmadan katılmasına izin verir. `RESTRICTED`, kapı çalmadan girişi davetlilerle sınırlar. Bu ayarlar yalnızca resmi Google Meet API oluşturma yolu için geçerlidir, bu nedenle OAuth kimlik bilgileri yapılandırılmış olmalıdır.

Bu seçenek kullanılabilir olmadan önce Google Meet kimliğini doğruladıysanız, Google OAuth onay ekranınıza `meetings.space.settings` kapsamını ekledikten sonra `openclaw googlemeet auth login --json` komutunu yeniden çalıştırın.

Katılmadan yalnızca URL oluşturun:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` iki yola sahiptir:

- API oluşturma: Google Meet OAuth kimlik bilgileri yapılandırıldığında kullanılır. Bu en deterministik yoldur ve tarayıcı UI durumuna bağlı değildir.
- Tarayıcı yedeği: OAuth kimlik bilgileri olmadığında kullanılır. OpenClaw sabitlenmiş Chrome node'u kullanır, `https://meet.google.com/new` adresini açar, Google'ın gerçek bir toplantı kodu URL'sine yönlendirmesini bekler, ardından o URL'yi döndürür. Bu yol, node üzerindeki OpenClaw Chrome profilinin Google'da zaten oturum açmış olmasını gerektirir. Tarayıcı otomasyonu Meet'in kendi ilk çalıştırma mikrofon istemini yönetir; bu istem Google oturum açma hatası olarak değerlendirilmez.
  Katılma ve oluşturma akışları ayrıca yeni bir sekme açmadan önce mevcut bir Meet sekmesini yeniden kullanmayı dener. Eşleştirme `authuser` gibi zararsız URL sorgu dizelerini yok sayar; bu nedenle bir ajan yeniden denemesi ikinci bir Chrome sekmesi oluşturmak yerine zaten açık olan toplantıya odaklanmalıdır.

Komut/araç çıktısı bir `source` alanı (`api` veya `browser`) içerir, böylece ajanlar hangi yolun kullanıldığını açıklayabilir. `create` varsayılan olarak yeni toplantıya katılır ve `joined: true` ile katılma oturumunu döndürür. Yalnızca URL üretmek için CLI'da `create --no-join` kullanın veya araca `"join": false` geçirin.

Veya bir ajana şunu söyleyin: "Bir Google Meet oluştur, ajan geri konuşma moduyla ona katıl ve bağlantıyı bana gönder." Ajan `action: "create"` ile `google_meet` çağırmalı ve ardından döndürülen `meetingUri` değerini paylaşmalıdır.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Yalnızca gözlem/tarayıcı kontrolü katılımı için `"mode": "transcribe"` ayarlayın. Bu, çift yönlü gerçek zamanlı ses köprüsünü başlatmaz, BlackHole veya SoX gerektirmez ve toplantıya geri konuşmaz. Bu moddaki Chrome katılımları ayrıca OpenClaw'ın mikrofon/kamera izin vermesinden ve Meet **Mikrofon kullan** yolundan kaçınır. Meet bir ses seçimi ara ekranı gösterirse, otomasyon mikrofon yok yolunu dener ve aksi halde yerel mikrofonu açmak yerine manuel eylem raporlar. Transcribe modunda yönetilen Chrome aktarımları ayrıca en iyi çaba Meet altyazı gözlemcisini kurar. `googlemeet status --json` ve `googlemeet doctor`, operatörlerin tarayıcının aramaya katılıp katılmadığını ve Meet altyazılarının metin üretip üretmediğini anlayabilmesi için `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` ve kısa bir `recentTranscript` kuyruğu gösterir.
Evet/hayır probuna ihtiyacınız olduğunda `openclaw googlemeet test-listen <meet-url> --transport chrome-node` kullanın: transcribe modunda katılır, yeni altyazı veya transkript hareketi bekler ve `listenVerified`, `listenTimedOut`, manuel eylem alanları ile en son altyazı durumunu döndürür.

Gerçek zamanlı oturumlar sırasında `google_meet` durumu `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, son giriş/çıkış zaman damgaları, byte sayaçları ve köprü kapanma durumu gibi tarayıcı ve ses köprüsü sağlığını içerir. Güvenli bir Meet sayfa istemi görünürse, tarayıcı otomasyonu mümkün olduğunda bunu yönetir. Oturum açma, host kabulü ve tarayıcı/OS izin istemleri, ajanın aktarması için bir neden ve mesajla birlikte manuel eylem olarak raporlanır. Yönetilen Chrome oturumları giriş veya test ifadesini yalnızca tarayıcı sağlığı `inCall: true` raporladıktan sonra yayar; aksi halde durum `speechReady: false` raporlar ve konuşma denemesi ajanın toplantıya konuşmuş gibi gösterilmesi yerine engellenir.

Yerel Chrome katılımları, oturum açılmış OpenClaw tarayıcı profili üzerinden yapılır. Gerçek zamanlı mod, OpenClaw tarafından kullanılan mikrofon/hoparlör yolu için `BlackHole 2ch` gerektirir. Temiz çift yönlü ses için ayrı sanal aygıtlar veya Loopback tarzı bir grafik kullanın; tek bir BlackHole aygıtı ilk smoke test için yeterlidir ancak yankı yapabilir.

### Yerel Gateway + Parallels Chrome

Sadece VM'nin Chrome'u sahiplenmesi için macOS VM içinde tam bir OpenClaw Gateway veya model API anahtarına ihtiyacınız **yoktur**. Gateway'i ve ajanı yerel olarak çalıştırın, ardından VM içinde bir node host çalıştırın. Node'un Chrome komutunu duyurması için paketlenmiş Plugin'i VM'de bir kez etkinleştirin:

Nerede ne çalışır:

- Gateway host: OpenClaw Gateway, ajan çalışma alanı, model/API anahtarları, gerçek zamanlı sağlayıcı ve Google Meet Plugin yapılandırması.
- Parallels macOS VM: OpenClaw CLI/node host, Google Chrome, SoX, BlackHole 2ch ve Google'da oturum açmış bir Chrome profili.
- VM'de gerekli olmayanlar: Gateway hizmeti, ajan yapılandırması, OpenAI/GPT anahtarı veya model sağlayıcı kurulumu.

VM bağımlılıklarını yükleyin:

```bash
brew install blackhole-2ch sox
```

BlackHole'u yükledikten sonra macOS'un `BlackHole 2ch`'yi göstermesi için VM'yi yeniden başlatın:

```bash
sudo reboot
```

Yeniden başlattıktan sonra VM'nin ses aygıtını ve SoX komutlarını görebildiğini doğrulayın:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

VM'de OpenClaw'ı yükleyin veya güncelleyin, ardından orada paketlenmiş Plugin'i etkinleştirin:

```bash
openclaw plugins enable google-meet
```

VM içinde node host'u başlatın:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` bir LAN IP'siyse ve TLS kullanmıyorsanız, bu güvenilir özel ağ için kabul etmedikçe node düz metin WebSocket'i reddeder:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` süreç ortamıdır, bir `openclaw.json` ayarı değildir. `openclaw node install`, yükleme komutunda mevcut olduğunda bunu LaunchAgent ortamında saklar.

Node'u Gateway host'tan onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway'in node'u gördüğünü ve hem `googlemeet.chrome` hem de tarayıcı yeteneği/`browser.proxy` duyurduğunu doğrulayın:

```bash
openclaw nodes status
```

Gateway host üzerinde Meet'i bu node üzerinden yönlendirin:

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

veya ajandan `transport: "chrome-node"` ile `google_meet` aracını kullanmasını isteyin.

Bir oturum oluşturan veya mevcut oturumu yeniden kullanan, bilinen bir ifadeyi söyleyen ve oturum sağlığını yazdıran tek komutluk smoke test için:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Gerçek zamanlı katılım sırasında OpenClaw tarayıcı otomasyonu konuk adını doldurur,
Join/Ask to join düğmesine tıklar ve bu istem göründüğünde Meet'in ilk çalıştırma
"Use microphone" seçimini kabul eder. Yalnızca gözlem amaçlı katılım veya yalnızca
tarayıcıyla toplantı oluşturma sırasında, aynı istemde mikrofon olmadan devam
eder; tabii bu seçenek kullanılabiliyorsa. Tarayıcı profili oturum açmamışsa,
Meet ana makine kabulünü bekliyorsa, Chrome gerçek zamanlı katılım için mikrofon/
kamera iznine ihtiyaç duyuyorsa veya Meet otomasyonun çözemediği bir istemde
takılı kaldıysa, katılım/test konuşması sonucu `manualActionRequired: true`
değerini `manualActionReason` ve `manualActionMessage` ile birlikte bildirir.
Agent'lar katılımı yeniden denemeyi durdurmalı, bu tam mesajı mevcut
`browserUrl`/`browserTitle` ile birlikte bildirmeli ve yalnızca manuel tarayıcı
eylemi tamamlandıktan sonra yeniden denemelidir.

`chromeNode.node` atlanırsa OpenClaw, yalnızca tam olarak bir bağlı Node hem
`googlemeet.chrome` hem de tarayıcı denetimi duyurduğunda otomatik seçim yapar.
Birden fazla yetenekli Node bağlıysa, `chromeNode.node` değerini Node kimliği,
görünen ad veya uzak IP olarak ayarlayın.

Yaygın hata denetimleri:

- `Configured Google Meet node ... is not usable: offline`: sabitlenen Node
  Gateway tarafından biliniyor ancak kullanılabilir değil. Agent'lar bu Node'u
  kullanılabilir bir Chrome ana makinesi olarak değil, tanılama durumu olarak
  ele almalı ve kullanıcı bunu istemedikçe başka bir aktarıma dönmek yerine
  kurulum engelini bildirmelidir.
- `No connected Google Meet-capable node`: VM içinde `openclaw node run`
  başlatın, eşleştirmeyi onaylayın ve VM içinde
  `openclaw plugins enable google-meet` ile `openclaw plugins enable browser`
  komutlarının çalıştırıldığından emin olun. Ayrıca Gateway ana makinesinin her
  iki Node komutuna da `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`
  ile izin verdiğini doğrulayın.
- `BlackHole 2ch audio device not found`: denetlenen ana makineye
  `blackhole-2ch` yükleyin ve yerel Chrome sesini kullanmadan önce yeniden
  başlatın.
- `BlackHole 2ch audio device not found on the node`: VM içine
  `blackhole-2ch` yükleyin ve VM'i yeniden başlatın.
- Chrome açılıyor ancak katılamıyorsa: VM içindeki tarayıcı profilinde oturum
  açın veya konuk katılımı için `chrome.guestName` değerini ayarlı tutun. Konuk
  otomatik katılımı, Node tarayıcı proxy'si üzerinden OpenClaw tarayıcı
  otomasyonunu kullanır; Node tarayıcı yapılandırmasının istediğiniz profili
  gösterdiğinden emin olun, örneğin `browser.defaultProfile: "user"` veya adlı
  bir mevcut oturum profili.
- Yinelenen Meet sekmeleri: `chrome.reuseExistingTab: true` ayarını etkin
  bırakın. OpenClaw yeni bir sekme açmadan önce aynı Meet URL'si için mevcut bir
  sekmeyi etkinleştirir ve tarayıcıyla toplantı oluşturma, başka bir sekme
  açmadan önce devam eden bir `https://meet.google.com/new` veya Google hesabı
  istemi sekmesini yeniden kullanır.
- Ses yoksa: Meet içinde mikrofon/hoparlör sesini OpenClaw tarafından kullanılan
  sanal ses aygıtı yolu üzerinden yönlendirin; temiz çift yönlü ses için ayrı
  sanal aygıtlar veya Loopback tarzı yönlendirme kullanın.

## Yükleme notları

Chrome geri konuşma varsayılanı iki harici araç kullanır:

- `sox`: komut satırı ses yardımcı programı. Plugin, varsayılan 24 kHz PCM16 ses
  köprüsü için açık CoreAudio aygıt komutları kullanır.
- `blackhole-2ch`: macOS sanal ses sürücüsü. Chrome/Meet'in üzerinden
  yönlendirebileceği `BlackHole 2ch` ses aygıtını oluşturur.

OpenClaw iki paketi de paketlemez veya yeniden dağıtmaz. Belgeler, kullanıcılara
bunları Homebrew üzerinden ana makine bağımlılıkları olarak yüklemelerini söyler.
SoX `LGPL-2.0-only AND GPL-2.0-only` lisanslıdır; BlackHole GPL-3.0 lisanslıdır.
BlackHole'u OpenClaw ile birlikte paketleyen bir yükleyici veya cihaz
oluşturuyorsanız, BlackHole'un upstream lisans koşullarını inceleyin veya
Existential Audio'dan ayrı bir lisans alın.

## Aktarımlar

### Chrome

Chrome aktarımı, Meet URL'sini OpenClaw tarayıcı denetimi üzerinden açar ve
oturum açmış OpenClaw tarayıcı profili olarak katılır. macOS'ta Plugin,
başlatmadan önce `BlackHole 2ch` denetimi yapar. Yapılandırılmışsa, Chrome'u
açmadan önce bir ses köprüsü sağlık komutu ve başlangıç komutu da çalıştırır.
Chrome/ses Gateway ana makinesinde çalışıyorsa `chrome` kullanın; Chrome/ses
Parallels macOS VM gibi eşleştirilmiş bir Node üzerinde çalışıyorsa
`chrome-node` kullanın. Yerel Chrome için profili `browser.defaultProfile` ile
seçin; `chrome.browserProfile`, `chrome-node` ana makinelerine geçirilir.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome mikrofon ve hoparlör sesini yerel OpenClaw ses köprüsü üzerinden
yönlendirin. `BlackHole 2ch` yüklü değilse katılım, ses yolu olmadan sessizce
katılmak yerine bir kurulum hatasıyla başarısız olur.

### Twilio

Twilio aktarımı, Voice Call Plugin'e devredilen katı bir arama planıdır. Telefon
numaraları için Meet sayfalarını ayrıştırmaz.

Bunu Chrome katılımı kullanılabilir olmadığında veya telefonla arama yedeği
istediğinizde kullanın. Google Meet, toplantı için telefonla arama numarası ve
PIN göstermelidir; OpenClaw bunları Meet sayfasından keşfetmez.

Voice Call Plugin'i Chrome Node üzerinde değil, Gateway ana makinesinde
etkinleştirin:

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

Gerçek zamanlı ses sağlayıcınız buysa bunun yerine OpenAI sağlayıcı Plugin'i ve
`OPENAI_API_KEY` ile `realtime.provider: "openai"` kullanın.

`voice-call` etkinleştirildikten sonra Gateway'i yeniden başlatın veya yeniden
yükleyin; Plugin yapılandırma değişiklikleri, yeniden yüklenene kadar zaten
çalışan bir Gateway işleminde görünmez.

Ardından doğrulayın:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio devri bağlandığında, `googlemeet setup` başarılı
`twilio-voice-call-plugin`, `twilio-voice-call-credentials` ve
`twilio-voice-call-webhook` denetimlerini içerir.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Toplantı özel bir dizi gerektirdiğinde `--dtmf-sequence` kullanın:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth ve ön uçuş

OAuth, Meet bağlantısı oluşturmak için isteğe bağlıdır çünkü `googlemeet create`
tarayıcı otomasyonuna geri dönebilir. Resmi API ile oluşturma, alan çözümleme
veya Meet Media API ön uçuş denetimleri istediğinizde OAuth yapılandırın.

Google Meet API erişimi kullanıcı OAuth'u kullanır: bir Google Cloud OAuth
istemcisi oluşturun, gerekli kapsamları isteyin, bir Google hesabını
yetkilendirin ve ardından oluşan yenileme belirtecini Google Meet Plugin
yapılandırmasında saklayın veya `OPENCLAW_GOOGLE_MEET_*` ortam değişkenlerini
sağlayın.

OAuth, Chrome katılım yolunun yerine geçmez. Chrome ve Chrome-node aktarımları,
tarayıcı katılımını kullandığınızda hâlâ oturum açmış bir Chrome profili,
BlackHole/SoX ve bağlı bir Node üzerinden katılır. OAuth yalnızca resmi Google
Meet API yolu içindir: toplantı alanları oluşturma, alanları çözümleme ve Meet
Media API ön uçuş denetimleri çalıştırma.

### Google kimlik bilgileri oluşturma

Google Cloud Console'da:

1. Bir Google Cloud projesi oluşturun veya seçin.
2. Bu proje için **Google Meet REST API** etkinleştirin.
3. OAuth onay ekranını yapılandırın.
   - **Internal**, bir Google Workspace kuruluşu için en basit seçenektir.
   - **External**, kişisel/test kurulumları için çalışır; uygulama Testing
     durumundayken uygulamayı yetkilendirecek her Google hesabını test
     kullanıcısı olarak ekleyin.
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

`meetings.space.created`, Google Meet `spaces.create` için gereklidir.
`meetings.space.readonly`, OpenClaw'ın Meet URL'lerini/kodlarını alanlara
çözümlemesini sağlar. `meetings.space.settings`, OpenClaw'ın API oda oluşturma
sırasında `accessType` gibi `SpaceConfig` ayarlarını geçirmesini sağlar.
`meetings.conference.media.readonly`, Meet Media API ön uçuşu ve medya işi
içindir; Google gerçek Media API kullanımı için Developer Preview kaydı
gerektirebilir. Yalnızca tarayıcı tabanlı Chrome katılımlarına ihtiyacınız
varsa OAuth'u tamamen atlayın.

### Yenileme belirtecini oluşturma

`oauth.clientId` ve isteğe bağlı olarak `oauth.clientSecret` yapılandırın veya
bunları ortam değişkenleri olarak geçirin, ardından şunu çalıştırın:

```bash
openclaw googlemeet auth login --json
```

Komut, yenileme belirteci içeren bir `oauth` yapılandırma bloğu yazdırır. PKCE,
`http://localhost:8085/oauth2callback` üzerinde localhost geri çağrısı ve
`--manual` ile manuel kopyala/yapıştır akışı kullanır.

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

`oauth` nesnesini Google Meet Plugin yapılandırmasının altında saklayın:

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

Yenileme belirtecini yapılandırmada istemediğinizde ortam değişkenlerini tercih
edin. Hem yapılandırma hem de ortam değerleri varsa Plugin önce yapılandırmayı,
ardından ortam geri dönüşünü çözer.

OAuth onayı Meet alanı oluşturma, Meet alanı okuma erişimi ve Meet konferans
medyası okuma erişimi içerir. Toplantı oluşturma desteği var olmadan önce kimlik
doğruladıysanız, yenileme belirtecinin `meetings.space.created` kapsamına sahip
olması için `openclaw googlemeet auth login --json` komutunu yeniden çalıştırın.

### OAuth'u doctor ile doğrulama

Hızlı, gizli bilgi içermeyen bir sağlık denetimi istediğinizde OAuth doctor'ı
çalıştırın:

```bash
openclaw googlemeet doctor --oauth --json
```

Bu, Chrome çalışma zamanını yüklemez veya bağlı bir Chrome Node gerektirmez.
OAuth yapılandırmasının var olduğunu ve yenileme belirtecinin erişim belirteci
oluşturabildiğini denetler. JSON raporu yalnızca `ok`, `configured`,
`tokenSource`, `expiresAt` ve denetim mesajları gibi durum alanlarını içerir;
erişim belirtecini, yenileme belirtecini veya istemci gizli anahtarını yazdırmaz.

Yaygın sonuçlar:

| Kontrol              | Anlam                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` ile `oauth.refreshToken` veya önbelleğe alınmış bir erişim belirteci mevcut. |
| `oauth-token`        | Önbelleğe alınmış erişim belirteci hâlâ geçerli veya yenileme belirteci yeni bir erişim belirteci oluşturdu. |
| `meet-spaces-get`    | İsteğe bağlı `--meeting` kontrolü mevcut bir Meet alanını çözdü.                        |
| `meet-spaces-create` | İsteğe bağlı `--create-space` kontrolü yeni bir Meet alanı oluşturdu.                   |

Google Meet API etkinleştirmesini ve `spaces.create` kapsamını da kanıtlamak
için yan etkili oluşturma kontrolünü çalıştırın:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` tek kullanımlık bir Meet URL'si oluşturur. Google Cloud
projesinde Meet API'nin etkin olduğunu ve yetkilendirilmiş hesabın
`meetings.space.created` kapsamına sahip olduğunu doğrulamanız gerektiğinde bunu
kullanın.

Mevcut bir toplantı alanı için okuma erişimini kanıtlamak için:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` ve `resolve-space`, yetkilendirilmiş Google hesabının
erişebildiği mevcut bir alana okuma erişimini kanıtlar. Bu kontrollerden gelen
bir `403` genellikle Google Meet REST API'nin devre dışı olduğu, onaylanmış
yenileme belirtecinde gerekli kapsamın eksik olduğu veya Google hesabının o Meet
alanına erişemediği anlamına gelir. Yenileme belirteci hatası, `openclaw
googlemeet auth login --json` komutunu yeniden çalıştırmanız ve yeni `oauth`
bloğunu saklamanız gerektiği anlamına gelir.

Tarayıcı yedek yolu için OAuth kimlik bilgileri gerekmez. Bu modda Google
kimlik doğrulaması, OpenClaw yapılandırmasından değil seçilen Node üzerindeki
oturum açılmış Chrome profilinden gelir.

Bu ortam değişkenleri yedek olarak kabul edilir:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` veya `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` veya `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` veya `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` veya `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` veya
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` veya `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` veya `GOOGLE_MEET_PREVIEW_ACK`

Bir Meet URL'sini, kodunu veya `spaces/{id}` değerini `spaces.get` üzerinden çözün:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Medya işinden önce ön kontrolü çalıştırın:

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
`--all-conference-records` iletin.

Calendar araması, Meet yapıtlarını okumadan önce toplantı URL'sini Google Calendar'dan çözebilir:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today`, Google Meet bağlantısı olan bir Calendar etkinliği için bugünün
`primary` takviminde arama yapar. Eşleşen etkinlik metnini aramak için
`--event <query>`, birincil olmayan bir takvim için `--calendar <id>` kullanın.
Calendar araması, Calendar events readonly kapsamını içeren yeni bir OAuth
oturum açması gerektirir. `calendar-events`, eşleşen Meet etkinliklerini önizler
ve `latest`, `artifacts`, `attendance` veya `export` tarafından seçilecek
etkinliği işaretler.

Konferans kaydı kimliğini zaten biliyorsanız doğrudan adresleyin:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

API ile oluşturulmuş bir alan için etkin konferansı, aramadan sonra odayı
kapatmak istediğinizde sonlandırın:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Bu, Google Meet `spaces.endActiveConference` çağrısını yapar ve
yetkilendirilmiş hesabın yönetebildiği bir alan için `meetings.space.created`
kapsamına sahip OAuth gerektirir. OpenClaw, Meet URL'si, toplantı kodu veya
`spaces/{id}` girdisini kabul eder ve etkin konferansı sonlandırmadan önce bunu
API alan kaynağına çözer. Bu, `googlemeet leave` komutundan ayrıdır: `leave`
OpenClaw'ın yerel/oturum katılımını durdururken, `end-active-conference` Google
Meet'ten alan için etkin konferansı sonlandırmasını ister.

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

`artifacts`, Google toplantı için sunduğunda konferans kaydı meta verilerini ve
katılımcı, kayıt, döküm, yapılandırılmış döküm girdisi ve akıllı not kaynak meta
verilerini döndürür. Büyük toplantılarda girdi aramasını atlamak için
`--no-transcript-entries` kullanın. `attendance`, katılımcıları ilk/son görülme
zamanları, toplam oturum süresi, geç/erken ayrılma bayrakları ve oturum açmış
kullanıcıya veya görünen ada göre birleştirilmiş yinelenen katılımcı
kaynaklarıyla birlikte katılımcı oturumu satırlarına genişletir. Ham katılımcı
kaynaklarını ayrı tutmak için `--no-merge-duplicates`, geç kalma algılamasını
ayarlamak için `--late-after-minutes` ve erken ayrılma algılamasını ayarlamak
için `--early-before-minutes` iletin.

`export`, `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`,
`attendance.json` ve `manifest.json` içeren bir klasör yazar. `manifest.json`;
seçilen girdiyi, dışa aktarma seçeneklerini, konferans kayıtlarını, çıktı
dosyalarını, sayımları, belirteç kaynağını, kullanıldıysa Calendar etkinliğini
ve kısmi alma uyarılarını kaydeder. Klasörün yanına taşınabilir bir arşiv de
yazmak için `--zip` iletin. Bağlantılı döküm ve akıllı not Google Docs metnini
Google Drive `files.export` üzerinden dışa aktarmak için `--include-doc-bodies`
iletin; bu, Drive Meet readonly kapsamını içeren yeni bir OAuth oturum açması
gerektirir. `--include-doc-bodies` olmadan dışa aktarımlar yalnızca Meet meta
verilerini ve yapılandırılmış döküm girdilerini içerir. Google, akıllı not
listeleme, döküm girdisi veya Drive belge gövdesi hatası gibi kısmi bir yapıt
hatası döndürürse özet ve bildirim, tüm dışa aktarımı başarısız kılmak yerine
uyarıyı korur. Klasör veya ZIP oluşturmadan aynı yapıt/katılım verilerini almak
ve bildirim JSON'unu yazdırmak için `--dry-run` kullanın. Bu, büyük bir dışa
aktarma yazmadan önce veya bir ajanın yalnızca sayımlara, seçilen kayıtlara ve
uyarılara ihtiyaç duyduğu durumlarda yararlıdır.

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

Yalnızca dışa aktarma bildirimini döndürmek ve dosya yazımlarını atlamak için `"dryRun": true` ayarlayın.

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

Önce dinleme doğrulaması için ajanlar, toplantının yararlı olduğunu iddia etmeden önce `test_listen` kullanmalıdır:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Korunan canlı duman testini gerçek bir saklanan toplantıya karşı çalıştırın:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Meet altyazılarının kullanılabildiği ve birinin konuşacağı bir toplantıya karşı canlı önce dinle tarayıcı yoklamasını çalıştırın:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Canlı duman testi ortamı:

- `OPENCLAW_LIVE_TEST=1`, korunan canlı testleri etkinleştirir.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`, saklanan bir Meet URL'sine, koduna veya
  `spaces/{id}` değerine işaret eder.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` veya `GOOGLE_MEET_CLIENT_ID`, OAuth istemci
  kimliğini sağlar.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` veya `GOOGLE_MEET_REFRESH_TOKEN`,
  yenileme belirtecini sağlar.
- İsteğe bağlı: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ve
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`, `OPENCLAW_` öneki olmadan
  aynı yedek adları kullanır.

Temel yapıt/katılım canlı duman testi
`https://www.googleapis.com/auth/meetings.space.readonly` ve
`https://www.googleapis.com/auth/meetings.conference.media.readonly` gerektirir.
Calendar araması `https://www.googleapis.com/auth/calendar.events.readonly`
gerektirir. Drive belge gövdesi dışa aktarımı
`https://www.googleapis.com/auth/drive.meet.readonly` gerektirir.

Yeni bir Meet alanı oluşturun:

```bash
openclaw googlemeet create
```

Komut yeni `meeting uri`, kaynağı ve katılma oturumunu yazdırır. OAuth kimlik
bilgileriyle resmi Google Meet API'yi kullanır. OAuth kimlik bilgileri olmadan
sabitlenmiş Chrome Node'un oturum açmış tarayıcı profilini yedek olarak
kullanır. Ajanlar tek adımda oluşturup katılmak için `google_meet` aracını
`action: "create"` ile kullanabilir. Yalnızca URL oluşturma için `"join": false`
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

Tarayıcı yedek yolu, URL'yi oluşturamadan Google oturum açma veya Meet izin
engeline takılırsa Gateway yöntemi başarısız bir yanıt döndürür ve
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

Bir ajan `manualActionRequired: true` gördüğünde `manualActionMessage` ile
tarayıcı Node/sekme bağlamını bildirmeli ve operatör tarayıcı adımını
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

Meet oluşturmak varsayılan olarak katılım sağlar. Chrome veya Chrome-node taşıması, tarayıcı üzerinden katılmak için yine de oturum açılmış bir Google Chrome profiline ihtiyaç duyar. Profilde oturum kapalıysa OpenClaw `manualActionRequired: true` veya bir tarayıcı yedekleme hatası bildirir ve operatörden yeniden denemeden önce Google oturum açma işlemini tamamlamasını ister.

`preview.enrollmentAcknowledged: true` değerini yalnızca Cloud projenizin, OAuth kimliğinizin ve toplantı katılımcılarının Meet medya API'leri için Google Workspace Developer Preview Program'a kayıtlı olduğunu doğruladıktan sonra ayarlayın.

## Yapılandırma

Ortak Chrome ajan yolu yalnızca Plugin'in etkinleştirilmesine, BlackHole'a, SoX'a, gerçek zamanlı transkripsiyon sağlayıcı anahtarına ve yapılandırılmış bir OpenClaw TTS sağlayıcısına ihtiyaç duyar. OpenAI varsayılan transkripsiyon sağlayıcısıdır; varsayılan ajan modu transkripsiyon sağlayıcısını değiştirmeden `bidi` modu için Google Gemini Live kullanmak üzere `realtime.voiceProvider` değerini `"google"` ve `realtime.model` değerini ayarlayın:

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
- `chromeNode.node`: `chrome-node` için isteğe bağlı node kimliği/adı/IP'si
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: oturum açılmamış Meet misafir ekranında kullanılan ad
- `chrome.autoJoin: true`: `chrome-node` üzerinde OpenClaw tarayıcı otomasyonu aracılığıyla en iyi çabayla misafir adı doldurma ve Join Now tıklaması
- `chrome.reuseExistingTab: true`: yinelenen sekmeler açmak yerine mevcut bir Meet sekmesini etkinleştir
- `chrome.waitForInCallMs: 20000`: konuşmalı giriş tetiklenmeden önce Meet sekmesinin çağrı içinde olduğunu bildirmesini bekle
- `chrome.audioFormat: "pcm16-24khz"`: komut çifti ses biçimi. `"g711-ulaw-8khz"` değerini yalnızca hâlâ telefon sesi yayan eski/özel komut çiftleri için kullanın.
- `chrome.audioBufferBytes: 4096`: Üretilen Chrome komut çifti ses komutları için SoX işleme arabelleği. Bu, SoX'un varsayılan 8192 baytlık arabelleğinin yarısıdır; yoğun host'larda yükseltmeye alan bırakırken varsayılan pipe gecikmesini azaltır. SoX'un minimumunun altındaki değerler 17 bayta sabitlenir.
- `chrome.audioInputCommand`: CoreAudio `BlackHole 2ch` kaynağından okuyan ve `chrome.audioFormat` biçiminde ses yazan SoX komutu
- `chrome.audioOutputCommand`: `chrome.audioFormat` biçiminde ses okuyan ve CoreAudio `BlackHole 2ch` hedefine yazan SoX komutu
- `chrome.bargeInInputCommand`: asistan oynatımı etkinken insan araya girme algılaması için işaretli 16 bit little-endian mono PCM yazan isteğe bağlı yerel mikrofon komutu. Bu şu anda Gateway tarafından barındırılan `chrome` komut çifti köprüsü için geçerlidir.
- `chrome.bargeInRmsThreshold: 650`: `chrome.bargeInInputCommand` üzerinde insan kesintisi sayılan RMS seviyesi
- `chrome.bargeInPeakThreshold: 2500`: `chrome.bargeInInputCommand` üzerinde insan kesintisi sayılan tepe seviyesi
- `chrome.bargeInCooldownMs: 900`: yinelenen insan kesintisi temizlemeleri arasındaki minimum gecikme
- `mode: "agent"`: varsayılan konuşmalı yanıt modu. Katılımcı konuşması yapılandırılmış gerçek zamanlı transkripsiyon sağlayıcısı tarafından yazıya dökülür, toplantı başına bir alt ajan oturumunda yapılandırılmış OpenClaw ajanına gönderilir ve normal OpenClaw TTS çalışma zamanı üzerinden seslendirilir.
- `mode: "bidi"`: yedek doğrudan çift yönlü gerçek zamanlı model modu. Gerçek zamanlı ses sağlayıcısı katılımcı konuşmasını doğrudan yanıtlar ve daha derin/araç destekli yanıtlar için `openclaw_agent_consult` çağırabilir.
- `mode: "transcribe"`: konuşmalı yanıt köprüsü olmayan yalnızca gözlem modu.
- `realtime.provider: "openai"`: aşağıdaki kapsamlı sağlayıcı alanları ayarlanmamışsa kullanılan uyumluluk yedeği.
- `realtime.transcriptionProvider: "openai"`: `agent` modu tarafından gerçek zamanlı transkripsiyon için kullanılan sağlayıcı kimliği.
- `realtime.voiceProvider`: `bidi` modu tarafından doğrudan gerçek zamanlı ses için kullanılan sağlayıcı kimliği. Ajan modu transkripsiyonunu OpenAI'da tutarken Gemini Live kullanmak için bunu `"google"` olarak ayarlayın.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: daha derin yanıtlar için `openclaw_agent_consult` ile kısa sözlü yanıtlar
- `realtime.introMessage`: gerçek zamanlı köprü bağlandığında kısa sözlü hazır olma kontrolü; sessiz katılmak için bunu `""` olarak ayarlayın
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

Ajan modu dinleme ve konuşma için ElevenLabs:

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

Kalıcı Meet sesi `messages.tts.providers.elevenlabs.voiceId` değerinden gelir. TTS modeli geçersiz kılmaları etkinleştirildiğinde ajan yanıtları yanıt başına `[[tts:voiceId=... model=eleven_v3]]` yönergelerini de kullanabilir, ancak yapılandırma toplantılar için deterministik varsayılandır. Katılım sırasında günlükler `transcriptionProvider=elevenlabs` göstermeli ve her sözlü yanıt `provider=elevenlabs model=eleven_v3 voice=<voiceId>` kaydı oluşturmalıdır.

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

`voiceCall.enabled` varsayılan olarak `true` değerindedir; Twilio taşımasıyla gerçek PSTN çağrısını, DTMF'yi ve giriş selamlamasını Voice Call Plugin'e devreder. Voice Call, gerçek zamanlı medya akışını açmadan önce DTMF dizisini çalar, ardından kaydedilmiş giriş metnini ilk gerçek zamanlı selamlama olarak kullanır. `voice-call` etkin değilse Google Meet arama planını yine de doğrulayabilir ve kaydedebilir, ancak Twilio çağrısını başlatamaz.

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

Chrome Gateway host'unda çalışırken `transport: "chrome"` kullanın. Chrome, Parallels VM gibi eşleştirilmiş bir node üzerinde çalışırken `transport: "chrome-node"` kullanın. Her iki durumda da model sağlayıcıları ve `openclaw_agent_consult` Gateway host'unda çalışır, bu nedenle model kimlik bilgileri orada kalır. Varsayılan `mode: "agent"` ile gerçek zamanlı transkripsiyon sağlayıcısı dinlemeyi işler, yapılandırılmış OpenClaw ajanı yanıtı üretir ve normal OpenClaw TTS bunu Meet'e seslendirir. Gerçek zamanlı ses modelinin doğrudan yanıtlamasını istediğinizde `mode: "bidi"` kullanın. Ham `mode: "realtime"` değeri, `mode: "agent"` için eski uyumluluk takma adı olarak kabul edilmeye devam eder, ancak artık ajan araç şemasında tanıtılmaz. Ajan modu günlükleri, köprü başlangıcında çözümlenen transkripsiyon sağlayıcısını/modelini ve her sentezlenmiş yanıttan sonra TTS sağlayıcısını, modelini, sesini, çıktı biçimini ve örnekleme hızını içerir.

Etkin oturumları listelemek veya bir oturum kimliğini incelemek için `action: "status"` kullanın. Gerçek zamanlı ajanın hemen konuşmasını sağlamak için `sessionId` ve `message` ile `action: "speak"` kullanın. Oturumu oluşturmak veya yeniden kullanmak, bilinen bir ifadeyi tetiklemek ve Chrome host'u bildirebiliyorsa `inCall` sağlığını döndürmek için `action: "test_speech"` kullanın. `test_speech` her zaman `mode: "agent"` zorlar ve `mode: "transcribe"` içinde çalıştırılması istenirse başarısız olur, çünkü yalnızca gözlem oturumları bilinçli olarak konuşma yayamaz. `speechOutputVerified` sonucu, bu test çağrısı sırasında gerçek zamanlı ses çıktı baytlarının artmasına dayanır; bu nedenle daha eski sese sahip yeniden kullanılan bir oturum yeni başarılı konuşma kontrolü sayılmaz. Bir oturumu sona ermiş olarak işaretlemek için `action: "leave"` kullanın.

`status`, mevcut olduğunda Chrome sağlığını içerir:

- `inCall`: Chrome Meet çağrısının içinde görünüyor
- `micMuted`: en iyi çabayla Meet mikrofon durumu
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: konuşmanın çalışabilmesi için tarayıcı profilinin manuel oturum açmaya, Meet host kabulüne, izinlere veya tarayıcı kontrol onarımına ihtiyacı var
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: yönetilen Chrome konuşmasına şu anda izin verilip verilmediği. `speechReady: false`, OpenClaw'ın giriş/test ifadesini ses köprüsüne göndermediği anlamına gelir.
- `providerConnected` / `realtimeReady`: gerçek zamanlı ses köprüsü durumu
- `lastInputAt` / `lastOutputAt`: köprüden görülen veya köprüye gönderilen son ses
- `audioOutputRouted` / `audioOutputDeviceLabel`: Meet sekmesinin medya çıkışının köprü tarafından kullanılan BlackHole cihazına etkin biçimde yönlendirilip yönlendirilmediği
- `lastSuppressedInputAt` / `suppressedInputBytes`: asistan oynatımı etkinken yok sayılan loopback girdisi

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Ajan ve Bidi Modları

Chrome `agent` modu, "ajanım toplantıda" davranışı için optimize edilmiştir. Gerçek zamanlı transkripsiyon sağlayıcısı toplantı sesini duyar, son katılımcı transkriptleri yapılandırılmış OpenClaw ajanı üzerinden yönlendirilir ve yanıt normal OpenClaw TTS çalışma zamanı üzerinden seslendirilir. Gerçek zamanlı ses modelinin doğrudan yanıtlamasını istediğinizde `mode: "bidi"` ayarlayın.
Yakındaki son transkript parçaları danışma işleminden önce birleştirilir; böylece tek bir sözlü tur birkaç eski kısmi yanıt üretmez. Kuyruğa alınmış asistan sesi hâlâ çalarken gerçek zamanlı giriş de bastırılır ve yakın tarihli asistan benzeri transkript yankıları ajan danışmasından önce yok sayılır; böylece BlackHole loopback'i ajanın kendi konuşmasına yanıt vermesine neden olmaz.

| Mod     | Yanıta kim karar verir        | Konuşma çıkış yolu                     | Ne zaman kullanılır                                  |
| ------- | ----------------------------- | -------------------------------------- | ---------------------------------------------------- |
| `agent` | Yapılandırılmış OpenClaw ajanı | Normal OpenClaw TTS çalışma zamanı     | "Ajanım toplantıda" davranışını istediğinizde        |
| `bidi`  | Gerçek zamanlı ses modeli      | Gerçek zamanlı ses sağlayıcı yanıt sesi | En düşük gecikmeli konuşmalı ses döngüsünü istediğinizde |

`bidi` modunda, gerçek zamanlı model daha derin akıl yürütmeye, güncel bilgilere veya normal OpenClaw araçlarına ihtiyaç duyduğunda `openclaw_agent_consult` çağırabilir.

Danışma aracı, arka planda yakın tarihli toplantı dökümü bağlamıyla normal OpenClaw ajanını çalıştırır ve kısa bir sözlü yanıt döndürür. `agent` modunda OpenClaw bu yanıtı doğrudan TTS çalışma zamanına gönderir; `bidi` modunda gerçek zamanlı ses modeli, danışma sonucunu toplantıya geri konuşabilir. Voice Call ile aynı paylaşılan danışma mekanizmasını kullanır.

Varsayılan olarak danışmalar `main` ajanına karşı çalışır. Bir Meet hattının özel bir OpenClaw ajan çalışma alanına, model varsayılanlarına, araç politikasına, belleğe ve oturum geçmişine danışması gerektiğinde `realtime.agentId` değerini ayarlayın.

Ajan modu danışmaları, takip sorularının yapılandırılmış ajandan normal ajan politikasını devralırken toplantı bağlamını koruması için toplantı başına `agent:<id>:subagent:google-meet:<session>` oturum anahtarı kullanır.

`realtime.toolPolicy` danışma çalıştırmasını denetler:

- `safe-read-only`: danışma aracını açığa çıkarır ve normal ajanı `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` ve `memory_get` ile sınırlar.
- `owner`: danışma aracını açığa çıkarır ve normal ajanın normal ajan araç politikasını kullanmasına izin verir.
- `none`: danışma aracını gerçek zamanlı ses modeline açığa çıkarmaz.

Danışma oturum anahtarı her Meet oturumu için kapsamlandırılır; böylece takip danışma çağrıları aynı toplantı sırasında önceki danışma bağlamını yeniden kullanabilir.

Chrome çağrıya tamamen katıldıktan sonra sözlü bir hazır olma denetimini zorlamak için:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Tam katıl-ve-konuş duman testi için:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Canlı test denetim listesi

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
- Chrome-node varsayılan aktarım olduğunda veya bir Node sabitlendiğinde `googlemeet setup` `chrome-node-connected` içerir.
- `nodes status` seçili Node'un bağlı olduğunu gösterir.
- Seçili Node hem `googlemeet.chrome` hem de `browser.proxy` duyurur.
- Meet sekmesi çağrıya katılır ve `test-speech`, `inCall: true` ile Chrome sağlığını döndürür.

Parallels macOS sanal makinesi gibi uzak bir Chrome ana makinesi için, Gateway veya sanal makine güncellendikten sonra en kısa güvenli denetim şudur:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Bu, gerçek bir toplantı sekmesini bir ajan açmadan önce Gateway Plugin'inin yüklendiğini, sanal makine Node'unun geçerli belirteçle bağlı olduğunu ve Meet ses köprüsünün kullanılabilir olduğunu kanıtlar.

Twilio duman testi için telefonla arama ayrıntıları sunan bir toplantı kullanın:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Beklenen Twilio durumu:

- `googlemeet setup` yeşil `twilio-voice-call-plugin`, `twilio-voice-call-credentials` ve `twilio-voice-call-webhook` denetimlerini içerir.
- Gateway yeniden yüklendikten sonra CLI içinde `voicecall` kullanılabilir.
- Döndürülen oturumda `transport: "twilio"` ve bir `twilio.voiceCallId` vardır.
- `openclaw logs --follow`, gerçek zamanlı TwiML'den önce DTMF TwiML'nin sunulduğunu, ardından ilk selamlamanın kuyruğa alındığı gerçek zamanlı bir köprüyü gösterir.
- `googlemeet leave <sessionId>` devredilen sesli çağrıyı kapatır.

## Sorun giderme

### Ajan Google Meet aracını göremiyor

Plugin'in Gateway yapılandırmasında etkinleştirildiğini doğrulayın ve Gateway'i yeniden yükleyin:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

`plugins.entries.google-meet` öğesini yeni düzenlediyseniz Gateway'i yeniden başlatın veya yeniden yükleyin. Çalışan ajan yalnızca geçerli Gateway işlemi tarafından kaydedilen Plugin araçlarını görür.

macOS dışındaki Gateway ana makinelerinde ajana yönelik `google_meet` aracı görünür kalır, ancak yerel Chrome konuşma geri bildirim eylemleri ses köprüsüne ulaşmadan önce engellenir. Yerel Chrome konuşma geri bildirim sesi şu anda macOS `BlackHole 2ch` bileşenine bağlıdır; bu nedenle Linux ajanları varsayılan yerel Chrome ajan yolu yerine `mode: "transcribe"`, Twilio telefonla arama veya macOS `chrome-node` ana makinesi kullanmalıdır.

### Bağlı Google Meet uyumlu Node yok

Node ana makinesinde şunu çalıştırın:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway ana makinesinde Node'u onaylayın ve komutları doğrulayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node bağlı olmalı ve `googlemeet.chrome` ile `browser.proxy` listelemelidir. Gateway yapılandırması bu Node komutlarına izin vermelidir:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup` `chrome-node-connected` denetiminde başarısız olursa veya Gateway günlüğü `gateway token mismatch` bildirirse Node'u geçerli Gateway belirteciyle yeniden kurun veya yeniden başlatın. Bir LAN Gateway için bu genellikle şu anlama gelir:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Ardından Node hizmetini yeniden yükleyin ve tekrar çalıştırın:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Tarayıcı açılıyor ancak ajan katılamıyor

Yalnızca gözlem katılımları için `googlemeet test-listen`, gerçek zamanlı katılımlar için `googlemeet test-speech` çalıştırın, ardından döndürülen Chrome sağlığını inceleyin. Problardan biri `manualActionRequired: true` bildirirse operatöre `manualActionMessage` gösterin ve tarayıcı eylemi tamamlanana kadar yeniden denemeyi durdurun.

Yaygın manuel eylemler:

- Chrome profiline giriş yapın.
- Konuğu Meet ana makine hesabından kabul edin.
- Chrome'un yerel izin istemi göründüğünde Chrome mikrofon/kamera izinlerini verin.
- Takılı kalan bir Meet izin iletişim kutusunu kapatın veya onarın.

Meet yalnızca "Do you want people to hear you in the meeting?" gösterdiği için "giriş yapılmamış" bildirmeyin. Bu, Meet'in ses seçimi ara ekranıdır; OpenClaw, kullanılabilir olduğunda tarayıcı otomasyonu aracılığıyla **Use microphone** seçeneğine tıklar ve gerçek toplantı durumunu beklemeye devam eder. Yalnızca oluşturma tarayıcı geri dönüşü için OpenClaw, URL'yi oluşturmak gerçek zamanlı ses yolunu gerektirmediğinden **Continue without microphone** seçeneğine tıklayabilir.

### Toplantı oluşturma başarısız oluyor

`googlemeet create`, OAuth kimlik bilgileri yapılandırıldığında önce Google Meet API `spaces.create` uç noktasını kullanır. OAuth kimlik bilgileri olmadan sabitlenmiş Chrome Node tarayıcısına geri döner. Şunları doğrulayın:

- API oluşturma için: `oauth.clientId` ve `oauth.refreshToken` yapılandırılmıştır veya eşleşen `OPENCLAW_GOOGLE_MEET_*` ortam değişkenleri vardır.
- API oluşturma için: yenileme belirteci, oluşturma desteği eklendikten sonra üretilmiştir. Eski belirteçlerde `meetings.space.created` kapsamı eksik olabilir; `openclaw googlemeet auth login --json` komutunu yeniden çalıştırın ve Plugin yapılandırmasını güncelleyin.
- Tarayıcı geri dönüşü için: `defaultTransport: "chrome-node"` ve `chromeNode.node`, `browser.proxy` ve `googlemeet.chrome` bulunan bağlı bir Node'u işaret eder.
- Tarayıcı geri dönüşü için: bu Node üzerindeki OpenClaw Chrome profili Google'a giriş yapmıştır ve `https://meet.google.com/new` açabilir.
- Tarayıcı geri dönüşü için: yeniden denemeler, yeni bir sekme açmadan önce mevcut bir `https://meet.google.com/new` veya Google hesabı istemi sekmesini yeniden kullanır. Bir ajan zaman aşımına uğrarsa, elle başka bir Meet sekmesi açmak yerine araç çağrısını yeniden deneyin.
- Tarayıcı geri dönüşü için: araç `manualActionRequired: true` döndürürse operatörü yönlendirmek için döndürülen `browser.nodeId`, `browser.targetId`, `browserUrl` ve `manualActionMessage` değerlerini kullanın. Bu eylem tamamlanana kadar döngü halinde yeniden denemeyin.
- Tarayıcı geri dönüşü için: Meet "Do you want people to hear you in the meeting?" gösterirse sekmeyi açık bırakın. OpenClaw, tarayıcı otomasyonu aracılığıyla **Use microphone** veya yalnızca oluşturma geri dönüşü için **Continue without microphone** seçeneğine tıklamalı ve oluşturulan Meet URL'sini beklemeye devam etmelidir. Bunu yapamazsa hata `google-login-required` değil, `meet-audio-choice-required` ifadesini belirtmelidir.

### Ajan katılıyor ama konuşmuyor

Gerçek zamanlı yolu denetleyin:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Normal STT -> OpenClaw ajanı -> TTS konuşma geri bildirimi yolu için `mode: "agent"`, doğrudan gerçek zamanlı ses geri dönüşü için `mode: "bidi"` kullanın. `mode: "transcribe"` konuşma geri bildirimi köprüsünü bilerek başlatmaz. Yalnızca gözlem hata ayıklaması için katılımcılar konuştuktan sonra `openclaw googlemeet status --json <session-id>` çalıştırın ve `captioning`, `transcriptLines` ile `lastCaptionText` değerlerini kontrol edin. `inCall` true ise ancak `transcriptLines` `0` olarak kalıyorsa Meet altyazıları devre dışı olabilir, gözlemci kurulduğundan beri kimse konuşmamış olabilir, Meet kullanıcı arayüzü değişmiş olabilir veya toplantı dili/hesabı için canlı altyazılar kullanılamıyor olabilir.

`googlemeet test-speech` her zaman gerçek zamanlı yolu denetler ve bu çağrı için köprü çıkış baytlarının gözlemlenip gözlemlenmediğini bildirir. `speechOutputVerified` false ve `speechOutputTimedOut` true ise gerçek zamanlı sağlayıcı sözceyi kabul etmiş olabilir, ancak OpenClaw yeni çıkış baytlarının Chrome ses köprüsüne ulaştığını görmemiştir.

Ayrıca şunları doğrulayın:

- Gateway ana makinesinde `OPENAI_API_KEY` veya `GEMINI_API_KEY` gibi bir gerçek zamanlı sağlayıcı anahtarı kullanılabilir.
- `BlackHole 2ch` Chrome ana makinesinde görünür.
- Chrome ana makinesinde `sox` vardır.
- Meet mikrofonu ve hoparlörü, OpenClaw tarafından kullanılan sanal ses yolu üzerinden yönlendirilmiştir. `doctor`, yerel Chrome gerçek zamanlı katılımları için `meet output routed: yes` göstermelidir.

`googlemeet doctor [session-id]` oturumu, Node'u, çağrı içi durumunu, manuel eylem nedenini, gerçek zamanlı sağlayıcı bağlantısını, `realtimeReady` durumunu, ses giriş/çıkış etkinliğini, son ses zaman damgalarını, bayt sayaçlarını ve tarayıcı URL'sini yazdırır. Ham JSON gerektiğinde `googlemeet status [session-id] --json` kullanın. Belirteçleri açığa çıkarmadan Google Meet OAuth yenilemesini doğrulamanız gerektiğinde `googlemeet doctor --oauth` kullanın; ayrıca Google Meet API kanıtı gerektiğinde `--meeting` veya `--create-space` ekleyin.

Bir ajan zaman aşımına uğradıysa ve zaten açık bir Meet sekmesi görebiliyorsanız başka bir sekme açmadan o sekmeyi inceleyin:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Eşdeğer araç eylemi `recover_current_tab` şeklindedir. Seçili aktarım için mevcut bir Meet sekmesine odaklanır ve onu inceler. `chrome` ile Gateway üzerinden yerel tarayıcı denetimini kullanır; `chrome-node` ile yapılandırılmış Chrome Node'u kullanır. Yeni sekme açmaz veya yeni oturum oluşturmaz; giriş, kabul, izinler ya da ses seçimi durumu gibi geçerli engelleyiciyi bildirir. CLI komutu yapılandırılmış Gateway ile konuşur, bu nedenle Gateway çalışıyor olmalıdır; `chrome-node` ayrıca Chrome Node'unun bağlı olmasını gerektirir.

### Twilio kurulum denetimleri başarısız oluyor

`voice-call` izin verilmemiş veya etkinleştirilmemiş olduğunda `twilio-voice-call-plugin` başarısız olur. Bunu `plugins.allow` içine ekleyin, `plugins.entries.voice-call` etkinleştirin ve Gateway'i yeniden yükleyin.

Twilio arka ucunda hesap SID'si, kimlik doğrulama belirteci veya arayan numara eksik olduğunda `twilio-voice-call-credentials` başarısız olur. Bunları Gateway ana makinesinde ayarlayın:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call` herkese açık Webhook açığa çıkarmasına sahip olmadığında veya `publicUrl` loopback ya da özel ağ alanını işaret ettiğinde `twilio-voice-call-webhook` başarısız olur. `plugins.entries.voice-call.config.publicUrl` değerini genel sağlayıcı URL'sine ayarlayın veya bir `voice-call` tüneli/Tailscale açığa çıkarması yapılandırın.

Loopback ve özel URL'ler operatör geri çağrıları için geçerli değildir. `publicUrl` olarak `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` veya `fd00::/8` kullanmayın.

Kararlı bir genel URL için:

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

Yerel geliştirme için özel bir host URL'si yerine bir tünel veya Tailscale
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

`voicecall smoke` varsayılan olarak yalnızca hazırlık denetimidir. Belirli bir numarayı prova amaçlı çalıştırmak için:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Yalnızca bilinçli olarak canlı bir giden bildirim araması başlatmak istediğinizde
`--yes` ekleyin:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio araması başlıyor ancak toplantıya hiç girmiyor

Meet etkinliğinin telefonla arama ayrıntılarını sunduğunu doğrulayın. Tam arama
numarasını ve PIN'i ya da özel bir DTMF dizisini iletin:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Sağlayıcının PIN girilmeden önce duraklamaya ihtiyacı varsa `--dtmf-sequence`
içinde başta `w` veya virgüller kullanın.

Telefon araması oluşturuluyorsa ancak Meet katılımcı listesinde telefonla katılan
katılımcı hiç görünmüyorsa:

- Temsil edilen Twilio arama kimliğini, DTMF'nin kuyruğa alınıp alınmadığını ve giriş selamlamasının istenip istenmediğini doğrulamak için `openclaw googlemeet doctor <session-id>` çalıştırın.
- `openclaw voicecall status --call-id <id>` çalıştırın ve aramanın hâlâ etkin olduğunu doğrulayın.
- `openclaw voicecall tail` çalıştırın ve Twilio Webhook'larının Gateway'e ulaştığını kontrol edin.
- `openclaw logs --follow` çalıştırın ve Twilio Meet dizisini arayın: Google Meet katılımı temsil eder, Voice Call bağlantı öncesi DTMF TwiML'ini saklayıp sunar, Voice Call Twilio araması için gerçek zamanlı TwiML sunar, ardından Google Meet `voicecall.speak` ile giriş konuşması ister.
- `openclaw googlemeet setup --transport twilio` komutunu yeniden çalıştırın; yeşil bir kurulum denetimi gereklidir ancak toplantı PIN dizisinin doğru olduğunu kanıtlamaz.
- Arama numarasının PIN ile aynı Meet davetine ve bölgesine ait olduğunu doğrulayın.
- Meet yavaş yanıtlıyorsa veya arama dökümü bağlantı öncesi DTMF gönderildikten sonra hâlâ PIN isteyen istemi gösteriyorsa `voiceCall.dtmfDelayMs` değerini 12 saniyelik varsayılandan artırın.
- Katılımcı katılıyor ancak selamlamayı duymuyorsanız, DTMF sonrası `voicecall.speak` isteği ve medya akışı TTS oynatımı ya da Twilio `<Say>` geri dönüşü için `openclaw logs --follow` çıktısını kontrol edin. Arama dökümü hâlâ "enter the meeting PIN" içeriyorsa telefon bacağı henüz Meet odasına katılmamıştır, bu nedenle toplantı katılımcıları konuşmayı duymayacaktır.

Webhook'lar ulaşmıyorsa önce Voice Call Plugin'de hata ayıklayın: sağlayıcının
`plugins.entries.voice-call.config.publicUrl` değerine veya yapılandırılmış tünele
ulaşması gerekir. Bkz. [Sesli arama sorun giderme](/tr/plugins/voice-call#troubleshooting).

## Notlar

Google Meet'in resmi medya API'si alma odaklıdır, bu yüzden bir Meet aramasında
konuşmak hâlâ bir katılımcı yolu gerektirir. Bu Plugin bu sınırı görünür tutar:
Chrome tarayıcı katılımını ve yerel ses yönlendirmesini yönetir; Twilio telefonla
arama katılımını yönetir.

Chrome konuşma-geri dönüş modları `BlackHole 2ch` ve ayrıca şunlardan birini gerektirir:

- `chrome.audioInputCommand` ve `chrome.audioOutputCommand`: Köprünün sahibi OpenClaw'dur ve ses verisini bu komutlar ile seçili sağlayıcı arasında `chrome.audioFormat` içinde aktarır. Agent modu gerçek zamanlı transkripsiyon ve normal TTS kullanır; bidi modu gerçek zamanlı ses sağlayıcısını kullanır. Varsayılan Chrome yolu, `chrome.audioBufferBytes: 4096` ile 24 kHz PCM16'dır; eski komut çiftleri için 8 kHz G.711 mu-law kullanılabilir durumda kalır.
- `chrome.audioBridgeCommand`: Harici bir köprü komutu tüm yerel ses yolunun sahibidir ve daemon'unu başlattıktan veya doğruladıktan sonra çıkmalıdır. Bu yalnızca `bidi` için geçerlidir çünkü `agent` modu TTS için doğrudan komut çifti erişimi gerektirir.

Bir agent, agent modunda `google_meet` aracını çağırdığında toplantı danışmanı
oturumu, katılımcı konuşmasını yanıtlamadan önce çağıranın mevcut dökümünü çatallar.
Meet oturumu yine de ayrı kalır (`agent:<agentId>:subagent:google-meet:<sessionId>`),
böylece toplantı takipleri çağıran dökümünü doğrudan değiştirmez.

Temiz çift yönlü ses için Meet çıkışını ve Meet mikrofonunu ayrı sanal cihazlar
veya Loopback tarzı bir sanal cihaz grafiği üzerinden yönlendirin. Tek bir paylaşılan
BlackHole cihazı diğer katılımcıları aramaya geri yankılayabilir.

Komut çifti Chrome köprüsüyle `chrome.bargeInInputCommand` ayrı bir yerel mikrofonu
dinleyebilir ve insan konuşmaya başladığında asistan oynatımını temizleyebilir.
Bu, paylaşılan BlackHole loopback girişi asistan oynatımı sırasında geçici olarak
baskılansa bile insan konuşmasını asistan çıktısının önünde tutar.
`chrome.audioInputCommand` ve `chrome.audioOutputCommand` gibi bu da operatör
tarafından yapılandırılan yerel bir komuttur. Açık bir güvenilir komut yolu veya
argüman listesi kullanın ve bunu güvenilmeyen konumlardaki betiklere yönlendirmeyin.

`googlemeet speak`, bir Chrome oturumu için etkin konuşma-geri dönüş ses köprüsünü
tetikler. `googlemeet leave` bu köprüyü durdurur. Voice Call Plugin üzerinden
temsil edilen Twilio oturumları için `leave` alttaki sesli aramayı da kapatır.
API tarafından yönetilen bir alan için etkin Google Meet konferansını da kapatmak
istediğinizde `googlemeet end-active-conference` kullanın.

## İlgili

- [Voice Call Plugin](/tr/plugins/voice-call)
- [Konuşma modu](/tr/nodes/talk)
- [Plugin oluşturma](/tr/plugins/building-plugins)
