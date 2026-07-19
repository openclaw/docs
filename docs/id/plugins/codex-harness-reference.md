---
read_when:
    - Anda memerlukan setiap bidang konfigurasi harness Codex
    - Anda mengubah perilaku transport, autentikasi, penemuan, atau batas waktu app-server
    - Anda sedang men-debug startup harness Codex, penemuan model, atau isolasi lingkungan
summary: Referensi konfigurasi, autentikasi, penemuan, dan server aplikasi untuk harness Codex
title: Referensi harness Codex
x-i18n:
    generated_at: "2026-07-19T05:10:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f55db3e8850c574dd2cbb69ec55fb584ee16055eb4d3751946f0e7fa809a8175
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Referensi ini mencakup konfigurasi terperinci untuk plugin resmi `codex`.
Untuk keputusan penyiapan dan perutean, mulai dengan
[harness Codex](/id/plugins/codex-harness).

## Permukaan konfigurasi plugin

Semua pengaturan harness Codex berada di bawah `plugins.entries.codex.config`.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

Bidang tingkat atas:

| Bidang                     | Default                  | Arti                                                                                                                                           |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | diaktifkan               | Pengaturan penemuan model untuk `model/list` app-server Codex.                                                                                    |
| `appServer`                | app-server stdio terkelola | Pengaturan transportasi, perintah, autentikasi, persetujuan, sandbox, dan batas waktu. Harness biasa secara default menggunakan status yang dicakup per agen. |
| `codexDynamicToolsLoading` | `"searchable"`           | Gunakan `"direct"` untuk menempatkan alat dinamis OpenClaw langsung dalam konteks alat awal Codex.                                             |
| `codexDynamicToolsExclude` | `[]`                     | Nama alat dinamis OpenClaw tambahan yang akan dihilangkan dari giliran app-server Codex.                                                        |
| `codexPlugins`             | dinonaktifkan            | Dukungan plugin/aplikasi Codex native, termasuk akses opsional ke aplikasi akun yang terhubung. Lihat [Plugin Codex native](/id/plugins/codex-native-plugins). |
| `computerUse`              | dinonaktifkan            | Penyiapan Codex Computer Use. Lihat [Codex Computer Use](/id/plugins/codex-computer-use).                                                          |
| `sessionCatalog`           | diaktifkan               | Penemuan sesi Codex native untuk bilah sisi. Atur `enabled: false` untuk menonaktifkan penemuan tanpa menonaktifkan penyedia atau harness.      |
| `supervision`              | dinonaktifkan            | Kebijakan transkrip sesi native dan kontrol penulisan yang ditujukan kepada agen. Lihat [Supervisi Codex](/plugins/codex-supervision).          |

## Supervisi

Penemuan sesi native secara default mencantumkan sesi Codex yang tidak diarsipkan dari komputer Gateway
dan node terpasang yang telah disertakan. Nonaktifkan hanya katalog tersebut dengan:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          sessionCatalog: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

`supervision` secara terpisah mengontrol alat yang ditujukan kepada agen:

| Bidang                | Default                 | Arti                                                                                                                                                                                                                                      |
| --------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                 | Aktifkan alat supervisi Codex yang ditujukan kepada agen. Ini tidak mengontrol katalog sesi operator yang diautentikasi.                                                                                                                   |
| `endpoints`           | endpoint lokal bawaan   | Target endpoint kompatibilitas dan lanjutan untuk agen supervisi Codex yang dipertahankan serta alat MCP mandiri. Katalog manusia dan alur cabang mengabaikan target ini dan menggunakan App Server supervisi yang ditentukan dari `appServer`. |
| `allowRawTranscripts` | `false`                 | Dengan supervisi diaktifkan, izinkan agen otonom atau MCP mandiri membaca transkrip dan bidang daftar yang diturunkan dari transkrip. Pembacaan khusus metadata `codex_threads` tetap tersedia. Tidak mengontrol kelanjutan Control UI yang diautentikasi. |
| `allowWriteControls`  | `false`                 | Dengan supervisi diaktifkan, izinkan mutasi fork, penggantian nama, pengarsipan, dan pembatalan pengarsipan `codex_threads` secara otonom, serta operasi kirim, arahkan, dan interupsi MCP mandiri. Tidak melewati pemeriksaan pengikatan, host, status, atau konfirmasi lainnya. |

Entri endpoint menerima bidang berikut:

| Bidang         | Berlaku untuk | Arti                                                                  |
| -------------- | ------------- | --------------------------------------------------------------------- |
| `id`           | semua         | ID endpoint stabil.                                                   |
| `label`        | semua         | Label tampilan opsional.                                              |
| `transport`    | semua         | `"stdio-proxy"` atau `"websocket"`.                                  |
| `command`      | `stdio-proxy` | Perintah App Server opsional.                                         |
| `args`         | `stdio-proxy` | Argumen perintah opsional.                                            |
| `cwd`          | `stdio-proxy` | Direktori kerja proses anak opsional.                                 |
| `url`          | `websocket`   | URL WebSocket atau soket lokal yang didukung dan wajib diisi.         |
| `authTokenEnv` | `websocket`   | Variabel lingkungan opsional yang nilainya mengautentikasi endpoint.  |

