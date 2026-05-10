---
read_when:
    - Gateway’i CLI’den çalıştırma (geliştirme veya sunucular)
    - Gateway kimlik doğrulaması, bağlama modları ve bağlantı sorunlarını giderme
    - Bonjour aracılığıyla Gateway keşfi (yerel + geniş alan DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateway'leri çalıştırma, sorgulama ve keşfetme
title: Gateway
x-i18n:
    generated_at: "2026-05-10T19:29:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e436abba80f643f3b0bfc0a7d2f344beb18c3849a49e5d0825767ae7a81ae1d
    source_path: cli/gateway.md
    workflow: 16
---

Gateway, OpenClaw'ın WebSocket sunucusudur (kanallar, düğümler, oturumlar, hook'lar). Bu sayfadaki alt komutlar `openclaw gateway …` altında bulunur.

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
  <Accordion title="Başlangıç davranışı">
    - Varsayılan olarak Gateway, `~/.openclaw/openclaw.json` içinde `gateway.mode=local` ayarlanmadığı sürece başlamayı reddeder. Geçici/geliştirme çalıştırmaları için `--allow-unconfigured` kullanın.
    - `openclaw onboard --mode local` ve `openclaw setup` komutlarının `gateway.mode=local` yazması beklenir. Dosya varsa ama `gateway.mode` eksikse, bunu bozuk veya üzerine yazılmış bir yapılandırma olarak ele alın ve yerel modu örtük olarak varsaymak yerine onarın.
    - Dosya varsa ve `gateway.mode` eksikse, Gateway bunu şüpheli yapılandırma hasarı olarak değerlendirir ve sizin için "yereli tahmin etmeyi" reddeder.
    - Kimlik doğrulama olmadan loopback ötesine bağlanma engellenir (güvenlik korkuluğu).
    - `SIGUSR1`, yetkilendirildiğinde süreç içi yeniden başlatmayı tetikler (`commands.restart` varsayılan olarak etkindir; elle yeniden başlatmayı engellemek için `commands.restart: false` ayarlayın, gateway araç/yapılandırma uygulama/güncelleme ise izinli kalır).
    - `SIGINT`/`SIGTERM` işleyicileri gateway sürecini durdurur, ancak özel terminal durumunu geri yüklemez. CLI'ı bir TUI veya raw-mode girişle sarmalıyorsanız, çıkmadan önce terminali geri yükleyin.

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
  Token geçersiz kılması (süreç için `OPENCLAW_GATEWAY_TOKEN` değerini de ayarlar).
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
  Yapılandırmada `gateway.mode=local` olmadan gateway başlatmaya izin verin. Başlangıç korumasını yalnızca geçici/geliştirme bootstrap için atlar; yapılandırma dosyasını yazmaz veya onarmaz.
</ParamField>
<ParamField path="--dev" type="boolean">
  Eksikse geliştirme yapılandırması + çalışma alanı oluşturun (`BOOTSTRAP.md` atlanır).
</ParamField>
<ParamField path="--reset" type="boolean">
  Geliştirme yapılandırmasını + kimlik bilgilerini + oturumları + çalışma alanını sıfırlayın (`--dev` gerektirir).
