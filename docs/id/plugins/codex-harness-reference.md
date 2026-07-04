---
read_when:
    - Anda memerlukan setiap kolom konfigurasi harness Codex
    - Anda mengubah perilaku transport, autentikasi, penemuan, atau batas waktu app-server
    - Anda sedang men-debug startup harness Codex, penemuan model, atau isolasi lingkungan
summary: Referensi konfigurasi, autentikasi, penemuan, dan server aplikasi untuk harness Codex
title: Referensi harness Codex
x-i18n:
    generated_at: "2026-07-04T11:04:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43c905586346c8d7c255b58b706eb82543fd1ca05588e459a257e8f9f4cf36d4
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Referensi ini mencakup konfigurasi terperinci untuk Plugin `codex`
bawaan. Untuk penyiapan dan keputusan perutean, mulai dengan
[Codex harness](/id/plugins/codex-harness).

## Permukaan konfigurasi Plugin

Semua pengaturan Codex harness berada di bawah `plugins.entries.codex.config`.

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

Kolom tingkat atas yang didukung:

| Kolom                      | Default                  | Makna                                                                                                                                     |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | enabled                  | Pengaturan penemuan model untuk Codex app-server `model/list`.                                                                            |
| `appServer`                | managed stdio app-server | Pengaturan transport, perintah, autentikasi, persetujuan, sandbox, dan batas waktu.                                                       |
| `codexDynamicToolsLoading` | `"searchable"`           | Gunakan `"direct"` untuk menempatkan alat dinamis OpenClaw langsung di konteks alat Codex awal.                                           |
| `codexDynamicToolsExclude` | `[]`                     | Nama alat dinamis OpenClaw tambahan yang akan dihilangkan dari giliran Codex app-server.                                                  |
| `codexPlugins`             | disabled                 | Dukungan Plugin/aplikasi Codex native untuk Plugin terkurasi yang dipasang dari sumber dan dimigrasikan. Lihat [Plugin Codex native](/id/plugins/codex-native-plugins). |
| `computerUse`              | disabled                 | Penyiapan Codex Computer Use. Lihat [Codex Computer Use](/id/plugins/codex-computer-use).                                                    |

## Transport app-server

Secara default, OpenClaw memulai biner Codex terkelola yang dikirim bersama
Plugin bawaan:

```bash
codex app-server --listen stdio://
```

Ini menjaga versi app-server tetap terikat ke Plugin `codex` bawaan, bukan ke
Codex CLI terpisah mana pun yang kebetulan terpasang secara lokal. Tetapkan
`appServer.command` hanya saat Anda sengaja ingin menjalankan executable yang
berbeda.

Untuk app-server yang sudah berjalan, gunakan transport WebSocket:

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

Kolom `appServer` yang didukung:

