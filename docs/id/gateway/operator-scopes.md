---
read_when:
    - Men-debug kesalahan cakupan operator yang hilang
    - Meninjau persetujuan pemasangan perangkat atau Node
    - Menambahkan atau mengklasifikasikan metode RPC Gateway
summary: Peran operator, cakupan, dan pemeriksaan saat persetujuan untuk klien Gateway
title: Cakupan operator
x-i18n:
    generated_at: "2026-07-12T14:12:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfda4486e8d31c01fb7ffff398dcc678d298194f0f0ce6308ae9e5388f5a2856
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Cakupan operator membatasi apa yang dapat dilakukan klien Gateway setelah diautentikasi.
Cakupan tersebut merupakan pagar pengaman bidang kontrol di dalam satu domain operator Gateway tepercaya,
bukan isolasi multipenyewa yang tidak tepercaya. Untuk pemisahan yang kuat antara orang,
tim, atau mesin, jalankan Gateway terpisah di bawah pengguna OS atau host yang terpisah.

Terkait: [Keamanan](/id/gateway/security), [Protokol Gateway](/id/gateway/protocol),
[Pengaitan Gateway](/id/gateway/pairing), [CLI Perangkat](/id/cli/devices).

## Peran

Setiap klien WebSocket Gateway terhubung dengan satu peran:

- `operator`: klien bidang kontrol seperti CLI, UI Kontrol, otomatisasi, dan
  proses pembantu tepercaya.
- `node`: host kapabilitas (macOS, iOS, Android, tanpa antarmuka grafis) yang mengekspos
  perintah melalui `node.invoke`.

Metode RPC operator memerlukan peran `operator`; metode yang berasal dari node
memerlukan peran `node`.

## Tingkat cakupan

| Cakupan                 | Arti                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `operator.read`         | Status, daftar, katalog, log, pembacaan sesi, dan panggilan lain yang tidak mengubah keadaan, hanya-baca.                                                                       |
| `operator.write`        | Tindakan operator yang mengubah keadaan: mengirim pesan, menjalankan alat, memperbarui pengaturan percakapan/suara, meneruskan perintah node. Juga memenuhi `operator.read`.    |
| `operator.admin`        | Akses administratif. Memenuhi setiap cakupan `operator.*`. Diperlukan untuk perubahan konfigurasi, pembaruan, kait native, namespace khusus, dan persetujuan berisiko tinggi. |
| `operator.pairing`      | Pengelolaan pengaitan perangkat dan node: mencantumkan, menyetujui, menolak, menghapus, merotasi, mencabut.                                                                      |
| `operator.approvals`    | API persetujuan eksekusi dan plugin.                                                                                                                                            |
| `operator.talk.secrets` | Membaca konfigurasi Percakapan dengan menyertakan rahasia.                                                                                                                       |

Cakupan `operator.*` mendatang yang tidak dikenal memerlukan kecocokan persis, kecuali pemanggil
sudah memiliki `operator.admin`.

## Cakupan metode hanyalah gerbang pertama

Setiap RPC Gateway memiliki cakupan metode dengan hak akses minimum yang menentukan apakah suatu
permintaan dapat mencapai penanganannya. Beberapa penangan kemudian menerapkan pemeriksaan yang lebih ketat berdasarkan
hal konkret yang disetujui atau diubah:

- `device.pair.approve` dapat diakses dengan `operator.pairing`, tetapi persetujuan
  perangkat operator hanya dapat menerbitkan atau mempertahankan cakupan yang sudah dimiliki pemanggil.
- `node.pair.approve` dapat diakses dengan `operator.pairing`, lalu memperoleh cakupan
  persetujuan tambahan dari daftar perintah yang dinyatakan oleh node yang tertunda.
- `chat.send` adalah metode bercakupan tulis, tetapi perintah percakapan `/config set` dan
  `/config unset` memerlukan `operator.admin` sebagai tambahan,
  terlepas dari cakupan pengiriman percakapan milik pemanggil.

Hal ini memungkinkan operator dengan cakupan lebih rendah melakukan tindakan pengaitan berisiko rendah tanpa
menjadikan semua persetujuan pengaitan hanya dapat dilakukan oleh administrator.

## Persetujuan pengaitan perangkat

