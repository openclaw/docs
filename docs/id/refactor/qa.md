---
read_when:
    - Melakukan refaktor definisi skenario QA atau kode harness qa-lab
    - Memindahkan perilaku QA antara skenario markdown dan logika harness TypeScript
summary: Rencana refaktor QA untuk konsolidasi katalog skenario dan harness
title: Refaktor QA
x-i18n:
    generated_at: "2026-04-24T09:25:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d774d7b5e0fffd5c2504d9a4d6063198d77b866263ea8448474dce6246012d4
    source_path: refactor/qa.md
    workflow: 15
---

Status: migrasi fondasional telah diterapkan.

## Tujuan

Pindahkan QA OpenClaw dari model definisi-terpisah ke satu sumber kebenaran:

- metadata skenario
- prompt yang dikirim ke model
- setup dan teardown
- logika harness
- asersi dan kriteria keberhasilan
- artifact dan petunjuk laporan

Kondisi akhir yang diinginkan adalah harness QA generik yang memuat file definisi skenario yang kuat alih-alih meng-hardcode sebagian besar perilaku di TypeScript.

## Status Saat Ini

Sumber kebenaran utama sekarang berada di `qa/scenarios/index.md` plus satu file per
skenario di bawah `qa/scenarios/<theme>/*.md`.

Yang sudah diimplementasikan:

- `qa/scenarios/index.md`
  - metadata pack QA kanonis
  - identitas operator
  - misi kickoff
- `qa/scenarios/<theme>/*.md`
  - satu file markdown per skenario
  - metadata skenario
  - binding handler
  - config eksekusi khusus skenario
