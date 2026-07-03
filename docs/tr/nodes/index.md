---
read_when:
    - iOS/Android düğümlerini bir gateway ile eşleştirme
    - Node canvas/camera'yı ajan bağlamı için kullanma
    - Yeni Node komutları veya CLI yardımcıları ekleme
summary: 'Node''lar: eşleştirme, yetenekler, izinler ve tuval/kamera/ekran/cihaz/bildirimler/sistem için CLI yardımcıları'
title: Node'lar
x-i18n:
    generated_at: "2026-07-03T09:56:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7096a2600063465ac0bfca359fa1551cb8ca2ab28b095e32a7893669448d36aa
    source_path: nodes/index.md
    workflow: 16
---

Bir **Node**, Gateway **WebSocket**'ine (operatörlerle aynı bağlantı noktası) `role: "node"` ile bağlanan ve `node.invoke` üzerinden bir komut yüzeyi (örn. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) sunan yardımcı bir cihazdır (macOS/iOS/Android/headless). Protokol ayrıntıları: [Gateway protokolü](/tr/gateway/protocol).

Eski taşıma: [Bridge protokolü](/tr/gateway/bridge-protocol) (TCP JSONL;
geçerli Node'lar için yalnızca tarihsel).

macOS ayrıca **Node modunda** da çalışabilir: menü çubuğu uygulaması Gateway'in
WS sunucusuna bağlanır ve yerel canvas/camera komutlarını bir Node olarak sunar (böylece
`openclaw nodes …` bu Mac'e karşı çalışır). Uzak Gateway modunda, tarayıcı
otomasyonu yerel uygulama Node'u tarafından değil, CLI Node host'u (`openclaw node run` veya
kurulu Node servisi) tarafından yürütülür.

Notlar:

- Node'lar **çevre birimleridir**, Gateway değildir. Gateway servisini çalıştırmazlar.
- Telegram/WhatsApp/vb. mesajlar Node'lara değil **Gateway**'e ulaşır.
- Sorun giderme runbook'u: [/nodes/troubleshooting](/tr/nodes/troubleshooting)

## Eşleştirme + durum

**WS Node'ları cihaz eşleştirmesi kullanır.** Node'lar `connect` sırasında bir cihaz kimliği sunar; Gateway
`role: node` için bir cihaz eşleştirme isteği oluşturur. Cihazlar CLI'si (veya UI) üzerinden onaylayın.

Hızlı CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Bir Node değişmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar) yeniden denerse, önceki
bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaylamadan önce
`openclaw devices list` komutunu yeniden çalıştırın.

Notlar:

- `nodes status`, cihaz eşleştirme rolü `node` içerdiğinde bir Node'u **eşleştirilmiş** olarak işaretler.
- Cihaz eşleştirme kaydı, kalıcı onaylı rol sözleşmesidir. Token
  rotasyonu bu sözleşmenin içinde kalır; eşleştirilmiş bir Node'u eşleştirme onayının hiç vermediği
  farklı bir role yükseltemez.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) ayrı, Gateway sahipli
  bir Node eşleştirme deposudur; WS `connect` el sıkışmasını **geçitlemez**.
- `openclaw nodes remove --node <id|name|ip>` bir Node eşleştirmesini kaldırır. Cihaz destekli
  bir Node için cihazın `devices/paired.json` içindeki `node` rolünü iptal eder
  ve o cihazın Node rolü oturumlarının bağlantısını keser — karma rollü bir cihaz
  satırını korur ve yalnızca `node` rolünü kaybeder; yalnızca Node olan bir cihaz satırı ise
  silinir. Ayrıca ayrı Gateway sahipli Node eşleştirme deposundan eşleşen girdileri de temizler.
  `operator.pairing`, operatör olmayan Node satırlarını kaldırabilir; karma rollü bir cihazda
  kendi Node rolünü iptal eden bir cihaz-token çağırıcısının ayrıca `operator.admin` iznine
  ihtiyacı vardır.
- Onay kapsamı, bekleyen isteğin bildirdiği komutları izler:
  - komutsuz istek: `operator.pairing`
  - exec olmayan Node komutları: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Uzak Node host'u (system.run)

