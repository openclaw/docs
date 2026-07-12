---
read_when:
    - Mengonfigurasi persetujuan eksekusi atau daftar yang diizinkan
    - Mengimplementasikan UX persetujuan eksekusi di aplikasi macOS
    - Meninjau prompt pelarian sandbox dan implikasinya
sidebarTitle: Exec approvals
summary: 'Persetujuan eksekusi host: opsi kebijakan, daftar izin, dan alur kerja YOLO/ketat'
title: Persetujuan eksekusi
x-i18n:
    generated_at: "2026-07-12T14:44:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b44efdfe5a6c9f3cc978baef91d80d1f75d39627d3a16f5971800809a642a72c
    source_path: tools/exec-approvals.md
    workflow: 16
---

Persetujuan eksekusi adalah **pagar pengaman aplikasi pendamping / host node** yang memungkinkan agen
dalam sandbox menjalankan perintah pada host nyata (`gateway` atau `node`). Perintah
hanya dijalankan ketika kebijakan + daftar izin + persetujuan pengguna (opsional) semuanya selaras.
Persetujuan diterapkan **di atas** kebijakan alat dan pembatasan elevated (elevated
`full` melewatinya).

Untuk ikhtisar berbasis mode tentang `deny`, `allowlist`, `ask`, `auto`, `full`,
pemetaan Codex Guardian, dan izin harness ACPX, lihat
[Mode izin](/id/tools/permission-modes).

<Note>
Kebijakan efektif adalah yang **lebih ketat** antara `tools.exec.*` dan nilai
default persetujuan: persetujuan hanya dapat memperketat keamanan/permintaan yang berasal dari konfigurasi,
tidak pernah melonggarkannya. Jika kolom persetujuan tidak dicantumkan, nilai `tools.exec`
akan digunakan. Eksekusi host juga menggunakan status persetujuan lokal pada mesin tersebut—nilai
lokal host `ask: "always"` dalam berkas persetujuan host eksekusi akan terus
meminta persetujuan meskipun nilai default sesi atau konfigurasi menetapkan `ask: "on-miss"`.
</Note>

## Cakupan penerapan

Persetujuan eksekusi diberlakukan secara lokal pada host eksekusi:

- **Host Gateway** -> proses `openclaw` pada mesin gateway.
- **Host Node** -> runner node (aplikasi pendamping macOS atau host node tanpa antarmuka).

### Model kepercayaan

- Pemanggil yang diautentikasi Gateway adalah operator tepercaya untuk Gateway tersebut.
- Node yang dipasangkan memperluas kemampuan operator tepercaya tersebut ke host node.
- Persetujuan mengurangi risiko eksekusi yang tidak disengaja, tetapi **bukan** batas autentikasi per pengguna atau kebijakan sistem berkas hanya-baca.
- Setelah disetujui, perintah dapat mengubah berkas sesuai dengan izin sistem berkas host atau sandbox yang dipilih.
- Eksekusi host node yang disetujui mengikat konteks eksekusi kanonis: cwd, argv persis, pengikatan env jika ada, dan jalur executable yang disematkan jika berlaku.
- Untuk skrip shell dan pemanggilan berkas interpreter/runtime secara langsung, OpenClaw juga mencoba mengikat satu operand berkas lokal konkret. Jika berkas tersebut berubah setelah persetujuan tetapi sebelum eksekusi, proses akan ditolak alih-alih mengeksekusi konten yang telah berubah.
- Pengikatan berkas dilakukan sebisa mungkin, bukan model lengkap untuk setiap jalur pemuat interpreter/runtime. Jika tepat satu berkas lokal konkret tidak dapat diidentifikasi, OpenClaw menolak membuat eksekusi yang didukung persetujuan alih-alih berpura-pura memberikan cakupan penuh.

### Pemisahan macOS

- **Layanan host node** meneruskan `system.run` ke **aplikasi macOS** melalui IPC lokal.
- **Aplikasi macOS** memberlakukan persetujuan dan mengeksekusi perintah dalam konteks UI.

## Memeriksa kebijakan efektif

| Perintah                                                         | Yang ditampilkan                                                                        |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Kebijakan yang diminta, sumber kebijakan host, dan hasil efektif.                       |
| `openclaw exec-policy show`                                      | Tampilan gabungan mesin lokal.                                                          |
| `openclaw exec-policy set` / `preset`                            | Menyinkronkan kebijakan lokal yang diminta dengan berkas persetujuan host lokal dalam satu langkah. |

