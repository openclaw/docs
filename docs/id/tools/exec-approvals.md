---
read_when:
    - Mengonfigurasi persetujuan exec atau daftar izinkan
    - Mengimplementasikan UX persetujuan exec di aplikasi macOS
    - Meninjau perintah untuk keluar dari lingkungan terisolasi dan implikasinya
sidebarTitle: Exec approvals
summary: 'Persetujuan eksekusi host: kontrol kebijakan, daftar izin, dan alur kerja YOLO/ketat'
title: Persetujuan eksekusi
x-i18n:
    generated_at: "2026-04-30T10:15:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71c16d0e547c4dd42a351d37e37e97b681a062cd496d5e0cba923b54c8f5b0e9
    source_path: tools/exec-approvals.md
    workflow: 16
---

Persetujuan exec adalah **pagar pengaman aplikasi pendamping / host Node** untuk memungkinkan agen bersandbox menjalankan perintah pada host nyata (`gateway` atau `node`). Sebuah interlock keselamatan: perintah diizinkan hanya ketika kebijakan + daftar izin + persetujuan pengguna (opsional) semuanya sepakat. Persetujuan exec ditumpuk **di atas** kebijakan alat dan gating yang ditingkatkan (kecuali elevated diatur ke `full`, yang melewati persetujuan).

<Note>
Kebijakan efektif adalah yang **lebih ketat** antara default `tools.exec.*` dan persetujuan; jika suatu kolom persetujuan dihilangkan, nilai `tools.exec` digunakan. Exec host juga menggunakan status persetujuan lokal pada mesin tersebut — `ask: "always"` lokal-host di `~/.openclaw/exec-approvals.json` tetap meminta persetujuan meskipun default sesi atau konfigurasi meminta `ask: "on-miss"`.
</Note>

## Memeriksa kebijakan efektif

| Perintah                                                          | Yang ditampilkan                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Kebijakan yang diminta, sumber kebijakan host, dan hasil efektif.                       |
| `openclaw exec-policy show`                                      | Tampilan gabungan mesin lokal.                                                             |
| `openclaw exec-policy set` / `preset`                            | Menyinkronkan kebijakan lokal yang diminta dengan file persetujuan host lokal dalam satu langkah. |

Ketika cakupan lokal meminta `host=node`, `exec-policy show` melaporkan cakupan itu sebagai dikelola Node saat runtime alih-alih berpura-pura bahwa file persetujuan lokal adalah sumber kebenaran.

Jika UI aplikasi pendamping **tidak tersedia**, permintaan apa pun yang biasanya memunculkan prompt akan diselesaikan oleh **fallback ask** (default: `deny`).

<Tip>
Klien persetujuan chat native dapat menyiapkan affordance khusus kanal pada pesan persetujuan tertunda. Misalnya, Matrix menyiapkan pintasan reaksi (`✅` izinkan sekali, `❌` tolak, `♾️` selalu izinkan) sambil tetap menyertakan perintah `/approve ...` di pesan sebagai fallback.
</Tip>

## Tempat penerapan

Persetujuan exec diberlakukan secara lokal pada host eksekusi:

- **Host Gateway** → proses `openclaw` pada mesin Gateway.
- **Host Node** → runner Node (aplikasi pendamping macOS atau host Node headless).

### Model kepercayaan

- Pemanggil yang diautentikasi Gateway dipercaya sebagai operator untuk Gateway tersebut.
- Node yang dipasangkan memperluas kapabilitas operator tepercaya itu ke host Node.
- Persetujuan exec mengurangi risiko eksekusi tidak disengaja, tetapi **bukan** batas autentikasi per pengguna.
- Eksekusi host Node yang disetujui mengikat konteks eksekusi kanonis: cwd kanonis, argv persis, pengikatan env jika ada, dan path executable yang dipin jika berlaku.
- Untuk skrip shell dan pemanggilan file interpreter/runtime langsung, OpenClaw juga mencoba mengikat satu operand file lokal konkret. Jika file terikat itu berubah setelah persetujuan tetapi sebelum eksekusi, eksekusi ditolak alih-alih menjalankan konten yang bergeser.
- Pengikatan file sengaja bersifat upaya-terbaik, **bukan** model semantik lengkap dari setiap path loader interpreter/runtime. Jika mode persetujuan tidak dapat mengidentifikasi tepat satu file lokal konkret untuk diikat, mode itu menolak membuat eksekusi berbasis persetujuan alih-alih berpura-pura memiliki cakupan penuh.

