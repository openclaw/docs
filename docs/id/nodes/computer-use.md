---
read_when:
    - Memungkinkan agen Gateway melihat dan mengendalikan desktop Mac
    - Pengaktifan, izin, atau keamanan untuk penggunaan komputer
    - Memperluas perintah node computer.act atau pelaksananya
summary: Kontrol desktop berbasis agen pada Node macOS yang dipasangkan melalui alat komputer dan perintah Node `computer.act`
title: Penggunaan komputer
x-i18n:
    generated_at: "2026-07-12T14:20:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2457d15a59857ffd9c7b160ea4ebed85c8372754abfc7bf75faafc963ecb6547
    source_path: nodes/computer-use.md
    workflow: 16
---

Penggunaan komputer memungkinkan agen Gateway melihat dan mengendalikan desktop **macOS** yang dipasangkan: agen mengambil tangkapan layar dengan perintah Node `screen.snapshot` yang sudah ada serta mengendalikan penunjuk dan papan ketik melalui satu perintah Node berbahaya, `computer.act`. Kumpulan tindakannya mengikuti tindakan penggunaan komputer inti Anthropic; zoom opsional `computer_20251124` tidak diekspos. Model berkemampuan visi mengendalikannya melalui alat agen `computer` bawaan.

Agen mengeluarkan satu perintah seragam, `computer.act`; agen tidak dapat mengetahui bagaimana suatu Node memenuhinya. Node macOS memenuhi `computer.act` di dalam proses dengan layanan Peekaboo tertanam ditambah primitif CoreGraphics yang terbatas (izin TCC yang benar, tanpa proses tambahan). Platform lain nantinya dapat memenuhi perintah yang sama tanpa mengubah kontrak yang menghadap agen.

## Persyaratan

- Node **macOS** yang dipasangkan (aplikasi OpenClaw macOS yang berjalan dalam mode Node).
- Pengaturan aplikasi macOS **Allow Computer Control** diaktifkan (bawaan: nonaktif).
- Izin **Accessibility** macOS diberikan kepada OpenClaw (untuk injeksi penunjuk/papan ketik) dan izin **Screen Recording** (untuk `screen.snapshot`).
- Perintah `computer.act` dipersenjatai pada Gateway (perintah ini berbahaya dan secara bawaan tidak dipersenjatai).
- Model agen berkemampuan visi.
- Kebijakan alat yang mengekspos `computer`. Profil `coding` bawaan tidak mengeksposnya. Tambahkan `computer` ke `tools.alsoAllow`; agen dalam sandbox juga memerlukannya di `tools.sandbox.tools.alsoAllow`.

## Alat agen `computer`

Alat `computer` bawaan menerima satu tindakan per pemanggilan. Koordinat berupa piksel bilangan bulat nonnegatif dalam tangkapan layar terbaru; Node memetakannya ke titik tampilan. Tindakan koordinat harus menggemakan `frameId` dari hasil tangkapan layar, dan `screenIndex` eksplisit harus cocok dengan bingkai tersebut. OpenClaw juga meneruskan identitas tampilan yang diterbitkan Node dari tangkapan layar ke tindakan, sehingga penyambungan ulang tampilan atau perubahan geometri akan gagal secara tertutup alih-alih secara diam-diam mengalihkan target ke indeks yang sama. Pemeriksaan ini menolak token tebakan dan token dari bingkai atau tampilan terkirim lainnya. Token bukanlah jaminan kebaruan: aplikasi dapat mengubah piksel pada tampilan yang sama setelah pengambilan, jadi ambil tangkapan layar baru setiap kali tampilan mungkin telah berubah.

- Pembacaan: `screenshot`.
- Penunjuk: `left_click`, `right_click`, `middle_click`, `double_click`, `triple_click`, `mouse_move`, `left_click_drag` (dengan `startCoordinate`), `left_mouse_down`, `left_mouse_up`.
- Pengguliran: `scroll` dengan `scrollDirection` (`up|down|left|right`) dan `scrollAmount` (takik roda).
- Papan ketik: `type` (teks), `key` (kombinasi seperti `cmd+shift+t` atau `Return`), `hold_key` (kombinasi `text` yang ditahan selama `duration` detik).
- Pengaturan tempo: `wait` (`duration` detik).

Tombol pengubah disertakan melalui bidang `text` pada tindakan klik dan gulir (`shift`, `ctrl`, `alt`, `cmd`). Setelah tindakan input, alat mengembalikan tangkapan layar baru agar model dapat mengamati hasilnya. Jika lebih dari satu Node berkemampuan komputer terhubung, teruskan `node` secara eksplisit.