<Note>
Penggantian `/exec` per sesi tidak disertakan. Jalankan `/exec` dalam sesi terkait untuk memeriksa nilai default saat ini. Lihat [penggantian sesi](/id/tools/exec#session-overrides-exec).
</Note>

Referensi CLI lengkap (flag, keluaran JSON, tambah/hapus daftar izin): [CLI persetujuan](/id/cli/approvals).

Ketika cakupan lokal menetapkan `host=node`, `exec-policy show` melaporkan
cakupan tersebut sebagai dikelola node saat runtime, alih-alih memperlakukan berkas persetujuan
lokal sebagai sumber kebenaran.

Jika UI aplikasi pendamping **tidak tersedia**, setiap permintaan yang biasanya
menampilkan prompt diselesaikan oleh **fallback permintaan** (default: `deny`).

<Tip>
Klien persetujuan obrolan native dapat menyertakan fitur khusus saluran pada
pesan persetujuan yang tertunda. Matrix menyertakan pintasan reaksi (`✅` izinkan sekali,
`♾️` selalu izinkan, `❌` tolak), sekaligus tetap menyertakan `/approve ...` dalam
pesan sebagai fallback.
</Tip>

## Pengaturan dan penyimpanan

Persetujuan disimpan dalam berkas JSON lokal pada host eksekusi. Ketika
`OPENCLAW_STATE_DIR` ditetapkan, berkas mengikuti direktori status tersebut;
jika tidak, direktori status default OpenClaw digunakan:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# jika tidak
~/.openclaw/exec-approvals.json
```

Soket persetujuan default mengikuti root yang sama:
`$OPENCLAW_STATE_DIR/exec-approvals.sock`, atau
`~/.openclaw/exec-approvals.sock` ketika variabel tidak ditetapkan.

Rilis sebelum 2026.6.6 selalu menyimpan berkas di `~/.openclaw`. Jika
`OPENCLAW_STATE_DIR` menunjuk ke lokasi lain dan berkas persetujuan masih ada
di direktori default, jalankan `openclaw doctor --fix` secara langsung satu kali untuk mengimpornya
ke direktori status (berkas asli diarsipkan dengan sufiks `.migrated`).
Doctor interaktif juga dapat menampilkan pratinjau dan mengonfirmasi impor. Proses pembaruan
otomatis dan perbaikan pemantauan Gateway tidak pernah mengimpor lintas direktori status:
direktori status sementara atau staging tidak boleh mengambil persetujuan instalasi
default. Batas yang sama berlaku untuk impor lama
`plugin-binding-approvals.json` ke status SQLite bersama.

Contoh skema:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "source": "allow-always",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Opsi kebijakan

### `tools.exec.mode`

`tools.exec.mode` adalah permukaan kebijakan ternormalisasi yang diutamakan untuk eksekusi host:

| Nilai       | Perilaku                                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | Memblokir eksekusi host.                                                                                                                                                 |
| `allowlist` | Hanya menjalankan perintah dalam daftar izin tanpa meminta persetujuan.                                                                                                  |
| `ask`       | Menggunakan kebijakan daftar izin dan meminta persetujuan jika tidak cocok.                                                                                              |
| `auto`      | Menggunakan kebijakan daftar izin, langsung menjalankan kecocokan deterministik, dan mengirim ketidakcocokan persetujuan melalui peninjau otomatis native OpenClaw sebelum beralih ke jalur persetujuan manusia. |
| `full`      | Menjalankan eksekusi host tanpa prompt persetujuan.                                                                                                                      |

`tools.exec.security` / `tools.exec.ask` lama tetap didukung dan masih
berlaku di setiap cakupan tempat `mode` tidak ditetapkan.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - memblokir semua permintaan eksekusi host.
  - `allowlist` - hanya mengizinkan perintah dalam daftar izin.
  - `full` - mengizinkan semuanya (setara dengan elevated).

Nilai default adalah `full` untuk host gateway/node; host `sandbox` memiliki nilai default
`deny`.
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Kebijakan permintaan yang dikonfigurasi untuk eksekusi host. Mengontrol perilaku dasar prompt
  persetujuan dari `tools.exec.ask` dan nilai default persetujuan host.
  Nilai default adalah `off`. Parameter alat `ask` per panggilan (lihat
  [Alat eksekusi](/id/tools/exec#parameters)) hanya dapat memperketat dasar tersebut, dan
  panggilan model yang berasal dari saluran mengabaikannya ketika permintaan host efektif adalah `off`.

- `off` - tidak pernah menampilkan prompt.
- `on-miss` - menampilkan prompt hanya ketika daftar izin tidak cocok.
- `always` - menampilkan prompt untuk setiap perintah. Kepercayaan permanen `allow-always` **tidak** meniadakan prompt ketika mode permintaan efektif adalah `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Penyelesaian ketika prompt diperlukan tetapi tidak ada UI yang dapat dijangkau (atau
  prompt kehabisan waktu). Nilai default adalah `deny` jika tidak dicantumkan.

- `deny` - blokir.
- `allowlist` - izinkan hanya jika daftar izin cocok.
- `full` - izinkan.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Ketika `true`, bentuk evaluasi kode inline dianggap hanya dapat dijalankan dengan persetujuan meskipun
  biner interpreter itu sendiri ada dalam daftar izin. Pertahanan berlapis untuk
  pemuat interpreter yang tidak dapat dipetakan dengan jelas ke satu operand berkas stabil.
</ParamField>

Contoh yang terdeteksi oleh mode ketat: `python -c`, `node -e`/`--eval`/`-p`,
`ruby -e`, `perl -e`/`-E`, `php -r`, `lua -e`, `osascript -e` (juga bentuk inline
`awk`, `sed`, `make`, `find -exec`, dan `xargs`).

Dalam mode ketat, perintah ini memerlukan persetujuan peninjau atau persetujuan eksplisit. Dengan
`tools.exec.mode: "auto"`, peninjau dapat memberikan satu kali eksekusi berisiko rendah ketika
perintah memiliki rencana yang dapat diberlakukan; jika tidak, OpenClaw meminta persetujuan manusia.
Persetujuan perintah `Codex app-server` yang mencapai fallback peninjau meminta persetujuan
manusia karena permintaan persetujuannya tidak menampilkan executable teresolusi yang dapat diberlakukan.
`allow-always` tidak menyimpan entri daftar izin baru untuk perintah evaluasi inline.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Hanya untuk penyajian: ketika diaktifkan, OpenClaw dapat menyertakan rentang
  perintah yang berasal dari parser agar prompt persetujuan Web dapat menyoroti token perintah. Ini
  **tidak** mengubah `security`, `ask`, pencocokan daftar izin, perilaku evaluasi inline
  ketat, penerusan persetujuan, atau eksekusi perintah.
</ParamField>

Tetapkan secara global melalui `tools.exec.commandHighlighting` atau per agen melalui
`agents.list[].tools.exec.commandHighlighting`.

## Mode YOLO (tanpa persetujuan)

Untuk menjalankan eksekusi host tanpa prompt persetujuan, buka **kedua** lapisan kebijakan:
kebijakan eksekusi yang diminta dalam konfigurasi OpenClaw (`tools.exec.*`) **dan**
kebijakan persetujuan lokal host dalam berkas persetujuan host eksekusi.

`askFallback` yang tidak dicantumkan memiliki nilai default `deny`. Tetapkan `askFallback` host ke `full`
secara eksplisit jika prompt persetujuan tanpa UI harus beralih ke mengizinkan.

| Lapisan               | Pengaturan YOLO            |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` pada `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| `askFallback` host    | `full`                     |

<Warning>
**Perbedaan penting:**

- `tools.exec.host=auto` memilih **tempat** eksekusi berjalan: sandbox jika tersedia, jika tidak gateway.
- YOLO memilih **cara** eksekusi host disetujui: `security=full` ditambah `ask=off`.
- YOLO **tidak** menambahkan gerbang persetujuan heuristik terpisah untuk penyamaran perintah atau lapisan penolakan prapemeriksaan skrip di atas kebijakan eksekusi host yang dikonfigurasi.
- `auto` tidak menjadikan perutean gateway sebagai penggantian bebas dari sesi dalam sandbox. Permintaan `host=node` per panggilan diizinkan dari `auto`; `host=gateway` hanya diizinkan dari `auto` ketika tidak ada runtime sandbox aktif. Untuk nilai default non-auto yang stabil, tetapkan `tools.exec.host` atau gunakan `/exec host=...` secara eksplisit.

</Warning>

Penyedia berbasis CLI yang menyediakan mode izin noninteraktifnya sendiri
dapat mengikuti kebijakan ini. Claude CLI menambahkan
`--permission-mode bypassPermissions` ketika kebijakan exec efektif
OpenClaw adalah YOLO. Untuk sesi langsung Claude yang dikelola OpenClaw,
kebijakan exec efektif OpenClaw lebih berwenang daripada mode izin asli Claude:
YOLO menormalkan peluncuran langsung menjadi `--permission-mode bypassPermissions`, dan
kebijakan exec efektif yang membatasi menormalkan peluncuran langsung menjadi
`--permission-mode default`, meskipun argumen backend Claude mentah menentukan mode
lain.

Jika Anda menginginkan penyiapan yang lebih konservatif, perketat kembali kebijakan exec OpenClaw ke
`allowlist` / `on-miss` atau `deny`.

### Penyiapan "jangan pernah meminta konfirmasi" yang persisten pada host Gateway

<Steps>
  <Step title="Tetapkan kebijakan konfigurasi yang diminta">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Selaraskan berkas persetujuan host">
    ```bash
    openclaw approvals set --stdin <<'EOF'
    {
      version: 1,
      defaults: {
        security: "full",
        ask: "off",
        askFallback: "full"
      }
    }
    EOF
    ```
  </Step>
</Steps>

### Pintasan lokal

```bash
openclaw exec-policy preset yolo
```

Memperbarui `tools.exec.host/security/ask` lokal dan nilai default berkas persetujuan
lokal (termasuk `askFallback: "full"`). Ini sengaja
hanya berlaku secara lokal. Untuk mengubah persetujuan host Gateway atau host Node dari jarak jauh, gunakan
`openclaw approvals set --gateway` atau `openclaw approvals set --node
<id|name|ip>`.

Prasetel bawaan lainnya: `cautious` (`host=gateway`, `security=allowlist`,
`ask=on-miss`, `askFallback=deny`) dan `deny-all` (`host=gateway`,
`security=deny`, `ask=off`, `askFallback=deny`). Terapkan dengan cara yang sama:
`openclaw exec-policy preset cautious`.

Untuk menetapkan masing-masing bidang alih-alih prasetel lengkap, gunakan
`openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>` dengan subset apa pun dari tanda tersebut.

### Host Node

Terapkan berkas persetujuan yang sama pada Node:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

<Note>
**Batasan hanya-lokal:**

- `openclaw exec-policy` tidak menyinkronkan persetujuan Node.
- `openclaw exec-policy set --host node` ditolak.
- Persetujuan exec Node diambil dari Node saat runtime, sehingga pembaruan yang menargetkan Node harus menggunakan `openclaw approvals --node ...`.

</Note>

### Pintasan khusus sesi

- `/exec security=full ask=off` hanya mengubah sesi saat ini.
- `/elevated full` adalah pintasan darurat yang melewati persetujuan exec hanya
  ketika kebijakan yang diminta dan berkas persetujuan host sama-sama menghasilkan
  `security: "full"` dan `ask: "off"`. Berkas host yang lebih ketat, seperti `ask:
"always"`, tetap meminta konfirmasi.

Jika berkas persetujuan host tetap lebih ketat daripada konfigurasi, kebijakan host
yang lebih ketat tetap berlaku.

## Daftar izin (per agen)

Daftar izin bersifat **per agen**. Jika terdapat beberapa agen, alihkan agen
yang sedang Anda edit di aplikasi macOS. Pola menggunakan pencocokan glob.

Pola dapat berupa glob jalur biner yang telah diresolusi atau glob nama perintah polos.
Nama polos hanya cocok dengan perintah yang dipanggil melalui `PATH`, sehingga `rg` dapat cocok dengan
`/opt/homebrew/bin/rg` ketika perintahnya adalah `rg`, tetapi **tidak** dengan `./rg` atau
`/tmp/rg`. Gunakan glob jalur untuk memercayai satu lokasi biner tertentu.

Entri lama `agents.default` dimigrasikan ke `agents.main` saat dimuat.
Rangkaian shell seperti `echo ok && pwd` tetap mengharuskan setiap segmen tingkat atas
memenuhi aturan daftar izin.

Contoh:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Membatasi argumen dengan argPattern

Tambahkan `argPattern` ketika entri daftar izin harus cocok dengan sebuah biner dan
bentuk argumen tertentu. OpenClaw menggunakan semantik ekspresi reguler
ECMAScript (JavaScript) pada setiap host dan mengevaluasi ekspresi terhadap
argumen perintah yang telah diurai, tanpa menyertakan token yang dapat dieksekusi (`argv[0]`).
Untuk entri yang dibuat secara manual, argumen digabungkan dengan satu spasi, jadi
tambahkan jangkar pada pola ketika Anda memerlukan kecocokan persis.

```json
{
  "version": 1,
  "agents": {
    "main": {
      "allowlist": [
        {
          "pattern": "python3",
          "argPattern": "^safe\\.py$"
        }
      ]
    }
  }
}
```

Entri tersebut mengizinkan `python3 safe.py`; `python3 other.py` tidak
cocok dengan daftar izin. Jika entri khusus-jalur untuk biner yang sama juga tersedia, argumen
yang tidak cocok masih dapat menggunakan entri khusus-jalur tersebut sebagai cadangan. Hilangkan entri khusus-jalur
ketika tujuannya adalah membatasi biner hanya pada argumen yang dideklarasikan.

Entri yang disimpan oleh alur persetujuan menggunakan format pemisah internal untuk pencocokan
argv secara persis. Sebaiknya gunakan UI atau alur persetujuan untuk membuat ulang entri tersebut
daripada mengedit nilai yang dikodekan secara manual. Jika OpenClaw tidak dapat mengurai argv
untuk suatu segmen perintah, entri dengan `argPattern` tidak akan cocok.

Setiap entri daftar izin mendukung:

| Bidang             | Arti                                                         |
| ------------------ | ------------------------------------------------------------ |
| `pattern`          | Glob jalur biner yang diresolusi atau glob nama perintah polos |
| `argPattern`       | Regex argv ECMAScript opsional; jika dihilangkan, hanya jalur |
| `id`               | ID buram stabil; dibuat sebagai UUID jika tidak tersedia     |
| `source`           | Sumber entri, seperti `allow-always`                         |
| `commandText`      | Masukan teks biasa lama; dibuang saat dimuat                 |
| `lastUsedAt`       | Stempel waktu penggunaan terakhir                           |
| `lastUsedCommand`  | Perintah terakhir yang cocok                                 |
| `lastResolvedPath` | Jalur biner terakhir yang diresolusi                         |

## Izinkan otomatis CLI Skills

Ketika **Izinkan otomatis CLI Skills** (`autoAllowSkills`) diaktifkan, program yang dapat dieksekusi
yang dirujuk oleh Skills yang dikenal dianggap masuk daftar izin pada Node (Node macOS
atau host Node tanpa antarmuka). Ini menggunakan `skills.bins` melalui RPC Gateway untuk
mengambil daftar biner Skills. Nonaktifkan ini jika Anda menginginkan daftar izin manual
yang ketat.

<Warning>
- Ini adalah **daftar izin kemudahan implisit**, yang terpisah dari entri daftar izin jalur manual.
- Ini ditujukan untuk lingkungan operator tepercaya tempat Gateway dan Node berada dalam batas kepercayaan yang sama.
- Jika Anda memerlukan kepercayaan eksplisit yang ketat, pertahankan `autoAllowSkills: false` dan gunakan hanya entri daftar izin jalur manual.

</Warning>

## Biner aman dan penerusan persetujuan

Untuk biner aman (jalur cepat khusus stdin), detail pengikatan interpreter, dan
cara meneruskan permintaan persetujuan ke Slack/Discord/Telegram (atau menjalankannya sebagai
klien persetujuan asli), lihat
[Persetujuan exec - lanjutan](/id/tools/exec-approvals-advanced).

## Pengeditan UI Kontrol

Gunakan kartu **Control UI -> Nodes -> Exec approvals** untuk mengedit nilai default,
penggantian per agen, dan daftar izin. Pilih cakupan (Default atau agen),
sesuaikan kebijakan, tambahkan/hapus pola daftar izin, lalu **Save**. UI
menampilkan metadata penggunaan terakhir per pola agar Anda dapat menjaga daftar tetap rapi.

Pemilih target memilih **Gateway** (persetujuan lokal) atau **Node**.
Node harus mengiklankan `system.execApprovals.get/set` (aplikasi macOS atau host
Node tanpa antarmuka). Jika suatu Node belum mengiklankan persetujuan exec, edit
berkas persetujuan lokalnya secara langsung.

Beberapa host Node, termasuk pendamping Windows, memiliki format kebijakan persetujuan
yang berbeda. UI Kontrol menampilkan kebijakan asli host ini dalam mode hanya-baca. Gunakan
aplikasi pendamping atau `openclaw approvals set --node <id|name|ip>` dengan bentuk
kebijakan asli untuk mengeditnya; lihat [CLI Persetujuan](/id/cli/approvals).

CLI: `openclaw approvals` mendukung pengeditan Gateway atau Node - lihat
[CLI Persetujuan](/id/cli/approvals).

## Alur persetujuan

Ketika permintaan konfirmasi diperlukan, Gateway menyiarkan
`exec.approval.requested` kepada klien operator. UI Kontrol dan aplikasi macOS
menyelesaikannya melalui `exec.approval.resolve`, lalu Gateway meneruskan permintaan
yang disetujui ke host Node.

Untuk `host=node`, permintaan persetujuan menyertakan muatan `systemRunPlan`
kanonis. Gateway menggunakan rencana tersebut sebagai konteks perintah/cwd/sesi
yang berwenang ketika meneruskan permintaan `system.run` yang disetujui:

- Jalur exec Node menyiapkan satu rencana kanonis sejak awal.
- Catatan persetujuan menyimpan rencana tersebut dan metadata pengikatannya.
- Setelah disetujui, panggilan `system.run` terakhir yang diteruskan menggunakan kembali rencana tersimpan alih-alih memercayai perubahan pemanggil berikutnya.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau `sessionKey` setelah permintaan persetujuan dibuat, Gateway menolak proses yang diteruskan karena ketidakcocokan persetujuan.

## Peristiwa sistem dan penolakan

Siklus hidup exec memposting pesan sistem `Exec finished` ke sesi agen
setelah Node melaporkan penyelesaian. OpenClaw juga dapat mengirimkan pemberitahuan
sedang berlangsung setelah persetujuan diberikan dan
`tools.exec.approvalRunningNoticeMs` berlalu (default `10000`, `0` menonaktifkannya).
Persetujuan exec yang ditolak bersifat final bagi perintah host: perintah
tidak dijalankan.

- Untuk persetujuan asinkron agen utama yang memiliki sesi asal, OpenClaw
  memposting penolakan kembali ke sesi tersebut sebagai tindak lanjut internal agar
  agen dapat berhenti menunggu perintah asinkron dan menghindari
  perbaikan hasil yang hilang.
- Jika tidak ada sesi atau sesi tidak dapat dilanjutkan, OpenClaw tetap dapat
  melaporkan penolakan ringkas kepada operator atau rute percakapan langsung.
- Penolakan untuk sesi subagen dan Cron tidak diposting kembali ke
  sesi tersebut.

Persetujuan exec host Gateway mengirimkan peristiwa siklus hidup penyelesaian yang sama.
Exec yang dibatasi persetujuan menggunakan kembali ID persetujuan untuk menghubungkan permintaan
tertunda dengan pesan penyelesaian/penolakannya (`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`).

## Implikasi

- **`full`** sangat kuat; utamakan daftar izin jika memungkinkan.
- **`ask`** memastikan Anda tetap terlibat sekaligus memungkinkan persetujuan cepat.
- Daftar izin per agen mencegah persetujuan satu agen bocor ke agen lain.
- Persetujuan hanya berlaku untuk permintaan exec host dari **pengirim yang diotorisasi**. Pengirim yang tidak diotorisasi tidak dapat mengeluarkan `/exec`.
- `/exec security=full` adalah kemudahan tingkat sesi bagi operator yang diotorisasi dan secara sengaja melewati persetujuan. Untuk memblokir penuh exec host, tetapkan keamanan persetujuan ke `deny` atau tolak alat `exec` melalui kebijakan alat.

## Terkait

<CardGroup cols={2}>
  <Card title="Persetujuan exec - lanjutan" href="/id/tools/exec-approvals-advanced" icon="gear">
    Biner aman, pengikatan interpreter, dan penerusan persetujuan ke percakapan.
  </Card>
  <Card title="Alat exec" href="/id/tools/exec" icon="terminal">
    Alat eksekusi perintah shell.
  </Card>
  <Card title="Mode ditingkatkan" href="/id/tools/elevated" icon="shield-exclamation">
    Jalur darurat yang juga melewati persetujuan.
  </Card>
  <Card title="Sandboxing" href="/id/gateway/sandboxing" icon="box">
    Mode sandbox dan akses ruang kerja.
  </Card>
  <Card title="Keamanan" href="/id/gateway/security" icon="lock">
    Model keamanan dan penguatan.
  </Card>
  <Card title="Sandbox vs kebijakan alat vs ditingkatkan" href="/id/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Kapan menggunakan masing-masing kontrol.
  </Card>
  <Card title="Skills" href="/id/tools/skills" icon="sparkles">
    Perilaku izin otomatis yang didukung Skills.
  </Card>
</CardGroup>
