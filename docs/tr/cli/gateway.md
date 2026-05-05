---
read_when:
    - Gateway'i CLI'den çalıştırma (geliştirme veya sunucular)
    - Gateway kimlik doğrulaması, bağlama modları ve bağlantıda hata ayıklama
    - Bonjour aracılığıyla Gateway'leri keşfetme (yerel + geniş alan DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateway'leri çalıştırın, sorgulayın ve keşfedin
title: Gateway
x-i18n:
    generated_at: "2026-05-05T08:25:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89f798724971151cdd297fcdbbc1fe79dedc19f57521f2ad2c1fff0f9acf9b24
    source_path: cli/gateway.md
    workflow: 16
---

Gateway, OpenClaw'ın WebSocket sunucusudur (kanallar, düğümler, oturumlar, hook'lar). Bu sayfadaki alt komutlar `openclaw gateway …` altında yer alır.

<CardGroup cols={3}>
  <Card title="Bonjour keşfi" href="/tr/gateway/bonjour">
    Yerel mDNS + geniş alan DNS-SD kurulumu.
  </Card>
  <Card title="Keşfe genel bakış" href="/tr/gateway/discovery">
    OpenClaw'ın gateway'leri nasıl duyurduğu ve bulduğu.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration">
    Üst düzey gateway yapılandırma anahtarları.
  </Card>
</CardGroup>

## Gateway'i çalıştırma

Yerel bir Gateway süreci çalıştırın:

```bash
openclaw gateway
```

Ön planda çalıştırma takma adı:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Başlatma davranışı">
    - Varsayılan olarak Gateway, `~/.openclaw/openclaw.json` içinde `gateway.mode=local` ayarlanmadığı sürece başlamayı reddeder. Geçici/geliştirme çalıştırmaları için `--allow-unconfigured` kullanın.
    - `openclaw onboard --mode local` ve `openclaw setup` komutlarının `gateway.mode=local` yazması beklenir. Dosya varsa ancak `gateway.mode` eksikse, bunu bozuk veya üzerine yazılmış bir yapılandırma olarak değerlendirin ve yerel modu örtük olarak varsaymak yerine onarın.
    - Dosya varsa ve `gateway.mode` eksikse, Gateway bunu şüpheli yapılandırma hasarı olarak değerlendirir ve sizin için "local tahmini" yapmayı reddeder.
    - Kimlik doğrulama olmadan loopback dışına bağlanma engellenir (güvenlik koruması).
    - `SIGUSR1`, yetkilendirildiğinde süreç içinde yeniden başlatmayı tetikler (`commands.restart` varsayılan olarak etkindir; manuel yeniden başlatmayı engellemek için `commands.restart: false` ayarlayın, gateway aracı/yapılandırma uygulama/güncelleme ise izinli kalır).
    - `SIGINT`/`SIGTERM` işleyicileri gateway sürecini durdurur, ancak özel terminal durumlarını geri yüklemez. CLI'ı bir TUI veya raw-mode girdisiyle sarmalarsanız, çıkmadan önce terminali geri yükleyin.

  </Accordion>
</AccordionGroup>

### Seçenekler

