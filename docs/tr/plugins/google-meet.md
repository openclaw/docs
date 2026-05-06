---
read_when:
    - Bir OpenClaw ajanının bir Google Meet aramasına katılmasını istiyorsunuz
    - Bir OpenClaw ajanının yeni bir Google Meet görüşmesi oluşturmasını istiyorsunuz
    - Chrome, Chrome node veya Twilio'yu Google Meet taşıyıcısı olarak yapılandırıyorsunuz
summary: 'Google Meet Plugin''i: aracı sesli yanıt varsayılanlarıyla açıkça belirtilen Meet URL''lerine Chrome veya Twilio üzerinden katılın'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-06T17:59:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b154e9cbce560dbc8327a140b27c17d2614d13d7011032a48b110314772ab0c
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet katılımcı desteği OpenClaw için tasarım gereği açık tanımlıdır:

- Yalnızca açık bir `https://meet.google.com/...` URL'sine katılır.
- Google Meet API üzerinden yeni bir Meet alanı oluşturabilir, ardından dönen URL'ye katılabilir.
- `agent` varsayılan yanıt verme modudur: gerçek zamanlı transkripsiyon dinler, yapılandırılmış OpenClaw ajanı yanıt verir ve normal OpenClaw TTS Meet içine konuşur.
- `bidi`, doğrudan gerçek zamanlı ses modeli için yedek mod olarak kullanılmaya devam eder.
- Ajanlar katılma davranışını `mode` ile seçer: canlı dinleme/yanıt verme için `agent`, doğrudan gerçek zamanlı ses yedeği için `bidi` veya yanıt verme köprüsü olmadan tarayıcıya katılmak/kontrol etmek için `transcribe` kullanın.
- Kimlik doğrulama kişisel Google OAuth veya zaten oturum açılmış bir Chrome profili olarak başlar.
- Otomatik onay duyurusu yoktur.
- Varsayılan Chrome ses arka ucu `BlackHole 2ch` değeridir.
- Chrome yerel olarak veya eşleştirilmiş bir node ana makinesinde çalışabilir.
- Twilio, çevirmeli bir numara ile isteğe bağlı PIN veya DTMF dizisini kabul eder; bir Meet URL'sini doğrudan arayamaz.
- CLI komutu `googlemeet` değeridir; `meet` daha geniş ajan telekonferans iş akışları için ayrılmıştır.

## Hızlı başlangıç

Yerel ses bağımlılıklarını yükleyin ve bir gerçek zamanlı transkripsiyon sağlayıcısı ile normal OpenClaw TTS yapılandırın. OpenAI varsayılan transkripsiyon sağlayıcısıdır; Google Gemini Live da `realtime.voiceProvider: "google"` ile ayrı bir `bidi` ses yedeği olarak çalışır:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# yalnızca bidi modu için realtime.voiceProvider "google" olduğunda gerekir
export GEMINI_API_KEY=...
```

`blackhole-2ch`, `BlackHole 2ch` sanal ses aygıtını yükler. Homebrew yükleyicisi, macOS'in aygıtı göstermesinden önce yeniden başlatma gerektirir:

```bash
sudo reboot
```

Yeniden başlattıktan sonra her iki parçayı doğrulayın:

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

Kurulum çıktısı, ajan tarafından okunabilir ve moda duyarlı olacak şekilde tasarlanmıştır. Chrome profili, node sabitleme ve gerçek zamanlı Chrome katılımları için BlackHole/SoX ses köprüsü ile gecikmeli gerçek zamanlı giriş kontrollerini raporlar. Yalnızca gözlem amaçlı katılımlar için aynı aktarımı `--mode transcribe` ile kontrol edin; bu mod, köprü üzerinden dinlemediği veya konuşmadığı için gerçek zamanlı ses ön koşullarını atlar:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Twilio yetki devri yapılandırıldığında, kurulum ayrıca `voice-call` Plugin'inin, Twilio kimlik bilgilerinin ve herkese açık Webhook erişiminin hazır olup olmadığını raporlar. Bir ajandan katılmasını istemeden önce herhangi bir `ok: false` kontrolünü, kontrol edilen aktarım ve mod için engelleyici olarak ele alın. Betikler veya makine tarafından okunabilir çıktı için `openclaw googlemeet setup --json` kullanın. Bir ajan denemeden önce belirli bir aktarımı ön kontrol etmek için `--transport chrome`, `--transport chrome-node` veya `--transport twilio` kullanın.

Twilio için, varsayılan aktarım Chrome olduğunda aktarımı her zaman açıkça ön kontrol edin:

```bash
openclaw googlemeet setup --transport twilio
```

Bu, ajan toplantıyı aramaya çalışmadan önce eksik `voice-call` bağlantılarını, Twilio kimlik bilgilerini veya erişilemeyen Webhook erişimini yakalar.

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

Ajanlara yönelik `google_meet` aracı, macOS dışı ana makinelerde artifact, takvim, kurulum, transkripsiyon, Twilio ve `chrome-node` akışları için kullanılmaya devam eder. Yerel Chrome yanıt verme eylemleri burada engellenir çünkü paketlenen Chrome ses yolu şu anda macOS `BlackHole 2ch` değerine bağlıdır. Linux'ta Chrome yanıt verme katılımı için `mode: "transcribe"`, Twilio aramalı katılım veya bir macOS `chrome-node` ana makinesi kullanın.

Yeni bir toplantı oluşturun ve katılın:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

API ile oluşturulan odalar için, odanın kapı çalmadan giriş politikasının Google hesabı varsayılanlarından devralınmak yerine açıkça belirtilmesini istediğinizde Google Meet `SpaceConfig.accessType` kullanın:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN`, Meet URL'sine sahip herkesin kapı çalmadan katılmasına izin verir. `TRUSTED`, ana kuruluşun güvenilen kullanıcılarının, davet edilen harici kullanıcıların ve çevirmeli katılım kullanıcılarının kapı çalmadan katılmasına izin verir. `RESTRICTED`, kapı çalmadan girişi davetlilerle sınırlar. Bu ayarlar yalnızca resmi Google Meet API oluşturma yoluna uygulanır, bu nedenle OAuth kimlik bilgileri yapılandırılmış olmalıdır.

Bu seçenek kullanılabilir olmadan önce Google Meet kimlik doğrulaması yaptıysanız, Google OAuth onay ekranınıza `meetings.space.settings` kapsamını ekledikten sonra `openclaw googlemeet auth login --json` komutunu yeniden çalıştırın.

Katılmadan yalnızca URL'yi oluşturun:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` iki yola sahiptir:

- API oluşturma: Google Meet OAuth kimlik bilgileri yapılandırıldığında kullanılır. Bu en deterministik yoldur ve tarayıcı UI durumuna bağlı değildir.
- Tarayıcı yedeği: OAuth kimlik bilgileri yokken kullanılır. OpenClaw sabitlenmiş Chrome node'unu kullanır, `https://meet.google.com/new` adresini açar, Google'ın gerçek bir toplantı kodu URL'sine yönlendirmesini bekler ve ardından bu URL'yi döndürür. Bu yol, node üzerindeki OpenClaw Chrome profilinin Google'da zaten oturum açmış olmasını gerektirir. Tarayıcı otomasyonu Meet'in kendi ilk çalıştırma mikrofon istemini işler; bu istem Google oturum açma hatası olarak değerlendirilmez.
  Katılma ve oluşturma akışları ayrıca yeni bir tane açmadan önce mevcut bir Meet sekmesini yeniden kullanmayı dener. Eşleştirme, `authuser` gibi zararsız URL sorgu dizelerini yok sayar; bu nedenle bir ajan yeniden denemesi, ikinci bir Chrome sekmesi oluşturmak yerine zaten açık olan toplantıya odaklanmalıdır.

Komut/araç çıktısı bir `source` alanı (`api` veya `browser`) içerir, böylece ajanlar hangi yolun kullanıldığını açıklayabilir. `create`, varsayılan olarak yeni toplantıya katılır ve `joined: true` ile katılma oturumunu döndürür. Yalnızca URL oluşturmak için CLI'da `create --no-join` kullanın veya araca `"join": false` geçirin.

