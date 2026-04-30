---
read_when:
    - Bir OpenClaw ajanının bir Google Meet görüşmesine katılmasını istiyorsunuz
    - Bir OpenClaw ajanının yeni bir Google Meet araması oluşturmasını istiyorsunuz
    - Chrome, Chrome düğümü veya Twilio'yu Google Meet taşıması olarak yapılandırıyorsunuz
summary: 'Google Meet Plugin: belirtilen Meet URL''lerine Chrome veya Twilio üzerinden gerçek zamanlı ses varsayılanlarıyla katıl'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-04-30T09:34:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b989c872fee0dca31680f67559cd26b715303f7c6f4eeda51fc63889bb0383c
    source_path: plugins/google-meet.md
    workflow: 16
---

OpenClaw için Google Meet katılımcı desteği — Plugin tasarım gereği açıktır:

- Yalnızca açık bir `https://meet.google.com/...` URL'sine katılır.
- Google Meet API üzerinden yeni bir Meet alanı oluşturabilir, ardından döndürülen URL'ye katılabilir.
- `realtime` ses varsayılan moddur.
- Gerçek zamanlı ses, daha derin akıl yürütme veya araçlar gerektiğinde tam OpenClaw ajanına geri çağrı yapabilir.
- Ajanlar katılma davranışını `mode` ile seçer: canlı dinleme/yanıt verme için `realtime`, tarayıcıyı gerçek zamanlı ses köprüsü olmadan katmak/kontrol etmek için `transcribe` kullanın.
- Kimlik doğrulama kişisel Google OAuth veya zaten oturum açılmış bir Chrome profili olarak başlar.
- Otomatik onay duyurusu yoktur.
- Varsayılan Chrome ses arka ucu `BlackHole 2ch`'dir.
- Chrome yerel olarak veya eşleştirilmiş bir Node ana bilgisayarında çalışabilir.
- Twilio, isteğe bağlı PIN veya DTMF dizisiyle birlikte bir arama numarasını kabul eder.
- CLI komutu `googlemeet`'tir; `meet` daha geniş ajan telekonferans iş akışları için ayrılmıştır.

## Hızlı başlangıç

Yerel ses bağımlılıklarını yükleyin ve bir arka uç gerçek zamanlı ses sağlayıcısı yapılandırın. OpenAI varsayılandır; Google Gemini Live da `realtime.provider: "google"` ile çalışır:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch`, `BlackHole 2ch` sanal ses aygıtını yükler. Homebrew yükleyicisi, macOS aygıtı görünür hale getirmeden önce yeniden başlatma gerektirir:

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

Kurulum çıktısı ajan tarafından okunabilir ve moda duyarlı olacak şekilde tasarlanmıştır. Chrome profilini, Node sabitlemesini ve gerçek zamanlı Chrome katılımları için BlackHole/SoX ses köprüsünü ve gecikmeli gerçek zamanlı giriş kontrollerini bildirir. Yalnızca gözlem katılımları için aynı aktarımı `--mode transcribe` ile kontrol edin; bu mod gerçek zamanlı ses önkoşullarını atlar çünkü köprü üzerinden dinlemez veya konuşmaz:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Twilio yetkilendirmesi yapılandırıldığında kurulum ayrıca `voice-call` Plugin'inin ve Twilio kimlik bilgilerinin hazır olup olmadığını bildirir. Bir ajandan katılmasını istemeden önce herhangi bir `ok: false` kontrolünü, kontrol edilen aktarım ve mod için engelleyici olarak değerlendirin. Betikler veya makine tarafından okunabilir çıktı için `openclaw googlemeet setup --json` kullanın. Ajan denemeden önce belirli bir aktarımı önceden denetlemek için `--transport chrome`, `--transport chrome-node` veya `--transport twilio` kullanın.

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
  "mode": "realtime"
}
```

Yeni bir toplantı oluşturun ve katılın:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Katılmadan yalnızca URL'yi oluşturun:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` iki yola sahiptir:

- API oluşturma: Google Meet OAuth kimlik bilgileri yapılandırıldığında kullanılır. Bu en belirleyici yoldur ve tarayıcı arayüz durumuna bağlı değildir.
- Tarayıcı geri dönüşü: OAuth kimlik bilgileri yokken kullanılır. OpenClaw sabitlenmiş Chrome Node'unu kullanır, `https://meet.google.com/new` adresini açar, Google'ın gerçek bir toplantı kodu URL'sine yönlendirmesini bekler, ardından bu URL'yi döndürür. Bu yol, Node üzerindeki OpenClaw Chrome profilinin Google'da zaten oturum açmış olmasını gerektirir. Tarayıcı otomasyonu Meet'in kendi ilk çalıştırma mikrofon istemini işler; bu istem Google oturum açma hatası olarak değerlendirilmez.
  Katılma ve oluşturma akışları ayrıca yeni bir sekme açmadan önce mevcut bir Meet sekmesini yeniden kullanmayı dener. Eşleştirme `authuser` gibi zararsız URL sorgu dizelerini yok sayar, bu nedenle bir ajan yeniden denemesi ikinci bir Chrome sekmesi oluşturmak yerine zaten açık olan toplantıya odaklanmalıdır.

Komut/araç çıktısı bir `source` alanı (`api` veya `browser`) içerir, böylece ajanlar hangi yolun kullanıldığını açıklayabilir. `create` varsayılan olarak yeni toplantıya katılır ve `joined: true` ile katılım oturumunu döndürür. Yalnızca URL üretmek için CLI'da `create --no-join` kullanın veya araca `"join": false` geçirin.

Veya bir ajana şunu söyleyin: "Bir Google Meet oluştur, gerçek zamanlı sesle katıl ve bağlantıyı bana gönder." Ajan `action: "create"` ile `google_meet` çağırmalı ve ardından döndürülen `meetingUri` değerini paylaşmalıdır.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Yalnızca gözlem/tarayıcı kontrolü katılımı için `"mode": "transcribe"` ayarlayın. Bu, çift yönlü gerçek zamanlı model köprüsünü başlatmaz, BlackHole veya SoX gerektirmez ve toplantıya yanıt olarak konuşmaz. Bu moddaki Chrome katılımları ayrıca OpenClaw'ın mikrofon/kamera izin verme işlemini ve Meet **Mikrofonu kullan** yolunu önler. Meet bir ses seçimi ara ekranı gösterirse otomasyon mikrofonsuz yolu dener ve aksi durumda yerel mikrofonu açmak yerine manuel bir eylem bildirir.

