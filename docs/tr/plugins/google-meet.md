---
read_when:
    - Bir OpenClaw agent’ının bir Google Meet çağrısına katılmasını istiyorsunuz
    - Bir OpenClaw ajanının yeni bir Google Meet görüşmesi oluşturmasını istiyorsunuz
    - Google Meet taşıyıcısı olarak Chrome'u, Chrome node'u veya Twilio'yu yapılandırıyorsunuz
summary: 'Google Meet Plugin''i: Chrome veya Twilio üzerinden açıkça belirtilen Meet URL''lerine gerçek zamanlı ses varsayılanlarıyla katılın'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-01T09:03:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9d0d195fc709e487ef1bf5603fdb32fade1b6a0a13aa9bed5110979490f92ff
    source_path: plugins/google-meet.md
    workflow: 16
---

OpenClaw için Google Meet katılımcı desteği tasarım gereği açıktır:

- Yalnızca açıkça belirtilmiş bir `https://meet.google.com/...` URL'sine katılır.
- Google Meet API üzerinden yeni bir Meet alanı oluşturabilir, ardından döndürülen URL'ye katılabilir.
- Varsayılan mod `realtime` sestir.
- Realtime ses, daha derin akıl yürütme veya araçlar gerektiğinde tam OpenClaw agent'ına geri çağrı yapabilir.
- Agent'lar katılma davranışını `mode` ile seçer: canlı dinleme/konuşarak yanıt verme için `realtime` kullanın veya realtime ses köprüsü olmadan tarayıcıya katılmak/kontrol etmek için `transcribe` kullanın.
- Kimlik doğrulama kişisel Google OAuth veya zaten oturum açılmış bir Chrome profili olarak başlar.
- Otomatik bir onay duyurusu yoktur.
- Varsayılan Chrome ses arka ucu `BlackHole 2ch`'dir.
- Chrome yerel olarak veya eşleştirilmiş bir node host üzerinde çalışabilir.
- Twilio, bir arama numarasını ve isteğe bağlı PIN veya DTMF dizisini kabul eder.
- CLI komutu `googlemeet`'tir; `meet` daha geniş agent telekonferans iş akışları için ayrılmıştır.

## Hızlı başlangıç

Yerel ses bağımlılıklarını kurun ve bir arka uç realtime ses sağlayıcısı yapılandırın. Varsayılan OpenAI'dır; Google Gemini Live da `realtime.provider: "google"` ile çalışır:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch`, `BlackHole 2ch` sanal ses aygıtını kurar. Homebrew'ün yükleyicisi, macOS aygıtı göstermeden önce yeniden başlatma gerektirir:

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

Kurulum çıktısı agent tarafından okunabilir ve moda duyarlı olacak şekilde tasarlanmıştır. Chrome profilini, node sabitlemesini ve realtime Chrome katılımları için BlackHole/SoX ses köprüsünü ve gecikmeli realtime giriş kontrollerini raporlar. Yalnızca gözlem katılımları için aynı aktarımı `--mode transcribe` ile kontrol edin; bu mod, köprü üzerinden dinlemediği veya konuşmadığı için realtime ses ön koşullarını atlar:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Twilio devri yapılandırıldığında kurulum, `voice-call` Plugin'inin, Twilio kimlik bilgilerinin ve herkese açık webhook erişiminin hazır olup olmadığını da raporlar. Herhangi bir `ok: false` kontrolünü, bir agent'tan katılmasını istemeden önce kontrol edilen aktarım ve mod için engelleyici olarak değerlendirin. Betikler veya makine tarafından okunabilir çıktı için `openclaw googlemeet setup --json` kullanın. Bir agent denemeden önce belirli bir aktarımı önceden kontrol etmek için `--transport chrome`, `--transport chrome-node` veya `--transport twilio` kullanın.

Twilio için varsayılan aktarım Chrome olduğunda aktarımı her zaman açıkça önceden kontrol edin:

```bash
openclaw googlemeet setup --transport twilio
```

Bu, agent toplantıyı aramayı denemeden önce eksik `voice-call` bağlantılarını, Twilio kimlik bilgilerini veya erişilemeyen webhook yayınımını yakalar.

Bir toplantıya katılın:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Veya bir agent'ın `google_meet` aracı üzerinden katılmasına izin verin:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Yeni bir toplantı oluşturup ona katılın:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Katılmadan yalnızca URL'yi oluşturun:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` iki yola sahiptir:

- API oluşturma: Google Meet OAuth kimlik bilgileri yapılandırıldığında kullanılır. Bu en deterministik yoldur ve tarayıcı UI durumuna bağlı değildir.
- Tarayıcı yedeği: OAuth kimlik bilgileri olmadığında kullanılır. OpenClaw sabitlenmiş Chrome node'unu kullanır, `https://meet.google.com/new` adresini açar, Google'ın gerçek bir toplantı kodu URL'sine yönlendirmesini bekler ve ardından bu URL'yi döndürür. Bu yol, node üzerindeki OpenClaw Chrome profilinin Google'da zaten oturum açmış olmasını gerektirir. Tarayıcı otomasyonu Meet'in kendi ilk çalıştırma mikrofon istemini işler; bu istem bir Google oturum açma hatası olarak değerlendirilmez.
  Katılma ve oluşturma akışları ayrıca yeni bir sekme açmadan önce mevcut bir Meet sekmesini yeniden kullanmayı dener. Eşleştirme, `authuser` gibi zararsız URL sorgu dizelerini yok sayar; bu nedenle bir agent yeniden denemesi, ikinci bir Chrome sekmesi oluşturmak yerine zaten açık olan toplantıya odaklanmalıdır.

Komut/araç çıktısı, agent'ların hangi yolun kullanıldığını açıklayabilmesi için bir `source` alanı (`api` veya `browser`) içerir. `create` varsayılan olarak yeni toplantıya katılır ve `joined: true` ile katılım oturumunu döndürür. Yalnızca URL oluşturmak için CLI'da `create --no-join` kullanın veya araca `"join": false` geçin.

Veya bir agent'a şunu söyleyin: "Bir Google Meet oluştur, realtime sesle katıl ve bağlantıyı bana gönder." Agent, `action: "create"` ile `google_meet` çağırmalı ve ardından döndürülen `meetingUri` değerini paylaşmalıdır.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Yalnızca gözlem/tarayıcı kontrolü katılımı için `"mode": "transcribe"` ayarlayın. Bu, çift yönlü realtime model köprüsünü başlatmaz, BlackHole veya SoX gerektirmez ve toplantıya konuşarak yanıt vermez. Bu moddaki Chrome katılımları ayrıca OpenClaw'ın mikrofon/kamera izin verme işlemini ve Meet **Mikrofonu kullan** yolunu atlar. Meet bir ses seçimi ara ekranı gösterirse otomasyon mikrofon olmayan yolu dener ve aksi halde yerel mikrofonu açmak yerine manuel bir işlem raporlar.

