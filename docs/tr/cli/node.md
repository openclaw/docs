---
read_when:
    - Başsız Node ana bilgisayarını çalıştırma
    - system.run için macOS dışı bir Node'u eşleştirme
summary: '`openclaw node` (başsız Node ana bilgisayarı) için CLI başvurusu'
title: Node
x-i18n:
    generated_at: "2026-07-16T17:15:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d17b96b8829bef4202ff220d9b20e04c183702f997f669120cb16aa7191235b6
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Gateway WebSocket'e bağlanan ve bu makinede
`system.run` / `system.which` özelliklerini sunan bir **başsız Node ana bilgisayarı** çalıştırın.

macOS'te menü çubuğu uygulaması, bu Node ana bilgisayarı çalışma zamanını zaten kendi
Node bağlantısına yerleştirir ve yerel Mac yetenekleri ekler. Mac'te `openclaw node run`
komutunu yalnızca uygulama olmadan başsız bir Node çalıştırmayı bilinçli olarak istediğinizde kullanın. İkisini
birlikte çalıştırmak aynı makine için iki Node kimliği oluşturur.

## Neden bir Node ana bilgisayarı kullanılmalı?

Ağınızdaki diğer makinelere tam bir macOS yardımcı uygulaması yüklemeden aracıların bu
makinelerde **komut çalıştırmasını** istediğinizde bir Node ana bilgisayarı kullanın.

Yaygın kullanım alanları:

- Uzak Linux/Windows makinelerinde (derleme sunucuları, laboratuvar makineleri, NAS) komut çalıştırma.
- exec'i Gateway üzerinde **korumalı alanda** tutarken onaylı çalıştırmaları diğer ana bilgisayarlara devretme.
- Otomasyon veya CI Node'ları için hafif ve başsız bir yürütme hedefi sağlama.

Yürütme, Node ana bilgisayarındaki **exec onayları** ve aracı başına izin verilenler listeleriyle
korunmaya devam eder; böylece komut erişimini sınırlı ve açık tutabilirsiniz.

`openclaw node run`, bağlandıktan sonra Plugin veya MCP destekli araçları yayımlayabilir.
Gateway, varsayılan olarak eşleştirilmiş Node'dan gelen tanımlayıcılara güvenirken
her tanımlayıcının komutunun Node'un onaylanmış komut yüzeyinde kalmasını zorunlu kılar. Aracı,
kabul edilen her tanımlayıcıyı normal bir Plugin aracı olarak görür ancak yürütme yine
`node.invoke` üzerinden gerçekleşir; dolayısıyla Node bağlantısının kesilmesi, aracı yeni
çalıştırıldığında aracı kaldırır. Gateway operatörleri yayını
`gateway.nodes.pluginTools.enabled: false` ile devre dışı bırakabilir.