Gerçek zamanlı oturumlar sırasında `google_meet` durumu `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, son giriş/çıkış zaman damgaları, bayt sayaçları ve köprü kapalı durumu gibi tarayıcı ve ses köprüsü sağlığını içerir. Güvenli bir Meet sayfa istemi görünürse tarayıcı otomasyonu mümkün olduğunda bunu işler. Oturum açma, ev sahibi kabulü ve tarayıcı/OS izin istemleri, ajanın iletmesi için bir neden ve mesajla manuel eylem olarak bildirilir. Yönetilen Chrome oturumları, giriş veya test ifadesini yalnızca tarayıcı sağlığı `inCall: true` bildirdikten sonra yayar; aksi durumda durum `speechReady: false` bildirir ve konuşma denemesi, ajanın toplantıda konuşmuş gibi davranmak yerine engellenir.

Yerel Chrome, oturum açılmış OpenClaw tarayıcı profili üzerinden katılır. Gerçek zamanlı mod, OpenClaw tarafından kullanılan mikrofon/hoparlör yolu için `BlackHole 2ch` gerektirir. Temiz çift yönlü ses için ayrı sanal aygıtlar veya Loopback tarzı bir grafik kullanın; tek bir BlackHole aygıtı ilk duman testi için yeterlidir ancak yankı yapabilir.

### Yerel Gateway + Parallels Chrome

VM'nin Chrome'a sahip olması için macOS VM içinde tam bir OpenClaw Gateway veya model API anahtarı gerekmez. Gateway'i ve ajanı yerel olarak çalıştırın, ardından VM'de bir Node ana bilgisayarı çalıştırın. Node'un Chrome komutunu duyurması için paketle gelen Plugin'i VM'de bir kez etkinleştirin:

Nerede ne çalışır:

- Gateway ana bilgisayarı: OpenClaw Gateway, ajan çalışma alanı, model/API anahtarları, gerçek zamanlı sağlayıcı ve Google Meet Plugin yapılandırması.
- Parallels macOS VM: OpenClaw CLI/Node ana bilgisayarı, Google Chrome, SoX, BlackHole 2ch ve Google'da oturum açmış bir Chrome profili.
- VM'de gerekli olmayanlar: Gateway hizmeti, ajan yapılandırması, OpenAI/GPT anahtarı veya model sağlayıcı kurulumu.

VM bağımlılıklarını yükleyin:

```bash
brew install blackhole-2ch sox
```

BlackHole'u yükledikten sonra macOS'in `BlackHole 2ch` aygıtını görünür hale getirmesi için VM'yi yeniden başlatın:

```bash
sudo reboot
```

Yeniden başlattıktan sonra VM'nin ses aygıtını ve SoX komutlarını görebildiğini doğrulayın:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

VM'de OpenClaw'ı yükleyin veya güncelleyin, ardından paketle gelen Plugin'i orada etkinleştirin:

```bash
openclaw plugins enable google-meet
```

VM'de Node ana bilgisayarını başlatın:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` bir LAN IP'siyse ve TLS kullanmıyorsanız, Node bu güvenilen özel ağ için açıkça izin vermediğiniz sürece düz metin WebSocket'i reddeder:

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

Node'u Gateway ana bilgisayarından onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway'in Node'u gördüğünü ve hem `googlemeet.chrome` hem de tarayıcı yeteneği/`browser.proxy` duyurduğunu doğrulayın:

```bash
openclaw nodes status
```

Meet'i Gateway ana bilgisayarında bu Node üzerinden yönlendirin:

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

Şimdi Gateway ana bilgisayarından normal şekilde katılın:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

veya ajandan `transport: "chrome-node"` ile `google_meet` aracını kullanmasını isteyin.

Bir oturum oluşturan veya yeniden kullanan, bilinen bir ifadeyi söyleyen ve oturum sağlığını yazdıran tek komutluk duman testi için:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Gerçek zamanlı katılım sırasında OpenClaw tarayıcı otomasyonu konuk adını doldurur, Katıl/Katılmayı iste'ye tıklar ve bu istem göründüğünde Meet'in ilk çalıştırma "Mikrofonu kullan" seçimini kabul eder. Yalnızca gözlem katılımı veya yalnızca tarayıcıyla toplantı oluşturma sırasında, bu seçenek mevcut olduğunda aynı istemden mikrofonsuz devam eder. Tarayıcı profili oturum açmamışsa, Meet ev sahibi kabulünü bekliyorsa, Chrome gerçek zamanlı katılım için mikrofon/kamera iznine ihtiyaç duyuyorsa veya Meet otomasyonun çözemediği bir istemde takılmışsa, katılma/test-speech sonucu `manualActionRequired: true` ile `manualActionReason` ve `manualActionMessage` bildirir. Ajanlar katılmayı yeniden denemeyi bırakmalı, tam olarak bu mesajı mevcut `browserUrl`/`browserTitle` ile birlikte bildirmeli ve yalnızca manuel tarayıcı eylemi tamamlandıktan sonra yeniden denemelidir.

`chromeNode.node` atlanırsa OpenClaw yalnızca tam olarak bir bağlı Node hem `googlemeet.chrome` hem de tarayıcı kontrolünü duyurduğunda otomatik seçim yapar. Birkaç uygun Node bağlıysa `chromeNode.node` değerini Node kimliğine, görünen ada veya uzak IP'ye ayarlayın.

Yaygın hata kontrolleri:

- `Configured Google Meet node ... is not usable: offline`: sabitlenmiş Node,
  Gateway tarafından biliniyor ancak kullanılamıyor. Agent’lar bu Node’u
  kullanılabilir bir Chrome ana makinesi olarak değil tanılama durumu olarak ele
  almalı ve kullanıcı bunu istemedikçe başka bir taşıma yöntemine geri dönmek
  yerine kurulum engelleyicisini bildirmelidir.
