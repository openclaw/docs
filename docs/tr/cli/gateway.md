---
read_when:
    - Gateway'i CLI'den çalıştırma (geliştirme veya sunucular)
    - Gateway kimlik doğrulaması, bağlama modları ve bağlantıda hata ayıklama
    - Gateway'leri Bonjour aracılığıyla keşfetme (yerel + geniş alan DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateway'leri çalıştırın, sorgulayın ve keşfedin
title: Gateway
x-i18n:
    generated_at: "2026-05-02T22:17:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7f948a8f0ee6e065afa02f354e690ad5cc4f71bdb8b8674f1b0396c439ab242
    source_path: cli/gateway.md
    workflow: 16
---

The Gateway, OpenClaw'ın WebSocket sunucusudur (kanallar, düğümler, oturumlar, hook'lar). Bu sayfadaki alt komutlar `openclaw gateway …` altında bulunur.

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

Yerel bir Gateway işlemi çalıştırın:

```bash
openclaw gateway
```

Ön plan takma adı:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Başlatma davranışı">
    - Varsayılan olarak Gateway, `~/.openclaw/openclaw.json` içinde `gateway.mode=local` ayarlanmadıkça başlamayı reddeder. Geçici/geliştirme çalıştırmaları için `--allow-unconfigured` kullanın.
    - `openclaw onboard --mode local` ve `openclaw setup` komutlarının `gateway.mode=local` yazması beklenir. Dosya varsa ancak `gateway.mode` eksikse, bunu örtük olarak yerel mod varsaymak yerine bozuk veya üzerine yazılmış bir yapılandırma olarak ele alın ve onarın.
    - Dosya varsa ve `gateway.mode` eksikse Gateway bunu şüpheli yapılandırma hasarı olarak değerlendirir ve sizin için "yerel tahmini" yapmayı reddeder.
    - Kimlik doğrulama olmadan loopback dışına bağlanma engellenir (güvenlik korkuluğu).
    - `SIGUSR1`, yetkilendirildiğinde işlem içi yeniden başlatmayı tetikler (`commands.restart` varsayılan olarak etkindir; manuel yeniden başlatmayı engellemek için `commands.restart: false` ayarlayın, gateway aracı/yapılandırma apply/update işlemleri ise izinli kalır).
    - `SIGINT`/`SIGTERM` işleyicileri gateway işlemini durdurur, ancak özel terminal durumunu geri yüklemez. CLI'ı bir TUI veya raw-mode girdiyle sarıyorsanız, çıkmadan önce terminali geri yükleyin.

  </Accordion>
</AccordionGroup>

### Seçenekler

