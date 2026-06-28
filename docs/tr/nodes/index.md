---
read_when:
    - iOS/Android düğümlerini bir gateway ile eşleştirme
    - Ajan bağlamı için Node tuvali/kamerası kullanma
    - Yeni Node komutları veya CLI yardımcıları ekleme
summary: 'Nodes: eşleştirme, yetenekler, izinler ve tuval/kamera/ekran/cihaz/bildirimler/sistem için CLI yardımcıları'
title: Node'lar
x-i18n:
    generated_at: "2026-06-28T00:46:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e860f051faeeea2d7461d07d2119a7f11f80812aa87896882f11edee36667e4a
    source_path: nodes/index.md
    workflow: 16
---

Bir **düğüm**, Gateway **WebSocket**'ine (operatörlerle aynı port) `role: "node"` ile bağlanan ve `node.invoke` aracılığıyla bir komut yüzeyi (örn. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) sunan yardımcı bir cihazdır (macOS/iOS/Android/headless). Protokol ayrıntıları: [Gateway protokolü](/tr/gateway/protocol).

Eski taşıma: [Bridge protokolü](/tr/gateway/bridge-protocol) (TCP JSONL;
geçerli düğümler için yalnızca tarihsel).

macOS ayrıca **düğüm modunda** çalışabilir: menü çubuğu uygulaması Gateway'in
WS sunucusuna bağlanır ve yerel canvas/camera komutlarını bir düğüm olarak sunar (böylece
`openclaw nodes …` bu Mac'e karşı çalışır). Uzak gateway modunda, tarayıcı
otomasyonu yerel uygulama düğümü tarafından değil, CLI düğüm konağı (`openclaw node run` veya
kurulu düğüm servisi) tarafından yönetilir.

Notlar:

- Düğümler **çevre birimleridir**, gateway değildir. Gateway servisini çalıştırmazlar.
- Telegram/WhatsApp/vb. mesajları düğümlere değil, **gateway** üzerine gelir.
- Sorun giderme çalışma kitabı: [/nodes/troubleshooting](/tr/nodes/troubleshooting)

## Eşleştirme + durum

**WS düğümleri cihaz eşleştirmesi kullanır.** Düğümler `connect` sırasında bir cihaz kimliği sunar; Gateway
`role: node` için bir cihaz eşleştirme isteği oluşturur. Cihazlar CLI'ı (veya UI) üzerinden onaylayın.

Hızlı CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Bir düğüm değişmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar) yeniden denerse, önceki
bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaylamadan önce
`openclaw devices list` komutunu yeniden çalıştırın.

Notlar:

- `nodes status`, cihaz eşleştirme rolü `node` içerdiğinde düğümü **eşleştirilmiş** olarak işaretler.
- Cihaz eşleştirme kaydı, kalıcı onaylanmış rol sözleşmesidir. Token
  rotasyonu bu sözleşmenin içinde kalır; eşleştirilmiş bir düğümü, eşleştirme
  onayının hiç vermediği farklı bir role yükseltemez.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) ayrı bir gateway'e ait
  düğüm eşleştirme deposudur; WS `connect` el sıkışmasını **denetlemez**.
- `openclaw nodes remove --node <id|name|ip>` bir düğüm eşleştirmesini kaldırır. Cihaz destekli
  bir düğüm için cihazın `devices/paired.json` içindeki `node` rolünü iptal eder
  ve o cihazın düğüm rollü oturumlarının bağlantısını keser; karma rollü bir cihaz
  satırını korur ve yalnızca `node` rolünü kaybederken, yalnızca düğüm olan bir cihaz satırı
  silinir. Ayrıca ayrı gateway'e ait düğüm eşleştirme deposundaki eşleşen girdileri de temizler.
  `operator.pairing`, operatör olmayan düğüm satırlarını kaldırabilir; karma rollü bir cihazda
  kendi düğüm rolünü iptal eden cihaz token'lı çağıranın ayrıca `operator.admin` yetkisine
  ihtiyacı vardır.
- Onay kapsamı, bekleyen isteğin bildirdiği komutları izler:
  - komutsuz istek: `operator.pairing`
  - exec olmayan düğüm komutları: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Uzak düğüm konağı (system.run)