Halaman **Sesi Codex** menggunakan App Server supervisi plugin dan hanya menampilkan
sesi yang tidak diarsipkan. Tanpa pengaturan koneksi `appServer` yang eksplisit,
koneksi tersebut merupakan stdio direktori utama pengguna terkelola. Baris lokal yang tersimpan atau menganggur dapat membuat
Chat yang terkunci ke model dengan riwayat pengguna dan asisten terbatas hingga giliran sumber
persisten terminal terakhir. Pengikatan privatnya mempertahankan fork snapshot,
cabang sumber `appServer` kanonis, injeksi riwayat, dan giliran berikutnya pada
koneksi tersebut. Awal kanonis pertama menggunakan pasangan yang dikembalikan oleh fork. Pelanjutan
berikutnya menghilangkan penggantian model dan penyedia OpenClaw agar Codex memulihkan
pasangan persisten thread kanonis; perubahan native terpisah dapat memperbarui
pasangan tersebut, tetapi model luar dan rantai fallback tidak pernah menggantikannya. Baris yang tersimpan dan menganggur
dapat diarsipkan setelah konfirmasi tidak ada runner lain, kecuali pengikatan OpenClaw aktif lainnya
memiliki target yang sama persis atau salah satu turunan yang dibuatnya dan tidak diarsipkan.
OpenClaw mengikuti paginasi turunan Codex dan gagal secara tertutup jika terjadi
kesalahan enumerasi, siklus, atau habisnya batas keamanan. Konfirmasi tetap
mencakup klien native yang tidak diketahui dan kondisi balapan antara status dan pengarsipan. Chat
terkunci ke model yang disupervisi tidak dapat dihapus selama melindungi pengikatan native.
Sumber aktif tidak dapat membuat cabang atau diarsipkan, tetapi Chat tersupervisi yang sudah ada
tetap dapat dibuka. Setiap baris node terpasang tetap hanya-baca; transportasi node
belum menyediakan siklus hidup streaming yang diperlukan oleh harness.

`appServer.homeScope: "user"` saja mengubah direktori utama Codex yang digunakan proses harness
terkelola; ini tidak memublikasikan katalog armada. Mengaktifkan supervisi tidak
mengubah default harness. Sebagai gantinya, koneksi supervisi terpisah
secara default menggunakan stdio direktori utama pengguna terkelola ketika tidak ada pengaturan koneksi
`appServer` yang eksplisit. Pengaturan eksplisit diterapkan untuk koneksi tersebut.
Pengikatan tersupervisi yang tertunda dan telah dikomit mempertahankan koneksi tersebut untuk setiap giliran;
supervisi yang dinonaktifkan atau penyimpangan koneksi/siklus hidup akan gagal secara tertutup alih-alih
beralih ke harness direktori utama agen. Koneksi default berbagi sesi tersimpan
dengan klien Codex native, bukan status aktivitas lokal prosesnya.

Pengaturan lama `plugins.entries.codex-supervisor` telah dihentikan. Jalankan
`openclaw doctor --fix` untuk memigrasikan entri lama, definisi endpoint, flag
kebijakan, dan referensi izinkan/tolak plugin ke dalam blok ini. Nilai kanonis eksplisit
`codex.config.supervision` menang jika terjadi konflik.

## Transportasi app-server

Untuk giliran harness biasa, OpenClaw memulai biner Codex terkelola yang dikirimkan
bersama plugin resmi (saat ini `@openai/codex` `0.144.6`):

```bash
codex app-server --listen stdio://
```

Ini menjaga versi app-server tetap terikat pada plugin resmi `codex`, bukan pada
Codex CLI terpisah apa pun yang kebetulan terinstal secara lokal. Atur
`appServer.command` hanya jika Anda sengaja menginginkan berkas executable yang berbeda.
Giliran terkelola biasa dengan direktori utama agen terisolasi default memprioritaskan paket
yang dipasangi pin ini, bahkan ketika bundel desktop macOS terinstal. Ketika
[Computer Use](/id/plugins/codex-computer-use) diaktifkan, atau ketika `homeScope`
adalah `"user"` dan dapat memuat status Computer Use native, startup terkelola akan memprioritaskan
biner aplikasi desktop yang memiliki izin macOS yang diperlukan. Aturan
yang sama untuk memprioritaskan desktop berlaku ketika konfigurasi Codex efektif milik direktori utama agen terisolasi
mengaktifkan Computer Use native. Jika tidak ada bundel aplikasi desktop yang terinstal, OpenClaw
beralih ke biner paket yang dipasangi pin.

Serah terima berkas executable dan pembatasan konfigurasi native mengoordinasikan klien dalam satu
proses Gateway yang berjalan. Mulai ulang Gateway setelah proses lain mengubah
konfigurasi plugin Codex native.

Supervisi menentukan koneksi terpisah. Tanpa pengaturan koneksi
`appServer` yang eksplisit, supervisi menggunakan stdio terkelola dengan `homeScope: "user"`;
harness biasa tetap menggunakan stdio terkelola dengan `homeScope: "agent"`. Pengaturan
koneksi eksplisit diterapkan oleh kedua jalur. Atur `homeScope: "user"`
secara eksplisit ketika harness biasa harus berbagi `$CODEX_HOME` (atau `~/.codex`)
dengan klien native. Pengikatan tersupervisi privat menggunakan koneksi supervisi
terlepas dari default harness biasa. Proses App Server independen
mempertahankan status langsung dan status persetujuan yang terpisah.

