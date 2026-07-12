---
read_when:
    - Membuat atau menata ulang tab dan widget ruang kerja
    - Memungkinkan agen menyusun ruang kerja
    - Meninjau model persetujuan dan sandbox widget khusus
summary: Workspace yang Dapat Dikomposisikan oleh Agen di UI Kontrol
title: Ruang kerja
x-i18n:
    generated_at: "2026-07-12T14:48:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234baefc18be736599addeeb35f8404b617c1d8f07f058c4a02ec2615ca21aa0
    source_path: web/workspaces.md
    workflow: 16
---

Tab **Ruang Kerja** di [UI Kontrol](/id/web/control-ui) adalah antarmuka yang Anda dan agen Anda tata bersama. Tab, widget, posisinya pada kisi 12 kolom, dan pengikatan datanya berada dalam satu dokumen. Apa pun yang dapat mengedit dokumen tersebut dapat menyusun ruang kerja: Anda, CLI `openclaw workspaces`, atau agen yang memanggil alat `workspace_*`.

Setiap penulisan melewati jalur tervalidasi yang sama, sehingga tata letak milik manusia dan tata letak milik agen tidak dapat menyimpang. Setiap penulisan yang diterima menaikkan versi dan menyiarkan `plugin.workspaces.changed`, sehingga hasil edit agen muncul di peramban yang sudah terbuka tanpa perlu memuat ulang.

## Mengaktifkan Ruang Kerja

Plugin Ruang Kerja bawaan dinonaktifkan secara default. Di UI Kontrol, buka **Plugin**, temukan **Ruang Kerja**, lalu pilih **Aktifkan**. Anda juga dapat mengaktifkannya dari CLI:

```sh
openclaw plugins enable workspaces
```

Mengaktifkan plugin akan menambahkan tab **Ruang Kerja** serta menyediakan CLI `openclaw workspaces` dan alat agen `workspace_*`. Menonaktifkannya akan menghapus antarmuka tersebut tanpa menghapus basis data ruang kerja atau aset widget.

## Ruang kerja default

Saat pertama kali dimuat, Anda akan mendapatkan ruang kerja **Ikhtisar**: kartu biaya dan token, kesehatan instans, sesi, status cron, dan umpan aktivitas. Ini merupakan konten ruang kerja biasa — seret, ciutkan, sembunyikan, atau hapus.

## Widget bawaan

Sembilan widget tepercaya disertakan bersama plugin dan dirender sebagai UI pihak pertama:

`stat-card`, `markdown`, `table`, `iframe-embed`, `sessions`, `usage`, `cron`,
`instances`, `activity`.

Widget mendeklarasikan data melalui **pengikatan**; widget tidak pernah mengambil data sendiri:

| Pengikatan | Menghasilkan                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `static`    | Nilai literal yang disimpan dalam dokumen (maks. 8 KB).                                                       |
| `file`      | Berkas JSON, Markdown, atau CSV di bawah `<stateDir>/workspaces/data/`, yang secara opsional dipersempit dengan penunjuk JSON. |
| `rpc`       | Salah satu metode gateway hanya-baca dari daftar izin tetap, yang diuraikan oleh UI Kontrol tepercaya.        |

Pengikatan `file` adalah cara paling sederhana untuk memasukkan angka Anda sendiri ke ruang kerja: tulis berkas JSON ke direktori data dan arahkan `stat-card` ke berkas tersebut.

## Asal-usul

Tab dan widget membawa stempel `createdBy` — `user`, `system`, atau `agent:<id>` — yang ditetapkan berdasarkan pihak yang melakukan penulisan. Nilai ini tidak dapat diberikan oleh pemanggil, sehingga agen tidak dapat melabeli pekerjaannya sebagai milik Anda, dan cip "AI" pada widget buatan agen selalu benar-benar menunjukkan asalnya.

## Widget khusus

Agen dapat membuat widget HTML sungguhan dengan `workspace_widget_scaffold` (atau Anda dapat membuatnya dengan `openclaw workspaces widget-scaffold <name>`). Kode buatan agen diperlakukan sebagai kode berbahaya:

- Widget yang dibuat melalui scaffold masuk ke registri dengan status **tertunda**. Tidak ada iframe yang dibuat, dan rute aset mengembalikan 404 untuk berkasnya hingga operator menyetujuinya.
- Persetujuan merupakan keputusan terpisah dari pengeditan tata letak: `workspaces.widget.approve` memerlukan cakupan `operator.approvals`, yaitu cakupan yang sama yang melindungi persetujuan eksekusi.
- Widget yang disetujui dirender dalam `<iframe sandbox="allow-scripts">` — tidak pernah menggunakan `allow-same-origin` — sehingga origin-nya tidak transparan dan widget tidak dapat mengakses DOM, penyimpanan, atau kuki induknya.
- Asetnya disajikan dengan `connect-src 'none'`, yang memblokir jaringan skrip seperti `fetch`, XHR, dan WebSocket. Widget tidak memiliki kredensial dan tidak pernah berkomunikasi dengan gateway.
- Data hanya diteruskan kepadanya melalui jembatan `postMessage` berversi. Kode khusus dapat menerima pengikatan `static` yang dideklarasikan, yaitu nilai ruang kerja yang telah dibuat oleh agen atau operator. Pengikatan RPC dan berkas tetap berada dalam widget bawaan tepercaya: peramban mengizinkan turunan dalam sandbox menavigasi frame-nya sendiri, sehingga data berhak istimewa tidak pernah dikirim ke HTML buatan agen.

Mengirim perintah ke obrolan dari widget juga memerlukan kapabilitas manifes, konfirmasi untuk setiap pemanggilan yang mengutip teks persisnya, dan tunduk pada batas laju.

## CLI

```sh
openclaw workspaces tabs list
openclaw workspaces tabs create --title Financials
openclaw workspaces widget-scaffold revenue-chart --title "Revenue Chart"
openclaw workspaces widget-approve revenue-chart
```

`widget-approve` memerlukan perangkat yang dipasangkan dengan cakupan `operator.approvals`; persetujuan dari UI Kontrol tidak memerlukannya karena peramban sudah memiliki cakupan tersebut.

## Penyimpanan

Dokumen ruang kerja, registri widget khusus, dan cincin pembatalan berisi 20 entri berada di `<stateDir>/workspaces/workspaces.sqlite`. Aset widget buatan agen tetap berada di disk dalam `<stateDir>/workspaces/widgets/<name>/`, sedangkan data pengikatan berkas berada di `<stateDir>/workspaces/data/`, karena agen membuatnya dengan alat berkas biasa dan rute widget menyajikan byte-nya.
