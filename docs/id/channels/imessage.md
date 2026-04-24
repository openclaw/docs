---
read_when:
    - Menyiapkan dukungan iMessage
    - Men-debug kirim/terima iMessage
summary: Dukungan iMessage lama melalui imsg (JSON-RPC melalui stdio). Penyiapan baru sebaiknya menggunakan BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-24T08:58:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff2773ebcfced8834bc5d28378d9a6e3c20826cc0e08d6ea5480f8a5975fd8e3
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (lama: imsg)

<Warning>
Untuk deployment iMessage baru, gunakan <a href="/id/channels/bluebubbles">BlueBubbles</a>.

Integrasi `imsg` adalah lama dan mungkin akan dihapus pada rilis mendatang.
</Warning>

Status: integrasi CLI eksternal lama. Gateway menjalankan `imsg rpc` dan berkomunikasi melalui JSON-RPC di stdio (tanpa daemon/port terpisah).

<CardGroup cols={3}>
  <Card title="BlueBubbles (recommended)" icon="message-circle" href="/id/channels/bluebubbles">
    Jalur iMessage yang disarankan untuk penyiapan baru.
  </Card>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    DM iMessage secara default menggunakan mode pairing.
  </Card>
  <Card title="Configuration reference" icon="settings" href="/id/gateway/config-channels#imessage">
    Referensi field iMessage lengkap.
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
    OpenClaw hanya memerlukan `cliPath` yang kompatibel dengan stdio, jadi Anda dapat mengarahkan `cliPath` ke skrip wrapper yang melakukan SSH ke Mac jarak jauh dan menjalankan `imsg`.

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
      remoteHost: "user@gateway-host", // digunakan untuk pengambilan lampiran SCP
      includeAttachments: true,
      // Opsional: override root lampiran yang diizinkan.
      // Default mencakup /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Jika `remoteHost` tidak disetel, OpenClaw mencoba mendeteksinya secara otomatis dengan mem-parse skrip wrapper SSH.
    `remoteHost` harus berupa `host` atau `user@host` (tanpa spasi atau opsi SSH).
    OpenClaw menggunakan pemeriksaan host-key yang ketat untuk SCP, jadi host key relay harus sudah ada di `~/.ssh/known_hosts`.
    Path lampiran divalidasi terhadap root yang diizinkan (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Persyaratan dan izin (macOS)

- Messages harus sudah masuk di Mac yang menjalankan `imsg`.
- Full Disk Access diperlukan untuk konteks proses yang menjalankan OpenClaw/`imsg` (akses DB Messages).
- Izin Automation diperlukan untuk mengirim pesan melalui Messages.app.

<Tip>
Izin diberikan per konteks proses. Jika gateway berjalan tanpa antarmuka (LaunchAgent/SSH), jalankan perintah interaktif satu kali dalam konteks yang sama untuk memicu prompt:

```bash
imsg chats --limit 1
# atau
imsg send <handle> "test"
```

</Tip>

## Kontrol akses dan perutean

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` mengontrol pesan langsung:

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `allowFrom` untuk menyertakan `"*"`)
    - `disabled`

    Field allowlist: `channels.imessage.allowFrom`.

    Entri allowlist dapat berupa handle atau target chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` mengontrol penanganan grup:

    - `allowlist` (default saat dikonfigurasi)
    - `open`
    - `disabled`

    Allowlist pengirim grup: `channels.imessage.groupAllowFrom`.

    Fallback runtime: jika `groupAllowFrom` tidak disetel, pemeriksaan pengirim grup iMessage akan fallback ke `allowFrom` jika tersedia.
    Catatan runtime: jika `channels.imessage` sama sekali tidak ada, runtime fallback ke `groupPolicy="allowlist"` dan mencatat peringatan (bahkan jika `channels.defaults.groupPolicy` disetel).

    Pembatasan mention untuk grup:

    - iMessage tidak memiliki metadata mention bawaan
    - deteksi mention menggunakan pola regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - tanpa pola yang dikonfigurasi, pembatasan mention tidak dapat diterapkan

    Perintah kontrol dari pengirim yang diotorisasi dapat melewati pembatasan mention di grup.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DM menggunakan perutean langsung; grup menggunakan perutean grup.
    - Dengan `session.dmScope=main` default, DM iMessage digabungkan ke sesi utama agen.
    - Sesi grup diisolasi (`agent:<agentId>:imessage:group:<chat_id>`).
    - Balasan dirutekan kembali ke iMessage menggunakan metadata saluran/target asal.

    Perilaku thread mirip grup:

    Beberapa thread iMessage multi-peserta dapat masuk dengan `is_group=false`.
    Jika `chat_id` itu secara eksplisit dikonfigurasi di bawah `channels.imessage.groups`, OpenClaw memperlakukannya sebagai lalu lintas grup (pembatasan grup + isolasi sesi grup).

  </Tab>
</Tabs>

## Binding percakapan ACP

Chat iMessage lama juga dapat diikat ke sesi ACP.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM atau chat grup yang diizinkan.
- Pesan berikutnya dalam percakapan iMessage yang sama akan dirutekan ke sesi ACP yang dihasilkan.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus binding.

Binding persisten yang dikonfigurasi didukung melalui entri tingkat atas `bindings[]` dengan `type: "acp"` dan `match.channel: "imessage"`.

`match.peer.id` dapat menggunakan:

- handle DM yang dinormalisasi seperti `+15555550123` atau `user@example.com`
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

Lihat [ACP Agents](/id/tools/acp-agents) untuk perilaku binding ACP bersama.

## Pola deployment

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Gunakan Apple ID dan pengguna macOS bot khusus agar lalu lintas bot terpisah dari profil Messages pribadi Anda.

    Alur umum:

    1. Buat/masuk ke pengguna macOS khusus.
    2. Masuk ke Messages dengan Apple ID bot pada pengguna tersebut.
    3. Instal `imsg` pada pengguna tersebut.
    4. Buat wrapper SSH agar OpenClaw dapat menjalankan `imsg` dalam konteks pengguna tersebut.
    5. Arahkan `channels.imessage.accounts.<id>.cliPath` dan `.dbPath` ke profil pengguna tersebut.

    Eksekusi pertama mungkin memerlukan persetujuan GUI (Automation + Full Disk Access) di sesi pengguna bot tersebut.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
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
    Pastikan host key sudah dipercaya terlebih dahulu (misalnya `ssh bot@mac-mini.tailnet-1234.ts.net`) agar `known_hosts` terisi.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage mendukung konfigurasi per akun di bawah `channels.imessage.accounts`.

    Setiap akun dapat meng-override field seperti `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, pengaturan riwayat, dan allowlist root lampiran.

  </Accordion>
</AccordionGroup>

## Media, chunking, dan target pengiriman

<AccordionGroup>
  <Accordion title="Attachments and media">
    - ingest lampiran masuk bersifat opsional: `channels.imessage.includeAttachments`
    - path lampiran jarak jauh dapat diambil melalui SCP saat `remoteHost` disetel
    - path lampiran harus cocok dengan root yang diizinkan:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (mode SCP jarak jauh)
      - pola root default: `/Users/*/Library/Messages/Attachments`
    - SCP menggunakan pemeriksaan host-key yang ketat (`StrictHostKeyChecking=yes`)
    - ukuran media keluar menggunakan `channels.imessage.mediaMaxMb` (default 16 MB)
  </Accordion>

  <Accordion title="Outbound chunking">
    - batas potongan teks: `channels.imessage.textChunkLimit` (default 4000)
    - mode chunk: `channels.imessage.chunkMode`
      - `length` (default)
      - `newline` (pemecahan dengan paragraf terlebih dahulu)
  </Accordion>

  <Accordion title="Addressing formats">
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

## Penulisan config

iMessage mengizinkan penulisan config yang dimulai saluran secara default (untuk `/config set|unset` saat `commands.config: true`).

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
  <Accordion title="imsg not found or RPC unsupported">
    Validasi binary dan dukungan RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Jika probe melaporkan RPC tidak didukung, perbarui `imsg`.

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
    - host key ada di `~/.ssh/known_hosts` pada host gateway
    - keterbacaan path jarak jauh pada Mac yang menjalankan Messages

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    Jalankan ulang di terminal GUI interaktif dalam konteks pengguna/sesi yang sama dan setujui prompt:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Konfirmasikan Full Disk Access + Automation diberikan untuk konteks proses yang menjalankan OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Petunjuk referensi konfigurasi

- [Referensi konfigurasi - iMessage](/id/gateway/config-channels#imessage)
- [Konfigurasi Gateway](/id/gateway/configuration)
- [Pairing](/id/channels/pairing)
- [BlueBubbles](/id/channels/bluebubbles)

## Terkait

- [Ikhtisar Saluran](/id/channels) — semua saluran yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku chat grup dan pembatasan mention
- [Perutean Saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
