---
read_when:
    - Menambahkan atau memodifikasi perenderan kartu pesan, bagan, tabel, tombol, atau pilihan
    - Membangun plugin kanal yang mendukung pesan keluar kaya fitur
    - Mengubah presentasi alat pesan atau kemampuan pengiriman
    - Men-debug regresi rendering kartu/blok/komponen khusus penyedia
summary: Kartu pesan semantik, bagan, tabel, kontrol, teks fallback, dan petunjuk pengiriman untuk plugin kanal
title: Presentasi pesan
x-i18n:
    generated_at: "2026-07-19T05:12:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0b56ed47ce837e865aa7ac218f02f4d5523b3b71ae22dd0074f2aab00aeecb7a
    source_path: plugins/message-presentation.md
    workflow: 16
---

Presentasi pesan adalah kontrak bersama OpenClaw untuk UI obrolan keluar yang kaya.
Kontrak ini memungkinkan agen, perintah CLI, alur persetujuan, dan plugin mendeskripsikan
maksud pesan satu kali, sementara setiap plugin saluran merender bentuk native terbaik yang mampu didukungnya.

Gunakan presentasi untuk UI pesan portabel: bagian teks, teks konteks/footer singkat,
pemisah, bagan, tabel, tombol, menu pilihan, serta judul/nuansa kartu.

