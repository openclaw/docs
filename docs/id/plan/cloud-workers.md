---
read_when:
    - Merancang atau mengimplementasikan penyediaan worker cloud, mode worker, atau serah terima sesi
    - Mengubah environments.*, protokol worker, penyerapan transkrip, atau RPC proksi inferensi
    - Meninjau postur keamanan eksekusi agen jarak jauh
summary: Jalankan sesi agen pada mesin sementara yang dapat dijangkau melalui SSH, dengan inferensi yang diproksikan oleh Gateway dan streaming langsung di bilah samping.
title: Rencana worker cloud
x-i18n:
    generated_at: "2026-07-12T14:21:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 134c3f6e486837607225d95d12a3153525b14237b362b9f9957313d9bc379dc4
    source_path: plan/cloud-workers.md
    workflow: 16
---

## Status

Proposal, revisi 3. Belum diimplementasikan. Arah disepakati pada 2026-07; revisi 2 menggabungkan temuan tinjauan adversarial (protokol pekerja khusus, mesin status penempatan/lingkungan, sinkronisasi masuk yang sadar Git, serah-terima v1 satu arah, redaksi keamanan untuk egress terkendali). Revisi 3 menetapkan model kepemilikan sinkronisasi (pekerja membuat commit, Gateway mengadopsi dan memublikasikannya), menambahkan mode sinkronisasi biasa tanpa Git, memperbaiki eksekusi pekerja menjadi penuh di dalam mesin, memindahkan kebijakan internet ke waktu penyediaan, dan mengembalikan pengiriman agen ke tonggak 3.

## Masalah

Sesi agen OpenClaw menjalankan loop, alat, dan inferensinya di dalam proses Gateway pada satu mesin. Komputasi dibatasi oleh mesin tersebut, tugas berdurasi panjang menyibukkannya, dan pekerjaan paralel saling memperebutkan sumber dayanya. Produk terkelola (agen cloud Cursor, Claude Code di web, cloud Codex) mengatasi hal ini dengan sandbox cloud sementara per tugas, tetapi memerlukan infrastruktur dan kepercayaan terhadap vendor.

Operator yang telah memiliki mesin cadangan (atau dapat menyewanya dengan murah) tidak memiliki cara untuk mengatakan: jalankan sesi ini di sana, tampilkan di bilah sisi saya seperti sesi lainnya, lalu buang mesin tersebut setelahnya.

## Tujuan

- Menjalankan sesi agen lengkap (loop + alat) pada mesin jarak jauh sementara ("pekerja cloud"), sementara sesi tersebut muncul dan melakukan streaming di Control UI persis seperti sesi lokal.
- Tidak ada kredensial tetap pada pekerja (tanpa autentikasi penyedia, tanpa token forge) dan tanpa egress jaringan langsung; mesin hanya memerlukan sshd yang dapat dijangkau.
- Menyediakan, menyinkronkan, menjalankan, mengumpulkan, menghancurkan — sepenuhnya otomatis dan dapat menggunakan berbagai penyedia (penyedia pertama: CLI penyewaan bergaya Crabbox).
- Mengirim pekerjaan yang sedang berjalan dari Gateway ke pekerja pada batas giliran tanpa kehilangan transkrip, identitas sesi, atau (ketika byte permintaan tetap ekuivalen) afinitas cache penyedia; menarik hasil kembali dengan aman.
- Baik manusia (UI) maupun agen (alat) dapat mengirim pekerjaan ke pekerja cloud.
- Mendukung sesi yang berlangsung berhari-hari; masa aktif ditentukan oleh kebijakan, bukan batas yang ditulis secara permanen.

## Bukan tujuan (v1)