Veya bir ajana şunu söyleyin: "Bir Google Meet oluştur, ajan yanıt verme moduyla katıl ve bağlantıyı bana gönder." Ajan, `action: "create"` ile `google_meet` çağırmalı ve ardından dönen `meetingUri` değerini paylaşmalıdır.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Yalnızca gözlem/tarayıcı kontrolü amaçlı katılım için `"mode": "transcribe"` ayarlayın. Bu, çift yönlü gerçek zamanlı ses köprüsünü başlatmaz, BlackHole veya SoX gerektirmez ve toplantıya yanıt vermez. Bu moddaki Chrome katılımları ayrıca OpenClaw'ın mikrofon/kamera izin verme adımından ve Meet **Mikrofonu kullan** yolundan kaçınır. Meet bir ses seçimi ara ekranı gösterirse otomasyon mikrofonsuz yolu dener; aksi halde yerel mikrofonu açmak yerine manuel eylem raporlar. Transkripsiyon modunda, yönetilen Chrome aktarımları ayrıca en iyi çabayla çalışan bir Meet altyazı gözlemcisi kurar. `googlemeet status --json` ve `googlemeet doctor`, operatörlerin tarayıcının aramaya katılıp katılmadığını ve Meet altyazılarının metin üretip üretmediğini anlayabilmesi için `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` ve kısa bir `recentTranscript` kuyruğu gösterir.
Evet/hayır yoklamasına ihtiyaç duyduğunuzda `openclaw googlemeet test-listen <meet-url> --transport chrome-node` kullanın: transkripsiyon modunda katılır, yeni altyazı veya transkript hareketi bekler ve `listenVerified`, `listenTimedOut`, manuel eylem alanları ile en son altyazı sağlığını döndürür.

Gerçek zamanlı oturumlar sırasında `google_meet` durumu, `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, son giriş/çıkış zaman damgaları, bayt sayaçları ve köprü kapalı durumu gibi tarayıcı ve ses köprüsü sağlığını içerir. Güvenli bir Meet sayfa istemi görünürse, tarayıcı otomasyonu mümkün olduğunda bunu işler. Oturum açma, ana makine kabulü ve tarayıcı/OS izin istemleri, ajanın iletmesi için bir neden ve mesajla manuel eylem olarak raporlanır. Yönetilen Chrome oturumları, giriş veya test ifadesini yalnızca tarayıcı sağlığı `inCall: true` raporladıktan sonra yayar; aksi halde durum `speechReady: false` raporlar ve konuşma denemesi, ajan toplantıya konuşmuş gibi davranmak yerine engellenir.

Yerel Chrome katılımları, oturum açılmış OpenClaw tarayıcı profili üzerinden yapılır. Gerçek zamanlı mod, OpenClaw tarafından kullanılan mikrofon/hoparlör yolu için `BlackHole 2ch` gerektirir. Temiz çift yönlü ses için ayrı sanal aygıtlar veya Loopback tarzı bir grafik kullanın; tek bir BlackHole aygıtı ilk smoke test için yeterlidir ancak yankı yapabilir.

### Yerel Gateway + Parallels Chrome

Yalnızca VM'in Chrome'u sahiplenmesini sağlamak için macOS VM içinde tam bir OpenClaw Gateway veya model API anahtarına ihtiyacınız **yoktur**. Gateway ve ajanı yerel olarak çalıştırın, ardından VM içinde bir node ana makinesi çalıştırın. Node'un Chrome komutunu duyurması için paketlenen Plugin'i VM'de bir kez etkinleştirin:

Nerede ne çalışır:

- Gateway ana makinesi: OpenClaw Gateway, ajan çalışma alanı, model/API anahtarları, gerçek zamanlı sağlayıcı ve Google Meet Plugin yapılandırması.
- Parallels macOS VM: OpenClaw CLI/node ana makinesi, Google Chrome, SoX, BlackHole 2ch ve Google'da oturum açmış bir Chrome profili.
- VM'de gerekmeyenler: Gateway servisi, ajan yapılandırması, OpenAI/GPT anahtarı veya model sağlayıcı kurulumu.

VM bağımlılıklarını yükleyin:

```bash
brew install blackhole-2ch sox
```

BlackHole yüklendikten sonra macOS'in `BlackHole 2ch` değerini göstermesi için VM'i yeniden başlatın:

```bash
sudo reboot
```

Yeniden başlattıktan sonra VM'in ses aygıtını ve SoX komutlarını görebildiğini doğrulayın:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

VM'de OpenClaw'ı yükleyin veya güncelleyin, ardından paketlenen Plugin'i orada etkinleştirin:

```bash
openclaw plugins enable google-meet
```

VM'de node ana makinesini başlatın:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` bir LAN IP'si ise ve TLS kullanmıyorsanız, o güvenilen özel ağ için açıkça onay vermediğiniz sürece node düz metin WebSocket'i reddeder:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` bir işlem ortamıdır, `openclaw.json` ayarı değildir. `openclaw node install`, kurulum komutunda mevcut olduğunda bunu LaunchAgent ortamında saklar.

Node'u Gateway ana makinesinden onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway'in node'u gördüğünü ve hem `googlemeet.chrome` hem de tarayıcı yeteneği/`browser.proxy` duyurduğunu doğrulayın:

```bash
openclaw nodes status
```

Meet'i Gateway ana makinesinde bu node üzerinden yönlendirin:

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

veya ajandan `transport: "chrome-node"` ile `google_meet` aracını kullanmasını isteyin.

Oturum oluşturan veya mevcut oturumu yeniden kullanan, bilinen bir ifade söyleyen ve oturum sağlığını yazdıran tek komutluk smoke test için:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Gerçek zamanlı katılma sırasında OpenClaw tarayıcı otomasyonu konuk adını doldurur, Katıl/Katılmayı iste'ye tıklar ve bu istem göründüğünde Meet'in ilk çalıştırma "Mikrofonu kullan" seçimini kabul eder. Yalnızca gözlem amaçlı katılma veya yalnızca tarayıcıyla toplantı oluşturma sırasında, aynı istemde bu seçenek kullanılabiliyorsa mikrofon olmadan devam eder. Tarayıcı profili oturum açmamışsa, Meet toplantı sahibi kabulünü bekliyorsa, Chrome'un gerçek zamanlı katılma için mikrofon/kamera iznine ihtiyacı varsa veya Meet otomasyonun çözemediği bir istemde takılı kaldıysa, join/test-speech sonucu `manualActionRequired: true` değerini `manualActionReason` ve `manualActionMessage` ile birlikte bildirir. Ajanlar katılmayı yeniden denemeyi bırakmalı, bu tam mesajı geçerli `browserUrl`/`browserTitle` ile birlikte bildirmeli ve yalnızca manuel tarayıcı işlemi tamamlandıktan sonra yeniden denemelidir.

`chromeNode.node` atlanırsa OpenClaw yalnızca tam olarak bir bağlı node hem `googlemeet.chrome` hem de tarayıcı denetimi duyurduğunda otomatik seçim yapar. Birden fazla yetenekli node bağlıysa, `chromeNode.node` değerini node kimliğine, görünen ada veya uzak IP'ye ayarlayın.

Yaygın hata denetimleri:

- `Configured Google Meet node ... is not usable: offline`: sabitlenmiş node Gateway tarafından biliniyor ancak kullanılamıyor. Ajanlar bu node'u kullanılabilir bir Chrome ana makinesi olarak değil, tanılama durumu olarak ele almalı ve kullanıcı bunu istemedikçe başka bir aktarıma geri dönmek yerine kurulum engelleyicisini bildirmelidir.
- `No connected Google Meet-capable node`: VM içinde `openclaw node run` başlatın, eşleştirmeyi onaylayın ve VM içinde `openclaw plugins enable google-meet` ile `openclaw plugins enable browser` komutlarının çalıştırıldığından emin olun. Ayrıca Gateway ana makinesinin her iki node komutuna da `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` ile izin verdiğini doğrulayın.
- `BlackHole 2ch audio device not found`: denetlenen ana makineye `blackhole-2ch` yükleyin ve yerel Chrome sesi kullanmadan önce yeniden başlatın.
- `BlackHole 2ch audio device not found on the node`: VM içinde `blackhole-2ch` yükleyin ve VM'yi yeniden başlatın.
- Chrome açılıyor ancak katılamıyorsa: VM içindeki tarayıcı profilinde oturum açın veya konuk katılımı için `chrome.guestName` ayarlı kalsın. Konuk otomatik katılımı, node tarayıcı proxy'si üzerinden OpenClaw tarayıcı otomasyonunu kullanır; node tarayıcı yapılandırmasının istediğiniz profili gösterdiğinden emin olun, örneğin `browser.defaultProfile: "user"` veya adlandırılmış mevcut oturum profili.
- Yinelenen Meet sekmeleri: `chrome.reuseExistingTab: true` etkin kalsın. OpenClaw yeni bir sekme açmadan önce aynı Meet URL'si için mevcut bir sekmeyi etkinleştirir ve tarayıcıyla toplantı oluşturma da başka bir sekme açmadan önce sürmekte olan bir `https://meet.google.com/new` veya Google hesabı istem sekmesini yeniden kullanır.
- Ses yok: Meet içinde mikrofon/hoparlör sesini OpenClaw tarafından kullanılan sanal ses aygıtı yolu üzerinden yönlendirin; temiz çift yönlü ses için ayrı sanal aygıtlar veya Loopback tarzı yönlendirme kullanın.

