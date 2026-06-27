---
read_when:
    - OpenClaw tidak berfungsi dan Anda membutuhkan cara tercepat untuk memperbaikinya
    - Anda menginginkan alur triase sebelum masuk ke runbook mendalam
summary: Pusat pemecahan masalah berbasis gejala untuk OpenClaw
title: Pemecahan masalah umum
x-i18n:
    generated_at: "2026-06-27T17:36:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae1236c73e3a5c9237bd81d603e8dca18c595a8bcbb71f5931bfbf2389b342cd
    source_path: help/troubleshooting.md
    workflow: 16
---

Jika Anda hanya punya 2 menit, gunakan halaman ini sebagai pintu awal triase.

## 60 detik pertama

Jalankan urutan persis ini sesuai urutan:

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw gateway status
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

Output yang baik dalam satu baris:

- `openclaw status` → menampilkan channel yang dikonfigurasi dan tidak ada error auth yang jelas.
- `openclaw status --all` → laporan lengkap tersedia dan dapat dibagikan.
- `openclaw gateway probe` → target gateway yang diharapkan dapat dijangkau (`Reachable: yes`). `Capability: ...` memberi tahu level auth yang dapat dibuktikan oleh probe, dan `Read probe: limited - missing scope: operator.read` adalah diagnostik yang terdegradasi, bukan kegagalan koneksi.
- `openclaw gateway status` → `Runtime: running`, `Connectivity probe: ok`, dan baris `Capability: ...` yang masuk akal. Gunakan `--require-rpc` jika Anda juga memerlukan bukti RPC dengan cakupan baca.
- `openclaw doctor` → tidak ada error konfigurasi/layanan yang memblokir.
- `openclaw channels status --probe` → gateway yang dapat dijangkau mengembalikan status transport per akun
  secara langsung plus hasil probe/audit seperti `works` atau `audit ok`; jika
  gateway tidak dapat dijangkau, perintah beralih ke ringkasan hanya-konfigurasi.
- `openclaw logs --follow` → aktivitas stabil, tidak ada error fatal yang berulang.

## Asisten terasa terbatas atau kehilangan tools

Jika asisten tidak dapat memeriksa file, menjalankan perintah, menggunakan otomasi browser, atau
melihat tools yang diharapkan, periksa profil tool efektif terlebih dahulu:

```bash
openclaw status
openclaw status --all
openclaw doctor
```

Penyebab umum:

- `tools.profile: "messaging"` sengaja dibuat sempit untuk agen khusus chat.
- `tools.profile: "coding"` adalah profil biasa untuk alur kerja repositori, file, shell,
  dan runtime.
- `tools.profile: "full"` mengekspos set tool paling luas dan sebaiknya dibatasi
  untuk agen tepercaya yang dikendalikan operator.
- Override per agen `agents.list[].tools` dapat mempersempit atau memperluas profil
  root untuk satu agen.

Ubah profil tool root atau per agen, lalu mulai ulang atau muat ulang Gateway
dan jalankan `openclaw status --all` lagi. Lihat [Tools](/id/tools) untuk model
profil dan override allow/deny.

## Konteks panjang Anthropic 429

