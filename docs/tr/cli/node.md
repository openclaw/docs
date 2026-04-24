---
read_when:
    - Başsız Node sunucusunu çalıştırma
    - '`system.run` için macOS olmayan bir Node''u eşleştirme'
summary: '`openclaw node` için CLI başvurusu (başsız Node sunucusu)'
title: Node
x-i18n:
    generated_at: "2026-04-24T09:02:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f2bd6d61ee87d36f7691207d03a91c914e6460549256e0cc6ea7bebfa713923
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Gateway WebSocket'e bağlanan ve bu makinede
`system.run` / `system.which` sunan **başsız bir Node sunucusu** çalıştırın.

## Neden bir Node sunucusu kullanmalısınız?

Agent'lerin, ağınızdaki **diğer makinelerde komut çalıştırmasını**
istiyor ancak o makinelere tam bir macOS yardımcı uygulaması kurmak istemiyorsanız bir Node sunucusu kullanın.

Yaygın kullanım senaryoları:

- Uzak Linux/Windows makinelerinde komut çalıştırmak (build sunucuları, laboratuvar makineleri, NAS).
- Exec işlemini Gateway'de **sandbox'lı** tutup, onaylı çalıştırmaları diğer sunuculara devretmek.
- Otomasyon veya CI Node'ları için hafif, başsız bir yürütme hedefi sağlamak.

Yürütme yine de Node sunucusunda **exec onayları** ve agent başına izin listeleri ile korunur,
böylece komut erişimini kapsamlı ve açık şekilde sınırlı tutabilirsiniz.

## Tarayıcı proxy'si (sıfır yapılandırma)

`browser.enabled`, Node üzerinde devre dışı bırakılmadıysa Node sunucuları otomatik olarak
bir tarayıcı proxy'si duyurur. Bu, agent'in ek yapılandırma olmadan o Node üzerinde
tarayıcı otomasyonu kullanmasına izin verir.

Varsayılan olarak proxy, Node'un normal tarayıcı profili yüzeyini açığa çıkarır. Eğer
`nodeHost.browserProxy.allowProfiles` ayarlarsanız proxy kısıtlayıcı hale gelir:
izin listesinde olmayan profil hedefleme reddedilir ve kalıcı profil
oluşturma/silme yolları proxy üzerinden engellenir.

Gerekirse Node üzerinde bunu devre dışı bırakın:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Çalıştırma (ön planda)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Seçenekler:

- `--host <host>`: Gateway WebSocket host'u (varsayılan: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket port'u (varsayılan: `18789`)
- `--tls`: Gateway bağlantısı için TLS kullan
- `--tls-fingerprint <sha256>`: Beklenen TLS sertifika parmak izi (sha256)
- `--node-id <id>`: Node kimliğini geçersiz kıl (eşleştirme token'ını temizler)
- `--display-name <name>`: Node görünen adını geçersiz kıl

## Node sunucusu için Gateway kimlik doğrulaması

`openclaw node run` ve `openclaw node install`, Gateway kimlik doğrulamasını config/env üzerinden çözer (Node komutlarında `--token`/`--password` bayrakları yoktur):

- Önce `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` kontrol edilir.
- Sonra yerel yapılandırma fallback'i: `gateway.auth.token` / `gateway.auth.password`.
- Yerel modda Node sunucusu, bilerek `gateway.remote.token` / `gateway.remote.password` değerlerini devralmaz.
- `gateway.auth.token` / `gateway.auth.password`, SecretRef üzerinden açıkça yapılandırılmış ve çözümlenmemişse, Node kimlik doğrulama çözümlemesi kapalı başarısız olur (uzak fallback bunu maskeleyemez).
- `gateway.mode=remote` içinde, uzak istemci alanları (`gateway.remote.token` / `gateway.remote.password`) de uzak öncelik kurallarına göre uygundur.
- Node sunucusu kimlik doğrulama çözümlemesi yalnızca `OPENCLAW_GATEWAY_*` ortam değişkenlerini dikkate alır.

Güvenilir bir özel ağ üzerinde local loopback olmayan bir `ws://` Gateway'e bağlanan bir Node için
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ayarlayın. Bu olmadan Node başlangıcı kapalı başarısız olur
ve sizden `wss://`, bir SSH tüneli veya Tailscale kullanmanızı ister.
Bu, `openclaw.json` yapılandırma anahtarı değil, süreç ortamı üzerinden verilen bir onaydır.
`openclaw node install`, kurulum komutu ortamında mevcut olduğunda bunu
denetlenen Node servisine kalıcı olarak yazar.

## Servis (arka planda)

Başsız bir Node sunucusunu kullanıcı servisi olarak kurun.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Seçenekler:

- `--host <host>`: Gateway WebSocket host'u (varsayılan: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket port'u (varsayılan: `18789`)
- `--tls`: Gateway bağlantısı için TLS kullan
- `--tls-fingerprint <sha256>`: Beklenen TLS sertifika parmak izi (sha256)
- `--node-id <id>`: Node kimliğini geçersiz kıl (eşleştirme token'ını temizler)
- `--display-name <name>`: Node görünen adını geçersiz kıl
- `--runtime <runtime>`: Servis çalışma zamanı (`node` veya `bun`)
- `--force`: Zaten kuruluysa yeniden kur/üzerine yaz

Servisi yönetin:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Ön planda bir Node sunucusu için `openclaw node run` kullanın (servis yok).

Servis komutları, makine tarafından okunabilir çıktı için `--json` kabul eder.

## Eşleştirme

İlk bağlantı, Gateway üzerinde bekleyen bir cihaz eşleştirme isteği (`role: node`) oluşturur.
Şununla onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Node, değiştirilmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar)
eşleştirmeyi yeniden denerse, önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur.
Onaydan önce `openclaw devices list` komutunu yeniden çalıştırın.

Node sunucusu, Node kimliğini, token'ı, görünen adı ve Gateway bağlantı bilgilerini
`~/.openclaw/node.json` içinde saklar.

## Exec onayları

`system.run`, yerel exec onaylarıyla korunur:

- `~/.openclaw/exec-approvals.json`
- [Exec approvals](/tr/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (Gateway'den düzenleme)

Onaylanan async Node exec için OpenClaw, istemden önce kanonik bir `systemRunPlan`
hazırlar. Daha sonra onaylanan `system.run` iletimi bu saklanan
planı yeniden kullanır; böylece onay isteği oluşturulduktan sonra command/cwd/session alanlarında yapılan düzenlemeler,
Node'un ne çalıştıracağını değiştirmek yerine reddedilir.

## İlgili

- [CLI reference](/tr/cli)
- [Nodes](/tr/nodes)
