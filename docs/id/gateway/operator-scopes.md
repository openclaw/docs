---
read_when:
    - Men-debug kesalahan cakupan operator yang hilang
    - Meninjau persetujuan pemasangan perangkat atau Node
    - Menambahkan atau mengklasifikasikan metode RPC Gateway
summary: Peran operator, cakupan, dan pemeriksaan saat persetujuan untuk klien Gateway
title: Cakupan operator
x-i18n:
    generated_at: "2026-07-16T18:10:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5e74cdd87d21a9e0eafea6b7e4b18ab2e5b74e6c570603b1d4ad4dff83c65619
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Cakupan operator membatasi tindakan yang dapat dilakukan klien Gateway setelah terautentikasi.
Cakupan tersebut merupakan pagar pengaman bidang kontrol dalam satu domain operator Gateway tepercaya,
bukan isolasi multi-tenant yang tahan terhadap pihak berbahaya. Untuk pemisahan yang kuat antara individu,
tim, atau mesin, jalankan Gateway terpisah di bawah pengguna OS atau host yang berbeda.

Terkait: [Keamanan](/id/gateway/security), [Protokol Gateway](/id/gateway/protocol),
[Pemasangan Gateway](/id/gateway/pairing), [CLI Perangkat](/id/cli/devices).

## Peran

Setiap klien WebSocket Gateway terhubung dengan satu peran:

- `operator`: klien bidang kontrol seperti CLI, UI Kontrol, otomatisasi, dan
  proses pembantu tepercaya.
- `node`: host kapabilitas (macOS, iOS, Android, headless) yang mengekspos
  perintah melalui `node.invoke`.

Metode RPC operator memerlukan peran `operator`; metode yang berasal dari node
memerlukan peran `node`.

## Tingkat cakupan

| Cakupan                 | Arti                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Status hanya-baca, daftar, katalog, log, pembacaan sesi, dan panggilan lain yang tidak mengubah data.                                                         |
| `operator.write`        | Tindakan operator yang mengubah data: mengirim pesan, menjalankan alat, memperbarui pengaturan bicara/suara, meneruskan perintah node. Juga memenuhi `operator.read`. |
| `operator.admin`        | Akses administratif. Memenuhi setiap cakupan `operator.*`. Diperlukan untuk perubahan konfigurasi, pembaruan, hook native, namespace khusus, dan persetujuan berisiko tinggi. |
| `operator.pairing`      | Pengelolaan pemasangan perangkat dan node: mencantumkan, menyetujui, menolak, menghapus, merotasi, mencabut.                                                   |
| `operator.approvals`    | API persetujuan eksekusi dan Plugin.                                                                                                                          |
| `operator.talk.secrets` | Membaca konfigurasi Talk dengan menyertakan secret.                                                                                                            |

Cakupan `operator.*` mendatang yang tidak dikenal memerlukan kecocokan persis, kecuali pemanggil
sudah memiliki `operator.admin`.

## Cakupan metode hanyalah gerbang pertama

Setiap RPC Gateway memiliki cakupan metode dengan hak akses minimum yang menentukan apakah
permintaan dapat mencapai handler-nya. Beberapa handler kemudian menerapkan pemeriksaan yang lebih ketat berdasarkan
hal konkret yang disetujui atau diubah:

- `device.pair.approve` dapat diakses dengan `operator.pairing`, tetapi persetujuan
  perangkat operator hanya dapat membuat atau mempertahankan cakupan yang sudah dimiliki pemanggil.
- `node.pair.approve` dapat diakses dengan `operator.pairing`, lalu memperoleh
  cakupan persetujuan tambahan dari daftar perintah yang dideklarasikan oleh node yang tertunda.
- `chat.send` adalah metode dengan cakupan tulis, tetapi perintah obrolan
  `/config set` dan `/config unset` memerlukan `operator.admin` sebagai tambahan,
  terlepas dari cakupan pengiriman obrolan milik pemanggil.

Hal ini memungkinkan operator dengan cakupan lebih rendah melakukan tindakan pemasangan berisiko rendah tanpa
mengharuskan semua persetujuan pemasangan hanya dapat dilakukan oleh admin.

## Persetujuan pemasangan perangkat

