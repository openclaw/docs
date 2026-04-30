---
read_when:
    - Anda sedang mengimplementasikan SDK aplikasi OpenClaw publik yang diusulkan
    - Anda memerlukan kontrak draf namespace, peristiwa, hasil, artefak, persetujuan, atau keamanan untuk SDK aplikasi
    - Anda sedang membandingkan sumber daya protokol Gateway dengan pembungkus SDK Aplikasi OpenClaw tingkat tinggi
sidebarTitle: App SDK API design
summary: Desain referensi untuk API publik OpenClaw App SDK, taksonomi peristiwa, artefak, persetujuan, dan struktur paket
title: Desain API SDK Aplikasi OpenClaw
x-i18n:
    generated_at: "2026-04-30T10:10:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: cacc5329942798b6876dba6ab8d6a9193291ddda81db5cb2ed492cc42a810099
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Halaman ini adalah rancangan referensi API terperinci untuk
[SDK Aplikasi OpenClaw](/id/concepts/openclaw-sdk) publik. Ini sengaja dipisahkan dari
[Plugin SDK](/id/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` adalah paket aplikasi/klien eksternal untuk berkomunikasi dengan
  Gateway. `openclaw/plugin-sdk/*` adalah kontrak pembuatan plugin dalam proses.
  Jangan mengimpor subpath Plugin SDK dari aplikasi yang hanya perlu menjalankan agen.
</Note>

SDK aplikasi publik sebaiknya dibangun dalam dua lapisan:

1. Klien Gateway tingkat rendah yang dihasilkan.
2. Pembungkus ergonomis tingkat tinggi dengan objek `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval`, dan `Environment`.

## Desain namespace

Namespace tingkat rendah sebaiknya mengikuti resource Gateway dengan ketat:

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
oc.tools.invoke(...); // future API: current SDK throws unsupported

oc.artifacts.list({ runId }); // future API: current SDK throws unsupported
oc.artifacts.get(artifactId); // future API: current SDK throws unsupported
oc.artifacts.download(artifactId); // future API: current SDK throws unsupported

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list(); // future API: current SDK throws unsupported
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId); // future API: current SDK throws unsupported
oc.environments.delete(environmentId); // future API: current SDK throws unsupported
```

Pembungkus tingkat tinggi sebaiknya mengembalikan objek yang membuat alur umum terasa nyaman:

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

SDK publik sebaiknya mengekspos peristiwa yang berversi, dapat diputar ulang, dan dinormalisasi.

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

`id` adalah kursor pemutaran ulang. Konsumen sebaiknya dapat terhubung kembali dengan
`events({ after: id })` dan menerima peristiwa yang terlewat ketika retensi memungkinkan.

Keluarga peristiwa ternormalisasi yang direkomendasikan:

| Peristiwa             | Makna                                                              |
| --------------------- | ------------------------------------------------------------------ |
| `run.created`         | Run diterima.                                                      |
| `run.queued`          | Run menunggu lane sesi, runtime, atau lingkungan.                  |
| `run.started`         | Runtime memulai eksekusi.                                          |
| `run.completed`       | Run selesai dengan sukses.                                         |
| `run.failed`          | Run berakhir dengan error.                                         |
| `run.cancelled`       | Run dibatalkan.                                                    |
| `run.timed_out`       | Run melampaui batas waktunya.                                      |
| `assistant.delta`     | Delta teks asisten.                                                |
| `assistant.message`   | Pesan asisten lengkap atau pengganti.                              |
| `thinking.delta`      | Delta penalaran atau rencana, ketika kebijakan mengizinkan paparan. |
| `tool.call.started`   | Pemanggilan tool dimulai.                                          |
| `tool.call.delta`     | Pemanggilan tool mengalirkan progres atau output parsial.          |
| `tool.call.completed` | Pemanggilan tool berhasil kembali.                                 |
| `tool.call.failed`    | Pemanggilan tool gagal.                                            |
| `approval.requested`  | Run atau tool membutuhkan persetujuan.                             |
| `approval.resolved`   | Persetujuan diberikan, ditolak, kedaluwarsa, atau dibatalkan.      |
| `question.requested`  | Runtime meminta input dari pengguna atau aplikasi host.            |
| `question.answered`   | Aplikasi host memberikan jawaban.                                  |
| `artifact.created`    | Artefak baru tersedia.                                             |
| `artifact.updated`    | Artefak yang ada berubah.                                          |
| `session.created`     | Sesi dibuat.                                                       |
| `session.updated`     | Metadata sesi berubah.                                             |
| `session.compacted`   | Compaction sesi terjadi.                                           |
| `task.updated`        | Status tugas latar belakang berubah.                               |
| `git.branch`          | Runtime mengamati atau mengubah status branch.                     |
| `git.diff`            | Runtime menghasilkan atau mengubah diff.                           |
| `git.pr`              | Runtime membuka, memperbarui, atau menautkan pull request.         |

Payload native runtime sebaiknya tersedia melalui `raw`, tetapi aplikasi seharusnya tidak
perlu mengurai `raw` untuk UI normal.

## Kontrak hasil

`Run.wait()` sebaiknya mengembalikan amplop hasil yang stabil:

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

Hasil sebaiknya sederhana dan stabil. Nilai timestamp mempertahankan bentuk Gateway,
sehingga run saat ini yang didukung lifecycle biasanya melaporkan angka milidetik epoch
sementara adapter mungkin masih menampilkan string ISO. UI kaya, trace tool, dan
detail native runtime berada di peristiwa dan artefak.

`accepted` adalah hasil tunggu non-terminal: ini berarti tenggat tunggu Gateway
kedaluwarsa sebelum run menghasilkan akhir/error lifecycle. Ini tidak boleh diperlakukan sebagai
`timed_out`; `timed_out` disediakan untuk run yang melampaui batas waktu runtime miliknya sendiri.

## Persetujuan dan pertanyaan

Persetujuan harus menjadi kelas utama karena agen coding terus-menerus melintasi batas keamanan.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

Peristiwa persetujuan sebaiknya memuat:

- id persetujuan
- id run dan id sesi
- jenis permintaan
- ringkasan tindakan yang diminta
- nama tool atau tindakan lingkungan
- tingkat risiko
- keputusan yang tersedia
- kedaluwarsa
- apakah keputusan dapat digunakan kembali

Pertanyaan terpisah dari persetujuan. Pertanyaan meminta informasi dari pengguna atau aplikasi host. Persetujuan meminta izin untuk melakukan tindakan.

## Model ToolSpace

Aplikasi perlu memahami permukaan tool tanpa mengimpor internal plugin.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK sebaiknya mengekspos:

- metadata tool ternormalisasi
- sumber: OpenClaw, MCP, plugin, channel, runtime, atau aplikasi
- ringkasan skema
- kebijakan persetujuan
- kompatibilitas runtime
- apakah tool tersembunyi, readonly, mampu menulis, atau mampu host

Pemanggilan tool melalui SDK sebaiknya eksplisit dan tercakup. Sebagian besar aplikasi sebaiknya
menjalankan agen, bukan memanggil tool arbitrer secara langsung.

## Model artefak

Artefak sebaiknya mencakup lebih dari file.

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
- lintasan runtime
- snapshot workspace lingkungan terkelola

Akses artefak sebaiknya mendukung redaksi, retensi, dan URL unduhan tanpa
mengasumsikan setiap artefak adalah file lokal normal.

## Model keamanan

SDK aplikasi harus eksplisit tentang otoritas.

Cakupan token yang direkomendasikan:

| Cakupan             | Mengizinkan                                             |
| ------------------- | ------------------------------------------------------- |
| `agent.read`        | Mencantumkan dan memeriksa agen.                        |
| `agent.run`         | Memulai run.                                            |
| `session.read`      | Membaca metadata dan pesan sesi.                        |
| `session.write`     | Membuat, mengirim ke, fork, compact, dan membatalkan sesi. |
| `task.read`         | Membaca status tugas latar belakang.                    |
| `task.write`        | Membatalkan atau mengubah kebijakan notifikasi tugas.   |
| `approval.respond`  | Menyetujui atau menolak permintaan.                     |
| `tools.invoke`      | Memanggil tool yang diekspos secara langsung.           |
| `artifacts.read`    | Mencantumkan dan mengunduh artefak.                     |
| `environment.write` | Membuat atau menghancurkan lingkungan terkelola.        |
| `admin`             | Operasi administratif.                                  |

Default:

- tidak ada penerusan secret secara default
- tidak ada pass-through variabel lingkungan tanpa batas
- referensi secret, bukan nilai secret
- kebijakan sandbox dan jaringan eksplisit
- retensi lingkungan jarak jauh eksplisit
- persetujuan untuk eksekusi host kecuali kebijakan membuktikan sebaliknya
- peristiwa runtime mentah diredaksi sebelum meninggalkan Gateway kecuali pemanggil memiliki
  cakupan diagnostik yang lebih kuat

## Penyedia lingkungan terkelola

Agen terkelola sebaiknya diimplementasikan sebagai penyedia lingkungan.

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

Implementasi pertama tidak perlu berupa SaaS yang di-host. Ini dapat menargetkan
host node yang ada, workspace sementara, runner bergaya CI, atau lingkungan bergaya Testbox.
Kontrak yang penting adalah:

1. menyiapkan workspace
2. mengikat lingkungan dan secret yang aman
3. memulai run
4. mengalirkan peristiwa
5. mengumpulkan artefak
6. membersihkan atau mempertahankan sesuai kebijakan

Setelah ini stabil, layanan cloud yang di-host dapat mengimplementasikan kontrak penyedia
yang sama.

## Struktur paket

Paket yang direkomendasikan:

| Paket                   | Tujuan                                                              |
| ----------------------- | ------------------------------------------------------------------- |
| `@openclaw/sdk`         | SDK tingkat tinggi publik dan klien Gateway tingkat rendah yang dihasilkan. |
| `@openclaw/sdk-react`   | Hook React opsional untuk dashboard dan pembuat aplikasi.           |
| `@openclaw/sdk-testing` | Helper pengujian dan server Gateway palsu untuk integrasi aplikasi. |

Repo sudah memiliki `openclaw/plugin-sdk/*` untuk plugin. Pisahkan namespace itu
untuk menghindari kebingungan penulis plugin dengan pengembang aplikasi.

## Strategi klien yang dihasilkan

Klien tingkat rendah harus dihasilkan dari skema protokol Gateway berversi,
lalu dibungkus oleh kelas ergonomis yang ditulis tangan.

Pelapisan:

1. Sumber kebenaran skema Gateway.
2. Klien TypeScript tingkat rendah yang dihasilkan.
3. Validator runtime untuk input eksternal dan payload peristiwa.
4. Pembungkus `OpenClaw`, `Agent`, `Session`, `Run`, `Task`, dan `Artifact`
   tingkat tinggi.
5. Contoh cookbook dan pengujian integrasi.

Manfaat:

- pergeseran protokol terlihat
- pengujian dapat membandingkan metode yang dihasilkan dengan ekspor Gateway
- SDK Aplikasi tetap independen dari internal Plugin SDK
- konsumen tingkat rendah tetap memiliki akses protokol penuh
- konsumen tingkat tinggi mendapatkan API produk yang kecil

## Dokumen terkait

- [SDK Aplikasi OpenClaw](/id/concepts/openclaw-sdk)
- [Referensi RPC Gateway](/id/reference/rpc)
- [Loop agen](/id/concepts/agent-loop)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Tugas latar belakang](/id/automation/tasks)
- [Agen ACP](/id/tools/acp-agents)
- [Ringkasan Plugin SDK](/id/plugins/sdk-overview)
