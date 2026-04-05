---
read_when:
    - iOS/Android düğümlerini bir gateway ile eşleştirme
    - Aracı bağlamı için düğüm tuvali/kamerasını kullanma
    - Yeni düğüm komutları veya CLI yardımcıları ekleme
summary: 'Düğümler: eşleştirme, yetenekler, izinler ve tuval/kamera/ekran/cihaz/bildirimler/sistem için CLI yardımcıları'
title: Düğümler
x-i18n:
    generated_at: "2026-04-05T14:00:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 201be0e13cb6d39608f0bbd40fd02333f68bd44f588538d1016fe864db7e038e
    source_path: nodes/index.md
    workflow: 15
---

# Düğümler

Bir **düğüm**, Gateway **WebSocket**'ine (`role: "node"` ile, operatörlerle aynı port üzerinden) bağlanan ve `node.invoke` aracılığıyla bir komut yüzeyi (`canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*` gibi) sunan yardımcı bir cihazdır (macOS/iOS/Android/headless). Protokol ayrıntıları: [Gateway protocol](/tr/gateway/protocol).

Eski taşıma katmanı: [Bridge protocol](/tr/gateway/bridge-protocol) (TCP JSONL;
yalnızca tarihsel amaçlıdır, mevcut düğümler için geçerli değildir).

macOS ayrıca **node mode**'da da çalışabilir: menü çubuğu uygulaması Gateway’in WS sunucusuna bağlanır ve yerel tuval/kamera komutlarını bir düğüm olarak sunar (böylece `openclaw nodes …` bu Mac’e karşı çalışır).

Notlar:

- Düğümler **çevre birimleridir**, gateway değildir. Gateway hizmetini çalıştırmazlar.
- Telegram/WhatsApp/vb. mesajlar düğümlere değil, **gateway**'e ulaşır.
- Sorun giderme çalışma kılavuzu: [/nodes/troubleshooting](/tr/nodes/troubleshooting)

## Eşleştirme + durum

**WS düğümleri cihaz eşleştirmesi kullanır.** Düğümler `connect` sırasında bir cihaz kimliği sunar; Gateway, `role: node` için bir cihaz eşleştirme isteği oluşturur. Bunu cihazlar CLI’ı (veya UI) üzerinden onaylayın.

Hızlı CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Bir düğüm değiştirilmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar) yeniden denerse, önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaylamadan önce `openclaw devices list` komutunu yeniden çalıştırın.

Notlar:

- `nodes status`, cihaz eşleştirme rolü `node` içerdiğinde bir düğümü **paired** olarak işaretler.
- Cihaz eşleştirme kaydı, kalıcı onaylı rol sözleşmesidir. Belirteç rotasyonu bu sözleşme içinde kalır; eşleştirme onayının hiç vermediği farklı bir role eşleştirilmiş bir düğümü yükseltemez.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) ayrı, gateway sahipli bir düğüm eşleştirme deposudur; WS `connect` el sıkışmasını **engellemez**.
- Onay kapsamı, bekleyen isteğin bildirilmiş komutlarını izler:
  - komutsuz istek: `operator.pairing`
  - exec olmayan düğüm komutları: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Uzak düğüm ana bilgisayarı (system.run)

Gateway’iniz bir makinede çalışırken komutların başka bir makinede yürütülmesini istiyorsanız bir **node host** kullanın. Model hâlâ **gateway** ile konuşur; `host=node` seçildiğinde gateway `exec` çağrılarını **node host**'a iletir.

### Ne nerede çalışır

- **Gateway host**: mesajları alır, modeli çalıştırır, araç çağrılarını yönlendirir.
- **Node host**: düğüm makinesinde `system.run`/`system.which` yürütür.
- **Onaylar**: node host üzerinde `~/.openclaw/exec-approvals.json` aracılığıyla uygulanır.

Onay notu:

- Onay destekli düğüm çalıştırmaları tam istek bağlamına bağlanır.
- Doğrudan kabuk/runtime dosya çalıştırmaları için OpenClaw ayrıca en iyi çabayla tek bir somut yerel dosya işlenenini bağlar ve bu dosya yürütmeden önce değişirse çalıştırmayı reddeder.
- OpenClaw bir yorumlayıcı/runtime komutu için tam olarak tek bir somut yerel dosya belirleyemezse, tam runtime kapsamı varmış gibi yapmak yerine onay destekli yürütme reddedilir. Daha geniş yorumlayıcı semantiği için sandboxing, ayrı ana bilgisayarlar veya açık bir güvenilir allowlist/tam iş akışı kullanın.

### Bir node host başlatma (ön planda)

Düğüm makinesinde:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH tüneli üzerinden uzak gateway (loopback bind)

Gateway loopback’e bağlanıyorsa (`gateway.bind=loopback`, local mode’da varsayılan),
uzak node host’lar doğrudan bağlanamaz. Bir SSH tüneli oluşturun ve
node host’u tünelin yerel ucuna yönlendirin.

Örnek (node host -> gateway host):

```bash
# Terminal A (çalışmaya devam etmeli): yerel 18790 -> gateway 127.0.0.1:18789 yönlendirmesi
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: gateway belirtecini dışa aktarın ve tünel üzerinden bağlanın
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Notlar:

- `openclaw node run`, belirteç veya parola kimlik doğrulamasını destekler.
- Ortam değişkenleri tercih edilir: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Yapılandırma geri dönüşü `gateway.auth.token` / `gateway.auth.password` şeklindedir.
- local mode’da node host, kasıtlı olarak `gateway.remote.token` / `gateway.remote.password` değerlerini yok sayar.
- remote mode’da `gateway.remote.token` / `gateway.remote.password`, uzak öncelik kurallarına göre uygundur.
- Etkin yerel `gateway.auth.*` SecretRef’leri yapılandırılmış ancak çözümlenmemişse, node-host kimlik doğrulaması kapalı şekilde başarısız olur.
- Node-host kimlik doğrulama çözümlemesi yalnızca `OPENCLAW_GATEWAY_*` ortam değişkenlerini dikkate alır.

### Bir node host başlatma (hizmet)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### Eşleştirme + adlandırma

Gateway ana bilgisayarında:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Düğüm değiştirilmiş kimlik doğrulama ayrıntılarıyla yeniden denerse, `openclaw devices list`
komutunu yeniden çalıştırın ve geçerli `requestId` değerini onaylayın.

Adlandırma seçenekleri:

- `openclaw node run` / `openclaw node install` üzerinde `--display-name` (düğümde `~/.openclaw/node.json` içinde kalıcı olur).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (gateway geçersiz kılması).

### Komutları allowlist’e ekleme

Exec onayları **her node host için ayrıdır**. Gateway üzerinden allowlist girdileri ekleyin:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Onaylar node host üzerinde `~/.openclaw/exec-approvals.json` içinde tutulur.

### Exec’i düğüme yönlendirme

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

Ayarlandığında, `host=node` ile yapılan tüm `exec` çağrıları node host üzerinde çalışır (düğüm allowlist/onaylarına tabi olarak).

`host=auto`, düğümü kendi başına örtük olarak seçmez, ancak açık bir çağrı başına `host=node` isteğine `auto` içinden izin verilir. Düğüm exec’in oturum için varsayılan olmasını istiyorsanız, `tools.exec.host=node` veya `/exec host=node ...` ayarını açıkça yapın.

İlgili:

- [Node host CLI](/cli/node)
- [Exec tool](/tools/exec)
- [Exec approvals](/tools/exec-approvals)

## Komut çağırma

Düşük seviye (ham RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Aracıya bir MEDIA eki verme iş akışları gibi yaygın senaryolar için daha yüksek seviyeli yardımcılar vardır.

## Ekran görüntüleri (tuval anlık görüntüleri)

Düğüm Canvas’ı (WebView) gösteriyorsa, `canvas.snapshot` `{ format, base64 }` döndürür.

CLI yardımcısı (geçici bir dosyaya yazar ve `MEDIA:<path>` yazdırır):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Tuval denetimleri

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Notlar:

- `canvas present`, URL’leri veya yerel dosya yollarını (`--target`) ve ayrıca konumlandırma için isteğe bağlı `--x/--y/--width/--height` değerlerini kabul eder.
- `canvas eval`, satır içi JS (`--js`) veya konumsal bir argüman kabul eder.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Notlar:

- Yalnızca A2UI v0.8 JSONL desteklenir (v0.9/createSurface reddedilir).

## Fotoğraflar + videolar (düğüm kamerası)

Fotoğraflar (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # varsayılan: her iki yön de (2 MEDIA satırı)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Video klipleri (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Notlar:

- `canvas.*` ve `camera.*` için düğümün **foregrounded** olması gerekir (arka plan çağrıları `NODE_BACKGROUND_UNAVAILABLE` döndürür).
- Büyük base64 yüklerinden kaçınmak için klip süresi sınırlandırılır (şu anda `<= 60s`).
- Android mümkün olduğunda `CAMERA`/`RECORD_AUDIO` izinlerini ister; reddedilen izinler `*_PERMISSION_REQUIRED` ile başarısız olur.

## Ekran kayıtları (düğümler)

Desteklenen düğümler `screen.record` (`mp4`) sunar. Örnek:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Notlar:

- `screen.record` kullanılabilirliği düğüm platformuna bağlıdır.
- Ekran kayıtları `<= 60s` ile sınırlandırılır.
- `--no-audio`, desteklenen platformlarda mikrofon yakalamayı devre dışı bırakır.
- Birden fazla ekran olduğunda görüntü seçmek için `--screen <index>` kullanın.

## Konum (düğümler)

Ayarlar içinde Konum etkinleştirildiğinde düğümler `location.get` sunar.

CLI yardımcısı:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notlar:

- Konum varsayılan olarak **kapalıdır**.
- “Always” sistem izni gerektirir; arka plan getirme en iyi çabayla yapılır.
- Yanıt, enlem/boylam, doğruluk (metre) ve zaman damgasını içerir.

## SMS (Android düğümleri)

Kullanıcı **SMS** iznini verdiğinde ve cihaz telefon görüşmesini desteklediğinde Android düğümleri `sms.send` sunabilir.

Düşük seviye çağrı:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Notlar:

- Yetenek duyurulmadan önce izin isteminin Android cihazında kabul edilmesi gerekir.
- Telefon özelliği olmayan yalnızca Wi‑Fi cihazlar `sms.send` duyurmaz.

## Android cihaz + kişisel veri komutları

Android düğümleri, ilgili yetenekler etkinleştirildiğinde ek komut aileleri duyurabilir.

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

- Hareket komutları, mevcut sensörlere göre yetenek kapılıdır.

## Sistem komutları (node host / mac node)

macOS düğümü `system.run`, `system.notify` ve `system.execApprovals.get/set` sunar.
Headless node host `system.run`, `system.which` ve `system.execApprovals.get/set` sunar.

Örnekler:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Notlar:

- `system.run`, yük içinde stdout/stderr/çıkış kodu döndürür.
- Shell yürütmesi artık `host=node` ile `exec` aracı üzerinden yapılır; `nodes`, açık düğüm komutları için doğrudan RPC yüzeyi olmaya devam eder.
- `nodes invoke`, `system.run` veya `system.run.prepare` sunmaz; bunlar yalnızca exec yolunda kalır.
- Exec yolu, onaydan önce standart bir `systemRunPlan` hazırlar. Bir onay verildiğinde, gateway sonradan çağıran tarafından düzenlenmiş komut/cwd/oturum alanlarını değil, depolanmış bu planı iletir.
- `system.notify`, macOS uygulamasındaki bildirim izin durumuna uyar.
- Tanınmayan düğüm `platform` / `deviceFamily` meta verileri, `system.run` ve `system.which` komutlarını hariç tutan ihtiyatlı bir varsayılan allowlist kullanır. Bilinmeyen bir platform için bu komutlara özellikle ihtiyacınız varsa, bunları `gateway.nodes.allowCommands` aracılığıyla açıkça ekleyin.
- `system.run`, `--cwd`, `--env KEY=VAL`, `--command-timeout` ve `--needs-screen-recording` destekler.
- Shell sarmalayıcıları için (`bash|sh|zsh ... -c/-lc`), istek kapsamındaki `--env` değerleri açık bir allowlist’e düşürülür (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- allowlist mode’daki her zaman izin ver kararlarında, bilinen gönderim sarmalayıcıları (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) sarmalayıcı yolları yerine iç yürütülebilir yolları kalıcı hale getirir. Güvenli şekilde açılması mümkün değilse hiçbir allowlist girdisi otomatik olarak kalıcı hale getirilmez.
- allowlist mode’daki Windows node host’larında, `cmd.exe /c` üzerinden shell-wrapper çalıştırmaları onay gerektirir (yalnızca allowlist girdisi bu sarmalayıcı biçimine otomatik izin vermez).
- `system.notify`, `--priority <passive|active|timeSensitive>` ve `--delivery <system|overlay|auto>` destekler.
- Node host’lar `PATH` geçersiz kılmalarını yok sayar ve tehlikeli başlangıç/shell anahtarlarını ayıklar (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Ek PATH girdilerine ihtiyacınız varsa, `PATH` değerini `--env` ile geçirmek yerine node host hizmet ortamını yapılandırın (veya araçları standart konumlara yükleyin).
- macOS node mode’da `system.run`, macOS uygulamasındaki exec onaylarıyla korunur (Ayarlar → Exec approvals). Ask/allowlist/full, headless node host ile aynı şekilde davranır; reddedilen istemler `SYSTEM_RUN_DENIED` döndürür.
- headless node host’ta `system.run`, exec onaylarıyla korunur (`~/.openclaw/exec-approvals.json`).

## Exec düğüm bağlama

Birden fazla düğüm mevcut olduğunda, exec’i belirli bir düğüme bağlayabilirsiniz.
Bu, `exec host=node` için varsayılan düğümü ayarlar (ve ajan başına geçersiz kılınabilir).

Genel varsayılan:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Ajan başına geçersiz kılma:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Herhangi bir düğüme izin vermek için ayarı kaldırın:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## İzinler eşlemesi

Düğümler, `node.list` / `node.describe` içinde izin adına göre anahtarlanmış (ör. `screenRecording`, `accessibility`) ve boole değerler (`true` = verildi) içeren bir `permissions` eşlemesi içerebilir.

## Headless node host (çapraz platform)

OpenClaw, Gateway WebSocket’ine bağlanan ve `system.run` / `system.which` sunan bir **headless node host** (UI olmadan) çalıştırabilir. Bu, Linux/Windows üzerinde veya bir sunucunun yanında minimal bir düğüm çalıştırmak için kullanışlıdır.

Başlatmak için:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Notlar:

- Eşleştirme yine de gereklidir (Gateway bir cihaz eşleştirme istemi gösterecektir).
- Node host, düğüm kimliğini, belirtecini, görünen adını ve gateway bağlantı bilgilerini `~/.openclaw/node.json` içinde saklar.
- Exec onayları yerel olarak `~/.openclaw/exec-approvals.json` üzerinden uygulanır
  ([Exec approvals](/tools/exec-approvals) bölümüne bakın).
- macOS’ta headless node host varsayılan olarak `system.run` komutunu yerel olarak yürütür. `system.run` komutunu yardımcı uygulama exec host üzerinden yönlendirmek için `OPENCLAW_NODE_EXEC_HOST=app` ayarlayın; uygulama host’unu zorunlu kılmak ve kullanılamadığında kapalı şekilde başarısız olmak için `OPENCLAW_NODE_EXEC_FALLBACK=0` da ekleyin.
- Gateway WS TLS kullanıyorsa `--tls` / `--tls-fingerprint` ekleyin.

## Mac node mode

- macOS menü çubuğu uygulaması, Gateway WS sunucusuna bir düğüm olarak bağlanır (böylece `openclaw nodes …` bu Mac’e karşı çalışır).
- remote mode’da uygulama, Gateway portu için bir SSH tüneli açar ve `localhost` adresine bağlanır.
