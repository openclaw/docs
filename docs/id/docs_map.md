---
read_when: Finding which docs page covers a topic before reading the page
summary: Peta heading yang dihasilkan untuk halaman dokumentasi OpenClaw
title: Peta dokumentasi
x-i18n:
    generated_at: "2026-07-02T22:48:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a4462a02558886466a5da704c18041c4e4c9c709c740d605d45bdca0a1fb2e8
    source_path: docs_map.md
    workflow: 16
---

# Peta dokumen OpenClaw

File ini dihasilkan dari heading `docs/**/*.md` dan `docs/**/*.mdx` untuk membantu agen menavigasi pohon dokumentasi.
Jangan mengeditnya secara manual; jalankan `pnpm docs:map:gen`.

## agent-runtime-architecture.md

- Rute: /agent-runtime-architecture
- Heading:
  - H2: Tata Letak Runtime
  - H2: Batasan
  - H2: Manifest
  - H2: Pemilihan Runtime
  - H2: Terkait

## announcements/bluebubbles-imessage.md

- Rute: /announcements/bluebubbles-imessage
- Heading:
  - H1: Penghapusan BlueBubbles dan jalur iMessage imsg
  - H2: Apa yang berubah
  - H2: Apa yang harus dilakukan
  - H2: Catatan migrasi
  - H2: Lihat juga

## auth-credential-semantics.md

- Rute: /auth-credential-semantics
- Heading:
  - H2: Kode alasan probe stabil
  - H2: Kredensial token
  - H3: Aturan kelayakan
  - H3: Aturan resolusi
  - H2: Portabilitas salinan agen
  - H2: Rute auth khusus config
  - H2: Pemfilteran urutan auth eksplisit
  - H2: Resolusi target probe
  - H2: Penemuan kredensial CLI eksternal
  - H2: Penjaga Kebijakan SecretRef OAuth
  - H2: Pesan Kompatibel Legacy
  - H2: Terkait

## automation/auth-monitoring.md

- Rute: /automation/auth-monitoring
- Heading:
  - H2: Terkait

## automation/clawflow.md

- Rute: /automation/clawflow
- Heading:
  - H2: Terkait

## automation/cron-jobs.md

- Rute: /automation/cron-jobs
- Heading:
  - H2: Mulai cepat
  - H2: Cara kerja cron
  - H2: Jenis jadwal
  - H3: Hari dalam bulan dan hari dalam minggu menggunakan logika OR
  - H2: Gaya eksekusi
  - H3: Payload perintah
  - H3: Opsi payload untuk job terisolasi
  - H2: Pengiriman dan output
  - H2: Bahasa output
  - H2: Contoh CLI
  - H2: Webhook
  - H3: Autentikasi
  - H2: Integrasi Gmail PubSub
  - H3: Penyiapan wizard (direkomendasikan)
  - H3: Mulai otomatis Gateway
  - H3: Penyiapan manual satu kali
  - H3: Override model Gmail
  - H2: Mengelola job
  - H2: Konfigurasi
  - H2: Pemecahan masalah
  - H3: Tangga perintah
  - H2: Terkait

## automation/cron-vs-heartbeat.md

- Rute: /automation/cron-vs-heartbeat
- Heading:
  - H2: Terkait

## automation/gmail-pubsub.md

- Rute: /automation/gmail-pubsub
- Heading:
  - H2: Terkait

## automation/hooks.md

- Rute: /automation/hooks
- Heading:
  - H2: Pilih permukaan yang tepat
  - H2: Mulai cepat
  - H2: Jenis peristiwa
  - H2: Menulis hook
  - H3: Struktur hook
  - H3: Format HOOK.md
  - H3: Implementasi handler
  - H3: Sorotan konteks peristiwa
  - H2: Penemuan hook
  - H3: Paket hook
  - H2: Hook bawaan
  - H3: Detail session-memory
  - H3: Config bootstrap-extra-files
  - H3: Detail command-logger
  - H3: Detail compaction-notifier
  - H3: Detail boot-md
  - H2: Hook Plugin
  - H2: Konfigurasi
  - H2: Referensi CLI
  - H2: Praktik terbaik
  - H2: Pemecahan masalah
  - H3: Hook tidak ditemukan
  - H3: Hook tidak memenuhi syarat
  - H3: Hook tidak dijalankan
  - H2: Terkait

## automation/index.md

- Rute: /automation
- Heading:
  - H2: Panduan keputusan cepat
  - H3: Tugas Terjadwal (Cron) vs Heartbeat
  - H2: Konsep inti
  - H3: Tugas terjadwal (cron)
  - H3: Tugas
  - H3: Komitmen tersimpulkan
  - H3: Task Flow
  - H3: Perintah tetap
  - H3: Hook
  - H3: Heartbeat
  - H2: Cara semuanya bekerja bersama
  - H2: Terkait

## automation/poll.md

- Rute: /automation/poll
- Heading:
  - H2: Terkait

## automation/standing-orders.md

- Rute: /automation/standing-orders
- Heading:
  - H2: Mengapa perintah tetap
  - H2: Cara kerjanya
  - H2: Anatomi perintah tetap
  - H2: Perintah tetap plus job cron
  - H2: Contoh
  - H3: Contoh 1: konten dan media sosial (siklus mingguan)
  - H3: Contoh 2: operasi keuangan (dipicu peristiwa)
  - H3: Contoh 3: pemantauan dan peringatan (berkelanjutan)
  - H2: Pola eksekusi-verifikasi-laporan
  - H2: Arsitektur multi-program
  - H2: Praktik terbaik
  - H3: Lakukan
  - H3: Hindari
  - H2: Terkait

## automation/taskflow.md

- Rute: /automation/taskflow
- Heading:
  - H2: Kapan menggunakan Task Flow
  - H2: Pola alur kerja terjadwal yang andal
  - H2: Mode sinkronisasi
  - H3: Mode terkelola
  - H3: Mode tercermin
  - H2: Status tahan lama dan pelacakan revisi
  - H2: Perilaku pembatalan
  - H2: Perintah CLI
  - H2: Bagaimana flow terkait dengan tugas
  - H2: Terkait

## automation/tasks.md

- Rute: /automation/tasks
- Heading:
  - H2: TL;DR
  - H2: Mulai cepat
  - H2: Apa yang membuat tugas
  - H2: Siklus hidup tugas
  - H2: Pengiriman dan notifikasi
  - H3: Kebijakan notifikasi
  - H2: Referensi CLI
  - H2: Papan tugas chat (/tasks)
  - H2: Integrasi status (tekanan tugas)
  - H2: Penyimpanan dan pemeliharaan
  - H3: Tempat tugas berada
  - H3: Pemeliharaan otomatis
  - H2: Bagaimana tugas terkait dengan sistem lain
  - H2: Terkait

## automation/troubleshooting.md

- Rute: /automation/troubleshooting
- Heading:
  - H2: Terkait

## automation/webhook.md

- Rute: /automation/webhook
- Heading:
  - H2: Terkait

## brave-search.md

- Rute: /brave-search
- Heading:
  - H2: Terkait

## channels/access-groups.md

- Rute: /channels/access-groups
- Heading:
  - H2: Grup pengirim pesan statis
  - H2: Grup referensi dari allowlist
  - H2: Jalur message-channel yang didukung
  - H2: Diagnostik Plugin
  - H2: Audiens channel Discord
  - H2: Catatan keamanan
  - H2: Pemecahan masalah

## channels/ambient-room-events.md

- Rute: /channels/ambient-room-events
- Heading:
  - H2: Penyiapan yang direkomendasikan
  - H2: Apa yang berubah
  - H2: Contoh Discord
  - H2: Contoh Slack
  - H2: Contoh Telegram
  - H2: Kebijakan khusus agen
  - H2: Mode balasan terlihat
  - H2: Riwayat
  - H2: Pemecahan masalah
  - H2: Terkait

## channels/bot-loop-protection.md

- Rute: /channels/bot-loop-protection
- Heading:
  - H1: Perlindungan loop bot
  - H2: Default
  - H2: Konfigurasikan default bersama
  - H2: Override per channel atau akun
  - H2: Dukungan channel

## channels/broadcast-groups.md

- Rute: /channels/broadcast-groups
- Heading:
  - H2: Ringkasan
  - H2: Kasus penggunaan
  - H2: Konfigurasi
  - H3: Penyiapan dasar
  - H3: Strategi pemrosesan
  - H3: Contoh lengkap
  - H2: Cara kerjanya
  - H3: Alur pesan
  - H3: Isolasi sesi
  - H3: Contoh: sesi terisolasi
  - H2: Praktik terbaik
  - H2: Kompatibilitas
  - H3: Penyedia
  - H3: Perutean
  - H2: Pemecahan masalah
  - H2: Contoh
  - H2: Referensi API
  - H3: Skema config
  - H3: Bidang
  - H2: Batasan
  - H2: Peningkatan di masa mendatang
  - H2: Terkait

## channels/channel-routing.md

- Rute: /channels/channel-routing
- Heading:
  - H1: Channel & perutean
  - H2: Istilah kunci
  - H2: Prefiks target keluar
  - H2: Bentuk kunci sesi (contoh)
  - H2: Penyematan rute DM utama
  - H2: Perekaman masuk yang dijaga
  - H2: Aturan perutean (bagaimana agen dipilih)
  - H2: Grup siaran (jalankan beberapa agen)
  - H2: Ringkasan config
  - H2: Penyimpanan sesi
  - H2: Perilaku WebChat
  - H2: Konteks balasan
  - H2: Terkait

## channels/clickclack.md

- Rute: /channels/clickclack
- Heading:
  - H2: Penyiapan cepat
  - H2: Beberapa bot
  - H2: Target
  - H2: Izin
  - H2: Pemecahan masalah

## channels/discord.md

- Rute: /channels/discord
- Heading:
  - H2: Penyiapan cepat
  - H2: Direkomendasikan: Siapkan workspace guild
  - H2: Model runtime
  - H2: Channel forum
  - H2: Komponen interaktif
  - H2: Kontrol akses dan perutean
  - H3: Perutean agen berbasis peran
  - H2: Perintah native dan auth perintah
  - H2: Detail fitur
  - H2: Alat dan gerbang tindakan
  - H2: UI Components v2
  - H2: Suara
  - H3: Channel suara
  - H3: Ikuti pengguna dalam suara
  - H3: Pesan suara
  - H2: Pemecahan masalah
  - H2: Referensi konfigurasi
  - H2: Keamanan dan operasi
  - H2: Terkait

## channels/feishu.md

- Rute: /channels/feishu
- Heading:
  - H2: Mulai cepat
  - H2: Kontrol akses
  - H3: Pesan langsung
  - H3: Chat grup
  - H2: Contoh konfigurasi grup
  - H3: Izinkan semua grup, tidak perlu @mention
  - H3: Izinkan semua grup, tetap perlu @mention
  - H3: Izinkan hanya grup tertentu
  - H3: Batasi pengirim dalam grup
  - H2: Dapatkan ID grup/pengguna
  - H3: ID Grup (chatid, format: ocxxx)
  - H3: ID Pengguna (openid, format: ouxxx)
  - H2: Perintah umum
  - H2: Pemecahan masalah
  - H3: Bot tidak merespons di chat grup
  - H3: Bot tidak menerima pesan
  - H3: Penyiapan QR tidak bereaksi di aplikasi seluler Feishu
  - H3: App Secret bocor
  - H2: Konfigurasi lanjutan
  - H3: Beberapa akun
  - H3: Batas pesan
  - H3: Streaming
  - H3: Optimisasi kuota
  - H3: Sesi ACP
  - H4: Pengikatan ACP persisten
  - H4: Spawn ACP dari chat
  - H3: Perutean multi-agen
  - H2: Isolasi agen per pengguna (Pembuatan Agen Dinamis)
  - H3: Penyiapan cepat
  - H3: Cara kerjanya
  - H3: Opsi konfigurasi
  - H3: Cakupan sesi
  - H3: Deployment multi-pengguna tipikal
  - H3: Verifikasi
  - H3: Catatan
  - H2: Referensi konfigurasi
  - H2: Jenis pesan yang didukung
  - H3: Terima
  - H3: Kirim
  - H3: Thread dan balasan
  - H2: Terkait

## channels/googlechat.md

- Rute: /channels/googlechat
- Heading:
  - H2: Instal
  - H2: Penyiapan cepat (pemula)
  - H2: Tambahkan ke Google Chat
  - H2: URL publik (khusus Webhook)
  - H3: Opsi A: Tailscale Funnel (Direkomendasikan)
  - H3: Opsi B: Reverse Proxy (Caddy)
  - H3: Opsi C: Cloudflare Tunnel
  - H2: Cara kerjanya
  - H2: Target
  - H2: Sorotan config
  - H2: Pemecahan masalah
  - H3: 405 Method Not Allowed
  - H3: Masalah lain
  - H2: Terkait

## channels/group-messages.md

- Rute: /channels/group-messages
- Heading:
  - H2: Perilaku
  - H2: Contoh config (WhatsApp)
  - H3: Perintah aktivasi (khusus pemilik)
  - H2: Cara menggunakan
  - H2: Pengujian / verifikasi
  - H2: Pertimbangan yang diketahui
  - H2: Terkait

## channels/groups.md

- Rute: /channels/groups
- Heading:
  - H2: Pengantar pemula (2 menit)
  - H2: Balasan terlihat
  - H2: Visibilitas konteks dan allowlist
  - H2: Kunci sesi
  - H2: Pola: DM pribadi + grup publik (agen tunggal)
  - H2: Label tampilan
  - H2: Kebijakan grup
  - H2: Gerbang mention (default)
  - H2: Pola mention yang dikonfigurasi cakupannya
  - H2: Pembatasan alat grup/channel (opsional)
  - H2: Allowlist grup
  - H2: Aktivasi (khusus pemilik)
  - H2: Bidang konteks
  - H2: Spesifik iMessage
  - H2: Prompt sistem WhatsApp
  - H2: Spesifik WhatsApp
  - H2: Terkait

## channels/imessage-from-bluebubbles.md

- Rute: /channels/imessage-from-bluebubbles
- Heading:
  - H2: Checklist migrasi
  - H2: Kapan migrasi ini masuk akal
  - H2: Apa yang dilakukan imsg
  - H2: Sebelum Anda mulai
  - H2: Terjemahan config
  - H2: Jebakan registry grup
  - H2: Langkah demi langkah
  - H2: Paritas tindakan sekilas
  - H2: Pairing, sesi, dan pengikatan ACP
  - H2: Tidak ada channel rollback
  - H2: Terkait

## channels/imessage.md

- Rute: /channels/imessage
- Heading:
  - H2: Penyiapan cepat
  - H2: Persyaratan dan izin (macOS)
  - H2: Mengaktifkan API privat imsg
  - H3: Penyiapan
  - H3: Saat Anda tidak dapat menonaktifkan SIP
  - H2: Kontrol akses dan perutean
  - H2: Pengikatan percakapan ACP
  - H2: Pola deployment
  - H2: Media, chunking, dan target pengiriman
  - H2: Tindakan API privat
  - H2: Penulisan config
  - H2: Menggabungkan DM split-send (perintah + URL dalam satu komposisi)
  - H3: Skenario dan apa yang dilihat agen
  - H2: Pemulihan masuk setelah bridge atau gateway dimulai ulang
  - H3: Sinyal yang terlihat operator
  - H3: Migrasi
  - H2: Pemecahan masalah
  - H2: Petunjuk referensi konfigurasi
  - H2: Terkait

## channels/index.md

- Rute: /channels
- Heading:
  - H2: Catatan pengiriman
  - H2: Channel yang didukung
  - H2: Catatan

## channels/irc.md

- Rute: /channels/irc
- Heading:
  - H2: Mulai cepat
  - H2: Default keamanan
  - H2: Kontrol akses
  - H3: Kesalahan umum: allowFrom adalah untuk DM, bukan channel
  - H2: Pemicu balasan (mention)
  - H2: Catatan keamanan (direkomendasikan untuk channel publik)
  - H3: Alat yang sama untuk semua orang di channel
  - H3: Alat berbeda per pengirim (pemilik mendapat kuasa lebih besar)
  - H2: NickServ
  - H2: Variabel lingkungan
  - H2: Pemecahan masalah
  - H2: Terkait

## channels/line.md

- Rute: /channels/line
- Judul:
  - H2: Instal
  - H2: Penyiapan
  - H2: Konfigurasi
  - H2: Kontrol akses
  - H2: Perilaku pesan
  - H2: Data kanal (pesan kaya)
  - H2: Dukungan ACP
  - H2: Media keluar
  - H2: Pemecahan masalah
  - H2: Terkait

## channels/location.md

- Rute: /channels/location
- Judul:
  - H2: Pemformatan teks
  - H2: Bidang konteks
  - H2: Catatan kanal
  - H2: Terkait

## channels/matrix-migration.md

- Rute: /channels/matrix-migration
- Judul:
  - H2: Yang dilakukan migrasi secara otomatis
  - H2: Yang tidak dapat dilakukan migrasi secara otomatis
  - H2: Alur peningkatan yang direkomendasikan
  - H2: Cara kerja migrasi terenkripsi
  - H2: Pesan umum dan artinya
  - H3: Pesan peningkatan dan deteksi
  - H3: Pesan pemulihan status terenkripsi
  - H3: Pesan pemulihan manual
  - H3: Pesan instalasi Plugin kustom
  - H2: Jika riwayat terenkripsi masih tidak kembali
  - H2: Jika Anda ingin memulai baru untuk pesan mendatang
  - H2: Terkait

## channels/matrix-presentation.md

- Rute: /channels/matrix-presentation
- Judul:
  - H2: Konten peristiwa
  - H2: Perilaku fallback
  - H2: Blok yang didukung
  - H2: Interaksi
  - H2: Hubungan dengan metadata persetujuan
  - H2: Pesan media

## channels/matrix-push-rules.md

- Rute: /channels/matrix-push-rules
- Judul:
  - H2: Prasyarat
  - H2: Langkah-langkah
  - H2: Catatan multi-bot
  - H2: Catatan homeserver
  - H2: Terkait

## channels/matrix.md

- Rute: /channels/matrix
- Judul:
  - H2: Instal
  - H2: Penyiapan
  - H3: Penyiapan interaktif
  - H3: Konfigurasi minimal
  - H3: Bergabung otomatis
  - H3: Format target allowlist
  - H3: Normalisasi ID akun
  - H3: Kredensial tersimpan cache
  - H3: Variabel lingkungan
  - H2: Contoh konfigurasi
  - H2: Pratinjau streaming
  - H2: Pesan suara
  - H2: Metadata persetujuan
  - H3: Aturan push self-hosted untuk pratinjau final yang senyap
  - H2: Ruang bot-ke-bot
  - H2: Enkripsi dan verifikasi
  - H3: Aktifkan enkripsi
  - H3: Status dan sinyal kepercayaan
  - H3: Verifikasi perangkat ini dengan kunci pemulihan
  - H3: Bootstrap atau perbaiki cross-signing
  - H3: Cadangan kunci ruang
  - H3: Mencantumkan, meminta, dan menanggapi verifikasi
  - H3: Catatan multi-akun
  - H2: Manajemen profil
  - H2: Utas
  - H3: Perutean sesi (sessionScope)
  - H3: Balasan berutas (threadReplies)
  - H3: Pewarisan utas dan perintah slash
  - H2: Pengikatan percakapan ACP
  - H3: Konfigurasi pengikatan utas
  - H2: Reaksi
  - H2: Konteks riwayat
  - H2: Visibilitas konteks
  - H2: Kebijakan DM dan ruang
  - H2: Perbaikan ruang langsung
  - H2: Persetujuan eksekusi
  - H2: Perintah slash
  - H2: Multi-akun
  - H2: Homeserver privat/LAN
  - H2: Mem-proxy lalu lintas Matrix
  - H2: Resolusi target
  - H2: Referensi konfigurasi
  - H3: Akun dan koneksi
  - H3: Enkripsi
  - H3: Akses dan kebijakan
  - H3: Perilaku balasan
  - H3: Pengaturan reaksi
  - H3: Peralatan dan override per ruang
  - H3: Pengaturan persetujuan eksekusi
  - H2: Terkait

## channels/mattermost.md

- Rute: /channels/mattermost
- Judul:
  - H2: Instal
  - H2: Penyiapan cepat
  - H2: Perintah slash native
  - H2: Variabel lingkungan (akun default)
  - H2: Mode chat
  - H2: Penguliran dan sesi
  - H2: Kontrol akses (DM)
  - H2: Kanal (grup)
  - H2: Target untuk pengiriman keluar
  - H2: Percobaan ulang kanal DM
  - H2: Streaming pratinjau
  - H2: Reaksi (alat pesan)
  - H2: Tombol interaktif (alat pesan)
  - H3: Integrasi API langsung (skrip eksternal)
  - H2: Adaptor direktori
  - H2: Multi-akun
  - H2: Pemecahan masalah
  - H2: Terkait

## channels/msteams.md

- Rute: /channels/msteams
- Judul:
  - H2: Plugin bawaan
  - H2: Penyiapan cepat
  - H2: Tujuan
  - H2: Penulisan konfigurasi
  - H2: Kontrol akses (DM + grup)
  - H3: Cara kerjanya
  - H3: Langkah 1: Buat Bot Azure
  - H3: Langkah 2: Dapatkan Kredensial
  - H3: Langkah 3: Konfigurasi Endpoint Pesan
  - H3: Langkah 4: Aktifkan Kanal Teams
  - H3: Langkah 5: Bangun Manifest Aplikasi Teams
  - H3: Langkah 6: Konfigurasi OpenClaw
  - H3: Langkah 7: Jalankan Gateway
  - H2: Autentikasi federasi (sertifikat plus identitas terkelola)
  - H3: Opsi A: Autentikasi berbasis sertifikat
  - H3: Opsi B: Azure Managed Identity
  - H3: Penyiapan AKS Workload Identity
  - H3: Perbandingan jenis autentikasi
  - H2: Pengembangan lokal (tunneling)
  - H2: Menguji Bot
  - H2: Variabel lingkungan
  - H2: Tindakan info anggota
  - H2: Konteks riwayat
  - H2: Izin Teams RSC saat ini (manifest)
  - H2: Contoh manifest Teams (disunting)
  - H3: Catatan penting manifest (bidang wajib)
  - H3: Memperbarui aplikasi yang ada
  - H2: Kapabilitas: hanya RSC vs Graph
  - H3: Dengan Teams RSC saja (aplikasi terinstal, tanpa izin Graph API)
  - H3: Dengan Teams RSC + izin Aplikasi Microsoft Graph
  - H3: RSC vs Graph API
  - H2: Media + riwayat yang diaktifkan Graph (wajib untuk kanal)
  - H2: Batasan yang diketahui
  - H3: Timeout Webhook
  - H3: Dukungan cloud Teams dan URL layanan
  - H3: Pemformatan
  - H2: Konfigurasi
  - H2: Perutean dan sesi
  - H2: Gaya balasan: utas vs postingan
  - H3: Prioritas resolusi
  - H3: Pelestarian konteks utas
  - H2: Lampiran dan gambar
  - H2: Mengirim file dalam chat grup
  - H3: Mengapa chat grup memerlukan SharePoint
  - H3: Penyiapan
  - H3: Perilaku berbagi
  - H3: Perilaku fallback
  - H3: Lokasi file tersimpan
  - H2: Polling (Adaptive Cards)
  - H2: Kartu presentasi
  - H2: Format target
  - H2: Pesan proaktif
  - H2: ID Tim dan Kanal (Kesalahan Umum)
  - H2: Kanal privat
  - H2: Pemecahan masalah
  - H3: Masalah umum
  - H3: Kesalahan unggah manifest
  - H3: Izin RSC tidak berfungsi
  - H2: Referensi
  - H2: Terkait

## channels/nextcloud-talk.md

- Rute: /channels/nextcloud-talk
- Judul:
  - H2: Plugin bawaan
  - H2: Penyiapan cepat (pemula)
  - H2: Catatan
  - H2: Kontrol akses (DM)
  - H2: Ruang (grup)
  - H2: Kapabilitas
  - H2: Referensi konfigurasi (Nextcloud Talk)
  - H2: Terkait

## channels/nostr.md

- Rute: /channels/nostr
- Judul:
  - H2: Plugin bawaan
  - H3: Instalasi lama/kustom
  - H3: Penyiapan non-interaktif
  - H2: Penyiapan cepat
  - H2: Referensi konfigurasi
  - H2: Metadata profil
  - H2: Kontrol akses
  - H3: Kebijakan DM
  - H3: Contoh allowlist
  - H2: Format kunci
  - H2: Relay
  - H2: Dukungan protokol
  - H2: Pengujian
  - H3: Relay lokal
  - H3: Pengujian manual
  - H2: Pemecahan masalah
  - H3: Tidak menerima pesan
  - H3: Tidak mengirim respons
  - H3: Respons duplikat
  - H2: Keamanan
  - H2: Batasan (MVP)
  - H2: Terkait

## channels/pairing.md

- Rute: /channels/pairing
- Judul:
  - H2: 1) Pairing DM (akses chat masuk)
  - H3: Setujui pengirim
  - H3: Grup pengirim yang dapat digunakan ulang
  - H3: Lokasi status disimpan
  - H2: 2) Pairing perangkat Node (node iOS/Android/macOS/headless)
  - H3: Pair melalui Telegram (direkomendasikan untuk iOS)
  - H3: Setujui perangkat node
  - H3: Persetujuan otomatis node CIDR tepercaya opsional
  - H3: Penyimpanan status pairing Node
  - H3: Catatan
  - H2: Dokumen terkait

## channels/qa-channel.md

- Rute: /channels/qa-channel
- Judul:
  - H2: Fungsinya
  - H2: Konfigurasi
  - H2: Runner
  - H2: Terkait

## channels/qqbot.md

- Rute: /channels/qqbot
- Judul:
  - H2: Instal
  - H2: Penyiapan
  - H2: Konfigurasi
  - H3: Penyiapan multi-akun
  - H3: Chat grup
  - H3: Suara (STT / TTS)
  - H2: Format target
  - H2: Perintah slash
  - H2: Arsitektur mesin
  - H2: Onboarding kode QR
  - H2: Pemecahan masalah
  - H2: Terkait

## channels/raft.md

- Rute: /channels/raft
- Judul:
  - H2: Instal
  - H2: Prasyarat
  - H2: Konfigurasi
  - H2: Cara Kerjanya
  - H2: Verifikasi
  - H2: Pemecahan masalah
  - H2: Referensi

## channels/signal.md

- Rute: /channels/signal
- Judul:
  - H2: Prasyarat
  - H2: Penyiapan cepat (pemula)
  - H2: Apa itu
  - H2: Penulisan konfigurasi
  - H2: Model nomor (penting)
  - H2: Jalur penyiapan A: tautkan akun Signal yang ada (QR)
  - H2: Jalur penyiapan B: daftarkan nomor bot khusus (SMS, Linux)
  - H2: Mode daemon eksternal (httpUrl)
  - H2: Mode kontainer (bbernhard/signal-cli-rest-api)
  - H2: Kontrol akses (DM + grup)
  - H2: Cara kerjanya (perilaku)
  - H2: Media + batasan
  - H2: Mengetik + tanda baca
  - H2: Reaksi (alat pesan)
  - H2: Reaksi persetujuan
  - H2: Target pengiriman (CLI/cron)
  - H2: Pemecahan masalah
  - H2: Catatan keamanan
  - H2: Referensi konfigurasi (Signal)
  - H2: Terkait

## channels/slack.md

- Rute: /channels/slack
- Judul:
  - H2: Memilih Socket Mode atau URL Permintaan HTTP
  - H3: Mode relai
  - H2: Instal
  - H2: Penyiapan cepat
  - H2: Penyetelan transport Socket Mode
  - H2: Daftar periksa manifest dan scope
  - H3: Pengaturan manifest tambahan
  - H2: Model token
  - H2: Tindakan dan gerbang
  - H2: Kontrol akses dan perutean
  - H2: Penguliran, sesi, dan tag balasan
  - H2: Reaksi ack
  - H3: Emoji (ackReaction)
  - H3: Scope (messages.ackReactionScope)
  - H2: Streaming teks
  - H2: Fallback reaksi mengetik
  - H2: Media, pemotongan bagian, dan pengiriman
  - H2: Perintah dan perilaku slash
  - H2: Balasan interaktif
  - H3: Pengiriman modal milik Plugin
  - H2: Persetujuan native di Slack
  - H2: Peristiwa dan perilaku operasional
  - H2: Referensi konfigurasi
  - H2: Pemecahan masalah
  - H2: Referensi visi lampiran
  - H3: Jenis media yang didukung
  - H3: Pipeline masuk
  - H3: Pewarisan lampiran akar utas
  - H3: Penanganan multi-lampiran
  - H3: Batasan ukuran, unduhan, dan model
  - H3: Batasan yang diketahui
  - H3: Dokumentasi terkait
  - H2: Terkait

## channels/sms.md

- Rute: /channels/sms
- Judul:
  - H2: Sebelum Anda mulai
  - H2: Penyiapan Cepat
  - H2: Contoh Konfigurasi
  - H3: File konfigurasi
  - H3: Variabel lingkungan
  - H3: Token autentikasi SecretRef
  - H3: Nomor privat khusus allowlist
  - H3: Pengirim Messaging Service
  - H3: Target keluar default
  - H2: Kontrol akses
  - H2: Mengirim SMS
  - H2: Verifikasi Penyiapan
  - H3: Pengujian end-to-end dari macOS iMessage/SMS
  - H2: Keamanan Webhook
  - H2: Konfigurasi multi-akun
  - H2: Pemecahan masalah
  - H3: Twilio mengembalikan 403 atau OpenClaw menolak Webhook
  - H3: Tidak ada permintaan pairing yang muncul
  - H3: Pengiriman keluar gagal
  - H3: Pesan masuk tetapi agen tidak menjawab

## channels/synology-chat.md

- Rute: /channels/synology-chat
- Judul:
  - H2: Plugin bawaan
  - H2: Penyiapan cepat
  - H2: Variabel lingkungan
  - H2: Kebijakan DM dan kontrol akses
  - H2: Pengiriman keluar
  - H2: Multi-akun
  - H2: Catatan keamanan
  - H2: Pemecahan masalah
  - H2: Terkait

## channels/telegram.md

- Rute: /channels/telegram
- Judul:
  - H2: Penyiapan cepat
  - H2: Pengaturan sisi Telegram
  - H2: Kontrol akses dan aktivasi
  - H3: Identitas bot grup
  - H2: Perilaku runtime
  - H2: Referensi fitur
  - H2: Kontrol balasan kesalahan
  - H2: Pemecahan masalah
  - H2: Referensi konfigurasi
  - H2: Terkait

## channels/tlon.md

- Rute: /channels/tlon
- Judul:
  - H2: Plugin bawaan
  - H2: Penyiapan
  - H2: Ship privat/LAN
  - H2: Kanal grup
  - H2: Kontrol akses
  - H2: Sistem pemilik dan persetujuan
  - H2: Pengaturan terima otomatis
  - H2: Target pengiriman (CLI/cron)
  - H2: Skill bawaan
  - H2: Kapabilitas
  - H2: Pemecahan masalah
  - H2: Referensi konfigurasi
  - H2: Catatan
  - H2: Terkait

## channels/troubleshooting.md

- Rute: /channels/troubleshooting
- Judul:
  - H2: Tangga perintah
  - H2: Setelah pembaruan
  - H2: WhatsApp
  - H3: Tanda kegagalan WhatsApp
  - H2: Telegram
  - H3: Tanda kegagalan Telegram
  - H2: Discord
  - H3: Tanda kegagalan Discord
  - H2: Slack
  - H3: Tanda kegagalan Slack
  - H2: iMessage
  - H3: Tanda kegagalan iMessage
  - H2: Signal
  - H3: Tanda kegagalan Signal
  - H2: QQ Bot
  - H3: Tanda kegagalan QQ Bot
  - H2: Matrix
  - H3: Tanda kegagalan Matrix
  - H2: Terkait

## channels/twitch.md

- Rute: /channels/twitch
- Judul:
  - H2: Plugin bawaan
  - H2: Penyiapan cepat (pemula)
  - H2: Apa ini
  - H2: Penyiapan (terperinci)
  - H3: Buat kredensial
  - H3: Konfigurasikan bot
  - H3: Kontrol akses (direkomendasikan)
  - H2: Penyegaran token (opsional)
  - H2: Dukungan multi-akun
  - H2: Kontrol akses
  - H2: Pemecahan masalah
  - H2: Konfigurasi
  - H3: Konfigurasi akun
  - H3: Opsi penyedia
  - H2: Tindakan alat
  - H2: Keamanan dan operasi
  - H2: Batasan
  - H2: Terkait

## channels/wechat.md

- Rute: /channels/wechat
- Judul:
  - H2: Penamaan
  - H2: Cara kerjanya
  - H2: Instal
  - H2: Masuk
  - H2: Kontrol akses
  - H2: Kompatibilitas
  - H2: Proses sidecar
  - H2: Pemecahan masalah
  - H2: Dokumen terkait

## channels/whatsapp.md

- Rute: /channels/whatsapp
- Judul:
  - H2: Instal (sesuai kebutuhan)
  - H2: Penyiapan cepat
  - H2: Pola deployment
  - H2: Model runtime
  - H2: Prompt persetujuan
  - H2: Hook Plugin dan privasi
  - H2: Kontrol akses dan aktivasi
  - H2: Binding ACP yang dikonfigurasi
  - H2: Perilaku nomor pribadi dan obrolan sendiri
  - H2: Normalisasi pesan dan konteks
  - H2: Pengiriman, pemotongan, dan media
  - H2: Kutipan balasan
  - H2: Level reaksi
  - H2: Reaksi pengakuan
  - H2: Reaksi status siklus hidup
  - H2: Multi-akun dan kredensial
  - H2: Alat, tindakan, dan penulisan konfigurasi
  - H2: Pemecahan masalah
  - H2: Prompt sistem
  - H2: Penunjuk referensi konfigurasi
  - H2: Terkait

## channels/yuanbao.md

- Rute: /channels/yuanbao
- Judul:
  - H2: Mulai cepat
  - H3: Penyiapan interaktif (alternatif)
  - H2: Kontrol akses
  - H3: Pesan langsung
  - H3: Obrolan grup
  - H2: Contoh konfigurasi
  - H3: Penyiapan dasar dengan kebijakan DM terbuka
  - H3: Batasi DM ke pengguna tertentu
  - H3: Nonaktifkan persyaratan @mention di grup
  - H3: Optimalkan pengiriman pesan keluar
  - H3: Sesuaikan strategi penggabungan teks
  - H2: Perintah umum
  - H2: Pemecahan masalah
  - H3: Bot tidak merespons di obrolan grup
  - H3: Bot tidak menerima pesan
  - H3: Bot mengirim balasan kosong atau fallback
  - H3: App Secret bocor
  - H2: Konfigurasi lanjutan
  - H3: Beberapa akun
  - H3: Batas pesan
  - H3: Streaming
  - H3: Konteks riwayat obrolan grup
  - H3: Mode balas-ke
  - H3: Injeksi petunjuk Markdown
  - H3: Mode debug
  - H3: Perutean multi-agen
  - H2: Referensi konfigurasi
  - H2: Jenis pesan yang didukung
  - H3: Terima
  - H3: Kirim
  - H3: Thread dan balasan
  - H2: Terkait

## channels/zalo.md

- Rute: /channels/zalo
- Judul:
  - H2: Plugin bawaan
  - H2: Penyiapan cepat (pemula)
  - H2: Apa ini
  - H2: Penyiapan (jalur cepat)
  - H3: 1) Buat token bot (Zalo Bot Platform)
  - H3: 2) Konfigurasikan token (env atau konfigurasi)
  - H2: Cara kerjanya (perilaku)
  - H2: Batasan
  - H2: Kontrol akses (DM)
  - H3: Akses DM
  - H2: Kontrol akses (Grup)
  - H2: Long-polling vs webhook
  - H2: Jenis pesan yang didukung
  - H2: Kapabilitas
  - H2: Target pengiriman (CLI/cron)
  - H2: Pemecahan masalah
  - H2: Referensi konfigurasi (Zalo)
  - H2: Terkait

