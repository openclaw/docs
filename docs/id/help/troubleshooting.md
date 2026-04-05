---
read_when:
    - OpenClaw tidak berfungsi dan Anda memerlukan jalur tercepat menuju perbaikan
    - Anda menginginkan alur triase sebelum masuk ke panduan mendalam
summary: Pusat pemecahan masalah OpenClaw yang dimulai dari gejala
title: Pemecahan Masalah Umum
x-i18n:
    generated_at: "2026-04-05T13:56:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23ae9638af5edf5a5e0584ccb15ba404223ac3b16c2d62eb93b2c9dac171c252
    source_path: help/troubleshooting.md
    workflow: 15
---

# Pemecahan masalah

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

- `openclaw status` → menampilkan channel yang dikonfigurasi dan tidak ada error auth yang jelas.
- `openclaw status --all` → laporan lengkap tersedia dan dapat dibagikan.
- `openclaw gateway probe` → target gateway yang diharapkan dapat dijangkau (`Reachable: yes`). `RPC: limited - missing scope: operator.read` adalah diagnostik yang menurun, bukan kegagalan koneksi.
- `openclaw gateway status` → `Runtime: running` dan `RPC probe: ok`.
- `openclaw doctor` → tidak ada error konfigurasi/layanan yang memblokir.
- `openclaw channels status --probe` → gateway yang dapat dijangkau mengembalikan status transport langsung per akun
  beserta hasil probe/audit seperti `works` atau `audit ok`; jika
  gateway tidak dapat dijangkau, perintah akan kembali ke ringkasan berbasis konfigurasi saja.
- `openclaw logs --follow` → aktivitas stabil, tanpa error fatal yang berulang.

## Anthropic long context 429

