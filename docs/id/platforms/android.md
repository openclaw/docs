---
read_when:
    - Menyandingkan atau menyambungkan ulang node Android
    - Men-debug discovery atau auth Gateway Android
    - Memverifikasi kesetaraan riwayat percakapan di seluruh klien
summary: 'Aplikasi Android (node): runbook koneksi + permukaan perintah Connect/Chat/Voice/Canvas'
title: Aplikasi Android
x-i18n:
    generated_at: "2026-06-27T17:41:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c02d4921c3f3011c09e564d83b773a7c155d17a82a6e70d3fd3e973597142f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Aplikasi Android resmi tersedia di [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN). Ini adalah node pendamping dan memerlukan OpenClaw Gateway yang sedang berjalan. Kode sumbernya juga tersedia di [repositori OpenClaw](https://github.com/openclaw/openclaw) di bawah `apps/android`; lihat [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) untuk instruksi build.
</Note>

## Cuplikan dukungan

- Peran: aplikasi node pendamping (Android tidak meng-host Gateway).
- Gateway diperlukan: ya (jalankan di macOS, Linux, atau Windows melalui WSL2).
- Instal: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) untuk aplikasi, [Memulai](/id/start/getting-started) untuk Gateway, lalu [Pairing](/id/channels/pairing).
- Gateway: [Runbook](/id/gateway) + [Konfigurasi](/id/gateway/configuration).
  - Protokol: [Protokol Gateway](/id/gateway/protocol) (node + bidang kontrol).

## Kontrol sistem

Kontrol sistem (launchd/systemd) berada di host Gateway. Lihat [Gateway](/id/gateway).

## Runbook koneksi

Aplikasi node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android terhubung langsung ke WebSocket Gateway dan menggunakan pairing perangkat (`role: node`).

Untuk Tailscale atau host publik, Android memerlukan endpoint aman:

- Disarankan: Tailscale Serve / Funnel dengan `https://<magicdns>` / `wss://<magicdns>`
- Juga didukung: URL Gateway `wss://` lain dengan endpoint TLS sungguhan
- `ws://` cleartext tetap didukung pada alamat LAN privat / host `.local`, ditambah `localhost`, `127.0.0.1`, dan bridge emulator Android (`10.0.2.2`)

### Prasyarat

- Anda dapat menjalankan Gateway di mesin "master".
- Perangkat/emulator Android dapat menjangkau WebSocket gateway:
  - LAN yang sama dengan mDNS/NSD, **atau**
  - Tailnet Tailscale yang sama menggunakan Wide-Area Bonjour / unicast DNS-SD (lihat di bawah), **atau**
  - Host/port gateway manual (fallback)
- Pairing seluler tailnet/publik **tidak** menggunakan endpoint IP tailnet mentah `ws://`. Gunakan Tailscale Serve atau URL `wss://` lain sebagai gantinya.
- Anda dapat menjalankan CLI (`openclaw`) di mesin gateway (atau melalui SSH).

### 1) Mulai Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Konfirmasi di log bahwa Anda melihat sesuatu seperti:

- `listening on ws://0.0.0.0:18789`

Untuk akses Android jarak jauh melalui Tailscale, utamakan Serve/Funnel alih-alih bind tailnet mentah:

```bash
openclaw gateway --tailscale serve
```

Ini memberi Android endpoint `wss://` / `https://` yang aman. Penyiapan `gateway.bind: "tailnet"` biasa tidak cukup untuk pairing Android jarak jauh pertama kali kecuali Anda juga menghentikan TLS secara terpisah.

### 2) Verifikasi discovery (opsional)

Dari mesin gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Catatan debugging lainnya: [Bonjour](/id/gateway/bonjour).

Jika Anda juga mengonfigurasi domain discovery wide-area, bandingkan dengan:

```bash
openclaw gateway discover --json
```

Itu menampilkan `local.` ditambah domain wide-area yang dikonfigurasi dalam satu kali proses dan menggunakan endpoint layanan yang di-resolve alih-alih petunjuk TXT saja.

#### Discovery tailnet (Vienna ⇄ London) melalui unicast DNS-SD

Discovery NSD/mDNS Android tidak akan melintasi jaringan. Jika node Android dan gateway Anda berada di jaringan berbeda tetapi terhubung melalui Tailscale, gunakan Wide-Area Bonjour / unicast DNS-SD sebagai gantinya.

Discovery saja tidak cukup untuk pairing Android tailnet/publik. Rute yang ditemukan tetap memerlukan endpoint aman (`wss://` atau Tailscale Serve):

