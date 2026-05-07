---
read_when:
    - Menyiapkan dukungan iMessage
    - Men-debug pengiriman/penerimaan iMessage
summary: Dukungan iMessage native melalui imsg (JSON-RPC melalui stdio). Lebih disarankan untuk penyiapan iMessage OpenClaw baru ketika persyaratan host sesuai.
title: iMessage
x-i18n:
    generated_at: "2026-05-07T01:50:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39a3d6350333292c147d7986568eb539aa8ce562405092b71b8cecbbf7584450
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Untuk deployment OpenClaw iMessage baru, mulai dari sini saat Anda dapat menjalankan `imsg` pada host macOS Messages yang sudah masuk. BlueBubbles tetap tersedia sebagai fallback legacy untuk setup yang sudah ada yang bergantung pada server HTTP, webhook, atau tindakan private-API yang lebih kaya.
</Note>

Status: integrasi CLI eksternal native. Gateway menjalankan `imsg rpc` dan berkomunikasi melalui JSON-RPC pada stdio (tanpa daemon/port terpisah).

<CardGroup cols={3}>
  <Card title="BlueBubbles (fallback legacy)" icon="message-circle" href="/id/channels/bluebubbles">
    Tetap gunakan ini untuk routing yang sudah ada berbasis BlueBubbles; hindari untuk setup baru saat imsg sesuai.
  </Card>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    DM iMessage secara default menggunakan mode pairing.
  </Card>
  <Card title="Referensi konfigurasi" icon="settings" href="/id/gateway/config-channels#imessage">
    Referensi lengkap field iMessage.
  </Card>
</CardGroup>

## Setup cepat

