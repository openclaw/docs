---
read_when:
    - Anda ingin OpenClaw mengingat tindak lanjut yang alami
    - Anda ingin memahami perbedaan antara check-in yang disimpulkan dan pengingat
    - Anda ingin meninjau atau mengabaikan komitmen tindak lanjut
sidebarTitle: Commitments
summary: Memori tindak lanjut yang disimpulkan untuk check-in yang bukan pengingat persis
title: Komitmen yang disimpulkan
x-i18n:
    generated_at: "2026-07-12T14:08:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4708cd337c7755a4f16e14154050dc43b6033e71bfda9de5e8fdaa9c6ce0277
    source_path: concepts/commitments.md
    workflow: 16
---

Komitmen adalah ingatan tindak lanjut berjangka pendek. Saat diaktifkan, OpenClaw dapat
mengenali bahwa suatu percakapan menciptakan peluang untuk menghubungi kembali di masa mendatang dan mengingat
untuk membahasnya lagi nanti.

Contoh:

- Anda menyebutkan wawancara besok. OpenClaw mungkin menghubungi Anda setelahnya.
- Anda mengatakan bahwa Anda kelelahan. OpenClaw mungkin bertanya nanti apakah Anda sudah tidur.
- Agen mengatakan akan menindaklanjuti setelah sesuatu berubah. OpenClaw mungkin melacak
  hal yang belum dituntaskan tersebut.

Komitmen bukanlah fakta tahan lama seperti `MEMORY.md`, dan bukan pula pengingat
yang presisi. Komitmen berada di antara ingatan dan otomatisasi: OpenClaw mengingat
kewajiban yang terikat pada percakapan, lalu Heartbeat menyampaikannya saat waktunya tiba.

## Mengaktifkan komitmen

Komitmen dinonaktifkan secara default (`commitments.enabled: false`). Aktifkan dalam konfigurasi:

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

