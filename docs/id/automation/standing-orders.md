---
read_when:
    - Menyiapkan alur kerja agen otonom yang berjalan tanpa prompt per tugas
    - Menentukan apa yang dapat dilakukan agen secara mandiri vs. apa yang memerlukan persetujuan manusia
    - Menyusun agen multi-program dengan batasan yang jelas dan aturan eskalasi
summary: Tentukan otoritas operasional permanen untuk program agen otonom
title: Standing Orders
x-i18n:
    generated_at: "2026-04-05T13:42:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81347d7a51a6ce20e6493277afee92073770f69a91a2e6b3bf87b99bb586d038
    source_path: automation/standing-orders.md
    workflow: 15
---

# Standing Orders

Standing orders memberi agen Anda **otoritas operasional permanen** untuk program yang ditentukan. Alih-alih memberikan instruksi tugas satu per satu setiap kali, Anda menentukan program dengan cakupan, pemicu, dan aturan eskalasi yang jelas — lalu agen mengeksekusi secara otonom di dalam batasan tersebut.

Inilah perbedaan antara memberi tahu asisten Anda "kirim laporan mingguan" setiap hari Jumat vs. memberikan otoritas tetap: "Anda bertanggung jawab atas laporan mingguan. Susun setiap hari Jumat, kirim, dan eskalasikan hanya jika ada sesuatu yang terlihat salah."

## Mengapa Standing Orders?

**Tanpa standing orders:**

- Anda harus memicu agen untuk setiap tugas
- Agen diam tidak aktif di antara permintaan
- Pekerjaan rutin terlupakan atau tertunda
- Anda menjadi bottleneck

**Dengan standing orders:**

- Agen mengeksekusi secara otonom dalam batasan yang ditentukan
- Pekerjaan rutin berjalan sesuai jadwal tanpa prompt
- Anda hanya terlibat untuk pengecualian dan persetujuan
- Agen mengisi waktu senggang secara produktif

## Cara Kerjanya

Standing orders ditentukan dalam file [agent workspace](/concepts/agent-workspace) Anda. Pendekatan yang direkomendasikan adalah menyertakannya langsung di `AGENTS.md` (yang otomatis disuntikkan di setiap sesi) agar agen selalu memilikinya dalam konteks. Untuk konfigurasi yang lebih besar, Anda juga dapat menaruhnya di file khusus seperti `standing-orders.md` dan mereferensikannya dari `AGENTS.md`.

Setiap program menentukan:

1. **Cakupan** — apa yang berwenang dilakukan agen
2. **Pemicu** — kapan harus mengeksekusi (jadwal, peristiwa, atau kondisi)
3. **Gerbang persetujuan** — apa yang memerlukan persetujuan manusia sebelum bertindak
4. **Aturan eskalasi** — kapan harus berhenti dan meminta bantuan

Agen memuat instruksi ini di setiap sesi melalui file bootstrap workspace (lihat [Agent Workspace](/concepts/agent-workspace) untuk daftar lengkap file yang disuntikkan otomatis) dan mengeksekusi berdasarkan instruksi tersebut, dikombinasikan dengan [cron jobs](/automation/cron-jobs) untuk penegakan berbasis waktu.

<Tip>
Letakkan standing orders di `AGENTS.md` untuk memastikan semuanya dimuat di setiap sesi. Bootstrap workspace otomatis menyuntikkan `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, dan `MEMORY.md` — tetapi tidak file sembarang di subdirektori.
</Tip>

## Anatomi Standing Order

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution Steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to Do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad — report accurately
```

## Standing Orders + Cron Jobs

Standing orders menentukan **apa** yang berwenang dilakukan agen. [Cron jobs](/automation/cron-jobs) menentukan **kapan** hal itu terjadi. Keduanya bekerja bersama:

```
Standing Order: "Anda bertanggung jawab atas triase inbox harian"
    ↓
Cron Job (setiap hari pukul 8 pagi): "Jalankan triase inbox sesuai standing orders"
    ↓
Agen: Membaca standing orders → mengeksekusi langkah-langkah → melaporkan hasil
```

Prompt cron job seharusnya mereferensikan standing order, bukan menduplikasinya:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## Contoh