- Tidak ada perangkat kerja pengodean eksternal (Claude Code, Codex CLI) pada pekerja. Sesi pekerja hanya menjalankan runner tertanam OpenClaw. Dukungan perangkat kerja merupakan opsi eksplisit v2 karena perangkat kerja melakukan inferensinya sendiri dengan kredensialnya sendiri.
- Tidak ada penyebaran percobaan paralel / terbaik-dari-N.
- Tidak ada dependensi VPN/tailnet. Transportasi hanya menggunakan SSH.
- Tidak ada runtime sandbox baru. Mesin pekerja merupakan batas isolasi; sandboxing OS di dalam mesin dapat ditambahkan nanti.
- Tidak ada migrasi langsung simetris di v1: pengiriman berlangsung dari lokal → pekerja; pekerja → lokal memerlukan sesi yang dihentikan serta rekonsiliasi ruang kerja yang telah selesai. Serah-terima dua arah secara langsung nantinya dibangun menggunakan mekanisme penghalang yang sama.
- Tidak ada status sampingan JSON pada Gateway; status lingkungan, penempatan, kursor, dan izin berada di SQLite.

## Karya terdahulu (yang kita salin, yang kita balik)

- Agen cloud Cursor: loop agen berjalan di cloud mereka; VM menjadi target eksekusi alat; penyimpanan percakapan hanya-tambah di-streaming ke semua klien; mulai hangat melalui snapshot-setelah-instalasi; pekerja yang dihosting sendiri merupakan proses pekerja yang hanya melakukan koneksi keluar. Kita menyalin model "sumber kebenaran percakapan tetap berada pada orkestrator" dan streaming; kita membalik penempatan loop (lihat keputusan di bawah).
- Cloud Codex: runtime dua fase — fase penyiapan berjaringan, lalu fase agen luring dengan rahasia dihapus; cache status kontainer untuk tindak lanjut cepat. Kita menyalin pemisahan fase sebagai postur egress dan gagasan cache untuk citra hangat v2.
- Claude Code di web: VM per sesi; proksi Git yang mengisolasi kredensial (token asli tidak pernah memasuki sandbox, push dibatasi ke cabang sesi); snapshot sistem berkas setelah penyiapan; serah-terima teleportasi = cabang yang didorong + riwayat yang diputar ulang. Kita menyalin isolasi kredensial dan kerangka serah-terima, tetapi sinkronisasi keluar menggunakan rsync dari Gateway sehingga pohon kerja kotor tetap berfungsi dan tidak ada token forge di mana pun dekat mesin.
- Agen pengodean Copilot: egress ditolak secara default dengan daftar izin registri paket. Standar status stabil kita lebih ketat (sama sekali tidak ada egress langsung) karena inferensi dan pencarian web tiba melalui terowongan SSH — tetapi lihat Keamanan untuk alasan hal ini disebut "egress terkendali", bukan "tanpa egress".

## Keputusan arsitektur: loop pada pekerja, inferensi melalui Gateway

Tiga penempatan dipertimbangkan:

1. Loop tetap pada Gateway, pekerja mengeksekusi alat (model Cursor). Domain kegagalan paling aman (transkrip, inferensi, persetujuan, dan pemulihan mulai ulang semuanya tetap lokal) serta menjadi tonggak pertama yang diutamakan peninjau. Ditolak sebagai arsitektur produk: alat non-eksekusi OpenClaw merupakan operasi sistem berkas dalam proses, sehingga setiap pembacaan/pengeditan/pencarian berkas menjadi perjalanan pulang-pergi jaringan atau memerlukan pemfaktoran ulang permukaan alat secara besar-besaran menjadi RPC ruang kerja berbutir kasar; perilaku runtime banyak berkomunikasi dan dibatasi latensi. Kita menggunakan semangatnya kembali di tempat yang sudah tersedia (pengalihan eksekusi ke Node), tetapi tidak membangun lapisan pengendalian alat jarak jauh.
2. Loop dan inferensi keduanya berada pada pekerja. Domain kegagalan paling sederhana, tetapi kredensial model (termasuk profil OAuth) harus dikirim ke mesin sekali pakai, Gateway kehilangan kendali kebijakan/perutean/audit, dan migrasi mengganti identitas pemanggil penyedia sehingga membatalkan cache penyedia.
3. Loop + alat pada pekerja, panggilan model diproksikan melalui Gateway. Dipilih. Satu perjalanan pulang-pergi per giliran model, bukan per panggilan alat; alat berjalan di dekat kode; Gateway tetap menjadi satu-satunya pemilik profil autentikasi, perutean penyedia, dan kebijakan; pekerja tidak menyimpan rahasia.

