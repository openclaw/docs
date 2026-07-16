---
read_when:
    - Anda ingin agen menyadari ketika manusia atau agen lain mengubah sesi tanpa sepengetahuan mereka
    - Anda sedang men-debug pemberitahuan perubahan status, kursor pemantauan, atau session_status changesSince
    - Anda ingin memahami cara agen induk tetap tersinkronisasi dengan sesi turunan
sidebarTitle: Session state awareness
summary: 'Log sinyal status sesi persisten: versi status, pemantau, pemberitahuan status kedaluwarsa, dan rekonsiliasi'
title: Kesadaran status sesi
x-i18n:
    generated_at: "2026-07-16T18:01:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bb4126a0802e1ca4418f225c792490493a78886089b81c3b4567f72090ce34f4
    source_path: concepts/session-state.md
    workflow: 16
---

Ketika beberapa sesi mengerjakan masalah yang sama — seorang manajer mendelegasikan kepada anak, manusia masuk langsung ke sesi pekerja, dua agen berkoordinasi melalui [`sessions_send`](/id/concepts/session-tool) — setiap sesi membangun asumsi tentang sesi lainnya. Asumsi tersebut menjadi usang begitu aktor lain ikut campur. Kesadaran status sesi adalah mekanisme yang mendeteksi intervensi tersebut, memberi tahu sesi yang terdampak satu kali, dan memberinya cara yang ringan untuk mengejar ketertinggalan sebelum bertindak.

Tiga bagian bekerja bersama:

1. Sebuah **log sinyal persisten** mencatat perubahan status tertentu per sesi.
2. **Pengamat** menyimpan kursor per target dan menerima satu pemberitahuan status usang yang digabungkan.
3. **Rekonsiliasi** mengambil delta yang tepat melalui `session_status` dengan `changesSince`.

## Log sinyal

OpenClaw menambahkan peristiwa bertipe ke basis data status bersama (`session_state_events`) ketika sesi yang diamati mengalami perubahan penting. Peristiwa membawa metadata dan ringkasan satu baris — tidak pernah memuat isi pesan.

| Jenis                  | Dicatat ketika                                            | Memberi tahu pengamat |
| ---------------------- | -------------------------------------------------------- | ----------------- |
| `human_direct_message` | Manusia mengirim giliran langsung ke sesi yang diamati       | Ya               |
| `upstream_missing`     | Sumber hulu sesi yang diadopsi menghilang          | Ya               |
| `goal_changed`         | Status tujuan sesi dibuat, diperbarui, atau dihapus | Ya               |
| `child_spawned`        | Sesi anak subagen atau ACP dibuat              | Tidak (menginisialisasi kursor) |
| `run_completed`        | Eksekusi anak berakhir dengan sukses                            | Tidak (hanya log)     |
| `run_failed`           | Eksekusi anak gagal, kehabisan waktu, atau dibatalkan            | Tidak (hanya log)     |
| `compacted`            | Riwayat sesi dipadatkan                       | Tidak (hanya log)     |
| `adopted`              | Sesi katalog diadopsi ke OpenClaw               | Tidak (hanya log)     |

Setiap peristiwa menyebutkan aktornya (`human`, `agent`, atau `system`). Eksekusi anak yang dibatalkan dan kehabisan waktu dicatat sebagai kegagalan dengan hasil yang tepat (`cancelled`, `timeout`, atau `error`) dipertahankan dalam muatan peristiwa.

**Versi status** sebuah sesi hanyalah nomor urutan tertinggi dalam lognya, yang dilacak dalam kepala per sesi persisten dan tetap bertahan setelah pemangkasan. Baris `sessions_list` menyertakan `stateVersion` ketika sebuah sesi telah mencatat perubahan; `session_status` selalu melaporkannya.

Jenis yang hanya dicatat dalam log tersedia untuk riwayat rekonsiliasi, bukan pemberitahuan: penyampaian penyelesaian eksekusi anak biasa tetap dimiliki oleh [pengumuman subagen](/id/tools/subagents), dan log sinyal tidak pernah menduplikasinya.

## Pengamat