Realtime oturumlar sırasında `google_meet` durumu, `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, son giriş/çıkış zaman damgaları, bayt sayaçları ve köprü kapalı durumu gibi tarayıcı ve ses köprüsü sağlığını içerir. Güvenli bir Meet sayfası istemi görünürse tarayıcı otomasyonu mümkün olduğunda bunu işler. Oturum açma, host kabulü ve tarayıcı/OS izin istemleri, agent'ın iletmesi için bir neden ve mesajla manuel işlem olarak raporlanır. Yönetilen Chrome oturumları, giriş veya test ifadesini yalnızca tarayıcı sağlığı `inCall: true` raporladıktan sonra yayar; aksi halde durum `speechReady: false` raporlar ve konuşma denemesi, agent toplantıya konuşmuş gibi davranmak yerine engellenir.

Yerel Chrome katılımları, oturum açılmış OpenClaw tarayıcı profili üzerinden yapılır. Realtime mod, OpenClaw tarafından kullanılan mikrofon/hoparlör yolu için `BlackHole 2ch` gerektirir. Temiz çift yönlü ses için ayrı sanal aygıtlar veya Loopback tarzı bir grafik kullanın; tek bir BlackHole aygıtı ilk duman testi için yeterlidir ancak yankı yapabilir.

### Yerel Gateway + Parallels Chrome

Yalnızca VM'nin Chrome'a sahip olmasını sağlamak için bir macOS VM içinde tam bir OpenClaw Gateway'e veya model API anahtarına ihtiyacınız **yoktur**. Gateway'i ve agent'ı yerel olarak çalıştırın, ardından VM'de bir node host çalıştırın. Node'un Chrome komutunu ilan etmesi için VM'de paketlenmiş Plugin'i bir kez etkinleştirin:

Nerede ne çalışır:

- Gateway host: OpenClaw Gateway, agent çalışma alanı, model/API anahtarları, realtime sağlayıcı ve Google Meet Plugin yapılandırması.
- Parallels macOS VM: OpenClaw CLI/node host, Google Chrome, SoX, BlackHole 2ch ve Google'da oturum açmış bir Chrome profili.
- VM'de gerekli olmayanlar: Gateway hizmeti, agent yapılandırması, OpenAI/GPT anahtarı veya model sağlayıcı kurulumu.

VM bağımlılıklarını kurun:

```bash
brew install blackhole-2ch sox
```

BlackHole'u kurduktan sonra macOS'in `BlackHole 2ch` aygıtını göstermesi için VM'yi yeniden başlatın:

```bash
sudo reboot
```

Yeniden başlattıktan sonra VM'nin ses aygıtını ve SoX komutlarını görebildiğini doğrulayın:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

VM'de OpenClaw'ı kurun veya güncelleyin, ardından paketlenmiş Plugin'i orada etkinleştirin:

```bash
openclaw plugins enable google-meet
```

VM'de node host'u başlatın:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` bir LAN IP'siyse ve TLS kullanmıyorsanız, node bu güvenilir özel ağ için açıkça izin vermediğiniz sürece düz metin WebSocket'i reddeder:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` bir süreç ortamıdır, `openclaw.json` ayarı değildir. `openclaw node install`, kurulum komutunda mevcut olduğunda bunu LaunchAgent ortamında saklar.

Node'u Gateway host'tan onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway'in node'u gördüğünü ve hem `googlemeet.chrome` hem de tarayıcı yeteneği/`browser.proxy` ilan ettiğini doğrulayın:

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

veya agent'tan `google_meet` aracını `transport: "chrome-node"` ile kullanmasını isteyin.

Bir oturum oluşturan veya yeniden kullanan, bilinen bir ifade söyleyen ve oturum sağlığını yazdıran tek komutluk duman testi için:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Realtime katılım sırasında OpenClaw tarayıcı otomasyonu konuk adını doldurur, Katıl/Katılmayı iste seçeneklerine tıklar ve bu istem göründüğünde Meet'in ilk çalıştırma "Mikrofonu kullan" seçimini kabul eder. Yalnızca gözlem katılımı veya yalnızca tarayıcı üzerinden toplantı oluşturma sırasında, mevcut olduğunda mikrofon olmadan aynı istemi geçer. Tarayıcı profili oturum açmamışsa, Meet host kabulünü bekliyorsa, Chrome realtime katılım için mikrofon/kamera iznine ihtiyaç duyuyorsa veya Meet otomasyonun çözemediği bir istemde takılmışsa, join/test-speech sonucu `manualActionRequired: true` değerini `manualActionReason` ve `manualActionMessage` ile raporlar. Agent'lar katılımı yeniden denemeyi bırakmalı, bu tam mesajı mevcut `browserUrl`/`browserTitle` ile birlikte raporlamalı ve yalnızca manuel tarayıcı işlemi tamamlandıktan sonra yeniden denemelidir.

`chromeNode.node` atlanırsa OpenClaw otomatik seçimi yalnızca tam olarak bir bağlı node hem `googlemeet.chrome` hem de tarayıcı kontrolü ilan ettiğinde yapar. Birden çok yetenekli node bağlıysa `chromeNode.node` değerini node kimliği, görüntü adı veya uzak IP olarak ayarlayın.

Yaygın hata kontrolleri:

- `Configured Google Meet node ... is not usable: offline`: sabitlenen Node,
  Gateway tarafından biliniyor ama kullanılamıyor. Agents, bu Node'u
  kullanılabilir bir Chrome ana makinesi olarak değil tanı amaçlı durum olarak
  ele almalı ve kullanıcı bunu istemedikçe başka bir aktarıma geri dönmek
  yerine kurulum engelleyicisini bildirmelidir.
- `No connected Google Meet-capable node`: VM içinde `openclaw node run`
  başlatın, eşleştirmeyi onaylayın ve VM içinde `openclaw plugins enable
  google-meet` ile `openclaw plugins enable browser` komutlarının
  çalıştırıldığından emin olun. Ayrıca Gateway ana makinesinin iki Node
  komutuna da `gateway.nodes.allowCommands: ["googlemeet.chrome",
  "browser.proxy"]` ile izin verdiğini doğrulayın.
- `BlackHole 2ch audio device not found`: denetlenen ana makineye
  `blackhole-2ch` kurun ve yerel Chrome sesini kullanmadan önce yeniden
  başlatın.
- `BlackHole 2ch audio device not found on the node`: VM içine
  `blackhole-2ch` kurun ve VM'i yeniden başlatın.
- Chrome açılıyor ama katılamıyor: VM içindeki tarayıcı profiline giriş yapın
  veya konuk katılımı için `chrome.guestName` ayarını koruyun. Konuk otomatik
  katılımı, Node tarayıcı proxy'si üzerinden OpenClaw tarayıcı otomasyonunu
  kullanır; Node tarayıcı yapılandırmasının istediğiniz profili gösterdiğinden
  emin olun, örneğin `browser.defaultProfile: "user"` veya adlandırılmış mevcut
  oturum profili.
- Yinelenen Meet sekmeleri: `chrome.reuseExistingTab: true` etkin kalsın.
  OpenClaw, yeni bir sekme açmadan önce aynı Meet URL'si için var olan bir
  sekmeyi etkinleştirir ve tarayıcı toplantı oluşturma işlemi, başka bir tane
  açmadan önce sürmekte olan bir `https://meet.google.com/new` veya Google
  hesabı istemi sekmesini yeniden kullanır.
