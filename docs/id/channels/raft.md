---
read_when:
    - Anda ingin menghubungkan OpenClaw ke ruang kerja Raft
    - Anda sedang mengonfigurasi Agen Eksternal Raft
    - Anda sedang men-debug pengiriman wake Raft
sidebarTitle: Raft
summary: Dukungan Agen Eksternal Raft melalui jembatan pembangkit CLI Raft
title: Rakit
x-i18n:
    generated_at: "2026-07-12T14:00:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 454d92d764a4ec3b0ec52467cba254dcad795870e04d1d32d4cf65d8b451a0de
    source_path: channels/raft.md
    workflow: 16
---

Raft menghubungkan agen OpenClaw ke Agen Eksternal Raft melalui CLI Raft lokal. Raft mengirimkan petunjuk pembangkitan terautentikasi ke Gateway; agen kemudian menggunakan CLI Raft untuk memeriksa dan mengirim pesan. Hanya percakapan langsung (tanpa grup).

## Instalasi

Raft adalah plugin eksternal resmi. Instal di host Gateway:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Detail: [Plugin](/id/tools/plugin)

## Prasyarat

- Ruang kerja Raft dengan Agen Eksternal.
- CLI Raft terinstal di host yang sama dengan Gateway OpenClaw dan tersedia di `PATH` layanan.
- Profil CLI Raft yang sudah masuk dan dikaitkan dengan Agen Eksternal tersebut.

Plugin tidak menyimpan kredensial Raft; CLI Raft menyimpan autentikasi tersebut dalam profilnya sendiri.

## Konfigurasi

Tetapkan profil dalam konfigurasi:

```json5
{
  channels: {
    raft: {
      enabled: true,
      profile: "openclaw",
    },
  },
}
```

Untuk akun default, Anda dapat menetapkan `RAFT_PROFILE` di lingkungan Gateway sebagai gantinya:

```bash
RAFT_PROFILE=openclaw
```

Gunakan akun bernama ketika satu Gateway terhubung ke lebih dari satu Agen Eksternal Raft:

```json5
{
  channels: {
    raft: {
      accounts: {
        support: {
          profile: "support-agent",
        },
        engineering: {
          profile: "engineering-agent",
        },
      },
    },
  },
}
```

Penyiapan interaktif mencatat profil yang sama:

```bash
openclaw channels add --channel raft
```

## Cara kerjanya

Saat Gateway dimulai, plugin:

1. Membuka endpoint HTTP pembangkitan khusus loopback pada porta sementara.
2. Menjalankan `raft --profile <profile> agent bridge` dengan endpoint tersebut dan token per proses.
3. Hanya menerima petunjuk pembangkitan terautentikasi tanpa konten yang memiliki identitas pemutaran ulang dari jembatan lokal.
4. Mewajibkan salah satu dari `eventId`, `attemptId`, `messageId`, `delivery_id`, `wake_id`, atau `id` pada setiap muatan pembangkitan.
5. Mendeduplikasi pengiriman ulang pembangkitan berdasarkan ID peristiwa jembatan selama 24 jam, termasuk setelah Gateway dimulai ulang.
6. Mengembalikan sesi waktu proses yang stabil untuk jembatan saat ini dan kumpulan pengurasan aktivitas kosong untuk protokol CLI Raft.
7. Memulai satu giliran agen OpenClaw yang diserialkan untuk setiap pembangkitan yang diterima.

Jembatan menangani percobaan ulang pengiriman dan penyambungan kembali Raft. Giliran OpenClaw hanya menerima pemberitahuan pembangkitan, bukan salinan isi pesan Raft. Agen menggunakan CLI untuk membaca pesan tertunda dan mengirim responsnya:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft bukan transportasi pesan dorong. OpenClaw tidak secara otomatis mengirim teks akhir model kembali melalui jembatan, sehingga agen harus menggunakan CLI Raft setelah memproses pembangkitan.
</Note>

## Verifikasi

Periksa apakah OpenClaw dapat menemukan CLI dan memiliki profil yang telah dikonfigurasi:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Kemudian kirim pesan ke Agen Eksternal Raft. Log Gateway seharusnya menunjukkan jembatan Raft dimulai, diikuti oleh pembangkitan masuk. Agen harus menggunakan profil Raft yang dikonfigurasi untuk memeriksa pesan tertundanya.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="CLI Raft tidak ditemukan">
    Instal CLI Raft di host Gateway dan pastikan `raft` tersedia di `PATH` layanan. Verifikasi dengan `raft --help`, lalu mulai ulang Gateway.
  </Accordion>
  <Accordion title="Jembatan langsung berhenti">
    Pastikan profil yang dikonfigurasi sudah masuk dan merupakan milik Agen Eksternal Raft yang dituju. Jalankan `raft --profile <profile> agent bridge` secara langsung untuk melihat diagnostik CLI.
  </Accordion>
  <Accordion title="Pembangkitan diterima tetapi tidak ada respons Raft yang dikirim">
    Hal ini wajar jika agen tidak menjalankan CLI Raft. Jembatan pembangkitan tidak membawa isi pesan atau balasan akhir otomatis. Periksa kebijakan alat agen dan pastikan agen dapat menjalankan `raft --profile <profile>
    message check` dan `message send`.
  </Accordion>
</AccordionGroup>

## Referensi

- [Raft](https://raft.build/)
- [Dokumentasi Raft](https://docs.raft.build/welcome/)
- [Integrasi Hermes dengan Raft](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
