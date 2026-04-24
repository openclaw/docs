---
read_when:
    - Bir mobil Node uygulamasını hızlıca bir gateway ile eşleştirmek istiyorsunuz
    - Uzaktan/manuel paylaşım için kurulum kodu çıktısına ihtiyacınız var
summary: '`openclaw qr` için CLI başvurusu (mobil eşleştirme QR kodu + kurulum kodu oluşturma)'
title: QR
x-i18n:
    generated_at: "2026-04-24T09:03:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05e25f5cf4116adcd0630b148b6799e90304058c51c998293ebbed995f0a0533
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

Geçerli Gateway yapılandırmanızdan mobil eşleştirme QR kodu ve kurulum kodu oluşturun.

## Kullanım

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Seçenekler

- `--remote`: `gateway.remote.url` değerini tercih eder; ayarlı değilse `gateway.tailscale.mode=serve|funnel` yine de uzak genel URL'yi sağlayabilir
- `--url <url>`: payload içinde kullanılan gateway URL'sini geçersiz kılar
- `--public-url <url>`: payload içinde kullanılan genel URL'yi geçersiz kılar
- `--token <token>`: bootstrap akışının kimlik doğrulaması yapacağı gateway belirtecini geçersiz kılar
- `--password <password>`: bootstrap akışının kimlik doğrulaması yapacağı gateway parolasını geçersiz kılar
- `--setup-code-only`: yalnızca kurulum kodunu yazdırır
- `--no-ascii`: ASCII QR oluşturmayı atlar
- `--json`: JSON üretir (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Notlar

- `--token` ve `--password` birbirini dışlar.
- Kurulum kodunun kendisi artık paylaşılan gateway belirteci/parolası değil, opak ve kısa ömürlü bir `bootstrapToken` taşır.
- Yerleşik node/operator bootstrap akışında, birincil Node belirteci yine `scopes: []` ile gelir.
- Bootstrap devri ayrıca bir operatör belirteci de verirse, bu belirteç bootstrap izin listesiyle sınırlı kalır: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Bootstrap kapsam denetimleri rol önekli çalışır. Bu operatör izin listesi yalnızca operatör isteklerini karşılar; operatör olmayan roller yine kendi rol önekleri altındaki kapsamlara ihtiyaç duyar.
- Mobil eşleştirme, Tailscale/herkese açık `ws://` gateway URL'leri için başarısızlığa kapalı çalışır. Özel LAN `ws://` desteği sürer, ancak Tailscale/herkese açık mobil rotalar Tailscale Serve/Funnel veya bir `wss://` gateway URL'si kullanmalıdır.
- `--remote` ile OpenClaw, `gateway.remote.url` veya
  `gateway.tailscale.mode=serve|funnel` gerektirir.
- `--remote` ile, etkili olarak etkin uzak kimlik bilgileri SecretRef olarak yapılandırılmışsa ve `--token` veya `--password` geçmezseniz, komut bunları etkin gateway anlık görüntüsünden çözümler. Gateway kullanılamıyorsa komut hızlıca başarısız olur.
- `--remote` olmadan, CLI kimlik doğrulama geçersiz kılması verilmediğinde yerel gateway kimlik doğrulama SecretRef'leri çözülür:
  - belirteç kimlik doğrulaması kazanabiliyorsa `gateway.auth.token` çözülür (açık `gateway.auth.mode="token"` veya hiçbir parola kaynağının kazanmadığı çıkarımsal mod).
  - parola kimlik doğrulaması kazanabiliyorsa `gateway.auth.password` çözülür (açık `gateway.auth.mode="password"` veya auth/env'den kazanan bir belirtecinin olmadığı çıkarımsal mod).
- Hem `gateway.auth.token` hem `gateway.auth.password` yapılandırılmışsa (SecretRef'ler dahil) ve `gateway.auth.mode` ayarlı değilse, mod açıkça ayarlanana kadar kurulum kodu çözümlemesi başarısız olur.
- Gateway sürüm uyumsuzluğu notu: bu komut yolu `secrets.resolve` desteği olan bir gateway gerektirir; eski gateway'ler bilinmeyen yöntem hatası döndürür.
- Taradıktan sonra cihaz eşleştirmesini şu komutlarla onaylayın:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## İlgili

- [CLI başvurusu](/tr/cli)
- [Eşleştirme](/tr/cli/pairing)
