---
read_when:
    - Dağıtımdan önce operatör tarafından yönetilen proxy yönlendirmesini doğrulamanız gerekir
    - Hata ayıklama için OpenClaw taşıma trafiğini yerel olarak yakalamanız gerekir
    - Hata ayıklama proxy oturumlarını, blob'ları veya yerleşik sorgu ön ayarlarını incelemek istiyorsunuz
summary: '`openclaw proxy` için CLI başvurusu; operatör tarafından yönetilen proxy doğrulaması ve yerel hata ayıklama proxy yakalama denetleyicisi dahil'
title: Vekil sunucu
x-i18n:
    generated_at: "2026-05-04T07:02:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9589bedafb97c31bcb6536a04307cd0c6550e1f307693bd4401785d79f34a1eb
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Operatör tarafından yönetilen proxy yönlendirmesini doğrulayın veya yerel açık hata ayıklama proxy'sini çalıştırıp yakalanan trafiği inceleyin.

OpenClaw proxy yönlendirmesini etkinleştirmeden önce operatör tarafından yönetilen bir ileri proxy için ön kontrol yapmak üzere `validate` kullanın. Diğer komutlar aktarım düzeyi inceleme için hata ayıklama araçlarıdır: yerel bir proxy başlatabilir, yakalama etkin olarak bir alt komut çalıştırabilir, yakalama oturumlarını listeleyebilir, yaygın trafik kalıplarını sorgulayabilir, yakalanan blob'ları okuyabilir ve yerel yakalama verilerini temizleyebilirler.

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

`openclaw proxy validate`, `--proxy-url`, yapılandırma veya `OPENCLAW_PROXY_URL` üzerinden geçerli operatör tarafından yönetilen proxy URL'sini denetler. Hiçbir proxy etkinleştirilmemiş ve yapılandırılmamışsa bir yapılandırma sorunu bildirir; yapılandırmayı değiştirmeden önce tek seferlik bir ön kontrol için `--proxy-url` kullanın. Varsayılan olarak, herkese açık bir hedefe proxy üzerinden başarıyla erişildiğini ve proxy'nin geçici bir loopback kanaryasına ulaşamadığını doğrular. Özel reddedilen hedefler fail-closed çalışır: dağıtıma özgü bir ret sinyalini ayrıca doğrulayamadığınız sürece hem HTTP yanıtları hem de belirsiz aktarım hataları başarısız sayılır.

Seçenekler:

- `--json`: makine tarafından okunabilir JSON yazdırır.
- `--proxy-url <url>`: yapılandırma veya env yerine bu proxy URL'sini doğrular.
- `--allowed-url <url>`: proxy üzerinden başarılı olması beklenen bir hedef ekler. Birden çok hedefi denetlemek için tekrarlayın.
- `--denied-url <url>`: proxy tarafından engellenmesi beklenen bir hedef ekler. Birden çok hedefi denetlemek için tekrarlayın.
- `--timeout-ms <ms>`: istek başına milisaniye cinsinden zaman aşımı.

Dağıtım rehberi ve ret semantiği için [Ağ Proxy'si](/tr/security/network-proxy) bölümüne bakın.

## Sorgu ön ayarları

`openclaw proxy query --preset <name>` şunları kabul eder:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Notlar

- `--host` ayarlanmadıkça `start` varsayılan olarak `127.0.0.1` kullanır.
- `run` yerel bir hata ayıklama proxy'si başlatır ve ardından `--` sonrasındaki komutu çalıştırır.
- Hata ayıklama proxy'sinin doğrudan yukarı akış yönlendirmesi, tanılama için yukarı akış soketleri açar. OpenClaw tarafından yönetilen proxy modu etkin olduğunda, proxy istekleri ve CONNECT tünelleri için doğrudan yönlendirme varsayılan olarak devre dışıdır; `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` değerini yalnızca onaylanmış yerel tanılamalar için ayarlayın.
- Proxy yapılandırması veya hedef denetimleri başarısız olduğunda `validate` kod 1 ile çıkar.
- Yakalamalar yerel hata ayıklama verileridir; işiniz bittiğinde `openclaw proxy purge` kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Ağ Proxy'si](/tr/security/network-proxy)
- [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth)