Jangan tambahkan bidang baru khusus native penyedia seperti Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card`, atau Feishu `card` ke alat
pesan bersama. Bidang tersebut merupakan keluaran perender yang dimiliki oleh plugin saluran.

## Kontrak

Pembuat plugin mengimpor kontrak publik dari:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Struktur:

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
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] }
  | {
      type: "chart";
      chartType: "pie";
      title: string;
      segments: Array<{ label: string; value: number }>;
    }
  | {
      type: "chart";
      chartType: "bar" | "area" | "line";
      title: string;
      categories: string[];
      series: Array<{ name: string; values: number[] }>;
      xLabel?: string;
      yLabel?: string;
    }
  | {
      type: "table";
      caption: string;
      headers: string[];
      rows: Array<Array<string | number>>;
      rowHeaderColumnIndex?: number;
    };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: "allow-once" | "allow-always" | "deny";
    }
  | {
      type: "question";
      questionId: string;
      optionValue: string;
    }
  | { type: "url"; url: string }
  | {
      type: "web-app";
      url: string;
      widgetId?: string;
    }
  | {
      type: "web-app";
      url?: string;
      widgetId: string;
    };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Nilai callback lama. Utamakan action untuk kontrol baru. */
  value?: string;
  /** @deprecated Gunakan action dengan type "url". */
  url?: string;
  /** @deprecated Gunakan action dengan type "web-app". */
  webApp?: { url: string };
  /** @deprecated Gunakan action dengan type "web-app". */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: Extract<MessagePresentationAction, { type: "command" | "callback" }>;
  /** Nilai callback lama. Utamakan action untuk kontrol baru. */
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
- `action.type: "callback"` membawa data plugin opak melalui jalur interaksi
  saluran. Plugin saluran tidak boleh menafsirkan ulang data callback sebagai perintah
  garis miring.
- `action.type: "approval"` mengidentifikasi satu persetujuan operator persisten, jenis
  eksplisit `exec` atau `plugin`, dan keputusan yang diminta. Plugin saluran
  mengodekan tindakan tersebut menjadi callback privat transportasi dan menyelesaikannya melalui
  layanan persetujuan; plugin tidak boleh mengurai teks perintah `/approve` atau menyimpulkan
  jenis dari ID.
- `action.type: "question"` mengidentifikasi satu pilihan untuk pertanyaan `ask_user`
  aktif yang dibuat saat runtime. Seperti `approval`, ini merupakan tindakan runtime OpenClaw;
  agen dan plugin tidak boleh membuat ID pertanyaan sendiri. Telegram, Discord, dan
  Slack memetakannya ke callback native privat transportasi dan menyelesaikan pilihan
  melalui Gateway. Ketika pertanyaan telah dijawab, kedaluwarsa, atau
  dibatalkan, saluran tersebut mengedit pesan yang dikirim, menghapus tindakannya,
  dan menambahkan status terminal. WhatsApp, Signal, dan iMessage merender hingga
  empat pilihan tunggal sebagai reaksi `1️⃣` hingga `4️⃣`. Bentuk pertanyaan
  lainnya diturunkan menjadi teks label, dan pengguna dapat menjawab dengan balasan
  teks biasa.
- `action.type: "url"` membuka tautan biasa.
- `action.type: "web-app"` meluncurkan aplikasi web native saluran. Tetapkan `url` untuk
  aplikasi berbasis URL atau `widgetId` untuk widget yang dihosting OpenClaw dengan mekanisme
  peluncuran yang dimiliki saluran; setidaknya salah satunya wajib ada. Jika keduanya
  tersedia, saluran dapat mengutamakan peluncuran widget terhosting native dan menggunakan URL
  ketika mekanisme tersebut tidak tersedia.
- `value` adalah nilai callback opak lama. Kontrol baru sebaiknya menggunakan `action`
  agar plugin saluran dapat memetakan perintah dan callback tanpa menebak dari teks.
- `url`, `webApp`, dan `web_app` tetap diterima sebagai masukan batas yang tidak digunakan lagi.
  Penormal mempertahankan bidang-bidang ini agar perender dapat membedakan semantik lama
  yang telah dirilis dari tindakan bertipe eksplisit. Produsen baru sebaiknya menggunakan `action`.
- `label` wajib diisi dan juga digunakan dalam fallback teks.
- `style` bersifat anjuran. Perender sebaiknya memetakan gaya yang tidak didukung ke
  nilai default yang aman, bukan menggagalkan pengiriman.
- `priority` bersifat opsional. Ketika saluran mengiklankan batas tindakan dan kontrol
  harus dihapus, inti mempertahankan tombol berprioritas lebih tinggi terlebih dahulu dan mempertahankan
  urutan asli di antara tombol dengan prioritas yang sama. Ketika semua kontrol dapat dimuat, urutan
  yang dibuat dipertahankan.
- `disabled` bersifat opsional. Saluran harus mengaktifkannya dengan `supportsDisabled`; jika tidak,
  inti menurunkan kontrol yang dinonaktifkan menjadi teks fallback noninteraktif. Tombol
  yang dinonaktifkan selalu dirender sebagai label saja dalam teks fallback, bahkan jika
  membawa tindakan `command`.
- `reusable` bersifat opsional. Saluran yang mendukung callback native yang dapat digunakan kembali dapat
  mempertahankan tindakan tersebut setelah interaksi berhasil. Gunakan untuk
  tindakan berulang atau idempoten seperti memuat ulang, memeriksa, atau melihat detail selengkapnya;
  biarkan tidak ditetapkan untuk persetujuan sekali pakai biasa dan tindakan destruktif.

Semantik pilihan:

- `options[].action` hanya menerima `command` atau `callback`; tindakan persetujuan dan tautan hanya untuk tombol.
- `options[].value` adalah nilai aplikasi terpilih versi lama.
- `placeholder` bersifat anjuran dan dapat diabaikan oleh saluran tanpa dukungan
  pilihan native.
- Jika saluran tidak mendukung pilihan, teks fallback mencantumkan labelnya.

Semantik bagan:

- `pie` memerlukan nilai segmen positif.
- `bar`, `area`, dan `line` menggunakan satu larik `categories` yang berurutan. Setiap seri
  menyediakan tepat satu nilai terbatas per kategori, dalam urutan yang sama.
- Label kategori dan nama seri harus unik. Blok bagan yang tidak valid atau tidak lengkap
  dihapus selama normalisasi, bukan mengubah data secara diam-diam.
- Perenderan bagan native harus diaktifkan melalui `presentationCapabilities.charts`.
  Saluran lain menerima judul bagan, sumbu, kategori, seri, dan nilai
  sebagai teks deterministik. Ini juga merupakan fallback aksesibilitas.

Semantik tabel:

- `caption` adalah judul singkat yang wajib diisi. `headers` harus berisi setidaknya satu
  label kolom unik yang tidak kosong.
- `rows` harus berisi setidaknya satu baris. Setiap baris harus memiliki tepat satu sel per
  header, dan setiap sel harus berupa string yang tidak kosong atau angka terbatas.
- `rowHeaderColumnIndex` adalah indeks opsional berbasis nol yang mengidentifikasi kolom
  yang sel-selnya harus diekspos sebagai header baris oleh perender native.
- Normalisasi tabel bersifat atomik. Keterangan, header, lebar baris, sel,
  atau indeks header baris yang tidak valid menyebabkan blok tabel dihapus, bukan memotong atau memperbaiki
  datanya.
- Perenderan tabel native harus diaktifkan melalui `presentationCapabilities.tables`.
  Saluran lain menerima keterangan dan setiap baris sebagai teks linear
  deterministik, dengan spasi internal diringkas:

  ```text
  Pipeline terbuka (tabel)
  - Akun: Acme; Tahap: Menang; ARR: 125000
  - Akun: Globex; Tahap: Peninjauan; ARR: 82000
  ```

Tidak ada diskriminator `report` terpisah. Susun laporan dari `title`,
`tone`, `text`, `context`, `chart`, `table`, dan blok tindakan. Dengan demikian, setiap
blok dapat dirender secara independen dan laporan lengkap memiliki fallback teks
deterministik yang sama.

## Contoh produsen

Kartu sederhana:

```json
{
  "title": "Persetujuan deployment",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary siap dipromosikan." },
    { "type": "context", "text": "Build 1234, staging berhasil." },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "Setujui",
          "action": { "type": "callback", "value": "deploy:approve" },
          "style": "success"
        },
        {
          "label": "Tolak",
          "action": { "type": "callback", "value": "deploy:decline" },
          "style": "danger"
        }
      ]
    }
  ]
}
```

Tombol tautan khusus URL:

```json
{
  "blocks": [
    { "type": "text", "text": "Catatan rilis telah siap." },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "Buka catatan",
          "action": { "type": "url", "url": "https://example.com/release" }
        }
      ]
    }
  ]
}
```

Tombol Mini App Telegram:

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "Luncurkan",
          "action": { "type": "web-app", "url": "https://example.com/app" }
        }
      ]
    }
  ]
}
```

