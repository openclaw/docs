---
read_when:
    - Menyiapkan dukungan iMessage
    - Men-debug pengiriman/penerimaan iMessage
summary: Dukungan iMessage lama melalui imsg (JSON-RPC melalui stdio). Penyiapan baru sebaiknya menggunakan BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-30T09:33:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60eeb3553a6511d56b8177ca4eafbedfed2d0852ac64c230c250911cd18ce17e
    source_path: channels/imessage.md
    workflow: 16
---

<Warning>
Untuk deployment iMessage baru, gunakan <a href="/id/channels/bluebubbles">BlueBubbles</a>.

Integrasi `imsg` adalah integrasi lama dan mungkin dihapus pada rilis mendatang.
</Warning>

Status: integrasi CLI eksternal lama. Gateway menjalankan `imsg rpc` dan berkomunikasi melalui JSON-RPC di stdio (tanpa daemon/porta terpisah).

<CardGroup cols={3}>
  <Card title="BlueBubbles (direkomendasikan)" icon="message-circle" href="/id/channels/bluebubbles">
    Jalur iMessage yang disukai untuk penyiapan baru.
  </Card>
  <Card title="Penyandingan" icon="link" href="/id/channels/pairing">
    DM iMessage secara bawaan menggunakan mode penyandingan.
  </Card>
  <Card title="Referensi konfigurasi" icon="settings" href="/id/gateway/config-channels#imessage">
    Referensi lengkap kolom iMessage.
  </Card>
</CardGroup>

## Penyiapan cepat

