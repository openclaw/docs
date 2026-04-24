---
read_when:
    - Tarayıcı otomasyonu için sitelere giriş yapmanız gerekiyor
    - X/Twitter'da güncellemeler paylaşmak istiyorsunuz
summary: Tarayıcı otomasyonu + X/Twitter paylaşımı için manuel girişler
title: Tarayıcı girişi
x-i18n:
    generated_at: "2026-04-24T09:33:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e70ae373fed861ffde0e03dfe6252b0589f7cc1946585e9b055cbed70de14b1
    source_path: tools/browser-login.md
    workflow: 15
---

# Tarayıcı girişi + X/Twitter paylaşımı

## Manuel giriş (önerilir)

Bir site giriş gerektiriyorsa **host** browser profile'ında (**openclaw browser**) **elle giriş yapın**.

Modele kimlik bilgilerinizi **vermeyin**. Otomatik girişler çoğu zaman anti-bot savunmalarını tetikler ve hesabı kilitleyebilir.

Ana browser belgelerine dönüş: [Browser](/tr/tools/browser).

## Hangi Chrome profile'ı kullanılır?

OpenClaw, **ayrılmış bir Chrome profile'ını** (`openclaw` adlı, turuncu tonlu UI) denetler. Bu, günlük browser profile'ınızdan ayrıdır.

Ajan browser aracı çağrıları için:

- Varsayılan seçim: ajan yalıtılmış `openclaw` browser'ını kullanmalıdır.
- Yalnızca mevcut giriş yapılmış oturumlar önemliyse ve kullanıcı bilgisayar başında olup bağlama istemlerini tıklayabilecek/onaylayabilecek durumdaysa `profile="user"` kullanın.
- Birden çok kullanıcı browser profile'ınız varsa tahmin etmek yerine profile'ı açıkça belirtin.

Buna erişmenin iki kolay yolu vardır:

1. **Ajandan browser'ı açmasını isteyin**, sonra kendiniz giriş yapın.
2. **CLI ile açın**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Birden çok profile varsa `--browser-profile <name>` geçin (varsayılan `openclaw`'dır).

## X/Twitter: önerilen akış

- **Okuma/arama/konular:** **host** browser'ı kullanın (manuel giriş).
- **Güncelleme paylaşma:** **host** browser'ı kullanın (manuel giriş).

## Sandboxing + host browser erişimi

Sandboxed browser oturumları bot tespitini tetiklemeye **daha yatkındır**. X/Twitter (ve diğer katı siteler) için **host** browser'ı tercih edin.

Ajan sandbox içindeyse browser aracı varsayılan olarak sandbox'ı hedefler. Host denetimine izin vermek için:

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

Sonra host browser'ı hedefleyin:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Veya güncelleme paylaşan ajan için sandboxing'i devre dışı bırakın.

## İlgili

- [Browser](/tr/tools/browser)
- [Browser Linux sorun giderme](/tr/tools/browser-linux-troubleshooting)
- [Browser WSL2 sorun giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
