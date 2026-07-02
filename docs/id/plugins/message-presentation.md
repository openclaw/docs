---
read_when:
    - Menambahkan atau memodifikasi perenderan kartu pesan, tombol, atau pilihan
    - Membangun plugin kanal yang mendukung pesan keluar kaya
    - Mengubah presentasi alat pesan atau kemampuan pengiriman
    - Men-debug regresi perenderan kartu/blok/komponen khusus penyedia
summary: Kartu pesan semantik, tombol, pilihan, teks fallback, dan petunjuk pengiriman untuk plugin kanal
title: Penyajian pesan
x-i18n:
    generated_at: "2026-07-02T22:49:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5acb03b2aabcfefe4935440a3f799876afb3e9ee8c166704987f93f3667e68dd
    source_path: plugins/message-presentation.md
    workflow: 16
---

Presentasi pesan adalah kontrak bersama OpenClaw untuk UI chat keluar yang kaya.
Ini memungkinkan agen, perintah CLI, alur persetujuan, dan Plugin menjelaskan maksud
pesan sekali saja, sementara setiap Plugin kanal merender bentuk native terbaik yang bisa dibuatnya.

Gunakan presentasi untuk UI pesan portabel:

- bagian teks
- teks konteks/footer kecil
- pemisah
- tombol
- menu pilihan
- judul dan nada kartu

Jangan tambahkan bidang native penyedia baru seperti Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card`, atau Feishu `card` ke alat pesan
bersama. Itu adalah output perender yang dimiliki oleh Plugin kanal.

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

- `action.type: "command"` menjalankan perintah garis miring native melalui jalur
  perintah inti. Gunakan ini untuk tombol dan menu perintah bawaan.
- `action.type: "callback"` membawa data Plugin opak melalui jalur interaksi
  kanal. Plugin kanal tidak boleh menafsirkan ulang data callback sebagai perintah
  garis miring.
- `value` adalah nilai callback opak lama. Kontrol baru sebaiknya menggunakan `action`
  agar Plugin kanal dapat memetakan perintah dan callback tanpa menebak dari teks.
- `url` adalah tombol tautan. Ini dapat ada tanpa `value`.
- `webApp` menjelaskan tombol aplikasi web native kanal. Telegram merender ini
  sebagai `web_app` dan hanya mendukungnya di chat privat. `web_app` masih
  diterima dalam payload JSON longgar untuk kompatibilitas, tetapi produsen TypeScript
  sebaiknya menggunakan `webApp`.
- `label` wajib dan juga digunakan dalam fallback teks.
- `style` bersifat anjuran. Perender sebaiknya memetakan gaya yang tidak didukung ke
  default yang aman, bukan menggagalkan pengiriman.
- `priority` opsional. Saat kanal mengiklankan batas tindakan dan kontrol
  harus dibuang, inti mempertahankan tombol berprioritas lebih tinggi terlebih dahulu dan mempertahankan
  urutan asli di antara tombol dengan prioritas yang sama. Saat semua kontrol muat, urutan
  yang ditulis dipertahankan.
- `disabled` opsional. Kanal harus ikut serta dengan `supportsDisabled`; jika tidak,
  inti mendegradasi kontrol nonaktif menjadi teks fallback non-interaktif.
- `reusable` opsional. Kanal yang mendukung callback native yang dapat digunakan ulang dapat
  mempertahankan tindakan tetap tersedia setelah interaksi berhasil. Gunakan ini untuk
  tindakan yang dapat diulang atau idempoten seperti refresh, inspeksi, atau detail lainnya;
  biarkan tidak diatur untuk persetujuan sekali pakai normal dan tindakan destruktif.

Semantik pilihan:

- `options[].action` memiliki arti perintah/callback yang sama seperti tombol `action`.
- `options[].value` adalah nilai aplikasi terpilih lama.
- `placeholder` bersifat anjuran dan dapat diabaikan oleh kanal tanpa dukungan pilihan
  native.
- Jika kanal tidak mendukung pilihan, teks fallback mencantumkan label.

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

Tombol tautan hanya URL:

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

Plugin kanal mendeklarasikan dukungan render pada adaptor keluar mereka:

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

Boolean kapabilitas menjelaskan apa yang dapat dibuat interaktif oleh perender. `limits`
opsional menjelaskan amplop generik yang dapat diadaptasi inti sebelum memanggil
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

Inti menerapkan batas generik ke kontrol semantik sebelum rendering. Perender
tetap memiliki validasi dan pemotongan khusus penyedia akhir untuk jumlah blok
native, ukuran kartu, batas URL, dan kekhasan penyedia yang tidak dapat diungkapkan dalam
kontrak generik. Jika batas menghapus setiap kontrol dari sebuah blok, inti mempertahankan
label sebagai teks konteks non-interaktif sehingga pesan yang dikirim tetap memiliki
fallback yang terlihat.

## Alur render inti

Saat `ReplyPayload` atau tindakan pesan menyertakan `presentation`, inti:

1. Menormalkan payload presentasi.
2. Menyelesaikan adaptor keluar kanal target.
3. Membaca `presentationCapabilities`.
4. Menerapkan batas kapabilitas generik seperti jumlah tindakan, panjang label, dan
   jumlah opsi pilihan saat adaptor mengiklankannya.
5. Memanggil `renderPresentation` saat adaptor dapat merender payload.
6. Beralih ke teks konservatif saat adaptor tidak ada atau tidak dapat merender.
7. Mengirim payload yang dihasilkan melalui jalur pengiriman kanal normal.
8. Menerapkan metadata pengiriman seperti `delivery.pin` setelah pesan terkirim
   pertama berhasil.

Inti memiliki perilaku fallback sehingga produsen dapat tetap agnostik terhadap kanal. Plugin
kanal memiliki rendering native dan penanganan interaksi.

## Aturan degradasi

Presentasi harus aman untuk dikirim pada kanal terbatas.

Teks fallback menyertakan:

- `title` sebagai baris pertama
- blok `text` sebagai paragraf normal
- blok `context` sebagai baris konteks ringkas
- blok `divider` sebagai pemisah visual
- label tombol, termasuk URL untuk tombol tautan
- label opsi pilihan

### Visibilitas fallback nilai tombol

Saat kanal tidak dapat merender kontrol interaktif, nilai tombol dan pilihan
beralih ke teks biasa. Perilaku fallback mempertahankan kegunaan sambil
menjaga data callback opak tetap privat:

- Tindakan bertipe **`command`** dirender sebagai `label: \`command\`` sehingga pengguna dapat
  menyalin perintah dan menjalankannya secara manual di input kanal.
