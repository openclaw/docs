---
x-i18n:
    generated_at: "2026-04-18T09:06:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: dbb2c70c82da7f6f12d90e25666635ff4147c52e8a94135e902d1de4f5cbccca
    source_path: refactor/qa.md
    workflow: 15
---

# Refaktor QA

Status: migrasi fondasional telah diterapkan.

## Tujuan

Pindahkan QA OpenClaw dari model definisi terpisah ke satu sumber kebenaran tunggal:

- metadata skenario
- prompt yang dikirim ke model
- setup dan teardown
- logika harness
- asersi dan kriteria keberhasilan
- artefak dan petunjuk laporan

Keadaan akhir yang diinginkan adalah harness QA generik yang memuat file definisi skenario yang kuat alih-alih meng-hardcode sebagian besar perilaku di TypeScript.

## Status Saat Ini

Sumber kebenaran utama sekarang berada di `qa/scenarios/index.md` ditambah satu file per
skenario di bawah `qa/scenarios/<theme>/*.md`.

Sudah diimplementasikan:

- `qa/scenarios/index.md`
  - metadata paket QA kanonis
  - identitas operator
  - misi kickoff
- `qa/scenarios/<theme>/*.md`
  - satu file markdown per skenario
  - metadata skenario
  - binding handler
  - konfigurasi eksekusi khusus skenario
