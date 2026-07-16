---
read_when:
    - Anda sedang menghubungkan transport QA sintetis ke proses pengujian lokal atau CI
    - Anda memerlukan permukaan konfigurasi qa-channel bawaan
    - Anda sedang menyempurnakan otomatisasi QA menyeluruh
summary: Plugin saluran sekelas Slack sintetis untuk skenario QA OpenClaw yang deterministik
title: Kanal QA
x-i18n:
    generated_at: "2026-07-16T17:51:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a43c35e197116a6bd44b238010eb508aed23dea99ab872d10e6fc853b5f4d4a7
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` adalah transport pesan sintetis lokal repositori untuk QA OpenClaw otomatis (`extensions/qa-channel`, paket privat, dikecualikan dari instalasi yang dikemas). Ini bukan kanal produksi - transport ini dibuat untuk menguji batas Plugin kanal yang sama dengan yang digunakan oleh transport nyata, sekaligus menjaga status tetap deterministik dan sepenuhnya dapat diperiksa.

## Fungsinya

- Tata bahasa target kelas Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Percakapan `channel:` dan `group:` bersama ditampilkan kepada agen sebagai giliran ruang grup/kanal, sehingga menguji kebijakan perutean balasan terlihat dan alat pesan yang sama dengan yang digunakan oleh Discord, Slack, Telegram, serta transport serupa.
- Bus sintetis berbasis HTTP untuk injeksi pesan masuk, perekaman transkrip keluar, pembuatan utas, reaksi, pengeditan, penghapusan, serta tindakan pencarian/pembacaan.
- Runner pemeriksaan mandiri sisi host yang menulis laporan Markdown ke `.artifacts/qa-e2e/`.

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

- `enabled` - sakelar utama untuk akun ini.
- `name` - label tampilan opsional.
- `baseUrl` - URL bus sintetis. Akun dianggap telah dikonfigurasi setelah nilai ini ditetapkan.
- `botUserId` - ID pengguna bot sintetis yang digunakan dalam tata bahasa target (default: `openclaw`).
- `botDisplayName` - nama tampilan untuk pesan keluar (default: `OpenClaw QA`).
- `pollTimeoutMs` - jendela tunggu long-poll. Bilangan bulat antara 100 dan 30000 (default: 1000).
- `allowFrom` - daftar pengirim yang diizinkan (ID pengguna atau `"*"`; default: `["*"]`). DM selalu menggunakan kebijakan `open`; kebijakan grup dengan daftar izin juga menggunakan ID pengirim sintetis ini.
- `groupPolicy` - kebijakan ruang bersama: `"open"` (default), `"allowlist"`, atau
  `"disabled"`.
- `groupAllowFrom` - daftar pengirim ruang bersama yang diizinkan secara opsional. Jika dihilangkan pada
  `"allowlist"`, Kanal QA kembali menggunakan `allowFrom`.
- `groups.<room>.requireMention` - mewajibkan penyebutan bot sebelum membalas dalam
  ruang grup/kanal tertentu (default: false). `groups."*"` menetapkan nilai default;
  `tools` / `toolsBySender` per ruang menetapkan penggantian kebijakan alat.
- `defaultTo` - target fallback saat tidak ada target yang diberikan.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - pembatasan alat per tindakan.

Kunci multiakun di tingkat teratas:

- `accounts` - rekaman penggantian per akun bernama dengan kunci berupa ID akun.
- `defaultAccount` - ID akun yang diutamakan saat beberapa akun dikonfigurasi.

## Runner

Pemeriksaan mandiri sisi host (menulis laporan Markdown di bawah `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Perintah ini merutekan melalui `qa-lab`, memulai bus QA dalam repositori, melakukan boot pada bagian runtime `qa-channel`, dan menjalankan pemeriksaan mandiri deterministik.

Rangkaian skenario lengkap berbasis repositori:

```bash
pnpm openclaw qa suite
```

Menjalankan skenario secara paralel terhadap jalur gateway QA. Lihat [ikhtisar QA](/id/concepts/qa-e2e-automation) untuk skenario, profil, dan mode penyedia.

Situs QA berbasis Docker (gateway + UI debugger QA Lab dalam satu stack):

```bash
pnpm qa:lab:up
```

Membangun situs QA, memulai stack gateway berbasis Docker + QA Lab, dan mencetak URL QA Lab. Dari sana, Anda dapat memilih skenario, memilih jalur model, meluncurkan proses satu per satu, dan memantau hasil secara langsung. Debugger QA Lab terpisah dari bundel UI Kontrol yang didistribusikan.

## Terkait

- [Ikhtisar QA](/id/concepts/qa-e2e-automation) - keseluruhan stack, adaptor transport, profil Matrix, dan penulisan skenario
- [Pemasangan](/id/channels/pairing)
- [Grup](/id/channels/groups)
- [Ikhtisar kanal](/id/channels)