| Bidang                                        | Bawaan                                                | Arti                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                                                                                                                                                                                                                                                                                                                                      |
| `homeScope`                                   | `"agent"`                                              | `"agent"` mengisolasi status Codex per agen OpenClaw. `"user"` membagikan `$CODEX_HOME` native atau `~/.codex`, menggunakan autentikasi native, dan mengaktifkan manajemen thread khusus pemilik. Cakupan pengguna memerlukan stdio.                                                                                                                                                              |
| `command`                                     | biner Codex terkelola                                  | Executable untuk transport stdio. Biarkan tidak diatur untuk menggunakan biner terkelola.                                                                                                                                                                                                                                                                                                           |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumen untuk transport stdio.                                                                                                                                                                                                                                                                                                                                                                      |
| `url`                                         | belum diatur                                           | URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                           |
| `authToken`                                   | belum diatur                                           | Token Bearer untuk transport WebSocket. Menerima string literal atau SecretInput seperti `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                               |
| `headers`                                     | `{}`                                                   | Header WebSocket tambahan. Nilai header menerima string literal atau nilai SecretInput, misalnya `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                                   |
| `clearEnv`                                    | `[]`                                                   | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan warisannya.                                                                                                                                                                                                                                                       |
| `remoteWorkspaceRoot`                         | belum diatur                                           | Root ruang kerja app-server Codex jarak jauh. Saat diatur, OpenClaw menyimpulkan root ruang kerja lokal dari ruang kerja OpenClaw yang diselesaikan, mempertahankan sufiks cwd saat ini di bawah root jarak jauh ini, dan hanya mengirim cwd app-server akhir ke Codex. Jika cwd berada di luar root ruang kerja OpenClaw yang diselesaikan, OpenClaw gagal tertutup alih-alih mengirim jalur lokal Gateway ke app-server jarak jauh. |
| `requestTimeoutMs`                            | `60000`                                                | Timeout untuk panggilan control-plane app-server.                                                                                                                                                                                                                                                                                                                                                   |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Jendela senyap setelah Codex menerima giliran atau setelah permintaan app-server bercakupan giliran saat OpenClaw menunggu `turn/completed`.                                                                                                                                                                                                                                                       |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Penjaga completion-idle dan progres yang digunakan setelah handoff alat, penyelesaian alat native, progres asisten mentah pasca-alat, penyelesaian penalaran mentah, atau progres penalaran saat OpenClaw menunggu `turn/completed`. Gunakan ini untuk beban kerja tepercaya atau berat ketika sintesis pasca-alat secara sah dapat tetap senyap lebih lama daripada anggaran rilis asisten akhir.      |
| `mode`                                        | `"yolo"` kecuali persyaratan Codex lokal tidak mengizinkan YOLO | Preset untuk eksekusi YOLO atau yang ditinjau guardian.                                                                                                                                                                                                                                                                                                                                             |
| `approvalPolicy`                              | `"never"` atau kebijakan persetujuan guardian yang diizinkan | Kebijakan persetujuan Codex native yang dikirim ke awal thread, resume, dan giliran.                                                                                                                                                                                                                                                                                                                |
| `sandbox`                                     | `"danger-full-access"` atau sandbox guardian yang diizinkan | Mode sandbox Codex native yang dikirim ke awal thread dan resume. Sandbox OpenClaw aktif mempersempit giliran `danger-full-access` menjadi Codex `workspace-write`; flag jaringan giliran mengikuti egress sandbox OpenClaw.                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` atau peninjau guardian yang diizinkan          | Gunakan `"auto_review"` agar Codex meninjau prompt persetujuan native saat diizinkan.                                                                                                                                                                                                                                                                                                               |
| `defaultWorkspaceDir`                         | direktori proses saat ini                              | Ruang kerja yang digunakan oleh `/codex bind` saat `--cwd` dihilangkan.                                                                                                                                                                                                                                                                                                                            |
| `serviceTier`                                 | belum diatur                                           | Tingkat layanan app-server Codex opsional. `"priority"` mengaktifkan perutean mode cepat, `"flex"` meminta pemrosesan flex, dan `null` menghapus override. Legacy `"fast"` diterima sebagai `"priority"`.                                                                                                                                                                                          |
| `networkProxy`                                | dinonaktifkan                                          | Ikut serta dalam jaringan profil izin Codex untuk perintah app-server. OpenClaw mendefinisikan config `permissions.<profile>.network` yang dipilih dan memilihnya dengan `default_permissions` alih-alih mengirim `sandbox`.                                                                                                                                                                      |
| `experimental.sandboxExecServer`              | `false`                                                | Opt-in pratinjau yang mendaftarkan lingkungan Codex yang didukung sandbox OpenClaw dengan app-server Codex 0.132.0 atau yang lebih baru agar eksekusi Codex native dapat berjalan di dalam sandbox OpenClaw aktif.                                                                                                                                                                                 |

`appServer.networkProxy` bersifat eksplisit karena mengubah kontrak sandbox
Codex. Saat diaktifkan, OpenClaw juga mengatur `features.network_proxy.enabled` dan
`default_permissions` dalam config thread Codex agar profil izin yang dihasilkan
dapat memulai jaringan terkelola Codex. Secara default, OpenClaw menghasilkan nama
profil `openclaw-network-<fingerprint>` yang tahan tabrakan dari isi
profil; gunakan `profileName` hanya saat nama lokal yang stabil diperlukan.

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

Jika runtime app-server normal akan berupa `danger-full-access`, mengaktifkan
`networkProxy` menggunakan akses sistem berkas bergaya workspace untuk profil
izin yang dihasilkan. Penegakan jaringan yang dikelola Codex adalah jaringan
tersandbox, jadi profil akses penuh tidak akan melindungi lalu lintas keluar.

Plugin memblokir handshake app-server lama atau tanpa versi. Codex app-server
harus melaporkan versi stabil `0.125.0` atau yang lebih baru.

OpenClaw memperlakukan URL app-server WebSocket non-loopback sebagai remote dan
mewajibkan autentikasi WebSocket yang membawa identitas melalui
`appServer.authToken` atau header `Authorization`. `appServer.authToken` dan
setiap nilai `appServer.headers.*` dapat berupa SecretInput; runtime rahasia
menyelesaikan SecretRefs dan singkatan env sebelum OpenClaw membuat opsi mulai
app-server, dan SecretRefs terstruktur yang belum terselesaikan gagal sebelum
token atau header apa pun dikirim. Ketika Plugin Codex native dikonfigurasi,
OpenClaw menggunakan control plane Plugin dari app-server yang tersambung untuk
menginstal atau menyegarkan Plugin tersebut, lalu menyegarkan inventaris app agar
app milik Plugin terlihat oleh thread Codex. `app/list` tetap menjadi sumber
inventaris dan metadata otoritatif, tetapi kebijakan OpenClaw menentukan apakah
`thread/start` mengirim `config.apps[appId].enabled = true` untuk app terdaftar
yang dapat diakses meskipun Codex saat ini menandainya dinonaktifkan. Id app
yang tidak dikenal atau hilang tetap gagal tertutup; jalur ini hanya mengaktifkan
Plugin marketplace melalui `plugin/install` dan menyegarkan inventaris. Hanya
hubungkan OpenClaw ke app-server remote yang dipercaya untuk menerima instalasi
Plugin yang dikelola OpenClaw dan penyegaran inventaris app.

## Mode persetujuan dan sandbox

Sesi app-server stdio lokal secara default menggunakan mode YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Postur operator lokal tepercaya ini memungkinkan
turn dan Heartbeat OpenClaw tanpa pengawasan tetap berjalan tanpa prompt
persetujuan native yang tidak ada orang untuk menjawabnya.

Jika file persyaratan sistem lokal Codex melarang nilai persetujuan YOLO,
peninjau, atau sandbox implisit, OpenClaw memperlakukan default implisit sebagai
guardian dan memilih izin guardian yang diizinkan. `tools.exec.mode: "auto"`
juga memaksa persetujuan Codex yang ditinjau guardian dan tidak mempertahankan
override lama yang tidak aman seperti `approvalPolicy: "never"` atau
`sandbox: "danger-full-access"`; tetapkan `tools.exec.mode: "full"` untuk postur
tanpa persetujuan yang disengaja. Entri `[[remote_sandbox_config]]` yang cocok
dengan hostname dalam file persyaratan yang sama dihormati untuk keputusan
default sandbox.

Tetapkan `appServer.mode: "guardian"` untuk persetujuan Codex yang ditinjau
guardian:

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
`approvalsReviewer: "auto_review"`, dan `sandbox: "workspace-write"` ketika
nilai-nilai tersebut diizinkan. Field kebijakan individual meng-override `mode`.
Nilai peninjau lama `guardian_subagent` masih diterima sebagai alias
kompatibilitas, tetapi konfigurasi baru sebaiknya menggunakan `auto_review`.

Ketika sandbox OpenClaw aktif, proses app-server Codex lokal tetap berjalan di
host Gateway. Karena itu, OpenClaw menonaktifkan Code Mode native Codex, server
MCP pengguna, dan eksekusi Plugin berbasis app untuk turn tersebut alih-alih
memperlakukan sandboxing sisi host Codex sebagai setara dengan backend sandbox
OpenClaw. Akses shell diekspos melalui alat dinamis berbasis sandbox OpenClaw
seperti `sandbox_exec` dan `sandbox_process` ketika alat exec/process normal
tersedia.

Pada host Ubuntu/AppArmor, Codex bwrap dapat gagal di bawah `workspace-write`
sebelum perintah shell dimulai ketika Anda sengaja menjalankan
`workspace-write` native Codex tanpa sandboxing OpenClaw aktif. Jika Anda melihat
`bwrap: setting up uid map: Permission denied` atau
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, jalankan
`openclaw doctor` dan perbaiki kebijakan namespace host yang dilaporkan untuk
pengguna layanan OpenClaw, bukan memberikan hak istimewa container Docker yang
lebih luas. Lebih baik gunakan profil AppArmor terbatas untuk proses layanan;
fallback `kernel.apparmor_restrict_unprivileged_userns=0` berlaku untuk seluruh
host dan memiliki tradeoff keamanan.

## Eksekusi native tersandbox

Default stabil adalah gagal tertutup: sandboxing OpenClaw aktif menonaktifkan
permukaan eksekusi native Codex yang jika tidak demikian akan berjalan dari host
Codex app-server. Gunakan `appServer.experimental.sandboxExecServer: true` hanya
ketika Anda ingin mencoba dukungan lingkungan remote Codex dengan backend sandbox
OpenClaw. Jalur pratinjau ini memerlukan Codex app-server 0.132.0 atau yang
lebih baru.

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

Ketika flag aktif dan sesi OpenClaw saat ini tersandbox, OpenClaw memulai
exec-server local loopback yang didukung oleh sandbox aktif, mendaftarkannya ke
Codex app-server, lalu memulai thread dan turn Codex dengan lingkungan milik
OpenClaw tersebut. Jika app-server tidak dapat mendaftarkan lingkungan, run gagal
tertutup alih-alih diam-diam fallback ke eksekusi host.

Jalur pratinjau ini hanya lokal. App-server WebSocket remote tidak dapat
menjangkau exec-server loopback kecuali berjalan pada host yang sama, jadi
OpenClaw menolak kombinasi tersebut.

## Autentikasi dan isolasi lingkungan

Dalam home per agen default, autentikasi dipilih dalam urutan ini:

1. Profil autentikasi OpenClaw Codex eksplisit untuk agen.
2. Akun app-server yang sudah ada dalam home Codex agen tersebut.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, ketika tidak ada akun app-server dan autentikasi OpenAI
   masih diperlukan.

Ketika OpenClaw melihat profil autentikasi Codex bergaya langganan ChatGPT, ia
menghapus `CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses anak Codex yang
dijalankan. Itu menjaga agar kunci API tingkat Gateway tetap tersedia untuk
embedding atau model OpenAI langsung tanpa membuat turn native Codex app-server
secara tidak sengaja ditagihkan melalui API.

