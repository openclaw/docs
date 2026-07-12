---
read_when:
    - Tarayıcı otomasyonu için sitelerde oturum açmanız gerekir
    - X/Twitter'da güncellemeler yayımlamak istiyorsunuz
summary: Tarayıcı otomasyonu ve X/Twitter gönderileri için manuel oturum açma işlemleri
title: Tarayıcı girişi
x-i18n:
    generated_at: "2026-07-12T12:16:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bccd363cf7c9611f4687d50a92f7fb3e2fd1c1d67bb27a80c892f7ac58ae1f8f
    source_path: tools/browser-login.md
    workflow: 16
---

## Manuel oturum açma (önerilir)

Bir site oturum açmayı gerektirdiğinde, ana makine tarayıcısının `openclaw`
profilinde manuel olarak oturum açın. Kimlik bilgilerinizi modele vermeyin:
otomatik oturum açma işlemleri çoğu zaman bot karşıtı savunmaları tetikler ve
hesabın kilitlenmesine neden olabilir.

X/Twitter ve botlara karşı hassas diğer sitelerde hem içerik okumak
(aramalar/iletiler) hem de gönderi paylaşmak için ana makine tarayıcısını
(manuel oturum açma) kullanın. Korumalı alan tarayıcı oturumlarının bot
algılamayı tetikleme olasılığı daha yüksektir.

Ana tarayıcı belgelerine dönün: [Tarayıcı](/tr/tools/browser).

## Hangi Chrome profili kullanılır?

OpenClaw, günlük tarayıcı profilinizden ayrı olarak `openclaw` adlı özel bir
Chrome profilini (turuncu tonlu kullanıcı arayüzü) kontrol eder.

Aracı tarayıcı aracı çağrıları için:

- Varsayılan seçim: aracı, yalıtılmış `openclaw` tarayıcısını kullanır.
- `profile="user"` seçeneğini yalnızca mevcut oturumların açık olması
  önemliyse ve herhangi bir bağlanma istemine tıklamak/onay vermek için
  bilgisayarın başındaysanız kullanın.
- Birden fazla kullanıcı tarayıcısı profiliniz varsa tahminde bulunmak yerine
  profili açıkça belirtin.

`openclaw` profiline erişmenin iki yolu vardır:

1. Aracıdan tarayıcıyı açmasını isteyin, ardından kendiniz oturum açın.
2. CLI üzerinden açın:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Varsayılan olmayan bir profil için alt komuttan önce
`--browser-profile <name>` seçeneğini ekleyin (varsayılan `openclaw`'dur):

```bash
openclaw browser --browser-profile <name> open https://x.com
```

## Korumalı alan: ana makine tarayıcısına erişime izin verme

Aracı korumalı alandaysa `browser` aracı çağrıları varsayılan olarak ana
makine tarayıcısını değil, korumalı alan tarayıcısını kullanır. Aracının bunun
yerine ana makine tarayıcısını hedeflemesine izin vermek için:

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

CLI çağrıları her zaman ana makine tarayıcısını hedefler, korumalı alanı asla
hedeflemez; dolayısıyla bu ayardan bağımsız olarak ana makine tarayıcısını
kendiniz açabilirsiniz:

```bash
openclaw browser --browser-profile openclaw open https://x.com
```

`sandbox.browser.allowHostControl: true` ayarlandıktan sonra aracının `browser`
aracı çağrıları da ana makineyi hedefleyebilir. Alternatif olarak,
güncellemeleri paylaşan aracı için korumalı alanı devre dışı bırakın.

## İlgili içerikler

- [Tarayıcı](/tr/tools/browser)
- [Linux'ta tarayıcı sorunlarını giderme](/tr/tools/browser-linux-troubleshooting)
- [WSL2'de tarayıcı sorunlarını giderme](/tr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
