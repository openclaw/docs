---
read_when:
    - Android düğümünü eşleştirme veya yeniden bağlama
    - Android Gateway keşfini veya kimlik doğrulamasını hata ayıklama
    - İstemciler arasında sohbet geçmişi eşdeğerliğini doğrulama
summary: 'Android uygulaması (node): bağlantı runbook''u + Bağlan/Sohbet/Ses/Canvas komut yüzeyi'
title: Android uygulaması
x-i18n:
    generated_at: "2026-06-28T00:47:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c02d4921c3f3011c09e564d83b773a7c155d17a82a6e70d3fd3e973597142f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Resmi Android uygulaması [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) üzerinde kullanılabilir. Bu, yardımcı bir düğümdür ve çalışan bir OpenClaw Gateway gerektirir. Kaynak kodu da [OpenClaw deposunda](https://github.com/openclaw/openclaw) `apps/android` altında bulunur; derleme yönergeleri için [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) bölümüne bakın.
</Note>

## Destek özeti

- Rol: yardımcı düğüm uygulaması (Android Gateway barındırmaz).
- Gateway gerekli: evet (macOS, Linux veya WSL2 üzerinden Windows üzerinde çalıştırın).
- Kurulum: uygulama için [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN), Gateway için [Başlarken](/tr/start/getting-started), ardından [Eşleştirme](/tr/channels/pairing).
- Gateway: [Çalıştırma kitabı](/tr/gateway) + [Yapılandırma](/tr/gateway/configuration).
  - Protokoller: [Gateway protokolü](/tr/gateway/protocol) (düğümler + kontrol düzlemi).

## Sistem denetimi

Sistem denetimi (launchd/systemd) Gateway ana makinesinde bulunur. Bkz. [Gateway](/tr/gateway).

## Bağlantı çalıştırma kitabı

Android düğüm uygulaması ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android doğrudan Gateway WebSocket'e bağlanır ve cihaz eşleştirmesini (`role: node`) kullanır.

Tailscale veya herkese açık ana makineler için Android güvenli bir uç nokta gerektirir:

- Tercih edilen: `https://<magicdns>` / `wss://<magicdns>` ile Tailscale Serve / Funnel
- Ayrıca desteklenir: gerçek bir TLS uç noktasına sahip başka herhangi bir `wss://` Gateway URL'si
- Şifresiz `ws://`, özel LAN adreslerinde / `.local` ana makinelerinde, ayrıca `localhost`, `127.0.0.1` ve Android emülatör köprüsünde (`10.0.2.2`) desteklenmeye devam eder

### Önkoşullar

- Gateway'i "ana" makinede çalıştırabilirsiniz.
- Android cihaz/emülatör gateway WebSocket'e erişebilir:
  - mDNS/NSD ile aynı LAN, **veya**
  - Wide-Area Bonjour / tek noktaya yayın DNS-SD kullanarak aynı Tailscale tailnet (aşağıya bakın), **veya**
  - Manuel gateway ana makinesi/bağlantı noktası (geri dönüş)
- Tailnet/herkese açık mobil eşleştirme, ham tailnet IP `ws://` uç noktalarını kullanmaz. Bunun yerine Tailscale Serve veya başka bir `wss://` URL'si kullanın.
- CLI'yi (`openclaw`) gateway makinesinde (veya SSH üzerinden) çalıştırabilirsiniz.

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

Bu, Android'e güvenli bir `wss://` / `https://` uç noktası sağlar. Düz bir `gateway.bind: "tailnet"` kurulumu, TLS'yi ayrıca sonlandırmadığınız sürece ilk kez uzak Android eşleştirmesi için yeterli değildir.

### 2) Keşfi doğrulayın (isteğe bağlı)

Gateway makinesinden:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Daha fazla hata ayıklama notu: [Bonjour](/tr/gateway/bonjour).

Bir geniş alan keşif etki alanı da yapılandırdıysanız şununla karşılaştırın:

```bash
openclaw gateway discover --json
```

Bu, `local.` ile yapılandırılmış geniş alan etki alanını tek geçişte gösterir ve yalnızca TXT ipuçları yerine çözümlenmiş
hizmet uç noktasını kullanır.

#### Tek noktaya yayın DNS-SD ile Tailnet (Viyana ⇄ Londra) keşfi

Android NSD/mDNS keşfi ağlar arasında çalışmaz. Android düğümünüz ve gateway farklı ağlardaysa ancak Tailscale ile bağlıysa bunun yerine Wide-Area Bonjour / tek noktaya yayın DNS-SD kullanın.

Keşif tek başına tailnet/herkese açık Android eşleştirmesi için yeterli değildir. Keşfedilen rota yine de güvenli bir uç nokta (`wss://` veya Tailscale Serve) gerektirir:

1. Gateway ana makinesinde bir DNS-SD bölgesi (örnek `openclaw.internal.`) kurun ve `_openclaw-gw._tcp` kayıtlarını yayımlayın.
2. Seçtiğiniz etki alanı için Tailscale bölünmüş DNS'yi bu DNS sunucusuna işaret edecek şekilde yapılandırın.