### Contoh 1: Konten & Media Sosial (Siklus Mingguan)

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly Cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday–Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content Rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### Contoh 2: Operasi Keuangan (Dipicu Peristiwa)

```markdown
## Program: Financial Processing

**Authority:** Process transaction data, generate reports, send summaries
**Approval gate:** None for analysis. Recommendations require owner approval.
**Trigger:** New data file detected OR scheduled monthly cycle

### When New Data Arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation Rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### Contoh 3: Pemantauan & Peringatan (Berkelanjutan)

```markdown
## Program: System Monitoring

**Authority:** Check system health, restart services, send alerts
**Approval gate:** Restart services automatically. Escalate if restart fails twice.
**Trigger:** Every heartbeat cycle

### Checks

- Service health endpoints responding
- Disk space above threshold
- Pending tasks not stale (>24 hours)
- Delivery channels operational

### Response Matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## Pola Execute-Verify-Report

Standing orders bekerja paling baik jika digabungkan dengan disiplin eksekusi yang ketat. Setiap tugas dalam standing order harus mengikuti loop ini:

1. **Execute** — Lakukan pekerjaan yang sebenarnya (jangan hanya mengakui instruksinya)
2. **Verify** — Konfirmasi bahwa hasilnya benar (file ada, pesan terkirim, data berhasil diparse)
3. **Report** — Beri tahu pemilik apa yang telah dilakukan dan apa yang telah diverifikasi

```markdown
### Execution Rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

Pola ini mencegah mode kegagalan agen yang paling umum: mengakui sebuah tugas tanpa menyelesaikannya.

## Arsitektur Multi-Program

Untuk agen yang mengelola banyak area, susun standing orders sebagai program terpisah dengan batasan yang jelas:

```markdown
# Standing Orders

## Program 1: [Domain A] (Weekly)

...

## Program 2: [Domain B] (Monthly + On-Demand)

...

## Program 3: [Domain C] (As-Needed)

...

## Escalation Rules (All Programs)

- [Common escalation criteria]
- [Approval gates that apply across programs]
```

Setiap program seharusnya memiliki:

- **Kadensi pemicu** sendiri (mingguan, bulanan, berbasis peristiwa, berkelanjutan)
- **Gerbang persetujuan** sendiri (beberapa program memerlukan pengawasan lebih banyak daripada yang lain)
- **Batasan** yang jelas (agen harus mengetahui di mana satu program berakhir dan program lain dimulai)

## Praktik Terbaik

### Lakukan

- Mulailah dengan otoritas yang sempit dan perluas seiring tumbuhnya kepercayaan
- Tentukan gerbang persetujuan yang eksplisit untuk tindakan berisiko tinggi
- Sertakan bagian "Apa yang TIDAK boleh dilakukan" — batasan sama pentingnya dengan izin
- Gabungkan dengan cron jobs untuk eksekusi berbasis waktu yang andal
- Tinjau log agen setiap minggu untuk memverifikasi bahwa standing orders diikuti
- Perbarui standing orders seiring kebutuhan Anda berkembang — ini adalah dokumen hidup

### Hindari

- Memberikan otoritas yang luas sejak hari pertama ("lakukan apa pun yang menurut Anda terbaik")
- Melewatkan aturan eskalasi — setiap program membutuhkan klausul "kapan harus berhenti dan bertanya"
- Menganggap agen akan mengingat instruksi lisan — tuliskan semuanya di file
- Mencampur banyak area dalam satu program — program terpisah untuk domain yang terpisah
- Lupa menegakkan dengan cron jobs — standing orders tanpa pemicu akan menjadi saran saja

## Terkait

- [Automation & Tasks](/automation) — semua mekanisme otomasi secara ringkas
- [Cron Jobs](/automation/cron-jobs) — penegakan jadwal untuk standing orders
- [Hooks](/automation/hooks) — skrip berbasis peristiwa untuk peristiwa siklus hidup agen
- [Webhooks](/automation/cron-jobs#webhooks) — pemicu peristiwa HTTP masuk
- [Agent Workspace](/concepts/agent-workspace) — tempat standing orders berada, termasuk daftar lengkap file bootstrap yang disuntikkan otomatis (AGENTS.md, SOUL.md, dll.)
