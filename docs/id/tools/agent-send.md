---
read_when:
    - Anda ingin memicu eksekusi agen dari skrip atau baris perintah
    - Anda perlu mengirimkan balasan agen ke saluran chat secara terprogram
summary: Jalankan putaran agen dari CLI dan secara opsional kirimkan balasan ke saluran
title: Pengiriman agen
x-i18n:
    generated_at: "2026-05-10T19:54:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2e1b05414312321e7136867bb8b998754d4a46289cc02764eb61d83f7239af1
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` menjalankan satu giliran agen dari baris perintah tanpa memerlukan
pesan chat masuk. Gunakan untuk alur kerja berskrip, pengujian, dan
pengiriman terprogram.

## Mulai cepat

<Steps>
  <Step title="Jalankan giliran agen sederhana">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Ini mengirim pesan melalui Gateway dan mencetak balasannya.

  </Step>

  <Step title="Targetkan agen atau sesi tertentu">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Kirim balasan ke kanal">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Opsi

| Opsi                          | Deskripsi                                                   |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Pesan yang akan dikirim (wajib)                             |
| `--to \<dest\>`               | Turunkan kunci sesi dari target (telepon, id chat)          |
| `--agent \<id\>`              | Targetkan agen yang dikonfigurasi (menggunakan sesi `main`) |
| `--session-id \<id\>`         | Gunakan kembali sesi yang sudah ada berdasarkan id          |
| `--local`                     | Paksa runtime tertanam lokal (lewati Gateway)               |
| `--deliver`                   | Kirim balasan ke kanal chat                                 |
| `--channel \<name\>`          | Kanal pengiriman (whatsapp, telegram, discord, slack, dll.) |
| `--reply-to \<target\>`       | Override target pengiriman                                  |
| `--reply-channel \<name\>`    | Override kanal pengiriman                                   |
| `--reply-account \<id\>`      | Override id akun pengiriman                                 |
| `--thinking \<level\>`        | Atur level berpikir untuk profil model yang dipilih         |
| `--verbose \<on\|full\|off\>` | Atur level verbose                                          |
| `--timeout \<seconds\>`       | Override batas waktu agen                                   |
| `--json`                      | Keluarkan JSON terstruktur                                  |

## Perilaku

- Secara default, CLI berjalan **melalui Gateway**. Tambahkan `--local` untuk memaksa
  runtime tertanam pada mesin saat ini.
- Jika Gateway tidak dapat dijangkau, CLI **fallback** ke eksekusi tertanam lokal.
- Pemilihan sesi: `--to` menurunkan kunci sesi (target grup/kanal
  mempertahankan isolasi; chat langsung digabungkan ke `main`).
- Flag thinking dan verbose dipertahankan ke dalam penyimpanan sesi.
- Output: teks biasa secara default, atau `--json` untuk payload + metadata terstruktur.
- Dengan `--json --deliver`, JSON menyertakan status pengiriman untuk pengiriman
  terkirim, disupresi, parsial, dan gagal. Lihat
  [Status pengiriman JSON](/id/cli/agent#json-delivery-status).

## Contoh

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Terkait

<CardGroup cols={2}>
  <Card title="Referensi CLI agen" href="/id/cli/agent" icon="terminal">
    Referensi lengkap flag dan opsi `openclaw agent`.
  </Card>
  <Card title="Sub-agen" href="/id/tools/subagents" icon="users">
    Pembuatan sub-agen latar belakang.
  </Card>
  <Card title="Sesi" href="/id/concepts/session" icon="comments">
    Cara kerja kunci sesi dan cara `--to`, `--agent`, dan `--session-id` menyelesaikannya.
  </Card>
  <Card title="Perintah slash" href="/id/tools/slash-commands" icon="slash">
    Katalog perintah native yang digunakan di dalam sesi agen.
  </Card>
</CardGroup>
