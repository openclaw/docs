---
read_when:
    - Anda ingin agen mengendalikan Chrome yang benar-benar telah Anda masuki dari ponsel Anda
    - Anda terus menemui perintah Chrome "Allow remote debugging?" saat tidak ada orang di depan komputer
    - Anda ingin memahami model keamanan pengambilalihan browser melalui ekstensi
summary: 'Ekstensi Chrome: memungkinkan OpenClaw mengendalikan Chrome yang telah Anda masuki tanpa prompt debugging jarak jauh'
title: Ekstensi Chrome
x-i18n:
    generated_at: "2026-07-19T16:28:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3d974f62bb5697a23dd6a6852137ce6af5a8a4a2a8ff738eec0098f259e8faa0
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Ekstensi Chrome

Ekstensi Chrome OpenClaw memungkinkan agen mengendalikan **tab Chrome yang telah
Anda masuki** tanpa meluncurkan browser terkelola terpisah, dan **tanpa** prompt
pemblokiran "Allow remote debugging?" dari Chrome.

Hal ini penting ketika Anda mengendalikan OpenClaw dari ponsel (Telegram, WhatsApp, dll.):
[profil `user`](/id/tools/browser#profiles-openclaw-user-chrome) terhubung melalui
port debugging jarak jauh Chrome, yang memunculkan dialog persetujuan desktop yang tidak
dapat diklik siapa pun saat Anda sedang tidak berada di tempat. Sebagai gantinya, ekstensi
menggunakan API `chrome.debugger`, sehingga satu-satunya petunjuk dalam halaman adalah
banner Chrome "OpenClaw started debugging this browser" yang dapat ditutup.

Ini adalah pola yang sama dengan yang digunakan oleh ekstensi Chrome Claude dari
Anthropic dan Codex dari OpenAI.

## Cara kerjanya

Tiga bagian:

- **Layanan kontrol browser** (host Gateway atau node): API yang dipanggil oleh
  alat `browser`.
- **Relai ekstensi** (WebSocket loopback): server kecil yang dimulai oleh layanan
  kontrol pada `127.0.0.1`. Server ini menyediakan endpoint Chrome DevTools Protocol
  kepada OpenClaw dan berkomunikasi dengan ekstensi. Kedua sisi melakukan autentikasi
  menggunakan token lokal host (lihat di bawah).
- **Ekstensi Chrome OpenClaw** (MV3): terhubung ke tab dengan `chrome.debugger`,
  meneruskan lalu lintas CDP, dan mengelola **grup tab OpenClaw**.

OpenClaw hanya melihat dan mengendalikan tab yang berada dalam **grup tab OpenClaw**.
Grup tersebut merupakan batas persetujuan: seret tab ke dalamnya untuk membagikannya,
seret keluar (atau klik tombol bilah alat) untuk langsung mencabut akses.

## Instal dan pasangkan

1. Tampilkan path ekstensi yang belum dikemas:

   ```bash
   openclaw browser extension path
   ```

2. Buka `chrome://extensions`, aktifkan **Developer mode**, klik **Load
   unpacked**, lalu pilih direktori yang ditampilkan.

3. Tampilkan string pemasangan:

   ```bash
   openclaw browser extension pair
   ```

4. Klik ikon OpenClaw pada bilah alat lalu tempelkan string pemasangan ke popup.
   Lencana berubah menjadi **ON** saat ekstensi terhubung ke relai.

Token pemasangan adalah **rahasia lokal host** yang dibuat saat pertama kali digunakan dan
disimpan di bawah `credentials/` dalam direktori status (mode `0600`).
Setiap mesin yang menjalankan browser — host Gateway dan setiap host node browser —
memiliki tokennya sendiri, sehingga tidak ada kredensial yang perlu berpindah antarmesin.
Untuk merotasinya, hapus file `browser-extension-relay.secret` lalu pasangkan kembali.

## Menggunakannya

Pilih profil bawaan `chrome` dalam pemanggilan alat `browser`, atau
jadikan sebagai profil default:

```bash
openclaw config set browser.defaultProfile chrome
```

```json5
{
  browser: {
    profiles: {
      chrome: { driver: "extension", color: "#FF4500" },
    },
  },
}
```

- Bagikan tab: klik tombol OpenClaw pada bilah alat di tab tersebut (tab akan
  bergabung dengan grup tab OpenClaw), atau seret tab apa pun ke dalam grup.
- Agen juga dapat membuka tab baru; tab tersebut otomatis masuk ke dalam grup.
- Cabut akses: klik kembali tombol tersebut, seret tab keluar dari grup, atau
  tutup banner debugging Chrome. Agen langsung kehilangan akses ke tab tersebut.

### Panel samping kopilot tab

Setelah memasangkan ekstensi, klik **Open tab copilot** dalam popup bilah alatnya.
OpenClaw mengonfigurasi `sidepanel.html` untuk tab Chrome tersebut secara khusus;
manifes tidak memiliki path panel samping global. Oleh karena itu, setiap tab memperoleh
dokumen panel, sesi Gateway, langganan pesan, dan pengikatan alat browser bertipe yang
terpisah.

Panel tidak menyertakan URL halaman, judul, DOM, atau teks yang terlihat ke dalam pesan
Anda. Panel hanya mengirim teks yang Anda ketik. Tindakan browser membawa pengikatan
terpisah yang diautentikasi Gateway, yang berisi tab Chrome dan target CDP, sementara alat
browser menolak upaya untuk mengganti target tersebut atau menggunakan tindakan yang
mencakup seluruh browser. Balasan tetap berada di panel (`deliver: false`); balasan
tidak mewarisi rute Telegram, Discord, atau saluran lainnya.

Kopilot adalah perangkat Gateway khusus yang telah dipasangkan dengan cakupan
`operator.read` dan `operator.write`. Saat pertama kali digunakan, periksa dan
setujui permintaannya:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Ekstensi mempertahankan identitas perangkat tersebut dan token perangkat yang diterbitkan
Gateway, dengan cakupan terbatas pada endpoint Gateway kanonis yang menerbitkannya.
Memasangkan Gateway lain akan membuat identitas, token, dan pengelolaan sesi yang
terpisah; kredensial dan sesi tidak pernah digunakan kembali di antara endpoint.
Ekstensi tidak menyimpan rahasia bersama Gateway. Panel hanya dapat berlangganan sesi
tabnya sendiri, dan Gateway memfilter peristiwa tersebut sebelum dikirimkan.

Jika koneksi Gateway terputus selama proses berjalan, ekstensi mempertahankan pengelolaan
tetap atas ID proses tersebut. Saat terhubung kembali, ekstensi membatalkan proses yang
belum terselesaikan sebelum mengaktifkan kembali panel apa pun, lalu memuat ulang riwayat
transkrip. Langkah gagal-tertutup ini mencegah tindakan browser terus berlangsung tanpa
terlihat selama terjadinya kesenjangan pengiriman.

Menutup tab akan langsung menghapus langganan aktifnya, membatalkan proses yang terlihat,
dan menandai sesi tab tersebut sebagai diarsipkan. Jika Gateway untuk sementara luring,
ekstensi menyimpan permintaan pengarsipan yang tertunda dan mencoba kembali hanya ketika
endpoint Gateway yang sama terhubung kembali; ekstensi tidak pernah mengirim permintaan
pengarsipan ke Gateway lain. Setelah browser mengalami crash, peluncuran berikutnya
mengarsipkan sesi yang ditinggalkan oleh instans browser sebelumnya. Sesi yang diarsipkan
menolak pekerjaan baru, sementara transkripnya tetap tersedia dalam riwayat sesi. Kunci
kopilot browser merupakan sesi utas, sehingga pemeliharaan usia dan jumlah entri normal
akan mempertahankannya. Anggaran disk sesi per agen tetap berlaku (default
`2gb`) dan dapat menghapus sesi terlama saat kapasitas terbatas; lihat
[pemeliharaan sesi](/id/reference/session-management-compaction#store-maintenance-and-disk-controls).

Panel samping saat ini memerlukan relai ekstensi yang dihosting Gateway atau relai Gateway
jarak jauh langsung. Relai loopback pada node browser belum dapat menyediakan rute node
yang diperlukan oleh pengikatan tab bertipe, sehingga panel menolak topologi tersebut
alih-alih beralih ke perutean yang mencakup seluruh browser.

## Mengirim halaman ke OpenClaw

Gunakan **Send page to OpenClaw** dalam popup bilah alat untuk membagikan teks halaman
yang dapat dibaca dengan sesi utama OpenClaw Anda. Anda dapat menambahkan catatan
opsional, menggunakan menu klik kanan halaman atau pilihan, atau menekan
`Alt+Shift+S`. OpenClaw mengutamakan pilihan Anda saat ini jika ada, memasukkan
pembagian tersebut ke antrean sebagai peristiwa sistem, dan segera membangunkan sesi
utama.

Tab tidak perlu berada dalam grup tab OpenClaw. Ini merupakan pembagian eksplisit sekali
jalan: tidak ada bagian lain pada halaman yang diekspos, dan tindakan ini tidak memberikan
akses berkelanjutan. Google Docs diekspor sebagai teks biasa menggunakan sesi browser
yang telah Anda masuki, tanpa penyiapan Google API. Utas X dan Twitter diekstrak tanpa
antarmuka chrome di sekitarnya.

Teks halaman dibungkus dalam batas keamanan konten eksternal OpenClaw. Catatan opsional
Anda tetap berada di luar batas tersebut sebagai instruksi Anda sendiri. Teks halaman dan
pilihan dibatasi hingga sekitar 120,000 karakter dan menyertakan penanda pemotongan saat
dipersingkat.

Pembagian halaman berfungsi ketika relai ekstensi dihosting oleh Gateway, menggunakan
pemasangan pada host yang sama atau pemasangan Gateway `wss://` secara
langsung. Untuk saat ini, relai yang dihosting node mengembalikan galat yang jelas. Untuk
memetakan ulang pintasan papan ketik, buka `chrome://extensions/shortcuts`.

## Jarak jauh / lintas mesin

Chrome tidak harus berjalan pada host Gateway. Tiga topologi berikut berfungsi:

- **Host yang sama** (Gateway + Chrome pada satu mesin): pasangkan pada mesin
  tersebut dengan `openclaw browser extension pair`. Relai hanya menggunakan loopback.
  Jika Gateway lokal menggunakan TLS, teruskan nama host sertifikatnya secara eksplisit
  dengan `--gateway-url wss://gateway-host.example`; pemasangan tidak pernah menggantinya dengan IP loopback.
- **Langsung ke Gateway jarak jauh** (Chrome pada laptop Anda, Gateway pada VPS,
  dan **tidak ada hal lain di laptop**): pada Gateway, jalankan
  `openclaw browser extension pair --gateway-url wss://your-gateway.example.com`.
  Perintah tersebut menampilkan string `wss://…/browser/extension#<secret>`; muat dan pasangkan
  ekstensi pada laptop. Ekstensi terhubung **langsung ke Gateway** melalui
  `wss://` — tanpa instalasi OpenClaw, Node, CLI, atau port masuk yang terbuka
  pada laptop. Ini adalah jalur hosting terkelola.
- **Melalui host node browser** (Chrome pada mesin yang sudah menjalankan node
  OpenClaw): jalankan `pair` pada node dan pasangkan secara lokal; Gateway
  memproksikan tindakan browser ke node melalui tautan node terautentikasi yang sudah ada.

Rahasia pemasangan berlaku per host (milik Gateway dalam kasus langsung), yang divalidasi
oleh rute `/browser/extension` milik Gateway. Untuk jalur langsung, sajikan Gateway melalui
TLS (`wss://`) agar rahasia pemasangan dan lalu lintas CDP dienkripsi.
Rahasia tetap berada dalam fragmen URL string pemasangan dan disajikan selama handshake
WebSocket sebagai kredensial subprotokol, sehingga log akses proksi normal tidak
menerimanya dalam URL permintaan. Pastikan setiap proksi terbalik mempertahankan header
standar `Sec-WebSocket-Protocol`.

## Diagnostik

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

`doctor` melaporkan pemeriksaan **relai ekstensi Chrome** sebagai gagal hingga
popup ekstensi menampilkan **Connected**.

## Model keamanan

- Relai hanya mengikat loopback; kedua sisi WebSocket diautentikasi dengan token
  turunan, dan sisi ekstensi diperiksa asalnya terhadap `chrome-extension://`.
- Pemasangan Gateway langsung tidak menerima token relai dalam URL permintaan;
  ekstensi bawaan membawanya dalam daftar subprotokol WebSocket sebagai gantinya.
- Agen hanya dapat melihat dan mengendalikan tab dalam **grup tab OpenClaw**.
  Tab Anda yang lain tetap privat.
- Proses panel samping dibatasi dua kali: pengiriman Gateway menggunakan daftar
  izin per sesi, dan alat browser menerapkan pengikatan tab/target Chrome yang dibawa
  di luar prompt.
- Dibandingkan dengan profil `user` (Chrome MCP), yang mengekspos
  seluruh browser yang telah Anda masuki setelah Anda menyetujui prompt debugging jarak
  jauh, ekstensi membatasi cakupan yang dibagikan pada grup tab yang dapat Anda kendalikan
  dengan mudah.

Lihat juga: [Browser](/id/tools/browser) untuk model profil lengkap serta profil
`openclaw` terkelola dan `user` Chrome MCP.