Biaya opsi 3 adalah dependensi sinkron terhadap Gateway selama setiap giliran model, sehingga aturan ketahanannya menjadi bagian dari keputusan, bukan pertimbangan belakangan:

- Hilangnya Gateway di tengah giliran menyebabkan panggilan penyedia aktif gagal. Giliran ditandai gagal dan dicoba kembali sebagai giliran baru setelah tersambung kembali; tidak ada pemutaran ulang transparan terhadap streaming penyedia yang sedang berlangsung (risiko penagihan ganda/panggilan alat ganda).
- Setiap operasi pekerja↔Gateway membawa identitas tahan lama (lihat Protokol pekerja), sehingga penyambungan kembali melanjutkan atau mengambil hasil terminal yang disimpan dalam cache, bukan membiarkannya menggantung.
- Gateway merupakan komponen dengan kapasitas yang dikelola: batas pekerja bersamaan, kendali aliran, dan pelepasan beban termasuk dalam cakupan v1 (lihat Kapasitas).

Karena Gateway menyimpan transkrip sekaligus memulai seluruh lalu lintas penyedia, sesi tidak bergantung pada lokasi: memindahkan loop antara Gateway dan pekerja tidak mengubah apa pun di sisi penyedia maupun jalur data UI. Inilah yang membuat pengiriman dan penarikan kembali murah.

## Komponen

### 1. Mesin status lingkungan + kontrak penyedia

`environments.*` dalam protokol Gateway saat ini hanya merupakan proyeksi status. Inti tahan lamanya adalah rekaman lingkungan dan mesin status milik SQLite, yang dirancang sebelum bentuk RPC:

`requested → provisioning → bootstrapping → ready → (attached|idle) → draining → destroying → destroyed | failed | orphaned`

- Penyediaan aman terhadap crash: baris intensi dipersistenkan sebelum panggilan penyedia, dengan id operasi deterministik, sehingga mulai ulang Gateway dapat mengadopsi penyewaan yang sedang berlangsung alih-alih melakukan penyediaan ganda atau menelantarkan mesin berbayar.
- Rekonsiliasi saat mulai ulang dan pembersih sumber daya telantar (`inspect` penyedia dibandingkan rekaman lokal) merupakan persyaratan v1, bukan pengerasan tambahan.

Kontrak penyedia (diimplementasikan Plugin; tanpa nama penyedia atau kebijakan di inti):

```ts
type WorkerProvider = {
  id: string;
  provision(profile: WorkerProfile, opId: string): Promise<WorkerLease>; // → ssh host/port/user/key material
  inspect(lease: { leaseId: string; profile: WorkerProfile }): Promise<LeaseStatus>; // adopt/health/orphan sweep
  renew?(leaseId: string): Promise<void>; // long-lived sessions vs provider TTLs
  destroy(lease: { leaseId: string; profile: WorkerProfile }): Promise<void>; // idempotent, returns only on proof of teardown
};
```

RPC: `environments.create`, `environments.destroy`, `environments.list/status` yang diperluas (penyedia, id penyewaan, status, usia, waktu menganggur, sesi terlampir). Penyedia pertama: pembungkus CLI penyewaan berbentuk Crabbox (jalur produk) dan penyedia host SSH statis yang ditandai hanya untuk pengembangan — pekerja pada host bersama dapat membaca data host lain yang tidak terkait, sehingga host statis ditujukan untuk pengembangan fitur, bukan postur default.

### 2. Bootstrap pekerja: instal OpenClaw pada mesin

Tidak ada artefak pekerja khusus dan tidak bergantung pada ketersediaan npm:

- Instalasi kanonis untuk semua mode: bundel pekerja dengan hash konten yang dibuat Gateway (keluaran build milik Gateway sendiri yang dikemas sebagai tarball), didorong melalui SSH dan diinstal pada mesin. Dengan sendirinya, ini mencakup build pengembangan dan commit yang belum dirilis.
- `npm i -g openclaw@<exact gateway version>` merupakan pengoptimalan ketika Gateway menjalankan versi yang telah dirilis; jangan pernah menggunakan `latest`.
- Bootstrap bersifat idempoten; penyewaan hangat dengan hash bundel yang cocok melewati instalasi. Mesin mentah mungkin memerlukan fase rantai alat berjaringan (runtime Node) — bagian dari fase penyiapan, lalu ditutup setelahnya.
- Jabat tangan memverifikasi hash build pekerja, kumpulan fitur protokol, dan kompatibilitas runtime. Pemeriksaan versi/protokol Gateway yang ada tidak memadai untuk hal ini (Node yang diterowongkan melalui SSH dikecualikan dari penolakan versi persis), sehingga penerimaan pekerja melakukan pemeriksaan build persisnya sendiri.

Mode pekerja (`openclaw worker`) merupakan titik masuk, bukan fork: penanganan koneksi ditambah runner agen tertanam, dengan persistensi sesi dan panggilan model yang didukung oleh RPC Gateway. Mode ini tidak boleh memulai permukaan Gateway: tanpa saluran, tanpa mulai otomatis Plugin di luar kumpulan alat sesi, direktori status sekali pakai, tanpa profil autentikasi lokal.

### 3. Transportasi: semuanya melalui SSH

Gateway memiliki konektivitas; pekerja tidak memerlukan apa pun selain sshd:

- Gateway membuka SSH ke pekerja (kredensial dari penyewaan penyedia, kunci host disematkan dari keluaran penyediaan — tanpa `StrictHostKeyChecking=no`) dan membuat terowongan balik yang meneruskan soket lokal pekerja ke endpoint WS milik Gateway.
- Lalu lintas kendali/model dan transfer ruang kerja menggunakan koneksi SSH terpisah dengan materi kepercayaan tersemat yang sama agar rsync tidak memblokir streaming token di bagian depan antrean.
- Siklus hidup terowongan (keepalive, penyambungan kembali dengan backoff) dimiliki oleh runtime lingkungan pada Gateway. Gangguan singkat pada terowongan tidak terlihat pada tingkat sesi: status protokol tahan lama (di bawah) memungkinkan pekerja melampirkan ulang dan melanjutkan.

### 4. Protokol pekerja (khusus; bukan protokol Node)

Tinjauan adversarial terhadap celah Node saat ini menolak penggunaan ulang langsung: pemanggilan Node tertunda merupakan promise lokal proses yang mati bersama koneksi, kunci idempotensi Node diurai tetapi tidak dideduplikasi, dan — yang menentukan — Node yang terhubung dapat memancarkan peristiwa Node biasa (termasuk permintaan eksekusi agen), sehingga "jenis Node + batas atas kapabilitas" bukan merupakan batas keamanan masuk. Oleh karena itu, pekerja mendapatkan peran `worker` terautentikasi dengan daftar izin RPC/peristiwa tertutup dan berversi; koneksi pekerja tidak dapat menjangkau penangan peristiwa Node lama mana pun.

Identitas dan kredensial: penyediaan menerbitkan kredensial pekerja berumur pendek yang terikat pada id lingkungan, kunci pekerja, hash bundel, satu-satunya sesi yang diizinkan, kumpulan RPC yang diizinkan, dan waktu kedaluwarsa. Pemasangan yang diverifikasi SSH tetap berlaku (kita menyediakan mesin dan memegang kuncinya), tetapi otorisasi berasal dari kredensial yang diterbitkan, bukan dari permukaan Node yang dideklarasikan.

Semantik operasi tahan lama (bentuk dipinjam dari runtime ACP yang ada dan buku besar peristiwanya — handle stabil, serialisasi per sesi, pemutaran ulang `(session, seq)` yang tahan lama):

- Setiap operasi dicakup oleh `(sessionId, lifecycleRevision, runId, ownerEpoch, streamKind, seq)`.
- Epoch kepemilikan membatasi pekerja usang: pekerja pengganti meningkatkan epoch; hasil terlambat dari epoch lama ditolak secara deterministik.
- Pengiriman setidaknya satu kali dengan kursor ACK yang dipersistenkan dan hasil terminal yang disimpan dalam cache di SQLite; deduplikasi bersifat deterministik. Tidak ada janji tepat satu kali.
- Frame eksplisit untuk pembatalan, penutupan, pelanjutan, dan hasil terminal; kendali aliran berbasis kredit/jendela pada streaming.
- Negosiasi fitur protokol tidak bergantung pada versi protokol Node umum.

