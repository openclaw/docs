---
read_when:
    - Anda ingin memicu atau menjalankan TaskFlow dari sistem eksternal
    - Anda sedang mengonfigurasi plugin webhooks bawaan
summary: 'Plugin Webhooks: ingress TaskFlow terautentikasi untuk automasi eksternal tepercaya'
title: Plugin Webhook
x-i18n:
    generated_at: "2026-04-30T10:05:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70b195e330264af48a9e9c619bb5a0937bb15b2640edd3dd2b5517a13424e9fe
    source_path: plugins/webhooks.md
    workflow: 16
---

# Webhook (plugin)

Plugin Webhook menambahkan rute HTTP terautentikasi yang menghubungkan otomatisasi eksternal ke TaskFlow OpenClaw.

Gunakan ini saat Anda ingin sistem tepercaya seperti Zapier, n8n, pekerjaan CI, atau layanan internal membuat dan menjalankan TaskFlow terkelola tanpa perlu menulis plugin kustom terlebih dahulu.

## Tempat menjalankannya

Plugin Webhook berjalan di dalam proses Gateway.

Jika Gateway Anda berjalan di mesin lain, instal dan konfigurasikan plugin pada host Gateway tersebut, lalu mulai ulang Gateway.

## Konfigurasikan rute

Atur config di bawah `plugins.entries.webhooks.config`:

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

Kolom rute:

- `enabled`: opsional, default ke `true`
- `path`: opsional, default ke `/plugins/webhooks/<routeId>`
- `sessionKey`: sesi wajib yang memiliki TaskFlow terikat
- `secret`: shared secret atau SecretRef wajib
- `controllerId`: id pengontrol opsional untuk flow terkelola yang dibuat
- `description`: catatan operator opsional

Input `secret` yang didukung:

- String biasa
- SecretRef dengan `source: "env" | "file" | "exec"`

Jika rute berbasis secret tidak dapat me-resolve secret-nya saat startup, plugin akan melewati rute tersebut dan mencatat peringatan alih-alih mengekspos endpoint yang rusak.

## Model keamanan

Setiap rute dipercaya untuk bertindak dengan otoritas TaskFlow dari `sessionKey` yang dikonfigurasi.

Artinya, rute dapat memeriksa dan mengubah TaskFlow yang dimiliki oleh sesi tersebut, jadi Anda sebaiknya:

- Gunakan secret unik yang kuat per rute
- Utamakan referensi secret dibanding secret plaintext inline
- Ikat rute ke sesi tersempit yang sesuai dengan workflow
- Ekspos hanya path webhook spesifik yang Anda perlukan

Plugin menerapkan:

- Autentikasi shared-secret
- Pelindung ukuran body request dan timeout
- Pembatasan laju fixed-window
- Pembatasan request yang sedang berjalan
- Akses TaskFlow yang terikat pemilik melalui `api.runtime.tasks.managedFlows.bindSession(...)`

## Format request

Kirim request `POST` dengan:

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

Membuat TaskFlow terkelola untuk sesi terikat rute.

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

Request yang ditolak mengembalikan:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Plugin sengaja membersihkan metadata pemilik/sesi dari respons webhook.

## Dokumen terkait

- [SDK runtime Plugin](/id/plugins/sdk-runtime)
- [Ikhtisar hook dan webhook](/id/automation/hooks)
- [Webhook CLI](/id/cli/webhooks)
