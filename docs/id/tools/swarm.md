---
read_when:
    - Anda ingin skrip Code Mode membagi pekerjaan ke beberapa agen
    - Anda memerlukan hasil turunan yang terstruktur, gerbang keputusan, atau pipeline penyelesaian pertama
    - Anda sedang mengaktifkan atau menyesuaikan batas tools.swarm
    - Anda ingin mengamati turunan kolektor di dasbor sesi
sidebarTitle: Swarm
summary: Orkestrasi subagen konkuren dari skrip Mode Kode dengan hasil terstruktur, fan-out terbatas, dan progres langsung
title: Kawanan
x-i18n:
    generated_at: "2026-07-20T14:07:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 00881c10c314eca667dd826584bfc83a4d848d8995e68905e4e53782d61c59cd
    source_path: tools/swarm.md
    workflow: 16
---

Swarm adalah cara eksperimental yang bersifat opsional untuk mengorkestrasi banyak sub-agen dari
skrip [Mode Kode](/id/tools/code-mode). Gunakan alur kontrol JavaScript atau TypeScript
biasa seperti `Promise.all`, `while`, dan `if` untuk menyebarkan pekerjaan, mengumpulkan
hasil, dan mengambil keputusan.

Tidak ada DSL graf dan tidak ada format alur kerja terpisah. Program itulah
orkestrasinya. Swarm menambahkan anak pengumpul yang dapat ditunggu, hasil terstruktur,
konkurensi terbatas, dan pelaporan progres ke program tersebut.

## Mengaktifkan Swarm

Jalur yang disarankan adalah **Settings → Labs → Swarm** di UI Kontrol. Tombol
pengalih langsung berlaku dan menulis `tools.swarm.enabled` ke
konfigurasi Anda.

Anda juga dapat mengaktifkan Swarm secara langsung di `openclaw.json`:

```json5
{
  tools: {
    swarm: {
      enabled: true,
      maxConcurrent: 8,
      maxChildrenPerGroup: 50,
      maxTotalPerGroup: 200,
      waitTimeoutSecondsMax: 600,
      defaultAgentId: "",
    },
  },
}
```

Notasi singkat boolean mengaktifkan atau menonaktifkan fitur dengan semua nilai lainnya
menggunakan nilai default:

```json5
{
  tools: {
    swarm: true,
  },
}
```

| Bidang                  | Default | Deskripsi                                                                                                                      |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`               | `false` | Mengekspos opsi pemunculan mode pengumpul, `agents_wait`, dan API tamu `agents.*` Mode Kode.                                   |
| `maxConcurrent`         | `8`     | Jumlah maksimum anak pengumpul yang berjalan secara bersamaan dalam satu grup swarm. Anak tambahan yang diterima masuk antrean dalam urutan FIFO. |
| `maxChildrenPerGroup`   | `50`    | Jumlah maksimum anak pengumpul aktif dalam satu grup.                                                                           |
| `maxTotalPerGroup`      | `200`   | Jumlah maksimum anak pengumpul yang dapat dimunculkan oleh grup selama masa aktifnya. Ini adalah pengaman terakhir terhadap pemunculan tak terkendali. |
| `waitTimeoutSecondsMax` | `600`   | Batas waktu maksimum yang diterima oleh satu panggilan `agents_wait`. Default panggilan adalah 30 detik.                       |
| `defaultAgentId`        | `""`    | Agen target yang digunakan ketika pemunculan tidak menyertakan `agentId`. Nilai kosong menggunakan agen peminta. Daftar izin sub-agen yang ada tetap berlaku. |

Nilai numerik harus berupa bilangan bulat positif. OpenClaw membatasi
`maxConcurrent` ke `1`–`1000`, `maxChildrenPerGroup` ke `1`–`10000`,
`maxTotalPerGroup` ke `1`–`100000`, dan `waitTimeoutSecondsMax` ke
`1`–`86400`.

Anda dapat mengganti pengaturan Swarm untuk satu agen yang dikonfigurasi dengan
`agents.list[].tools.swarm`. Objek per agen digabungkan di atas objek tingkat teratas
`tools.swarm`.

## Persyaratan

Global tamu `agents.run`, `phase`, dan `log` memerlukan Swarm dan
Mode Kode OpenClaw sekaligus:

```json5
{
  tools: {
    codeMode: true,
    swarm: true,
  },
}
```

Mode Kode juga harus memiliki akses efektif ke `sessions_spawn`. Profil alat,
kebijakan izin/tolak, aturan penyedia, dan kebijakan sandbox dapat menghapus alat tersebut.
Lihat [aktivasi Mode Kode](/id/tools/code-mode#activation) dan
[Sub-agen](/id/tools/subagents) jika skrip melaporkan bahwa `sessions_spawn`
tidak tersedia.

Nilai `defaultAgentId` dan `agentId` per eksekusi harus menyebut target terkonfigurasi
yang diizinkan oleh kebijakan `subagents.allowAgents` milik peminta. OpenClaw menolak
target yang tidak dikenal atau tidak diizinkan alih-alih beralih ke agen lain.

## Menulis skrip Swarm

Saat Swarm diaktifkan, Mode Kode mengekspos API tamu berikut:

```typescript
type AgentRunOptions = {
  label?: string;
  model?: string;
  thinking?: string;
  fastMode?: boolean | "auto";
  agentId?: string;
  schema?: Record<string, unknown>;
  phase?: string;
};

