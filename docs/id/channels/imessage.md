---
read_when:
    - Menyiapkan dukungan iMessage
    - Men-debug kirim/terima iMessage
summary: Dukungan iMessage lama melalui imsg (JSON-RPC melalui stdio). Penyiapan baru sebaiknya menggunakan BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-05T13:43:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 086d85bead49f75d12ae6b14ac917af52375b6afd28f6af1a0dcbbc7fcb628a0
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (lama: imsg)

<Warning>
Untuk deployment iMessage baru, gunakan <a href="/channels/bluebubbles">BlueBubbles</a>.

Integrasi `imsg` adalah versi lama dan mungkin akan dihapus pada rilis mendatang.
</Warning>

Status: integrasi CLI eksternal versi lama. Gateway memunculkan `imsg rpc` dan berkomunikasi melalui JSON-RPC di stdio (tanpa daemon/port terpisah).

<CardGroup cols={3}>
  <Card title="BlueBubbles (direkomendasikan)" icon="message-circle" href="/channels/bluebubbles">
    Jalur iMessage yang diprioritaskan untuk penyiapan baru.
  </Card>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    DM iMessage secara default menggunakan mode pairing.
  </Card>
  <Card title="Referensi konfigurasi" icon="settings" href="/gateway/configuration-reference#imessage">
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
```

      </Step>

      <Step title="Konfigurasikan OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/<you>/Library/Messages/chat.db",
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
    OpenClaw hanya memerlukan `cliPath` yang kompatibel dengan stdio, jadi Anda dapat mengarahkan `cliPath` ke skrip pembungkus yang melakukan SSH ke Mac jarak jauh dan menjalankan `imsg`.

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
      remoteHost: "user@gateway-host", // digunakan untuk pengambilan lampiran melalui SCP
      includeAttachments: true,
      // Opsional: timpa root lampiran yang diizinkan.
      // Default mencakup /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Jika `remoteHost` tidak diatur, OpenClaw mencoba mendeteksinya secara otomatis dengan mem-parsing skrip pembungkus SSH.
    `remoteHost` harus berupa `host` atau `user@host` (tanpa spasi atau opsi SSH).
    OpenClaw menggunakan pemeriksaan host-key ketat untuk SCP, jadi host key relay harus sudah ada di `~/.ssh/known_hosts`.
    Path lampiran divalidasi terhadap root yang diizinkan (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Persyaratan dan izin (macOS)

- Messages harus sudah login di Mac yang menjalankan `imsg`.
- Full Disk Access diperlukan untuk konteks proses yang menjalankan OpenClaw/`imsg` (akses DB Messages).
- Izin Automation diperlukan untuk mengirim pesan melalui Messages.app.

<Tip>
Izin diberikan per konteks proses. Jika gateway berjalan headless (LaunchAgent/SSH), jalankan satu perintah interaktif sekali dalam konteks yang sama untuk memicu prompt:

```bash
imsg chats --limit 1
# atau
imsg send <handle> "test"
```

</Tip>

## Kontrol akses dan perutean

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.imessage.dmPolicy` mengontrol pesan langsung:

    - `pairing` (default)
    - `allowlist`
    - `open` (mengharuskan `allowFrom` menyertakan `"*"`)
    - `disabled`

    Field allowlist: `channels.imessage.allowFrom`.

    Entri allowlist dapat berupa handle atau target chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Kebijakan grup + mention">
    `channels.imessage.groupPolicy` mengontrol penanganan grup:

    - `allowlist` (default saat dikonfigurasi)
    - `open`
    - `disabled`

    Allowlist pengirim grup: `channels.imessage.groupAllowFrom`.

    Fallback runtime: jika `groupAllowFrom` tidak diatur, pemeriksaan pengirim grup iMessage akan fallback ke `allowFrom` jika tersedia.
    Catatan runtime: jika `channels.imessage` sama sekali tidak ada, runtime fallback ke `groupPolicy="allowlist"` dan mencatat peringatan (bahkan jika `channels.defaults.groupPolicy` diatur).

    Penyaringan mention untuk grup:

    - iMessage tidak memiliki metadata mention bawaan
    - deteksi mention menggunakan pola regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - tanpa pola yang dikonfigurasi, penyaringan mention tidak dapat diberlakukan

    Perintah kontrol dari pengirim yang diotorisasi dapat melewati penyaringan mention di grup.

  </Tab>

  <Tab title="Sesi dan balasan deterministik">
    - DM menggunakan perutean langsung; grup menggunakan perutean grup.
    - Dengan default `session.dmScope=main`, DM iMessage digabungkan ke sesi utama agen.
    - Sesi grup diisolasi (`agent:<agentId>:imessage:group:<chat_id>`).
    - Balasan dirutekan kembali ke iMessage menggunakan metadata channel/target asal.

    Perilaku thread mirip grup:

    Beberapa thread iMessage multi-peserta dapat datang dengan `is_group=false`.
    Jika `chat_id` tersebut dikonfigurasi secara eksplisit di bawah `channels.imessage.groups`, OpenClaw memperlakukannya sebagai lalu lintas grup (penyaringan grup + isolasi sesi grup).

  </Tab>
