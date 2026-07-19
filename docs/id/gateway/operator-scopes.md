---
read_when:
    - Men-debug kesalahan cakupan operator yang hilang
    - Meninjau persetujuan pemasangan perangkat atau node
    - Menambahkan atau mengklasifikasikan metode RPC Gateway
summary: Peran operator, cakupan, dan pemeriksaan saat persetujuan untuk klien Gateway
title: Cakupan operator
x-i18n:
    generated_at: "2026-07-19T04:56:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 40053793bb5a80afab28fdfcdcac6565abde6bca988389b03a407272c70043e2
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Cakupan operator membatasi apa yang dapat dilakukan klien Gateway setelah melakukan autentikasi.
Cakupan tersebut merupakan pagar pengaman bidang kontrol dalam satu domain operator Gateway tepercaya,
bukan isolasi multipenyewa yang tahan terhadap pihak bermusuhan. Untuk pemisahan yang kuat antara orang,
tim, atau mesin, jalankan Gateway terpisah di bawah pengguna OS atau host yang terpisah.

Terkait: [Keamanan](/id/gateway/security), [Protokol Gateway](/id/gateway/protocol),
[Pemasangan Gateway](/id/gateway/pairing), [CLI Perangkat](/id/cli/devices).

## Peran

Setiap klien WebSocket Gateway terhubung dengan satu peran:

- `operator`: klien bidang kontrol seperti CLI, UI Kontrol, otomatisasi, dan
  proses pembantu tepercaya.
- `node`: host kapabilitas (macOS, iOS, Android, tanpa antarmuka grafis) yang mengekspos
  perintah melalui `node.invoke`.

Metode RPC operator memerlukan peran `operator`; metode yang berasal dari node
memerlukan peran `node`.

## Tingkat cakupan

| Cakupan                 | Arti                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Status hanya-baca, daftar, katalog, log, pembacaan sesi, dan panggilan lain yang tidak mengubah data.                                                         |
| `operator.write`        | Tindakan operator yang mengubah data: mengirim pesan, memanggil alat, memperbarui pengaturan percakapan/suara, meneruskan perintah node. Juga memenuhi `operator.read`. |
| `operator.admin`        | Akses administratif. Memenuhi setiap cakupan `operator.*`. Diperlukan untuk perubahan konfigurasi, pembaruan, hook native, namespace yang dicadangkan, dan persetujuan berisiko tinggi. |
| `operator.pairing`      | Pengelolaan pemasangan perangkat dan node: mencantumkan, menyetujui, menolak, menghapus, merotasi, mencabut.                                                   |
| `operator.approvals`    | API persetujuan eksekusi dan plugin.                                                                                                                          |
| `operator.questions`    | Mencantumkan, membaca, menjawab, dan menyelesaikan pertanyaan interaktif.                                                                                      |
| `operator.talk.secrets` | Membaca konfigurasi Percakapan dengan menyertakan rahasia.                                                                                                    |

Cakupan `operator.*` mendatang yang tidak dikenal memerlukan kecocokan persis kecuali pemanggil
sudah memiliki `operator.admin`.

## Cakupan metode hanyalah gerbang pertama

Setiap RPC Gateway memiliki cakupan metode dengan hak akses minimum yang menentukan apakah
permintaan mencapai handler-nya. Metode yang memperhitungkan parameter memperoleh cakupan tersebut sebelum
pengiriman sehingga kegagalan otorisasi memiliki satu respons terstruktur kanonis:

- `agent` memerlukan `operator.write` untuk giliran biasa dan `operator.admin` untuk
  perintah siklus hidup sesi `/new` atau `/reset`.
- `node.invoke` memerlukan `operator.write` untuk perintah penerusan biasa dan
  `operator.admin` untuk `browser.proxy`, `fs.listDir`, dan `terminal.upload`.
- `talk.config` memerlukan `operator.read`; `includeSecrets: true` juga memerlukan
  `operator.talk.secrets`.

Beberapa handler kemudian menerapkan pemeriksaan yang lebih ketat berdasarkan hal konkret yang
disetujui atau diubah:

- `device.pair.approve` dapat dicapai dengan `operator.pairing`, tetapi menyetujui
  perangkat operator hanya dapat menerbitkan atau mempertahankan cakupan yang sudah dimiliki pemanggil.
- `node.pair.approve` dapat dicapai dengan `operator.pairing`, lalu memperoleh cakupan
  persetujuan tambahan dari daftar perintah yang dideklarasikan oleh node tertunda.
- `chat.send` adalah metode bercakupan tulis, tetapi perintah percakapan
  `/config set` dan `/config unset` memerlukan `operator.admin` sebagai tambahan,
  terlepas dari cakupan pengiriman percakapan milik pemanggil.

