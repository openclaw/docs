---
read_when:
    - Gateway'i CLI üzerinden çalıştırma (geliştirme veya sunucular)
    - Gateway kimlik doğrulamasında, bağlama modlarında ve bağlantıda hata ayıklama
    - Bonjour ile Gateway'leri keşfetme (yerel + geniş alan DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateway'leri çalıştırma, sorgulama ve keşfetme
title: Gateway
x-i18n:
    generated_at: "2026-05-01T08:58:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 127a6ccb4baa1ad5e5051db0bc7ef0ed30d410c4c3d13f36356483a6e03dce4c
    source_path: cli/gateway.md
    workflow: 16
---

Gateway, OpenClaw'ın WebSocket sunucusudur (kanallar, düğümler, oturumlar, hook'lar). Bu sayfadaki alt komutlar `openclaw gateway …` altında yer alır.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/tr/gateway/bonjour">
    Yerel mDNS + geniş alan DNS-SD kurulumu.
  </Card>
  <Card title="Discovery overview" href="/tr/gateway/discovery">
    OpenClaw'ın gateway'leri nasıl duyurduğu ve bulduğu.
  </Card>
  <Card title="Configuration" href="/tr/gateway/configuration">
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
  <Accordion title="Startup behavior">
    - Varsayılan olarak Gateway, `~/.openclaw/openclaw.json` içinde `gateway.mode=local` ayarlanmadıkça başlamayı reddeder. Geçici/geliştirme çalıştırmaları için `--allow-unconfigured` kullanın.
    - `openclaw onboard --mode local` ve `openclaw setup` komutlarının `gateway.mode=local` yazması beklenir. Dosya varsa ancak `gateway.mode` eksikse, bunu local modun örtük olarak varsayılması yerine bozuk veya üzerine yazılmış bir yapılandırma olarak ele alın ve onarın.
    - Dosya varsa ve `gateway.mode` eksikse Gateway bunu şüpheli yapılandırma hasarı olarak değerlendirir ve sizin için "local tahmini" yapmayı reddeder.
    - Kimlik doğrulama olmadan loopback dışına bağlanma engellenir (güvenlik korkuluğu).
    - Yetkilendirildiğinde `SIGUSR1` işlem içinde yeniden başlatmayı tetikler (`commands.restart` varsayılan olarak etkindir; manuel yeniden başlatmayı engellemek için `commands.restart: false` ayarlayın, gateway aracı/yapılandırma uygula/güncelleme izinli kalır).
    - `SIGINT`/`SIGTERM` işleyicileri gateway işlemini durdurur, ancak özel terminal durumlarını geri yüklemez. CLI'ı bir TUI veya raw-mode girişle sararsanız, çıkmadan önce terminali geri yükleyin.

  </Accordion>
</AccordionGroup>

### Seçenekler

