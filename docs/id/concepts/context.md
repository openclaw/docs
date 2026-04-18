---
read_when:
    - Anda ingin memahami apa yang dimaksud dengan “konteks” di OpenClaw
    - Anda sedang men-debug mengapa model “mengetahui” sesuatu (atau melupakannya)
    - Anda ingin mengurangi overhead konteks (/context, /status, /compact)
summary: 'Konteks: apa yang dilihat model, bagaimana model dibangun, dan cara memeriksanya'
title: Konteks
x-i18n:
    generated_at: "2026-04-18T09:05:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 477ccb1d9654968d0e904b6846b32b8c14db6b6c0d3d2ec2b7409639175629f9
    source_path: concepts/context.md
    workflow: 15
---

# Konteks

“Konteks” adalah **segala sesuatu yang dikirim OpenClaw ke model untuk sebuah run**. Konteks dibatasi oleh **jendela konteks** model (batas token).

Model mental untuk pemula:

- **System prompt** (dibangun oleh OpenClaw): aturan, tools, daftar skills, waktu/runtime, dan file workspace yang disuntikkan.
- **Riwayat percakapan**: pesan Anda + pesan asisten untuk sesi ini.
- **Panggilan/hasil tool + lampiran**: output perintah, pembacaan file, gambar/audio, dll.

Konteks _tidak sama_ dengan “memory”: memory dapat disimpan di disk dan dimuat ulang nanti; konteks adalah apa yang ada di dalam jendela model saat ini.

## Mulai cepat (periksa konteks)

- `/status` → tampilan cepat “seberapa penuh jendela saya?” + pengaturan sesi.
- `/context list` → apa yang disuntikkan + ukuran perkiraan (per file + total).
- `/context detail` → rincian yang lebih dalam: per file, ukuran skema per-tool, ukuran entri per-skill, dan ukuran system prompt.
- `/usage tokens` → tambahkan footer penggunaan per-balasan ke balasan normal.
- `/compact` → ringkas riwayat lama menjadi entri ringkas untuk membebaskan ruang jendela.

Lihat juga: [Perintah slash](/id/tools/slash-commands), [Penggunaan token & biaya](/id/reference/token-use), [Compaction](/id/concepts/compaction).

## Contoh output

Nilai bervariasi menurut model, provider, kebijakan tool, dan apa yang ada di workspace Anda.

### `/context list`

```
🧠 Rincian konteks
Workspace: <workspaceDir>
Bootstrap maks/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

File workspace yang disuntikkan:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Daftar Skills (teks system prompt): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Daftar tool (teks system prompt): 1,032 chars (~258 tok)
Skema tool (JSON): 31,988 chars (~7,997 tok) (dihitung ke dalam konteks; tidak ditampilkan sebagai teks)
Tools: (sama seperti di atas)

Token sesi (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Rincian konteks (detail)
…
Skill teratas (ukuran entri prompt):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 skill lainnya)

Tool teratas (ukuran skema):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N tool lainnya)
```

## Apa yang dihitung ke dalam jendela konteks

Semua yang diterima model dihitung, termasuk:

- System prompt (semua bagian).
- Riwayat percakapan.
- Panggilan tool + hasil tool.
- Lampiran/transkrip (gambar/audio/file).
- Ringkasan Compaction dan artefak pruning.
- “Wrapper” provider atau header tersembunyi (tidak terlihat, tetap dihitung).

## Bagaimana OpenClaw membangun system prompt

System prompt adalah milik **OpenClaw** dan dibangun ulang setiap run. Isinya meliputi:

- Daftar tool + deskripsi singkat.
- Daftar Skills (metadata saja; lihat di bawah).
- Lokasi workspace.
- Waktu (UTC + waktu pengguna yang dikonversi jika dikonfigurasi).
- Metadata runtime (host/OS/model/thinking).
- File bootstrap workspace yang disuntikkan di bawah **Project Context**.

Rincian lengkap: [System Prompt](/id/concepts/system-prompt).

## File workspace yang disuntikkan (Project Context)

Secara default, OpenClaw menyuntikkan sekumpulan file workspace tetap (jika ada):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (hanya saat run pertama)