- Ses yok: Meet içinde mikrofon/hoparlör yönlendirmesini OpenClaw tarafından
  kullanılan sanal ses aygıtı yolundan geçirin; temiz çift yönlü ses için ayrı
  sanal aygıtlar veya Loopback tarzı yönlendirme kullanın.

## Kurulum notları

Chrome gerçek zamanlı varsayılanı iki harici araç kullanır:

- `sox`: komut satırı ses aracı. Plugin, varsayılan 24 kHz PCM16 ses köprüsü
  için açık CoreAudio aygıt komutları kullanır.
- `blackhole-2ch`: macOS sanal ses sürücüsü. Chrome/Meet'in yönlendirebileceği
  `BlackHole 2ch` ses aygıtını oluşturur.

OpenClaw iki paketi de paketlemez veya yeniden dağıtmaz. Belgeler, kullanıcılara
bunları Homebrew üzerinden ana makine bağımlılıkları olarak kurmalarını söyler.
SoX `LGPL-2.0-only AND GPL-2.0-only` lisanslıdır; BlackHole GPL-3.0
lisanslıdır. BlackHole'u OpenClaw ile birlikte paketleyen bir yükleyici veya
cihaz imajı oluşturursanız BlackHole'un üst kaynak lisans koşullarını inceleyin
veya Existential Audio'dan ayrı bir lisans alın.

## Aktarımlar

### Chrome

Chrome aktarımı, Meet URL'sini OpenClaw tarayıcı denetimi üzerinden açar ve
giriş yapılmış OpenClaw tarayıcı profili olarak katılır. macOS'te Plugin,
başlatmadan önce `BlackHole 2ch` denetimi yapar. Yapılandırılmışsa, Chrome'u
açmadan önce bir ses köprüsü sağlık komutu ve başlatma komutu da çalıştırır.
Chrome/ses Gateway ana makinesinde yaşadığında `chrome` kullanın; Chrome/ses,
Parallels macOS VM gibi eşleştirilmiş bir Node'da yaşadığında `chrome-node`
kullanın. Yerel Chrome için profili `browser.defaultProfile` ile seçin;
`chrome.browserProfile`, `chrome-node` ana makinelerine geçirilir.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome mikrofon ve hoparlör sesini yerel OpenClaw ses köprüsünden geçirin.
`BlackHole 2ch` kurulu değilse katılım, ses yolu olmadan sessizce katılmak
yerine bir kurulum hatasıyla başarısız olur.

### Twilio

Twilio aktarımı, Voice Call Plugin'e devredilen katı bir arama planıdır. Meet
sayfalarını telefon numaraları için ayrıştırmaz.

Chrome katılımı kullanılamadığında veya telefonla arama yedeği istediğinizde
bunu kullanın. Google Meet, toplantı için telefonla arama numarası ve PIN
sunmalıdır; OpenClaw bunları Meet sayfasından keşfetmez.

Voice Call Plugin'i Chrome Node'unda değil, Gateway ana makinesinde
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

`voice-call` etkinleştirildikten sonra Gateway'i yeniden başlatın veya yeniden
yükleyin; Plugin yapılandırma değişiklikleri, yeniden yüklenene kadar zaten
çalışan bir Gateway sürecinde görünmez.

Sonra doğrulayın:

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

## OAuth ve ön denetim

OAuth, Meet bağlantısı oluşturmak için isteğe bağlıdır çünkü `googlemeet create`
tarayıcı otomasyonuna geri dönebilir. Resmi API ile oluşturma, alan çözümleme
veya Meet Media API ön denetimleri istediğinizde OAuth'u yapılandırın.

Google Meet API erişimi kullanıcı OAuth'u kullanır: bir Google Cloud OAuth
istemcisi oluşturun, gerekli kapsamları isteyin, bir Google hesabını
yetkilendirin, ardından ortaya çıkan yenileme belirtecini Google Meet Plugin
yapılandırmasında saklayın veya `OPENCLAW_GOOGLE_MEET_*` ortam değişkenlerini
sağlayın.

OAuth, Chrome katılım yolunun yerine geçmez. Chrome ve Chrome-node aktarımları,
tarayıcı katılımı kullandığınızda hâlâ giriş yapılmış bir Chrome profili,
BlackHole/SoX ve bağlı bir Node üzerinden katılır. OAuth yalnızca resmi Google
Meet API yolu içindir: toplantı alanları oluşturma, alanları çözümleme ve Meet
Media API ön denetimleri çalıştırma.

### Google kimlik bilgileri oluşturun

Google Cloud Console içinde:

1. Bir Google Cloud projesi oluşturun veya seçin.
2. Bu proje için **Google Meet REST API**'yi etkinleştirin.
3. OAuth izin ekranını yapılandırın.
   - Bir Google Workspace kuruluşu için **Internal** en basit seçenektir.
   - **External** kişisel/test kurulumları için çalışır; uygulama Testing
     durumundayken, uygulamayı yetkilendirecek her Google hesabını test
     kullanıcısı olarak ekleyin.
4. OpenClaw'un istediği kapsamları ekleyin:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Bir OAuth istemci kimliği oluşturun.
   - Uygulama türü: **Web application**.
   - Yetkili yönlendirme URI'si:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. İstemci kimliğini ve istemci gizli bilgisini kopyalayın.

`meetings.space.created`, Google Meet `spaces.create` tarafından gereklidir.
`meetings.space.readonly`, OpenClaw'un Meet URL'lerini/kodlarını alanlara
çözümlemesini sağlar. `meetings.conference.media.readonly`, Meet Media API ön
denetimi ve medya işleri içindir; Google gerçek Media API kullanımı için
Developer Preview kaydı gerektirebilir. Yalnızca tarayıcı tabanlı Chrome
katılımlarına ihtiyacınız varsa OAuth'u tamamen atlayın.

