---
read_when:
    - Menyesuaikan nilai bawaan mode dengan hak istimewa, daftar izin, atau perilaku perintah garis miring
    - Memahami cara agen dalam lingkungan terisolasi dapat mengakses mesin inang
summary: 'Mode eksekusi dengan hak lebih tinggi: jalankan perintah di luar sandbox dari agen yang berjalan dalam sandbox'
title: Mode dengan hak istimewa tinggi
x-i18n:
    generated_at: "2026-05-06T09:29:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91aab7c105643d8e5d07d89cd5ab176f0a40cd3d23e2b20b3986cbf76f575d64
    source_path: tools/elevated.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Saat agen berjalan di dalam lingkungan terisolasi, perintah `exec`-nya dibatasi pada
lingkungan terisolasi tersebut. **Mode elevated** memungkinkan agen keluar dan menjalankan perintah
di luar lingkungan terisolasi, dengan gerbang persetujuan yang dapat dikonfigurasi.

<Info>
  Mode elevated hanya mengubah perilaku saat agen **berada dalam sandbox**. Untuk
  agen tanpa sandbox, exec sudah berjalan di host.
</Info>

## Direktif

Kendalikan mode elevated per sesi dengan perintah slash:

| Direktif         | Fungsinya                                                              |
| ---------------- | ---------------------------------------------------------------------- |
| `/elevated on`   | Jalankan di luar sandbox pada jalur host yang dikonfigurasi, pertahankan persetujuan |
| `/elevated ask`  | Sama seperti `on` (alias)                                              |
| `/elevated full` | Jalankan di luar sandbox pada jalur host yang dikonfigurasi dan lewati persetujuan |
| `/elevated off`  | Kembali ke eksekusi yang dibatasi sandbox                              |

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

  <Step title="Atur level">
    Kirim pesan yang hanya berisi direktif untuk mengatur default sesi:

    ```
    /elevated full
    ```

    Atau gunakan secara inline (hanya berlaku untuk pesan tersebut):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Perintah berjalan di luar sandbox">
    Dengan elevated aktif, panggilan `exec` keluar dari sandbox. Host efektif adalah
    `gateway` secara default, atau `node` saat target exec yang dikonfigurasi/sesi adalah
    `node`. Dalam mode `full`, persetujuan exec dilewati. Dalam mode `on`/`ask`,
    aturan persetujuan yang dikonfigurasi tetap berlaku.
  </Step>
</Steps>

## Urutan resolusi

1. **Direktif inline** pada pesan (hanya berlaku untuk pesan tersebut)
2. **Override sesi** (diatur dengan mengirim pesan yang hanya berisi direktif)
3. **Default global** (`agents.defaults.elevatedDefault` di konfigurasi)

## Ketersediaan dan allowlist

- **Gerbang global**: `tools.elevated.enabled` (harus `true`)
- **Allowlist pengirim**: `tools.elevated.allowFrom` dengan daftar per kanal
- **Gerbang per agen**: `agents.list[].tools.elevated.enabled` (hanya dapat semakin membatasi)
- **Allowlist per agen**: `agents.list[].tools.elevated.allowFrom` (pengirim harus cocok dengan global + per agen)
- **Fallback Discord**: jika `tools.elevated.allowFrom.discord` dihilangkan, `channels.discord.allowFrom` digunakan sebagai fallback
- **Semua gerbang harus lolos**; jika tidak, elevated dianggap tidak tersedia

Format entri allowlist:

| Prefiks                 | Cocok dengan                    |
| ----------------------- | ------------------------------- |
| (tidak ada)             | ID pengirim, E.164, atau kolom From |
| `name:`                 | Nama tampilan pengirim          |
| `username:`             | Nama pengguna pengirim          |
| `tag:`                  | Tag pengirim                    |
| `id:`, `from:`, `e164:` | Penargetan identitas eksplisit  |

## Yang tidak dikendalikan elevated

- **Kebijakan tool**: jika `exec` ditolak oleh kebijakan tool, elevated tidak dapat menimpanya.
- **Kebijakan pemilihan host**: elevated tidak mengubah `auto` menjadi override lintas-host bebas. Elevated menggunakan aturan target exec yang dikonfigurasi/sesi, memilih `node` hanya saat target sudah `node`.
- **Terpisah dari `/exec`**: direktif `/exec` menyesuaikan default exec per sesi untuk pengirim resmi dan tidak memerlukan mode elevated.

<Note>
  Perintah chat bash (prefiks `!`; alias `/bash`) adalah gerbang terpisah yang mengharuskan `tools.elevated` diaktifkan selain flag `tools.bash.enabled` miliknya sendiri. Menonaktifkan elevated juga mengunci perintah shell `!`.
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Tool exec" href="/id/tools/exec" icon="terminal">
    Eksekusi perintah shell dari agen.
  </Card>
  <Card title="Persetujuan exec" href="/id/tools/exec-approvals" icon="shield">
    Sistem persetujuan dan allowlist untuk `exec`.
  </Card>
  <Card title="Sandboxing" href="/id/gateway/sandboxing" icon="box">
    Konfigurasi sandbox tingkat Gateway.
  </Card>
  <Card title="Sandbox vs Tool Policy vs Elevated" href="/id/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    Cara ketiga gerbang tersusun selama panggilan tool.
  </Card>
</CardGroup>
