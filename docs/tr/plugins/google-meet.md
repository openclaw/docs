---
read_when:
    - Bir OpenClaw aracısının Google Meet aramasına katılmasını istiyorsunuz
    - Bir OpenClaw aracısının yeni bir Google Meet araması oluşturmasını istiyorsunuz
    - Google Meet taşıması olarak Chrome, Chrome Node veya Twilio yapılandırıyorsunuz
summary: 'Google Meet Plugin’i: gerçek zamanlı ses varsayılanlarıyla açık Meet URL’lerine Chrome veya Twilio üzerinden katılma'
title: Google Meet Plugin’i
x-i18n:
    generated_at: "2026-04-26T11:36:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bd53db711e4729a9a7b18f7aaa3eedffd71a1e19349fc858537652b5d17cfcb
    source_path: plugins/google-meet.md
    workflow: 15
---

OpenClaw için Google Meet katılımcı desteği — Plugin tasarım gereği açık davranır:

- Yalnızca açık bir `https://meet.google.com/...` URL’sine katılır.
- Google Meet API üzerinden yeni bir Meet alanı oluşturabilir, sonra dönen
  URL’ye katılabilir.
- Varsayılan mod `realtime` sestir.
- Realtime ses, daha derin reasoning veya araçlar gerektiğinde tekrar tam OpenClaw aracısına dönebilir.
- Aracılar katılma davranışını `mode` ile seçer: canlı dinleme/geri konuşma için `realtime`,
  realtime ses köprüsü olmadan tarayıcıyı katmak/denetlemek için `transcribe`.
- Auth, kişisel Google OAuth veya zaten oturum açılmış bir Chrome profili olarak başlar.
- Otomatik rıza duyurusu yoktur.
- Varsayılan Chrome ses arka ucu `BlackHole 2ch`’dir.
- Chrome yerelde veya eşleştirilmiş bir Node ana makinesinde çalışabilir.
- Twilio bir çevirmeli giriş numarası ve isteğe bağlı PIN veya DTMF dizisi kabul eder.
- CLI komutu `googlemeet`’tir; `meet`, daha geniş aracı telekonferans iş akışları için ayrılmıştır.

## Hızlı başlangıç

Yerel ses bağımlılıklarını kurun ve bir arka uç realtime ses
sağlayıcısı yapılandırın. Varsayılan OpenAI’dir; Google Gemini Live da
`realtime.provider: "google"` ile çalışır:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# veya
export GEMINI_API_KEY=...
```

`blackhole-2ch`, `BlackHole 2ch` sanal ses aygıtını kurar. Homebrew yükleyicisi,
macOS’un aygıtı göstermesinden önce yeniden başlatma ister:

```bash
sudo reboot
```

Yeniden başlattıktan sonra iki parçayı da doğrulayın:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Plugin’i etkinleştirin:

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

Kurulum çıktısı aracı tarafından okunabilir olacak şekilde tasarlanmıştır. Chrome profili,
ses köprüsü, Node sabitleme, gecikmeli realtime giriş ve Twilio delegation
yapılandırılmışsa `voice-call` Plugin’i ile Twilio kimlik bilgilerinin hazır olup olmadığını bildirir.
Herhangi bir `ok: false` denetimini, bir aracıdan katılmasını istemeden önce engel olarak değerlendirin.
Script’ler veya makine tarafından okunabilir çıktı için `openclaw googlemeet setup --json` kullanın.
Bir aracının denemesinden önce belirli bir taşımayı ön kontrolden geçirmek için `--transport chrome`, `--transport chrome-node` veya `--transport twilio`
kullanın.

Bir toplantıya katılın:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Veya bir aracının `google_meet` aracı üzerinden katılmasına izin verin:

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

Yalnızca URL’yi oluşturup katılmamak için:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` komutunun iki yolu vardır:

- API ile oluşturma: Google Meet OAuth kimlik bilgileri yapılandırıldığında kullanılır. Bu,
  en deterministik yoldur ve tarayıcı UI durumuna bağlı değildir.
- Tarayıcı geri dönüşü: OAuth kimlik bilgileri yokken kullanılır. OpenClaw sabitlenmiş
  Chrome Node’unu kullanır, `https://meet.google.com/new` adresini açar, Google’ın
  gerçek bir toplantı kodu URL’sine yönlendirmesini bekler, sonra bu URL’yi döndürür. Bu yol,
  Node üzerindeki OpenClaw Chrome profilinin Google’da zaten oturum açmış olmasını gerektirir.
  Tarayıcı otomasyonu, Meet’in kendi ilk çalıştırma mikrofon istemini işler; bu istem
  Google oturum açma hatası olarak değerlendirilmez.
  Katılma ve oluşturma akışları ayrıca yenisini açmadan önce mevcut bir Meet sekmesini yeniden kullanmayı dener.
  Eşleştirme, `authuser` gibi zararsız URL sorgu dizelerini yok sayar; böylece aracı yeniden denemesi
  ikinci bir Chrome sekmesi oluşturmak yerine zaten açık olan toplantıya odaklanmalıdır.

Komut/araç çıktısı bir `source` alanı (`api` veya `browser`) içerir; böylece aracılar
hangi yolun kullanıldığını açıklayabilir. `create`, varsayılan olarak yeni toplantıya katılır ve
`joined: true` ile katılım oturumunu döndürür. Yalnızca URL oluşturmak için CLI’de
`create --no-join` kullanın veya araca `"join": false` verin.

Veya aracıya şöyle deyin: “Bir Google Meet oluştur, realtime sesle katıl ve
bağlantıyı bana gönder.” Aracı `action: "create"` ile `google_meet` çağırmalı ve
sonra dönen `meetingUri` değerini paylaşmalıdır.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Yalnızca gözlem/tarayıcı denetimi için katılım istiyorsanız `"mode": "transcribe"` ayarlayın. Bu,
çift yönlü realtime model köprüsünü başlatmaz; dolayısıyla toplantıya geri konuşmaz.

