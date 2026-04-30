---
read_when:
    - Menyiapkan alur kerja agen otonom yang berjalan tanpa perlu memberi perintah untuk setiap tugas
    - Menentukan apa yang dapat dilakukan agen secara mandiri dan apa yang memerlukan persetujuan manusia
    - Menyusun agen multiprogram dengan batasan yang jelas dan aturan eskalasi
summary: Tentukan otoritas operasional permanen untuk program agen otonom
title: Instruksi tetap
x-i18n:
    generated_at: "2026-04-30T09:32:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff895378cbd53f7e8058137389037ab40201ce2cdfb34c135f480dfef775919b
    source_path: automation/standing-orders.md
    workflow: 16
---

Perintah tetap memberi agen Anda **otoritas operasional permanen** untuk program yang ditetapkan. Alih-alih memberi instruksi tugas individual setiap kali, Anda mendefinisikan program dengan cakupan, pemicu, dan aturan eskalasi yang jelas — dan agen menjalankannya secara otonom dalam batasan tersebut.

Inilah perbedaan antara memberi tahu asisten Anda "kirim laporan mingguan" setiap Jumat vs. memberi otoritas tetap: "Kamu bertanggung jawab atas laporan mingguan. Susun setiap Jumat, kirimkan, dan eskalasikan hanya jika ada sesuatu yang tampak salah."

## Mengapa perintah tetap

**Tanpa perintah tetap:**

- Anda harus memberi prompt kepada agen untuk setiap tugas
- Agen menganggur di antara permintaan
- Pekerjaan rutin terlupakan atau tertunda
- Anda menjadi hambatan

**Dengan perintah tetap:**

- Agen berjalan secara otonom dalam batasan yang ditetapkan
- Pekerjaan rutin terjadi sesuai jadwal tanpa prompt
- Anda hanya terlibat untuk pengecualian dan persetujuan
- Agen mengisi waktu menganggur secara produktif

## Cara kerjanya

Perintah tetap didefinisikan dalam file [ruang kerja agen](/id/concepts/agent-workspace) Anda. Pendekatan yang direkomendasikan adalah menyertakannya langsung di `AGENTS.md` (yang disuntikkan otomatis di setiap sesi) sehingga agen selalu memilikinya dalam konteks. Untuk konfigurasi yang lebih besar, Anda juga dapat menempatkannya dalam file khusus seperti `standing-orders.md` dan merujuknya dari `AGENTS.md`.

Setiap program menentukan:

1. **Cakupan** — apa yang diizinkan untuk dilakukan agen
2. **Pemicu** — kapan dijalankan (jadwal, peristiwa, atau kondisi)
3. **Gerbang persetujuan** — apa yang memerlukan persetujuan manusia sebelum bertindak
4. **Aturan eskalasi** — kapan harus berhenti dan meminta bantuan

Agen memuat instruksi ini setiap sesi melalui file bootstrap ruang kerja (lihat [Ruang Kerja Agen](/id/concepts/agent-workspace) untuk daftar lengkap file yang disuntikkan otomatis) dan menjalankannya, digabungkan dengan [pekerjaan cron](/id/automation/cron-jobs) untuk penegakan berbasis waktu.

<Tip>
Tempatkan perintah tetap di `AGENTS.md` untuk menjamin perintah tersebut dimuat setiap sesi. Bootstrap ruang kerja secara otomatis menyuntikkan `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, dan `MEMORY.md` — tetapi bukan file sembarang dalam subdirektori.
</Tip>

## Anatomi perintah tetap

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad — report accurately
```

## Perintah tetap plus pekerjaan cron

Perintah tetap menentukan **apa** yang diizinkan untuk dilakukan agen. [Pekerjaan cron](/id/automation/cron-jobs) menentukan **kapan** hal itu terjadi. Keduanya bekerja bersama:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Prompt pekerjaan cron sebaiknya merujuk perintah tetap, bukan menduplikasinya:

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

### Contoh 1: konten dan media sosial (siklus mingguan)

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday–Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### Contoh 2: operasi keuangan (dipicu peristiwa)

```markdown
## Program: Financial Processing

**Authority:** Process transaction data, generate reports, send summaries
**Approval gate:** None for analysis. Recommendations require owner approval.
**Trigger:** New data file detected OR scheduled monthly cycle

### When new data arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### Contoh 3: pemantauan dan peringatan (berkelanjutan)

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

### Response matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## Pola jalankan-verifikasi-laporkan

Perintah tetap bekerja paling baik jika digabungkan dengan disiplin eksekusi yang ketat. Setiap tugas dalam perintah tetap sebaiknya mengikuti loop ini:

1. **Jalankan** — Lakukan pekerjaan sebenarnya (jangan hanya mengakui instruksi)
2. **Verifikasi** — Konfirmasi hasilnya benar (file ada, pesan terkirim, data diurai)
3. **Laporkan** — Beri tahu pemilik apa yang telah dilakukan dan apa yang telah diverifikasi

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

Pola ini mencegah mode kegagalan agen yang paling umum: mengakui tugas tanpa menyelesaikannya.

## Arsitektur multi-program

Untuk agen yang mengelola beberapa urusan, susun perintah tetap sebagai program terpisah dengan batasan yang jelas:

```markdown
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

- **Irama pemicu** sendiri (mingguan, bulanan, berbasis peristiwa, berkelanjutan)
- **Gerbang persetujuan** sendiri (beberapa program memerlukan pengawasan lebih besar daripada yang lain)
- **Batasan** yang jelas (agen sebaiknya tahu di mana satu program berakhir dan program lain dimulai)

## Praktik terbaik

### Lakukan

- Mulai dengan otoritas sempit dan perluas seiring meningkatnya kepercayaan
- Tetapkan gerbang persetujuan eksplisit untuk tindakan berisiko tinggi
- Sertakan bagian "Yang TIDAK boleh dilakukan" — batasan sama pentingnya dengan izin
- Gabungkan dengan pekerjaan cron untuk eksekusi berbasis waktu yang andal
- Tinjau log agen setiap minggu untuk memverifikasi perintah tetap diikuti
- Perbarui perintah tetap saat kebutuhan Anda berkembang — ini adalah dokumen hidup

### Hindari

- Memberikan otoritas luas pada hari pertama ("lakukan apa pun yang menurutmu terbaik")
- Melewatkan aturan eskalasi — setiap program memerlukan klausul "kapan harus berhenti dan bertanya"
- Menganggap agen akan mengingat instruksi lisan — masukkan semuanya ke dalam file
- Mencampur urusan dalam satu program — pisahkan program untuk domain terpisah
- Lupa menegakkan dengan pekerjaan cron — perintah tetap tanpa pemicu menjadi saran

## Terkait

- [Otomasi dan tugas](/id/automation): semua mekanisme otomasi secara sekilas.
- [Pekerjaan cron](/id/automation/cron-jobs): penegakan jadwal untuk perintah tetap.
- [Hook](/id/automation/hooks): skrip berbasis peristiwa untuk peristiwa siklus hidup agen.
- [Webhook](/id/automation/cron-jobs#webhooks): pemicu peristiwa HTTP masuk.
- [Ruang kerja agen](/id/concepts/agent-workspace): tempat perintah tetap berada, termasuk daftar lengkap file bootstrap yang disuntikkan otomatis (`AGENTS.md`, `SOUL.md`, dll.).
