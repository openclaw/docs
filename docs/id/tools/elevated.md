---
read_when:
    - Menyesuaikan default mode elevated, allowlist, atau perilaku slash command
    - Memahami cara agen yang berada di dalam sandbox dapat mengakses host
summary: 'Mode exec elevated: jalankan perintah di luar sandbox dari agen yang berada di dalam sandbox'
title: Mode elevated
x-i18n:
    generated_at: "2026-04-24T09:30:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b91b4af36f9485695f2afebe9bf8d7274d7aad6d0d88e762e581b0d091e04f7
    source_path: tools/elevated.md
    workflow: 15
---

Saat agen berjalan di dalam sandbox, perintah `exec`-nya dibatasi pada
lingkungan sandbox. **Mode elevated** memungkinkan agen keluar dari sandbox dan menjalankan perintah
di luar sandbox, dengan gate persetujuan yang dapat dikonfigurasi.

<Info>
  Mode elevated hanya mengubah perilaku saat agen berada **di dalam sandbox**. Untuk
  agen tanpa sandbox, `exec` memang sudah berjalan di host.
</Info>

## Directive

Kontrol mode elevated per sesi dengan slash command:

| Directive        | Fungsinya                                                            |
| ---------------- | -------------------------------------------------------------------- |
| `/elevated on`   | Jalankan di luar sandbox pada path host yang dikonfigurasi, tetap gunakan persetujuan |
| `/elevated ask`  | Sama seperti `on` (alias)                                            |
| `/elevated full` | Jalankan di luar sandbox pada path host yang dikonfigurasi dan lewati persetujuan |
| `/elevated off`  | Kembali ke eksekusi yang dibatasi sandbox                            |

Juga tersedia sebagai `/elev on|off|ask|full`.

Kirim `/elevated` tanpa argumen untuk melihat level saat ini.

## Cara kerjanya

<Steps>
  <Step title="Periksa ketersediaan">
    Elevated harus diaktifkan dalam config dan pengirim harus ada di allowlist:

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Tetapkan level">
    Kirim pesan yang hanya berisi directive untuk menetapkan default sesi:

    ```
    /elevated full
    ```

    Atau gunakan secara inline (berlaku hanya untuk pesan tersebut):

    ```
    /elevated on jalankan skrip deployment
    ```

  </Step>

  <Step title="Perintah dijalankan di luar sandbox">
    Dengan elevated aktif, pemanggilan `exec` keluar dari sandbox. Host efektif secara default adalah
    `gateway`, atau `node` saat target exec yang dikonfigurasi/sesi adalah
    `node`. Dalam mode `full`, persetujuan exec dilewati. Dalam mode `on`/`ask`,
    aturan persetujuan yang dikonfigurasi tetap berlaku.
  </Step>
</Steps>

## Urutan resolusi

1. **Directive inline** pada pesan (berlaku hanya untuk pesan itu)
2. **Override sesi** (ditetapkan dengan mengirim pesan yang hanya berisi directive)
3. **Default global** (`agents.defaults.elevatedDefault` dalam config)

## Ketersediaan dan allowlist

- **Gate global**: `tools.elevated.enabled` (harus `true`)
- **Allowlist pengirim**: `tools.elevated.allowFrom` dengan daftar per channel
- **Gate per agen**: `agents.list[].tools.elevated.enabled` (hanya dapat membatasi lebih lanjut)
- **Allowlist per agen**: `agents.list[].tools.elevated.allowFrom` (pengirim harus cocok dengan global + per agen)
- **Fallback Discord**: jika `tools.elevated.allowFrom.discord` dihilangkan, `channels.discord.allowFrom` digunakan sebagai fallback
- **Semua gate harus lolos**; jika tidak, elevated dianggap tidak tersedia

Format entri allowlist:

| Prefix                  | Cocok dengan                    |
| ----------------------- | ------------------------------- |
| (tidak ada)             | ID pengirim, E.164, atau field From |
| `name:`                 | Nama tampilan pengirim          |
| `username:`             | Username pengirim               |
| `tag:`                  | Tag pengirim                    |
| `id:`, `from:`, `e164:` | Target identitas eksplisit      |

## Yang tidak dikendalikan elevated

- **Kebijakan alat**: jika `exec` ditolak oleh kebijakan alat, elevated tidak dapat menimpanya
- **Kebijakan pemilihan host**: elevated tidak mengubah `auto` menjadi override lintas host yang bebas. Elevated menggunakan aturan target exec yang dikonfigurasi/sesi, memilih `node` hanya saat targetnya memang sudah `node`.
- **Terpisah dari `/exec`**: directive `/exec` menyesuaikan default exec per sesi untuk pengirim yang berwenang dan tidak memerlukan mode elevated

## Terkait

- [Alat exec](/id/tools/exec) — eksekusi perintah shell
- [Persetujuan exec](/id/tools/exec-approvals) — sistem persetujuan dan allowlist
- [Sandboxing](/id/gateway/sandboxing) — konfigurasi sandbox
- [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated)