1. Siapkan zona DNS-SD (contoh `openclaw.internal.`) di host gateway dan publikasikan record `_openclaw-gw._tcp`.
2. Konfigurasikan DNS split Tailscale untuk domain pilihan Anda yang mengarah ke server DNS tersebut.

Detail dan contoh konfigurasi CoreDNS: [Bonjour](/id/gateway/bonjour).

### 3) Hubungkan dari Android

Di aplikasi Android:

- Aplikasi menjaga koneksi gateway tetap hidup melalui **foreground service** (notifikasi persisten).
- Buka tab **Hubungkan**.
- Gunakan mode **Kode Penyiapan** atau **Manual**.
- Jika discovery diblokir, gunakan host/port manual di **Kontrol lanjutan**. Untuk host LAN privat, `ws://` masih berfungsi. Untuk host Tailscale/publik, aktifkan TLS dan gunakan endpoint `wss://` / Tailscale Serve.

Setelah pairing pertama berhasil, Android otomatis terhubung kembali saat diluncurkan:

- Endpoint manual (jika diaktifkan), jika tidak
- Gateway terakhir yang ditemukan (upaya terbaik).

### Beacon presence alive

Setelah sesi node terautentikasi terhubung, dan saat aplikasi berpindah ke latar belakang sementara foreground service masih terhubung, Android memanggil `node.event` dengan `event: "node.presence.alive"`. Gateway mencatat ini sebagai `lastSeenAtMs`/`lastSeenReason` pada metadata node/perangkat yang dipasangkan hanya setelah identitas perangkat node terautentikasi diketahui.

Aplikasi menghitung beacon sebagai berhasil dicatat hanya ketika respons gateway menyertakan `handled: true`. Gateway lama dapat mengakui `node.event` dengan `{ "ok": true }`; respons itu kompatibel tetapi tidak dihitung sebagai pembaruan last-seen yang tahan lama.

### 4) Setujui pairing (CLI)

Di mesin gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detail pairing: [Pairing](/id/channels/pairing).

Opsional: jika node Android selalu terhubung dari subnet yang dikontrol ketat, Anda dapat memilih persetujuan otomatis node pertama kali dengan CIDR eksplisit atau IP tepat:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Ini dinonaktifkan secara default. Ini hanya berlaku untuk pairing `role: node` baru tanpa scope yang diminta. Pairing operator/browser dan perubahan peran, scope, metadata, atau public key apa pun tetap memerlukan persetujuan manual.

### 5) Verifikasi node terhubung

- Melalui status node:

  ```bash
  openclaw nodes status
  ```

- Melalui Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + riwayat

Tab Chat Android mendukung pemilihan sesi (default `main`, ditambah sesi lain yang sudah ada):

- Riwayat: `chat.history` (dinormalisasi untuk tampilan; tag direktif inline dihapus dari teks yang terlihat, payload XML pemanggilan alat teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok pemanggilan alat yang terpotong) serta token kontrol model ASCII/full-width yang bocor dihapus, baris asisten token senyap murni seperti `NO_REPLY` / `no_reply` persis dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder)
- Kirim: `chat.send`
- Pembaruan push (upaya terbaik): `chat.subscribe` → `event:"chat"`

### 7) Canvas + kamera

#### Host Canvas Gateway (disarankan untuk konten web)

Jika Anda ingin node menampilkan HTML/CSS/JS sungguhan yang dapat diedit agen di disk, arahkan node ke host canvas Gateway.

<Note>
Node memuat canvas dari server HTTP Gateway (port yang sama dengan `gateway.port`, default `18789`).
</Note>

1. Buat `~/.openclaw/workspace/canvas/index.html` di host gateway.

