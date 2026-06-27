---
read_when:
    - Menjalankan atau men-debug proses Gateway
summary: Runbook untuk layanan Gateway, siklus hidup, dan operasi
title: Panduan operasional Gateway
x-i18n:
    generated_at: "2026-06-27T17:30:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0bbbcad26df135e1475cbeb14f1299b48bae62be759b2e6c6f82164d175601b
    source_path: gateway/index.md
    workflow: 16
---

Gunakan halaman ini untuk startup hari pertama dan operasi hari kedua layanan Gateway.

<CardGroup cols={2}>
  <Card title="Deep troubleshooting" icon="siren" href="/id/gateway/troubleshooting">
    Diagnostik berbasis gejala dengan urutan perintah persis dan signature log.
  </Card>
  <Card title="Configuration" icon="sliders" href="/id/gateway/configuration">
    Panduan penyiapan berorientasi tugas + referensi konfigurasi lengkap.
  </Card>
  <Card title="Secrets management" icon="key-round" href="/id/gateway/secrets">
    Kontrak SecretRef, perilaku snapshot runtime, dan operasi migrasi/muat ulang.
  </Card>
  <Card title="Secrets plan contract" icon="shield-check" href="/id/gateway/secrets-plan-contract">
    Aturan target/path `secrets apply` yang persis dan perilaku profil autentikasi hanya-ref.
  </Card>
</CardGroup>

## Startup lokal 5 menit

<Steps>
  <Step title="Start the Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Verify service health">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Baseline sehat: `Runtime: running`, `Connectivity probe: ok`, dan `Capability: ...` yang sesuai dengan ekspektasi Anda. Gunakan `openclaw gateway status --require-rpc` saat Anda memerlukan bukti RPC cakupan-baca, bukan sekadar keterjangkauan.

  </Step>

  <Step title="Validate channel readiness">

```bash
openclaw channels status --probe
```

Dengan Gateway yang dapat dijangkau, ini menjalankan probe channel langsung per akun dan audit opsional.
Jika Gateway tidak dapat dijangkau, CLI beralih ke ringkasan channel hanya-konfigurasi alih-alih
output probe langsung.

  </Step>
</Steps>

<Note>
Muat ulang konfigurasi Gateway memantau path file konfigurasi aktif (diselesaikan dari default profil/state, atau `OPENCLAW_CONFIG_PATH` saat disetel).
Mode default adalah `gateway.reload.mode="hybrid"`.
Setelah pemuatan berhasil pertama, proses yang berjalan menyajikan snapshot konfigurasi dalam memori yang aktif; muat ulang yang berhasil menukar snapshot tersebut secara atomik.
</Note>

## Model runtime