agents.run(prompt: string, options?: AgentRunOptions & { schema?: undefined }): Promise<string>;
agents.run<T>(prompt: string, options: AgentRunOptions & { schema: Record<string, unknown> }): Promise<T>;
phase(title: string): void;
log(message: string): void;
```

Tanpa `schema`, `agents.run()` diselesaikan menjadi teks akhir anak. Dengan
JSON Schema, nilainya diselesaikan menjadi nilai yang dikirimkan melalui alat
`structured_output` milik anak. Anak yang gagal, dihentikan, kehabisan waktu, atau memiliki skema tidak valid
menolak promise dengan `SwarmAgentError`. Baca deklarasi persis yang dihasilkan
dan pola orkestrasi singkat dari `API.read("agents.d.ts")`
di dalam Mode Kode.

Gunakan `label` untuk nama anak yang mudah dikenali di dasbor dan bilah samping. Gunakan
`phase` dalam opsi untuk memublikasikan fase tepat sebelum anak tersebut
dimulai, atau panggil `phase()` ketika beberapa anak berada dalam tahap yang sama.
`log()` memublikasikan catatan progres singkat. Panggilan progres bersifat kirim-dan-lupakan;
panggilan tersebut tidak menunda skrip jika UI tidak tersedia.

### Menyebarkan secara paralel dengan hasil terstruktur

Contoh ini meluncurkan satu peneliti per topik, menunggu semuanya selesai, lalu
meminta anak terakhir untuk menyintesis laporan terstruktur mereka:

```javascript
const reportSchema = {
  type: "object",
  properties: {
    finding: { type: "string" },
    evidence: { type: "array", items: { type: "string" } },
    confidence: { type: "number" },
  },
  required: ["finding", "evidence", "confidence"],
  additionalProperties: false,
};

const topics = ["authentication", "storage", "recovery"];
phase("Tinjauan independen");

const reports = await Promise.all(
  topics.map((topic) =>
    agents.run(`Tinjau jalur ${topic}. Kembalikan satu temuan beserta bukti.`, {
      label: `review-${topic}`,
      thinking: "high",
      fastMode: "auto",
      schema: reportSchema,
    }),
  ),
);

phase("Sintesis");
log(`Mengumpulkan ${reports.length} laporan independen.`);