- `No connected Google Meet-capable node`: VM içinde `openclaw node run`
  başlatın, eşleştirmeyi onaylayın ve VM içinde `openclaw plugins enable google-meet`
  ile `openclaw plugins enable browser` komutlarının çalıştırıldığından emin
  olun. Ayrıca Gateway ana makinesinin her iki Node komutuna şu ayarla izin
  verdiğini doğrulayın:
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: denetlenen ana makineye
  `blackhole-2ch` yükleyin ve yerel Chrome sesi kullanmadan önce yeniden
  başlatın.
- `BlackHole 2ch audio device not found on the node`: VM içine
  `blackhole-2ch` yükleyin ve VM’i yeniden başlatın.
- Chrome açılıyor ancak katılamıyorsa: VM içindeki tarayıcı profiline giriş
  yapın veya konuk katılımı için `chrome.guestName` ayarını koruyun. Konuk
  otomatik katılımı, Node tarayıcı proxy’si üzerinden OpenClaw tarayıcı
  otomasyonunu kullanır; Node tarayıcı yapılandırmasının istediğiniz profili
  gösterdiğinden emin olun, örneğin `browser.defaultProfile: "user"` veya adlı
  bir mevcut oturum profili.
- Yinelenen Meet sekmeleri: `chrome.reuseExistingTab: true` etkin bırakın.
  OpenClaw, yeni bir sekme açmadan önce aynı Meet URL’si için mevcut bir sekmeyi
  etkinleştirir ve tarayıcı toplantı oluşturma, başka bir sekme açmadan önce
  devam eden bir `https://meet.google.com/new` veya Google hesabı istemi
  sekmesini yeniden kullanır.
- Ses yok: Meet’te mikrofon/hoparlör yönlendirmesini OpenClaw tarafından
  kullanılan sanal ses aygıtı yolu üzerinden yapın; temiz çift yönlü ses için
  ayrı sanal aygıtlar veya Loopback tarzı yönlendirme kullanın.

## Kurulum notları

Chrome gerçek zamanlı varsayılanı iki harici araç kullanır:

- `sox`: komut satırı ses yardımcı aracı. Plugin, varsayılan 24 kHz PCM16 ses
  köprüsü için açık CoreAudio aygıt komutları kullanır.
- `blackhole-2ch`: macOS sanal ses sürücüsü. Chrome/Meet’in üzerinden
  yönlendirebileceği `BlackHole 2ch` ses aygıtını oluşturur.

OpenClaw bu paketlerden hiçbirini paketlemez veya yeniden dağıtmaz. Belgeler,
kullanıcılardan bunları Homebrew üzerinden ana makine bağımlılıkları olarak
yüklemelerini ister. SoX lisansı `LGPL-2.0-only AND GPL-2.0-only`; BlackHole ise
GPL-3.0 lisanslıdır. BlackHole’u OpenClaw ile paketleyen bir yükleyici veya
appliance oluşturursanız, BlackHole’un yukarı akış lisans koşullarını inceleyin
veya Existential Audio’dan ayrı bir lisans alın.

## Taşımalar

### Chrome

Chrome taşıması, OpenClaw tarayıcı denetimi üzerinden Meet URL’sini açar ve
oturum açmış OpenClaw tarayıcı profili olarak katılır. macOS’ta Plugin,
başlatmadan önce `BlackHole 2ch` denetimi yapar. Yapılandırılmışsa, Chrome’u
açmadan önce bir ses köprüsü sağlık komutu ve başlangıç komutu da çalıştırır.
Chrome/ses Gateway ana makinesinde çalışıyorsa `chrome`; Chrome/ses Parallels
macOS VM gibi eşleştirilmiş bir Node üzerinde çalışıyorsa `chrome-node`
kullanın. Yerel Chrome için profili `browser.defaultProfile` ile seçin;
`chrome.browserProfile`, `chrome-node` ana makinelerine aktarılır.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome mikrofon ve hoparlör sesini yerel OpenClaw ses köprüsü üzerinden
yönlendirin. `BlackHole 2ch` yüklü değilse katılım, ses yolu olmadan sessizce
katılmak yerine bir kurulum hatasıyla başarısız olur.

### Twilio

Twilio taşıması, Voice Call Plugin’e devredilen katı bir arama planıdır. Telefon
numaraları için Meet sayfalarını ayrıştırmaz.

Bunu, Chrome katılımı kullanılamadığında veya telefonla arama yedek yolu
istediğinizde kullanın. Google Meet, toplantı için telefonla arama numarası ve
PIN sunmalıdır; OpenClaw bunları Meet sayfasından keşfetmez.

Voice Call Plugin’i Chrome Node üzerinde değil, Gateway ana makinesinde
etkinleştirin:

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

`voice-call` etkinleştirildikten sonra Gateway’i yeniden başlatın veya yeniden
yükleyin; Plugin yapılandırma değişiklikleri, yeniden yüklenene kadar zaten
çalışan bir Gateway sürecinde görünmez.

Ardından doğrulayın:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio devri bağlandığında, `googlemeet setup` başarılı
`twilio-voice-call-plugin` ve `twilio-voice-call-credentials` denetimlerini
içerir.

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

## OAuth ve ön uç denetim

OAuth, Meet bağlantısı oluşturmak için isteğe bağlıdır çünkü `googlemeet create`
tarayıcı otomasyonuna geri dönebilir. Resmi API ile oluşturma, alan çözümleme
veya Meet Media API ön uç denetimleri istediğinizde OAuth yapılandırın.

Google Meet API erişimi kullanıcı OAuth’u kullanır: bir Google Cloud OAuth
istemcisi oluşturun, gerekli kapsamları isteyin, bir Google hesabını
yetkilendirin, ardından ortaya çıkan yenileme token’ını Google Meet Plugin
yapılandırmasında saklayın veya `OPENCLAW_GOOGLE_MEET_*` ortam değişkenlerini
sağlayın.

OAuth, Chrome katılım yolunun yerini almaz. Chrome ve Chrome-node taşımaları,
tarayıcı katılımı kullandığınızda hâlâ oturum açmış bir Chrome profili,
BlackHole/SoX ve bağlı bir Node üzerinden katılır. OAuth yalnızca resmi Google
Meet API yolu içindir: toplantı alanları oluşturma, alanları çözümleme ve Meet
Media API ön uç denetimlerini çalıştırma.

