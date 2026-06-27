---
read_when:
    - Memfaktorkan ulang antarmuka pengguna pesan saluran, payload interaktif, atau perender saluran native
    - Mengubah kemampuan alat pesan, petunjuk pengiriman, atau penanda lintas konteks
    - Men-debug fanout impor Discord Carbon atau kemalasan runtime plugin channel
summary: Pisahkan presentasi pesan semantik dari perender UI native saluran.
title: Rencana refaktor presentasi channel
x-i18n:
    generated_at: "2026-06-27T17:41:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## Status

Diimplementasikan untuk permukaan agen bersama, CLI, kemampuan Plugin, dan pengiriman keluar:

- `ReplyPayload.presentation` membawa UI pesan semantik.
- `ReplyPayload.delivery.pin` membawa permintaan penyematan pesan terkirim.
- Aksi pesan bersama mengekspos `presentation`, `delivery`, dan `pin`, bukan `components`, `blocks`, `buttons`, atau `card` asli penyedia.
- Core merender atau menurunkan presentasi secara otomatis melalui kemampuan keluar yang dideklarasikan Plugin.
- Perender Discord, Slack, Telegram, Mattermost, MS Teams, dan Feishu memakai kontrak generik.
- Kode control-plane kanal Discord tidak lagi mengimpor kontainer UI berbasis Carbon.

Dokumentasi kanonis sekarang ada di [Presentasi Pesan](/id/plugins/message-presentation).
Pertahankan rencana ini sebagai konteks implementasi historis; perbarui panduan kanonis
untuk perubahan kontrak, perender, atau perilaku fallback.

## Masalah

UI kanal saat ini terbagi di beberapa permukaan yang tidak kompatibel:

- Core memiliki hook perender lintas-konteks berbentuk Discord melalui `buildCrossContextComponents`.
- `channel.ts` Discord dapat mengimpor UI Carbon asli melalui `DiscordUiContainer`, yang menarik dependensi UI runtime ke control plane Plugin kanal.
- Agen dan CLI mengekspos escape hatch payload asli seperti `components` Discord, `blocks` Slack, `buttons` Telegram atau Mattermost, dan `card` Teams atau Feishu.
- `ReplyPayload.channelData` membawa hint transport dan envelope UI asli.
- Model `interactive` generik sudah ada, tetapi lebih sempit daripada tata letak yang lebih kaya yang sudah digunakan oleh Discord, Slack, Teams, Feishu, LINE, Telegram, dan Mattermost.

Ini membuat core mengetahui bentuk UI asli, melemahkan kelambatan runtime Plugin, dan memberi agen terlalu banyak cara khusus penyedia untuk mengekspresikan maksud pesan yang sama.

## Tujuan

- Core menentukan presentasi semantik terbaik untuk pesan dari kemampuan yang dideklarasikan.
- Ekstensi mendeklarasikan kemampuan dan merender presentasi semantik ke payload transport asli.
- Web Control UI tetap terpisah dari UI asli chat.
- Payload kanal asli tidak diekspos melalui permukaan pesan agen bersama atau CLI.
- Fitur presentasi yang tidak didukung diturunkan otomatis ke representasi teks terbaik.
- Perilaku pengiriman seperti menyematkan pesan terkirim adalah metadata pengiriman generik, bukan presentasi.

## Bukan tujuan

- Tidak ada shim kompatibilitas mundur untuk `buildCrossContextComponents`.
- Tidak ada escape hatch asli publik untuk `components`, `blocks`, `buttons`, atau `card`.
- Tidak ada impor core untuk pustaka UI asli kanal.
- Tidak ada seam SDK khusus penyedia untuk kanal bawaan.

## Model target

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

Skema agen eksternal dan CLI sekarang menggunakan `presentation`; `interactive` tetap menjadi helper parser/perenderan lama internal untuk produsen balasan yang sudah ada.
API publik yang dihadapkan ke produsen memperlakukan `interactive` sebagai usang. Dukungan runtime
tetap ada agar helper persetujuan yang sudah ada dan Plugin lama terus berfungsi
sementara kode baru mengeluarkan `presentation`.

## Metadata pengiriman

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

- `delivery.pin = true` berarti sematkan pesan pertama yang berhasil dikirim.
- `notify` bernilai default `false`.
- `required` bernilai default `false`; kanal yang tidak didukung atau penyematan yang gagal diturunkan otomatis dengan melanjutkan pengiriman.
- Aksi pesan manual `pin`, `unpin`, dan `list-pins` tetap ada untuk pesan yang sudah ada.

Binding topik ACP Telegram saat ini harus dipindahkan dari `channelData.telegram.pin = true` ke `delivery.pin = true`.

## Kontrak kemampuan runtime

Tambahkan hook perender presentasi dan pengiriman ke adapter keluar runtime, bukan Plugin kanal control-plane.

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

Perilaku core:

- Selesaikan kanal target dan adapter runtime.
- Minta kemampuan presentasi.
- Turunkan blok yang tidak didukung dan terapkan batas kemampuan generik sebelum
  perenderan.
- Panggil `renderPresentation`.
- Jika tidak ada perender, konversi presentasi ke fallback teks.
- Setelah pengiriman berhasil, panggil `pinDeliveredMessage` saat `delivery.pin` diminta dan didukung.

