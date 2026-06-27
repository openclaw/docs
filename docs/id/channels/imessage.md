---
read_when:
    - Menyiapkan dukungan iMessage
    - Pemecahan masalah pengiriman/penerimaan iMessage
summary: Dukungan iMessage native melalui imsg (JSON-RPC melalui stdio), dengan tindakan API pribadi untuk balasan, tapback, efek, lampiran, dan pengelolaan grup. Disarankan untuk penyiapan iMessage OpenClaw baru ketika persyaratan host sesuai.
title: iMessage
x-i18n:
    generated_at: "2026-06-27T17:10:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 065c0426af6230f9be2f0a12ecc4553724d8ce1a2b6b0dad640b5ae8a8a480f0
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Untuk deployment OpenClaw iMessage, gunakan `imsg` pada host Messages macOS yang sudah masuk. Jika Gateway Anda berjalan di Linux atau Windows, arahkan `channels.imessage.cliPath` ke wrapper SSH yang menjalankan `imsg` di Mac.

**Pemulihan inbound bersifat otomatis.** Setelah bridge atau gateway dimulai ulang, iMessage memutar ulang pesan yang terlewat saat tidak aktif dan menekan "backlog bomb" usang yang dapat digelontorkan Apple setelah pemulihan Push, dengan deduplikasi agar tidak ada yang dikirim dua kali. Tidak ada konfigurasi yang perlu diaktifkan — lihat [Pemulihan inbound setelah bridge atau gateway dimulai ulang](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Dukungan BlueBubbles telah dihapus. Migrasikan konfigurasi `channels.bluebubbles` ke `channels.imessage`; OpenClaw mendukung iMessage hanya melalui `imsg`. Mulai dari [Penghapusan BlueBubbles dan jalur imsg iMessage](/id/announcements/bluebubbles-imessage) untuk pengumuman singkat, atau [Beralih dari BlueBubbles](/id/channels/imessage-from-bluebubbles) untuk tabel migrasi lengkap.
</Warning>

Status: integrasi CLI eksternal native. Gateway menjalankan `imsg rpc` dan berkomunikasi melalui JSON-RPC di stdio (tanpa daemon/port terpisah). Tindakan lanjutan memerlukan `imsg launch` dan probe API privat yang berhasil.

<CardGroup cols={3}>
  <Card title="Tindakan API privat" icon="wand-sparkles" href="#private-api-actions">
    Balasan, tapback, efek, lampiran, dan manajemen grup.
  </Card>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    DM iMessage secara default menggunakan mode pairing.
  </Card>
  <Card title="Mac jarak jauh" icon="terminal" href="#remote-mac-over-ssh">
    Gunakan wrapper SSH saat Gateway tidak berjalan di Mac Messages.
  </Card>
  <Card title="Referensi konfigurasi" icon="settings" href="/id/gateway/config-channels#imessage">
    Referensi lengkap field iMessage.
  </Card>
</CardGroup>

## Penyiapan cepat

<Tabs>
  <Tab title="Mac lokal (jalur cepat)">
    <Steps>
      <Step title="Instal dan verifikasi imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

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

      <Step title="Setujui pairing DM pertama (dmPolicy default)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Permintaan pairing kedaluwarsa setelah 1 jam.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac jarak jauh melalui SSH">
    OpenClaw hanya memerlukan `cliPath` yang kompatibel dengan stdio, sehingga Anda dapat mengarahkan `cliPath` ke skrip wrapper yang melakukan SSH ke Mac jarak jauh dan menjalankan `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Konfigurasi yang direkomendasikan saat lampiran diaktifkan:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Jika `remoteHost` tidak disetel, OpenClaw mencoba mendeteksinya otomatis dengan mengurai skrip wrapper SSH.
    `remoteHost` harus berupa `host` atau `user@host` (tanpa spasi atau opsi SSH).
    OpenClaw menggunakan pemeriksaan host-key ketat untuk SCP, sehingga host key relay harus sudah ada di `~/.ssh/known_hosts`.
    Jalur lampiran divalidasi terhadap root yang diizinkan (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Wrapper `cliPath` atau proxy SSH apa pun yang Anda tempatkan di depan `imsg` HARUS berperilaku seperti pipe stdio transparan untuk JSON-RPC yang berjalan lama. OpenClaw menukar pesan JSON-RPC kecil yang dibingkai newline melalui stdin/stdout wrapper selama masa aktif channel:

- Teruskan setiap chunk/baris stdin **segera setelah byte tersedia** — jangan menunggu EOF.
- Teruskan setiap chunk/baris stdout segera ke arah sebaliknya.
- Pertahankan newline.
- Hindari pembacaan blocking berukuran tetap (`read(4096)`, `cat | buffer`, `read` shell default) yang dapat membuat frame kecil kekurangan aliran.
- Pisahkan stderr dari stream stdout JSON-RPC.

Wrapper yang menahan stdin hingga blok besar terisi akan menghasilkan gejala yang tampak seperti gangguan iMessage — `imsg rpc timeout (chats.list)` atau restart channel berulang — meskipun `imsg rpc` sendiri sehat. `ssh -T host imsg "$@"` (di atas) aman karena meneruskan argumen `cliPath` OpenClaw seperti `rpc` dan `--db`. Pipeline seperti `ssh host imsg | grep -v '^DEBUG'` TIDAK aman — alat yang memakai line-buffering tetap dapat menahan frame; gunakan `stdbuf -oL -eL` pada setiap tahap jika Anda harus memfilter.
</Warning>

  </Tab>
</Tabs>

## Persyaratan dan izin (macOS)

- Messages harus sudah masuk di Mac yang menjalankan `imsg`.
- Full Disk Access diperlukan untuk konteks proses yang menjalankan OpenClaw/`imsg` (akses DB Messages).
- Izin Automation diperlukan untuk mengirim pesan melalui Messages.app.
- Untuk tindakan lanjutan (reaksi / edit / batal kirim / balasan berutas / efek / operasi grup), System Integrity Protection harus dinonaktifkan — lihat [Mengaktifkan API privat imsg](#enabling-the-imsg-private-api) di bawah. Pengiriman/penerimaan teks dan media dasar berfungsi tanpa itu.

<Tip>
Izin diberikan per konteks proses. Jika gateway berjalan headless (LaunchAgent/SSH), jalankan perintah interaktif satu kali dalam konteks yang sama untuk memicu prompt:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="Pengiriman wrapper SSH gagal dengan AppleEvents -1743">
  Penyiapan SSH jarak jauh dapat membaca chat, lolos `channels status --probe`, dan memproses pesan inbound sementara pengiriman outbound tetap gagal dengan galat otorisasi AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Periksa database TCC pengguna Mac yang masuk atau System Settings > Privacy & Security > Automation. Jika entri Automation tercatat untuk `/usr/libexec/sshd-keygen-wrapper` alih-alih proses `imsg` atau shell lokal, macOS mungkin tidak menampilkan toggle Messages yang dapat digunakan untuk klien sisi server SSH tersebut:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

Dalam keadaan itu, mengulangi `tccutil reset AppleEvents` atau menjalankan ulang `imsg send` melalui wrapper SSH yang sama mungkin terus gagal karena konteks proses yang memerlukan Messages Automation adalah wrapper SSH, bukan aplikasi yang dapat diberi izin oleh UI.

Gunakan salah satu konteks proses `imsg` yang didukung sebagai gantinya:

- Jalankan Gateway, atau setidaknya bridge `imsg`, dalam sesi lokal pengguna Messages yang sedang masuk.
- Mulai Gateway dengan LaunchAgent untuk pengguna tersebut setelah memberikan Full Disk Access dan Automation dari sesi yang sama.
- Jika Anda mempertahankan topologi SSH dua pengguna, verifikasi bahwa `imsg send` outbound nyata berhasil melalui wrapper yang persis sama sebelum mengaktifkan channel. Jika Automation tidak dapat diberikan, konfigurasi ulang ke penyiapan `imsg` satu pengguna alih-alih mengandalkan wrapper SSH untuk pengiriman.

</Accordion>

## Mengaktifkan API privat imsg

`imsg` dikirimkan dalam dua mode operasional:

- **Mode dasar** (default, tidak perlu perubahan SIP): teks dan media outbound melalui `send`, watch/history inbound, daftar chat. Inilah yang Anda dapatkan langsung dari `brew install steipete/tap/imsg` baru ditambah izin macOS standar di atas.
- **Mode API privat**: `imsg` menyuntikkan helper dylib ke `Messages.app` untuk memanggil fungsi internal `IMCore`. Ini yang membuka `react`, `edit`, `unsend`, `reply` (berutas), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, ditambah indikator mengetik dan tanda terima baca.

Untuk mencapai permukaan tindakan lanjutan yang didokumentasikan halaman channel ini, Anda memerlukan mode API privat. README `imsg` eksplisit tentang persyaratan tersebut:

> Fitur lanjutan seperti `read`, `typing`, `launch`, pengiriman kaya berbasis bridge, mutasi pesan, dan manajemen chat bersifat opt-in. Fitur tersebut memerlukan SIP dinonaktifkan dan helper dylib disuntikkan ke `Messages.app`. `imsg launch` menolak menyuntikkan saat SIP aktif.

Teknik penyuntikan helper menggunakan dylib milik `imsg` sendiri untuk menjangkau API privat Messages. Tidak ada server pihak ketiga atau runtime BlueBubbles dalam jalur OpenClaw iMessage.

<Warning>
**Menonaktifkan SIP adalah tradeoff keamanan nyata.** SIP adalah salah satu perlindungan inti macOS terhadap menjalankan kode sistem yang dimodifikasi; mematikannya secara seluruh sistem membuka permukaan serangan tambahan dan efek samping. Khususnya, **menonaktifkan SIP pada Mac Apple Silicon juga menonaktifkan kemampuan untuk menginstal dan menjalankan aplikasi iOS di Mac Anda**.

Anggap ini sebagai pilihan operasional yang disengaja, bukan default. Jika model ancaman Anda tidak dapat menoleransi SIP dimatikan, iMessage bawaan terbatas pada mode dasar — hanya kirim/terima teks dan media, tanpa reaksi / edit / batal kirim / efek / operasi grup.
</Warning>

### Penyiapan

1. **Instal (atau tingkatkan) `imsg`** di Mac yang menjalankan Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Output `imsg status --json` melaporkan `bridge_version`, `rpc_methods`, dan `selectors` per metode sehingga Anda dapat melihat apa yang didukung build saat ini sebelum memulai.

2. **Nonaktifkan System Integrity Protection, dan (pada macOS modern) Library Validation.** Menyuntikkan helper dylib non-Apple ke `Messages.app` yang ditandatangani Apple memerlukan SIP mati **dan** library validation dilonggarkan. Langkah SIP mode Recovery bergantung pada versi macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** nonaktifkan Library Validation melalui Terminal, reboot ke Recovery Mode, jalankan `csrutil disable`, mulai ulang.
   - **macOS 11+ (Big Sur dan lebih baru), Intel:** Recovery Mode (atau Internet Recovery), `csrutil disable`, mulai ulang.
   - **macOS 11+, Apple Silicon:** urutan startup tombol daya untuk masuk Recovery; pada versi macOS terbaru tahan tombol **Left Shift** saat Anda mengeklik Continue, lalu `csrutil disable`. Penyiapan mesin virtual mengikuti alur terpisah, jadi ambil snapshot VM terlebih dahulu.

   **Pada macOS 11 dan lebih baru, `csrutil disable` saja biasanya tidak cukup.** Apple masih memberlakukan library validation terhadap `Messages.app` sebagai binary platform, sehingga helper yang ditandatangani adhoc ditolak (`Library Validation failed: ... platform binary, but mapped file is not`) bahkan dengan SIP mati. Setelah menonaktifkan SIP, nonaktifkan juga library validation dan reboot:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), diverifikasi pada 26.5.1:** SIP mati **ditambah** perintah `DisableLibraryValidation` di atas sudah cukup untuk menyuntikkan helper di seluruh 26.0 hingga 26.5.x. **Tidak diperlukan boot-args.** Plist adalah faktor penentu dan langkah yang paling sering terlewat saat injeksi gagal di Tahoe:
   - **Dengan plist:** `imsg launch` menyuntikkan dan `imsg status` melaporkan `advanced_features: true`.
   - **Tanpa plist (bahkan dengan SIP mati):** `imsg launch` gagal dengan `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI menolak helper adhoc saat dimuat, sehingga bridge tidak pernah siap dan launch berakhir timeout. Timeout itulah gejala yang paling sering dialami di Tahoe, dan perbaikannya adalah plist di atas, bukan tindakan yang lebih drastis.

   Ini dikonfirmasi dengan before/after terkontrol pada macOS 26.5.1 (Apple Silicon): dengan plist, dylib terpetakan ke `Messages.app` dan bridge berjalan; hapus plist dan reboot, lalu `imsg launch` menghasilkan kegagalan timeout di atas dengan dylib tidak terpetakan.

   Jika injeksi `imsg launch` atau `selectors` tertentu mulai mengembalikan false setelah peningkatan macOS, gate ini biasanya penyebabnya. Periksa status SIP dan validasi pustaka Anda sebelum menganggap langkah SIP itu sendiri gagal. Jika pengaturan tersebut sudah benar dan jembatan masih tidak dapat menyuntikkan, kumpulkan `imsg status --json` beserta output `imsg launch` dan laporkan ke proyek `imsg`, bukan melemahkan kontrol keamanan tambahan di seluruh sistem.

   Ikuti alur mode Recovery Apple untuk Mac Anda guna menonaktifkan SIP sebelum menjalankan `imsg launch`.

3. **Suntikkan helper.** Dengan SIP dinonaktifkan dan Messages.app sudah masuk:

   ```bash
   imsg launch
   ```

   `imsg launch` menolak menyuntikkan saat SIP masih aktif, jadi ini juga berfungsi sebagai konfirmasi bahwa langkah 2 berhasil diterapkan.

4. **Verifikasi jembatan dari OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Entri iMessage seharusnya melaporkan `works`, dan `imsg status --json | jq '.selectors'` seharusnya menampilkan `retractMessagePart: true` beserta selektor edit / mengetik / baca apa pun yang diekspos build macOS Anda. Gate per-metode Plugin OpenClaw di `actions.ts` hanya mengiklankan tindakan yang selektor dasarnya bernilai `true`, sehingga permukaan tindakan yang Anda lihat dalam daftar alat agen mencerminkan apa yang benar-benar dapat dilakukan jembatan pada host ini.

Jika `openclaw channels status --probe` melaporkan channel sebagai `works` tetapi tindakan tertentu melempar "iMessage `<action>` requires the imsg private API bridge" saat dispatch, jalankan `imsg launch` lagi — helper dapat terlepas (restart Messages.app, pembaruan OS, dll.) dan status `available: true` yang di-cache akan terus mengiklankan tindakan hingga probe berikutnya menyegarkan status.

### Saat Anda tidak dapat menonaktifkan SIP

Jika SIP yang dinonaktifkan tidak dapat diterima untuk model ancaman Anda:

- `imsg` kembali ke mode dasar — teks + media + menerima saja.
- Plugin OpenClaw masih mengiklankan pengiriman teks/media dan pemantauan masuk; hanya saja ia menyembunyikan `react`, `edit`, `unsend`, `reply`, `sendWithEffect`, dan operasi grup dari permukaan tindakan (sesuai gate kapabilitas per-metode).
- Anda dapat menjalankan Mac non-Apple-Silicon terpisah (atau Mac bot khusus) dengan SIP nonaktif untuk beban kerja iMessage, sambil tetap mengaktifkan SIP pada perangkat utama Anda. Lihat [Pengguna macOS bot khusus (identitas iMessage terpisah)](#deployment-patterns) di bawah.

## Kontrol akses dan perutean

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` mengontrol pesan langsung:

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `allowFrom` untuk menyertakan `"*"`)
    - `disabled`

    Kolom daftar izin: `channels.imessage.allowFrom`.

    Entri daftar izin harus mengidentifikasi pengirim: handle atau grup akses pengirim statis (`accessGroup:<name>`). Gunakan `channels.imessage.groupAllowFrom` untuk target chat seperti `chat_id:*`, `chat_guid:*`, atau `chat_identifier:*`; gunakan `channels.imessage.groups` untuk kunci registri `chat_id` numerik.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` mengontrol penanganan grup:

    - `allowlist` (default saat dikonfigurasi)
    - `open`
    - `disabled`

    Daftar izin pengirim grup: `channels.imessage.groupAllowFrom`.

    Entri `groupAllowFrom` juga dapat mereferensikan grup akses pengirim statis (`accessGroup:<name>`).

    Fallback runtime: jika `groupAllowFrom` belum diatur, pemeriksaan pengirim grup iMessage menggunakan `allowFrom`; atur `groupAllowFrom` saat penerimaan DM dan grup harus berbeda.
    Catatan runtime: jika `channels.imessage` sepenuhnya tidak ada, runtime kembali ke `groupPolicy="allowlist"` dan mencatat peringatan (bahkan jika `channels.defaults.groupPolicy` diatur).

    <Warning>
    Perutean grup memiliki **dua** gate daftar izin yang berjalan berurutan, dan keduanya harus lolos:

    1. **Daftar izin pengirim / target chat** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier`, atau `chat_id`.
    2. **Registri grup** (`channels.imessage.groups`) — dengan `groupPolicy: "allowlist"`, gate ini memerlukan entri wildcard `groups: { "*": { ... } }` (mengatur `allowAll = true`), atau entri eksplisit per-`chat_id` di bawah `groups`.

    Jika gate 2 tidak berisi apa pun, setiap pesan grup akan dijatuhkan. Plugin memancarkan dua sinyal level `warn` pada level log default:

    - satu kali per akun saat startup: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - satu kali per `chat_id` saat runtime: `imessage: dropping group message from chat_id=<id> ...`

    DM tetap berfungsi karena menggunakan jalur kode yang berbeda.

    Konfigurasi minimum agar grup tetap mengalir di bawah `groupPolicy: "allowlist"`:

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

    Jika baris `warn` tersebut muncul di log Gateway, gate 2 sedang menjatuhkan — tambahkan blok `groups`.
    </Warning>

    Gate penyebutan untuk grup:

    - iMessage tidak memiliki metadata penyebutan native
    - deteksi penyebutan menggunakan pola regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - tanpa pola yang dikonfigurasi, gate penyebutan tidak dapat ditegakkan

    Perintah kontrol dari pengirim resmi dapat melewati gate penyebutan dalam grup.

    `systemPrompt` per-grup:

    Setiap entri di bawah `channels.imessage.groups.*` menerima string `systemPrompt` opsional. Nilai tersebut disuntikkan ke prompt sistem agen pada setiap giliran yang menangani pesan dalam grup tersebut. Resolusi mencerminkan resolusi prompt per-grup yang digunakan oleh `channels.whatsapp.groups`:

    1. **Prompt sistem khusus grup** (`groups["<chat_id>"].systemPrompt`): digunakan saat entri grup tertentu ada dalam peta **dan** kunci `systemPrompt`-nya didefinisikan. Jika `systemPrompt` adalah string kosong (`""`) wildcard ditekan dan tidak ada prompt sistem yang diterapkan ke grup tersebut.
    2. **Prompt sistem wildcard grup** (`groups["*"].systemPrompt`): digunakan saat entri grup tertentu tidak ada sama sekali dari peta, atau saat entri itu ada tetapi tidak mendefinisikan kunci `systemPrompt`.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Prompt per-grup hanya berlaku untuk pesan grup — pesan langsung di channel ini tidak terpengaruh.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DM menggunakan perutean langsung; grup menggunakan perutean grup.
    - Dengan default `session.dmScope=main`, DM iMessage digabungkan ke sesi utama agen.
    - Sesi grup diisolasi (`agent:<agentId>:imessage:group:<chat_id>`).
    - Balasan dirutekan kembali ke iMessage menggunakan metadata channel/target asal.

    Perilaku thread mirip grup:

    Beberapa thread iMessage multi-peserta dapat tiba dengan `is_group=false`.
    Jika `chat_id` tersebut dikonfigurasi secara eksplisit di bawah `channels.imessage.groups`, OpenClaw memperlakukannya sebagai traffic grup (gate grup + isolasi sesi grup).

  </Tab>
</Tabs>

## Binding percakapan ACP

Chat iMessage lama juga dapat diikat ke sesi ACP.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM atau chat grup yang diizinkan.
- Pesan berikutnya dalam percakapan iMessage yang sama dirutekan ke sesi ACP yang dibuat.
- `/new` dan `/reset` mengatur ulang sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus binding.

Binding persisten yang dikonfigurasi didukung melalui entri `bindings[]` tingkat atas dengan `type: "acp"` dan `match.channel: "imessage"`.

`match.peer.id` dapat menggunakan:

- handle DM ternormalisasi seperti `+15555550123` atau `user@example.com`
- `chat_id:<id>` (disarankan untuk binding grup yang stabil)
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

Lihat [Agen ACP](/id/tools/acp-agents) untuk perilaku binding ACP bersama.

## Pola deployment

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Gunakan Apple ID khusus dan pengguna macOS khusus agar traffic bot terisolasi dari profil Messages pribadi Anda.

    Alur umum:

    1. Buat/masuk sebagai pengguna macOS khusus.
    2. Masuk ke Messages dengan Apple ID bot pada pengguna tersebut.
    3. Instal `imsg` pada pengguna tersebut.
    4. Buat wrapper SSH agar OpenClaw dapat menjalankan `imsg` dalam konteks pengguna tersebut.
    5. Arahkan `channels.imessage.accounts.<id>.cliPath` dan `.dbPath` ke profil pengguna tersebut.

    Eksekusi pertama mungkin memerlukan persetujuan GUI (Automation + Full Disk Access) dalam sesi pengguna bot tersebut.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Topologi umum:

    - Gateway berjalan di Linux/VM
    - iMessage + `imsg` berjalan di Mac dalam tailnet Anda
    - wrapper `cliPath` menggunakan SSH untuk menjalankan `imsg`
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

    Gunakan kunci SSH agar SSH dan SCP sama-sama non-interaktif.
    Pastikan kunci host dipercaya terlebih dahulu (misalnya `ssh bot@mac-mini.tailnet-1234.ts.net`) agar `known_hosts` terisi.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage mendukung konfigurasi per-akun di bawah `channels.imessage.accounts`.

    Setiap akun dapat menimpa kolom seperti `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, pengaturan riwayat, dan daftar izin root lampiran.

  </Accordion>

  <Accordion title="Direct-message history">
    Atur `channels.imessage.dmHistoryLimit` untuk mengisi sesi pesan langsung baru dengan riwayat `imsg` terbaru yang didekodekan untuk percakapan tersebut. Gunakan `channels.imessage.dms["<sender>"].historyLimit` untuk override per-pengirim, termasuk `0` untuk menonaktifkan riwayat bagi seorang pengirim.

    Riwayat DM iMessage diambil sesuai kebutuhan dari `imsg`. Membiarkan `dmHistoryLimit` tidak diatur akan menonaktifkan pengisian riwayat DM global, tetapi `channels.imessage.dms["<sender>"].historyLimit` per-pengirim yang positif tetap mengaktifkan pengisian untuk pengirim tersebut.

  </Accordion>
</AccordionGroup>

## Media, pemotongan, dan target pengiriman

<AccordionGroup>
  <Accordion title="Lampiran dan media">
    - penyerapan lampiran masuk **nonaktif secara default** — atur `channels.imessage.includeAttachments: true` untuk meneruskan foto, memo suara, video, dan lampiran lain ke agen. Jika dinonaktifkan, iMessage yang hanya berisi lampiran dibuang sebelum mencapai agen dan mungkin sama sekali tidak menghasilkan baris log `Inbound message`.
    - jalur lampiran jarak jauh dapat diambil melalui SCP saat `remoteHost` diatur
    - jalur lampiran harus cocok dengan root yang diizinkan:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (mode SCP jarak jauh)
      - pola root default: `/Users/*/Library/Messages/Attachments`
    - SCP menggunakan pemeriksaan host-key yang ketat (`StrictHostKeyChecking=yes`)
    - ukuran media keluar menggunakan `channels.imessage.mediaMaxMb` (default 16 MB)

  </Accordion>

  <Accordion title="Pemecahan keluar">
    - batas potongan teks: `channels.imessage.textChunkLimit` (default 4000)
    - mode potongan: `channels.imessage.chunkMode`
      - `length` (default)
      - `newline` (pemecahan dengan paragraf terlebih dahulu)

  </Accordion>

  <Accordion title="Format pengalamatan">
    Target eksplisit yang disarankan:

    - `chat_id:123` (direkomendasikan untuk perutean stabil)
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

Saat `imsg launch` berjalan dan `openclaw channels status --probe` melaporkan `privateApi.available: true`, alat pesan dapat menggunakan tindakan bawaan iMessage selain pengiriman teks normal.

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
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Tindakan yang tersedia">
    - **react**: Tambah/hapus tapback iMessage (`messageId`, `emoji`, `remove`). Tapback yang didukung dipetakan ke love, like, dislike, laugh, emphasize, dan question.
    - **reply**: Kirim balasan berutas ke pesan yang sudah ada (`messageId`, `text` atau `message`, ditambah `chatGuid`, `chatId`, `chatIdentifier`, atau `to`).
    - **sendWithEffect**: Kirim teks dengan efek iMessage (`text` atau `message`, `effect` atau `effectId`).
    - **edit**: Edit pesan terkirim pada versi macOS/API privat yang didukung (`messageId`, `text` atau `newText`).
    - **unsend**: Tarik kembali pesan terkirim pada versi macOS/API privat yang didukung (`messageId`).
    - **upload-file**: Kirim media/file (`buffer` sebagai base64 atau `media`/`path`/`filePath` yang sudah dihidrasi, `filename`, opsional `asVoice`). Alias lama: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Kelola obrolan grup saat target saat ini adalah percakapan grup.

  </Accordion>

  <Accordion title="ID pesan">
    Konteks iMessage masuk menyertakan nilai `MessageSid` pendek dan GUID pesan lengkap jika tersedia. ID pendek dibatasi pada cache balasan terbaru berbasis SQLite dan diperiksa terhadap obrolan saat ini sebelum digunakan. Jika ID pendek telah kedaluwarsa atau milik obrolan lain, coba lagi dengan `MessageSidFull` lengkap.

  </Accordion>

  <Accordion title="Deteksi kapabilitas">
    OpenClaw menyembunyikan tindakan API privat hanya saat status probe yang di-cache menyatakan bridge tidak tersedia. Jika status tidak diketahui, tindakan tetap terlihat dan dispatch melakukan probe secara malas sehingga tindakan pertama dapat berhasil setelah `imsg launch` tanpa refresh status manual terpisah.

  </Accordion>

  <Accordion title="Tanda dibaca dan mengetik">
    Saat bridge API privat aktif, obrolan masuk yang diterima ditandai sudah dibaca dan obrolan langsung menampilkan gelembung mengetik segera setelah giliran diterima, sementara agen menyiapkan konteks dan membuat respons. Nonaktifkan penandaan dibaca dengan:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Build `imsg` lama yang mendahului daftar kapabilitas per metode akan mematikan pengetikan/pembacaan secara diam-diam; OpenClaw mencatat peringatan satu kali per restart agar tanda terima yang hilang dapat ditelusuri.

  </Accordion>

  <Accordion title="Tapback masuk">
    OpenClaw berlangganan tapback iMessage dan merutekan reaksi yang diterima sebagai peristiwa sistem alih-alih teks pesan normal, sehingga tapback pengguna tidak memicu loop balasan biasa.

    Mode notifikasi dikendalikan oleh `channels.imessage.reactionNotifications`:

    - `"own"` (default): beri tahu hanya saat pengguna bereaksi terhadap pesan yang ditulis bot.
    - `"all"`: beri tahu untuk semua tapback masuk dari pengirim resmi.
    - `"off"`: abaikan tapback masuk.

    Override per akun menggunakan `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Reaksi persetujuan (👍 / 👎)">
    Saat `approvals.exec.enabled` atau `approvals.plugin.enabled` bernilai true dan permintaan dirutekan ke iMessage, Gateway mengirim prompt persetujuan secara native dan menerima tapback untuk menyelesaikannya:

    - `👍` (tapback Like) → `allow-once`
    - `👎` (tapback Dislike) → `deny`
    - `allow-always` tetap menjadi fallback manual: kirim `/approve <id> allow-always` sebagai balasan biasa.

    Penanganan reaksi mengharuskan handle pengguna yang bereaksi menjadi pemberi persetujuan eksplisit. Daftar pemberi persetujuan dibaca dari `channels.imessage.allowFrom` (atau `channels.imessage.accounts.<id>.allowFrom`); tambahkan nomor telepon pengguna dalam bentuk E.164 atau email Apple ID mereka. Entri wildcard `"*"` dihormati tetapi memungkinkan pengirim mana pun untuk menyetujui. Pintasan reaksi sengaja melewati `reactionNotifications`, `dmPolicy`, dan `groupAllowFrom` karena allowlist pemberi persetujuan eksplisit adalah satu-satunya gate yang penting untuk penyelesaian persetujuan.

    **Perubahan perilaku pada rilis ini:** Saat `channels.imessage.allowFrom` tidak kosong, perintah teks `/approve <id> <decision>` kini diotorisasi terhadap daftar pemberi persetujuan tersebut (bukan allowlist DM yang lebih luas). Pengirim yang diizinkan pada allowlist DM tetapi tidak ada di `allowFrom` akan menerima penolakan eksplisit. Tambahkan setiap operator yang seharusnya dapat menyetujui melalui `/approve` (dan melalui reaksi) ke `allowFrom` untuk mempertahankan perilaku sebelumnya. Saat `allowFrom` kosong, "fallback obrolan yang sama" lama tetap berlaku dan `/approve` terus mengotorisasi siapa pun yang diizinkan allowlist DM.

    Catatan operator:
    - Binding reaksi disimpan baik di memori (dengan TTL yang dicocokkan dengan kedaluwarsa persetujuan) maupun di penyimpanan keyed persisten Gateway, sehingga tapback yang mendarat tidak lama setelah restart Gateway tetap menyelesaikan persetujuan.
    - Tapback lintas perangkat `is_from_me=true` (reaksi operator sendiri di perangkat Apple yang dipasangkan) sengaja diabaikan sehingga bot tidak dapat menyetujui dirinya sendiri.
    - Tapback gaya teks lama (`Liked "…"` teks biasa dari klien Apple yang sangat lama) tidak dapat menyelesaikan persetujuan karena tidak membawa GUID pesan; penyelesaian reaksi memerlukan metadata tapback terstruktur yang dipancarkan klien macOS / iOS saat ini.

  </Accordion>
</AccordionGroup>

## Penulisan konfigurasi

iMessage mengizinkan penulisan konfigurasi yang dimulai channel secara default (untuk `/config set|unset` saat `commands.config: true`).

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

## Menggabungkan DM split-send (perintah + URL dalam satu komposisi)

Saat pengguna mengetik perintah dan URL bersama-sama — misalnya `Dump https://example.com/article` — aplikasi Messages Apple memecah pengiriman menjadi **dua baris `chat.db` terpisah**:

1. Pesan teks (`"Dump"`).
2. Balon pratinjau URL (`"https://..."`) dengan gambar pratinjau OG sebagai lampiran.

Kedua baris tiba di OpenClaw dengan selisih ~0.8-2.0 dtk pada sebagian besar setup. Tanpa penggabungan, agen menerima perintah saja pada giliran 1, membalas (sering kali "kirimkan URL-nya"), dan baru melihat URL pada giliran 2 — saat konteks perintah sudah hilang. Ini adalah pipeline pengiriman Apple, bukan sesuatu yang diperkenalkan OpenClaw atau `imsg`.

`channels.imessage.coalesceSameSenderDms` mengikutsertakan DM ke buffering baris berturut-turut dari pengirim yang sama. Saat `imsg` mengekspos penanda pratinjau URL struktural `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` pada salah satu baris sumber, OpenClaw hanya menggabungkan split-send nyata itu dan mempertahankan baris buffered lainnya sebagai giliran terpisah. Pada build `imsg` lama yang tidak memancarkan metadata balon sama sekali, OpenClaw tidak dapat membedakan split-send dari pengiriman terpisah, sehingga fallback ke penggabungan bucket. Itu mempertahankan perilaku pra-metadata alih-alih meregresikan split-send `Dump <url>` menjadi dua giliran. Obrolan grup tetap melakukan dispatch per pesan sehingga struktur giliran multi-pengguna dipertahankan.

<Tabs>
  <Tab title="Kapan mengaktifkan">
    Aktifkan saat:

    - Anda mengirim Skills yang mengharapkan `command + payload` dalam satu pesan (dump, paste, save, queue, dll.).
    - Pengguna Anda menempelkan URL bersama perintah.
    - Anda dapat menerima latensi giliran DM tambahan (lihat di bawah).

    Biarkan nonaktif saat:

    - Anda membutuhkan latensi perintah minimum untuk pemicu DM satu kata.
    - Semua alur Anda adalah perintah sekali jalan tanpa tindak lanjut payload.

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

    Dengan flag aktif dan tanpa `messages.inbound.byChannel.imessage` eksplisit atau `messages.inbound.debounceMs` global, jendela debounce melebar menjadi **7000 md** (default lama adalah 0 md — tanpa debouncing). Jendela yang lebih lebar diperlukan karena irama split-send pratinjau URL Apple dapat memanjang hingga beberapa detik sementara Messages.app memancarkan baris pratinjau.

    Untuk menyesuaikan jendelanya sendiri:

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
  <Tab title="Trade-off">
    - **Penggabungan presisi membutuhkan metadata payload `imsg` saat ini.** Saat baris URL menyertakan `balloon_bundle_id`, hanya split-send nyata itu yang digabungkan dan baris buffered lainnya tetap terpisah. Pada build `imsg` lama yang tidak mengekspos metadata balon, OpenClaw fallback ke penggabungan bucket buffered sehingga split-send `Dump <url>` tidak diregresikan menjadi dua giliran (back-compat sementara, dihapus setelah `imsg` menggabungkan split-send di upstream).
    - **Latensi tambahan untuk pesan DM.** Dengan flag aktif, setiap DM (termasuk perintah kontrol mandiri dan tindak lanjut satu teks) menunggu hingga jendela debounce sebelum dispatch, untuk berjaga-jaga jika baris pratinjau URL sedang datang. Pesan obrolan grup tetap dispatch instan.
    - **Output gabungan dibatasi.** Teks gabungan dibatasi 4000 karakter dengan penanda `…[truncated]` eksplisit; lampiran dibatasi 20; entri sumber dibatasi 10 (pertama-plus-terbaru dipertahankan di luar itu). Setiap GUID sumber dilacak di `coalescedMessageGuids` untuk telemetri hilir.
    - **Hanya DM.** Obrolan grup diteruskan ke dispatch per pesan sehingga bot tetap responsif saat beberapa orang mengetik.
    - **Opt-in, per channel.** Channel lain (Telegram, WhatsApp, Slack, …) tidak terpengaruh. Konfigurasi BlueBubbles lama yang mengatur `channels.bluebubbles.coalesceSameSenderDms` sebaiknya memigrasikan nilai itu ke `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Skenario dan apa yang dilihat agen

Kolom "Flag aktif" menunjukkan perilaku pada build `imsg` yang memancarkan `balloon_bundle_id`. Pada build `imsg` lama yang sama sekali tidak memancarkan metadata balon, baris di bawah yang ditandai "Dua giliran" / "N giliran" akan kembali ke penggabungan lama (satu giliran): OpenClaw tidak dapat membedakan secara struktural antara pengiriman terpisah dari pengiriman yang memang terpisah, sehingga mempertahankan penggabungan pra-metadata. Pemisahan presisi aktif setelah build memancarkan metadata balon.

| Pengguna menulis                                                   | `chat.db` menghasilkan             | Flag nonaktif (default)                 | Flag aktif + jendela (imsg memancarkan metadata balon)                                             |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (satu kiriman)                          | 2 baris berjarak ~1 dtk             | Dua giliran agen: "Dump" saja, lalu URL | Satu giliran: teks digabung `Dump https://example.com`                                             |
| `Save this 📎image.jpg caption` (lampiran + teks)                  | 2 baris tanpa metadata balon URL    | Dua giliran                             | Dua giliran setelah metadata diamati; satu giliran tergabung pada sesi lama/pra-latch tanpa metadata |
| `/status` (perintah mandiri)                                       | 1 baris                             | Pengiriman instan                       | **Tunggu hingga jendela, lalu kirim**                                                              |
| URL ditempel sendiri                                               | 1 baris                             | Pengiriman instan                       | Tunggu hingga jendela, lalu kirim                                                                  |
| Teks + URL dikirim sebagai dua pesan terpisah yang disengaja, terpaut menit | 2 baris di luar jendela             | Dua giliran                             | Dua giliran (jendela kedaluwarsa di antaranya)                                                     |
| Banjir cepat (>10 DM kecil di dalam jendela)                       | N baris tanpa metadata balon URL    | N giliran                               | N giliran setelah metadata diamati; satu giliran tergabung terbatas pada sesi lama/pra-latch tanpa metadata |
| Dua orang mengetik di obrolan grup                                 | N baris dari M pengirim             | M+ giliran (satu per bucket pengirim)   | M+ giliran — obrolan grup tidak digabungkan                                                        |

## Pemulihan masuk setelah jembatan atau Gateway dimulai ulang

iMessage memulihkan pesan yang terlewat saat Gateway mati, dan pada saat yang sama menekan "bom backlog" usang yang dapat digelontorkan Apple setelah pemulihan Push. Perilaku default selalu aktif, dibangun di atas dedupe masuk.

- **Dedupe pemutaran ulang.** Setiap pesan masuk yang dikirim dicatat berdasarkan Apple GUID-nya dalam status Plugin persisten (`imessage.inbound-dedupe`), diklaim saat ingest, dan di-commit setelah penanganan (dilepas pada kegagalan sementara agar dapat dicoba ulang). Apa pun yang sudah ditangani akan dibuang alih-alih dikirim dua kali. Inilah yang memungkinkan pemulihan memutar ulang secara agresif tanpa pembukuan per pesan.
- **Pemulihan downtime.** Saat startup, monitor mengingat `chat.db` rowid terakhir yang dikirim (kursor per akun yang dipersistenkan) dan meneruskannya ke `imsg watch.subscribe` sebagai `since_rowid`, sehingga imsg memutar ulang baris yang masuk saat Gateway mati, lalu mengikuti yang live. Pemutaran ulang dibatasi pada baris terbaru dan pesan yang berumur hingga ~2 jam, dan dedupe membuang apa pun yang sudah ditangani.
- **Pagar usia backlog usang.** Baris di atas batas startup benar-benar live; baris yang tanggal kirimnya lebih dari ~15 menit lebih tua daripada kedatangannya adalah backlog flush Push dan ditekan. Baris yang diputar ulang (pada atau di bawah batas) menggunakan jendela pemulihan yang lebih lebar, sehingga pesan yang baru saja terlewat dikirim sementara riwayat lama tidak.

Pemulihan bekerja pada penyiapan `cliPath` lokal maupun jarak jauh, karena pemutaran ulang `since_rowid` berjalan melalui koneksi RPC `imsg` yang sama. Perbedaannya adalah jendelanya: saat Gateway dapat membaca `chat.db` (lokal), ia menambatkan batas rowid startup, membatasi rentang pemutaran ulang, dan mengirim pesan yang terlewat hingga beberapa jam. Melalui `cliPath` SSH jarak jauh, ia tidak dapat membaca database, sehingga pemutaran ulang tidak dibatasi dan setiap baris menggunakan pagar usia live — ia tetap memulihkan pesan yang baru saja terlewat dan tetap menekan backlog lama, hanya dengan jendela live yang lebih sempit. Jalankan Gateway di Mac Messages untuk jendela pemulihan yang lebih lebar.

### Sinyal yang terlihat operator

Backlog yang ditekan dicatat pada level default, tidak pernah dibuang diam-diam (flag `recovery` menunjukkan jendela mana yang diterapkan):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Migrasi

`channels.imessage.catchup.*` tidak digunakan lagi — pemulihan downtime kini otomatis dan tidak memerlukan konfigurasi untuk penyiapan baru. Konfigurasi yang sudah ada dengan `catchup.enabled: true` tetap dihormati sebagai profil kompatibilitas untuk jendela pemutaran ulang pemulihan. Blok catchup yang dinonaktifkan (`enabled: false` atau tanpa `enabled: true`) dipensiunkan; `openclaw doctor --fix` menghapusnya.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    Validasi dukungan biner dan RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Jika probe melaporkan RPC tidak didukung, perbarui `imsg`. Jika tindakan API privat tidak tersedia, jalankan `imsg launch` dalam sesi pengguna macOS yang sudah masuk dan lakukan probe lagi. Jika Gateway tidak berjalan di macOS, gunakan penyiapan Mac Jarak Jauh melalui SSH di atas alih-alih jalur `imsg` lokal default.

  </Accordion>

  <Accordion title="Messages send but inbound iMessages do not arrive">
    Pertama buktikan apakah pesan mencapai Mac lokal. Jika `chat.db` tidak berubah, OpenClaw tidak dapat menerima pesan meskipun `imsg status --json` melaporkan jembatan yang sehat.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Jika pesan yang dikirim dari ponsel tidak membuat baris baru, perbaiki lapisan macOS Messages dan Apple Push sebelum mengubah konfigurasi OpenClaw. Refresh layanan sekali jalan sering kali cukup:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Kirim iMessage baru dari ponsel dan konfirmasi baris `chat.db` baru atau peristiwa `imsg watch` sebelum men-debug sesi OpenClaw. Jangan jalankan ini sebagai loop peluncuran ulang jembatan berkala; `imsg launch` berulang ditambah restart Gateway selama pekerjaan aktif dapat mengganggu pengiriman dan membuat run channel yang sedang berjalan terhenti.

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    `cliPath: "imsg"` default harus berjalan di Mac yang masuk ke Messages. Di Linux atau Windows, setel `channels.imessage.cliPath` ke skrip wrapper yang melakukan SSH ke Mac tersebut dan menjalankan `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Lalu jalankan:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DMs are ignored">
    Periksa:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - persetujuan pairing (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Group messages are ignored">
    Periksa:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - perilaku allowlist `channels.imessage.groups`
    - konfigurasi pola mention (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    Periksa:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autentikasi kunci SSH/SCP dari host Gateway
    - kunci host ada di `~/.ssh/known_hosts` pada host Gateway
    - keterbacaan jalur jarak jauh pada Mac yang menjalankan Messages

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    Jalankan ulang di terminal GUI interaktif dalam konteks pengguna/sesi yang sama dan setujui prompt:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Konfirmasi Full Disk Access + Automation diberikan untuk konteks proses yang menjalankan OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Penunjuk referensi konfigurasi

- [Referensi konfigurasi - iMessage](/id/gateway/config-channels#imessage)
- [Konfigurasi Gateway](/id/gateway/configuration)
- [Pairing](/id/channels/pairing)

## Terkait

- [Ikhtisar Channel](/id/channels) — semua channel yang didukung
- [Penghapusan BlueBubbles dan jalur iMessage imsg](/id/announcements/bluebubbles-imessage) — ringkasan pengumuman dan migrasi
- [Beralih dari BlueBubbles](/id/channels/imessage-from-bluebubbles) — tabel terjemahan konfigurasi dan cutover langkah demi langkah
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku obrolan grup dan gating mention
- [Routing Channel](/id/channels/channel-routing) — routing sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