Catatan pemasangan perangkat adalah sumber permanen bagi peran dan cakupan yang disetujui.
Perangkat yang sudah dipasangkan tidak memperoleh akses lebih luas secara diam-diam: koneksi ulang
yang meminta peran atau cakupan lebih luas akan membuat permintaan peningkatan baru yang tertunda.

Saat menyetujui permintaan perangkat:

- Permintaan tanpa peran operator tidak memerlukan persetujuan cakupan operator.
- Permintaan untuk peran perangkat non-operator (misalnya `node`) memerlukan
  `operator.admin`, meskipun `device.pair.approve` sendiri hanya memerlukan
  `operator.pairing`.
- Permintaan untuk `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing`, atau `operator.talk.secrets` mengharuskan pemanggil sudah
  memiliki cakupan tersebut, atau `operator.admin`.
- Permintaan untuk `operator.admin` memerlukan `operator.admin`.
- Permintaan perbaikan tanpa cakupan eksplisit dapat mewarisi cakupan token operator
  yang sudah ada; jika token tersebut memiliki cakupan admin, persetujuan tetap memerlukan
  `operator.admin`.

Sesi shared-secret non-admin dan proxy tepercaya hanya dapat menyetujui
permintaan perangkat operator dalam cakupan operator yang dideklarasikan oleh sesi itu sendiri; persetujuan
peran non-operator hanya dapat dilakukan oleh admin, meskipun sesi tersebut dapat menggunakan
`operator.pairing` untuk keperluan lain.

Untuk sesi token perangkat yang dipasangkan, pengelolaan dibatasi pada diri sendiri kecuali pemanggil
memiliki `operator.admin`: pemanggil non-admin hanya melihat entri pemasangannya sendiri, dan
hanya dapat menyetujui, menolak, merotasi, mencabut, atau menghapus entri perangkatnya sendiri.

## Persetujuan pemasangan node

Metode lama `node.pair.*` menggunakan penyimpanan pemasangan node terpisah yang dimiliki Gateway.
Node WS menggunakan pemasangan perangkat (`role: node`) sebagai gantinya, tetapi kosakata persetujuan
yang sama tetap berlaku. Lihat [Pemasangan Gateway](/id/gateway/pairing) untuk mengetahui hubungan kedua
penyimpanan tersebut.

`node.pair.approve` memperoleh cakupan tambahan yang diperlukan dari daftar
perintah dalam permintaan tertunda:

| Perintah yang dideklarasikan                                                                                         | Cakupan yang diperlukan                |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| tidak ada                                                                                                            | `operator.pairing`                    |
| perintah node biasa                                                                                                  | `operator.pairing` + `operator.write` |
| `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir`, atau `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

Menyetujui deklarasi node tidak mengaktifkan perintah yang memiliki gerbang
daftar izin runtime terpisah. Misalnya, menyetujui node yang mendeklarasikan
`computer.act` memerlukan pemasangan serta cakupan tulis, tetapi hanya mencatat permukaan tersebut.
Administrator atau pemilik tetap harus mengaktifkan `computer.act`. Selama tetap
aktif, menjalankannya melalui metode `node.invoke` dengan cakupan tulis tidak
memerlukan cakupan admin untuk setiap tindakan.

Pemasangan node menetapkan identitas dan kepercayaan; hal tersebut tidak menggantikan kebijakan
persetujuan eksekusi `system.run` milik node itu sendiri.

## Autentikasi shared-secret

Autentikasi token/kata sandi Gateway bersama diperlakukan sebagai akses operator tepercaya untuk
Gateway tersebut. Permukaan HTTP yang kompatibel dengan OpenAI, `/tools/invoke`, dan endpoint HTTP
riwayat sesi memulihkan kumpulan lengkap cakupan operator default untuk
autentikasi bearer shared-secret, meskipun pemanggil mengirim cakupan deklaratif yang lebih sempit.

Mode yang menyertakan identitas, seperti autentikasi proxy tepercaya atau `none` ingress privat,
tetap dapat mematuhi cakupan eksplisit yang dideklarasikan. Gunakan Gateway terpisah untuk pemisahan
batas kepercayaan yang sesungguhnya.