Ayrıntılar ve örnek CoreDNS yapılandırması: [Bonjour](/tr/gateway/bonjour).

### 3) Android'den bağlanın

Android uygulamasında:

- Uygulama gateway bağlantısını bir **ön plan hizmeti** (kalıcı bildirim) aracılığıyla canlı tutar.
- **Bağlan** sekmesini açın.
- **Kurulum Kodu** veya **Manuel** modunu kullanın.
- Keşif engellenirse **Gelişmiş denetimler** içinde manuel ana makine/bağlantı noktası kullanın. Özel LAN ana makineleri için `ws://` hâlâ çalışır. Tailscale/herkese açık ana makineler için TLS'yi açın ve bir `wss://` / Tailscale Serve uç noktası kullanın.

İlk başarılı eşleştirmeden sonra Android başlatıldığında otomatik olarak yeniden bağlanır:

- Manuel uç nokta (etkinse), aksi takdirde
- Son keşfedilen gateway (en iyi çaba).

### Varlık canlı işaretleri

Kimliği doğrulanmış düğüm oturumu bağlandıktan sonra ve uygulama arka plana geçtiğinde
ön plan hizmeti hâlâ bağlıysa Android, `event: "node.presence.alive"` ile
`node.event` çağırır. Gateway bunu, yalnızca kimliği doğrulanmış düğüm cihaz kimliği bilindikten sonra
eşleştirilmiş düğüm/cihaz meta verilerinde `lastSeenAtMs`/`lastSeenReason` olarak kaydeder.

Uygulama, işaretin başarıyla kaydedildiğini yalnızca gateway yanıtı
`handled: true` içerdiğinde kabul eder. Eski gateway'ler `node.event` öğesini `{ "ok": true }` ile onaylayabilir; bu yanıt
uyumludur ancak kalıcı bir son görülme güncellemesi olarak sayılmaz.

### 4) Eşleştirmeyi onaylayın (CLI)

Gateway makinesinde:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Eşleştirme ayrıntıları: [Eşleştirme](/tr/channels/pairing).

İsteğe bağlı: Android düğümü her zaman sıkı denetlenen bir alt ağdan bağlanıyorsa,
açık CIDR'ler veya tam IP'lerle ilk kez düğüm otomatik onayına katılabilirsiniz:

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

Bu varsayılan olarak devre dışıdır. Yalnızca istenen kapsamlar olmadan yeni `role: node` eşleştirmesi için geçerlidir.
Operatör/tarayıcı eşleştirmesi ve herhangi bir rol, kapsam, meta veri veya
açık anahtar değişikliği hâlâ manuel onay gerektirir.

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

Android Sohbet sekmesi oturum seçimini destekler (varsayılan `main`, ayrıca mevcut diğer oturumlar):

