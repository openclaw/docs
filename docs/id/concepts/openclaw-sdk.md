---
read_when:
    - Anda sedang membangun aplikasi eksternal, skrip, dasbor, tugas CI, atau ekstensi IDE yang berkomunikasi dengan OpenClaw
    - Anda sedang memilih antara App SDK dan Plugin SDK
    - Anda sedang berintegrasi dengan eksekusi agen Gateway, sesi, peristiwa, persetujuan, model, atau alat
sidebarTitle: App SDK
summary: SDK Aplikasi OpenClaw Publik untuk aplikasi eksternal, skrip, dasbor, pekerjaan CI, dan ekstensi IDE
title: SDK Aplikasi OpenClaw
x-i18n:
    generated_at: "2026-05-06T09:08:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23d161958e8b100bfc829319ef6bfd2ea2bf7c873ef29a0d4a849b064e5a3b66
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** adalah API klien publik untuk aplikasi di luar proses
OpenClaw. Gunakan `@openclaw/sdk` ketika skrip, dasbor, tugas CI, ekstensi IDE,
atau aplikasi eksternal lain ingin terhubung ke Gateway, memulai run agen,
mengalirkan peristiwa, menunggu hasil, membatalkan pekerjaan, atau memeriksa
sumber daya Gateway.

<Note>
  App SDK berbeda dari [Plugin SDK](/id/plugins/sdk-overview).
  `@openclaw/sdk` berbicara dengan Gateway dari luar OpenClaw.
  `openclaw/plugin-sdk/*` hanya untuk Plugin yang berjalan di dalam OpenClaw dan
  mendaftarkan penyedia, kanal, alat, hook, atau runtime tepercaya.
</Note>

## Yang tersedia saat ini

`@openclaw/sdk` tersedia dengan:

| Antarmuka                | Status   | Apa fungsinya                                                                      |
| ------------------------ | -------- | ---------------------------------------------------------------------------------- |
| `OpenClaw`               | Siap     | Titik masuk klien utama. Mengelola transport, koneksi, permintaan, dan peristiwa. |
| `GatewayClientTransport` | Siap     | Transport WebSocket yang didukung oleh klien Gateway.                              |
| `oc.agents`              | Siap     | Mencantumkan, membuat, memperbarui, menghapus, dan mengambil handle agen.          |
| `Agent.run()`            | Siap     | Memulai run Gateway `agent` dan mengembalikan `Run`.                               |
| `oc.runs`                | Siap     | Membuat, mengambil, menunggu, membatalkan, dan mengalirkan run.                    |
| `Run.events()`           | Siap     | Mengalirkan peristiwa per-run yang dinormalisasi dengan replay untuk run cepat.    |
| `Run.wait()`             | Siap     | Memanggil `agent.wait` dan mengembalikan `RunResult` yang stabil.                  |
| `Run.cancel()`           | Siap     | Memanggil `sessions.abort` berdasarkan id run, dengan kunci sesi bila tersedia.    |
| `oc.sessions`            | Siap     | Membuat, me-resolve, mengirim ke, mem-patch, mengompaksi, dan mengambil handle sesi. |
| `Session.send()`         | Siap     | Memanggil `sessions.send` dan mengembalikan `Run`.                                 |
| `oc.models`              | Siap     | Memanggil `models.list` dan RPC status `models.authStatus` saat ini.               |
| `oc.tools`               | Siap     | Mencantumkan, mencakup, dan memanggil alat Gateway melalui pipeline kebijakan.     |
| `oc.artifacts`           | Siap     | Mencantumkan, mengambil, dan mengunduh artefak transkrip Gateway.                  |
| `oc.approvals`           | Siap     | Mencantumkan dan me-resolve persetujuan exec melalui RPC persetujuan Gateway.      |
| `oc.environments`        | Sebagian | Mencantumkan kandidat lingkungan lokal Gateway dan Node; create/delete belum tersambung. |
| `oc.rawEvents()`         | Siap     | Mengekspos peristiwa Gateway mentah untuk konsumen tingkat lanjut.                 |
| `normalizeGatewayEvent()` | Siap    | Mengonversi peristiwa Gateway mentah menjadi bentuk peristiwa SDK yang stabil.     |

