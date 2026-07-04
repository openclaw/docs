---
read_when:
    - Bir mobil node uygulamasını bir gateway ile hızlıca eşleştirmek istiyorsunuz
    - Uzaktan/manuel paylaşım için setup-code çıktısına ihtiyacınız var
summary: '`openclaw qr` için CLI başvurusu (mobil eşleştirme QR kodu + kurulum kodu oluşturma)'
title: QR
x-i18n:
    generated_at: "2026-07-04T18:18:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81d15c9d551960c6f5677649b481e447ecda55a395957746959b4ecf81712bdb
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

- `--remote`: `gateway.remote.url` değerini tercih eder; ayarlanmamışsa `gateway.tailscale.mode=serve|funnel` yine de uzak genel URL'yi sağlayabilir
- `--url <url>`: yükte kullanılan gateway URL'sini geçersiz kılar
- `--public-url <url>`: yükte kullanılan genel URL'yi geçersiz kılar
- `--token <token>`: bootstrap akışının kimlik doğrulaması yaptığı gateway token'ını geçersiz kılar
- `--password <password>`: bootstrap akışının kimlik doğrulaması yaptığı gateway parolasını geçersiz kılar
- `--setup-code-only`: yalnızca kurulum kodunu yazdırır
- `--no-ascii`: ASCII QR işlemeyi atlar
- `--json`: JSON çıktısı üretir (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Notlar

- `--token` ve `--password` birbirini dışlar.
- Kurulum kodunun kendisi artık paylaşılan gateway token'ını/parolasını değil, opak ve kısa ömürlü bir `bootstrapToken` taşır.
- Yerleşik kurulum kodu bootstrap'i, güvenilir mobil ilk katılım için birincil `node` token'ını `scopes: []` ile ve sınırlı bir `operator` devir token'ı ile döndürür.
- Devredilen operator token'ı `operator.approvals`, `operator.read`, `operator.talk.secrets` ve `operator.write` ile sınırlıdır; eşleştirme değişiklik kapsamları ve `operator.admin` yine de ayrı bir onaylanmış operator eşleştirmesi veya token akışı gerektirir.
- Mobil eşleştirme, Tailscale/genel `ws://` gateway URL'leri için kapalı şekilde başarısız olur. Özel LAN adresleri ve `.local` Bonjour ana bilgisayarları `ws://` üzerinden desteklenmeye devam eder, ancak Tailscale/genel mobil rotalar Tailscale Serve/Funnel veya bir `wss://` gateway URL'si kullanmalıdır.
- `--remote` ile OpenClaw, `gateway.remote.url` veya
  `gateway.tailscale.mode=serve|funnel` seçeneklerinden birini gerektirir.
- `--remote` ile, etkin uzak kimlik bilgileri SecretRefs olarak yapılandırılmışsa ve `--token` ya da `--password` iletmezseniz, komut bunları etkin gateway anlık görüntüsünden çözer. Gateway kullanılamıyorsa komut hızlıca başarısız olur.
- `--remote` olmadan, CLI kimlik doğrulama geçersiz kılması iletilmediğinde yerel gateway auth SecretRefs çözülür:
  - `gateway.auth.token`, token auth kazanabildiğinde çözülür (açık `gateway.auth.mode="token"` veya hiçbir parola kaynağının kazanmadığı çıkarılmış mod).
  - `gateway.auth.password`, parola auth kazanabildiğinde çözülür (açık `gateway.auth.mode="password"` veya auth/env'den kazanan token olmayan çıkarılmış mod).
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRefs dahil) ve `gateway.auth.mode` ayarlanmamışsa, kurulum kodu çözümlemesi mod açıkça ayarlanana kadar başarısız olur.
- Gateway sürüm uyumsuzluğu notu: bu komut yolu `secrets.resolve` destekleyen bir gateway gerektirir; eski gateway'ler bilinmeyen yöntem hatası döndürür.
- Resmi OpenClaw iOS ve Android uygulamaları, kurulum kodu meta verileri eşleştiğinde otomatik olarak bağlanır. Bir istek beklemede kalırsa (örneğin resmi olmayan bir istemci veya eşleşmeyen meta veriler için), şu komutlarla inceleyip onaylayın:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## İlgili

- [CLI referansı](/tr/cli)
- [Eşleştirme](/tr/cli/pairing)