Tangkapan layar disimpan **hanya untuk model**: tangkapan tersebut tidak pernah dikirim otomatis ke saluran obrolan. Perlakukan semua konten di layar sebagai input yang tidak tepercaya; alat memperingatkan model agar tidak mengikuti instruksi di layar yang bertentangan dengan permintaan pengguna.

## Perintah Node `computer.act`

`computer.act` adalah satu-satunya perintah Node yang digunakan alat untuk merutekan input (`node.invoke` dengan `command: "computer.act"`). Perintah ini:

- **Berbahaya secara bawaan**: tercantum dalam perintah Node berbahaya bawaan dan dikecualikan dari daftar izin runtime hingga dipersenjatai secara eksplisit. Node macOS tetap dapat mendeklarasikannya saat pemasangan agar permukaan tersebut cukup disetujui sekali.
- **Khusus macOS** saat ini: hanya diiklankan oleh Node macOS yang telah mengaktifkan **Allow Computer Control**.

Pembacaan menggunakan kembali `screen.snapshot`; tidak ada jalur pengambilan kedua. Lihat [Node kamera dan layar](/id/nodes/camera) untuk perintah pengambilan bersama.

## Mengaktifkan dan mempersenjatai

1. Di aplikasi macOS, aktifkan **Settings → Allow Computer Control**. Kemudian buka **Settings → Permissions** dan berikan **Accessibility** serta **Screen Recording** di macOS System Settings.
2. Setujui pembaruan pemasangan pada Gateway (perintah baru memaksa pemasangan ulang).
3. Ekspos alat kepada agen berkemampuan visi. Untuk profil `coding` bawaan:

   ```json5
   {
     tools: {
       alsoAllow: ["computer"],
       // Agen dalam sandbox juga memerlukan gerbang kedua ini:
       sandbox: { tools: { alsoAllow: ["computer"] } },
     },
   }
   ```

4. Persenjatai `computer.act` untuk jangka waktu terbatas. Plugin `phone-control` mengekspos grup `computer`:

   ```text
   /phone arm computer 30m
   /phone status
   /phone disarm
   ```

   Mempersenjatai memerlukan `operator.admin` (atau pemilik) dan akan kedaluwarsa secara otomatis. Grup lama `/phone arm all` sengaja tidak menyertakan kendali desktop; gunakan grup `computer` secara eksplisit. Mempersenjatai hanya mengubah apa yang dapat dipanggil Gateway; aplikasi macOS tetap memberlakukan pengaturan **Allow Computer Control** dan izin sistem operasinya.

Untuk otorisasi persisten, tambahkan `computer.act` ke `gateway.nodes.allowCommands` **dan hapus dari** `gateway.nodes.denyCommands`; daftar penolakan diutamakan. Otorisasi persisten tidak kedaluwarsa secara otomatis. Entri yang sudah ada sebelum `/phone arm` tetap ada setelah `/phone disarm`; jangan mengubah pemberian sementara menjadi persisten selagi dipersenjatai.

Otorisasi sengaja dipisahkan antara pengaktifan dan penggunaan. Mempersenjatai atau
mengonfigurasi `computer.act` secara persisten memerlukan kewenangan administratif.
Setelah dipersenjatai, operator terautentikasi dengan `operator.write` dapat memanggil
`computer.act` melalui `node.invoke` hingga pemberian izin kedaluwarsa atau dihentikan;
tidak ada pemeriksaan admin per tindakan. Menyetujui Node yang mendeklarasikan
`computer.act` hanya mencatat permukaan tersebut agar dapat dipersenjatai nanti dan tidak
mengaktifkan pemanggilan dengan sendirinya.

## Keamanan

- Sebelum otorisasi, setiap lapisan (kebijakan alat, kebijakan perintah Gateway, pengaturan macOS, Accessibility, dan Screen Recording) harus menyetujuinya. Setelah dipersenjatai, tindakan dijalankan tanpa konfirmasi per tindakan hingga kedaluwarsa atau `/phone disarm`.
- Input teks dikirim satu grafem pada satu waktu. Pembatalan, pemutusan koneksi, jeda, penonaktifan, atau penggantian titik akhir akan menghentikannya sebelum grafem berikutnya, alih-alih membiarkan sisa input yang kedaluwarsa terus berjalan.
- Tangkapan layar hanya untuk model dan tidak pernah dikirim otomatis ke obrolan (masalah [#44759](https://github.com/openclaw/openclaw/issues/44759)).
- Perlakukan konten layar sebagai tidak tepercaya; konten tersebut dapat memuat injeksi prompt.

## Hubungan dengan jalur kendali desktop lainnya

Ini adalah jalur yang digerakkan agen. Lihat [Jembatan Peekaboo](/id/platforms/mac/peekaboo) untuk mengetahui hubungannya dengan host PeekabooBridge, Penggunaan Komputer Codex, dan MCP `cua-driver` langsung.