Menu pilihan:

```json
{
  "title": "Pilih lingkungan",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Lingkungan",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Produksi", "value": "env:prod" }
      ]
    }
  ]
}
```

Bagan:

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "line",
      "title": "Pendapatan triwulanan",
      "categories": ["T1", "T2", "T3"],
      "series": [
        { "name": "Produk", "values": [120, 145, 138] },
        { "name": "Layanan", "values": [80, 95, 104] }
      ],
      "xLabel": "Triwulan",
      "yLabel": "Pendapatan"
    }
  ]
}
```

Laporan tabel:

```json
{
  "title": "Laporan pipeline",
  "tone": "info",
  "blocks": [
    { "type": "text", "text": "Peluang saat ini berdasarkan tahap." },
    {
      "type": "table",
      "caption": "Pipeline terbuka",
      "headers": ["Akun", "Tahap", "ARR"],
      "rows": [
        ["Acme", "Menang", 125000],
        ["Globex", "Peninjauan", 82000]
      ],
      "rowHeaderColumnIndex": 0
    },
    { "type": "context", "text": "Diperbarui dari snapshot CRM." }
  ]
}
```

Pengiriman CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Persetujuan deployment" \
  --presentation '{"title":"Persetujuan deployment","tone":"warning","blocks":[{"type":"text","text":"Canary siap."},{"type":"buttons","buttons":[{"label":"Setujui","value":"deploy:approve","style":"success"},{"label":"Tolak","value":"deploy:decline","style":"danger"}]}]}'
```

Pengiriman yang disematkan:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topik dibuka" \
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

## Kontrak perender

Plugin saluran mendeklarasikan dukungan perenderan pada adaptor keluarannya:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
    charts: false,
    tables: false,
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

Boolean kapabilitas menjelaskan apa yang dapat dibuat interaktif oleh perender. `limits` opsional menjelaskan amplop generik yang dapat diadaptasi oleh inti sebelum memanggil
perender:

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  charts?: boolean;
  tables?: boolean;
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

Inti menerapkan batas generik pada kontrol semantik sebelum perenderan. Perender
tetap menangani validasi dan pemotongan akhir khusus penyedia untuk jumlah blok
native, ukuran kartu, batas URL, dan kekhasan penyedia yang tidak dapat dinyatakan dalam
kontrak generik. Jika batas menghapus semua kontrol dari sebuah blok, inti mempertahankan
label sebagai teks konteks noninteraktif agar pesan yang dikirim tetap memiliki
fallback yang terlihat.

## Alur perenderan inti

Pada jalur keluar kanonis yang digunakan oleh CLI dan tindakan pesan standar, inti:

1. Menormalisasi payload presentasi.
2. Menentukan adaptor keluar saluran target.
3. Membaca `presentationCapabilities`.
4. Menerapkan batas kapabilitas generik seperti jumlah tindakan, panjang label, dan
   jumlah opsi pilihan ketika adaptor mengiklankannya. Blok bagan dan tabel
   menjadi teks deterministik kecuali adaptor secara eksplisit mengiklankan
   `charts: true` atau `tables: true` masing-masing.
5. Memanggil `renderPresentation` ketika adaptor dapat merender payload.
6. Menggunakan fallback teks konservatif ketika adaptor tidak tersedia atau tidak dapat merender.
7. Mengirim payload yang dihasilkan melalui jalur pengiriman saluran normal.
8. Menerapkan metadata pengiriman seperti `delivery.pin` setelah pesan terkirim
   pertama berhasil.

Saluran balasan atau pratinjau lokal saluran yang menggunakan `ReplyPayload` secara langsung
harus memasuki jalur kanonis tersebut atau mewujudkan fallback presentasi yang sama
sebelum memproyeksikan payload menjadi teks biasa/media.

Inti menangani perilaku fallback agar produsen dapat tetap agnostik terhadap saluran. Plugin
saluran menangani perenderan native dan penanganan interaksi.

## Aturan degradasi

Presentasi harus aman dikirim pada saluran dengan kemampuan terbatas.

Teks fallback mencakup:

- `title` sebagai baris pertama
- Blok `text` sebagai paragraf biasa
- Blok `context` sebagai baris konteks ringkas
- Blok `divider` sebagai pemisah visual
- label tombol, termasuk URL untuk tombol tautan
- label opsi pilihan
- judul, jenis, sumbu, kategori, seri, dan nilai bagan
- keterangan, header, dan setiap nilai baris tabel

### Visibilitas fallback nilai tombol

Ketika saluran tidak dapat merender kontrol interaktif, nilai tombol dan pilihan
menggunakan fallback teks biasa. Perilaku fallback mempertahankan kemudahan penggunaan sekaligus
menjaga kerahasiaan data callback yang tidak transparan:

- **Tindakan bertipe `command`** dirender sebagai `` label: `command` `` agar pengguna dapat
  menyalin perintah dan menjalankannya secara manual di input saluran.
- **Tindakan bertipe `callback`** dan bidang **`value`** lama dirender
  hanya sebagai label. Nilai callback yang tidak transparan tidak ditampilkan dalam teks fallback.
- **Tindakan bertipe `approval`** dirender hanya sebagai label. ID dan keputusan persetujuan merupakan
  data transportasi dan tidak ditampilkan melalui pembantu skalar generik atau teks
  fallback.
- **Tindakan `url`**, **tindakan `web-app`** berbasis URL, dan input **`url` /
  `webApp` / `web_app`** yang tidak digunakan lagi merender teks URL bersama label tombol,
  karena URL ditujukan kepada pengguna. Tindakan khusus widget yang di-host dirender hanya sebagai label pada
  saluran tanpa peluncuran widget native.
- **Opsi pilihan** dirender hanya sebagai label. Nilai opsi yang mendasarinya tidak
  ditampilkan dalam teks fallback.

Adaptor saluran yang menambahkan panduan perintah manual dalam UI fallback-nya (misalnya
instruksi komentar dokumen Feishu) harus memperoleh pemeriksaan keberadaan perintah
dari blok presentasi yang sama dengan yang digunakan perender fallback, agar
teks panduan hanya muncul ketika perintah manual benar-benar ditampilkan.

Kontrol native yang tidak didukung seharusnya mengalami degradasi alih-alih menggagalkan seluruh pengiriman.
Contoh:

- Telegram dengan tombol inline dinonaktifkan mengirim fallback teks.
- Saluran tanpa dukungan pilihan mencantumkan opsi pilihan sebagai teks.
- Saluran tanpa dukungan bagan native mencantumkan data bagan sebagai teks.
- Saluran tanpa dukungan tabel native mencantumkan setiap baris tabel sebagai teks.
- Tombol khusus URL menjadi tombol tautan native atau baris URL fallback.
- Kegagalan penyematan opsional tidak menggagalkan pesan yang dikirim.

Pengecualian utamanya adalah `delivery.pin.required: true`; jika penyematan diminta sebagai
wajib dan saluran tidak dapat menyematkan pesan terkirim, pengiriman melaporkan kegagalan.

