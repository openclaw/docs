---
read_when:
    - Menyiapkan dukungan iMessage
    - Pemecahan masalah pengiriman/penerimaan iMessage
summary: Dukungan iMessage native melalui imsg (JSON-RPC melalui stdio), dengan aksi API privat untuk balasan, tapback, efek, lampiran, dan pengelolaan grup. Disarankan untuk penyiapan iMessage OpenClaw baru ketika persyaratan host sesuai.
title: iMessage
x-i18n:
    generated_at: "2026-05-11T20:20:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbce499e35c3dac12e6bb3f157d624a02a9bc8c26356f3decdfe62c85db6ee15
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Untuk deployment OpenClaw iMessage, gunakan `imsg` pada host macOS Messages yang sudah masuk. Jika Gateway Anda berjalan di Linux atau Windows, arahkan `channels.imessage.cliPath` ke wrapper SSH yang menjalankan `imsg` di Mac.

**Pengejaran ketertinggalan saat waktu henti Gateway harus diaktifkan secara eksplisit.** Saat diaktifkan (`channels.imessage.catchup.enabled: true`), Gateway memutar ulang pesan masuk yang mendarat di `chat.db` saat offline (crash, restart, Mac sleep) pada startup berikutnya. Nonaktif secara default; lihat [Mengejar ketertinggalan setelah waktu henti Gateway](#catching-up-after-gateway-downtime). Menutup [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
Dukungan BlueBubbles telah dihapus. Migrasikan konfigurasi `channels.bluebubbles` ke `channels.imessage`; OpenClaw mendukung iMessage hanya melalui `imsg`. Mulai dengan [Penghapusan BlueBubbles dan jalur iMessage imsg](/id/announcements/bluebubbles-imessage) untuk pengumuman singkat, atau [Beralih dari BlueBubbles](/id/channels/imessage-from-bluebubbles) untuk tabel migrasi lengkap.
</Warning>

Status: integrasi CLI eksternal native. Gateway memulai `imsg rpc` dan berkomunikasi melalui JSON-RPC di stdio (tanpa daemon/port terpisah). Tindakan lanjutan memerlukan `imsg launch` dan probe API privat yang berhasil.

<CardGroup cols={3}>
  <Card title="Tindakan API privat" icon="wand-sparkles" href="#private-api-actions">
    Balasan, tapback, efek, lampiran, dan manajemen grup.
  </Card>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    DM iMessage secara default menggunakan mode pemasangan.
  </Card>
  <Card title="Mac jarak jauh" icon="terminal" href="#remote-mac-over-ssh">
    Gunakan wrapper SSH saat Gateway tidak berjalan di Mac Messages.
  </Card>
  <Card title="Referensi konfigurasi" icon="settings" href="/id/gateway/config-channels#imessage">
    Referensi lengkap kolom iMessage.
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

      <Step title="Konfigurasi OpenClaw">

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
    OpenClaw menggunakan pemeriksaan kunci host ketat untuk SCP, jadi kunci host relay harus sudah ada di `~/.ssh/known_hosts`.
    Jalur lampiran divalidasi terhadap root yang diizinkan (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Persyaratan dan izin (macOS)

- Messages harus sudah masuk di Mac yang menjalankan `imsg`.
- Full Disk Access diperlukan untuk konteks proses yang menjalankan OpenClaw/`imsg` (akses DB Messages).
- Izin Automation diperlukan untuk mengirim pesan melalui Messages.app.
- Untuk tindakan lanjutan (react / edit / unsend / balasan berutas / efek / operasi grup), System Integrity Protection harus dinonaktifkan — lihat [Mengaktifkan API privat imsg](#enabling-the-imsg-private-api) di bawah. Pengiriman/penerimaan teks dan media dasar berfungsi tanpanya.

<Tip>
Izin diberikan per konteks proses. Jika Gateway berjalan tanpa antarmuka (LaunchAgent/SSH), jalankan perintah interaktif satu kali dalam konteks yang sama untuk memicu prompt:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Mengaktifkan API privat imsg

`imsg` tersedia dalam dua mode operasional:

- **Mode dasar** (default, tidak perlu perubahan SIP): teks dan media keluar melalui `send`, pemantauan/riwayat masuk, daftar chat. Inilah yang Anda dapatkan langsung dari instalasi baru `brew install steipete/tap/imsg` plus izin macOS standar di atas.
- **Mode API privat**: `imsg` menyuntikkan dylib pembantu ke `Messages.app` untuk memanggil fungsi internal `IMCore`. Inilah yang membuka akses ke `react`, `edit`, `unsend`, `reply` (berutas), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, plus indikator mengetik dan tanda sudah dibaca.

Untuk mengakses kumpulan tindakan lanjutan yang didokumentasikan halaman channel ini, Anda memerlukan mode API Privat. README `imsg` eksplisit tentang persyaratan tersebut:

> Fitur lanjutan seperti `read`, `typing`, `launch`, pengiriman kaya berbasis bridge, mutasi pesan, dan manajemen chat harus diaktifkan secara eksplisit. Fitur tersebut memerlukan SIP dinonaktifkan dan dylib pembantu disuntikkan ke `Messages.app`. `imsg launch` menolak menyuntikkan saat SIP diaktifkan.

Teknik injeksi helper menggunakan dylib milik `imsg` sendiri untuk menjangkau API privat Messages. Tidak ada server pihak ketiga atau runtime BlueBubbles di jalur OpenClaw iMessage.

<Warning>
**Menonaktifkan SIP adalah kompromi keamanan nyata.** SIP adalah salah satu perlindungan inti macOS terhadap eksekusi kode sistem yang dimodifikasi; mematikannya di seluruh sistem membuka permukaan serangan tambahan dan efek samping. Khususnya, **menonaktifkan SIP di Mac Apple Silicon juga menonaktifkan kemampuan untuk menginstal dan menjalankan aplikasi iOS di Mac Anda**.

Perlakukan ini sebagai pilihan operasional yang disengaja, bukan default. Jika model ancaman Anda tidak dapat menoleransi SIP yang mati, iMessage bawaan terbatas pada mode dasar — hanya pengiriman/penerimaan teks dan media, tanpa reaksi / edit / batal kirim / efek / operasi grup.
</Warning>

### Penyiapan

1. **Instal (atau tingkatkan) `imsg`** di Mac yang menjalankan Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Output `imsg status --json` melaporkan `bridge_version`, `rpc_methods`, dan `selectors` per metode sehingga Anda dapat melihat apa yang didukung build saat ini sebelum mulai.

2. **Nonaktifkan System Integrity Protection.** Ini spesifik versi macOS karena persyaratan Apple yang mendasarinya bergantung pada OS dan perangkat keras:
   - **macOS 10.13–10.15 (Sierra–Catalina):** nonaktifkan Library Validation melalui Terminal, boot ulang ke Recovery Mode, jalankan `csrutil disable`, restart.
   - **macOS 11+ (Big Sur dan lebih baru), Intel:** Recovery Mode (atau Internet Recovery), `csrutil disable`, restart.
   - **macOS 11+, Apple Silicon:** urutan startup tombol daya untuk masuk ke Recovery; pada versi macOS terbaru tahan tombol **Left Shift** saat Anda mengklik Continue, lalu `csrutil disable`. Penyiapan mesin virtual mengikuti alur terpisah — ambil snapshot VM terlebih dahulu.
   - **macOS 26 / Tahoe:** kebijakan validasi library dan pemeriksaan entitlement privat `imagent` semakin diperketat; `imsg` mungkin memerlukan build yang diperbarui agar tetap sesuai. Jika injeksi `imsg launch` atau `selectors` tertentu mulai mengembalikan false setelah peningkatan mayor macOS, periksa catatan rilis `imsg` sebelum menganggap langkah SIP berhasil.

   Ikuti alur Recovery Mode Apple untuk Mac Anda guna menonaktifkan SIP sebelum menjalankan `imsg launch`.

3. **Suntikkan helper.** Dengan SIP dinonaktifkan dan Messages.app sudah masuk:

   ```bash
   imsg launch
   ```

   `imsg launch` menolak menyuntikkan saat SIP masih diaktifkan, sehingga ini juga berfungsi sebagai konfirmasi bahwa langkah 2 berhasil diterapkan.

4. **Verifikasi bridge dari OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Entri iMessage seharusnya melaporkan `works`, dan `imsg status --json | jq '.selectors'` seharusnya menampilkan `retractMessagePart: true` plus selector edit / mengetik / baca mana pun yang diekspos build macOS Anda. Gate per metode Plugin OpenClaw di `actions.ts` hanya menampilkan tindakan yang selector dasarnya bernilai `true`, sehingga kumpulan tindakan yang Anda lihat di daftar alat agen mencerminkan apa yang benar-benar dapat dilakukan bridge di host ini.

Jika `openclaw channels status --probe` melaporkan channel sebagai `works` tetapi tindakan tertentu melempar "iMessage `<action>` requires the imsg private API bridge" saat dispatch, jalankan `imsg launch` lagi — helper dapat terlepas (restart Messages.app, pembaruan OS, dll.) dan status cache `available: true` akan terus menampilkan tindakan hingga probe berikutnya menyegarkan.

### Saat Anda tidak dapat menonaktifkan SIP

Jika SIP yang dinonaktifkan tidak dapat diterima untuk model ancaman Anda:

- `imsg` beralih kembali ke mode dasar — hanya teks + media + penerimaan.
- Plugin OpenClaw tetap menampilkan pengiriman teks/media dan pemantauan masuk; hanya menyembunyikan `react`, `edit`, `unsend`, `reply`, `sendWithEffect`, dan operasi grup dari kumpulan tindakan (sesuai gate kapabilitas per metode).
- Anda dapat menjalankan Mac non-Apple-Silicon terpisah (atau Mac bot khusus) dengan SIP mati untuk beban kerja iMessage, sambil tetap mengaktifkan SIP di perangkat utama Anda. Lihat [Pengguna macOS bot khusus (identitas iMessage terpisah)](#deployment-patterns) di bawah.

## Kontrol akses dan perutean

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.imessage.dmPolicy` mengontrol pesan langsung:

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `allowFrom` menyertakan `"*"`)
    - `disabled`

    Kolom allowlist: `channels.imessage.allowFrom`.

    Entri allowlist dapat berupa handle, grup akses pengirim statis (`accessGroup:<name>`), atau target chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Kebijakan grup + sebutan">
    `channels.imessage.groupPolicy` mengontrol penanganan grup:

    - `allowlist` (default saat dikonfigurasi)
    - `open`
    - `disabled`

    Allowlist pengirim grup: `channels.imessage.groupAllowFrom`.

    Entri `groupAllowFrom` juga dapat merujuk ke grup akses pengirim statis (`accessGroup:<name>`).

    Fallback runtime: jika `groupAllowFrom` tidak diatur, pemeriksaan pengirim grup iMessage beralih ke `allowFrom` saat tersedia.
    Catatan runtime: jika `channels.imessage` sepenuhnya tidak ada, runtime beralih ke `groupPolicy="allowlist"` dan mencatat peringatan (meskipun `channels.defaults.groupPolicy` diatur).

    <Warning>
    Perutean grup memiliki **dua** gate allowlist yang berjalan berurutan, dan keduanya harus lolos:

    1. **Allowlist pengirim / target chat** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier`, atau `chat_id`.
    2. **Registri grup** (`channels.imessage.groups`) — dengan `groupPolicy: "allowlist"`, gate ini memerlukan entri wildcard `groups: { "*": { ... } }` (mengatur `allowAll = true`), atau entri eksplisit per-`chat_id` di bawah `groups`.

    Jika gate 2 kosong, setiap pesan grup akan dibuang. Plugin memancarkan dua sinyal level `warn` pada level log default:

    - satu kali per akun saat startup: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - satu kali per `chat_id` saat runtime: `imessage: dropping group message from chat_id=<id> ...`

    DM tetap berfungsi karena mengambil jalur kode yang berbeda.

    Konfigurasi minimum agar pesan grup tetap berjalan di bawah `groupPolicy: "allowlist"`:

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

    Jika baris `warn` tersebut muncul di log gateway, gerbang 2 sedang gagal — tambahkan blok `groups`.
    </Warning>

    Sebutkan gating untuk grup:

    - iMessage tidak memiliki metadata mention native
    - deteksi mention menggunakan pola regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - tanpa pola yang dikonfigurasi, gating mention tidak dapat ditegakkan

    Perintah kontrol dari pengirim yang diotorisasi dapat melewati gating mention di grup.

    `systemPrompt` per grup:

    Setiap entri di bawah `channels.imessage.groups.*` menerima string `systemPrompt` opsional. Nilainya disisipkan ke prompt sistem agen pada setiap giliran yang menangani pesan di grup tersebut. Resolusi mencerminkan resolusi prompt per grup yang digunakan oleh `channels.whatsapp.groups`:

    1. **Prompt sistem khusus grup** (`groups["<chat_id>"].systemPrompt`): digunakan ketika entri grup tertentu ada di map **dan** kunci `systemPrompt`-nya didefinisikan. Jika `systemPrompt` adalah string kosong (`""`) wildcard ditekan dan tidak ada prompt sistem yang diterapkan ke grup tersebut.
    2. **Prompt sistem wildcard grup** (`groups["*"].systemPrompt`): digunakan ketika entri grup tertentu sama sekali tidak ada dari map, atau ketika entri tersebut ada tetapi tidak mendefinisikan kunci `systemPrompt`.

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
    - DM menggunakan perutean langsung; grup menggunakan perutean grup.
    - Dengan `session.dmScope=main` default, DM iMessage digabungkan ke sesi utama agen.
    - Sesi grup diisolasi (`agent:<agentId>:imessage:group:<chat_id>`).
    - Balasan dirutekan kembali ke iMessage menggunakan metadata channel/target asal.

    Perilaku utas mirip grup:

    Beberapa utas iMessage dengan banyak peserta dapat tiba dengan `is_group=false`.
    Jika `chat_id` tersebut dikonfigurasi secara eksplisit di bawah `channels.imessage.groups`, OpenClaw memperlakukannya sebagai traffic grup (gating grup + isolasi sesi grup).

  </Tab>
</Tabs>

## Binding percakapan ACP

Chat iMessage lama juga dapat diikat ke sesi ACP.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM atau chat grup yang diizinkan.
- Pesan berikutnya dalam percakapan iMessage yang sama dirutekan ke sesi ACP yang di-spawn.
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
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Gunakan Apple ID dan pengguna macOS khusus agar traffic bot terisolasi dari profil Messages pribadi Anda.

    Alur umum:

    1. Buat/masuk ke pengguna macOS khusus.
    2. Masuk ke Messages dengan Apple ID bot pada pengguna tersebut.
    3. Instal `imsg` pada pengguna tersebut.
    4. Buat wrapper SSH agar OpenClaw dapat menjalankan `imsg` dalam konteks pengguna tersebut.
    5. Arahkan `channels.imessage.accounts.<id>.cliPath` dan `.dbPath` ke profil pengguna tersebut.

    Jalankan pertama kali mungkin memerlukan persetujuan GUI (Automation + Full Disk Access) dalam sesi pengguna bot tersebut.

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

    Gunakan kunci SSH agar SSH dan SCP sama-sama non-interaktif.
    Pastikan kunci host dipercaya terlebih dahulu (misalnya `ssh bot@mac-mini.tailnet-1234.ts.net`) agar `known_hosts` terisi.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage mendukung konfigurasi per akun di bawah `channels.imessage.accounts`.

    Setiap akun dapat menimpa field seperti `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, pengaturan riwayat, dan allowlist root lampiran.

  </Accordion>
</AccordionGroup>

## Media, chunking, dan target pengiriman

<AccordionGroup>
  <Accordion title="Attachments and media">
    - penyerapan lampiran masuk **nonaktif secara default** — atur `channels.imessage.includeAttachments: true` untuk meneruskan foto, memo suara, video, dan lampiran lain ke agen. Jika dinonaktifkan, iMessage yang hanya berisi lampiran dibuang sebelum mencapai agen dan mungkin sama sekali tidak menghasilkan baris log `Inbound message`.
    - path lampiran remote dapat diambil melalui SCP ketika `remoteHost` diatur
    - path lampiran harus cocok dengan root yang diizinkan:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (mode SCP remote)
      - pola root default: `/Users/*/Library/Messages/Attachments`
    - SCP menggunakan pemeriksaan kunci host ketat (`StrictHostKeyChecking=yes`)
    - ukuran media keluar menggunakan `channels.imessage.mediaMaxMb` (default 16 MB)

  </Accordion>

  <Accordion title="Outbound chunking">
    - batas chunk teks: `channels.imessage.textChunkLimit` (default 4000)
    - mode chunk: `channels.imessage.chunkMode`
      - `length` (default)
      - `newline` (pemecahan dengan paragraf terlebih dahulu)

  </Accordion>

  <Accordion title="Addressing formats">
    Target eksplisit yang disukai:

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
  <Accordion title="Available actions">
    - **react**: Menambah/menghapus tapback iMessage (`messageId`, `emoji`, `remove`). Tapback yang didukung dipetakan ke love, like, dislike, laugh, emphasize, dan question.
    - **reply**: Mengirim balasan berutas ke pesan yang sudah ada (`messageId`, `text` atau `message`, ditambah `chatGuid`, `chatId`, `chatIdentifier`, atau `to`).
    - **sendWithEffect**: Mengirim teks dengan efek iMessage (`text` atau `message`, `effect` atau `effectId`).
    - **edit**: Mengedit pesan terkirim pada versi macOS/API privat yang didukung (`messageId`, `text` atau `newText`).
    - **unsend**: Menarik kembali pesan terkirim pada versi macOS/API privat yang didukung (`messageId`).
    - **upload-file**: Mengirim media/file (`buffer` sebagai base64 atau `media`/`path`/`filePath` yang telah dihidrasi, `filename`, opsional `asVoice`). Alias lama: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Mengelola chat grup ketika target saat ini adalah percakapan grup.

  </Accordion>

  <Accordion title="Message IDs">
    Konteks iMessage masuk menyertakan nilai `MessageSid` pendek dan GUID pesan penuh ketika tersedia. ID pendek memiliki cakupan ke cache balasan dalam memori terbaru dan diperiksa terhadap chat saat ini sebelum digunakan. Jika ID pendek telah kedaluwarsa atau milik chat lain, coba lagi dengan `MessageSidFull` penuh.

  </Accordion>

  <Accordion title="Capability detection">
    OpenClaw menyembunyikan tindakan API privat hanya ketika status probe yang di-cache menyatakan bridge tidak tersedia. Jika status tidak diketahui, tindakan tetap terlihat dan dispatch melakukan probe secara lazy sehingga tindakan pertama dapat berhasil setelah `imsg launch` tanpa refresh status manual terpisah.

  </Accordion>

  <Accordion title="Read receipts and typing">
    Ketika bridge API privat aktif, chat masuk yang diterima ditandai telah dibaca sebelum dispatch dan gelembung mengetik ditampilkan kepada pengirim saat agen menghasilkan respons. Nonaktifkan penandaan baca dengan:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Build `imsg` lama yang mendahului daftar kapabilitas per metode akan mematikan typing/read secara diam-diam; OpenClaw mencatat peringatan satu kali per restart agar receipt yang hilang dapat ditelusuri.

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

Ketika pengguna mengetik perintah dan URL bersama-sama — misalnya `Dump https://example.com/article` — aplikasi Messages Apple memecah pengiriman menjadi **dua baris `chat.db` terpisah**:

1. Pesan teks (`"Dump"`).
2. Balon pratinjau URL (`"https://..."`) dengan gambar pratinjau OG sebagai lampiran.

Dua baris tersebut tiba di OpenClaw dengan jarak sekitar 0,8-2,0 dtk pada sebagian besar setup. Tanpa penggabungan, agen menerima perintah saja pada giliran 1, membalas (sering kali "kirimkan URL-nya"), dan baru melihat URL pada giliran 2 — saat konteks perintah sudah hilang. Ini adalah pipeline pengiriman Apple, bukan sesuatu yang diperkenalkan OpenClaw atau `imsg`.

`channels.imessage.coalesceSameSenderDms` memilih sebuah DM untuk menggabungkan baris berturut-turut dari pengirim yang sama menjadi satu giliran agen. Chat grup tetap di-dispatch per pesan agar struktur giliran multi-pengguna tetap dipertahankan.

<Tabs>
  <Tab title="When to enable">
    Aktifkan ketika:

    - Anda mengirimkan skills yang mengharapkan `command + payload` dalam satu pesan (dump, paste, save, queue, dsb.).
    - Pengguna Anda menempelkan URL, gambar, atau konten panjang bersama perintah.
    - Anda dapat menerima latensi giliran DM tambahan (lihat di bawah).

    Biarkan nonaktif ketika:

    - Anda memerlukan latensi perintah minimum untuk pemicu DM satu kata.
    - Semua alur Anda adalah perintah sekali jalan tanpa tindak lanjut payload.

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Dengan flag aktif dan tanpa `messages.inbound.byChannel.imessage` eksplisit, jendela debounce melebar menjadi **2500 ms** (default lama adalah 0 ms — tanpa debouncing). Jendela yang lebih lebar diperlukan karena irama kirim-terpisah Apple sebesar 0,8-2,0 dtk tidak cocok dengan default yang lebih ketat.

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
  <Tab title="Trade-offs">
    - **Latensi tambahan untuk pesan DM.** Dengan flag aktif, setiap DM (termasuk perintah kontrol mandiri dan tindak lanjut teks tunggal) menunggu hingga jendela debounce sebelum dikirim, untuk berjaga-jaga jika ada baris payload yang masuk. Pesan obrolan grup tetap dikirim seketika.
    - **Output gabungan dibatasi.** Teks gabungan dibatasi hingga 4000 karakter dengan penanda `…[truncated]` eksplisit; lampiran dibatasi hingga 20; entri sumber dibatasi hingga 10 (pertama-plus-terbaru dipertahankan setelah itu). Setiap GUID sumber dilacak di `coalescedMessageGuids` untuk telemetri downstream.
    - **Hanya DM.** Obrolan grup diteruskan ke pengiriman per pesan agar bot tetap responsif saat beberapa orang sedang mengetik.
    - **Opt-in, per-channel.** Channel lain (Telegram, WhatsApp, Slack, …) tidak terdampak. Konfigurasi BlueBubbles lama yang menetapkan `channels.bluebubbles.coalesceSameSenderDms` harus memigrasikan nilai tersebut ke `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Skenario dan apa yang dilihat agen

| Pengguna menyusun                                                  | `chat.db` menghasilkan | Flag nonaktif (default)                  | Flag aktif + jendela 2500 ms                                            |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (satu pengiriman)                       | 2 baris terpisah ~1 dtk | Dua giliran agen: "Dump" saja, lalu URL | Satu giliran: teks gabungan `Dump https://example.com`                  |
| `Save this 📎image.jpg caption` (lampiran + teks)                  | 2 baris                | Dua giliran (lampiran dibuang saat digabungkan) | Satu giliran: teks + gambar dipertahankan                               |
| `/status` (perintah mandiri)                                       | 1 baris                | Pengiriman seketika                     | **Tunggu hingga jendela, lalu kirim**                                   |
| URL ditempel sendiri                                               | 1 baris                | Pengiriman seketika                     | Pengiriman seketika (hanya satu entri dalam bucket)                     |
| Teks + URL dikirim sebagai dua pesan terpisah yang disengaja, berselang menit | 2 baris di luar jendela | Dua giliran                             | Dua giliran (jendela kedaluwarsa di antaranya)                          |
| Banjir cepat (>10 DM kecil di dalam jendela)                       | N baris                | N giliran                               | Satu giliran, output dibatasi (pertama + terbaru, batas teks/lampiran diterapkan) |
| Dua orang mengetik dalam obrolan grup                              | N baris dari M pengirim | M+ giliran (satu per bucket pengirim)   | M+ giliran — obrolan grup tidak digabungkan                             |

## Mengejar ketertinggalan setelah downtime Gateway

Saat Gateway offline (crash, restart, Mac tidur, mesin mati), `imsg watch` melanjutkan dari status `chat.db` saat ini setelah Gateway kembali aktif — apa pun yang tiba selama jeda, secara default, tidak pernah terlihat. Catchup memutar ulang pesan-pesan tersebut pada startup berikutnya agar agen tidak diam-diam melewatkan traffic inbound.

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

Satu pass per startup `monitorIMessageProvider`, diurutkan sebagai `imsg launch` siap → `watch.subscribe` → `performIMessageCatchup` → loop pengiriman live. Catchup sendiri menggunakan `chats.list` + `messages.history` per obrolan terhadap klien JSON-RPC yang sama dengan yang digunakan oleh `imsg watch`. Apa pun yang tiba selama pass catchup mengalir melalui pengiriman live secara normal; cache dedupe inbound yang ada menyerap setiap tumpang tindih dengan baris yang diputar ulang.

Setiap baris yang diputar ulang dimasukkan melalui jalur pengiriman live (`evaluateIMessageInbound` + `dispatchInboundMessage`), sehingga allowlist, kebijakan grup, debouncer, cache echo, dan tanda terima baca berperilaku identik pada pesan yang diputar ulang dan pesan live.

### Semantik kursor dan percobaan ulang

Catchup menyimpan kursor per akun di `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (direktori state OpenClaw default ke `~/.openclaw`, dapat ditimpa dengan `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- Kursor maju pada setiap pengiriman yang berhasil dan ditahan saat pengiriman sebuah baris melempar error — startup berikutnya mencoba ulang baris yang sama dari kursor yang ditahan.
- Setelah `maxFailureRetries` lemparan beruntun terhadap `guid` yang sama, catchup mencatat `warn` dan memaksa kursor maju melewati pesan yang macet agar startup berikutnya dapat terus berjalan.
- GUID yang sudah diserahterimakan akan dilewati saat terlihat (tanpa upaya pengiriman) pada run berikutnya dan dihitung di bawah `skippedGivenUp` dalam ringkasan run.

### Sinyal yang terlihat operator

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Baris `WARN ... capped to perRunLimit` berarti satu startup tidak mengosongkan seluruh backlog. Naikkan `perRunLimit` (maks 500) jika jeda Anda secara rutin melebihi pass default 50 baris.

### Kapan membiarkannya nonaktif

- Gateway berjalan terus-menerus dengan auto-restart watchdog dan jeda selalu < beberapa detik — default nonaktif sudah cukup.
- Volume DM rendah dan pesan yang terlewat tidak akan mengubah perilaku agen — jendela awal `firstRunLookbackMinutes` dapat mengirim konteks lama yang mengejutkan saat pertama kali diaktifkan.

Saat Anda mengaktifkan catchup, startup pertama tanpa kursor hanya melihat ke belakang sejauh `firstRunLookbackMinutes` (default 30 menit), bukan seluruh jendela `maxAgeMinutes` — ini menghindari pemutaran ulang riwayat panjang pesan sebelum pengaktifan.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    Validasi biner dan dukungan RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Jika probe melaporkan RPC tidak didukung, perbarui `imsg`. Jika tindakan API privat tidak tersedia, jalankan `imsg launch` dalam sesi pengguna macOS yang sedang login dan lakukan probe lagi. Jika Gateway tidak berjalan di macOS, gunakan pengaturan Remote Mac melalui SSH di atas, bukan jalur `imsg` lokal default.

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    `cliPath: "imsg"` default harus berjalan di Mac yang masuk ke Messages. Di Linux atau Windows, tetapkan `channels.imessage.cliPath` ke skrip wrapper yang melakukan SSH ke Mac tersebut dan menjalankan `imsg "$@"`.

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
    - keterbacaan path remote di Mac yang menjalankan Messages

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    Jalankan ulang di terminal GUI interaktif dalam konteks pengguna/sesi yang sama dan setujui prompt:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Pastikan Full Disk Access + Automation diberikan untuk konteks proses yang menjalankan OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Penunjuk referensi konfigurasi

- [Referensi konfigurasi - iMessage](/id/gateway/config-channels#imessage)
- [Konfigurasi Gateway](/id/gateway/configuration)
- [Pairing](/id/channels/pairing)

## Terkait

- [Ringkasan Channel](/id/channels) — semua channel yang didukung
- [Penghapusan BlueBubbles dan jalur iMessage imsg](/id/announcements/bluebubbles-imessage) — pengumuman dan ringkasan migrasi
- [Beralih dari BlueBubbles](/id/channels/imessage-from-bluebubbles) — tabel terjemahan konfigurasi dan cutover langkah demi langkah
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku obrolan grup dan gating mention
- [Perutean Channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
