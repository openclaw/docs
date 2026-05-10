---
read_when:
    - Anda ingin memahami apa arti "konteks" dalam OpenClaw
    - Anda sedang men-debug mengapa model "mengetahui" sesuatu (atau melupakannya)
    - Anda ingin mengurangi overhead konteks (/context, /status, /compact)
summary: 'Konteks: apa yang dilihat model, bagaimana konteks itu dibangun, dan cara memeriksanya'
title: Konteks
x-i18n:
    generated_at: "2026-05-10T19:31:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc2dae290e63f82111d865ae066567ef58ec3f48eb62b409b76ee9e6ff65d696
    source_path: concepts/context.md
    workflow: 16
---

"Konteks" adalah **semua yang OpenClaw kirim ke model untuk sebuah proses**. Ini dibatasi oleh **jendela konteks** model (batas token).

Model mental pemula:

- **Prompt sistem** (dibangun oleh OpenClaw): aturan, alat, daftar Skills, waktu/runtime, dan file ruang kerja yang disisipkan.
- **Riwayat percakapan**: pesan Anda + pesan asisten untuk sesi ini.
- **Pemanggilan/hasil alat + lampiran**: keluaran perintah, pembacaan file, gambar/audio, dll.

Konteks _tidak sama_ dengan "memori": memori dapat disimpan di disk dan dimuat ulang nanti; konteks adalah yang berada di dalam jendela model saat ini.

## Mulai cepat (periksa konteks)

- `/status` → tampilan cepat "seberapa penuh jendela saya?" + pengaturan sesi.
- `/context list` → apa yang disisipkan + ukuran kasar (per file + total).
- `/context detail` → rincian lebih dalam: ukuran per file, per skema alat, per entri skill, dan ukuran prompt sistem.
- `/context map` → gambar treemap bergaya WinDirStat dari kontributor konteks terlacak sesi saat ini.
- `/usage tokens` → tambahkan footer penggunaan per balasan ke balasan normal.
- `/compact` → ringkas riwayat lama menjadi entri ringkas untuk membebaskan ruang jendela.

Lihat juga: [Perintah slash](/id/tools/slash-commands), [Penggunaan token & biaya](/id/reference/token-use), [Compaction](/id/concepts/compaction).

## Contoh keluaran

Nilai bervariasi menurut model, penyedia, kebijakan alat, dan isi ruang kerja Anda.

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

Mengirim gambar yang dibuat dari laporan proses cache terbaru. Sebelum pesan normal menghasilkan laporan proses dalam sesi, `/context map` mengembalikan pesan tidak tersedia alih-alih merender perkiraan. Luas persegi panjang sebanding dengan karakter prompt yang dilacak:

- file ruang kerja yang disisipkan
- teks prompt sistem dasar
- entri prompt skill
- skema JSON alat

`/context list`, `/context detail`, dan `/context json` tetap dapat memeriksa perkiraan sesuai permintaan saat tidak ada laporan proses yang di-cache.

## Apa yang dihitung dalam jendela konteks

Semua yang diterima model dihitung, termasuk:

- Prompt sistem (semua bagian).
- Riwayat percakapan.
- Pemanggilan alat + hasil alat.
- Lampiran/transkrip (gambar/audio/file).
- Ringkasan Compaction dan artefak pemangkasan.
- "Wrapper" penyedia atau header tersembunyi (tidak terlihat, tetap dihitung).

## Cara OpenClaw membangun prompt sistem

Prompt sistem **dimiliki OpenClaw** dan dibangun ulang setiap proses. Ini mencakup:

- Daftar alat + deskripsi singkat.
- Daftar Skills (hanya metadata; lihat di bawah).
- Lokasi ruang kerja.
- Waktu (UTC + waktu pengguna yang dikonversi jika dikonfigurasi).
- Metadata runtime (host/OS/model/thinking).
- File bootstrap ruang kerja yang disisipkan di bawah **Konteks Proyek**.

Rincian lengkap: [Prompt Sistem](/id/concepts/system-prompt).

## File ruang kerja yang disisipkan (Konteks Proyek)

Secara default, OpenClaw menyisipkan sekumpulan file ruang kerja tetap (jika ada):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (hanya proses pertama)

File besar dipotong per file menggunakan `agents.defaults.bootstrapMaxChars` (default `12000` karakter). OpenClaw juga menerapkan batas total penyisipan bootstrap di seluruh file dengan `agents.defaults.bootstrapTotalMaxChars` (default `60000` karakter). `/context` menampilkan ukuran **mentah vs disisipkan** dan apakah pemotongan terjadi.

