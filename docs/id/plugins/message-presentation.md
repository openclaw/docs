---
read_when:
    - Menambahkan atau memodifikasi rendering kartu pesan, tombol, atau pilihan
    - Membangun Plugin saluran yang mendukung pesan keluar yang kaya
    - Mengubah presentasi alat pesan atau kemampuan pengiriman
    - Men-debug regresi perenderan kartu/blok/komponen khusus penyedia
summary: Kartu pesan semantik, tombol, pilihan, teks fallback, dan petunjuk pengiriman untuk Plugin channel
title: Penyajian pesan
x-i18n:
    generated_at: "2026-06-27T17:49:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fc5eca9dfe637fbdd56dcb473a68540035f8b990eab8cf139a4e27711536f57
    source_path: plugins/message-presentation.md
    workflow: 16
---

Presentasi pesan adalah kontrak bersama OpenClaw untuk UI obrolan keluar yang kaya.
Ini memungkinkan agen, perintah CLI, alur persetujuan, dan plugin mendeskripsikan intent pesan
sekali saja, sementara setiap plugin saluran merender bentuk native terbaik yang dapat dibuatnya.

Gunakan presentasi untuk UI pesan portabel:

- bagian teks
- teks konteks/footer kecil
- pemisah
- tombol
- menu pilihan
- judul dan tone kartu

Jangan tambahkan field native penyedia baru seperti Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card`, atau Feishu `card` ke tool pesan
bersama. Itu adalah output perender yang dimiliki oleh plugin saluran.

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

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
  url?: string;
  webApp?: { url: string };
  /** @deprecated Use webApp. Accepted for legacy JSON payloads only. */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
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

- `action.type: "command"` menjalankan perintah slash native melalui path perintah
  core. Gunakan ini untuk tombol dan menu perintah bawaan.
- `action.type: "callback"` membawa data plugin yang opaque melalui path
  interaksi saluran. Plugin saluran tidak boleh menafsirkan ulang data callback sebagai
  perintah slash.
- `value` adalah nilai callback opaque lama. Kontrol baru sebaiknya menggunakan `action`
  agar plugin saluran dapat memetakan perintah dan callback tanpa menebak dari teks.
- `url` adalah tombol tautan. Ini dapat ada tanpa `value`.
- `webApp` mendeskripsikan tombol aplikasi web native saluran. Telegram merender ini
  sebagai `web_app` dan hanya mendukungnya di obrolan privat. `web_app` masih
  diterima dalam payload JSON longgar untuk kompatibilitas, tetapi produsen TypeScript
  sebaiknya menggunakan `webApp`.
- `label` wajib ada dan juga digunakan dalam fallback teks.
- `style` bersifat anjuran. Perender sebaiknya memetakan gaya yang tidak didukung ke
  default yang aman, bukan menggagalkan pengiriman.
- `priority` bersifat opsional. Ketika saluran mengiklankan batas tindakan dan kontrol
  harus dibuang, core mempertahankan tombol berprioritas lebih tinggi terlebih dahulu dan mempertahankan
  urutan asli di antara tombol dengan prioritas yang sama. Ketika semua kontrol muat, urutan
  yang dibuat penulis dipertahankan.
- `disabled` bersifat opsional. Saluran harus ikut serta dengan `supportsDisabled`; jika tidak
  core menurunkan kontrol nonaktif menjadi teks fallback non-interaktif.
- `reusable` bersifat opsional. Saluran yang mendukung callback native yang dapat digunakan ulang dapat
  mempertahankan tindakan tetap tersedia setelah interaksi berhasil. Gunakan untuk
  tindakan berulang atau idempoten seperti refresh, inspect, atau detail lainnya;
  biarkan tidak disetel untuk persetujuan sekali pakai normal dan tindakan destruktif.

Semantik pilihan:

- `options[].action` memiliki makna perintah/callback yang sama dengan `action` tombol.
- `options[].value` adalah nilai aplikasi terpilih lama.
- `placeholder` bersifat anjuran dan dapat diabaikan oleh saluran tanpa dukungan
  pilihan native.
- Jika saluran tidak mendukung pilihan, teks fallback mencantumkan label.

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

Tombol Telegram Mini App:

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [{ "label": "Launch", "web_app": { "url": "https://example.com/app" } }]
    }
  ]
}
```

Menu pilihan:

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

