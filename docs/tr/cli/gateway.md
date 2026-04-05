---
read_when:
    - Ağ Geçidini CLI üzerinden çalıştırma (geliştirme veya sunucular)
    - Gateway kimlik doğrulaması, bağlama modları ve bağlantıda hata ayıklama
    - Bonjour ile ağ geçitlerini keşfetme (yerel + geniş alan DNS-SD)
summary: OpenClaw Gateway CLI (`openclaw gateway`) — ağ geçitlerini çalıştırın, sorgulayın ve keşfedin
title: gateway
x-i18n:
    generated_at: "2026-04-05T13:49:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: e311ded0dbad84b8212f0968f3563998d49c5e0eb292a0dc4b3bd3c22d4fa7f2
    source_path: cli/gateway.md
    workflow: 15
---

# Gateway CLI

Gateway, OpenClaw’ın WebSocket sunucusudur (kanallar, düğümler, oturumlar, hook’lar).

Bu sayfadaki alt komutlar `openclaw gateway …` altında bulunur.

İlgili belgeler:

- [/gateway/bonjour](/gateway/bonjour)
- [/gateway/discovery](/gateway/discovery)
- [/gateway/configuration](/gateway/configuration)

## Gateway’i çalıştırın

Yerel bir Gateway işlemi çalıştırın:

```bash
openclaw gateway
```

Ön plandaki takma ad:

```bash
openclaw gateway run
```

Notlar:

- Varsayılan olarak Gateway, `~/.openclaw/openclaw.json` içinde `gateway.mode=local` ayarlanmadıkça başlamayı reddeder. Geçici/geliştirme çalıştırmaları için `--allow-unconfigured` kullanın.
- `openclaw onboard --mode local` ve `openclaw setup` komutlarının `gateway.mode=local` yazması beklenir. Dosya varsa ancak `gateway.mode` eksikse, bunu örtülmüş veya bozulmuş bir yapılandırma olarak değerlendirin ve yerel modu örtük olarak varsaymak yerine onarın.
- Dosya varsa ve `gateway.mode` eksikse, Gateway bunu şüpheli yapılandırma bozulması olarak değerlendirir ve sizin yerinize “yerel modu tahmin etmeyi” reddeder.
- Kimlik doğrulama olmadan loopback dışına bağlama engellenir (güvenlik korkuluğu).
- `SIGUSR1`, yetkili olduğunda süreç içi yeniden başlatmayı tetikler (`commands.restart` varsayılan olarak etkindir; manuel yeniden başlatmayı engellemek için `commands.restart: false` ayarlayın, ancak gateway tool/config apply/update yine izinli kalır).
- `SIGINT`/`SIGTERM` işleyicileri gateway işlemini durdurur, ancak özel terminal durumunu geri yüklemez. CLI’yi bir TUI veya raw-mode girdiyle sarmalıyorsanız, çıkıştan önce terminali geri yükleyin.

### Seçenekler