- Geçmiş: `chat.history` (görüntü için normalleştirilmiş; satır içi yönerge etiketleri
  görünür metinden çıkarılır, düz metin araç çağrısı XML yükleri (`<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil) ve sızan ASCII/tam genişlikli model denetim belirteçleri
  çıkarılır, tam `NO_REPLY` /
  `no_reply` gibi yalnızca sessiz belirteç içeren asistan satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir)
- Gönder: `chat.send`
- Anlık güncellemeler (en iyi çaba): `chat.subscribe` → `event:"chat"`

### 7) Canvas + kamera

#### Gateway Canvas Ana Makinesi (web içeriği için önerilir)

Düğümün aracının diskte düzenleyebileceği gerçek HTML/CSS/JS göstermesini istiyorsanız düğümü Gateway canvas ana makinesine yönlendirin.

<Note>
Düğümler canvas'ı Gateway HTTP sunucusundan yükler (`gateway.port` ile aynı bağlantı noktası, varsayılan `18789`).
</Note>

1. Gateway ana makinesinde `~/.openclaw/workspace/canvas/index.html` oluşturun.

2. Düğümü buraya yönlendirin (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (isteğe bağlı): her iki cihaz da Tailscale üzerindeyse `.local` yerine bir MagicDNS adı veya tailnet IP'si kullanın, örn. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Bu sunucu HTML içine canlı yeniden yükleme istemcisi enjekte eder ve dosya değişikliklerinde yeniden yükler.
Gateway ayrıca `/__openclaw__/a2ui/` sunar, ancak Android uygulaması uzak A2UI sayfalarını yalnızca görüntüleme amaçlı kabul eder. Eylem yapabilen A2UI komutları, iletileri uygulamadan önce paketlenmiş uygulama sahipliğindeki A2UI sayfasını kullanır.

Canvas komutları (yalnızca ön planda):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (varsayılan iskelete dönmek için `{"url":""}` veya `{"url":"/"}` kullanın). `canvas.snapshot`, `{ format, base64 }` döndürür (varsayılan `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` eski takma adı). Bu komutlar, eylem yapabilen işleme için paketlenmiş uygulama sahipliğindeki A2UI sayfasını kullanır.

Kamera komutları (yalnızca ön planda; izin denetimli):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Parametreler ve CLI yardımcıları için [Kamera düğümü](/tr/nodes/camera) bölümüne bakın.

### 8) Ses + genişletilmiş Android komut yüzeyi

- Ses sekmesi: Android'in iki açık yakalama modu vardır. **Mikrofon**, her duraklamayı sohbet turu olarak gönderen ve uygulama ön plandan çıktığında veya kullanıcı Ses sekmesinden ayrıldığında duran manuel bir Ses sekmesi oturumudur. **Konuş**, sürekli Konuş Modudur ve kapatılana veya düğüm bağlantısı kesilene kadar dinlemeye devam eder.
- Konuş Modu, yakalama başlamadan önce mevcut ön plan hizmetini `connectedDevice` öğesinden `connectedDevice|microphone` öğesine yükseltir, ardından Konuş Modu durduğunda tekrar düşürür. Düğüm hizmeti `CHANGE_NETWORK_STATE` ile `FOREGROUND_SERVICE_CONNECTED_DEVICE` bildirir; Android 14+ ayrıca `FOREGROUND_SERVICE_MICROPHONE` bildirimini, `RECORD_AUDIO` çalışma zamanı iznini ve çalışma zamanında mikrofon hizmet türünü gerektirir.
- Varsayılan olarak Android Konuş, yapılandırılmış gateway Konuş sağlayıcısı üzerinden yerel konuşma tanıma, Gateway sohbeti ve `talk.speak` kullanır. Yerel sistem TTS yalnızca `talk.speak` kullanılamadığında kullanılır.
- Android Konuş, gerçek zamanlı Gateway aktarmasını yalnızca `talk.realtime.mode` `realtime` ve `talk.realtime.transport` `gateway-relay` olduğunda kullanır.
- Sesle uyandırma Android UX/çalışma zamanında devre dışı kalır.
- Ek Android komut aileleri (kullanılabilirlik cihaza, izinlere ve kullanıcı ayarlarına bağlıdır):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` yalnızca **Ayarlar > Telefon Yetenekleri > Yüklü Uygulamalar** etkin olduğunda; varsayılan olarak başlatıcıda görünür uygulamaları listeler.
  - `notifications.list`, `notifications.actions` (aşağıdaki [Bildirim iletme](#notification-forwarding) bölümüne bakın)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Asistan giriş noktaları

Android, sistem asistanı tetikleyicisinden (Google
Assistant) OpenClaw başlatmayı destekler. Yapılandırıldığında, ana ekran düğmesini basılı tutmak veya "Hey Google, ask
OpenClaw..." demek uygulamayı açar ve istemi sohbet düzenleyicisine aktarır.

Bu, uygulama manifestinde bildirilen Android **App Actions** meta verilerini kullanır. Gateway tarafında
ek yapılandırma gerekmez -- asistan niyeti tamamen Android uygulaması tarafından
işlenir ve normal bir sohbet iletisi olarak iletilir.

<Note>
App Actions kullanılabilirliği cihaza, Google Play Services sürümüne
ve kullanıcının OpenClaw'ı varsayılan asistan uygulaması olarak ayarlayıp ayarlamadığına bağlıdır.
</Note>

## Bildirim iletme

Android, cihaz bildirimlerini olaylar olarak gateway'e iletebilir. Birkaç denetim, hangi bildirimlerin ne zaman iletileceğini kapsamlandırmanıza olanak tanır.

| Anahtar                          | Tür            | Açıklama                                                                                          |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Yalnızca bu paket adlarından gelen bildirimleri ilet. Ayarlanırsa diğer tüm paketler yok sayılır. |
| `notifications.denyPackages`     | string[]       | Bu paket adlarından gelen bildirimleri asla iletme. `allowPackages` sonrasında uygulanır.         |
| `notifications.quietHours.start` | string (HH:mm) | Sessiz saatler penceresinin başlangıcı (yerel cihaz saati). Bu pencere sırasında bildirimler bastırılır. |
| `notifications.quietHours.end`   | string (HH:mm) | Sessiz saatler penceresinin sonu.                                                                 |
| `notifications.rateLimit`        | number         | Paket başına dakikada iletilecek en fazla bildirim sayısı. Fazla bildirimler bırakılır.           |

Bildirim seçici ayrıca iletilen bildirim olayları için daha güvenli davranış kullanır ve hassas sistem bildirimlerinin yanlışlıkla iletilmesini önler.

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
Bildirim iletme, Android Bildirim Dinleyicisi iznini gerektirir. Uygulama kurulum sırasında bunun için istem gösterir.
</Note>

## İlgili

- [iOS uygulaması](/tr/platforms/ios)
- [Node'lar](/tr/nodes)
- [Android Node sorun giderme](/tr/nodes/troubleshooting)
