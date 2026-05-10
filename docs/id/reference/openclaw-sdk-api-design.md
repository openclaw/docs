---
read_when:
    - Anda sedang mengimplementasikan SDK aplikasi OpenClaw publik yang diusulkan
    - Anda memerlukan kontrak namespace draf, peristiwa, hasil, artefak, persetujuan, atau keamanan untuk SDK aplikasi
    - Anda sedang membandingkan sumber daya protokol Gateway dengan pembungkus OpenClaw App SDK tingkat tinggi
sidebarTitle: App SDK API design
summary: Desain referensi untuk API OpenClaw App SDK publik, taksonomi peristiwa, artefak, persetujuan, dan struktur paket
title: Desain API SDK Aplikasi OpenClaw
x-i18n:
    generated_at: "2026-05-10T19:51:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7eab11a5dfb85465e7d6da971fba779baaef06fd333eb53a39b53d7150e85b72
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Halaman ini adalah desain referensi API terperinci untuk
[SDK Aplikasi OpenClaw](/id/concepts/openclaw-sdk) publik. Ini sengaja dipisahkan dari
[SDK Plugin](/id/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` adalah paket aplikasi/klien eksternal untuk berkomunikasi dengan
  Gateway. `openclaw/plugin-sdk/*` adalah kontrak penulisan Plugin dalam proses.
  Jangan impor subpath SDK Plugin dari aplikasi yang hanya perlu menjalankan agen.
</Note>

SDK aplikasi publik harus dibangun dalam dua lapisan:

1. Klien Gateway tingkat rendah yang dihasilkan.
2. Wrapper ergonomis tingkat tinggi dengan objek `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval`, dan `Environment`.

## Desain namespace

Namespace tingkat rendah harus mengikuti resource Gateway dengan cermat:

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

oc.tasks.list({ status: "running" });
oc.tasks.get(taskId);
oc.tasks.cancel(taskId, { reason });
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

Wrapper tingkat tinggi harus mengembalikan objek yang membuat alur umum terasa nyaman:

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

## Kontrak peristiwa

SDK publik harus mengekspos peristiwa berversi, dapat diputar ulang, dan ternormalisasi.

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

`id` adalah kursor pemutaran ulang. Konsumen harus dapat terhubung kembali dengan
`events({ after: id })` dan menerima peristiwa yang terlewat ketika retensi memungkinkan.

Kelompok peristiwa ternormalisasi yang direkomendasikan:

| Peristiwa             | Arti                                                        |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | Run diterima.                                               |
| `run.queued`          | Run menunggu lane sesi, runtime, atau lingkungan.           |
| `run.started`         | Runtime memulai eksekusi.                                   |
| `run.completed`       | Run berhasil selesai.                                       |
| `run.failed`          | Run berakhir dengan kesalahan.                              |
| `run.cancelled`       | Run dibatalkan.                                             |
| `run.timed_out`       | Run melampaui batas waktunya.                               |
| `assistant.delta`     | Delta teks asisten.                                         |
| `assistant.message`   | Pesan asisten lengkap atau pengganti.                       |
| `thinking.delta`      | Delta penalaran atau rencana, ketika kebijakan mengizinkan eksposur. |
| `tool.call.started`   | Pemanggilan tool dimulai.                                   |
| `tool.call.delta`     | Pemanggilan tool mengalirkan progres atau output parsial.   |
| `tool.call.completed` | Pemanggilan tool berhasil dikembalikan.                     |
| `tool.call.failed`    | Pemanggilan tool gagal.                                     |
| `approval.requested`  | Run atau tool memerlukan persetujuan.                       |
| `approval.resolved`   | Persetujuan diberikan, ditolak, kedaluwarsa, atau dibatalkan. |
| `question.requested`  | Runtime meminta input dari pengguna atau aplikasi host.     |
| `question.answered`   | Aplikasi host memberikan jawaban.                           |
| `artifact.created`    | Artifact baru tersedia.                                     |
| `artifact.updated`    | Artifact yang ada berubah.                                  |
| `session.created`     | Sesi dibuat.                                                |
| `session.updated`     | Metadata sesi berubah.                                      |
| `session.compacted`   | Compaction sesi terjadi.                                    |
| `task.updated`        | Status tugas latar belakang berubah.                        |
| `git.branch`          | Runtime mengamati atau mengubah status branch.              |
| `git.diff`            | Runtime menghasilkan atau mengubah diff.                    |
| `git.pr`              | Runtime membuka, memperbarui, atau menautkan pull request.  |

Payload bawaan runtime harus tersedia melalui `raw`, tetapi aplikasi tidak perlu
mem-parse `raw` untuk UI normal.

## Kontrak hasil

`Run.wait()` harus mengembalikan envelope hasil yang stabil:

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
sehingga run berbasis lifecycle saat ini biasanya melaporkan angka milidetik epoch
sementara adapter masih dapat menampilkan string ISO. UI kaya, trace tool, dan
detail bawaan runtime berada di peristiwa dan artifact.

`accepted` adalah hasil tunggu non-terminal: artinya tenggat tunggu Gateway
kedaluwarsa sebelum run menghasilkan akhir/kesalahan lifecycle. Ini tidak boleh diperlakukan sebagai
`timed_out`; `timed_out` dicadangkan untuk run yang melampaui batas waktu runtime-nya sendiri.

## Persetujuan dan pertanyaan

Persetujuan harus menjadi warga kelas satu karena agen pemrograman terus-menerus melintasi
batas keamanan.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

Peristiwa persetujuan harus memuat:

- id persetujuan
- id run dan id sesi
- jenis permintaan
- ringkasan tindakan yang diminta
- nama tool atau tindakan lingkungan
- tingkat risiko
- keputusan yang tersedia
- kedaluwarsa
- apakah keputusan dapat digunakan kembali

Pertanyaan terpisah dari persetujuan. Pertanyaan meminta informasi kepada pengguna atau aplikasi host.
Persetujuan meminta izin untuk melakukan suatu tindakan.

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
- source: OpenClaw, MCP, Plugin, channel, runtime, atau app
- ringkasan skema
- kebijakan persetujuan
- kompatibilitas runtime
- apakah tool tersembunyi, readonly, mampu menulis, atau mampu host

Pemanggilan tool melalui SDK harus eksplisit dan terscoped. Sebagian besar aplikasi harus
menjalankan agen, bukan memanggil tool sembarang secara langsung.

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
- snapshot workspace lingkungan terkelola

Akses artifact harus mendukung redaksi, retensi, dan URL unduhan tanpa
berasumsi bahwa setiap artifact adalah file lokal normal.

## Model keamanan

SDK aplikasi harus eksplisit tentang otoritas.

Scope token yang direkomendasikan:

| Scope               | Mengizinkan                                         |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | Mencantumkan dan memeriksa agen.                    |
| `agent.run`         | Memulai run.                                        |
| `session.read`      | Membaca metadata dan pesan sesi.                    |
| `session.write`     | Membuat, mengirim ke, mem-fork, meng-compact, dan membatalkan sesi. |
| `task.read`         | Membaca status tugas latar belakang.                |
| `task.write`        | Membatalkan atau mengubah kebijakan notifikasi tugas. |
| `approval.respond`  | Menyetujui atau menolak permintaan.                 |
| `tools.invoke`      | Memanggil tool yang diekspos secara langsung.       |
| `artifacts.read`    | Mencantumkan dan mengunduh artifact.                |
| `environment.write` | Membuat atau menghancurkan lingkungan terkelola.    |
| `admin`             | Operasi administratif.                              |

Default:

- tidak ada penerusan rahasia secara default
- tidak ada pass-through variabel lingkungan tanpa batas
- referensi rahasia, bukan nilai rahasia
- kebijakan sandbox dan jaringan yang eksplisit
- retensi lingkungan jarak jauh yang eksplisit
- persetujuan untuk eksekusi host kecuali kebijakan membuktikan sebaliknya
- peristiwa runtime mentah direduksi sebelum keluar dari Gateway kecuali pemanggil memiliki
  scope diagnostik yang lebih kuat

## Penyedia lingkungan terkelola

Agen terkelola harus diimplementasikan sebagai penyedia lingkungan.

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

Implementasi pertama tidak perlu berupa SaaS ter-hosting. Ia dapat menargetkan
host node yang ada, workspace sementara, runner bergaya CI, atau lingkungan
bergaya Testbox. Kontrak pentingnya adalah:

1. menyiapkan workspace
2. mengikat lingkungan dan rahasia yang aman
3. memulai run
4. mengalirkan peristiwa
5. mengumpulkan artifact
6. membersihkan atau mempertahankan sesuai kebijakan

Setelah ini stabil, layanan cloud ter-hosting dapat mengimplementasikan kontrak
penyedia yang sama.

## Struktur paket

Paket yang direkomendasikan:

| Paket                   | Tujuan                                                        |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | SDK tingkat tinggi publik dan klien Gateway tingkat rendah yang dihasilkan. |
| `@openclaw/sdk-react`   | Hook React opsional untuk dashboard dan pembangun aplikasi.   |
| `@openclaw/sdk-testing` | Helper pengujian dan server Gateway palsu untuk integrasi aplikasi. |

Repo sudah memiliki `openclaw/plugin-sdk/*` untuk Plugin. Jaga namespace itu
terpisah agar tidak membingungkan penulis Plugin dengan pengembang aplikasi.

## Strategi klien yang dihasilkan

Klien tingkat rendah harus dihasilkan dari skema protokol Gateway berversi,
lalu dibungkus oleh kelas ergonomis yang ditulis manual.

Pelapisan:

1. Sumber kebenaran skema Gateway.
2. Klien TypeScript tingkat rendah yang dihasilkan.
3. Validator runtime untuk input eksternal dan payload peristiwa.
4. Wrapper tingkat tinggi `OpenClaw`, `Agent`, `Session`, `Run`, `Task`, dan `Artifact`.
5. Contoh cookbook dan tes integrasi.

Manfaat:

- penyimpangan protokol terlihat
- tes dapat membandingkan metode yang dihasilkan dengan ekspor Gateway
- App SDK tetap independen dari internal Plugin SDK
- konsumen tingkat rendah tetap memiliki akses penuh ke protokol
- konsumen tingkat tinggi mendapatkan API produk yang kecil

## Terkait

- [OpenClaw App SDK](/id/concepts/openclaw-sdk)
- [Referensi RPC Gateway](/id/reference/rpc)
- [Loop agent](/id/concepts/agent-loop)
- [Runtime agent](/id/concepts/agent-runtimes)
- [Tugas latar belakang](/id/automation/tasks)
- [Agent ACP](/id/tools/acp-agents)
- [Ikhtisar Plugin SDK](/id/plugins/sdk-overview)