Jika Anda melihat:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`,
buka [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/id/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Backend lokal yang kompatibel dengan OpenAI berjalan langsung tetapi gagal di OpenClaw

Jika backend lokal atau self-hosted `/v1` Anda menjawab probe langsung kecil
`/v1/chat/completions` tetapi gagal pada `openclaw infer model run` atau giliran
agen normal:

1. Jika error menyebut `messages[].content` mengharapkan string, setel
   `models.providers.<provider>.models[].compat.requiresStringContent: true`.
2. Jika backend masih gagal hanya pada giliran agen OpenClaw, setel
   `models.providers.<provider>.models[].compat.supportsTools: false` dan coba lagi.
3. Jika panggilan langsung kecil masih berjalan tetapi prompt OpenClaw yang lebih besar membuat
   backend crash, perlakukan masalah yang tersisa sebagai batasan model/server upstream dan
   lanjutkan ke runbook mendalam:
   [/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail](/id/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)

## Instalasi Plugin gagal dengan ekstensi openclaw yang hilang

Jika instalasi gagal dengan `package.json missing openclaw.extensions`, paket plugin
menggunakan bentuk lama yang tidak lagi diterima OpenClaw.

Perbaiki di paket plugin:

1. Tambahkan `openclaw.extensions` ke `package.json`.
2. Arahkan entri ke file runtime hasil build (biasanya `./dist/index.js`).
3. Publikasikan ulang plugin dan jalankan `openclaw plugins install <package>` lagi.

Contoh:

```json
{
  "name": "@openclaw/my-plugin",
  "version": "1.2.3",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Referensi: [Arsitektur Plugin](/id/plugins/architecture)

## Kebijakan instalasi memblokir instalasi atau pembaruan plugin

Jika pembaruan selesai tetapi plugin usang, dinonaktifkan, atau menampilkan pesan seperti
`blocked by install policy`, `install policy failed closed`, atau
`Disabled "<plugin>" after plugin update failure`, periksa
`security.installPolicy`.

Kebijakan instalasi berjalan pada instalasi dan pembaruan plugin. Versi plugin
milik OpenClaw biasanya bergerak bersama rilis OpenClaw, sehingga pembaruan OpenClaw
juga dapat memerlukan pembaruan plugin `@openclaw/*` yang sesuai selama sinkronisasi pascapembaruan.

Hindari bentuk kebijakan luas ini kecuali Anda juga memelihara aturan upgrade
yang sesuai:

- Membekukan plugin milik OpenClaw ke satu versi lama yang persis, seperti mengizinkan
  hanya `@openclaw/*@2026.5.3`.
- Memblokir hanya berdasarkan jenis sumber, seperti setiap permintaan plugin npm, network, atau
  `request.mode: "update"`.
- Memperlakukan perintah kebijakan sebagai opsional. Saat `security.installPolicy`
  diaktifkan, executable kebijakan yang hilang, lambat, tidak dapat dibaca, atau terblokir izin
  gagal tertutup.
- Menyetujui versi plugin tanpa mempertimbangkan
  `openclawVersion` dari permintaan kebijakan dan metadata kandidat plugin.

Aturan kebijakan yang lebih aman mengizinkan pembaruan plugin milik OpenClaw yang tepercaya saat
kandidat kompatibel dengan host OpenClaw saat ini, alih-alih mematok satu
rilis selamanya. Jika Anda memblokir npm secara default, buat pengecualian sempit
untuk paket plugin `@openclaw/*` tepercaya atau id plugin yang Anda gunakan. Jika Anda
membedakan permintaan instalasi dan pembaruan, terapkan aturan kepercayaan yang sama ke
`request.mode: "update"`.

Pemulihan:

```bash
openclaw doctor --deep
openclaw plugins update --all
openclaw status --all
```

Jika kebijakan sengaja ketat, longgarkan untuk jendela upgrade OpenClaw
tepercaya, jalankan ulang `openclaw plugins update --all`, lalu pulihkan aturan yang lebih ketat.
Jika plugin dinonaktifkan setelah kegagalan pembaruan, periksa dan aktifkan ulang hanya
setelah pembaruan berhasil:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
openclaw plugins enable <plugin-id>
```

Referensi: [Kebijakan instalasi operator](/id/tools/skills-config#operator-install-policy-securityinstallpolicy)

## Plugin ada tetapi diblokir karena kepemilikan mencurigakan

Jika `openclaw doctor`, penyiapan, atau peringatan startup menampilkan:

```text
blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)
plugin present but blocked
```

file plugin dimiliki oleh pengguna Unix yang berbeda dari proses yang memuat
file tersebut. Jangan hapus konfigurasi plugin. Perbaiki kepemilikan file atau jalankan OpenClaw sebagai
pengguna yang sama dengan pemilik direktori state.

Instalasi Docker biasanya berjalan sebagai `node` (uid `1000`). Untuk penyiapan Docker
default, perbaiki bind mount host:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
openclaw doctor --fix
```