SDK juga mengekspor tipe inti yang digunakan oleh antarmuka tersebut:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode`, dan tipe hasil
terkait.

## Terhubung ke Gateway

Buat klien dengan URL Gateway eksplisit, atau injeksikan transport kustom untuk
pengujian dan runtime aplikasi tertanam.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:18789",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` setara dengan `url`. Opsi
`gateway: "auto"` diterima oleh konstruktor, tetapi penemuan Gateway otomatis
belum menjadi fitur SDK terpisah; teruskan `url` ketika aplikasi belum tahu cara
menemukan Gateway.

Untuk pengujian, teruskan objek yang mengimplementasikan `OpenClawTransport`:

```typescript
const oc = new OpenClaw({
  transport: {
    async request(method, params) {
      return { method, params };
    },
    async *events() {},
  },
});
```

## Menjalankan agen

Gunakan `oc.agents.get(id)` ketika aplikasi menginginkan handle agen, lalu
panggil `agent.run()`.

```typescript
const agent = await oc.agents.get("main");

const run = await agent.run({
  input: "Review this pull request and suggest the smallest safe fix.",
  model: "openai/gpt-5.5",
  sessionKey: "main",
  timeoutMs: 30_000,
});

for await (const event of run.events()) {
  const data = event.data as { delta?: unknown };
  if (event.type === "assistant.delta" && typeof data.delta === "string") {
    process.stdout.write(data.delta);
  }
}

const result = await run.wait({ timeoutMs: 120_000 });
console.log(result.status);
```

Ref model berkualifikasi penyedia seperti `openai/gpt-5.5` dipisahkan menjadi
override Gateway `provider` dan `model`. `timeoutMs` tetap dalam milidetik di SDK
dan dikonversi menjadi detik timeout Gateway untuk RPC `agent`.

`run.wait()` menggunakan RPC Gateway `agent.wait`. Tenggat tunggu yang kedaluwarsa
saat run masih aktif mengembalikan `status: "accepted"` alih-alih berpura-pura
bahwa run itu sendiri mengalami timeout. Timeout runtime, run yang dibatalkan,
dan run yang dicancel dinormalisasi menjadi `timed_out` atau `cancelled`.

## Membuat dan menggunakan ulang sesi

Gunakan sesi ketika aplikasi menginginkan status transkrip yang tahan lama.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` memanggil `sessions.send` dan mengembalikan `Run`. Handle sesi
juga mendukung:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Mengalirkan peristiwa

SDK menormalkan peristiwa Gateway mentah menjadi envelope `OpenClawEvent` yang
stabil:

```typescript
type OpenClawEvent = {
  version: 1;
  id: string;
  ts: number;
  type: OpenClawEventType;
  runId?: string;
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  agentId?: string;
  data: unknown;
  raw?: GatewayEvent;
};
```

Jenis peristiwa umum meliputi:

| Jenis peristiwa       | Peristiwa Gateway sumber                  |
| --------------------- | ----------------------------------------- |
| `run.started`         | Awal siklus hidup `agent`                 |
| `run.completed`       | Akhir siklus hidup `agent`                |
| `run.failed`          | Galat siklus hidup `agent`                |
| `run.cancelled`       | Akhir siklus hidup yang dibatalkan        |
| `run.timed_out`       | Akhir siklus hidup timeout                |
| `assistant.delta`     | Delta streaming asisten                   |
| `assistant.message`   | Pesan asisten                             |
| `thinking.delta`      | Aliran pemikiran atau rencana             |
| `tool.call.started`   | Awal alat/item/perintah                   |
| `tool.call.delta`     | Pembaruan alat/item/perintah              |
| `tool.call.completed` | Penyelesaian alat/item/perintah           |
| `tool.call.failed`    | Kegagalan alat/item/perintah atau status diblokir |
| `approval.requested`  | Permintaan persetujuan exec atau Plugin   |
| `approval.resolved`   | Resolusi persetujuan exec atau Plugin     |
| `session.created`     | Pembuatan `sessions.changed`              |
| `session.updated`     | Pembaruan `sessions.changed`              |
| `session.compacted`   | Compaction `sessions.changed`             |
| `task.updated`        | Peristiwa pembaruan tugas                 |
| `artifact.updated`    | Peristiwa aliran patch                    |
| `raw`                 | Peristiwa apa pun yang belum memiliki pemetaan SDK stabil |

`Run.events()` memfilter peristiwa ke satu id run dan memutar ulang peristiwa
yang sudah terlihat untuk run cepat. Artinya, alur terdokumentasi ini aman:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Untuk aliran seluruh aplikasi, gunakan `oc.events()`. Untuk frame Gateway
mentah, gunakan `oc.rawEvents()`.

## Model, alat, artefak, dan persetujuan

Helper model dipetakan ke metode Gateway saat ini:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Helper alat mengekspos katalog Gateway, tampilan alat efektif, dan pemanggilan
alat Gateway langsung. `oc.tools.invoke()` mengembalikan envelope bertipe
alih-alih melempar untuk penolakan kebijakan atau persetujuan.

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
await oc.tools.invoke("tool-name", {
  args: { input: "value" },
  sessionKey: "main",
  confirm: false,
  idempotencyKey: "tool-call-1",
});
```

