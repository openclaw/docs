---
read_when:
    - Anda ingin memicu atau mengendalikan TaskFlow dari sistem eksternal
    - Anda sedang mengonfigurasi plugin Webhook bawaan
summary: 'Plugin Webhook: ingress TaskFlow terautentikasi untuk otomasi eksternal tepercaya'
title: Plugin Webhook
x-i18n:
    generated_at: "2026-04-24T09:21:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: a35074f256e0664ee73111bcb93ce1a2311dbd4db2231200a1a385e15ed5e6c4
    source_path: plugins/webhooks.md
    workflow: 15
---

# Webhook (plugin)

Plugin Webhook menambahkan rute HTTP terautentikasi yang mengikat otomasi
eksternal ke TaskFlow OpenClaw.

Gunakan ini saat Anda ingin sistem tepercaya seperti Zapier, n8n, job CI, atau
layanan internal membuat dan mengendalikan TaskFlow terkelola tanpa harus menulis plugin kustom terlebih dahulu.

## Tempat plugin ini berjalan

Plugin Webhook berjalan di dalam proses Gateway.

Jika Gateway Anda berjalan di mesin lain, instal dan konfigurasikan plugin di
host Gateway tersebut, lalu mulai ulang Gateway.

## Konfigurasikan rute

Setel config di bawah `plugins.entries.webhooks.config`:

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

Field rute:

- `enabled`: opsional, default `true`
- `path`: opsional, default `/plugins/webhooks/<routeId>`
- `sessionKey`: sesi wajib yang memiliki TaskFlow yang dibind
- `secret`: shared secret atau SecretRef yang wajib
- `controllerId`: id controller opsional untuk managed flow yang dibuat
- `description`: catatan operator opsional

Input `secret` yang didukung:

- String biasa
- SecretRef dengan `source: "env" | "file" | "exec"`

Jika rute berbasis secret tidak dapat menyelesaikan secret-nya saat startup, plugin akan melewati
rute tersebut dan mencatat peringatan alih-alih mengekspos endpoint yang rusak.

## Model keamanan

Setiap rute dipercaya untuk bertindak dengan otoritas TaskFlow dari
`sessionKey` yang dikonfigurasikan.

Ini berarti rute dapat memeriksa dan mengubah TaskFlow yang dimiliki oleh sesi tersebut, jadi
Anda sebaiknya:

- Gunakan secret unik yang kuat untuk setiap rute
- Lebih utamakan referensi secret daripada secret plaintext inline
- Ikat rute ke sesi tersempit yang sesuai dengan alur kerja
- Ekspos hanya path Webhook spesifik yang Anda perlukan

Plugin ini menerapkan:

- Autentikasi shared-secret
- Guard ukuran body permintaan dan timeout
- Rate limiting fixed-window
- Pembatasan permintaan in-flight
- Akses TaskFlow yang terikat owner melalui `api.runtime.taskFlow.bindSession(...)`

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

## Aksi yang didukung

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

Membuat TaskFlow terkelola untuk sesi yang dibind oleh rute.

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

Membuat tugas anak terkelola di dalam TaskFlow terkelola yang sudah ada.

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

Plugin ini dengan sengaja membersihkan metadata owner/session dari respons Webhook.

## Dokumen terkait

- [SDK runtime plugin](/id/plugins/sdk-runtime)
- [Ikhtisar hooks dan Webhook](/id/automation/hooks)
- [CLI Webhook](/id/cli/webhooks)
