---
read_when:
    - Mengonfigurasi persetujuan exec atau daftar allowlist
    - Menerapkan UX persetujuan exec di aplikasi macOS
    - Meninjau prompt pelolosan sandbox dan implikasinya
sidebarTitle: Exec approvals
summary: 'Persetujuan eksekusi host: knob kebijakan, allowlist, dan alur kerja YOLO/ketat'
title: Persetujuan eksekusi
x-i18n:
    generated_at: "2026-06-27T18:17:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a4a5c9c56da458fdb25d5fe698df305af17188695d8befc1d4cfd8e8333e96
    source_path: tools/exec-approvals.md
    workflow: 16
---

Persetujuan exec adalah **guardrail aplikasi pendamping / host node** untuk mengizinkan
agen bersandbox menjalankan perintah pada host nyata (`gateway` atau `node`). Sebuah
interlock keselamatan: perintah hanya diizinkan ketika kebijakan + daftar izinkan +
(opsional) persetujuan pengguna semuanya setuju. Persetujuan exec ditumpuk **di atas**
kebijakan tool dan gating elevated (kecuali elevated diatur ke `full`, yang
melewati persetujuan).

Untuk gambaran umum berbasis mode tentang `deny`, `allowlist`, `ask`, `auto`, `full`,
pemetaan Codex Guardian, dan izin harness ACPX, lihat
[Mode izin](/id/tools/permission-modes).

<Note>
Kebijakan efektif adalah yang **lebih ketat** dari default `tools.exec.*` dan
persetujuan; jika sebuah field persetujuan dihilangkan, nilai `tools.exec` akan
digunakan. Exec host juga menggunakan status persetujuan lokal pada mesin tersebut - sebuah
`ask: "always"` lokal-host dalam file persetujuan host eksekusi tetap akan
meminta konfirmasi meskipun default sesi atau konfigurasi meminta `ask: "on-miss"`.
</Note>

## Memeriksa kebijakan efektif

| Perintah                                                          | Yang ditampilkan                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Kebijakan yang diminta, sumber kebijakan host, dan hasil efektif.                       |
| `openclaw exec-policy show`                                      | Tampilan gabungan mesin lokal.                                                             |
| `openclaw exec-policy set` / `preset`                            | Sinkronkan kebijakan lokal yang diminta dengan file persetujuan host lokal dalam satu langkah. |

Ketika scope lokal meminta `host=node`, `exec-policy show` melaporkan
scope tersebut sebagai dikelola node saat runtime alih-alih berpura-pura bahwa file
persetujuan lokal adalah sumber kebenaran.

Jika UI aplikasi pendamping **tidak tersedia**, permintaan apa pun yang biasanya
akan memunculkan prompt diselesaikan oleh **fallback ask** (default: `deny`).

<Tip>
Klien persetujuan chat native dapat mengisi affordance khusus channel pada
pesan persetujuan tertunda. Misalnya, Matrix mengisi shortcut reaksi
(`✅` izinkan sekali, `❌` tolak, `♾️` selalu izinkan) sambil tetap menyisakan
perintah `/approve ...` dalam pesan sebagai fallback.
</Tip>

## Tempat penerapannya

Persetujuan exec diberlakukan secara lokal pada host eksekusi:

- **Host Gateway** → proses `openclaw` pada mesin gateway.
- **Host node** → runner node (aplikasi pendamping macOS atau host node headless).

### Model kepercayaan

- Pemanggil yang diautentikasi Gateway dipercaya sebagai operator untuk Gateway tersebut.
- Node yang dipasangkan memperluas kapabilitas operator tepercaya itu ke host node.
- Persetujuan exec mengurangi risiko eksekusi tidak sengaja, tetapi **bukan** batas autentikasi per pengguna atau kebijakan filesystem read-only.
- Setelah disetujui, perintah dapat mengubah file sesuai izin host atau filesystem sandbox yang dipilih.
- Run host-node yang disetujui mengikat konteks eksekusi kanonis: cwd kanonis, argv persis, binding env saat ada, dan path executable yang dipin saat berlaku.
- Untuk skrip shell dan pemanggilan file interpreter/runtime langsung, OpenClaw juga mencoba mengikat satu operand file lokal konkret. Jika file terikat itu berubah setelah persetujuan tetapi sebelum eksekusi, run ditolak alih-alih mengeksekusi konten yang bergeser.
- Binding file sengaja bersifat best-effort, **bukan** model semantik lengkap untuk setiap path loader interpreter/runtime. Jika mode persetujuan tidak dapat mengidentifikasi tepat satu file lokal konkret untuk diikat, mode tersebut menolak membuat run berbasis persetujuan alih-alih berpura-pura memiliki cakupan penuh.

### Pemisahan macOS

- **Layanan host node** meneruskan `system.run` ke **aplikasi macOS** melalui IPC lokal.
- **Aplikasi macOS** memberlakukan persetujuan dan menjalankan perintah dalam konteks UI.

## Pengaturan dan penyimpanan

Persetujuan berada dalam file JSON lokal pada host eksekusi. Ketika
`OPENCLAW_STATE_DIR` diatur, file mengikuti direktori status tersebut;
jika tidak, file menggunakan direktori status default OpenClaw:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# otherwise
~/.openclaw/exec-approvals.json
```

Socket persetujuan default mengikuti root yang sama:
`$OPENCLAW_STATE_DIR/exec-approvals.sock`, atau
`~/.openclaw/exec-approvals.sock` ketika variabel tidak diatur.

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
          "commandText": "rg -n TODO",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Kenop kebijakan

### `tools.exec.mode`

`tools.exec.mode` adalah permukaan kebijakan ternormalisasi yang disarankan untuk exec host.
Nilainya adalah:

- `deny` - blokir exec host.
- `allowlist` - jalankan hanya perintah dalam daftar izinkan tanpa bertanya.
- `ask` - gunakan kebijakan daftar izinkan dan bertanya pada miss.
- `auto` - gunakan kebijakan daftar izinkan, jalankan kecocokan deterministik secara langsung, dan kirim miss persetujuan melalui reviewer otomatis native OpenClaw sebelum fallback ke rute persetujuan manusia.
- `full` - jalankan exec host tanpa prompt persetujuan.

Legacy `tools.exec.security` / `tools.exec.ask` tetap didukung dan masih menang
ketika diatur pada scope sesi atau agen yang lebih sempit.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - blokir semua permintaan exec host.
  - `allowlist` - izinkan hanya perintah dalam daftar izinkan.
  - `full` - izinkan semuanya (setara dengan elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Kebijakan ask yang dikonfigurasi untuk exec host. Mengontrol perilaku prompt
  persetujuan baseline dari `tools.exec.ask` dan default persetujuan host. Parameter tool
  per panggilan `ask` (lihat [Tool exec](/id/tools/exec#parameters))
  hanya dapat memperketat baseline itu, dan panggilan model asal channel mengabaikannya
  ketika ask host efektif adalah `off`.

- `off` - jangan pernah memunculkan prompt.
- `on-miss` - prompt hanya ketika daftar izinkan tidak cocok.
- `always` - prompt pada setiap perintah. Kepercayaan tahan lama `allow-always` **tidak** menekan prompt ketika mode ask efektif adalah `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolusi ketika prompt diperlukan tetapi tidak ada UI yang dapat dijangkau. Jika field ini
  dihilangkan, OpenClaw menggunakan default `deny`.

- `deny` - blokir.
- `allowlist` - izinkan hanya jika daftar izinkan cocok.
- `full` - izinkan.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Ketika `true`, OpenClaw memperlakukan bentuk eval kode inline sebagai hanya-persetujuan
  meskipun binary interpreter itu sendiri ada dalam daftar izinkan. Defense-in-depth
  untuk loader interpreter yang tidak memetakan secara bersih ke satu operand file stabil.
</ParamField>

Contoh yang ditangkap mode ketat:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Dalam mode ketat, perintah ini tetap memerlukan persetujuan eksplisit, dan
`allow-always` tidak mempertahankan entri daftar izinkan baru untuknya
secara otomatis.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Hanya mengontrol presentasi dalam prompt persetujuan exec. Ketika diaktifkan,
  OpenClaw dapat melampirkan span perintah turunan parser sehingga prompt persetujuan
  Web dapat menyorot token perintah. Atur ke `true` untuk mengaktifkan
  penyorotan teks perintah.
</ParamField>

Pengaturan ini **tidak** mengubah `security`, `ask`, pencocokan daftar izinkan,
perilaku inline-eval ketat, penerusan persetujuan, atau eksekusi perintah.
Ini dapat diatur secara global di bawah `tools.exec.commandHighlighting` atau per
agen di bawah `agents.list[].tools.exec.commandHighlighting`.

## Mode YOLO (tanpa persetujuan)

