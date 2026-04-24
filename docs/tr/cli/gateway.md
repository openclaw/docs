---
read_when:
    - Gateway'i CLI'dan çalıştırma (geliştirme veya sunucular)
    - Gateway kimlik doğrulamasını, bind modlarını ve bağlantıyı hata ayıklama
    - Gateway'leri Bonjour aracılığıyla keşfetme (yerel + geniş alan DNS-SD)
summary: OpenClaw Gateway CLI (`openclaw gateway`) — gateway'leri çalıştırın, sorgulayın ve keşfedin
title: Gateway
x-i18n:
    generated_at: "2026-04-24T09:02:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 011b8c8f86de6ecafbf17357a458956357ebe8285fe86e2bf875a4e2d87b5126
    source_path: cli/gateway.md
    workflow: 15
---

# Gateway CLI

Gateway, OpenClaw'ın WebSocket sunucusudur (kanallar, Node'lar, oturumlar, kancalar).

Bu sayfadaki alt komutlar `openclaw gateway …` altında yer alır.

İlgili belgeler:

- [/gateway/bonjour](/tr/gateway/bonjour)
- [/gateway/discovery](/tr/gateway/discovery)
- [/gateway/configuration](/tr/gateway/configuration)

## Gateway'i çalıştırın

Yerel bir Gateway süreci çalıştırın:

```bash
openclaw gateway
```

Ön plan takma adı:

```bash
openclaw gateway run
```

Notlar:

- Varsayılan olarak Gateway, `~/.openclaw/openclaw.json` içinde `gateway.mode=local` ayarlanmadıkça başlamayı reddeder. Geçici/geliştirme çalıştırmaları için `--allow-unconfigured` kullanın.
- `openclaw onboard --mode local` ve `openclaw setup` komutlarının `gateway.mode=local` yazması beklenir. Dosya varsa ama `gateway.mode` eksikse, bunu yerel modu örtük olarak varsaymak yerine bozuk veya ezilmiş bir yapılandırma olarak değerlendirin ve onarın.
- Dosya varsa ve `gateway.mode` eksikse, Gateway bunu şüpheli yapılandırma hasarı olarak değerlendirir ve sizin için “yerel tahmin” yapmayı reddeder.
- Kimlik doğrulama olmadan loopback ötesine bind engellenir (güvenlik korkuluğu).
- `SIGUSR1`, yetkili olduğunda süreç içi yeniden başlatma tetikler (`commands.restart` varsayılan olarak etkindir; manuel yeniden başlatmayı engellemek için `commands.restart: false` ayarlayın; gateway tool/config apply/update ise izinli kalır).
- `SIGINT`/`SIGTERM` işleyicileri gateway sürecini durdurur, ancak özel terminal durumlarını geri yüklemez. CLI'ı bir TUI veya raw-mode girdiyle sarıyorsanız, çıkıştan önce terminali geri yükleyin.

### Seçenekler