</ParamField>
<ParamField path="--force" type="boolean">
  Başlatmadan önce seçilen porttaki mevcut dinleyiciyi sonlandırın.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Ayrıntılı günlükler.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Konsolda yalnızca CLI backend günlüklerini gösterin (ve stdout/stderr'ı etkinleştirin).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  WebSocket günlük stili.
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

## Gateway'i Yeniden Başlatma

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe`, çalışan Gateway'den yeniden başlatmadan önce etkin OpenClaw işini ön denetimden geçirmesini ister. Kuyruktaki işlemler, yanıt teslimi, gömülü çalıştırmalar veya görev çalıştırmaları etkinse Gateway engelleyicileri bildirir, yinelenen güvenli yeniden başlatma isteklerini birleştirir ve etkin iş boşaldığında yeniden başlar. Düz `restart`, uyumluluk için mevcut hizmet yöneticisi davranışını korur. `--force` komutunu yalnızca açıkça anında geçersiz kılma yolunu istediğinizde kullanın.

`openclaw gateway restart --safe --skip-deferral`, `--safe` ile aynı OpenClaw-bilinçli koordineli yeniden başlatmayı çalıştırır, ancak etkin iş erteleme geçidini atlar; böylece Gateway, engelleyiciler bildirildiğinde bile yeniden başlatmayı hemen yayınlar. Bir erteleme takılmış bir görev çalıştırması tarafından sabitlendiğinde ve tek başına `--safe` süresiz bekleyeceğinde operatör kaçış yolu olarak kullanın. `--skip-deferral`, `--safe` gerektirir.

<Warning>
Satır içi `--password`, yerel süreç listelerinde açığa çıkabilir. `--password-file`, env veya SecretRef destekli `gateway.auth.password` tercih edin.
</Warning>

### Başlangıç profilleme

- Gateway başlangıcı sırasında faz zamanlamalarını günlüğe kaydetmek için `OPENCLAW_GATEWAY_STARTUP_TRACE=1` ayarlayın; buna faz başına `eventLoopMax` gecikmesi ve kurulu dizin, manifest kayıt defteri, başlangıç planlaması ve owner-map işi için plugin arama tablosu zamanlamaları dahildir.
- Harici QA harness'ları için en iyi çabayla JSONL başlangıç tanılama zaman çizelgesi yazmak üzere `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` ile `OPENCLAW_DIAGNOSTICS=timeline` ayarlayın. Bayrağı yapılandırmada `diagnostics.flags: ["timeline"]` ile de etkinleştirebilirsiniz; yol yine env tarafından sağlanır. Olay döngüsü örneklerini dahil etmek için `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` ekleyin.
- Gateway başlangıcını kıyaslamak için `pnpm test:startup:gateway -- --runs 5 --warmup 1` çalıştırın. Kıyaslama ilk süreç çıktısını, `/healthz`, `/readyz`, başlangıç izleme zamanlamalarını, olay döngüsü gecikmesini ve plugin arama tablosu zamanlama ayrıntılarını kaydeder.

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
    - `--expect-final`: bir "final" yanıtı bekle (ajan çağrıları).

  </Tab>
</Tabs>

<Note>
`--url` ayarladığınızda CLI, yapılandırmaya veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` değerini açıkça geçirin. Açık kimlik bilgilerinin eksik olması hatadır.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` uç noktası bir canlılık probudur: sunucu HTTP yanıtlayabildiğinde döner. HTTP `/readyz` uç noktası daha katıdır ve başlangıç plugin sidecar'ları, kanallar veya yapılandırılmış hook'lar hâlâ yerleşirken kırmızı kalır. Yerel veya kimliği doğrulanmış ayrıntılı readiness yanıtları, olay döngüsü gecikmesi, olay döngüsü kullanımı, CPU çekirdek oranı ve bir `degraded` bayrağı içeren bir `eventLoop` tanılama bloğu içerir.

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

Çalışan bir Gateway'den son tanılama kararlılığı kaydedicisini alın.

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
    - Kayıtlar operasyonel meta verileri tutar: olay adları, sayımlar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/plugin adları ve redakte edilmiş oturum özetleri. Sohbet metni, webhook gövdeleri, araç çıktıları, ham istek veya yanıt gövdeleri, token'lar, cookie'ler, gizli değerler, host adları veya ham oturum kimlikleri tutmazlar. Kaydediciyi tamamen devre dışı bırakmak için `diagnostics.enabled: false` ayarlayın.
    - Ölümcül Gateway çıkışlarında, kapanış zaman aşımlarında ve yeniden başlatma başlangıç hatalarında OpenClaw, kaydedicide olaylar varsa aynı tanılama anlık görüntüsünü `~/.openclaw/logs/stability/openclaw-stability-*.json` dosyasına yazar. En yeni paketi `openclaw gateway stability --bundle latest` ile inceleyin; `--limit`, `--type` ve `--since-seq` paket çıktısına da uygulanır.

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
  Kalıcı kararlılık paketi aramasını atlayın.
</ParamField>
<ParamField path="--json" type="boolean">
  Yazılan yolu, boyutu ve manifesti JSON olarak yazdırın.
</ParamField>

Dışa aktarım bir manifest, Markdown özeti, yapılandırma şekli, temizlenmiş yapılandırma ayrıntıları, temizlenmiş günlük özetleri, temizlenmiş Gateway durum/sağlık anlık görüntüleri ve varsa en yeni kararlılık paketini içerir.

Paylaşılmak üzere tasarlanmıştır. Hata ayıklamaya yardımcı olan operasyonel ayrıntıları tutar; örneğin güvenli OpenClaw günlük alanları, alt sistem adları, durum kodları, süreler, yapılandırılmış modlar, portlar, plugin kimlikleri, sağlayıcı kimlikleri, gizli olmayan özellik ayarları ve redakte edilmiş operasyonel günlük iletileri. Sohbet metni, webhook gövdeleri, araç çıktıları, kimlik bilgileri, cookie'ler, hesap/ileti tanımlayıcıları, prompt/talimat metni, host adları ve gizli değerleri atlar veya redakte eder. LogTape tarzı bir ileti kullanıcı/sohbet/araç yük metni gibi göründüğünde, dışa aktarım yalnızca bir iletinin atlandığını ve bayt sayısını tutar.

### `gateway status`

`gateway status`, Gateway hizmetini (launchd/systemd/schtasks) ve isteğe bağlı bir bağlantı/kimlik doğrulama yeteneği probunu gösterir.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Açık bir yoklama hedefi ekler. Yapılandırılmış uzak + localhost yine de yoklanır.
</ParamField>
<ParamField path="--token <token>" type="string">
  Yoklama için token kimlik doğrulaması.
</ParamField>
<ParamField path="--password <password>" type="string">
  Yoklama için parola kimlik doğrulaması.
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
  Varsayılan bağlantı yoklamasını bir okuma yoklamasına yükselt ve bu okuma yoklaması başarısız olduğunda sıfır olmayan kodla çık. `--no-probe` ile birlikte kullanılamaz.
</ParamField>

<AccordionGroup>
  <Accordion title="Durum semantiği">
    - `gateway status`, yerel CLI yapılandırması eksik veya geçersiz olsa bile tanılama için kullanılabilir kalır.
    - Varsayılan `gateway status`, hizmet durumunu, WebSocket bağlantısını ve el sıkışma zamanında görünen kimlik doğrulama yeteneğini kanıtlar. Okuma/yazma/yönetici işlemlerini kanıtlamaz.
    - Tanılama yoklamaları, ilk kez cihaz kimlik doğrulaması için değişiklik yapmaz: mevcut bir önbelleğe alınmış cihaz token'ı varsa onu yeniden kullanır, ancak yalnızca durumu denetlemek için yeni bir CLI cihaz kimliği veya salt okunur cihaz eşleştirme kaydı oluşturmaz.
    - `gateway status`, mümkün olduğunda yoklama kimlik doğrulaması için yapılandırılmış auth SecretRef'lerini çözer.
    - Bu komut yolunda gerekli bir auth SecretRef çözümlenemezse, yoklama bağlantısı/kimlik doğrulaması başarısız olduğunda `gateway status --json` `rpc.authWarning` bildirir; açıkça `--token`/`--password` geçirin veya önce gizli kaynak bilgisini çözün.
    - Yoklama başarılı olursa, hatalı pozitifleri önlemek için çözümlenmemiş auth-ref uyarıları bastırılır.
    - Dinleyen bir hizmet yeterli olmadığında ve okuma kapsamlı RPC çağrılarının da sağlıklı olması gerektiğinde betiklerde ve otomasyonda `--require-rpc` kullanın.
    - `--deep`, ek launchd/systemd/schtasks kurulumları için en iyi çaba taraması ekler. Birden çok Gateway benzeri hizmet algılandığında, insan çıktısı temizleme ipuçları yazdırır ve çoğu kurulumun makine başına bir Gateway çalıştırması gerektiği konusunda uyarır.
    - `--deep`, hizmet işlemi harici bir denetleyici yeniden başlatması için temiz şekilde çıktığında yakın tarihli bir Gateway denetleyici yeniden başlatma devrini de bildirir.
    - İnsan çıktısı, profil veya state-dir sapmasını tanılamaya yardımcı olmak için çözümlenen dosya günlük yolunu ve CLI ile hizmet yapılandırma yolları/geçerlilik anlık görüntüsünü içerir.

  </Accordion>
  <Accordion title="Linux systemd auth sapması denetimleri">
    - Linux systemd kurulumlarında, hizmet auth sapması denetimleri birimden hem `Environment=` hem de `EnvironmentFile=` değerlerini okur (`%h`, tırnaklı yollar, birden çok dosya ve isteğe bağlı `-` dosyaları dahil).
    - Sapma denetimleri, birleştirilmiş çalışma zamanı env kullanarak `gateway.auth.token` SecretRef'lerini çözer (önce hizmet komutu env, ardından işlem env yedeği).
    - Token kimlik doğrulaması fiilen etkin değilse (açık `gateway.auth.mode` değeri `password`/`none`/`trusted-proxy` ise veya mod ayarlanmamışken parola kazanabiliyor ve hiçbir token adayı kazanamıyorsa), token sapması denetimleri yapılandırma token çözümlemesini atlar.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe`, "her şeyi hata ayıkla" komutudur. Her zaman şunları yoklar:

- yapılandırılmış uzak gateway'iniz (ayarlanmışsa) ve
- uzak yapılandırılmış olsa bile localhost (local loopback).

`--url` geçirirseniz, bu açık hedef ikisinin de önüne eklenir. İnsan çıktısı hedefleri şöyle etiketler:

- `URL (açık)`
- `Uzak (yapılandırılmış)` veya `Uzak (yapılandırılmış, etkin değil)`
- `Local loopback`

<Note>
Birden çok Gateway erişilebilirse, hepsini yazdırır. Yalıtılmış profiller/portlar kullandığınızda birden çok Gateway desteklenir (ör. kurtarma botu), ancak çoğu kurulum yine tek bir Gateway çalıştırır.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Yorumlama">
    - `Reachable: yes`, en az bir hedefin WebSocket bağlantısını kabul ettiği anlamına gelir.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only`, yoklamanın auth hakkında kanıtlayabildiklerini bildirir. Erişilebilirlikten ayrıdır.
    - `Read probe: ok`, okuma kapsamlı ayrıntı RPC çağrılarının (`health`/`status`/`system-presence`/`config.get`) da başarılı olduğu anlamına gelir.
    - `Read probe: limited - missing scope: operator.read`, bağlantının başarılı olduğu ancak okuma kapsamlı RPC'nin sınırlı olduğu anlamına gelir. Bu, tam hata değil **bozulmuş** erişilebilirlik olarak bildirilir.
    - `Connect: ok` sonrasında `Read probe: failed`, Gateway'in WebSocket bağlantısını kabul ettiği, ancak takip eden okuma tanılamalarının zaman aşımına uğradığı veya başarısız olduğu anlamına gelir. Bu da erişilemeyen bir Gateway değil, **bozulmuş** erişilebilirliktir.
    - `gateway status` gibi, probe mevcut önbelleğe alınmış cihaz auth bilgisini yeniden kullanır ancak ilk kez cihaz kimliği veya eşleştirme durumu oluşturmaz.
    - Çıkış kodu yalnızca yoklanan hiçbir hedef erişilebilir olmadığında sıfır olmayan değerdir.

  </Accordion>
  <Accordion title="JSON çıktısı">
    Üst düzey:

    - `ok`: en az bir hedef erişilebilir.
    - `degraded`: en az bir hedef bağlantıyı kabul etti ancak tam ayrıntı RPC tanılamalarını tamamlamadı.
    - `capability`: erişilebilir hedefler genelinde görülen en iyi yetenek (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` veya `unknown`).
    - `primaryTargetId`: şu sırada etkin kazanan olarak ele alınacak en iyi hedef: açık URL, SSH tüneli, yapılandırılmış uzak ve ardından local loopback.
    - `warnings[]`: `code`, `message` ve isteğe bağlı `targetIds` içeren en iyi çaba uyarı kayıtları.
    - `network`: geçerli yapılandırmadan ve ana makine ağından türetilen local loopback/tailnet URL ipuçları.
    - `discovery.timeoutMs` ve `discovery.count`: bu yoklama geçişi için kullanılan gerçek keşif bütçesi/sonuç sayısı.

    Hedef başına (`targets[].connect`):

    - `ok`: bağlantı + bozulmuş sınıflandırması sonrasında erişilebilirlik.
    - `rpcOk`: tam ayrıntı RPC başarısı.
    - `scopeLimited`: ayrıntı RPC, eksik operatör kapsamı nedeniyle başarısız oldu.

    Hedef başına (`targets[].auth`):

    - `role`: mevcut olduğunda `hello-ok` içinde bildirilen auth rolü.
    - `scopes`: mevcut olduğunda `hello-ok` içinde bildirilen verilen kapsamlar.
    - `capability`: bu hedef için yüzeye çıkarılan auth yetenek sınıflandırması.

  </Accordion>
  <Accordion title="Yaygın uyarı kodları">
    - `ssh_tunnel_failed`: SSH tüneli kurulumu başarısız oldu; komut doğrudan yoklamalara geri döndü.
    - `multiple_gateways`: birden fazla hedef erişilebilir durumdaydı; kurtarma botu gibi yalıtılmış profilleri kasıtlı olarak çalıştırmıyorsanız bu olağan dışıdır.
    - `auth_secretref_unresolved`: yapılandırılmış bir auth SecretRef, başarısız bir hedef için çözümlenemedi.
    - `probe_scope_limited`: WebSocket bağlantısı başarılı oldu, ancak okuma yoklaması eksik `operator.read` nedeniyle sınırlıydı.

  </Accordion>
