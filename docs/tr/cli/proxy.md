---
read_when:
    - Dağıtımdan önce operatör tarafından yönetilen proxy yönlendirmesini doğrulamanız gerekir
    - Hata ayıklama için OpenClaw taşıma trafiğini yerel olarak yakalamanız gerekir
    - Hata ayıklama proxy oturumlarını, blob'ları veya yerleşik sorgu ön ayarlarını incelemek istiyorsunuz
summary: '`openclaw proxy` için CLI referansı; operatör tarafından yönetilen proxy doğrulaması ve yerel hata ayıklama proxy yakalama denetleyicisi dahil'
title: Vekil sunucu
x-i18n:
    generated_at: "2026-06-28T00:24:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c3883373f2aa6d365ed93bcb9f7da2bb9281b8bd061d1842bc5bef0f43b7ccb9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Operatör tarafından yönetilen proxy yönlendirmesini doğrulayın veya yerel açık hata ayıklama proxy'sini
çalıştırıp yakalanan trafiği inceleyin.

OpenClaw proxy yönlendirmesini etkinleştirmeden önce operatör tarafından yönetilen bir ileri proxy'yi
ön kontrol etmek için `validate` kullanın. Diğer komutlar, taşıma düzeyinde
inceleme için hata ayıklama araçlarıdır: yerel bir proxy başlatabilir, yakalama etkinleştirilmiş
bir alt komut çalıştırabilir, yakalama oturumlarını listeleyebilir, yaygın trafik kalıplarını sorgulayabilir, yakalanan
blob'ları okuyabilir ve yerel yakalama verilerini temizleyebilirler.

## Komutlar

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Doğrulama

`openclaw proxy validate`, `--proxy-url`, yapılandırma veya `OPENCLAW_PROXY_URL` üzerinden
etkili operatör tarafından yönetilen proxy URL'sini denetler. Yönetilen proxy URL'leri,
düz bir ileri proxy dinleyicisi için `http://` kullanabilir veya OpenClaw'ın
proxy isteklerini göndermeden önce proxy uç noktasına TLS açması gerektiğinde `https://` kullanabilir.
Hiçbir proxy etkinleştirilip yapılandırılmadığında bir yapılandırma sorunu bildirir; yapılandırmayı
değiştirmeden önce tek seferlik ön kontrol için `--proxy-url` kullanın. Bir HTTPS proxy uç noktasına
TLS bağlantısı için özel bir CA'ya güvenmek üzere `--proxy-ca-file` ekleyin. Varsayılan olarak, genel
bir hedefin proxy üzerinden başarılı olduğunu ve proxy'nin geçici bir loopback kanaryasına
erişemediğini doğrular. Özel reddedilen hedefler kapalı-hata davranır: dağıtıma özgü bir
reddetme sinyalini ayrıca doğrulayamadığınız sürece, HTTP yanıtları ve belirsiz taşıma hatalarının
ikisi de başarısız olur. Proxy üzerinden bir APNs HTTP/2 CONNECT tüneli de açmak ve sandbox
APNs'nin yanıt verdiğini doğrulamak için `--apns-reachable` ekleyin; prob, bilerek geçersiz
bir sağlayıcı belirteci kullanır, bu nedenle APNs `403 InvalidProviderToken` yanıtı başarılı bir
erişilebilirlik sinyalidir.

Seçenekler:

- `--json`: makine tarafından okunabilir JSON yazdırır.
- `--proxy-url <url>`: yapılandırma veya env yerine bu `http://` ya da `https://` proxy URL'sini doğrular.
- `--proxy-ca-file <path>`: bir HTTPS proxy uç noktasının TLS doğrulaması için bu PEM CA dosyasına güvenir.
- `--allowed-url <url>`: proxy üzerinden başarılı olması beklenen bir hedef ekler. Birden çok hedefi denetlemek için yineleyin.
- `--denied-url <url>`: proxy tarafından engellenmesi beklenen bir hedef ekler. Birden çok hedefi denetlemek için yineleyin.
- `--apns-reachable`: sandbox APNs HTTP/2'nin proxy üzerinden erişilebilir olduğunu da doğrular.
- `--apns-authority <url>`: `--apns-reachable` ile yoklanacak APNs yetkilisi (varsayılan olarak `https://api.sandbox.push.apple.com`; üretim `https://api.push.apple.com`).
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

- `--host` ayarlanmadıkça `start` varsayılan olarak `127.0.0.1` kullanır.
- `run` yerel bir hata ayıklama proxy'si başlatır ve ardından `--` sonrasındaki komutu çalıştırır.
- Hata ayıklama proxy'sinin doğrudan yukarı akış yönlendirmesi, tanılama için yukarı akış soketleri açar. OpenClaw yönetilen proxy modu etkinken, proxy istekleri ve CONNECT tünelleri için doğrudan yönlendirme varsayılan olarak devre dışıdır; `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` değerini yalnızca onaylı yerel tanılamalar için ayarlayın.
- Proxy yapılandırması veya hedef denetimleri başarısız olduğunda `validate` kod 1 ile çıkar.
- Yakalamalar yerel hata ayıklama verileridir; işiniz bittiğinde `openclaw proxy purge` kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Ağ Proxy'si](/tr/security/network-proxy)
- [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth)