- `--port <port>`: WebSocket portu (varsayılan config/env'den gelir; genelde `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: dinleyici bind modu.
- `--auth <token|password>`: auth modu geçersiz kılması.
- `--token <token>`: token geçersiz kılması (ayrıca süreç için `OPENCLAW_GATEWAY_TOKEN` ayarlar).
- `--password <password>`: parola geçersiz kılması. Uyarı: satır içi parolalar yerel süreç listelerinde görünür olabilir.
- `--password-file <path>`: gateway parolasını bir dosyadan oku.
- `--tailscale <off|serve|funnel>`: Gateway'i Tailscale üzerinden dışa aç.
- `--tailscale-reset-on-exit`: kapanışta Tailscale serve/funnel yapılandırmasını sıfırla.
- `--allow-unconfigured`: yapılandırmada `gateway.mode=local` olmadan gateway başlangıcına izin ver. Bu yalnızca geçici/geliştirme bootstrap'i için başlangıç korkuluğunu atlar; yapılandırma dosyasını yazmaz veya onarmaz.
- `--dev`: eksikse bir geliştirme yapılandırması + çalışma alanı oluşturur (`BOOTSTRAP.md` atlanır).
- `--reset`: geliştirme yapılandırması + kimlik bilgileri + oturumlar + çalışma alanını sıfırla (`--dev` gerektirir).
- `--force`: başlamadan önce seçilen porttaki mevcut dinleyiciyi öldür.
- `--verbose`: ayrıntılı günlükler.
- `--cli-backend-logs`: konsolda yalnızca CLI backend günlüklerini göster (ve stdout/stderr'yi etkinleştir).
- `--ws-log <auto|full|compact>`: websocket günlük stili (varsayılan `auto`).
- `--compact`: `--ws-log compact` takma adı.
- `--raw-stream`: ham model akış olaylarını jsonl olarak günlüğe kaydet.
- `--raw-stream-path <path>`: ham akış jsonl yolu.

Başlangıç profilleme:

- Gateway başlangıcı sırasında aşama zamanlamalarını günlüğe kaydetmek için `OPENCLAW_GATEWAY_STARTUP_TRACE=1` ayarlayın.
- Gateway başlangıcını karşılaştırmak için `pnpm test:startup:gateway -- --runs 5 --warmup 1` çalıştırın. Karşılaştırma, ilk süreç çıktısını, `/healthz`, `/readyz` ve başlangıç iz zamanlamalarını kaydeder.

## Çalışan bir Gateway'i sorgulayın

Tüm sorgu komutları WebSocket RPC kullanır.

Çıktı modları:

- Varsayılan: insan tarafından okunabilir (TTY'de renklendirilmiş).
- `--json`: makine tarafından okunabilir JSON (stil/spinner yok).
- `--no-color` (veya `NO_COLOR=1`): insan düzenini korurken ANSI'yi devre dışı bırakır.

Paylaşılan seçenekler (desteklendiği yerlerde):

- `--url <url>`: Gateway WebSocket URL'si.
- `--token <token>`: Gateway token'ı.
- `--password <password>`: Gateway parolası.
- `--timeout <ms>`: zaman aşımı/bütçe (komuta göre değişir).
- `--expect-final`: “final” yanıtını bekle (aracı çağrıları).

Not: `--url` ayarladığınızda, CLI config veya ortam kimlik bilgilerine fallback yapmaz.
`--token` veya `--password` değerini açıkça verin. Açık kimlik bilgisi eksikliği bir hatadır.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` uç noktası bir canlılık probe'udur: sunucu HTTP yanıtlayabildiğinde döner. HTTP `/readyz` uç noktası daha katıdır ve başlangıç sidecar'ları, kanallar veya yapılandırılmış kancalar hâlâ yerleşirken kırmızı kalır.

### `gateway usage-cost`

Oturum günlüklerinden usage-cost özetlerini alın.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Seçenekler:

- `--days <days>`: dahil edilecek gün sayısı (varsayılan `30`).

### `gateway stability`

Çalışan bir Gateway'den son tanılama kararlılık kaydedicisini alın.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

Seçenekler:

- `--limit <limit>`: dahil edilecek son olayların azami sayısı (varsayılan `25`, azami `1000`).
- `--type <type>`: `payload.large` veya `diagnostic.memory.pressure` gibi tanılama olay türüne göre filtrele.
- `--since-seq <seq>`: yalnızca bir tanılama sıra numarasından sonraki olayları dahil et.
- `--bundle [path]`: çalışan Gateway'i çağırmak yerine kalıcılaştırılmış bir kararlılık bundle'ını oku. Durum dizini altındaki en yeni bundle için `--bundle latest` (veya sadece `--bundle`) kullanın ya da doğrudan bir bundle JSON yolu verin.
- `--export`: kararlılık ayrıntılarını yazdırmak yerine paylaşılabilir bir destek tanılama zip'i yaz.
- `--output <path>`: `--export` için çıktı yolu.

Notlar:

- Kayıtlar işlemsel meta verileri tutar: olay adları, sayılar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/Plugin adları ve redakte edilmiş oturum özetleri. Sohbet metnini, Webhook gövdelerini, araç çıktılarını, ham istek veya yanıt gövdelerini, token'ları, cookie'leri, gizli değerleri, ana bilgisayar adlarını veya ham oturum kimliklerini tutmazlar. Kaydediciyi tamamen devre dışı bırakmak için `diagnostics.enabled: false` ayarlayın.
- Ölümcül Gateway çıkışlarında, kapanış zaman aşımlarında ve yeniden başlatma başlangıç hatalarında, kaydedicide olay varsa OpenClaw aynı tanılama anlık görüntüsünü `~/.openclaw/logs/stability/openclaw-stability-*.json` dosyasına yazar. En yeni bundle'ı `openclaw gateway stability --bundle latest` ile inceleyin; `--limit`, `--type` ve `--since-seq` bundle çıktısına da uygulanır.

### `gateway diagnostics export`

Hata raporlarına eklemek üzere tasarlanmış yerel bir tanılama zip'i yazın.
Gizlilik modeli ve bundle içeriği için bkz. [Diagnostics Export](/tr/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Seçenekler:

- `--output <path>`: çıktı zip yolu. Varsayılan olarak durum dizini altında bir destek dışa aktarımıdır.
- `--log-lines <count>`: dahil edilecek azami sanitize günlük satırı sayısı (varsayılan `5000`).
- `--log-bytes <bytes>`: incelenecek azami günlük baytı (varsayılan `1000000`).
- `--url <url>`: sağlık anlık görüntüsü için Gateway WebSocket URL'si.
- `--token <token>`: sağlık anlık görüntüsü için Gateway token'ı.
- `--password <password>`: sağlık anlık görüntüsü için Gateway parolası.
- `--timeout <ms>`: durum/sağlık anlık görüntüsü zaman aşımı (varsayılan `3000`).
- `--no-stability-bundle`: kalıcılaştırılmış kararlılık bundle aramasını atla.
- `--json`: yazılan yolu, boyutu ve manifest'i JSON olarak yazdır.

Dışa aktarma; bir manifest, Markdown özeti, yapılandırma şekli, sanitize yapılandırma ayrıntıları, sanitize günlük özetleri, sanitize Gateway durum/sağlık anlık görüntüleri ve mevcutsa en yeni kararlılık bundle'ını içerir.

Paylaşılmak üzere tasarlanmıştır. Hata ayıklamaya yardımcı olan işlemsel ayrıntıları korur; örneğin güvenli OpenClaw günlük alanları, alt sistem adları, durum kodları, süreler, yapılandırılmış modlar, portlar, Plugin kimlikleri, sağlayıcı kimlikleri, gizli olmayan özellik ayarları ve redakte edilmiş işlemsel günlük mesajları. Sohbet metnini, Webhook gövdelerini, araç çıktılarını, kimlik bilgilerini, cookie'leri, hesap/mesaj tanımlayıcılarını, prompt/talimat metnini, ana bilgisayar adlarını ve gizli değerleri çıkarır veya redakte eder. Bir LogTape tarzı mesaj kullanıcı/sohbet/araç payload metni gibi görünüyorsa, dışa aktarma yalnızca bir mesajın atlandığını ve bayt sayısını tutar.

### `gateway status`

`gateway status`, Gateway hizmetini (launchd/systemd/schtasks) ve isteğe bağlı bağlantı/auth yeteneği probe'unu gösterir.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Seçenekler:

- `--url <url>`: açık bir probe hedefi ekler. Yapılandırılmış uzak + localhost yine probe edilir.
- `--token <token>`: probe için token auth.
- `--password <password>`: probe için password auth.
- `--timeout <ms>`: probe zaman aşımı (varsayılan `10000`).
- `--no-probe`: bağlantı probe'unu atla (yalnızca hizmet görünümü).
- `--deep`: sistem düzeyindeki hizmetleri de tara.
- `--require-rpc`: varsayılan bağlantı probe'unu bir okuma probe'una yükseltir ve bu okuma probe'u başarısız olursa sıfır olmayan kodla çıkar. `--no-probe` ile birlikte kullanılamaz.

Notlar:

- `gateway status`, yerel CLI yapılandırması eksik veya geçersiz olduğunda bile tanılama için kullanılabilir olmaya devam eder.
- Varsayılan `gateway status`; hizmet durumunu, WebSocket bağlantısını ve el sıkışma sırasında görünen auth yeteneğini kanıtlar. Okuma/yazma/yönetici işlemlerini kanıtlamaz.
- `gateway status`, mümkün olduğunda probe auth için yapılandırılmış auth SecretRef'lerini çözümler.
- Gerekli bir auth SecretRef bu komut yolunda çözümlenmemişse, `gateway status --json`, probe bağlantı/auth başarısız olduğunda `rpc.authWarning` bildirir; `--token`/`--password` açıkça verin veya önce secret kaynağını çözümleyin.
- Probe başarılı olursa, yanlış pozitifleri önlemek için çözümlenmemiş auth-ref uyarıları bastırılır.
- Dinleyen bir hizmetin yeterli olmadığı ve okuma kapsamlı RPC çağrılarının da sağlıklı olması gerektiği betiklerde ve otomasyonda `--require-rpc` kullanın.
- `--deep`, ek launchd/systemd/schtasks kurulumları için best-effort tarama ekler. Birden fazla gateway benzeri hizmet algılandığında, insan çıktısı temizleme ipuçları yazdırır ve çoğu kurulumun makine başına tek bir gateway çalıştırması gerektiği konusunda uyarır.
- İnsan çıktısı, profil veya state-dir kaymasını teşhis etmeye yardımcı olmak için çözümlenmiş dosya günlük yolunu ve CLI-karşısında-hizmet yapılandırma yolları/geçerlilik anlık görüntüsünü içerir.
- Linux systemd kurulumlarında, hizmet auth drift denetimleri birimden hem `Environment=` hem `EnvironmentFile=` değerlerini okur (`%h`, tırnaklı yollar, birden çok dosya ve isteğe bağlı `-` dosyalar dahil).
- Drift denetimleri, `gateway.auth.token` SecretRef'lerini birleştirilmiş çalışma zamanı env ile çözümler (önce hizmet komut env'si, sonra süreç env fallback'i).
- Token auth fiilen etkin değilse (açık `gateway.auth.mode` değeri `password`/`none`/`trusted-proxy` veya mod ayarsızken password kazanabiliyorsa ve hiçbir token adayı kazanamıyorsa), token drift denetimleri config token çözümlemesini atlar.

### `gateway probe`

`gateway probe`, “her şeyi hata ayıkla” komutudur. Her zaman şunları probe eder:

- yapılandırdığınız uzak gateway'i (ayarlıysa), ve
- localhost'u (loopback) **uzak yapılandırılmış olsa bile**.

`--url` geçirirseniz, bu açık hedef her ikisinin de önüne eklenir. İnsan çıktısı
hedefleri şöyle etiketler:

- `URL (explicit)`
- `Remote (configured)` veya `Remote (configured, inactive)`
- `Local loopback`

Birden fazla gateway erişilebilirse hepsini yazdırır. Yalıtılmış profiller/portlar kullandığınızda (örneğin bir kurtarma botu) birden çok gateway desteklenir, ancak çoğu kurulum yine de tek bir gateway çalıştırır.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Yorumlama:

- `Reachable: yes`, en az bir hedefin bir WebSocket bağlantısını kabul ettiği anlamına gelir.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only`, probe'un auth hakkında neyi kanıtlayabildiğini bildirir. Erişilebilirlikten ayrıdır.
- `Read probe: ok`, okuma kapsamlı ayrıntı RPC çağrılarının (`health`/`status`/`system-presence`/`config.get`) da başarılı olduğu anlamına gelir.
- `Read probe: limited - missing scope: operator.read`, bağlantının başarılı olduğu ancak okuma kapsamlı RPC'nin sınırlı olduğu anlamına gelir. Bu, tam başarısızlık değil, **bozulmuş** erişilebilirlik olarak bildirilir.
- Çıkış kodu yalnızca probe edilen hedeflerin hiçbirine erişilemiyorsa sıfır olmayan olur.

JSON notları (`--json`):

- Üst düzey:
  - `ok`: en az bir hedef erişilebilir.
  - `degraded`: en az bir hedefte kapsamı sınırlı ayrıntı RPC vardı.
  - `capability`: erişilebilir hedefler arasında görülen en iyi yetenek (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` veya `unknown`).
  - `primaryTargetId`: şu sırayla etkin kazanan olarak değerlendirilecek en iyi hedef: açık URL, SSH tüneli, yapılandırılmış uzak, ardından yerel loopback.
  - `warnings[]`: `code`, `message` ve isteğe bağlı `targetIds` içeren best-effort uyarı kayıtları.
  - `network`: geçerli yapılandırma ve ana bilgisayar ağından türetilen yerel loopback/tailnet URL ipuçları.
  - `discovery.timeoutMs` ve `discovery.count`: bu probe geçişi için kullanılan gerçek keşif bütçesi/sonuç sayısı.
- Hedef başına (`targets[].connect`):
  - `ok`: bağlanma + bozulmuş sınıflandırmadan sonraki erişilebilirlik.
  - `rpcOk`: tam ayrıntı RPC başarısı.
  - `scopeLimited`: ayrıntı RPC'si eksik operator kapsamı nedeniyle başarısız oldu.
- Hedef başına (`targets[].auth`):
  - `role`: mevcut olduğunda `hello-ok` içinde bildirilen auth rolü.
  - `scopes`: mevcut olduğunda `hello-ok` içinde bildirilen verilen kapsamlar.
  - `capability`: o hedef için görünen auth yetenek sınıflandırması.

Yaygın uyarı kodları:

- `ssh_tunnel_failed`: SSH tüneli kurulumu başarısız oldu; komut doğrudan probe'lara fallback yaptı.
- `multiple_gateways`: birden fazla hedef erişilebilirdi; bir kurtarma botu gibi yalıtılmış profilleri kasıtlı olarak çalıştırmıyorsanız bu olağandışıdır.
- `auth_secretref_unresolved`: yapılandırılmış bir auth SecretRef başarısız bir hedef için çözümlenemedi.
- `probe_scope_limited`: WebSocket bağlantısı başarılı oldu, ancak okuma probe'u eksik `operator.read` nedeniyle sınırlıydı.

#### SSH üzerinden uzak (Mac uygulaması eşdeğeri)

macOS uygulamasındaki “SSH üzerinden uzak” modu, uzak gateway'in (yalnızca loopback'e bind edilmiş olsa bile) `ws://127.0.0.1:<port>` adresinden erişilebilir olmasını sağlayan yerel bir port-forward kullanır.

CLI eşdeğeri:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Seçenekler:

- `--ssh <target>`: `user@host` veya `user@host:port` (port varsayılanı `22`).
- `--ssh-identity <path>`: kimlik dosyası.
- `--ssh-auto`: çözümlenen
  keşif uç noktasından (`local.` artı varsa yapılandırılmış geniş alan etki alanı) ilk keşfedilen gateway ana bilgisayarını SSH hedefi olarak seçer. Yalnızca TXT
  ipuçları yok sayılır.

Yapılandırma (isteğe bağlı, varsayılan olarak kullanılır):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Düşük seviyeli RPC yardımcısı.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

Seçenekler:

- `--params <json>`: params için JSON nesne dizesi (varsayılan `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

Notlar:

- `--params` geçerli JSON olmalıdır.
- `--expect-final`, esas olarak nihai payload'dan önce ara olaylar akıtan aracı tarzı RPC'ler içindir.

## Gateway hizmetini yönetin

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

Komut seçenekleri:

- `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart`: `--json`

Notlar:

- `gateway install`, `--port`, `--runtime`, `--token`, `--force`, `--json` destekler.
- Token auth bir token gerektiriyorsa ve `gateway.auth.token`, SecretRef tarafından yönetiliyorsa, `gateway install` SecretRef'in çözümlenebilir olduğunu doğrular ancak çözümlenen token'ı hizmet ortamı meta verisine kalıcı olarak yazmaz.
- Token auth bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenmemişse, kurulum fallback düz metni kalıcılaştırmak yerine kapalı başarısız olur.
- `gateway run` üzerinde password auth için, satır içi `--password` yerine `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` veya SecretRef destekli `gateway.auth.password` tercih edin.
- Çıkarımsal auth modunda, yalnızca kabuktaki `OPENCLAW_GATEWAY_PASSWORD`, kurulum token gereksinimlerini gevşetmez; yönetilen bir hizmet kurarken kalıcı config (`gateway.auth.password` veya config `env`) kullanın.
- Hem `gateway.auth.token` hem `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarsızsa, mod açıkça ayarlanana kadar kurulum engellenir.
- Yaşam döngüsü komutları betikleme için `--json` kabul eder.

## Gateway'leri keşfedin (Bonjour)

`gateway discover`, Gateway beacon'larını (`_openclaw-gw._tcp`) tarar.

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): bir etki alanı seçin (örnek: `openclaw.internal.`) ve split DNS + bir DNS sunucusu kurun; bkz. [/gateway/bonjour](/tr/gateway/bonjour)

Yalnızca Bonjour keşfi etkin olan gateway'ler (varsayılan) beacon yayınlar.

Wide-Area keşif kayıtları şunları içerir (TXT):

- `role` (gateway rol ipucu)
- `transport` (taşıma ipucu, ör. `gateway`)
- `gatewayPort` (WebSocket portu, genelde `18789`)
- `sshPort` (isteğe bağlı; istemciler bu olmadığında varsayılan SSH hedeflerini `22` olarak alır)
- `tailnetDns` (mevcut olduğunda MagicDNS ana bilgisayar adı)
- `gatewayTls` / `gatewayTlsSha256` (TLS etkin + sertifika parmak izi)
- `cliPath` (geniş alan zone'una yazılan uzak kurulum ipucu)

### `gateway discover`

```bash
openclaw gateway discover
```

Seçenekler:

- `--timeout <ms>`: komut başına zaman aşımı (browse/resolve); varsayılan `2000`.
- `--json`: makine tarafından okunabilir çıktı (ayrıca stil/spinner'ı devre dışı bırakır).

Örnekler:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Notlar:

- CLI, `local.` ile birlikte biri etkinse yapılandırılmış geniş alan etki alanını tarar.
- JSON çıktısındaki `wsUrl`, `lanHost` veya `tailnetDns` gibi yalnızca TXT
  ipuçlarından değil, çözümlenen hizmet uç noktasından türetilir.
- `local.` mDNS üzerinde, `sshPort` ve `cliPath` yalnızca
  `discovery.mdns.mode` değeri `full` olduğunda yayınlanır. Wide-Area DNS-SD yine de `cliPath` yazar; `sshPort`
  orada da isteğe bağlı kalır.

## İlgili

- [CLI reference](/tr/cli)
- [Gateway runbook](/tr/gateway)