Untuk pengujian nonproduksi terhadap app-server yang sudah berjalan, transportasi WebSocket
tersedia:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Codex mengklasifikasikan transportasi WebSocket sebagai eksperimental dan tidak didukung. Utamakan
stdio terkelola atau soket kontrol Unix lokal untuk beban kerja produksi.

Bidang `appServer`:

| Bidang                                         | Bawaan                                                | Arti                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` menjalankan Codex; `"unix"` yang ditentukan secara eksplisit terhubung ke soket kontrol lokal; `"websocket"` terhubung ke `url`.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` mengisolasi status harness biasa untuk setiap agen OpenClaw. `"user"` merupakan pilihan ikut serta eksplisit yang berbagi `$CODEX_HOME` atau `~/.codex` native, menggunakan autentikasi native, dan mengaktifkan pengelolaan utas khusus pemilik. Cakupan pengguna mendukung stdio lokal atau transport Unix. Untuk koneksi supervisi terpisah, nilai yang tidak ditetapkan diresolusikan menjadi `"user"` untuk stdio atau Unix dan `"agent"` untuk WebSocket.     |
| `command`                                     | biner Codex terkelola                                   | Berkas yang dapat dieksekusi untuk transport stdio. Biarkan tidak ditetapkan untuk menggunakan biner terkelola.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumen untuk transport stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | tidak ditetapkan                                                  | URL App Server WebSocket atau URL `unix://`. Jalur Unix eksplisit yang kosong memilih soket kontrol kanonis di direktori beranda pengguna.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | tidak ditetapkan                                                  | Token bearer untuk transport WebSocket. Menerima string literal atau SecretInput seperti `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Header WebSocket tambahan. Nilai header menerima string literal atau nilai SecretInput, misalnya `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan warisannya.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | tidak ditetapkan                                                  | Root ruang kerja app-server Codex jarak jauh. Saat ditetapkan, OpenClaw menyimpulkan root ruang kerja lokal dari ruang kerja OpenClaw yang telah diresolusikan, mempertahankan sufiks cwd saat ini di bawah root jarak jauh ini, dan hanya mengirim cwd app-server akhir ke Codex. Jika cwd berada di luar root ruang kerja OpenClaw yang telah diresolusikan, OpenClaw menutup akses secara aman alih-alih mengirim jalur lokal Gateway ke app-server jarak jauh. |
| `loopDetectionPreToolUseRelay`                | `true`                                                 | Instal subproses Codex `PreToolUse` yang hanya digunakan untuk deteksi loop OpenClaw dan penanda tanpa kebijakan eksplisitnya. Tetapkan `false` untuk mengurangi fan-out proses per alat. Hook Plugin sebelum alat dan kebijakan alat tepercaya tetap menginstal relai yang diperlukan.                                                                                                                                         |
| `requestTimeoutMs`                            | `60000`                                                | Batas waktu untuk panggilan bidang kontrol app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Jendela hening setelah Codex menerima giliran atau setelah permintaan app-server yang tercakup dalam giliran sementara OpenClaw menunggu `turn/completed`.                                                                                                                                                                                                                                                                    |
| `turnAssistantCompletionIdleTimeoutMs`        | `10000`                                                | Jendela hening setelah item asisten final/non-komentar atau penyelesaian asisten mentah pra-alat mempersiapkan pelepasan keluaran asisten sementara OpenClaw masih menunggu `turn/completed`. Menaikkan nilai ini memberi Codex lebih banyak waktu untuk menghasilkan `turn/completed` sebelum OpenClaw menginterupsi dan melepaskan jalur sesi.                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Penjaga progres dan keadaan diam penyelesaian yang digunakan setelah penyerahan alat, penyelesaian alat native, progres asisten mentah pasca-alat, penyelesaian penalaran mentah, atau progres penalaran sementara OpenClaw menunggu `turn/completed`. Gunakan ini untuk beban kerja tepercaya atau berat ketika sintesis pasca-alat secara wajar dapat tetap hening lebih lama daripada anggaran pelepasan asisten final.                                |
| `mode`                                        | `"yolo"` kecuali persyaratan Codex lokal tidak mengizinkan YOLO | Preset untuk eksekusi YOLO atau yang ditinjau guardian.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` atau kebijakan persetujuan guardian yang diizinkan       | Kebijakan persetujuan Codex native yang dikirim saat utas dimulai, dilanjutkan, dan saat giliran.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` atau sandbox guardian yang diizinkan  | Mode sandbox Codex native yang dikirim saat utas dimulai dan dilanjutkan. Sandbox OpenClaw aktif mempersempit giliran `danger-full-access` menjadi `workspace-write` Codex; flag jaringan giliran mengikuti egress sandbox OpenClaw.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` atau peninjau guardian yang diizinkan               | Gunakan `"auto_review"` agar Codex meninjau perintah persetujuan native jika diizinkan.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | direktori proses saat ini                              | Ruang kerja yang digunakan oleh `/codex bind` ketika `--cwd` tidak disertakan.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | tidak ditetapkan                                                  | Tingkat layanan app-server Codex opsional. `"priority"` mengaktifkan perutean mode cepat, `"flex"` meminta pemrosesan fleksibel, dan `null` menghapus penggantian. `"fast"` lama diterima sebagai `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | dinonaktifkan                                               | Ikut serta dalam jaringan profil izin Codex untuk perintah app-server. OpenClaw menentukan konfigurasi `permissions.<profile>.network` yang dipilih dan memilihnya dengan `default_permissions` alih-alih mengirim `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Pratinjau yang memerlukan persetujuan untuk mendaftarkan lingkungan Codex berbasis sandbox OpenClaw ke app-server Codex yang didukung agar eksekusi Codex native dapat berjalan di dalam sandbox OpenClaw yang aktif.                                                                                                                                                                                                            |

`appServer.networkProxy` bersifat eksplisit karena mengubah kontrak sandbox Codex.
Saat diaktifkan, OpenClaw juga menetapkan `features.network_proxy.enabled` dan
`default_permissions` dalam konfigurasi utas Codex agar profil izin yang
dihasilkan dapat memulai jaringan yang dikelola Codex. Secara default, OpenClaw
menghasilkan nama profil `openclaw-network-<fingerprint>` yang tahan benturan dari isi
profil; gunakan `profileName` hanya jika nama lokal yang stabil diperlukan.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

Jika runtime app-server normal adalah `danger-full-access`, mengaktifkan
`networkProxy` akan menggunakan akses sistem berkas bergaya workspace untuk
profil izin yang dihasilkan. Penegakan jaringan yang dikelola Codex merupakan
jaringan yang di-sandbox, sehingga profil akses penuh tidak akan melindungi
lalu lintas keluar.

Plugin memblokir handshake app-server yang lebih lama, lebih baru tetapi belum
divalidasi, prarilis, memiliki sufiks build, atau tidak berversi. App-server
Codex harus melaporkan versi stabil dari `0.143.0` hingga
`0.144.6` yang dibundel.

OpenClaw memperlakukan URL app-server WebSocket non-loopback sebagai jarak jauh
dan memerlukan autentikasi WebSocket yang menyertakan identitas melalui
`appServer.authToken` atau header `Authorization`. `appServer.authToken` dan
setiap nilai `appServer.headers.*` dapat berupa SecretInput; runtime rahasia
menyelesaikan SecretRef dan bentuk singkat variabel lingkungan sebelum OpenClaw
membangun opsi mulai app-server, dan SecretRef terstruktur yang belum
terselesaikan akan gagal sebelum token atau header apa pun dikirim. Saat Plugin
Codex native dikonfigurasi, OpenClaw menggunakan bidang kendali Plugin milik
app-server yang terhubung untuk memasang atau menyegarkan Plugin tersebut,
kemudian menyegarkan inventaris aplikasi agar aplikasi milik Plugin terlihat
oleh utas Codex. `app/list` tetap menjadi sumber inventaris dan metadata
yang otoritatif, tetapi kebijakan OpenClaw menentukan apakah
`thread/start` mengirim `config.apps[appId].enabled = true` untuk aplikasi yang terdaftar
dan dapat diakses meskipun Codex saat ini menandainya sebagai dinonaktifkan.
ID aplikasi yang tidak dikenal atau tidak ada tetap gagal secara tertutup;
jalur ini hanya mengaktifkan Plugin marketplace melalui `plugin/install` dan
menyegarkan inventaris. Hubungkan OpenClaw hanya ke app-server jarak jauh yang
dipercaya untuk menerima pemasangan Plugin yang dikelola OpenClaw dan
penyegaran inventaris aplikasi.

## Mode persetujuan dan sandbox

Sesi app-server stdio lokal secara default menggunakan mode YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Postur operator lokal tepercaya ini memungkinkan giliran
OpenClaw tanpa pengawasan dan Heartbeat tetap berjalan tanpa prompt persetujuan
native yang tidak dapat dijawab karena tidak ada orang yang hadir.

Jika berkas persyaratan sistem lokal Codex melarang nilai persetujuan YOLO,
peninjau, atau sandbox implisit, OpenClaw memperlakukan default implisit sebagai
guardian dan memilih izin guardian yang diperbolehkan. `tools.exec.mode: "auto"`
juga memaksakan persetujuan Codex yang ditinjau guardian dan tidak
mempertahankan penggantian lama `approvalPolicy: "never"` atau
`sandbox: "danger-full-access"` yang tidak aman; tetapkan `tools.exec.mode: "full"` untuk postur
tanpa persetujuan yang disengaja. Entri `[[remote_sandbox_config]]` yang cocok dengan
nama host dalam berkas persyaratan yang sama akan dipatuhi untuk keputusan
default sandbox.

Tetapkan `appServer.mode: "guardian"` untuk persetujuan Codex yang ditinjau guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Preset `guardian` diperluas menjadi `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, dan `sandbox: "workspace-write"` saat nilai tersebut
diperbolehkan. Setiap bidang kebijakan menggantikan `mode`. Nilai
peninjau lama `guardian_subagent` masih diterima sebagai alias kompatibilitas,
tetapi konfigurasi baru sebaiknya menggunakan `auto_review`.

