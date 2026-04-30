---
read_when:
    - Memfaktorkan ulang antarmuka pesan kanal, muatan interaktif, atau perender kanal asli
    - Mengubah kemampuan alat pesan, petunjuk pengiriman, atau penanda lintas konteks
    - Men-debug fanout impor Discord Carbon atau kemalasan runtime Plugin kanal
summary: Pisahkan penyajian pesan semantik dari perender UI native kanal.
title: Rencana refaktor presentasi saluran
x-i18n:
    generated_at: "2026-04-30T09:58:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5608e7806a2a20e73ee82f1b1f0fcbbb4c865232df984d3d98b91e5b721998f5
    source_path: plan/ui-channels.md
    workflow: 16
---

## Status

Diimplementasikan untuk agen bersama, CLI, kemampuan Plugin, dan permukaan pengiriman keluar:

- `ReplyPayload.presentation` membawa UI pesan semantik.
- `ReplyPayload.delivery.pin` membawa permintaan penyematan pesan terkirim.
- Aksi pesan bersama mengekspos `presentation`, `delivery`, dan `pin`, bukan `components`, `blocks`, `buttons`, atau `card` native penyedia.
- Inti merender atau menurunkan otomatis presentasi melalui kemampuan keluar yang dideklarasikan Plugin.
- Perender Discord, Slack, Telegram, Mattermost, MS Teams, dan Feishu memakai kontrak generik.
- Kode bidang kontrol saluran Discord tidak lagi mengimpor kontainer UI yang didukung Carbon.

Dokumentasi kanonis sekarang berada di [Presentasi Pesan](/id/plugins/message-presentation).
Simpan rencana ini sebagai konteks implementasi historis; perbarui panduan kanonis
untuk perubahan kontrak, perender, atau perilaku fallback.

## Masalah

UI saluran saat ini terbagi di beberapa permukaan yang tidak kompatibel:

- Inti memiliki hook perender lintas-konteks berbentuk Discord melalui `buildCrossContextComponents`.
- `channel.ts` Discord dapat mengimpor UI Carbon native melalui `DiscordUiContainer`, yang menarik dependensi UI runtime ke bidang kontrol Plugin saluran.
- Agen dan CLI mengekspos celah keluar payload native seperti `components` Discord, `blocks` Slack, `buttons` Telegram atau Mattermost, dan `card` Teams atau Feishu.
- `ReplyPayload.channelData` membawa petunjuk transport dan amplop UI native.
- Model `interactive` generik sudah ada, tetapi lebih sempit daripada tata letak yang lebih kaya yang sudah digunakan oleh Discord, Slack, Teams, Feishu, LINE, Telegram, dan Mattermost.

Ini membuat inti menyadari bentuk UI native, melemahkan kelambatan runtime Plugin, dan memberi agen terlalu banyak cara khusus penyedia untuk mengekspresikan maksud pesan yang sama.

## Tujuan

- Inti menentukan presentasi semantik terbaik untuk sebuah pesan dari kemampuan yang dideklarasikan.
- Ekstensi mendeklarasikan kemampuan dan merender presentasi semantik menjadi payload transport native.
- UI Kontrol Web tetap terpisah dari UI native obrolan.
- Payload saluran native tidak diekspos melalui permukaan pesan agen bersama atau CLI.
- Fitur presentasi yang tidak didukung otomatis diturunkan ke representasi teks terbaik.
- Perilaku pengiriman seperti menyematkan pesan terkirim adalah metadata pengiriman generik, bukan presentasi.

## Bukan tujuan

- Tidak ada shim kompatibilitas mundur untuk `buildCrossContextComponents`.
- Tidak ada celah keluar native publik untuk `components`, `blocks`, `buttons`, atau `card`.
- Tidak ada impor inti dari pustaka UI native saluran.
- Tidak ada seam SDK khusus penyedia untuk saluran bawaan.

## Model target

Tambahkan field `presentation` milik inti ke `ReplyPayload`.

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

Skema agen eksternal dan CLI sekarang menggunakan `presentation`; `interactive` tetap menjadi helper parser/perender legacy internal untuk produsen balasan yang sudah ada.

## Metadata pengiriman

Tambahkan field `delivery` milik inti untuk perilaku kirim yang bukan UI.

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
- `notify` default ke `false`.
- `required` default ke `false`; saluran yang tidak didukung atau kegagalan penyematan otomatis diturunkan dengan melanjutkan pengiriman.
- Aksi pesan manual `pin`, `unpin`, dan `list-pins` tetap ada untuk pesan yang sudah ada.

Pengikatan topik ACP Telegram saat ini harus dipindahkan dari `channelData.telegram.pin = true` ke `delivery.pin = true`.

## Kontrak kemampuan runtime

Tambahkan hook perender presentasi dan pengiriman ke adaptor keluar runtime, bukan Plugin saluran bidang kontrol.

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

Perilaku inti:

- Selesaikan saluran target dan adaptor runtime.
- Minta kemampuan presentasi.
- Turunkan blok yang tidak didukung sebelum merender.
- Panggil `renderPresentation`.
- Jika tidak ada perender, konversi presentasi menjadi fallback teks.
- Setelah pengiriman berhasil, panggil `pinDeliveredMessage` saat `delivery.pin` diminta dan didukung.

## Pemetaan saluran

Discord:

- Render `presentation` ke komponen v2 dan kontainer Carbon di modul khusus runtime.
- Simpan helper warna aksen di modul ringan.
- Hapus impor `DiscordUiContainer` dari kode bidang kontrol Plugin saluran.

Slack:

- Render `presentation` ke Block Kit.
- Hapus input `blocks` agen dan CLI.

Telegram:

- Render teks, konteks, dan pembatas sebagai teks.
- Render aksi dan pilihan sebagai papan tombol inline saat dikonfigurasi dan diizinkan untuk permukaan target.
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

- Render `presentation` ke pesan Flex atau templat jika memungkinkan.
- Gunakan fallback ke teks untuk blok yang tidak didukung.
- Hapus payload UI LINE dari `channelData`.

Saluran polos atau terbatas:

- Konversi presentasi menjadi teks dengan pemformatan konservatif.

## Langkah refaktor

1. Terapkan ulang perbaikan rilis Discord yang memisahkan `ui-colors.ts` dari UI yang didukung Carbon dan menghapus `DiscordUiContainer` dari `extensions/discord/src/channel.ts`.
2. Tambahkan `presentation` dan `delivery` ke `ReplyPayload`, normalisasi payload keluar, ringkasan pengiriman, dan payload hook.
3. Tambahkan skema `MessagePresentation` dan helper parser di subpath SDK/runtime yang sempit.
4. Ganti kemampuan pesan `buttons`, `cards`, `components`, dan `blocks` dengan kemampuan presentasi semantik.
5. Tambahkan hook adaptor keluar runtime untuk perender presentasi dan penyematan pengiriman.
6. Ganti konstruksi komponen lintas-konteks dengan `buildCrossContextPresentation`.
7. Hapus `src/infra/outbound/channel-adapters.ts` dan hapus `buildCrossContextComponents` dari tipe Plugin saluran.
8. Ubah `maybeApplyCrossContextMarker` agar melampirkan `presentation`, bukan parameter native.
9. Perbarui jalur kirim plugin-dispatch agar hanya memakai presentasi semantik dan metadata pengiriman.
10. Hapus parameter payload native agen dan CLI: `components`, `blocks`, `buttons`, dan `card`.
11. Hapus helper SDK yang membuat skema alat pesan native, dan gantikan dengan helper skema presentasi.
12. Hapus amplop UI/native dari `channelData`; simpan hanya metadata transport hingga setiap field tersisa ditinjau.
13. Migrasikan perender Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, dan LINE.
14. Perbarui dokumentasi untuk CLI pesan, halaman saluran, SDK Plugin, dan cookbook kemampuan.
15. Jalankan profiling fanout impor untuk Discord dan entrypoint saluran yang terdampak.

Langkah 1-11 dan 13-14 diimplementasikan dalam refaktor ini untuk kontrak agen bersama, CLI, kemampuan Plugin, dan adaptor keluar. Langkah 12 tetap menjadi tahap pembersihan internal yang lebih dalam untuk amplop transport `channelData` privat penyedia. Langkah 15 tetap menjadi validasi lanjutan jika kita menginginkan angka fanout impor terkuantifikasi di luar gate tipe/tes.

## Tes

Tambahkan atau perbarui:

- Tes normalisasi presentasi.
- Tes penurunan otomatis presentasi untuk blok yang tidak didukung.
- Tes penanda lintas-konteks untuk plugin dispatch dan jalur pengiriman inti.
- Tes matriks perender saluran untuk Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE, dan fallback teks.
- Tes skema alat pesan yang membuktikan field native sudah hilang.
- Tes CLI yang membuktikan flag native sudah hilang.
- Regresi kelambatan impor entrypoint Discord yang mencakup Carbon.
- Tes penyematan pengiriman yang mencakup Telegram dan fallback generik.

## Pertanyaan terbuka

- Haruskah `delivery.pin` diimplementasikan untuk Discord, Slack, MS Teams, dan Feishu pada tahap pertama, atau hanya Telegram terlebih dahulu?
- Haruskah `delivery` pada akhirnya menyerap field yang sudah ada seperti `replyToId`, `replyToCurrent`, `silent`, dan `audioAsVoice`, atau tetap berfokus pada perilaku pascakirim?
- Haruskah presentasi mendukung gambar atau referensi file secara langsung, atau media harus tetap terpisah dari tata letak UI untuk saat ini?

## Terkait

- [Ikhtisar saluran](/id/channels)
- [Presentasi pesan](/id/plugins/message-presentation)
