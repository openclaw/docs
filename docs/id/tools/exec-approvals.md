---
read_when:
    - Mengonfigurasi persetujuan exec atau daftar izin
    - Menerapkan UX persetujuan eksekusi di aplikasi macOS
    - Meninjau prompt pelolosan sandbox dan implikasinya
sidebarTitle: Exec approvals
summary: 'Persetujuan eksekusi host: kontrol kebijakan, daftar izin, dan alur kerja YOLO/strict'
title: Persetujuan eksekusi
x-i18n:
    generated_at: "2026-05-11T20:36:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2966a6f4633046941a9ef3267bad10f3a153956361b9f088fb3e29fcd3fcb99d
    source_path: tools/exec-approvals.md
    workflow: 16
---

Persetujuan exec adalah **pagar pengaman aplikasi pendamping / host node** untuk mengizinkan
agen tersandbox menjalankan perintah pada host nyata (`gateway` atau `node`). Sebuah
interlock keselamatan: perintah hanya diizinkan ketika kebijakan + allowlist +
persetujuan pengguna (opsional) semuanya setuju. Persetujuan exec ditumpuk **di atas**
kebijakan alat dan gating elevated (kecuali elevated diatur ke `full`, yang
melewati persetujuan).

<Note>
Kebijakan efektif adalah yang **lebih ketat** dari default `tools.exec.*` dan
persetujuan; jika sebuah bidang persetujuan dihilangkan, nilai `tools.exec`
digunakan. Exec host juga menggunakan status persetujuan lokal pada mesin tersebut - sebuah
`ask: "always"` lokal-host di `~/.openclaw/exec-approvals.json` tetap
memunculkan prompt meskipun default sesi atau konfigurasi meminta `ask: "on-miss"`.
</Note>

## Memeriksa kebijakan efektif

| Perintah                                                         | Yang ditampilkan                                                                      |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Kebijakan yang diminta, sumber kebijakan host, dan hasil efektif.                      |
| `openclaw exec-policy show`                                      | Tampilan gabungan mesin lokal.                                                         |
| `openclaw exec-policy set` / `preset`                            | Sinkronkan kebijakan lokal yang diminta dengan file persetujuan host lokal dalam satu langkah. |

Ketika sebuah cakupan lokal meminta `host=node`, `exec-policy show` melaporkan
cakupan tersebut sebagai dikelola node saat runtime, bukan berpura-pura bahwa file
persetujuan lokal adalah sumber kebenaran.

Jika UI aplikasi pendamping **tidak tersedia**, permintaan apa pun yang biasanya
memunculkan prompt akan diselesaikan oleh **fallback ask** (default: `deny`).

<Tip>
Klien persetujuan chat native dapat menanamkan affordance khusus channel pada
pesan persetujuan tertunda. Misalnya, Matrix menanamkan pintasan reaksi
(`✅` izinkan sekali, `❌` tolak, `♾️` selalu izinkan) sambil tetap menyisakan
perintah `/approve ...` dalam pesan sebagai fallback.
</Tip>

## Tempat penerapannya

Persetujuan exec diberlakukan secara lokal pada host eksekusi:

- **Host Gateway** → proses `openclaw` pada mesin gateway.
- **Host node** → runner node (aplikasi pendamping macOS atau host node headless).

### Model kepercayaan

- Pemanggil yang diautentikasi Gateway dipercaya sebagai operator untuk Gateway tersebut.
- Node yang dipasangkan memperluas kemampuan operator tepercaya itu ke host node.
- Persetujuan exec mengurangi risiko eksekusi tidak disengaja, tetapi **bukan** batas autentikasi per pengguna atau kebijakan filesystem baca-saja.
- Setelah disetujui, sebuah perintah dapat mengubah file sesuai izin filesystem host atau sandbox yang dipilih.
- Eksekusi host node yang disetujui mengikat konteks eksekusi kanonis: cwd kanonis, argv persis, pengikatan env ketika ada, dan path executable yang dipin ketika berlaku.
- Untuk skrip shell dan pemanggilan file interpreter/runtime langsung, OpenClaw juga mencoba mengikat satu operand file lokal konkret. Jika file terikat itu berubah setelah persetujuan tetapi sebelum eksekusi, eksekusi ditolak alih-alih menjalankan konten yang bergeser.
- Pengikatan file sengaja bersifat upaya terbaik, **bukan** model semantik lengkap untuk setiap path loader interpreter/runtime. Jika mode persetujuan tidak dapat mengidentifikasi tepat satu file lokal konkret untuk diikat, mode tersebut menolak membuat eksekusi berbasis persetujuan alih-alih berpura-pura memiliki cakupan penuh.

### Pemisahan macOS

- **Layanan host node** meneruskan `system.run` ke **aplikasi macOS** melalui IPC lokal.
- **Aplikasi macOS** memberlakukan persetujuan dan mengeksekusi perintah dalam konteks UI.

