---
read_when:
    - Anda sedang membangun aplikasi eksternal, skrip, dasbor, tugas CI, atau ekstensi IDE yang berkomunikasi dengan OpenClaw
    - Anda sedang memilih antara App SDK dan Plugin SDK
    - Anda sedang berintegrasi dengan eksekusi agen Gateway, sesi, peristiwa, persetujuan, model, atau alat
sidebarTitle: App SDK
summary: SDK Aplikasi OpenClaw publik untuk aplikasi eksternal, skrip, dasbor, tugas CI, dan ekstensi IDE
title: SDK Aplikasi OpenClaw
x-i18n:
    generated_at: "2026-05-01T09:23:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6b22e9f4f809a572cfd19fd22f633a706dd23b8bee2f3c244003a0861a41073
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** adalah API klien publik untuk aplikasi di luar proses
OpenClaw. Gunakan `@openclaw/sdk` ketika sebuah skrip, dasbor, tugas CI,
ekstensi IDE, atau aplikasi eksternal lain ingin terhubung ke Gateway, memulai
agent run, melakukan streaming event, menunggu hasil, membatalkan pekerjaan,
atau memeriksa resource Gateway.

<Note>
  App SDK berbeda dari [Plugin SDK](/id/plugins/sdk-overview).
  `@openclaw/sdk` berbicara ke Gateway dari luar OpenClaw.
  `openclaw/plugin-sdk/*` hanya untuk plugin yang berjalan di dalam OpenClaw dan
  mendaftarkan provider, channel, tool, hook, atau runtime tepercaya.
</Note>

## Yang Tersedia Saat Ini

`@openclaw/sdk` menyediakan:

| Permukaan                 | Status | Fungsinya                                                                  |
| ------------------------- | ------ | -------------------------------------------------------------------------- |
| `OpenClaw`                | Siap   | Titik masuk klien utama. Memiliki transport, koneksi, request, dan event.  |
| `GatewayClientTransport`  | Siap   | Transport WebSocket yang didukung oleh klien Gateway.                      |
| `oc.agents`               | Siap   | Mencantumkan, membuat, memperbarui, menghapus, dan mendapatkan handle agent. |
| `Agent.run()`             | Siap   | Memulai run Gateway `agent` dan mengembalikan `Run`.                       |
| `oc.runs`                 | Siap   | Membuat, mendapatkan, menunggu, membatalkan, dan melakukan streaming run.   |
| `Run.events()`            | Siap   | Melakukan streaming event per-run yang dinormalisasi dengan replay untuk run cepat. |
| `Run.wait()`              | Siap   | Memanggil `agent.wait` dan mengembalikan `RunResult` yang stabil.          |
| `Run.cancel()`            | Siap   | Memanggil `sessions.abort` berdasarkan run id, dengan session key jika tersedia. |
| `oc.sessions`             | Siap   | Membuat, menyelesaikan, mengirim ke, menambal, memadatkan, dan mendapatkan handle session. |
| `Session.send()`          | Siap   | Memanggil `sessions.send` dan mengembalikan `Run`.                         |
| `oc.models`               | Siap   | Memanggil `models.list` dan RPC status `models.authStatus` saat ini.        |
| `oc.tools`                | Siap   | Mencantumkan, memberi scope, dan menjalankan tool Gateway melalui pipeline kebijakan. |
| `oc.artifacts`            | Siap   | Mencantumkan, mendapatkan, dan mengunduh artifact transkrip Gateway.       |
| `oc.approvals`            | Siap   | Mencantumkan dan menyelesaikan approval exec melalui RPC approval Gateway.  |
| `oc.rawEvents()`          | Siap   | Mengekspos event Gateway mentah untuk konsumen tingkat lanjut.             |
| `normalizeGatewayEvent()` | Siap   | Mengonversi event Gateway mentah ke bentuk event SDK yang stabil.          |

SDK juga mengekspor tipe inti yang digunakan oleh permukaan tersebut:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode`, dan tipe hasil
terkait.

## Terhubung Ke Gateway

Buat klien dengan URL Gateway eksplisit, atau injeksikan transport kustom untuk
pengujian dan runtime aplikasi tertanam.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` setara dengan `url`. Opsi
`gateway: "auto"` diterima oleh konstruktor, tetapi discovery Gateway otomatis
belum menjadi fitur SDK tersendiri; berikan `url` ketika aplikasi belum tahu
cara menemukan Gateway.

Untuk pengujian, berikan objek yang mengimplementasikan `OpenClawTransport`:

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

## Menjalankan Agent

Gunakan `oc.agents.get(id)` ketika aplikasi menginginkan handle agent, lalu
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

Ref model yang menyertakan provider seperti `openai/gpt-5.5` dipecah menjadi
override `provider` dan `model` Gateway. `timeoutMs` tetap dalam milidetik di
SDK dan dikonversi menjadi detik timeout Gateway untuk RPC `agent`.

