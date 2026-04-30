---
read_when:
    - iOS/Android düğümlerini bir Gateway ile eşleştirme
    - Ajan bağlamı için Node tuvali/kamera kullanma
    - Yeni Node komutları veya CLI yardımcıları ekleme
summary: 'Node''lar: tuval/kamera/ekran/cihaz/bildirimler/sistem için eşleştirme, yetenekler, izinler ve CLI yardımcıları'
title: Node'lar
x-i18n:
    generated_at: "2026-04-30T09:31:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 060319f540fe3c4d168516df8cced9caad26d9281592c9a9537ab6df393dce43
    source_path: nodes/index.md
    workflow: 16
---

Bir **node**, Gateway **WebSocket**’ine (operatörlerle aynı port) `role: "node"` ile bağlanan ve `node.invoke` üzerinden bir komut yüzeyi (ör. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) sunan yardımcı bir cihazdır (macOS/iOS/Android/headless). Protokol ayrıntıları: [Gateway protokolü](/tr/gateway/protocol).

Eski aktarım: [Bridge protokolü](/tr/gateway/bridge-protocol) (TCP JSONL;
geçmişe dönük, mevcut node’lar için yalnızca tarihsel).

macOS ayrıca **node modunda** çalışabilir: menü çubuğu uygulaması Gateway’in
WS sunucusuna bağlanır ve yerel canvas/kamera komutlarını bir node olarak sunar (böylece
`openclaw nodes …` bu Mac’e karşı çalışır). Uzak gateway modunda, tarayıcı
otomasyonu yerel uygulama node’u tarafından değil, CLI node host’u (`openclaw node run` veya
kurulu node hizmeti) tarafından işlenir.

Notlar:

- Node’lar **çevre birimleridir**, gateway değildir. Gateway hizmetini çalıştırmazlar.
- Telegram/WhatsApp/vb. iletiler node’lara değil, **gateway**’e gelir.
- Sorun giderme çalışma kılavuzu: [/nodes/troubleshooting](/tr/nodes/troubleshooting)

## Eşleme + durum

**WS node’ları cihaz eşlemesi kullanır.** Node’lar `connect` sırasında bir cihaz kimliği sunar; Gateway
`role: node` için bir cihaz eşleme isteği oluşturur. Cihazlar CLI’si (veya UI) üzerinden onaylayın.

Hızlı CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Bir node değişmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar) yeniden denerse, önceki
bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaylamadan önce
`openclaw devices list` komutunu yeniden çalıştırın.

Notlar:

