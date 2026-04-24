---
read_when:
    - Anda perlu login ke situs untuk otomatisasi browser
    - Anda ingin memposting pembaruan ke X/Twitter
summary: Login manual untuk otomatisasi browser + posting X/Twitter
title: Login browser
x-i18n:
    generated_at: "2026-04-24T09:29:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e70ae373fed861ffde0e03dfe6252b0589f7cc1946585e9b055cbed70de14b1
    source_path: tools/browser-login.md
    workflow: 15
---

# Login browser + posting X/Twitter

## Login manual (disarankan)

Saat sebuah situs memerlukan login, **login secara manual** di profil browser **host** (browser openclaw).

Jangan **berikan kredensial Anda kepada model**. Login otomatis sering memicu pertahanan anti-bot dan dapat mengunci akun.

Kembali ke dokumentasi browser utama: [Browser](/id/tools/browser).

## Profil Chrome mana yang digunakan?

OpenClaw mengontrol **profil Chrome khusus** (bernama `openclaw`, UI bernuansa oranye). Ini terpisah dari profil browser harian Anda.

Untuk pemanggilan alat browser agen:

- Pilihan default: agen harus menggunakan browser `openclaw` terisolasinya.
- Gunakan `profile="user"` hanya saat sesi login yang sudah ada penting dan pengguna berada di depan komputer untuk mengeklik/menyetujui prompt attach apa pun.
- Jika Anda memiliki beberapa profil browser pengguna, tentukan profilnya secara eksplisit alih-alih menebak.

Dua cara mudah untuk mengaksesnya:

1. **Minta agen membuka browser** lalu login sendiri.
2. **Buka melalui CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Jika Anda memiliki beberapa profil, teruskan `--browser-profile <name>` (default-nya adalah `openclaw`).

## X/Twitter: alur yang disarankan

- **Baca/cari/thread:** gunakan browser **host** (login manual).
- **Posting pembaruan:** gunakan browser **host** (login manual).

## Sandboxing + akses browser host

Sesi browser sandbox **lebih mungkin** memicu deteksi bot. Untuk X/Twitter (dan situs ketat lainnya), utamakan browser **host**.

Jika agen berada dalam sandbox, alat browser secara default menargetkan sandbox. Untuk mengizinkan kontrol host:

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

Lalu targetkan browser host:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Atau nonaktifkan sandboxing untuk agen yang memposting pembaruan.

## Terkait

- [Browser](/id/tools/browser)
- [Pemecahan masalah Browser Linux](/id/tools/browser-linux-troubleshooting)
- [Pemecahan masalah Browser WSL2](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
