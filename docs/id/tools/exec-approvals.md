---
read_when:
    - Mengonfigurasi persetujuan atau daftar izin exec
    - Mengimplementasikan UX persetujuan eksekusi di aplikasi macOS
    - Meninjau prompt pelolosan sandbox dan implikasinya
sidebarTitle: Exec approvals
summary: 'Persetujuan eksekusi host: pengaturan kebijakan, daftar izin, dan alur kerja YOLO/ketat'
title: Persetujuan eksekusi
x-i18n:
    generated_at: "2026-07-19T05:13:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4553f129db78cce95bfde7c4a13b95a2282f9d1ab38ba5819a0816a4fd5ea4c6
    source_path: tools/exec-approvals.md
    workflow: 16
---

Persetujuan eksekusi adalah **mekanisme pengaman aplikasi pendamping / host node** untuk mengizinkan agen
dalam sandbox menjalankan perintah pada host nyata (`gateway` atau `node`). Perintah
hanya dijalankan jika kebijakan + daftar izin + persetujuan pengguna (opsional) semuanya menyetujuinya.
Persetujuan diterapkan **di atas** kebijakan alat dan gerbang elevated (elevated
`full` melewatinya).

Untuk ikhtisar berdasarkan mode mengenai `deny`, `allowlist`, `ask`, `auto`, `full`,
pemetaan Codex Guardian, dan izin harness ACPX, lihat
[Mode izin](/id/tools/permission-modes).

<Note>
Kebijakan efektif adalah yang **lebih ketat** antara `tools.exec.*` dan nilai default
persetujuan: persetujuan hanya dapat memperketat keamanan/permintaan yang berasal dari konfigurasi, tidak pernah
melonggarkannya. Jika bidang persetujuan dihilangkan, nilai `tools.exec`
digunakan. Eksekusi host juga menggunakan status persetujuan lokal pada mesin tersebut —
`ask: "always"` lokal-host dalam berkas persetujuan host eksekusi tetap
meminta persetujuan meskipun nilai default sesi atau konfigurasi meminta `ask: "on-miss"`.
</Note>

## Tempat penerapannya

Persetujuan eksekusi diberlakukan secara lokal pada host eksekusi:

- **Host Gateway** -> proses `openclaw` pada mesin gateway.
- **Host node** -> runner node (aplikasi pendamping macOS atau host node tanpa antarmuka).

### Model kepercayaan

- Pemanggil yang diautentikasi oleh Gateway merupakan operator tepercaya untuk Gateway tersebut.
- Node yang dipasangkan memperluas kemampuan operator tepercaya tersebut ke host node.
- Persetujuan mengurangi risiko eksekusi yang tidak disengaja, tetapi **bukan** batas autentikasi per pengguna atau kebijakan sistem berkas hanya-baca.
- Setelah disetujui, perintah dapat mengubah berkas sesuai dengan izin sistem berkas host atau sandbox yang dipilih.
- Eksekusi host node yang disetujui mengikat konteks eksekusi kanonis: cwd, argv persis, pengikatan env jika ada, serta jalur executable yang disematkan jika berlaku.
- Untuk skrip shell dan pemanggilan berkas interpreter/runtime secara langsung, OpenClaw juga mencoba mengikat satu operand berkas lokal konkret. Jika berkas tersebut berubah setelah persetujuan tetapi sebelum eksekusi, eksekusi ditolak alih-alih menjalankan konten yang telah berubah.
- Pengikatan berkas dilakukan semaksimal mungkin, bukan model lengkap untuk setiap jalur pemuat interpreter/runtime. Jika tepat satu berkas lokal konkret tidak dapat diidentifikasi, OpenClaw menolak membuat eksekusi yang didukung persetujuan alih-alih berpura-pura memberikan cakupan penuh.

### Pemisahan macOS

- **Layanan host node** meneruskan `system.run` ke **aplikasi macOS** melalui IPC lokal.
- **Aplikasi macOS** memberlakukan persetujuan dan menjalankan perintah dalam konteks UI.

## Memeriksa kebijakan efektif

