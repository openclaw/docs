---
read_when:
    - OpenClaw tidak berfungsi dan Anda memerlukan jalur tercepat menuju perbaikan
    - Anda ingin alur triase sebelum mendalami runbook yang lebih mendalam
summary: Pusat pemecahan masalah berbasis gejala terlebih dahulu untuk OpenClaw
title: Pemecahan Masalah Umum
x-i18n:
    generated_at: "2026-04-11T02:45:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16b38920dbfdc8d4a79bbb5d6fab2c67c9f218a97c36bb4695310d7db9c4614a
    source_path: help/troubleshooting.md
    workflow: 15
---

# Pemecahan Masalah

Jika Anda hanya punya 2 menit, gunakan halaman ini sebagai pintu masuk triase.

## 60 detik pertama

Jalankan urutan ini persis sesuai urutan:

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

- `openclaw status` → menampilkan saluran yang dikonfigurasi dan tidak ada error auth yang jelas.
- `openclaw status --all` → laporan lengkap tersedia dan dapat dibagikan.
- `openclaw gateway probe` → target gateway yang diharapkan dapat dijangkau (`Reachable: yes`). `RPC: limited - missing scope: operator.read` adalah diagnostik yang terdegradasi, bukan kegagalan koneksi.
- `openclaw gateway status` → `Runtime: running` dan `RPC probe: ok`.
- `openclaw doctor` → tidak ada error config/layanan yang memblokir.
- `openclaw channels status --probe` → gateway yang dapat dijangkau mengembalikan
  status transport live per akun plus hasil probe/audit seperti `works` atau `audit ok`; jika
  gateway tidak dapat dijangkau, perintah akan fallback ke ringkasan berbasis config saja.
- `openclaw logs --follow` → aktivitas stabil, tidak ada error fatal yang berulang.

## 429 konteks panjang Anthropic

