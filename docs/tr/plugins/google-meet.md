---
read_when:
    - Bir OpenClaw ajanının Google Meet çağrısına katılmasını istiyorsunuz
    - Google Meet taşıması olarak Chrome, Chrome node veya Twilio yapılandırıyorsunuz
summary: 'Google Meet Plugin: Chrome veya Twilio üzerinden açık Meet URL''lerine katılma; varsayılan olarak gerçek zamanlı ses ayarlarıyla'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-04-24T09:21:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d430a1f2d6ee7fc1d997ef388a2e0d2915a6475480343e7060edac799dfc027
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Google Meet katılımcı desteği OpenClaw için.

Plugin tasarım gereği açık davranır:

- Yalnızca açık bir `https://meet.google.com/...` URL'sine katılır.
- `realtime` ses, varsayılan moddur.
- Gerçek zamanlı ses, daha derin akıl yürütme veya araçlar gerektiğinde tam OpenClaw ajanına geri çağrı yapabilir.
- Kimlik doğrulama, kişisel Google OAuth veya zaten oturum açılmış bir Chrome profiliyle başlar.
- Otomatik onay duyurusu yoktur.
- Varsayılan Chrome ses arka ucu `BlackHole 2ch` olur.
- Chrome yerelde veya paired bir Node ana bilgisayarında çalışabilir.
- Twilio, bir çevirmeli arama numarasını ve isteğe bağlı PIN veya DTMF dizisini kabul eder.
- CLI komutu `googlemeet` olur; `meet`, daha geniş ajan telekonferans iş akışları için ayrılmıştır.

## Hızlı başlangıç

Yerel ses bağımlılıklarını yükleyin ve gerçek zamanlı sağlayıcının OpenAI kullanabildiğinden emin olun:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

`blackhole-2ch`, `BlackHole 2ch` sanal ses aygıtını yükler. Homebrew yükleyicisi,
macOS bu aygıtı görünür kılmadan önce yeniden başlatma gerektirir:

```bash
sudo reboot
```

Yeniden başlattıktan sonra ikisini de doğrulayın:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
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

Bir toplantıya katılın:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Veya bir ajanın `google_meet` aracı üzerinden katılmasına izin verin:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

Chrome, oturum açılmış Chrome profili olarak katılır. Meet içinde,
OpenClaw'ın kullandığı mikrofon/hoparlör yolu için `BlackHole 2ch` seçin. Temiz
çift yönlü ses için ayrı sanal aygıtlar veya Loopback tarzı bir grafik kullanın; tek
bir BlackHole aygıtı ilk smoke test için yeterlidir ancak yankı yapabilir.

### Yerel Gateway + Parallels Chrome

Bir macOS VM'in yalnızca Chrome'u sahiplenmesi için VM içinde tam bir OpenClaw Gateway veya model API anahtarına ihtiyacınız **yoktur**.
Gateway'i ve ajanı yerelde çalıştırın, ardından VM içinde bir
Node ana bilgisayarı çalıştırın. Node'un Chrome komutunu ilan etmesi için
paketle gelen Plugin'i VM içinde bir kez etkinleştirin:

Nerede ne çalışır:

- Gateway ana bilgisayarı: OpenClaw Gateway, ajan çalışma alanı, model/API anahtarları, realtime
  sağlayıcısı ve Google Meet Plugin yapılandırması.
- Parallels macOS VM: OpenClaw CLI/Node ana bilgisayarı, Google Chrome, SoX, BlackHole 2ch
  ve Google'da oturum açmış bir Chrome profili.
- VM içinde gerekmez: Gateway hizmeti, ajan yapılandırması, OpenAI/GPT anahtarı veya model
  sağlayıcı kurulumu.

VM bağımlılıklarını kurun:

```bash
brew install blackhole-2ch sox
```

macOS `BlackHole 2ch` aygıtını görünür kılsın diye BlackHole kurulumundan sonra VM'i yeniden başlatın:

```bash
sudo reboot
```

Yeniden başlattıktan sonra VM'in ses aygıtını ve SoX komutlarını görebildiğini doğrulayın:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

VM içinde OpenClaw'ı kurun veya güncelleyin, ardından paketle gelen Plugin'i orada etkinleştirin:

```bash
openclaw plugins enable google-meet
```

VM içinde Node ana bilgisayarını başlatın:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` bir LAN IP'siyse ve TLS kullanmıyorsanız, Node
bu güvenilir özel ağ için açıkça izin vermediğiniz sürece düz metin WebSocket'i reddeder:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Node'u LaunchAgent olarak kurarken de aynı ortam değişkenini kullanın:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`, bir `openclaw.json` ayarı değil,
süreç ortamıdır. `openclaw node install`, bu değişken kurulum komutunda mevcut olduğunda
onu LaunchAgent ortamına kaydeder.

Node'u Gateway ana bilgisayarından onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway'in Node'u gördüğünü ve `googlemeet.chrome` ilan ettiğini doğrulayın:

```bash
openclaw nodes status
```

