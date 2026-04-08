---
read_when:
    - Mengonfigurasi persetujuan exec atau allowlist
    - Mengimplementasikan UX persetujuan exec di aplikasi macOS
    - Meninjau prompt escape sandbox dan implikasinya
summary: Persetujuan exec, allowlist, dan prompt escape sandbox
title: Persetujuan Exec
x-i18n:
    generated_at: "2026-04-08T02:19:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6041929185bab051ad873cc4822288cb7d6f0470e19e7ae7a16b70f76dfc2cd9
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Persetujuan exec

Persetujuan exec adalah **guardrail aplikasi pendamping / host node** untuk memungkinkan agen yang disandbox menjalankan
perintah pada host nyata (`gateway` atau `node`). Anggap ini seperti interlock keselamatan:
perintah diizinkan hanya ketika kebijakan + allowlist + (opsional) persetujuan pengguna semuanya setuju.
Persetujuan exec adalah **tambahan** terhadap kebijakan tool dan gating elevated (kecuali elevated disetel ke `full`, yang melewati persetujuan).
Kebijakan efektif adalah yang **lebih ketat** dari default `tools.exec.*` dan approvals; jika field approvals dihilangkan, nilai `tools.exec` yang digunakan.
Host exec juga menggunakan status approvals lokal pada mesin tersebut. Nilai host-local
`ask: "always"` di `~/.openclaw/exec-approvals.json` akan terus memunculkan prompt meskipun
default sesi atau config meminta `ask: "on-miss"`.
Gunakan `openclaw approvals get`, `openclaw approvals get --gateway`, atau
`openclaw approvals get --node <id|name|ip>` untuk memeriksa kebijakan yang diminta,
sumber kebijakan host, dan hasil efektifnya.

Jika UI aplikasi pendamping **tidak tersedia**, setiap permintaan yang memerlukan prompt akan
diselesaikan oleh **fallback ask** (default: deny).

Klien persetujuan chat native juga dapat mengekspos affordance khusus channel pada
pesan persetujuan yang tertunda. Misalnya, Matrix dapat menanam shortcut reaction pada
prompt persetujuan (`✅` izinkan sekali, `❌` tolak, dan `♾️` selalu izinkan saat tersedia)
sambil tetap menyediakan perintah `/approve ...` di pesan sebagai fallback.

## Di mana ini berlaku

Persetujuan exec diberlakukan secara lokal pada host eksekusi:

- **host gateway** → proses `openclaw` pada mesin gateway
- **host node** → runner node (aplikasi pendamping macOS atau host node headless)

Catatan model kepercayaan:

- Pemanggil yang diautentikasi gateway adalah operator tepercaya untuk Gateway tersebut.
- Node yang dipasangkan memperluas kapabilitas operator tepercaya itu ke host node.
- Persetujuan exec mengurangi risiko eksekusi yang tidak disengaja, tetapi bukan batas autentikasi per pengguna.
- Eksekusi host node yang disetujui mengikat konteks eksekusi kanonis: cwd kanonis, argv yang persis, env
  binding ketika ada, dan path executable yang dipin bila berlaku.
- Untuk shell script dan invokasi file interpreter/runtime langsung, OpenClaw juga mencoba mengikat
  satu operand file lokal konkret. Jika file yang terikat itu berubah setelah persetujuan tetapi sebelum eksekusi,
  eksekusi ditolak alih-alih menjalankan konten yang sudah bergeser.
- File binding ini sengaja bersifat best-effort, bukan model semantik lengkap untuk setiap
  jalur loader interpreter/runtime. Jika mode persetujuan tidak dapat mengidentifikasi tepat satu
  file lokal konkret untuk diikat, mode ini menolak membuat eksekusi berbasis persetujuan alih-alih berpura-pura memberikan cakupan penuh.

Pemisahan macOS:

- **layanan host node** meneruskan `system.run` ke **aplikasi macOS** melalui IPC lokal.
- **aplikasi macOS** menegakkan persetujuan + mengeksekusi perintah dalam konteks UI.

## Pengaturan dan penyimpanan

Approvals berada dalam file JSON lokal pada host eksekusi:

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

