---
read_when:
    - iOS/Android düğümlerini bir Gateway ile eşleştirme
    - Ajan bağlamı için Node tuvali/kamerası kullanma
    - Yeni Node komutları veya CLI yardımcıları ekleme
summary: 'Node''lar: tuval/kamera/ekran/cihaz/bildirimler/sistem için eşleştirme, yetenekler, izinler ve CLI yardımcıları'
title: Node'lar
x-i18n:
    generated_at: "2026-05-06T09:21:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ca35ddfb3efe374c0494e3883b0cb47b2e31511d4f7115a88f7c644b80d704f
    source_path: nodes/index.md
    workflow: 16
---

Bir **node**, Gateway **WebSocket**'ine (operatörlerle aynı port) `role: "node"` ile bağlanan ve `node.invoke` üzerinden bir komut yüzeyi (örn. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) sunan eşlikçi bir cihazdır (macOS/iOS/Android/headless). Protokol ayrıntıları: [Gateway protokolü](/tr/gateway/protocol).

Eski taşıma: [Bridge protokolü](/tr/gateway/bridge-protocol) (TCP JSONL;
mevcut node'lar için yalnızca tarihsel).

macOS ayrıca **node modu**nda da çalışabilir: menü çubuğu uygulaması Gateway'in
WS sunucusuna bağlanır ve yerel canvas/camera komutlarını bir node olarak sunar (böylece
`openclaw nodes …` bu Mac'e karşı çalışır). Uzak gateway modunda, tarayıcı
otomasyonu yerel uygulama node'u tarafından değil, CLI node host'u (`openclaw node run` veya
kurulu node hizmeti) tarafından yönetilir.

Notlar:

- Node'lar **çevre birimleridir**, gateway değildir. Gateway hizmetini çalıştırmazlar.
- Telegram/WhatsApp/vb. mesajlar node'lara değil **gateway**'e ulaşır.
- Sorun giderme çalıştırma kitabı: [/nodes/troubleshooting](/tr/nodes/troubleshooting)

## Eşleme + durum

**WS node'ları cihaz eşlemesi kullanır.** Node'lar `connect` sırasında bir cihaz kimliği sunar; Gateway
`role: node` için bir cihaz eşleme isteği oluşturur. Cihazlar CLI'si (veya UI) üzerinden onaylayın.

Hızlı CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Bir node değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/genel anahtar) yeniden denerse, önceki
bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaylamadan önce
`openclaw devices list` komutunu yeniden çalıştırın.

Notlar:

- `nodes status`, cihaz eşleme rolü `node` içerdiğinde bir node'u **paired** olarak işaretler.
- Cihaz eşleme kaydı, dayanıklı onaylanmış rol sözleşmesidir. Token
  rotasyonu bu sözleşmenin içinde kalır; eşlenmiş bir node'u, eşleme onayının hiç vermediği
  farklı bir role yükseltemez.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) gateway'e ait ayrı bir
  node eşleme deposudur; WS `connect` el sıkışmasını **denetlemez**.
- `openclaw nodes remove --node <id|name|ip>`, bu ayrı
  gateway'e ait node eşleme deposundan eski girdileri siler.
- Onay kapsamı, bekleyen isteğin bildirdiği komutları izler:
  - komutsuz istek: `operator.pairing`
  - exec olmayan node komutları: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Uzak node host'u (system.run)

Gateway'iniz bir makinede çalışırken komutların başka bir makinede
çalışmasını istediğinizde bir **node host'u** kullanın. Model yine **gateway** ile konuşur; gateway
`host=node` seçildiğinde `exec` çağrılarını **node host'una** iletir.

### Nerede ne çalışır

- **Gateway host'u**: mesajları alır, modeli çalıştırır, araç çağrılarını yönlendirir.
- **Node host'u**: node makinesinde `system.run`/`system.which` çalıştırır.
- **Onaylar**: node host'unda `~/.openclaw/exec-approvals.json` üzerinden uygulanır.

Onay notu:

- Onay destekli node çalıştırmaları tam istek bağlamına bağlanır.
- Doğrudan shell/runtime dosya çalıştırmaları için OpenClaw ayrıca en iyi çabayla tek bir somut yerel
  dosya operandını bağlar ve bu dosya yürütmeden önce değişirse çalıştırmayı reddeder.
