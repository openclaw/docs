---
read_when:
    - Bir mobil Node uygulamasını bir Gateway ile hızlıca eşleştirmek istiyorsunuz
    - Uzak/elle paylaşım için setup-code çıktısına ihtiyacınız var
summary: '`openclaw qr` için CLI başvurusu (mobil eşleştirme QR''si + kurulum kodu oluşturma)'
title: QR
x-i18n:
    generated_at: "2026-06-28T00:24:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d08bbeb69627dafea45c912af4e92c08cd5c79d4ae52bb3f0a6fba5e789acb51
    source_path: cli/qr.md
    workflow: 16
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

- `--remote`: `gateway.remote.url` değerini tercih et; ayarlanmamışsa `gateway.tailscale.mode=serve|funnel` yine de uzak herkese açık URL'yi sağlayabilir
- `--url <url>`: yükte kullanılan gateway URL'sini geçersiz kıl
- `--public-url <url>`: yükte kullanılan herkese açık URL'yi geçersiz kıl
- `--token <token>`: önyükleme akışının kimlik doğrulaması yaptığı gateway token'ını geçersiz kıl
- `--password <password>`: önyükleme akışının kimlik doğrulaması yaptığı gateway parolasını geçersiz kıl
- `--setup-code-only`: yalnızca kurulum kodunu yazdır
- `--no-ascii`: ASCII QR işlemeyi atla
- `--json`: JSON çıktısı üret (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Notlar

- `--token` ve `--password` birlikte kullanılamaz.
- Kurulum kodunun kendisi artık paylaşılan gateway token'ını/parolasını değil, opak ve kısa ömürlü bir `bootstrapToken` taşır.
- Yerleşik kurulum kodu önyüklemesi, güvenilir mobil alıştırma için sınırlı bir `operator` devretme token'ı ile birlikte `scopes: []` içeren birincil bir `node` token'ı döndürür.
- Devredilen operator token'ı `operator.approvals`, `operator.read`, `operator.talk.secrets` ve `operator.write` ile sınırlıdır; `operator.admin` ve `operator.pairing` ayrı bir onaylanmış operator eşleştirmesi veya token akışı gerektirir.
- Mobil eşleştirme, Tailscale/herkese açık `ws://` gateway URL'leri için kapalı başarısız olur. Özel LAN adresleri ve `.local` Bonjour ana makineleri `ws://` üzerinden desteklenmeye devam eder, ancak Tailscale/herkese açık mobil rotalar Tailscale Serve/Funnel veya bir `wss://` gateway URL'si kullanmalıdır.
- `--remote` ile OpenClaw, `gateway.remote.url` veya
  `gateway.tailscale.mode=serve|funnel` gerektirir.
- `--remote` ile, etkin uzak kimlik bilgileri SecretRefs olarak yapılandırılmışsa ve `--token` ya da `--password` iletmezseniz, komut bunları etkin gateway anlık görüntüsünden çözümler. Gateway kullanılamıyorsa komut hızlıca başarısız olur.
- `--remote` olmadan, CLI kimlik doğrulama geçersiz kılması iletilmediğinde yerel gateway kimlik doğrulama SecretRefs çözümlenir:
  - Token kimlik doğrulaması kazanabildiğinde `gateway.auth.token` çözümlenir (açık `gateway.auth.mode="token"` veya hiçbir parola kaynağının kazanmadığı çıkarımsal mod).
  - Parola kimlik doğrulaması kazanabildiğinde `gateway.auth.password` çözümlenir (açık `gateway.auth.mode="password"` veya auth/env'den kazanan token olmayan çıkarımsal mod).
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRefs dahil) ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar kurulum kodu çözümlemesi başarısız olur.
- Gateway sürüm uyumsuzluğu notu: bu komut yolu `secrets.resolve` desteği olan bir gateway gerektirir; daha eski gateway'ler bilinmeyen yöntem hatası döndürür.
- Taramadan sonra cihaz eşleştirmesini şununla onaylayın:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## İlgili

- [CLI referansı](/tr/cli)
- [Eşleştirme](/tr/cli/pairing)