Realtime oturumları sırasında `google_meet` durumu, `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, son giriş/çıkış
zaman damgaları, bayt sayaçları ve köprü kapalı durumu gibi tarayıcı ve ses köprüsü
sağlığını içerir. Güvenli bir Meet sayfası istemi görünürse, tarayıcı otomasyonu
mümkün olduğunda bunu işler. Oturum açma, ev sahibi kabulü ve tarayıcı/OS izin istemleri
aracının iletmesi için bir neden ve mesajla birlikte manuel eylem olarak raporlanır.

Chrome, oturum açılmış Chrome profili olarak katılır. Meet içinde,
OpenClaw’ın kullandığı mikrofon/hoparlör yolu için `BlackHole 2ch` seçin. Temiz çift yönlü ses için
ayrı sanal aygıtlar veya Loopback benzeri bir grafik kullanın; tek bir BlackHole aygıtı
ilk smoke test için yeterlidir ama yankı yapabilir.

### Yerel Gateway + Parallels Chrome

Bir macOS VM’in yalnızca Chrome’a sahip olması için VM içinde tam bir OpenClaw Gateway veya model API anahtarı
gerekmez. Gateway ve aracıyı yerelde çalıştırın, ardından VM içinde bir
Node ana makinesi çalıştırın. Paketlenmiş Plugin’i VM’de bir kez etkinleştirin ki Node
Chrome komutunu ilan etsin:

Neyin nerede çalıştığı:

- Gateway ana makinesi: OpenClaw Gateway, aracı çalışma alanı, model/API anahtarları, realtime
  sağlayıcısı ve Google Meet Plugin config’i.
- Parallels macOS VM: OpenClaw CLI/Node ana makinesi, Google Chrome, SoX, BlackHole 2ch,
  ve Google’da oturum açılmış bir Chrome profili.
- VM içinde gerekmeyenler: Gateway servisi, aracı config’i, OpenAI/GPT anahtarı veya model
  sağlayıcı kurulumu.

VM bağımlılıklarını kurun:

```bash
brew install blackhole-2ch sox
```

macOS’un `BlackHole 2ch` aygıtını göstermesi için BlackHole kurulumundan sonra VM’i yeniden başlatın:

```bash
sudo reboot
```

Yeniden başlattıktan sonra VM’in ses aygıtını ve SoX komutlarını görebildiğini doğrulayın:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

VM içinde OpenClaw’ı kurun veya güncelleyin, ardından paketlenmiş Plugin’i orada etkinleştirin:

```bash
openclaw plugins enable google-meet
```

VM içinde Node ana makinesini başlatın:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` bir LAN IP’siyse ve TLS kullanmıyorsanız, bu güvenilen özel ağ için açıkça katılmazsanız
Node düz metin WebSocket’i reddeder:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Node’u LaunchAgent olarak kurarken de aynı ortam değişkenini kullanın:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`, bir `openclaw.json`
ayarından değil, süreç ortamındandır. `openclaw node install`, kurulum komutunda
mevcut olduğunda bunu LaunchAgent ortamına kaydeder.

Node’u Gateway ana makinesinden onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway’in Node’u gördüğünü ve hem `googlemeet.chrome`
hem de tarayıcı yeteneği/`browser.proxy` ilan ettiğini doğrulayın:

```bash
openclaw nodes status
```

Meet’i Gateway ana makinesinde o Node üzerinden yönlendirin:

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

Artık Gateway ana makinesinden normal şekilde katılın:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

veya aracıdan `transport: "chrome-node"` ile `google_meet` aracını kullanmasını isteyin.

Bir oturum oluşturan veya yeniden kullanan, bilinen bir
ifadeyi söyleyen ve oturum sağlığını yazdıran tek komutluk smoke test için:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Katılım sırasında OpenClaw tarayıcı otomasyonu konuk adını doldurur, Join/Ask
to join düğmesine tıklar ve istem göründüğünde Meet’in ilk çalıştırma “Use microphone” seçimini kabul eder.
Yalnızca tarayıcıyla toplantı oluşturma sırasında, Meet mikrofon düğmesini sunmazsa
mikrofonsuz olarak aynı istemi aşmaya da devam edebilir.
Tarayıcı profili oturum açmamışsa, Meet ev sahibi
kabulünü bekliyorsa, Chrome mikrofon/kamera iznine ihtiyaç duyuyorsa veya Meet
otomasyonun çözemediği bir istemde takılıysa, katılım/test-speech sonucu
`manualActionRequired: true` ile birlikte `manualActionReason` ve
`manualActionMessage` raporlar. Aracılar katılımı yeniden denemeyi bırakmalı,
bu tam mesajı mevcut `browserUrl`/`browserTitle` ile birlikte bildirmeli ve yalnızca
manuel tarayıcı eylemi tamamlandıktan sonra yeniden denemelidir.

`chromeNode.node` atlanırsa OpenClaw yalnızca tam olarak bir
bağlı Node hem `googlemeet.chrome` hem de tarayıcı denetimi ilan ettiğinde otomatik seçim yapar. Birkaç
uygun Node bağlıysa `chromeNode.node` değerini Node kimliğine,
görüntü adına veya uzak IP’ye ayarlayın.

Yaygın hata denetimleri:

- `Configured Google Meet node ... is not usable: offline`: sabitlenmiş Node
  Gateway tarafından biliniyor ama kullanılamıyor. Aracılar bu Node’u
  kullanılabilir bir Chrome ana makinesi olarak değil, tanısal durum olarak ele almalı ve
  kullanıcı bunu istemedikçe başka bir taşıma yöntemine geri dönmek yerine kurulum engelini
  raporlamalıdır.
- `No connected Google Meet-capable node`: VM içinde `openclaw node run`
  başlatın, eşleştirmeyi onaylayın ve VM içinde `openclaw plugins enable google-meet` ile
  `openclaw plugins enable browser` komutlarının çalıştırıldığından emin olun. Ayrıca
  Gateway ana makinesinin şu komutlarla her iki Node komutuna da izin verdiğini doğrulayın:
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: denetlenen ana makineye `blackhole-2ch`
  kurun ve yerel Chrome sesini kullanmadan önce yeniden başlatın.
- `BlackHole 2ch audio device not found on the node`: `blackhole-2ch`
  paketini VM’e kurun ve VM’i yeniden başlatın.
- Chrome açılıyor ama katılamıyor: VM içindeki tarayıcı profiline oturum açın veya
  konuk katılımı için `chrome.guestName` ayarını koruyun. Konuk otomatik katılımı, Node tarayıcı proxy’si üzerinden OpenClaw
  tarayıcı otomasyonunu kullanır; Node tarayıcı
  config’inin istediğiniz profile işaret ettiğinden emin olun; örneğin
  `browser.defaultProfile: "user"` veya adlandırılmış bir mevcut-oturum profili.
- Yinelenen Meet sekmeleri: `chrome.reuseExistingTab: true` ayarını etkin bırakın. OpenClaw,
  yenisini açmadan önce aynı Meet URL’si için mevcut bir sekmeyi etkinleştirir ve
  tarayıcıyla toplantı oluşturma, başka bir sekme açmadan önce ilerlemekte olan bir `https://meet.google.com/new`
  veya Google hesap istemi sekmesini yeniden kullanır.
