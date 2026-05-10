---
read_when:
    - Anda sedang membangun aplikasi eksternal, skrip, dasbor, pekerjaan CI, atau ekstensi IDE yang berkomunikasi dengan OpenClaw
    - Anda sedang memilih antara App SDK dan Plugin SDK
    - Anda sedang berintegrasi dengan eksekusi agen Gateway, sesi, peristiwa, persetujuan, model, atau alat
sidebarTitle: App SDK
summary: SDK Aplikasi OpenClaw publik untuk aplikasi eksternal, skrip, dasbor, pekerjaan CI, dan ekstensi IDE
title: SDK Aplikasi OpenClaw
x-i18n:
    generated_at: "2026-05-10T19:32:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc339e9f29dd1297353d85827dbac207311a9633e1ab6cc47dace80a72259356
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**SDK Aplikasi OpenClaw** adalah API klien publik untuk aplikasi di luar proses
OpenClaw. Gunakan `@openclaw/sdk` saat skrip, dasbor, pekerjaan CI, ekstensi
IDE, atau aplikasi eksternal lain ingin terhubung ke Gateway, memulai
run agen, melakukan streaming peristiwa, menunggu hasil, membatalkan pekerjaan,
atau memeriksa sumber daya Gateway.

<Note>
  SDK Aplikasi berbeda dari [Plugin SDK](/id/plugins/sdk-overview).
  `@openclaw/sdk` berkomunikasi dengan Gateway dari luar OpenClaw.
  `openclaw/plugin-sdk/*` hanya untuk plugin yang berjalan di dalam OpenClaw dan
  mendaftarkan provider, channel, tool, hook, atau runtime tepercaya.
</Note>

## Yang tersedia saat ini

`@openclaw/sdk` tersedia dengan:

| Permukaan                 | Status   | Fungsinya                                                                         |
| ------------------------- | -------- | --------------------------------------------------------------------------------- |
| `OpenClaw`                | Siap     | Titik masuk klien utama. Memiliki transport, koneksi, permintaan, dan peristiwa.  |
| `GatewayClientTransport`  | Siap     | Transport WebSocket yang didukung oleh klien Gateway.                             |
| `oc.agents`               | Siap     | Mencantumkan, membuat, memperbarui, menghapus, dan mengambil handle agen.         |
| `Agent.run()`             | Siap     | Memulai run Gateway `agent` dan mengembalikan `Run`.                              |
| `oc.runs`                 | Siap     | Membuat, mengambil, menunggu, membatalkan, dan melakukan streaming run.            |
| `Run.events()`            | Siap     | Melakukan streaming peristiwa per-run yang dinormalisasi dengan replay untuk run cepat. |
| `Run.wait()`              | Siap     | Memanggil `agent.wait` dan mengembalikan `RunResult` yang stabil.                 |
| `Run.cancel()`            | Siap     | Memanggil `sessions.abort` berdasarkan id run, dengan kunci sesi jika tersedia.   |
| `oc.sessions`             | Siap     | Membuat, menyelesaikan, mengirim ke, menambal, memadatkan, dan mengambil handle sesi. |
| `Session.send()`          | Siap     | Memanggil `sessions.send` dan mengembalikan `Run`.                                |
| `oc.tasks`                | Siap     | Mencantumkan, membaca, dan membatalkan entri ledger tugas Gateway.                |
| `oc.models`               | Siap     | Memanggil `models.list` dan RPC status `models.authStatus` saat ini.              |
| `oc.tools`                | Siap     | Mencantumkan, menentukan cakupan, dan menjalankan tool Gateway melalui pipeline kebijakan. |
| `oc.artifacts`            | Siap     | Mencantumkan, mengambil, dan mengunduh artefak transkrip Gateway.                 |
| `oc.approvals`            | Siap     | Mencantumkan dan menyelesaikan approval eksekusi melalui RPC approval Gateway.    |
| `oc.environments`         | Sebagian | Mencantumkan kandidat lingkungan lokal-Gateway dan node; create/delete belum tersambung. |
| `oc.rawEvents()`          | Siap     | Mengekspos peristiwa mentah Gateway untuk konsumen tingkat lanjut.                |
| `normalizeGatewayEvent()` | Siap     | Mengonversi peristiwa mentah Gateway ke bentuk peristiwa SDK yang stabil.         |

