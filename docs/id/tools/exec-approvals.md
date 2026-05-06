---
read_when:
    - Mengonfigurasi persetujuan eksekusi atau daftar izin
    - Mengimplementasikan UX persetujuan exec di aplikasi macOS
    - Meninjau prompt pelolosan sandbox dan implikasinya
sidebarTitle: Exec approvals
summary: 'Persetujuan eksekusi host: pengaturan kebijakan, daftar izin, dan alur kerja YOLO/ketat'
title: Persetujuan eksekusi
x-i18n:
    generated_at: "2026-05-06T09:30:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: c404fbc80624e31603cfc3f9ca6318534d53e0277af107600c726f97e11b223b
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec approvals adalah **pagar pengaman aplikasi pendamping / host node** untuk mengizinkan
agen bersandbox menjalankan perintah pada host nyata (`gateway` atau `node`). Sebuah
interlock keselamatan: perintah hanya diizinkan ketika kebijakan + allowlist +
persetujuan pengguna (opsional) semuanya sepakat. Exec approvals ditumpuk **di atas**
kebijakan tool dan gating elevated (kecuali elevated disetel ke `full`, yang
melewati persetujuan).

<Note>
Kebijakan efektif adalah yang **lebih ketat** antara default `tools.exec.*` dan approvals;
jika sebuah kolom approvals dihilangkan, nilai `tools.exec` digunakan. Host exec juga menggunakan status approvals lokal pada mesin tersebut - `ask: "always"` lokal-host di `~/.openclaw/exec-approvals.json` tetap
memunculkan prompt meskipun default sesi atau config meminta `ask: "on-miss"`.
</Note>

## Memeriksa kebijakan efektif

| Perintah                                                         | Yang ditampilkan                                                                       |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Kebijakan yang diminta, sumber kebijakan host, dan hasil efektif.                       |
| `openclaw exec-policy show`                                      | Tampilan gabungan mesin lokal.                                                         |
| `openclaw exec-policy set` / `preset`                            | Menyinkronkan kebijakan lokal yang diminta dengan berkas approvals host lokal dalam satu langkah. |

Ketika scope lokal meminta `host=node`, `exec-policy show` melaporkan
scope tersebut sebagai dikelola node saat runtime, alih-alih berpura-pura bahwa berkas
approvals lokal adalah sumber kebenaran.

Jika UI aplikasi pendamping **tidak tersedia**, permintaan apa pun yang biasanya
memunculkan prompt diselesaikan oleh **ask fallback** (default: `deny`).

<Tip>
Klien persetujuan chat native dapat mengisi affordance khusus channel pada
pesan persetujuan tertunda. Misalnya, Matrix mengisi pintasan reaksi
(`✅` izinkan sekali, `❌` tolak, `♾️` izinkan selalu) sambil tetap menyertakan
perintah `/approve ...` dalam pesan sebagai fallback.
</Tip>

## Tempat penerapannya

Exec approvals diberlakukan secara lokal pada host eksekusi:

- **Host Gateway** → proses `openclaw` pada mesin gateway.
- **Host Node** → runner node (aplikasi pendamping macOS atau host node headless).

### Model kepercayaan

- Pemanggil yang terautentikasi Gateway adalah operator tepercaya untuk Gateway tersebut.
- Node yang dipasangkan memperluas kapabilitas operator tepercaya tersebut ke host node.
- Exec approvals mengurangi risiko eksekusi tidak sengaja, tetapi **bukan** batas auth per pengguna.
- Eksekusi host node yang disetujui mengikat konteks eksekusi kanonis: cwd kanonis, argv persis, pengikatan env jika ada, dan path executable yang dipin jika berlaku.
- Untuk skrip shell dan invokasi berkas interpreter/runtime langsung, OpenClaw juga mencoba mengikat satu operand berkas lokal konkret. Jika berkas terikat tersebut berubah setelah persetujuan tetapi sebelum eksekusi, eksekusi ditolak alih-alih menjalankan konten yang bergeser.
- Pengikatan berkas sengaja bersifat upaya terbaik, **bukan** model semantik lengkap untuk setiap path loader interpreter/runtime. Jika mode persetujuan tidak dapat mengidentifikasi tepat satu berkas lokal konkret untuk diikat, mode tersebut menolak membuat eksekusi berbasis persetujuan alih-alih berpura-pura memiliki cakupan penuh.

