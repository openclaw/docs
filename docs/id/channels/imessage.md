---
read_when:
    - Menyiapkan dukungan iMessage
    - Men-debug pengiriman/penerimaan iMessage
summary: Dukungan native iMessage melalui imsg (JSON-RPC melalui stdio), dengan tindakan API privat untuk balasan, tapback, efek, jajak pendapat, lampiran, dan pengelolaan grup. Direkomendasikan untuk penyiapan iMessage OpenClaw baru jika persyaratan host terpenuhi.
title: iMessage
x-i18n:
    generated_at: "2026-07-19T04:54:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 215364b4a0424db3fccb27e29815f2a94c55ebe66d1eec21ed85e4b7947ea1ab
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Untuk deployment iMessage OpenClaw yang umum, jalankan Gateway dan `imsg` pada host Messages macOS yang sama dan telah masuk. Jika Gateway Anda berjalan di tempat lain, arahkan `channels.imessage.cliPath` ke pembungkus SSH transparan yang menjalankan `imsg` di Mac.

**Pemulihan pesan masuk berlangsung otomatis.** Setelah bridge atau Gateway dimulai ulang, iMessage memutar ulang pesan yang terlewat selama tidak aktif dan menekan "bom backlog" usang yang dapat dikirim sekaligus oleh Apple setelah pemulihan Push, serta melakukan deduplikasi agar tidak ada yang dikirim dua kali. Tidak ada konfigurasi yang perlu diaktifkan — lihat [Pemulihan pesan masuk setelah bridge atau Gateway dimulai ulang](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Dukungan BlueBubbles telah dihapus. Migrasikan konfigurasi `channels.bluebubbles` ke `channels.imessage`; OpenClaw hanya mendukung iMessage melalui `imsg`. Mulailah dengan [Penghapusan BlueBubbles dan jalur iMessage imsg](/id/announcements/bluebubbles-imessage) untuk pengumuman singkat, atau [Bermigrasi dari BlueBubbles](/id/channels/imessage-from-bluebubbles) untuk tabel migrasi lengkap.
</Warning>

Status: integrasi CLI eksternal native. Gateway menjalankan `imsg rpc` dan berkomunikasi menggunakan JSON-RPC melalui stdio — tanpa daemon atau port terpisah. Mode API privat sangat disarankan untuk kanal iMessage yang lengkap; balasan, tapback, efek, jajak pendapat, balasan lampiran, dan tindakan grup memerlukan `imsg launch` serta pemeriksaan API privat yang berhasil.

Untuk penyiapan lokal yang umum, penyiapan OpenClaw dapat menawarkan instalasi atau pembaruan Homebrew yang dikonfirmasi pengguna untuk `imsg` di Mac Messages yang telah masuk. Penyiapan manual dan topologi pembungkus SSH tetap dikelola operator: instal atau perbarui `imsg` dalam konteks pengguna yang sama dengan yang akan menjalankan Gateway atau pembungkus.

<CardGroup cols={3}>
  <Card title="Tindakan API privat" icon="wand-sparkles" href="#private-api-actions">
    Balasan, tapback, efek, jajak pendapat, lampiran, dan pengelolaan grup.
  </Card>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    DM iMessage secara default menggunakan mode pemasangan.
  </Card>
  <Card title="Mac jarak jauh" icon="terminal" href="#remote-mac-over-ssh">
    Gunakan pembungkus SSH ketika Gateway tidak berjalan di Mac Messages.
  </Card>
  <Card title="Referensi konfigurasi" icon="settings" href="/id/gateway/config-channels#imessage">
    Referensi lengkap bidang iMessage.
  </Card>
</CardGroup>

## Penyiapan cepat

<Tabs>
  <Tab title="Mac lokal (jalur cepat)">
    <Steps>
      <Step title="Instal dan verifikasi imsg">

```bash
brew install steipete/tap/imsg
brew update && brew upgrade imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

        Ketika wisaya penyiapan lokal mendeteksi bahwa perintah default `imsg` tidak tersedia, wisaya dapat meminta konfirmasi untuk menginstal `steipete/tap/imsg` melalui Homebrew. Jika mendeteksi `imsg` yang dikelola Homebrew, wisaya dapat meminta konfirmasi untuk menginstal ulang atau memperbaruinya. Pembungkus `cliPath` khusus tidak diubah.

      </Step>

      <Step title="Konfigurasikan OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Mulai Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Setujui pemasangan DM pertama (dmPolicy default)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Permintaan pemasangan kedaluwarsa setelah 1 jam.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac jarak jauh melalui SSH">
    Sebagian besar penyiapan tidak memerlukan SSH. Gunakan topologi ini hanya ketika Gateway tidak dapat berjalan di Mac Messages yang telah masuk. OpenClaw hanya memerlukan `cliPath` yang kompatibel dengan stdio, sehingga Anda dapat mengarahkan `cliPath` ke skrip pembungkus yang terhubung melalui SSH ke Mac jarak jauh dan menjalankan `imsg`.
    Instal dan perbarui `imsg` di Mac jarak jauh tersebut, bukan di host Gateway:

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Konfigurasi yang disarankan ketika lampiran diaktifkan:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // digunakan untuk mengambil lampiran melalui SCP
      includeAttachments: true,
      // Opsional: root lampiran tambahan yang diizinkan (digabungkan dengan
      // /Users/*/Library/Messages/Attachments default).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Jika `remoteHost` tidak ditetapkan, OpenClaw mencoba mendeteksinya secara otomatis dengan mengurai skrip pembungkus SSH.
    `remoteHost` harus berupa `host` atau `user@host` (tanpa spasi atau opsi SSH); nilai yang tidak aman akan diabaikan.
    OpenClaw menggunakan pemeriksaan kunci host yang ketat untuk SCP, sehingga kunci host relai harus sudah tersedia di `~/.ssh/known_hosts`.
    Jalur lampiran divalidasi terhadap root yang diizinkan (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Setiap pembungkus `cliPath` atau proksi SSH yang Anda tempatkan di depan `imsg` HARUS berperilaku seperti pipa stdio transparan untuk JSON-RPC berumur panjang. OpenClaw bertukar pesan JSON-RPC kecil berbingkai baris baru melalui stdin/stdout pembungkus selama masa aktif kanal:

- Teruskan setiap potongan/baris stdin **segera setelah byte tersedia** — jangan menunggu EOF.
- Teruskan setiap potongan/baris stdout dengan segera ke arah sebaliknya.
- Pertahankan baris baru.
- Hindari pembacaan pemblokiran berukuran tetap (`read(4096)`, `cat | buffer`, `read` shell default) yang dapat membuat bingkai kecil kekurangan data.
- Pisahkan stderr dari aliran stdout JSON-RPC.

Pembungkus yang menyangga stdin hingga blok besar terisi akan menimbulkan gejala yang tampak seperti gangguan iMessage — `imsg rpc timeout (chats.list)` atau kanal dimulai ulang berulang kali — meskipun `imsg rpc` sendiri dalam keadaan sehat. `ssh -T host imsg "$@"` (di atas) aman karena meneruskan argumen `cliPath` OpenClaw seperti `rpc` dan `--db`. Pipeline seperti `ssh host imsg | grep -v '^DEBUG'` TIDAK aman — alat dengan penyanggaan baris masih dapat menahan bingkai; gunakan `stdbuf -oL -eL` pada setiap tahap jika Anda harus memfilter.
</Warning>

  </Tab>
</Tabs>

## Persyaratan dan izin (macOS)

- Messages harus dalam keadaan masuk di Mac yang menjalankan `imsg`.
- Full Disk Access diperlukan untuk konteks proses yang menjalankan OpenClaw/`imsg` (akses DB Messages).
- Izin Automation diperlukan untuk mengirim pesan melalui Messages.app.
- Untuk tindakan lanjutan (bereaksi / mengedit / membatalkan pengiriman / balasan berutas / efek / jajak pendapat / operasi grup), System Integrity Protection harus dinonaktifkan — lihat [Mengaktifkan API privat imsg](#enabling-the-imsg-private-api). Pengiriman dan penerimaan teks serta media dasar berfungsi tanpanya.

<Tip>
Izin diberikan per konteks proses. Jika Gateway berjalan tanpa antarmuka (LaunchAgent/SSH), jalankan satu kali perintah interaktif dalam konteks yang sama untuk memicu permintaan izin:

```bash
imsg chats --limit 1
# atau
imsg send <handle> "uji"
```

</Tip>

<Accordion title="Pengiriman melalui pembungkus SSH gagal dengan AppleEvents -1743">
  Penyiapan SSH jarak jauh dapat membaca obrolan, lolos dari `channels status --probe`, dan memproses pesan masuk sementara pengiriman keluar masih gagal dengan kesalahan otorisasi AppleEvents:

```text
Tidak diizinkan mengirim peristiwa Apple ke Messages. (-1743)
```

Periksa basis data TCC milik pengguna Mac yang telah masuk atau System Settings > Privacy & Security > Automation. Jika entri Automation tercatat untuk `/usr/libexec/sshd-keygen-wrapper`, bukan proses `imsg` atau shell lokal, macOS mungkin tidak menampilkan pengalih Messages yang dapat digunakan untuk klien sisi server SSH tersebut:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

Dalam keadaan tersebut, mengulangi `tccutil reset AppleEvents` atau menjalankan ulang `imsg send` melalui pembungkus SSH yang sama mungkin tetap gagal karena konteks proses yang memerlukan Automation Messages adalah pembungkus SSH, bukan aplikasi yang dapat diberi izin oleh UI.

Sebagai gantinya, gunakan salah satu konteks proses `imsg` yang didukung:

- Jalankan Gateway, atau setidaknya bridge `imsg`, dalam sesi lokal pengguna Messages yang telah masuk.
- Mulai Gateway menggunakan LaunchAgent untuk pengguna tersebut setelah memberikan Full Disk Access dan Automation dari sesi yang sama.
- Jika Anda mempertahankan topologi SSH dua pengguna, pastikan pengiriman keluar `imsg send` yang sebenarnya berhasil melalui pembungkus yang tepat sebelum mengaktifkan kanal. Jika Automation tidak dapat diberikan, konfigurasikan ulang ke penyiapan `imsg` satu pengguna alih-alih mengandalkan pembungkus SSH untuk pengiriman.

</Accordion>

## Mengaktifkan API privat imsg

`imsg` disertakan dalam dua mode operasional. Untuk OpenClaw, mode API Privat merupakan penyiapan yang disarankan karena memberikan kanal tindakan native iMessage yang diharapkan pengguna. Mode dasar tetap berguna untuk instalasi berisiko rendah, verifikasi awal, atau host tempat SIP tidak dapat dinonaktifkan.

- **Mode dasar** (default, tidak memerlukan perubahan SIP): teks dan media keluar melalui `send`, pemantauan/riwayat pesan masuk, dan daftar obrolan. Inilah yang langsung tersedia dari `brew install steipete/tap/imsg` baru beserta izin macOS standar di atas.
- **Mode API privat**: `imsg` menyuntikkan dylib pembantu ke dalam `Messages.app` untuk memanggil fungsi internal `IMCore`. Ini membuka `react`, `edit`, `unsend`, `reply` (berutas), `sendWithEffect`, `poll` dan `poll-vote` (jajak pendapat native Messages), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, serta indikator pengetikan dan tanda terima baca.

Permukaan tindakan yang disarankan pada halaman ini memerlukan mode API Privat. README `imsg` menyatakan persyaratan tersebut secara eksplisit:

> Fitur lanjutan seperti `read`, `typing`, `launch`, pengiriman kaya yang didukung bridge, mutasi pesan, dan pengelolaan obrolan bersifat opsional. Fitur tersebut memerlukan SIP dinonaktifkan dan dylib pembantu disuntikkan ke dalam `Messages.app`. `imsg launch` menolak melakukan penyuntikan ketika SIP diaktifkan.

Teknik penyuntikan pembantu menggunakan dylib milik `imsg` sendiri untuk mengakses API privat Messages. Tidak ada server pihak ketiga atau runtime BlueBubbles dalam jalur iMessage OpenClaw.

<Warning>
**Menonaktifkan SIP merupakan kompromi keamanan yang nyata.** SIP adalah salah satu perlindungan inti macOS terhadap eksekusi kode sistem yang dimodifikasi; menonaktifkannya di seluruh sistem membuka permukaan serangan dan efek samping tambahan. Khususnya, **menonaktifkan SIP di Mac Apple Silicon juga menonaktifkan kemampuan untuk menginstal dan menjalankan aplikasi iOS di Mac Anda**.

Perlakukan ini sebagai pilihan operasional yang disengaja, terutama pada Mac pribadi utama. Untuk iMessage OpenClaw berkualitas produksi, sebaiknya gunakan Mac khusus atau pengguna bot macOS yang memungkinkan Anda mengaktifkan bridge dengan nyaman. Jika model ancaman Anda tidak dapat mentoleransi SIP dinonaktifkan di mana pun, iMessage bawaan terbatas pada mode dasar — hanya mengirim/menerima teks dan media, tanpa reaksi / edit / pembatalan pengiriman / efek / operasi grup.
</Warning>

### Penyiapan

1. **Instal (atau tingkatkan) `imsg`** di Mac yang menjalankan Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   Output `imsg status --json` melaporkan `bridge_version`, `rpc_methods`, dan `selectors` per metode agar Anda dapat melihat apa yang didukung build saat ini sebelum memulai.

2. **Nonaktifkan System Integrity Protection, dan (pada macOS modern) Library Validation.** Menginjeksikan dylib pembantu non-Apple ke dalam `Messages.app` yang ditandatangani Apple mengharuskan SIP dinonaktifkan **dan** validasi pustaka dilonggarkan. Langkah SIP dalam mode Pemulihan bergantung pada versi macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** nonaktifkan Library Validation melalui Terminal, mulai ulang ke Mode Pemulihan, jalankan `csrutil disable`, lalu mulai ulang.
   - **macOS 11+ (Big Sur dan yang lebih baru), Intel:** masuk ke Mode Pemulihan (atau Pemulihan Internet), jalankan `csrutil disable`, lalu mulai ulang.
   - **macOS 11+, Apple Silicon:** gunakan urutan penyalaan dengan tombol daya untuk masuk ke Pemulihan; pada versi macOS terbaru, tahan tombol **Left Shift** saat mengeklik Continue, lalu jalankan `csrutil disable`. Penyiapan mesin virtual mengikuti alur terpisah, jadi buat snapshot VM terlebih dahulu.

   **Pada macOS 11 dan yang lebih baru, `csrutil disable` saja biasanya tidak cukup.** Apple masih memberlakukan validasi pustaka terhadap `Messages.app` sebagai biner platform, sehingga pembantu yang ditandatangani secara ad hoc ditolak (`Library Validation failed: ... platform binary, but mapped file is not`) meskipun SIP dinonaktifkan. Setelah menonaktifkan SIP, nonaktifkan juga validasi pustaka dan mulai ulang:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), diverifikasi pada 26.5.1:** SIP yang dinonaktifkan **ditambah** perintah `DisableLibraryValidation` di atas sudah cukup untuk menginjeksikan pembantu pada versi 26.0 hingga 26.5.x. **Tidak diperlukan boot-args.** Plist tersebut merupakan faktor penentu dan langkah yang paling sering terlewat saat injeksi gagal di Tahoe:
   - **Dengan plist:** `imsg launch` melakukan injeksi dan `imsg status` melaporkan `advanced_features: true`.
   - **Tanpa plist (meskipun SIP dinonaktifkan):** `imsg launch` gagal dengan `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI menolak pembantu ad hoc saat pemuatan, sehingga bridge tidak pernah siap dan peluncuran kehabisan waktu. Kehabisan waktu tersebut adalah gejala yang paling sering ditemui di Tahoe; solusinya adalah plist di atas, bukan tindakan yang lebih drastis.

   Jika injeksi `imsg launch` atau `selectors` tertentu mulai mengembalikan false setelah peningkatan macOS, pemeriksaan ini biasanya menjadi penyebabnya. Periksa status SIP dan validasi pustaka sebelum menganggap langkah SIP itu sendiri gagal. Jika pengaturan tersebut sudah benar dan bridge masih tidak dapat melakukan injeksi, kumpulkan `imsg status --json` beserta keluaran `imsg launch` dan laporkan ke proyek `imsg`, alih-alih melemahkan kontrol keamanan tambahan di seluruh sistem.

3. **Injeksikan pembantu.** Dengan SIP dinonaktifkan dan Messages.app telah masuk:

   ```bash
   imsg launch
   ```

   `imsg launch` menolak melakukan injeksi saat SIP masih diaktifkan, sehingga tindakan ini juga berfungsi sebagai konfirmasi bahwa langkah 2 telah diterapkan.

4. **Verifikasi bridge dari OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Entri iMessage seharusnya melaporkan `works`, dan `imsg status --json | jq '{rpc_methods, selectors}'` seharusnya menampilkan kemampuan yang disediakan oleh build macOS Anda. Pembuatan jajak pendapat memerlukan `selectors.pollPayloadMessage`; pemungutan suara memerlukan `selectors.pollVoteMessage` dan metode RPC `poll.vote`. Plugin OpenClaw hanya mengiklankan tindakan yang didukung oleh pemeriksaan tersimpan dalam cache, sedangkan cache kosong tetap optimistis dan melakukan pemeriksaan pada pengiriman pertama.

Jika `openclaw channels status --probe` melaporkan kanal sebagai `works`, tetapi tindakan tertentu memunculkan "iMessage `<action>` requires the imsg private API bridge" saat dikirim, jalankan kembali `imsg launch` — pembantu dapat terlepas (Messages.app dimulai ulang, pembaruan OS, dan sebagainya) dan status `available: true` yang tersimpan dalam cache akan terus mengiklankan tindakan hingga pemeriksaan berikutnya memperbaruinya.

### Saat SIP tetap diaktifkan

Jika menonaktifkan SIP tidak dapat diterima untuk model ancaman Anda:

- `imsg` kembali ke mode dasar — hanya teks + media + penerimaan.
- Plugin OpenClaw tetap mengiklankan pengiriman teks/media dan pemantauan pesan masuk; Plugin menyembunyikan `react`, `edit`, `unsend`, `reply`, `sendWithEffect`, dan operasi grup dari permukaan tindakan (sesuai pemeriksaan kemampuan per metode).
- Anda dapat menjalankan Mac non-Apple-Silicon terpisah (atau Mac bot khusus) dengan SIP dinonaktifkan untuk beban kerja iMessage, sambil tetap mengaktifkan SIP pada perangkat utama Anda. Lihat [Pengguna macOS bot khusus (identitas iMessage terpisah)](#deployment-patterns) di bawah.

## Kontrol akses dan perutean

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.imessage.dmPolicy` mengontrol pesan langsung:

    - `pairing` (bawaan)
    - `allowlist` (memerlukan setidaknya satu entri `allowFrom`)
    - `open` (mengharuskan `allowFrom` menyertakan `"*"`)
    - `disabled`

    Kolom daftar izin: `channels.imessage.allowFrom`.

    Entri daftar izin harus mengidentifikasi pengirim: handle atau grup akses pengirim statis (`accessGroup:<name>`). Gunakan `channels.imessage.groupAllowFrom` untuk target percakapan seperti `chat_id:*`, `chat_guid:*`, atau `chat_identifier:*`; gunakan `channels.imessage.groups` untuk kunci registri `chat_id` numerik.

  </Tab>

  <Tab title="Kebijakan grup + penyebutan">
    `channels.imessage.groupPolicy` mengontrol penanganan grup:

    - `allowlist` (bawaan)
    - `open`
    - `disabled`

    Daftar izin pengirim grup: `channels.imessage.groupAllowFrom`.

    Entri `groupAllowFrom` juga dapat merujuk ke grup akses pengirim statis (`accessGroup:<name>`).

    Fallback runtime: jika `groupAllowFrom` tidak diatur, pemeriksaan pengirim grup iMessage menggunakan `allowFrom`; atur `groupAllowFrom` jika penerimaan DM dan grup harus berbeda. `groupAllowFrom: []` yang secara eksplisit kosong tidak melakukan fallback — nilai ini memblokir semua pengirim grup di bawah `allowlist`.
    Catatan runtime: jika `channels.imessage` sama sekali tidak ada, runtime melakukan fallback ke `groupPolicy="allowlist"` dan mencatat peringatan (meskipun `channels.defaults.groupPolicy` telah diatur).

    <Warning>
    Perutean grup di bawah `groupPolicy: "allowlist"` menjalankan **dua** pemeriksaan secara berurutan:

    1. **Daftar izin pengirim** (`channels.imessage.groupAllowFrom`) — handle, `accessGroup:<name>`, `chat_guid`, `chat_identifier`, atau `chat_id`. Daftar efektif yang kosong (tanpa `groupAllowFrom` dan tanpa fallback `allowFrom`) memblokir setiap pengirim grup.
    2. **Registri grup** (`channels.imessage.groups`) — diberlakukan setelah peta memiliki entri: percakapan harus cocok dengan entri per-`chat_id` yang eksplisit atau wildcard `groups: { "*": { ... } }`. Saat `groups` kosong atau tidak ada, hanya daftar izin pengirim yang menentukan penerimaan.

    Jika tidak ada daftar izin pengirim grup efektif yang dikonfigurasi, setiap pesan grup dibuang sebelum pemeriksaan registri. Setiap pemeriksaan memiliki sinyal tingkat `warn` tersendiri pada tingkat log bawaan, dan masing-masing menyebutkan perbaikan yang berbeda:

    - satu kali per akun saat dimulai, ketika daftar izin pengirim grup efektif kosong: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — perbaiki dengan mengatur `channels.imessage.groupAllowFrom` (atau `allowFrom`); menambahkan entri `groups` saja membuat pemeriksaan 1 tetap memblokir setiap pengirim.
    - satu kali per `chat_id` saat runtime, ketika pengirim lolos pemeriksaan 1 tetapi percakapan tidak tercantum dalam registri `groups` yang terisi: `imessage: dropping group message from chat_id=<id> ...` — perbaiki dengan menambahkan `chat_id` tersebut (atau `"*"`) di bawah `channels.imessage.groups`.

    DM tidak terpengaruh — DM menggunakan jalur kode yang berbeda.

    Konfigurasi yang disarankan untuk alur grup di bawah `groupPolicy: "allowlist"`:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    `groupAllowFrom` saja menerima pengirim tersebut di grup mana pun; tambahkan blok `groups` untuk membatasi percakapan yang diizinkan (dan menetapkan opsi per percakapan seperti `requireMention`).
    </Warning>

    Pemeriksaan penyebutan untuk grup:

    - iMessage tidak memiliki metadata penyebutan bawaan
    - deteksi penyebutan menggunakan pola regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - tanpa pola yang dikonfigurasi, pemeriksaan penyebutan tidak dapat diberlakukan
    - perintah kontrol dari pengirim yang diotorisasi melewati pemeriksaan penyebutan

    `systemPrompt` per grup:

    Setiap entri di bawah `channels.imessage.groups.*` menerima string `systemPrompt` opsional, yang diinjeksikan ke prompt sistem agen pada setiap giliran yang menangani pesan dalam grup tersebut. Resolusinya mengikuti `channels.whatsapp.groups`:

    1. **Prompt sistem khusus grup** (`groups["<chat_id>"].systemPrompt`): digunakan ketika entri grup tertentu ada dalam peta **dan** kunci `systemPrompt`-nya ditentukan. Jika `systemPrompt` adalah string kosong (`""`), wildcard ditekan dan tidak ada prompt sistem yang diterapkan pada grup tersebut.
    2. **Prompt sistem wildcard grup** (`groups["*"].systemPrompt`): digunakan ketika entri grup tertentu sama sekali tidak ada dalam peta, atau ketika entri tersebut ada tetapi tidak menentukan kunci `systemPrompt`.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Gunakan ejaan Britania." },
            "8421": {
              requireMention: true,
              systemPrompt: "Ini adalah percakapan rotasi petugas siaga. Batasi balasan hingga kurang dari 3 kalimat.",
            },
            "9907": {
              // penekanan eksplisit: wildcard "Gunakan ejaan Britania." tidak berlaku di sini
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Prompt per grup hanya berlaku untuk pesan grup — pesan langsung tidak terpengaruh.

  </Tab>

  <Tab title="Sesi dan balasan deterministik">
    - DM menggunakan perutean langsung; grup menggunakan perutean grup.
    - Dengan `session.dmScope=main` bawaan, DM iMessage digabungkan ke sesi utama agen.
    - Sesi grup diisolasi (`agent:<agentId>:imessage:group:<chat_id>`).
    - Balasan dirutekan kembali ke iMessage menggunakan metadata kanal/target asal.

    Perilaku utas menyerupai grup:

    Beberapa utas iMessage dengan banyak peserta dapat diterima dengan `is_group=false`.
    Jika `chat_id` tersebut dikonfigurasi secara eksplisit di bawah `channels.imessage.groups`, OpenClaw memperlakukannya sebagai lalu lintas grup (pemeriksaan grup + isolasi sesi grup).

  </Tab>
</Tabs>

## Pengikatan percakapan ACP

Percakapan iMessage dapat diikat ke sesi ACP.

Alur cepat operator:

- Jalankan `/acp spawn codex --bind here` di dalam DM atau percakapan grup yang diizinkan.
- Pesan berikutnya dalam percakapan iMessage yang sama dirutekan ke sesi ACP yang dibuat.
- `/new` dan `/reset` mengatur ulang sesi ACP terikat yang sama tanpa menggantinya.
- `/acp close` menutup sesi ACP dan menghapus pengikatannya.

Pengikatan persisten yang dikonfigurasi menggunakan entri `bindings[]` tingkat atas dengan `type: "acp"` dan `match.channel: "imessage"`.

`match.peer.id` dapat menggunakan:

- handle DM yang dinormalisasi seperti `+15555550123` atau `user@example.com`
- `chat_id:<id>` (disarankan untuk pengikatan grup yang stabil)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Contoh:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Lihat [Agen ACP](/id/tools/acp-agents) untuk perilaku pengikatan ACP bersama.

## Pola penerapan

<AccordionGroup>
  <Accordion title="Pengguna macOS bot khusus (identitas iMessage terpisah)">
    Gunakan Apple ID dan pengguna macOS khusus agar lalu lintas bot terisolasi dari profil Messages pribadi Anda.

    Alur umum:

    1. Buat/masuk ke pengguna macOS khusus.
    2. Masuk ke Messages dengan Apple ID bot pada pengguna tersebut.
    3. Instal `imsg` pada pengguna tersebut.
    4. Buat pembungkus SSH agar OpenClaw dapat menjalankan `imsg` dalam konteks pengguna tersebut.
    5. Arahkan `channels.imessage.accounts.<id>.cliPath` dan `.dbPath` ke profil pengguna tersebut.

    Proses pertama mungkin memerlukan persetujuan GUI (Automation + Full Disk Access) dalam sesi pengguna bot tersebut.

  </Accordion>

  <Accordion title="Mac jarak jauh melalui Tailscale (contoh)">
    Topologi umum:

    - gateway berjalan di Linux/VM
    - iMessage + `imsg` berjalan di Mac dalam tailnet Anda
    - pembungkus `cliPath` menggunakan SSH untuk menjalankan `imsg`
    - `remoteHost` mengaktifkan pengambilan lampiran melalui SCP

    Contoh:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    Gunakan kunci SSH agar SSH dan SCP bersifat noninteraktif.
    Pastikan kunci host dipercaya terlebih dahulu (misalnya `ssh bot@mac-mini.tailnet-1234.ts.net`) agar `known_hosts` terisi.

  </Accordion>

  <Accordion title="Pola multiakun">
    iMessage mendukung konfigurasi per akun di bawah `channels.imessage.accounts`.

    Setiap akun dapat mengganti bidang seperti `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, pengaturan riwayat, dan daftar izin root lampiran.

  </Accordion>

  <Accordion title="Riwayat pesan langsung">
    Atur `channels.imessage.dmHistoryLimit` untuk mengisi sesi pesan langsung baru dengan riwayat `imsg` terbaru yang telah didekode untuk percakapan tersebut. Gunakan `channels.imessage.dms["<sender>"].historyLimit` untuk penggantian per pengirim, termasuk `0` guna menonaktifkan riwayat bagi seorang pengirim.

    Riwayat DM iMessage diambil sesuai permintaan dari `imsg`. Membiarkan `dmHistoryLimit` tidak diatur akan menonaktifkan pengisian riwayat DM global, tetapi nilai positif `channels.imessage.dms["<sender>"].historyLimit` per pengirim tetap mengaktifkan pengisian bagi pengirim tersebut.

  </Accordion>
</AccordionGroup>

## Media, pemenggalan, dan target pengiriman

<AccordionGroup>
  <Accordion title="Lampiran dan media">
    - penyerapan lampiran masuk **dinonaktifkan secara default** — atur `channels.imessage.includeAttachments: true` untuk meneruskan foto, memo suara, video, dan lampiran lainnya ke agen. Jika dinonaktifkan, iMessage yang hanya berisi lampiran dibuang sebelum mencapai agen dan mungkin sama sekali tidak menghasilkan baris log `Inbound message`.
    - jalur lampiran jarak jauh dapat diambil melalui SCP ketika `remoteHost` diatur
    - jalur lampiran harus cocok dengan root yang diizinkan:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (mode SCP jarak jauh)
      - root yang dikonfigurasi memperluas pola root default `/Users/*/Library/Messages/Attachments` (digabungkan, bukan diganti)
    - SCP menggunakan pemeriksaan kunci host yang ketat (`StrictHostKeyChecking=yes`)
    - ukuran media keluar menggunakan `channels.imessage.mediaMaxMb` (default 16 MB)

  </Accordion>

  <Accordion title="Teks keluar dan pemenggalan">
    - batas potongan teks: `channels.imessage.textChunkLimit` (default 4000)
    - mode pemenggalan: `channels.imessage.streaming.chunkMode`
      - `length` (default)
      - `newline` (pemisahan dengan mengutamakan paragraf)
    - tebal/miring/garis bawah/coret markdown keluar dikonversi menjadi teks bergaya native (penerima macOS 15+ merender gaya tersebut; penerima versi lama melihat teks biasa tanpa penanda); tabel markdown dikonversi sesuai mode tabel markdown saluran
    - `channels.imessage.sendTransport` (`auto` default, `bridge`, `applescript`) memilih cara `imsg` mengirim pesan

  </Accordion>

  <Accordion title="Format pengalamatan">
    Target eksplisit yang disarankan:

    - `chat_id:123` (disarankan untuk perutean yang stabil)
    - `chat_guid:...`
    - `chat_identifier:...`

    Target handle juga didukung:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Tindakan API privat

Ketika `imsg launch` berjalan dan `openclaw channels status --probe` melaporkan `privateApi.available: true`, alat pesan dapat menggunakan tindakan native iMessage selain pengiriman teks biasa.

Semua tindakan diaktifkan secara default; gunakan `channels.imessage.actions` untuk menonaktifkan tindakan tertentu:

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Tindakan yang tersedia">
    - **react**: Menambahkan/menghapus tapback iMessage (`messageId`, `emoji`, `remove`). Tapback yang didukung dipetakan ke cinta, suka, tidak suka, tertawa, penekanan, dan pertanyaan. Menghapus tanpa emoji akan menghapus tapback apa pun yang telah diatur.
    - **reply**: Mengirim balasan berutas ke pesan yang ada (`messageId`, `text` atau `message`, ditambah `chatGuid`, `chatId`, `chatIdentifier`, atau `to`). Balasan dengan lampiran juga memerlukan build `imsg` yang `send-rich`-nya mendukung `--file`.
    - **sendWithEffect**: Mengirim teks dengan efek iMessage (`text` atau `message`, `effect` atau `effectId`). Nama pendek: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight.
    - **edit**: Mengedit pesan terkirim pada versi macOS/API privat yang didukung (`messageId`, `text` atau `newText`). Hanya pesan yang dikirim oleh gateway itu sendiri yang dapat diedit.
    - **unsend**: Menarik kembali pesan terkirim pada versi macOS/API privat yang didukung (`messageId`). Hanya pesan yang dikirim oleh gateway itu sendiri yang dapat ditarik kembali.
    - **upload-file**: Mengirim media/berkas (`buffer` sebagai base64 atau `media`/`path`/`filePath` yang telah dihidrasi, `filename`, `asVoice` opsional). Alias lama: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Mengelola obrolan grup ketika target saat ini merupakan percakapan grup. Tindakan ini mengubah identitas Messages milik host, sehingga memerlukan pengirim pemilik atau klien Gateway `operator.admin`.
    - **poll**: Membuat jajak pendapat native Apple Messages (`pollQuestion`, `pollOption` yang diulang 2 hingga 12 kali, ditambah `chatGuid`, `chatId`, `chatIdentifier`, atau `to`). Penerima di iOS/iPadOS/macOS 26+ dapat melihat dan memberikan suara secara native; versi OS lama menerima teks pengganti "Mengirim jajak pendapat". Memerlukan `selectors.pollPayloadMessage`.
    - **poll-vote**: Memberikan suara pada jajak pendapat yang ada (`pollId` atau `messageId`, ditambah tepat salah satu dari `pollOptionIndex`, `pollOptionId`, atau `pollOptionText`). Memerlukan `selectors.pollVoteMessage` dan metode RPC `poll.vote`.

    Jajak pendapat masuk yang diterima dirender untuk agen dengan pertanyaan, label opsi bernomor, jumlah suara, dan ID pesan jajak pendapat yang diperlukan oleh `poll-vote`.

  </Accordion>

  <Accordion title="ID pesan">
    Konteks iMessage masuk menyertakan nilai pendek `MessageSid` dan GUID pesan lengkap (`MessageSidFull`) jika tersedia. ID pendek terbatas pada cache balasan terbaru berbasis SQLite dan diperiksa terhadap obrolan saat ini sebelum digunakan. Jika ID pendek kedaluwarsa, coba lagi dengan `MessageSidFull`-nya sambil menargetkan percakapan yang menyediakannya. ID lengkap tidak melewati pengikatan percakapan atau akun, jadi ganti ID dari obrolan lain dengan ID dari target saat ini. Panggilan terdelegasi jarak jauh dapat menolak ID lengkap yang kedaluwarsa ketika bukti percakapan saat ini tidak tersedia.

  </Accordion>

  <Accordion title="Deteksi kapabilitas">
    OpenClaw menyembunyikan tindakan API privat hanya ketika status pemeriksaan yang disimpan dalam cache menyatakan bridge tidak tersedia. Jika status tidak diketahui, tindakan tetap terlihat dan pengiriman menjalankan pemeriksaan secara malas agar tindakan pertama dapat berhasil setelah `imsg launch` tanpa penyegaran status manual terpisah.

  </Accordion>

  <Accordion title="Tanda dibaca dan indikator mengetik">
    Ketika bridge API privat aktif, obrolan masuk yang diterima ditandai telah dibaca dan obrolan langsung menampilkan gelembung mengetik segera setelah giliran diterima, sementara agen menyiapkan konteks dan menghasilkan respons. Nonaktifkan penandaan telah dibaca dengan:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Build `imsg` lama yang dibuat sebelum daftar kapabilitas per metode secara diam-diam menonaktifkan indikator mengetik/tanda dibaca; OpenClaw mencatat peringatan satu kali per mulai ulang agar tanda dibaca yang hilang dapat diketahui penyebabnya.

  </Accordion>

  <Accordion title="Tapback masuk">
    OpenClaw berlangganan tapback iMessage dan merutekan reaksi yang diterima sebagai peristiwa sistem, bukan teks pesan biasa, sehingga tapback pengguna tidak memicu perulangan balasan biasa.

    Mode notifikasi dikendalikan oleh `channels.imessage.reactionNotifications`:

    - `"own"` (default): beri tahu hanya ketika pengguna bereaksi terhadap pesan yang dibuat bot.
    - `"all"`: beri tahu untuk semua tapback masuk dari pengirim yang diotorisasi.
    - `"off"`: abaikan tapback masuk.

    Penggantian per akun menggunakan `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Reaksi persetujuan (👍 / 👎)">
    Ketika `approvals.exec.enabled` atau `approvals.plugin.enabled` bernilai true dan permintaan dirutekan ke iMessage, gateway mengirimkan perintah persetujuan secara native dan menerima tapback untuk menyelesaikannya:

    - `👍` (tapback Suka) → `allow-once`
    - `👎` (tapback Tidak Suka) → `deny`
    - `allow-always` tetap menjadi alternatif manual: kirim `/approve <id> allow-always` sebagai balasan biasa.

    Penanganan reaksi mengharuskan handle pengguna yang bereaksi menjadi pemberi persetujuan eksplisit. Daftar pemberi persetujuan dibaca dari `channels.imessage.allowFrom` (atau `channels.imessage.accounts.<id>.allowFrom`); tambahkan nomor telepon pengguna dalam format E.164 atau email Apple ID mereka (target obrolan seperti `chat_id:*` bukan entri pemberi persetujuan yang valid). Entri wildcard `"*"` diterapkan tetapi memungkinkan pengirim mana pun untuk menyetujui; daftar pemberi persetujuan kosong sepenuhnya menonaktifkan pintasan reaksi. Pintasan reaksi sengaja melewati `reactionNotifications`, `dmPolicy`, dan `groupAllowFrom` karena daftar izin pemberi persetujuan eksplisit adalah satu-satunya gerbang yang relevan untuk penyelesaian persetujuan.

    Otorisasi perintah teks `/approve` mengikuti daftar yang sama: ketika `channels.imessage.allowFrom` tidak kosong, `/approve <id> <decision>` diotorisasi berdasarkan daftar pemberi persetujuan tersebut (bukan daftar izin DM yang lebih luas), dan pengirim yang diizinkan dalam daftar izin DM tetapi tidak tercantum di `allowFrom` menerima penolakan eksplisit. Ketika `allowFrom` kosong, alternatif obrolan yang sama tetap berlaku dan `/approve` mengotorisasi siapa pun yang diizinkan oleh daftar izin DM. Tambahkan setiap operator yang harus dapat menyetujui — melalui `/approve` atau melalui reaksi — ke `allowFrom`.

    Catatan operator:
    - Pengikatan reaksi disimpan baik di memori maupun di penyimpanan persisten berkunci milik Gateway (TTL disesuaikan dengan masa berlaku persetujuan), dan Gateway juga melakukan polling terhadap prompt yang tertunda untuk mencari tapback, sehingga tapback yang masuk sesaat setelah Gateway dimulai ulang tetap menyelesaikan persetujuan.
    - Tapback `is_from_me=true` milik operator sendiri (misalnya dari perangkat Apple yang dipasangkan) menyelesaikan persetujuan ketika handle tersebut merupakan pemberi persetujuan yang ditentukan secara eksplisit.
    - Prompt persetujuan diarahkan ke percakapan grup hanya ketika pemberi persetujuan eksplisit dikonfigurasi; jika tidak, setiap anggota grup dapat menyetujuinya.
    - Tapback bergaya teks lama (teks biasa `Liked "…"` dari klien Apple yang sangat lama) tidak dapat menyelesaikan persetujuan karena tidak membawa GUID pesan; penyelesaian reaksi memerlukan metadata tapback terstruktur yang dipancarkan oleh klien macOS / iOS saat ini.

  </Accordion>

  <Accordion title="Reaksi pertanyaan (1️⃣ / 2️⃣ / 3️⃣ / 4️⃣)">
    Untuk prompt `ask_user` dengan satu pertanyaan nonrahasia berjenis pilihan tunggal dan satu hingga empat opsi, OpenClaw menambahkan pilihan emoji bernomor. Berikan reaksi pada prompt yang dikirim dengan nomor yang sesuai untuk menjawabnya. Reaksi tersebut harus membawa GUID stabil dari pesan yang dibuat oleh bot; OpenClaw kemudian memetakan nomor tersebut ke opsi kanonis melalui Gateway. Ketukan usang atau duplikat diabaikan.

    Prompt dengan beberapa pertanyaan, beberapa pilihan, dan teks bebas tetap hanya dapat dijawab melalui balasan teks. Reaksi pertanyaan mengikuti aturan penerimaan DM/grup iMessage yang normal. Reaksi tersebut dikenali bahkan ketika `reactionNotifications` adalah `"off"`, tanpa mengubah reaksi yang tidak terkait menjadi peristiwa agen.

  </Accordion>
</AccordionGroup>

## Penulisan konfigurasi

iMessage secara default mengizinkan penulisan konfigurasi yang dimulai oleh saluran (untuk `/config set|unset` ketika `commands.config: true`).

Nonaktifkan:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Menggabungkan DM yang terkirim terpisah (perintah + URL dalam satu komposisi)

Ketika pengguna mengetik perintah dan URL secara bersamaan — misalnya `Dump https://example.com/article` — aplikasi Messages milik Apple membagi pengiriman menjadi **dua baris `chat.db` yang terpisah**:

1. Pesan teks (`"Dump"`).
2. Balon pratinjau URL (`"https://..."`) dengan gambar pratinjau OG sebagai lampiran.

Pada sebagian besar konfigurasi, kedua baris tiba di OpenClaw dengan selang ~0.8-2.0 dtk. Tanpa penggabungan, agen menerima perintah saja pada giliran 1 (dan sering membalas "kirimkan URL kepada saya") sebelum URL tiba pada giliran 2. Ini merupakan pipeline pengiriman Apple, bukan sesuatu yang diperkenalkan oleh OpenClaw atau `imsg`.

`channels.imessage.coalesceSameSenderDms` mengikutsertakan DM dalam penyanggaan baris berurutan dari pengirim yang sama. Ketika `imsg` mengekspos penanda struktural pratinjau URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` pada salah satu baris sumber, OpenClaw hanya menggabungkan pengiriman terpisah yang sebenarnya dan mempertahankan baris lain yang disangga sebagai giliran terpisah. Pada build `imsg` lama yang sama sekali tidak memancarkan metadata balon, OpenClaw tidak dapat membedakan pengiriman terpisah dari pengiriman yang berbeda, sehingga kembali menggabungkan kumpulan tersebut. Hal ini mempertahankan perilaku sebelum adanya metadata, alih-alih meregresikan pengiriman terpisah `Dump <url>` menjadi dua giliran. Obrolan grup tetap dikirim per pesan agar struktur giliran beberapa pengguna tetap dipertahankan.

<Tabs>
  <Tab title="Kapan perlu diaktifkan">
    Aktifkan ketika:

    - Anda menyediakan Skills yang mengharapkan `command + payload` dalam satu pesan (dump, tempel, simpan, antrekan, dan sebagainya).
    - Pengguna Anda menempelkan URL bersama perintah.
    - Anda dapat menerima latensi tambahan pada giliran DM (lihat di bawah).

    Biarkan nonaktif ketika:

    - Anda memerlukan latensi perintah minimum untuk pemicu DM satu kata.
    - Semua alur Anda berupa perintah sekali jalan tanpa muatan tindak lanjut.

  </Tab>
  <Tab title="Mengaktifkan">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Dengan flag aktif dan tanpa `messages.inbound.byChannel.imessage` eksplisit atau `messages.inbound.debounceMs` global, jendela debounce diperlebar menjadi **7000 ms** (nilai default lama adalah 0 ms — tanpa debounce). Jendela yang lebih lebar diperlukan karena jeda pengiriman terpisah untuk pratinjau URL Apple dapat berlangsung hingga beberapa detik saat Messages.app memancarkan baris pratinjau.

    Untuk menyesuaikan sendiri jendelanya:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Konsekuensi">
    - **Penggabungan yang presisi memerlukan metadata muatan `imsg` saat ini.** Jika `balloon_bundle_id` tersedia, hanya pengiriman terpisah yang sebenarnya yang digabungkan; penggabungan fallback tanpa metadata yang dijelaskan di atas merupakan kompatibilitas mundur sementara dan akan dihapus setelah `imsg` menggabungkan pengiriman terpisah di hulu.
    - **Latensi tambahan untuk pesan DM.** Dengan flag aktif, setiap DM (termasuk perintah kontrol mandiri dan tindak lanjut berupa satu teks) menunggu hingga jendela debounce berakhir sebelum dikirim, untuk mengantisipasi datangnya baris pratinjau URL. Pesan obrolan grup tetap dikirim seketika.
    - **Keluaran gabungan dibatasi.** Teks gabungan dibatasi hingga 4000 karakter dengan penanda `…[truncated]` eksplisit; lampiran dibatasi hingga 20; entri sumber dibatasi hingga 10 (entri pertama beserta yang terbaru dipertahankan jika melebihi batas tersebut). Setiap GUID sumber dilacak di `coalescedMessageGuids` untuk telemetri hilir.
    - **Khusus DM.** Obrolan grup diteruskan ke pengiriman per pesan agar bot tetap responsif ketika beberapa orang sedang mengetik.
    - **Keikutsertaan opsional, per saluran.** Saluran lain (Discord, Slack, Telegram, WhatsApp, …) tidak terpengaruh. Konfigurasi BlueBubbles lama yang menetapkan `channels.bluebubbles.coalesceSameSenderDms` harus memigrasikan nilai tersebut ke `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Skenario dan apa yang dilihat agen

Kolom "Flag aktif" menunjukkan perilaku pada build `imsg` yang memancarkan `balloon_bundle_id`. Pada build `imsg` lama yang sama sekali tidak memancarkan metadata balon, baris di bawah yang ditandai "Dua giliran" / "N giliran" akan beralih ke penggabungan lama (satu giliran): OpenClaw secara struktural tidak dapat membedakan pengiriman terpisah dari pengiriman yang berbeda, sehingga mempertahankan penggabungan sebelum adanya metadata. Pemisahan yang presisi diaktifkan setelah build memancarkan metadata balon.

| Komposisi pengguna                                                      | Hasil dari `chat.db`                  | Flag nonaktif (default)                      | Flag aktif + jendela (imsg memancarkan metadata balon)                                                      |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (satu pengiriman)                              | 2 baris dengan selang ~1 dtk                   | Dua giliran agen: "Dump" saja, lalu URL | Satu giliran: teks gabungan `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption` (lampiran + teks)                | 2 baris tanpa metadata balon URL | Dua giliran                               | Dua giliran setelah metadata teramati; satu giliran gabungan pada sesi lama/sebelum latch tanpa metadata       |
| `/status` (perintah mandiri)                                     | 1 baris                               | Pengiriman seketika                        | **Tunggu hingga jendela berakhir, lalu kirim**                                                                |
| URL ditempelkan sendiri                                                   | 1 baris                               | Pengiriman seketika                        | Tunggu hingga jendela berakhir, lalu kirim                                                                    |
| Teks + URL sengaja dikirim sebagai dua pesan terpisah dengan selang beberapa menit | 2 baris di luar jendela               | Dua giliran                               | Dua giliran (jendela berakhir di antara keduanya)                                                             |
| Banjir cepat (>10 DM kecil dalam jendela)                          | N baris tanpa metadata balon URL | N giliran                                 | N giliran setelah metadata teramati; satu giliran gabungan terbatas pada sesi lama/sebelum latch tanpa metadata |
| Dua orang mengetik dalam obrolan grup                                  | N baris dari M pengirim               | M+ giliran (satu per kumpulan pengirim)        | M+ giliran — obrolan grup tidak digabungkan                                                            |

## Pemulihan masuk setelah bridge atau Gateway dimulai ulang

iMessage memulihkan pesan yang terlewat saat Gateway tidak aktif, sekaligus mencegah "bom backlog" usang yang dapat dikirim Apple setelah pemulihan Push. Perilaku default ini selalu aktif dan dibangun berdasarkan ingress tahan lama serta pembatas usia.

- **Perlindungan replay tahan lama.** Sebelum memajukan kursor pemulihan, OpenClaw mencatat setiap baris mentah dalam antrean ingress SQLite bersama menggunakan GUID Apple-nya sebagai ID peristiwa. Baris yang selesai meninggalkan tombstone selama sekitar 4 jam, dengan batas 10,000 entri, sehingga replay dengan GUID yang sama dibuang bahkan setelah proses dimulai ulang. Baris yang tertunda tetap dapat dipulihkan hingga pengiriman mengadopsinya.
- **Pemulihan waktu henti.** Saat dimulai, monitor mengingat rowid baris `chat.db` terakhir yang diterima secara tahan lama (kursor per akun yang dipersistenkan) dan meneruskannya ke `imsg watch.subscribe` sebagai `since_rowid`, sehingga imsg memutar ulang baris yang belum dicatat lalu mengikuti data langsung. Baris yang dicatat sebelum crash dilanjutkan dari SQLite. Replay dibatasi pada 500 baris terbaru dan pesan yang berusia hingga ~2 jam, sedangkan tombstone GUID membuang segala sesuatu yang telah ditangani.
- **Pembatas usia backlog usang.** Baris di atas batas awal benar-benar langsung; baris dengan tanggal pengiriman lebih dari ~15 menit sebelum waktu kedatangannya dianggap sebagai backlog hasil flush Push dan dicegah. Baris yang diputar ulang (pada atau di bawah batas) menggunakan jendela pemulihan yang lebih lebar, sehingga pesan yang baru saja terlewat dikirimkan sedangkan riwayat lama tidak.

Pemulihan berfungsi pada konfigurasi `cliPath` lokal maupun jarak jauh karena replay `since_rowid` berjalan melalui koneksi RPC `imsg` yang sama. Perbedaannya terletak pada jendela: ketika Gateway dapat membaca `chat.db` (lokal), Gateway menetapkan batas rowid awal, membatasi rentang replay, dan mengirimkan pesan yang terlewat hingga sekitar beberapa jam sebelumnya. Melalui `cliPath` SSH jarak jauh, Gateway tidak dapat membaca basis data, sehingga replay tidak dibatasi dan setiap baris menggunakan pembatas usia langsung — pesan yang baru saja terlewat tetap dipulihkan dan backlog lama tetap dicegah, hanya saja dengan jendela langsung yang lebih sempit. Jalankan Gateway pada Mac yang menjalankan Messages untuk mendapatkan jendela pemulihan yang lebih lebar.

### Sinyal yang terlihat oleh operator

Backlog yang dicegah dicatat pada level default dan tidak pernah dibuang secara diam-diam (flag `recovery` menunjukkan jendela yang diterapkan):

```text
imessage: backlog masuk usang dicegah account=<id> sent=<iso> recovery=<bool> (<N> dicegah sejak mulai)
```

### Migrasi

`channels.imessage.catchup.*` tidak digunakan lagi — pemulihan waktu henti berjalan otomatis dan tidak memerlukan konfigurasi untuk penyiapan baru. Konfigurasi yang sudah ada dengan `catchup.enabled: true` tetap dipatuhi sebagai profil kompatibilitas untuk jendela replay pemulihan. Blok catchup yang dinonaktifkan (`enabled: false` atau tanpa `enabled: true`) dihentikan; `openclaw doctor --fix` menghapusnya.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="imsg tidak ditemukan atau RPC tidak didukung">
    Validasi biner dan dukungan RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Jika probe melaporkan bahwa RPC tidak didukung, perbarui `imsg`. Jika tindakan API privat tidak tersedia, jalankan `imsg launch` dalam sesi pengguna macOS yang telah masuk, lalu lakukan probe lagi. Jika Gateway tidak berjalan di macOS, gunakan penyiapan Remote Mac melalui SSH di atas, bukan jalur lokal default `imsg`.

  </Accordion>

  <Accordion title="Pesan terkirim tetapi iMessage masuk tidak diterima">
    Pertama, pastikan apakah pesan tersebut sampai ke Mac lokal. Jika `chat.db` tidak berubah, OpenClaw tidak dapat menerima pesan tersebut meskipun `imsg status --json` melaporkan bridge yang sehat.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Jika pesan yang dikirim dari ponsel tidak membuat baris baru, perbaiki lapisan Messages macOS dan Apple Push sebelum mengubah konfigurasi OpenClaw. Penyegaran layanan sekali jalan sering kali sudah cukup:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Kirim iMessage baru dari ponsel dan konfirmasikan adanya baris `chat.db` baru atau peristiwa `imsg watch` sebelum men-debug sesi OpenClaw. Jangan menjalankan ini sebagai perulangan peluncuran ulang bridge secara berkala; `imsg launch` berulang disertai restart gateway selama pekerjaan aktif dapat mengganggu pengiriman dan membuat proses kanal yang sedang berjalan terhenti.

  </Accordion>

  <Accordion title="Gateway tidak berjalan di macOS">
    `cliPath: "imsg"` default harus berjalan di Mac yang masuk ke Messages. Di Linux atau Windows, atur `channels.imessage.cliPath` ke skrip pembungkus yang terhubung melalui SSH ke Mac tersebut dan menjalankan `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Kemudian jalankan:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DM diabaikan">
    Periksa:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - persetujuan pairing (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Pesan grup diabaikan">
    Periksa:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - perilaku daftar izin `channels.imessage.groups`
    - konfigurasi pola penyebutan (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Lampiran jarak jauh gagal">
    Periksa:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autentikasi kunci SSH/SCP dari host gateway
    - kunci host tersedia di `~/.ssh/known_hosts` pada host gateway
    - keterbacaan jalur jarak jauh pada Mac yang menjalankan Messages

  </Accordion>

  <Accordion title="Prompt izin macOS terlewat">
    Jalankan kembali di terminal GUI interaktif dalam konteks pengguna/sesi yang sama dan setujui prompt:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Konfirmasikan bahwa Full Disk Access + Automation telah diberikan untuk konteks proses yang menjalankan OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Referensi konfigurasi

- [Referensi konfigurasi - iMessage](/id/gateway/config-channels#imessage)
- [Konfigurasi Gateway](/id/gateway/configuration)
- [Pairing](/id/channels/pairing)

## Terkait

- [Ikhtisar Kanal](/id/channels) — semua kanal yang didukung
- [Penghapusan BlueBubbles dan jalur iMessage imsg](/id/announcements/bluebubbles-imessage) — pengumuman dan ringkasan migrasi
- [Beralih dari BlueBubbles](/id/channels/imessage-from-bluebubbles) — tabel penerjemahan konfigurasi dan peralihan langkah demi langkah
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan berdasarkan penyebutan
- [Perutean Kanal](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan
