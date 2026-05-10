---
read_when:
    - Mengubah perilaku atau nilai bawaan indikator pengetikan
summary: Kapan OpenClaw menampilkan indikator mengetik dan cara menyesuaikannya
title: Indikator pengetikan
x-i18n:
    generated_at: "2026-05-10T19:33:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: e26b4008f165527098ffcbf9c39ee7179149063842cc5c6aacb5b7c606eedc26
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Indikator pengetikan dikirim ke saluran chat saat sebuah eksekusi aktif. Gunakan
`agents.defaults.typingMode` untuk mengontrol **kapan** pengetikan dimulai dan `typingIntervalSeconds`
untuk mengontrol **seberapa sering** indikator disegarkan.

## Default

Saat `agents.defaults.typingMode` **tidak disetel**, OpenClaw mempertahankan perilaku lama:

- **Chat langsung**: pengetikan dimulai segera setelah loop model dimulai.
- **Chat grup dengan sebutan**: pengetikan dimulai segera.
- **Chat grup tanpa sebutan**: pengetikan dimulai hanya saat teks pesan mulai streaming.
- **Eksekusi Heartbeat**: pengetikan dimulai saat eksekusi Heartbeat dimulai jika
  target Heartbeat yang terselesaikan adalah chat yang mendukung pengetikan dan pengetikan tidak dinonaktifkan.

## Mode

Setel `agents.defaults.typingMode` ke salah satu dari:

- `never` - tidak ada indikator pengetikan, sama sekali.
- `instant` - mulai mengetik **segera setelah loop model dimulai**, meskipun eksekusi
  kemudian hanya mengembalikan token balasan senyap.
- `thinking` - mulai mengetik pada **delta penalaran pertama** (memerlukan
  `reasoningLevel: "stream"` untuk eksekusi).
- `message` - mulai mengetik pada **delta teks non-senyap pertama** (mengabaikan
  token senyap `NO_REPLY`).

Urutan "seberapa awal dipicu":
`never` → `message` → `thinking` → `instant`

## Konfigurasi

Setel default tingkat agen:

```json5
{
  agents: {
    defaults: {
      typingMode: "thinking",
      typingIntervalSeconds: 6,
    },
  },
}
```

Timpa mode atau irama per sesi:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Catatan

- Mode `message` tidak akan menampilkan pengetikan untuk balasan yang hanya senyap ketika seluruh
  payload adalah token senyap persis (misalnya `NO_REPLY` / `no_reply`,
  dicocokkan tanpa membedakan huruf besar/kecil).
- `thinking` hanya dipicu jika eksekusi melakukan streaming penalaran (`reasoningLevel: "stream"`).
  Jika model tidak memancarkan delta penalaran, pengetikan tidak akan dimulai.
- Pengetikan Heartbeat adalah sinyal keaktifan untuk target pengiriman yang terselesaikan. Ini
  dimulai saat eksekusi Heartbeat dimulai, alih-alih mengikuti waktu streaming `message` atau `thinking`.
  Setel `typingMode: "never"` untuk menonaktifkannya.
- Heartbeat tidak menampilkan pengetikan saat `target: "none"`, saat target tidak dapat
  diselesaikan, saat pengiriman chat dinonaktifkan untuk Heartbeat, atau saat
  saluran tidak mendukung pengetikan.
- `typingIntervalSeconds` mengontrol **irama penyegaran**, bukan waktu mulai.
  Defaultnya adalah 6 detik.

## Terkait

<CardGroup cols={2}>
  <Card title="Kehadiran" href="/id/concepts/presence" icon="signal">
    Cara Gateway melacak klien yang terhubung dan menampilkannya di tab Instans macOS.
  </Card>
  <Card title="Streaming dan pemotongan" href="/id/concepts/streaming" icon="bars-staggered">
    Perilaku streaming keluar, batas potongan, dan pengiriman khusus saluran.
  </Card>
</CardGroup>
