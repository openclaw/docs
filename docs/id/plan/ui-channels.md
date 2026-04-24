---
read_when:
    - Memfaktorkan ulang UI pesan channel, payload interaktif, atau renderer channel native
    - Mengubah kemampuan alat pesan, petunjuk pengiriman, atau penanda lintas konteks
    - Men-debug fanout impor Discord Carbon atau kelazy-an runtime Plugin channel
summary: Pisahkan presentasi pesan semantik dari renderer UI native channel.
title: Rencana refaktor presentasi channel
x-i18n:
    generated_at: "2026-04-24T09:16:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: f983c4d14580e8a66744c7e5f23dd9846c11e926181a8441d60f346cec6d1eea
    source_path: plan/ui-channels.md
    workflow: 15
---

## Status

Diimplementasikan untuk permukaan agen bersama, CLI, kemampuan Plugin, dan pengiriman keluar:

- `ReplyPayload.presentation` membawa UI pesan semantik.
- `ReplyPayload.delivery.pin` membawa permintaan pin pesan terkirim.
- Tindakan pesan bersama mengekspos `presentation`, `delivery`, dan `pin` alih-alih `components`, `blocks`, `buttons`, atau `card` yang native penyedia.
- Core merender atau menurunkan presentasi secara otomatis melalui kemampuan keluar yang dideklarasikan Plugin.
- Renderer Discord, Slack, Telegram, Mattermost, MS Teams, dan Feishu mengonsumsi kontrak generik.
- Kode control-plane channel Discord tidak lagi mengimpor container UI berbasis Carbon.

Dokumen kanonis kini berada di [Message Presentation](/id/plugins/message-presentation).
Pertahankan rencana ini sebagai konteks implementasi historis; perbarui panduan kanonis
untuk perubahan kontrak, renderer, atau perilaku fallback.

## Masalah

UI channel saat ini terpecah di beberapa permukaan yang tidak kompatibel:

- Core memiliki hook renderer lintas konteks berbentuk Discord melalui `buildCrossContextComponents`.
- Discord `channel.ts` dapat mengimpor UI Carbon native melalui `DiscordUiContainer`, yang menarik dependensi UI runtime ke control plane Plugin channel.
- Agen dan CLI mengekspos escape hatch payload native seperti Discord `components`, Slack `blocks`, Telegram atau Mattermost `buttons`, dan Teams atau Feishu `card`.
- `ReplyPayload.channelData` membawa petunjuk transport sekaligus envelope UI native.
- Model `interactive` generik ada, tetapi lebih sempit daripada tata letak yang lebih kaya yang sudah digunakan oleh Discord, Slack, Teams, Feishu, LINE, Telegram, dan Mattermost.

Ini membuat core sadar akan bentuk UI native, melemahkan kelazy-an runtime Plugin, dan memberi agen terlalu banyak cara spesifik penyedia untuk mengekspresikan intent pesan yang sama.

## Tujuan

- Core memutuskan presentasi semantik terbaik untuk sebuah pesan dari kemampuan yang dideklarasikan.
- Extension mendeklarasikan kemampuan dan merender presentasi semantik ke payload transport native.
- UI Web Control tetap terpisah dari UI native chat.
- Payload channel native tidak diekspos melalui permukaan pesan agen atau CLI bersama.
- Fitur presentasi yang tidak didukung otomatis diturunkan ke representasi teks terbaik.
- Perilaku pengiriman seperti mem-pin pesan terkirim adalah metadata pengiriman generik, bukan presentasi.

## Bukan Tujuan

- Tidak ada shim kompatibilitas mundur untuk `buildCrossContextComponents`.
- Tidak ada escape hatch native publik untuk `components`, `blocks`, `buttons`, atau `card`.
- Tidak ada impor core terhadap library UI native channel.
- Tidak ada seam SDK khusus penyedia untuk channel bawaan.

## Model Target

Tambahkan field `presentation` milik core ke `ReplyPayload`.

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
- Blok select `interactive` dipetakan ke `presentation.blocks[].type = "select"`.

Skema agen eksternal dan CLI sekarang menggunakan `presentation`; `interactive` tetap menjadi helper parser/rendering internal legacy untuk producer balasan yang sudah ada.

## Metadata Pengiriman

Tambahkan field `delivery` milik core untuk perilaku pengiriman yang bukan UI.

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

- `delivery.pin = true` berarti mem-pin pesan pertama yang berhasil dikirim.
- `notify` default ke `false`.
- `required` default ke `false`; channel yang tidak didukung atau kegagalan pin otomatis diturunkan dengan tetap melanjutkan pengiriman.
- Tindakan pesan manual `pin`, `unpin`, dan `list-pins` tetap ada untuk pesan yang sudah ada.

Binding topik ACP Telegram saat ini seharusnya dipindahkan dari `channelData.telegram.pin = true` ke `delivery.pin = true`.

## Kontrak Kemampuan Runtime

Tambahkan hook render presentasi dan pengiriman ke adapter keluar runtime, bukan Plugin channel control-plane.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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

Perilaku core:

- Resolusikan channel target dan adapter runtime.
- Tanyakan kemampuan presentasi.
- Turunkan blok yang tidak didukung sebelum rendering.
- Panggil `renderPresentation`.
- Jika tidak ada renderer, ubah presentasi menjadi fallback teks.
- Setelah pengiriman berhasil, panggil `pinDeliveredMessage` saat `delivery.pin` diminta dan didukung.