Jika Anda melihat:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`,
buka [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Instalasi plugin gagal karena ekstensi openclaw hilang

Jika instalasi gagal dengan `package.json missing openclaw.extensions`, paket plugin
menggunakan bentuk lama yang sudah tidak diterima lagi oleh OpenClaw.

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

Referensi: [Arsitektur plugin](/plugins/architecture)

## Pohon keputusan

```mermaid
flowchart TD
  A[OpenClaw tidak berfungsi] --> B{Apa yang pertama kali gagal}
  B --> C[Tidak ada balasan]
  B --> D[Dashboard atau UI Kontrol tidak dapat terhubung]
  B --> E[Gateway tidak dapat dimulai atau layanan tidak berjalan]
  B --> F[Channel terhubung tetapi pesan tidak mengalir]
  B --> G[Cron atau heartbeat tidak berjalan atau tidak terkirim]
  B --> H[Node sudah dipasangkan tetapi exec layar canvas kamera tool gagal]
  B --> I[Tool browser gagal]

  C --> C1[/Bagian tidak ada balasan/]
  D --> D1[/Bagian UI Kontrol/]
  E --> E1[/Bagian Gateway/]
  F --> F1[/Bagian aliran channel/]
  G --> G1[/Bagian otomatisasi/]
  H --> H1[/Bagian tool node/]
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

    Output yang baik terlihat seperti:

    - `Runtime: running`
    - `RPC probe: ok`
    - Channel Anda menampilkan transport terhubung dan, jika didukung, `works` atau `audit ok` di `channels status --probe`
    - Pengirim tampak disetujui (atau kebijakan DM terbuka/allowlist)

    Tanda log umum:

    - `drop guild message (mention required` → gating mention memblokir pesan di Discord.
    - `pairing request` → pengirim belum disetujui dan sedang menunggu persetujuan pairing DM.
    - `blocked` / `allowlist` di log channel → pengirim, room, atau grup difilter.

    Halaman mendalam:

    - [/gateway/troubleshooting#no-replies](/gateway/troubleshooting#no-replies)
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

    Output yang baik terlihat seperti:

    - `Dashboard: http://...` ditampilkan di `openclaw gateway status`
    - `RPC probe: ok`
    - Tidak ada loop auth di log

    Tanda log umum:

    - `device identity required` → konteks HTTP/non-aman tidak dapat menyelesaikan auth perangkat.
    - `origin not allowed` → `Origin` browser tidak diizinkan untuk
      target gateway UI Kontrol.
    - `AUTH_TOKEN_MISMATCH` dengan petunjuk retry (`canRetryWithDeviceToken=true`) → satu retry token perangkat tepercaya dapat terjadi secara otomatis.
    - Retry token tersimpan tersebut menggunakan ulang set scope tersimpan yang disimpan bersama
      token perangkat yang dipasangkan. Pemanggil dengan `deviceToken` eksplisit / `scopes` eksplisit tetap mempertahankan
      set scope yang diminta.
    - Pada jalur UI Kontrol Tailscale Serve async, upaya gagal untuk
      `{scope, ip}` yang sama diserialkan sebelum limiter mencatat kegagalan, sehingga
      retry buruk kedua yang berlangsung bersamaan sudah bisa menampilkan `retry later`.
    - `too many failed authentication attempts (retry later)` dari origin browser localhost
      → kegagalan berulang dari `Origin` yang sama dikunci sementara; origin localhost lain menggunakan bucket terpisah.
    - `unauthorized` berulang setelah retry itu → token/password salah, mode auth tidak cocok, atau token perangkat berpasangan yang kedaluwarsa.
    - `gateway connect failed:` → UI menargetkan URL/port yang salah atau gateway tidak dapat dijangkau.

    Halaman mendalam:

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/web/control-ui)
    - [/gateway/authentication](/id/gateway/authentication)

  </Accordion>

  <Accordion title="Gateway tidak dapat dimulai atau layanan sudah terpasang tetapi tidak berjalan">
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
    - `RPC probe: ok`

    Tanda log umum:

    - `Gateway start blocked: set gateway.mode=local` atau `existing config is missing gateway.mode` → mode gateway adalah remote, atau file konfigurasi tidak memiliki penanda mode lokal dan harus diperbaiki.
    - `refusing to bind gateway ... without auth` → bind non-loopback tanpa jalur auth gateway yang valid (token/password, atau trusted-proxy jika dikonfigurasi).
    - `another gateway instance is already listening` atau `EADDRINUSE` → port sudah digunakan.

    Halaman mendalam:

    - [/gateway/troubleshooting#gateway-service-not-running](/gateway/troubleshooting#gateway-service-not-running)
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
    - Mention terdeteksi bila diwajibkan.

    Tanda log umum:

    - `mention required` → gating mention grup memblokir pemrosesan.
    - `pairing` / `pending` → pengirim DM belum disetujui.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → masalah token izin channel.

    Halaman mendalam:

    - [/gateway/troubleshooting#channel-connected-messages-not-flowing](/gateway/troubleshooting#channel-connected-messages-not-flowing)
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

    Output yang baik terlihat seperti:

    - `cron.status` menunjukkan aktif dengan waktu bangun berikutnya.
    - `cron runs` menunjukkan entri `ok` terbaru.
    - Heartbeat aktif dan tidak berada di luar jam aktif.

    Tanda log umum:

- `cron: scheduler disabled; jobs will not run automatically` → cron dinonaktifkan.
- `heartbeat skipped` dengan `reason=quiet-hours` → di luar jam aktif yang dikonfigurasi.
- `heartbeat skipped` dengan `reason=empty-heartbeat-file` → `HEARTBEAT.md` ada tetapi hanya berisi kerangka kosong/hanya header.
- `heartbeat skipped` dengan `reason=no-tasks-due` → mode tugas `HEARTBEAT.md` aktif tetapi belum ada interval tugas yang jatuh tempo.
- `heartbeat skipped` dengan `reason=alerts-disabled` → semua visibilitas heartbeat dinonaktifkan (`showOk`, `showAlerts`, dan `useIndicator` semuanya nonaktif).
- `requests-in-flight` → lajur utama sibuk; bangun heartbeat ditunda. - `unknown accountId` → akun target pengiriman heartbeat tidak ada.

      Halaman mendalam:

      - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/gateway/troubleshooting#cron-and-heartbeat-delivery)
      - [/automation/cron-jobs#troubleshooting](/id/automation/cron-jobs#troubleshooting)
      - [/gateway/heartbeat](/id/gateway/heartbeat)

    </Accordion>

    <Accordion title="Node sudah dipasangkan tetapi tool gagal pada exec layar canvas kamera">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw nodes status
      openclaw nodes describe --node <idOrNameOrIp>
      openclaw logs --follow
      ```

      Output yang baik terlihat seperti:

      - Node tercantum sebagai terhubung dan dipasangkan untuk peran `node`.
      - Kapabilitas ada untuk perintah yang Anda jalankan.
      - Status izin sudah diberikan untuk tool tersebut.

      Tanda log umum:

      - `NODE_BACKGROUND_UNAVAILABLE` → bawa aplikasi node ke foreground.
      - `*_PERMISSION_REQUIRED` → izin OS ditolak/tidak ada.
      - `SYSTEM_RUN_DENIED: approval required` → persetujuan exec masih menunggu.
      - `SYSTEM_RUN_DENIED: allowlist miss` → perintah tidak ada di allowlist exec.

      Halaman mendalam:

      - [/gateway/troubleshooting#node-paired-tool-fails](/gateway/troubleshooting#node-paired-tool-fails)
      - [/nodes/troubleshooting](/nodes/troubleshooting)
      - [/tools/exec-approvals](/tools/exec-approvals)

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
      - `host=auto` akan di-resolve menjadi `sandbox` saat runtime sandbox aktif, dan `gateway` jika tidak.
      - `host=auto` hanya untuk routing; perilaku "YOLO" tanpa prompt berasal dari `security=full` plus `ask=off` di gateway/node.
      - Pada `gateway` dan `node`, `tools.exec.security` yang tidak disetel default-nya `full`.
      - `tools.exec.ask` yang tidak disetel default-nya `off`.
      - Hasilnya: jika Anda melihat persetujuan, berarti ada kebijakan lokal host atau per sesi yang memperketat exec dari default saat ini.

      Kembalikan perilaku tanpa persetujuan default saat ini:

      ```bash
      openclaw config set tools.exec.host gateway
      openclaw config set tools.exec.security full
      openclaw config set tools.exec.ask off
      openclaw gateway restart
      ```

      Alternatif yang lebih aman:

      - Setel hanya `tools.exec.host=gateway` jika Anda hanya ingin routing host yang stabil.
      - Gunakan `security=allowlist` dengan `ask=on-miss` jika Anda ingin exec host tetapi tetap ingin peninjauan saat tidak cocok dengan allowlist.
      - Aktifkan mode sandbox jika Anda ingin `host=auto` di-resolve kembali ke `sandbox`.

      Tanda log umum:

      - `Approval required.` → perintah sedang menunggu `/approve ...`.
      - `SYSTEM_RUN_DENIED: approval required` → persetujuan exec host node masih menunggu.
      - `exec host=sandbox requires a sandbox runtime for this session` → pemilihan sandbox implisit/eksplisit tetapi mode sandbox nonaktif.

      Halaman mendalam:

      - [/tools/exec](/tools/exec)
      - [/tools/exec-approvals](/tools/exec-approvals)
      - [/gateway/security#runtime-expectation-drift](/gateway/security#runtime-expectation-drift)

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

      - Status browser menunjukkan `running: true` dan browser/profil yang dipilih.
      - `openclaw` berjalan, atau `user` dapat melihat tab Chrome lokal.

      Tanda log umum:

      - `unknown command "browser"` atau `unknown command 'browser'` → `plugins.allow` disetel dan tidak mencakup `browser`.
      - `Failed to start Chrome CDP on port` → peluncuran browser lokal gagal.
      - `browser.executablePath not found` → path biner yang dikonfigurasi salah.
      - `browser.cdpUrl must be http(s) or ws(s)` → URL CDP yang dikonfigurasi menggunakan skema yang tidak didukung.
      - `browser.cdpUrl has invalid port` → URL CDP yang dikonfigurasi memiliki port yang buruk atau di luar rentang.
      - `No Chrome tabs found for profile="user"` → profil lampiran Chrome MCP tidak memiliki tab Chrome lokal yang terbuka.
      - `Remote CDP for profile "<name>" is not reachable` → endpoint CDP remote yang dikonfigurasi tidak dapat dijangkau dari host ini.
      - `Browser attachOnly is enabled ... not reachable` atau `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profil attach-only tidak memiliki target CDP langsung.
      - override viewport / dark-mode / locale / offline yang basi pada profil attach-only atau CDP remote → jalankan `openclaw browser stop --browser-profile <name>` untuk menutup sesi kontrol aktif dan melepas status emulasi tanpa me-restart gateway.

      Halaman mendalam:

      - [/gateway/troubleshooting#browser-tool-fails](/gateway/troubleshooting#browser-tool-fails)
      - [/tools/browser#missing-browser-command-or-tool](/tools/browser#missing-browser-command-or-tool)
      - [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
      - [/tools/browser-wsl2-windows-remote-cdp-troubleshooting](/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

    </Accordion>
  </AccordionGroup>

## Terkait

- [FAQ](/help/faq) — pertanyaan yang sering diajukan
- [Pemecahan Masalah Gateway](/gateway/troubleshooting) — masalah khusus gateway
- [Doctor](/id/gateway/doctor) — pemeriksaan kesehatan otomatis dan perbaikan
- [Pemecahan Masalah Channel](/id/channels/troubleshooting) — masalah konektivitas channel
- [Pemecahan Masalah Otomatisasi](/id/automation/cron-jobs#troubleshooting) — masalah cron dan heartbeat
