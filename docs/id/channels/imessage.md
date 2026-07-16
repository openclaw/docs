---
read_when:
    - Menyiapkan dukungan iMessage
    - Men-debug pengiriman/penerimaan iMessage
summary: Dukungan iMessage native melalui imsg (JSON-RPC melalui stdio), dengan tindakan API privat untuk balasan, tapback, efek, jajak pendapat, lampiran, dan pengelolaan grup. Direkomendasikan untuk penyiapan iMessage OpenClaw baru jika persyaratan host terpenuhi.
title: iMessage
x-i18n:
    generated_at: "2026-07-16T17:45:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 78b7ff7621e66e3b0122b5581c097140b7f62998b78981741bd3edbc0e1608bd
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Untuk deployment iMessage OpenClaw yang umum, jalankan Gateway dan `imsg` pada host macOS Messages yang sama dan telah masuk. Jika Gateway berjalan di tempat lain, arahkan `channels.imessage.cliPath` ke pembungkus SSH transparan yang menjalankan `imsg` di Mac.

**Pemulihan pesan masuk berlangsung otomatis.** Setelah bridge atau gateway dimulai ulang, iMessage memutar ulang pesan yang terlewat saat tidak aktif dan menekan "ledakan backlog" usang yang dapat digelontorkan Apple setelah pemulihan Push, dengan melakukan deduplikasi agar tidak ada yang dikirim dua kali. Tidak ada konfigurasi yang perlu diaktifkan — lihat [Pemulihan pesan masuk setelah bridge atau gateway dimulai ulang](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Dukungan BlueBubbles telah dihapus. Migrasikan konfigurasi `channels.bluebubbles` ke `channels.imessage`; OpenClaw hanya mendukung iMessage melalui `imsg`. Mulailah dengan [Penghapusan BlueBubbles dan jalur iMessage imsg](/id/announcements/bluebubbles-imessage) untuk pengumuman singkat, atau [Beralih dari BlueBubbles](/id/channels/imessage-from-bluebubbles) untuk tabel migrasi lengkap.
</Warning>

Status: integrasi CLI eksternal native. Gateway menjalankan `imsg rpc` dan berkomunikasi menggunakan JSON-RPC melalui stdio — tanpa daemon atau port terpisah. Mode API privat sangat dianjurkan untuk kanal iMessage yang lengkap; balasan, tapback, efek, jajak pendapat, balasan lampiran, dan tindakan grup memerlukan `imsg launch` serta pemeriksaan API privat yang berhasil.

Untuk penyiapan lokal yang umum, penyiapan OpenClaw dapat menawarkan instalasi atau pembaruan Homebrew yang dikonfirmasi pengguna untuk `imsg` di Mac Messages yang telah masuk. Penyiapan manual dan topologi pembungkus SSH tetap dikelola operator: instal atau perbarui `imsg` dalam konteks pengguna yang sama dengan yang akan menjalankan Gateway atau pembungkus.

<CardGroup cols={3}>
  <Card title="Tindakan API privat" icon="wand-sparkles" href="#private-api-actions">
    Balasan, tapback, efek, jajak pendapat, lampiran, dan pengelolaan grup.
  </Card>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    DM iMessage secara default menggunakan mode pemasangan.
  </Card>
  <Card title="Mac jarak jauh" icon="terminal" href="#remote-mac-over-ssh">
    Gunakan pembungkus SSH saat Gateway tidak berjalan di Mac Messages.
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

        Saat wizard penyiapan lokal mendeteksi bahwa perintah default `imsg` tidak tersedia, wizard dapat meminta untuk menginstal `steipete/tap/imsg` melalui Homebrew. Jika mendeteksi `imsg` yang dikelola Homebrew, wizard dapat meminta untuk menginstal ulang atau memperbaruinya. Pembungkus `cliPath` khusus tidak diubah.

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

      <Step title="Mulai gateway">

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
    Sebagian besar penyiapan tidak memerlukan SSH. Gunakan topologi ini hanya saat Gateway tidak dapat berjalan di Mac Messages yang telah masuk. OpenClaw hanya memerlukan `cliPath` yang kompatibel dengan stdio, sehingga Anda dapat mengarahkan `cliPath` ke skrip pembungkus yang terhubung melalui SSH ke Mac jarak jauh dan menjalankan `imsg`.
    Instal dan perbarui `imsg` di Mac jarak jauh tersebut, bukan di host Gateway:

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Konfigurasi yang disarankan saat lampiran diaktifkan:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // digunakan untuk mengambil lampiran melalui SCP
      includeAttachments: true,
      // Opsional: root lampiran tambahan yang diizinkan (digabungkan dengan default
      // /Users/*/Library/Messages/Attachments).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Jika `remoteHost` tidak ditetapkan, OpenClaw mencoba mendeteksinya secara otomatis dengan mengurai skrip pembungkus SSH.
    `remoteHost` harus berupa `host` atau `user@host` (tanpa spasi atau opsi SSH); nilai yang tidak aman diabaikan.
    OpenClaw menggunakan pemeriksaan kunci host yang ketat untuk SCP, sehingga kunci host relai harus sudah ada di `~/.ssh/known_hosts`.
    Jalur lampiran divalidasi terhadap root yang diizinkan (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Setiap pembungkus `cliPath` atau proksi SSH yang ditempatkan di depan `imsg` HARUS berperilaku seperti pipa stdio transparan untuk JSON-RPC berumur panjang. OpenClaw mempertukarkan pesan JSON-RPC kecil berbingkai baris baru melalui stdin/stdout pembungkus selama masa aktif kanal:

- Teruskan setiap potongan/baris stdin **segera setelah byte tersedia** — jangan menunggu EOF.
- Teruskan setiap potongan/baris stdout dengan segera ke arah sebaliknya.
- Pertahankan baris baru.
- Hindari pembacaan pemblokiran berukuran tetap (`read(4096)`, `cat | buffer`, `read` shell default) yang dapat menghambat bingkai kecil.
- Pisahkan stderr dari aliran stdout JSON-RPC.

Pembungkus yang menyangga stdin hingga blok besar terisi akan menghasilkan gejala yang tampak seperti gangguan iMessage — `imsg rpc timeout (chats.list)` atau kanal yang berulang kali dimulai ulang — meskipun `imsg rpc` sendiri berfungsi normal. `ssh -T host imsg "$@"` (di atas) aman karena meneruskan argumen `cliPath` milik OpenClaw seperti `rpc` dan `--db`. Pipeline seperti `ssh host imsg | grep -v '^DEBUG'` TIDAK aman — alat dengan penyanggaan per baris masih dapat menahan bingkai; gunakan `stdbuf -oL -eL` pada setiap tahap jika pemfilteran harus dilakukan.
</Warning>

  </Tab>
</Tabs>

## Persyaratan dan izin (macOS)

- Messages harus sudah masuk di Mac yang menjalankan `imsg`.
- Akses Disk Penuh diperlukan untuk konteks proses yang menjalankan OpenClaw/`imsg` (akses DB Messages).
- Izin Otomasi diperlukan untuk mengirim pesan melalui Messages.app.
- Untuk tindakan lanjutan (reaksi / edit / batalkan pengiriman / balasan berutas / efek / jajak pendapat / operasi grup), Perlindungan Integritas Sistem harus dinonaktifkan — lihat [Mengaktifkan API privat imsg](#enabling-the-imsg-private-api). Pengiriman dan penerimaan teks serta media dasar tetap berfungsi tanpanya.

<Tip>
Izin diberikan per konteks proses. Jika gateway berjalan tanpa antarmuka (LaunchAgent/SSH), jalankan perintah interaktif satu kali dalam konteks yang sama untuk memicu permintaan izin:

```bash
imsg chats --limit 1
# atau
imsg send <handle> "test"
```

</Tip>

<Accordion title="Pengiriman pembungkus SSH gagal dengan AppleEvents -1743">
  Penyiapan SSH jarak jauh dapat membaca obrolan, melewati `channels status --probe`, dan memproses pesan masuk, sementara pengiriman keluar tetap gagal dengan kesalahan otorisasi AppleEvents:

```text
Tidak diotorisasi untuk mengirim event Apple ke Messages. (-1743)
```

Periksa basis data TCC pengguna Mac yang telah masuk atau System Settings > Privacy & Security > Automation. Jika entri Otomasi dicatat untuk `/usr/libexec/sshd-keygen-wrapper`, bukan untuk `imsg` atau proses shell lokal, macOS mungkin tidak menampilkan tombol Messages yang dapat digunakan untuk klien sisi server SSH tersebut:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

Dalam keadaan tersebut, mengulangi `tccutil reset AppleEvents` atau menjalankan ulang `imsg send` melalui pembungkus SSH yang sama mungkin terus gagal karena konteks proses yang memerlukan Otomasi Messages adalah pembungkus SSH, bukan aplikasi yang dapat diberi izin oleh UI.

Sebagai gantinya, gunakan salah satu konteks proses `imsg` yang didukung:

- Jalankan Gateway, atau setidaknya bridge `imsg`, dalam sesi lokal pengguna Messages yang telah masuk.
- Mulai Gateway dengan LaunchAgent untuk pengguna tersebut setelah memberikan Akses Disk Penuh dan Otomasi dari sesi yang sama.
- Jika tetap menggunakan topologi SSH dua pengguna, pastikan pengiriman keluar `imsg send` yang sebenarnya berhasil melalui pembungkus yang persis sama sebelum mengaktifkan kanal. Jika izin Otomasi tidak dapat diberikan, konfigurasi ulang ke penyiapan `imsg` satu pengguna alih-alih mengandalkan pembungkus SSH untuk pengiriman.

</Accordion>

## Mengaktifkan API privat imsg

`imsg` tersedia dalam dua mode operasional. Untuk OpenClaw, mode API Privat adalah penyiapan yang disarankan karena memberikan tindakan native iMessage yang diharapkan pengguna pada kanal. Mode dasar tetap berguna untuk instalasi berisiko rendah, verifikasi awal, atau host tempat SIP tidak dapat dinonaktifkan.

- **Mode dasar** (default, tidak memerlukan perubahan SIP): teks dan media keluar melalui `send`, pemantauan/riwayat pesan masuk, daftar obrolan. Inilah yang langsung tersedia dari `brew install steipete/tap/imsg` baru beserta izin macOS standar di atas.
- **Mode API privat**: `imsg` menyuntikkan dylib pembantu ke dalam `Messages.app` untuk memanggil fungsi internal `IMCore`. Ini membuka akses ke `react`, `edit`, `unsend`, `reply` (berutas), `sendWithEffect`, `poll` dan `poll-vote` (jajak pendapat native Messages), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, serta indikator pengetikan dan tanda terima telah dibaca.

Permukaan tindakan yang disarankan pada halaman ini memerlukan mode API Privat. README `imsg` secara tegas menyatakan persyaratannya:

> Fitur lanjutan seperti `read`, `typing`, `launch`, pengiriman kaya yang didukung bridge, mutasi pesan, dan pengelolaan obrolan bersifat opsional. Fitur tersebut mengharuskan SIP dinonaktifkan dan dylib pembantu disuntikkan ke dalam `Messages.app`. `imsg launch` menolak melakukan penyuntikan saat SIP diaktifkan.

Teknik penyuntikan pembantu menggunakan dylib milik `imsg` untuk mengakses API privat Messages. Tidak ada server pihak ketiga atau runtime BlueBubbles dalam jalur iMessage OpenClaw.

<Warning>
**Menonaktifkan SIP merupakan kompromi keamanan yang nyata.** SIP adalah salah satu perlindungan inti macOS terhadap eksekusi kode sistem yang dimodifikasi; menonaktifkannya di seluruh sistem membuka permukaan serangan dan efek samping tambahan. Khususnya, **menonaktifkan SIP di Mac Apple Silicon juga menonaktifkan kemampuan untuk menginstal dan menjalankan aplikasi iOS di Mac Anda**.

Perlakukan ini sebagai pilihan operasional yang disengaja, terutama pada Mac pribadi utama. Untuk iMessage OpenClaw berkualitas produksi, sebaiknya gunakan Mac khusus atau pengguna bot macOS yang memungkinkan pengaktifan bridge dengan nyaman. Jika model ancaman Anda tidak dapat menoleransi SIP yang dinonaktifkan di mana pun, iMessage yang dibundel terbatas pada mode dasar — hanya pengiriman/penerimaan teks dan media, tanpa reaksi / edit / batalkan pengiriman / efek / operasi grup.
</Warning>

### Penyiapan

1. **Instal (atau tingkatkan) `imsg`** di Mac yang menjalankan Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   Keluaran `imsg status --json` melaporkan `bridge_version`, `rpc_methods`, dan `selectors` per metode agar Anda dapat melihat dukungan build saat ini sebelum memulai.

2. **Nonaktifkan System Integrity Protection, dan (pada macOS modern) Library Validation.** Menyuntikkan dylib pembantu non-Apple ke dalam `Messages.app` yang ditandatangani Apple memerlukan SIP dinonaktifkan **dan** validasi pustaka dilonggarkan. Langkah SIP dalam mode Recovery bergantung pada versi macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** nonaktifkan Library Validation melalui Terminal, mulai ulang ke Recovery Mode, jalankan `csrutil disable`, mulai ulang.
   - **macOS 11+ (Big Sur dan yang lebih baru), Intel:** Recovery Mode (atau Internet Recovery), `csrutil disable`, mulai ulang.
   - **macOS 11+, Apple Silicon:** gunakan urutan penyalaan dengan tombol daya untuk masuk ke Recovery; pada versi macOS terbaru, tahan tombol **Left Shift** saat Anda mengeklik Continue, lalu `csrutil disable`. Penyiapan mesin virtual mengikuti alur terpisah, jadi buat snapshot VM terlebih dahulu.

   **Pada macOS 11 dan yang lebih baru, `csrutil disable` saja biasanya tidak cukup.** Apple masih memberlakukan validasi pustaka terhadap `Messages.app` sebagai biner platform, sehingga pembantu yang ditandatangani secara ad hoc ditolak (`Library Validation failed: ... platform binary, but mapped file is not`) meskipun SIP dinonaktifkan. Setelah menonaktifkan SIP, nonaktifkan juga validasi pustaka dan mulai ulang:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), diverifikasi pada 26.5.1:** SIP dinonaktifkan **ditambah** perintah `DisableLibraryValidation` di atas sudah cukup untuk menyuntikkan pembantu pada versi 26.0 hingga 26.5.x. **Tidak diperlukan boot-args.** Plist tersebut merupakan faktor penentu dan langkah yang paling sering terlewat ketika penyuntikan gagal pada Tahoe:
   - **Dengan plist:** `imsg launch` menyuntikkan dan `imsg status` melaporkan `advanced_features: true`.
   - **Tanpa plist (bahkan dengan SIP dinonaktifkan):** `imsg launch` gagal dengan `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI menolak pembantu ad hoc saat dimuat, sehingga bridge tidak pernah siap dan peluncuran kehabisan waktu. Kehabisan waktu tersebut adalah gejala yang dialami sebagian besar pengguna pada Tahoe; perbaikannya adalah plist di atas, bukan tindakan yang lebih drastis.

   Jika penyuntikan `imsg launch` atau `selectors` tertentu mulai mengembalikan false setelah peningkatan macOS, gate ini biasanya menjadi penyebabnya. Periksa status SIP dan validasi pustaka sebelum menganggap langkah SIP itu sendiri gagal. Jika pengaturan tersebut sudah benar dan bridge masih tidak dapat menyuntikkan, kumpulkan `imsg status --json` beserta keluaran `imsg launch` dan laporkan ke proyek `imsg`, alih-alih melemahkan kontrol keamanan tambahan di seluruh sistem.

3. **Suntikkan pembantu.** Dengan SIP dinonaktifkan dan Messages.app sudah masuk:

   ```bash
   imsg launch
   ```

   `imsg launch` menolak melakukan penyuntikan saat SIP masih diaktifkan, sehingga langkah ini juga berfungsi sebagai konfirmasi bahwa langkah 2 telah diterapkan.

4. **Verifikasi bridge dari OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Entri iMessage seharusnya melaporkan `works`, dan `imsg status --json | jq '{rpc_methods, selectors}'` seharusnya menampilkan kapabilitas yang diekspos oleh build macOS Anda. Pembuatan jajak pendapat memerlukan `selectors.pollPayloadMessage`; pemberian suara memerlukan `selectors.pollVoteMessage` dan metode RPC `poll.vote`. Plugin OpenClaw hanya mengiklankan tindakan yang didukung oleh probe yang di-cache, sedangkan cache kosong tetap optimistis dan melakukan probe pada pengiriman pertama.

Jika `openclaw channels status --probe` melaporkan kanal sebagai `works`, tetapi tindakan tertentu memunculkan "iMessage `<action>` memerlukan bridge API privat imsg" saat pengiriman, jalankan kembali `imsg launch` — pembantu dapat terlepas (Messages.app dimulai ulang, pembaruan OS, dan sebagainya) dan status `available: true` yang di-cache akan terus mengiklankan tindakan hingga probe berikutnya menyegarkannya.

### Ketika SIP tetap diaktifkan

Jika menonaktifkan SIP tidak dapat diterima untuk model ancaman Anda:

- `imsg` kembali ke mode dasar — hanya teks + media + penerimaan.
- Plugin OpenClaw tetap mengiklankan pengiriman teks/media dan pemantauan pesan masuk; plugin menyembunyikan `react`, `edit`, `unsend`, `reply`, `sendWithEffect`, dan operasi grup dari permukaan tindakan (sesuai gate kapabilitas per metode).
- Anda dapat menjalankan Mac non-Apple-Silicon terpisah (atau Mac bot khusus) dengan SIP dinonaktifkan untuk beban kerja iMessage, sementara SIP tetap diaktifkan pada perangkat utama Anda. Lihat [Pengguna macOS bot khusus (identitas iMessage terpisah)](#deployment-patterns) di bawah.

## Kontrol akses dan perutean

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.imessage.dmPolicy` mengontrol pesan langsung:

    - `pairing` (bawaan)
    - `allowlist` (memerlukan setidaknya satu entri `allowFrom`)
    - `open` (mengharuskan `allowFrom` menyertakan `"*"`)
    - `disabled`

    Bidang daftar izin: `channels.imessage.allowFrom`.

    Entri daftar izin harus mengidentifikasi pengirim: handle atau grup akses pengirim statis (`accessGroup:<name>`). Gunakan `channels.imessage.groupAllowFrom` untuk target percakapan seperti `chat_id:*`, `chat_guid:*`, atau `chat_identifier:*`; gunakan `channels.imessage.groups` untuk kunci registri numerik `chat_id`.

  </Tab>

  <Tab title="Kebijakan grup + sebutan">
    `channels.imessage.groupPolicy` mengontrol penanganan grup:

    - `allowlist` (bawaan)
    - `open`
    - `disabled`

    Daftar izin pengirim grup: `channels.imessage.groupAllowFrom`.

    Entri `groupAllowFrom` juga dapat merujuk ke grup akses pengirim statis (`accessGroup:<name>`).

    Fallback runtime: jika `groupAllowFrom` tidak ditetapkan, pemeriksaan pengirim grup iMessage menggunakan `allowFrom`; tetapkan `groupAllowFrom` ketika penerimaan DM dan grup harus berbeda. `groupAllowFrom: []` yang secara eksplisit kosong tidak menggunakan fallback — nilai tersebut memblokir semua pengirim grup di bawah `allowlist`.
    Catatan runtime: jika `channels.imessage` sama sekali tidak ada, runtime menggunakan fallback ke `groupPolicy="allowlist"` dan mencatat peringatan (meskipun `channels.defaults.groupPolicy` ditetapkan).

    <Warning>
    Perutean grup di bawah `groupPolicy: "allowlist"` menjalankan **dua** gate secara berurutan:

    1. **Daftar izin pengirim** (`channels.imessage.groupAllowFrom`) — handle, `accessGroup:<name>`, `chat_guid`, `chat_identifier`, atau `chat_id`. Daftar efektif yang kosong (tidak ada `groupAllowFrom` dan tidak ada fallback `allowFrom`) memblokir setiap pengirim grup.
    2. **Registri grup** (`channels.imessage.groups`) — diberlakukan setelah peta memiliki entri: percakapan harus cocok dengan entri eksplisit per-`chat_id` atau wildcard `groups: { "*": { ... } }`. Ketika `groups` kosong atau tidak ada, daftar izin pengirim saja yang menentukan penerimaan.

    Jika tidak ada daftar izin pengirim grup efektif yang dikonfigurasi, setiap pesan grup dihapus sebelum gate registri. Setiap gate memiliki sinyal tingkat `warn` sendiri pada tingkat log bawaan, dan masing-masing menyebutkan perbaikan yang berbeda:

    - satu kali per akun saat startup, ketika daftar izin pengirim grup efektif kosong: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — perbaiki dengan menetapkan `channels.imessage.groupAllowFrom` (atau `allowFrom`); menambahkan entri `groups` saja membuat gate 1 tetap memblokir setiap pengirim.
    - satu kali per `chat_id` saat runtime, ketika pengirim melewati gate 1 tetapi percakapan tidak ada dalam registri `groups` yang terisi: `imessage: dropping group message from chat_id=<id> ...` — perbaiki dengan menambahkan `chat_id` tersebut (atau `"*"`) di bawah `channels.imessage.groups`.

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

    `groupAllowFrom` saja menerima pengirim tersebut dalam grup apa pun; tambahkan blok `groups` untuk membatasi percakapan yang diizinkan (dan menetapkan opsi per percakapan seperti `requireMention`).
    </Warning>

    Gate sebutan untuk grup:

    - iMessage tidak memiliki metadata sebutan bawaan
    - deteksi sebutan menggunakan pola regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - tanpa pola yang dikonfigurasi, gate sebutan tidak dapat diberlakukan
    - perintah kontrol dari pengirim yang diotorisasi melewati gate sebutan

    `systemPrompt` per grup:

    Setiap entri di bawah `channels.imessage.groups.*` menerima string `systemPrompt` opsional, yang disuntikkan ke prompt sistem agen pada setiap giliran yang menangani pesan dalam grup tersebut. Resolusinya mencerminkan `channels.whatsapp.groups`:

    1. **Prompt sistem khusus grup** (`groups["<chat_id>"].systemPrompt`): digunakan ketika entri grup tertentu ada dalam peta **dan** kunci `systemPrompt`-nya ditentukan. Jika `systemPrompt` adalah string kosong (`""`), wildcard ditekan dan tidak ada prompt sistem yang diterapkan pada grup tersebut.
    2. **Prompt sistem wildcard grup** (`groups["*"].systemPrompt`): digunakan ketika entri grup tertentu sama sekali tidak ada dalam peta, atau ketika entri tersebut ada tetapi tidak menentukan kunci `systemPrompt`.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Gunakan ejaan Inggris." },
            "8421": {
              requireMention: true,
              systemPrompt: "Ini adalah percakapan rotasi petugas siaga. Batasi balasan hingga kurang dari 3 kalimat.",
            },
            "9907": {
              // penekanan eksplisit: wildcard "Gunakan ejaan Inggris." tidak berlaku di sini
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
    - Dengan `session.dmScope=main` bawaan, DM iMessage digabungkan ke dalam sesi utama agen.
    - Sesi grup diisolasi (`agent:<agentId>:imessage:group:<chat_id>`).
    - Balasan dirutekan kembali ke iMessage menggunakan metadata kanal/target asal.

    Perilaku utas yang menyerupai grup:

    Beberapa utas iMessage dengan banyak peserta dapat tiba dengan `is_group=false`.
    Jika `chat_id` tersebut dikonfigurasi secara eksplisit di bawah `channels.imessage.groups`, OpenClaw memperlakukannya sebagai lalu lintas grup (gate grup + isolasi sesi grup).

  </Tab>
</Tabs>

## Pengikatan percakapan ACP

Percakapan iMessage dapat diikat ke sesi ACP.

Alur cepat operator:

- Jalankan `/acp spawn codex --bind here` di dalam DM atau percakapan grup yang diizinkan.
- Pesan berikutnya dalam percakapan iMessage yang sama dirutekan ke sesi ACP yang dibuat.
- `/new` dan `/reset` mengatur ulang sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus pengikatan.

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

## Pola deployment

<AccordionGroup>
  <Accordion title="Pengguna macOS bot khusus (identitas iMessage terpisah)">
    Gunakan Apple ID dan pengguna macOS khusus agar lalu lintas bot terisolasi dari profil Messages pribadi Anda.

    Alur umum:

    1. Buat/masuk ke pengguna macOS khusus.
    2. Masuk ke Messages dengan Apple ID bot pada pengguna tersebut.
    3. Instal `imsg` pada pengguna tersebut.
    4. Buat pembungkus SSH agar OpenClaw dapat menjalankan `imsg` dalam konteks pengguna tersebut.
    5. Arahkan `channels.imessage.accounts.<id>.cliPath` dan `.dbPath` ke profil pengguna tersebut.

    Pengoperasian pertama mungkin memerlukan persetujuan GUI (Automation + Full Disk Access) dalam sesi pengguna bot tersebut.

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

    Setiap akun dapat mengganti bidang seperti `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, pengaturan riwayat, dan daftar izin akar lampiran.

  </Accordion>

  <Accordion title="Riwayat pesan langsung">
    Atur `channels.imessage.dmHistoryLimit` untuk mengisi sesi pesan langsung baru dengan riwayat `imsg` terbaru yang telah didekode untuk percakapan tersebut. Gunakan `channels.imessage.dms["<sender>"].historyLimit` untuk penggantian per pengirim, termasuk `0` guna menonaktifkan riwayat bagi seorang pengirim.

    Riwayat DM iMessage diambil sesuai permintaan dari `imsg`. Membiarkan `dmHistoryLimit` tidak diatur akan menonaktifkan pengisian riwayat DM global, tetapi nilai positif `channels.imessage.dms["<sender>"].historyLimit` per pengirim tetap mengaktifkan pengisian bagi pengirim tersebut.

  </Accordion>
</AccordionGroup>

## Media, pemotongan, dan target pengiriman

<AccordionGroup>
  <Accordion title="Lampiran dan media">
    - penyerapan lampiran masuk **dinonaktifkan secara default** — atur `channels.imessage.includeAttachments: true` untuk meneruskan foto, memo suara, video, dan lampiran lainnya kepada agen. Saat dinonaktifkan, iMessage yang hanya berisi lampiran dibuang sebelum mencapai agen dan mungkin sama sekali tidak menghasilkan baris log `Inbound message`.
    - jalur lampiran jarak jauh dapat diambil melalui SCP saat `remoteHost` diatur
    - jalur lampiran harus cocok dengan akar yang diizinkan:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (mode SCP jarak jauh)
      - akar yang dikonfigurasi memperluas pola akar default `/Users/*/Library/Messages/Attachments` (digabungkan, bukan diganti)
    - SCP menggunakan pemeriksaan kunci host yang ketat (`StrictHostKeyChecking=yes`)
    - ukuran media keluar menggunakan `channels.imessage.mediaMaxMb` (default 16 MB)

  </Accordion>

  <Accordion title="Teks keluar dan pemotongan">
    - batas potongan teks: `channels.imessage.textChunkLimit` (default 4000)
    - mode pemotongan: `channels.imessage.streaming.chunkMode`
      - `length` (default)
      - `newline` (pemotongan yang mengutamakan paragraf)
    - tebal/miring/garis bawah/coret Markdown keluar dikonversi menjadi teks bergaya native (penerima macOS 15+ merender gaya tersebut; penerima versi lama melihat teks biasa tanpa penanda); tabel Markdown dikonversi sesuai mode tabel Markdown kanal
    - `channels.imessage.sendTransport` (`auto` default, `bridge`, `applescript`) memilih cara `imsg` melakukan pengiriman

  </Accordion>

  <Accordion title="Format pengalamatan">
    Target eksplisit yang disarankan:

    - `chat_id:123` (disarankan untuk perutean stabil)
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

Saat `imsg launch` berjalan dan `openclaw channels status --probe` melaporkan `privateApi.available: true`, alat pesan dapat menggunakan tindakan native iMessage selain pengiriman teks biasa.

Semua tindakan diaktifkan secara default; gunakan `channels.imessage.actions` untuk menonaktifkan tindakan individual:

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
    - **react**: Tambahkan/hapus tapback iMessage (`messageId`, `emoji`, `remove`). Tapback yang didukung dipetakan ke love, like, dislike, laugh, emphasize, dan question. Penghapusan tanpa emoji menghapus tapback apa pun yang telah ditetapkan.
    - **reply**: Kirim balasan berutas ke pesan yang ada (`messageId`, `text` atau `message`, ditambah `chatGuid`, `chatId`, `chatIdentifier`, atau `to`). Balasan dengan lampiran juga memerlukan build `imsg` yang `send-rich`-nya mendukung `--file`.
    - **sendWithEffect**: Kirim teks dengan efek iMessage (`text` atau `message`, `effect` atau `effectId`). Nama pendek: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight.
    - **edit**: Edit pesan terkirim pada versi macOS/API privat yang didukung (`messageId`, `text` atau `newText`). Hanya pesan yang dikirim oleh gateway itu sendiri yang dapat diedit.
    - **unsend**: Tarik kembali pesan terkirim pada versi macOS/API privat yang didukung (`messageId`). Hanya pesan yang dikirim oleh gateway itu sendiri yang dapat ditarik kembali.
    - **upload-file**: Kirim media/file (`buffer` sebagai base64 atau `media`/`path`/`filePath` yang telah dihidrasi, `filename`, `asVoice` opsional). Alias lama: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Kelola obrolan grup saat target saat ini merupakan percakapan grup. Tindakan ini mengubah identitas Messages milik host, sehingga memerlukan pengirim pemilik atau klien Gateway `operator.admin`.
    - **poll**: Buat jajak pendapat native Apple Messages (`pollQuestion`, `pollOption` yang diulang 2 hingga 12 kali, ditambah `chatGuid`, `chatId`, `chatIdentifier`, atau `to`). Penerima di iOS/iPadOS/macOS 26+ melihat dan memberikan suara secara native; versi OS lama menerima teks cadangan "Sent a poll". Memerlukan `selectors.pollPayloadMessage`.
    - **poll-vote**: Berikan suara pada jajak pendapat yang ada (`pollId` atau `messageId`, ditambah tepat satu dari `pollOptionIndex`, `pollOptionId`, atau `pollOptionText`). Memerlukan `selectors.pollVoteMessage` dan metode RPC `poll.vote`.

    Jajak pendapat masuk yang diterima dirender untuk agen dengan pertanyaan, label opsi bernomor, jumlah suara, dan ID pesan jajak pendapat yang diperlukan oleh `poll-vote`.

  </Accordion>

  <Accordion title="ID pesan">
    Konteks iMessage masuk menyertakan nilai pendek `MessageSid` dan GUID pesan lengkap (`MessageSidFull`) jika tersedia. ID pendek dibatasi pada cache balasan terbaru berbasis SQLite dan diperiksa terhadap obrolan saat ini sebelum digunakan. Jika ID pendek kedaluwarsa, coba lagi dengan `MessageSidFull` miliknya sambil menargetkan percakapan yang menyediakannya. ID lengkap tidak melewati pengikatan percakapan atau akun, jadi ganti ID dari obrolan lain dengan ID dari target saat ini. Panggilan terdelegasi jarak jauh dapat menolak ID lengkap yang kedaluwarsa saat bukti percakapan saat ini tidak tersedia.

  </Accordion>

  <Accordion title="Deteksi kapabilitas">
    OpenClaw menyembunyikan tindakan API privat hanya jika status pemeriksaan yang disimpan dalam cache menyatakan bahwa bridge tidak tersedia. Jika statusnya tidak diketahui, tindakan tetap terlihat dan pengiriman menjalankan pemeriksaan secara lazy sehingga tindakan pertama dapat berhasil setelah `imsg launch` tanpa penyegaran status manual terpisah.

  </Accordion>

  <Accordion title="Tanda dibaca dan pengetikan">
    Saat bridge API privat aktif, obrolan masuk yang diterima ditandai telah dibaca dan obrolan langsung menampilkan gelembung pengetikan segera setelah giliran diterima, sementara agen menyiapkan konteks dan menghasilkan respons. Nonaktifkan penandaan telah dibaca dengan:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Build `imsg` lama yang dibuat sebelum daftar kapabilitas per metode menonaktifkan pengetikan/tanda dibaca secara diam-diam; OpenClaw mencatat peringatan satu kali setiap kali dimulai ulang agar penyebab tidak adanya tanda dibaca dapat diketahui.

  </Accordion>

  <Accordion title="Tapback masuk">
    OpenClaw berlangganan tapback iMessage dan merutekan reaksi yang diterima sebagai peristiwa sistem, bukan teks pesan biasa, sehingga tapback pengguna tidak memicu perulangan balasan biasa.

    Mode notifikasi dikendalikan oleh `channels.imessage.reactionNotifications`:

    - `"own"` (default): beri tahu hanya saat pengguna bereaksi terhadap pesan yang ditulis bot.
    - `"all"`: beri tahu untuk semua tapback masuk dari pengirim yang diotorisasi.
    - `"off"`: abaikan tapback masuk.

    Penggantian per akun menggunakan `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Reaksi persetujuan (👍 / 👎)">
    Saat `approvals.exec.enabled` atau `approvals.plugin.enabled` bernilai true dan permintaan dirutekan ke iMessage, gateway mengirimkan perintah persetujuan secara native dan menerima tapback untuk menyelesaikannya:

    - `👍` (tapback Like) → `allow-once`
    - `👎` (tapback Dislike) → `deny`
    - `allow-always` tetap menjadi opsi cadangan manual: kirim `/approve <id> allow-always` sebagai balasan biasa.

    Penanganan reaksi mengharuskan handle pengguna yang bereaksi menjadi pemberi persetujuan eksplisit. Daftar pemberi persetujuan dibaca dari `channels.imessage.allowFrom` (atau `channels.imessage.accounts.<id>.allowFrom`); tambahkan nomor telepon pengguna dalam format E.164 atau email Apple ID mereka (target obrolan seperti `chat_id:*` bukan entri pemberi persetujuan yang valid). Entri wildcard `"*"` diterapkan tetapi mengizinkan pengirim mana pun memberikan persetujuan; daftar pemberi persetujuan yang kosong menonaktifkan pintasan reaksi sepenuhnya. Pintasan reaksi sengaja melewati `reactionNotifications`, `dmPolicy`, dan `groupAllowFrom` karena daftar izin pemberi persetujuan eksplisit adalah satu-satunya gerbang yang relevan untuk penyelesaian persetujuan.

    Otorisasi perintah teks `/approve` mengikuti daftar yang sama: saat `channels.imessage.allowFrom` tidak kosong, `/approve <id> <decision>` diotorisasi berdasarkan daftar pemberi persetujuan tersebut (bukan daftar izin DM yang lebih luas), dan pengirim yang diizinkan dalam daftar izin DM tetapi tidak tercantum dalam `allowFrom` menerima penolakan eksplisit. Saat `allowFrom` kosong, opsi cadangan dalam obrolan yang sama tetap berlaku dan `/approve` mengotorisasi siapa pun yang diizinkan oleh daftar izin DM. Tambahkan setiap operator yang harus dapat memberikan persetujuan — melalui `/approve` atau melalui reaksi — ke `allowFrom`.

    Catatan operator:
    - Pengikatan reaksi disimpan baik di memori maupun di penyimpanan berkunci persisten milik gateway (TTL disesuaikan dengan kedaluwarsa persetujuan), dan gateway juga melakukan polling terhadap permintaan yang tertunda untuk tapback, sehingga tapback yang masuk sesaat setelah gateway dimulai ulang tetap menyelesaikan persetujuan.
    - Tapback `is_from_me=true` milik operator sendiri (misalnya dari perangkat Apple yang dipasangkan) menyelesaikan persetujuan ketika handle tersebut merupakan pemberi persetujuan eksplisit.
    - Permintaan persetujuan dirutekan ke percakapan grup hanya ketika pemberi persetujuan eksplisit dikonfigurasi; jika tidak, anggota grup mana pun dapat menyetujui.
    - Tapback gaya teks lama (teks biasa `Liked "…"` dari klien Apple yang sangat lama) tidak dapat menyelesaikan persetujuan karena tidak membawa GUID pesan; penyelesaian reaksi memerlukan metadata tapback terstruktur yang dihasilkan oleh klien macOS / iOS saat ini.

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

## Menggabungkan DM kiriman terpisah (perintah + URL dalam satu komposisi)

Ketika pengguna mengetik perintah dan URL secara bersamaan — misalnya `Dump https://example.com/article` — aplikasi Messages milik Apple membagi pengiriman menjadi **dua baris `chat.db` terpisah**:

1. Pesan teks (`"Dump"`).
2. Balon pratinjau URL (`"https://..."`) dengan gambar pratinjau OG sebagai lampiran.

Kedua baris tiba di OpenClaw dengan selang ~0.8-2.0 dtk pada sebagian besar penyiapan. Tanpa penggabungan, agen menerima perintah saja pada giliran 1 (dan sering menjawab "kirimkan URL-nya") sebelum URL tiba pada giliran 2. Ini merupakan alur pengiriman Apple, bukan sesuatu yang diperkenalkan oleh OpenClaw atau `imsg`.

`channels.imessage.coalesceSameSenderDms` mengikutsertakan DM dalam penyanggaan baris berurutan dari pengirim yang sama. Ketika `imsg` mengekspos penanda struktural pratinjau URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` pada salah satu baris sumber, OpenClaw hanya menggabungkan kiriman terpisah yang sebenarnya tersebut dan mempertahankan baris lain yang disangga sebagai giliran terpisah. Pada build `imsg` lama yang sama sekali tidak menghasilkan metadata balon, OpenClaw tidak dapat membedakan kiriman terpisah dari pengiriman terpisah, sehingga beralih ke penggabungan bucket. Hal tersebut mempertahankan perilaku sebelum adanya metadata alih-alih meregresikan kiriman terpisah `Dump <url>` menjadi dua giliran. Obrolan grup tetap dikirimkan per pesan agar struktur giliran multipengguna dipertahankan.

<Tabs>
  <Tab title="Kapan perlu diaktifkan">
    Aktifkan ketika:

    - Anda menyediakan Skills yang mengharapkan `command + payload` dalam satu pesan (dump, tempel, simpan, antrekan, dan sebagainya).
    - Pengguna Anda menempelkan URL bersama perintah.
    - Anda dapat menerima latensi tambahan pada giliran DM (lihat di bawah).

    Biarkan nonaktif ketika:

    - Anda memerlukan latensi perintah minimum untuk pemicu DM satu kata.
    - Semua alur Anda berupa perintah sekali jalan tanpa tindak lanjut muatan.

  </Tab>
  <Tab title="Mengaktifkan">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // ikut serta (default: false)
        },
      },
    }
    ```

    Dengan flag aktif dan tanpa `messages.inbound.byChannel.imessage` eksplisit atau `messages.inbound.debounceMs` global, jendela debounce diperlebar menjadi **7000 ms** (default lama adalah 0 ms — tanpa debounce). Jendela yang lebih lebar diperlukan karena interval kiriman terpisah pratinjau URL Apple dapat memanjang hingga beberapa detik ketika Messages.app menghasilkan baris pratinjau.

    Untuk menyesuaikan sendiri jendelanya:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms mencakup penundaan pratinjau URL Messages.app yang diamati.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Kompromi">
    - **Penggabungan yang presisi memerlukan metadata muatan `imsg` terkini.** Dengan `balloon_bundle_id` tersedia, hanya kiriman terpisah yang sebenarnya yang digabungkan; penggabungan fallback tanpa metadata yang dijelaskan di atas merupakan kompatibilitas mundur sementara, yang akan dihapus setelah `imsg` menggabungkan kiriman terpisah di upstream.
    - **Latensi tambahan untuk pesan DM.** Dengan flag aktif, setiap DM (termasuk perintah kontrol mandiri dan tindak lanjut teks tunggal) menunggu hingga jendela debounce sebelum dikirimkan, untuk mengantisipasi datangnya baris pratinjau URL. Pesan obrolan grup tetap dikirimkan seketika.
    - **Keluaran gabungan dibatasi.** Teks gabungan dibatasi hingga 4000 karakter dengan penanda `…[truncated]` eksplisit; lampiran dibatasi hingga 20; entri sumber dibatasi hingga 10 (yang pertama beserta yang terbaru dipertahankan jika melampaui batas tersebut). Setiap GUID sumber dilacak dalam `coalescedMessageGuids` untuk telemetri downstream.
    - **Khusus DM.** Obrolan grup diteruskan ke pengiriman per pesan agar bot tetap responsif ketika beberapa orang sedang mengetik.
    - **Keikutsertaan, per saluran.** Saluran lain (Discord, Slack, Telegram, WhatsApp, …) tidak terpengaruh. Konfigurasi BlueBubbles lama yang menetapkan `channels.bluebubbles.coalesceSameSenderDms` harus memigrasikan nilai tersebut ke `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Skenario dan apa yang dilihat agen

Kolom "Flag aktif" menunjukkan perilaku pada build `imsg` yang menghasilkan `balloon_bundle_id`. Pada build `imsg` lama yang sama sekali tidak menghasilkan metadata balon, baris di bawah yang ditandai "Dua giliran" / "N giliran" beralih ke penggabungan lama (satu giliran): OpenClaw tidak dapat membedakan kiriman terpisah dari pengiriman terpisah secara struktural, sehingga mempertahankan penggabungan sebelum adanya metadata. Pemisahan presisi diaktifkan setelah build menghasilkan metadata balon.

| Komposisi pengguna                                                 | Yang dihasilkan `chat.db`       | Flag nonaktif (default)                       | Flag aktif + jendela (imsg menghasilkan metadata balon)                                                     |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (satu pengiriman)                               | 2 baris berselang ~1 dtk            | Dua giliran agen: "Dump" saja, kemudian URL   | Satu giliran: teks gabungan `Dump https://example.com`                                                              |
| `Save this 📎image.jpg caption` (lampiran + teks)                               | 2 baris tanpa metadata balon URL     | Dua giliran                                   | Dua giliran setelah metadata teramati; satu giliran gabungan pada sesi lama/sebelum latch tanpa metadata    |
| `/status` (perintah mandiri)                              | 1 baris                              | Pengiriman seketika                           | **Tunggu hingga jendela berakhir, lalu kirimkan**                                                           |
| URL ditempelkan sendiri                                            | 1 baris                              | Pengiriman seketika                           | Tunggu hingga jendela berakhir, lalu kirimkan                                                               |
| Teks + URL dikirim sebagai dua pesan terpisah yang disengaja, berselang beberapa menit | 2 baris di luar jendela | Dua giliran                                   | Dua giliran (jendela berakhir di antara keduanya)                                                           |
| Banjir cepat (>10 DM kecil dalam jendela)                           | N baris tanpa metadata balon URL     | N giliran                                     | N giliran setelah metadata teramati; satu giliran gabungan terbatas pada sesi lama/sebelum latch tanpa metadata |
| Dua orang mengetik dalam obrolan grup                              | N baris dari M pengirim              | M+ giliran (satu per bucket pengirim)          | M+ giliran — obrolan grup tidak digabungkan                                                                 |

## Pemulihan masuk setelah bridge atau gateway dimulai ulang

iMessage memulihkan pesan yang terlewat ketika gateway tidak aktif dan pada saat yang sama menekan "bom backlog" usang yang dapat digelontorkan Apple setelah pemulihan Push. Perilaku default selalu aktif dan dibangun di atas deduplikasi pesan masuk.

- **Deduplikasi pemutaran ulang.** Setiap pesan masuk yang dikirimkan dicatat berdasarkan GUID Apple-nya dalam status Plugin persisten (`imessage.inbound-dedupe`), diklaim saat penyerapan dan dikomit setelah penanganan (dilepaskan saat terjadi kegagalan sementara agar dapat dicoba lagi). Semua yang telah ditangani akan dibuang alih-alih dikirimkan dua kali. Hal ini memungkinkan pemulihan melakukan pemutaran ulang secara agresif tanpa pembukuan per pesan.
- **Pemulihan waktu henti.** Saat dimulai, monitor mengingat rowid baris `chat.db` terakhir yang dikirimkan (kursor per akun yang dipersistenkan) dan meneruskannya ke `imsg watch.subscribe` sebagai `since_rowid`, sehingga imsg memutar ulang baris yang masuk ketika gateway tidak aktif, lalu mengikuti data langsung. Pemutaran ulang dibatasi pada 500 baris terbaru dan pesan yang berusia hingga ~2 jam, sementara deduplikasi membuang semua yang sudah ditangani.
- **Batas usia backlog usang.** Baris di atas batas saat mulai benar-benar merupakan data langsung; baris yang tanggal pengirimannya lebih dari ~15 menit lebih lama daripada waktu kedatangannya merupakan backlog hasil penggelontoran Push dan akan ditekan. Baris yang diputar ulang (pada atau di bawah batas) menggunakan jendela pemulihan yang lebih lebar, sehingga pesan yang baru saja terlewat dikirimkan sementara riwayat lama tidak.

Pemulihan berfungsi pada penyiapan `cliPath` lokal maupun jarak jauh karena pemutaran ulang `since_rowid` berjalan melalui koneksi RPC `imsg` yang sama. Perbedaannya terletak pada jendela: ketika gateway dapat membaca `chat.db` (lokal), gateway menentukan batas rowid saat mulai, membatasi rentang pemutaran ulang, dan mengirimkan pesan yang terlewat hingga sekitar dua jam sebelumnya. Melalui `cliPath` SSH jarak jauh, gateway tidak dapat membaca basis data sehingga pemutaran ulang tidak dibatasi dan setiap baris menggunakan batas usia langsung — pesan yang baru saja terlewat tetap dipulihkan dan backlog lama tetap ditekan, hanya dengan jendela langsung yang lebih sempit. Jalankan gateway pada Mac Messages untuk mendapatkan jendela pemulihan yang lebih lebar.

### Sinyal yang terlihat oleh operator

Backlog yang ditekan dicatat pada level default dan tidak pernah dibuang secara diam-diam (flag `recovery` menunjukkan jendela yang diterapkan):

```text
imessage: backlog masuk usang ditekan account=<id> sent=<iso> recovery=<bool> (<N> ditekan sejak mulai)
```

### Migrasi

`channels.imessage.catchup.*` tidak digunakan lagi — pemulihan waktu henti berlangsung otomatis dan tidak memerlukan konfigurasi untuk penyiapan baru. Konfigurasi yang sudah ada dengan `catchup.enabled: true` tetap dihormati sebagai profil kompatibilitas untuk jendela pemutaran ulang pemulihan. Blok catchup yang dinonaktifkan (`enabled: false` atau tanpa `enabled: true`) telah dihentikan; `openclaw doctor --fix` menghapusnya.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="imsg tidak ditemukan atau RPC tidak didukung">
    Validasi dukungan biner dan RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Jika probe melaporkan bahwa RPC tidak didukung, perbarui `imsg`. Jika tindakan API privat tidak tersedia, jalankan `imsg launch` dalam sesi pengguna macOS yang sedang masuk dan lakukan probe lagi. Jika Gateway tidak berjalan di macOS, gunakan penyiapan Mac Jarak Jauh melalui SSH di atas alih-alih jalur `imsg` lokal default.

  </Accordion>

  <Accordion title="Messages mengirim, tetapi iMessage masuk tidak tiba">
    Pertama, buktikan apakah pesan mencapai Mac lokal. Jika `chat.db` tidak berubah, OpenClaw tidak dapat menerima pesan meskipun `imsg status --json` melaporkan bridge yang sehat.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Jika pesan yang dikirim dari ponsel tidak membuat baris baru, perbaiki lapisan Messages macOS dan Apple Push sebelum mengubah konfigurasi OpenClaw. Penyegaran layanan satu kali sering kali sudah cukup:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Kirim iMessage baru dari ponsel dan pastikan ada baris `chat.db` baru atau peristiwa `imsg watch` sebelum men-debug sesi OpenClaw. Jangan jalankan ini sebagai perulangan peluncuran ulang bridge secara berkala; `imsg launch` berulang yang disertai mulai ulang Gateway selama pekerjaan aktif dapat mengganggu pengiriman dan membuat proses channel yang sedang berjalan terhenti.

  </Accordion>

  <Accordion title="Gateway tidak berjalan di macOS">
    `cliPath: "imsg"` bawaan harus berjalan di Mac yang masuk ke Messages. Di Linux atau Windows, atur `channels.imessage.cliPath` ke skrip pembungkus yang terhubung melalui SSH ke Mac tersebut dan menjalankan `imsg "$@"`.

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
    - persetujuan pemasangan (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Pesan grup diabaikan">
    Periksa:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` perilaku daftar yang diizinkan
    - konfigurasi pola penyebutan (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Lampiran jarak jauh gagal">
    Periksa:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autentikasi kunci SSH/SCP dari host Gateway
    - kunci host tersedia di `~/.ssh/known_hosts` pada host Gateway
    - keterbacaan jalur jarak jauh pada Mac yang menjalankan Messages

  </Accordion>

  <Accordion title="Permintaan izin macOS terlewat">
    Jalankan kembali di terminal GUI interaktif dalam konteks pengguna/sesi yang sama dan setujui permintaan izin:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Pastikan Full Disk Access + Automation diberikan untuk konteks proses yang menjalankan OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Rujukan referensi konfigurasi

- [Referensi konfigurasi - iMessage](/id/gateway/config-channels#imessage)
- [Konfigurasi Gateway](/id/gateway/configuration)
- [Penyandingan](/id/channels/pairing)

## Terkait

- [Ikhtisar Saluran](/id/channels) — semua saluran yang didukung
- [Penghapusan BlueBubbles dan jalur iMessage imsg](/id/announcements/bluebubbles-imessage) — pengumuman dan ringkasan migrasi
- [Beralih dari BlueBubbles](/id/channels/imessage-from-bluebubbles) — tabel konversi konfigurasi dan peralihan langkah demi langkah
- [Penyandingan](/id/channels/pairing) — autentikasi pesan langsung dan alur penyandingan
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan berdasarkan penyebutan
- [Perutean Saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan keamanan
