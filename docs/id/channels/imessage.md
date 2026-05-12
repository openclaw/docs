---
read_when:
    - Menyiapkan dukungan iMessage
    - Men-debug pengiriman/penerimaan iMessage
summary: Dukungan asli untuk iMessage melalui imsg (JSON-RPC melalui stdio), dengan tindakan API privat untuk balasan, reaksi cepat, efek, lampiran, dan pengelolaan grup. Disarankan untuk penyiapan iMessage OpenClaw baru ketika persyaratan host sesuai.
title: iMessage
x-i18n:
    generated_at: "2026-05-12T00:56:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b0c284a5105bf9c2863f46731fb61628e264ce35c316014f25f15907142430
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Untuk deployment OpenClaw iMessage, gunakan `imsg` pada host macOS Messages yang sudah masuk. Jika Gateway Anda berjalan di Linux atau Windows, arahkan `channels.imessage.cliPath` ke wrapper SSH yang menjalankan `imsg` di Mac.

**Pengejaran ketertinggalan saat Gateway tidak aktif bersifat opt-in.** Saat diaktifkan (`channels.imessage.catchup.enabled: true`), gateway memutar ulang pesan masuk yang tiba di `chat.db` saat gateway offline (crash, restart, Mac tidur) pada startup berikutnya. Dinonaktifkan secara default — lihat [Mengejar ketertinggalan setelah gateway tidak aktif](#catching-up-after-gateway-downtime). Menutup [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
Dukungan BlueBubbles telah dihapus. Migrasikan konfigurasi `channels.bluebubbles` ke `channels.imessage`; OpenClaw mendukung iMessage hanya melalui `imsg`. Mulai dengan [Penghapusan BlueBubbles dan jalur imsg iMessage](/id/announcements/bluebubbles-imessage) untuk pengumuman singkat, atau [Beralih dari BlueBubbles](/id/channels/imessage-from-bluebubbles) untuk tabel migrasi lengkap.
</Warning>

Status: integrasi CLI eksternal native. Gateway menjalankan `imsg rpc` dan berkomunikasi melalui JSON-RPC di stdio (tanpa daemon/port terpisah). Tindakan lanjutan memerlukan `imsg launch` dan probe API privat yang berhasil.

<CardGroup cols={3}>
  <Card title="Tindakan API privat" icon="wand-sparkles" href="#private-api-actions">
    Balasan, tapback, efek, lampiran, dan manajemen grup.
  </Card>
  <Card title="Penyandingan" icon="link" href="/id/channels/pairing">
    DM iMessage default ke mode penyandingan.
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

      <Step title="Setujui penyandingan DM pertama (dmPolicy default)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Permintaan penyandingan kedaluwarsa setelah 1 jam.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac jarak jauh melalui SSH">
    OpenClaw hanya memerlukan `cliPath` yang kompatibel dengan stdio, jadi Anda dapat mengarahkan `cliPath` ke skrip wrapper yang melakukan SSH ke Mac jarak jauh dan menjalankan `imsg`.

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
    OpenClaw menggunakan pemeriksaan host-key ketat untuk SCP, jadi kunci host relay harus sudah ada di `~/.ssh/known_hosts`.
    Jalur lampiran divalidasi terhadap root yang diizinkan (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Persyaratan dan izin (macOS)

- Messages harus sudah masuk di Mac yang menjalankan `imsg`.
- Full Disk Access diperlukan untuk konteks proses yang menjalankan OpenClaw/`imsg` (akses DB Messages).
- Izin Automation diperlukan untuk mengirim pesan melalui Messages.app.
- Untuk tindakan lanjutan (react / edit / unsend / threaded reply / effects / group ops), System Integrity Protection harus dinonaktifkan — lihat [Mengaktifkan API privat imsg](#enabling-the-imsg-private-api) di bawah. Pengiriman/penerimaan teks dan media dasar berfungsi tanpanya.

<Tip>
Izin diberikan per konteks proses. Jika gateway berjalan headless (LaunchAgent/SSH), jalankan perintah interaktif satu kali dalam konteks yang sama untuk memicu prompt:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Mengaktifkan API privat imsg

`imsg` hadir dalam dua mode operasional:

- **Mode dasar** (default, tidak perlu perubahan SIP): teks dan media keluar melalui `send`, pemantauan/riwayat masuk, daftar chat. Ini yang Anda dapatkan langsung dari `brew install steipete/tap/imsg` baru plus izin macOS standar di atas.
- **Mode API privat**: `imsg` menyuntikkan helper dylib ke `Messages.app` untuk memanggil fungsi internal `IMCore`. Ini yang membuka `react`, `edit`, `unsend`, `reply` (berulir), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, plus indikator mengetik dan tanda terima baca.

Untuk mencapai permukaan tindakan lanjutan yang didokumentasikan halaman channel ini, Anda memerlukan mode API privat. README `imsg` eksplisit tentang persyaratan ini:

> Fitur lanjutan seperti `read`, `typing`, `launch`, pengiriman kaya berbasis bridge, mutasi pesan, dan manajemen chat bersifat opt-in. Fitur tersebut memerlukan SIP dinonaktifkan dan helper dylib disuntikkan ke `Messages.app`. `imsg launch` menolak menyuntik saat SIP diaktifkan.

Teknik injeksi helper menggunakan dylib milik `imsg` sendiri untuk menjangkau API privat Messages. Tidak ada server pihak ketiga atau runtime BlueBubbles dalam jalur OpenClaw iMessage.

<Warning>
**Menonaktifkan SIP adalah tradeoff keamanan nyata.** SIP adalah salah satu perlindungan inti macOS terhadap menjalankan kode sistem yang dimodifikasi; mematikannya secara system-wide membuka permukaan serangan dan efek samping tambahan. Khususnya, **menonaktifkan SIP pada Mac Apple Silicon juga menonaktifkan kemampuan untuk menginstal dan menjalankan aplikasi iOS di Mac Anda**.

Perlakukan ini sebagai pilihan operasional yang disengaja, bukan default. Jika model ancaman Anda tidak dapat menoleransi SIP dimatikan, iMessage bawaan terbatas pada mode dasar — hanya pengiriman/penerimaan teks dan media, tanpa reaction / edit / unsend / effects / group ops.
</Warning>

### Penyiapan

1. **Instal (atau upgrade) `imsg`** di Mac yang menjalankan Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Output `imsg status --json` melaporkan `bridge_version`, `rpc_methods`, dan `selectors` per metode sehingga Anda dapat melihat apa yang didukung build saat ini sebelum memulai.

2. **Nonaktifkan System Integrity Protection.** Ini spesifik versi macOS karena persyaratan Apple yang mendasarinya bergantung pada OS dan perangkat keras:
   - **macOS 10.13–10.15 (Sierra–Catalina):** nonaktifkan Library Validation melalui Terminal, reboot ke Recovery Mode, jalankan `csrutil disable`, mulai ulang.
   - **macOS 11+ (Big Sur dan lebih baru), Intel:** Recovery Mode (atau Internet Recovery), `csrutil disable`, mulai ulang.
   - **macOS 11+, Apple Silicon:** urutan startup tombol daya untuk masuk Recovery; pada versi macOS terbaru tahan tombol **Left Shift** saat Anda mengklik Continue, lalu `csrutil disable`. Penyiapan mesin virtual mengikuti alur terpisah — ambil snapshot VM terlebih dahulu.
   - **macOS 26 / Tahoe:** kebijakan library-validation dan pemeriksaan private-entitlement `imagent` makin diperketat; `imsg` mungkin memerlukan build terbaru agar tetap sesuai. Jika injeksi `imsg launch` atau `selectors` tertentu mulai mengembalikan false setelah upgrade mayor macOS, periksa catatan rilis `imsg` sebelum menganggap langkah SIP berhasil.

   Ikuti alur Recovery-mode Apple untuk Mac Anda guna menonaktifkan SIP sebelum menjalankan `imsg launch`.

3. **Suntikkan helper.** Dengan SIP dinonaktifkan dan Messages.app sudah masuk:

   ```bash
   imsg launch
   ```

   `imsg launch` menolak menyuntik saat SIP masih diaktifkan, jadi ini juga berfungsi sebagai konfirmasi bahwa langkah 2 berhasil.

4. **Verifikasi bridge dari OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Entri iMessage harus melaporkan `works`, dan `imsg status --json | jq '.selectors'` harus menampilkan `retractMessagePart: true` plus selector edit / typing / read apa pun yang diekspos build macOS Anda. Gating per metode Plugin OpenClaw di `actions.ts` hanya mengiklankan tindakan yang selector dasarnya bernilai `true`, sehingga permukaan tindakan yang Anda lihat di daftar alat agent mencerminkan apa yang benar-benar dapat dilakukan bridge pada host ini.

Jika `openclaw channels status --probe` melaporkan channel sebagai `works` tetapi tindakan tertentu melempar "iMessage `<action>` requires the imsg private API bridge" pada waktu dispatch, jalankan `imsg launch` lagi — helper dapat terlepas (restart Messages.app, pembaruan OS, dll.) dan status cache `available: true` akan terus mengiklankan tindakan sampai probe berikutnya menyegarkan.

### Saat Anda tidak dapat menonaktifkan SIP

Jika SIP yang dinonaktifkan tidak dapat diterima untuk model ancaman Anda:

- `imsg` kembali ke mode dasar — hanya teks + media + penerimaan.
- Plugin OpenClaw tetap mengiklankan pengiriman teks/media dan pemantauan masuk; hanya menyembunyikan `react`, `edit`, `unsend`, `reply`, `sendWithEffect`, dan group ops dari permukaan tindakan (sesuai gate kapabilitas per metode).
- Anda dapat menjalankan Mac non-Apple-Silicon terpisah (atau Mac bot khusus) dengan SIP mati untuk beban kerja iMessage, sambil menjaga SIP tetap aktif di perangkat utama Anda. Lihat [Pengguna macOS bot khusus (identitas iMessage terpisah)](#deployment-patterns) di bawah.

## Kontrol akses dan routing

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.imessage.dmPolicy` mengontrol pesan langsung:

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `allowFrom` menyertakan `"*"`)
    - `disabled`

    Field allowlist: `channels.imessage.allowFrom`.

    Entri allowlist dapat berupa handle, grup akses pengirim statis (`accessGroup:<name>`), atau target chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Kebijakan grup + mention">
    `channels.imessage.groupPolicy` mengontrol penanganan grup:

    - `allowlist` (default saat dikonfigurasi)
    - `open`
    - `disabled`

    Allowlist pengirim grup: `channels.imessage.groupAllowFrom`.

    Entri `groupAllowFrom` juga dapat mereferensikan grup akses pengirim statis (`accessGroup:<name>`).

    Fallback runtime: jika `groupAllowFrom` tidak disetel, pemeriksaan pengirim grup iMessage kembali ke `allowFrom` saat tersedia.
    Catatan runtime: jika `channels.imessage` sepenuhnya tidak ada, runtime kembali ke `groupPolicy="allowlist"` dan mencatat warning (meski `channels.defaults.groupPolicy` disetel).

    <Warning>
    Routing grup memiliki **dua** gate allowlist yang berjalan berurutan, dan keduanya harus lolos:

    1. **Allowlist pengirim / target chat** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier`, atau `chat_id`.
    2. **Registry grup** (`channels.imessage.groups`) — dengan `groupPolicy: "allowlist"`, gate ini memerlukan entri wildcard `groups: { "*": { ... } }` (menyetel `allowAll = true`), atau entri eksplisit per-`chat_id` di bawah `groups`.

    Jika gate 2 tidak berisi apa pun, setiap pesan grup akan dijatuhkan. Plugin memancarkan dua sinyal level `warn` pada level log default:

    - satu kali per akun saat startup: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - satu kali per `chat_id` saat runtime: `imessage: dropping group message from chat_id=<id> ...`

    DM tetap berfungsi karena mengambil jalur kode yang berbeda.

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

    Jika baris `warn` tersebut muncul di log Gateway, gate 2 menjatuhkan pesan — tambahkan blok `groups`.
    </Warning>

    Sebutkan gating untuk grup:

    - iMessage tidak memiliki metadata mention native
    - deteksi mention menggunakan pola regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - tanpa pola yang dikonfigurasi, mention gating tidak dapat diberlakukan

    Perintah kontrol dari pengirim terotorisasi dapat melewati mention gating di grup.

    `systemPrompt` per grup:

    Setiap entri di bawah `channels.imessage.groups.*` menerima string `systemPrompt` opsional. Nilainya disuntikkan ke system prompt agen pada setiap giliran yang menangani pesan di grup tersebut. Resolusi mencerminkan resolusi prompt per grup yang digunakan oleh `channels.whatsapp.groups`:

    1. **System prompt khusus grup** (`groups["<chat_id>"].systemPrompt`): digunakan ketika entri grup spesifik ada di map **dan** kunci `systemPrompt`-nya didefinisikan. Jika `systemPrompt` adalah string kosong (`""`), wildcard ditekan dan tidak ada system prompt yang diterapkan ke grup tersebut.
    2. **System prompt wildcard grup** (`groups["*"].systemPrompt`): digunakan ketika entri grup spesifik sama sekali tidak ada di map, atau ketika entri itu ada tetapi tidak mendefinisikan kunci `systemPrompt`.

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

  <Tab title="Sesi dan balasan deterministik">
    - DM menggunakan perutean langsung; grup menggunakan perutean grup.
    - Dengan default `session.dmScope=main`, DM iMessage digabungkan ke sesi utama agen.
    - Sesi grup diisolasi (`agent:<agentId>:imessage:group:<chat_id>`).
    - Balasan dirutekan kembali ke iMessage menggunakan metadata channel/target asal.

    Perilaku thread mirip grup:

    Beberapa thread iMessage dengan banyak peserta dapat tiba dengan `is_group=false`.
    Jika `chat_id` tersebut dikonfigurasi secara eksplisit di bawah `channels.imessage.groups`, OpenClaw memperlakukannya sebagai traffic grup (gating grup + isolasi sesi grup).

  </Tab>
</Tabs>

## Binding percakapan ACP

Chat iMessage lama juga dapat diikat ke sesi ACP.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM atau chat grup yang diizinkan.
- Pesan berikutnya dalam percakapan iMessage yang sama dirutekan ke sesi ACP yang dibuat.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus binding.

Binding persisten yang dikonfigurasi didukung melalui entri tingkat atas `bindings[]` dengan `type: "acp"` dan `match.channel: "imessage"`.

`match.peer.id` dapat menggunakan:

- handle DM ternormalisasi seperti `+15555550123` atau `user@example.com`
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
  <Accordion title="Pengguna macOS bot khusus (identitas iMessage terpisah)">
    Gunakan Apple ID dan pengguna macOS khusus agar traffic bot terisolasi dari profil Messages pribadi Anda.

    Alur umum:

    1. Buat/masuk ke pengguna macOS khusus.
    2. Masuk ke Messages dengan Apple ID bot di pengguna tersebut.
    3. Instal `imsg` di pengguna tersebut.
    4. Buat wrapper SSH agar OpenClaw dapat menjalankan `imsg` dalam konteks pengguna tersebut.
    5. Arahkan `channels.imessage.accounts.<id>.cliPath` dan `.dbPath` ke profil pengguna tersebut.

    Eksekusi pertama mungkin memerlukan persetujuan GUI (Automation + Full Disk Access) dalam sesi pengguna bot tersebut.

  </Accordion>

  <Accordion title="Mac jarak jauh melalui Tailscale (contoh)">
    Topologi umum:

    - gateway berjalan di Linux/VM
    - iMessage + `imsg` berjalan di Mac dalam tailnet Anda
    - wrapper `cliPath` menggunakan SSH untuk menjalankan `imsg`
    - `remoteHost` mengaktifkan pengambilan lampiran lewat SCP

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
    Pastikan host key dipercaya terlebih dahulu (misalnya `ssh bot@mac-mini.tailnet-1234.ts.net`) agar `known_hosts` terisi.

  </Accordion>

  <Accordion title="Pola multi-akun">
    iMessage mendukung konfigurasi per akun di bawah `channels.imessage.accounts`.

    Setiap akun dapat mengganti field seperti `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, pengaturan riwayat, dan allowlist root lampiran.

  </Accordion>
</AccordionGroup>

## Media, chunking, dan target pengiriman

<AccordionGroup>
  <Accordion title="Lampiran dan media">
    - ingest lampiran masuk **nonaktif secara default** — setel `channels.imessage.includeAttachments: true` untuk meneruskan foto, memo suara, video, dan lampiran lain ke agen. Jika dinonaktifkan, iMessage yang hanya berisi lampiran dijatuhkan sebelum mencapai agen dan mungkin sama sekali tidak menghasilkan baris log `Inbound message`.
    - path lampiran jarak jauh dapat diambil melalui SCP ketika `remoteHost` disetel
    - path lampiran harus cocok dengan root yang diizinkan:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (mode SCP jarak jauh)
      - pola root default: `/Users/*/Library/Messages/Attachments`
    - SCP menggunakan pemeriksaan host-key ketat (`StrictHostKeyChecking=yes`)
    - ukuran media keluar menggunakan `channels.imessage.mediaMaxMb` (default 16 MB)

  </Accordion>

  <Accordion title="Chunking keluar">
    - batas chunk teks: `channels.imessage.textChunkLimit` (default 4000)
    - mode chunk: `channels.imessage.chunkMode`
      - `length` (default)
      - `newline` (pemecahan dengan paragraf lebih dulu)

  </Accordion>

  <Accordion title="Format pengalamatan">
    Target eksplisit yang disarankan:

    - `chat_id:123` (direkomendasikan untuk perutean yang stabil)
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

## Tindakan Private API

Ketika `imsg launch` berjalan dan `openclaw channels status --probe` melaporkan `privateApi.available: true`, tool pesan dapat menggunakan tindakan native iMessage selain pengiriman teks normal.

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
    - **react**: Tambahkan/hapus tapback iMessage (`messageId`, `emoji`, `remove`). Tapback yang didukung dipetakan ke love, like, dislike, laugh, emphasize, dan question.
    - **reply**: Kirim balasan ber-thread ke pesan yang ada (`messageId`, `text` atau `message`, ditambah `chatGuid`, `chatId`, `chatIdentifier`, atau `to`).
    - **sendWithEffect**: Kirim teks dengan efek iMessage (`text` atau `message`, `effect` atau `effectId`).
    - **edit**: Edit pesan terkirim pada versi macOS/private API yang didukung (`messageId`, `text` atau `newText`).
    - **unsend**: Tarik kembali pesan terkirim pada versi macOS/private API yang didukung (`messageId`).
    - **upload-file**: Kirim media/file (`buffer` sebagai base64 atau `media`/`path`/`filePath` yang telah dihidrasi, `filename`, opsional `asVoice`). Alias lama: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Kelola chat grup ketika target saat ini adalah percakapan grup.

  </Accordion>

  <Accordion title="ID pesan">
    Konteks iMessage masuk menyertakan nilai `MessageSid` pendek dan GUID pesan penuh jika tersedia. ID pendek tercakup pada cache balasan dalam memori terbaru dan diperiksa terhadap chat saat ini sebelum digunakan. Jika ID pendek telah kedaluwarsa atau milik chat lain, coba lagi dengan `MessageSidFull` penuh.

  </Accordion>

  <Accordion title="Deteksi kapabilitas">
    OpenClaw menyembunyikan tindakan private API hanya ketika status probe yang di-cache menyatakan bridge tidak tersedia. Jika status tidak diketahui, tindakan tetap terlihat dan dispatch melakukan probe secara lazy agar tindakan pertama dapat berhasil setelah `imsg launch` tanpa refresh status manual terpisah.

  </Accordion>

  <Accordion title="Tanda dibaca dan mengetik">
    Ketika bridge private API aktif, chat masuk yang diterima ditandai dibaca sebelum dispatch dan gelembung mengetik ditampilkan kepada pengirim saat agen menghasilkan balasan. Nonaktifkan penandaan dibaca dengan:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Build `imsg` lama yang mendahului daftar kapabilitas per metode akan menonaktifkan typing/read secara diam-diam; OpenClaw mencatat peringatan satu kali per restart agar receipt yang hilang dapat ditelusuri.

  </Accordion>

  <Accordion title="Tapback masuk">
    OpenClaw berlangganan tapback iMessage dan merutekan reaksi yang diterima sebagai event sistem, bukan teks pesan normal, sehingga tapback pengguna tidak memicu loop balasan biasa.

    Mode notifikasi dikontrol oleh `channels.imessage.reactionNotifications`:

    - `"own"` (default): beri tahu hanya ketika pengguna bereaksi terhadap pesan yang dibuat bot.
    - `"all"`: beri tahu untuk semua tapback masuk dari pengirim terotorisasi.
    - `"off"`: abaikan tapback masuk.

    Override per akun menggunakan `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>
</AccordionGroup>

## Penulisan konfigurasi

iMessage mengizinkan penulisan konfigurasi yang diinisiasi channel secara default (untuk `/config set|unset` ketika `commands.config: true`).

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

Ketika pengguna mengetik perintah dan URL bersama — misalnya `Dump https://example.com/article` — aplikasi Messages Apple memecah pengiriman menjadi **dua baris `chat.db` terpisah**:

1. Pesan teks (`"Dump"`).
2. Balon pratinjau URL (`"https://..."`) dengan gambar pratinjau OG sebagai lampiran.

Kedua baris tiba di OpenClaw dengan jarak ~0,8-2,0 dtk pada sebagian besar setup. Tanpa penggabungan, agen menerima perintah saja pada giliran 1, membalas (sering kali "kirim URL-nya"), dan baru melihat URL pada giliran 2 — saat konteks perintah sudah hilang. Ini adalah pipeline pengiriman Apple, bukan sesuatu yang diperkenalkan OpenClaw atau `imsg`.

`channels.imessage.coalesceSameSenderDms` mengikutsertakan DM untuk menggabungkan baris berurutan dari pengirim yang sama menjadi satu giliran agen. Chat grup tetap dikirim per pesan agar struktur giliran multi-pengguna tetap dipertahankan.

<Tabs>
  <Tab title="Kapan mengaktifkan">
    Aktifkan ketika:

    - Anda mengirimkan skills yang mengharapkan `command + payload` dalam satu pesan (dump, paste, save, queue, dll.).
    - Pengguna Anda menempelkan URL, gambar, atau konten panjang bersama perintah.
    - Anda dapat menerima latensi giliran DM tambahan (lihat di bawah).

    Biarkan nonaktif ketika:

    - Anda memerlukan latensi perintah minimum untuk pemicu DM satu kata.
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

    Dengan flag aktif dan tanpa `messages.inbound.byChannel.imessage` eksplisit, jendela debounce melebar menjadi **2500 ms** (default lama adalah 0 ms — tanpa debouncing). Jendela yang lebih lebar diperlukan karena ritme kirim-terpisah Apple sebesar 0.8-2.0 d tidak cocok dengan default yang lebih ketat.

    Untuk menyetel jendela sendiri:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is
            // slow or under memory pressure (observed gap can stretch past 2 s
            // then).
            imessage: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-off">
    - **Latensi tambahan untuk pesan DM.** Dengan flag aktif, setiap DM (termasuk perintah kontrol mandiri dan tindak lanjut teks tunggal) menunggu hingga jendela debounce sebelum dikirim, untuk berjaga-jaga jika baris payload akan datang. Pesan chat grup tetap dikirim seketika.
    - **Output gabungan dibatasi.** Teks gabungan dibatasi pada 4000 karakter dengan penanda `…[truncated]` eksplisit; lampiran dibatasi 20; entri sumber dibatasi 10 (pertama-plus-terbaru dipertahankan setelah itu). Setiap GUID sumber dilacak di `coalescedMessageGuids` untuk telemetri downstream.
    - **Hanya DM.** Chat grup diteruskan ke pengiriman per pesan agar bot tetap responsif ketika beberapa orang sedang mengetik.
    - **Opt-in, per-channel.** Channel lain (Telegram, WhatsApp, Slack, …) tidak terpengaruh. Konfigurasi lama BlueBubbles yang menetapkan `channels.bluebubbles.coalesceSameSenderDms` harus memigrasikan nilai tersebut ke `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Skenario dan apa yang dilihat agen

| Pengguna menyusun                                                  | `chat.db` menghasilkan | Flag nonaktif (default)                  | Flag aktif + jendela 2500 ms                                             |
| ------------------------------------------------------------------ | ---------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `Dump https://example.com` (satu pengiriman)                       | 2 baris selang ~1 d    | Dua giliran agen: "Dump" saja, lalu URL  | Satu giliran: teks gabungan `Dump https://example.com`                   |
| `Save this 📎image.jpg caption` (lampiran + teks)                  | 2 baris                | Dua giliran (lampiran hilang saat merge) | Satu giliran: teks + gambar dipertahankan                                |
| `/status` (perintah mandiri)                                       | 1 baris                | Pengiriman seketika                      | **Tunggu hingga jendela, lalu kirim**                                    |
| URL ditempelkan sendiri                                            | 1 baris                | Pengiriman seketika                      | Pengiriman seketika (hanya satu entri dalam bucket)                      |
| Teks + URL dikirim sebagai dua pesan terpisah yang disengaja, berselang menit | 2 baris di luar jendela | Dua giliran                              | Dua giliran (jendela kedaluwarsa di antaranya)                           |
| Banjir cepat (>10 DM kecil dalam jendela)                          | N baris                | N giliran                                | Satu giliran, output terbatas (pertama + terbaru, batas teks/lampiran diterapkan) |
| Dua orang mengetik di chat grup                                    | N baris dari M pengirim | M+ giliran (satu per bucket pengirim)    | M+ giliran — chat grup tidak digabungkan                                 |

## Mengejar setelah Gateway downtime

Ketika Gateway offline (crash, restart, Mac tidur, mesin mati), `imsg watch` melanjutkan dari status `chat.db` saat ini setelah Gateway kembali aktif — apa pun yang tiba selama jeda, secara default, tidak pernah terlihat. Catchup memutar ulang pesan-pesan tersebut pada startup berikutnya sehingga agen tidak melewatkan traffic inbound secara diam-diam.

Catchup **dinonaktifkan secara default**. Aktifkan per channel:

```ts
channels: {
  imessage: {
    catchup: {
      enabled: true,             // master switch (default: false)
      maxAgeMinutes: 120,        // skip rows older than now - 2h (default: 120, clamp 1..720)
      perRunLimit: 50,           // max rows replayed per startup (default: 50, clamp 1..500)
      firstRunLookbackMinutes: 30, // first run with no cursor: look back 30 min (default: 30)
      maxFailureRetries: 10,     // give up on a wedged guid after 10 dispatch failures (default: 10)
    },
  },
}
```

### Cara kerjanya

Satu pass per startup `monitorIMessageProvider`, diurutkan sebagai `imsg launch` siap → `watch.subscribe` → `performIMessageCatchup` → loop pengiriman live. Catchup sendiri menggunakan `chats.list` + `messages.history` per-chat terhadap klien JSON-RPC yang sama dengan yang digunakan oleh `imsg watch`. Apa pun yang tiba selama pass catchup mengalir melalui pengiriman live seperti biasa; cache inbound-dedupe yang ada menyerap overlap apa pun dengan baris yang diputar ulang.

Setiap baris yang diputar ulang dimasukkan melalui jalur pengiriman live (`evaluateIMessageInbound` + `dispatchInboundMessage`), sehingga allowlist, kebijakan grup, debouncer, cache echo, dan tanda terima baca berperilaku identik pada pesan yang diputar ulang dan pesan live.

### Semantik cursor dan retry

Catchup menyimpan cursor per akun di `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (direktori status OpenClaw default ke `~/.openclaw`, dapat dioverride dengan `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- Cursor maju pada setiap pengiriman yang berhasil dan ditahan ketika pengiriman sebuah baris melempar error — startup berikutnya mencoba ulang baris yang sama dari cursor yang ditahan.
- Setelah `maxFailureRetries` lemparan berurutan terhadap `guid` yang sama, catchup mencatat `warn` dan memaksa cursor maju melewati pesan yang macet agar startup berikutnya dapat terus berjalan.
- GUID yang sudah diserahkan dilewati saat terlihat (tanpa upaya pengiriman) pada run berikutnya dan dihitung di bawah `skippedGivenUp` dalam ringkasan run.

### Sinyal yang terlihat operator

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Baris `WARN ... capped to perRunLimit` berarti satu startup tidak mengosongkan seluruh backlog. Naikkan `perRunLimit` (maks 500) jika jeda Anda secara rutin melebihi pass default 50 baris.

### Kapan membiarkannya nonaktif

- Gateway berjalan terus-menerus dengan watchdog auto-restart dan jeda selalu < beberapa detik — default nonaktif sudah memadai.
- Volume DM rendah dan pesan yang terlewat tidak akan mengubah perilaku agen — jendela awal `firstRunLookbackMinutes` dapat mengirim konteks lama yang mengejutkan saat pertama kali diaktifkan.

Saat Anda mengaktifkan catchup, startup pertama tanpa cursor hanya melihat mundur `firstRunLookbackMinutes` (default 30 menit), bukan seluruh jendela `maxAgeMinutes` — ini menghindari pemutaran ulang riwayat panjang pesan sebelum diaktifkan.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="imsg tidak ditemukan atau RPC tidak didukung">
    Validasi binary dan dukungan RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Jika probe melaporkan RPC tidak didukung, perbarui `imsg`. Jika tindakan API privat tidak tersedia, jalankan `imsg launch` dalam sesi pengguna macOS yang sedang login dan probe lagi. Jika Gateway tidak berjalan di macOS, gunakan pengaturan Remote Mac melalui SSH di atas, bukan path `imsg` lokal default.

  </Accordion>

  <Accordion title="Gateway tidak berjalan di macOS">
    `cliPath: "imsg"` default harus berjalan di Mac yang masuk ke Messages. Di Linux atau Windows, atur `channels.imessage.cliPath` ke skrip wrapper yang SSH ke Mac tersebut dan menjalankan `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Lalu jalankan:

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
    - perilaku allowlist `channels.imessage.groups`
    - konfigurasi pola mention (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Lampiran jarak jauh gagal">
    Periksa:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - auth kunci SSH/SCP dari host Gateway
    - kunci host ada di `~/.ssh/known_hosts` pada host Gateway
    - keterbacaan path jarak jauh pada Mac yang menjalankan Messages

  </Accordion>

  <Accordion title="Prompt izin macOS terlewat">
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

- [Ringkasan Channel](/id/channels) — semua channel yang didukung
- [Penghapusan BlueBubbles dan path imsg iMessage](/id/announcements/bluebubbles-imessage) — pengumuman dan ringkasan migrasi
- [Beralih dari BlueBubbles](/id/channels/imessage-from-bluebubbles) — tabel terjemahan konfigurasi dan cutover langkah demi langkah
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku chat grup dan gating mention
- [Routing Channel](/id/channels/channel-routing) — routing sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
