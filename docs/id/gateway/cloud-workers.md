---
read_when: You want agent sessions to run on ephemeral cloud machines instead of the Gateway host, or you are configuring cloudWorkers profiles.
sidebarTitle: Cloud Workers
status: active
summary: 'Distribusikan sesi ke mesin cloud sementara: penyediaan, runtime pekerja, inferensi melalui proksi, dan hasil streaming'
title: Worker Cloud
x-i18n:
    generated_at: "2026-07-16T18:07:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c20b3b4f1408ed3ef0beb155a207f99476323cf67eba7b44931eec32c79e52be
    source_path: gateway/cloud-workers.md
    workflow: 16
---

Worker cloud memungkinkan suatu sesi menjalankan loop agennya pada mesin cloud sementara, sementara semua hal mengenai sesi tetap berada di tempat biasanya: terlihat di bilah samping, melakukan streaming langsung, dengan transkrip dimiliki oleh Gateway. Gateway menyewa sebuah mesin, memasang salinan OpenClaw yang versinya dipatok di mesin tersebut, menyinkronkan ruang kerja sesi ke sana, dan menyerahkan loop giliran kepada proses `openclaw worker` yang dibatasi. Panggilan model diproksikan kembali melalui Gateway, sehingga kredensial penyedia tidak pernah meninggalkan mesin Anda, dan caching prompt tetap berfungsi karena penyedia melihat satu aliran berkelanjutan.

Setelah pekerjaan selesai (atau mesin mati), mesin tersebut dibuang. Status yang tahan lama — transkrip, commit ruang kerja, catatan penempatan — berada bersama Gateway.

<Note>
Worker cloud bersifat opsional dan tidak terlihat hingga Anda mengonfigurasi profil. Instalasi yang belum dikonfigurasi tidak melihat RPC, konfigurasi, atau UI baru.
</Note>

## Apa yang berjalan di mana

| Aspek                                                   | Lokasi                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Loop agen + alat (`exec`, `read`, `write`, `edit`, …) | Mesin worker cloud                                                               |
| Inferensi model dan kredensial penyedia                  | Gateway (diproksikan oleh referensi `{provider, model}`)                          |
| Transkrip (tahan lama, penyimpanan sesi)                 | Gateway                                                                          |
| Streaming langsung ke bilah samping                     | Fanout Gateway, menerima aliran peristiwa worker yang dapat diputar ulang        |
| Riwayat git ruang kerja                                  | Dibuat di mesin tanpa kredensial; Gateway mengadopsi commit serta memiliki push/PR |

Mesin tidak memerlukan port masuk selain `sshd`: Gateway membuat koneksi keluar melalui SSH yang dipatok, dan terowongan balik membawa WebSocket worker kembali. Penyedia Crabbox bawaan mewajibkan rute SSH publik dan menonaktifkan pendaftaran Tailscale terkelola. Akses internet keluar merupakan kebijakan penyedia; profil AWS default dapat mengakses internet kecuali Anda membatasi jaringan atau grup keamanannya.

## Persyaratan

