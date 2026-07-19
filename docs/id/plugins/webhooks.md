---
read_when:
    - Anda ingin memicu atau menjalankan TaskFlow dari sistem eksternal
    - Anda sedang mengonfigurasi plugin webhook bawaan
summary: 'Plugin Webhooks: masukan TaskFlow terautentikasi untuk automasi eksternal tepercaya'
title: Plugin Webhook
x-i18n:
    generated_at: "2026-07-19T05:07:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77e455450d6183635c76a1e8002feeb287deb4ff242dbd555ef9d0f2b21ce5f6
    source_path: plugins/webhooks.md
    workflow: 16
---

Plugin Webhooks menambahkan rute HTTP terautentikasi agar sistem eksternal
tepercaya (Zapier, n8n, tugas CI, layanan internal) dapat membuat dan mengendalikan
TaskFlow OpenClaw terkelola melalui HTTP, tanpa menulis plugin khusus.

Plugin berjalan di dalam proses Gateway. Untuk Gateway jarak jauh, instal dan
konfigurasikan plugin di host tersebut, lalu mulai ulang Gateway. Plugin dikirim tanpa
rute yang dikonfigurasi, sehingga tidak melakukan apa pun sampai Anda menambahkan setidaknya satu rute.

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
              description: "Jembatan TaskFlow Zapier",
            },
          },
        },
      },
    },
  },
}
```

Bidang rute:

| Bidang         | Wajib    | Bawaan                        | Catatan                                       |
| -------------- | -------- | ----------------------------- | --------------------------------------------- |
| `enabled`      | tidak    | `true`                        |                                               |
| `path`         | tidak    | `/plugins/webhooks/<routeId>` | Harus unik di seluruh rute.                   |
| `sessionKey`   | ya       | -                             | Sesi yang memiliki TaskFlow terikat.          |
| `secret`       | ya       | -                             | String biasa atau SecretRef (di bawah).       |
| `controllerId` | tidak    | `webhooks/<routeId>`          | Digunakan sebagai pengontrol `create_flow` bawaan. |
| `description`  | tidak    | -                             | Hanya catatan operator.                       |

`secret` menerima string biasa atau SecretRef: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`.

SecretRef diresolusi ke dalam snapshot konfigurasi awal Gateway. Ketika rahasia
salah satu rute tidak dapat diresolusi, Gateway tetap berjalan dan rute tersebut tetap
terdaftar tetapi dingin: permintaan menerima kegagalan autentikasi umum (`401`).
Rute lain tetap tersedia. Perbaiki sumber SecretRef, lalu muat ulang atau mulai ulang
Gateway untuk mengaktifkan snapshot baru. Nilai SecretRef tidak pernah diresolusi
pada jalur permintaan publik.

## Model keamanan

Setiap rute bertindak dengan otoritas TaskFlow dari `sessionKey` yang dikonfigurasi:
rute dapat memeriksa dan mengubah TaskFlow apa pun yang dimiliki sesi tersebut. Akses TaskFlow
selalu melalui `api.runtime.tasks.managedFlows.bindSession(...)`, sehingga
rute tidak pernah dapat bertindak di luar sesi terikatnya. Untuk membatasi dampak:

- Gunakan rahasia yang kuat dan unik untuk setiap rute.
- Utamakan SecretRef daripada rahasia teks biasa sebaris.
- Ikat rute ke sesi tersempit yang sesuai dengan alur kerja.
- Ekspos hanya jalur webhook spesifik yang Anda perlukan.

Urutan penanganan permintaan untuk setiap jalur: pemeriksaan metode HTTP (hanya `POST`)
dan `Content-Type: application/json`, lalu pembatasan laju berjendela tetap (120
permintaan per jendela 60 detik untuk setiap kunci jalur+IP-klien, hingga 4.096
kunci terlacak), lalu pembatasan permintaan yang sedang diproses (8 permintaan serentak per kunci, hingga
4.096 kunci terlacak), lalu autentikasi rahasia bersama, kemudian pembacaan isi JSON berukuran 256 KB /
15 detik. Permintaan yang gagal pada pemeriksaan sebelumnya tidak pernah mencapai
pemeriksaan berikutnya.

## Format permintaan

Kirim permintaan `POST` dengan `Content-Type: application/json` dan salah satu dari
`Authorization: Bearer <secret>` atau `x-openclaw-webhook-secret: <secret>`:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Tinjau antrean masuk"}'
```

## Tindakan yang didukung

| Tindakan           | Tujuan                                                             |
| ------------------ | ------------------------------------------------------------------ |
| `create_flow`      | Membuat TaskFlow terkelola untuk sesi rute.                        |
| `get_flow`         | Mengambil satu TaskFlow berdasarkan id.                            |
| `list_flows`       | Mencantumkan TaskFlow untuk sesi rute.                             |
| `find_latest_flow` | Mengambil TaskFlow yang paling baru diperbarui.                    |
| `resolve_flow`     | Menemukan TaskFlow berdasarkan token opak.                         |
| `get_task_summary` | Mengambil ringkasan tugas untuk suatu TaskFlow.                    |
| `set_waiting`      | Menandai TaskFlow sebagai menunggu, dengan data status/tunggu opsional. |
| `resume_flow`      | Melanjutkan TaskFlow yang menunggu/terblokir.                      |
| `finish_flow`      | Menandai TaskFlow sebagai selesai.                                 |
| `fail_flow`        | Menandai TaskFlow sebagai gagal.                                   |
| `request_cancel`   | Meminta pembatalan kooperatif.                                     |
| `cancel_flow`      | Membatalkan TaskFlow (dapat mengembalikan `202` jika tugas anak masih aktif). |
| `run_task`         | Membuat tugas anak terkelola di dalam TaskFlow yang ada.           |

Tindakan yang mengubah data (`set_waiting`, `resume_flow`, `finish_flow`, `fail_flow`,
`request_cancel`) memerlukan `flowId` dan `expectedRevision` untuk konkurensi
optimistis; revisi kedaluwarsa mengembalikan `409 revision_conflict`.

### `create_flow`

```json
{
  "action": "create_flow",
  "goal": "Tinjau antrean masuk",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Nilai `runtime` yang diizinkan: `subagent`, `acp`. `startedAt`, `lastEventAt`, dan
`progressSummary` hanya valid ketika `status` adalah `"running"`; mengirimkannya
dengan status lain akan mengembalikan `400 invalid_request`.

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Periksa kumpulan pesan berikutnya"
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
  "error": "TaskFlow tidak ditemukan.",
  "result": {}
}
```

Tampilan alur dan tugas tidak pernah menyertakan metadata pemilik/sesi, sehingga respons tidak dapat
membocorkan `sessionKey` yang terikat ke rute. Nilai `code` mencakup `not_found`,
`not_managed`, `revision_conflict`, `persist_failed`, `cancel_requested`,
`cancel_pending`, `terminal`, `invalid_request`, `request_rejected`, dan
kode cadangan khusus tindakan (`mutation_rejected`, `create_rejected`,
`task_not_created`, `cancel_rejected`) ketika perubahan ditolak karena
alasan yang tidak dicakup oleh kode bernama di atas.

## Terkait

- [Hook](/id/automation/hooks) - hook internal berbasis peristiwa dibandingkan dengan jembatan TaskFlow berbasis HTTP ini
- [Webhook Gateway (konfigurasi `hooks.*`)](/id/automation/cron-jobs#webhooks) - fitur endpoint HTTP Gateway generik yang terpisah; tidak sama dengan rute plugin ini
- [SDK runtime plugin](/id/plugins/sdk-runtime)
- [Webhook CLI](/id/cli/webhooks)