## Pemetaan kanal

Discord:

- Render `presentation` ke komponen v2 dan kontainer Carbon dalam modul khusus runtime.
- Pertahankan helper warna aksen dalam modul ringan.
- Hapus impor `DiscordUiContainer` dari kode control-plane Plugin kanal.

Slack:

- Render `presentation` ke Block Kit.
- Hapus input `blocks` agen dan CLI.

Telegram:

- Render teks, konteks, dan divider sebagai teks.
- Render aksi dan select sebagai keyboard inline saat dikonfigurasi dan diizinkan untuk permukaan target.
- Gunakan fallback teks saat tombol inline dinonaktifkan.
- Pindahkan penyematan topik ACP ke `delivery.pin`.

Mattermost:

- Render aksi sebagai tombol interaktif saat dikonfigurasi.
- Render blok lain sebagai fallback teks.

MS Teams:

- Render `presentation` ke Adaptive Cards.
- Pertahankan aksi manual pin/unpin/list-pins.
- Secara opsional implementasikan `pinDeliveredMessage` jika dukungan Graph andal untuk percakapan target.

Feishu:

- Render `presentation` ke kartu interaktif.
- Pertahankan aksi manual pin/unpin/list-pins.
- Secara opsional implementasikan `pinDeliveredMessage` untuk penyematan pesan terkirim jika perilaku API andal.

LINE:

- Render `presentation` ke Flex atau pesan template jika memungkinkan.
- Kembali ke teks untuk blok yang tidak didukung.
- Hapus payload UI LINE dari `channelData`.

Kanal polos atau terbatas:

- Konversi presentasi ke teks dengan pemformatan konservatif.

## Langkah refactor

1. Terapkan kembali perbaikan rilis Discord yang memisahkan `ui-colors.ts` dari UI berbasis Carbon dan menghapus `DiscordUiContainer` dari `extensions/discord/src/channel.ts`.
2. Tambahkan `presentation` dan `delivery` ke `ReplyPayload`, normalisasi payload keluar, ringkasan pengiriman, dan payload hook.
3. Tambahkan skema `MessagePresentation` dan helper parser di subpath SDK/runtime yang sempit.
4. Ganti kemampuan pesan `buttons`, `cards`, `components`, dan `blocks` dengan kemampuan presentasi semantik.
5. Tambahkan hook adapter keluar runtime untuk render presentasi dan penyematan pengiriman.
6. Ganti konstruksi komponen lintas-konteks dengan `buildCrossContextPresentation`.
7. Hapus `src/infra/outbound/channel-adapters.ts` dan hapus `buildCrossContextComponents` dari tipe Plugin kanal.
8. Ubah `maybeApplyCrossContextMarker` agar melampirkan `presentation`, bukan parameter asli.
9. Perbarui jalur pengiriman plugin-dispatch agar hanya memakai presentasi semantik dan metadata pengiriman.
10. Hapus parameter payload asli agen dan CLI: `components`, `blocks`, `buttons`, dan `card`.
11. Hapus helper SDK yang membuat skema message-tool asli, menggantinya dengan helper skema presentasi.
12. Hapus envelope UI/asli dari `channelData`; pertahankan hanya metadata transport sampai setiap field tersisa ditinjau.
13. Migrasikan perender Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, dan LINE.
14. Perbarui dokumentasi untuk CLI pesan, halaman kanal, SDK Plugin, dan cookbook kemampuan.
15. Jalankan profiling fanout impor untuk Discord dan entrypoint kanal yang terdampak.

Langkah 1-11 dan 13-14 diimplementasikan dalam refactor ini untuk kontrak agen bersama, CLI, kemampuan Plugin, dan adapter keluar. Langkah 12 tetap menjadi pass pembersihan internal yang lebih dalam untuk envelope transport `channelData` privat penyedia. Langkah 15 tetap menjadi validasi tindak lanjut jika kita menginginkan angka fanout impor terkuantifikasi di luar gerbang tipe/tes.

## Tes

Tambahkan atau perbarui:

- Tes normalisasi presentasi.
- Tes penurunan otomatis presentasi untuk blok yang tidak didukung.
- Tes marker lintas-konteks untuk jalur plugin dispatch dan pengiriman core.
- Tes matriks render kanal untuk Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE, dan fallback teks.
- Tes skema message tool yang membuktikan field asli sudah hilang.
- Tes CLI yang membuktikan flag asli sudah hilang.
- Regresi kelambatan impor entrypoint Discord yang mencakup Carbon.
- Tes pin pengiriman yang mencakup Telegram dan fallback generik.

## Pertanyaan terbuka

- Haruskah `delivery.pin` diimplementasikan untuk Discord, Slack, MS Teams, dan Feishu pada pass pertama, atau hanya Telegram lebih dulu?
- Haruskah `delivery` pada akhirnya menyerap field yang sudah ada seperti `replyToId`, `replyToCurrent`, `silent`, dan `audioAsVoice`, atau tetap berfokus pada perilaku pascakirim?
- Haruskah presentasi mendukung gambar atau referensi file secara langsung, atau media sebaiknya tetap terpisah dari tata letak UI untuk saat ini?

## Terkait

- [Ikhtisar kanal](/id/channels)
- [Presentasi pesan](/id/plugins/message-presentation)