- Plugin penyedia worker. Plugin `crabbox` bawaan mengendalikan CLI [Crabbox](https://github.com/openclaw/crabbox), yang menjadi perantara penyewaan di berbagai backend cloud (AWS, Hetzner, dan lainnya). Biner `crabbox` harus tersedia di `PATH` (atau tetapkan `settings.binary`) dengan kredensial penyedia yang telah dikonfigurasi. Penerimaan AWS memerlukan Crabbox 0.38.1 atau yang lebih baru.
- Untuk worker Crabbox AWS, nilai efektif `aws.instanceProfile` harus kosong. Penyedia memeriksa `crabbox config show --json` sebelum alokasi, kemudian mewajibkan `crabbox inspect --json` untuk melaporkan `providerMetadata.instanceProfileAttached: false` dari `DescribeInstances` EC2. Penyewaan dengan peran instans atau tanpa metadata otoritatif dihentikan dan ditolak.
- Node.js pada mesin yang disewa. Image cloud dasar biasanya tidak menyediakannya — pasang melalui perintah `setup` profil.
- Sesi dengan worktree terkelola milik sesi (buat dengan `worktree: true`). Pengiriman memindahkan isi worktree tersebut; direktori biasa disinkronkan sebagai cermin manifes.

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

Kolom profil:

| Kunci      | Arti                                                                                                                                                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | ID penyedia worker yang didaftarkan oleh Plugin (`crabbox` untuk Plugin bawaan).                                                                                                                                                             |
| `install`  | `bundle` (default) mengirim build Gateway yang sedang berjalan; `npm` memasang versi rilis Gateway yang sama persis dengan integritas yang dipatok. `npm` mengharuskan Gateway dijalankan dari rilis terpaket.                    |
| `settings` | JSON milik penyedia. Untuk crabbox: `provider` (backend), `class` (kelas mesin), `ttl`, `idleTimeout` (durasi Go), `setup` opsional, serta path absolut `binary`. OpenClaw mewajibkan SSH publik dan menonaktifkan Tailscale terkelola untuk penyewaan ini. |
| `lifetime` | Kebijakan tersimpan opsional (`idleTimeoutMinutes`, `maxLifetimeMinutes`).                                                                                                                                                                    |

### Perintah penyiapan

`settings.setup` berjalan pada mesin yang disewa setelah siap menerima SSH dan sebelum OpenClaw dipasang. Perintah ini berjalan pada **setiap** upaya penyediaan (termasuk pemutaran ulang setelah pengiriman terinterupsi), sehingga harus idempoten — lindungi pemasangan dengan pemeriksaan `command -v`/`test -x` seperti dalam contoh. Jika penyiapan gagal, penyedia menghentikan penyewaan dan pengiriman gagal secara tertutup; tidak ada mesin yang dikonfigurasi sebagian dibiarkan berjalan.

### Saluran pemasangan

- **`bundle`** mengemas `dist` milik Gateway yang sedang berjalan, `package.json` yang telah dipangkas, serta semua paket ruang kerja yang dirujuk oleh build, semuanya dicakup oleh hash konten. Mesin memverifikasi bundel yang belum diubah terhadap hash tersebut, lalu memasang dependensi npm produksi (skrip dinonaktifkan). Inilah cara menjalankan build pengembangan pada worker.
- **`npm`** membuktikan bahwa rilis tersedia di registri publik, mematok integritas SHA-512-nya, dan memasang `openclaw@<version>` yang sama persis dengan Gateway.

## Mengirim sesi

Di UI Kontrol, buka **Sesi Baru**, pilih agen yang runtime terkonfigurasinya adalah OpenClaw, pilih target **Cloud · profil** yang telah dikonfigurasi dari menu **Lokasi**, lalu mulai tugas. Pemilihan cloud mengaktifkan worktree terkelola yang diperlukan secara otomatis; Gateway membuat sesi, menyelesaikan pengiriman, dan baru kemudian mengirim giliran pertama. Lencana server di bilah samping sesi menampilkan status penempatan yang tahan lama. Target cloud tidak ditawarkan untuk katalog sesi CLI eksternal.

Alur RPC yang setara adalah:

Buat sesi dengan worktree terkelola, lalu kirim sesi tersebut (RPC memerlukan `operator.admin` dan hanya tersedia jika profil telah dikonfigurasi):

Worker cloud menjalankan runtime agen OpenClaw. Pilih `openai/*` atau model lain yang diselesaikan ke runtime tersebut; sesi yang dikonfigurasi untuk runtime CLI eksternal seperti `claude-cli` tidak dapat dikirim.

```bash
openclaw gateway call sessions.create \
  --params '{"key":"agent:main:big-refactor","worktree":true,"cwd":"/path/to/repo","worktreeName":"big-refactor"}'

openclaw gateway call sessions.dispatch \
  --timeout 1500000 \
  --params '{"key":"agent:main:big-refactor","profileId":"aws"}'
```

`sessions.dispatch` menutup penerimaan giliran lokal, menguras pekerjaan aktif, menyediakan penyewaan, menjalankan penyiapan, melakukan bootstrap OpenClaw, menyinkronkan ruang kerja, dan kembali setelah penempatan mencapai kepemilikan worker `active`. Alokasikan beberapa menit untuk pengiriman pertama; penyewaan dan pemasangan di-cache jika didukung oleh penyedia. Setelah itu, berinteraksilah dengan sesi seperti biasa — giliran dirutekan ke worker secara otomatis.

Giliran worker yang selesai merekonsiliasi file ruang kerja yang memenuhi syarat dan dibatasi ukurannya kembali ke worktree terkelola sesi sebelum klaim giliran dilepas. Peristiwa terminal worker membuat pembatas hasil tertunda yang tahan lama sebelum diakui, sehingga pemulihan setelah Gateway dimulai ulang menarik ruang kerja jarak jauh kembali sebelum pembersihan giliran kedaluwarsa dapat menghancurkan pemiliknya. Rekonsiliasi mengautentikasi manifes worker dan berhenti jika terdapat divergensi lokal, alih-alih menimpa salah satu sisi. Sebelum mengubah file, Gateway menyimpan jurnal pemulihan berukuran terbatas di basis data status SQLite; upaya ulang memulihkan jurnal tersebut setelah proses Gateway terinterupsi. Hasil ruang kerja menggunakan semantik file Git: file biasa, bit executable, symlink, penambahan, perubahan, dan penghapusan dipertahankan, sedangkan direktori kosong dan mode direktori lainnya tidak. Objek commit jarak jauh tidak dipertahankan; perubahan file yang dihasilkan tetap berada di worktree terkelola untuk ditinjau dan di-commit seperti biasa.

Setelah pekerjaan selesai dan tidak ada giliran yang berjalan, buka menu sesi lalu pilih **Hentikan worker cloud…**. Gateway melakukan satu rekonsiliasi ruang kerja terakhir sebelum menghancurkan lingkungan. Penempatan yang sudah berada di `draining` atau `reconciling` sedang menyelesaikan pembongkaran; tunggu hingga lencananya menjadi `reclaimed` sebelum menghapus sesi.

Untuk worker terpasang yang rusak atau tidak terkendali, operator dapat memanggil `environments.destroy` dengan `{ "force": true }` sebagai upaya terakhir. Pembongkaran paksa menandai penempatan sebagai gagal secara tahan lama dan mengabaikan hasil jarak jauh yang belum direkonsiliasi sebelum menghancurkan lingkungan.

RPC administratif yang setara adalah:

```bash
openclaw gateway call sessions.reclaim \
  --timeout 600000 \
  --params '{"key":"agent:main:big-refactor"}'
```

Penempatan bergerak melalui mesin status yang tahan lama (`local → requested → provisioning → syncing → starting → active`), sehingga Gateway yang dimulai ulang di tengah pengiriman akan melakukan rekonsiliasi, bukan membocorkan mesin. Giliran model yang gagal mempertahankan penempatan aktif agar dapat dicoba ulang. Jika rekonsiliasi ruang kerja masuk gagal, worker juga tetap aktif sehingga operator dapat menyelesaikan konflik lokal dan mencoba ulang tanpa kehilangan hasil jarak jauh; kegagalan siklus hidup akan memindahkan penempatan ke status kesalahan atau telah direklamasi serta mempertahankan bagian akhir diagnostiknya.

## Model keamanan

- **Ingress worker tertutup.** Worker berkomunikasi menggunakan protokol khusus pada soket yang diterowongkan dengan daftar metode yang diizinkan secara tertutup — worker tidak dapat memanggil RPC operator.
- **Kredensial yang diterbitkan, disimpan dalam bentuk hash.** Setiap pengiriman menerbitkan kredensial worker; Gateway hanya menyimpan hash-nya. Rotasi kredensial dan pembatasan epoch pemilik menjamin paling banyak satu pemilik aktif per sesi — worker kedaluwarsa yang terhubung kembali akan dibatasi, tidak pernah digabungkan.
- **Pemacangan kunci host.** Penyedia harus menampilkan kunci host SSH mesin saat penyediaan; bootstrap terhubung menggunakan pemacangan ketat dan gagal secara tertutup jika kunci tersebut tidak tersedia.
- **Tidak ada kredensial model, forge, atau cloud yang menetap di mesin.** Autentikasi model tetap berada di Gateway (inferensi dikirim melalui referensi `{provider, model}`), commit git ruang kerja dibuat tanpa kredensial forge, dan metadata penyewaan Crabbox AWS diperiksa secara otoritatif untuk mendeteksi peran instans sebelum penyiapan. Pastikan juga perintah penyiapan bebas kredensial.
- **Egress milik penyedia.** Terowongan balik meniadakan kebutuhan OpenClaw akan akses model langsung, tetapi OpenClaw tidak menulis ulang firewall penyedia. Batasi lalu lintas keluar di penyedia worker jika tugas memerlukannya.
- **Transkrip tahan lama, tepat satu kali.** Worker melakukan commit batch transkrip melalui protokol compare-and-swap terhadap leaf sesi; basis kedaluwarsa akan menghentikan proses secara paksa, alih-alih menduplikasi atau melakukan rebase pada keluaran berbayar.

## Pemecahan masalah

- **`sessions.dispatch` adalah metode yang tidak dikenal** — tidak ada `cloudWorkers.profiles` yang dikonfigurasi, atau pemanggil tidak memiliki `operator.admin`.
- **"Giliran pekerja cloud memerlukan runtime OpenClaw"** — pilih model yang runtime terkonfigurasinya adalah OpenClaw. Runtime CLI eksternal seperti `claude-cli` tidak mendukung inferensi pekerja.
- **"Bootstrap pekerja memerlukan Node.js pada host yang disewa"** — tambahkan instalasi Node ke `settings.setup` (lihat di atas).
- **Atestasi peran instans AWS gagal** — kosongkan `aws.instanceProfile` (dan `CRABBOX_AWS_INSTANCE_PROFILE`, jika ditetapkan). Instal Crabbox 0.38.1 atau yang lebih baru; biner lama tidak mengekspos kontrak `providerMetadata.instanceProfileAttached` otoritatif yang diperlukan untuk penerimaan AWS.
- **Pengiriman gagal dengan kesalahan penyedia** — catatan penempatan dan `environments.list` menyimpan kesalahan terakhir, termasuk bagian akhir stderr penyiapan/bootstrap. Box dimusnahkan saat terjadi kegagalan, sehingga bagian akhir tersebut menjadi bukti forensik utama.
- **Batas waktu klien habis saat mengirim** — `openclaw gateway call` secara default memiliki batas waktu 10 detik; berikan `--timeout` dengan nilai yang cukup besar (pengiriman tetap berjalan di sisi server dalam kedua kasus, dan percobaan ulang saat penyediaan sedang berlangsung ditolak dengan `session cannot dispatch from placement provisioning`).
- **Pemeliharaan sewa** — `crabbox list --provider <backend>` menampilkan sewa aktif; `crabbox stop --provider <backend> --id <lease>` melepaskan satu sewa secara manual. Sewa yang tidak aktif kedaluwarsa sesuai `idleTimeout` profil.

## Terkait

- [Sandboxing](/id/gateway/sandboxing) — mengurangi radius dampak untuk eksekusi alat lokal
- [CLI Sesi](/id/cli/sessions) — memeriksa sesi yang tersimpan
- [Referensi konfigurasi](/id/gateway/configuration-reference)