## Kurulum notları

Chrome geri konuşma varsayılanı iki harici araç kullanır:

- `sox`: komut satırı ses yardımcı programı. Plugin, varsayılan 24 kHz PCM16 ses köprüsü için açık CoreAudio aygıt komutları kullanır.
- `blackhole-2ch`: macOS sanal ses sürücüsü. Chrome/Meet'in yönlendirme yapabileceği `BlackHole 2ch` ses aygıtını oluşturur.

OpenClaw bu paketlerden hiçbirini paketlemez veya yeniden dağıtmaz. Dokümanlar kullanıcılardan bunları Homebrew üzerinden ana makine bağımlılıkları olarak yüklemelerini ister. SoX `LGPL-2.0-only AND GPL-2.0-only` lisanslıdır; BlackHole GPL-3.0 lisanslıdır. BlackHole'u OpenClaw ile paketleyen bir yükleyici veya aygıt oluşturursanız, BlackHole'un upstream lisans koşullarını inceleyin veya Existential Audio'dan ayrı bir lisans alın.

## Aktarımlar

### Chrome

Chrome aktarımı, Meet URL'sini OpenClaw tarayıcı denetimi üzerinden açar ve oturum açmış OpenClaw tarayıcı profiliyle katılır. macOS'ta Plugin, başlatmadan önce `BlackHole 2ch` denetimi yapar. Yapılandırılmışsa, Chrome'u açmadan önce bir ses köprüsü sağlık komutu ve başlangıç komutu da çalıştırır. Chrome/ses Gateway ana makinesinde çalışıyorsa `chrome` kullanın; Chrome/ses Parallels macOS VM gibi eşlenmiş bir node üzerinde çalışıyorsa `chrome-node` kullanın. Yerel Chrome için profili `browser.defaultProfile` ile seçin; `chrome.browserProfile`, `chrome-node` ana makinelerine geçirilir.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome mikrofon ve hoparlör sesini yerel OpenClaw ses köprüsü üzerinden yönlendirin. `BlackHole 2ch` yüklü değilse, katılma işlemi ses yolu olmadan sessizce katılmak yerine bir kurulum hatasıyla başarısız olur.

### Twilio

Twilio aktarımı, Voice Call Plugin'e devredilen katı bir arama planıdır. Telefon numaraları için Meet sayfalarını ayrıştırmaz.

Chrome katılımı kullanılamadığında veya telefonla arama yedeği istediğinizde bunu kullanın. Google Meet, toplantı için telefonla arama numarası ve PIN sağlamalıdır; OpenClaw bunları Meet sayfasından keşfetmez.

Voice Call Plugin'i Chrome node üzerinde değil, Gateway ana makinesinde etkinleştirin:

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

Twilio kimlik bilgilerini ortam veya yapılandırma üzerinden sağlayın. Ortam, gizli bilgileri `openclaw.json` dışında tutar:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Gerçek zamanlı ses sağlayıcınız buysa bunun yerine OpenAI sağlayıcı Plugin'i ve `OPENAI_API_KEY` ile `realtime.provider: "openai"` kullanın.

`voice-call` etkinleştirildikten sonra Gateway'i yeniden başlatın veya yeniden yükleyin; Plugin yapılandırma değişiklikleri, yeniden yüklenene kadar halihazırda çalışan Gateway sürecinde görünmez.

Ardından doğrulayın:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio delegasyonu bağlandığında, `googlemeet setup` başarılı `twilio-voice-call-plugin`, `twilio-voice-call-credentials` ve `twilio-voice-call-webhook` denetimlerini içerir.

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

## OAuth ve ön denetim

OAuth, Meet bağlantısı oluşturmak için isteğe bağlıdır çünkü `googlemeet create` tarayıcı otomasyonuna geri dönebilir. Resmi API ile oluşturma, alan çözümleme veya Meet Media API ön denetimleri istediğinizde OAuth'u yapılandırın.

Google Meet API erişimi kullanıcı OAuth'u kullanır: bir Google Cloud OAuth istemcisi oluşturun, gerekli kapsamları isteyin, bir Google hesabını yetkilendirin, ardından ortaya çıkan yenileme belirtecini Google Meet Plugin yapılandırmasında saklayın veya `OPENCLAW_GOOGLE_MEET_*` ortam değişkenlerini sağlayın.

OAuth, Chrome katılma yolunun yerine geçmez. Chrome ve Chrome-node aktarımları, tarayıcı katılımı kullandığınızda yine oturum açmış bir Chrome profili, BlackHole/SoX ve bağlı bir node üzerinden katılır. OAuth yalnızca resmi Google Meet API yolu içindir: toplantı alanları oluşturmak, alanları çözümlemek ve Meet Media API ön denetimleri çalıştırmak.

### Google kimlik bilgilerini oluşturun

Google Cloud Console içinde:

1. Bir Google Cloud projesi oluşturun veya seçin.
2. Bu proje için **Google Meet REST API**'yi etkinleştirin.
3. OAuth izin ekranını yapılandırın.
   - **Internal**, Google Workspace kuruluşu için en basit seçenektir.
   - **External**, kişisel/test kurulumları için çalışır; uygulama Testing durumundayken, uygulamayı yetkilendirecek her Google hesabını test kullanıcısı olarak ekleyin.
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

6. İstemci kimliğini ve istemci sırrını kopyalayın.

`meetings.space.created`, Google Meet `spaces.create` tarafından gereklidir. `meetings.space.readonly`, OpenClaw'ın Meet URL'lerini/kodlarını alanlara çözümlemesini sağlar. `meetings.space.settings`, OpenClaw'ın API oda oluşturma sırasında `accessType` gibi `SpaceConfig` ayarlarını geçirmesini sağlar. `meetings.conference.media.readonly`, Meet Media API ön denetimi ve medya işi içindir; Google gerçek Media API kullanımı için Developer Preview kaydı gerektirebilir. Yalnızca tarayıcı tabanlı Chrome katılımlarına ihtiyacınız varsa OAuth'u tamamen atlayın.

### Yenileme belirtecini üretin

`oauth.clientId` ve isteğe bağlı olarak `oauth.clientSecret` yapılandırın veya bunları ortam değişkenleri olarak geçirin, ardından şunu çalıştırın:

```bash
openclaw googlemeet auth login --json
```

Komut, yenileme belirteci içeren bir `oauth` yapılandırma bloğu yazdırır. PKCE, `http://localhost:8085/oauth2callback` üzerinde localhost geri çağrısı ve `--manual` ile manuel kopyala/yapıştır akışı kullanır.

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