### Yenileme belirtecini üretin

`oauth.clientId` ve isteğe bağlı olarak `oauth.clientSecret` yapılandırın veya
bunları ortam değişkenleri olarak geçirin, ardından şunu çalıştırın:

```bash
openclaw googlemeet auth login --json
```

Komut, yenileme belirteci içeren bir `oauth` yapılandırma bloğu yazdırır. PKCE,
`http://localhost:8085/oauth2callback` üzerinde localhost geri çağırması ve
`--manual` ile manuel kopyala/yapıştır akışı kullanır.

Örnekler:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Tarayıcı yerel geri çağırmaya ulaşamadığında manuel modu kullanın:

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

Yenileme belirtecini yapılandırmada istemediğinizde ortam değişkenlerini tercih
edin. Hem yapılandırma hem de ortam değerleri varsa Plugin önce yapılandırmayı,
ardından ortam yedeğini çözümler.

OAuth izni Meet alanı oluşturma, Meet alanı okuma erişimi ve Meet konferans
medyası okuma erişimini içerir. Toplantı oluşturma desteği var olmadan önce
kimlik doğruladıysanız yenileme belirtecinin `meetings.space.created` kapsamına
sahip olması için `openclaw googlemeet auth login --json` komutunu yeniden
çalıştırın.

### OAuth'u doctor ile doğrulayın

Hızlı, gizli bilgi içermeyen bir sağlık denetimi istediğinizde OAuth doctor'ı
çalıştırın:

```bash
openclaw googlemeet doctor --oauth --json
```

Bu, Chrome çalışma zamanını yüklemez veya bağlı bir Chrome Node'u gerektirmez.
OAuth yapılandırmasının var olduğunu ve yenileme belirtecinin erişim belirteci
üretebildiğini denetler. JSON raporu yalnızca `ok`, `configured`,
`tokenSource`, `expiresAt` ve denetim mesajları gibi durum alanlarını içerir;
erişim belirtecini, yenileme belirtecini veya istemci gizli bilgisini yazdırmaz.

Yaygın sonuçlar:

| Denetim             | Anlam                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`      | `oauth.clientId` ile `oauth.refreshToken` veya önbelleğe alınmış bir erişim belirteci mevcut. |
| `oauth-token`       | Önbelleğe alınmış erişim belirteci hâlâ geçerli veya yenileme belirteci yeni bir erişim belirteci üretti. |
| `meet-spaces-get`   | İsteğe bağlı `--meeting` denetimi mevcut bir Meet alanını çözümledi.                    |
| `meet-spaces-create` | İsteğe bağlı `--create-space` denetimi yeni bir Meet alanı oluşturdu.                  |

Google Meet API etkinleştirmesini ve `spaces.create` kapsamını da kanıtlamak
için yan etkili oluşturma denetimini çalıştırın:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` tek kullanımlık bir Meet URL'si oluşturur. Google Cloud
projesinde Meet API'nin etkin olduğunu ve yetkilendirilmiş hesabın
`meetings.space.created` kapsamına sahip olduğunu doğrulamanız gerektiğinde bunu
kullanın.

Mevcut bir toplantı alanı için okuma erişimini kanıtlamak üzere:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` ve `resolve-space`, yetkilendirilmiş Google hesabının
erişebildiği mevcut bir alana okuma erişimini kanıtlar. Bu denetimlerden gelen
bir `403` genellikle Google Meet REST API'nin devre dışı olduğu, izin verilmiş
yenileme belirtecinin gerekli kapsamı eksik olduğu veya Google hesabının o Meet
alanına erişemediği anlamına gelir. Yenileme belirteci hatası, `openclaw
googlemeet auth login --json` komutunu yeniden çalıştırmanız ve yeni `oauth`
bloğunu saklamanız gerektiği anlamına gelir.

Tarayıcı yedeği için OAuth kimlik bilgileri gerekmez. Bu modda Google kimlik
doğrulaması OpenClaw yapılandırmasından değil, seçilen Node üzerindeki giriş
yapılmış Chrome profilinden gelir.

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

Medya işinden önce ön kontrol çalıştırın:

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
kullanır. Bu toplantı için tutulan her kaydı istediğinizde `--all-conference-records`
iletin.

Calendar araması, Meet yapıtlarını okumadan önce toplantı URL'sini Google Calendar'dan çözümleyebilir:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today`, bugünün `primary` takviminde Google Meet bağlantısı olan bir Calendar
etkinliği arar. Eşleşen etkinlik metnini aramak için `--event <query>`, birincil
olmayan bir takvim için `--calendar <id>` kullanın. Calendar araması, Calendar
etkinlikleri salt okunur kapsamını içeren yeni bir OAuth oturumu gerektirir.
`calendar-events`, eşleşen Meet etkinliklerini önizler ve `latest`, `artifacts`,
`attendance` veya `export` komutunun seçeceği etkinliği işaretler.

Konferans kaydı kimliğini zaten biliyorsanız, doğrudan adresleyin:

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

`artifacts`, Google toplantı için sunduğunda konferans kaydı meta verilerini ve
katılımcı, kayıt, döküm, yapılandırılmış döküm girdisi ve akıllı not kaynak meta
verilerini döndürür. Büyük toplantılarda girdi aramasını atlamak için
`--no-transcript-entries` kullanın. `attendance`, katılımcıları ilk/son görülme
zamanları, toplam oturum süresi, geç/erken ayrılma bayrakları ve oturum açmış
kullanıcıya veya görünen ada göre birleştirilmiş yinelenen katılımcı kaynakları
içeren katılımcı oturumu satırlarına genişletir. Ham katılımcı kaynaklarını ayrı
tutmak için `--no-merge-duplicates`, geç algılamasını ayarlamak için
`--late-after-minutes` ve erken ayrılma algılamasını ayarlamak için
`--early-before-minutes` iletin.

`export`, `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`,
`attendance.json` ve `manifest.json` içeren bir klasör yazar. `manifest.json`,
seçilen girdiyi, dışa aktarma seçeneklerini, konferans kayıtlarını, çıktı
dosyalarını, sayıları, belirteç kaynağını, kullanıldıysa Calendar etkinliğini ve
kısmi alma uyarılarını kaydeder. Klasörün yanına taşınabilir bir arşiv de yazmak
için `--zip` iletin. Bağlı döküm ve akıllı not Google Docs metnini Google Drive
`files.export` üzerinden dışa aktarmak için `--include-doc-bodies` iletin; bu,
Drive Meet salt okunur kapsamını içeren yeni bir OAuth oturumu gerektirir.
`--include-doc-bodies` olmadan dışa aktarmalar yalnızca Meet meta verilerini ve
yapılandırılmış döküm girdilerini içerir. Google akıllı not listeleme, döküm
girdisi veya Drive belge gövdesi hatası gibi kısmi bir yapıt hatası döndürürse,
özet ve manifest tüm dışa aktarmayı başarısız yapmak yerine uyarıyı saklar.
Klasörü veya ZIP'i oluşturmadan aynı yapıt/katılım verilerini getirmek ve
manifest JSON'unu yazdırmak için `--dry-run` kullanın. Bu, büyük bir dışa
aktarma yazmadan önce veya bir aracının yalnızca sayılara, seçilen kayıtlara ve
uyarılara ihtiyaç duyduğu durumlarda kullanışlıdır.

