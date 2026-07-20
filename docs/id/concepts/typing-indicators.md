---
read_when:
    - Mengubah perilaku atau nilai default indikator pengetikan
summary: Kapan OpenClaw menampilkan indikator sedang mengetik dan cara menyesuaikannya
title: Indikator pengetikan
x-i18n:
    generated_at: "2026-07-20T03:48:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cdaad6345ebf20ff3142020e584985c2dcc04e25f2ae4f11585e30903c9e4729
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Indikator pengetikan dikirim ke kanal obrolan saat suatu eksekusi aktif. Gunakan `agents.defaults.typingMode` untuk mengontrol **kapan** pengetikan dimulai dan `typingIntervalSeconds` untuk mengontrol **seberapa sering** indikator diperbarui (interval keepalive, default 6 detik).

## Default

Saat `agents.defaults.typingMode` **tidak ditetapkan**:

- **Obrolan langsung**: pengetikan segera dimulai setelah loop model dimulai.
- **Obrolan grup dengan sebutan**: pengetikan segera dimulai.
- **Obrolan grup tanpa sebutan**: pengetikan dimulai saat eksekusi yang diterima memiliki aktivitas yang terlihat oleh pengguna, seperti aktivitas eksekusi harness atau teks pesan.
- **Eksekusi Heartbeat**: pengetikan dimulai saat eksekusi Heartbeat dimulai, jika target Heartbeat yang ditetapkan adalah obrolan yang mendukung pengetikan dan pengetikan tidak dinonaktifkan.

## Mode

Tetapkan `agents.defaults.typingMode` ke salah satu dari:

- `never` - tidak pernah menampilkan indikator pengetikan.
- `instant` - mulai mengetik **segera setelah loop model dimulai**, meskipun eksekusi tersebut nantinya hanya mengembalikan token balasan senyap.
- `thinking` - mulai mengetik pada **delta penalaran pertama**, atau saat eksekusi harness aktif setelah giliran diterima.
- `message` - mulai mengetik pada **aktivitas balasan pertama yang terlihat oleh pengguna**, seperti eksekusi harness aktif atau delta teks non-senyap. Token balasan senyap seperti `NO_REPLY` tidak dianggap sebagai aktivitas teks.

Urutan berdasarkan "seberapa awal dipicu": `never` -> `message`/`thinking` -> `instant`.

## Konfigurasi

Tetapkan default tingkat agen:

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

Timpa mode per sesi:

```json5
{
  session: {
    typingMode: "message",
  },
}
```

## Catatan

- Mode `message` tidak dimulai dari token balasan senyap, tetapi eksekusi aktif tetap dapat menampilkan pengetikan sebelum teks asisten tersedia.
- `thinking` tetap bereaksi terhadap penalaran yang dialirkan (`reasoningLevel: "stream"`), dan juga dapat dimulai dari eksekusi aktif sebelum delta penalaran tiba.
- Pengetikan Heartbeat adalah sinyal keaktifan untuk target pengiriman yang ditetapkan. Pengetikan dimulai saat eksekusi Heartbeat dimulai, bukan mengikuti waktu aliran `message` atau `thinking`. Tetapkan `typingMode: "never"` untuk menonaktifkannya.
- Heartbeat tidak menampilkan pengetikan saat target Heartbeat adalah `"none"`, saat target tidak dapat ditetapkan, saat pengiriman obrolan dinonaktifkan untuk Heartbeat, atau saat kanal tidak mendukung pengetikan.
- `agents.defaults.typingIntervalSeconds` mengontrol **interval pembaruan**, bukan waktu mulai. Default: 6 detik.

## Terkait

<CardGroup cols={2}>
  <Card title="Kehadiran" href="/id/concepts/presence" icon="signal">
    Cara Gateway melacak klien yang terhubung untuk halaman Perangkat di UI Kontrol dan tab Instans macOS.
  </Card>
  <Card title="Pengaliran dan pemotongan" href="/id/concepts/streaming" icon="bars-staggered">
    Perilaku pengaliran keluar, batas potongan, dan pengiriman khusus kanal.
  </Card>
</CardGroup>
