---
read_when:
    - Menjalankan atau menelusuri kesalahan proses Gateway
summary: Runbook untuk layanan Gateway, siklus hidup, dan operasi
title: Panduan operasional Gateway
x-i18n:
    generated_at: "2026-04-30T09:49:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14f3d288c426848bc176291ff084a2b63b00e81739cd02f31fdf517d230d8111
    source_path: gateway/index.md
    workflow: 16
---

Gunakan halaman ini untuk startup hari pertama dan operasi hari kedua layanan Gateway.

<CardGroup cols={2}>
  <Card title="Pemecahan masalah mendalam" icon="siren" href="/id/gateway/troubleshooting">
    Diagnostik berbasis gejala dengan tangga perintah yang tepat dan tanda tangan log.
  </Card>
  <Card title="Konfigurasi" icon="sliders" href="/id/gateway/configuration">
    Panduan penyiapan berorientasi tugas + referensi konfigurasi lengkap.
  </Card>
  <Card title="Manajemen rahasia" icon="key-round" href="/id/gateway/secrets">
    Kontrak SecretRef, perilaku snapshot runtime, dan operasi migrasi/muat ulang.
  </Card>
  <Card title="Kontrak rencana rahasia" icon="shield-check" href="/id/gateway/secrets-plan-contract">
    Aturan target/path `secrets apply` yang tepat dan perilaku profil autentikasi hanya-ref.
  </Card>
</CardGroup>

## Startup lokal 5 menit

<Steps>
  <Step title="Mulai Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Verifikasi kesehatan layanan">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Baseline sehat: `Runtime: running`, `Connectivity probe: ok`, dan `Capability: ...` yang sesuai dengan yang Anda harapkan. Gunakan `openclaw gateway status --require-rpc` saat Anda memerlukan bukti RPC cakupan-baca, bukan hanya keterjangkauan.

  </Step>

  <Step title="Validasi kesiapan channel">

```bash
openclaw channels status --probe
```

Dengan gateway yang dapat dijangkau, ini menjalankan probe channel live per akun dan audit opsional.
Jika gateway tidak dapat dijangkau, CLI kembali ke ringkasan channel hanya-konfigurasi alih-alih
output probe live.

  </Step>
</Steps>

<Note>
Muat ulang konfigurasi Gateway mengawasi path file konfigurasi aktif (diselesaikan dari default profil/status, atau `OPENCLAW_CONFIG_PATH` saat ditetapkan).
Mode default adalah `gateway.reload.mode="hybrid"`.
Setelah pemuatan pertama yang berhasil, proses yang berjalan melayani snapshot konfigurasi aktif dalam memori; muat ulang yang berhasil menukar snapshot tersebut secara atomik.
</Note>

## Model runtime

- Satu proses yang selalu aktif untuk perutean, control plane, dan koneksi channel.
- Satu port termultipleks untuk:
  - Kontrol/RPC WebSocket
  - API HTTP, kompatibel OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI dan hook
- Mode bind default: `loopback`.
- Autentikasi diwajibkan secara default. Penyiapan rahasia bersama menggunakan
  `gateway.auth.token` / `gateway.auth.password` (atau
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), dan penyiapan reverse-proxy
  non-loopback dapat menggunakan `gateway.auth.mode: "trusted-proxy"`.

## Endpoint kompatibel OpenAI

Permukaan kompatibilitas bernilai tertinggi OpenClaw sekarang adalah:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Mengapa kumpulan ini penting:

- Sebagian besar integrasi Open WebUI, LobeChat, dan LibreChat mem-probe `/v1/models` terlebih dahulu.
- Banyak pipeline RAG dan memori mengharapkan `/v1/embeddings`.
- Klien agent-native semakin memilih `/v1/responses`.

Catatan perencanaan:

- `/v1/models` mengutamakan agen: mengembalikan `openclaw`, `openclaw/default`, dan `openclaw/<agentId>`.
- `openclaw/default` adalah alias stabil yang selalu memetakan ke agen default yang dikonfigurasi.
- Gunakan `x-openclaw-model` saat Anda menginginkan override penyedia/model backend; jika tidak, penyiapan model dan embedding normal agen yang dipilih tetap memegang kendali.

Semua ini berjalan di port Gateway utama dan menggunakan batas autentikasi operator tepercaya yang sama seperti API HTTP Gateway lainnya.

### Prioritas port dan bind

| Pengaturan  | Urutan resolusi                                               |
| ------------ | ------------------------------------------------------------- |
| Port Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Mode bind    | CLI/override → `gateway.bind` → `loopback`                    |

