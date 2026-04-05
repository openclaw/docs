---
read_when:
    - Anda ingin memicu eksekusi agen dari skrip atau baris perintah
    - Anda perlu mengirim balasan agen ke channel chat secara terprogram
summary: Jalankan turn agen dari CLI dan secara opsional kirim balasan ke channel
title: Agent Send
x-i18n:
    generated_at: "2026-04-05T14:06:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42ea2977e89fb28d2afd07e5f6b1560ad627aea8b72fde36d8e324215c710afc
    source_path: tools/agent-send.md
    workflow: 15
---

# Agent Send

`openclaw agent` menjalankan satu turn agen dari baris perintah tanpa memerlukan
pesan chat masuk. Gunakan untuk alur kerja berbasis skrip, pengujian, dan
pengiriman terprogram.

## Mulai cepat

<Steps>
  <Step title="Jalankan turn agen sederhana">
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

    # Gunakan kembali sesi yang ada
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Kirim balasan ke sebuah channel">
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
| `--agent \<id\>`              | Targetkan agen yang dikonfigurasi (menggunakan sesi `main`) |
| `--session-id \<id\>`         | Gunakan kembali sesi yang ada berdasarkan id                |
| `--local`                     | Paksa runtime embed lokal (lewati Gateway)                  |
| `--deliver`                   | Kirim balasan ke channel chat                               |
| `--channel \<name\>`          | Channel pengiriman (whatsapp, telegram, discord, slack, dll.) |
| `--reply-to \<target\>`       | Override target pengiriman                                  |
| `--reply-channel \<name\>`    | Override channel pengiriman                                 |
| `--reply-account \<id\>`      | Override id akun pengiriman                                 |
| `--thinking \<level\>`        | Setel level thinking (off, minimal, low, medium, high, xhigh) |
| `--verbose \<on\|full\|off\>` | Setel level verbose                                         |
| `--timeout \<seconds\>`       | Override timeout agen                                       |
| `--json`                      | Keluarkan JSON terstruktur                                  |

## Perilaku

- Secara default, CLI berjalan **melalui Gateway**. Tambahkan `--local` untuk memaksa
  runtime embed pada mesin saat ini.
- Jika Gateway tidak dapat dijangkau, CLI **fallback** ke eksekusi embed lokal.
- Pemilihan sesi: `--to` menurunkan session key (target grup/channel
  mempertahankan isolasi; chat langsung digabungkan ke `main`).
- Flag thinking dan verbose dipertahankan ke penyimpanan sesi.
- Output: teks biasa secara default, atau `--json` untuk payload + metadata terstruktur.

## Contoh

```bash
# Turn sederhana dengan output JSON
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn dengan level thinking
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Kirim ke channel yang berbeda dari sesi
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Terkait

- [Referensi CLI agen](/cli/agent)
- [Sub-agents](/tools/subagents) — spawning sub-agen latar belakang
- [Sessions](/id/concepts/session) — cara kerja session key
