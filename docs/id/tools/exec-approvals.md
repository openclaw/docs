---
read_when:
    - Mengonfigurasi persetujuan exec atau allowlist
    - Mengimplementasikan UX persetujuan exec di aplikasi macOS
    - Meninjau prompt sandbox-escape dan implikasinya
sidebarTitle: Exec approvals
summary: 'Persetujuan exec host: knob kebijakan, allowlist, dan alur kerja YOLO/strict'
title: Persetujuan exec
x-i18n:
    generated_at: "2026-04-26T11:40:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 868cee97882f7298a092bdcb9ec8fd058a5d7cb8745fad2edd712fabfb512e52
    source_path: tools/exec-approvals.md
    workflow: 15
---

Persetujuan exec adalah **guardrail aplikasi pendamping / host node** untuk mengizinkan
agent tersandbox menjalankan perintah pada host nyata (`gateway` atau `node`). Ini adalah
interlock keamanan: perintah hanya diizinkan ketika kebijakan + allowlist +
(persetujuan pengguna opsional) semuanya setuju. Persetujuan exec menumpuk **di atas**
kebijakan tool dan elevated gating (kecuali elevated disetel ke `full`, yang
melewati persetujuan).

<Note>
Kebijakan efektif adalah yang **lebih ketat** antara default `tools.exec.*` dan
persetujuan; jika field persetujuan dihilangkan, nilai `tools.exec`
yang digunakan. Exec host juga menggunakan state persetujuan lokal pada mesin tersebut — `ask: "always"` lokal pada
`~/.openclaw/exec-approvals.json` akan tetap memunculkan prompt meskipun default sesi atau config meminta `ask: "on-miss"`.
</Note>

## Memeriksa kebijakan efektif

| Command                                                          | Apa yang ditampilkan                                                                    |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Kebijakan yang diminta, sumber kebijakan host, dan hasil efektifnya.                    |
| `openclaw exec-policy show`                                      | Tampilan gabungan mesin lokal.                                                          |
| `openclaw exec-policy set` / `preset`                            | Menyinkronkan kebijakan yang diminta lokal dengan file persetujuan host lokal dalam satu langkah. |

Saat scope lokal meminta `host=node`, `exec-policy show` melaporkan
scope tersebut sebagai dikelola node saat runtime alih-alih berpura-pura bahwa file
persetujuan lokal adalah sumber kebenarannya.

Jika UI aplikasi pendamping **tidak tersedia**, setiap permintaan yang biasanya
memunculkan prompt akan diselesaikan oleh **ask fallback** (default: `deny`).

<Tip>
Klien persetujuan chat bawaan dapat melakukan seed affordance khusus saluran pada
pesan persetujuan yang tertunda. Misalnya, Matrix melakukan seed shortcut reaksi
(`✅` izinkan sekali, `❌` tolak, `♾️` izinkan selalu) sambil tetap membiarkan
perintah `/approve ...` di pesan sebagai fallback.
</Tip>

## Tempat ini berlaku

Persetujuan exec diberlakukan secara lokal pada host eksekusi:

- **Host Gateway** → proses `openclaw` pada mesin gateway.
- **Host node** → runner node (aplikasi pendamping macOS atau host node headless).

### Model kepercayaan

- Pemanggil yang diautentikasi Gateway adalah operator tepercaya untuk Gateway tersebut.
- Node yang dipasangkan memperluas kapabilitas operator tepercaya itu ke host node.
- Persetujuan exec mengurangi risiko eksekusi yang tidak disengaja, tetapi **bukan** batas autentikasi per pengguna.
- Run host-node yang disetujui mengikat konteks eksekusi kanonis: cwd kanonis, argv persis, binding env saat ada, dan path executable yang dipatok bila berlaku.
- Untuk shell script dan pemanggilan file interpreter/runtime langsung, OpenClaw juga mencoba mengikat satu operand file lokal konkret. Jika file yang diikat ini berubah setelah persetujuan tetapi sebelum eksekusi, run akan ditolak alih-alih menjalankan konten yang berubah.
- Pengikatan file sengaja bersifat best-effort, **bukan** model semantik lengkap untuk setiap path loader interpreter/runtime. Jika mode persetujuan tidak dapat mengidentifikasi tepat satu file lokal konkret untuk diikat, mode ini menolak membuat run berbasis persetujuan alih-alih berpura-pura memiliki cakupan penuh.

