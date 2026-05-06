---
read_when:
    - Anda sedang mengimplementasikan SDK aplikasi OpenClaw publik yang diusulkan
    - Anda memerlukan kontrak namespace, peristiwa, hasil, artefak, persetujuan, atau keamanan draf untuk SDK aplikasi
    - Anda sedang membandingkan sumber daya protokol Gateway dengan pembungkus OpenClaw App SDK tingkat tinggi
sidebarTitle: App SDK API design
summary: Rancangan referensi untuk API publik OpenClaw App SDK, taksonomi peristiwa, artefak, persetujuan, dan struktur paket
title: Desain API SDK Aplikasi OpenClaw
x-i18n:
    generated_at: "2026-05-06T09:26:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c49afb4b3b23653e1c6512c22c7465dc1778fc9ea2b28864ca9eaa3ccc90f2f
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Halaman ini adalah desain referensi API terperinci untuk
[OpenClaw App SDK](/id/concepts/openclaw-sdk) publik. Halaman ini sengaja dipisahkan dari
[Plugin SDK](/id/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` adalah paket aplikasi/klien eksternal untuk berkomunikasi dengan
  Gateway. `openclaw/plugin-sdk/*` adalah kontrak penulisan Plugin dalam proses.
  Jangan mengimpor subpath Plugin SDK dari aplikasi yang hanya perlu menjalankan agent.
</Note>

SDK aplikasi publik harus dibangun dalam dua lapisan:

1. Klien Gateway tingkat rendah yang dihasilkan.
2. Pembungkus ergonomis tingkat tinggi dengan objek `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval`, dan `Environment`.

## Desain namespace

Namespace tingkat rendah harus mengikuti resource Gateway dengan saksama:

```typescript
oc.agents.list();
oc.agents.get("main");
oc.agents.create(...);
oc.agents.update(...);

oc.sessions.list();
oc.sessions.create(...);
oc.sessions.resolve(...);
oc.sessions.send(...);
oc.sessions.messages(...);
oc.sessions.fork(...);
oc.sessions.compact(...);
oc.sessions.abort(...);

oc.runs.create(...);
oc.runs.get(runId);
oc.runs.events(runId, { after });
oc.runs.wait(runId);
oc.runs.cancel(runId);

oc.tasks.list(); // future API: current SDK throws unsupported
oc.tasks.get(taskId); // future API: current SDK throws unsupported
oc.tasks.cancel(taskId); // future API: current SDK throws unsupported
oc.tasks.events(taskId, { after }); // future API

oc.models.list();
oc.models.status(); // Gateway models.authStatus

oc.tools.list();
oc.tools.invoke("tool-name", { sessionKey, idempotencyKey });

oc.artifacts.list({ runId });
oc.artifacts.get(artifactId, { runId });
oc.artifacts.download(artifactId, { runId });

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list();
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId);
oc.environments.delete(environmentId); // future API: current SDK throws unsupported
```

Pembungkus tingkat tinggi harus mengembalikan objek yang membuat alur umum terasa nyaman:

```typescript
const run = await agent.run(inputOrParams);
await run.cancel();
await run.wait();

for await (const event of run.events()) {
  // normalized event stream
}

const artifacts = await run.artifacts.list();
const session = await run.session();
```

## Kontrak event

SDK publik harus mengekspos event yang berversi, dapat diputar ulang, dan dinormalisasi.

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
  raw?: unknown;
};
```

`id` adalah kursor pemutaran ulang. Konsumen harus dapat terhubung ulang dengan
`events({ after: id })` dan menerima event yang terlewat jika retensi memungkinkan.

Keluarga event ternormalisasi yang direkomendasikan:

| Event                 | Makna                                                       |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | Run diterima.                                               |
| `run.queued`          | Run sedang menunggu jalur sesi, runtime, atau environment.  |
| `run.started`         | Runtime memulai eksekusi.                                   |
| `run.completed`       | Run berhasil diselesaikan.                                  |
| `run.failed`          | Run berakhir dengan error.                                  |
| `run.cancelled`       | Run dibatalkan.                                             |
| `run.timed_out`       | Run melampaui batas waktunya.                               |
| `assistant.delta`     | Delta teks asisten.                                         |
| `assistant.message`   | Pesan asisten lengkap atau pengganti.                       |
| `thinking.delta`      | Delta penalaran atau rencana, saat kebijakan mengizinkan eksposur. |
| `tool.call.started`   | Panggilan tool dimulai.                                     |
| `tool.call.delta`     | Panggilan tool mengalirkan progres atau output parsial.     |
| `tool.call.completed` | Panggilan tool berhasil dikembalikan.                       |
| `tool.call.failed`    | Panggilan tool gagal.                                       |
| `approval.requested`  | Run atau tool memerlukan persetujuan.                       |
| `approval.resolved`   | Persetujuan diberikan, ditolak, kedaluwarsa, atau dibatalkan. |
| `question.requested`  | Runtime meminta input dari pengguna atau aplikasi host.     |
| `question.answered`   | Aplikasi host menyediakan jawaban.                          |
| `artifact.created`    | Artifact baru tersedia.                                     |
| `artifact.updated`    | Artifact yang ada berubah.                                  |
| `session.created`     | Sesi dibuat.                                                |
| `session.updated`     | Metadata sesi berubah.                                      |
| `session.compacted`   | Compaction sesi terjadi.                                    |
| `task.updated`        | Status tugas latar belakang berubah.                        |
| `git.branch`          | Runtime mengamati atau mengubah status branch.              |
| `git.diff`            | Runtime menghasilkan atau mengubah diff.                    |
| `git.pr`              | Runtime membuka, memperbarui, atau menautkan pull request.  |

Payload asli runtime harus tersedia melalui `raw`, tetapi aplikasi tidak harus
mengurai `raw` untuk UI normal.

## Kontrak hasil

`Run.wait()` harus mengembalikan amplop hasil yang stabil:

```typescript
type RunResult = {
  runId: string;
  status: "accepted" | "completed" | "failed" | "cancelled" | "timed_out";
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  startedAt?: string | number;
  endedAt?: string | number;
  output?: {
    text?: string;
    messages?: SDKMessage[];
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costUsd?: number;
  };
  artifacts?: ArtifactSummary[];
  error?: SDKError;
};
```

Hasil harus sederhana dan stabil. Nilai timestamp mempertahankan bentuk Gateway,
jadi run saat ini yang didukung lifecycle biasanya melaporkan angka milidetik epoch,
sementara adapter mungkin masih memunculkan string ISO. UI kaya, trace tool, dan
detail asli runtime berada di event dan artifact.

`accepted` adalah hasil tunggu non-terminal: artinya tenggat tunggu Gateway
berakhir sebelum run menghasilkan akhir/error lifecycle. Ini tidak boleh dianggap sebagai
`timed_out`; `timed_out` dicadangkan untuk run yang melampaui timeout runtime-nya sendiri.

## Persetujuan dan pertanyaan

Persetujuan harus menjadi konsep kelas satu karena agent coding terus-menerus melewati batas
keamanan.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

Event persetujuan harus membawa:

- id persetujuan
- id run dan id sesi
- jenis permintaan
- ringkasan tindakan yang diminta
- nama tool atau tindakan environment
- tingkat risiko
- keputusan yang tersedia
- kedaluwarsa
- apakah keputusan dapat digunakan ulang

Pertanyaan terpisah dari persetujuan. Pertanyaan meminta informasi dari pengguna atau aplikasi host.
Persetujuan meminta izin untuk melakukan tindakan.

## Model ToolSpace

Aplikasi perlu memahami permukaan tool tanpa mengimpor internal Plugin.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK harus mengekspos:

- metadata tool ternormalisasi
- sumber: OpenClaw, MCP, Plugin, channel, runtime, atau aplikasi
- ringkasan schema
- kebijakan persetujuan
- kompatibilitas runtime
- apakah tool tersembunyi, readonly, mampu menulis, atau mampu host

Pemanggilan tool melalui SDK harus eksplisit dan tercakup. Sebagian besar aplikasi harus
menjalankan agent, bukan memanggil tool sembarang secara langsung.

## Model artifact

Artifact harus mencakup lebih dari file.

```typescript
type ArtifactSummary = {
  id: string;
  runId?: string;
  sessionId?: string;
  type:
    | "file"
    | "patch"
    | "diff"
    | "log"
    | "media"
    | "screenshot"
    | "trajectory"
    | "pull_request"
    | "workspace";
  title?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: string;
  expiresAt?: string;
};
```

Contoh umum:

- edit file dan file yang dihasilkan
- bundel patch
- diff VCS
- screenshot dan output media
- log dan bundel trace
- tautan pull request
- trajectory runtime
- snapshot workspace environment terkelola

Akses artifact harus mendukung redaksi, retensi, dan URL unduhan tanpa
mengasumsikan setiap artifact adalah file lokal normal.

## Model keamanan

SDK aplikasi harus eksplisit tentang otoritas.

Scope token yang direkomendasikan:

| Scope               | Mengizinkan                                         |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | Mencantumkan dan memeriksa agent.                   |
| `agent.run`         | Memulai run.                                        |
| `session.read`      | Membaca metadata dan pesan sesi.                    |
| `session.write`     | Membuat, mengirim ke, fork, compact, dan membatalkan sesi. |
| `task.read`         | Membaca status tugas latar belakang.                |
| `task.write`        | Membatalkan atau mengubah kebijakan notifikasi tugas. |
| `approval.respond`  | Menyetujui atau menolak permintaan.                 |
| `tools.invoke`      | Memanggil tool yang diekspos secara langsung.       |
| `artifacts.read`    | Mencantumkan dan mengunduh artifact.                |
| `environment.write` | Membuat atau menghancurkan environment terkelola.   |
| `admin`             | Operasi administratif.                              |

Default:

- tidak ada penerusan secret secara default
- tidak ada pass-through variabel environment tanpa batasan
- referensi secret alih-alih nilai secret
- kebijakan sandbox dan jaringan yang eksplisit
- retensi environment remote yang eksplisit
- persetujuan untuk eksekusi host kecuali kebijakan membuktikan sebaliknya
- event runtime mentah diredaksi sebelum meninggalkan Gateway kecuali pemanggil memiliki
  scope diagnostik yang lebih kuat

## Penyedia environment terkelola

Agent terkelola harus diimplementasikan sebagai penyedia environment.

```typescript
type EnvironmentProvider = {
  id: string;
  capabilities: {
    checkout?: boolean;
    sandbox?: boolean;
    networkPolicy?: boolean;
    secrets?: boolean;
    artifacts?: boolean;
    logs?: boolean;
    pullRequests?: boolean;
    longRunning?: boolean;
  };
};
```

Implementasi pertama tidak harus berupa SaaS terhosting. Implementasi ini dapat menargetkan
host node yang ada, workspace ephemeral, runner bergaya CI, atau environment bergaya Testbox.
Kontrak pentingnya adalah:

1. menyiapkan workspace
2. mengikat environment dan secret yang aman
3. memulai run
4. mengalirkan event
5. mengumpulkan artifact
6. membersihkan atau mempertahankan sesuai kebijakan

Setelah ini stabil, layanan cloud terhosting dapat mengimplementasikan kontrak penyedia
yang sama.

## Struktur paket

Paket yang direkomendasikan:

| Paket                   | Tujuan                                                        |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | SDK tingkat tinggi publik dan klien Gateway tingkat rendah yang dihasilkan. |
| `@openclaw/sdk-react`   | Hook React opsional untuk dashboard dan pembuat aplikasi.     |
| `@openclaw/sdk-testing` | Helper test dan server Gateway palsu untuk integrasi aplikasi. |

Repo sudah memiliki `openclaw/plugin-sdk/*` untuk Plugin. Jaga agar namespace itu
tetap terpisah untuk menghindari kebingungan antara penulis Plugin dan developer aplikasi.

## Strategi klien yang dihasilkan

Klien tingkat rendah harus dihasilkan dari schema protokol Gateway berversi,
lalu dibungkus oleh class ergonomis yang ditulis manual.

Pelapisan:

1. Sumber kebenaran skema Gateway.
2. Klien TypeScript tingkat rendah yang dihasilkan.
3. Validator runtime untuk input eksternal dan payload peristiwa.
4. Wrapper tingkat tinggi `OpenClaw`, `Agent`, `Session`, `Run`, `Task`, dan `Artifact`.
5. Contoh cookbook dan pengujian integrasi.

Manfaat:

- penyimpangan protokol terlihat
- pengujian dapat membandingkan metode yang dihasilkan dengan ekspor Gateway
- App SDK tetap independen dari internal Plugin SDK
- konsumen tingkat rendah tetap memiliki akses protokol penuh
- konsumen tingkat tinggi mendapatkan API produk yang kecil

## Terkait

- [OpenClaw App SDK](/id/concepts/openclaw-sdk)
- [Referensi RPC Gateway](/id/reference/rpc)
- [Loop agen](/id/concepts/agent-loop)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Tugas latar belakang](/id/automation/tasks)
- [Agen ACP](/id/tools/acp-agents)
- [Ikhtisar Plugin SDK](/id/plugins/sdk-overview)