- Ses yok: Meet içinde mikrofon/hoparlörü OpenClaw’ın kullandığı sanal ses aygıtı
  yoluna yönlendirin; temiz çift yönlü ses için ayrı sanal aygıtlar veya Loopback benzeri yönlendirme kullanın.

## Kurulum notları

Chrome realtime varsayılanı iki harici araç kullanır:

- `sox`: komut satırı ses yardımcı programı. Plugin varsayılan 8 kHz G.711 mu-law ses köprüsü için
  `rec` ve `play` komutlarını kullanır.
- `blackhole-2ch`: macOS sanal ses sürücüsü. Chrome/Meet’in
  yönlendirebildiği `BlackHole 2ch` ses aygıtını oluşturur.

OpenClaw bu paketlerin hiçbirini paketlemez veya yeniden dağıtmaz. Belgeler
kullanıcılardan bunları Homebrew üzerinden ana makine bağımlılığı olarak
kurmalarını ister. SoX `LGPL-2.0-only AND GPL-2.0-only`; BlackHole ise GPL-3.0 lisanslıdır. OpenClaw ile birlikte BlackHole’u paketleyen bir
yükleyici veya cihaz oluşturursanız BlackHole’un upstream lisans koşullarını gözden geçirin
veya Existential Audio’dan ayrı bir lisans alın.

## Taşıma yöntemleri

### Chrome

Chrome taşıması Meet URL’sini Google Chrome’da açar ve oturum açılmış
Chrome profili olarak katılır. macOS’ta Plugin başlatmadan önce `BlackHole 2ch` olup olmadığını kontrol eder.
Yapılandırılmışsa Chrome’u açmadan önce bir ses köprüsü sağlık komutu ve başlangıç komutu da çalıştırır.
Chrome/ses Gateway ana makinesinde yaşıyorsa `chrome` kullanın;
Chrome/ses Parallels macOS VM gibi eşleştirilmiş bir Node’da yaşıyorsa `chrome-node` kullanın.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome mikrofon ve hoparlör sesini yerel OpenClaw ses
köprüsü üzerinden yönlendirin. `BlackHole 2ch` kurulu değilse katılım,
sessizce ses yolu olmadan katılmak yerine bir kurulum hatasıyla başarısız olur.

### Twilio

Twilio taşıması, Voice Call Plugin’ine devredilen katı bir çevirme planıdır. Meet sayfalarını
telefon numaraları için ayrıştırmaz.

Chrome katılımı yoksa veya telefonla arama geri dönüşü istiyorsanız bunu kullanın.
Google Meet toplantı için bir telefonla arama numarası ve PIN sunmalıdır;
OpenClaw bunları Meet sayfasından keşfetmez.

Voice Call Plugin’ini Chrome Node’da değil, Gateway ana makinesinde etkinleştirin:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // veya varsayılan Twilio olacaksa "twilio" ayarlayın
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

Twilio kimlik bilgilerini ortam veya config üzerinden sağlayın. Ortam,
gizli bilgileri `openclaw.json` dışında tutar:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call` etkinleştirildikten sonra Gateway’i yeniden başlatın veya yeniden yükleyin; Plugin config değişiklikleri
zaten çalışan bir Gateway sürecinde yeniden yüklenene kadar görünmez.

Ardından doğrulayın:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio delegation bağlandığında `googlemeet setup`,
başarılı `twilio-voice-call-plugin` ve `twilio-voice-call-credentials` denetimlerini içerir.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Toplantı özel bir dizi gerektiriyorsa `--dtmf-sequence` kullanın:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth ve ön kontrol

Meet bağlantısı oluşturmak için OAuth isteğe bağlıdır; çünkü `googlemeet create`
tarayıcı otomasyonuna geri dönebilir. Resmî API ile oluşturma,
alan çözümleme veya Meet Media API ön kontrol denetimleri istediğinizde OAuth yapılandırın.

Google Meet API erişimi kullanıcı OAuth kullanır: bir Google Cloud OAuth istemcisi oluşturun,
gerekli kapsamları isteyin, bir Google hesabına yetki verin, sonra oluşan
refresh token’ı Google Meet Plugin config’inde saklayın veya
`OPENCLAW_GOOGLE_MEET_*` ortam değişkenlerini sağlayın.

OAuth, Chrome katılım yolunun yerini almaz. Chrome ve Chrome-node taşımaları
tarayıcı katılımı kullandığınızda yine oturum açılmış Chrome profili, BlackHole/SoX
ve bağlı bir Node üzerinden katılır. OAuth yalnızca resmî Google
Meet API yolu içindir: toplantı alanları oluşturma, alan çözümleme ve Meet Media API
ön kontrol denetimlerini çalıştırma.

### Google kimlik bilgileri oluşturma

Google Cloud Console’da:

1. Bir Google Cloud projesi oluşturun veya seçin.
2. Bu proje için **Google Meet REST API**’yi etkinleştirin.
3. OAuth onay ekranını yapılandırın.
   - **Internal**, bir Google Workspace organizasyonu için en kolay yoldur.
   - **External**, kişisel/test kurulumları için çalışır; uygulama Testing durumundayken
     uygulamaya yetki verecek her Google hesabını test kullanıcısı olarak ekleyin.
4. OpenClaw’ın istediği kapsamları ekleyin:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Bir OAuth client ID oluşturun.
   - Uygulama türü: **Web application**.
   - Yetkili yönlendirme URI’si:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Client ID ve client secret değerlerini kopyalayın.

`meetings.space.created`, Google Meet `spaces.create` için gereklidir.
`meetings.space.readonly`, OpenClaw’ın Meet URL’lerini/kodlarını alanlara çözümlemesini sağlar.
`meetings.conference.media.readonly`, Meet Media API ön kontrolü ve medya
işleri içindir; Google gerçek Media API kullanımı için Developer Preview kaydı isteyebilir.
Yalnızca tarayıcı tabanlı Chrome katılımına ihtiyacınız varsa OAuth’u tamamen atlayın.

### Refresh token oluşturma

`oauth.clientId` ve isteğe bağlı olarak `oauth.clientSecret` yapılandırın veya bunları
ortam değişkenleri olarak verin, sonra şunu çalıştırın:

```bash
openclaw googlemeet auth login --json
```

Komut, bir refresh token içeren `oauth` config bloğunu yazdırır. PKCE,
`http://localhost:8085/oauth2callback` üzerinde localhost callback ve
`--manual` ile manuel kopyala/yapıştır akışı kullanır.

