---
read_when:
    - Arayüzsüz Node ana makinesini çalıştırma
    - system.run için macOS olmayan bir Node'u eşleştirme
summary: '`openclaw node` için CLI başvurusu (arabirimsiz Node ana makinesi)'
title: Node
x-i18n:
    generated_at: "2026-05-06T17:53:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4735ac4961dc36fd3f11299eb3ec4e156835e7257b21a79bb1d4b467445faa
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Gateway WebSocket'a bağlanan ve bu makinede `system.run` / `system.which`
sunan bir **başsız Node ana makinesi** çalıştırın.

## Neden bir Node ana makinesi kullanılır?

Ağınızdaki başka makinelere tam bir macOS companion app yüklemeden agent'ların
bu makinelerde **komut çalıştırmasını** istediğinizde bir Node ana makinesi kullanın.

Yaygın kullanım örnekleri:

- Uzak Linux/Windows makinelerinde komut çalıştırma (build sunucuları, laboratuvar makineleri, NAS).
- exec'i gateway üzerinde **sandbox içinde** tutarken onaylanmış çalıştırmaları başka ana makinelere devretme.
- Otomasyon veya CI node'ları için hafif, başsız bir yürütme hedefi sağlama.

Yürütme yine de Node ana makinesindeki **exec onayları** ve agent başına izin
listeleriyle korunur; böylece komut erişimini kapsamlı ve açık tutabilirsiniz.

## Tarayıcı proxy'si (sıfır yapılandırma)

Node ana makineleri, Node üzerinde `browser.enabled` devre dışı bırakılmamışsa
otomatik olarak bir tarayıcı proxy'si duyurur. Bu, agent'ın ek yapılandırma
olmadan o Node üzerinde tarayıcı otomasyonu kullanmasını sağlar.

Varsayılan olarak proxy, Node'un normal tarayıcı profili yüzeyini sunar. Eğer
`nodeHost.browserProxy.allowProfiles` ayarlarsanız proxy kısıtlayıcı olur:
izin listesinde olmayan profil hedefleme reddedilir ve kalıcı profil
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

- `--host <host>`: Gateway WebSocket ana makinesi (varsayılan: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket portu (varsayılan: `18789`)
- `--tls`: Gateway bağlantısı için TLS kullan
- `--tls-fingerprint <sha256>`: Beklenen TLS sertifika parmak izi (sha256)
- `--node-id <id>`: Node kimliğini geçersiz kıl (eşleştirme token'ını temizler)
- `--display-name <name>`: Node görünen adını geçersiz kıl

## Node ana makinesi için Gateway kimlik doğrulaması

`openclaw node run` ve `openclaw node install`, Gateway kimlik doğrulamasını config/env üzerinden çözer (Node komutlarında `--token`/`--password` bayrakları yoktur):

- Önce `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` kontrol edilir.
- Ardından yerel config yedeği: `gateway.auth.token` / `gateway.auth.password`.
- Yerel modda, Node ana makinesi bilinçli olarak `gateway.remote.token` / `gateway.remote.password` değerlerini devralmaz.
- `gateway.auth.token` / `gateway.auth.password` açıkça SecretRef ile yapılandırılmış ve çözümlenmemişse, Node kimlik doğrulama çözümlemesi kapalı başarısız olur (uzak yedek maskelemesi yoktur).
- `gateway.mode=remote` içinde, uzak istemci alanları (`gateway.remote.token` / `gateway.remote.password`) da uzak öncelik kurallarına göre uygundur.
- Node ana makinesi kimlik doğrulama çözümlemesi yalnızca `OPENCLAW_GATEWAY_*` env değişkenlerini dikkate alır.

Güvenilir özel ağda, local loopback olmayan bir `ws://` Gateway'e bağlanan bir
Node için `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ayarlayın. Bu olmadan Node
başlatma kapalı başarısız olur ve sizden `wss://`, bir SSH tüneli veya Tailscale
kullanmanızı ister.
Bu, işlem ortamı düzeyinde bir katılımdır; `openclaw.json` config anahtarı değildir.
`openclaw node install`, kurulum komutu ortamında mevcut olduğunda bunu denetlenen
Node hizmetine kalıcı olarak yazar.

## Hizmet (arka plan)

Başsız bir Node ana makinesini kullanıcı hizmeti olarak kurun.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Seçenekler:

- `--host <host>`: Gateway WebSocket ana makinesi (varsayılan: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket portu (varsayılan: `18789`)
- `--tls`: Gateway bağlantısı için TLS kullan
- `--tls-fingerprint <sha256>`: Beklenen TLS sertifika parmak izi (sha256)
- `--node-id <id>`: Node kimliğini geçersiz kıl (eşleştirme token'ını temizler)
- `--display-name <name>`: Node görünen adını geçersiz kıl
- `--runtime <runtime>`: Hizmet runtime'ı (`node` veya `bun`)
- `--force`: Zaten kuruluysa yeniden kur/üzerine yaz

Hizmeti yönetin:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Ön planda çalışan bir Node ana makinesi için `openclaw node run` kullanın (hizmet yok).

Hizmet komutları, makine tarafından okunabilir çıktı için `--json` kabul eder.

Node ana makinesi, Gateway yeniden başlatmasını ve ağ kapanmalarını işlem içinde yeniden dener. Gateway terminal bir token/parola/bootstrap kimlik doğrulama duraklaması bildirirse, Node ana makinesi kapanış ayrıntısını günlüğe yazar ve sıfır olmayan kodla çıkar; böylece launchd/systemd onu yeni config ve kimlik bilgileriyle yeniden başlatabilir. Eşleştirme gerektiren duraklamalar, bekleyen isteğin onaylanabilmesi için ön plan akışında kalır.

## Eşleştirme

İlk bağlantı, Gateway üzerinde bekleyen bir cihaz eşleştirme isteği (`role: node`) oluşturur.
Şununla onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Sıkı denetimli Node ağlarında, Gateway operatörü güvenilir CIDR'lardan ilk kez
Node eşleştirmesini otomatik onaylamayı açıkça etkinleştirebilir:

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

Bu varsayılan olarak devre dışıdır. Yalnızca istenen kapsamları olmayan yeni
`role: node` eşleştirmeleri için geçerlidir. Operatör/tarayıcı istemcileri,
Control UI, WebChat ve rol, kapsam, metadata veya açık anahtar yükseltmeleri
yine de elle onay gerektirir.

Node, değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar)
eşleştirmeyi yeniden denerse, önceki bekleyen istek geçersiz kılınır ve yeni
bir `requestId` oluşturulur. Onaylamadan önce `openclaw devices list` komutunu
tekrar çalıştırın.

Node ana makinesi; Node kimliğini, token'ını, görünen adını ve gateway bağlantı bilgilerini
`~/.openclaw/node.json` içinde saklar.

## Exec onayları

`system.run`, yerel exec onaylarıyla denetlenir:

- `~/.openclaw/exec-approvals.json`
- [Exec onayları](/tr/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (Gateway'den düzenle)

Onaylanmış async Node exec için OpenClaw, istemden önce kanonik bir `systemRunPlan`
hazırlar. Daha sonra onaylanan `system.run` iletimi bu saklanan planı yeniden
kullanır; bu nedenle onay isteği oluşturulduktan sonra komut/cwd/session
alanlarında yapılan düzenlemeler, Node'un yürüteceği şeyi değiştirmek yerine reddedilir.

## İlgili

- [CLI referansı](/tr/cli)
- [Node'lar](/tr/nodes)