Jika Anda melihat:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`,
buka [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/id/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Backend lokal yang kompatibel dengan OpenAI bekerja langsung tetapi gagal di OpenClaw

Jika backend `/v1` lokal atau self-hosted Anda merespons probe langsung
`/v1/chat/completions` yang kecil tetapi gagal pada `openclaw infer model run` atau giliran
agen normal:

1. Jika error menyebut `messages[].content` mengharapkan string, setel
   `models.providers.<provider>.models[].compat.requiresStringContent: true`.
2. Jika backend masih gagal hanya pada giliran agen OpenClaw, setel
   `models.providers.<provider>.models[].compat.supportsTools: false` lalu coba lagi.
3. Jika panggilan langsung kecil masih berfungsi tetapi prompt OpenClaw yang lebih besar membuat
   backend crash, anggap sisa masalah sebagai keterbatasan model/server upstream dan
   lanjutkan ke runbook mendalam:
   [/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail](/id/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)

## Instal plugin gagal karena ekstensi openclaw tidak ada

Jika instalasi gagal dengan `package.json missing openclaw.extensions`, paket plugin
menggunakan bentuk lama yang tidak lagi diterima OpenClaw.

Perbaiki di paket plugin:

1. Tambahkan `openclaw.extensions` ke `package.json`.
2. Arahkan entri ke file runtime hasil build (biasanya `./dist/index.js`).
3. Publikasikan ulang plugin lalu jalankan `openclaw plugins install <package>` lagi.

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

Referensi: [Arsitektur plugin](/id/plugins/architecture)

## Pohon keputusan

```mermaid
flowchart TD
  A[OpenClaw tidak berfungsi] --> B{Apa yang pertama kali rusak}
  B --> C[Tidak ada balasan]
  B --> D[Dashboard atau UI Kontrol tidak dapat terhubung]
  B --> E[Gateway tidak dapat dimulai atau layanan tidak berjalan]
  B --> F[Saluran terhubung tetapi pesan tidak mengalir]
  B --> G[Cron atau heartbeat tidak berjalan atau tidak terkirim]
  B --> H[Node sudah dipasangkan tetapi exec layar kanvas kamera gagal]
  B --> I[Alat browser gagal]

  C --> C1[/Bagian tidak ada balasan/]
  D --> D1[/Bagian UI Kontrol/]
  E --> E1[/Bagian Gateway/]
  F --> F1[/Bagian alur saluran/]
  G --> G1[/Bagian otomasi/]
  H --> H1[/Bagian alat node/]
  I --> I1[/Bagian browser/]
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

    Output yang baik terlihat seperti ini:

    - `Runtime: running`
    - `RPC probe: ok`
    - Saluran Anda menunjukkan transport terhubung dan, jika didukung, `works` atau `audit ok` di `channels status --probe`
    - Pengirim tampak disetujui (atau kebijakan DM terbuka/allowlist)

    Tanda log yang umum:

    - `drop guild message (mention required` → gerbang mention memblokir pesan di Discord.
    - `pairing request` → pengirim belum disetujui dan menunggu persetujuan pairing DM.
    - `blocked` / `allowlist` di log saluran → pengirim, room, atau grup difilter.

    Halaman mendalam:

    - [/gateway/troubleshooting#no-replies](/id/gateway/troubleshooting#no-replies)
    - [/channels/troubleshooting](/id/channels/troubleshooting)
    - [/channels/pairing](/id/channels/pairing)

  </Accordion>

  <Accordion title="Dashboard atau UI Kontrol tidak dapat terhubung">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Output yang baik terlihat seperti ini:

    - `Dashboard: http://...` ditampilkan di `openclaw gateway status`
    - `RPC probe: ok`
    - Tidak ada loop auth di log

    Tanda log yang umum:

    - `device identity required` → konteks HTTP/non-aman tidak dapat menyelesaikan auth perangkat.
    - `origin not allowed` → `Origin` browser tidak diizinkan untuk
      target gateway UI Kontrol.
    - `AUTH_TOKEN_MISMATCH` dengan petunjuk percobaan ulang (`canRetryWithDeviceToken=true`) → satu percobaan ulang token perangkat tepercaya dapat terjadi secara otomatis.
    - Percobaan ulang token cache itu menggunakan kembali set scope cache yang disimpan bersama token perangkat yang dipasangkan. Pemanggil `deviceToken` eksplisit / `scopes` eksplisit tetap memakai set scope yang diminta.
    - Pada jalur UI Kontrol Tailscale Serve async, upaya gagal untuk
      `{scope, ip}` yang sama diserialkan sebelum limiter mencatat kegagalan, sehingga
      percobaan ulang buruk kedua yang bersamaan sudah bisa menampilkan `retry later`.
    - `too many failed authentication attempts (retry later)` dari origin browser localhost → kegagalan berulang dari `Origin` yang sama untuk sementara dikunci; origin localhost lain memakai bucket terpisah.
    - `repeated unauthorized` setelah percobaan ulang itu → token/password salah, mode auth tidak cocok, atau token perangkat pasangan yang sudah usang.
    - `gateway connect failed:` → UI menargetkan URL/port yang salah atau gateway tidak dapat dijangkau.

    Halaman mendalam:

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/id/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/web/control-ui)
    - [/gateway/authentication](/id/gateway/authentication)

  </Accordion>

  <Accordion title="Gateway tidak dapat dimulai atau layanan terinstal tetapi tidak berjalan">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Output yang baik terlihat seperti ini:

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `RPC probe: ok`

    Tanda log yang umum:

    - `Gateway start blocked: set gateway.mode=local` atau `existing config is missing gateway.mode` → mode gateway adalah remote, atau file config tidak memiliki penanda local-mode dan harus diperbaiki.
    - `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur auth gateway yang valid (token/password, atau trusted-proxy jika dikonfigurasi).
    - `another gateway instance is already listening` atau `EADDRINUSE` → port sudah dipakai.

    Halaman mendalam:

    - [/gateway/troubleshooting#gateway-service-not-running](/id/gateway/troubleshooting#gateway-service-not-running)
    - [/gateway/background-process](/id/gateway/background-process)
    - [/gateway/configuration](/id/gateway/configuration)

  </Accordion>

  <Accordion title="Saluran terhubung tetapi pesan tidak mengalir">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Output yang baik terlihat seperti ini:

    - Transport saluran terhubung.
    - Pemeriksaan pairing/allowlist lolos.
    - Mention terdeteksi jika diwajibkan.

    Tanda log yang umum:

    - `mention required` → gerbang mention memblokir pemrosesan grup.
    - `pairing` / `pending` → pengirim DM belum disetujui.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → masalah token izin saluran.

    Halaman mendalam:

    - [/gateway/troubleshooting#channel-connected-messages-not-flowing](/id/gateway/troubleshooting#channel-connected-messages-not-flowing)
    - [/channels/troubleshooting](/id/channels/troubleshooting)

  </Accordion>

  <Accordion title="Cron atau heartbeat tidak berjalan atau tidak terkirim">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw cron status
    openclaw cron list
    openclaw cron runs --id <jobId> --limit 20
    openclaw logs --follow
    ```

    Output yang baik terlihat seperti ini:

    - `cron.status` menunjukkan aktif dengan wake berikutnya.
    - `cron runs` menunjukkan entri `ok` terbaru.
    - Heartbeat aktif dan tidak berada di luar jam aktif.

    Tanda log yang umum:

    - `cron: scheduler disabled; jobs will not run automatically` → cron dinonaktifkan.
    - `heartbeat skipped` dengan `reason=quiet-hours` → di luar jam aktif yang dikonfigurasi.
    - `heartbeat skipped` dengan `reason=empty-heartbeat-file` → `HEARTBEAT.md` ada tetapi hanya berisi scaffold kosong/header saja.
    - `heartbeat skipped` dengan `reason=no-tasks-due` → mode tugas `HEARTBEAT.md` aktif tetapi belum ada interval tugas yang jatuh tempo.
    - `heartbeat skipped` dengan `reason=alerts-disabled` → semua visibilitas heartbeat dinonaktifkan (`showOk`, `showAlerts`, dan `useIndicator` semuanya mati).
    - `requests-in-flight` → lajur utama sibuk; wake heartbeat ditunda.
    - `unknown accountId` → account target pengiriman heartbeat tidak ada.

    Halaman mendalam:

    - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/id/gateway/troubleshooting#cron-and-heartbeat-delivery)
    - [/automation/cron-jobs#troubleshooting](/id/automation/cron-jobs#troubleshooting)
    - [/gateway/heartbeat](/id/gateway/heartbeat)

    </Accordion>

    <Accordion title="Node sudah dipasangkan tetapi alat gagal pada exec layar kanvas kamera">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw nodes status
      openclaw nodes describe --node <idOrNameOrIp>
      openclaw logs --follow
      ```

      Output yang baik terlihat seperti ini:

      - Node tercantum sebagai terhubung dan sudah dipasangkan untuk peran `node`.
      - Kapabilitas tersedia untuk perintah yang Anda panggil.
      - Status izin diberikan untuk alat tersebut.

      Tanda log yang umum:

      - `NODE_BACKGROUND_UNAVAILABLE` → bawa aplikasi node ke foreground.
      - `*_PERMISSION_REQUIRED` → izin OS ditolak/tidak ada.
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

      - Jika `tools.exec.host` tidak disetel, default-nya adalah `auto`.
      - `host=auto` di-resolve menjadi `sandbox` saat runtime sandbox aktif, dan `gateway` jika tidak.
      - `host=auto` hanya untuk perutean; perilaku tanpa prompt "YOLO" berasal dari `security=full` plus `ask=off` pada gateway/node.
      - Pada `gateway` dan `node`, `tools.exec.security` yang tidak disetel default-nya `full`.
      - `tools.exec.ask` yang tidak disetel default-nya `off`.
      - Hasilnya: jika Anda melihat persetujuan, beberapa kebijakan lokal-host atau per-sesi telah memperketat exec dari default saat ini.

      Pulihkan perilaku tanpa persetujuan sesuai default saat ini:

      ```bash
      openclaw config set tools.exec.host gateway
      openclaw config set tools.exec.security full
      openclaw config set tools.exec.ask off
      openclaw gateway restart
      ```

      Alternatif yang lebih aman:

      - Setel hanya `tools.exec.host=gateway` jika Anda hanya ingin perutean host yang stabil.
      - Gunakan `security=allowlist` dengan `ask=on-miss` jika Anda ingin exec host tetapi tetap ingin peninjauan saat ada miss pada allowlist.
      - Aktifkan mode sandbox jika Anda ingin `host=auto` di-resolve kembali ke `sandbox`.

      Tanda log yang umum:

      - `Approval required.` → perintah sedang menunggu `/approve ...`.
      - `SYSTEM_RUN_DENIED: approval required` → persetujuan exec host-node sedang menunggu.
      - `exec host=sandbox requires a sandbox runtime for this session` → pemilihan sandbox implisit/eksplisit tetapi mode sandbox nonaktif.

      Halaman mendalam:

      - [/tools/exec](/id/tools/exec)
      - [/tools/exec-approvals](/id/tools/exec-approvals)
      - [/gateway/security#what-the-audit-checks-high-level](/id/gateway/security#what-the-audit-checks-high-level)

    </Accordion>

    <Accordion title="Alat browser gagal">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw browser status
      openclaw logs --follow
      openclaw doctor
      ```

      Output yang baik terlihat seperti ini:

      - Status browser menunjukkan `running: true` dan browser/profile yang dipilih.
      - `openclaw` dimulai, atau `user` dapat melihat tab Chrome lokal.

      Tanda log yang umum:

      - `unknown command "browser"` atau `unknown command 'browser'` → `plugins.allow` disetel dan tidak menyertakan `browser`.
      - `Failed to start Chrome CDP on port` → peluncuran browser lokal gagal.
      - `browser.executablePath not found` → path biner yang dikonfigurasi salah.
      - `browser.cdpUrl must be http(s) or ws(s)` → URL CDP yang dikonfigurasi menggunakan skema yang tidak didukung.
      - `browser.cdpUrl has invalid port` → URL CDP yang dikonfigurasi memiliki port yang buruk atau di luar rentang.
      - `No Chrome tabs found for profile="user"` → profile lampiran Chrome MCP tidak memiliki tab Chrome lokal yang terbuka.
      - `Remote CDP for profile "<name>" is not reachable` → endpoint CDP jarak jauh yang dikonfigurasi tidak dapat dijangkau dari host ini.
      - `Browser attachOnly is enabled ... not reachable` atau `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profile attach-only tidak memiliki target CDP live.
      - override viewport / mode gelap / locale / offline yang usang pada profile attach-only atau CDP jarak jauh → jalankan `openclaw browser stop --browser-profile <name>` untuk menutup sesi kontrol aktif dan melepaskan state emulasi tanpa memulai ulang gateway.

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
- [Pemecahan Masalah Saluran](/id/channels/troubleshooting) — masalah konektivitas saluran
- [Pemecahan Masalah Otomasi](/id/automation/cron-jobs#troubleshooting) — masalah cron dan heartbeat
