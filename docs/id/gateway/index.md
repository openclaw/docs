---
read_when:
    - Menjalankan atau men-debug proses Gateway
summary: Panduan operasional untuk layanan Gateway, siklus hidup, dan operasi
title: Panduan operasional Gateway
x-i18n:
    generated_at: "2026-05-10T19:36:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54f868e0b263e346876fb5c4f6a359e8a6f6802871f6931668ebe57140ca2711
    source_path: gateway/index.md
    workflow: 16
---

Gunakan halaman ini untuk startup hari ke-1 dan operasi hari ke-2 layanan Gateway.

<CardGroup cols={2}>
  <Card title="Pemecahan masalah mendalam" icon="siren" href="/id/gateway/troubleshooting">
    Diagnostik berbasis gejala dengan tangga perintah persis dan tanda tangan log.
  </Card>
  <Card title="Konfigurasi" icon="sliders" href="/id/gateway/configuration">
    Panduan penyiapan berorientasi tugas + referensi konfigurasi lengkap.
  </Card>
  <Card title="Manajemen secret" icon="key-round" href="/id/gateway/secrets">
    Kontrak SecretRef, perilaku snapshot runtime, dan operasi migrasi/muat ulang.
  </Card>
  <Card title="Kontrak rencana secret" icon="shield-check" href="/id/gateway/secrets-plan-contract">
    Aturan target/jalur `secrets apply` yang persis dan perilaku profil autentikasi hanya-ref.
  </Card>
</CardGroup>

## Startup lokal 5 menit

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

Baseline sehat: `Runtime: running`, `Connectivity probe: ok`, dan `Capability: ...` yang sesuai dengan harapan Anda. Gunakan `openclaw gateway status --require-rpc` saat Anda membutuhkan bukti RPC cakupan-baca, bukan hanya keterjangkauan.

  </Step>

  <Step title="Validasi kesiapan channel">

```bash
openclaw channels status --probe
```

Dengan gateway yang dapat dijangkau, ini menjalankan probe channel per akun secara live dan audit opsional.
Jika gateway tidak dapat dijangkau, CLI kembali ke ringkasan channel khusus konfigurasi
alih-alih output probe live.

  </Step>
</Steps>

<Note>
Muat ulang konfigurasi Gateway memantau jalur file konfigurasi aktif (diselesaikan dari default profil/state, atau `OPENCLAW_CONFIG_PATH` jika disetel).
Mode default adalah `gateway.reload.mode="hybrid"`.
Setelah pemuatan pertama yang berhasil, proses yang berjalan melayani snapshot konfigurasi aktif dalam memori; muat ulang yang berhasil menukar snapshot itu secara atomik.
</Note>

## Model runtime

- Satu proses selalu aktif untuk routing, control plane, dan koneksi channel.
- Satu port multipleks untuk:
  - Kontrol/RPC WebSocket
  - API HTTP, kompatibel OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - UI kontrol dan hook
- Mode bind default: `loopback`.
- Autentikasi diwajibkan secara default. Penyiapan shared-secret menggunakan
  `gateway.auth.token` / `gateway.auth.password` (atau
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), dan penyiapan reverse-proxy
  non-loopback dapat menggunakan `gateway.auth.mode: "trusted-proxy"`.

## Endpoint kompatibel OpenAI

Permukaan kompatibilitas OpenClaw dengan dampak tertinggi sekarang adalah:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Mengapa rangkaian ini penting:

- Sebagian besar integrasi Open WebUI, LobeChat, dan LibreChat mem-probe `/v1/models` terlebih dahulu.
- Banyak pipeline RAG dan memori mengharapkan `/v1/embeddings`.
- Klien agent-native semakin memilih `/v1/responses`.

Catatan perencanaan:

- `/v1/models` mengutamakan agen: endpoint ini mengembalikan `openclaw`, `openclaw/default`, dan `openclaw/<agentId>`.
- `openclaw/default` adalah alias stabil yang selalu dipetakan ke agen default yang dikonfigurasi.
- Gunakan `x-openclaw-model` saat Anda menginginkan override provider/model backend; jika tidak, model normal dan penyiapan embedding agen yang dipilih tetap memegang kendali.

Semua ini berjalan pada port Gateway utama dan menggunakan batas autentikasi operator tepercaya yang sama seperti API HTTP Gateway lainnya.

### Prioritas port dan bind

| Pengaturan  | Urutan resolusi                                                |
| ------------ | ------------------------------------------------------------- |
| Port Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Mode bind    | CLI/override → `gateway.bind` → `loopback`                    |

Layanan gateway yang diinstal mencatat `--port` yang diselesaikan dalam metadata supervisor. Setelah mengubah `gateway.port`, jalankan `openclaw doctor --fix` atau `openclaw gateway install --force` agar launchd/systemd/schtasks memulai proses pada port baru.

Startup Gateway menggunakan port dan bind efektif yang sama saat menyemai origin
UI Kontrol lokal untuk bind non-loopback. Misalnya, `--bind lan --port 3000`
menyemai `http://localhost:3000` dan `http://127.0.0.1:3000` sebelum validasi
runtime berjalan. Tambahkan origin browser jarak jauh apa pun, seperti URL proxy HTTPS, ke
`gateway.controlUi.allowedOrigins` secara eksplisit.

### Mode hot reload

| `gateway.reload.mode` | Perilaku                                      |
| --------------------- | --------------------------------------------- |
| `off`                 | Tidak ada muat ulang konfigurasi              |
| `hot`                 | Terapkan hanya perubahan yang aman-hot        |
| `restart`             | Mulai ulang pada perubahan yang perlu restart |
| `hybrid` (default)    | Terapkan-hot saat aman, restart saat wajib    |

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

`gateway status --deep` adalah untuk penemuan layanan tambahan (LaunchDaemons/unit sistem systemd/schtasks), bukan probe kesehatan RPC yang lebih mendalam.

## Beberapa gateway (host yang sama)

Sebagian besar instalasi sebaiknya menjalankan satu gateway per mesin. Satu gateway dapat menampung beberapa
agen dan channel.

Anda hanya membutuhkan beberapa gateway saat sengaja menginginkan isolasi atau bot penyelamat.

Pemeriksaan berguna:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Yang perlu diharapkan:

- `gateway status --deep` dapat melaporkan `Other gateway-like services detected (best effort)`
  dan mencetak petunjuk pembersihan saat instalasi launchd/systemd/schtasks yang usang masih ada.
- `gateway probe` dapat memperingatkan tentang `multiple reachable gateways` saat lebih dari satu target
  menjawab.
- Jika itu disengaja, isolasikan port, konfigurasi/state, dan root workspace per gateway.

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

Lihat: [Gateway Jarak Jauh](/id/gateway/remote), [Autentikasi](/id/gateway/authentication), [Tailscale](/id/gateway/tailscale).

## Supervisi dan siklus hidup layanan

Gunakan run yang diawasi untuk reliabilitas seperti produksi.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Gunakan `openclaw gateway restart` untuk restart. Jangan rangkai `openclaw gateway stop` dan `openclaw gateway start` sebagai pengganti restart.

Di macOS, `gateway stop` menggunakan `launchctl bootout` secara default — ini menghapus LaunchAgent dari sesi boot saat ini tanpa menyimpan status nonaktif, sehingga pemulihan otomatis KeepAlive tetap berfungsi setelah crash tak terduga dan `gateway start` mengaktifkan ulang dengan bersih. Untuk menekan auto-respawn secara persisten lintas reboot, berikan `--disable`: `openclaw gateway stop --disable`.

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

Contoh user-unit manual saat Anda membutuhkan jalur instalasi kustom:

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
(atau `OpenClaw Gateway (<profile>)` untuk profil bernama). Jika pembuatan Scheduled Task
ditolak, OpenClaw fallback ke launcher Startup-folder per pengguna
yang menunjuk ke `gateway.cmd` di dalam direktori state.

  </Tab>

  <Tab title="Linux (layanan sistem)">

Gunakan unit sistem untuk host multipengguna/selalu aktif.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Gunakan body layanan yang sama seperti unit pengguna, tetapi instal di bawah
`/etc/systemd/system/openclaw-gateway[-<profile>].service` dan sesuaikan
`ExecStart=` jika biner `openclaw` Anda berada di tempat lain.

Jangan juga membiarkan `openclaw doctor --fix` menginstal layanan gateway tingkat pengguna untuk profil/port yang sama. Doctor menolak instalasi otomatis itu saat menemukan layanan gateway OpenClaw tingkat sistem; gunakan `OPENCLAW_SERVICE_REPAIR_POLICY=external` saat unit sistem memiliki siklus hidup.

  </Tab>
</Tabs>

## Jalur cepat profil dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Default mencakup state/konfigurasi terisolasi dan port gateway dasar `19001`.

## Referensi cepat protokol (tampilan operator)

- Frame klien pertama harus berupa `connect`.
- Gateway mengembalikan snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, batas/kebijakan).
- `hello-ok.features.methods` / `events` adalah daftar penemuan konservatif, bukan
  dump yang dihasilkan dari setiap rute helper yang dapat dipanggil.
- Permintaan: `req(method, params)` → `res(ok/payload|error)`.
- Event umum mencakup `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, event siklus hidup pairing/approval, dan `shutdown`.

Run agen terdiri dari dua tahap:

1. Ack diterima segera (`status:"accepted"`)
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

### Pemulihan gap

Event tidak diputar ulang. Pada gap urutan, segarkan state (`health`, `system-presence`) sebelum melanjutkan.

## Tanda tangan kegagalan umum

| Pola                                                           | Kemungkinan masalah                                                             |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Bind non-loopback tanpa jalur autentikasi gateway yang valid                    |
| `another gateway instance is already listening` / `EADDRINUSE` | Konflik port                                                                    |
| `Gateway start blocked: set gateway.mode=local`                | Config disetel ke mode jarak jauh, atau stempel mode lokal hilang dari config yang rusak |
| `unauthorized` during connect                                  | Ketidakcocokan autentikasi antara klien dan gateway                             |

Untuk tangga diagnosis lengkap, gunakan [Pemecahan Masalah Gateway](/id/gateway/troubleshooting).

## Jaminan keamanan

- Klien protokol Gateway gagal cepat saat Gateway tidak tersedia (tanpa fallback saluran langsung implisit).
- Frame pertama yang tidak valid/tidak tersambung ditolak dan ditutup.
- Shutdown yang anggun memancarkan event `shutdown` sebelum socket ditutup.

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
- [Akses jarak jauh](/id/gateway/remote)
- [Manajemen rahasia](/id/gateway/secrets)