### 5. RPC backend sesi

Dua kontrak yang berbeda — basis kode saat ini memisahkan mutasi transkrip persisten (dimiliki pengelola sesi, pohon JSONL dengan status induk/daun) dari peristiwa langsung lokal-proses (delta streaming, siklus hidup alat, persetujuan), dan protokol pekerja harus mempertahankan pemisahan tersebut:

- Commit transkrip persisten: pekerja mengirimkan batch penambahan semantik dengan `runEpoch` + compare-and-swap daun dasar; pengelola sesi Gateway menghasilkan id entri dan id induk. Pekerja tidak boleh memasok baris transkrip tepercaya, id entri, id induk, atau id sesi asing.
- Peristiwa langsung yang dapat diputar ulang: union peristiwa bertipe dengan nomor urut pekerja, ACK Gateway, retensi terbatas, dan pemagaran peristiwa terlambat, yang memasok fanout peristiwa agen yang sudah ada agar tampilan percakapan, baris alat, serta logika belum dibaca/status berperilaku sama seperti sesi lokal.

Proksi inferensi: gunakan kembali kosakata peristiwa dari klien aliran proksi runtime yang sudah ada (`src/agents/runtime/proxy.ts`), tetapi pindahkan batas kepercayaannya. Pekerja hanya mengirim identitas sesi/proses, referensi model yang disetujui, konteks, dan opsi generasi yang dibatasi; Gateway menetapkan penyedia, endpoint, autentikasi, header, perutean, dan kebijakan biaya dari katalognya sendiri. Objek model yang dipasok pekerja (misalnya `baseUrl` yang dikendalikan penyerang) ditolak. Batas ukuran permintaan, pembatalan, audit, dan pemutaran ulang hasil terminal berlaku. Alat yang berada di Gateway (pencarian web) dijalankan di Gateway dan mengembalikan hasil melalui kanal yang sama.

### 6. Sinkronisasi ruang kerja

Jangkar sinkronisasi adalah ruang kerja lokal-Gateway dengan kepemilikan penempatan eksklusif: untuk ruang kerja git, worktree terkelola khusus (metadata worktree terkelola yang sudah ada — cabang, dasar, kepemilikan snapshot — menjadi fondasinya); untuk ruang kerja non-git, direktori target milik Gateway. Jangan pernah menggunakan checkout aktif milik pengguna. Kepemilikan eksklusif selama sesi ditempatkan dari jarak jauh membuat sinkronisasi masuk bebas konflik secara konstruksi.

Pemisahan kepemilikan — commit vs. publikasi:

- Agen di sisi pekerja membuat commit secara normal dalam salinannya (`git commit` adalah operasi lokal tanpa kredensial; identitas penulis diproyeksikan dari konfigurasi Gateway). Commit tersebut merupakan objek inert sampai Gateway mengadopsinya.
- Gateway melakukan semua hal yang memerlukan kepercayaan: memverifikasi bahwa commit masuk dibangun di atas dasar yang tercatat, melakukan fast-forward pada worktree lokal, push, pembuatan PR, serta penandatanganan/penandatanganan ulang opsional — semuanya dengan kredensial lokal-Gateway. Pekerja tidak pernah menyimpan kredensial git atau forge dan tidak pernah menyentuh remote.

Dua mode sinkronisasi, dipilih berdasarkan apakah ruang kerja merupakan repositori git:

