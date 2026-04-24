---
read_when:
    - Mengonfigurasi persetujuan exec atau allowlist
    - Menerapkan UX persetujuan exec di aplikasi macOS
    - Meninjau prompt keluar dari sandbox dan implikasinya
summary: Persetujuan exec, allowlist, dan prompt keluar dari sandbox
title: Persetujuan exec
x-i18n:
    generated_at: "2026-04-24T09:30:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d7c5cd24e7c1831d5a865da6fa20f4c23280a0ec12b9e8f7f3245170a05a37d
    source_path: tools/exec-approvals.md
    workflow: 15
---

Persetujuan exec adalah **pengaman aplikasi pendamping / host node** untuk mengizinkan agen yang berada dalam sandbox menjalankan perintah pada host nyata (`gateway` atau `node`). Ini adalah interlock keamanan: perintah hanya diizinkan ketika kebijakan + allowlist + (opsional) persetujuan pengguna semuanya setuju. Persetujuan exec bertumpuk **di atas** kebijakan alat dan gating elevated (kecuali jika elevated disetel ke `full`, yang melewati persetujuan).

<Note>
Kebijakan efektif adalah yang **lebih ketat** antara default `tools.exec.*` dan default approvals;
jika field approvals dihilangkan, nilai `tools.exec` yang digunakan. Host exec
juga menggunakan state approvals lokal pada mesin tersebut — `ask: "always"` lokal host
di `~/.openclaw/exec-approvals.json` akan tetap memunculkan prompt meskipun sesi atau default
konfigurasi meminta `ask: "on-miss"`.
</Note>

## Memeriksa kebijakan efektif

- `openclaw approvals get`, `... --gateway`, `... --node <id|name|ip>` — tampilkan kebijakan yang diminta, sumber kebijakan host, dan hasil efektifnya.
- `openclaw exec-policy show` — tampilan gabungan mesin lokal.
- `openclaw exec-policy set|preset` — sinkronkan kebijakan lokal yang diminta dengan file approvals host lokal dalam satu langkah.

Saat scope lokal meminta `host=node`, `exec-policy show` melaporkan scope tersebut
sebagai dikelola node saat runtime alih-alih berpura-pura file approvals lokal adalah
source of truth.

Jika UI aplikasi pendamping **tidak tersedia**, setiap permintaan yang biasanya
memunculkan prompt akan diselesaikan oleh **ask fallback** (default: deny).

<Tip>
Klien persetujuan chat native dapat menanam affordance khusus channel pada
pesan persetujuan yang tertunda. Misalnya, Matrix menanam shortcut reaction (`✅`
izinkan sekali, `❌` tolak, `♾️` izinkan selalu) sambil tetap menyisakan perintah
`/approve ...` di pesan sebagai fallback.
</Tip>

## Di mana ini berlaku

Persetujuan exec ditegakkan secara lokal pada host eksekusi:

- **host gateway** → proses `openclaw` di mesin gateway
- **host node** → runner node (aplikasi pendamping macOS atau host node headless)

Catatan model kepercayaan:

- Pemanggil yang diautentikasi Gateway adalah operator tepercaya untuk Gateway tersebut.
- Node yang dipasangkan memperluas kemampuan operator tepercaya itu ke host node.
- Persetujuan exec mengurangi risiko eksekusi yang tidak disengaja, tetapi bukan batas autentikasi per pengguna.
- Eksekusi host node yang disetujui mengikat konteks eksekusi kanonis: cwd kanonis, argv persis, pengikatan env
  jika ada, dan path executable yang dipin jika berlaku.
- Untuk shell script dan pemanggilan file interpreter/runtime langsung, OpenClaw juga berupaya mengikat
  satu operand file lokal konkret. Jika file yang diikat itu berubah setelah persetujuan tetapi sebelum eksekusi,
  eksekusi ditolak alih-alih menjalankan konten yang sudah bergeser.
