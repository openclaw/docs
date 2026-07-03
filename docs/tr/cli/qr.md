---
read_when:
    - Bir mobil Node uygulamasını hızlıca bir Gateway ile eşleştirmek istiyorsunuz.
    - Uzaktan/elle paylaşım için setup-code çıktısına ihtiyacınız var
summary: '`openclaw qr` için CLI referansı (mobil eşleştirme QR kodu + kurulum kodu oluştur)'
title: QR
x-i18n:
    generated_at: "2026-07-03T17:40:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2a0d71fb7be0734a015084bfb5edef74953310d384964eab9cccbabf7c497e3
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Geçerli Gateway yapılandırmanızdan bir mobil eşleştirme QR'ı ve kurulum kodu oluşturun.

## Kullanım

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Seçenekler

- `--remote`: `gateway.remote.url` tercih edilir; ayarlanmamışsa `gateway.tailscale.mode=serve|funnel` yine de uzak genel URL'yi sağlayabilir
- `--url <url>`: yükte kullanılan gateway URL'sini geçersiz kıl
- `--public-url <url>`: yükte kullanılan genel URL'yi geçersiz kıl
- `--token <token>`: önyükleme akışının kimlik doğrulaması yaptığı gateway token'ını geçersiz kıl
- `--password <password>`: önyükleme akışının kimlik doğrulaması yaptığı gateway parolasını geçersiz kıl
- `--setup-code-only`: yalnızca kurulum kodunu yazdır
- `--no-ascii`: ASCII QR oluşturmayı atla
- `--json`: JSON çıktısı üret (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Notlar

- `--token` ve `--password` birbirini dışlar.
- Kurulum kodunun kendisi artık paylaşılan gateway token'ı/parolası değil, opak ve kısa ömürlü bir `bootstrapToken` taşır.
- Yerleşik kurulum kodu önyüklemesi, `scopes: []` ile birincil bir `node` token'ı ve güvenilir mobil ilk katılım için sınırlı bir `operator` devir token'ı döndürür.
- Devredilen operatör token'ı `operator.approvals`, `operator.read`, `operator.talk.secrets` ve `operator.write` ile sınırlıdır; eşleştirme değişikliği kapsamları ve `operator.admin` hâlâ ayrı bir onaylı operatör eşleştirmesi veya token akışı gerektirir.
- Mobil eşleştirme, Tailscale/genel `ws://` gateway URL'leri için kapalı hata verir. Özel LAN adresleri ve `.local` Bonjour host'ları `ws://` üzerinden desteklenmeye devam eder, ancak Tailscale/genel mobil rotalar Tailscale Serve/Funnel veya bir `wss://` gateway URL'si kullanmalıdır.
- `--remote` ile OpenClaw, `gateway.remote.url` ya da
  `gateway.tailscale.mode=serve|funnel` gerektirir.
- `--remote` ile, etkin uzak kimlik bilgileri SecretRefs olarak yapılandırılmışsa ve `--token` ya da `--password` geçmezseniz komut bunları etkin gateway anlık görüntüsünden çözer. Gateway kullanılamıyorsa komut hızla başarısız olur.
- `--remote` olmadan, CLI kimlik doğrulama geçersiz kılması geçirilmediğinde yerel gateway kimlik doğrulama SecretRefs'leri çözülür:
  - Token kimlik doğrulaması kazanabildiğinde `gateway.auth.token` çözülür (açık `gateway.auth.mode="token"` veya hiçbir parola kaynağının kazanmadığı çıkarımsal kip).
  - Parola kimlik doğrulaması kazanabildiğinde `gateway.auth.password` çözülür (açık `gateway.auth.mode="password"` veya auth/env'den kazanan token olmayan çıkarımsal kip).
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRefs dahil) ve `gateway.auth.mode` ayarlanmamışsa, kurulum kodu çözümlemesi kip açıkça ayarlanana kadar başarısız olur.
- Gateway sürüm uyumsuzluğu notu: bu komut yolu `secrets.resolve` destekleyen bir gateway gerektirir; eski gateway'ler bilinmeyen yöntem hatası döndürür.
- Taramadan sonra cihaz eşleştirmesini şununla onaylayın:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## İlgili

- [CLI başvurusu](/tr/cli)
- [Eşleştirme](/tr/cli/pairing)
