---
read_when:
    - Bir mobil Node uygulamasını bir Gateway ile hızlıca eşleştirmek istiyorsunuz
    - Uzaktan/manuel paylaşım için setup-code çıktısı gerekir
summary: '`openclaw qr` için CLI referansı (mobil eşleştirme QR kodu + kurulum kodu oluşturma)'
title: QR
x-i18n:
    generated_at: "2026-05-06T09:06:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2e8f86b860701dcd625b6573070e30ed26a2f3fda9e5e7998723c8058de498b
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Geçerli Gateway yapılandırmanızdan bir mobil eşleme QR kodu ve kurulum kodu oluşturun.

## Kullanım

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Seçenekler

- `--remote`: `gateway.remote.url` değerini tercih et; ayarlanmamışsa `gateway.tailscale.mode=serve|funnel` yine de uzak genel URL'yi sağlayabilir
- `--url <url>`: yükte kullanılan gateway URL'sini geçersiz kıl
- `--public-url <url>`: yükte kullanılan genel URL'yi geçersiz kıl
- `--token <token>`: bootstrap akışının kimlik doğrulaması yaptığı gateway token'ını geçersiz kıl
- `--password <password>`: bootstrap akışının kimlik doğrulaması yaptığı gateway parolasını geçersiz kıl
- `--setup-code-only`: yalnızca kurulum kodunu yazdır
- `--no-ascii`: ASCII QR işlemeyi atla
- `--json`: JSON üret (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Notlar

- `--token` ve `--password` birlikte kullanılamaz.
- Kurulum kodunun kendisi artık paylaşılan gateway token/parolası yerine opak, kısa ömürlü bir `bootstrapToken` taşır.
- Yerleşik düğüm/operatör bootstrap akışında, birincil düğüm token'ı hâlâ `scopes: []` ile yerleşir.
- Bootstrap devri bir operatör token'ı da çıkarırsa, bootstrap izin listesiyle sınırlı kalır: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Bootstrap kapsam kontrolleri rol öneklidir. Bu operatör izin listesi yalnızca operatör isteklerini karşılar; operatör olmayan rollerin hâlâ kendi rol önekleri altında kapsamlara ihtiyacı vardır.
- Mobil eşleme, Tailscale/genel `ws://` gateway URL'leri için kapalı şekilde başarısız olur. Özel LAN adresleri ve `.local` Bonjour ana bilgisayarları `ws://` üzerinden desteklenmeye devam eder, ancak Tailscale/genel mobil rotalar Tailscale Serve/Funnel veya bir `wss://` gateway URL'si kullanmalıdır.
- `--remote` ile OpenClaw, `gateway.remote.url` veya
  `gateway.tailscale.mode=serve|funnel` değerlerinden birini gerektirir.
- `--remote` ile, fiilen etkin uzak kimlik bilgileri SecretRef olarak yapılandırılmışsa ve `--token` ya da `--password` geçmezseniz komut bunları etkin gateway anlık görüntüsünden çözer. Gateway kullanılamıyorsa komut hızlı şekilde başarısız olur.
- `--remote` olmadan, CLI kimlik doğrulama geçersiz kılması geçirilmediğinde yerel gateway kimlik doğrulama SecretRef'leri çözülür:
  - `gateway.auth.token`, token kimlik doğrulaması kazanabildiğinde çözülür (açık `gateway.auth.mode="token"` veya hiçbir parola kaynağının kazanmadığı çıkarımlı mod).
  - `gateway.auth.password`, parola kimlik doğrulaması kazanabildiğinde çözülür (açık `gateway.auth.mode="password"` veya auth/env'den kazanan token olmayan çıkarımlı mod).
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRef'ler dahil) ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar kurulum kodu çözümlemesi başarısız olur.
- Gateway sürüm uyumsuzluğu notu: bu komut yolu `secrets.resolve` destekleyen bir gateway gerektirir; eski gateway'ler bilinmeyen yöntem hatası döndürür.
- Taradıktan sonra cihaz eşlemesini şununla onaylayın:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## İlgili

- [CLI başvurusu](/tr/cli)
- [Eşleme](/tr/cli/pairing)
