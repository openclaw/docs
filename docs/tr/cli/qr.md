---
read_when:
    - Bir mobil Node uygulamasını bir Gateway ile hızlıca eşleştirmek istiyorsunuz
    - Uzaktan/elle paylaşım için kurulum kodu çıktısına ihtiyacınız var
summary: '`openclaw qr` için CLI başvurusu (mobil eşleştirme QR kodu + kurulum kodu oluşturma)'
title: QR
x-i18n:
    generated_at: "2026-07-12T11:35:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32641ff4e8035f6ca2eda849a59146125763af21c4105ae6cfa584da31ac070f
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Geçerli Gateway yapılandırmanızdan mobil eşleştirme QR kodu ve kurulum kodu oluşturun.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

Resmî OpenClaw iOS ve Android uygulamaları, kurulum kodu meta verileri eşleştiğinde otomatik olarak bağlanır. Bir istek beklemede kalırsa (örneğin resmî olmayan bir istemci veya eşleşmeyen meta veriler nedeniyle), isteği inceleyip onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Seçenekler

- `--remote`: `gateway.remote.url` değerini tercih eder; bu URL ayarlanmamışsa `gateway.tailscale.mode=serve|funnel` değerine geri döner. `device-pair` Plugin `publicUrl` değerini yok sayar.
- `--url <url>`: yükte kullanılan Gateway URL'sini geçersiz kılar
- `--public-url <url>`: yükte kullanılan genel URL'yi geçersiz kılar
- `--token <token>`: önyükleme akışının kimlik doğrulaması yaptığı Gateway belirtecini geçersiz kılar
- `--password <password>`: önyükleme akışının kimlik doğrulaması yaptığı Gateway parolasını geçersiz kılar
- `--setup-code-only`: yalnızca kurulum kodunu yazdırır
- `--no-ascii`: ASCII QR oluşturmayı atlar
- `--json`: JSON çıktısı üretir (`setupCode`, `gatewayUrl`, isteğe bağlı `gatewayUrls`, `auth`, `urlSource`)

`--token` ve `--password` seçenekleri birlikte kullanılamaz.

## Kurulum kodunun içeriği

Kurulum kodu, paylaşılan Gateway belirteci/parolası yerine kısa ömürlü, opak bir `bootstrapToken` taşır. Yerleşik önyükleme akışı şunları verir:

- `scopes: []` içeren birincil `node` belirteci
- `operator.approvals`, `operator.read`, `operator.talk.secrets` ve `operator.write` ile sınırlı, kapsamı belirlenmiş bir `operator` aktarım belirteci

Eşleştirme değişikliği kapsamları ve `operator.admin` için hâlâ ayrı olarak onaylanmış bir operatör eşleştirmesi veya belirteç akışı gerekir.

## Gateway URL çözümleme

Mobil eşleştirme, Tailscale/genel `ws://` Gateway URL'leri için güvenli biçimde başarısız olur: bunlar için Tailscale Serve/Funnel veya bir `wss://` Gateway URL'si kullanın. Özel LAN adresleri ve `.local` Bonjour ana makineleri düz `ws://` üzerinden desteklenmeye devam eder.

Seçilen Gateway URL'si `gateway.bind=lan` değerinden geldiğinde OpenClaw, kalıcı `tailscale serve status --json` rotalarını da denetler. Etkin Gateway'in local loopback bağlantı noktasına vekâlet eden tüm HTTPS Serve kökleri yedek seçenek olarak eklenir. QR komutu bu yedek seçeneği yalnızca `lan` için ekler; `custom` ve `tailnet`, açıkça duyurdukları rotaları korur. Güncel iOS istemcileri duyurulan rotaları sırayla yoklar ve erişilebilen ilk rotayı kaydeder; eski istemciler için geriye dönük `url` alanı değişmeden kalır.

`--remote` kullanıldığında `gateway.remote.url` veya `gateway.tailscale.mode=serve|funnel` değerlerinden biri gereklidir.

## Kimlik doğrulaması çözümleme (`--remote` olmadan)

Herhangi bir CLI kimlik doğrulaması geçersiz kılma seçeneği iletilmediğinde, yerel Gateway kimlik doğrulaması SecretRef değerleri aşağıdaki şekilde çözümlenir:

| Koşul                                                                                                                               | Çözümlenen değer                         |
| ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `gateway.auth.mode="token"` veya öncelikli bir parola kaynağı bulunmadan çıkarılan mod                                               | `gateway.auth.token`                     |
| `gateway.auth.mode="password"` veya kimlik doğrulaması/ortamdan öncelikli bir belirteç bulunmadan çıkarılan mod                       | `gateway.auth.password`                  |
| Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRef değerleri dâhil) ve `gateway.auth.mode` ayarsızsa | başarısız olur; `gateway.auth.mode` açıkça ayarlanmalıdır |

## Kimlik doğrulaması çözümleme (`--remote` ile)

Fiilen etkin uzak kimlik bilgileri SecretRef olarak yapılandırılmışsa ve `--token` ya da `--password` iletilmemişse komut, bunları etkin Gateway anlık görüntüsünden çözümler. Gateway kullanılamıyorsa komut hızla başarısız olur.

<Note>
Bu komut yolu, `secrets.resolve` RPC yöntemini destekleyen bir Gateway gerektirir. Eski Gateway sürümleri, bilinmeyen yöntem hatası döndürür.
</Note>

## İlgili konular

- [CLI başvurusu](/tr/cli)
- [Cihazlar](/tr/cli/devices)
- [Eşleştirme](/tr/cli/pairing)
