---
read_when:
    - Menjalankan atau men-debug proses Gateway
summary: Panduan operasional untuk layanan, siklus hidup, dan operasi Gateway
title: Panduan operasional Gateway
x-i18n:
    generated_at: "2026-07-16T18:09:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d8b50b6041905c321887ea0f579f8d4c3b74552b2b72c37ec655e43a53dfc130
    source_path: gateway/index.md
    workflow: 16
---

Gunakan halaman ini untuk penyiapan awal dan operasi lanjutan layanan Gateway.

<CardGroup cols={2}>
  <Card title="Pemecahan masalah mendalam" icon="siren" href="/id/gateway/troubleshooting">
    Diagnostik berbasis gejala dengan urutan perintah yang tepat dan ciri khas log.
  </Card>
  <Card title="Konfigurasi" icon="sliders" href="/id/gateway/configuration">
    Panduan penyiapan berorientasi tugas + referensi konfigurasi lengkap.
  </Card>
  <Card title="Pengelolaan rahasia" icon="key-round" href="/id/gateway/secrets">
    Kontrak SecretRef, perilaku snapshot runtime, serta operasi migrasi/muat ulang.
  </Card>
  <Card title="Kontrak rencana rahasia" icon="shield-check" href="/id/gateway/secrets-plan-contract">
    Aturan target/jalur `secrets apply` yang tepat dan perilaku profil autentikasi khusus referensi.
  </Card>
</CardGroup>

## Penyiapan lokal dalam 5 menit

<Steps>
  <Step title="Mulai Gateway">

```bash
openclaw gateway --port 18789
# debug/trace dicerminkan ke stdio
openclaw gateway --port 18789 --verbose
# hentikan paksa listener pada port yang dipilih, lalu mulai
openclaw gateway --force
```

  </Step>

  <Step title="Verifikasi kesehatan layanan">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Tolok ukur sehat: `Runtime: running`, `Connectivity probe: ok`, dan baris `Capability` yang sesuai dengan harapan Anda. Gunakan `openclaw gateway status --require-rpc` sebagai bukti RPC cakupan baca, bukan sekadar keterjangkauan.

  </Step>

  <Step title="Validasi kesiapan kanal">

```bash
openclaw channels status --probe
```

Dengan gateway yang dapat dijangkau, perintah ini menjalankan probe kanal langsung per akun dan audit opsional. Jika gateway tidak dapat dijangkau, CLI beralih ke ringkasan kanal berbasis konfigurasi saja.

  </Step>
</Steps>

<Note>
Pemuatan ulang konfigurasi Gateway memantau jalur berkas konfigurasi aktif (ditentukan dari nilai default profil/status, atau `OPENCLAW_CONFIG_PATH` jika ditetapkan). Mode default adalah `gateway.reload.mode="hybrid"`. Setelah pemuatan pertama berhasil, proses yang berjalan menyajikan snapshot konfigurasi aktif dalam memori; pemuatan ulang yang berhasil menukar snapshot tersebut secara atomik.
</Note>

## Model runtime

