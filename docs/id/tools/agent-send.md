---
read_when:
    - Anda ingin memicu proses agen dari skrip atau baris perintah
    - Anda perlu mengirimkan balasan agen ke saluran obrolan secara terprogram
summary: Jalankan giliran agen dari CLI dan kirimkan balasan ke saluran secara opsional
title: Pengiriman agen
x-i18n:
    generated_at: "2026-07-12T14:44:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` menjalankan satu giliran agen dari baris perintah tanpa pesan obrolan masuk. Gunakan untuk alur kerja berskrip, pengujian, dan pengiriman terprogram. Referensi lengkap tanda dan perilaku:
[Referensi CLI agen](/id/cli/agent).

## Mulai cepat

<Steps>
  <Step title="Jalankan giliran agen sederhana">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Mengirim pesan melalui Gateway dan mencetak balasannya.

  </Step>

  <Step title="Kirim perintah multibaris dari berkas">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Membaca berkas UTF-8 yang valid sebagai isi pesan agen.

  </Step>

  <Step title="Tuju agen atau sesi tertentu">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"

    # Target an exact session key
    openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
    ```

  </Step>

  <Step title="Kirim balasan ke saluran">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Tanda

| Tanda                       | Deskripsi                                                                  |
| --------------------------- | -------------------------------------------------------------------------- |
| `--message <text>`          | Pesan sebaris yang akan dikirim                                            |
| `--message-file <path>`     | Baca pesan dari berkas UTF-8 yang valid                                    |
| `--to <dest>`               | Turunkan kunci sesi dari target (telepon, id obrolan)                       |
| `--session-key <key>`       | Gunakan kunci sesi eksplisit                                               |
| `--agent <id>`              | Tuju agen yang dikonfigurasi (menggunakan sesi `main`-nya)                  |
| `--session-id <id>`         | Gunakan kembali sesi yang ada berdasarkan id                               |
| `--model <id>`              | Penggantian model untuk eksekusi ini (`provider/model` atau id model)       |
| `--local`                   | Paksa runtime tersemat lokal (lewati Gateway)                               |
| `--deliver`                 | Kirim balasan ke saluran obrolan                                           |
| `--channel <name>`          | Saluran pengiriman; dengan `--agent` + `--to`, juga menerapkan cakupan DM   |
| `--reply-to <target>`       | Penggantian target pengiriman                                              |
| `--reply-channel <name>`    | Penggantian saluran pengiriman                                             |
| `--reply-account <id>`      | Penggantian id akun pengiriman                                             |
| `--thinking <level>`        | Atur tingkat pemikiran untuk profil model yang dipilih                     |
| `--verbose <on\|full\|off>` | Pertahankan tingkat verbositas untuk sesi (`full` juga mencatat keluaran alat) |
| `--timeout <seconds>`       | Ganti batas waktu agen (bawaan 600, atau nilai konfigurasi)                 |
| `--json`                    | Keluarkan JSON terstruktur                                                 |

## Perilaku

- Secara bawaan, CLI berjalan **melalui Gateway**. Tambahkan `--local` untuk memaksa runtime tersemat pada mesin saat ini.
- Teruskan tepat salah satu dari `--message` atau `--message-file`. Pesan berkas mempertahankan konten multibaris setelah menghapus BOM UTF-8 opsional.
- Jika permintaan Gateway gagal, CLI **beralih kembali** ke eksekusi tersemat lokal; batas waktu Gateway beralih kembali dengan sesi baru alih-alih berpacu dengan transkrip asli.
- Pemilihan sesi: `--to` menurunkan kunci sesi (target grup/saluran mempertahankan isolasi; obrolan langsung disatukan ke `main`). Saat `--agent`, `--channel`, dan `--to` digunakan bersama, perutean mengikuti penerima kanonis saluran dan `session.dmScope`. Identitas stabil khusus keluar menggunakan sesi milik penyedia yang diisolasi dari sesi utama agen.
- `--session-key` memilih kunci eksplisit. Kunci berawalan agen harus menggunakan `agent:<agent-id>:<session-key>`, dan `--agent` harus cocok dengan id agen tersebut saat keduanya diberikan. Kunci polos non-sentinel dicakupkan ke `--agent` jika diberikan; misalnya, `--agent ops --session-key incident-42` dirutekan ke `agent:ops:incident-42`. Tanpa `--agent`, kunci polos non-sentinel dicakupkan ke agen bawaan yang dikonfigurasi. Literal `global` dan `unknown` tetap tanpa cakupan hanya saat `--agent` tidak diberikan; jalur peralihan tersemat menyelesaikan sesi sentinel tersebut ke agen bawaan yang dikonfigurasi.
- `--reply-channel` dan `--reply-account` hanya memengaruhi pengiriman.
- Tanda pemikiran dan verbositas dipertahankan ke penyimpanan sesi.
- Keluaran: teks biasa secara bawaan, atau `--json` untuk muatan terstruktur + metadata.
- Dengan `--json --deliver`, JSON menyertakan status pengiriman untuk pengiriman yang terkirim, ditekan, parsial, dan gagal. Lihat [status pengiriman JSON](/id/cli/agent#json-delivery-status).

## Contoh

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with a model override
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Multiline prompt from a file
openclaw agent --agent ops --message-file ./task.md

# Exact session key
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"

# Legacy key scoped to an agent
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Terkait

<CardGroup cols={2}>
  <Card title="Referensi CLI agen" href="/id/cli/agent" icon="terminal">
    Referensi lengkap tanda dan opsi `openclaw agent`.
  </Card>
  <Card title="Subagen" href="/id/tools/subagents" icon="users">
    Peluncuran subagen di latar belakang.
  </Card>
  <Card title="Sesi" href="/id/concepts/session" icon="comments">
    Cara kerja kunci sesi dan cara `--to`, `--agent`, serta `--session-id` menyelesaikannya.
  </Card>
  <Card title="Perintah garis miring" href="/id/tools/slash-commands" icon="slash">
    Katalog perintah native yang digunakan di dalam sesi agen.
  </Card>
</CardGroup>