- `nodes status`, cihaz eşleme rolü `node` içerdiğinde bir node’u **eşlenmiş** olarak işaretler.
- Cihaz eşleme kaydı, kalıcı onaylanmış rol sözleşmesidir. Token
  rotasyonu bu sözleşmenin içinde kalır; eşlenmiş bir node’u
  eşleme onayının hiç vermediği farklı bir role yükseltemez.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`), gateway’e ait ayrı bir
  node eşleme deposudur; WS `connect` el sıkışmasını **denetlemez**.
- `openclaw nodes remove --node <id|name|ip>`, bu ayrı gateway’e ait node eşleme deposundan eski girdileri siler.
- Onay kapsamı, bekleyen isteğin bildirdiği komutları izler:
  - komutsuz istek: `operator.pairing`
  - exec olmayan node komutları: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Uzak node host (system.run)

Gateway’iniz bir makinede çalışırken komutların başka bir makinede yürütülmesini istiyorsanız bir **node host** kullanın. Model yine **gateway** ile konuşur; gateway,
`host=node` seçildiğinde `exec` çağrılarını **node host**’a iletir.

### Nerede ne çalışır

- **Gateway host**: iletileri alır, modeli çalıştırır, araç çağrılarını yönlendirir.
- **Node host**: node makinesinde `system.run`/`system.which` yürütür.
- **Onaylar**: node host üzerinde `~/.openclaw/exec-approvals.json` aracılığıyla uygulanır.

Onay notu:

- Onay destekli node çalıştırmaları tam istek bağlamına bağlanır.
- Doğrudan shell/runtime dosya yürütmeleri için OpenClaw ayrıca elinden geldiğince tek bir somut yerel
  dosya operandını bağlar ve yürütmeden önce bu dosya değişirse çalıştırmayı reddeder.
- OpenClaw bir yorumlayıcı/runtime komutu için tam olarak bir somut yerel dosyayı belirleyemezse,
  tam runtime kapsamı varmış gibi davranmak yerine onay destekli yürütme reddedilir. Daha geniş yorumlayıcı semantikleri için sandboxing,
  ayrı host’lar veya açık bir güvenilir allowlist/tam iş akışı kullanın.

### Node host başlatma (ön plan)

Node makinesinde:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH tüneli üzerinden uzak gateway (loopback bind)

Gateway loopback’e bağlanıyorsa (`gateway.bind=loopback`, yerel modda varsayılan),
uzak node host’ları doğrudan bağlanamaz. Bir SSH tüneli oluşturun ve
node host’u tünelin yerel ucuna yönlendirin.

Örnek (node host -> gateway host):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Notlar:

- `openclaw node run`, token veya parola kimlik doğrulamasını destekler.
- Ortam değişkenleri tercih edilir: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Yapılandırma yedeği `gateway.auth.token` / `gateway.auth.password` değerleridir.
- Yerel modda node host, bilerek `gateway.remote.token` / `gateway.remote.password` değerlerini yok sayar.
- Uzak modda `gateway.remote.token` / `gateway.remote.password`, uzak öncelik kurallarına göre kullanılabilir.
- Etkin yerel `gateway.auth.*` SecretRef’leri yapılandırılmış ancak çözümlenmemişse, node-host kimlik doğrulaması kapalı güvenlik modunda başarısız olur.
- Node-host kimlik doğrulaması çözümlemesi yalnızca `OPENCLAW_GATEWAY_*` ortam değişkenlerini dikkate alır.

### Node host başlatma (hizmet)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Eşle + adlandır

Gateway host üzerinde:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node değişmiş kimlik doğrulama ayrıntılarıyla yeniden denerse, `openclaw devices list`
komutunu yeniden çalıştırın ve geçerli `requestId` değerini onaylayın.

Adlandırma seçenekleri:

- `openclaw node run` / `openclaw node install` üzerinde `--display-name` (node üzerinde `~/.openclaw/node.json` içine kalıcı olarak yazılır).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (gateway geçersiz kılması).

### Komutları allowlist’e ekleyin

Exec onayları **node host başına** uygulanır. Gateway’den allowlist girdileri ekleyin:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Onaylar node host üzerinde `~/.openclaw/exec-approvals.json` konumunda bulunur.

### Exec’i node’a yönlendirin

Varsayılanları yapılandırın (gateway yapılandırması):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Veya oturum başına:

```
/exec host=node security=allowlist node=<id-or-name>
```

Ayarlandıktan sonra, `host=node` içeren herhangi bir `exec` çağrısı node host üzerinde çalışır (node allowlist/onaylarına tabidir).

`host=auto` kendi başına node’u örtük olarak seçmez, ancak `auto` içinden açık bir çağrı başına `host=node` isteğine izin verilir. Node exec’in oturum için varsayılan olmasını istiyorsanız, `tools.exec.host=node` veya `/exec host=node ...` değerini açıkça ayarlayın.

İlgili:

- [Node host CLI](/tr/cli/node)
- [Exec aracı](/tr/tools/exec)
- [Exec onayları](/tr/tools/exec-approvals)

## Komut çağırma

Düşük seviye (ham RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Yaygın “ajana bir MEDIA eki ver” iş akışları için daha üst seviye yardımcılar mevcuttur.

## Komut ilkesi

Node komutları çağrılmadan önce iki denetimden geçmelidir:

1. Node, komutu WebSocket `connect.commands` listesinde bildirmelidir.
2. Gateway’in platform ilkesi bildirilen komuta izin vermelidir.

Windows ve macOS yardımcı node’ları, varsayılan olarak
`canvas.*`, `camera.list`, `location.get` ve `screen.snapshot` gibi güvenli bildirilen komutlara izin verir.
`camera.snap`, `camera.clip` ve
`screen.record` gibi tehlikeli veya gizlilik açısından hassas komutlar hâlâ
`gateway.nodes.allowCommands` ile açık katılım gerektirir. `gateway.nodes.denyCommands` her zaman
varsayılanlara ve ek allowlist girdilerine göre önceliklidir.

Plugin’e ait node komutları bir Gateway node-invoke ilkesi ekleyebilir. Bu ilke
allowlist denetiminden sonra ve node’a iletmeden önce çalışır; böylece ham
`node.invoke`, CLI yardımcıları ve ayrılmış ajan araçları aynı plugin
izin sınırını paylaşır. Tehlikeli plugin node komutları yine de açık
`gateway.nodes.allowCommands` katılımı gerektirir.

Bir node bildirdiği komut listesini değiştirdikten sonra eski cihaz eşlemesini reddedin
ve gateway’in güncellenmiş komut anlık görüntüsünü saklaması için yeni isteği onaylayın.

## Ekran görüntüleri (canvas anlık görüntüleri)

Node Canvas’ı (WebView) gösteriyorsa, `canvas.snapshot` `{ format, base64 }` döndürür.

CLI yardımcısı (geçici bir dosyaya yazar ve `MEDIA:<path>` yazdırır):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas kontrolleri

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Notlar:

- `canvas present`, URL’leri veya yerel dosya yollarını (`--target`) kabul eder; konumlandırma için isteğe bağlı `--x/--y/--width/--height` da kabul eder.
- `canvas eval`, satır içi JS (`--js`) veya konumsal bir argüman kabul eder.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Notlar:

- Yalnızca A2UI v0.8 JSONL desteklenir (v0.9/createSurface reddedilir).

## Fotoğraflar + videolar (node kamerası)

Fotoğraflar (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Video klipler (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Notlar:

- `canvas.*` ve `camera.*` için node **ön planda** olmalıdır (arka plan çağrıları `NODE_BACKGROUND_UNAVAILABLE` döndürür).
- Aşırı büyük base64 yüklerini önlemek için klip süresi sınırlandırılır (şu anda `<= 60s`).
- Android mümkün olduğunda `CAMERA`/`RECORD_AUDIO` izinlerini sorar; reddedilen izinler `*_PERMISSION_REQUIRED` ile başarısız olur.

## Ekran kayıtları (node’lar)

Desteklenen node’lar `screen.record` (mp4) sunar. Örnek:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Notlar:

- `screen.record` kullanılabilirliği node platformuna bağlıdır.
- Ekran kayıtları `<= 60s` ile sınırlandırılır.
- `--no-audio`, desteklenen platformlarda mikrofon yakalamayı devre dışı bırakır.
- Birden fazla ekran mevcut olduğunda ekran seçmek için `--screen <index>` kullanın.

## Konum (node’lar)

Node’lar, ayarlarda Konum etkinleştirildiğinde `location.get` sunar.

CLI yardımcısı:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notlar:

- Konum **varsayılan olarak kapalıdır**.
- “Her zaman” sistem izni gerektirir; arka plan getirme en iyi çabayla yapılır.
- Yanıt lat/lon, doğruluk (metre) ve zaman damgası içerir.

## SMS (Android node’ları)

Android node’ları, kullanıcı **SMS** izni verdiğinde ve cihaz telefon özelliğini desteklediğinde `sms.send` sunabilir.

Düşük seviye çağrı:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Notlar:

- Yeteneğin duyurulmasından önce izin istemi Android cihazında kabul edilmelidir.
- Telefon özelliği olmayan yalnızca Wi-Fi cihazlar `sms.send` duyurmaz.

## Android cihaz + kişisel veri komutları

Android node’ları, ilgili yetenekler etkinleştirildiğinde ek komut aileleri duyurabilir.

Kullanılabilir aileler:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Örnek çağrılar:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Notlar:

- Hareket komutları, mevcut sensörlere göre yetenek denetiminden geçirilir.

## Sistem komutları (Node ana makinesi / Mac Node)

macOS Node'u `system.run`, `system.notify` ve `system.execApprovals.get/set` sağlar.
Başsız Node ana makinesi `system.run`, `system.which` ve `system.execApprovals.get/set` sağlar.

Örnekler:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Notlar:

- `system.run`, yük içinde stdout/stderr/çıkış kodunu döndürür.
- Kabuk yürütmesi artık `host=node` ile `exec` aracı üzerinden geçer; `nodes`, açık Node komutları için doğrudan RPC yüzeyi olarak kalır.
- `nodes invoke`, `system.run` veya `system.run.prepare` sağlamaz; bunlar yalnızca exec yolunda kalır.
- Exec yolu onaydan önce standart bir `systemRunPlan` hazırlar. Bir onay verildikten sonra Gateway, daha sonra çağıran tarafından düzenlenen command/cwd/session alanlarını değil, saklanan bu planı iletir.
- `system.notify`, macOS uygulamasındaki bildirim izin durumuna uyar.
- Tanınmayan Node `platform` / `deviceFamily` meta verileri, `system.run` ve `system.which` öğelerini dışarıda bırakan tutucu bir varsayılan izin listesi kullanır. Bilinmeyen bir platform için bu komutlara özellikle ihtiyacınız varsa, bunları `gateway.nodes.allowCommands` üzerinden açıkça ekleyin.
- `system.run`, `--cwd`, `--env KEY=VAL`, `--command-timeout` ve `--needs-screen-recording` destekler.
- Kabuk sarmalayıcıları (`bash|sh|zsh ... -c/-lc`) için istek kapsamlı `--env` değerleri açık bir izin listesine (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`) indirgenir.
- İzin listesi modundaki her zaman izin ver kararlarında, bilinen dağıtım sarmalayıcıları (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) sarmalayıcı yolları yerine içteki yürütülebilir dosya yollarını kalıcı hale getirir. Açma işlemi güvenli değilse, hiçbir izin listesi girdisi otomatik olarak kalıcı hale getirilmez.
- İzin listesi modundaki Windows Node ana makinelerinde, `cmd.exe /c` üzerinden kabuk sarmalayıcı çalıştırmaları onay gerektirir (izin listesi girdisi tek başına sarmalayıcı biçimine otomatik izin vermez).
- `system.notify`, `--priority <passive|active|timeSensitive>` ve `--delivery <system|overlay|auto>` destekler.
- Node ana makineleri `PATH` geçersiz kılmalarını yok sayar ve tehlikeli başlangıç/kabuk anahtarlarını (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) çıkarır. Ek PATH girdilerine ihtiyacınız varsa, `PATH` değerini `--env` üzerinden geçirmek yerine Node ana makinesi hizmet ortamını yapılandırın (veya araçları standart konumlara yükleyin).
- macOS Node modunda, `system.run` macOS uygulamasındaki exec onaylarıyla denetlenir (Settings → Exec approvals).
  Ask/allowlist/full, başsız Node ana makinesiyle aynı şekilde davranır; reddedilen istemler `SYSTEM_RUN_DENIED` döndürür.