<ParamField path="--port <port>" type="number">
  WebSocket portu (varsayılan config/env'den gelir; genellikle `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Dinleyici bind modu.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Kimlik doğrulama modu geçersiz kılması.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token geçersiz kılması (işlem için `OPENCLAW_GATEWAY_TOKEN` da ayarlar).
</ParamField>
<ParamField path="--password <password>" type="string">
  Parola geçersiz kılması.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Gateway parolasını bir dosyadan okuyun.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Gateway'i Tailscale üzerinden açığa çıkarın.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Kapanışta Tailscale serve/funnel yapılandırmasını sıfırlayın.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Yapılandırmada `gateway.mode=local` olmadan gateway başlatmaya izin verin. Yalnızca geçici/geliştirme bootstrap için başlatma korumasını atlar; yapılandırma dosyasını yazmaz veya onarmaz.
</ParamField>
<ParamField path="--dev" type="boolean">
  Eksikse geliştirme yapılandırması + çalışma alanı oluşturun (`BOOTSTRAP.md` atlanır).
</ParamField>
<ParamField path="--reset" type="boolean">
  Geliştirme yapılandırmasını + kimlik bilgilerini + oturumları + çalışma alanını sıfırlayın (`--dev` gerektirir).
</ParamField>
<ParamField path="--force" type="boolean">
  Başlamadan önce seçilen porttaki mevcut dinleyiciyi sonlandırın.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Ayrıntılı günlükler.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Konsolda yalnızca CLI backend günlüklerini göster (ve stdout/stderr'yi etkinleştir).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Websocket günlük stili.
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact` için takma ad.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Ham model akış olaylarını jsonl'ye günlüğe kaydet.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ham akış jsonl yolu.
</ParamField>

<Warning>
Satır içi `--password`, yerel işlem listelerinde açığa çıkabilir. `--password-file`, env veya SecretRef destekli `gateway.auth.password` tercih edin.
</Warning>

### Başlatma profilleme

- Gateway başlatılırken aşama sürelerini günlüğe kaydetmek için `OPENCLAW_GATEWAY_STARTUP_TRACE=1` ayarlayın; buna her aşama için `eventLoopMax` gecikmesi ve installed-index, manifest registry, başlatma planlama ve owner-map çalışması için plugin arama tablosu süreleri dahildir.
- Harici QA koşumları için best-effort JSONL başlatma tanılama zaman çizelgesi yazmak üzere `OPENCLAW_DIAGNOSTICS=timeline` değerini `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` ile ayarlayın. Bayrağı yapılandırmada `diagnostics.flags: ["timeline"]` ile de etkinleştirebilirsiniz; yol yine env üzerinden sağlanır. Event-loop örneklerini dahil etmek için `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` ekleyin.
- Gateway başlatmasını benchmark etmek için `pnpm test:startup:gateway -- --runs 5 --warmup 1` çalıştırın. Benchmark ilk işlem çıktısını, `/healthz`, `/readyz`, başlatma trace sürelerini, event-loop gecikmesini ve plugin arama tablosu zamanlama ayrıntılarını kaydeder.

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
    - `--expect-final`: "final" yanıtını bekle (ajan çağrıları).

  </Tab>
</Tabs>

<Note>
`--url` ayarladığınızda CLI, yapılandırma veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` değerini açıkça geçirin. Açık kimlik bilgilerinin eksik olması bir hatadır.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` endpoint'i bir liveness probe'dur: sunucu HTTP'ye yanıt verebildiğinde döner. HTTP `/readyz` endpoint'i daha katıdır ve başlatma plugin sidecar'ları, kanallar veya yapılandırılmış hook'lar hâlâ yerleşirken kırmızı kalır. Yerel veya kimliği doğrulanmış ayrıntılı readiness yanıtları, event-loop gecikmesi, event-loop kullanımı, CPU çekirdek oranı ve `degraded` bayrağı içeren bir `eventLoop` tanılama bloğu içerir.

### `gateway usage-cost`

Oturum günlüklerinden kullanım maliyeti özetlerini getirir.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Dahil edilecek gün sayısı.
</ParamField>

### `gateway stability`

Çalışan bir Gateway'den son tanılama kararlılık kaydedicisini getirir.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Dahil edilecek en fazla son olay sayısı (maksimum `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  `payload.large` veya `diagnostic.memory.pressure` gibi tanılama olay türüne göre filtrele.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Yalnızca bir tanılama sıra numarasından sonraki olayları dahil et.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Çalışan Gateway'i çağırmak yerine kalıcı bir kararlılık paketini okuyun. Durum dizini altındaki en yeni paket için `--bundle latest` (veya yalnızca `--bundle`) kullanın ya da doğrudan bir paket JSON yolu geçirin.
</ParamField>
<ParamField path="--export" type="boolean">
  Kararlılık ayrıntılarını yazdırmak yerine paylaşılabilir bir destek tanılama zip'i yazın.
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` için çıktı yolu.
</ParamField>

<AccordionGroup>
  <Accordion title="Gizlilik ve paket davranışı">
    - Kayıtlar operasyonel metadata tutar: olay adları, sayımlar, byte boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/plugin adları ve redakte edilmiş oturum özetleri. Sohbet metni, webhook gövdeleri, araç çıktıları, ham istek veya yanıt gövdeleri, token'lar, çerezler, gizli değerler, hostname'ler veya ham oturum kimlikleri tutmazlar. Kaydediciyi tamamen devre dışı bırakmak için `diagnostics.enabled: false` ayarlayın.
    - Ölümcül Gateway çıkışlarında, kapanış zaman aşımlarında ve yeniden başlatma başlangıç hatalarında OpenClaw, kaydedicide olaylar olduğunda aynı tanılama anlık görüntüsünü `~/.openclaw/logs/stability/openclaw-stability-*.json` konumuna yazar. En yeni paketi `openclaw gateway stability --bundle latest` ile inceleyin; `--limit`, `--type` ve `--since-seq` de paket çıktısına uygulanır.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Hata raporlarına eklenmek üzere tasarlanmış yerel bir tanılama zip'i yazın. Gizlilik modeli ve paket içeriği için [Tanılama Dışa Aktarımı](/tr/gateway/diagnostics) bölümüne bakın.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Çıktı zip yolu. Varsayılan olarak durum dizini altında bir destek dışa aktarımı kullanılır.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Dahil edilecek en fazla sanitize edilmiş günlük satırı.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  İncelenecek en fazla günlük byte'ı.
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
  Kalıcı kararlılık paketi aramasını atla.
</ParamField>
<ParamField path="--json" type="boolean">
  Yazılan yolu, boyutu ve manifesti JSON olarak yazdır.
</ParamField>

Dışa aktarım bir manifest, Markdown özeti, yapılandırma şekli, sanitize edilmiş yapılandırma ayrıntıları, sanitize edilmiş günlük özetleri, sanitize edilmiş Gateway durum/sağlık anlık görüntüleri ve varsa en yeni kararlılık paketini içerir.

Paylaşılmak için tasarlanmıştır. Hata ayıklamaya yardımcı olan güvenli OpenClaw günlük alanları, alt sistem adları, durum kodları, süreler, yapılandırılmış modlar, portlar, plugin kimlikleri, provider kimlikleri, gizli olmayan özellik ayarları ve redakte edilmiş operasyonel günlük mesajları gibi operasyonel ayrıntıları tutar. Sohbet metni, webhook gövdeleri, araç çıktıları, kimlik bilgileri, çerezler, hesap/mesaj tanımlayıcıları, prompt/talimat metni, hostname'ler ve gizli değerleri çıkarır veya redakte eder. LogTape tarzı bir mesaj kullanıcı/sohbet/araç payload metni gibi göründüğünde dışa aktarım yalnızca bir mesajın çıkarıldığını ve byte sayısını tutar.

### `gateway status`

`gateway status`, Gateway hizmetini (launchd/systemd/schtasks) ve isteğe bağlı bağlantı/kimlik doğrulama yeteneği probe'unu gösterir.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Açık bir probe hedefi ekleyin. Yapılandırılmış remote + localhost yine de probe edilir.
</ParamField>
<ParamField path="--token <token>" type="string">
  Probe için token kimlik doğrulaması.
</ParamField>
<ParamField path="--password <password>" type="string">
  Probe için parola kimlik doğrulaması.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Probe zaman aşımı.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Bağlantı probe'unu atla (yalnızca hizmet görünümü).
</ParamField>
<ParamField path="--deep" type="boolean">
  Sistem düzeyi hizmetleri de tara.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Varsayılan bağlantı probe'unu bir okuma probe'una yükseltir ve bu okuma probe'u başarısız olduğunda sıfır olmayan kodla çıkar. `--no-probe` ile birleştirilemez.
</ParamField>

<AccordionGroup>
  <Accordion title="Durum semantiği">
    - `gateway status`, yerel CLI yapılandırması eksik veya geçersiz olsa bile tanılama için kullanılabilir kalır.
    - Varsayılan `gateway status`, hizmet durumunu, WebSocket bağlantısını ve el sıkışma sırasında görünen kimlik doğrulama yetkinliğini kanıtlar. Okuma/yazma/yönetici işlemlerini kanıtlamaz.
    - Tanılama probları, ilk kez cihaz kimlik doğrulaması için değişiklik yapmaz: varsa mevcut önbelleğe alınmış cihaz belirtecini yeniden kullanır, ancak yalnızca durumu denetlemek için yeni bir CLI cihaz kimliği veya salt okunur cihaz eşleştirme kaydı oluşturmaz.
    - `gateway status`, mümkün olduğunda prob kimlik doğrulaması için yapılandırılmış kimlik doğrulama SecretRef'lerini çözümler.
    - Bu komut yolunda gerekli bir kimlik doğrulama SecretRef'i çözümlenmemişse, prob bağlantısı/kimlik doğrulaması başarısız olduğunda `gateway status --json` `rpc.authWarning` bildirir; `--token`/`--password` değerini açıkça geçirin veya önce secret kaynağını çözümleyin.
    - Prob başarılı olursa, yanlış pozitifleri önlemek için çözümlenmemiş auth-ref uyarıları bastırılır.
    - Dinleyen bir hizmet yeterli olmadığında ve okuma kapsamlı RPC çağrılarının da sağlıklı olması gerektiğinde betiklerde ve otomasyonda `--require-rpc` kullanın.
    - `--deep`, ek launchd/systemd/schtasks kurulumları için en iyi çaba taraması ekler. Birden fazla gateway benzeri hizmet algılandığında, insan çıktısı temizlik ipuçları yazdırır ve çoğu kurulumun makine başına bir Gateway çalıştırması gerektiği konusunda uyarır.
    - İnsan çıktısı, profil veya state-dir kaymasını tanılamaya yardımcı olmak için çözümlenen dosya günlük yolunu ve CLI-hizmet yapılandırma yolları/geçerlilik anlık görüntüsünü içerir.

  </Accordion>
  <Accordion title="Linux systemd kimlik doğrulama kayması denetimleri">
    - Linux systemd kurulumlarında, hizmet kimlik doğrulama kayması denetimleri birimden hem `Environment=` hem de `EnvironmentFile=` değerlerini okur (`%h`, tırnaklı yollar, birden çok dosya ve isteğe bağlı `-` dosyaları dahil).
    - Kayma denetimleri, `gateway.auth.token` SecretRef'lerini birleştirilmiş çalışma zamanı env ile çözümler (önce hizmet komutu env, ardından süreç env geri dönüşü).
    - Token kimlik doğrulaması etkin olarak aktif değilse (`password`/`none`/`trusted-proxy` şeklinde açık `gateway.auth.mode` veya parolanın kazanabildiği ve hiçbir token adayının kazanamadığı ayarlanmamış mod), token kayması denetimleri yapılandırma token çözümlemesini atlar.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe`, "her şeyde hata ayıkla" komutudur. Her zaman şunları problar:

- yapılandırılmış uzak Gateway'inizi (ayarlanmışsa) ve
- localhost (loopback) **uzak yapılandırılmış olsa bile**.

`--url` geçirirseniz, bu açık hedef her ikisinden önce eklenir. İnsan çıktısı hedefleri şöyle etiketler:

- `URL (explicit)`
- `Remote (configured)` veya `Remote (configured, inactive)`
- `Local loopback`

<Note>
Birden fazla Gateway erişilebilirse, hepsini yazdırır. Yalıtılmış profiller/portlar kullandığınızda (ör. kurtarma botu) birden fazla Gateway desteklenir, ancak çoğu kurulum yine de tek bir Gateway çalıştırır.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Yorumlama">
    - `Reachable: yes`, en az bir hedefin WebSocket bağlantısını kabul ettiği anlamına gelir.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only`, probun kimlik doğrulama hakkında neyi kanıtlayabildiğini bildirir. Erişilebilirlikten ayrıdır.
    - `Read probe: ok`, okuma kapsamlı ayrıntı RPC çağrılarının (`health`/`status`/`system-presence`/`config.get`) da başarılı olduğu anlamına gelir.
    - `Read probe: limited - missing scope: operator.read`, bağlantının başarılı olduğunu ancak okuma kapsamlı RPC'nin sınırlı olduğunu belirtir. Bu, tam hata değil, **bozulmuş** erişilebilirlik olarak bildirilir.
    - `Connect: ok` sonrasında `Read probe: failed`, Gateway'in WebSocket bağlantısını kabul ettiği, ancak sonraki okuma tanılamalarının zaman aşımına uğradığı veya başarısız olduğu anlamına gelir. Bu da erişilemeyen bir Gateway değil, **bozulmuş** erişilebilirliktir.
    - `gateway status` gibi, probe mevcut önbelleğe alınmış cihaz kimlik doğrulamasını yeniden kullanır ancak ilk kez cihaz kimliği veya eşleştirme durumu oluşturmaz.
    - Çıkış kodu yalnızca problanan hiçbir hedef erişilebilir olmadığında sıfır olmayan değerdedir.

  </Accordion>
  <Accordion title="JSON çıktısı">
    Üst seviye:

    - `ok`: en az bir hedef erişilebilir.
    - `degraded`: en az bir hedef bağlantı kabul etti ancak tam ayrıntı RPC tanılamalarını tamamlamadı.
    - `capability`: erişilebilir hedefler genelinde görülen en iyi yetkinlik (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` veya `unknown`).
    - `primaryTargetId`: bu sırayla aktif kazanan olarak ele alınacak en iyi hedef: açık URL, SSH tüneli, yapılandırılmış uzak, ardından local loopback.
    - `warnings[]`: `code`, `message` ve isteğe bağlı `targetIds` içeren en iyi çaba uyarı kayıtları.
    - `network`: geçerli yapılandırmadan ve ana makine ağından türetilen local loopback/tailnet URL ipuçları.
    - `discovery.timeoutMs` ve `discovery.count`: bu probe geçişi için kullanılan gerçek keşif bütçesi/sonuç sayısı.

    Hedef başına (`targets[].connect`):

    - `ok`: bağlantı + bozulmuş sınıflandırma sonrası erişilebilirlik.
    - `rpcOk`: tam ayrıntı RPC başarısı.
    - `scopeLimited`: ayrıntı RPC, eksik operator kapsamı nedeniyle başarısız oldu.

    Hedef başına (`targets[].auth`):

    - `role`: mevcut olduğunda `hello-ok` içinde bildirilen kimlik doğrulama rolü.
    - `scopes`: mevcut olduğunda `hello-ok` içinde bildirilen verilmiş kapsamlar.
    - `capability`: bu hedef için yüzeye çıkarılan kimlik doğrulama yetkinliği sınıflandırması.

  </Accordion>
  <Accordion title="Yaygın uyarı kodları">
    - `ssh_tunnel_failed`: SSH tüneli kurulumu başarısız oldu; komut doğrudan problara geri döndü.
    - `multiple_gateways`: birden fazla hedef erişilebilirdi; kurtarma botu gibi yalıtılmış profilleri kasıtlı olarak çalıştırmıyorsanız bu olağan dışıdır.
    - `auth_secretref_unresolved`: yapılandırılmış bir kimlik doğrulama SecretRef'i başarısız bir hedef için çözümlenemedi.
    - `probe_scope_limited`: WebSocket bağlantısı başarılı oldu, ancak okuma probu eksik `operator.read` nedeniyle sınırlandı.

  </Accordion>
</AccordionGroup>

#### SSH üzerinden uzak (Mac uygulaması eşdeğeri)

macOS uygulamasının "Remote over SSH" modu, uzak Gateway'in (yalnızca loopback'e bağlı olabilir) `ws://127.0.0.1:<port>` üzerinde erişilebilir olmasını sağlamak için yerel port yönlendirme kullanır.