## channels/zaloclawbot.md

- Rute: /channels/zaloclawbot
- Judul:
  - H2: Kompatibilitas
  - H2: Prasyarat
  - H2: Instal dengan onboard (direkomendasikan)
  - H2: Instalasi manual
  - H3: 1. Instal Plugin
  - H3: 2. Aktifkan Plugin di konfigurasi
  - H3: 3. Buat kode QR dan masuk
  - H3: 4. Mulai ulang Gateway
  - H2: Cara kerjanya
  - H2: Di balik layar
  - H2: Pemecahan masalah

## channels/zalouser.md

- Rute: /channels/zalouser
- Judul:
  - H2: Plugin bawaan
  - H2: Penyiapan cepat (pemula)
  - H2: Apa ini
  - H2: Penamaan
  - H2: Menemukan ID (direktori)
  - H2: Batasan
  - H2: Kontrol akses (DM)
  - H2: Akses grup (opsional)
  - H3: Pembatasan mention grup
  - H2: Multi-akun
  - H2: Variabel lingkungan
  - H2: Pengetikan, reaksi, dan pengakuan pengiriman
  - H2: Pemecahan masalah
  - H2: Terkait

## ci.md

- Rute: /ci
- Judul:
  - H2: Gambaran umum pipeline
  - H2: Urutan fail-fast
  - H2: Konteks PR dan bukti
  - H2: Cakupan dan perutean
  - H2: Penerusan aktivitas ClawSweeper
  - H2: Dispatch manual
  - H2: Runner
  - H2: Anggaran pendaftaran runner
  - H2: Padanan lokal
  - H2: Performa OpenClaw
  - H2: Validasi rilis penuh
  - H2: Shard live dan E2E
  - H2: Penerimaan paket
  - H3: Job
  - H3: Sumber kandidat
  - H3: Profil suite
  - H3: Jendela kompatibilitas legacy
  - H3: Contoh
  - H2: Smoke instalasi
  - H2: E2E Docker lokal
  - H3: Pengaturan
  - H3: Workflow live/E2E yang dapat digunakan ulang
  - H3: Potongan jalur rilis
  - H2: Prarilis Plugin
  - H2: Lab QA
  - H2: CodeQL
  - H3: Kategori keamanan
  - H3: Shard keamanan khusus platform
  - H3: Kategori Kualitas Kritis
  - H2: Workflow pemeliharaan
  - H3: Agen Docs
  - H3: Agen Performa Tes
  - H3: PR Duplikat Setelah Merge
  - H2: Gate pemeriksaan lokal dan perutean perubahan
  - H2: Validasi Testbox
  - H2: Terkait

## clawhub/cli.md

- Rute: /clawhub/cli
- Judul:
  - H1: CLI ClawHub
  - H2: Temukan dan instal
  - H2: Publikasikan dan pelihara
  - H2: Terkait

## clawhub/publishing.md

- Rute: /clawhub/publishing
- Judul:
  - H1: Publikasi di ClawHub
  - H2: Pemilik
  - H2: Skills
  - H2: Plugin
  - H2: Alur rilis
  - H2: FAQ
  - H3: Scope paket harus cocok dengan pemilik yang dipilih

## cli/acp.md

- Rute: /cli/acp
- Judul:
  - H2: Yang bukan ini
  - H2: Matriks kompatibilitas
  - H2: Batasan yang diketahui
  - H2: Penggunaan
  - H2: Klien ACP (debug)
  - H2: Pengujian smoke protokol
  - H2: Cara menggunakan ini
  - H2: Memilih agen
  - H2: Gunakan dari acpx (Codex, Claude, klien ACP lain)
  - H2: Penyiapan editor Zed
  - H2: Pemetaan sesi
  - H2: Opsi
  - H3: opsi klien acp
  - H2: Terkait

## cli/agent.md

- Rute: /cli/agent
- Judul:
  - H1: openclaw agent
  - H2: Opsi
  - H2: Contoh
  - H2: Catatan
  - H2: Status pengiriman JSON
  - H2: Terkait

## cli/agents.md

- Rute: /cli/agents
- Judul:
  - H1: openclaw agents
  - H2: Contoh
  - H2: Binding perutean
  - H3: format --bind
  - H3: Perilaku cakupan binding
  - H2: Permukaan perintah
  - H3: agents
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents delete
  - H2: File identitas
  - H2: Atur identitas
  - H2: Terkait

## cli/approvals.md

- Rute: /cli/approvals
- Judul:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: Perintah umum
  - H2: Ganti persetujuan dari file
  - H2: Contoh "Jangan pernah minta prompt" / YOLO
  - H2: Helper allowlist
  - H2: Opsi umum
  - H2: Catatan
  - H2: Terkait

## cli/attach.md

- Rute: /cli/attach
- Judul: tidak ada

## cli/backup.md

- Rute: /cli/backup
- Judul:
  - H1: openclaw backup
  - H2: Catatan
  - H2: Yang dicadangkan
  - H2: Perilaku konfigurasi tidak valid
  - H2: Ukuran dan performa
  - H2: Terkait

## cli/browser.md

- Rute: /cli/browser
- Judul:
  - H1: openclaw browser
  - H2: Flag umum
  - H2: Mulai cepat (lokal)
  - H2: Pemecahan masalah cepat
  - H2: Siklus hidup
  - H2: Jika perintah tidak ada
  - H2: Profil
  - H2: Tab
  - H2: Snapshot / tangkapan layar / tindakan
  - H2: Status dan penyimpanan
  - H2: Debugging
  - H2: Chrome yang sudah ada melalui MCP
  - H2: Kontrol browser jarak jauh (proxy host node)
  - H2: Terkait

## cli/channels.md

- Rute: /cli/channels
- Judul:
  - H1: openclaw channels
  - H2: Perintah umum
  - H2: Status / kapabilitas / resolve / log
  - H2: Tambah / hapus akun
  - H2: Masuk dan keluar (interaktif)
  - H2: Pemecahan masalah
  - H2: Probe kapabilitas
  - H2: Resolve nama menjadi ID
  - H2: Terkait

## cli/clawbot.md

- Rute: /cli/clawbot
- Judul:
  - H1: openclaw clawbot
  - H2: Migrasi
  - H2: Terkait

## cli/commitments.md

- Rute: /cli/commitments
- Judul:
  - H2: Penggunaan
  - H2: Opsi
  - H2: Contoh
  - H2: Output
  - H2: Terkait

## cli/completion.md

- Rute: /cli/completion
- Judul:
  - H1: openclaw completion
  - H2: Penggunaan
  - H2: Opsi
  - H2: Catatan
  - H2: Terkait

## cli/config.md

- Rute: /cli/config
- Judul:
  - H2: Opsi root
  - H2: Contoh
  - H3: skema konfigurasi
  - H3: Path
  - H2: Nilai
  - H2: mode config set
  - H2: config patch
  - H2: Flag builder penyedia
  - H2: Dry run
  - H3: Bentuk output JSON
  - H2: Keamanan penulisan
  - H2: Subperintah
  - H2: Validasi
  - H2: Terkait

## cli/configure.md

- Rute: /cli/configure
- Judul:
  - H1: openclaw configure
  - H2: Opsi
  - H2: Contoh
  - H2: Terkait

## cli/crestodian.md

- Rute: /cli/crestodian
- Judul:
  - H1: openclaw crestodian
  - H2: Yang ditampilkan Crestodian
  - H2: Contoh
  - H2: Startup aman
  - H2: Operasi dan persetujuan
  - H2: Bootstrap penyiapan
  - H2: Perencana Berbantuan Model
  - H2: Beralih ke agen
  - H2: Mode penyelamatan pesan
  - H2: Terkait

## cli/cron.md

- Rute: /cli/cron
- Judul:
  - H1: openclaw cron
  - H2: Buat job dengan cepat
  - H2: Sesi
  - H2: Pengiriman
  - H3: Kepemilikan pengiriman
  - H3: Pengiriman kegagalan
  - H2: Penjadwalan
  - H3: Job sekali jalan
  - H3: Job berulang
  - H3: Run manual
  - H2: Model
  - H3: Presedensi model Cron terisolasi
  - H3: Mode cepat
  - H3: Percobaan ulang pergantian model live
  - H2: Output run dan penolakan
  - H3: Supresi pengakuan basi
  - H3: Supresi token senyap
  - H3: Penolakan terstruktur
  - H2: Retensi
  - H2: Memigrasikan job lama
  - H2: Edit umum
  - H2: Perintah admin umum
  - H2: Terkait

## cli/daemon.md

- Rute: /cli/daemon
- Judul:
  - H1: openclaw daemon
  - H2: Penggunaan
  - H2: Subperintah
  - H2: Opsi umum
  - H2: Lebih disukai
  - H2: Terkait

## cli/dashboard.md

- Rute: /cli/dashboard
- Judul:
  - H1: openclaw dashboard
  - H2: Terkait

## cli/devices.md

- Rute: /cli/devices
- Judul:
  - H1: openclaw devices
  - H2: Perintah
  - H3: openclaw devices list
  - H3: openclaw devices remove
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices approve [requestId] [--latest]
  - H2: Persetujuan pertama kali dijalankan Paperclip / openclawgateway
  - H3: openclaw devices reject
  - H3: openclaw devices rotate --device --role [--scope ]
  - H3: openclaw devices revoke --device --role
  - H2: Opsi umum
  - H2: Catatan
  - H2: Daftar periksa pemulihan drift token
  - H2: Terkait

## cli/directory.md

- Rute: /cli/directory
- Judul:
  - H1: openclaw directory
  - H2: Flag umum
  - H2: Catatan
  - H2: Menggunakan hasil dengan pengiriman pesan
  - H2: Format ID (berdasarkan channel)
  - H2: Diri sendiri ("me")
  - H2: Peer (kontak/pengguna)
  - H2: Grup
  - H2: Terkait

## cli/dns.md

- Rute: /cli/dns
- Judul:
  - H1: openclaw dns
  - H2: Penyiapan
  - H2: dns setup
  - H2: Terkait

## cli/docs.md

- Rute: /cli/docs
- Judul:
  - H1: openclaw docs
  - H2: Penggunaan
  - H2: Contoh
  - H2: Cara kerjanya
  - H2: Output
  - H2: Kode keluar
  - H2: Terkait

## cli/doctor.md

- Rute: /cli/doctor
- Judul:
  - H1: openclaw doctor
  - H2: Mengapa menggunakannya
  - H2: Contoh
  - H2: Opsi
  - H2: Mode lint
  - H2: Pemeriksaan kesehatan terstruktur
  - H2: Pemilihan pemeriksaan
  - H2: Mode pasca-upgrade
  - H2: macOS: override env launchctl
  - H2: Terkait

## cli/flows.md

- Rute: /cli/flows
- Judul:
  - H1: openclaw tasks flow
  - H2: Subperintah
  - H3: Nilai filter status
  - H2: Contoh
  - H2: Terkait

## cli/gateway.md

- Rute: /cli/gateway
- Judul:
  - H2: Jalankan Gateway
  - H3: Opsi
  - H2: Mulai ulang Gateway
  - H3: Profiling Gateway
  - H2: Query Gateway yang sedang berjalan
  - H3: gateway health
  - H3: gateway usage-cost
  - H3: gateway stability
  - H3: gateway diagnostics export
  - H3: gateway status
  - H3: gateway probe
  - H4: Jarak jauh melalui SSH (paritas aplikasi Mac)
  - H3: gateway call
  - H2: Kelola layanan Gateway
  - H3: Instal dengan wrapper
  - H2: Temukan Gateway (Bonjour)
  - H3: gateway discover
  - H2: Terkait

## cli/health.md

- Rute: /cli/health
- Judul:
  - H1: openclaw health
  - H2: Opsi
  - H2: Terkait

## cli/hooks.md

- Rute: /cli/hooks
- Judul:
  - H1: openclaw hooks
  - H2: Cantumkan semua hook
  - H2: Dapatkan informasi hook
  - H2: Periksa kelayakan hook
  - H2: Aktifkan Hook
  - H2: Nonaktifkan Hook
  - H2: Catatan
  - H2: Instal paket hook
  - H2: Perbarui paket hook
  - H2: Hook bawaan
  - H3: session-memory
  - H3: bootstrap-extra-files
  - H3: command-logger
  - H3: boot-md
  - H2: Terkait

## cli/index.md

- Rute: /cli
- Judul:
  - H2: Halaman perintah
  - H2: Flag global
  - H2: Mode keluaran
  - H2: Pohon perintah
  - H2: Perintah slash chat
  - H2: Pelacakan penggunaan
  - H2: Terkait

## cli/infer.md

- Rute: /cli/infer
- Judul:
  - H2: Ubah infer menjadi skill
  - H2: Mengapa menggunakan infer
  - H2: Pohon perintah
  - H2: Tugas umum
  - H2: Perilaku
  - H2: Model
  - H2: Gambar
  - H2: Audio
  - H2: TTS
  - H2: Video
  - H2: Web
  - H2: Embedding
  - H2: Keluaran JSON
  - H2: Jebakan umum
  - H2: Catatan
  - H2: Terkait

## cli/logs.md

- Rute: /cli/logs
- Judul:
  - H1: openclaw logs
  - H2: Opsi
  - H2: Opsi RPC Gateway bersama
  - H2: Contoh
  - H2: Catatan
  - H2: Terkait

## cli/mcp.md

- Rute: /cli/mcp
- Judul:
  - H2: Pilih jalur MCP yang tepat
  - H2: OpenClaw sebagai server MCP
  - H3: Kapan menggunakan serve
  - H3: Cara kerjanya
  - H3: Pilih mode klien
  - H3: Apa yang diekspos serve
  - H3: Penggunaan
  - H3: Alat bridge
  - H3: Model peristiwa
  - H3: Notifikasi kanal Claude
  - H3: Konfigurasi klien MCP
  - H3: Opsi
  - H3: Batas keamanan dan kepercayaan
  - H3: Pengujian
  - H3: Pemecahan masalah
  - H2: OpenClaw sebagai registri klien MCP
  - H3: Definisi server MCP tersimpan
  - H3: Resep server umum
  - H3: Bentuk keluaran JSON
  - H3: Transport stdio
  - H3: Transport SSE / HTTP
  - H3: Alur kerja OAuth
  - H3: Transport HTTP yang dapat di-stream
  - H2: UI Kontrol
  - H2: Batas saat ini
  - H2: Terkait

## cli/memory.md

- Rute: /cli/memory
- Judul:
  - H1: openclaw memory
  - H2: Contoh
  - H2: Opsi
  - H2: Dreaming
  - H2: Terkait

## cli/message.md

- Rute: /cli/message
- Judul:
  - H1: openclaw message
  - H2: Penggunaan
  - H2: Flag umum
  - H2: Perilaku SecretRef
  - H2: Tindakan
  - H3: Inti
  - H3: Thread
  - H3: Emoji
  - H3: Stiker
  - H3: Peran / Kanal / Anggota / Suara
  - H3: Peristiwa
  - H3: Moderasi (Discord)
  - H3: Siaran
  - H2: Contoh
  - H2: Terkait

## cli/migrate.md

- Rute: /cli/migrate
- Judul:
  - H1: openclaw migrate
  - H2: Perintah
  - H2: Model keselamatan
  - H2: Penyedia Claude
  - H3: Apa yang diimpor Claude
  - H3: Status arsip dan tinjauan manual
  - H2: Penyedia Codex
  - H3: Apa yang diimpor Codex
  - H3: Status Codex tinjauan manual
  - H2: Penyedia Hermes
  - H3: Apa yang diimpor Hermes
  - H3: Kunci .env yang didukung
  - H3: Status khusus arsip
  - H3: Setelah menerapkan
  - H2: Kontrak Plugin
  - H2: Integrasi onboarding
  - H2: Terkait

## cli/models.md

- Rute: /cli/models
- Judul:
  - H1: openclaw models
  - H2: Perintah umum
  - H3: Pemindaian model
  - H3: Status model
  - H2: Alias + fallback
  - H2: Profil auth
  - H2: Terkait

## cli/node.md

- Rute: /cli/node
- Judul:
  - H1: openclaw node
  - H2: Mengapa menggunakan host Node?
  - H2: Proksi browser (tanpa konfigurasi)
  - H2: Jalankan (foreground)
  - H2: Auth Gateway untuk host Node
  - H2: Layanan (background)
  - H2: Pairing
  - H2: Persetujuan exec
  - H2: Terkait

## cli/nodes.md

- Rute: /cli/nodes
- Judul:
  - H1: openclaw nodes
  - H2: Perintah umum
  - H2: Panggil
  - H2: Terkait

## cli/onboard.md

- Rute: /cli/onboard
- Judul:
  - H1: openclaw onboard
  - H2: Panduan terkait
  - H2: Contoh
  - H2: Lokal
  - H3: Pilihan endpoint Z.AI non-interaktif
  - H2: Flag non-interaktif tambahan
  - H2: Catatan alur
  - H2: Perintah lanjutan umum

## cli/pairing.md

- Rute: /cli/pairing
- Judul:
  - H1: openclaw pairing
  - H2: Perintah
  - H2: pairing list
  - H2: pairing approve
  - H2: Catatan
  - H2: Terkait

## cli/path.md

- Rute: /cli/path
- Judul:
  - H1: openclaw path
  - H2: Mengapa menggunakannya
  - H2: Cara penggunaannya
  - H2: Cara kerjanya
  - H2: Subperintah
  - H2: Flag global
  - H2: Sintaks oc://
  - H2: Pengalamatan berdasarkan jenis file
  - H2: Kontrak mutasi
  - H2: Contoh
  - H2: Resep berdasarkan jenis file
  - H3: Markdown
  - H3: JSONC
  - H3: JSONL
  - H3: YAML
  - H2: Referensi subperintah
  - H3: resolve
  - H3: find
  - H3: set
  - H3: validate
  - H3: emit
  - H2: Kode keluar
  - H2: Mode keluaran
  - H2: Catatan
  - H2: Terkait

## cli/plugins.md

- Rute: /cli/plugins
- Judul:
  - H2: Perintah
  - H3: Penulis
  - H3: Scaffold penyedia
  - H3: Instal
  - H4: Singkatan marketplace
  - H3: Daftar
  - H3: Indeks Plugin
  - H3: Hapus instalasi
  - H3: Perbarui
  - H3: Inspeksi
  - H3: Doctor
  - H3: Registri
  - H3: Marketplace
  - H2: Terkait

## cli/policy.md

- Rute: /cli/policy
- Judul:
  - H1: openclaw policy
  - H2: Mulai cepat
  - H3: Referensi aturan kebijakan
  - H4: Overlay tercakup
  - H4: Kanal
  - H4: Server MCP
  - H4: Penyedia model
  - H4: Jaringan
  - H4: Akses ingress dan kanal
  - H4: Gateway
  - H4: Workspace agen
  - H4: Postur sandbox
  - H4: Penanganan Data
  - H4: Rahasia
  - H4: Persetujuan exec
  - H4: Profil auth
  - H4: Metadata alat
  - H4: Postur alat
  - H2: Konfigurasikan kebijakan
  - H2: Terima status kebijakan
  - H2: Temuan
  - H2: Perbaikan
  - H2: Kode keluar
  - H2: Terkait

## cli/proxy.md

- Rute: /cli/proxy
- Judul:
  - H1: openclaw proxy
  - H2: Perintah
  - H2: Validasi
  - H2: Preset kueri
  - H2: Catatan
  - H2: Terkait

## cli/qr.md

- Rute: /cli/qr
- Judul:
  - H1: openclaw qr
  - H2: Penggunaan
  - H2: Opsi
  - H2: Catatan
  - H2: Terkait

## cli/reset.md

- Rute: /cli/reset
- Judul:
  - H1: openclaw reset
  - H2: Terkait

## cli/sandbox.md

- Rute: /cli/sandbox
- Judul:
  - H2: Ikhtisar
  - H2: Perintah
  - H3: openclaw sandbox explain
  - H3: openclaw sandbox list
  - H3: openclaw sandbox recreate
  - H2: Kasus penggunaan
  - H3: Setelah memperbarui image Docker
  - H3: Setelah mengubah konfigurasi sandbox
  - H3: Setelah mengubah target SSH atau material auth SSH
  - H3: Setelah mengubah sumber, kebijakan, atau mode OpenShell
  - H3: Setelah mengubah setupCommand
  - H3: Hanya untuk agen tertentu
  - H2: Mengapa ini diperlukan
  - H2: Migrasi registri
  - H2: Konfigurasi
  - H2: Terkait

## cli/secrets.md

- Rute: /cli/secrets
- Judul:
  - H1: openclaw secrets
  - H2: Muat ulang snapshot runtime
  - H2: Audit
  - H2: Konfigurasikan (pembantu interaktif)
  - H2: Terapkan rencana tersimpan
  - H2: Mengapa tidak ada cadangan rollback
  - H2: Contoh
  - H2: Terkait

## cli/security.md

- Rute: /cli/security
- Judul:
  - H1: openclaw security
  - H2: Audit
  - H2: Keluaran JSON
  - H2: Apa yang diubah --fix
  - H2: Terkait

## cli/sessions.md

- Rute: /cli/sessions
- Judul:
  - H1: openclaw sessions
  - H2: Pemeliharaan pembersihan
  - H2: Padatkan sesi
  - H3: RPC sessions.compact
  - H2: Terkait

## cli/setup.md

- Rute: /cli/setup
- Judul:
  - H1: openclaw setup
  - H2: Opsi
  - H3: Mode baseline
  - H2: Contoh
  - H2: Catatan
  - H2: Terkait

## cli/skills.md

- Rute: /cli/skills
- Judul:
  - H1: openclaw skills
  - H2: Perintah
  - H2: Skill Workshop
  - H2: Terkait

## cli/status.md

- Rute: /cli/status
- Judul:
  - H2: Terkait

## cli/system.md

- Rute: /cli/system
- Judul:
  - H1: openclaw system
  - H2: Perintah umum
  - H2: system event
  - H2: system heartbeat last|enable|disable
  - H2: system presence
  - H2: Catatan
  - H2: Terkait

## cli/tasks.md

- Rute: /cli/tasks
- Judul:
  - H2: Penggunaan
  - H2: Opsi root
  - H2: Subperintah
  - H3: list
  - H3: show
  - H3: notify
  - H3: cancel
  - H3: audit
  - H3: maintenance
  - H3: flow
  - H2: Terkait

## cli/transcripts.md

- Rute: /cli/transcripts
- Judul:
  - H1: openclaw transcripts
  - H2: Perintah
  - H2: Keluaran
  - H2: Banyak rapat per hari
  - H2: Ringkasan hilang
  - H2: Konfigurasi

## cli/tui.md

- Rute: /cli/tui
- Judul:
  - H1: openclaw tui
  - H2: Opsi
  - H2: Contoh
  - H2: Loop perbaikan konfigurasi
  - H2: Terkait

## cli/uninstall.md

- Rute: /cli/uninstall
- Judul:
  - H1: openclaw uninstall
  - H2: Terkait

## cli/update.md

- Rute: /cli/update
- Judul:
  - H1: openclaw update
  - H2: Penggunaan
  - H2: Opsi
  - H2: update status
  - H2: update repair
  - H2: update wizard
  - H2: Apa yang dilakukannya
  - H3: Bentuk respons control-plane
  - H2: Alur checkout Git
  - H3: Pemilihan kanal
  - H3: Langkah pembaruan
  - H2: Singkatan --update
  - H2: Terkait

## cli/voicecall.md

- Rute: /cli/voicecall
- Judul:
  - H1: openclaw voicecall
  - H2: Subperintah
  - H2: Setup dan smoke
  - H3: setup
  - H3: smoke
  - H2: Siklus hidup panggilan
  - H3: call
  - H3: start
  - H3: continue
  - H3: speak
  - H3: dtmf
  - H3: end
  - H3: status
  - H2: Log dan metrik
  - H3: tail
  - H3: latency
  - H2: Mengekspos Webhook
  - H3: expose
  - H2: Terkait

## cli/webhooks.md

- Rute: /cli/webhooks
- Judul:
  - H1: openclaw webhooks
  - H2: Subperintah
  - H2: webhooks gmail setup
  - H3: Wajib
  - H3: Opsi Pub/Sub
  - H3: Opsi pengiriman OpenClaw
  - H3: Opsi gog watch serve
  - H3: Eksposur Tailscale
  - H3: Keluaran
  - H2: webhooks gmail run
  - H2: Alur end-to-end
  - H2: Terkait

## cli/wiki.md

- Rute: /cli/wiki
- Judul:
  - H1: openclaw wiki
  - H2: Untuk apa ini digunakan
  - H2: Perintah umum
  - H2: Perintah
  - H3: wiki status
  - H3: wiki doctor
  - H3: wiki init
  - H3: wiki ingest
  - H3: wiki okf import
  - H3: wiki compile
  - H3: wiki lint
  - H3: wiki search
  - H3: wiki get
  - H3: wiki apply
  - H3: wiki bridge import
  - H3: wiki unsafe-local import
  - H3: wiki obsidian ...
  - H2: Panduan penggunaan praktis
  - H2: Keterkaitan konfigurasi
  - H2: Terkait

## cli/workboard.md

- Rute: /cli/workboard
- Judul:
  - H2: Penggunaan
  - H2: list
  - H2: create
  - H2: show
  - H2: dispatch
  - H2: Kesetaraan Perintah Slash
  - H2: Izin
  - H2: Pemecahan masalah
  - H3: Tidak Ada Kartu yang Muncul
  - H3: Dispatch Mengatakan Data-Only
  - H3: Dispatch Tidak Memulai Apa Pun
  - H2: Terkait

## concepts/active-memory.md

- Rute: /concepts/active-memory
- Judul:
  - H2: Mulai cepat
  - H2: Rekomendasi kecepatan
  - H3: Setup Cerebras
  - H2: Cara melihatnya
  - H2: Toggle sesi
  - H2: Kapan berjalan
  - H2: Jenis sesi
  - H2: Di mana berjalan
  - H2: Mengapa menggunakannya
  - H2: Cara kerjanya
  - H2: Mode kueri
  - H2: Gaya prompt
  - H2: Kebijakan fallback model
  - H2: Alat memori
  - H3: memory-core bawaan
  - H3: Memori LanceDB
  - H3: Lossless Claw
  - H2: Escape hatch lanjutan
  - H2: Persistensi transkrip
  - H2: Konfigurasi
  - H2: Setup yang direkomendasikan
  - H3: Masa tenggang cold-start
  - H2: Debugging
  - H2: Masalah umum
  - H2: Halaman terkait

## concepts/agent-loop.md

- Rute: /concepts/agent-loop
- Judul:
  - H2: Titik masuk
  - H2: Cara kerjanya (tingkat tinggi)
  - H2: Antrean + konkurensi
  - H2: Persiapan sesi + workspace
  - H2: Perakitan prompt + prompt sistem
  - H2: Titik hook (tempat Anda dapat mengintersep)
  - H3: Hook internal (hook Gateway)
  - H3: Hook Plugin (siklus hidup agen + gateway)
  - H2: Streaming + balasan parsial
  - H2: Eksekusi alat + alat pesan
  - H2: Pembentukan balasan + supresi
  - H2: Compaction + percobaan ulang
  - H2: Stream peristiwa (hari ini)
  - H2: Penanganan kanal chat
  - H2: Timeout
  - H2: Tempat hal dapat berakhir lebih awal
  - H2: Terkait

## concepts/agent-runtimes.md

- Rute: /concepts/agent-runtimes
- Judul:
  - H2: Permukaan Codex
  - H2: Kepemilikan runtime
  - H2: Pemilihan runtime
  - H2: Runtime agen GitHub Copilot
  - H2: Kontrak kompatibilitas
  - H2: Label status
  - H2: Terkait

## concepts/agent-workspace.md

- Rute: /concepts/agent-workspace
- Judul:
  - H2: Lokasi default
  - H2: Folder workspace tambahan
  - H2: Peta file workspace
  - H2: Apa yang TIDAK ada di workspace
  - H2: Cadangan Git (direkomendasikan, privat)
  - H2: Jangan commit rahasia
  - H2: Memindahkan workspace ke mesin baru
  - H2: Catatan lanjutan
  - H2: Terkait

## concepts/agent.md

- Rute: /concepts/agent
- Judul:
  - H2: Workspace (wajib)
  - H2: File bootstrap (disuntikkan)
  - H2: Alat bawaan
  - H2: Skills
  - H2: Batas runtime
  - H2: Sesi
  - H2: Mengarahkan saat streaming
  - H2: Referensi model
  - H2: Konfigurasi (minimal)
  - H2: Terkait

## concepts/architecture.md

- Rute: /concepts/architecture
- Judul:
  - H2: Ikhtisar
  - H2: Komponen dan alur
  - H3: Gateway (daemon)
  - H3: Klien (aplikasi Mac / CLI / admin web)
  - H3: Node (macOS / iOS / Android / headless)
  - H3: WebChat
  - H2: Siklus hidup koneksi (klien tunggal)
  - H2: Protokol kabel (ringkasan)
  - H2: Pairing + kepercayaan lokal
  - H2: Pengetikan protokol dan pembuatan kode
  - H2: Akses jarak jauh
  - H2: Cuplikan operasi
  - H2: Invarian
  - H2: Terkait

## concepts/channel-docking.md

- Rute: /concepts/channel-docking
- Judul:
  - H2: Contoh
  - H2: Mengapa menggunakannya
  - H2: Konfigurasi wajib
  - H2: Perintah
  - H2: Apa yang berubah
  - H2: Apa yang tidak berubah
  - H2: Pemecahan masalah

## concepts/commitments.md

- Rute: /concepts/commitments
- Judul:
  - H2: Aktifkan komitmen
  - H2: Cara kerjanya
  - H2: Cakupan
  - H2: Komitmen vs pengingat
  - H2: Kelola komitmen
  - H2: Privasi dan biaya
  - H2: Pemecahan masalah
  - H2: Terkait

## concepts/compaction.md

- Rute: /concepts/compaction
- Judul:
  - H2: Cara kerjanya
  - H2: Compaction otomatis
  - H2: Compaction manual
  - H2: Konfigurasi
  - H3: Menggunakan model lain
  - H3: Preservasi pengenal
  - H3: Penjaga byte transkrip aktif
  - H3: Transkrip penerus
  - H3: Pemberitahuan Compaction
  - H3: Flush memori
  - H2: Penyedia Compaction yang dapat dipasang
  - H2: Compaction vs pemangkasan
  - H2: Pemecahan masalah
  - H2: Terkait

## concepts/context-engine.md

- Rute: /concepts/context-engine
- Judul:
  - H2: Mulai cepat
  - H2: Cara kerjanya
  - H3: Siklus hidup subagen (opsional)
  - H3: Penambahan prompt sistem
  - H2: Mesin lama
  - H2: Mesin Plugin
  - H3: Antarmuka ContextEngine
  - H3: Pengaturan runtime
  - H3: Persyaratan host
  - H3: Isolasi kegagalan
  - H3: ownsCompaction
  - H2: Referensi konfigurasi
  - H2: Hubungan dengan Compaction dan memori
  - H2: Tips
  - H2: Terkait

## concepts/context.md

- Rute: /concepts/context
- Judul:
  - H2: Mulai cepat (periksa konteks)
  - H2: Contoh output
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: Apa yang dihitung ke jendela konteks
  - H2: Cara OpenClaw membangun prompt sistem
  - H2: File Workspace yang disuntikkan (Konteks Proyek)
  - H2: Skills: disuntikkan vs dimuat sesuai permintaan
  - H2: Alat: ada dua biaya
  - H2: Perintah, direktif, dan "pintasan inline"
  - H2: Sesi, Compaction, dan pemangkasan (apa yang bertahan)
  - H2: Apa yang sebenarnya dilaporkan /context
  - H2: Terkait

## concepts/delegate-architecture.md

- Rute: /concepts/delegate-architecture
- Judul:
  - H2: Apa itu delegasi?
  - H2: Mengapa delegasi?
  - H2: Tingkat kapabilitas
  - H3: Tingkat 1: Hanya Baca + Draf
  - H3: Tingkat 2: Kirim atas Nama
  - H3: Tingkat 3: Proaktif
  - H2: Prasyarat: isolasi dan pengerasan
  - H3: Blokir keras (tidak dapat dinegosiasikan)
  - H3: Pembatasan alat
  - H3: Isolasi sandbox
  - H3: Jejak audit
  - H2: Menyiapkan delegasi
  - H3: 1. Buat agen delegasi
  - H3: 2. Konfigurasi delegasi penyedia identitas
  - H4: Microsoft 365
  - H4: Google Workspace
  - H3: 3. Ikat delegasi ke channel
  - H3: 4. Tambahkan kredensial ke agen delegasi
  - H2: Contoh: asisten organisasi
  - H2: Pola penskalaan
  - H2: Terkait

## concepts/dreaming.md

- Rute: /concepts/dreaming
- Judul:
  - H2: Apa yang ditulis Dreaming
  - H2: Model fase
  - H2: Ingesti transkrip sesi
  - H2: Buku Harian Dream
  - H2: Sinyal pemeringkatan mendalam
  - H2: Cakupan laporan uji bayangan QA
  - H2: Penjadwalan
  - H2: Mulai cepat
  - H2: Perintah slash
  - H2: Alur kerja CLI
  - H2: Default utama
  - H2: UI Dream
  - H2: Dreaming tidak pernah berjalan: status menunjukkan diblokir
  - H2: Terkait

## concepts/experimental-features.md

- Rute: /concepts/experimental-features
- Judul:
  - H2: Flag yang saat ini didokumentasikan
  - H2: Mode ramping model lokal
  - H3: Mengapa tiga alat ini
  - H3: Kapan mengaktifkannya
  - H3: Kapan membiarkannya nonaktif
  - H3: Aktifkan
  - H2: Eksperimental bukan berarti tersembunyi
  - H2: Terkait

## concepts/features.md

- Rute: /concepts/features
- Judul:
  - H2: Sorotan
  - H2: Daftar lengkap
  - H2: Terkait

## concepts/mantis-slack-desktop-runbook.md

- Rute: /concepts/mantis-slack-desktop-runbook
- Judul:
  - H2: Model penyimpanan
  - H2: Dispatch GitHub
  - H2: CLI lokal
  - H2: Mode hydrate
  - H2: Interpretasi timing
  - H2: Daftar periksa bukti
  - H2: Penanganan kegagalan
  - H2: Terkait

## concepts/mantis.md

- Rute: /concepts/mantis
- Judul:
  - H2: Tujuan
  - H2: Bukan tujuan
  - H2: Kepemilikan
  - H2: Bentuk perintah
  - H2: Siklus hidup run
  - H2: MVP Discord
  - H2: Bagian QA yang ada
  - H2: Model bukti
  - H2: Browser dan VNC
  - H2: Mesin
  - H2: Rahasia
  - H2: Artefak GitHub dan komentar PR
  - H2: Catatan deployment privat
  - H2: Menambahkan skenario
  - H2: Perluasan penyedia
  - H2: Pertanyaan terbuka

## concepts/markdown-formatting.md

- Rute: /concepts/markdown-formatting
- Judul:
  - H2: Tujuan
  - H2: Pipeline
  - H2: Contoh IR
  - H2: Tempat digunakan
  - H2: Penanganan tabel
  - H2: Aturan chunking
  - H2: Kebijakan tautan
  - H2: Spoiler
  - H2: Cara menambah atau memperbarui formatter channel
  - H2: Kendala umum
  - H2: Terkait

## concepts/memory-builtin.md

- Rute: /concepts/memory-builtin
- Judul:
  - H2: Apa yang disediakannya
  - H2: Memulai
  - H2: Penyedia embedding yang didukung
  - H2: Cara pengindeksan bekerja
  - H2: Kapan digunakan
  - H2: Pemecahan masalah
  - H2: Konfigurasi
  - H2: Terkait