Örnekler:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Tarayıcı yerel callback’e ulaşamıyorsa manuel modu kullanın:

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

`oauth` nesnesini Google Meet Plugin config’i altında saklayın:

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

Refresh token’ı config içinde istemiyorsanız ortam değişkenlerini tercih edin.
Hem config hem de ortam değerleri varsa, Plugin önce config’i çözer,
sonra ortam geri dönüşüne bakar.

OAuth onayı Meet alanı oluşturma, Meet alanı okuma erişimi ve Meet
konferans medyası okuma erişimini içerir. Toplantı oluşturma desteği
ortaya çıkmadan önce kimlik doğruladıysanız, refresh
token’ın `meetings.space.created` kapsamına sahip olması için `openclaw googlemeet auth login --json` komutunu yeniden çalıştırın.

### Doctor ile OAuth doğrulama

Hızlı, gizli bilgi içermeyen bir sağlık denetimi istediğinizde OAuth doctor’ı çalıştırın:

```bash
openclaw googlemeet doctor --oauth --json
```

Bu, Chrome çalışma zamanını yüklemez ve bağlı bir Chrome Node gerektirmez.
OAuth config’inin var olup olmadığını ve refresh token’ın access
token oluşturup oluşturamadığını kontrol eder. JSON raporu yalnızca `ok`, `configured`,
`tokenSource`, `expiresAt` ve denetim mesajları gibi durum alanlarını içerir; access
token’ı, refresh token’ı veya client secret’ı yazdırmaz.

Yaygın sonuçlar:

| Denetim              | Anlamı                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` ile `oauth.refreshToken` veya önbelleğe alınmış access token mevcuttur. |
| `oauth-token`        | Önbelleğe alınmış access token hâlâ geçerlidir veya refresh token yeni bir access token üretmiştir. |
| `meet-spaces-get`    | İsteğe bağlı `--meeting` denetimi mevcut bir Meet alanını çözümledi.                    |
| `meet-spaces-create` | İsteğe bağlı `--create-space` denetimi yeni bir Meet alanı oluşturdu.                   |

Google Meet API etkinleştirmesini ve `spaces.create` kapsamını da kanıtlamak için,
yan etkili oluşturma denetimini çalıştırın:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space`, geçici bir Meet URL’si oluşturur. Bunu, Google Cloud projesinde Meet API’nin
etkin olduğunu ve yetki verilmiş hesabın `meetings.space.created` kapsamına sahip olduğunu
doğrulamak istediğinizde kullanın.

Mevcut bir toplantı alanı için okuma erişimini kanıtlamak için:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` ve `resolve-space`, yetkili Google hesabının erişebildiği mevcut bir
alana okuma erişimini kanıtlar. Bu denetimlerden gelen bir `403` genellikle
Google Meet REST API’nin devre dışı olduğu, onay verilmiş refresh token’ın
gerekli kapsamı eksik olduğu veya Google hesabının o Meet
alanına erişemediği anlamına gelir. Refresh-token hatası, `openclaw googlemeet auth login
--json` komutunu yeniden çalıştırıp yeni `oauth` bloğunu saklamanız gerektiği anlamına gelir.

Tarayıcı geri dönüşü için OAuth kimlik bilgileri gerekmez. Bu modda Google
auth, OpenClaw config’inden değil, seçilen Node üzerindeki oturum açılmış Chrome profilinden gelir.

Şu ortam değişkenleri geri dönüş olarak kabul edilir:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` veya `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` veya `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` veya `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` veya `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` veya
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` veya `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` veya `GOOGLE_MEET_PREVIEW_ACK`

Bir Meet URL’sini, kodunu veya `spaces/{id}` değerini `spaces.get` üzerinden çözümleyin:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Medya işinden önce ön kontrol çalıştırın:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet konferans kayıtlarını oluşturduktan sonra toplantı artefaktlarını ve katılımı listeleyin:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting` ile `artifacts` ve `attendance` varsayılan olarak en son konferans kaydını kullanır.
Bu toplantı için saklanan tüm kayıtları istediğinizde `--all-conference-records` verin.

