---
read_when:
    - Menambahkan atau mengubah rendering kartu pesan, tombol, atau select
    - Membangun plugin saluran yang mendukung pesan keluar yang kaya
    - Mengubah presentasi alat pesan atau kapabilitas pengiriman
    - Men-debug regresi rendering kartu/blok/komponen khusus provider
summary: Kartu pesan semantik, tombol, select, teks fallback, dan petunjuk pengiriman untuk plugin saluran
title: Presentasi pesan
x-i18n:
    generated_at: "2026-04-24T09:19:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c8c3903101310de330017b34bc2f0d641f4c8ea2b80a30532736b4409716510
    source_path: plugins/message-presentation.md
    workflow: 15
---

Presentasi pesan adalah kontrak bersama OpenClaw untuk UI chat keluar yang kaya.
Ini memungkinkan agen, perintah CLI, alur persetujuan, dan plugin mendeskripsikan
niat pesan satu kali, sementara setiap plugin saluran merender bentuk native terbaik yang didukungnya.

Gunakan presentasi untuk UI pesan yang portabel:

- bagian teks
- teks konteks/footer kecil
- pemisah
- tombol
- menu select
- judul kartu dan tone

Jangan tambahkan field native provider baru seperti Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card`, atau Feishu `card` ke
alat pesan bersama. Itu adalah output renderer yang dimiliki oleh plugin saluran.

## Kontrak

Penulis plugin mengimpor kontrak publik dari:

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

- `value` adalah nilai aksi aplikasi yang dirutekan kembali melalui
  jalur interaksi saluran yang sudah ada ketika saluran mendukung kontrol yang dapat diklik.
- `url` adalah tombol tautan. Ini dapat ada tanpa `value`.
- `label` wajib dan juga digunakan dalam fallback teks.
- `style` bersifat advisory. Renderer sebaiknya memetakan style yang tidak didukung ke default yang aman, bukan membuat pengiriman gagal.

Semantik select:

- `options[].value` adalah nilai aplikasi yang dipilih.
- `placeholder` bersifat advisory dan dapat diabaikan oleh saluran tanpa dukungan select native.
- Jika saluran tidak mendukung select, fallback teks menampilkan label-labelnya.

## Contoh producer

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

Tombol tautan hanya-URL:

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

Pengiriman yang disematkan:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Pengiriman yang disematkan dengan JSON eksplisit:

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

Plugin saluran mendeklarasikan dukungan render pada adapter keluar mereka:

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

Field kapabilitas sengaja dibuat sebagai boolean sederhana. Field ini menjelaskan apa yang
dapat dibuat interaktif oleh renderer, bukan setiap batas platform native. Renderer tetap
memiliki batas khusus platform seperti jumlah tombol maksimum, jumlah blok, dan ukuran kartu.

## Alur render core

Ketika `ReplyPayload` atau tindakan pesan menyertakan `presentation`, core:

1. Menormalkan payload presentasi.
2. Menyelesaikan adapter keluar saluran target.
3. Membaca `presentationCapabilities`.
4. Memanggil `renderPresentation` ketika adapter dapat merender payload.
5. Melakukan fallback ke teks konservatif ketika adapter tidak ada atau tidak dapat merender.
6. Mengirim payload yang dihasilkan melalui jalur pengiriman saluran normal.
7. Menerapkan metadata pengiriman seperti `delivery.pin` setelah pesan pertama berhasil
   dikirim.

Core memiliki perilaku fallback sehingga producer dapat tetap agnostik terhadap saluran. Plugin
saluran memiliki rendering native dan penanganan interaksi.

## Aturan degradasi

Presentasi harus aman untuk dikirim pada saluran yang terbatas.

Fallback teks mencakup:

- `title` sebagai baris pertama
- blok `text` sebagai paragraf normal
- blok `context` sebagai baris konteks ringkas
- blok `divider` sebagai pemisah visual
- label tombol, termasuk URL untuk tombol tautan
- label opsi select

Kontrol native yang tidak didukung sebaiknya mengalami degradasi alih-alih menggagalkan seluruh pengiriman.
Contoh:

- Telegram dengan tombol inline dinonaktifkan mengirim fallback teks.
- Saluran tanpa dukungan select menampilkan opsi select sebagai teks.
- Tombol hanya-URL menjadi tombol tautan native atau baris URL fallback.
- Kegagalan pin opsional tidak menggagalkan pesan yang telah terkirim.

Pengecualian utamanya adalah `delivery.pin.required: true`; jika pin diminta sebagai
wajib dan saluran tidak dapat menyematkan pesan yang dikirim, pengiriman dilaporkan gagal.

## Pemetaan provider

Renderer bawaan saat ini:

| Saluran         | Target render native                | Catatan                                                                                                                                            |
| --------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components dan component containers | Mempertahankan `channelData.discord.components` lama untuk producer payload native provider yang sudah ada, tetapi pengiriman bersama baru sebaiknya menggunakan `presentation`. |
| Slack           | Block Kit                           | Mempertahankan `channelData.slack.blocks` lama untuk producer payload native provider yang sudah ada, tetapi pengiriman bersama baru sebaiknya menggunakan `presentation`.      |
| Telegram        | Teks plus inline keyboard           | Tombol/select memerlukan kapabilitas tombol inline untuk permukaan target; jika tidak, fallback teks digunakan.                                   |
| Mattermost      | Teks plus interactive props         | Blok lain mengalami degradasi menjadi teks.                                                                                                        |
| Microsoft Teams | Adaptive Cards                      | Teks `message` biasa disertakan bersama kartu ketika keduanya diberikan.                                                                           |
| Feishu          | Kartu interaktif                    | Header kartu dapat menggunakan `title`; isi menghindari penduplikasian judul tersebut.                                                            |
| Saluran biasa   | Fallback teks                       | Saluran tanpa renderer tetap mendapatkan output yang dapat dibaca.                                                                                 |

Kompatibilitas payload native provider adalah kemudahan transisi untuk producer
balasan yang sudah ada. Ini bukan alasan untuk menambahkan field native bersama yang baru.

## Presentation vs InteractiveReply

`InteractiveReply` adalah subset internal lama yang digunakan oleh helper persetujuan dan interaksi. Ini mendukung:

- teks
- tombol
- select

`MessagePresentation` adalah kontrak pengiriman bersama yang kanonis. Ini menambahkan:

- judul
- tone
- konteks
- pemisah
- tombol hanya-URL
- metadata pengiriman generik melalui `ReplyPayload.delivery`

Gunakan helper dari `openclaw/plugin-sdk/interactive-runtime` saat menjembatani kode lama:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Kode baru sebaiknya menerima atau menghasilkan `MessagePresentation` secara langsung.

## Delivery Pin

Pinning adalah perilaku pengiriman, bukan presentasi. Gunakan `delivery.pin` alih-alih
field native provider seperti `channelData.telegram.pin`.

Semantik:

- `pin: true` menyematkan pesan pertama yang berhasil dikirim.
- `pin.notify` default-nya `false`.
- `pin.required` default-nya `false`.
- Kegagalan pin opsional mengalami degradasi dan membiarkan pesan terkirim tetap utuh.
- Kegagalan pin yang diwajibkan membuat pengiriman gagal.
- Pesan yang dipecah (chunked) menyematkan potongan pertama yang dikirim, bukan potongan terakhir.

Tindakan pesan manual `pin`, `unpin`, dan `pins` tetap ada untuk pesan yang sudah ada
ketika provider mendukung operasi tersebut.

## Checklist penulis plugin

- Deklarasikan `presentation` dari `describeMessageTool(...)` ketika saluran dapat
  merender atau dengan aman mendegradasikan presentasi semantik.
- Tambahkan `presentationCapabilities` ke adapter keluar runtime.
- Implementasikan `renderPresentation` dalam kode runtime, bukan pada kode
  setup plugin control-plane.
- Jauhkan library UI native dari jalur setup/katalog hot.
- Pertahankan batas platform di renderer dan pengujian.
- Tambahkan pengujian fallback untuk tombol yang tidak didukung, select, tombol URL, duplikasi title/text, dan pengiriman campuran `message` plus `presentation`.
- Tambahkan dukungan delivery pin melalui `deliveryCapabilities.pin` dan
  `pinDeliveredMessage` hanya ketika provider dapat menyematkan id pesan yang dikirim.
- Jangan mengekspos field kartu/blok/komponen/tombol native provider baru melalui
  skema tindakan pesan bersama.

## Dokumen terkait

- [CLI pesan](/id/cli/message)
- [Ikhtisar Plugin SDK](/id/plugins/sdk-overview)
- [Arsitektur Plugin](/id/plugins/architecture-internals#message-tool-schemas)
- [Rencana Refactor Presentasi Saluran](/id/plan/ui-channels)
