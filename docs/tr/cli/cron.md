---
read_when:
    - Zamanlanmış işler ve uyandırmalar istiyorsunuz
    - Cron yürütmesi ve günlüklerinde hata ayıklıyorsunuz
summary: '`openclaw cron` için CLI başvurusu (arka plan işlerini zamanlama ve çalıştırma)'
title: Cron
x-i18n:
    generated_at: "2026-04-24T09:01:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3f5c262092b9b5b821ec824bc02dbbd806936d91f1d03ac6eb789f7e71ffc07
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gateway zamanlayıcısı için Cron işlerini yönetin.

İlgili:

- Cron işleri: [Cron jobs](/tr/automation/cron-jobs)

İpucu: tam komut yüzeyi için `openclaw cron --help` çalıştırın.

Not: `openclaw cron list` ve `openclaw cron show <job-id>`, çözülmüş teslim rotasını önizler. `channel: "last"` için önizleme, rotanın ana/geçerli oturumdan çözülüp çözülmediğini veya kapalı başarısız olup olmayacağını gösterir.

Not: yalıtılmış `cron add` işleri varsayılan olarak `--announce` teslimini kullanır. Çıktıyı içerde tutmak için `--no-deliver` kullanın. `--deliver`, `--announce` için kullanımdan kaldırılmış bir takma ad olarak kalır.

Not: yalıtılmış Cron sohbet teslimi paylaşımlıdır. `--announce`, son yanıt için çalıştırıcı fallback teslimidir; `--no-deliver` bu fallback'i devre dışı bırakır ancak bir sohbet rotası mevcut olduğunda agent'in `message` aracını kaldırmaz.

Not: tek seferlik (`--at`) işler varsayılan olarak başarıdan sonra silinir. Bunları tutmak için `--keep-after-run` kullanın.

Not: `--session`, `main`, `isolated`, `current` ve `session:<id>` destekler.
Oluşturma anında etkin oturuma bağlanmak için `current`, açık kalıcı oturum anahtarı içinse `session:<id>` kullanın.

Not: tek seferlik CLI işleri için, ofsetsiz `--at` tarih-saat değerleri siz ayrıca `--tz <iana>` geçmediğiniz sürece UTC olarak değerlendirilir; `--tz <iana>` verilirse bu yerel duvar saati zamanı belirtilen saat diliminde yorumlanır.

Not: yineleyen işler artık ardışık hatalardan sonra üstel yeniden deneme backoff'u kullanır (30 sn → 1 dk → 5 dk → 15 dk → 60 dk), ardından bir sonraki başarılı çalışmadan sonra normal zamanlamaya döner.

Not: `openclaw cron run`, manuel çalıştırma yürütme için kuyruğa alınır alınmaz artık döner. Başarılı yanıtlar `{ ok: true, enqueued: true, runId }` içerir; nihai sonucu izlemek için `openclaw cron runs --id <job-id>` kullanın.

Not: `openclaw cron run <job-id>` varsayılan olarak zorla çalıştırır. Eski "yalnızca zamanı geldiyse çalıştır" davranışını korumak için `--due` kullanın.

Not: yalıtılmış Cron turları, eski yalnızca onay niteliğindeki yanıtları bastırır. İlk sonuç yalnızca geçici bir durum güncellemesiyse ve nihai yanıttan sorumlu hiçbir alt agent çalıştırması yoksa, Cron teslimden önce gerçek sonuç için bir kez yeniden istem gönderir.

Not: yalıtılmış bir Cron çalıştırması yalnızca sessiz token'ı (`NO_REPLY` /
`no_reply`) döndürürse, Cron doğrudan giden teslimi ve fallback kuyruğa alınmış özet yolunu da bastırır; böylece sohbete hiçbir şey gönderilmez.

Not: `cron add|edit --model ...`, iş için seçilen o izinli modeli kullanır.
Model izinli değilse, Cron uyarı verir ve bunun yerine işin agent/varsayılan
model seçimine geri düşer. Yapılandırılmış fallback zincirleri yine uygulanır, ancak açık iş başına fallback listesi olmayan düz bir model geçersiz kılması artık gizli ek yeniden deneme hedefi olarak agent birincil modelini eklemez.

