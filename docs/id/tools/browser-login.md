---
read_when:
    - Anda perlu masuk ke situs untuk otomatisasi peramban
    - Anda ingin memposting pembaruan ke X/Twitter
summary: Login manual untuk otomatisasi browser + posting di X/Twitter
title: Login browser
x-i18n:
    generated_at: "2026-07-12T14:40:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bccd363cf7c9611f4687d50a92f7fb3e2fd1c1d67bb27a80c892f7ac58ae1f8f
    source_path: tools/browser-login.md
    workflow: 16
---

## Login manual (disarankan)

Saat suatu situs mengharuskan login, lakukan login secara manual di profil
`openclaw` pada browser host. Jangan berikan kredensial Anda kepada model:
login otomatis sering kali memicu pertahanan anti-bot dan dapat mengunci akun.

Gunakan browser host (login manual) untuk membaca (pencarian/utas) maupun
memposting di X/Twitter dan situs lain yang sensitif terhadap bot. Sesi browser
dalam sandbox lebih mungkin memicu deteksi bot.

Kembali ke dokumentasi browser utama: [Browser](/id/tools/browser).

## Profil Chrome mana yang digunakan?

OpenClaw mengendalikan profil Chrome khusus bernama `openclaw` (antarmuka
bernuansa oranye), yang terpisah dari profil browser harian Anda.

Untuk pemanggilan alat browser oleh agen:

- Pilihan default: agen menggunakan browser `openclaw` yang terisolasi.
- Gunakan `profile="user"` hanya jika sesi login yang sudah ada diperlukan dan
  Anda berada di depan komputer untuk mengeklik/menyetujui setiap permintaan
  penyambungan.
- Jika Anda memiliki beberapa profil browser pengguna, tentukan profil secara
  eksplisit alih-alih menebak.

Dua cara untuk mengakses profil `openclaw`:

1. Minta agen membuka browser, lalu lakukan login sendiri.
2. Buka melalui CLI:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Untuk profil nondefault, letakkan `--browser-profile <name>` sebelum
subperintah (defaultnya adalah `openclaw`):

```bash
openclaw browser --browser-profile <name> open https://x.com
```

## Sandbox: izinkan akses ke browser host

Jika agen berada dalam sandbox, pemanggilan alat `browser` secara default
ditujukan ke browser sandbox, bukan host. Agar agen dapat menargetkan browser
host:

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

Pemanggilan CLI selalu menargetkan browser host, bukan sandbox, sehingga Anda
dapat membuka browser host sendiri terlepas dari pengaturan ini:

```bash
openclaw browser --browser-profile openclaw open https://x.com
```

Setelah `sandbox.browser.allowHostControl: true` diatur, pemanggilan alat
`browser` oleh agen juga dapat menargetkan host. Sebagai alternatif,
nonaktifkan sandbox untuk agen yang memposting pembaruan.

## Terkait

- [Browser](/id/tools/browser)
- [Pemecahan masalah Browser di Linux](/id/tools/browser-linux-troubleshooting)
- [Pemecahan masalah Browser WSL2](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
