---
read_when:
    - Gateway'i CLI'dan çalıştırma (geliştirme veya sunucular)
    - Gateway kimlik doğrulaması, bağlama modları ve bağlantı sorunlarını ayıklama
    - Bonjour aracılığıyla Gateway'leri keşfetme (yerel + geniş alan DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — gateway'leri çalıştırın, sorgulayın ve keşfedin
title: Gateway
x-i18n:
    generated_at: "2026-07-12T12:10:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75f8f4bebe585b213f486f08bf20015aeb89ca4d179f6d96c1008ec9d1cd00ea
    source_path: cli/gateway.md
    workflow: 16
---

Gateway, OpenClaw'ın WebSocket sunucusudur (kanallar, Node'lar, oturumlar, hook'lar). Aşağıdaki tüm alt komutlar `openclaw gateway ...` altında yer alır.

<CardGroup cols={3}>
  <Card title="Bonjour keşfi" href="/tr/gateway/bonjour">
    Yerel mDNS + geniş alan DNS-SD kurulumu.
  </Card>
  <Card title="Keşfe genel bakış" href="/tr/gateway/discovery">
    OpenClaw'ın Gateway'leri nasıl duyurduğu ve bulduğu.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration">
    Üst düzey Gateway yapılandırma anahtarları.
  </Card>
</CardGroup>

## Gateway'i çalıştırma

```bash
openclaw gateway
openclaw gateway run   # eşdeğer, açık biçim
```

<AccordionGroup>
  <Accordion title="Başlatma davranışı">
    - `~/.openclaw/openclaw.json` içinde `gateway.mode=local` ayarlanmadığı sürece başlatmayı reddeder. Geçici/geliştirme çalıştırmaları için `--allow-unconfigured` kullanın; yapılandırmayı yazmadan veya onarmadan korumayı atlar.
    - `openclaw onboard --mode local` ve `openclaw setup`, `gateway.mode=local` değerini yazar. Yapılandırma dosyası mevcutsa ancak `gateway.mode` eksikse bu, bozulmuş/üzerine yazılmış yapılandırma olarak değerlendirilir ve Gateway sizin yerinize `local` değerini tahmin etmeyi reddeder — ilk katılımı yeniden çalıştırın, anahtarı elle ayarlayın veya `--allow-unconfigured` iletin.
    - Kimlik doğrulama olmadan loopback dışına bağlanma engellenir.
    - `--bind` seçeneklerinden `lan`, `tailnet` ve `custom` günümüzde yalnızca IPv4 yolları üzerinden çözümlenir; yalnızca IPv6 kullanan kendi sunucunuzu getirin kurulumları, Gateway'in önünde bir IPv4 yardımcı hizmeti veya proxy gerektirir.
    - `SIGUSR1`, yetkilendirildiğinde süreç içi yeniden başlatmayı tetikler. `commands.restart` (varsayılan: etkin), dışarıdan gönderilen `SIGUSR1` sinyallerini denetler; Gateway `restart` komutu, Gateway aracı ve yapılandırma uygulama/güncelleme üzerinden yeniden başlatmaya izin vermeyi sürdürürken işletim sistemi sinyaliyle elle yeniden başlatmaları engellemek için bunu `false` olarak ayarlayın.
    - `SIGINT`/`SIGTERM` süreci durdurur ancak özel terminal durumunu geri yüklemez — CLI'yi bir TUI veya ham mod girişiyle sarmalıyorsanız çıkmadan önce terminali kendiniz geri yükleyin.

  </Accordion>
</AccordionGroup>

### Seçenekler

<ParamField path="--port <port>" type="number">
  WebSocket portu (varsayılan yapılandırmadan/ortamdan gelir; genellikle `18789`).
</ParamField>
<ParamField path="--bind <mode>" type="string">
  Bağlama modu: `loopback` (varsayılan), `lan`, `tailnet`, `auto`, `custom`.
</ParamField>
<ParamField path="--token <token>" type="string">
  `connect.params.auth.token` için paylaşılan belirteç. Ayarlandığında varsayılan olarak `OPENCLAW_GATEWAY_TOKEN` kullanılır.
</ParamField>
<ParamField path="--auth <mode>" type="string">
  Kimlik doğrulama modu: `none`, `token`, `password`, `trusted-proxy`.