## Pemetaan penyedia

Perender bawaan saat ini:

| Saluran         | Target perenderan native                   | Catatan                                                                                                                                                                                                           |
| --------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Komponen dan kontainer komponen            | Mempertahankan `channelData.discord.components` lama untuk produsen payload native penyedia yang sudah ada, tetapi pengiriman bersama baru seharusnya menggunakan `presentation`.                                            |
| Feishu          | Kartu interaktif                           | Header kartu dapat menggunakan `title`; isi menghindari duplikasi judul tersebut.                                                                                                                       |
| Matrix          | Fallback teks ditambah bidang peristiwa terstruktur | Tombol/pilihan diiklankan sebagai didukung, tetapi setiap blok saat ini dirender sebagai output `renderMessagePresentationFallbackText` yang dibawa dalam bidang peristiwa `com.openclaw.presentation`, bukan widget interaktif native. |
| Mattermost      | Teks ditambah properti interaktif          | Pilihan dan pemisah tidak didukung; blok tersebut didegradasi menjadi teks.                                                                                                                                        |
| Microsoft Teams | Adaptive Cards                             | Teks `message` biasa disertakan bersama kartu ketika keduanya tersedia. Pilihan, gaya, dan status dinonaktifkan tidak didukung.                                                                            |
| Slack           | Block Kit                                  | Merender `chart` sebagai `data_visualization` native dan `table` sebagai `data_table` native; mempertahankan `channelData.slack.blocks` lama, tetapi pengiriman bersama baru seharusnya menggunakan `presentation`. |
| Telegram        | Teks ditambah papan ketik inline           | Tombol/pilihan memerlukan kapabilitas tombol inline untuk permukaan target; jika tidak, fallback teks digunakan.                                                                                                   |
| Saluran biasa   | Fallback teks                              | Saluran tanpa perender tetap mendapatkan output yang mudah dibaca.                                                                                                                                                |

Kompatibilitas payload native penyedia merupakan sarana transisi bagi produsen
balasan yang sudah ada. Ini bukan alasan untuk menambahkan bidang native bersama yang baru.

## Presentasi vs InteractiveReply

`InteractiveReply` adalah subset internal lama yang digunakan oleh pembantu persetujuan dan interaksi.
Subset ini mendukung:

- teks
- tombol
- pilihan

`MessagePresentation` adalah kontrak pengiriman bersama kanonis. Kontrak ini menambahkan:

- judul
- nada
- konteks
- pemisah
- bagan
- tabel
- tombol khusus URL
- metadata pengiriman generik melalui `ReplyPayload.delivery`

Gunakan pembantu dari `openclaw/plugin-sdk/interactive-runtime` saat menjembatani kode
lama:

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  hasMessagePresentationBlocks,
  interactiveReplyToPresentation,
  isMessagePresentationInteractiveBlock,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationChartFallbackText,
  renderMessagePresentationFallbackText,
  renderMessagePresentationTableFallbackText,
  resolveMessagePresentationActionValue,
  resolveMessagePresentationButtonAction,
  resolveMessagePresentationControlValue,
  resolveMessagePresentationOptionAction,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Kode baru seharusnya menerima atau menghasilkan `MessagePresentation` secara langsung. Payload
`interactive` yang sudah ada adalah subset `presentation` yang tidak digunakan lagi; dukungan runtime
tetap tersedia bagi produsen lama.

Pembantu yang tidak dihentikan penggunaannya dan perlu diketahui:

- `normalizeMessagePresentation(raw)` / `hasMessagePresentationBlocks(value)`
  memvalidasi dan mengonversi payload tanpa tipe (misalnya, JSON dari flag CLI
  `--presentation`) menjadi `MessagePresentation`.
- `isMessagePresentationInteractiveBlock(block)` mempersempit blok menjadi union
  `buttons` | `select`.
- `resolveMessagePresentationButtonAction(button)` dan
  `resolveMessagePresentationOptionAction(option)` mengembalikan tindakan bertipe kanonis
  sekaligus menerima bidang batas yang tidak digunakan lagi. `action` yang eksplisit
  selalu diutamakan.