- `extensions/qa-lab/src/scenario-catalog.ts`
  - parser pack markdown + validasi zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - rendering rencana dari pack markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - menanam file kompatibilitas yang dihasilkan plus `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - memilih skenario yang dapat dieksekusi melalui binding handler yang didefinisikan di markdown
- Protokol bus QA + UI
  - attachment inline generik untuk rendering gambar/video/audio/file

Permukaan terpisah yang masih tersisa:

- `extensions/qa-lab/src/suite.ts`
  - masih memiliki sebagian besar logika handler kustom yang dapat dieksekusi
- `extensions/qa-lab/src/report.ts`
  - masih menurunkan struktur laporan dari output runtime

Jadi pemisahan sumber kebenaran sudah diperbaiki, tetapi eksekusi masih sebagian besar didukung handler, belum sepenuhnya deklaratif.

## Seperti Apa Permukaan Skenario Nyata Itu

Membaca suite saat ini menunjukkan beberapa kelas skenario yang berbeda.

### Interaksi sederhana

- baseline channel
- baseline DM
- tindak lanjut ber-thread
- pergantian model
- tindak lanjut persetujuan
- reaction/edit/delete

### Mutasi config dan runtime

- config patch skill disable
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift check

### Asersi filesystem dan repo

- source/docs discovery report
- build Lobster Invaders
- generated image artifact lookup

### Orkestrasi memori

- memory recall
- memory tools in channel context
- memory failure fallback
- session memory ranking
- thread memory isolation
- memory dreaming sweep

### Integrasi alat dan Plugin

- MCP plugin-tools call
- skill visibility
- skill hot install
- native image generation
- image roundtrip
- image understanding from attachment

### Multi-turn dan multi-actor

- subagent handoff
- subagent fanout synthesis
- restart recovery style flows

Kategori ini penting karena mendorong kebutuhan DSL. Daftar datar berisi prompt + teks yang diharapkan saja tidak cukup.

## Arah

### Satu sumber kebenaran

Gunakan `qa/scenarios/index.md` plus `qa/scenarios/<theme>/*.md` sebagai
sumber kebenaran yang ditulis.

Pack harus tetap:

- mudah dibaca manusia saat review
- dapat diparse mesin
- cukup kaya untuk mendorong:
  - eksekusi suite
  - bootstrap workspace QA
  - metadata UI QA Lab
  - prompt docs/discovery
  - pembuatan laporan

### Format authoring yang disukai

Gunakan markdown sebagai format tingkat atas, dengan YAML terstruktur di dalamnya.

Bentuk yang direkomendasikan:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - model/provider overrides
  - prerequisites
- bagian prosa
  - objective
  - notes
  - debugging hints
- blok YAML berpagar
  - setup
  - steps
  - assertions
  - cleanup

Ini memberikan:

- keterbacaan PR yang lebih baik daripada JSON raksasa
- konteks yang lebih kaya daripada YAML murni
- parsing ketat dan validasi zod

JSON mentah hanya dapat diterima sebagai bentuk hasil generate perantara.

## Bentuk File Skenario yang Diusulkan

Contoh:

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Objective

Verify generated media is reattached on the follow-up turn.

# Setup

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Steps

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## Kemampuan Runner yang Harus Dicakup DSL

Berdasarkan suite saat ini, runner generik memerlukan lebih dari sekadar eksekusi prompt.

### Aksi environment dan setup

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Aksi giliran agen

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Aksi config dan runtime

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Aksi file dan artifact

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Aksi memori dan Cron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### Aksi MCP

- `mcp.callTool`

### Asersi

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## Variabel dan Referensi Artifact

DSL harus mendukung output yang disimpan dan referensi berikutnya.

Contoh dari suite saat ini:

- buat thread, lalu gunakan kembali `threadId`
- buat session, lalu gunakan kembali `sessionKey`
- hasilkan gambar, lalu lampirkan file pada giliran berikutnya
- hasilkan string penanda wake, lalu pastikan string itu muncul nanti

Kemampuan yang dibutuhkan:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- referensi bertipe untuk path, kunci session, id thread, penanda, output alat

Tanpa dukungan variabel, harness akan terus membocorkan logika skenario kembali ke TypeScript.

## Apa yang Harus Tetap Menjadi Escape Hatch

Runner deklaratif yang sepenuhnya murni tidak realistis pada fase 1.

Beberapa skenario secara inheren berat di orkestrasi:

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- generated image artifact resolution by timestamp/path
- discovery-report evaluation

Untuk saat ini, ini harus menggunakan handler kustom yang eksplisit.

Aturan yang direkomendasikan:

- 85-90% deklaratif
- langkah `customHandler` eksplisit untuk sisa yang sulit
- hanya handler kustom yang bernama dan terdokumentasi
- tidak ada kode inline anonim di file skenario

Itu menjaga engine generik tetap bersih sambil tetap memungkinkan kemajuan.

## Perubahan Arsitektur

### Saat ini

Markdown skenario sudah menjadi sumber kebenaran untuk:

- eksekusi suite
- file bootstrap workspace
- katalog skenario UI QA Lab
- metadata laporan
- prompt discovery

Kompatibilitas yang dihasilkan:

- workspace yang ditanam masih menyertakan `QA_KICKOFF_TASK.md`
- workspace yang ditanam masih menyertakan `QA_SCENARIO_PLAN.md`
- workspace yang ditanam sekarang juga menyertakan `QA_SCENARIOS.md`

## Rencana Refaktor

### Fase 1: loader dan skema

Selesai.

- menambahkan `qa/scenarios/index.md`
- memisahkan skenario ke `qa/scenarios/<theme>/*.md`
- menambahkan parser untuk konten pack YAML markdown bernama
- memvalidasi dengan zod
- mengganti consumer ke pack yang sudah diparse
- menghapus `qa/seed-scenarios.json` dan `qa/QA_KICKOFF_TASK.md` tingkat repo

### Fase 2: engine generik

- pecah `extensions/qa-lab/src/suite.ts` menjadi:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- pertahankan fungsi helper yang ada sebagai operasi engine

Hasil yang dikirim:

- engine mengeksekusi skenario deklaratif sederhana

Mulai dengan skenario yang sebagian besar berupa prompt + wait + assert:

- threaded follow-up
- image understanding from attachment
- skill visibility and invocation
- channel baseline

Hasil yang dikirim:

- skenario nyata pertama yang didefinisikan di markdown dikirim melalui engine generik

### Fase 4: migrasikan skenario tingkat menengah

- image generation roundtrip
- memory tools in channel context
- session memory ranking
- subagent handoff
- subagent fanout synthesis

Hasil yang dikirim:

- variabel, artifact, asersi alat, asersi request-log terbukti berhasil

### Fase 5: pertahankan skenario sulit pada handler kustom

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift

Hasil yang dikirim:

- format authoring yang sama, tetapi dengan blok custom-step eksplisit bila diperlukan

### Fase 6: hapus map skenario yang di-hardcode

Setelah cakupan pack cukup baik:

- hapus sebagian besar percabangan TypeScript khusus skenario dari `extensions/qa-lab/src/suite.ts`

## Dukungan Fake Slack / Rich Media

Bus QA saat ini berfokus pada teks.

File yang relevan:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Saat ini bus QA mendukung:

- teks
- reaction
- thread

Bus ini belum memodelkan attachment media inline.

### Kontrak transport yang dibutuhkan

Tambahkan model attachment bus QA generik:

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

Lalu tambahkan `attachments?: QaBusAttachment[]` ke:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Mengapa generik lebih dulu

Jangan membangun model media khusus Slack.

Sebaliknya:

- satu model transport QA generik
- beberapa renderer di atasnya
  - chat QA Lab saat ini
  - fake Slack web di masa depan
  - tampilan transport palsu lainnya

Ini mencegah logika duplikat dan memungkinkan skenario media tetap agnostik terhadap transport.

### Pekerjaan UI yang dibutuhkan

Perbarui UI QA agar merender:

- pratinjau gambar inline
- pemutar audio inline
- pemutar video inline
- chip attachment file

UI saat ini sudah dapat merender thread dan reaction, jadi rendering attachment seharusnya dapat dilapis pada model kartu pesan yang sama.

### Pekerjaan skenario yang diaktifkan oleh transport media

Setelah attachment mengalir melalui bus QA, kita dapat menambahkan skenario fake-chat yang lebih kaya:

- balasan gambar inline di fake Slack
- pemahaman attachment audio
- pemahaman attachment video
- urutan attachment campuran
- balasan thread dengan media yang dipertahankan

## Rekomendasi

Potongan implementasi berikutnya seharusnya adalah:

1. tambahkan loader skenario markdown + skema zod
2. hasilkan katalog saat ini dari markdown
3. migrasikan beberapa skenario sederhana terlebih dahulu
4. tambahkan dukungan attachment bus QA generik
5. render gambar inline di UI QA
6. lalu perluas ke audio dan video

Ini adalah jalur terkecil yang membuktikan kedua tujuan:

- QA generik yang didefinisikan dengan markdown
- permukaan pesan palsu yang lebih kaya

## Pertanyaan Terbuka

- apakah file skenario harus mengizinkan template prompt markdown tersemat dengan interpolasi variabel
- apakah setup/cleanup harus berupa bagian bernama atau hanya daftar aksi berurutan
- apakah referensi artifact harus bertipe kuat dalam skema atau berbasis string
- apakah handler kustom harus berada dalam satu registry atau registry per-surface
- apakah file kompatibilitas JSON yang dihasilkan harus tetap di-check-in selama migrasi

## Terkait

- [Otomatisasi QA E2E](/id/concepts/qa-e2e-automation)
