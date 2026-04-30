---
read_when:
    - Android Node'u eşleştirme veya yeniden bağlama
    - Android Gateway keşfi veya kimlik doğrulamasında hata ayıklama
    - İstemciler arasında sohbet geçmişi eşdeğerliğini doğrulama
summary: 'Android uygulaması (node): bağlantı çalışma kitabı + Connect/Chat/Voice/Canvas komut yüzeyi'
title: Android uygulaması
x-i18n:
    generated_at: "2026-04-30T09:31:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae8bec406a006165f124f305e00c848f5527d43dba3cbcd07bd0d7e6f0dcc247
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Android uygulaması henüz herkese açık olarak yayımlanmadı. Kaynak kodu [OpenClaw deposunda](https://github.com/openclaw/openclaw) `apps/android` altında bulunur. Java 17 ve Android SDK (`./gradlew :app:assemblePlayDebug`) kullanarak kendiniz derleyebilirsiniz. Derleme talimatları için [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) bölümüne bakın.
</Note>

## Destek özeti

- Rol: eşlikçi Node uygulaması (Android, Gateway barındırmaz).
- Gateway gerekli: evet (macOS, Linux veya WSL2 üzerinden Windows'ta çalıştırın).
- Kurulum: [Başlarken](/tr/start/getting-started) + [Eşleştirme](/tr/channels/pairing).
- Gateway: [Çalıştırma kılavuzu](/tr/gateway) + [Yapılandırma](/tr/gateway/configuration).
  - Protokoller: [Gateway protokolü](/tr/gateway/protocol) (Node'lar + denetim düzlemi).

## Sistem denetimi

Sistem denetimi (launchd/systemd) Gateway ana makinesinde bulunur. Bkz. [Gateway](/tr/gateway).

## Bağlantı çalıştırma kılavuzu

Android Node uygulaması ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android doğrudan Gateway WebSocket'e bağlanır ve cihaz eşleştirmesini (`role: node`) kullanır.

Tailscale veya herkese açık ana makineler için Android güvenli bir uç nokta gerektirir:

- Tercih edilen: `https://<magicdns>` / `wss://<magicdns>` ile Tailscale Serve / Funnel
- Ayrıca desteklenir: gerçek bir TLS uç noktasına sahip herhangi bir diğer `wss://` Gateway URL'si
- Düz metin `ws://`, özel LAN adreslerinde / `.local` ana makinelerinde, ayrıca `localhost`, `127.0.0.1` ve Android emülatör köprüsünde (`10.0.2.2`) desteklenmeye devam eder

### Önkoşullar

- Gateway'i “ana” makinede çalıştırabilirsiniz.
- Android cihazı/emülatörü Gateway WebSocket'e erişebilir:
  - mDNS/NSD ile aynı LAN, **veya**
  - Wide-Area Bonjour / tekil yayın DNS-SD kullanan aynı Tailscale tailnet (aşağıya bakın), **veya**
  - Manuel Gateway ana makinesi/bağlantı noktası (geri dönüş)
- Tailnet/herkese açık mobil eşleştirme ham tailnet IP `ws://` uç noktalarını kullanmaz. Bunun yerine Tailscale Serve veya başka bir `wss://` URL'si kullanın.
- CLI'yi (`openclaw`) Gateway makinesinde (veya SSH üzerinden) çalıştırabilirsiniz.

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

Bu, Android'e güvenli bir `wss://` / `https://` uç noktası verir. Düz bir `gateway.bind: "tailnet"` kurulumu, ayrıca TLS'i ayrı olarak sonlandırmadığınız sürece ilk kez uzaktan Android eşleştirmesi için yeterli değildir.

### 2) Keşfi doğrulayın (isteğe bağlı)

Gateway makinesinden:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Daha fazla hata ayıklama notu: [Bonjour](/tr/gateway/bonjour).

Geniş alan keşif etki alanı da yapılandırdıysanız şununla karşılaştırın:

```bash
openclaw gateway discover --json
```

Bu, `local.` ile yapılandırılmış geniş alan etki alanını tek geçişte gösterir ve yalnızca TXT ipuçları yerine çözümlenen hizmet uç noktasını kullanır.

#### Tekil yayın DNS-SD ile tailnet (Viyana ⇄ Londra) keşfi

Android NSD/mDNS keşfi ağlar arasında geçiş yapmaz. Android Node'unuz ve Gateway farklı ağlardaysa ancak Tailscale üzerinden bağlıysa bunun yerine Wide-Area Bonjour / tekil yayın DNS-SD kullanın.

Keşif tek başına tailnet/herkese açık Android eşleştirmesi için yeterli değildir. Keşfedilen rotanın yine de güvenli bir uç noktaya (`wss://` veya Tailscale Serve) ihtiyacı vardır:

1. Gateway ana makinesinde bir DNS-SD bölgesi (örnek `openclaw.internal.`) kurun ve `_openclaw-gw._tcp` kayıtlarını yayımlayın.
2. Seçtiğiniz etki alanı için Tailscale split DNS'i o DNS sunucusunu gösterecek şekilde yapılandırın.

Ayrıntılar ve örnek CoreDNS yapılandırması: [Bonjour](/tr/gateway/bonjour).

### 3) Android'den bağlanın

Android uygulamasında:

- Uygulama, Gateway bağlantısını bir **ön plan hizmeti** (kalıcı bildirim) aracılığıyla canlı tutar.
- **Bağlan** sekmesini açın.
- **Kurulum Kodu** veya **Manuel** modunu kullanın.
- Keşif engellenirse **Gelişmiş denetimler** içinde manuel ana makine/bağlantı noktası kullanın. Özel LAN ana makineleri için `ws://` hâlâ çalışır. Tailscale/herkese açık ana makineler için TLS'i açın ve bir `wss://` / Tailscale Serve uç noktası kullanın.

İlk başarılı eşleştirmeden sonra Android açılışta otomatik olarak yeniden bağlanır:

- Manuel uç nokta (etkinse), aksi halde
- Son keşfedilen Gateway (en iyi çabayla).

### Presence alive işaretleri

Kimliği doğrulanmış Node oturumu bağlandıktan sonra ve uygulama arka plana geçerken ön plan hizmeti hâlâ bağlıysa Android, `event: "node.presence.alive"` ile `node.event` çağırır. Gateway bunu, yalnızca kimliği doğrulanmış Node cihaz kimliği bilindikten sonra eşleştirilmiş Node/cihaz meta verilerinde `lastSeenAtMs`/`lastSeenReason` olarak kaydeder.

Uygulama, işareti yalnızca Gateway yanıtında `handled: true` bulunduğunda başarıyla kaydedilmiş sayar. Daha eski Gateway'ler `node.event` çağrısını `{ "ok": true }` ile onaylayabilir; bu yanıt uyumludur ancak kalıcı bir son görülme güncellemesi olarak sayılmaz.

### 4) Eşleştirmeyi onaylayın (CLI)

Gateway makinesinde:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Eşleştirme ayrıntıları: [Eşleştirme](/tr/channels/pairing).

İsteğe bağlı: Android Node her zaman sıkı denetlenen bir alt ağdan bağlanıyorsa açık CIDR'lar veya tam IP'lerle ilk kez Node otomatik onayına katılabilirsiniz:

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

Bu varsayılan olarak devre dışıdır. Yalnızca istenen kapsamlar olmadan yeni `role: node` eşleştirmesine uygulanır. Operatör/tarayıcı eşleştirmesi ve herhangi bir rol, kapsam, meta veri veya açık anahtar değişikliği yine manuel onay gerektirir.

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

Android Sohbet sekmesi oturum seçimini destekler (varsayılan `main` ve diğer mevcut oturumlar):

- Geçmiş: `chat.history` (görüntü için normalize edilmiş; satır içi yönerge etiketleri görünür metinden çıkarılır, düz metin araç çağrısı XML yükleri (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil) ve sızmış ASCII/tam genişlik model denetim belirteçleri çıkarılır, tam `NO_REPLY` / `no_reply` gibi yalnızca sessiz belirteçten oluşan asistan satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir)
- Gönder: `chat.send`
- Anlık güncellemeler (en iyi çabayla): `chat.subscribe` → `event:"chat"`

### 7) Canvas + kamera

#### Gateway Canvas Ana Makinesi (web içeriği için önerilir)

Node'un, ajanın diskte düzenleyebileceği gerçek HTML/CSS/JS göstermesini istiyorsanız Node'u Gateway canvas ana makinesine yönlendirin.

<Note>
Node'lar canvas'ı Gateway HTTP sunucusundan yükler (`gateway.port` ile aynı bağlantı noktası, varsayılan `18789`).
</Note>

1. Gateway ana makinesinde `~/.openclaw/workspace/canvas/index.html` oluşturun.

2. Node'u buna yönlendirin (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (isteğe bağlı): iki cihaz da Tailscale üzerindeyse `.local` yerine bir MagicDNS adı veya tailnet IP'si kullanın; örneğin `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Bu sunucu HTML içine canlı yeniden yükleme istemcisi enjekte eder ve dosya değişikliklerinde yeniden yükler.
A2UI ana makinesi `http://<gateway-host>:18789/__openclaw__/a2ui/` adresinde bulunur.

Canvas komutları (yalnızca ön planda):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (varsayılan iskelete dönmek için `{"url":""}` veya `{"url":"/"}` kullanın). `canvas.snapshot`, `{ format, base64 }` döndürür (varsayılan `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` eski diğer ad)

Kamera komutları (yalnızca ön planda; izin korumalı):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Parametreler ve CLI yardımcıları için [Kamera Node'u](/tr/nodes/camera) bölümüne bakın.

### 8) Ses + genişletilmiş Android komut yüzeyi

- Ses sekmesi: Android'in iki açık yakalama modu vardır. **Mikrofon**, her duraklamayı sohbet turu olarak gönderen ve uygulama ön plandan ayrıldığında veya kullanıcı Ses sekmesinden çıktığında duran manuel bir Ses sekmesi oturumudur. **Konuş**, sürekli Konuşma Modudur ve kapatılana veya Node bağlantısı kesilene kadar dinlemeye devam eder.
- Konuşma Modu, yakalama başlamadan önce mevcut ön plan hizmetini `dataSync` değerinden `dataSync|microphone` değerine yükseltir, ardından Konuşma Modu durduğunda düşürür. Android 14+ çalışma zamanında `FOREGROUND_SERVICE_MICROPHONE` bildirimi, `RECORD_AUDIO` çalışma zamanı izni ve mikrofon hizmet türü gerektirir.
- Sesli yanıtlar, yapılandırılmış Gateway Konuşma sağlayıcısı üzerinden `talk.speak` kullanır. Yerel sistem TTS'i yalnızca `talk.speak` kullanılamadığında kullanılır.
- Sesle uyandırma Android UX/çalışma zamanında devre dışı kalır.
- Ek Android komut aileleri (kullanılabilirlik cihaza + izinlere bağlıdır):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (aşağıdaki [Bildirim iletme](#notification-forwarding) bölümüne bakın)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Asistan giriş noktaları

Android, sistem asistanı tetikleyicisinden (Google Assistant) OpenClaw başlatmayı destekler. Yapılandırıldığında ana ekran düğmesini basılı tutmak veya "Hey Google, ask OpenClaw..." demek uygulamayı açar ve istemi sohbet düzenleyicisine aktarır.

Bu, uygulama manifestinde bildirilen Android **App Actions** meta verilerini kullanır. Gateway tarafında ek yapılandırma gerekmez -- asistan intent'i tamamen Android uygulaması tarafından işlenir ve normal bir sohbet mesajı olarak iletilir.

<Note>
App Actions kullanılabilirliği cihaza, Google Play Services sürümüne ve kullanıcının OpenClaw'ı varsayılan asistan uygulaması olarak ayarlayıp ayarlamadığına bağlıdır.
</Note>

## Bildirim iletme

Android, cihaz bildirimlerini olay olarak Gateway'e iletebilir. Birkaç denetim, hangi bildirimlerin ne zaman iletileceğini kapsamlandırmanıza olanak tanır.

| Anahtar                         | Tür            | Açıklama                                                                                              |
| ------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Yalnızca bu paket adlarından gelen bildirimleri ilet. Ayarlanırsa diğer tüm paketler yok sayılır.     |
| `notifications.denyPackages`     | string[]       | Bu paket adlarından gelen bildirimleri asla iletme. `allowPackages` sonrasında uygulanır.             |
| `notifications.quietHours.start` | string (HH:mm) | Sessiz saatler penceresinin başlangıcı (yerel cihaz saati). Bu pencere sırasında bildirimler bastırılır. |
| `notifications.quietHours.end`   | string (HH:mm) | Sessiz saatler penceresinin sonu.                                                                     |
| `notifications.rateLimit`        | number         | Paket başına dakikada iletilecek maksimum bildirim sayısı. Fazla bildirimler bırakılır.               |

Bildirim seçici, iletilen bildirim olayları için daha güvenli davranış da kullanarak hassas sistem bildirimlerinin yanlışlıkla iletilmesini önler.

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
Bildirim iletme, Android Bildirim Dinleyicisi iznini gerektirir. Uygulama kurulum sırasında bunu ister.
</Note>

## İlgili

- [iOS uygulaması](/tr/platforms/ios)
- [Node'lar](/tr/nodes)
- [Android Node sorun giderme](/tr/nodes/troubleshooting)