Meet'i Gateway ana bilgisayarında o Node üzerinden yönlendirin:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
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

`chromeNode.node` atlanırsa OpenClaw yalnızca tam olarak bir
bağlı Node `googlemeet.chrome` ilan ediyorsa otomatik seçim yapar. Birden fazla uygun Node
bağlıysa `chromeNode.node` değerini Node kimliği, görünen ad veya uzak IP olarak ayarlayın.

Yaygın hata denetimleri:

- `No connected Google Meet-capable node`: VM içinde `openclaw node run` başlatın,
  pairing'i onaylayın ve `openclaw plugins enable google-meet` komutunun
  VM içinde çalıştırıldığından emin olun. Ayrıca Gateway ana bilgisayarının
  `gateway.nodes.allowCommands: ["googlemeet.chrome"]` ile Node komutuna izin verdiğini doğrulayın.
- `BlackHole 2ch audio device not found on the node`: VM içinde `blackhole-2ch`
  kurun ve VM'i yeniden başlatın.
- Chrome açılıyor ama katılamıyor: VM içindeki Chrome'da oturum açın ve bu
  profilin Meet URL'sine elle katılabildiğini doğrulayın.
- Ses yok: Meet içinde mikrofon/hoparlörü OpenClaw'ın kullandığı sanal ses
  aygıtı yoluna yönlendirin; temiz çift yönlü ses için ayrı sanal aygıtlar veya
  Loopback tarzı yönlendirme kullanın.

## Kurulum notları

Chrome gerçek zamanlı varsayılanı iki harici araç kullanır:

- `sox`: komut satırı ses yardımcı aracı. Plugin, varsayılan 8 kHz G.711 mu-law
  ses köprüsü için bunun `rec` ve `play` komutlarını kullanır.
- `blackhole-2ch`: macOS sanal ses sürücüsü. Chrome/Meet'in
  yönlendirebileceği `BlackHole 2ch` ses aygıtını oluşturur.

OpenClaw bu iki paketi de paketlemez veya yeniden dağıtmaz. Belgeler,
kullanıcılardan bunları Homebrew üzerinden ana bilgisayar bağımlılıkları olarak kurmalarını ister. SoX lisansı
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole ise GPL-3.0'dır. BlackHole'u OpenClaw ile
paketleyen bir yükleyici veya cihaz oluşturuyorsanız BlackHole'un
yukarı akış lisans koşullarını gözden geçirin veya Existential Audio'dan ayrı lisans alın.

## Taşımalar

### Chrome

Chrome taşıması Meet URL'sini Google Chrome'da açar ve oturum açılmış
Chrome profili olarak katılır. macOS'ta Plugin başlatmadan önce `BlackHole 2ch` varlığını kontrol eder.
Yapılandırılmışsa ayrıca Chrome'u açmadan önce bir ses köprüsü sağlık komutu ve başlangıç komutu da çalıştırır.
Chrome/ses Gateway ana bilgisayarında yaşıyorsa `chrome` kullanın;
Chrome/ses Parallels macOS VM gibi paired bir Node üzerinde yaşıyorsa `chrome-node` kullanın.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome mikrofon ve hoparlör sesini yerel OpenClaw ses
köprüsü üzerinden yönlendirin. `BlackHole 2ch` kurulu değilse katılım,
sessizce ses yolu olmadan katılmak yerine bir kurulum hatasıyla başarısız olur.

### Twilio

Twilio taşıması, Voice Call Plugin'ine devredilen katı bir arama planıdır. Meet sayfalarını telefon numaraları için ayrıştırmaz.

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

Google Meet Media API erişimi önce kişisel bir OAuth istemcisi kullanır. 
`oauth.clientId` ve isteğe bağlı olarak `oauth.clientSecret` yapılandırın, ardından şunu çalıştırın:

```bash
openclaw googlemeet auth login --json
```

Komut, yenileme belirteci içeren bir `oauth` yapılandırma bloğu yazdırır. PKCE,
`http://localhost:8085/oauth2callback` üzerinde localhost callback ve
`--manual` ile elle kopyala/yapıştır akışı kullanır.

Şu ortam değişkenleri yedek olarak kabul edilir:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` veya `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` veya `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` veya `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` veya `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` veya
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` veya `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` veya `GOOGLE_MEET_PREVIEW_ACK`

Bir Meet URL'si, kodu veya `spaces/{id}` değerini `spaces.get` üzerinden çözümleyin:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Medya çalışmalarından önce ön kontrol çalıştırın:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

`preview.enrollmentAcknowledged: true` değerini yalnızca Cloud
projenizin, OAuth principal'ınızın ve toplantı katılımcılarının Meet medya API'leri için Google
Workspace Developer Preview Program'a kayıtlı olduğunu doğruladıktan sonra ayarlayın.

## Yapılandırma

Yaygın Chrome gerçek zamanlı yolu için yalnızca Plugin'in etkin olması, BlackHole, SoX
ve bir OpenAI anahtarı gerekir:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
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
- `chrome.audioInputCommand`: stdout'a 8 kHz G.711 mu-law
  ses yazan SoX `rec` komutu
