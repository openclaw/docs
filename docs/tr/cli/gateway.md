---
read_when:
    - Gateway’i CLI’den çalıştırma (geliştirme veya sunucular)
    - Gateway kimlik doğrulaması, bağlama modları ve bağlantı sorunlarını giderme
    - Bonjour aracılığıyla Gateway'leri keşfetme (yerel + geniş alan DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gateway'leri çalıştırın, sorgulayın ve keşfedin
title: Gateway
x-i18n:
    generated_at: "2026-05-11T20:26:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 774753c844909d1ec9257f2035b10c2561432ec2161351e9a6438cd12f7f2ecc
    source_path: cli/gateway.md
    workflow: 16
---

Gateway, OpenClaw'ın WebSocket sunucusudur (kanallar, düğümler, oturumlar, hook'lar). Bu sayfadaki alt komutlar `openclaw gateway …` altında yer alır.

<CardGroup cols={3}>
  <Card title="Bonjour keşfi" href="/tr/gateway/bonjour">
    Yerel mDNS + geniş alan DNS-SD kurulumu.
  </Card>
  <Card title="Keşif genel bakışı" href="/tr/gateway/discovery">
    OpenClaw'ın gateway'leri nasıl duyurduğu ve bulduğu.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration">
    Üst düzey gateway yapılandırma anahtarları.
  </Card>
</CardGroup>

## Gateway'i Çalıştırma

Yerel bir Gateway işlemi çalıştırın:

```bash
openclaw gateway
```

Ön plan alias'ı:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Başlatma davranışı">
    - Varsayılan olarak Gateway, `~/.openclaw/openclaw.json` içinde `gateway.mode=local` ayarlanmadığı sürece başlamayı reddeder. Geçici/geliştirme çalıştırmaları için `--allow-unconfigured` kullanın.
    - `openclaw onboard --mode local` ve `openclaw setup` komutlarının `gateway.mode=local` yazması beklenir. Dosya mevcut ancak `gateway.mode` eksikse, bunu örtük olarak yerel mod varsaymak yerine bozuk veya üzerine yazılmış bir yapılandırma olarak ele alın ve onarın.
    - Dosya mevcutsa ve `gateway.mode` eksikse, Gateway bunu şüpheli yapılandırma hasarı olarak değerlendirir ve sizin için "yereli tahmin etmeyi" reddeder.
    - Kimlik doğrulama olmadan loopback dışına bağlanma engellenir (güvenlik koruması).
    - Yetkilendirildiğinde `SIGUSR1` işlem içi yeniden başlatmayı tetikler (`commands.restart` varsayılan olarak etkindir; manuel yeniden başlatmayı engellemek için `commands.restart: false` ayarlayın, gateway araç/yapılandırma apply/update işlemleri izinli kalır).
    - `SIGINT`/`SIGTERM` işleyicileri gateway işlemini durdurur, ancak özel terminal durumunu geri yüklemez. CLI'yi bir TUI veya raw-mode girişle sararsanız, çıkmadan önce terminali geri yükleyin.

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
  Gateway parolasını bir dosyadan oku.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Gateway'i Tailscale üzerinden dışa aç.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Kapanışta Tailscale serve/funnel yapılandırmasını sıfırla.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Yapılandırmada `gateway.mode=local` olmadan gateway başlatmaya izin ver. Yalnızca geçici/geliştirme bootstrap için başlatma korumasını atlar; yapılandırma dosyasını yazmaz veya onarmaz.
</ParamField>
<ParamField path="--dev" type="boolean">
  Eksikse geliştirme yapılandırması + çalışma alanı oluştur (`BOOTSTRAP.md` atlanır).
</ParamField>
<ParamField path="--reset" type="boolean">
  Geliştirme yapılandırmasını + kimlik bilgilerini + oturumları + çalışma alanını sıfırla (`--dev` gerektirir).
