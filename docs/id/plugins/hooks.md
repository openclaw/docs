---
read_when:
    - Anda sedang membangun plugin yang memerlukan before_tool_call, before_agent_reply, hook pesan, atau hook siklus hidup
    - Anda perlu memblokir, menulis ulang, atau mewajibkan persetujuan untuk pemanggilan alat dari sebuah plugin
    - Anda sedang memilih antara hook internal dan hook plugin
    - Anda memproyeksikan pemicu aktif Cron OpenClaw ke penjadwal host eksternal
summary: 'Hook Plugin: mencegat peristiwa siklus hidup agen, alat, pesan, sesi, dan Gateway'
title: Hook Plugin
x-i18n:
    generated_at: "2026-07-20T03:55:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 330deb9a7dfbf69b8bb5c7e06f61d4d1a0db670abff20328cac5858bc893c326
    source_path: plugins/hooks.md
    workflow: 16
---

Titik ekstensi dalam proses untuk Plugin OpenClaw adalah hook plugin: memeriksa atau
mengubah proses agen, panggilan alat, alur pesan, siklus hidup sesi, perutean subagen,
penginstalan, atau proses memulai Gateway.

Sebagai gantinya, gunakan [hook internal](/id/automation/hooks) untuk skrip kecil
`HOOK.md` yang diinstal operator dan bereaksi terhadap peristiwa perintah dan Gateway seperti `/new`,
`/reset`, `/stop`, `agent:bootstrap`, atau `gateway:startup`.

## Mulai cepat

Daftarkan hook bertipe dengan `api.on(...)` dari entri plugin:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Penangan yang dapat mengembalikan keputusan atau modifikasi dijalankan secara berurutan
berdasarkan `priority` menurun; penangan dengan prioritas sama mempertahankan urutan pendaftaran.
Penangan khusus observasi dijalankan secara paralel, dan pengiriman observasi
tanpa menunggu hasil dapat bertumpang tindih dengan peristiwa berikutnya. Jangan gunakan prioritas untuk mengurutkan
efek samping observasi.

`api.on(name, handler, opts?)` menerima:

| Opsi      | Efek                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | Pengurutan; nilai lebih tinggi dijalankan lebih dahulu.                                                                                                                                                                      |
| `timeoutMs` | Batas waktu tunggu per hook. Saat batas ini berakhir, OpenClaw berhenti menunggu penangan tersebut dan melanjutkan. Hal ini tidak membatalkan penangan atau efek sampingnya. Abaikan untuk menggunakan batas waktu per hook bawaan milik penjalan. |

Operator dapat mengatur batas waktu hook tanpa menambal kode plugin:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

`hooks.timeouts.<hookName>` menimpa `hooks.timeoutMs`, yang menimpa nilai
`api.on(..., { timeoutMs })` yang ditentukan oleh plugin. Setiap nilai harus berupa
bilangan bulat positif hingga 600000 ms. Utamakan penimpaan per hook untuk hook yang diketahui lambat
agar satu plugin tidak memperoleh batas waktu lebih panjang di semua tempat.

Promise penangan yang kehabisan waktu terus berjalan karena callback hook tidak
menerima sinyal pembatalan. Pengiriman hook dapat melepaskan izin masuk Gateway
meskipun pekerjaan plugin tersebut masih berlangsung. Plugin yang memiliki
pekerjaan berjalan lama harus menyediakan siklus hidup pembatalan dan penghentiannya sendiri.

Hook modifikasi keluar `message_sending` dan `reply_payload_sending` menggunakan batas waktu bawaan
15 detik per penangan. Jika salah satunya kehabisan waktu, OpenClaw mencatat kesalahan plugin
dan melanjutkan dengan payload terbaru agar jalur pengiriman berseri dapat
diselesaikan. Tetapkan batas waktu per hook yang lebih besar untuk plugin yang sengaja melakukan
pekerjaan lebih lambat sebelum pengiriman.

Plugin saluran yang menggunakan `createReplyDispatcher` juga dapat mendeklarasikan
batas waktu positif per tahap yang lebih besar dengan `beforeDeliverOptions: { timeoutMs }`, atau saat
menambahkan pekerjaan dengan `dispatcher.appendBeforeDeliver(handler, { timeoutMs })`.
Tanpa batas waktu yang dideklarasikan pemilik, callback tersebut menggunakan batas waktu bawaan
15 detik yang sama agar callback yang macet tidak dapat menahan jalur pengiriman berseri.

Setiap hook menerima `event.context.pluginConfig`, yaitu konfigurasi yang telah diselesaikan untuk
plugin yang mendaftarkan penangan tersebut. OpenClaw menyuntikkannya per penangan tanpa
mengubah objek peristiwa bersama yang dilihat plugin lain.

## Katalog hook

Hook dikelompokkan berdasarkan permukaan yang diperluasnya. Nama yang dicetak **tebal** menerima hasil
keputusan (blokir, batalkan, timpa, atau wajibkan persetujuan); sisanya
khusus observasi.

**Giliran agen**

| Hook                            | Tujuan                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `before_model_resolve`          | Menimpa penyedia atau model sebelum pesan sesi dimuat                                  |
| `agent_turn_prepare`            | Menggunakan injeksi giliran plugin yang mengantre dan menambahkan konteks giliran yang sama sebelum hook prompt      |
| `before_prompt_build`           | Menambahkan konteks dinamis atau teks prompt sistem sebelum panggilan model                          |
| **`before_agent_run`**          | Memeriksa prompt akhir dan pesan sesi sebelum dikirim ke model; dapat memblokir proses |
| **`before_agent_reply`**        | Melewati giliran model dengan balasan sintetis atau tanpa balasan                           |
| **`before_agent_finalize`**     | Memeriksa jawaban akhir alami dan meminta satu proses model lagi                         |
| `agent_end`                     | Mengamati pesan akhir, status keberhasilan, dan durasi proses                                  |
| `heartbeat_prompt_contribution` | Menambahkan konteks khusus Heartbeat untuk plugin pemantau latar belakang dan siklus hidup                  |

**Observasi percakapan**

| Hook                                      | Tujuan                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `model_call_started` / `model_call_ended` | Metadata panggilan penyedia/model yang disanitasi: waktu, hasil, hash ID permintaan terbatas. Tanpa konten prompt atau respons. |
| `llm_input`                               | Masukan penyedia: prompt sistem, prompt, riwayat                                                                     |
| `llm_output`                              | Keluaran penyedia, penggunaan, dan `contextTokenBudget` yang telah diselesaikan jika tersedia                                       |

