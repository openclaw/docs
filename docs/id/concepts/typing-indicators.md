---
read_when:
    - Mengubah perilaku atau pengaturan default indikator pengetikan
summary: Kapan OpenClaw menampilkan indikator sedang mengetik dan cara menyesuaikannya
title: Indikator pengetikan
x-i18n:
    generated_at: "2026-07-16T18:07:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 55e5ec38f47e0612b25b5561790e9b8a17ea4e215c4038bb89af83f861089e03
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Indikator mengetik dikirim ke kanal obrolan saat suatu proses aktif. Gunakan `agents.defaults.typingMode` untuk mengontrol **kapan** aktivitas mengetik dimulai dan `typingIntervalSeconds` untuk mengontrol **seberapa sering** indikator diperbarui (interval keepalive, default 6 detik).

## Default

Saat `agents.defaults.typingMode` **tidak ditetapkan**:

- **Obrolan langsung**: aktivitas mengetik segera dimulai setelah perulangan model dimulai.
- **Obrolan grup dengan sebutan**: aktivitas mengetik segera dimulai.
- **Obrolan grup tanpa sebutan**: aktivitas mengetik dimulai saat proses yang diterima memiliki aktivitas yang terlihat oleh pengguna, seperti aktivitas eksekusi harness atau teks pesan.
- **Proses Heartbeat**: aktivitas mengetik dimulai saat proses Heartbeat dimulai, jika target Heartbeat yang ditentukan adalah obrolan yang mendukung indikator mengetik dan indikator mengetik tidak dinonaktifkan.

## Mode

Tetapkan `agents.defaults.typingMode` ke salah satu dari:

- `never` - tidak pernah menampilkan indikator mengetik.
- `instant` - mulai mengetik **segera setelah perulangan model dimulai**, meskipun proses tersebut kemudian hanya mengembalikan token balasan senyap.
- `thinking` - mulai mengetik pada **delta penalaran pertama**, atau saat eksekusi harness aktif setelah giliran diterima.
- `message` - mulai mengetik pada **aktivitas balasan pertama yang terlihat oleh pengguna**, seperti eksekusi harness aktif atau delta teks non-senyap. Token balasan senyap seperti `NO_REPLY` tidak dihitung sebagai aktivitas teks.

Urutan berdasarkan "seberapa awal indikator dipicu": `never` -> `message`/`thinking` -> `instant`.

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

Timpa mode atau interval untuk setiap sesi:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Catatan

- Mode `message` tidak dimulai oleh token balasan senyap, tetapi eksekusi aktif tetap dapat menampilkan indikator mengetik sebelum teks asisten tersedia.
- `thinking` tetap merespons penalaran yang dialirkan (`reasoningLevel: "stream"`), dan juga dapat dimulai oleh eksekusi aktif sebelum delta penalaran tiba.
- Indikator mengetik Heartbeat merupakan sinyal keaktifan untuk target pengiriman yang ditentukan. Indikator ini dimulai saat proses Heartbeat dimulai, alih-alih mengikuti waktu aliran `message` atau `thinking`. Tetapkan `typingMode: "never"` untuk menonaktifkannya.
- Heartbeat tidak menampilkan indikator mengetik saat target Heartbeat adalah `"none"`, saat target tidak dapat ditentukan, saat pengiriman obrolan dinonaktifkan untuk Heartbeat, atau saat kanal tidak mendukung indikator mengetik.
- `typingIntervalSeconds` mengontrol **interval pembaruan**, bukan waktu mulai. Default: 6 detik.

## Terkait

<CardGroup cols={2}>
  <Card title="Kehadiran" href="/id/concepts/presence" icon="signal">
    Cara Gateway melacak klien yang terhubung untuk halaman Perangkat UI Kontrol dan tab Instans macOS.
  </Card>
  <Card title="Streaming dan pemotongan" href="/id/concepts/streaming" icon="bars-staggered">
    Perilaku streaming keluar, batas potongan, dan pengiriman khusus kanal.
  </Card>
</CardGroup>
