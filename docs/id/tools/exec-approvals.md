---
read_when:
    - Mengonfigurasi persetujuan exec atau allowlist
    - Menerapkan UX persetujuan exec di aplikasi macOS
    - Meninjau prompt keluar dari sandbox dan implikasinya
summary: Persetujuan exec, allowlist, dan prompt keluar dari sandbox
title: Persetujuan Exec
x-i18n:
    generated_at: "2026-04-05T14:09:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1efa3b78efe3ca6246acfb37830b103ede40cc5298dcc7da8e9fbc5f6cc88ef
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Persetujuan exec

Persetujuan exec adalah **guardrail aplikasi pendamping / host node** untuk memungkinkan agen yang tersandbox menjalankan
perintah di host nyata (`gateway` atau `node`). Anggap ini sebagai interlock keamanan:
perintah hanya diizinkan ketika kebijakan + allowlist + (opsional) persetujuan pengguna semuanya setuju.
Persetujuan exec adalah **tambahan** terhadap kebijakan tool dan elevated gating (kecuali elevated disetel ke `full`, yang melewati persetujuan).
Kebijakan efektif adalah yang **lebih ketat** antara default `tools.exec.*` dan persetujuan; jika sebuah field persetujuan dihilangkan, nilai `tools.exec` yang digunakan.
Host exec juga menggunakan status persetujuan lokal di mesin tersebut. Nilai lokal host
`ask: "always"` di `~/.openclaw/exec-approvals.json` tetap akan memunculkan prompt meskipun
default sesi atau konfigurasi meminta `ask: "on-miss"`.
Gunakan `openclaw approvals get`, `openclaw approvals get --gateway`, atau
`openclaw approvals get --node <id|name|ip>` untuk memeriksa kebijakan yang diminta,
sumber kebijakan host, dan hasil efektifnya.

Jika UI aplikasi pendamping **tidak tersedia**, setiap permintaan yang memerlukan prompt akan
diselesaikan oleh **ask fallback** (default: deny).

## Tempat ini berlaku

Persetujuan exec ditegakkan secara lokal di host eksekusi:

- **host gateway** → proses `openclaw` di mesin gateway
- **host node** → node runner (aplikasi pendamping macOS atau host node headless)

Catatan model kepercayaan:

- Pemanggil yang diautentikasi gateway adalah operator tepercaya untuk Gateway tersebut.
- Node yang dipasangkan memperluas kapabilitas operator tepercaya itu ke host node.
- Persetujuan exec mengurangi risiko eksekusi yang tidak disengaja, tetapi bukan batas auth per pengguna.
- Run host-node yang disetujui mengikat konteks eksekusi kanonis: cwd kanonis, argv yang tepat, pengikatan env
  jika ada, dan jalur executable yang dipin bila berlaku.
- Untuk shell script dan pemanggilan file interpreter/runtime langsung, OpenClaw juga mencoba mengikat
  satu operand file lokal konkret. Jika file yang terikat itu berubah setelah persetujuan tetapi sebelum eksekusi,
  run ditolak alih-alih mengeksekusi konten yang telah berubah.
- Pengikatan file ini sengaja best-effort, bukan model semantik lengkap untuk setiap
  jalur loader interpreter/runtime. Jika mode persetujuan tidak dapat mengidentifikasi tepat satu
  file lokal konkret untuk diikat, mode ini menolak membuat run berbasis persetujuan alih-alih berpura-pura memiliki cakupan penuh.

Pemisahan macOS:

- **layanan host node** meneruskan `system.run` ke **aplikasi macOS** melalui IPC lokal.
- **aplikasi macOS** menegakkan persetujuan + mengeksekusi perintah dalam konteks UI.

## Pengaturan dan penyimpanan

Persetujuan berada di file JSON lokal pada host eksekusi:

`~/.openclaw/exec-approvals.json`

Contoh schema:

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
- kebijakan persetujuan lokal host di `~/.openclaw/exec-approvals.json`

Ini sekarang adalah perilaku host default kecuali Anda memperketatnya secara eksplisit:

- `tools.exec.security`: `full` pada `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Perbedaan penting:

- `tools.exec.host=auto` memilih tempat exec berjalan: sandbox jika tersedia, jika tidak gateway.
- YOLO memilih bagaimana host exec disetujui: `security=full` plus `ask=off`.
- `auto` tidak membuat routing gateway menjadi override bebas dari sesi yang tersandbox. Permintaan per-panggilan `host=node` diizinkan dari `auto`, dan `host=gateway` hanya diizinkan dari `auto` ketika tidak ada runtime sandbox yang aktif. Jika Anda ingin default non-auto yang stabil, setel `tools.exec.host` atau gunakan `/exec host=...` secara eksplisit.

Jika Anda ingin penyiapan yang lebih konservatif, ketatkan salah satu lapisan kembali ke `allowlist` / `on-miss`
atau `deny`.

Penyiapan persisten host-gateway "jangan pernah prompt":

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Lalu setel file persetujuan host agar cocok:

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

Shortcut hanya untuk sesi:

- `/exec security=full ask=off` hanya mengubah sesi saat ini.
- `/elevated full` adalah shortcut break-glass yang juga melewati persetujuan exec untuk sesi tersebut.

Jika file persetujuan host tetap lebih ketat daripada konfigurasi, kebijakan host yang lebih ketat tetap menang.

## Tombol kebijakan

### Security (`exec.security`)

- **deny**: blokir semua permintaan host exec.
- **allowlist**: izinkan hanya perintah yang ada di allowlist.
- **full**: izinkan semuanya (setara dengan elevated).

### Ask (`exec.ask`)

- **off**: jangan pernah prompt.
- **on-miss**: prompt hanya ketika allowlist tidak cocok.
- **always**: prompt untuk setiap perintah.
- `allow-always` durable trust tidak menekan prompt ketika mode ask efektif adalah `always`

### Ask fallback (`askFallback`)

Jika prompt diperlukan tetapi tidak ada UI yang dapat dijangkau, fallback menentukan:

- **deny**: blokir.
- **allowlist**: izinkan hanya jika allowlist cocok.
- **full**: izinkan.

### Hardening inline interpreter eval (`tools.exec.strictInlineEval`)

Saat `tools.exec.strictInlineEval=true`, OpenClaw memperlakukan bentuk inline code-eval sebagai hanya-bisa-disetujui bahkan jika binary interpreter itu sendiri ada di allowlist.

Contoh:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Ini adalah defense-in-depth untuk loader interpreter yang tidak dipetakan secara bersih ke satu operand file stabil. Dalam mode ketat:

- perintah-perintah ini tetap memerlukan persetujuan eksplisit;
- `allow-always` tidak secara otomatis menyimpan entri allowlist baru untuk perintah-perintah tersebut.

## Allowlist (per agen)

Allowlist bersifat **per agen**. Jika ada beberapa agen, ganti agen yang sedang
Anda edit di aplikasi macOS. Pattern adalah **glob match tanpa membedakan huruf besar/kecil**.
Pattern harus di-resolve ke **jalur binary** (entri basename-only diabaikan).
Entri `agents.default` lama dimigrasikan ke `agents.main` saat dimuat.
Rangkaian shell seperti `echo ok && pwd` tetap memerlukan setiap segmen tingkat atas untuk memenuhi aturan allowlist.

Contoh:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Setiap entri allowlist melacak:

- **id** UUID stabil yang digunakan untuk identitas UI (opsional)
- **terakhir digunakan** timestamp
- **perintah terakhir digunakan**
- **jalur terakhir yang di-resolve**

## Auto-allow CLI skill

Ketika **Auto-allow skill CLIs** diaktifkan, executable yang dirujuk oleh skill yang dikenal
diperlakukan sebagai ada di allowlist pada node (node macOS atau host node headless). Ini menggunakan
`skills.bins` melalui Gateway RPC untuk mengambil daftar bin skill. Nonaktifkan ini jika Anda menginginkan allowlist manual yang ketat.

Catatan kepercayaan penting:

- Ini adalah **allowlist kemudahan implisit**, terpisah dari entri allowlist jalur manual.
- Ini ditujukan untuk environment operator tepercaya tempat Gateway dan node berada dalam batas kepercayaan yang sama.
- Jika Anda memerlukan kepercayaan eksplisit yang ketat, pertahankan `autoAllowSkills: false` dan gunakan hanya entri allowlist jalur manual.

## Safe bins (hanya stdin)

`tools.exec.safeBins` mendefinisikan daftar kecil binary **hanya-stdin** (misalnya `cut`)
yang dapat berjalan dalam mode allowlist **tanpa** entri allowlist eksplisit. Safe bins menolak
arg file posisional dan token mirip jalur, sehingga hanya dapat beroperasi pada stream masuk.
Perlakukan ini sebagai jalur cepat sempit untuk filter stream, bukan daftar kepercayaan umum.
**Jangan** tambahkan interpreter atau binary runtime (misalnya `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) ke `safeBins`.
Jika sebuah perintah secara desain dapat mengevaluasi kode, mengeksekusi subperintah, atau membaca file, lebih baik gunakan entri allowlist eksplisit dan tetap aktifkan prompt persetujuan.
Safe bins kustom harus mendefinisikan profil eksplisit di `tools.exec.safeBinProfiles.<bin>`.
Validasi bersifat deterministik hanya dari bentuk argv (tanpa pemeriksaan keberadaan filesystem host),
yang mencegah perilaku oracle keberadaan file dari perbedaan allow/deny.
Opsi berorientasi file ditolak untuk safe bins default (misalnya `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Safe bins juga menegakkan kebijakan flag eksplisit per-binary untuk opsi yang merusak
perilaku hanya-stdin (misalnya `sort -o/--output/--compress-program` dan flag rekursif grep).
Opsi panjang divalidasi fail-closed dalam mode safe-bin: flag yang tidak dikenal dan singkatan ambigu ditolak.
Flag yang ditolak oleh profil safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins juga memaksa token argv diperlakukan sebagai **teks literal** saat eksekusi (tanpa globbing
dan tanpa ekspansi `$VARS`) untuk segmen hanya-stdin, sehingga pattern seperti `*` atau `$HOME/...` tidak dapat
digunakan untuk menyelundupkan pembacaan file.
Safe bins juga harus di-resolve dari direktori binary tepercaya (default sistem plus opsional
`tools.exec.safeBinTrustedDirs`). Entri `PATH` tidak pernah otomatis dipercaya.
Direktori safe-bin tepercaya default sengaja sangat minimal: `/bin`, `/usr/bin`.
Jika executable safe-bin Anda berada di jalur package-manager/pengguna (misalnya
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), tambahkan secara eksplisit
ke `tools.exec.safeBinTrustedDirs`.
Rangkaian shell dan redirection tidak diizinkan otomatis dalam mode allowlist.

Rangkaian shell (`&&`, `||`, `;`) diizinkan ketika setiap segmen tingkat atas memenuhi allowlist
(termasuk safe bins atau auto-allow skill). Redirection tetap tidak didukung dalam mode allowlist.
Command substitution (`$()` / backticks) ditolak saat parsing allowlist, termasuk di dalam
tanda kutip ganda; gunakan tanda kutip tunggal jika Anda membutuhkan teks literal `$()`.
Pada persetujuan aplikasi pendamping macOS, teks shell mentah yang berisi sintaks kontrol atau ekspansi shell
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) diperlakukan sebagai allowlist miss kecuali
binary shell itu sendiri ada di allowlist.
Untuk shell wrapper (`bash|sh|zsh ... -c/-lc`), override env dengan cakupan permintaan direduksi menjadi
allowlist eksplisit kecil (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Untuk keputusan allow-always dalam mode allowlist, dispatch wrapper yang dikenal
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) menyimpan jalur executable bagian dalam alih-alih jalur wrapper. Shell multiplexer (`busybox`, `toybox`) juga di-unwrapped untuk applet shell (`sh`, `ash`,
dll.) sehingga executable bagian dalam disimpan alih-alih binary multiplexer. Jika sebuah wrapper atau
multiplexer tidak dapat di-unwrapped dengan aman, tidak ada entri allowlist yang disimpan otomatis.
Jika Anda menaruh interpreter seperti `python3` atau `node` di allowlist, lebih baik gunakan `tools.exec.strictInlineEval=true` agar inline eval tetap memerlukan persetujuan eksplisit. Dalam mode ketat, `allow-always` masih dapat menyimpan pemanggilan interpreter/script yang tidak berbahaya, tetapi carrier inline-eval tidak disimpan otomatis.

Safe bins default:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` dan `sort` tidak termasuk dalam daftar default. Jika Anda ikut mengaktifkannya, pertahankan entri allowlist eksplisit untuk
alur kerja non-stdin mereka.
Untuk `grep` dalam mode safe-bin, berikan pattern dengan `-e`/`--regexp`; bentuk pattern posisional
ditolak sehingga operand file tidak dapat diselundupkan sebagai positional yang ambigu.

### Safe bins versus allowlist

| Topik            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Tujuan           | Auto-allow filter stdin yang sempit                    | Percaya secara eksplisit pada executable tertentu            |
| Jenis kecocokan  | Nama executable + kebijakan argv safe-bin              | Glob pattern jalur executable yang di-resolve                |
| Cakupan argumen  | Dibatasi oleh profil safe-bin dan aturan token literal | Hanya kecocokan jalur; argumen selebihnya menjadi tanggung jawab Anda |
| Contoh umum      | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI kustom               |
| Penggunaan terbaik | Transformasi teks berisiko rendah dalam pipeline      | Tool apa pun dengan perilaku atau efek samping yang lebih luas |

Lokasi konfigurasi:

- `safeBins` berasal dari config (`tools.exec.safeBins` atau per-agen `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` berasal dari config (`tools.exec.safeBinTrustedDirs` atau per-agen `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` berasal dari config (`tools.exec.safeBinProfiles` atau per-agen `agents.list[].tools.exec.safeBinProfiles`). Key profil per-agen menimpa key global.
- entri allowlist berada di `~/.openclaw/exec-approvals.json` lokal host di bawah `agents.<id>.allowlist` (atau melalui Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` memperingatkan dengan `tools.exec.safe_bins_interpreter_unprofiled` ketika bin interpreter/runtime muncul di `safeBins` tanpa profil eksplisit.
- `openclaw doctor --fix` dapat membuat scaffold entri `safeBinProfiles.<bin>` kustom yang hilang sebagai `{}` (tinjau dan perketat setelahnya). Bin interpreter/runtime tidak dibuatkan scaffold otomatis.

Contoh profil kustom:
__OC_I18N_900004__
Jika Anda secara eksplisit memilih `jq` ke dalam `safeBins`, OpenClaw tetap menolak builtin `env` dalam mode safe-bin
sehingga `jq -n env` tidak dapat membuang environment proses host tanpa jalur allowlist eksplisit
atau prompt persetujuan.

## Pengeditan Control UI

Gunakan kartu **Control UI → Nodes → Exec approvals** untuk mengedit default, override
per agen, dan allowlist. Pilih cakupan (Defaults atau agen), ubah kebijakan,
tambah/hapus pattern allowlist, lalu **Save**. UI menampilkan metadata **terakhir digunakan**
per pattern sehingga Anda dapat menjaga daftar tetap rapi.

Pemilih target memilih **Gateway** (persetujuan lokal) atau **Node**. Node
harus mengiklankan `system.execApprovals.get/set` (aplikasi macOS atau host node headless).
Jika node belum mengiklankan persetujuan exec, edit
`~/.openclaw/exec-approvals.json` lokalnya secara langsung.

CLI: `openclaw approvals` mendukung pengeditan gateway atau node (lihat [CLI Persetujuan](/cli/approvals)).

## Alur persetujuan

Saat prompt diperlukan, gateway menyiarkan `exec.approval.requested` ke klien operator.
Control UI dan aplikasi macOS menyelesaikannya melalui `exec.approval.resolve`, lalu gateway meneruskan
permintaan yang disetujui ke host node.

Untuk `host=node`, permintaan persetujuan menyertakan payload `systemRunPlan` kanonis. Gateway menggunakan
rencana itu sebagai konteks perintah/cwd/sesi otoritatif saat meneruskan permintaan `system.run`
yang telah disetujui.

Ini penting untuk latensi persetujuan async:

- jalur node exec menyiapkan satu rencana kanonis di awal
- catatan persetujuan menyimpan rencana itu dan metadata pengikatannya
- setelah disetujui, panggilan `system.run` final yang diteruskan menggunakan kembali rencana yang disimpan
  alih-alih mempercayai edit pemanggil di kemudian hari
- jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau
  `sessionKey` setelah permintaan persetujuan dibuat, gateway menolak
  run yang diteruskan sebagai ketidakcocokan persetujuan

## Perintah interpreter/runtime

Run interpreter/runtime yang didukung persetujuan sengaja konservatif:

- Konteks argv/cwd/env yang tepat selalu diikat.
- Bentuk shell script langsung dan file runtime langsung diikat secara best-effort ke satu snapshot file lokal konkret.
- Bentuk wrapper package-manager umum yang tetap di-resolve ke satu file lokal langsung (misalnya
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) di-unwrapped sebelum pengikatan.
- Jika OpenClaw tidak dapat mengidentifikasi tepat satu file lokal konkret untuk perintah interpreter/runtime
  (misalnya package script, bentuk eval, rantai loader khusus runtime, atau bentuk multi-file yang ambigu), eksekusi berbasis persetujuan ditolak alih-alih mengklaim cakupan semantik yang tidak dimilikinya.
- Untuk alur kerja tersebut, lebih baik gunakan sandboxing, batas host terpisah, atau alur allowlist/full
  tepercaya yang eksplisit saat operator menerima semantik runtime yang lebih luas.

Saat persetujuan diperlukan, tool exec segera kembali dengan approval id. Gunakan id itu untuk
mengorelasikan event sistem berikutnya (`Exec finished` / `Exec denied`). Jika tidak ada keputusan sampai
timeout, permintaan diperlakukan sebagai approval timeout dan ditampilkan sebagai alasan penolakan.

### Perilaku pengiriman lanjutan

Setelah exec async yang disetujui selesai, OpenClaw mengirim turn `agent` lanjutan ke sesi yang sama.

- Jika target pengiriman eksternal yang valid ada (channel yang dapat dikirim plus target `to`), pengiriman lanjutan menggunakan channel itu.
- Dalam alur hanya-webchat atau sesi internal tanpa target eksternal, pengiriman lanjutan tetap hanya-sesi (`deliver: false`).
- Jika pemanggil secara eksplisit meminta pengiriman eksternal ketat tanpa channel eksternal yang dapat di-resolve, permintaan gagal dengan `INVALID_REQUEST`.
- Jika `bestEffortDeliver` diaktifkan dan tidak ada channel eksternal yang dapat di-resolve, pengiriman diturunkan menjadi hanya-sesi alih-alih gagal.

Dialog konfirmasi mencakup:

- perintah + argumen
- cwd
- id agen
- jalur executable yang di-resolve
- metadata host + kebijakan

Tindakan:

- **Allow once** → jalankan sekarang
- **Always allow** → tambahkan ke allowlist + jalankan
- **Deny** → blokir

## Penerusan persetujuan ke channel chat

Anda dapat meneruskan prompt persetujuan exec ke channel chat mana pun (termasuk channel plugin) dan menyetujuinya
dengan `/approve`. Ini menggunakan pipeline pengiriman outbound normal.

Konfigurasi:
__OC_I18N_900005__
Balas di chat:
__OC_I18N_900006__
Perintah `/approve` menangani persetujuan exec dan persetujuan plugin. Jika ID tidak cocok dengan persetujuan exec yang tertunda, perintah ini otomatis memeriksa persetujuan plugin sebagai gantinya.

### Penerusan persetujuan plugin

Penerusan persetujuan plugin menggunakan pipeline pengiriman yang sama seperti persetujuan exec tetapi memiliki
konfigurasinya sendiri yang independen di bawah `approvals.plugin`. Mengaktifkan atau menonaktifkan salah satunya tidak memengaruhi yang lain.
__OC_I18N_900007__
Bentuk konfigurasi identik dengan `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter`, dan `targets` berfungsi dengan cara yang sama.

Channel yang mendukung balasan interaktif bersama merender tombol persetujuan yang sama untuk persetujuan exec dan
plugin. Channel tanpa UI interaktif bersama akan fallback ke teks biasa dengan instruksi `/approve`.

### Persetujuan di chat yang sama pada channel apa pun

Ketika permintaan persetujuan exec atau plugin berasal dari permukaan chat yang dapat dikirim, chat yang sama
sekarang dapat menyetujuinya dengan `/approve` secara default. Ini berlaku untuk channel seperti Slack, Matrix, dan
Microsoft Teams selain alur Web UI dan terminal UI yang sudah ada.

Jalur perintah teks bersama ini menggunakan model auth channel normal untuk percakapan tersebut. Jika chat asal
sudah dapat mengirim perintah dan menerima balasan, permintaan persetujuan tidak lagi memerlukan
adapter pengiriman native terpisah hanya agar tetap tertunda.

Discord dan Telegram juga mendukung `/approve` di chat yang sama, tetapi channel tersebut masih menggunakan
daftar approver yang telah di-resolve untuk otorisasi bahkan saat pengiriman persetujuan native dinonaktifkan.

Untuk Telegram dan klien persetujuan native lain yang memanggil Gateway secara langsung,
fallback ini sengaja dibatasi pada kegagalan "approval not found". Penolakan/error
persetujuan exec yang nyata tidak diam-diam dicoba ulang sebagai persetujuan plugin.

### Pengiriman persetujuan native

Beberapa channel juga dapat bertindak sebagai klien persetujuan native. Klien native menambahkan DM approver, fanout origin-chat,
dan UX persetujuan interaktif khusus channel di atas alur `/approve` di chat yang sama yang dibagikan.

Ketika kartu/tombol persetujuan native tersedia, UI native itu adalah jalur utama
yang dihadapi agen. Agen tidak boleh juga menggemakan perintah plain chat `/approve`
duplikat kecuali hasil tool menyatakan persetujuan chat tidak tersedia atau persetujuan manual adalah satu-satunya jalur yang tersisa.

Model generik:

- kebijakan host exec tetap menentukan apakah persetujuan exec diperlukan
- `approvals.exec` mengontrol penerusan prompt persetujuan ke tujuan chat lain
- `channels.<channel>.execApprovals` mengontrol apakah channel itu bertindak sebagai klien persetujuan native

Klien persetujuan native secara otomatis mengaktifkan pengiriman DM-first ketika semua hal berikut benar:

- channel mendukung pengiriman persetujuan native
- approver dapat di-resolve dari `execApprovals.approvers` eksplisit atau sumber fallback terdokumentasi channel tersebut
- `channels.<channel>.execApprovals.enabled` tidak disetel atau `"auto"`

Setel `enabled: false` untuk menonaktifkan klien persetujuan native secara eksplisit. Setel `enabled: true` untuk memaksanya aktif
ketika approver berhasil di-resolve. Pengiriman origin-chat publik tetap eksplisit melalui
`channels.<channel>.execApprovals.target`.

FAQ: [Mengapa ada dua konfigurasi persetujuan exec untuk persetujuan chat?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Klien persetujuan native ini menambahkan routing DM dan fanout channel opsional di atas alur
`/approve` di chat yang sama dan tombol persetujuan bersama.

Perilaku bersama:

- Slack, Matrix, Microsoft Teams, dan chat lain yang dapat dikirim menggunakan model auth channel normal
  untuk `/approve` di chat yang sama
- ketika klien persetujuan native aktif otomatis, target pengiriman native default adalah DM approver
- untuk Discord dan Telegram, hanya approver yang telah di-resolve yang dapat menyetujui atau menolak
- approver Discord dapat eksplisit (`execApprovals.approvers`) atau diinferensikan dari `commands.ownerAllowFrom`
- approver Telegram dapat eksplisit (`execApprovals.approvers`) atau diinferensikan dari konfigurasi owner yang ada (`allowFrom`, ditambah `defaultTo` direct-message jika didukung)
- approver Slack dapat eksplisit (`execApprovals.approvers`) atau diinferensikan dari `commands.ownerAllowFrom`
- tombol native Slack mempertahankan jenis approval id, sehingga id `plugin:` dapat di-resolve ke persetujuan plugin
  tanpa lapisan fallback lokal Slack kedua
- routing DM/channel native Matrix hanya untuk exec; persetujuan plugin Matrix tetap berada pada
  jalur `/approve` di chat yang sama dan jalur penerusan `approvals.plugin` opsional
- peminta tidak harus menjadi approver
- chat asal dapat menyetujui langsung dengan `/approve` ketika chat tersebut sudah mendukung perintah dan balasan
- tombol persetujuan native Discord merutekan berdasarkan jenis approval id: id `plugin:` langsung menuju
  persetujuan plugin, semua yang lain menuju persetujuan exec
- tombol persetujuan native Telegram mengikuti fallback exec-ke-plugin terbatas yang sama seperti `/approve`
- ketika `target` native mengaktifkan pengiriman origin-chat, prompt persetujuan menyertakan teks perintah
- persetujuan exec yang tertunda kedaluwarsa setelah 30 menit secara default
- jika tidak ada UI operator atau klien persetujuan yang dikonfigurasi yang dapat menerima permintaan, prompt akan fallback ke `askFallback`

Telegram secara default menggunakan DM approver (`target: "dm"`). Anda dapat beralih ke `channel` atau `both` ketika
ingin prompt persetujuan muncul juga di chat/topik Telegram asal. Untuk topik forum Telegram, OpenClaw mempertahankan topik untuk prompt persetujuan dan follow-up setelah persetujuan.

Lihat:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Alur IPC macOS
__OC_I18N_900008__
Catatan keamanan:

- Mode Unix socket `0600`, token disimpan di `exec-approvals.json`.
- Pemeriksaan peer same-UID.
- Challenge/response (nonce + token HMAC + hash permintaan) + TTL singkat.

## Event sistem

Siklus hidup exec ditampilkan sebagai pesan sistem:

- `Exec running` (hanya jika perintah melebihi ambang pemberitahuan sedang berjalan)
- `Exec finished`
- `Exec denied`

Pesan-pesan ini dikirim ke sesi agen setelah node melaporkan event tersebut.
Persetujuan exec host-gateway mengirim event siklus hidup yang sama ketika perintah selesai (dan opsional saat berjalan lebih lama dari ambang batas).
Exec yang dijaga persetujuan menggunakan kembali approval id sebagai `runId` dalam pesan ini agar mudah dikorelasikan.

## Perilaku saat persetujuan ditolak

Ketika persetujuan exec async ditolak, OpenClaw mencegah agen menggunakan kembali
output dari run sebelumnya dari perintah yang sama dalam sesi. Alasan penolakan
diberikan dengan panduan eksplisit bahwa tidak ada output perintah yang tersedia, yang menghentikan
agen dari mengklaim ada output baru atau mengulangi perintah yang ditolak dengan
hasil lama dari run sukses sebelumnya.

## Implikasi

- **full** sangat kuat; lebih baik gunakan allowlist jika memungkinkan.
- **ask** membuat Anda tetap terlibat sambil tetap memungkinkan persetujuan cepat.
- Allowlist per agen mencegah persetujuan satu agen bocor ke agen lain.
- Persetujuan hanya berlaku untuk permintaan host exec dari **pengirim yang berwenang**. Pengirim yang tidak berwenang tidak dapat mengeluarkan `/exec`.
- `/exec security=full` adalah kemudahan tingkat sesi untuk operator berwenang dan secara desain melewati persetujuan.
  Untuk memblokir keras host exec, setel security persetujuan ke `deny` atau tolak tool `exec` melalui kebijakan tool.

Terkait:

- [Tool Exec](/tools/exec)
- [Mode elevated](/tools/elevated)
- [Skills](/tools/skills)

## Terkait

- [Exec](/tools/exec) — tool eksekusi perintah shell
- [Sandboxing](/id/gateway/sandboxing) — mode sandbox dan akses workspace
- [Security](/id/gateway/security) — model keamanan dan hardening
- [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) — kapan menggunakan masing-masing