Aracılar aynı paketi `google_meet` aracı üzerinden de oluşturabilir:

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

Korunan canlı duman testini gerçek bir tutulmuş toplantıya karşı çalıştırın:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Canlı duman testi ortamı:

- `OPENCLAW_LIVE_TEST=1` korumalı canlı testleri etkinleştirir.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`, tutulan bir Meet URL'sine, koduna veya
  `spaces/{id}` değerine işaret eder.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` veya `GOOGLE_MEET_CLIENT_ID`, OAuth istemci
  kimliğini sağlar.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` veya `GOOGLE_MEET_REFRESH_TOKEN`, yenileme
  belirtecini sağlar.
- İsteğe bağlı: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ve
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`, `OPENCLAW_` öneki olmadan aynı
  yedek adları kullanır.

Temel yapıt/katılım canlı duman testi
`https://www.googleapis.com/auth/meetings.space.readonly` ve
`https://www.googleapis.com/auth/meetings.conference.media.readonly` gerektirir.
Calendar araması `https://www.googleapis.com/auth/calendar.events.readonly`
gerektirir. Drive belge gövdesi dışa aktarması
`https://www.googleapis.com/auth/drive.meet.readonly` gerektirir.

Yeni bir Meet alanı oluşturun:

```bash
openclaw googlemeet create
```

Komut yeni `meeting uri` değerini, kaynağı ve katılma oturumunu yazdırır. OAuth
kimlik bilgileriyle resmi Google Meet API'sini kullanır. OAuth kimlik bilgileri
olmadan, yedek olarak sabitlenmiş Chrome Node'un oturum açmış tarayıcı profilini
kullanır. Aracılar tek adımda oluşturmak ve katılmak için `google_meet` aracını
`action: "create"` ile kullanabilir. Yalnızca URL oluşturma için `"join": false`
iletin.

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

Tarayıcı yedeği URL'yi oluşturamadan Google oturum açma veya Meet izin engeline
takılırsa, Gateway yöntemi başarısız bir yanıt döndürür ve `google_meet` aracı
düz bir dize yerine yapılandırılmış ayrıntılar döndürür:

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

Bir aracı `manualActionRequired: true` gördüğünde, `manualActionMessage` değerini
tarayıcı Node/sekme bağlamıyla birlikte bildirmeli ve operatör tarayıcı adımını
tamamlayana kadar yeni Meet sekmeleri açmayı durdurmalıdır.

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

Meet oluşturma varsayılan olarak katılır. Chrome veya Chrome Node taşıması,
tarayıcı üzerinden katılmak için yine de oturum açmış bir Google Chrome profiline
ihtiyaç duyar. Profilin oturumu kapalıysa, OpenClaw `manualActionRequired: true`
veya bir tarayıcı yedeği hatası bildirir ve yeniden denemeden önce operatörden
Google oturum açma işlemini tamamlamasını ister.

`preview.enrollmentAcknowledged: true` değerini yalnızca Cloud projenizin, OAuth
sorumlusunun ve toplantı katılımcılarının Meet medya API'leri için Google
Workspace Developer Preview Program'a kaydolduğunu doğruladıktan sonra ayarlayın.

## Yapılandırma

Ortak Chrome gerçek zamanlı yolu yalnızca Plugin'in etkin olmasını, BlackHole,
SoX ve bir arka uç gerçek zamanlı ses sağlayıcı anahtarını gerektirir. OpenAI
varsayılandır; Google Gemini Live kullanmak için `realtime.provider: "google"`
ayarlayın:

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
- `chromeNode.node`: `chrome-node` için isteğe bağlı Node kimliği/adı/IP'si
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: oturumu kapalı Meet misafir ekranında
  kullanılan ad
- `chrome.autoJoin: true`: `chrome-node` üzerinde OpenClaw tarayıcı otomasyonu
  aracılığıyla en iyi çabayla misafir adı doldurma ve Join Now tıklaması
- `chrome.reuseExistingTab: true`: yinelenenleri açmak yerine mevcut bir Meet
  sekmesini etkinleştir
- `chrome.waitForInCallMs: 20000`: gerçek zamanlı giriş tetiklenmeden önce Meet
  sekmesinin çağrıda olduğunu bildirmesini bekle
- `chrome.audioFormat: "pcm16-24khz"`: komut çifti ses biçimi. Yalnızca hâlâ
  telefon sesi yayan eski/özel komut çiftleri için `"g711-ulaw-8khz"` kullanın.
- `chrome.audioInputCommand`: CoreAudio `BlackHole 2ch` üzerinden okuyup
  `chrome.audioFormat` içinde ses yazan SoX komutu
- `chrome.audioOutputCommand`: `chrome.audioFormat` içinde ses okuyup CoreAudio
  `BlackHole 2ch` öğesine yazan SoX komutu
- `chrome.bargeInInputCommand`: yardımcı oynatımı etkinken insan araya girme
  algılaması için imzalı 16 bit küçük uçlu mono PCM yazan isteğe bağlı yerel
  mikrofon komutu. Bu şu anda Gateway barındırmalı `chrome` komut çifti
  köprüsü için geçerlidir.
- `chrome.bargeInRmsThreshold: 650`: `chrome.bargeInInputCommand` üzerinde insan
  kesintisi sayılan RMS seviyesi
- `chrome.bargeInPeakThreshold: 2500`: `chrome.bargeInInputCommand` üzerinde
  insan kesintisi sayılan tepe seviyesi
- `chrome.bargeInCooldownMs: 900`: tekrarlanan insan kesintisi temizlemeleri
  arasındaki minimum gecikme
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: daha derin yanıtlar için `openclaw_agent_consult`
  ile kısa sözlü yanıtlar
- `realtime.introMessage`: gerçek zamanlı köprü bağlandığında kısa sözlü
  hazır olma kontrolü; sessizce katılmak için bunu `""` olarak ayarlayın
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