## Kontrak perender

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
    limits: {
      actions: {
        maxActions: 25,
        maxActionsPerRow: 5,
        maxRows: 5,
        maxLabelLength: 80,
        maxValueBytes: 100,
        supportsStyles: true,
        supportsDisabled: false,
      },
      selects: {
        maxOptions: 25,
        maxLabelLength: 100,
        maxValueBytes: 100,
      },
      text: {
        maxLength: 2000,
        encoding: "characters",
        markdownDialect: "discord-markdown",
      },
    },
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

Boolean kapabilitas mendeskripsikan apa yang dapat dibuat interaktif oleh perender. `limits`
opsional mendeskripsikan envelope generik yang dapat disesuaikan core sebelum memanggil
perender:

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  limits?: {
    actions?: {
      maxActions?: number;
      maxActionsPerRow?: number;
      maxRows?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
      supportsStyles?: boolean;
      supportsDisabled?: boolean;
      supportsLayoutHints?: boolean;
    };
    selects?: {
      maxOptions?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
    };
    text?: {
      maxLength?: number;
      encoding?: "characters" | "utf8-bytes" | "utf16-units";
      markdownDialect?: "plain" | "markdown" | "html" | "slack-mrkdwn" | "discord-markdown";
      supportsEdit?: boolean;
    };
  };
};
```

Core menerapkan batas generik ke kontrol semantik sebelum rendering. Perender
tetap memiliki validasi dan pemotongan akhir yang spesifik penyedia untuk jumlah blok
native, ukuran kartu, batas URL, dan kekhasan penyedia yang tidak dapat diekspresikan dalam
kontrak generik. Jika batas menghapus setiap kontrol dari sebuah blok, core mempertahankan
label sebagai teks konteks non-interaktif sehingga pesan yang dikirim tetap memiliki
fallback yang terlihat.

## Alur render core

Ketika `ReplyPayload` atau tindakan pesan menyertakan `presentation`, core:

1. Menormalkan payload presentasi.
2. Menyelesaikan adapter keluar saluran target.
3. Membaca `presentationCapabilities`.
4. Menerapkan batas kapabilitas generik seperti jumlah tindakan, panjang label, dan
   jumlah opsi pilihan ketika adapter mengiklankannya.
5. Memanggil `renderPresentation` ketika adapter dapat merender payload.
6. Melakukan fallback ke teks konservatif ketika adapter tidak ada atau tidak dapat merender.
7. Mengirim payload hasil melalui path pengiriman saluran normal.
8. Menerapkan metadata pengiriman seperti `delivery.pin` setelah pesan pertama berhasil
   dikirim.

Core memiliki perilaku fallback sehingga produsen dapat tetap agnostik terhadap saluran. Plugin
saluran memiliki rendering native dan penanganan interaksi.

## Aturan degradasi

Presentasi harus aman dikirim di saluran terbatas.

Teks fallback mencakup:

- `title` sebagai baris pertama
- blok `text` sebagai paragraf normal
- blok `context` sebagai baris konteks ringkas
- blok `divider` sebagai pemisah visual
- label tombol, termasuk URL untuk tombol tautan
- label opsi pilihan

Kontrol native yang tidak didukung sebaiknya didegradasi, bukan menggagalkan seluruh pengiriman.
Contoh:

- Telegram dengan tombol inline dinonaktifkan mengirim fallback teks.
- Saluran tanpa dukungan pilihan mencantumkan opsi pilihan sebagai teks.
- Tombol khusus URL menjadi tombol tautan native atau baris URL fallback.
- Kegagalan pin opsional tidak menggagalkan pesan yang dikirim.

Pengecualian utamanya adalah `delivery.pin.required: true`; jika pinning diminta sebagai
wajib dan saluran tidak dapat memin pesan yang dikirim, pengiriman melaporkan kegagalan.

## Pemetaan penyedia

Perender bundel saat ini:

| Saluran         | Target render native                | Catatan                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Komponen dan kontainer komponen | Mempertahankan `channelData.discord.components` lama untuk produsen payload native penyedia yang sudah ada, tetapi pengiriman bersama baru sebaiknya menggunakan `presentation`. |
| Slack           | Block Kit                           | Mempertahankan `channelData.slack.blocks` lama untuk produsen payload native penyedia yang sudah ada, tetapi pengiriman bersama baru sebaiknya menggunakan `presentation`.       |
| Telegram        | Teks plus keyboard inline          | Tombol/pilihan memerlukan kapabilitas tombol inline untuk surface target; jika tidak, fallback teks digunakan.                                         |
| Mattermost      | Teks plus props interaktif         | Blok lain didegradasi menjadi teks.                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | Teks `message` polos disertakan bersama kartu ketika keduanya disediakan.                                                                            |
| Feishu          | Kartu interaktif                   | Header kartu dapat menggunakan `title`; body menghindari duplikasi judul tersebut.                                                                                  |
| Saluran biasa  | Fallback teks                       | Saluran tanpa perender tetap mendapatkan output yang dapat dibaca.                                                                                            |

Kompatibilitas payload native provider adalah kemudahan transisi untuk produsen
balasan yang sudah ada. Ini bukan alasan untuk menambahkan bidang native bersama
yang baru.

## Presentation vs InteractiveReply

`InteractiveReply` adalah subset internal lama yang digunakan oleh helper
persetujuan dan interaksi. Ini mendukung:

- teks
- tombol
- pilihan

`MessagePresentation` adalah kontrak pengiriman bersama kanonis. Ini menambahkan:

- judul
- nada
- konteks
- pembatas
- tombol khusus URL
- metadata pengiriman generik melalui `ReplyPayload.delivery`

Gunakan helper dari `openclaw/plugin-sdk/interactive-runtime` saat menjembatani
kode lama:

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Kode baru sebaiknya menerima atau menghasilkan `MessagePresentation` secara langsung. Payload
`interactive` yang sudah ada adalah subset usang dari `presentation`; dukungan
runtime tetap ada untuk produsen lama.

Tipe `InteractiveReply*` warisan dan helper konversi ditandai
`@deprecated` di SDK:

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock`, dan
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` dan
`presentationToInteractiveControlsReply(...)` tetap tersedia sebagai jembatan
perender untuk implementasi kanal warisan. Kode produsen baru sebaiknya tidak memanggil
keduanya; kirim `presentation` dan biarkan adaptasi inti/kanal menangani perenderan.

Helper persetujuan juga memiliki pengganti yang mengutamakan presentation:

- gunakan `buildApprovalPresentationFromActionDescriptors(...)` alih-alih
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- gunakan `buildApprovalPresentation(...)` alih-alih
  `buildApprovalInteractiveReply(...)`
- gunakan `buildExecApprovalPresentation(...)` alih-alih
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` mengembalikan string kosong untuk
blok presentation yang tidak memiliki fallback teks, seperti presentation yang hanya berisi
pembatas. Transport yang membutuhkan isi kiriman tidak kosong dapat meneruskan
`emptyFallback` untuk memilih isi minimal tanpa mengubah kontrak fallback default.

