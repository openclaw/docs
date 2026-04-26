---
read_when:
    - iOS/Android Node’ları bir Gateway ile eşleştirme
    - Aracı bağlamı için Node Canvas/kamera kullanma
    - Yeni Node komutları veya CLI yardımcıları ekleme
summary: 'Node’lar: eşleştirme, yetenekler, izinler ve Canvas/kamera/ekran/cihaz/bildirimler/system için CLI yardımcıları'
title: Node’lar
x-i18n:
    generated_at: "2026-04-26T11:35:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 611678b91b0e54910fded6f7d25bf4b5ef03e0a4e1da6d72f5ccf30d18054d3d
    source_path: nodes/index.md
    workflow: 15
---

Bir **Node**, Gateway **WebSocket**’ine (operatörlerle aynı port) `role: "node"` ile bağlanan ve `node.invoke` üzerinden bir komut yüzeyi (ör. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) sunan yardımcı bir cihazdır (macOS/iOS/Android/başsız). Protokol ayrıntıları: [Gateway protocol](/tr/gateway/protocol).

Eski transport: [Bridge protocol](/tr/gateway/bridge-protocol) (TCP JSONL;
yalnızca güncel Node’lar için tarihsel).

macOS ayrıca **Node modu**nda da çalışabilir: menubar uygulaması Gateway’in
WS sunucusuna bağlanır ve yerel canvas/kamera komutlarını bir Node olarak sunar (böylece
`openclaw nodes …` bu Mac’e karşı çalışır). Uzak Gateway modunda tarayıcı
otomasyonu yerel uygulama Node’u tarafından değil, CLI Node ana makinesi tarafından
(`openclaw node run` veya kurulu Node servisi) yürütülür.

Notlar:

- Node’lar **çevre birimleridir**, Gateway değildir. Gateway servisini çalıştırmazlar.
- Telegram/WhatsApp/vb. mesajları Node’lara değil, **Gateway’e** gelir.
- Sorun giderme çalışma kitabı: [/nodes/troubleshooting](/tr/nodes/troubleshooting)

## Eşleştirme + durum

**WS Node’lar cihaz eşleştirmesi kullanır.** Node’lar `connect` sırasında bir cihaz kimliği sunar; Gateway
`role: node` için bir cihaz eşleştirme isteği oluşturur. Bunu cihazlar CLI’si (veya UI) üzerinden onaylayın.

Hızlı CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Bir Node değiştirilmiş auth ayrıntılarıyla (rol/kapsamlar/açık anahtar) yeniden denerse, önceki
bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaylamadan önce
`openclaw devices list` komutunu yeniden çalıştırın.

Notlar:

- `nodes status`, cihaz eşleştirme rolü `node` içerdiğinde bir Node’u **paired** olarak işaretler.
- Cihaz eşleştirme kaydı, kalıcı onaylı rol sözleşmesidir. Token
  döndürme bu sözleşmenin içinde kalır; eşleştirme onayının hiç vermediği
  farklı bir role eşleştirilmiş Node’u yükseltemez.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) ayrı, Gateway sahipliğinde
  bir Node eşleştirme deposudur; WS `connect` el sıkışmasını **kapılamaz**.
- Onay kapsamı, bekleyen isteğin bildirilmiş komutlarını izler:
  - komutsuz istek: `operator.pairing`
  - exec olmayan Node komutları: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Uzak Node ana makinesi (`system.run`)

Gateway’iniz bir makinede çalışırken komutların
başka bir makinede yürütülmesini istiyorsanız bir **Node ana makinesi** kullanın.
Model yine **Gateway** ile konuşur; `host=node` seçildiğinde Gateway
`exec` çağrılarını **Node ana makinesine** iletir.

### Neyi neresi çalıştırır

- **Gateway ana makinesi**: mesajları alır, modeli çalıştırır, araç çağrılarını yönlendirir.
- **Node ana makinesi**: Node makinesinde `system.run`/`system.which` yürütür.
- **Onaylar**: `~/.openclaw/exec-approvals.json` üzerinden Node ana makinesinde uygulanır.

Onay notu:

- Onay destekli Node çalıştırmaları tam istek bağlamına bağlanır.
- Doğrudan kabuk/çalışma zamanı dosya yürütmeleri için OpenClaw ayrıca mümkün olan en iyi şekilde tek bir somut yerel
  dosya işlenenini bağlar ve yürütmeden önce bu dosya değişirse çalıştırmayı reddeder.
- OpenClaw bir yorumlayıcı/çalışma zamanı komutu için tam olarak tek bir somut yerel dosya belirleyemezse,
  tam çalışma zamanı kapsamı varmış gibi yapmak yerine onay destekli yürütme reddedilir. Daha geniş yorumlayıcı davranışı için sandboxing,
  ayrı ana makineler veya açık bir güvenilen allowlist/tam iş akışı kullanın.

### Node ana makinesini başlatma (ön plan)

Node makinesinde:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH tüneli üzerinden uzak Gateway (loopback bind)

Gateway loopback’e bağlıysa (`gateway.bind=loopback`, yerel modda varsayılan),
uzak Node ana makineleri doğrudan bağlanamaz. Bir SSH tüneli oluşturun ve
Node ana makinesini tünelin yerel ucuna yönlendirin.

Örnek (Node ana makinesi -> Gateway ana makinesi):

```bash
# Terminal A (çalışmaya devam etsin): yerel 18790 -> Gateway 127.0.0.1:18789 yönlendirmesi
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: Gateway token'ını dışa aktarın ve tünel üzerinden bağlanın
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Notlar:

- `openclaw node run`, token veya parola auth destekler.
- Env var’lar tercih edilir: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Config geri dönüşü: `gateway.auth.token` / `gateway.auth.password`.
- Yerel modda Node ana makinesi bilerek `gateway.remote.token` / `gateway.remote.password` değerlerini yok sayar.
- Uzak modda `gateway.remote.token` / `gateway.remote.password`, uzak öncelik kurallarına göre uygun kabul edilir.
- Etkin yerel `gateway.auth.*` SecretRef’leri yapılandırılmış ama çözümlenmemişse Node-ana-makinesi auth’ı fail-closed olur.
- Node-ana-makinesi auth çözümlemesi yalnızca `OPENCLAW_GATEWAY_*` env var’larını dikkate alır.

### Node ana makinesini başlatma (servis)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Eşleştirme + ad verme

Gateway ana makinesinde:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node değiştirilmiş auth ayrıntılarıyla yeniden denerse `openclaw devices list`
komutunu yeniden çalıştırın ve geçerli `requestId`’yi onaylayın.

Adlandırma seçenekleri:

- `openclaw node run` / `openclaw node install` üzerinde `--display-name` (Node üzerinde `~/.openclaw/node.json` içinde kalıcı olur).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (Gateway geçersiz kılması).

### Komutları allowlist’e alın

Exec onayları **Node ana makinesi başınadır**. Gateway üzerinden allowlist girdileri ekleyin:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Onaylar Node ana makinesinde `~/.openclaw/exec-approvals.json` konumunda bulunur.

### Exec’i Node’a yönlendirin

Varsayılanları yapılandırın (Gateway config’i):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Veya oturum başına:

```
/exec host=node security=allowlist node=<id-or-name>
```

Bir kez ayarlandığında `host=node` kullanan tüm `exec` çağrıları Node ana makinesinde çalışır (Node allowlist/onaylarına tabidir).

`host=auto`, Node’u kendi başına örtük olarak seçmez; ancak `auto` içinden açık bir çağrı başına `host=node` isteğine izin verilir. Oturum için varsayılanın Node exec olmasını istiyorsanız `tools.exec.host=node` veya `/exec host=node ...` değerini açıkça ayarlayın.

İlgili:

- [Node host CLI](/tr/cli/node)
- [Exec tool](/tr/tools/exec)
- [Exec approvals](/tr/tools/exec-approvals)

## Komut çağırma

Düşük seviye (ham RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Yaygın “aracıya bir MEDIA eki ver” iş akışları için daha üst düzey yardımcılar vardır.

## Ekran görüntüleri (Canvas anlık görüntüleri)

Node Canvas’ı gösteriyorsa (WebView), `canvas.snapshot` `{ format, base64 }` döndürür.

CLI yardımcısı (geçici bir dosyaya yazar ve `MEDIA:<path>` yazdırır):

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

- `canvas present`, URL’leri veya yerel dosya yollarını (`--target`) kabul eder; konumlandırma için isteğe bağlı `--x/--y/--width/--height` de destekler.
- `canvas eval`, satır içi JS (`--js`) veya konumsal bir argüman kabul eder.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Notlar:

- Yalnızca A2UI v0.8 JSONL desteklenir (`v0.9/createSurface` reddedilir).

## Fotoğraflar + videolar (Node kamera)

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

- `canvas.*` ve `camera.*` için Node’un **ön planda** olması gerekir (arka plan çağrıları `NODE_BACKGROUND_UNAVAILABLE` döndürür).
- Büyük boyutlu base64 yüklerini önlemek için klip süresi sınırlandırılır (şu anda `<= 60s`).
- Android mümkün olduğunda `CAMERA`/`RECORD_AUDIO` izinlerini ister; reddedilen izinler `*_PERMISSION_REQUIRED` ile başarısız olur.

## Ekran kayıtları (Node’lar)

Desteklenen Node’lar `screen.record` (mp4) sunar. Örnek:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Notlar:

- `screen.record` kullanılabilirliği Node platformuna bağlıdır.
- Ekran kayıtları `<= 60s` ile sınırlandırılır.
- `--no-audio`, desteklenen platformlarda mikrofon yakalamayı devre dışı bırakır.
- Birden çok ekran olduğunda bir ekran seçmek için `--screen <index>` kullanın.

## Konum (Node’lar)

Node’lar, ayarlarda Location etkin olduğunda `location.get` sunar.

CLI yardımcısı:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notlar:

- Konum varsayılan olarak **kapalıdır**.
- “Always” sistem izni gerektirir; arka plan getirme mümkün olan en iyi şekilde yapılır.
- Yanıt lat/lon, doğruluk (metre) ve zaman damgası içerir.

## SMS (Android Node’lar)

Android Node’lar, kullanıcı **SMS** izni verdiğinde ve cihaz telefon özelliğini desteklediğinde `sms.send` sunabilir.

Düşük seviye çağrı:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Notlar:

- Yeteneğin ilan edilmesinden önce Android cihazında izin istemi kabul edilmelidir.
- Telefon özelliği olmayan yalnızca Wi‑Fi cihazlar `sms.send` yeteneğini ilan etmez.

## Android cihaz + kişisel veri komutları

Android Node’lar, ilgili yetenekler etkin olduğunda ek komut aileleri ilan edebilir.

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

- Motion komutları, mevcut sensörlere göre yetenek kapılıdır.

## Sistem komutları (Node ana makinesi / mac Node)

macOS Node’u `system.run`, `system.notify` ve `system.execApprovals.get/set` sunar.
Başsız Node ana makinesi `system.run`, `system.which` ve `system.execApprovals.get/set` sunar.

Örnekler:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Notlar:

- `system.run`, yükte stdout/stderr/çıkış kodunu döndürür.
- Kabuk yürütmesi artık `host=node` ile `exec` aracı üzerinden yapılır; `nodes`, açık Node komutları için doğrudan RPC yüzeyi olarak kalır.
- `nodes invoke`, `system.run` veya `system.run.prepare` sunmaz; bunlar yalnızca exec yolunda kalır.
- Exec yolu, onaydan önce kanonik bir `systemRunPlan` hazırlar. Bir
  onay verildiğinde Gateway, daha sonra çağıran tarafından düzenlenmiş komut/cwd/oturum alanlarını değil,
  bu saklanan planı iletir.
- `system.notify`, macOS uygulamasındaki bildirim izin durumuna uyar.
- Tanınmayan Node `platform` / `deviceFamily` meta verileri, `system.run` ve `system.which` komutlarını hariç tutan muhafazakâr bir varsayılan allowlist kullanır. Bilinmeyen bir platform için bu komutlara bilerek ihtiyacınız varsa, bunları `gateway.nodes.allowCommands` ile açıkça ekleyin.
- `system.run`, `--cwd`, `--env KEY=VAL`, `--command-timeout` ve `--needs-screen-recording` destekler.
- Kabuk sarmalayıcıları için (`bash|sh|zsh ... -c/-lc`), istek kapsamlı `--env` değerleri açık bir allowlist’e indirgenir (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Allowlist modunda her zaman izin ver kararları için, bilinen dispatch sarmalayıcıları (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) sarmalayıcı yolları yerine iç yürütülebilir yolları kalıcı hale getirir. Sarmalayıcı açma güvenli değilse hiçbir allowlist girdisi otomatik olarak kalıcı hale getirilmez.
- Windows Node ana makinelerinde allowlist modunda, `cmd.exe /c` üzerinden kabuk sarmalayıcı çalıştırmaları onay gerektirir (tek başına allowlist girdisi bu sarmalayıcı biçimini otomatik olarak izinli yapmaz).
- `system.notify`, `--priority <passive|active|timeSensitive>` ve `--delivery <system|overlay|auto>` destekler.
- Node ana makineleri `PATH` geçersiz kılmalarını yok sayar ve tehlikeli başlangıç/kabuk anahtarlarını temizler (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Ek PATH girdilerine ihtiyacınız varsa `--env` ile `PATH` geçirmek yerine Node ana makinesi servis ortamını yapılandırın (veya araçları standart konumlara kurun).
- macOS Node modunda `system.run`, macOS uygulamasındaki exec onayları tarafından kapılanır (Settings → Exec approvals).
  Ask/allowlist/full, başsız Node ana makinesiyle aynı davranır; reddedilen istemler `SYSTEM_RUN_DENIED` döndürür.
- Başsız Node ana makinesinde `system.run`, exec onayları tarafından kapılanır (`~/.openclaw/exec-approvals.json`).

## Exec Node bağlama

Birden çok Node mevcut olduğunda exec’i belirli bir Node’a bağlayabilirsiniz.
Bu, `exec host=node` için varsayılan Node’u ayarlar (ve aracı başına geçersiz kılınabilir).

Genel varsayılan:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Aracı başına geçersiz kılma:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Herhangi bir Node’a izin vermek için ayarı kaldırın:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## İzinler haritası

Node’lar, izin adına göre anahtarlanmış (`screenRecording`, `accessibility` gibi) ve boolean değerler (`true` = verildi) taşıyan bir `permissions` haritasını `node.list` / `node.describe` içinde içerebilir.

## Başsız Node ana makinesi (çapraz platform)

OpenClaw, Gateway
WebSocket’ine bağlanan ve `system.run` / `system.which` sunan **başsız bir Node ana makinesi** (UI yok) çalıştırabilir. Bu, Linux/Windows üzerinde
veya bir sunucunun yanında minimal bir Node çalıştırmak için kullanışlıdır.

Başlatın:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Notlar:

- Eşleştirme yine gereklidir (Gateway bir cihaz eşleştirme istemi gösterecektir).
- Node ana makinesi, Node kimliğini, token’ını, görüntü adını ve Gateway bağlantı bilgilerini `~/.openclaw/node.json` içinde saklar.
- Exec onayları yerelde `~/.openclaw/exec-approvals.json` üzerinden uygulanır
  (bkz. [Exec approvals](/tr/tools/exec-approvals)).
- macOS’ta başsız Node ana makinesi varsayılan olarak `system.run` komutunu yerelde yürütür. `system.run` çağrılarını yardımcı uygulama exec ana makinesine yönlendirmek için
  `OPENCLAW_NODE_EXEC_HOST=app` ayarlayın; uygulama ana makinesini zorunlu kılmak ve yoksa fail-closed olmak için
  `OPENCLAW_NODE_EXEC_FALLBACK=0` ekleyin.
- Gateway WS TLS kullanıyorsa `--tls` / `--tls-fingerprint` ekleyin.

## Mac Node modu

- macOS menubar uygulaması Gateway WS sunucusuna bir Node olarak bağlanır (böylece `openclaw nodes …` bu Mac’e karşı çalışır).
- Uzak modda uygulama Gateway portu için bir SSH tüneli açar ve `localhost` adresine bağlanır.