<ParamField path="--port <port>" type="number">
  WebSocket portu (varsayılan config/env'den gelir; genellikle `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Dinleyici bağlama modu.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Kimlik doğrulama modu geçersiz kılması.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token geçersiz kılması (işlem için `OPENCLAW_GATEWAY_TOKEN` değerini de ayarlar).
</ParamField>
<ParamField path="--password <password>" type="string">
  Parola geçersiz kılması.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Gateway parolasını bir dosyadan oku.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Gateway'i Tailscale üzerinden açığa çıkar.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Kapanışta Tailscale serve/funnel yapılandırmasını sıfırla.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Yapılandırmada `gateway.mode=local` olmadan gateway başlatmaya izin ver. Başlangıç korumasını yalnızca geçici/geliştirme bootstrap için atlar; yapılandırma dosyasını yazmaz veya onarmaz.
</ParamField>
<ParamField path="--dev" type="boolean">
  Eksikse geliştirme yapılandırması + çalışma alanı oluşturur (`BOOTSTRAP.md` atlanır).
</ParamField>
<ParamField path="--reset" type="boolean">
  Geliştirme yapılandırmasını + kimlik bilgilerini + oturumları + çalışma alanını sıfırlar (`--dev` gerektirir).
</ParamField>
<ParamField path="--force" type="boolean">
  Başlamadan önce seçilen porttaki mevcut dinleyicileri sonlandır.
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
  Ham model stream olaylarını jsonl'ye günlüğe yaz.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ham stream jsonl yolu.
</ParamField>

<Warning>
Satır içi `--password` yerel işlem listelerinde açığa çıkabilir. `--password-file`, env veya SecretRef destekli `gateway.auth.password` tercih edin.
</Warning>

### Başlangıç profilleme

- Gateway başlangıcı sırasında aşama zamanlamalarını, aşama başına `eventLoopMax` gecikmesini ve kurulu dizin, manifest registry, başlangıç planlaması ve owner-map işleri için plugin arama tablosu zamanlamalarını günlüğe yazmak için `OPENCLAW_GATEWAY_STARTUP_TRACE=1` ayarlayın.
- Harici QA harness'ları için en iyi çaba JSONL başlangıç tanılama zaman çizelgesi yazmak üzere `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` ile `OPENCLAW_DIAGNOSTICS=timeline` ayarlayın. Bayrağı yapılandırmada `diagnostics.flags: ["timeline"]` ile de etkinleştirebilirsiniz; yol yine env üzerinden sağlanır. Olay döngüsü örneklerini eklemek için `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` ekleyin.
- Gateway başlangıcını benchmark etmek için `pnpm test:startup:gateway -- --runs 5 --warmup 1` çalıştırın. Benchmark ilk işlem çıktısını, `/healthz`, `/readyz`, başlangıç izleme zamanlamalarını, olay döngüsü gecikmesini ve plugin arama tablosu zamanlama ayrıntılarını kaydeder.

## Çalışan bir Gateway'i sorgulama

Tüm sorgu komutları WebSocket RPC kullanır.

<Tabs>
  <Tab title="Output modes">
    - Varsayılan: insan tarafından okunabilir (TTY'de renkli).
    - `--json`: makine tarafından okunabilir JSON (stil/spinner yok).
    - `--no-color` (veya `NO_COLOR=1`): insan düzenini korurken ANSI'yi devre dışı bırakır.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: Gateway WebSocket URL'si.
    - `--token <token>`: Gateway token'ı.
    - `--password <password>`: Gateway parolası.
    - `--timeout <ms>`: zaman aşımı/bütçe (komuta göre değişir).
    - `--expect-final`: "final" yanıtını bekle (ajan çağrıları).

  </Tab>
</Tabs>

<Note>
`--url` ayarladığınızda CLI yapılandırmaya veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` değerini açıkça iletin. Açık kimlik bilgilerinin eksik olması bir hatadır.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` uç noktası bir canlılık denetimidir: sunucu HTTP'ye yanıt verebildiğinde döner. HTTP `/readyz` uç noktası daha katıdır ve başlangıç plugin runtime bağımlılıkları, sidecar'lar, kanallar veya yapılandırılmış hook'lar hâlâ yerleşirken kırmızı kalır. Yerel veya kimliği doğrulanmış ayrıntılı readiness yanıtları, olay döngüsü gecikmesi, olay döngüsü kullanımı, CPU çekirdek oranı ve `degraded` bayrağı içeren bir `eventLoop` tanılama bloğu içerir.

### `gateway usage-cost`

Oturum günlüklerinden kullanım maliyeti özetlerini getir.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Dahil edilecek gün sayısı.
</ParamField>

### `gateway stability`

Çalışan bir Gateway'den son tanılama kararlılığı kaydedicisini getir.

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
  Çalışan Gateway'i çağırmak yerine kalıcı bir kararlılık bundle'ı oku. Durum dizini altındaki en yeni bundle için `--bundle latest` (veya yalnızca `--bundle`) kullanın ya da doğrudan bir bundle JSON yolu iletin.
</ParamField>
<ParamField path="--export" type="boolean">
  Kararlılık ayrıntılarını yazdırmak yerine paylaşılabilir bir destek tanılama zip'i yaz.
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` için çıktı yolu.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - Kayıtlar operasyonel meta verileri tutar: olay adları, sayımlar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/plugin adları ve redakte edilmiş oturum özetleri. Sohbet metni, webhook gövdeleri, araç çıktıları, ham istek veya yanıt gövdeleri, token'lar, çerezler, gizli değerler, host adları veya ham oturum kimlikleri tutulmaz. Kaydediciyi tamamen devre dışı bırakmak için `diagnostics.enabled: false` ayarlayın.
    - Ölümcül Gateway çıkışlarında, kapanış zaman aşımlarında ve yeniden başlatma başlangıç hatalarında OpenClaw, kaydedicide olaylar varsa aynı tanılama anlık görüntüsünü `~/.openclaw/logs/stability/openclaw-stability-*.json` konumuna yazar. En yeni bundle'ı `openclaw gateway stability --bundle latest` ile inceleyin; `--limit`, `--type` ve `--since-seq` bundle çıktısına da uygulanır.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Hata raporlarına eklenmek üzere tasarlanmış yerel bir tanılama zip'i yaz. Gizlilik modeli ve bundle içerikleri için [Diagnostics Export](/tr/gateway/diagnostics) bölümüne bakın.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Çıktı zip yolu. Varsayılan olarak durum dizini altında bir destek dışa aktarımıdır.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Dahil edilecek en fazla sanitize edilmiş günlük satırı.
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
  Yazılan yolu, boyutu ve manifest'i JSON olarak yazdır.
</ParamField>

Dışa aktarım bir manifest, Markdown özeti, yapılandırma şekli, sanitize edilmiş yapılandırma ayrıntıları, sanitize edilmiş günlük özetleri, sanitize edilmiş Gateway durum/sağlık anlık görüntüleri ve varsa en yeni kararlılık bundle'ını içerir.

Paylaşılmak üzere tasarlanmıştır. Güvenli OpenClaw günlük alanları, alt sistem adları, durum kodları, süreler, yapılandırılmış modlar, portlar, plugin kimlikleri, sağlayıcı kimlikleri, gizli olmayan özellik ayarları ve redakte edilmiş operasyonel günlük mesajları gibi hata ayıklamaya yardımcı operasyonel ayrıntıları tutar. Sohbet metni, webhook gövdeleri, araç çıktıları, kimlik bilgileri, çerezler, hesap/mesaj tanımlayıcıları, prompt/talimat metni, host adları ve gizli değerleri çıkarır veya redakte eder. LogTape tarzı bir mesaj kullanıcı/sohbet/araç payload metnine benzediğinde, dışa aktarım yalnızca mesajın çıkarıldığını ve bayt sayısını tutar.

### `gateway status`

`gateway status`, Gateway hizmetini (launchd/systemd/schtasks) ve isteğe bağlı bir bağlantı/kimlik doğrulama yeteneği denetimini gösterir.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Açık bir denetim hedefi ekle. Yapılandırılmış uzak + localhost yine de denetlenir.
</ParamField>
<ParamField path="--token <token>" type="string">
  Denetim için token kimlik doğrulaması.
</ParamField>
<ParamField path="--password <password>" type="string">
  Denetim için parola kimlik doğrulaması.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Denetim zaman aşımı.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Bağlantı denetimini atla (yalnızca hizmet görünümü).
</ParamField>
<ParamField path="--deep" type="boolean">
  Sistem düzeyi hizmetleri de tara.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Varsayılan bağlantı denetimini bir okuma denetimine yükselt ve bu okuma denetimi başarısız olduğunda sıfır olmayan kodla çık. `--no-probe` ile birleştirilemez.
</ParamField>

<AccordionGroup>
  <Accordion title="Durum anlamları">
    - `gateway status`, yerel CLI yapılandırması eksik veya geçersiz olsa bile tanılama için kullanılabilir kalır.
    - Varsayılan `gateway status`; hizmet durumunu, WebSocket bağlantısını ve el sıkışma anında görünen kimlik doğrulama yeteneğini kanıtlar. Okuma/yazma/yönetici işlemlerini kanıtlamaz.
    - Tanılama yoklamaları, ilk kez cihaz kimlik doğrulaması için değişiklik yapmaz: mevcut bir önbelleğe alınmış cihaz token'ı varsa bunu yeniden kullanırlar, ancak yalnızca durumu denetlemek için yeni bir CLI cihaz kimliği veya salt okunur cihaz eşleştirme kaydı oluşturmazlar.
    - `gateway status`, mümkün olduğunda yoklama kimlik doğrulaması için yapılandırılmış kimlik doğrulama SecretRef'lerini çözümler.
    - Bu komut yolunda gerekli bir kimlik doğrulama SecretRef'i çözümlenmemişse, yoklama bağlantısı/kimlik doğrulaması başarısız olduğunda `gateway status --json` `rpc.authWarning` bildirir; `--token`/`--password` değerini açıkça iletin veya önce gizli kaynak değerini çözümleyin.
    - Yoklama başarılı olursa, yanlış pozitifleri önlemek için çözümlenmemiş auth-ref uyarıları bastırılır.
    - Dinleyen bir hizmet yeterli olmadığında ve okuma kapsamlı RPC çağrılarının da sağlıklı olması gerektiğinde betiklerde ve otomasyonda `--require-rpc` kullanın.
    - `--deep`, ek launchd/systemd/schtasks kurulumları için en iyi çabayla bir tarama ekler. Birden çok Gateway benzeri hizmet algılandığında, insan çıktısı temizlik ipuçları yazdırır ve çoğu kurulumun makine başına bir Gateway çalıştırması gerektiği konusunda uyarır.
    - İnsan çıktısı, profil veya state-dir sapmasını tanılamaya yardımcı olmak için çözümlenmiş dosya günlük yolunu ve CLI ile hizmet yapılandırma yolları/geçerlilik anlık görüntüsünü içerir.

  </Accordion>
  <Accordion title="Linux systemd kimlik doğrulama sapması denetimleri">
    - Linux systemd kurulumlarında, hizmet kimlik doğrulama sapması denetimleri birimden hem `Environment=` hem de `EnvironmentFile=` değerlerini okur (`%h`, tırnak içine alınmış yollar, birden çok dosya ve isteğe bağlı `-` dosyaları dahil).
    - Sapma denetimleri, birleştirilmiş çalışma zamanı env değerini kullanarak `gateway.auth.token` SecretRef'lerini çözümler (önce hizmet komutu env, ardından süreç env yedeği).
    - Token kimlik doğrulaması etkin biçimde aktif değilse (açık `gateway.auth.mode` değeri `password`/`none`/`trusted-proxy` ise veya parola kazanabilirken mod ayarlanmamışsa ve hiçbir token adayı kazanamıyorsa), token sapması denetimleri yapılandırma token çözümlemesini atlar.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe`, "her şeyi hata ayıkla" komutudur. Her zaman şunları yoklar:

- yapılandırılmış uzak gateway'iniz (ayarlanmışsa) ve
- localhost (loopback), **uzak yapılandırılmış olsa bile**.

`--url` iletirseniz, bu açık hedef her ikisinin önüne eklenir. İnsan çıktısı hedefleri şöyle etiketler:

- `URL (explicit)`
- `Remote (configured)` veya `Remote (configured, inactive)`
- `Local loopback`

<Note>
Birden çok gateway erişilebilirse, hepsini yazdırır. Yalıtılmış profiller/portlar kullandığınızda (ör. bir kurtarma botu) birden çok gateway desteklenir, ancak çoğu kurulum yine de tek bir gateway çalıştırır.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Yorumlama">
    - `Reachable: yes`, en az bir hedefin WebSocket bağlantısını kabul ettiği anlamına gelir.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only`, yoklamanın kimlik doğrulama hakkında kanıtlayabildiği şeyi bildirir. Erişilebilirlikten ayrıdır.
    - `Read probe: ok`, okuma kapsamlı ayrıntı RPC çağrılarının (`health`/`status`/`system-presence`/`config.get`) da başarılı olduğu anlamına gelir.
    - `Read probe: limited - missing scope: operator.read`, bağlantının başarılı olduğunu ancak okuma kapsamlı RPC'nin sınırlı olduğunu belirtir. Bu, tam başarısızlık olarak değil, **bozulmuş** erişilebilirlik olarak bildirilir.
    - `Connect: ok` sonrasında `Read probe: failed`, Gateway'in WebSocket bağlantısını kabul ettiği, ancak takip eden okuma tanılamalarının zaman aşımına uğradığı veya başarısız olduğu anlamına gelir. Bu da erişilemeyen Gateway değil, **bozulmuş** erişilebilirliktir.
    - `gateway status` gibi probe da mevcut önbelleğe alınmış cihaz kimlik doğrulamasını yeniden kullanır, ancak ilk kez cihaz kimliği veya eşleştirme durumu oluşturmaz.
    - Çıkış kodu yalnızca yoklanan hiçbir hedef erişilebilir olmadığında sıfırdan farklıdır.

  </Accordion>
  <Accordion title="JSON çıktısı">
    Üst düzey:

    - `ok`: en az bir hedef erişilebilir.
    - `degraded`: en az bir hedef bağlantı kabul etti ancak tam ayrıntı RPC tanılamalarını tamamlamadı.
    - `capability`: erişilebilir hedefler arasında görülen en iyi yetenek (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` veya `unknown`).
    - `primaryTargetId`: bu sırayla etkin kazanan olarak ele alınacak en iyi hedef: açık URL, SSH tüneli, yapılandırılmış uzak, ardından local loopback.
    - `warnings[]`: `code`, `message` ve isteğe bağlı `targetIds` içeren en iyi çaba uyarı kayıtları.
    - `network`: mevcut yapılandırmadan ve ana makine ağ yapılandırmasından türetilen local loopback/tailnet URL ipuçları.
    - `discovery.timeoutMs` ve `discovery.count`: bu yoklama geçişi için kullanılan gerçek keşif bütçesi/sonuç sayısı.

    Hedef başına (`targets[].connect`):

    - `ok`: bağlantı + bozulmuş sınıflandırma sonrası erişilebilirlik.
    - `rpcOk`: tam ayrıntı RPC başarısı.
    - `scopeLimited`: eksik operator kapsamı nedeniyle ayrıntı RPC başarısız oldu.

    Hedef başına (`targets[].auth`):

    - `role`: varsa `hello-ok` içinde bildirilen kimlik doğrulama rolü.
    - `scopes`: varsa `hello-ok` içinde bildirilen verilmiş kapsamlar.
    - `capability`: ilgili hedef için yüzeye çıkarılan kimlik doğrulama yeteneği sınıflandırması.

  </Accordion>
  <Accordion title="Yaygın uyarı kodları">
    - `ssh_tunnel_failed`: SSH tüneli kurulumu başarısız oldu; komut doğrudan yoklamalara geri döndü.
    - `multiple_gateways`: birden fazla hedef erişilebilirdi; kurtarma botu gibi yalıtılmış profilleri bilerek çalıştırmadığınız sürece bu olağan dışıdır.
    - `auth_secretref_unresolved`: yapılandırılmış bir kimlik doğrulama SecretRef'i başarısız bir hedef için çözümlenemedi.
    - `probe_scope_limited`: WebSocket bağlantısı başarılı oldu, ancak okuma yoklaması eksik `operator.read` nedeniyle sınırlıydı.

  </Accordion>
</AccordionGroup>

#### SSH üzerinden uzak (Mac uygulaması eşdeğerliği)

macOS uygulamasındaki "Remote over SSH" modu, uzak gateway'in (yalnızca loopback'e bağlanmış olabilir) `ws://127.0.0.1:<port>` adresinde erişilebilir olmasını sağlamak için yerel port yönlendirme kullanır.

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
  Çözümlenmiş keşif uç noktasından (`local.` artı varsa yapılandırılmış geniş alan etki alanı) ilk keşfedilen gateway ana makinesini SSH hedefi olarak seçer. Yalnızca TXT ipuçları yok sayılır.
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
  Parametreler için JSON nesne dizesi.
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
  Esas olarak, nihai yükten önce ara olaylar akışı yapan ajan tarzı RPC'ler içindir.
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