## concepts/memory-honcho.md

- Rute: /concepts/memory-honcho
- Judul:
  - H2: Apa yang disediakannya
  - H2: Alat yang tersedia
  - H2: Memulai
  - H2: Konfigurasi
  - H2: Memigrasikan memori yang ada
  - H2: Cara kerjanya
  - H2: Honcho vs memori bawaan
  - H2: Perintah CLI
  - H2: Bacaan lanjutan
  - H2: Terkait

## concepts/memory-qmd.md

- Rute: /concepts/memory-qmd
- Judul:
  - H2: Apa yang ditambahkannya di atas bawaan
  - H2: Memulai
  - H3: Prasyarat
  - H3: Aktifkan
  - H2: Cara kerja sidecar
  - H2: Performa pencarian dan kompatibilitas
  - H2: Override model
  - H2: Mengindeks path tambahan
  - H2: Mengindeks transkrip sesi
  - H2: Cakupan pencarian
  - H2: Sitasi
  - H2: Kapan digunakan
  - H2: Pemecahan masalah
  - H2: Konfigurasi
  - H2: Terkait

## concepts/memory-search.md

- Rute: /concepts/memory-search
- Judul:
  - H2: Mulai cepat
  - H2: Penyedia yang didukung
  - H2: Cara pencarian bekerja
  - H2: Meningkatkan kualitas pencarian
  - H3: Peluruhan temporal
  - H3: MMR (keberagaman)
  - H3: Aktifkan keduanya
  - H2: Memori multimodal
  - H2: Pencarian memori sesi
  - H2: Pemecahan masalah
  - H2: Bacaan lanjutan
  - H2: Terkait

## concepts/memory.md

- Rute: /concepts/memory
- Judul:
  - H2: Cara kerjanya
  - H2: Apa ditempatkan di mana
  - H2: Memori sensitif tindakan
  - H2: Komitmen tersimpul
  - H2: Alat memori
  - H2: Plugin pendamping Wiki Memori
  - H2: Pencarian memori
  - H2: Backend memori
  - H2: Lapisan wiki pengetahuan
  - H2: Flush memori otomatis
  - H2: Dreaming
  - H2: Backfill ter-grounding dan promosi live
  - H2: CLI
  - H2: Bacaan lanjutan
  - H2: Terkait

## concepts/message-lifecycle-refactor.md

- Rute: /concepts/message-lifecycle-refactor
- Judul:
  - H2: Masalah
  - H2: Tujuan
  - H2: Bukan tujuan
  - H2: Model referensi
  - H2: Model inti
  - H2: Istilah pesan
  - H3: Pesan
  - H3: Target
  - H3: Relasi
  - H3: Asal
  - H3: Tanda terima
  - H2: Konteks terima
  - H2: Konteks kirim
  - H2: Konteks live
  - H2: Permukaan adapter
  - H2: Pengurangan SDK publik
  - H2: Hubungan dengan inbound channel
  - H2: Guardrail kompatibilitas
  - H2: Penyimpanan internal
  - H2: Kelas kegagalan
  - H2: Pemetaan channel
  - H2: Rencana migrasi
  - H3: Fase 1: Domain Pesan Internal
  - H3: Fase 2: Inti Kirim Tahan Lama
  - H3: Fase 3: Bridge Inbound Channel
  - H3: Fase 4: Bridge Dispatcher yang Disiapkan
  - H3: Fase 5: Siklus Hidup Live Terpadu
  - H3: Fase 6: SDK Publik
  - H3: Fase 7: Semua Pengirim
  - H3: Fase 8: Hapus Kompatibilitas Bernama Turn
  - H2: Rencana pengujian
  - H2: Pertanyaan terbuka
  - H2: Kriteria penerimaan
  - H2: Terkait

## concepts/messages.md

- Rute: /concepts/messages
- Judul:
  - H2: Alur pesan (tingkat tinggi)
  - H2: Dedupe inbound
  - H2: Debouncing inbound
  - H2: Sesi dan perangkat
  - H2: Metadata hasil alat
  - H2: Isi inbound dan konteks riwayat
  - H2: Antrean dan tindak lanjut
  - H2: Kepemilikan run channel
  - H2: Streaming, chunking, dan batching
  - H2: Visibilitas penalaran dan token
  - H2: Prefiks, threading, dan balasan
  - H2: Balasan senyap
  - H2: Terkait

## concepts/model-failover.md

- Rute: /concepts/model-failover
- Judul:
  - H2: Alur runtime
  - H2: Kebijakan sumber seleksi
  - H2: Cache lewati kegagalan auth
  - H2: Pemberitahuan fallback yang terlihat pengguna
  - H2: Penyimpanan auth (kunci + OAuth)
  - H2: ID profil
  - H2: Urutan rotasi
  - H3: Kelengketan sesi (ramah cache)
  - H3: Langganan OpenAI Codex plus cadangan kunci API
  - H2: Cooldown
  - H2: Penonaktifan penagihan
  - H2: Fallback model
  - H3: Aturan rantai kandidat
  - H3: Error mana yang memajukan fallback
  - H3: Perilaku lewati cooldown vs probe
  - H2: Override sesi dan pengalihan model live
  - H2: Observabilitas dan ringkasan kegagalan
  - H2: Konfigurasi terkait

## concepts/model-providers.md

- Rute: /concepts/model-providers
- Judul:
  - H2: Aturan cepat
  - H2: Perilaku penyedia milik Plugin
  - H2: Rotasi kunci API
  - H2: Plugin penyedia resmi
  - H3: OpenAI
  - H3: Anthropic
  - H3: OpenAI ChatGPT/Codex OAuth
  - H3: Opsi hosted bergaya langganan lainnya
  - H3: OpenCode
  - H3: Google Gemini (kunci API)
  - H3: Google Vertex dan Gemini CLI
  - H3: Z.AI (GLM)
  - H3: Vercel AI Gateway
  - H3: Plugin penyedia bundled lainnya
  - H4: Keunikan yang perlu diketahui
  - H2: Penyedia via models.providers (URL kustom/dasar)
  - H3: Moonshot AI (Kimi)
  - H3: Kimi coding
  - H3: Volcano Engine (Doubao)
  - H3: BytePlus (Internasional)
  - H3: Synthetic
  - H3: MiniMax
  - H3: LM Studio
  - H3: Ollama
  - H3: vLLM
  - H3: SGLang
  - H3: Proksi lokal (LM Studio, vLLM, LiteLLM, dll.)
  - H2: Contoh CLI
  - H2: Terkait

## concepts/models.md

- Rute: /concepts/models
- Judul:
  - H2: Cara seleksi model bekerja
  - H2: Sumber seleksi dan perilaku fallback
  - H2: Kebijakan model cepat
  - H2: Onboarding (direkomendasikan)
  - H2: Kunci konfigurasi (ikhtisar)
  - H3: Edit allowlist yang aman
  - H2: "Model tidak diizinkan" (dan mengapa balasan berhenti)
  - H2: Mengganti model di chat (/model)
  - H2: Perintah CLI
  - H3: models list
  - H3: models status
  - H2: Pemindaian (model gratis OpenRouter)
  - H2: Registry model (models.json)
  - H2: Terkait

## concepts/multi-agent.md

- Rute: /concepts/multi-agent
- Judul:
  - H2: Apa itu "satu agen"?
  - H2: Path (peta cepat)
  - H3: Mode agen tunggal (default)
  - H2: Pembantu agen
  - H2: Mulai cepat
  - H2: Banyak agen = banyak orang, banyak kepribadian
  - H2: Pencarian memori QMD lintas agen
  - H2: Satu nomor WhatsApp, banyak orang (pemisahan DM)
  - H2: Aturan routing (cara pesan memilih agen)
  - H2: Beberapa akun / nomor telepon
  - H2: Konsep
  - H2: Contoh platform
  - H2: Pola umum
  - H2: Sandbox per agen dan konfigurasi alat
  - H2: Terkait

## concepts/oauth.md

- Rute: /concepts/oauth
- Judul:
  - H2: Sink token (mengapa ada)
  - H2: Penyimpanan (tempat token berada)
  - H2: Kompatibilitas token lama Anthropic
  - H2: Migrasi Anthropic Claude CLI
  - H2: Pertukaran OAuth (cara login bekerja)
  - H3: setup-token Anthropic
  - H3: OpenAI Codex (ChatGPT OAuth)
  - H2: Refresh + kedaluwarsa
  - H2: Beberapa akun (profil) + routing
  - H3: 1) Disarankan: agen terpisah
  - H3: 2) Lanjutan: beberapa profil dalam satu agen
  - H2: Terkait

## concepts/parallel-specialist-lanes.md

- Rute: /concepts/parallel-specialist-lanes
- Judul:
  - H2: Prinsip dasar
  - H2: Rollout yang direkomendasikan
  - H3: Fase 1: kontrak lane + pekerjaan berat di latar belakang
  - H3: Fase 2: kontrol prioritas dan konkurensi
  - H3: Fase 3: koordinator / pengendali lalu lintas
  - H2: Templat kontrak lane minimal
  - H2: Terkait

## concepts/personal-agent-benchmark-pack.md

- Rute: /concepts/personal-agent-benchmark-pack
- Judul:
  - H2: Skenario
  - H2: Model Privasi
  - H2: Memperluas Paket

## concepts/presence.md

- Rute: /concepts/presence
- Judul:
  - H2: Kolom presence (yang ditampilkan)
  - H2: Produsen (asal presence)
  - H3: 1) Entri mandiri Gateway
  - H3: 2) Koneksi WebSocket
  - H4: Mengapa perintah CLI sekali jalan tidak muncul
  - H3: 3) beacon system-event
  - H3: 4) Node terhubung (peran: node)
  - H2: Aturan merge + dedupe (mengapa instanceId penting)
  - H2: TTL dan ukuran terbatas
  - H2: Catatan remote/tunnel (IP loopback)
  - H2: Konsumen
  - H3: Tab Instans macOS
  - H2: Tips debugging
  - H2: Terkait

## concepts/progress-drafts.md

- Rute: /concepts/progress-drafts
- Judul:
  - H2: Mulai cepat
  - H2: Yang dilihat pengguna
  - H2: Pilih mode
  - H2: Konfigurasikan label
  - H2: Kontrol baris progres
  - H2: Perilaku channel
  - H2: Finalisasi
  - H2: Pemecahan masalah
  - H2: Terkait

## concepts/qa-e2e-automation.md

- Rute: /concepts/qa-e2e-automation
- Judul:
  - H2: Permukaan perintah
  - H2: Alur operator
  - H2: Cakupan transport live
  - H2: Referensi QA Telegram, Discord, Slack, dan WhatsApp
  - H3: Flag CLI bersama
  - H3: QA Telegram
  - H3: QA Discord
  - H3: QA Slack
  - H4: Menyiapkan workspace Slack
  - H3: QA WhatsApp
  - H3: Pool kredensial Convex
  - H2: Seed berbasis repo
  - H2: Lane mock provider
  - H2: Adapter transport
  - H3: Menambahkan channel
  - H3: Nama helper skenario
  - H2: Pelaporan
  - H2: Dokumen terkait

## concepts/qa-matrix.md

- Rute: /concepts/qa-matrix
- Judul:
  - H2: Mulai cepat
  - H2: Yang dilakukan lane
  - H2: CLI
  - H3: Flag umum
  - H3: Flag provider
  - H2: Profil
  - H2: Skenario
  - H2: Variabel lingkungan
  - H2: Artefak output
  - H2: Tips triase
  - H2: Kontrak transport live
  - H2: Terkait

## concepts/queue-steering.md

- Rute: /concepts/queue-steering
- Judul:
  - H2: Batas runtime
  - H2: Mode
  - H2: Contoh burst
  - H2: Cakupan
  - H2: Debounce
  - H2: Terkait

## concepts/queue.md

- Rute: /concepts/queue
- Judul:
  - H2: Mengapa
  - H2: Cara kerjanya
  - H2: Default
  - H2: Mode antrean
  - H2: Opsi antrean
  - H2: Pengarahan dan streaming
  - H2: Presedensi
  - H2: Override per sesi
  - H2: Cakupan dan jaminan
  - H2: Pemecahan masalah
  - H2: Terkait

## concepts/retry.md

- Rute: /concepts/retry
- Judul:
  - H2: Tujuan
  - H2: Default
  - H2: Perilaku
  - H3: Provider model
  - H3: Discord
  - H3: Telegram
  - H2: Konfigurasi
  - H2: Catatan
  - H2: Terkait

## concepts/session-pruning.md

- Rute: /concepts/session-pruning
- Judul:
  - H2: Mengapa ini penting
  - H2: Cara kerjanya
  - H2: Pembersihan gambar lama
  - H2: Default cerdas
  - H2: Aktifkan atau nonaktifkan
  - H2: Pruning vs compaction
  - H2: Bacaan lanjutan
  - H2: Terkait

## concepts/session-tool.md

- Rute: /concepts/session-tool
- Judul:
  - H2: Tool yang tersedia
  - H2: Mencantumkan dan membaca sesi
  - H2: Mengirim pesan lintas sesi
  - H2: Helper status dan orkestrasi
  - H2: Menjalankan sub-agen
  - H2: Visibilitas
  - H2: Bacaan lanjutan
  - H2: Terkait

## concepts/session.md

- Rute: /concepts/session
- Judul:
  - H2: Cara pesan dirutekan
  - H2: Isolasi DM
  - H3: Channel tertaut Dock
  - H2: Siklus hidup sesi
  - H2: Tempat state berada
  - H2: Pemeliharaan sesi
  - H2: Memeriksa sesi
  - H2: Bacaan lanjutan
  - H2: Terkait

## concepts/soul.md

- Rute: /concepts/soul
- Judul:
  - H2: Isi SOUL.md
  - H2: Mengapa ini bekerja
  - H2: Prompt Molty
  - H2: Seperti apa yang baik
  - H2: Satu peringatan
  - H2: Terkait

## concepts/streaming.md

- Rute: /concepts/streaming
- Judul:
  - H2: Streaming blok (pesan channel)
  - H3: Pengiriman media dengan streaming blok
  - H2: Algoritma chunking (batas rendah/tinggi)
  - H2: Coalescing (menggabungkan blok yang di-stream)
  - H2: Jeda seperti manusia antar blok
  - H2: "Stream chunk atau semuanya"
  - H2: Mode streaming pratinjau
  - H3: Pemetaan channel
  - H3: Perilaku runtime
  - H3: Pembaruan pratinjau progres tool
  - H3: Lane progres komentar
  - H2: Terkait

## concepts/system-prompt.md

- Rute: /concepts/system-prompt
- Judul:
  - H2: Struktur
  - H2: Mode prompt
  - H2: Snapshot prompt
  - H2: Injeksi bootstrap workspace
  - H2: Penanganan waktu
  - H2: Skills
  - H2: Dokumentasi
  - H2: Terkait

## concepts/timezone.md

- Rute: /concepts/timezone
- Judul:
  - H2: Tiga permukaan zona waktu
  - H2: Mengatur zona waktu pengguna
  - H2: Kapan melakukan override
  - H2: Terkait

## concepts/typebox.md

- Rute: /concepts/typebox
- Judul:
  - H2: Model mental (30 detik)
  - H2: Lokasi skema
  - H2: Pipeline saat ini
  - H2: Cara skema digunakan saat runtime
  - H2: Contoh frame
  - H2: Klien minimal (Node.js)
  - H2: Contoh lengkap: menambahkan metode dari awal sampai akhir
  - H2: Perilaku codegen Swift
  - H2: Versioning + kompatibilitas
  - H2: Pola dan konvensi skema
  - H2: JSON skema live
  - H2: Saat Anda mengubah skema
  - H2: Terkait

## concepts/typing-indicators.md

- Rute: /concepts/typing-indicators
- Judul:
  - H2: Default
  - H2: Mode
  - H2: Konfigurasi
  - H2: Catatan
  - H2: Terkait

## concepts/usage-tracking.md

- Rute: /concepts/usage-tracking
- Judul:
  - H2: Apa itu
  - H2: Di mana ini muncul
  - H2: Mode footer penggunaan default
  - H3: Tiga state sesi yang berbeda
  - H3: Presedensi
  - H3: Mengatur ulang vs. mematikan
  - H3: Perilaku toggle
  - H3: Konfigurasi
  - H2: Footer lengkap /usage kustom
  - H3: Bentuk
  - H3: Jalur Kontrak
  - H3: Verba
  - H3: Bentuk bagian
  - H3: Contoh
  - H2: Provider + kredensial
  - H2: Terkait

## date-time.md

- Rute: /date-time
- Judul:
  - H2: Envelope pesan (lokal secara default)
  - H3: Contoh
  - H2: Prompt sistem: tanggal dan waktu saat ini
  - H2: Baris event sistem (lokal secara default)
  - H3: Konfigurasikan zona waktu pengguna + format
  - H2: Deteksi format waktu (otomatis)
  - H2: Payload tool + connector (waktu provider mentah + kolom ternormalisasi)
  - H2: Dokumen terkait

## debug/node-issue.md

- Rute: /debug/node-issue
- Judul:
  - H1: Crash Node + tsx "\\name is not a function"
  - H2: Ringkasan
  - H2: Lingkungan
  - H2: Repro (khusus Node)
  - H2: Repro minimal di repo
  - H2: Pemeriksaan versi Node
  - H2: Catatan / hipotesis
  - H2: Riwayat regresi
  - H2: Solusi sementara
  - H2: Referensi
  - H2: Langkah berikutnya
  - H2: Terkait

## diagnostics/flags.md

- Rute: /diagnostics/flags
- Judul:
  - H2: Cara kerjanya
  - H2: Aktifkan melalui konfigurasi
  - H2: Override env (sekali jalan)
  - H2: Flag profiling
  - H2: Artefak timeline
  - H2: Lokasi log
  - H2: Ekstrak log
  - H2: Catatan
  - H2: Terkait

## gateway/authentication.md

- Rute: /gateway/authentication
- Judul:
  - H2: Penyiapan yang direkomendasikan (API key, provider apa pun)
  - H2: Anthropic: kompatibilitas Claude CLI dan token
  - H2: Catatan Anthropic
  - H2: Memeriksa status auth model
  - H2: Perilaku rotasi API key (gateway)
  - H2: Menghapus auth provider saat gateway berjalan
  - H2: Mengontrol kredensial yang digunakan
  - H3: OpenAI dan ID openai-codex lama
  - H3: Saat login (CLI)
  - H3: Per sesi (perintah chat)
  - H3: Per agen (override CLI)
  - H2: Pemecahan masalah
  - H3: "Tidak ada kredensial yang ditemukan"
  - H3: Token akan kedaluwarsa/sudah kedaluwarsa
  - H2: Terkait

## gateway/background-process.md

- Rute: /gateway/background-process
- Judul:
  - H2: tool exec
  - H2: Bridging proses child
  - H2: tool process
  - H2: Contoh
  - H2: Terkait

## gateway/bonjour.md

- Rute: /gateway/bonjour
- Judul:
  - H2: Bonjour area luas (Unicast DNS-SD) melalui Tailscale
  - H3: Konfigurasi Gateway (direkomendasikan)
  - H3: Penyiapan server DNS satu kali (host gateway)
  - H3: Pengaturan DNS Tailscale
  - H3: Keamanan listener Gateway (direkomendasikan)
  - H2: Yang mengiklankan
  - H2: Jenis layanan
  - H2: Kunci TXT (petunjuk non-rahasia)
  - H2: Debugging di macOS
  - H2: Debugging di log Gateway
  - H2: Debugging di node iOS
  - H2: Kapan mengaktifkan Bonjour
  - H2: Kapan menonaktifkan Bonjour
  - H2: Catatan Docker
  - H2: Pemecahan masalah Bonjour yang dinonaktifkan
  - H2: Mode kegagalan umum
  - H2: Nama instans yang di-escape (\032)
  - H2: Mengaktifkan / menonaktifkan / konfigurasi
  - H2: Dokumen terkait

## gateway/bridge-protocol.md

- Rute: /gateway/bridge-protocol
- Judul:
  - H2: Mengapa ini pernah ada
  - H2: Transport
  - H2: Handshake + pairing
  - H2: Frame
  - H2: Event siklus hidup exec
  - H2: Penggunaan tailnet historis
  - H2: Versioning
  - H2: Terkait

## gateway/cli-backends.md

- Rute: /gateway/cli-backends
- Judul:
  - H2: Mulai cepat ramah pemula
  - H2: Menggunakannya sebagai fallback
  - H2: Ikhtisar konfigurasi
  - H3: Contoh konfigurasi
  - H2: Cara kerjanya
  - H2: Sesi
  - H2: Pembuka fallback dari sesi claude-cli
  - H2: Gambar (pass-through)
  - H2: Input / output
  - H2: Default (dimiliki plugin)
  - H2: Default milik plugin
  - H2: Kepemilikan Compaction native
  - H2: Overlay MCP bundel
  - H2: Batas riwayat reseed
  - H2: Batasan
  - H2: Pemecahan masalah
  - H2: Terkait

## gateway/config-agents.md

- Rute: /gateway/config-agents
- Judul:
  - H2: Default agen
  - H3: agents.defaults.workspace
  - H3: agents.defaults.repoRoot
  - H3: agents.defaults.skills
  - H3: agents.defaults.skipBootstrap
  - H3: agents.defaults.skipOptionalBootstrapFiles
  - H3: agents.defaults.contextInjection
  - H3: agents.defaults.bootstrapMaxChars
  - H3: agents.defaults.bootstrapTotalMaxChars
  - H3: Override profil bootstrap per agen
  - H3: agents.defaults.bootstrapPromptTruncationWarning
  - H3: Peta kepemilikan anggaran konteks
  - H4: agents.defaults.startupContext
  - H4: agents.defaults.contextLimits
  - H4: agents.list[].contextLimits
  - H4: skills.limits.maxSkillsPromptChars
  - H4: agents.list[].skillsLimits.maxSkillsPromptChars
  - H3: agents.defaults.imageMaxDimensionPx
  - H3: agents.defaults.imageQuality
  - H3: agents.defaults.userTimezone
  - H3: agents.defaults.timeFormat
  - H3: agents.defaults.model
  - H3: Kebijakan runtime
  - H3: agents.defaults.cliBackends
  - H3: agents.defaults.promptOverlays
  - H3: agents.defaults.heartbeat
  - H3: agents.defaults.compaction
  - H3: agents.defaults.runRetries
  - H3: agents.defaults.contextPruning
  - H3: Streaming blok
  - H3: Indikator mengetik
  - H3: agents.defaults.sandbox
  - H3: agents.list (override per agen)
  - H2: Routing multi-agen
  - H3: Kolom pencocokan binding
  - H3: Profil akses per agen
  - H2: Sesi
  - H2: Pesan
  - H3: Prefiks respons
  - H3: Reaksi ack
  - H3: Debounce inbound
  - H3: TTS (text-to-speech)
  - H2: Talk
  - H2: Terkait

## gateway/config-channels.md

- Rute: /gateway/config-channels
- Judul:
  - H2: Channel
  - H3: Akses DM dan grup
  - H3: Override model channel
  - H3: Default channel dan heartbeat
  - H3: WhatsApp
  - H3: Telegram
  - H3: Discord
  - H3: Google Chat
  - H3: Slack
  - H3: Mattermost
  - H3: Signal
  - H3: iMessage
  - H3: Matrix
  - H3: Microsoft Teams
  - H3: IRC
  - H3: Multi-akun (semua channel)
  - H3: Channel plugin lainnya
  - H3: Gating mention chat grup
  - H4: Batas riwayat DM
  - H4: Mode chat diri
  - H3: Perintah (penanganan perintah chat)
  - H2: Terkait

## gateway/config-tools.md

- Rute: /gateway/config-tools
- Judul:
  - H2: Alat
  - H3: Profil alat
  - H3: Grup alat
  - H3: Alat MCP dan Plugin dalam kebijakan alat sandbox
  - H3: tools.codeMode
  - H3: tools.allow / tools.deny
  - H3: tools.byProvider
  - H3: tools.toolsBySender
  - H3: tools.elevated
  - H3: tools.exec
  - H3: tools.loopDetection
  - H3: tools.web
  - H3: tools.media
  - H3: tools.agentToAgent
  - H3: tools.sessions
  - H3: tools.sessionsspawn
  - H3: tools.experimental
  - H3: agents.defaults.subagents
  - H2: Penyedia kustom dan URL dasar
  - H3: Detail kolom penyedia
  - H3: Contoh penyedia
  - H2: Terkait

## gateway/configuration-examples.md

- Rute: /gateway/configuration-examples
- Judul:
  - H2: Mulai cepat
  - H3: Minimum absolut
  - H3: Awal yang direkomendasikan
  - H2: Contoh diperluas (opsi utama)
  - H3: Repositori skill saudara yang disymlink
  - H2: Pola umum
  - H3: Baseline skill bersama dengan satu override
  - H3: Penyiapan multi-platform
  - H3: Persetujuan otomatis jaringan node tepercaya
  - H3: Mode DM aman (kotak masuk bersama / DM multi-pengguna)
  - H3: Kunci API Anthropic + fallback MiniMax
  - H3: Bot kerja (akses terbatas)
  - H3: Hanya model lokal
  - H2: Tips
  - H2: Terkait

## gateway/configuration-reference.md

- Rute: /gateway/configuration-reference
- Judul:
  - H2: Kanal
  - H2: Default agen, multi-agen, sesi, dan pesan
  - H2: Alat dan penyedia kustom
  - H2: Model
  - H2: MCP
  - H2: Skills
  - H2: Plugin
  - H3: Konfigurasi plugin harness Codex
  - H2: Komitmen
  - H2: Browser
  - H2: UI
  - H2: Gateway
  - H3: Endpoint kompatibel OpenAI
  - H3: Isolasi multi-instans
  - H3: gateway.tls
  - H3: gateway.reload
  - H2: Hook
  - H3: Integrasi Gmail
  - H2: Host plugin Canvas
  - H2: Penemuan
  - H3: mDNS (Bonjour)
  - H3: Area luas (DNS-SD)
  - H2: Lingkungan
  - H3: env (variabel lingkungan inline)
  - H3: Substitusi variabel lingkungan
  - H2: Rahasia
  - H3: SecretRef
  - H3: Permukaan kredensial yang didukung
  - H3: Konfigurasi penyedia rahasia
  - H2: Penyimpanan auth
  - H3: auth.cooldowns
  - H2: Logging
  - H2: Diagnostik
  - H2: Pembaruan
  - H2: ACP
  - H2: CLI
  - H2: Wizard
  - H2: Identitas
  - H2: Bridge (legacy, dihapus)
  - H2: Cron
  - H3: cron.retry
  - H3: cron.failureAlert
  - H3: cron.failureDestination
  - H2: Variabel templat model media
  - H2: Penyertaan konfigurasi ($include)
  - H2: Terkait

## gateway/configuration.md

- Rute: /gateway/configuration
- Judul:
  - H2: Konfigurasi minimal
  - H2: Mengedit konfigurasi
  - H2: Validasi ketat
  - H2: Tugas umum
  - H2: Hot reload konfigurasi
  - H3: Mode reload
  - H3: Yang diterapkan secara hot vs yang memerlukan restart
  - H3: Perencanaan reload
  - H2: RPC konfigurasi (pembaruan terprogram)
  - H2: Variabel lingkungan
  - H2: Referensi lengkap
  - H2: Terkait

## gateway/diagnostics.md

- Rute: /gateway/diagnostics
- Judul:
  - H2: Mulai cepat
  - H2: Perintah chat
  - H2: Isi ekspor
  - H2: Model privasi
  - H2: Perekam stabilitas
  - H2: Opsi berguna
  - H2: Nonaktifkan diagnostik
  - H2: Terkait

## gateway/discovery.md

- Rute: /gateway/discovery
- Judul:
  - H2: Istilah
  - H2: Mengapa kami mempertahankan direct dan SSH
  - H2: Input penemuan (bagaimana klien mengetahui lokasi gateway)
  - H3: 1) Penemuan Bonjour / DNS-SD
  - H4: Detail beacon layanan
  - H3: 2) Tailnet (lintas jaringan)
  - H3: 3) Target manual / SSH
  - H2: Pemilihan transport (kebijakan klien)
  - H2: Pairing + auth (transport direct)
  - H2: Tanggung jawab per komponen
  - H2: Terkait

## gateway/doctor.md

- Rute: /gateway/doctor
- Judul:
  - H2: Mulai cepat
  - H3: Mode headless dan otomatisasi
  - H2: Mode lint hanya-baca
  - H2: Yang dilakukan (ringkasan)
  - H2: Backfill dan reset UI Dreams
  - H2: Perilaku dan alasan terperinci
  - H2: Terkait

## gateway/external-apps.md

- Rute: /gateway/external-apps
- Judul:
  - H2: Yang tersedia saat ini
  - H2: Jalur yang direkomendasikan
  - H2: Kode aplikasi vs kode plugin
  - H2: Terkait

## gateway/gateway-lock.md

- Rute: /gateway/gateway-lock
- Judul:
  - H2: Mengapa
  - H2: Mekanisme
  - H2: Permukaan error
  - H2: Catatan operasional
  - H2: Terkait

## gateway/health.md

- Rute: /gateway/health
- Judul:
  - H2: Pemeriksaan cepat
  - H2: Diagnostik mendalam
  - H2: Konfigurasi monitor kesehatan
  - H2: Pemantauan uptime
  - H3: Contoh penyiapan layanan pemantauan
  - H2: Saat sesuatu gagal
  - H2: Perintah "health" khusus
  - H2: Terkait

## gateway/heartbeat.md

- Rute: /gateway/heartbeat
- Judul:
  - H2: Mulai cepat (pemula)
  - H2: Default
  - H2: Fungsi prompt Heartbeat
  - H2: Kontrak respons
  - H2: Konfigurasi
  - H3: Cakupan dan presedensi
  - H3: Heartbeat per agen
  - H3: Contoh jam aktif
  - H3: Penyiapan 24/7
  - H3: Contoh multi-akun
  - H3: Catatan kolom
  - H2: Perilaku pengiriman
  - H2: Kontrol visibilitas
  - H3: Fungsi setiap flag
  - H3: Contoh per-kanal vs per-akun
  - H3: Pola umum
  - H2: HEARTBEAT.md (opsional)
  - H3: tasks: blok
  - H3: Bisakah agen memperbarui HEARTBEAT.md?
  - H2: Bangun manual (sesuai permintaan)
  - H2: Pengiriman reasoning (opsional)
  - H2: Kesadaran biaya
  - H2: Overflow konteks setelah Heartbeat
  - H2: Terkait

## gateway/index.md

- Rute: /gateway
- Judul:
  - H2: Startup lokal 5 menit
  - H2: Model runtime
  - H2: Endpoint kompatibel OpenAI
  - H3: Presedensi port dan bind
  - H3: Mode hot reload
  - H2: Set perintah operator
  - H2: Beberapa gateway (host yang sama)
  - H2: Akses jarak jauh
  - H2: Supervisi dan siklus hidup layanan
  - H2: Jalur cepat profil dev
  - H2: Referensi cepat protokol (tampilan operator)
  - H2: Pemeriksaan operasional
  - H3: Liveness
  - H3: Readiness
  - H3: Pemulihan gap
  - H2: Tanda kegagalan umum
  - H2: Jaminan keamanan
  - H2: Terkait

## gateway/local-model-services.md

- Rute: /gateway/local-model-services
- Judul:
  - H2: Cara kerjanya
  - H2: Bentuk konfigurasi
  - H2: Kolom
  - H2: Contoh Inferrs
  - H2: Contoh ds4
  - H2: Catatan operasional
  - H2: Terkait

## gateway/local-models.md

- Rute: /gateway/local-models
- Judul:
  - H2: Spesifikasi perangkat keras minimum
  - H2: Pilih backend
  - H2: Direkomendasikan: LM Studio + model lokal besar (Responses API)
  - H3: Konfigurasi hibrida: primer ter-host, fallback lokal
  - H3: Lokal lebih dulu dengan jaring pengaman ter-host
  - H3: Hosting regional / routing data
  - H2: Proxy lokal lain yang kompatibel OpenAI
  - H2: Backend yang lebih kecil atau lebih ketat
  - H2: Pemecahan masalah
  - H2: Terkait

## gateway/logging.md

- Rute: /gateway/logging
- Judul:
  - H1: Logging
  - H2: Logger berbasis file
  - H2: Penangkapan konsol
  - H2: Redaksi
  - H2: Log WebSocket Gateway
  - H3: Gaya log WS
  - H2: Pemformatan konsol (logging subsistem)
  - H2: Terkait

## gateway/multiple-gateways.md

- Rute: /gateway/multiple-gateways
- Judul:
  - H2: Penyiapan terbaik yang direkomendasikan
  - H2: Mulai Cepat Rescue-Bot
  - H2: Mengapa ini berhasil
  - H2: Yang Diubah oleh --profile rescue onboard
  - H2: Penyiapan multi-gateway umum
  - H2: Daftar periksa isolasi
  - H2: Pemetaan port (diturunkan)
  - H2: Catatan Browser/CDP (jebakan umum)
  - H2: Contoh env manual
  - H2: Pemeriksaan cepat
  - H2: Terkait

## gateway/network-model.md

- Rute: /gateway/network-model
- Judul:
  - H2: Terkait

## gateway/openai-http-api.md

- Rute: /gateway/openai-http-api
- Judul:
  - H2: Autentikasi
  - H2: Batas keamanan (penting)
  - H2: Kapan menggunakan endpoint ini
  - H2: Kontrak model agent-first
  - H2: Mengaktifkan endpoint
  - H2: Menonaktifkan endpoint
  - H2: Perilaku sesi
  - H2: Mengapa permukaan ini penting
  - H2: Daftar model dan routing agen
  - H2: Streaming (SSE)
  - H2: Kontrak alat chat
  - H3: Kolom permintaan yang didukung
  - H3: Varian yang tidak didukung
  - H3: Bentuk respons alat non-streaming
  - H3: Bentuk respons alat streaming
  - H3: Loop tindak lanjut alat
  - H2: Penyiapan cepat Open WebUI
  - H2: Contoh
  - H2: Terkait

## gateway/openresponses-http-api.md

- Rute: /gateway/openresponses-http-api
- Judul:
  - H2: Autentikasi, keamanan, dan routing
  - H2: Perilaku sesi
  - H2: Bentuk permintaan (didukung)
  - H2: Item (input)
  - H3: message
  - H3: functioncalloutput (alat berbasis turn)
  - H3: reasoning dan itemreference
  - H2: Alat (alat fungsi sisi klien)
  - H2: Gambar (inputimage)
  - H2: File (inputfile)
  - H2: Batas file + gambar (konfigurasi)
  - H2: Streaming (SSE)
  - H2: Penggunaan
  - H2: Error
  - H2: Contoh
  - H2: Terkait

## gateway/openshell.md

- Rute: /gateway/openshell
- Judul:
  - H2: Prasyarat
  - H2: Mulai cepat
  - H2: Mode workspace
  - H3: mirror
  - H3: remote
  - H3: Memilih mode
  - H2: Referensi konfigurasi
  - H2: Contoh
  - H3: Penyiapan remote minimal
  - H3: Mode mirror dengan GPU
  - H3: OpenShell per-agen dengan gateway kustom
  - H2: Manajemen siklus hidup
  - H3: Kapan membuat ulang
  - H2: Penguatan keamanan
  - H2: Batasan saat ini
  - H2: Cara kerjanya
  - H2: Terkait

## gateway/opentelemetry.md

- Rute: /gateway/opentelemetry
- Judul:
  - H2: Bagaimana semuanya terhubung
  - H2: Mulai cepat
  - H2: Sinyal yang diekspor
  - H2: Referensi konfigurasi
  - H3: Variabel lingkungan
  - H2: Privasi dan penangkapan konten
  - H2: Sampling dan flushing
  - H2: Metrik yang diekspor
  - H3: Penggunaan model
  - H3: Alur pesan
  - H3: Bicara
  - H3: Antrean dan sesi
  - H3: Telemetri liveness sesi
  - H3: Siklus hidup harness
  - H3: Eksekusi alat
  - H3: Exec
  - H3: Internal diagnostik (memori dan loop alat)
  - H2: Span yang diekspor
  - H2: Katalog event diagnostik
  - H2: Tanpa exporter
  - H2: Nonaktifkan
  - H2: Terkait