### Pemisahan macOS

- **Layanan host Node** meneruskan `system.run` ke **aplikasi macOS** melalui IPC lokal.
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
  - `deny` — blokir semua permintaan exec host.
  - `allowlist` — izinkan hanya perintah dalam daftar izin.
  - `full` — izinkan semuanya (setara dengan elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — jangan pernah meminta persetujuan.
  - `on-miss` — minta persetujuan hanya ketika daftar izin tidak cocok.
  - `always` — minta persetujuan pada setiap perintah. Kepercayaan tahan lama `allow-always` **tidak** menekan prompt ketika mode ask efektif adalah `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Penyelesaian ketika prompt diperlukan tetapi tidak ada UI yang dapat dijangkau.

- `deny` — blokir.
- `allowlist` — izinkan hanya jika daftar izin cocok.
- `full` — izinkan.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Ketika `true`, OpenClaw memperlakukan bentuk evaluasi kode inline sebagai hanya-persetujuan
  meskipun biner interpreter itu sendiri ada dalam daftar izin. Pertahanan berlapis
  untuk loader interpreter yang tidak dapat dipetakan dengan rapi ke satu operand
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

Dalam mode ketat, perintah ini tetap memerlukan persetujuan eksplisit, dan `allow-always` tidak secara otomatis menyimpan entri daftar izin baru untuknya.

## Mode YOLO (tanpa persetujuan)

Jika Anda ingin exec host berjalan tanpa prompt persetujuan, Anda harus membuka **kedua** lapisan kebijakan — kebijakan exec yang diminta dalam konfigurasi OpenClaw (`tools.exec.*`) **dan** kebijakan persetujuan lokal-host dalam `~/.openclaw/exec-approvals.json`.

YOLO adalah perilaku host default kecuali Anda memperketatnya secara eksplisit:

| Lapisan                 | Pengaturan YOLO               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` pada `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| `askFallback` host    | `full`                     |

<Warning>
**Perbedaan penting:**

- `tools.exec.host=auto` memilih **di mana** exec berjalan: sandbox ketika tersedia, selain itu Gateway.
- YOLO memilih **bagaimana** exec host disetujui: `security=full` plus `ask=off`.
- Dalam mode YOLO, OpenClaw **tidak** menambahkan gerbang persetujuan obfuscation perintah heuristik terpisah atau lapisan penolakan preflight skrip di atas kebijakan exec host yang dikonfigurasi.
- `auto` tidak menjadikan perutean Gateway sebagai override bebas dari sesi bersandbox. Permintaan per panggilan `host=node` diizinkan dari `auto`; `host=gateway` hanya diizinkan dari `auto` ketika tidak ada runtime sandbox yang aktif. Untuk default non-auto yang stabil, atur `tools.exec.host` atau gunakan `/exec host=...` secara eksplisit.

</Warning>

Provider berbasis CLI yang mengekspos mode izin noninteraktifnya sendiri dapat mengikuti kebijakan ini. Claude CLI menambahkan `--permission-mode bypassPermissions` ketika kebijakan exec yang diminta OpenClaw adalah YOLO. Timpa perilaku backend itu dengan argumen Claude eksplisit di bawah `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` — misalnya `--permission-mode default`, `acceptEdits`, atau `bypassPermissions`.

Jika Anda menginginkan penyiapan yang lebih konservatif, perketat salah satu lapisan kembali ke `allowlist` / `on-miss` atau `deny`.

### Penyiapan "jangan pernah prompt" host Gateway persisten

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

Ini sengaja hanya lokal. Untuk mengubah persetujuan host Gateway atau host Node dari jarak jauh, gunakan `openclaw approvals set --gateway` atau `openclaw approvals set --node <id|name|ip>`.

### Host Node

Untuk host Node, terapkan file persetujuan yang sama pada Node itu:

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

### Pintasan hanya-sesi

- `/exec security=full ask=off` hanya mengubah sesi saat ini.
- `/elevated full` adalah pintasan break-glass yang juga melewati persetujuan exec untuk sesi itu.

Jika file persetujuan host tetap lebih ketat daripada konfigurasi, kebijakan host yang lebih ketat tetap menang.

## Daftar izin (per agen)

Daftar izin adalah **per agen**. Jika ada beberapa agen, ganti agen yang sedang Anda edit di aplikasi macOS. Pola adalah kecocokan glob.

Pola dapat berupa glob path biner yang di-resolve atau glob nama perintah polos. Nama polos hanya cocok dengan perintah yang dipanggil melalui `PATH`, sehingga `rg` dapat cocok dengan `/opt/homebrew/bin/rg` ketika perintahnya adalah `rg`, tetapi **tidak** `./rg` atau `/tmp/rg`. Gunakan glob path ketika Anda ingin memercayai satu lokasi biner tertentu.

Entri lama `agents.default` dimigrasikan ke `agents.main` saat dimuat. Rantai shell seperti `echo ok && pwd` tetap memerlukan setiap segmen tingkat atas untuk memenuhi aturan daftar izin.

Contoh:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Setiap entri daftar izin melacak:

| Kolom              | Makna                          |
| ------------------ | -------------------------------- |
| `id`               | UUID stabil yang digunakan untuk identitas UI |
| `lastUsedAt`       | Timestamp penggunaan terakhir              |
| `lastUsedCommand`  | Perintah terakhir yang cocok        |
| `lastResolvedPath` | Path biner terakhir yang di-resolve        |

## Izinkan otomatis CLI Skills

Ketika **Izinkan otomatis CLI Skills** diaktifkan, executable yang dirujuk oleh Skills yang diketahui diperlakukan sebagai masuk daftar izin pada Node (Node macOS atau host Node headless). Ini menggunakan `skills.bins` melalui RPC Gateway untuk mengambil daftar bin skill. Nonaktifkan ini jika Anda menginginkan daftar izin manual yang ketat.

<Warning>
- Ini adalah **daftar izin kemudahan implisit**, terpisah dari entri daftar izin path manual.
- Ini ditujukan untuk lingkungan operator tepercaya tempat Gateway dan Node berada dalam batas kepercayaan yang sama.
- Jika Anda memerlukan kepercayaan eksplisit yang ketat, pertahankan `autoAllowSkills: false` dan gunakan hanya entri daftar izin path manual.

</Warning>

## Bin aman dan penerusan persetujuan

Untuk bin aman (jalur cepat hanya-stdin), detail pengikatan interpreter, dan cara meneruskan prompt persetujuan ke Slack/Discord/Telegram (atau menjalankannya sebagai klien persetujuan native), lihat [Persetujuan exec — lanjutan](/id/tools/exec-approvals-advanced).

## Pengeditan UI Kontrol

Gunakan kartu **UI Kontrol → Node → Persetujuan exec** untuk mengedit default, override per agen, dan daftar izin. Pilih cakupan (Default atau agen), sesuaikan kebijakan, tambah/hapus pola daftar izin, lalu **Simpan**. UI menampilkan metadata penggunaan terakhir per pola sehingga Anda dapat menjaga daftar tetap rapi.

Pemilih target memilih **Gateway** (persetujuan lokal) atau **Node**.
Node harus mengiklankan `system.execApprovals.get/set` (aplikasi macOS atau
host node headless). Jika sebuah node belum mengiklankan persetujuan exec,
edit langsung `~/.openclaw/exec-approvals.json` lokalnya.

CLI: `openclaw approvals` mendukung pengeditan gateway atau node — lihat
[CLI Persetujuan](/id/cli/approvals).

## Alur persetujuan

Saat prompt diperlukan, gateway menyiarkan
`exec.approval.requested` ke klien operator. Control UI dan aplikasi macOS
menyelesaikannya melalui `exec.approval.resolve`, lalu gateway meneruskan
permintaan yang disetujui ke host node.

Untuk `host=node`, permintaan persetujuan menyertakan payload `systemRunPlan`
kanonis. Gateway menggunakan rencana itu sebagai konteks
command/cwd/session otoritatif saat meneruskan permintaan `system.run`
yang disetujui.

Hal itu penting untuk latensi persetujuan async:

- Jalur exec node menyiapkan satu rencana kanonis di awal.
- Catatan persetujuan menyimpan rencana itu dan metadata binding-nya.
- Setelah disetujui, panggilan `system.run` final yang diteruskan memakai ulang rencana tersimpan alih-alih memercayai edit pemanggil setelahnya.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau `sessionKey` setelah permintaan persetujuan dibuat, gateway menolak run yang diteruskan sebagai ketidakcocokan persetujuan.

## Event sistem

Siklus hidup exec ditampilkan sebagai pesan sistem:

- `Exec running` (hanya jika perintah melebihi ambang notifikasi berjalan).
- `Exec finished`.
- `Exec denied`.

Ini diposting ke sesi agen setelah node melaporkan event tersebut.
Persetujuan exec host-gateway memancarkan event siklus hidup yang sama saat
perintah selesai (dan secara opsional saat berjalan lebih lama dari ambang).
Exec yang dibatasi persetujuan memakai ulang id persetujuan sebagai `runId` dalam pesan-pesan ini agar mudah dikorelasikan.

## Perilaku persetujuan yang ditolak

Saat persetujuan exec async ditolak, OpenClaw mencegah agen
memakai ulang output dari run sebelumnya untuk perintah yang sama dalam sesi.
Alasan penolakan diteruskan dengan panduan eksplisit bahwa tidak ada output perintah
yang tersedia, sehingga menghentikan agen agar tidak mengklaim ada output baru atau
mengulangi perintah yang ditolak dengan hasil lama dari run sukses sebelumnya.

## Implikasi

- **`full`** sangat kuat; pilih allowlist bila memungkinkan.
- **`ask`** membuat Anda tetap terlibat sekaligus memungkinkan persetujuan cepat.
- Allowlist per agen mencegah persetujuan satu agen bocor ke agen lain.
- Persetujuan hanya berlaku untuk permintaan exec host dari **pengirim terotorisasi**. Pengirim tidak terotorisasi tidak dapat menjalankan `/exec`.
- `/exec security=full` adalah kemudahan tingkat sesi untuk operator terotorisasi dan memang melewati persetujuan. Untuk memblokir keras exec host, atur keamanan persetujuan ke `deny` atau tolak tool `exec` melalui kebijakan tool.

## Terkait

<CardGroup cols={2}>
  <Card title="Persetujuan exec — lanjutan" href="/id/tools/exec-approvals-advanced" icon="gear">
    Bin aman, binding interpreter, dan penerusan persetujuan ke chat.
  </Card>
  <Card title="Tool exec" href="/id/tools/exec" icon="terminal">
    Tool eksekusi perintah shell.
  </Card>
  <Card title="Mode tinggi" href="/id/tools/elevated" icon="shield-exclamation">
    Jalur break-glass yang juga melewati persetujuan.
  </Card>
  <Card title="Sandboxing" href="/id/gateway/sandboxing" icon="box">
    Mode sandbox dan akses workspace.
  </Card>
  <Card title="Keamanan" href="/id/gateway/security" icon="lock">
    Model keamanan dan hardening.
  </Card>
  <Card title="Sandbox vs kebijakan tool vs elevated" href="/id/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Kapan menggunakan tiap kontrol.
  </Card>
  <Card title="Skills" href="/id/tools/skills" icon="sparkles">
    Perilaku auto-allow yang didukung Skills.
  </Card>
</CardGroup>