Takvim araması, Meet artefaktlarını okumadan önce toplantı URL’sini Google Calendar’dan çözümleyebilir:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today`, bugünün `primary` takviminde
Google Meet bağlantısı olan bir Calendar etkinliği arar. Eşleşen etkinlik metnini aramak için `--event <query>`,
birincil olmayan takvim için `--calendar <id>` kullanın. Takvim araması,
Calendar events readonly kapsamını içeren yeni bir OAuth girişi gerektirir.
`calendar-events`, eşleşen Meet etkinliklerini önizler ve
`latest`, `artifacts`, `attendance` veya `export` komutlarının seçeceği etkinliği işaretler.

Konferans kayıt kimliğini zaten biliyorsanız, doğrudan ona başvurun:

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

`artifacts`, Google’ın toplantı için sunduğu durumda konferans kaydı meta verileri ile
katılımcı, kayıt, transcript,
yapılandırılmış transcript-entry ve smart-note kaynak meta verilerini döndürür.
Büyük toplantılarda entry aramasını atlamak için `--no-transcript-entries` kullanın.
`attendance`, katılımcıları ilk/son görülme zamanları, toplam oturum süresi,
geç kalma/erken ayrılma işaretleri ve oturum açmış kullanıcıya veya görünen ada göre birleştirilmiş yinelenen katılımcı kaynaklarıyla
participant-session satırlarına genişletir.
Ham katılımcı kaynaklarını ayrı tutmak için `--no-merge-duplicates`,
geç kalma algılamasını ayarlamak için `--late-after-minutes` ve erken ayrılma algılamasını ayarlamak için
`--early-before-minutes` kullanın.

`export`, `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` ve `manifest.json`
içeren bir klasör yazar.
`manifest.json`, seçilen girdiyi, dışa aktarma seçeneklerini, konferans kayıtlarını,
çıktı dosyalarını, sayıları, token kaynağını, kullanıldıysa Calendar etkinliğini ve
herhangi bir kısmi alma uyarısını kaydeder. Klasörün yanına ayrıca taşınabilir bir arşiv yazmak için
`--zip` verin. Bağlantılı transcript ve
smart-note Google Docs metnini Google Drive `files.export` üzerinden dışa aktarmak için `--include-doc-bodies` verin; bu,
Drive Meet readonly kapsamını içeren yeni bir OAuth girişi gerektirir.
`--include-doc-bodies` olmadan dışa aktarımlar yalnızca Meet meta verilerini ve yapılandırılmış transcript
girdilerini içerir. Google bir smart-note
listeleme, transcript-entry veya Drive belge gövdesi hatası gibi kısmi bir artefakt hatası döndürürse,
özet ve manifest tüm dışa aktarmayı başarısız kılmak yerine uyarıyı korur.
Aynı artefakt/attendance verisini alıp klasör veya ZIP oluşturmadan
manifest JSON’unu yazdırmak için `--dry-run` kullanın. Bu, büyük bir dışa aktarma yazmadan önce
veya bir aracının yalnızca sayılara, seçilmiş kayıtlara ve
uyarılara ihtiyaç duyduğu durumlarda yararlıdır.

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

Yalnızca dışa aktarma manifest’ini döndürmek ve dosya yazımını atlamak için `"dryRun": true` ayarlayın.

Saklanan gerçek bir toplantıya karşı korumalı canlı smoke test’i çalıştırın:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Canlı smoke ortamı:

- `OPENCLAW_LIVE_TEST=1`, korumalı canlı testleri etkinleştirir.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`, saklanan bir Meet URL’sini, kodunu veya
  `spaces/{id}` değerini işaret eder.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` veya `GOOGLE_MEET_CLIENT_ID`, OAuth
  client id’yi sağlar.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` veya `GOOGLE_MEET_REFRESH_TOKEN`,
  refresh token’ı sağlar.
- İsteğe bağlı: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ve
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`, `OPENCLAW_`
  öneki olmadan aynı geri dönüş adlarını kullanır.

Temel artefakt/attendance canlı smoke testi,
`https://www.googleapis.com/auth/meetings.space.readonly` ve
`https://www.googleapis.com/auth/meetings.conference.media.readonly` gerektirir. Calendar
araması `https://www.googleapis.com/auth/calendar.events.readonly` gerektirir. Drive
belge gövdesi dışa aktarması ise
`https://www.googleapis.com/auth/drive.meet.readonly` gerektirir.

Yeni bir Meet alanı oluşturun:

```bash
openclaw googlemeet create
```

Komut yeni `meeting uri`, kaynağı ve katılım oturumunu yazdırır. OAuth
kimlik bilgileriyle resmî Google Meet API’yi kullanır. OAuth kimlik bilgileri olmadan
geri dönüş olarak sabitlenmiş Chrome Node’un oturum açılmış tarayıcı profilini kullanır. Aracılar
tek adımda oluşturup katılmak için `action: "create"` ile `google_meet` aracını
kullanabilir. Yalnızca URL oluşturmak için `"join": false` verin.

Tarayıcı geri dönüşünden örnek JSON çıktısı:

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

Tarayıcı geri dönüşü, URL’yi oluşturamadan önce Google oturum açma veya bir Meet izin engeline çarparsa,
Gateway yöntemi başarısız bir yanıt döndürür ve
`google_meet` aracı düz string yerine yapılandırılmış ayrıntılar döndürür:

```json
{
  "source": "browser",
  "error": "google-login-required: OpenClaw tarayıcı profilinde Google oturumu açın, sonra toplantı oluşturmayı yeniden deneyin.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "OpenClaw tarayıcı profilinde Google oturumu açın, sonra toplantı oluşturmayı yeniden deneyin.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Oturum açın - Google Hesapları"
  }
}
```

Bir aracı `manualActionRequired: true` gördüğünde,
`manualActionMessage` değerini tarayıcı Node/sekme bağlamıyla birlikte bildirmeli ve
operatör tarayıcı adımını tamamlayana kadar yeni Meet sekmeleri açmayı bırakmalıdır.

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

Bir Meet oluşturmak varsayılan olarak katılır. Chrome veya Chrome-node taşıması yine de
tarayıcı üzerinden katılmak için Google’da oturum açılmış bir Chrome profiline ihtiyaç duyar. Profil
oturumu kapalıysa, OpenClaw `manualActionRequired: true` veya bir
tarayıcı geri dönüş hatası bildirir ve yeniden denemeden önce operatörden Google girişini
tamamlamasını ister.