### Google kimlik bilgileri oluşturma

Google Cloud Console’da:

1. Bir Google Cloud projesi oluşturun veya seçin.
2. Bu proje için **Google Meet REST API**’yi etkinleştirin.
3. OAuth izin ekranını yapılandırın.
   - **Internal**, bir Google Workspace kuruluşu için en basit seçenektir.
   - **External**, kişisel/test kurulumları için çalışır; uygulama Testing
     durumundayken, uygulamayı yetkilendirecek her Google hesabını test
     kullanıcısı olarak ekleyin.
4. OpenClaw’un istediği kapsamları ekleyin:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Bir OAuth istemci kimliği oluşturun.
   - Uygulama türü: **Web application**.
   - Yetkilendirilmiş yönlendirme URI’si:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. İstemci kimliğini ve istemci gizli anahtarını kopyalayın.

`meetings.space.created`, Google Meet `spaces.create` tarafından gereklidir.
`meetings.space.readonly`, OpenClaw’un Meet URL’lerini/kodlarını alanlara
çözümlemesini sağlar. `meetings.conference.media.readonly`, Meet Media API ön
uç denetimi ve medya çalışmaları içindir; Google, gerçek Media API kullanımı
için Developer Preview kaydı gerektirebilir. Yalnızca tarayıcı tabanlı Chrome
katılımlarına ihtiyacınız varsa OAuth’u tamamen atlayın.

### Yenileme token’ını üretme

`oauth.clientId` ve isteğe bağlı olarak `oauth.clientSecret` yapılandırın veya
bunları ortam değişkenleri olarak geçirin, ardından şunu çalıştırın:

```bash
openclaw googlemeet auth login --json
```

Komut, yenileme token’ı içeren bir `oauth` yapılandırma bloğu yazdırır. PKCE,
`http://localhost:8085/oauth2callback` üzerinde localhost callback’i ve
`--manual` ile manuel kopyala/yapıştır akışı kullanır.

Örnekler:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Tarayıcı yerel callback’e ulaşamadığında manuel modu kullanın:

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

Yenileme token’ını yapılandırmada istemiyorsanız ortam değişkenlerini tercih
edin. Hem yapılandırma hem de ortam değerleri varsa, Plugin önce
yapılandırmayı, ardından ortam yedeğini çözümler.

OAuth izni Meet alanı oluşturma, Meet alanı okuma erişimi ve Meet konferans
medyası okuma erişimini içerir. Toplantı oluşturma desteği var olmadan önce
kimlik doğrulaması yaptıysanız, yenileme token’ının `meetings.space.created`
kapsamına sahip olması için `openclaw googlemeet auth login --json` komutunu
yeniden çalıştırın.

### OAuth’u doctor ile doğrulama

Hızlı, gizli bilgi içermeyen bir sağlık denetimi istediğinizde OAuth doctor’ı
çalıştırın:

```bash
openclaw googlemeet doctor --oauth --json
```

Bu, Chrome runtime’ını yüklemez veya bağlı bir Chrome Node gerektirmez. OAuth
yapılandırmasının var olduğunu ve yenileme token’ının bir erişim token’ı
üretebildiğini denetler. JSON raporu yalnızca `ok`, `configured`,
`tokenSource`, `expiresAt` ve denetim iletileri gibi durum alanlarını içerir;
erişim token’ını, yenileme token’ını veya istemci gizli anahtarını yazdırmaz.

Yaygın sonuçlar:

| Denetim             | Anlamı                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `oauth-config`      | `oauth.clientId` ile `oauth.refreshToken` veya önbelleğe alınmış erişim token’ı mevcut. |
| `oauth-token`       | Önbelleğe alınmış erişim token’ı hâlâ geçerli veya yenileme token’ı yeni bir erişim token’ı üretti. |
| `meet-spaces-get`   | İsteğe bağlı `--meeting` denetimi mevcut bir Meet alanını çözümledi.                    |
| `meet-spaces-create` | İsteğe bağlı `--create-space` denetimi yeni bir Meet alanı oluşturdu.                  |

Google Meet API etkinleştirmesini ve `spaces.create` kapsamını da kanıtlamak
için yan etkili oluşturma denetimini çalıştırın:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space`, atılabilir bir Meet URL’si oluşturur. Bunu, Google Cloud
projesinde Meet API’nin etkin olduğunu ve yetkilendirilmiş hesabın
`meetings.space.created` kapsamına sahip olduğunu doğrulamanız gerektiğinde
kullanın.

Mevcut bir toplantı alanı için okuma erişimini kanıtlamak için:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` ve `resolve-space`, yetkilendirilmiş Google hesabının
erişebildiği mevcut bir alana okuma erişimini kanıtlar. Bu denetimlerden gelen
bir `403` genellikle Google Meet REST API’nin devre dışı olduğu, izin verilen
yenileme token’ında gerekli kapsamın eksik olduğu veya Google hesabının ilgili
Meet alanına erişemediği anlamına gelir. Yenileme token’ı hatası, `openclaw
googlemeet auth login --json` komutunu yeniden çalıştırmanız ve yeni `oauth`
bloğunu saklamanız gerektiği anlamına gelir.

Tarayıcı yedeği için OAuth kimlik bilgileri gerekmez. Bu modda Google kimlik
doğrulaması OpenClaw yapılandırmasından değil, seçilen Node üzerindeki oturum
açmış Chrome profilinden gelir.

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

`--meeting` ile `artifacts` ve `attendance` varsayılan olarak en son konferans kaydını
kullanır. Bu toplantı için saklanan her kaydı istediğinizde `--all-conference-records`
iletin.