Jika Anda ingin exec host berjalan tanpa prompt persetujuan, Anda harus membuka
**kedua** lapisan kebijakan - kebijakan exec yang diminta dalam konfigurasi OpenClaw
(`tools.exec.*`) **dan** kebijakan persetujuan lokal-host dalam
file persetujuan host eksekusi.

OpenClaw menetapkan default `askFallback` yang dihilangkan ke `deny`. Atur
`askFallback` host ke `full` secara eksplisit ketika prompt persetujuan tanpa UI harus
fallback ke izin.

| Lapisan                 | Pengaturan YOLO               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` pada `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Perbedaan penting:**

- `tools.exec.host=auto` memilih **di mana** exec berjalan: sandbox ketika tersedia, jika tidak gateway.
- YOLO memilih **bagaimana** exec host disetujui: `security=full` plus `ask=off`.
- Dalam mode YOLO, OpenClaw **tidak** menambahkan gate persetujuan obfuscation perintah heuristik terpisah atau lapisan penolakan pra-flight skrip di atas kebijakan exec host yang dikonfigurasi.
- `auto` tidak membuat routing gateway menjadi override bebas dari sesi bersandbox. Permintaan per panggilan `host=node` diizinkan dari `auto`; `host=gateway` hanya diizinkan dari `auto` ketika tidak ada runtime sandbox yang aktif. Untuk default non-auto yang stabil, atur `tools.exec.host` atau gunakan `/exec host=...` secara eksplisit.

</Warning>

Provider berbasis CLI yang mengekspos mode izin noninteraktifnya sendiri
dapat mengikuti kebijakan ini. Claude CLI menambahkan
`--permission-mode bypassPermissions` ketika kebijakan exec efektif OpenClaw
adalah YOLO. Untuk sesi live Claude yang dikelola OpenClaw, kebijakan exec
efektif OpenClaw bersifat otoritatif atas mode izin native Claude:
YOLO menormalkan peluncuran live ke `--permission-mode bypassPermissions`, dan
kebijakan exec efektif yang restriktif menormalkan peluncuran live ke
`--permission-mode default`, meskipun arg backend Claude mentah menentukan mode lain.

Jika Anda menginginkan setup yang lebih konservatif, ketatkan kembali kebijakan exec OpenClaw ke
`allowlist` / `on-miss` atau `deny`.

### Setup gateway-host persisten "jangan pernah prompt"

<Steps>
  <Step title="Set the requested config policy">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Match the host approvals file">
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

### Shortcut lokal

```bash
openclaw exec-policy preset yolo
```

Shortcut lokal itu memperbarui keduanya:

- `tools.exec.host/security/ask` lokal.
- Default file persetujuan lokal, termasuk `askFallback: "full"`.

Ini sengaja hanya lokal. Untuk mengubah persetujuan gateway-host atau node-host
secara jarak jauh, gunakan `openclaw approvals set --gateway` atau
`openclaw approvals set --node <id|name|ip>`.

### Host node

Untuk host node, terapkan file persetujuan yang sama pada node tersebut:

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

- `openclaw exec-policy` tidak menyinkronkan persetujuan node.
- `openclaw exec-policy set --host node` ditolak.
- Persetujuan exec node diambil dari node saat runtime, sehingga pembaruan yang ditargetkan ke node harus menggunakan `openclaw approvals --node ...`.

</Note>

### Shortcut hanya-sesi

- `/exec security=full ask=off` hanya mengubah sesi saat ini.
- `/elevated full` adalah pintasan darurat yang melewati persetujuan exec hanya ketika
  kebijakan yang diminta dan file persetujuan host sama-sama menghasilkan
  `security: "full"` dan `ask: "off"`. File host yang lebih ketat, seperti
  `ask: "always"`, tetap akan meminta konfirmasi.

Jika file persetujuan host tetap lebih ketat daripada konfigurasi, kebijakan host
yang lebih ketat tetap menang.

## Daftar izin (per agen)

Daftar izin bersifat **per agen**. Jika ada beberapa agen, ganti agen yang
sedang Anda edit di aplikasi macOS. Pola adalah pencocokan glob.

Pola dapat berupa glob path biner yang terselesaikan atau glob nama perintah saja.
Nama saja hanya cocok dengan perintah yang dijalankan melalui `PATH`, jadi `rg` dapat cocok dengan
`/opt/homebrew/bin/rg` ketika perintahnya adalah `rg`, tetapi **tidak** dengan `./rg` atau
`/tmp/rg`. Gunakan glob path saat Anda ingin memercayai satu lokasi biner
tertentu.

Entri lama `agents.default` dimigrasikan ke `agents.main` saat dimuat.
Rantai shell seperti `echo ok && pwd` tetap memerlukan setiap segmen tingkat atas
untuk memenuhi aturan daftar izin.

Contoh:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Membatasi argumen dengan argPattern

Tambahkan `argPattern` ketika entri daftar izin harus cocok dengan sebuah biner dan
bentuk argumen tertentu. OpenClaw mengevaluasi ekspresi reguler
terhadap argumen perintah yang telah diurai, dengan mengecualikan token executable
(`argv[0]`). Untuk entri yang ditulis manual, argumen digabungkan dengan
satu spasi, jadi tambahkan anchor pada pola saat Anda memerlukan kecocokan persis.

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

Entri tersebut mengizinkan `python3 safe.py`; `python3 other.py` adalah ketidakcocokan
daftar izin. Jika entri khusus path untuk biner yang sama juga ada, argumen
yang tidak cocok masih dapat fallback ke entri khusus path tersebut. Hilangkan entri khusus path
ketika tujuannya adalah membatasi biner ke argumen yang dideklarasikan.

Entri yang disimpan oleh alur persetujuan dapat menggunakan format pemisah internal untuk
pencocokan argv yang persis. Sebaiknya gunakan UI atau alur persetujuan untuk membuat ulang
entri tersebut alih-alih mengedit nilai yang dienkode secara manual. Jika OpenClaw tidak dapat
mengurai argv untuk segmen perintah, entri dengan `argPattern` tidak cocok.

Setiap entri daftar izin mendukung:

| Bidang             | Makna                                                         |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Glob path biner yang terselesaikan atau glob nama perintah saja |
| `argPattern`       | Regex argv opsional; entri yang dihilangkan hanya khusus path |
| `id`               | UUID stabil yang digunakan untuk identitas UI                 |
| `source`           | Sumber entri, seperti `allow-always`                          |
| `commandText`      | Teks perintah yang ditangkap saat alur persetujuan membuat entri |
| `lastUsedAt`       | Timestamp terakhir digunakan                                  |
| `lastUsedCommand`  | Perintah terakhir yang cocok                                  |
| `lastResolvedPath` | Path biner terakhir yang terselesaikan                        |

## Izinkan otomatis CLI Skills

Saat **Izinkan otomatis CLI Skills** diaktifkan, executable yang direferensikan oleh
Skills yang diketahui diperlakukan sebagai masuk daftar izin pada node (node macOS atau host
node headless). Ini menggunakan `skills.bins` melalui RPC Gateway untuk mengambil
daftar bin skill. Nonaktifkan ini jika Anda menginginkan daftar izin manual yang ketat.

<Warning>
- Ini adalah **daftar izin kemudahan implisit**, terpisah dari entri daftar izin path manual.
- Ini ditujukan untuk lingkungan operator tepercaya tempat Gateway dan node berada dalam batas kepercayaan yang sama.
- Jika Anda memerlukan kepercayaan eksplisit yang ketat, biarkan `autoAllowSkills: false` dan gunakan entri daftar izin path manual saja.

</Warning>

## Bin aman dan penerusan persetujuan

Untuk bin aman (jalur cepat khusus stdin), detail binding interpreter, dan
cara meneruskan prompt persetujuan ke Slack/Discord/Telegram (atau menjalankannya sebagai
klien persetujuan native), lihat
[Persetujuan exec - lanjutan](/id/tools/exec-approvals-advanced).

## Pengeditan UI Kontrol

Gunakan kartu **UI Kontrol → Node → Persetujuan exec** untuk mengedit default,
override per agen, dan daftar izin. Pilih cakupan (Default atau agen),
sesuaikan kebijakan, tambah/hapus pola daftar izin, lalu **Simpan**. UI
menampilkan metadata terakhir digunakan per pola agar Anda dapat menjaga daftar tetap rapi.

Pemilih target memilih **Gateway** (persetujuan lokal) atau **Node**.
Node harus mengiklankan `system.execApprovals.get/set` (aplikasi macOS atau
host node headless). Jika node belum mengiklankan persetujuan exec,
edit file persetujuan lokalnya secara langsung.

CLI: `openclaw approvals` mendukung pengeditan gateway atau node - lihat
[CLI Persetujuan](/id/cli/approvals).

## Alur persetujuan

