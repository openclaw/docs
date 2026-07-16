---
read_when:
    - Anda memerlukan catatan permanen tentang tindakan Gateway tanpa menyimpan konten
    - Anda sedang memutuskan apakah akan mengaktifkan audit siklus hidup pesan
    - Anda perlu menjelaskan apa yang dapat dan tidak dapat dibuktikan oleh catatan audit
summary: Riwayat audit khusus metadata untuk proses agen, tindakan alat, dan siklus hidup pesan yang memerlukan persetujuan eksplisit
title: Riwayat audit
x-i18n:
    generated_at: "2026-07-16T18:07:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1005b214a674f0f888d759837bd627be458cefcf9ed61bda722499333361dc45
    source_path: gateway/audit.md
    workflow: 16
---

# Riwayat audit

Gateway menyimpan buku besar audit terbatas yang hanya berisi metadata dalam basis data status bersama OpenClaw. Buku besar ini menjawab pertanyaan operasional seperti "agen mana yang berjalan, kapan, dan bagaimana prosesnya berakhir", "tindakan alat apa yang dijalankan oleh suatu proses", serta, ketika audit pesan diaktifkan, "apakah pesan masuk yang diterima mencapai pengiriman" dan "apakah pesan keluar mencapai status pengiriman terminal".

Buku besar tersebut menyimpan identitas, urutan, asal-usul, tindakan, status, dan kode hasil yang dinormalisasi. Buku besar ini tidak pernah menyimpan prompt, isi pesan, argumen alat, hasil alat, lampiran, nama file, URL, keluaran perintah, atau teks kesalahan mentah.

## Kelompok catatan

Peristiwa proses dan alat dicatat setiap kali audit diaktifkan (secara default). Peristiwa siklus hidup pesan bersifat opsional dan dinonaktifkan secara default.

| Kelompok      | Tindakan                                                 | Default |
| ------------ | -------------------------------------------------------- | ------- |
| Proses agen   | `agent.run.started`, `agent.run.finished`                | aktif   |
| Tindakan alat | `tool.action.started`, `tool.action.finished`            | aktif   |
| Pesan         | `message.inbound.processed`, `message.outbound.finished` | nonaktif |

Setiap catatan memuat id peristiwa yang stabil, urutan buku besar yang monotonik, stempel waktu siklus hidup, pelaku, tindakan, status, `schemaVersion: 1`, dan `redaction: "metadata_only"`. Lihat [Catatan audit](/cli/audit) untuk referensi bidang dan filter kueri lengkap.

## Peristiwa siklus hidup pesan