Takvim araması, Meet yapıtlarını okumadan önce toplantı URL'sini Google Calendar üzerinden
çözümleyebilir:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today`, Google Meet bağlantısı olan bir Calendar etkinliği için bugünün `primary`
takviminde arama yapar. Eşleşen etkinlik metnini aramak için `--event <query>`,
birincil olmayan bir takvim için `--calendar <id>` kullanın. Takvim araması, Calendar
events readonly kapsamını içeren yeni bir OAuth oturumu gerektirir.
`calendar-events`, eşleşen Meet etkinliklerinin önizlemesini gösterir ve `latest`,
`artifacts`, `attendance` veya `export` komutunun seçeceği etkinliği işaretler.

Konferans kayıt kimliğini zaten biliyorsanız doğrudan adresleyin:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

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

`artifacts`, Google toplantı için açığa çıkardığında konferans kaydı meta verilerini ve
katılımcı, kayıt, döküm, yapılandırılmış döküm girdisi ve akıllı not kaynak meta
verilerini döndürür. Büyük toplantılarda girdi aramasını atlamak için
`--no-transcript-entries` kullanın. `attendance`, katılımcıları ilk/son görülme
zamanları, toplam oturum süresi, geç/erken ayrılma bayrakları ve oturum açmış
kullanıcıya veya görünen ada göre birleştirilmiş yinelenen katılımcı kaynaklarıyla
katılımcı-oturum satırlarına genişletir. Ham katılımcı kaynaklarını ayrı tutmak için
`--no-merge-duplicates`, geç algılamayı ayarlamak için `--late-after-minutes` ve
erken ayrılma algılamasını ayarlamak için `--early-before-minutes` iletin.

`export`, `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`,
`attendance.json` ve `manifest.json` içeren bir klasör yazar. `manifest.json` seçilen
girdiyi, dışa aktarma seçeneklerini, konferans kayıtlarını, çıktı dosyalarını,
sayımları, token kaynağını, kullanıldıysa Calendar etkinliğini ve kısmi alma
uyarılarını kaydeder. Klasörün yanına taşınabilir bir arşiv de yazmak için `--zip`
iletin. Bağlantılı döküm ve akıllı not Google Docs metnini Google Drive
`files.export` üzerinden dışa aktarmak için `--include-doc-bodies` iletin; bu, Drive
Meet readonly kapsamını içeren yeni bir OAuth oturumu gerektirir. `--include-doc-bodies`
olmadan dışa aktarmalar yalnızca Meet meta verilerini ve yapılandırılmış döküm
girdilerini içerir. Google akıllı not listeleme, döküm girdisi veya Drive belge gövdesi
hatası gibi kısmi bir yapıt hatası döndürürse, özet ve manifest tüm dışa aktarmayı
başarısız kılmak yerine uyarıyı korur. Aynı yapıt/katılım verilerini getirmek ve klasör
veya ZIP oluşturmadan manifest JSON'unu yazdırmak için `--dry-run` kullanın. Bu, büyük
bir dışa aktarma yazmadan önce veya bir ajanın yalnızca sayımlara, seçilen kayıtlara ve
uyarılara ihtiyaç duyduğunda kullanışlıdır.

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

Yalnızca dışa aktarma manifestini döndürmek ve dosya yazımlarını atlamak için `"dryRun": true` ayarlayın.

Korunan canlı smoke testini gerçek bir saklanan toplantıya karşı çalıştırın:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Canlı smoke ortamı:

- `OPENCLAW_LIVE_TEST=1` korunan canlı testleri etkinleştirir.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`, saklanan bir Meet URL'sine, koduna veya
  `spaces/{id}` değerine işaret eder.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` veya `GOOGLE_MEET_CLIENT_ID` OAuth istemci kimliğini
  sağlar.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` veya `GOOGLE_MEET_REFRESH_TOKEN` yenileme
  token'ını sağlar.
- İsteğe bağlı: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ve
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`, `OPENCLAW_` ön eki olmadan aynı
  yedek adları kullanır.

Temel yapıt/katılım canlı smoke testi
`https://www.googleapis.com/auth/meetings.space.readonly` ve
`https://www.googleapis.com/auth/meetings.conference.media.readonly` gerektirir.
Takvim araması `https://www.googleapis.com/auth/calendar.events.readonly` gerektirir.
Drive belge gövdesi dışa aktarması
`https://www.googleapis.com/auth/drive.meet.readonly` gerektirir.

Yeni bir Meet alanı oluşturun:

```bash
openclaw googlemeet create
```

Komut yeni `meeting uri`, kaynağı ve katılma oturumunu yazdırır. OAuth kimlik
bilgileriyle resmi Google Meet API'sini kullanır. OAuth kimlik bilgileri olmadan, yedek
olarak sabitlenmiş Chrome node'unun oturum açmış tarayıcı profilini kullanır. Ajanlar,
tek adımda oluşturmak ve katılmak için `google_meet` aracını `action: "create"` ile
kullanabilir. Yalnızca URL oluşturma için `"join": false` iletin.

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

Tarayıcı yedeği URL'yi oluşturamadan önce Google oturum açma veya Meet izin engeline
takılırsa, Gateway yöntemi başarısız bir yanıt döndürür ve `google_meet` aracı düz bir
dize yerine yapılandırılmış ayrıntılar döndürür:

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

Bir ajan `manualActionRequired: true` gördüğünde, `manualActionMessage` ile birlikte
tarayıcı node/sekme bağlamını bildirmeli ve operatör tarayıcı adımını tamamlayana kadar
yeni Meet sekmeleri açmayı durdurmalıdır.

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

Meet oluşturma varsayılan olarak katılır. Chrome veya Chrome-node aktarımı, tarayıcı
üzerinden katılmak için yine de oturum açmış bir Google Chrome profiline ihtiyaç duyar.
Profilin oturumu kapalıysa OpenClaw `manualActionRequired: true` veya bir tarayıcı
yedek hatası bildirir ve yeniden denemeden önce operatörden Google oturum açma işlemini
tamamlamasını ister.

`preview.enrollmentAcknowledged: true` değerini yalnızca Cloud projenizin, OAuth
sorumlusunun ve toplantı katılımcılarının Meet medya API'leri için Google Workspace
Developer Preview Program'a kayıtlı olduğunu doğruladıktan sonra ayarlayın.

## Yapılandırma