</ParamField>
<ParamField path="--password <password>" type="string">
  `--auth password` için parola.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Gateway parolasını bir dosyadan okuyun.
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Tailscale erişime açma modu: `off`, `serve`, `funnel`.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Kapatma sırasında Tailscale serve/funnel yapılandırmasını sıfırlayın.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  `gateway.mode=local` zorunluluğunu uygulamadan başlatın. Yalnızca geçici/geliştirme önyüklemesi içindir; yapılandırmayı kalıcılaştırmaz veya onarmaz.
</ParamField>
<ParamField path="--dev" type="boolean">
  Eksikse geliştirme yapılandırması + çalışma alanı oluşturun (`BOOTSTRAP.md` atlanır).
</ParamField>
<ParamField path="--reset" type="boolean">
  Geliştirme yapılandırmasını, kimlik bilgilerini, oturumları ve çalışma alanını sıfırlayın. `--dev` gerektirir.
</ParamField>
<ParamField path="--force" type="boolean">
  Başlatmadan önce hedef porttaki mevcut dinleyiciyi sonlandırın.
</ParamField>
<ParamField path="--verbose" type="boolean">
  stdout/stderr'e ayrıntılı günlük kaydı.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Konsolda yalnızca CLI arka uç günlüklerini gösterin (stdout/stderr'i de etkinleştirir).
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  WebSocket günlük biçemi: `auto`, `full`, `compact`.
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact` için diğer ad.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Ham model akışı olaylarını JSONL biçiminde günlüğe kaydedin.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ham akış JSONL yolu.
</ParamField>

`--claude-cli-logs`, `--cli-backend-logs` için kullanımdan kaldırılmış bir diğer addır.

`--bind custom` için `gateway.customBindHost` değerini bir IPv4 adresine ayarlayın. `127.0.0.1` veya `0.0.0.0` dışındaki tüm adresler, aynı sunucudaki istemciler için aynı portta `127.0.0.1` adresini de gerektirir; dinleyicilerden herhangi biri bağlanamazsa başlatma başarısız olur. Joker karakterli `0.0.0.0`, ayrıca zorunlu bir diğer ad eklemez. Yalnızca IPv6 kullanan kendi sunucunuzu getirin kurulumları, Gateway'in önünde bir IPv4 yardımcı hizmeti veya proxy gerektirir.

## Gateway'i yeniden başlatma

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe`, çalışan Gateway'den etkin işleri önceden denetlemesini ve bu işler tamamlandıktan sonra birleştirilmiş tek bir yeniden başlatma zamanlamasını ister. Bekleme süresi `gateway.reload.deferralTimeoutMs` ile sınırlıdır (varsayılan: 5 dakika / `300000`); süre dolduğunda yeniden başlatma zorlanır. Zorlamak yerine süresiz beklemek (düzenli aralıklarla hâlâ beklemede uyarılarıyla) için `deferralTimeoutMs: 0` olarak ayarlayın. `--safe`, `--force` veya `--wait` ile birlikte kullanılamaz.

`--skip-deferral`, güvenli yeniden başlatmada etkin iş erteleme kapısını atlar; böylece bildirilen engelleyiciler olsa bile Gateway hemen yeniden başlatılır. `--safe` gerektirir — erteleme kontrolden çıkmış bir görevde takılı kaldığında kullanın.

`--wait <duration>`, normal (güvenli olmayan) yeniden başlatma için boşaltma süresi sınırını geçersiz kılar. Birimsiz milisaniyeleri veya `ms`, `s`, `m`, `h`, `d` birim son eklerini kabul eder (ör. `30s`, `5m`, `1h30m`); `--wait 0` süresiz bekler. `--force` veya `--safe` ile uyumlu değildir.

`--force`, etkin işlerin tamamlanmasını beklemeyi atlar ve hemen yeniden başlatır. Normal `restart` (bayraksız), mevcut hizmet yöneticisi yeniden başlatma davranışını korur.

<Warning>
Satır içi `--password`, yerel süreç listelerinde görünür olabilir. `--password-file`, ortam değişkeni veya SecretRef destekli `gateway.auth.password` tercih edin.
</Warning>

