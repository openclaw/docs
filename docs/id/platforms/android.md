---
read_when:
    - Melakukan pairing atau menyambungkan ulang node Android
    - Men-debug penemuan gateway atau auth Android
    - Memverifikasi kesetaraan riwayat chat di seluruh klien
summary: 'Aplikasi Android (node): runbook koneksi + permukaan perintah Connect/Chat/Voice/Canvas'
title: Aplikasi Android
x-i18n:
    generated_at: "2026-04-05T14:00:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2223891afc3aa34af4aaf5410b4f1c6aebcf24bab68a6c47dd9832882d5260db
    source_path: platforms/android.md
    workflow: 15
---

# Aplikasi Android (Node)

> **Catatan:** Aplikasi Android belum dirilis secara publik. Kode sumber tersedia di [repositori OpenClaw](https://github.com/openclaw/openclaw) di bawah `apps/android`. Anda dapat membangunnya sendiri menggunakan Java 17 dan Android SDK (`./gradlew :app:assemblePlayDebug`). Lihat [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) untuk instruksi build.

## Ringkasan dukungan

- Peran: aplikasi node pendamping (Android tidak meng-host Gateway).
- Gateway diperlukan: ya (jalankan di macOS, Linux, atau Windows melalui WSL2).
- Instalasi: [Getting Started](/start/getting-started) + [Pairing](/id/channels/pairing).
- Gateway: [Runbook](/id/gateway) + [Konfigurasi](/id/gateway/configuration).
  - Protokol: [Protokol Gateway](/id/gateway/protocol) (node + control plane).

## Kontrol sistem

Kontrol sistem (launchd/systemd) berada di host Gateway. Lihat [Gateway](/id/gateway).

## Runbook Koneksi

Aplikasi node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android terhubung langsung ke Gateway WebSocket dan menggunakan pairing perangkat (`role: node`).

Untuk host Tailscale atau publik, Android memerlukan endpoint yang aman:

- Disarankan: Tailscale Serve / Funnel dengan `https://<magicdns>` / `wss://<magicdns>`
- Juga didukung: URL Gateway `wss://` lain dengan endpoint TLS nyata
- `ws://` cleartext tetap didukung pada alamat LAN privat / host `.local`, serta `localhost`, `127.0.0.1`, dan bridge emulator Android (`10.0.2.2`)

### Prasyarat

- Anda dapat menjalankan Gateway di mesin “master”.
- Perangkat/emulator Android dapat menjangkau gateway WebSocket:
  - LAN yang sama dengan mDNS/NSD, **atau**
  - Tailnet Tailscale yang sama menggunakan Wide-Area Bonjour / unicast DNS-SD (lihat di bawah), **atau**
  - Host/port gateway manual (fallback)
- Pairing seluler tailnet/publik **tidak** menggunakan endpoint `ws://` IP tailnet mentah. Gunakan Tailscale Serve atau URL `wss://` lain sebagai gantinya.
- Anda dapat menjalankan CLI (`openclaw`) di mesin gateway (atau melalui SSH).

### 1) Mulai Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Konfirmasikan di log Anda melihat sesuatu seperti:

- `listening on ws://0.0.0.0:18789`

Untuk akses Android jarak jauh melalui Tailscale, utamakan Serve/Funnel daripada bind tailnet mentah:

```bash
openclaw gateway --tailscale serve
```

Ini memberi Android endpoint `wss://` / `https://` yang aman. Penyiapan `gateway.bind: "tailnet"` biasa saja tidak cukup untuk pairing Android jarak jauh pertama kali kecuali Anda juga mengakhiri TLS secara terpisah.

### 2) Verifikasi penemuan (opsional)

Dari mesin gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Catatan debugging lainnya: [Bonjour](/id/gateway/bonjour).

Jika Anda juga mengonfigurasi domain penemuan wide-area, bandingkan dengan:

```bash
openclaw gateway discover --json
```

Itu menampilkan `local.` plus domain wide-area yang dikonfigurasi dalam satu kali jalan dan menggunakan
endpoint layanan yang telah di-resolve alih-alih petunjuk hanya-TXT.

#### Penemuan tailnet (Wina ⇄ London) melalui unicast DNS-SD

Penemuan Android NSD/mDNS tidak akan lintas jaringan. Jika node Android dan gateway Anda berada di jaringan berbeda tetapi terhubung melalui Tailscale, gunakan Wide-Area Bonjour / unicast DNS-SD sebagai gantinya.

Penemuan saja tidak cukup untuk pairing Android tailnet/publik. Rute yang ditemukan tetap memerlukan endpoint aman (`wss://` atau Tailscale Serve):

1. Siapkan zona DNS-SD (contoh `openclaw.internal.`) di host gateway dan publikasikan record `_openclaw-gw._tcp`.
2. Konfigurasikan split DNS Tailscale untuk domain pilihan Anda yang menunjuk ke server DNS tersebut.

Detail dan contoh konfigurasi CoreDNS: [Bonjour](/id/gateway/bonjour).

### 3) Terhubung dari Android

Di aplikasi Android:

- Aplikasi menjaga koneksi gateway tetap hidup melalui **foreground service** (notifikasi persisten).
- Buka tab **Connect**.
- Gunakan mode **Setup Code** atau **Manual**.
- Jika penemuan terblokir, gunakan host/port manual di **Advanced controls**. Untuk host LAN privat, `ws://` tetap berfungsi. Untuk host Tailscale/publik, aktifkan TLS dan gunakan endpoint `wss://` / Tailscale Serve.

Setelah pairing pertama berhasil, Android akan menyambung ulang otomatis saat dibuka:

- Endpoint manual (jika diaktifkan), jika tidak
- Gateway terakhir yang ditemukan (best-effort).

### 4) Setujui pairing (CLI)

Di mesin gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detail pairing: [Pairing](/id/channels/pairing).

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

Tab Chat Android mendukung pemilihan sesi (default `main`, plus sesi lain yang sudah ada):

- Riwayat: `chat.history` (dinormalisasi untuk tampilan; tag direktif inline dihapus dari teks yang terlihat, payload XML panggilan tool teks-biasa — termasuk
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan
  blok panggilan tool yang terpotong — serta token kontrol model ASCII/full-width yang bocor
  dihapus, baris asisten token-senyap murni seperti `NO_REPLY` / `no_reply` yang persis sama dihilangkan,
  dan baris yang terlalu besar dapat diganti dengan placeholder)
- Kirim: `chat.send`
- Push update (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + kamera

#### Host Canvas Gateway (direkomendasikan untuk konten web)

Jika Anda ingin node menampilkan HTML/CSS/JS nyata yang dapat diedit agent di disk, arahkan node ke host canvas Gateway.

Catatan: node memuat canvas dari server HTTP Gateway (port yang sama dengan `gateway.port`, default `18789`).

1. Buat `~/.openclaw/workspace/canvas/index.html` di host gateway.

2. Arahkan node ke sana (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opsional): jika kedua perangkat berada di Tailscale, gunakan nama MagicDNS atau IP tailnet alih-alih `.local`, misalnya `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Server ini menyuntikkan klien live-reload ke HTML dan memuat ulang saat file berubah.
Host A2UI berada di `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Perintah canvas (hanya foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (gunakan `{"url":""}` atau `{"url":"/"}` untuk kembali ke scaffold default). `canvas.snapshot` mengembalikan `{ format, base64 }` (default `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias legacy `canvas.a2ui.pushJSONL`)

Perintah kamera (hanya foreground; dibatasi izin):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Lihat [Node kamera](/nodes/camera) untuk parameter dan helper CLI.

### 8) Voice + permukaan perintah Android yang diperluas

- Voice: Android menggunakan satu alur mic nyala/mati di tab Voice dengan penangkapan transkrip dan pemutaran `talk.speak`. TTS sistem lokal hanya digunakan saat `talk.speak` tidak tersedia. Voice berhenti saat aplikasi keluar dari foreground.
- Toggle voice wake/talk-mode saat ini dihapus dari UX/runtime Android.
- Keluarga perintah Android tambahan (ketersediaan bergantung pada perangkat + izin):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (lihat [Penerusan notifikasi](#notification-forwarding) di bawah)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Entrypoint asisten

Android mendukung peluncuran OpenClaw dari pemicu asisten sistem (Google
Assistant). Jika dikonfigurasi, menahan tombol home atau mengucapkan "Hey Google, ask
OpenClaw..." akan membuka aplikasi dan menyerahkan prompt ke penyusun chat.

Ini menggunakan metadata Android **App Actions** yang dideklarasikan dalam manifest aplikasi. Tidak
ada konfigurasi tambahan yang diperlukan di sisi gateway -- intent asisten
ditangani sepenuhnya oleh aplikasi Android dan diteruskan sebagai pesan chat biasa.

<Note>
Ketersediaan App Actions bergantung pada perangkat, versi Google Play Services,
dan apakah pengguna telah menetapkan OpenClaw sebagai aplikasi asisten default.
</Note>

## Penerusan notifikasi

Android dapat meneruskan notifikasi perangkat ke gateway sebagai event. Beberapa kontrol memungkinkan Anda membatasi notifikasi mana yang diteruskan dan kapan.

| Key                              | Type           | Description                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Hanya teruskan notifikasi dari nama paket ini. Jika disetel, semua paket lainnya diabaikan.      |
| `notifications.denyPackages`     | string[]       | Jangan pernah teruskan notifikasi dari nama paket ini. Diterapkan setelah `allowPackages`.       |
| `notifications.quietHours.start` | string (HH:mm) | Awal jendela jam tenang (waktu lokal perangkat). Notifikasi ditekan selama jendela ini.          |
| `notifications.quietHours.end`   | string (HH:mm) | Akhir jendela jam tenang.                                                                         |
| `notifications.rateLimit`        | number         | Jumlah maksimum notifikasi yang diteruskan per paket per menit. Notifikasi berlebih dibuang.     |

Pemilih notifikasi juga menggunakan perilaku yang lebih aman untuk event notifikasi yang diteruskan, sehingga mencegah penerusan notifikasi sistem sensitif secara tidak sengaja.

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
Penerusan notifikasi memerlukan izin Android Notification Listener. Aplikasi akan meminta izin ini saat penyiapan.
</Note>