Saat sandbox OpenClaw aktif, proses app-server Codex lokal tetap berjalan pada
host Gateway. Oleh karena itu, OpenClaw menonaktifkan Code Mode native Codex,
server MCP pengguna, dan eksekusi Plugin berbasis aplikasi untuk giliran
tersebut, alih-alih menganggap sandbox sisi host Codex setara dengan backend
sandbox OpenClaw. Akses shell diekspos melalui alat dinamis berbasis sandbox
OpenClaw seperti `sandbox_exec` dan `sandbox_process` saat alat exec/proses
normal tersedia.

<Note>
Pada host sandbox OpenClaw berbasis Docker (`agents.defaults.sandbox.mode` ditetapkan ke
backend Docker), `openclaw doctor` memeriksa apakah host mengizinkan namespace
pengguna tanpa hak istimewa (dan, saat egress jaringan sandbox Docker
dinonaktifkan, namespace jaringan) yang diperlukan oleh
`bwrap` Codex bertingkat untuk eksekusi shell
`workspace-write` di dalam kontainer sandbox. Pemeriksaan yang gagal biasanya
muncul sebagai `bwrap: setting up uid map: Permission denied` atau
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` pada host Ubuntu/AppArmor. Perbaiki kebijakan namespace host
yang dilaporkan untuk pengguna layanan OpenClaw dan mulai ulang Gateway;
utamakan profil AppArmor terbatas untuk proses layanan daripada fallback
`kernel.apparmor_restrict_unprivileged_userns=0` yang mencakup seluruh host, dan jangan berikan hak istimewa
kontainer Docker yang lebih luas hanya untuk memenuhi kebutuhan
`bwrap` bertingkat.
</Note>

## Eksekusi native dalam sandbox

Default stabilnya adalah gagal secara tertutup: sandbox OpenClaw yang aktif
menonaktifkan permukaan eksekusi native Codex yang jika tidak dinonaktifkan
akan berjalan dari host app-server Codex. Gunakan `appServer.experimental.sandboxExecServer: true` hanya jika
Anda ingin mencoba dukungan lingkungan jarak jauh Codex dengan backend sandbox
OpenClaw. Jalur pratinjau ini berfungsi dengan setiap versi app-server Codex
yang didukung.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

Saat flag aktif dan sesi OpenClaw saat ini berada dalam sandbox, OpenClaw
memulai exec-server loopback lokal yang didukung oleh sandbox aktif,
mendaftarkannya ke app-server Codex, lalu memulai utas dan giliran Codex dengan
lingkungan milik OpenClaw tersebut. Jika app-server tidak dapat mendaftarkan
lingkungan, proses akan gagal secara tertutup alih-alih diam-diam kembali ke
eksekusi host.

Jalur pratinjau ini hanya bersifat lokal. App-server WebSocket jarak jauh tidak
dapat menjangkau exec-server loopback kecuali berjalan pada host yang sama,
sehingga OpenClaw menolak kombinasi tersebut.

## Isolasi autentikasi dan lingkungan

Dalam direktori home per agen default, autentikasi dipilih dalam urutan berikut:

1. Profil autentikasi Codex OpenClaw yang eksplisit untuk agen.
2. Akun app-server yang sudah ada dalam direktori home Codex agen tersebut.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, saat tidak ada akun app-server dan autentikasi OpenAI
   masih diperlukan.

Saat OpenClaw melihat profil autentikasi Codex bergaya langganan ChatGPT (jenis
kredensial OAuth atau token), OpenClaw menghapus `CODEX_API_KEY` dan
`OPENAI_API_KEY` dari proses anak Codex yang dijalankan. Hal ini menjaga agar
kunci API tingkat Gateway tetap tersedia untuk embedding atau model OpenAI
langsung tanpa secara tidak sengaja membuat giliran app-server Codex native
ditagihkan melalui API.

Profil kunci API Codex eksplisit dan fallback kunci lingkungan stdio lokal
menggunakan login app-server, bukan lingkungan proses anak yang diwariskan.
Koneksi app-server WebSocket tidak menerima fallback kunci API lingkungan
Gateway; gunakan profil autentikasi eksplisit atau akun milik app-server jarak
jauh.

Peluncuran app-server stdio secara default mewarisi lingkungan proses OpenClaw.
OpenClaw memiliki penghubung akun app-server Codex dan menetapkan
`CODEX_HOME` ke direktori per agen di bawah status OpenClaw agen tersebut.
Hal ini menjaga konfigurasi, akun, cache/data Plugin, dan status utas Codex
tetap tercakup pada agen OpenClaw, alih-alih bocor dari direktori home pribadi
`~/.codex` milik operator.

Tetapkan `appServer.homeScope: "user"` untuk berbagi status Codex native dengan Codex
Desktop dan CLI. Mode direktori home pengguna lokal ini mendukung stdio
terkelola dan transport Unix eksplisit. Mode ini menggunakan
`$CODEX_HOME` jika ditetapkan dan `~/.codex` jika tidak, termasuk
autentikasi, konfigurasi, Plugin, dan utas native. OpenClaw melewati penghubung
profil autentikasinya untuk app-server. Giliran pemilik yang terverifikasi
dapat menggunakan `codex_threads` untuk mencantumkan (dengan filter opsional
`search`), membaca, membuat fork, mengganti nama, mengarsipkan, dan
membatalkan pengarsipan utas tersebut. Buat fork utas sebelum melanjutkannya
di OpenClaw; proses Codex yang terpisah tidak mengoordinasikan penulis secara
bersamaan untuk utas yang sama.

Keikutsertaan `homeScope` tersebut berlaku untuk sesi harness biasa.
Chat yang dibuat melalui Codex Sessions menggunakan koneksi supervisi
pribadinya sebagai gantinya, yang mempertahankan konfigurasi autentikasi dan
penyedia koneksi native untuk cabang kanonis dan pelanjutan mendatang.

Dalam Chat terawasi yang dikunci ke model, `codex_threads` tidak dapat
melampirkan fork lain atau mengarsipkan utas native yang terikat ke Chat.
Daftar dan pembacaan khusus metadata tetap tersedia. Pembacaan transkrip mentah
memerlukan `allowRawTranscripts`; saat dinonaktifkan, pencarian daftar juga ditolak
karena pencarian native dapat mencocokkan pratinjau transkrip. Penggantian nama,
pembatalan pengarsipan, fork terpisah, dan pengarsipan utas yang tidak terkait
dan tidak dimiliki Chat OpenClaw lain memerlukan `allowWriteControls`. Kedua opsi
tersebut tidak melewati pengikatan yang dikunci.

OpenClaw tidak menulis ulang `HOME` untuk peluncuran app-server lokal
normal. Subproses yang dijalankan Codex seperti `openclaw`,
`gh`, `git`, CLI cloud, dan perintah shell melihat
direktori home proses normal serta dapat menemukan konfigurasi dan token
direktori home pengguna. Codex juga dapat menemukan `$HOME/.agents/skills` dan
`$HOME/.agents/plugins/marketplace.json`; penemuan `.agents` tersebut sengaja dibagikan
dengan direktori home operator dan terpisah dari status `~/.codex` yang
terisolasi.

Dalam cakupan agen default, Plugin OpenClaw dan snapshot Skills OpenClaw tetap
mengalir melalui registri Plugin dan pemuat Skills milik OpenClaw; aset
`~/.codex` Codex pribadi tidak. Jika Anda memiliki Skills atau Plugin
CLI Codex yang berguna dari direktori home Codex yang seharusnya menjadi bagian
dari agen OpenClaw terisolasi, inventarisasikan aset tersebut secara eksplisit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Jika penerapan memerlukan isolasi lingkungan tambahan, tambahkan variabel
tersebut ke `appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` hanya memengaruhi proses anak app-server Codex yang
dijalankan. OpenClaw menghapus `CODEX_HOME` dan `HOME` dari
daftar ini selama normalisasi peluncuran lokal: `CODEX_HOME` tetap
mengarah ke cakupan agen atau pengguna yang dipilih, dan
`HOME` tetap diwariskan agar subproses dapat menggunakan status
direktori home pengguna normal.

## Alat dinamis

Alat dinamis Codex secara default menggunakan pemuatan `searchable`,
diekspos di bawah namespace `openclaw` dengan `deferLoading: true`.
OpenClaw biasanya tidak mengekspos alat dinamis yang menduplikasi operasi
workspace native Codex atau permukaan pencarian alat milik Codex sendiri:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`
- `tool_call`
- `tool_describe`
- `tool_search`
- `tool_search_code`