**Alat**

| Hook                       | Tujuan                                                   |
| -------------------------- | --------------------------------------------------------- |
| **`before_tool_call`**     | Menulis ulang parameter alat, memblokir eksekusi, atau mewajibkan persetujuan |
| `after_tool_call`          | Mengamati hasil alat, kesalahan, dan durasi                |
| `resolve_exec_env`         | Menyumbangkan variabel lingkungan milik plugin ke `exec`   |
| **`tool_result_persist`**  | Menulis ulang pesan asisten yang dihasilkan dari hasil alat |
| **`before_message_write`** | Memeriksa atau memblokir penulisan pesan yang sedang berlangsung (jarang)      |

**Pesan dan pengiriman**

| Hook                            | Tujuan                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| **`inbound_claim`**             | Mengambil alih pesan masuk sebelum perutean agen (balasan sintetis) |
| **`channel_pairing_requested`** | Mengamati permintaan pemasangan DM yang baru dibuat                         |
| `message_received`              | Mengamati konten masuk, pengirim, utas, dan metadata             |
| **`message_sending`**           | Menulis ulang konten keluar atau membatalkan pengiriman                       |
| **`reply_payload_sending`**     | Mengubah atau membatalkan payload balasan yang dinormalisasi sebelum pengiriman        |
| `message_sent`                  | Mengamati keberhasilan atau kegagalan pengiriman keluar                      |
| **`before_dispatch`**           | Memeriksa atau menulis ulang pengiriman keluar sebelum diserahkan ke saluran    |
| **`reply_dispatch`**            | Berpartisipasi dalam pipeline pengiriman balasan akhir                  |

**Sesi dan Compaction**

| Hook                                     | Tujuan                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | Melacak batas siklus hidup sesi. `reason` adalah salah satu dari `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart`, atau `unknown`. `shutdown`/`restart` dipicu dari finalisator penghentian Gateway saat proses berhenti atau dimulai ulang dengan sesi aktif, sehingga plugin (memori, penyimpanan transkrip) dapat menyelesaikan baris siluman alih-alih membiarkannya terbuka di antara mulai ulang. Finalisator dibatasi agar plugin yang lambat tidak dapat memblokir SIGTERM/SIGINT. |
| `before_compaction` / `after_compaction` | Mengamati atau menganotasi siklus Compaction                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `before_reset`                           | Mengamati peristiwa pengaturan ulang sesi (`/reset`, pengaturan ulang terprogram)                                                                                                                                                                                                                                                                                                                                                                                                     |

Untuk panggilan `sessions.create` dengan `parentSessionKey` dan `emitCommandHooks: true`, turunan yang berbeda selalu menerima `session_start`. Pemanggil mendeklarasikan apakah induk juga menerima `session_end` terminal dengan `succeedsParent`: `true` berarti penerus, `false` berarti turunan paralel. Pengabaian mempertahankan perilaku rollover induk lama. Hook `command:new` dan `before_reset` tetap menjelaskan tindakan `/new` yang diminta dalam kedua kasus.

**Subagen**