- Tindakan bertipe **`callback`** dan bidang **`value`** lama dirender sebagai
  hanya label. Nilai callback opak tidak diekspos dalam teks fallback.
- Tombol **`url` / `webApp`** merender teks URL bersama label
  tombol, karena URL ditujukan untuk pengguna.
- **Opsi pilihan** dirender sebagai hanya label. Nilai opsi yang mendasarinya tidak
  diekspos dalam teks fallback.

Adaptor kanal yang menambahkan panduan perintah manual di UI fallback mereka (misalnya
instruksi komentar dokumen Feishu) harus menurunkan pemeriksaan keberadaan perintah
dari blok presentasi yang sama dengan yang digunakan perender fallback, sehingga
teks panduan hanya muncul saat perintah manual benar-benar ditampilkan.

Kontrol native yang tidak didukung sebaiknya didegradasi, bukan menggagalkan seluruh pengiriman.
Contoh:

- Telegram dengan tombol inline dinonaktifkan mengirim fallback teks.
- Kanal tanpa dukungan pilihan mencantumkan opsi pilihan sebagai teks.
- Tombol hanya URL menjadi tombol tautan native atau baris URL fallback.
- Kegagalan pin opsional tidak menggagalkan pesan yang dikirim.

Pengecualian utama adalah `delivery.pin.required: true`; jika penyematan diminta sebagai
wajib dan kanal tidak dapat menyematkan pesan terkirim, pengiriman melaporkan kegagalan.

## Pemetaan penyedia

Perender bawaan saat ini:

| Saluran         | Target render native                | Catatan                                                                                                                                           |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Komponen dan kontainer komponen     | Mempertahankan `channelData.discord.components` lama untuk produsen payload native-penyedia yang ada, tetapi pengiriman bersama baru harus menggunakan `presentation`. |
| Slack           | Block Kit                           | Mempertahankan `channelData.slack.blocks` lama untuk produsen payload native-penyedia yang ada, tetapi pengiriman bersama baru harus menggunakan `presentation`.       |
| Telegram        | Teks plus keyboard inline           | Tombol/pilihan memerlukan kapabilitas tombol inline untuk permukaan target; jika tidak, fallback teks digunakan.                                  |
| Mattermost      | Teks plus properti interaktif       | Blok lain diturunkan menjadi teks.                                                                                                                |
| Microsoft Teams | Adaptive Cards                      | Teks `message` biasa disertakan bersama kartu ketika keduanya disediakan.                                                                         |
| Feishu          | Kartu interaktif                    | Header kartu dapat menggunakan `title`; isi menghindari duplikasi judul tersebut.                                                                 |
| Saluran biasa   | Fallback teks                       | Saluran tanpa renderer tetap mendapatkan keluaran yang dapat dibaca.                                                                              |

