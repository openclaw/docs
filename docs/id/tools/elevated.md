---
read_when:
    - Menyesuaikan nilai default mode dengan hak istimewa, daftar yang diizinkan, atau perilaku perintah garis miring
    - Memahami cara agen yang terisolasi dapat mengakses host
summary: 'Mode eksekusi dengan hak istimewa: jalankan perintah di luar sandbox dari agen yang berada dalam sandbox'
title: Mode dengan hak akses tinggi
x-i18n:
    generated_at: "2026-07-12T14:43:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab035f2f0d0074da4e7661d9d690d89aa5eea25b7920ce48a2a03dffccded85b
    source_path: tools/elevated.md
    workflow: 16
---

Saat agen berjalan di dalam sandbox, perintah `exec`-nya dibatasi pada lingkungan sandbox. **Mode dengan hak istimewa lebih tinggi** memungkinkan agen keluar dan menjalankan perintah di luar sandbox, dengan gerbang persetujuan yang dapat dikonfigurasi.

<Info>
  Mode dengan hak istimewa lebih tinggi hanya mengubah perilaku saat agen berada dalam **sandbox**. Untuk agen tanpa sandbox, exec sudah berjalan pada host.
</Info>

## Direktif

Kendalikan mode dengan hak istimewa lebih tinggi per sesi menggunakan perintah garis miring:

| Direktif         | Fungsinya                                                                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/elevated on`   | Jalankan di luar sandbox pada jalur host yang dikonfigurasi, tetap gunakan persetujuan                                                                                |
| `/elevated ask`  | Sama seperti `on` (alias)                                                                                                                                             |
| `/elevated full` | Jalankan di luar sandbox pada jalur host yang dikonfigurasi dan lewati persetujuan jika kebijakan persetujuan mode/host sudah mengizinkan sepenuhnya                   |
| `/elevated off`  | Kembali ke eksekusi yang dibatasi sandbox                                                                                                                             |

Juga tersedia sebagai `/elev on|off|ask|full`.

Kirim `/elevated` tanpa argumen untuk melihat tingkat saat ini.

## Cara kerjanya

<Steps>
  <Step title="Periksa ketersediaan">
    Mode dengan hak istimewa lebih tinggi harus diaktifkan dalam konfigurasi dan pengirim harus berada dalam daftar izin:

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

  <Step title="Atur tingkat">
    Kirim pesan yang hanya berisi direktif untuk mengatur nilai bawaan sesi:

    ```
    /elevated full
    ```

    Atau gunakan secara sebaris (hanya berlaku untuk pesan tersebut):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Perintah dijalankan di luar sandbox">
    Saat mode dengan hak istimewa lebih tinggi aktif, panggilan `exec` keluar dari sandbox. Host efektif secara bawaan adalah
    `gateway`, atau `node` jika target exec yang dikonfigurasi/ditetapkan untuk sesi adalah
    `node`. Dalam mode `full`, persetujuan exec dilewati jika kebijakan persetujuan mode/host exec yang ditetapkan
    sudah sepenuhnya permisif (keamanan `full`,
    ask `off`); jika tidak, kebijakan persetujuan normal tetap berlaku. Dalam mode
    `on`/`ask`, aturan persetujuan yang dikonfigurasi selalu berlaku.
  </Step>
</Steps>

## Urutan resolusi

1. **Direktif sebaris** pada pesan (hanya berlaku untuk pesan tersebut)
2. **Penggantian sesi** (diatur dengan mengirim pesan yang hanya berisi direktif)
3. **Nilai bawaan global** (`agents.defaults.elevatedDefault` dalam konfigurasi)

## Ketersediaan dan daftar izin

- **Gerbang global**: `tools.elevated.enabled` (harus `true`)
- **Daftar izin pengirim**: `tools.elevated.allowFrom` dengan daftar per kanal
- **Gerbang per agen**: `agents.list[].tools.elevated.enabled` (hanya dapat membatasi lebih lanjut; gerbang global dan per agen harus sama-sama `true`)
- **Daftar izin per agen**: `agents.list[].tools.elevated.allowFrom` (pengirim harus cocok dengan daftar global + per agen)
- **Daftar izin cadangan yang disediakan kanal**: Plugin kanal secara opsional dapat menyediakan daftar izin cadangan melalui hook adaptor SDK, yang digunakan saat `tools.elevated.allowFrom.<provider>` tidak dikonfigurasi. Saat ini tidak ada kanal bawaan yang mengimplementasikan hook ini, sehingga dalam praktiknya setiap penyedia saat ini memerlukan entri `tools.elevated.allowFrom.<provider>` secara eksplisit.
- **Semua gerbang harus lolos**; jika tidak, mode dengan hak istimewa lebih tinggi dianggap tidak tersedia

Format entri daftar izin:

| Awalan                  | Yang dicocokkan                            |
| ----------------------- | ------------------------------------------ |
| (tidak ada)             | ID pengirim, E.164, atau bidang From       |
| `name:`                 | Nama tampilan pengirim                     |
| `username:`             | Nama pengguna pengirim                     |
| `tag:`                  | Tag pengirim                               |
| `id:`, `from:`, `e164:` | Penargetan identitas secara eksplisit      |

## Hal yang tidak dikendalikan oleh mode dengan hak istimewa lebih tinggi

- **Kebijakan alat**: jika `exec` ditolak oleh kebijakan alat, mode dengan hak istimewa lebih tinggi tidak dapat mengesampingkannya.
- **Kebijakan pemilihan host**: mode dengan hak istimewa lebih tinggi tidak mengubah `auto` menjadi penggantian lintas host secara bebas. Mode ini menggunakan aturan target exec yang dikonfigurasi/ditetapkan untuk sesi dan hanya memilih `node` jika targetnya memang sudah `node`.
- **Terpisah dari `/exec`**: direktif `/exec` menyesuaikan nilai bawaan exec per sesi (host, keamanan, ask, node) untuk pengirim yang berwenang dan tidak memerlukan mode dengan hak istimewa lebih tinggi.

<Note>
  Perintah obrolan bash (awalan `!`; alias `/bash`) memiliki gerbang terpisah yang mengharuskan `tools.elevated` diaktifkan selain flag `tools.bash.enabled` miliknya sendiri. Menonaktifkan mode dengan hak istimewa lebih tinggi juga mengunci perintah shell `!`.
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Alat exec" href="/id/tools/exec" icon="terminal">
    Eksekusi perintah shell dari agen.
  </Card>
  <Card title="Persetujuan exec" href="/id/tools/exec-approvals" icon="shield">
    Sistem persetujuan dan daftar izin untuk `exec`.
  </Card>
  <Card title="Sandboxing" href="/id/gateway/sandboxing" icon="box">
    Konfigurasi sandbox pada tingkat Gateway.
  </Card>
  <Card title="Sandbox vs Kebijakan Alat vs Hak Istimewa Lebih Tinggi" href="/id/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    Cara ketiga gerbang tersebut berpadu selama panggilan alat.
  </Card>
</CardGroup>