Saat pemotongan terjadi, runtime dapat menyisipkan blok peringatan dalam prompt di bawah Konteks Proyek. Konfigurasikan ini dengan `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; default `once`).

## Skills: disisipkan vs dimuat sesuai permintaan

Prompt sistem menyertakan **daftar Skills** ringkas (nama + deskripsi + lokasi). Daftar ini memiliki overhead nyata.

Instruksi skill _tidak_ disertakan secara default. Model diharapkan `read` `SKILL.md` milik skill **hanya saat diperlukan**.

## Alat: ada dua biaya

Alat memengaruhi konteks dalam dua cara:

1. **Teks daftar alat** dalam prompt sistem (yang Anda lihat sebagai "Tooling").
2. **Skema alat** (JSON). Ini dikirim ke model agar model dapat memanggil alat. Skema ini dihitung dalam konteks meskipun Anda tidak melihatnya sebagai teks biasa.

`/context detail` merinci skema alat terbesar sehingga Anda dapat melihat apa yang dominan.

## Perintah, direktif, dan "pintasan inline"

Perintah slash ditangani oleh Gateway. Ada beberapa perilaku berbeda:

- **Perintah mandiri**: pesan yang hanya berisi `/...` dijalankan sebagai perintah.
- **Direktif**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` dihapus sebelum model melihat pesan.
  - Pesan yang hanya berisi direktif mempertahankan pengaturan sesi.
  - Direktif inline dalam pesan normal bertindak sebagai petunjuk per pesan.
- **Pintasan inline** (hanya pengirim yang diizinkan): token `/...` tertentu di dalam pesan normal dapat langsung berjalan (contoh: "hey /status"), dan dihapus sebelum model melihat teks yang tersisa.

Detail: [Perintah slash](/id/tools/slash-commands).

## Sesi, Compaction, dan pemangkasan (apa yang bertahan)

Apa yang bertahan di antara pesan bergantung pada mekanismenya:

- **Riwayat normal** bertahan dalam transkrip sesi hingga dipadatkan/dipangkas oleh kebijakan.
- **Compaction** mempertahankan ringkasan ke dalam transkrip dan menjaga pesan terbaru tetap utuh.
- **Pemangkasan** menghapus hasil alat lama dari prompt _dalam memori_ untuk membebaskan ruang jendela konteks, tetapi tidak menulis ulang transkrip sesi - riwayat lengkap tetap dapat diperiksa di disk.

Dokumentasi: [Sesi](/id/concepts/session), [Compaction](/id/concepts/compaction), [Pemangkasan sesi](/id/concepts/session-pruning).

Secara default, OpenClaw menggunakan mesin konteks bawaan `legacy` untuk perakitan dan
Compaction. Jika Anda menginstal plugin yang menyediakan `kind: "context-engine"` dan
memilihnya dengan `plugins.slots.contextEngine`, OpenClaw mendelegasikan
perakitan konteks, `/compact`, dan hook siklus hidup konteks subagen terkait ke
mesin tersebut. `ownsCompaction: false` tidak melakukan fallback otomatis ke mesin
`legacy`; mesin aktif tetap harus mengimplementasikan `compact()` dengan benar. Lihat
[Mesin Konteks](/id/concepts/context-engine) untuk antarmuka
yang dapat dipasang, hook siklus hidup, dan konfigurasi lengkap.

## Apa yang sebenarnya dilaporkan `/context`

`/context` lebih memilih laporan prompt sistem **yang dibangun oleh proses** terbaru jika tersedia:

- `System prompt (run)` = ditangkap dari proses tertanam terakhir (mampu alat) dan disimpan di penyimpanan sesi.
- `System prompt (estimate)` = dihitung langsung saat tidak ada laporan proses (atau saat berjalan melalui backend CLI yang tidak menghasilkan laporan).

Bagaimanapun, ini melaporkan ukuran dan kontributor teratas; ini **tidak** membuang prompt sistem lengkap atau skema alat.

## Terkait

<CardGroup cols={2}>
  <Card title="Mesin konteks" href="/id/concepts/context-engine" icon="puzzle-piece">
    Injeksi konteks kustom melalui plugin.
  </Card>
  <Card title="Compaction" href="/id/concepts/compaction" icon="compress">
    Meringkas percakapan panjang agar tetap berada di dalam jendela model.
  </Card>
  <Card title="Prompt sistem" href="/id/concepts/system-prompt" icon="message-lines">
    Cara prompt sistem dibangun dan apa yang disisipkan setiap giliran.
  </Card>
  <Card title="Loop agen" href="/id/concepts/agent-loop" icon="arrows-rotate">
    Siklus eksekusi agen lengkap dari pesan masuk hingga balasan akhir.
  </Card>
</CardGroup>
