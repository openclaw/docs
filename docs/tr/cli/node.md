---
read_when:
    - Başsız düğüm ana bilgisayarını çalıştırma
    - system.run için macOS olmayan bir düğümü eşleştirme
summary: '`openclaw node` için CLI başvurusu (başsız düğüm ana bilgisayarı)'
title: node
x-i18n:
    generated_at: "2026-04-05T13:49:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6123b33ec46f2b85f2c815947435ac91bbe84456165ff0e504453356da55b46d
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Gateway WebSocket'e bağlanan ve bu makinede
`system.run` / `system.which` işlevlerini sunan bir **başsız düğüm ana bilgisayarı**
çalıştırın.

## Neden bir düğüm ana bilgisayarı kullanılır?

Ağınızdaki **diğer makinelerde komut çalıştırmasını** sağlamak istediğinizde,
orada tam bir macOS yardımcı uygulaması kurmadan bir düğüm ana bilgisayarı kullanın.

Yaygın kullanım durumları:

- Uzak Linux/Windows makinelerinde komut çalıştırın (derleme sunucuları, laboratuvar makineleri, NAS).
- Exec'i ağ geçidinde **sandboxed** tutun, ancak onaylanmış çalıştırmaları diğer ana bilgisayarlara devredin.
- Otomasyon veya CI düğümleri için hafif, başsız bir yürütme hedefi sağlayın.

Yürütme yine de düğüm ana bilgisayarındaki **exec onayları** ve ajan başına izin listeleri ile korunur; böylece komut erişimini kapsamlı ve açık şekilde sınırlayabilirsiniz.

## Tarayıcı proxy'si (sıfır yapılandırma)

Düğümde `browser.enabled` devre dışı bırakılmadıysa, düğüm ana bilgisayarları otomatik olarak bir tarayıcı proxy'si duyurur. Bu, ajanın ek yapılandırma olmadan o düğümde tarayıcı otomasyonu kullanmasına olanak tanır.

Varsayılan olarak proxy, düğümün normal tarayıcı profili yüzeyini sunar. `nodeHost.browserProxy.allowProfiles` ayarlarsanız, proxy kısıtlayıcı hale gelir:
izin listesinde olmayan profil hedeflemeleri reddedilir ve kalıcı profil
oluşturma/silme rotaları proxy üzerinden engellenir.

Gerekirse düğümde devre dışı bırakın:

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
- `--tls`: Ağ geçidi bağlantısı için TLS kullan
- `--tls-fingerprint <sha256>`: Beklenen TLS sertifika parmak izi (sha256)
- `--node-id <id>`: Düğüm kimliğini geçersiz kıl (eşleştirme belirtecini temizler)
- `--display-name <name>`: Düğüm görünen adını geçersiz kıl

## Düğüm ana bilgisayarı için Gateway kimlik doğrulaması

`openclaw node run` ve `openclaw node install`, ağ geçidi kimlik doğrulamasını config/env üzerinden çözer (düğüm komutlarında `--token`/`--password` bayrakları yoktur):

- Önce `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` denetlenir.
- Ardından yerel config geri dönüşü: `gateway.auth.token` / `gateway.auth.password`.
- Yerel modda, düğüm ana bilgisayarı kasıtlı olarak `gateway.remote.token` / `gateway.remote.password` değerlerini devralmaz.
- `gateway.auth.token` / `gateway.auth.password`, SecretRef aracılığıyla açıkça yapılandırılmışsa ve çözümlenmemişse, düğüm kimlik doğrulaması çözümü kapalı şekilde başarısız olur (uzak geri dönüş bunu maskelemez).
- `gateway.mode=remote` durumunda, uzak istemci alanları (`gateway.remote.token` / `gateway.remote.password`) de uzak öncelik kurallarına göre uygun kabul edilir.
- Düğüm ana bilgisayarı kimlik doğrulama çözümü yalnızca `OPENCLAW_GATEWAY_*` env değişkenlerini dikkate alır.

## Hizmet (arka plan)

Başsız bir düğüm ana bilgisayarını kullanıcı hizmeti olarak kurun.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Seçenekler:

- `--host <host>`: Gateway WebSocket ana bilgisayarı (varsayılan: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket bağlantı noktası (varsayılan: `18789`)
- `--tls`: Ağ geçidi bağlantısı için TLS kullan
- `--tls-fingerprint <sha256>`: Beklenen TLS sertifika parmak izi (sha256)
- `--node-id <id>`: Düğüm kimliğini geçersiz kıl (eşleştirme belirtecini temizler)
- `--display-name <name>`: Düğüm görünen adını geçersiz kıl
- `--runtime <runtime>`: Hizmet çalışma zamanı (`node` veya `bun`)
- `--force`: Zaten kuruluysa yeniden kur/üzerine yaz

Hizmeti yönetin:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Ön planda çalışan bir düğüm ana bilgisayarı için `openclaw node run` kullanın (hizmet olmadan).

Hizmet komutları, makine tarafından okunabilir çıktı için `--json` kabul eder.

## Eşleştirme

İlk bağlantı, Gateway üzerinde bekleyen bir cihaz eşleştirme isteği (`role: node`) oluşturur.
Bunu şu komutlarla onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Düğüm, değiştirilmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar) eşleştirmeyi yeniden denerse,
önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur.
Onaylamadan önce `openclaw devices list` komutunu yeniden çalıştırın.

Düğüm ana bilgisayarı, düğüm kimliğini, belirteci, görünen adı ve ağ geçidi bağlantı bilgilerini
`~/.openclaw/node.json` içinde saklar.

## Exec onayları

`system.run`, yerel exec onayları tarafından denetlenir:

- `~/.openclaw/exec-approvals.json`
- [Exec onayları](/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (Gateway'den düzenleme)

Onaylanmış eşzamansız düğüm exec için OpenClaw, istemde bulunmadan önce
kanonik bir `systemRunPlan` hazırlar. Daha sonra onaylanan `system.run` iletimi bu saklanan
planı yeniden kullanır; böylece onay isteği oluşturulduktan sonra komut/cwd/session alanlarında yapılan düzenlemeler,
düğümün ne çalıştıracağını değiştirmek yerine reddedilir.