Yalnızca Cloud projenizin, OAuth principal’ınızın ve toplantı katılımcılarının
Meet medya API’leri için Google Workspace Developer Preview Programı’na kayıtlı olduğunu doğruladıktan sonra
`preview.enrollmentAcknowledged: true` ayarlayın.

## Config

Yaygın Chrome realtime yolu yalnızca Plugin’in etkin olmasını, BlackHole, SoX
ve bir arka uç realtime ses sağlayıcı anahtarı gerektirir. Varsayılan OpenAI’dir; Google Gemini Live kullanmak için
`realtime.provider: "google"` ayarlayın:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# veya
export GEMINI_API_KEY=...
```

Plugin config’ini `plugins.entries.google-meet.config` altında ayarlayın:

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
- `chromeNode.node`: `chrome-node` için isteğe bağlı Node kimliği/adı/IP’si
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: oturumu kapalı Meet konuk
  ekranında kullanılan ad
- `chrome.autoJoin: true`: `chrome-node` üzerinde OpenClaw tarayıcı otomasyonu aracılığıyla mümkün olan en iyi şekilde konuk adı doldurma ve Join Now tıklaması
- `chrome.reuseExistingTab: true`: yinelenen sekmeler açmak yerine mevcut bir Meet sekmesini etkinleştirir
- `chrome.waitForInCallMs: 20000`: realtime giriş tetiklenmeden önce Meet sekmesinin çağrı içinde olduğunu bildirmesini bekler
- `chrome.audioInputCommand`: stdout’a 8 kHz G.711 mu-law
  ses yazan SoX `rec` komutu
- `chrome.audioOutputCommand`: stdin’den 8 kHz G.711 mu-law
  ses okuyan SoX `play` komutu
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: daha derin yanıtlar için
  `openclaw_agent_consult` ile kısa konuşma yanıtları
- `realtime.introMessage`: realtime köprüsü
  bağlandığında kısa konuşmalı hazır oluş kontrolü; sessiz katılmak için `""` ayarlayın

İsteğe bağlı geçersiz kılmalar:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    toolPolicy: "owner",
    introMessage: "Tam olarak şunu söyle: Ben buradayım.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

Yalnızca Twilio config’i:

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

`voiceCall.enabled` varsayılan olarak `true`’dur; Twilio taşımasıyla birlikte gerçek PSTN çağrısını ve DTMF’yi
Voice Call Plugin’ine devreder. `voice-call` etkin değilse,
Google Meet yine de çevirme planını doğrulayabilir ve kaydedebilir, ancak
Twilio çağrısını yapamaz.

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

Chrome Gateway ana makinesinde çalışıyorsa `transport: "chrome"` kullanın.
Chrome Parallels
VM gibi eşleştirilmiş bir Node’da çalışıyorsa `transport: "chrome-node"` kullanın. Her iki durumda da realtime model ve `openclaw_agent_consult`
Gateway ana makinesinde çalışır, böylece model kimlik bilgileri orada kalır.

Etkin oturumları listelemek veya bir oturum kimliğini incelemek için `action: "status"` kullanın.
Realtime aracının hemen konuşmasını sağlamak için `sessionId` ve `message` ile `action: "speak"` kullanın. Oturumu oluşturmak veya yeniden kullanmak,
bilinen bir ifadeyi tetiklemek ve Chrome ana makinesi raporlayabiliyorsa `inCall` sağlığını döndürmek için
`action: "test_speech"` kullanın. Bir oturumu bitmiş olarak işaretlemek için
`action: "leave"` kullanın.

`status`, mevcut olduğunda Chrome sağlığını içerir:

- `inCall`: Chrome, Meet araması içinde görünüyor
- `micMuted`: mümkün olan en iyi şekilde Meet mikrofon durumu
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: sesin çalışabilmesi için
  tarayıcı profili manuel giriş, Meet ev sahibi kabulü, izinler veya
  tarayıcı denetimi onarımı gerektiriyor
- `providerConnected` / `realtimeReady`: realtime ses köprüsü durumu
- `lastInputAt` / `lastOutputAt`: köprüden son görülen veya köprüye son gönderilen ses

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Tam olarak şunu söyle: Ben buradayım ve dinliyorum."
}
```

## Realtime aracı danışması

Chrome realtime modu canlı ses döngüsü için optimize edilmiştir. Realtime ses
sağlayıcısı toplantı sesini duyar ve yapılandırılmış ses köprüsü üzerinden konuşur.
Realtime model daha derin reasoning, güncel bilgi veya normal
OpenClaw araçlarına ihtiyaç duyduğunda `openclaw_agent_consult` çağırabilir.

Danışma aracı, perde arkasında son toplantı transcript bağlamıyla normal
OpenClaw aracısını çalıştırır ve realtime
ses oturumuna kısa bir sözlü yanıt döndürür. Ses modeli sonra bu yanıtı toplantıya geri konuşabilir.
Voice Call ile aynı paylaşılan realtime danışma aracını kullanır.

`realtime.toolPolicy`, danışma çalıştırmasını denetler:

- `safe-read-only`: danışma aracını açığa çıkarır ve normal aracıyı
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` ve
  `memory_get` ile sınırlar.
- `owner`: danışma aracını açığa çıkarır ve normal aracının
  olağan aracı araç ilkesini kullanmasına izin verir.
- `none`: danışma aracını realtime ses modeline açığa çıkarmaz.

Danışma oturum anahtarı Meet oturumu başına kapsanır; böylece takip danışma çağrıları
aynı toplantı sırasında önceki danışma bağlamını yeniden kullanabilir.

Chrome aramaya tamamen katıldıktan sonra konuşmalı bir hazır oluş kontrolünü zorlamak için:

```bash
openclaw googlemeet speak meet_... "Tam olarak şunu söyle: Ben buradayım ve dinliyorum."
```

Tam katıl ve konuş smoke testi için:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Tam olarak şunu söyle: Ben buradayım ve dinliyorum."
```

