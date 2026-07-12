---
read_when:
    - Başsız Node ana bilgisayarını çalıştırma
    - system.run için macOS dışındaki bir Node'u eşleştirme
summary: '`openclaw node` (başsız Node ana makinesi) için CLI referansı'
title: Node
x-i18n:
    generated_at: "2026-07-12T11:35:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 076449123d8b3e9cb092a2bd7de311b87b27a128cb381fc343c68d18aeb634a0
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Gateway WebSocket'e bağlanan ve bu makinede `system.run` / `system.which`
işlevlerini sunan **başsız bir Node ana bilgisayarı** çalıştırın.

## Neden bir Node ana bilgisayarı kullanmalısınız?

Ağınızdaki diğer makinelere tam bir macOS yardımcı uygulaması yüklemeden
ajanların bu makinelerde **komut çalıştırmasını** istediğinizde bir Node ana bilgisayarı kullanın.

Yaygın kullanım alanları:

- Uzak Linux/Windows makinelerinde (derleme sunucuları, laboratuvar makineleri, NAS) komut çalıştırma.
- Yürütmeyi Gateway üzerinde **korumalı alanda** tutarken onaylanmış çalıştırmaları diğer ana bilgisayarlara devretme.
- Otomasyon veya CI Node'ları için hafif, başsız bir yürütme hedefi sağlama.

Yürütme, Node ana bilgisayarındaki **yürütme onayları** ve ajan başına izin listeleriyle
korunmaya devam eder; böylece komut erişimini sınırlı ve açık tutabilirsiniz.

`openclaw node run`, bağlandıktan sonra Plugin veya MCP destekli araçları yayımlayabilir.
Gateway, eşleştirilmiş Node'dan gelen tanımlayıcılara varsayılan olarak güvenir; ancak
her tanımlayıcının komutunun Node'un onaylanmış komut yüzeyinde kalmasını zorunlu kılar.
Ajan, kabul edilen her tanımlayıcıyı normal bir Plugin aracı olarak görür; ancak yürütme
yine `node.invoke` üzerinden gerçekleştiğinden, Node bağlantısının kesilmesi aracı yeni
ajan çalıştırmalarından kaldırır. Gateway operatörleri yayımlamayı
`gateway.nodes.pluginTools.enabled: false` ile devre dışı bırakabilir.