`run.wait()` menggunakan RPC Gateway `agent.wait`. Deadline tunggu yang habis
saat run masih aktif mengembalikan `status: "accepted"` alih-alih berpura-pura
run itu sendiri mengalami timeout. Timeout runtime, run yang diaborsi, dan run
yang dibatalkan dinormalisasi menjadi `timed_out` atau `cancelled`.

## Membuat Dan Menggunakan Ulang Session

Gunakan session ketika aplikasi menginginkan status transkrip yang tahan lama.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` memanggil `sessions.send` dan mengembalikan `Run`. Handle
session juga mendukung:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Streaming Event

SDK menormalisasi event Gateway mentah ke dalam envelope `OpenClawEvent` yang
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

Jenis event umum mencakup:

| Jenis event           | Event Gateway sumber                       |
| --------------------- | ------------------------------------------ |
| `run.started`         | Awal lifecycle `agent`                     |
| `run.completed`       | Akhir lifecycle `agent`                    |
| `run.failed`          | Error lifecycle `agent`                    |
| `run.cancelled`       | Akhir lifecycle yang diaborsi/dibatalkan   |
| `run.timed_out`       | Akhir lifecycle timeout                    |
| `assistant.delta`     | Delta streaming assistant                  |
| `assistant.message`   | Pesan assistant                            |
| `thinking.delta`      | Stream pemikiran atau rencana              |
| `tool.call.started`   | Awal tool/item/command                     |
| `tool.call.delta`     | Pembaruan tool/item/command                |
| `tool.call.completed` | Penyelesaian tool/item/command             |
| `tool.call.failed`    | Kegagalan tool/item/command atau status diblokir |
| `approval.requested`  | Request approval exec atau plugin          |
| `approval.resolved`   | Resolusi approval exec atau plugin         |
| `session.created`     | Pembuatan `sessions.changed`               |
| `session.updated`     | Pembaruan `sessions.changed`               |
| `session.compacted`   | Compaction `sessions.changed`              |
| `task.updated`        | Event pembaruan tugas                      |
| `artifact.updated`    | Event stream patch                         |
| `raw`                 | Event apa pun yang belum memiliki pemetaan SDK stabil |

`Run.events()` memfilter event ke satu run id dan memutar ulang event yang
sudah terlihat untuk run cepat. Artinya alur yang didokumentasikan aman:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Untuk stream seluruh aplikasi, gunakan `oc.events()`. Untuk frame Gateway
mentah, gunakan `oc.rawEvents()`.

## Model, Tool, Artifact, Dan Approval

Helper model memetakan ke metode Gateway saat ini:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Helper tool mengekspos katalog Gateway, tampilan tool efektif, dan invocation
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

Helper artifact mengekspos proyeksi artifact Gateway untuk konteks session,
run, atau tugas. Setiap panggilan memerlukan satu scope eksplisit
`sessionKey`, `runId`, atau `taskId`:

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

Helper approval menggunakan RPC approval exec:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## Secara Eksplisit Belum Didukung Saat Ini

SDK menyertakan nama untuk model produk yang kami inginkan, tetapi tidak
diam-diam berpura-pura RPC Gateway tersedia. Panggilan ini saat ini melempar
error tidak didukung yang eksplisit:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

Field per-run `workspace`, `runtime`, `environment`, dan `approvals` diberi tipe
sebagai bentuk masa depan, tetapi Gateway saat ini tidak mendukung override
tersebut pada RPC `agent`. Jika pemanggil memberikannya, SDK melempar sebelum
mengirimkan run agar pekerjaan tidak tanpa sengaja dieksekusi dengan perilaku
workspace, runtime, environment, atau approval default.

## App SDK Versus Plugin SDK

Gunakan App SDK ketika kode berada di luar OpenClaw:

- Skrip Node yang memulai atau mengamati agent run
- Tugas CI yang memanggil Gateway
- dasbor dan panel admin
- ekstensi IDE
- bridge eksternal yang tidak perlu menjadi channel plugin
- pengujian integrasi dengan transport Gateway palsu atau nyata

Gunakan Plugin SDK ketika kode berjalan di dalam OpenClaw:

- provider plugin
- channel plugin
- hook tool atau lifecycle
- plugin harness agent
- helper runtime tepercaya

Kode App SDK harus mengimpor dari `@openclaw/sdk`. Kode Plugin harus mengimpor
dari subpath `openclaw/plugin-sdk/*` yang terdokumentasi. Jangan mencampur kedua
kontrak tersebut.

## Dokumen Terkait

- [Desain API OpenClaw App SDK](/id/reference/openclaw-sdk-api-design)
- [Referensi RPC Gateway](/id/reference/rpc)
- [Loop agent](/id/concepts/agent-loop)
- [Runtime agent](/id/concepts/agent-runtimes)
- [Session](/id/concepts/session)
- [Tugas latar belakang](/id/automation/tasks)
- [Agent ACP](/id/tools/acp-agents)
- [Ikhtisar Plugin SDK](/id/plugins/sdk-overview)