- Satu proses yang selalu aktif untuk perutean, bidang kontrol, dan koneksi kanal.
- Satu port termultipleks untuk:
  - Kontrol/RPC WebSocket
  - API HTTP (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Rute HTTP Plugin, seperti `/api/v1/admin/rpc` opsional
  - UI Kontrol dan hook
- Mode bind default: `loopback`. Di dalam lingkungan kontainer yang terdeteksi, default efektifnya adalah `auto` (ditentukan menjadi `0.0.0.0` untuk penerusan port), kecuali serve/funnel Tailscale aktif, yang selalu memaksakan `loopback`.
- Autentikasi diwajibkan secara default. Penyiapan rahasia bersama menggunakan `gateway.auth.token` / `gateway.auth.password` (atau `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), dan penyiapan proksi balik non-loopback dapat menggunakan `gateway.auth.mode: "trusted-proxy"`.

## Endpoint yang kompatibel dengan OpenAI

Permukaan kompatibilitas OpenClaw dengan dampak tertinggi:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Alasan kumpulan ini penting:

- Sebagian besar integrasi Open WebUI, LobeChat, dan LibreChat memeriksa `/v1/models` terlebih dahulu.
- Banyak pipeline RAG dan memori mengharapkan `/v1/embeddings`.
- Klien khusus agen semakin memilih `/v1/responses`.

`/v1/models` mengutamakan agen: endpoint ini mengembalikan `openclaw`, `openclaw/default`, dan `openclaw/<agentId>` untuk setiap agen yang dikonfigurasi. `openclaw/default` adalah alias stabil yang selalu dipetakan ke agen default yang dikonfigurasi. Kirim `x-openclaw-model` saat Anda menginginkan penggantian penyedia/model backend; jika tidak, model normal dan penyiapan embedding agen yang dipilih tetap memegang kendali.

Semua ini berjalan pada port Gateway utama dan menggunakan batas autentikasi operator tepercaya yang sama dengan API HTTP Gateway lainnya.

RPC HTTP admin (`POST /api/v1/admin/rpc`) adalah rute Plugin terpisah yang dinonaktifkan secara default untuk alat host yang tidak dapat menggunakan RPC WebSocket. Lihat [RPC HTTP Admin](/id/plugins/admin-http-rpc).

### Prioritas port dan bind

| Pengaturan   | Urutan penentuan                                                     |
| ------------ | -------------------------------------------------------------------- |
| Port Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`        |
| Mode bind    | CLI/penggantian → `gateway.bind` → `loopback` (atau `auto` dalam kontainer) |

Layanan gateway yang terpasang mencatat `--port` yang ditentukan dalam metadata supervisor. Setelah mengubah `gateway.port`, jalankan `openclaw doctor --fix` atau `openclaw gateway install --force` agar launchd/systemd/schtasks memulai proses pada port baru.

Penyiapan awal Gateway menggunakan port dan bind efektif yang sama saat mengisi origin UI Kontrol lokal untuk bind non-loopback. Sebagai contoh, `--bind lan --port 3000` mengisi `http://localhost:3000` dan `http://127.0.0.1:3000` sebelum validasi runtime dijalankan. Tambahkan origin browser jarak jauh, seperti URL proksi HTTPS, secara eksplisit ke `gateway.controlUi.allowedOrigins`.

### Mode pemuatan ulang langsung

| `gateway.reload.mode` | Perilaku                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | Tanpa pemuatan ulang konfigurasi           |
| `hot`                 | Terapkan hanya perubahan yang aman diterapkan langsung |
| `restart`             | Mulai ulang saat perubahan memerlukan pemuatan ulang |
| `hybrid` (default)    | Terapkan langsung jika aman, mulai ulang jika diperlukan |

## Kumpulan perintah operator

```bash
openclaw gateway status
openclaw gateway status --deep   # menambahkan pemindaian layanan tingkat sistem
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` ditujukan untuk penemuan layanan tambahan (LaunchDaemon/unit sistem systemd/schtasks), bukan probe kesehatan RPC yang lebih mendalam.

## Beberapa gateway (host yang sama)

Sebagian besar instalasi sebaiknya menjalankan satu gateway per mesin. Satu gateway dapat menampung beberapa agen dan kanal. Anda hanya memerlukan beberapa gateway jika sengaja menginginkan isolasi atau bot penyelamat.

Pemeriksaan yang berguna:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Hal yang dapat diharapkan:

- `gateway status --deep` dapat melaporkan `Other gateway-like services detected (best effort)` dan mencetak petunjuk pembersihan saat instalasi launchd/systemd/schtasks usang masih ada.
- `gateway probe` dapat memperingatkan tentang `multiple reachable gateway identities` saat gateway yang berbeda merespons, atau saat OpenClaw tidak dapat membuktikan bahwa target yang dapat dijangkau adalah gateway yang sama. Tunnel SSH, URL proksi, atau URL jarak jauh yang dikonfigurasi ke gateway yang sama merupakan satu gateway dengan beberapa transportasi, meskipun port transportasinya berbeda.
- Jika hal tersebut disengaja, pisahkan port, konfigurasi/status, dan root ruang kerja untuk setiap gateway.

Daftar periksa per instans:

- `gateway.port` unik
- `OPENCLAW_CONFIG_PATH` unik
- `OPENCLAW_STATE_DIR` unik
- `agents.defaults.workspace` unik

Contoh:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Penyiapan terperinci: [/gateway/multiple-gateways](/id/gateway/multiple-gateways).

## Akses jarak jauh

Disarankan: Tailscale/VPN.
Alternatif: tunnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Kemudian hubungkan klien secara lokal ke `ws://127.0.0.1:18789`.

<Warning>
Tunnel SSH tidak melewati autentikasi gateway. Untuk autentikasi rahasia bersama, klien tetap
harus mengirim `token`/`password` bahkan melalui tunnel. Untuk mode yang membawa identitas,
permintaan tetap harus memenuhi jalur autentikasi tersebut.
</Warning>

Lihat: [Gateway Jarak Jauh](/id/gateway/remote), [Autentikasi](/id/gateway/authentication), [Tailscale](/id/gateway/tailscale).

## Supervisi dan siklus hidup layanan

Gunakan proses yang diawasi untuk keandalan seperti produksi.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Gunakan `openclaw gateway restart` untuk memulai ulang. Jangan merangkai `openclaw gateway stop` dan `openclaw gateway start` sebagai pengganti mulai ulang.

Di macOS, `gateway stop` menggunakan `launchctl bootout` secara default. Tindakan ini menghapus LaunchAgent dari sesi boot saat ini tanpa menyimpan status nonaktif, sehingga pemulihan otomatis KeepAlive tetap berfungsi setelah crash tak terduga dan `gateway start` dapat mengaktifkannya kembali dengan bersih. Untuk terus menekan pemunculan ulang otomatis setelah boot ulang, teruskan `--disable`: `openclaw gateway stop --disable`.

Label LaunchAgent adalah `ai.openclaw.gateway` (default) atau `ai.openclaw.<profile>` (profil bernama). `openclaw doctor` mengaudit dan memperbaiki penyimpangan konfigurasi layanan.

  </Tab>

  <Tab title="Linux (pengguna systemd)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Agar tetap berjalan setelah logout, aktifkan lingering:

```bash
sudo loginctl enable-linger $(whoami)
```

Pada server headless tanpa sesi desktop, pastikan juga `XDG_RUNTIME_DIR` ditetapkan (`export XDG_RUNTIME_DIR=/run/user/$(id -u)`) sebelum mencoba kembali perintah `systemctl --user`.

Contoh unit pengguna manual saat Anda memerlukan jalur instalasi khusus:

```ini
[Unit]
Description=Gateway OpenClaw
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Penyiapan awal terkelola Windows native menggunakan Scheduled Task bernama `OpenClaw Gateway`
(atau `OpenClaw Gateway (<profile>)` untuk profil bernama). Jika pembuatan Scheduled Task
ditolak, OpenClaw beralih ke peluncur folder Startup per pengguna
yang menunjuk ke `gateway.cmd` di dalam direktori status.

  </Tab>

  <Tab title="Linux (layanan sistem)">

Gunakan unit sistem untuk host multipengguna/selalu aktif.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Gunakan isi layanan yang sama seperti unit pengguna, tetapi pasang di
`/etc/systemd/system/openclaw-gateway[-<profile>].service` dan sesuaikan
`ExecStart=` jika biner `openclaw` Anda berada di tempat lain.

Jangan izinkan `openclaw doctor --fix` sekaligus memasang layanan gateway tingkat pengguna untuk profil/port yang sama. Doctor menolak instalasi otomatis tersebut saat menemukan layanan gateway OpenClaw tingkat sistem; gunakan `OPENCLAW_SERVICE_REPAIR_POLICY=external` saat unit sistem memiliki siklus hidupnya.

  </Tab>
</Tabs>

Kesalahan konfigurasi yang tidak valid keluar dengan kode `78`. Unit systemd Linux menggunakan `RestartPreventExitStatus=78` untuk menghentikan peluncuran ulang sampai konfigurasi diperbaiki. launchd dan Windows Task Scheduler tidak memiliki aturan penghentian per kode keluar yang setara, sehingga Gateway juga menyimpan riwayat boot tidak bersih yang terjadi cepat dan menekan mulai otomatis akun kanal/penyedia setelah kegagalan penyiapan awal berulang. Dalam mode aman tersebut, bidang kontrol tetap dimulai untuk pemeriksaan dan perbaikan, pemuatan ulang langsung konfigurasi dan `secrets.reload` menolak mulai ulang kanal secara otomatis, dan permintaan eksplisit operator `channels.start` dapat menggantikan penekanan tersebut.

## Jalur cepat profil pengembangan

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Nilai default mencakup status/konfigurasi terisolasi dan port gateway dasar `19001`.

## Referensi cepat protokol (tampilan operator)

- Frame klien pertama harus berupa `connect`.
- Gateway mengembalikan frame `hello-ok` dengan `snapshot` (`presence`, `health`, `stateVersion`, `uptimeMs`) beserta batas `policy` (`maxPayload`, `maxBufferedBytes`, `tickIntervalMs`).
- `hello-ok.features.methods` / `events` merupakan daftar penemuan konservatif, bukan
  hasil pencurahan yang dibuat secara otomatis dari setiap rute pembantu yang dapat dipanggil.
- Permintaan: `req(method, params)` → `res(ok/payload|error)`.
- Peristiwa umum mencakup `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, `session.approval` yang
  bersifat opsional, `sessions.changed`, `presence`, `tick`, `health`,
  `heartbeat`, peristiwa siklus hidup pemasangan/persetujuan, dan `shutdown`.

Proses agen terdiri dari dua tahap:

1. Konfirmasi penerimaan langsung (`status:"accepted"`)
2. Respons penyelesaian akhir (`status:"ok"|"error"`), dengan peristiwa `agent` yang dialirkan di antaranya.

Lihat dokumentasi protokol lengkap: [Protokol Gateway](/id/gateway/protocol).

## Pemeriksaan operasional

### Keaktifan

- Buka WS dan kirim `connect`.
- Harapkan respons `hello-ok` dengan rekam keadaan.

### Kesiapan

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Pemulihan kesenjangan

Peristiwa tidak diputar ulang. Jika terdapat kesenjangan urutan, segarkan keadaan (`health`, `system-presence`) sebelum melanjutkan.

## Tanda kegagalan umum

| Tanda                                                          | Kemungkinan masalah                                                                 |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Pengikatan non-loopback tanpa jalur autentikasi Gateway yang valid                   |
| `another gateway instance is already listening` / `EADDRINUSE` | Konflik port                                                                        |
| `Gateway start blocked: set gateway.mode=local`                | Konfigurasi diatur ke mode jarak jauh, atau `gateway.mode` tidak ada dalam konfigurasi yang rusak |
| `unauthorized` selama koneksi                                  | Ketidakcocokan autentikasi antara klien dan Gateway                                  |

Untuk langkah-langkah diagnosis lengkap, gunakan [Pemecahan Masalah Gateway](/id/gateway/troubleshooting).

## Jaminan keamanan

- Klien protokol Gateway langsung gagal saat Gateway tidak tersedia (tanpa fallback saluran langsung implisit).
- Frame pertama yang tidak valid/bukan koneksi ditolak dan ditutup.
- Pematian secara tertib memancarkan peristiwa `shutdown` sebelum soket ditutup.

## Terkait

- [Konfigurasi](/id/gateway/configuration)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
- [Proses latar belakang](/id/gateway/background-process)
- [Kesehatan](/id/gateway/health)
- [Doctor](/id/gateway/doctor)
- [Autentikasi](/id/gateway/authentication)
- [Akses jarak jauh](/id/gateway/remote)
- [Pengelolaan rahasia](/id/gateway/secrets)