Pengamat adalah sesi yang menyimpan kursor (`session_watch_cursors`) pada target. Kursor berasal dari dua tempat:

- **Implisit (relasi pemijahan).** Ketika sebuah sesi membuat subagen atau anak ACP, kursor induk diinisialisasi secara otomatis pada versi pemijahan anak. Induk tidak pernah berlangganan secara manual.
- **Eksplisit (`sessions_send watch: true`).** Koordinator apa pun dapat mengamati target yang tidak dibuat olehnya: teruskan `watch: true` pada `sessions_send`, dan setelah pengiriman berhasil didistribusikan, pengirim didaftarkan sebagai pengamat sesi yang benar-benar menerima pesan tersebut. Pendaftaran dimulai pada versi status target saat ini — riwayat sebelumnya tidak pernah menghasilkan pemberitahuan. Hasil alat melaporkan `watched: true|false` ketika parameter ditetapkan.

Identitas pengamat harus berupa kunci sesi yang memenuhi syarat agen. Di bawah `session.scope="global"`, kunci `global` bersama bersifat ambigu di antara agen, sehingga sesi tersebut mendapatkan log persisten dan `changesSince`, tetapi tidak mendapatkan pemberitahuan proaktif.

Pengamatan dibersihkan secara otomatis: baris kursor kedaluwarsa mengikuti retensi log sinyal, dihapus ketika sesi pengamat diatur ulang, dan dihapus bersama salah satu sesi. Tidak ada verba untuk berhenti mengamati dalam v1.

Sesi yang diamati dan diadopsi dari katalog sesi diperiksa pada interval tetap untuk mendeteksi aktivitas manusia langsung di sisi hulu. Aktivitas yang terdeteksi memasuki log sinyal dan alur pengamat yang sama seperti giliran manusia langsung lainnya.

Jika sumber hulu sesi yang diadopsi dihapus secara eksternal, tiga pemeriksaan berturut-turut yang tidak menemukannya (sekitar tiga tick pemantauan) menghasilkan satu sinyal `upstream_missing` bagi pengamatnya dan menghapus tautan hulu. Melanjutkan sesi katalog tersebut kembali akan membuat tautan baru.

## Pemberitahuan: satu, bukan banyak

Ketika peristiwa yang memenuhi syarat pemberitahuan masuk dan kursor pengamat tertinggal, pengamat menerima satu pemberitahuan sistem pada giliran berikutnya:

```
Sesi "agent:main:subagent:child" berubah (aktor lain). Lakukan rekonsiliasi sebelum bertindak: session_status sessionKey "agent:main:subagent:child" changesSince 12.
```

Pengamat sesi utama juga segera dibangunkan melalui pemicu heartbeat; pengamat subagen bertingkat mendapatkan pemberitahuan pada giliran berikutnya.

Protokol ini sengaja dirancang untuk mencegah spam:

- **Satu pemberitahuan tertunda per pasangan pengamat/target.** Teks pemberitahuan stabil per byte selama tertunda dan antrean peristiwa sistem melakukan deduplikasi berdasarkan teks tersebut, sehingga dua puluh perubahan cepat pada target yang sama tetap hanya menghasilkan satu baris dalam prompt pengamat.
- **Batas air beku.** Kursor membekukan posisi yang telah diberi tahu ketika pemberitahuan dimasukkan ke antrean. Peristiwa penting berikutnya hanya memajukan batas air penting; peristiwa tersebut tidak memicu pemberitahuan ulang.
- **Konfirmasi saat dikonsumsi, buka kembali hanya untuk pekerjaan yang berselang-seling.** Ketika giliran pengamat mengonsumsi pemberitahuan, kursor bergerak maju. Jika lebih banyak peristiwa penting tiba di antara pengantrean dan pengonsumsian, tepat satu pemberitahuan baru dibuka untuk sisanya.
- **Supresi diri.** Pengamat tidak pernah mendapat pemberitahuan tentang peristiwa yang disebabkannya sendiri.
- **Pemulihan setelah mulai ulang.** Pemberitahuan tertunda berada dalam antrean dalam memori; pemindaian saat startup mewujudkannya kembali dari kursor persisten setelah Gateway dimulai ulang.