Bildirim temelli MCP araçları için Node makinesindeki `openclaw.json` içinde
`nodeHost.mcp.servers` altına normal MCP sunucusu yapısını ekleyin, ardından Node
ana bilgisayarını yeniden başlatın. Node, onay kapılı `mcp.tools.call.v1` komut
ailesini bildirir ve bağlandıktan sonra listelenen araçları yayımlar; sunucu listesini
daha sonra değiştirmek yeniden eşleştirme gerektirmez. Bkz.
[Node üzerinde barındırılan MCP sunucuları](/tr/nodes#node-hosted-mcp-servers).

## Tarayıcı proxy'si (sıfır yapılandırma)

Node üzerinde `browser.enabled` devre dışı bırakılmamışsa Node ana bilgisayarları
otomatik olarak bir tarayıcı proxy'si duyurur. Bu, aracının ek yapılandırma olmadan
o Node üzerinde tarayıcı otomasyonunu kullanmasını sağlar.

Proxy varsayılan olarak Node'un normal tarayıcı profili yüzeyini sunar.
`nodeHost.browserProxy.allowProfiles` ayarlanırsa proxy kısıtlayıcı hâle gelir:
izin verilenler listesinde olmayan profil hedefleme reddedilir ve kalıcı profil
oluşturma/silme yolları proxy üzerinden engellenir.

Gerekirse Node üzerinde devre dışı bırakın:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Çalıştırma (ön plan)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Seçenekler:

- `--host <host>`: Gateway WebSocket ana bilgisayarı (varsayılan: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket bağlantı noktası (varsayılan: `18789`)
- `--context-path <path>`: Gateway WebSocket bağlam yolu (ör. `/openclaw-gw`). WebSocket URL'sine eklenir.
- `--tls`: Gateway bağlantısı için TLS kullan
- `--no-tls`: Yerel Gateway yapılandırması TLS'yi etkinleştirse bile düz metin Gateway bağlantısını zorunlu kıl
- `--tls-fingerprint <sha256>`: Beklenen TLS sertifikası parmak izi (sha256)
- `--node-id <id>`: Paylaşılan SQLite durumunda saklanan istemci örneği kimliğini geçersiz kıl (eşleştirmeyi sıfırlamaz)
- `--display-name <name>`: Node görünen adını geçersiz kıl

## Node ana bilgisayarı için Gateway kimlik doğrulaması

`openclaw node run` ve `openclaw node install`, Gateway kimlik doğrulamasını yapılandırmadan/ortamdan çözümler (Node komutlarında `--token`/`--password` bayrakları yoktur):

- Önce `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` denetlenir.
- Ardından yerel yapılandırma geri dönüşü: `gateway.auth.token` / `gateway.auth.password`.
- Yerel modda Node ana bilgisayarı, `gateway.remote.token` / `gateway.remote.password` değerlerini kasıtlı olarak devralmaz.
- `gateway.auth.token` / `gateway.auth.password`, SecretRef aracılığıyla açıkça yapılandırılmış ve çözümlenmemişse Node kimlik doğrulaması çözümlemesi kapalı biçimde başarısız olur (uzak geri dönüş bunu maskelemez).
- `gateway.mode=remote` içinde uzak istemci alanları (`gateway.remote.token` / `gateway.remote.password`) da uzak öncelik kurallarına göre kullanılabilir.
- Node ana bilgisayarı kimlik doğrulaması çözümlemesi yalnızca `OPENCLAW_GATEWAY_*` ortam değişkenlerini dikkate alır.

Düz metin bir `ws://` Gateway'e bağlanan bir Node için geri döngü,
özel IP değişmezleri, `.local` ve Tailnet `*.ts.net` ana bilgisayarları kabul edilir. Güvenilen diğer
özel DNS adları için `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ayarlayın; bu ayar olmadan
Node başlangıcı kapalı biçimde başarısız olur ve `wss://`, bir SSH tüneli veya
Tailscale kullanmanızı ister. Bu, bir `openclaw.json` yapılandırma
anahtarı değil, işlem ortamı üzerinden açıkça etkinleştirilen bir seçenektir.
`openclaw node install`, kurulum komutunun ortamında mevcut olduğunda bunu
denetimli Node hizmetine kalıcı olarak kaydeder.

## Hizmet (arka plan)

Başsız bir Node ana bilgisayarını kullanıcı hizmeti olarak yükleyin (macOS'te launchd,
Linux'ta systemd, Windows'ta Windows Task Scheduler).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Seçenekler:

- `--host <host>`: Gateway WebSocket ana bilgisayarı (varsayılan: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket bağlantı noktası (varsayılan: `18789`)
- `--context-path <path>`: Gateway WebSocket bağlam yolu (ör. `/openclaw-gw`). WebSocket URL'sine eklenir.
- `--tls`: Gateway bağlantısı için TLS kullan
- `--tls-fingerprint <sha256>`: Beklenen TLS sertifikası parmak izi (sha256)
- `--node-id <id>`: Paylaşılan SQLite durumunda saklanan istemci örneği kimliğini geçersiz kıl (eşleştirmeyi sıfırlamaz)
- `--display-name <name>`: Node görünen adını geçersiz kıl
- `--runtime <runtime>`: Hizmet çalışma zamanı (`node`)
- `--force`: Zaten yüklüyse yeniden yükle/üzerine yaz

Hizmeti yönetin:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Ön plandaki bir Node ana bilgisayarı için `openclaw node run` kullanın (hizmet yoktur).

Hizmet komutları, makine tarafından okunabilir çıktı için `--json` kabul eder.

Node ana bilgisayarı, Gateway'in yeniden başlatılması ve ağ bağlantısının kapanması durumlarında
işlem içinde yeniden dener. Gateway, sonlandırıcı bir belirteç/parola/önyükleme kimlik doğrulaması duraklaması bildirirse
Node ana bilgisayarı kapanış ayrıntısını günlüğe kaydeder ve launchd/systemd/Task Scheduler'ın
onu yeni yapılandırma ve kimlik bilgileriyle yeniden başlatabilmesi için sıfır olmayan kodla çıkar.
Eşleştirme gerektiren duraklamalar, bekleyen isteğin onaylanabilmesi için
ön plan akışında kalır.

## Eşleştirme

İlk bağlantı, Gateway üzerinde bekleyen bir cihaz eşleştirme isteği (`role: node`) oluşturur.

Gateway ana bilgisayarı Node ana bilgisayarına etkileşimsiz olarak SSH ile bağlanabiliyorsa (aynı kullanıcı,
güvenilen ana bilgisayar anahtarı) bekleyen istek otomatik olarak onaylanır: Gateway,
SSH üzerinden Node ana bilgisayarında `openclaw node identity --json` çalıştırır ve
cihaz anahtarı tam olarak eşleştiğinde onaylar. Bu varsayılan olarak etkindir; gereksinimler ve
nasıl devre dışı bırakılacağı (`gateway.nodes.pairing.sshVerify: false`) için
[SSH ile doğrulanan otomatik cihaz onayı](/tr/gateway/pairing#ssh-verified-device-auto-approval-default)
bölümüne bakın.

Aksi takdirde şu komutlarla elle onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway'in doğruladığı yerel Node kimliğini inceleyin:

```bash
openclaw node identity --json
```

`identity/device.json` içindeki cihaz kimliğini ve genel anahtarı yazdırır; kimlik
dosyalarını hiçbir zaman oluşturmaz veya değiştirmez.

Sıkı biçimde denetlenen Node ağlarında Gateway operatörü, güvenilen CIDR'lerden gelen
ilk Node eşleştirmesini otomatik olarak onaylamayı açıkça etkinleştirebilir:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Bu özellik varsayılan olarak devre dışıdır (`autoApproveCidrs` ayarlanmamıştır). Yalnızca
istenen kapsam bulunmayan ve Gateway'in güvendiği bir istemci IP'sinden gelen yeni
`role: node` eşleştirmesine uygulanır. Operatör/tarayıcı istemcileri, Control UI,
WebChat ve rol, kapsam, meta veri veya genel anahtar yükseltmeleri yine elle onay gerektirir.

Node, değiştirilmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/genel anahtar) eşleştirmeyi yeniden denerse
önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur.
Onaylamadan önce `openclaw devices list` komutunu yeniden çalıştırın.

### Kimlik ve eşleştirme durumu

Başsız Node, istemci örneği kimliğini Gateway'in eşleştirme ve yönlendirme için
kullandığı imzalı cihaz kimliğinden ayırır. Bu durum, OpenClaw durum dizininde
(varsayılan olarak `~/.openclaw`; ayarlandığında `$OPENCLAW_STATE_DIR`) bulunur:

| Durum                                        | Amaç                                                                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `state/openclaw.sqlite` (`node_host_config`) | İstemci örneği kimliği, görünen ad ve Gateway bağlantısı meta verileri. İstemci bu kimliği `instanceId` olarak gönderir.                     |
| `identity/device.json`                       | İmzalı Ed25519 anahtar çifti ve türetilmiş cihaz kimliği. İmzalı bağlantılarda bu cihaz kimliği, yönlendirilen Node kimliği ve eşleştirme kimliğidir. |
| `identity/device-auth.json`                  | Kriptografik cihaz kimliğine ve role göre anahtarlanmış eşleştirilmiş cihaz belirteçleri.                                                                 |

`--node-id`, yalnızca paylaşılan SQLite durumundaki istemci örneği kimliğini değiştirir.
Kriptografik cihaz kimliğini değiştirmez veya eşleştirme kimlik doğrulamasını temizlemez. Kullanımdan kaldırılmış bir
`node.json` değerini `openclaw doctor --fix` ile taşımak da eşleştirmeyi sıfırlamaz. Bir
Node'un yetkisini kaldırıp yeniden eşleştirmek için:

1. Gateway üzerinde `openclaw nodes remove --node <id|name|ip>` komutunu çalıştırın.
2. Node üzerinde, yüklü hizmeti `openclaw node restart` ile yeniden başlatın veya
   ön plandaki `openclaw node run` komutunu durdurup yeniden çalıştırın. Bu işlem,
   cihaz eşleştirme akışını başlatır. `openclaw devices list` bir istek göstermiyorsa
   ve Node `AUTH_DEVICE_TOKEN_MISMATCH` bildiriyorsa Node'u bir kez
   daha yeniden başlatın veya yeniden çalıştırın. Reddedilen deneme, artık iptal edilmiş yerel belirteci temizler;
   sonraki deneme eşleştirme isteyebilir.
3. Gateway üzerinde `openclaw devices list`, ardından
   `openclaw devices approve <deviceRequestId>` komutunu çalıştırın.
4. Node'u yeniden başlatın veya yeniden çalıştırın. Eşleştirme için duraklatılmış bir istemci,
   onaydan sonra otomatik olarak devam etmez; bu yeniden bağlantı ayrı
   komut yüzeyi isteğini oluşturur.
5. Gateway üzerinde `openclaw nodes pending`, ardından
   `openclaw nodes approve <nodeRequestId>` komutunu çalıştırın.

İki istek kimliği birbirinden farklıdır. Uygulanabilir bir güvenilen CIDR politikası,
ilk cihaz eşleştirme adımını otomatik olarak onaylayabilir; komut yüzeyi onayı ayrı
bir denetim olarak kalır.

Eski OpenClaw sürümleri, Node ana bilgisayarı durumunu `node.json` içinde saklardı ve
orada eski bir `token` alanı bırakabilirdi. Node ana bilgisayarını durdurun ve
`openclaw doctor --fix` komutunu bir kez çalıştırın; Doctor, desteklenen kimlik ve bağlantı
alanlarını SQLite'a aktarır, kullanılmayan belirteç alanını atar, satırı doğrular ve
kullanımdan kaldırılmış dosyayı siler. Dosya veya kesintiye uğramış bir Doctor talebi mevcut olduğu sürece
normal Node komutları bu onarım talimatıyla kapalı biçimde başarısız olur. `identity/` altındaki
her iki dosyayı da gizli tutun; bunlar cihaz anahtar çiftini ve kimlik doğrulama belirteçlerini içerir.

## Exec onayları

`system.run`, yerel exec onaylarıyla denetlenir:

- `$OPENCLAW_STATE_DIR/exec-approvals.json` veya
  değişken ayarlanmamışsa `~/.openclaw/exec-approvals.json`
- [Exec onayları](/tr/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (Gateway üzerinden düzenleyin)

OpenClaw, onaylanmış zaman uyumsuz Node exec işlemi için istemde bulunmadan önce standart bir
`systemRunPlan` hazırlar. Daha sonra onaylanan `system.run` iletimi,
saklanan bu planı yeniden kullanır; böylece onay isteği oluşturulduktan sonra komut/cwd/oturum
alanlarında yapılan düzenlemeler, Node'un yürüteceği işlemi değiştirmek yerine reddedilir.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Node'lar](/tr/nodes)
