---
read_when:
    - Menyiapkan dukungan iMessage
    - Men-debug pengiriman/penerimaan iMessage
summary: Dukungan iMessage native melalui imsg (JSON-RPC melalui stdio), dengan tindakan API privat untuk balasan, tapback, efek, polling, lampiran, dan manajemen grup. Lebih disarankan untuk penyiapan iMessage OpenClaw baru ketika persyaratan host sesuai.
title: iMessage
x-i18n:
    generated_at: "2026-07-01T13:21:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0fbddd770d05762c64b81e9c6443ac8fd487ba15a34ed70b068a69776d355b81
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Untuk deployment iMessage OpenClaw, gunakan `imsg` pada host Messages macOS yang sudah masuk. Jika Gateway Anda berjalan di Linux atau Windows, arahkan `channels.imessage.cliPath` ke wrapper SSH yang menjalankan `imsg` di Mac.

**Pemulihan masuk otomatis.** Setelah bridge atau gateway dimulai ulang, iMessage memutar ulang pesan yang terlewat saat tidak aktif dan menekan "backlog bomb" usang yang dapat dikosongkan Apple setelah pemulihan Push, melakukan deduplikasi agar tidak ada yang dikirim dua kali. Tidak ada konfigurasi yang perlu diaktifkan — lihat [Pemulihan masuk setelah bridge atau gateway dimulai ulang](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Dukungan BlueBubbles telah dihapus. Migrasikan konfigurasi `channels.bluebubbles` ke `channels.imessage`; OpenClaw mendukung iMessage hanya melalui `imsg`. Mulai dari [Penghapusan BlueBubbles dan jalur iMessage imsg](/id/announcements/bluebubbles-imessage) untuk pengumuman singkat, atau [Beralih dari BlueBubbles](/id/channels/imessage-from-bluebubbles) untuk tabel migrasi lengkap.
</Warning>

Status: integrasi CLI eksternal native. Gateway menjalankan `imsg rpc` dan berkomunikasi melalui JSON-RPC di stdio (tanpa daemon/port terpisah). Tindakan lanjutan memerlukan `imsg launch` dan probe private API yang berhasil.

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    Balasan, tapback, efek, polling, lampiran, dan manajemen grup.
  </Card>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    DM iMessage secara default menggunakan mode pairing.
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    Gunakan wrapper SSH saat Gateway tidak berjalan di Mac Messages.
  </Card>
  <Card title="Configuration reference" icon="settings" href="/id/gateway/config-channels#imessage">
    Referensi lengkap field iMessage.
  </Card>
</CardGroup>

## Penyiapan cepat

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Configure OpenClaw">

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

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Permintaan pairing kedaluwarsa setelah 1 jam.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw hanya memerlukan `cliPath` yang kompatibel dengan stdio, sehingga Anda dapat mengarahkan `cliPath` ke skrip wrapper yang melakukan SSH ke Mac jarak jauh dan menjalankan `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Konfigurasi yang disarankan saat lampiran diaktifkan:

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

    Jika `remoteHost` tidak diatur, OpenClaw mencoba mendeteksinya otomatis dengan mengurai skrip wrapper SSH.
    `remoteHost` harus berupa `host` atau `user@host` (tanpa spasi atau opsi SSH).
    OpenClaw menggunakan pemeriksaan host-key ketat untuk SCP, jadi kunci host relay harus sudah ada di `~/.ssh/known_hosts`.
    Jalur lampiran divalidasi terhadap root yang diizinkan (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Wrapper `cliPath` atau proxy SSH apa pun yang Anda letakkan di depan `imsg` HARUS berperilaku seperti pipe stdio transparan untuk JSON-RPC yang berjalan lama. OpenClaw bertukar pesan JSON-RPC kecil berbingkai newline melalui stdin/stdout wrapper selama masa aktif saluran:

- Teruskan setiap potongan/baris stdin **segera setelah byte tersedia** — jangan menunggu EOF.
- Teruskan setiap potongan/baris stdout dengan segera ke arah sebaliknya.
- Pertahankan newline.
- Hindari pembacaan blocking berukuran tetap (`read(4096)`, `cat | buffer`, `read` shell default) yang dapat membuat frame kecil kelaparan.
- Pisahkan stderr dari stream stdout JSON-RPC.

Wrapper yang menahan stdin hingga blok besar terisi akan menghasilkan gejala yang tampak seperti gangguan iMessage — `imsg rpc timeout (chats.list)` atau restart saluran berulang — meskipun `imsg rpc` sendiri sehat. `ssh -T host imsg "$@"` (di atas) aman karena meneruskan argumen `cliPath` OpenClaw seperti `rpc` dan `--db`. Pipeline seperti `ssh host imsg | grep -v '^DEBUG'` TIDAK aman — alat line-buffered masih dapat menahan frame; gunakan `stdbuf -oL -eL` pada setiap tahap jika Anda harus memfilter.
</Warning>

  </Tab>
</Tabs>

## Persyaratan dan izin (macOS)

- Messages harus sudah masuk di Mac yang menjalankan `imsg`.
- Full Disk Access diperlukan untuk konteks proses yang menjalankan OpenClaw/`imsg` (akses DB Messages).
- Izin Automation diperlukan untuk mengirim pesan melalui Messages.app.
- Untuk tindakan lanjutan (react / edit / unsend / balasan berutas / efek / polling / operasi grup), System Integrity Protection harus dinonaktifkan — lihat [Mengaktifkan private API imsg](#enabling-the-imsg-private-api) di bawah. Pengiriman/penerimaan teks dan media dasar berfungsi tanpanya.

<Tip>
Izin diberikan per konteks proses. Jika gateway berjalan headless (LaunchAgent/SSH), jalankan perintah interaktif sekali dalam konteks yang sama untuk memicu prompt:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH wrapper sends fail with AppleEvents -1743">
  Penyiapan SSH jarak jauh dapat membaca chat, lolos `channels status --probe`, dan memproses pesan masuk sementara pengiriman keluar tetap gagal dengan kesalahan otorisasi AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Periksa database TCC pengguna Mac yang masuk atau System Settings > Privacy & Security > Automation. Jika entri Automation dicatat untuk `/usr/libexec/sshd-keygen-wrapper`, bukan proses `imsg` atau shell lokal, macOS mungkin tidak menampilkan toggle Messages yang dapat digunakan untuk klien sisi server SSH tersebut:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

Dalam kondisi tersebut, mengulangi `tccutil reset AppleEvents` atau menjalankan ulang `imsg send` melalui wrapper SSH yang sama mungkin terus gagal karena konteks proses yang membutuhkan Automation Messages adalah wrapper SSH, bukan aplikasi yang dapat diberi izin oleh UI.

Gunakan salah satu konteks proses `imsg` yang didukung sebagai gantinya:

- Jalankan Gateway, atau setidaknya bridge `imsg`, di sesi lokal pengguna Messages yang sedang masuk.
- Mulai Gateway dengan LaunchAgent untuk pengguna tersebut setelah memberikan Full Disk Access dan Automation dari sesi yang sama.
- Jika Anda mempertahankan topologi SSH dua pengguna, verifikasi bahwa `imsg send` keluar yang nyata berhasil melalui wrapper yang persis sama sebelum mengaktifkan saluran. Jika Automation tidak dapat diberikan, konfigurasi ulang ke penyiapan `imsg` satu pengguna alih-alih mengandalkan wrapper SSH untuk pengiriman.

</Accordion>

## Mengaktifkan private API imsg

`imsg` dikirim dalam dua mode operasional:

- **Mode dasar** (default, tidak perlu perubahan SIP): teks dan media keluar melalui `send`, watch/history masuk, daftar chat. Ini yang Anda dapatkan langsung dari `brew install steipete/tap/imsg` baru ditambah izin macOS standar di atas.
- **Mode private API**: `imsg` menyuntikkan helper dylib ke `Messages.app` untuk memanggil fungsi internal `IMCore`. Ini membuka `react`, `edit`, `unsend`, `reply` (berutas), `sendWithEffect`, `poll` dan `poll-vote` (polling Messages native), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, plus indikator mengetik dan tanda dibaca.

Untuk mencapai permukaan tindakan lanjutan yang didokumentasikan halaman saluran ini, Anda memerlukan mode Private API. README `imsg` tegas tentang persyaratan ini:

> Fitur lanjutan seperti `read`, `typing`, `launch`, pengiriman kaya berbasis bridge, mutasi pesan, dan manajemen chat bersifat opt-in. Fitur tersebut memerlukan SIP dinonaktifkan dan helper dylib disuntikkan ke `Messages.app`. `imsg launch` menolak menyuntikkan saat SIP diaktifkan.

Teknik injeksi helper menggunakan dylib milik `imsg` sendiri untuk menjangkau private API Messages. Tidak ada server pihak ketiga atau runtime BlueBubbles di jalur iMessage OpenClaw.

<Warning>
**Menonaktifkan SIP adalah kompromi keamanan nyata.** SIP adalah salah satu perlindungan inti macOS terhadap eksekusi kode sistem yang dimodifikasi; mematikannya secara sistem-wide membuka permukaan serangan tambahan dan efek samping. Khususnya, **menonaktifkan SIP pada Mac Apple Silicon juga menonaktifkan kemampuan untuk menginstal dan menjalankan aplikasi iOS di Mac Anda**.

Perlakukan ini sebagai pilihan operasional yang disengaja, bukan default. Jika model ancaman Anda tidak dapat menoleransi SIP dimatikan, iMessage bawaan terbatas pada mode dasar — hanya pengiriman/penerimaan teks dan media, tanpa reaksi / edit / unsend / efek / operasi grup.
</Warning>

### Penyiapan

1. **Instal (atau tingkatkan) `imsg`** di Mac yang menjalankan Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Output `imsg status --json` melaporkan `bridge_version`, `rpc_methods`, dan `selectors` per metode sehingga Anda dapat melihat apa yang didukung build saat ini sebelum memulai.

2. **Nonaktifkan System Integrity Protection, dan (pada macOS modern) Library Validation.** Menyuntikkan helper dylib non-Apple ke `Messages.app` yang ditandatangani Apple memerlukan SIP dimatikan **dan** validasi library dilonggarkan. Langkah SIP mode Recovery spesifik untuk versi macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** nonaktifkan Library Validation melalui Terminal, reboot ke Recovery Mode, jalankan `csrutil disable`, mulai ulang.
   - **macOS 11+ (Big Sur dan yang lebih baru), Intel:** Recovery Mode (atau Internet Recovery), `csrutil disable`, mulai ulang.
   - **macOS 11+, Apple Silicon:** urutan startup tombol daya untuk masuk Recovery; pada versi macOS terbaru tahan tombol **Left Shift** saat Anda mengklik Continue, lalu `csrutil disable`. Penyiapan mesin virtual mengikuti alur terpisah, jadi ambil snapshot VM terlebih dahulu.

   **Pada macOS 11 dan yang lebih baru, `csrutil disable` saja biasanya tidak cukup.** Apple masih menerapkan validasi library terhadap `Messages.app` sebagai binary platform, sehingga helper yang ditandatangani adhoc ditolak (`Library Validation failed: ... platform binary, but mapped file is not`) bahkan dengan SIP dimatikan. Setelah menonaktifkan SIP, nonaktifkan juga validasi library dan reboot:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), diverifikasi pada 26.5.1:** SIP dimatikan **plus** perintah `DisableLibraryValidation` di atas sudah cukup untuk menyuntikkan helper di seluruh 26.0 hingga 26.5.x. **Tidak diperlukan boot-args.** Plist adalah faktor penentu dan langkah yang paling umum terlewat saat injeksi gagal di Tahoe:
   - **Dengan plist:** `imsg launch` menyuntikkan dan `imsg status` melaporkan `advanced_features: true`.
   - **Tanpa plist (bahkan dengan SIP dimatikan):** `imsg launch` gagal dengan `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI menolak helper adhoc saat dimuat, sehingga bridge tidak pernah siap dan launch timeout. Timeout tersebut adalah gejala yang paling sering ditemui di Tahoe, dan perbaikannya adalah plist di atas, bukan tindakan yang lebih drastis.

   Ini dikonfirmasi dengan before/after terkontrol pada macOS 26.5.1 (Apple Silicon): dengan plist, dylib dipetakan ke `Messages.app` dan bridge aktif; hapus plist dan reboot, lalu `imsg launch` menghasilkan kegagalan timeout di atas dengan dylib tidak dipetakan.

   Jika injeksi `imsg launch` atau `selectors` tertentu mulai mengembalikan false setelah peningkatan macOS, gate ini biasanya penyebabnya. Periksa status SIP dan validasi pustaka Anda sebelum menganggap langkah SIP itu sendiri gagal. Jika pengaturan tersebut benar dan bridge masih tidak dapat melakukan injeksi, kumpulkan `imsg status --json` beserta keluaran `imsg launch` dan laporkan ke proyek `imsg`, bukan melemahkan kontrol keamanan tambahan di seluruh sistem.

   Ikuti alur mode Recovery Apple untuk Mac Anda guna menonaktifkan SIP sebelum menjalankan `imsg launch`.

3. **Injeksikan helper.** Dengan SIP dinonaktifkan dan Messages.app sudah masuk:

   ```bash
   imsg launch
   ```

   `imsg launch` menolak melakukan injeksi ketika SIP masih aktif, jadi ini juga berfungsi sebagai konfirmasi bahwa langkah 2 berhasil.

4. **Verifikasi bridge dari OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Entri iMessage seharusnya melaporkan `works`, dan `imsg status --json | jq '{rpc_methods, selectors}'` seharusnya menampilkan kapabilitas yang diekspos oleh build macOS Anda. Pembuatan polling memerlukan `selectors.pollPayloadMessage`; voting memerlukan `selectors.pollVoteMessage` dan metode RPC `poll.vote`. Plugin OpenClaw hanya mengiklankan tindakan yang didukung oleh probe yang di-cache, sementara cache kosong tetap optimistis dan melakukan probe pada pengiriman pertama.

Jika `openclaw channels status --probe` melaporkan channel sebagai `works` tetapi tindakan tertentu melempar "iMessage `<action>` requires the imsg private API bridge" saat pengiriman, jalankan `imsg launch` lagi — helper dapat terlepas (restart Messages.app, pembaruan OS, dll.) dan status `available: true` yang di-cache akan terus mengiklankan tindakan sampai probe berikutnya menyegarkan status.

### Ketika Anda tidak dapat menonaktifkan SIP

Jika SIP yang dinonaktifkan tidak dapat diterima untuk model ancaman Anda:

- `imsg` kembali ke mode dasar — teks + media + hanya menerima.
- Plugin OpenClaw masih mengiklankan pengiriman teks/media dan pemantauan masuk; Plugin hanya menyembunyikan `react`, `edit`, `unsend`, `reply`, `sendWithEffect`, dan operasi grup dari permukaan tindakan (sesuai gate kapabilitas per metode).
- Anda dapat menjalankan Mac non-Apple-Silicon terpisah (atau Mac bot khusus) dengan SIP mati untuk beban kerja iMessage, sambil tetap mengaktifkan SIP di perangkat utama Anda. Lihat [Dedicated bot macOS user (separate iMessage identity)](#deployment-patterns) di bawah.

## Kontrol akses dan routing

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` mengontrol pesan langsung:

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `allowFrom` untuk menyertakan `"*"`)
    - `disabled`

    Kolom allowlist: `channels.imessage.allowFrom`.

    Entri allowlist harus mengidentifikasi pengirim: handle atau grup akses pengirim statis (`accessGroup:<name>`). Gunakan `channels.imessage.groupAllowFrom` untuk target chat seperti `chat_id:*`, `chat_guid:*`, atau `chat_identifier:*`; gunakan `channels.imessage.groups` untuk kunci registri `chat_id` numerik.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` mengontrol penanganan grup:

    - `allowlist` (default saat dikonfigurasi)
    - `open`
    - `disabled`

    Allowlist pengirim grup: `channels.imessage.groupAllowFrom`.

    Entri `groupAllowFrom` juga dapat mereferensikan grup akses pengirim statis (`accessGroup:<name>`).

    Fallback runtime: jika `groupAllowFrom` tidak diatur, pemeriksaan pengirim grup iMessage menggunakan `allowFrom`; atur `groupAllowFrom` ketika penerimaan DM dan grup harus berbeda.
    Catatan runtime: jika `channels.imessage` sepenuhnya tidak ada, runtime kembali ke `groupPolicy="allowlist"` dan mencatat peringatan (meskipun `channels.defaults.groupPolicy` diatur).

    <Warning>
    Routing grup memiliki **dua** gate allowlist yang berjalan berurutan, dan keduanya harus lolos:

    1. **Allowlist pengirim / target chat** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier`, atau `chat_id`.
    2. **Registri grup** (`channels.imessage.groups`) — dengan `groupPolicy: "allowlist"`, gate ini memerlukan entri wildcard `groups: { "*": { ... } }` (mengatur `allowAll = true`), atau entri eksplisit per `chat_id` di bawah `groups`.

    Jika gate 2 kosong, setiap pesan grup akan dibuang. Plugin memancarkan dua sinyal tingkat `warn` pada level log default:

    - satu kali per akun saat startup: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - satu kali per `chat_id` saat runtime: `imessage: dropping group message from chat_id=<id> ...`

    DM tetap berfungsi karena mengambil jalur kode yang berbeda.

    Konfigurasi minimum agar grup tetap berjalan di bawah `groupPolicy: "allowlist"`:

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

    Jika baris `warn` tersebut muncul di log gateway, gate 2 sedang membuang — tambahkan blok `groups`.
    </Warning>

    Gate mention untuk grup:

    - iMessage tidak memiliki metadata mention bawaan
    - deteksi mention menggunakan pola regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - tanpa pola yang dikonfigurasi, gate mention tidak dapat ditegakkan

    Perintah kontrol dari pengirim resmi dapat melewati gate mention di grup.

    `systemPrompt` per grup:

    Setiap entri di bawah `channels.imessage.groups.*` menerima string `systemPrompt` opsional. Nilai tersebut disuntikkan ke prompt sistem agen pada setiap turn yang menangani pesan di grup tersebut. Resolusi mencerminkan resolusi prompt per grup yang digunakan oleh `channels.whatsapp.groups`:

    1. **Prompt sistem khusus grup** (`groups["<chat_id>"].systemPrompt`): digunakan ketika entri grup tertentu ada di map **dan** kunci `systemPrompt`-nya didefinisikan. Jika `systemPrompt` adalah string kosong (`""`), wildcard ditekan dan tidak ada prompt sistem yang diterapkan ke grup tersebut.
    2. **Prompt sistem wildcard grup** (`groups["*"].systemPrompt`): digunakan ketika entri grup tertentu sepenuhnya tidak ada dari map, atau ketika entri itu ada tetapi tidak mendefinisikan kunci `systemPrompt`.

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

    Prompt per grup hanya berlaku untuk pesan grup — pesan langsung di channel ini tidak terpengaruh.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DM menggunakan routing langsung; grup menggunakan routing grup.
    - Dengan `session.dmScope=main` default, DM iMessage digabungkan ke sesi utama agen.
    - Sesi grup diisolasi (`agent:<agentId>:imessage:group:<chat_id>`).
    - Balasan dirutekan kembali ke iMessage menggunakan metadata channel/target asal.

    Perilaku thread yang mirip grup:

    Beberapa thread iMessage multipeserta dapat datang dengan `is_group=false`.
    Jika `chat_id` tersebut secara eksplisit dikonfigurasi di bawah `channels.imessage.groups`, OpenClaw memperlakukannya sebagai traffic grup (gate grup + isolasi sesi grup).

  </Tab>
</Tabs>

## Binding percakapan ACP

Chat iMessage lama juga dapat diikat ke sesi ACP.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM atau chat grup yang diizinkan.
- Pesan berikutnya dalam percakapan iMessage yang sama dirutekan ke sesi ACP yang dibuat.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus binding.

Binding persisten yang dikonfigurasi didukung melalui entri `bindings[]` tingkat atas dengan `type: "acp"` dan `match.channel: "imessage"`.

`match.peer.id` dapat menggunakan:

- handle DM yang dinormalisasi seperti `+15555550123` atau `user@example.com`
- `chat_id:<id>` (direkomendasikan untuk binding grup yang stabil)
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
    2. Masuk ke Messages dengan Apple ID bot di pengguna tersebut.
    3. Instal `imsg` di pengguna tersebut.
    4. Buat wrapper SSH agar OpenClaw dapat menjalankan `imsg` dalam konteks pengguna tersebut.
    5. Arahkan `channels.imessage.accounts.<id>.cliPath` dan `.dbPath` ke profil pengguna tersebut.

    Eksekusi pertama mungkin memerlukan persetujuan GUI (Automation + Full Disk Access) di sesi pengguna bot tersebut.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Topologi umum:

    - gateway berjalan di Linux/VM
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

    Gunakan kunci SSH agar SSH dan SCP sama-sama noninteraktif.
    Pastikan kunci host dipercaya terlebih dahulu (misalnya `ssh bot@mac-mini.tailnet-1234.ts.net`) agar `known_hosts` terisi.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage mendukung konfigurasi per akun di bawah `channels.imessage.accounts`.

    Setiap akun dapat mengganti kolom seperti `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, pengaturan riwayat, dan allowlist root lampiran.

  </Accordion>

  <Accordion title="Direct-message history">
    Atur `channels.imessage.dmHistoryLimit` untuk mengisi sesi pesan langsung baru dengan riwayat `imsg` terbaru yang sudah didekode untuk percakapan tersebut. Gunakan `channels.imessage.dms["<sender>"].historyLimit` untuk penggantian per pengirim, termasuk `0` untuk menonaktifkan riwayat bagi seorang pengirim.

    Riwayat DM iMessage diambil sesuai permintaan dari `imsg`. Membiarkan `dmHistoryLimit` tidak diatur menonaktifkan pengisian riwayat DM global, tetapi `channels.imessage.dms["<sender>"].historyLimit` per pengirim yang bernilai positif tetap mengaktifkan pengisian untuk pengirim tersebut.

  </Accordion>
</AccordionGroup>

## Media, pemotongan, dan target pengiriman

<AccordionGroup>
  <Accordion title="Lampiran dan media">
    - penyerapan lampiran masuk **nonaktif secara default** — atur `channels.imessage.includeAttachments: true` untuk meneruskan foto, memo suara, video, dan lampiran lain ke agen. Jika dinonaktifkan, iMessage yang hanya berisi lampiran akan dibuang sebelum mencapai agen dan mungkin sama sekali tidak menghasilkan baris log `Inbound message`.
    - jalur lampiran jarak jauh dapat diambil melalui SCP saat `remoteHost` ditetapkan
    - jalur lampiran harus cocok dengan root yang diizinkan:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (mode SCP jarak jauh)
      - pola root default: `/Users/*/Library/Messages/Attachments`
    - SCP menggunakan pemeriksaan kunci host ketat (`StrictHostKeyChecking=yes`)
    - ukuran media keluar menggunakan `channels.imessage.mediaMaxMb` (default 16 MB)

  </Accordion>

  <Accordion title="Pemotongan keluaran">
    - batas potongan teks: `channels.imessage.textChunkLimit` (default 4000)
    - mode potongan: `channels.imessage.chunkMode`
      - `length` (default)
      - `newline` (pemecahan yang mengutamakan paragraf)

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

Saat `imsg launch` berjalan dan `openclaw channels status --probe` melaporkan `privateApi.available: true`, alat pesan dapat menggunakan tindakan native iMessage selain pengiriman teks biasa.

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
    - **react**: Menambah/menghapus tapback iMessage (`messageId`, `emoji`, `remove`). Tapback yang didukung dipetakan ke love, like, dislike, laugh, emphasize, dan question.
    - **reply**: Mengirim balasan berutas ke pesan yang sudah ada (`messageId`, `text` atau `message`, ditambah `chatGuid`, `chatId`, `chatIdentifier`, atau `to`).
    - **sendWithEffect**: Mengirim teks dengan efek iMessage (`text` atau `message`, `effect` atau `effectId`).
    - **edit**: Mengedit pesan terkirim pada versi macOS/API privat yang didukung (`messageId`, `text` atau `newText`).
    - **unsend**: Menarik kembali pesan terkirim pada versi macOS/API privat yang didukung (`messageId`).
    - **upload-file**: Mengirim media/berkas (`buffer` sebagai base64 atau `media`/`path`/`filePath` yang telah dihidrasi, `filename`, opsional `asVoice`). Alias lama: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Mengelola obrolan grup saat target saat ini adalah percakapan grup.
    - **poll**: Membuat polling native Apple Messages (`pollQuestion`, `pollOption` diulang 2 hingga 12 kali, ditambah `chatGuid`, `chatId`, `chatIdentifier`, atau `to`). Penerima di iOS/iPadOS/macOS 26+ melihat dan memberikan suara secara native; versi OS lama menerima fallback teks "Sent a poll". Memerlukan `selectors.pollPayloadMessage`.
    - **poll-vote**: Memberikan suara pada polling yang sudah ada (`pollId` atau `messageId`, ditambah tepat salah satu dari `pollOptionIndex`, `pollOptionId`, atau `pollOptionText`). Memerlukan `selectors.pollVoteMessage` dan metode RPC `poll.vote`.

    Polling masuk yang diterima dirender untuk agen dengan pertanyaan, label opsi bernomor, jumlah suara, dan ID pesan polling yang diperlukan oleh `poll-vote`.

  </Accordion>

  <Accordion title="ID Pesan">
    Konteks iMessage masuk mencakup nilai `MessageSid` pendek dan GUID pesan lengkap saat tersedia. ID pendek dicakupkan ke cache balasan terbaru berbasis SQLite dan diperiksa terhadap obrolan saat ini sebelum digunakan. Jika ID pendek telah kedaluwarsa atau milik obrolan lain, coba lagi dengan `MessageSidFull`.

  </Accordion>

  <Accordion title="Deteksi kapabilitas">
    OpenClaw menyembunyikan tindakan API privat hanya saat status probe yang di-cache menyatakan bridge tidak tersedia. Jika status tidak diketahui, tindakan tetap terlihat dan dispatch melakukan probe secara malas sehingga tindakan pertama dapat berhasil setelah `imsg launch` tanpa penyegaran status manual terpisah.

  </Accordion>

  <Accordion title="Tanda sudah dibaca dan mengetik">
    Saat bridge API privat aktif, obrolan masuk yang diterima ditandai sudah dibaca dan obrolan langsung menampilkan gelembung mengetik segera setelah giliran diterima, sementara agen menyiapkan konteks dan menghasilkan respons. Nonaktifkan penandaan baca dengan:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Build `imsg` lama yang mendahului daftar kapabilitas per metode akan menonaktifkan pengetikan/tanda baca secara diam-diam; OpenClaw mencatat peringatan satu kali per restart agar tanda terima yang hilang dapat dilacak penyebabnya.

  </Accordion>

  <Accordion title="Tapback masuk">
    OpenClaw berlangganan tapback iMessage dan merutekan reaksi yang diterima sebagai peristiwa sistem, bukan teks pesan biasa, sehingga tapback pengguna tidak memicu loop balasan biasa.

    Mode notifikasi dikendalikan oleh `channels.imessage.reactionNotifications`:

    - `"own"` (default): beri tahu hanya saat pengguna bereaksi ke pesan yang ditulis bot.
    - `"all"`: beri tahu untuk semua tapback masuk dari pengirim yang diotorisasi.
    - `"off"`: abaikan tapback masuk.

    Override per akun menggunakan `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Reaksi persetujuan (👍 / 👎)">
    Saat `approvals.exec.enabled` atau `approvals.plugin.enabled` bernilai true dan permintaan dirutekan ke iMessage, Gateway mengirim prompt persetujuan secara native dan menerima tapback untuk menyelesaikannya:

    - `👍` (tapback Like) → `allow-once`
    - `👎` (tapback Dislike) → `deny`
    - `allow-always` tetap menjadi fallback manual: kirim `/approve <id> allow-always` sebagai balasan reguler.

    Penanganan reaksi mengharuskan handle pengguna yang bereaksi menjadi pemberi persetujuan eksplisit. Daftar pemberi persetujuan dibaca dari `channels.imessage.allowFrom` (atau `channels.imessage.accounts.<id>.allowFrom`); tambahkan nomor telepon pengguna dalam format E.164 atau email Apple ID mereka. Entri wildcard `"*"` dihormati tetapi mengizinkan pengirim mana pun untuk menyetujui. Pintasan reaksi sengaja melewati `reactionNotifications`, `dmPolicy`, dan `groupAllowFrom` karena allowlist pemberi persetujuan eksplisit adalah satu-satunya gerbang yang penting untuk resolusi persetujuan.

    **Perubahan perilaku dengan rilis ini:** Saat `channels.imessage.allowFrom` tidak kosong, perintah teks `/approve <id> <decision>` kini diotorisasi terhadap daftar pemberi persetujuan tersebut (bukan allowlist DM yang lebih luas). Pengirim yang diizinkan pada allowlist DM tetapi tidak ada di `allowFrom` akan menerima penolakan eksplisit. Tambahkan setiap operator yang harus dapat menyetujui melalui `/approve` (dan melalui reaksi) ke `allowFrom` untuk mempertahankan perilaku sebelumnya. Saat `allowFrom` kosong, "fallback obrolan yang sama" lama tetap berlaku dan `/approve` terus mengotorisasi siapa pun yang diizinkan oleh allowlist DM.

    Catatan operator:
    - Binding reaksi disimpan baik di memori (dengan TTL yang dicocokkan dengan kedaluwarsa persetujuan) maupun di penyimpanan keyed persisten Gateway, sehingga tapback yang masuk tak lama setelah restart Gateway tetap menyelesaikan persetujuan.
    - Tapback lintas perangkat `is_from_me=true` (reaksi operator sendiri pada perangkat Apple yang dipasangkan) sengaja diabaikan agar bot tidak dapat menyetujui dirinya sendiri.
    - Tapback gaya teks lama (`Liked "…"` sebagai teks biasa dari klien Apple yang sangat lama) tidak dapat menyelesaikan persetujuan karena tidak membawa GUID pesan; resolusi reaksi memerlukan metadata tapback terstruktur yang dipancarkan klien macOS / iOS saat ini.

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
2. Gelembung pratinjau URL (`"https://..."`) dengan gambar pratinjau OG sebagai lampiran.

Kedua baris tiba di OpenClaw dengan selang ~0,8-2,0 d pada sebagian besar penyiapan. Tanpa penggabungan, agen menerima perintah saja pada giliran 1, membalas (sering kali "send me the URL"), dan baru melihat URL pada giliran 2 — saat konteks perintah sudah hilang. Ini adalah pipeline pengiriman Apple, bukan sesuatu yang diperkenalkan OpenClaw atau `imsg`.

`channels.imessage.coalesceSameSenderDms` membuat DM menggunakan buffering baris berurutan dari pengirim yang sama. Saat `imsg` mengekspos penanda struktural pratinjau URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` pada salah satu baris sumber, OpenClaw hanya menggabungkan split-send nyata tersebut dan mempertahankan baris buffer lain sebagai giliran terpisah. Pada build `imsg` lama yang sama sekali tidak memancarkan metadata gelembung, OpenClaw tidak dapat membedakan split-send dari pengiriman terpisah, sehingga fallback ke penggabungan bucket. Itu mempertahankan perilaku pra-metadata alih-alih meregresikan split-send `Dump <url>` menjadi dua giliran. Obrolan grup terus melakukan dispatch per pesan sehingga struktur giliran multi-pengguna tetap dipertahankan.

<Tabs>
  <Tab title="Kapan mengaktifkan">
    Aktifkan saat:

    - Anda mengirim Skills yang mengharapkan `command + payload` dalam satu pesan (dump, paste, save, queue, dll.).
    - Pengguna Anda menempelkan URL bersama perintah.
    - Anda dapat menerima latensi giliran DM tambahan (lihat di bawah).

    Biarkan nonaktif saat:

    - Anda membutuhkan latensi perintah minimum untuk pemicu DM satu kata.
    - Semua flow Anda adalah perintah sekali jalan tanpa tindak lanjut payload.

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

    Dengan flag aktif dan tanpa `messages.inbound.byChannel.imessage` eksplisit atau `messages.inbound.debounceMs` global, jendela debounce melebar menjadi **7000 ms** (default lama adalah 0 ms — tanpa debouncing). Jendela yang lebih lebar diperlukan karena irama split-send pratinjau URL Apple dapat memanjang hingga beberapa detik saat Messages.app memancarkan baris pratinjau.

    Untuk menyesuaikan jendela sendiri:

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
  <Tab title="Trade-offs">
    - **Penggabungan presisi membutuhkan metadata payload `imsg` saat ini.** Saat baris URL menyertakan `balloon_bundle_id`, hanya split-send nyata itu yang digabungkan dan baris buffer lain tetap terpisah. Pada build `imsg` lama yang tidak mengekspos metadata balon, OpenClaw kembali menggabungkan bucket buffer agar split-send `Dump <url>` tidak mengalami regresi menjadi dua giliran (back-compat sementara, dihapus setelah `imsg` menggabungkan split-send di upstream).
    - **Latensi tambahan untuk pesan DM.** Dengan flag aktif, setiap DM (termasuk perintah kontrol mandiri dan tindak lanjut teks tunggal) menunggu hingga jendela debounce sebelum dikirim, untuk berjaga-jaga jika baris pratinjau URL akan datang. Pesan obrolan grup tetap dikirim secara instan.
    - **Output gabungan dibatasi.** Teks gabungan dibatasi hingga 4000 karakter dengan penanda eksplisit `…[truncated]`; lampiran dibatasi hingga 20; entri sumber dibatasi hingga 10 (yang pertama-plus-terbaru dipertahankan setelah batas itu). Setiap GUID sumber dilacak di `coalescedMessageGuids` untuk telemetri downstream.
    - **Hanya DM.** Obrolan grup diteruskan ke pengiriman per pesan agar bot tetap responsif saat beberapa orang sedang mengetik.
    - **Opt-in, per kanal.** Kanal lain (Telegram, WhatsApp, Slack, …) tidak terpengaruh. Konfigurasi BlueBubbles lama yang mengatur `channels.bluebubbles.coalesceSameSenderDms` harus memigrasikan nilai itu ke `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Skenario dan apa yang dilihat agen

Kolom "Flag aktif" menunjukkan perilaku pada build `imsg` yang memancarkan `balloon_bundle_id`. Pada build `imsg` lama yang sama sekali tidak memancarkan metadata balon, baris di bawah yang ditandai "Dua giliran" / "N giliran" akan kembali ke penggabungan lama (satu giliran): OpenClaw tidak dapat membedakan secara struktural split-send dari pengiriman terpisah, sehingga mempertahankan penggabungan pra-metadata. Pemisahan presisi aktif setelah build memancarkan metadata balon.

| Pengguna menyusun                                                   | `chat.db` menghasilkan              | Flag nonaktif (default)                       | Flag aktif + jendela (imsg memancarkan metadata balon)                                                   |
| ------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (satu pengiriman)                        | 2 baris berjarak ~1 d               | Dua giliran agen: "Dump" saja, lalu URL       | Satu giliran: teks gabungan `Dump https://example.com`                                                   |
| `Save this 📎image.jpg caption` (lampiran + teks)                   | 2 baris tanpa metadata balon URL    | Dua giliran                                   | Dua giliran setelah metadata teramati; satu giliran gabungan pada sesi lama/pra-latch tanpa metadata     |
| `/status` (perintah mandiri)                                        | 1 baris                             | Pengiriman instan                             | **Tunggu hingga jendela, lalu kirim**                                                                    |
| URL ditempel sendiri                                                | 1 baris                             | Pengiriman instan                             | Tunggu hingga jendela, lalu kirim                                                                        |
| Teks + URL dikirim sebagai dua pesan terpisah yang disengaja, terpaut menit | 2 baris di luar jendela             | Dua giliran                                   | Dua giliran (jendela kedaluwarsa di antaranya)                                                           |
| Banjir cepat (>10 DM kecil dalam jendela)                           | N baris tanpa metadata balon URL    | N giliran                                     | N giliran setelah metadata teramati; satu giliran gabungan terbatas pada sesi lama/pra-latch tanpa metadata |
| Dua orang mengetik di obrolan grup                                  | N baris dari M pengirim             | M+ giliran (satu per bucket pengirim)         | M+ giliran — obrolan grup tidak digabungkan                                                              |

## Pemulihan inbound setelah bridge atau gateway dimulai ulang

iMessage memulihkan pesan yang terlewat saat gateway mati, dan pada saat yang sama menekan "bom backlog" usang yang dapat digelontorkan Apple setelah pemulihan Push. Perilaku default selalu aktif, dibangun di atas dedupe inbound.

- **Dedupe replay.** Setiap pesan inbound yang dikirim dicatat berdasarkan GUID Apple-nya dalam status Plugin persisten (`imessage.inbound-dedupe`), diklaim saat ingestion dan dikomit setelah penanganan (dilepas pada kegagalan sementara agar dapat dicoba ulang). Apa pun yang sudah ditangani akan dijatuhkan, bukan dikirim dua kali. Inilah yang memungkinkan replay pemulihan berjalan agresif tanpa pembukuan per pesan.
- **Pemulihan downtime.** Saat startup, monitor mengingat `chat.db` rowid terakhir yang dikirim (kursor per akun yang dipersistenkan) dan meneruskannya ke `imsg watch.subscribe` sebagai `since_rowid`, sehingga imsg memutar ulang baris yang masuk saat gateway mati, lalu mengikuti live. Replay dibatasi ke baris terbaru dan ke pesan hingga usia ~2 jam, dan dedupe menjatuhkan apa pun yang sudah ditangani.
- **Pagar usia backlog usang.** Baris di atas batas startup benar-benar live; baris yang tanggal kirimnya lebih dari ~15 menit lebih lama daripada waktu kedatangannya adalah backlog Push-flush dan ditekan. Baris yang diputar ulang (di atau di bawah batas) menggunakan jendela pemulihan yang lebih lebar, sehingga pesan yang baru saja terlewat dikirim sementara riwayat kuno tidak.

Pemulihan bekerja pada setup `cliPath` lokal maupun jarak jauh, karena replay `since_rowid` berjalan melalui koneksi RPC `imsg` yang sama. Perbedaannya ada pada jendela: saat gateway dapat membaca `chat.db` (lokal), gateway menambatkan batas rowid startup, membatasi rentang replay, dan mengirim pesan yang terlewat hingga sekitar beberapa jam. Melalui `cliPath` SSH jarak jauh, gateway tidak dapat membaca basis data, sehingga replay tidak dibatasi dan setiap baris menggunakan pagar usia live — tetap memulihkan pesan yang baru saja terlewat dan tetap menekan backlog lama, hanya dengan jendela live yang lebih sempit. Jalankan gateway di Mac Messages untuk jendela pemulihan yang lebih lebar.

### Sinyal yang terlihat operator

Backlog yang ditekan dicatat pada level default, tidak pernah dijatuhkan diam-diam (flag `recovery` menunjukkan jendela mana yang diterapkan):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Migrasi

`channels.imessage.catchup.*` tidak digunakan lagi — pemulihan downtime sekarang otomatis dan tidak memerlukan konfigurasi untuk setup baru. Konfigurasi yang sudah ada dengan `catchup.enabled: true` tetap dihormati sebagai profil kompatibilitas untuk jendela replay pemulihan. Blok catchup yang dinonaktifkan (`enabled: false` atau tanpa `enabled: true`) sudah dipensiunkan; `openclaw doctor --fix` menghapusnya.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    Validasi binary dan dukungan RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Jika probe melaporkan RPC tidak didukung, perbarui `imsg`. Jika tindakan API privat tidak tersedia, jalankan `imsg launch` dalam sesi pengguna macOS yang sedang login dan probe lagi. Jika Gateway tidak berjalan di macOS, gunakan setup Remote Mac melalui SSH di atas alih-alih path `imsg` lokal default.

  </Accordion>

  <Accordion title="Messages send but inbound iMessages do not arrive">
    Pertama buktikan apakah pesan mencapai Mac lokal. Jika `chat.db` tidak berubah, OpenClaw tidak dapat menerima pesan meskipun `imsg status --json` melaporkan bridge yang sehat.

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

    Kirim iMessage baru dari ponsel dan konfirmasi baris `chat.db` baru atau event `imsg watch` sebelum men-debug sesi OpenClaw. Jangan jalankan ini sebagai loop peluncuran ulang bridge berkala; `imsg launch` berulang plus restart gateway selama pekerjaan aktif dapat mengganggu pengiriman dan meninggalkan run kanal yang sedang berjalan.

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    `cliPath: "imsg"` default harus berjalan di Mac yang login ke Messages. Di Linux atau Windows, atur `channels.imessage.cliPath` ke script wrapper yang melakukan SSH ke Mac itu dan menjalankan `imsg "$@"`.

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
    - autentikasi kunci SSH/SCP dari host gateway
    - kunci host ada di `~/.ssh/known_hosts` pada host gateway
    - keterbacaan path jarak jauh di Mac yang menjalankan Messages

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

- [Ringkasan Kanal](/id/channels) — semua kanal yang didukung
- [Penghapusan BlueBubbles dan jalur imsg iMessage](/id/announcements/bluebubbles-imessage) — pengumuman dan ringkasan migrasi
- [Beralih dari BlueBubbles](/id/channels/imessage-from-bluebubbles) — tabel terjemahan konfigurasi dan cutover langkah demi langkah
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku obrolan grup dan gating mention
- [Perutean Kanal](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