## Pin pengiriman

Penyematan adalah perilaku pengiriman, bukan presentation. Gunakan `delivery.pin` alih-alih
bidang native provider seperti `channelData.telegram.pin`.

Semantik:

- `pin: true` menyematkan pesan pertama yang berhasil dikirim.
- `pin.notify` default-nya adalah `false`.
- `pin.required` default-nya adalah `false`.
- Kegagalan penyematan opsional menurun dengan baik dan membiarkan pesan terkirim tetap utuh.
- Kegagalan penyematan wajib menggagalkan pengiriman.
- Pesan yang dipecah menjadi beberapa bagian menyematkan bagian pertama yang terkirim, bukan bagian terakhir.

Aksi pesan `pin`, `unpin`, dan `pins` manual tetap ada untuk pesan yang sudah ada
ketika provider mendukung operasi tersebut.

## Daftar periksa penulis Plugin

- Deklarasikan `presentation` dari `describeMessageTool(...)` ketika kanal dapat
  merender atau menurunkan presentation semantik dengan aman.
- Tambahkan `presentationCapabilities` ke adapter keluar runtime.
- Implementasikan `renderPresentation` di kode runtime, bukan kode penyiapan Plugin
  bidang kontrol.
- Jauhkan pustaka UI native dari jalur penyiapan/katalog panas.
- Deklarasikan batas kemampuan generik pada `presentationCapabilities.limits` ketika
  batas tersebut diketahui.
- Pertahankan batas platform final di perender dan pengujian.
- Tambahkan pengujian fallback untuk tombol yang tidak didukung, pilihan, tombol URL, duplikasi judul/teks,
  dan pengiriman campuran `message` plus `presentation`.
- Tambahkan dukungan pin pengiriman melalui `deliveryCapabilities.pin` dan
  `pinDeliveredMessage` hanya ketika provider dapat menyematkan id pesan yang terkirim.
- Jangan mengekspos bidang kartu/blok/komponen/tombol native provider baru melalui
  skema aksi pesan bersama.

## Dokumentasi terkait

- [CLI Pesan](/id/cli/message)
- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
- [Arsitektur Plugin](/id/plugins/architecture-internals#message-tool-schemas)
- [Rencana Refaktor Presentation Kanal](/id/plan/ui-channels)
