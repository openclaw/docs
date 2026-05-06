---
read_when:
    - Anda ingin memahami apa arti "konteks" di OpenClaw
    - Anda sedang menyelidiki mengapa model "mengetahui" sesuatu (atau melupakannya)
    - Anda ingin mengurangi beban konteks (/context, /status, /compact)
summary: 'Konteks: apa yang dilihat model, bagaimana konteks tersebut dibangun, dan bagaimana memeriksanya'
title: Konteks
x-i18n:
    generated_at: "2026-05-06T09:07:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd23094ef23928ee277c1b84ee17b9324aaea963d72a0c4c73da359409a5de9
    source_path: concepts/context.md
    workflow: 16
---

"Konteks" adalah **semua yang OpenClaw kirim ke model untuk sebuah proses berjalan**. Ini dibatasi oleh **jendela konteks** model (batas token).

Model mental pemula:

- **Prompt sistem** (dibangun OpenClaw): aturan, alat, daftar skills, waktu/runtime, dan file workspace yang diinjeksi.
- **Riwayat percakapan**: pesan Anda + pesan asisten untuk sesi ini.
- **Panggilan/hasil alat + lampiran**: output perintah, pembacaan file, gambar/audio, dll.

Konteks _tidak sama_ dengan "memori": memori dapat disimpan di disk dan dimuat ulang nanti; konteks adalah apa yang ada di dalam jendela model saat ini.

## Mulai cepat (periksa konteks)

- `/status` → tampilan cepat "seberapa penuh jendela saya?" + pengaturan sesi.
- `/context list` → apa yang diinjeksi + ukuran kasar (per file + total).
- `/context detail` → perincian lebih dalam: ukuran per file, per skema alat, per entri skill, dan ukuran prompt sistem.
- `/usage tokens` → tambahkan footer penggunaan per balasan ke balasan normal.
- `/compact` → ringkas riwayat lama menjadi entri ringkas untuk mengosongkan ruang jendela.

Lihat juga: [Perintah slash](/id/tools/slash-commands), [Penggunaan token & biaya](/id/reference/token-use), [Compaction](/id/concepts/compaction).

## Contoh output

Nilai bervariasi menurut model, provider, kebijakan alat, dan apa yang ada di workspace Anda.

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

## Apa yang dihitung ke dalam jendela konteks

Semua yang diterima model dihitung, termasuk:

- Prompt sistem (semua bagian).
- Riwayat percakapan.
- Panggilan alat + hasil alat.
- Lampiran/transkrip (gambar/audio/file).
- Ringkasan Compaction dan artefak pemangkasan.
- "Wrapper" provider atau header tersembunyi (tidak terlihat, tetap dihitung).

## Cara OpenClaw membangun prompt sistem

Prompt sistem **dimiliki OpenClaw** dan dibangun ulang setiap proses berjalan. Ini mencakup:

- Daftar alat + deskripsi singkat.
- Daftar Skills (metadata saja; lihat di bawah).
- Lokasi workspace.
- Waktu (UTC + waktu pengguna yang dikonversi jika dikonfigurasi).
- Metadata runtime (host/OS/model/thinking).
- File bootstrap workspace yang diinjeksi di bawah **Konteks Proyek**.

Perincian lengkap: [Prompt Sistem](/id/concepts/system-prompt).

## File workspace yang diinjeksi (Konteks Proyek)

Secara default, OpenClaw menginjeksi serangkaian file workspace tetap (jika ada):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (hanya proses pertama)

File besar dipotong per file menggunakan `agents.defaults.bootstrapMaxChars` (default `12000` karakter). OpenClaw juga menerapkan batas total injeksi bootstrap lintas file dengan `agents.defaults.bootstrapTotalMaxChars` (default `60000` karakter). `/context` menampilkan ukuran **mentah vs diinjeksi** dan apakah pemotongan terjadi.