- Mode git. Keluar: rsync worktree (termasuk file yang belum di-commit dan file tidak terlacak yang memenuhi syarat; include/exclude bergaya crabbox, `.worktreeinclude` dipatuhi) melalui identitas SSH terowongan, yang dicatat sebagai manifes dasar tetap (hash konten + commit dasar). Masuk: commit baru dikembalikan sebagai bundle git atau ref sementara terhadap dasar yang tercatat; artefak tidak terlacak dikembalikan melalui manifes eksplisit dengan pemeriksaan ukuran/jenis/penahanan symlink. Adopsi memverifikasi garis keturunan dasar dan berhenti jika terjadi divergensi — tidak ada yang diam-diam menimpa salah satu sisi. Penghapusan, penggantian nama, submodul, dan pelepasan symlink ditangani oleh aturan manifes, bukan heuristik rsync.
- Mode biasa (tanpa git — misalnya membangun proyek dari awal di dalam kotak). Sinkronisasi keluar menggunakan rsync + manifes dasar yang sama. Sinkronisasi masuk berupa pencerminan berbasis perbedaan manifes kembali ke direktori target milik Gateway dengan propagasi penghapusan. Aman untuk alasan yang sama dengan mode git: kepemilikan eksklusif berarti tidak ada penyuntingan lokal bersamaan yang dapat menimbulkan konflik; manifes dasar tetap mendeteksi pergeseran lokal yang tidak terduga dan berhenti alih-alih menimpa.

Checkpoint melindungi sesi yang berlangsung berhari-hari dari kehilangan sewa: checkpoint masuk berkala (commit cabang sesi dalam mode git, snapshot manifes dalam mode biasa); frekuensinya merupakan kebijakan profil (default berbasis giliran).

### 7. Mesin status penempatan, sesi, dan UI

Penempatan runtime adalah mesin status milik SQLite yang dikaitkan dengan sesi, bukan sepasang kolom baris terpisah:

`local → requested → provisioning → syncing → starting → active(worker) → draining → reconciling → local | reclaimed | failed`

Mesin ini menyimpan id lingkungan, generasi transisi, epoch pemilik aktif, manifes dasar ruang kerja, hash bundle pekerja, dan kursor ACK terakhir. Penerimaan giliran secara atomik mengklaim penempatan sebelum salah satu loop memulai giliran, sehingga pesan lokal yang diterima berdasarkan snapshot usang tidak akan pernah berpacu dengan giliran pekerja — tepat satu loop memiliki sesi pada suatu waktu.

UI:

- Sesi pekerja adalah baris sesi biasa ditambah metadata penempatan. Sesi tersebut berada di penyimpanan normal, dicantumkan melalui `sessions.list`, dan dialirkan melalui langganan yang sudah ada — bilah samping dan percakapan tidak memerlukan jalur data baru, hanya penyajian: lencana pekerja serta status penempatan/lingkungan (`provisioning / syncing / running / idle / reconciling / reclaimed`).
- UX pembuatan: bilah target sesi (desain ulang bilah samping sesi) mendapatkan tujuan pekerja cloud bersama Gateway dan Node. Memerlukan profil penyedia yang dikonfigurasi; fitur tidak terlihat sampai dikonfigurasi.
- Pengiriman agen: alat sesi memungkinkan agen menyerahkan pekerjaan kepada pekerja cloud seperti yang dilakukan manusia (subsesi yang didukung pekerja, bergaya subagen). Dirilis dalam milestone yang sama dengan pengiriman manusia, dengan pembatasan konfigurasi penyedia ikut-serta yang sama. Rekursi dibatasi secara struktural (sesi pekerja tidak dapat mengirim pekerja lain dalam v1); kontrol pengeluaran berupa akuntansi/audit per lingkungan, bukan mekanisme kuota.

## Pengiriman dan serah terima

v1 sengaja dibuat asimetris:

- Lokal → pekerja (pengiriman): lewati penghalang migrasi di bawah, sediakan atau gunakan kembali pekerja, sinkronkan, balik penempatan, lalu giliran berikutnya dijalankan dari jarak jauh.
- Pekerja → lokal (tarik kembali): hentikan sesi (kuras pekerja melalui penghalang yang sama), selesaikan rekonsiliasi masuk, lalu balik penempatan ke lokal. Ini bukan migrasi langsung.
- Serah terima langsung simetris (memindahkan sesi yang sedang aktif bekerja ke kedua arah tanpa menghentikannya) menggunakan kembali mekanisme penghalang dan rekonsiliasi yang sama serta dirilis setelah pengujian injeksi kegagalan membuktikan penghalang tersebut.

