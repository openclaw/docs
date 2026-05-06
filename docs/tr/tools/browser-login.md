---
read_when:
    - Tarayıcı otomasyonu için sitelerde oturum açmanız gerekir
    - X/Twitter'da güncellemeler paylaşmak istiyorsunuz
summary: Tarayıcı otomasyonu + X/Twitter'da gönderi paylaşma için manuel oturum açma
title: Tarayıcı ile oturum açma
x-i18n:
    generated_at: "2026-05-06T09:32:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 235194fd3a49724247f98e6d7c848c4cc3317f749ff4a8918c2172b73baf21e3
    source_path: tools/browser-login.md
    workflow: 16
---

## Manuel oturum açma (önerilir)

Bir site oturum açmayı gerektirdiğinde, **host** tarayıcı profilinde (openclaw tarayıcısı) **manuel olarak oturum açın**.

Modele kimlik bilgilerinizi **vermeyin**. Otomatik oturum açmalar genellikle bot karşıtı savunmaları tetikler ve hesabı kilitleyebilir.

Ana tarayıcı belgelerine geri dönün: [Tarayıcı](/tr/tools/browser).

## Hangi Chrome profili kullanılır?

OpenClaw, **özel bir Chrome profilini** (`openclaw` adlı, turuncu tonlu arayüz) kontrol eder. Bu, günlük tarayıcı profilinizden ayrıdır.

Ajan tarayıcı aracı çağrıları için:

- Varsayılan seçim: ajan, yalıtılmış `openclaw` tarayıcısını kullanmalıdır.
- `profile="user"` değerini yalnızca mevcut oturum açılmış oturumlar önemli olduğunda ve kullanıcı herhangi bir bağlanma istemine tıklamak/onaylamak için bilgisayar başındaysa kullanın.
- Birden çok kullanıcı tarayıcı profiliniz varsa, tahmin etmek yerine profili açıkça belirtin.

Ona erişmenin iki kolay yolu:

1. **Ajandan tarayıcıyı açmasını isteyin** ve ardından kendiniz oturum açın.
2. **CLI üzerinden açın**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Birden çok profiliniz varsa `--browser-profile <name>` iletin (varsayılan `openclaw` değeridir).

## X/Twitter: önerilen akış

- **Okuma/arama/başlıklar:** **host** tarayıcıyı kullanın (manuel oturum açma).
- **Güncelleme gönderme:** **host** tarayıcıyı kullanın (manuel oturum açma).

## Korumalı alan + host tarayıcı erişimi

Korumalı alanlı tarayıcı oturumlarının bot algılamayı tetikleme olasılığı **daha yüksektir**. X/Twitter (ve diğer katı siteler) için **host** tarayıcıyı tercih edin.

Ajan korumalı alandaysa, tarayıcı aracı varsayılan olarak korumalı alanı kullanır. Host denetimine izin vermek için:

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

Ardından host tarayıcıyı hedefleyin:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Veya güncelleme gönderen ajan için korumalı alanı devre dışı bırakın.

## İlgili

- [Tarayıcı](/tr/tools/browser)
- [Tarayıcı Linux sorun giderme](/tr/tools/browser-linux-troubleshooting)
- [Tarayıcı WSL2 sorun giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