Profil kunci API Codex eksplisit dan fallback kunci env stdio lokal menggunakan
login app-server alih-alih env proses anak yang diwarisi. Koneksi app-server
WebSocket tidak menerima fallback kunci API env Gateway; gunakan profil
autentikasi eksplisit atau akun milik app-server remote itu sendiri.

Peluncuran app-server stdio mewarisi lingkungan proses OpenClaw secara default.
OpenClaw memiliki bridge akun Codex app-server dan menetapkan `CODEX_HOME` ke
direktori per agen di bawah state OpenClaw agen tersebut. Itu menjaga konfigurasi
Codex, akun, cache/data Plugin, dan state thread tetap terbatas pada agen
OpenClaw, bukan bocor dari home pribadi operator `~/.codex`.

Tetapkan `appServer.homeScope: "user"` untuk berbagi state native Codex dengan
Codex Desktop dan CLI. Mode khusus stdio lokal ini menggunakan `$CODEX_HOME`
ketika disetel dan `~/.codex` jika tidak, termasuk autentikasi, konfigurasi,
Plugin, dan thread native. OpenClaw melewati bridge profil autentikasinya untuk
app-server. Turn pemilik terverifikasi dapat menggunakan `codex_threads` untuk
mencantumkan, mencari, membaca, mem-fork, mengganti nama, mengarsipkan, dan
memulihkan thread tersebut. Fork thread sebelum melanjutkannya di OpenClaw;
proses Codex independen tidak mengoordinasikan penulis bersamaan untuk thread
yang sama.