- `chrome.audioOutputCommand`: stdin'den 8 kHz G.711 mu-law
  sesi okuyan SoX `play` komutu
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: daha derin yanıtlar için
  `openclaw_agent_consult` ile kısa konuşma yanıtları
- `realtime.introMessage`: gerçek zamanlı köprü bağlandığında kısa konuşmalı hazır olma kontrolü;
  sessiz katılmak için bunu `""` yapın

İsteğe bağlı geçersiz kılmalar:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    toolPolicy: "owner",
    introMessage: "Şunu aynen söyle: Ben buradayım.",
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

Chrome Gateway ana bilgisayarında çalışıyorsa `transport: "chrome"` kullanın.
Chrome, Parallels
VM gibi paired bir Node üzerinde çalışıyorsa `transport: "chrome-node"` kullanın. Her iki durumda da gerçek zamanlı model ve `openclaw_agent_consult`
Gateway ana bilgisayarında çalışır, böylece model kimlik bilgileri orada kalır.

Etkin oturumları listelemek veya bir oturum kimliğini incelemek için `action: "status"` kullanın.
Gerçek zamanlı ajanın hemen konuşmasını sağlamak için `sessionId` ve `message` ile
`action: "speak"` kullanın. Bir oturumu sona ermiş olarak işaretlemek için `action: "leave"` kullanın.

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Şunu aynen söyle: Buradayım ve dinliyorum."
}
```

## Realtime ajan danışması

Chrome gerçek zamanlı modu canlı ses döngüsü için optimize edilmiştir. Realtime ses
sağlayıcısı toplantı sesini duyar ve yapılandırılmış ses köprüsü üzerinden konuşur.
Gerçek zamanlı model daha derin akıl yürütme, güncel bilgi veya normal
OpenClaw araçlarına ihtiyaç duyduğunda `openclaw_agent_consult` çağırabilir.

Danışma aracı, perde arkasında normal OpenClaw ajanını son
toplantı transkript bağlamıyla çalıştırır ve gerçek zamanlı
ses oturumuna kısa, konuşulabilir bir yanıt döndürür. Ses modeli daha sonra bu yanıtı toplantıda tekrar seslendirebilir.

`realtime.toolPolicy`, danışma çalıştırmasını denetler:

- `safe-read-only`: danışma aracını açığa çıkarır ve normal ajanı
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` ve
  `memory_get` ile sınırlar.
- `owner`: danışma aracını açığa çıkarır ve normal ajanın
  olağan ajan araç ilkesini kullanmasına izin verir.
- `none`: danışma aracını gerçek zamanlı ses modeline açığa çıkarmaz.

Danışma oturum anahtarı her Meet oturumu için kapsamlıdır; bu nedenle takip eden danışma çağrıları
aynı toplantı sırasında önceki danışma bağlamını yeniden kullanabilir.

Chrome çağrıya tamamen katıldıktan sonra konuşmalı hazır olma kontrolünü zorlamak için:

```bash
openclaw googlemeet speak meet_... "Şunu aynen söyle: Buradayım ve dinliyorum."
```

## Notlar

Google Meet'in resmi medya API'si alma odaklıdır, bu nedenle bir Meet
çağrısında konuşmak hâlâ bir katılımcı yolu gerektirir. Bu Plugin bu sınırı görünür
tutar: Chrome tarayıcı katılımını ve yerel ses yönlendirmesini yönetir;
Twilio telefonla katılımı yönetir.

Chrome gerçek zamanlı modu şunlardan birine ihtiyaç duyar:

- `chrome.audioInputCommand` artı `chrome.audioOutputCommand`: OpenClaw
  gerçek zamanlı model köprüsünün sahibidir ve bu
  komutlar ile seçili gerçek zamanlı ses sağlayıcısı arasında 8 kHz G.711 mu-law sesi borulandırır.
- `chrome.audioBridgeCommand`: harici bir köprü komutu tüm yerel
  ses yolunun sahibidir ve daemon'unu başlattıktan veya doğruladıktan sonra çıkmalıdır.

Temiz çift yönlü ses için Meet çıkışını ve Meet mikrofonunu ayrı
sanal aygıtlar veya Loopback tarzı sanal aygıt grafiği üzerinden yönlendirin. Tek bir ortak
BlackHole aygıtı diğer katılımcıları tekrar çağrıya yankılayabilir.

`googlemeet speak`, bir Chrome
oturumu için etkin gerçek zamanlı ses köprüsünü tetikler. `googlemeet leave` bu köprüyü durdurur. Voice Call Plugin üzerinden devredilmiş Twilio oturumlarında
`leave`, alttaki sesli çağrıyı da kapatır.

## İlgili

- [Voice Call Plugin](/tr/plugins/voice-call)
- [Talk mode](/tr/nodes/talk)
- [Plugin oluşturma](/tr/plugins/building-plugins)