### Gateway profil oluşturma

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1`, her aşama için `eventLoopMax` gecikmesi ve Plugin arama tablosu zamanlamaları (kurulu dizin, manifest kayıt defteri, başlatma planlaması, sahip eşlemesi çalışması) dâhil olmak üzere başlatma sırasındaki aşama zamanlamalarını günlüğe kaydeder.
- `OPENCLAW_GATEWAY_RESTART_TRACE=1`, yeniden başlatma kapsamındaki `restart trace:` satırlarını günlüğe kaydeder: sinyal işleme, etkin işlerin tamamlanmasını bekleme, kapatma aşamaları, sonraki başlatma, hazır olma zamanlaması ve bellek ölçümleri.
- `OPENCLAW_DIAGNOSTICS=timeline`, `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` ile birlikte harici kalite güvence düzenekleri için en iyi çabayla bir JSONL başlatma tanılama zaman çizelgesi yazar (`diagnostics.flags: ["timeline"]` yapılandırmasına eşdeğerdir; yol hâlâ yalnızca ortam değişkeniyle ayarlanır). Olay döngüsü örneklerini dâhil etmek için `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` ekleyin.
- `pnpm build`, ardından `pnpm test:startup:gateway -- --runs 5 --warmup 1`, oluşturulmuş CLI girişini kullanarak Gateway başlatmasını karşılaştırmalı olarak ölçer: ilk süreç çıktısı, `/healthz`, `/readyz`, başlatma izleme zamanlamaları, olay döngüsü gecikmesi ve Plugin arama tablosu zamanlaması.
- `pnpm build`, ardından `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`, macOS veya Linux'ta süreç içi yeniden başlatmayı karşılaştırmalı olarak ölçer (Windows'ta desteklenmez; yeniden başlatma `SIGUSR1` gerektirir). `SIGUSR1` kullanır, alt süreçte her iki izlemeyi de etkinleştirir ve sonraki `/healthz`, sonraki `/readyz`, kesinti süresi, hazır olma zamanlaması, CPU, RSS ve yeniden başlatma izleme ölçümlerini kaydeder.
- `/healthz` canlılık durumunu, `/readyz` kullanılabilirlik hazırlığını gösterir. İzleme satırlarını ve karşılaştırmalı ölçüm çıktısını tek bir zaman aralığı veya örnekten çıkarılan eksiksiz performans sonucu olarak değil, sorumlu bileşeni belirleme sinyali olarak değerlendirin.

## Çalışan bir Gateway'i sorgulama

Tüm sorgu komutları WebSocket RPC kullanır.

<Tabs>
  <Tab title="Çıktı modları">
    - Varsayılan: insanlar tarafından okunabilir (TTY'de renkli).
    - `--json`: makine tarafından okunabilir JSON (biçem/döndürücü yok).
    - `--no-color` (veya `NO_COLOR=1`): insan odaklı düzeni korurken ANSI'yi devre dışı bırakır.

  </Tab>
  <Tab title="Paylaşılan seçenekler">
    - `--url <url>`: Gateway WebSocket URL'si.
    - `--token <token>`: Gateway belirteci.
    - `--password <password>`: Gateway parolası.
    - `--timeout <ms>`: zaman aşımı/süre sınırı (varsayılan komuta göre değişir; aşağıdaki her komuta bakın).
    - `--expect-final`: "final" yanıtını bekler (ajan çağrıları).

  </Tab>
</Tabs>

<Note>
`--url` ayarladığınızda CLI, yapılandırma veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` seçeneğini açıkça iletin. Açık kimlik bilgilerinin eksik olması hatadır.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` bir canlılık yoklamasıdır: sunucu HTTP'ye yanıt verebilir duruma gelir gelmez sonuç döndürür. `/readyz` daha katıdır ve başlatma Plugin yardımcı süreçleri, kanallar veya yapılandırılmış hook'lar hâlâ hazır hâle gelirken kırmızı kalır. Yerel veya kimliği doğrulanmış ayrıntılı `/readyz` yanıtları bir `eventLoop` tanılama bloğu (gecikme, kullanım, CPU çekirdeği oranı, `degraded` bayrağı) içerir.

<ParamField path="--port <port>" type="number">
  Bu porttaki bir local loopback Gateway'i hedefleyin. Bu çağrı için `OPENCLAW_GATEWAY_URL` ve `OPENCLAW_GATEWAY_PORT` değerlerini geçersiz kılar.
</ParamField>

### `gateway usage-cost`

Oturum günlüklerinden kullanım-maliyet özetlerini alın.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Dâhil edilecek gün sayısı.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Özeti yapılandırılmış tek bir ajan kimliğiyle sınırlandırın.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Yapılandırılmış tüm ajanlar genelinde birleştirin. `--agent` ile birlikte kullanılamaz.
</ParamField>

### `gateway stability`

Çalışan bir Gateway'den yakın tarihli tanılama kararlılığı kaydedicisini alın.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Dâhil edilecek en fazla yakın tarihli olay sayısı (en fazla `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Tanılama olayı türüne göre filtreleyin; ör. `payload.large` veya `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Yalnızca bir tanılama sıra numarasından sonraki olayları dâhil edin.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Çalışan Gateway'i çağırmak yerine kalıcı bir kararlılık paketini okuyun. `--bundle latest` (veya yalnızca `--bundle`), durum dizini altındaki en yeni paketi seçer; doğrudan bir paket JSON yolu da iletebilirsiniz.
</ParamField>
<ParamField path="--export" type="boolean">
  Kararlılık ayrıntılarını yazdırmak yerine paylaşılabilir bir destek tanılama ZIP dosyası yazın.
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` için çıktı yolu.
</ParamField>