- `resolveMessagePresentationActionValue(action)` /
  `resolveMessagePresentationControlValue(control)` hanya membaca nilai skalar
  perintah/callback. Tindakan kanonis non-skalar tidak pernah beralih ke
  bayangan lama `value`, sehingga ID persetujuan dan target tautan tetap bertipe.
- `renderMessagePresentationChartFallbackText(block)` /
  `renderMessagePresentationTableFallbackText(block)` merender satu blok data
  terstruktur sebagai teks deterministik untuk jalur fallback khusus saluran.

Tipe `InteractiveReply*` lama dan helper konversinya ditandai
`@deprecated` dalam SDK:

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
renderer untuk implementasi saluran lama. Kode produsen baru tidak boleh memanggilnya;
kirim `presentation` dan biarkan adaptasi inti/saluran menangani rendering.

Helper persetujuan juga memiliki pengganti yang mengutamakan presentasi:

- gunakan `buildApprovalPresentationFromActionDescriptors(...)` sebagai pengganti
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- gunakan `buildApprovalPresentation(...)` sebagai pengganti
  `buildApprovalInteractiveReply(...)`
- gunakan `buildExecApprovalPresentation(...)` sebagai pengganti
  `buildExecApprovalInteractiveReply(...)`

Builder yang telah dirilis tersebut tetap didukung perintah demi kompatibilitas plugin. Kode Gateway
dan saluran bawaan yang memiliki jenis persetujuan persisten harus menggunakan
`buildTypedApprovalPresentation(...)`,
`buildTypedExecApprovalPendingReplyPayload(...)`, atau
`buildTypedPluginApprovalPendingReplyPayload(...)` agar transport menerima
tindakan `approval` yang eksplisit alih-alih menyimpulkan semantik dari teks `/approve`.

`renderMessagePresentationFallbackText(...)` mengembalikan string kosong untuk
blok presentasi yang tidak memiliki fallback teks, seperti presentasi yang
hanya berisi pemisah. Transport yang memerlukan isi pengiriman tidak kosong dapat meneruskan
`emptyFallback` untuk memilih isi minimal tanpa mengubah kontrak fallback
bawaan.

## Penyematan pengiriman

Penyematan adalah perilaku pengiriman, bukan presentasi. Gunakan `delivery.pin` sebagai pengganti
bidang native penyedia seperti `channelData.telegram.pin`.

Semantik:

- `pin: true` menyematkan pesan pertama yang berhasil dikirim.
- `pin.notify` secara default bernilai `false`.
- `pin.required` secara default bernilai `false`.
- Kegagalan penyematan opsional mengalami degradasi dan membiarkan pesan terkirim tetap utuh.
- Kegagalan penyematan wajib menggagalkan pengiriman.
- Pesan yang dipecah menjadi beberapa bagian menyematkan bagian pertama yang terkirim, bukan bagian terakhir.

Tindakan pesan manual `pin`, `unpin`, dan `pins` tetap tersedia untuk pesan
yang sudah ada jika penyedia mendukung operasi tersebut.

## Daftar periksa pembuat plugin

- Deklarasikan `presentation` dari `describeMessageTool(...)` jika saluran dapat
  merender atau menurunkan kualitas presentasi semantik dengan aman.
- Tambahkan `presentationCapabilities` ke adaptor keluar runtime.
- Implementasikan `renderPresentation` dalam kode runtime, bukan kode
  penyiapan plugin bidang kontrol.
- Jauhkan pustaka UI native dari jalur penyiapan/katalog yang sering digunakan.
- Deklarasikan batas kemampuan generik pada `presentationCapabilities.limits` jika
  diketahui.
- Pertahankan batas akhir platform dalam renderer dan pengujian.
- Tambahkan pengujian fallback untuk bagan, tabel, tombol, pilihan, tombol URL
  yang tidak didukung, duplikasi judul/teks, serta pengiriman campuran `message` dan `presentation`.
- Tambahkan dukungan penyematan pengiriman hanya melalui `deliveryCapabilities.pin` dan
  `pinDeliveredMessage` jika penyedia dapat menyematkan ID pesan yang dikirim.
- Jangan mengekspos bidang kartu/blok/komponen/tombol native penyedia baru melalui
  skema tindakan pesan bersama.

## Dokumentasi terkait

- [CLI Pesan](/id/cli/message)
- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
- [Arsitektur Plugin](/id/plugins/architecture-internals#message-tool-schemas)
- [Rencana Refaktor Presentasi Saluran](/id/plan/ui-channels)