</ParamField>
<ParamField path="--force" type="boolean">
  Başlamadan önce seçilen porttaki mevcut dinleyiciyi sonlandır.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Ayrıntılı günlükler.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Konsolda yalnızca CLI backend günlüklerini göster (ve stdout/stderr'i etkinleştir).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Websocket günlük stili.
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact` için alias.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Ham model stream olaylarını jsonl'ye günlüğe yaz.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ham stream jsonl yolu.
</ParamField>

## Gateway'i Yeniden Başlatma

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe`, çalışan Gateway'den yeniden başlatmadan önce etkin OpenClaw işini ön kontrolden geçirmesini ister. Kuyrukta işlemler, yanıt teslimi, gömülü çalıştırmalar veya görev çalıştırmaları etkinse, Gateway engelleyicileri bildirir, yinelenen güvenli yeniden başlatma isteklerini birleştirir ve etkin iş boşaldığında yeniden başlatır. Düz `restart`, uyumluluk için mevcut servis yöneticisi davranışını korur. `--force` seçeneğini yalnızca açıkça anlık geçersiz kılma yolunu istediğinizde kullanın.

`openclaw gateway restart --safe --skip-deferral`, `--safe` ile aynı OpenClaw farkındalıklı koordineli yeniden başlatmayı çalıştırır, ancak etkin iş erteleme kapısını atlar; böylece engelleyiciler bildirilse bile Gateway yeniden başlatmayı hemen yayar. Bir erteleme takılı kalmış bir görev çalıştırması tarafından sabitlendiğinde ve yalnızca `--safe` süresiz bekleyecekken bunu operatör kaçış yolu olarak kullanın. `--skip-deferral`, `--safe` gerektirir.

<Warning>
Satır içi `--password` yerel işlem listelerinde görünebilir. `--password-file`, env veya SecretRef destekli `gateway.auth.password` tercih edin.
</Warning>

### Başlatma profilleme

- Gateway başlatması sırasında aşama zamanlamalarını günlüğe yazmak için `OPENCLAW_GATEWAY_STARTUP_TRACE=1` ayarlayın; buna aşama başına `eventLoopMax` gecikmesi ve installed-index, manifest registry, startup planning ve owner-map işi için plugin lookup-table zamanlamaları dahildir.
- Harici QA harness'ları için best-effort JSONL başlatma diagnostics timeline yazmak üzere `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` ile `OPENCLAW_DIAGNOSTICS=timeline` ayarlayın. Bayrağı yapılandırmada `diagnostics.flags: ["timeline"]` ile de etkinleştirebilirsiniz; yol yine env tarafından sağlanır. Event-loop örneklerini dahil etmek için `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` ekleyin.
- Gateway başlatmasını karşılaştırmalı ölçmek için `pnpm test:startup:gateway -- --runs 5 --warmup 1` çalıştırın. Benchmark ilk işlem çıktısını, `/healthz`, `/readyz`, başlatma trace zamanlamalarını, event-loop gecikmesini ve plugin lookup-table zamanlama ayrıntılarını kaydeder.

## Çalışan Bir Gateway'i Sorgulama

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
    - `--expect-final`: "final" yanıtı bekle (agent çağrıları).

  </Tab>
</Tabs>

<Note>
`--url` ayarladığınızda CLI, yapılandırma veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` değerini açıkça iletin. Açık kimlik bilgilerinin eksik olması bir hatadır.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` endpoint'i bir canlılık probudur: sunucu HTTP yanıtlayabildiğinde döner. HTTP `/readyz` endpoint'i daha katıdır ve başlatma plugin sidecar'ları, kanallar veya yapılandırılmış hook'lar hâlâ otururken kırmızı kalır. Yerel veya kimliği doğrulanmış ayrıntılı readiness yanıtları, event-loop gecikmesi, event-loop kullanımı, CPU çekirdek oranı ve `degraded` bayrağı içeren bir `eventLoop` diagnostics bloğu içerir.

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

Çalışan bir Gateway'den son diagnostics stability recorder'ı getir.

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
  `payload.large` veya `diagnostic.memory.pressure` gibi diagnostics olay türüne göre filtrele.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Yalnızca bir diagnostics sıra numarasından sonraki olayları dahil et.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Çalışan Gateway'i çağırmak yerine kalıcı bir stability bundle oku. State dizini altındaki en yeni bundle için `--bundle latest` (veya yalnızca `--bundle`) kullanın ya da doğrudan bir bundle JSON yolu iletin.
</ParamField>
<ParamField path="--export" type="boolean">
  Stability ayrıntılarını yazdırmak yerine paylaşılabilir bir support diagnostics zip'i yaz.
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` için çıktı yolu.
</ParamField>

<AccordionGroup>
  <Accordion title="Gizlilik ve bundle davranışı">
    - Kayıtlar operasyonel metadata tutar: olay adları, sayılar, byte boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/plugin adları ve redakte edilmiş oturum özetleri. Sohbet metni, webhook gövdeleri, araç çıktıları, ham istek veya yanıt gövdeleri, token'lar, cookie'ler, gizli değerler, host adları veya ham oturum kimliklerini tutmazlar. Recorder'ı tamamen devre dışı bırakmak için `diagnostics.enabled: false` ayarlayın.
    - Ölümcül Gateway çıkışlarında, kapanış zaman aşımlarında ve yeniden başlatma başlatma hatalarında, recorder'da olaylar varsa OpenClaw aynı diagnostics snapshot'ını `~/.openclaw/logs/stability/openclaw-stability-*.json` konumuna yazar. En yeni bundle'ı `openclaw gateway stability --bundle latest` ile inceleyin; `--limit`, `--type` ve `--since-seq` bundle çıktısına da uygulanır.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Hata raporlarına eklenmek üzere tasarlanmış yerel bir diagnostics zip'i yaz. Gizlilik modeli ve bundle içerikleri için [Diagnostics Export](/tr/gateway/diagnostics) sayfasına bakın.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Çıktı zip yolu. Varsayılan olarak state dizini altında bir support export kullanır.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Dahil edilecek maksimum temizlenmiş günlük satırı sayısı.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  İncelenecek maksimum günlük byte sayısı.
</ParamField>
<ParamField path="--url <url>" type="string">
  Health snapshot için Gateway WebSocket URL'si.
</ParamField>
<ParamField path="--token <token>" type="string">
  Health snapshot için Gateway token'ı.
</ParamField>
<ParamField path="--password <password>" type="string">
  Health snapshot için Gateway parolası.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Status/health snapshot zaman aşımı.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Kalıcı stability bundle aramasını atla.
</ParamField>
<ParamField path="--json" type="boolean">
  Yazılan yolu, boyutu ve manifest'i JSON olarak yazdır.
</ParamField>

Export; bir manifest, Markdown özeti, yapılandırma şekli, temizlenmiş yapılandırma ayrıntıları, temizlenmiş günlük özetleri, temizlenmiş Gateway status/health snapshot'ları ve varsa en yeni stability bundle'ı içerir.

Paylaşılmak üzere tasarlanmıştır. Hata ayıklamaya yardımcı olan operasyonel ayrıntıları tutar; örneğin güvenli OpenClaw günlük alanları, alt sistem adları, durum kodları, süreler, yapılandırılmış modlar, portlar, plugin kimlikleri, provider kimlikleri, gizli olmayan özellik ayarları ve redakte edilmiş operasyonel günlük mesajları. Sohbet metni, webhook gövdeleri, araç çıktıları, kimlik bilgileri, cookie'ler, hesap/mesaj tanımlayıcıları, prompt/instruction metni, host adları ve gizli değerleri atlar veya redakte eder. LogTape tarzı bir mesaj kullanıcı/sohbet/araç payload metni gibi göründüğünde, export yalnızca bir mesajın atlandığı bilgisini ve byte sayısını tutar.

### `gateway status`

`gateway status`, Gateway servisini (launchd/systemd/schtasks) ve isteğe bağlı bağlantı/kimlik doğrulama capability probunu gösterir.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Açık bir yoklama hedefi ekleyin. Yapılandırılmış uzak + localhost yine de yoklanır.
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
  Sistem düzeyindeki servisleri de tara.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Varsayılan bağlantı yoklamasını okuma yoklamasına yükseltir ve bu okuma yoklaması başarısız olduğunda sıfır olmayan kodla çıkar. `--no-probe` ile birlikte kullanılamaz.
</ParamField>

<AccordionGroup>
  <Accordion title="Durum semantiği">
    - `gateway status`, yerel CLI yapılandırması eksik veya geçersiz olsa bile tanılama için kullanılabilir kalır.
    - Varsayılan `gateway status`, servis durumunu, WebSocket bağlantısını ve el sıkışma anında görünen kimlik doğrulama yeteneğini kanıtlar. Okuma/yazma/yönetici işlemlerini kanıtlamaz.
    - Tanılama yoklamaları, ilk kez cihaz kimlik doğrulaması için değişiklik yapmaz: mevcut önbelleğe alınmış bir cihaz token’ı varsa onu yeniden kullanır, ancak yalnızca durumu denetlemek için yeni bir CLI cihaz kimliği veya salt okunur cihaz eşleştirme kaydı oluşturmaz.
    - `gateway status`, mümkün olduğunda yoklama kimlik doğrulaması için yapılandırılmış auth SecretRefs değerlerini çözer.
    - Bu komut yolunda gerekli bir auth SecretRef çözülemezse, yoklama bağlantısı/kimlik doğrulaması başarısız olduğunda `gateway status --json`, `rpc.authWarning` bildirir; `--token`/`--password` değerlerini açıkça geçirin veya önce gizli kaynak kaynağını çözün.
    - Yoklama başarılı olursa, yanlış pozitifleri önlemek için çözülememiş auth-ref uyarıları bastırılır.
    - Dinleyen bir servis yeterli olmadığında ve okuma kapsamlı RPC çağrılarının da sağlıklı olması gerektiğinde betiklerde ve otomasyonda `--require-rpc` kullanın.
    - `--deep`, ek launchd/systemd/schtasks kurulumları için en iyi çabayla tarama ekler. Birden fazla Gateway benzeri servis algılandığında, insan çıktısı temizlik ipuçları yazdırır ve çoğu kurulumun makine başına bir Gateway çalıştırması gerektiği konusunda uyarır.
    - `--deep`, servis süreci harici bir supervisor yeniden başlatması için temiz şekilde çıktığında yakın tarihli bir Gateway supervisor yeniden başlatma devrini de bildirir.
    - `--deep`, yapılandırma doğrulamasını Plugin farkında modda (`pluginValidation: "full"`) çalıştırır ve yapılandırılmış Plugin manifest uyarılarını (örneğin eksik kanal yapılandırma meta verileri) yüzeye çıkarır; böylece kurulum ve güncelleme smoke kontrolleri bunları yakalar. Varsayılan `gateway status`, Plugin doğrulamasını atlayan hızlı salt okunur yolu korur.
    - İnsan çıktısı, profil veya state-dir kaymasını tanılamaya yardımcı olmak için çözümlenmiş dosya günlük yolunu ve CLI-servis yapılandırma yolları/geçerlilik anlık görüntüsünü içerir.

  </Accordion>
  <Accordion title="Linux systemd auth-kayması kontrolleri">
    - Linux systemd kurulumlarında, servis auth kayması kontrolleri unit içinden hem `Environment=` hem de `EnvironmentFile=` değerlerini okur (`%h`, tırnaklı yollar, birden çok dosya ve isteğe bağlı `-` dosyaları dahil).
    - Kayma kontrolleri, birleştirilmiş çalışma zamanı env ile `gateway.auth.token` SecretRefs değerlerini çözer (önce servis komutu env, ardından süreç env yedeği).
    - Token kimlik doğrulaması etkin olarak aktif değilse (açık `gateway.auth.mode` değeri `password`/`none`/`trusted-proxy` ise veya mod ayarlanmamışken parola kazanabiliyor ve hiçbir token adayı kazanamıyorsa), token-kayması kontrolleri yapılandırma token çözümünü atlar.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe`, "her şeyi hata ayıkla" komutudur. Her zaman şunları yoklar:

- yapılandırılmış uzak gateway’iniz (ayarlanmışsa) ve
- uzak yapılandırılmış olsa bile localhost (loopback).

`--url` geçirirseniz, bu açık hedef ikisinin önüne eklenir. İnsan çıktısı hedefleri şöyle etiketler:

- `URL (açıkça belirtilmiş)`
- `Uzak (yapılandırılmış)` veya `Uzak (yapılandırılmış, etkin değil)`
- `Local loopback`

<Note>
Birden fazla Gateway erişilebilir durumdaysa, hepsini yazdırır. Yalıtılmış profiller/portlar kullandığınızda (ör. bir kurtarma botu) birden fazla Gateway desteklenir, ancak çoğu kurulum yine de tek bir Gateway çalıştırır.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Yorumlama">
    - `Reachable: yes`, en az bir hedefin WebSocket bağlantısını kabul ettiği anlamına gelir.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only`, yoklamanın kimlik doğrulama hakkında kanıtlayabildiği şeyi bildirir. Bu, erişilebilirlikten ayrıdır.
    - `Read probe: ok`, okuma kapsamlı ayrıntı RPC çağrılarının (`health`/`status`/`system-presence`/`config.get`) da başarılı olduğu anlamına gelir.
    - `Read probe: limited - missing scope: operator.read`, bağlantının başarılı olduğu ancak okuma kapsamlı RPC’nin sınırlı olduğu anlamına gelir. Bu, tam hata olarak değil, **bozulmuş** erişilebilirlik olarak bildirilir.
    - `Connect: ok` sonrasında `Read probe: failed`, Gateway’in WebSocket bağlantısını kabul ettiği, ancak devamındaki okuma tanılamalarının zaman aşımına uğradığı veya başarısız olduğu anlamına gelir. Bu da erişilemeyen bir Gateway değil, **bozulmuş** erişilebilirliktir.
    - `gateway status` gibi, probe mevcut önbelleğe alınmış cihaz kimlik doğrulamasını yeniden kullanır ancak ilk kez cihaz kimliği veya eşleştirme durumu oluşturmaz.
    - Çıkış kodu yalnızca hiçbir yoklanan hedef erişilebilir değilse sıfır olmayan değerdir.

  </Accordion>
  <Accordion title="JSON çıktısı">
    Üst düzey:

    - `ok`: en az bir hedef erişilebilir.
    - `degraded`: en az bir hedef bağlantı kabul etti ancak tam ayrıntı RPC tanılamalarını tamamlamadı.
    - `capability`: erişilebilir hedefler genelinde görülen en iyi yetenek (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` veya `unknown`).
    - `primaryTargetId`: şu sırayla aktif kazanan olarak ele alınacak en iyi hedef: açık URL, SSH tüneli, yapılandırılmış uzak, ardından local loopback.
    - `warnings[]`: `code`, `message` ve isteğe bağlı `targetIds` içeren en iyi çaba uyarı kayıtları.
    - `network`: geçerli yapılandırma ve ana makine ağından türetilen local loopback/tailnet URL ipuçları.
    - `discovery.timeoutMs` ve `discovery.count`: bu yoklama geçişi için kullanılan gerçek keşif bütçesi/sonuç sayısı.

    Hedef başına (`targets[].connect`):

    - `ok`: bağlantı + bozulmuş sınıflandırma sonrasında erişilebilirlik.
    - `rpcOk`: tam ayrıntı RPC başarısı.
    - `scopeLimited`: ayrıntı RPC, eksik operator kapsamı nedeniyle başarısız oldu.

    Hedef başına (`targets[].auth`):

    - `role`: kullanılabilir olduğunda `hello-ok` içinde bildirilen auth rolü.
    - `scopes`: kullanılabilir olduğunda `hello-ok` içinde bildirilen verilen kapsamlar.
    - `capability`: bu hedef için yüzeye çıkarılan auth yeteneği sınıflandırması.

  </Accordion>
  <Accordion title="Yaygın uyarı kodları">
    - `ssh_tunnel_failed`: SSH tüneli kurulumu başarısız oldu; komut doğrudan yoklamalara geri döndü.
    - `multiple_gateways`: birden fazla hedef erişilebilirdi; kurtarma botu gibi yalıtılmış profilleri bilerek çalıştırmıyorsanız bu olağan değildir.
    - `auth_secretref_unresolved`: yapılandırılmış bir auth SecretRef, başarısız bir hedef için çözülemedi.
    - `probe_scope_limited`: WebSocket bağlantısı başarılı oldu, ancak okuma yoklaması eksik `operator.read` nedeniyle sınırlıydı.

  </Accordion>