2. Arahkan node ke sana (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opsional): jika kedua perangkat berada di Tailscale, gunakan nama MagicDNS atau IP tailnet alih-alih `.local`, misalnya `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Server ini menyuntikkan klien live-reload ke HTML dan memuat ulang saat file berubah.
Gateway juga menyajikan `/__openclaw__/a2ui/`, tetapi aplikasi Android memperlakukan halaman A2UI jarak jauh sebagai hanya-render. Perintah A2UI yang mendukung aksi menggunakan halaman A2UI bawaan milik aplikasi sebelum menerapkan pesan.

Perintah canvas (hanya foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (gunakan `{"url":""}` atau `{"url":"/"}` untuk kembali ke scaffold default). `canvas.snapshot` mengembalikan `{ format, base64 }` (default `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` alias lama). Perintah ini menggunakan halaman A2UI bawaan milik aplikasi untuk rendering yang mendukung aksi.

Perintah kamera (hanya foreground; dibatasi izin):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Lihat [Node kamera](/id/nodes/camera) untuk parameter dan helper CLI.

### 8) Suara + permukaan perintah Android yang diperluas

- Tab Suara: Android memiliki dua mode pengambilan eksplisit. **Mic** adalah sesi tab Suara manual yang mengirim setiap jeda sebagai giliran chat dan berhenti ketika aplikasi meninggalkan foreground atau pengguna meninggalkan tab Suara. **Talk** adalah Mode Talk berkelanjutan dan terus mendengarkan sampai dinonaktifkan atau node terputus.
- Mode Talk mempromosikan foreground service yang ada dari `connectedDevice` menjadi `connectedDevice|microphone` sebelum pengambilan dimulai, lalu menurunkannya ketika Mode Talk berhenti. Layanan node mendeklarasikan `FOREGROUND_SERVICE_CONNECTED_DEVICE` dengan `CHANGE_NETWORK_STATE`; Android 14+ juga memerlukan deklarasi `FOREGROUND_SERVICE_MICROPHONE`, grant runtime `RECORD_AUDIO`, dan jenis layanan mikrofon saat runtime.
- Secara default, Android Talk menggunakan pengenalan suara native, chat Gateway, dan `talk.speak` melalui penyedia Talk gateway yang dikonfigurasi. TTS sistem lokal hanya digunakan ketika `talk.speak` tidak tersedia.
- Android Talk menggunakan relay Gateway realtime hanya ketika `talk.realtime.mode` adalah `realtime` dan `talk.realtime.transport` adalah `gateway-relay`.
- Voice wake tetap dinonaktifkan di UX/runtime Android.
- Keluarga perintah Android tambahan (ketersediaan bergantung pada perangkat, izin, dan pengaturan pengguna):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` hanya ketika **Pengaturan > Kapabilitas Ponsel > Aplikasi Terinstal** diaktifkan; ini mencantumkan aplikasi yang terlihat di launcher secara default.
  - `notifications.list`, `notifications.actions` (lihat [Penerusan notifikasi](#notification-forwarding) di bawah)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Entry point asisten

Android mendukung peluncuran OpenClaw dari pemicu asisten sistem (Google Assistant). Saat dikonfigurasi, menahan tombol home atau mengatakan "Hey Google, ask OpenClaw..." membuka aplikasi dan menyerahkan prompt ke penyusun chat.

Ini menggunakan metadata **App Actions** Android yang dideklarasikan dalam manifes aplikasi. Tidak diperlukan konfigurasi tambahan di sisi gateway -- intent asisten ditangani sepenuhnya oleh aplikasi Android dan diteruskan sebagai pesan chat biasa.

<Note>
Ketersediaan App Actions bergantung pada perangkat, versi Google Play Services, dan apakah pengguna telah menetapkan OpenClaw sebagai aplikasi asisten default.
</Note>

## Penerusan notifikasi

Android dapat meneruskan notifikasi perangkat ke gateway sebagai event. Beberapa kontrol memungkinkan Anda membatasi notifikasi mana yang diteruskan dan kapan.

| Kunci                            | Tipe           | Deskripsi                                                                                         |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Hanya teruskan notifikasi dari nama paket ini. Jika diatur, semua paket lain diabaikan.           |
| `notifications.denyPackages`     | string[]       | Jangan pernah teruskan notifikasi dari nama paket ini. Diterapkan setelah `allowPackages`.        |
| `notifications.quietHours.start` | string (HH:mm) | Awal jendela jam tenang (waktu perangkat lokal). Notifikasi ditekan selama jendela ini.           |
| `notifications.quietHours.end`   | string (HH:mm) | Akhir jendela jam tenang.                                                                         |
| `notifications.rateLimit`        | number         | Maksimum notifikasi yang diteruskan per paket per menit. Notifikasi berlebih dibuang.             |

Pemilih notifikasi juga menggunakan perilaku yang lebih aman untuk event notifikasi yang diteruskan, mencegah penerusan notifikasi sistem sensitif secara tidak sengaja.

Contoh konfigurasi:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
Penerusan notifikasi memerlukan izin Android Notification Listener. Aplikasi akan memintanya selama penyiapan.
</Note>

## Terkait

- [Aplikasi iOS](/id/platforms/ios)
- [Nodes](/id/nodes)
- [Pemecahan masalah node Android](/id/nodes/troubleshooting)