Yenileme belirtecini yapılandırmada istemiyorsanız ortam değişkenlerini tercih edin. Hem yapılandırma hem de ortam değerleri mevcutsa, Plugin önce yapılandırmayı çözümler ve ardından ortam yedeğine döner.

OAuth izni Meet alanı oluşturma, Meet alanı okuma erişimi ve Meet konferans medya okuma erişimini içerir. Toplantı oluşturma desteği mevcut olmadan önce kimlik doğrulaması yaptıysanız, yenileme belirtecinin `meetings.space.created` kapsamına sahip olması için `openclaw googlemeet auth login --json` komutunu yeniden çalıştırın.

### OAuth'u doctor ile doğrulayın

Hızlı, gizli bilgi içermeyen bir sağlık denetimi istediğinizde OAuth doctor'ı çalıştırın:

```bash
openclaw googlemeet doctor --oauth --json
```

Bu, Chrome runtime'ını yüklemez veya bağlı bir Chrome node gerektirmez. OAuth yapılandırmasının var olduğunu ve yenileme belirtecinin bir erişim belirteci üretebildiğini denetler. JSON raporu yalnızca `ok`, `configured`, `tokenSource`, `expiresAt` ve denetim mesajları gibi durum alanlarını içerir; erişim belirtecini, yenileme belirtecini veya istemci sırrını yazdırmaz.

Yaygın sonuçlar:

| Kontrol              | Anlamı                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` ile `oauth.refreshToken` veya önbelleğe alınmış bir erişim belirteci mevcut. |
| `oauth-token`        | Önbelleğe alınmış erişim belirteci hâlâ geçerli veya yenileme belirteci yeni bir erişim belirteci üretti. |
| `meet-spaces-get`    | İsteğe bağlı `--meeting` kontrolü mevcut bir Meet alanını çözümledi.                    |
| `meet-spaces-create` | İsteğe bağlı `--create-space` kontrolü yeni bir Meet alanı oluşturdu.                   |

Google Meet API etkinleştirmesini ve `spaces.create` kapsamını da kanıtlamak
için yan etkili oluşturma kontrolünü çalıştırın:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` tek kullanımlık bir Meet URL'si oluşturur. Google Cloud
projesinde Meet API'nin etkin olduğunu ve yetkilendirilmiş hesabın
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
yenileme belirtecinin gerekli kapsamı içermediği veya Google hesabının ilgili
Meet alanına erişemediği anlamına gelir. Yenileme belirteci hatası,
`openclaw googlemeet auth login --json` komutunu yeniden çalıştırıp yeni
`oauth` bloğunu saklamanız gerektiği anlamına gelir.

Tarayıcı yedek yolu için OAuth kimlik bilgileri gerekmez. Bu modda Google
kimlik doğrulaması OpenClaw yapılandırmasından değil, seçilen Node üzerindeki
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

Bir Meet URL'sini, kodunu veya `spaces/{id}` değerini `spaces.get` üzerinden
çözümleyin:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Medya işinden önce ön kontrol çalıştırın:

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
kaydını kullanır. Bu toplantı için tutulan tüm kayıtları istediğinizde
`--all-conference-records` iletin.

Takvim araması, Meet yapıtlarını okumadan önce toplantı URL'sini Google
Calendar'dan çözümleyebilir:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today`, Google Meet bağlantısı olan bir Calendar etkinliği için bugünün
`primary` takvimini arar. Eşleşen etkinlik metnini aramak için `--event <query>`,
birincil olmayan bir takvim için `--calendar <id>` kullanın. Takvim araması,
Calendar etkinlikleri salt okunur kapsamını içeren yeni bir OAuth oturumu
gerektirir. `calendar-events`, eşleşen Meet etkinliklerini önizler ve `latest`,
`artifacts`, `attendance` veya `export` komutunun seçeceği etkinliği işaretler.

Konferans kaydı kimliğini zaten biliyorsanız doğrudan adresleyin:

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

Bu işlem Google Meet `spaces.endActiveConference` çağrısını yapar ve
yetkilendirilmiş hesabın yönetebildiği bir alan için `meetings.space.created`
kapsamına sahip OAuth gerektirir. OpenClaw bir Meet URL'si, toplantı kodu veya
`spaces/{id}` girdisini kabul eder ve etkin konferansı sonlandırmadan önce bunu
API alan kaynağına çözümleyerek dönüştürür. Bu, `googlemeet leave` komutundan
ayrıdır: `leave` OpenClaw'ın yerel/oturum katılımını durdururken,
`end-active-conference` Google Meet'ten alanın etkin konferansını
sonlandırmasını ister.

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

`artifacts`, Google toplantı için sunduğunda konferans kaydı meta verilerini;
katılımcı, kayıt, döküm, yapılandırılmış döküm girdisi ve akıllı not kaynak
meta verileriyle birlikte döndürür. Büyük toplantılarda girdi aramasını atlamak
için `--no-transcript-entries` kullanın. `attendance`, katılımcıları ilk/son
görülme zamanları, toplam oturum süresi, geç/erken ayrılma işaretleri ve oturum
açmış kullanıcıya veya görünen ada göre birleştirilmiş yinelenen katılımcı
kaynaklarıyla katılımcı oturumu satırlarına genişletir. Ham katılımcı
kaynaklarını ayrı tutmak için `--no-merge-duplicates`, geç algılamayı ayarlamak
için `--late-after-minutes` ve erken ayrılma algılamasını ayarlamak için
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
özet ve manifest tüm dışa aktarmayı başarısız yapmak yerine uyarıyı korur.
Aynı yapıt/katılım verilerini almak ve klasör ya da ZIP oluşturmadan manifest
JSON'unu yazdırmak için `--dry-run` kullanın. Bu, büyük bir dışa aktarma
yazmadan önce veya bir agent yalnızca sayılara, seçili kayıtlara ve uyarılara
ihtiyaç duyduğunda yararlıdır.

Agent'lar aynı paketi `google_meet` aracıyla da oluşturabilir:

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

Agent'lar açık bir erişim ilkesiyle API destekli bir oda da oluşturabilir:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
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

Önce dinle doğrulaması için agent'lar, toplantının yararlı olduğunu iddia etmeden
önce `test_listen` kullanmalıdır:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Korunan canlı smoke testini gerçek ve saklanan bir toplantıya karşı çalıştırın:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Birinin konuşacağı ve Meet altyazılarının kullanılabilir olduğu bir toplantıya
karşı canlı önce dinle tarayıcı yoklamasını çalıştırın:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Canlı smoke ortamı:

- `OPENCLAW_LIVE_TEST=1` korunan canlı testleri etkinleştirir.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` saklanan bir Meet URL'sini, kodunu veya
  `spaces/{id}` değerini gösterir.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` veya `GOOGLE_MEET_CLIENT_ID`, OAuth istemci
  kimliğini sağlar.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` veya `GOOGLE_MEET_REFRESH_TOKEN`,
  yenileme belirtecini sağlar.
- İsteğe bağlı: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ve
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`, `OPENCLAW_` ön eki olmadan
  aynı yedek adları kullanır.

Temel yapıt/katılım canlı smoke testi
`https://www.googleapis.com/auth/meetings.space.readonly` ve
`https://www.googleapis.com/auth/meetings.conference.media.readonly`
gerektirir. Takvim araması
`https://www.googleapis.com/auth/calendar.events.readonly` gerektirir. Drive
belge gövdesi dışa aktarması
`https://www.googleapis.com/auth/drive.meet.readonly` gerektirir.

Yeni bir Meet alanı oluşturun:

```bash
openclaw googlemeet create
```

Komut yeni `meeting uri` değerini, kaynağı ve katılım oturumunu yazdırır. OAuth
kimlik bilgileriyle resmi Google Meet API'yi kullanır. OAuth kimlik bilgileri
olmadan, sabitlenmiş Chrome Node'un oturum açmış tarayıcı profilini yedek olarak
kullanır. Agent'lar tek adımda oluşturup katılmak için `action: "create"` ile
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