Penghalang migrasi ("batas giliran" saja tidak memadai — persetujuan, proses latar belakang, dan penggabungan transkrip setelah pelepasan kunci dapat melintasinya):

1. Hentikan penerimaan giliran baru (klaim penempatan).
2. Batalkan atau kuras proses aktif.
3. Cabut persetujuan exec dan izin eksekusi yang tertunda.
4. Kuras penulisan samping transkrip dan ACK peristiwa langsung.
5. Hentikan proses anak pekerja.
6. Pagari pemilik lama dengan memajukan epoch pemilik.
7. Rekonsiliasi ruang kerja (masuk, sadar konflik).
8. Aktifkan pemilik baru.

Afinitas cache: karena permintaan penyedia berasal dari Gateway pada kedua penempatan, afinitas cache dipertahankan ketika permintaan penyedia terserialisasi tetap setara — urutan alat, instruksi sistem, wrapper penyedia, dan metadata cache yang sama (yang tetap berada di sisi Gateway). Ini adalah properti yang dapat diuji, bukan asumsi: pengujian kesetaraan byte di seluruh penempatan lokal/pekerja untuk setiap transport penyedia yang didukung merupakan bagian dari milestone yang memperkenalkan loop pekerja.

## Model keamanan

Dinyatakan secara tepat: pekerja tidak memiliki egress jaringan langsung dan tidak memiliki kredensial penyedia/forge permanen. Ini bukan "tanpa egress" — inferensi dan alat yang dijalankan Gateway merupakan kanal egress terkendali (pekerja yang terkena injeksi prompt tetap dapat memasukkan byte ruang kerja ke dalam konteks model atau kueri pencarian web). Oleh karena itu:

- Akuntansi egress terkendali: audit per lingkungan dan akuntansi yang terlihat oleh operator pada proksi inferensi dan alat Gateway. Batas laju/byte tersedia sebagai kontrol aliran protokol (kapasitas), bukan sebagai mekanisme kuota pengeluaran.
- Ingress pekerja ke Gateway adalah daftar izin tertutup protokol pekerja; penulisan transkrip dibatasi secara struktural (id yang dihasilkan Gateway, satu sesi terikat).
- Exec pekerja memiliki izin penuh di dalam kotak. Kotak bersifat sekali pakai dan tanpa kredensial, sehingga persetujuan per perintah menambah friksi tanpa melindungi apa pun; batas yang dijaga adalah rekonsiliasi masuk dan audit. Exec tidak pernah melewati jalur persetujuan Node Gateway.
- Kebijakan internet merupakan keputusan penyedia saat penyediaan: profil lingkungan menentukan saat pembuatan kotak (firewall/grup keamanan/jaringan tanpa egress), secara opsional dengan fase penyiapan berjaringan yang ditutup penyedia sebelum fase agen. Inti tidak mengimplementasikan sakelar jaringan runtime.
- Kebersihan kotak saat penyediaan: endpoint metadata cloud diblokir atau dipastikan tidak ada, tanpa profil instans, tanpa agen SSH yang diwariskan, tanpa soket Docker, env/home bersih. Kunci host SSH disematkan dari keluaran penyediaan.
- Persetujuan dan kebijakan untuk segala sesuatu di sisi Gateway (push, PR, panggilan penyedia) tetap dijalankan di Gateway.

Radius dampak sesi pekerja yang disusupi: salinan ruang kerja tersinkronisasi ditambah apa yang diizinkan kanal proksi teraudit — tanpa kredensial, tanpa jaringan langsung, tanpa permukaan Gateway di luar daftar izin.

## Kapasitas

Gateway merelai setiap prompt dan aliran token untuk N pekerja, sehingga v1 menetapkan model kapasitas alih-alih menemukannya di produksi: batas pekerja bersamaan per Gateway, jendela kredit per aliran (antrean aliran peristiwa saat ini tidak terbatas dan batas buffer soket Node menutup paksa konsumen lambat — keduanya tidak cocok digunakan tanpa modifikasi), spooling disk terbatas untuk lonjakan, serta pelepasan beban dengan status tekanan balik yang terlihat di UI. Transfer ruang kerja tetap menggunakan kanal SSH tersendiri.

