---
read_when:
    - Bir mobil düğüm uygulamasını bir ağ geçidiyle hızlıca eşleştirmek istiyorsanız
    - Uzaktan/elle paylaşım için kurulum kodu çıktısına ihtiyacınız varsa
summary: '`openclaw qr` için CLI başvurusu (mobil eşleştirme QR kodu + kurulum kodu oluşturma)'
title: qr
x-i18n:
    generated_at: "2026-04-05T13:49:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6469334ad09037318f938c7ac609b7d5e3385c0988562501bb02a1bfa411ff
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

Geçerli Ağ Geçidi yapılandırmanızdan bir mobil eşleştirme QR kodu ve kurulum kodu oluşturun.

## Kullanım

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Seçenekler

- `--remote`: `gateway.remote.url` değerini tercih eder; bu ayarlanmamışsa `gateway.tailscale.mode=serve|funnel` yine de uzak genel URL'yi sağlayabilir
- `--url <url>`: payload içinde kullanılan ağ geçidi URL'sini geçersiz kılar
- `--public-url <url>`: payload içinde kullanılan genel URL'yi geçersiz kılar
- `--token <token>`: bootstrap akışının hangi ağ geçidi token'ına karşı kimlik doğrulayacağını geçersiz kılar
- `--password <password>`: bootstrap akışının hangi ağ geçidi parolasına karşı kimlik doğrulayacağını geçersiz kılar
- `--setup-code-only`: yalnızca kurulum kodunu yazdırır
- `--no-ascii`: ASCII QR oluşturmadan geçer
- `--json`: JSON üretir (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Notlar

- `--token` ve `--password` birbirini dışlar.
- Kurulum kodunun kendisi artık paylaşılan ağ geçidi token'ını/parolasını değil, opak kısa ömürlü bir `bootstrapToken` taşır.
- Yerleşik düğüm/operatör bootstrap akışında, birincil düğüm token'ı hâlâ `scopes: []` ile gelir.
- Bootstrap aktarımı ayrıca bir operatör token'ı da veriyorsa, bu token bootstrap allowlist'i ile sınırlı kalır: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Bootstrap kapsam denetimleri role önekli yapılır. Bu operatör allowlist'i yalnızca operatör isteklerini karşılar; operatör olmayan rollerin yine kendi rol önekleri altında kapsamları olması gerekir.
- Mobil eşleştirme, Tailscale/genel `ws://` ağ geçidi URL'lerinde kapalı şekilde başarısız olur. Private LAN `ws://` desteklenmeye devam eder, ancak Tailscale/genel mobil yollar Tailscale Serve/Funnel veya bir `wss://` ağ geçidi URL'si kullanmalıdır.
- `--remote` ile OpenClaw, `gateway.remote.url` veya
  `gateway.tailscale.mode=serve|funnel` gerektirir.
- `--remote` ile, etkin uzak kimlik bilgileri SecretRef olarak yapılandırılmışsa ve `--token` veya `--password` geçmezseniz, komut bunları etkin ağ geçidi anlık görüntüsünden çözer. Ağ geçidi kullanılamıyorsa komut hızlıca başarısız olur.
- `--remote` olmadan, CLI kimlik doğrulama geçersiz kılması geçilmediğinde yerel ağ geçidi kimlik doğrulama SecretRef'leri çözülür:
  - token kimlik doğrulaması kazanabiliyorsa `gateway.auth.token` çözülür (açık `gateway.auth.mode="token"` veya hiçbir parola kaynağının kazanmadığı çıkarımsal kip).
  - parola kimlik doğrulaması kazanabiliyorsa `gateway.auth.password` çözülür (açık `gateway.auth.mode="password"` veya auth/env üzerinden kazanan token olmayan çıkarımsal kip).
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRef'ler dahil) ve `gateway.auth.mode` ayarlanmamışsa, kip açıkça ayarlanana kadar kurulum kodu çözümlemesi başarısız olur.
- Ağ geçidi sürüm uyumsuzluğu notu: bu komut yolu, `secrets.resolve` destekleyen bir ağ geçidi gerektirir; daha eski ağ geçitleri bilinmeyen yöntem hatası döndürür.
- Taradıktan sonra cihaz eşleştirmesini şu komutlarla onaylayın:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`