</AccordionGroup>

#### SSH üzerinden uzak (Mac uygulaması eşliği)

macOS uygulamasının "SSH üzerinden uzak" modu, uzak gateway’in (yalnızca loopback’e bağlanmış olabilir) `ws://127.0.0.1:<port>` adresinden erişilebilir olmasını sağlayan yerel port yönlendirme kullanır.

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
  Çözümlenmiş keşif uç noktasından (`local.` artı varsa yapılandırılmış geniş alan domain’i) ilk keşfedilen gateway ana makinesini SSH hedefi olarak seçer. Yalnızca TXT ipuçları yok sayılır.
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
  Parametreler için JSON nesne dizgesi.
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway WebSocket URL’si.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway token’ı.
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway parolası.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Zaman aşımı bütçesi.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Esas olarak nihai payload’dan önce ara olaylar akıtan agent tarzı RPC’ler içindir.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir JSON çıktısı.
</ParamField>

<Note>
`--params` geçerli JSON olmalıdır.
</Note>

## Gateway servisini yönetin

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Bir wrapper ile kurun

Yönetilen servisin başka bir yürütülebilir dosya üzerinden başlaması gerektiğinde `--wrapper` kullanın; örneğin bir
gizli bilgi yöneticisi shim’i veya run-as yardımcısı. Wrapper, normal Gateway argümanlarını alır ve
sonunda bu argümanlarla `openclaw` veya Node’u exec etmekten sorumludur.

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