Ketika prompt diperlukan, gateway menyiarkan
`exec.approval.requested` ke klien operator. UI Kontrol dan aplikasi macOS
menyelesaikannya melalui `exec.approval.resolve`, lalu gateway meneruskan
permintaan yang disetujui ke host node.

Untuk `host=node`, permintaan persetujuan menyertakan payload `systemRunPlan`
kanonis. Gateway menggunakan rencana tersebut sebagai konteks
command/cwd/session yang otoritatif saat meneruskan permintaan `system.run`
yang disetujui.

Ini penting untuk latensi persetujuan asinkron:

- Jalur exec node menyiapkan satu rencana kanonis di awal.
- Catatan persetujuan menyimpan rencana tersebut beserta metadata binding-nya.
- Setelah disetujui, panggilan `system.run` akhir yang diteruskan menggunakan ulang rencana tersimpan alih-alih memercayai edit pemanggil yang lebih baru.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau `sessionKey` setelah permintaan persetujuan dibuat, gateway menolak run yang diteruskan sebagai ketidakcocokan persetujuan.

## Peristiwa sistem

Siklus hidup exec ditampilkan sebagai pesan sistem:

- `Exec running` (hanya jika perintah melebihi ambang pemberitahuan berjalan).
- `Exec finished`.

Ini diposting ke sesi agen setelah node melaporkan peristiwa tersebut.
Persetujuan exec yang ditolak bersifat terminal untuk perintah host itu sendiri: perintah
tidak berjalan. Untuk persetujuan asinkron agen utama dengan sesi asal,
OpenClaw memposting penolakan kembali ke sesi tersebut sebagai tindak lanjut internal agar
agen dapat berhenti menunggu perintah asinkron dan menghindari perbaikan hasil yang hilang.
Jika tidak ada sesi atau sesi tidak dapat dilanjutkan, OpenClaw tetap dapat
melaporkan penolakan ringkas ke operator atau rute chat langsung. Penolakan untuk
sesi subagen tidak diposting kembali ke subagen.
Persetujuan exec host-Gateway memancarkan peristiwa siklus hidup yang sama ketika
perintah selesai (dan secara opsional ketika berjalan lebih lama dari ambang).
Exec yang dibatasi persetujuan menggunakan ulang id persetujuan sebagai `runId` dalam
pesan ini untuk korelasi yang mudah.

## Perilaku persetujuan yang ditolak

Ketika persetujuan exec asinkron ditolak, OpenClaw memperlakukan perintah host sebagai
terminal dan fail-closed. Untuk sesi agen utama, penolakan dikirim sebagai
tindak lanjut sesi internal yang memberi tahu agen bahwa perintah asinkron tidak berjalan.
Ini menjaga kontinuitas transkrip tanpa mengekspos output perintah yang usang. Jika
pengiriman sesi tidak tersedia, OpenClaw fallback ke penolakan operator atau
chat langsung yang ringkas saat rute aman tersedia.

## Implikasi

- **`full`** kuat; utamakan daftar izin jika memungkinkan.
- **`ask`** membuat Anda tetap terlibat sambil tetap memungkinkan persetujuan cepat.
- Daftar izin per agen mencegah persetujuan satu agen bocor ke agen lain.
- Persetujuan hanya berlaku untuk permintaan exec host dari **pengirim berwenang**. Pengirim tidak berwenang tidak dapat menerbitkan `/exec`.
- `/exec security=full` adalah kemudahan tingkat sesi untuk operator berwenang dan melewati persetujuan sesuai desain. Untuk memblokir exec host secara keras, atur keamanan persetujuan ke `deny` atau tolak alat `exec` melalui kebijakan alat.

## Terkait

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/id/tools/exec-approvals-advanced" icon="gear">
    Bin aman, binding interpreter, dan penerusan persetujuan ke chat.
  </Card>
  <Card title="Exec tool" href="/id/tools/exec" icon="terminal">
    Alat eksekusi perintah shell.
  </Card>
  <Card title="Elevated mode" href="/id/tools/elevated" icon="shield-exclamation">
    Jalur darurat yang juga melewati persetujuan.
  </Card>
  <Card title="Sandboxing" href="/id/gateway/sandboxing" icon="box">
    Mode sandbox dan akses workspace.
  </Card>
  <Card title="Security" href="/id/gateway/security" icon="lock">
    Model keamanan dan hardening.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/id/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Kapan menggunakan setiap kontrol.
  </Card>
  <Card title="Skills" href="/id/tools/skills" icon="sparkles">
    Perilaku izinkan otomatis yang didukung Skills.
  </Card>
</CardGroup>
