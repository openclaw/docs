---
read_when:
    - Anda perlu masuk ke situs untuk otomatisasi peramban
    - Anda ingin memposting pembaruan ke X/Twitter
summary: Masuk manual untuk otomatisasi peramban + pemostingan di X/Twitter
title: Masuk melalui peramban
x-i18n:
    generated_at: "2026-05-06T09:29:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 235194fd3a49724247f98e6d7c848c4cc3317f749ff4a8918c2172b73baf21e3
    source_path: tools/browser-login.md
    workflow: 16
---

## Masuk secara manual (disarankan)

Ketika sebuah situs memerlukan login, **masuk secara manual** di profil peramban **host** (peramban openclaw).

Jangan berikan kredensial Anda kepada model. Login otomatis sering memicu pertahanan anti-bot dan dapat mengunci akun.

Kembali ke dokumentasi peramban utama: [Peramban](/id/tools/browser).

## Profil Chrome mana yang digunakan?

OpenClaw mengendalikan **profil Chrome khusus** (bernama `openclaw`, antarmuka bernuansa oranye). Ini terpisah dari profil peramban harian Anda.

Untuk panggilan alat peramban agen:

- Pilihan default: agen harus menggunakan peramban `openclaw` yang terisolasi.
- Gunakan `profile="user"` hanya ketika sesi login yang sudah ada penting dan pengguna berada di depan komputer untuk mengeklik/menyetujui prompt lampiran apa pun.
- Jika Anda memiliki beberapa profil peramban pengguna, tentukan profil secara eksplisit alih-alih menebak.

Dua cara mudah untuk mengaksesnya:

1. **Minta agen membuka peramban** lalu masuk sendiri.
2. **Buka melalui CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Jika Anda memiliki beberapa profil, berikan `--browser-profile <name>` (defaultnya adalah `openclaw`).

## X/Twitter: alur yang disarankan

- **Baca/cari/utas:** gunakan peramban **host** (login manual).
- **Posting pembaruan:** gunakan peramban **host** (login manual).

## Sandboxing + akses peramban host

Sesi peramban sandbox **lebih mungkin** memicu deteksi bot. Untuk X/Twitter (dan situs ketat lainnya), pilih peramban **host**.

Jika agen berada dalam sandbox, alat peramban default ke sandbox. Untuk mengizinkan kontrol host:

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

Lalu targetkan peramban host:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Atau nonaktifkan sandboxing untuk agen yang memposting pembaruan.

## Terkait

- [Peramban](/id/tools/browser)
- [Pemecahan masalah peramban Linux](/id/tools/browser-linux-troubleshooting)
- [Pemecahan masalah peramban WSL2](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