Saat daftar izin runtime terbatas menonaktifkan Code Mode native, OpenClaw
mengirim pilihan lingkungan eksekusi kosong. Dalam kasus langsung tanpa
sandbox tersebut, OpenClaw mempertahankan alat `exec` dan
`process` yang telah difilter kebijakan sebagai fallback shell. Daftar
izin runtime dan `codexDynamicToolsExclude` tetap berlaku.

Sebagian besar alat integrasi OpenClaw lainnya, seperti perpesanan, media, cron,
browser, node, gateway, `heartbeat_respond`, dan `web_search`, tersedia
melalui pencarian alat Codex dalam namespace tersebut. Hal ini menjaga konteks
model awal tetap lebih kecil. Sejumlah kecil alat tetap dapat dipanggil secara langsung
terlepas dari `codexDynamicToolsLoading`, karena pencarian alat Codex mungkin tidak tersedia atau
hanya menemukan kumpulan konektor: `agents_list`, `sessions_spawn`, dan
`sessions_yield`. Instruksi pengembang tetap mengarahkan subagen Codex biasa
ke `spawn_agent` native untuk pekerjaan subagen native Codex, sementara
`sessions_spawn` tetap tersedia untuk delegasi OpenClaw atau ACP secara eksplisit.
Balasan sumber yang hanya menggunakan alat pesan juga tetap langsung, karena hal itu
merupakan kontrak kontrol giliran.

