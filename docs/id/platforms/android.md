---
read_when:
    - Menyandingkan atau menghubungkan kembali Node Android
    - Mendiagnosis penemuan atau autentikasi Gateway Android
    - Memverifikasi paritas riwayat obrolan di seluruh klien
summary: 'Aplikasi Android (node): runbook koneksi + permukaan perintah Connect/Chat/Voice/Canvas'
title: Aplikasi Android
x-i18n:
    generated_at: "2026-04-30T09:58:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae8bec406a006165f124f305e00c848f5527d43dba3cbcd07bd0d7e6f0dcc247
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Aplikasi Android belum dirilis secara publik. Kode sumber tersedia di [repositori OpenClaw](https://github.com/openclaw/openclaw) di bawah `apps/android`. Anda dapat membangunnya sendiri menggunakan Java 17 dan Android SDK (`./gradlew :app:assemblePlayDebug`). Lihat [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) untuk instruksi build.
</Note>

## Cuplikan dukungan

- Peran: aplikasi node pendamping (Android tidak meng-host Gateway).
- Gateway diperlukan: ya (jalankan di macOS, Linux, atau Windows melalui WSL2).
- Instal: [Memulai](/id/start/getting-started) + [Pemasangan](/id/channels/pairing).
- Gateway: [Runbook](/id/gateway) + [Konfigurasi](/id/gateway/configuration).
  - Protokol: [Protokol Gateway](/id/gateway/protocol) (node + control plane).

## Kontrol sistem

Kontrol sistem (launchd/systemd) berada di host Gateway. Lihat [Gateway](/id/gateway).

## Runbook koneksi

Aplikasi node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android terhubung langsung ke WebSocket Gateway dan menggunakan pemasangan perangkat (`role: node`).

Untuk Tailscale atau host publik, Android memerlukan endpoint aman:

- Disarankan: Tailscale Serve / Funnel dengan `https://<magicdns>` / `wss://<magicdns>`
- Juga didukung: URL Gateway `wss://` lain dengan endpoint TLS sungguhan
- Cleartext `ws://` tetap didukung pada alamat LAN privat / host `.local`, serta `localhost`, `127.0.0.1`, dan bridge emulator Android (`10.0.2.2`)

### Prasyarat

- Anda dapat menjalankan Gateway pada mesin “master”.
- Perangkat/emulator Android dapat menjangkau WebSocket gateway:
  - LAN yang sama dengan mDNS/NSD, **atau**
  - Tailnet Tailscale yang sama menggunakan Wide-Area Bonjour / unicast DNS-SD (lihat di bawah), **atau**
  - Host/port gateway manual (fallback)
- Pemasangan mobile tailnet/publik **tidak** menggunakan endpoint IP tailnet mentah `ws://`. Gunakan Tailscale Serve atau URL `wss://` lain sebagai gantinya.
- Anda dapat menjalankan CLI (`openclaw`) pada mesin gateway (atau melalui SSH).

### 1) Mulai Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Konfirmasi di log bahwa Anda melihat sesuatu seperti:

- `listening on ws://0.0.0.0:18789`

Untuk akses Android jarak jauh melalui Tailscale, pilih Serve/Funnel alih-alih bind tailnet mentah:

```bash
openclaw gateway --tailscale serve
```

Ini memberi Android endpoint `wss://` / `https://` yang aman. Penyiapan `gateway.bind: "tailnet"` biasa tidak cukup untuk pemasangan Android jarak jauh pertama kali kecuali Anda juga mengakhiri TLS secara terpisah.

### 2) Verifikasi penemuan (opsional)

Dari mesin gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Catatan debugging lainnya: [Bonjour](/id/gateway/bonjour).

Jika Anda juga mengonfigurasi domain penemuan area luas, bandingkan dengan:

```bash
openclaw gateway discover --json
```

Itu menampilkan `local.` plus domain area luas yang dikonfigurasi dalam satu lintasan dan menggunakan endpoint layanan yang di-resolve alih-alih hint TXT saja.

#### Penemuan tailnet (Vienna ⇄ London) melalui unicast DNS-SD

Penemuan NSD/mDNS Android tidak akan melintasi jaringan. Jika node Android dan gateway Anda berada di jaringan berbeda tetapi terhubung melalui Tailscale, gunakan Wide-Area Bonjour / unicast DNS-SD sebagai gantinya.

Penemuan saja tidak cukup untuk pemasangan Android tailnet/publik. Rute yang ditemukan tetap memerlukan endpoint aman (`wss://` atau Tailscale Serve):

1. Siapkan zona DNS-SD (contoh `openclaw.internal.`) pada host gateway dan publikasikan record `_openclaw-gw._tcp`.
2. Konfigurasikan split DNS Tailscale untuk domain pilihan Anda yang mengarah ke server DNS tersebut.

Detail dan contoh konfigurasi CoreDNS: [Bonjour](/id/gateway/bonjour).

### 3) Hubungkan dari Android

Di aplikasi Android:

- Aplikasi menjaga koneksi gateway tetap hidup melalui **foreground service** (notifikasi persisten).
- Buka tab **Connect**.
- Gunakan mode **Setup Code** atau **Manual**.
- Jika penemuan diblokir, gunakan host/port manual di **Advanced controls**. Untuk host LAN privat, `ws://` tetap berfungsi. Untuk host Tailscale/publik, aktifkan TLS dan gunakan endpoint `wss://` / Tailscale Serve.

Setelah pemasangan pertama berhasil, Android otomatis terhubung kembali saat diluncurkan:

- Endpoint manual (jika diaktifkan), jika tidak
- Gateway terakhir yang ditemukan (upaya terbaik).

### Beacon presence alive

Setelah sesi node terautentikasi terhubung, dan saat aplikasi berpindah ke latar belakang sementara foreground service masih terhubung, Android memanggil `node.event` dengan `event: "node.presence.alive"`. Gateway mencatat ini sebagai `lastSeenAtMs`/`lastSeenReason` pada metadata node/perangkat yang dipasangkan hanya setelah identitas perangkat node terautentikasi diketahui.

Aplikasi menghitung beacon sebagai berhasil dicatat hanya ketika respons gateway menyertakan `handled: true`. Gateway lama mungkin mengakui `node.event` dengan `{ "ok": true }`; respons itu kompatibel tetapi tidak dihitung sebagai pembaruan terakhir terlihat yang tahan lama.

### 4) Setujui pemasangan (CLI)

Pada mesin gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detail pemasangan: [Pemasangan](/id/channels/pairing).

Opsional: jika node Android selalu terhubung dari subnet yang dikontrol ketat, Anda dapat ikut serta dalam persetujuan otomatis node pertama kali dengan CIDR eksplisit atau IP tepat:

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

Ini dinonaktifkan secara default. Ini hanya berlaku untuk pemasangan `role: node` baru tanpa scope yang diminta. Pemasangan operator/browser dan perubahan peran, scope, metadata, atau kunci publik apa pun tetap memerlukan persetujuan manual.

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

- Riwayat: `chat.history` (dinormalisasi untuk tampilan; tag direktif inline dihapus dari teks yang terlihat, payload XML panggilan tool teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok panggilan tool yang terpotong) serta token kontrol model ASCII/full-width yang bocor dihapus, baris assistant token senyap murni seperti `NO_REPLY` / `no_reply` persis dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder)
- Kirim: `chat.send`
- Pembaruan push (upaya terbaik): `chat.subscribe` → `event:"chat"`