- `subagent_spawned` / `subagent_ended` - amati peluncuran dan penyelesaian subagen.
- `subagent_delivery_target` - kait kompatibilitas untuk pengiriman penyelesaian ketika tidak ada pengikatan sesi inti yang dapat memproyeksikan rute.
- `subagent_spawning` - kait kompatibilitas yang tidak digunakan lagi. Inti kini menyiapkan pengikatan subagen `thread: true` melalui adaptor pengikatan sesi saluran sebelum `subagent_spawned` dipicu.
- `subagent_spawned` menyertakan `resolvedModel` dan `resolvedProvider` ketika OpenClaw telah menentukan model native sesi anak sebelum peluncuran.
- `subagent_ended` membawa `targetSessionKey` (identitas - cocok dengan `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` atau `"acp"`), `reason`, `outcome` opsional (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"`, atau `"deleted"`), `error` opsional, `runId`, `endedAt`, `accountId`, dan `sendFarewell`. Ini **tidak** menyertakan `agentId` atau `childSessionKey`; gunakan `targetSessionKey` untuk mengorelasikannya dengan peristiwa `subagent_spawned` yang sesuai.

**Siklus hidup**

| Kait                             | Tujuan                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | Memulai atau menghentikan layanan milik plugin bersama Gateway                                                 |
| `deactivate`                     | Alias kompatibilitas yang tidak digunakan lagi untuk `gateway_stop`; gunakan `gateway_stop` dalam plugin baru                 |
| `cron_reconciled`                | Merekonsiliasi terhadap status cron Gateway lengkap setelah penyalaan atau pemuatan ulang                            |
| `cron_changed`                   | Mengamati perubahan siklus hidup cron milik Gateway (ditambahkan, diperbarui, dihapus, dimulai, selesai, dijadwalkan) |
| **`before_install`**             | Memeriksa materi instalasi skill atau plugin yang telah disiapkan dari runtime plugin yang dimuat                         |

### Permintaan pemasangan saluran

Gunakan `channel_pairing_requested` ketika plugin perlu memberi tahu operator atau
menulis catatan audit setelah pengirim DM yang belum dipasangkan membuat permintaan
pemasangan tertunda. Kait dipanggil ketika permintaan dibuat; pengiriman balasan
pemasangan melalui saluran tidak ditunda oleh penangan kait yang lambat atau gagal.

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `Permintaan pemasangan ${event.channel} baru dari ${event.senderId}: ${event.code}`,
  });
});
```

Kait ini hanya untuk pengamatan. Kait ini tidak menyetujui, menolak, menyembunyikan, atau menulis ulang
balasan pemasangan. Muatan mencakup saluran, `accountId` opsional,
`senderId` dengan cakupan saluran, `code` pemasangan, dan metadata saluran. Perlakukan
kode pemasangan sebagai kredensial persetujuan sekali pakai yang aktif dan kirimkan hanya ke
tujuan operator tepercaya. Perlakukan `metadata` sebagai teks identitas tidak tepercaya
yang diberikan oleh pengirim. Kait tidak menyertakan isi atau media pesan masuk.

## Kait runtime debug

Gunakan `before_model_resolve` untuk mengganti penyedia atau model bagi satu giliran agen - kait ini
berjalan sebelum resolusi model. `llm_output` hanya berjalan setelah suatu percobaan model
menghasilkan keluaran asisten.

Untuk membuktikan model sesi yang berlaku, periksa pendaftaran runtime, lalu
gunakan `openclaw sessions` atau permukaan sesi/status Gateway. Untuk men-debug
muatan penyedia, mulai Gateway dengan `--raw-stream` dan
`--raw-stream-path <path>` untuk menulis peristiwa stream model mentah ke file jsonl.

## Kebijakan pemanggilan alat

`before_tool_call` menerima:

- `event.toolName`
- `event.params`
- `event.toolKind` dan `event.toolInputKind` opsional, diskriminator otoritatif dari host
  untuk alat yang sengaja berbagi nama; misalnya, pemanggilan `exec`
  mode kode luar menggunakan `toolKind: "code_mode_exec"` dan menyertakan
  `toolInputKind: "javascript" | "typescript"` ketika bahasa masukan
  diketahui
- `event.derivedPaths` opsional, petunjuk jalur target yang diperoleh dari host berdasarkan upaya terbaik
  untuk amplop alat yang dikenal baik seperti `apply_patch`; jalur ini mungkin
  tidak lengkap atau memperkirakan secara berlebihan apa yang sebenarnya akan disentuh alat (misalnya,
  dengan masukan yang rusak atau parsial)
- `event.runId` opsional
- `event.toolCallId` opsional
- bidang konteks seperti `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.toolKind`, `ctx.toolInputKind`, dan `ctx.trace` diagnostik
- `ctx.requester` opsional, pemohon yang diperoleh dari host yang memulai proses
  pesan saat ini. Ini dapat menyertakan `channel`, `accountId`, `senderId`,
  `senderIsOwner`, dan `roleIds` native penyedia. Bidang yang tidak ada berarti belum terbukti,
  bukan jaminan bahwa nilainya salah; tolak secara default ketika kebijakan mewajibkannya.

Ini dapat mengembalikan:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    /** @deprecated Persetujuan yang belum diselesaikan selalu ditolak. */
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Perilaku pengaman untuk kait siklus hidup bertipe:

- `block: true` bersifat terminal dan melewati penangan berprioritas lebih rendah.
- `block: false` diperlakukan sebagai tidak ada keputusan.
- `params` menulis ulang parameter alat untuk eksekusi.
- `requireApproval` menjeda proses agen dan meminta pengguna melalui
persetujuan plugin. `/approve` dapat menyetujui persetujuan exec maupun plugin. Dalam relai
`PreToolUse` native mode laporan app-server Codex, tindakan ini menyerahkan penanganan ke
permintaan persetujuan app-server yang sesuai; lihat
[runtime harness Codex](/id/plugins/codex-harness-runtime#hook-boundaries).
- `block: true` berprioritas lebih rendah masih dapat memblokir setelah kait berprioritas lebih tinggi
meminta persetujuan.
- `onResolution` menerima keputusan yang telah ditetapkan: `allow-once`, `allow-always`,
`deny`, `timeout`, atau `cancelled`.

### Kebijakan yang memperhatikan pengirim dalam satu file

File plugin mandiri dapat menyimpan kebijakan khusus penerapan dalam kode
alih-alih menambahkan skema konfigurasi lain. Contoh ini memberi pemilik akses ke setiap alat,
memungkinkan pengelola yang dikonfigurasi menggunakan kumpulan alat dan tindakan pesan yang konservatif,
serta mengekspos `/fix` kepada pengirim yang telah diberi otorisasi oleh konfigurasi saluran:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const AGENT_ID = "maintenance-agent";
const MAINTAINER_SCOPES = [
  {
    channel: "discord",
    accountId: "operations",
    senderIds: new Set(["maintainer-user-id"]),
    roleIds: new Set(["maintainer-role-id"]),
  },
];
const MAINTAINER_TOOLS = new Set(["read", "web_fetch", "web_search", "session_status", "message"]);
const MAINTAINER_MESSAGE_ACTIONS = new Set(["react", "reply", "thread-create", "thread-reply"]);

export default definePluginEntry({
  id: "maintenance-access",
  name: "Akses pemeliharaan",
  description: "Terapkan kebijakan alat yang memperhatikan pengirim pada agen pemeliharaan.",
  register(api) {
    api.on("before_tool_call", (event, ctx) => {
      if (ctx.agentId !== AGENT_ID) {
        return;
      }

      const requester = ctx.requester;
      if (requester?.senderIsOwner === true) {
        return;
      }

      const maintainerScope = requester
        ? MAINTAINER_SCOPES.find(
            (scope) =>
              scope.channel === requester.channel && scope.accountId === requester.accountId,
          )
        : undefined;
      const isMaintainer =
        maintainerScope !== undefined &&
        ((requester?.senderId !== undefined && maintainerScope.senderIds.has(requester.senderId)) ||
          requester?.roleIds?.some((roleId) => maintainerScope.roleIds.has(roleId)) === true);
      if (!isMaintainer) {
        return { block: true, blockReason: "Akses pengelola diperlukan." };
      }

      if (event.toolName === "message") {
        const action = typeof event.params.action === "string" ? event.params.action : "";
        if (MAINTAINER_MESSAGE_ACTIONS.has(action)) {
          return;
        }
        return { block: true, blockReason: `Pemilik diperlukan untuk message.${action || "unknown"}.` };
      }

      if (MAINTAINER_TOOLS.has(event.toolName)) {
        return;
      }
      return { block: true, blockReason: `Pemilik diperlukan untuk ${event.toolName}.` };
    });

    api.registerCommand({
      name: "fix",
      description: "Minta agen pemeliharaan untuk menyelidiki dan memperbaiki masalah.",
      acceptsArgs: true,
      requireAuth: true,
      handler: async (ctx) =>
        ctx.agentId === AGENT_ID
          ? { continueAgent: true }
          : { text: "Perintah ini hanya tersedia dalam percakapan pemeliharaan." },
    });
  },
});
```

Muat file secara langsung dan mulai ulang Gateway:

```json5
{
  agents: {
    list: [
      {
        id: "maintenance-agent",
        workspace: "~/.openclaw/workspace-maintenance",
      },
    ],
  },
  bindings: [
    {
      agentId: "maintenance-agent",
      match: {
        channel: "discord",
        accountId: "operations",
        peer: { kind: "channel", id: "maintenance-channel-id" },
      },
    },
  ],
  plugins: {
    load: { paths: ["~/.openclaw/policies/maintenance-access.ts"] },
  },
}
```

`AGENT_ID` harus menamai agen yang terikat ke percakapan pemeliharaan. Pengikatan
memilih agen tersebut untuk pesan normal dan `/fix`; file mandiri
tetap menjadi satu-satunya pemilik kebijakan alat antara pemilik dan pengelola.

`requireAuth: true` menggunakan kembali penerimaan pengirim yang sudah ada pada setiap saluran. Untuk
Discord, daftar izin `users`/`roles` guild atau saluran dapat mengotorisasi
audiens pemeliharaan. Saluran lain dapat menggunakan id pengirim yang stabil. Kait kemudian
menerapkan keputusan per alat yang lebih terperinci pada setiap pemanggilan alat dalam proses,
termasuk pemanggilan `PreToolUse` native Codex. Kait dapat memveto alat yang dilihat model, tetapi tidak dapat
menambahkan alat yang dihilangkan oleh host. Kebijakan sandbox, persetujuan exec, alat inti
khusus pemilik, dan saluran yang sudah ada tetap berlaku; kait tidak dapat memberikan akses melampauinya.

Batasi cakupan id pengirim dan peran pada pasangan saluran/akun yang tepat seperti ditunjukkan; keduanya merupakan
namespace lokal penyedia. Pertahankan daftar izin yang konservatif. Tambahkan alat tulis atau
eksekusi hanya jika kebijakan sandbox dan persetujuan penerapan membuatnya
aman. Untuk proses otomatis atau sistem, putuskan secara eksplisit apakah `ctx.requester`
yang tidak ada harus diizinkan; contoh ini menolaknya untuk agen yang dicakup.

Lihat [Permintaan izin plugin](/id/plugins/plugin-permission-requests) untuk
perutean persetujuan, perilaku keputusan, dan kapan menggunakan `requireApproval`
alih-alih alat opsional atau persetujuan exec.

Plugin yang memerlukan kebijakan tingkat host dapat mendaftarkan kebijakan alat tepercaya dengan
`api.registerTrustedToolPolicy(...)`. Kebijakan ini berjalan sebelum kait
`before_tool_call` biasa dan sebelum keputusan kait normal. Kebijakan tepercaya bawaan
berjalan lebih dahulu; kebijakan tepercaya plugin terinstal berjalan berikutnya sesuai urutan pemuatan plugin;
kait `before_tool_call` biasa berjalan setelahnya. Plugin bawaan mempertahankan
jalur kebijakan tepercaya yang sudah ada. Plugin terinstal harus diaktifkan secara eksplisit
dan mendeklarasikan setiap id kebijakan dalam `contracts.trustedToolPolicies`; id yang tidak dideklarasikan
ditolak sebelum pendaftaran. Id kebijakan dibatasi pada plugin yang mendaftarkannya,
sehingga plugin yang berbeda dapat menggunakan kembali id lokal yang sama. Gunakan tingkat ini hanya
untuk pengaman yang dipercaya host seperti kebijakan ruang kerja, penegakan anggaran, atau
keamanan alur kerja yang dicadangkan.

### Hook lingkungan exec

`resolve_exec_env` memungkinkan plugin menyumbangkan variabel lingkungan ke pemanggilan alat `exec`
sebelum perintah dijalankan. Hook ini menerima:

- `event.sessionKey`
- `event.toolName`, saat ini selalu `"exec"`
- `event.host`, salah satu dari `"gateway"`, `"sandbox"`, atau `"node"`
- bidang konteks seperti `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider`, dan `ctx.channelId`

Kembalikan `Record<string, string>` untuk digabungkan ke lingkungan exec. Handler
berjalan berdasarkan urutan prioritas; hasil yang lebih baru menimpa hasil sebelumnya untuk
kunci yang sama.

Output hook difilter melalui kebijakan kunci lingkungan exec host sebelum
digabungkan. `PATH` selalu dihapus (resolusi perintah dan pemeriksaan safe-bin
bergantung padanya). Kunci yang tidak valid dan kunci penimpaan host yang berbahaya seperti `LD_*`,
`DYLD_*`, `NODE_OPTIONS`, variabel proksi (`HTTP_PROXY`, `HTTPS_PROXY`,
`ALL_PROXY`, `NO_PROXY`), dan variabel penimpaan TLS (`NODE_TLS_REJECT_UNAUTHORIZED`,
`SSL_CERT_FILE`, dan yang serupa) dihapus. Lingkungan plugin yang telah difilter disertakan
dalam metadata persetujuan/audit Gateway dan diteruskan ke permintaan eksekusi
node-host.

### Persistensi hasil alat

Hasil alat dapat menyertakan `details` terstruktur untuk perenderan UI, diagnostik,
perutean media, atau metadata milik plugin. Perlakukan `details` sebagai metadata runtime,
bukan konten prompt:

- OpenClaw menghapus `toolResult.details` sebelum pemutaran ulang provider dan input
  compaction agar metadata tidak menjadi konteks model.
- Entri sesi yang dipersistenkan hanya mempertahankan `details` yang dibatasi. Detail yang terlalu besar
  diganti dengan ringkasan ringkas dan `persistedDetailsTruncated: true`.
- `tool_result_persist` dan `before_message_write` berjalan sebelum batas
  persistensi akhir. Jaga agar `details` yang dikembalikan tetap kecil dan hindari menempatkan
  teks yang relevan dengan prompt hanya di `details`; letakkan output alat yang terlihat oleh model di
  `content`.

## Hook prompt dan model

Gunakan hook khusus fase untuk plugin baru:

- `before_model_resolve`: hanya menerima prompt saat ini dan metadata
  lampiran. Kembalikan `providerOverride` atau `modelOverride`.
- `agent_turn_prepare`: menerima prompt saat ini, pesan sesi yang telah
  disiapkan, dan setiap injeksi antrean tepat-sekali yang dikuras untuk sesi ini.
  Kembalikan `prependContext` atau `appendContext`.
- `before_prompt_build`: menerima prompt saat ini dan pesan sesi.
  Kembalikan `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext`, atau `appendSystemContext`.