File besar dipotong per file menggunakan `agents.defaults.bootstrapMaxChars` (default `12000` chars). OpenClaw juga menerapkan batas total injeksi bootstrap di seluruh file dengan `agents.defaults.bootstrapTotalMaxChars` (default `60000` chars). `/context` menampilkan ukuran **raw vs injected** serta apakah pemotongan terjadi.

Saat pemotongan terjadi, runtime dapat menyuntikkan blok peringatan di dalam prompt di bawah Project Context. Konfigurasikan ini dengan `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; default `once`).

## Skills: disuntikkan vs dimuat sesuai permintaan

System prompt menyertakan **daftar Skills** ringkas (nama + deskripsi + lokasi). Daftar ini memiliki overhead nyata.

Instruksi skill _tidak_ disertakan secara default. Model diharapkan untuk `read` `SKILL.md` milik skill **hanya saat diperlukan**.

## Tools: ada dua biaya

Tools memengaruhi konteks dengan dua cara:

1. **Teks daftar tool** di system prompt (yang Anda lihat sebagai “Tooling”).
2. **Skema tool** (JSON). Ini dikirim ke model agar model dapat memanggil tools. Skema ini dihitung ke dalam konteks meskipun Anda tidak melihatnya sebagai teks biasa.

`/context detail` merinci skema tool terbesar sehingga Anda dapat melihat apa yang paling dominan.

## Perintah, direktif, dan "shortcut inline"

Perintah slash ditangani oleh Gateway. Ada beberapa perilaku yang berbeda:

- **Perintah mandiri**: pesan yang hanya berisi `/...` dijalankan sebagai perintah.
- **Direktif**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` dihapus sebelum model melihat pesan.
  - Pesan yang hanya berisi direktif menyimpan pengaturan sesi.
  - Direktif inline dalam pesan normal bertindak sebagai petunjuk per pesan.
- **Shortcut inline** (hanya pengirim yang diizinkan): token `/...` tertentu di dalam pesan normal dapat langsung dijalankan (contoh: “hey /status”), lalu dihapus sebelum model melihat sisa teks.

Detail: [Perintah slash](/id/tools/slash-commands).

## Sesi, Compaction, dan pruning (apa yang dipertahankan)

Apa yang dipertahankan antar pesan bergantung pada mekanismenya:

- **Riwayat normal** dipertahankan dalam transkrip sesi sampai di-compact/di-prune oleh kebijakan.
- **Compaction** mempertahankan ringkasan ke dalam transkrip dan menjaga pesan terbaru tetap utuh.
- **Pruning** menghapus hasil tool lama dari prompt _in-memory_ untuk sebuah run, tetapi tidak menulis ulang transkrip.

Dokumentasi: [Session](/id/concepts/session), [Compaction](/id/concepts/compaction), [Session pruning](/id/concepts/session-pruning).

Secara default, OpenClaw menggunakan context engine `legacy` bawaan untuk perakitan dan
Compaction. Jika Anda memasang Plugin yang menyediakan `kind: "context-engine"` dan
memilihnya dengan `plugins.slots.contextEngine`, OpenClaw mendelegasikan perakitan konteks, `/compact`, dan hook siklus hidup konteks subagent terkait
ke engine tersebut. `ownsCompaction: false` tidak otomatis fallback ke
engine legacy; engine aktif tetap harus mengimplementasikan `compact()` dengan benar. Lihat
[Context Engine](/id/concepts/context-engine) untuk antarmuka pluggable,
hook siklus hidup, dan konfigurasi lengkap.

## Apa yang sebenarnya dilaporkan `/context`

`/context` mengutamakan laporan system prompt **yang dibangun saat run** terbaru jika tersedia:

- `System prompt (run)` = diambil dari run embedded (mampu-tool) terakhir dan disimpan di session store.
- `System prompt (estimate)` = dihitung saat itu juga ketika belum ada laporan run (atau saat berjalan melalui backend CLI yang tidak menghasilkan laporan tersebut).

Apa pun caranya, ini melaporkan ukuran dan kontributor teratas; ini **tidak** menampilkan seluruh system prompt atau skema tool.

## Terkait

- [Context Engine](/id/concepts/context-engine) — injeksi konteks kustom melalui plugin
- [Compaction](/id/concepts/compaction) — meringkas percakapan panjang
- [System Prompt](/id/concepts/system-prompt) — bagaimana system prompt dibangun
- [Agent Loop](/id/concepts/agent-loop) — siklus eksekusi agen lengkap
