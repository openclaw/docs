---
read_when:
    - Anda sedang mengintegrasikan transport QA sintetis ke dalam proses pengujian lokal atau CI
    - Anda memerlukan permukaan konfigurasi qa-channel bawaan
    - Anda sedang melakukan iterasi pada otomatisasi QA ujung ke ujung
summary: Plugin saluran kelas Slack sintetis untuk skenario QA OpenClaw yang deterministik
title: Saluran QA
x-i18n:
    generated_at: "2026-05-06T09:03:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1990b64d8a3ed158b11fc08742f774c5355ee25b68402ec447b92316109ac2f2
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` adalah transport pesan sintetis bawaan untuk QA OpenClaw otomatis. Ini bukan channel produksi - ini ada untuk menguji batas Plugin channel yang sama yang digunakan oleh transport nyata sambil menjaga state tetap deterministik dan sepenuhnya dapat diinspeksi.

## Apa yang dilakukan

- Tata bahasa target setara Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Percakapan bersama `channel:` dan `group:` ditampilkan kepada agen sebagai giliran ruang grup/channel, sehingga percakapan tersebut menguji kebijakan routing balasan-terlihat dan alat-pesan yang sama yang digunakan oleh Discord, Slack, Telegram, dan transport serupa.
- Bus sintetis berbasis HTTP untuk injeksi pesan masuk, penangkapan transkrip keluar, pembuatan thread, reaksi, edit, hapus, serta tindakan pencarian/baca.
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

- `enabled` - toggle utama untuk akun ini.
- `name` - label tampilan opsional.
- `baseUrl` - URL bus sintetis.
- `botUserId` - id pengguna bot bergaya Matrix yang digunakan dalam tata bahasa target.
- `botDisplayName` - nama tampilan untuk pesan keluar.
- `pollTimeoutMs` - jendela tunggu long-poll. Bilangan bulat antara 100 dan 30000.
- `allowFrom` - allowlist pengirim (id pengguna atau `"*"`).
- `defaultTo` - target fallback saat tidak ada yang disediakan.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - gating alat per tindakan.

Kunci multi-akun di level teratas:

- `accounts` - rekaman override per akun bernama yang dikunci berdasarkan id akun.
- `defaultAccount` - id akun pilihan saat beberapa akun dikonfigurasi.

## Runner

Pemeriksaan mandiri sisi host (menulis laporan Markdown di bawah `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Ini dirutekan melalui `qa-lab`, memulai bus QA dalam repo, mem-boot slice runtime `qa-channel` bawaan, dan menjalankan pemeriksaan mandiri deterministik.

Suite skenario penuh berbasis repo:

```bash
pnpm openclaw qa suite
```

Menjalankan skenario secara paralel terhadap lane Gateway QA. Lihat [Ikhtisar QA](/id/concepts/qa-e2e-automation) untuk skenario, profil, dan mode penyedia.

Situs QA berbasis Docker (Gateway + UI debugger QA Lab dalam satu stack):

```bash
pnpm qa:lab:up
```

Membangun situs QA, memulai stack Gateway + QA Lab berbasis Docker, dan mencetak URL QA Lab. Dari sana Anda dapat memilih skenario, memilih lane model, meluncurkan run individual, dan menonton hasil secara live. Debugger QA Lab terpisah dari bundle Control UI yang dikirimkan.

## Terkait

- [Ikhtisar QA](/id/concepts/qa-e2e-automation) - stack keseluruhan, adaptor transport, penulisan skenario
- [QA Matrix](/id/concepts/qa-matrix) - contoh runner transport live yang menjalankan channel nyata
- [Pairing](/id/channels/pairing)
- [Grup](/id/channels/groups)
- [Ikhtisar channel](/id/channels)