</Tabs>

## Binding percakapan ACP

Chat iMessage versi lama juga dapat diikat ke sesi ACP.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM atau chat grup yang diizinkan.
- Pesan berikutnya di percakapan iMessage yang sama akan dirutekan ke sesi ACP yang dimunculkan.
- `/new` dan `/reset` mengatur ulang sesi ACP terikat yang sama di tempat.
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

Lihat [ACP Agents](/tools/acp-agents) untuk perilaku binding ACP bersama.

## Pola deployment

<AccordionGroup>
  <Accordion title="Pengguna bot macOS khusus (identitas iMessage terpisah)">
    Gunakan Apple ID dan pengguna macOS khusus agar lalu lintas bot terisolasi dari profil Messages pribadi Anda.

    Alur umum:

    1. Buat/login pengguna macOS khusus.
    2. Login ke Messages dengan Apple ID bot pada pengguna tersebut.
    3. Instal `imsg` pada pengguna tersebut.
    4. Buat pembungkus SSH agar OpenClaw dapat menjalankan `imsg` dalam konteks pengguna tersebut.
    5. Arahkan `channels.imessage.accounts.<id>.cliPath` dan `.dbPath` ke profil pengguna tersebut.

    Eksekusi pertama mungkin memerlukan persetujuan GUI (Automation + Full Disk Access) pada sesi pengguna bot tersebut.

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

    Gunakan SSH key agar SSH dan SCP sama-sama non-interaktif.
    Pastikan host key sudah dipercaya terlebih dahulu (misalnya `ssh bot@mac-mini.tailnet-1234.ts.net`) agar `known_hosts` terisi.

  </Accordion>

  <Accordion title="Pola multi-akun">
    iMessage mendukung konfigurasi per akun di bawah `channels.imessage.accounts`.

    Setiap akun dapat menimpa field seperti `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, pengaturan riwayat, dan allowlist root lampiran.

  </Accordion>
</AccordionGroup>

## Media, pemotongan, dan target pengiriman

<AccordionGroup>
  <Accordion title="Lampiran dan media">
    - ingest lampiran masuk bersifat opsional: `channels.imessage.includeAttachments`
    - path lampiran jarak jauh dapat diambil melalui SCP saat `remoteHost` diatur
    - path lampiran harus cocok dengan root yang diizinkan:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (mode SCP jarak jauh)
      - pola root default: `/Users/*/Library/Messages/Attachments`
    - SCP menggunakan pemeriksaan host-key ketat (`StrictHostKeyChecking=yes`)
    - ukuran media keluar menggunakan `channels.imessage.mediaMaxMb` (default 16 MB)
  </Accordion>

  <Accordion title="Pemotongan keluar">
    - batas potongan teks: `channels.imessage.textChunkLimit` (default 4000)
    - mode potongan: `channels.imessage.chunkMode`
      - `length` (default)
      - `newline` (pemisahan dengan paragraf terlebih dahulu)
  </Accordion>

  <Accordion title="Format pengalamatan">
    Target eksplisit yang direkomendasikan:

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

## Penulisan konfigurasi

iMessage mengizinkan penulisan konfigurasi yang dimulai dari channel secara default (untuk `/config set|unset` saat `commands.config: true`).

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
    Validasi biner dan dukungan RPC:

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
    - konfigurasi pola mention (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Lampiran jarak jauh gagal">
    Periksa:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autentikasi key SSH/SCP dari host gateway
    - host key ada di `~/.ssh/known_hosts` pada host gateway
    - keterbacaan path jarak jauh pada Mac yang menjalankan Messages

  </Accordion>

  <Accordion title="Prompt izin macOS terlewat">
    Jalankan ulang di terminal GUI interaktif dalam konteks pengguna/sesi yang sama dan setujui prompt:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Pastikan Full Disk Access + Automation telah diberikan untuk konteks proses yang menjalankan OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Penunjuk referensi konfigurasi

- [Referensi konfigurasi - iMessage](/gateway/configuration-reference#imessage)
- [Konfigurasi gateway](/gateway/configuration)
- [Pairing](/channels/pairing)
- [BlueBubbles](/channels/bluebubbles)

## Terkait

- [Ikhtisar Channel](/channels) — semua channel yang didukung
- [Pairing](/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/channels/groups) — perilaku chat grup dan penyaringan mention
- [Perutean Channel](/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/gateway/security) — model akses dan hardening
