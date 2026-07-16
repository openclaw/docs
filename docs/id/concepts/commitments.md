---
read_when:
    - Anda ingin OpenClaw mengingat tindak lanjut yang alami
    - Anda ingin memahami perbedaan antara check-in yang disimpulkan dan pengingat
    - Anda ingin meninjau atau membatalkan komitmen tindak lanjut
sidebarTitle: Commitments
summary: Memori tindak lanjut yang disimpulkan untuk check-in yang bukan pengingat persis
title: Komitmen yang disimpulkan
x-i18n:
    generated_at: "2026-07-16T17:58:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4fa3a3654b628b63c5319144d63f122db53fff7170a0c8339e2c5a1147961e35
    source_path: concepts/commitments.md
    workflow: 16
---

Commitment adalah memori tindak lanjut berjangka pendek. Saat diaktifkan, OpenClaw dapat
mengenali bahwa suatu percakapan menciptakan kesempatan untuk menindaklanjuti di masa mendatang dan mengingat
untuk membahasnya kembali nanti.

Contoh:

- Anda menyebutkan wawancara besok. OpenClaw dapat menanyakannya setelah itu.
- Anda mengatakan bahwa Anda kelelahan. OpenClaw dapat bertanya nanti apakah Anda sudah tidur.
- Agen mengatakan akan menindaklanjuti setelah sesuatu berubah. OpenClaw dapat melacak
  hal yang masih terbuka tersebut.

Commitment bukan fakta permanen seperti `MEMORY.md`, dan bukan pengingat
yang pasti. Commitment berada di antara memori dan otomatisasi: OpenClaw mengingat kewajiban
yang terikat pada percakapan, lalu Heartbeat menyampaikannya saat waktunya tiba.

## Mengaktifkan commitment

Commitment dinonaktifkan secara default (`commitments.enabled: false`). Aktifkan dalam konfigurasi:

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

`commitments.maxPerDay` membatasi jumlah tindak lanjut yang disimpulkan yang dapat disampaikan
per sesi agen dalam periode satu hari bergulir. Nilai defaultnya adalah `3`.

## Cara kerjanya

Setelah agen membalas, OpenClaw dapat menjalankan proses ekstraksi latar belakang tersembunyi dalam
konteks terpisah, dengan alat dinonaktifkan. Proses tersebut hanya mencari commitment tindak lanjut yang disimpulkan. Proses ini
tidak menulis ke percakapan yang terlihat dan tidak meminta agen utama
untuk melakukan penalaran tentang ekstraksi tersebut.

Saat menemukan kandidat dengan tingkat keyakinan tinggi, OpenClaw menyimpan commitment yang berisi:

- ID agen
- kunci sesi
- saluran asli dan target pengiriman
- rentang waktu jatuh tempo
- saran singkat untuk menindaklanjuti
- metadata noninstruksional agar Heartbeat dapat memutuskan apakah akan mengirimkannya

Pengiriman dilakukan melalui Heartbeat. Saat commitment jatuh tempo, Heartbeat
menambahkan commitment tersebut ke giliran Heartbeat untuk agen dan cakupan saluran yang sama.
Prompt memperingatkan secara eksplisit bahwa metadata commitment tidak tepercaya dan menginstruksikan
model agar tidak mengikuti instruksi di dalamnya atau menggunakan alat karena metadata tersebut.
Model dapat mengirim satu tindak lanjut yang alami atau membalas `HEARTBEAT_OK` untuk mengabaikannya.
Jika Heartbeat dikonfigurasi dengan `target: "none"`, commitment yang jatuh tempo tetap
bersifat internal dan tidak mengirim tindak lanjut eksternal. Prompt pengiriman commitment tidak
memutar ulang teks percakapan asli, melainkan hanya saran tindak lanjut dan
metadata, dan giliran Heartbeat untuk commitment yang jatuh tempo dijalankan tanpa alat OpenClaw.

OpenClaw tidak pernah menyampaikan commitment yang disimpulkan segera setelah menyimpannya.
Waktu jatuh tempo dibatasi agar setidaknya satu interval Heartbeat setelah commitment
dibuat, sehingga tindak lanjut tidak dapat langsung menggema kembali pada saat yang sama ketika
disimpulkan.

## Cakupan

Commitment dibatasi pada konteks agen dan saluran yang sama persis dengan tempat commitment tersebut
dibuat. Tindak lanjut yang disimpulkan saat berbicara dengan satu agen di Discord tidak
disampaikan oleh agen lain, saluran lain, atau sesi yang tidak terkait.

Cakupan ini merupakan bagian dari fitur tersebut. Tindak lanjut yang alami harus terasa seperti
kelanjutan percakapan yang sama, bukan seperti sistem pengingat global.

## Commitment dibandingkan dengan pengingat

| Kebutuhan                                       | Gunakan                                  |
| ----------------------------------------------- | ---------------------------------------- |
| "Ingatkan saya pukul 3 sore"                    | [Tugas terjadwal](/id/automation/cron-jobs) |
| "Hubungi saya dalam 20 menit"                   | [Tugas terjadwal](/id/automation/cron-jobs) |
| "Jalankan laporan ini setiap hari kerja"        | [Tugas terjadwal](/id/automation/cron-jobs) |
| "Saya punya wawancara besok"                    | Commitment                               |
| "Saya terjaga sepanjang malam"                  | Commitment                               |
| "Tindak lanjuti jika saya tidak menjawab utas terbuka ini" | Commitment                     |

Permintaan pengguna yang pasti sudah termasuk dalam jalur penjadwal. Commitment hanya
ditujukan untuk tindak lanjut yang disimpulkan: momen ketika pengguna tidak meminta pengingat,
tetapi percakapan tersebut jelas menciptakan tindak lanjut mendatang yang bermanfaat.

## Mengelola commitment

Gunakan CLI untuk memeriksa dan menghapus commitment yang tersimpan:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Lihat [`openclaw commitments`](/id/cli/commitments) untuk referensi perintah lengkap.

## Privasi dan biaya

Ekstraksi commitment menggunakan proses LLM, sehingga mengaktifkannya menambah penggunaan model
di latar belakang setelah giliran yang memenuhi syarat. Proses tersebut disembunyikan dari percakapan
yang terlihat oleh pengguna, tetapi dapat membaca percakapan terbaru yang diperlukan untuk menentukan apakah
terdapat tindak lanjut.

Commitment yang tersimpan adalah memori operasional OpenClaw lokal dalam basis data status SQLite
bersama, bukan memori jangka panjang. Nonaktifkan fitur tersebut dengan:

```bash
openclaw config set commitments.enabled false
```

## Pemecahan masalah

Jika tindak lanjut yang diharapkan tidak muncul:

- Pastikan `commitments.enabled` bernilai `true`.
- Periksa `openclaw commitments --all` untuk menemukan catatan yang tertunda, diabaikan, ditunda, atau kedaluwarsa.
- Pastikan Heartbeat berjalan untuk agen tersebut.
- Periksa apakah `commitments.maxPerDay` sudah tercapai untuk
  sesi agen tersebut.
- Ingat bahwa pengingat yang pasti dilewati oleh ekstraksi commitment dan seharusnya
  muncul di bawah [tugas terjadwal](/id/automation/cron-jobs).

## Terkait

- [Ikhtisar memori](/id/concepts/memory)
- [Active Memory](/id/concepts/active-memory)
- [Heartbeat](/id/gateway/heartbeat)
- [Tugas terjadwal](/id/automation/cron-jobs)
- [`openclaw commitments`](/id/cli/commitments)
- [Referensi konfigurasi](/id/gateway/configuration-reference#commitments)