Bir agent `manualActionRequired: true` gördüğünde `manualActionMessage` ile
tarayıcı Node/sekme bağlamını bildirmeli ve operatör tarayıcı adımını
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

Meet oluşturmak varsayılan olarak katılım sağlar. Chrome veya Chrome-node aktarımı yine de tarayıcı üzerinden katılmak için oturum açılmış bir Google Chrome profiline ihtiyaç duyar. Profil oturumdan çıkmışsa OpenClaw `manualActionRequired: true` ya da bir tarayıcı geri dönüş hatası bildirir ve operatörden yeniden denemeden önce Google oturum açma işlemini tamamlamasını ister.

`preview.enrollmentAcknowledged: true` değerini yalnızca Cloud projenizin, OAuth sorumlusunun ve toplantı katılımcılarının Meet medya API'leri için Google Workspace Developer Preview Program'a kayıtlı olduğunu doğruladıktan sonra ayarlayın.

## Yapılandırma

Ortak Chrome ajan yolu yalnızca Plugin'in etkinleştirilmesine, BlackHole'a, SoX'a, bir gerçek zamanlı transkripsiyon sağlayıcı anahtarına ve yapılandırılmış bir OpenClaw TTS sağlayıcısına ihtiyaç duyar. OpenAI varsayılan transkripsiyon sağlayıcısıdır; varsayılan ajan modu transkripsiyon sağlayıcısını değiştirmeden `bidi` modu için Google Gemini Live kullanmak üzere `realtime.voiceProvider` değerini `"google"` ve `realtime.model` değerini ayarlayın:

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
- `chrome.autoJoin: true`: `chrome-node` üzerinde OpenClaw tarayıcı otomasyonu aracılığıyla en iyi çabayla misafir adı doldurma ve Şimdi Katıl tıklaması
- `chrome.reuseExistingTab: true`: yinelenen sekmeler açmak yerine mevcut bir Meet sekmesini etkinleştir
- `chrome.waitForInCallMs: 20000`: konuşma geri bildirim girişinin tetiklenmesinden önce Meet sekmesinin çağrıda olduğunu bildirmesini bekle
- `chrome.audioFormat: "pcm16-24khz"`: komut çifti ses biçimi. `"g711-ulaw-8khz"` değerini yalnızca hâlâ telefon sesi yayan eski/özel komut çiftleri için kullanın.
- `chrome.audioBufferBytes: 4096`: oluşturulan Chrome komut çifti ses komutları için SoX işleme arabelleği. Bu, SoX'un varsayılan 8192 baytlık arabelleğinin yarısıdır; yoğun ana makinelerde yükseltme alanı bırakırken varsayılan boru gecikmesini azaltır. SoX minimumunun altındaki değerler 17 bayta sabitlenir.
- `chrome.audioInputCommand`: CoreAudio `BlackHole 2ch` üzerinden okuyup `chrome.audioFormat` içinde ses yazan SoX komutu
- `chrome.audioOutputCommand`: `chrome.audioFormat` içinde ses okuyup CoreAudio `BlackHole 2ch` üzerine yazan SoX komutu
- `chrome.bargeInInputCommand`: asistan oynatması etkin durumdayken insan araya girme algılaması için işaretli 16 bit little-endian mono PCM yazan isteğe bağlı yerel mikrofon komutu. Bu şu anda Gateway tarafından barındırılan `chrome` komut çifti köprüsü için geçerlidir.
- `chrome.bargeInRmsThreshold: 650`: `chrome.bargeInInputCommand` üzerinde insan kesintisi sayılan RMS düzeyi
- `chrome.bargeInPeakThreshold: 2500`: `chrome.bargeInInputCommand` üzerinde insan kesintisi sayılan tepe düzeyi
- `chrome.bargeInCooldownMs: 900`: tekrarlanan insan kesintisi temizlemeleri arasındaki minimum gecikme
- `mode: "agent"`: varsayılan konuşma geri bildirim modu. Katılımcı konuşması yapılandırılmış gerçek zamanlı transkripsiyon sağlayıcısı tarafından yazıya dökülür, toplantı başına alt ajan oturumunda yapılandırılmış OpenClaw ajanına gönderilir ve normal OpenClaw TTS çalışma zamanı üzerinden seslendirilir.
- `mode: "bidi"`: geri dönüş doğrudan çift yönlü gerçek zamanlı model modu. Gerçek zamanlı ses sağlayıcısı katılımcı konuşmasını doğrudan yanıtlar ve daha derin/araç destekli yanıtlar için `openclaw_agent_consult` çağırabilir.
- `mode: "transcribe"`: konuşma geri bildirim köprüsü olmayan yalnızca gözlem modu.
- `realtime.provider: "openai"`: aşağıdaki kapsamlı sağlayıcı alanları ayarlanmamışsa kullanılan uyumluluk geri dönüşü.
- `realtime.transcriptionProvider: "openai"`: gerçek zamanlı transkripsiyon için `agent` modu tarafından kullanılan sağlayıcı kimliği.
- `realtime.voiceProvider`: doğrudan gerçek zamanlı ses için `bidi` modu tarafından kullanılan sağlayıcı kimliği. Ajan modu transkripsiyonunu OpenAI üzerinde tutarken Gemini Live kullanmak için bunu `"google"` olarak ayarlayın.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: daha derin yanıtlar için `openclaw_agent_consult` ile kısa sözlü yanıtlar
- `realtime.introMessage`: gerçek zamanlı köprü bağlandığında kısa sözlü hazır olma denetimi; sessiz katılmak için bunu `""` olarak ayarlayın
- `realtime.agentId`: `openclaw_agent_consult` için isteğe bağlı OpenClaw ajan kimliği; varsayılan olarak `main`

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

Kalıcı Meet sesi `messages.tts.providers.elevenlabs.voiceId` kaynağından gelir. TTS model geçersiz kılmaları etkinleştirildiğinde ajan yanıtları yanıt başına `[[tts:voiceId=... model=eleven_v3]]` yönergelerini de kullanabilir, ancak yapılandırma toplantılar için deterministik varsayılandır. Katılımda günlükler `transcriptionProvider=elevenlabs` göstermelidir ve her sözlü yanıt `provider=elevenlabs model=eleven_v3 voice=<voiceId>` günlüğünü yazmalıdır.

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

`voiceCall.enabled` varsayılan olarak `true` olur; Twilio aktarımıyla gerçek PSTN çağrısını, DTMF'yi ve giriş selamlamasını Voice Call Plugin'e devreder. Voice Call, gerçek zamanlı medya akışını açmadan önce DTMF dizisini çalar, ardından kaydedilen giriş metnini ilk gerçek zamanlı selamlama olarak kullanır. `voice-call` etkin değilse Google Meet yine de arama planını doğrulayıp kaydedebilir, ancak Twilio çağrısını başlatamaz.

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

Chrome Gateway ana makinesinde çalıştığında `transport: "chrome"` kullanın. Chrome, Parallels VM gibi eşleştirilmiş bir node üzerinde çalıştığında `transport: "chrome-node"` kullanın. Her iki durumda da model sağlayıcıları ve `openclaw_agent_consult` Gateway ana makinesinde çalışır; bu yüzden model kimlik bilgileri orada kalır. Varsayılan `mode: "agent"` ile gerçek zamanlı transkripsiyon sağlayıcısı dinlemeyi işler, yapılandırılmış OpenClaw ajanı yanıtı üretir ve normal OpenClaw TTS bunu Meet'e seslendirir. Gerçek zamanlı ses modelinin doğrudan yanıtlamasını istediğinizde `mode: "bidi"` kullanın. Ham `mode: "realtime"` eski uyumluluk takma adı olarak `mode: "agent"` için kabul edilmeye devam eder, ancak artık ajan araç şemasında tanıtılmaz. Ajan modu günlükleri, köprü başlangıcında çözümlenen transkripsiyon sağlayıcısını/modelini ve her sentezlenmiş yanıttan sonra TTS sağlayıcısını, modelini, sesini, çıktı biçimini ve örnekleme hızını içerir.