<AccordionGroup>
  <Accordion title="Gizlilik ve paket davranışı">
    - Kayıtlar operasyonel meta verileri tutar: olay adları, sayılar, bayt boyutları, bellek ölçümleri, kuyruk/oturum durumu, onay kimlikleri, kanal/Plugin adları ve hassas bilgileri ayıklanmış oturum özetleri. Sohbet metnini, Webhook gövdelerini, araç çıktılarını, ham istek/yanıt gövdelerini, belirteçleri, çerezleri, gizli değerleri, sunucu adlarını ve ham oturum kimliklerini hariç tutarlar. Kaydediciyi tamamen devre dışı bırakmak için `diagnostics.enabled: false` olarak ayarlayın.
    - Ölümcül Gateway çıkışları, kapatma zaman aşımları ve yeniden başlatma sırasındaki başlatma hataları, kaydedicide olaylar bulunduğunda aynı tanılama anlık görüntüsünü `~/.openclaw/logs/stability/openclaw-stability-*.json` konumuna yazar. En yeni paketi `openclaw gateway stability --bundle latest` ile inceleyin; `--limit`, `--type` ve `--since-seq` paket çıktısına da uygulanır.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Hata raporları için tasarlanmış yerel bir tanılama ZIP dosyası yazın. Gizlilik modeli ve paket içeriği için [Tanılama Dışa Aktarımı](/tr/gateway/diagnostics) bölümüne bakın.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Çıktı zip yolu. Varsayılan olarak durum dizini altında bir destek dışa aktarımı kullanılır.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Dahil edilecek en fazla arındırılmış günlük satırı sayısı.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  İncelenecek en fazla günlük baytı.
</ParamField>
<ParamField path="--url <url>" type="string">
  Sistem durumu anlık görüntüsü için Gateway WebSocket URL'si.
</ParamField>
<ParamField path="--token <token>" type="string">
  Sistem durumu anlık görüntüsü için Gateway belirteci.
</ParamField>
<ParamField path="--password <password>" type="string">
  Sistem durumu anlık görüntüsü için Gateway parolası.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Durum/sistem durumu anlık görüntüsü zaman aşımı.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Kalıcı kararlılık paketi aramasını atla.
</ParamField>
<ParamField path="--json" type="boolean">
  Yazılan yolu, boyutu ve manifesti JSON olarak yazdır.
</ParamField>