`voiceCall.enabled` varsayılan olarak `true` değerindedir; Twilio taşımasıyla gerçek PSTN çağrısını, DTMF'yi ve giriş selamlamasını Voice Call Plugin'e devreder. Voice Call, gerçek zamanlı medya akışını açmadan önce DTMF dizisini çalar, ardından kaydedilmiş giriş metnini ilk gerçek zamanlı selamlama olarak kullanır. `voice-call` etkin değilse Google Meet arama planını yine de doğrulayabilir ve kaydedebilir, ancak Twilio çağrısını yapamaz.

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

Chrome Gateway ana makinesinde çalıştığında `transport: "chrome"` kullanın. Chrome, Parallels VM gibi eşleştirilmiş bir Node üzerinde çalıştığında `transport: "chrome-node"` kullanın. Her iki durumda da gerçek zamanlı model ve `openclaw_agent_consult` Gateway ana makinesinde çalışır, böylece model kimlik bilgileri orada kalır.

Etkin oturumları listelemek veya bir oturum kimliğini incelemek için `action: "status"` kullanın. Gerçek zamanlı ajanın hemen konuşmasını sağlamak için `sessionId` ve `message` ile `action: "speak"` kullanın. Oturumu oluşturmak veya yeniden kullanmak, bilinen bir ifadeyi tetiklemek ve Chrome ana makinesi raporlayabildiğinde `inCall` sağlığını döndürmek için `action: "test_speech"` kullanın. `test_speech` her zaman `mode: "realtime"` zorlar ve `mode: "transcribe"` ile çalıştırılması istenirse başarısız olur; çünkü yalnızca gözlem oturumları kasıtlı olarak konuşma yayımlayamaz. `speechOutputVerified` sonucu, bu test çağrısı sırasında gerçek zamanlı ses çıkışı baytlarının artmasına dayanır; bu yüzden eski sese sahip yeniden kullanılan bir oturum yeni ve başarılı bir konuşma denetimi sayılmaz. Bir oturumu sona ermiş olarak işaretlemek için `action: "leave"` kullanın.

`status`, kullanılabilir olduğunda Chrome sağlığını içerir:

- `inCall`: Chrome Meet çağrısının içinde görünüyor
- `micMuted`: en iyi çabayla belirlenen Meet mikrofon durumu
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: konuşmanın çalışabilmesi için tarayıcı profilinde elle oturum açma, Meet sahibi tarafından kabul, izinler veya tarayıcı denetimi onarımı gerekir
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: yönetilen Chrome konuşmasına şu anda izin verilip verilmediği. `speechReady: false`, OpenClaw'ın giriş/test ifadesini ses köprüsüne göndermediği anlamına gelir.
- `providerConnected` / `realtimeReady`: gerçek zamanlı ses köprüsü durumu
- `lastInputAt` / `lastOutputAt`: köprüden görülen veya köprüye gönderilen son ses
- `lastSuppressedInputAt` / `suppressedInputBytes`: asistan oynatımı etkinken yok sayılan loopback girişi

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Gerçek Zamanlı Ajan Danışması

Chrome gerçek zamanlı modu canlı bir ses döngüsü için optimize edilmiştir. Gerçek zamanlı ses sağlayıcısı toplantı sesini duyar ve yapılandırılmış ses köprüsü üzerinden konuşur. Gerçek zamanlı model daha derin akıl yürütmeye, güncel bilgiye veya normal OpenClaw araçlarına ihtiyaç duyduğunda `openclaw_agent_consult` çağırabilir.

Danışma aracı, son toplantı transkripti bağlamıyla birlikte arka planda normal OpenClaw ajanını çalıştırır ve gerçek zamanlı ses oturumuna kısa, sözlü bir yanıt döndürür. Ses modeli daha sonra bu yanıtı toplantıya konuşabilir. Voice Call ile aynı paylaşılan gerçek zamanlı danışma aracını kullanır.

Varsayılan olarak danışmalar `main` ajanına karşı çalışır. Bir Meet hattı özel bir OpenClaw ajan çalışma alanına, model varsayılanlarına, araç politikasına, belleğe ve oturum geçmişine danışmalıysa `realtime.agentId` ayarlayın.

`realtime.toolPolicy` danışma çalıştırmasını denetler:

- `safe-read-only`: danışma aracını açığa çıkarır ve normal ajanı `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` ve `memory_get` ile sınırlar.
- `owner`: danışma aracını açığa çıkarır ve normal ajanın normal ajan araç politikasını kullanmasına izin verir.
- `none`: danışma aracını gerçek zamanlı ses modeline açığa çıkarmaz.

Danışma oturumu anahtarı her Meet oturumu için kapsamlanır, böylece takip danışma çağrıları aynı toplantı sırasında önceki danışma bağlamını yeniden kullanabilir.

Chrome çağrıya tamamen katıldıktan sonra sözlü bir hazır olma denetimini zorlamak için:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Tam katılma-ve-konuşma smoke testi için:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Canlı Test Kontrol Listesi

Bir toplantıyı gözetimsiz bir ajana devretmeden önce şu sırayı kullanın:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Beklenen Chrome-node durumu:

- `googlemeet setup` tamamen yeşildir.
- Varsayılan taşıma Chrome-node olduğunda veya bir Node sabitlendiğinde `googlemeet setup` `chrome-node-connected` içerir.
- `nodes status` seçili Node'un bağlı olduğunu gösterir.
- Seçili Node hem `googlemeet.chrome` hem de `browser.proxy` duyurur.
- Meet sekmesi çağrıya katılır ve `test-speech`, `inCall: true` ile Chrome sağlığını döndürür.

Parallels macOS VM gibi uzak bir Chrome ana makinesi için Gateway veya VM güncellendikten sonraki en kısa güvenli denetim şudur:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Bu, bir ajan gerçek bir toplantı sekmesi açmadan önce Gateway Plugin'in yüklendiğini, VM Node'unun geçerli belirteçle bağlı olduğunu ve Meet ses köprüsünün kullanılabilir olduğunu kanıtlar.

Twilio smoke testi için telefonla arama ayrıntılarını gösteren bir toplantı kullanın:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Beklenen Twilio durumu:

- `googlemeet setup` yeşil `twilio-voice-call-plugin`, `twilio-voice-call-credentials` ve `twilio-voice-call-webhook` denetimlerini içerir.
- Gateway yeniden yüklendikten sonra CLI'da `voicecall` kullanılabilir.
- Döndürülen oturumda `transport: "twilio"` ve bir `twilio.voiceCallId` vardır.
- `openclaw logs --follow`, gerçek zamanlı TwiML'den önce sunulan DTMF TwiML'i ve ardından ilk selamlamanın kuyruğa alındığı bir gerçek zamanlı köprüyü gösterir.
- `googlemeet leave <sessionId>` devredilen sesli çağrıyı kapatır.

## Sorun Giderme

### Ajan Google Meet Aracını Göremiyor