### 7) Canvas + kamera

#### Host Canvas Gateway (disarankan untuk konten web)

Jika Anda ingin node menampilkan HTML/CSS/JS nyata yang dapat diedit agent di disk, arahkan node ke host canvas Gateway.

<Note>
Node memuat canvas dari server HTTP Gateway (port yang sama dengan `gateway.port`, default `18789`).
</Note>

1. Buat `~/.openclaw/workspace/canvas/index.html` pada host gateway.

2. Navigasikan node ke sana (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opsional): jika kedua perangkat berada di Tailscale, gunakan nama MagicDNS atau IP tailnet alih-alih `.local`, mis. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Server ini menyuntikkan klien live-reload ke HTML dan memuat ulang saat file berubah.
Host A2UI berada di `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Perintah canvas (hanya foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (gunakan `{"url":""}` atau `{"url":"/"}` untuk kembali ke scaffold default). `canvas.snapshot` mengembalikan `{ format, base64 }` (default `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` alias lama)

Perintah kamera (hanya foreground; dibatasi izin):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Lihat [Node kamera](/id/nodes/camera) untuk parameter dan helper CLI.

### 8) Suara + permukaan perintah Android yang diperluas

- Tab Voice: Android memiliki dua mode perekaman eksplisit. **Mic** adalah sesi tab Voice manual yang mengirim setiap jeda sebagai giliran chat dan berhenti saat aplikasi keluar dari foreground atau pengguna meninggalkan tab Voice. **Talk** adalah Talk Mode kontinu dan terus mendengarkan sampai dimatikan atau node terputus.
- Talk Mode mempromosikan foreground service yang ada dari `dataSync` menjadi `dataSync|microphone` sebelum perekaman dimulai, lalu menurunkannya saat Talk Mode berhenti. Android 14+ memerlukan deklarasi `FOREGROUND_SERVICE_MICROPHONE`, izin runtime `RECORD_AUDIO`, dan tipe layanan mikrofon saat runtime.
- Balasan lisan menggunakan `talk.speak` melalui penyedia Talk gateway yang dikonfigurasi. TTS sistem lokal hanya digunakan saat `talk.speak` tidak tersedia.
- Voice wake tetap dinonaktifkan di UX/runtime Android.
- Keluarga perintah Android tambahan (ketersediaan bergantung pada perangkat + izin):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (lihat [Penerusan notifikasi](#notification-forwarding) di bawah)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Entry point assistant

Android mendukung peluncuran OpenClaw dari pemicu assistant sistem (Google Assistant). Saat dikonfigurasi, menahan tombol home atau mengatakan "Hey Google, ask OpenClaw..." membuka aplikasi dan menyerahkan prompt ke composer chat.

Ini menggunakan metadata **App Actions** Android yang dideklarasikan dalam manifest aplikasi. Tidak diperlukan konfigurasi tambahan di sisi gateway -- intent assistant ditangani sepenuhnya oleh aplikasi Android dan diteruskan sebagai pesan chat normal.

<Note>
Ketersediaan App Actions bergantung pada perangkat, versi Google Play Services, dan apakah pengguna telah menetapkan OpenClaw sebagai aplikasi assistant default.
</Note>

## Penerusan notifikasi

Android dapat meneruskan notifikasi perangkat ke gateway sebagai event. Beberapa kontrol memungkinkan Anda membatasi notifikasi mana yang diteruskan dan kapan.

| Kunci                            | Tipe           | Deskripsi                                                                                         |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Hanya teruskan notifikasi dari nama paket ini. Jika disetel, semua paket lain diabaikan.          |
| `notifications.denyPackages`     | string[]       | Jangan pernah teruskan notifikasi dari nama paket ini. Diterapkan setelah `allowPackages`.        |
| `notifications.quietHours.start` | string (HH:mm) | Awal jendela jam tenang (waktu perangkat lokal). Notifikasi ditekan selama jendela ini.           |
| `notifications.quietHours.end`   | string (HH:mm) | Akhir jendela jam tenang.                                                                         |
| `notifications.rateLimit`        | number         | Maksimum notifikasi yang diteruskan per paket per menit. Notifikasi berlebih akan dibuang.        |

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
Penerusan notifikasi memerlukan izin Android Notification Listener. Aplikasi meminta izin ini selama penyiapan.
</Note>

## Terkait

- [Aplikasi iOS](/id/platforms/ios)
- [Node](/id/nodes)
- [Pemecahan masalah node Android](/id/nodes/troubleshooting)
