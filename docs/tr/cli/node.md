---
read_when:
    - Başsız Node ana makinesini çalıştırma
    - '`system.run` için macOS olmayan bir Node''u eşleştirme'
summary: '`openclaw node` için CLI başvurusu (başsız Node ana makinesi)'
title: Node
x-i18n:
    generated_at: "2026-04-26T11:26:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40f623b163a3c3bcd2d3ff218c5e62a4acba45f7e3f16694d8da62a004b77706
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Bu makinede Gateway WebSocket'e bağlanan ve `system.run` / `system.which` işlevlerini sunan **başsız bir Node ana makinesi** çalıştırın.

## Neden bir Node ana makinesi kullanılır?

Ajanların, bu makinelere tam bir macOS yardımcı uygulaması kurmadan ağınızdaki **diğer makinelerde komut çalıştırmasını** istediğinizde bir Node ana makinesi kullanın.

Yaygın kullanım durumları:

- Uzak Linux/Windows makinelerinde komut çalıştırmak (derleme sunucuları, laboratuvar makineleri, NAS).
- Exec işlemini gateway üzerinde **sandbox içinde** tutarken, onaylanmış çalıştırmaları diğer ana makinelere devretmek.
- Otomasyon veya CI Node'ları için hafif, başsız bir yürütme hedefi sağlamak.

Yürütme yine de Node ana makinesinde **exec onayları** ve ajan başına izin listeleri ile korunur; böylece komut erişimini kapsamlı ve açık tutabilirsiniz.

## Tarayıcı proxy'si (sıfır yapılandırma)

Node ana makineleri, Node üzerinde `browser.enabled` devre dışı bırakılmadıysa otomatik olarak bir tarayıcı proxy'si ilan eder. Bu, ajanın ek yapılandırma olmadan o Node üzerinde tarayıcı otomasyonu kullanmasını sağlar.

Varsayılan olarak proxy, Node'un normal tarayıcı profil yüzeyini sunar. `nodeHost.browserProxy.allowProfiles` ayarlarsanız proxy kısıtlayıcı hale gelir:
izin listesinde olmayan profil hedeflemeleri reddedilir ve kalıcı profil
oluşturma/silme yolları proxy üzerinden engellenir.

Gerekirse bunu Node üzerinde devre dışı bırakın:

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
- `--port <port>`: Gateway WebSocket bağlantı noktası (varsayılan: `18789`)
- `--tls`: Gateway bağlantısı için TLS kullan
- `--tls-fingerprint <sha256>`: Beklenen TLS sertifika parmak izi (sha256)
- `--node-id <id>`: Node kimliğini geçersiz kıl (eşleştirme belirtecini temizler)
- `--display-name <name>`: Node görünen adını geçersiz kıl

## Node ana makinesi için Gateway kimlik doğrulaması

`openclaw node run` ve `openclaw node install`, gateway kimlik doğrulamasını config/env üzerinden çözer (`node` komutlarında `--token`/`--password` bayrakları yoktur):

- Önce `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` denetlenir.
- Sonra yerel yapılandırma geri dönüşü: `gateway.auth.token` / `gateway.auth.password`.
- Yerel modda, Node ana makinesi kasıtlı olarak `gateway.remote.token` / `gateway.remote.password` değerlerini devralmaz.
- `gateway.auth.token` / `gateway.auth.password`, SecretRef ile açıkça yapılandırılmışsa ve çözümlenmemişse, Node kimlik doğrulaması kapalı kalacak şekilde başarısız olur (uzak geri dönüşün bunu maskelemesine izin verilmez).
- `gateway.mode=remote` durumunda, uzak istemci alanları (`gateway.remote.token` / `gateway.remote.password`) da uzak öncelik kurallarına göre uygun olur.
- Node ana makinesi kimlik doğrulama çözümlemesi yalnızca `OPENCLAW_GATEWAY_*` ortam değişkenlerini dikkate alır.

Güvenilen bir özel ağdaki loopback olmayan bir `ws://` Gateway'e bağlanan bir Node için
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ayarlayın. Bu olmadan, Node başlatma kapalı kalacak şekilde başarısız olur ve sizden `wss://`, bir SSH tüneli veya Tailscale kullanmanızı ister.
Bu, `openclaw.json` yapılandırma anahtarı değil, süreç ortamı üzerinden isteğe bağlı bir etkinleştirmedir.
`openclaw node install`, yükleme komutu ortamında mevcutsa bunu denetlenen Node hizmetine kalıcı olarak yazar.

## Hizmet (arka plan)

Başsız bir Node ana makinesini kullanıcı hizmeti olarak yükleyin.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Seçenekler:

- `--host <host>`: Gateway WebSocket ana makinesi (varsayılan: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket bağlantı noktası (varsayılan: `18789`)
- `--tls`: Gateway bağlantısı için TLS kullan
- `--tls-fingerprint <sha256>`: Beklenen TLS sertifika parmak izi (sha256)
- `--node-id <id>`: Node kimliğini geçersiz kıl (eşleştirme belirtecini temizler)
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

Ön planda çalışan bir Node ana makinesi için `openclaw node run` kullanın (hizmet yok).

Hizmet komutları makine tarafından okunabilir çıktı için `--json` kabul eder.

Node ana makinesi, Gateway yeniden başlatmasını ve ağ kapanmalarını süreç içinde yeniden dener. Gateway ölümcül bir token/password/bootstrap kimlik doğrulama duraklaması bildirirse, Node ana makinesi kapanış ayrıntısını günlüğe kaydeder ve launchd/systemd'nin bunu yeni yapılandırma ve kimlik bilgileriyle yeniden başlatabilmesi için sıfır olmayan bir kodla çıkar. Eşleştirme gerektiren duraklamalar, bekleyen isteğin onaylanabilmesi için ön plan akışında kalır.

## Eşleştirme

İlk bağlantı, Gateway üzerinde bekleyen bir cihaz eşleştirme isteği (`role: node`) oluşturur.
Şununla onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Sıkı denetlenen Node ağlarında Gateway operatörü, güvenilen CIDR'lerden gelen ilk Node eşleştirmesini otomatik onaylamayı açıkça etkinleştirebilir:

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

Bu varsayılan olarak devre dışıdır. Yalnızca istenen kapsamı olmayan yeni `role: node` eşleştirmesine uygulanır. Operator/browser istemcileri, Control UI, WebChat ve rol,
kapsam, meta veri veya public key yükseltmeleri yine manuel onay gerektirir.

Node değiştirilmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/public key) yeniden eşleştirme denerse,
önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur.
Onaydan önce `openclaw devices list` komutunu yeniden çalıştırın.

Node ana makinesi, Node kimliğini, belirtecini, görünen adını ve gateway bağlantı bilgilerini
`~/.openclaw/node.json` içinde saklar.

## Exec onayları

`system.run`, yerel exec onaylarıyla kapılanır:

- `~/.openclaw/exec-approvals.json`
- [Exec onayları](/tr/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (Gateway üzerinden düzenleyin)

Onaylanmış eşzamansız Node exec için OpenClaw, istem göstermeden önce kanonik bir `systemRunPlan` hazırlar. Daha sonra iletilen onaylanmış `system.run`, bu saklanan planı yeniden kullanır; böylece onay isteği oluşturulduktan sonra command/cwd/session alanlarında yapılan düzenlemeler, Node'un ne çalıştıracağını değiştirmek yerine reddedilir.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Node'lar](/tr/nodes)