- `extensions/qa-lab/src/scenario-catalog.ts`
  - parser paket markdown + validasi zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - rendering rencana dari paket markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - mengisi file kompatibilitas yang dihasilkan plus `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - memilih skenario yang dapat dieksekusi melalui binding handler yang didefinisikan markdown
- Protokol bus QA + UI
  - lampiran inline generik untuk rendering gambar/video/audio/file

Permukaan terpisah yang masih tersisa:

- `extensions/qa-lab/src/suite.ts`
  - masih memiliki sebagian besar logika handler kustom yang dapat dieksekusi
- `extensions/qa-lab/src/report.ts`
  - masih menurunkan struktur laporan dari output runtime

Jadi pemisahan sumber kebenaran sudah diperbaiki, tetapi eksekusi masih sebagian besar didukung handler alih-alih sepenuhnya deklaratif.

## Seperti Apa Permukaan Skenario Nyata

Membaca suite saat ini menunjukkan beberapa kelas skenario yang berbeda.

### Interaksi sederhana

- baseline channel
- baseline DM
- tindak lanjut ber-thread
- pergantian model
- approval followthrough
- reaction/edit/delete

### Mutasi config dan runtime

- penonaktifan skill lewat patch config
- bangun ulang setelah apply config
- perubahan kapabilitas setelah restart config
- pemeriksaan drift inventaris runtime

### Asersi filesystem dan repo

- laporan penemuan source/docs
- build Lobster Invaders
- pencarian artefak gambar yang dihasilkan

### Orkestrasi memory

- recall memory
- tools memory dalam konteks channel
- fallback kegagalan memory
- ranking memory sesi
- isolasi memory thread
- sapuan Dreaming memory

### Integrasi tool dan Plugin

- pemanggilan MCP plugin-tools
- visibilitas skill
- hot install skill
- pembuatan gambar native
- image roundtrip
- pemahaman gambar dari lampiran

### Multi-turn dan multi-aktor

- handoff subagent
- sintesis fanout subagent
- alur gaya pemulihan setelah restart

Kategori-kategori ini penting karena mendorong kebutuhan DSL. Daftar datar berisi prompt + teks yang diharapkan saja tidak cukup.

## Arah

### Satu sumber kebenaran

Gunakan `qa/scenarios/index.md` plus `qa/scenarios/<theme>/*.md` sebagai sumber kebenaran yang ditulis.

Paket tersebut harus tetap:

- mudah dibaca manusia saat review
- dapat di-parse oleh mesin
- cukup kaya untuk menggerakkan:
  - eksekusi suite
  - bootstrap workspace QA
  - metadata UI QA Lab
  - prompt docs/discovery
  - pembuatan laporan

### Format penulisan yang disarankan

Gunakan markdown sebagai format tingkat atas, dengan YAML terstruktur di dalamnya.

Bentuk yang direkomendasikan:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - override model/provider
  - prasyarat
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

- keterbacaan PR yang lebih baik dibanding JSON besar
- konteks yang lebih kaya dibanding YAML murni
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

## Kapabilitas Runner yang Harus Dicakup DSL

Berdasarkan suite saat ini, runner generik memerlukan lebih dari sekadar eksekusi prompt.

### Tindakan environment dan setup

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Tindakan giliran agen

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Tindakan config dan runtime

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Tindakan file dan artefak

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Tindakan memory dan Cron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### Tindakan MCP

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

## Variabel dan Referensi Artefak

DSL harus mendukung output yang disimpan dan referensi berikutnya.

Contoh dari suite saat ini:

- membuat thread, lalu menggunakan kembali `threadId`
- membuat sesi, lalu menggunakan kembali `sessionKey`
- menghasilkan gambar, lalu melampirkan file pada giliran berikutnya
- menghasilkan string penanda bangun, lalu memastikan string itu muncul nanti

Kapabilitas yang dibutuhkan:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- referensi bertipe untuk path, key sesi, id thread, marker, output tool

Tanpa dukungan variabel, harness akan terus membocorkan logika skenario kembali ke TypeScript.

## Apa yang Harus Tetap Menjadi Escape Hatch

Runner deklaratif yang sepenuhnya murni tidak realistis pada fase 1.

Beberapa skenario pada dasarnya berat dalam orkestrasi:

- sapuan Dreaming memory
- bangun ulang setelah apply config
- perubahan kapabilitas setelah restart config
- resolusi artefak gambar yang dihasilkan berdasarkan timestamp/path
- evaluasi discovery-report

Untuk sementara, skenario-skenario ini harus menggunakan handler kustom eksplisit.

Aturan yang direkomendasikan:

- 85-90% deklaratif
- langkah `customHandler` eksplisit untuk sisa yang sulit
- hanya handler kustom yang bernama dan terdokumentasi
- tidak ada kode inline anonim di file skenario

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

- workspace yang di-seed masih menyertakan `QA_KICKOFF_TASK.md`
- workspace yang di-seed masih menyertakan `QA_SCENARIO_PLAN.md`
- workspace yang di-seed sekarang juga menyertakan `QA_SCENARIOS.md`

## Rencana Refaktor

### Fase 1: loader dan skema

Selesai.

- menambahkan `qa/scenarios/index.md`
- memecah skenario ke `qa/scenarios/<theme>/*.md`
- menambahkan parser untuk konten paket markdown YAML bernama
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

Hasil akhir:

- engine mengeksekusi skenario deklaratif sederhana

Mulai dengan skenario yang sebagian besar berupa prompt + tunggu + asersi:

- tindak lanjut ber-thread
- pemahaman gambar dari lampiran
- visibilitas dan pemanggilan skill
- baseline channel

Hasil akhir:

- skenario nyata pertama yang didefinisikan markdown dirilis melalui engine generik

### Fase 4: migrasikan skenario tingkat menengah

- image generation roundtrip
- tools memory dalam konteks channel
- ranking memory sesi
- handoff subagent
- sintesis fanout subagent

Hasil akhir:

- variabel, artefak, asersi tool, asersi request-log terbukti berjalan

### Fase 5: pertahankan skenario sulit pada handler kustom

- sapuan Dreaming memory
- bangun ulang setelah apply config
- perubahan kapabilitas setelah restart config
- drift inventaris runtime

Hasil akhir:

- format penulisan yang sama, tetapi dengan blok custom-step eksplisit jika diperlukan

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

Bus ini belum memodelkan lampiran media inline.

### Kontrak transport yang dibutuhkan

Tambahkan model lampiran bus QA generik:

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

Jangan membangun model media khusus Slack.

Sebagai gantinya:

- satu model transport QA generik
- beberapa renderer di atasnya
  - chat QA Lab saat ini
  - web fake Slack di masa mendatang
  - tampilan transport palsu lainnya

Ini mencegah duplikasi logika dan memungkinkan skenario media tetap agnostik terhadap transport.

### Pekerjaan UI yang dibutuhkan

Perbarui UI QA agar merender:

- pratinjau gambar inline
- pemutar audio inline
- pemutar video inline
- chip lampiran file

UI saat ini sudah dapat merender thread dan reaction, jadi rendering lampiran seharusnya dapat dilapiskan ke model kartu pesan yang sama.

### Pekerjaan skenario yang dimungkinkan oleh transport media

Setelah lampiran mengalir melalui bus QA, kita dapat menambahkan skenario fake-chat yang lebih kaya:

- balasan gambar inline di fake Slack
- pemahaman lampiran audio
- pemahaman lampiran video
- urutan lampiran campuran
- balasan thread dengan media tetap dipertahankan

## Rekomendasi

Bagian implementasi berikutnya sebaiknya adalah:

1. tambahkan loader skenario markdown + skema zod
2. hasilkan katalog saat ini dari markdown
3. migrasikan beberapa skenario sederhana terlebih dahulu
4. tambahkan dukungan lampiran bus QA generik
5. render gambar inline di UI QA
6. lalu perluas ke audio dan video

Ini adalah jalur terkecil yang membuktikan kedua tujuan:

- QA generik yang didefinisikan markdown
- permukaan pesan palsu yang lebih kaya

## Pertanyaan Terbuka

- apakah file skenario sebaiknya mengizinkan template prompt markdown tertanam dengan interpolasi variabel
- apakah setup/cleanup sebaiknya berupa bagian bernama atau hanya daftar tindakan berurutan
- apakah referensi artefak sebaiknya bertipe kuat dalam skema atau berbasis string
- apakah handler kustom sebaiknya berada dalam satu registry atau registry per-surface
- apakah file kompatibilitas JSON yang dihasilkan sebaiknya tetap di-check in selama migrasi