SDK juga mengekspor tipe inti yang digunakan oleh permukaan tersebut:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`,
`TaskSummary`, `TaskStatus`, `TasksListParams`, `TasksListResult`,
`TasksGetResult`, `TasksCancelResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode`, dan tipe hasil
terkait.

## Terhubung ke Gateway

Buat klien dengan URL Gateway eksplisit, atau injeksikan transport khusus untuk
pengujian dan runtime aplikasi tersemat.

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
belum menjadi fitur SDK tersendiri; teruskan `url` saat aplikasi belum tahu
cara menemukan Gateway.

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

Gunakan `oc.agents.get(id)` saat aplikasi membutuhkan handle agen, lalu panggil
`agent.run()`.

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

Ref model berkualifikasi provider seperti `openai/gpt-5.5` dipisahkan menjadi
override `provider` dan `model` Gateway. `timeoutMs` tetap dalam milidetik di SDK
dan dikonversi menjadi detik timeout Gateway untuk RPC `agent`.

`run.wait()` menggunakan RPC Gateway `agent.wait`. Deadline tunggu yang berakhir
saat run masih aktif mengembalikan `status: "accepted"` alih-alih seolah-olah
run itu sendiri kehabisan waktu. Timeout runtime, run yang dibatalkan paksa, dan
run yang dibatalkan dinormalisasi menjadi `timed_out` atau `cancelled`.

## Membuat dan menggunakan ulang sesi

Gunakan sesi saat aplikasi membutuhkan state transkrip yang tahan lama.

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

## Streaming peristiwa

SDK menormalisasi peristiwa mentah Gateway ke dalam envelope `OpenClawEvent`
yang stabil:

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

Tipe peristiwa umum mencakup:

| Tipe peristiwa        | Peristiwa Gateway sumber                     |
| --------------------- | -------------------------------------------- |
| `run.started`         | Awal siklus hidup `agent`                    |
| `run.completed`       | Akhir siklus hidup `agent`                   |
| `run.failed`          | Error siklus hidup `agent`                   |
| `run.cancelled`       | Akhir siklus hidup yang dibatalkan paksa/dibatalkan |
| `run.timed_out`       | Akhir siklus hidup timeout                   |
| `assistant.delta`     | Delta streaming asisten                      |
| `assistant.message`   | Pesan asisten                                |
| `thinking.delta`      | Aliran berpikir atau rencana                 |
| `tool.call.started`   | Awal tool/item/perintah                      |
| `tool.call.delta`     | Pembaruan tool/item/perintah                 |
| `tool.call.completed` | Penyelesaian tool/item/perintah              |
| `tool.call.failed`    | Kegagalan tool/item/perintah atau status diblokir |
| `approval.requested`  | Permintaan approval eksekusi atau plugin     |
| `approval.resolved`   | Penyelesaian approval eksekusi atau plugin   |
| `session.created`     | Pembuatan `sessions.changed`                 |
| `session.updated`     | Pembaruan `sessions.changed`                 |
| `session.compacted`   | Compaction `sessions.changed`                |
| `task.updated`        | Peristiwa pembaruan tugas                    |
| `artifact.updated`    | Peristiwa aliran patch                       |
| `raw`                 | Peristiwa apa pun yang belum memiliki pemetaan SDK stabil |

`Run.events()` memfilter peristiwa ke satu id run dan memutar ulang peristiwa
yang sudah terlihat untuk run cepat. Artinya alur terdokumentasi ini aman:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Untuk stream seluruh aplikasi, gunakan `oc.events()`. Untuk frame Gateway mentah,
gunakan `oc.rawEvents()`.

## Model, tool, artefak, dan approval

Helper model memetakan ke metode Gateway saat ini:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Helper tool mengekspos katalog Gateway, tampilan tool efektif, dan pemanggilan
tool Gateway langsung. `oc.tools.invoke()` mengembalikan envelope bertipe
alih-alih melempar untuk penolakan kebijakan atau approval.

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

Helper approval menggunakan RPC approval eksekusi:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

Helper tugas menggunakan ledger tugas tahan lama yang juga mendukung
`openclaw tasks`:

```typescript
const tasks = await oc.tasks.list({ status: "running", sessionKey: "agent:main:main" });
const task = await oc.tasks.get(tasks.tasks[0].id);
await oc.tasks.cancel(task.task.id, { reason: "user stopped task" });
```

Helper lingkungan mengekspos penemuan lokal-Gateway dan node yang hanya-baca:

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## Yang secara eksplisit belum didukung saat ini

SDK menyertakan nama untuk model produk yang kami inginkan, tetapi tidak diam-diam
berpura-pura bahwa RPC Gateway sudah ada. Panggilan ini saat ini melempar error
tidak didukung yang eksplisit:

```typescript
await oc.environments.create({});
await oc.environments.delete("environment-id");
```

Field `workspace`, `runtime`, `environment`, dan `approvals` per-run diberi tipe
sebagai bentuk masa depan, tetapi Gateway saat ini tidak mendukung override
tersebut pada RPC `agent`. Jika pemanggil meneruskannya, SDK melempar sebelum
mengirimkan run agar pekerjaan tidak secara tidak sengaja dijalankan dengan
perilaku workspace, runtime, environment, atau approval default.

## App SDK vs Plugin SDK

Gunakan SDK Aplikasi saat kode berada di luar OpenClaw:

- Skrip Node yang memulai atau mengamati run agen
- Pekerjaan CI yang memanggil Gateway
- dasbor dan panel admin
- ekstensi IDE
- bridge eksternal yang tidak perlu menjadi plugin channel
- pengujian integrasi dengan transport Gateway palsu atau nyata

Gunakan Plugin SDK saat kode berjalan di dalam OpenClaw:

- plugin provider
- plugin channel
- hook tool atau siklus hidup
- plugin harness agen
- helper runtime tepercaya

Kode SDK Aplikasi harus mengimpor dari `@openclaw/sdk`. Kode Plugin harus
mengimpor dari subpath `openclaw/plugin-sdk/*` yang terdokumentasi. Jangan
mencampur kedua kontrak tersebut.

## Terkait

- [Desain API OpenClaw App SDK](/id/reference/openclaw-sdk-api-design)
- [Referensi RPC Gateway](/id/reference/rpc)
- [Loop agen](/id/concepts/agent-loop)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Sesi](/id/concepts/session)
- [Tugas latar belakang](/id/automation/tasks)
- [Agen ACP](/id/tools/acp-agents)
- [Ikhtisar Plugin SDK](/id/plugins/sdk-overview)