CLI eşdeğeri:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` veya `user@host:port` (port varsayılanı `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Kimlik dosyası.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Çözümlenen keşif uç noktasından (`local.` artı yapılandırılmış geniş alan alan adı, varsa) ilk keşfedilen Gateway ana makinesini SSH hedefi olarak seçer. Yalnızca TXT ipuçları yok sayılır.
</ParamField>

Yapılandırma (isteğe bağlı, varsayılan olarak kullanılır):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Düşük seviyeli RPC yardımcısı.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Params için JSON nesnesi dizesi.
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway WebSocket URL'si.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway token'ı.
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway parolası.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Zaman aşımı bütçesi.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Temel olarak son yükten önce ara olayları akış olarak gönderen agent tarzı RPC'ler içindir.
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

### Bir wrapper ile yükleme

Yönetilen hizmetin başka bir yürütülebilir dosya üzerinden başlaması gerektiğinde `--wrapper` kullanın; örneğin bir
secrets manager shim'i veya run-as yardımcısı. Wrapper normal Gateway argümanlarını alır ve
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

Wrapper'ı ortam üzerinden de ayarlayabilirsiniz. `gateway install`, yolun yürütülebilir bir dosya olduğunu doğrular,
wrapper'ı hizmet `ProgramArguments` içine yazar ve sonraki zorunlu yeniden yüklemeler, güncellemeler ve doctor
onarımları için hizmet ortamında `OPENCLAW_WRAPPER` değerini kalıcı hale getirir.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Kalıcı bir wrapper'ı kaldırmak için yeniden yüklerken `OPENCLAW_WRAPPER` değerini temizleyin:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Komut seçenekleri">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Yaşam döngüsü davranışı">
    - Yönetilen bir hizmeti yeniden başlatmak için `gateway restart` kullanın. Yeniden başlatma yerine `gateway stop` ve `gateway start` komutlarını zincirlemeyin; macOS'ta `gateway stop`, durdurmadan önce LaunchAgent'ı kasıtlı olarak devre dışı bırakır.
    - `gateway restart --wait 30s`, o yeniden başlatma için yapılandırılmış yeniden başlatma drain bütçesini geçersiz kılar. Çıplak sayılar milisaniyedir; `s`, `m` ve `h` gibi birimler kabul edilir. `--wait 0` süresiz bekler.
    - `gateway restart --force`, aktif çalışma drain'ini atlar ve hemen yeniden başlatır. Bir operatör listelenen görev engelleyicilerini zaten incelediğinde ve Gateway'i hemen geri istediğinde kullanın.
    - Yaşam döngüsü komutları betik yazımı için `--json` kabul eder.

  </Accordion>
  <Accordion title="Kurulum zamanında kimlik doğrulama ve SecretRefs">
    - Token kimlik doğrulaması token gerektirdiğinde ve `gateway.auth.token` SecretRef tarafından yönetildiğinde, `gateway install` SecretRef'in çözümlenebilir olduğunu doğrular ancak çözümlenen token'ı hizmet ortamı metadata'sında kalıcı hale getirmez.
    - Token kimlik doğrulaması token gerektiriyorsa ve yapılandırılmış token SecretRef'i çözümlenmemişse, yükleme geri dönüş düz metnini kalıcı hale getirmek yerine kapalı şekilde başarısız olur.
    - `gateway run` üzerinde parola kimlik doğrulaması için satır içi `--password` yerine `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` veya SecretRef destekli `gateway.auth.password` tercih edin.
    - Çıkarımsanan kimlik doğrulama modunda, yalnızca shell'de bulunan `OPENCLAW_GATEWAY_PASSWORD` yükleme token gereksinimlerini gevşetmez; yönetilen bir hizmet yüklerken dayanıklı yapılandırma (`gateway.auth.password` veya yapılandırma `env`) kullanın.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar yükleme engellenir.

  </Accordion>