- `heartbeat_prompt_contribution`: hanya berjalan untuk giliran heartbeat dan mengembalikan
  `prependContext` atau `appendContext`. Ditujukan bagi monitor latar belakang yang
  perlu meringkas keadaan saat ini tanpa mengubah giliran yang dimulai pengguna.

`before_agent_run` berjalan setelah konstruksi prompt dan sebelum input model apa pun,
termasuk pemuatan gambar lokal prompt dan observasi `llm_input`. Hook ini menerima
input pengguna saat ini sebagai `prompt`, beserta riwayat sesi yang dimuat di `messages`
dan prompt sistem aktif. Kembalikan `{ outcome: "block", reason, message? }`
untuk menghentikan proses sebelum model membaca prompt. `reason` bersifat internal;
`message` adalah pengganti yang ditampilkan kepada pengguna. Hanya hasil `pass` dan `block` yang
didukung; bentuk keputusan yang tidak didukung akan ditolak secara aman.

Ketika proses diblokir, OpenClaw hanya menyimpan teks pengganti di
`message.content` beserta metadata pemblokiran yang tidak sensitif seperti ID plugin
pemblokir dan stempel waktu. Teks asli pengguna tidak dipertahankan dalam transkrip
atau konteks mendatang. Alasan pemblokiran internal diperlakukan sebagai informasi sensitif dan
dikecualikan dari payload transkrip, riwayat, siaran, log, dan diagnostik.
Observabilitas harus menggunakan bidang yang telah disanitasi seperti ID pemblokir, hasil,
stempel waktu, atau kategori yang aman.

Hook giliran agen termasuk `agent_end` menyertakan `event.runId` ketika OpenClaw dapat
mengidentifikasi proses aktif; nilai yang sama juga tersedia di `ctx.runId`. Proses yang digerakkan Cron
juga mengekspos `ctx.jobId` (ID tugas cron asal) pada konteks giliran agen
agar hook dapat membatasi metrik, efek samping, atau keadaan ke tugas terjadwal
tertentu. `ctx.jobId` bukan bagian dari konteks alat `before_tool_call`.

Untuk proses yang berasal dari channel, `ctx.channel` dan `ctx.messageProvider` mengidentifikasi
permukaan provider seperti `discord` atau `telegram`, sedangkan `ctx.channelId` adalah
pengidentifikasi target percakapan ketika OpenClaw dapat menentukannya dari
kunci sesi atau metadata pengiriman.

Ketika identitas pengirim tersedia, konteks hook agen juga menyertakan:

- `ctx.senderId` - ID pengirim yang tercakup dalam channel (misalnya `open_id` Feishu, ID
  pengguna Discord). Diisi ketika proses berasal dari pesan pengguna dengan
  metadata pengirim yang diketahui.
- `ctx.chatId` - pengidentifikasi percakapan asli transportasi (misalnya
  `chat_id` Feishu, `chat_id` Telegram). Diisi ketika channel asal
  menyediakan ID percakapan asli.
- `ctx.channelContext.sender.id` - ID pengirim yang sama dengan `ctx.senderId`, di dalam
  objek milik channel yang dapat diperluas plugin dengan bidang khusus channel.
- `ctx.channelContext.chat.id` - ID percakapan yang sama dengan `ctx.chatId`,
  di dalam objek milik channel yang dapat diperluas plugin dengan bidang khusus
  channel.

Core hanya mendefinisikan bidang `id` bertingkat. Plugin channel yang meneruskan metadata
pengirim atau percakapan yang lebih lengkap melalui helper inbound dapat menambahkan
`PluginHookChannelSenderContext` atau `PluginHookChannelChatContext` dari
`openclaw/plugin-sdk/channel-inbound`:

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

Plugin channel meneruskan bidang tersebut melalui helper SDK inbound:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Bidang ini bersifat opsional dan tidak tersedia untuk proses yang berasal dari sistem (heartbeat,
cron, exec-event).

`ctx.senderExternalId` tetap tersedia sebagai bidang kompatibilitas sumber yang tidak digunakan lagi untuk
plugin lama. Core tidak mengisinya; identitas pengirim khusus channel
yang baru harus berada di bawah `ctx.channelContext.sender` melalui augmentasi
modul.

`agent_end` adalah hook observasi. Jalur Gateway dan harness persisten menjalankannya
secara fire-and-forget setelah giliran selesai, sedangkan jalur CLI sekali jalan berumur pendek menunggu
promise hook sebelum pembersihan proses agar plugin tepercaya dapat melakukan flush
observabilitas terminal atau menangkap keadaan. Runner hook menerapkan batas waktu 30 detik
agar plugin atau endpoint embedding yang macet tidak membiarkan promise hook
tertunda selamanya. Batas waktu dicatat dalam log dan OpenClaw melanjutkan proses; hal ini tidak
membatalkan pekerjaan jaringan milik plugin kecuali plugin juga menggunakan sinyal abort
sendiri.

Gunakan `model_call_started` dan `model_call_ended` untuk telemetri panggilan provider
yang tidak boleh menerima prompt mentah, riwayat, respons, header, isi
permintaan, atau ID permintaan provider. Hook ini menyertakan metadata stabil seperti
`runId`, `callId`, `provider`, `model`, `api`/`transport` opsional, `durationMs`/`outcome` terminal, dan `upstreamRequestIdHash` ketika OpenClaw dapat memperoleh
hash ID permintaan provider yang dibatasi. Ketika runtime telah menyelesaikan
metadata jendela konteks, peristiwa dan konteks hook juga menyertakan
`contextTokenBudget`, anggaran token efektif setelah batas model/config/agen,
beserta `contextWindowSource` dan `contextWindowReferenceTokens` ketika
batas yang lebih rendah diterapkan.

`before_agent_finalize` hanya berjalan ketika harness akan menerima jawaban akhir
alami dari asisten. Ini bukan jalur pembatalan `/stop` dan tidak
berjalan ketika pengguna membatalkan giliran. Kembalikan `{ action: "revise", reason }` untuk meminta
harness melakukan satu proses model tambahan sebelum finalisasi, `{ action:
"finalize", reason? }` untuk memaksakan finalisasi, atau jangan kembalikan hasil untuk melanjutkan.
Handler memiliki anggaran default 15 detik; saat batas waktu tercapai, OpenClaw mencatat kegagalan dan
melanjutkan dengan jawaban akhir asli.
Hook `Stop` asli Codex diteruskan ke hook ini sebagai keputusan
`before_agent_finalize` OpenClaw.

