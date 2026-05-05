---
read_when:
    - CLI üzerinden Gateway çalıştırma (geliştirme veya sunucular)
    - Gateway kimlik doğrulamasında, bağlama modlarında ve bağlantıda hata ayıklama
    - Bonjour aracılığıyla Gateway'leri keşfetme (yerel + geniş alan DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateway'leri çalıştırın, sorgulayın ve keşfedin
title: Gateway
x-i18n:
    generated_at: "2026-05-05T01:44:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 521558189b150b2faa22f95ec32419ac9e02c5f47c72b9095f40d1432840c038
    source_path: cli/gateway.md
    workflow: 16
---

Gateway, OpenClaw'ın WebSocket sunucusudur (kanallar, düğümler, oturumlar, kancalar). Bu sayfadaki alt komutlar `openclaw gateway …` altında yer alır.

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

## Gateway'i çalıştırın

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
    - `openclaw onboard --mode local` ve `openclaw setup` komutlarının `gateway.mode=local` yazması beklenir. Dosya varsa ancak `gateway.mode` eksikse, bunu yerel modun örtük olduğu varsayımı yerine bozuk veya üzerine yazılmış bir yapılandırma olarak ele alın ve onarın.
    - Dosya varsa ve `gateway.mode` eksikse, Gateway bunu şüpheli yapılandırma hasarı olarak değerlendirir ve sizin için "yereli tahmin etmeyi" reddeder.
    - Kimlik doğrulama olmadan loopback dışına bağlanma engellenir (güvenlik koruması).
    - Yetkilendirildiğinde `SIGUSR1` işlem içinde yeniden başlatmayı tetikler (`commands.restart` varsayılan olarak etkindir; manuel yeniden başlatmayı engellemek için `commands.restart: false` ayarlayın, Gateway araç/yapılandırma uygula/güncelleme izinli kalır).
    - `SIGINT`/`SIGTERM` işleyicileri Gateway işlemini durdurur, ancak özel terminal durumunu geri yüklemez. CLI'ı bir TUI veya raw-mode girdisiyle sarmalarsanız, çıkmadan önce terminali geri yükleyin.

  </Accordion>
</AccordionGroup>

### Seçenekler

