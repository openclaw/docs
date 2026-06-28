---
read_when:
    - Anda perlu masuk ke situs untuk otomatisasi peramban
    - Anda ingin memposting pembaruan ke X/Twitter
summary: Login manual untuk otomasi browser + pemostingan X/Twitter
title: Masuk melalui peramban
x-i18n:
    generated_at: "2026-05-11T20:35:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89501b47611a39df5a658ed7e144b7c16a07188dfa52544b56cbfc6e296e2ecc
    source_path: tools/browser-login.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Login manual (direkomendasikan)

Ketika sebuah situs memerlukan login, **masuk secara manual** di profil browser **host** (browser openclaw).

Jangan **pernah** memberikan kredensial Anda kepada model. Login otomatis sering memicu pertahanan anti-bot dan dapat mengunci akun.

Kembali ke dokumentasi browser utama: [Browser](/id/tools/browser).

## Profil Chrome mana yang digunakan?

OpenClaw mengendalikan **profil Chrome khusus** (bernama `openclaw`, UI berwarna jingga). Ini terpisah dari profil browser harian Anda.

Untuk panggilan tool browser agen:

- Pilihan default: agen harus menggunakan browser `openclaw` terisolasinya.
- Gunakan `profile="user"` hanya ketika sesi login yang sudah ada penting dan pengguna berada di depan komputer untuk mengklik/menyetujui prompt lampiran apa pun.
- Jika Anda memiliki beberapa profil browser pengguna, tentukan profil secara eksplisit alih-alih menebak.

Dua cara mudah untuk mengaksesnya:

1. **Minta agen membuka browser** lalu login sendiri.
2. **Buka melalui CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Jika Anda memiliki beberapa profil, berikan `--browser-profile <name>` (default-nya adalah `openclaw`).

## X/Twitter: alur yang direkomendasikan

- **Baca/cari/thread:** gunakan browser **host** (login manual).
- **Posting pembaruan:** gunakan browser **host** (login manual).

## Sandboxing + akses browser host

Sesi browser tersandbox **lebih mungkin** memicu deteksi bot. Untuk X/Twitter (dan situs ketat lainnya), pilih browser **host**.

Jika agen tersandbox, tool browser default ke sandbox. Untuk mengizinkan kontrol host:

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

Lalu buka browser host sendiri (pemanggilan CLI selalu berjalan terhadap browser host):

```bash
openclaw browser open https://x.com --browser-profile openclaw
```

Panggilan tool `browser` agen kemudian dapat menargetkan host setelah `sandbox.browser.allowHostControl: true` ditetapkan. Sebagai alternatif, nonaktifkan sandboxing untuk agen yang memposting pembaruan.

## Terkait

- [Browser](/id/tools/browser)
- [Pemecahan masalah Browser Linux](/id/tools/browser-linux-troubleshooting)
- [Pemecahan masalah Browser WSL2](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
