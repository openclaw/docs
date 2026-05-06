---
read_when:
    - Anda ingin memicu eksekusi agen dari skrip atau baris perintah
    - Anda perlu mengirimkan balasan agen ke saluran obrolan secara terprogram
summary: Jalankan giliran agen dari CLI dan secara opsional kirimkan balasan ke saluran
title: Kirim agen
x-i18n:
    generated_at: "2026-05-06T09:28:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1339ebd74e2349669942ff93f200b53a69ad05f2186d6ff76437c779f312a291
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` menjalankan satu giliran agen dari baris perintah tanpa memerlukan
pesan chat masuk. Gunakan untuk alur kerja terskrip, pengujian, dan
pengiriman terprogram.

## Mulai cepat

<Steps>
  <Step title="Run a simple agent turn">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Ini mengirim pesan melalui Gateway dan mencetak balasannya.

  </Step>

  <Step title="Target a specific agent or session">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Deliver the reply to a channel">
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
| `--message \<text\>`          | Pesan yang akan dikirim (wajib)                             |
| `--to \<dest\>`               | Turunkan kunci sesi dari target (telepon, id chat)          |
| `--agent \<id\>`              | Targetkan agen yang dikonfigurasi (menggunakan sesi `main`) |
| `--session-id \<id\>`         | Gunakan kembali sesi yang ada berdasarkan id                |
| `--local`                     | Paksa runtime tertanam lokal (lewati Gateway)               |
| `--deliver`                   | Kirim balasan ke channel chat                               |
| `--channel \<name\>`          | Channel pengiriman (whatsapp, telegram, discord, slack, dll.) |
| `--reply-to \<target\>`       | Penggantian target pengiriman                               |
| `--reply-channel \<name\>`    | Penggantian channel pengiriman                              |
| `--reply-account \<id\>`      | Penggantian id akun pengiriman                              |
| `--thinking \<level\>`        | Tetapkan level berpikir untuk profil model yang dipilih     |
| `--verbose \<on\|full\|off\>` | Tetapkan level verbose                                      |
| `--timeout \<seconds\>`       | Timpa batas waktu agen                                      |
| `--json`                      | Keluarkan JSON terstruktur                                  |

## Perilaku

- Secara default, CLI berjalan **melalui Gateway**. Tambahkan `--local` untuk memaksa
  runtime tertanam pada mesin saat ini.
- Jika Gateway tidak dapat dijangkau, CLI **beralih otomatis** ke eksekusi tertanam lokal.
- Pemilihan sesi: `--to` menurunkan kunci sesi (target grup/channel
  mempertahankan isolasi; chat langsung digabung ke `main`).
- Flag thinking dan verbose dipertahankan ke penyimpanan sesi.
- Keluaran: teks biasa secara default, atau `--json` untuk payload terstruktur + metadata.

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
  <Card title="Agent CLI reference" href="/id/cli/agent" icon="terminal">
    Referensi lengkap flag dan opsi `openclaw agent`.
  </Card>
  <Card title="Sub-agents" href="/id/tools/subagents" icon="users">
    Pemunculan sub-agen latar belakang.
  </Card>
  <Card title="Sessions" href="/id/concepts/session" icon="comments">
    Cara kerja kunci sesi dan bagaimana `--to`, `--agent`, dan `--session-id` menyelesaikannya.
  </Card>
  <Card title="Slash commands" href="/id/tools/slash-commands" icon="slash">
    Katalog perintah native yang digunakan di dalam sesi agen.
  </Card>
</CardGroup>