Layanan gateway yang terinstal mencatat `--port` yang diselesaikan di metadata supervisor. Setelah mengubah `gateway.port`, jalankan `openclaw doctor --fix` atau `openclaw gateway install --force` agar launchd/systemd/schtasks memulai proses di port baru.

Startup Gateway menggunakan port dan bind efektif yang sama saat menanam origin
Control UI lokal untuk bind non-loopback. Misalnya, `--bind lan --port 3000`
menanam `http://localhost:3000` dan `http://127.0.0.1:3000` sebelum validasi
runtime berjalan. Tambahkan origin browser jarak jauh apa pun, seperti URL proxy HTTPS, ke
`gateway.controlUi.allowedOrigins` secara eksplisit.

### Mode hot reload

| `gateway.reload.mode` | Perilaku                                  |
| --------------------- | ----------------------------------------- |
| `off`                 | Tidak ada muat ulang konfigurasi          |
| `hot`                 | Terapkan hanya perubahan yang aman-hot    |
| `restart`             | Mulai ulang pada perubahan yang perlu muat ulang |
| `hybrid` (default)    | Terapkan-hot saat aman, mulai ulang saat diperlukan |

## Set perintah operator

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` ditujukan untuk penemuan layanan tambahan (LaunchDaemons/unit systemd sistem/schtasks), bukan probe kesehatan RPC yang lebih mendalam.

## Beberapa gateway (host yang sama)

Sebagian besar instalasi sebaiknya menjalankan satu gateway per mesin. Satu gateway dapat menampung beberapa
agen dan channel.

Anda hanya memerlukan beberapa gateway saat Anda secara sengaja menginginkan isolasi atau bot penyelamat.

Pemeriksaan berguna:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Yang diharapkan:

- `gateway status --deep` dapat melaporkan `Other gateway-like services detected (best effort)`
  dan mencetak petunjuk pembersihan saat instalasi launchd/systemd/schtasks usang masih ada.
- `gateway probe` dapat memperingatkan tentang `multiple reachable gateways` saat lebih dari satu target
  menjawab.
- Jika itu disengaja, isolasikan port, konfigurasi/status, dan root workspace per gateway.

Checklist per instance:

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

## Endpoint otak real-time VoiceClaw

OpenClaw mengekspos endpoint WebSocket real-time yang kompatibel dengan VoiceClaw di
`/voiceclaw/realtime`. Gunakan ini saat klien desktop VoiceClaw harus berbicara
langsung ke otak OpenClaw real-time alih-alih melalui proses relay terpisah.

Endpoint ini menggunakan Gemini Live untuk audio real-time dan memanggil OpenClaw sebagai
otak dengan mengekspos alat OpenClaw langsung ke Gemini Live. Panggilan alat mengembalikan hasil
`working` langsung untuk menjaga giliran suara tetap responsif, lalu OpenClaw
mengeksekusi alat sebenarnya secara asinkron dan menyuntikkan hasilnya kembali ke
sesi live. Tetapkan `GEMINI_API_KEY` di lingkungan proses gateway. Jika
autentikasi gateway diaktifkan, klien desktop mengirim token atau kata sandi gateway
dalam pesan `session.config` pertamanya.

Akses otak real-time menjalankan perintah agen OpenClaw yang diotorisasi pemilik. Batasi
`gateway.auth.mode: "none"` hanya untuk instance uji loopback. Koneksi otak real-time
non-lokal memerlukan autentikasi gateway.

Untuk gateway uji yang terisolasi, jalankan instance terpisah dengan port, konfigurasi,
dan statusnya sendiri:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Lalu konfigurasikan VoiceClaw untuk menggunakan:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Akses jarak jauh

Disarankan: Tailscale/VPN.
Fallback: tunnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Lalu hubungkan klien secara lokal ke `ws://127.0.0.1:18789`.

<Warning>
Tunnel SSH tidak melewati autentikasi gateway. Untuk autentikasi rahasia bersama, klien tetap
harus mengirim `token`/`password` bahkan melalui tunnel. Untuk mode yang membawa identitas,
permintaan tetap harus memenuhi jalur autentikasi tersebut.
</Warning>

Lihat: [Gateway Jarak Jauh](/id/gateway/remote), [Autentikasi](/id/gateway/authentication), [Tailscale](/id/gateway/tailscale).

## Supervisi dan siklus hidup layanan

Gunakan eksekusi tersupervisi untuk keandalan seperti produksi.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Gunakan `openclaw gateway restart` untuk mulai ulang. Jangan merantai `openclaw gateway stop` dan `openclaw gateway start`; di macOS, `gateway stop` secara sengaja menonaktifkan LaunchAgent sebelum menghentikannya.