### Pemisahan macOS

- **Layanan host node** meneruskan `system.run` ke **aplikasi macOS** melalui IPC lokal.
- **Aplikasi macOS** memberlakukan approvals dan menjalankan perintah dalam konteks UI.

## Pengaturan dan penyimpanan

Approvals berada dalam berkas JSON lokal pada host eksekusi:

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
  - `deny` - blokir semua permintaan host exec.
  - `allowlist` - izinkan hanya perintah yang ada di allowlist.
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
  Ketika `true`, OpenClaw memperlakukan bentuk eval kode inline sebagai hanya-persetujuan
  meskipun binary interpreter itu sendiri ada di allowlist. Defense-in-depth
  untuk loader interpreter yang tidak terpetakan bersih ke satu operand berkas
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
`allow-always` tidak mempertahankan entri allowlist baru untuknya
secara otomatis.

## Mode YOLO (tanpa persetujuan)

Jika Anda ingin host exec berjalan tanpa prompt persetujuan, Anda harus membuka
**kedua** lapisan kebijakan - kebijakan exec yang diminta dalam config OpenClaw
(`tools.exec.*`) **dan** kebijakan approvals lokal-host di
`~/.openclaw/exec-approvals.json`.

YOLO adalah perilaku host default kecuali Anda memperketatnya secara eksplisit:

| Lapisan              | Pengaturan YOLO           |
| -------------------- | ------------------------- |
| `tools.exec.security` | `full` pada `gateway`/`node` |
| `tools.exec.ask`      | `off`                     |
| Host `askFallback`    | `full`                    |

<Warning>
**Perbedaan penting:**

- `tools.exec.host=auto` memilih **di mana** exec berjalan: sandbox ketika tersedia, jika tidak gateway.
- YOLO memilih **bagaimana** host exec disetujui: `security=full` ditambah `ask=off`.
- Dalam mode YOLO, OpenClaw **tidak** menambahkan gate persetujuan command-obfuscation heuristik terpisah atau lapisan penolakan script-preflight di atas kebijakan host exec yang dikonfigurasi.
- `auto` tidak menjadikan perutean gateway sebagai override bebas dari sesi bersandbox. Permintaan per-panggilan `host=node` diizinkan dari `auto`; `host=gateway` hanya diizinkan dari `auto` ketika tidak ada runtime sandbox yang aktif. Untuk default non-auto yang stabil, setel `tools.exec.host` atau gunakan `/exec host=...` secara eksplisit.

</Warning>