## Siklus hidup

- Penghentian otomatis saat menganggur dan TTL merupakan kebijakan profil penyedia, bukan konstanta tetap. Default-nya longgar dengan keep-alive eksplisit; pekerjaan berhari-hari merupakan skenario kelas utama (`renew` penyedia tersedia untuk backend berbasis sewa); sesi dengan giliran yang sedang berjalan atau aktivitas terkini tidak pernah diklaim kembali.
- Saat pekerja mati atau diklaim kembali: penempatan berpindah ke `reclaimed`, baris sesi tetap ada, pesan berikutnya menyediakan pekerja baru dan menyinkronkan ulang dari checkpoint terakhir. Percakapan tidak pernah hilang (penyimpanan di sisi Gateway); perubahan ruang kerja sejak checkpoint terakhir hilang dan UI menyatakannya.
- Penggunaan ulang sewa hangat sejak hari pertama (untuk penyedia yang mendukungnya); snapshot citra setelah bootstrap merupakan jalur mulai cepat v2.

## Permukaan konfigurasi

Minimal dan bersifat ikut-serta: blok profil penyedia (id penyedia, referensi kredensial/CLI, aturan sinkronisasi, kebijakan masa berlaku, anggaran, fase penyiapan opsional) ditambah pemilihan penempatan per sesi. Tidak ada variabel lingkungan baru. Instalasi yang belum dikonfigurasi tidak melihat apa pun.

## Milestone

Implementasi masuk sebagai PR kecil yang dapat digabungkan secara independen; setiap milestone di bawah adalah rangkaian PR, bukan satu perubahan.

1. Fondasi: mesin status lingkungan + kontrak penyedia + penyedia berbentuk crabbox (SSH statis sebagai harness pengembangan), bootstrap bundle pekerja + handshake penerimaan, terowongan SSH + penyematan kunci host, snapshot worktree terkelola + sinkronisasi keluar (mode git + biasa). Pembersihan yatim + adopsi setelah mulai ulang.
2. Protokol pekerja + loop pekerja: peran pekerja terautentikasi, operasi/epoch/kursor ACK persisten, kontrak commit transkrip + peristiwa langsung, proksi inferensi dengan model yang ditetapkan Gateway, kontrol aliran. Satu penyedia, pengiriman manusia hanya untuk sesi baru, tanpa serah terima. Pengujian injeksi kegagalan (partisi terowongan, mulai ulang Gateway, kematian pekerja) menjadi gerbang penyelesaian.
3. Pengiriman + tarik kembali + pengiriman agen: penghalang migrasi, mesin status penempatan yang terhubung ke bilah target UI, rekonsiliasi masuk + checkpoint, audit per lingkungan, batas kapasitas, alat pengiriman agen (sesi pekerja tidak dapat berekursi). Pengujian kesetaraan byte cache prompt.
4. Serah terima langsung simetris, setelah pembuktian injeksi kegagalan milestone 3.

Kemudian: harness ACP pada pekerja sebagai ikut-serta hidrasi kredensial per lingkungan; mulai cepat berbasis snapshot/citra hangat; fan-out (N sewa, prompt yang sama); sandboxing OS di dalam kotak; pengambilan artefak yang lebih kaya melalui skema artefak.

## Pertanyaan terbuka

- Ketersediaan Plugin/skill pada worker: skill yang disertakan dalam repo disinkronkan dengan workspace tanpa biaya; skill/plugin agen yang dikonfigurasi melalui Gateway memerlukan keputusan eksplisit untuk sinkronisasi atau pengecualian (manifes alat/plugin tetap menjadi bagian dari proses awal penerimaan).
- Irama checkpoint bawaan: berbasis giliran dibandingkan berbasis waktu untuk sesi yang sangat aktif.
- Cara profil lingkungan berinteraksi dengan perutean multiagen (profil bawaan per agen dibandingkan pemilihan hanya per sesi).