Alat yang ditandai `catalogMode: "direct-only"`, termasuk alat OpenClaw `computer`,
dikelompokkan di bawah `openclaw_direct`. OpenClaw menambahkan namespace tersebut ke
daftar `code_mode.direct_only_tool_namespaces` milik Codex tanpa mengganti
entri yang disediakan operator. Oleh karena itu, Codex mengekspos alat-alat tersebut sebagai
`DirectModelOnly` dalam utas normal dan utas khusus mode kode, alih-alih merutekannya
melalui panggilan Code Mode `tools.*` bertingkat. Batas ini diperlukan untuk
hasil yang memuat gambar: serialisasi Code Mode bertingkat meratakan keluaran gambar menjadi
teks, yang akan membuang tangkapan layar yang diperlukan untuk tindakan komputer berikutnya.

Tetapkan `codexDynamicToolsLoading: "direct"` hanya saat menghubungkan ke
app-server Codex khusus yang tidak dapat mencari alat dinamis yang ditangguhkan atau saat men-debug
payload alat lengkap.

## Batas waktu

Panggilan alat dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`. Setiap permintaan `item/tool/call` Codex menggunakan
batas waktu pertama yang tersedia dalam urutan berikut:

- Argumen `timeoutMs` per panggilan yang bernilai positif.
- Untuk `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Untuk `image_generate` tanpa batas waktu yang dikonfigurasi, nilai default
  pembuatan gambar sebesar 120 detik.
