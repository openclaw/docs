---
read_when:
    - Mengubah perilaku atau default indikator mengetik
summary: Kapan OpenClaw menampilkan indikator mengetik dan cara menyesuaikannya
title: Indikator Mengetik
x-i18n:
    generated_at: "2026-04-05T13:52:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28c8c395a135fc0745181aab66a93582177e6acd0b3496debcbb98159a4f11dc
    source_path: concepts/typing-indicators.md
    workflow: 15
---

# Indikator mengetik

Indikator mengetik dikirim ke channel chat selama sebuah run aktif. Gunakan
`agents.defaults.typingMode` untuk mengontrol **kapan** pengetikan dimulai dan `typingIntervalSeconds`
untuk mengontrol **seberapa sering** indikator itu diperbarui.

## Default

Saat `agents.defaults.typingMode` **tidak diatur**, OpenClaw mempertahankan perilaku lama:

- **Chat langsung**: pengetikan dimulai segera setelah loop model dimulai.
- **Chat grup dengan mention**: pengetikan dimulai segera.
- **Chat grup tanpa mention**: pengetikan dimulai hanya saat teks pesan mulai di-stream.
- **Run heartbeat**: pengetikan dinonaktifkan.

## Mode

Atur `agents.defaults.typingMode` ke salah satu dari:

- `never` — tidak ada indikator mengetik, kapan pun.
- `instant` — mulai mengetik **segera setelah loop model dimulai**, meskipun run
  nantinya hanya mengembalikan token balasan senyap.
- `thinking` — mulai mengetik pada **delta reasoning pertama** (memerlukan
  `reasoningLevel: "stream"` untuk run tersebut).
- `message` — mulai mengetik pada **delta teks non-senyap pertama** (mengabaikan
  token senyap `NO_REPLY`).

Urutan berdasarkan “seberapa cepat indikator muncul”:
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

Anda dapat menimpa mode atau jeda per sesi:

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
  dicocokkan tanpa peka huruf besar-kecil).
- `thinking` hanya aktif jika run melakukan streaming reasoning (`reasoningLevel: "stream"`).
  Jika model tidak mengeluarkan delta reasoning, indikator mengetik tidak akan dimulai.
- Heartbeat tidak pernah menampilkan indikator mengetik, apa pun modenya.
- `typingIntervalSeconds` mengontrol **irama pembaruan**, bukan waktu mulai.
  Default-nya adalah 6 detik.