Dışa aktarım şu dosyaları paketler: `manifest.json` (dosya envanteri), `summary.md` (Markdown özeti), `diagnostics.json` (üst düzey yapılandırma/günlükler/keşif/kararlılık/durum/sistem durumu özeti), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` ve bir paket mevcut olduğunda `stability/latest.json`.

Paylaşılmak üzere tasarlanmıştır. Hata ayıklama için yararlı operasyonel ayrıntıları — güvenli günlük alanları, alt sistem adları, durum kodları, süreler, yapılandırılmış modlar, portlar, plugin/sağlayıcı kimlikleri, gizli olmayan özellik ayarları ve hassas bilgileri çıkarılmış operasyonel günlük iletileri — korur; sohbet metinlerini, webhook gövdelerini, araç çıktılarını, kimlik bilgilerini, çerezleri, hesap/ileti tanımlayıcılarını, istem/yönerge metinlerini, ana makine adlarını ve gizli değerleri ise atlar veya hassas bilgilerini çıkarır. Bir günlük iletisi kullanıcı/sohbet/araç yükü metni gibi görünüyorsa (ör. "kullanıcı söyledi", "sohbet metni", "araç çıktısı", "webhook gövdesi"), dışa aktarım yalnızca bir iletinin atlandığı bilgisini ve bayt sayısını korur.

### `gateway status`

Gateway hizmetini (launchd/systemd/schtasks) ve isteğe bağlı bir bağlantı/kimlik doğrulama yoklamasını gösterir.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Açık bir yoklama hedefi ekle. Yapılandırılmış uzak hedef ve localhost yine de yoklanır.
</ParamField>
<ParamField path="--token <token>" type="string">
  Yoklama için belirteçle kimlik doğrulama.
</ParamField>
<ParamField path="--password <password>" type="string">
  Yoklama için parolayla kimlik doğrulama.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Yoklama zaman aşımı.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Bağlantı yoklamasını atla (yalnızca hizmet görünümü).
</ParamField>
<ParamField path="--deep" type="boolean">
  Sistem düzeyindeki hizmetleri de tara.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Bağlantı yoklamasını bir okuma yoklamasına yükselt ve başarısız olursa sıfırdan farklı bir kodla çık. `--no-probe` ile birlikte kullanılamaz.
</ParamField>

<AccordionGroup>
  <Accordion title="Durum semantiği">
    - Yerel CLI yapılandırması eksik veya geçersiz olduğunda bile tanılama amacıyla kullanılabilir durumda kalır.
    - Varsayılan çıktı hizmet durumunu, WebSocket bağlantısını ve el sıkışma sırasında görülebilen kimlik doğrulama yeteneğini kanıtlar; okuma/yazma/yönetici işlemlerini kanıtlamaz.
    - Yoklamalar, ilk cihaz kimlik doğrulaması için değişiklik yapmaz: mevcutsa önbelleğe alınmış bir cihaz belirtecini yeniden kullanır ancak yalnızca durumu denetlemek amacıyla yeni bir CLI cihaz kimliği veya salt okunur eşleştirme kaydı oluşturmaz.
    - Mümkün olduğunda yoklama kimlik doğrulaması için yapılandırılmış kimlik doğrulama SecretRef'lerini çözümler. Gerekli bir SecretRef çözümlenemezse bağlantı/kimlik doğrulama yoklaması başarısız olduğunda `--json`, `rpc.authWarning` değerini bildirir; `--token`/`--password` seçeneğini açıkça geçirin veya gizli bilginin kaynağını düzeltin. Yoklama başarılı olduğunda çözümlenmemiş kimlik doğrulama uyarıları gizlenir.
    - Çalışan Gateway bunu bildirdiğinde JSON çıktısı `gateway.version` değerini içerir; el sıkışma yoklaması sürüm meta verilerini sağlayamazsa `--require-rpc`, `status.runtimeVersion` RPC yüküne geri dönebilir.
    - Dinleyen bir hizmet yeterli olmadığında ve okuma kapsamlı RPC'nin de sağlıklı olması gerektiğinde betiklerde/otomasyonda `--require-rpc` kullanın.
    - `--deep`, ek launchd/systemd/schtasks kurulumlarını tarar; Gateway benzeri birden fazla hizmet bulunduğunda insan tarafından okunabilir çıktı temizleme ipuçlarını yazdırır (genellikle makine başına tek bir Gateway çalıştırın) ve ilgili olduğunda yakın tarihli bir gözetmen yeniden başlatma devrini bildirir.
    - `--deep` ayrıca plugin duyarlı modda (`pluginValidation: "full"`) yapılandırma doğrulaması çalıştırır ve plugin manifesti uyarılarını (ör. eksik kanal yapılandırma meta verileri) gösterir. Varsayılan `gateway status`, plugin doğrulamasını atlayan hızlı salt okunur yolu korur.
    - İnsan tarafından okunabilir çıktı, profil veya durum dizini sapmasını tanılamaya yardımcı olmak için çözümlenen dosya günlüğü yolunun yanı sıra CLI ile hizmet yapılandırma yollarını ve geçerliliklerini içerir.

  </Accordion>
  <Accordion title="Linux systemd kimlik doğrulaması sapması denetimleri">
    - Hizmet kimlik doğrulaması sapması denetimleri, birimden hem `Environment=` hem de `EnvironmentFile=` değerlerini okur (`%h`, tırnak içine alınmış yollar, birden fazla dosya ve isteğe bağlı `-` dosyaları dâhil).
    - Birleştirilmiş çalışma zamanı ortamını kullanarak `gateway.auth.token` SecretRef'lerini çözümler (önce hizmet komutu ortamı, ardından süreç ortamı yedeği).
    - Belirteçle kimlik doğrulama etkin biçimde aktif olmadığında belirteç sapması denetimleri yapılandırma belirtecinin çözümlenmesini atlar (`gateway.auth.mode` açıkça `password`/`none`/`trusted-proxy` olduğunda veya mod ayarlanmamışken parola kazanabiliyor ve hiçbir belirteç adayı kazanamıyorsa).

  </Accordion>
</AccordionGroup>

### `gateway probe`

"Her şeyin hatasını ayıkla" komutu. Her zaman şunları yoklar:

- yapılandırılmış uzak Gateway'inizi (ayarlanmışsa) ve
- **uzak hedef yapılandırılmış olsa bile** localhost'u (local loopback).

`--url` geçirilmesi, bu açık hedefi diğer ikisinin önüne ekler. İnsan tarafından okunabilir çıktı hedefleri `URL (açık)`, `Uzak (yapılandırılmış)` / `Uzak (yapılandırılmış, etkin değil)` ve `Local loopback` olarak etiketler.

<Note>
Birden fazla yoklama hedefine erişilebiliyorsa tümü yazdırılır. Bir SSH tüneli, TLS/proxy URL'si ve yapılandırılmış uzak URL, farklı aktarım portları kullansalar bile aynı Gateway'i gösterebilir; `multiple_gateways` yalnızca farklı veya kimliği belirsiz erişilebilir Gateway'ler için ayrılmıştır. Yalıtılmış profiller için (ör. bir kurtarma botu) birden fazla Gateway çalıştırılması desteklenir ancak çoğu kurulum tek bir Gateway çalıştırır.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Bu portu yerel local loopback yoklama hedefi ve SSH tüneli uzak portu için kullan. `--url` olmadan bu seçenek, yapılandırılmış Gateway ortam URL'si, ortam portu veya uzak hedefler yerine yalnızca yerel local loopback hedefini seçer.
</ParamField>

<AccordionGroup>
  <Accordion title="Yorumlama">
    - `Erişilebilir: evet`, en az bir hedefin WebSocket bağlantısını kabul ettiği anlamına gelir.
    - `Yetenek: salt-okunur|yazma-yetkili|yönetici-yetkili|eşleştirme-bekliyor|yalnızca-bağlantı`, erişilebilirlikten ayrı olarak yoklamanın kimlik doğrulama hakkında neyi kanıtlayabildiğini bildirir.
    - `Okuma yoklaması: başarılı`, okuma kapsamlı ayrıntı RPC çağrılarının (`health`/`status`/`system-presence`/`config.get`) da başarılı olduğu anlamına gelir.
    - `Okuma yoklaması: sınırlı - eksik kapsam: operator.read`, bağlantının başarılı olduğu ancak okuma kapsamlı RPC'nin sınırlı olduğu anlamına gelir. Tam başarısızlık değil, **düşük performanslı** erişilebilirlik olarak bildirilir.
    - `Bağlantı: başarılı` sonrasında `Okuma yoklaması: başarısız`, WebSocket'in bağlandığı ancak sonraki okuma tanılamalarının zaman aşımına uğradığı veya başarısız olduğu anlamına gelir; bu da erişilemez değil, **düşük performanslı** durumdur.
    - `gateway status` gibi yoklama da önbelleğe alınmış mevcut cihaz kimlik doğrulamasını yeniden kullanır ancak ilk cihaz kimliğini veya eşleştirme durumunu oluşturmaz.
    - Çıkış kodu yalnızca yoklanan hedeflerin hiçbirine erişilemediğinde sıfırdan farklıdır.

  </Accordion>
  <Accordion title="JSON çıktısı">
    Üst düzey:

    - `ok`: en az bir hedef erişilebilir.
    - `degraded`: en az bir hedef bağlantıyı kabul etti ancak tam ayrıntılı RPC tanılamasını tamamlamadı.
    - `capability`: erişilebilir hedeflerde görülen en iyi yetenek (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` veya `unknown`).
    - `primaryTargetId`: etkin kazanan olarak ele alınacak en iyi hedef; sırasıyla açık URL, SSH tüneli, yapılandırılmış uzak hedef, yerel local loopback.
    - `warnings[]`: `code`, `message` ve isteğe bağlı `targetIds` içeren, mümkün olan en iyi şekilde oluşturulmuş uyarı kayıtları.
    - `network`: geçerli yapılandırmadan ve ana makine ağından türetilen yerel local loopback/tailnet URL ipuçları.
    - `discovery.timeoutMs` / `discovery.count`: bu yoklama geçişi için kullanılan gerçek keşif bütçesi/sonuç sayısı.

    Hedef başına (`targets[].connect`): `ok` (erişilebilirlik + düşük performanslı sınıflandırması), `rpcOk` (tam ayrıntılı RPC başarısı), `scopeLimited` (ayrıntı RPC'si eksik operatör kapsamında başarısız oldu).

    Hedef başına (`targets[].auth`): kullanılabilir olduğunda `hello-ok` içinde bildirilen `role` ve `scopes` ile gösterilen `capability` sınıflandırması.

  </Accordion>
  <Accordion title="Yaygın uyarı kodları">
    - `ssh_tunnel_failed`: SSH tüneli kurulumu başarısız oldu; komut doğrudan yoklamalara geri döndü.
    - `multiple_gateways`: farklı Gateway kimliklerine erişilebildi veya OpenClaw erişilebilir hedeflerin aynı Gateway olduğunu kanıtlayamadı. Aynı Gateway'e yönelik bir SSH tüneli, proxy URL'si veya yapılandırılmış uzak URL bunu tetiklemez.
    - `auth_secretref_unresolved`: başarısız bir hedef için yapılandırılmış kimlik doğrulama SecretRef'i çözümlenemedi.
    - `probe_scope_limited`: WebSocket bağlantısı başarılı oldu ancak eksik `operator.read` nedeniyle okuma yoklaması sınırlı kaldı.
    - `local_tls_runtime_unavailable`: yerel Gateway TLS etkin ancak OpenClaw yerel sertifika parmak izini yükleyemedi.

  </Accordion>
</AccordionGroup>

#### SSH üzerinden uzak bağlantı (Mac uygulamasıyla eşdeğerlik)

macOS uygulamasının "Remote over SSH" modu, yalnızca local loopback üzerinden erişilebilen uzak bir Gateway'i `ws://127.0.0.1:<port>` adresinden erişilebilir kılmak için yerel port yönlendirmesi kullanır.

CLI eşdeğeri:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` veya `user@host:port` (portun varsayılanı `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Kimlik dosyası.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Çözümlenmiş keşif uç noktasından (`local.` ve varsa yapılandırılmış geniş alan etki alanı) keşfedilen ilk Gateway ana makinesini SSH hedefi olarak seç. Yalnızca TXT içeren ipuçları yok sayılır.
</ParamField>

Yapılandırma varsayılanları (isteğe bağlı): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`.

### `gateway call <method>`

Düşük düzeyli RPC yardımcısı.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Parametreler için JSON nesnesi dizesi.
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway WebSocket URL'si.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway belirteci.
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway parolası.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Zaman aşımı bütçesi.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Temel olarak nihai yükten önce ara olayları akışla ileten aracı tarzı RPC'ler içindir.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir JSON çıktısı.
</ParamField>

<Note>
`--params` geçerli JSON olmalıdır ve her yöntem kendi parametre biçimini doğrular (fazladan/yanlış adlandırılmış alanlar reddedilir).
</Note>

## Gateway hizmetini yönetme

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Bir sarmalayıcıyla kurulum

Yönetilen hizmetin başka bir çalıştırılabilir dosya üzerinden başlaması gerektiğinde, örneğin bir gizli bilgi yöneticisi uyarlayıcısı veya farklı kullanıcıyla çalıştırma yardımcısı kullanırken `--wrapper` seçeneğini kullanın. Sarmalayıcı normal Gateway bağımsız değişkenlerini alır ve sonunda bu bağımsız değişkenlerle `openclaw` ya da Node'u `exec` aracılığıyla çalıştırmaktan sorumludur.

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

Sarmalayıcıyı ortam üzerinden de ayarlayabilirsiniz. `gateway install`, yolun çalıştırılabilir bir dosya olduğunu doğrular, sarmalayıcıyı hizmetin `ProgramArguments` alanına yazar ve daha sonraki zorunlu yeniden kurulumlar, güncellemeler ve doctor onarımları için `OPENCLAW_WRAPPER` değerini hizmet ortamında kalıcı hâle getirir.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Kalıcı bir sarmalayıcıyı kaldırmak için yeniden kurulum sırasında `OPENCLAW_WRAPPER` değerini temizleyin:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Komut seçenekleri">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>` (varsayılan: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Yaşam döngüsü davranışı">
    - Yönetilen bir hizmeti yeniden başlatmak için `gateway restart` kullanın. Yeniden başlatma yerine `gateway stop` ve `gateway start` komutlarını zincirlemeyin.
    - macOS'te `gateway stop`, varsayılan olarak `launchctl bootout` kullanır; bu komut kalıcı bir devre dışı bırakma uygulamadan LaunchAgent'ı geçerli önyükleme oturumundan kaldırır. Böylece KeepAlive otomatik kurtarması gelecekteki çökmeler için etkin kalır ve `gateway start`, elle `launchctl enable` çalıştırılması gerekmeden hizmeti sorunsuzca yeniden etkinleştirir. Gateway'in bir sonraki açık `gateway start` komutuna kadar yeniden başlatılmaması için KeepAlive ve RunAtLoad'u kalıcı olarak engellemek üzere `--disable` iletin; elle durdurmanın yeniden başlatmalar sonrasında da korunması gerektiğinde bunu kullanın.
    - Yaşam döngüsü komutları, betiklerde kullanım için `--json` kabul eder.

  </Accordion>
  <Accordion title="Kurulum sırasında kimlik doğrulama ve SecretRef'ler">
    - Belirteçle kimlik doğrulama bir belirteç gerektirdiğinde ve `gateway.auth.token` SecretRef tarafından yönetildiğinde, `gateway install` SecretRef'in çözümlenebilir olduğunu doğrular ancak çözümlenen belirteci hizmet ortamı meta verilerinde kalıcı hâle getirmez.
    - Belirteçle kimlik doğrulama bir belirteç gerektiriyorsa ve yapılandırılmış belirteç SecretRef'i çözümlenemiyorsa kurulum, yedek düz metni kalıcı hâle getirmek yerine güvenli biçimde başarısız olur.
    - `gateway run` üzerinde parolayla kimlik doğrulama için satır içi `--password` yerine `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` veya SecretRef destekli `gateway.auth.password` tercih edin.
    - Çıkarımlı kimlik doğrulama modunda yalnızca kabukta bulunan `OPENCLAW_GATEWAY_PASSWORD`, kurulumun belirteç gereksinimlerini gevşetmez; yönetilen bir hizmet kurarken kalıcı yapılandırma (`gateway.auth.password` veya yapılandırmadaki `env`) kullanın.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa mod açıkça ayarlanana kadar kurulum engellenir.

  </Accordion>
</AccordionGroup>

## Gateway'leri keşfetme (Bonjour)

`gateway discover`, Gateway işaretlerini (`_openclaw-gw._tcp`) tarar.

- Çok noktaya yayın DNS-SD: `local.`
- Tek noktaya yayın DNS-SD (geniş alan Bonjour): bir etki alanı seçin (örnek: `openclaw.internal.`) ve bölünmüş DNS ile bir DNS sunucusu kurun; bkz. [Bonjour](/tr/gateway/bonjour).

Yalnızca Bonjour keşfi etkinleştirilmiş (varsayılan) Gateway'ler işareti yayınlar.

Her işaretteki TXT ipuçları: `role` (Gateway rolü ipucu), `transport` (taşıma ipucu, ör. `gateway`), `gatewayPort` (WebSocket bağlantı noktası, genellikle `18789`), `tailnetDns` (varsa MagicDNS ana bilgisayar adı), `gatewayTls` / `gatewayTlsSha256` (TLS etkinliği + sertifika parmak izi). `sshPort` ve `cliPath` yalnızca tam keşif modunda yayınlanır (`discovery.mdns.mode: "full"`; varsayılan değer `"minimal"` olup bunları dışarıda bırakır; bu durumda istemciler SSH hedefleri için varsayılan olarak `22` numaralı bağlantı noktasını kullanır).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Komut başına zaman aşımı (tarama/çözümleme).
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir çıktı (biçimlendirmeyi/döner göstergeyi de devre dışı bırakır).
</ParamField>

Örnekler:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- `local.` ile birlikte, etkinleştirilmişse yapılandırılmış geniş alan etki alanını tarar.
- JSON çıktısındaki `wsUrl`, `lanHost` veya `tailnetDns` gibi yalnızca TXT ipuçlarından değil, çözümlenen hizmet uç noktasından türetilir.
- `discovery.mdns.mode`, hem `local.` mDNS'de hem de geniş alan DNS-SD'de `sshPort`/`cliPath` yayınını denetler (yukarıya bakın).

</Note>

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway işletim kılavuzu](/tr/gateway)