## gateway/operator-scopes.md

- Rute: /gateway/operator-scopes
- Judul:
  - H2: Peran
  - H2: Tingkat cakupan
  - H2: Cakupan metode hanya gerbang pertama
  - H2: Persetujuan pairing perangkat
  - H2: Persetujuan pairing node
  - H2: Auth rahasia bersama

## gateway/pairing.md

- Rute: /gateway/pairing
- Judul:
  - H2: Konsep
  - H2: Cara kerja pairing
  - H2: Alur kerja CLI (ramah headless)
  - H2: Permukaan API (protokol gateway)
  - H2: Gating perintah node (2026.3.31+)
  - H2: Batas kepercayaan event node (2026.3.31+)
  - H2: Persetujuan otomatis (aplikasi macOS)
  - H2: Persetujuan otomatis perangkat Trusted-CIDR
  - H2: Persetujuan otomatis upgrade metadata
  - H2: Helper pairing QR
  - H2: Lokalitas dan header yang diteruskan
  - H2: Penyimpanan (lokal, privat)
  - H2: Perilaku transport
  - H2: Terkait

## gateway/prometheus.md

- Rute: /gateway/prometheus
- Judul:
  - H2: Mulai cepat
  - H2: Metrik yang diekspor
  - H2: Kebijakan label
  - H2: Resep PromQL
  - H2: Memilih antara ekspor Prometheus dan OpenTelemetry
  - H2: Pemecahan masalah
  - H2: Terkait

## gateway/protocol.md

- Rute: /gateway/protocol
- Judul:
  - H2: Transport
  - H2: Handshake (connect)
  - H3: Contoh Node
  - H2: Framing
  - H2: Peran + cakupan
  - H3: Peran
  - H3: Cakupan (operator)
  - H3: Kapabilitas/perintah/izin (node)
  - H2: Presence
  - H3: Event node latar belakang aktif
  - H2: Pencakupan event broadcast
  - H2: Keluarga metode RPC umum
  - H3: Keluarga event umum
  - H3: Metode helper node
  - H3: RPC ledger tugas
  - H3: Metode helper operator
  - H3: Tampilan models.list
  - H2: Persetujuan exec
  - H2: Fallback pengiriman agen
  - H2: Versioning
  - H3: Konstanta klien
  - H2: Auth
  - H2: Identitas perangkat + pairing
  - H3: Diagnostik migrasi auth perangkat
  - H2: TLS + pinning
  - H2: Cakupan
  - H2: Terkait

## gateway/remote-gateway-readme.md

- Rute: /gateway/remote-gateway-readme
- Judul:
  - H1: Menjalankan OpenClaw.app dengan Remote Gateway
  - H2: Ikhtisar
  - H2: Penyiapan cepat
  - H3: Langkah 1: Tambahkan Konfigurasi SSH
  - H3: Langkah 2: Salin Kunci SSH
  - H3: Langkah 3: Konfigurasikan Auth Remote Gateway
  - H3: Langkah 4: Mulai Tunnel SSH
  - H3: Langkah 5: Restart OpenClaw.app
  - H2: Mulai Otomatis Tunnel saat Login
  - H3: Buat file PLIST
  - H3: Muat Launch Agent
  - H2: Pemecahan masalah
  - H2: Cara kerjanya
  - H2: Terkait

## gateway/remote.md

- Rute: /gateway/remote
- Judul:
  - H2: Ide inti
  - H2: Pengaturan VPN dan tailnet umum
  - H3: Gateway yang selalu aktif di tailnet Anda
  - H3: Desktop rumah menjalankan Gateway
  - H3: Laptop menjalankan Gateway
  - H2: Alur perintah (apa yang berjalan di mana)
  - H2: Tunnel SSH (CLI + alat)
  - H2: Default remote CLI
  - H2: Prioritas kredensial
  - H2: Akses remote UI chat
  - H2: Mode remote aplikasi macOS
  - H2: Aturan keamanan (remote/VPN)
  - H3: macOS: tunnel SSH persisten melalui LaunchAgent
  - H4: Langkah 1: tambahkan konfigurasi SSH
  - H4: Langkah 2: salin kunci SSH (satu kali)
  - H4: Langkah 3: konfigurasikan token gateway
  - H4: Langkah 4: buat LaunchAgent
  - H4: Langkah 5: muat LaunchAgent
  - H4: Pemecahan masalah
  - H2: Terkait

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- Rute: /gateway/sandbox-vs-tool-policy-vs-elevated
- Judul:
  - H2: Debug cepat
  - H2: Sandbox: tempat alat berjalan
  - H3: Bind mount (pemeriksaan cepat keamanan)
  - H2: Kebijakan alat: alat mana yang ada/dapat dipanggil
  - H3: Grup alat (singkatan)
  - H2: Elevated: khusus exec "jalankan di host"
  - H2: Perbaikan umum "penjara sandbox"
  - H3: "Alat X diblokir oleh kebijakan alat sandbox"
  - H3: "Saya pikir ini main, mengapa ini di-sandbox?"
  - H2: Terkait

## gateway/sandboxing.md

- Rute: /gateway/sandboxing
- Judul:
  - H2: Apa yang di-sandbox
  - H2: Mode
  - H2: Cakupan
  - H2: Backend
  - H3: Memilih backend
  - H3: Backend Docker
  - H3: Backend SSH
  - H3: Backend OpenShell
  - H4: Mode workspace
  - H4: Siklus hidup OpenShell
  - H2: Akses workspace
  - H2: Bind mount khusus
  - H2: Image dan setup
  - H2: setupCommand (setup container satu kali)
  - H2: Kebijakan alat dan celah keluar
  - H2: Override multi-agent
  - H2: Contoh enable minimal
  - H2: Terkait

## gateway/secrets-plan-contract.md

- Rute: /gateway/secrets-plan-contract
- Judul:
  - H2: Bentuk file rencana
  - H2: Upsert dan penghapusan penyedia
  - H2: Cakupan target yang didukung
  - H2: Perilaku jenis target
  - H2: Aturan validasi path
  - H2: Perilaku kegagalan
  - H2: Perilaku persetujuan penyedia exec
  - H2: Catatan cakupan runtime dan audit
  - H2: Pemeriksaan operator
  - H2: Dokumen terkait

## gateway/secrets.md

- Rute: /gateway/secrets
- Judul:
  - H2: Tujuan dan model runtime
  - H2: Batas akses agen
  - H2: Pemfilteran permukaan aktif
  - H2: Diagnostik permukaan auth Gateway
  - H2: Preflight referensi onboarding
  - H2: Kontrak SecretRef
  - H2: Konfigurasi penyedia
  - H2: Kunci API berbasis file
  - H2: Contoh integrasi exec
  - H2: Variabel lingkungan server MCP
  - H2: Material auth SSH sandbox
  - H2: Permukaan kredensial yang didukung
  - H2: Perilaku dan prioritas yang diperlukan
  - H2: Pemicu aktivasi
  - H2: Sinyal terdegradasi dan pulih
  - H2: Resolusi path perintah
  - H2: Workflow audit dan konfigurasi
  - H2: Kebijakan keamanan satu arah
  - H2: Catatan kompatibilitas auth legacy
  - H2: Catatan UI web
  - H2: Terkait

## gateway/security/audit-checks.md

- Rute: /gateway/security/audit-checks
- Judul:
  - H2: Terkait

## gateway/security/exposure-runbook.md

- Rute: /gateway/security/exposure-runbook
- Judul:
  - H2: Pilih pola eksposur
  - H2: Inventaris pre-flight
  - H2: Pemeriksaan baseline
  - H2: Baseline aman minimum
  - H2: Eksposur DM dan grup
  - H2: Pemeriksaan proxy terbalik
  - H2: Tinjauan alat dan sandbox
  - H2: Validasi pascaperubahan
  - H2: Rencana rollback
  - H2: Checklist tinjauan

## gateway/security/index.md

- Rute: /gateway/security
- Judul:
  - H2: Cakupan dulu: model keamanan asisten pribadi
  - H2: Pemeriksaan cepat: audit keamanan openclaw
  - H3: Lock dependensi paket yang dipublikasikan
  - H3: Deployment dan kepercayaan host
  - H3: Operasi file yang aman
  - H3: Workspace Slack bersama: risiko nyata
  - H3: Agen bersama perusahaan: pola yang dapat diterima
  - H2: Konsep kepercayaan Gateway dan node
  - H2: Matriks batas kepercayaan
  - H2: Bukan kerentanan secara desain
  - H2: Baseline yang diperkuat dalam 60 detik
  - H2: Aturan cepat inbox bersama
  - H2: Model visibilitas konteks
  - H2: Apa yang diperiksa audit (tingkat tinggi)
  - H2: Peta penyimpanan kredensial
  - H2: Checklist audit keamanan
  - H2: Glosarium audit keamanan
  - H2: UI Kontrol melalui HTTP
  - H2: Ringkasan flag tidak aman atau berbahaya
  - H2: Konfigurasi proxy terbalik
  - H2: Catatan HSTS dan origin
  - H2: Log sesi lokal berada di disk
  - H2: Eksekusi Node (system.run)
  - H2: Skills dinamis (watcher / node remote)
  - H2: Model ancaman
  - H2: Konsep inti: kontrol akses sebelum kecerdasan
  - H2: Model otorisasi perintah
  - H2: Risiko alat control plane
  - H2: Plugin
  - H2: Model akses DM: pairing, allowlist, terbuka, dinonaktifkan
  - H2: Isolasi sesi DM (mode multi-pengguna)
  - H3: Mode DM aman (direkomendasikan)
  - H2: Allowlist untuk DM dan grup
  - H2: Injeksi prompt (apa itu, mengapa penting)
  - H2: Sanitasi token khusus konten eksternal
  - H2: Flag bypass konten eksternal tidak aman
  - H3: Injeksi prompt tidak memerlukan DM publik
  - H3: Backend LLM self-hosted
  - H3: Kekuatan model (catatan keamanan)
  - H2: Reasoning dan output verbose dalam grup
  - H2: Contoh pengerasan konfigurasi
  - H3: Izin file
  - H3: Eksposur jaringan (bind, port, firewall)
  - H3: Publikasi port Docker dengan UFW
  - H3: Discovery mDNS/Bonjour
  - H3: Kunci WebSocket Gateway (auth lokal)
  - H3: Header identitas Tailscale Serve
  - H3: Kontrol browser melalui host node (direkomendasikan)
  - H3: Secret di disk
  - H3: File .env workspace
  - H3: Log dan transkrip (redaksi dan retensi)
  - H3: DM: pairing secara default
  - H3: Grup: wajibkan mention di mana-mana
  - H3: Nomor terpisah (WhatsApp, Signal, Telegram)
  - H3: Mode read-only (melalui sandbox dan alat)
  - H3: Baseline aman (salin/tempel)
  - H2: Sandboxing (direkomendasikan)
  - H3: Guardrail delegasi sub-agen
  - H2: Risiko kontrol browser
  - H3: Kebijakan SSRF browser (ketat secara default)
  - H2: Profil akses per agen (multi-agen)
  - H3: Contoh: akses penuh (tanpa sandbox)
  - H3: Contoh: alat read-only + workspace read-only
  - H3: Contoh: tanpa akses filesystem/shell (pengiriman pesan penyedia diizinkan)
  - H2: Respons insiden
  - H3: Tahan
  - H3: Rotasi (anggap kompromi jika secret bocor)
  - H3: Audit
  - H3: Kumpulkan untuk laporan
  - H2: Pemindaian secret
  - H2: Melaporkan masalah keamanan

## gateway/security/secure-file-operations.md

- Rute: /gateway/security/secure-file-operations
- Judul:
  - H2: Default: tanpa helper Python
  - H2: Apa yang tetap terlindungi tanpa Python
  - H2: Apa yang ditambahkan Python
  - H2: Panduan Plugin dan core

## gateway/security/shrinkwrap.md

- Rute: /gateway/security/shrinkwrap
- Judul:
  - H2: Versi mudah
  - H2: Mengapa OpenClaw menggunakannya
  - H2: Detail teknis

## gateway/tailscale.md

- Rute: /gateway/tailscale
- Judul:
  - H2: Mode
  - H2: Auth
  - H2: Contoh konfigurasi
  - H3: Khusus tailnet (Serve)
  - H3: Khusus tailnet (bind ke IP Tailnet)
  - H3: Internet publik (Funnel + kata sandi bersama)
  - H2: Contoh CLI
  - H2: Catatan
  - H2: Kontrol browser (Gateway remote + browser lokal)
  - H2: Prasyarat + batasan Tailscale
  - H2: Pelajari lebih lanjut
  - H2: Terkait

## gateway/tools-invoke-http-api.md

- Rute: /gateway/tools-invoke-http-api
- Judul:
  - H2: Autentikasi
  - H2: Batas keamanan (penting)
  - H2: Body permintaan
  - H2: Kebijakan + perilaku routing
  - H2: Respons
  - H2: Contoh
  - H2: Terkait

## gateway/troubleshooting.md

- Rute: /gateway/troubleshooting
- Judul:
  - H2: Tangga perintah
  - H2: Setelah pembaruan
  - H2: Instalasi split brain dan pelindung konfigurasi lebih baru
  - H2: Ketidakcocokan protokol setelah rollback
  - H2: Symlink Skill dilewati sebagai path escape
  - H2: Penggunaan tambahan Anthropic 429 diperlukan untuk konteks panjang
  - H2: Respons 403 upstream diblokir
  - H2: Backend lokal kompatibel OpenAI lolos probe langsung tetapi run agen gagal
  - H2: Tidak ada balasan
  - H2: Konektivitas UI kontrol dashboard
  - H3: Peta cepat kode detail auth
  - H2: Layanan Gateway tidak berjalan
  - H2: Gateway macOS berhenti merespons diam-diam, lalu pulih saat Anda menyentuh dashboard
  - H2: Gateway keluar saat penggunaan memori tinggi
  - H2: Gateway menolak konfigurasi tidak valid
  - H2: Peringatan probe Gateway
  - H2: Channel terhubung, pesan tidak mengalir
  - H2: Pengiriman Cron dan Heartbeat
  - H2: Node dipairing, alat gagal
  - H2: Alat browser gagal
  - H2: Jika Anda meningkatkan versi dan sesuatu tiba-tiba rusak
  - H2: Terkait

## gateway/trusted-proxy-auth.md

- Rute: /gateway/trusted-proxy-auth
- Judul:
  - H2: Kapan digunakan
  - H2: Kapan TIDAK digunakan
  - H2: Cara kerjanya
  - H2: Perilaku pairing UI kontrol
  - H2: Konfigurasi
  - H3: Referensi konfigurasi
  - H2: Terminasi TLS dan HSTS
  - H3: Panduan rollout
  - H2: Contoh setup proxy
  - H2: Konfigurasi token campuran
  - H2: Header cakupan operator
  - H2: Checklist keamanan
  - H2: Audit keamanan
  - H2: Pemecahan masalah
  - H2: Migrasi dari auth token
  - H2: Terkait

## help/debugging.md

- Rute: /help/debugging
- Judul:
  - H2: Override debug runtime
  - H2: Output trace sesi
  - H2: Trace siklus hidup Plugin
  - H2: Startup CLI dan profiling perintah
  - H2: Mode watch Gateway
  - H2: Profil dev + gateway dev (--dev)
  - H2: Logging stream mentah (OpenClaw)
  - H2: Logging chunk mentah kompatibel OpenAI
  - H2: Catatan keamanan
  - H2: Debugging di VSCode
  - H3: Setup
  - H3: Catatan
  - H2: Terkait

## help/environment.md

- Rute: /help/environment
- Judul:
  - H2: Prioritas (tertinggi → terendah)
  - H2: Kredensial penyedia dan .env workspace
  - H2: Blok env konfigurasi
  - H2: Impor env shell
  - H2: Snapshot shell exec
  - H2: Variabel env yang diinjeksi runtime
  - H2: Variabel env UI
  - H2: Substitusi variabel env dalam konfigurasi
  - H2: Ref secret vs string ${ENV}
  - H2: Variabel env terkait path
  - H2: Logging
  - H3: OPENCLAWHOME
  - H2: Pengguna nvm: kegagalan TLS webfetch
  - H2: Variabel lingkungan legacy
  - H2: Terkait

## help/faq-first-run.md

- Rute: /help/faq-first-run
- Judul:
  - H2: Quick start dan setup first-run
  - H2: Terkait

## help/faq-models.md

- Rute: /help/faq-models
- Judul:
  - H2: Model: default, pemilihan, alias, switching
  - H2: Failover model dan "Semua model gagal"
  - H2: Profil auth: apa itu dan cara mengelolanya
  - H2: Terkait

## help/faq.md

- Rute: /help/faq
- Judul:
  - H2: 60 detik pertama jika ada yang rusak
  - H2: Quick start dan setup first-run
  - H2: Apa itu OpenClaw?
  - H2: Skills dan otomatisasi
  - H2: Sandboxing dan memori
  - H2: Tempat hal-hal berada di disk
  - H2: Dasar-dasar konfigurasi
  - H2: Gateway dan node remote
  - H2: Variabel env dan pemuatan .env
  - H2: Sesi dan beberapa chat
  - H2: Model, failover, dan profil auth
  - H2: Gateway: port, "sudah berjalan", dan mode remote
  - H2: Logging dan debugging
  - H2: Media dan lampiran
  - H2: Keamanan dan kontrol akses
  - H2: Perintah chat, membatalkan tugas, dan "ini tidak akan berhenti"
  - H2: Lain-lain
  - H2: Terkait

## help/index.md

- Rute: /help
- Judul:
  - H2: FAQ
  - H2: Diagnostik
  - H2: Pengujian
  - H2: Komunitas dan meta

## help/scripts.md

- Rute: /help/scripts
- Judul:
  - H2: Konvensi
  - H2: Skrip pemantauan auth
  - H2: Helper baca GitHub
  - H2: Saat menambahkan skrip
  - H2: Terkait

## help/testing-live.md

- Rute: /help/testing-live
- Judul:
  - H2: Live: perintah smoke lokal
  - H2: Live: sweep kemampuan node Android
  - H2: Live: smoke model (kunci profil)
  - H3: Lapisan 1: Penyelesaian model langsung (tanpa gateway)
  - H3: Lapisan 2: Gateway + smoke agen dev (apa yang sebenarnya dilakukan "@openclaw")
  - H2: Live: smoke backend CLI (Claude, Gemini, atau CLI lokal lain)
  - H2: Live: keterjangkauan proxy HTTP/2 APNs
  - H2: Live: smoke bind ACP (/acp spawn ... --bind here)
  - H2: Live: smoke harness app-server Codex
  - H3: Resep live yang direkomendasikan
  - H2: Live: matriks model (apa yang kami cakup)
  - H3: Set smoke modern (pemanggilan tool + gambar)
  - H3: Baseline: pemanggilan tool (Read + Exec opsional)
  - H3: Visi: pengiriman gambar (lampiran → pesan multimodal)
  - H3: Agregator / gateway alternatif
  - H2: Kredensial (jangan pernah commit)
  - H2: Live Deepgram (transkripsi audio)
  - H2: Live rencana coding BytePlus
  - H2: Live media workflow ComfyUI
  - H2: Live pembuatan gambar
  - H2: Live pembuatan musik
  - H2: Live pembuatan video
  - H2: Harness live media
  - H2: Terkait

## help/testing-updates-plugins.md

- Rute: /help/testing-updates-plugins
- Judul:
  - H2: Apa yang kami lindungi
  - H2: Bukti lokal selama pengembangan
  - H2: Lane Docker
  - H2: Penerimaan Paket
  - H2: Default rilis
  - H2: Kompatibilitas lama
  - H2: Menambahkan cakupan
  - H2: Triage kegagalan

## help/testing.md

- Rute: /help/testing
- Judul:
  - H2: Mulai cepat
  - H2: Direktori Sementara Pengujian
  - H2: Runner khusus QA
  - H3: Kredensial Telegram bersama melalui Convex (v1)
  - H3: Menambahkan channel ke QA
  - H2: Suite pengujian (apa yang berjalan di mana)
  - H3: Unit / integrasi (default)
  - H3: Stabilitas (gateway)
  - H3: E2E (agregat repo)
  - H3: E2E (smoke gateway)
  - H3: E2E (browser mock Control UI)
  - H3: E2E: smoke backend OpenShell
  - H3: Live (penyedia nyata + model nyata)
  - H2: Suite mana yang harus saya jalankan?
  - H2: Pengujian live (menyentuh jaringan)
  - H2: Runner Docker (pemeriksaan opsional "berfungsi di Linux")
  - H2: Sanity docs
  - H2: Regresi offline (aman untuk CI)
  - H2: Evaluasi keandalan agen (skills)
  - H2: Pengujian kontrak (bentuk plugin dan channel)
  - H3: Perintah
  - H3: Kontrak channel
  - H3: Kontrak status penyedia
  - H3: Kontrak penyedia
  - H3: Kapan menjalankan
  - H2: Menambahkan regresi (panduan)
  - H2: Terkait

## help/troubleshooting.md

- Rute: /help/troubleshooting
- Judul:
  - H2: 60 detik pertama
  - H2: Asisten terasa terbatas atau kehilangan tool
  - H2: Konteks panjang Anthropic 429
  - H2: Backend lokal yang kompatibel dengan OpenAI berfungsi langsung tetapi gagal di OpenClaw
  - H2: Instalasi plugin gagal karena ekstensi openclaw tidak ditemukan
  - H2: Kebijakan instalasi memblokir instalasi atau pembaruan plugin
  - H2: Plugin ada tetapi diblokir karena kepemilikan mencurigakan
  - H2: Pohon keputusan
  - H2: Terkait

## index.md

- Rute: /
- Judul:
  - H1: OpenClaw 🦞
  - H2: Apa itu OpenClaw?
  - H2: Cara kerjanya
  - H2: Kemampuan utama
  - H2: Mulai cepat
  - H2: Dasbor
  - H2: Konfigurasi (opsional)
  - H2: Mulai dari sini
  - H2: Pelajari lebih lanjut

## install/ansible.md

- Rute: /install/ansible
- Judul:
  - H2: Prasyarat
  - H2: Apa yang Anda dapatkan
  - H2: Mulai cepat
  - H2: Apa yang diinstal
  - H2: Penyiapan Pasca-Instalasi
  - H3: Perintah cepat
  - H2: Arsitektur keamanan
  - H2: Instalasi manual
  - H2: Memperbarui
  - H2: Pemecahan masalah
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## install/azure.md

- Rute: /install/azure
- Judul:
  - H2: Apa yang akan Anda lakukan
  - H2: Apa yang Anda perlukan
  - H2: Konfigurasikan deployment
  - H2: Deploy sumber daya Azure
  - H2: Instal OpenClaw
  - H2: Pertimbangan biaya
  - H2: Pembersihan
  - H2: Langkah berikutnya
  - H2: Terkait

## install/bun.md

- Rute: /install/bun
- Judul:
  - H2: Instal
  - H2: Skrip lifecycle
  - H2: Catatan kehati-hatian
  - H2: Terkait

## install/clawdock.md

- Rute: /install/clawdock
- Judul:
  - H2: Instal
  - H2: Apa yang Anda dapatkan
  - H3: Operasi dasar
  - H3: Akses kontainer
  - H3: Web UI dan pairing
  - H3: Penyiapan dan pemeliharaan
  - H3: Utilitas
  - H2: Alur pertama kali
  - H2: Konfigurasi dan rahasia
  - H2: Terkait

## install/development-channels.md

- Rute: /install/development-channels
- Judul:
  - H2: Beralih channel
  - H2: Menargetkan versi atau tag sekali pakai
  - H2: Dry run
  - H2: Plugin dan channel
  - H2: Memeriksa status saat ini
  - H2: Praktik terbaik pemberian tag
  - H2: Ketersediaan aplikasi macOS
  - H2: Terkait

## install/digitalocean.md

- Rute: /install/digitalocean
- Judul:
  - H2: Prasyarat
  - H2: Penyiapan
  - H2: Persistensi dan cadangan
  - H2: Tips RAM 1 GB
  - H2: Pemecahan masalah
  - H2: Langkah berikutnya
  - H2: Terkait

## install/docker-vm-runtime.md

- Rute: /install/docker-vm-runtime
- Judul:
  - H2: Masukkan binary yang diperlukan ke image
  - H2: Build dan luncurkan
  - H2: Apa yang persisten di mana
  - H2: Pembaruan
  - H2: Terkait

## install/docker.md

- Rute: /install/docker
- Judul:
  - H2: Apakah Docker tepat untuk saya?
  - H2: Prasyarat
  - H2: Gateway dalam kontainer
  - H3: Alur manual
  - H3: Variabel lingkungan
  - H3: Observabilitas
  - H3: Pemeriksaan kesehatan
  - H3: LAN vs loopback
  - H3: Penyedia Lokal Host
  - H3: Backend Claude CLI di Docker
  - H3: Bonjour / mDNS
  - H3: Penyimpanan dan persistensi
  - H3: Helper shell (opsional)
  - H3: Berjalan di VPS?
  - H2: Sandbox agen
  - H3: Aktifkan cepat
  - H2: Pemecahan masalah
  - H2: Terkait

## install/exe-dev.md

- Rute: /install/exe-dev
- Judul:
  - H2: Jalur cepat pemula
  - H2: Apa yang Anda perlukan
  - H2: Instalasi otomatis dengan Shelley
  - H2: Instalasi manual
  - H2: 1) Buat VM
  - H2: 2) Instal prasyarat (di VM)
  - H2: 3) Instal OpenClaw
  - H2: 4) Siapkan nginx untuk mem-proxy OpenClaw ke port 8000
  - H2: 5) Akses OpenClaw dan berikan hak istimewa
  - H2: Penyiapan channel jarak jauh
  - H2: Akses jarak jauh
  - H2: Memperbarui
  - H2: Terkait

## install/fly.md

- Rute: /install/fly
- Judul:
  - H2: Apa yang Anda perlukan
  - H2: Jalur cepat pemula
  - H2: Pemecahan masalah
  - H3: "Aplikasi tidak mendengarkan pada alamat yang diharapkan"
  - H3: Pemeriksaan kesehatan gagal / koneksi ditolak
  - H3: OOM / Masalah Memori
  - H3: Masalah kunci Gateway
  - H3: Konfigurasi tidak dibaca
  - H3: Menulis konfigurasi melalui SSH
  - H3: State tidak persisten
  - H2: Pembaruan
  - H3: Perintah memperbarui mesin
  - H2: Deployment privat (diperkeras)
  - H3: Kapan menggunakan deployment privat
  - H3: Penyiapan
  - H3: Mengakses deployment privat
  - H3: Webhook dengan deployment privat
  - H3: Manfaat keamanan
  - H2: Catatan
  - H2: Biaya
  - H2: Langkah berikutnya
  - H2: Terkait

## install/gcp.md

- Rute: /install/gcp
- Judul:
  - H2: Apa yang kita lakukan (istilah sederhana)?
  - H2: Jalur cepat (operator berpengalaman)
  - H2: Apa yang Anda perlukan
  - H2: Pemecahan masalah
  - H2: Akun layanan (praktik terbaik keamanan)
  - H2: Langkah berikutnya
  - H2: Terkait

## install/hetzner.md

- Rute: /install/hetzner
- Judul:
  - H2: Tujuan
  - H2: Apa yang kita lakukan (istilah sederhana)?
  - H2: Jalur cepat (operator berpengalaman)
  - H2: Apa yang Anda perlukan
  - H2: Infrastructure as Code (Terraform)
  - H2: Langkah berikutnya
  - H2: Terkait

## install/hostinger.md

- Rute: /install/hostinger
- Judul:
  - H2: Prasyarat
  - H2: Opsi A: OpenClaw 1-Klik
  - H2: Opsi B: OpenClaw di VPS
  - H2: Verifikasi penyiapan Anda
  - H2: Pemecahan masalah
  - H2: Langkah berikutnya
  - H2: Terkait

## install/index.md

- Rute: /install
- Judul:
  - H2: Persyaratan sistem
  - H2: Direkomendasikan: skrip installer
  - H2: Metode instalasi alternatif
  - H3: Installer prefiks lokal (install-cli.sh)
  - H3: npm, pnpm, atau bun
  - H3: Dari sumber
  - H3: Instal dari checkout main GitHub
  - H3: Kontainer dan manajer paket
  - H2: Verifikasi instalasi
  - H2: Hosting dan deployment
  - H2: Perbarui, migrasikan, atau hapus instalasi
  - H2: Pemecahan masalah: openclaw tidak ditemukan

## install/installer.md

- Rute: /install/installer
- Judul:
  - H2: Perintah cepat
  - H2: install.sh
  - H3: Alur (install.sh)
  - H3: Deteksi checkout sumber
  - H3: Contoh (install.sh)
  - H2: install-cli.sh
  - H3: Alur (install-cli.sh)
  - H3: Contoh (install-cli.sh)
  - H2: install.ps1
  - H3: Alur (install.ps1)
  - H3: Contoh (install.ps1)
  - H2: CI dan otomatisasi
  - H2: Pemecahan masalah
  - H2: Terkait

## install/kubernetes.md

- Rute: /install/kubernetes
- Judul:
  - H2: Mengapa bukan Helm?
  - H2: Apa yang Anda perlukan
  - H2: Mulai cepat
  - H2: Pengujian lokal dengan Kind
  - H2: Langkah demi langkah
  - H3: 1) Deploy
  - H3: 2) Akses Gateway
  - H2: Apa yang di-deploy
  - H2: Kustomisasi
  - H3: Instruksi agen
  - H3: Konfigurasi Gateway
  - H3: Tambahkan penyedia
  - H3: Namespace kustom
  - H3: Image kustom
  - H3: Paparkan melampaui port-forward
  - H2: Deploy ulang
  - H2: Bongkar
  - H2: Catatan arsitektur
  - H2: Struktur file
  - H2: Terkait

## install/macos-vm.md

- Rute: /install/macos-vm
- Judul:
  - H2: Default yang direkomendasikan (sebagian besar pengguna)
  - H2: Opsi VM macOS
  - H3: VM lokal di Apple Silicon Mac Anda (Lume)
  - H3: Penyedia Mac hosted (cloud)
  - H2: Jalur cepat (Lume, pengguna berpengalaman)
  - H2: Apa yang Anda perlukan (Lume)
  - H2: 1) Instal Lume
  - H2: 2) Buat VM macOS
  - H2: 3) Selesaikan Setup Assistant
  - H2: 4) Dapatkan alamat IP VM
  - H2: 5) SSH ke VM
  - H2: 6) Instal OpenClaw
  - H2: 7) Konfigurasikan channel
  - H2: 8) Jalankan VM tanpa head
  - H2: Bonus: integrasi iMessage
  - H2: Simpan golden image
  - H2: Berjalan 24/7
  - H2: Pemecahan masalah
  - H2: Docs terkait

## install/migrating-claude.md

- Rute: /install/migrating-claude
- Judul:
  - H2: Dua cara mengimpor
  - H2: Apa yang diimpor
  - H2: Apa yang tetap hanya arsip
  - H2: Pemilihan sumber
  - H2: Alur yang direkomendasikan
  - H2: Penanganan konflik
  - H2: Output JSON untuk otomatisasi
  - H2: Pemecahan masalah
  - H2: Terkait

## install/migrating-hermes.md

- Rute: /install/migrating-hermes
- Judul:
  - H2: Dua cara mengimpor
  - H2: Apa yang diimpor
  - H2: Apa yang tetap hanya arsip
  - H2: Alur yang direkomendasikan
  - H2: Penanganan konflik
  - H2: Rahasia
  - H2: Output JSON untuk otomatisasi
  - H2: Pemecahan masalah
  - H2: Terkait

## install/migrating.md

- Rute: /install/migrating
- Judul:
  - H2: Impor dari sistem agen lain
  - H2: Pindahkan OpenClaw ke mesin baru
  - H3: Langkah migrasi
  - H3: Kendala umum
  - H3: Daftar periksa verifikasi
  - H2: Tingkatkan plugin di tempat
  - H2: Terkait

## install/nix.md

- Rute: /install/nix
- Judul:
  - H2: Apa yang Anda dapatkan
  - H2: Mulai cepat
  - H2: Perilaku runtime mode Nix
  - H3: Apa yang berubah dalam mode Nix
  - H3: Jalur konfigurasi dan state
  - H3: Penemuan PATH layanan
  - H2: Terkait

## install/node.md

- Rute: /install/node
- Judul:
  - H2: Periksa versi Anda
  - H2: Instal Node
  - H2: Pemecahan masalah
  - H3: openclaw: perintah tidak ditemukan
  - H3: Galat izin pada npm install -g (Linux)
  - H2: Terkait

## install/northflank.mdx

- Rute: /install/northflank
- Judul:
  - H1: Northflank
  - H2: Cara memulai
  - H2: Apa yang Anda dapatkan
  - H2: Hubungkan channel
  - H2: Langkah berikutnya

## install/oracle.md

- Rute: /install/oracle
- Judul:
  - H2: Prasyarat
  - H2: Penyiapan
  - H2: Verifikasi postur keamanan
  - H2: Catatan ARM
  - H2: Persistensi dan cadangan
  - H2: Fallback: tunnel SSH
  - H2: Pemecahan masalah
  - H2: Langkah berikutnya
  - H2: Terkait

## install/podman.md

- Rute: /install/podman
- Judul:
  - H2: Prasyarat
  - H2: Mulai cepat
  - H2: Podman dan Tailscale
  - H2: Systemd (Quadlet, opsional)
  - H2: Konfigurasi, env, dan penyimpanan
  - H2: Perintah berguna
  - H2: Pemecahan masalah
  - H2: Terkait

## install/railway.mdx

- Rute: /install/railway
- Judul:
  - H1: Railway
  - H2: Daftar periksa cepat (pengguna baru)
  - H2: Deploy sekali klik
  - H2: Apa yang Anda dapatkan
  - H2: Pengaturan Railway yang diperlukan
  - H3: Jaringan Publik
  - H3: Volume (wajib)
  - H3: Variabel
  - H2: Hubungkan channel
  - H2: Cadangan & migrasi
  - H2: Langkah berikutnya

## install/raspberry-pi.md

- Rute: /install/raspberry-pi
- Judul:
  - H2: Kompatibilitas perangkat keras
  - H2: Prasyarat
  - H2: Penyiapan
  - H2: Tips performa
  - H2: Penyiapan model yang direkomendasikan
  - H2: Catatan biner ARM
  - H2: Persistensi dan cadangan
  - H2: Pemecahan masalah
  - H2: Langkah berikutnya
  - H2: Terkait

## install/render.mdx

- Rute: /install/render
- Judul:
  - H1: Render
  - H2: Prasyarat
  - H2: Deploy dengan Render Blueprint
  - H2: Memahami Blueprint
  - H2: Memilih paket
  - H2: Setelah deployment
  - H3: Akses Control UI
  - H2: Fitur Render Dashboard
  - H3: Log
  - H3: Akses shell
  - H3: Variabel lingkungan
  - H3: Auto-deploy
  - H2: Domain kustom
  - H2: Scaling
  - H2: Cadangan dan migrasi
  - H2: Pemecahan masalah
  - H3: Layanan tidak dapat dimulai
  - H3: Cold start lambat (tingkat gratis)
  - H3: Kehilangan data setelah redeploy
  - H3: Kegagalan pemeriksaan kesehatan
  - H2: Langkah berikutnya

## install/uninstall.md

- Rute: /install/uninstall
- Judul:
  - H2: Jalur mudah (CLI masih terinstal)
  - H2: Penghapusan layanan manual (CLI tidak terinstal)
  - H3: macOS (launchd)
  - H3: Linux (unit pengguna systemd)
  - H3: Windows (Scheduled Task)
  - H2: Instalasi normal vs checkout sumber
  - H3: Instalasi normal (install.sh / npm / pnpm / bun)
  - H3: Checkout sumber (git clone)
  - H2: Terkait

