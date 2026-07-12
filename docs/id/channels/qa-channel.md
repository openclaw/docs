---
read_when:
    - Anda sedang menghubungkan transport QA sintetis ke proses pengujian lokal atau CI
    - Anda memerlukan permukaan konfigurasi qa-channel bawaan
    - Anda sedang menyempurnakan otomatisasi QA menyeluruh
summary: Plugin saluran kelas Slack sintetis untuk skenario QA OpenClaw yang deterministik
title: Kanal QA
x-i18n:
    generated_at: "2026-07-12T13:57:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33af6ef31515e0cab0ee2540f48f3ffea8aba3d13915dc8cf66111599354187
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` adalah transport pesan sintetis lokal repositori untuk QA OpenClaw otomatis (`extensions/qa-channel`, paket privat, dikecualikan dari instalasi yang dikemas). Ini bukan saluran produksi—transport ini dibuat untuk menguji batas plugin saluran yang sama dengan yang digunakan oleh transport nyata, sekaligus menjaga status tetap deterministik dan dapat diperiksa sepenuhnya.

## Fungsinya

- Tata bahasa target setara Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Percakapan bersama `channel:` dan `group:` ditampilkan kepada agen sebagai giliran ruang grup/saluran, sehingga percakapan tersebut menguji kebijakan perutean balasan terlihat dan alat pesan yang sama dengan yang digunakan oleh Discord, Slack, Telegram, dan transport serupa.
- Bus sintetis berbasis HTTP untuk injeksi pesan masuk, perekaman transkrip keluar, pembuatan utas, reaksi, pengeditan, penghapusan, serta tindakan pencarian/pembacaan.
- Penjalankan pemeriksaan mandiri sisi host yang menulis laporan Markdown ke `.artifacts/qa-e2e/`.

## Konfigurasi

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

Kunci akun:

- `enabled`—sakelar utama untuk akun ini.
- `name`—label tampilan opsional.
- `baseUrl`—URL bus sintetis. Akun dianggap telah dikonfigurasi setelah nilai ini ditetapkan.
- `botUserId`—ID pengguna bot sintetis yang digunakan dalam tata bahasa target (bawaan: `openclaw`).
- `botDisplayName`—nama tampilan untuk pesan keluar (bawaan: `OpenClaw QA`).
- `pollTimeoutMs`—jendela tunggu polling panjang. Bilangan bulat antara 100 dan 30000 (bawaan: 1000).
- `allowFrom`—daftar pengirim yang diizinkan (ID pengguna atau `"*"`; bawaan: `["*"]`). DM
  selalu menggunakan kebijakan `open`; kebijakan grup dengan daftar izin juga menggunakan ID
  pengirim sintetis ini.
- `groupPolicy`—kebijakan ruang bersama: `"open"` (bawaan), `"allowlist"`, atau
  `"disabled"`.
- `groupAllowFrom`—daftar opsional pengirim ruang bersama yang diizinkan. Jika dihilangkan saat
  menggunakan `"allowlist"`, QA Channel kembali menggunakan `allowFrom`.
- `groups.<room>.requireMention`—mewajibkan penyebutan bot sebelum membalas di
  ruang grup/saluran tertentu (bawaan: false). `groups."*"` menetapkan nilai bawaan;
  `tools` / `toolsBySender` per ruang menetapkan penggantian kebijakan alat.
- `defaultTo`—target cadangan ketika tidak ada target yang diberikan.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads`—pembatasan alat per tindakan.

Kunci multiakun pada tingkat teratas:

- `accounts`—rekaman penggantian per akun bernama yang dikunci berdasarkan ID akun.
- `defaultAccount`—ID akun pilihan ketika beberapa akun dikonfigurasi.

## Penjalankan

Pemeriksaan mandiri sisi host (menulis laporan Markdown di bawah `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Perintah ini merutekan melalui `qa-lab`, memulai bus QA dalam repositori, menjalankan bagian runtime `qa-channel`, dan menjalankan pemeriksaan mandiri deterministik.

Paket lengkap skenario berbasis repositori:

```bash
pnpm openclaw qa suite
```

Menjalankan skenario secara paralel terhadap jalur Gateway QA. Lihat [ikhtisar QA](/id/concepts/qa-e2e-automation) untuk skenario, profil, dan mode penyedia.

Situs QA berbasis Docker (Gateway + UI pengawakutu QA Lab dalam satu tumpukan):

```bash
pnpm qa:lab:up
```

Membangun situs QA, memulai tumpukan Gateway berbasis Docker + QA Lab, dan mencetak URL QA Lab. Dari sana, Anda dapat memilih skenario, memilih jalur model, meluncurkan proses individual, dan mengamati hasil secara langsung. Pengawakutu QA Lab terpisah dari bundel Control UI yang didistribusikan.

## Terkait

- [Ikhtisar QA](/id/concepts/qa-e2e-automation)—keseluruhan tumpukan, adaptor transport, penulisan skenario
- [QA Matriks](/id/concepts/qa-matrix)—contoh penjalankan transport langsung yang mengendalikan saluran nyata
- [Pemasangan](/id/channels/pairing)
- [Grup](/id/channels/groups)
- [Ikhtisar saluran](/id/channels)