Hal ini memungkinkan operator dengan cakupan lebih rendah melakukan tindakan pemasangan berisiko rendah tanpa
menjadikan semua persetujuan pemasangan hanya dapat dilakukan oleh administrator.

RPC perubahan sesi diotorisasi berdasarkan cakupan operator yang dinegosiasikan,
terlepas dari `client.id` atau `client.mode` milik klien yang terhubung. Identitas klien
tetap dapat memengaruhi kebijakan koneksi dan autentikasi perangkat, tetapi tidak
memberikan maupun menghapus kewenangan untuk mengubah sesi.

## Persetujuan pemasangan perangkat

Catatan pemasangan perangkat merupakan sumber persisten untuk peran dan cakupan yang disetujui.
Perangkat yang telah dipasangkan tidak memperoleh akses lebih luas secara diam-diam: koneksi ulang
yang meminta peran atau cakupan lebih luas membuat permintaan peningkatan tertunda baru.

Menyetujui permintaan perangkat:

- Permintaan tanpa peran operator tidak memerlukan persetujuan cakupan operator.
- Permintaan untuk peran perangkat nonoperator (misalnya `node`) memerlukan
  `operator.admin`, meskipun `device.pair.approve` sendiri hanya memerlukan
  `operator.pairing`.
- Permintaan untuk `operator.read`, `operator.write`, `operator.approvals`,
  `operator.questions`, `operator.pairing`, atau `operator.talk.secrets` mengharuskan
  pemanggil sudah memiliki cakupan tersebut, atau `operator.admin`.
- Permintaan untuk `operator.admin` memerlukan `operator.admin`.
- Permintaan perbaikan tanpa cakupan eksplisit dapat mewarisi cakupan token
  operator yang ada; jika token tersebut bercakupan admin, persetujuan tetap memerlukan
  `operator.admin`.

Sesi rahasia bersama dan proksi tepercaya nonadmin hanya dapat menyetujui
permintaan perangkat operator dalam cakupan operator yang mereka deklarasikan sendiri; menyetujui
peran nonoperator hanya dapat dilakukan oleh admin meskipun sesi tersebut dapat menggunakan
`operator.pairing` untuk hal lain.

Untuk sesi token perangkat yang dipasangkan, pengelolaan dibatasi pada diri sendiri kecuali pemanggil
memiliki `operator.admin`: pemanggil nonadmin hanya melihat entri pemasangannya sendiri, dan
hanya dapat menyetujui, menolak, merotasi, mencabut, atau menghapus entri perangkatnya sendiri.

## Persetujuan pemasangan node

Metode `node.pair.*` lama menggunakan penyimpanan pemasangan node terpisah yang dimiliki Gateway.
Node WS menggunakan pemasangan perangkat (`role: node`) sebagai gantinya, tetapi kosakata
persetujuan yang sama berlaku. Lihat [Pemasangan Gateway](/id/gateway/pairing) untuk mengetahui hubungan kedua
penyimpanan tersebut.

`node.pair.approve` memperoleh cakupan tambahan yang diperlukan dari daftar
perintah permintaan tertunda:

| Perintah yang dideklarasikan                                                                                         | Cakupan yang diperlukan                 |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| tidak ada                                                                                                            | `operator.pairing`                      |
| perintah node biasa                                                                                                  | `operator.pairing` + `operator.write` |
| `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir`, atau `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

Menyetujui deklarasi node tidak mengaktifkan perintah yang memiliki gerbang daftar izin
runtime terpisah. Misalnya, menyetujui node yang mendeklarasikan
`computer.act` memerlukan pemasangan beserta cakupan tulis, tetapi hanya mencatat permukaan tersebut.
Administrator atau pemilik tetap harus mengaktifkan `computer.act`. Selama tetap
aktif, pemanggilannya melalui `node.invoke` memerlukan cakupan tulis, tetapi tidak memerlukan cakupan
admin untuk setiap tindakan.

Pemasangan node menetapkan identitas dan kepercayaan; hal tersebut tidak menggantikan kebijakan
persetujuan eksekusi `system.run` milik node itu sendiri.

## Autentikasi rahasia bersama

Autentikasi token/kata sandi gateway bersama diperlakukan sebagai akses operator tepercaya untuk
Gateway tersebut. Permukaan HTTP yang kompatibel dengan OpenAI, `/tools/invoke`, dan endpoint HTTP
riwayat sesi memulihkan kumpulan cakupan operator default lengkap untuk
autentikasi bearer rahasia bersama, meskipun pemanggil mengirim cakupan yang dideklarasikan lebih sempit.

Mode yang membawa identitas, seperti autentikasi proksi tepercaya atau `none` ingress privat,
tetap dapat mematuhi cakupan eksplisit yang dideklarasikan. Gunakan Gateway terpisah untuk pemisahan
batas kepercayaan yang nyata.