Etkin oturumları listelemek veya bir oturum kimliğini incelemek için `action: "status"` kullanın. Gerçek zamanlı ajanın hemen konuşmasını sağlamak için `sessionId` ve `message` ile `action: "speak"` kullanın. Oturumu oluşturmak veya yeniden kullanmak, bilinen bir ifadeyi tetiklemek ve Chrome ana makinesi bunu bildirebildiğinde `inCall` sağlığını döndürmek için `action: "test_speech"` kullanın. `test_speech` her zaman `mode: "agent"` zorlar ve yalnızca gözlem oturumları bilerek konuşma yayamadığı için `mode: "transcribe"` içinde çalıştırılması istenirse başarısız olur. `speechOutputVerified` sonucu, bu test çağrısı sırasında gerçek zamanlı ses çıktı baytlarının artmasına dayanır; bu nedenle daha eski sese sahip yeniden kullanılan bir oturum yeni ve başarılı bir konuşma denetimi sayılmaz. Bir oturumu sonlanmış olarak işaretlemek için `action: "leave"` kullanın.

`status` kullanılabilir olduğunda Chrome sağlığını içerir:

- `inCall`: Chrome Meet çağrısının içinde görünüyor
- `micMuted`: en iyi çabayla Meet mikrofon durumu
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: konuşmanın çalışabilmesi için tarayıcı profilinin manuel oturum açma, Meet sahibi kabulü, izinler veya tarayıcı denetimi onarımına ihtiyacı var
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: yönetilen Chrome konuşmasına şu anda izin verilip verilmediği. `speechReady: false`, OpenClaw'un giriş/test ifadesini ses köprüsüne göndermediği anlamına gelir.
- `providerConnected` / `realtimeReady`: gerçek zamanlı ses köprüsü durumu
- `lastInputAt` / `lastOutputAt`: köprüden görülen veya köprüye gönderilen son ses
- `audioOutputRouted` / `audioOutputDeviceLabel`: Meet sekmesinin medya çıktısının köprü tarafından kullanılan BlackHole cihazına etkin şekilde yönlendirilip yönlendirilmediği
- `lastSuppressedInputAt` / `suppressedInputBytes`: asistan oynatması etkin durumdayken yok sayılan loopback girdisi

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Ajan ve bidi modları

Chrome `agent` modu, "ajanım toplantıda" davranışı için optimize edilmiştir. Gerçek zamanlı transkripsiyon sağlayıcısı toplantı sesini duyar, nihai katılımcı transkriptleri yapılandırılmış OpenClaw ajanı üzerinden yönlendirilir ve yanıt normal OpenClaw TTS çalışma zamanı üzerinden seslendirilir. Gerçek zamanlı ses modelinin doğrudan yanıtlamasını istediğinizde `mode: "bidi"` ayarlayın. Yakın nihai transkript parçaları danışmadan önce birleştirilir; böylece tek bir sözlü sıra birkaç eski kısmi yanıt üretmez. Sıraya alınmış asistan sesi hâlâ çalarken gerçek zamanlı girdi de bastırılır ve ajan danışmasından önce yakın zamandaki asistan benzeri transkript yankıları yok sayılır; böylece BlackHole loopback ajanın kendi konuşmasına yanıt vermesine neden olmaz.

| Mod     | Yanıta kim karar verir          | Konuşma çıktı yolu                     | Ne zaman kullanılır                                      |
| ------- | ------------------------------- | -------------------------------------- | -------------------------------------------------------- |
| `agent` | Yapılandırılmış OpenClaw ajanı  | Normal OpenClaw TTS çalışma zamanı     | "ajanım toplantıda" davranışı istediğinizde              |
| `bidi`  | Gerçek zamanlı ses modeli       | Gerçek zamanlı ses sağlayıcısı yanıtı  | En düşük gecikmeli konuşmalı ses döngüsünü istediğinizde |

`bidi` modunda, gerçek zamanlı model daha derin akıl yürütmeye, güncel bilgilere veya normal OpenClaw araçlarına ihtiyaç duyduğunda `openclaw_agent_consult` çağırabilir.

Consult aracı, arka planda son toplantı dökümü bağlamıyla normal OpenClaw ajanını çalıştırır ve kısa, sözlü bir yanıt döndürür. `agent` modunda OpenClaw bu yanıtı doğrudan TTS çalışma zamanına gönderir; `bidi` modunda ise gerçek zamanlı ses modeli consult sonucunu toplantıya sesli olarak geri aktarabilir. Sesli Arama ile aynı paylaşılan consult mekanizmasını kullanır.

Varsayılan olarak consult çağrıları `main` ajanına karşı çalışır. Bir Meet hattının ayrılmış bir OpenClaw ajan çalışma alanına, model varsayılanlarına, araç politikasına, belleğe ve oturum geçmişine danışması gerektiğinde `realtime.agentId` ayarlayın.

Ajan modundaki consult çağrıları, takip sorularının yapılandırılan ajandan normal ajan politikasını devralırken toplantı bağlamını koruyabilmesi için toplantı başına `agent:<id>:subagent:google-meet:<session>` oturum anahtarı kullanır.

`realtime.toolPolicy`, consult çalışmasını denetler:

- `safe-read-only`: consult aracını açığa çıkarır ve normal ajanı `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` ve `memory_get` ile sınırlar.
- `owner`: consult aracını açığa çıkarır ve normal ajanın olağan ajan araç politikasını kullanmasına izin verir.
- `none`: consult aracını gerçek zamanlı ses modeline açığa çıkarmaz.

Consult oturum anahtarı her Meet oturumu için kapsamlanır; böylece takip consult çağrıları aynı toplantı sırasında önceki consult bağlamını yeniden kullanabilir.

Chrome çağrıya tamamen katıldıktan sonra sesli bir hazır olma denetimini zorlamak için:

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
- Varsayılan taşıma Chrome-node olduğunda veya bir node sabitlendiğinde `googlemeet setup`, `chrome-node-connected` içerir.
- `nodes status`, seçilen node’un bağlı olduğunu gösterir.
- Seçilen node hem `googlemeet.chrome` hem de `browser.proxy` duyurur.
- Meet sekmesi çağrıya katılır ve `test-speech`, `inCall: true` ile Chrome sağlık durumunu döndürür.

Parallels macOS VM gibi uzak bir Chrome sunucusu için, Gateway veya VM güncellendikten sonra en kısa güvenli denetim şudur:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Bu, bir ajan gerçek bir toplantı sekmesi açmadan önce Gateway Plugin’inin yüklendiğini, VM node’unun geçerli token ile bağlı olduğunu ve Meet ses köprüsünün kullanılabilir olduğunu kanıtlar.

Twilio duman testi için telefonla arama bilgilerini gösteren bir toplantı kullanın:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Beklenen Twilio durumu:

- `googlemeet setup`, yeşil `twilio-voice-call-plugin`, `twilio-voice-call-credentials` ve `twilio-voice-call-webhook` denetimlerini içerir.
- Gateway yeniden yüklendikten sonra CLI içinde `voicecall` kullanılabilir.
- Döndürülen oturumda `transport: "twilio"` ve `twilio.voiceCallId` vardır.
- `openclaw logs --follow`, gerçek zamanlı TwiML’den önce DTMF TwiML’in sunulduğunu ve ardından ilk karşılama sıraya alınmış şekilde gerçek zamanlı köprüyü gösterir.
- `googlemeet leave <sessionId>`, devredilen sesli aramayı kapatır.

## Sorun giderme

### Ajan Google Meet aracını göremiyor

Plugin’in Gateway yapılandırmasında etkin olduğunu doğrulayın ve Gateway’i yeniden yükleyin:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

`plugins.entries.google-meet` üzerinde yeni düzenleme yaptıysanız Gateway’i yeniden başlatın veya yeniden yükleyin. Çalışan ajan yalnızca geçerli Gateway süreci tarafından kaydedilmiş Plugin araçlarını görür.