- Pengikatan file ini sengaja bersifat best-effort, bukan model semantik lengkap dari setiap
  jalur loader interpreter/runtime. Jika mode persetujuan tidak dapat mengidentifikasi dengan tepat satu
  file lokal konkret untuk diikat, ia menolak membuat eksekusi yang didukung persetujuan alih-alih berpura-pura mencakup semuanya.

Pemisahan macOS:

- **layanan host node** meneruskan `system.run` ke **aplikasi macOS** melalui IPC lokal.
- **aplikasi macOS** menegakkan persetujuan + mengeksekusi perintah dalam konteks UI.

## Pengaturan dan penyimpanan

Persetujuan disimpan dalam file JSON lokal pada host eksekusi:

`~/.openclaw/exec-approvals.json`

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

## Mode "YOLO" tanpa persetujuan

Jika Anda ingin host exec berjalan tanpa prompt persetujuan, Anda harus membuka **kedua** lapisan kebijakan:

- kebijakan exec yang diminta di konfigurasi OpenClaw (`tools.exec.*`)
- kebijakan approvals lokal host di `~/.openclaw/exec-approvals.json`

Ini sekarang menjadi perilaku host default kecuali jika Anda memperketatnya secara eksplisit:

- `tools.exec.security`: `full` pada `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Perbedaan penting:

- `tools.exec.host=auto` memilih lokasi exec dijalankan: sandbox jika tersedia, jika tidak gateway.
- YOLO memilih bagaimana host exec disetujui: `security=full` plus `ask=off`.
- Provider berbasis CLI yang mengekspos mode izin non-interaktif miliknya sendiri dapat mengikuti kebijakan ini.
  Claude CLI menambahkan `--permission-mode bypassPermissions` saat kebijakan exec yang diminta OpenClaw adalah
  YOLO. Override perilaku backend itu dengan argumen Claude eksplisit di bawah
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs`, misalnya
  `--permission-mode default`, `acceptEdits`, atau `bypassPermissions`.
- Dalam mode YOLO, OpenClaw tidak menambahkan gate persetujuan obfuscation perintah heuristik terpisah atau lapisan penolakan preflight script di atas kebijakan host exec yang dikonfigurasi.
- `auto` tidak menjadikan perutean gateway override gratis dari sesi sandbox. Permintaan per panggilan `host=node` diizinkan dari `auto`, dan `host=gateway` hanya diizinkan dari `auto` saat tidak ada runtime sandbox yang aktif. Jika Anda menginginkan default non-auto yang stabil, setel `tools.exec.host` atau gunakan `/exec host=...` secara eksplisit.

Jika Anda menginginkan penyiapan yang lebih konservatif, kembalikan salah satu lapisan menjadi lebih ketat ke `allowlist` / `on-miss`
atau `deny`.

Penyiapan host-gateway persisten "jangan pernah prompt":

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Lalu setel file approvals host agar cocok:

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

Shortcut lokal untuk kebijakan host-gateway yang sama pada mesin saat ini:

```bash
openclaw exec-policy preset yolo
```

Shortcut lokal itu memperbarui keduanya:

- `tools.exec.host/security/ask` lokal
- default `~/.openclaw/exec-approvals.json` lokal

Ini sengaja hanya lokal. Jika Anda perlu mengubah approvals host gateway atau host node
secara remote, tetap gunakan `openclaw approvals set --gateway` atau
`openclaw approvals set --node <id|name|ip>`.

Untuk host node, terapkan file approvals yang sama pada node tersebut:

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

Batasan penting yang hanya lokal:

- `openclaw exec-policy` tidak menyinkronkan approvals node
- `openclaw exec-policy set --host node` ditolak
- persetujuan exec node diambil dari node saat runtime, jadi pembaruan yang menargetkan node harus menggunakan `openclaw approvals --node ...`

Shortcut hanya-sesi:

- `/exec security=full ask=off` hanya mengubah sesi saat ini.
- `/elevated full` adalah shortcut break-glass yang juga melewati persetujuan exec untuk sesi itu.

Jika file approvals host tetap lebih ketat daripada konfigurasi, kebijakan host yang lebih ketat tetap menang.

