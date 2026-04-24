---
read_when:
    - iOS/Android Node'larını bir gateway ile eşleştirme
    - Aracı bağlamı için Node canvas/camera kullanma
    - Yeni Node komutları veya CLI yardımcıları ekleme
summary: 'Node''lar: canvas/camera/screen/device/notifications/system için eşleştirme, yetenekler, izinler ve CLI yardımcıları'
title: Node'lar
x-i18n:
    generated_at: "2026-04-24T09:17:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a210a5b90d78870dd6d17c0f0a81181a8897dc41149618c4359d7c03ef342fd
    source_path: nodes/index.md
    workflow: 15
---

Bir **Node**, Gateway **WebSocket**'ine (operatörlerle aynı port) `role: "node"` ile bağlanan ve `node.invoke` aracılığıyla bir komut yüzeyi (ör. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) sunan yardımcı cihazdır (macOS/iOS/Android/headless). Protokol ayrıntıları: [Gateway protocol](/tr/gateway/protocol).

Eski taşıma: [Bridge protocol](/tr/gateway/bridge-protocol) (TCP JSONL;
yalnızca mevcut Node'lar için tarihsel).

macOS ayrıca **Node mode** içinde de çalışabilir: menubar uygulaması Gateway'in WS sunucusuna bağlanır ve yerel canvas/camera komutlarını bir Node olarak sunar (böylece `openclaw nodes …` bu Mac üzerinde çalışır).

Notlar:

- Node'lar **çevre birimleridir**, gateway değildir. Gateway hizmetini çalıştırmazlar.
- Telegram/WhatsApp/vb. mesajları Node'lara değil, **gateway'e** gelir.
- Sorun giderme runbook'u: [/nodes/troubleshooting](/tr/nodes/troubleshooting)

## Eşleştirme + durum

**WS Node'ları cihaz eşleştirmesi kullanır.** Node'lar `connect` sırasında bir cihaz kimliği sunar; Gateway
`role: node` için bir cihaz eşleştirme isteği oluşturur. Bunu devices CLI (veya UI) ile onaylayın.

Hızlı CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Bir Node değişmiş auth ayrıntılarıyla yeniden denerse (rol/kapsamlar/genel anahtar), önceki
bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaylamadan önce
`openclaw devices list` komutunu yeniden çalıştırın.

Notlar:

- `nodes status`, bir Node'un cihaz eşleştirme rolü `node` içeriyorsa onu **paired** olarak işaretler.
- Cihaz eşleştirme kaydı, kalıcı onaylı rol sözleşmesidir. Token
  döndürme bu sözleşme içinde kalır; eşleştirme onayının hiç vermediği farklı bir role
  eşleştirilmiş bir Node'u yükseltemez.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) ayrı, gateway'e ait
  bir Node eşleştirme deposudur; WS `connect` el sıkışmasını **geçitlemez**.
- Onay kapsamı, bekleyen isteğin bildirdiği komutları izler:
  - komutsuz istek: `operator.pairing`
  - exec olmayan Node komutları: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Uzak Node sunucusu (`system.run`)

Gateway'iniz bir makinede çalışırken komutların
başka bir makinede yürütülmesini istiyorsanız **bir Node sunucusu** kullanın. Model yine **gateway** ile konuşur; `host=node` seçildiğinde gateway
`exec` çağrılarını **Node sunucusuna** iletir.

### Ne nerede çalışır

- **Gateway sunucusu**: mesajları alır, modeli çalıştırır, araç çağrılarını yönlendirir.
- **Node sunucusu**: Node makinesinde `system.run`/`system.which` yürütür.
- **Onaylar**: Node sunucusunda `~/.openclaw/exec-approvals.json` ile zorlanır.

Onay notu:

- Onay destekli Node çalıştırmaları tam istek bağlamını bağlar.
- Doğrudan kabuk/çalışma zamanı dosya yürütmeleri için OpenClaw ayrıca best-effort olarak tek bir somut yerel
  dosya operandını bağlar ve bu dosya yürütmeden önce değişirse çalıştırmayı reddeder.
- OpenClaw bir yorumlayıcı/çalışma zamanı komutu için tam olarak tek bir somut yerel dosyayı belirleyemezse,
  tam çalışma zamanı kapsamı varmış gibi davranmak yerine onay destekli yürütme reddedilir. Daha geniş yorumlayıcı semantiği için sandboxing,
  ayrı sunucular veya açık güvenilir allowlist/tam iş akışı kullanın.

### Bir Node sunucusu başlatın (ön plan)

Node makinesinde:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH tüneli üzerinden uzak gateway (loopback bind)

Gateway loopback'e bind ediyorsa (`gateway.bind=loopback`, yerel modda varsayılan),
uzak Node sunucuları doğrudan bağlanamaz. Bir SSH tüneli oluşturun ve
Node sunucusunu tünelin yerel ucuna yönlendirin.

Örnek (Node sunucusu -> gateway sunucusu):

```bash
# Terminal A (çalışmaya devam etmeli): yerel 18790 -> gateway 127.0.0.1:18789 yönlendir
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: gateway token'ını dışa aktarın ve tünel üzerinden bağlanın
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Notlar:

- `openclaw node run`, token veya password auth destekler.
- Env değişkenleri tercih edilir: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Config fallback'i `gateway.auth.token` / `gateway.auth.password` şeklindedir.
- Yerel modda Node sunucusu bilerek `gateway.remote.token` / `gateway.remote.password` değerlerini yok sayar.
- Uzak modda `gateway.remote.token` / `gateway.remote.password`, uzak öncelik kurallarına göre uygundur.
- Etkin yerel `gateway.auth.*` SecretRef'leri yapılandırılmış ancak çözümlenmemişse, node-host auth kapalı başarısız olur.
- Node-host auth çözümlemesi yalnızca `OPENCLAW_GATEWAY_*` env değişkenlerini dikkate alır.

### Bir Node sunucusu başlatın (hizmet)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### Eşleştir + ad ver

Gateway sunucusunda:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node değişmiş auth ayrıntılarıyla yeniden denerse, `openclaw devices list`
komutunu yeniden çalıştırın ve geçerli `requestId`'yi onaylayın.

Adlandırma seçenekleri:

- `openclaw node run` / `openclaw node install` üzerinde `--display-name` (Node üzerinde `~/.openclaw/node.json` içinde kalıcılaşır).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (gateway geçersiz kılması).

### Komutları allowlist'e alın

Exec onayları **Node sunucusu başınadır**. Gateway'den allowlist girdileri ekleyin:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Onaylar, Node sunucusunda `~/.openclaw/exec-approvals.json` dosyasında yaşar.

### Exec'i Node'a yönlendirin

Varsayılanları yapılandırın (gateway config):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Veya oturum başına:

```
/exec host=node security=allowlist node=<id-or-name>
```

Ayarlandıktan sonra, `host=node` içeren herhangi bir `exec` çağrısı Node sunucusunda çalışır (Node allowlist/onaylarına tabidir).

`host=auto`, Node'u kendi başına örtük olarak seçmez, ancak açık bir çağrı başına `host=node` isteğine `auto` içinden izin verilir. Oturum için varsayılanın node exec olmasını istiyorsanız açıkça `tools.exec.host=node` veya `/exec host=node ...` ayarlayın.

İlgili:

- [Node host CLI](/tr/cli/node)
- [Exec tool](/tr/tools/exec)
- [Exec approvals](/tr/tools/exec-approvals)

## Komut çağırma

Düşük seviye (ham RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Yaygın "aracıya bir MEDIA eki ver" iş akışları için daha yüksek seviyeli yardımcılar vardır.

## Ekran görüntüleri (canvas anlık görüntüleri)

Node Canvas'ı (WebView) gösteriyorsa `canvas.snapshot`, `{ format, base64 }` döndürür.

CLI yardımcısı (geçici dosyaya yazar ve `MEDIA:<path>` yazdırır):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas denetimleri

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Notlar:

- `canvas present`, URL'leri veya yerel dosya yollarını (`--target`) kabul eder; ayrıca konumlandırma için isteğe bağlı `--x/--y/--width/--height`.
- `canvas eval`, satır içi JS (`--js`) veya konumsal argüman kabul eder.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Notlar:

- Yalnızca A2UI v0.8 JSONL desteklenir (v0.9/createSurface reddedilir).

## Fotoğraflar + videolar (Node camera)

Fotoğraflar (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # varsayılan: her iki yön (2 MEDIA satırı)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Video klipler (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Notlar:

- Node'un `canvas.*` ve `camera.*` için **ön planda** olması gerekir (arka plan çağrıları `NODE_BACKGROUND_UNAVAILABLE` döndürür).
- Klip süresi, aşırı büyük base64 payload'larını önlemek için sınırlandırılır (şu anda `<= 60s`).
- Android, mümkün olduğunda `CAMERA`/`RECORD_AUDIO` izinlerini ister; reddedilen izinler `*_PERMISSION_REQUIRED` ile başarısız olur.

## Ekran kayıtları (Node'lar)

Desteklenen Node'lar `screen.record` (mp4) sunar. Örnek:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Notlar:

- `screen.record` kullanılabilirliği, Node platformuna bağlıdır.
- Ekran kayıtları `<= 60s` ile sınırlandırılır.
- `--no-audio`, desteklenen platformlarda mikrofon yakalamayı devre dışı bırakır.
- Birden çok ekran mevcut olduğunda bir ekran seçmek için `--screen <index>` kullanın.

## Konum (Node'lar)

Ayarlar içinde Konum etkin olduğunda Node'lar `location.get` sunar.

CLI yardımcısı:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notlar:

- Konum varsayılan olarak **kapalıdır**.
- “Always”, sistem izni gerektirir; arka plan getirme best-effort'tur.
- Yanıt lat/lon, doğruluk (metre) ve zaman damgasını içerir.

## SMS (Android Node'ları)

Android Node'ları, kullanıcı **SMS** izni verdiğinde ve cihaz telefon özelliğini desteklediğinde `sms.send` sunabilir.

Düşük seviye çağrı:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Notlar:

- Yetenek bildirilmeden önce Android cihazında izin istemi kabul edilmelidir.
- Telefon özelliği olmayan yalnızca Wi-Fi cihazlar `sms.send` bildirmez.

## Android cihaz + kişisel veri komutları

Android Node'ları, ilgili yetenekler etkinleştirildiğinde ek komut aileleri bildirebilir.

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

- Motion komutları, kullanılabilir sensörlere göre yetenek geçitlidir.

## Sistem komutları (Node sunucusu / mac Node)

macOS Node'u `system.run`, `system.notify` ve `system.execApprovals.get/set` sunar.
Headless Node sunucusu `system.run`, `system.which` ve `system.execApprovals.get/set` sunar.

Örnekler:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway hazır"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Notlar:

- `system.run`, payload içinde stdout/stderr/çıkış kodunu döndürür.
- Kabuk yürütmesi artık `host=node` ile `exec` aracı üzerinden gider; `nodes`, açık Node komutları için doğrudan RPC yüzeyi olarak kalır.
- `nodes invoke`, `system.run` veya `system.run.prepare` sunmaz; bunlar yalnızca exec yolu üzerinde kalır.
- Exec yolu, onaydan önce kanonik bir `systemRunPlan` hazırlar. Bir
  onay verildiğinde, gateway daha sonra çağıran tarafından düzenlenmiş komut/cwd/oturum alanlarını değil,
  saklanan bu planı iletir.
- `system.notify`, macOS uygulamasındaki bildirim izin durumuna uyar.
- Tanınmayan Node `platform` / `deviceFamily` meta verileri, `system.run` ve `system.which` öğelerini hariç tutan korumacı bir varsayılan allowlist kullanır. Bilinmeyen bir platform için bu komutlara bilerek ihtiyacınız varsa, bunları `gateway.nodes.allowCommands` üzerinden açıkça ekleyin.
- `system.run`, `--cwd`, `--env KEY=VAL`, `--command-timeout` ve `--needs-screen-recording` destekler.
- Kabuk sarmalayıcıları için (`bash|sh|zsh ... -c/-lc`), istek kapsamlı `--env` değerleri açık bir allowlist'e indirgenir (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Allowlist modunda her zaman izin ver kararları için, bilinen dağıtım sarmalayıcıları (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) sarmalayıcı yolları yerine iç yürütülebilir yolları kalıcılaştırır. Sarmalayıcıyı açmak güvenli değilse, hiçbir allowlist girdisi otomatik kalıcılaştırılmaz.
- Windows Node sunucularında allowlist modunda `cmd.exe /c` üzerinden kabuk sarmalayıcı çalıştırmaları onay gerektirir (yalnız allowlist girdisi, sarmalayıcı biçimine otomatik izin vermez).
- `system.notify`, `--priority <passive|active|timeSensitive>` ve `--delivery <system|overlay|auto>` destekler.
- Node sunucuları `PATH` geçersiz kılmalarını yok sayar ve tehlikeli başlangıç/kabuk anahtarlarını çıkarır (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Ek PATH girdilerine ihtiyacınız varsa, `PATH` değerini `--env` ile geçirmek yerine Node sunucusu hizmet ortamını yapılandırın (veya araçları standart konumlara kurun).
- macOS Node modunda `system.run`, macOS uygulamasındaki exec onayları ile geçitlenir (Ayarlar → Exec approvals).
  Ask/allowlist/full, headless Node sunucusuyla aynı davranır; reddedilen istemler `SYSTEM_RUN_DENIED` döndürür.
- Headless Node sunucusunda `system.run`, exec onaylarıyla geçitlenir (`~/.openclaw/exec-approvals.json`).

## Exec Node bağlama

Birden çok Node mevcut olduğunda exec'i belirli bir Node'a bağlayabilirsiniz.
Bu, `exec host=node` için varsayılan Node'u ayarlar (ve aracı başına geçersiz kılınabilir).

Global varsayılan:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Aracı başına geçersiz kılma:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Herhangi bir Node'a izin vermek için ayarı kaldırın:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## İzinler eşlemesi

Node'lar, `node.list` / `node.describe` içinde izin adına göre anahtarlanmış bir `permissions` eşlemesi içerebilir (ör. `screenRecording`, `accessibility`) ve boolean değerler kullanır (`true` = verildi).

## Headless Node sunucusu (platformlar arası)

OpenClaw, Gateway
WebSocket'ine bağlanan ve `system.run` / `system.which` sunan bir **headless Node sunucusu** (UI yok) çalıştırabilir. Bu, Linux/Windows üzerinde
veya bir sunucunun yanında minimal bir Node çalıştırmak için kullanışlıdır.

Başlatın:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Notlar:

- Eşleştirme yine gereklidir (Gateway bir cihaz eşleştirme istemi gösterecektir).
- Node sunucusu, node id'sini, token'ını, görünen adını ve gateway bağlantı bilgilerini `~/.openclaw/node.json` içinde saklar.
- Exec onayları yerel olarak `~/.openclaw/exec-approvals.json`
  üzerinden zorlanır (bkz. [Exec approvals](/tr/tools/exec-approvals)).
- macOS'ta headless Node sunucusu varsayılan olarak `system.run` komutunu yerel olarak yürütür. `system.run` komutunu yardımcı uygulama exec sunucusu üzerinden yönlendirmek için
  `OPENCLAW_NODE_EXEC_HOST=app` ayarlayın; uygulama sunucusunu zorunlu kılmak ve mevcut değilse kapalı başarısız olmak için
  `OPENCLAW_NODE_EXEC_FALLBACK=0` ekleyin.
- Gateway WS TLS kullanıyorsa `--tls` / `--tls-fingerprint` ekleyin.

## Mac Node modu

- macOS menubar uygulaması bir Node olarak Gateway WS sunucusuna bağlanır (böylece `openclaw nodes …` bu Mac üzerinde çalışır).
- Uzak modda uygulama, Gateway portu için bir SSH tüneli açar ve `localhost`'a bağlanır.