Yaygın Chrome gerçek zamanlı yolu yalnızca Plugin'in etkin olmasına, BlackHole'a, SoX'a
ve bir arka uç gerçek zamanlı ses sağlayıcısı anahtarına ihtiyaç duyar. Varsayılan
OpenAI'dır; Google Gemini Live kullanmak için `realtime.provider: "google"` ayarlayın:

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
- `chrome.guestName: "OpenClaw Agent"`: oturumu kapalı Meet konuk ekranında kullanılan ad
- `chrome.autoJoin: true`: OpenClaw tarayıcı otomasyonu üzerinden `chrome-node` üzerinde
  en iyi çabayla konuk adı doldurma ve Join Now tıklaması
- `chrome.reuseExistingTab: true`: yinelenenleri açmak yerine mevcut bir Meet sekmesini
  etkinleştir
- `chrome.waitForInCallMs: 20000`: gerçek zamanlı giriş tetiklenmeden önce Meet sekmesinin
  aramada olduğunu bildirmesini bekle
- `chrome.audioFormat: "pcm16-24khz"`: komut çifti ses biçimi. `"g711-ulaw-8khz"`
  değerini yalnızca hâlâ telefon sesleri yayan eski/özel komut çiftleri için kullanın.
- `chrome.audioInputCommand`: CoreAudio `BlackHole 2ch` üzerinden okuyan ve
  `chrome.audioFormat` biçiminde ses yazan SoX komutu
- `chrome.audioOutputCommand`: `chrome.audioFormat` biçiminde ses okuyan ve CoreAudio
  `BlackHole 2ch` üzerine yazan SoX komutu
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: daha derin yanıtlar için `openclaw_agent_consult` ile kısa
  sözlü yanıtlar
- `realtime.introMessage`: gerçek zamanlı köprü bağlandığında kısa sözlü hazır olma
  kontrolü; sessiz katılmak için `""` olarak ayarlayın
- `realtime.agentId`: `openclaw_agent_consult` için isteğe bağlı OpenClaw ajan kimliği;
  varsayılanı `main`

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

`voiceCall.enabled` varsayılan olarak `true` değerindedir; Twilio aktarımıyla gerçek
PSTN çağrısını ve DTMF'yi Voice Call Plugin'e devreder. `voice-call` etkin değilse,
Google Meet arama planını yine de doğrulayabilir ve kaydedebilir, ancak Twilio çağrısını
başlatamaz.

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

Chrome Gateway ana makinesinde çalıştığında `transport: "chrome"` kullanın. Chrome, Parallels VM gibi eşleştirilmiş bir node üzerinde çalıştığında `transport: "chrome-node"` kullanın. Her iki durumda da gerçek zamanlı model ve `openclaw_agent_consult` Gateway ana makinesinde çalışır; bu nedenle model kimlik bilgileri orada kalır.

Etkin oturumları listelemek veya bir oturum kimliğini incelemek için `action: "status"` kullanın. Gerçek zamanlı ajanın hemen konuşmasını sağlamak için `sessionId` ve `message` ile `action: "speak"` kullanın. Oturumu oluşturmak veya yeniden kullanmak, bilinen bir ifadeyi tetiklemek ve Chrome ana makinesi bunu raporlayabiliyorsa `inCall` sağlık bilgisini döndürmek için `action: "test_speech"` kullanın. `test_speech` her zaman `mode: "realtime"` değerini zorunlu kılar ve `mode: "transcribe"` içinde çalıştırılması istenirse başarısız olur; çünkü yalnızca gözlem amaçlı oturumlar bilerek konuşma yayamaz. `speechOutputVerified` sonucu, bu test çağrısı sırasında gerçek zamanlı ses çıkışı baytlarının artmasına dayanır; bu yüzden daha eski ses içeren yeniden kullanılan bir oturum yeni ve başarılı bir konuşma denetimi sayılmaz. Bir oturumu sona ermiş olarak işaretlemek için `action: "leave"` kullanın.

`status`, mevcut olduğunda Chrome sağlık bilgisini içerir:

- `inCall`: Chrome Meet çağrısının içinde görünüyor
- `micMuted`: en iyi çaba ile belirlenen Meet mikrofon durumu
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: konuşmanın çalışabilmesi için tarayıcı profilinde manuel oturum açma, Meet sahibi kabulü, izinler veya tarayıcı denetimi onarımı gerekiyor
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: yönetilen Chrome konuşmasına şu anda izin verilip verilmediği. `speechReady: false`, OpenClaw'un giriş/test ifadesini ses köprüsüne göndermediği anlamına gelir.
- `providerConnected` / `realtimeReady`: gerçek zamanlı ses köprüsü durumu
- `lastInputAt` / `lastOutputAt`: köprüden görülen veya köprüye gönderilen son ses

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Gerçek zamanlı ajan danışması

Chrome gerçek zamanlı modu, canlı bir ses döngüsü için optimize edilmiştir. Gerçek zamanlı ses sağlayıcısı toplantı sesini duyar ve yapılandırılmış ses köprüsü üzerinden konuşur. Gerçek zamanlı model daha derin akıl yürütmeye, güncel bilgiye veya normal OpenClaw araçlarına ihtiyaç duyduğunda `openclaw_agent_consult` çağırabilir.

Danışma aracı, arka planda son toplantı dökümü bağlamıyla normal OpenClaw ajanını çalıştırır ve gerçek zamanlı ses oturumuna kısa, konuşmaya uygun bir yanıt döndürür. Ses modeli daha sonra bu yanıtı toplantıya konuşarak aktarabilir. Voice Call ile aynı paylaşılan gerçek zamanlı danışma aracını kullanır.

Varsayılan olarak danışmalar `main` ajanına karşı çalışır. Bir Meet hattının özel bir OpenClaw ajan çalışma alanına, model varsayılanlarına, araç politikasına, belleğe ve oturum geçmişine danışması gerektiğinde `realtime.agentId` ayarlayın.

`realtime.toolPolicy` danışma çalıştırmasını denetler:

- `safe-read-only`: danışma aracını açığa çıkarır ve normal ajanı `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` ve `memory_get` ile sınırlar.
- `owner`: danışma aracını açığa çıkarır ve normal ajanın olağan ajan araç politikasını kullanmasına izin verir.
- `none`: danışma aracını gerçek zamanlı ses modeline açığa çıkarmaz.

Danışma oturum anahtarı her Meet oturumu için kapsamlandırılır; böylece takip danışma çağrıları aynı toplantı sırasında önceki danışma bağlamını yeniden kullanabilir.