Saat pemotongan terjadi, runtime dapat menginjeksi blok peringatan di dalam prompt di bawah Konteks Proyek. Konfigurasikan ini dengan `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; default `once`).

## Skills: diinjeksi vs dimuat sesuai kebutuhan

Prompt sistem mencakup **daftar skills** yang ringkas (nama + deskripsi + lokasi). Daftar ini memiliki overhead nyata.

Instruksi skill _tidak_ disertakan secara default. Model diharapkan untuk `read` `SKILL.md` milik skill **hanya saat diperlukan**.

## Alat: ada dua biaya

Alat memengaruhi konteks dengan dua cara:

1. **Teks daftar alat** di prompt sistem (yang Anda lihat sebagai "Tooling").
2. **Skema alat** (JSON). Ini dikirim ke model agar model dapat memanggil alat. Skema ini dihitung ke dalam konteks meskipun Anda tidak melihatnya sebagai teks biasa.

`/context detail` memecah skema alat terbesar agar Anda dapat melihat apa yang paling dominan.

## Perintah, direktif, dan "pintasan inline"

Perintah slash ditangani oleh Gateway. Ada beberapa perilaku berbeda:

- **Perintah mandiri**: pesan yang hanya berisi `/...` dijalankan sebagai perintah.
- **Direktif**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` dihapus sebelum model melihat pesan.
  - Pesan yang hanya berisi direktif mempertahankan pengaturan sesi.
  - Direktif inline dalam pesan normal bertindak sebagai petunjuk per pesan.
- **Pintasan inline** (hanya pengirim yang diizinkan): token `/...` tertentu di dalam pesan normal dapat langsung berjalan (contoh: "hey /status"), dan dihapus sebelum model melihat teks sisanya.

Detail: [Perintah slash](/id/tools/slash-commands).

## Sesi, Compaction, dan pemangkasan (apa yang bertahan)

Apa yang bertahan antar pesan bergantung pada mekanismenya:

- **Riwayat normal** bertahan dalam transkrip sesi hingga dikompaksi/dipangkas oleh kebijakan.
- **Compaction** mempertahankan ringkasan ke dalam transkrip dan menjaga pesan terbaru tetap utuh.
- **Pemangkasan** menghapus hasil alat lama dari prompt _dalam memori_ untuk mengosongkan ruang jendela konteks, tetapi tidak menulis ulang transkrip sesi - riwayat lengkap masih dapat diperiksa di disk.

Dokumentasi: [Sesi](/id/concepts/session), [Compaction](/id/concepts/compaction), [Pemangkasan sesi](/id/concepts/session-pruning).

Secara default, OpenClaw menggunakan engine konteks bawaan `legacy` untuk perakitan dan
Compaction. Jika Anda memasang plugin yang menyediakan `kind: "context-engine"` dan
memilihnya dengan `plugins.slots.contextEngine`, OpenClaw mendelegasikan perakitan konteks,
`/compact`, dan hook siklus hidup konteks subagent terkait ke engine tersebut
sebagai gantinya. `ownsCompaction: false` tidak otomatis fallback ke engine
legacy; engine aktif tetap harus mengimplementasikan `compact()` dengan benar. Lihat
[Engine Konteks](/id/concepts/context-engine) untuk antarmuka lengkap yang dapat
dipasang, hook siklus hidup, dan konfigurasi.

## Apa yang sebenarnya dilaporkan `/context`

`/context` lebih memilih laporan prompt sistem **yang dibangun saat proses berjalan** terbaru saat tersedia:

- `System prompt (run)` = diambil dari proses berjalan tertanam terakhir (mampu memakai alat) dan dipertahankan di penyimpanan sesi.
- `System prompt (estimate)` = dihitung langsung saat tidak ada laporan proses berjalan (atau saat berjalan melalui backend CLI yang tidak menghasilkan laporan).

Apa pun caranya, ini melaporkan ukuran dan kontributor terbesar; ini **tidak** membuang prompt sistem lengkap atau skema alat.

## Terkait

<CardGroup cols={2}>
  <Card title="Engine konteks" href="/id/concepts/context-engine" icon="puzzle-piece">
    Injeksi konteks kustom melalui plugin.
  </Card>
  <Card title="Compaction" href="/id/concepts/compaction" icon="compress">
    Meringkas percakapan panjang agar tetap berada di dalam jendela model.
  </Card>
  <Card title="Prompt sistem" href="/id/concepts/system-prompt" icon="message-lines">
    Cara prompt sistem dibangun dan apa yang diinjeksi setiap giliran.
  </Card>
  <Card title="Loop agen" href="/id/concepts/agent-loop" icon="arrows-rotate">
    Siklus eksekusi agen lengkap dari pesan masuk hingga balasan akhir.
  </Card>
</CardGroup>
