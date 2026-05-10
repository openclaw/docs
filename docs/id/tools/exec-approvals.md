---
read_when:
    - Mengonfigurasi persetujuan exec atau daftar yang diizinkan
    - Mengimplementasikan UX persetujuan exec di aplikasi macOS
    - Meninjau prompt pelolosan sandbox dan implikasinya
sidebarTitle: Exec approvals
summary: 'Persetujuan eksekusi host: pengaturan kebijakan, daftar izin, dan alur kerja YOLO/strict'
title: Persetujuan eksekusi
x-i18n:
    generated_at: "2026-05-10T19:55:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b1a9649161440bca445e318654b9a48a54ae1dbbca42349ac94b13ecc9fbfbd
    source_path: tools/exec-approvals.md
    workflow: 16
---

Persetujuan exec adalah **guardrail aplikasi pendamping / host node** untuk memungkinkan
agen sandbox menjalankan perintah pada host nyata (`gateway` atau `node`). Sebuah
interlock keamanan: perintah hanya diizinkan ketika kebijakan + daftar izin +
persetujuan pengguna (opsional) semuanya sepakat. Persetujuan exec ditumpuk **di atas**
kebijakan alat dan gating elevated (kecuali elevated diatur ke `full`, yang
melewati persetujuan).

<Note>
Kebijakan efektif adalah yang **lebih ketat** antara default `tools.exec.*` dan
persetujuan; jika sebuah kolom persetujuan dihilangkan, nilai `tools.exec`
digunakan. Exec host juga menggunakan status persetujuan lokal pada mesin tersebut - `ask: "always"` lokal-host di `~/.openclaw/exec-approvals.json` tetap
memunculkan prompt meskipun default sesi atau konfigurasi meminta `ask: "on-miss"`.
</Note>

## Memeriksa kebijakan efektif

| Perintah                                                         | Yang ditampilkan                                                                       |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Kebijakan yang diminta, sumber kebijakan host, dan hasil efektif.                      |
| `openclaw exec-policy show`                                      | Tampilan gabungan mesin lokal.                                                         |
| `openclaw exec-policy set` / `preset`                            | Sinkronkan kebijakan lokal yang diminta dengan file persetujuan host lokal dalam satu langkah. |

Ketika cakupan lokal meminta `host=node`, `exec-policy show` melaporkan
cakupan tersebut sebagai dikelola node saat runtime, bukan berpura-pura bahwa file
persetujuan lokal adalah sumber kebenaran.

Jika UI aplikasi pendamping **tidak tersedia**, setiap permintaan yang biasanya
memunculkan prompt diselesaikan oleh **fallback ask** (default: `deny`).

<Tip>
Klien persetujuan chat native dapat menanamkan affordance khusus channel pada
pesan persetujuan tertunda. Misalnya, Matrix menanamkan pintasan reaksi
(`✅` izinkan sekali, `❌` tolak, `♾️` selalu izinkan) sambil tetap menyisakan
perintah `/approve ...` dalam pesan sebagai fallback.
</Tip>

## Tempat berlakunya

Persetujuan exec diberlakukan secara lokal pada host eksekusi:

- **Host Gateway** → proses `openclaw` pada mesin gateway.
- **Host Node** → runner node (aplikasi pendamping macOS atau host node headless).

### Model kepercayaan

- Pemanggil yang diautentikasi Gateway dipercaya sebagai operator untuk Gateway tersebut.
- Node yang dipasangkan memperluas kemampuan operator tepercaya tersebut ke host node.
- Persetujuan exec mengurangi risiko eksekusi tidak sengaja, tetapi **bukan** batas autentikasi per pengguna atau kebijakan baca-saja filesystem.
- Setelah disetujui, sebuah perintah dapat mengubah file sesuai izin filesystem host atau sandbox yang dipilih.
- Eksekusi host node yang disetujui mengikat konteks eksekusi kanonis: cwd kanonis, argv tepat, pengikatan env jika ada, dan path executable yang dipin jika berlaku.
- Untuk skrip shell dan pemanggilan file interpreter/runtime langsung, OpenClaw juga mencoba mengikat satu operand file lokal konkret. Jika file terikat tersebut berubah setelah persetujuan tetapi sebelum eksekusi, eksekusi ditolak alih-alih menjalankan konten yang telah bergeser.
- Pengikatan file sengaja bersifat upaya terbaik, **bukan** model semantik lengkap untuk setiap path loader interpreter/runtime. Jika mode persetujuan tidak dapat mengidentifikasi tepat satu file lokal konkret untuk diikat, mode tersebut menolak membuat eksekusi berbasis persetujuan alih-alih berpura-pura memiliki cakupan penuh.

