---
read_when:
    - Menambahkan atau memodifikasi perenderan kartu pesan, tombol, atau pemilih
    - Membangun Plugin saluran yang mendukung pesan keluar kaya konten
    - Mengubah penyajian alat pesan atau kemampuan pengiriman
    - Men-debug regresi perenderan kartu/blok/komponen khusus penyedia
summary: Kartu pesan semantik, tombol, pilihan, teks cadangan, dan petunjuk pengiriman untuk plugin kanal
title: Penyajian pesan
x-i18n:
    generated_at: "2026-05-10T19:44:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3b6fc82b5faaff50e8c58f2c68e14a6a1b30ccf1d8dba7da8164dbec5ebe1b0
    source_path: plugins/message-presentation.md
    workflow: 16
---

Presentasi pesan adalah kontrak bersama OpenClaw untuk UI chat keluar yang kaya.
Ini memungkinkan agen, perintah CLI, alur persetujuan, dan Plugin mendeskripsikan
maksud pesan satu kali, sementara setiap Plugin saluran merender bentuk native
terbaik yang dapat dilakukannya.

Gunakan presentasi untuk UI pesan portabel:

- bagian teks
- teks konteks/footer kecil
- pemisah
- tombol
- menu pilihan
- judul kartu dan nada

Jangan tambahkan field native penyedia baru seperti Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card`, atau Feishu `card` ke alat pesan
bersama. Itu adalah output renderer yang dimiliki oleh Plugin saluran.

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
  interaksi saluran yang sudah ada ketika saluran mendukung kontrol yang dapat diklik.
- `url` adalah tombol tautan. Ini dapat ada tanpa `value`.
- `label` wajib dan juga digunakan dalam fallback teks.
- `style` bersifat saran. Renderer harus memetakan gaya yang tidak didukung ke
  default yang aman, bukan menggagalkan pengiriman.

Semantik pilihan:

- `options[].value` adalah nilai aplikasi yang dipilih.
- `placeholder` bersifat saran dan dapat diabaikan oleh saluran tanpa dukungan
  pilihan native.
- Jika saluran tidak mendukung pilihan, fallback teks mencantumkan label.

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

Plugin saluran mendeklarasikan dukungan render pada adaptor keluar mereka:

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

Field kapabilitas sengaja berupa boolean sederhana. Field tersebut mendeskripsikan
apa yang dapat dibuat interaktif oleh renderer, bukan setiap batas platform
native. Renderer tetap memiliki batas khusus platform seperti jumlah tombol
maksimum, jumlah blok, dan ukuran kartu.

## Alur render inti

Ketika `ReplyPayload` atau tindakan pesan menyertakan `presentation`, inti:

1. Menormalkan payload presentasi.
2. Menyelesaikan adaptor keluar saluran target.
3. Membaca `presentationCapabilities`.
4. Memanggil `renderPresentation` ketika adaptor dapat merender payload.
5. Beralih ke teks konservatif ketika adaptor tidak ada atau tidak dapat merender.
6. Mengirim payload yang dihasilkan melalui jalur pengiriman saluran normal.
7. Menerapkan metadata pengiriman seperti `delivery.pin` setelah pesan terkirim
   pertama berhasil.

Inti memiliki perilaku fallback sehingga produsen dapat tetap agnostik terhadap
saluran. Plugin saluran memiliki rendering native dan penanganan interaksi.

## Aturan degradasi

Presentasi harus aman dikirim pada saluran terbatas.

Teks fallback mencakup:

- `title` sebagai baris pertama
- blok `text` sebagai paragraf normal
- blok `context` sebagai baris konteks ringkas
- blok `divider` sebagai pemisah visual
- label tombol, termasuk URL untuk tombol tautan
- label opsi pilihan

Kontrol native yang tidak didukung harus terdegradasi, bukan menggagalkan seluruh
pengiriman. Contoh:

- Telegram dengan tombol inline dinonaktifkan mengirim fallback teks.
- Saluran tanpa dukungan pilihan mencantumkan opsi pilihan sebagai teks.
- Tombol hanya URL menjadi tombol tautan native atau baris URL fallback.
- Kegagalan penyematan opsional tidak menggagalkan pesan yang sudah terkirim.

Pengecualian utamanya adalah `delivery.pin.required: true`; jika penyematan diminta
sebagai wajib dan saluran tidak dapat menyematkan pesan terkirim, pengiriman
melaporkan kegagalan.

## Pemetaan penyedia

Renderer bawaan saat ini:

| Saluran         | Target render native                | Catatan                                                                                                                                           |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Komponen dan kontainer komponen     | Mempertahankan `channelData.discord.components` legacy untuk produsen payload native penyedia yang sudah ada, tetapi pengiriman bersama baru harus menggunakan `presentation`. |
| Slack           | Block Kit                           | Mempertahankan `channelData.slack.blocks` legacy untuk produsen payload native penyedia yang sudah ada, tetapi pengiriman bersama baru harus menggunakan `presentation`. |
| Telegram        | Teks plus keyboard inline           | Tombol/pilihan memerlukan kapabilitas tombol inline untuk permukaan target; jika tidak, fallback teks digunakan.                                  |
| Mattermost      | Teks plus prop interaktif           | Blok lain terdegradasi menjadi teks.                                                                                                              |
| Microsoft Teams | Adaptive Cards                      | Teks `message` biasa disertakan dengan kartu ketika keduanya disediakan.                                                                          |
| Feishu          | Kartu interaktif                    | Header kartu dapat menggunakan `title`; isi menghindari duplikasi judul tersebut.                                                                 |
| Saluran biasa   | Fallback teks                       | Saluran tanpa renderer tetap mendapatkan output yang dapat dibaca.                                                                                |

Kompatibilitas payload native penyedia adalah kemudahan transisi untuk produsen
balasan yang sudah ada. Itu bukan alasan untuk menambahkan field native bersama baru.

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
- tombol hanya URL
- metadata pengiriman generik melalui `ReplyPayload.delivery`

Gunakan helper dari `openclaw/plugin-sdk/interactive-runtime` ketika menjembatani
kode lama:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Kode baru harus menerima atau menghasilkan `MessagePresentation` secara langsung.

`presentationToInteractiveReply(...)` mempertahankan teks presentasi yang terlihat
dengan memetakan judul, teks, konteks, tombol, dan pilihan ke bentuk
`InteractiveReply` lama. Renderer komponen yang sudah menggambar blok judul,
teks, konteks, dan pemisah secara native harus menggunakan
`presentationToInteractiveControlsReply(...)` sebagai gantinya, lalu hanya
menambahkan kontrol tombol dan pilihan.

`renderMessagePresentationFallbackText(...)` mengembalikan string kosong untuk
blok presentasi yang tidak memiliki fallback teks, seperti presentasi yang hanya
berisi pemisah. Transport yang memerlukan isi pengiriman tidak kosong dapat
meneruskan `emptyFallback` untuk memilih isi minimal tanpa mengubah kontrak
fallback default.

## Penyematan pengiriman

Penyematan adalah perilaku pengiriman, bukan presentasi. Gunakan `delivery.pin`
alih-alih field native penyedia seperti `channelData.telegram.pin`.

Semantik:

- `pin: true` menyematkan pesan pertama yang berhasil dikirim.
- `pin.notify` default ke `false`.
- `pin.required` default ke `false`.
- Kegagalan penyematan opsional terdegradasi dan membiarkan pesan terkirim tetap utuh.
- Kegagalan penyematan wajib menggagalkan pengiriman.
- Pesan yang dipecah menyematkan potongan pertama yang terkirim, bukan potongan akhir.

Tindakan pesan manual `pin`, `unpin`, dan `pins` tetap ada untuk pesan yang sudah
ada ketika penyedia mendukung operasi tersebut.

## Daftar periksa penulis Plugin

- Deklarasikan `presentation` dari `describeMessageTool(...)` ketika saluran dapat
  merender atau mendegradasikan presentasi semantik dengan aman.
- Tambahkan `presentationCapabilities` ke adaptor keluar runtime.
- Implementasikan `renderPresentation` dalam kode runtime, bukan kode penyiapan
  Plugin control-plane.
- Jauhkan pustaka UI native dari jalur penyiapan/katalog yang panas.
- Pertahankan batas platform dalam renderer dan pengujian.
- Tambahkan pengujian fallback untuk tombol yang tidak didukung, pilihan, tombol
  URL, duplikasi judul/teks, dan pengiriman campuran `message` plus `presentation`.
- Tambahkan dukungan penyematan pengiriman melalui `deliveryCapabilities.pin` dan
  `pinDeliveredMessage` hanya ketika penyedia dapat menyematkan id pesan terkirim.
- Jangan mengekspos field kartu/blok/komponen/tombol native penyedia baru melalui
  skema tindakan pesan bersama.

## Dokumen terkait

- [CLI Pesan](/id/cli/message)
- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
- [Arsitektur Plugin](/id/plugins/architecture-internals#message-tool-schemas)
- [Rencana Refaktor Presentasi Saluran](/id/plan/ui-channels)