Not: yalıtılmış Cron model önceliği önce Gmail-hook geçersiz kılmasıdır, sonra iş başına
`--model`, ardından kayıtlı herhangi bir cron-session model geçersiz kılması, sonra da normal
agent/varsayılan seçim gelir.

Not: yalıtılmış Cron hızlı modu, çözülmüş canlı model seçimini izler. Model
yapılandırması `params.fastMode` varsayılan olarak uygulanır, ancak kayıtlı bir oturum `fastMode`
geçersiz kılması yine yapılandırmaya üstün gelir.

Not: yalıtılmış bir çalıştırma `LiveSessionModelSwitchError` fırlatırsa, Cron
yeniden denemeden önce değiştirilen sağlayıcıyı/modeli (ve varsa değiştirilen auth profili geçersiz kılmasını) kalıcı hale getirir. Dış yeniden deneme döngüsü, ilk denemeden sonra 2 model değiştirme yeniden denemesiyle sınırlandırılır; ardından sonsuza kadar döngüye girmek yerine durur.

Not: hata bildirimleri önce `delivery.failureDestination`, ardından genel
`cron.failureDestination` kullanır ve açık bir hata hedefi yapılandırılmamışsa son olarak işin birincil
duyuru hedefine geri düşer.

Not: saklama/budama yapılandırmada denetlenir:

- `cron.sessionRetention` (varsayılan `24h`) tamamlanmış yalıtılmış çalıştırma oturumlarını budar.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyasını budar.

Yükseltme notu: geçerli teslim/depo biçiminden önceki eski Cron işleriniz varsa,
`openclaw doctor --fix` çalıştırın. Doctor artık eski Cron alanlarını (`jobId`, `schedule.cron`,
üst düzey teslim alanları, eski `threadId` dahil, payload `provider` teslim takma adları) normalize eder ve `cron.webhook`
yapılandırıldığında basit `notify: true` Webhook fallback işlerini açık Webhook teslimine taşır.

## Yaygın düzenlemeler

Mesajı değiştirmeden teslim ayarlarını güncelleyin:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Yalıtılmış bir iş için teslimi devre dışı bırakın:

```bash
openclaw cron edit <job-id> --no-deliver
```

Yalıtılmış bir iş için hafif bootstrap bağlamını etkinleştirin:

```bash
openclaw cron edit <job-id> --light-context
```

Belirli bir kanala duyurun:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Hafif bootstrap bağlamıyla yalıtılmış bir iş oluşturun:

```bash
openclaw cron add \
  --name "Hafif sabah özeti" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Gece boyunca olan güncellemeleri özetle." \
  --light-context \
  --no-deliver
```

`--light-context` yalnızca yalıtılmış agent-turn işleri için geçerlidir. Cron çalıştırmaları için hafif mod, tam çalışma alanı bootstrap kümesini enjekte etmek yerine bootstrap bağlamını boş tutar.

Teslim sahipliği notu:

- Yalıtılmış Cron sohbet teslimi paylaşımlıdır. Bir sohbet rotası mevcut olduğunda
  agent, `message` aracıyla doğrudan gönderebilir.
- `announce`, yalnızca agent çözülmüş hedefe doğrudan göndermediyse son yanıtı fallback olarak teslim eder. `webhook`, bitmiş payload'u bir URL'ye gönderir.
  `none`, çalıştırıcı fallback teslimini devre dışı bırakır.

## Yaygın yönetici komutları

Manuel çalıştırma:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` girdileri, amaçlanan Cron hedefi,
çözülmüş hedef, message-tool gönderimleri, fallback kullanımı ve teslim durumu ile birlikte teslim tanılamalarını içerir.

Agent/oturum yeniden hedefleme:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Teslim ince ayarları:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Hata teslimi notu:

- `delivery.failureDestination`, yalıtılmış işler için desteklenir.
- Ana oturum işleri `delivery.failureDestination` alanını yalnızca birincil
  teslim modu `webhook` olduğunda kullanabilir.
- Hiçbir hata hedefi ayarlamazsanız ve iş zaten bir
  kanala duyuru yapıyorsa, hata bildirimleri aynı duyuru hedefini yeniden kullanır.

## İlgili

- [CLI reference](/tr/cli)
- [Scheduled tasks](/tr/automation/cron-jobs)