OpenClaw tidak menulis ulang `HOME` untuk peluncuran app-server lokal normal.
Subproses yang dijalankan Codex seperti `openclaw`, `gh`, `git`, CLI cloud, dan
perintah shell melihat home proses normal dan dapat menemukan konfigurasi serta
token home pengguna. Codex juga dapat menemukan `$HOME/.agents/skills` dan
`$HOME/.agents/plugins/marketplace.json`; penemuan `.agents` tersebut sengaja
dibagikan dengan home operator dan terpisah dari state `~/.codex` yang
terisolasi.

Dalam cakupan agen default, Plugin OpenClaw dan snapshot skill OpenClaw tetap
mengalir melalui registry Plugin dan pemuat skill milik OpenClaw sendiri; aset
Codex pribadi `~/.codex` tidak. Jika Anda memiliki Skills atau Plugin Codex CLI
berguna dari home Codex yang seharusnya menjadi bagian dari agen OpenClaw
terisolasi, inventariskan secara eksplisit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Jika deployment membutuhkan isolasi lingkungan tambahan, tambahkan variabel
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

`appServer.clearEnv` hanya memengaruhi proses anak Codex app-server yang
dijalankan. OpenClaw menghapus `CODEX_HOME` dan `HOME` dari daftar ini selama
normalisasi peluncuran lokal: `CODEX_HOME` tetap diarahkan ke cakupan agen atau
pengguna yang dipilih, dan `HOME` tetap diwarisi agar subproses dapat menggunakan
state home pengguna normal.

