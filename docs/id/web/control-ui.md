---
read_when:
    - Anda ingin mengoperasikan Gateway dari browser
    - Anda ingin akses Tailnet tanpa tunnel SSH
sidebarTitle: Control UI
summary: UI kontrol berbasis browser untuk Gateway (chat, node, konfigurasi)
title: UI kontrol
x-i18n:
    generated_at: "2026-04-26T11:41:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: a419e627c2b4e18687e946494d170b005102ba242b5f72c03ba0e55de2b8d4b3
    source_path: web/control-ui.md
    workflow: 15
---

UI Kontrol adalah aplikasi satu halaman kecil **Vite + Lit** yang disajikan oleh Gateway:

- default: `http://<host>:18789/`
- prefix opsional: tetapkan `gateway.controlUi.basePath` (misalnya `/openclaw`)

UI ini berkomunikasi **langsung ke WebSocket Gateway** pada port yang sama.

## Buka cepat (lokal)

Jika Gateway berjalan di komputer yang sama, buka:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/))

Jika halaman gagal dimuat, jalankan Gateway terlebih dahulu: `openclaw gateway`.

Auth diberikan selama handshake WebSocket melalui:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header identitas Tailscale Serve saat `gateway.auth.allowTailscale: true`
- header identitas trusted-proxy saat `gateway.auth.mode: "trusted-proxy"`

Panel pengaturan dashboard menyimpan token untuk sesi tab browser saat ini dan URL gateway yang dipilih; password tidak disimpan. Onboarding biasanya membuat token gateway untuk auth shared-secret pada koneksi pertama, tetapi auth password juga berfungsi saat `gateway.auth.mode` adalah `"password"`.

## Pairing perangkat (koneksi pertama)

Saat Anda terhubung ke UI Kontrol dari browser atau perangkat baru, Gateway biasanya memerlukan **persetujuan pairing satu kali**. Ini adalah langkah keamanan untuk mencegah akses tanpa izin.

**Yang akan Anda lihat:** "disconnected (1008): pairing required"

<Steps>
  <Step title="Daftar permintaan tertunda">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Setujui berdasarkan ID permintaan">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Jika browser mencoba pairing ulang dengan detail auth yang berubah (role/scope/public key), permintaan tertunda sebelumnya akan digantikan dan `requestId` baru akan dibuat. Jalankan kembali `openclaw devices list` sebelum menyetujui.

Jika browser sudah dipasangkan dan Anda mengubahnya dari akses baca ke akses tulis/admin, ini diperlakukan sebagai peningkatan persetujuan, bukan reconnect diam-diam. OpenClaw mempertahankan persetujuan lama tetap aktif, memblokir reconnect yang lebih luas, dan meminta Anda menyetujui kumpulan scope baru secara eksplisit.

Setelah disetujui, perangkat akan diingat dan tidak memerlukan persetujuan ulang kecuali Anda mencabutnya dengan `openclaw devices revoke --device <id> --role <role>`. Lihat [CLI Devices](/id/cli/devices) untuk rotasi token dan pencabutan.

<Note>
- Koneksi browser local loopback langsung (`127.0.0.1` / `localhost`) disetujui otomatis.
- Tailscale Serve dapat melewati alur pairing bolak-balik untuk sesi operator UI Kontrol saat `gateway.auth.allowTailscale: true`, identitas Tailscale terverifikasi, dan browser menampilkan identitas perangkatnya.
- Bind Tailnet langsung, koneksi browser LAN, dan profil browser tanpa identitas perangkat tetap memerlukan persetujuan eksplisit.
- Setiap profil browser menghasilkan ID perangkat unik, sehingga berganti browser atau menghapus data browser akan memerlukan pairing ulang.
</Note>

## Identitas personal (lokal browser)