## Kontrol kebijakan

### Security (`exec.security`)

- **deny**: blokir semua permintaan host exec.
- **allowlist**: izinkan hanya perintah yang ada di allowlist.
- **full**: izinkan semuanya (setara dengan elevated).

### Ask (`exec.ask`)

- **off**: jangan pernah prompt.
- **on-miss**: prompt hanya saat allowlist tidak cocok.
- **always**: prompt pada setiap perintah.
- kepercayaan tahan lama `allow-always` tidak menekan prompt saat mode ask efektif adalah `always`

### Ask fallback (`askFallback`)

Jika prompt diperlukan tetapi tidak ada UI yang dapat dijangkau, fallback memutuskan:

- **deny**: blokir.
- **allowlist**: izinkan hanya jika allowlist cocok.
- **full**: izinkan.

### Hardening eval interpreter inline (`tools.exec.strictInlineEval`)

Saat `tools.exec.strictInlineEval=true`, OpenClaw memperlakukan bentuk eval kode inline sebagai perlu persetujuan meskipun binary interpreter itu sendiri ada dalam allowlist.

Contoh:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Ini adalah defense-in-depth untuk loader interpreter yang tidak memetakan dengan rapi ke satu operand file stabil. Dalam mode strict:

- perintah-perintah ini tetap memerlukan persetujuan eksplisit;
- `allow-always` tidak secara otomatis menyimpan entri allowlist baru untuk perintah tersebut.

## Allowlist (per agen)

Allowlist bersifat **per agen**. Jika ada beberapa agen, pindahkan agen yang
sedang Anda edit di aplikasi macOS. Pola adalah **pencocokan glob case-insensitive**.
Pola harus di-resolve menjadi **path binary** (entri yang hanya basename diabaikan).
Entri legacy `agents.default` dimigrasikan ke `agents.main` saat dimuat.
Rangkaian shell seperti `echo ok && pwd` tetap mengharuskan setiap segmen tingkat atas memenuhi aturan allowlist.

Contoh:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Setiap entri allowlist melacak:

- **id** UUID stabil yang digunakan untuk identitas UI (opsional)
- **terakhir digunakan** timestamp
- **perintah terakhir digunakan**
- **path terakhir di-resolve**

## Izinkan otomatis CLI skill

Saat **Auto-allow skill CLIs** diaktifkan, executable yang dirujuk oleh Skills yang diketahui
diperlakukan sebagai ada di allowlist pada node (node macOS atau host node headless). Ini menggunakan
`skills.bins` melalui Gateway RPC untuk mengambil daftar bin skill. Nonaktifkan ini jika Anda menginginkan allowlist manual yang ketat.

Catatan penting tentang kepercayaan:

- Ini adalah **allowlist kemudahan implisit**, terpisah dari entri allowlist path manual.
- Ini ditujukan untuk lingkungan operator tepercaya di mana Gateway dan node berada dalam batas kepercayaan yang sama.
- Jika Anda memerlukan kepercayaan eksplisit yang ketat, biarkan `autoAllowSkills: false` dan gunakan hanya entri allowlist path manual.

## Safe bins dan penerusan persetujuan

Untuk safe bins (jalur cepat stdin-only), detail pengikatan interpreter, dan cara
meneruskan prompt persetujuan ke Slack/Discord/Telegram (atau menjalankannya sebagai klien persetujuan native),
lihat [Persetujuan exec — lanjutan](/id/tools/exec-approvals-advanced).

<!-- moved to /tools/exec-approvals-advanced -->

## Pengeditan UI Control

Gunakan kartu **UI Control → Node → Persetujuan exec** untuk mengedit default, override
per agen, dan allowlist. Pilih scope (Defaults atau agen), ubah kebijakannya,
tambahkan/hapus pola allowlist, lalu **Save**. UI menampilkan metadata **terakhir digunakan**
per pola agar Anda dapat menjaga daftar tetap rapi.