- Untuk alat pemahaman media `image`, `tools.media.image.timeoutSeconds`
  yang dikonversi ke milidetik, atau nilai default media sebesar 60 detik. Untuk pemahaman
  gambar, batas ini berlaku pada permintaan itu sendiri dan tidak dikurangi oleh
  pekerjaan persiapan sebelumnya.
- Untuk alat `message`, nilai default tetap sebesar 120 detik.
- Nilai default alat dinamis sebesar 90 detik.

Watchdog ini merupakan anggaran `item/tool/call` dinamis terluar. Batas waktu
permintaan khusus penyedia berjalan di dalam panggilan tersebut dan mempertahankan semantik
batas waktunya sendiri. Anggaran alat dinamis dibatasi hingga 600000 md. Saat batas waktu
tercapai, OpenClaw membatalkan sinyal alat jika didukung dan mengembalikan respons
alat dinamis yang gagal kepada Codex agar giliran dapat berlanjut, alih-alih membiarkan sesi
dalam `processing`.

Setelah Codex menerima sebuah giliran, dan setelah OpenClaw merespons permintaan
app-server dengan cakupan giliran, harness mengharapkan Codex untuk membuat kemajuan pada
giliran saat ini dan pada akhirnya menyelesaikan giliran native dengan `turn/completed`.
Jika app-server tidak memberikan aktivitas selama `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
berupaya sebaik mungkin untuk menginterupsi giliran Codex, mencatat batas waktu diagnostik, dan
melepaskan jalur sesi OpenClaw agar pesan obrolan lanjutan tidak mengantre
di belakang giliran native yang sudah kedaluwarsa.

Sebagian besar notifikasi nonterminal untuk giliran yang sama menonaktifkan watchdog singkat
tersebut karena Codex telah membuktikan bahwa giliran masih aktif. Serah terima alat menggunakan
anggaran menganggur pasca-alat yang lebih panjang: setelah OpenClaw mengembalikan respons
`item/tool/call`, setelah item alat native seperti `commandExecution`
selesai, setelah penyelesaian mentah `custom_tool_call_output`, serta setelah
kemajuan asisten mentah pasca-alat, penyelesaian penalaran mentah, atau kemajuan penalaran.
Penjaga menggunakan `appServer.postToolRawAssistantCompletionIdleTimeoutMs` jika dikonfigurasi dan
secara default menggunakan lima menit jika tidak. Anggaran pasca-alat yang sama juga memperpanjang
watchdog kemajuan untuk jendela sintesis senyap sebelum Codex memancarkan
peristiwa giliran saat ini berikutnya. Penyelesaian penalaran, penyelesaian `agentMessage`
komentar, serta kemajuan penalaran atau asisten mentah pra-alat dapat diikuti
oleh balasan akhir otomatis, sehingga semuanya menggunakan penjaga balasan pasca-kemajuan,
alih-alih langsung melepaskan jalur sesi. Hanya item `agentMessage` selesai
yang bersifat final/nonkomentar dan penyelesaian asisten mentah pra-alat yang mengaktifkan
pelepasan keluaran asisten: jika Codex kemudian tidak memberikan aktivitas tanpa `turn/completed`,
OpenClaw berupaya sebaik mungkin untuk menginterupsi giliran native dan melepaskan jalur
sesi. Kegagalan app-server stdio yang aman untuk diputar ulang, termasuk batas waktu
menganggur penyelesaian giliran tanpa bukti asisten, alat, item aktif, atau efek samping,
dicoba ulang satu kali dalam upaya app-server baru. Batas waktu yang tidak aman tetap menghentikan
klien app-server yang macet dan melepaskan jalur sesi OpenClaw. Batas waktu tersebut juga
menghapus pengikatan utas native yang kedaluwarsa, alih-alih memutarnya ulang
secara otomatis. Batas waktu pengawasan penyelesaian menampilkan teks batas waktu khusus Codex:
kasus yang aman untuk diputar ulang menyatakan bahwa respons mungkin tidak lengkap, sedangkan kasus
yang tidak aman meminta pengguna memverifikasi keadaan saat ini sebelum mencoba lagi. Diagnostik
batas waktu publik mencakup bidang struktural seperti metode notifikasi app-server terakhir,
id/jenis/peran item respons asisten mentah, jumlah permintaan/item aktif, dan
status pengawasan yang diaktifkan. Jika notifikasi terakhir adalah item respons asisten mentah,
diagnostik tersebut juga menyertakan pratinjau teks asisten dengan panjang terbatas. Diagnostik
tersebut tidak menyertakan prompt mentah atau konten alat.

## Penemuan model

Secara default, Plugin Codex meminta daftar model yang tersedia dari app-server. Ketersediaan
model dimiliki oleh app-server Codex, sehingga daftar tersebut dapat berubah ketika
OpenClaw meningkatkan versi `@openai/codex` yang disertakan atau ketika suatu deployment
mengarahkan `appServer.command` ke biner Codex yang berbeda. Ketersediaan juga dapat
dibatasi berdasarkan akun. Gunakan `/codex models` pada gateway yang sedang berjalan untuk melihat
katalog aktif bagi harness dan akun tersebut.

Jika penemuan gagal atau mencapai batas waktu, OpenClaw menggunakan katalog fallback yang disertakan:

| ID model       | Nama tampilan | Tingkat penalaran        |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | rendah, sedang, tinggi, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | rendah, sedang, tinggi, xhigh |

<Note>
Harness yang saat ini disertakan adalah `@openai/codex` `0.144.6`. Probe `model/list`
terhadap app-server yang disertakan tersebut mengembalikan baris pemilih publik berikut:

| ID model        | Modalitas masukan | Tingkat penalaran                    |
| --------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`   | teks, gambar      | rendah, sedang, tinggi, xhigh, maks, ultra |
| `gpt-5.6-terra` | teks, gambar      | rendah, sedang, tinggi, xhigh, maks, ultra |
| `gpt-5.6-luna`  | teks, gambar      | rendah, sedang, tinggi, xhigh, maks        |
| `gpt-5.5`       | teks, gambar      | rendah, sedang, tinggi, xhigh             |
| `gpt-5.4`       | teks, gambar      | rendah, sedang, tinggi, xhigh             |
| `gpt-5.4-mini`  | teks, gambar      | rendah, sedang, tinggi, xhigh             |
| `gpt-5.2`       | teks, gambar      | rendah, sedang, tinggi, xhigh             |