Chrome çağrıya tamamen katıldıktan sonra konuşmalı bir hazırlık denetimini zorlamak için:

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

Bir toplantıyı gözetimsiz bir ajana devretmeden önce bu sıralamayı kullanın:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Beklenen Chrome-node durumu:

- `googlemeet setup` tamamen yeşildir.
- Varsayılan aktarım Chrome-node olduğunda veya bir node sabitlendiğinde `googlemeet setup`, `chrome-node-connected` içerir.
- `nodes status` seçilen node'un bağlı olduğunu gösterir.
- Seçilen node hem `googlemeet.chrome` hem de `browser.proxy` duyurur.
- Meet sekmesi çağrıya katılır ve `test-speech`, `inCall: true` ile Chrome sağlık bilgisini döndürür.

Parallels macOS VM gibi uzak bir Chrome ana makinesi için, Gateway veya VM güncellendikten sonraki en kısa güvenli denetim şudur:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Bu, bir ajanın gerçek bir toplantı sekmesi açmasından önce Gateway Plugin'inin yüklendiğini, VM node'unun geçerli token ile bağlı olduğunu ve Meet ses köprüsünün kullanılabilir olduğunu kanıtlar.

Twilio smoke testi için telefonla katılım ayrıntılarını sunan bir toplantı kullanın:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Beklenen Twilio durumu:

- `googlemeet setup`, yeşil `twilio-voice-call-plugin` ve `twilio-voice-call-credentials` denetimlerini içerir.
- Gateway yeniden yüklendikten sonra `voicecall` CLI içinde kullanılabilir.
- Döndürülen oturumda `transport: "twilio"` ve bir `twilio.voiceCallId` vardır.
- `googlemeet leave <sessionId>` devredilen sesli çağrıyı kapatır.

## Sorun giderme

### Ajan Google Meet aracını göremiyor

Plugin'in Gateway yapılandırmasında etkinleştirildiğini doğrulayın ve Gateway'i yeniden yükleyin:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

`plugins.entries.google-meet` değerini yeni düzenlediyseniz Gateway'i yeniden başlatın veya yeniden yükleyin. Çalışan ajan yalnızca geçerli Gateway işlemi tarafından kaydedilen Plugin araçlarını görür.

### Bağlı Google Meet uyumlu node yok

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

`googlemeet setup`, `chrome-node-connected` aşamasında başarısız olursa veya Gateway günlüğü `gateway token mismatch` bildirirse node'u geçerli Gateway token ile yeniden kurun veya yeniden başlatın. Bir LAN Gateway için bu genellikle şu anlama gelir:

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

`googlemeet test-speech` çalıştırın ve döndürülen Chrome sağlık bilgisini inceleyin. `manualActionRequired: true` bildirirse `manualActionMessage` değerini operatöre gösterin ve tarayıcı eylemi tamamlanana kadar yeniden denemeyi bırakın.

Yaygın manuel eylemler:

- Chrome profilinde oturum açın.
- Konuğu Meet sahibi hesabından kabul edin.
- Chrome'un yerel izin istemi göründüğünde Chrome mikrofon/kamera izinlerini verin.
- Takılı kalmış bir Meet izin iletişim kutusunu kapatın veya onarın.

Meet yalnızca "Do you want people to hear you in the meeting?" gösteriyor diye "oturum açılmamış" raporu vermeyin. Bu, Meet'in ses seçimi ara ekranıdır; OpenClaw, mevcut olduğunda tarayıcı otomasyonu üzerinden **Use microphone** seçeneğine tıklar ve gerçek toplantı durumunu beklemeye devam eder. Yalnızca oluşturma amaçlı tarayıcı geri dönüşü için OpenClaw, URL oluşturmak gerçek zamanlı ses yolunu gerektirmediğinden **Continue without microphone** seçeneğine tıklayabilir.

### Toplantı oluşturma başarısız oluyor

`googlemeet create`, OAuth kimlik bilgileri yapılandırıldığında önce Google Meet API `spaces.create` uç noktasını kullanır. OAuth kimlik bilgileri olmadan sabitlenmiş Chrome node tarayıcısına geri döner. Şunları doğrulayın:

- API ile oluşturma için: `oauth.clientId` ve `oauth.refreshToken` yapılandırılmıştır veya eşleşen `OPENCLAW_GOOGLE_MEET_*` ortam değişkenleri mevcuttur.
- API ile oluşturma için: yenileme token'ı, oluşturma desteği eklendikten sonra üretilmiştir. Daha eski token'larda `meetings.space.created` kapsamı eksik olabilir; `openclaw googlemeet auth login --json` komutunu yeniden çalıştırın ve Plugin yapılandırmasını güncelleyin.
- Tarayıcı geri dönüşü için: `defaultTransport: "chrome-node"` ve `chromeNode.node`, `browser.proxy` ve `googlemeet.chrome` içeren bağlı bir node'u gösterir.
- Tarayıcı geri dönüşü için: o node üzerindeki OpenClaw Chrome profili Google'da oturum açmıştır ve `https://meet.google.com/new` adresini açabilir.
- Tarayıcı geri dönüşü için: yeniden denemeler yeni bir sekme açmadan önce mevcut bir `https://meet.google.com/new` veya Google hesabı istemi sekmesini yeniden kullanır. Bir ajan zaman aşımına uğrarsa manuel olarak başka bir Meet sekmesi açmak yerine araç çağrısını yeniden deneyin.
- Tarayıcı geri dönüşü için: araç `manualActionRequired: true` döndürürse operatörü yönlendirmek için döndürülen `browser.nodeId`, `browser.targetId`, `browserUrl` ve `manualActionMessage` değerlerini kullanın. Bu eylem tamamlanana kadar döngü içinde yeniden denemeyin.
- Tarayıcı geri dönüşü için: Meet "Do you want people to hear you in the meeting?" gösterirse sekmeyi açık bırakın. OpenClaw, tarayıcı otomasyonu aracılığıyla **Use microphone** veya yalnızca oluşturma geri dönüşü için **Continue without microphone** seçeneğine tıklamalı ve oluşturulan Meet URL'sini beklemeye devam etmelidir. Bunu yapamazsa hata `google-login-required` değil, `meet-audio-choice-required` belirtmelidir.

