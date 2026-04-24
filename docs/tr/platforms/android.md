---
read_when:
    - Android Node'u eşleştirme veya yeniden bağlama
    - Android gateway keşfi veya kimlik doğrulamasında hata ayıklama
    - İstemciler arasında sohbet geçmişi eşliğini doğrulama
summary: 'Android uygulaması (Node): bağlantı çalışma kitabı + Connect/Chat/Voice/Canvas komut yüzeyi'
title: Android uygulaması
x-i18n:
    generated_at: "2026-04-24T09:18:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31b538a5bf45e78fde34e77a31384295b3e96f2fff6b3adfe37e5c569d858472
    source_path: platforms/android.md
    workflow: 15
---

> **Not:** Android uygulaması henüz herkese açık olarak yayımlanmadı. Kaynak kodu [OpenClaw deposunda](https://github.com/openclaw/openclaw) `apps/android` altında bulunur. Java 17 ve Android SDK kullanarak kendiniz derleyebilirsiniz (`./gradlew :app:assemblePlayDebug`). Derleme yönergeleri için [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) dosyasına bakın.

## Destek özeti

- Rol: yardımcı Node uygulaması (Android Gateway barındırmaz).
- Gateway gerekli mi: evet (macOS, Linux veya WSL2 üzerinden Windows'ta çalıştırın).
- Kurulum: [Başlangıç](/tr/start/getting-started) + [Eşleştirme](/tr/channels/pairing).
- Gateway: [Çalışma kitabı](/tr/gateway) + [Yapılandırma](/tr/gateway/configuration).
  - Protokoller: [Gateway protokolü](/tr/gateway/protocol) (Node'lar + denetim düzlemi).

## Sistem denetimi

Sistem denetimi (launchd/systemd), Gateway ana makinesinde yaşar. Bkz. [Gateway](/tr/gateway).

## Bağlantı Çalışma Kitabı

Android Node uygulaması ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android doğrudan Gateway WebSocket'e bağlanır ve cihaz eşleştirmesini (`role: node`) kullanır.

Tailscale veya herkese açık ana makineler için Android güvenli bir uç nokta gerektirir:

- Tercih edilen: Tailscale Serve / Funnel ile `https://<magicdns>` / `wss://<magicdns>`
- Ayrıca desteklenir: gerçek TLS uç noktasına sahip başka herhangi bir `wss://` Gateway URL'si
- Düz metin `ws://`, özel LAN adreslerinde / `.local` ana makinelerinde; ayrıca `localhost`, `127.0.0.1` ve Android emülatör köprüsünde (`10.0.2.2`) desteklenmeye devam eder

### Önkoşullar

- “Ana” makinede Gateway'i çalıştırabiliyor olmanız gerekir.
- Android cihaz/emülatör gateway WebSocket'e erişebilmelidir:
  - Aynı LAN üzerinde mDNS/NSD ile, **veya**
  - Aynı Tailscale tailnet üzerinde Wide-Area Bonjour / unicast DNS-SD kullanarak (aşağıya bakın), **veya**
  - Manuel gateway ana makinesi/port ile (geri dönüş)
- Tailnet/herkese açık mobil eşleştirme ham tailnet IP `ws://` uç noktalarını **kullanmaz**. Bunun yerine Tailscale Serve veya başka bir `wss://` URL'si kullanın.
- CLI'yi (`openclaw`) gateway makinesinde (veya SSH üzerinden) çalıştırabilmeniz gerekir.

### 1) Gateway'i başlatın

```bash
openclaw gateway --port 18789 --verbose
```

Günlüklerde şuna benzer bir şey gördüğünüzü doğrulayın:

- `listening on ws://0.0.0.0:18789`

Tailscale üzerinden uzak Android erişimi için ham tailnet bağlaması yerine Serve/Funnel tercih edin:

```bash
openclaw gateway --tailscale serve
```

Bu, Android'e güvenli bir `wss://` / `https://` uç noktası verir. Düz bir `gateway.bind: "tailnet"` kurulumu, TLS'yi ayrıca sonlandırmadığınız sürece ilk uzak Android eşleştirmesi için yeterli değildir.

### 2) Keşfi doğrulayın (isteğe bağlı)

Gateway makinesinden:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Daha fazla hata ayıklama notu: [Bonjour](/tr/gateway/bonjour).

Ayrıca geniş alan keşif alanı yapılandırdıysanız şunla karşılaştırın:

```bash
openclaw gateway discover --json
```

Bu, tek geçişte `local.` ile yapılandırılmış geniş alan alanını gösterir ve yalnızca TXT ipuçları yerine çözümlenmiş
hizmet uç noktasını kullanır.

#### Tailnet (Viyana ⇄ Londra) keşfi için unicast DNS-SD

Android NSD/mDNS keşfi ağlar arasında geçmez. Android Node'unuz ve gateway farklı ağlardaysa ama Tailscale ile bağlıysa, bunun yerine Wide-Area Bonjour / unicast DNS-SD kullanın.

Keşif tek başına tailnet/herkese açık Android eşleştirmesi için yeterli değildir. Keşfedilen rota yine de güvenli bir uç nokta (`wss://` veya Tailscale Serve) gerektirir:

1. Gateway ana makinesinde bir DNS-SD bölgesi (örnek `openclaw.internal.`) kurun ve `_openclaw-gw._tcp` kayıtlarını yayınlayın.
2. Seçtiğiniz alan için Tailscale split DNS'i, o DNS sunucusuna yönlendirecek şekilde yapılandırın.

Ayrıntılar ve örnek CoreDNS yapılandırması: [Bonjour](/tr/gateway/bonjour).

### 3) Android'den bağlanın

Android uygulamasında:

- Uygulama gateway bağlantısını **ön plan hizmeti** (kalıcı bildirim) üzerinden canlı tutar.
- **Connect** sekmesini açın.
- **Setup Code** veya **Manual** modunu kullanın.
- Keşif engelleniyorsa, **Advanced controls** içinde manuel ana makine/port kullanın. Özel LAN ana makineleri için `ws://` hâlâ çalışır. Tailscale/herkese açık ana makineler için TLS'yi açın ve bir `wss://` / Tailscale Serve uç noktası kullanın.

İlk başarılı eşleştirmeden sonra Android, açılışta otomatik yeniden bağlanır:

- Manuel uç nokta (etkinse), aksi halde
- Son keşfedilen gateway (en iyi çabayla).

### 4) Eşleştirmeyi onaylayın (CLI)

Gateway makinesinde:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Eşleştirme ayrıntıları: [Eşleştirme](/tr/channels/pairing).

### 5) Node'un bağlı olduğunu doğrulayın

- Node durumu üzerinden:

  ```bash
  openclaw nodes status
  ```

- Gateway üzerinden:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Sohbet + geçmiş

Android Chat sekmesi oturum seçimini destekler (varsayılan `main`, ayrıca diğer mevcut oturumlar):

- Geçmiş: `chat.history` (gösterim için normalize edilmiştir; satır içi yönerge etiketleri
  görünür metinden kaldırılır, düz metin araç çağrısı XML payload'ları (şunlar dahil:
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve
  kısaltılmış araç çağrısı blokları) ve sızan ASCII/tam genişlikli model denetim belirteçleri
  kaldırılır; tam `NO_REPLY` /
  `no_reply` gibi salt sessiz belirteç asistan satırları atılır ve aşırı büyük satırlar yer tutucularla değiştirilebilir)
- Gönderme: `chat.send`
- Anlık güncelleme (en iyi çabayla): `chat.subscribe` → `event:"chat"`

### 7) Canvas + kamera

#### Gateway Canvas Host (web içeriği için önerilir)

Node'un aracının disk üzerinde düzenleyebileceği gerçek HTML/CSS/JS göstermesini istiyorsanız, Node'u Gateway canvas host'una yönlendirin.

Not: Node'lar canvas'ı Gateway HTTP sunucusundan yükler (Gateway ile aynı port, varsayılan `18789`).

1. Gateway ana makinesinde `~/.openclaw/workspace/canvas/index.html` oluşturun.

2. Node'u ona yönlendirin (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (isteğe bağlı): her iki cihaz da Tailscale üzerindeyse `.local` yerine MagicDNS adı veya tailnet IP kullanın, örn. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Bu sunucu HTML içine canlı yeniden yükleme istemcisi enjekte eder ve dosya değişikliklerinde yeniden yükler.
A2UI host'u `http://<gateway-host>:18789/__openclaw__/a2ui/` adresinde bulunur.

Canvas komutları (yalnızca ön planda):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (varsayılan iskeleye dönmek için `{"url":""}` veya `{"url":"/"}` kullanın). `canvas.snapshot`, `{ format, base64 }` döndürür (varsayılan `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` eski takma ad)

Kamera komutları (yalnızca ön planda; izin geçitlidir):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Parametreler ve CLI yardımcıları için bkz. [Camera node](/tr/nodes/camera).

### 8) Voice + genişletilmiş Android komut yüzeyi

- Voice: Android, Voice sekmesinde tek bir mikrofon aç/kapat akışı, döküm yakalama ve `talk.speak` oynatımı kullanır. Yerel sistem TTS yalnızca `talk.speak` kullanılamadığında kullanılır. Uygulama ön plandan çıktığında ses durur.
- Voice wake/talk-mode geçişleri şu anda Android kullanıcı deneyiminden/çalışma zamanından kaldırılmıştır.
- Ek Android komut aileleri (kullanılabilirlik cihaz + izinlere bağlıdır):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (aşağıdaki [Bildirim yönlendirme](#notification-forwarding) bölümüne bakın)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Aracı giriş noktaları

Android, sistem asistanı tetikleyicisinden (Google
Assistant) OpenClaw başlatmayı destekler. Yapılandırıldığında, ana ekran düğmesine basılı tutmak veya
"Hey Google, OpenClaw'a sor..." demek uygulamayı açar ve istemi sohbet oluşturucusuna aktarır.

Bu, uygulama manifestosunda bildirilen Android **App Actions** üst verilerini kullanır. Gateway tarafında
ek yapılandırma gerekmez -- asistan intent'i tamamen Android uygulaması tarafından işlenir ve normal sohbet mesajı olarak iletilir.

<Note>
App Actions kullanılabilirliği cihaza, Google Play Services sürümüne
ve kullanıcının OpenClaw'ı varsayılan asistan uygulaması olarak ayarlayıp ayarlamadığına bağlıdır.
</Note>

## Bildirim yönlendirme

Android, cihaz bildirimlerini gateway'e olay olarak yönlendirebilir. Birkaç denetim, hangi bildirimlerin yönlendirileceğini ve ne zaman yönlendirileceğini kapsamlandırmanıza izin verir.

| Anahtar                         | Tür            | Açıklama                                                                                          |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`   | string[]       | Yalnızca bu paket adlarından gelen bildirimleri yönlendir. Ayarlanırsa diğer tüm paketler yok sayılır. |
| `notifications.denyPackages`    | string[]       | Bu paket adlarından gelen bildirimleri asla yönlendirme. `allowPackages` sonrasında uygulanır.   |
| `notifications.quietHours.start` | string (HH:mm) | Sessiz saat penceresinin başlangıcı (yerel cihaz saati). Bu pencere sırasında bildirimler bastırılır. |
| `notifications.quietHours.end`  | string (HH:mm) | Sessiz saat penceresinin sonu.                                                                    |
| `notifications.rateLimit`       | number         | Paket başına dakikada en fazla yönlendirilen bildirim sayısı. Fazla bildirimler düşürülür.       |

Bildirim seçici ayrıca yönlendirilen bildirim olayları için daha güvenli davranış kullanır; hassas sistem bildirimlerinin yanlışlıkla yönlendirilmesini önler.

Örnek yapılandırma:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
Bildirim yönlendirme, Android Notification Listener izni gerektirir. Uygulama bunu kurulum sırasında ister.
</Note>

## İlgili

- [iOS uygulaması](/tr/platforms/ios)
- [Node'lar](/tr/nodes)
- [Android Node sorun giderme](/tr/nodes/troubleshooting)
