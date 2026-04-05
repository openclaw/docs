---
read_when:
    - Android düğümünü eşleştirirken veya yeniden bağlarken
    - Android gateway keşfini veya kimlik doğrulamayı hata ayıklarken
    - İstemciler arasında sohbet geçmişi eşitliğini doğrularken
summary: 'Android uygulaması (düğüm): bağlantı çalışma kılavuzu + Connect/Chat/Voice/Canvas komut yüzeyi'
title: Android Uygulaması
x-i18n:
    generated_at: "2026-04-05T14:00:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2223891afc3aa34af4aaf5410b4f1c6aebcf24bab68a6c47dd9832882d5260db
    source_path: platforms/android.md
    workflow: 15
---

# Android Uygulaması (Düğüm)

> **Not:** Android uygulaması henüz herkese açık olarak yayımlanmadı. Kaynak kodu `apps/android` altında [OpenClaw repository](https://github.com/openclaw/openclaw) içinde mevcuttur. Java 17 ve Android SDK kullanarak kendiniz derleyebilirsiniz (`./gradlew :app:assemblePlayDebug`). Derleme talimatları için [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) dosyasına bakın.

## Destek özeti

- Rol: yardımcı düğüm uygulaması (Android Gateway barındırmaz).
- Gateway gerekli: evet (macOS, Linux veya Windows üzerinde WSL2 aracılığıyla çalıştırın).
- Kurulum: [Başlangıç](/start/getting-started) + [Eşleştirme](/tr/channels/pairing).
- Gateway: [Çalışma kılavuzu](/tr/gateway) + [Yapılandırma](/tr/gateway/configuration).
  - Protokoller: [Gateway protokolü](/tr/gateway/protocol) (düğümler + kontrol düzlemi).

## Sistem denetimi

Sistem denetimi (`launchd/systemd`) Gateway ana makinesinde bulunur. Bkz. [Gateway](/tr/gateway).

## Bağlantı Çalışma Kılavuzu

Android düğüm uygulaması ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android doğrudan Gateway WebSocket'e bağlanır ve cihaz eşleştirmesini kullanır (`role: node`).

Tailscale veya genel ana makineler için Android güvenli bir uç nokta gerektirir:

- Tercih edilen: `https://<magicdns>` / `wss://<magicdns>` ile Tailscale Serve / Funnel
- Ayrıca desteklenir: gerçek bir TLS uç noktası olan diğer tüm `wss://` Gateway URL'leri
- Şifrelenmemiş `ws://`, özel LAN adreslerinde / `.local` ana makinelerinde, ayrıca `localhost`, `127.0.0.1` ve Android emülatör köprüsünde (`10.0.2.2`) desteklenmeye devam eder

### Ön koşullar

- Gateway'i “master” makinede çalıştırabiliyor olmanız gerekir.
- Android cihazı/emülatörü gateway WebSocket'ine erişebilmelidir:
  - Aynı LAN üzerinde mDNS/NSD ile, **veya**
  - Wide-Area Bonjour / unicast DNS-SD kullanarak aynı Tailscale tailnet üzerinde (aşağıya bakın), **veya**
  - El ile gateway ana makinesi/portunu girerek (yedek yöntem)
- Tailnet/genel mobil eşleştirme ham tailnet IP `ws://` uç noktalarını kullanmaz. Bunun yerine Tailscale Serve veya başka bir `wss://` URL'si kullanın.
- Gateway makinesinde CLI (`openclaw`) çalıştırabiliyor olmanız gerekir (veya SSH üzerinden).

### 1) Gateway'i başlatın

```bash
openclaw gateway --port 18789 --verbose
```

Günlüklerde şuna benzer bir ifade gördüğünüzü doğrulayın:

- `listening on ws://0.0.0.0:18789`

Tailscale üzerinden uzak Android erişimi için ham tailnet bağlaması yerine Serve/Funnel tercih edin:

```bash
openclaw gateway --tailscale serve
```

Bu, Android'e güvenli bir `wss://` / `https://` uç noktası sağlar. Ayrı olarak TLS sonlandırması da yapmadığınız sürece, ilk kez uzaktan Android eşleştirmesi için yalnızca düz bir `gateway.bind: "tailnet"` yapılandırması yeterli değildir.

### 2) Keşfi doğrulayın (isteğe bağlı)

Gateway makinesinden:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Daha fazla hata ayıklama notu: [Bonjour](/tr/gateway/bonjour).

Geniş alan keşif alanını da yapılandırdıysanız, şununla karşılaştırın:

```bash
openclaw gateway discover --json
```

Bu, `local.` ile yapılandırılmış geniş alan etki alanını tek geçişte gösterir ve yalnızca TXT ipuçları yerine çözülmüş
hizmet uç noktasını kullanır.

#### Unicast DNS-SD ile tailnet (Viyana ⇄ Londra) keşfi

Android NSD/mDNS keşfi ağlar arasında çalışmaz. Android düğümünüz ve gateway farklı ağlardaysa ancak Tailscale üzerinden bağlıysa, bunun yerine Wide-Area Bonjour / unicast DNS-SD kullanın.

Keşif tek başına tailnet/genel Android eşleştirmesi için yeterli değildir. Keşfedilen yol yine de güvenli bir uç nokta gerektirir (`wss://` veya Tailscale Serve):

1. Gateway ana makinesinde bir DNS-SD bölgesi (örnek `openclaw.internal.`) kurun ve `_openclaw-gw._tcp` kayıtlarını yayımlayın.
2. Seçtiğiniz etki alanını bu DNS sunucusuna yönlendiren Tailscale split DNS'i yapılandırın.

Ayrıntılar ve örnek CoreDNS yapılandırması: [Bonjour](/tr/gateway/bonjour).

### 3) Android'den bağlanın

Android uygulamasında:

- Uygulama gateway bağlantısını bir **foreground service** (kalıcı bildirim) aracılığıyla canlı tutar.
- **Connect** sekmesini açın.
- **Setup Code** veya **Manual** modunu kullanın.
- Keşif engelleniyorsa, **Advanced controls** içinde ana makine/portu el ile girin. Özel LAN ana makineleri için `ws://` hâlâ çalışır. Tailscale/genel ana makineler için TLS'yi açın ve bir `wss://` / Tailscale Serve uç noktası kullanın.

İlk başarılı eşleştirmeden sonra Android açılışta otomatik olarak yeniden bağlanır:

- El ile girilen uç nokta (etkinse), aksi takdirde
- Son keşfedilen gateway (best-effort).

### 4) Eşleştirmeyi onaylayın (CLI)

Gateway makinesinde:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Eşleştirme ayrıntıları: [Eşleştirme](/tr/channels/pairing).

### 5) Düğümün bağlı olduğunu doğrulayın

- Düğüm durumu üzerinden:

  ```bash
  openclaw nodes status
  ```

- Gateway üzerinden:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Sohbet + geçmiş

Android Chat sekmesi oturum seçimini destekler (varsayılan `main`, ayrıca mevcut diğer oturumlar):

- Geçmiş: `chat.history` (görüntüleme için normalleştirilmiş; satır içi yönerge etiketleri görünür metinden
  kaldırılır, düz metin araç çağrısı XML yükleri (şunlar dahil:
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve
  kısaltılmış araç çağrısı blokları) ile sızan ASCII/tam genişlikli model kontrol belirteçleri
  kaldırılır, tam olarak `NO_REPLY` /
  `no_reply` olan saf sessiz belirteçli asistan satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir)
- Gönder: `chat.send`
- Anlık güncellemeler (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + kamera

#### Gateway Canvas Host (web içeriği için önerilir)

Düğümün, ajanın disk üzerinde düzenleyebileceği gerçek HTML/CSS/JS içeriğini göstermesini istiyorsanız, düğümü Gateway canvas host'una yönlendirin.

Not: düğümler canvas içeriğini Gateway HTTP sunucusundan yükler (`gateway.port` ile aynı port, varsayılan `18789`).

1. Gateway ana makinesinde `~/.openclaw/workspace/canvas/index.html` oluşturun.

2. Düğümü buna yönlendirin (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (isteğe bağlı): her iki cihaz da Tailscale üzerindeyse, `.local` yerine bir MagicDNS adı veya tailnet IP kullanın; örneğin `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Bu sunucu, HTML içine bir live-reload istemcisi ekler ve dosya değişikliklerinde yeniden yükleme yapar.
A2UI host'u `http://<gateway-host>:18789/__openclaw__/a2ui/` adresinde bulunur.

Canvas komutları (yalnızca foreground'da):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (varsayılan iskeleye dönmek için `{"url":""}` veya `{"url":"/"}` kullanın). `canvas.snapshot`, `{ format, base64 }` döndürür (varsayılan `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` eski takma adı)

Kamera komutları (yalnızca foreground'da; izin denetimli):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Parametreler ve CLI yardımcıları için [Camera node](/tr/nodes/camera) bölümüne bakın.

### 8) Ses + genişletilmiş Android komut yüzeyi

- Ses: Android, Voice sekmesinde konuşma metni yakalama ve `talk.speak` oynatımı ile tek bir mikrofon aç/kapat akışı kullanır. `talk.speak` kullanılamadığında yalnızca yerel sistem TTS kullanılır. Uygulama foreground'dan çıktığında ses durur.
- Voice wake/talk-mode geçişleri şu anda Android UX/runtime'dan kaldırılmıştır.
- Ek Android komut aileleri (kullanılabilirlik cihaza + izinlere bağlıdır):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (aşağıdaki [Bildirim yönlendirme](#notification-forwarding) bölümüne bakın)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Asistan giriş noktaları

Android, sistem asistanı tetikleyicisinden OpenClaw başlatmayı destekler (Google
Assistant). Yapılandırıldığında, ana ekran düğmesine basılı tutmak veya "Hey Google, ask
OpenClaw..." demek uygulamayı açar ve istemi sohbet oluşturucuya iletir.

Bu, uygulama manifestinde tanımlanan Android **App Actions** meta verilerini kullanır. Gateway tarafında
ek yapılandırma gerekmez -- asistan intent'i tamamen
Android uygulaması tarafından işlenir ve normal bir sohbet mesajı olarak iletilir.

<Note>
App Actions kullanılabilirliği cihaza, Google Play Services sürümüne
ve kullanıcının OpenClaw'u varsayılan asistan uygulaması olarak ayarlayıp ayarlamadığına bağlıdır.
</Note>

## Bildirim yönlendirme

Android, cihaz bildirimlerini olay olarak gateway'e yönlendirebilir. Birkaç denetim, hangi bildirimlerin ne zaman yönlendirileceğini kapsamlandırmanızı sağlar.

| Key                              | Type           | Description                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Bildirimleri yalnızca bu paket adlarından yönlendirir. Ayarlanırsa diğer tüm paketler yok sayılır. |
| `notifications.denyPackages`     | string[]       | Bildirimleri bu paket adlarından asla yönlendirmez. `allowPackages` sonrasında uygulanır. |
| `notifications.quietHours.start` | string (HH:mm) | Sessiz saatler aralığının başlangıcı (yerel cihaz saati). Bildirimler bu aralıkta bastırılır. |
| `notifications.quietHours.end`   | string (HH:mm) | Sessiz saatler aralığının bitişi. |
| `notifications.rateLimit`        | number         | Paket başına dakikada yönlendirilebilecek en fazla bildirim sayısı. Fazla bildirimler atılır. |

Bildirim seçici ayrıca yönlendirilen bildirim olayları için daha güvenli davranış kullanır ve hassas sistem bildirimlerinin yanlışlıkla yönlendirilmesini önler.

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
Bildirim yönlendirme, Android Notification Listener iznini gerektirir. Uygulama kurulum sırasında bunu ister.
</Note>