<ParamField path="--port <port>" type="number">
  WebSocket bağlantı noktası (varsayılan yapılandırmadan/env'den gelir; genellikle `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Dinleyici bağlama modu.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Kimlik doğrulama modu geçersiz kılması.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token geçersiz kılması (süreç için `OPENCLAW_GATEWAY_TOKEN` değerini de ayarlar).
</ParamField>
<ParamField path="--password <password>" type="string">
  Parola geçersiz kılması.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Gateway parolasını bir dosyadan okuyun.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Gateway'i Tailscale üzerinden kullanıma açın.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Kapanışta Tailscale serve/funnel yapılandırmasını sıfırlayın.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Yapılandırmada `gateway.mode=local` olmadan gateway başlatmaya izin verin. Başlatma korumasını yalnızca geçici/geliştirme bootstrap için atlar; yapılandırma dosyasını yazmaz veya onarmaz.
</ParamField>
<ParamField path="--dev" type="boolean">
  Eksikse bir geliştirme yapılandırması + çalışma alanı oluşturun (`BOOTSTRAP.md` atlanır).
</ParamField>
<ParamField path="--reset" type="boolean">
  Geliştirme yapılandırmasını + kimlik bilgilerini + oturumları + çalışma alanını sıfırlayın (`--dev` gerektirir).
</ParamField>
<ParamField path="--force" type="boolean">
  Başlatmadan önce seçili bağlantı noktasındaki mevcut dinleyicileri sonlandırın.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Ayrıntılı günlükler.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Konsolda yalnızca CLI arka uç günlüklerini göster (ve stdout/stderr'ı etkinleştir).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  WebSocket günlük stili.
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact` için takma ad.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Ham model akışı olaylarını jsonl'ye günlüğe kaydet.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ham akış jsonl yolu.
</ParamField>

## Gateway'i yeniden başlatma

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe`, çalışan Gateway'den yeniden başlatmadan önce etkin OpenClaw işlerini ön denetimden geçirmesini ister. Kuyruğa alınmış işlemler, yanıt teslimi, gömülü çalıştırmalar veya görev çalıştırmaları etkinse Gateway engelleyicileri bildirir, yinelenen güvenli yeniden başlatma isteklerini birleştirir ve etkin işler boşaldığında yeniden başlatır. Düz `restart`, uyumluluk için mevcut hizmet yöneticisi davranışını korur. `--force` seçeneğini yalnızca açıkça anında geçersiz kılma yolunu istediğinizde kullanın.

<Warning>
Satır içi `--password`, yerel süreç listelerinde açığa çıkabilir. `--password-file`, env veya SecretRef destekli `gateway.auth.password` tercih edin.
</Warning>

### Başlatma profillemesi

- Gateway başlatması sırasında faz zamanlamalarını günlüğe kaydetmek için `OPENCLAW_GATEWAY_STARTUP_TRACE=1` ayarlayın; buna faz başına `eventLoopMax` gecikmesi ve installed-index, manifest kayıt defteri, başlatma planlaması ve owner-map işi için Plugin arama tablosu zamanlamaları dahildir.
- Harici QA koşumları için en iyi çabayla oluşturulan JSONL başlatma tanılama zaman çizelgesini yazmak üzere `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` ile `OPENCLAW_DIAGNOSTICS=timeline` ayarlayın. Bayrağı yapılandırmada `diagnostics.flags: ["timeline"]` ile de etkinleştirebilirsiniz; yol yine env tarafından sağlanır. Olay döngüsü örneklerini dahil etmek için `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` ekleyin.
- Gateway başlatmasını benchmark etmek için `pnpm test:startup:gateway -- --runs 5 --warmup 1` çalıştırın. Benchmark ilk süreç çıktısını, `/healthz`, `/readyz`, başlatma izleme zamanlamalarını, olay döngüsü gecikmesini ve Plugin arama tablosu zamanlama ayrıntılarını kaydeder.

## Çalışan bir Gateway'i sorgulama

Tüm sorgu komutları WebSocket RPC kullanır.

<Tabs>
  <Tab title="Çıktı modları">
    - Varsayılan: insan tarafından okunabilir (TTY'de renkli).
    - `--json`: makine tarafından okunabilir JSON (stil/spinner yok).
    - `--no-color` (veya `NO_COLOR=1`): insan düzenini korurken ANSI'yi devre dışı bırakır.

  </Tab>
  <Tab title="Paylaşılan seçenekler">
    - `--url <url>`: Gateway WebSocket URL'si.
    - `--token <token>`: Gateway token'ı.
    - `--password <password>`: Gateway parolası.
    - `--timeout <ms>`: zaman aşımı/bütçe (komuta göre değişir).
    - `--expect-final`: bir "final" yanıtı bekle (agent çağrıları).

  </Tab>
</Tabs>

<Note>
`--url` ayarladığınızda CLI, yapılandırma veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` değerini açıkça iletin. Eksik açık kimlik bilgileri bir hatadır.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` uç noktası bir canlılık denetimidir: sunucu HTTP'ye yanıt verebildiğinde döner. HTTP `/readyz` uç noktası daha katıdır ve başlatma Plugin sidecar'ları, kanallar veya yapılandırılmış hook'lar hâlâ yerleşirken kırmızı kalır. Yerel veya kimliği doğrulanmış ayrıntılı hazır olma yanıtları, olay döngüsü gecikmesi, olay döngüsü kullanımı, CPU çekirdek oranı ve `degraded` bayrağı içeren bir `eventLoop` tanılama bloğu içerir.

### `gateway usage-cost`

Oturum günlüklerinden kullanım maliyeti özetlerini getirin.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Dahil edilecek gün sayısı.
</ParamField>

### `gateway stability`

Çalışan bir Gateway'den son tanılama kararlılığı kaydedicisini getirin.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Dahil edilecek en fazla son olay sayısı (maks. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  `payload.large` veya `diagnostic.memory.pressure` gibi tanılama olay türüne göre filtreleyin.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Yalnızca bir tanılama sıra numarasından sonraki olayları dahil edin.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Çalışan Gateway'i çağırmak yerine kalıcı bir kararlılık bundle'ı okuyun. Durum dizini altındaki en yeni bundle için `--bundle latest` (veya yalnızca `--bundle`) kullanın ya da doğrudan bir bundle JSON yolu iletin.
</ParamField>
<ParamField path="--export" type="boolean">
  Kararlılık ayrıntılarını yazdırmak yerine paylaşılabilir bir destek tanılama zip dosyası yazın.
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` için çıktı yolu.
</ParamField>

<AccordionGroup>
  <Accordion title="Gizlilik ve bundle davranışı">
    - Kayıtlar operasyonel meta verileri tutar: olay adları, sayımlar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/Plugin adları ve redakte edilmiş oturum özetleri. Sohbet metni, webhook gövdeleri, araç çıktıları, ham istek veya yanıt gövdeleri, token'lar, çerezler, gizli değerler, ana makine adları veya ham oturum kimliklerini tutmazlar. Kaydediciyi tamamen devre dışı bırakmak için `diagnostics.enabled: false` ayarlayın.
    - Ölümcül Gateway çıkışlarında, kapanış zaman aşımlarında ve yeniden başlatma başlatma hatalarında, kaydedicide olaylar varsa OpenClaw aynı tanılama anlık görüntüsünü `~/.openclaw/logs/stability/openclaw-stability-*.json` konumuna yazar. En yeni bundle'ı `openclaw gateway stability --bundle latest` ile inceleyin; `--limit`, `--type` ve `--since-seq` de bundle çıktısına uygulanır.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Hata raporlarına eklenmek üzere tasarlanmış yerel bir tanılama zip dosyası yazın. Gizlilik modeli ve bundle içerikleri için bkz. [Tanılama Dışa Aktarma](/tr/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Çıktı zip yolu. Varsayılan olarak durum dizini altında bir destek dışa aktarımıdır.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Dahil edilecek en fazla temizlenmiş günlük satırı.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  İncelenecek en fazla günlük baytı.
</ParamField>
<ParamField path="--url <url>" type="string">
  Sağlık anlık görüntüsü için Gateway WebSocket URL'si.
</ParamField>
<ParamField path="--token <token>" type="string">
  Sağlık anlık görüntüsü için Gateway token'ı.
</ParamField>
<ParamField path="--password <password>" type="string">
  Sağlık anlık görüntüsü için Gateway parolası.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Durum/sağlık anlık görüntüsü zaman aşımı.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Kalıcı kararlılık bundle'ı aramasını atla.
</ParamField>
<ParamField path="--json" type="boolean">
  Yazılan yolu, boyutu ve manifesti JSON olarak yazdır.
</ParamField>

Dışa aktarım bir manifest, Markdown özeti, yapılandırma şekli, temizlenmiş yapılandırma ayrıntıları, temizlenmiş günlük özetleri, temizlenmiş Gateway durum/sağlık anlık görüntüleri ve varsa en yeni kararlılık bundle'ını içerir.

Paylaşılması amaçlanır. Hata ayıklamaya yardımcı olan operasyonel ayrıntıları tutar; örneğin güvenli OpenClaw günlük alanları, alt sistem adları, durum kodları, süreler, yapılandırılmış modlar, bağlantı noktaları, Plugin kimlikleri, sağlayıcı kimlikleri, gizli olmayan özellik ayarları ve redakte edilmiş operasyonel günlük iletileri. Sohbet metni, webhook gövdeleri, araç çıktıları, kimlik bilgileri, çerezler, hesap/ileti tanımlayıcıları, prompt/talimat metni, ana makine adları ve gizli değerleri atlar veya redakte eder. LogTape tarzı bir ileti kullanıcı/sohbet/araç payload metni gibi göründüğünde, dışa aktarım yalnızca iletinin atlandığını ve bayt sayısını tutar.

### `gateway status`

`gateway status`, Gateway hizmetini (launchd/systemd/schtasks) ve bağlantı/kimlik doğrulama yeteneğine yönelik isteğe bağlı bir yoklamayı gösterir.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Açık bir yoklama hedefi ekleyin. Yapılandırılmış uzak + localhost yine de yoklanır.
</ParamField>
<ParamField path="--token <token>" type="string">
  Yoklama için belirteç kimlik doğrulaması.
</ParamField>
<ParamField path="--password <password>" type="string">
  Yoklama için parola kimlik doğrulaması.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Yoklama zaman aşımı.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Bağlantı yoklamasını atlayın (yalnızca hizmet görünümü).
</ParamField>
<ParamField path="--deep" type="boolean">
  Sistem düzeyi hizmetleri de tarayın.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Varsayılan bağlantı yoklamasını bir okuma yoklamasına yükseltin ve bu okuma yoklaması başarısız olduğunda sıfır olmayan kodla çıkın. `--no-probe` ile birlikte kullanılamaz.
</ParamField>

<AccordionGroup>
  <Accordion title="Durum semantiği">
    - `gateway status`, yerel CLI yapılandırması eksik veya geçersiz olsa bile tanılama için kullanılabilir kalır.
    - Varsayılan `gateway status`, hizmet durumunu, WebSocket bağlantısını ve el sıkışma sırasında görünür olan kimlik doğrulama yeteneğini kanıtlar. Okuma/yazma/yönetici işlemlerini kanıtlamaz.
    - Tanılama yoklamaları, ilk kez cihaz kimlik doğrulaması için değişiklik yapmaz: varsa mevcut önbelleğe alınmış cihaz belirtecini yeniden kullanırlar, ancak yalnızca durumu denetlemek için yeni bir CLI cihaz kimliği veya salt okunur cihaz eşleştirme kaydı oluşturmazlar.
    - `gateway status`, mümkün olduğunda yoklama kimlik doğrulaması için yapılandırılmış kimlik doğrulama SecretRefs'lerini çözer.
    - Bu komut yolunda gerekli bir kimlik doğrulama SecretRef'i çözümlenmemişse, yoklama bağlantısı/kimlik doğrulaması başarısız olduğunda `gateway status --json` `rpc.authWarning` bildirir; açıkça `--token`/`--password` iletin veya önce gizli bilgi kaynağını çözün.
    - Yoklama başarılı olursa, yanlış pozitifleri önlemek için çözümlenmemiş kimlik doğrulama başvurusu uyarıları bastırılır.
    - Dinleyen bir hizmet yeterli olmadığında ve okuma kapsamlı RPC çağrılarının da sağlıklı olması gerektiğinde betiklerde ve otomasyonda `--require-rpc` kullanın.
    - `--deep`, ek launchd/systemd/schtasks kurulumları için en iyi çabayla tarama ekler. Birden fazla Gateway benzeri hizmet algılandığında, insan tarafından okunabilir çıktı temizleme ipuçları yazdırır ve çoğu kurulumun makine başına bir Gateway çalıştırması gerektiği konusunda uyarır.
    - `--deep`, hizmet süreci harici bir supervisor yeniden başlatması için temiz şekilde çıktığında yakın zamandaki bir Gateway supervisor yeniden başlatma devrini de bildirir.
    - İnsan tarafından okunabilir çıktı, profil veya durum dizini kaymasını tanılamaya yardımcı olmak için çözümlenmiş dosya günlük yolunu ve CLI ile hizmet yapılandırma yolları/geçerlilik anlık görüntüsünü içerir.

  </Accordion>
  <Accordion title="Linux systemd kimlik doğrulama sapması denetimleri">
    - Linux systemd kurulumlarında, hizmet kimlik doğrulama sapması denetimleri birimden hem `Environment=` hem de `EnvironmentFile=` değerlerini okur (`%h`, tırnak içindeki yollar, birden fazla dosya ve isteğe bağlı `-` dosyaları dahil).
    - Sapma denetimleri, birleştirilmiş çalışma zamanı ortamını kullanarak `gateway.auth.token` SecretRefs'lerini çözer (önce hizmet komutu ortamı, ardından süreç ortamı yedeği).
    - Belirteç kimlik doğrulaması etkin şekilde aktif değilse (açık `gateway.auth.mode` değeri `password`/`none`/`trusted-proxy` ise veya mod ayarlanmamışken parola kazanabiliyor ve hiçbir belirteç adayı kazanamıyorsa), belirteç sapması denetimleri yapılandırma belirtecini çözmeyi atlar.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe`, "her şeyde hata ayıkla" komutudur. Her zaman şunları yoklar:

- yapılandırılmış uzak gateway'iniz (ayarlanmışsa) ve
- uzak yapılandırılmış olsa bile localhost (loopback).

`--url` iletirseniz, bu açık hedef her ikisinin de önüne eklenir. İnsan tarafından okunabilir çıktı hedefleri şu şekilde etiketler:

- `URL (explicit)`
- `Remote (configured)` veya `Remote (configured, inactive)`
- `Local loopback`

<Note>
Birden fazla gateway erişilebilir durumdaysa hepsini yazdırır. Yalıtılmış profiller/bağlantı noktaları (ör. kurtarma botu) kullandığınızda birden fazla gateway desteklenir, ancak çoğu kurulum yine de tek bir gateway çalıştırır.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Yorumlama">
    - `Reachable: yes`, en az bir hedefin WebSocket bağlantısını kabul ettiği anlamına gelir.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only`, yoklamanın kimlik doğrulama hakkında neyi kanıtlayabildiğini bildirir. Bu, erişilebilirlikten ayrıdır.
    - `Read probe: ok`, okuma kapsamlı ayrıntı RPC çağrılarının (`health`/`status`/`system-presence`/`config.get`) da başarılı olduğu anlamına gelir.
    - `Read probe: limited - missing scope: operator.read`, bağlantının başarılı olduğu ancak okuma kapsamlı RPC'nin sınırlı olduğu anlamına gelir. Bu, tam hata değil **bozulmuş** erişilebilirlik olarak bildirilir.
    - `Connect: ok` sonrasında `Read probe: failed`, Gateway'in WebSocket bağlantısını kabul ettiği, ancak takip eden okuma tanılamalarının zaman aşımına uğradığı veya başarısız olduğu anlamına gelir. Bu da erişilemeyen bir Gateway değil, **bozulmuş** erişilebilirliktir.
    - `gateway status` gibi, probe mevcut önbelleğe alınmış cihaz kimlik doğrulamasını yeniden kullanır ancak ilk kez cihaz kimliği veya eşleştirme durumu oluşturmaz.
    - Çıkış kodu yalnızca yoklanan hiçbir hedef erişilebilir değilse sıfır olmayan değerdir.

  </Accordion>
  <Accordion title="JSON çıktısı">
    Üst düzey:

    - `ok`: en az bir hedef erişilebilir.
    - `degraded`: en az bir hedef bağlantı kabul etti ancak tam ayrıntılı RPC tanılamalarını tamamlamadı.
    - `capability`: erişilebilir hedefler arasında görülen en iyi yetenek (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` veya `unknown`).
    - `primaryTargetId`: etkin kazanan olarak ele alınacak en iyi hedef, şu sırayla: açık URL, SSH tüneli, yapılandırılmış uzak, ardından local loopback.
    - `warnings[]`: `code`, `message` ve isteğe bağlı `targetIds` içeren en iyi çabayla uyarı kayıtları.
    - `network`: geçerli yapılandırma ve ana makine ağından türetilen local loopback/tailnet URL ipuçları.
    - `discovery.timeoutMs` ve `discovery.count`: bu yoklama geçişi için kullanılan gerçek keşif bütçesi/sonuç sayısı.

    Hedef başına (`targets[].connect`):

    - `ok`: bağlantı + bozulmuş sınıflandırma sonrasında erişilebilirlik.
    - `rpcOk`: tam ayrıntılı RPC başarısı.
    - `scopeLimited`: eksik operator kapsamı nedeniyle ayrıntı RPC başarısız oldu.

    Hedef başına (`targets[].auth`):

    - `role`: mevcut olduğunda `hello-ok` içinde bildirilen kimlik doğrulama rolü.
    - `scopes`: mevcut olduğunda `hello-ok` içinde bildirilen verilmiş kapsamlar.
    - `capability`: ilgili hedef için yüzeye çıkarılan kimlik doğrulama yeteneği sınıflandırması.

  </Accordion>
  <Accordion title="Yaygın uyarı kodları">
    - `ssh_tunnel_failed`: SSH tüneli kurulumu başarısız oldu; komut doğrudan yoklamalara geri döndü.
    - `multiple_gateways`: birden fazla hedef erişilebilirdi; kurtarma botu gibi yalıtılmış profilleri bilerek çalıştırmadığınız sürece bu olağan değildir.
    - `auth_secretref_unresolved`: yapılandırılmış bir kimlik doğrulama SecretRef'i başarısız bir hedef için çözümlenemedi.
    - `probe_scope_limited`: WebSocket bağlantısı başarılı oldu, ancak okuma yoklaması eksik `operator.read` nedeniyle sınırlıydı.

  </Accordion>
</AccordionGroup>

#### SSH üzerinden uzak (Mac uygulaması eşliği)

macOS uygulamasının "SSH üzerinden uzak" modu, uzak gateway'in (yalnızca loopback'e bağlanmış olabilir) `ws://127.0.0.1:<port>` adresinde erişilebilir olmasını sağlamak için yerel bağlantı noktası yönlendirmesi kullanır.

CLI eşdeğeri:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` veya `user@host:port` (bağlantı noktası varsayılan olarak `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Kimlik dosyası.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Çözümlenmiş keşif uç noktasından (`local.` artı varsa yapılandırılmış geniş alan etki alanı) ilk keşfedilen gateway ana makinesini SSH hedefi olarak seçin. Yalnızca TXT ipuçları yok sayılır.
</ParamField>

Yapılandırma (isteğe bağlı, varsayılan olarak kullanılır):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Düşük düzey RPC yardımcısı.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Parametreler için JSON nesne dizesi.
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
<ParamField path="--timeout <ms>" type="number">
  Zaman aşımı bütçesi.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Esas olarak son yükten önce ara olaylar akışı yapan agent tarzı RPC'ler içindir.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir JSON çıktısı.
</ParamField>

<Note>
`--params` geçerli JSON olmalıdır.
</Note>

## Gateway hizmetini yönetin

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Sarmalayıcıyla yükleyin

Yönetilen hizmetin başka bir yürütülebilir dosya üzerinden başlaması gerekiyorsa `--wrapper` kullanın; örneğin bir
gizli bilgi yöneticisi ara katmanı veya farklı kullanıcıyla çalıştırma yardımcısı. Sarmalayıcı normal Gateway argümanlarını alır ve
sonunda bu argümanlarla `openclaw` veya Node'u exec etmekten sorumludur.

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

Sarmalayıcıyı ortam üzerinden de ayarlayabilirsiniz. `gateway install`, yolun
yürütülebilir bir dosya olduğunu doğrular, sarmalayıcıyı hizmet `ProgramArguments` içine yazar ve daha sonraki zorunlu yeniden kurulumlar, güncellemeler ve doctor
onarımları için hizmet ortamında `OPENCLAW_WRAPPER` değerini kalıcı hale getirir.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Kalıcı bir sarmalayıcıyı kaldırmak için yeniden kurarken `OPENCLAW_WRAPPER` değerini temizleyin:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Komut seçenekleri">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Yaşam döngüsü davranışı">
    - Yönetilen bir hizmeti yeniden başlatmak için `gateway restart` kullanın. Yeniden başlatma yerine `gateway stop` ve `gateway start` komutlarını zincirlemeyin; macOS'te `gateway stop`, durdurmadan önce LaunchAgent'ı bilerek devre dışı bırakır.
    - `gateway restart --safe`, çalışan Gateway'den etkin OpenClaw işlerini ön denetimden geçirmesini ve yanıt teslimi, gömülü çalıştırmalar ve görev çalıştırmaları boşalana kadar yeniden başlatmayı ertelemesini ister. `--safe`, `--force` veya `--wait` ile birlikte kullanılamaz.
    - `gateway restart --wait 30s`, bu yeniden başlatma için yapılandırılmış yeniden başlatma boşaltma bütçesini geçersiz kılar. Birimsiz sayılar milisaniyedir; `s`, `m` ve `h` gibi birimler kabul edilir. `--wait 0` süresiz bekler.
    - `gateway restart --force`, etkin iş boşaltmasını atlar ve hemen yeniden başlatır. Bir operator listelenen görev engelleyicilerini zaten incelemiş ve gateway'i hemen geri istiyorsa bunu kullanın.
    - Yaşam döngüsü komutları betikleme için `--json` kabul eder.

  </Accordion>
  <Accordion title="Kurulum zamanında kimlik doğrulama ve SecretRefs">
    - Belirteç kimlik doğrulaması bir belirteç gerektirdiğinde ve `gateway.auth.token` SecretRef tarafından yönetildiğinde, `gateway install` SecretRef'in çözümlenebilir olduğunu doğrular ancak çözümlenen belirteci hizmet ortamı meta verilerine kalıcı olarak yazmaz.
    - Belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve yapılandırılmış belirteç SecretRef'i çözümlenemiyorsa, kurulum yedek düz metni kalıcı olarak yazmak yerine güvenli kapalı şekilde başarısız olur.
    - `gateway run` üzerinde parola kimlik doğrulaması için satır içi `--password` yerine `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` veya SecretRef destekli `gateway.auth.password` tercih edin.
    - Çıkarımlı kimlik doğrulama modunda, yalnızca kabuktaki `OPENCLAW_GATEWAY_PASSWORD` kurulum belirteci gereksinimlerini gevşetmez; yönetilen bir hizmet kurarken kalıcı yapılandırma (`gateway.auth.password` veya yapılandırma `env`) kullanın.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar kurulum engellenir.

  </Accordion>
</AccordionGroup>

## Gateway'leri keşfet (Bonjour)

`gateway discover`, Gateway işaretçilerini (`_openclaw-gw._tcp`) tarar.

- Çok noktaya yayın DNS-SD: `local.`
- Tekil yayın DNS-SD (Geniş Alan Bonjour): bir alan adı seçin (örnek: `openclaw.internal.`) ve bölünmüş DNS + bir DNS sunucusu kurun; bkz. [Bonjour](/tr/gateway/bonjour).

Yalnızca Bonjour keşfi etkin olan (varsayılan) Gateway'ler işaretçiyi duyurur.

Geniş Alan keşif kayıtları şunları içerir (TXT):

- `role` (Gateway rol ipucu)
- `transport` (aktarım ipucu, ör. `gateway`)
- `gatewayPort` (WebSocket bağlantı noktası, genellikle `18789`)
- `sshPort` (isteğe bağlı; istemciler eksik olduğunda varsayılan SSH hedeflerini `22` olarak ayarlar)
- `tailnetDns` (varsa MagicDNS ana makine adı)
- `gatewayTls` / `gatewayTlsSha256` (TLS etkin + sertifika parmak izi)
- `cliPath` (geniş alan bölgesine yazılan uzak kurulum ipucu)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Komut başına zaman aşımı (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir çıktı (biçimlendirmeyi/döndürücüyü de devre dışı bırakır).
</ParamField>

Örnekler:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI, `local.` ile yapılandırılmış geniş alan alan adını, etkinleştirildiğinde birlikte tarar.
- JSON çıktısındaki `wsUrl`, `lanHost` veya `tailnetDns` gibi yalnızca TXT ipuçlarından değil, çözümlenen hizmet uç noktasından türetilir.
- `local.` mDNS üzerinde `sshPort` ve `cliPath` yalnızca `discovery.mdns.mode` değeri `full` olduğunda yayınlanır. Geniş alan DNS-SD yine de `cliPath` yazar; `sshPort` orada da isteğe bağlı kalır.

</Note>

## İlgili

- [CLI referansı](/tr/cli)
- [Gateway runbook](/tr/gateway)
