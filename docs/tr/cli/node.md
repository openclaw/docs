---
read_when:
    - Başsız Node ana bilgisayarını çalıştırma
    - system.run için macOS olmayan bir Node'u eşleme
summary: '`openclaw node` için CLI başvurusu (başsız node ana makinesi)'
title: Node
x-i18n:
    generated_at: "2026-07-01T13:17:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e68602cb655a6852544f055b9b6c26f2e9cfe1b4d7933e7c27e67011c7cd55
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Gateway WebSocket'e bağlanan ve bu makinede `system.run` / `system.which` sunan **başsız node host** çalıştırın.

## Neden node host kullanılır?

Ağınızdaki **diğer makinelerde komut çalıştırmak** ve bunu oraya tam bir macOS eşlikçi uygulaması kurmadan yapmak istediğinizde node host kullanın.

Yaygın kullanım örnekleri:

- Uzak Linux/Windows makinelerde komut çalıştırma (derleme sunucuları, laboratuvar makineleri, NAS).
- Exec'i gateway üzerinde **sandbox içinde** tutma, ancak onaylanmış çalıştırmaları diğer host'lara devretme.
- Otomasyon veya CI node'ları için hafif, başsız bir yürütme hedefi sağlama.

Yürütme hâlâ node host üzerindeki **exec onayları** ve ajan başına izin listeleriyle korunur; böylece komut erişimini kapsamlı ve açık tutabilirsiniz.

## Tarayıcı proxy'si (sıfır yapılandırma)

Node host'lar, node üzerinde `browser.enabled` devre dışı bırakılmamışsa otomatik olarak bir tarayıcı proxy'si duyurur. Bu, ajanın ek yapılandırma olmadan o node üzerinde tarayıcı otomasyonu kullanmasını sağlar.

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

- `--host <host>`: Gateway WebSocket host'u (varsayılan: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket portu (varsayılan: `18789`)
- `--context-path <path>`: Gateway WebSocket bağlam yolu (örn. `/openclaw-gw`). WebSocket URL'sine eklenir.
- `--tls`: Gateway bağlantısı için TLS kullan
- `--tls-fingerprint <sha256>`: Beklenen TLS sertifika parmak izi (sha256)
- `--node-id <id>`: Node kimliğini geçersiz kıl (eşleştirme token'ını temizler)
- `--display-name <name>`: Node görüntü adını geçersiz kıl

## Node host için Gateway kimlik doğrulaması

`openclaw node run` ve `openclaw node install`, gateway kimlik doğrulamasını config/env üzerinden çözer (node komutlarında `--token`/`--password` bayrakları yoktur):

- Önce `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` kontrol edilir.
- Ardından yerel yapılandırma yedeği: `gateway.auth.token` / `gateway.auth.password`.
- Yerel modda node host, kasıtlı olarak `gateway.remote.token` / `gateway.remote.password` devralmaz.
- `gateway.auth.token` / `gateway.auth.password` SecretRef aracılığıyla açıkça yapılandırılmış ve çözümlenmemişse node kimlik doğrulama çözümlemesi kapalı kalacak şekilde başarısız olur (uzak yedek maskelemesi yoktur).
- `gateway.mode=remote` içinde, uzak istemci alanları (`gateway.remote.token` / `gateway.remote.password`) uzak öncelik kurallarına göre ayrıca uygun kabul edilir.
- Node host kimlik doğrulama çözümlemesi yalnızca `OPENCLAW_GATEWAY_*` env vars değerlerini dikkate alır.

Düz metin `ws://` Gateway'e bağlanan bir node için loopback, özel IP literalleri, `.local` ve Tailnet `*.ts.net` host'ları kabul edilir. Diğer güvenilir özel-DNS adları için `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ayarlayın; bu olmadan node başlatma kapalı kalacak şekilde başarısız olur ve sizden `wss://`, bir SSH tüneli veya Tailscale kullanmanızı ister. Bu, bir süreç ortamı opt-in'idir; `openclaw.json` yapılandırma anahtarı değildir.
`openclaw node install`, kurulum komutu ortamında mevcut olduğunda bunu denetlenen node hizmetine kalıcı olarak kaydeder.

## Hizmet (arka plan)

Başsız bir node host'u kullanıcı hizmeti olarak kurun.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Seçenekler:

- `--host <host>`: Gateway WebSocket host'u (varsayılan: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket portu (varsayılan: `18789`)
- `--context-path <path>`: Gateway WebSocket bağlam yolu (örn. `/openclaw-gw`). WebSocket URL'sine eklenir.
- `--tls`: Gateway bağlantısı için TLS kullan
- `--tls-fingerprint <sha256>`: Beklenen TLS sertifika parmak izi (sha256)
- `--node-id <id>`: Node kimliğini geçersiz kıl (eşleştirme token'ını temizler)
- `--display-name <name>`: Node görüntü adını geçersiz kıl
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

Ön planda çalışan node host için `openclaw node run` kullanın (hizmet yok).

Hizmet komutları, makine tarafından okunabilir çıktı için `--json` kabul eder.

Node host, Gateway yeniden başlatmasını ve ağ kapanmalarını süreç içinde yeniden dener. Gateway terminal token/parola/bootstrap kimlik doğrulama duraklaması bildirirse node host kapanış ayrıntısını günlüğe yazar ve sıfır olmayan kodla çıkar; böylece launchd/systemd onu güncel yapılandırma ve kimlik bilgileriyle yeniden başlatabilir. Eşleştirme gerektiren duraklamalar ön plan akışında kalır; böylece bekleyen istek onaylanabilir.

## Eşleştirme

İlk bağlantı, Gateway üzerinde bekleyen bir cihaz eşleştirme isteği (`role: node`) oluşturur.
Şununla onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Sıkı denetlenen node ağlarında Gateway operatörü, güvenilir CIDR'lerden ilk kez yapılan node eşleştirmesini otomatik onaylamaya açıkça opt in olabilir:

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

Bu varsayılan olarak devre dışıdır. Yalnızca istenen kapsamı olmayan yeni `role: node` eşleştirmeleri için geçerlidir. Operatör/tarayıcı istemcileri, Control UI, WebChat ve rol, kapsam, metadata veya açık anahtar yükseltmeleri hâlâ manuel onay gerektirir.

Node, değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar) eşleştirmeyi yeniden denerse önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaydan önce `openclaw devices list` komutunu tekrar çalıştırın.

Node host, node kimliğini, token'ını, görüntü adını ve gateway bağlantı bilgilerini `~/.openclaw/node.json` içinde saklar.

## Exec onayları

`system.run`, yerel exec onaylarıyla kapılanır:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, veya değişken ayarlanmamışsa
  `~/.openclaw/exec-approvals.json`
- [Exec onayları](/tr/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (Gateway üzerinden düzenle)

Onaylanmış async node exec için OpenClaw, istemden önce kanonik bir `systemRunPlan` hazırlar. Daha sonra onaylanan `system.run` yönlendirmesi bu saklanan planı yeniden kullanır; bu nedenle onay isteği oluşturulduktan sonra komut/cwd/session alanlarında yapılan düzenlemeler, node'un yürüttüğü şeyi değiştirmek yerine reddedilir.

## İlgili

- [CLI referansı](/tr/cli)
- [Node'lar](/tr/nodes)
