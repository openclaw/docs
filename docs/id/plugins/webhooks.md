---
read_when:
    - Anda ingin memicu atau mengendalikan TaskFlows dari sistem eksternal
    - Anda sedang mengonfigurasi Plugin webhooks bawaan
summary: 'Plugin Webhooks: jalur masuk TaskFlow terautentikasi untuk otomasi eksternal tepercaya'
title: Plugin Webhook
x-i18n:
    generated_at: "2026-05-06T17:58:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d21d96f680fa24d4a53c1ed5759f800d3cfdc3336789c42c15266edd8ce9e80
    source_path: plugins/webhooks.md
    workflow: 16
---

Plugin Webhooks menambahkan rute HTTP terautentikasi yang menghubungkan otomatisasi eksternal ke OpenClaw TaskFlows.

Gunakan ini saat Anda ingin sistem tepercaya seperti Zapier, n8n, job CI, atau layanan internal membuat dan mengendalikan TaskFlows terkelola tanpa perlu menulis plugin kustom terlebih dahulu.

## Tempat dijalankan

Plugin Webhooks berjalan di dalam proses Gateway.

Jika Gateway Anda berjalan di mesin lain, instal dan konfigurasikan plugin di host Gateway tersebut, lalu mulai ulang Gateway.

## Mengonfigurasi rute

Atur konfigurasi di bawah `plugins.entries.webhooks.config`:

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

Kolom rute:

- `enabled`: opsional, default ke `true`
- `path`: opsional, default ke `/plugins/webhooks/<routeId>`
- `sessionKey`: sesi wajib yang memiliki TaskFlows terikat
- `secret`: shared secret atau SecretRef wajib
- `controllerId`: id pengontrol opsional untuk alur terkelola yang dibuat
- `description`: catatan operator opsional

Input `secret` yang didukung:

- String polos
- SecretRef dengan `source: "env" | "file" | "exec"`

Jika rute berbasis secret tidak dapat menyelesaikan secret-nya saat startup, plugin akan melewati rute tersebut dan mencatat peringatan alih-alih mengekspos endpoint yang rusak.

## Model keamanan

Setiap rute dipercaya untuk bertindak dengan otoritas TaskFlow dari `sessionKey` yang dikonfigurasi.

Ini berarti rute dapat memeriksa dan mengubah TaskFlows yang dimiliki oleh sesi tersebut, jadi Anda sebaiknya:

- Gunakan secret unik yang kuat untuk setiap rute
- Utamakan referensi secret daripada secret plaintext inline
- Ikat rute ke sesi paling sempit yang sesuai dengan alur kerja
- Ekspos hanya path webhook spesifik yang Anda perlukan

Plugin menerapkan:

- Autentikasi shared-secret
- Penjaga ukuran body permintaan dan timeout
- Pembatasan laju fixed-window
- Pembatasan permintaan in-flight
- Akses TaskFlow yang terikat pemilik melalui `api.runtime.tasks.managedFlows.bindSession(...)`

## Format permintaan

Kirim permintaan `POST` dengan:

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` atau `x-openclaw-webhook-secret: <secret>`

Contoh:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Tindakan yang didukung

Plugin saat ini menerima nilai JSON `action` berikut:

- `create_flow`
- `get_flow`
- `list_flows`
- `find_latest_flow`
- `resolve_flow`
- `get_task_summary`
- `set_waiting`
- `resume_flow`
- `finish_flow`
- `fail_flow`
- `request_cancel`
- `cancel_flow`
- `run_task`

### `create_flow`

Membuat TaskFlow terkelola untuk sesi terikat milik rute.

Contoh:

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Membuat tugas turunan terkelola di dalam TaskFlow terkelola yang sudah ada.

Runtime yang diizinkan adalah:

- `subagent`
- `acp`

Contoh:

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

Respons yang berhasil mengembalikan:

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

Permintaan yang ditolak mengembalikan:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Plugin secara sengaja membersihkan metadata pemilik/sesi dari respons webhook.

## Dokumen terkait

- [Plugin runtime SDK](/id/plugins/sdk-runtime)
- [Ikhtisar hooks dan webhooks](/id/automation/hooks)
- [Webhook CLI](/id/cli/webhooks)