return await agents.run(
  `Selaraskan laporan-laporan ini dan jelaskan perbedaannya:\n${JSON.stringify(reports)}`,
  { label: "synthesis" },
);
```

`Promise.all` adalah batas penyebaran dan penggabungan. OpenClaw memulai hingga
`maxConcurrent` anak untuk grup tersebut dan mengantrekan sisanya sesuai urutan
pengiriman.

### Mengulang berdasarkan gerbang keputusan

Gunakan perulangan `while` yang dibatasi ketika setiap putaran menentukan apakah putaran lain
diperlukan:

```javascript
const gateSchema = {
  type: "object",
  properties: {
    ready: { type: "boolean" },
    reason: { type: "string" },
    nextAction: { type: "string" },
  },
  required: ["ready", "reason", "nextAction"],
  additionalProperties: false,
};

let pass = 0;
let decision = { ready: false, reason: "Belum diperiksa", nextAction: "Tinjau" };

while (!decision.ready && pass < 4) {
  pass += 1;
  phase(`Putaran keputusan ${pass}`);
  decision = await agents.run(
    `Periksa apakah bukti rilis sudah lengkap. Keputusan sebelumnya: ${JSON.stringify(decision)}`,
    {
      label: `release-gate-${pass}`,
      schema: gateSchema,
    },
  );
  log(decision.reason);
}

if (!decision.ready) {
  throw new Error(`Gerbang masih tertutup setelah ${pass} putaran: ${decision.nextAction}`);
}