| Perintah                                                         | Yang ditampilkan                                                                        |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Kebijakan yang diminta, sumber kebijakan host, dan hasil efektif.                       |
| `openclaw exec-policy show`                                      | Tampilan gabungan mesin lokal.                                                          |
| `openclaw exec-policy set` / `preset`                            | Menyinkronkan kebijakan lokal yang diminta dengan berkas persetujuan host lokal dalam satu langkah. |

<Note>
Penggantian `/exec` per sesi tidak disertakan. Jalankan `/exec` dalam sesi yang relevan untuk memeriksa nilai defaultnya saat ini. Lihat [penggantian sesi](/id/tools/exec#session-overrides-exec).
</Note>

Referensi CLI lengkap (flag, keluaran JSON, penambahan/penghapusan daftar izin): [CLI Persetujuan](/id/cli/approvals).

Saat cakupan lokal meminta `host=node`, `exec-policy show` melaporkan
cakupan tersebut sebagai dikelola node saat runtime, bukan memperlakukan berkas persetujuan
lokal sebagai sumber kebenaran.

Jika UI aplikasi pendamping **tidak tersedia**, setiap permintaan yang biasanya
memunculkan prompt diselesaikan oleh **fallback permintaan** (default: `deny`).

<Tip>
Klien persetujuan chat native dapat menyertakan kemudahan khusus saluran pada
pesan persetujuan yang tertunda. Matrix menyediakan pintasan reaksi (`✅` izinkan sekali,
`♾️` selalu izinkan, `❌` tolak), sekaligus tetap menyertakan `/approve ...` dalam
pesan sebagai fallback.
</Tip>

## Pengaturan dan penyimpanan

Persetujuan disimpan dalam berkas JSON lokal pada host eksekusi. Saat
`OPENCLAW_STATE_DIR` ditetapkan, berkas mengikuti direktori status tersebut;
jika tidak, berkas menggunakan direktori status default OpenClaw:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# jika tidak
~/.openclaw/exec-approvals.json
```

Soket persetujuan default mengikuti root yang sama:
`$OPENCLAW_STATE_DIR/exec-approvals.sock`, atau
`~/.openclaw/exec-approvals.sock` saat variabel tidak ditetapkan.

Direktori status merupakan cakupan kepercayaan yang independen. Saat `OPENCLAW_STATE_DIR`
mengarah ke tempat lain, OpenClaw tidak pernah mengimpor atau mengarsipkan
`~/.openclaw/exec-approvals.json`; konfigurasikan persetujuan secara terpisah untuk
direktori status khusus tersebut. Doctor juga hanya mengimpor
`plugin-binding-approvals.json` lama jika berkas tersebut termasuk dalam direktori status
aktif.

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

## Kendali kebijakan

### `tools.exec.mode`

`tools.exec.mode` adalah permukaan kebijakan ternormalisasi yang diutamakan untuk eksekusi host:

| Nilai       | Perilaku                                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | Blokir eksekusi host.                                                                                                                                                          |
| `allowlist` | Jalankan hanya perintah dalam daftar izin tanpa bertanya.                                                                                                                             |
| `ask`       | Gunakan kebijakan daftar izin dan tanyakan jika tidak cocok.                                                                                                                                   |
| `auto`      | Gunakan kebijakan daftar izin, jalankan kecocokan deterministik secara langsung, dan kirim ketidakcocokan persetujuan melalui peninjau otomatis native OpenClaw sebelum beralih ke jalur persetujuan manusia. |
| `full`      | Jalankan eksekusi host tanpa prompt persetujuan.                                                                                                                                   |

`tools.exec.security` / `tools.exec.ask` lama tetap didukung dan masih
berlaku di mana pun `mode` tidak ditetapkan pada cakupan tersebut.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - blokir semua permintaan eksekusi host.
  - `allowlist` - izinkan hanya perintah dalam daftar izin.
  - `full` - izinkan semuanya (setara dengan elevated).

Default-nya adalah `full` untuk host gateway/node; host `sandbox` menggunakan
`deny` sebagai default.
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Kebijakan permintaan yang dikonfigurasi untuk eksekusi host. Mengontrol perilaku prompt
  persetujuan dasar dari `tools.exec.ask` dan nilai default persetujuan host.
  Default-nya adalah `off`. Parameter alat `ask` per pemanggilan (lihat
  [Alat eksekusi](/id/tools/exec#parameters)) hanya dapat memperketat dasar tersebut, dan
  pemanggilan model yang berasal dari saluran mengabaikannya saat permintaan host efektif adalah `off`.

- `off` - jangan pernah menampilkan prompt.
- `on-miss` - tampilkan prompt hanya saat daftar izin tidak cocok.
- `always` - tampilkan prompt untuk setiap perintah. Kepercayaan permanen `allow-always` **tidak** meniadakan prompt saat mode permintaan efektif adalah `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Penyelesaian saat prompt diperlukan tetapi tidak ada UI yang dapat dijangkau (atau
  waktu prompt habis). Default-nya adalah `deny` jika dihilangkan.

- `deny` - blokir.
- `allowlist` - izinkan hanya jika daftar izin cocok.
- `full` - izinkan.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Saat `true`, memperlakukan bentuk evaluasi kode inline sebagai hanya melalui persetujuan meskipun
  biner interpreter itu sendiri ada dalam daftar izin. Pertahanan berlapis untuk
  pemuat interpreter yang tidak dapat dipetakan dengan jelas ke satu operand berkas stabil.
</ParamField>

Contoh yang ditangkap oleh mode ketat: `python -c`, `node -e`/`--eval`/`-p`,
`ruby -e`, `perl -e`/`-E`, `php -r`, `lua -e`, `osascript -e` (juga bentuk inline `awk`,
`sed`, `make`, `find -exec`, dan `xargs`).

Dalam mode ketat, perintah ini memerlukan peninjau atau persetujuan eksplisit. Dengan
`tools.exec.mode: "auto"`, peninjau dapat mengizinkan satu eksekusi berisiko rendah saat
perintah memiliki rencana yang dapat diberlakukan; jika tidak, OpenClaw meminta persetujuan manusia.
Persetujuan perintah `Codex app-server` yang mencapai fallback peninjau akan meminta
persetujuan manusia karena permintaan persetujuannya tidak menampilkan executable terselesaikan yang dapat
diberlakukan.
`allow-always` tidak menyimpan entri daftar izin baru untuk perintah evaluasi inline.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Hanya untuk presentasi: saat diaktifkan, OpenClaw dapat melampirkan
  rentang perintah yang berasal dari parser agar prompt persetujuan Web dapat menyoroti token perintah. Hal ini
  **tidak** mengubah `security`, `ask`, pencocokan daftar izin, perilaku evaluasi inline
  ketat, penerusan persetujuan, atau eksekusi perintah.
</ParamField>

Tetapkan secara global di bawah `tools.exec.commandHighlighting` atau per agen di bawah
`agents.list[].tools.exec.commandHighlighting`.

## Mode YOLO (tanpa persetujuan)

Untuk menjalankan eksekusi host tanpa prompt persetujuan, buka **kedua** lapisan kebijakan:
kebijakan eksekusi yang diminta dalam konfigurasi OpenClaw (`tools.exec.*`) **dan**
kebijakan persetujuan lokal-host dalam berkas persetujuan host eksekusi.

`askFallback` yang dihilangkan menggunakan default `deny`. Tetapkan `askFallback` host ke `full`
secara eksplisit saat prompt persetujuan tanpa UI harus beralih ke izinkan.

| Lapisan               | Pengaturan YOLO             |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` pada `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| `askFallback` host    | `full`                     |

<Warning>
**Perbedaan penting:**

- `tools.exec.host=auto` memilih **di mana** exec dijalankan: sandbox jika tersedia, jika tidak, gateway.
- YOLO memilih **bagaimana** exec host disetujui: `security=full` ditambah `ask=off`.
- YOLO **tidak** menambahkan gerbang persetujuan heuristik terpisah untuk penyamaran perintah atau lapisan penolakan prapemeriksaan skrip di atas kebijakan exec host yang dikonfigurasi.
- `auto` tidak menjadikan perutean gateway sebagai penggantian bebas dari sesi yang di-sandbox. Permintaan `host=node` per panggilan diizinkan dari `auto`; `host=gateway` hanya diizinkan dari `auto` ketika tidak ada runtime sandbox yang aktif. Untuk default non-otomatis yang stabil, tetapkan `tools.exec.host` atau gunakan `/exec host=...` secara eksplisit.

</Warning>

Penyedia berbasis CLI yang menyediakan mode izin noninteraktifnya sendiri
dapat mengikuti kebijakan ini. Claude CLI menambahkan
`--permission-mode bypassPermissions` ketika kebijakan exec efektif OpenClaw
adalah YOLO. Untuk sesi langsung Claude yang dikelola OpenClaw, kebijakan
exec efektif OpenClaw lebih berwenang daripada mode izin bawaan Claude:
YOLO menormalkan peluncuran langsung menjadi `--permission-mode bypassPermissions`, dan
kebijakan exec efektif yang membatasi menormalkan peluncuran langsung menjadi
`--permission-mode default`, meskipun argumen mentah backend Claude menentukan mode
lain.

Jika menginginkan penyiapan yang lebih konservatif, perketat kembali kebijakan exec OpenClaw menjadi
`allowlist` / `on-miss` atau `deny`.

### Penyiapan "jangan pernah meminta konfirmasi" yang persisten pada host gateway

<Steps>
  <Step title="Tetapkan kebijakan konfigurasi yang diminta">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Samakan berkas persetujuan host">
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

Memperbarui `tools.exec.host/security/ask` lokal dan default berkas persetujuan
lokal (termasuk `askFallback: "full"`). Ini sengaja
hanya berlaku secara lokal. Untuk mengubah persetujuan host gateway atau host node dari jarak jauh, gunakan
`openclaw approvals set --gateway` atau `openclaw approvals set --node
<id|name|ip>`.

Preset bawaan lainnya: `cautious` (`host=gateway`, `security=allowlist`,
`ask=on-miss`, `askFallback=deny`) dan `deny-all` (`host=gateway`,
`security=deny`, `ask=off`, `askFallback=deny`). Terapkan dengan cara yang sama:
`openclaw exec-policy preset cautious`.

Untuk menetapkan masing-masing bidang alih-alih preset lengkap, gunakan
`openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>` dengan subset apa pun dari flag tersebut.

### Host node

Terapkan berkas persetujuan yang sama pada node sebagai gantinya:

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
**Batasan khusus lokal:**

- `openclaw exec-policy` tidak menyinkronkan persetujuan node.
- `openclaw exec-policy set --host node` ditolak.
- Persetujuan exec node diambil dari node saat runtime, sehingga pembaruan yang ditargetkan ke node harus menggunakan `openclaw approvals --node ...`.

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

Daftar izin bersifat **per agen**. Jika terdapat beberapa agen, alihkan agen yang
sedang diedit di aplikasi macOS. Pola menggunakan pencocokan glob.

Pola dapat berupa glob jalur biner yang telah diresolusi atau glob nama perintah saja.
Nama saja hanya cocok dengan perintah yang dipanggil melalui `PATH`, sehingga `rg` dapat cocok dengan
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

Tambahkan `argPattern` ketika entri daftar izin harus cocok dengan suatu biner dan
bentuk argumen tertentu. OpenClaw menggunakan semantik ekspresi reguler
ECMAScript (JavaScript) pada setiap host dan mengevaluasi ekspresi terhadap
argumen perintah yang telah diurai, tanpa menyertakan token executable (`argv[0]`).
Untuk entri yang ditulis secara manual, argumen digabungkan dengan satu spasi, sehingga
tambahkan jangkar pada pola ketika memerlukan kecocokan persis.

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
cocok dengan daftar izin. Jika entri khusus jalur untuk biner yang sama juga tersedia, argumen
yang tidak cocok masih dapat kembali menggunakan entri khusus jalur tersebut. Hilangkan entri khusus jalur
jika tujuannya adalah membatasi biner hanya pada argumen yang dinyatakan.

Entri yang disimpan oleh alur persetujuan menggunakan format pemisah internal untuk pencocokan
argv yang tepat. Sebaiknya gunakan UI atau alur persetujuan untuk membuat ulang entri tersebut
alih-alih mengedit nilai yang dienkode secara manual. Jika OpenClaw tidak dapat mengurai argv
untuk suatu segmen perintah, entri dengan `argPattern` tidak cocok.

Setiap entri daftar izin mendukung:

| Bidang             | Arti                                                        |
| ------------------ | ----------------------------------------------------------- |
| `pattern`          | Glob jalur biner yang diresolusi atau glob nama perintah saja |
| `argPattern`       | Regex argv ECMAScript opsional; jika dihilangkan, hanya jalur |
| `id`               | ID buram yang stabil; dibuat sebagai UUID jika tidak ada      |
| `source`           | Sumber entri, seperti `allow-always`                         |
| `commandText`      | Input teks biasa lama; dibuang saat dimuat                    |
| `lastUsedAt`       | Stempel waktu penggunaan terakhir                            |
| `lastUsedCommand`  | Perintah terakhir yang cocok                                  |
| `lastResolvedPath` | Jalur biner terakhir yang diresolusi                          |

## Izinkan otomatis CLI skill

Ketika **Izinkan otomatis CLI skill** (`autoAllowSkills`) diaktifkan, executable
yang dirujuk oleh skill yang dikenal diperlakukan sebagai bagian dari daftar izin pada node (node macOS
atau host node tanpa antarmuka). Ini menggunakan `skills.bins` melalui RPC Gateway untuk
mengambil daftar biner skill. Nonaktifkan ini jika menginginkan
daftar izin manual yang ketat.

<Warning>
- Ini adalah **daftar izin kemudahan implisit**, yang terpisah dari entri daftar izin jalur manual.
- Ini ditujukan untuk lingkungan operator tepercaya tempat Gateway dan node berada dalam batas kepercayaan yang sama.
- Jika memerlukan kepercayaan eksplisit yang ketat, pertahankan `autoAllowSkills: false` dan hanya gunakan entri daftar izin jalur manual.

</Warning>

## Biner aman dan penerusan persetujuan

Untuk biner aman (jalur cepat khusus stdin), detail pengikatan interpreter, dan
cara meneruskan permintaan persetujuan ke Slack/Discord/Telegram (atau menjalankannya sebagai
klien persetujuan bawaan), lihat
[Persetujuan exec - lanjutan](/id/tools/exec-approvals-advanced).

## Pengeditan UI Kontrol

Gunakan kartu **Control UI -> Nodes -> Exec approvals** untuk mengedit default,
penggantian per agen, dan daftar izin. Pilih cakupan (Defaults atau agen),
sesuaikan kebijakan, tambahkan/hapus pola daftar izin, lalu **Save**. UI
menampilkan metadata penggunaan terakhir per pola agar daftar tetap rapi.

Pemilih target memilih **Gateway** (persetujuan lokal) atau **Node**.
Node harus mengiklankan `system.execApprovals.get/set` (aplikasi macOS atau
host node tanpa antarmuka). Jika node belum mengiklankan persetujuan exec, edit
berkas persetujuan lokalnya secara langsung.

Beberapa host node, termasuk pendamping Windows, memiliki format kebijakan persetujuan
yang berbeda. UI Kontrol menampilkan kebijakan bawaan host ini sebagai hanya-baca. Gunakan
aplikasi pendamping atau `openclaw approvals set --node <id|name|ip>` dengan bentuk
kebijakan bawaan untuk mengeditnya; lihat [CLI Persetujuan](/id/cli/approvals).

CLI: `openclaw approvals` mendukung pengeditan gateway atau node - lihat
[CLI Persetujuan](/id/cli/approvals).

## Alur persetujuan

Ketika permintaan konfirmasi diperlukan, gateway menyiarkan
`exec.approval.requested` kepada klien operator. UI Kontrol dan aplikasi macOS
menyelesaikannya melalui `exec.approval.resolve`, lalu gateway meneruskan
permintaan yang disetujui ke host node.

Untuk `host=node`, permintaan persetujuan menyertakan payload `systemRunPlan`
kanonis. Gateway menggunakan rencana tersebut sebagai konteks perintah/cwd/sesi
yang berwenang saat meneruskan permintaan `system.run` yang disetujui:

- Jalur exec node menyiapkan satu rencana kanonis sejak awal.
- Catatan persetujuan menyimpan rencana tersebut dan metadata pengikatannya.
- Setelah disetujui, panggilan `system.run` terakhir yang diteruskan menggunakan kembali rencana tersimpan alih-alih memercayai perubahan pemanggil berikutnya.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau `sessionKey` setelah permintaan persetujuan dibuat, gateway menolak eksekusi yang diteruskan karena ketidakcocokan persetujuan.

## Peristiwa sistem dan penolakan

Siklus hidup exec mengirim pesan sistem `Exec finished` ke sesi
agen setelah node melaporkan penyelesaian. OpenClaw juga dapat mengirim
pemberitahuan sedang berlangsung setelah persetujuan diberikan, sesudah
`tools.exec.approvalRunningNoticeMs` berlalu (default `10000`, `0` menonaktifkannya).
Persetujuan exec yang ditolak bersifat final untuk perintah host: perintah
tidak dijalankan.

- Untuk persetujuan asinkron agen utama yang memiliki sesi asal, OpenClaw
  mengirimkan penolakan kembali ke sesi tersebut sebagai tindak lanjut internal agar agen
  dapat berhenti menunggu perintah asinkron dan menghindari perbaikan
  hasil yang hilang.
- Jika tidak ada sesi atau sesi tidak dapat dilanjutkan, OpenClaw tetap dapat
  melaporkan penolakan ringkas kepada operator atau rute percakapan langsung.
- Penolakan untuk sesi subagen dan cron tidak dikirim kembali ke
  sesi tersebut.

Persetujuan exec host gateway menghasilkan peristiwa siklus hidup penyelesaian yang sama.
Exec yang dibatasi persetujuan menggunakan kembali ID persetujuan untuk mengorelasikan permintaan
tertunda dengan pesan penyelesaian/penolakannya (`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`).

## Implikasi

- **`full`** sangat kuat; gunakan daftar izin jika memungkinkan.
- **`ask`** memastikan Anda tetap terlibat sekaligus memungkinkan persetujuan cepat.
- Daftar izin per agen mencegah persetujuan satu agen bocor ke agen lain.
- Persetujuan hanya berlaku untuk permintaan exec host dari **pengirim yang berwenang**. Pengirim yang tidak berwenang tidak dapat menjalankan `/exec`.
- `/exec security=full` adalah kemudahan tingkat sesi bagi operator yang berwenang dan memang melewati persetujuan. Untuk memblokir exec host secara tegas, tetapkan keamanan persetujuan ke `deny` atau tolak alat `exec` melalui kebijakan alat.

## Terkait

<CardGroup cols={2}>
  <Card title="Persetujuan eksekusi - tingkat lanjut" href="/id/tools/exec-approvals-advanced" icon="gear">
    Bin aman, pengikatan interpreter, dan penerusan persetujuan ke chat.
  </Card>
  <Card title="Alat eksekusi" href="/id/tools/exec" icon="terminal">
    Alat eksekusi perintah shell.
  </Card>
  <Card title="Mode dengan hak istimewa" href="/id/tools/elevated" icon="shield-exclamation">
    Jalur darurat yang juga melewati persetujuan.
  </Card>
  <Card title="Sandboxing" href="/id/gateway/sandboxing" icon="box">
    Mode sandbox dan akses ruang kerja.
  </Card>
  <Card title="Keamanan" href="/id/gateway/security" icon="lock">
    Model keamanan dan penguatan.
  </Card>
  <Card title="Sandbox vs kebijakan alat vs hak istimewa" href="/id/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Kapan menggunakan setiap kontrol.
  </Card>
  <Card title="Skills" href="/id/tools/skills" icon="sparkles">
    Perilaku izin otomatis yang didukung Skill.
  </Card>
</CardGroup>