- Satu proses selalu aktif untuk perutean, control plane, dan koneksi channel.
- Satu port termultipleks untuk:
  - Kontrol/RPC WebSocket
  - API HTTP (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Rute HTTP Plugin, seperti `/api/v1/admin/rpc` opsional
  - Control UI dan hook
- Mode bind default: `loopback`.
- Autentikasi diwajibkan secara default. Penyiapan shared-secret menggunakan
  `gateway.auth.token` / `gateway.auth.password` (atau
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), dan penyiapan reverse-proxy
  non-loopback dapat menggunakan `gateway.auth.mode: "trusted-proxy"`.

## Endpoint yang kompatibel dengan OpenAI

Permukaan kompatibilitas OpenClaw dengan leverage tertinggi sekarang adalah:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Mengapa kumpulan ini penting:

- Sebagian besar integrasi Open WebUI, LobeChat, dan LibreChat memeriksa `/v1/models` terlebih dahulu.
- Banyak pipeline RAG dan memori mengharapkan `/v1/embeddings`.
- Klien native-agent semakin memilih `/v1/responses`.

Catatan perencanaan:

- `/v1/models` mengutamakan agent: endpoint ini mengembalikan `openclaw`, `openclaw/default`, dan `openclaw/<agentId>`.
- `openclaw/default` adalah alias stabil yang selalu memetakan ke agent default yang dikonfigurasi.
- Gunakan `x-openclaw-model` saat Anda menginginkan override provider/model backend; jika tidak, model normal dan penyiapan embedding agent yang dipilih tetap memegang kendali.

Semua ini berjalan pada port Gateway utama dan menggunakan batas autentikasi operator tepercaya yang sama seperti API HTTP Gateway lainnya.

RPC HTTP admin (`POST /api/v1/admin/rpc`) adalah rute Plugin terpisah yang nonaktif secara default untuk tooling host yang tidak dapat menggunakan RPC WebSocket. Lihat [RPC HTTP Admin](/id/plugins/admin-http-rpc).

### Prioritas port dan bind

| Pengaturan   | Urutan resolusi                                             |
| ------------ | ----------------------------------------------------------- |
| Port Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Mode bind    | CLI/override → `gateway.bind` → `loopback`                  |

Layanan Gateway yang terinstal mencatat `--port` yang terselesaikan dalam metadata supervisor. Setelah mengubah `gateway.port`, jalankan `openclaw doctor --fix` atau `openclaw gateway install --force` agar launchd/systemd/schtasks memulai proses pada port baru.

Startup Gateway menggunakan port dan bind efektif yang sama saat mengisi origin
Control UI lokal untuk bind non-loopback. Misalnya, `--bind lan --port 3000`
mengisi `http://localhost:3000` dan `http://127.0.0.1:3000` sebelum validasi
runtime berjalan. Tambahkan origin browser jarak jauh apa pun, seperti URL proxy HTTPS, ke
`gateway.controlUi.allowedOrigins` secara eksplisit.

### Mode hot reload

| `gateway.reload.mode` | Perilaku                                  |
| --------------------- | ----------------------------------------- |
| `off`                 | Tidak ada muat ulang konfigurasi          |
| `hot`                 | Terapkan hanya perubahan yang aman-hot    |
| `restart`             | Mulai ulang pada perubahan yang memerlukan muat ulang |
| `hybrid` (default)    | Terapkan-hot saat aman, mulai ulang saat diperlukan |

## Kumpulan perintah operator

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

`gateway status --deep` digunakan untuk penemuan layanan tambahan (LaunchDaemons/unit sistem systemd/schtasks), bukan probe kesehatan RPC yang lebih dalam.

## Beberapa Gateway (host yang sama)

Sebagian besar instalasi sebaiknya menjalankan satu Gateway per mesin. Satu Gateway dapat meng-host beberapa
agent dan channel.

Anda hanya memerlukan beberapa Gateway saat Anda sengaja menginginkan isolasi atau bot penyelamat.

Pemeriksaan berguna:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Yang perlu diharapkan:

- `gateway status --deep` dapat melaporkan `Other gateway-like services detected (best effort)`
  dan mencetak petunjuk pembersihan saat instalasi launchd/systemd/schtasks lama masih ada.
- `gateway probe` dapat memperingatkan tentang `multiple reachable gateway identities` saat Gateway yang berbeda
  menjawab, atau saat OpenClaw tidak dapat membuktikan target yang dapat dijangkau adalah Gateway yang sama.
  Tunnel SSH, URL proxy, atau URL jarak jauh yang dikonfigurasi ke Gateway yang sama adalah satu
  Gateway dengan beberapa transport, meskipun port transport berbeda.
- Jika itu disengaja, isolasikan port, konfigurasi/state, dan root workspace per Gateway.

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

Penyiapan mendetail: [/gateway/multiple-gateways](/id/gateway/multiple-gateways).

## Akses jarak jauh

Direkomendasikan: Tailscale/VPN.
Fallback: tunnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Lalu hubungkan klien secara lokal ke `ws://127.0.0.1:18789`.

<Warning>
Tunnel SSH tidak melewati autentikasi Gateway. Untuk autentikasi shared-secret, klien tetap
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

Gunakan `openclaw gateway restart` untuk mulai ulang. Jangan merangkai `openclaw gateway stop` dan `openclaw gateway start` sebagai pengganti mulai ulang.

Di macOS, `gateway stop` menggunakan `launchctl bootout` secara default — ini menghapus LaunchAgent dari sesi boot saat ini tanpa mempertahankan penonaktifan, sehingga pemulihan otomatis KeepAlive tetap berfungsi setelah crash tak terduga dan `gateway start` mengaktifkan ulang dengan bersih. Untuk menekan auto-respawn secara permanen lintas reboot, berikan `--disable`: `openclaw gateway stop --disable`.

Label LaunchAgent adalah `ai.openclaw.gateway` (default) atau `ai.openclaw.<profile>` (profil bernama). `openclaw doctor` mengaudit dan memperbaiki drift konfigurasi layanan.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Untuk persistensi setelah logout, aktifkan lingering:

```bash
sudo loginctl enable-linger <user>
```

Contoh user-unit manual saat Anda memerlukan path instalasi kustom:

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

Startup terkelola Windows native menggunakan Scheduled Task bernama `OpenClaw Gateway`
(atau `OpenClaw Gateway (<profile>)` untuk profil bernama). Jika pembuatan Scheduled Task
ditolak, OpenClaw beralih ke launcher folder Startup per pengguna
yang menunjuk ke `gateway.cmd` di dalam direktori state.

  </Tab>

  <Tab title="Linux (system service)">

Gunakan system unit untuk host multipengguna/selalu aktif.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Gunakan body layanan yang sama seperti user unit, tetapi instal di bawah
`/etc/systemd/system/openclaw-gateway[-<profile>].service` dan sesuaikan
`ExecStart=` jika binary `openclaw` Anda berada di tempat lain.

Jangan juga membiarkan `openclaw doctor --fix` menginstal layanan Gateway level pengguna untuk profil/port yang sama. Doctor menolak instalasi otomatis itu saat menemukan layanan Gateway OpenClaw level sistem; gunakan `OPENCLAW_SERVICE_REPAIR_POLICY=external` saat system unit memiliki siklus hidupnya.

  </Tab>
</Tabs>

## Jalur cepat profil dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Default mencakup state/konfigurasi terisolasi dan port Gateway dasar `19001`.

## Referensi cepat protokol (tampilan operator)

- Frame klien pertama harus `connect`.
- Gateway mengembalikan snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limit/kebijakan).
- `hello-ok.features.methods` / `events` adalah daftar penemuan konservatif, bukan
  dump yang dihasilkan dari setiap rute helper yang dapat dipanggil.
