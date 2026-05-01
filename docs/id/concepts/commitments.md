---
read_when:
    - Anda ingin OpenClaw mengingat tindak lanjut yang alami
    - Anda ingin memahami bagaimana lapor masuk yang disimpulkan berbeda dari pengingat
    - Anda ingin meninjau atau mengabaikan komitmen tindak lanjut
sidebarTitle: Commitments
summary: Memori tindak lanjut yang disimpulkan untuk pengecekan yang bukan pengingat persis
title: Komitmen yang disimpulkan
x-i18n:
    generated_at: "2026-05-01T09:23:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78841d87fe749aa5b04a967218396df1c1a7884c5767b09215c96aee34fa2014
    source_path: concepts/commitments.md
    workflow: 16
---

Komitmen adalah memori tindak lanjut berumur pendek. Saat diaktifkan, OpenClaw dapat
menyadari bahwa sebuah percakapan menciptakan peluang check-in di masa depan dan mengingat
untuk membawanya kembali nanti.

Contoh:

- Anda menyebut wawancara besok. OpenClaw dapat melakukan check-in sesudahnya.
- Anda mengatakan sedang sangat lelah. OpenClaw dapat bertanya nanti apakah Anda sudah tidur.
- Agent mengatakan akan menindaklanjuti setelah sesuatu berubah. OpenClaw dapat melacak
  loop terbuka tersebut.

Komitmen bukan fakta tahan lama seperti `MEMORY.md`, dan bukan pengingat persis.
Komitmen berada di antara memori dan otomasi: OpenClaw mengingat kewajiban
yang terikat percakapan, lalu Heartbeat mengirimkannya saat jatuh tempo.

## Aktifkan komitmen

Komitmen nonaktif secara default. Aktifkan di konfigurasi:

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

`openclaw.json` yang setara:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` membatasi berapa banyak tindak lanjut tersimpul yang dapat dikirim
per sesi agent dalam satu hari bergulir. Default-nya adalah `3`.

## Cara kerjanya

Setelah balasan agent, OpenClaw dapat menjalankan proses ekstraksi latar belakang tersembunyi dalam
konteks terpisah. Proses itu hanya mencari komitmen tindak lanjut tersimpul. Proses tersebut
tidak menulis ke percakapan yang terlihat dan tidak meminta agent utama
untuk menalar tentang ekstraksi.

Saat menemukan kandidat dengan keyakinan tinggi, OpenClaw menyimpan komitmen dengan:

- id agent
- kunci sesi
- kanal asli dan target pengiriman
- jendela jatuh tempo
- check-in singkat yang disarankan
- metadata non-instruksional agar Heartbeat memutuskan apakah akan mengirimkannya

Pengiriman terjadi melalui Heartbeat. Saat komitmen jatuh tempo, Heartbeat
menambahkan komitmen ke giliran Heartbeat untuk cakupan agent dan kanal yang sama.
Model dapat mengirim satu check-in alami atau membalas `HEARTBEAT_OK` untuk mengabaikannya.
Jika Heartbeat dikonfigurasi dengan `target: "none"`, komitmen yang jatuh tempo tetap
internal dan tidak mengirim check-in eksternal. Prompt pengiriman komitmen tidak
memutar ulang teks percakapan asli, dan giliran Heartbeat komitmen yang jatuh tempo berjalan
tanpa alat OpenClaw.

OpenClaw tidak pernah mengirim komitmen tersimpul segera setelah menuliskannya.
Waktu jatuh tempo dibatasi agar setidaknya satu interval Heartbeat setelah komitmen
dibuat, sehingga tindak lanjut tidak dapat bergema kembali pada saat yang sama ketika
disimpulkan.

## Cakupan

Komitmen dicakup ke konteks agent dan kanal persis tempat komitmen
dibuat. Tindak lanjut yang disimpulkan saat berbicara dengan satu agent di Discord tidak
dikirim oleh agent lain, kanal lain, atau sesi yang tidak terkait.

Cakupan ini adalah bagian dari fitur. Check-in alami harus terasa seperti
kelanjutan dari percakapan yang sama, bukan seperti sistem pengingat global.

## Komitmen vs pengingat

| Kebutuhan                                       | Gunakan                                  |
| ----------------------------------------------- | ---------------------------------------- |
| "Ingatkan saya pukul 3 sore"                    | [Tugas terjadwal](/id/automation/cron-jobs) |
| "Ping saya dalam 20 menit"                      | [Tugas terjadwal](/id/automation/cron-jobs) |
| "Jalankan laporan ini setiap hari kerja"        | [Tugas terjadwal](/id/automation/cron-jobs) |
| "Saya punya wawancara besok"                    | Komitmen                                 |
| "Saya begadang semalaman"                       | Komitmen                                 |
| "Tindak lanjuti jika saya tidak menjawab thread terbuka ini" | Komitmen                   |

Permintaan pengguna yang persis sudah menjadi bagian dari jalur scheduler. Komitmen hanya
untuk tindak lanjut tersimpul: momen ketika pengguna tidak meminta pengingat,
tetapi percakapan jelas menciptakan check-in masa depan yang berguna.

## Kelola komitmen

Gunakan CLI untuk memeriksa dan menghapus komitmen tersimpan:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Lihat [`openclaw commitments`](/id/cli/commitments) untuk referensi perintah.

## Privasi dan biaya

Ekstraksi komitmen menggunakan proses LLM, jadi mengaktifkannya menambah penggunaan model
latar belakang setelah giliran yang memenuhi syarat. Proses ini tersembunyi dari percakapan
yang terlihat oleh pengguna, tetapi dapat membaca pertukaran terbaru yang diperlukan untuk memutuskan apakah
ada tindak lanjut.

Komitmen tersimpan adalah state OpenClaw lokal. Komitmen adalah memori operasional, bukan
memori jangka panjang. Nonaktifkan fitur dengan:

```bash
openclaw config set commitments.enabled false
```

## Pemecahan masalah

Jika tindak lanjut yang diharapkan tidak muncul:

- Konfirmasi `commitments.enabled` adalah `true`.
- Periksa `openclaw commitments --all` untuk catatan yang tertunda, diabaikan, ditunda, atau kedaluwarsa.
- Pastikan Heartbeat berjalan untuk agent tersebut.
- Periksa apakah `commitments.maxPerDay` sudah tercapai untuk sesi
  agent tersebut.
- Ingat bahwa pengingat persis dilewati oleh ekstraksi komitmen dan seharusnya
  muncul di bawah [tugas terjadwal](/id/automation/cron-jobs) sebagai gantinya.

## Terkait

- [Gambaran umum memori](/id/concepts/memory)
- [Active Memory](/id/concepts/active-memory)
- [Heartbeat](/id/gateway/heartbeat)
- [Tugas terjadwal](/id/automation/cron-jobs)
- [`openclaw commitments`](/id/cli/commitments)
- [Referensi konfigurasi](/id/gateway/configuration-reference#commitments)
