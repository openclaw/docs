---
read_when:
    - Android Node'unu eşleştirme veya yeniden bağlama
    - Android Gateway keşfi veya kimlik doğrulama sorunlarını giderme
    - Uzak bir Mac üzerinden Android cihazını yansıtma veya kontrol etme
    - İstemciler arasında sohbet geçmişi tutarlılığını doğrulama
summary: 'Android uygulaması (Node): bağlantı çalışma kılavuzu + Bağlan/Sohbet/Ses/Canvas komut yüzeyi'
title: Android uygulaması
x-i18n:
    generated_at: "2026-07-16T17:17:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ac11a1d0eb0c601048843ec80c9c76a4ebf76f2c80680ae2a43cb84fc6ec263
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Resmî Android uygulaması [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) üzerinden ve desteklenen [GitHub Sürümlerinde](https://github.com/openclaw/openclaw/releases) imzalı bağımsız APK olarak sunulur. Bir yardımcı Node'dur ve çalışan bir OpenClaw Gateway gerektirir. Kaynak: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([derleme talimatları](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## Destek özeti

- Rol: yardımcı Node uygulaması (Android, Gateway'i barındırmaz).
- Gateway gerekli: evet (macOS, Linux veya WSL2 aracılığıyla Windows üzerinde çalıştırın).
- Kurulum: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) veya desteklenen bir [GitHub Sürümünden](https://github.com/openclaw/openclaw/releases) `OpenClaw-Android.apk`; Gateway için [Başlarken](/tr/start/getting-started), ardından [Eşleştirme](/tr/channels/pairing).
- Gateway: [İşletim kılavuzu](/tr/gateway) + [Yapılandırma](/tr/gateway/configuration).
  - Protokoller: [Gateway protokolü](/tr/gateway/protocol) (Node'lar + kontrol düzlemi).

Sistem denetimi (launchd/systemd), Gateway ana makinesinde bulunur — bkz. [Gateway](/tr/gateway).

## Google Play dışından kurulum

Normal nihai ve düzeltme GitHub Sürümleri, evrensel bir `OpenClaw-Android.apk` ve `OpenClaw-Android-SHA256SUMS.txt` içerir. APK, sürüm etiketinden derlenir, OpenClaw Android sürüm anahtarıyla imzalanır ve GitHub Actions kaynak doğrulamasını taşır.

Her iki varlığı da listeleyen bir [sürüm](https://github.com/openclaw/openclaw/releases) seçin, ardından dışarıdan yüklemeden önce tam olarak bu etiketi indirin ve doğrulayın:

```bash
release_tag=vYYYY.M.PATCH
gh release download "$release_tag" \
  --repo openclaw/openclaw \
  --pattern OpenClaw-Android.apk \
  --pattern OpenClaw-Android-SHA256SUMS.txt
sha256sum --check OpenClaw-Android-SHA256SUMS.txt
gh attestation verify OpenClaw-Android.apk \
  --repo openclaw/openclaw \
  --signer-workflow openclaw/openclaw/.github/workflows/android-release.yml \
  --source-ref "refs/tags/${release_tag}" \
  --deny-self-hosted-runners
```

<Warning>
Google Play ve bağımsız APK kurulumları farklı güncelleme kanalları kullanır ve farklı imzalama kimliklerine sahip olabilir. Android, kanallar arasında geçiş yapmadan önce mevcut uygulamanın kaldırılmasını gerektirebilir; bu işlem uygulamanın yerel verilerini siler. Normal güncellemeler için tek bir kanalda kalın.
</Warning>

## Android'i uzak bir Mac'ten yansıtma ve denetleme

[scrcpy](https://github.com/Genymobile/scrcpy), Android ekranını bir macOS penceresine yansıtır ve
klavye ile işaretçi girişini Android Debug Bridge (ADB) üzerinden iletir. Bu, OpenClaw Node
bağlantısından ayrı, operatör tarafında yürütülen bir iş akışıdır. Android cihaz ile Mac farklı
konumlarda olduğunda ancak aynı özel Tailscale ağını paylaştığında kullanışlıdır.

### Başlamadan önce

- Android cihaza ve Mac'e Tailscale yükleyin ve ikisini aynı tailnet'e bağlayın.
- Android'de **Developer options** ve **USB debugging** seçeneklerini etkinleştirin. Android 16, **Wireless
  debugging** seçeneğini **Settings > System > Developer options** altında sunar. Bkz. [Android geliştirici
  seçenekleri](https://developer.android.com/studio/debug/dev-options).
- Mac'e scrcpy ve ADB yükleyin:

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- İlk bağlantı için Android cihazı erişilebilir durumda tutun. Android, söz konusu Mac cihazı
  denetlemeden önce her Mac'in ADB anahtarını onaylamalıdır.

### TCP üzerinden ADB'yi etkinleştirme

İlk kurulum için Android cihazı USB üzerinden güvenilir bir bilgisayara bağlayın ve
hata ayıklama istemini onaylayın. Ardından şunları çalıştırın:

```bash
adb devices
adb tcpip 5555
```

Artık USB bağlantısını kesebilirsiniz. Cihaz yeniden başlatıldıktan veya hata ayıklama sıfırlandıktan sonra 5555 numaralı bağlantı noktası
dinlemeyi durdurursa bu yerel kurulum adımını tekrarlayın. Android 11 ve sonraki sürümler, ilk güven ilişkisini
**Wireless debugging > Pair device with pairing code** ve `adb pair` ile de kurabilir.

### Yalnızca denetleyici Mac'e izin verme

Kısıtlayıcı izinlere sahip tailnet'ler, denetleyici Mac'in Android cihazdaki TCP 5555
bağlantı noktasına erişmesine açıkça izin vermelidir. Örnek adresleri iki cihazın kararlı Tailscale IP'leriyle
değiştirerek tailnet politikasına dar kapsamlı bir kural ekleyin:

```json5
{
  grants: [
    {
      src: ["<remote-mac-tailnet-ip>"],
      dst: ["<android-tailnet-ip>"],
      ip: ["tcp:5555"],
    },
  ],
}
```

Ana makine takma adları ve diğer seçiciler için bkz. [Tailscale izinleri](https://tailscale.com/docs/reference/syntax/grants).
Bu bağlantı noktasını genel internete açmayın veya Funnel ile dışarıya sunmayın: yetkilendirilmiş bir ADB
istemcisi cihaz üzerinde kapsamlı denetime sahiptir.

### Bağlanma ve yansıtmayı başlatma

Uzak Mac'te:

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

Bu Mac'ten yapılan ilk `adb connect`, Android'de bir yetkilendirme iletişim kutusu gösterir. Cihazın kilidini açın,
anahtar parmak izini doğrulayın ve yalnızca Mac güvenilir olduğunda **Always allow from this computer** seçeneğini
belirleyin. Başarılı bir `adb devices` girdisi `device` ile biter; `unauthorized`, cihazdaki istemin
onaylanmadığı anlamına gelir.

scrcpy penceresi açıldıktan sonra doğrudan kullanın veya [Peekaboo](https://peekaboo.sh/) gibi bir macOS
ekran otomasyon aracıyla hedefleyin. Ekran görüntüsünü ve girdiyi scrcpy taşır; Tailscale yalnızca
özel ağ yolunu sağlar.

### Sorun giderme

- `Connection timed out`: TCP 5555 için tailnet iznini doğrulayın. Başarılı bir `tailscale ping`,
  eşler arası erişilebilirliği kanıtlar; politikanın bu TCP bağlantı noktasına izin verdiğini kanıtlamaz. Mac'ten
  `nc -vz <android-tailnet-ip> 5555` ile test edin.
- `unauthorized`: Android'in kilidini açıp uzak Mac'in ADB anahtarını onaylayın veya eski iş istasyonunu
  **Wireless debugging > Paired devices** altından kaldırıp yeniden eşleştirin.
- `Connection refused`: yerel olarak yeniden bağlanın ve `adb tcpip 5555` komutunu yeniden çalıştırın.
- Birden fazla cihaz listeleniyor: açık `--serial <android-tailnet-ip>:5555` bağımsız değişkenini kullanmayı sürdürün.

İşiniz bittiğinde scrcpy'yi kapatın ve ADB bağlantısını kesin:

```bash
adb disconnect <android-tailnet-ip>:5555
```

## Bağlantı işletim kılavuzu

Android Node uygulaması ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android, doğrudan Gateway WebSocket'e bağlanır ve cihaz eşleştirmesini (`role: node`) kullanır.

Tailscale veya genel ana makineler için Android güvenli bir uç nokta gerektirir:

- Tercih edilen: `https://<magicdns>` / `wss://<magicdns>` ile Tailscale Serve / Funnel
- Ayrıca desteklenir: gerçek bir TLS uç noktasına sahip diğer tüm `wss://` Gateway URL'leri
- Şifresiz `ws://`; özel LAN adreslerinde / `.local` ana makinelerinde, ayrıca `localhost`, `127.0.0.1` ve Android emülatör köprüsünde (`10.0.2.2`) desteklenmeye devam eder; geri döngü dışı kurulum otomatik olarak sınırlı operatör erişimini kullanır

### Ön koşullar

- Gateway başka bir makinede çalışıyor (veya SSH üzerinden erişilebilir).
- Android cihazı/emülatörü, Gateway WebSocket'e erişebiliyor:
  - mDNS/NSD ile aynı LAN'da, **veya**
  - Wide-Area Bonjour / tek noktaya yayın DNS-SD kullanarak aynı Tailscale tailnet'inde (aşağıya bakın), **veya**
  - Manuel Gateway ana makinesi/bağlantı noktası (geri dönüş seçeneği)
- Tailnet/genel mobil eşleştirme, ham tailnet IP `ws://` uç noktalarını **kullanmaz**. Bunun yerine Tailscale Serve veya başka bir `wss://` URL'si kullanın.
- Eşleştirme isteklerini onaylamak için Gateway makinesinde (veya SSH üzerinden) `openclaw` CLI kullanılabilir olmalıdır.

### 1. Gateway'i başlatma

```bash
openclaw gateway --port 18789 --verbose
```

Günlüklerde şuna benzer bir şey gördüğünüzü doğrulayın:

- `listening on ws://0.0.0.0:18789`

Tailscale üzerinden uzak Android erişimi için ham tailnet bağlaması yerine Serve/Funnel'ı tercih edin:

```bash
openclaw gateway --tailscale serve
```

Bu, Android'e güvenli bir `wss://` / `https://` uç noktası sağlar. Ayrıca TLS'yi ayrı olarak sonlandırmadığınız sürece, düz bir `gateway.bind: "tailnet"` kurulumu ilk uzak Android eşleştirmesi için yeterli değildir.

### 2. Keşfi doğrulama (isteğe bağlı)

Gateway makinesinden:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Daha fazla hata ayıklama notu: [Bonjour](/tr/gateway/bonjour).

Ayrıca geniş alan keşif etki alanı yapılandırdıysanız şununla karşılaştırın:

```bash
openclaw gateway discover --json
```

Bu, yalnızca TXT ipuçları yerine çözümlenmiş hizmet uç noktasını kullanarak `local.` ile yapılandırılmış geniş alan etki alanını tek geçişte gösterir.

#### Tek noktaya yayın DNS-SD aracılığıyla ağlar arası keşif

Android NSD/mDNS keşfi ağlar arasında çalışmaz. Android Node'u ile Gateway farklı ağlardaysa ancak Tailscale üzerinden bağlıysa bunun yerine Wide-Area Bonjour / tek noktaya yayın DNS-SD kullanın. Tailnet/genel Android eşleştirmesi için keşif tek başına yeterli değildir — keşfedilen rota yine de güvenli bir uç nokta (`wss://` veya Tailscale Serve) gerektirir:

1. Gateway ana makinesinde bir DNS-SD bölgesi (örneğin `openclaw.internal.`) kurun ve `_openclaw-gw._tcp` kayıtlarını yayımlayın.
2. Seçtiğiniz etki alanı için bu DNS sunucusuna işaret eden Tailscale bölünmüş DNS'yi yapılandırın.

Ayrıntılar ve örnek CoreDNS yapılandırması: [Bonjour](/tr/gateway/bonjour).

### 3. Android'den bağlanma

Android uygulamasında:

- Uygulama, Gateway bağlantısını bir **foreground service** (kalıcı bildirim) aracılığıyla etkin tutar.
- **Connect** sekmesini açın.
- **Setup Code** veya **Manual** modunu kullanın.
- Keşif engellenmişse **Advanced controls** altında manuel ana makine/bağlantı noktası kullanın. Özel LAN ana makineleri için `ws://` çalışmaya devam eder. Tailscale/genel ana makineler için TLS'yi açın ve bir `wss://` / Tailscale Serve uç noktası kullanın.

İlk başarılı eşleştirmeden sonra Android, uygulama başlatıldığında etkin eşleştirilmiş Gateway'e otomatik olarak yeniden bağlanır (ağda görünür olması gereken keşfedilmiş Gateway'ler için azami gayretle).

Resmî kurulum kodları, Android'i Node olarak bağlar ve varsayılan olarak `wss://`
üzerinden tam Gateway operatör erişimi verir. Geri döngü dışı şifresiz `ws://`
kurulumu, taşıyıcı token güvenliği için otomatik olarak sınırlı erişim kullanır. **Settings → Gateway**
sayfası **Full** veya **Limited** erişimi gösterir. Sınırlı bir bağlantı için
`wss://` veya Tailscale Serve'i yapılandırın, Control UI'da ya da
`openclaw qr` ile yeni bir tam erişim kodu oluşturun, ardından bu sayfada kodu tarayın veya
yapıştırın ve yeniden bağlanın. Kısıtlı profili isteyen operatörler, Control UI'da
**Limited access** seçeneğini belirleyebilir veya `openclaw qr --limited` komutunu çalıştırabilir.

### Birden fazla Gateway

Uygulama, eşleştirildiği her Gateway'in kaydını tutar; böylece yeniden eşleştirme yapmadan aralarında geçiş yapabilirsiniz:

- **Settings -> Gateways**, eşleştirilmiş Gateway'leri listeler ve etkin olanı işaretler. Geçiş yapmak için bir girdiye dokunun; uygulama mevcut oturumları sonlandırıp seçilen Gateway'e yeniden bağlanır.
- Birden fazla Gateway eşleştirildiğinde **Connect** sekmesi hızlı geçiş seçicisi gösterir.
- Kimlik bilgileri, cihaz token'ları, TLS güveni, sohbet geçmişi ve kuyruğa alınmış çevrimdışı mesajlar Gateway başına saklanır. Geçiş yapmak, Gateway'ler arasındaki durumu hiçbir zaman karıştırmaz ve çevrimdışıyken kuyruğa alınan mesajlar yalnızca yazıldıkları Gateway'e teslim edilir.
- **Forget**, bir Gateway'in kayıt girdisini kimlik bilgileri, cihaz token'ları, TLS sabitlemesi ve önbelleğe alınmış sohbetleriyle birlikte kaldırır.

### Erişilebilirlik sinyalleri

Kimliği doğrulanmış Node oturumu bağlandıktan sonra ve ön plan hizmeti hâlâ bağlıyken uygulama arka plana geçtiğinde Android, `event: "node.presence.alive"` ile `node.event` çağrısını yapar. Gateway bunu, yalnızca kimliği doğrulanmış Node cihaz kimliği bilindikten sonra eşleştirilmiş Node/cihaz meta verilerine `lastSeenAtMs`/`lastSeenReason` olarak kaydeder.

Uygulama, sinyali yalnızca Gateway yanıtı `handled: true` içerdiğinde başarıyla kaydedilmiş sayar. Eski Gateway'ler, `node.event` isteğini `{ "ok": true }` ile onaylayabilir; bu yanıt uyumludur ancak kalıcı bir son görülme güncellemesi olarak sayılmaz.

### 4. Eşleştirmeyi onaylama (CLI)

Gateway makinesinde:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Eşleştirme ayrıntıları: [Eşleştirme](/tr/channels/pairing).

İsteğe bağlı: Android node her zaman sıkı biçimde denetlenen bir alt ağdan bağlanıyorsa açık CIDR'ler veya tam IP'lerle ilk node eşleştirmesinin otomatik onaylanmasını etkinleştirebilirsiniz:

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

Bu, varsayılan olarak devre dışıdır. Yalnızca istenen kapsamları olmayan yeni `role: node` eşleştirmeleri için geçerlidir. Operatör/tarayıcı eşleştirmesi ile rol, kapsam, meta veri veya ortak anahtar değişiklikleri yine de manuel onay gerektirir.

### 5. Node'un bağlı olduğunu doğrulayın

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. Sohbet + geçmiş

Android Chat sekmesi oturum seçimini destekler (varsayılan `main` ve mevcut diğer oturumlar):

- Geçmiş: `chat.history` (görüntüleme için normalleştirilir — satır içi yönerge etiketleri, düz metin araç çağrısı XML yükleri (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>` ve kırpılmış varyantları) ve sızan ASCII/tam genişlikli model denetim belirteçleri kaldırılır; tam olarak `NO_REPLY` / `no_reply` olan sessiz belirteçli asistan satırları atlanır; aşırı büyük satırlar yer tutucularla değiştirilebilir)
- Gönderme: `chat.send`
- Kalıcı gönderim: her gönderim (metin, seçilen görseller ve sesli notlar), herhangi bir ağ denemesinden önce Gateway başına cihaz üzerindeki bir giden kutusuna kaydedilir; böylece uygulamanın sonlandırılması gönderilen girdinin kaybolmasına yol açmaz. Çevrimdışıyken kuyruğa alınan gönderimler, yeniden bağlantı kurulduğunda kararlı eşgüçlülük anahtarlarıyla sırasıyla teslim edilir ve bir gönderim ancak tur, kanonik `chat.history` içinde görünür olduktan sonra kaldırılır — tek başına bir alındı bildirimi teslimat kanıtı sayılmaz. Belirsiz sonuçlar (kaybolan alındı bildirimi, gönderimin ortasında uygulamanın sonlandırılması, döküm yazılmadan önce Gateway'in yeniden başlatılması), otomatik yeniden gönderim yerine açık **Retry**/**Delete** seçenekleriyle görünür satırlar olarak gösterilir. Eğik çizgi komutları yeniden bağlantı sonrasında hiçbir zaman otomatik olarak tekrar yürütülmez; açıkça yeniden denenmek üzere bekletilir. Kuyruk sınırlıdır (Gateway başına 50 mesaj ve 48 MB ek baytı) ve gönderilmemiş satırların süresi 48 saat sonra dolar. Hiç gönderilmemiş düzenleyici taslakları süreçler arasında kalıcı değildir.
- Anlık güncellemeler (mümkün olan en iyi şekilde): `chat.subscribe` -> `event:"chat"`
- Dinleme: bir asistan mesajına uzun basıp dinlemek için **Listen** seçeneğini belirleyin; ses, yapılandırılmış TTS sağlayıcı zinciriyle Gateway `tts.speak` üzerinden oluşturulur ve Gateway sesi oluşturamadığında cihazın sistem TTS'si kullanılır. Oturum değiştirildiğinde, yeni sohbet başlatıldığında, uygulama arka plana geçtiğinde veya sohbet kapatıldığında oynatma durur.

### 7. Tuval + kamera

#### Gateway Tuval Sunucusu (web içeriği için önerilir)

Node'un, ajanın diskte düzenleyebileceği gerçek HTML/CSS/JS içeriğini göstermesi için node'u Gateway tuval sunucusuna yönlendirin.

<Note>
Node'lar tuvali Gateway HTTP sunucusundan yükler (`gateway.port` ile aynı bağlantı noktası, varsayılan `18789`).
</Note>

1. Gateway ana makinesinde `~/.openclaw/workspace/canvas/index.html` oluşturun.
2. Node'u buna yönlendirin (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (isteğe bağlı): iki cihaz da Tailscale üzerindeyse `.local` yerine bir MagicDNS adı veya tailnet IP'si kullanın; örneğin `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Bu sunucu HTML'ye canlı yeniden yükleme istemcisi ekler ve dosya değişikliklerinde sayfayı yeniden yükler. Gateway ayrıca `/__openclaw__/a2ui/` sunar, ancak Android uygulaması uzak A2UI sayfalarını yalnızca görüntüleme amaçlı kabul eder. Eylem özellikli A2UI komutları, uygulamanın sahip olduğu paketlenmiş A2UI sayfasını kullanır.

Tuval komutları (yalnızca ön planda):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (varsayılan iskelete dönmek için `{"url":""}` veya `{"url":"/"}` kullanın). `canvas.snapshot`, `{ format, base64 }` döndürür (varsayılan `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` eski diğer ad). Bunlar, eylem özellikli görüntüleme için uygulamanın sahip olduğu paketlenmiş A2UI sayfasını kullanır.

Kamera komutları (yalnızca ön planda; izin gerektirir): `camera.snap` (jpg), `camera.clip` (mp4). Parametreler ve CLI yardımcıları için [Kamera node'u](/tr/nodes/camera) bölümüne bakın.

### 8. Ses + genişletilmiş Android komut yüzeyi

- Voice sekmesi: Android'in iki açık yakalama modu vardır. **Mic**, her duraklamayı bir sohbet turu olarak gönderen ve uygulama ön plandan ayrıldığında veya kullanıcı Voice sekmesinden çıktığında duran manuel bir Voice sekmesi oturumudur. **Talk**, kesintisiz Talk Mode'dur ve kapatılana veya node bağlantısı kesilene kadar dinlemeyi sürdürür.
- Talk Mode, yakalama başlamadan önce mevcut ön plan hizmetini `connectedDevice` düzeyinden `connectedDevice|microphone` düzeyine yükseltir, ardından Talk Mode durduğunda yeniden düşürür. Node hizmeti `FOREGROUND_SERVICE_CONNECTED_DEVICE` öğesini `CHANGE_NETWORK_STATE` ile bildirir; Android 14+ ayrıca `FOREGROUND_SERVICE_MICROPHONE` bildirimini, `RECORD_AUDIO` çalışma zamanı iznini ve çalışma zamanında mikrofon hizmet türünü gerektirir.
- Android Talk varsayılan olarak yerel konuşma tanımayı, Gateway sohbetini ve yapılandırılmış Gateway Talk sağlayıcısı üzerinden `talk.speak` kullanır. Yerel sistem TTS'si yalnızca `talk.speak` kullanılamadığında kullanılır.
- Android Talk yalnızca `talk.realtime.mode`, `realtime` ve `talk.realtime.transport`, `gateway-relay` olduğunda gerçek zamanlı Gateway aktarımını kullanır.
- Android, `voiceWake` yeteneğini duyurmaz. Sesli giriş için **Mic** veya **Talk** kullanın.
- Ek Android komut aileleri (kullanılabilirlik cihaza, izinlere ve kullanıcı ayarlarına bağlıdır):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` yalnızca **Settings > Phone Capabilities > Installed Apps** etkinleştirildiğinde kullanılabilir; varsayılan olarak başlatıcıda görünür uygulamaları listeler (tam liste için `includeNonLaunchable` geçirin).
  - `notifications.list`, `notifications.actions` (aşağıdaki [Bildirim yönlendirme](#notification-forwarding) bölümüne bakın)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

### 9. Çalışma alanı dosyaları (salt okunur)

Home genel görünümü, etkin ajanın çalışma alanına salt okunur `agents.workspace.list` / `agents.workspace.get` Gateway RPC'leri üzerinden göz atılmasını sağlayan bir **Files** kartı içerir: dizinlerde ayrıntılı gezinme, metin ve görsel önizlemeleri ve Android paylaşım sayfası üzerinden dışa aktarma. Yazma işlemi yoktur ve önizlemelerin boyutu Gateway tarafından sınırlandırılır.

## Komut onaylarını inceleme

`operator.admin` içeren bir operatör bağlantısı veya Gateway tarafından açıkça hedeflenen eşleştirilmiş bir
`operator.approvals` bağlantısı, bekleyen yürütme isteklerini **Settings -> Approvals** altında inceleyebilir. Uygulama,
düğmelerini etkinleştirmeden önce Gateway'in temizlenmiş onay kaydını yükler, tüm
güvenlik uyarılarını ve isteğin sunduğu kesin kararları gösterir ve
onay kimliği ile sahip türünü Gateway'e geri gönderir.

Onay durumu Control UI ve desteklenen sohbet yüzeyleriyle paylaşılır. İlk
kaydedilen yanıt geçerli olur; başka bir yüzey önce yanıtlamış olsa bile Android
bu kanonik sonucu görüntüler. Bir çözümleme yanıtı kaybolursa veya Gateway
bağlantısı kesilirse uygulama eylemi kilitli tutar ve başka bir karar
sunmadan önce onayı yeniden okur.

Birleştirilmiş onay yöntemlerinden önceki Gateway'ler, yayımlanmış
yürütmeye özgü yöntemlere geri döner. Bekleyen inceleme çalışmaya devam eder,
ancak korunan terminal durumu ve daha kapsamlı yüzeyler arası sonuç için güncel bir Gateway gerekir.

## Asistan giriş noktaları

Android, OpenClaw'un sistem asistanı tetikleyicisinden (Google Assistant) başlatılmasını destekler. Ana ekran düğmesini basılı tutmak (veya başka bir `ACTION_ASSIST` tetikleyicisi) uygulamayı açar; "Hey Google, ask OpenClaw `<prompt>`" demek, uygulamanın bildirdiği App Actions sorgu kalıbıyla eşleşir ve istemi otomatik olarak göndermeden sohbet düzenleyicisine aktarır.

Bu, uygulama manifestinde bildirilen Android **App Actions** (`shortcuts.xml` yeteneği) özelliğini kullanır. Gateway tarafında yapılandırma gerekmez — asistan intent'i tamamen Android uygulaması tarafından işlenir.

<Note>
App Actions kullanılabilirliği cihaza, Google Play Services sürümüne ve kullanıcının OpenClaw'u varsayılan asistan uygulaması olarak ayarlayıp ayarlamadığına bağlıdır.
</Note>

## Bildirim yönlendirme

Android, cihaz bildirimlerini `node.event` öğeleri olarak Gateway'e yönlendirebilir. Bu, Gateway/`openclaw.json` yapılandırmasında değil, uygulamanın Settings sayfasında **cihaz üzerinde** yapılandırılır.

| Ayar                        | Açıklama                                                                                                                                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forward Notification Events | Ana açma/kapatma düğmesi. Varsayılan olarak kapalıdır; önce Notification Listener Access izninin verilmesini gerektirir.                                                                                  |
| Package Filter              | **Allowlist** (yalnızca listelenen paket kimlikleri yönlendirilir) veya **Blocklist** (varsayılan: listelenen kimlikler dışındaki tüm paketler). Yönlendirme döngülerini önlemek için OpenClaw'un kendi paketi Blocklist modunda her zaman hariç tutulur. |
| Quiet Hours                 | Yönlendirmeyi engelleyen yerel HH:mm başlangıç/bitiş aralığı. Varsayılan olarak devre dışıdır; etkinleştirildiğinde varsayılan değer `22:00`-`07:00` olur.                             |
| Max Events / Minute         | Yönlendirilen bildirimler için cihaz başına hız sınırı. Varsayılan 20.                                                                                                                                   |
| Route Session Key           | İsteğe bağlı. Yönlendirilen bildirim olaylarını cihazın varsayılan bildirim rotası yerine belirli bir oturuma sabitler.                                                                                    |

<Note>
Bildirim yönlendirme, Android Notification Listener iznini gerektirir. Uygulama kurulum sırasında bu izni ister.
</Note>

WhatsApp, WhatsApp Business, Telegram, Telegram X, Discord ve Signal bildirimleri her zaman hariç tutulur. Bunların mesajları zaten yerel OpenClaw kanal oturumlarına aittir; Android bildirimini ayrı bir node olayı olarak yönlendirmek, yanıtı yanlış konuşma üzerinden yönlendirebilir.

## İlgili

- [iOS uygulaması](/tr/platforms/ios)
- [Node'lar](/tr/nodes)
- [Android node sorunlarını giderme](/tr/nodes/troubleshooting)
