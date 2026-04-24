---
read_when:
    - Menjalankan atau men-debug proses gateway
summary: Runbook untuk layanan Gateway, siklus hidup, dan operasi
title: Runbook Gateway
x-i18n:
    generated_at: "2026-04-24T09:08:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6192a38447424b7e9437a7420f37d08fc38d27b736ce8c30347e6d52e3430600
    source_path: gateway/index.md
    workflow: 15
---

Gunakan halaman ini untuk startup hari pertama dan operasi hari kedua layanan Gateway.

<CardGroup cols={2}>
  <Card title="Pemecahan masalah mendalam" icon="siren" href="/id/gateway/troubleshooting">
    Diagnostik berbasis gejala dengan langkah perintah dan signature log yang persis.
  </Card>
  <Card title="Konfigurasi" icon="sliders" href="/id/gateway/configuration">
    Panduan penyiapan berorientasi tugas + referensi konfigurasi lengkap.
  </Card>
  <Card title="Pengelolaan Secrets" icon="key-round" href="/id/gateway/secrets">
    Kontrak SecretRef, perilaku snapshot runtime, dan operasi migrasi/reload.
  </Card>
  <Card title="Kontrak paket Secrets" icon="shield-check" href="/id/gateway/secrets-plan-contract">
    Aturan target/path `secrets apply` yang persis dan perilaku auth-profile hanya-ref.
  </Card>
</CardGroup>

## Startup lokal 5 menit

<Steps>
  <Step title="Mulai Gateway">

```bash
openclaw gateway --port 18789
# debug/trace dicerminkan ke stdio
openclaw gateway --port 18789 --verbose
# paksa matikan listener pada port yang dipilih, lalu mulai
openclaw gateway --force
```

  </Step>

  <Step title="Verifikasi health layanan">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Baseline sehat: `Runtime: running`, `Connectivity probe: ok`, dan `Capability: ...` yang sesuai dengan yang Anda harapkan. Gunakan `openclaw gateway status --require-rpc` saat Anda memerlukan bukti RPC cakupan-baca, bukan sekadar keterjangkauan.

  </Step>

  <Step title="Validasi kesiapan channel">

```bash
openclaw channels status --probe
```

Dengan gateway yang dapat dijangkau, ini menjalankan probe channel live per akun dan audit opsional.
Jika gateway tidak dapat dijangkau, CLI menggunakan fallback ke ringkasan channel berbasis config saja
alih-alih output probe live.

  </Step>
</Steps>

<Note>
Reload config Gateway mengawasi path file config aktif (di-resolve dari default profile/status, atau `OPENCLAW_CONFIG_PATH` saat diatur).
Mode default adalah `gateway.reload.mode="hybrid"`.
Setelah pemuatan berhasil pertama, proses yang berjalan melayani snapshot config aktif di memori; reload yang berhasil menukar snapshot itu secara atomik.
</Note>

## Model runtime

- Satu proses yang selalu aktif untuk perutean, control plane, dan koneksi channel.
- Satu port termultipleks untuk:
  - kontrol/RPC WebSocket
  - API HTTP, kompatibel OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI dan hook
- Mode bind default: `loopback`.
- Autentikasi diwajibkan secara default. Penyiapan shared-secret menggunakan
  `gateway.auth.token` / `gateway.auth.password` (atau
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), dan penyiapan
  reverse-proxy non-loopback dapat menggunakan `gateway.auth.mode: "trusted-proxy"`.

## Endpoint kompatibel OpenAI

Surface kompatibilitas dengan leverage tertinggi di OpenClaw sekarang adalah:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Mengapa set ini penting:

- Sebagian besar integrasi Open WebUI, LobeChat, dan LibreChat mem-probe `/v1/models` terlebih dahulu.
- Banyak pipeline RAG dan memori mengharapkan `/v1/embeddings`.
- Klien native-agen semakin memilih `/v1/responses`.

Catatan perencanaan:

- `/v1/models` bersifat agent-first: endpoint ini mengembalikan `openclaw`, `openclaw/default`, dan `openclaw/<agentId>`.
- `openclaw/default` adalah alias stabil yang selalu dipetakan ke agen default yang dikonfigurasi.
- Gunakan `x-openclaw-model` saat Anda menginginkan override provider/model backend; jika tidak, agen yang dipilih tetap mengendalikan model normal dan penyiapan embedding-nya.

Semua ini berjalan pada port Gateway utama dan menggunakan batas autentikasi operator tepercaya yang sama seperti sisa API HTTP Gateway.

### Prioritas port dan bind

| Pengaturan   | Urutan resolusi                                              |
| ------------ | ------------------------------------------------------------ |
| Port Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Mode bind    | CLI/override → `gateway.bind` → `loopback`                   |

### Mode hot reload

| `gateway.reload.mode` | Perilaku                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | Tidak ada reload config                    |
| `hot`                 | Terapkan hanya perubahan yang aman untuk hot |
| `restart`             | Restart pada perubahan yang memerlukan reload |
| `hybrid` (default)    | Terapkan hot saat aman, restart saat diperlukan |

## Set perintah operator

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

`gateway status --deep` adalah untuk penemuan layanan tambahan (LaunchDaemons/unit systemd sistem
/schtasks), bukan probe health RPC yang lebih dalam.