Wrapper’ı ortam üzerinden de ayarlayabilirsiniz. `gateway install`, yolun
yürütülebilir bir dosya olduğunu doğrular, wrapper’ı servis `ProgramArguments` içine yazar ve daha sonraki zorunlu yeniden kurulumlar, güncellemeler ve doctor
onarımları için servis ortamında `OPENCLAW_WRAPPER` değerini kalıcı hale getirir.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Kalıcı bir wrapper’ı kaldırmak için yeniden kurulum sırasında `OPENCLAW_WRAPPER` değerini temizleyin:

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
    - macOS'te `gateway stop` varsayılan olarak `launchctl bootout` kullanır; bu, LaunchAgent'ı kalıcı bir devre dışı bırakma olmadan geçerli önyükleme oturumundan kaldırır — KeepAlive otomatik kurtarması gelecekteki çökmeler için etkin kalır ve `gateway start`, elle `launchctl enable` gerektirmeden temiz biçimde yeniden etkinleştirir. KeepAlive ve RunAtLoad'u kalıcı olarak bastırmak için `--disable` geçirin; böylece Gateway bir sonraki açık `gateway start` komutuna kadar yeniden doğmaz. Elle durdurmanın yeniden başlatmalardan veya sistem yeniden başlatmalarından sonra da geçerli kalması gerektiğinde bunu kullanın.
    - `gateway restart --safe`, çalışan Gateway'den etkin OpenClaw çalışmalarını önceden denetlemesini ve yanıt teslimi, gömülü çalıştırmalar ve görev çalıştırmaları boşalana kadar yeniden başlatmayı ertelemesini ister. `--safe`, `--force` veya `--wait` ile birlikte kullanılamaz.
    - `gateway restart --wait 30s`, o yeniden başlatma için yapılandırılmış yeniden başlatma boşaltma bütçesini geçersiz kılar. Çıplak sayılar milisaniyedir; `s`, `m` ve `h` gibi birimler kabul edilir. `--wait 0` süresiz bekler.
    - `gateway restart --safe --skip-deferral`, OpenClaw'a duyarlı güvenli yeniden başlatmayı çalıştırır ancak erteleme geçidini atlar; böylece engelleyiciler bildirilse bile Gateway yeniden başlatmayı hemen yayar. Takılmış görev çalıştırması ertelemeleri için operatör kaçış yoludur; `--safe` gerektirir.
    - `gateway restart --force`, etkin çalışma boşaltmasını atlar ve hemen yeniden başlatır. Bir operatör listelenen görev engelleyicilerini zaten incelediyse ve Gateway'in hemen geri gelmesini istiyorsa bunu kullanın.
    - Yaşam döngüsü komutları betik yazımı için `--json` kabul eder.

  </Accordion>
  <Accordion title="Kurulum zamanında kimlik doğrulama ve SecretRef'ler">
    - Token kimlik doğrulaması bir token gerektirdiğinde ve `gateway.auth.token` SecretRef tarafından yönetildiğinde, `gateway install` SecretRef'in çözümlenebilir olduğunu doğrular ancak çözümlenen token'ı hizmet ortamı meta verilerine kalıcı olarak yazmaz.
    - Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef'i çözümlenemiyorsa, kurulum yedek düz metni kalıcı olarak yazmak yerine kapalı biçimde başarısız olur.
    - `gateway run` üzerinde parola kimlik doğrulaması için satır içi `--password` yerine `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` veya SecretRef destekli `gateway.auth.password` tercih edin.
    - Çıkarımlı kimlik doğrulama modunda, yalnızca kabukta bulunan `OPENCLAW_GATEWAY_PASSWORD` kurulum token gereksinimlerini gevşetmez; yönetilen bir hizmet kurarken kalıcı yapılandırma (`gateway.auth.password` veya yapılandırma `env`) kullanın.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar kurulum engellenir.

  </Accordion>