Catatan pengaitan perangkat merupakan sumber tetap bagi peran dan cakupan yang disetujui.
Perangkat yang sudah dikaitkan tidak memperoleh akses yang lebih luas secara diam-diam: koneksi ulang
yang meminta peran atau cakupan lebih luas akan membuat permintaan peningkatan baru yang tertunda.

Saat menyetujui permintaan perangkat:

- Permintaan tanpa peran operator tidak memerlukan persetujuan cakupan operator.
- Permintaan untuk peran perangkat nonoperator (misalnya `node`) memerlukan
  `operator.admin`, meskipun `device.pair.approve` sendiri hanya memerlukan
  `operator.pairing`.
- Permintaan untuk `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing`, atau `operator.talk.secrets` mengharuskan pemanggil sudah
  memiliki cakupan tersebut, atau `operator.admin`.
- Permintaan untuk `operator.admin` memerlukan `operator.admin`.
- Permintaan perbaikan tanpa cakupan eksplisit dapat mewarisi cakupan token operator
  yang ada; jika token tersebut bercakupan admin, persetujuan tetap memerlukan
  `operator.admin`.

Sesi rahasia bersama dan proksi tepercaya nonadmin hanya dapat menyetujui
permintaan perangkat operator dalam cakupan operator yang dinyatakannya sendiri; persetujuan
peran nonoperator hanya dapat dilakukan oleh admin meskipun sesi tersebut dapat menggunakan
`operator.pairing` untuk keperluan lain.

Untuk sesi token perangkat yang telah dikaitkan, pengelolaan terbatas pada diri sendiri kecuali pemanggil
memiliki `operator.admin`: pemanggil nonadmin hanya melihat entri pengaitannya sendiri, dan
hanya dapat menyetujui, menolak, merotasi, mencabut, atau menghapus entri perangkatnya sendiri.

## Persetujuan pengaitan Node

Metode lama `node.pair.*` menggunakan penyimpanan pengaitan node terpisah yang dimiliki Gateway.
Node WS menggunakan pengaitan perangkat (`role: node`) sebagai gantinya, tetapi kosakata
persetujuan yang sama berlaku. Lihat [Pengaitan Gateway](/id/gateway/pairing) untuk mengetahui hubungan kedua
penyimpanan tersebut.

`node.pair.approve` memperoleh cakupan tambahan yang diperlukan dari daftar
perintah permintaan tertunda:

| Perintah yang dinyatakan                              | Cakupan yang diperlukan                 |
| ----------------------------------------------------- | --------------------------------------- |
| tidak ada                                             | `operator.pairing`                      |
| perintah node non-eksekusi                            | `operator.pairing` + `operator.write`   |
| `system.run`, `system.run.prepare`, atau `system.which` | `operator.pairing` + `operator.admin` |

Menyetujui deklarasi node tidak mengaktifkan perintah yang memiliki gerbang daftar izin
runtime terpisah. Misalnya, menyetujui node yang mendeklarasikan
`computer.act` memerlukan pengaitan serta cakupan tulis, tetapi hanya mencatat permukaan tersebut.
Administrator atau pemilik tetap harus mengaktifkan `computer.act`. Selama tetap
diaktifkan, pemanggilannya melalui metode `node.invoke` bercakupan tulis tidak
memerlukan cakupan admin untuk setiap tindakan.

Pengaitan Node menetapkan identitas dan kepercayaan; hal tersebut tidak menggantikan kebijakan
persetujuan eksekusi `system.run` milik node itu sendiri.

## Autentikasi rahasia bersama

Autentikasi token/kata sandi Gateway bersama diperlakukan sebagai akses operator tepercaya untuk
Gateway tersebut. Permukaan HTTP yang kompatibel dengan OpenAI, `/tools/invoke`, dan endpoint HTTP
riwayat sesi memulihkan kumpulan lengkap cakupan operator default untuk autentikasi bearer
rahasia bersama, meskipun pemanggil mengirim cakupan dinyatakan yang lebih sempit.

Mode yang menyertakan identitas, seperti autentikasi proksi tepercaya atau `none` untuk ingress privat,
tetap dapat mematuhi cakupan eksplisit yang dinyatakan. Gunakan Gateway terpisah untuk pemisahan
batas kepercayaan yang sebenarnya.