## Alat dinamis

Alat dinamis Codex secara default menggunakan pemuatan `searchable`. OpenClaw
tidak mengekspos alat dinamis yang menduplikasi operasi workspace native Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Sebagian besar alat integrasi OpenClaw lainnya, seperti messaging, media, cron,
browser, nodes, gateway, `heartbeat_respond`, dan `web_search`, tersedia melalui
pencarian alat Codex di bawah namespace `openclaw`. Ini menjaga konteks model
awal tetap lebih kecil. `sessions_yield` dan balasan sumber khusus alat pesan
tetap langsung karena itu adalah kontrak kontrol turn. `sessions_spawn` tetap
searchable sehingga `spawn_agent` native Codex tetap menjadi permukaan subagen
Codex utama, sementara delegasi OpenClaw atau ACP eksplisit tetap tersedia
melalui namespace alat dinamis `openclaw`.

Tetapkan `codexDynamicToolsLoading: "direct"` hanya ketika menghubungkan ke
app-server Codex kustom yang tidak dapat mencari alat dinamis tertunda atau
ketika men-debug payload alat penuh.

## Timeout

Panggilan alat dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`. Setiap permintaan `item/tool/call` Codex
menggunakan timeout pertama yang tersedia dalam urutan ini:

- Argumen `timeoutMs` per panggilan yang positif.
- Untuk `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Untuk `image_generate` tanpa timeout yang dikonfigurasi, default pembuatan
  gambar 120 detik.
- Untuk alat pemahaman media `image`, `tools.media.image.timeoutSeconds`
  dikonversi ke milidetik, atau default media 60 detik. Untuk pemahaman gambar,
  ini berlaku pada permintaan itu sendiri dan tidak dikurangi oleh pekerjaan
  persiapan sebelumnya.
- Default alat dinamis 90 detik.