### Ajan katılıyor ancak konuşmuyor

Gerçek zamanlı yolu denetleyin:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Dinleme/yanıt verme için `mode: "realtime"` kullanın. `mode: "transcribe"` bilerek çift yönlü gerçek zamanlı ses köprüsünü başlatmaz. `googlemeet test-speech` her zaman gerçek zamanlı yolu denetler ve o çağrı için köprü çıkışı baytlarının gözlemlenip gözlemlenmediğini bildirir. `speechOutputVerified` false ve `speechOutputTimedOut` true ise gerçek zamanlı sağlayıcı ifadeyi kabul etmiş olabilir, ancak OpenClaw yeni çıkış baytlarının Chrome ses köprüsüne ulaştığını görmemiştir.

Ayrıca şunları doğrulayın:

- Gateway ana makinesinde `OPENAI_API_KEY` veya `GEMINI_API_KEY` gibi bir gerçek zamanlı sağlayıcı anahtarı kullanılabilir.
- `BlackHole 2ch` Chrome ana makinesinde görünür.
- `sox` Chrome ana makinesinde vardır.
- Meet mikrofonu ve hoparlörü OpenClaw tarafından kullanılan sanal ses yolu üzerinden yönlendirilir.

`googlemeet doctor [session-id]` oturumu, node'u, çağrı içi durumu, manuel eylem nedenini, gerçek zamanlı sağlayıcı bağlantısını, `realtimeReady` durumunu, ses giriş/çıkış etkinliğini, son ses zaman damgalarını, bayt sayaçlarını ve tarayıcı URL'sini yazdırır. Ham JSON gerektiğinde `googlemeet status [session-id]` kullanın. Token'ları açığa çıkarmadan Google Meet OAuth yenilemeyi doğrulamanız gerektiğinde `googlemeet doctor --oauth` kullanın; Google Meet API kanıtı da gerektiğinde `--meeting` veya `--create-space` ekleyin.

Bir ajan zaman aşımına uğradıysa ve zaten açık bir Meet sekmesi görebiliyorsanız başka bir sekme açmadan o sekmeyi inceleyin:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Eşdeğer araç eylemi `recover_current_tab` değeridir. Seçilen aktarım için mevcut bir Meet sekmesine odaklanır ve onu inceler. `chrome` ile Gateway üzerinden yerel tarayıcı denetimini kullanır; `chrome-node` ile yapılandırılmış Chrome node'unu kullanır. Yeni sekme açmaz veya yeni oturum oluşturmaz; oturum açma, kabul, izinler veya ses seçimi durumu gibi geçerli engelleyiciyi bildirir. CLI komutu yapılandırılmış Gateway ile konuşur, bu nedenle Gateway çalışıyor olmalıdır; `chrome-node` ayrıca Chrome node'unun bağlı olmasını gerektirir.

### Twilio kurulum denetimleri başarısız oluyor

`twilio-voice-call-plugin`, `voice-call` izinli olmadığında veya etkinleştirilmediğinde başarısız olur.
Bunu `plugins.allow` içine ekleyin, `plugins.entries.voice-call` etkinleştirin ve
Gateway'i yeniden yükleyin.

`twilio-voice-call-credentials`, Twilio arka ucunda hesap SID'si, kimlik doğrulama
token'ı veya arayan numarası eksik olduğunda başarısız olur. Bunları Gateway ana makinesinde ayarlayın:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Ardından Gateway'i yeniden başlatın veya yeniden yükleyin ve şunu çalıştırın:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` varsayılan olarak yalnızca hazırlık denetimi yapar. Belirli bir numarayla dry-run yapmak için:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Yalnızca bilerek canlı bir giden bildirim araması yapmak istediğinizde `--yes`
ekleyin:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio araması başlıyor ancak toplantıya hiç girmiyor

Meet etkinliğinin telefonla katılma ayrıntılarını sunduğunu doğrulayın. Tam telefonla katılma
numarasını ve PIN'i ya da özel bir DTMF dizisini iletin:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Sağlayıcının PIN girilmeden önce duraklamaya ihtiyacı varsa `--dtmf-sequence`
içinde başta `w` veya virgüller kullanın.

## Notlar

Google Meet'in resmi medya API'si alma odaklıdır, bu yüzden bir Meet
aramasında konuşmak hâlâ bir katılımcı yolu gerektirir. Bu Plugin bu sınırı görünür tutar:
Chrome tarayıcı katılımını ve yerel ses yönlendirmesini yönetir; Twilio ise
telefonla katılma katılımını yönetir.

Chrome gerçek zamanlı modu `BlackHole 2ch` ve ayrıca şunlardan birini gerektirir:

- `chrome.audioInputCommand` ile `chrome.audioOutputCommand`: OpenClaw
  gerçek zamanlı model köprüsünün sahibidir ve bu komutlar ile seçili gerçek zamanlı ses sağlayıcısı arasında
  `chrome.audioFormat` içindeki sesi aktarır. Varsayılan Chrome yolu
  24 kHz PCM16'dır; 8 kHz G.711 mu-law eski komut çiftleri için kullanılabilir kalır.
- `chrome.audioBridgeCommand`: harici bir köprü komutu tüm yerel
  ses yolunun sahibidir ve daemon'unu başlattıktan veya doğruladıktan sonra çıkmalıdır.

Temiz çift yönlü ses için Meet çıkışını ve Meet mikrofonunu ayrı
sanal cihazlar veya Loopback tarzı bir sanal cihaz grafiği üzerinden yönlendirin. Tek bir paylaşılan
BlackHole cihazı, diğer katılımcıları aramaya geri yankılayabilir.

`googlemeet speak`, bir Chrome oturumu için etkin gerçek zamanlı ses köprüsünü tetikler.
`googlemeet leave` bu köprüyü durdurur. Voice Call Plugin üzerinden devredilen
Twilio oturumlarında `leave`, alttaki sesli aramayı da kapatır.

## İlgili

- [Sesli arama Plugin'i](/tr/plugins/voice-call)
- [Konuşma modu](/tr/nodes/talk)
- [Plugin oluşturma](/tr/plugins/building-plugins)