Gateway'iniz bir makinede çalışırken komutların başka bir makinede yürütülmesini
istiyorsanız bir **Node host'u** kullanın. Model yine **Gateway** ile konuşur; Gateway
`host=node` seçildiğinde `exec` çağrılarını **Node host**'una iletir.

### Nerede ne çalışır

- **Gateway host'u**: mesajları alır, modeli çalıştırır, tool çağrılarını yönlendirir.
- **Node host'u**: Node makinesinde `system.run`/`system.which` yürütür.
- **Onaylar**: Node host'unda `~/.openclaw/exec-approvals.json` üzerinden zorunlu kılınır.

Onay notu:

- Onay destekli Node çalıştırmaları tam istek bağlamına bağlanır.
- Doğrudan shell/runtime dosya yürütmeleri için OpenClaw ayrıca en iyi çabayla tek bir somut yerel
  dosya operandını bağlar ve bu dosya yürütmeden önce değişirse çalıştırmayı reddeder.
- OpenClaw bir interpreter/runtime komutu için tam olarak bir somut yerel dosyayı tanımlayamazsa,
  tam runtime kapsamı varmış gibi davranmak yerine onay destekli yürütme reddedilir. Daha geniş interpreter semantikleri için sandboxing,
  ayrı host'lar veya açıkça güvenilen bir izin listesi/tam workflow kullanın.

### Bir Node host'u başlatma (ön planda)

Node makinesinde:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH tüneli üzerinden uzak Gateway (loopback bind)

Gateway loopback'e bağlanıyorsa (`gateway.bind=loopback`, yerel modda varsayılan),
uzak Node host'ları doğrudan bağlanamaz. Bir SSH tüneli oluşturun ve
Node host'unu tünelin yerel ucuna yönlendirin.

Örnek (Node host -> Gateway host):

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
- Config fallback'i `gateway.auth.token` / `gateway.auth.password` değerleridir.
- Yerel modda Node host'u bilerek `gateway.remote.token` / `gateway.remote.password` değerlerini yok sayar.
- Uzak modda `gateway.remote.token` / `gateway.remote.password`, uzak öncelik kurallarına göre uygundur.
- Etkin yerel `gateway.auth.*` SecretRef'leri yapılandırılmış ama çözümlenmemişse, Node-host kimlik doğrulaması kapalı başarısız olur.
- Node-host kimlik doğrulama çözümlemesi yalnızca `OPENCLAW_GATEWAY_*` ortam değişkenlerini dikkate alır.

### Bir Node host'u başlatma (servis)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Eşleştirme + adlandırma

Gateway host'unda:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node değişmiş kimlik doğrulama ayrıntılarıyla yeniden denerse, `openclaw devices list` komutunu yeniden çalıştırın
ve geçerli `requestId` değerini onaylayın.

Adlandırma seçenekleri:

- `openclaw node run` / `openclaw node install` üzerinde `--display-name` (Node üzerinde `~/.openclaw/node.json` içinde kalıcı olur).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (Gateway geçersiz kılması).

### Komutları izin listesine ekleme

Exec onayları **Node host başınadır**. Gateway'den izin listesi girdileri ekleyin:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Onaylar Node host'unda `~/.openclaw/exec-approvals.json` konumunda bulunur.

### Exec'i Node'a yönlendirme

Varsayılanları yapılandırın (Gateway config'i):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Veya oturum başına:

```
/exec host=node security=allowlist node=<id-or-name>
```

Ayarlandıktan sonra, `host=node` içeren herhangi bir `exec` çağrısı Node host'unda çalışır (Node
izin listesine/onaylarına tabidir).

`host=auto` kendi başına Node'u örtük olarak seçmez, ancak `auto` içinden açık bir çağrı bazlı `host=node` isteğine izin verilir. Oturum için Node exec'in varsayılan olmasını istiyorsanız `tools.exec.host=node` veya `/exec host=node ...` değerini açıkça ayarlayın.

İlgili:

- [Node host CLI](/tr/cli/node)
- [Exec tool](/tr/tools/exec)
- [Exec onayları](/tr/tools/exec-approvals)

### Yerel model çıkarımı

Bir masaüstü veya sunucu Node'u, o Node üzerinde çalışan bir Ollama sunucusundan
sohbet özellikli modelleri sunabilir. Agent'lar, kurulu modelleri keşfetmek ve
uzaktan sınırlı bir prompt çalıştırmak için Ollama Plugin'inin `node_inference` tool'unu kullanır; Gateway'in
Ollama'ya doğrudan ağ erişimine ihtiyacı yoktur. Kurulum, model filtreleme ve doğrudan doğrulama komutları için
[Ollama Node-yerel çıkarımı](/tr/providers/ollama#node-local-inference) bölümüne bakın.

## Komutları çağırma

Düşük seviye (ham RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Yaygın "agent'a bir MEDIA eki ver" workflow'ları için daha yüksek seviyeli yardımcılar vardır.

## Komut politikası

Node komutları çağrılmadan önce iki geçitten geçmelidir:

1. Node, komutu WebSocket `connect.commands` listesinde bildirmelidir.
2. Gateway'in platform politikası bildirilen komuta izin vermelidir.

Windows ve macOS yardımcı Node'ları varsayılan olarak `canvas.*`, `camera.list`,
`location.get` ve `screen.snapshot` gibi güvenli bildirilen komutlara izin verir.
`talk` capability'sini tanıtan veya `talk.*` komutları bildiren güvenilir Node'lar,
platform etiketinden bağımsız olarak bildirilen push-to-talk komutlarına (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`) da varsayılan olarak izin verir.
`camera.snap`, `camera.clip` ve `screen.record` gibi tehlikeli veya gizlilik açısından ağır
komutlar hâlâ `gateway.nodes.allowCommands` ile açık opt-in gerektirir.
`gateway.nodes.denyCommands`, varsayılanlara ve ek izin listesi girdilerine karşı her zaman kazanır.

Plugin sahipli Node komutları bir Gateway Node-invoke politikası ekleyebilir. Bu politika
izin listesi denetiminden sonra ve Node'a iletmeden önce çalışır; böylece ham
`node.invoke`, CLI yardımcıları ve özel agent tool'ları aynı Plugin
izin sınırını paylaşır. Tehlikeli Plugin Node komutları hâlâ açık
`gateway.nodes.allowCommands` opt-in'i gerektirir.

Bir Node bildirilen komut listesini değiştirdikten sonra eski cihaz eşleştirmesini reddedin
ve yeni isteği onaylayın; böylece Gateway güncellenmiş komut anlık görüntüsünü depolar.

## Config (`openclaw.json`)

Node ile ilgili ayarlar `gateway.nodes` ve `tools.exec` altında bulunur:

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

Tam Node komut adlarını kullanın. `denyCommands`, bir platform varsayılanı veya
`allowCommands` girdisi aksi halde izin verecek olsa bile komutu kaldırır. Gateway Node eşleştirme ve komut politikası alan ayrıntıları için
[Gateway yapılandırma başvurusu](/tr/gateway/configuration-reference#gateway-field-details)
bölümüne bakın.

Agent başına exec Node geçersiz kılması:

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

Node Canvas'ı (WebView) gösteriyorsa, `canvas.snapshot` `{ format, base64 }` döndürür.

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
- `canvas eval`, satır içi JS (`--js`) veya konumsal bir argümanı kabul eder.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Notlar:

- Mobil düğümler, eylem özellikli işleme için paketlenmiş, uygulamanın sahip olduğu bir A2UI sayfası kullanır.
- Yalnızca A2UI v0.8 JSONL desteklenir (v0.9/createSurface reddedilir).
- iOS ve Android uzak Gateway Canvas sayfalarını işler, ancak A2UI düğme eylemleri yalnızca paketlenmiş, uygulamanın sahip olduğu A2UI sayfasından gönderilir. Gateway üzerinde barındırılan HTTP/HTTPS A2UI sayfaları bu mobil istemcilerde yalnızca işleme amaçlıdır.

## Fotoğraflar + videolar (düğüm kamerası)

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

- Düğüm, `canvas.*` ve `camera.*` için **ön planda** olmalıdır (arka plan çağrıları `NODE_BACKGROUND_UNAVAILABLE` döndürür).
- Klip süresi, aşırı büyük base64 yüklerinden kaçınmak için sınırlandırılır (şu anda `<= 60s`).
- Android mümkün olduğunda `CAMERA`/`RECORD_AUDIO` izinleri için istem gösterir; reddedilen izinler `*_PERMISSION_REQUIRED` ile başarısız olur.

## Ekran kayıtları (düğümler)

Desteklenen düğümler `screen.record` (mp4) sunar. Örnek:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Notlar:

- `screen.record` kullanılabilirliği düğüm platformuna bağlıdır.
- Ekran kayıtları `<= 60s` ile sınırlandırılır.
- `--no-audio`, desteklenen platformlarda mikrofon yakalamayı devre dışı bırakır.
- Birden çok ekran kullanılabilir olduğunda ekran seçmek için `--screen <index>` kullanın.

## Konum (düğümler)

Düğümler, ayarlarda Konum etkinleştirildiğinde `location.get` sunar.

CLI yardımcısı:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Notlar:

- Konum **varsayılan olarak kapalıdır**.
- "Her zaman" sistem izni gerektirir; arka planda getirme en iyi çabayla yapılır.
- Yanıt enlem/boylam, doğruluk (metre) ve zaman damgası içerir.

## SMS (Android düğümleri)

Android düğümleri, kullanıcı **SMS** izni verdiğinde ve cihaz telefon özelliğini desteklediğinde `sms.send` sunabilir.

Düşük seviyeli çağırma:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Notlar:

- Yeteneğin ilan edilmesinden önce izin istemi Android cihazda kabul edilmelidir.
- Telefon özelliği olmayan yalnızca Wi-Fi cihazları `sms.send` ilan etmez.

## Android cihaz + kişisel veri komutları

Android düğümleri, karşılık gelen yetenekler etkinleştirildiğinde ek komut aileleri ilan edebilir.

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

Örnek çağırmalar:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Notlar:

- `device.apps` isteğe bağlıdır ve varsayılan olarak başlatıcıda görünen uygulamaları döndürür.
- Hareket komutları, kullanılabilir sensörlere göre yetenek kapılıdır.

## Sistem komutları (düğüm ana makinesi / Mac düğümü)

macOS düğümü `system.run`, `system.notify` ve `system.execApprovals.get/set` sunar.
Başsız düğüm ana makinesi `system.run`, `system.which` ve `system.execApprovals.get/set` sunar.

Örnekler:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Notlar:

- `system.run`, yük içinde stdout/stderr/çıkış kodu döndürür.
- Kabuk yürütme artık `host=node` ile `exec` aracı üzerinden geçer; `nodes`, açık düğüm komutları için doğrudan RPC yüzeyi olarak kalır.
- `nodes invoke`, `system.run` veya `system.run.prepare` sunmaz; bunlar yalnızca exec yolunda kalır.
- Exec yolu, onaydan önce kanonik bir `systemRunPlan` hazırlar. Bir
  onay verildiğinde gateway, daha sonra çağıran tarafından düzenlenen command/cwd/session alanlarını değil, saklanan bu planı iletir.
- `system.notify`, macOS uygulamasındaki bildirim izin durumuna uyar.
- Tanınmayan düğüm `platform` / `deviceFamily` meta verileri, `system.run` ve `system.which` öğelerini dışlayan korumacı bir varsayılan izin listesi kullanır. Bilinmeyen bir platform için bu komutlara bilinçli olarak ihtiyacınız varsa, bunları `gateway.nodes.allowCommands` üzerinden açıkça ekleyin.
- `system.run`, `--cwd`, `--env KEY=VAL`, `--command-timeout` ve `--needs-screen-recording` destekler.
- Kabuk sarmalayıcıları (`bash|sh|zsh ... -c/-lc`) için, istek kapsamlı `--env` değerleri açık bir izin listesine indirgenir (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- İzin listesi modunda her zaman izin ver kararları için bilinen gönderim sarmalayıcıları (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) sarmalayıcı yolları yerine iç yürütülebilir dosya yollarını kalıcı hale getirir. Sarmalamayı açmak güvenli değilse, otomatik olarak hiçbir izin listesi girdisi kalıcı hale getirilmez.
- İzin listesi modundaki Windows düğüm ana makinelerinde, `cmd.exe /c` üzerinden kabuk sarmalayıcı çalıştırmaları onay gerektirir (izin listesi girdisi tek başına sarmalayıcı biçimini otomatik olarak izinli yapmaz).
- `system.notify`, `--priority <passive|active|timeSensitive>` ve `--delivery <system|overlay|auto>` destekler.
- Düğüm ana makineleri `PATH` geçersiz kılmalarını yok sayar ve tehlikeli başlangıç/kabuk anahtarlarını çıkarır (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Ek PATH girdilerine ihtiyacınız varsa, `PATH` değerini `--env` üzerinden geçirmek yerine düğüm ana makinesi hizmet ortamını yapılandırın (veya araçları standart konumlara kurun).
- macOS düğüm modunda `system.run`, macOS uygulamasındaki exec onaylarıyla kapılanır (Ayarlar → Exec onayları).
  Sor/izin listesi/tam, başsız düğüm ana makinesiyle aynı davranır; reddedilen istemler `SYSTEM_RUN_DENIED` döndürür.
- Başsız düğüm ana makinesinde `system.run`, exec onaylarıyla kapılanır (`~/.openclaw/exec-approvals.json`).

## Exec düğüm bağlama

Birden çok düğüm kullanılabilir olduğunda exec'i belirli bir düğüme bağlayabilirsiniz.
Bu, `exec host=node` için varsayılan düğümü ayarlar (ve ajan başına geçersiz kılınabilir).

Genel varsayılan:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Ajan başına geçersiz kılma:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Herhangi bir düğüme izin vermek için ayarı kaldırın:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## İzinler haritası

Düğümler, `node.list` / `node.describe` içinde izin adına göre anahtarlanan (ör. `screenRecording`, `accessibility`) ve boolean değerler içeren (`true` = verildi) bir `permissions` haritası içerebilir.

## Başsız düğüm ana makinesi (platformlar arası)

OpenClaw, Gateway
WebSocket'e bağlanan ve `system.run` / `system.which` sunan **başsız düğüm ana makinesi** (UI yok) çalıştırabilir. Bu, Linux/Windows üzerinde
veya bir sunucunun yanında minimal bir düğüm çalıştırmak için kullanışlıdır.

Başlatın:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Notlar:

- Eşleştirme yine de gereklidir (Gateway bir cihaz eşleştirme istemi gösterir).
- Düğüm ana makinesi düğüm kimliğini, token'ını, görünen adını ve gateway bağlantı bilgilerini `~/.openclaw/node.json` içinde saklar.
- Exec onayları yerel olarak `~/.openclaw/exec-approvals.json` üzerinden uygulanır
  (bkz. [Exec onayları](/tr/tools/exec-approvals)).
- macOS üzerinde başsız düğüm ana makinesi varsayılan olarak `system.run` öğesini yerel olarak yürütür. `system.run` öğesini eşlikçi uygulama exec ana makinesi üzerinden yönlendirmek için
  `OPENCLAW_NODE_EXEC_HOST=app` ayarlayın; uygulama ana makinesini zorunlu kılmak ve kullanılamıyorsa kapalı başarısız olmak için
  `OPENCLAW_NODE_EXEC_FALLBACK=0` ekleyin.
- Gateway WS TLS kullanıyorsa `--tls` / `--tls-fingerprint` ekleyin.

## Mac düğüm modu

- macOS menü çubuğu uygulaması Gateway WS sunucusuna düğüm olarak bağlanır (böylece `openclaw nodes …` bu Mac'e karşı çalışır).
- Uzak modda uygulama Gateway bağlantı noktası için bir SSH tüneli açar ve `localhost` öğesine bağlanır.