- kebijakan exec yang diminta di config OpenClaw (`tools.exec.*`)
- kebijakan approvals lokal host di `~/.openclaw/exec-approvals.json`

Ini sekarang merupakan perilaku host default kecuali Anda mengencangkannya secara eksplisit:

- `tools.exec.security`: `full` pada `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Perbedaan penting:

- `tools.exec.host=auto` memilih lokasi eksekusi: sandbox jika tersedia, jika tidak gateway.
- YOLO memilih cara host exec disetujui: `security=full` plus `ask=off`.
- Dalam mode YOLO, OpenClaw tidak menambahkan gate persetujuan heuristik obfuscation perintah terpisah di atas kebijakan host exec yang dikonfigurasi.
- `auto` tidak menjadikan perutean gateway sebagai override gratis dari sesi yang disandbox. Permintaan `host=node` per panggilan diizinkan dari `auto`, dan `host=gateway` hanya diizinkan dari `auto` ketika tidak ada runtime sandbox yang aktif. Jika Anda ingin default non-auto yang stabil, setel `tools.exec.host` atau gunakan `/exec host=...` secara eksplisit.

Jika Anda ingin penyiapan yang lebih konservatif, kencangkan salah satu lapisan kembali ke `allowlist` / `on-miss`
atau `deny`.

Penyiapan host gateway persisten "jangan pernah prompt":

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

Shortcut khusus sesi:

- `/exec security=full ask=off` hanya mengubah sesi saat ini.
- `/elevated full` adalah shortcut break-glass yang juga melewati persetujuan exec untuk sesi tersebut.

Jika file approvals host tetap lebih ketat daripada config, kebijakan host yang lebih ketat tetap menang.

## Tombol kebijakan

### Security (`exec.security`)

- **deny**: blokir semua permintaan host exec.
- **allowlist**: izinkan hanya perintah yang ada di allowlist.
- **full**: izinkan semuanya (setara dengan elevated).

### Ask (`exec.ask`)

- **off**: jangan pernah memunculkan prompt.
- **on-miss**: munculkan prompt hanya ketika allowlist tidak cocok.
- **always**: munculkan prompt pada setiap perintah.
- kepercayaan tahan lama `allow-always` tidak menekan prompt ketika mode ask efektif adalah `always`

### Ask fallback (`askFallback`)

Jika prompt diperlukan tetapi tidak ada UI yang dapat dijangkau, fallback menentukan:

- **deny**: blokir.
- **allowlist**: izinkan hanya jika allowlist cocok.
- **full**: izinkan.

### Hardening eval interpreter inline (`tools.exec.strictInlineEval`)

Ketika `tools.exec.strictInlineEval=true`, OpenClaw memperlakukan bentuk eval kode inline sebagai hanya-bisa-dengan-persetujuan meskipun binary interpreter itu sendiri ada di allowlist.

Contoh:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Ini adalah pertahanan berlapis untuk loader interpreter yang tidak terpetakan dengan rapi ke satu operand file stabil. Dalam mode ketat:

- perintah-perintah ini tetap memerlukan persetujuan eksplisit;
- `allow-always` tidak otomatis mempertahankan entri allowlist baru untuk perintah tersebut.

## Allowlist (per agen)

Allowlist bersifat **per agen**. Jika ada beberapa agen, ganti agen yang sedang
Anda edit di aplikasi macOS. Pattern adalah **pencocokan glob case-insensitive**.
Pattern harus diselesaikan ke **path binary** (entri basename-only diabaikan).
Entri `agents.default` lama dimigrasikan ke `agents.main` saat dimuat.
Rantai shell seperti `echo ok && pwd` tetap memerlukan setiap segmen tingkat atas memenuhi aturan allowlist.

Contoh:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Setiap entri allowlist melacak:

- **id** UUID stabil yang digunakan untuk identitas UI (opsional)
- **last used** timestamp
- **last used command**
- **last resolved path**

## Auto-allow Skills CLI

Ketika **Auto-allow Skills CLI** diaktifkan, executable yang dirujuk oleh Skills yang dikenal
diperlakukan seolah ada di allowlist pada node (node macOS atau host node headless). Fitur ini menggunakan
`skills.bins` melalui Gateway RPC untuk mengambil daftar bin skill. Nonaktifkan ini jika Anda ingin allowlist manual yang ketat.

Catatan kepercayaan penting:

- Ini adalah **allowlist kemudahan implisit**, terpisah dari entri allowlist path manual.
- Fitur ini ditujukan untuk lingkungan operator tepercaya di mana Gateway dan node berada dalam batas kepercayaan yang sama.
- Jika Anda memerlukan kepercayaan eksplisit yang ketat, biarkan `autoAllowSkills: false` dan gunakan hanya entri allowlist path manual.

## Safe bins (stdin-only)

`tools.exec.safeBins` mendefinisikan daftar kecil binary **stdin-only** (misalnya `cut`)
yang dapat berjalan dalam mode allowlist **tanpa** entri allowlist eksplisit. Safe bins menolak
arg file positional dan token mirip path, sehingga hanya dapat beroperasi pada stream masuk.
Perlakukan ini sebagai jalur cepat sempit untuk filter stream, bukan daftar kepercayaan umum.
**Jangan** tambahkan binary interpreter atau runtime (misalnya `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) ke `safeBins`.
Jika suatu perintah dapat mengevaluasi kode, menjalankan subperintah, atau membaca file secara desain, gunakan entri allowlist eksplisit dan biarkan prompt persetujuan tetap aktif.
Safe bin kustom harus mendefinisikan profil eksplisit di `tools.exec.safeBinProfiles.<bin>`.
Validasi bersifat deterministik hanya dari bentuk argv (tanpa pemeriksaan keberadaan filesystem host), yang
mencegah perilaku oracle keberadaan file dari perbedaan allow/deny.
Opsi berorientasi file ditolak untuk safe bin default (misalnya `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Safe bins juga menegakkan kebijakan flag per-binary yang eksplisit untuk opsi yang merusak perilaku stdin-only
(misalnya `sort -o/--output/--compress-program` dan flag rekursif grep).
Opsi panjang divalidasi fail-closed dalam mode safe-bin: flag yang tidak dikenal dan singkatan
ambigu ditolak.
Flag yang ditolak oleh profil safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins juga memaksa token argv diperlakukan sebagai **teks literal** pada waktu eksekusi (tanpa globbing
dan tanpa ekspansi `$VARS`) untuk segmen stdin-only, sehingga pola seperti `*` atau `$HOME/...` tidak dapat
digunakan untuk menyelundupkan pembacaan file.
Safe bins juga harus diselesaikan dari direktori binary tepercaya (default sistem plus opsi
`tools.exec.safeBinTrustedDirs`). Entri `PATH` tidak pernah otomatis dipercaya.
Direktori safe-bin tepercaya default sengaja dibuat minimal: `/bin`, `/usr/bin`.
Jika executable safe-bin Anda berada di path package-manager/pengguna (misalnya
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), tambahkan secara eksplisit
ke `tools.exec.safeBinTrustedDirs`.
Rantai shell dan redirection tidak otomatis diizinkan dalam mode allowlist.

Rantai shell (`&&`, `||`, `;`) diizinkan ketika setiap segmen tingkat atas memenuhi allowlist
(termasuk safe bins atau auto-allow skill). Redirection tetap tidak didukung dalam mode allowlist.
Substitusi perintah (`$()` / backticks) ditolak selama parsing allowlist, termasuk di dalam
tanda kutip ganda; gunakan tanda kutip tunggal jika Anda memerlukan teks `$()` literal.
Pada approvals aplikasi pendamping macOS, teks shell mentah yang berisi sintaks kontrol atau ekspansi shell
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) diperlakukan sebagai allowlist miss kecuali
binary shell itu sendiri ada di allowlist.
Untuk wrapper shell (`bash|sh|zsh ... -c/-lc`), override env dengan cakupan permintaan dikurangi menjadi
allowlist kecil yang eksplisit (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Untuk keputusan allow-always dalam mode allowlist, wrapper dispatch yang dikenal
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) mempertahankan path executable bagian dalam alih-alih
path wrapper. Multiplexer shell (`busybox`, `toybox`) juga dibuka untuk applet shell (`sh`, `ash`,
dll.) sehingga executable bagian dalam dipertahankan alih-alih binary multiplexer. Jika wrapper atau
multiplexer tidak dapat dibuka dengan aman, tidak ada entri allowlist yang dipertahankan secara otomatis.
Jika Anda memasukkan interpreter seperti `python3` atau `node` ke allowlist, gunakan `tools.exec.strictInlineEval=true` agar eval inline tetap memerlukan persetujuan eksplisit. Dalam mode ketat, `allow-always` tetap dapat mempertahankan invokasi interpreter/script yang aman, tetapi carrier inline-eval tidak dipertahankan secara otomatis.

Safe bin default:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` dan `sort` tidak ada dalam daftar default. Jika Anda memilih ikut serta, pertahankan entri allowlist eksplisit untuk
alur non-stdin keduanya.
Untuk `grep` dalam mode safe-bin, berikan pola dengan `-e`/`--regexp`; bentuk pola positional
ditolak agar operand file tidak dapat diselundupkan sebagai positional yang ambigu.

### Safe bins versus allowlist

| Topik            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Tujuan           | Auto-allow filter stdin sempit                         | Secara eksplisit mempercayai executable tertentu             |
| Jenis pencocokan | Nama executable + kebijakan argv safe-bin              | Pola glob path executable yang diselesaikan                  |
| Cakupan argumen  | Dibatasi oleh profil safe-bin dan aturan token literal | Hanya pencocokan path; argumen selain itu menjadi tanggung jawab Anda |
| Contoh umum      | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI kustom               |
| Penggunaan terbaik | Transformasi teks berisiko rendah dalam pipeline    | Tool apa pun dengan perilaku atau efek samping yang lebih luas |

Lokasi konfigurasi:

- `safeBins` berasal dari config (`tools.exec.safeBins` atau per-agen `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` berasal dari config (`tools.exec.safeBinTrustedDirs` atau per-agen `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` berasal dari config (`tools.exec.safeBinProfiles` atau per-agen `agents.list[].tools.exec.safeBinProfiles`). Key per-agen menimpa key global.
- entri allowlist berada di `~/.openclaw/exec-approvals.json` lokal host di bawah `agents.<id>.allowlist` (atau melalui Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` memperingatkan dengan `tools.exec.safe_bins_interpreter_unprofiled` ketika bin interpreter/runtime muncul di `safeBins` tanpa profil eksplisit.
- `openclaw doctor --fix` dapat membuat scaffold entri `safeBinProfiles.<bin>` kustom yang hilang sebagai `{}` (tinjau dan kencangkan setelahnya). Bin interpreter/runtime tidak dibuat scaffold secara otomatis.

Contoh profil kustom:
__OC_I18N_900004__
Jika Anda secara eksplisit memasukkan `jq` ke `safeBins`, OpenClaw tetap menolak builtin `env` dalam mode safe-bin
agar `jq -n env` tidak dapat membuang environment proses host tanpa path allowlist eksplisit
atau prompt persetujuan.

## Pengeditan Control UI

Gunakan kartu **Control UI → Nodes → Exec approvals** untuk mengedit default, override per agen,
dan allowlist. Pilih scope (Defaults atau agen), ubah kebijakan,
tambahkan/hapus pattern allowlist, lalu **Save**. UI menampilkan metadata **last used**
per pattern agar daftar tetap rapi.

Pemilih target memilih **Gateway** (approvals lokal) atau **Node**. Node
harus mengiklankan `system.execApprovals.get/set` (aplikasi macOS atau host node headless).
Jika suatu node belum mengiklankan exec approvals, edit
`~/.openclaw/exec-approvals.json` lokalnya secara langsung.

CLI: `openclaw approvals` mendukung pengeditan gateway atau node (lihat [Approvals CLI](/cli/approvals)).

## Alur persetujuan

Ketika prompt diperlukan, gateway menyiarkan `exec.approval.requested` ke klien operator.
Control UI dan aplikasi macOS menyelesaikannya melalui `exec.approval.resolve`, lalu gateway meneruskan
permintaan yang disetujui ke host node.

Untuk `host=node`, permintaan persetujuan menyertakan payload `systemRunPlan` kanonis. Gateway menggunakan
rencana itu sebagai konteks otoritatif untuk perintah/cwd/sesi saat meneruskan permintaan `system.run`
yang disetujui.

Ini penting untuk latensi persetujuan async:

- jalur exec node menyiapkan satu rencana kanonis di awal
- catatan persetujuan menyimpan rencana itu dan metadata binding-nya
- setelah disetujui, panggilan `system.run` akhir yang diteruskan menggunakan kembali rencana yang disimpan
  alih-alih mempercayai edit pemanggil yang datang belakangan
- jika pemanggil mengubah `command`, `rawCommand`, `cwd`, `agentId`, atau
  `sessionKey` setelah permintaan persetujuan dibuat, gateway menolak
  eksekusi yang diteruskan sebagai ketidakcocokan persetujuan

## Perintah interpreter/runtime

Eksekusi interpreter/runtime berbasis persetujuan sengaja bersifat konservatif:

- Konteks argv/cwd/env yang persis selalu diikat.
- Bentuk shell script langsung dan file runtime langsung diikat secara best-effort ke satu snapshot file lokal konkret.
- Bentuk wrapper package-manager umum yang tetap diselesaikan ke satu file lokal langsung (misalnya
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) dibuka sebelum binding.
- Jika OpenClaw tidak dapat mengidentifikasi tepat satu file lokal konkret untuk perintah interpreter/runtime
  (misalnya package script, bentuk eval, rantai loader khusus runtime, atau bentuk multi-file ambigu),
  eksekusi berbasis persetujuan ditolak alih-alih mengklaim cakupan semantik yang sebenarnya tidak ada.
- Untuk alur kerja tersebut, gunakan sandboxing, batas host terpisah, atau alur trusted
  allowlist/full eksplisit di mana operator menerima semantik runtime yang lebih luas.

Ketika persetujuan diperlukan, tool exec segera mengembalikan approval id. Gunakan id itu untuk
mengaitkan event sistem berikutnya (`Exec finished` / `Exec denied`). Jika tidak ada keputusan yang datang sebelum
timeout, permintaan diperlakukan sebagai approval timeout dan ditampilkan sebagai alasan penolakan.

### Perilaku pengiriman tindak lanjut

Setelah exec async yang disetujui selesai, OpenClaw mengirim giliran `agent` tindak lanjut ke sesi yang sama.

- Jika ada target pengiriman eksternal yang valid (channel yang dapat dikirim plus target `to`), pengiriman tindak lanjut menggunakan channel itu.
- Dalam alur khusus webchat atau sesi internal tanpa target eksternal, pengiriman tindak lanjut tetap hanya sesi (`deliver: false`).
- Jika pemanggil secara eksplisit meminta pengiriman eksternal ketat tanpa channel eksternal yang dapat diselesaikan, permintaan gagal dengan `INVALID_REQUEST`.
- Jika `bestEffortDeliver` diaktifkan dan tidak ada channel eksternal yang dapat diselesaikan, pengiriman diturunkan menjadi hanya sesi alih-alih gagal.

Dialog konfirmasi mencakup:

- perintah + argumen
- cwd
- ID agen
- path executable yang diselesaikan
- host + metadata kebijakan

Aksi:

- **Allow once** → jalankan sekarang
- **Always allow** → tambahkan ke allowlist + jalankan
- **Deny** → blokir

## Penerusan persetujuan ke chat channel

Anda dapat meneruskan prompt persetujuan exec ke chat channel mana pun (termasuk plugin channel) dan menyetujuinya
dengan `/approve`. Ini menggunakan pipeline pengiriman keluar normal.

Config:
__OC_I18N_900005__
Balas di chat:
__OC_I18N_900006__
Perintah `/approve` menangani persetujuan exec dan persetujuan plugin. Jika ID tidak cocok dengan persetujuan exec yang tertunda, perintah ini otomatis memeriksa persetujuan plugin sebagai gantinya.

### Penerusan persetujuan plugin

Penerusan persetujuan plugin menggunakan pipeline pengiriman yang sama seperti persetujuan exec tetapi memiliki
config independen sendiri di bawah `approvals.plugin`. Mengaktifkan atau menonaktifkan salah satunya tidak memengaruhi yang lain.
__OC_I18N_900007__
Bentuk config identik dengan `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter`, dan `targets` bekerja dengan cara yang sama.

Channel yang mendukung balasan interaktif bersama merender tombol persetujuan yang sama untuk persetujuan exec dan
plugin. Channel tanpa UI interaktif bersama akan fallback ke teks biasa dengan instruksi `/approve`.

### Persetujuan di chat yang sama pada channel mana pun

Ketika permintaan persetujuan exec atau plugin berasal dari permukaan chat yang dapat dikirim, chat yang sama
kini dapat menyetujuinya dengan `/approve` secara default. Ini berlaku untuk channel seperti Slack, Matrix, dan
Microsoft Teams selain alur Web UI dan UI terminal yang sudah ada.

Jalur perintah teks bersama ini menggunakan model auth channel normal untuk percakapan tersebut. Jika
chat asal sudah dapat mengirim perintah dan menerima balasan, permintaan persetujuan tidak lagi memerlukan
adapter pengiriman native terpisah hanya agar dapat tetap tertunda.

Discord dan Telegram juga mendukung `/approve` di chat yang sama, tetapi channel tersebut tetap menggunakan
daftar approver yang telah diselesaikan untuk otorisasi meskipun pengiriman persetujuan native dinonaktifkan.

Untuk Telegram dan klien persetujuan native lain yang memanggil Gateway secara langsung,
fallback ini sengaja dibatasi pada kegagalan "approval not found". Penolakan/error
persetujuan exec yang nyata tidak diam-diam dicoba ulang sebagai persetujuan plugin.

### Pengiriman persetujuan native

Beberapa channel juga dapat bertindak sebagai klien persetujuan native. Klien native menambahkan DM approver, fanout chat asal,
dan UX persetujuan interaktif khusus channel di atas alur `/approve` chat-sama bersama.

Ketika kartu/tombol persetujuan native tersedia, UI native tersebut menjadi jalur
utama yang dihadapi agen. Agen tidak seharusnya juga menggemakan perintah chat biasa
`/approve` duplikat kecuali hasil tool menyatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur yang tersisa.

Model generik:

- kebijakan host exec tetap memutuskan apakah persetujuan exec diperlukan
- `approvals.exec` mengontrol penerusan prompt persetujuan ke tujuan chat lain
- `channels.<channel>.execApprovals` mengontrol apakah channel tersebut bertindak sebagai klien persetujuan native

Klien persetujuan native secara otomatis mengaktifkan pengiriman DM-first ketika semua kondisi berikut terpenuhi:

- channel mendukung pengiriman persetujuan native
- approver dapat diselesaikan dari `execApprovals.approvers` eksplisit atau sumber fallback terdokumentasi
  milik channel tersebut
- `channels.<channel>.execApprovals.enabled` tidak disetel atau bernilai `"auto"`

Setel `enabled: false` untuk menonaktifkan klien persetujuan native secara eksplisit. Setel `enabled: true` untuk memaksanya
aktif ketika approver dapat diselesaikan. Pengiriman chat asal publik tetap eksplisit melalui
`channels.<channel>.execApprovals.target`.

FAQ: [Mengapa ada dua config persetujuan exec untuk persetujuan chat?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Klien persetujuan native ini menambahkan perutean DM dan fanout channel opsional di atas alur
`/approve` chat-sama bersama dan tombol persetujuan bersama.

Perilaku bersama:

- Slack, Matrix, Microsoft Teams, dan chat serupa yang dapat dikirim menggunakan model auth channel normal
  untuk `/approve` chat-sama
- ketika klien persetujuan native aktif otomatis, target pengiriman native default adalah DM approver
- untuk Discord dan Telegram, hanya approver yang telah diselesaikan yang dapat menyetujui atau menolak
- approver Discord dapat eksplisit (`execApprovals.approvers`) atau disimpulkan dari `commands.ownerAllowFrom`
- approver Telegram dapat eksplisit (`execApprovals.approvers`) atau disimpulkan dari config owner yang ada (`allowFrom`, plus `defaultTo` direct-message bila didukung)
- approver Slack dapat eksplisit (`execApprovals.approvers`) atau disimpulkan dari `commands.ownerAllowFrom`
- tombol native Slack mempertahankan jenis approval id, sehingga ID `plugin:` dapat menyelesaikan persetujuan plugin
  tanpa lapisan fallback lokal Slack kedua
- perutean DM/channel native Matrix dan shortcut reaction menangani persetujuan exec dan plugin;
  otorisasi plugin tetap berasal dari `channels.matrix.dm.allowFrom`
- peminta tidak harus menjadi approver
- chat asal dapat menyetujui secara langsung dengan `/approve` ketika chat tersebut sudah mendukung perintah dan balasan
- tombol persetujuan native Discord merutekan berdasarkan jenis approval id: ID `plugin:` langsung menuju
  persetujuan plugin, selebihnya menuju persetujuan exec
- tombol persetujuan native Telegram mengikuti fallback exec-ke-plugin terbatas yang sama seperti `/approve`
- ketika `target` native mengaktifkan pengiriman chat asal, prompt persetujuan menyertakan teks perintah
- persetujuan exec tertunda kedaluwarsa setelah 30 menit secara default
- jika tidak ada UI operator atau klien persetujuan yang dikonfigurasi yang dapat menerima permintaan, prompt akan fallback ke `askFallback`

Telegram default-nya ke DM approver (`target: "dm"`). Anda dapat beralih ke `channel` atau `both` ketika Anda
ingin prompt persetujuan muncul di chat/topik Telegram asal juga. Untuk topik forum Telegram, OpenClaw mempertahankan topik untuk prompt persetujuan dan tindak lanjut pasca-persetujuan.

Lihat:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Alur IPC macOS
__OC_I18N_900008__
Catatan keamanan:

- Mode Unix socket `0600`, token disimpan di `exec-approvals.json`.
- Pemeriksaan peer dengan UID yang sama.
- Challenge/response (nonce + token HMAC + hash permintaan) + TTL pendek.

## Event sistem

Siklus hidup exec ditampilkan sebagai pesan sistem:

- `Exec running` (hanya jika perintah melewati ambang pemberitahuan running)
- `Exec finished`
- `Exec denied`

Pesan ini diposting ke sesi agen setelah node melaporkan event tersebut.
Persetujuan exec host gateway memunculkan event siklus hidup yang sama ketika perintah selesai (dan opsional ketika berjalan lebih lama dari ambang).
Exec yang digating persetujuan menggunakan kembali approval id sebagai `runId` dalam pesan ini untuk korelasi yang mudah.

## Perilaku persetujuan yang ditolak

Ketika persetujuan exec async ditolak, OpenClaw mencegah agen menggunakan kembali
output dari eksekusi sebelumnya untuk perintah yang sama di dalam sesi. Alasan penolakan
diteruskan dengan panduan eksplisit bahwa tidak ada output perintah yang tersedia, yang menghentikan
agen dari mengklaim ada output baru atau mengulangi perintah yang ditolak dengan hasil basi dari eksekusi berhasil sebelumnya.

## Implikasi

- **full** sangat kuat; gunakan allowlist bila memungkinkan.
- **ask** membuat Anda tetap terlibat sambil tetap memungkinkan persetujuan cepat.
- Allowlist per agen mencegah persetujuan satu agen bocor ke agen lain.
- Persetujuan hanya berlaku untuk permintaan host exec dari **pengirim yang diautentikasi**. Pengirim yang tidak diautentikasi tidak dapat mengeluarkan `/exec`.
- `/exec security=full` adalah kemudahan tingkat sesi untuk operator yang diautentikasi dan secara desain melewati persetujuan.
  Untuk memblokir penuh host exec, setel security approvals ke `deny` atau tolak tool `exec` melalui kebijakan tool.

Terkait:

- [Tool exec](/id/tools/exec)
- [Mode elevated](/id/tools/elevated)
- [Skills](/id/tools/skills)

## Terkait

- [Exec](/id/tools/exec) — tool eksekusi perintah shell
- [Sandboxing](/id/gateway/sandboxing) — mode sandbox dan akses workspace
- [Security](/id/gateway/security) — model keamanan dan hardening
- [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) — kapan menggunakan masing-masing