### Pemisahan macOS

- **Layanan host node** meneruskan `system.run` ke **aplikasi macOS** melalui IPC lokal.
- **Aplikasi macOS** menegakkan persetujuan dan mengeksekusi perintah dalam konteks UI.

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
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Knob kebijakan

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — blokir semua permintaan exec host.
  - `allowlist` — izinkan hanya perintah yang ada di allowlist.
  - `full` — izinkan semuanya (setara dengan elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — jangan pernah memunculkan prompt.
  - `on-miss` — munculkan prompt hanya saat allowlist tidak cocok.
  - `always` — munculkan prompt pada setiap perintah. Kepercayaan tahan lama `allow-always` **tidak** menekan prompt saat mode ask efektif adalah `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolusi saat prompt diperlukan tetapi tidak ada UI yang dapat dijangkau.

- `deny` — blokir.
- `allowlist` — izinkan hanya jika allowlist cocok.
- `full` — izinkan.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Saat `true`, OpenClaw memperlakukan bentuk code-eval inline sebagai khusus-persetujuan
  meskipun binary interpreter itu sendiri ada di allowlist. Defense-in-depth
  untuk loader interpreter yang tidak dapat dipetakan dengan bersih ke satu operand
  file stabil.
</ParamField>

Contoh yang ditangkap oleh mode strict:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Dalam mode strict, perintah ini tetap memerlukan persetujuan eksplisit, dan
`allow-always` tidak secara otomatis mempertahankan entri allowlist baru untuknya.

## Mode YOLO (tanpa persetujuan)

Jika Anda ingin exec host berjalan tanpa prompt persetujuan, Anda harus membuka
**kedua** lapisan kebijakan — kebijakan exec yang diminta dalam config OpenClaw
(`tools.exec.*`) **dan** kebijakan persetujuan lokal host dalam
`~/.openclaw/exec-approvals.json`.

YOLO adalah perilaku host default kecuali Anda memperketatnya secara eksplisit:

| Lapisan              | Pengaturan YOLO            |
| -------------------- | -------------------------- |
| `tools.exec.security` | `full` pada `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Perbedaan penting:**

- `tools.exec.host=auto` memilih **tempat** exec berjalan: sandbox bila tersedia, jika tidak gateway.
- YOLO memilih **bagaimana** exec host disetujui: `security=full` plus `ask=off`.
- Dalam mode YOLO, OpenClaw **tidak** menambahkan gate persetujuan obfuscation perintah heuristik atau lapisan penolakan script-preflight di atas kebijakan exec host yang dikonfigurasi.
- `auto` tidak membuat perutean gateway menjadi override gratis dari sesi tersandbox. Permintaan per-panggilan `host=node` diizinkan dari `auto`; `host=gateway` hanya diizinkan dari `auto` saat tidak ada runtime sandbox yang aktif. Untuk default non-auto yang stabil, setel `tools.exec.host` atau gunakan `/exec host=...` secara eksplisit.

</Warning>

Provider berbasis CLI yang mengekspos mode izin noninteraktif mereka sendiri
dapat mengikuti kebijakan ini. Claude CLI menambahkan
`--permission-mode bypassPermissions` ketika kebijakan exec yang diminta OpenClaw
adalah YOLO. Timpa perilaku backend itu dengan argumen Claude eksplisit
di bawah `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` —
misalnya `--permission-mode default`, `acceptEdits`, atau
`bypassPermissions`.

Jika Anda ingin penyiapan yang lebih konservatif, ketatkan kembali salah satu lapisan ke
`allowlist` / `on-miss` atau `deny`.

### Penyiapan persisten host gateway "jangan pernah memunculkan prompt"

<Steps>
  <Step title="Setel kebijakan config yang diminta">
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

### Shortcut lokal

```bash
openclaw exec-policy preset yolo
```

Shortcut lokal ini memperbarui keduanya:

- `tools.exec.host/security/ask` lokal.
- Default `~/.openclaw/exec-approvals.json` lokal.

Ini sengaja hanya lokal. Untuk mengubah persetujuan host gateway atau host node
dari jarak jauh, gunakan `openclaw approvals set --gateway` atau
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
**Keterbatasan hanya-lokal:**

- `openclaw exec-policy` tidak menyinkronkan persetujuan node.
- `openclaw exec-policy set --host node` ditolak.
- Persetujuan exec node diambil dari node saat runtime, sehingga pembaruan yang ditargetkan ke node harus menggunakan `openclaw approvals --node ...`.

</Note>

### Shortcut hanya-sesi

- `/exec security=full ask=off` hanya mengubah sesi saat ini.
- `/elevated full` adalah shortcut break-glass yang juga melewati persetujuan exec untuk sesi tersebut.

Jika file persetujuan host tetap lebih ketat daripada config, kebijakan host
yang lebih ketat tetap menang.

## Allowlist (per agent)

Allowlists bersifat **per agent**. Jika ada beberapa agent, ganti agent
yang sedang Anda edit di aplikasi macOS. Pola adalah kecocokan glob.

Pola dapat berupa glob path binary yang di-resolve atau glob nama perintah biasa.
Nama biasa hanya cocok dengan perintah yang dipanggil melalui `PATH`, jadi `rg` dapat cocok dengan
`/opt/homebrew/bin/rg` ketika perintahnya `rg`, tetapi **tidak** `./rg` atau
`/tmp/rg`. Gunakan glob path saat Anda ingin mempercayai satu lokasi binary tertentu.

Entri `agents.default` lama dimigrasikan ke `agents.main` saat dimuat.
Rangkaian shell seperti `echo ok && pwd` tetap memerlukan setiap segmen tingkat atas
memenuhi aturan allowlist.

Contoh:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Setiap entri allowlist melacak:

| Field              | Makna                            |
| ------------------ | -------------------------------- |
| `id`               | UUID stabil yang digunakan untuk identitas UI |
| `lastUsedAt`       | Stempel waktu terakhir digunakan |
| `lastUsedCommand`  | Perintah terakhir yang cocok     |
| `lastResolvedPath` | Path binary terakhir yang di-resolve |

## Auto-allow CLI Skills

Saat **Auto-allow skill CLIs** diaktifkan, executable yang dirujuk oleh
Skills yang dikenal diperlakukan sebagai masuk allowlist pada node (node macOS atau host
node headless). Ini menggunakan `skills.bins` melalui Gateway RPC untuk mengambil
daftar bin Skill. Nonaktifkan ini jika Anda menginginkan allowlist manual yang ketat.

<Warning>
- Ini adalah **allowlist kenyamanan implisit**, terpisah dari entri allowlist path manual.
- Ini ditujukan untuk lingkungan operator tepercaya di mana Gateway dan node berada dalam batas kepercayaan yang sama.
- Jika Anda memerlukan kepercayaan eksplisit yang ketat, pertahankan `autoAllowSkills: false` dan gunakan hanya entri allowlist path manual.

</Warning>

## Safe bins dan penerusan persetujuan

Untuk safe bins (jalur cepat hanya-stdin), detail pengikatan interpreter, dan
cara meneruskan prompt persetujuan ke Slack/Discord/Telegram (atau menjalankannya sebagai
klien persetujuan bawaan), lihat
[Persetujuan exec — lanjutan](/id/tools/exec-approvals-advanced).

## Pengeditan Control UI

Gunakan kartu **Control UI → Nodes → Exec approvals** untuk mengedit default,
override per-agent, dan allowlist. Pilih scope (Defaults atau agent),
ubah kebijakannya, tambah/hapus pola allowlist, lalu **Save**. UI
menampilkan metadata terakhir digunakan per pola agar Anda dapat menjaga daftar tetap rapi.

Pemilih target memilih **Gateway** (persetujuan lokal) atau **Node**.
Node harus mengiklankan `system.execApprovals.get/set` (aplikasi macOS atau
host node headless). Jika node belum mengiklankan persetujuan exec,
edit `~/.openclaw/exec-approvals.json` lokalnya secara langsung.

CLI: `openclaw approvals` mendukung pengeditan gateway atau node — lihat
[CLI Persetujuan](/id/cli/approvals).

## Alur persetujuan

Saat prompt diperlukan, gateway menyiarkan
`exec.approval.requested` ke klien operator. Control UI dan aplikasi macOS
menyelesaikannya melalui `exec.approval.resolve`, lalu gateway meneruskan
permintaan yang disetujui ke host node.

Untuk `host=node`, permintaan persetujuan menyertakan payload `systemRunPlan`
kanonis. Gateway menggunakan plan itu sebagai konteks
perintah/cwd/sesi yang otoritatif saat meneruskan permintaan `system.run`
yang disetujui.

Ini penting untuk latensi persetujuan async:

- Jalur exec node menyiapkan satu plan kanonis di awal.
- Catatan persetujuan menyimpan plan itu beserta metadata binding-nya.
- Setelah disetujui, panggilan `system.run` final yang diteruskan menggunakan ulang plan yang disimpan alih-alih mempercayai edit pemanggil di kemudian hari.
- Jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau `sessionKey` setelah permintaan persetujuan dibuat, gateway menolak run yang diteruskan sebagai ketidakcocokan persetujuan.

## Event sistem

Siklus hidup exec ditampilkan sebagai pesan sistem:

- `Exec running` (hanya jika perintah melebihi ambang pemberitahuan running).
- `Exec finished`.
- `Exec denied`.

Pesan-pesan ini diposting ke sesi agent setelah node melaporkan event tersebut.
Persetujuan exec host-gateway mengeluarkan event siklus hidup yang sama saat
perintah selesai (dan secara opsional saat berjalan lebih lama dari ambang).
Exec yang di-gate oleh persetujuan menggunakan ulang id persetujuan sebagai `runId` dalam pesan-pesan ini untuk korelasi yang mudah.

## Perilaku persetujuan yang ditolak

Saat persetujuan exec async ditolak, OpenClaw mencegah agent
menggunakan ulang output dari run sebelumnya dari perintah yang sama dalam sesi.
Alasan penolakan diteruskan dengan panduan eksplisit bahwa tidak ada output perintah
yang tersedia, yang menghentikan agent mengklaim ada output baru atau
mengulangi perintah yang ditolak dengan hasil basi dari run sukses sebelumnya.

## Implikasi

- **`full`** sangat kuat; pilih allowlist bila memungkinkan.
- **`ask`** membuat Anda tetap terlibat sambil tetap memungkinkan persetujuan cepat.
- Allowlist per-agent mencegah persetujuan satu agent bocor ke agent lain.
- Persetujuan hanya berlaku untuk permintaan exec host dari **pengirim yang berwenang**. Pengirim yang tidak berwenang tidak dapat mengeluarkan `/exec`.
- `/exec security=full` adalah kemudahan level-sesi untuk operator yang berwenang dan secara desain melewati persetujuan. Untuk memblokir keras exec host, setel security persetujuan ke `deny` atau tolak tool `exec` melalui kebijakan tool.

## Terkait

<CardGroup cols={2}>
  <Card title="Persetujuan exec — lanjutan" href="/id/tools/exec-approvals-advanced" icon="gear">
    Safe bins, pengikatan interpreter, dan penerusan persetujuan ke chat.
  </Card>
  <Card title="Tool exec" href="/id/tools/exec" icon="terminal">
    Tool eksekusi perintah shell.
  </Card>
  <Card title="Mode elevated" href="/id/tools/elevated" icon="shield-exclamation">
    Jalur break-glass yang juga melewati persetujuan.
  </Card>
  <Card title="Sandboxing" href="/id/gateway/sandboxing" icon="box">
    Mode sandbox dan akses workspace.
  </Card>
  <Card title="Keamanan" href="/id/gateway/security" icon="lock">
    Model keamanan dan hardening.
  </Card>
  <Card title="Sandbox vs kebijakan tool vs elevated" href="/id/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Kapan menggunakan masing-masing kontrol.
  </Card>
  <Card title="Skills" href="/id/tools/skills" icon="sparkles">
    Perilaku auto-allow yang didukung Skill.
  </Card>
</CardGroup>
