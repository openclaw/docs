---
read_when:
    - Anda ingin memicu eksekusi agen dari skrip atau baris perintah
    - Anda perlu mengirimkan balasan agen ke saluran obrolan secara terprogram.
summary: Jalankan giliran agen dari CLI dan secara opsional kirimkan balasan ke saluran
title: Pengiriman agen
x-i18n:
    generated_at: "2026-07-21T12:37:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ad3da0feea102725ebb5555e0dd375ed6f3a0396d8ffd0ab916ced303201eabc
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` menjalankan satu giliran agen dari baris perintah tanpa pesan chat
masuk. Gunakan untuk alur kerja berskrip, pengujian, dan
pengiriman terprogram. Referensi lengkap flag dan perilaku:
[Referensi CLI Agen](/id/cli/agent).

## Mulai cepat

<Steps>
  <Step title="Jalankan giliran agen sederhana">
    ```bash
    openclaw agent --agent main --message "Bagaimana cuaca hari ini?"
    ```

    Mengirim pesan melalui Gateway dan mencetak balasannya.

  </Step>

  <Step title="Kirim prompt multibaris dari file">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Membaca file UTF-8 yang valid sebagai isi pesan agen.

  </Step>

  <Step title="Targetkan agen atau sesi tertentu">
    ```bash
    # Targetkan agen tertentu
    openclaw agent --agent ops --message "Ringkas log"

    # Targetkan nomor telepon (menghasilkan kunci sesi)
    openclaw agent --to +15555550123 --message "Pembaruan status"

    # Gunakan kembali sesi yang ada
    openclaw agent --session-id abc123 --message "Lanjutkan tugas"

    # Targetkan kunci sesi yang persis
    openclaw agent --session-key agent:ops:incident-42 --message "Ringkas status"
    ```

  </Step>

  <Step title="Kirim balasan ke saluran">
    ```bash
    # Kirim ke WhatsApp (saluran default)
    openclaw agent --to +15555550123 --message "Laporan siap" --deliver

    # Kirim ke Slack
    openclaw agent --agent ops --message "Buat laporan" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Flag

| Flag                        | Deskripsi                                                            |
| --------------------------- | -------------------------------------------------------------------- |
| `--message <text>`          | Pesan sebaris yang akan dikirim                                      |
| `--message-file <path>`     | Baca pesan dari file UTF-8 yang valid (maks. 4 MiB)                  |
| `--to <dest>`               | Hasilkan kunci sesi dari target (telepon, id chat)                   |
| `--session-key <key>`       | Gunakan kunci sesi eksplisit                                         |
| `--agent <id>`              | Targetkan agen yang dikonfigurasi (menggunakan sesi `main`)         |
| `--session-id <id>`         | Gunakan kembali sesi yang ada berdasarkan id                         |
| `--model <id>`              | Penggantian model untuk eksekusi ini (`provider/model` atau id model)        |
| `--local`                   | Paksa runtime tertanam lokal (lewati Gateway)                        |
| `--deliver`                 | Kirim balasan ke saluran chat                                        |
| `--channel <name>`          | Saluran pengiriman; dengan `--agent` + `--to`, juga berlaku untuk cakupan DM |
| `--reply-to <target>`       | Penggantian target pengiriman                                        |
| `--reply-channel <name>`    | Penggantian saluran pengiriman                                       |
| `--reply-account <id>`      | Penggantian id akun pengiriman                                       |
| `--thinking <level>`        | Atur tingkat pemikiran untuk profil model yang dipilih               |
| `--verbose <on\|full\|off>` | Pertahankan tingkat verbositas untuk sesi (`full` juga mencatat output alat) |
| `--timeout <seconds>`       | Ganti batas waktu agen (default 600, atau nilai konfigurasi)         |
| `--json`                    | Keluarkan JSON terstruktur                                           |

## Perilaku

- Secara default, CLI berjalan **melalui Gateway**. Tambahkan `--local` untuk memaksa
  runtime tertanam pada mesin saat ini.