### Bir wrapper ile kurulum

Yönetilen hizmetin başka bir yürütülebilir dosya üzerinden başlatılması gerektiğinde `--wrapper` kullanın; örneğin bir gizli yönetici ara katmanı veya farklı kullanıcıyla çalıştırma yardımcısı. Wrapper, normal Gateway argümanlarını alır ve sonunda bu argümanlarla `openclaw` ya da Node'u exec etmekten sorumludur.

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

Wrapper'ı ortam üzerinden de ayarlayabilirsiniz. `gateway install`, yolun yürütülebilir bir dosya olduğunu doğrular, wrapper'ı hizmet `ProgramArguments` içine yazar ve daha sonra zorunlu yeniden kurulumlar, güncellemeler ve doctor onarımları için hizmet ortamında `OPENCLAW_WRAPPER` değerini kalıcı hale getirir.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Kalıcı bir wrapper'ı kaldırmak için yeniden kurulum sırasında `OPENCLAW_WRAPPER` değerini temizleyin:

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
    - Yönetilen bir hizmeti yeniden başlatmak için `gateway restart` kullanın. Yeniden başlatma yerine `gateway stop` ve `gateway start` komutlarını zincirlemeyin; macOS'te `gateway stop`, durdurmadan önce LaunchAgent'ı kasıtlı olarak devre dışı bırakır.
    - Yaşam döngüsü komutları betikleme için `--json` kabul eder.

  </Accordion>
  <Accordion title="Kurulum zamanında kimlik doğrulama ve SecretRef'ler">
    - Token kimlik doğrulaması bir token gerektirdiğinde ve `gateway.auth.token` SecretRef ile yönetildiğinde, `gateway install` SecretRef'in çözümlenebilir olduğunu doğrular ancak çözümlenmiş token'ı hizmet ortamı meta verilerine kalıcı olarak yazmaz.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef'i çözümlenmemişse, kurulum yedek düz metni kalıcılaştırmak yerine kapalı şekilde başarısız olur.
    - `gateway run` üzerinde parola kimlik doğrulaması için satır içi `--password` yerine `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` veya SecretRef destekli `gateway.auth.password` tercih edin.
    - Çıkarımsal kimlik doğrulama modunda, yalnızca kabuktaki `OPENCLAW_GATEWAY_PASSWORD` kurulum token gereksinimlerini gevşetmez; yönetilen bir hizmet kurarken dayanıklı yapılandırma (`gateway.auth.password` veya config `env`) kullanın.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar kurulum engellenir.

  </Accordion>