</AccordionGroup>

#### SSH üzerinden uzak (Mac uygulaması eşdeğerliği)

macOS uygulamasındaki "SSH üzerinden uzak" modu, uzak gateway'in (yalnızca loopback'e bağlanmış olabilir) `ws://127.0.0.1:<port>` adresinden erişilebilir hale gelmesi için yerel bir port yönlendirmesi kullanır.

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
  Çözümlenen keşif uç noktasından ilk keşfedilen gateway ana makinesini SSH hedefi olarak seçer (`local.` artı yapılandırılmış geniş alan domain'i, varsa). Yalnızca TXT ipuçları yok sayılır.
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
  Başlıca nihai yükten önce ara olayları akış olarak veren agent tarzı RPC'ler içindir.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir JSON çıktısı.
</ParamField>

<Note>
`--params` geçerli JSON olmalıdır.
</Note>

## Gateway hizmetini yönetme

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Sarmalayıcıyla kurma

Yönetilen hizmet başka bir yürütülebilir dosya üzerinden başlatılmak zorundaysa `--wrapper` kullanın; örneğin bir
secrets manager shim'i veya run-as yardımcısı. Sarmalayıcı normal Gateway argümanlarını alır ve
sonunda bu argümanlarla `openclaw` ya da Node'u exec etmekten sorumludur.

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
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Yaşam döngüsü davranışı">
    - Yönetilen bir hizmeti yeniden başlatmak için `gateway restart` kullanın. Yeniden başlatma yerine `gateway stop` ve `gateway start` komutlarını zincirlemeyin.
    - macOS üzerinde `gateway stop` varsayılan olarak `launchctl bootout` kullanır; bu, LaunchAgent'ı kalıcı bir devre dışı bırakma yapmadan mevcut önyükleme oturumundan kaldırır — KeepAlive otomatik kurtarması gelecekteki çökmeler için etkin kalır ve `gateway start`, manuel `launchctl enable` gerektirmeden temiz biçimde yeniden etkinleştirir. KeepAlive ve RunAtLoad davranışını kalıcı olarak bastırmak için `--disable` geçin; böylece gateway bir sonraki açık `gateway start` komutuna kadar yeniden doğmaz. Manuel durdurmanın yeniden başlatmalar veya sistem yeniden başlatmaları sonrasında da sürmesi gerektiğinde bunu kullanın.
    - `gateway restart --safe`, çalışan Gateway'den etkin OpenClaw işlerini ön kontrolden geçirmesini ve yanıt teslimi, gömülü çalıştırmalar ve görev çalıştırmaları boşalana kadar yeniden başlatmayı ertelemesini ister. `--safe`, `--force` veya `--wait` ile birlikte kullanılamaz.
    - `gateway restart --wait 30s`, yapılandırılmış yeniden başlatma boşaltma bütçesini o yeniden başlatma için geçersiz kılar. Birimsiz sayılar milisaniyedir; `s`, `m` ve `h` gibi birimler kabul edilir. `--wait 0` süresiz olarak bekler.
    - `gateway restart --safe --skip-deferral`, OpenClaw farkındalıklı güvenli yeniden başlatmayı çalıştırır ancak erteleme geçidini atlar; böylece engelleyiciler bildirilse bile Gateway yeniden başlatmayı hemen yayar. Takılmış görev çalıştırması ertelemeleri için operatör kaçış yoludur; `--safe` gerektirir.
    - `gateway restart --force`, etkin iş boşaltmasını atlar ve hemen yeniden başlatır. Bir operatör listelenen görev engelleyicilerini zaten incelediğinde ve gateway'i hemen geri getirmek istediğinde kullanın.
    - Yaşam döngüsü komutları betikleme için `--json` kabul eder.

  </Accordion>
  <Accordion title="Kurulum zamanında kimlik doğrulama ve SecretRef'ler">
    - Token kimlik doğrulaması bir token gerektirdiğinde ve `gateway.auth.token` SecretRef yönetimli olduğunda, `gateway install` SecretRef'in çözülebilir olduğunu doğrular ancak çözümlenen token'ı hizmet ortamı meta verilerine kalıcı olarak yazmaz.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef'i çözümlenemiyorsa, kurulum yedek düz metni kalıcı olarak yazmak yerine kapalı şekilde başarısız olur.
    - `gateway run` üzerinde parola kimlik doğrulaması için satır içi `--password` yerine `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` veya SecretRef destekli `gateway.auth.password` tercih edin.
    - Çıkarımsal kimlik doğrulama modunda, yalnızca kabukta bulunan `OPENCLAW_GATEWAY_PASSWORD` kurulum token gereksinimlerini gevşetmez; yönetilen bir hizmet kurarken kalıcı yapılandırma (`gateway.auth.password` veya yapılandırma `env`) kullanın.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar kurulum engellenir.

  </Accordion>
</AccordionGroup>

## Gateway'leri keşfet (Bonjour)

`gateway discover`, Gateway işaretçilerini (`_openclaw-gw._tcp`) tarar.

- Çok noktaya yayın DNS-SD: `local.`
- Tek noktaya yayın DNS-SD (Geniş Alan Bonjour): bir etki alanı seçin (örnek: `openclaw.internal.`) ve bölünmüş DNS + bir DNS sunucusu kurun; bkz. [Bonjour](/tr/gateway/bonjour).

Yalnızca Bonjour keşfi etkinleştirilmiş Gateway'ler (varsayılan) işaretçiyi duyurur.

Geniş Alan keşif kayıtları şunları içerir (TXT):

- `role` (gateway rol ipucu)
- `transport` (taşıma ipucu, ör. `gateway`)
- `gatewayPort` (WebSocket portu, genellikle `18789`)
- `sshPort` (isteğe bağlı; istemciler yokken varsayılan SSH hedeflerini `22` olarak alır)
- `tailnetDns` (varsa MagicDNS ana makine adı)
- `gatewayTls` / `gatewayTlsSha256` (TLS etkin + sertifika parmak izi)
- `cliPath` (geniş alan bölgesine yazılan uzaktan kurulum ipucu)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Komut başına zaman aşımı (göz atma/çözümleme).
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
- CLI, `local.` ile birlikte etkinleştirilmişse yapılandırılmış geniş alan etki alanını tarar.
- JSON çıktısındaki `wsUrl`, `lanHost` veya `tailnetDns` gibi yalnızca TXT ipuçlarından değil, çözümlenen hizmet uç noktasından türetilir.
- `local.` mDNS üzerinde, `sshPort` ve `cliPath` yalnızca `discovery.mdns.mode` değeri `full` olduğunda yayınlanır. Geniş alan DNS-SD yine de `cliPath` yazar; `sshPort` orada da isteğe bağlı kalır.

</Note>

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway işletim kılavuzu](/tr/gateway)