Provider berbasis CLI yang mengekspos mode izin noninteraktifnya sendiri
dapat mengikuti kebijakan ini. Claude CLI menambahkan
`--permission-mode bypassPermissions` ketika kebijakan exec yang diminta OpenClaw
adalah YOLO. Timpa perilaku backend tersebut dengan argumen Claude eksplisit
di bawah `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
misalnya `--permission-mode default`, `acceptEdits`, atau
`bypassPermissions`.

Jika Anda menginginkan setup yang lebih konservatif, kencangkan kembali salah satu lapisan ke
`allowlist` / `on-miss` atau `deny`.

### Setup gateway-host persisten "jangan pernah prompt"

<Steps>
  <Step title="Setel kebijakan config yang diminta">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Samakan berkas approvals host">
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

Ini sengaja hanya lokal. Untuk mengubah approvals gateway-host atau node-host
secara jarak jauh, gunakan `openclaw approvals set --gateway` atau
`openclaw approvals set --node <id|name|ip>`.

### Host Node

Untuk host node, terapkan berkas approvals yang sama pada node tersebut:

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

- `openclaw exec-policy` tidak menyinkronkan approvals node.
- `openclaw exec-policy set --host node` ditolak.
- Node exec approvals diambil dari node saat runtime, sehingga pembaruan yang menargetkan node harus menggunakan `openclaw approvals --node ...`.

</Note>

### Pintasan khusus sesi

- `/exec security=full ask=off` hanya mengubah sesi saat ini.
- `/elevated full` adalah pintasan break-glass yang juga melewati exec approvals untuk sesi tersebut.

Jika berkas approvals host tetap lebih ketat daripada config, kebijakan host
yang lebih ketat tetap menang.

## Allowlist (per agen)

Allowlist bersifat **per agen**. Jika ada beberapa agen, ganti agen yang
sedang Anda edit di aplikasi macOS. Pola adalah pencocokan glob.

Pola dapat berupa glob path binary yang di-resolve atau glob nama perintah polos.
Nama polos hanya cocok dengan perintah yang dipanggil melalui `PATH`, sehingga `rg` dapat cocok dengan
`/opt/homebrew/bin/rg` ketika perintahnya adalah `rg`, tetapi **tidak** `./rg` atau
`/tmp/rg`. Gunakan glob path ketika Anda ingin memercayai satu lokasi binary
tertentu.

Entri legacy `agents.default` dimigrasikan ke `agents.main` saat dimuat.
Rantai shell seperti `echo ok && pwd` tetap memerlukan setiap segmen tingkat atas
untuk memenuhi aturan allowlist.

Contoh:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Membatasi argumen dengan argPattern

Tambahkan `argPattern` ketika entri allowlist harus cocok dengan binary dan
bentuk argumen tertentu. OpenClaw mengevaluasi regular expression
terhadap argumen perintah yang sudah diurai, mengecualikan token executable
(`argv[0]`). Untuk entri yang ditulis manual, argumen digabung dengan
satu spasi, jadi anchor pola ketika Anda memerlukan kecocokan persis.

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

Entri tersebut mengizinkan `python3 safe.py`; `python3 other.py` adalah miss allowlist.
Jika entri hanya-path untuk binary yang sama juga ada, argumen yang tidak cocok
masih dapat fallback ke entri hanya-path tersebut. Hilangkan entri hanya-path
ketika tujuannya adalah membatasi binary ke argumen yang dideklarasikan.

Entri yang disimpan oleh alur persetujuan dapat menggunakan format pemisah internal untuk
pencocokan argv persis. Lebih baik gunakan UI atau alur persetujuan untuk membuat ulang entri tersebut
daripada mengedit nilai terenkode secara manual. Jika OpenClaw tidak dapat
mengurai argv untuk segmen perintah, entri dengan `argPattern` tidak cocok.

Setiap entri allowlist mendukung:

| Bidang             | Arti                                                          |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Glob path biner yang diselesaikan atau glob nama perintah polos |
| `argPattern`       | Regex argv opsional; entri yang dihilangkan hanya berupa path  |
| `id`               | UUID stabil yang digunakan untuk identitas UI                 |
| `source`           | Sumber entri, seperti `allow-always`                          |
| `commandText`      | Teks perintah yang direkam saat alur persetujuan membuat entri |
| `lastUsedAt`       | Timestamp terakhir digunakan                                  |
| `lastUsedCommand`  | Perintah terakhir yang cocok                                  |
| `lastResolvedPath` | Path biner terakhir yang diselesaikan                         |

## CLI Skills yang diizinkan otomatis

Saat **CLI Skills yang diizinkan otomatis** diaktifkan, executable yang direferensikan oleh
Skills yang diketahui diperlakukan sebagai allowlist pada node (node macOS atau host
node headless). Ini menggunakan `skills.bins` melalui RPC Gateway untuk mengambil
daftar bin skill. Nonaktifkan ini jika Anda menginginkan allowlist manual yang ketat.

<Warning>
- Ini adalah **allowlist kemudahan implisit**, terpisah dari entri allowlist path manual.
- Ini ditujukan untuk lingkungan operator tepercaya tempat Gateway dan node berada dalam batas kepercayaan yang sama.
- Jika Anda memerlukan kepercayaan eksplisit yang ketat, pertahankan `autoAllowSkills: false` dan gunakan hanya entri allowlist path manual.

</Warning>

## Bin aman dan penerusan persetujuan

Untuk bin aman (jalur cepat khusus stdin), detail binding interpreter, dan
cara meneruskan prompt persetujuan ke Slack/Discord/Telegram (atau menjalankannya sebagai
klien persetujuan native), lihat
[Persetujuan exec - lanjutan](/id/tools/exec-approvals-advanced).

## Pengeditan Control UI

Gunakan kartu **Control UI → Nodes → Exec approvals** untuk mengedit default,
override per agen, dan allowlist. Pilih cakupan (Default atau agen),
sesuaikan kebijakan, tambah/hapus pola allowlist, lalu **Simpan**. UI
menampilkan metadata terakhir digunakan per pola sehingga Anda dapat menjaga daftar tetap rapi.

Pemilih target memilih **Gateway** (persetujuan lokal) atau **Node**.
Node harus mengiklankan `system.execApprovals.get/set` (aplikasi macOS atau
host node headless). Jika node belum mengiklankan persetujuan exec,
edit langsung `~/.openclaw/exec-approvals.json` lokalnya.

CLI: `openclaw approvals` mendukung pengeditan Gateway atau node - lihat
[CLI Persetujuan](/id/cli/approvals).

## Alur persetujuan

Saat prompt diperlukan, gateway menyiarkan
`exec.approval.requested` ke klien operator. Control UI dan aplikasi macOS
menyelesaikannya melalui `exec.approval.resolve`, lalu gateway meneruskan
permintaan yang disetujui ke host node.

Untuk `host=node`, permintaan persetujuan menyertakan payload `systemRunPlan`
kanonis. Gateway menggunakan plan tersebut sebagai konteks
command/cwd/session otoritatif saat meneruskan permintaan `system.run`
yang disetujui.

Itu penting untuk latensi persetujuan async:

- Jalur exec node menyiapkan satu plan kanonis di awal.
- Catatan persetujuan menyimpan plan tersebut dan metadata binding-nya.
- Setelah disetujui, panggilan `system.run` akhir yang diteruskan menggunakan ulang plan tersimpan alih-alih memercayai edit pemanggil berikutnya.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau `sessionKey` setelah permintaan persetujuan dibuat, gateway menolak run yang diteruskan sebagai ketidakcocokan persetujuan.

## Event sistem

Siklus hidup exec ditampilkan sebagai pesan sistem:

- `Exec running` (hanya jika perintah melebihi ambang pemberitahuan sedang berjalan).
- `Exec finished`.
- `Exec denied`.

Ini diposting ke sesi agen setelah node melaporkan event.
Persetujuan exec yang di-host Gateway memancarkan event siklus hidup yang sama saat
perintah selesai (dan secara opsional saat berjalan lebih lama dari ambang).
Exec yang dibatasi persetujuan menggunakan ulang id persetujuan sebagai `runId` dalam
pesan ini agar mudah dikorelasikan.

## Perilaku persetujuan yang ditolak

Saat persetujuan exec async ditolak, OpenClaw mencegah agen
menggunakan ulang output dari run sebelumnya dari perintah yang sama dalam sesi.
Alasan penolakan diteruskan dengan panduan eksplisit bahwa tidak ada output perintah
yang tersedia, yang menghentikan agen agar tidak mengklaim ada output baru atau
mengulangi perintah yang ditolak dengan hasil lama dari run sukses sebelumnya.

## Implikasi

- **`full`** sangat kuat; utamakan allowlist jika memungkinkan.
- **`ask`** membuat Anda tetap terlibat sambil tetap memungkinkan persetujuan cepat.
- Allowlist per agen mencegah persetujuan satu agen bocor ke agen lain.
- Persetujuan hanya berlaku untuk permintaan exec host dari **pengirim terotorisasi**. Pengirim tidak terotorisasi tidak dapat mengeluarkan `/exec`.
- `/exec security=full` adalah kemudahan tingkat sesi untuk operator terotorisasi dan melewati persetujuan sesuai desain. Untuk memblokir keras exec host, atur keamanan persetujuan ke `deny` atau tolak alat `exec` melalui kebijakan alat.

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
    Kapan menggunakan masing-masing kontrol.
  </Card>
  <Card title="Skills" href="/id/tools/skills" icon="sparkles">
    Perilaku izin otomatis berbasis Skills.
  </Card>
</CardGroup>
