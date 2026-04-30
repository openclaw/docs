---
read_when:
    - Anda sedang menghubungkan transport QA sintetis ke proses pengujian lokal atau CI
    - Anda memerlukan antarmuka konfigurasi qa-channel bawaan
    - Anda sedang melakukan iterasi pada otomatisasi QA end-to-end
summary: Plugin saluran kelas Slack sintetis untuk skenario QA OpenClaw deterministik
title: Saluran QA
x-i18n:
    generated_at: "2026-04-30T09:35:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1de1f52da1a14c845cf2a536ddc6f36ab52ed6364f68d9ece32ce272e2a2f96
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` adalah transport pesan sintetis bawaan untuk QA OpenClaw otomatis. Ini bukan channel produksi — ini ada untuk menguji batas Plugin channel yang sama yang digunakan oleh transport nyata sambil menjaga state tetap deterministik dan sepenuhnya dapat diinspeksi.

## Apa yang dilakukan

- Tata bahasa target kelas Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- Bus sintetis berbasis HTTP untuk injeksi pesan masuk, penangkapan transkrip keluar, pembuatan thread, reaksi, edit, hapus, serta tindakan pencarian/baca.
- Pelaksana pemeriksaan mandiri sisi host yang menulis laporan Markdown ke `.artifacts/qa-e2e/`.

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
- `pollTimeoutMs` — jendela tunggu long-poll. Bilangan bulat antara 100 dan 30000.
- `allowFrom` — daftar izinkan pengirim (id pengguna atau `"*"`).
- `defaultTo` — target fallback saat tidak ada yang diberikan.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — pembatasan alat per tindakan.

Kunci multi-akun di tingkat teratas:

- `accounts` — catatan override per akun bernama yang dikunci berdasarkan id akun.
- `defaultAccount` — id akun pilihan saat beberapa akun dikonfigurasi.

## Pelaksana

Pemeriksaan mandiri sisi host (menulis laporan Markdown di bawah `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Ini dirutekan melalui `qa-lab`, memulai bus QA dalam repo, mem-boot potongan runtime `qa-channel` bawaan, dan menjalankan pemeriksaan mandiri deterministik.

Rangkaian skenario penuh berbasis repo:

```bash
pnpm openclaw qa suite
```

Menjalankan skenario secara paralel terhadap jalur Gateway QA. Lihat [Gambaran umum QA](/id/concepts/qa-e2e-automation) untuk skenario, profil, dan mode penyedia.

Situs QA berbasis Docker (Gateway + UI debugger QA Lab dalam satu stack):

```bash
pnpm qa:lab:up
```

Membangun situs QA, memulai stack Gateway + QA Lab berbasis Docker, dan mencetak URL QA Lab. Dari sana Anda dapat memilih skenario, memilih jalur model, meluncurkan run individual, dan memantau hasil secara live. Debugger QA Lab terpisah dari bundel Control UI yang dikirimkan.

## Terkait

- [Gambaran umum QA](/id/concepts/qa-e2e-automation) — stack keseluruhan, adaptor transport, penulisan skenario
- [QA Matrix](/id/concepts/qa-matrix) — contoh pelaksana transport live yang menggerakkan channel nyata
- [Pairing](/id/channels/pairing)
- [Grup](/id/channels/groups)
- [Gambaran umum channel](/id/channels)
