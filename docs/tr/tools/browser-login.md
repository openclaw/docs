---
read_when:
    - Tarayıcı otomasyonu için sitelerde oturum açmanız gerekir
    - X/Twitter'da güncellemeler paylaşmak istiyorsunuz
summary: Tarayıcı otomasyonu + X/Twitter paylaşımı için manuel oturum açma işlemleri
title: Tarayıcıyla oturum açma
x-i18n:
    generated_at: "2026-05-11T20:37:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89501b47611a39df5a658ed7e144b7c16a07188dfa52544b56cbfc6e296e2ecc
    source_path: tools/browser-login.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Manuel giriş (önerilir)

Bir site giriş yapmayı gerektiriyorsa, **ana makine** tarayıcı profilinde (openclaw tarayıcısı) **manuel olarak oturum açın**.

Modele kimlik bilgilerinizi **vermeyin**. Otomatik girişler genellikle bot karşıtı savunmaları tetikler ve hesabın kilitlenmesine neden olabilir.

Ana tarayıcı belgelerine dönün: [Tarayıcı](/tr/tools/browser).

## Hangi Chrome profili kullanılır?

OpenClaw, **ayrılmış bir Chrome profilini** denetler (`openclaw` adlı, turuncu tonlu UI). Bu, günlük tarayıcı profilinizden ayrıdır.

Aracı tarayıcı aracı çağrıları için:

- Varsayılan seçim: aracı, yalıtılmış `openclaw` tarayıcısını kullanmalıdır.
- `profile="user"` seçeneğini yalnızca mevcut oturum açılmış oturumlar önemli olduğunda ve kullanıcı herhangi bir ekleme istemine tıklamak/onaylamak için bilgisayar başındaysa kullanın.
- Birden fazla kullanıcı tarayıcı profiliniz varsa, tahmin etmek yerine profili açıkça belirtin.

Erişmenin iki kolay yolu:

1. **Aracıdan tarayıcıyı açmasını isteyin** ve ardından kendiniz giriş yapın.
2. **CLI üzerinden açın**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Birden fazla profiliniz varsa, `--browser-profile <name>` iletin (varsayılan `openclaw` değeridir).

## X/Twitter: önerilen akış

- **Okuma/arama/konular:** **ana makine** tarayıcısını kullanın (manuel giriş).
- **Güncellemeler yayımlama:** **ana makine** tarayıcısını kullanın (manuel giriş).

## Sandbox + ana makine tarayıcı erişimi

Sandbox içindeki tarayıcı oturumlarının bot algılamayı tetikleme olasılığı **daha yüksektir**. X/Twitter (ve diğer katı siteler) için **ana makine** tarayıcısını tercih edin.

Aracı sandbox içindeyse, tarayıcı aracı varsayılan olarak sandbox'ı kullanır. Ana makine denetimine izin vermek için:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

Ardından ana makine tarayıcısını kendiniz açın (CLI çağrıları her zaman ana makine tarayıcısına karşı çalışır):

```bash
openclaw browser open https://x.com --browser-profile openclaw
```

Aracının `browser` aracı çağrıları, `sandbox.browser.allowHostControl: true` ayarlandıktan sonra ana makineyi hedefleyebilir. Alternatif olarak, güncellemeleri yayımlayan aracı için sandbox'ı devre dışı bırakın.

## İlgili

- [Tarayıcı](/tr/tools/browser)
- [Tarayıcı Linux sorun giderme](/tr/tools/browser-linux-troubleshooting)
- [Tarayıcı WSL2 sorun giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
