---
read_when:
    - Anda ingin OpenClaw mengingat tindak lanjut yang alami
    - Anda ingin memahami bagaimana check-in yang disimpulkan berbeda dari pengingat
    - Anda ingin meninjau atau mengabaikan komitmen tindak lanjut
sidebarTitle: Commitments
summary: Memori tindak lanjut yang disimpulkan untuk pemeriksaan berkala yang bukan pengingat persis
title: Komitmen yang disimpulkan
x-i18n:
    generated_at: "2026-04-30T09:42:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f51af0ac2c9841258fbeeb8f2f98dba6f438b8e0c9433f601a0504d6ef27111
    source_path: concepts/commitments.md
    workflow: 16
---

Komitmen adalah memori tindak lanjut jangka pendek. Saat diaktifkan, OpenClaw dapat
menyadari bahwa sebuah percakapan menciptakan peluang pengecekan di masa mendatang dan mengingat
untuk mengangkatnya kembali nanti.

Contoh:

- Anda menyebut wawancara besok. OpenClaw dapat mengecek setelahnya.
- Anda mengatakan bahwa Anda kelelahan. OpenClaw dapat bertanya nanti apakah Anda sudah tidur.
- Agen mengatakan bahwa ia akan menindaklanjuti setelah sesuatu berubah. OpenClaw dapat melacak
  loop terbuka itu.

Komitmen bukan fakta tahan lama seperti `MEMORY.md`, dan bukan pengingat persis.
Komitmen berada di antara memori dan otomasi: OpenClaw mengingat kewajiban yang terikat percakapan,
lalu Heartbeat mengirimkannya saat jatuh tempo.

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

`commitments.maxPerDay` membatasi berapa banyak tindak lanjut tersimpulkan yang dapat dikirim
per sesi agen dalam satu hari berjalan. Default-nya adalah `3`.

## Cara kerjanya

Setelah balasan agen, OpenClaw dapat menjalankan proses ekstraksi latar belakang tersembunyi dalam
konteks terpisah. Proses itu hanya mencari komitmen tindak lanjut tersimpulkan. Proses itu
tidak menulis ke percakapan yang terlihat dan tidak meminta agen utama
menalar tentang ekstraksi tersebut.

Saat menemukan kandidat dengan keyakinan tinggi, OpenClaw menyimpan komitmen dengan:

- id agen
- kunci sesi
- kanal asal dan target pengiriman
- jendela jatuh tempo
- pengecekan singkat yang disarankan
- konteks sumber yang cukup agar Heartbeat dapat memutuskan apakah akan mengirimkannya

Pengiriman terjadi melalui Heartbeat. Saat komitmen jatuh tempo, Heartbeat
menambahkan komitmen itu ke giliran Heartbeat untuk cakupan agen dan kanal yang sama.
Model dapat mengirim satu pengecekan natural atau membalas `HEARTBEAT_OK` untuk menutupnya.

OpenClaw tidak pernah mengirim komitmen tersimpulkan segera setelah menuliskannya.
Waktu jatuh tempo dibatasi setidaknya satu interval Heartbeat setelah komitmen
dibuat, sehingga tindak lanjut tidak dapat bergema kembali pada momen yang sama saat
disimpulkan.

## Cakupan

Komitmen dicakupkan ke konteks agen dan kanal persis tempat komitmen tersebut
dibuat. Tindak lanjut yang disimpulkan saat berbicara dengan satu agen di Discord tidak
dikirim oleh agen lain, kanal lain, atau sesi yang tidak terkait.

Cakupan ini merupakan bagian dari fitur. Pengecekan natural seharusnya terasa seperti percakapan yang sama
berlanjut, bukan seperti sistem pengingat global.

## Komitmen vs pengingat

| Kebutuhan                                       | Gunakan                                  |
| ----------------------------------------------- | ---------------------------------------- |
| "Ingatkan saya pukul 3 sore"                    | [Tugas terjadwal](/id/automation/cron-jobs) |
| "Ping saya dalam 20 menit"                      | [Tugas terjadwal](/id/automation/cron-jobs) |
| "Jalankan laporan ini setiap hari kerja"        | [Tugas terjadwal](/id/automation/cron-jobs) |
| "Saya punya wawancara besok"                    | Komitmen                                 |
| "Saya begadang semalaman"                       | Komitmen                                 |
| "Tindak lanjuti jika saya tidak menjawab utas terbuka ini" | Komitmen                      |

Permintaan pengguna yang persis sudah termasuk ke jalur penjadwal. Komitmen hanya
untuk tindak lanjut tersimpulkan: momen saat pengguna tidak meminta pengingat,
tetapi percakapan jelas menciptakan pengecekan masa depan yang berguna.

## Kelola komitmen

Gunakan CLI untuk memeriksa dan menghapus komitmen yang tersimpan:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Lihat [`openclaw commitments`](/id/cli/commitments) untuk referensi perintah.

## Privasi dan biaya

Ekstraksi komitmen menggunakan proses LLM, sehingga mengaktifkannya menambahkan penggunaan model
latar belakang setelah giliran yang memenuhi syarat. Proses ini tersembunyi dari
percakapan yang terlihat oleh pengguna, tetapi dapat membaca pertukaran terbaru yang diperlukan untuk memutuskan apakah
ada tindak lanjut.

Komitmen tersimpan adalah status lokal OpenClaw. Komitmen merupakan memori operasional, bukan
memori jangka panjang. Nonaktifkan fitur dengan:

```bash
openclaw config set commitments.enabled false
```

## Pemecahan masalah

Jika tindak lanjut yang diharapkan tidak muncul:

- Pastikan `commitments.enabled` adalah `true`.
- Periksa `openclaw commitments --all` untuk rekaman tertunda, ditutup, ditunda, atau kedaluwarsa.
- Pastikan Heartbeat berjalan untuk agen.
- Periksa apakah `commitments.maxPerDay` sudah tercapai untuk sesi agen tersebut.
- Ingat bahwa pengingat persis dilewati oleh ekstraksi komitmen dan seharusnya
  muncul di bawah [tugas terjadwal](/id/automation/cron-jobs) sebagai gantinya.

## Terkait

- [Ikhtisar memori](/id/concepts/memory)
- [Active memory](/id/concepts/active-memory)
- [Heartbeat](/id/gateway/heartbeat)
- [Tugas terjadwal](/id/automation/cron-jobs)
- [`openclaw commitments`](/id/cli/commitments)
- [Referensi konfigurasi](/id/gateway/configuration-reference#commitments)