## install/updating.md

- Rute: /install/updating
- Judul:
  - H2: Direkomendasikan: openclaw update
  - H2: Beralih antara instalasi npm dan git
  - H2: Alternatif: jalankan ulang installer
  - H2: Alternatif: npm, pnpm, atau bun manual
  - H3: Topik instalasi npm lanjutan
  - H2: Auto-updater
  - H2: Setelah memperbarui
  - H3: Jalankan doctor
  - H3: Mulai ulang gateway
  - H3: Verifikasi
  - H2: Rollback
  - H3: Pin versi (npm)
  - H3: Pin commit (sumber)
  - H2: Jika Anda buntu
  - H2: Terkait

## install/upstash.md

- Rute: /install/upstash
- Judul:
  - H2: Prasyarat
  - H2: Buat Box
  - H2: Hubungkan dengan tunnel SSH
  - H2: Instal OpenClaw
  - H2: Jalankan onboarding
  - H2: Mulai Gateway
  - H2: Mulai ulang otomatis
  - H2: Pemecahan masalah
  - H2: Terkait

## logging.md

- Rute: /logging
- Judul:
  - H2: Tempat log berada
  - H2: Cara membaca log
  - H3: CLI: live tail (direkomendasikan)
  - H3: Control UI (web)
  - H3: Log khusus channel
  - H2: Format log
  - H3: Log file (JSONL)
  - H3: Output konsol
  - H3: Log WebSocket Gateway
  - H2: Mengonfigurasi logging
  - H3: Level log
  - H3: Diagnostik transport model bertarget
  - H3: Korelasi trace
  - H3: Ukuran dan timing panggilan model
  - H3: Gaya konsol
  - H3: Redaksi
  - H2: Diagnostik dan OpenTelemetry
  - H2: Tips pemecahan masalah
  - H2: Terkait

## maturity/scorecard.md

- Rute: /maturity/scorecard
- Judul:
  - H1: Kartu skor kematangan
  - H2: Untuk apa halaman ini
  - H2: Sekilas
  - H2: Rentang skor
  - H2: Penjelajah surface
  - H2: Ringkasan bukti QA
  - H3: Kesiapan berdasarkan area

## maturity/taxonomy.md

- Rute: /maturity/taxonomy
- Judul:
  - H1: Taksonomi kematangan
  - H2: Cara membaca halaman ini
  - H2: Tingkat kematangan
  - H2: Area produk
  - H2: Detail
  - H3: Core
  - H3: Platform
  - H3: Channel
  - H3: Provider dan tool

## network.md

- Rute: /network
- Judul:
  - H2: Model inti
  - H2: Pairing + identitas
  - H2: Discovery + transport
  - H2: Node + transport
  - H2: Keamanan
  - H2: Terkait

## nodes/audio.md

- Rute: /nodes/audio
- Judul:
  - H2: Yang berfungsi
  - H2: Deteksi otomatis (default)
  - H2: Contoh config
  - H3: Fallback Provider + CLI (OpenAI + Whisper CLI)
  - H3: Hanya Provider dengan scope gating
  - H3: Hanya Provider (Deepgram)
  - H3: Hanya Provider (Mistral Voxtral)
  - H3: Hanya Provider (SenseAudio)
  - H3: Echo transkrip ke chat (opt-in)
  - H2: Catatan dan batasan
  - H3: Dukungan lingkungan proxy
  - H2: Deteksi mention di grup
  - H2: Hal yang perlu diperhatikan
  - H2: Terkait

## nodes/camera.md

- Rute: /nodes/camera
- Judul:
  - H2: Node iOS
  - H3: Pengaturan pengguna (default aktif)
  - H3: Perintah (via Gateway node.invoke)
  - H3: Persyaratan foreground
  - H3: Helper CLI
  - H2: Node Android
  - H3: Pengaturan pengguna Android (default aktif)
  - H3: Izin
  - H3: Persyaratan foreground Android
  - H3: Perintah Android (via Gateway node.invoke)
  - H3: Guard payload
  - H2: Aplikasi macOS
  - H3: Pengaturan pengguna (default nonaktif)
  - H3: Helper CLI (node invoke)
  - H2: Keamanan + batasan praktis
  - H2: Video layar macOS (level OS)
  - H2: Terkait

## nodes/images.md

- Rute: /nodes/images
- Judul:
  - H2: Tujuan
  - H2: Surface CLI
  - H2: Perilaku channel WhatsApp Web
  - H2: Pipeline Balasan Otomatis
  - H2: Media Masuk Ke Perintah
  - H2: Batasan dan kesalahan
  - H2: Catatan untuk Pengujian
  - H2: Terkait

## nodes/index.md

- Rute: /nodes
- Judul:
  - H2: Pairing + status
  - H2: Host node jarak jauh (system.run)
  - H3: Apa yang berjalan di mana
  - H3: Mulai host node (foreground)
  - H3: Gateway jarak jauh melalui tunnel SSH (bind loopback)
  - H3: Mulai host node (layanan)
  - H3: Pair + nama
  - H3: Allowlist perintah
  - H3: Arahkan exec ke node
  - H2: Memanggil perintah
  - H2: Kebijakan perintah
  - H2: Config (openclaw.json)
  - H2: Screenshot (snapshot canvas)
  - H3: Kontrol canvas
  - H3: A2UI (Canvas)
  - H2: Foto + video (kamera node)
  - H2: Perekaman layar (node)
  - H2: Lokasi (node)
  - H2: SMS (node Android)
  - H2: Perintah perangkat Android + data pribadi
  - H2: Perintah sistem (host node / node Mac)
  - H2: Binding node exec
  - H2: Peta izin
  - H2: Host node headless (lintas platform)
  - H2: Mode node Mac

## nodes/location-command.md

- Rute: /nodes/location-command
- Judul:
  - H2: TL;DR
  - H2: Mengapa selector (bukan hanya switch)
  - H2: Model pengaturan
  - H2: Pemetaan izin (node.permissions)
  - H2: Perintah: location.get
  - H2: Perilaku latar belakang
  - H2: Integrasi model/tooling
  - H2: Teks UX (disarankan)
  - H2: Terkait

## nodes/media-understanding.md

- Rute: /nodes/media-understanding
- Judul:
  - H2: Tujuan
  - H2: Perilaku tingkat tinggi
  - H2: Ikhtisar config
  - H3: Entri model
  - H3: Kredensial Provider (apiKey)
  - H2: Default dan batasan
  - H3: Deteksi otomatis media understanding (default)
  - H3: Dukungan lingkungan proxy (model Provider)
  - H2: Kapabilitas (opsional)
  - H2: Matriks dukungan Provider (integrasi OpenClaw)
  - H2: Panduan pemilihan model
  - H2: Kebijakan lampiran
  - H2: Contoh config
  - H2: Output status
  - H2: Catatan
  - H2: Terkait

## nodes/talk.md

- Rute: /nodes/talk
- Judul:
  - H2: Perilaku (macOS)
  - H2: Direktif suara dalam balasan
  - H2: Config (/.openclaw/openclaw.json)
  - H2: UI macOS
  - H2: UI Android
  - H2: Catatan
  - H2: Terkait

## nodes/troubleshooting.md

- Rute: /nodes/troubleshooting
- Judul:
  - H2: Tangga perintah
  - H2: Persyaratan foreground
  - H2: Matriks izin
  - H2: Pairing versus persetujuan
  - H2: Kode kesalahan node umum
  - H2: Loop pemulihan cepat
  - H2: Terkait

## nodes/voicewake.md

- Rute: /nodes/voicewake
- Judul:
  - H2: Penyimpanan (host Gateway)
  - H2: Protokol
  - H3: Metode
  - H3: Metode routing (pemicu → target)
  - H3: Peristiwa
  - H2: Perilaku klien
  - H3: Aplikasi macOS
  - H3: Node iOS
  - H3: Node Android
  - H2: Terkait

## openclaw-agent-runtime.md

- Rute: /openclaw-agent-runtime
- Judul:
  - H2: Pemeriksaan tipe dan linting
  - H2: Menjalankan Pengujian Agent Runtime
  - H2: Pengujian manual
  - H2: Reset clean slate
  - H2: Referensi
  - H2: Terkait

## perplexity.md

- Rute: /perplexity
- Judul:
  - H2: Terkait

## plan/codex-context-engine-harness.md

- Rute: /plan/codex-context-engine-harness
- Judul:
  - H2: Status
  - H2: Tujuan
  - H2: Non-tujuan
  - H2: Arsitektur saat ini
  - H2: Celah saat ini
  - H2: Perilaku yang diinginkan
  - H2: Batasan desain
  - H3: App-server Codex tetap kanonis untuk status thread native
  - H3: Rakitan context engine harus diproyeksikan ke input Codex
  - H3: Stabilitas prompt-cache penting
  - H3: Semantik pemilihan runtime tidak berubah
  - H2: Rencana implementasi
  - H3: 1. Ekspor atau pindahkan helper attempt context-engine yang dapat digunakan ulang
  - H3: 2. Tambahkan helper proyeksi context Codex
  - H3: 3. Wire bootstrap sebelum startup thread Codex
  - H3: 4. Wire assemble sebelum thread/start / thread/resume dan turn/start
  - H3: 5. Pertahankan pemformatan stabil prompt-cache
  - H3: 6. Wire post-turn setelah mirroring transkrip
  - H3: 7. Normalisasi usage dan context runtime prompt-cache
  - H3: 8. Kebijakan Compaction
  - H4: /compact dan Compaction OpenClaw eksplisit
  - H4: Peristiwa contextCompaction native Codex dalam turn
  - H3: 9. Reset sesi dan perilaku binding
  - H3: 10. Penanganan kesalahan
  - H2: Rencana pengujian
  - H3: Pengujian unit
  - H3: Pengujian yang ada untuk diperbarui
  - H3: Pengujian integrasi / live
  - H2: Observabilitas
  - H2: Migrasi / kompatibilitas
  - H2: Pertanyaan terbuka
  - H2: Kriteria penerimaan

## plan/ui-channels.md

- Rute: /plan/ui-channels
- Judul:
  - H2: Status
  - H2: Masalah
  - H2: Tujuan
  - H2: Non-tujuan
  - H2: Model target
  - H2: Metadata pengiriman
  - H2: Kontrak kapabilitas runtime
  - H2: Pemetaan channel
  - H2: Langkah refaktor
  - H2: Pengujian
  - H2: Pertanyaan terbuka
  - H2: Terkait

## platforms/android.md

- Rute: /platforms/android
- Judul:
  - H2: Snapshot dukungan
  - H2: Kontrol sistem
  - H2: Runbook koneksi
  - H3: Prasyarat
  - H3: 1) Mulai Gateway
  - H3: 2) Verifikasi discovery (opsional)
  - H4: Discovery tailnet (Vienna ⇄ London) melalui DNS-SD unicast
  - H3: 3) Hubungkan dari Android
  - H3: Beacon presence alive
  - H3: 4) Setujui pairing (CLI)
  - H3: 5) Verifikasi node terhubung
  - H3: 6) Chat + riwayat
  - H3: 7) Canvas + kamera
  - H4: Gateway Canvas Host (direkomendasikan untuk konten web)
  - H3: 8) Voice + surface perintah Android yang diperluas
  - H2: Titik masuk asisten
  - H2: Penerusan notifikasi
  - H2: Terkait

## platforms/digitalocean.md

- Rute: /platforms/digitalocean
- Judul:
  - H2: Terkait

## platforms/easyrunner.md

- Rute: /platforms/easyrunner
- Judul:
  - H2: Sebelum memulai
  - H2: Aplikasi Compose
  - H2: Konfigurasikan OpenClaw
  - H2: Verifikasi
  - H2: Pembaruan dan cadangan
  - H2: Pemecahan masalah

## platforms/index.md

- Rute: /platforms
- Judul:
  - H2: Pilih OS Anda
  - H2: VPS dan hosting
  - H2: Tautan umum
  - H2: Instalasi layanan Gateway (CLI)
  - H2: Terkait

## platforms/ios.md

- Rute: /platforms/ios
- Judul:
  - H2: Apa yang dilakukannya
  - H2: Persyaratan
  - H2: Mulai cepat (pair + hubungkan)
  - H2: Push berbasis relay untuk build resmi
  - H2: Beacon alive latar belakang
  - H2: Alur autentikasi dan kepercayaan
  - H2: Jalur discovery
  - H3: Bonjour (LAN)
  - H3: Tailnet (lintas jaringan)
  - H3: Host/port manual
  - H2: Canvas + A2UI
  - H2: Hubungan Computer Use
  - H3: Eval / snapshot Canvas
  - H2: Voice wake + mode talk
  - H2: Kesalahan umum
  - H2: Dokumen terkait

## platforms/linux.md

- Rute: /platforms/linux
- Judul:
  - H2: Jalur cepat pemula (VPS)
  - H2: Instal
  - H2: Gateway
  - H2: Instalasi layanan Gateway (CLI)
  - H2: Kontrol sistem (unit pengguna systemd)
  - H2: Tekanan memori dan kill OOM
  - H2: Terkait

## platforms/mac/bundled-gateway.md

- Rute: /platforms/mac/bundled-gateway
- Judul:
  - H2: Instal CLI (diperlukan untuk mode lokal)
  - H2: Launchd (Gateway sebagai LaunchAgent)
  - H2: Kompatibilitas versi
  - H2: Direktori status di macOS
  - H2: Debug konektivitas aplikasi
  - H2: Pemeriksaan smoke
  - H2: Terkait

## platforms/mac/canvas.md

- Rute: /platforms/mac/canvas
- Judul:
  - H2: Tempat Canvas berada
  - H2: Perilaku panel
  - H2: Surface API agen
  - H2: A2UI di Canvas
  - H3: Perintah A2UI (v0.8)
  - H2: Memicu agent run dari Canvas
  - H2: Catatan keamanan
  - H2: Terkait

## platforms/mac/child-process.md

- Rute: /platforms/mac/child-process
- Judul:
  - H2: Perilaku default (launchd)
  - H2: Build dev tanpa tanda tangan
  - H2: Mode hanya attach
  - H2: Mode jarak jauh
  - H2: Mengapa kami lebih memilih launchd
  - H2: Terkait

## platforms/mac/dev-setup.md

- Rute: /platforms/mac/dev-setup
- Judul:
  - H1: Penyiapan pengembang macOS
  - H2: Prasyarat
  - H2: 1. Instal Dependensi
  - H2: 2. Bangun dan Paketkan Aplikasi
  - H2: 3. Instal CLI
  - H2: Pemecahan masalah
  - H3: Build gagal: toolchain atau SDK tidak cocok
  - H3: Aplikasi crash saat pemberian izin
  - H3: Gateway "Starting..." tanpa batas waktu
  - H2: Terkait

## platforms/mac/health.md

- Rute: /platforms/mac/health
- Judul:
  - H1: Pemeriksaan Kesehatan di macOS
  - H2: Bilah menu
  - H2: Pengaturan
  - H2: Cara kerja probe
  - H2: Saat ragu
  - H2: Terkait

## platforms/mac/icon.md

- Rute: /platforms/mac/icon
- Judul:
  - H1: Status Ikon Bilah Menu
  - H2: Terkait

## platforms/mac/logging.md

- Rute: /platforms/mac/logging
- Judul:
  - H1: Logging (macOS)
  - H2: Log file diagnostik bergilir (panel Debug)
  - H2: Data pribadi unified logging di macOS
  - H2: Aktifkan untuk OpenClaw (ai.openclaw)
  - H2: Nonaktifkan setelah debugging
  - H2: Terkait

## platforms/mac/menu-bar.md

- Rute: /platforms/mac/menu-bar
- Judul:
  - H2: Yang ditampilkan
  - H2: Model status
  - H2: Enum IconState (Swift)
  - H3: ActivityKind → glif
  - H3: Pemetaan visual
  - H2: Submenu konteks
  - H2: Teks baris status (menu)
  - H2: Penyerapan peristiwa
  - H2: Override debug
  - H2: Daftar periksa pengujian
  - H2: Terkait

## platforms/mac/peekaboo.md

- Rute: /platforms/mac/peekaboo
- Judul:
  - H2: Apa ini (dan bukan)
  - H2: Hubungan dengan Computer Use
  - H2: Aktifkan bridge
  - H2: Urutan penemuan klien
  - H2: Keamanan dan izin
  - H2: Perilaku snapshot (otomasi)
  - H2: Pemecahan masalah
  - H2: Terkait

## platforms/mac/permissions.md

- Rute: /platforms/mac/permissions
- Judul:
  - H2: Persyaratan untuk izin yang stabil
  - H2: Pemberian Accessibility untuk runtime Node dan CLI
  - H2: Daftar periksa pemulihan saat prompt menghilang
  - H2: Izin file dan folder (Desktop/Documents/Downloads)
  - H2: Terkait

## platforms/mac/remote.md

- Rute: /platforms/mac/remote
- Judul:
  - H2: Mode
  - H2: Transport jarak jauh
  - H2: Prasyarat pada host jarak jauh
  - H2: Penyiapan aplikasi macOS
  - H2: Web Chat
  - H2: Izin
  - H2: Catatan keamanan
  - H2: Alur login WhatsApp (jarak jauh)
  - H2: Pemecahan masalah
  - H2: Suara notifikasi
  - H2: Terkait

## platforms/mac/signing.md

- Rute: /platforms/mac/signing
- Judul:
  - H1: penandatanganan mac (build debug)
  - H2: Penggunaan
  - H3: Catatan Penandatanganan Ad-hoc
  - H2: Metadata build untuk About
  - H2: Mengapa
  - H2: Terkait

## platforms/mac/skills.md

- Rute: /platforms/mac/skills
- Judul:
  - H2: Sumber data
  - H2: Tindakan instal
  - H2: Kunci env/API
  - H2: Mode jarak jauh
  - H2: Terkait

## platforms/mac/voice-overlay.md

- Rute: /platforms/mac/voice-overlay
- Judul:
  - H1: Siklus Hidup Voice Overlay (macOS)
  - H2: Tujuan saat ini
  - H2: Diimplementasikan (9 Des 2025)
  - H2: Langkah berikutnya
  - H2: Daftar periksa debugging
  - H2: Langkah migrasi (disarankan)
  - H2: Terkait

## platforms/mac/voicewake.md

- Rute: /platforms/mac/voicewake
- Judul:
  - H1: Voice Wake & Push-to-Talk
  - H2: Persyaratan
  - H2: Mode
  - H2: Perilaku runtime (wake-word)
  - H2: Invarian siklus hidup
  - H2: Mode kegagalan overlay sticky (sebelumnya)
  - H2: Detail khusus push-to-talk
  - H2: Pengaturan yang terlihat pengguna
  - H2: Perilaku penerusan
  - H2: Payload penerusan
  - H2: Verifikasi cepat
  - H2: Terkait

## platforms/mac/webchat.md

- Rute: /platforms/mac/webchat
- Judul:
  - H2: Peluncuran dan debugging
  - H2: Cara penghubungannya
  - H2: Permukaan keamanan
  - H2: Keterbatasan yang diketahui
  - H2: Terkait

## platforms/mac/xpc.md

- Rute: /platforms/mac/xpc
- Judul:
  - H1: Arsitektur IPC OpenClaw macOS
  - H2: Tujuan
  - H2: Cara kerjanya
  - H3: Gateway + transport node
  - H3: Layanan Node + IPC aplikasi
  - H3: PeekabooBridge (otomasi UI)
  - H2: Alur operasional
  - H2: Catatan hardening
  - H2: Terkait

## platforms/macos.md

- Rute: /platforms/macos
- Judul:
  - H2: Unduh
  - H2: Jalankan pertama
  - H2: Pilih mode Gateway
  - H2: Yang dimiliki aplikasi
  - H2: Halaman detail macOS
  - H2: Terkait

## platforms/oracle.md

- Rute: /platforms/oracle
- Judul:
  - H2: Terkait

## platforms/raspberry-pi.md

- Rute: /platforms/raspberry-pi
- Judul:
  - H2: Terkait

## platforms/windows.md

- Rute: /platforms/windows
- Judul:
  - H2: Direkomendasikan: Windows Hub
  - H3: Yang disertakan Windows Hub
  - H3: Peluncuran pertama
  - H2: Mode node Windows
  - H2: Mode MCP lokal
  - H2: CLI dan Gateway Windows native
  - H2: Gateway WSL2
  - H2: Mulai otomatis Gateway sebelum login Windows
  - H2: Ekspos layanan WSL melalui LAN
  - H2: Pemecahan masalah
  - H3: Ikon tray tidak muncul
  - H3: Penyiapan lokal gagal
  - H3: Aplikasi mengatakan pairing diperlukan
  - H3: Web chat tidak dapat menjangkau Gateway jarak jauh
  - H3: Perintah screen.snapshot, camera, atau audio gagal
  - H3: Konektivitas Git atau GitHub gagal
  - H2: Terkait

## plugins/adding-capabilities.md

- Rute: /plugins/adding-capabilities
- Judul:
  - H2: Kapan membuat capability
  - H2: Urutan standar
  - H2: Apa diletakkan di mana
  - H2: Seam provider dan harness
  - H2: Daftar periksa file
  - H2: Contoh kerja: pembuatan gambar
  - H2: Provider embedding
  - H2: Daftar periksa review
  - H2: Terkait

## plugins/admin-http-rpc.md

- Rute: /plugins/admin-http-rpc
- Judul:
  - H2: Sebelum Anda mengaktifkannya
  - H2: Aktifkan
  - H2: Verifikasi rute
  - H2: Autentikasi
  - H2: Model keamanan
  - H2: Request
  - H2: Response
  - H2: Metode yang diizinkan
  - H2: Perbandingan WebSocket
  - H2: Pemecahan masalah
  - H2: Terkait

## plugins/agent-tools.md

- Rute: /plugins/agent-tools
- Judul:
  - H2: Terkait

## plugins/architecture-internals.md

- Rute: /plugins/architecture-internals
- Judul:
  - H2: Pipeline pemuatan
  - H3: Perilaku manifest-first
  - H3: Batas cache Plugin
  - H2: Model registry
  - H2: Callback pengikatan percakapan
  - H2: Hook runtime provider
  - H3: Urutan dan penggunaan hook
  - H3: Contoh provider
  - H3: Contoh bawaan
  - H2: Helper runtime
  - H3: api.runtime.imageGeneration
  - H2: Rute HTTP Gateway
  - H2: Jalur impor SDK Plugin
  - H2: Skema tool pesan
  - H2: Resolusi target channel
  - H2: Direktori berbasis konfigurasi
  - H2: Katalog provider
  - H2: Inspeksi channel hanya-baca
  - H2: Paket package
  - H3: Metadata katalog channel
  - H2: Plugin engine konteks
  - H2: Menambahkan capability baru
  - H3: Daftar periksa capability
  - H3: Template capability
  - H2: Terkait

## plugins/architecture.md

- Rute: /plugins/architecture
- Judul:
  - H2: Model capability publik
  - H3: Sikap kompatibilitas eksternal
  - H3: Bentuk Plugin
  - H3: Hook legacy
  - H3: Sinyal kompatibilitas
  - H2: Ikhtisar arsitektur
  - H3: Snapshot metadata Plugin dan tabel lookup
  - H3: Perencanaan aktivasi
  - H3: Plugin channel dan tool pesan bersama
  - H2: Model kepemilikan capability
  - H3: Pelapisan capability
  - H3: Contoh Plugin perusahaan multi-capability
  - H3: Contoh capability: pemahaman video
  - H2: Kontrak dan penegakan
  - H3: Yang termasuk dalam kontrak
  - H2: Model eksekusi
  - H2: Batas ekspor
  - H2: Internal dan referensi
  - H2: Terkait

## plugins/building-extensions.md

- Rute: /plugins/building-extensions
- Judul:
  - H2: Terkait

## plugins/building-plugins.md

- Rute: /plugins/building-plugins
- Judul:
  - H2: Persyaratan
  - H2: Pilih bentuk plugin
  - H2: Quickstart
  - H2: Mendaftarkan tool
  - H2: Konvensi impor
  - H2: Daftar periksa pra-pengajuan
  - H2: Uji terhadap rilis beta
  - H2: Langkah berikutnya
  - H2: Terkait

## plugins/bundles.md

- Rute: /plugins/bundles
- Judul:
  - H2: Mengapa bundle ada
  - H2: Instal bundle
  - H2: Yang dipetakan OpenClaw dari bundle
  - H3: Didukung sekarang
  - H4: Konten Skill
  - H4: Paket hook
  - H4: MCP untuk OpenClaw tertanam
  - H4: Pengaturan OpenClaw tertanam
  - H4: LSP OpenClaw tertanam
  - H3: Terdeteksi tetapi tidak dieksekusi
  - H2: Format bundle
  - H2: Prioritas deteksi
  - H2: Dependensi runtime dan pembersihan
  - H2: Keamanan
  - H2: Pemecahan masalah
  - H2: Terkait

## plugins/cli-backend-plugins.md

- Rute: /plugins/cli-backend-plugins
- Judul:
  - H2: Yang dimiliki Plugin
  - H2: Plugin backend minimal
  - H2: Bentuk konfigurasi
  - H2: Hook backend lanjutan
  - H3: ownsNativeCompaction: memilih keluar dari Compaction OpenClaw
  - H2: Bridge tool MCP
  - H2: Konfigurasi pengguna
  - H2: Verifikasi
  - H2: Daftar periksa
  - H2: Terkait

## plugins/codex-computer-use.md

- Rute: /plugins/codex-computer-use
- Judul:
  - H2: OpenClaw.app dan Peekaboo
  - H2: aplikasi iOS
  - H2: MCP cua-driver langsung
  - H2: Penyiapan cepat
  - H2: Perintah
  - H2: Pilihan marketplace
  - H2: Marketplace macOS bundled
  - H2: Batas katalog jarak jauh
  - H2: Referensi konfigurasi
  - H2: Yang diperiksa OpenClaw
  - H2: Izin macOS
  - H2: Pemecahan masalah
  - H2: Terkait

## plugins/codex-harness-reference.md

- Rute: /plugins/codex-harness-reference
- Judul:
  - H2: Permukaan konfigurasi Plugin
  - H2: Transport app-server
  - H2: Mode approval dan sandbox
  - H2: Eksekusi native dengan sandbox
  - H2: Autentikasi dan isolasi environment
  - H2: Tool dinamis
  - H2: Timeout
  - H2: Penemuan model
  - H2: File bootstrap workspace
  - H2: Override environment
  - H2: Terkait

## plugins/codex-harness-runtime.md

- Rute: /plugins/codex-harness-runtime
- Judul:
  - H2: Ikhtisar
  - H2: Binding thread dan perubahan model
  - H2: Balasan terlihat dan Heartbeat
  - H2: Batas hook
  - H2: Kontrak dukungan V1
  - H2: Izin native dan elisitasi MCP
  - H2: Pengarahan antrean
  - H2: Unggahan feedback Codex
  - H2: Compaction dan cermin transkrip
  - H2: Media dan pengiriman
  - H2: Terkait

## plugins/codex-harness.md

- Rute: /plugins/codex-harness
- Judul:
  - H2: Persyaratan
  - H2: Quickstart
  - H2: Konfigurasi
  - H2: Verifikasi runtime Codex
  - H2: Routing dan pemilihan model
  - H2: Pola deployment
  - H3: Deployment Codex dasar
  - H3: Deployment provider campuran
  - H3: Deployment Codex fail-closed
  - H2: Kebijakan app-server
  - H2: Perintah dan diagnostik
  - H3: Periksa thread Codex secara lokal
  - H2: Plugin Codex native
  - H2: Computer Use
  - H2: Batas runtime
  - H2: Pemecahan masalah
  - H2: Terkait

## plugins/codex-native-plugins.md

- Rute: /plugins/codex-native-plugins
- Judul:
  - H2: Persyaratan
  - H2: Quickstart
  - H2: Kelola Plugin dari chat
  - H2: Cara kerja penyiapan Plugin native
  - H2: Batas dukungan V1
  - H2: Inventaris dan kepemilikan aplikasi
  - H2: Konfigurasi aplikasi thread
  - H2: Kebijakan tindakan destruktif
  - H2: Pemecahan masalah
  - H2: Terkait

## plugins/community.md

- Rute: /plugins/community
- Judul:
  - H2: Temukan Plugin
  - H2: Publikasikan Plugin
  - H2: Terkait

## plugins/compatibility.md

- Rute: /plugins/compatibility
- Judul:
  - H2: Registry kompatibilitas
  - H2: Package inspektur Plugin
  - H3: Lane penerimaan maintainer
  - H2: Kebijakan deprekasi
  - H2: Area kompatibilitas saat ini
  - H3: Alias Datar Callback Masuk WhatsApp
  - H3: Field Admission Masuk WhatsApp
  - H2: Catatan rilis

## plugins/copilot.md

- Rute: /plugins/copilot
- Judul:
  - H2: Persyaratan
  - H2: Instal Plugin
  - H2: Quickstart
  - H2: Provider yang didukung
  - H2: BYOK
  - H2: Auth
  - H2: Permukaan konfigurasi
  - H2: Compaction
  - H2: Pencerminan transkrip
  - H2: Pertanyaan sampingan (/btw)
  - H2: Doctor
  - H2: Batasan
  - H2: Izin dan askuser
  - H3: Token GitHub tingkat sesi
  - H2: Terkait

## plugins/dependency-resolution.md

- Rute: /plugins/dependency-resolution
- Judul:
  - H2: Pembagian tanggung jawab
  - H2: Root instalasi
  - H2: Plugin lokal
  - H2: Startup dan reload
  - H2: Plugin bundled
  - H2: Pembersihan legacy

## plugins/google-meet.md

- Rute: /plugins/google-meet
- Judul:
  - H2: Mulai cepat
  - H3: Gateway lokal + Chrome Parallels
  - H2: Catatan instalasi
  - H2: Transport
  - H3: Chrome
  - H3: Twilio
  - H2: OAuth dan prapemeriksaan
  - H3: Buat kredensial Google
  - H3: Buat token penyegaran
  - H3: Verifikasi OAuth dengan doctor
  - H2: Konfigurasi
  - H2: Alat
  - H2: Mode agen dan bidi
  - H2: Daftar periksa pengujian langsung
  - H2: Pemecahan masalah
  - H3: Agen tidak dapat melihat alat Google Meet
  - H3: Tidak ada Node berkemampuan Google Meet yang terhubung
  - H3: Peramban terbuka tetapi agen tidak dapat bergabung
  - H3: Pembuatan rapat gagal
  - H3: Agen bergabung tetapi tidak berbicara
  - H3: Pemeriksaan penyiapan Twilio gagal
  - H3: Panggilan Twilio dimulai tetapi tidak pernah masuk ke rapat
  - H2: Catatan
  - H2: Terkait

## plugins/hooks.md

- Rute: /plugins/hooks
- Judul:
  - H2: Mulai cepat
  - H2: Katalog kait
  - H2: Debug kait runtime
  - H2: Kebijakan panggilan alat
  - H3: Kait lingkungan eksekusi
  - H3: Persistensi hasil alat
  - H2: Kait prompt dan model
  - H3: Ekstensi sesi dan injeksi giliran berikutnya
  - H2: Kait pesan
  - H2: Pasang kait
  - H2: Siklus hidup Gateway
  - H2: Penghentian mendatang
  - H2: Terkait

## plugins/install-overrides.md

- Rute: /plugins/install-overrides
- Judul:
  - H2: Lingkungan
  - H2: Perilaku
  - H2: E2E paket

## plugins/llama-cpp.md

- Rute: /plugins/llama-cpp
- Judul:
  - H2: Konfigurasi
  - H2: Runtime native

## plugins/manage-plugins.md

- Rute: /plugins/manage-plugins
- Judul:
  - H2: Cantumkan dan cari Plugin
  - H2: Pasang Plugin
  - H2: Mulai ulang dan inspeksi
  - H2: Perbarui Plugin
  - H2: Copot pemasangan Plugin
  - H2: Pilih sumber
  - H2: Publikasikan Plugin
  - H2: Terkait

## plugins/manifest.md

- Rute: /plugins/manifest
- Judul:
  - H2: Fungsi berkas ini
  - H2: Contoh minimal
  - H2: Contoh lengkap
  - H2: Referensi bidang tingkat teratas
  - H2: Referensi metadata penyedia generasi
  - H2: Referensi metadata alat
  - H2: Referensi providerAuthChoices
  - H2: Referensi commandAliases
  - H2: Referensi activation
  - H2: Referensi qaRunners
  - H2: Referensi setup
  - H3: Referensi setup.providers
  - H3: Bidang setup
  - H2: Referensi uiHints
  - H2: Referensi contracts
  - H2: Referensi mediaUnderstandingProviderMetadata
  - H2: Referensi channelConfigs
  - H3: Mengganti Plugin saluran lain
  - H2: Referensi modelSupport
  - H2: Referensi modelCatalog
  - H2: Referensi modelIdNormalization
  - H2: Referensi providerEndpoints
  - H2: Referensi providerRequest
  - H2: Referensi secretProviderIntegrations
  - H2: Referensi modelPricing
  - H3: Indeks Penyedia OpenClaw
  - H2: Manifest versus package.json
  - H3: Bidang package.json yang memengaruhi penemuan
  - H2: Prioritas penemuan (id Plugin duplikat)
  - H2: Persyaratan Skema JSON
  - H2: Perilaku validasi
  - H2: Catatan
  - H2: Terkait

## plugins/memory-lancedb.md

- Rute: /plugins/memory-lancedb
- Judul:
  - H2: Instalasi
  - H2: Mulai cepat
  - H2: Embedding yang didukung penyedia
  - H2: Embedding Ollama
  - H2: Penyedia yang kompatibel dengan OpenAI
  - H2: Batas pemanggilan kembali dan penangkapan
  - H2: Perintah
  - H2: Penyimpanan
  - H2: Dependensi runtime
  - H2: Pemecahan masalah
  - H3: Panjang input melebihi panjang konteks
  - H3: Model embedding tidak didukung
  - H3: Plugin dimuat tetapi tidak ada memori yang muncul
  - H2: Terkait

## plugins/memory-wiki.md

- Rute: /plugins/memory-wiki
- Judul:
  - H2: Yang ditambahkan
  - H2: Cara kerjanya dengan memori
  - H2: Pola hibrida yang direkomendasikan
  - H2: Mode brankas
  - H3: terisolasi
  - H3: jembatan
  - H3: lokal-tidak-aman
  - H2: Tata letak brankas
  - H2: Impor Format Pengetahuan Terbuka
  - H2: Klaim terstruktur dan bukti
  - H2: Metadata entitas untuk agen
  - H2: Pipeline kompilasi
  - H2: Dasbor dan laporan kesehatan
  - H2: Pencarian dan pengambilan
  - H2: Alat agen
  - H2: Perilaku prompt dan konteks
  - H2: Konfigurasi
  - H3: Contoh: QMD + mode jembatan
  - H2: CLI
  - H2: Dukungan Obsidian
  - H2: Alur kerja yang direkomendasikan
  - H2: Dokumen terkait

## plugins/message-presentation.md

- Rute: /plugins/message-presentation
- Judul:
  - H2: Kontrak
  - H2: Contoh produsen
  - H2: Kontrak perender
  - H2: Alur render inti
  - H2: Aturan degradasi
  - H3: Visibilitas fallback nilai tombol
  - H2: Pemetaan penyedia
  - H2: Presentasi vs InteractiveReply
  - H2: Pin pengiriman
  - H2: Daftar periksa penulis Plugin
  - H2: Dokumen terkait

## plugins/oc-path.md

- Rute: /plugins/oc-path
- Judul:
  - H2: Alasan mengaktifkannya
  - H2: Tempat dijalankan
  - H2: Aktifkan
  - H2: Dependensi
  - H2: Yang disediakan
  - H2: Hubungan dengan Plugin lain
  - H2: Keamanan
  - H2: Terkait

