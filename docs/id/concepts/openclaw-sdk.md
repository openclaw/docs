---
read_when:
    - Anda sedang membangun aplikasi eksternal, skrip, dasbor, pekerjaan CI, atau ekstensi IDE yang berkomunikasi dengan OpenClaw
    - Anda sedang memilih antara App SDK dan Plugin SDK
    - Anda berintegrasi dengan run agen Gateway, sesi, peristiwa, persetujuan, model, atau alat
sidebarTitle: App SDK
summary: SDK Aplikasi OpenClaw publik untuk aplikasi eksternal, skrip, dasbor, pekerjaan CI, dan ekstensi IDE
title: SDK Aplikasi OpenClaw
x-i18n:
    generated_at: "2026-04-30T09:44:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c46454d172a25d329a796461982dc4307d3720a28df777eda8605996505e38c
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** adalah API klien publik untuk aplikasi di luar proses
OpenClaw. Gunakan `@openclaw/sdk` ketika skrip, dasbor, pekerjaan CI, ekstensi
IDE, atau aplikasi eksternal lain ingin terhubung ke Gateway, memulai
run agen, mengalirkan event, menunggu hasil, membatalkan pekerjaan, atau
memeriksa resource Gateway.

<Note>
  App SDK berbeda dari [Plugin SDK](/id/plugins/sdk-overview).
  `@openclaw/sdk` berbicara dengan Gateway dari luar OpenClaw.
  `openclaw/plugin-sdk/*` hanya untuk plugin yang berjalan di dalam OpenClaw dan
  mendaftarkan provider, channel, tool, hook, atau runtime tepercaya.
</Note>

## Yang Tersedia Saat Ini

`@openclaw/sdk` tersedia dengan:

| Permukaan                 | Status    | Fungsinya                                                                    |
| ------------------------- | --------- | ---------------------------------------------------------------------------- |
| `OpenClaw`                | Siap      | Titik masuk klien utama. Mengelola transport, koneksi, request, dan event.   |
| `GatewayClientTransport`  | Siap      | Transport WebSocket yang didukung oleh klien Gateway.                        |
| `oc.agents`               | Siap      | Mencantumkan, membuat, memperbarui, menghapus, dan mengambil handle agen.    |
| `Agent.run()`             | Siap      | Memulai run `agent` Gateway dan mengembalikan `Run`.                         |
| `oc.runs`                 | Siap      | Membuat, mengambil, menunggu, membatalkan, dan mengalirkan run.              |
| `Run.events()`            | Siap      | Mengalirkan event per-run yang dinormalisasi dengan replay untuk run cepat.  |
| `Run.wait()`              | Siap      | Memanggil `agent.wait` dan mengembalikan `RunResult` yang stabil.            |
| `Run.cancel()`            | Siap      | Memanggil `sessions.abort` berdasarkan id run, dengan kunci sesi jika ada.   |
| `oc.sessions`             | Siap      | Membuat, me-resolve, mengirim ke, menambal, memadatkan, dan mengambil handle sesi. |
| `Session.send()`          | Siap      | Memanggil `sessions.send` dan mengembalikan `Run`.                           |
| `oc.models`               | Siap      | Memanggil `models.list` dan RPC status `models.authStatus` saat ini.         |
| `oc.tools`                | Sebagian  | Mencantumkan katalog tool dan tool efektif; pemanggilan tool langsung belum tersambung. |
| `oc.approvals`            | Siap      | Mencantumkan dan me-resolve persetujuan exec melalui RPC persetujuan Gateway. |
| `oc.rawEvents()`          | Siap      | Mengekspos event Gateway mentah untuk konsumen tingkat lanjut.               |
| `normalizeGatewayEvent()` | Siap      | Mengubah event Gateway mentah menjadi bentuk event SDK yang stabil.          |

SDK juga mengekspor tipe inti yang digunakan oleh permukaan tersebut:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`RuntimeSelection`, `EnvironmentSelection`, `WorkspaceSelection`,
`ApprovalMode`, dan tipe hasil terkait.

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
`gateway: "auto"` diterima oleh konstruktor, tetapi penemuan Gateway otomatis
belum menjadi fitur SDK terpisah; teruskan `url` ketika aplikasi belum tahu
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

## Menjalankan Agen

Gunakan `oc.agents.get(id)` ketika aplikasi menginginkan handle agen, lalu panggil
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

Ref model berkualifikasi provider seperti `openai/gpt-5.5` dipecah menjadi
override `provider` dan `model` Gateway. `timeoutMs` tetap dalam milidetik di SDK
dan dikonversi menjadi detik timeout Gateway untuk RPC `agent`.