Saat mengembalikan `action: "revise"`, plugin dapat menyertakan metadata `retry` agar
proses model tambahan dibatasi dan aman untuk diputar ulang:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` ditambahkan ke alasan revisi yang dikirim ke harness.
`idempotencyKey` memungkinkan host menghitung percobaan ulang untuk permintaan plugin yang sama
di seluruh keputusan finalisasi yang setara, dan `maxAttempts` membatasi jumlah proses
tambahan yang akan diizinkan host sebelum melanjutkan dengan jawaban akhir alami.

Plugin yang tidak dibundel dan memerlukan hook percakapan mentah (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end`, atau `before_agent_run`) harus menetapkan:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

Hook yang mengubah prompt dan injeksi giliran berikutnya yang tahan lama dapat dinonaktifkan per
plugin dengan `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Ekstensi sesi dan injeksi giliran berikutnya

Plugin alur kerja dapat mempersistenkan keadaan sesi kecil yang kompatibel dengan JSON menggunakan
`api.session.state.registerSessionExtension(...)` dan memperbaruinya melalui metode Gateway
`sessions.pluginPatch`. Baris sesi memproyeksikan keadaan ekstensi
terdaftar melalui `pluginExtensions`, sehingga Control UI dan klien lain dapat
merender status milik plugin tanpa mengetahui internal plugin.
`api.registerSessionExtension(...)` masih berfungsi tetapi tidak digunakan lagi dan digantikan oleh
namespace `api.session.state`.

Gunakan `api.session.workflow.enqueueNextTurnInjection(...)` ketika plugin memerlukan
konteks tahan lama untuk mencapai giliran model berikutnya tepat satu kali (`api.enqueueNextTurnInjection(...)` tingkat atas
adalah alias yang tidak digunakan lagi dengan perilaku yang sama).
OpenClaw menguras injeksi antrean sebelum hook prompt, membuang injeksi yang
kedaluwarsa, dan melakukan deduplikasi berdasarkan `idempotencyKey` per plugin. Ini adalah
seam yang tepat untuk kelanjutan persetujuan, ringkasan kebijakan, delta monitor
latar belakang, dan kelanjutan perintah yang harus terlihat oleh model pada
giliran berikutnya tetapi tidak boleh menjadi teks prompt sistem permanen.

Semantik pembersihan adalah bagian dari kontrak. Callback pembersihan ekstensi sesi dan
siklus hidup runtime menerima `reset`, `delete`, `disable`, atau
`restart`. Host menghapus keadaan ekstensi sesi persisten milik plugin
dan injeksi giliran berikutnya yang tertunda untuk reset/penghapusan/penonaktifan; mulai ulang
mempertahankan keadaan sesi tahan lama sementara callback pembersihan memungkinkan plugin melepaskan
tugas penjadwal, konteks proses, dan sumber daya di luar saluran lainnya untuk generasi
runtime lama.

## Hook pesan

Gunakan hook pesan untuk kebijakan perutean dan pengiriman tingkat channel:

- `message_received`: mengamati konten masuk, pengirim, `threadId`,
  `messageId`, `senderId`, korelasi proses/sesi opsional, dan metadata.
- `message_sending`: menulis ulang `content` atau mengembalikan `{ cancel: true }`.
- `reply_payload_sending`: menulis ulang objek `ReplyPayload` yang telah dinormalisasi
  (termasuk `presentation`, `delivery`, referensi media, dan teks) atau mengembalikan
  `{ cancel: true }`.
- `message_sent`: mengamati keberhasilan atau kegagalan akhir.

Untuk balasan TTS khusus audio, `content` dapat berisi transkrip ucapan
tersembunyi meskipun payload channel tidak memiliki teks/caption yang terlihat.
Menulis ulang `content` tersebut hanya memperbarui transkrip yang terlihat oleh hook; transkrip itu tidak
dirender sebagai caption media.

Peristiwa `reply_payload_sending` dapat menyertakan `usageState`, snapshot model/penggunaan/konteks
langsung per giliran dengan upaya terbaik. Pengiriman tahan lama, pemutaran ulang yang dipulihkan, dan
balasan tanpa korelasi proses yang tepat tidak menyertakannya.

Konteks hook pesan mengekspos bidang korelasi yang stabil jika tersedia:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, dan `ctx.callDepth`. Konteks pesan masuk
dan `before_dispatch` juga mengekspos metadata balasan jika saluran
memiliki data pesan kutipan yang telah difilter berdasarkan visibilitas: `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender`, dan `replyToIsQuote`. Utamakan bidang
kelas utama ini sebelum membaca metadata lama.

Utamakan bidang `threadId` dan `replyToId` bertipe sebelum menggunakan metadata
khusus saluran.

Aturan keputusan:

- `message_sending` dengan `cancel: true` bersifat terminal.
- `message_sending` dengan `cancel: false` dianggap tidak menghasilkan keputusan.
- `content` yang ditulis ulang berlanjut ke hook berprioritas lebih rendah kecuali hook berikutnya
  membatalkan pengiriman.
- `reply_payload_sending` berjalan setelah normalisasi muatan dan sebelum pengiriman
  saluran, termasuk balasan yang dirutekan kembali ke saluran asal.
  Handler berjalan secara berurutan dan setiap handler melihat muatan terbaru yang dihasilkan
  oleh handler berprioritas lebih tinggi.
- Muatan `reply_payload_sending` tidak mengekspos penanda kepercayaan runtime seperti
  `trustedLocalMedia`; plugin dapat mengedit bentuk muatan tetapi tidak dapat memberikan kepercayaan
  media lokal.
- `message_sending` dapat mengembalikan `cancelReason` dan `metadata` terbatas bersama
  pembatalan. API siklus hidup pesan baru mengeksposnya sebagai hasil
  pengiriman yang ditekan dengan alasan `cancelled_by_message_sending_hook`; pengiriman
  langsung lama tetap mengembalikan larik hasil kosong demi kompatibilitas.
- `message_sent` hanya untuk observasi. Kegagalan handler dicatat dan tidak
  mengubah hasil pengiriman.

## Memasang hook

Gunakan `security.installPolicy` untuk keputusan izinkan/blokir milik operator. Kebijakan
tersebut berjalan dari konfigurasi OpenClaw, mencakup jalur pemasangan dan pembaruan CLI, serta
gagal secara tertutup ketika diaktifkan tetapi tidak tersedia.

`before_install` adalah hook siklus hidup runtime plugin. Hook ini berjalan setelah
`security.installPolicy` hanya dalam proses OpenClaw tempat hook plugin telah
dimuat, seperti alur pemasangan yang didukung Gateway. Hook ini berguna untuk
observasi, peringatan, dan pemeriksaan kompatibilitas milik plugin, tetapi bukan
batas keamanan utama perusahaan atau host untuk pemasangan. Bidang
`builtinScan` tetap ada dalam muatan peristiwa demi kompatibilitas, tetapi
OpenClaw tidak lagi menjalankan pemblokiran kode berbahaya bawaan saat pemasangan, sehingga
bidang tersebut merupakan hasil `ok` kosong. Kembalikan temuan tambahan atau
`{ block: true, blockReason }` untuk menghentikan pemasangan dalam proses tersebut.

`block: true` bersifat terminal. `block: false` dianggap tidak menghasilkan keputusan. Kegagalan
handler memblokir pemasangan secara gagal-tertutup.

## Siklus hidup Gateway

Gunakan `gateway_start` untuk memulai layanan plugin umum dan `gateway_stop` untuk
membersihkan sumber daya yang berjalan lama. Penjadwal cron mungkin masih dimuat ketika
`gateway_start` berjalan, jadi jangan gunakan hook tersebut sebagai sinyal dasar untuk proyeksi
cron eksternal.

Jangan mengandalkan hook internal `gateway:startup` untuk layanan runtime
milik plugin.

`cron_reconciled` dipicu setelah penjadwal cron Gateway dan pemantau saat keluarnya
telah merekonsiliasi status durabelnya. Hook ini dipicu baik saat
startup awal maupun penggantian penjadwal selama pemuatan ulang konfigurasi. Peristiwa melaporkan
`reason` (`startup` atau `reload`) dan status efektif `enabled`. Cron yang
dinonaktifkan tetap memancarkan dengan `enabled: false`, sehingga proyeksi eksternal dapat
menghapus waktu bangun yang kedaluwarsa. Gunakan `ctx.getCron?.()` untuk instans penjadwal persis yang
menyelesaikan rekonsiliasi; pemuatan ulang berikutnya tidak mengalihkan target callback tersebut.
`ctx.abortSignal` memiliki snapshot penjadwal yang sama. Gateway membatalkannya segera
setelah penjadwal yang lebih baru dipersenjatai atau penghentian dimulai. Teruskan penanda tersebut ke setiap
efek samping durabel dan jangan menerima snapshot setelah dibatalkan.
Ini adalah sinyal siklus hidup penjadwal, bukan sinyal aktivasi plugin:
pemuatan ulang panas yang hanya melibatkan plugin tidak memutarnya ulang. Konsumen yang baru diaktifkan menerima
dasar pertamanya pada penggantian penjadwal berikutnya atau saat Gateway dimulai.

Seperti hook observasi lainnya, callback `gateway_start` dan `cron_reconciled`
dapat tumpang tindih. Jika kedua handler berbagi inisialisasi plugin, koordinasikan keduanya
dengan promise kesiapan lokal plugin, bukan bergantung pada urutan callback.

`cron_changed` dipicu untuk peristiwa siklus hidup cron milik Gateway dengan muatan
peristiwa bertipe yang mencakup alasan `added`, `updated`, `removed`, `started`, `finished`,
dan `scheduled`. Peristiwa membawa snapshot `PluginHookGatewayCronJob`
(termasuk `state.nextRunAtMs`, `state.lastRunStatus`, dan
`state.lastError` jika ada) beserta `PluginHookGatewayCronDeliveryStatus`
berupa `not-requested` | `delivered` | `not-delivered` | `unknown`. Peristiwa penghapusan
terjadi setelah commit: peristiwa tersebut hanya dipicu setelah penghapusan durabel berhasil dan tetap membawa
snapshot pekerjaan yang dihapus agar penjadwal eksternal dapat merekonsiliasi status.

Peristiwa `scheduled` terjadi setelah commit: peristiwa tersebut hanya dipicu setelah penulisan durabel yang berhasil
mengubah `nextRunAtMs` efektif milik pekerjaan yang sudah ada, tidak termasuk peristiwa siklus hidup
`added`, `updated`, atau `removed` eksplisit milik pekerjaan tersebut. `event.nextRunAtMs`
tingkat atas adalah waktu bangun berikutnya yang telah di-commit; jika tidak ada, pekerjaan tersebut
tidak memiliki waktu bangun berikutnya. Perlakukan peristiwa ini sebagai petunjuk rekonsiliasi, bukan log delta
berurutan. Gunakan peristiwa tersebut sebagai petunjuk yang dapat digabungkan untuk membaca ulang penjadwal terakhir yang ditangkap oleh
`cron_reconciled`; jangan mengadopsi penjadwal dari konteks `cron_changed`.
Pertahankan OpenClaw sebagai sumber kebenaran untuk pemeriksaan jatuh tempo dan eksekusi.

### Proyeksi cron eksternal yang aman

Proyeksikan snapshot waktu bangun lengkap alih-alih meneruskan delta peristiwa cron. Operasi
`replaceAll` milik adaptor eksternal harus atomik dan idempoten, serta
hanya boleh diselesaikan setelah host menerima snapshot secara durabel. Operasi tersebut juga
harus mematuhi sinyal pembatalan yang diberikan: jika sinyal dibatalkan sebelum penerimaan
durabel, adaptor tidak boleh menerima snapshot tersebut.

Pola ini mempertahankan satu pekerja status terbaru yang sedang berjalan. Hanya `cron_reconciled`
yang mengadopsi instans penjadwal; `cron_changed` hanya meminta pekerja tersebut membaca ulang
instans otoritatif, sehingga petunjuk yang terlambat tidak dapat memulihkan penjadwal yang lebih lama.
Revisi yang lebih baru membatalkan upaya host aktif sebelum upaya tersebut dapat menerima snapshot
kedaluwarsa.

```typescript
import { setTimeout as sleep } from "node:timers/promises";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";

