---
read_when:
    - Menambahkan atau memodifikasi perenderan kartu pesan, tombol, atau pilihan
    - Membangun Plugin saluran yang mendukung pesan keluar berformat kaya
    - Mengubah penyajian alat pesan atau kemampuan pengiriman
    - Men-debug regresi rendering kartu/blok/komponen khusus penyedia
summary: Kartu pesan semantik, tombol, menu pilihan, teks cadangan, dan petunjuk pengiriman untuk Plugin saluran
title: Penyajian pesan
x-i18n:
    generated_at: "2026-04-30T10:02:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23ef0eab890ee174c1433f72e84932a84a481f2bcf4b69bc793a2660ec94b10c
    source_path: plugins/message-presentation.md
    workflow: 16
---

Presentasi pesan adalah kontrak bersama OpenClaw untuk UI chat keluar yang kaya.
Ini memungkinkan agen, perintah CLI, alur persetujuan, dan plugin mendeskripsikan
maksud pesan satu kali, sementara setiap plugin channel merender bentuk native
terbaik yang bisa dibuatnya.

Gunakan presentation untuk UI pesan portabel:

- bagian teks
- teks konteks/footer kecil
- pembagi
- tombol
- menu pilih
- judul kartu dan tone

Jangan tambahkan field native provider baru seperti Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card`, atau Feishu `card` ke message tool
bersama. Itu adalah keluaran renderer yang dimiliki oleh plugin channel.

## Kontrak

Penulis Plugin mengimpor kontrak publik dari:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Bentuk:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};

type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

Semantik tombol:

- `value` adalah nilai tindakan aplikasi yang dirutekan kembali melalui jalur
  interaksi channel yang sudah ada saat channel mendukung kontrol yang dapat diklik.
- `url` adalah tombol tautan. Ini dapat ada tanpa `value`.
- `label` wajib dan juga digunakan dalam fallback teks.
- `style` bersifat saran. Renderer harus memetakan gaya yang tidak didukung ke
  default yang aman, bukan menggagalkan pengiriman.

Semantik select:

- `options[].value` adalah nilai aplikasi yang dipilih.
- `placeholder` bersifat saran dan dapat diabaikan oleh channel tanpa dukungan
  select native.
- Jika sebuah channel tidak mendukung select, teks fallback mencantumkan labelnya.

## Contoh produsen

Kartu sederhana:

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

Tombol tautan khusus URL:

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

Menu select:

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

Pengiriman CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

Pengiriman yang dipin:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Pengiriman yang dipin dengan JSON eksplisit:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Kontrak renderer

Plugin channel mendeklarasikan dukungan render pada adapter keluar mereka:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

Field kapabilitas sengaja berupa boolean sederhana. Field ini menjelaskan apa yang
dapat dibuat interaktif oleh renderer, bukan setiap batasan platform native.
Renderer tetap memiliki batasan khusus platform seperti jumlah tombol maksimum,
jumlah blok, dan ukuran kartu.

## Alur render inti

Saat `ReplyPayload` atau tindakan pesan menyertakan `presentation`, core:

1. Menormalisasi payload presentation.
2. Menyelesaikan adapter keluar channel target.
3. Membaca `presentationCapabilities`.
4. Memanggil `renderPresentation` saat adapter dapat merender payload.
5. Kembali ke teks konservatif saat adapter tidak ada atau tidak dapat merender.
6. Mengirim payload yang dihasilkan melalui jalur pengiriman channel normal.
7. Menerapkan metadata pengiriman seperti `delivery.pin` setelah pesan pertama
   berhasil terkirim.

Core memiliki perilaku fallback agar produsen dapat tetap agnostik terhadap
channel. Plugin channel memiliki rendering native dan penanganan interaksi.

## Aturan degradasi

Presentation harus aman dikirim di channel terbatas.

Teks fallback mencakup:

- `title` sebagai baris pertama
- blok `text` sebagai paragraf normal
- blok `context` sebagai baris konteks ringkas
- blok `divider` sebagai pemisah visual
- label tombol, termasuk URL untuk tombol tautan
- label opsi select

Kontrol native yang tidak didukung harus terdegradasi, bukan menggagalkan seluruh
pengiriman. Contoh:

- Telegram dengan tombol inline dinonaktifkan mengirim fallback teks.
- Channel tanpa dukungan select mencantumkan opsi select sebagai teks.
- Tombol khusus URL menjadi tombol tautan native atau baris URL fallback.
- Kegagalan pin opsional tidak menggagalkan pesan yang terkirim.

Pengecualian utama adalah `delivery.pin.required: true`; jika pinning diminta
sebagai wajib dan channel tidak dapat menyematkan pesan yang dikirim, pengiriman
melaporkan kegagalan.

## Pemetaan provider

Renderer bundled saat ini:

| Channel         | Target render native                | Catatan                                                                                                                                                    |
| --------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Komponen dan kontainer komponen     | Mempertahankan `channelData.discord.components` lama untuk produsen payload native provider yang sudah ada, tetapi pengiriman bersama baru harus menggunakan `presentation`. |
| Slack           | Block Kit                           | Mempertahankan `channelData.slack.blocks` lama untuk produsen payload native provider yang sudah ada, tetapi pengiriman bersama baru harus menggunakan `presentation`.       |
| Telegram        | Teks plus keyboard inline           | Tombol/select memerlukan kapabilitas tombol inline untuk surface target; jika tidak, fallback teks digunakan.                                              |
| Mattermost      | Teks plus prop interaktif           | Blok lain terdegradasi menjadi teks.                                                                                                                       |
| Microsoft Teams | Adaptive Cards                      | Teks `message` polos disertakan bersama kartu saat keduanya diberikan.                                                                                     |
| Feishu          | Kartu interaktif                    | Header kartu dapat menggunakan `title`; body menghindari duplikasi judul tersebut.                                                                         |
| Channel polos   | Fallback teks                       | Channel tanpa renderer tetap mendapatkan keluaran yang dapat dibaca.                                                                                       |

Kompatibilitas payload native provider adalah kemudahan transisi untuk produsen
reply yang sudah ada. Itu bukan alasan untuk menambahkan field native bersama
baru.

## Presentation vs InteractiveReply

`InteractiveReply` adalah subset internal lama yang digunakan oleh helper
persetujuan dan interaksi. Ini mendukung:

- teks
- tombol
- select

`MessagePresentation` adalah kontrak pengiriman bersama kanonis. Ini menambahkan:

- judul
- tone
- konteks
- pembagi
- tombol khusus URL
- metadata pengiriman generik melalui `ReplyPayload.delivery`

Gunakan helper dari `openclaw/plugin-sdk/interactive-runtime` saat menjembatani
kode lama:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Kode baru harus menerima atau menghasilkan `MessagePresentation` secara langsung.

## Pin pengiriman

Pinning adalah perilaku pengiriman, bukan presentation. Gunakan `delivery.pin`
alih-alih field native provider seperti `channelData.telegram.pin`.

Semantik:

- `pin: true` menyematkan pesan pertama yang berhasil dikirim.
- `pin.notify` default ke `false`.
- `pin.required` default ke `false`.
- Kegagalan pin opsional terdegradasi dan membiarkan pesan terkirim tetap utuh.
- Kegagalan pin wajib menggagalkan pengiriman.
- Pesan yang dipecah menjadi chunk menyematkan chunk pertama yang dikirim, bukan chunk akhir.

Tindakan pesan manual `pin`, `unpin`, dan `pins` tetap ada untuk pesan yang
sudah ada saat provider mendukung operasi tersebut.

## Checklist penulis Plugin

- Deklarasikan `presentation` dari `describeMessageTool(...)` saat channel dapat
  merender atau mendegradasi presentation semantik dengan aman.
- Tambahkan `presentationCapabilities` ke adapter keluar runtime.
- Implementasikan `renderPresentation` dalam kode runtime, bukan kode penyiapan
  plugin control-plane.
- Jauhkan pustaka UI native dari jalur penyiapan/katalog yang panas.
- Pertahankan batasan platform dalam renderer dan pengujian.
- Tambahkan pengujian fallback untuk tombol yang tidak didukung, select, tombol URL, duplikasi judul/teks,
  dan pengiriman campuran `message` plus `presentation`.
- Tambahkan dukungan pin pengiriman melalui `deliveryCapabilities.pin` dan
  `pinDeliveredMessage` hanya saat provider dapat menyematkan id pesan yang dikirim.
- Jangan mengekspos field kartu/blok/komponen/tombol native provider baru melalui
  skema tindakan pesan bersama.

## Dokumen terkait

- [CLI Pesan](/id/cli/message)
- [Ikhtisar Plugin SDK](/id/plugins/sdk-overview)
- [Arsitektur Plugin](/id/plugins/architecture-internals#message-tool-schemas)
- [Rencana Refactor Presentation Channel](/id/plan/ui-channels)