`run.wait()` menggunakan RPC `agent.wait` Gateway. Tenggat tunggu yang kedaluwarsa
saat run masih aktif mengembalikan `status: "accepted"` alih-alih berpura-pura
run itu sendiri mengalami timeout. Timeout runtime, run yang dibatalkan, dan run
yang dicancel dinormalisasi menjadi `timed_out` atau `cancelled`.

## Membuat Dan Menggunakan Ulang Sesi

Gunakan sesi ketika aplikasi menginginkan status transkrip yang persisten.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` memanggil `sessions.send` dan mengembalikan `Run`. Handle sesi juga
mendukung:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Mengalirkan Event

SDK menormalisasi event Gateway mentah menjadi amplop `OpenClawEvent` yang stabil:

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

Jenis event umum meliputi:

| Jenis event           | Event Gateway sumber                       |
| --------------------- | ------------------------------------------ |
| `run.started`         | Awal siklus hidup `agent`                  |
| `run.completed`       | Akhir siklus hidup `agent`                 |
| `run.failed`          | Error siklus hidup `agent`                 |
| `run.cancelled`       | Akhir siklus hidup yang diabort/dicancel   |
| `run.timed_out`       | Akhir siklus hidup timeout                 |
| `assistant.delta`     | Delta streaming asisten                    |
| `assistant.message`   | Pesan asisten                              |
| `thinking.delta`      | Aliran pemikiran atau rencana              |
| `tool.call.started`   | Awal tool/item/perintah                    |
| `tool.call.delta`     | Pembaruan tool/item/perintah               |
| `tool.call.completed` | Penyelesaian tool/item/perintah            |
| `tool.call.failed`    | Kegagalan atau status diblokir tool/item/perintah |
| `approval.requested`  | Request persetujuan exec atau plugin       |
| `approval.resolved`   | Resolusi persetujuan exec atau plugin      |
| `session.created`     | Pembuatan `sessions.changed`               |
| `session.updated`     | Pembaruan `sessions.changed`               |
| `session.compacted`   | Compaction `sessions.changed`              |
| `task.updated`        | Event pembaruan tugas                      |
| `artifact.updated`    | Event aliran patch                         |
| `raw`                 | Event apa pun yang belum memiliki pemetaan SDK stabil |

`Run.events()` memfilter event ke satu id run dan me-replay event yang sudah
terlihat untuk run cepat. Artinya alur yang didokumentasikan aman:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Untuk aliran seluruh aplikasi, gunakan `oc.events()`. Untuk frame Gateway mentah,
gunakan `oc.rawEvents()`.

## Model, Tool, Dan Persetujuan

Helper model dipetakan ke metode Gateway saat ini:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Helper tool mengekspos katalog Gateway dan tampilan tool efektif:

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

Helper persetujuan menggunakan RPC persetujuan exec:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## Yang Secara Eksplisit Belum Didukung Saat Ini

SDK menyertakan nama untuk model produk yang kami inginkan, tetapi tidak diam-diam
berpura-pura RPC Gateway sudah ada. Panggilan ini saat ini melempar error tidak
didukung yang eksplisit:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.tools.invoke("tool-name", {});

await oc.artifacts.list();
await oc.artifacts.get("artifact-id");
await oc.artifacts.download("artifact-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

Field per-run `workspace`, `runtime`, `environment`, dan `approvals` diketik
sebagai bentuk mendatang, tetapi Gateway saat ini tidak mendukung override
tersebut pada RPC `agent`. Jika pemanggil meneruskannya, SDK melempar sebelum
mengirimkan run agar pekerjaan tidak secara tidak sengaja dieksekusi dengan
perilaku workspace, runtime, environment, atau persetujuan default.

## App SDK Dibanding Plugin SDK

Gunakan App SDK ketika kode berada di luar OpenClaw:

- Skrip Node yang memulai atau mengamati run agen
- Pekerjaan CI yang memanggil Gateway
- dasbor dan panel admin
- ekstensi IDE
- bridge eksternal yang tidak perlu menjadi plugin channel
- pengujian integrasi dengan transport Gateway palsu atau nyata

Gunakan Plugin SDK ketika kode berjalan di dalam OpenClaw:

- plugin provider
- plugin channel
- hook tool atau siklus hidup
- plugin harness agen
- helper runtime tepercaya

Kode App SDK harus mengimpor dari `@openclaw/sdk`. Kode Plugin harus mengimpor dari
subpath `openclaw/plugin-sdk/*` yang didokumentasikan. Jangan campur kedua kontrak.

## Dokumen Terkait

- [Desain API OpenClaw App SDK](/id/reference/openclaw-sdk-api-design)
- [Referensi RPC Gateway](/id/reference/rpc)
- [Loop agen](/id/concepts/agent-loop)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Sesi](/id/concepts/session)
- [Tugas latar belakang](/id/automation/tasks)
- [Agen ACP](/id/tools/acp-agents)
- [Ikhtisar Plugin SDK](/id/plugins/sdk-overview)
