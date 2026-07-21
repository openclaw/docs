---
read_when: You want agent sessions to run on ephemeral cloud machines instead of the Gateway host, or you are configuring cloudWorkers profiles.
sidebarTitle: Cloud Workers
status: active
summary: 'Kirim sesi ke mesin cloud sekali pakai: penyediaan, runtime pekerja, inferensi melalui proksi, dan hasil streaming'
title: Worker Cloud
x-i18n:
    generated_at: "2026-07-21T12:18:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4e81fb50512639b3b0e00522dea914533b596574f35baf304c932c2962ac103c
    source_path: gateway/cloud-workers.md
    workflow: 16
---

Cloud worker memungkinkan sesi menjalankan perulangan agennya pada mesin cloud sementara, sementara semua hal tentang sesi tetap berada di tempat biasanya: terlihat di bilah sisi, melakukan streaming secara langsung, dengan transkrip dimiliki oleh Gateway. Gateway menyewa sebuah mesin, memasang salinan OpenClaw yang versinya dipatok di dalamnya, menyinkronkan ruang kerja sesi, dan menyerahkan perulangan giliran kepada proses `openclaw worker` yang dibatasi. Panggilan model diproksikan kembali melalui Gateway, sehingga kredensial penyedia tidak pernah meninggalkan mesin Anda, dan penyimpanan cache prompt tetap berfungsi karena penyedia melihat satu aliran berkelanjutan.

Ketika pekerjaan selesai (atau mesin berhenti berfungsi), mesin tersebut dibuang. Status yang persisten — transkrip, commit ruang kerja, catatan penempatan — berada bersama Gateway.

<Note>
Cloud worker bersifat opsional dan tidak terlihat sampai Anda mengonfigurasi profil. Instalasi yang belum dikonfigurasi tidak melihat RPC, konfigurasi, atau UI baru.
</Note>

## Apa yang berjalan di mana

| Aspek                                                   | Lokasi                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Perulangan agen + alat (`exec`, `read`, `write`, `edit`, …) | Mesin cloud worker                                                               |
| Inferensi model dan kredensial penyedia                  | Gateway (diproksikan berdasarkan referensi `{provider, model}`)                  |
| Transkrip (persisten, penyimpanan sesi)                  | Gateway                                                                          |
| Streaming langsung ke bilah sisi                        | Fanout Gateway, menerima aliran peristiwa worker yang dapat diputar ulang        |
| Riwayat git ruang kerja                                  | Dibuat di mesin tanpa kredensial; Gateway mengambil alih commit dan memiliki push/PR |

Mesin tidak memerlukan port masuk selain `sshd`: Gateway membuat koneksi keluar melalui SSH yang dipatok, dan tunnel balik membawa WebSocket worker kembali. Penyedia Crabbox bawaan memaksakan rute SSH publik dan menonaktifkan pendaftaran Tailscale terkelola. Akses internet keluar bergantung pada kebijakan penyedia; profil AWS default dapat mengakses internet kecuali Anda membatasi jaringan atau grup keamanannya.

## Persyaratan