Gateway'iniz bir makinede çalışırken komutların başka bir makinede yürütülmesini istiyorsanız
bir **düğüm konağı** kullanın. Model yine **gateway** ile konuşur; gateway,
`host=node` seçildiğinde `exec` çağrılarını **düğüm konağına** iletir.

### Nerede ne çalışır

- **Gateway konağı**: mesajları alır, modeli çalıştırır, araç çağrılarını yönlendirir.
- **Düğüm konağı**: düğüm makinesinde `system.run`/`system.which` yürütür.
- **Onaylar**: düğüm konağında `~/.openclaw/exec-approvals.json` üzerinden uygulanır.

Onay notu:

- Onay destekli düğüm çalıştırmaları tam istek bağlamına bağlanır.
- Doğrudan shell/runtime dosya yürütmeleri için OpenClaw ayrıca en iyi çabayla bir somut yerel
  dosya operandını bağlar ve bu dosya yürütmeden önce değişirse çalıştırmayı reddeder.
- OpenClaw bir yorumlayıcı/runtime komutu için tam olarak bir somut yerel dosya belirleyemezse,
  tam runtime kapsamı varmış gibi davranmak yerine onay destekli yürütme reddedilir. Daha geniş yorumlayıcı semantiklerinde sandboxing,
  ayrı konaklar veya açıkça güvenilen bir izin listesi/tam iş akışı kullanın.

### Bir düğüm konağı başlatma (ön plan)

Düğüm makinesinde:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH tüneli üzerinden uzak gateway (loopback bağlama)

Gateway loopback'e bağlanıyorsa (`gateway.bind=loopback`, yerel modda varsayılan),
uzak düğüm konakları doğrudan bağlanamaz. Bir SSH tüneli oluşturun ve
düğüm konağını tünelin yerel ucuna yönlendirin.

Örnek (düğüm konağı -> gateway konağı):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Notlar:

- `openclaw node run` token veya parola kimlik doğrulamasını destekler.
- Env değişkenleri tercih edilir: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Config geri dönüşü `gateway.auth.token` / `gateway.auth.password`.
- Yerel modda, düğüm konağı bilinçli olarak `gateway.remote.token` / `gateway.remote.password` değerlerini yok sayar.
- Uzak modda, `gateway.remote.token` / `gateway.remote.password` uzak öncelik kurallarına göre uygundur.
- Etkin yerel `gateway.auth.*` SecretRef'leri yapılandırılmış ama çözümlenmemişse, düğüm konağı kimlik doğrulaması kapalı şekilde başarısız olur.
- Düğüm konağı kimlik doğrulama çözümlemesi yalnızca `OPENCLAW_GATEWAY_*` env değişkenlerini dikkate alır.

### Bir düğüm konağı başlatma (servis)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Eşleştirme + adlandırma

Gateway konağında:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Düğüm değişmiş kimlik doğrulama ayrıntılarıyla yeniden denerse, `openclaw devices list`
komutunu yeniden çalıştırın ve geçerli `requestId` değerini onaylayın.

Adlandırma seçenekleri:

- `openclaw node run` / `openclaw node install` üzerinde `--display-name` (düğümde `~/.openclaw/node.json` içinde kalıcı olur).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (gateway geçersiz kılması).

### Komutları izin listesine alma

Exec onayları **düğüm konağı başınadır**. Gateway'den izin listesi girdileri ekleyin:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Onaylar düğüm konağında `~/.openclaw/exec-approvals.json` konumunda bulunur.

### Exec'i düğüme yönlendirme

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

Ayarlanınca, `host=node` içeren tüm `exec` çağrıları düğüm konağında çalışır (düğüm
izin listesine/onaylarına tabidir).

`host=auto` düğümü kendi başına örtük olarak seçmez, ancak `auto` içinden açık bir çağrı başına `host=node` isteğine izin verilir. Düğüm exec'in oturum için varsayılan olmasını istiyorsanız `tools.exec.host=node` veya `/exec host=node ...` değerini açıkça ayarlayın.

İlgili:

- [Düğüm konağı CLI](/tr/cli/node)
- [Exec aracı](/tr/tools/exec)
- [Exec onayları](/tr/tools/exec-approvals)

## Komut çağırma

Düşük seviye (ham RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Yaygın "ajana bir MEDIA eki ver" iş akışları için daha yüksek seviyeli yardımcılar vardır.

## Komut ilkesi

Düğüm komutları çağrılmadan önce iki kapıdan geçmelidir:

1. Düğüm, komutu WebSocket `connect.commands` listesinde bildirmelidir.
2. Gateway'in platform ilkesi bildirilen komuta izin vermelidir.

Windows ve macOS yardımcı düğümleri varsayılan olarak `canvas.*`, `camera.list`, `location.get` ve `screen.snapshot` gibi
güvenli bildirilen komutlara izin verir.
`talk` yeteneğini duyuran veya `talk.*` komutları bildiren güvenilir düğümler,
platform etiketinden bağımsız olarak bildirilen push-to-talk komutlarına (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`) da varsayılan olarak izin verir.
`camera.snap`, `camera.clip` ve `screen.record` gibi tehlikeli veya gizlilik açısından ağır
komutlar yine de `gateway.nodes.allowCommands` ile açık opt-in gerektirir.
`gateway.nodes.denyCommands`, varsayılanlara ve ek izin listesi girdilerine her zaman üstün gelir.

Plugin'a ait düğüm komutları bir Gateway node-invoke ilkesi ekleyebilir. Bu ilke
izin listesi denetiminden sonra ve düğüme iletmeden önce çalışır; böylece ham
`node.invoke`, CLI yardımcıları ve özel ajan araçları aynı Plugin
izin sınırını paylaşır. Tehlikeli Plugin düğüm komutları yine de açık
`gateway.nodes.allowCommands` opt-in gerektirir.

Bir düğüm bildirilen komut listesini değiştirdikten sonra, eski cihaz eşleştirmesini reddedin
ve gateway'in güncellenmiş komut anlık görüntüsünü saklaması için yeni isteği onaylayın.

## Config (`openclaw.json`)

Düğüme ilişkin ayarlar `gateway.nodes` ve `tools.exec` altında bulunur:

```json5
{
  gateway: {
    nodes: {
      // Auto-approve first-time node pairing from trusted networks (CIDR list).
      // Disabled when unset. Only applies to first-time role:node requests
      // with no requested scopes; does not auto-approve upgrades.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Opt into dangerous/privacy-heavy node commands (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Block exact command names even if defaults or allowCommands include them.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Default exec host: "node" routes all exec calls to a paired node.
      host: "node",
      // Security mode for node exec: allow only approved/allowlisted commands.
      security: "allowlist",
      // Pin exec to a specific node (id or name). Omit to allow any node.
      node: "build-node",
    },
  },
}
```

Tam düğüm komut adlarını kullanın. `denyCommands`, bir platform varsayılanı veya
`allowCommands` girdisi aksi halde izin verecek olsa bile bir komutu kaldırır. Gateway düğüm eşleştirme ve komut ilkesi alan ayrıntıları için
[Gateway yapılandırma referansına](/tr/gateway/configuration-reference#gateway-field-details)
bakın.

Ajan başına exec düğümü geçersiz kılması:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## Ekran görüntüleri (canvas anlık görüntüleri)

Düğüm Canvas'ı (WebView) gösteriyorsa, `canvas.snapshot` `{ format, base64 }` döndürür.

CLI yardımcısı (geçici bir dosyaya yazar ve kaydedilen yolu yazdırır):

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
- `canvas eval`, satır içi JS (`--js`) veya konumsal bir argüman kabul eder.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Notlar:

- Mobil düğümler, eylem destekli işleme için paketlenmiş ve uygulamaya ait bir A2UI sayfası kullanır.
- Yalnızca A2UI v0.8 JSONL desteklenir (v0.9/createSurface reddedilir).
- iOS ve Android uzak Gateway Canvas sayfalarını işler, ancak A2UI düğme eylemleri yalnızca paketlenmiş ve uygulamaya ait A2UI sayfasından gönderilir. Gateway tarafından barındırılan HTTP/HTTPS A2UI sayfaları bu mobil istemcilerde yalnızca işleme amaçlıdır.

## Fotoğraflar + videolar (düğüm kamerası)

Fotoğraflar (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Video klipleri (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Notlar:

- Node, `canvas.*` ve `camera.*` için **ön planda** olmalıdır (arka plan çağrıları `NODE_BACKGROUND_UNAVAILABLE` döndürür).
- Klip süresi, aşırı büyük base64 yüklerini önlemek için sınırlandırılır (şu anda `<= 60s`).
- Android, mümkün olduğunda `CAMERA`/`RECORD_AUDIO` izinleri için istem gösterir; reddedilen izinler `*_PERMISSION_REQUIRED` ile başarısız olur.

## Ekran kayıtları (Node'lar)

Desteklenen Node'lar `screen.record` (`mp4`) sunar. Örnek:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Notlar:

- `screen.record` kullanılabilirliği Node platformuna bağlıdır.
- Ekran kayıtları `<= 60s` ile sınırlandırılır.
- `--no-audio`, desteklenen platformlarda mikrofon yakalamayı devre dışı bırakır.
- Birden fazla ekran kullanılabilir olduğunda bir ekran seçmek için `--screen <index>` kullanın.

## Konum (Node'lar)

Node'lar, ayarlarda Konum etkinleştirildiğinde `location.get` sunar.

CLI yardımcısı:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notlar:

- Konum **varsayılan olarak kapalıdır**.
- "Always" sistem izni gerektirir; arka plan getirme en iyi çabayla çalışır.
- Yanıt enlem/boylam, doğruluk (metre) ve zaman damgası içerir.

## SMS (Android Node'ları)

Android Node'ları, kullanıcı **SMS** izni verdiğinde ve cihaz telefon özelliğini desteklediğinde `sms.send` sunabilir.

Düşük düzey çağrı:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Notlar:

- Yetenek duyurulmadan önce izin isteminin Android cihazda kabul edilmesi gerekir.
- Telefon özelliği olmayan yalnızca Wi-Fi cihazları `sms.send` duyurmaz.

## Android cihaz + kişisel veri komutları

Android Node'ları, karşılık gelen yetenekler etkinleştirildiğinde ek komut aileleri duyurabilir.

Kullanılabilir aileler:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- Android Ayarları'nda Yüklü Uygulamalar paylaşımı etkinleştirildiğinde `device.apps`
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
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Notlar:

- `device.apps` isteğe bağlıdır ve varsayılan olarak başlatıcıda görünen uygulamaları döndürür.
- Hareket komutları, mevcut sensörlere göre yetenek kapılıdır.

## Sistem komutları (Node ana makinesi / Mac Node'u)

macOS Node'u `system.run`, `system.notify` ve `system.execApprovals.get/set` sunar.
Başsız Node ana makinesi `system.run`, `system.which` ve `system.execApprovals.get/set` sunar.

Örnekler:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Notlar:

- `system.run`, yük içinde stdout/stderr/çıkış kodu döndürür.
- Kabuk yürütmesi artık `host=node` ile `exec` aracı üzerinden geçer; `nodes`, açık Node komutları için doğrudan RPC yüzeyi olarak kalır.
- `nodes invoke`, `system.run` veya `system.run.prepare` sunmaz; bunlar yalnızca exec yolunda kalır.
- Exec yolu, onaydan önce kanonik bir `systemRunPlan` hazırlar. Bir
  onay verildiğinde Gateway, çağıranın daha sonra düzenlediği command/cwd/session
  alanlarını değil, saklanan bu planı iletir.
- `system.notify`, macOS uygulamasındaki bildirim izin durumuna uyar.
- Tanınmayan Node `platform` / `deviceFamily` meta verileri, `system.run` ve `system.which` komutlarını dışarıda bırakan korumacı bir varsayılan izin listesi kullanır. Bilinmeyen bir platform için bu komutlara bilinçli olarak ihtiyacınız varsa, bunları `gateway.nodes.allowCommands` üzerinden açıkça ekleyin.
- `system.run`, `--cwd`, `--env KEY=VAL`, `--command-timeout` ve `--needs-screen-recording` destekler.
- Kabuk sarmalayıcıları (`bash|sh|zsh ... -c/-lc`) için istek kapsamlı `--env` değerleri açık bir izin listesine indirgenir (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- İzin listesi modunda her zaman izin ver kararları için bilinen dağıtım sarmalayıcıları (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`), sarmalayıcı yolları yerine içteki yürütülebilir dosya yollarını kalıcı hale getirir. Sarmalamayı açmak güvenli değilse, hiçbir izin listesi girdisi otomatik olarak kalıcı hale getirilmez.
- Windows Node ana makinelerinde izin listesi modunda, `cmd.exe /c` üzerinden kabuk sarmalayıcı çalıştırmaları onay gerektirir (izin listesi girdisi tek başına sarmalayıcı biçimine otomatik izin vermez).
- `system.notify`, `--priority <passive|active|timeSensitive>` ve `--delivery <system|overlay|auto>` destekler.
- Node ana makineleri `PATH` geçersiz kılmalarını yok sayar ve tehlikeli başlangıç/kabuk anahtarlarını ayıklar (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Ek PATH girdilerine ihtiyacınız varsa, `PATH` değerini `--env` ile geçirmek yerine Node ana makine hizmet ortamını yapılandırın (veya araçları standart konumlara kurun).
- macOS Node modunda `system.run`, macOS uygulamasındaki exec onayları tarafından kapılanır (Ayarlar → Exec onayları).
  Sor/izin listesi/tam, başsız Node ana makinesiyle aynı şekilde davranır; reddedilen istemler `SYSTEM_RUN_DENIED` döndürür.
- Başsız Node ana makinesinde `system.run`, exec onayları (`~/.openclaw/exec-approvals.json`) tarafından kapılanır.

## Exec Node bağlama

Birden fazla Node kullanılabilir olduğunda, exec'i belirli bir Node'a bağlayabilirsiniz.
Bu, `exec host=node` için varsayılan Node'u ayarlar (ve ajan başına geçersiz kılınabilir).

Genel varsayılan:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Ajan başına geçersiz kılma:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Herhangi bir Node'a izin vermek için ayarı kaldırın:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## İzinler haritası

Node'lar, `node.list` / `node.describe` içinde, izin adına göre anahtarlanan (ör. `screenRecording`, `accessibility`) ve boolean değerler (`true` = verilmiş) içeren bir `permissions` haritası bulundurabilir.

## Başsız Node ana makinesi (platformlar arası)

OpenClaw, Gateway WebSocket'e bağlanan ve `system.run` / `system.which` sunan
**başsız bir Node ana makinesi** (UI yok) çalıştırabilir. Bu, Linux/Windows üzerinde
veya bir sunucunun yanında minimal bir Node çalıştırmak için kullanışlıdır.

Başlatın:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Notlar:

- Eşleştirme hâlâ gereklidir (Gateway bir cihaz eşleştirme istemi gösterir).
- Node ana makinesi, Node kimliğini, token'ını, görünen adını ve Gateway bağlantı bilgilerini `~/.openclaw/node.json` içinde saklar.
- Exec onayları yerel olarak `~/.openclaw/exec-approvals.json` üzerinden uygulanır
  (bkz. [Exec onayları](/tr/tools/exec-approvals)).
- macOS üzerinde, başsız Node ana makinesi varsayılan olarak `system.run` komutunu yerelde yürütür.
  `system.run` komutunu eşlik eden uygulama exec ana makinesi üzerinden yönlendirmek için
  `OPENCLAW_NODE_EXEC_HOST=app` ayarlayın; uygulama ana makinesini zorunlu kılmak ve kullanılamadığında kapalı şekilde başarısız olmak için
  `OPENCLAW_NODE_EXEC_FALLBACK=0` ekleyin.
- Gateway WS, TLS kullandığında `--tls` / `--tls-fingerprint` ekleyin.

## Mac Node modu

- macOS menü çubuğu uygulaması Gateway WS sunucusuna bir Node olarak bağlanır (böylece `openclaw nodes …` bu Mac'e karşı çalışır).
- Uzak modda uygulama, Gateway portu için bir SSH tüneli açar ve `localhost` adresine bağlanır.
