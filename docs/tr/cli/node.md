---
read_when:
    - Başsız Node ana makinesini çalıştırma
    - macOS olmayan bir düğümü system.run için eşleştirme
summary: '`openclaw node` için CLI referansı (başsız düğüm ana makinesi)'
title: Node
x-i18n:
    generated_at: "2026-06-28T00:23:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03a1b02e90f8f5f7edcfb2e7fd75ef0cbbdeae79dc0ce91339f31a80daeaaa92
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Gateway WebSocket'e bağlanan ve bu makinede `system.run` / `system.which` sunan **başsız bir node ana makinesi** çalıştırın.

## Neden node ana makinesi kullanılır?

Ağınızdaki **diğer makinelerde komut çalıştırmak** istediğinizde, oraya tam bir macOS eşlikçi uygulaması kurmadan node ana makinesi kullanın.

Yaygın kullanım durumları:

- Uzak Linux/Windows makinelerde komut çalıştırma (derleme sunucuları, laboratuvar makineleri, NAS).
- Exec'i Gateway üzerinde **sandbox içinde** tutup onaylanmış çalıştırmaları başka ana makinelere devretme.
- Otomasyon veya CI node'ları için hafif, başsız bir yürütme hedefi sağlama.

Yürütme yine node ana makinesindeki **exec onayları** ve ajan başına izin listeleriyle korunur; böylece komut erişimini kapsamlı ve açık tutabilirsiniz.

## Tarayıcı proxy'si (sıfır yapılandırma)

`browser.enabled` node üzerinde devre dışı bırakılmamışsa node ana makineleri otomatik olarak bir tarayıcı proxy'si duyurur. Bu, ajanın ek yapılandırma olmadan o node üzerinde tarayıcı otomasyonu kullanmasını sağlar.

Varsayılan olarak proxy, node'un normal tarayıcı profili yüzeyini sunar. `nodeHost.browserProxy.allowProfiles` ayarlarsanız proxy kısıtlayıcı olur: izin listesinde olmayan profil hedefleme reddedilir ve kalıcı profil oluşturma/silme rotaları proxy üzerinden engellenir.

Gerekirse node üzerinde devre dışı bırakın:

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
- `--node-id <id>`: Node kimliğini geçersiz kıl (eşleştirme token'ını temizler)
- `--display-name <name>`: Node görünen adını geçersiz kıl

## Node ana makinesi için Gateway kimlik doğrulaması

`openclaw node run` ve `openclaw node install`, Gateway kimlik doğrulamasını config/env'den çözer (node komutlarında `--token`/`--password` bayrakları yoktur):

- Önce `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` denetlenir.
- Sonra yerel yapılandırma yedeği: `gateway.auth.token` / `gateway.auth.password`.
- Yerel modda node ana makinesi, bilerek `gateway.remote.token` / `gateway.remote.password` değerlerini devralmaz.
- `gateway.auth.token` / `gateway.auth.password`, SecretRef aracılığıyla açıkça yapılandırılmış ve çözümlenmemişse node kimlik doğrulama çözümlemesi güvenli biçimde kapalı başarısız olur (uzak yedek maskelemesi yoktur).
- `gateway.mode=remote` içinde, uzak öncelik kurallarına göre uzak istemci alanları (`gateway.remote.token` / `gateway.remote.password`) da uygundur.
- Node ana makinesi kimlik doğrulama çözümlemesi yalnızca `OPENCLAW_GATEWAY_*` env değişkenlerini dikkate alır.

Düz metin `ws://` Gateway'e bağlanan bir node için loopback, özel IP değişmezleri, `.local` ve Tailnet `*.ts.net` ana makineleri kabul edilir. Diğer güvenilir özel DNS adları için `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ayarlayın; bu olmadan node başlatma güvenli biçimde kapalı başarısız olur ve sizden `wss://`, SSH tüneli veya Tailscale kullanmanızı ister. Bu bir süreç ortamı opt-in'idir, `openclaw.json` yapılandırma anahtarı değildir.
`openclaw node install`, kurulum komutu ortamında mevcut olduğunda bunu denetlenen node servisine kalıcı olarak yazar.

## Servis (arka plan)

Başsız bir node ana makinesini kullanıcı servisi olarak kurun.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Seçenekler:

- `--host <host>`: Gateway WebSocket ana makinesi (varsayılan: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket bağlantı noktası (varsayılan: `18789`)
- `--tls`: Gateway bağlantısı için TLS kullan
- `--tls-fingerprint <sha256>`: Beklenen TLS sertifika parmak izi (sha256)
- `--node-id <id>`: Node kimliğini geçersiz kıl (eşleştirme token'ını temizler)
- `--display-name <name>`: Node görünen adını geçersiz kıl
- `--runtime <runtime>`: Servis çalışma zamanı (`node` veya `bun`)
- `--force`: Zaten kurulmuşsa yeniden kur/üzerine yaz

Servisi yönetin:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Ön planda bir node ana makinesi için `openclaw node run` kullanın (servis yok).

Servis komutları, makine tarafından okunabilir çıktı için `--json` kabul eder.

Node ana makinesi Gateway yeniden başlatmasını ve ağ kapanmalarını süreç içinde yeniden dener. Gateway, terminal bir token/parola/bootstrap kimlik doğrulama duraklaması bildirirse node ana makinesi kapanış ayrıntısını günlüğe yazar ve launchd/systemd'nin taze yapılandırma ve kimlik bilgileriyle yeniden başlatabilmesi için sıfır olmayan kodla çıkar. Eşleştirme gerektiren duraklamalar, bekleyen isteğin onaylanabilmesi için ön plan akışında kalır.

## Eşleştirme

İlk bağlantı, Gateway üzerinde bekleyen bir cihaz eşleştirme isteği (`role: node`) oluşturur.
Şununla onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Sıkı denetlenen node ağlarında Gateway operatörü, güvenilir CIDR'lerden ilk kez node eşleştirmesini otomatik onaylamaya açıkça opt in yapabilir:

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

Bu varsayılan olarak devre dışıdır. Yalnızca istenen kapsamı olmayan yeni `role: node` eşleştirmesine uygulanır. Operatör/tarayıcı istemcileri, Control UI, WebChat ve rol, kapsam, metadata veya public-key yükseltmeleri yine manuel onay gerektirir.

Node, değişmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/public key) eşleştirmeyi yeniden denerse önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaydan önce `openclaw devices list` komutunu tekrar çalıştırın.

Node ana makinesi node kimliğini, token'ını, görünen adını ve Gateway bağlantı bilgilerini `~/.openclaw/node.json` içinde saklar.

## Exec onayları

`system.run`, yerel exec onaylarıyla geçitlenir:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, veya değişken ayarlanmamışsa
  `~/.openclaw/exec-approvals.json`
- [Exec onayları](/tr/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (Gateway'den düzenle)

Onaylanmış async node exec için OpenClaw, istemden önce kanonik bir `systemRunPlan` hazırlar. Daha sonra onaylanmış `system.run` iletimi, saklanan bu planı yeniden kullanır; bu nedenle onay isteği oluşturulduktan sonra komut/cwd/session alanlarında yapılan düzenlemeler, node'un yürüteceği şeyi değiştirmek yerine reddedilir.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Node'lar](/tr/nodes)