</AccordionGroup>

## Gateway'leri keşfedin (Bonjour)

`gateway discover`, Gateway beacon'larını (`_openclaw-gw._tcp`) tarar.

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): bir alan adı seçin (örnek: `openclaw.internal.`) ve split DNS + bir DNS sunucusu kurun; bkz. [Bonjour](/tr/gateway/bonjour).

Yalnızca Bonjour keşfi etkin olan Gateway'ler (varsayılan) beacon'ı duyurur.

Wide-Area keşif kayıtları şunları içerir (TXT):

- `role` (Gateway rol ipucu)
- `transport` (transport ipucu, ör. `gateway`)
- `gatewayPort` (WebSocket portu, genellikle `18789`)
- `sshPort` (isteğe bağlı; istemciler olmadığında SSH hedeflerini varsayılan olarak `22` yapar)
- `tailnetDns` (MagicDNS ana makine adı, mevcut olduğunda)
- `gatewayTls` / `gatewayTlsSha256` (TLS etkin + sertifika parmak izi)
- `cliPath` (geniş alan bölgesine yazılan uzak yükleme ipucu)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Komut başına zaman aşımı (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir çıktı (stili/döndürücüyü de devre dışı bırakır).
</ParamField>

Örnekler:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI, biri etkinleştirildiğinde `local.` ile yapılandırılmış geniş alan etki alanını tarar.
- JSON çıktısındaki `wsUrl`, `lanHost` veya `tailnetDns` gibi yalnızca TXT ipuçlarından değil, çözümlenen hizmet uç noktasından türetilir.
- `local.` mDNS üzerinde `sshPort` ve `cliPath`, yalnızca `discovery.mdns.mode` değeri `full` olduğunda yayınlanır. Geniş alan DNS-SD yine de `cliPath` yazar; `sshPort` orada da isteğe bağlı kalır.

</Note>

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway operasyon kılavuzu](/tr/gateway)
