---
read_when:
    - Görev başına istem gerektirmeden çalışan otonom ajan iş akışlarını kurma
    - Ajanın bağımsız olarak neler yapabileceğini ve nelerin insan onayı gerektirdiğini tanımlama
    - Çok programlı ajanları net sınırlar ve yükseltme kurallarıyla yapılandırma
summary: Otonom ajan programları için kalıcı çalışma yetkisi tanımlayın
title: Sürekli talimatlar
x-i18n:
    generated_at: "2026-05-10T19:21:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c78a723c296e1b695fd0fa7b0c3dbc3572fcfc1f49d6fadcab7a5a7a44c4b8d
    source_path: automation/standing-orders.md
    workflow: 16
---

Sürekli talimatlar, tanımlanmış programlar için ajanınıza **kalıcı çalışma yetkisi** verir. Her seferinde tek tek görev talimatı vermek yerine, net kapsamı, tetikleyicileri ve eskalasyon kuralları olan programlar tanımlarsınız; ajan da bu sınırlar içinde otonom olarak yürütür.

Bu, asistanınıza her Cuma "haftalık raporu gönder" demek ile sürekli yetki vermek arasındaki farktır: "Haftalık raporun sahibi sensin. Her Cuma derle, gönder ve yalnızca bir şey yanlış görünüyorsa eskale et."

## Neden sürekli talimatlar

**Sürekli talimatlar olmadan:**

- Her görev için ajana istem vermeniz gerekir
- Ajan istekler arasında boşta bekler
- Rutin işler unutulur veya gecikir
- Darboğaz siz olursunuz

**Sürekli talimatlarla:**

- Ajan tanımlı sınırlar içinde otonom olarak yürütür
- Rutin işler istem verilmeden plana göre gerçekleşir
- Siz yalnızca istisnalar ve onaylar için devreye girersiniz
- Ajan boş zamanı verimli şekilde doldurur

## Nasıl çalışırlar

Sürekli talimatlar [ajan çalışma alanı](/tr/concepts/agent-workspace) dosyalarınızda tanımlanır. Önerilen yaklaşım, bunları doğrudan `AGENTS.md` içine eklemektir (her oturumda otomatik enjekte edilir), böylece ajan bunları her zaman bağlamında bulundurur. Daha büyük yapılandırmalar için bunları `standing-orders.md` gibi ayrılmış bir dosyaya da koyabilir ve `AGENTS.md` içinden buna başvurabilirsiniz.

Her program şunları belirtir:

1. **Kapsam** - ajanın ne yapmaya yetkili olduğu
2. **Tetikleyiciler** - ne zaman yürütüleceği (zamanlama, olay veya koşul)
3. **Onay kapıları** - harekete geçmeden önce neyin insan onayı gerektirdiği
4. **Eskalasyon kuralları** - ne zaman durup yardım isteneceği

Ajan bu talimatları her oturumda çalışma alanı başlangıç dosyaları aracılığıyla yükler (otomatik enjekte edilen dosyaların tam listesi için bkz. [Ajan Çalışma Alanı](/tr/concepts/agent-workspace)) ve zamana dayalı uygulama için [Cron işleri](/tr/automation/cron-jobs) ile birlikte bunlara göre yürütür.

<Tip>
Her oturumda yüklendiklerini garanti etmek için sürekli talimatları `AGENTS.md` içine koyun. Çalışma alanı başlangıcı `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` ve `MEMORY.md` dosyalarını otomatik olarak enjekte eder; ancak alt dizinlerdeki rastgele dosyaları enjekte etmez.
</Tip>

## Bir sürekli talimatın anatomisi

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
- Do not skip delivery if metrics look bad - report accurately
```

## Sürekli talimatlar artı Cron işleri

Sürekli talimatlar, ajanın **ne** yapmaya yetkili olduğunu tanımlar. [Cron işleri](/tr/automation/cron-jobs) bunun **ne zaman** gerçekleşeceğini tanımlar. Birlikte çalışırlar:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Cron işi istemi, onu çoğaltmak yerine sürekli talimata başvurmalıdır:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## Örnekler

### Örnek 1: içerik ve sosyal medya (haftalık döngü)

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday-Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### Örnek 2: finans operasyonları (olay tetiklemeli)

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

### Örnek 3: izleme ve uyarılar (sürekli)

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

## Yürüt-doğrula-raporla kalıbı

Sürekli talimatlar, sıkı yürütme disipliniyle birleştirildiğinde en iyi sonucu verir. Bir sürekli talimattaki her görev şu döngüyü izlemelidir:

1. **Yürüt** - Asıl işi yapın (talimatı yalnızca kabul etmekle kalmayın)
2. **Doğrula** - Sonucun doğru olduğunu onaylayın (dosya var, mesaj teslim edildi, veri ayrıştırıldı)
3. **Raporla** - Sahibe ne yapıldığını ve neyin doğrulandığını söyleyin

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

Bu kalıp, en yaygın ajan hata modunu önler: bir görevi tamamlamadan kabul etmek.

## Çok programlı mimari

Birden fazla konuyu yöneten ajanlar için sürekli talimatları net sınırları olan ayrı programlar olarak düzenleyin:

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

Her program şunlara sahip olmalıdır:

- Kendi **tetikleyici sıklığı** (haftalık, aylık, olay odaklı, sürekli)
- Kendi **onay kapıları** (bazı programlar diğerlerinden daha fazla gözetim gerektirir)
- Net **sınırlar** (ajan bir programın nerede bittiğini ve diğerinin nerede başladığını bilmelidir)

## En iyi uygulamalar

### Yapın

- Dar yetkiyle başlayın ve güven oluştukça genişletin
- Yüksek riskli eylemler için açık onay kapıları tanımlayın
- "Ne YAPILMAMALI" bölümlerini ekleyin; sınırlar izinler kadar önemlidir
- Güvenilir zamana dayalı yürütme için Cron işleriyle birleştirin
- Sürekli talimatlara uyulduğunu doğrulamak için ajan günlüklerini haftalık inceleyin
- İhtiyaçlarınız geliştikçe sürekli talimatları güncelleyin; bunlar yaşayan belgelerdir

### Kaçının

- İlk günden geniş yetki vermek ("en iyi olduğunu düşündüğün neyse onu yap")
- Eskalasyon kurallarını atlamak; her programın bir "ne zaman durup sorulacak" maddesine ihtiyacı vardır
- Ajanın sözlü talimatları hatırlayacağını varsaymak; her şeyi dosyaya koyun
- Konuları tek bir programda karıştırmak; ayrı alanlar için ayrı programlar kullanın
- Cron işleriyle uygulamayı unutmak; tetikleyicisiz sürekli talimatlar öneriye dönüşür

## İlgili

- [Otomasyon ve görevler](/tr/automation): tüm otomasyon mekanizmalarına genel bakış.
- [Cron işleri](/tr/automation/cron-jobs): sürekli talimatlar için zamanlama uygulaması.
- [Kancalar](/tr/automation/hooks): ajan yaşam döngüsü olayları için olay odaklı betikler.
- [Webhook'lar](/tr/automation/cron-jobs#webhooks): gelen HTTP olay tetikleyicileri.
- [Ajan çalışma alanı](/tr/concepts/agent-workspace): otomatik enjekte edilen başlangıç dosyalarının tam listesi (`AGENTS.md`, `SOUL.md` vb.) dahil, sürekli talimatların bulunduğu yer.
