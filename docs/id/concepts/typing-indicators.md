---
read_when:
    - Mengubah perilaku atau nilai default indikator pengetikan
summary: Kapan OpenClaw menampilkan indikator mengetik dan cara menyesuaikannya
title: Indikator pengetikan
x-i18n:
    generated_at: "2026-05-06T09:09:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59ee89a2f382b185e520fea178cf1860cbc4cfb8257c3b0ae7552fa4b1c79ef3
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Indikator pengetikan dikirim ke kanal chat saat sebuah run aktif. Gunakan
`agents.defaults.typingMode` untuk mengontrol **kapan** pengetikan dimulai dan `typingIntervalSeconds`
untuk mengontrol **seberapa sering** indikator diperbarui.

## Default

Saat `agents.defaults.typingMode` **tidak disetel**, OpenClaw mempertahankan perilaku lama:

- **Chat langsung**: pengetikan dimulai segera setelah loop model dimulai.
- **Chat grup dengan mention**: pengetikan dimulai segera.
- **Chat grup tanpa mention**: pengetikan dimulai hanya saat teks pesan mulai dialirkan.
- **Run Heartbeat**: pengetikan dimulai saat run Heartbeat dimulai jika
  target Heartbeat yang di-resolve adalah chat yang mendukung pengetikan dan pengetikan tidak dinonaktifkan.

## Mode

Setel `agents.defaults.typingMode` ke salah satu dari:

- `never` - tidak ada indikator pengetikan, kapan pun.
- `instant` - mulai mengetik **segera setelah loop model dimulai**, bahkan jika run
  kemudian hanya mengembalikan token balasan senyap.
- `thinking` - mulai mengetik pada **delta penalaran pertama** (memerlukan
  `reasoningLevel: "stream"` untuk run tersebut).
- `message` - mulai mengetik pada **delta teks non-senyap pertama** (mengabaikan
  token senyap `NO_REPLY`).

Urutan "seberapa dini ini dipicu":
`never` → `message` → `thinking` → `instant`

## Konfigurasi

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

Anda dapat mengganti mode atau irama per sesi:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Catatan

- Mode `message` tidak akan menampilkan pengetikan untuk balasan yang hanya senyap saat seluruh
  payload adalah token senyap persis (misalnya `NO_REPLY` / `no_reply`,
  dicocokkan tanpa membedakan huruf besar/kecil).
- `thinking` hanya dipicu jika run mengalirkan penalaran (`reasoningLevel: "stream"`).
  Jika model tidak memancarkan delta penalaran, pengetikan tidak akan dimulai.
- Pengetikan Heartbeat adalah sinyal keaktifan untuk target pengiriman yang di-resolve. Ini
  dimulai saat run Heartbeat dimulai, bukan mengikuti timing stream `message` atau `thinking`.
  Setel `typingMode: "never"` untuk menonaktifkannya.
- Heartbeat tidak menampilkan pengetikan saat `target: "none"`, saat target tidak dapat
  di-resolve, saat pengiriman chat dinonaktifkan untuk Heartbeat, atau saat
  kanal tidak mendukung pengetikan.
- `typingIntervalSeconds` mengontrol **irama pembaruan**, bukan waktu mulai.
  Default-nya adalah 6 detik.

## Terkait

<CardGroup cols={2}>
  <Card title="Presence" href="/id/concepts/presence" icon="signal">
    Cara Gateway melacak klien yang terhubung dan menampilkannya di tab Instances macOS.
  </Card>
  <Card title="Streaming and chunking" href="/id/concepts/streaming" icon="bars-staggered">
    Perilaku streaming keluar, batas chunk, dan pengiriman khusus kanal.
  </Card>
</CardGroup>
