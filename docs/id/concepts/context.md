---
read_when:
    - Anda ingin memahami apa arti "konteks" dalam OpenClaw
    - Anda sedang men-debug mengapa model “mengetahui” sesuatu (atau melupakannya)
    - Anda ingin mengurangi overhead konteks (/context, /status, /compact)
summary: 'Konteks: apa yang dilihat model, bagaimana konteks itu dibangun, dan cara memeriksanya'
title: Konteks
x-i18n:
    generated_at: "2026-06-27T17:23:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 900b4a72acf43405a6b7718b93c3b5c8543eb2cc90766298889052c7468e39fb
    source_path: concepts/context.md
    workflow: 16
---

"Konteks" adalah **semua yang dikirim OpenClaw ke model untuk sebuah run**. Ini dibatasi oleh **jendela konteks** model (batas token).

Model mental pemula:

- **Prompt sistem** (dibangun oleh OpenClaw): aturan, alat, daftar Skills, waktu/runtime, dan file workspace yang disuntikkan.
- **Riwayat percakapan**: pesan Anda + pesan asisten untuk sesi ini.
- **Panggilan/hasil alat + lampiran**: output perintah, pembacaan file, gambar/audio, dll.

Konteks _tidak sama_ dengan "memori": memori dapat disimpan di disk dan dimuat ulang nanti; konteks adalah apa yang ada di dalam jendela model saat ini.

## Mulai cepat (memeriksa konteks)

- `/status` → tampilan cepat "seberapa penuh jendela saya?" + pengaturan sesi.
- `/context list` → apa yang disuntikkan + ukuran perkiraan (per file + total).
- `/context detail` → rincian lebih dalam: ukuran per file, per skema alat, per entri Skills, ukuran prompt sistem, dan jumlah pesan transkrip yang dapat dipadatkan.
- `/context map` → gambar treemap bergaya WinDirStat dari kontributor konteks terlacak sesi saat ini.
- `/usage tokens` → tambahkan footer penggunaan per balasan ke balasan normal.
- `/compact` → ringkas riwayat lama menjadi entri padat untuk mengosongkan ruang jendela.

Lihat juga: [Perintah slash](/id/tools/slash-commands), [Penggunaan token & biaya](/id/reference/token-use), [Compaction](/id/concepts/compaction).

## Contoh output

Nilai bervariasi berdasarkan model, penyedia, kebijakan alat, dan apa yang ada di workspace Anda.

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

### `/context map`

Mengirim gambar yang dibuat dari laporan run cache terbaru. Sebelum pesan normal menghasilkan laporan run dalam sesi, `/context map` mengembalikan pesan tidak tersedia alih-alih merender estimasi. Luas persegi panjang sebanding dengan karakter prompt yang terlacak:

- file workspace yang disuntikkan
- teks prompt sistem dasar
- entri prompt Skills
- skema JSON alat

`/context list`, `/context detail`, dan `/context json` tetap dapat memeriksa estimasi sesuai permintaan ketika tidak ada laporan run yang di-cache.

## Apa yang dihitung terhadap jendela konteks

Semua yang diterima model dihitung, termasuk:

- Prompt sistem (semua bagian).
- Riwayat percakapan.
- Panggilan alat + hasil alat.
- Lampiran/transkrip (gambar/audio/file).
- Ringkasan Compaction dan artefak pemangkasan.
- "Pembungkus" penyedia atau header tersembunyi (tidak terlihat, tetap dihitung).

## Cara OpenClaw membangun prompt sistem

Prompt sistem **dimiliki OpenClaw** dan dibangun ulang pada setiap run. Ini mencakup:

- Daftar alat + deskripsi singkat.
- Daftar Skills (hanya metadata; lihat di bawah).
- Lokasi workspace.
- Waktu (UTC + waktu pengguna yang dikonversi jika dikonfigurasi).
- Metadata runtime (host/OS/model/thinking).
- File bootstrap workspace yang disuntikkan di bawah **Konteks Proyek**.

Rincian lengkap: [Prompt Sistem](/id/concepts/system-prompt).

## File workspace yang disuntikkan (Konteks Proyek)

Secara default, OpenClaw menyuntikkan sekumpulan tetap file workspace (jika ada):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (hanya run pertama)

File besar dipotong per file menggunakan `agents.defaults.bootstrapMaxChars` (default `20000` karakter). OpenClaw juga menerapkan batas total injeksi bootstrap lintas file dengan `agents.defaults.bootstrapTotalMaxChars` (default `60000` karakter). `/context` menampilkan ukuran **mentah vs disuntikkan** dan apakah pemotongan terjadi.