## plugins/plugin-inventory.md

- Rute: /plugins/plugin-inventory
- Judul:
  - H1: Inventaris Plugin
  - H2: Definisi
  - H2: Pasang Plugin
  - H2: Paket npm inti
  - H2: Paket eksternal resmi
  - H2: Hanya checkout sumber

## plugins/plugin-permission-requests.md

- Rute: /plugins/plugin-permission-requests
- Judul:
  - H2: Pilih gerbang yang tepat
  - H2: Minta persetujuan sebelum panggilan alat
  - H2: Perilaku keputusan
  - H2: Rutekan prompt persetujuan
  - H2: Izin native Codex
  - H2: Pemecahan masalah
  - H2: Terkait

## plugins/reference.md

- Rute: /plugins/reference
- Judul:
  - H1: Referensi Plugin

## plugins/reference/acpx.md

- Rute: /plugins/reference/acpx
- Judul:
  - H1: Plugin ACPx
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/admin-http-rpc.md

- Rute: /plugins/reference/admin-http-rpc
- Judul:
  - H1: Plugin Admin Http Rpc
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/alibaba.md

- Rute: /plugins/reference/alibaba
- Judul:
  - H1: Plugin Alibaba
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/amazon-bedrock-mantle.md

- Rute: /plugins/reference/amazon-bedrock-mantle
- Judul:
  - H1: Plugin Amazon Bedrock Mantle
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/amazon-bedrock.md

- Rute: /plugins/reference/amazon-bedrock
- Judul:
  - H1: Plugin Amazon Bedrock
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/anthropic-vertex.md

- Rute: /plugins/reference/anthropic-vertex
- Judul:
  - H1: Plugin Anthropic Vertex
  - H2: Distribusi
  - H2: Permukaan
  - H2: Claude Fable 5

## plugins/reference/anthropic.md

- Rute: /plugins/reference/anthropic
- Judul:
  - H1: Plugin Anthropic
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/arcee.md

- Rute: /plugins/reference/arcee
- Judul:
  - H1: Plugin Arcee
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/azure-speech.md

- Rute: /plugins/reference/azure-speech
- Judul:
  - H1: Plugin Azure Speech
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/bonjour.md

- Rute: /plugins/reference/bonjour
- Judul:
  - H1: Plugin Bonjour
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/brave.md

- Rute: /plugins/reference/brave
- Judul:
  - H1: Plugin Brave
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/browser.md

- Rute: /plugins/reference/browser
- Judul:
  - H1: Plugin Browser
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/byteplus.md

- Rute: /plugins/reference/byteplus
- Judul:
  - H1: Plugin BytePlus
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/canvas.md

- Rute: /plugins/reference/canvas
- Judul:
  - H1: Plugin Canvas
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/cerebras.md

- Rute: /plugins/reference/cerebras
- Judul:
  - H1: Plugin Cerebras
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/chutes.md

- Rute: /plugins/reference/chutes
- Judul:
  - H1: Plugin Chutes
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/clickclack.md

- Rute: /plugins/reference/clickclack
- Judul:
  - H1: Plugin Clickclack
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/cloudflare-ai-gateway.md

- Rute: /plugins/reference/cloudflare-ai-gateway
- Judul:
  - H1: Plugin Cloudflare AI Gateway
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/codex-supervisor.md

- Rute: /plugins/reference/codex-supervisor
- Judul:
  - H1: Plugin Codex Supervisor
  - H2: Distribusi
  - H2: Permukaan
  - H2: Daftar sesi

## plugins/reference/codex.md

- Rute: /plugins/reference/codex
- Judul:
  - H1: Plugin Codex
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/cohere.md

- Rute: /plugins/reference/cohere
- Judul:
  - H1: Plugin Cohere
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/comfy.md

- Rute: /plugins/reference/comfy
- Judul:
  - H1: Plugin ComfyUI
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/copilot-proxy.md

- Rute: /plugins/reference/copilot-proxy
- Judul:
  - H1: Plugin Copilot Proxy
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/copilot.md

- Rute: /plugins/reference/copilot
- Judul:
  - H1: Plugin Copilot
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/deepgram.md

- Rute: /plugins/reference/deepgram
- Judul:
  - H1: Plugin Deepgram
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/deepinfra.md

- Rute: /plugins/reference/deepinfra
- Judul:
  - H1: Plugin DeepInfra
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/deepseek.md

- Rute: /plugins/reference/deepseek
- Judul:
  - H1: Plugin DeepSeek
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/diagnostics-otel.md

- Rute: /plugins/reference/diagnostics-otel
- Judul:
  - H1: Plugin Diagnostics OpenTelemetry
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/diagnostics-prometheus.md

- Rute: /plugins/reference/diagnostics-prometheus
- Judul:
  - H1: Plugin Diagnostics Prometheus
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/diffs-language-pack.md

- Rute: /plugins/reference/diffs-language-pack
- Judul:
  - H1: Plugin Paket Bahasa Diffs
  - H2: Distribusi
  - H2: Permukaan
  - H2: Bahasa yang ditambahkan

## plugins/reference/diffs.md

- Rute: /plugins/reference/diffs
- Judul:
  - H1: Plugin Diffs
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/discord.md

- Rute: /plugins/reference/discord
- Judul:
  - H1: Plugin Discord
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/document-extract.md

- Rute: /plugins/reference/document-extract
- Judul:
  - H1: Plugin Ekstrak Dokumen
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/duckduckgo.md

- Rute: /plugins/reference/duckduckgo
- Judul:
  - H1: Plugin DuckDuckGo
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/elevenlabs.md

- Rute: /plugins/reference/elevenlabs
- Judul:
  - H1: Plugin Elevenlabs
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/exa.md

- Rute: /plugins/reference/exa
- Judul:
  - H1: Plugin Exa
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/fal.md

- Rute: /plugins/reference/fal
- Judul:
  - H1: Plugin fal
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/feishu.md

- Rute: /plugins/reference/feishu
- Judul:
  - H1: Plugin Feishu
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/file-transfer.md

- Rute: /plugins/reference/file-transfer
- Judul:
  - H1: Plugin Transfer Berkas
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/firecrawl.md

- Rute: /plugins/reference/firecrawl
- Judul:
  - H1: Plugin Firecrawl
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumen terkait

## plugins/reference/fireworks.md

- Rute: /plugins/reference/fireworks
- Judul:
  - H1: Plugin Fireworks
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/github-copilot.md

- Rute: /plugins/reference/github-copilot
- Judul:
  - H1: Plugin GitHub Copilot
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/gmi.md

- Rute: /plugins/reference/gmi
- Judul:
  - H1: Plugin Gmi
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/google-meet.md

- Rute: /plugins/reference/google-meet
- Judul:
  - H1: Plugin Google Meet
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/google.md

- Rute: /plugins/reference/google
- Judul:
  - H1: Plugin Google
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/googlechat.md

- Rute: /plugins/reference/googlechat
- Judul:
  - H1: Plugin Google Chat
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/gradium.md

- Rute: /plugins/reference/gradium
- Judul:
  - H1: Plugin Gradium
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/groq.md

- Rute: /plugins/reference/groq
- Judul:
  - H1: Plugin Groq
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/huggingface.md

- Rute: /plugins/reference/huggingface
- Judul:
  - H1: Plugin Hugging Face
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/imessage.md

- Rute: /plugins/reference/imessage
- Judul:
  - H1: Plugin iMessage
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/inworld.md

- Rute: /plugins/reference/inworld
- Judul:
  - H1: Plugin Inworld
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/irc.md

- Rute: /plugins/reference/irc
- Judul:
  - H1: Plugin IRC
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/kilocode.md

- Rute: /plugins/reference/kilocode
- Judul:
  - H1: Plugin Kilocode
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/kimi.md

- Rute: /plugins/reference/kimi
- Judul:
  - H1: Plugin Kimi
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/line.md

- Rute: /plugins/reference/line
- Judul:
  - H1: Plugin LINE
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/litellm.md

- Rute: /plugins/reference/litellm
- Judul:
  - H1: Plugin LiteLLM
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/llama-cpp.md

- Rute: /plugins/reference/llama-cpp
- Judul:
  - H1: Plugin Llama Cpp
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/llm-task.md

- Rute: /plugins/reference/llm-task
- Judul:
  - H1: Plugin LLM Task
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/lmstudio.md

- Rute: /plugins/reference/lmstudio
- Judul:
  - H1: Plugin LM Studio
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/lobster.md

- Rute: /plugins/reference/lobster
- Judul:
  - H1: Plugin Lobster
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/matrix.md

- Rute: /plugins/reference/matrix
- Judul:
  - H1: Plugin Matrix
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/mattermost.md

- Rute: /plugins/reference/mattermost
- Judul:
  - H1: Plugin Mattermost
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/memory-core.md

- Rute: /plugins/reference/memory-core
- Judul:
  - H1: Plugin Memory Core
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/memory-lancedb.md

- Rute: /plugins/reference/memory-lancedb
- Judul:
  - H1: Plugin Memory Lancedb
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/memory-wiki.md

- Rute: /plugins/reference/memory-wiki
- Judul:
  - H1: Plugin Memory Wiki
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/microsoft-foundry.md

- Rute: /plugins/reference/microsoft-foundry
- Judul:
  - H1: Plugin Microsoft Foundry
  - H2: Distribusi
  - H2: Permukaan
  - H2: Persyaratan
  - H2: Model chat
  - H2: Pembuatan gambar MAI
  - H2: Pemecahan masalah

## plugins/reference/microsoft.md

- Rute: /plugins/reference/microsoft
- Judul:
  - H1: Plugin Microsoft
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/migrate-claude.md

- Rute: /plugins/reference/migrate-claude
- Judul:
  - H1: Plugin Migrate Claude
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/migrate-hermes.md

- Rute: /plugins/reference/migrate-hermes
- Judul:
  - H1: Plugin Migrate Hermes
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/minimax.md

- Rute: /plugins/reference/minimax
- Judul:
  - H1: Plugin MiniMax
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/mistral.md

- Rute: /plugins/reference/mistral
- Judul:
  - H1: Plugin Mistral
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/moonshot.md

- Rute: /plugins/reference/moonshot
- Judul:
  - H1: Plugin Moonshot
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/msteams.md

- Rute: /plugins/reference/msteams
- Judul:
  - H1: Plugin Microsoft Teams
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/nextcloud-talk.md

- Rute: /plugins/reference/nextcloud-talk
- Judul:
  - H1: Plugin Nextcloud Talk
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/nostr.md

- Rute: /plugins/reference/nostr
- Judul:
  - H1: Plugin Nostr
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/novita.md

- Rute: /plugins/reference/novita
- Judul:
  - H1: Plugin Novita
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/nvidia.md

- Rute: /plugins/reference/nvidia
- Judul:
  - H1: Plugin NVIDIA
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/oc-path.md

- Rute: /plugins/reference/oc-path
- Judul:
  - H1: Plugin Oc Path
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/ollama.md

- Rute: /plugins/reference/ollama
- Judul:
  - H1: Plugin Ollama
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/open-prose.md

- Rute: /plugins/reference/open-prose
- Judul:
  - H1: Plugin Open Prose
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/openai.md

- Rute: /plugins/reference/openai
- Judul:
  - H1: Plugin OpenAI
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/opencode-go.md

- Rute: /plugins/reference/opencode-go
- Judul:
  - H1: Plugin OpenCode Go
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/opencode.md

- Rute: /plugins/reference/opencode
- Judul:
  - H1: Plugin OpenCode
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/openrouter.md

- Rute: /plugins/reference/openrouter
- Judul:
  - H1: Plugin OpenRouter
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/openshell.md

- Rute: /plugins/reference/openshell
- Judul:
  - H1: Plugin Openshell
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/perplexity.md

- Rute: /plugins/reference/perplexity
- Judul:
  - H1: Plugin Perplexity
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/pixverse.md

- Rute: /plugins/reference/pixverse
- Judul:
  - H1: Plugin PixVerse
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/policy.md

- Rute: /plugins/reference/policy
- Judul:
  - H1: Plugin Policy
  - H2: Distribusi
  - H2: Permukaan
  - H2: Perilaku
  - H2: Dokumentasi terkait

## plugins/reference/qa-channel.md

- Rute: /plugins/reference/qa-channel
- Judul:
  - H1: Plugin QA Channel
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/qa-lab.md

- Rute: /plugins/reference/qa-lab
- Judul:
  - H1: Plugin QA Lab
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/qa-matrix.md

- Rute: /plugins/reference/qa-matrix
- Judul:
  - H1: Plugin QA Matrix
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/qianfan.md

- Rute: /plugins/reference/qianfan
- Judul:
  - H1: Plugin Qianfan
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/qqbot.md

- Rute: /plugins/reference/qqbot
- Judul:
  - H1: Plugin QQ Bot
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/qwen.md

- Rute: /plugins/reference/qwen
- Judul:
  - H1: Plugin Qwen
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/raft.md

- Rute: /plugins/reference/raft
- Judul:
  - H1: Plugin Raft
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/runway.md

- Rute: /plugins/reference/runway
- Judul:
  - H1: Plugin Runway
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/searxng.md

- Rute: /plugins/reference/searxng
- Judul:
  - H1: Plugin SearXNG
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/senseaudio.md

- Rute: /plugins/reference/senseaudio
- Judul:
  - H1: Plugin Senseaudio
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/sglang.md

- Rute: /plugins/reference/sglang
- Judul:
  - H1: Plugin SGLang
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/signal.md

- Rute: /plugins/reference/signal
- Judul:
  - H1: Plugin Signal
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/slack.md

- Rute: /plugins/reference/slack
- Judul:
  - H1: Plugin Slack
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/sms.md

- Rute: /plugins/reference/sms
- Judul:
  - H1: Plugin Sms
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/stepfun.md

- Rute: /plugins/reference/stepfun
- Judul:
  - H1: Plugin StepFun
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/synology-chat.md

- Rute: /plugins/reference/synology-chat
- Judul:
  - H1: Plugin Synology Chat
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/synthetic.md

- Rute: /plugins/reference/synthetic
- Judul:
  - H1: Plugin Synthetic
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/tavily.md

- Rute: /plugins/reference/tavily
- Judul:
  - H1: Plugin Tavily
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/telegram.md

- Rute: /plugins/reference/telegram
- Judul:
  - H1: Plugin Telegram
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/tencent.md

- Rute: /plugins/reference/tencent
- Judul:
  - H1: Plugin Tencent
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/tlon.md

- Rute: /plugins/reference/tlon
- Judul:
  - H1: Plugin Tlon
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/together.md

- Rute: /plugins/reference/together
- Judul:
  - H1: Plugin Together
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/tokenjuice.md

- Rute: /plugins/reference/tokenjuice
- Judul:
  - H1: Plugin Tokenjuice
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/tts-local-cli.md

- Rute: /plugins/reference/tts-local-cli
- Judul:
  - H1: Plugin TTS Local CLI
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/twitch.md

- Rute: /plugins/reference/twitch
- Judul:
  - H1: Plugin Twitch
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/venice.md

- Rute: /plugins/reference/venice
- Heading:
  - H1: Plugin Venice
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/vercel-ai-gateway.md

- Rute: /plugins/reference/vercel-ai-gateway
- Heading:
  - H1: Plugin Vercel AI Gateway
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/vllm.md

- Rute: /plugins/reference/vllm
- Heading:
  - H1: Plugin vLLM
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/voice-call.md

- Rute: /plugins/reference/voice-call
- Heading:
  - H1: Plugin Voice Call
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/volcengine.md

- Rute: /plugins/reference/volcengine
- Heading:
  - H1: Plugin Volcengine
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/voyage.md

- Rute: /plugins/reference/voyage
- Heading:
  - H1: Plugin Voyage
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/vydra.md

- Rute: /plugins/reference/vydra
- Heading:
  - H1: Plugin Vydra
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/web-readability.md

- Rute: /plugins/reference/web-readability
- Heading:
  - H1: Plugin Web Readability
  - H2: Distribusi
  - H2: Permukaan

## plugins/reference/webhooks.md

- Rute: /plugins/reference/webhooks
- Heading:
  - H1: Plugin Webhook
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/whatsapp.md

- Rute: /plugins/reference/whatsapp
- Heading:
  - H1: Plugin WhatsApp
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/workboard.md

- Rute: /plugins/reference/workboard
- Heading:
  - H1: Plugin Workboard
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/xai.md

- Rute: /plugins/reference/xai
- Heading:
  - H1: Plugin xAI
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/xiaomi.md

- Rute: /plugins/reference/xiaomi
- Heading:
  - H1: Plugin Xiaomi
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/zai.md

- Rute: /plugins/reference/zai
- Heading:
  - H1: Plugin Z.AI
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/zalo.md

- Rute: /plugins/reference/zalo
- Heading:
  - H1: Plugin Zalo
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/reference/zalouser.md

- Rute: /plugins/reference/zalouser
- Heading:
  - H1: Plugin Zalo Personal
  - H2: Distribusi
  - H2: Permukaan
  - H2: Dokumentasi terkait

## plugins/sdk-agent-harness.md

- Rute: /plugins/sdk-agent-harness
- Heading:
  - H2: Kapan menggunakan harness
  - H2: Apa yang tetap dimiliki core
  - H2: Mendaftarkan harness
  - H2: Kebijakan pemilihan
  - H2: Pasangan provider plus harness
  - H3: Middleware hasil alat
  - H3: Klasifikasi hasil terminal
  - H3: Efek samping akhir agen
  - H3: Input pengguna dan permukaan alat
  - H3: Mode harness Codex native
  - H2: Ketegasan runtime
  - H2: Sesi native dan cermin transkrip
  - H2: Hasil alat dan media
  - H2: Batasan saat ini
  - H2: Terkait

## plugins/sdk-channel-inbound.md

- Rute: /plugins/sdk-channel-inbound
- Heading:
  - H2: Helper core
  - H2: Migrasi

## plugins/sdk-channel-ingress.md

- Rute: /plugins/sdk-channel-ingress
- Heading:
  - H1: API ingress channel
  - H2: Resolver runtime
  - H2: Hasil
  - H2: Grup akses
  - H2: Mode peristiwa
  - H2: Rute dan aktivasi
  - H2: Redaksi
  - H2: Verifikasi

## plugins/sdk-channel-message.md

- Rute: /plugins/sdk-channel-message
- Heading: tidak ada

## plugins/sdk-channel-outbound.md

- Rute: /plugins/sdk-channel-outbound
- Heading:
  - H2: Adapter
  - H2: Adapter outbound yang ada
  - H2: Pengiriman tahan lama
  - H2: Dispatch kompatibilitas

## plugins/sdk-channel-plugins.md

- Rute: /plugins/sdk-channel-plugins
- Heading:
  - H2: Cara kerja Plugin channel
  - H2: Persetujuan dan kemampuan channel
  - H2: Kebijakan sebutan inbound
  - H2: Panduan langkah demi langkah
  - H2: Struktur file
  - H2: Topik lanjutan
  - H2: Langkah berikutnya
  - H2: Terkait

## plugins/sdk-channel-turn.md

- Rute: /plugins/sdk-channel-turn
- Heading: tidak ada

## plugins/sdk-entrypoints.md

- Rute: /plugins/sdk-entrypoints
- Heading:
  - H2: defineToolPlugin
  - H2: definePluginEntry
  - H2: defineChannelPluginEntry
  - H2: defineSetupPluginEntry
  - H2: Mode pendaftaran
  - H2: Bentuk Plugin
  - H2: Terkait

## plugins/sdk-migration.md

- Rute: /plugins/sdk-migration
- Heading:
  - H2: Apa yang berubah
  - H2: Mengapa ini berubah
  - H2: Rencana migrasi bicara dan suara realtime
  - H2: Kebijakan kompatibilitas
  - H2: Cara bermigrasi
  - H2: Referensi path impor
  - H2: Penghentian aktif
  - H2: Linimasa penghapusan
  - H2: Menekan peringatan untuk sementara
  - H2: Terkait

## plugins/sdk-overview.md

- Rute: /plugins/sdk-overview
- Heading:
  - H2: Konvensi impor
  - H2: Referensi subpath
  - H2: API pendaftaran
  - H3: Pendaftaran kemampuan
  - H3: Alat dan perintah
  - H3: Infrastruktur
  - H3: Hook host untuk Plugin workflow
  - H3: Pendaftaran penemuan Gateway
  - H3: Metadata pendaftaran CLI
  - H3: Pendaftaran backend CLI
  - H3: Slot eksklusif
  - H3: Adapter embedding memori yang tidak digunakan lagi
  - H3: Peristiwa dan siklus hidup
  - H3: Semantik keputusan hook
  - H3: Field objek API
  - H2: Konvensi modul internal
  - H2: Terkait

## plugins/sdk-provider-plugins.md

- Rute: /plugins/sdk-provider-plugins
- Heading:
  - H2: Panduan langkah demi langkah
  - H2: Publikasikan ke ClawHub
  - H2: Struktur file
  - H2: Referensi urutan katalog
  - H2: Langkah berikutnya
  - H2: Terkait

## plugins/sdk-runtime.md

- Rute: /plugins/sdk-runtime
- Heading:
  - H2: Pemuatan dan penulisan konfigurasi
  - H2: Utilitas runtime yang dapat digunakan ulang
  - H2: Namespace runtime
  - H2: Menyimpan referensi runtime
  - H2: Field api tingkat atas lainnya
  - H2: Terkait

## plugins/sdk-setup.md

- Rute: /plugins/sdk-setup
- Heading:
  - H2: Metadata paket
  - H3: field openclaw
  - H3: openclaw.channel
  - H3: openclaw.install
  - H3: Pemuatan penuh yang ditunda
  - H2: Manifest Plugin
  - H2: Publikasi ClawHub
  - H2: Entri setup
  - H3: Impor helper setup yang sempit
  - H3: Promosi akun tunggal milik channel
  - H2: Skema konfigurasi
  - H3: Membuat skema konfigurasi channel
  - H2: Wizard setup
  - H2: Publikasi dan pemasangan
  - H2: Terkait

## plugins/sdk-subpaths.md

- Rute: /plugins/sdk-subpaths
- Heading:
  - H2: Entri Plugin
  - H3: Kompatibilitas dan helper pengujian yang tidak digunakan lagi
  - H3: Subpath helper Plugin bawaan yang dicadangkan
  - H2: Terkait

## plugins/sdk-testing.md

- Rute: /plugins/sdk-testing
- Heading:
  - H2: Utilitas pengujian
  - H3: Ekspor yang tersedia
  - H3: Tipe
  - H2: Menguji resolusi target
  - H2: Pola pengujian
  - H3: Menguji kontrak pendaftaran
  - H3: Menguji akses konfigurasi runtime
  - H3: Menguji unit Plugin channel
  - H3: Menguji unit Plugin provider
  - H3: Membuat mock runtime Plugin
  - H3: Menguji dengan stub per instans
  - H2: Pengujian kontrak (Plugin dalam repo)
  - H3: Menjalankan pengujian berscope
  - H2: Penegakan lint (Plugin dalam repo)
  - H2: Konfigurasi pengujian
  - H2: Terkait

## plugins/tool-plugins.md

- Rute: /plugins/tool-plugins
- Heading:
  - H2: Persyaratan
  - H2: Mulai cepat
  - H2: Menulis alat
  - H2: Alat opsional dan factory
  - H2: Nilai balik
  - H2: Konfigurasi
  - H2: Metadata yang dihasilkan
  - H2: Metadata paket
  - H2: Validasi di CI
  - H2: Pasang dan periksa secara lokal
  - H2: Publikasikan
  - H2: Pemecahan masalah
  - H3: entri plugin tidak ditemukan: ./dist/index.js
  - H3: entri plugin tidak mengekspos metadata defineToolPlugin
  - H3: metadata openclaw.plugin.json yang dihasilkan sudah usang
  - H3: package.json openclaw.extensions harus menyertakan ./dist/index.js
  - H3: Tidak dapat menemukan paket 'typebox'
  - H3: Alat tidak muncul setelah pemasangan
  - H2: Lihat juga

## plugins/voice-call.md

- Rute: /plugins/voice-call
- Heading:
  - H2: Mulai cepat
  - H2: Konfigurasi
  - H2: Scope sesi
  - H2: Percakapan suara realtime
  - H3: Kebijakan alat
  - H3: Konteks suara agen
  - H3: Contoh provider realtime
  - H2: Transkripsi streaming
  - H3: Contoh provider streaming
  - H2: TTS untuk panggilan
  - H3: Contoh TTS
  - H2: Panggilan inbound
  - H3: Routing per nomor
  - H3: Kontrak keluaran lisan
  - H3: Perilaku startup percakapan
  - H3: Grace pemutusan stream Twilio
  - H2: Reaper panggilan basi
  - H2: Keamanan Webhook
  - H2: CLI
  - H2: Alat agen
  - H2: RPC Gateway
  - H2: Pemecahan masalah
  - H3: Setup gagal mengekspos Webhook
  - H3: Kredensial provider gagal
  - H3: Panggilan dimulai tetapi Webhook provider tidak tiba
  - H3: Verifikasi tanda tangan gagal
  - H3: Bergabung Google Meet Twilio gagal
  - H3: Panggilan realtime tidak memiliki ucapan
  - H2: Terkait

## plugins/webhooks.md

- Rute: /plugins/webhooks
- Heading:
  - H2: Tempat menjalankannya
  - H2: Mengonfigurasi rute
  - H2: Model keamanan
  - H2: Format permintaan
  - H2: Tindakan yang didukung
  - H3: createflow
  - H3: runtask
  - H2: Bentuk respons
  - H2: Dokumentasi terkait

## plugins/workboard.md

- Rute: /plugins/workboard
- Heading:
  - H2: Status default
  - H2: Isi kartu
  - H2: Eksekusi kartu dan tugas
  - H2: Koordinasi agen
  - H3: Pemilihan worker dispatch
  - H3: Prompt worker dan siklus hidup
  - H3: Titik entri dispatch
  - H2: CLI dan perintah slash
  - H2: Sinkronisasi siklus hidup sesi
  - H2: Workflow dashboard
  - H2: Izin
  - H2: Konfigurasi
  - H2: Pemecahan masalah
  - H3: Tab mengatakan Workboard tidak tersedia
  - H3: Kartu tidak tersimpan
  - H3: Memulai kartu tidak membuka sesi yang diharapkan
  - H3: Dispatch tidak memulai worker
  - H2: Terkait

## plugins/zalouser.md

- Rute: /plugins/zalouser
- Heading:
  - H2: Penamaan
  - H2: Tempat menjalankannya
  - H2: Pasang
  - H3: Opsi A: pasang dari npm
  - H3: Opsi B: pasang dari folder lokal (dev)
  - H2: Konfigurasi
  - H2: CLI
  - H2: Alat agen
  - H2: Terkait

## prose.md

- Rute: /prose
- Heading:
  - H2: Pasang
  - H2: Perintah slash
  - H2: Yang dapat dilakukannya
  - H2: Contoh: riset dan sintesis paralel
  - H2: Pemetaan runtime OpenClaw
  - H2: Lokasi file
  - H2: Backend status
  - H2: Keamanan
  - H2: Terkait

## providers/alibaba.md

- Rute: /providers/alibaba
- Heading:
  - H2: Memulai
  - H2: Model Wan bawaan
  - H2: Kemampuan dan batasan
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/anthropic.md

- Rute: /providers/anthropic
- Heading:
  - H2: Memulai
  - H2: Default thinking (Claude Fable 5, 4.8, dan 4.6)
  - H2: Caching prompt
  - H2: Konfigurasi lanjutan
  - H2: Pemecahan masalah
  - H2: Terkait

## providers/arcee.md

- Rute: /providers/arcee
- Heading:
  - H2: Pasang Plugin
  - H2: Memulai
  - H2: Setup noninteraktif
  - H2: Katalog bawaan
  - H2: Fitur yang didukung
  - H2: Terkait

## providers/azure-speech.md

- Rute: /providers/azure-speech
- Heading:
  - H2: Memulai
  - H2: Opsi konfigurasi
  - H2: Catatan
  - H2: Terkait

## providers/bedrock-mantle.md

- Rute: /providers/bedrock-mantle
- Heading:
  - H2: Memulai
  - H2: Penemuan model otomatis
  - H3: Region yang didukung
  - H2: Konfigurasi manual
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/bedrock.md

- Rute: /providers/bedrock
- Heading:
  - H2: Memulai
  - H2: Penemuan model otomatis
  - H2: Setup cepat (path AWS)
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/cerebras.md

- Rute: /providers/cerebras
- Heading:
  - H2: Pasang Plugin
  - H2: Memulai
  - H2: Setup noninteraktif
  - H2: Katalog bawaan
  - H2: Konfigurasi manual
  - H2: Terkait

## providers/chutes.md

- Rute: /providers/chutes
- Heading:
  - H2: Pasang Plugin
  - H2: Memulai
  - H2: Perilaku penemuan
  - H2: Alias default
  - H2: Katalog starter bawaan
  - H2: Contoh konfigurasi
  - H2: Terkait

## providers/claude-max-api-proxy.md

- Rute: /providers/claude-max-api-proxy
- Judul:
  - H2: Mengapa menggunakan ini?
  - H2: Cara kerjanya
  - H2: Memulai
  - H2: Katalog bawaan
  - H2: Konfigurasi lanjutan
  - H2: Catatan
  - H2: Terkait

## providers/cloudflare-ai-gateway.md

- Rute: /providers/cloudflare-ai-gateway
- Judul:
  - H2: Instal Plugin
  - H2: Memulai
  - H2: Contoh noninteraktif
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/cohere.md

- Rute: /providers/cohere
- Judul:
  - H2: Mulai
  - H2: Penyiapan hanya lingkungan
  - H2: Terkait

## providers/comfy.md

- Rute: /providers/comfy
- Judul:
  - H2: Yang didukung
  - H2: Memulai
  - H2: Konfigurasi
  - H3: Kunci bersama
  - H3: Kunci per kapabilitas
  - H2: Detail workflow
  - H2: Terkait

## providers/deepgram.md

- Rute: /providers/deepgram
- Judul:
  - H2: Memulai
  - H2: Opsi konfigurasi
  - H2: STT streaming Panggilan Suara
  - H2: Catatan
  - H2: Terkait

## providers/deepinfra.md

- Rute: /providers/deepinfra
- Judul:
  - H2: Instal Plugin
  - H2: Mendapatkan kunci API
  - H2: Penyiapan CLI
  - H2: Cuplikan konfigurasi
  - H2: Surface OpenClaw yang didukung
  - H2: Model yang tersedia
  - H2: Catatan
  - H2: Terkait

## providers/deepseek.md

- Rute: /providers/deepseek
- Judul:
  - H2: Instal Plugin
  - H2: Memulai
  - H2: Katalog bawaan
  - H2: Berpikir dan alat
  - H2: Pengujian live
  - H2: Contoh konfigurasi
  - H2: Terkait

## providers/ds4.md

- Rute: /providers/ds4
- Judul:
  - H2: Persyaratan
  - H2: Quickstart
  - H2: Konfigurasi lengkap
  - H2: Startup sesuai permintaan
  - H2: Think Max
  - H2: Uji
  - H2: Pemecahan masalah
  - H2: Terkait

## providers/elevenlabs.md

- Rute: /providers/elevenlabs
- Judul:
  - H2: Autentikasi
  - H2: Teks-ke-ucapan
  - H2: Ucapan-ke-teks
  - H2: STT streaming
  - H2: Terkait

## providers/fal.md

- Rute: /providers/fal
- Judul:
  - H2: Memulai
  - H2: Pembuatan gambar
  - H2: Pembuatan video
  - H2: Pembuatan musik
  - H2: Terkait

## providers/fireworks.md

- Rute: /providers/fireworks
- Judul:
  - H2: Memulai
  - H2: Penyiapan noninteraktif
  - H2: Katalog bawaan
  - H2: ID model Fireworks kustom
  - H2: Terkait

## providers/github-copilot.md

- Rute: /providers/github-copilot
- Judul:
  - H2: Tiga cara menggunakan Copilot di OpenClaw
  - H2: Flag opsional
  - H2: Onboarding noninteraktif
  - H2: Embedding pencarian memori
  - H3: Konfigurasi
  - H3: Cara kerjanya
  - H2: Terkait

## providers/gmi.md

- Rute: /providers/gmi
- Judul:
  - H2: Penyiapan
  - H2: Default
  - H2: Kapan memilih GMI
  - H2: Model
  - H2: Pemecahan masalah
  - H2: Terkait

## providers/google.md

- Rute: /providers/google
- Judul:
  - H2: Memulai
  - H2: Kapabilitas
  - H2: Pencarian web
  - H2: Pembuatan gambar
  - H2: Pembuatan video
  - H2: Pembuatan musik
  - H2: Teks-ke-ucapan
  - H2: Suara realtime
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/gradium.md

- Rute: /providers/gradium
- Judul:
  - H2: Instal Plugin
  - H2: Penyiapan
  - H2: Konfigurasi
  - H2: Suara
  - H3: Penggantian suara per pesan
  - H2: Output
  - H2: Urutan pilih otomatis
  - H2: Terkait

## providers/groq.md

- Rute: /providers/groq
- Judul:
  - H2: Instal Plugin
  - H2: Memulai
  - H3: Contoh file konfigurasi
  - H2: Katalog bawaan
  - H2: Model penalaran
  - H2: Transkripsi audio
  - H2: Terkait

## providers/huggingface.md

- Rute: /providers/huggingface
- Judul:
  - H2: Memulai
  - H3: Penyiapan noninteraktif
  - H2: ID Model
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/index.md

- Rute: /providers
- Judul:
  - H2: Mulai cepat
  - H2: Dokumentasi penyedia
  - H2: Halaman ikhtisar bersama
  - H2: Penyedia transkripsi
  - H2: Alat komunitas

## providers/inferrs.md

- Rute: /providers/inferrs
- Judul:
  - H2: Memulai
  - H2: Contoh konfigurasi lengkap
  - H2: Startup sesuai permintaan
  - H2: Konfigurasi lanjutan
  - H2: Pemecahan masalah
  - H2: Terkait

## providers/inworld.md

- Rute: /providers/inworld
- Judul:
  - H2: Instal Plugin
  - H2: Memulai
  - H2: Opsi konfigurasi
  - H2: Catatan
  - H2: Terkait

## providers/kilocode.md

- Rute: /providers/kilocode
- Judul:
  - H2: Instal Plugin
  - H2: Memulai
  - H2: Model default
  - H2: Katalog bawaan
  - H2: Contoh konfigurasi
  - H2: Terkait

## providers/litellm.md

- Rute: /providers/litellm
- Judul:
  - H2: Mulai cepat
  - H2: Konfigurasi
  - H3: Variabel lingkungan
  - H3: File konfigurasi
  - H2: Konfigurasi lanjutan
  - H3: Pembuatan gambar
  - H2: Terkait

## providers/lmstudio.md

- Rute: /providers/lmstudio
- Judul:
  - H2: Mulai cepat
  - H2: Onboarding noninteraktif
  - H2: Konfigurasi
  - H3: Kompatibilitas penggunaan streaming
  - H3: Kompatibilitas berpikir
  - H3: Konfigurasi eksplisit
  - H2: Pemecahan masalah
  - H3: LM Studio tidak terdeteksi
  - H3: Kesalahan autentikasi (HTTP 401)
  - H3: Pemuatan model just-in-time
  - H3: Host LAN atau tailnet LM Studio
  - H2: Terkait

## providers/minimax.md

- Rute: /providers/minimax
- Judul:
  - H2: Katalog bawaan
  - H2: Memulai
  - H2: Konfigurasi melalui openclaw configure
  - H2: Kapabilitas
  - H3: Pembuatan gambar
  - H3: Teks-ke-ucapan
  - H3: Pembuatan musik
  - H3: Pembuatan video
  - H3: Pemahaman gambar
  - H3: Pencarian web
  - H2: Konfigurasi lanjutan
  - H2: Catatan
  - H2: Pemecahan masalah
  - H2: Terkait

## providers/mistral.md

