---
read_when:
    - CLI üzerinden Gateway çalıştırma (geliştirme veya sunucular)
    - Gateway kimlik doğrulaması, bağlama modları ve bağlantı sorunlarını ayıklama
    - Bonjour aracılığıyla Gateway'leri keşfetme (yerel + geniş alan DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateway'leri çalıştırın, sorgulayın ve keşfedin
title: Gateway
x-i18n:
    generated_at: "2026-04-30T09:12:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe53f1ec289bf463766634a9b03bc234e109fdddf35b3fa3958fb8c5255c81a9
    source_path: cli/gateway.md
    workflow: 16
---

Gateway, OpenClaw'ın WebSocket sunucusudur (kanallar, Node'lar, oturumlar, kancalar). Bu sayfadaki alt komutlar `openclaw gateway …` altında bulunur.

<CardGroup cols={3}>
  <Card title="Bonjour keşfi" href="/tr/gateway/bonjour">
    Yerel mDNS + geniş alan DNS-SD kurulumu.
  </Card>
  <Card title="Keşif genel bakışı" href="/tr/gateway/discovery">
    OpenClaw'ın Gateway'leri nasıl duyurduğu ve bulduğu.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration">
    Üst düzey Gateway yapılandırma anahtarları.
  </Card>
</CardGroup>

## Gateway'i Çalıştırma

Yerel bir Gateway süreci çalıştırın:

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
    - Dosya varsa ve `gateway.mode` eksikse, Gateway bunu şüpheli yapılandırma hasarı olarak görür ve sizin için "yereli tahmin etmeyi" reddeder.
    - Kimlik doğrulaması olmadan loopback ötesine bağlama engellenir (güvenlik koruma sınırı).
    - Yetkilendirildiğinde `SIGUSR1`, süreç içinde yeniden başlatmayı tetikler (`commands.restart` varsayılan olarak etkindir; manuel yeniden başlatmayı engellemek için `commands.restart: false` ayarlayın, Gateway aracı/yapılandırma apply/update işlemleri izinli kalır).
    - `SIGINT`/`SIGTERM` işleyicileri Gateway sürecini durdurur, ancak özel terminal durumlarını geri yüklemez. CLI'yi bir TUI veya raw-mode girişiyle sarmalıyorsanız, çıkmadan önce terminali geri yükleyin.

  </Accordion>
</AccordionGroup>

### Seçenekler