Plugin'in Gateway yapılandırmasında etkin olduğunu doğrulayın ve Gateway'i yeniden yükleyin:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

`plugins.entries.google-meet` öğesini yeni düzenlediyseniz Gateway'i yeniden başlatın veya yeniden yükleyin. Çalışan ajan yalnızca geçerli Gateway işlemi tarafından kaydedilen Plugin araçlarını görür.

### Bağlı Google Meet Yeteneğine Sahip Node Yok

Node ana makinesinde çalıştırın:

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

Node bağlı olmalı ve `googlemeet.chrome` ile `browser.proxy` öğelerini listelemelidir. Gateway yapılandırması bu Node komutlarına izin vermelidir:

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

### Tarayıcı Açılıyor Ama Ajan Katılamıyor

`googlemeet test-speech` çalıştırın ve döndürülen Chrome sağlığını inceleyin. `manualActionRequired: true` bildirirse operatöre `manualActionMessage` gösterin ve tarayıcı işlemi tamamlanana kadar yeniden denemeyi durdurun.

Yaygın elle yapılacak işlemler:

- Chrome profilinde oturum açın.
- Konuğu Meet sahibi hesabından kabul edin.
- Chrome'un yerel izin istemi göründüğünde Chrome mikrofon/kamera izinlerini verin.
- Takılı kalmış bir Meet izin iletişim kutusunu kapatın veya onarın.

Meet yalnızca "Do you want people to hear you in the meeting?" gösterdiği için "oturum açılmamış" bildirmeyin. Bu, Meet'in ses seçimi ara ekranıdır; OpenClaw uygun olduğunda tarayıcı otomasyonuyla **Use microphone** seçeneğine tıklar ve gerçek toplantı durumunu beklemeye devam eder. Yalnızca oluşturma tarayıcı geri dönüşü için OpenClaw **Continue without microphone** seçeneğine tıklayabilir, çünkü URL oluşturmak gerçek zamanlı ses yoluna ihtiyaç duymaz.

### Toplantı Oluşturma Başarısız Oluyor

`googlemeet create`, OAuth kimlik bilgileri yapılandırıldığında önce Google Meet API `spaces.create` uç noktasını kullanır. OAuth kimlik bilgileri olmadan sabitlenmiş Chrome Node tarayıcısına geri döner. Doğrulayın:

- API oluşturma için: `oauth.clientId` ve `oauth.refreshToken` yapılandırılmıştır veya eşleşen `OPENCLAW_GOOGLE_MEET_*` ortam değişkenleri vardır.
- API oluşturma için: yenileme belirteci, oluşturma desteği eklendikten sonra üretilmiştir. Eski belirteçlerde `meetings.space.created` kapsamı eksik olabilir; `openclaw googlemeet auth login --json` komutunu yeniden çalıştırın ve Plugin yapılandırmasını güncelleyin.
- Tarayıcı geri dönüşü için: `defaultTransport: "chrome-node"` ve `chromeNode.node`, `browser.proxy` ve `googlemeet.chrome` özelliklerine sahip bağlı bir Node'u gösterir.
- Tarayıcı geri dönüşü için: o Node üzerindeki OpenClaw Chrome profili Google'da oturum açmıştır ve `https://meet.google.com/new` adresini açabilir.
- Tarayıcı geri dönüşü için: yeniden denemeler yeni bir sekme açmadan önce mevcut bir `https://meet.google.com/new` veya Google hesabı istem sekmesini yeniden kullanır. Bir ajan zaman aşımına uğrarsa başka bir Meet sekmesini elle açmak yerine araç çağrısını yeniden deneyin.
- Tarayıcı geri dönüşü için: araç `manualActionRequired: true` döndürürse operatörü yönlendirmek için döndürülen `browser.nodeId`, `browser.targetId`, `browserUrl` ve `manualActionMessage` değerlerini kullanın. Bu işlem tamamlanana kadar döngü içinde yeniden denemeyin.
- Tarayıcı geri dönüşü için: Meet "Do you want people to hear you in the meeting?" gösterirse sekmeyi açık bırakın. OpenClaw, tarayıcı otomasyonu üzerinden **Use microphone** seçeneğine veya yalnızca oluşturma geri dönüşü için **Continue without microphone** seçeneğine tıklamalı ve oluşturulan Meet URL'sini beklemeye devam etmelidir. Bunu yapamazsa hata `google-login-required` değil, `meet-audio-choice-required` belirtmelidir.

### Ajan Katılıyor Ama Konuşmuyor

Gerçek zamanlı yolu denetleyin:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Listen/talk-back için `mode: "realtime"` kullanın. `mode: "transcribe"` bilerek duplex realtime ses köprüsünü başlatmaz. `googlemeet test-speech` her zaman realtime yolunu denetler ve o çağrı için köprü çıkış baytlarının gözlemlenip gözlemlenmediğini bildirir. `speechOutputVerified` false ve `speechOutputTimedOut` true ise realtime sağlayıcı utterance'ı kabul etmiş olabilir, ancak OpenClaw yeni çıkış baytlarının Chrome ses köprüsüne ulaştığını görmemiştir.

Ayrıca şunları doğrulayın:

- Gateway host'unda `OPENAI_API_KEY` veya `GEMINI_API_KEY` gibi bir realtime sağlayıcı anahtarı kullanılabilir durumda.
- `BlackHole 2ch` Chrome host'unda görünür durumda.
- `sox` Chrome host'unda mevcut.
- Meet mikrofonu ve hoparlörü OpenClaw tarafından kullanılan sanal ses yolu üzerinden yönlendiriliyor.

`googlemeet doctor [session-id]` oturumu, node'u, görüşme içi durumu, manuel işlem nedenini, realtime sağlayıcı bağlantısını, `realtimeReady`, ses giriş/çıkış etkinliğini, son ses zaman damgalarını, bayt sayaçlarını ve tarayıcı URL'sini yazdırır. Ham JSON'a ihtiyaç duyduğunuzda `googlemeet status [session-id] --json` kullanın. Token'ları açığa çıkarmadan Google Meet OAuth yenilemeyi doğrulamanız gerektiğinde `googlemeet doctor --oauth` kullanın; ayrıca Google Meet API kanıtına ihtiyaç duyduğunuzda `--meeting` veya `--create-space` ekleyin.

Bir agent zaman aşımına uğradıysa ve zaten açık bir Meet sekmesi görüyorsanız, başka bir sekme açmadan o sekmeyi inceleyin:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Eşdeğer araç eylemi `recover_current_tab` şeklindedir. Seçili taşıma için mevcut bir Meet sekmesine odaklanır ve onu inceler. `chrome` ile Gateway üzerinden local tarayıcı kontrolünü kullanır; `chrome-node` ile yapılandırılmış Chrome node'unu kullanır. Yeni bir sekme açmaz veya yeni bir oturum oluşturmaz; oturum açma, kabul, izinler ya da ses seçimi durumu gibi mevcut engelleyiciyi bildirir. CLI komutu yapılandırılmış Gateway ile konuşur, bu yüzden Gateway çalışıyor olmalıdır; `chrome-node` ayrıca Chrome node'unun bağlı olmasını gerektirir.