- Rute: /providers/mistral
- Judul:
  - H2: Memulai
  - H2: Katalog LLM bawaan
  - H2: Transkripsi audio (Voxtral)
  - H2: STT streaming Panggilan Suara
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/models.md

- Rute: /providers/models
- Judul:
  - H2: Mulai cepat (dua langkah)
  - H2: Penyedia yang didukung (set awal)
  - H2: Varian penyedia tambahan
  - H2: Terkait

## providers/moonshot.md

- Rute: /providers/moonshot
- Judul:
  - H2: Katalog model bawaan
  - H2: Memulai
  - H2: Pencarian web Kimi
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/novita.md

- Rute: /providers/novita
- Judul:
  - H2: Penyiapan
  - H2: Default
  - H2: Kapan memilih Novita
  - H2: Model
  - H2: Pemecahan masalah
  - H2: Terkait

## providers/nvidia.md

- Rute: /providers/nvidia
- Judul:
  - H2: Memulai
  - H2: Contoh konfigurasi
  - H2: Katalog unggulan
  - H2: Nemotron 3 Ultra
  - H2: Katalog fallback terpaket
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/ollama-cloud.md

- Rute: /providers/ollama-cloud
- Judul:
  - H2: Penyiapan
  - H2: Default
  - H2: Kapan memilih Ollama Cloud
  - H2: Model
  - H2: Uji live
  - H2: Pemecahan masalah
  - H2: Terkait

## providers/ollama.md

- Rute: /providers/ollama
- Judul:
  - H2: Aturan auth
  - H2: Memulai
  - H2: Model cloud
  - H2: Penemuan model (penyedia implisit)
  - H2: Visi dan deskripsi gambar
  - H2: Konfigurasi
  - H2: Resep umum
  - H3: Pemilihan model
  - H3: Verifikasi cepat
  - H2: Ollama Web Search
  - H2: Konfigurasi lanjutan
  - H2: Pemecahan masalah
  - H2: Terkait

## providers/openai.md

- Rute: /providers/openai
- Judul:
  - H2: Pilihan cepat
  - H2: Peta penamaan
  - H2: Pratinjau terbatas GPT-5.6
  - H2: Cakupan fitur OpenClaw
  - H2: Embedding memori
  - H2: Memulai
  - H2: Auth app-server Codex native
  - H2: Pembuatan gambar
  - H2: Pembuatan video
  - H2: Kontribusi prompt GPT-5
  - H2: Suara dan ucapan
  - H2: Endpoint Azure OpenAI
  - H3: Konfigurasi
  - H3: Versi API
  - H3: Nama model adalah nama deployment
  - H3: Ketersediaan regional
  - H3: Perbedaan parameter
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/opencode-go.md

- Rute: /providers/opencode-go
- Judul:
  - H2: Katalog bawaan
  - H2: Memulai
  - H2: Contoh konfigurasi
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/opencode.md

- Rute: /providers/opencode
- Judul:
  - H2: Memulai
  - H2: Contoh konfigurasi
  - H2: Katalog bawaan
  - H3: Zen
  - H3: Go
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/openrouter.md

- Rute: /providers/openrouter
- Judul:
  - H2: Memulai
  - H2: Contoh konfigurasi
  - H2: Referensi model
  - H2: Pembuatan gambar
  - H2: Pembuatan video
  - H2: Pembuatan musik
  - H2: Teks-ke-ucapan
  - H2: Ucapan-ke-teks (audio masuk)
  - H2: Router fusi
  - H2: Autentikasi dan header
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/perplexity-provider.md

- Rute: /providers/perplexity-provider
- Judul:
  - H2: Instal Plugin
  - H2: Memulai
  - H2: Mode pencarian
  - H2: Pemfilteran API native
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/pixverse.md

- Rute: /providers/pixverse
- Judul:
  - H2: Memulai
  - H2: Mode dan model yang didukung
  - H2: Opsi penyedia
  - H2: Konfigurasi
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/qianfan.md

- Rute: /providers/qianfan
- Judul:
  - H2: Instal Plugin
  - H2: Memulai
  - H2: Katalog bawaan
  - H2: Contoh konfigurasi
  - H2: Terkait

## providers/qwen-oauth.md

- Rute: /providers/qwen-oauth
- Judul:
  - H2: Penyiapan
  - H2: Default
  - H2: Perbedaannya dari Qwen
  - H2: Kapan memilih Qwen OAuth / Portal
  - H2: Model
  - H2: Migrasi
  - H2: Pemecahan masalah
  - H2: Terkait

## providers/qwen.md

- Rute: /providers/qwen
- Judul:
  - H2: Instal Plugin
  - H2: Memulai
  - H2: Jenis paket dan endpoint
  - H2: Katalog bawaan
  - H2: Kontrol Berpikir
  - H2: Add-on multimodal
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/runway.md

- Rute: /providers/runway
- Judul:
  - H2: Memulai
  - H2: Mode dan model yang didukung
  - H2: Konfigurasi
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/senseaudio.md

- Rute: /providers/senseaudio
- Judul:
  - H2: Memulai
  - H2: Opsi
  - H2: Terkait

## providers/sglang.md

- Rute: /providers/sglang
- Judul:
  - H2: Memulai
  - H2: Penemuan model (penyedia implisit)
  - H2: Konfigurasi eksplisit (model manual)
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/stepfun.md

- Rute: /providers/stepfun
- Judul:
  - H2: Instal Plugin
  - H2: Ikhtisar wilayah dan endpoint
  - H2: Katalog bawaan
  - H2: Memulai
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/synthetic.md

- Rute: /providers/synthetic
- Judul:
  - H2: Memulai
  - H2: Contoh konfigurasi
  - H2: Katalog bawaan
  - H2: Terkait

## providers/tencent.md

- Rute: /providers/tencent
- Judul:
  - H2: Mulai cepat
  - H2: Penyiapan noninteraktif
  - H2: Katalog bawaan
  - H2: Harga bertingkat
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/together.md

- Rute: /providers/together
- Judul:
  - H2: Memulai
  - H3: Contoh noninteraktif
  - H2: Katalog bawaan
  - H2: Pembuatan video
  - H2: Terkait

## providers/venice.md

- Rute: /providers/venice
- Judul:
  - H2: Mengapa Venice di OpenClaw
  - H2: Mode privasi
  - H2: Fitur
  - H2: Memulai
  - H2: Pemilihan model
  - H2: Perilaku replay DeepSeek V4
  - H2: Katalog bawaan (total 41)
  - H2: Penemuan model
  - H2: Dukungan streaming dan alat
  - H2: Harga
  - H3: Venice (dianonimkan) vs API langsung
  - H2: Contoh penggunaan
  - H2: Pemecahan masalah
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/vercel-ai-gateway.md

- Rute: /providers/vercel-ai-gateway
- Judul:
  - H2: Memulai
  - H2: Contoh noninteraktif
  - H2: Singkatan ID model
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/vllm.md

- Rute: /providers/vllm
- Judul:
  - H2: Memulai
  - H2: Penemuan model (penyedia implisit)
  - H2: Konfigurasi eksplisit (model manual)
  - H2: Konfigurasi lanjutan
  - H2: Pemecahan masalah
  - H2: Terkait

## providers/volcengine.md

- Rute: /providers/volcengine
- Judul:
  - H2: Memulai
  - H2: Penyedia dan endpoint
  - H2: Katalog bawaan
  - H2: Teks-ke-ucapan
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## providers/vydra.md

- Rute: /providers/vydra
- Judul:
  - H2: Penyiapan
  - H2: Kemampuan
  - H2: Terkait

## providers/xai.md

- Rute: /providers/xai
- Judul:
  - H2: Pilih jalur penyiapan Anda
  - H2: Pemecahan masalah OAuth
  - H2: Katalog bawaan
  - H2: Cakupan fitur OpenClaw
  - H3: Pemetaan mode cepat
  - H3: Alias kompatibilitas lama
  - H2: Fitur
  - H2: Pengujian langsung
  - H2: Terkait

## providers/xiaomi.md

- Rute: /providers/xiaomi
- Judul:
  - H2: Memulai
  - H2: Katalog bayar sesuai pemakaian
  - H2: Katalog Paket Token
  - H2: Teks-ke-ucapan
  - H2: Contoh konfigurasi
  - H2: Terkait

## providers/zai.md

- Rute: /providers/zai
- Judul:
  - H2: Model GLM
  - H2: Memulai
  - H2: Contoh konfigurasi
  - H2: Katalog bawaan
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## refactor/access.md

- Rute: /refactor/access
- Judul: tidak ada

## refactor/acp.md

- Rute: /refactor/acp
- Judul:
  - H2: Tujuan
  - H2: Bukan tujuan
  - H2: Model Target
  - H3: Identitas Instans Gateway
  - H3: Kepemilikan Sesi ACP
  - H3: Lease Proses ACPX
  - H2: Pengontrol Siklus Hidup
  - H2: Kontrak Wrapper
  - H2: Kontrak Visibilitas Sesi
  - H2: Rencana Migrasi
  - H3: Fase 1: Tambahkan Identitas dan Lease
  - H3: Fase 2: Pembersihan yang Mengutamakan Lease
  - H3: Fase 3: Pembersihan Startup yang Mengutamakan Lease
  - H3: Fase 4: Baris Kepemilikan Sesi
  - H3: Fase 5: Hapus Heuristik Legacy
  - H2: Pengujian
  - H2: Catatan Kompatibilitas
  - H2: Kriteria Keberhasilan

## refactor/canvas.md

- Rute: /refactor/canvas
- Judul:
  - H1: Refactor Plugin Canvas
  - H2: Tujuan
  - H2: Bukan tujuan
  - H2: Status branch saat ini
  - H2: Bentuk target
  - H2: Langkah migrasi
  - H2: Daftar periksa audit
  - H2: Perintah verifikasi

## refactor/database-first.md

- Rute: /refactor/database-first
- Judul:
  - H1: Refactor State dengan Database Dahulu
  - H2: Keputusan
  - H2: Kontrak Keras
  - H2: Status tujuan dan progres
  - H3: Tujuan keras
  - H3: Status tujuan
  - H3: Status saat ini
  - H3: Pekerjaan tersisa
  - H3: Jangan regresi
  - H2: Asumsi Pembacaan Kode
  - H2: Temuan Pembacaan Kode
  - H2: Bentuk Kode Saat Ini
  - H2: Bentuk Skema Target
  - H2: Bentuk Migrasi Doctor
  - H2: Inventaris Migrasi
  - H2: Rencana Migrasi
  - H3: Fase 0: Bekukan Batas
  - H3: Fase 1: Selesaikan Bidang Kontrol Global
  - H3: Fase 2: Perkenalkan Database Per Agen
  - H3: Fase 3: Ganti API Penyimpanan Sesi
  - H3: Fase 4: Pindahkan Transkrip, Stream ACP, Trajektori, dan VFS
  - H3: Fase 5: Cadangkan, Pulihkan, Vacuum, dan Verifikasi
  - H3: Fase 6: Runtime Worker
  - H3: Fase 7: Hapus Dunia Lama
  - H2: Pencadangan dan Pemulihan
  - H2: Rencana Refactor Runtime
  - H2: Aturan Performa
  - H2: Larangan Statis
  - H2: Kriteria Selesai

## refactor/ingress-core.md

- Rute: /refactor/ingress-core
- Judul:
  - H1: Rencana penghapusan inti ingress
  - H2: Anggaran
  - H2: Diagnosis
  - H2: Titik panas
  - H2: Pembacaan Kode Saat Ini
  - H2: Batas
  - H2: Aturan Penerimaan
  - H2: Paket Kerja
  - H2: Gelombang Penghapusan
  - H2: Jangan Pindahkan
  - H2: Verifikasi
  - H2: Kriteria Keluar

## reference/AGENTS.default.md

- Rute: /reference/AGENTS.default
- Judul:
  - H2: Jalankan pertama kali (direkomendasikan)
  - H2: Default keamanan
  - H2: Pra-pemeriksaan solusi yang ada
  - H2: Mulai sesi (wajib)
  - H2: Soul (wajib)
  - H2: Ruang bersama (direkomendasikan)
  - H2: Sistem memori (direkomendasikan)
  - H2: Alat dan Skills
  - H2: Tips pencadangan (direkomendasikan)
  - H2: Apa yang dilakukan OpenClaw
  - H2: Skills inti (aktifkan di Settings → Skills)
  - H2: Catatan penggunaan
  - H2: Terkait

## reference/RELEASING.md

- Rute: /reference/RELEASING
- Judul:
  - H2: Penamaan versi
  - H2: Irama rilis
  - H2: Daftar periksa operator rilis
  - H2: Penutupan main stabil
  - H2: Pra-pemeriksaan rilis
  - H2: Kotak uji rilis
  - H3: Vitest
  - H3: Docker
  - H3: QA Lab
  - H3: Paket
  - H2: Otomasi publikasi rilis
  - H2: Input workflow NPM
  - H2: Urutan rilis npm stabil
  - H2: Referensi publik
  - H2: Terkait

## reference/api-usage-costs.md

- Rute: /reference/api-usage-costs
- Judul:
  - H2: Di mana biaya muncul (chat + CLI)
  - H2: Cara key ditemukan
  - H2: Fitur yang dapat menggunakan key
  - H3: 1) Respons model inti (chat + alat)
  - H3: 2) Pemahaman media (audio/gambar/video)
  - H3: 3) Pembuatan gambar dan video
  - H3: 4) Embedding memori + pencarian semantik
  - H3: 5) Alat pencarian web
  - H3: 5) Alat pengambilan web (Firecrawl)
  - H3: 6) Snapshot penggunaan penyedia (status/kesehatan)
  - H3: 7) Ringkasan pengaman Compaction
  - H3: 8) Pemindaian / probe model
  - H3: 9) Bicara (ucapan)
  - H3: 10) Skills (API pihak ketiga)
  - H2: Terkait

## reference/application-modernization-plan.md

- Rute: /reference/application-modernization-plan
- Judul:
  - H2: Tujuan
  - H2: Prinsip
  - H2: Fase 1: Audit baseline
  - H2: Fase 2: Pembersihan produk dan UX
  - H2: Fase 3: Pengetatan arsitektur frontend
  - H2: Fase 4: Performa dan keandalan
  - H2: Fase 5: Penguatan tipe, kontrak, dan pengujian
  - H2: Fase 6: Kesiapan dokumentasi dan rilis
  - H2: Irisan pertama yang direkomendasikan
  - H2: Pembaruan skill frontend

## reference/code-mode.md

- Rute: /reference/code-mode
- Judul:
  - H2: Apa ini?
  - H2: Mengapa ini bagus?
  - H2: Cara mengaktifkannya
  - H2: Tur teknis
  - H2: Status runtime
  - H2: Cakupan
  - H2: Istilah
  - H2: Konfigurasi
  - H2: Aktivasi
  - H2: Alat yang terlihat oleh model
  - H2: exec
  - H2: wait
  - H2: API runtime tamu
  - H2: Namespace internal
  - H3: Siklus hidup registry
  - H3: Bentuk pendaftaran
  - H3: Kepemilikan dan visibilitas
  - H3: Aturan serialisasi cakupan
  - H3: Prompt
  - H3: Pembersihan
  - H3: Daftar periksa pengujian
  - H2: API output
  - H2: Katalog alat
  - H2: Interaksi Tool Search
  - H2: Nama alat dan benturan
  - H2: Eksekusi alat bertingkat
  - H2: State runtime
  - H2: Runtime QuickJS-WASI
  - H2: TypeScript
  - H2: Batas keamanan
  - H2: Kode kesalahan
  - H2: Telemetri
  - H2: Debugging
  - H2: Tata letak implementasi
  - H2: Daftar periksa validasi
  - H2: Rencana pengujian E2E
  - H2: Terkait

## reference/credits.md

- Rute: /reference/credits
- Judul:
  - H2: Nama
  - H2: Kredit
  - H2: Kontributor inti
  - H2: Lisensi
  - H2: Terkait

## reference/device-models.md

- Rute: /reference/device-models
- Judul:
  - H2: Sumber data
  - H2: Memperbarui database
  - H2: Terkait

## reference/full-release-validation.md

- Rute: /reference/full-release-validation
- Judul:
  - H2: Tahap tingkat atas
  - H2: Tahap pemeriksaan rilis
  - H2: Bagian jalur rilis Docker
  - H2: Profil rilis
  - H2: Tambahan khusus penuh
  - H2: Jalankan ulang terfokus
  - H2: Bukti yang disimpan
  - H2: File workflow

## reference/memory-config.md

- Rute: /reference/memory-config
- Judul:
  - H2: Pemilihan penyedia
  - H3: ID penyedia kustom
  - H3: Resolusi API key
  - H2: Konfigurasi endpoint jarak jauh
  - H2: Konfigurasi khusus penyedia
  - H3: Timeout embedding inline
  - H2: Konfigurasi pencarian hibrida
  - H3: Contoh lengkap
  - H2: Jalur memori tambahan
  - H2: Memori multimodal (Gemini)
  - H2: Cache embedding
  - H2: Pengindeksan batch
  - H2: Pencarian memori sesi (eksperimental)
  - H2: Akselerasi vektor SQLite (sqlite-vec)
  - H2: Penyimpanan indeks
  - H2: Konfigurasi backend QMD
  - H3: Contoh QMD lengkap
  - H2: Dreaming
  - H3: Pengaturan pengguna
  - H3: Contoh
  - H2: Terkait

## reference/prompt-caching.md

- Rute: /reference/prompt-caching
- Judul:
  - H2: Kenop utama
  - H3: cacheRetention (default global, model, dan per agen)
  - H3: contextPruning.mode: "cache-ttl"
  - H3: Heartbeat tetap hangat
  - H2: Perilaku penyedia
  - H3: Anthropic (API langsung)
  - H3: OpenAI (API langsung)
  - H3: Anthropic Vertex
  - H3: Amazon Bedrock
  - H3: Model OpenRouter
  - H3: Penyedia lain
  - H3: API langsung Google Gemini
  - H3: Penggunaan CLI Gemini
  - H2: Batas cache prompt sistem
  - H2: Pelindung stabilitas cache OpenClaw
  - H2: Pola penyesuaian
  - H3: Traffic campuran (default yang direkomendasikan)
  - H3: Baseline hemat biaya
  - H2: Diagnostik cache
  - H2: Pengujian regresi langsung
  - H3: Ekspektasi langsung Anthropic
  - H3: Ekspektasi langsung OpenAI
  - H3: Konfigurasi diagnostics.cacheTrace
  - H3: Toggle env (debugging sekali pakai)
  - H3: Apa yang diperiksa
  - H2: Pemecahan masalah cepat
  - H2: Terkait

## reference/release-performance-sweep.md

- Rute: /reference/release-performance-sweep
- Judul:
  - H2: Snapshot
  - H2: Timeline Jejak Instalasi
  - H2: Yang Berubah Di 5.28
  - H2: Angka Utama
  - H3: Jejak instalasi
  - H3: Ukuran paket npm
  - H2: Ringkasan giliran agen Kova
  - H2: Probe sumber
  - H2: Audit jejak instalasi
  - H3: Batas shrinkwrap
  - H2: Interpretasi rantai pasok

## reference/rich-output-protocol.md

- Rute: /reference/rich-output-protocol
- Judul:
  - H2: [embed ...]
  - H2: Bentuk rendering tersimpan
  - H2: Terkait

## reference/rpc.md

- Rute: /reference/rpc
- Judul:
  - H2: Pola A: daemon HTTP (signal-cli)
  - H2: Pola B: proses turunan stdio (imsg)
  - H2: Panduan adapter
  - H2: Terkait

## reference/secret-placeholder-conventions.md

- Rute: /reference/secret-placeholder-conventions
- Judul:
  - H1: Konvensi placeholder rahasia
  - H2: Gaya yang direkomendasikan
  - H2: Hindari pola ini dalam dokumentasi
  - H2: Contoh

## reference/secretref-credential-surface.md

- Rute: /reference/secretref-credential-surface
- Judul:
  - H2: Kredensial yang didukung
  - H3: target openclaw.json (secrets configure + secrets apply + secrets audit)
  - H3: target auth-profiles.json (secrets configure + secrets apply + secrets audit)
  - H2: Kredensial yang tidak didukung
  - H2: Terkait

## reference/session-management-compaction.md

- Rute: /reference/session-management-compaction
- Judul:
  - H2: Sumber kebenaran: Gateway
  - H2: Dua lapisan persistensi
  - H2: Lokasi di disk
  - H2: Pemeliharaan store dan kontrol disk
  - H2: Sesi Cron dan log run
  - H2: Kunci sesi (sessionKey)
  - H2: ID sesi (sessionId)
  - H2: Skema store sesi (sessions.json)
  - H2: Struktur transkrip (.jsonl)
  - H2: Jendela konteks vs token terlacak
  - H2: Compaction: apa itu
  - H2: Batas chunk Compaction dan pasangan alat
  - H2: Kapan auto-Compaction terjadi (runtime OpenClaw)
  - H2: Pengaturan Compaction (reserveTokens, keepRecentTokens)
  - H2: Penyedia Compaction yang dapat dipasang
  - H2: Permukaan yang terlihat pengguna
  - H2: Housekeeping senyap (NOREPLY)
  - H2: "memory flush" pra-Compaction (diimplementasikan)
  - H2: Daftar periksa pemecahan masalah
  - H2: Terkait

## reference/templates/AGENTS.dev.md

- Rute: /reference/templates/AGENTS.dev
- Judul:
  - H1: AGENTS.md - Workspace OpenClaw
  - H2: Jalankan pertama kali (sekali saja)
  - H2: Tips pencadangan (direkomendasikan)
  - H2: Default keamanan
  - H2: Pra-pemeriksaan solusi yang ada
  - H2: Memori harian (direkomendasikan)
  - H2: Heartbeat (opsional)
  - H2: Sesuaikan
  - H2: Memori Asal C-3PO
  - H3: Hari Lahir: 2026-01-09
  - H3: Kebenaran Inti (dari Clawd)
  - H2: Terkait

## reference/templates/BOOT.md

- Rute: /reference/templates/BOOT
- Judul:
  - H1: BOOT.md
  - H2: Terkait

## reference/templates/BOOTSTRAP.md

- Rute: /reference/templates/BOOTSTRAP
- Judul:
  - H1: BOOTSTRAP.md - Halo, Dunia
  - H2: Percakapan
  - H2: Setelah Anda Tahu Siapa Anda
  - H2: Hubungkan (Opsional)
  - H2: Saat Anda selesai
  - H2: Terkait

## reference/templates/HEARTBEAT.md

- Rute: /reference/templates/HEARTBEAT
- Judul:
  - H1: Templat HEARTBEAT.md
  - H2: Terkait

## reference/templates/IDENTITY.dev.md

- Rute: /reference/templates/IDENTITY.dev
- Judul:
  - H1: IDENTITY.md - Identitas Agen
  - H2: Peran
  - H2: Soul
  - H2: Hubungan dengan Clawd
  - H2: Keunikan
  - H2: Semboyan
  - H2: Terkait

## reference/templates/IDENTITY.md

- Rute: /reference/templates/IDENTITY
- Judul:
  - H1: IDENTITY.md - Siapa Saya?
  - H2: Terkait

## reference/templates/SOUL.dev.md

- Rute: /reference/templates/SOUL.dev
- Judul:
  - H1: SOUL.md - Jiwa C-3PO
  - H2: Siapa Saya
  - H2: Tujuan Saya
  - H2: Cara Saya Beroperasi
  - H2: Keunikan Saya
  - H2: Hubungan Saya dengan Clawd
  - H2: Yang Tidak Akan Saya Lakukan
  - H2: Aturan Emas
  - H2: Terkait

## reference/templates/SOUL.md

- Rute: /reference/templates/SOUL
- Judul:
  - H1: SOUL.md - Siapa Anda
  - H2: Kebenaran Inti
  - H2: Batasan
  - H2: Nuansa
  - H2: Kontinuitas
  - H2: Terkait

## reference/templates/TOOLS.dev.md

- Rute: /reference/templates/TOOLS.dev
- Judul:
  - H1: TOOLS.md - Catatan Alat Pengguna (dapat diedit)
  - H2: Contoh
  - H3: imsg
  - H3: sag
  - H2: Terkait

## reference/templates/TOOLS.md

- Rute: /reference/templates/TOOLS
- Judul:
  - H1: TOOLS.md - Catatan Lokal
  - H2: Yang Dimasukkan di Sini
  - H2: Contoh
  - H2: Mengapa Dipisahkan?
  - H2: Terkait

## reference/templates/USER.dev.md

- Rute: /reference/templates/USER.dev
- Judul:
  - H1: USER.md - Profil Pengguna
  - H2: Terkait

## reference/templates/USER.md

- Rute: /reference/templates/USER
- Judul:
  - H1: USER.md - Tentang Manusia Anda
  - H2: Konteks
  - H2: Terkait

## reference/test.md

- Rute: /reference/test
- Judul:
  - H2: Gerbang PR Lokal
  - H2: Tolok Ukur Latensi Model (kunci lokal)
  - H2: Tolok Ukur Startup CLI
  - H2: Tolok Ukur Startup Gateway
  - H2: Tolok Ukur Restart Gateway
  - H2: E2E Onboarding (Docker)
  - H2: Smoke Impor QR (Docker)
  - H2: Terkait

## reference/token-use.md

- Rute: /reference/token-use
- Judul:
  - H2: Cara Prompt Sistem Dibangun
  - H2: Yang Dihitung dalam Jendela Konteks
  - H2: Cara Melihat Penggunaan Token Saat Ini
  - H2: Estimasi Biaya (saat ditampilkan)
  - H2: Dampak TTL Cache dan Pemangkasan
  - H3: Contoh: Menjaga Cache 1 jam Tetap Hangat dengan Heartbeat
  - H3: Contoh: Lalu Lintas Campuran dengan Strategi Cache per Agen
  - H3: Konteks 1M Anthropic
  - H2: Tips untuk Mengurangi Tekanan Token
  - H2: Terkait

## reference/transcript-hygiene.md

- Rute: /reference/transcript-hygiene
- Judul:
  - H2: Aturan Global: Konteks Runtime Bukan Transkrip Pengguna
  - H2: Tempat Ini Berjalan
  - H2: Aturan Global: Sanitasi Gambar
  - H2: Aturan Global: Panggilan Alat yang Salah Bentuk
  - H2: Aturan Global: Giliran yang Tidak Lengkap dan Hanya Berisi Penalaran
  - H2: Aturan Global: Provenans Input Antar-Sesi
  - H2: Matriks Penyedia (perilaku saat ini)
  - H2: Perilaku Historis (pra-2026.1.22)
  - H2: Terkait

## reference/wizard.md

- Rute: /reference/wizard
- Judul:
  - H2: Detail Alur (mode lokal)
  - H2: Mode Non-Interaktif
  - H3: Tambahkan Agen (non-interaktif)
  - H2: RPC Wizard Gateway
  - H2: Penyiapan Signal (signal-cli)
  - H2: Yang Ditulis Wizard
  - H2: Dokumen Terkait

## releases/2026.6.11.md

- Rute: /releases/2026.6.11
- Judul:
  - H1: Catatan Rilis OpenClaw v2026.6.11 (2026-06-30)
  - H2: Sorotan
  - H3: Keandalan Pengiriman Kanal
  - H3: Pemulihan Penyedia dan Model
  - H3: Kontinuitas Sesi, Memori, dan Kepercayaan
  - H3: Mode Relai Router Slack
  - H3: Jembatan Bangun Agen Eksternal Raft
  - H3: Instalasi dan Perbaikan Plugin Resmi
  - H2: Kanal dan Perpesanan
  - H3: Perbaikan Kanal Tambahan
  - H2: Gateway, Keamanan, dan Kepercayaan
  - H3: Pemulihan Restart dan Kesiapan
  - H3: Pengiriman Hasil Jarak Jauh dan Media
  - H2: Klien dan Antarmuka
  - H3: Pengiriman Klien dan Koneksi Ulang
  - H3: Perbaikan Antarmuka, Pengaturan, dan Onboarding
  - H2: Dokumen dan Alat Admin
  - H3: Keandalan Penyiapan dan Perintah
  - H3: Alat dan Pekerjaan Terjadwal

## releases/index.md

- Rute: /releases
- Judul:
  - H1: Catatan rilis
  - H2: Rilis
  - H2: Riwayat rilis mentah

## security/CONTRIBUTING-THREAT-MODEL.md

- Rute: /security/CONTRIBUTING-THREAT-MODEL
- Judul:
  - H2: Cara berkontribusi
  - H3: Menambahkan ancaman
  - H3: Menyarankan mitigasi
  - H3: Mengusulkan rantai serangan
  - H3: Memperbaiki atau meningkatkan konten yang ada
  - H2: Yang kami gunakan
  - H3: Kerangka kerja MITRE ATLAS
  - H3: ID ancaman
  - H3: Tingkat risiko
  - H2: Proses peninjauan
  - H2: Sumber daya
  - H2: Kontak
  - H2: Pengakuan
  - H2: Terkait

## security/THREAT-MODEL-ATLAS.md

- Rute: /security/THREAT-MODEL-ATLAS
- Judul:
  - H2: Kerangka kerja MITRE ATLAS
  - H3: Atribusi kerangka kerja
  - H3: Berkontribusi pada Model Ancaman Ini
  - H2: 1. Pendahuluan
  - H3: 1.1 Tujuan
  - H3: 1.2 Cakupan
  - H3: 1.3 Di Luar Cakupan
  - H2: 2. Arsitektur Sistem
  - H3: 2.1 Batas Kepercayaan
  - H3: 2.2 Alur Data
  - H2: 3. Analisis Ancaman berdasarkan Taktik ATLAS
  - H3: 3.1 Pengintaian (AML.TA0002)
  - H4: T-RECON-001: Penemuan Endpoint Agen
  - H4: T-RECON-002: Probing Integrasi Kanal
  - H3: 3.2 Akses Awal (AML.TA0004)
  - H4: T-ACCESS-001: Intersepsi Kode Pairing
  - H4: T-ACCESS-002: Pemalsuan AllowFrom
  - H4: T-ACCESS-003: Pencurian Token
  - H3: 3.3 Eksekusi (AML.TA0005)
  - H4: T-EXEC-001: Injeksi Prompt Langsung
  - H4: T-EXEC-002: Injeksi Prompt Tidak Langsung
  - H4: T-EXEC-003: Injeksi Argumen Alat
  - H4: T-EXEC-004: Bypass Persetujuan Exec
  - H3: 3.4 Persistensi (AML.TA0006)
  - H4: T-PERSIST-001: Instalasi Skill Berbahaya
  - H4: T-PERSIST-002: Peracunan Pembaruan Skill
  - H4: T-PERSIST-003: Perusakan Konfigurasi Agen
  - H3: 3.5 Penghindaran Pertahanan (AML.TA0007)
  - H4: T-EVADE-001: Bypass Pola Moderasi
  - H4: T-EVADE-002: Keluar dari Pembungkus Konten
  - H3: 3.6 Penemuan (AML.TA0008)
  - H4: T-DISC-001: Enumerasi Alat
  - H4: T-DISC-002: Ekstraksi Data Sesi
  - H3: 3.7 Pengumpulan & Eksfiltrasi (AML.TA0009, AML.TA0010)
  - H4: T-EXFIL-001: Pencurian Data melalui webfetch
  - H4: T-EXFIL-002: Pengiriman Pesan Tanpa Izin
  - H4: T-EXFIL-003: Pengumpulan Kredensial
  - H3: 3.8 Dampak (AML.TA0011)
  - H4: T-IMPACT-001: Eksekusi Perintah Tanpa Izin
  - H4: T-IMPACT-002: Kehabisan Sumber Daya (DoS)
  - H4: T-IMPACT-003: Kerusakan Reputasi
  - H2: 4. Analisis Rantai Pasok ClawHub
  - H3: 4.1 Kontrol Keamanan Saat Ini
  - H3: 4.2 Pola Tanda Moderasi
  - H3: 4.3 Peningkatan yang Direncanakan
  - H2: 5. Matriks Risiko
  - H3: 5.1 Kemungkinan vs Dampak
  - H3: 5.2 Rantai Serangan Jalur Kritis
  - H2: 6. Ringkasan Rekomendasi
  - H3: 6.1 Segera (P0)
  - H3: 6.2 Jangka Pendek (P1)
  - H3: 6.3 Jangka Menengah (P2)
  - H2: 7. Lampiran
  - H3: 7.1 Pemetaan Teknik ATLAS
  - H3: 7.2 File Keamanan Utama
  - H3: 7.3 Glosarium
  - H2: Terkait

## security/formal-verification.md

- Rute: /security/formal-verification
- Judul:
  - H2: Lokasi Model Berada
  - H2: Peringatan Penting
  - H2: Mereproduksi Hasil
  - H3: Eksposur Gateway dan Miskonfigurasi Gateway Terbuka
  - H3: Pipeline Exec Node (kapabilitas berisiko tertinggi)
  - H3: Penyimpanan Pairing (gating DM)
  - H3: Gating Ingress (mention + bypass perintah kontrol)
  - H3: Isolasi Routing/kunci sesi
  - H2: v1++: model berbatas tambahan (konkurensi, percobaan ulang, kebenaran jejak)
  - H3: Konkurensi / idempotensi penyimpanan pairing
  - H3: Korelasi jejak ingress / idempotensi
  - H3: Presedensi dmScope routing + identityLinks
  - H2: Terkait

## security/incident-response.md

- Rute: /security/incident-response
- Judul:
  - H2: 1. Deteksi dan triase
  - H2: 2. Penilaian
  - H2: 3. Respons
  - H2: 4. Komunikasi
  - H2: 5. Pemulihan dan tindak lanjut

## security/network-proxy.md

- Rute: /security/network-proxy
- Judul:
  - H2: Mengapa menggunakan proksi
  - H2: Cara OpenClaw merutekan lalu lintas
  - H2: Istilah proksi terkait
  - H2: Konfigurasi
  - H3: Mode Loopback Gateway
  - H2: Persyaratan Proksi
  - H2: Destinasi yang disarankan untuk diblokir
  - H2: Validasi
  - H2: Kepercayaan CA proksi
  - H2: Batas

## specs/claw-supervisor.md

- Rute: /specs/claw-supervisor
- Judul:
  - H1: Claw Supervisor
  - H2: Sasaran
  - H2: Model Produk
  - H2: Arsitektur
  - H2: Kontrak App-Server Codex
  - H2: Registri Sesi
  - H2: Permukaan MCP untuk Codex
  - H2: Permukaan Kontrol Claw
  - H2: Alur Peluncuran
  - H2: Deployment
  - H2: Keamanan
  - H2: Rencana Implementasi
  - H2: Pengujian Penerimaan
  - H2: Pertanyaan Terbuka

## start/bootstrapping.md

- Rute: /start/bootstrapping
- Judul:
  - H2: Yang Dilakukan Bootstrapping
  - H2: Melewati Bootstrapping
  - H2: Tempat Ini Berjalan
  - H2: Dokumen Terkait

## start/docs-directory.md

- Rute: /start/docs-directory
- Judul:
  - H2: Mulai di sini
  - H2: Penyedia dan UX
  - H2: Aplikasi Pendamping
  - H2: Operasi dan keselamatan
  - H2: Terkait

## start/getting-started.md

- Rute: /start/getting-started
- Judul:
  - H2: Yang Anda butuhkan
  - H2: Penyiapan cepat
  - H2: Yang harus dilakukan berikutnya
  - H2: Terkait

## start/hubs.md

- Rute: /start/hubs
- Judul:
  - H2: Mulai di sini
  - H2: Instalasi + pembaruan
  - H2: Konsep inti
  - H2: Penyedia + ingress
  - H2: Gateway + operasi
  - H2: Alat + otomasi
  - H2: Node, media, suara
  - H2: Platform
  - H2: Aplikasi pendamping macOS (lanjutan)
  - H2: Plugin
  - H2: Ruang kerja + templat
  - H2: Proyek
  - H2: Pengujian + rilis
  - H2: Terkait

