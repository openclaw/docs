---
read_when:
    - Memfaktorkan ulang UI pesan saluran, payload interaktif, atau perender saluran native
    - Mengubah kemampuan alat pesan, petunjuk pengiriman, atau penanda lintas konteks
    - Men-debug fanout impor Discord Carbon atau pemuatan malas runtime plugin kanal
summary: Pisahkan penyajian pesan semantik dari perender UI native kanal.
title: Rencana refaktor penyajian kanal
x-i18n:
    generated_at: "2026-07-12T14:20:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## Status

Diimplementasikan untuk permukaan agen bersama, CLI, kapabilitas plugin, dan pengiriman keluar:

- `ReplyPayload.presentation` membawa UI pesan semantik.
- `ReplyPayload.delivery.pin` membawa permintaan penyematan pesan yang telah dikirim.
- Tindakan pesan bersama mengekspos `presentation`, `delivery`, dan `pin`, bukan `components`, `blocks`, `buttons`, atau `card` bawaan penyedia.
- Inti merender atau menurunkan kemampuan presentasi secara otomatis melalui kapabilitas keluar yang dideklarasikan plugin.
- Perender Discord, Slack, Telegram, Mattermost, MS Teams, dan Feishu menggunakan kontrak generik.
- Kode bidang kontrol kanal Discord tidak lagi mengimpor kontainer UI berbasis Carbon.

Dokumentasi kanonis kini berada di [Presentasi pesan](/id/plugins/message-presentation).
Pertahankan rencana ini sebagai konteks implementasi historis; perbarui panduan kanonis
untuk perubahan perilaku kontrak, perender, atau fallback.

## Masalah

UI kanal saat ini terbagi ke dalam beberapa permukaan yang tidak kompatibel:

- Inti memiliki hook perender lintas konteks berbentuk Discord melalui `buildCrossContextComponents`.
- `channel.ts` Discord dapat mengimpor UI Carbon bawaan melalui `DiscordUiContainer`, yang menarik dependensi UI runtime ke bidang kontrol plugin kanal.
- Agen dan CLI mengekspos jalur pintas payload bawaan seperti `components` Discord, `blocks` Slack, `buttons` Telegram atau Mattermost, serta `card` Teams atau Feishu.
- `ReplyPayload.channelData` membawa petunjuk transportasi sekaligus amplop UI bawaan.
- Model `interactive` generik tersedia, tetapi lebih terbatas daripada tata letak yang lebih kaya yang sudah digunakan oleh Discord, Slack, Teams, Feishu, LINE, Telegram, dan Mattermost.

Hal ini membuat inti mengetahui bentuk UI bawaan, melemahkan pemuatan lambat runtime plugin, dan memberi agen terlalu banyak cara khusus penyedia untuk mengekspresikan maksud pesan yang sama.

## Tujuan

- Inti menentukan presentasi semantik terbaik untuk suatu pesan berdasarkan kapabilitas yang dideklarasikan.
- Ekstensi mendeklarasikan kapabilitas dan merender presentasi semantik menjadi payload transportasi bawaan.
- UI Kontrol Web tetap terpisah dari UI obrolan bawaan.
- Payload kanal bawaan tidak diekspos melalui permukaan pesan agen bersama atau CLI.
- Fitur presentasi yang tidak didukung otomatis diturunkan ke representasi teks terbaik.
- Perilaku pengiriman seperti menyematkan pesan yang telah dikirim merupakan metadata pengiriman generik, bukan presentasi.

## Bukan tujuan

- Tidak ada shim kompatibilitas mundur untuk `buildCrossContextComponents`.
- Tidak ada jalur pintas bawaan publik untuk `components`, `blocks`, `buttons`, atau `card`.
- Tidak ada impor pustaka UI bawaan kanal oleh inti.
- Tidak ada celah SDK khusus penyedia untuk kanal yang dibundel.

## Model target