### Twilio kurulum denetimleri başarısız oluyor

`voice-call` izinli veya etkin olmadığında `twilio-voice-call-plugin` başarısız olur. Bunu `plugins.allow` içine ekleyin, `plugins.entries.voice-call` öğesini etkinleştirin ve Gateway'i yeniden yükleyin.

Twilio arka ucunda account SID, auth token veya arayan numara eksik olduğunda `twilio-voice-call-credentials` başarısız olur. Bunları Gateway host'unda ayarlayın:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call` için herkese açık Webhook açığa çıkarma olmadığında veya `publicUrl` loopback ya da özel ağ alanını gösterdiğinde `twilio-voice-call-webhook` başarısız olur. `plugins.entries.voice-call.config.publicUrl` değerini herkese açık sağlayıcı URL'sine ayarlayın veya bir `voice-call` tüneli/Tailscale açığa çıkarması yapılandırın.

Loopback ve özel URL'ler taşıyıcı callback'leri için geçerli değildir. `publicUrl` olarak `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` veya `fd00::/8` kullanmayın.

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

Local geliştirme için özel host URL'si yerine bir tünel veya Tailscale açığa çıkarması kullanın:

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

`voicecall smoke` varsayılan olarak yalnızca hazırlık denetimidir. Belirli bir numara için dry-run yapmak üzere:

```bash
openclaw voicecall smoke --to "+15555550123"
```

`--yes` bayrağını yalnızca bilerek canlı bir giden bildirim araması yapmak istediğinizde ekleyin:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio araması başlıyor ancak toplantıya hiç girmiyor

Meet etkinliğinin telefonla arama ayrıntılarını sunduğunu doğrulayın. Tam dial-in numarasını ve PIN'i veya özel bir DTMF dizisini iletin:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Sağlayıcının PIN girilmeden önce bir duraklamaya ihtiyacı varsa `--dtmf-sequence` içinde başta `w` veya virgüller kullanın.

Telefon araması oluşturuluyor ancak Meet katılımcı listesi dial-in katılımcısını hiç göstermiyorsa:

- `openclaw voicecall status --call-id <id>` çalıştırın ve aramanın hâlâ aktif olduğunu doğrulayın.
- `openclaw voicecall tail` çalıştırın ve Twilio Webhook'larının Gateway'e ulaştığını kontrol edin.
- `openclaw logs --follow` çalıştırın ve Twilio Meet sırasını arayın: Google Meet katılımı devreder, Voice Call ön bağlantı DTMF TwiML'ini depolar, bu ilk TwiML'i sunar, ardından realtime TwiML sunar ve realtime köprüsünü `initialGreeting=queued` ile başlatır.
- `openclaw googlemeet setup --transport twilio` komutunu yeniden çalıştırın; yeşil bir kurulum denetimi gereklidir ancak toplantı PIN sırasının doğru olduğunu kanıtlamaz.
- Dial-in numarasının PIN ile aynı Meet davetine ve bölgesine ait olduğunu doğrulayın.
- Meet yavaş yanıt veriyorsa `--dtmf-sequence` içindeki baştaki duraklamaları artırın, örneğin `wwww123456#`.
- Katılımcı katılıyor ama greeting'i duymuyorsanız realtime TwiML, realtime köprü başlangıcı ve `initialGreeting=queued` için `openclaw logs --follow` çıktısını kontrol edin. Greeting, realtime köprüsü bağlandıktan sonra ilk `voicecall.start` mesajından üretilir.

Webhook'lar ulaşmıyorsa önce Voice Call Plugin'inde hata ayıklayın: sağlayıcı `plugins.entries.voice-call.config.publicUrl` değerine veya yapılandırılmış tünele ulaşmalıdır. Bkz. [Sesli arama sorunlarını giderme](/tr/plugins/voice-call#troubleshooting).

## Notlar

Google Meet'in resmi medya API'si alma odaklıdır, bu yüzden bir Meet aramasında konuşmak hâlâ bir katılımcı yolu gerektirir. Bu Plugin bu sınırı görünür tutar: Chrome tarayıcı katılımını ve local ses yönlendirmesini yönetir; Twilio telefonla dial-in katılımını yönetir.

Chrome realtime modu `BlackHole 2ch` ve ayrıca şunlardan birini gerektirir:

- `chrome.audioInputCommand` artı `chrome.audioOutputCommand`: OpenClaw realtime model köprüsüne sahip olur ve bu komutlar ile seçili realtime ses sağlayıcı arasında sesi `chrome.audioFormat` biçiminde pipe eder. Varsayılan Chrome yolu 24 kHz PCM16'dır; 8 kHz G.711 mu-law eski komut çiftleri için kullanılabilir kalır.
- `chrome.audioBridgeCommand`: harici bir köprü komutu tüm local ses yoluna sahip olur ve daemon'unu başlattıktan veya doğruladıktan sonra çıkmalıdır.

Temiz duplex ses için Meet çıkışını ve Meet mikrofonunu ayrı sanal cihazlar ya da Loopback tarzı bir sanal cihaz grafiği üzerinden yönlendirin. Tek bir paylaşımlı BlackHole cihazı diğer katılımcıları aramaya geri yankılayabilir.

Komut çifti Chrome köprüsüyle `chrome.bargeInInputCommand` ayrı bir local mikrofonu dinleyebilir ve insan konuşmaya başladığında assistant oynatmasını temizleyebilir. Bu, paylaşımlı BlackHole loopback girişi assistant oynatması sırasında geçici olarak bastırıldığında bile insan konuşmasını assistant çıkışının önünde tutar. `chrome.audioInputCommand` ve `chrome.audioOutputCommand` gibi bu da operatör tarafından yapılandırılan bir local komuttur. Açık bir güvenilir komut yolu veya bağımsız değişken listesi kullanın ve bunu güvenilmeyen konumlardaki script'lere yönlendirmeyin.

`googlemeet speak` bir Chrome oturumu için aktif realtime ses köprüsünü tetikler. `googlemeet leave` bu köprüyü durdurur. Voice Call Plugin'i üzerinden devredilen Twilio oturumlarında `leave` alttaki sesli aramayı da kapatır.

## İlgili

- [Voice call Plugin'i](/tr/plugins/voice-call)
- [Konuşma modu](/tr/nodes/talk)
- [Plugin oluşturma](/tr/plugins/building-plugins)