<Tabs>
  <Tab title="Mac Lokal (jalur cepat)">
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

      <Step title="Mulai Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Setujui penyandingan DM pertama (dmPolicy bawaan)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Permintaan penyandingan kedaluwarsa setelah 1 jam.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac Jarak Jauh melalui SSH">
    OpenClaw hanya memerlukan `cliPath` yang kompatibel dengan stdio, sehingga Anda dapat mengarahkan `cliPath` ke skrip pembungkus yang melakukan SSH ke Mac jarak jauh dan menjalankan `imsg`.

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

    Jika `remoteHost` tidak diatur, OpenClaw mencoba mendeteksinya otomatis dengan mengurai skrip pembungkus SSH.
    `remoteHost` harus berupa `host` atau `user@host` (tanpa spasi atau opsi SSH).
    OpenClaw menggunakan pemeriksaan kunci host ketat untuk SCP, sehingga kunci host relai harus sudah ada di `~/.ssh/known_hosts`.
    Jalur lampiran divalidasi terhadap root yang diizinkan (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Persyaratan dan izin (macOS)

- Messages harus sudah masuk di Mac yang menjalankan `imsg`.
- Akses Disk Penuh diperlukan untuk konteks proses yang menjalankan OpenClaw/`imsg` (akses DB Messages).
- Izin Otomasi diperlukan untuk mengirim pesan melalui Messages.app.

<Tip>
Izin diberikan per konteks proses. Jika Gateway berjalan tanpa antarmuka (LaunchAgent/SSH), jalankan perintah interaktif satu kali dalam konteks yang sama untuk memicu permintaan:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Kontrol akses dan perutean

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.imessage.dmPolicy` mengontrol pesan langsung:

    - `pairing` (bawaan)
    - `allowlist`
    - `open` (mengharuskan `allowFrom` menyertakan `"*"`)
    - `disabled`

    Kolom daftar izin: `channels.imessage.allowFrom`.

    Entri daftar izin dapat berupa alamat atau target obrolan (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Kebijakan grup + penyebutan">
    `channels.imessage.groupPolicy` mengontrol penanganan grup:

    - `allowlist` (bawaan saat dikonfigurasi)
    - `open`
    - `disabled`

    Daftar izin pengirim grup: `channels.imessage.groupAllowFrom`.

    Perilaku cadangan saat eksekusi: jika `groupAllowFrom` tidak diatur, pemeriksaan pengirim grup iMessage beralih ke `allowFrom` saat tersedia.
    Catatan waktu eksekusi: jika `channels.imessage` sepenuhnya tidak ada, runtime beralih ke `groupPolicy="allowlist"` dan mencatat peringatan (bahkan jika `channels.defaults.groupPolicy` diatur).

    Pembatasan penyebutan untuk grup:

    - iMessage tidak memiliki metadata penyebutan bawaan
    - deteksi penyebutan menggunakan pola regex (`agents.list[].groupChat.mentionPatterns`, cadangan `messages.groupChat.mentionPatterns`)
    - tanpa pola yang dikonfigurasi, pembatasan penyebutan tidak dapat diberlakukan

    Perintah kontrol dari pengirim yang berwenang dapat melewati pembatasan penyebutan di grup.

  </Tab>

  <Tab title="Sesi dan balasan deterministik">
    - DM menggunakan perutean langsung; grup menggunakan perutean grup.
    - Dengan `session.dmScope=main` bawaan, DM iMessage digabungkan ke sesi utama agen.
    - Sesi grup diisolasi (`agent:<agentId>:imessage:group:<chat_id>`).
    - Balasan dirutekan kembali ke iMessage menggunakan metadata saluran/target asal.

    Perilaku utas yang menyerupai grup:

    Beberapa utas iMessage dengan banyak peserta dapat masuk dengan `is_group=false`.
    Jika `chat_id` tersebut dikonfigurasi secara eksplisit di bawah `channels.imessage.groups`, OpenClaw memperlakukannya sebagai lalu lintas grup (pembatasan grup + isolasi sesi grup).

  </Tab>
</Tabs>

## Pengikatan percakapan ACP

Obrolan iMessage lama juga dapat diikat ke sesi ACP.

Alur cepat operator:

- Jalankan `/acp spawn codex --bind here` di dalam DM atau obrolan grup yang diizinkan.
- Pesan berikutnya dalam percakapan iMessage yang sama dirutekan ke sesi ACP yang dibuat.
- `/new` dan `/reset` mengatur ulang sesi ACP terikat yang sama di tempatnya.
- `/acp close` menutup sesi ACP dan menghapus ikatannya.

Pengikatan persisten yang dikonfigurasi didukung melalui entri `bindings[]` tingkat atas dengan `type: "acp"` dan `match.channel: "imessage"`.

`match.peer.id` dapat menggunakan:

- alamat DM yang dinormalisasi seperti `+15555550123` atau `user@example.com`
- `chat_id:<id>` (direkomendasikan untuk pengikatan grup yang stabil)
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
  <Accordion title="Pengguna macOS khusus bot (identitas iMessage terpisah)">
    Gunakan Apple ID dan pengguna macOS khusus agar lalu lintas bot terisolasi dari profil Messages pribadi Anda.

    Alur umum:

    1. Buat/masuk sebagai pengguna macOS khusus.
    2. Masuk ke Messages dengan Apple ID bot pada pengguna tersebut.
    3. Instal `imsg` pada pengguna tersebut.
    4. Buat pembungkus SSH agar OpenClaw dapat menjalankan `imsg` dalam konteks pengguna tersebut.
    5. Arahkan `channels.imessage.accounts.<id>.cliPath` dan `.dbPath` ke profil pengguna tersebut.

    Jalankan pertama mungkin memerlukan persetujuan GUI (Otomasi + Akses Disk Penuh) dalam sesi pengguna bot tersebut.

  </Accordion>

  <Accordion title="Mac Jarak Jauh melalui Tailscale (contoh)">
    Topologi umum:

    - Gateway berjalan di Linux/VM
    - iMessage + `imsg` berjalan di Mac dalam jaringan Tailscale Anda
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

    Gunakan kunci SSH agar SSH dan SCP sama-sama noninteraktif.
    Pastikan kunci host dipercaya terlebih dahulu (misalnya `ssh bot@mac-mini.tailnet-1234.ts.net`) agar `known_hosts` terisi.

  </Accordion>

  <Accordion title="Pola multi-akun">
    iMessage mendukung konfigurasi per akun di bawah `channels.imessage.accounts`.

    Setiap akun dapat mengganti kolom seperti `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, pengaturan riwayat, dan daftar izin root lampiran.

  </Accordion>
</AccordionGroup>

## Media, pemecahan, dan target pengiriman

<AccordionGroup>
  <Accordion title="Lampiran dan media">
    - penyerapan lampiran masuk bersifat opsional: `channels.imessage.includeAttachments`
    - jalur lampiran jarak jauh dapat diambil melalui SCP saat `remoteHost` diatur
    - jalur lampiran harus cocok dengan root yang diizinkan:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (mode SCP jarak jauh)
      - pola root bawaan: `/Users/*/Library/Messages/Attachments`
    - SCP menggunakan pemeriksaan kunci host ketat (`StrictHostKeyChecking=yes`)
    - ukuran media keluar menggunakan `channels.imessage.mediaMaxMb` (bawaan 16 MB)

  </Accordion>

  <Accordion title="Pemecahan keluaran">
    - batas potongan teks: `channels.imessage.textChunkLimit` (bawaan 4000)
    - mode potongan: `channels.imessage.chunkMode`
      - `length` (bawaan)
      - `newline` (pemecahan yang mengutamakan paragraf)

  </Accordion>

  <Accordion title="Format pengalamatan">
    Target eksplisit yang disukai:

    - `chat_id:123` (direkomendasikan untuk perutean stabil)
    - `chat_guid:...`
    - `chat_identifier:...`

    Target alamat juga didukung:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Penulisan konfigurasi

iMessage mengizinkan penulisan konfigurasi yang diinisiasi saluran secara bawaan (untuk `/config set|unset` saat `commands.config: true`).

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

    Jika pemeriksaan melaporkan RPC tidak didukung, perbarui `imsg`.

  </Accordion>

  <Accordion title="DM diabaikan">
    Periksa:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - persetujuan penyandingan (`openclaw pairing list imessage`)

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
    - autentikasi kunci SSH/SCP dari host Gateway
    - kunci host ada di `~/.ssh/known_hosts` pada host Gateway
    - keterbacaan jalur jarak jauh di Mac yang menjalankan Messages

  </Accordion>

  <Accordion title="Permintaan izin macOS terlewat">
    Jalankan ulang di terminal GUI interaktif dalam konteks pengguna/sesi yang sama dan setujui permintaan:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Konfirmasi Akses Disk Penuh + Otomasi diberikan untuk konteks proses yang menjalankan OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Tautan referensi konfigurasi

- [Referensi konfigurasi - iMessage](/id/gateway/config-channels#imessage)
- [Konfigurasi Gateway](/id/gateway/configuration)
- [Penyandingan](/id/channels/pairing)
- [BlueBubbles](/id/channels/bluebubbles)

## Terkait

- [Ikhtisar Saluran](/id/channels) — semua saluran yang didukung
- [Penyandingan](/id/channels/pairing) — autentikasi DM dan alur penyandingan
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan penyebutan
- [Perutean Saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan pengerasan
