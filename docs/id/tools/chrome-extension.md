---
read_when:
    - Anda ingin agen mengendalikan Chrome yang benar-benar telah Anda masuki dari ponsel Anda
    - Anda terus menjumpai perintah Chrome "Allow remote debugging?" saat tidak ada seorang pun di depan komputer
    - Anda ingin memahami model keamanan pengambilalihan browser melalui ekstensi
summary: 'Ekstensi Chrome: izinkan OpenClaw mengendalikan Chrome yang telah Anda masuki tanpa perintah konfirmasi debugging jarak jauh'
title: Ekstensi Chrome
x-i18n:
    generated_at: "2026-07-12T14:42:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb3f7d4bd9d933e0e876d21a1edf07bafbdc18d0196ce636981bd11ad5f2facd
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Ekstensi Chrome

Ekstensi Chrome OpenClaw memungkinkan agen mengontrol **tab Chrome yang telah Anda masuki**
tanpa meluncurkan peramban terkelola terpisah, dan **tanpa** perintah pemblokiran Chrome
"Allow remote debugging?".

Hal ini penting saat Anda mengendalikan OpenClaw dari ponsel (Telegram, WhatsApp, dll.):
[profil `user`](/id/tools/browser#profiles-openclaw-user-chrome) terhubung melalui
port debug jarak jauh Chrome, yang memunculkan dialog persetujuan desktop yang tidak dapat
diklik siapa pun saat Anda sedang tidak berada di depan komputer. Sebagai gantinya, ekstensi menggunakan API `chrome.debugger`,
sehingga satu-satunya petunjuk di dalam halaman adalah spanduk Chrome yang dapat ditutup, "OpenClaw started debugging
this browser".

Ini adalah arsitektur yang sama dengan yang digunakan oleh ekstensi Chrome Claude milik Anthropic dan Codex
milik OpenAI.

## Cara kerjanya

Tiga bagian:

- **Layanan kontrol peramban** (Gateway atau host Node): API yang dipanggil oleh alat `browser`.
- **Relai ekstensi** (WebSocket loopback): server kecil yang dimulai oleh layanan kontrol
  pada `127.0.0.1`. Server ini menyediakan titik akhir Chrome DevTools Protocol untuk
  OpenClaw dan berkomunikasi dengan ekstensi. Kedua sisi melakukan autentikasi dengan
  token lokal host (lihat di bawah).
- **Ekstensi Chrome OpenClaw** (MV3): terhubung ke tab dengan `chrome.debugger`,
  meneruskan lalu lintas CDP, dan mengelola **grup tab OpenClaw**.

OpenClaw hanya melihat dan mengontrol tab yang berada di **grup tab OpenClaw**. Grup
tersebut merupakan batas persetujuan: seret tab ke dalamnya untuk membagikannya, seret keluar (atau klik
tombol bilah alat) untuk langsung mencabut akses.

## Instal dan pasangkan

1. Tampilkan jalur ekstensi yang belum dikemas:

   ```bash
   openclaw browser extension path
   ```

2. Buka `chrome://extensions`, aktifkan **Developer mode**, klik **Load
   unpacked**, lalu pilih direktori yang ditampilkan.

3. Tampilkan string pemasangan:

   ```bash
   openclaw browser extension pair
   ```

4. Klik ikon OpenClaw pada bilah alat dan tempelkan string pemasangan ke dalam jendela sembul.
   Lencana berubah menjadi **ON** saat ekstensi terhubung ke relai.

Token pemasangan adalah **rahasia lokal host** yang dibuat saat penggunaan pertama dan disimpan
di bawah `credentials/` dalam direktori status (mode `0600`). Setiap mesin yang
menjalankan peramban — host Gateway dan setiap host Node peramban — memiliki
token sendiri, sehingga tidak ada kredensial yang perlu dikirim antar-mesin. Untuk merotasinya, hapus berkas
`browser-extension-relay.secret` lalu pasangkan kembali.

## Penggunaan

Pilih profil bawaan `chrome` dalam pemanggilan alat `browser`, atau jadikan sebagai
profil baku:

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

- Bagikan tab: klik tombol OpenClaw pada bilah alat di tab tersebut (tab akan bergabung dengan
  grup tab OpenClaw), atau seret tab apa pun ke dalam grup.
- Agen juga dapat membuka tab baru; tab tersebut otomatis masuk ke dalam grup.
- Cabut akses: klik tombol tersebut lagi, seret tab keluar dari grup, atau tutup
  spanduk debug Chrome. Agen segera kehilangan akses ke tab tersebut.

## Jarak jauh / lintas mesin

Chrome tidak harus berjalan pada host Gateway. Tiga topologi berikut didukung:

- **Host yang sama** (Gateway + Chrome pada satu mesin): pasangkan pada mesin tersebut dengan
  `openclaw browser extension pair`. Relai hanya dapat diakses melalui loopback.
- **Langsung ke Gateway jarak jauh** (Chrome pada laptop Anda, Gateway pada VPS, dan
  **tidak ada komponen lain di laptop**): pada Gateway, jalankan
  `openclaw browser extension pair --gateway-url wss://your-gateway.example.com`.
  Perintah ini menampilkan string `wss://…/browser/extension#<secret>`; muat dan pasangkan
  ekstensi pada laptop. Ekstensi terhubung **langsung ke Gateway**
  melalui `wss://` — tanpa instalasi OpenClaw, Node, CLI, atau port masuk terbuka pada
  laptop. Ini adalah jalur hosting terkelola.
- **Melalui host Node peramban** (Chrome pada mesin yang sudah menjalankan Node
  OpenClaw): jalankan `pair` pada Node dan pasangkan secara lokal; Gateway meneruskan tindakan
  peramban ke Node melalui tautan Node terautentikasi yang sudah ada.

Rahasia pemasangan berlaku per host (milik Gateway, untuk kasus langsung), dan divalidasi oleh
rute `/browser/extension` milik Gateway. Untuk jalur langsung, sajikan Gateway
melalui TLS (`wss://`) agar rahasia pemasangan dan lalu lintas CDP dienkripsi.
Rahasia tetap berada dalam fragmen URL string pemasangan dan disajikan selama
jabat tangan WebSocket sebagai kredensial subprotokol, sehingga log akses proksi
normal tidak menerimanya dalam URL permintaan. Pastikan setiap proksi balik mempertahankan
header standar `Sec-WebSocket-Protocol`.

## Diagnostik

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

`doctor` melaporkan pemeriksaan **relai ekstensi Chrome** gagal hingga
jendela sembul ekstensi menampilkan **Connected**.

## Model keamanan

- Relai hanya terikat ke loopback; kedua sisi WebSocket diautentikasi dengan
  token turunan, dan asal sisi ekstensi diperiksa terhadap `chrome-extension://`.
- Pemasangan Gateway langsung tidak menerima token relai dalam URL permintaan;
  ekstensi bawaan membawanya dalam daftar subprotokol WebSocket.
- Agen hanya dapat melihat dan mengendalikan tab dalam **grup tab OpenClaw**. Tab
  Anda yang lain tetap privat.
- Dibandingkan dengan profil `user` (Chrome MCP), yang mengekspos seluruh
  peramban yang telah Anda masuki setelah Anda menyetujui perintah debug jarak jauh, ekstensi
  membatasi ruang lingkup permukaan yang dibagikan ke grup tab yang dapat Anda kendalikan secara sekilas.

Lihat juga: [Peramban](/id/tools/browser) untuk model profil lengkap serta
profil terkelola `openclaw` dan profil Chrome MCP `user`.
