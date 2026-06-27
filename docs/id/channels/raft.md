---
read_when:
    - Anda ingin menghubungkan OpenClaw ke ruang kerja Raft
    - Anda sedang mengonfigurasi Agen Eksternal Raft
    - Anda sedang men-debug pengiriman wake Raft
sidebarTitle: Raft
summary: Dukungan Agen Eksternal Raft melalui jembatan pemicu bangun CLI Raft
title: Rakit
x-i18n:
    generated_at: "2026-06-27T17:12:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef9ebfd27e69575d9a1534b3b31f05036f081c54a2379411d2c7fb6f8165d558
    source_path: channels/raft.md
    workflow: 16
---

Dukungan Raft menghubungkan agen OpenClaw ke Raft External Agent melalui CLI
Raft lokal. Raft mengirimkan petunjuk bangun terautentikasi ke Gateway. Agen kemudian menggunakan
CLI Raft untuk memeriksa dan mengirim pesan.

## Instal

Raft adalah plugin eksternal resmi. Instal di host Gateway:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Detail: [Plugin](/id/tools/plugin)

## Prasyarat

- Workspace Raft dengan External Agent.
- CLI Raft terinstal pada host yang sama dengan Gateway OpenClaw.
- Profil CLI Raft yang sudah masuk dan terkait dengan External Agent tersebut.

Plugin tidak menyimpan kredensial Raft. CLI Raft menyimpan autentikasi tersebut
di profilnya sendiri.

## Konfigurasi

Atur profil dalam konfigurasi:

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

Untuk akun default, Anda dapat mengatur `RAFT_PROFILE` di lingkungan Gateway
sebagai gantinya:

```bash
RAFT_PROFILE=openclaw
```

Gunakan akun bernama ketika satu Gateway terhubung ke lebih dari satu Raft External Agent:

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

Alur penyiapan interaktif merekam profil yang sama:

```bash
openclaw channels setup raft
```

## Cara Kerjanya

Saat Gateway dimulai, plugin:

1. Membuka endpoint bangun HTTP hanya-loopback pada port sementara.
2. Memulai `raft --profile <profile> agent bridge` dengan endpoint tersebut dan
   token per proses.
3. Hanya menerima petunjuk bangun terautentikasi tanpa konten dengan identitas replay dari bridge lokal.
4. Memerlukan salah satu dari `eventId`, `attemptId`, `messageId`, `delivery_id`, `wake_id`, atau `id`.
5. Mendeduplikasi pengiriman bangun ulang terbaru berdasarkan ID peristiwa bridge, termasuk lintas restart Gateway.
6. Mengembalikan sesi runtime yang stabil untuk bridge saat ini dan batch pengurasan aktivitas kosong untuk protokol CLI Raft.
7. Memulai satu giliran agen OpenClaw terserialisasi untuk setiap bangun yang diterima.

Bridge memiliki percobaan ulang pengiriman Raft dan koneksi ulang. Giliran OpenClaw menerima
hanya pemberitahuan bangun, bukan salinan isi pesan Raft. Ia menggunakan CLI untuk membaca
pesan tertunda dan mengirim responsnya:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft bukan transport pesan push normal. OpenClaw tidak secara otomatis
mengirim teks akhir model kembali melalui bridge, jadi agen harus menggunakan
CLI Raft setelah memproses bangun.
</Note>

## Verifikasi

Periksa bahwa OpenClaw dapat menemukan CLI dan memiliki profil yang dikonfigurasi:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Lalu kirim pesan ke Raft External Agent. Log Gateway seharusnya menampilkan
bridge Raft dimulai, diikuti bangun masuk. Agen seharusnya menggunakan
profil Raft yang dikonfigurasi untuk memeriksa pesan tertundanya.

## Pemecahan Masalah

<AccordionGroup>
  <Accordion title="CLI Raft tidak ditemukan">
    Instal CLI Raft di host Gateway dan buat `raft` tersedia di
    `PATH` layanan. Verifikasi dengan `raft --help`, lalu restart Gateway.
  </Accordion>
  <Accordion title="Bridge langsung keluar">
    Verifikasi profil yang dikonfigurasi sudah masuk dan milik
    Raft External Agent yang dimaksud. Jalankan `raft --profile <profile> agent bridge` secara langsung
    untuk melihat diagnostik CLI.
  </Accordion>
  <Accordion title="Bangun tiba tetapi tidak ada respons Raft yang dikirim">
    Ini diharapkan ketika agen tidak memanggil CLI Raft. Bridge bangun
    tidak membawa isi pesan atau balasan akhir otomatis. Periksa
    kebijakan alat agen dan pastikan agen dapat menjalankan `raft --profile <profile> message
    check` dan `message send`.
  </Accordion>
</AccordionGroup>

## Referensi

- [Raft](https://raft.build/)
- [Dokumentasi Raft](https://docs.raft.build/welcome/)
- [Integrasi Hermes Raft](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