Watchdog ini adalah anggaran luar `item/tool/call` dinamis. Timeout permintaan
khusus provider berjalan di dalam panggilan tersebut dan mempertahankan semantik
timeout masing-masing. Anggaran alat dinamis dibatasi pada 600000 ms. Saat
timeout, OpenClaw membatalkan sinyal alat jika didukung dan mengembalikan respons
alat dinamis yang gagal ke Codex agar turn dapat berlanjut alih-alih membiarkan
sesi dalam status `processing`.

Setelah Codex menerima turn, dan setelah OpenClaw merespons permintaan
app-server bercakupan turn, harness mengharapkan Codex membuat progres turn saat
ini dan akhirnya menyelesaikan turn native dengan `turn/completed`. Jika
app-server diam selama `appServer.turnCompletionIdleTimeoutMs`, OpenClaw dengan
upaya terbaik menginterupsi turn Codex, mencatat timeout diagnostik, dan
melepaskan lane sesi OpenClaw agar pesan chat lanjutan tidak mengantre di
belakang turn native yang basi.

Sebagian besar notifikasi non-terminal untuk turn yang sama menonaktifkan pengawas singkat itu
karena Codex telah membuktikan bahwa turn tersebut masih hidup. Handoff alat menggunakan anggaran
idle pasca-alat yang lebih panjang: setelah OpenClaw mengembalikan respons `item/tool/call`, setelah
item alat native seperti `commandExecution` selesai, setelah penyelesaian
`custom_tool_call_output` mentah, dan setelah progres asisten mentah pasca-alat, penyelesaian
penalaran mentah, atau progres penalaran. Guard menggunakan
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` ketika dikonfigurasi dan
secara default menggunakan lima menit jika tidak. Anggaran pasca-alat yang sama juga memperpanjang
pengawas progres untuk jendela sintesis senyap sebelum Codex memancarkan peristiwa
turn saat ini berikutnya. Penyelesaian penalaran, penyelesaian
`agentMessage` komentar, dan progres penalaran atau asisten mentah pra-alat dapat
diikuti oleh balasan final otomatis, sehingga semuanya menggunakan guard balasan pasca-progres
alih-alih segera melepaskan lane sesi. Hanya item `agentMessage` final/non-komentar
yang selesai dan penyelesaian asisten mentah pra-alat yang mengaktifkan pelepasan
output asisten: jika Codex kemudian diam tanpa `turn/completed`, OpenClaw sebisa mungkin
menginterupsi turn native dan melepaskan lane sesi. Kegagalan app-server stdio yang aman untuk
diputar ulang, termasuk timeout idle penyelesaian turn tanpa bukti asisten, alat, item aktif,
atau efek samping, dicoba ulang sekali pada percobaan app-server baru. Timeout yang tidak aman
tetap menghentikan klien app-server yang macet dan melepaskan lane sesi OpenClaw. Timeout itu juga
membersihkan binding thread native yang usang alih-alih diputar ulang secara otomatis. Timeout
pemantauan penyelesaian menampilkan teks timeout khusus Codex: kasus yang aman untuk diputar ulang
menyatakan bahwa respons mungkin tidak lengkap, sementara kasus yang tidak aman memberi tahu pengguna
untuk memverifikasi status saat ini sebelum mencoba lagi. Diagnostik timeout publik menyertakan
bidang struktural seperti metode notifikasi app-server terakhir, id/tipe/peran item respons asisten
mentah, jumlah permintaan/item aktif, dan status watch yang diaktifkan. Ketika notifikasi terakhir
adalah item respons asisten mentah, diagnostik juga menyertakan pratinjau teks asisten yang dibatasi.
Diagnostik tidak menyertakan prompt mentah atau konten alat.

## Penemuan model

Secara default, Plugin Codex meminta model yang tersedia kepada app-server. Ketersediaan model
dimiliki oleh app-server Codex, sehingga daftar dapat berubah ketika OpenClaw
memutakhirkan versi `@openai/codex` yang dibundel atau ketika sebuah deployment mengarahkan
`appServer.command` ke binary Codex yang berbeda. Ketersediaan juga dapat dibatasi per akun.
Gunakan `/codex models` pada gateway yang berjalan untuk melihat katalog live
untuk harness dan akun tersebut.

Jika penemuan gagal atau timeout, OpenClaw menggunakan katalog fallback yang dibundel untuk:

- GPT-5.5
- GPT-5.4 mini

Harness yang dibundel saat ini adalah `@openai/codex` `0.142.4`. Probe `model/list`
terhadap app-server yang dibundel itu di workspace yang mengaktifkan GPT-5.6 mengembalikan baris
pemilih publik berikut:

| ID model              | Modalitas input | Upaya penalaran                      |
| --------------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`         | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | text, image      | low, medium, high, xhigh, max        |
| `gpt-5.5`             | text, image      | low, medium, high, xhigh             |
| `gpt-5.4`             | text, image      | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | text, image      | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | text, image      | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | text             | low, medium, high, xhigh             |

