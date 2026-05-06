---
read_when:
    - Android Node'unu eşleştirme veya yeniden bağlama
    - Android Gateway keşfi veya kimlik doğrulamasında hata ayıklama
    - İstemciler arasında sohbet geçmişi eşdeğerliğini doğrulama
summary: 'Android uygulaması (node): bağlantı operasyon kılavuzu + Bağlan/Sohbet/Ses/Tuval komut yüzeyi'
title: Android uygulaması
x-i18n:
    generated_at: "2026-05-06T09:21:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: cce53df4675e01858ced3d58142512ad096ced0ef50cd617e57b65f9cf911c05
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Android uygulaması henüz herkese açık olarak yayımlanmadı. Kaynak kodu [OpenClaw deposunda](https://github.com/openclaw/openclaw) `apps/android` altında bulunur. Java 17 ve Android SDK (`./gradlew :app:assemblePlayDebug`) kullanarak kendiniz derleyebilirsiniz. Derleme yönergeleri için [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) bölümüne bakın.
</Note>

## Destek anlık görüntüsü

- Rol: eşlikçi node uygulaması (Android, Gateway barındırmaz).
- Gateway gerekli: evet (macOS, Linux veya WSL2 üzerinden Windows'ta çalıştırın).
- Kurulum: [Başlarken](/tr/start/getting-started) + [Eşleştirme](/tr/channels/pairing).
- Gateway: [Çalıştırma kılavuzu](/tr/gateway) + [Yapılandırma](/tr/gateway/configuration).
  - Protokoller: [Gateway protokolü](/tr/gateway/protocol) (node'lar + kontrol düzlemi).

## Sistem denetimi

Sistem denetimi (launchd/systemd), Gateway ana makinesinde bulunur. [Gateway](/tr/gateway) bölümüne bakın.

## Bağlantı çalıştırma kılavuzu

Android node uygulaması ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android, doğrudan Gateway WebSocket'ine bağlanır ve cihaz eşleştirmesini (`role: node`) kullanır.

Tailscale veya herkese açık ana makineler için Android güvenli bir uç nokta gerektirir:

- Tercih edilen: `https://<magicdns>` / `wss://<magicdns>` ile Tailscale Serve / Funnel
- Ayrıca desteklenir: gerçek bir TLS uç noktasına sahip başka herhangi bir `wss://` Gateway URL'si
- Düz metin `ws://`, özel LAN adreslerinde / `.local` ana makinelerinde, ayrıca `localhost`, `127.0.0.1` ve Android emülatör köprüsünde (`10.0.2.2`) desteklenmeye devam eder

### Ön koşullar

- Gateway'i "master" makinede çalıştırabilirsiniz.
- Android cihaz/emülatör gateway WebSocket'ine erişebilir:
  - mDNS/NSD ile aynı LAN, **veya**
  - Wide-Area Bonjour / unicast DNS-SD kullanarak aynı Tailscale tailnet'i (aşağıya bakın), **veya**
  - Manuel gateway ana makinesi/bağlantı noktası (yedek)
- Tailnet/herkese açık mobil eşleştirme, ham tailnet IP `ws://` uç noktaları kullanmaz. Bunun yerine Tailscale Serve veya başka bir `wss://` URL'si kullanın.
- CLI'yi (`openclaw`) gateway makinesinde (veya SSH üzerinden) çalıştırabilirsiniz.

### 1) Gateway'i başlatın

```bash
openclaw gateway --port 18789 --verbose
```

Günlüklerde şuna benzer bir şey gördüğünüzü doğrulayın:

- `listening on ws://0.0.0.0:18789`

Tailscale üzerinden uzaktan Android erişimi için ham tailnet bağlaması yerine Serve/Funnel tercih edin:

```bash
openclaw gateway --tailscale serve
```

Bu, Android'e güvenli bir `wss://` / `https://` uç noktası sağlar. Düz bir `gateway.bind: "tailnet"` kurulumu, TLS'i ayrıca sonlandırmadığınız sürece ilk kez uzaktan Android eşleştirmesi için yeterli değildir.

### 2) Keşfi doğrulayın (isteğe bağlı)

Gateway makinesinden:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Daha fazla hata ayıklama notu: [Bonjour](/tr/gateway/bonjour).

Ayrıca bir geniş alan keşif alan adı yapılandırdıysanız şununla karşılaştırın:

```bash
openclaw gateway discover --json
```

Bu, tek geçişte `local.` ile yapılandırılmış geniş alan alan adını gösterir ve yalnızca TXT ipuçları yerine çözümlenen hizmet uç noktasını kullanır.

#### Unicast DNS-SD üzerinden Tailnet (Viyana ⇄ Londra) keşfi

Android NSD/mDNS keşfi ağlar arasında geçiş yapmaz. Android node'unuz ve gateway farklı ağlardaysa ancak Tailscale ile bağlıysa bunun yerine Wide-Area Bonjour / unicast DNS-SD kullanın.

Keşif tek başına tailnet/herkese açık Android eşleştirmesi için yeterli değildir. Keşfedilen rota yine de güvenli bir uç nokta (`wss://` veya Tailscale Serve) gerektirir:

1. Gateway ana makinesinde bir DNS-SD bölgesi (örnek `openclaw.internal.`) kurun ve `_openclaw-gw._tcp` kayıtlarını yayımlayın.
2. Seçtiğiniz alan adı için, bu DNS sunucusunu işaret eden Tailscale split DNS yapılandırın.

Ayrıntılar ve örnek CoreDNS yapılandırması: [Bonjour](/tr/gateway/bonjour).

### 3) Android'den bağlanın

Android uygulamasında:

- Uygulama, gateway bağlantısını bir **ön plan hizmeti** (kalıcı bildirim) aracılığıyla canlı tutar.
- **Connect** sekmesini açın.
- **Setup Code** veya **Manual** modunu kullanın.
- Keşif engellenirse **Advanced controls** içinde manuel ana makine/bağlantı noktası kullanın. Özel LAN ana makineleri için `ws://` çalışmaya devam eder. Tailscale/herkese açık ana makineler için TLS'i açın ve bir `wss://` / Tailscale Serve uç noktası kullanın.

İlk başarılı eşleştirmeden sonra Android başlangıçta otomatik yeniden bağlanır:

- Manuel uç nokta (etkinse), aksi halde
- Son keşfedilen gateway (en iyi çaba).

### Presence alive işaretleri

Kimliği doğrulanmış node oturumu bağlandıktan sonra ve uygulama, ön plan hizmeti hâlâ bağlıyken arka plana geçtiğinde Android, `event: "node.presence.alive"` ile `node.event` çağırır. Gateway bunu, yalnızca kimliği doğrulanmış node cihaz kimliği bilindikten sonra eşleştirilmiş node/cihaz meta verilerinde `lastSeenAtMs`/`lastSeenReason` olarak kaydeder.

Uygulama, işaretin başarıyla kaydedildiğini yalnızca gateway yanıtında `handled: true` bulunduğunda sayar. Eski gateway'ler `node.event` çağrısını `{ "ok": true }` ile onaylayabilir; bu yanıt uyumludur ancak kalıcı bir son görülme güncellemesi olarak sayılmaz.

### 4) Eşleştirmeyi onaylayın (CLI)

Gateway makinesinde:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Eşleştirme ayrıntıları: [Eşleştirme](/tr/channels/pairing).

İsteğe bağlı: Android node her zaman sıkı biçimde denetlenen bir alt ağdan bağlanıyorsa açık CIDR'ler veya tam IP'ler ile ilk kez node otomatik onayına katılabilirsiniz:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Bu varsayılan olarak devre dışıdır. Yalnızca istenen kapsamı olmayan yeni `role: node` eşleştirmesi için geçerlidir. Operatör/tarayıcı eşleştirmesi ve herhangi bir rol, kapsam, meta veri veya açık anahtar değişikliği yine manuel onay gerektirir.

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

Android Chat sekmesi oturum seçimini destekler (varsayılan `main` ve diğer mevcut oturumlar):

- Geçmiş: `chat.history` (görüntü-normalize edilmiş; satır içi yönerge etiketleri görünür metinden çıkarılır, düz metin tool-call XML yükleri (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş tool-call blokları dahil) ve sızan ASCII/tam genişlikli model denetim token'ları çıkarılır, tam `NO_REPLY` / `no_reply` gibi saf sessiz-token assistant satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir)
- Gönder: `chat.send`
- Anlık güncellemeler (en iyi çaba): `chat.subscribe` → `event:"chat"`

### 7) Canvas + kamera

#### Gateway Canvas Host (web içeriği için önerilir)

Node'un aracının diskte düzenleyebileceği gerçek HTML/CSS/JS göstermesini istiyorsanız node'u Gateway canvas host'una yönlendirin.

<Note>
Node'lar canvas'ı Gateway HTTP sunucusundan yükler (`gateway.port` ile aynı bağlantı noktası, varsayılan `18789`).
</Note>

1. Gateway ana makinesinde `~/.openclaw/workspace/canvas/index.html` oluşturun.

2. Node'u buna yönlendirin (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (isteğe bağlı): Her iki cihaz da Tailscale üzerindeyse `.local` yerine bir MagicDNS adı veya tailnet IP kullanın; ör. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Bu sunucu HTML'ye canlı yeniden yükleme istemcisi enjekte eder ve dosya değişikliklerinde yeniden yükler.
A2UI host'u `http://<gateway-host>:18789/__openclaw__/a2ui/` adresinde bulunur.

Canvas komutları (yalnızca ön planda):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (varsayılan iskelete dönmek için `{"url":""}` veya `{"url":"/"}` kullanın). `canvas.snapshot`, `{ format, base64 }` döndürür (varsayılan `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` eski takma adı)

Kamera komutları (yalnızca ön planda; izin denetimli):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Parametreler ve CLI yardımcıları için [Kamera node'u](/tr/nodes/camera) bölümüne bakın.

### 8) Ses + genişletilmiş Android komut yüzeyi

- Voice sekmesi: Android'in iki açık yakalama modu vardır. **Mic**, her duraklamayı bir sohbet turu olarak gönderen ve uygulama ön plandan çıktığında veya kullanıcı Voice sekmesinden ayrıldığında duran manuel bir Voice sekmesi oturumudur. **Talk**, sürekli Talk Mode'dur ve kapatılana veya node bağlantısı kesilene kadar dinlemeyi sürdürür.
- Talk Mode, yakalama başlamadan önce mevcut ön plan hizmetini `dataSync` değerinden `dataSync|microphone` değerine yükseltir, ardından Talk Mode durduğunda geri düşürür. Android 14+ `FOREGROUND_SERVICE_MICROPHONE` bildirimini, `RECORD_AUDIO` çalışma zamanı iznini ve çalışma zamanında mikrofon hizmet türünü gerektirir.
- Sesli yanıtlar, yapılandırılmış gateway Talk sağlayıcısı üzerinden `talk.speak` kullanır. Yerel sistem TTS'i yalnızca `talk.speak` kullanılamadığında kullanılır.
- Voice wake, Android UX/çalışma zamanında devre dışı kalır.
- Ek Android komut aileleri (kullanılabilirlik cihaz + izinlere bağlıdır):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (aşağıdaki [Bildirim yönlendirme](#notification-forwarding) bölümüne bakın)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Assistant giriş noktaları

Android, sistem assistant tetikleyicisinden (Google Assistant) OpenClaw başlatmayı destekler. Yapılandırıldığında ana ekran düğmesini basılı tutmak veya "Hey Google, ask OpenClaw..." demek uygulamayı açar ve istemi sohbet düzenleyicisine aktarır.

Bu, uygulama manifestinde bildirilen Android **App Actions** meta verilerini kullanır. Gateway tarafında ek yapılandırma gerekmez; assistant intent tamamen Android uygulaması tarafından işlenir ve normal bir sohbet iletisi olarak iletilir.

<Note>
App Actions kullanılabilirliği cihaza, Google Play Services sürümüne ve kullanıcının OpenClaw'ı varsayılan assistant uygulaması olarak ayarlayıp ayarlamadığına bağlıdır.
</Note>

## Bildirim yönlendirme

Android, cihaz bildirimlerini gateway'e olaylar olarak yönlendirebilir. Hangi bildirimlerin ne zaman yönlendirileceğini kapsamlandırmanızı sağlayan çeşitli denetimler vardır.

| Anahtar                         | Tür            | Açıklama                                                                                                  |
| ------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Yalnızca bu paket adlarından gelen bildirimleri yönlendir. Ayarlanırsa diğer tüm paketler yok sayılır.     |
| `notifications.denyPackages`     | string[]       | Bu paket adlarından gelen bildirimleri asla yönlendirme. `allowPackages` sonrasında uygulanır.             |
| `notifications.quietHours.start` | string (HH:mm) | Sessiz saatler penceresinin başlangıcı (yerel cihaz saati). Bu pencere sırasında bildirimler bastırılır.   |
| `notifications.quietHours.end`   | string (HH:mm) | Sessiz saatler penceresinin sonu.                                                                          |
| `notifications.rateLimit`        | number         | Paket başına dakikada yönlendirilen en fazla bildirim sayısı. Fazla bildirimler bırakılır.                 |

Bildirim seçici, yönlendirilen bildirim olayları için daha güvenli davranış da kullanır ve hassas sistem bildirimlerinin yanlışlıkla yönlendirilmesini önler.

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
Bildirim yönlendirme, Android Notification Listener izni gerektirir. Uygulama kurulum sırasında bunun için istem gösterir.
</Note>

## İlgili

- [iOS uygulaması](/tr/platforms/ios)
- [Node'lar](/tr/nodes)
- [Android node sorun giderme](/tr/nodes/troubleshooting)