Atur [`audit.messages`](/id/gateway/configuration-reference#audit) untuk memilih apa yang dicatat, lalu mulai ulang Gateway:

- `off` (default): tidak ada catatan pesan.
- `direct`: hanya pesan dalam percakapan langsung.
- `all`: pesan langsung, grup, dan kanal.

Dua batas otoritatif menghasilkan catatan pesan:

- Baris **masuk** ditulis ketika pesan yang diterima mencapai pengiriman inti, termasuk hasil pemrosesan duplikat dan terminal.
- Baris **keluar** ditulis ketika pengiriman tahan lama bersama mencapai hasil terminal: terkirim, dibatalkan, gagal, atau `unknown` eksplisit untuk pengiriman yang ambigu akibat kerusakan. Pemulihan antrean dan hasil surat mati disertakan. Setiap payload balasan logis asli mendapatkan satu baris terminal; pemotongan menjadi bagian-bagian dan fan-out adaptor digabungkan ke dalam `resultCount`.

### Klasifikasi jenis percakapan

Mode `direct` merupakan batas privasi, sehingga pesan hanya diklasifikasikan sebagai percakapan langsung ketika fakta tujuan membuktikannya: jalur pengiriman menyatakan jenis percakapan tujuan, atau rute sesi pengiriman menyebutkan secara persis kanal dan rekan yang menjadi tujuan pengiriman. Sinyal yang lebih lemah, seperti status kebijakan atau percakapan asal, dapat mengklasifikasikan pesan sebagai `group` (mengecualikannya dari pengumpulan `direct`), tetapi tidak pernah dapat menyatakannya sebagai `direct`. Pesan yang tidak dapat dibuktikan sebagai pesan langsung diklasifikasikan sebagai `unknown` dan tidak dicatat dalam mode `direct`. Oleh karena itu, kanal yang tidak menyatakan jenis obrolan mungkin mencatat lebih sedikit baris dalam mode `direct` dibandingkan dalam mode `all`.

## Model privasi

Baris pesan tidak pernah menyimpan pengidentifikasi platform mentah. Pengidentifikasi akun, percakapan, pesan, dan target, ketika korelasi tersedia, hanya diekspor sebagai pseudonim berkunci yang bersifat lokal untuk instalasi (`hmac-sha256:v1:<keyId>:<digest>`):

- Kunci HMAC dibuat saat pertama kali digunakan, dipisahkan berdasarkan domain untuk setiap jenis pengidentifikasi, dan berada dalam basis data status yang sama dengan buku besar.
- Pseudonim stabil dalam satu instalasi sehingga baris tentang percakapan yang sama dapat dikorelasikan tanpa mengungkapkan pengidentifikasi platform.
- Ini adalah **korelasi, bukan anonimisasi**: siapa pun yang memiliki akses baca ke basis data status juga memiliki kunci dan dapat menguji calon pengidentifikasi mentah terhadap pseudonim tersebut. Ekspor RPC dan CLI tidak pernah menyertakan kunci.
- Jika materi kunci hilang atau rusak sementara baris pesan dipertahankan, Gateway menutup secara aman dan membuang catatan pesan baru, alih-alih secara diam-diam beralih ke kunci baru yang akan memecah korelasi.

Catatan proses dan alat mempertahankan `sessionKey` dan `sessionId` untuk korelasi; kunci sesi kanonis dapat memuat id akun atau rekan platform. Catatan pesan sengaja menghilangkan keduanya.

Ekspor audit tetap merupakan metadata operasional sensitif meskipun tanpa konten: waktu, kanal, hasil, dan pseudonim stabil dapat mengorelasikan aktivitas. Lindungi ekspor dengan kontrol akses dan praktik retensi yang sama seperti catatan operator lainnya.

## Batas cakupan dan pembuktian

Buku besar ini bersifat upaya terbaik dan sengaja dibatasi. Perlakukan buku besar sebagai bukti tentang apa yang dicatat, bukan sebagai bukti tentang apa yang terjadi:

- **Tidak adanya baris tidak membuktikan apa pun.** Pesan masuk yang dibuang sebelum penerimaan, pengiriman dari proses CLI tanpa perekam Gateway yang berjalan, serta jalur lokal Plugin atau pengiriman langsung yang melewati pengiriman tahan lama bersama tidak meninggalkan catatan.
- Penulisan dilakukan melalui pekerja latar belakang terbatas; kegagalan pekerja atau kejenuhan antrean akan membuang catatan dan mencatat satu peringatan operasional.
- Pengiriman keluar yang ambigu akibat kerusakan dicatat sebagai `unknown`, bukan sebagai hasil yang direka.

Buku besar ini mendukung penelusuran kesalahan dan peninjauan operasional. Buku besar ini bukan arsip kepatuhan tanpa kehilangan; jika Anda memerlukannya, gunakan sistem eksternal yang mendapat umpan dari [OpenTelemetry](/id/gateway/opentelemetry) atau peralatan tingkat kanal.

## Penyimpanan, retensi, dan migrasi

Catatan berada dalam basis data status bersama (`state/openclaw.sqlite`) dan ditulis di luar jalur kritis pengiriman. Kueri tidak pernah mengembalikan catatan yang lebih lama dari 30 hari, dan buku besar dibatasi hingga 100,000 baris; baris kedaluwarsa dipangkas selama proses mulai, pemeliharaan per jam, dan penulisan berikutnya. Pemeliharaan retensi tetap berjalan meskipun pengumpulan dinonaktifkan.

Peningkatan dari Gateway dengan buku besar sebelumnya yang hanya mencakup proses/alat akan memigrasikan skema secara otomatis saat proses mulai (atau melalui `openclaw doctor --fix`); baris yang ada beserta urutan buku besarnya dipertahankan.

## Membuat kueri

- CLI: [`openclaw audit`](/cli/audit) dengan filter untuk agen, sesi, proses, jenis, status, arah, kanal, batas waktu, dan pemuatan halaman berbasis kursor.
- RPC Gateway: `audit.activity.list` (memerlukan `operator.read`) mengembalikan gabungan peristiwa aktivitas V1 berversi; RPC `audit.list` yang dirilis tidak berubah untuk klien proses/alat lama. Lihat [Protokol Gateway](/id/gateway/protocol#audit-ledger-rpc).

## Terkait

- [CLI catatan audit](/cli/audit)
- [Referensi konfigurasi](/id/gateway/configuration-reference#audit)
- [Protokol Gateway](/id/gateway/protocol#audit-ledger-rpc)
- [OpenTelemetry](/id/gateway/opentelemetry)