Akses GPT-5.6 dibatasi per akun selama pratinjau terbatas. `max` adalah upaya
penalaran model. `ultra` adalah metadata orkestrasi multi-agent Codex terpisah,
bukan upaya penalaran OpenAI standar.

Model tersembunyi dapat dikembalikan oleh katalog app-server untuk alur internal atau
khusus, tetapi bukan pilihan pemilih model normal.

Atur penemuan di bawah `plugins.entries.codex.config.discovery`:

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

Nonaktifkan penemuan ketika Anda ingin startup menghindari probing Codex dan hanya menggunakan
katalog fallback:

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

## File bootstrap workspace

Codex menangani `AGENTS.md` sendiri melalui penemuan project-doc native. OpenClaw
tidak menulis file project-doc Codex sintetis atau bergantung pada nama file fallback Codex
untuk file persona, karena fallback Codex hanya berlaku ketika
`AGENTS.md` tidak ada.

Untuk paritas workspace OpenClaw, harness Codex menyelesaikan file bootstrap
lainnya. `SOUL.md`, `IDENTITY.md`, `TOOLS.md`, dan `USER.md` diteruskan sebagai
instruksi developer OpenClaw Codex karena file-file itu mendefinisikan agen aktif,
panduan workspace yang tersedia, dan profil pengguna. Daftar Skills OpenClaw yang ringkas
diteruskan sebagai instruksi developer kolaborasi berbatas turn.
Konten `HEARTBEAT.md` tidak disuntikkan; turn Heartbeat mendapatkan pointer mode kolaborasi
untuk membaca file ketika file itu ada dan tidak kosong. Konten `MEMORY.md`
dari workspace agen yang dikonfigurasi tidak ditempelkan ke input turn Codex native
ketika alat memori tersedia untuk workspace tersebut; ketika file itu ada, harness
menambahkan pointer kecil memori-workspace ke instruksi developer kolaborasi berbatas turn
dan Codex harus menggunakan `memory_search` atau `memory_get` ketika memori durabel
relevan. Jika alat dinonaktifkan, pencarian memori tidak tersedia, atau
workspace aktif berbeda dari workspace memori agen, `MEMORY.md` menggunakan
jalur konteks turn berbatas normal.
`BOOTSTRAP.md` ketika ada diteruskan sebagai konteks referensi input turn OpenClaw.

## Override lingkungan

Override lingkungan tetap tersedia untuk pengujian lokal:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` melewati binary terkelola ketika
`appServer.command` tidak disetel.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya, atau
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal sekali pakai. Config
lebih disarankan untuk deployment yang dapat diulang karena menjaga perilaku Plugin dalam
file yang sama-sama ditinjau dengan sisa setup harness Codex.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Plugin Codex native](/id/plugins/codex-native-plugins)
- [Codex Computer Use](/id/plugins/codex-computer-use)
- [Penyedia OpenAI](/id/providers/openai)
- [Referensi konfigurasi](/id/gateway/configuration-reference)