<ParamField path="--port <port>" type="number">
  WebSocket portu (varsayılan yapılandırmadan/env'den gelir; genellikle `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Dinleyici bağlama modu.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Kimlik doğrulama modu geçersiz kılması.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token geçersiz kılması (süreç için `OPENCLAW_GATEWAY_TOKEN` da ayarlar).
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
  Yapılandırmada `gateway.mode=local` olmadan Gateway başlatmaya izin verin. Yalnızca geçici/geliştirme önyüklemesi için başlatma korumasını atlar; yapılandırma dosyasını yazmaz veya onarmaz.
</ParamField>
<ParamField path="--dev" type="boolean">
  Eksikse bir geliştirme yapılandırması + çalışma alanı oluşturun (`BOOTSTRAP.md` atlanır).
</ParamField>
<ParamField path="--reset" type="boolean">
  Geliştirme yapılandırmasını + kimlik bilgilerini + oturumları + çalışma alanını sıfırlayın (`--dev` gerektirir).
</ParamField>
<ParamField path="--force" type="boolean">
  Başlatmadan önce seçili porttaki mevcut dinleyiciyi sonlandırın.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Ayrıntılı günlükler.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Konsolda yalnızca CLI arka uç günlüklerini gösterin (ve stdout/stderr'yi etkinleştirin).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Websocket günlük stili.
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact` için takma ad.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Ham model akış olaylarını jsonl'ye günlüğe kaydedin.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ham akış jsonl yolu.
</ParamField>

<Warning>
Satır içi `--password`, yerel süreç listelerinde açığa çıkabilir. `--password-file`, env veya SecretRef destekli `gateway.auth.password` tercih edin.
</Warning>

### Başlatma profillemesi

- Gateway başlatması sırasında faz zamanlamalarını günlüğe kaydetmek için `OPENCLAW_GATEWAY_STARTUP_TRACE=1` ayarlayın; buna faz başına `eventLoopMax` gecikmesi ve installed-index, manifest kayıt defteri, başlatma planlaması ve owner-map çalışması için Plugin arama tablosu zamanlamaları dahildir.
- Harici QA koşumları için en iyi çabayla JSONL başlatma tanılama zaman çizelgesi yazmak üzere `OPENCLAW_DIAGNOSTICS=timeline` ile `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` ayarlayın. Bayrağı yapılandırmada `diagnostics.flags: ["timeline"]` ile de etkinleştirebilirsiniz; yol yine env tarafından sağlanır. Olay döngüsü örneklerini dahil etmek için `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` ekleyin.
- Gateway başlatmasını kıyaslamak için `pnpm test:startup:gateway -- --runs 5 --warmup 1` çalıştırın. Kıyaslama ilk süreç çıktısını, `/healthz`, `/readyz`, başlatma izleme zamanlamalarını, olay döngüsü gecikmesini ve Plugin arama tablosu zamanlama ayrıntılarını kaydeder.

## Çalışan bir Gateway'i Sorgulama

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
    - `--expect-final`: bir "final" yanıtını bekler (aracı çağrıları).

  </Tab>
</Tabs>

<Note>
`--url` ayarladığınızda CLI, yapılandırma veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` değerini açıkça geçirin. Açık kimlik bilgilerinin eksik olması hatadır.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` uç noktası bir canlılık probudur: sunucu HTTP'ye yanıt verebildiğinde döner. HTTP `/readyz` uç noktası daha katıdır ve başlatma yardımcı süreçleri, kanallar veya yapılandırılmış kancalar hâlâ yerleşirken kırmızı kalır. Yerel veya kimliği doğrulanmış ayrıntılı hazır olma yanıtları; olay döngüsü gecikmesi, olay döngüsü kullanımı, CPU çekirdek oranı ve bir `degraded` bayrağı içeren bir `eventLoop` tanılama bloğu içerir.

### `gateway usage-cost`

Oturum günlüklerinden kullanım maliyeti özetlerini alın.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Dahil edilecek gün sayısı.
</ParamField>

### `gateway stability`

Çalışan bir Gateway'den son tanılama kararlılık kaydedicisini alın.

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
    - Kayıtlar operasyonel meta verileri tutar: olay adları, sayılar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/Plugin adları ve redakte edilmiş oturum özetleri. Sohbet metnini, Webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, token'ları, çerezleri, gizli değerleri, ana makine adlarını veya ham oturum kimliklerini tutmazlar. Kaydediciyi tamamen devre dışı bırakmak için `diagnostics.enabled: false` ayarlayın.
    - Ölümcül Gateway çıkışlarında, kapanma zaman aşımlarında ve yeniden başlatma başlatma hatalarında, kaydedicide olaylar varsa OpenClaw aynı tanılama anlık görüntüsünü `~/.openclaw/logs/stability/openclaw-stability-*.json` konumuna yazar. En yeni paketi `openclaw gateway stability --bundle latest` ile inceleyin; `--limit`, `--type` ve `--since-seq` de paket çıktısına uygulanır.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Hata raporlarına eklenmek üzere tasarlanmış yerel bir tanılama zip'i yazın. Gizlilik modeli ve paket içerikleri için bkz. [Tanılama Dışa Aktarma](/tr/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Çıktı zip yolu. Varsayılan olarak durum dizini altında bir destek dışa aktarmasıdır.
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
  Kalıcı kararlılık paketi aramasını atlayın.
</ParamField>
<ParamField path="--json" type="boolean">
  Yazılan yolu, boyutu ve manifesti JSON olarak yazdırın.
</ParamField>

Dışa aktarma; bir manifest, Markdown özeti, yapılandırma şekli, temizlenmiş yapılandırma ayrıntıları, temizlenmiş günlük özetleri, temizlenmiş Gateway durum/sağlık anlık görüntüleri ve varsa en yeni kararlılık paketini içerir.

Paylaşılmak üzere tasarlanmıştır. Hata ayıklamaya yardımcı olan operasyonel ayrıntıları tutar; güvenli OpenClaw günlük alanları, alt sistem adları, durum kodları, süreler, yapılandırılmış modlar, portlar, Plugin kimlikleri, sağlayıcı kimlikleri, gizli olmayan özellik ayarları ve redakte edilmiş operasyonel günlük mesajları buna dahildir. Sohbet metnini, Webhook gövdelerini, araç çıktılarını, kimlik bilgilerini, çerezleri, hesap/mesaj tanımlayıcılarını, istem/talimat metnini, ana makine adlarını ve gizli değerleri atlar veya redakte eder. LogTape tarzı bir mesaj kullanıcı/sohbet/araç yük metni gibi göründüğünde, dışa aktarma yalnızca bir mesajın atlandığı bilgisini ve bayt sayısını tutar.

### `gateway status`

`gateway status`, Gateway hizmetini (launchd/systemd/schtasks) ve isteğe bağlı bir bağlantı/kimlik doğrulama yeteneği probunu gösterir.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Açık bir prob hedefi ekleyin. Yapılandırılmış uzak + localhost yine de problanır.
</ParamField>
<ParamField path="--token <token>" type="string">
  Prob için token kimlik doğrulaması.
</ParamField>
<ParamField path="--password <password>" type="string">
  Prob için parola kimlik doğrulaması.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Prob zaman aşımı.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Bağlantı probunu atlayın (yalnızca hizmet görünümü).
</ParamField>
<ParamField path="--deep" type="boolean">
  Sistem düzeyi hizmetleri de tarayın.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Varsayılan bağlantı probunu bir okuma probuna yükseltin ve bu okuma probu başarısız olduğunda sıfır olmayan kodla çıkın. `--no-probe` ile birlikte kullanılamaz.
</ParamField>

<AccordionGroup>
  <Accordion title="Durum semantiği">
    - `gateway status`, yerel CLI yapılandırması eksik veya geçersiz olsa bile tanılama için kullanılabilir kalır.
    - Varsayılan `gateway status`, hizmet durumunu, WebSocket bağlantısını ve el sıkışma zamanında görünen kimlik doğrulama yeteneğini kanıtlar. Okuma/yazma/yönetici işlemlerini kanıtlamaz.
    - Tanılama yoklamaları, ilk kez cihaz kimlik doğrulaması için değişiklik yapmaz: varsa mevcut önbelleğe alınmış cihaz belirtecini yeniden kullanırlar, ancak yalnızca durumu denetlemek için yeni bir CLI cihaz kimliği veya salt okunur cihaz eşleştirme kaydı oluşturmazlar.
    - `gateway status`, mümkün olduğunda yoklama kimlik doğrulaması için yapılandırılmış kimlik doğrulama SecretRef'lerini çözer.
    - Bu komut yolunda gerekli bir kimlik doğrulama SecretRef'i çözülemezse, yoklama bağlantısı/kimlik doğrulaması başarısız olduğunda `gateway status --json`, `rpc.authWarning` bildirir; `--token`/`--password` değerlerini açıkça geçin veya önce gizli kaynak kaynağını çözün.
    - Yoklama başarılı olursa, yanlış pozitifleri önlemek için çözülemeyen kimlik doğrulama başvurusu uyarıları bastırılır.
    - Dinleyen bir hizmet yeterli olmadığında ve okuma kapsamlı RPC çağrılarının da sağlıklı olması gerektiğinde betiklerde ve otomasyonda `--require-rpc` kullanın.
    - `--deep`, ek launchd/systemd/schtasks kurulumları için en iyi çabayla bir tarama ekler. Birden fazla Gateway benzeri hizmet algılandığında, insan çıktısı temizlik ipuçları yazdırır ve çoğu kurulumun makine başına bir Gateway çalıştırması gerektiği konusunda uyarır.
    - İnsan çıktısı, profil veya state-dir kaymasını tanılamaya yardımcı olmak için çözümlenen dosya günlük yolunu ve CLI ile hizmet yapılandırma yolları/geçerlilik anlık görüntüsünü içerir.

  </Accordion>
  <Accordion title="Linux systemd kimlik doğrulama kayması denetimleri">
    - Linux systemd kurulumlarında, hizmet kimlik doğrulama kayması denetimleri unit içindeki hem `Environment=` hem de `EnvironmentFile=` değerlerini okur (`%h`, tırnaklı yollar, birden fazla dosya ve isteğe bağlı `-` dosyaları dahil).
    - Kayma denetimleri, birleştirilmiş çalışma zamanı env kullanarak `gateway.auth.token` SecretRef'lerini çözer (önce hizmet komutu env, ardından process env yedeği).
    - Belirteç kimlik doğrulaması etkin şekilde aktif değilse (açık `gateway.auth.mode` değeri `password`/`none`/`trusted-proxy` ise veya parola kazanabilirken mod ayarlanmamışsa ve hiçbir belirteç adayı kazanamıyorsa), belirteç kayması denetimleri yapılandırma belirteci çözümünü atlar.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe`, "her şeyin hata ayıklamasını yap" komutudur. Her zaman şunları yoklar:

- yapılandırılmış uzak Gateway'iniz (ayarlanmışsa) ve
- localhost (loopback), **uzak yapılandırılmış olsa bile**.

`--url` geçirirseniz, bu açık hedef ikisinin de önüne eklenir. İnsan çıktısı hedefleri şöyle etiketler:

- `URL (açık)`
- `Uzak (yapılandırılmış)` veya `Uzak (yapılandırılmış, etkin değil)`
- `Local loopback`

<Note>
Birden fazla Gateway erişilebilir durumdaysa, hepsini yazdırır. Yalıtılmış profiller/portlar kullandığınızda birden fazla Gateway desteklenir (ör. kurtarma botu), ancak çoğu kurulum yine de tek bir Gateway çalıştırır.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Yorumlama">
    - `Reachable: yes`, en az bir hedefin WebSocket bağlantısını kabul ettiği anlamına gelir.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only`, yoklamanın kimlik doğrulama hakkında neyi kanıtlayabildiğini bildirir. Erişilebilirlikten ayrıdır.
    - `Read probe: ok`, okuma kapsamlı ayrıntı RPC çağrılarının (`health`/`status`/`system-presence`/`config.get`) da başarılı olduğu anlamına gelir.
    - `Read probe: limited - missing scope: operator.read`, bağlantının başarılı olduğu ancak okuma kapsamlı RPC'nin sınırlı olduğu anlamına gelir. Bu, tam başarısızlık olarak değil, **bozulmuş** erişilebilirlik olarak bildirilir.
    - `Connect: ok` sonrasında `Read probe: failed`, Gateway'in WebSocket bağlantısını kabul ettiği, ancak sonraki okuma tanılamalarının zaman aşımına uğradığı veya başarısız olduğu anlamına gelir. Bu da erişilemez Gateway olarak değil, **bozulmuş** erişilebilirlik olarak değerlendirilir.
    - `gateway status` gibi, probe mevcut önbelleğe alınmış cihaz kimlik doğrulamasını yeniden kullanır ancak ilk kez cihaz kimliği veya eşleştirme durumu oluşturmaz.
    - Çıkış kodu yalnızca hiçbir yoklanan hedef erişilebilir değilse sıfır dışıdır.

  </Accordion>
  <Accordion title="JSON çıktısı">
    Üst düzey:

    - `ok`: en az bir hedef erişilebilir.
    - `degraded`: en az bir hedef bağlantıyı kabul etti ancak tam ayrıntı RPC tanılamalarını tamamlamadı.
    - `capability`: erişilebilir hedefler genelinde görülen en iyi yetenek (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` veya `unknown`).
    - `primaryTargetId`: şu sırayla etkin kazanan olarak ele alınacak en iyi hedef: açık URL, SSH tüneli, yapılandırılmış uzak, ardından local loopback.
    - `warnings[]`: `code`, `message` ve isteğe bağlı `targetIds` içeren en iyi çaba uyarı kayıtları.
    - `network`: geçerli yapılandırma ve ana makine ağına göre türetilmiş local loopback/tailnet URL ipuçları.
    - `discovery.timeoutMs` ve `discovery.count`: bu yoklama geçişi için kullanılan gerçek keşif bütçesi/sonuç sayısı.

    Hedef başına (`targets[].connect`):

    - `ok`: bağlantı + bozulmuş sınıflandırma sonrası erişilebilirlik.
    - `rpcOk`: tam ayrıntı RPC başarısı.
    - `scopeLimited`: ayrıntı RPC, eksik operatör kapsamı nedeniyle başarısız oldu.

    Hedef başına (`targets[].auth`):

    - `role`: varsa `hello-ok` içinde bildirilen kimlik doğrulama rolü.
    - `scopes`: varsa `hello-ok` içinde bildirilen verilen kapsamlar.
    - `capability`: o hedef için yüzeye çıkarılan kimlik doğrulama yeteneği sınıflandırması.

  </Accordion>
  <Accordion title="Yaygın uyarı kodları">
    - `ssh_tunnel_failed`: SSH tüneli kurulumu başarısız oldu; komut doğrudan yoklamalara geri döndü.
    - `multiple_gateways`: birden fazla hedef erişilebilir durumdaydı; kurtarma botu gibi yalıtılmış profilleri bilerek çalıştırmadığınız sürece bu alışılmadık bir durumdur.
    - `auth_secretref_unresolved`: yapılandırılmış bir kimlik doğrulama SecretRef'i, başarısız bir hedef için çözülemedi.
    - `probe_scope_limited`: WebSocket bağlantısı başarılı oldu, ancak okuma yoklaması eksik `operator.read` nedeniyle sınırlıydı.

  </Accordion>
</AccordionGroup>

#### SSH üzerinden uzak (Mac uygulaması eşliği)

macOS uygulamasındaki "Remote over SSH" modu, yerel port yönlendirme kullanır; böylece uzak Gateway (yalnızca loopback'e bağlı olabilir) `ws://127.0.0.1:<port>` adresinde erişilebilir olur.

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
  Çözümlenen keşif uç noktasından (`local.` artı varsa yapılandırılmış geniş alan etki alanı) ilk keşfedilen Gateway ana makinesini SSH hedefi olarak seçin. Yalnızca TXT ipuçları yok sayılır.
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
<ParamField path="--timeout <ms>" type="number">
  Zaman aşımı bütçesi.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Özellikle son yükten önce ara olaylar akışı yapan ajan tarzı RPC'ler için.
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

### Bir sarmalayıcıyla kurulum

Yönetilen hizmetin başka bir yürütülebilir dosya üzerinden başlaması gerektiğinde `--wrapper` kullanın; örneğin bir
gizli anahtar yöneticisi shim'i veya farklı kullanıcıyla çalıştırma yardımcısı. Sarmalayıcı normal Gateway argümanlarını alır ve
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
yürütülebilir bir dosya olduğunu doğrular, sarmalayıcıyı hizmet `ProgramArguments` içine yazar ve sonraki zorunlu yeniden kurulumlar, güncellemeler ve doctor
onarımları için hizmet ortamında `OPENCLAW_WRAPPER` değerini kalıcı kılar.

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
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="Yaşam döngüsü davranışı">
    - Yönetilen bir hizmeti yeniden başlatmak için `gateway restart` kullanın. Yeniden başlatma yerine `gateway stop` ve `gateway start` komutlarını zincirlemeyin; macOS'te `gateway stop`, LaunchAgent'ı durdurmadan önce bilerek devre dışı bırakır.
    - Yaşam döngüsü komutları betikleme için `--json` kabul eder.

  </Accordion>
  <Accordion title="Kurulum sırasında kimlik doğrulama ve SecretRef'ler">
    - Belirteç kimlik doğrulaması bir belirteç gerektirdiğinde ve `gateway.auth.token` SecretRef tarafından yönetildiğinde, `gateway install` SecretRef'in çözülebilir olduğunu doğrular ancak çözümlenen belirteci hizmet ortamı meta verilerinde kalıcı hale getirmez.
    - Belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve yapılandırılmış belirteç SecretRef'i çözülemiyorsa, kurulum yedek düz metni kalıcı hale getirmek yerine kapalı şekilde başarısız olur.
    - `gateway run` üzerinde parola kimlik doğrulaması için satır içi `--password` yerine `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` veya SecretRef destekli `gateway.auth.password` tercih edin.
    - Çıkarımlı kimlik doğrulama modunda, yalnızca shell'deki `OPENCLAW_GATEWAY_PASSWORD` kurulum belirteci gereksinimlerini gevşetmez; yönetilen bir hizmet kurarken dayanıklı yapılandırma (`gateway.auth.password` veya yapılandırma `env`) kullanın.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar kurulum engellenir.

  </Accordion>
</AccordionGroup>

## Gateway'leri keşfetme (Bonjour)

`gateway discover`, Gateway işaretlerini (`_openclaw-gw._tcp`) tarar.

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Geniş Alan Bonjour): bir etki alanı seçin (örnek: `openclaw.internal.`) ve split DNS + bir DNS sunucusu kurun; bkz. [Bonjour](/tr/gateway/bonjour).

Yalnızca Bonjour keşfi etkinleştirilmiş Gateway'ler (varsayılan) işareti duyurur.

Geniş Alan keşif kayıtları şunları içerir (TXT):

- `role` (Gateway rol ipucu)
- `transport` (aktarım ipucu, ör. `gateway`)
- `gatewayPort` (WebSocket portu, genellikle `18789`)
- `sshPort` (isteğe bağlı; istemciler yoksa SSH hedeflerini varsayılan olarak `22` yapar)
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
  Makine tarafından okunabilir çıktı (biçimlendirmeyi/spinner'ı da devre dışı bırakır).
</ParamField>

Örnekler:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI, biri etkinleştirildiğinde `local.` ile yapılandırılmış geniş alan etki alanını tarar.
- JSON çıktısındaki `wsUrl`, `lanHost` veya `tailnetDns` gibi yalnızca TXT ipuçlarından değil, çözümlenen hizmet uç noktasından türetilir.
- `local.` mDNS üzerinde, `sshPort` ve `cliPath` yalnızca `discovery.mdns.mode` değeri `full` olduğunda yayınlanır. Geniş alan DNS-SD yine de `cliPath` yazar; `sshPort` orada da isteğe bağlı kalır.

</Note>

## İlgili

- [CLI referansı](/tr/cli)
- [Gateway işletim kılavuzu](/tr/gateway)