<Tabs>
  <Tab title="Mac lokal (jalur cepat)">
    <Steps>
      <Step title="Instal dan verifikasi imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
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

    Jika `remoteHost` tidak diatur, OpenClaw mencoba mendeteksinya otomatis dengan mengurai skrip wrapper SSH.
    `remoteHost` harus berupa `host` atau `user@host` (tanpa spasi atau opsi SSH).
    OpenClaw menggunakan pemeriksaan host-key ketat untuk SCP, sehingga kunci host relay harus sudah ada di `~/.ssh/known_hosts`.
    Jalur lampiran divalidasi terhadap root yang diizinkan (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Persyaratan dan izin (macOS)

- Messages harus sudah masuk di Mac yang menjalankan `imsg`.
- Full Disk Access diperlukan untuk konteks proses yang menjalankan OpenClaw/`imsg` (akses DB Messages).
- Izin Automation diperlukan untuk mengirim pesan melalui Messages.app.

<Tip>
Izin diberikan per konteks proses. Jika gateway berjalan headless (LaunchAgent/SSH), jalankan perintah interaktif sekali dalam konteks yang sama untuk memicu prompt:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Kontrol akses dan routing

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.imessage.dmPolicy` mengontrol pesan langsung:

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `allowFrom` untuk menyertakan `"*"`)
    - `disabled`

    Field allowlist: `channels.imessage.allowFrom`.

    Entri allowlist dapat berupa handle atau target chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Kebijakan grup + sebutan">
    `channels.imessage.groupPolicy` mengontrol penanganan grup:

    - `allowlist` (default saat dikonfigurasi)
    - `open`
    - `disabled`

    Allowlist pengirim grup: `channels.imessage.groupAllowFrom`.

    Fallback runtime: jika `groupAllowFrom` tidak diatur, pemeriksaan pengirim grup iMessage akan fallback ke `allowFrom` bila tersedia.
    Catatan runtime: jika `channels.imessage` sepenuhnya tidak ada, runtime akan fallback ke `groupPolicy="allowlist"` dan mencatat peringatan (meskipun `channels.defaults.groupPolicy` diatur).

    Pembatasan sebutan untuk grup:

    - iMessage tidak memiliki metadata sebutan native
    - deteksi sebutan menggunakan pola regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - tanpa pola yang dikonfigurasi, pembatasan sebutan tidak dapat diterapkan

    Perintah kontrol dari pengirim yang berwenang dapat melewati pembatasan sebutan dalam grup.

  </Tab>

  <Tab title="Sesi dan balasan deterministik">
    - DM menggunakan routing langsung; grup menggunakan routing grup.
    - Dengan default `session.dmScope=main`, DM iMessage digabungkan ke sesi utama agen.
    - Sesi grup diisolasi (`agent:<agentId>:imessage:group:<chat_id>`).
    - Balasan dirutekan kembali ke iMessage menggunakan metadata channel/target asal.

    Perilaku thread mirip grup:

    Beberapa thread iMessage dengan banyak peserta dapat tiba dengan `is_group=false`.
    Jika `chat_id` tersebut dikonfigurasi secara eksplisit di bawah `channels.imessage.groups`, OpenClaw memperlakukannya sebagai traffic grup (pembatasan grup + isolasi sesi grup).

  </Tab>
</Tabs>

## Binding percakapan ACP

Chat iMessage legacy juga dapat diikat ke sesi ACP.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM atau chat grup yang diizinkan.
- Pesan berikutnya dalam percakapan iMessage yang sama dirutekan ke sesi ACP yang dibuat.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus binding.

Binding persisten yang dikonfigurasi didukung melalui entri `bindings[]` tingkat atas dengan `type: "acp"` dan `match.channel: "imessage"`.

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
    Gunakan Apple ID dan pengguna macOS khusus agar traffic bot diisolasi dari profil Messages pribadi Anda.

    Alur umum:

    1. Buat/masuk sebagai pengguna macOS khusus.
    2. Masuk ke Messages dengan Apple ID bot dalam pengguna tersebut.
    3. Instal `imsg` dalam pengguna tersebut.
    4. Buat wrapper SSH agar OpenClaw dapat menjalankan `imsg` dalam konteks pengguna tersebut.
    5. Arahkan `channels.imessage.accounts.<id>.cliPath` dan `.dbPath` ke profil pengguna tersebut.

    Eksekusi pertama mungkin memerlukan persetujuan GUI (Automation + Full Disk Access) dalam sesi pengguna bot tersebut.

  </Accordion>

  <Accordion title="Mac jarak jauh melalui Tailscale (contoh)">
    Topologi umum:

    - gateway berjalan di Linux/VM
    - iMessage + `imsg` berjalan di Mac dalam tailnet Anda
    - wrapper `cliPath` menggunakan SSH untuk menjalankan `imsg`
    - `remoteHost` mengaktifkan pengambilan lampiran SCP

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

  <Accordion title="Pola multi-akun">
    iMessage mendukung konfigurasi per akun di bawah `channels.imessage.accounts`.

    Setiap akun dapat mengganti field seperti `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, pengaturan riwayat, dan allowlist root lampiran.

  </Accordion>
</AccordionGroup>

## Media, chunking, dan target pengiriman

<AccordionGroup>
  <Accordion title="Lampiran dan media">
    - ingest lampiran masuk bersifat opsional: `channels.imessage.includeAttachments`
    - jalur lampiran jarak jauh dapat diambil melalui SCP saat `remoteHost` diatur
    - jalur lampiran harus cocok dengan root yang diizinkan:
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
      - `newline` (pemecahan dengan paragraf terlebih dahulu)

  </Accordion>

  <Accordion title="Format pengalamatan">
    Target eksplisit yang direkomendasikan:

    - `chat_id:123` (direkomendasikan untuk routing stabil)
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

## Penulisan konfigurasi

iMessage mengizinkan penulisan konfigurasi yang dimulai oleh channel secara default (untuk `/config set|unset` saat `commands.config: true`).

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

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="imsg tidak ditemukan atau RPC tidak didukung">
    Validasi binary dan dukungan RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Jika probe melaporkan RPC tidak didukung, perbarui `imsg`.

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
    - konfigurasi pola sebutan (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Lampiran jarak jauh gagal">
    Periksa:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autentikasi kunci SSH/SCP dari host gateway
    - kunci host ada di `~/.ssh/known_hosts` pada host gateway
    - keterbacaan jalur jarak jauh pada Mac yang menjalankan Messages

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

## Pointer referensi konfigurasi

- [Referensi konfigurasi - iMessage](/id/gateway/config-channels#imessage)
- [Konfigurasi Gateway](/id/gateway/configuration)
- [Pairing](/id/channels/pairing)
- [BlueBubbles](/id/channels/bluebubbles)

## Terkait

- [Ikhtisar Saluran](/id/channels) — semua saluran yang didukung
- [Penyandingan](/id/channels/pairing) — autentikasi DM dan alur penyandingan
- [Grup](/id/channels/groups) — perilaku chat grup dan pembatasan penyebutan
- [Perutean Saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan keamanan
