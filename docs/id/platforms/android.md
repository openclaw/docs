---
read_when:
    - Melakukan pairing atau menghubungkan ulang node Android
    - Men-debug discovery atau auth Gateway Android
    - Memverifikasi paritas riwayat obrolan di seluruh klien
summary: 'Aplikasi Android (node): runbook koneksi + permukaan perintah Connect/Chat/Voice/Canvas'
title: Aplikasi Android
x-i18n:
    generated_at: "2026-04-24T09:16:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31b538a5bf45e78fde34e77a31384295b3e96f2fff6b3adfe37e5c569d858472
    source_path: platforms/android.md
    workflow: 15
---

> **Catatan:** Aplikasi Android belum dirilis secara publik. Source code tersedia di [repositori OpenClaw](https://github.com/openclaw/openclaw) di bawah `apps/android`. Anda dapat membangunnya sendiri menggunakan Java 17 dan Android SDK (`./gradlew :app:assemblePlayDebug`). Lihat [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) untuk instruksi build.

## Snapshot dukungan

- Peran: aplikasi node pendamping (Android tidak meng-host Gateway).
- Gateway diperlukan: ya (jalankan di macOS, Linux, atau Windows melalui WSL2).
- Instalasi: [Memulai](/id/start/getting-started) + [Pairing](/id/channels/pairing).
- Gateway: [Runbook](/id/gateway) + [Konfigurasi](/id/gateway/configuration).
  - Protokol: [Protokol Gateway](/id/gateway/protocol) (node + control plane).

## Kontrol sistem

Kontrol sistem (launchd/systemd) berada di host Gateway. Lihat [Gateway](/id/gateway).

## Runbook koneksi

Aplikasi node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android terhubung langsung ke WebSocket Gateway dan menggunakan pairing perangkat (`role: node`).

Untuk Tailscale atau host publik, Android memerlukan endpoint yang aman:

- Pilihan utama: Tailscale Serve / Funnel dengan `https://<magicdns>` / `wss://<magicdns>`
- Juga didukung: URL Gateway `wss://` lain dengan endpoint TLS sungguhan
- `ws://` plaintext tetap didukung pada alamat LAN privat / host `.local`, ditambah `localhost`, `127.0.0.1`, dan bridge emulator Android (`10.0.2.2`)

### Prasyarat

- Anda dapat menjalankan Gateway di mesin “master”.
- Perangkat/emulator Android dapat menjangkau WebSocket Gateway:
  - LAN yang sama dengan mDNS/NSD, **atau**
  - tailnet Tailscale yang sama menggunakan Wide-Area Bonjour / unicast DNS-SD (lihat di bawah), **atau**
  - host/port Gateway manual (fallback)
- Pairing seluler tailnet/publik **tidak** menggunakan endpoint `ws://` IP tailnet mentah. Gunakan Tailscale Serve atau URL `wss://` lain sebagai gantinya.
- Anda dapat menjalankan CLI (`openclaw`) di mesin Gateway (atau melalui SSH).

### 1) Jalankan Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Konfirmasi di log Anda melihat sesuatu seperti:

- `listening on ws://0.0.0.0:18789`

Untuk akses Android remote melalui Tailscale, utamakan Serve/Funnel alih-alih bind tailnet mentah:

```bash
openclaw gateway --tailscale serve
```

Ini memberi Android endpoint `wss://` / `https://` yang aman. Penyiapan `gateway.bind: "tailnet"` biasa tidak cukup untuk pairing Android remote pertama kali kecuali Anda juga mengakhiri TLS secara terpisah.

### 2) Verifikasi discovery (opsional)

Dari mesin Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Catatan debug lebih lanjut: [Bonjour](/id/gateway/bonjour).

Jika Anda juga mengonfigurasi domain discovery wide-area, bandingkan dengan:

```bash
openclaw gateway discover --json
```

Itu menampilkan `local.` plus domain wide-area yang dikonfigurasi dalam satu eksekusi dan menggunakan
endpoint layanan hasil resolve alih-alih hanya petunjuk TXT.

#### Discovery tailnet (Wina ⇄ London) melalui unicast DNS-SD

Discovery Android NSD/mDNS tidak melintasi jaringan. Jika node Android dan Gateway Anda berada di jaringan yang berbeda tetapi terhubung melalui Tailscale, gunakan Wide-Area Bonjour / unicast DNS-SD sebagai gantinya.

Discovery saja tidak cukup untuk pairing Android tailnet/publik. Rute yang ditemukan tetap membutuhkan endpoint aman (`wss://` atau Tailscale Serve):

1. Siapkan zona DNS-SD (contoh `openclaw.internal.`) di host Gateway dan publikasikan record `_openclaw-gw._tcp`.
2. Konfigurasikan Tailscale split DNS untuk domain pilihan Anda agar menunjuk ke server DNS tersebut.

Detail dan contoh konfigurasi CoreDNS: [Bonjour](/id/gateway/bonjour).

### 3) Hubungkan dari Android

Di aplikasi Android:

- Aplikasi menjaga koneksi Gateway tetap hidup melalui **foreground service** (notifikasi persisten).
- Buka tab **Connect**.
- Gunakan mode **Setup Code** atau **Manual**.
- Jika discovery terblokir, gunakan host/port manual di **Advanced controls**. Untuk host LAN privat, `ws://` tetap berfungsi. Untuk host Tailscale/publik, aktifkan TLS dan gunakan endpoint `wss://` / Tailscale Serve.

Setelah pairing pertama berhasil, Android akan menghubungkan ulang otomatis saat diluncurkan:

- Endpoint manual (jika diaktifkan), jika tidak
- Gateway terakhir yang ditemukan (best-effort).

### 4) Setujui pairing (CLI)

Di mesin Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detail pairing: [Pairing](/id/channels/pairing).

### 5) Verifikasi bahwa node terhubung

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

- Riwayat: `chat.history` (dinormalkan untuk tampilan; tag direktif inline dihapus dari teks yang terlihat, payload XML tool-call teks biasa (termasuk
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan
  blok tool-call yang terpotong) serta token kontrol model ASCII/full-width yang bocor
  dihapus, baris asisten yang hanya berisi token senyap murni seperti `NO_REPLY` /
  `no_reply` persis dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder)
- Kirim: `chat.send`
- Pembaruan push (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + kamera

#### Canvas Host Gateway (disarankan untuk konten web)

Jika Anda ingin node menampilkan HTML/CSS/JS nyata yang dapat diedit agen di disk, arahkan node ke canvas host Gateway.

Catatan: node memuat canvas dari server HTTP Gateway (port yang sama dengan `gateway.port`, default `18789`).

1. Buat `~/.openclaw/workspace/canvas/index.html` di host Gateway.

2. Navigasikan node ke sana (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opsional): jika kedua perangkat berada di Tailscale, gunakan nama MagicDNS atau IP tailnet alih-alih `.local`, mis. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Server ini menyuntikkan klien live-reload ke HTML dan memuat ulang saat file berubah.
Host A2UI berada di `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Perintah canvas (hanya foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (gunakan `{"url":""}` atau `{"url":"/"}` untuk kembali ke scaffold default). `canvas.snapshot` mengembalikan `{ format, base64 }` (default `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias lama `canvas.a2ui.pushJSONL`)

Perintah kamera (hanya foreground; bergantung izin):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Lihat [Node kamera](/id/nodes/camera) untuk parameter dan helper CLI.

### 8) Voice + permukaan perintah Android yang diperluas

- Voice: Android menggunakan satu alur mic hidup/mati di tab Voice dengan penangkapan transkrip dan pemutaran `talk.speak`. TTS sistem lokal hanya digunakan saat `talk.speak` tidak tersedia. Voice berhenti saat aplikasi keluar dari foreground.
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
Assistant). Saat dikonfigurasi, menahan tombol home atau mengucapkan "Hey Google, ask
OpenClaw..." membuka aplikasi dan menyerahkan prompt ke composer chat.

