---
read_when:
    - Anda ingin menggunakan harness GitHub Copilot SDK untuk sebuah agen
    - Anda memerlukan contoh konfigurasi untuk runtime `copilot`
    - Anda menghubungkan agen ke langganan Copilot (github / openclaw / copilot) dan ingin menjalankannya melalui CLI Copilot
summary: Jalankan giliran agen tertanam OpenClaw melalui harness SDK GitHub Copilot eksternal
title: Harness SDK Copilot
x-i18n:
    generated_at: "2026-06-27T17:47:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a052cc21130b680f6af9ae32bc1dbaeaa15be5092939f0c236515a3233ab9b
    source_path: plugins/copilot.md
    workflow: 16
---

Plugin eksternal `@openclaw/copilot` memungkinkan OpenClaw menjalankan giliran agen Copilot langganan tertanam melalui GitHub Copilot CLI (`@github/copilot-sdk`) alih-alih harness PI bawaan.

Gunakan harness Copilot SDK saat Anda ingin sesi Copilot CLI memiliki loop agen tingkat rendah: eksekusi alat native, compaction native (`infiniteSessions`), dan status thread yang dikelola CLI di bawah `copilotHome`. OpenClaw tetap memiliki channel chat, file sesi, pemilihan model, alat dinamis OpenClaw (dijembatani), persetujuan, pengiriman media, mirror transkrip yang terlihat, pertanyaan sampingan `/btw` (ditangani oleh fallback PI dalam tree — lihat [Pertanyaan sampingan (`/btw`)](#side-questions-btw)), dan `openclaw doctor`.

Untuk pemisahan model/penyedia/runtime yang lebih luas, mulai dengan [Runtime agen](/id/concepts/agent-runtimes).

## Persyaratan

- OpenClaw dengan Plugin `@openclaw/copilot` terpasang.
- Jika konfigurasi Anda menggunakan `plugins.allow`, sertakan `copilot` (id manifes yang dideklarasikan oleh Plugin). Allowlist restriktif yang menggunakan nama paket bergaya npm `@openclaw/copilot` akan membuat Plugin tetap diblokir dan runtime tidak akan dimuat bahkan dengan `agentRuntime.id: "copilot"`.
- Langganan GitHub Copilot yang dapat menjalankan Copilot CLI (atau entri env / profil auth `gitHubToken` untuk eksekusi headless / cron).
- Direktori `copilotHome` yang dapat ditulis. Harness secara default menggunakan `<agentDir>/copilot` saat OpenClaw menyediakan direktori agen, jika tidak `~/.openclaw/agents/<agentId>/copilot` untuk isolasi penuh per agen.

`openclaw doctor` menjalankan [kontrak doctor](#doctor) Plugin untuk kepemilikan status sesi deklaratif dan migrasi kompatibilitas mendatang. Ini tidak menjalankan probe lingkungan Copilot CLI.

## Pemasangan Plugin

Runtime Copilot adalah Plugin eksternal sehingga paket inti `openclaw` tidak membawa dependensi `@github/copilot-sdk` atau biner CLI `@github/copilot-<platform>-<arch>` yang spesifik platform. Bersama-sama ukurannya bertambah sekitar 260 MB, jadi pasang hanya untuk agen yang memilih ikut menggunakan runtime ini:

```bash
openclaw plugins install @openclaw/copilot
```

Wizard memasang Plugin saat pertama kali Anda memilih model `github-copilot/*` **dan** konfigurasi Anda mengikutsertakan model (atau penyedianya) ke runtime agen Copilot melalui `agentRuntime: { id: "copilot" }` (lihat [Mulai cepat](#quickstart) di bawah). Tanpa opt-in, openclaw menggunakan penyedia GitHub Copilot bawaannya dan tidak pernah memasang Plugin runtime.

Runtime menyelesaikan SDK dalam urutan ini:

1. `import("@github/copilot-sdk")` dari paket `@openclaw/copilot` yang terpasang.
2. Direktori fallback yang dikenal `~/.openclaw/npm-runtime/copilot/` (target pemasangan on-demand lama).

SDK yang hilang memunculkan satu error dengan kode `COPILOT_SDK_MISSING` dan perintah pemasangan ulang Plugin di atas.

## Mulai cepat

Pin satu model (atau satu penyedia) ke harness:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

Kedua rute setara. Gunakan `agentRuntime.id` pada satu entri model saat hanya model tersebut yang harus dirutekan melalui harness; atur `agentRuntime.id` pada penyedia saat setiap model di bawah penyedia tersebut harus menggunakannya.

`github-copilot/auto` adalah titik awal portabel. Model Copilot bernama bergantung pada akun dan kebijakan organisasi, jadi pin satu model hanya setelah mengonfirmasi bahwa Copilot CLI yang diautentikasi mengeksposnya.

## Penyedia yang didukung

Harness mengiklankan dukungan untuk penyedia kanonis `github-copilot` (id yang sama yang dimiliki oleh `extensions/github-copilot`):

- `github-copilot`

Ini juga mendukung entri `models.providers` kustom saat model yang dipilih memiliki `baseUrl` yang tidak kosong dan salah satu bentuk API ini:

- `openai-responses`
- `openai-completions`
- `ollama` (completion yang kompatibel dengan OpenAI)
- `azure-openai-responses`
- `anthropic-messages`

Id penyedia native seperti `openai`, `anthropic`, `google`, dan `ollama` tetap dimiliki oleh runtime native masing-masing. Gunakan id penyedia kustom yang berbeda saat merutekan endpoint melalui Copilot BYOK.

Endpoint Copilot BYOK harus berupa URL HTTPS jaringan publik. Harness memberikan URL proxy loopback per upaya kepada Copilot SDK, lalu meneruskan traffic penyedia melalui jalur fetch terjaga milik OpenClaw sehingga kebijakan pinning DNS dan SSRF tetap dimiliki oleh OpenClaw. Gunakan runtime OpenClaw native untuk Ollama lokal, LM Studio, atau server model LAN.

## BYOK

Copilot BYOK menggunakan kontrak penyedia kustom tingkat sesi milik SDK. OpenClaw meneruskan endpoint model yang diselesaikan, kunci API, mode token bearer, header, id model, dan batas konteks/output tanpa memindahkan logika transport penyedia ke inti.

Contoh:

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

Sesi BYOK diberi kunci secara terpisah dari sesi langganan dan dari endpoint atau sidik jari kredensial lain. Memutar kunci, header, model, atau endpoint membuat sesi Copilot SDK baru alih-alih melanjutkan status yang tidak kompatibel.

## Auth

Prioritas per agen, diterapkan selama `runCopilotAttempt`:

1. **`useLoggedInUser: true` eksplisit** pada input upaya. Menggunakan pengguna login Copilot CLI yang diselesaikan di bawah `copilotHome` agen.
2. **`gitHubToken` eksplisit** pada input upaya (dengan `profileId` + `profileVersion`). Berguna untuk invokasi CLI langsung dan pengujian saat pemanggil ingin melewati resolusi profil auth.
3. **`resolvedApiKey` + `authProfileId` yang diselesaikan kontrak** dari bentuk `EmbeddedRunAttemptParams`. Ini adalah **jalur utama produksi**: inti menyelesaikan profil auth `github-copilot` yang dikonfigurasi agen (melalui `src/infra/provider-usage.auth.ts:resolveProviderAuths`) sebelum memanggil harness, dan harness mengonsumsi kedua field secara langsung. Ini membuat profil auth `github-copilot:<profile>` bekerja end-to-end untuk setup headless / cron / multi-profil tanpa env vars.
4. **Fallback env-var** untuk eksekusi CLI langsung / dogfood saat tidak ada profil auth yang dikonfigurasi. Runtime memeriksa vars berikut dalam urutan prioritas, mencerminkan penyedia `github-copilot` yang dikirim (`extensions/github-copilot/auth.ts`) dan setup Copilot SDK yang didokumentasikan:
   1. `OPENCLAW_GITHUB_TOKEN` -- override khusus harness; atur ini untuk mem-pin token bagi harness OpenClaw tanpa mengganggu konfigurasi `gh` / Copilot CLI di seluruh sistem.
   2. `COPILOT_GITHUB_TOKEN` -- env var standar Copilot SDK / CLI.
   3. `GH_TOKEN` -- env var standar `gh` CLI (sesuai prioritas penyedia `github-copilot` yang ada).
   4. `GITHUB_TOKEN` -- fallback token GitHub generik.

   Nilai tidak kosong pertama menang; string kosong diperlakukan sebagai tidak ada. Id profil pool yang disintesis adalah `env:<NAME>` dan profileVersion adalah sidik jari sha256 token yang tidak dapat dibalik, sehingga memutar nilai env memutus pool klien dengan bersih.

5. **`useLoggedInUser` default** saat tidak ada sinyal token yang tersedia.

Setiap agen mendapatkan `copilotHome` khusus sehingga token, sesi, dan konfigurasi Copilot CLI tidak bocor antaragen di mesin yang sama. Defaultnya adalah `<agentDir>/copilot` saat host menyerahkan direktori agen ke harness (mengisolasi status SDK dari `models.json` / `auth-profiles.json` milik OpenClaw di direktori yang sama), atau `~/.openclaw/agents/<agentId>/copilot` jika tidak. Override dengan `copilotHome: <path>` pada input upaya saat Anda memerlukan lokasi kustom (misalnya, mount bersama untuk migrasi).

Pengujian harness live menggunakan `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` saat token langsung diperlukan. Setup live-test bersama sengaja membersihkan `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, dan `GITHUB_TOKEN` setelah menyiapkan profil auth nyata ke home pengujian terisolasi, sehingga meneruskan nilai `gh auth token` melalui variabel live-test khusus menghindari skip palsu tanpa mengekspos token ke suite yang tidak terkait.

## Permukaan konfigurasi

Harness membaca konfigurasinya dari input per upaya (`runCopilotAttempt({...})`) ditambah sekumpulan kecil default env di dalam `extensions/copilot/src/`:

- `copilotHome` — direktori status CLI per agen (default didokumentasikan di atas).
- `model` — string atau `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Saat dihilangkan, OpenClaw menggunakan pemilihan model normal agen dan harness memverifikasi bahwa penyedia yang diselesaikan didukung.
- `reasoningEffort` — `"low" | "medium" | "high" | "xhigh"`. Dipetakan dari resolusi `ThinkLevel` / `ReasoningLevel` OpenClaw di `auto-reply/thinking.ts`.
- `infiniteSessionConfig` — override opsional untuk blok SDK `infiniteSessions` yang digerakkan oleh `harness.compact`. Default aman untuk dibiarkan apa adanya.
- `hooksConfig` — konfigurasi kompatibilitas `SessionHooks` native Copilot SDK opsional untuk callback alat/MCP, prompt pengguna, sesi, dan error. Ini terpisah dari hook lifecycle portabel OpenClaw.
- `permissionPolicy` — override opsional untuk handler `onPermissionRequest` SDK yang digunakan untuk jenis alat SDK bawaan (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). Defaultnya adalah `rejectAllPolicy` sebagai jaring pengaman; dalam praktiknya SDK tidak pernah memanggil jenis mana pun itu karena setiap alat OpenClaw yang dijembatani didaftarkan dengan `overridesBuiltInTool: true` dan `skipPermission: true` sehingga 100% panggilan alat mengalir melalui `execute()` terbungkus milik OpenClaw. Lihat [Izin dan ask_user](#permissions-and-ask_user).
- `enableSessionTelemetry` — flag telemetri sesi SDK opsional.

Hook Plugin OpenClaw tidak memerlukan konfigurasi upaya khusus Copilot. Harness menjalankan `before_prompt_build` (dan hook kompatibilitas lama `before_agent_start`), `llm_input`, `llm_output`, dan `agent_end` melalui helper harness standar. Compaction SDK yang berhasil juga menjalankan `before_compaction` dan `after_compaction`. Alat OpenClaw yang dijembatani tetap menjalankan `before_tool_call` dan melaporkan `after_tool_call`; `hooksConfig` tetap ada untuk callback khusus SDK native yang tidak memiliki padanan portabel.

Tidak ada di bagian lain OpenClaw yang perlu mengetahui field ini. Plugin, channel, dan kode inti lain hanya melihat bentuk standar `AgentHarnessAttemptParams` / `AgentHarnessAttemptResult`.

## Compaction

Saat `harness.compact` berjalan, harness Copilot SDK:

1. Melanjutkan sesi SDK yang dilacak tanpa melanjutkan pekerjaan yang tertunda.
2. Memanggil RPC compaction riwayat bercakup sesi milik SDK.
3. Mengembalikan hasil compaction SDK tanpa menulis file marker kompatibilitas di bawah workspace.

Mirror transkrip sisi OpenClaw (lihat di bawah) terus menerima pesan pasca-compaction, sehingga riwayat chat yang terlihat pengguna tetap konsisten.

## Pencerminan transkrip

`runCopilotAttempt` melakukan dual-write pesan yang dapat dicerminkan dari setiap giliran ke transkrip audit OpenClaw melalui `extensions/copilot/src/dual-write-transcripts.ts`. Mirror bercakup per sesi (`copilot:${sessionId}`) dan menggunakan identitas per pesan (`${role}:${sha256_16(role,content)}`) sehingga emisi ulang entri giliran sebelumnya bertabrakan dengan kunci yang sudah ada di disk dan tidak menduplikasi.

Mirror dibungkus dalam dua lapisan penahanan kegagalan sehingga kegagalan penulisan transkrip tidak dapat menggagalkan upaya: wrapper best-effort internal dan `.catch(...)` defense-in-depth di tingkat upaya. Kegagalan dicatat tetapi tidak dimunculkan.

## Pertanyaan sampingan (`/btw`)

`/btw` **bukan** native pada harness ini. `createCopilotAgentHarness()`
dengan sengaja membiarkan `harness.runSideQuestion` tidak terdefinisi, sehingga dispatcher `/btw`
OpenClaw (`src/agents/btw.ts`) jatuh ke path fallback PI dalam pohon sumber yang sama
seperti yang digunakan untuk setiap runtime non-Codex: provider model yang dikonfigurasi
dipanggil langsung dengan prompt pertanyaan sampingan singkat dan dialirkan kembali melalui
`streamSimple` (tanpa sesi CLI, tanpa slot pool tambahan).

Ini menjaga sesi CLI Copilot tetap dicadangkan untuk loop giliran utama agen, dan
menjaga perilaku `/btw` identik dengan runtime lain yang didukung PI. Kontraknya
ditegaskan di
[`extensions/copilot/harness.test.ts`](https://github.com/openclaw/openclaw/blob/main/extensions/copilot/harness.test.ts)
di bawah `describe("runSideQuestion")`.

## Pemeriksa

`extensions/copilot/doctor-contract-api.ts` dimuat otomatis oleh
`src/plugins/doctor-contract-registry.ts`. Berkas ini menyumbangkan:

- `legacyConfigRules` kosong (tidak ada field yang dipensiunkan pada MVP).
- `normalizeCompatibilityConfig` tanpa operasi (dipertahankan agar penghentian field
  di masa depan memiliki tempat stabil di dalam pohon sumber).
- Satu entri `sessionRouteStateOwners` yang mengklaim provider `github-copilot`;
  runtime `copilot`; kunci sesi CLI `copilot`; awalan profil autentikasi
  `github-copilot:`.

## Batasan

- Harness mengklaim `github-copilot` beserta id provider BYOK kustom yang tidak dimiliki.
  Id provider native yang dimiliki manifest tetap berada pada runtime pemiliknya bahkan ketika
  `agentRuntime.id` dipaksa menjadi `copilot`.
- Harness tidak mengirimkan TUI; TUI milik PI tidak terpengaruh dan tetap menjadi
  fallback untuk runtime apa pun yang tidak memiliki surface sejawat.
- State sesi PI tidak dimigrasikan ketika agen beralih ke `copilot`.
  Pemilihan berlaku per percobaan; sesi PI yang sudah ada tetap valid.
- `ask_user` menggunakan path prompt-dan-balasan OpenClaw yang sama seperti harness Codex.
  Ketika SDK Copilot meminta input pengguna, OpenClaw memposting prompt pemblokir
  ke channel/TUI aktif dan pesan pengguna berikutnya dalam antrean menyelesaikan
  permintaan SDK.

## Izin dan ask_user

Penegakan izin untuk tool OpenClaw yang dijembatani terjadi **di dalam
pembungkus tool**, bukan melalui callback `onPermissionRequest` milik SDK. 
`wrapToolWithBeforeToolCallHook` yang sama yang digunakan PI
(`src/agents/pi-tools.before-tool-call.ts`) diterapkan oleh
`createOpenClawCodingTools` ke setiap tool coding: deteksi loop,
kebijakan Plugin tepercaya, hook sebelum pemanggilan tool, dan persetujuan Plugin dua fase
melalui Gateway (`plugin.approval.request`) semuanya berjalan dengan
path kode yang persis sama seperti percobaan PI native.

Agar pembungkus itu memiliki keputusan, SDK Tool yang dikembalikan oleh
`convertOpenClawToolToSdkTool` ditandai dengan:

- `overridesBuiltInTool: true` — menggantikan tool bawaan CLI Copilot
  dengan nama yang sama (edit, read, write, bash, …) sehingga setiap
  pemanggilan tool diarahkan kembali ke OpenClaw.
- `skipPermission: true` — memberi tahu SDK agar tidak memicu
  `onPermissionRequest({kind: "custom-tool"})` sebelum memanggil tool.
  `execute()` yang dibungkus menjalankan pemeriksaan kebijakan OpenClaw yang lebih kaya
  secara internal; prompt tingkat SDK akan memintas penegakan OpenClaw
  (jika kita mengizinkan semuanya) atau memblokir setiap pemanggilan tool
  (jika kita menolak semuanya) — keduanya tidak sesuai dengan paritas PI.

Harness codex dalam pohon sumber menggunakan pemisahan yang sama: tool OpenClaw yang dijembatani
dibungkus (`extensions/codex/src/app-server/dynamic-tools.ts`) dan
jenis persetujuan native milik codex-app-server sendiri
(`item/commandExecution/requestApproval`,
`item/fileChange/requestApproval`,
`item/permissions/requestApproval`) diarahkan melalui
`plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). Padanan SDK Copilot
— `rejectAllPolicy` yang gagal tertutup untuk jenis non-`custom-tool`
apa pun yang pernah mencapai `onPermissionRequest` — adalah jaring pengaman yang sama,
dan dalam praktiknya tidak terpanggil karena `overridesBuiltInTool: true`
menggeser setiap bawaan.

Agar lapisan tool yang dibungkus dapat membuat keputusan kebijakan yang setara dengan PI,
harness meneruskan konteks tool percobaan PI lengkap ke
`createOpenClawCodingTools` — identitas (`senderIsOwner`,
`memberRoleIds`, `ownerOnlyToolAllowlist`, …), channel/routing
(`groupId`, `currentChannelId`, `replyToMode`, toggle tool pesan),
autentikasi (`authProfileStore`), identitas run
(`sessionKey`/`runSessionKey` yang diturunkan dari `sandboxSessionKey`,
`runId`), konteks model (`modelApi`, `modelContextWindowTokens`,
`modelCompat`, `modelHasVision`), dan hook run (`onToolOutcome`,
`onYield`). Tanpa field tersebut, allowlist khusus pemilik secara diam-diam
berperilaku sebagai tolak-secara-default, kebijakan kepercayaan Plugin tidak dapat
diresolve ke scope yang tepat, dan `session_status: "current"` diresolve ke
kunci sandbox yang usang. Builder bridge berada di
`extensions/copilot/src/tool-bridge.ts` dan mencerminkan panggilan otoritatif PI
di
`src/agents/pi-embedded-runner/run/attempt.ts:1029-1117`. `runAttempt`
sudah meresolve konteks sandbox melalui seam bersama
`resolveSandboxContext`, meneruskan direktori kerja efektif ke SDK,
dan meneruskan `sandbox` beserta workspace spawn subagen ke
bridge tool. Bridge juga meneruskan kontrol konstruksi tool terbatas
yang dapat ditegakkannya pada batas SDK: `includeCoreTools`, allowlist
tool runtime, dan `toolConstructionPlan`.

Bridge juga menggunakan helper surface tool harness bersama dari
`openclaw/plugin-sdk/agent-harness-tool-runtime` untuk paritas PI. Ketika
pencarian tool diaktifkan, SDK melihat tool kontrol ringkas plus eksekutor katalog tersembunyi,
bukan setiap skema tool OpenClaw. Ketika mode kode diaktifkan, helper membangun
surface kontrol mode kode yang sama dan siklus hidup katalog yang digunakan oleh
harness agen lain. Default ramping model lokal, pemfilteran skema yang kompatibel
dengan runtime, hidrasi direktori, dan pembersihan katalog semuanya tetap berada di helper bersama
agar harness Copilot dan harness yang berdekatan dengan Codex tidak menyimpang.

### Token GitHub tingkat sesi

Kontrak SDK Copilot membedakan token GitHub **tingkat klien**
(`CopilotClientOptions.gitHubToken`, digunakan untuk mengautentikasi
proses CLI itu sendiri) dari token **tingkat sesi**
(`SessionConfig.gitHubToken`, yang menentukan pengecualian konten,
routing model, dan kuota untuk sesi tersebut serta dihormati pada
`createSession` dan `resumeSession`). Harness meresolve autentikasi satu kali
melalui `resolveCopilotAuth` dan menyetel kedua field ketika mode autentikasi adalah
`gitHubToken` (`auth.gitHubToken` eksplisit atau
`resolvedApiKey` yang diresolve kontrak dari profil autentikasi `github-copilot`
yang dikonfigurasi). Ketika mode yang diresolve adalah `useLoggedInUser`, field
tingkat sesi dihilangkan sehingga SDK tetap menurunkan identitas dari
identitas yang sedang login.

`ask_user` menggunakan `SessionConfig.onUserInputRequest`. Bridge menerima
indeks atau label pilihan untuk permintaan dengan pilihan tetap, menerima jawaban
bentuk bebas ketika permintaan SDK mengizinkannya, dan membatalkan permintaan yang tertunda
ketika percobaan OpenClaw dibatalkan.

## Terkait

- [Runtime agen](/id/concepts/agent-runtimes)
- [Harness Codex](/id/plugins/codex-harness)
- [Plugin harness agen (referensi SDK)](/id/plugins/sdk-agent-harness)