</AccordionGroup>

## Gateway'leri keşfetme (Bonjour)

`gateway discover`, Gateway işaretlerini (`_openclaw-gw._tcp`) tarar.

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Geniş Alan Bonjour): bir alan adı seçin (örnek: `openclaw.internal.`) ve split DNS + bir DNS sunucusu kurun; bkz. [Bonjour](/tr/gateway/bonjour).

Yalnızca Bonjour keşfi etkinleştirilmiş (varsayılan) Gateway'ler işareti duyurur.

Geniş Alan keşif kayıtları şunları içerir (TXT):

- `role` (Gateway rol ipucu)
- `transport` (taşıma ipucu, örn. `gateway`)
- `gatewayPort` (WebSocket portu, genellikle `18789`)
- `sshPort` (isteğe bağlı; yoksa istemciler SSH hedeflerini varsayılan olarak `22` alır)
- `tailnetDns` (var olduğunda MagicDNS ana makine adı)
- `gatewayTls` / `gatewayTlsSha256` (TLS etkin + sertifika parmak izi)
- `cliPath` (geniş alan bölgesine yazılan uzaktan kurulum ipucu)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Komut başına zaman aşımı (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir çıktı (ayrıca stil ve spinner'ı devre dışı bırakır).
</ParamField>

Örnekler:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI, `local.` ile birlikte etkinleştirildiğinde yapılandırılmış geniş alan alan adını tarar.
- JSON çıktısındaki `wsUrl`, `lanHost` veya `tailnetDns` gibi yalnızca TXT ipuçlarından değil, çözümlenen hizmet uç noktasından türetilir.
- `local.` mDNS üzerinde, `sshPort` ve `cliPath` yalnızca `discovery.mdns.mode` değeri `full` olduğunda yayınlanır. Geniş alan DNS-SD yine de `cliPath` yazar; `sshPort` orada da isteğe bağlı kalır.

</Note>

## İlgili

- [CLI referansı](/tr/cli)
- [Gateway runbook](/tr/gateway)