type ExternalWake = { jobId: string; runAtMs: number };

type ExternalWakeHost = {
  replaceAll(wakes: readonly ExternalWake[], options: { signal: AbortSignal }): Promise<void>;
  close(): Promise<void>;
};

type CronReader = {
  list(options: { includeDisabled: true }): Promise<
    Array<{
      id: string;
      enabled?: boolean;
      state?: { nextRunAtMs?: number };
    }>
  >;
};

export function registerCronProjection(api: OpenClawPluginApi, host: ExternalWakeHost) {
  const lifecycle = new AbortController();
  let cron: CronReader | undefined;
  let enabled = false;
  let hasBaseline = false;
  let reconciliationSignal: AbortSignal | undefined;
  let requestedRevision = 0;
  let appliedRevision = 0;
  let worker = Promise.resolve();
  let activeAttempt: AbortController | undefined;

  const projectLatest = async () => {
    let retryMs = 1_000;

    while (!lifecycle.signal.aborted && appliedRevision < requestedRevision) {
      const ownerSignal = reconciliationSignal;
      if (!ownerSignal || ownerSignal.aborted) {
        return;
      }
      const targetRevision = requestedRevision;
      const attempt = new AbortController();
      const signal = AbortSignal.any([lifecycle.signal, ownerSignal, attempt.signal]);
      activeAttempt = attempt;

      try {
        const jobs = enabled && cron ? await cron.list({ includeDisabled: true }) : [];
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        const wakes = jobs
          .flatMap((job): ExternalWake[] => {
            const runAtMs = job.enabled === false ? undefined : job.state?.nextRunAtMs;
            return runAtMs === undefined ? [] : [{ jobId: job.id, runAtMs }];
          })
          .sort((a, b) => a.runAtMs - b.runAtMs || a.jobId.localeCompare(b.jobId));

        await host.replaceAll(wakes, { signal });
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        appliedRevision = targetRevision;
        retryMs = 1_000;
      } catch {
        if (lifecycle.signal.aborted || ownerSignal.aborted) {
          return;
        }
        if (attempt.signal.aborted) {
          continue;
        }
        api.logger.warn(`proyeksi cron eksternal gagal; mencoba lagi dalam ${retryMs}ms`);
        try {
          await sleep(retryMs, undefined, { signal });
        } catch {
          if (lifecycle.signal.aborted) {
            return;
          }
          if (attempt.signal.aborted) {
            continue;
          }
        }
        retryMs = Math.min(retryMs * 2, 30_000);
      } finally {
        if (activeAttempt === attempt) {
          activeAttempt = undefined;
        }
      }
    }
  };

  const requestProjection = () => {
    const targetRevision = ++requestedRevision;
    activeAttempt?.abort();
    worker = worker.then(async () => {
      if (!lifecycle.signal.aborted && appliedRevision < targetRevision) {
        await projectLatest();
      }
    });
    return worker;
  };

  api.on("cron_reconciled", (event, ctx) => {
    const reconciledCron = ctx.getCron?.();
    if (event.enabled && !reconciledCron) {
      api.logger.warn("rekonsiliasi cron tidak mengekspos penjadwal");
      return;
    }
    cron = reconciledCron;
    enabled = event.enabled;
    hasBaseline = true;
    reconciliationSignal = ctx.abortSignal;
    return requestProjection();
  });

  api.on("cron_changed", () => {
    if (hasBaseline) {
      return requestProjection();
    }
  });

  api.on("gateway_stop", async () => {
    lifecycle.abort();
    await worker;
    await host.close();
  });
}
```

Saat `cron_reconciled` melaporkan `enabled: false`, jalur yang sama memanggil
`replaceAll([])` dan menghapus waktu bangun eksternal yang kedaluwarsa. Percobaan ulang/backoff dalam contoh ini
bersifat lokal terhadap proses dan memperlakukan kegagalan adaptor runtime sebagai sementara; validasi
konfigurasi yang tidak dapat dicoba ulang sebelum pendaftaran. OpenClaw tidak menyediakan
outbox untuk efek hook plugin. Jika proses keluar sebelum penerimaan durabel,
startup Gateway berikutnya memancarkan snapshot `cron_reconciled` otoritatif baru.
`gateway_stop` membatalkan pekerjaan host yang sedang berjalan, menunggu pekerja selesai, lalu
menutup adaptor.

## Penghentian dukungan mendatang

Beberapa permukaan yang berdekatan dengan hook telah dihentikan dukungannya tetapi masih didukung. Lakukan migrasi
sebelum rilis mayor berikutnya:

- **Envelope kanal teks biasa** dalam handler `inbound_claim` dan `message_received`.
  Baca `BodyForAgent` dan blok konteks pengguna terstruktur
  alih-alih mengurai teks envelope datar. Lihat
  [Envelope kanal teks biasa → BodyForAgent](/id/plugins/sdk-migration#active-deprecations).
- **`subagent_spawning`** tetap tersedia untuk kompatibilitas dengan plugin lama, tetapi
  plugin baru tidak boleh mengembalikan perutean utas darinya. Inti menyiapkan
  pengikatan subagen `thread: true` melalui adaptor pengikatan sesi kanal
  sebelum `subagent_spawned` dipicu.
- **`deactivate`** tetap tersedia sebagai alias kompatibilitas pembersihan yang tidak digunakan lagi hingga
  setelah 2026-08-16. Plugin baru harus menggunakan `gateway_stop`.
- **`onResolution` dalam `before_tool_call`** kini menggunakan union bertipe
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) alih-alih `string` berformat bebas.
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** tetap tersedia
  sebagai alias kompatibilitas tingkat atas. Plugin baru harus menggunakan
  `api.session.state.registerSessionExtension(...)` dan
  `api.session.workflow.enqueueNextTurnInjection(...)`.

Untuk daftar lengkap—pendaftaran kapabilitas memori, profil penalaran
penyedia, penyedia autentikasi eksternal, jenis penemuan penyedia, pengakses runtime
tugas, dan penggantian nama `command-auth` → `command-status`—lihat
[Migrasi SDK Plugin → Penghentian aktif](/id/plugins/sdk-migration#active-deprecations).

## Terkait

- [Migrasi SDK Plugin](/id/plugins/sdk-migration) - penghentian aktif dan linimasa penghapusan
- [Membangun plugin](/id/plugins/building-plugins)
- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
- [Titik masuk plugin](/id/plugins/sdk-entrypoints)
- [Hook internal](/id/automation/hooks)
- [Internal arsitektur plugin](/id/plugins/architecture-internals)