UI Kontrol mendukung identitas personal per browser (nama tampilan dan avatar) yang dilampirkan ke pesan keluar untuk atribusi dalam sesi bersama. Identitas ini disimpan di storage browser, dicakup ke profil browser saat ini, dan tidak disinkronkan ke perangkat lain atau disimpan di sisi server selain metadata authorship transkrip normal pada pesan yang benar-benar Anda kirim. Menghapus data situs atau berganti browser akan mengosongkannya kembali.

Pola lokal-browser yang sama juga berlaku untuk penimpaan avatar asisten. Avatar asisten yang diunggah menimpa identitas yang di-resolve gateway hanya di browser lokal dan tidak pernah round-trip melalui `config.patch`. Field konfigurasi bersama `ui.assistant.avatar` tetap tersedia untuk klien non-UI yang menulis field tersebut secara langsung (seperti gateway berskrip atau dashboard kustom).

## Endpoint konfigurasi runtime

UI Kontrol mengambil pengaturan runtime-nya dari `/__openclaw/control-ui-config.json`. Endpoint itu dilindungi oleh auth gateway yang sama seperti permukaan HTTP lainnya: browser yang tidak diautentikasi tidak dapat mengambilnya, dan pengambilan yang berhasil memerlukan token/password gateway yang sudah valid, identitas Tailscale Serve, atau identitas trusted-proxy.

## Dukungan bahasa

UI Kontrol dapat melokalkan dirinya sendiri pada pemuatan pertama berdasarkan locale browser Anda. Untuk menimpanya nanti, buka **Overview -> Gateway Access -> Language**. Pemilih locale berada di kartu Gateway Access, bukan di bawah Appearance.

- Locale yang didukung: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Terjemahan non-Inggris dimuat secara lazy di browser.
- Locale yang dipilih disimpan di storage browser dan digunakan kembali pada kunjungan berikutnya.
- Kunci terjemahan yang hilang akan fallback ke bahasa Inggris.

## Yang dapat dilakukan (saat ini)

