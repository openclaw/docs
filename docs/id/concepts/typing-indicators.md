---
read_when:
    - Mengubah perilaku atau default indikator mengetik
summary: Kapan OpenClaw menampilkan indikator mengetik dan cara menyetelnya
title: Indikator mengetik
x-i18n:
    generated_at: "2026-04-24T09:05:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80f5c3bb79cf87f79db5336978b877f4a01025f59c9e822ab66198f00907123f
    source_path: concepts/typing-indicators.md
    workflow: 15
---

Indikator mengetik dikirim ke channel chat saat sebuah run aktif. Gunakan
`agents.defaults.typingMode` untuk mengontrol **kapan** pengetikan dimulai dan `typingIntervalSeconds`
untuk mengontrol **seberapa sering** indikator diperbarui.

## Default

Saat `agents.defaults.typingMode` **tidak diatur**, OpenClaw mempertahankan perilaku lama:

- **Chat langsung**: pengetikan dimulai segera setelah loop model dimulai.
- **Chat grup dengan mention**: pengetikan dimulai segera.
- **Chat grup tanpa mention**: pengetikan dimulai hanya saat teks pesan mulai di-stream.
- **Run Heartbeat**: pengetikan dimulai saat run Heartbeat dimulai jika
  target Heartbeat yang di-resolve adalah chat yang mendukung pengetikan dan pengetikan tidak dinonaktifkan.

## Mode

Atur `agents.defaults.typingMode` ke salah satu dari:

- `never` — tidak ada indikator mengetik, sama sekali.
- `instant` — mulai mengetik **segera setelah loop model dimulai**, bahkan jika run
  nantinya hanya mengembalikan token balasan senyap.
- `thinking` — mulai mengetik pada **delta penalaran pertama** (memerlukan
  `reasoningLevel: "stream"` untuk run tersebut).
- `message` — mulai mengetik pada **delta teks non-senyap pertama** (mengabaikan
  token senyap `NO_REPLY`).

Urutan “seberapa cepat dipicu”:
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

Anda dapat menimpa mode atau cadence per sesi:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Catatan

- Mode `message` tidak akan menampilkan indikator mengetik untuk balasan yang hanya senyap jika seluruh
  payload adalah token senyap yang persis sama (misalnya `NO_REPLY` / `no_reply`,
  dicocokkan tanpa peka huruf besar/kecil).
- `thinking` hanya dipicu jika run men-stream penalaran (`reasoningLevel: "stream"`).
  Jika model tidak mengeluarkan delta penalaran, pengetikan tidak akan dimulai.
- Pengetikan Heartbeat adalah sinyal liveness untuk target pengiriman yang di-resolve. Ini
  dimulai saat run Heartbeat dimulai alih-alih mengikuti waktu stream `message` atau `thinking`.
  Atur `typingMode: "never"` untuk menonaktifkannya.
- Heartbeat tidak menampilkan indikator mengetik saat `target: "none"`, saat target tidak dapat
  di-resolve, saat pengiriman chat dinonaktifkan untuk Heartbeat, atau saat
  channel tidak mendukung pengetikan.
- `typingIntervalSeconds` mengontrol **cadence penyegaran**, bukan waktu mulai.
  Default-nya adalah 6 detik.

## Terkait

- [Presence](/id/concepts/presence)
- [Streaming dan chunking](/id/concepts/streaming)