Tambahkan bidang `presentation` milik inti ke `ReplyPayload`.

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
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
```

`interactive` menjadi subset dari `presentation` selama migrasi:

- Blok teks `interactive` dipetakan ke `presentation.blocks[].type = "text"`.
- Blok tombol `interactive` dipetakan ke `presentation.blocks[].type = "buttons"`.
- Blok pilihan `interactive` dipetakan ke `presentation.blocks[].type = "select"`.

Skema agen eksternal dan CLI kini menggunakan `presentation`; `interactive` tetap menjadi pembantu penguraian/perenderan lama internal untuk produsen balasan yang ada.
API publik yang ditujukan bagi produsen memperlakukan `interactive` sebagai usang. Dukungan runtime
tetap tersedia agar pembantu persetujuan yang ada dan plugin lama terus
berfungsi sementara kode baru menghasilkan `presentation`.

## Metadata pengiriman

Tambahkan bidang `delivery` milik inti untuk perilaku pengiriman yang bukan UI.

```ts
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

Semantik:

- `delivery.pin = true` berarti menyematkan pesan pertama yang berhasil dikirim.
- `notify` secara default bernilai `false`.
- `required` secara default bernilai `false`; kanal yang tidak didukung atau kegagalan penyematan otomatis diturunkan dengan melanjutkan pengiriman.
- Tindakan pesan manual `pin`, `unpin`, dan `list-pins` tetap tersedia untuk pesan yang sudah ada.

Pengikatan topik ACP Telegram saat ini harus dipindahkan dari `channelData.telegram.pin = true` ke `delivery.pin = true`.

## Kontrak kapabilitas runtime

Tambahkan hook perenderan presentasi dan pengiriman ke adaptor keluar runtime, bukan ke plugin kanal bidang kontrol.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

Perilaku inti:

- Menentukan kanal target dan adaptor runtime.
- Meminta kapabilitas presentasi.
- Menurunkan blok yang tidak didukung dan menerapkan batas kapabilitas generik sebelum
  perenderan.
- Memanggil `renderPresentation`.
- Jika tidak ada perender, mengonversi presentasi menjadi fallback teks.
- Setelah pengiriman berhasil, memanggil `pinDeliveredMessage` ketika `delivery.pin` diminta dan didukung.

## Pemetaan kanal

Discord:

- Merender `presentation` menjadi komponen v2 dan kontainer Carbon dalam modul khusus runtime.
- Mempertahankan pembantu warna aksen dalam modul ringan.
- Menghapus impor `DiscordUiContainer` dari kode bidang kontrol plugin kanal.

Slack:

- Merender `presentation` menjadi Block Kit.
- Menghapus input `blocks` agen dan CLI.

Telegram:

- Merender teks, konteks, dan pemisah sebagai teks.
- Merender tindakan dan pilihan sebagai papan ketik inline ketika dikonfigurasi dan diizinkan untuk permukaan target.
- Menggunakan fallback teks ketika tombol inline dinonaktifkan.
- Memindahkan penyematan topik ACP ke `delivery.pin`.

Mattermost:

- Merender tindakan sebagai tombol interaktif ketika dikonfigurasi.
- Merender blok lain sebagai fallback teks.

MS Teams:

- Merender `presentation` menjadi Adaptive Cards.
- Mempertahankan tindakan manual sematkan/batalkan sematan/daftar sematan.
- Secara opsional mengimplementasikan `pinDeliveredMessage` jika dukungan Graph dapat diandalkan untuk percakapan target.

Feishu:

- Merender `presentation` menjadi kartu interaktif.
- Mempertahankan tindakan manual sematkan/batalkan sematan/daftar sematan.
- Secara opsional mengimplementasikan `pinDeliveredMessage` untuk menyematkan pesan terkirim jika perilaku API dapat diandalkan.

LINE:

- Merender `presentation` menjadi pesan Flex atau templat jika memungkinkan.
- Menggunakan fallback teks untuk blok yang tidak didukung.
- Menghapus payload UI LINE dari `channelData`.

