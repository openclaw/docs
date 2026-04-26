---
read_when:
    - Android düğümünü eşleştirme veya yeniden bağlama
    - Android Gateway keşfini veya kimlik doğrulamayı hata ayıklama
    - İstemciler arasında sohbet geçmişi eşliğini doğrulama
summary: 'Android uygulaması (Node): bağlantı çalıştırma kılavuzu + Connect/Chat/Voice/Canvas komut yüzeyi'
title: Android uygulaması
x-i18n:
    generated_at: "2026-04-26T11:35:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a47c07e3301ad7b98f4827c9c34c42b7ba2f92c55aabd7b49606ab688191b66
    source_path: platforms/android.md
    workflow: 15
---

> **Not:** Android uygulaması henüz herkese açık olarak yayımlanmadı. Kaynak kodu, [OpenClaw repository](https://github.com/openclaw/openclaw) içinde `apps/android` altında kullanılabilir. Java 17 ve Android SDK kullanarak kendiniz derleyebilirsiniz (`./gradlew :app:assemblePlayDebug`). Derleme talimatları için [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) sayfasına bakın.

## Destek özeti

- Rol: yardımcı Node uygulaması (Android, Gateway barındırmaz).
- Gateway gerekli: evet (macOS, Linux veya Windows üzerinde WSL2 aracılığıyla çalıştırın).
- Kurulum: [Başlangıç](/tr/start/getting-started) + [Eşleştirme](/tr/channels/pairing).
- Gateway: [Runbook](/tr/gateway) + [Yapılandırma](/tr/gateway/configuration).
  - Protokoller: [Gateway protocol](/tr/gateway/protocol) (Node'lar + denetim düzlemi).

## Sistem denetimi

Sistem denetimi (`launchd/systemd`) Gateway ana makinesinde bulunur. Bkz. [Gateway](/tr/gateway).

## Bağlantı Runbook'u

Android Node uygulaması ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android, doğrudan Gateway WebSocket'ine bağlanır ve cihaz eşleştirmesini kullanır (`role: node`).

Tailscale veya genel ana makineler için Android güvenli bir uç nokta gerektirir:

- Tercih edilen: `https://<magicdns>` / `wss://<magicdns>` ile Tailscale Serve / Funnel
- Ayrıca desteklenir: gerçek bir TLS uç noktasına sahip başka herhangi bir `wss://` Gateway URL'si
- Düz metin `ws://`, özel LAN adreslerinde / `.local` ana makinelerinde ve ayrıca `localhost`, `127.0.0.1` ile Android emülatör köprüsünde (`10.0.2.2`) desteklenmeye devam eder

### Ön koşullar

- Gateway'i “master” makinede çalıştırabiliyor olmanız gerekir.
- Android cihazı/emülatörü gateway WebSocket'ine erişebilmelidir:
  - mDNS/NSD ile aynı LAN üzerinde, **veya**
  - Wide-Area Bonjour / unicast DNS-SD kullanan aynı Tailscale tailnet üzerinde (aşağıya bakın), **veya**
  - El ile gateway ana makinesi/bağlantı noktası (yedek seçenek)
- Tailnet/genel mobil eşleştirme, ham tailnet IP `ws://` uç noktalarını **kullanmaz**. Bunun yerine Tailscale Serve veya başka bir `wss://` URL'si kullanın.
- Gateway makinesinde (veya SSH aracılığıyla) CLI'yi (`openclaw`) çalıştırabiliyor olmanız gerekir.

### 1) Gateway'i başlatın

```bash
openclaw gateway --port 18789 --verbose
```

Günlüklerde şuna benzer bir satır gördüğünüzü doğrulayın:

- `listening on ws://0.0.0.0:18789`

Tailscale üzerinden uzak Android erişimi için ham tailnet bağlaması yerine Serve/Funnel tercih edin:

```bash
openclaw gateway --tailscale serve
```

Bu, Android'e güvenli bir `wss://` / `https://` uç noktası sağlar. Düz bir `gateway.bind: "tailnet"` yapılandırması, TLS'yi ayrıca sonlandırmadığınız sürece ilk uzak Android eşleştirmesi için yeterli değildir.

### 2) Keşfi doğrulayın (isteğe bağlı)

Gateway makinesinden:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Daha fazla hata ayıklama notu: [Bonjour](/tr/gateway/bonjour).

Ayrıca bir geniş alan keşif etki alanı yapılandırdıysanız, şununla karşılaştırın:

```bash
openclaw gateway discover --json
```

Bu, tek geçişte `local.` ile yapılandırılmış geniş alan etki alanını gösterir ve yalnızca TXT ipuçları yerine çözümlenmiş hizmet uç noktasını kullanır.

#### Unicast DNS-SD üzerinden tailnet (Viyana ⇄ Londra) keşfi

Android NSD/mDNS keşfi ağlar arasında çalışmaz. Android Node'unuz ile gateway farklı ağlarda ama Tailscale ile bağlıysa bunun yerine Wide-Area Bonjour / unicast DNS-SD kullanın.

Yalnızca keşif, tailnet/genel Android eşleştirmesi için yeterli değildir. Keşfedilen yol yine de güvenli bir uç nokta gerektirir (`wss://` veya Tailscale Serve):

1. Gateway ana makinesinde bir DNS-SD bölgesi (örnek `openclaw.internal.`) kurun ve `_openclaw-gw._tcp` kayıtlarını yayımlayın.
2. Tailscale split DNS'i, seçtiğiniz etki alanı için bu DNS sunucusunu gösterecek şekilde yapılandırın.

Ayrıntılar ve örnek CoreDNS yapılandırması: [Bonjour](/tr/gateway/bonjour).

### 3) Android'den bağlanın

Android uygulamasında:

- Uygulama, gateway bağlantısını bir **foreground service** (kalıcı bildirim) aracılığıyla canlı tutar.
- **Connect** sekmesini açın.
- **Setup Code** veya **Manual** modunu kullanın.
- Keşif engelleniyorsa **Advanced controls** içinde el ile ana makine/bağlantı noktası kullanın. Özel LAN ana makineleri için `ws://` hâlâ çalışır. Tailscale/genel ana makineler için TLS'yi açın ve bir `wss://` / Tailscale Serve uç noktası kullanın.

İlk başarılı eşleştirmeden sonra Android, başlatıldığında otomatik olarak yeniden bağlanır:

- El ile yapılandırılmış uç nokta (etkinse), aksi halde
- Son keşfedilen gateway (best-effort).

### 4) Eşleştirmeyi onaylayın (CLI)

Gateway makinesinde:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Eşleştirme ayrıntıları: [Eşleştirme](/tr/channels/pairing).

İsteğe bağlı: Android Node her zaman sıkı biçimde denetlenen bir alt ağdan bağlanıyorsa, ilk kez bağlanan Node'lar için açık CIDR'ler veya tam IP'lerle otomatik onayı etkinleştirebilirsiniz:

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

Bu varsayılan olarak devre dışıdır. Yalnızca istenen kapsamları olmayan yeni `role: node` eşleştirmelerine uygulanır. Operatör/tarayıcı eşleştirmesi ile herhangi bir rol, kapsam, meta veri veya ortak anahtar değişikliği yine de el ile onay gerektirir.

### 5) Node'un bağlı olduğunu doğrulayın

- Node durumuyla:

  ```bash
  openclaw nodes status
  ```

- Gateway üzerinden:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Sohbet + geçmiş

Android Sohbet sekmesi oturum seçimini destekler (varsayılan `main`, ayrıca mevcut diğer oturumlar):

- Geçmiş: `chat.history` (görüntüleme için normalize edilmiştir; satır içi yönerge etiketleri görünür metinden kaldırılır, düz metin araç çağrısı XML yükleri — `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil — ile sızmış ASCII/tam genişlikte model denetim belirteçleri ayıklanır, tam olarak `NO_REPLY` / `no_reply` olan saf sessiz-belirteç yardımcı satırları atlanır ve aşırı büyük satırlar yer tutucularla değiştirilebilir)
- Gönderme: `chat.send`
- Anlık güncellemeler (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + kamera

#### Gateway Canvas Host (web içeriği için önerilir)

Node'un gerçek HTML/CSS/JS göstermesini ve aracının bunları disk üzerinde düzenleyebilmesini istiyorsanız, Node'u Gateway canvas host'una yönlendirin.

Not: Node'lar canvas'ı Gateway HTTP sunucusundan yükler (aynı bağlantı noktası `gateway.port`, varsayılan `18789`).

1. Gateway ana makinesinde `~/.openclaw/workspace/canvas/index.html` oluşturun.

2. Node'u buna yönlendirin (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (isteğe bağlı): her iki cihaz da Tailscale üzerindeyse `.local` yerine bir MagicDNS adı veya tailnet IP'si kullanın; örneğin `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Bu sunucu, HTML içine canlı yeniden yükleme istemcisi ekler ve dosya değişikliklerinde yeniden yükler.
A2UI host'u `http://<gateway-host>:18789/__openclaw__/a2ui/` adresinde bulunur.

Canvas komutları (yalnızca ön planda):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (varsayılan iskelete dönmek için `{"url":""}` veya `{"url":"/"}` kullanın). `canvas.snapshot`, `{ format, base64 }` döndürür (varsayılan `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` eski takma adı)

Kamera komutları (yalnızca ön planda; izin denetimli):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Parametreler ve CLI yardımcıları için [Camera node](/tr/nodes/camera) sayfasına bakın.

### 8) Ses + genişletilmiş Android komut yüzeyi

- Ses sekmesi: Android iki açık yakalama moduna sahiptir. **Mic**, her duraklamayı bir sohbet dönüşü olarak gönderen ve uygulama ön plandan çıktığında veya kullanıcı Ses sekmesinden ayrıldığında duran, Ses sekmesine özgü el ile bir oturumdur. **Talk**, sürekli Talk Mode'dur ve kapatılana ya da Node bağlantısı kesilene kadar dinlemeyi sürdürür.
- Talk Mode, yakalama başlamadan önce mevcut foreground service'i `dataSync` durumundan `dataSync|microphone` durumuna yükseltir, ardından Talk Mode durduğunda tekrar düşürür. Android 14+; `FOREGROUND_SERVICE_MICROPHONE` bildirimi, `RECORD_AUDIO` çalışma zamanı izni ve çalışma zamanında mikrofon hizmet türü gerektirir.
- Sesli yanıtlar, yapılandırılmış gateway Talk sağlayıcısı üzerinden `talk.speak` kullanır. Yerel sistem TTS yalnızca `talk.speak` kullanılamadığında kullanılır.
- Sesle uyandırma Android UX/runtime içinde devre dışı kalmaya devam eder.
- Ek Android komut aileleri (kullanılabilirlik cihaza + izinlere bağlıdır):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (aşağıdaki [Bildirim yönlendirme](#notification-forwarding) bölümüne bakın)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Yardımcı giriş noktaları

Android, sistem yardımcı tetikleyicisinden OpenClaw başlatmayı destekler (Google
Assistant). Yapılandırıldığında, ana ekran düğmesine basılı tutmak veya "Hey Google, ask
OpenClaw..." demek uygulamayı açar ve istemi sohbet düzenleyicisine aktarır.

Bu, uygulama manifest dosyasında bildirilen Android **App Actions** meta verilerini kullanır. Gateway tarafında ek bir yapılandırma gerekmez -- yardımcı amacı tamamen Android uygulaması tarafından işlenir ve normal bir sohbet mesajı olarak iletilir.

<Note>
App Actions kullanılabilirliği cihaza, Google Play Services sürümüne
ve kullanıcının OpenClaw'ı varsayılan yardımcı uygulaması olarak ayarlayıp ayarlamadığına bağlıdır.
</Note>

## Bildirim yönlendirme

Android, cihaz bildirimlerini olay olarak gateway'e yönlendirebilir. Birkaç denetim, hangi bildirimlerin ve ne zaman yönlendirileceğini kapsamlandırmanıza olanak tanır.

| Anahtar                          | Tür            | Açıklama                                                                                         |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| `notifications.allowPackages`    | string[]       | Yalnızca bu paket adlarından gelen bildirimleri yönlendirir. Ayarlanırsa diğer tüm paketler yok sayılır. |
| `notifications.denyPackages`     | string[]       | Bu paket adlarından gelen bildirimleri asla yönlendirmez. `allowPackages` sonrasında uygulanır. |
| `notifications.quietHours.start` | string (HH:mm) | Sessiz saatler penceresinin başlangıcıdır (cihazın yerel saati). Bildirimler bu pencere sırasında bastırılır. |
| `notifications.quietHours.end`   | string (HH:mm) | Sessiz saatler penceresinin sonudur.                                                             |
| `notifications.rateLimit`        | number         | Paket başına dakikada yönlendirilecek en yüksek bildirim sayısıdır. Fazla bildirimler düşürülür. |

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
Bildirim yönlendirme, Android Notification Listener izni gerektirir. Uygulama kurulum sırasında bunu ister.
</Note>

## İlgili

- [iOS uygulaması](/tr/platforms/ios)
- [Node'lar](/tr/nodes)
- [Android Node sorun giderme](/tr/nodes/troubleshooting)