## Canlı test kontrol listesi

Bir toplantıyı gözetimsiz bir aracıya bırakmadan önce şu sırayı kullanın:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Tam olarak şunu söyle: Google Meet konuşma testi tamamlandı."
```

Beklenen chrome-node durumu:

- `googlemeet setup` tamamen yeşil olmalı.
- `googlemeet setup`, chrome-node varsayılan
  taşıma olduğunda veya bir Node sabitlendiğinde `chrome-node-connected` içermeli.
- `nodes status`, seçilen Node’un bağlı olduğunu göstermeli.
- Seçilen Node hem `googlemeet.chrome` hem de `browser.proxy` ilan etmeli.
- Meet sekmesi aramaya katılmalı ve `test-speech`, Chrome sağlığını
  `inCall: true` ile döndürmeli.

Parallels macOS VM gibi uzak bir Chrome ana makinesi için, Gateway veya VM güncellendikten sonra
en kısa güvenli denetim şudur:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Bu, gerçek bir toplantı sekmesi açılmadan önce Gateway Plugin’inin yüklü olduğunu,
VM Node’unun geçerli token ile bağlı olduğunu ve
Meet ses köprüsünün kullanılabilir olduğunu kanıtlar.

Bir Twilio smoke testi için, telefonla arama ayrıntıları sunan bir toplantı kullanın:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Beklenen Twilio durumu:

- `googlemeet setup`, yeşil `twilio-voice-call-plugin` ve
  `twilio-voice-call-credentials` denetimlerini içermeli.
- Gateway yeniden yüklendikten sonra CLI’de `voicecall` kullanılabilir olmalı.
- Dönen oturum `transport: "twilio"` ve bir `twilio.voiceCallId` içermeli.
- `googlemeet leave <sessionId>`, devredilmiş sesli aramayı kapatmalı.

## Sorun giderme

### Aracı Google Meet aracını göremiyor

Plugin’in Gateway config’inde etkin olduğunu doğrulayın ve Gateway’i yeniden yükleyin:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

`plugins.entries.google-meet` alanını yeni düzenlediyseniz Gateway’i yeniden başlatın veya yeniden yükleyin.
Çalışan aracı yalnızca geçerli Gateway
süreci tarafından kaydedilmiş Plugin araçlarını görür.

### Bağlı Google Meet yetenekli Node yok

Node ana makinesinde şunu çalıştırın:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway ana makinesinde Node’u onaylayın ve komutları doğrulayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node bağlı olmalı ve `googlemeet.chrome` ile `browser.proxy` listelemelidir.
Gateway config’i bu Node komutlarına izin vermelidir:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup`, `chrome-node-connected` denetiminde başarısız olursa veya Gateway günlüğü
`gateway token mismatch` bildirirse, Node’u geçerli Gateway
token ile yeniden kurun veya yeniden başlatın. LAN Gateway için bu genellikle şu anlama gelir:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Ardından Node servisini yeniden yükleyin ve tekrar çalıştırın:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Tarayıcı açılıyor ama aracı katılamıyor

`googlemeet test-speech` çalıştırın ve dönen Chrome sağlığını inceleyin. Eğer
`manualActionRequired: true` bildiriyorsa, `manualActionMessage` değerini operatöre gösterin
ve tarayıcı eylemi tamamlanana kadar yeniden denemeyi bırakın.

Yaygın manuel eylemler:

- Chrome profilinde oturum açın.
- Konuğu Meet ev sahibi hesabından kabul edin.
- Chrome’un yerel izin istemi göründüğünde Chrome’a mikrofon/kamera izni verin.
- Takılmış bir Meet izin iletişim kutusunu kapatın veya onarın.

Meet “Do you want people to
hear you in the meeting?” gösteriyor diye “oturum açılmamış” raporlamayın. Bu, Meet’in ses seçimi ara ekranıdır; OpenClaw
mümkün olduğunda tarayıcı otomasyonu üzerinden **Use microphone** seçeneğine tıklar ve
gerçek toplantı durumunu beklemeye devam eder. Yalnızca oluşturma için tarayıcı geri dönüşünde OpenClaw,
URL oluşturmak realtime ses yolu gerektirmediği için **Continue without microphone** seçeneğine tıklayabilir.

### Toplantı oluşturma başarısız oluyor

`googlemeet create`, OAuth kimlik bilgileri yapılandırıldığında önce Google Meet API `spaces.create` uç noktasını
kullanır. OAuth kimlik bilgileri olmadan sabitlenmiş Chrome Node tarayıcısına
geri döner. Şunları doğrulayın:

- API ile oluşturma için: `oauth.clientId` ve `oauth.refreshToken` yapılandırılmış olmalı
  veya eşleşen `OPENCLAW_GOOGLE_MEET_*` ortam değişkenleri bulunmalı.
- API ile oluşturma için: refresh token, oluşturma desteği
  eklendikten sonra üretilmiş olmalı. Eski token’larda `meetings.space.created` kapsamı eksik olabilir; `openclaw googlemeet auth login --json`
  komutunu yeniden çalıştırın ve Plugin config’ini güncelleyin.
- Tarayıcı geri dönüşü için: `defaultTransport: "chrome-node"` ve
  `chromeNode.node`, `browser.proxy` ve
  `googlemeet.chrome` olan bağlı bir Node’u işaret etmeli.
- Tarayıcı geri dönüşü için: o Node üzerindeki OpenClaw Chrome profili Google’da oturum açmış
  olmalı ve `https://meet.google.com/new` açabilmeli.
- Tarayıcı geri dönüşü için: yeniden denemeler yeni sekme açmadan önce mevcut bir `https://meet.google.com/new`
  veya Google hesap istemi sekmesini yeniden kullanır. Bir aracı zaman aşımına uğrarsa,
  elle başka bir Meet sekmesi açmak yerine araç çağrısını yeniden deneyin.
