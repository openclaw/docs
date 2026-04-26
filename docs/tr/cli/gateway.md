---
read_when:
    - Gateway'i CLI'dan çalıştırma (geliştirme veya sunucular)
    - Gateway kimlik doğrulamasında hata ayıklama, bağlama modları ve bağlantı
    - Gateway'leri Bonjour aracılığıyla keşfetme (yerel + geniş alan DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateway'leri çalıştırın, sorgulayın ve keşfedin
title: Gateway
x-i18n:
    generated_at: "2026-04-26T11:26:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8cdca95676f0b098e2dd79ff4245a32eaae82711ed6c2b7e39522331872cfd9
    source_path: cli/gateway.md
    workflow: 15
---

Gateway, OpenClaw'ın WebSocket sunucusudur (kanallar, Node'lar, oturumlar, kancalar). Bu sayfadaki alt komutlar `openclaw gateway …` altında yer alır.

<CardGroup cols={3}>
  <Card title="Bonjour keşfi" href="/tr/gateway/bonjour">
    Yerel mDNS + geniş alan DNS-SD kurulumu.
  </Card>
  <Card title="Keşif genel bakışı" href="/tr/gateway/discovery">
    OpenClaw'ın Gateway'leri nasıl duyurduğu ve bulduğu.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration">
    Üst düzey gateway yapılandırma anahtarları.
  </Card>
</CardGroup>

## Gateway'i çalıştırın

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
    - Varsayılan olarak Gateway, `~/.openclaw/openclaw.json` içinde `gateway.mode=local` ayarlanmamışsa başlatılmayı reddeder. Geçici/geliştirme çalıştırmaları için `--allow-unconfigured` kullanın.
    - `openclaw onboard --mode local` ve `openclaw setup` komutlarının `gateway.mode=local` yazması beklenir. Dosya mevcutsa ama `gateway.mode` eksikse, bunu örtük olarak yerel mod varsaymak yerine bozuk veya üzerine yazılmış bir yapılandırma olarak değerlendirin ve onarın.
    - Dosya mevcutsa ve `gateway.mode` eksikse, Gateway bunu şüpheli yapılandırma hasarı olarak görür ve sizin yerinize "yereli tahmin etmeyi" reddeder.
    - Kimlik doğrulama olmadan loopback ötesine bağlanma engellenir (güvenlik korkuluğu).
    - `SIGUSR1`, yetkili olduğunda süreç içi yeniden başlatmayı tetikler (`commands.restart` varsayılan olarak etkindir; elle yeniden başlatmayı engellemek için `commands.restart: false` ayarlayın; gateway tool/config apply/update ise izinli kalır).
    - `SIGINT`/`SIGTERM` işleyicileri gateway sürecini durdurur, ancak özel terminal durumunu geri yüklemez. CLI'yi bir TUI veya raw-mode girdiyle sarıyorsanız, çıkıştan önce terminali geri yükleyin.
  </Accordion>
</AccordionGroup>

### Seçenekler