Bildirimsel MCP araçları için Node makinesindeki `openclaw.json` dosyasında
`nodeHost.mcp.servers` altına normal MCP sunucu yapısını ekleyin, ardından Node
ana bilgisayarını yeniden başlatın. Node, onay denetimli `mcp.tools.call.v1` komut
ailesini bildirir ve bağlandıktan sonra listelenen araçları yayımlar; sunucu listesini
daha sonra değiştirmek yeniden eşleştirme gerektirmez. Bkz.
[Node tarafından barındırılan MCP sunucuları](/tr/nodes#node-hosted-mcp-servers).

## Tarayıcı proxy'si (sıfır yapılandırma)

Node üzerinde `browser.enabled` devre dışı bırakılmamışsa Node ana bilgisayarları
otomatik olarak bir tarayıcı proxy'si duyurur. Bu, ajanın ek yapılandırma olmadan
ilgili Node üzerinde tarayıcı otomasyonu kullanmasını sağlar.

Proxy varsayılan olarak Node'un normal tarayıcı profili yüzeyini sunar.
`nodeHost.browserProxy.allowProfiles` ayarını yaparsanız proxy kısıtlayıcı hâle gelir:
izin listesinde olmayan profilleri hedefleme reddedilir ve kalıcı profil oluşturma/silme
yolları proxy üzerinden engellenir.

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
- `--node-id <id>`: `node.json` içinde saklanan eski istemci örneği kimliğini geçersiz kıl (eşleştirmeyi sıfırlamaz)
- `--display-name <name>`: Node görünen adını geçersiz kıl

## Node ana bilgisayarı için Gateway kimlik doğrulaması

`openclaw node run` ve `openclaw node install`, Gateway kimlik doğrulamasını yapılandırmadan/ortamdan çözümler (Node komutlarında `--token`/`--password` bayrakları yoktur):

- Önce `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` denetlenir.
- Ardından yerel yapılandırmaya geri dönülür: `gateway.auth.token` / `gateway.auth.password`.
- Yerel modda Node ana bilgisayarı kasıtlı olarak `gateway.remote.token` / `gateway.remote.password` değerlerini devralmaz.
- `gateway.auth.token` / `gateway.auth.password`, SecretRef aracılığıyla açıkça yapılandırılmış ancak çözümlenmemişse Node kimlik doğrulama çözümlemesi güvenli biçimde başarısız olur (uzak geri dönüş bunu gizlemez).
- `gateway.mode=remote` modunda uzak istemci alanları (`gateway.remote.token` / `gateway.remote.password`) da uzak öncelik kurallarına göre kullanılabilir.
- Node ana bilgisayarı kimlik doğrulama çözümlemesi yalnızca `OPENCLAW_GATEWAY_*` ortam değişkenlerini dikkate alır.

Düz metin `ws://` Gateway'e bağlanan bir Node için local loopback, özel IP
sabitleri, `.local` ve Tailnet `*.ts.net` ana bilgisayarları kabul edilir. Diğer
güvenilir özel DNS adları için `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ayarlayın;
bu ayar olmadan Node başlatma işlemi güvenli biçimde başarısız olur ve `wss://`,
bir SSH tüneli veya Tailscale kullanmanızı ister. Bu, `openclaw.json`
yapılandırma anahtarı değil, işlem ortamında açıkça etkinleştirilen bir seçenektir.
`openclaw node install`, yükleme komutunun ortamında mevcutsa bu ayarı denetimli
Node hizmetinde kalıcı hâle getirir.

## Hizmet (arka plan)

Başsız bir Node ana bilgisayarını kullanıcı hizmeti olarak yükleyin (macOS'te launchd,
Linux'ta systemd, Windows'ta Windows Görev Zamanlayıcı).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Seçenekler:

- `--host <host>`: Gateway WebSocket ana bilgisayarı (varsayılan: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket bağlantı noktası (varsayılan: `18789`)
- `--context-path <path>`: Gateway WebSocket bağlam yolu (ör. `/openclaw-gw`). WebSocket URL'sine eklenir.
- `--tls`: Gateway bağlantısı için TLS kullan
- `--tls-fingerprint <sha256>`: Beklenen TLS sertifikası parmak izi (sha256)
- `--node-id <id>`: `node.json` içinde saklanan eski istemci örneği kimliğini geçersiz kıl (eşleştirmeyi sıfırlamaz)
- `--display-name <name>`: Node görünen adını geçersiz kıl
- `--runtime <runtime>`: Hizmet çalışma zamanı (`node` veya `bun`)
- `--force`: Zaten yüklüyse yeniden yükle/üzerine yaz

Hizmeti yönetin:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Ön planda çalışan bir Node ana bilgisayarı için `openclaw node run` kullanın (hizmet yoktur).

Hizmet komutları, makine tarafından okunabilir çıktı için `--json` kabul eder.

Node ana bilgisayarı, Gateway'in yeniden başlatılması ve ağ bağlantılarının kapanması
durumlarında aynı işlem içinde yeniden dener. Gateway, terminal niteliğinde bir
belirteç/parola/önyükleme kimlik doğrulaması duraklaması bildirirse Node ana bilgisayarı,
kapanma ayrıntısını günlüğe kaydeder ve launchd/systemd/Görev Zamanlayıcı'nın onu güncel
yapılandırma ve kimlik bilgileriyle yeniden başlatabilmesi için sıfırdan farklı bir kodla
çıkar. Eşleştirme gerektiren duraklamalar, bekleyen isteğin onaylanabilmesi için ön plan
akışında kalır.

## Eşleştirme

İlk bağlantı, Gateway üzerinde bekleyen bir cihaz eşleştirme isteği (`role: node`) oluşturur.

Gateway ana bilgisayarı Node ana bilgisayarına etkileşimsiz olarak SSH ile bağlanabiliyorsa
(aynı kullanıcı, güvenilir ana bilgisayar anahtarı), bekleyen istek otomatik olarak
onaylanır: Gateway, SSH üzerinden Node ana bilgisayarında `openclaw node identity --json`
komutunu çalıştırır ve cihaz anahtarı tam olarak eşleşirse onay verir. Bu özellik varsayılan
olarak açıktır; gereksinimler ve nasıl devre dışı bırakılacağı
(`gateway.nodes.pairing.sshVerify: false`) için
[SSH ile doğrulanan otomatik cihaz onayı](/tr/gateway/pairing#ssh-verified-device-auto-approval-default)
bölümüne bakın.

Aksi hâlde şunlarla manuel olarak onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway'in doğrulamada karşılaştırdığı yerel Node kimliğini inceleyin:

```bash
openclaw node identity --json
```

Bu komut, `identity/device.json` içindeki cihaz kimliğini ve ortak anahtarı yazdırır;
kimlik dosyalarını hiçbir zaman oluşturmaz veya değiştirmez.

Sıkı biçimde denetlenen Node ağlarında Gateway operatörü, güvenilir CIDR'lerden gelen
ilk Node eşleştirmesini otomatik onaylamayı açıkça etkinleştirebilir:

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

Bu özellik varsayılan olarak devre dışıdır (`autoApproveCidrs` ayarlanmamıştır).
Yalnızca Gateway'in güvendiği bir istemci IP'sinden gelen, istenen kapsamı olmayan
yeni `role: node` eşleştirmelerine uygulanır. Operatör/tarayıcı istemcileri, Control UI,
WebChat ve rol, kapsam, meta veri veya ortak anahtar yükseltmeleri yine manuel onay
gerektirir.

Node, değiştirilmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/ortak anahtar)
eşleştirmeyi yeniden denerse önceki bekleyen isteğin yerini yeni bir istek alır ve
yeni bir `requestId` oluşturulur. Onaylamadan önce `openclaw devices list` komutunu
yeniden çalıştırın.

### Kimlik ve eşleştirme durumu

Başsız Node, eski istemci örneği kimliğini Gateway'in eşleştirme ve yönlendirme için
kullandığı imzalı cihaz kimliğinden ayrı tutar. Bu dosyalar OpenClaw durum dizininde
(varsayılan olarak `~/.openclaw` veya ayarlanmışsa `$OPENCLAW_STATE_DIR`) bulunur:

| Dosya                       | Amaç                                                                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `node.json`                 | Eski `nodeId` anahtarı altındaki istemci örneği kimliği, görünen ad ve Gateway bağlantı meta verileri. İstemci bu değeri `instanceId` olarak gönderir. |
| `identity/device.json`      | İmzalı Ed25519 anahtar çifti ve türetilmiş cihaz kimliği. İmzalı bağlantılarda bu cihaz kimliği, yönlendirilen Node kimliği ve eşleştirme kimliğidir. |
| `identity/device-auth.json` | Kriptografik cihaz kimliğine ve role göre anahtarlanmış eşleştirilmiş cihaz belirteçleri.                                                       |

`--node-id` yalnızca `node.json` içindeki istemci örneği kimliğini değiştirir.
Kriptografik cihaz kimliğini değiştirmez veya eşleştirme kimlik doğrulamasını temizlemez.
Benzer şekilde yalnızca `node.json` dosyasını silmek de eşleştirmeyi sıfırlamaz.
Bir Node'un yetkisini iptal edip yeniden eşleştirmek için:

1. Gateway üzerinde `openclaw nodes remove --node <id|name|ip>` komutunu çalıştırın.
2. Node üzerinde yüklü hizmeti `openclaw node restart` ile yeniden başlatın veya
   ön plandaki `openclaw node run` komutunu durdurup yeniden çalıştırın. Bu işlem,
   cihaz eşleştirme akışını başlatır. `openclaw devices list` bir istek göstermiyorsa
   ve Node `AUTH_DEVICE_TOKEN_MISMATCH` bildiriyorsa bir kez daha yeniden başlatın
   veya çalıştırın. Reddedilen deneme, artık iptal edilmiş olan yerel belirteci
   temizler; sonraki deneme eşleştirme isteyebilir.
3. Gateway üzerinde `openclaw devices list`, ardından
   `openclaw devices approve <deviceRequestId>` komutunu çalıştırın.
4. Node'u yeniden başlatın veya çalıştırın. Eşleştirme için duraklatılmış bir istemci,
   onaydan sonra otomatik olarak devam etmez; bu yeniden bağlantı ayrı komut yüzeyi
   isteğini oluşturur.
5. Gateway üzerinde `openclaw nodes pending`, ardından
   `openclaw nodes approve <nodeRequestId>` komutunu çalıştırın.

İki istek kimliği birbirinden farklıdır. Uygulanabilir bir güvenilir CIDR politikası,
ilk cihaz eşleştirme adımını otomatik olarak onaylayabilir; komut yüzeyi onayı ayrı bir
denetim olarak kalır.

Eski OpenClaw sürümleri `node.json` içinde eski bir `token` alanı bırakabiliyordu.
Güncel OpenClaw bu alanı kullanmaz ve Node ana bilgisayarı dosyayı bir sonraki
kaydettiğinde alanı kaldırır. Cihaz anahtar çiftini ve kimlik doğrulama belirteçlerini
içerdikleri için `identity/` altındaki her iki dosyayı da gizli tutun.

## Yürütme onayları

`system.run`, yerel yürütme onaylarıyla denetlenir:

- `$OPENCLAW_STATE_DIR/exec-approvals.json` veya değişken ayarlanmamışsa
  `~/.openclaw/exec-approvals.json`
- [Yürütme onayları](/tr/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (Gateway üzerinden düzenleyin)

Onaylanmış eşzamansız Node yürütmesi için OpenClaw, istemi göstermeden önce standart
bir `systemRunPlan` hazırlar. Daha sonra onaylanan `system.run` iletimi, saklanan bu
planı yeniden kullanır; böylece onay isteği oluşturulduktan sonra komut/cwd/oturum
alanlarında yapılan düzenlemeler, Node'un çalıştıracağı şeyi değiştirmek yerine reddedilir.

## İlgili konular

- [CLI başvurusu](/tr/cli)
- [Node'lar](/tr/nodes)