- Permintaan: `req(method, params)` → `res(ok/payload|error)`.
- Event umum mencakup `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, `sessions.changed`,
  `presence`, `tick`, `health`, `heartbeat`, event siklus hidup pairing/approval,
  dan `shutdown`.

Run agent memiliki dua tahap:

1. Ack diterima langsung (`status:"accepted"`)
2. Respons penyelesaian final (`status:"ok"|"error"`), dengan event `agent` yang di-stream di antaranya.

Lihat dokumentasi protokol lengkap: [Protokol Gateway](/id/gateway/protocol).

## Pemeriksaan operasional

### Liveness

- Buka WS dan kirim `connect`.
- Harapkan respons `hello-ok` dengan snapshot.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Pemulihan gap

Event tidak diputar ulang. Pada gap sequence, segarkan state (`health`, `system-presence`) sebelum melanjutkan.

## Signature kegagalan umum

| Tanda tangan                                                  | Kemungkinan masalah                                                                 |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Pengikatan non-loopback tanpa jalur auth gateway yang valid                         |
| `another gateway instance is already listening` / `EADDRINUSE` | Konflik port                                                                        |
| `Gateway start blocked: set gateway.mode=local`                | Konfigurasi diatur ke mode remote, atau stempel mode lokal hilang dari konfigurasi yang rusak |
| `unauthorized` during connect                                  | Ketidakcocokan auth antara klien dan Gateway                                        |

Untuk tangga diagnosis lengkap, gunakan [Pemecahan Masalah Gateway](/id/gateway/troubleshooting).

## Jaminan keamanan

- Klien protokol Gateway gagal cepat saat Gateway tidak tersedia (tidak ada fallback direct-channel implisit).
- Frame pertama yang tidak valid/tidak terhubung ditolak dan ditutup.
- Shutdown anggun memancarkan peristiwa `shutdown` sebelum socket ditutup.

---

Terkait:

- [Pemecahan Masalah](/id/gateway/troubleshooting)
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