<ParamField path="--port <port>" type="number">
  WebSocket bağlantı noktası (varsayılan yapılandırma/env'den gelir; genellikle `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Dinleyici bağlama modu.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Kimlik doğrulama modu geçersiz kılması.
</ParamField>
<ParamField path="--token <token>" type="string">
  Belirteç geçersiz kılması (`OPENCLAW_GATEWAY_TOKEN` değerini de süreç için ayarlar).
</ParamField>
<ParamField path="--password <password>" type="string">
  Parola geçersiz kılması.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Gateway parolasını bir dosyadan oku.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Gateway'i Tailscale üzerinden açığa çıkarın.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Kapanışta Tailscale serve/funnel yapılandırmasını sıfırla.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Yapılandırmada `gateway.mode=local` olmadan gateway başlangıcına izin verin. Başlangıç korkuluğunu yalnızca geçici/geliştirme önyüklemesi için aşar; yapılandırma dosyasını yazmaz veya onarmaz.
</ParamField>
<ParamField path="--dev" type="boolean">
  Eksikse bir geliştirme yapılandırması + çalışma alanı oluştur (BOOTSTRAP.md atlanır).
</ParamField>
<ParamField path="--reset" type="boolean">
  Geliştirme yapılandırmasını + kimlik bilgilerini + oturumları + çalışma alanını sıfırla (`--dev` gerektirir).
</ParamField>
<ParamField path="--force" type="boolean">
  Başlatmadan önce seçilen bağlantı noktasındaki mevcut dinleyiciyi öldür.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Ayrıntılı günlükler.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Konsolda yalnızca CLI arka uç günlüklerini göster (ve stdout/stderr'yi etkinleştir).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  WebSocket günlük stili.
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact` için takma ad.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Ham model akışı olaylarını jsonl olarak günlüğe kaydet.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ham akış jsonl yolu.
</ParamField>

<Warning>
Satır içi `--password`, yerel süreç listelerinde açığa çıkabilir. `--password-file`, env veya SecretRef destekli `gateway.auth.password` tercih edin.
</Warning>

### Başlatma profilleme

- Gateway başlangıcı sırasında aşama zamanlamalarını günlüğe kaydetmek için `OPENCLAW_GATEWAY_STARTUP_TRACE=1` ayarlayın.
- Gateway başlangıcını kıyaslamak için `pnpm test:startup:gateway -- --runs 5 --warmup 1` çalıştırın. Kıyaslama; ilk süreç çıktısını, `/healthz`, `/readyz` ve başlangıç izleme zamanlamalarını kaydeder.

## Çalışan bir Gateway'i sorgulayın

Tüm sorgu komutları WebSocket RPC kullanır.

<Tabs>
  <Tab title="Çıktı modları">
    - Varsayılan: insan tarafından okunabilir (TTY'de renkli).
    - `--json`: makine tarafından okunabilir JSON (stil/spinner yok).
    - `--no-color` (veya `NO_COLOR=1`): insan düzenini korurken ANSI'yi devre dışı bırak.
  </Tab>
  <Tab title="Paylaşılan seçenekler">
    - `--url <url>`: Gateway WebSocket URL'si.
    - `--token <token>`: Gateway belirteci.
    - `--password <password>`: Gateway parolası.
    - `--timeout <ms>`: zaman aşımı/bütçe (komuta göre değişir).
    - `--expect-final`: "final" bir yanıt bekle (aracı çağrıları).
  </Tab>
</Tabs>

<Note>
`--url` ayarladığınızda CLI, yapılandırma veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` değerini açıkça verin. Açık kimlik bilgileri eksikse hata oluşur.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` uç noktası bir canlılık probudur: sunucu HTTP yanıtlayabildiğinde döner. HTTP `/readyz` uç noktası daha katıdır ve başlangıç yardımcı süreçleri, kanallar veya yapılandırılmış kancalar hâlâ yerleşirken kırmızı kalır.

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
  Dahil edilecek en fazla son olay sayısı (en fazla `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  `payload.large` veya `diagnostic.memory.pressure` gibi tanılama olay türüne göre filtrele.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Yalnızca bir tanılama sıra numarasından sonraki olayları dahil et.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Çalışan Gateway'i çağırmak yerine kalıcı bir kararlılık paketini oku. Durum dizini altındaki en yeni paket için `--bundle latest` (veya yalnızca `--bundle`) kullanın ya da doğrudan bir paket JSON yolu verin.
</ParamField>
<ParamField path="--export" type="boolean">
  Kararlılık ayrıntılarını yazdırmak yerine paylaşılabilir bir destek tanılama zip'i yaz.
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` için çıktı yolu.
</ParamField>

<AccordionGroup>
  <Accordion title="Gizlilik ve paket davranışı">
    - Kayıtlar operasyonel meta verileri tutar: olay adları, sayılar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/Plugin adları ve sansürlenmiş oturum özetleri. Sohbet metnini, Webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, belirteçleri, çerezleri, gizli değerleri, ana makine adlarını veya ham oturum kimliklerini tutmazlar. Kaydediciyi tamamen devre dışı bırakmak için `diagnostics.enabled: false` ayarlayın.
    - Ölümcül Gateway çıkışlarında, kapanış zaman aşımlarında ve yeniden başlatma başlangıç hatalarında OpenClaw, kaydedicide olay varsa aynı tanılama anlık görüntüsünü `~/.openclaw/logs/stability/openclaw-stability-*.json` konumuna yazar. En yeni paketi `openclaw gateway stability --bundle latest` ile inceleyin; `--limit`, `--type` ve `--since-seq` paket çıktısına da uygulanır.
  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Hata raporlarına eklenmek üzere tasarlanmış yerel bir tanılama zip'i yazar. Gizlilik modeli ve paket içeriği için bkz. [Tanılama Dışa Aktarımı](/tr/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Çıktı zip yolu. Varsayılan olarak durum dizini altında bir destek dışa aktarımı kullanılır.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Dahil edilecek en fazla temizlenmiş günlük satırı.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Denetlenecek en fazla günlük baytı.
</ParamField>
<ParamField path="--url <url>" type="string">
  Sağlık anlık görüntüsü için Gateway WebSocket URL'si.
</ParamField>
<ParamField path="--token <token>" type="string">
  Sağlık anlık görüntüsü için Gateway belirteci.
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

Dışa aktarma; bir manifest, bir Markdown özeti, yapılandırma şekli, temizlenmiş yapılandırma ayrıntıları, temizlenmiş günlük özetleri, temizlenmiş Gateway durum/sağlık anlık görüntüleri ve mevcutsa en yeni kararlılık paketini içerir.

Paylaşılması amaçlanır. Hata ayıklamaya yardımcı olan operasyonel ayrıntıları saklar; örneğin güvenli OpenClaw günlük alanları, alt sistem adları, durum kodları, süreler, yapılandırılmış modlar, bağlantı noktaları, Plugin kimlikleri, sağlayıcı kimlikleri, gizli olmayan özellik ayarları ve sansürlenmiş operasyonel günlük iletileri. Sohbet metnini, Webhook gövdelerini, araç çıktılarını, kimlik bilgilerini, çerezleri, hesap/mesaj tanımlayıcılarını, istem/yönerge metnini, ana makine adlarını ve gizli değerleri çıkarır veya sansürler. Bir LogTape tarzı ileti kullanıcı/sohbet/araç yük metni gibi görünüyorsa, dışa aktarma yalnızca bir iletinin çıkarıldığını ve bayt sayısını tutar.

### `gateway status`

`gateway status`, Gateway hizmetini (launchd/systemd/schtasks) ve isteğe bağlı olarak bağlantı/kimlik doğrulama yeteneğinin probunu gösterir.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Açık bir prob hedefi ekle. Yapılandırılmış uzak + localhost yine de prob edilir.
</ParamField>
<ParamField path="--token <token>" type="string">
  Prob için belirteç kimlik doğrulaması.
</ParamField>
<ParamField path="--password <password>" type="string">
  Prob için parola kimlik doğrulaması.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Prob zaman aşımı.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Bağlantı probunu atla (yalnızca hizmet görünümü).
</ParamField>
<ParamField path="--deep" type="boolean">
  Sistem düzeyindeki hizmetleri de tara.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Varsayılan bağlantı probunu bir okuma probuna yükselt ve bu okuma probu başarısız olursa sıfır olmayan kodla çık. `--no-probe` ile birlikte kullanılamaz.
</ParamField>

<AccordionGroup>
  <Accordion title="Durum semantiği">
    - `gateway status`, yerel CLI yapılandırması eksik veya geçersiz olsa bile tanılama için kullanılabilir olmaya devam eder.
    - Varsayılan `gateway status`, hizmet durumunu, WebSocket bağlantısını ve el sıkışma anında görülebilen kimlik doğrulama yeteneğini kanıtlar. Okuma/yazma/yönetici işlemlerini kanıtlamaz.
    - İlk cihaz kimlik doğrulaması için tanılama probları değişiklik yapmaz: mevcut önbelleğe alınmış bir cihaz belirteci varsa onu yeniden kullanırlar, ancak yalnızca durumu kontrol etmek için yeni bir CLI cihaz kimliği veya salt okunur cihaz eşleştirme kaydı oluşturmazlar.
    - `gateway status`, mümkün olduğunda prob kimlik doğrulaması için yapılandırılmış auth SecretRef'leri çözümler.
    - Gerekli bir auth SecretRef bu komut yolunda çözümlenemezse, `gateway status --json`, prob bağlantısı/kimlik doğrulaması başarısız olduğunda `rpc.authWarning` bildirir; `--token`/`--password` değerlerini açıkça verin veya önce gizli kaynak kaynağını çözün.
    - Prob başarılı olursa, yanlış pozitifleri önlemek için çözümlenmemiş auth-ref uyarıları bastırılır.
    - Dinleyen bir hizmetin yeterli olmadığı ve okuma kapsamlı RPC çağrılarının da sağlıklı olması gerektiği betikler ve otomasyonlarda `--require-rpc` kullanın.
    - `--deep`, ek launchd/systemd/schtasks kurulumları için en iyi çabayla tarama ekler. Birden fazla gateway benzeri hizmet algılandığında, insan tarafından okunabilir çıktı temizlik ipuçları yazdırır ve çoğu kurulumun makine başına bir gateway çalıştırması gerektiği konusunda uyarır.
    - İnsan tarafından okunabilir çıktı, profil veya durum dizini kaymasını tanılamaya yardımcı olmak için çözümlenmiş dosya günlük yolunu ve CLI ile hizmet yapılandırma yolları/geçerlilik anlık görüntüsünü içerir.
  </Accordion>
  <Accordion title="Linux systemd auth-drift denetimleri">
    - Linux systemd kurulumlarında hizmet auth drift denetimleri, birimden hem `Environment=` hem `EnvironmentFile=` değerlerini okur (`%h`, tırnaklı yollar, birden fazla dosya ve isteğe bağlı `-` dosyaları dahil).
    - Drift denetimleri, birleştirilmiş çalışma zamanı env kullanarak `gateway.auth.token` SecretRef'lerini çözümler (önce hizmet komutu env, sonra süreç env geri dönüşü).
    - Belirteç kimlik doğrulaması fiilen etkin değilse (açık `gateway.auth.mode` değeri `password`/`none`/`trusted-proxy` ise veya mod ayarsız olup parolanın kazanabildiği ve hiçbir belirteç adayının kazanamadığı durumlarda), belirteç drift denetimleri yapılandırma belirteci çözümlemesini atlar.
  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe`, "her şeyi hata ayıkla" komutudur. Her zaman şunları prob eder:

- yapılandırılmış uzak gateway'inizi (ayarlıysa) ve
- localhost'u (loopback) **uzak yapılandırılmış olsa bile**.

`--url` verirseniz, bu açık hedef her ikisinin de önüne eklenir. İnsan tarafından okunabilir çıktı hedefleri şu şekilde etiketler:

- `URL (explicit)`
- `Remote (configured)` veya `Remote (configured, inactive)`
- `Local loopback`

<Note>
Birden fazla gateway erişilebilir durumdaysa, hepsini yazdırır. İzole profiller/bağlantı noktaları kullandığınızda (örneğin bir kurtarma botu) birden fazla gateway desteklenir, ancak çoğu kurulum yine de tek bir gateway çalıştırır.
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
    - `Read probe: limited - missing scope: operator.read`, bağlantının başarılı olduğu ancak okuma kapsamlı RPC'nin sınırlı olduğu anlamına gelir. Bu, tam hata olarak değil **bozulmuş** erişilebilirlik olarak bildirilir.
    - `gateway status` gibi prob da mevcut önbelleğe alınmış cihaz kimlik doğrulamasını yeniden kullanır, ancak ilk kullanım cihaz kimliği veya eşleştirme durumu oluşturmaz.
    - Çıkış kodu yalnızca prob edilen hedeflerin hiçbiri erişilebilir değilse sıfır olmayan olur.
  </Accordion>
  <Accordion title="JSON çıktısı">
    Üst düzey:

    - `ok`: en az bir hedef erişilebilir.
    - `degraded`: en az bir hedefte kapsamı sınırlı ayrıntı RPC vardı.
    - `capability`: erişilebilir hedefler arasında görülen en iyi yetenek (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` veya `unknown`).
    - `primaryTargetId`: şu sırayla etkin kazanan olarak kabul edilecek en iyi hedef: açık URL, SSH tüneli, yapılandırılmış uzak, ardından yerel loopback.
    - `warnings[]`: `code`, `message` ve isteğe bağlı `targetIds` içeren en iyi çaba uyarı kayıtları.
    - `network`: geçerli yapılandırma ve ana makine ağından türetilen yerel loopback/tailnet URL ipuçları.
    - `discovery.timeoutMs` ve `discovery.count`: bu prob geçişi için kullanılan gerçek keşif bütçesi/sonuç sayısı.

    Hedef başına (`targets[].connect`):

    - `ok`: bağlantı + bozulmuş sınıflandırmadan sonra erişilebilirlik.
    - `rpcOk`: tam ayrıntı RPC başarısı.
    - `scopeLimited`: eksik işlemci kapsamı nedeniyle ayrıntı RPC başarısız oldu.

    Hedef başına (`targets[].auth`):

    - `role`: mevcutsa `hello-ok` içinde bildirilen kimlik doğrulama rolü.
    - `scopes`: mevcutsa `hello-ok` içinde bildirilen verilmiş kapsamlar.
    - `capability`: bu hedef için görünen kimlik doğrulama yetenek sınıflandırması.

  </Accordion>
  <Accordion title="Yaygın uyarı kodları">
    - `ssh_tunnel_failed`: SSH tüneli kurulumu başarısız oldu; komut doğrudan problara geri döndü.
    - `multiple_gateways`: birden fazla hedef erişilebilirdi; kurtarma botu gibi izole profilleri kasıtlı olarak çalıştırmıyorsanız bu alışılmadıktır.
    - `auth_secretref_unresolved`: yapılandırılmış bir auth SecretRef, başarısız bir hedef için çözümlenemedi.
    - `probe_scope_limited`: WebSocket bağlantısı başarılı oldu, ancak okuma probu eksik `operator.read` nedeniyle sınırlıydı.
  </Accordion>
</AccordionGroup>

#### SSH üzerinden uzak (Mac uygulaması eşdeğeri)

macOS uygulamasının "Remote over SSH" modu, uzak gateway'in (yalnızca loopback'e bağlı olsa bile) `ws://127.0.0.1:<port>` adresinden erişilebilir olması için yerel bir bağlantı noktası yönlendirme kullanır.

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
  Çözümlenen keşif uç noktasından ilk keşfedilen gateway ana makinesini SSH hedefi olarak seç (`local.` artı varsa yapılandırılmış geniş alan etki alanı). Yalnızca TXT ipuçları yok sayılır.
</ParamField>

Yapılandırma (isteğe bağlı, varsayılan olarak kullanılır):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Düşük düzeyli RPC yardımcısı.

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
  Daha çok nihai bir yükten önce ara olaylar akıtan aracı tarzı RPC'ler için.
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

<AccordionGroup>
  <Accordion title="Komut seçenekleri">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`
  </Accordion>
  <Accordion title="Hizmet kurulumu ve yaşam döngüsü notları">
    - `gateway install`, `--port`, `--runtime`, `--token`, `--force`, `--json` destekler.
    - Yönetilen bir hizmeti yeniden başlatmak için `gateway restart` kullanın. Yeniden başlatma yerine `gateway stop` ve `gateway start` zincirlemeyin; macOS'te `gateway stop`, bilerek LaunchAgent'i durdurmadan önce devre dışı bırakır.
    - Belirteç kimlik doğrulaması belirteç gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, `gateway install` SecretRef'in çözümlenebilir olduğunu doğrular ancak çözümlenen belirteci hizmet ortamı meta verisine kalıcı olarak yazmaz.
    - Belirteç kimlik doğrulaması belirteç gerektiriyorsa ve yapılandırılmış belirteç SecretRef çözümlenmemişse, kurulum geri dönüş düz metni kalıcılaştırmak yerine kapalı başarısız olur.
    - `gateway run` üzerinde parola kimlik doğrulaması için satır içi `--password` yerine `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` veya SecretRef destekli `gateway.auth.password` tercih edin.
    - Çıkarımsal kimlik doğrulama modunda yalnızca kabukta bulunan `OPENCLAW_GATEWAY_PASSWORD`, kurulum belirteç gereksinimlerini gevşetmez; yönetilen bir hizmet kurarken kalıcı yapılandırma (`gateway.auth.password` veya config `env`) kullanın.
    - Hem `gateway.auth.token` hem `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarsızsa, mod açıkça ayarlanana kadar kurulum engellenir.
    - Yaşam döngüsü komutları betikleme için `--json` kabul eder.
  </Accordion>
</AccordionGroup>

## Gateway'leri keşfedin (Bonjour)

`gateway discover`, Gateway işaretçilerini (`_openclaw-gw._tcp`) tarar.

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Geniş Alan Bonjour): bir etki alanı seçin (örnek: `openclaw.internal.`) ve split DNS + DNS sunucusu kurun; bkz. [Bonjour](/tr/gateway/bonjour).

Yalnızca Bonjour keşfi etkin olan gateway'ler (varsayılan) işaretçiyi duyurur.

Geniş Alan keşif kayıtları (TXT) şunları içerir:

- `role` (gateway rol ipucu)
- `transport` (taşıma ipucu, örn. `gateway`)
- `gatewayPort` (WebSocket bağlantı noktası, genellikle `18789`)
- `sshPort` (isteğe bağlı; istemciler yoksa SSH hedeflerini varsayılan olarak `22` kabul eder)
- `tailnetDns` (varsa MagicDNS ana makine adı)
- `gatewayTls` / `gatewayTlsSha256` (TLS etkin + sertifika parmak izi)
- `cliPath` (geniş alan bölgesine yazılmış uzak kurulum ipucu)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Komut başına zaman aşımı (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir çıktı (stili/spinner'ı da devre dışı bırakır).
</ParamField>

Örnekler:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI, `local.` artı etkinse yapılandırılmış geniş alan etki alanını tarar.
- JSON çıktısındaki `wsUrl`, `lanHost` veya `tailnetDns` gibi yalnızca TXT ipuçlarından değil, çözümlenmiş hizmet uç noktasından türetilir.
- `local.` mDNS üzerinde `sshPort` ve `cliPath`, yalnızca `discovery.mdns.mode` değeri `full` olduğunda yayınlanır. Geniş alan DNS-SD yine de `cliPath` yazar; `sshPort` orada da isteğe bağlı kalır.
</Note>

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway runbook](/tr/gateway)