- Başsız Node ana makinesinde `system.run`, exec onaylarıyla (`~/.openclaw/exec-approvals.json`) denetlenir.

## Exec Node bağlama

Birden fazla Node mevcut olduğunda, exec'i belirli bir Node'a bağlayabilirsiniz.
Bu, `exec host=node` için varsayılan Node'u ayarlar (ve her aracı için geçersiz kılınabilir).

Genel varsayılan:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Aracı başına geçersiz kılma:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Herhangi bir Node'a izin vermek için kaldırın:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## İzinler haritası

Node'lar, `node.list` / `node.describe` içinde izin adına göre anahtarlanmış (ör. `screenRecording`, `accessibility`) ve boolean değerler içeren (`true` = verilmiş) bir `permissions` haritası içerebilir.

## Başsız Node ana makinesi (çapraz platform)

OpenClaw, Gateway WebSocket'e bağlanan ve `system.run` / `system.which` sağlayan **başsız Node ana makinesi** (UI yok) çalıştırabilir. Bu, Linux/Windows üzerinde veya bir sunucunun yanında minimal bir Node çalıştırmak için kullanışlıdır.

Başlatın:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Notlar:

- Eşleştirme hâlâ gereklidir (Gateway bir cihaz eşleştirme istemi gösterecektir).
- Node ana makinesi Node id'sini, belirtecini, görünen adını ve Gateway bağlantı bilgilerini `~/.openclaw/node.json` içinde saklar.
- Exec onayları yerel olarak `~/.openclaw/exec-approvals.json` üzerinden uygulanır
  (bkz. [Exec onayları](/tr/tools/exec-approvals)).
- macOS üzerinde başsız Node ana makinesi varsayılan olarak `system.run` komutunu yerel olarak yürütür. `system.run` komutunu eşlikçi uygulama exec ana makinesi üzerinden yönlendirmek için `OPENCLAW_NODE_EXEC_HOST=app` ayarlayın; uygulama ana makinesini zorunlu kılmak ve kullanılamıyorsa kapalı başarısız olmak için `OPENCLAW_NODE_EXEC_FALLBACK=0` ekleyin.
- Gateway WS, TLS kullandığında `--tls` / `--tls-fingerprint` ekleyin.

## Mac Node modu

- macOS menü çubuğu uygulaması Gateway WS sunucusuna bir Node olarak bağlanır (böylece `openclaw nodes …` bu Mac'e karşı çalışır).
- Uzak modda uygulama, Gateway bağlantı noktası için bir SSH tüneli açar ve `localhost` konumuna bağlanır.