- OpenClaw bir yorumlayıcı/runtime komutu için tam olarak bir somut yerel dosya belirleyemezse,
  tam runtime kapsamı varmış gibi davranmak yerine onay destekli yürütme reddedilir. Daha geniş yorumlayıcı semantiği için sandboxing,
  ayrı host'lar veya açıkça güvenilen bir allowlist/tam iş akışı kullanın.

### Bir node host'u başlatın (foreground)

Node makinesinde:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH tüneliyle uzak gateway (loopback bind)

Gateway loopback'e bağlanıyorsa (`gateway.bind=loopback`, yerel modda varsayılan),
uzak node host'ları doğrudan bağlanamaz. Bir SSH tüneli oluşturun ve
node host'unu tünelin yerel ucuna yöneltin.

Örnek (node host -> gateway host):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Notlar:

- `openclaw node run` token veya parola kimlik doğrulamasını destekler.
- Env var'lar tercih edilir: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Config fallback'i `gateway.auth.token` / `gateway.auth.password` değeridir.
- Yerel modda node host'u bilerek `gateway.remote.token` / `gateway.remote.password` değerlerini yok sayar.
- Uzak modda `gateway.remote.token` / `gateway.remote.password`, uzak öncelik kurallarına göre uygundur.
- Etkin yerel `gateway.auth.*` SecretRef'leri yapılandırılmış ancak çözümlenmemişse, node-host kimlik doğrulaması güvenli biçimde başarısız olur.
- Node-host kimlik doğrulama çözümlemesi yalnızca `OPENCLAW_GATEWAY_*` env var'larını dikkate alır.

### Bir node host'u başlatın (hizmet)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Eşle + adlandır

Gateway host'unda:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node değişen kimlik doğrulama ayrıntılarıyla yeniden denerse, `openclaw devices list`
komutunu yeniden çalıştırın ve mevcut `requestId` değerini onaylayın.

Adlandırma seçenekleri:

- `openclaw node run` / `openclaw node install` üzerinde `--display-name` (node üzerinde `~/.openclaw/node.json` içinde kalıcı olur).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (gateway override'ı).

### Komutları allowlist'e ekleyin

Exec onayları **node host'u başına** geçerlidir. Gateway'den allowlist girdileri ekleyin:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Onaylar node host'unda `~/.openclaw/exec-approvals.json` konumunda bulunur.

### Exec'i node'a yöneltin

Varsayılanları yapılandırın (gateway config):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Ya da oturum başına:

```
/exec host=node security=allowlist node=<id-or-name>
```

Ayarlanınca, `host=node` içeren her `exec` çağrısı node host'unda çalışır (node
allowlist/onaylarına tabidir).

`host=auto` node'u kendi başına örtük olarak seçmez, ancak `auto` içinden açık bir çağrı başına `host=node` isteğine izin verilir. Node exec'in oturum için varsayılan olmasını istiyorsanız, `tools.exec.host=node` veya `/exec host=node ...` değerini açıkça ayarlayın.

İlgili:

- [Node host CLI](/tr/cli/node)
- [Exec aracı](/tr/tools/exec)
- [Exec onayları](/tr/tools/exec-approvals)

## Komut çağırma

