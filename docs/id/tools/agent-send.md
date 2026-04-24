---
read_when:
    - Anda ingin memicu eksekusi agen dari skrip atau command line
    - Anda perlu mengirimkan balasan agen ke channel chat secara terprogram
summary: Jalankan giliran agen dari CLI dan secara opsional kirimkan balasan ke channel
title: Kirim agen
x-i18n:
    generated_at: "2026-04-24T09:29:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f29ab906ed8179b265138ee27312c8f4b318d09b73ad61843fca6809c32bd31
    source_path: tools/agent-send.md
    workflow: 15
---

`openclaw agent` menjalankan satu giliran agen dari command line tanpa memerlukan
pesan chat masuk. Gunakan untuk alur kerja skrip, pengujian, dan
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
    # Targetkan agen tertentu
    openclaw agent --agent ops --message "Summarize logs"

    # Targetkan nomor telepon (menurunkan session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Gunakan kembali sesi yang sudah ada
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Kirim balasan ke channel">
    ```bash
    # Kirim ke WhatsApp (channel default)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Kirim ke Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Flag

| Flag                          | Deskripsi                                                   |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Pesan yang akan dikirim (wajib)                             |
| `--to \<dest\>`               | Turunkan session key dari target (telepon, id chat)         |
| `--agent \<id\>`              | Targetkan agen yang dikonfigurasi (menggunakan sesi `main` miliknya) |
| `--session-id \<id\>`         | Gunakan kembali sesi yang sudah ada berdasarkan id          |
| `--local`                     | Paksa runtime tersemat lokal (lewati Gateway)               |
| `--deliver`                   | Kirim balasan ke channel chat                               |
| `--channel \<name\>`          | Channel pengiriman (whatsapp, telegram, discord, slack, dll.) |
| `--reply-to \<target\>`       | Override target pengiriman                                  |
| `--reply-channel \<name\>`    | Override channel pengiriman                                 |
| `--reply-account \<id\>`      | Override id akun pengiriman                                 |
| `--thinking \<level\>`        | Setel tingkat thinking untuk profile model yang dipilih     |
| `--verbose \<on\|full\|off\>` | Setel tingkat verbose                                       |
| `--timeout \<seconds\>`       | Timpa timeout agen                                          |
| `--json`                      | Keluarkan JSON terstruktur                                  |

## Perilaku

- Secara default, CLI berjalan **melalui Gateway**. Tambahkan `--local` untuk memaksa
  runtime tersemat di mesin saat ini.
- Jika Gateway tidak dapat dijangkau, CLI **kembali** ke eksekusi tersemat lokal.
- Pemilihan sesi: `--to` menurunkan session key (target grup/channel
  mempertahankan isolasi; chat langsung diringkas menjadi `main`).
- Flag thinking dan verbose dipersistensikan ke session store.
- Output: teks biasa secara default, atau `--json` untuk payload + metadata terstruktur.

## Contoh

```bash
# Giliran sederhana dengan output JSON
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Giliran dengan tingkat thinking
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Kirim ke channel yang berbeda dari sesi
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Terkait

- [Referensi CLI agent](/id/cli/agent)
- [Sub-agents](/id/tools/subagents) — spawning sub-agen latar belakang
- [Sesi](/id/concepts/session) — cara kerja session key
