---
read_when:
    - Dağıtımdan önce operatör tarafından yönetilen proxy yönlendirmesini doğrulamanız gerekir
    - Hata ayıklama için OpenClaw aktarım trafiğini yerel olarak yakalamanız gerekir
    - Hata ayıklama proxy oturumlarını, blob’ları veya yerleşik sorgu ön ayarlarını incelemek istiyorsunuz
summary: '`openclaw proxy` için CLI referansı; operatör tarafından yönetilen proxy doğrulaması ve yerel hata ayıklama proxy yakalama inceleyicisi dahil'
title: Vekil sunucu
x-i18n:
    generated_at: "2026-05-04T18:23:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 092c4e946dcab5e78e37d6fc77bb067b7a649368f8571fa127e462a85fa14ce5
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Operatör tarafından yönetilen proxy yönlendirmesini doğrulayın veya yerel açık hata ayıklama proxy'sini çalıştırıp yakalanan trafiği inceleyin.

OpenClaw proxy yönlendirmesini etkinleştirmeden önce operatör tarafından yönetilen bir ileri proxy'yi önceden denetlemek için `validate` kullanın. Diğer komutlar, aktarım düzeyi inceleme için hata ayıklama araçlarıdır: yerel bir proxy başlatabilir, yakalama etkinleştirilmiş halde bir alt komut çalıştırabilir, yakalama oturumlarını listeleyebilir, yaygın trafik örüntülerini sorgulayabilir, yakalanan blob'ları okuyabilir ve yerel yakalama verilerini temizleyebilirler.

## Komutlar

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Doğrulama

`openclaw proxy validate`, `--proxy-url`, yapılandırma veya `OPENCLAW_PROXY_URL` üzerinden etkili operatör tarafından yönetilen proxy URL'sini denetler. Proxy etkinleştirilmemiş ve yapılandırılmamışsa bir yapılandırma sorunu bildirir; yapılandırmayı değiştirmeden önce tek seferlik bir ön denetim için `--proxy-url` kullanın. Varsayılan olarak, genel bir hedefin proxy üzerinden başarılı olduğunu ve proxy'nin geçici bir loopback kanaryasına ulaşamadığını doğrular. Özel reddedilen hedefler kapalıya düşecek şekilde davranır: dağıtıma özgü bir ret sinyalini ayrıca doğrulayamadığınız sürece hem HTTP yanıtları hem de belirsiz aktarım hataları başarısız sayılır. Proxy üzerinden bir APNs HTTP/2 CONNECT tüneli açıp sandbox APNs'in yanıt verdiğini doğrulamak için `--apns-reachable` ekleyin; denetim bilerek geçersiz bir sağlayıcı belirteci kullanır, bu nedenle APNs `403 InvalidProviderToken` yanıtı başarılı bir erişilebilirlik sinyalidir.

Seçenekler:

- `--json`: makine tarafından okunabilir JSON yazdırır.
- `--proxy-url <url>`: yapılandırma veya ortam yerine bu proxy URL'sini doğrular.
- `--allowed-url <url>`: proxy üzerinden başarılı olması beklenen bir hedef ekler. Birden fazla hedefi denetlemek için yineleyin.
- `--denied-url <url>`: proxy tarafından engellenmesi beklenen bir hedef ekler. Birden fazla hedefi denetlemek için yineleyin.
- `--apns-reachable`: sandbox APNs HTTP/2'nin proxy üzerinden erişilebilir olduğunu da doğrular.
- `--apns-authority <url>`: `--apns-reachable` ile denetlenecek APNs yetkilisi (varsayılan olarak `https://api.sandbox.push.apple.com`; üretim `https://api.push.apple.com`).
- `--timeout-ms <ms>`: istek başına milisaniye cinsinden zaman aşımı.

Dağıtım kılavuzu ve ret semantiği için [Ağ Proxy'si](/tr/security/network-proxy) bölümüne bakın.

## Sorgu ön ayarları

`openclaw proxy query --preset <name>` şunları kabul eder:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Notlar

- `--host` ayarlanmadığı sürece `start` varsayılan olarak `127.0.0.1` kullanır.
- `run`, yerel bir hata ayıklama proxy'si başlatır ve ardından `--` sonrasındaki komutu çalıştırır.
- Hata ayıklama proxy'sinin doğrudan üst akışa iletimi, tanılama için üst akış soketleri açar. OpenClaw yönetilen proxy modu etkin olduğunda, proxy istekleri ve CONNECT tünelleri için doğrudan iletim varsayılan olarak devre dışıdır; `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` değerini yalnızca onaylı yerel tanılama için ayarlayın.
- `validate`, proxy yapılandırması veya hedef denetimleri başarısız olduğunda kod 1 ile çıkar.
- Yakalamalar yerel hata ayıklama verileridir; işiniz bittiğinde `openclaw proxy purge` kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Ağ Proxy'si](/tr/security/network-proxy)
- [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth)
