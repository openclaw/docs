---
read_when:
    - Dağıtımdan önce operatör tarafından yönetilen proxy yönlendirmesini doğrulamanız gerekir
    - Hata ayıklama için OpenClaw aktarım trafiğini yerel olarak yakalamanız gerekir
    - Hata ayıklama proxy oturumlarını, blob'ları veya yerleşik sorgu ön ayarlarını incelemek istiyorsunuz
summary: Operatör tarafından yönetilen proxy doğrulaması ve yerel hata ayıklama proxy yakalama inceleyicisi dâhil olmak üzere `openclaw proxy` için CLI başvurusu
title: Vekil sunucu
x-i18n:
    generated_at: "2026-07-12T12:10:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91583f785032bfffe455a1963804108550f6fbb735ac4de1dd91d0ca5ae0df35
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Operatör tarafından yönetilen proxy yönlendirmesini doğrulayın veya yerel açık hata ayıklama proxy'sini çalıştırıp yakalanan trafiği inceleyin.

```bash
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

`validate`, operatör tarafından yönetilen bir ileri proxy için ön kontrol gerçekleştirir. Diğerleri, taşıma düzeyinde incelemeye yönelik hata ayıklama araçlarıdır: yerel bir trafik yakalama proxy'si başlatma, bir alt komutu bunun üzerinden çalıştırma, yakalama oturumlarını listeleme, trafik örüntülerini sorgulama, yakalanan blob'ları okuma ve yerel yakalama verilerini temizleme.

## Doğrulama

Geçerli operatör yönetimli proxy URL'sini öncelik sırasıyla `--proxy-url`, yapılandırma (`proxy.proxyUrl`) veya `OPENCLAW_PROXY_URL` üzerinden denetler. Etkinleştirilmiş ve yapılandırılmış bir proxy yoksa yapılandırma sorunu bildirir; yapılandırmaya dokunmadan tek seferlik ön kontrol yapmak için `--proxy-url` iletin.

Yönetilen proxy URL'leri, düz bir ileri proxy dinleyicisi için `http://`; OpenClaw'ın proxy isteklerini göndermeden önce proxy uç noktasının kendisine TLS bağlantısı açması gerektiğinde ise `https://` kullanır. Bu TLS bağlantısında özel bir CA'ya güvenmek için `--proxy-ca-file` kullanın.

Varsayılan olarak şunları çalıştırır:

- `https://example.com/` adresine yönelik bir **izin verilen** denetim (`--allowed-url` ile geçersiz kılın veya ekleyin; yinelenebilir)
- geçici bir yerel geri döngü kanaryasına yönelik bir **reddedilen** denetim (`--denied-url` ile geçersiz kılın; yinelenebilir)

Özel `--denied-url` hedefleri kapalı durumda hata verme ilkesini uygular: dağıtıma özgü bir ret sinyalini bağımsız olarak doğrulayamadığınız sürece hem HTTP yanıtları hem de belirsiz taşıma hataları başarısızlık sayılır. Taşıma hatasının engelleme kanıtı olarak kabul edildiği tek hedef, yerleşik geri döngü kanaryasıdır.

Proxy üzerinden ayrıca bir APNs HTTP/2 CONNECT tüneli açmak ve korumalı alan APNs hizmetinin yanıt verdiğini doğrulamak için `--apns-reachable` ekleyin. Yoklama, kasıtlı olarak geçersiz bir sağlayıcı belirteci gönderir; bu nedenle APNs `403 InvalidProviderToken` yanıtı, başarılı bir erişilebilirlik sinyali olarak kabul edilir (başarısızlık değildir).

### Seçenekler

| Bayrak                   | Etki                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `--json`                 | makine tarafından okunabilir JSON yazdırır                                                                                     |
| `--proxy-url <url>`      | yapılandırma veya ortam yerine bu `http://`/`https://` proxy URL'sini doğrular                                                 |
| `--proxy-ca-file <path>` | bir HTTPS proxy uç noktasının TLS doğrulaması için bu PEM CA dosyasına güvenir                                                 |
| `--allowed-url <url>`    | proxy üzerinden başarılı olması beklenen hedef (yinelenebilir)                                                                 |
| `--denied-url <url>`     | proxy tarafından engellenmesi beklenen hedef (yinelenebilir)                                                                   |
| `--apns-reachable`       | korumalı alan APNs HTTP/2 hizmetine proxy üzerinden erişilebildiğini de doğrular                                                |
| `--apns-authority <url>` | yoklanacak APNs yetkilisi (varsayılan `https://api.sandbox.push.apple.com`; üretim ortamı `https://api.push.apple.com`)         |
| `--timeout-ms <ms>`      | istek başına zaman aşımı                                                                                                       |

Proxy yapılandırması veya hedef denetimleri başarısız olduğunda 1 koduyla çıkar.

Dağıtım yönergeleri ve ret semantiği için [Ağ Proxy'si](/tr/security/network-proxy) bölümüne bakın.

## Hata ayıklama proxy'si

`start`, yerel bir trafik yakalama proxy'si başlatır ve URL'sini, CA sertifikası yolunu ve yakalama veritabanı yolunu yazdırır; Ctrl+C ile durdurun. `--host` ayarlanmadığı sürece varsayılan olarak `127.0.0.1` adresine bağlanır.

`run`, yerel bir hata ayıklama proxy'si başlatır, ardından proxy ortamı uygulanmış olarak `<cmd...>` komutunu (`--` sonrasında) kendi yakalama oturumu altında çalıştırır.

Hata ayıklama proxy'sinin doğrudan yukarı akış iletimi, tanılama amacıyla yukarı akış soketleri açar. OpenClaw yönetilen proxy modu etkinken proxy istekleri ve CONNECT tünelleri için doğrudan iletim varsayılan olarak devre dışıdır; `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` değerini yalnızca onaylanmış yerel tanılamalar için ayarlayın.

`coverage`, hangi taşıma yöntemlerinin yakalandığını, yalnızca proxy üzerinden çalıştığını veya kapsanmadığını gösteren bir JSON raporu (`summary` ve taşıma başına `entries`) yazdırır.

`sessions`, son yakalama oturumlarını listeler (`--limit`, varsayılan 20).

`query --preset <name>`, yakalanan trafik üzerinde yerleşik bir sorgu çalıştırır; isteğe bağlı olarak `--session <id>` ile belirli bir oturumla sınırlandırılabilir. Ön ayarlar:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

`blob --id <blobId>`, yakalanan bir yük blob'unun ham içeriğini yazdırır.

`purge`, yakalanan tüm trafik meta verilerini ve blob'ları siler. Yakalamalar yerel hata ayıklama verileridir; işiniz bittiğinde temizleyin.

## İlgili Konular

- [CLI başvurusu](/tr/cli)
- [Ağ Proxy'si](/tr/security/network-proxy)
- [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth)