macOS olmayan Gateway sunucularında ajana dönük `google_meet` aracı görünür kalır, ancak yerel Chrome konuşarak yanıt verme eylemleri ses köprüsüne ulaşmadan önce engellenir. Yerel Chrome konuşarak yanıt sesi şu anda macOS `BlackHole 2ch` bağımlılığına sahiptir; bu nedenle Linux ajanları varsayılan yerel Chrome ajan yolu yerine `mode: "transcribe"`, Twilio telefonla arama veya bir macOS `chrome-node` sunucusu kullanmalıdır.

### Bağlı Google Meet uyumlu node yok

Node sunucusunda şunu çalıştırın:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway sunucusunda node’u onaylayın ve komutları doğrulayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node bağlı olmalı ve `googlemeet.chrome` ile `browser.proxy` listelemelidir. Gateway yapılandırması bu node komutlarına izin vermelidir:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup`, `chrome-node-connected` denetiminde başarısız olursa veya Gateway günlüğü `gateway token mismatch` bildirirse node’u geçerli Gateway token ile yeniden kurun ya da yeniden başlatın. LAN Gateway için bu genellikle şu anlama gelir:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Ardından node hizmetini yeniden yükleyin ve tekrar çalıştırın:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Tarayıcı açılıyor ama ajan katılamıyor

Yalnızca gözlem katılımları için `googlemeet test-listen`, gerçek zamanlı katılımlar için `googlemeet test-speech` çalıştırın; ardından döndürülen Chrome sağlık durumunu inceleyin. Problardan biri `manualActionRequired: true` bildirirse operatöre `manualActionMessage` gösterin ve tarayıcı eylemi tamamlanana kadar yeniden denemeyi bırakın.

Yaygın manuel eylemler:

- Chrome profiline giriş yapın.
- Meet sunucu hesabından misafiri kabul edin.
- Chrome’un yerel izin istemi göründüğünde Chrome mikrofon/kamera izinlerini verin.
- Takılı kalan bir Meet izin iletişim kutusunu kapatın veya onarın.

Meet yalnızca "Do you want people to hear you in the meeting?" gösteriyor diye "oturum açılmamış" bildirmeyin. Bu, Meet’in ses seçimi ara ekranıdır; OpenClaw mümkün olduğunda tarayıcı otomasyonu aracılığıyla **Use microphone** öğesine tıklar ve gerçek toplantı durumunu beklemeye devam eder. Yalnızca oluşturma amaçlı tarayıcı yedeği için OpenClaw **Continue without microphone** öğesine tıklayabilir çünkü URL oluşturma gerçek zamanlı ses yoluna ihtiyaç duymaz.

### Toplantı oluşturma başarısız oluyor

`googlemeet create`, OAuth kimlik bilgileri yapılandırıldığında önce Google Meet API `spaces.create` uç noktasını kullanır. OAuth kimlik bilgileri yoksa sabitlenmiş Chrome node tarayıcısına geri döner. Şunları doğrulayın:

- API oluşturma için: `oauth.clientId` ve `oauth.refreshToken` yapılandırılmıştır veya eşleşen `OPENCLAW_GOOGLE_MEET_*` ortam değişkenleri vardır.
- API oluşturma için: yenileme token’ı oluşturma desteği eklendikten sonra üretilmiştir. Eski token’larda `meetings.space.created` kapsamı eksik olabilir; `openclaw googlemeet auth login --json` komutunu yeniden çalıştırın ve Plugin yapılandırmasını güncelleyin.
- Tarayıcı yedeği için: `defaultTransport: "chrome-node"` ve `chromeNode.node`, `browser.proxy` ve `googlemeet.chrome` olan bağlı bir node’u gösterir.
- Tarayıcı yedeği için: o node’daki OpenClaw Chrome profili Google’da oturum açmıştır ve `https://meet.google.com/new` açabilir.
- Tarayıcı yedeği için: yeniden denemeler yeni bir sekme açmadan önce mevcut bir `https://meet.google.com/new` veya Google hesabı istemi sekmesini yeniden kullanır. Bir ajan zaman aşımına uğrarsa başka bir Meet sekmesini manuel açmak yerine araç çağrısını yeniden deneyin.
- Tarayıcı yedeği için: araç `manualActionRequired: true` döndürürse operatöre yol göstermek için döndürülen `browser.nodeId`, `browser.targetId`, `browserUrl` ve `manualActionMessage` değerlerini kullanın. Bu eylem tamamlanana kadar döngü halinde yeniden denemeyin.
- Tarayıcı yedeği için: Meet "Do you want people to hear you in the meeting?" gösterirse sekmeyi açık bırakın. OpenClaw, tarayıcı otomasyonu aracılığıyla **Use microphone** ya da yalnızca oluşturma yedeği için **Continue without microphone** öğesine tıklamalı ve oluşturulan Meet URL’sini beklemeye devam etmelidir. Bunu yapamazsa hata `google-login-required` değil, `meet-audio-choice-required` belirtmelidir.

### Ajan katılıyor ama konuşmuyor

Gerçek zamanlı yolu denetleyin:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Normal STT -> OpenClaw ajanı -> TTS konuşarak yanıt yolu için `mode: "agent"` kullanın veya doğrudan gerçek zamanlı ses yedeği için `mode: "bidi"` kullanın. `mode: "transcribe"` bilerek konuşarak yanıt köprüsünü başlatmaz. Yalnızca gözlem hata ayıklaması için katılımcılar konuştuktan sonra `openclaw googlemeet status --json <session-id>` çalıştırın ve `captioning`, `transcriptLines` ile `lastCaptionText` denetleyin. `inCall` true ancak `transcriptLines` `0` olarak kalıyorsa Meet altyazıları devre dışı olabilir, gözlemci kurulduğundan beri kimse konuşmamış olabilir, Meet kullanıcı arayüzü değişmiş olabilir veya toplantı dili/hesabı için canlı altyazılar kullanılamıyor olabilir.

`googlemeet test-speech` her zaman gerçek zamanlı yolu denetler ve o çağrı için köprü çıktı baytlarının gözlenip gözlenmediğini bildirir. `speechOutputVerified` false ve `speechOutputTimedOut` true ise gerçek zamanlı sağlayıcı sözceyi kabul etmiş olabilir, ancak OpenClaw yeni çıktı baytlarının Chrome ses köprüsüne ulaştığını görmemiştir.

Ayrıca şunları doğrulayın:

- Gateway sunucusunda `OPENAI_API_KEY` veya `GEMINI_API_KEY` gibi bir gerçek zamanlı sağlayıcı anahtarı kullanılabilir.
- Chrome sunucusunda `BlackHole 2ch` görünür.
- Chrome sunucusunda `sox` vardır.
- Meet mikrofonu ve hoparlörü OpenClaw tarafından kullanılan sanal ses yolundan yönlendirilir. Yerel Chrome gerçek zamanlı katılımları için `doctor`, `meet output routed: yes` göstermelidir.

`googlemeet doctor [session-id]`; oturumu, node’u, çağrı içi durumu, manuel eylem nedenini, gerçek zamanlı sağlayıcı bağlantısını, `realtimeReady` durumunu, ses giriş/çıkış etkinliğini, son ses zaman damgalarını, bayt sayaçlarını ve tarayıcı URL’sini yazdırır. Ham JSON gerektiğinde `googlemeet status [session-id] --json` kullanın. Token’ları açığa çıkarmadan Google Meet OAuth yenilemesini doğrulamanız gerektiğinde `googlemeet doctor --oauth` kullanın; ayrıca Google Meet API kanıtı gerektiğinde `--meeting` veya `--create-space` ekleyin.

Bir ajan zaman aşımına uğradıysa ve zaten açık bir Meet sekmesi görebiliyorsanız başka bir sekme açmadan o sekmeyi inceleyin:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Eşdeğer araç eylemi `recover_current_tab` şeklindedir. Seçilen taşıma için mevcut bir Meet sekmesine odaklanır ve onu inceler. `chrome` ile Gateway üzerinden yerel tarayıcı kontrolünü kullanır; `chrome-node` ile yapılandırılmış Chrome node’unu kullanır. Yeni bir sekme açmaz veya yeni bir oturum oluşturmaz; giriş, kabul, izinler ya da ses seçimi durumu gibi mevcut engelleyiciyi bildirir. CLI komutu yapılandırılmış Gateway ile konuşur, bu yüzden Gateway çalışıyor olmalıdır; `chrome-node` ayrıca Chrome node’unun bağlı olmasını gerektirir.