Ini menggunakan metadata **App Actions** Android yang dideklarasikan di manifest aplikasi. Tidak
diperlukan konfigurasi tambahan di sisi Gateway -- intent asisten ditangani sepenuhnya
oleh aplikasi Android dan diteruskan sebagai pesan chat biasa.

<Note>
Ketersediaan App Actions bergantung pada perangkat, versi Google Play Services,
dan apakah pengguna telah menetapkan OpenClaw sebagai aplikasi asisten default.
</Note>

## Penerusan notifikasi

Android dapat meneruskan notifikasi perangkat ke Gateway sebagai event. Beberapa kontrol memungkinkan Anda membatasi notifikasi mana yang diteruskan dan kapan.

| Key                              | Type           | Deskripsi                                                                                   |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Hanya teruskan notifikasi dari nama package ini. Jika disetel, semua package lain diabaikan. |
| `notifications.denyPackages`     | string[]       | Jangan pernah teruskan notifikasi dari nama package ini. Diterapkan setelah `allowPackages`. |
| `notifications.quietHours.start` | string (HH:mm) | Awal jendela jam tenang (waktu lokal perangkat). Notifikasi ditekan selama jendela ini.    |
| `notifications.quietHours.end`   | string (HH:mm) | Akhir jendela jam tenang.                                                                   |
| `notifications.rateLimit`        | number         | Maksimum notifikasi yang diteruskan per package per menit. Notifikasi berlebih dibuang.    |

Pemilih notifikasi juga menggunakan perilaku yang lebih aman untuk event notifikasi yang diteruskan, mencegah penerusan tidak sengaja atas notifikasi sistem yang sensitif.

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
Penerusan notifikasi memerlukan izin Android Notification Listener. Aplikasi akan meminta ini selama penyiapan.
</Note>

## Terkait

- [Aplikasi iOS](/id/platforms/ios)
- [Nodes](/id/nodes)
- [Pemecahan masalah node Android](/id/nodes/troubleshooting)