return decision;
```

Selalu batasi perulangan keputusan. `maxTotalPerGroup` adalah pengaman terakhir,
bukan pengganti kondisi penghentian yang jelas.

### Memproses anak pertama yang selesai

`agents.run()` mengembalikan promise biasa, sehingga `Promise.race` dapat bereaksi terhadap
anak Mode Kode pertama. Untuk harness yang memanggil alat tingkat rendah,
`agents_wait` menyediakan batas penyelesaian pertama yang sama: fungsi ini kembali segera
setelah setidaknya satu eksekusi yang diminta selesai, atau ketika batas waktu terbatas berakhir.
Lihat [Menggunakan Swarm dari harness lain](#use-swarm-from-other-harnesses) untuk
perulangan pengurasan lengkap.

## Perilaku anak pengumpul

Anak pengumpul adalah sesi sub-agen terisolasi biasa dengan jalur
penyelesaian yang berbeda. Mereka menulis hasil pengumpul persisten untuk ditunggu oleh induk,
alih-alih mengumumkan atau mengarahkan balasan kembali ke sesi induk.

Agen target ditentukan dalam urutan berikut:

1. `agentId` pada pemunculan atau panggilan `agents.run()`.
2. `tools.swarm.defaultAgentId`.
3. Agen peminta.

Agen pekerja khusus yang ringan berguna ketika anak swarm memerlukan permukaan
alat yang lebih kecil, model yang lebih murah, atau kebijakan sandbox yang lebih ketat. OpenClaw tidak menyertakan
id agen `worker` bawaan; konfigurasikan satu sebelum menetapkannya sebagai default.
Perketat pekerja tersebut dengan `tools.swarm: false` dalam konfigurasi per agennya agar
dapat dimunculkan tetapi tidak dapat memulai swarm dari sesi tingkat teratasnya sendiri:

```json5
{
  tools: { swarm: { enabled: true, defaultAgentId: "worker" } },
  agents: {
    list: [
      {
        id: "main",
        default: true,
        subagents: { allowAgents: ["worker"] },
      },
      { id: "worker", tools: { swarm: false } },
    ],
  },
}
```

Persetujuan pengumpul gagal secara tertutup. Anak tidak pernah membuka prompt persetujuan
operator. Tindakan alat yang memerlukan persetujuan ditolak, dan anak dapat
melaporkan penolakan tersebut dalam hasilnya agar skrip dapat menentukan tindakan berikutnya.

Untuk keluaran terstruktur, OpenClaw menambahkan alat sintetis `structured_output` ke
anak dan memvalidasi payload-nya terhadap JSON Schema yang diberikan. Payload yang
tidak valid atau tidak ada menerima satu dorongan korektif. Jika percobaan ulang masih
tidak lolos validasi, penyelesaian pengumpul mempertahankan teks mentah anak, membiarkan
`structured` tidak disetel, dan menyertakan `schemaError`. Hasil `agents_wait`
tingkat rendah mengekspos bidang-bidang tersebut untuk logika pemulihan eksplisit.

### Anak merupakan simpul daun

Anak Swarm secara default merupakan simpul daun. Pengaman universal
`agents.defaults.subagents.maxSpawnDepth` mencegah anak memunculkan
anaknya sendiri pada kedalaman default `1`. Pola orkestrasi yang lazim adalah
mengembalikan pekerjaan kepada induk, bukan memunculkan pekerjaan tambahan dari anak:

```javascript
const plan = await agents.run("Rencanakan pekerjaan ini sebagai tugas-tugas independen.", {
  schema: {
    type: "object",
    properties: { tasks: { type: "array", items: { type: "string" } } },
    required: ["tasks"],
    additionalProperties: false,
  },
});
return await Promise.all(plan.tasks.map((task) => agents.run(task)));
```

Sub-agen bertingkat merupakan pilihan eksplisit operator melalui
`agents.defaults.subagents.maxSpawnDepth` dan tidak disarankan untuk Swarm.
Batas grup, anggaran, dan observabilitas semuanya mengasumsikan grup pengumpul datar.

Setiap anak memiliki satu pemilik penerimaan. Anak pengumuman dan interaktif menggunakan
`agents.defaults.subagents.maxChildrenPerAgent` (default `5`) dan tidak menghitung
anak pengumpul. Anak pengumpul hanya menggunakan `maxChildrenPerGroup` dan
`maxTotalPerGroup`; mereka tidak menggunakan anggaran anak per sesi. Pengaman
kedalaman pemunculan tetap berlaku untuk kedua mode.

Setelah diterima, anak di atas `maxConcurrent` mengantre secara FIFO dalam grup swarm
mereka, yang berada di dalam jalur sub-agen global. Lapisan konkurensi ini mengantrekan
pekerjaan alih-alih menolaknya. Pemunculan pengumpul yang melampaui salah satu batas grup
ditolak dengan kunci konfigurasi terkait dalam pesan kesalahan.

## Mengamati Swarm

Buka dasbor sesi induk di UI Kontrol saat swarm aktif.
Widget Swarm merender setiap grup pengumpul aktif sebagai satu titik per anak dengan
status mengantre, berjalan, selesai, atau gagal. Label muncul dalam tooltip titik, sehingga label
singkat dan stabil membuat swarm yang lebih besar lebih mudah dibaca.

Bilah samping sesi mempertahankan struktur pohon induk/anak normal. Perluas baris induk
untuk memeriksa anak pengumpul atau membuka transkripnya tanpa kehilangan hierarki
swarm.

Hasil pengumpul tetap dapat ditunggu hingga grupnya diarsipkan. Setelah setiap
anggota mencapai tenggat retensinya, OpenClaw mengarsipkan anak-anak grup tersebut
sebagai satu batch agar swarm yang selesai tidak tetap berada dalam struktur sesi aktif.

## Menggunakan Swarm dari harness lain

Anda dapat menggunakan Swarm tanpa OpenClaw Code Mode. Alat intinya tidak
bergantung pada harness: mulai anak kolektor dengan
`sessions_spawn({ collect: true })` dan kumpulkan hasilnya dengan panggilan
`agents_wait` yang dibatasi.

Codex Code Mode secara otomatis mengekspos alat OpenClaw dinamis yang memenuhi syarat di bawah
`tools.*`. Mode ini tidak menggunakan API tamu QuickJS OpenClaw atau memerlukan
`tools.codeMode`, tetapi `tools.swarm` tetap harus diaktifkan. Panggilan
`agents_wait` harness Codex mendukung waktu tunggu penuh selama 600 detik. Gunakan pola ini:

```javascript
const tasks = [
  "Periksa jalur autentikasi.",
  "Periksa jalur penyimpanan.",
  "Periksa jalur pemulihan.",
];