Katalog app-server dapat melaporkan `ultra`; kontrol penalaran OpenClaw saat ini
mengekspos tingkat hingga `max`.

Baris pemilih aktif dibatasi berdasarkan akun dan dapat berubah mengikuti akun, katalog
Codex, atau versi yang disertakan; jalankan `/codex models` untuk mendapatkan daftar terkini,
alih-alih mengandalkan tabel pada suatu titik waktu. Model tersembunyi juga dapat muncul dalam
katalog app-server untuk alur internal atau khusus tanpa menjadi pilihan normal
dalam pemilih model.
</Note>

Sesuaikan penemuan di bawah `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Nonaktifkan penemuan jika Anda ingin proses awal menghindari pemeriksaan Codex dan hanya
menggunakan katalog fallback:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## File bootstrap ruang kerja

Codex menangani `AGENTS.md` sendiri melalui penemuan dokumen proyek native.
OpenClaw tidak menulis file dokumen proyek Codex sintetis atau bergantung pada nama file
fallback Codex untuk file persona, karena fallback Codex hanya berlaku ketika
`AGENTS.md` tidak ada.

Untuk kesetaraan ruang kerja OpenClaw, harness Codex meneruskan file
bootstrap lainnya sebagai instruksi pengembang, tetapi tidak secara identik:

- `TOOLS.md` diteruskan sebagai instruksi pengembang Codex yang **diwarisi**, sehingga
  subagen Codex native yang dibuat selama giliran juga melihatnya.
- `SOUL.md`, `IDENTITY.md`, dan `USER.md` diteruskan sebagai instruksi
  kolaborasi **dengan cakupan giliran**. Subagen Codex native tidak mewarisinya,
  sehingga giliran subagen tidak mengambil persona agen induk dan
  profil pengguna.
- Daftar ringkas Skills OpenClaw yang dimuat juga diteruskan sebagai instruksi
  pengembang kolaborasi dengan cakupan giliran, sehingga subagen Codex native juga tidak
  mewarisinya.
- Konten `HEARTBEAT.md` tidak disuntikkan; giliran heartbeat mendapatkan
  petunjuk mode kolaborasi untuk membaca file tersebut jika tersedia dan
  tidak kosong.
- Konten `MEMORY.md` dari ruang kerja agen yang dikonfigurasi tidak ditempelkan ke
  masukan giliran Codex native ketika alat memori tersedia untuk
  ruang kerja tersebut; jika tersedia, harness menambahkan petunjuk singkat memori ruang kerja
  ke instruksi pengembang kolaborasi dengan cakupan giliran dan Codex
  harus menggunakan `memory_search` atau `memory_get` ketika memori persisten relevan.
  Jika alat dinonaktifkan, pencarian memori tidak tersedia, atau ruang kerja aktif
  berbeda dari ruang kerja memori agen, `MEMORY.md` menggunakan
  jalur konteks giliran terbatas yang normal.
- `BOOTSTRAP.md`, jika tersedia, diteruskan sebagai konteks referensi masukan
  giliran OpenClaw.

## Penggantian lingkungan

Penggantian lingkungan tetap tersedia untuk pengujian lokal:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` melewati biner terkelola ketika
`appServer.command` tidak ditetapkan.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya, atau
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal satu kali. Konfigurasi
lebih disarankan untuk deployment yang dapat diulang karena menjaga perilaku Plugin dalam
file yang sama dan telah ditinjau seperti konfigurasi harness Codex lainnya.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Supervisi Codex](/plugins/codex-supervision)
- [Plugin Codex native](/id/plugins/codex-native-plugins)
- [Penggunaan Komputer Codex](/id/plugins/codex-computer-use)
- [Penyedia OpenAI](/id/providers/openai)
- [Referensi konfigurasi](/id/gateway/configuration-reference)