Kompatibilitas payload native-penyedia adalah kemudahan transisi untuk produsen
balasan yang ada. Ini bukan alasan untuk menambahkan field native bersama baru.

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
- pemisah
- tombol khusus URL
- metadata pengiriman generik melalui `ReplyPayload.delivery`

Gunakan helper dari `openclaw/plugin-sdk/interactive-runtime` saat menjembatani
kode lama:
__OC_I18N_900011__
Kode baru harus menerima atau menghasilkan `MessagePresentation` secara langsung.
Payload `interactive` yang ada adalah subset usang dari `presentation`; dukungan
runtime tetap ada untuk produsen lama.

Tipe `InteractiveReply*` lama dan helper konversi ditandai
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
renderer untuk implementasi saluran lama. Kode produsen baru tidak boleh
memanggilnya; kirim `presentation` dan biarkan adaptasi inti/saluran menangani rendering.

Helper persetujuan juga memiliki pengganti yang mengutamakan presentation:

- gunakan `buildApprovalPresentationFromActionDescriptors(...)` alih-alih
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- gunakan `buildApprovalPresentation(...)` alih-alih
  `buildApprovalInteractiveReply(...)`
- gunakan `buildExecApprovalPresentation(...)` alih-alih
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` mengembalikan string kosong untuk
blok presentation yang tidak memiliki fallback teks, seperti presentation yang
hanya berisi pemisah. Transport yang memerlukan isi pengiriman yang tidak kosong
dapat meneruskan `emptyFallback` untuk memilih isi minimal tanpa mengubah kontrak
fallback default.

## Pin pengiriman

Penyematan adalah perilaku pengiriman, bukan presentation. Gunakan `delivery.pin`
alih-alih field native-penyedia seperti `channelData.telegram.pin`.

Semantik:

- `pin: true` menyematkan pesan pertama yang berhasil dikirim.
- `pin.notify` default-nya adalah `false`.
- `pin.required` default-nya adalah `false`.
- Kegagalan pin opsional diturunkan dan membiarkan pesan terkirim tetap utuh.
- Kegagalan pin wajib menggagalkan pengiriman.
- Pesan yang dipecah menyematkan potongan pertama yang terkirim, bukan potongan akhir.

Aksi pesan manual `pin`, `unpin`, dan `pins` tetap ada untuk pesan yang sudah ada
ketika penyedia mendukung operasi tersebut.

## Checklist penulis Plugin

- Deklarasikan `presentation` dari `describeMessageTool(...)` ketika saluran dapat
  merender atau menurunkan presentation semantik dengan aman.
- Tambahkan `presentationCapabilities` ke adaptor outbound runtime.
- Implementasikan `renderPresentation` di kode runtime, bukan kode setup Plugin
  control-plane.
- Jauhkan pustaka UI native dari jalur setup/katalog yang panas.
- Deklarasikan batas kapabilitas generik pada `presentationCapabilities.limits` ketika
  batas tersebut diketahui.
- Pertahankan batas platform final di renderer dan pengujian.
- Tambahkan pengujian fallback untuk tombol yang tidak didukung, pilihan, tombol URL, duplikasi judul/teks,
  dan pengiriman campuran `message` plus `presentation`.
- Tambahkan dukungan pin pengiriman melalui `deliveryCapabilities.pin` dan
  `pinDeliveredMessage` hanya ketika penyedia dapat menyematkan id pesan yang dikirim.
- Jangan mengekspos field kartu/blok/komponen/tombol native-penyedia baru melalui
  skema aksi pesan bersama.

## Dokumen terkait

- [CLI Pesan](/id/cli/message)
- [Ringkasan SDK Plugin](/id/plugins/sdk-overview)
- [Arsitektur Plugin](/id/plugins/architecture-internals#message-tool-schemas)
- [Rencana Refaktor Presentation Saluran](/id/plan/ui-channels)
