---
read_when:
    - Anda ingin memicu atau menjalankan TaskFlow dari sistem eksternal
    - Anda sedang mengonfigurasi plugin webhook bawaan
summary: 'Plugin Webhook: jalur masuk TaskFlow terautentikasi untuk otomatisasi eksternal tepercaya'
title: Plugin Webhook
x-i18n:
    generated_at: "2026-07-12T14:35:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

Plugin Webhooks menambahkan rute HTTP terautentikasi agar sistem eksternal
tepercaya (Zapier, n8n, tugas CI, layanan internal) dapat membuat dan
mengendalikan TaskFlow OpenClaw terkelola melalui HTTP, tanpa menulis plugin
khusus.

Plugin berjalan di dalam proses Gateway. Untuk Gateway jarak jauh, instal dan
konfigurasikan plugin di host tersebut, lalu mulai ulang Gateway. Plugin
didistribusikan tanpa rute yang dikonfigurasi, sehingga tidak melakukan apa pun
hingga Anda menambahkan setidaknya satu rute.

## Mengonfigurasi rute

Tetapkan konfigurasi di bawah `plugins.entries.webhooks.config`:

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "Zapier TaskFlow bridge",
            },
          },
        },
      },
    },
  },
}
```

Bidang rute:

| Bidang         | Wajib | Bawaan                        | Catatan                                                   |
| -------------- | ----- | ----------------------------- | --------------------------------------------------------- |
| `enabled`      | tidak | `true`                        |                                                           |
| `path`         | tidak | `/plugins/webhooks/<routeId>` | Harus unik di seluruh rute.                               |
| `sessionKey`   | ya    | -                             | Sesi yang memiliki TaskFlow terikat.                      |
| `secret`       | ya    | -                             | String biasa atau SecretRef (di bawah).                   |
| `controllerId` | tidak | `webhooks/<routeId>`          | Digunakan sebagai pengontrol `create_flow` bawaan.        |
| `description`  | tidak | -                             | Hanya catatan untuk operator.                             |

`secret` menerima string biasa atau SecretRef: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`.

Setiap rute yang dikonfigurasi didaftarkan saat proses dimulai, terlepas dari
apakah rahasianya saat itu dapat diresolusikan. Rahasia yang tidak dapat
diresolusikan tidak menonaktifkan atau melewati rute tersebut—permintaan ke
rute itu gagal dalam autentikasi (`401`) hingga rahasia dapat diresolusikan.
Nilai SecretRef diresolusikan ulang pada setiap permintaan, sehingga rotasi
rahasia yang mendasarinya (variabel lingkungan, berkas, atau keluaran exec)
berlaku tanpa memulai ulang Gateway.

## Model keamanan

Setiap rute bertindak dengan wewenang TaskFlow dari `sessionKey` yang
dikonfigurasi: rute tersebut dapat memeriksa dan mengubah TaskFlow apa pun yang
dimiliki sesi itu. Akses TaskFlow selalu melalui
`api.runtime.tasks.managedFlows.bindSession(...)`, sehingga rute tidak pernah
dapat bertindak di luar sesi terikatnya. Untuk membatasi dampak:

- Gunakan rahasia yang kuat dan unik untuk setiap rute.
- Utamakan SecretRef daripada rahasia teks biasa sebaris.
- Ikat rute ke sesi dengan cakupan paling sempit yang sesuai dengan alur kerja.
- Ekspos hanya jalur Webhook spesifik yang Anda perlukan.

Urutan penanganan permintaan untuk setiap jalur: pemeriksaan metode HTTP (hanya
`POST`) dan `Content-Type: application/json`, lalu pembatasan laju berjendela
tetap (120 permintaan per jendela 60 detik untuk setiap kunci
jalur+IP-klien, hingga 4.096 kunci yang dilacak), lalu pembatasan permintaan
yang sedang berlangsung (8 permintaan bersamaan per kunci, hingga 4.096 kunci
yang dilacak), lalu autentikasi rahasia bersama, kemudian pembacaan isi JSON
dengan batas 256 KB/15 detik. Permintaan yang gagal pada pemeriksaan awal tidak
pernah mencapai pemeriksaan berikutnya.

## Format permintaan

Kirim permintaan `POST` dengan `Content-Type: application/json` dan
`Authorization: Bearer <secret>` atau
`x-openclaw-webhook-secret: <secret>`:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Tindakan yang didukung

| Tindakan           | Tujuan                                                                             |
| ------------------ | ---------------------------------------------------------------------------------- |
| `create_flow`      | Membuat TaskFlow terkelola untuk sesi rute.                                        |
| `get_flow`         | Mengambil satu TaskFlow berdasarkan id.                                            |
| `list_flows`       | Mencantumkan TaskFlow untuk sesi rute.                                              |
| `find_latest_flow` | Mengambil TaskFlow yang paling baru diperbarui.                                    |
| `resolve_flow`     | Meresolusikan TaskFlow berdasarkan token opak.                                     |
| `get_task_summary` | Mengambil ringkasan tugas untuk TaskFlow.                                          |
| `set_waiting`      | Menandai TaskFlow sebagai menunggu, dengan data status/tunggu opsional.             |
| `resume_flow`      | Melanjutkan TaskFlow yang menunggu/diblokir.                                       |
| `finish_flow`      | Menandai TaskFlow sebagai selesai.                                                 |
| `fail_flow`        | Menandai TaskFlow sebagai gagal.                                                   |
| `request_cancel`   | Meminta pembatalan kooperatif.                                                     |
| `cancel_flow`      | Membatalkan TaskFlow (dapat mengembalikan `202` jika turunannya masih aktif).      |
| `run_task`         | Membuat tugas turunan terkelola di dalam TaskFlow yang sudah ada.                  |

Tindakan yang mengubah data (`set_waiting`, `resume_flow`, `finish_flow`,
`fail_flow`, `request_cancel`) memerlukan `flowId` dan `expectedRevision` untuk
konkurensi optimistis; revisi kedaluwarsa mengembalikan
`409 revision_conflict`.

### `create_flow`

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Nilai `runtime` yang diizinkan: `subagent`, `acp`. `startedAt`, `lastEventAt`,
dan `progressSummary` hanya valid ketika `status` bernilai `"running"`;
mengirimkannya dengan status lain akan mengembalikan `400 invalid_request`.

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Bentuk respons

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Tampilan alur dan tugas tidak pernah menyertakan metadata pemilik/sesi, sehingga
respons tidak dapat membocorkan `sessionKey` yang terikat pada rute. Nilai
`code` mencakup `not_found`, `not_managed`, `revision_conflict`,
`persist_failed`, `cancel_requested`, `cancel_pending`, `terminal`,
`invalid_request`, `request_rejected`, serta kode pengganti khusus tindakan
(`mutation_rejected`, `create_rejected`, `task_not_created`,
`cancel_rejected`) ketika perubahan ditolak karena alasan yang tidak tercakup
oleh kode bernama di atas.

## Terkait

- [Hook](/id/automation/hooks) - hook internal berbasis peristiwa dibandingkan dengan jembatan TaskFlow berbasis HTTP ini
- [Webhook Gateway (konfigurasi `hooks.*`)](/id/automation/cron-jobs#webhooks) - fitur titik akhir HTTP Gateway generik yang terpisah; tidak sama dengan rute milik plugin ini
- [SDK runtime plugin](/id/plugins/sdk-runtime)
- [Webhook CLI](/id/cli/webhooks)