Ketika pemotongan terjadi, runtime dapat menyuntikkan blok peringatan dalam prompt di bawah Konteks Proyek. Konfigurasikan ini dengan `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; default `always`).

## Skills: disuntikkan vs dimuat sesuai permintaan

Prompt sistem mencakup **daftar Skills** yang ringkas (nama + deskripsi + lokasi). Daftar ini memiliki overhead nyata.

Instruksi Skills _tidak_ disertakan secara default. Model diharapkan untuk `read` `SKILL.md` milik Skills **hanya saat diperlukan**.

## Alat: ada dua biaya

Alat memengaruhi konteks dengan dua cara:

1. **Teks daftar alat** dalam prompt sistem (yang Anda lihat sebagai "Tooling").
2. **Skema alat** (JSON). Ini dikirim ke model agar model dapat memanggil alat. Skema ini dihitung terhadap konteks meskipun Anda tidak melihatnya sebagai teks biasa.

`/context detail` merinci skema alat terbesar sehingga Anda dapat melihat apa yang mendominasi.

## Perintah, arahan, dan "pintasan inline"

Perintah slash ditangani oleh Gateway. Ada beberapa perilaku berbeda:

- **Perintah mandiri**: pesan yang hanya berisi `/...` berjalan sebagai perintah.
- **Arahan**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` dihapus sebelum model melihat pesan.
  - Pesan yang hanya berisi arahan mempertahankan pengaturan sesi.
  - Arahan inline dalam pesan normal bertindak sebagai petunjuk per pesan.
- **Pintasan inline** (hanya pengirim dalam allowlist): token `/...` tertentu di dalam pesan normal dapat langsung berjalan (contoh: "hey /status"), dan dihapus sebelum model melihat teks yang tersisa.

Detail: [Perintah slash](/id/tools/slash-commands).

## Sesi, Compaction, dan pemangkasan (apa yang bertahan)

Apa yang bertahan lintas pesan bergantung pada mekanismenya:

- **Riwayat normal** bertahan dalam transkrip sesi sampai dipadatkan/dipangkas oleh kebijakan.
- **Compaction** mempertahankan ringkasan ke dalam transkrip dan menjaga pesan terbaru tetap utuh.
- **Pemangkasan** menghapus hasil alat lama dari prompt _dalam memori_ untuk mengosongkan ruang jendela konteks, tetapi tidak menulis ulang transkrip sesi - riwayat lengkap tetap dapat diperiksa di disk.

Dokumentasi: [Sesi](/id/concepts/session), [Compaction](/id/concepts/compaction), [Pemangkasan sesi](/id/concepts/session-pruning).

Secara default, OpenClaw menggunakan mesin konteks `legacy` bawaan untuk perakitan dan
Compaction. Jika Anda menginstal plugin yang menyediakan `kind: "context-engine"` dan
memilihnya dengan `plugins.slots.contextEngine`, OpenClaw mendelegasikan perakitan
konteks, `/compact`, dan hook siklus hidup konteks subagen terkait ke mesin tersebut.
`ownsCompaction: false` tidak otomatis fallback ke mesin `legacy`; mesin aktif tetap
harus mengimplementasikan `compact()` dengan benar. Lihat [Mesin Konteks](/id/concepts/context-engine)
untuk antarmuka pluggable lengkap, hook siklus hidup, dan konfigurasi.

## Apa yang sebenarnya dilaporkan `/context`

`/context` lebih memilih laporan prompt sistem **yang dibangun run** terbaru saat tersedia:

- `System prompt (run)` = diambil dari run tertanam (mampu menggunakan alat) terakhir dan dipertahankan dalam penyimpanan sesi.
- `System prompt (estimate)` = dihitung saat itu juga ketika tidak ada laporan run (atau ketika berjalan melalui backend CLI yang tidak menghasilkan laporan tersebut).

Dalam kedua kasus, ini melaporkan ukuran dan kontributor teratas; ini **tidak** mencurahkan prompt sistem lengkap atau skema alat. Dalam mode detail, ini juga membandingkan transkrip sesi dengan predikat pesan percakapan nyata yang sama yang digunakan oleh Compaction, sehingga penggunaan prompt/cache yang tinggi lebih mudah dibedakan dari riwayat percakapan yang dapat dipadatkan.

## Terkait

<CardGroup cols={2}>
  <Card title="Mesin konteks" href="/id/concepts/context-engine" icon="puzzle-piece">
    Injeksi konteks kustom melalui plugin.
  </Card>
  <Card title="Compaction" href="/id/concepts/compaction" icon="compress">
    Meringkas percakapan panjang agar tetap berada di dalam jendela model.
  </Card>
  <Card title="Prompt sistem" href="/id/concepts/system-prompt" icon="message-lines">
    Cara prompt sistem dibangun dan apa yang disuntikkannya pada setiap giliran.
  </Card>
  <Card title="Loop agen" href="/id/concepts/agent-loop" icon="arrows-rotate">
    Siklus eksekusi agen lengkap dari pesan masuk hingga balasan akhir.
  </Card>
</CardGroup>
