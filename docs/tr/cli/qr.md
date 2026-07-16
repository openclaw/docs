---
read_when:
    - Bir mobil Node uygulamasını bir Gateway ile hızlıca eşleştirmek istiyorsunuz
    - Uzaktan/manuel paylaşım için kurulum kodu çıktısına ihtiyacınız var
summary: '`openclaw qr` için CLI referansı (mobil eşleştirme QR kodu + kurulum kodu oluşturma)'
title: QR
x-i18n:
    generated_at: "2026-07-16T17:17:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f9d60a58126eae7eec5979f28bb511a09fa52b68cdd73727fca0b2de74efa84a
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
openclaw qr --limited
openclaw qr --url wss://gateway.example/ws
```

Resmî OpenClaw iOS ve Android uygulamaları, kurulum kodu meta verileri eşleştiğinde otomatik olarak bağlanır. Bir istek beklemede kalırsa (örneğin resmî olmayan bir istemci veya eşleşmeyen meta veriler nedeniyle), isteği inceleyip onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Seçenekler

- `--remote`: `gateway.remote.url` tercih edilir; bu URL ayarlanmamışsa `gateway.tailscale.mode=serve|funnel` değerine geri döner. `device-pair` Plugin `publicUrl` yok sayılır.
- `--url <url>`: yükte kullanılan Gateway URL'sini geçersiz kılar
- `--public-url <url>`: yükte kullanılan genel URL'yi geçersiz kılar
- `--token <token>`: önyükleme akışının kimlik doğrulaması için kullandığı Gateway belirtecini geçersiz kılar
- `--password <password>`: önyükleme akışının kimlik doğrulaması için kullandığı Gateway parolasını geçersiz kılar
- `--limited`: devredilen operatör belirtecinden yönetimsel Gateway erişimini çıkarır
- `--setup-code-only`: yalnızca kurulum kodunu yazdırır
- `--no-ascii`: ASCII QR oluşturmayı atlar
- `--json`: JSON çıktısı verir (`setupCode`, `gatewayUrl`, isteğe bağlı `gatewayUrls`, `auth`, `access`, isteğe bağlı `accessDowngraded`, `urlSource`)

`--token` ve `--password` birlikte kullanılamaz.

## Kurulum kodunun içeriği

Kurulum kodu, paylaşılan Gateway belirteci/parolası yerine kısa ömürlü ve belirsiz bir `bootstrapToken` taşır. Bir `wss://` uç noktası (veya aynı ana makinedeki geri döngü) için varsayılan önyükleme akışı şunları verir:

- `scopes: []` içeren birincil `node` belirteci
- `operator.admin`, `operator.approvals`, `operator.read`, `operator.talk.secrets` ve `operator.write` içeren tam yerel mobil `operator` devir belirteci

Operatör devrinden `operator.admin` çıkarılırken aynı Node belirtecini korumak için `--limited` kullanın. Eşleştirme değişikliği kapsamı hiçbir zaman kurulum koduyla devredilmez.

Düz metin LAN `ws://` kurulumu kullanılabilir olmaya devam eder ancak ağdaki bir gözlemci, taşıyıcı önyükleme belirtecini yakalayıp ondan önce davranabileceğinden OpenClaw sınırlı profili otomatik olarak kullanır. Tam erişim elde etmek için `wss://` veya Tailscale Serve yapılandırın, ardından yeni bir kod oluşturun.

## Gateway URL çözümlemesi

Mobil eşleştirme, Tailscale/genel `ws://` Gateway URL'leri için güvenli biçimde başarısız olur: bunlar için Tailscale Serve/Funnel veya bir `wss://` Gateway URL'si kullanın. Özel LAN adresleri ve `.local` Bonjour ana makineleri, yukarıda açıklandığı şekilde sınırlı operatör erişimiyle düz `ws://` üzerinden desteklenmeye devam eder.

Seçilen Gateway URL'si `gateway.bind=lan` kaynağından geldiğinde OpenClaw, kalıcı `tailscale serve status --json` rotalarını da denetler. Etkin Gateway'in geri döngü bağlantı noktasına vekillik eden tüm HTTPS Serve kökleri yedek olarak eklenir. QR komutu bu yedeği yalnızca `lan` için ekler; `custom` ve `tailnet` açıkça duyurulan rotalarını korur. Geçerli iOS istemcileri duyurulan rotaları sırayla yoklar ve erişilebilen ilk rotayı kaydeder; eski istemciler için geriye dönük `url` alanı değiştirilmeden kalır.

`--remote` kullanılırken `gateway.remote.url` veya `gateway.tailscale.mode=serve|funnel` seçeneklerinden biri gereklidir.

## Kimlik doğrulama çözümlemesi (`--remote` olmadan)

CLI kimlik doğrulama geçersiz kılması iletilmediğinde, yerel Gateway kimlik doğrulama SecretRef'leri şu şekilde çözümlenir:

| Koşul                                                                                                                    | Çözümlenen                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"` veya kazanan parola kaynağı bulunmayan çıkarımlı mod                                                | `gateway.auth.token`                      |
| `gateway.auth.mode="password"` veya kimlik doğrulaması/ortamdan kazanan belirteç bulunmayan çıkarımlı mod                                         | `gateway.auth.password`                   |
| Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRef'ler dâhil) ve `gateway.auth.mode` ayarlanmamışsa | başarısız olur; `gateway.auth.mode` değerini açıkça ayarlayın |

## Kimlik doğrulama çözümlemesi (`--remote`)

Etkin durumdaki uzak kimlik bilgileri SecretRef olarak yapılandırılmışsa ve ne `--token` ne de `--password` iletilmişse komut, bunları etkin Gateway anlık görüntüsünden çözümler. Gateway kullanılamıyorsa komut hemen başarısız olur.

<Note>
Bu komut yolu, `secrets.resolve` RPC yöntemini destekleyen bir Gateway gerektirir. Eski Gateway'ler bilinmeyen yöntem hatası döndürür.
</Note>

## İlgili

- [CLI referansı](/tr/cli)
- [Cihazlar](/tr/cli/devices)
- [Eşleştirme](/tr/cli/pairing)
