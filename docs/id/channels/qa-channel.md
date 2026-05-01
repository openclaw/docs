---
read_when:
    - Anda sedang menghubungkan transport QA sintetis ke proses uji lokal atau CI
    - Anda memerlukan antarmuka konfigurasi qa-channel bawaan
    - Anda sedang melakukan iterasi pada otomatisasi QA ujung-ke-ujung
summary: Plugin saluran kelas Slack sintetis untuk skenario QA OpenClaw yang deterministik
title: Saluran QA
x-i18n:
    generated_at: "2026-05-01T09:22:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: efe057812de1fbc6d89d2b6d5860cd6af4648c3e86913efa3a69267c4e8c57b4
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` adalah transport pesan sintetis bawaan untuk QA OpenClaw otomatis. Ini bukan channel produksi — channel ini ada untuk menguji batas Plugin channel yang sama yang digunakan oleh transport nyata sambil menjaga state tetap deterministik dan sepenuhnya dapat diperiksa.

## Fungsinya

- Tata bahasa target kelas Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Percakapan bersama `channel:` dan `group:` ditampilkan kepada agen sebagai giliran ruang grup/channel, sehingga menguji kebijakan balasan-terlihat dan perutean message-tool yang sama yang digunakan oleh Discord, Slack, Telegram, dan transport serupa.
- Bus sintetis berbasis HTTP untuk injeksi pesan masuk, perekaman transkrip keluar, pembuatan thread, reaksi, edit, hapus, serta aksi cari/baca.
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

- `enabled` — tombol aktif/nonaktif utama untuk akun ini.
- `name` — label tampilan opsional.
- `baseUrl` — URL bus sintetis.
- `botUserId` — id pengguna bot bergaya Matrix yang digunakan dalam tata bahasa target.
- `botDisplayName` — nama tampilan untuk pesan keluar.
- `pollTimeoutMs` — jendela tunggu long-poll. Integer antara 100 dan 30000.
- `allowFrom` — allowlist pengirim (id pengguna atau `"*"`).
- `defaultTo` — target fallback ketika tidak ada yang diberikan.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — pembatasan tool per aksi.

Kunci multi-akun di level teratas:

- `accounts` — record override per akun bernama yang dikunci berdasarkan id akun.
- `defaultAccount` — id akun pilihan ketika beberapa akun dikonfigurasi.

## Runner

Pemeriksaan mandiri sisi host (menulis laporan Markdown di bawah `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Ini merutekan melalui `qa-lab`, memulai bus QA dalam repo, melakukan boot pada slice runtime `qa-channel` bawaan, dan menjalankan pemeriksaan mandiri deterministik.

Suite skenario berbasis repo lengkap:

```bash
pnpm openclaw qa suite
```

Menjalankan skenario secara paralel terhadap lane Gateway QA. Lihat [ikhtisar QA](/id/concepts/qa-e2e-automation) untuk skenario, profil, dan mode provider.

Situs QA berbasis Docker (Gateway + UI debugger QA Lab dalam satu stack):

```bash
pnpm qa:lab:up
```

Membangun situs QA, memulai stack Gateway + QA Lab berbasis Docker, dan mencetak URL QA Lab. Dari sana Anda dapat memilih skenario, memilih lane model, meluncurkan run individual, dan melihat hasil secara langsung. Debugger QA Lab terpisah dari bundel Control UI yang dikirimkan.

## Terkait

- [Ikhtisar QA](/id/concepts/qa-e2e-automation) — stack keseluruhan, adapter transport, penulisan skenario
- [QA Matrix](/id/concepts/qa-matrix) — contoh runner transport live yang menggerakkan channel nyata
- [Pemasangan](/id/channels/pairing)
- [Grup](/id/channels/groups)
- [Ikhtisar channel](/id/channels)