Padanan dalam `openclaw.json`:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` membatasi jumlah tindak lanjut tersimpul yang dapat disampaikan
per sesi agen dalam periode satu hari berjalan. Nilai defaultnya adalah `3`.

## Cara kerjanya

Setelah agen membalas, OpenClaw dapat menjalankan tahap ekstraksi latar belakang tersembunyi dalam
konteks terpisah, dengan alat dinonaktifkan. Tahap tersebut hanya mencari komitmen tindak lanjut tersimpul. Tahap ini
tidak menulis ke percakapan yang terlihat dan tidak meminta agen utama
untuk menalar proses ekstraksi.

Saat menemukan kandidat dengan tingkat keyakinan tinggi, OpenClaw menyimpan komitmen yang berisi:

- ID agen
- kunci sesi
- kanal asli dan target pengiriman
- rentang waktu jatuh tempo
- saran singkat untuk menghubungi kembali
- metadata noninstruksional agar Heartbeat dapat memutuskan apakah akan mengirimkannya

Pengiriman berlangsung melalui Heartbeat. Saat komitmen jatuh tempo, Heartbeat
menambahkan komitmen tersebut ke giliran Heartbeat untuk cakupan agen dan kanal yang sama.
Prompt secara eksplisit memperingatkan bahwa metadata komitmen tidak tepercaya dan menginstruksikan
model agar tidak mengikuti instruksi di dalamnya atau menggunakan alat karenanya. Model
dapat mengirim satu pesan tindak lanjut yang wajar atau membalas `HEARTBEAT_OK` untuk mengabaikannya.
Jika Heartbeat dikonfigurasi dengan `target: "none"`, komitmen yang jatuh tempo tetap
bersifat internal dan tidak mengirim pesan tindak lanjut eksternal. Prompt pengiriman komitmen tidak
memutar ulang teks percakapan asli, melainkan hanya saran pesan tindak lanjut dan
metadata, dan giliran Heartbeat untuk komitmen yang jatuh tempo dijalankan tanpa alat OpenClaw.

OpenClaw tidak pernah menyampaikan komitmen tersimpul segera setelah menyimpannya.
Waktu jatuh tempo dibatasi agar setidaknya satu interval Heartbeat setelah komitmen
dibuat, sehingga tindak lanjut tidak dapat langsung bergema kembali pada saat yang sama ketika
komitmen tersebut disimpulkan.

## Cakupan

Komitmen dibatasi pada konteks agen dan kanal yang persis sama dengan tempat komitmen tersebut
dibuat. Tindak lanjut yang disimpulkan saat berbicara dengan satu agen di Discord tidak
disampaikan oleh agen lain, kanal lain, atau sesi yang tidak terkait.

Cakupan ini merupakan bagian dari fitur. Pesan tindak lanjut yang alami seharusnya terasa seperti kelanjutan
percakapan yang sama, bukan seperti sistem pengingat global.

## Komitmen dibandingkan dengan pengingat

| Kebutuhan                                             | Gunakan                                  |
| ----------------------------------------------------- | ---------------------------------------- |
| "Ingatkan saya pukul 15.00"                           | [Tugas terjadwal](/id/automation/cron-jobs) |
| "Hubungi saya dalam 20 menit"                         | [Tugas terjadwal](/id/automation/cron-jobs) |
| "Jalankan laporan ini setiap hari kerja"              | [Tugas terjadwal](/id/automation/cron-jobs) |
| "Saya ada wawancara besok"                            | Komitmen                                 |
| "Saya terjaga sepanjang malam"                        | Komitmen                                 |
| "Tindak lanjuti jika saya tidak menjawab utas terbuka ini" | Komitmen                            |

Permintaan pengguna yang presisi sudah termasuk dalam jalur penjadwal. Komitmen hanya
digunakan untuk tindak lanjut tersimpul: momen ketika pengguna tidak meminta pengingat,
tetapi percakapan tersebut jelas menciptakan peluang tindak lanjut yang berguna di masa mendatang.

## Mengelola komitmen

Gunakan CLI untuk memeriksa dan menghapus komitmen yang tersimpan:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Lihat [`openclaw commitments`](/id/cli/commitments) untuk referensi perintah lengkap.

## Privasi dan biaya

Ekstraksi komitmen menggunakan tahap LLM, sehingga mengaktifkannya menambah penggunaan model
di latar belakang setelah giliran yang memenuhi syarat. Tahap ini disembunyikan dari percakapan
yang terlihat oleh pengguna, tetapi dapat membaca percakapan terbaru yang diperlukan untuk menentukan apakah
terdapat tindak lanjut.

Komitmen yang tersimpan adalah status lokal OpenClaw. Komitmen merupakan ingatan operasional, bukan
ingatan jangka panjang. Nonaktifkan fitur dengan:

```bash
openclaw config set commitments.enabled false
```

## Pemecahan masalah

Jika tindak lanjut yang diharapkan tidak muncul:

- Pastikan `commitments.enabled` bernilai `true`.
- Periksa `openclaw commitments --all` untuk catatan yang tertunda, diabaikan, ditunda, atau kedaluwarsa.
- Pastikan Heartbeat berjalan untuk agen tersebut.
- Periksa apakah `commitments.maxPerDay` sudah tercapai untuk
  sesi agen tersebut.
- Ingat bahwa pengingat yang presisi dilewati oleh ekstraksi komitmen dan seharusnya
  muncul di bawah [tugas terjadwal](/id/automation/cron-jobs).

## Terkait

- [Ikhtisar ingatan](/id/concepts/memory)
- [Active Memory](/id/concepts/active-memory)
- [Heartbeat](/id/gateway/heartbeat)
- [Tugas terjadwal](/id/automation/cron-jobs)
- [`openclaw commitments`](/id/cli/commitments)
- [Referensi konfigurasi](/id/gateway/configuration-reference#commitments)
