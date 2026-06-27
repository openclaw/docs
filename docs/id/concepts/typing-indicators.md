---
read_when:
    - Mengubah perilaku atau nilai default indikator pengetikan
summary: Kapan OpenClaw menampilkan indikator mengetik dan cara menyesuaikannya
title: Indikator pengetikan
x-i18n:
    generated_at: "2026-06-27T17:27:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa76889d0f6262f1092abefee02aee8fe944651dc89d3a697ccc86e16558ed60
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Indikator mengetik dikirim ke saluran chat saat sebuah run aktif. Gunakan
`agents.defaults.typingMode` untuk mengontrol **kapan** mengetik dimulai dan `typingIntervalSeconds`
untuk mengontrol **seberapa sering** indikator diperbarui.

## Default

Saat `agents.defaults.typingMode` **tidak diatur**, OpenClaw mempertahankan perilaku lama:

- **Chat langsung**: mengetik dimulai segera setelah loop model dimulai.
- **Chat grup dengan mention**: mengetik dimulai segera.
- **Chat grup tanpa mention**: mengetik dimulai saat run yang diterima memiliki
  aktivitas yang terlihat oleh pengguna, seperti aktivitas eksekusi harness atau teks pesan.
- **Run Heartbeat**: mengetik dimulai saat run heartbeat dimulai jika
  target heartbeat yang terselesaikan adalah chat yang mendukung pengetikan dan pengetikan tidak dinonaktifkan.

## Mode

Atur `agents.defaults.typingMode` ke salah satu dari:

- `never` - tidak ada indikator mengetik, kapan pun.
- `instant` - mulai mengetik **segera setelah loop model dimulai**, meskipun run
  kemudian hanya mengembalikan token balasan senyap.
- `thinking` - mulai mengetik pada **delta penalaran pertama** atau pada eksekusi
  harness aktif setelah giliran diterima.
- `message` - mulai mengetik pada **aktivitas balasan pertama yang terlihat oleh pengguna**, seperti
  eksekusi harness aktif atau delta teks non-senyap. Token balasan senyap seperti
  `NO_REPLY` tidak dihitung sebagai aktivitas teks.

Urutan "seberapa awal dipicu":
`never` → `message`/`thinking` → `instant`

## Konfigurasi

Atur default tingkat agen:

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

- Mode `message` tidak dimulai dari token balasan senyap, tetapi eksekusi aktif
  masih dapat menampilkan pengetikan sebelum teks asisten tersedia.
- `thinking` tetap bereaksi terhadap penalaran yang dialirkan (`reasoningLevel: "stream"`),
  dan juga dapat dimulai dari eksekusi aktif sebelum delta penalaran tiba.
- Pengetikan Heartbeat adalah sinyal keaktifan untuk target pengiriman yang terselesaikan. Ini
  dimulai saat awal run heartbeat alih-alih mengikuti waktu stream `message` atau `thinking`.
  Atur `typingMode: "never"` untuk menonaktifkannya.
- Heartbeat tidak menampilkan pengetikan saat `target: "none"`, saat target tidak dapat
  diselesaikan, saat pengiriman chat dinonaktifkan untuk heartbeat, atau saat
  saluran tidak mendukung pengetikan.
- `typingIntervalSeconds` mengontrol **irama penyegaran**, bukan waktu mulai.
  Default-nya adalah 6 detik.

## Terkait

<CardGroup cols={2}>
  <Card title="Presence" href="/id/concepts/presence" icon="signal">
    Cara Gateway melacak klien yang terhubung dan menampilkannya di tab Instans macOS.
  </Card>
  <Card title="Streaming dan chunking" href="/id/concepts/streaming" icon="bars-staggered">
    Perilaku streaming keluar, batas chunk, dan pengiriman khusus saluran.
  </Card>
</CardGroup>
