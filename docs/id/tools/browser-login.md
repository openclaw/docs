---
read_when:
    - Anda perlu login ke situs untuk otomatisasi browser
    - Anda ingin memposting pembaruan ke X/Twitter
summary: Login manual untuk otomatisasi browser + posting ke X/Twitter
title: Login Browser
x-i18n:
    generated_at: "2026-04-05T14:07:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: de40685c70f1c141dba98e6dadc2c6f3a2b3b6d98c89ef8404144c9d178bb763
    source_path: tools/browser-login.md
    workflow: 15
---

# Login browser + posting ke X/Twitter

## Login manual (direkomendasikan)

Saat sebuah situs memerlukan login, **login secara manual** di profil browser **host** (browser openclaw).

Jangan **memberikan kredensial Anda kepada model**. Login otomatis sering memicu pertahanan anti-bot dan dapat mengunci akun.

Kembali ke dokumen browser utama: [Browser](/tools/browser).

## Profil Chrome mana yang digunakan?

OpenClaw mengendalikan **profil Chrome khusus** (bernama `openclaw`, UI berwarna oranye). Ini terpisah dari profil browser harian Anda.

Untuk pemanggilan tool browser oleh agen:

- Pilihan default: agen harus menggunakan browser `openclaw` terisolasinya.
- Gunakan `profile="user"` hanya saat sesi login yang sudah ada penting dan pengguna sedang berada di depan komputer untuk mengklik/menyetujui prompt attach apa pun.
- Jika Anda memiliki beberapa profil browser pengguna, tentukan profilnya secara eksplisit alih-alih menebak.

Dua cara mudah untuk mengaksesnya:

1. **Minta agen membuka browser** lalu login sendiri.
2. **Buka melalui CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Jika Anda memiliki beberapa profil, teruskan `--browser-profile <name>` (default-nya adalah `openclaw`).

## X/Twitter: alur yang direkomendasikan

- **Membaca/mencari/thread:** gunakan browser **host** (login manual).
- **Memposting pembaruan:** gunakan browser **host** (login manual).

## Sandbox + akses browser host

Sesi browser yang disandbox **lebih mungkin** memicu deteksi bot. Untuk X/Twitter (dan situs ketat lainnya), utamakan browser **host**.

Jika agen disandbox, tool browser default-nya ke sandbox. Untuk mengizinkan kontrol host:

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