- Tarayıcı geri dönüşü için: araç `manualActionRequired: true` döndürürse,
  operatöre yol göstermek için dönen `browser.nodeId`, `browser.targetId`, `browserUrl` ve
  `manualActionMessage` değerlerini kullanın. Bu
  eylem tamamlanana kadar döngü içinde yeniden denemeyin.
- Tarayıcı geri dönüşü için: Meet “Do you want people to hear you in the
  meeting?” gösteriyorsa sekmeyi açık bırakın. OpenClaw
  tarayıcı otomasyonu üzerinden **Use microphone** veya yalnızca oluşturma geri dönüşü için
  **Continue without microphone** seçeneğine tıklamalı ve üretilen Meet URL’sini beklemeye devam etmelidir. Bunu yapamazsa,
  hata `google-login-required` değil `meet-audio-choice-required` belirtmelidir.

### Aracı katılıyor ama konuşmuyor

Realtime yolunu kontrol edin:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Dinleme/geri konuşma için `mode: "realtime"` kullanın. `mode: "transcribe"` bilerek
çift yönlü realtime ses köprüsünü başlatmaz.

Ayrıca şunları doğrulayın:

- Gateway ana makinesinde `OPENAI_API_KEY` veya `GEMINI_API_KEY`
  gibi bir realtime sağlayıcı anahtarı mevcut.
- `BlackHole 2ch`, Chrome ana makinesinde görünür durumda.
- `rec` ve `play`, Chrome ana makinesinde mevcut.
- Meet mikrofonu ve hoparlörü OpenClaw’ın kullandığı sanal ses yolu üzerinden yönlendirilmiş.

`googlemeet doctor [session-id]`, oturumu, Node’u, arama içi durumu,
manuel eylem nedenini, realtime sağlayıcı bağlantısını, `realtimeReady`,
ses giriş/çıkış etkinliğini, son ses zaman damgalarını, bayt sayaçlarını ve tarayıcı URL’sini yazdırır.
Ham JSON gerektiğinde `googlemeet status [session-id]` kullanın.
Token’ları açığa çıkarmadan Google Meet OAuth yenilemeyi doğrulamak için `googlemeet doctor --oauth` kullanın;
Google Meet API kanıtına da ihtiyacınız varsa `--meeting` veya `--create-space` ekleyin.

Bir aracı zaman aşımına uğradıysa ve zaten açık bir Meet sekmesi görebiliyorsanız,
başka bir sekme açmadan o sekmeyi inceleyin:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Bunun eşdeğer araç eylemi `recover_current_tab`’dır. Seçili taşıma için mevcut bir
Meet sekmesine odaklanır ve onu inceler. `chrome` ile Gateway üzerinden yerel
tarayıcı denetimini kullanır; `chrome-node` ile yapılandırılmış
Chrome Node’unu kullanır. Yeni sekme açmaz veya yeni oturum oluşturmaz; bunun yerine
oturum açma, kabul, izinler veya ses seçimi durumu gibi mevcut engeli raporlar.
CLI komutu yapılandırılmış Gateway ile konuşur; dolayısıyla Gateway çalışıyor olmalıdır;
`chrome-node` için ayrıca Chrome Node’unun bağlı olması gerekir.

### Twilio kurulum denetimleri başarısız oluyor

`twilio-voice-call-plugin`, `voice-call` izinli değilse veya etkin değilse başarısız olur.
Bunu `plugins.allow` içine ekleyin, `plugins.entries.voice-call` etkinleştirin ve
Gateway’i yeniden yükleyin.

`twilio-voice-call-credentials`, Twilio arka ucunda hesap
SID, auth token veya arayan numarası eksik olduğunda başarısız olur. Bunları Gateway ana makinesinde ayarlayın:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Ardından Gateway’i yeniden başlatın veya yeniden yükleyin ve şunu çalıştırın:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke`, varsayılan olarak yalnızca hazır oluş denetimidir. Belirli bir numara için dry-run yapmak için:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Yalnızca bilerek canlı giden bir bildirim araması yapmak istiyorsanız `--yes` ekleyin:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio araması başlıyor ama hiç toplantıya girmiyor

Meet etkinliğinin telefonla arama ayrıntıları sunduğunu doğrulayın. Tam çevirme
numarasını ve PIN’i veya özel bir DTMF dizisini verin:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Sağlayıcının PIN’i girmeden önce duraklamaya ihtiyacı varsa `--dtmf-sequence` içinde başta `w` veya virgüller kullanın.

## Notlar

Google Meet’in resmî medya API’si alma odaklıdır; bu yüzden bir Meet
aramasına konuşmak için hâlâ bir katılımcı yolu gerekir. Bu Plugin bu sınırı görünür tutar:
Chrome tarayıcı katılımını ve yerel ses yönlendirmesini yönetir; Twilio ise
telefonla arama katılımını yönetir.

Chrome realtime modu şunlardan birine ihtiyaç duyar:

- `chrome.audioInputCommand` artı `chrome.audioOutputCommand`: OpenClaw
  realtime model köprüsüne sahip olur ve bu
  komutlarla seçili realtime ses sağlayıcısı arasında 8 kHz G.711 mu-law sesi aktarır.
- `chrome.audioBridgeCommand`: harici bir köprü komutu tüm yerel
  ses yoluna sahip olur ve daemon’unu başlattıktan veya doğruladıktan sonra çıkmalıdır.

Temiz çift yönlü ses için Meet çıkışını ve Meet mikrofonunu ayrı
sanal aygıtlar veya Loopback benzeri bir sanal aygıt grafiği üzerinden yönlendirin. Tek bir paylaşılan
BlackHole aygıtı diğer katılımcıları aramaya geri yankılayabilir.

`googlemeet speak`, bir Chrome
oturumu için etkin realtime ses köprüsünü tetikler. `googlemeet leave`, bu köprüyü durdurur.
Voice Call Plugin’i üzerinden devredilen Twilio oturumlarında `leave` ayrıca alttaki sesli aramayı da kapatır.

## İlgili

- [Voice call plugin](/tr/plugins/voice-call)
- [Talk mode](/tr/nodes/talk)
- [Building plugins](/tr/plugins/building-plugins)
