---
read_when:
    - Gateway'i CLI'den çalıştırma (geliştirme veya sunucular)
    - Gateway kimlik doğrulaması, bağlama modları ve bağlantı sorunlarını ayıklama
    - Bonjour aracılığıyla Gateway'leri keşfetme (yerel + geniş alan DNS-SD)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — gateway'leri çalıştırın, sorgulayın ve keşfedin
title: Gateway
x-i18n:
    generated_at: "2026-06-28T00:22:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de9aaeff1b592e867ffadf49a076e6e0f7069b966244b19d4eed91993c3ad738
    source_path: cli/gateway.md
    workflow: 16
---

Gateway, OpenClaw'ın WebSocket sunucusudur (kanallar, düğümler, oturumlar, hook'lar). Bu sayfadaki alt komutlar `openclaw gateway …` altında bulunur.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/tr/gateway/bonjour">
    Yerel mDNS + geniş alan DNS-SD kurulumu.
  </Card>
  <Card title="Discovery overview" href="/tr/gateway/discovery">
    OpenClaw'ın Gateway'leri nasıl duyurduğu ve bulduğu.
  </Card>
  <Card title="Configuration" href="/tr/gateway/configuration">
    Üst düzey Gateway yapılandırma anahtarları.
  </Card>
</CardGroup>

## Gateway'i çalıştırma

Yerel bir Gateway süreci çalıştırın:

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
    - `openclaw onboard --mode local` ve `openclaw setup` komutlarının `gateway.mode=local` yazması beklenir. Dosya varsa ancak `gateway.mode` eksikse, bunu örtük olarak yerel mod varsaymak yerine bozuk veya üzerine yazılmış bir yapılandırma olarak ele alın ve onarın.
    - Dosya varsa ve `gateway.mode` eksikse, Gateway bunu şüpheli yapılandırma hasarı olarak ele alır ve sizin için "guess local" yapmayı reddeder.
    - Kimlik doğrulama olmadan loopback dışına bağlanma engellenir (güvenlik koruması).
    - `lan`, `tailnet` ve `custom` şu anda yalnızca IPv4 BYOH yolları üzerinden çözümlenir.
    - Yalnızca IPv6 BYOH bugün bu yolda yerel olarak desteklenmez. Ana makinenin kendisi yalnızca IPv6 ise bir IPv4 sidecar veya proxy kullanın.
    - `SIGUSR1`, yetkilendirildiğinde süreç içi yeniden başlatmayı tetikler (`commands.restart` varsayılan olarak etkindir; manuel yeniden başlatmayı engellemek için `commands.restart: false` ayarlayın, Gateway aracı/yapılandırma apply/update işlemleri izinli kalır).
    - `SIGINT`/`SIGTERM` işleyicileri Gateway sürecini durdurur, ancak özel terminal durumunu geri yüklemez. CLI'yi bir TUI veya raw-mode girişle sararsanız, çıkmadan önce terminali geri yükleyin.

  </Accordion>
</AccordionGroup>

### Seçenekler