Label LaunchAgent adalah `ai.openclaw.gateway` (default) atau `ai.openclaw.<profile>` (profil bernama). `openclaw doctor` mengaudit dan memperbaiki drift konfigurasi layanan.

  </Tab>

  <Tab title="Linux (pengguna systemd)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Untuk persistensi setelah logout, aktifkan lingering:

```bash
sudo loginctl enable-linger <user>
```

Contoh unit pengguna manual saat Anda memerlukan path instalasi khusus:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
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

Startup terkelola Windows native menggunakan Scheduled Task bernama `OpenClaw Gateway`
(atau `OpenClaw Gateway (<profile>)` untuk profil bernama). Jika pembuatan Scheduled Task
ditolak, OpenClaw kembali ke peluncur folder Startup per pengguna
yang menunjuk ke `gateway.cmd` di dalam direktori status.

  </Tab>

  <Tab title="Linux (layanan sistem)">

Gunakan unit sistem untuk host multi-pengguna/selalu aktif.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Gunakan isi layanan yang sama seperti unit pengguna, tetapi instal di bawah
`/etc/systemd/system/openclaw-gateway[-<profile>].service` dan sesuaikan
`ExecStart=` jika binary `openclaw` Anda berada di tempat lain.

Jangan juga membiarkan `openclaw doctor --fix` menginstal layanan gateway tingkat-pengguna untuk profil/port yang sama. Doctor menolak instalasi otomatis tersebut saat menemukan layanan gateway OpenClaw tingkat-sistem; gunakan `OPENCLAW_SERVICE_REPAIR_POLICY=external` saat unit sistem memiliki siklus hidupnya.

  </Tab>
</Tabs>

## Jalur cepat profil dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Default mencakup status/konfigurasi terisolasi dan port gateway dasar `19001`.

## Referensi cepat protokol (tampilan operator)

- Frame klien pertama harus berupa `connect`.
- Gateway mengembalikan snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, batas/kebijakan).
- `hello-ok.features.methods` / `events` adalah daftar penemuan konservatif, bukan
  dump yang dihasilkan dari setiap rute helper yang dapat dipanggil.
- Permintaan: `req(method, params)` → `res(ok/payload|error)`.
- Event umum mencakup `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, event siklus hidup pairing/persetujuan, dan `shutdown`.

Eksekusi agen berlangsung dalam dua tahap:

1. Ack diterima langsung (`status:"accepted"`)
2. Respons penyelesaian final (`status:"ok"|"error"`), dengan event `agent` yang distream di antaranya.

Lihat dokumentasi protokol lengkap: [Protokol Gateway](/id/gateway/protocol).

## Pemeriksaan operasional

### Liveness

- Buka WS dan kirim `connect`.
- Harapkan respons `hello-ok` dengan cuplikan.

### Kesiapan

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Pemulihan celah

Peristiwa tidak diputar ulang. Saat ada celah urutan, segarkan keadaan (`health`, `system-presence`) sebelum melanjutkan.

## Tanda kegagalan umum

| Tanda                                                          | Kemungkinan masalah                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Bind non-loopback tanpa jalur auth gateway yang valid                           |
| `another gateway instance is already listening` / `EADDRINUSE` | Konflik port                                                                    |
| `Gateway start blocked: set gateway.mode=local`                | Konfigurasi diatur ke mode remote, atau stempel mode lokal hilang dari konfigurasi yang rusak |
| `unauthorized` saat connect                                    | Ketidakcocokan auth antara klien dan gateway                                    |

Untuk tangga diagnosis lengkap, gunakan [Pemecahan Masalah Gateway](/id/gateway/troubleshooting).

## Jaminan keamanan

- Klien protokol Gateway gagal cepat saat Gateway tidak tersedia (tidak ada fallback channel langsung implisit).
- Frame pertama yang tidak valid/bukan connect ditolak dan ditutup.
- Shutdown yang anggun memancarkan peristiwa `shutdown` sebelum socket ditutup.

---

Terkait:

- [Pemecahan masalah](/id/gateway/troubleshooting)
- [Proses Latar Belakang](/id/gateway/background-process)
- [Konfigurasi](/id/gateway/configuration)
- [Kesehatan](/id/gateway/health)
- [Doctor](/id/gateway/doctor)
- [Autentikasi](/id/gateway/authentication)

## Terkait

- [Konfigurasi](/id/gateway/configuration)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
- [Akses remote](/id/gateway/remote)
- [Manajemen rahasia](/id/gateway/secrets)
