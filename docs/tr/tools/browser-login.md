---
read_when:
    - Tarayıcı otomasyonu için sitelere giriş yapmanız gerekiyor
    - X/Twitter'da güncelleme paylaşmak istiyorsunuz
summary: Tarayıcı otomasyonu + X/Twitter paylaşımı için manuel girişler
title: Tarayıcı Girişi
x-i18n:
    generated_at: "2026-04-05T14:09:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: de40685c70f1c141dba98e6dadc2c6f3a2b3b6d98c89ef8404144c9d178bb763
    source_path: tools/browser-login.md
    workflow: 15
---

# Tarayıcı girişi + X/Twitter paylaşımı

## Manuel giriş (önerilir)

Bir site giriş gerektiriyorsa, **host** tarayıcı profilinde (**openclaw** tarayıcısı) **manuel olarak giriş yapın**.

Kimlik bilgilerinizi modele **vermeyin**. Otomatik girişler genellikle anti-bot savunmalarını tetikler ve hesabı kilitleyebilir.

Ana tarayıcı belgelerine geri dönün: [Browser](/tools/browser).

## Hangi Chrome profili kullanılıyor?

OpenClaw, **ayrı bir Chrome profilini** kontrol eder (`openclaw` adlı, turuncu tonlu arayüz). Bu, günlük tarayıcı profilinizden ayrıdır.

Ajan tarayıcı aracı çağrıları için:

- Varsayılan seçim: ajan, yalıtılmış `openclaw` tarayıcısını kullanmalıdır.
- Yalnızca mevcut giriş yapılmış oturumlar önemliyse ve kullanıcı herhangi bir bağlan/onayla istemine tıklamak için bilgisayar başındaysa `profile="user"` kullanın.
- Birden fazla kullanıcı tarayıcı profiliniz varsa, tahmin etmek yerine profili açıkça belirtin.

Buna erişmenin iki kolay yolu vardır:

1. **Ajandan tarayıcıyı açmasını isteyin**, ardından kendiniz giriş yapın.
2. **CLI üzerinden açın**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Birden fazla profiliniz varsa `--browser-profile <name>` geçin (`openclaw` varsayılandır).

## X/Twitter: önerilen akış

- **Okuma/arama/iletiler:** **host** tarayıcıyı kullanın (manuel giriş).
- **Güncelleme paylaşma:** **host** tarayıcıyı kullanın (manuel giriş).

## Sandbox + host tarayıcı erişimi

Sandbox içindeki tarayıcı oturumları, bot tespitini tetiklemeye **daha yatkındır**. X/Twitter (ve diğer katı siteler) için **host** tarayıcıyı tercih edin.

Ajan sandbox içindeyse, tarayıcı aracı varsayılan olarak sandbox'ı kullanır. Host denetimine izin vermek için:

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

Veya güncelleme paylaşan ajan için sandboxing'i devre dışı bırakın.