</AccordionGroup>

## Gateway'leri keşfedin (Bonjour)

`gateway discover`, Gateway beacon'larını (`_openclaw-gw._tcp`) tarar.

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Geniş Alan Bonjour): bir etki alanı seçin (örnek: `openclaw.internal.`) ve split DNS + bir DNS sunucusu kurun; bkz. [Bonjour](/tr/gateway/bonjour).

Yalnızca Bonjour keşfi etkin olan Gateway'ler (varsayılan) beacon'ın reklamını yapar.

Geniş Alan keşif kayıtları şunları içerir (TXT):

- `role` (gateway rol ipucu)
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
  Komut başına zaman aşımı (göz atma/çözümleme).
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir çıktı (stil/spinner'ı da devre dışı bırakır).
</ParamField>

Örnekler:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI, etkinleştirildiğinde `local.` ile yapılandırılmış geniş alan etki alanını tarar.
- JSON çıktısındaki `wsUrl`, `lanHost` veya `tailnetDns` gibi yalnızca TXT ipuçlarından değil, çözümlenen hizmet uç noktasından türetilir.
- `local.` mDNS üzerinde `sshPort` ve `cliPath` yalnızca `discovery.mdns.mode` değeri `full` olduğunda yayınlanır. Geniş alan DNS-SD yine de `cliPath` yazar; `sshPort` orada da isteğe bağlı kalır.

</Note>

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway çalışma kitabı](/tr/gateway)