## Pengaturan dan penyimpanan

Persetujuan berada dalam file JSON lokal pada host eksekusi:

```text
~/.openclaw/exec-approvals.json
```

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

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - blokir semua permintaan exec host.
  - `allowlist` - izinkan hanya perintah yang ada dalam allowlist.
  - `full` - izinkan semuanya (setara dengan elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - jangan pernah memunculkan prompt.
  - `on-miss` - munculkan prompt hanya ketika allowlist tidak cocok.
  - `always` - munculkan prompt pada setiap perintah. Kepercayaan tahan lama `allow-always` **tidak** menekan prompt ketika mode ask efektif adalah `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolusi ketika prompt diperlukan tetapi tidak ada UI yang dapat dijangkau.

- `deny` - blokir.
- `allowlist` - izinkan hanya jika allowlist cocok.
- `full` - izinkan.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Ketika `true`, OpenClaw memperlakukan bentuk eval kode inline sebagai hanya-berdasarkan-persetujuan
  meskipun binary interpreter itu sendiri ada dalam allowlist. Defense-in-depth
  untuk loader interpreter yang tidak terpetakan secara bersih ke satu operand
  file stabil.
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
`allow-always` tidak mempertahankan entri allowlist baru untuknya
secara otomatis.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Hanya mengontrol penyajian dalam prompt persetujuan exec. Ketika diaktifkan,
  OpenClaw dapat melampirkan rentang perintah turunan parser sehingga prompt
  persetujuan Web dapat menyorot token perintah. Atur ke `true` untuk mengaktifkan
  penyorotan teks perintah.
</ParamField>

Pengaturan ini **tidak** mengubah `security`, `ask`, pencocokan allowlist,
perilaku eval inline ketat, penerusan persetujuan, atau eksekusi perintah.
Ini dapat diatur secara global di bawah `tools.exec.commandHighlighting` atau per
agen di bawah `agents.list[].tools.exec.commandHighlighting`.

## Mode YOLO (tanpa persetujuan)

Jika Anda ingin exec host berjalan tanpa prompt persetujuan, Anda harus membuka
**kedua** lapisan kebijakan - kebijakan exec yang diminta dalam konfigurasi OpenClaw
(`tools.exec.*`) **dan** kebijakan persetujuan lokal-host di
`~/.openclaw/exec-approvals.json`.

YOLO adalah perilaku host default kecuali Anda memperketatnya secara eksplisit:

| Lapisan               | Pengaturan YOLO            |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` pada `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Perbedaan penting:**

- `tools.exec.host=auto` memilih **di mana** exec berjalan: sandbox ketika tersedia, jika tidak gateway.
- YOLO memilih **bagaimana** exec host disetujui: `security=full` plus `ask=off`.
- Dalam mode YOLO, OpenClaw **tidak** menambahkan gate persetujuan obfuscation perintah heuristik terpisah atau lapisan penolakan preflight skrip di atas kebijakan exec host yang dikonfigurasi.
- `auto` tidak menjadikan routing gateway sebagai override bebas dari sesi tersandbox. Permintaan per panggilan `host=node` diizinkan dari `auto`; `host=gateway` hanya diizinkan dari `auto` ketika tidak ada runtime sandbox yang aktif. Untuk default non-auto yang stabil, atur `tools.exec.host` atau gunakan `/exec host=...` secara eksplisit.

</Warning>

Penyedia berbasis CLI yang mengekspos mode izin noninteraktif mereka sendiri
dapat mengikuti kebijakan ini. Claude CLI menambahkan
`--permission-mode bypassPermissions` ketika kebijakan exec yang diminta OpenClaw
adalah YOLO. Timpa perilaku backend tersebut dengan argumen Claude eksplisit
di bawah `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
misalnya `--permission-mode default`, `acceptEdits`, atau
`bypassPermissions`.

Jika Anda menginginkan penyiapan yang lebih konservatif, perketat salah satu lapisan kembali ke
`allowlist` / `on-miss` atau `deny`.

### Penyiapan gateway-host persisten "jangan pernah prompt"

<Steps>
  <Step title="Atur kebijakan konfigurasi yang diminta">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Cocokkan file persetujuan host">
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

Pintasan lokal itu memperbarui keduanya:

- `tools.exec.host/security/ask` lokal.
- Default `~/.openclaw/exec-approvals.json` lokal.

Ini sengaja hanya lokal. Untuk mengubah persetujuan gateway-host atau node-host
dari jarak jauh, gunakan `openclaw approvals set --gateway` atau
`openclaw approvals set --node <id|name|ip>`.

### Host node

Untuk host node, terapkan file persetujuan yang sama pada node tersebut sebagai gantinya:

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
- Persetujuan exec node diambil dari node saat runtime, jadi pembaruan yang ditargetkan ke node harus menggunakan `openclaw approvals --node ...`.

</Note>

### Pintasan hanya-sesi

- `/exec security=full ask=off` hanya mengubah sesi saat ini.
- `/elevated full` adalah pintasan break-glass yang juga melewati persetujuan exec untuk sesi tersebut.

Jika file persetujuan host tetap lebih ketat daripada konfigurasi, kebijakan host yang
lebih ketat tetap menang.

## Allowlist (per agen)

Allowlist bersifat **per agen**. Jika ada beberapa agen, beralihlah ke agen yang
sedang Anda edit di aplikasi macOS. Pola adalah kecocokan glob.

Pola dapat berupa glob path binary yang terselesaikan atau glob nama perintah polos.
Nama polos hanya cocok dengan perintah yang dipanggil melalui `PATH`, sehingga `rg` dapat cocok
dengan `/opt/homebrew/bin/rg` ketika perintahnya adalah `rg`, tetapi **tidak** `./rg` atau
`/tmp/rg`. Gunakan glob path ketika Anda ingin mempercayai satu lokasi binary
tertentu.

Entri lama `agents.default` dimigrasikan ke `agents.main` saat dimuat.
Rantai shell seperti `echo ok && pwd` tetap memerlukan setiap segmen tingkat atas
untuk memenuhi aturan allowlist.

Contoh:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Membatasi argumen dengan argPattern

Tambahkan `argPattern` ketika sebuah entri allowlist harus cocok dengan binary dan
bentuk argumen tertentu. OpenClaw mengevaluasi regular expression
terhadap argumen perintah yang diurai, tanpa token executable
(`argv[0]`). Untuk entri yang ditulis tangan, argumen digabungkan dengan
satu spasi, jadi jangkar pola ketika Anda memerlukan kecocokan persis.

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

Entri itu mengizinkan `python3 safe.py`; `python3 other.py` adalah miss allowlist.
Jika entri hanya-path untuk binary yang sama juga ada, argumen yang tidak cocok
masih dapat fallback ke entri hanya-path tersebut. Hilangkan entri hanya-path
ketika tujuannya adalah membatasi binary ke argumen yang dideklarasikan.

Entri yang disimpan oleh alur persetujuan dapat menggunakan format pemisah internal untuk
pencocokan argv yang tepat. Sebaiknya gunakan UI atau alur persetujuan untuk meregenerasi
entri tersebut daripada mengedit nilai yang dikodekan secara manual. Jika OpenClaw tidak dapat
mengurai argv untuk segmen perintah, entri dengan `argPattern` tidak cocok.

Setiap entri allowlist mendukung:

| Bidang             | Makna                                                        |
| ------------------ | ------------------------------------------------------------ |
| `pattern`          | Glob path biner yang di-resolve atau glob nama perintah polos |
| `argPattern`       | Regex argv opsional; entri yang dihilangkan hanya path        |
| `id`               | UUID stabil yang digunakan untuk identitas UI                 |
| `source`           | Sumber entri, seperti `allow-always`                         |
| `commandText`      | Teks perintah yang ditangkap saat alur persetujuan membuat entri |
| `lastUsedAt`       | Timestamp terakhir digunakan                                 |
| `lastUsedCommand`  | Perintah terakhir yang cocok                                 |
| `lastResolvedPath` | Path biner terakhir yang di-resolve                          |

## CLI Skills yang diizinkan otomatis

Saat **CLI Skills yang diizinkan otomatis** diaktifkan, executable yang direferensikan oleh
Skills yang diketahui diperlakukan sebagai terdaftar dalam allowlist pada Node (Node macOS atau host
Node headless). Ini menggunakan `skills.bins` melalui Gateway RPC untuk mengambil
daftar bin Skills. Nonaktifkan ini jika Anda menginginkan allowlist manual yang ketat.

<Warning>
- Ini adalah **allowlist kemudahan implisit**, terpisah dari entri allowlist path manual.
- Ini ditujukan untuk lingkungan operator tepercaya tempat Gateway dan Node berada dalam batas kepercayaan yang sama.
- Jika Anda memerlukan kepercayaan eksplisit yang ketat, pertahankan `autoAllowSkills: false` dan gunakan hanya entri allowlist path manual.

</Warning>

## Bin aman dan penerusan persetujuan

Untuk bin aman (fast-path hanya stdin), detail binding interpreter, dan
cara meneruskan prompt persetujuan ke Slack/Discord/Telegram (atau menjalankannya sebagai
klien persetujuan native), lihat
[Persetujuan exec - lanjutan](/id/tools/exec-approvals-advanced).

## Pengeditan UI Kontrol

Gunakan kartu **Control UI → Nodes → Exec approvals** untuk mengedit default,
override per agen, dan allowlist. Pilih cakupan (Default atau agen),
sesuaikan kebijakan, tambah/hapus pola allowlist, lalu **Save**. UI
menampilkan metadata terakhir digunakan per pola agar Anda dapat menjaga daftar tetap rapi.

Pemilih target memilih **Gateway** (persetujuan lokal) atau **Node**.
Node harus mengiklankan `system.execApprovals.get/set` (aplikasi macOS atau
host Node headless). Jika sebuah Node belum mengiklankan persetujuan exec,
edit langsung `~/.openclaw/exec-approvals.json` lokalnya.

CLI: `openclaw approvals` mendukung pengeditan Gateway atau Node - lihat
[CLI Persetujuan](/id/cli/approvals).

## Alur persetujuan

Saat prompt diperlukan, Gateway menyiarkan
`exec.approval.requested` ke klien operator. Control UI dan aplikasi macOS
menyelesaikannya melalui `exec.approval.resolve`, lalu Gateway meneruskan
permintaan yang disetujui ke host Node.

Untuk `host=node`, permintaan persetujuan menyertakan payload `systemRunPlan`
kanonis. Gateway menggunakan rencana tersebut sebagai konteks
command/cwd/session yang otoritatif saat meneruskan permintaan `system.run`
yang disetujui.

Itu penting untuk latensi persetujuan async:

- Path exec Node menyiapkan satu rencana kanonis di awal.
- Catatan persetujuan menyimpan rencana tersebut beserta metadata binding-nya.
- Setelah disetujui, panggilan `system.run` akhir yang diteruskan menggunakan ulang rencana tersimpan alih-alih mempercayai edit pemanggil berikutnya.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau `sessionKey` setelah permintaan persetujuan dibuat, Gateway menolak run yang diteruskan sebagai ketidakcocokan persetujuan.

## Peristiwa sistem

Siklus hidup exec ditampilkan sebagai pesan sistem:

- `Exec running` (hanya jika perintah melebihi ambang pemberitahuan berjalan).
- `Exec finished`.
- `Exec denied`.

Pesan ini diposting ke sesi agen setelah Node melaporkan peristiwa tersebut.
Persetujuan exec yang di-host Gateway memancarkan peristiwa siklus hidup yang sama saat
perintah selesai (dan opsional saat berjalan lebih lama dari ambang).
Exec yang dibatasi persetujuan menggunakan ulang id persetujuan sebagai `runId` dalam pesan-pesan ini
agar mudah dikorelasikan.

## Perilaku persetujuan yang ditolak

Saat persetujuan exec async ditolak, OpenClaw mencegah agen
menggunakan ulang output dari run sebelumnya dari perintah yang sama dalam sesi.
Alasan penolakan diteruskan dengan panduan eksplisit bahwa tidak ada output perintah
yang tersedia, yang menghentikan agen dari mengklaim ada output baru atau
mengulangi perintah yang ditolak dengan hasil lama dari run berhasil sebelumnya.

## Implikasi

- **`full`** sangat kuat; sebaiknya gunakan allowlist bila memungkinkan.
- **`ask`** membuat Anda tetap terlibat sambil tetap memungkinkan persetujuan cepat.
- Allowlist per agen mencegah persetujuan satu agen bocor ke agen lain.
- Persetujuan hanya berlaku untuk permintaan exec host dari **pengirim terotorisasi**. Pengirim tidak terotorisasi tidak dapat menerbitkan `/exec`.
- `/exec security=full` adalah kemudahan tingkat sesi untuk operator terotorisasi dan melewati persetujuan secara desain. Untuk memblokir exec host secara tegas, atur keamanan persetujuan ke `deny` atau tolak tool `exec` melalui kebijakan tool.

## Terkait

<CardGroup cols={2}>
  <Card title="Persetujuan exec - lanjutan" href="/id/tools/exec-approvals-advanced" icon="gear">
    Bin aman, binding interpreter, dan penerusan persetujuan ke chat.
  </Card>
  <Card title="Tool exec" href="/id/tools/exec" icon="terminal">
    Tool eksekusi perintah shell.
  </Card>
  <Card title="Mode elevated" href="/id/tools/elevated" icon="shield-exclamation">
    Path break-glass yang juga melewati persetujuan.
  </Card>
  <Card title="Sandboxing" href="/id/gateway/sandboxing" icon="box">
    Mode sandbox dan akses workspace.
  </Card>
  <Card title="Keamanan" href="/id/gateway/security" icon="lock">
    Model keamanan dan hardening.
  </Card>
  <Card title="Sandbox vs kebijakan tool vs elevated" href="/id/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Kapan menggunakan setiap kontrol.
  </Card>
  <Card title="Skills" href="/id/tools/skills" icon="sparkles">
    Perilaku izinkan otomatis yang didukung Skill.
  </Card>
</CardGroup>