Düşük düzey (ham RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Yaygın "ajane bir MEDIA eki ver" iş akışları için daha yüksek düzey yardımcılar vardır.

## Komut politikası

Node komutları çağrılabilmeden önce iki kapıdan geçmelidir:

1. Node, komutu WebSocket `connect.commands` listesinde bildirmelidir.
2. Gateway'in platform politikası bildirilen komuta izin vermelidir.

Windows ve macOS eşlikçi node'ları varsayılan olarak
`canvas.*`, `camera.list`, `location.get` ve `screen.snapshot` gibi güvenli bildirilen komutlara izin verir.
`talk` capability'sinin reklamını yapan veya `talk.*` komutlarını bildiren güvenilir node'lar
ayrıca platform etiketinden bağımsız olarak bildirilen push-to-talk komutlarına (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`) varsayılan olarak izin verir.
`camera.snap`, `camera.clip` ve
`screen.record` gibi tehlikeli veya gizlilik açısından ağır komutlar yine
`gateway.nodes.allowCommands` ile açık opt-in gerektirir. `gateway.nodes.denyCommands` her zaman
varsayılanların ve ek allowlist girdilerinin önüne geçer.

Plugin'e ait node komutları bir Gateway node-invoke politikası ekleyebilir. Bu politika
allowlist denetiminden sonra ve node'a iletmeden önce çalışır; böylece ham
`node.invoke`, CLI yardımcıları ve özel ajan araçları aynı plugin
izin sınırını paylaşır. Tehlikeli plugin node komutları yine açık
`gateway.nodes.allowCommands` opt-in'i gerektirir.

Bir node bildirilen komut listesini değiştirdikten sonra, eski cihaz eşlemesini reddedin
ve gateway'in güncellenmiş komut anlık görüntüsünü saklaması için yeni isteği onaylayın.

## Ekran görüntüleri (canvas anlık görüntüleri)

Node Canvas'ı (WebView) gösteriyorsa, `canvas.snapshot` `{ format, base64 }` döndürür.

CLI yardımcısı (geçici dosyaya yazar ve `MEDIA:<path>` yazdırır):

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

- `canvas present`, URL'leri veya yerel dosya yollarını (`--target`) ve konumlandırma için isteğe bağlı `--x/--y/--width/--height` değerlerini kabul eder.
- `canvas eval`, satır içi JS (`--js`) veya konumsal bir arg kabul eder.

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

- `canvas.*` ve `camera.*` için node **foregrounded** olmalıdır (arka plan çağrıları `NODE_BACKGROUND_UNAVAILABLE` döndürür).
- Aşırı büyük base64 payload'larını önlemek için klip süresi sınırlandırılır (şu anda `<= 60s`).
- Android mümkün olduğunda `CAMERA`/`RECORD_AUDIO` izinlerini sorar; reddedilen izinler `*_PERMISSION_REQUIRED` ile başarısız olur.

## Ekran kayıtları (node'lar)

Desteklenen node'lar `screen.record` (mp4) sunar. Örnek:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Notlar:

- `screen.record` kullanılabilirliği node platformuna bağlıdır.
- Ekran kayıtları `<= 60s` ile sınırlandırılır.
- `--no-audio`, desteklenen platformlarda mikrofon yakalamayı devre dışı bırakır.
- Birden fazla ekran varsa ekran seçmek için `--screen <index>` kullanın.

## Konum (node'lar)

Node'lar, ayarlarda Konum etkinleştirildiğinde `location.get` sunar.

CLI yardımcısı:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notlar:

- Konum **varsayılan olarak kapalıdır**.
- "Always" sistem izni gerektirir; arka plan getirmesi en iyi çabadır.
- Yanıt lat/lon, doğruluk (metre) ve zaman damgası içerir.

## SMS (Android node'ları)

Android node'ları, kullanıcı **SMS** izni verdiğinde ve cihaz telefoniyi desteklediğinde `sms.send` sunabilir.

Düşük düzey çağrı:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Notlar:

- Capability reklamı yapılmadan önce izin istemi Android cihazda kabul edilmelidir.
- Telefonisi olmayan yalnızca Wi-Fi cihazlar `sms.send` reklamını yapmaz.

## Android cihaz + kişisel veri komutları

Android node'ları, ilgili capability'ler etkinleştirildiğinde ek komut ailelerini reklam edebilir.

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

- Hareket komutları, kullanılabilir sensörlere göre yetenek kapılıdır.

## Sistem komutları (node host / mac node)

macOS node, `system.run`, `system.notify` ve `system.execApprovals.get/set` sunar.
Headless node host, `system.run`, `system.which` ve `system.execApprovals.get/set` sunar.

Örnekler:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Notlar:

- `system.run`, payload içinde stdout/stderr/çıkış kodu döndürür.
- Shell yürütmesi artık `host=node` ile `exec` aracı üzerinden geçer; `nodes`, açık node komutları için doğrudan RPC yüzeyi olarak kalır.
- `nodes invoke`, `system.run` veya `system.run.prepare` sunmaz; bunlar yalnızca exec yolunda kalır.
- Exec yolu, onaydan önce kanonik bir `systemRunPlan` hazırlar. Bir
  onay verildiğinde Gateway, sonradan çağıran tarafından düzenlenmiş command/cwd/session alanlarını değil, saklanan o planı iletir.
- `system.notify`, macOS uygulamasındaki bildirim izni durumuna uyar.
- Tanınmayan node `platform` / `deviceFamily` metadata'sı, `system.run` ve `system.which` komutlarını dışarıda bırakan korumacı bir varsayılan izin listesi kullanır. Bilinmeyen bir platform için bu komutlara bilerek ihtiyaç duyuyorsanız, bunları `gateway.nodes.allowCommands` üzerinden açıkça ekleyin.
- `system.run`, `--cwd`, `--env KEY=VAL`, `--command-timeout` ve `--needs-screen-recording` destekler.
- Shell sarmalayıcıları (`bash|sh|zsh ... -c/-lc`) için istek kapsamlı `--env` değerleri açık bir izin listesine indirgenir (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- İzin listesi modunda her zaman izin ver kararlarında, bilinen gönderim sarmalayıcıları (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) sarmalayıcı yolları yerine iç yürütülebilir dosya yollarını kalıcı hale getirir. Sarmalamayı açmak güvenli değilse, hiçbir izin listesi girdisi otomatik olarak kalıcı hale getirilmez.
- İzin listesi modundaki Windows node host'larında, `cmd.exe /c` üzerinden shell sarmalayıcı çalıştırmaları onay gerektirir (izin listesi girdisi tek başına sarmalayıcı biçimini otomatik olarak izinli yapmaz).
- `system.notify`, `--priority <passive|active|timeSensitive>` ve `--delivery <system|overlay|auto>` destekler.
- Node host'ları `PATH` geçersiz kılmalarını yok sayar ve tehlikeli başlangıç/shell anahtarlarını ayıklar (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Ek PATH girdilerine ihtiyacınız varsa, `PATH` değerini `--env` ile geçirmek yerine node host hizmet ortamını yapılandırın (veya araçları standart konumlara yükleyin).
- macOS node modunda `system.run`, macOS uygulamasındaki exec onayları tarafından kapılanır (Settings → Exec approvals).
  Ask/allowlist/full, headless node host ile aynı davranır; reddedilen istemler `SYSTEM_RUN_DENIED` döndürür.
- Headless node host'ta `system.run`, exec onayları (`~/.openclaw/exec-approvals.json`) tarafından kapılanır.

## Exec node bağlama

Birden fazla node kullanılabilir olduğunda exec'i belirli bir node'a bağlayabilirsiniz.
Bu, `exec host=node` için varsayılan node'u ayarlar (ve ajan başına geçersiz kılınabilir).

Global varsayılan:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Ajan başına geçersiz kılma:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Herhangi bir node'a izin vermek için kaldırın:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## İzinler haritası

Node'lar, `node.list` / `node.describe` içinde izin adına göre anahtarlanmış (örn. `screenRecording`, `accessibility`) ve boolean değerlere sahip (`true` = verilmiş) bir `permissions` haritası içerebilir.

## Headless node host (platformlar arası)

OpenClaw, Gateway
WebSocket'e bağlanan ve `system.run` / `system.which` sunan bir **headless node host** (UI yok) çalıştırabilir. Bu, Linux/Windows üzerinde
veya bir sunucunun yanında minimal bir node çalıştırmak için kullanışlıdır.

Başlatın:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Notlar:

- Eşleme hâlâ gereklidir (Gateway bir cihaz eşleme istemi gösterir).
- Node host, node kimliğini, token'ını, görünen adını ve gateway bağlantı bilgilerini `~/.openclaw/node.json` içinde saklar.
- Exec onayları yerel olarak `~/.openclaw/exec-approvals.json` üzerinden uygulanır
  (bkz. [Exec onayları](/tr/tools/exec-approvals)).
- macOS'te headless node host, varsayılan olarak `system.run` komutunu yerel olarak yürütür. `system.run` komutunu eşlikçi uygulama exec host'u üzerinden yönlendirmek için
  `OPENCLAW_NODE_EXEC_HOST=app` ayarlayın; uygulama host'unu zorunlu kılmak ve kullanılamıyorsa kapalı başarısız olmak için
  `OPENCLAW_NODE_EXEC_FALLBACK=0` ekleyin.
- Gateway WS TLS kullanıyorsa `--tls` / `--tls-fingerprint` ekleyin.

## Mac node modu

- macOS menü çubuğu uygulaması Gateway WS sunucusuna bir node olarak bağlanır (böylece `openclaw nodes …` bu Mac'e karşı çalışır).
- Uzak modda uygulama, Gateway portu için bir SSH tüneli açar ve `localhost` konumuna bağlanır.