## Pemetaan Channel

Discord:

- Render `presentation` ke komponen v2 dan container Carbon di modul khusus runtime.
- Pertahankan helper warna aksen di modul ringan.
- Hapus impor `DiscordUiContainer` dari kode control-plane Plugin channel.

Slack:

- Render `presentation` ke Block Kit.
- Hapus input `blocks` dari agen dan CLI.

Telegram:

- Render teks, konteks, dan divider sebagai teks.
- Render actions dan select sebagai keyboard inline saat dikonfigurasi dan diizinkan untuk permukaan target.
- Gunakan fallback teks saat tombol inline dinonaktifkan.
- Pindahkan pinning topik ACP ke `delivery.pin`.

Mattermost:

- Render actions sebagai tombol interaktif saat dikonfigurasi.
- Render blok lain sebagai fallback teks.

MS Teams:

- Render `presentation` ke Adaptive Cards.
- Pertahankan tindakan manual pin/unpin/list-pins.
- Secara opsional implementasikan `pinDeliveredMessage` jika dukungan Graph andal untuk percakapan target.

Feishu:

- Render `presentation` ke kartu interaktif.
- Pertahankan tindakan manual pin/unpin/list-pins.
- Secara opsional implementasikan `pinDeliveredMessage` untuk pinning pesan terkirim jika perilaku API andal.

LINE:

- Render `presentation` ke pesan Flex atau template jika memungkinkan.
- Fallback ke teks untuk blok yang tidak didukung.
- Hapus payload UI LINE dari `channelData`.

Channel biasa atau terbatas:

- Ubah presentasi menjadi teks dengan format konservatif.

## Langkah Refaktor

1. Terapkan kembali perbaikan rilis Discord yang memisahkan `ui-colors.ts` dari UI berbasis Carbon dan menghapus `DiscordUiContainer` dari `extensions/discord/src/channel.ts`.
2. Tambahkan `presentation` dan `delivery` ke `ReplyPayload`, normalisasi payload keluar, ringkasan pengiriman, dan payload hook.
3. Tambahkan skema dan helper parser `MessagePresentation` di subpath SDK/runtime yang sempit.
4. Ganti kemampuan pesan `buttons`, `cards`, `components`, dan `blocks` dengan kemampuan presentasi semantik.
5. Tambahkan hook adapter keluar runtime untuk render presentasi dan pinning pengiriman.
6. Ganti konstruksi komponen lintas konteks dengan `buildCrossContextPresentation`.
7. Hapus `src/infra/outbound/channel-adapters.ts` dan hapus `buildCrossContextComponents` dari tipe Plugin channel.
8. Ubah `maybeApplyCrossContextMarker` agar melampirkan `presentation` alih-alih parameter native.
9. Perbarui jalur kirim plugin-dispatch agar hanya mengonsumsi presentasi semantik dan metadata pengiriman.
10. Hapus parameter payload native agen dan CLI: `components`, `blocks`, `buttons`, dan `card`.
11. Hapus helper SDK yang membuat skema message-tool native, menggantinya dengan helper skema presentasi.
12. Hapus envelope UI/native dari `channelData`; pertahankan hanya metadata transport sampai setiap field yang tersisa ditinjau.
13. Migrasikan renderer Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, dan LINE.
14. Perbarui dokumentasi untuk CLI pesan, halaman channel, SDK Plugin, dan capability cookbook.
15. Jalankan profiling fanout impor untuk Discord dan entrypoint channel yang terdampak.

Langkah 1-11 dan 13-14 diimplementasikan dalam refaktor ini untuk kontrak agen bersama, CLI, kemampuan Plugin, dan adapter keluar. Langkah 12 tetap menjadi lintasan pembersihan internal yang lebih dalam untuk envelope transport `channelData` yang privat bagi penyedia. Langkah 15 tetap menjadi validasi lanjutan jika kita menginginkan angka fanout impor yang terukur di luar gerbang type/test.

## Pengujian

Tambahkan atau perbarui:

- Pengujian normalisasi presentasi.
- Pengujian auto-degrade presentasi untuk blok yang tidak didukung.
- Pengujian penanda lintas konteks untuk jalur pengiriman plugin dispatch dan core.
- Pengujian matriks render channel untuk Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE, dan fallback teks.
- Pengujian skema message tool yang membuktikan field native sudah hilang.
- Pengujian CLI yang membuktikan flag native sudah hilang.
- Regresi kelazy-an impor entrypoint Discord yang mencakup Carbon.
- Pengujian pin pengiriman yang mencakup Telegram dan fallback generik.

## Pertanyaan Terbuka

- Haruskah `delivery.pin` diimplementasikan untuk Discord, Slack, MS Teams, dan Feishu pada tahap pertama, atau hanya Telegram terlebih dahulu?
- Haruskah `delivery` pada akhirnya menyerap field yang sudah ada seperti `replyToId`, `replyToCurrent`, `silent`, dan `audioAsVoice`, atau tetap fokus pada perilaku pasca-pengiriman?
- Haruskah presentasi mendukung gambar atau referensi file secara langsung, atau media sebaiknya tetap dipisahkan dari tata letak UI untuk saat ini?

## Terkait

- [Channels overview](/id/channels)
- [Message presentation](/id/plugins/message-presentation)