- Plugin penyedia worker. Plugin `crabbox` bawaan mengendalikan CLI [Crabbox](https://github.com/openclaw/crabbox), yang menjadi perantara penyewaan di berbagai backend cloud (AWS, Hetzner, dan lainnya). Biner `crabbox` harus berada di `PATH` (atau tetapkan `settings.binary`) dengan kredensial penyedia yang sudah dikonfigurasi. Penerimaan AWS memerlukan Crabbox 0.38.1 atau yang lebih baru.
- Untuk worker AWS Crabbox, `aws.instanceProfile` efektif harus kosong. Penyedia memeriksa `crabbox config show --json` sebelum alokasi, lalu mengharuskan `crabbox inspect --json` melaporkan `providerMetadata.instanceProfileAttached: false` dari `DescribeInstances` EC2. Penyewaan dengan peran instans atau tanpa metadata otoritatif dihentikan dan ditolak.
- Node.js pada mesin yang disewa. Image cloud dasar biasanya tidak menyertakannya — pasang Node.js dalam perintah `setup` profil.
- Sesi dengan worktree terkelola milik sesi (buat dengan `worktree: true`). Pengiriman memindahkan isi worktree tersebut; direktori biasa disinkronkan sebagai cerminan manifes.

## Konfigurasi

Tambahkan profil di bawah `cloudWorkers.profiles` dalam `openclaw.json`:

```json
{
  "cloudWorkers": {
    "profiles": {
      "aws": {
        "provider": "crabbox",
        "install": "bundle",
        "settings": {
          "provider": "aws",
          "class": "standard",
          "ttl": "8h",
          "idleTimeout": "45m",
          "setup": "test -x /usr/bin/node || (curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs)"
        }
      }
    }
  }
}
```

Bidang profil:

| Kunci      | Arti                                                                                                                                                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | ID penyedia worker yang didaftarkan oleh Plugin (`crabbox` untuk Plugin bawaan).                                                                                                                                               |
| `install`  | `bundle` (default) mengirim build Gateway yang sedang berjalan; `npm` memasang versi rilis Gateway yang sama persis dengan integritas yang dipatok. `npm` mengharuskan Gateway berjalan dari rilis terpaket. |
| `settings` | JSON milik penyedia. Untuk crabbox: `provider` (backend), `class` (kelas mesin), `ttl`, `idleTimeout` (durasi Go), `setup` opsional, dan jalur absolut `binary`. OpenClaw memaksakan SSH publik dan menonaktifkan Tailscale terkelola untuk penyewaan ini. |
| `lifetime` | Kebijakan tersimpan opsional (`idleTimeoutMinutes`, `maxLifetimeMinutes`).                                                                                                                                                                  |

### Perintah penyiapan

`settings.setup` berjalan pada mesin yang disewa setelah SSH siap dan sebelum OpenClaw dipasang. Perintah ini berjalan pada **setiap** upaya penyediaan (termasuk pemutaran ulang setelah pengiriman terinterupsi), sehingga harus idempoten — lindungi pemasangan dengan pemeriksaan `command -v`/`test -x` seperti dalam contoh. Jika penyiapan gagal, penyedia menghentikan penyewaan dan pengiriman gagal secara tertutup; tidak ada mesin setengah terkonfigurasi yang dibiarkan berjalan.

### Saluran instalasi

- **`bundle`** mengemas `dist` milik Gateway yang sedang berjalan, `package.json` yang telah dipangkas, dan paket ruang kerja apa pun yang dirujuk build, semuanya tercakup oleh hash konten. Mesin memverifikasi bundel asli berdasarkan hash tersebut, lalu memasang dependensi npm produksi (skrip dinonaktifkan). Beginilah cara menjalankan build pengembangan pada worker.
- **`npm`** membuktikan bahwa rilis tersedia di registry publik, mematok integritas SHA-512-nya, dan memasang `openclaw@<version>` yang sama persis dengan Gateway.

## Mengirim sesi

Di Control UI, buka **Sesi Baru**, pilih agen yang runtime terkonfigurasinya adalah OpenClaw, pilih target **Cloud · profil** yang telah dikonfigurasi dari menu **Di mana**, lalu mulai tugas. Pemilihan cloud mengaktifkan worktree terkelola yang diperlukan secara otomatis; Gateway membuat sesi, menyelesaikan pengiriman, dan baru kemudian mengirim giliran pertama. Lencana server di bilah sisi sesi menampilkan status penempatan persisten. Target cloud tidak ditawarkan untuk katalog sesi CLI eksternal.

Alur RPC yang setara adalah:

Buat sesi dengan worktree terkelola, lalu kirimkan sesi tersebut (RPC memerlukan `operator.admin` dan hanya tersedia ketika profil dikonfigurasi):

Cloud worker menjalankan runtime agen OpenClaw. Pilih `openai/*` atau model lain yang diresolusikan ke runtime tersebut; sesi yang dikonfigurasi untuk runtime CLI eksternal seperti `claude-cli` tidak dapat dikirim.

```bash
openclaw gateway call sessions.create \
  --params '{"key":"agent:main:big-refactor","worktree":true,"cwd":"/path/to/repo","worktreeName":"big-refactor"}'

openclaw gateway call sessions.dispatch \
  --timeout 1500000 \
  --params '{"key":"agent:main:big-refactor","profileId":"aws"}'
```

`sessions.dispatch` menutup penerimaan giliran lokal, menuntaskan pekerjaan aktif, menyediakan penyewaan, menjalankan penyiapan, melakukan bootstrap OpenClaw, menyinkronkan ruang kerja, dan kembali setelah penempatan mencapai kepemilikan worker `active`. Alokasikan beberapa menit untuk pengiriman pertama; penyewaan dan instalasi disimpan dalam cache jika didukung oleh penyedia. Setelah itu, berinteraksilah dengan sesi seperti biasa — giliran dirutekan ke worker secara otomatis.

Giliran worker yang selesai merekonsiliasi file ruang kerja yang memenuhi syarat dan dibatasi ukurannya kembali ke worktree terkelola sesi sebelum klaim giliran dilepas. Peristiwa terminal worker membuat pagar hasil tertunda yang persisten sebelum diakui. Gateway kemudian melakukan staging hasil cloud lengkap sebagai ref Git di bawah `refs/openclaw/worker-results/` sebelum menerapkannya, sehingga versi cloud tetap dapat dipulihkan meskipun Gateway berhenti selama penerapan. Hasil ruang kerja menggunakan semantik file Git: file biasa, bit executable, symlink, penambahan, perubahan, dan penghapusan dipertahankan, sedangkan direktori kosong dan mode direktori lainnya tidak. Perubahan file yang dihasilkan tetap berada dalam worktree terkelola untuk proses review dan commit normal.

Penerapan menggunakan manifes pada waktu pengiriman sebagai basis penggabungan. Perubahan khusus cloud diterapkan, perubahan khusus lokal tetap dipertahankan, dan jalur yang berubah di kedua sisi menggunakan kebijakan tiga arah yang mempertahankan versi lokal. Giliran yang berkonflik tetap selesai: transkrip melaporkan ringkasan jalur terbatas dan ref hasil yang telah di-stage, penempatan menampilkan konflik yang sama untuk Control UI, dan perubahan cloud yang tidak berkonflik tetap diterapkan. Pemberitahuan menyertakan `git show <ref>:<path>` untuk memeriksa file cloud yang ada dan perintah `git checkout <ref> -- <path>` dengan literal pathspec tingkat atas untuk mengambilnya dari direktori ruang kerja mana pun. Jalankan perintah dalam Bash atau zsh (Git Bash pada Windows). Jika pemeriksaan menyatakan jalur tidak ada, hasil cloud telah menghapusnya; verifikasi lalu hapus jalur lokal yang dipertahankan secara manual. Jika checkout melaporkan halangan file/direktori, pindahkan atau hapus jalur lokal yang menghalangi lalu coba lagi. Jika ref yang telah di-stage itu sendiri sudah tidak ada, anggap pemberitahuan telah kedaluwarsa dan jangan ubah jalur lokal. Ref yang telah di-stage dan berkonflik tetap tersedia setelah pagar giliran normal dilepas; hasil bersih berikutnya menghapus pemberitahuan dan menghentikan ref lama, sedangkan penghapusan pagar secara eksplisit menjadi batas pembersihan terakhir.

Selama hasil berpagar masih direkonsiliasi, giliran baru menunggu hingga 15 detik agar klaim sebelumnya dilepas. Jika masih sibuk, giliran gagal dengan pesan “hasil ruang kerja dari giliran cloud sebelumnya masih direkonsiliasi” yang dapat ditindaklanjuti dan dapat segera dicoba kembali. Saat dimulai ulang, pemulihan menemukan hasil tertunda dan hasil yang telah di-stage sebelum pembersihan klaim kedaluwarsa, menyelesaikan atau mencoba kembali penerapan lokalnya, dan mengambil kembali lingkungan yang mati hanya setelah hasil dipertahankan. Jurnal rollback SQLite terbatas membuat penerapan sistem file yang terinterupsi dapat dipulihkan tanpa memutar ulang mutasi yang sudah diterima.

Ketika pekerjaan selesai dan tidak ada giliran yang berjalan, buka menu sesi lalu pilih **Hentikan cloud worker…**. Gateway melakukan satu rekonsiliasi ruang kerja terakhir sebelum menghancurkan lingkungan. Penempatan yang sudah berada dalam `draining` atau `reconciling` sedang menyelesaikan penghentian; tunggu hingga lencananya menjadi `reclaimed` sebelum menghapus sesi.

Untuk worker terhubung yang rusak atau tidak terkendali, operator dapat memanggil `environments.destroy` dengan `{ "force": true }` sebagai upaya terakhir. Penghentian paksa menandai penempatan sebagai gagal secara persisten dan mengabaikan hasil jarak jauh yang belum direkonsiliasi sebelum menghancurkan lingkungan.

RPC administratif yang setara adalah:

```bash
openclaw gateway call sessions.reclaim \
  --timeout 600000 \
  --params '{"key":"agent:main:big-refactor"}'
```

Penempatan berjalan melalui mesin keadaan yang tahan lama (`local → requested → provisioning → syncing → starting → active`), sehingga Gateway yang dimulai ulang di tengah proses pengiriman akan melakukan rekonsiliasi alih-alih membiarkan mesin bocor. Giliran model yang gagal mempertahankan penempatan aktif agar tetap tersedia untuk dicoba kembali. Konflik jalur ruang kerja mempertahankan versi lokal, menerapkan bagian lain dari hasil cloud, dan menyimpan ref cloud yang telah disiapkan untuk diperiksa; kegagalan rekonsiliasi atau siklus hidup lainnya mempertahankan pagar pemulihan tahan lama dan bagian akhir diagnostiknya hingga pemulihan dapat mencoba kembali atau mengambil alih lingkungan dengan aman.

## Model keamanan

- **Ingress pekerja tertutup.** Pekerja berkomunikasi menggunakan protokol khusus pada soket yang disalurkan melalui terowongan dengan daftar izin metode yang tertutup — pekerja tidak dapat memanggil RPC operator.
- **Kredensial yang diterbitkan, di-hash saat disimpan.** Setiap pengiriman menerbitkan kredensial pekerja; Gateway hanya menyimpan hash-nya. Rotasi kredensial dan pemagaran epoch pemilik menjamin bahwa paling banyak hanya ada satu pemilik aktif per sesi — pekerja usang yang terhubung kembali akan dipagari, tidak pernah digabungkan.
- **Penyematan kunci host.** Penyedia harus menyediakan kunci host SSH milik box saat penyediaan; bootstrap terhubung dengan penyematan ketat dan gagal secara tertutup jika kunci tersebut tidak tersedia.
- **Tidak ada kredensial model, forge, atau cloud yang tersimpan permanen di box.** Autentikasi model tetap berada di Gateway (inferensi dikirim melalui referensi `{provider, model}`), commit git ruang kerja dibuat tanpa kredensial forge, dan metadata sewa AWS Crabbox diperiksa secara otoritatif untuk memastikan keberadaan peran instans sebelum penyiapan. Pastikan juga perintah penyiapan bebas dari kredensial.
- **Egress yang dimiliki penyedia.** Terowongan balik menghilangkan kebutuhan OpenClaw untuk mengakses model secara langsung, tetapi OpenClaw tidak menulis ulang firewall penyedia. Batasi lalu lintas keluar di penyedia pekerja saat tugas mengharuskannya.
- **Transkrip yang tahan lama dan tepat satu kali.** Pekerja melakukan commit batch transkrip melalui protokol bandingkan-dan-tukar terhadap leaf sesi; basis usang akan menghentikan proses secara paksa alih-alih menduplikasi atau melakukan rebase pada keluaran berbayar.

## Pemecahan masalah

- **`sessions.dispatch` adalah metode yang tidak dikenal** — tidak ada `cloudWorkers.profiles` yang dikonfigurasi, atau pemanggil tidak memiliki `operator.admin`.
- **"Giliran pekerja cloud memerlukan runtime OpenClaw"** — pilih model dengan runtime yang dikonfigurasi sebagai OpenClaw. Runtime CLI eksternal seperti `claude-cli` tidak mendukung inferensi pekerja.
- **"Bootstrap pekerja memerlukan Node.js pada host yang disewa"** — tambahkan instalasi Node ke `settings.setup` (lihat di atas).
- **Atestasi peran instans AWS gagal** — hapus `aws.instanceProfile` (dan `CRABBOX_AWS_INSTANCE_PROFILE`, jika ditetapkan). Instal Crabbox 0.38.1 atau yang lebih baru; biner lama tidak menyediakan kontrak `providerMetadata.instanceProfileAttached` otoritatif yang diperlukan untuk penerimaan AWS.
- **Pengiriman gagal dengan kesalahan penyedia** — catatan penempatan dan `environments.list` menyimpan kesalahan terakhir, termasuk bagian akhir stderr penyiapan/bootstrap. Box dimusnahkan saat terjadi kegagalan, sehingga bagian akhir tersebut menjadi sumber forensik utama.
- **Waktu tunggu klien habis saat melakukan pengiriman** — `openclaw gateway call` secara default memiliki batas waktu 10s; berikan `--timeout` dengan nilai yang cukup besar (pengiriman tetap berjalan di sisi server dalam kedua kondisi tersebut, dan percobaan ulang selama penyediaan ditolak dengan `session cannot dispatch from placement provisioning`).
- **Pemberitahuan konflik ruang kerja cloud** — giliran telah selesai dan mempertahankan versi lokal dari setiap jalur yang tercantum. Gunakan perintah ref yang telah disiapkan dalam pemberitahuan untuk memeriksa atau mengambil versi cloud; perubahan yang tidak berkonflik tidak perlu dicoba ulang karena sudah diterapkan.
- **“Hasil ruang kerja dari giliran cloud sebelumnya masih direkonsiliasi”** — Gateway menunggu sebentar hingga pagar tahan lama hasil sebelumnya tersedia dan tidak dapat memperoleh klaim sesi. Tunggu hingga rekonsiliasi selesai, lalu coba kembali giliran tersebut; memulai ulang Gateway aman karena pemulihan mempertahankan hasil yang telah disiapkan sebelum mengambil alih pekerja yang mati.
- **Pemeliharaan sewa** — `crabbox list --provider <backend>` menampilkan sewa aktif; `crabbox stop --provider <backend> --id <lease>` melepaskan satu sewa secara manual. Sewa menganggur kedaluwarsa berdasarkan `idleTimeout` milik profil.

## Terkait

- [Sandboxing](/id/gateway/sandboxing) — mengurangi radius dampak untuk eksekusi alat lokal
- [CLI sesi](/id/cli/sessions) — memeriksa sesi yang tersimpan
- [Referensi konfigurasi](/id/gateway/configuration-reference)