Helper artefak mengekspos proyeksi artefak Gateway untuk konteks sesi, run, atau
tugas. Setiap panggilan memerlukan satu cakupan eksplisit `sessionKey`, `runId`,
atau `taskId`:

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

Helper persetujuan menggunakan RPC persetujuan exec:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

Helper lingkungan mengekspos penemuan lokal Gateway dan Node yang hanya-baca:

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## Secara eksplisit belum didukung saat ini

SDK menyertakan nama untuk model produk yang kami inginkan, tetapi tidak diam-diam
berpura-pura bahwa RPC Gateway sudah ada. Panggilan ini saat ini melempar galat
tidak didukung yang eksplisit:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.create({});
await oc.environments.delete("environment-id");
```

Field per-run `workspace`, `runtime`, `environment`, dan `approvals` diketik
sebagai bentuk masa depan, tetapi Gateway saat ini tidak mendukung override
tersebut pada RPC `agent`. Jika pemanggil meneruskannya, SDK melempar sebelum
mengirimkan run agar pekerjaan tidak secara tidak sengaja dijalankan dengan
perilaku workspace, runtime, lingkungan, atau persetujuan default.

## App SDK vs Plugin SDK

Gunakan App SDK ketika kode berada di luar OpenClaw:

- Skrip Node yang memulai atau mengamati run agen
- Tugas CI yang memanggil Gateway
- dasbor dan panel admin
- ekstensi IDE
- bridge eksternal yang tidak perlu menjadi Plugin kanal
- pengujian integrasi dengan transport Gateway palsu atau nyata

Gunakan Plugin SDK ketika kode berjalan di dalam OpenClaw:

- Plugin penyedia
- Plugin kanal
- hook alat atau siklus hidup
- Plugin harness agen
- helper runtime tepercaya

Kode App SDK harus mengimpor dari `@openclaw/sdk`. Kode Plugin harus mengimpor
dari subpath `openclaw/plugin-sdk/*` yang terdokumentasi. Jangan mencampur kedua
kontrak tersebut.

## Terkait

- [Desain API OpenClaw App SDK](/id/reference/openclaw-sdk-api-design)
- [Referensi RPC Gateway](/id/reference/rpc)
- [Loop agen](/id/concepts/agent-loop)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Sesi](/id/concepts/session)
- [Tugas latar belakang](/id/automation/tasks)
- [Agen ACP](/id/tools/acp-agents)
- [Ikhtisar Plugin SDK](/id/plugins/sdk-overview)
