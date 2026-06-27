---
read_when:
    - Anda ingin memicu eksekusi agen dari skrip atau baris perintah
    - Anda perlu mengirim balasan agen ke saluran chat secara terprogram
summary: Jalankan giliran agen dari CLI dan secara opsional kirim balasan ke saluran
title: Pengiriman agen
x-i18n:
    generated_at: "2026-06-27T18:15:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25026258a5a47c87fbf99689de5ea16d827b11af07bc5ce4f6c3e2bda6466b46
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
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Ini mengirim pesan melalui Gateway dan mencetak balasannya.

  </Step>

  <Step title="Kirim prompt multibaris dari file">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Ini membaca file UTF-8 yang valid sebagai isi pesan agen.

  </Step>

  <Step title="Targetkan agen atau sesi tertentu">
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

  <Step title="Kirimkan balasan ke channel">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Flag

| Flag                          | Deskripsi                                                   |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Pesan inline untuk dikirim                                  |
| `--message-file \<path\>`     | Baca pesan dari file UTF-8 yang valid                       |
| `--to \<dest\>`               | Turunkan kunci sesi dari target (telepon, id chat)          |
| `--session-key \<key\>`       | Gunakan kunci sesi eksplisit                                |
| `--agent \<id\>`              | Targetkan agen yang dikonfigurasi (menggunakan sesi `main`) |
| `--session-id \<id\>`         | Gunakan kembali sesi yang ada berdasarkan id                |
| `--local`                     | Paksa runtime tertanam lokal (lewati Gateway)               |
| `--deliver`                   | Kirim balasan ke channel chat                               |
| `--channel \<name\>`          | Channel pengiriman (whatsapp, telegram, discord, slack, dll.) |
| `--reply-to \<target\>`       | Override target pengiriman                                  |
| `--reply-channel \<name\>`    | Override channel pengiriman                                 |
| `--reply-account \<id\>`      | Override id akun pengiriman                                 |
| `--thinking \<level\>`        | Atur tingkat berpikir untuk profil model yang dipilih       |
| `--verbose \<on\|full\|off\>` | Atur tingkat verbose                                        |
| `--timeout \<seconds\>`       | Override timeout agen                                       |
| `--json`                      | Keluarkan JSON terstruktur                                  |

## Perilaku

- Secara default, CLI berjalan **melalui Gateway**. Tambahkan `--local` untuk memaksa
  runtime tertanam di mesin saat ini.
- Berikan tepat salah satu dari `--message` atau `--message-file`. Pesan file mempertahankan
  konten multibaris setelah menghapus BOM UTF-8 opsional.
- Jika Gateway tidak dapat dijangkau, CLI **fallback** ke eksekusi tertanam lokal.
- Pemilihan sesi: `--to` menurunkan kunci sesi (target grup/channel
  mempertahankan isolasi; chat langsung diciutkan ke `main`).
- `--session-key` memilih kunci eksplisit. Kunci berprefiks agen harus menggunakan
  `agent:<agent-id>:<session-key>`, dan `--agent` harus cocok dengan id agen tersebut saat
  keduanya diberikan. Kunci non-sentinel polos dicakup ke `--agent` saat
  diberikan; misalnya, `--agent ops --session-key incident-42` dirutekan ke
  `agent:ops:incident-42`. Tanpa `--agent`, kunci non-sentinel polos dicakup
  ke agen default yang dikonfigurasi. Literal `global` dan `unknown` tetap
  tidak tercakup hanya ketika tidak ada `--agent` yang diberikan; dalam kasus tersebut, fallback tertanam
  dan kepemilikan store menggunakan agen default yang dikonfigurasi.
- Flag thinking dan verbose dipertahankan ke dalam store sesi.
- Output: teks polos secara default, atau `--json` untuk payload + metadata terstruktur.
- Dengan `--json --deliver`, JSON menyertakan status pengiriman untuk pengiriman yang terkirim,
  ditekan, parsial, dan gagal. Lihat
  [Status pengiriman JSON](/id/cli/agent#json-delivery-status).

## Contoh

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

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
    Referensi lengkap flag dan opsi `openclaw agent`.
  </Card>
  <Card title="Sub-agen" href="/id/tools/subagents" icon="users">
    Peluncuran sub-agen latar belakang.
  </Card>
  <Card title="Sesi" href="/id/concepts/session" icon="comments">
    Cara kerja kunci sesi dan cara `--to`, `--agent`, dan `--session-id` menyelesaikannya.
  </Card>
  <Card title="Perintah slash" href="/id/tools/slash-commands" icon="slash">
    Katalog perintah native yang digunakan di dalam sesi agen.
  </Card>
</CardGroup>