<ParamField path="--port <port>" type="number">
  WebSocket portu (varsayılan yapılandırma/env üzerinden gelir; genellikle `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Dinleyici bağlama modu. `lan`, `tailnet` ve `custom` şu anda yalnızca IPv4 yolları üzerinden çözümlenir.
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
  Gateway parolasını bir dosyadan oku.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Gateway'i Tailscale üzerinden dışa aç.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Kapanışta Tailscale serve/funnel yapılandırmasını sıfırla.
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  Bugün bir IPv4 adresi bekler. Yalnızca IPv6 BYOH için Gateway'in önüne bir IPv4 sidecar veya proxy yerleştirin ve OpenClaw'ı bu IPv4 uç noktasına yönlendirin.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Yapılandırmada `gateway.mode=local` olmadan Gateway başlatmaya izin ver. Yalnızca geçici/geliştirme önyüklemesi için başlangıç korumasını atlar; yapılandırma dosyasını yazmaz veya onarmaz.
</ParamField>
<ParamField path="--dev" type="boolean">
  Eksikse geliştirme yapılandırması + çalışma alanı oluştur (`BOOTSTRAP.md` atlanır).
</ParamField>
<ParamField path="--reset" type="boolean">
  Geliştirme yapılandırmasını + kimlik bilgilerini + oturumları + çalışma alanını sıfırla (`--dev` gerektirir).
</ParamField>
<ParamField path="--force" type="boolean">
  Başlamadan önce seçili porttaki mevcut dinleyiciyi sonlandır.
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
  Ham model akışı olaylarını jsonl'ye kaydet.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Ham akış jsonl yolu.
</ParamField>

## Gateway'i yeniden başlatma

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe`, çalışan Gateway'den yeniden başlatmadan önce etkin OpenClaw işlerini ön kontrolden geçirmesini ister. Kuyruğa alınmış işlemler, yanıt teslimi, gömülü çalıştırmalar veya görev çalıştırmaları etkinse Gateway engelleyicileri bildirir, yinelenen güvenli yeniden başlatma isteklerini birleştirir ve etkin iş boşaldığında yeniden başlar. Düz `restart`, uyumluluk için mevcut servis yöneticisi davranışını korur. `--force` seçeneğini yalnızca açıkça anında geçersiz kılma yolunu istediğinizde kullanın.

`openclaw gateway restart --safe --skip-deferral`, `--safe` ile aynı OpenClaw bilinçli koordineli yeniden başlatmayı çalıştırır, ancak etkin iş erteleme kapısını atlayarak engelleyiciler bildirildiğinde bile Gateway'in yeniden başlatmayı hemen yaymasını sağlar. Bir erteleme takılmış bir görev çalıştırması nedeniyle sabitlendiğinde ve yalnızca `--safe` süresiz bekleyecek olduğunda bunu operatör kaçış yolu olarak kullanın. `--skip-deferral`, `--safe` gerektirir.

<Warning>
Satır içi `--password`, yerel süreç listelerinde açığa çıkabilir. `--password-file`, env veya SecretRef destekli `gateway.auth.password` tercih edin.
</Warning>

### Gateway profilleme

- Gateway başlangıcı sırasında faz zamanlamalarını günlüğe yazmak için `OPENCLAW_GATEWAY_STARTUP_TRACE=1` ayarlayın; buna faz başına `eventLoopMax` gecikmesi ve installed-index, manifest registry, başlangıç planlaması ve owner-map işleri için Plugin arama tablosu zamanlamaları dahildir.
- Yeniden başlatma sinyali işleme, etkin iş boşaltma, kapatma fazları, sonraki başlatma, hazır olma zamanlaması ve bellek metrikleri için yeniden başlatma kapsamlı `restart trace:` satırlarını günlüğe yazmak üzere `OPENCLAW_GATEWAY_RESTART_TRACE=1` ayarlayın.
- Harici QA harness'leri için en iyi çabayla JSONL başlangıç tanılama zaman çizelgesi yazmak üzere `OPENCLAW_DIAGNOSTICS=timeline` ile `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` ayarlayın. Bayrağı yapılandırmada `diagnostics.flags: ["timeline"]` ile de etkinleştirebilirsiniz; yol yine env tarafından sağlanır. Olay döngüsü örneklerini dahil etmek için `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` ekleyin.
- Önce `pnpm build` çalıştırın, ardından derlenmiş CLI girişine karşı Gateway başlangıcını kıyaslamak için `pnpm test:startup:gateway -- --runs 5 --warmup 1` çalıştırın. Kıyaslama ilk süreç çıktısını, `/healthz`, `/readyz`, başlangıç izleme zamanlamalarını, olay döngüsü gecikmesini ve Plugin arama tablosu zamanlama ayrıntılarını kaydeder.
- Önce `pnpm build` çalıştırın, ardından macOS veya Linux üzerinde derlenmiş CLI girişine karşı süreç içi Gateway yeniden başlatmasını kıyaslamak için `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` çalıştırın. Yeniden başlatma kıyaslaması SIGUSR1 kullanır, alt süreçte hem başlangıç hem de yeniden başlatma izlerini etkinleştirir ve sonraki `/healthz`, sonraki `/readyz`, kesinti süresi, hazır olma zamanlaması, CPU, RSS ve yeniden başlatma iz metriklerini kaydeder.
- `/healthz` değerini canlılık, `/readyz` değerini kullanılabilir hazır olma olarak ele alın. İz satırları ve kıyaslama çıktısı sahiplik atfı içindir; tek bir iz aralığını veya tek bir örneği tam bir performans sonucu olarak ele almayın.

## Çalışan bir Gateway'i sorgulama

Tüm sorgu komutları WebSocket RPC kullanır.

<Tabs>
  <Tab title="Output modes">
    - Varsayılan: insan tarafından okunabilir (TTY'de renkli).
    - `--json`: makine tarafından okunabilir JSON (stil/spinner yok).
    - `--no-color` (veya `NO_COLOR=1`): insan düzenini korurken ANSI'yi devre dışı bırak.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: Gateway WebSocket URL'si.
    - `--token <token>`: Gateway token'ı.
    - `--password <password>`: Gateway parolası.
    - `--timeout <ms>`: zaman aşımı/bütçe (komuta göre değişir).
    - `--expect-final`: "final" yanıtı bekle (ajan çağrıları).

  </Tab>
</Tabs>

<Note>
`--url` ayarladığınızda CLI, yapılandırma veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` açıkça geçin. Açık kimlik bilgilerinin eksik olması hatadır.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

HTTP `/healthz` uç noktası bir canlılık sondasıdır: sunucu HTTP'ye yanıt verebildiğinde döner. HTTP `/readyz` uç noktası daha katıdır ve başlangıç Plugin sidecar'ları, kanallar veya yapılandırılmış hook'lar hâlâ yerleşirken kırmızı kalır. Yerel veya kimliği doğrulanmış ayrıntılı hazır olma yanıtları, olay döngüsü gecikmesi, olay döngüsü kullanımı, CPU çekirdek oranı ve `degraded` bayrağı içeren bir `eventLoop` tanılama bloğu içerir.

<ParamField path="--port <port>" type="number">
  Bu porttaki local loopback Gateway'i hedefle. Bu, sağlık çağrısı için `OPENCLAW_GATEWAY_URL` ve `OPENCLAW_GATEWAY_PORT` değerlerini geçersiz kılar.
</ParamField>

### `gateway usage-cost`

Oturum günlüklerinden kullanım maliyeti özetlerini getir.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Dahil edilecek gün sayısı.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Maliyet özetini yapılandırılmış tek bir ajan kimliğine kapsamla.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Maliyet özetini tüm yapılandırılmış ajanlar genelinde topla. `--agent` ile birleştirilemez.
</ParamField>

### `gateway stability`

Çalışan bir Gateway'den yakın tarihli tanılama kararlılık kaydedicisini getir.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Dahil edilecek en fazla yakın tarihli olay sayısı (üst sınır `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  `payload.large` veya `diagnostic.memory.pressure` gibi tanılama olay türüne göre filtrele.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Yalnızca bir tanılama sıra numarasından sonraki olayları dahil et.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Çalışan Gateway'i çağırmak yerine kalıcı bir kararlılık paketini oku. Durum dizini altındaki en yeni paket için `--bundle latest` (veya yalnızca `--bundle`) kullanın ya da doğrudan bir paket JSON yolu geçin.
</ParamField>
<ParamField path="--export" type="boolean">
  Kararlılık ayrıntılarını yazdırmak yerine paylaşılabilir bir destek tanılama zip'i yaz.
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` için çıktı yolu.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - Kayıtlar operasyonel meta verileri tutar: olay adları, sayımlar, bayt boyutları, bellek okumaları, kuyruk/oturum durumu, kanal/Plugin adları ve redakte edilmiş oturum özetleri. Sohbet metni, webhook gövdeleri, araç çıktıları, ham istek veya yanıt gövdeleri, token'lar, çerezler, gizli değerler, ana makine adları veya ham oturum kimlikleri tutmazlar. Kaydediciyi tamamen devre dışı bırakmak için `diagnostics.enabled: false` ayarlayın.
    - Ölümcül Gateway çıkışlarında, kapanma zaman aşımlarında ve yeniden başlatma başlangıç hatalarında OpenClaw, kaydedicinin olayları varsa aynı tanılama anlık görüntüsünü `~/.openclaw/logs/stability/openclaw-stability-*.json` dosyasına yazar. En yeni paketi `openclaw gateway stability --bundle latest` ile inceleyin; `--limit`, `--type` ve `--since-seq` paket çıktısına da uygulanır.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Hata raporlarına eklenmek üzere tasarlanmış yerel bir tanılama zip'i yaz. Gizlilik modeli ve paket içerikleri için [Tanılama Dışa Aktarma](/tr/gateway/diagnostics) bölümüne bakın.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Çıktı zip yolu. Varsayılan olarak durum dizini altında bir destek dışa aktarımı kullanılır.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Dahil edilecek en fazla temizlenmiş günlük satırı sayısı.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  İncelenecek en fazla günlük baytı.
</ParamField>
<ParamField path="--url <url>" type="string">
  Sağlık anlık görüntüsü için Gateway WebSocket URL’si.
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

Dışa aktarım bir manifest, Markdown özeti, yapılandırma şekli, temizlenmiş yapılandırma ayrıntıları, temizlenmiş günlük özetleri, temizlenmiş Gateway durum/sağlık anlık görüntüleri ve varsa en yeni kararlılık paketini içerir.

Paylaşılmak üzere tasarlanmıştır. Hata ayıklamaya yardımcı olan güvenli OpenClaw günlük alanları, alt sistem adları, durum kodları, süreler, yapılandırılmış kipler, bağlantı noktaları, plugin kimlikleri, sağlayıcı kimlikleri, gizli olmayan özellik ayarları ve düzeltilmiş operasyonel günlük mesajları gibi operasyonel ayrıntıları tutar. Sohbet metni, webhook gövdeleri, araç çıktıları, kimlik bilgileri, çerezler, hesap/mesaj tanımlayıcıları, istem/yönerge metni, ana makine adları ve gizli değerleri atlar veya düzeltir. LogTape tarzı bir mesaj kullanıcı/sohbet/araç yükü metni gibi göründüğünde, dışa aktarım yalnızca bir mesajın atlandığını ve bayt sayısını tutar.

### `gateway status`

`gateway status`, Gateway hizmetini (launchd/systemd/schtasks) ve isteğe bağlı bir bağlantı/kimlik doğrulama yeteneği yoklamasını gösterir.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Açık bir yoklama hedefi ekle. Yapılandırılmış uzak + localhost yine de yoklanır.
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
  Bağlantı yoklamasını atla (yalnızca hizmet görünümü).
</ParamField>
<ParamField path="--deep" type="boolean">
  Sistem düzeyi hizmetleri de tara.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Varsayılan bağlantı yoklamasını okuma yoklamasına yükselt ve bu okuma yoklaması başarısız olduğunda sıfır olmayan kodla çık. `--no-probe` ile birlikte kullanılamaz.
</ParamField>

<AccordionGroup>
  <Accordion title="Durum semantiği">
    - `gateway status`, yerel CLI yapılandırması eksik veya geçersiz olsa bile tanılama için kullanılabilir kalır.
    - Varsayılan `gateway status`, hizmet durumunu, WebSocket bağlantısını ve el sıkışma sırasında görünen kimlik doğrulama yeteneğini kanıtlar. Okuma/yazma/yönetici işlemlerini kanıtlamaz.
    - Tanılama yoklamaları, ilk kez cihaz kimlik doğrulaması için değişiklik yapmaz: varsa mevcut önbelleğe alınmış bir cihaz belirtecini yeniden kullanır, ancak yalnızca durumu denetlemek için yeni bir CLI cihaz kimliği veya salt okunur cihaz eşleştirme kaydı oluşturmaz.
    - `gateway status`, mümkün olduğunda yoklama kimlik doğrulaması için yapılandırılmış kimlik doğrulama SecretRef’lerini çözer.
    - Bu komut yolunda gerekli bir kimlik doğrulama SecretRef’i çözülemezse, yoklama bağlantısı/kimlik doğrulaması başarısız olduğunda `gateway status --json` `rpc.authWarning` bildirir; `--token`/`--password` seçeneklerini açıkça geçirin veya önce gizli kaynak kaynağını çözün.
    - Yoklama başarılı olursa, yanlış pozitiflerden kaçınmak için çözülemeyen auth-ref uyarıları bastırılır.
    - Yoklama etkinleştirildiğinde, çalışan Gateway bildiriyorsa JSON çıktısı `gateway.version` içerir; takip el sıkışma yoklaması sürüm meta verisi sağlayamazsa `--require-rpc`, `status.runtimeVersion` RPC yüküne geri dönebilir.
    - Dinleyen bir hizmet yeterli olmadığında ve okuma kapsamlı RPC çağrılarının da sağlıklı olması gerektiğinde betiklerde ve otomasyonda `--require-rpc` kullanın.
    - `--deep`, ek launchd/systemd/schtasks kurulumları için en iyi çaba taraması ekler. Birden fazla gateway benzeri hizmet algılandığında, insan çıktısı temizlik ipuçları yazdırır ve çoğu kurulumun makine başına bir gateway çalıştırması gerektiği konusunda uyarır.
    - `--deep`, hizmet işlemi harici bir denetleyici yeniden başlatması için temiz şekilde çıktığında yakın tarihli bir Gateway denetleyici yeniden başlatma devrini de bildirir.
    - `--deep`, yapılandırma doğrulamasını plugin farkında kipte (`pluginValidation: "full"`) çalıştırır ve yapılandırılmış plugin manifest uyarılarını (örneğin eksik kanal yapılandırma meta verileri) yüzeye çıkarır; böylece kurulum ve güncelleme duman denetimleri bunları yakalar. Varsayılan `gateway status`, plugin doğrulamasını atlayan hızlı salt okunur yolu korur.
    - İnsan çıktısı, profil veya state-dir sapmasını tanılamaya yardımcı olmak için çözümlenen dosya günlüğü yolunu ve CLI ile hizmet yapılandırma yolları/geçerlilik anlık görüntüsünü içerir.

  </Accordion>
  <Accordion title="Linux systemd kimlik doğrulama sapması denetimleri">
    - Linux systemd kurulumlarında, hizmet kimlik doğrulama sapması denetimleri birimdeki hem `Environment=` hem de `EnvironmentFile=` değerlerini okur (`%h`, tırnaklı yollar, birden çok dosya ve isteğe bağlı `-` dosyaları dahil).
    - Sapma denetimleri, birleştirilmiş çalışma zamanı env kullanarak `gateway.auth.token` SecretRef’lerini çözer (önce hizmet komutu env, ardından işlem env geri dönüşü).
    - Belirteç kimlik doğrulaması fiilen etkin değilse (açık `gateway.auth.mode` değeri `password`/`none`/`trusted-proxy` ise veya parola kazanabilirken kip ayarlanmamışsa ve hiçbir belirteç adayı kazanamıyorsa), belirteç sapması denetimleri yapılandırma belirteci çözümlemesini atlar.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe`, "her şeyin hatasını ayıkla" komutudur. Her zaman şunları yoklar:

- yapılandırılmış uzak gateway’iniz (ayarlanmışsa) ve
- uzak yapılandırılmış olsa bile localhost (loopback).

`--url` geçirirseniz, bu açık hedef ikisinin önüne eklenir. İnsan çıktısı hedefleri şöyle etiketler:

- `URL (explicit)`
- `Remote (configured)` veya `Remote (configured, inactive)`
- `Local loopback`

<Note>
Birden fazla yoklama hedefi erişilebilirse, hepsini yazdırır. Bir SSH tüneli, TLS/proxy URL’si ve yapılandırılmış uzak URL, taşıma bağlantı noktaları farklı olsa bile aynı gateway’i gösterebilir; `multiple_gateways`, farklı veya kimliği belirsiz erişilebilir gateway’ler için ayrılmıştır. Yalıtılmış profiller kullandığınızda (ör. kurtarma botu) birden çok gateway desteklenir, ancak çoğu kurulum yine de tek bir gateway çalıştırır.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Bu bağlantı noktasını local loopback yoklama hedefi ve SSH tüneli uzak bağlantı noktası için kullan. `--url` olmadan, bu yapılandırılmış gateway ortam URL’si, ortam bağlantı noktası veya uzak hedefler yerine local loopback hedefini seçer.
</ParamField>

<AccordionGroup>
  <Accordion title="Yorumlama">
    - `Reachable: yes`, en az bir hedefin WebSocket bağlantısını kabul ettiği anlamına gelir.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only`, yoklamanın kimlik doğrulama hakkında neyi kanıtlayabildiğini bildirir. Erişilebilirlikten ayrıdır.
    - `Read probe: ok`, okuma kapsamlı ayrıntı RPC çağrılarının (`health`/`status`/`system-presence`/`config.get`) da başarılı olduğu anlamına gelir.
    - `Read probe: limited - missing scope: operator.read`, bağlantının başarılı olduğu ancak okuma kapsamlı RPC’nin sınırlı olduğu anlamına gelir. Bu, tam başarısızlık olarak değil **bozulmuş** erişilebilirlik olarak bildirilir.
    - `Connect: ok` sonrasında `Read probe: failed`, Gateway’in WebSocket bağlantısını kabul ettiği ancak takip okuma tanılamalarının zaman aşımına uğradığı veya başarısız olduğu anlamına gelir. Bu da erişilemeyen Gateway değil, **bozulmuş** erişilebilirliktir.
    - `gateway status` gibi, probe mevcut önbelleğe alınmış cihaz kimlik doğrulamasını yeniden kullanır ancak ilk kez cihaz kimliği veya eşleştirme durumu oluşturmaz.
    - Çıkış kodu yalnızca yoklanan hiçbir hedef erişilebilir olmadığında sıfır olmayan değerdedir.

  </Accordion>
  <Accordion title="JSON çıktısı">
    Üst düzey:

    - `ok`: en az bir hedef erişilebilir.
    - `degraded`: en az bir hedef bağlantı kabul etti ancak tam ayrıntılı RPC tanılamalarını tamamlamadı.
    - `capability`: erişilebilir hedefler arasında görülen en iyi yetenek (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` veya `unknown`).
    - `primaryTargetId`: şu sırada etkin kazanan olarak ele alınacak en iyi hedef: açık URL, SSH tüneli, yapılandırılmış uzak, ardından local loopback.
    - `warnings[]`: `code`, `message` ve isteğe bağlı `targetIds` içeren en iyi çaba uyarı kayıtları.
    - `network`: geçerli yapılandırma ve ana makine ağından türetilen local loopback/tailnet URL ipuçları.
    - `discovery.timeoutMs` ve `discovery.count`: bu yoklama geçişi için kullanılan gerçek keşif bütçesi/sonuç sayısı.

    Hedef başına (`targets[].connect`):

    - `ok`: bağlantı + bozulmuş sınıflandırması sonrasında erişilebilirlik.
    - `rpcOk`: tam ayrıntılı RPC başarısı.
    - `scopeLimited`: eksik operatör kapsamı nedeniyle ayrıntı RPC başarısız oldu.

    Hedef başına (`targets[].auth`):

    - `role`: varsa `hello-ok` içinde bildirilen kimlik doğrulama rolü.
    - `scopes`: varsa `hello-ok` içinde bildirilen verilmiş kapsamlar.
    - `capability`: o hedef için yüzeye çıkarılan kimlik doğrulama yeteneği sınıflandırması.

  </Accordion>
  <Accordion title="Yaygın uyarı kodları">
    - `ssh_tunnel_failed`: SSH tüneli kurulumu başarısız oldu; komut doğrudan yoklamalara geri döndü.
    - `multiple_gateways`: farklı gateway kimlikleri erişilebilirdi veya OpenClaw erişilebilir hedeflerin aynı gateway olduğunu kanıtlayamadı. Aynı gateway’e giden bir SSH tüneli, proxy URL’si veya yapılandırılmış uzak URL bu uyarıyı tetiklemez.
    - `auth_secretref_unresolved`: yapılandırılmış bir kimlik doğrulama SecretRef’i başarısız bir hedef için çözülemedi.
    - `probe_scope_limited`: WebSocket bağlantısı başarılı oldu, ancak okuma yoklaması eksik `operator.read` nedeniyle sınırlıydı.

  </Accordion>
</AccordionGroup>

#### SSH üzerinden uzak (Mac uygulaması eşdeğerliği)

macOS uygulamasındaki "Remote over SSH" kipi, uzak gateway’in (yalnızca loopback’e bağlı olabilir) `ws://127.0.0.1:<port>` adresinde erişilebilir olması için yerel port yönlendirme kullanır.

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
  Çözümlenen keşif uç noktasından (`local.` artı varsa yapılandırılmış geniş alan etki alanı) SSH hedefi olarak keşfedilen ilk gateway ana makinesini seç. Yalnızca TXT ipuçları yok sayılır.
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
  Gateway WebSocket URL’si.
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
  Esas olarak nihai yükten önce ara olaylar akıtan ajan tarzı RPC’ler için.
</ParamField>
<ParamField path="--json" type="boolean">
  Makine tarafından okunabilir JSON çıktısı.
</ParamField>

<Note>
`--params` geçerli JSON olmalıdır.
</Note>

## Gateway hizmetini yönet

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Bir sarmalayıcı ile kur

Yönetilen hizmetin başka bir yürütülebilir dosya üzerinden başlatılması gerektiğinde `--wrapper` kullanın; örneğin bir
gizli bilgi yöneticisi shim'i veya bir farklı kullanıcıyla çalıştırma yardımcısı. Sarmalayıcı normal Gateway argümanlarını alır ve
sonunda bu argümanlarla `openclaw` ya da Node için exec çağrısı yapmaktan sorumludur.

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
yürütülebilir bir dosya olduğunu doğrular, sarmalayıcıyı hizmet `ProgramArguments` alanına yazar ve daha sonraki zorunlu yeniden kurulumlar, güncellemeler ve doctor
onarımları için hizmet ortamında `OPENCLAW_WRAPPER` değerini kalıcı hale getirir.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Kalıcı hale getirilmiş bir sarmalayıcıyı kaldırmak için yeniden kurulum sırasında `OPENCLAW_WRAPPER` değerini temizleyin:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Command options">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - Yönetilen bir hizmeti yeniden başlatmak için `gateway restart` kullanın. Yeniden başlatma yerine `gateway stop` ve `gateway start` komutlarını zincirlemeyin.
    - macOS'te `gateway stop` varsayılan olarak `launchctl bootout` kullanır; bu, LaunchAgent'ı kalıcı bir devre dışı bırakma olmadan geçerli önyükleme oturumundan kaldırır — KeepAlive otomatik kurtarma gelecekteki çökmeler için etkin kalır ve `gateway start`, el ile `launchctl enable` gerekmeden temiz biçimde yeniden etkinleştirir. KeepAlive ve RunAtLoad özelliklerini kalıcı olarak bastırmak için `--disable` geçin; böylece bir sonraki açık `gateway start` komutuna kadar Gateway yeniden doğmaz. El ile durdurmanın yeniden başlatmalar veya sistem yeniden başlatmaları sonrasında da geçerli kalması gerektiğinde bunu kullanın.
    - `gateway restart --safe`, çalışan Gateway'den etkin OpenClaw işlerini ön kontrolden geçirmesini ve yanıt teslimi, gömülü çalıştırmalar ve görev çalıştırmaları boşalana kadar yeniden başlatmayı ertelemesini ister. `--safe`, `--force` veya `--wait` ile birlikte kullanılamaz.
    - `gateway restart --wait 30s`, bu yeniden başlatma için yapılandırılmış yeniden başlatma boşaltma bütçesini geçersiz kılar. Yalın sayılar milisaniyedir; `s`, `m` ve `h` gibi birimler kabul edilir. `--wait 0` süresiz bekler.
    - `gateway restart --safe --skip-deferral`, OpenClaw farkındalıklı güvenli yeniden başlatmayı çalıştırır ancak erteleme kapısını atlar; böylece engelleyiciler bildirilse bile Gateway yeniden başlatmayı hemen yayar. Takılı kalan görev çalıştırma ertelemeleri için operatör kaçış yoludur; `--safe` gerektirir.
    - `gateway restart --force`, etkin iş boşaltmasını atlar ve hemen yeniden başlatır. Bir operatör listelenen görev engelleyicilerini zaten incelemişse ve Gateway'i hemen geri istiyorsa bunu kullanın.
    - Yaşam döngüsü komutları betik yazımı için `--json` kabul eder.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - Belirteç kimlik doğrulaması bir belirteç gerektirdiğinde ve `gateway.auth.token` SecretRef tarafından yönetildiğinde, `gateway install` SecretRef'in çözümlenebilir olduğunu doğrular ancak çözümlenen belirteci hizmet ortamı meta verilerine kalıcı olarak yazmaz.
    - Belirteç kimlik doğrulaması bir belirteç gerektiriyorsa ve yapılandırılmış belirteç SecretRef'i çözümlenemiyorsa, kurulum yedek düz metni kalıcı hale getirmek yerine kapalı şekilde başarısız olur.
    - `gateway run` üzerinde parola kimlik doğrulaması için satır içi `--password` yerine `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` veya SecretRef destekli `gateway.auth.password` tercih edin.
    - Çıkarımsal kimlik doğrulama modunda, yalnızca kabuktaki `OPENCLAW_GATEWAY_PASSWORD` kurulum belirteci gereksinimlerini gevşetmez; yönetilen bir hizmet kurarken dayanıklı yapılandırma (`gateway.auth.password` veya yapılandırma `env`) kullanın.
    - Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar kurulum engellenir.

  </Accordion>
</AccordionGroup>

## Gateway'leri keşfetme (Bonjour)

`gateway discover`, Gateway işaretçilerini (`_openclaw-gw._tcp`) tarar.

- Çok noktaya yayın DNS-SD: `local.`
- Tek noktaya yayın DNS-SD (Wide-Area Bonjour): bir etki alanı seçin (örnek: `openclaw.internal.`) ve bölünmüş DNS + bir DNS sunucusu kurun; bkz. [Bonjour](/tr/gateway/bonjour).

Yalnızca Bonjour keşfi etkinleştirilmiş (varsayılan) Gateway'ler işaretçiyi duyurur.

Geniş alan keşif kayıtları şu TXT ipuçlarını içerebilir:

- `role` (Gateway rol ipucu)
- `transport` (taşıma ipucu, ör. `gateway`)
- `gatewayPort` (WebSocket bağlantı noktası, genellikle `18789`)
- `sshPort` (yalnızca tam keşif modu; istemciler yoksa varsayılan SSH hedeflerini `22` olarak ayarlar)
- `tailnetDns` (varsa MagicDNS ana makine adı)
- `gatewayTls` / `gatewayTlsSha256` (TLS etkin + sertifika parmak izi)
- `cliPath` (yalnızca tam keşif modu)

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
- CLI, `local.` alanını ve etkinleştirildiğinde yapılandırılmış geniş alan etki alanını tarar.
- JSON çıktısındaki `wsUrl`, `lanHost` veya `tailnetDns` gibi yalnızca TXT ipuçlarından değil, çözümlenen hizmet uç noktasından türetilir.
- `local.` mDNS ve geniş alan DNS-SD üzerinde `sshPort` ve `cliPath`, yalnızca `discovery.mdns.mode` değeri `full` olduğunda yayımlanır.

</Note>

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway runbook](/tr/gateway)