## Melakukan rekonsiliasi

Pemberitahuan memberi tahu pengamat secara tepat apa yang harus dilakukan. `session_status` dengan `changesSince: <version>` mengembalikan peristiwa bertipe setelah versi tersebut (hingga 200), tanpa memajukan kursor apa pun:

```json
{
  "stateVersion": 19,
  "stateChanges": {
    "events": [
      {
        "sequence": 14,
        "kind": "human_direct_message",
        "actorType": "human",
        "summary": "pesan manusia melalui telegram"
      },
      { "sequence": 19, "kind": "goal_changed", "actorType": "human", "summary": "tujuan diperbarui" }
    ],
    "historyGap": false
  }
}
```

`historyGap: true` berarti versi yang diminta mendahului riwayat yang dipertahankan — segarkan seluruh status sesi (`sessions_history`, `session_status`) alih-alih memperlakukan respons sebagai delta yang tepat. Sinyal kesenjangan bersifat pasti: sinyal tersebut berasal dari batas air pemangkasan per sesi, bukan disimpulkan dari aritmetika urutan.

## Penyimpanan dan batas

Riwayat berada dalam basis data status bersama, dibatasi hingga 30 hari dan 50.000 baris; kepala per sesi tetap monoton setelah pemangkasan. Pencatatan dilakukan dengan upaya terbaik — penambahan yang gagal dicatat dalam log dan tidak pernah menggagalkan giliran asal — sehingga `stateVersion` adalah kepala log sinyal, bukan versi pengambilan data perubahan transaksional.

Batas saat ini:

- Penyampaian pemberitahuan mengasumsikan satu proses Gateway memiliki basis data status bersama. Beberapa Gateway berbagi log persisten dan `changesSince`, tetapi v1 tidak mendorong pemberitahuan lintas proses.
- Peristiwa Compaction mencakup pemilik Compaction runtime tertanam; Compaction yang hanya dilakukan oleh harness native tidak dicatat sepenuhnya.
- Detail muatan hasil pembatalan saat ini dihasilkan oleh eksekusi anak ACP; pembatalan subagen native ditampilkan sebagai kegagalan umum.
- Deteksi gema diri hulu membandingkan teks pengguna yang dinormalisasi. Prompt eksternal yang cocok dengan salah satu dari 10 pesan pengguna terbaru di sisi OpenClaw dalam sesi dianggap sebagai gema diri.
- Satu baris JSONL Claude lokal yang lebih besar dari batas pemindaian 1 MiB per interval memblokir kursor sesi tersebut dalam v1; byte yang belum diklasifikasikan tidak pernah dilewati.
- Pemeriksaan Claude pada Node berpasangan mengklasifikasikan 50 item transkrip terbaru per interval. Lonjakan yang lebih besar dapat berada di luar jendela pemindaian v1.
- Pembacaan riwayat Claude pada Node berpasangan tidak mengekspos hasil definitif bahwa utas tidak ditemukan, sehingga penghapusan Claude jarak jauh tidak diklasifikasikan sebagai `upstream_missing` dalam v1.
- Sesi katalog yang belum diadopsi tetap berada di luar lapisan kesadaran dalam v1.
- Sesi yang diadopsi sebelum fitur ini tidak membawa tautan hulu; lanjutkan sesi tersebut dari katalog satu kali untuk memulai pemantauan hulu.
- Tautan hulu mengasumsikan setiap kunci sesi yang diadopsi dipetakan ke satu agen pemilik (adopsi menggunakan agen penyimpanan default). Adopsi multiagen atas utas eksternal yang sama tidak dipantau dalam v1.

## Terkait

- [Alat sesi](/id/concepts/session-tool) — `sessions_send`, `session_status`, `sessions_list`
- [Subagen](/id/tools/subagents) — relasi pemijahan dan pengumuman penyelesaian
- [Heartbeat](/id/gateway/heartbeat) — cara pemberitahuan dalam antrean membangunkan sesi utama
- [Pengelolaan sesi](/id/concepts/session) — kunci sesi, cakupan, siklus hidup