- Berikan tepat salah satu dari `--message` atau `--message-file`. Pesan file mempertahankan
  konten multibaris setelah menghapus BOM UTF-8 opsional. File yang lebih besar dari
  4 MiB ditolak sebelum dikirim.
- Setelah percobaan ulang handshake sementara, batas waktu Gateway atau koneksi yang ditutup
  menyebabkan perintah gagal dengan petunjuk di stderr; CLI tidak pernah secara diam-diam menjalankan ulang giliran
  secara tertanam. Gateway mungkin masih menyelesaikan giliran yang diterima, jadi verifikasi status Gateway
  dan sesi sebelum mencoba lagi atau menjalankan ulang dengan `--local`.
- Pemilihan sesi: `--to` menghasilkan kunci sesi (target grup/saluran
  mempertahankan isolasi; chat langsung disatukan menjadi `main`). Saat `--agent`,
  `--channel`, dan `--to` digunakan bersama-sama, perutean mengikuti penerima kanonis saluran
  dan `session.dmScope`. Identitas stabil yang hanya untuk keluar menggunakan sesi
  milik penyedia yang terisolasi dari sesi utama agen.
- `--session-key` memilih kunci eksplisit. Kunci berawalan agen harus menggunakan
  `agent:<agent-id>:<session-key>`, dan `--agent` harus cocok dengan id agen tersebut saat
  keduanya diberikan. Kunci biasa non-sentinel dicakup ke `--agent` saat
  diberikan; misalnya, `--agent ops --session-key incident-42` dirutekan ke
  `agent:ops:incident-42`. Tanpa `--agent`, kunci biasa non-sentinel dicakup
  ke agen default yang dikonfigurasi. Nilai literal `global` dan `unknown` tetap
  tidak dicakup hanya ketika `--agent` tidak diberikan.
- `--reply-channel` dan `--reply-account` hanya memengaruhi pengiriman.
- Flag pemikiran dan verbositas disimpan secara persisten ke penyimpanan sesi.
- Output: teks biasa secara default, atau `--json` untuk payload terstruktur + metadata.
- Dengan `--json --deliver`, JSON menyertakan status pengiriman untuk pengiriman yang terkirim,
  dicegah, parsial, dan gagal. Lihat
  [Status pengiriman JSON](/id/cli/agent#json-delivery-status).

## Contoh

```bash
# Giliran sederhana dengan output JSON
openclaw agent --to +15555550123 --message "Telusuri log" --verbose on --json

# Giliran dengan penggantian model
openclaw agent --agent ops --model openai/gpt-5.4 --message "Ringkas log"

# Giliran dengan tingkat pemikiran
openclaw agent --session-id 1234 --message "Ringkas kotak masuk" --thinking medium

# Prompt multibaris dari file
openclaw agent --agent ops --message-file ./task.md

# Kunci sesi yang persis
openclaw agent --session-key agent:ops:incident-42 --message "Ringkas status"

# Kunci lama yang dicakup ke agen
openclaw agent --agent ops --session-key incident-42 --message "Ringkas status"

# Kirim ke saluran yang berbeda dari sesi
openclaw agent --agent ops --message "Peringatan" --deliver --reply-channel telegram --reply-to "@admin"
```

## Terkait

<CardGroup cols={2}>
  <Card title="Referensi CLI Agen" href="/id/cli/agent" icon="terminal">
    Referensi lengkap flag dan opsi `openclaw agent`.
  </Card>
  <Card title="Subagen" href="/id/tools/subagents" icon="users">
    Peluncuran subagen di latar belakang.
  </Card>
  <Card title="Sesi" href="/id/concepts/session" icon="comments">
    Cara kerja kunci sesi dan cara `--to`, `--agent`, dan `--session-id` menyelesaikannya.
  </Card>
  <Card title="Perintah garis miring" href="/id/tools/slash-commands" icon="slash">
    Katalog perintah native yang digunakan di dalam sesi agen.
  </Card>
</CardGroup>