## Beberapa gateway (host yang sama)

Sebagian besar pemasangan sebaiknya menjalankan satu gateway per mesin. Satu gateway dapat menampung beberapa
agen dan channel.

Anda hanya memerlukan beberapa gateway saat Anda sengaja menginginkan isolasi atau bot penyelamat.

Pemeriksaan yang berguna:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Yang diharapkan:

- `gateway status --deep` dapat melaporkan `Other gateway-like services detected (best effort)`
  dan mencetak petunjuk pembersihan saat pemasangan launchd/systemd/schtasks lama masih ada.
- `gateway probe` dapat memperingatkan tentang `multiple reachable gateways` saat lebih dari satu target
  menjawab.
- Jika itu disengaja, isolasikan port, config/status, dan root workspace per gateway.

Checklist per instans:

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
Fallback: tunnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Lalu hubungkan klien secara lokal ke `ws://127.0.0.1:18789`.

<Warning>
Tunnel SSH tidak melewati autentikasi gateway. Untuk autentikasi shared-secret, klien tetap
harus mengirim `token`/`password` bahkan melalui tunnel. Untuk mode yang membawa identitas,
permintaan tetap harus memenuhi jalur autentikasi tersebut.
</Warning>

Lihat: [Gateway Remote](/id/gateway/remote), [Authentication](/id/gateway/authentication), [Tailscale](/id/gateway/tailscale).

## Supervisi dan siklus hidup layanan

Gunakan run yang disupervisi untuk keandalan yang menyerupai produksi.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Label LaunchAgent adalah `ai.openclaw.gateway` (default) atau `ai.openclaw.<profile>` (profile bernama). `openclaw doctor` mengaudit dan memperbaiki drift config layanan.

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

Contoh unit pengguna manual saat Anda memerlukan path pemasangan kustom:

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

Startup terkelola native Windows menggunakan Scheduled Task bernama `OpenClaw Gateway`
(atau `OpenClaw Gateway (<profile>)` untuk profile bernama). Jika pembuatan Scheduled Task
ditolak, OpenClaw menggunakan fallback ke peluncur Startup-folder per pengguna
yang mengarah ke `gateway.cmd` di dalam direktori status.

  </Tab>

  <Tab title="Linux (system service)">

Gunakan unit sistem untuk host multi-pengguna/selalu aktif.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Gunakan isi layanan yang sama seperti unit pengguna, tetapi pasang di bawah
`/etc/systemd/system/openclaw-gateway[-<profile>].service` dan sesuaikan
`ExecStart=` jika biner `openclaw` Anda berada di tempat lain.

  </Tab>
</Tabs>

## Jalur cepat profile dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Default mencakup status/config terisolasi dan port dasar gateway `19001`.

## Referensi cepat protokol (tampilan operator)

- Frame klien pertama harus `connect`.
- Gateway mengembalikan snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events` adalah daftar discovery yang konservatif, bukan
  dump yang dihasilkan dari setiap route helper yang dapat dipanggil.
- Request: `req(method, params)` → `res(ok/payload|error)`.
- Event umum mencakup `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, peristiwa siklus hidup pairing/persetujuan, dan `shutdown`.

Run agen bersifat dua tahap:

1. Ack diterima langsung (`status:"accepted"`)
2. Respons penyelesaian final (`status:"ok"|"error"`), dengan event `agent` yang di-stream di antaranya.

Lihat dokumen protokol lengkap: [Protokol Gateway](/id/gateway/protocol).

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

### Pemulihan celah

Event tidak diputar ulang. Pada celah urutan, segarkan status (`health`, `system-presence`) sebelum melanjutkan.

## Signature kegagalan umum

| Signature                                                     | Masalah yang mungkin                                                              |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Bind non-loopback tanpa jalur autentikasi gateway yang valid                      |
| `another gateway instance is already listening` / `EADDRINUSE` | Konflik port                                                                      |
| `Gateway start blocked: set gateway.mode=local`               | Config diatur ke mode remote, atau cap mode lokal hilang dari config yang rusak   |
| `unauthorized` during connect                                 | Ketidakcocokan autentikasi antara klien dan gateway                               |

Untuk langkah diagnosis lengkap, gunakan [Pemecahan Masalah Gateway](/id/gateway/troubleshooting).

## Jaminan keamanan

- Klien protokol Gateway gagal cepat saat Gateway tidak tersedia (tidak ada fallback implicit direct-channel).
- Frame pertama yang tidak valid/bukan connect ditolak dan koneksi ditutup.
- Shutdown graceful mengirim event `shutdown` sebelum socket ditutup.

---

Terkait:

- [Pemecahan masalah](/id/gateway/troubleshooting)
- [Proses Latar Belakang](/id/gateway/background-process)
- [Konfigurasi](/id/gateway/configuration)
- [Health](/id/gateway/health)
- [Doctor](/id/gateway/doctor)
- [Authentication](/id/gateway/authentication)

## Terkait

- [Konfigurasi](/id/gateway/configuration)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
- [Akses jarak jauh](/id/gateway/remote)
- [Pengelolaan Secrets](/id/gateway/secrets)
