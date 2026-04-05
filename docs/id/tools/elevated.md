---
read_when:
    - Menyesuaikan default mode elevated, allowlist, atau perilaku perintah slash
    - Memahami bagaimana agen yang disandbox dapat mengakses host
summary: 'Mode exec elevated: jalankan perintah di luar sandbox dari agen yang disandbox'
title: Mode Elevated
x-i18n:
    generated_at: "2026-04-05T14:07:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6f0ca0a7c03c94554a70fee775aa92085f15015850c3abaa2c1c46ced9d3c2e
    source_path: tools/elevated.md
    workflow: 15
---

# Mode Elevated

Saat agen berjalan di dalam sandbox, perintah `exec` miliknya dibatasi pada
lingkungan sandbox. **Mode elevated** memungkinkan agen keluar dari sandbox dan menjalankan perintah
di luar sandbox, dengan gerbang persetujuan yang dapat dikonfigurasi.

<Info>
  Mode elevated hanya mengubah perilaku saat agen berada dalam kondisi **disandbox**. Untuk
  agen yang tidak disandbox, `exec` sudah berjalan di host.
</Info>

## Direktif

Kontrol mode elevated per sesi dengan perintah slash:

| Direktif         | Fungsinya                                                            |
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
    Elevated harus diaktifkan di konfigurasi dan pengirim harus ada di allowlist:

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
    Kirim pesan yang hanya berisi direktif untuk menetapkan default sesi:

    ```
    /elevated full
    ```

    Atau gunakan secara inline (berlaku hanya untuk pesan itu):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Perintah dijalankan di luar sandbox">
    Saat elevated aktif, panggilan `exec` keluar dari sandbox. Host efektifnya secara default adalah
    `gateway`, atau `node` ketika target exec yang dikonfigurasi/per sesi adalah
    `node`. Dalam mode `full`, persetujuan exec dilewati. Dalam mode `on`/`ask`,
    aturan persetujuan yang dikonfigurasi tetap berlaku.
  </Step>
</Steps>

## Urutan resolusi

1. **Direktif inline** pada pesan (berlaku hanya untuk pesan itu)
2. **Override sesi** (ditetapkan dengan mengirim pesan yang hanya berisi direktif)
3. **Default global** (`agents.defaults.elevatedDefault` dalam konfigurasi)

## Ketersediaan dan allowlist

- **Gerbang global**: `tools.elevated.enabled` (harus `true`)
- **Allowlist pengirim**: `tools.elevated.allowFrom` dengan daftar per channel
- **Gerbang per agen**: `agents.list[].tools.elevated.enabled` (hanya dapat membatasi lebih lanjut)
- **Allowlist per agen**: `agents.list[].tools.elevated.allowFrom` (pengirim harus cocok dengan global + per agen)
- **Fallback Discord**: jika `tools.elevated.allowFrom.discord` dihilangkan, `channels.discord.allowFrom` digunakan sebagai fallback
- **Semua gerbang harus lolos**; jika tidak, elevated dianggap tidak tersedia

Format entri allowlist:

| Prefix                  | Cocok dengan                      |
| ----------------------- | --------------------------------- |
| (tidak ada)             | ID pengirim, E.164, atau field From |
| `name:`                 | Nama tampilan pengirim            |
| `username:`             | Username pengirim                 |
| `tag:`                  | Tag pengirim                      |
| `id:`, `from:`, `e164:` | Penargetan identitas eksplisit    |

## Yang tidak dikontrol oleh elevated

- **Kebijakan tool**: jika `exec` ditolak oleh kebijakan tool, elevated tidak dapat menimpanya
- **Kebijakan pemilihan host**: elevated tidak mengubah `auto` menjadi override lintas host bebas. Ia menggunakan aturan target exec yang dikonfigurasi/per sesi, memilih `node` hanya ketika targetnya sudah `node`.
- **Terpisah dari `/exec`**: direktif `/exec` menyesuaikan default exec per sesi untuk pengirim yang berwenang dan tidak memerlukan mode elevated

## Terkait

- [Tool exec](/tools/exec) — eksekusi perintah shell
- [Persetujuan exec](/tools/exec-approvals) — sistem persetujuan dan allowlist
- [Sandboxing](/id/gateway/sandboxing) — konfigurasi sandbox
- [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated)