- `--port <port>`: WebSocket portu (varsayılan yapılandırma/ortamdan gelir; genellikle `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: dinleyici bağlama modu.
- `--auth <token|password>`: kimlik doğrulama modu geçersiz kılması.
- `--token <token>`: token geçersiz kılması (ayrıca işlem için `OPENCLAW_GATEWAY_TOKEN` ayarlar).
- `--password <password>`: parola geçersiz kılması. Uyarı: satır içi parolalar yerel işlem listelerinde açığa çıkabilir.
- `--password-file <path>`: gateway parolasını bir dosyadan oku.
- `--tailscale <off|serve|funnel>`: Gateway’i Tailscale üzerinden erişime aç.
- `--tailscale-reset-on-exit`: kapanışta Tailscale serve/funnel yapılandırmasını sıfırla.
- `--allow-unconfigured`: yapılandırmada `gateway.mode=local` olmadan gateway’in başlamasına izin ver. Bu yalnızca geçici/geliştirme önyüklemesi için başlangıç korkuluğunu atlar; yapılandırma dosyasını yazmaz veya onarmaz.
- `--dev`: eksikse geliştirme yapılandırması + çalışma alanı oluştur (BOOTSTRAP.md atlanır).
- `--reset`: geliştirme yapılandırması + kimlik bilgileri + oturumlar + çalışma alanını sıfırla (`--dev` gerektirir).
- `--force`: başlatmadan önce seçili porttaki mevcut dinleyiciyi sonlandır.
- `--verbose`: ayrıntılı günlükler.
- `--cli-backend-logs`: konsolda yalnızca CLI backend günlüklerini göster (ve stdout/stderr’ı etkinleştir).
- `--claude-cli-logs`: `--cli-backend-logs` için kullanımdan kaldırılmış takma ad.
- `--ws-log <auto|full|compact>`: websocket günlük stili (varsayılan `auto`).
- `--compact`: `--ws-log compact` takma adı.
- `--raw-stream`: ham model akış olaylarını jsonl olarak günlüğe kaydet.
- `--raw-stream-path <path>`: ham akış jsonl yolu.

## Çalışan bir Gateway’i sorgulayın

Tüm sorgu komutları WebSocket RPC kullanır.

Çıktı modları:

- Varsayılan: insan tarafından okunabilir (TTY’de renklendirilmiş).
- `--json`: makine tarafından okunabilir JSON (stil/spinner yok).
- `--no-color` (veya `NO_COLOR=1`): insan düzenini korurken ANSI’yi devre dışı bırakır.

Paylaşılan seçenekler (desteklenen yerlerde):

- `--url <url>`: Gateway WebSocket URL’si.
- `--token <token>`: Gateway token’ı.
- `--password <password>`: Gateway parolası.
- `--timeout <ms>`: zaman aşımı/bütçe (komuta göre değişir).
- `--expect-final`: “final” yanıtı bekle (agent çağrıları).

Not: `--url` ayarladığınızda CLI, yapılandırma veya ortam kimlik bilgilerine geri dönmez.
`--token` veya `--password` değerini açıkça geçin. Açık kimlik bilgisi eksikliği hatadır.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

### `gateway usage-cost`

Oturum günlüklerinden kullanım maliyeti özetlerini getirir.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Seçenekler:

- `--days <days>`: dahil edilecek gün sayısı (varsayılan `30`).

### `gateway status`

`gateway status`, Gateway hizmetini (launchd/systemd/schtasks) ve isteğe bağlı bir RPC probunu gösterir.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Seçenekler:

- `--url <url>`: açık bir prob hedefi ekler. Yapılandırılmış uzak hedef + localhost yine de problanır.
- `--token <token>`: prob için token kimlik doğrulaması.
- `--password <password>`: prob için parola kimlik doğrulaması.
- `--timeout <ms>`: prob zaman aşımı (varsayılan `10000`).
- `--no-probe`: RPC probunu atla (yalnızca hizmet görünümü).
- `--deep`: sistem düzeyindeki hizmetleri de tara.
- `--require-rpc`: RPC probu başarısız olursa sıfır olmayan çıkışla çık. `--no-probe` ile birlikte kullanılamaz.

Notlar:

- `gateway status`, yerel CLI yapılandırması eksik veya geçersiz olduğunda bile tanılama için kullanılabilir olmaya devam eder.
- `gateway status`, mümkün olduğunda prob kimlik doğrulaması için yapılandırılmış auth SecretRef’leri çözümler.
- Gerekli bir auth SecretRef bu komut yolunda çözümlenemezse, prob bağlantısı/kimlik doğrulaması başarısız olduğunda `gateway status --json`, `rpc.authWarning` bildirir; `--token`/`--password` değerini açıkça geçin veya önce gizli kaynağı çözümleyin.
- Prob başarılı olursa, yanlış pozitifleri önlemek için çözümlenmemiş auth-ref uyarıları bastırılır.
- Dinleyen bir hizmetin yeterli olmadığı ve Gateway RPC’nin de sağlıklı olmasının gerektiği betiklerde ve otomasyonda `--require-rpc` kullanın.
- `--deep`, ek launchd/systemd/schtasks kurulumları için best-effort bir tarama ekler. Birden fazla gateway benzeri hizmet algılandığında, insan tarafından okunabilir çıktı temizleme ipuçları yazdırır ve çoğu kurulumun makine başına tek bir gateway çalıştırması gerektiği konusunda uyarır.
- İnsan tarafından okunabilir çıktı; profil veya durum dizini kaymasını teşhis etmeye yardımcı olmak için çözümlenen dosya günlük yolunu ve CLI ile hizmet yapılandırma yolları/geçerlilik anlık görüntüsünü içerir.
- Linux systemd kurulumlarında, hizmet kimlik doğrulama kayması denetimleri birimdeki hem `Environment=` hem de `EnvironmentFile=` değerlerini okur (`%h`, tırnaklı yollar, birden çok dosya ve isteğe bağlı `-` dosyalar dahil).
- Kayma denetimleri, `gateway.auth.token` SecretRef’lerini birleştirilmiş çalışma zamanı ortamı kullanarak çözümler (önce hizmet komut ortamı, ardından işlem ortamı yedeği).
- Token kimlik doğrulaması fiilen etkin değilse (açık `gateway.auth.mode` değeri `password`/`none`/`trusted-proxy` ise veya mod ayarsızken parola kazanabiliyorsa ve hiçbir token adayı kazanamıyorsa), token kayma denetimleri yapılandırma token çözümlemesini atlar.

### `gateway probe`

`gateway probe`, “her şeyi hata ayıkla” komutudur. Her zaman şunları problar:

- yapılandırılmış uzak gateway’inizi (ayarlıysa) ve
- localhost’u (loopback) **uzak hedef yapılandırılmış olsa bile**.

`--url` geçirirseniz, bu açık hedef her ikisinin önüne eklenir. İnsan tarafından okunabilir çıktı hedefleri şu şekilde etiketler:

- `URL (explicit)`
- `Remote (configured)` veya `Remote (configured, inactive)`
- `Local loopback`

Birden fazla gateway erişilebilirse hepsini yazdırır. İzole profiller/portlar kullanıldığında birden fazla gateway desteklenir (örneğin bir rescue bot), ancak çoğu kurulum yine de tek bir gateway çalıştırır.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Yorumlama:

- `Reachable: yes`, en az bir hedefin WebSocket bağlantısını kabul ettiği anlamına gelir.
- `RPC: ok`, ayrıntılı RPC çağrılarının (`health`/`status`/`system-presence`/`config.get`) da başarılı olduğu anlamına gelir.
- `RPC: limited - missing scope: operator.read`, bağlantının başarılı olduğu ancak ayrıntılı RPC’nin kapsamla sınırlandığı anlamına gelir. Bu, tam başarısızlık değil, **azalmış** erişilebilirlik olarak raporlanır.
- Çıkış kodu yalnızca problanan hedeflerin hiçbiri erişilebilir olmadığında sıfır değildir.

JSON notları (`--json`):

- Üst düzey:
  - `ok`: en az bir hedef erişilebilir.
  - `degraded`: en az bir hedefte kapsamla sınırlı ayrıntılı RPC vardı.
  - `primaryTargetId`: şu sırayla etkin kazanan olarak değerlendirilecek en iyi hedef: açık URL, SSH tüneli, yapılandırılmış uzak hedef, ardından yerel loopback.
  - `warnings[]`: `code`, `message` ve isteğe bağlı `targetIds` içeren best-effort uyarı kayıtları.
  - `network`: mevcut yapılandırma ve ana bilgisayar ağından türetilen yerel loopback/tailnet URL ipuçları.
  - `discovery.timeoutMs` ve `discovery.count`: bu prob geçişi için kullanılan gerçek keşif bütçesi/sonuç sayısı.
- Hedef başına (`targets[].connect`):
  - `ok`: bağlantı + azalmış sınıflandırmadan sonraki erişilebilirlik.
  - `rpcOk`: tam ayrıntılı RPC başarısı.
  - `scopeLimited`: ayrıntılı RPC, eksik operator scope nedeniyle başarısız oldu.

Yaygın uyarı kodları:

- `ssh_tunnel_failed`: SSH tüneli kurulumu başarısız oldu; komut doğrudan problara geri döndü.
- `multiple_gateways`: birden fazla hedef erişilebilirdi; rescue bot gibi kasıtlı olarak izole profiller çalıştırmıyorsanız bu alışılmadık bir durumdur.
- `auth_secretref_unresolved`: yapılandırılmış bir auth SecretRef, başarısız bir hedef için çözümlenemedi.
- `probe_scope_limited`: WebSocket bağlantısı başarılı oldu, ancak ayrıntılı RPC `operator.read` eksikliği nedeniyle sınırlıydı.

#### SSH üzerinden uzak erişim (Mac uygulaması eşdeğeri)

macOS uygulamasındaki “Remote over SSH” modu, uzak gateway’in (yalnızca loopback’e bağlı olabilir) `ws://127.0.0.1:<port>` adresinde erişilebilir olması için yerel bir port yönlendirme kullanır.

CLI eşdeğeri:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Seçenekler:

- `--ssh <target>`: `user@host` veya `user@host:port` (port varsayılan olarak `22`).
- `--ssh-identity <path>`: kimlik dosyası.
- `--ssh-auto`: çözümlenen keşif uç noktasından (`local.` ve varsa yapılandırılmış geniş alan etki alanı) keşfedilen ilk gateway ana bilgisayarını SSH hedefi olarak seçer. Yalnızca TXT ipuçları yok sayılır.

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

- `--params <json>`: parametreler için JSON nesne dizesi (varsayılan `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

Notlar:

- `--params` geçerli JSON olmalıdır.
- `--expect-final`, esas olarak nihai bir yükten önce ara olaylar akıtan agent tarzı RPC’ler içindir.

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
- Token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, `gateway install` SecretRef’in çözümlenebilir olduğunu doğrular ancak çözümlenen token’ı hizmet ortamı meta verisine kalıcı olarak yazmaz.
- Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenemiyorsa, kurulum yedek düz metni kalıcı hale getirmek yerine kapalı olarak başarısız olur.
- `gateway run` üzerinde parola kimlik doğrulaması için satır içi `--password` yerine `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` veya SecretRef destekli `gateway.auth.password` tercih edin.
- Çıkarımsal kimlik doğrulama modunda, yalnızca kabuk düzeyindeki `OPENCLAW_GATEWAY_PASSWORD`, kurulum token gereksinimlerini gevşetmez; yönetilen bir hizmet kurarken kalıcı yapılandırma (`gateway.auth.password` veya yapılandırma `env`) kullanın.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlı değilse, mod açıkça ayarlanana kadar kurulum engellenir.
- Yaşam döngüsü komutları betik yazımı için `--json` kabul eder.

## Ağ geçitlerini keşfedin (Bonjour)

`gateway discover`, Gateway beacon’larını (`_openclaw-gw._tcp`) tarar.

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Geniş Alan Bonjour): bir etki alanı seçin (örnek: `openclaw.internal.`) ve split DNS + DNS sunucusu kurun; bkz. [/gateway/bonjour](/gateway/bonjour)

Yalnızca Bonjour keşfi etkin olan ağ geçitleri (varsayılan) beacon yayını yapar.

Geniş Alan keşif kayıtları şunları içerir (TXT):

- `role` (gateway rol ipucu)
- `transport` (taşıma ipucu, ör. `gateway`)
- `gatewayPort` (WebSocket portu, genellikle `18789`)
- `sshPort` (isteğe bağlı; istemciler yoksa varsayılan SSH hedefini `22` olarak alır)
- `tailnetDns` (varsa MagicDNS ana bilgisayar adı)
- `gatewayTls` / `gatewayTlsSha256` (TLS etkin + sertifika parmak izi)
- `cliPath` (geniş alan bölgesine yazılan uzak kurulum ipucu)

### `gateway discover`

```bash
openclaw gateway discover
```

Seçenekler:

- `--timeout <ms>`: komut başına zaman aşımı (browse/resolve); varsayılan `2000`.
- `--json`: makine tarafından okunabilir çıktı (stil/spinner’ı da devre dışı bırakır).

Örnekler:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Notlar:

- CLI, etkin olduğunda `local.` ile birlikte yapılandırılmış geniş alan etki alanını tarar.
- JSON çıktısındaki `wsUrl`, `lanHost` veya `tailnetDns` gibi yalnızca TXT ipuçlarından değil, çözümlenen hizmet uç noktasından türetilir.
- `local.` mDNS üzerinde `sshPort` ve `cliPath`, yalnızca `discovery.mdns.mode` değeri `full` olduğunda yayınlanır. Geniş alan DNS-SD yine de `cliPath` yazar; `sshPort` orada da isteğe bağlı kalır.