<ParamField path="--port <port>" type="number">
  WebSocket portu (varsayılan yapılandırma/env'den gelir; genellikle `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Dinleyici bağlama modu.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Kimlik doğrulama modu geçersiz kılma.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token geçersiz kılma (işlem için `OPENCLAW_GATEWAY_TOKEN` değerini de ayarlar).
</ParamField>
<ParamField path="--password <password>" type="string">
  Parola geçersiz kılma.
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
  Başlatmadan önce seçilen porttaki mevcut dinleyiciyi sonlandırın.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Ayrıntılı günlükler.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Konsolda yalnızca CLI arka uç günlüklerini gösterin (ve stdout/stderr'ı etkinleştirin).
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

## Gateway'i yeniden başlatın

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe`, çalışan Gateway'den yeniden başlatmadan önce etkin OpenClaw işlerini ön kontrolden geçirmesini ister. Kuyruğa alınmış işlemler, yanıt teslimi, gömülü çalıştırmalar veya görev çalıştırmaları etkinse, Gateway engelleyicileri bildirir, yinelenen güvenli yeniden başlatma isteklerini birleştirir ve etkin iş boşaldığında yeniden başlatır. Düz `restart`, uyumluluk için mevcut hizmet yöneticisi davranışını korur. `--force` seçeneğini yalnızca açıkça anında geçersiz kılma yolunu istediğinizde kullanın.

<Warning>
Satır içi `--password` yerel işlem listelerinde açığa çıkabilir. `--password-file`, env veya SecretRef destekli bir `gateway.auth.password` tercih edin.
</Warning>

### Başlatma profilleme

- Gateway başlatması sırasında faz zamanlamalarını günlüğe kaydetmek için `OPENCLAW_GATEWAY_STARTUP_TRACE=1` ayarlayın; buna faz başına `eventLoopMax` gecikmesi ve kurulu dizin, manifest kayıt defteri, başlatma planlama ve sahip haritası işi için Plugin arama tablosu zamanlamaları dahildir.
- Harici QA koşumları için en iyi çaba JSONL başlatma tanılama zaman çizelgesi yazmak üzere `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` ile `OPENCLAW_DIAGNOSTICS=timeline` ayarlayın. Bayrağı yapılandırmada `diagnostics.flags: ["timeline"]` ile de etkinleştirebilirsiniz; yol yine env tarafından sağlanır. Olay döngüsü örneklerini dahil etmek için `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` ekleyin.
- Gateway başlatmasını karşılaştırmalı ölçmek için `pnpm test:startup:gateway -- --runs 5 --warmup 1` çalıştırın. Karşılaştırma, ilk işlem çıktısını, `/healthz`, `/readyz`, başlatma izleme zamanlamalarını, olay döngüsü gecikmesini ve Plugin arama tablosu zamanlama ayrıntılarını kaydeder.

## Çalışan bir Gateway'i sorgulayın

Tüm sorgu komutları WebSocket RPC kullanır.

<Tabs>
  <Tab title="Çıktı modları">
    - Varsayılan: insan tarafından okunabilir (TTY'de renkli).
    - `--json`: makine tarafından okunabilir JSON (stil/döndürücü yok).
    - `--no-color` (veya `NO_COLOR=1`): insan düzenini korurken ANSI'yi devre dışı bırakır.

  </Tab>
  <Tab title="Paylaşılan seçenekler">
    - `--url <url>`: Gateway WebSocket URL'si.
    - `--token <token>`: Gateway token'ı.
    - `--password <password>`: Gateway parolası.
    - `--timeout <ms>`: zaman aşımı/bütçe (komuta göre değişir).
    - `--expect-final`: bir "son" yanıt bekleyin (ajan çağrıları).

  </Tab>
</Tabs>

<Note>
`--url` ayarladığınızda, CLI yapılandırma veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` değerini açıkça iletin. Açık kimlik bilgilerinin eksik olması bir hatadır.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` uç noktası bir canlılık yoklamasıdır: sunucu HTTP'ye yanıt verebildiğinde döner. HTTP `/readyz` uç noktası daha katıdır ve başlatma Plugin yan süreçleri, kanallar veya yapılandırılmış kancalar hâlâ yerleşirken kırmızı kalır. Yerel veya kimliği doğrulanmış ayrıntılı hazır olma yanıtları, olay döngüsü gecikmesi, olay döngüsü kullanımı, CPU çekirdek oranı ve bir `degraded` bayrağı içeren bir `eventLoop` tanılama bloğu içerir.

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
  Dahil edilecek en fazla son olay sayısı (maks `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  `payload.large` veya `diagnostic.memory.pressure` gibi tanılama olay türüne göre filtreleyin.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Yalnızca bir tanılama sıra numarasından sonraki olayları dahil edin.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Çalışan Gateway'i çağırmak yerine kalıcı hale getirilmiş bir kararlılık paketini okuyun. Durum dizininin altındaki en yeni paket için `--bundle latest` (veya yalnızca `--bundle`) kullanın ya da doğrudan bir paket JSON yolu iletin.
</ParamField>
<ParamField path="--export" type="boolean">
  Kararlılık ayrıntılarını yazdırmak yerine paylaşılabilir bir destek tanılama zip'i yazın.
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` için çıktı yolu.
</ParamField>

<AccordionGroup>
  <Accordion title="Gizlilik ve paket davranışı">
    - Kayıtlar operasyonel meta verileri tutar: olay adları, sayımlar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/Plugin adları ve redakte edilmiş oturum özetleri. Sohbet metnini, Webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, token'ları, çerezleri, gizli değerleri, ana makine adlarını veya ham oturum kimliklerini tutmazlar. Kaydediciyi tamamen devre dışı bırakmak için `diagnostics.enabled: false` ayarlayın.
    - Ölümcül Gateway çıkışlarında, kapanış zaman aşımlarında ve yeniden başlatma başlatma hatalarında, kaydedicide olaylar olduğunda OpenClaw aynı tanılama anlık görüntüsünü `~/.openclaw/logs/stability/openclaw-stability-*.json` konumuna yazar. En yeni paketi `openclaw gateway stability --bundle latest` ile inceleyin; `--limit`, `--type` ve `--since-seq` paket çıktısına da uygulanır.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Hata raporlarına eklenmek üzere tasarlanmış yerel bir tanılama zip'i yazın. Gizlilik modeli ve paket içerikleri için bkz. [Tanılama Dışa Aktarımı](/tr/gateway/diagnostics).

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

Paylaşılmak üzere tasarlanmıştır. Hata ayıklamaya yardımcı olan operasyonel ayrıntıları tutar; güvenli OpenClaw günlük alanları, alt sistem adları, durum kodları, süreler, yapılandırılmış modlar, portlar, Plugin kimlikleri, sağlayıcı kimlikleri, gizli olmayan özellik ayarları ve redakte edilmiş operasyonel günlük iletileri gibi. Sohbet metnini, Webhook gövdelerini, araç çıktılarını, kimlik bilgilerini, çerezleri, hesap/ileti tanımlayıcılarını, istem/talimat metnini, ana makine adlarını ve gizli değerleri atlar veya redakte eder. LogTape tarzı bir ileti kullanıcı/sohbet/araç yük metni gibi göründüğünde, dışa aktarım yalnızca bir iletinin atlandığını ve bayt sayısını tutar.

### `gateway status`

`gateway status`, Gateway hizmetini (launchd/systemd/schtasks) ve isteğe bağlı bir bağlantı/kimlik doğrulama yeteneği yoklamasını gösterir.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Açık bir yoklama hedefi ekler. Yapılandırılmış uzak + localhost hâlâ yoklanır.
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
  Bağlantı yoklamasını atla (yalnızca servis görünümü).
</ParamField>
<ParamField path="--deep" type="boolean">
  Sistem düzeyi servisleri de tara.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Varsayılan bağlantı yoklamasını bir okuma yoklamasına yükseltir ve bu okuma yoklaması başarısız olduğunda sıfır olmayan kodla çıkar. `--no-probe` ile birlikte kullanılamaz.
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - `gateway status`, yerel CLI yapılandırması eksik veya geçersiz olsa bile tanılama için kullanılabilir kalır.
    - Varsayılan `gateway status`, servis durumunu, WebSocket bağlantısını ve el sıkışma sırasında görünen kimlik doğrulama yeteneğini kanıtlar. Okuma/yazma/yönetici işlemlerini kanıtlamaz.
    - Tanılama yoklamaları, ilk kez cihaz kimlik doğrulaması için değişiklik yapmaz: varsa mevcut önbelleğe alınmış cihaz token'ını yeniden kullanır, ancak yalnızca durumu denetlemek için yeni bir CLI cihaz kimliği veya salt okunur cihaz eşleştirme kaydı oluşturmaz.
    - `gateway status`, mümkün olduğunda yoklama kimlik doğrulaması için yapılandırılmış auth SecretRef'lerini çözer.
    - Gerekli bir auth SecretRef bu komut yolunda çözümlenemezse, yoklama bağlantısı/kimlik doğrulaması başarısız olduğunda `gateway status --json` `rpc.authWarning` bildirir; `--token`/`--password` değerini açıkça geçirin veya önce gizli kaynak kaynağını çözün.
    - Yoklama başarılı olursa, yanlış pozitifleri önlemek için çözümlenmemiş auth-ref uyarıları bastırılır.
    - Dinleyen bir servis yeterli olmadığında ve okuma kapsamlı RPC çağrılarının da sağlıklı olması gerektiğinde betiklerde ve otomasyonda `--require-rpc` kullanın.
    - `--deep`, ek launchd/systemd/schtasks kurulumları için en iyi çaba taraması ekler. Birden fazla gateway benzeri servis algılandığında, insan çıktısı temizlik ipuçları yazdırır ve çoğu kurulumun makine başına bir Gateway çalıştırması gerektiği konusunda uyarır.
    - İnsan çıktısı, profil veya state-dir sapmasını tanılamaya yardımcı olmak için çözümlenen dosya günlük yolunu ve CLI ile servis yapılandırma yolları/geçerlilik anlık görüntüsünü içerir.

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - Linux systemd kurulumlarında servis auth drift denetimleri, birimden hem `Environment=` hem de `EnvironmentFile=` değerlerini okur (`%h`, tırnaklı yollar, birden çok dosya ve isteğe bağlı `-` dosyaları dahil).
    - Drift denetimleri, birleştirilmiş çalışma zamanı env kullanarak `gateway.auth.token` SecretRef'lerini çözer (önce servis komut env'si, ardından süreç env yedeği).
    - Token kimlik doğrulaması etkin olarak aktif değilse (`gateway.auth.mode` açıkça `password`/`none`/`trusted-proxy` ise veya parolanın kazanabileceği ve hiçbir token adayının kazanamayacağı şekilde mode ayarlanmamışsa), token-drift denetimleri yapılandırma token çözümlemesini atlar.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe`, "her şeyde hata ayıkla" komutudur. Her zaman şunları yoklar:

- yapılandırılmış uzak gateway'inizi (ayarlanmışsa) ve
- localhost (loopback), **uzak yapılandırılmış olsa bile**.

`--url` geçirirseniz, bu açık hedef ikisinin önüne eklenir. İnsan çıktısı hedefleri şöyle etiketler:

- `URL (explicit)`
- `Remote (configured)` veya `Remote (configured, inactive)`
- `Local loopback`

<Note>
Birden fazla gateway erişilebilir durumdaysa hepsini yazdırır. Yalıtılmış profiller/portlar (ör. kurtarma botu) kullandığınızda birden fazla gateway desteklenir, ancak çoğu kurulum yine de tek bir Gateway çalıştırır.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes`, en az bir hedefin WebSocket bağlantısını kabul ettiği anlamına gelir.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only`, yoklamanın kimlik doğrulama hakkında neyi kanıtlayabildiğini bildirir. Erişilebilirlikten ayrıdır.
    - `Read probe: ok`, okuma kapsamlı ayrıntı RPC çağrılarının (`health`/`status`/`system-presence`/`config.get`) da başarılı olduğu anlamına gelir.
    - `Read probe: limited - missing scope: operator.read`, bağlantının başarılı olduğu ancak okuma kapsamlı RPC'nin sınırlı olduğu anlamına gelir. Bu, tam başarısızlık olarak değil, **degraded** erişilebilirlik olarak bildirilir.
    - `Connect: ok` sonrasında `Read probe: failed`, Gateway'in WebSocket bağlantısını kabul ettiği, ancak takip eden okuma tanılamalarının zaman aşımına uğradığı veya başarısız olduğu anlamına gelir. Bu da erişilemeyen bir Gateway değil, **degraded** erişilebilirliktir.
    - `gateway status` gibi, yoklama mevcut önbelleğe alınmış cihaz kimlik doğrulamasını yeniden kullanır ancak ilk kez cihaz kimliği veya eşleştirme durumu oluşturmaz.
    - Çıkış kodu yalnızca yoklanan hiçbir hedef erişilebilir olmadığında sıfır olmayan değerdir.

  </Accordion>
  <Accordion title="JSON output">
    Üst düzey:

    - `ok`: en az bir hedef erişilebilir.
    - `degraded`: en az bir hedef bağlantıyı kabul etti ancak tam ayrıntı RPC tanılamalarını tamamlamadı.
    - `capability`: erişilebilir hedefler genelinde görülen en iyi yetenek (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` veya `unknown`).
    - `primaryTargetId`: şu sırayla aktif kazanan olarak ele alınacak en iyi hedef: açık URL, SSH tüneli, yapılandırılmış uzak, ardından local loopback.
    - `warnings[]`: `code`, `message` ve isteğe bağlı `targetIds` içeren en iyi çaba uyarı kayıtları.
    - `network`: geçerli yapılandırma ve ana makine ağından türetilen local loopback/tailnet URL ipuçları.
    - `discovery.timeoutMs` ve `discovery.count`: bu yoklama geçişi için kullanılan gerçek keşif bütçesi/sonuç sayısı.

    Hedef başına (`targets[].connect`):

    - `ok`: bağlantı + degraded sınıflandırması sonrası erişilebilirlik.
    - `rpcOk`: tam ayrıntı RPC başarısı.
    - `scopeLimited`: ayrıntı RPC, eksik operator kapsamı nedeniyle başarısız oldu.

    Hedef başına (`targets[].auth`):

    - `role`: varsa `hello-ok` içinde bildirilen auth rolü.
    - `scopes`: varsa `hello-ok` içinde bildirilen verilmiş kapsamlar.
    - `capability`: söz konusu hedef için yüzeye çıkarılan auth yetenek sınıflandırması.

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: SSH tüneli kurulumu başarısız oldu; komut doğrudan yoklamalara geri döndü.
    - `multiple_gateways`: birden fazla hedef erişilebilirdi; kurtarma botu gibi yalıtılmış profilleri kasıtlı olarak çalıştırmıyorsanız bu olağan değildir.
    - `auth_secretref_unresolved`: yapılandırılmış bir auth SecretRef, başarısız bir hedef için çözümlenemedi.
    - `probe_scope_limited`: WebSocket bağlantısı başarılı oldu, ancak okuma yoklaması eksik `operator.read` nedeniyle sınırlı kaldı.

  </Accordion>
</AccordionGroup>

#### SSH üzerinden uzak (Mac uygulaması eşliği)

macOS uygulamasının "Remote over SSH" modu, uzak gateway'in (yalnızca loopback'e bağlı olabilir) `ws://127.0.0.1:<port>` adresinde erişilebilir olması için yerel port yönlendirme kullanır.

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
  Çözümlenen keşif uç noktasından (`local.` artı varsa yapılandırılmış geniş alan alan adı) keşfedilen ilk gateway ana makinesini SSH hedefi olarak seçer. Yalnızca TXT ipuçları yok sayılır.
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
  Params için JSON nesne dizesi.
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
  Başlıca, nihai payload'dan önce ara olayları stream eden agent tarzı RPC'ler için.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir JSON çıktısı.
</ParamField>

<Note>
`--params` geçerli JSON olmalıdır.
</Note>

## Gateway servisini yönetme

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Wrapper ile kurma

Yönetilen servisin başka bir çalıştırılabilir dosya üzerinden başlaması gerektiğinde `--wrapper` kullanın; örneğin bir
gizli bilgi yöneticisi shim'i veya run-as yardımcısı. Wrapper, normal Gateway bağımsız değişkenlerini alır ve sonunda bu bağımsız değişkenlerle
`openclaw` veya Node'u exec'lemekten sorumludur.

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

Wrapper'ı ortam üzerinden de ayarlayabilirsiniz. `gateway install`, yolun
çalıştırılabilir bir dosya olduğunu doğrular, wrapper'ı servis `ProgramArguments` içine yazar ve daha sonraki zorunlu yeniden kurulumlar, güncellemeler ve doctor
onarımları için servis ortamında `OPENCLAW_WRAPPER` değerini kalıcı hale getirir.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Kalıcı bir wrapper'ı kaldırmak için yeniden kurarken `OPENCLAW_WRAPPER` değerini temizleyin:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Command options">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - Yönetilen bir servisi yeniden başlatmak için `gateway restart` kullanın. Yeniden başlatma yerine `gateway stop` ve `gateway start` komutlarını zincirlemeyin; macOS'ta `gateway stop`, durdurmadan önce LaunchAgent'ı kasıtlı olarak devre dışı bırakır.
    - `gateway restart --safe`, çalışan Gateway'den aktif OpenClaw işini ön denetlemesini ve yanıt teslimi, gömülü çalıştırmalar ve görev çalıştırmaları boşalana kadar yeniden başlatmayı ertelemesini ister. `--safe`, `--force` veya `--wait` ile birlikte kullanılamaz.
    - `gateway restart --wait 30s`, bu yeniden başlatma için yapılandırılmış restart drain bütçesini geçersiz kılar. Yalın sayılar milisaniyedir; `s`, `m` ve `h` gibi birimler kabul edilir. `--wait 0` süresiz bekler.
    - `gateway restart --force`, aktif iş drain'ini atlar ve hemen yeniden başlatır. Bir operator listelenen görev engelleyicilerini zaten incelediğinde ve gateway'i hemen geri istediğinde kullanın.
    - Yaşam döngüsü komutları betikleme için `--json` kabul eder.

  </Accordion>
  <Accordion title="Kurulum sırasında kimlik doğrulama ve SecretRef'ler">
    - Token kimlik doğrulaması bir token gerektirdiğinde ve `gateway.auth.token` SecretRef tarafından yönetildiğinde, `gateway install` SecretRef'in çözümlenebilir olduğunu doğrular ancak çözümlenen token'ı hizmet ortamı metadata'sına kalıcı olarak yazmaz.
    - Token kimlik doğrulaması bir token gerektirdiğinde ve yapılandırılmış token SecretRef'i çözümlenemediğinde, kurulum yedek düz metni kalıcı olarak yazmak yerine güvenli biçimde başarısız olur.
    - `gateway run` üzerinde parola kimlik doğrulaması için satır içi `--password` yerine `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` veya SecretRef destekli bir `gateway.auth.password` tercih edin.
    - Çıkarımlı kimlik doğrulama modunda, yalnızca kabukta ayarlanan `OPENCLAW_GATEWAY_PASSWORD` kurulum token gereksinimlerini gevşetmez; yönetilen bir hizmet kurarken kalıcı yapılandırma (`gateway.auth.password` veya yapılandırma `env`) kullanın.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar kurulum engellenir.

  </Accordion>
</AccordionGroup>

## Gateway'leri keşfet (Bonjour)

`gateway discover`, Gateway işaretlerini (`_openclaw-gw._tcp`) tarar.

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Geniş Alan Bonjour): bir domain seçin (örnek: `openclaw.internal.`) ve split DNS + bir DNS sunucusu kurun; bkz. [Bonjour](/tr/gateway/bonjour).

Yalnızca Bonjour keşfi etkinleştirilmiş (varsayılan) Gateway'ler işareti duyurur.

Geniş Alan keşif kayıtları şunları içerir (TXT):

- `role` (Gateway rol ipucu)
- `transport` (aktarım ipucu, ör. `gateway`)
- `gatewayPort` (WebSocket portu, genellikle `18789`)
- `sshPort` (isteğe bağlı; istemciler bu olmadığında SSH hedeflerini varsayılan olarak `22` kabul eder)
- `tailnetDns` (MagicDNS ana makine adı, mevcut olduğunda)
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
  Makine tarafından okunabilir çıktı (stil/spinner kullanımını da devre dışı bırakır).
</ParamField>

Örnekler:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI, `local.` ile birlikte etkinleştirilmişse yapılandırılmış geniş alan domain'ini tarar.
- JSON çıktısındaki `wsUrl`, `lanHost` veya `tailnetDns` gibi yalnızca TXT ipuçlarından değil, çözümlenen hizmet endpoint'inden türetilir.
- `local.` mDNS üzerinde, `sshPort` ve `cliPath` yalnızca `discovery.mdns.mode` değeri `full` olduğunda yayınlanır. Geniş alan DNS-SD yine de `cliPath` yazar; `sshPort` orada da isteğe bağlı kalır.

</Note>

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway runbook](/tr/gateway)