Kanal sederhana atau terbatas:

- Mengonversi presentasi menjadi teks dengan pemformatan konservatif.

## Langkah refaktor

1. Terapkan kembali perbaikan rilis Discord yang memisahkan `ui-colors.ts` dari UI berbasis Carbon dan menghapus `DiscordUiContainer` dari `extensions/discord/src/channel.ts`.
2. Tambahkan `presentation` dan `delivery` ke `ReplyPayload`, normalisasi payload keluar, ringkasan pengiriman, dan payload hook.
3. Tambahkan skema `MessagePresentation` dan pembantu pengurai dalam subjalur SDK/runtime yang sempit.
4. Ganti kapabilitas pesan `buttons`, `cards`, `components`, dan `blocks` dengan kapabilitas presentasi semantik.
5. Tambahkan hook adaptor keluar runtime untuk perenderan presentasi dan penyematan pengiriman.
6. Ganti konstruksi komponen lintas konteks dengan `buildCrossContextPresentation`.
7. Hapus `src/infra/outbound/channel-adapters.ts` dan hapus `buildCrossContextComponents` dari tipe plugin kanal.
8. Ubah `maybeApplyCrossContextMarker` agar melampirkan `presentation`, bukan parameter bawaan.
9. Perbarui jalur pengiriman dispatch plugin agar hanya menggunakan presentasi semantik dan metadata pengiriman.
10. Hapus parameter payload bawaan agen dan CLI: `components`, `blocks`, `buttons`, dan `card`.
11. Hapus pembantu SDK yang membuat skema alat pesan bawaan, dan ganti dengan pembantu skema presentasi.
12. Hapus amplop UI/bawaan dari `channelData`; pertahankan hanya metadata transportasi hingga setiap bidang yang tersisa ditinjau.
13. Migrasikan perender Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, dan LINE.
14. Perbarui dokumentasi untuk CLI pesan, halaman kanal, SDK plugin, dan buku resep kapabilitas.
15. Jalankan pembuatan profil sebaran impor untuk Discord dan titik masuk kanal yang terdampak.

Langkah 1-11 dan 13-14 diimplementasikan dalam refaktor ini untuk kontrak agen bersama, CLI, kapabilitas plugin, dan adaptor keluar. Langkah 12 masih memerlukan tahap pembersihan internal yang lebih mendalam untuk amplop transportasi `channelData` privat penyedia. Langkah 15 tetap menjadi validasi tindak lanjut jika kita menginginkan angka sebaran impor terukur di luar gerbang tipe/pengujian.

## Pengujian

Tambahkan atau perbarui:

- Pengujian normalisasi presentasi.
- Pengujian penurunan otomatis presentasi untuk blok yang tidak didukung.
- Pengujian penanda lintas konteks untuk dispatch plugin dan jalur pengiriman inti.
- Pengujian matriks perender kanal untuk Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE, dan fallback teks.
- Pengujian skema alat pesan yang membuktikan bidang bawaan telah dihapus.
- Pengujian CLI yang membuktikan flag bawaan telah dihapus.
- Regresi kelambatan impor titik masuk Discord yang mencakup Carbon.
- Pengujian penyematan pengiriman yang mencakup Telegram dan fallback generik.

## Pertanyaan terbuka

- Apakah `delivery.pin` harus diimplementasikan untuk Discord, Slack, MS Teams, dan Feishu pada tahap pertama, atau hanya Telegram terlebih dahulu?
- Apakah `delivery` pada akhirnya harus mencakup bidang yang ada seperti `replyToId`, `replyToCurrent`, `silent`, dan `audioAsVoice`, atau tetap berfokus pada perilaku setelah pengiriman?
- Apakah presentasi harus mendukung gambar atau referensi berkas secara langsung, atau media sebaiknya tetap terpisah dari tata letak UI untuk saat ini?

## Terkait

- [Ikhtisar kanal](/id/channels)
- [Presentasi pesan](/id/plugins/message-presentation)
