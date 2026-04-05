---
read_when:
    - Zamanlanmış işler ve uyandırmalar istiyorsunuz
    - Cron yürütmesini ve günlükleri hata ayıklıyorsunuz
summary: '`openclaw cron` için CLI referansı (arka plan işleri planlama ve çalıştırma)'
title: cron
x-i18n:
    generated_at: "2026-04-05T13:48:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: f74ec8847835f24b3970f1b260feeb69c7ab6c6ec7e41615cbb73f37f14a8112
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gateway zamanlayıcısı için cron işlerini yönetin.

İlgili:

- Cron işleri: [Cron jobs](/tr/automation/cron-jobs)

İpucu: tam komut yüzeyi için `openclaw cron --help` çalıştırın.

Not: izole `cron add` işleri varsayılan olarak `--announce` teslimini kullanır. Çıktıyı
içeride tutmak için `--no-deliver` kullanın. `--deliver`, `--announce` için kullanımdan kaldırılmış
bir takma ad olarak kalır.

Not: cron'a ait izole çalıştırmalar düz metin bir özet bekler ve son gönderim yolu
çalıştırıcıya aittir. `--no-deliver` çalıştırmayı içeride tutar; teslimi
yeniden ajanın mesaj aracına vermez.

Not: tek seferlik (`--at`) işler varsayılan olarak başarıdan sonra silinir. Bunları tutmak için `--keep-after-run` kullanın.

Not: `--session`, `main`, `isolated`, `current` ve `session:<id>` değerlerini destekler.
Oluşturma anında etkin oturuma bağlanmak için `current`, açık bir kalıcı
oturum anahtarı için `session:<id>` kullanın.

Not: tek seferlik CLI işleri için, ofsetsiz `--at` tarih-saat değerleri, ayrıca
`--tz <iana>` geçmediğiniz sürece UTC olarak değerlendirilir; `--tz <iana>` geçerseniz bu yerel duvar saati ilgili saat diliminde yorumlanır.

Not: yinelenen işler artık art arda hatalardan sonra üstel yeniden deneme geri çekilmesi kullanır (30s → 1m → 5m → 15m → 60m), ardından bir sonraki başarılı çalıştırmadan sonra normal zamanlamaya döner.

Not: `openclaw cron run` artık manuel çalıştırma yürütme için kuyruğa alınır alınmaz döner. Başarılı yanıtlar `{ ok: true, enqueued: true, runId }` içerir; nihai sonucu takip etmek için `openclaw cron runs --id <job-id>` kullanın.

Not: `openclaw cron run <job-id>` varsayılan olarak zorla çalıştırır. Eski
"yalnızca vakti geldiyse çalıştır" davranışını korumak için `--due` kullanın.

Not: izole cron turları eski yalnızca onay içeren yanıtları bastırır. İlk
sonuç yalnızca geçici bir durum güncellemesiyse ve nihai yanıttan hiçbir alt ajan
çalıştırması sorumlu değilse, cron teslimden önce gerçek sonuç için bir kez daha istem gönderir.

Not: izole bir cron çalıştırması yalnızca sessiz belirteci (`NO_REPLY` /
`no_reply`) döndürürse, cron doğrudan giden teslimi ve geri dönüş kuyruklu
özet yolunu da bastırır; böylece sohbete hiçbir şey geri gönderilmez.

Not: `cron add|edit --model ...`, iş için seçilen izinli modeli kullanır.
Model izinli değilse, cron uyarır ve bunun yerine işin ajan/varsayılan
model seçimine geri döner. Yapılandırılmış geri dönüş zincirleri yine uygulanır, ancak açık bir iş başına geri dönüş listesi olmayan düz
bir model geçersiz kılması artık gizli ek yeniden deneme hedefi olarak
ajanın birincil modelini eklemez.

Not: izole cron model önceliği önce Gmail hook geçersiz kılması, ardından iş başına
`--model`, sonra saklanan herhangi bir cron-session model geçersiz kılması, ardından normal
ajan/varsayılan seçimidir.

Not: izole cron hızlı mod, çözümlenen canlı model seçimini izler. Model
yapılandırması `params.fastMode` varsayılan olarak uygulanır, ancak saklanan bir oturum `fastMode`
geçersiz kılması yine yapılandırmaya üstün gelir.

Not: izole bir çalıştırma `LiveSessionModelSwitchError` fırlatırsa, cron
yeniden denemeden önce değiştirilen provider/modeli (ve varsa değiştirilen kimlik doğrulama profili geçersiz kılmasını)
kalıcılaştırır. Dış yeniden deneme döngüsü ilk
denemeden sonra 2 model değiştirme yeniden denemesi ile sınırlıdır, ardından sonsuz döngüye girmek yerine durur.

Not: hata bildirimleri önce `delivery.failureDestination`, sonra
genel `cron.failureDestination` kullanır ve açık bir hata hedefi yapılandırılmamışsa son olarak
işin birincil announce hedefine geri döner.

Not: saklama/ayıklama yapılandırma ile denetlenir:

- `cron.sessionRetention` (varsayılan `24h`) tamamlanmış izole çalıştırma oturumlarını ayıklar.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyasını ayıklar.

Yükseltme notu: geçerli teslim/depolama biçiminden önceki eski cron işleriniz varsa
`openclaw doctor --fix` çalıştırın. Doctor artık eski cron alanlarını (`jobId`, `schedule.cron`,
üst düzey teslim alanları, eski `threadId` dahil, payload `provider` teslim takma adları) normalize eder ve
`cron.webhook` yapılandırılmış olduğunda basit `notify: true` webhook geri dönüş işlerini açık webhook teslimine geçirir.

## Yaygın düzenlemeler

Mesajı değiştirmeden teslim ayarlarını güncelleyin:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

İzole bir iş için teslimi devre dışı bırakın:

```bash
openclaw cron edit <job-id> --no-deliver
```

İzole bir iş için hafif bootstrap bağlamını etkinleştirin:

```bash
openclaw cron edit <job-id> --light-context
```

Belirli bir kanala announce edin:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Hafif bootstrap bağlamıyla izole bir iş oluşturun:

```bash
openclaw cron add \
  --name "Hafif sabah özeti" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Gece boyunca olan güncellemeleri özetle." \
  --light-context \
  --no-deliver
```

`--light-context` yalnızca izole agent-turn işleri için geçerlidir. Cron çalıştırmalarında hafif mod, tam çalışma alanı bootstrap kümesini eklemek yerine bootstrap bağlamını boş tutar.

Teslim sahipliği notu:

- Cron'a ait izole işler, son kullanıcıya görünür teslimi her zaman
  cron çalıştırıcısı üzerinden yönlendirir (`announce`, `webhook` veya yalnızca iç `none`).
- Görev herhangi bir dış alıcıya mesaj göndermeyi anıyorsa, ajan
  bunu doğrudan göndermeye çalışmak yerine sonucunda hedeflenen varış yerini
  açıklamalıdır.

## Yaygın yönetici komutları

Manuel çalıştırma:

```bash
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Ajan/oturum yeniden hedefleme:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Teslim ayarlamaları:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Hata teslimi notu:

- `delivery.failureDestination`, izole işler için desteklenir.
- Ana oturum işleri `delivery.failureDestination` değerini yalnızca birincil
  teslim modu `webhook` olduğunda kullanabilir.
- Herhangi bir hata hedefi ayarlamazsanız ve iş zaten bir
  kanala announce ediyorsa, hata bildirimleri aynı announce hedefini yeniden kullanır.