<AccordionGroup>
  <Accordion title="Chat dan Talk">
    - Chat dengan model melalui Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Bicara ke OpenAI Realtime langsung dari browser melalui WebRTC. Gateway membuat Realtime client secret berumur pendek dengan `talk.realtime.session`; browser mengirim audio mikrofon langsung ke OpenAI dan meneruskan panggilan tool `openclaw_agent_consult` kembali melalui `chat.send` untuk model OpenClaw terkonfigurasi yang lebih besar.
    - Stream panggilan tool + kartu output tool live di Chat (event agen).
  </Accordion>
  <Accordion title="Kanal, instance, sesi, dream">
    - Kanal: status kanal bawaan plus kanal plugin bundled/eksternal, login QR, dan konfigurasi per kanal (`channels.status`, `web.login.*`, `config.patch`).
    - Instance: daftar presence + refresh (`system-presence`).
    - Sesi: daftar + penimpaan model/thinking/fast/verbose/trace/reasoning per sesi (`sessions.list`, `sessions.patch`).
    - Dream: status Dreaming, toggle aktif/nonaktif, dan pembaca Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).
  </Accordion>
  <Accordion title="Cron, Skills, Node, persetujuan exec">
    - Job Cron: daftar/tambah/edit/jalankan/aktifkan/nonaktifkan + riwayat eksekusi (`cron.*`).
    - Skills: status, aktifkan/nonaktifkan, instal, pembaruan API key (`skills.*`).
    - Node: daftar + kapabilitas (`node.list`).
    - Persetujuan exec: edit allowlist gateway atau node + kebijakan ask untuk `exec host=gateway/node` (`exec.approvals.*`).
  </Accordion>
  <Accordion title="Konfigurasi">
    - Lihat/edit `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Terapkan + restart dengan validasi (`config.apply`) dan bangunkan sesi aktif terakhir.
    - Penulisan menyertakan guard base-hash untuk mencegah menimpa edit bersamaan.
    - Penulisan (`config.set`/`config.apply`/`config.patch`) melakukan preflight resolusi SecretRef aktif untuk ref dalam payload konfigurasi yang dikirim; ref aktif yang dikirim tetapi tidak ter-resolve akan ditolak sebelum penulisan.
    - Rendering skema + form (`config.schema` / `config.schema.lookup`, termasuk field `title` / `description`, petunjuk UI yang cocok, ringkasan child langsung, metadata docs pada node nested object/wildcard/array/composition, plus skema plugin + kanal bila tersedia); editor Raw JSON hanya tersedia saat snapshot memiliki raw round-trip yang aman.
    - Jika sebuah snapshot tidak dapat melakukan raw round-trip dengan aman, UI Kontrol memaksa mode Form dan menonaktifkan mode Raw untuk snapshot tersebut.
    - "Reset to saved" pada editor Raw JSON mempertahankan bentuk yang ditulis secara raw (formatting, komentar, tata letak `$include`) alih-alih merender ulang snapshot yang diratakan, sehingga edit eksternal tetap bertahan saat reset jika snapshot dapat melakukan raw round-trip dengan aman.
    - Nilai objek Structured SecretRef dirender read-only dalam input teks form untuk mencegah kerusakan objek-ke-string yang tidak disengaja.
  </Accordion>
  <Accordion title="Debug, log, pembaruan">
    - Debug: snapshot status/health/models + log event + panggilan RPC manual (`status`, `health`, `models.list`).
    - Log: tail live log file gateway dengan filter/ekspor (`logs.tail`).
    - Pembaruan: jalankan pembaruan package/git + restart (`update.run`) dengan laporan restart.
  </Accordion>
  <Accordion title="Catatan panel job Cron">
    - Untuk job terisolasi, delivery default adalah mengumumkan ringkasan. Anda dapat menggantinya ke none jika ingin eksekusi internal saja.
    - Field channel/target muncul saat announce dipilih.
    - Mode Webhook menggunakan `delivery.mode = "webhook"` dengan `delivery.to` yang diatur ke URL Webhook HTTP(S) yang valid.
    - Untuk job main-session, mode delivery webhook dan none tersedia.
    - Kontrol edit lanjutan mencakup delete-after-run, clear agent override, opsi tepat/bertahap cron, penimpaan model/thinking agen, dan toggle delivery best-effort.
    - Validasi form bersifat inline dengan error per field; nilai yang tidak valid menonaktifkan tombol simpan sampai diperbaiki.
    - Tetapkan `cron.webhookToken` untuk mengirim bearer token khusus; jika dihilangkan, Webhook dikirim tanpa header auth.
    - Fallback yang sudah deprecated: job legacy tersimpan dengan `notify: true` masih dapat menggunakan `cron.webhook` sampai dimigrasikan.
  </Accordion>
</AccordionGroup>

## Perilaku chat

<AccordionGroup>
  <Accordion title="Semantik kirim dan riwayat">
    - `chat.send` bersifat **non-blocking**: langsung memberi ack dengan `{ runId, status: "started" }` dan respons di-stream melalui event `chat`.
    - Mengirim ulang dengan `idempotencyKey` yang sama mengembalikan `{ status: "in_flight" }` saat masih berjalan, dan `{ status: "ok" }` setelah selesai.
    - Respons `chat.history` dibatasi ukurannya demi keamanan UI. Saat entri transkrip terlalu besar, Gateway dapat memotong field teks yang panjang, menghilangkan blok metadata berat, dan mengganti pesan yang terlalu besar dengan placeholder (`[chat.history omitted: message too large]`).
    - Gambar asisten/hasil generasi disimpan sebagai referensi media terkelola dan disajikan kembali melalui URL media Gateway yang diautentikasi, sehingga reload tidak bergantung pada payload gambar base64 mentah yang tetap ada di respons riwayat chat.
    - `chat.history` juga menghapus tag directive inline khusus tampilan dari teks asisten yang terlihat (misalnya `[[reply_to_*]]` dan `[[audio_as_voice]]`), payload XML panggilan tool plain-text (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok panggilan tool yang terpotong), serta token kontrol model ASCII/full-width yang bocor, dan menghilangkan entri asisten yang seluruh teks terlihatnya hanya token senyap persis `NO_REPLY` / `no_reply`.
    - Selama pengiriman aktif dan refresh riwayat akhir, tampilan chat mempertahankan pesan pengguna/asisten optimistis lokal tetap terlihat jika `chat.history` sesaat mengembalikan snapshot lama; transkrip kanonis menggantikan pesan lokal tersebut setelah riwayat Gateway menyusul.
    - `chat.inject` menambahkan catatan asisten ke transkrip sesi dan menyiarkan event `chat` untuk pembaruan khusus UI (tanpa eksekusi agen, tanpa pengiriman kanal).
    - Pemilih model dan thinking di header chat langsung mem-patch sesi aktif melalui `sessions.patch`; itu adalah penimpaan sesi persisten, bukan opsi kirim satu giliran saja.
    - Saat laporan penggunaan sesi Gateway yang baru menunjukkan tekanan konteks tinggi, area composer chat menampilkan pemberitahuan konteks dan, pada level Compaction yang direkomendasikan, tombol compact yang menjalankan jalur Compaction sesi normal. Snapshot token yang basi disembunyikan sampai Gateway kembali melaporkan penggunaan baru.
  </Accordion>
  <Accordion title="Mode Talk (WebRTC browser)">
    Mode Talk menggunakan penyedia suara realtime terdaftar yang mendukung sesi WebRTC browser. Konfigurasikan OpenAI dengan `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, atau gunakan kembali konfigurasi penyedia realtime Voice Call. Browser tidak pernah menerima API key OpenAI standar; browser hanya menerima Realtime client secret yang ephemeral. Suara realtime Google Live didukung untuk Voice Call backend dan bridge Google Meet, tetapi belum untuk jalur WebRTC browser ini. Prompt sesi Realtime dirakit oleh Gateway; `talk.realtime.session` tidak menerima penimpaan instruksi yang disediakan pemanggil.

    Di composer Chat, kontrol Talk adalah tombol gelombang di sebelah tombol dikte mikrofon. Saat Talk dimulai, baris status composer menampilkan `Connecting Talk...`, lalu `Talk live` saat audio terhubung, atau `Asking OpenClaw...` saat panggilan tool realtime sedang berkonsultasi dengan model OpenClaw terkonfigurasi yang lebih besar melalui `chat.send`.

  </Accordion>
  <Accordion title="Berhenti dan abort">
    - Klik **Stop** (memanggil `chat.abort`).
    - Saat sebuah eksekusi aktif, tindak lanjut normal akan masuk antrean. Klik **Steer** pada pesan yang diantrikan untuk menyuntikkan tindak lanjut itu ke giliran yang sedang berjalan.
    - Ketik `/stop` (atau frasa abort mandiri seperti `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) untuk melakukan abort out-of-band.
    - `chat.abort` mendukung `{ sessionKey }` (tanpa `runId`) untuk meng-abort semua eksekusi aktif pada sesi tersebut.
  </Accordion>
  <Accordion title="Retensi parsial abort">
    - Saat sebuah eksekusi di-abort, teks asisten parsial masih dapat ditampilkan di UI.
    - Gateway menyimpan teks asisten parsial yang di-abort ke riwayat transkrip saat output yang dibuffer tersedia.
    - Entri yang disimpan menyertakan metadata abort agar konsumen transkrip dapat membedakan parsial abort dari output penyelesaian normal.
  </Accordion>
</AccordionGroup>

## Instalasi PWA dan web push

UI Kontrol menyediakan `manifest.webmanifest` dan service worker, sehingga browser modern dapat menginstalnya sebagai PWA mandiri. Web Push memungkinkan Gateway membangunkan PWA yang terinstal dengan notifikasi bahkan saat tab atau jendela browser tidak terbuka.

| Permukaan                                            | Fungsinya                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                     | Manifest PWA. Browser menawarkan "Install app" setelah dapat dijangkau. |
| `ui/public/sw.js`                                    | Service worker yang menangani event `push` dan klik notifikasi.    |
| `push/vapid-keys.json` (di bawah direktori state OpenClaw) | Keypair VAPID yang dibuat otomatis dan digunakan untuk menandatangani payload Web Push. |
| `push/web-push-subscriptions.json`                   | Endpoint langganan browser yang disimpan.                          |

Timpa keypair VAPID melalui env var pada proses Gateway saat Anda ingin mem-pin key (untuk deployment multi-host, rotasi secret, atau pengujian):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (default ke `mailto:openclaw@localhost`)

UI Kontrol menggunakan metode Gateway berpagar-scope ini untuk mendaftarkan dan menguji langganan browser:

- `push.web.vapidPublicKey` — mengambil VAPID public key aktif.
- `push.web.subscribe` — mendaftarkan `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — menghapus endpoint yang terdaftar.
- `push.web.test` — mengirim notifikasi uji ke langganan pemanggil.

<Note>
Web Push independen dari jalur relay APNS iOS (lihat [Konfigurasi](/id/gateway/configuration) untuk push berbasis relay) dan metode `push.test` yang sudah ada, yang menargetkan pairing mobile native.
</Note>

## Embed yang di-host

Pesan asisten dapat merender konten web yang di-host secara inline dengan shortcode `[embed ...]`. Kebijakan sandbox iframe dikendalikan oleh `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Menonaktifkan eksekusi skrip di dalam embed yang di-host.
  </Tab>
  <Tab title="scripts (default)">
    Mengizinkan embed interaktif sambil mempertahankan isolasi origin; ini adalah default dan biasanya cukup untuk game/widget browser mandiri.
  </Tab>
  <Tab title="trusted">
    Menambahkan `allow-same-origin` di atas `allow-scripts` untuk dokumen situs yang sama yang memang membutuhkan hak istimewa lebih kuat.
  </Tab>
</Tabs>

Contoh:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
Gunakan `trusted` hanya saat dokumen yang di-embed benar-benar membutuhkan perilaku same-origin. Untuk sebagian besar game dan kanvas interaktif yang dihasilkan agen, `scripts` adalah pilihan yang lebih aman.
</Warning>

URL embed eksternal absolut `http(s)` tetap diblokir secara default. Jika Anda memang ingin `[embed url="https://..."]` memuat halaman pihak ketiga, tetapkan `gateway.controlUi.allowExternalEmbedUrls: true`.

## Akses Tailnet (disarankan)

<Tabs>
  <Tab title="Tailscale Serve terintegrasi (disarankan)">
    Pertahankan Gateway di loopback dan biarkan Tailscale Serve mem-proxy-nya dengan HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Buka:

    - `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasikan)

    Secara default, permintaan Serve UI Kontrol/WebSocket dapat diautentikasi melalui header identitas Tailscale (`tailscale-user-login`) saat `gateway.auth.allowTailscale` bernilai `true`. OpenClaw memverifikasi identitas dengan me-resolve alamat `x-forwarded-for` menggunakan `tailscale whois` dan mencocokkannya dengan header, serta hanya menerima ini saat permintaan mengenai loopback dengan header `x-forwarded-*` milik Tailscale. Untuk sesi operator UI Kontrol dengan identitas perangkat browser, jalur Serve terverifikasi ini juga melewati alur pairing perangkat bolak-balik; browser tanpa perangkat dan koneksi dengan role node tetap mengikuti pemeriksaan perangkat normal. Tetapkan `gateway.auth.allowTailscale: false` jika Anda ingin mewajibkan kredensial shared-secret eksplisit bahkan untuk lalu lintas Serve. Lalu gunakan `gateway.auth.mode: "token"` atau `"password"`.

    Untuk jalur identitas Serve asinkron tersebut, percobaan auth gagal untuk IP klien dan scope auth yang sama diserialkan sebelum penulisan rate-limit. Karena itu, retry buruk yang terjadi bersamaan dari browser yang sama dapat menampilkan `retry later` pada permintaan kedua alih-alih dua mismatch biasa yang berpacu secara paralel.

    <Warning>
    Auth Serve tanpa token mengasumsikan host gateway tepercaya. Jika kode lokal yang tidak tepercaya mungkin berjalan di host tersebut, wajibkan auth token/password.
    </Warning>

  </Tab>
  <Tab title="Bind ke tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Lalu buka:

    - `http://<tailscale-ip>:18789/` (atau `gateway.controlUi.basePath` yang Anda konfigurasikan)

    Tempel shared secret yang sesuai ke pengaturan UI (dikirim sebagai `connect.params.auth.token` atau `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP tidak aman

Jika Anda membuka dashboard melalui HTTP biasa (`http://<lan-ip>` atau `http://<tailscale-ip>`), browser berjalan dalam **konteks tidak aman** dan memblokir WebCrypto. Secara default, OpenClaw **memblokir** koneksi UI Kontrol tanpa identitas perangkat.

Pengecualian yang didokumentasikan:

- kompatibilitas HTTP tidak aman khusus localhost dengan `gateway.controlUi.allowInsecureAuth=true`
- auth operator UI Kontrol yang berhasil melalui `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Perbaikan yang disarankan:** gunakan HTTPS (Tailscale Serve) atau buka UI secara lokal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (di host gateway)

<AccordionGroup>
  <Accordion title="Perilaku toggle auth tidak aman">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` hanyalah toggle kompatibilitas lokal:

    - Ini memungkinkan sesi UI Kontrol localhost berlanjut tanpa identitas perangkat dalam konteks HTTP tidak aman.
    - Ini tidak melewati pemeriksaan pairing.
    - Ini tidak melonggarkan persyaratan identitas perangkat remote (bukan localhost).

  </Accordion>
  <Accordion title="Hanya untuk break-glass">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` menonaktifkan pemeriksaan identitas perangkat UI Kontrol dan merupakan penurunan keamanan yang serius. Kembalikan segera setelah penggunaan darurat.
    </Warning>

  </Accordion>
  <Accordion title="Catatan trusted-proxy">
    - Auth trusted-proxy yang berhasil dapat mengizinkan sesi UI Kontrol **operator** tanpa identitas perangkat.
    - Ini **tidak** berlaku untuk sesi UI Kontrol dengan role node.
    - Reverse proxy loopback host yang sama tetap tidak memenuhi auth trusted-proxy; lihat [Auth trusted proxy](/id/gateway/trusted-proxy-auth).
  </Accordion>
</AccordionGroup>

Lihat [Tailscale](/id/gateway/tailscale) untuk panduan penyiapan HTTPS.

## Content Security Policy

UI Kontrol dikirim dengan kebijakan `img-src` yang ketat: hanya aset **same-origin**, URL `data:`, dan URL `blob:` yang dibuat secara lokal yang diizinkan. URL gambar remote `http(s)` dan protocol-relative ditolak oleh browser dan tidak memicu pengambilan jaringan.

Apa artinya dalam praktik:

- Avatar dan gambar yang disajikan di bawah path relatif (misalnya `/avatars/<id>`) tetap dirender, termasuk rute avatar terautentikasi yang diambil UI lalu diubah menjadi URL `blob:` lokal.
- URL inline `data:image/...` tetap dirender (berguna untuk payload in-protocol).
- URL `blob:` lokal yang dibuat oleh UI Kontrol tetap dirender.
- URL avatar remote yang dikeluarkan metadata kanal dihapus di helper avatar UI Kontrol dan diganti dengan logo/badge bawaan, sehingga kanal yang disusupi atau berbahaya tidak dapat memaksa pengambilan gambar remote arbitrer dari browser operator.

Anda tidak perlu mengubah apa pun untuk mendapatkan perilaku ini — ini selalu aktif dan tidak dapat dikonfigurasi.

## Auth rute avatar

Saat auth gateway dikonfigurasi, endpoint avatar UI Kontrol memerlukan token gateway yang sama seperti API lainnya:

- `GET /avatar/<agentId>` mengembalikan gambar avatar hanya kepada pemanggil yang diautentikasi. `GET /avatar/<agentId>?meta=1` mengembalikan metadata avatar dengan aturan yang sama.
- Permintaan yang tidak diautentikasi ke kedua rute ditolak (sesuai dengan rute sibling assistant-media). Ini mencegah rute avatar membocorkan identitas agen pada host yang seharusnya dilindungi.
- UI Kontrol sendiri meneruskan token gateway sebagai header bearer saat mengambil avatar, dan menggunakan URL blob yang diautentikasi sehingga gambar tetap dirender di dashboard.

Jika Anda menonaktifkan auth gateway (tidak disarankan pada host bersama), rute avatar juga menjadi tidak diautentikasi, selaras dengan gateway lainnya.

## Membangun UI

Gateway menyajikan file statis dari `dist/control-ui`. Bangun file tersebut dengan:

```bash
pnpm ui:build
```

Base absolut opsional (saat Anda menginginkan URL aset tetap):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Untuk pengembangan lokal (dev server terpisah):

```bash
pnpm ui:dev
```

Lalu arahkan UI ke URL WS Gateway Anda (misalnya `ws://127.0.0.1:18789`).

## Debugging/testing: dev server + Gateway remote

UI Kontrol adalah file statis; target WebSocket dapat dikonfigurasi dan bisa berbeda dari origin HTTP. Ini berguna saat Anda ingin Vite dev server berjalan lokal tetapi Gateway berjalan di tempat lain.

<Steps>
  <Step title="Mulai UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Buka dengan gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
    ```

    Auth satu kali opsional (jika diperlukan):

    ```text
    http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Catatan">
    - `gatewayUrl` disimpan di localStorage setelah dimuat dan dihapus dari URL.
    - `token` sebaiknya diteruskan melalui fragmen URL (`#token=...`) jika memungkinkan. Fragmen tidak dikirim ke server, yang menghindari kebocoran log permintaan dan Referer. Parameter query `?token=` lama masih diimpor satu kali untuk kompatibilitas, tetapi hanya sebagai fallback, dan segera dihapus setelah bootstrap.
    - `password` hanya disimpan di memori.
    - Saat `gatewayUrl` ditetapkan, UI tidak menggunakan fallback ke kredensial konfigurasi atau lingkungan. Berikan `token` (atau `password`) secara eksplisit. Kredensial eksplisit yang hilang adalah error.
    - Gunakan `wss://` saat Gateway berada di belakang TLS (Tailscale Serve, proxy HTTPS, dll.).
    - `gatewayUrl` hanya diterima di jendela tingkat atas (tidak di-embed) untuk mencegah clickjacking.
    - Deployment UI Kontrol non-loopback harus menetapkan `gateway.controlUi.allowedOrigins` secara eksplisit (origin lengkap). Ini mencakup penyiapan dev remote.
    - Startup Gateway dapat men-seed origin lokal seperti `http://localhost:<port>` dan `http://127.0.0.1:<port>` dari bind dan port runtime yang efektif, tetapi origin browser remote tetap memerlukan entri eksplisit.
    - Jangan gunakan `gateway.controlUi.allowedOrigins: ["*"]` kecuali untuk pengujian lokal yang dikontrol ketat. Ini berarti mengizinkan origin browser apa pun, bukan "cocokkan host apa pun yang saya gunakan."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` mengaktifkan mode fallback origin Host-header, tetapi ini adalah mode keamanan yang berbahaya.
  </Accordion>
</AccordionGroup>

Contoh:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Detail penyiapan akses remote: [Akses remote](/id/gateway/remote).

## Terkait

- [Dashboard](/id/web/dashboard) — dashboard gateway
- [Health Checks](/id/gateway/health) — pemantauan kesehatan gateway
- [TUI](/id/web/tui) — antarmuka pengguna terminal
- [WebChat](/id/web/webchat) — antarmuka chat berbasis browser
