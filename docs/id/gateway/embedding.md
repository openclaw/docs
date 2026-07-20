---
read_when:
    - Menyematkan OpenClaw dalam aplikasi desktop atau server
    - Mengawasi Gateway sebagai proses anak
    - Menangani kesiapan, mulai ulang, penghentian, atau konfigurasi tidak valid pada Gateway tanpa mengurai log
summary: Awasi Gateway OpenClaw sebagai proses anak dari Electron atau aplikasi host lainnya
title: Menyematkan OpenClaw
x-i18n:
    generated_at: "2026-07-20T14:08:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ca67e03994f21446bfeca58c95c2cb624dde767b9983a89982627145f80dfb90
    source_path: gateway/embedding.md
    workflow: 16
---

Host penyemat harus mengawasi executable `openclaw` yang terinstal, menggunakan
protokol WebSocket Gateway sebagai bidang kontrolnya, dan memperlakukan proses anak sebagai
runtime yang dapat diganti. Pendekatan ini membuat kepemilikan proses, kesiapan, pemulihan kegagalan,
dan peningkatan tetap eksplisit tanpa bergantung pada tata letak status privat OpenClaw.

Untuk autentikasi klien dan status penyambungan ulang, baca
[Membangun klien Gateway](https://docs.openclaw.ai/gateway/clients).

## Mulai proses anak dengan preset penyematan

Gunakan instalasi `node_modules` yang sebenarnya dan jalankan executable paket. Baseline yang
berguna untuk host yang memiliki siklus hidup penemuan, mulai ulang, dan saluran adalah:

```ts
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Berikan jalur absolut ke runtime Node sebenarnya yang dikelola oleh aplikasi host.
declare const hostNodeExecutable: string;

const packageEntry = fileURLToPath(import.meta.resolve("openclaw"));
const openclawEntry = resolve(dirname(packageEntry), "..", "openclaw.mjs");
const gateway = spawn(hostNodeExecutable, [openclawEntry, "gateway", "--allow-unconfigured"], {
  env: {
    ...process.env,
    OPENCLAW_DISABLE_BONJOUR: "1",
    OPENCLAW_EXEC_SHELL_SNAPSHOT: "0",
    OPENCLAW_NO_RESPAWN: "1",
    OPENCLAW_SKIP_CHANNELS: "1",
  },
  stdio: ["ignore", "inherit", "inherit"],
});
```

Resolusikan OpenClaw melalui paket yang terinstal seperti yang ditunjukkan; jangan berasumsi bahwa
biner `openclaw` lokal proyek tersedia di `PATH` proses host. Contoh ini
mewarisi keluaran agar proses anak tidak terblokir akibat pipa stdout atau stderr yang penuh. Jika
host mengambil alih aliran tersebut, pasang konsumen segera setelah proses dijalankan.

| Pengaturan                       | Efek penyematan                                                                                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DISABLE_BONJOUR=1`     | Menonaktifkan pengiklanan multicast LAN milik Gateway saat host mengelola penemuan.                                                                                                        |
| `OPENCLAW_NO_RESPAWN=1`          | Dalam proses anak penyematan yang tidak dikelola, mencegah OpenClaw menyerahkan mulai ulang pembaruan kepada proses anak yang dilepas. Mulai ulang rutin tetap berada dalam proses, sehingga host mempertahankan kepemilikan PID yang dilacak. |
| `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` | Menonaktifkan pengambilan snapshot shell login untuk perintah eksekusi host.                                                                                                               |
| `OPENCLAW_SKIP_CHANNELS=1`       | Melewati pemulaian dan pemuatan ulang saluran. Atur hanya jika aplikasi penyemat menginginkan Gateway khusus bidang kontrol atau WebChat.                                                 |

`--allow-unconfigured` hanya melewati pelindung pemulaian `gateway.mode=local`.
Opsi ini tidak menulis konfigurasi atau memperbaiki berkas yang tidak valid. Hilangkan opsi ini saat aplikasi
penyemat menyediakan konfigurasi lokal normal melalui orientasi awal, CLI konfigurasi,
atau RPC Gateway.

### Peringatan snapshot shell Electron

Pengambilan snapshot shell menjalankan `process.execPath -e <script>` dari shell login. Dalam
proses Node normal, `process.execPath` adalah executable Node. Di bawah Electron,
nilai tersebut adalah biner Electron, yang dapat menafsirkan pemanggilan itu sebagai peluncuran aplikasi
dan menampilkan popup "Unable to find Electron app". Atur
`OPENCLAW_EXEC_SHELL_SNAPSHOT=0` di lingkungan proses anak Gateway, bukan hanya di
proses perender. Karena alasan yang sama, `hostNodeExecutable` harus menunjuk ke
runtime Node sebenarnya, bukan `process.execPath` milik Electron.

## Tangani konfigurasi tidak valid berdasarkan kode keluar

Pemulaian Gateway menggunakan kode keluar `78` (`EX_CONFIG`) untuk kegagalan
pemulaian kelas konfigurasi, termasuk konfigurasi yang tidak valid. Buat percabangan berdasarkan kode keluar,
bukan dengan mengurai stderr yang dapat dibaca manusia:

1. Jalankan `openclaw doctor --fix --yes --non-interactive` terhadap lingkungan konfigurasi dan
   status yang sama dengan proses anak Gateway.
2. Coba mulai Gateway sekali lagi setelah doctor berhasil selesai.
3. Jika proses anak kembali keluar dengan `78`, hentikan perulangan perbaikan dan tampilkan
   kegagalan konfigurasi kepada pengguna.

Pertahankan stderr untuk diagnostik, tetapi jangan membuat keputusan siklus hidup berdasarkan susunan katanya.

Setelah pemulaian berhasil, pengeditan langsung konfigurasi yang tidak valid tidak terlalu merusak. Pengawas
konfigurasi mencatat bahwa pemuatan ulang dilewati dan terus melayani konfigurasi dalam memori terakhir
yang diterima. Perbaiki berkas, lalu biarkan pengawas menerima snapshot valid berikutnya.

## Tunggu kesiapan protokol

Gunakan sinyal WebSocket, bukan substring log:

1. Buka WebSocket Gateway.
2. Tunggu peristiwa `connect.challenge`. Peristiwa ini membuktikan bahwa listener menerima
   WebSocket dan handshake tantangan dapat dimulai.
3. Kirim `connect` dengan tanda tangan perangkat yang terikat pada tantangan.
4. Perlakukan `hello-ok` sebagai kesiapan aplikasi untuk RPC terautentikasi.

Tantangan sengaja dikirim lebih awal daripada inisialisasi penuh. Jika sidecar pemulaian
masih tertunda, `connect` mengembalikan galat `UNAVAILABLE` yang dapat dicoba ulang dengan
`details.reason: "startup-sidecars"`, `retryAfterMs` yang dibatasi, lalu menutup
dengan kode `1013` dan alasan `gateway starting`. Gunakan
`resolveGatewayStartupRetryAfterMs` dari
`@openclaw/gateway-protocol/startup-unavailable` atau kebijakan bawaan klien referensi, lalu sambungkan kembali.

## Tafsirkan mulai ulang dan penghentian

Sebelum penutupan teratur, Gateway menyiarkan peristiwa `shutdown` dengan `reason`
dan `restartExpectedMs`. Nilai `restartExpectedMs` yang bukan null berarti mulai ulang dalam proses atau
terawasi diharapkan; `null` berarti penghentian terminal.

Kode penutupan WebSocket berikutnya adalah `1012` untuk kedua kasus. Alasan penutupan klien
biasa juga `service restart` dalam kedua kasus, sehingga baik kode penutupan maupun
alasannya tidak membedakan mulai ulang dari penghentian. Pertahankan payload `shutdown`
sebelumnya saat payload tersebut tiba, dan gabungkan dengan maksud penghentian host sendiri serta
status keluar proses anak. Jika koneksi terputus tanpa peristiwa tersebut, gunakan kebijakan
penyambungan ulang terbatas dan pengawasan proses anak seperti biasa.

## Gunakan RPC, bukan berkas status

Pertahankan Gateway sebagai satu-satunya pemilik status OpenClaw. Operasi penyematan umum
sudah memiliki metode RPC:

| Tugas                         | Metode RPC                                           |
| ----------------------------- | ---------------------------------------------------- |
| Katalog dan siklus hidup sesi | `sessions.list`, `sessions.patch`, `sessions.delete` |
| Tampilan transkrip            | `chat.history`                                       |
| Laporan biaya dan penggunaan  | `usage.cost`, `sessions.usage`                       |
| Status kredensial model       | `models.authStatus`                                  |
| Konfigurasi                   | `config.get`, `config.patch`                         |

`config.get` menyunting nilai sensitif dan pengidentifikasi SecretRef sebelum mengembalikan
snapshot. Metode tulis juga mengembalikan konfigurasi yang telah disunting. Klien harus memperlakukan
sentinel penyuntingan sebagai buram dan menggunakan kontrak penulisan konfigurasi yang terdokumentasi;
klien tidak boleh mengharapkan Gateway mengembalikan rahasia dalam teks biasa.

Jangan membaca atau mengubah berkas, tabel SQLite, berkas transkrip, atau direktori cache
di bawah `~/.openclaw` untuk mengimplementasikan fitur aplikasi. Tata letak tersebut adalah detail
implementasi runtime privat dan dapat dipindahkan atau diubah tanpa kompatibilitas protokol.

## Instal; jangan ratakan

Paket root `openclaw` bukan target vendorisasi berkas tunggal. Berkas runtime yang dibundel
di bawah `dist/extensions` mempertahankan impor mandiri tanpa prefiks seperti
`openclaw/plugin-sdk/*`, sementara paket npm sengaja mengecualikan
pohon `node_modules` per ekstensi.

Instal OpenClaw melalui npm, pnpm, atau instalasi paket Node normal lainnya agar
Node dapat meresolusikan ekspor paket dan pohon dependensi root. Jalankan executable
`openclaw` yang terinstal. Jangan hanya menyalin `dist`, meratakan paket ke dalam
bundel aplikasi, atau mem-vendor berkas ekstensi tertentu.

## Terkait

- [Membangun klien Gateway](https://docs.openclaw.ai/gateway/clients)
- [Protokol Gateway](https://docs.openclaw.ai/gateway/protocol)
- [CLI Gateway](https://docs.openclaw.ai/cli/gateway)
- [Integrasi Gateway untuk aplikasi eksternal](https://docs.openclaw.ai/gateway/external-apps)
