---
read_when:
    - Menyiapkan alur kerja agen otonom yang berjalan tanpa prompt per tugas
    - Menentukan apa yang dapat dilakukan agen secara mandiri vs. apa yang memerlukan persetujuan manusia
    - Menyusun agen multi-program dengan batasan yang jelas dan aturan eskalasi
summary: Tentukan otoritas operasional permanen untuk program agen otonom
title: Perintah tetap
x-i18n:
    generated_at: "2026-04-24T08:57:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: a69cd16b23caedea5020e6bf6dfbe4f77b5bcd5a329af7dfcf535c6aa0924ce4
    source_path: automation/standing-orders.md
    workflow: 15
---

Perintah tetap memberikan agen Anda **otoritas operasional permanen** untuk program yang ditentukan. Alih-alih memberikan instruksi tugas satu per satu setiap kali, Anda mendefinisikan program dengan cakupan, pemicu, dan aturan eskalasi yang jelas — lalu agen menjalankannya secara otonom dalam batasan tersebut.

Inilah perbedaan antara memberi tahu asisten Anda "kirim laporan mingguan" setiap Jumat vs. memberikan otoritas tetap: "Anda bertanggung jawab atas laporan mingguan. Susun setiap Jumat, kirimkan, dan hanya eskalasi jika ada sesuatu yang tampak salah."

## Mengapa Perintah Tetap?

**Tanpa perintah tetap:**

- Anda harus memberi prompt kepada agen untuk setiap tugas
- Agen menganggur di antara permintaan
- Pekerjaan rutin terlupakan atau tertunda
- Anda menjadi hambatan

**Dengan perintah tetap:**

- Agen menjalankan tugas secara otonom dalam batasan yang ditentukan
- Pekerjaan rutin berjalan sesuai jadwal tanpa prompt
- Anda hanya terlibat untuk pengecualian dan persetujuan
- Agen mengisi waktu luang secara produktif

## Cara Kerjanya

Perintah tetap ditentukan dalam file [ruang kerja agen](/id/concepts/agent-workspace) Anda. Pendekatan yang direkomendasikan adalah menyertakannya langsung di `AGENTS.md` (yang disuntikkan otomatis di setiap sesi) agar agen selalu memilikinya dalam konteks. Untuk konfigurasi yang lebih besar, Anda juga dapat menaruhnya di file khusus seperti `standing-orders.md` lalu mereferensikannya dari `AGENTS.md`.

Setiap program menentukan:

1. **Cakupan** — apa yang diizinkan untuk dilakukan agen
2. **Pemicu** — kapan dijalankan (jadwal, peristiwa, atau kondisi)
3. **Gerbang persetujuan** — apa yang memerlukan persetujuan manusia sebelum bertindak
4. **Aturan eskalasi** — kapan harus berhenti dan meminta bantuan

Agen memuat instruksi ini di setiap sesi melalui file bootstrap ruang kerja (lihat [Ruang Kerja Agen](/id/concepts/agent-workspace) untuk daftar lengkap file yang disuntikkan otomatis) dan mengeksekusinya, dikombinasikan dengan [pekerjaan Cron](/id/automation/cron-jobs) untuk penegakan berbasis waktu.

<Tip>
Letakkan perintah tetap di `AGENTS.md` untuk menjamin bahwa perintah tersebut dimuat di setiap sesi. Bootstrap ruang kerja secara otomatis menyuntikkan `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, dan `MEMORY.md` — tetapi tidak file sembarang di subdirektori.
</Tip>

## Anatomi Perintah Tetap

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

## Perintah Tetap + Pekerjaan Cron

Perintah tetap mendefinisikan **apa** yang diizinkan untuk dilakukan agen. [Pekerjaan Cron](/id/automation/cron-jobs) mendefinisikan **kapan** hal itu terjadi. Keduanya bekerja bersama:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Prompt pekerjaan Cron harus merujuk ke perintah tetap alih-alih menduplikasinya:

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

## Pola Jalankan-Verifikasi-Laporkan

Perintah tetap bekerja paling baik jika digabungkan dengan disiplin eksekusi yang ketat. Setiap tugas dalam perintah tetap harus mengikuti siklus ini:

1. **Jalankan** — Lakukan pekerjaan sebenarnya (jangan hanya mengakui instruksinya)
2. **Verifikasi** — Konfirmasi bahwa hasilnya benar (file ada, pesan terkirim, data berhasil diurai)
3. **Laporkan** — Beri tahu pemilik apa yang dilakukan dan apa yang diverifikasi

```markdown
### Execution Rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

Pola ini mencegah mode kegagalan agen yang paling umum: mengakui tugas tanpa menyelesaikannya.

## Arsitektur Multi-Program

Untuk agen yang mengelola banyak hal, susun perintah tetap sebagai program terpisah dengan batasan yang jelas:

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

Setiap program sebaiknya memiliki:

- **Irama pemicu** sendiri (mingguan, bulanan, dipicu peristiwa, berkelanjutan)
- **Gerbang persetujuan** sendiri (beberapa program membutuhkan pengawasan lebih besar daripada yang lain)
- **Batasan** yang jelas (agen harus tahu di mana satu program berakhir dan program lain dimulai)

## Praktik Terbaik

### Lakukan

- Mulailah dengan otoritas yang sempit lalu perluas seiring tumbuhnya kepercayaan
- Tentukan gerbang persetujuan yang eksplisit untuk tindakan berisiko tinggi
- Sertakan bagian "Apa yang TIDAK boleh dilakukan" — batasan sama pentingnya dengan izin
- Gabungkan dengan pekerjaan Cron untuk eksekusi berbasis waktu yang andal
- Tinjau log agen setiap minggu untuk memverifikasi bahwa perintah tetap diikuti
- Perbarui perintah tetap seiring kebutuhan Anda berkembang — ini adalah dokumen hidup

### Hindari

- Memberikan otoritas yang luas pada hari pertama ("lakukan apa pun yang menurut Anda terbaik")
- Melewatkan aturan eskalasi — setiap program membutuhkan klausul "kapan harus berhenti dan bertanya"
- Menganggap agen akan mengingat instruksi lisan — tulis semuanya di file
- Mencampur berbagai hal dalam satu program — pisahkan program untuk domain yang berbeda
- Lupa menegakkan dengan pekerjaan Cron — perintah tetap tanpa pemicu hanya menjadi saran

## Terkait

- [Automation & Tasks](/id/automation) — semua mekanisme otomasi secara ringkas
- [Pekerjaan Cron](/id/automation/cron-jobs) — penegakan jadwal untuk perintah tetap
- [Hooks](/id/automation/hooks) — skrip berbasis peristiwa untuk peristiwa siklus hidup agen
- [Webhook](/id/automation/cron-jobs#webhooks) — pemicu peristiwa HTTP masuk
- [Ruang Kerja Agen](/id/concepts/agent-workspace) — tempat perintah tetap berada, termasuk daftar lengkap file bootstrap yang disuntikkan otomatis (AGENTS.md, SOUL.md, dll.)