Jika Anda sengaja menjalankan OpenClaw sebagai root, perbaiki root plugin terkelola agar
dimiliki root sebagai gantinya:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
openclaw doctor --fix
```

Dokumentasi lebih mendalam:

- [Kepemilikan path Plugin](/id/tools/plugin#blocked-plugin-path-ownership)
- [Izin Docker](/id/install/docker#permissions-and-eacces)

## Pohon keputusan

```mermaid
flowchart TD
  A[OpenClaw is not working] --> B{What breaks first}
  B --> C[No replies]
  B --> D[Dashboard or Control UI will not connect]
  B --> E[Gateway will not start or service not running]
  B --> F[Channel connects but messages do not flow]
  B --> G[Cron or heartbeat did not fire or did not deliver]
  B --> H[Node is paired but camera canvas screen exec fails]
  B --> I[Browser tool fails]

  C --> C1[/No replies section/]
  D --> D1[/Control UI section/]
  E --> E1[/Gateway section/]
  F --> F1[/Channel flow section/]
  G --> G1[/Automation section/]
  H --> H1[/Node tools section/]
  I --> I1[/Browser section/]
```

<AccordionGroup>
  <Accordion title="Tidak ada balasan">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw channels status --probe
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    ```

    Output yang baik terlihat seperti:

    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable`, atau `admin-capable`
    - Channel Anda menampilkan transport terhubung dan, jika didukung, `works` atau `audit ok` di `channels status --probe`
    - Pengirim tampak disetujui (atau kebijakan DM terbuka/allowlist)

    Tanda log umum:

    - `drop guild message (mention required` → gating mention memblokir pesan di Discord.
    - `pairing request` → pengirim belum disetujui dan menunggu persetujuan pairing DM.
    - `blocked` / `allowlist` di log channel → pengirim, room, atau group difilter.

    Halaman mendalam:

    - [/gateway/troubleshooting#no-replies](/id/gateway/troubleshooting#no-replies)
    - [/channels/troubleshooting](/id/channels/troubleshooting)
    - [/channels/pairing](/id/channels/pairing)

  </Accordion>

  <Accordion title="Dashboard atau Control UI tidak dapat terhubung">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Output yang baik terlihat seperti:

    - `Dashboard: http://...` ditampilkan di `openclaw gateway status`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable`, atau `admin-capable`
    - Tidak ada loop auth di log

    Tanda log umum:

    - `device identity required` → konteks HTTP/tidak aman tidak dapat menyelesaikan auth perangkat.
    - `origin not allowed` → `Origin` browser tidak diizinkan untuk target gateway
      Control UI.
    - `AUTH_TOKEN_MISMATCH` dengan petunjuk coba lagi (`canRetryWithDeviceToken=true`) → satu percobaan ulang token perangkat tepercaya dapat terjadi secara otomatis.
    - Percobaan ulang cached-token itu menggunakan kembali set cakupan cache yang disimpan dengan token perangkat
      yang dipasangkan. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit tetap mempertahankan
      set cakupan yang diminta.
    - Pada jalur Control UI Tailscale Serve async, percobaan gagal untuk
      `{scope, ip}` yang sama diserialkan sebelum limiter mencatat kegagalan, sehingga
      percobaan ulang buruk kedua yang bersamaan sudah dapat menampilkan `retry later`.
    - `too many failed authentication attempts (retry later)` dari origin browser localhost
      → kegagalan berulang dari `Origin` yang sama dikunci sementara; origin localhost lain menggunakan bucket terpisah.
    - `unauthorized` berulang setelah percobaan ulang itu → token/password salah, mode auth tidak cocok, atau token perangkat yang dipasangkan sudah usang.
    - `gateway connect failed:` → UI menargetkan URL/port yang salah atau gateway tidak dapat dijangkau.

    Halaman mendalam:

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/id/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/id/web/control-ui)
    - [/gateway/authentication](/id/gateway/authentication)

  </Accordion>

  <Accordion title="Gateway tidak dapat dimulai atau layanan terpasang tetapi tidak berjalan">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Output yang baik terlihat seperti:

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable`, atau `admin-capable`

    Tanda log umum:

    - `Gateway start blocked: set gateway.mode=local` atau `existing config is missing gateway.mode` → mode gateway adalah remote, atau file konfigurasi kehilangan cap mode lokal dan harus diperbaiki.
    - `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur auth gateway yang valid (token/password, atau trusted-proxy jika dikonfigurasi).
    - `another gateway instance is already listening` atau `EADDRINUSE` → port sudah digunakan.

    Halaman mendalam:

    - [/gateway/troubleshooting#gateway-service-not-running](/id/gateway/troubleshooting#gateway-service-not-running)
    - [/gateway/background-process](/id/gateway/background-process)
    - [/gateway/configuration](/id/gateway/configuration)

  </Accordion>

  <Accordion title="Channel terhubung tetapi pesan tidak mengalir">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Output yang baik terlihat seperti:

    - Transport channel terhubung.
    - Pemeriksaan pairing/allowlist lolos.
    - Mention terdeteksi jika diperlukan.

    Tanda log umum:

    - `mention required` → gating mention grup memblokir pemrosesan.
    - `pairing` / `pending` → pengirim DM belum disetujui.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → masalah token izin channel.

    Halaman mendalam:

    - [/gateway/troubleshooting#channel-connected-messages-not-flowing](/id/gateway/troubleshooting#channel-connected-messages-not-flowing)
    - [/channels/troubleshooting](/id/channels/troubleshooting)

  </Accordion>

  <Accordion title="Cron atau Heartbeat tidak berjalan atau tidak terkirim">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw cron status
    openclaw cron list
    openclaw cron runs --id <jobId> --limit 20
    openclaw logs --follow
    ```

    Output yang baik terlihat seperti:

    - `cron.status` menampilkan aktif dengan wake berikutnya.
    - `cron runs` menampilkan entri `ok` terbaru.
    - Heartbeat diaktifkan dan tidak berada di luar jam aktif.

    Tanda log umum:

    - `cron: scheduler disabled; jobs will not run automatically` → cron dinonaktifkan.
    - `heartbeat skipped` dengan `reason=quiet-hours` → di luar jam aktif yang dikonfigurasi.
    - `heartbeat skipped` dengan `reason=empty-heartbeat-file` → `HEARTBEAT.md` ada tetapi hanya berisi scaffolding kosong, komentar, header, fence, atau checklist kosong.
    - `heartbeat skipped` dengan `reason=no-tasks-due` → mode tugas `HEARTBEAT.md` aktif tetapi belum ada interval tugas yang jatuh tempo.
    - `heartbeat skipped` dengan `reason=alerts-disabled` → semua visibilitas heartbeat dinonaktifkan (`showOk`, `showAlerts`, dan `useIndicator` semuanya mati).
    - `requests-in-flight` → lane utama sibuk; wake heartbeat ditunda.
    - `unknown accountId` → akun target pengiriman heartbeat tidak ada.

    Halaman mendalam:

    - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/id/gateway/troubleshooting#cron-and-heartbeat-delivery)
    - [/automation/cron-jobs#troubleshooting](/id/automation/cron-jobs#troubleshooting)
    - [/gateway/heartbeat](/id/gateway/heartbeat)

  </Accordion>

  <Accordion title="Node dipasangkan tetapi tool gagal camera canvas screen exec">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw nodes status
    openclaw nodes describe --node <idOrNameOrIp>
    openclaw logs --follow
    ```

    Output yang baik terlihat seperti:

    - Node tercantum sebagai terhubung dan dipasangkan untuk peran `node`.
    - Capability ada untuk perintah yang Anda panggil.
    - Status izin diberikan untuk tool tersebut.

    Tanda log umum:

    - `NODE_BACKGROUND_UNAVAILABLE` → bawa aplikasi node ke foreground.
    - `*_PERMISSION_REQUIRED` → izin OS ditolak/hilang.
    - `SYSTEM_RUN_DENIED: approval required` → persetujuan exec sedang menunggu.
    - `SYSTEM_RUN_DENIED: allowlist miss` → perintah tidak ada di allowlist exec.

    Halaman mendalam:

    - [/gateway/troubleshooting#node-paired-tool-fails](/id/gateway/troubleshooting#node-paired-tool-fails)
    - [/nodes/troubleshooting](/id/nodes/troubleshooting)
    - [/tools/exec-approvals](/id/tools/exec-approvals)

  </Accordion>

  <Accordion title="Exec tiba-tiba meminta persetujuan">
    ```bash
    openclaw config get tools.exec.host
    openclaw config get tools.exec.security
    openclaw config get tools.exec.ask
    openclaw gateway restart
    ```

    Yang berubah:

    - Jika `tools.exec.host` tidak diatur, defaultnya adalah `auto`.
    - `host=auto` diselesaikan menjadi `sandbox` saat runtime sandbox aktif, selain itu menjadi `gateway`.
    - `host=auto` hanya routing; perilaku "YOLO" tanpa prompt berasal dari `security=full` plus `ask=off` pada gateway/node.
    - Pada `gateway` dan `node`, `tools.exec.security` yang tidak diatur defaultnya menjadi `full`.
    - `tools.exec.ask` yang tidak diatur defaultnya menjadi `off`.
    - Hasil: jika Anda melihat persetujuan, beberapa kebijakan host-local atau per sesi memperketat exec menjauh dari default saat ini.

    Pulihkan perilaku default saat ini tanpa persetujuan:

    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```

    Alternatif yang lebih aman:

    - Atur hanya `tools.exec.host=gateway` jika Anda hanya menginginkan routing host yang stabil.
    - Gunakan `security=allowlist` dengan `ask=on-miss` jika Anda menginginkan host exec tetapi tetap ingin peninjauan saat allowlist miss.
    - Aktifkan mode sandbox jika Anda ingin `host=auto` diselesaikan kembali menjadi `sandbox`.

    Tanda log umum:

    - `Approval required.` → perintah sedang menunggu `/approve ...`.
    - `SYSTEM_RUN_DENIED: approval required` → persetujuan exec node-host sedang menunggu.
    - `exec host=sandbox requires a sandbox runtime for this session` → pemilihan sandbox implisit/eksplisit tetapi mode sandbox mati.

    Halaman mendalam:

    - [/tools/exec](/id/tools/exec)
    - [/tools/exec-approvals](/id/tools/exec-approvals)
    - [/gateway/security#what-the-audit-checks-high-level](/id/gateway/security#what-the-audit-checks-high-level)

  </Accordion>

  <Accordion title="Tool browser gagal">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw browser status
    openclaw logs --follow
    openclaw doctor
    ```

    Output yang baik terlihat seperti:

    - Status browser menampilkan `running: true` dan browser/profil yang dipilih.
    - `openclaw` dimulai, atau `user` dapat melihat tab Chrome lokal.

    Tanda log umum:

    - `unknown command "browser"` atau `unknown command 'browser'` → `plugins.allow` diatur dan tidak menyertakan `browser`.
    - `Failed to start Chrome CDP on port` → peluncuran browser lokal gagal.
    - `browser.executablePath not found` → path biner yang dikonfigurasi salah.
    - `browser.cdpUrl must be http(s) or ws(s)` → URL CDP yang dikonfigurasi menggunakan skema yang tidak didukung.
    - `browser.cdpUrl has invalid port` → URL CDP yang dikonfigurasi memiliki port yang buruk atau di luar rentang.
    - `No Chrome tabs found for profile="user"` → profil attach Chrome MCP tidak memiliki tab Chrome lokal yang terbuka.
    - `Remote CDP for profile "<name>" is not reachable` → endpoint CDP jarak jauh yang dikonfigurasi tidak dapat dijangkau dari host ini.
    - `Browser attachOnly is enabled ... not reachable` atau `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil attach-only tidak memiliki target CDP aktif.
    - override viewport / dark-mode / locale / offline yang usang pada profil attach-only atau CDP jarak jauh → jalankan `openclaw browser stop --browser-profile <name>` untuk menutup sesi kontrol aktif dan melepaskan status emulasi tanpa memulai ulang gateway.

    Halaman mendalam:

    - [/gateway/troubleshooting#browser-tool-fails](/id/gateway/troubleshooting#browser-tool-fails)
    - [/tools/browser#missing-browser-command-or-tool](/id/tools/browser#missing-browser-command-or-tool)
    - [/tools/browser-linux-troubleshooting](/id/tools/browser-linux-troubleshooting)
    - [/tools/browser-wsl2-windows-remote-cdp-troubleshooting](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

  </Accordion>

</AccordionGroup>

## Terkait

- [FAQ](/id/help/faq) — pertanyaan yang sering diajukan
- [Pemecahan Masalah Gateway](/id/gateway/troubleshooting) — masalah khusus gateway
- [Doctor](/id/gateway/doctor) — pemeriksaan kesehatan dan perbaikan otomatis
- [Pemecahan Masalah Channel](/id/channels/troubleshooting) — masalah konektivitas channel
- [Pemecahan Masalah Otomatisasi](/id/automation/cron-jobs#troubleshooting) — masalah cron dan heartbeat