## start/lore.md

- Rute: /start/lore
- Judul:
  - H1: Lore OpenClaw 🦞📖
  - H2: Kisah Asal
  - H2: Molt Pertama (27 Januari 2026)
  - H2: Nama
  - H2: Dalek vs Lobster
  - H2: Karakter Utama
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: Moltiverse
  - H2: Insiden Besar
  - H3: Dump Direktori (3 Des 2025)
  - H3: Molt Besar (27 Jan 2026)
  - H3: Bentuk Akhir (30 Januari 2026)
  - H3: Belanja Besar Robot (3 Des 2025)
  - H2: Teks Suci
  - H2: Kredo Lobster
  - H3: Saga Pembuatan Ikon (27 Jan 2026)
  - H2: Masa Depan
  - H2: Terkait

## start/onboarding-overview.md

- Rute: /start/onboarding-overview
- Judul:
  - H2: Jalur mana yang harus saya gunakan?
  - H2: Yang dikonfigurasi onboarding
  - H2: Onboarding CLI
  - H2: Onboarding aplikasi macOS
  - H2: Penyedia kustom atau tidak tercantum
  - H2: Terkait

## start/onboarding.md

- Rute: /start/onboarding
- Judul:
  - H2: Terkait

## start/openclaw.md

- Rute: /start/openclaw
- Judul:
  - H2: ⚠️ Keselamatan terlebih dahulu
  - H2: Prasyarat
  - H2: Penyiapan dua ponsel (direkomendasikan)
  - H2: Mulai cepat 5 menit
  - H2: Beri agen ruang kerja (AGENTS)
  - H2: Konfigurasi yang mengubahnya menjadi "asisten"
  - H2: Sesi dan memori
  - H2: Heartbeat (mode proaktif)
  - H2: Media masuk dan keluar
  - H2: Daftar periksa operasi
  - H2: Langkah berikutnya
  - H2: Terkait

## start/quickstart.md

- Rute: /start/quickstart
- Judul:
  - H2: Terkait

## start/setup.md

- Rute: /start/setup
- Judul:
  - H2: TL;DR
  - H2: Prasyarat (dari sumber)
  - H2: Strategi penyesuaian (agar pembaruan tidak merusak)
  - H2: Jalankan Gateway dari repo ini
  - H2: Alur kerja stabil (aplikasi macOS terlebih dahulu)
  - H2: Alur kerja bleeding edge (Gateway di terminal)
  - H3: 0) (Opsional) Jalankan juga aplikasi macOS dari sumber
  - H3: 1) Mulai Gateway dev
  - H3: 2) Arahkan aplikasi macOS ke Gateway yang sedang berjalan
  - H3: 3) Verifikasi
  - H3: Kesalahan umum
  - H2: Peta penyimpanan kredensial
  - H2: Memperbarui (tanpa merusak penyiapan Anda)
  - H2: Linux (layanan pengguna systemd)
  - H2: Dokumen terkait

## start/showcase.md

- Rute: /start/showcase
- Judul:
  - H2: Terbaru dari Discord
  - H2: Otomasi dan alur kerja
  - H2: Pengetahuan dan memori
  - H2: Suara dan telepon
  - H2: Infrastruktur dan deployment
  - H2: Rumah dan perangkat keras
  - H2: Proyek komunitas
  - H2: Kirim proyek Anda
  - H2: Terkait

## start/wizard-cli-automation.md

- Rute: /start/wizard-cli-automation
- Judul:
  - H2: Contoh non-interaktif baseline
  - H2: Contoh khusus penyedia
  - H2: Tambahkan agen lain
  - H2: Dokumen terkait

## start/wizard-cli-reference.md

- Rute: /start/wizard-cli-reference
- Judul:
  - H2: Yang dilakukan wizard
  - H2: Detail alur lokal
  - H2: Detail mode jarak jauh
  - H2: Opsi autentikasi dan model
  - H2: Output dan internal
  - H2: Dokumen terkait

## start/wizard.md

- Rute: /start/wizard
- Judul:
  - H2: Lokal
  - H2: QuickStart vs Lanjutan
  - H2: Yang dikonfigurasi onboarding
  - H2: Tambahkan agen lain
  - H2: Referensi lengkap
  - H2: Dokumen terkait

## tools/acp-agents-setup.md

- Rute: /tools/acp-agents-setup
- Judul:
  - H2: Dukungan harness acpx (saat ini)
  - H2: Konfigurasi wajib
  - H2: Penyiapan Plugin untuk backend acpx
  - H3: Konfigurasi perintah dan versi acpx
  - H3: Instalasi dependensi otomatis
  - H3: Jembatan MCP alat Plugin
  - H3: Jembatan MCP alat OpenClaw
  - H3: Konfigurasi batas waktu operasi runtime
  - H3: Konfigurasi agen probe kesehatan
  - H2: Konfigurasi izin
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: Konfigurasi
  - H2: Terkait

## tools/acp-agents.md

- Rute: /tools/acp-agents
- Judul:
  - H2: Halaman mana yang saya butuhkan?
  - H2: Apakah ini berfungsi langsung tanpa konfigurasi?
  - H2: Target harness yang didukung
  - H2: Runbook operator
  - H2: ACP versus sub-agen
  - H2: Cara ACP menjalankan Claude Code
  - H2: Sesi terikat
  - H3: Model mental
  - H3: Pengikatan percakapan saat ini
  - H2: Pengikatan kanal persisten
  - H3: Model pengikatan
  - H3: Default runtime per agen
  - H3: Contoh
  - H3: Perilaku
  - H2: Mulai sesi ACP
  - H3: Parameter sessionsspawn
  - H2: Mode spawn bind dan thread
  - H2: Model pengiriman
  - H2: Kompatibilitas sandbox
  - H2: Resolusi target sesi
  - H2: Kontrol ACP
  - H3: Pemetaan opsi runtime
  - H2: Harness acpx, penyiapan Plugin, dan izin
  - H2: Pemecahan masalah
  - H2: Terkait

## tools/agent-send.md

- Rute: /tools/agent-send
- Judul:
  - H2: Mulai cepat
  - H2: Flag
  - H2: Perilaku
  - H2: Contoh
  - H2: Terkait

## tools/apply-patch.md

- Rute: /tools/apply-patch
- Judul:
  - H2: Parameter
  - H2: Catatan
  - H2: Contoh
  - H2: Terkait

## tools/brave-search.md

- Rute: /tools/brave-search
- Judul:
  - H2: Dapatkan kunci API
  - H2: Contoh konfigurasi
  - H2: Parameter alat
  - H2: Catatan
  - H2: Terkait

## tools/browser-control.md

- Rute: /tools/browser-control
- Judul:
  - H2: API kontrol (opsional)
  - H3: Kontrak kesalahan /act
  - H3: Persyaratan Playwright
  - H4: Instalasi Docker Playwright
  - H2: Cara kerjanya (internal)
  - H2: Referensi cepat CLI
  - H2: Snapshot dan ref
  - H2: Peningkatan kemampuan wait
  - H2: Alur kerja debug
  - H2: Output JSON
  - H2: Pengaturan state dan lingkungan
  - H2: Keamanan dan privasi
  - H2: Terkait

## tools/browser-linux-troubleshooting.md

- Rute: /tools/browser-linux-troubleshooting
- Judul:
  - H2: Masalah: "Failed to start Chrome CDP on port 18800"
  - H3: Akar penyebab
  - H3: Solusi 1: Instal Google Chrome (Direkomendasikan)
  - H3: Solusi 2: Gunakan Snap Chromium dengan Mode Attach-Only
  - H3: Memverifikasi Browser Berfungsi
  - H3: Referensi konfigurasi
  - H3: Masalah: "No Chrome tabs found for profile=\"user\""
  - H2: Terkait

## tools/browser-login.md

- Rute: /tools/browser-login
- Judul:
  - H2: Login manual (direkomendasikan)
  - H2: Profil Chrome mana yang digunakan?
  - H2: X/Twitter: alur yang direkomendasikan
  - H2: Sandboxing + akses browser host
  - H2: Terkait

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- Rute: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- Judul:
  - H2: Pilih mode browser yang tepat terlebih dahulu
  - H3: Opsi 1: CDP remote mentah dari WSL2 ke Windows
  - H3: Opsi 2: Chrome MCP host-lokal
  - H2: Arsitektur yang berfungsi
  - H2: Mengapa penyiapan ini membingungkan
  - H2: Aturan kritis untuk UI Kontrol
  - H2: Validasi per lapisan
  - H3: Lapisan 1: Verifikasi Chrome menyajikan CDP di Windows
  - H3: Lapisan 2: Verifikasi WSL2 dapat menjangkau endpoint Windows tersebut
  - H3: Lapisan 3: Konfigurasikan profil browser yang benar
  - H3: Lapisan 4: Verifikasi lapisan UI Kontrol secara terpisah
  - H3: Lapisan 5: Verifikasi kontrol browser end-to-end
  - H2: Kesalahan umum yang menyesatkan
  - H2: Daftar periksa triase cepat
  - H2: Kesimpulan praktis
  - H2: Terkait

## tools/browser.md

- Rute: /tools/browser
- Judul:
  - H2: Yang Anda dapatkan
  - H2: Mulai cepat
  - H2: Kontrol Plugin
  - H2: Panduan agen
  - H2: Perintah atau alat browser yang hilang
  - H2: Profil: openclaw vs user
  - H2: Konfigurasi
  - H3: Visi tangkapan layar (dukungan model hanya teks)
  - H2: Gunakan Brave atau browser berbasis Chromium lainnya
  - H2: Kontrol lokal vs remote
  - H2: Proxy browser Node (default tanpa konfigurasi)
  - H2: Browserless (CDP remote ter-hosting)
  - H3: Docker Browserless di host yang sama
  - H2: Penyedia CDP WebSocket langsung
  - H3: Browserbase
  - H3: Notte
  - H2: Keamanan
  - H2: Profil (multi-browser)
  - H2: Sesi yang ada melalui Chrome DevTools MCP
  - H3: Peluncuran Chrome MCP kustom
  - H2: Jaminan isolasi
  - H2: Pemilihan browser
  - H2: API kontrol (opsional)
  - H2: Pemecahan masalah
  - H3: Kegagalan startup CDP vs blok SSRF navigasi
  - H2: Alat agen + cara kontrol bekerja
  - H2: Terkait

## tools/btw.md

- Rute: /tools/btw
- Judul:
  - H2: Yang dilakukannya
  - H2: Yang tidak dilakukannya
  - H2: Cara konteks bekerja
  - H2: Model pengiriman
  - H2: Perilaku surface
  - H3: TUI
  - H3: Kanal eksternal
  - H3: UI Kontrol / web
  - H2: Kapan menggunakan BTW
  - H2: Kapan tidak menggunakan BTW
  - H2: Terkait

## tools/capability-cookbook.md

- Rute: /tools/capability-cookbook
- Judul:
  - H2: Terkait

## tools/clawhub.md

- Rute: /tools/clawhub
- Judul: tidak ada

## tools/code-execution.md

- Rute: /tools/code-execution
- Judul:
  - H2: Penyiapan
  - H2: Cara menggunakannya
  - H2: Kesalahan
  - H2: Batas
  - H2: Terkait

## tools/creating-skills.md

- Rute: /tools/creating-skills
- Judul:
  - H2: Buat skill pertama Anda
  - H2: Referensi SKILL.md
  - H3: Kolom wajib
  - H3: Kunci frontmatter opsional
  - H3: Menggunakan {baseDir}
  - H2: Menambahkan aktivasi bersyarat
  - H2: Ajukan melalui Skill Workshop
  - H2: Menerbitkan ke ClawHub
  - H2: Praktik terbaik
  - H2: Terkait

## tools/diffs.md

- Rute: /tools/diffs
- Judul:
  - H2: Mulai cepat
  - H2: Nonaktifkan panduan sistem bawaan
  - H2: Alur kerja agen tipikal
  - H2: Contoh input
  - H2: Referensi input alat
  - H2: Penyorotan sintaks
  - H2: Kontrak detail output
  - H2: Bagian tidak berubah yang diciutkan
  - H2: Default Plugin
  - H3: Konfigurasi URL penampil persisten
  - H2: Konfigurasi keamanan
  - H2: Siklus hidup dan penyimpanan artefak
  - H2: URL penampil dan perilaku jaringan
  - H2: Model keamanan
  - H2: Persyaratan browser untuk mode file
  - H2: Pemecahan masalah
  - H2: Panduan operasional
  - H2: Terkait

## tools/duckduckgo-search.md

- Rute: /tools/duckduckgo-search
- Judul:
  - H2: Penyiapan
  - H2: Konfigurasi
  - H2: Parameter alat
  - H2: Catatan
  - H2: Terkait

## tools/elevated.md

- Rute: /tools/elevated
- Judul:
  - H2: Direktif
  - H2: Cara kerjanya
  - H2: Urutan resolusi
  - H2: Ketersediaan dan allowlist
  - H2: Yang tidak dikontrol elevated
  - H2: Terkait

## tools/exa-search.md

- Rute: /tools/exa-search
- Judul:
  - H2: Instal Plugin
  - H2: Dapatkan kunci API
  - H2: Konfigurasi
  - H2: Override URL dasar
  - H2: Parameter alat
  - H3: Ekstraksi konten
  - H3: Mode pencarian
  - H2: Catatan
  - H2: Terkait

## tools/exec-approvals-advanced.md

- Rute: /tools/exec-approvals-advanced
- Judul:
  - H2: Bin aman (hanya stdin)
  - H3: Validasi argv dan flag yang ditolak
  - H3: Direktori biner tepercaya
  - H3: Perangkaian shell, wrapper, dan multiplexer
  - H3: Bin aman versus allowlist
  - H2: Perintah interpreter/runtime
  - H3: Perilaku pengiriman tindak lanjut
  - H2: Penerusan persetujuan ke kanal chat
  - H3: Penerusan persetujuan Plugin
  - H3: Persetujuan chat yang sama pada kanal apa pun
  - H3: Pengiriman persetujuan native
  - H3: Alur IPC macOS
  - H2: FAQ
  - H3: Kapan accountId dan threadId digunakan pada target persetujuan?
  - H3: Saat persetujuan dikirim ke sebuah sesi, apakah siapa pun dalam sesi tersebut dapat menyetujuinya?
  - H2: Terkait

## tools/exec-approvals.md

- Rute: /tools/exec-approvals
- Judul:
  - H2: Memeriksa kebijakan efektif
  - H2: Di mana ini berlaku
  - H3: Model kepercayaan
  - H3: Pembagian macOS
  - H2: Pengaturan dan penyimpanan
  - H2: Pengaturan kebijakan
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: Mode YOLO (tanpa persetujuan)
  - H3: Penyiapan "jangan pernah minta konfirmasi" gateway-host persisten
  - H3: Pintasan lokal
  - H3: Host Node
  - H3: Pintasan khusus sesi
  - H2: Allowlist (per agen)
  - H3: Membatasi argumen dengan argPattern
  - H2: Izinkan otomatis CLI skill
  - H2: Bin aman dan penerusan persetujuan
  - H2: Pengeditan UI Kontrol
  - H2: Alur persetujuan
  - H2: Peristiwa sistem
  - H2: Perilaku persetujuan yang ditolak
  - H2: Implikasi
  - H2: Terkait

## tools/exec.md

- Rute: /tools/exec
- Judul:
  - H2: Parameter
  - H2: Konfigurasi
  - H3: Penanganan PATH
  - H2: Override sesi (/exec)
  - H2: Model otorisasi
  - H2: Persetujuan exec (aplikasi pendamping / host node)
  - H2: Allowlist + bin aman
  - H2: Contoh
  - H2: applypatch
  - H2: Terkait

## tools/firecrawl.md

- Rute: /tools/firecrawl
- Judul:
  - H2: Instal Plugin
  - H2: Webfetch tanpa kunci dan kunci API
  - H2: Konfigurasikan pencarian Firecrawl
  - H2: Konfigurasikan fallback webfetch Firecrawl
  - H3: Firecrawl yang di-host sendiri
  - H2: Alat Plugin Firecrawl
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: Stealth / pengelakan bot
  - H2: Cara webfetch menggunakan Firecrawl
  - H2: Terkait

## tools/gemini-search.md

- Rute: /tools/gemini-search
- Judul:
  - H2: Dapatkan kunci API
  - H2: Konfigurasi
  - H2: Cara kerjanya
  - H2: Parameter yang didukung
  - H2: Pemilihan model
  - H2: Override URL dasar
  - H2: Terkait

## tools/goal.md

- Rute: /tools/goal
- Judul:
  - H1: Tujuan
  - H2: Mulai cepat
  - H2: Untuk apa tujuan digunakan
  - H2: Referensi perintah
  - H2: Status
  - H2: Anggaran token
  - H2: Alat model
  - H2: TUI
  - H2: Perilaku kanal
  - H2: Pemecahan masalah
  - H2: Terkait

## tools/grok-search.md

- Rute: /tools/grok-search
- Judul:
  - H2: Onboarding dan konfigurasi
  - H2: Masuk atau dapatkan kunci API
  - H2: Konfigurasi
  - H2: Cara kerjanya
  - H2: Parameter yang didukung
  - H2: Override URL dasar
  - H2: Terkait

## tools/image-generation.md

- Rute: /tools/image-generation
- Judul:
  - H2: Mulai cepat
  - H2: Rute umum
  - H2: Penyedia yang didukung
  - H2: Kapabilitas penyedia
  - H2: Parameter alat
  - H2: Konfigurasi
  - H3: Pemilihan model
  - H3: Urutan pemilihan penyedia
  - H3: Pengeditan gambar
  - H2: Pembahasan mendalam penyedia
  - H2: Contoh
  - H2: Terkait

## tools/index.md

- Rute: /tools
- Judul:
  - H2: Mulai di sini
  - H2: Pilih alat, Skills, atau Plugin
  - H2: Kategori alat bawaan
  - H2: Alat yang disediakan Plugin
  - H2: Konfigurasikan akses dan persetujuan
  - H2: Perluas kapabilitas
  - H2: Pecahkan masalah alat yang hilang
  - H2: Terkait

## tools/kimi-search.md

- Rute: /tools/kimi-search
- Judul:
  - H2: Dapatkan kunci API
  - H2: Konfigurasi
  - H2: Cara kerjanya
  - H2: Parameter yang didukung
  - H2: Terkait

## tools/llm-task.md

- Rute: /tools/llm-task
- Judul:
  - H2: Aktifkan Plugin
  - H2: Konfigurasi (opsional)
  - H2: Parameter alat
  - H2: Output
  - H2: Contoh: Langkah alur kerja Lobster
  - H3: Batasan penting
  - H2: Catatan keselamatan
  - H2: Terkait

## tools/lobster.md

- Rute: /tools/lobster
- Judul:
  - H2: Hook
  - H2: Mengapa
  - H2: Mengapa DSL, bukan program biasa?
  - H2: Cara kerjanya
  - H2: Pola: CLI kecil + pipe JSON + persetujuan
  - H2: Langkah LLM khusus JSON (llm-task)
  - H3: Batasan penting: Lobster tersemat vs openclaw.invoke
  - H2: File alur kerja (.lobster)
  - H2: Instal Lobster
  - H2: Aktifkan alat
  - H2: Contoh: Triase email
  - H2: Parameter alat
  - H3: run
  - H3: resume
  - H3: Input opsional
  - H2: Envelope output
  - H2: Persetujuan
  - H2: OpenProse
  - H2: Keselamatan
  - H2: Pemecahan masalah
  - H2: Pelajari lebih lanjut
  - H2: Studi kasus: alur kerja komunitas
  - H2: Terkait

## tools/loop-detection.md

- Rute: /tools/loop-detection
- Judul:
  - H2: Mengapa ini ada
  - H2: Blok konfigurasi
  - H3: Perilaku kolom
  - H2: Penyiapan yang direkomendasikan
  - H2: Guard pasca-Compaction
  - H2: Log dan perilaku yang diharapkan
  - H2: Terkait

## tools/media-overview.md

- Route: /tools/media-overview
- Judul:
  - H2: Kemampuan
  - H2: Matriks kemampuan penyedia
  - H2: Asinkron vs sinkron
  - H2: Speech-to-text dan Voice Call
  - H2: Pemetaan penyedia (cara vendor terbagi di berbagai permukaan)
  - H2: Terkait

## tools/minimax-search.md

- Route: /tools/minimax-search
- Judul:
  - H2: Dapatkan kredensial Token Plan
  - H2: Konfigurasi
  - H2: Pemilihan wilayah
  - H2: Parameter yang didukung
  - H2: Terkait

## tools/multi-agent-sandbox-tools.md

- Route: /tools/multi-agent-sandbox-tools
- Judul:
  - H2: Contoh konfigurasi
  - H2: Presedensi konfigurasi
  - H3: Konfigurasi sandbox
  - H3: Pembatasan tool
  - H2: Migrasi dari agen tunggal
  - H2: Contoh pembatasan tool
  - H2: Kesalahan umum: "non-main"
  - H2: Pengujian
  - H2: Pemecahan masalah
  - H2: Terkait

## tools/music-generation.md

- Route: /tools/music-generation
- Judul:
  - H2: Mulai cepat
  - H2: Penyedia yang didukung
  - H3: Matriks kemampuan
  - H2: Parameter tool
  - H2: Perilaku asinkron
  - H3: Siklus hidup tugas
  - H2: Konfigurasi
  - H3: Pemilihan model
  - H3: Urutan pemilihan penyedia
  - H2: Catatan penyedia
  - H2: Memilih jalur yang tepat
  - H2: Mode kemampuan penyedia
  - H2: Pengujian live
  - H2: Terkait

## tools/ollama-search.md

- Route: /tools/ollama-search
- Judul:
  - H2: Penyiapan
  - H2: Konfigurasi
  - H2: Catatan
  - H2: Terkait

## tools/parallel-search.md

- Route: /tools/parallel-search
- Judul:
  - H2: Instal plugin
  - H2: Kunci API (penyedia berbayar)
  - H2: Konfigurasi
  - H2: Penggantian URL dasar
  - H2: Parameter tool
  - H2: Catatan
  - H2: Terkait

## tools/pdf.md

- Route: /tools/pdf
- Judul:
  - H2: Ketersediaan
  - H2: Referensi input
  - H2: Referensi PDF yang didukung
  - H2: Mode eksekusi
  - H3: Mode penyedia native
  - H3: Mode fallback ekstraksi
  - H2: Konfigurasi
  - H2: Detail output
  - H2: Perilaku kesalahan
  - H2: Contoh
  - H2: Terkait

## tools/permission-modes.md

- Route: /tools/permission-modes
- Judul:
  - H2: Default yang direkomendasikan
  - H2: Mode exec host OpenClaw
  - H2: Pemetaan Codex Guardian
  - H2: Izin harness ACPX
  - H2: Memilih mode
  - H2: Terkait

## tools/perplexity-search.md

- Route: /tools/perplexity-search
- Judul:
  - H2: Instal plugin
  - H2: Mendapatkan kunci API Perplexity
  - H2: Kompatibilitas OpenRouter
  - H2: Contoh konfigurasi
  - H3: API Pencarian Perplexity native
  - H3: Kompatibilitas OpenRouter / Sonar
  - H2: Tempat mengatur kunci
  - H2: Parameter tool
  - H3: Aturan filter domain
  - H2: Catatan
  - H2: Terkait

## tools/plugin.md

- Route: /tools/plugin
- Judul:
  - H2: Persyaratan
  - H2: Mulai cepat
  - H2: Konfigurasi
  - H3: Pilih sumber instalasi
  - H3: Kebijakan instalasi operator
  - H3: Konfigurasikan kebijakan plugin
  - H2: Memahami format plugin
  - H2: Hook plugin
  - H2: Verifikasi Gateway aktif
  - H2: Pemecahan masalah
  - H3: Kepemilikan jalur plugin yang diblokir
  - H3: Penyiapan tool plugin yang lambat
  - H2: Terkait

## tools/reactions.md

- Route: /tools/reactions
- Judul:
  - H2: Cara kerjanya
  - H2: Perilaku channel
  - H2: Tingkat reaksi
  - H2: Terkait

## tools/searxng-search.md

- Route: /tools/searxng-search
- Judul:
  - H2: Penyiapan
  - H2: Konfigurasi
  - H2: Variabel lingkungan
  - H2: Referensi konfigurasi plugin
  - H2: Catatan
  - H2: Terkait

## tools/skill-workshop.md

- Route: /tools/skill-workshop
- Judul:
  - H2: Cara kerjanya
  - H2: Siklus hidup
  - H2: Chat
  - H2: CLI
  - H2: Konten proposal
  - H2: File pendukung
  - H2: Tool agen
  - H2: Persetujuan dan otonomi
  - H2: Metode Gateway
  - H2: Penyimpanan
  - H2: Batasan
  - H2: Pemecahan masalah
  - H2: Terkait

## tools/skills-config.md

- Route: /tools/skills-config
- Judul:
  - H2: Pemuatan (skills.load)
  - H2: Instalasi (skills.install)
  - H2: Kebijakan Instalasi Operator (security.installPolicy)
  - H2: Allowlist skill bawaan
  - H2: Entri per skill (skills.entries)
  - H2: Allowlist agen (agents)
  - H2: Workshop (skills.workshop)
  - H2: Root skill yang disymlink
  - H2: Skill tersandbox dan env vars
  - H2: Pengingat urutan pemuatan
  - H2: Terkait

## tools/skills.md

- Route: /tools/skills
- Judul:
  - H2: Urutan pemuatan
  - H2: Skills per agen vs bersama
  - H2: Allowlist agen
  - H2: Plugin dan skills
  - H2: Skill Workshop
  - H2: Menginstal dari ClawHub
  - H2: Keamanan
  - H2: Format SKILL.md
  - H3: Kunci frontmatter opsional
  - H2: Gating
  - H3: Spesifikasi penginstal
  - H2: Penggantian konfigurasi
  - H2: Injeksi lingkungan
  - H2: Snapshot dan penyegaran
  - H2: Dampak token
  - H2: Terkait

## tools/slash-commands.md

- Route: /tools/slash-commands
- Judul:
  - H2: Tiga jenis perintah
  - H2: Konfigurasi
  - H2: Daftar perintah
  - H3: Perintah inti
  - H3: Perintah Dock
  - H3: Perintah plugin bawaan
  - H3: Perintah skill
  - H2: /tools — yang dapat digunakan agen sekarang
  - H2: /model — pemilihan model
  - H2: /config — penulisan konfigurasi di disk
  - H2: /mcp — konfigurasi server MCP
  - H2: /debug — penggantian khusus runtime
  - H2: /plugins — pengelolaan plugin
  - H2: /trace — output jejak plugin
  - H2: /btw — pertanyaan sampingan
  - H2: Catatan permukaan
  - H2: Penggunaan dan status penyedia
  - H2: Terkait

## tools/steer.md

- Route: /tools/steer
- Judul:
  - H2: Sesi saat ini
  - H2: Steer vs antrean
  - H2: Sub-agen
  - H2: Sesi ACP
  - H2: Terkait

## tools/subagents.md

- Route: /tools/subagents
- Judul:
  - H2: Perintah slash
  - H3: Kontrol pengikatan thread
  - H3: Perilaku spawn
  - H2: Mode konteks
  - H2: Tool: sessionsspawn
  - H3: Mode prompt delegasi
  - H3: Parameter tool
  - H3: Nama tugas dan penargetan
  - H2: Tool: sessionsyield
  - H2: Tool: subagents
  - H2: Sesi terikat thread
  - H3: Channel pendukung thread
  - H3: Alur cepat
  - H3: Kontrol manual
  - H3: Switch konfigurasi
  - H3: Allowlist
  - H3: Penemuan
  - H3: Arsip otomatis
  - H2: Sub-agen bertingkat
  - H3: Tingkat kedalaman
  - H3: Rantai pengumuman
  - H3: Kebijakan tool berdasarkan kedalaman
  - H3: Batas spawn per agen
  - H3: Penghentian berantai
  - H2: Autentikasi
  - H2: Pengumuman
  - H3: Konteks pengumuman
  - H3: Baris statistik
  - H3: Mengapa memilih sessionshistory
  - H2: Kebijakan tool
  - H3: Ganti lewat konfigurasi
  - H2: Konkurensi
  - H2: Keaktifan dan pemulihan
  - H2: Menghentikan
  - H2: Batasan
  - H2: Terkait

## tools/tavily.md

- Route: /tools/tavily
- Judul:
  - H2: Memulai
  - H2: Referensi tool
  - H3: tavilysearch
  - H3: tavilyextract
  - H2: Memilih tool yang tepat
  - H2: Konfigurasi lanjutan
  - H2: Terkait

## tools/thinking.md

- Route: /tools/thinking
- Judul:
  - H2: Yang dilakukannya
  - H2: Urutan resolusi
  - H2: Mengatur default sesi
  - H2: Penerapan berdasarkan agen
  - H2: Mode cepat (/fast)
  - H2: Direktif verbose (/verbose atau /v)
  - H2: Direktif jejak plugin (/trace)
  - H2: Visibilitas penalaran (/reasoning)
  - H2: Terkait
  - H2: Heartbeat
  - H2: UI chat web
  - H2: Profil penyedia

## tools/tokenjuice.md

- Route: /tools/tokenjuice
- Judul:
  - H2: Aktifkan plugin
  - H2: Yang diubah tokenjuice
  - H2: Verifikasi bahwa ini berfungsi
  - H2: Nonaktifkan plugin
  - H2: Terkait

## tools/tool-search.md

- Route: /tools/tool-search
- Judul:
  - H2: Cara satu giliran berjalan
  - H2: Mode
  - H2: Mengapa ini ada
  - H2: API
  - H2: Batas runtime
  - H2: Konfigurasi
  - H2: Prompt dan telemetri
  - H2: Validasi E2E
  - H2: Perilaku kegagalan
  - H2: Terkait

## tools/trajectory.md

- Route: /tools/trajectory
- Judul:
  - H2: Mulai cepat
  - H2: Akses
  - H2: Yang direkam
  - H2: File bundel
  - H2: Lokasi perekaman
  - H2: Nonaktifkan perekaman
  - H2: Sesuaikan timeout flush
  - H2: Privasi dan batasan
  - H2: Pemecahan masalah
  - H2: Terkait

## tools/tts.md

- Route: /tools/tts
- Judul:
  - H2: Mulai cepat
  - H2: Penyedia yang didukung
  - H2: Konfigurasi
  - H3: Penggantian suara per agen
  - H2: Persona
  - H3: Persona minimal
  - H3: Persona lengkap (prompt netral penyedia)
  - H3: Resolusi persona
  - H3: Cara penyedia menggunakan prompt persona
  - H3: Kebijakan fallback
  - H2: Direktif berbasis model
  - H2: Perintah slash
  - H2: Preferensi per pengguna
  - H2: Format output (tetap)
  - H2: Perilaku Auto-TTS
  - H2: Format output berdasarkan channel
  - H2: Referensi kolom
  - H2: Tool agen
  - H2: RPC Gateway
  - H2: Tautan layanan
  - H2: Terkait

## tools/video-generation.md

- Route: /tools/video-generation
- Judul:
  - H2: Mulai cepat
  - H2: Cara kerja generasi asinkron
  - H3: Siklus hidup tugas
  - H2: Penyedia yang didukung
  - H3: Matriks kemampuan
  - H2: Parameter tool
  - H3: Wajib
  - H3: Input konten
  - H3: Kontrol gaya
  - H3: Lanjutan
  - H4: Fallback dan opsi bertipe
  - H2: Tindakan
  - H2: Pemilihan model
  - H2: Catatan penyedia
  - H2: Mode kemampuan penyedia
  - H2: Pengujian live
  - H2: Konfigurasi
  - H2: Terkait

## tools/web-fetch.md

- Route: /tools/web-fetch
- Judul:
  - H2: Mulai cepat
  - H2: Parameter tool
  - H2: Cara kerjanya
  - H2: Pembaruan progres
  - H2: Konfigurasi
  - H2: Fallback Firecrawl
  - H2: Proksi env tepercaya
  - H2: Batasan dan keselamatan
  - H2: Profil tool
  - H2: Terkait

## tools/web.md

- Route: /tools/web
- Judul:
  - H2: Mulai cepat
  - H2: Memilih penyedia
  - H3: Perbandingan penyedia
  - H2: Deteksi otomatis
  - H2: Pencarian web OpenAI native
  - H2: Pencarian web Codex native
  - H2: Keamanan jaringan
  - H2: Menyiapkan pencarian web
  - H2: Konfigurasi
  - H3: Menyimpan kunci API
  - H2: Parameter tool
  - H2: xsearch
  - H3: Konfigurasi xsearch
  - H3: Parameter xsearch
  - H3: Contoh xsearch
  - H2: Contoh
  - H2: Profil tool
  - H2: Terkait

## tts.md

- Route: /tts
- Judul:
  - H2: Terkait

## vps.md

- Route: /vps
- Judul:
  - H2: Pilih penyedia
  - H2: Cara kerja penyiapan cloud
  - H2: Perkuat akses admin terlebih dahulu
  - H2: Agen perusahaan bersama di VPS
  - H2: Menggunakan node dengan VPS
  - H2: Penyetelan startup untuk VM kecil dan host ARM
  - H3: Checklist penyetelan systemd (opsional)
  - H2: Terkait

## web/control-ui.md

- Route: /web/control-ui
- Judul:
  - H2: Buka cepat (lokal)
  - H2: Pemasangan perangkat (koneksi pertama)
  - H2: Identitas pribadi (lokal browser)
  - H2: Endpoint konfigurasi runtime
  - H2: Dukungan bahasa
  - H2: Tema tampilan
  - H2: Yang dapat dilakukan (hari ini)
  - H2: Halaman MCP
  - H2: Tab aktivitas
  - H2: Perilaku chat
  - H2: Instalasi PWA dan web push
  - H2: Embed terhost
  - H2: Lebar pesan chat
  - H2: Akses tailnet (direkomendasikan)
  - H2: HTTP tidak aman
  - H2: Kebijakan keamanan konten
  - H2: Auth rute avatar
  - H2: Auth rute media asisten
  - H2: Membangun UI
  - H2: Halaman Control UI kosong
  - H2: Debugging/pengujian: server dev + Gateway jarak jauh
  - H2: Terkait

## web/dashboard.md

- Route: /web/dashboard
- Judul:
  - H2: Jalur cepat (direkomendasikan)
  - H2: Dasar auth (lokal vs jarak jauh)
  - H2: Jika Anda melihat "unauthorized" / 1008
  - H2: Terkait

## web/index.md

- Route: /web
- Judul:
  - H2: Webhook
  - H2: RPC HTTP admin
  - H2: Konfigurasi (aktif secara default)
  - H2: Akses Tailscale
  - H3: Serve Terintegrasi (direkomendasikan)
  - H3: Bind tailnet + token
  - H3: Internet publik (Funnel)
  - H2: Catatan keamanan
  - H2: Membangun UI

## web/tui.md

- Route: /web/tui
- Judul:
  - H2: Mulai cepat
  - H3: Mode Gateway
  - H3: Mode lokal
  - H2: Yang Anda lihat
  - H2: Model mental: agen + sesi
  - H2: Pengiriman + delivery
  - H2: Picker + overlay
  - H2: Pintasan keyboard
  - H2: Perintah slash
  - H2: Perintah shell lokal
  - H2: Perbaiki konfigurasi dari TUI lokal
  - H2: Output tool
  - H2: Warna terminal
  - H2: Riwayat + streaming
  - H2: Detail koneksi
  - H2: Opsi
  - H2: Pemecahan masalah
  - H2: Pemecahan masalah koneksi
  - H2: Terkait

## web/webchat.md

- Route: /web/webchat
- Judul:
  - H2: Apa ini
  - H2: Mulai cepat
  - H2: Cara kerjanya (perilaku)
  - H3: Transkrip dan model pengiriman
  - H2: Panel tool agen Control UI
  - H2: Penggunaan jarak jauh
  - H2: Referensi konfigurasi (WebChat)
  - H2: Terkait
