---
x-i18n:
    generated_at: "2026-04-08T02:17:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e156cc8e2fe946a0423862f937754a7caa1fe7e6863b50a80bff49a1c86e1e8
    source_path: refactor/qa.md
    workflow: 15
---

# Refaktor QA

Status: migrasi fondasional telah diterapkan.

## Tujuan

Pindahkan QA OpenClaw dari model definisi terpisah ke satu sumber kebenaran:

- metadata skenario
- prompt yang dikirim ke model
- setup dan teardown
- logika harness
- assertion dan kriteria keberhasilan
- artefak dan petunjuk laporan

Keadaan akhir yang diinginkan adalah harness QA generik yang memuat file definisi skenario yang kuat alih-alih meng-hardcode sebagian besar perilaku di TypeScript.

## Kondisi Saat Ini

Sumber kebenaran utama sekarang berada di `qa/scenarios.md`.

Yang sudah diimplementasikan:

- `qa/scenarios.md`
  - paket QA kanonis
  - identitas operator
  - misi kickoff
  - metadata skenario
  - binding handler
- `extensions/qa-lab/src/scenario-catalog.ts`
  - parser paket markdown + validasi zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - rendering rencana dari paket markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - menanam file kompatibilitas yang dihasilkan plus `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - memilih skenario yang dapat dieksekusi melalui binding handler yang didefinisikan di markdown
- Protokol bus QA + UI
  - attachment inline generik untuk rendering image/video/audio/file

Permukaan terpisah yang masih tersisa:

- `extensions/qa-lab/src/suite.ts`
  - masih memiliki sebagian besar logika handler kustom yang dapat dieksekusi
- `extensions/qa-lab/src/report.ts`
  - masih menurunkan struktur laporan dari output runtime

Jadi pemisahan sumber kebenaran sudah diperbaiki, tetapi eksekusi masih sebagian besar didukung handler, belum sepenuhnya deklaratif.

## Seperti Apa Permukaan Skenario Nyata

Membaca suite saat ini menunjukkan beberapa kelas skenario yang berbeda.

### Interaksi sederhana

- baseline channel
- baseline DM
- tindak lanjut ber-thread
- pergantian model
- kelanjutan approval
- reaction/edit/delete

### Mutasi config dan runtime

- menonaktifkan skill dengan patch config
- config apply restart wake-up
- pembalikan kapabilitas saat restart config
- pemeriksaan drift inventaris runtime

### Assertion filesystem dan repo

- laporan penemuan source/docs
- build Lobster Invaders
- pencarian artefak gambar yang dihasilkan

### Orkestrasi memori

- memory recall
- tool memori dalam konteks channel
- fallback kegagalan memori
- pemeringkatan memori sesi
- isolasi memori thread
- memory dreaming sweep

### Integrasi tool dan plugin

- panggilan MCP plugin-tools
- visibilitas skill
- hot install skill
- pembuatan gambar native
- image roundtrip
- pemahaman gambar dari attachment

### Multi-turn dan multi-aktor

- handoff subagent
- sintesis fanout subagent
- alur bergaya pemulihan restart

Kategori ini penting karena mendorong kebutuhan DSL. Daftar datar prompt + teks yang diharapkan saja tidak cukup.

## Arah

### Satu sumber kebenaran

Gunakan `qa/scenarios.md` sebagai sumber kebenaran yang ditulis.

Paket tersebut harus tetap:

- mudah dibaca manusia dalam review
- dapat di-parse mesin
- cukup kaya untuk mendorong:
  - eksekusi suite
  - bootstrap workspace QA
  - metadata UI QA Lab
  - prompt docs/discovery
  - pembuatan laporan

### Format penulisan yang disukai

Gunakan markdown sebagai format tingkat atas, dengan YAML terstruktur di dalamnya.

Bentuk yang direkomendasikan:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - refs docs
  - refs code
  - override model/provider
  - prerequisite
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

- keterbacaan PR yang lebih baik daripada JSON besar
- konteks yang lebih kaya daripada YAML murni
- parsing ketat dan validasi zod

JSON mentah dapat diterima hanya sebagai bentuk perantara yang dihasilkan.

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

## Kapabilitas Runner yang Harus Dicakup DSL

Berdasarkan suite saat ini, runner generik membutuhkan lebih dari sekadar eksekusi prompt.

### Action environment dan setup

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Action giliran agen

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Action config dan runtime

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Action file dan artefak

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Action memori dan cron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### Action MCP

- `mcp.callTool`

### Assertion

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

## Variabel dan Referensi Artefak

DSL harus mendukung output yang disimpan dan referensi berikutnya.

Contoh dari suite saat ini:

- buat thread, lalu gunakan kembali `threadId`
- buat sesi, lalu gunakan kembali `sessionKey`
- hasilkan gambar, lalu lampirkan file pada giliran berikutnya
- hasilkan string wake marker, lalu assert bahwa string itu muncul nanti

Kapabilitas yang dibutuhkan:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- referensi bertipe untuk path, key sesi, ID thread, marker, output tool

Tanpa dukungan variabel, harness akan terus membocorkan logika skenario kembali ke TypeScript.

## Apa yang Harus Tetap Menjadi Escape Hatch

Runner deklaratif yang sepenuhnya murni tidak realistis pada fase 1.

Beberapa skenario memang secara inheren berat pada orkestrasi:

- memory dreaming sweep
- config apply restart wake-up
- pembalikan kapabilitas saat restart config
- resolusi artefak gambar yang dihasilkan berdasarkan timestamp/path
- evaluasi discovery-report

Untuk saat ini, skenario ini harus menggunakan handler kustom eksplisit.

Aturan yang direkomendasikan:

- 85-90% deklaratif
- `customHandler` steps eksplisit untuk sisa yang sulit
- hanya handler kustom yang bernama dan terdokumentasi
- tidak ada kode inline anonim dalam file skenario

Itu menjaga engine generik tetap bersih sambil tetap memungkinkan kemajuan.

## Perubahan Arsitektur

### Saat Ini

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

### Fase 1: loader dan schema

Selesai.

- menambahkan `qa/scenarios.md`
- menambahkan parser untuk konten paket YAML markdown bernama
- memvalidasi dengan zod
- mengalihkan consumer ke paket yang sudah di-parse
- menghapus `qa/seed-scenarios.json` dan `qa/QA_KICKOFF_TASK.md` tingkat repo

### Fase 2: engine generik

- pecah `extensions/qa-lab/src/suite.ts` menjadi:
  - loader
  - engine
  - registry action
  - registry assertion
  - handler kustom
- pertahankan fungsi helper yang ada sebagai operasi engine

Hasil kerja:

- engine mengeksekusi skenario deklaratif sederhana

Mulai dengan skenario yang sebagian besar berupa prompt + wait + assert:

- tindak lanjut ber-thread
- pemahaman gambar dari attachment
- visibilitas dan pemanggilan skill
- baseline channel

Hasil kerja:

- skenario nyata pertama yang didefinisikan di markdown dikirim melalui engine generik

### Fase 4: migrasikan skenario tingkat menengah

- image generation roundtrip
- tool memori dalam konteks channel
- pemeringkatan memori sesi
- handoff subagent
- sintesis fanout subagent

Hasil kerja:

- variabel, artefak, assertion tool, assertion request-log terbukti berjalan

### Fase 5: pertahankan skenario sulit pada handler kustom

- memory dreaming sweep
- config apply restart wake-up
- pembalikan kapabilitas saat restart config
- runtime inventory drift

Hasil kerja:

- format penulisan yang sama, tetapi dengan blok custom-step eksplisit bila diperlukan

### Fase 6: hapus peta skenario yang di-hardcode

Setelah cakupan paket cukup baik:

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

### Mengapa generik terlebih dahulu

Jangan membangun model media yang khusus Slack saja.

Sebaliknya:

- satu model transport QA generik
- beberapa renderer di atasnya
  - chat QA Lab saat ini
  - web Slack palsu di masa depan
  - tampilan transport palsu lainnya

Ini mencegah logika duplikat dan memungkinkan skenario media tetap agnostik terhadap transport.

### Pekerjaan UI yang dibutuhkan

Perbarui UI QA agar merender:

- pratinjau gambar inline
- pemutar audio inline
- pemutar video inline
- chip attachment file

UI saat ini sudah dapat merender thread dan reaction, jadi rendering attachment seharusnya dapat dilapiskan ke model kartu pesan yang sama.

### Pekerjaan skenario yang dimungkinkan oleh transport media

Setelah attachment mengalir melalui bus QA, kita dapat menambahkan skenario fake-chat yang lebih kaya:

- balasan gambar inline di fake Slack
- pemahaman attachment audio
- pemahaman attachment video
- urutan attachment campuran
- balasan thread dengan media tetap dipertahankan

## Rekomendasi

Bagian implementasi berikutnya seharusnya adalah:

1. tambahkan loader skenario markdown + schema zod
2. hasilkan katalog saat ini dari markdown
3. migrasikan beberapa skenario sederhana terlebih dahulu
4. tambahkan dukungan attachment bus QA generik
5. render gambar inline di UI QA
6. lalu perluas ke audio dan video

Ini adalah jalur terkecil yang membuktikan kedua tujuan:

- QA generik yang didefinisikan di markdown
- permukaan messaging palsu yang lebih kaya

## Pertanyaan Terbuka

- apakah file skenario sebaiknya mengizinkan template prompt markdown tertanam dengan interpolasi variabel
- apakah setup/cleanup sebaiknya berupa bagian bernama atau hanya daftar action berurutan
- apakah referensi artefak sebaiknya bertipe kuat di schema atau berbasis string
- apakah handler kustom sebaiknya berada dalam satu registry atau registry per-surface
- apakah file kompatibilitas JSON yang dihasilkan sebaiknya tetap dicentang selama migrasi