Pemilih target memilih **Gateway** (approvals lokal) atau **Node**. Node
harus mengiklankan `system.execApprovals.get/set` (aplikasi macOS atau host node headless).
Jika node belum mengiklankan exec approvals, edit
`~/.openclaw/exec-approvals.json` lokalnya secara langsung.

CLI: `openclaw approvals` mendukung pengeditan gateway atau node (lihat [CLI Approvals](/id/cli/approvals)).

## Alur persetujuan

Saat prompt diperlukan, gateway menyiarkan `exec.approval.requested` ke klien operator.
UI Control dan aplikasi macOS menyelesaikannya melalui `exec.approval.resolve`, lalu gateway meneruskan
permintaan yang disetujui ke host node.

Untuk `host=node`, permintaan persetujuan menyertakan payload `systemRunPlan` kanonis. Gateway menggunakan
rencana itu sebagai konteks perintah/cwd/sesi otoritatif saat meneruskan permintaan `system.run`
yang disetujui.

Ini penting untuk latensi persetujuan async:

- jalur exec node menyiapkan satu rencana kanonis di awal
- catatan persetujuan menyimpan rencana itu dan metadata pengikatannya
- setelah disetujui, panggilan `system.run` final yang diteruskan menggunakan kembali rencana yang disimpan
  alih-alih memercayai edit pemanggil setelahnya
- jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau
  `sessionKey` setelah permintaan persetujuan dibuat, gateway menolak
  eksekusi yang diteruskan sebagai ketidakcocokan persetujuan

## Event sistem

Siklus hidup exec ditampilkan sebagai pesan sistem:

- `Exec running` (hanya jika perintah melebihi ambang notifikasi sedang berjalan)
- `Exec finished`
- `Exec denied`

Ini diposting ke sesi agen setelah node melaporkan event tersebut.
Persetujuan exec host-gateway mengeluarkan event siklus hidup yang sama saat perintah selesai (dan opsional saat berjalan lebih lama dari ambang batas).
Exec yang digating oleh persetujuan menggunakan kembali id persetujuan sebagai `runId` dalam pesan-pesan ini agar mudah dikorelasikan.

## Perilaku saat persetujuan ditolak

Saat persetujuan exec async ditolak, OpenClaw mencegah agen menggunakan kembali
output dari eksekusi sebelumnya dari perintah yang sama dalam sesi. Alasan penolakan
diteruskan dengan panduan eksplisit bahwa tidak ada output perintah yang tersedia, yang menghentikan
agen mengklaim ada output baru atau mengulangi perintah yang ditolak dengan
hasil usang dari eksekusi sukses sebelumnya.

## Implikasi

- **full** sangat kuat; utamakan allowlist bila memungkinkan.
- **ask** membuat Anda tetap terlibat sambil tetap memungkinkan persetujuan cepat.
- Allowlist per agen mencegah persetujuan satu agen bocor ke agen lain.
- Persetujuan hanya berlaku untuk permintaan host exec dari **pengirim yang berwenang**. Pengirim yang tidak berwenang tidak dapat mengeluarkan `/exec`.
- `/exec security=full` adalah kemudahan tingkat sesi untuk operator yang berwenang dan secara desain melewati persetujuan. Untuk memblokir total host exec, setel approvals security ke `deny` atau tolak alat `exec` melalui kebijakan alat.

## Terkait

<CardGroup cols={2}>
  <Card title="Persetujuan exec — lanjutan" href="/id/tools/exec-approvals-advanced" icon="gear">
    Safe bins, pengikatan interpreter, dan penerusan persetujuan ke chat.
  </Card>
  <Card title="Alat exec" href="/id/tools/exec" icon="terminal">
    Alat eksekusi perintah shell.
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
  <Card title="Sandbox vs kebijakan alat vs elevated" href="/id/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Kapan menggunakan masing-masing kontrol.
  </Card>
  <Card title="Skills" href="/id/tools/skills" icon="sparkles">
    Perilaku auto-allow yang didukung skill.
  </Card>
</CardGroup>