### Pemisahan macOS

- **Layanan host node** meneruskan `system.run` ke **aplikasi macOS** melalui IPC lokal.
- **Aplikasi macOS** memberlakukan persetujuan dan menjalankan perintah dalam konteks UI.

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
  - `allowlist` - izinkan hanya perintah yang ada dalam daftar izin.
  - `full` - izinkan semuanya (setara dengan elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - jangan pernah memunculkan prompt.
  - `on-miss` - munculkan prompt hanya ketika daftar izin tidak cocok.
  - `always` - munculkan prompt pada setiap perintah. Kepercayaan tahan lama `allow-always` **tidak** menekan prompt ketika mode ask efektif adalah `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolusi ketika prompt diperlukan tetapi tidak ada UI yang dapat dijangkau.

- `deny` - blokir.
- `allowlist` - izinkan hanya jika daftar izin cocok.
- `full` - izinkan.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Ketika `true`, OpenClaw memperlakukan bentuk inline code-eval sebagai hanya-persetujuan
  meskipun binary interpreter itu sendiri ada dalam daftar izin. Defense-in-depth
  untuk loader interpreter yang tidak terpetakan rapi ke satu operand file
  stabil.
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
`allow-always` tidak mempertahankan entri daftar izin baru untuknya
secara otomatis.

## Mode YOLO (tanpa persetujuan)

Jika Anda ingin exec host berjalan tanpa prompt persetujuan, Anda harus membuka
**kedua** lapisan kebijakan - kebijakan exec yang diminta dalam konfigurasi OpenClaw
(`tools.exec.*`) **dan** kebijakan persetujuan lokal-host dalam
`~/.openclaw/exec-approvals.json`.

YOLO adalah perilaku host default kecuali Anda mengetatkannya secara eksplisit:

| Lapisan               | Pengaturan YOLO           |
| --------------------- | ------------------------- |
| `tools.exec.security` | `full` pada `gateway`/`node` |
| `tools.exec.ask`      | `off`                     |
| Host `askFallback`    | `full`                    |

<Warning>
**Perbedaan penting:**

- `tools.exec.host=auto` memilih **di mana** exec berjalan: sandbox ketika tersedia, jika tidak gateway.
- YOLO memilih **bagaimana** exec host disetujui: `security=full` ditambah `ask=off`.
- Dalam mode YOLO, OpenClaw **tidak** menambahkan gate persetujuan obfuscation perintah heuristik terpisah atau lapisan penolakan pra-penerbangan skrip di atas kebijakan exec host yang dikonfigurasi.
- `auto` tidak menjadikan perutean gateway sebagai override bebas dari sesi sandbox. Permintaan per panggilan `host=node` diizinkan dari `auto`; `host=gateway` hanya diizinkan dari `auto` ketika tidak ada runtime sandbox yang aktif. Untuk default non-auto yang stabil, atur `tools.exec.host` atau gunakan `/exec host=...` secara eksplisit.

</Warning>

Provider berbasis CLI yang mengekspos mode izin noninteraktifnya sendiri
dapat mengikuti kebijakan ini. Claude CLI menambahkan
`--permission-mode bypassPermissions` ketika kebijakan exec yang diminta OpenClaw
adalah YOLO. Override perilaku backend tersebut dengan argumen Claude eksplisit
di bawah `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
misalnya `--permission-mode default`, `acceptEdits`, atau
`bypassPermissions`.

Jika Anda menginginkan pengaturan yang lebih konservatif, ketatkan kembali salah satu lapisan ke
`allowlist` / `on-miss` atau `deny`.

### Pengaturan gateway-host persisten "jangan pernah prompt"

<Steps>
  <Step title="Atur kebijakan konfigurasi yang diminta">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Samakan file persetujuan host">
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

Pintasan lokal tersebut memperbarui keduanya:

- `tools.exec.host/security/ask` lokal.
- Default `~/.openclaw/exec-approvals.json` lokal.

Ini sengaja hanya lokal. Untuk mengubah persetujuan gateway-host atau node-host
secara jarak jauh, gunakan `openclaw approvals set --gateway` atau
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
**Batasan hanya lokal:**

- `openclaw exec-policy` tidak menyinkronkan persetujuan node.
- `openclaw exec-policy set --host node` ditolak.
- Persetujuan exec Node diambil dari node saat runtime, sehingga pembaruan yang menargetkan node harus menggunakan `openclaw approvals --node ...`.

</Note>

### Pintasan hanya sesi

- `/exec security=full ask=off` hanya mengubah sesi saat ini.
- `/elevated full` adalah pintasan break-glass yang juga melewati persetujuan exec untuk sesi tersebut.

Jika file persetujuan host tetap lebih ketat daripada konfigurasi, kebijakan host
yang lebih ketat tetap menang.

## Daftar izin (per agen)

Daftar izin bersifat **per agen**. Jika ada beberapa agen, ganti agen yang
sedang Anda edit di aplikasi macOS. Pola adalah pencocokan glob.

Pola dapat berupa glob path binary yang di-resolve atau glob nama perintah polos.
Nama polos hanya cocok dengan perintah yang dipanggil melalui `PATH`, sehingga `rg` dapat cocok dengan
`/opt/homebrew/bin/rg` ketika perintahnya adalah `rg`, tetapi **tidak** dengan `./rg` atau
`/tmp/rg`. Gunakan glob path ketika Anda ingin memercayai satu lokasi binary tertentu.

Entri lama `agents.default` dimigrasikan ke `agents.main` saat dimuat.
Rantai shell seperti `echo ok && pwd` tetap memerlukan setiap segmen tingkat atas
untuk memenuhi aturan daftar izin.

Contoh:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Membatasi argumen dengan argPattern

Tambahkan `argPattern` ketika entri daftar izin harus cocok dengan binary dan
bentuk argumen tertentu. OpenClaw mengevaluasi ekspresi reguler
terhadap argumen perintah yang telah diurai, mengecualikan token executable
(`argv[0]`). Untuk entri yang ditulis manual, argumen digabungkan dengan
satu spasi, jadi anchor pola ketika Anda memerlukan kecocokan tepat.

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

Entri tersebut mengizinkan `python3 safe.py`; `python3 other.py` adalah miss daftar izin. Jika entri hanya-path untuk binary yang sama juga ada, argumen yang tidak cocok masih dapat fallback ke entri hanya-path tersebut. Hilangkan entri hanya-path ketika tujuannya adalah membatasi binary ke argumen yang dideklarasikan.

Entri yang disimpan oleh alur persetujuan dapat menggunakan format pemisah internal untuk
pencocokan argv tepat. Lebih baik gunakan UI atau alur persetujuan untuk membuat ulang entri tersebut alih-alih mengedit nilai terenkode secara manual. Jika OpenClaw tidak dapat
mengurai argv untuk sebuah segmen perintah, entri dengan `argPattern` tidak cocok.

Setiap entri daftar izin mendukung:

| Bidang             | Arti                                                          |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Glob jalur biner yang diselesaikan atau glob nama perintah polos |
| `argPattern`       | Regex argv opsional; entri yang dihilangkan hanya berupa jalur |
| `id`               | UUID stabil yang digunakan untuk identitas UI                 |
| `source`           | Sumber entri, seperti `allow-always`                          |
| `commandText`      | Teks perintah yang ditangkap saat alur persetujuan membuat entri |
| `lastUsedAt`       | Timestamp terakhir digunakan                                  |
| `lastUsedCommand`  | Perintah terakhir yang cocok                                  |
| `lastResolvedPath` | Jalur biner terakhir yang diselesaikan                        |

## Izinkan otomatis CLI skill

Ketika **Izinkan otomatis CLI skill** diaktifkan, executable yang dirujuk oleh
skill yang dikenal diperlakukan sebagai allowlist pada node (node macOS atau host
node headless). Ini menggunakan `skills.bins` melalui RPC Gateway untuk mengambil
daftar bin skill. Nonaktifkan ini jika Anda menginginkan allowlist manual yang ketat.

<Warning>
- Ini adalah **allowlist kenyamanan implisit**, terpisah dari entri allowlist jalur manual.
- Ini ditujukan untuk lingkungan operator tepercaya di mana Gateway dan node berada dalam batas kepercayaan yang sama.
- Jika Anda memerlukan kepercayaan eksplisit yang ketat, pertahankan `autoAllowSkills: false` dan gunakan hanya entri allowlist jalur manual.

</Warning>

## Bin aman dan penerusan persetujuan

Untuk bin aman (fast-path hanya stdin), detail pengikatan interpreter, dan
cara meneruskan prompt persetujuan ke Slack/Discord/Telegram (atau menjalankannya sebagai
klien persetujuan native), lihat
[Persetujuan exec - lanjutan](/id/tools/exec-approvals-advanced).

## Pengeditan UI Kontrol

Gunakan kartu **UI Kontrol → Node → Persetujuan exec** untuk mengedit default,
override per agen, dan allowlist. Pilih cakupan (Default atau agen),
sesuaikan kebijakan, tambah/hapus pola allowlist, lalu **Simpan**. UI
menampilkan metadata terakhir digunakan per pola sehingga Anda dapat menjaga daftar tetap rapi.

Pemilih target memilih **Gateway** (persetujuan lokal) atau **Node**.
Node harus mengiklankan `system.execApprovals.get/set` (aplikasi macOS atau
host node headless). Jika node belum mengiklankan persetujuan exec,
edit langsung `~/.openclaw/exec-approvals.json` lokalnya.

CLI: `openclaw approvals` mendukung pengeditan gateway atau node - lihat
[CLI Persetujuan](/id/cli/approvals).

## Alur persetujuan

Ketika prompt diperlukan, gateway menyiarkan
`exec.approval.requested` ke klien operator. UI Kontrol dan aplikasi macOS
menyelesaikannya melalui `exec.approval.resolve`, lalu gateway meneruskan
permintaan yang disetujui ke host node.

Untuk `host=node`, permintaan persetujuan menyertakan payload `systemRunPlan`
kanonis. Gateway menggunakan rencana tersebut sebagai konteks
command/cwd/session otoritatif saat meneruskan permintaan `system.run`
yang disetujui.

Hal itu penting untuk latensi persetujuan asinkron:

- Jalur exec node menyiapkan satu rencana kanonis di awal.
- Catatan persetujuan menyimpan rencana tersebut beserta metadata pengikatannya.
- Setelah disetujui, panggilan `system.run` terakhir yang diteruskan menggunakan ulang rencana tersimpan alih-alih memercayai pengeditan pemanggil yang lebih baru.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau `sessionKey` setelah permintaan persetujuan dibuat, gateway menolak run yang diteruskan sebagai ketidakcocokan persetujuan.

## Event sistem

Siklus hidup exec dimunculkan sebagai pesan sistem:

- `Exec running` (hanya jika perintah melebihi ambang pemberitahuan berjalan).
- `Exec finished`.
- `Exec denied`.

Ini diposting ke sesi agen setelah node melaporkan event tersebut.
Persetujuan exec yang di-host Gateway memancarkan event siklus hidup yang sama saat
perintah selesai (dan secara opsional saat berjalan lebih lama dari ambang).
Exec yang digated persetujuan menggunakan ulang id persetujuan sebagai `runId` dalam
pesan ini agar mudah dikorelasikan.

## Perilaku persetujuan yang ditolak

Ketika persetujuan exec asinkron ditolak, OpenClaw mencegah agen
menggunakan ulang output dari run sebelumnya dari perintah yang sama dalam sesi.
Alasan penolakan diteruskan dengan panduan eksplisit bahwa tidak ada output perintah
yang tersedia, yang menghentikan agen mengklaim ada output baru atau
mengulangi perintah yang ditolak dengan hasil usang dari run berhasil sebelumnya.

## Implikasi

- **`full`** sangat kuat; pilih allowlist jika memungkinkan.
- **`ask`** menjaga Anda tetap dalam loop sambil tetap memungkinkan persetujuan cepat.
- Allowlist per agen mencegah persetujuan satu agen bocor ke agen lain.
- Persetujuan hanya berlaku untuk permintaan exec host dari **pengirim terotorisasi**. Pengirim tidak terotorisasi tidak dapat mengeluarkan `/exec`.
- `/exec security=full` adalah kemudahan tingkat sesi untuk operator terotorisasi dan melewati persetujuan secara desain. Untuk memblokir keras exec host, atur keamanan persetujuan ke `deny` atau tolak tool `exec` melalui kebijakan tool.

## Terkait

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/id/tools/exec-approvals-advanced" icon="gear">
    Bin aman, pengikatan interpreter, dan penerusan persetujuan ke chat.
  </Card>
  <Card title="Exec tool" href="/id/tools/exec" icon="terminal">
    Tool eksekusi perintah shell.
  </Card>
  <Card title="Elevated mode" href="/id/tools/elevated" icon="shield-exclamation">
    Jalur break-glass yang juga melewati persetujuan.
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
    Perilaku izinkan otomatis yang didukung skill.
  </Card>
</CardGroup>