### Twilio kurulum denetimleri başarısız oluyor

`voice-call` izinli veya etkin olmadığında `twilio-voice-call-plugin` başarısız olur. Bunu `plugins.allow` içine ekleyin, `plugins.entries.voice-call` etkinleştirin ve Gateway’i yeniden yükleyin.

Twilio arka ucunda hesap SID’si, auth token veya arayan numara eksik olduğunda `twilio-voice-call-credentials` başarısız olur. Bunları Gateway sunucusunda ayarlayın:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call` için genel Webhook erişimi olmadığında veya `publicUrl` local loopback ya da özel ağ alanını gösterdiğinde `twilio-voice-call-webhook` başarısız olur. `plugins.entries.voice-call.config.publicUrl` değerini genel sağlayıcı URL’sine ayarlayın veya bir `voice-call` tüneli/Tailscale erişimi yapılandırın.

Loopback ve özel URL’ler operatör geri çağrıları için geçerli değildir. `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` veya `fd00::/8` değerlerini `publicUrl` olarak kullanmayın.

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

Yerel geliştirme için özel bir ana makine URL'si yerine bir tünel veya Tailscale
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

`voicecall smoke` varsayılan olarak yalnızca hazır olma durumunu denetler. Belirli bir numara için deneme çalıştırması yapmak üzere:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Yalnızca bilinçli olarak canlı bir giden bildirim araması yapmak istediğinizde
`--yes` ekleyin:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio araması başlıyor ancak toplantıya hiç girmiyor

Meet etkinliğinin telefonla arama ayrıntılarını gösterdiğini doğrulayın. Tam arama
numarasını ve PIN'i ya da özel bir DTMF dizisini iletin:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Sağlayıcının PIN'i girmeden önce duraklamaya ihtiyacı varsa `--dtmf-sequence`
içinde başta `w` veya virgüller kullanın.

Telefon araması oluşturuluyor ancak Meet katılımcı listesi telefonla bağlanan
katılımcıyı hiç göstermiyorsa:

- Devredilen Twilio çağrı kimliğini, DTMF'nin kuyruğa alınıp alınmadığını ve giriş selamlamasının istenip istenmediğini doğrulamak için `openclaw googlemeet doctor <session-id>` komutunu çalıştırın.
- `openclaw voicecall status --call-id <id>` komutunu çalıştırın ve aramanın hâlâ
  etkin olduğunu doğrulayın.
- `openclaw voicecall tail` komutunu çalıştırın ve Twilio webhook'larının
  Gateway'e ulaştığını kontrol edin.
- `openclaw logs --follow` komutunu çalıştırın ve Twilio Meet sırasını arayın: Google
  Meet katılımı devreder, Voice Call bağlanma öncesi DTMF TwiML'ini saklar ve sunar,
  Voice Call Twilio araması için gerçek zamanlı TwiML sunar, ardından Google Meet
  `voicecall.speak` ile giriş konuşması ister.
- `openclaw googlemeet setup --transport twilio` komutunu yeniden çalıştırın; yeşil bir kurulum kontrolü gerekir ancak toplantı PIN dizisinin doğru olduğunu kanıtlamaz.
- Arama numarasının PIN ile aynı Meet davetine ve bölgesine ait olduğunu doğrulayın.
- Meet yavaş yanıt veriyorsa veya arama dökümü, bağlanma öncesi DTMF gönderildikten sonra hâlâ PIN isteyen istemi gösteriyorsa `voiceCall.dtmfDelayMs` değerini varsayılan 12 saniyeden artırın.
- Katılımcı katılıyor ancak selamlamayı duymuyorsanız, DTMF sonrası `voicecall.speak` isteği ve medya akışı TTS oynatımı ya da Twilio `<Say>` yedek yolu için `openclaw logs --follow` komutunu kontrol edin. Arama dökümünde hâlâ "enter the meeting PIN" ifadesi bulunuyorsa telefon bacağı henüz Meet odasına katılmamıştır, bu nedenle toplantı katılımcıları konuşmayı duymayacaktır.

Webhook'lar ulaşmıyorsa önce Voice Call Plugin'inde hata ayıklayın: sağlayıcı
`plugins.entries.voice-call.config.publicUrl` değerine veya yapılandırılmış tünele
erişebilmelidir. Bkz. [Sesli arama sorun giderme](/tr/plugins/voice-call#troubleshooting).

## Notlar

Google Meet'in resmi medya API'si alma odaklıdır, bu nedenle bir Meet aramasında
konuşmak hâlâ bir katılımcı yolu gerektirir. Bu Plugin bu sınırı görünür tutar:
Chrome tarayıcı katılımını ve yerel ses yönlendirmesini yönetir; Twilio telefonla
arama katılımını yönetir.

Chrome konuşma geri bildirim modları `BlackHole 2ch` ve ayrıca şunlardan birini gerektirir:

- `chrome.audioInputCommand` ve `chrome.audioOutputCommand`: OpenClaw köprünün sahibidir ve bu komutlarla seçilen sağlayıcı arasında `chrome.audioFormat` içinde ses aktarır. Agent modu gerçek zamanlı transkripsiyon ve normal TTS kullanır; bidi modu gerçek zamanlı ses sağlayıcısını kullanır. Varsayılan Chrome yolu, `chrome.audioBufferBytes: 4096` ile 24 kHz PCM16'dır; 8 kHz G.711 mu-law eski komut çiftleri için kullanılabilir kalır.
- `chrome.audioBridgeCommand`: harici bir köprü komutu tüm yerel ses yolunun sahibidir ve daemon'unu başlattıktan veya doğruladıktan sonra çıkmalıdır. Bu yalnızca `bidi` için geçerlidir çünkü `agent` modu TTS için doğrudan komut çifti erişimine ihtiyaç duyar.

Bir agent, agent modunda `google_meet` aracını çağırdığında toplantı danışmanı
oturumu, katılımcı konuşmasını yanıtlamadan önce çağıranın mevcut dökümünü çatallar.
Meet oturumu yine ayrı kalır (`agent:<agentId>:subagent:google-meet:<sessionId>`),
böylece toplantı devam yanıtları çağıran dökümünü doğrudan değiştirmez.

Temiz çift yönlü ses için Meet çıkışını ve Meet mikrofonunu ayrı sanal aygıtlar
veya Loopback tarzı bir sanal aygıt grafiği üzerinden yönlendirin. Tek bir paylaşılan
BlackHole aygıtı, diğer katılımcıları aramaya geri yansıtabilir.

Komut çifti Chrome köprüsüyle `chrome.bargeInInputCommand` ayrı bir yerel
mikrofonu dinleyebilir ve insan konuşmaya başladığında asistan oynatımını temizleyebilir.
Bu, asistan oynatımı sırasında paylaşılan BlackHole loopback girişi geçici olarak
bastırılsa bile insan konuşmasını asistan çıkışının önünde tutar. `chrome.audioInputCommand`
ve `chrome.audioOutputCommand` gibi bu da operatör tarafından yapılandırılan yerel
bir komuttur. Açıkça güvenilir bir komut yolu veya argüman listesi kullanın ve bunu
güvenilmeyen konumlardaki betiklere yönlendirmeyin.

`googlemeet speak`, bir Chrome oturumu için etkin konuşma geri bildirim ses köprüsünü
tetikler. `googlemeet leave` bu köprüyü durdurur. Voice Call Plugin'i üzerinden
devredilen Twilio oturumlarında `leave` alttaki sesli aramayı da kapatır. API tarafından
yönetilen bir alan için etkin Google Meet konferansını da kapatmak istediğinizde
`googlemeet end-active-conference` kullanın.

## İlgili

- [Voice Call Plugin](/tr/plugins/voice-call)
- [Konuşma modu](/tr/nodes/talk)
- [Plugin oluşturma](/tr/plugins/building-plugins)
