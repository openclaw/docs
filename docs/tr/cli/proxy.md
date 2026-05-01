---
read_when:
    - Dağıtımdan önce operatör tarafından yönetilen vekil sunucu yönlendirmesini doğrulamanız gerekir
    - Hata ayıklama için OpenClaw taşıma trafiğini yerel olarak yakalamanız gerekir
    - Hata ayıklama proxy oturumlarını, blob'ları veya yerleşik sorgu ön ayarlarını incelemek istiyorsunuz
summary: '`openclaw proxy` için CLI referansı; operatör tarafından yönetilen ara sunucu doğrulaması ve yerel hata ayıklama ara sunucu yakalama denetleyicisi dahil'
title: Ara sunucu
x-i18n:
    generated_at: "2026-05-01T08:59:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: e0820de861bfe1ec14e0c1624d636d6474b5fedd317e3ba1baaa61f6530e06e9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Operatör tarafından yönetilen proxy yönlendirmesini doğrulayın veya yerel açık hata ayıklama proxy'sini çalıştırıp yakalanan trafiği inceleyin.

OpenClaw proxy yönlendirmesini etkinleştirmeden önce operatör tarafından yönetilen bir ileri proxy için ön kontrol yapmak üzere `validate` kullanın. Diğer komutlar, aktarım düzeyinde inceleme için hata ayıklama araçlarıdır: yerel proxy başlatabilir, yakalama etkinleştirilmiş bir alt komut çalıştırabilir, yakalama oturumlarını listeleyebilir, yaygın trafik kalıplarını sorgulayabilir, yakalanan blobları okuyabilir ve yerel yakalama verilerini temizleyebilirler.

## Komutlar

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Doğrulama

`openclaw proxy validate`, `--proxy-url`, yapılandırma veya `OPENCLAW_PROXY_URL` üzerinden etkin operatör tarafından yönetilen proxy URL'sini denetler. Hiçbir proxy etkinleştirilip yapılandırılmadığında bir yapılandırma sorunu bildirir; yapılandırmayı değiştirmeden önce tek seferlik ön kontrol için `--proxy-url` kullanın. Varsayılan olarak, herkese açık bir hedefin proxy üzerinden başarılı olduğunu ve proxy'nin geçici bir local loopback kanaryasına erişemediğini doğrular. Özel reddedilen hedefler kapalı varsayılanlıdır: dağıtıma özgü bir reddetme sinyalini ayrı olarak doğrulayamıyorsanız hem HTTP yanıtları hem de belirsiz aktarım hataları başarısız olur.

Seçenekler:

- `--json`: makine tarafından okunabilir JSON yazdırır.
- `--proxy-url <url>`: yapılandırma veya env yerine bu proxy URL'sini doğrular.
- `--allowed-url <url>`: proxy üzerinden başarılı olması beklenen bir hedef ekler. Birden fazla hedefi denetlemek için tekrarlayın.
- `--denied-url <url>`: proxy tarafından engellenmesi beklenen bir hedef ekler. Birden fazla hedefi denetlemek için tekrarlayın.
- `--timeout-ms <ms>`: istek başına milisaniye cinsinden zaman aşımı.

Dağıtım rehberliği ve reddetme semantiği için [Ağ Proxy'si](/tr/security/network-proxy) bölümüne bakın.

## Sorgu ön ayarları

`openclaw proxy query --preset <name>` şunları kabul eder:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Notlar

- `start`, `--host` ayarlanmadığı sürece varsayılan olarak `127.0.0.1` kullanır.
- `run`, yerel bir hata ayıklama proxy'si başlatır ve ardından `--` sonrasındaki komutu çalıştırır.
- `validate`, proxy yapılandırması veya hedef denetimleri başarısız olduğunda kod 1 ile çıkar.
- Yakalamalar yerel hata ayıklama verileridir; işiniz bittiğinde `openclaw proxy purge` kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Ağ Proxy'si](/tr/security/network-proxy)
- [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth)