const launches = await Promise.all(
  tasks.map((task, index) =>
    tools.sessions_spawn({
      task,
      collect: true,
      label: `review-${index + 1}`,
    }),
  ),
);

for (const launch of launches) {
  if (launch.status !== "accepted") {
    throw new Error(launch.error ?? "Peluncuran kolektor tidak diterima.");
  }
}

const pending = new Set(launches.map((launch) => launch.runId));
const completed = [];

while (pending.size > 0) {
  const ids = [...pending].slice(0, 1000);
  const batch = await tools.agents_wait({
    ids,
    timeoutSeconds: 30,
  });

  // Putar jendela terbatas ini setelah id yang belum diperiksa.
  for (const runId of ids) {
    if (pending.delete(runId)) pending.add(runId);
  }

  for (const item of batch.completed) {
    pending.delete(item.runId);
    if (item.status !== "done") {
      throw new Error(item.schemaError ?? item.result ?? `${item.runId}: ${item.status}`);
    }
    completed.push(item); // Proses setiap hasil segera setelah selesai.
  }

  for (const failure of batch.errors ?? []) {
    pending.delete(failure.runId);
    throw new Error(`${failure.runId}: ${failure.error}`);
  }
}

return completed;
```

Setiap panggilan `agents_wait` menerima 1–1000 id proses. Panggilan tersebut mengembalikan:

```typescript
type AgentsWaitResult = {
  completed: Array<{
    runId: string;
    status: "done" | "failed" | "killed" | "timeout";
    result: string;
    structured?: unknown;
    schemaError?: string;
    sessionKey: string;
    label?: string;
    usage?: { inputTokens: number; outputTokens: number };
  }>;
  pending: string[];
  errors?: Array<{
    runId: string;
    error: "not_found" | "not_owner";
  }>;
};
```

Panggilan segera kembali ketika salah satu anak yang diminta telah selesai,
ketika setidaknya satu anak yang tertunda selesai, ketika tidak ada lagi id tertunda yang valid,
atau ketika waktu tunggunya berakhir. Catatan yang selesai bersifat idempoten, sehingga meneruskan
id proses yang sudah selesai akan mengembalikan hasilnya lagi. Hanya sesi yang melakukan peluncuran
atau rantai induknya yang berwenang yang dapat menunggu kolektor.

Ini adalah polling panjang yang dibatasi, bukan loop status sibuk. Teruskan hanya
id proses yang tersisa hingga `pending` kosong. Mode kolektor mendukung subagen
native OpenClaw; mode ini tidak mendukung runtime ACP, pengikatan utas, sesi yang terlihat,
atau mode sesi persisten.

## Batas dan peta jalan

Swarm v1 menjalankan anak kolektor sekali jalan; API `agents.session()` yang direncanakan
akan menambahkan pekerja multi-giliran dengan status. Saat ini, anak berjalan pada
jalur subagen Gateway lokal; penempatan cloud direncanakan sebagai opsi peluncuran
eksplisit. Definisi alur kerja tersimpan dan DSL graf bukan bagian dari arah Swarm
saat ini.

## Terkait

- [Code Mode](/id/tools/code-mode) untuk runtime tamu QuickJS dan aturan aktivasi
- [Subagen](/id/tools/subagents) untuk kebijakan anak, isolasi, dan perilaku sesi
- [Alat sandbox multiagen](/id/tools/multi-agent-sandbox-tools) untuk pembatasan per agen
- [Ikhtisar alat](/id/tools) untuk profil alat dan perutean kebijakan
