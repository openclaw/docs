---
read_when:
    - Zamanlanmış işler ve uyandırmalar istiyorsunuz
    - Cron yürütmesini ve günlükleri hata ayıklıyorsunuz
summary: '`openclaw cron` için CLI başvurusu (arka plan işlerini zamanlama ve çalıştırma)'
title: Cron
x-i18n:
    generated_at: "2026-04-26T11:25:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55cadcf73550367d399b7ca78e842f12a8113f2ec8749f59dadf2bbb5f8417ae
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gateway zamanlayıcısı için Cron işlerini yönetin.

İlgili:

- Cron işleri: [Cron işleri](/tr/automation/cron-jobs)

İpucu: tam komut yüzeyi için `openclaw cron --help` komutunu çalıştırın.

Not: `openclaw cron list` ve `openclaw cron show <job-id>`, çözümlenmiş teslimat yolunu önizler. `channel: "last"` için önizleme, yolun ana/mevcut oturumdan çözümlenip çözümlenmediğini veya kapalı güvenlik modeliyle başarısız olup olmayacağını gösterir.

Not: yalıtılmış `cron add` işleri varsayılan olarak `--announce` teslimatını kullanır. Çıktıyı içerde tutmak için `--no-deliver` kullanın. `--deliver`, `--announce` için kullanım dışı bırakılmış bir diğer ad olarak kalır.

Not: yalıtılmış cron sohbet teslimatı ortaktır. `--announce`, son yanıt için çalıştırıcı geri dönüş teslimatıdır; `--no-deliver` bu geri dönüşü devre dışı bırakır ancak bir sohbet yolu mevcut olduğunda ajanın `message` aracını kaldırmaz.

Not: tek seferlik (`--at`) işler varsayılan olarak başarıdan sonra silinir. Saklamak için `--keep-after-run` kullanın.

Not: `--session`, `main`, `isolated`, `current` ve `session:<id>` değerlerini destekler. Oluşturma anındaki etkin oturuma bağlamak için `current`, açık kalıcı oturum anahtarı için `session:<id>` kullanın.

Not: `--session isolated`, her çalıştırma için yeni bir transkript/oturum kimliği oluşturur. Güvenli tercihler ve kullanıcı tarafından açıkça seçilen model/auth geçersiz kılmaları taşınabilir, ancak ortam konuşma bağlamı taşınmaz: kanal/grup yönlendirmesi, gönderme/kuyruk ilkesi, yükseltme, kaynak ve ACP çalışma zamanı bağlaması yeni yalıtılmış çalıştırma için sıfırlanır.

Not: tek seferlik CLI işleri için, zaman dilimi ofsetsiz `--at` tarih-saat değerleri, ayrıca `--tz <iana>` geçmediğiniz sürece UTC olarak değerlendirilir; `--tz <iana>` geçtiğinizde bu yerel duvar saati verilen zaman diliminde yorumlanır.

Not: yinelenen işler artık art arda hatalardan sonra üstel yeniden deneme geri çekilmesi kullanır (30s → 1m → 5m → 15m → 60m), ardından bir sonraki başarılı çalıştırmadan sonra normal zamanlamaya döner.

Not: `openclaw cron run` artık manuel çalıştırma yürütme için kuyruğa alınır alınmaz döner. Başarılı yanıtlar `{ ok: true, enqueued: true, runId }` içerir; nihai sonucu takip etmek için `openclaw cron runs --id <job-id>` kullanın.

Not: `openclaw cron run <job-id>` varsayılan olarak zorla çalıştırır. Eski "yalnızca zamanı geldiyse çalıştır" davranışını korumak için `--due` kullanın.

Not: yalıtılmış cron turları eski onay-only yanıtlarını bastırır. İlk sonuç yalnızca geçici bir durum güncellemesiyse ve nihai yanıttan hiçbir alt ajan çalıştırması sorumlu değilse cron, teslimattan önce gerçek sonuç için bir kez daha yeniden istem yapar.

Not: yalıtılmış bir cron çalıştırması yalnızca sessiz token'ı (`NO_REPLY` / `no_reply`) döndürürse cron, doğrudan giden teslimatı ve geri dönüş kuyruklu özet yolunu da bastırır; böylece sohbete hiçbir şey gönderilmez.

Not: `cron add|edit --model ...`, iş için seçilen izinli modeli kullanır. Model izinli değilse cron uyarır ve bunun yerine işin ajan/varsayılan model seçimine geri döner. Yapılandırılmış geri dönüş zincirleri yine uygulanır, ancak açık iş başına geri dönüş listesi olmayan düz model geçersiz kılması artık ajan birincil modelini gizli ek yeniden deneme hedefi olarak eklemez.

Not: yalıtılmış cron model önceliği önce Gmail-hook geçersiz kılması, sonra iş başına `--model`, sonra kullanıcı tarafından seçilmiş kayıtlı cron-oturumu model geçersiz kılması, sonra normal ajan/varsayılan seçimidir.

Not: yalıtılmış cron hızlı modu çözümlenen canlı model seçimini izler. Model yapılandırması `params.fastMode` varsayılan olarak uygulanır, ancak kayıtlı oturum `fastMode` geçersiz kılması yine de yapılandırmaya üstün gelir.

Not: yalıtılmış bir çalıştırma `LiveSessionModelSwitchError` fırlatırsa cron, yeniden denemeden önce aktif çalıştırma için değiştirilen sağlayıcıyı/modeli (ve varsa değiştirilen auth profil geçersiz kılmasını) kalıcılaştırır. Dış yeniden deneme döngüsü, ilk denemeden sonra 2 değiştirme yeniden denemesiyle sınırlıdır; ardından sonsuz döngüye girmek yerine iptal eder.

Not: başarısızlık bildirimleri önce `delivery.failureDestination`, sonra genel `cron.failureDestination` kullanır ve açık bir başarısızlık hedefi yapılandırılmamışsa son olarak işin birincil duyuru hedefine geri döner.

Not: saklama/budama yapılandırmada denetlenir:

- `cron.sessionRetention` (varsayılan `24h`) tamamlanmış yalıtılmış çalıştırma oturumlarını budar.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`, `~/.openclaw/cron/runs/<jobId>.jsonl` dosyasını budar.

Yükseltme notu: mevcut teslimat/depolama biçiminden önceki eski cron işleriniz varsa `openclaw doctor --fix` çalıştırın. Doctor artık eski cron alanlarını (`jobId`, `schedule.cron`, eski `threadId` dahil üst düzey teslimat alanları, yük `provider` teslimat diğer adları) normalleştirir ve `cron.webhook` yapılandırıldığında basit `notify: true` webhook geri dönüş işlerini açık webhook teslimatına geçirir.

## Yaygın düzenlemeler

Mesajı değiştirmeden teslimat ayarlarını güncelleyin:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Yalıtılmış bir iş için teslimatı devre dışı bırakın:

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

`--light-context` yalnızca yalıtılmış ajan-turu işleri için uygulanır. Cron çalıştırmaları için hafif mod, tam çalışma alanı bootstrap kümesini enjekte etmek yerine bootstrap bağlamını boş tutar.

Teslimat sahipliği notu:

- Yalıtılmış cron sohbet teslimatı ortaktır. Bir sohbet yolu mevcut olduğunda ajan doğrudan `message` aracıyla gönderebilir.
- `announce`, yalnızca ajan çözümlenen hedefe doğrudan göndermediyse son yanıtı geri dönüş olarak teslim eder. `webhook`, tamamlanmış yükü bir URL'ye POST eder. `none`, çalıştırıcı geri dönüş teslimatını devre dışı bırakır.
- Etkin bir sohbetten oluşturulan hatırlatıcılar, geri dönüş duyuru teslimatı için canlı sohbet teslimat hedefini korur. Dahili oturum anahtarları küçük harfli olabilir; bunları Matrix oda kimlikleri gibi büyük/küçük harfe duyarlı sağlayıcı kimlikleri için doğruluk kaynağı olarak kullanmayın.

## Yaygın yönetici komutları

Manuel çalıştırma:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` girdileri, amaçlanan cron hedefi, çözümlenen hedef, message-tool gönderimleri, geri dönüş kullanımı ve teslim edildi durumu ile birlikte teslimat tanılamalarını içerir.

Ajan/oturum yeniden hedefleme:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Teslimat ayarlamaları:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Başarısızlık teslimatı notu:

- `delivery.failureDestination`, yalıtılmış işler için desteklenir.
- Ana oturum işleri `delivery.failureDestination` öğesini yalnızca birincil teslimat modu `webhook` olduğunda kullanabilir.
- Herhangi bir başarısızlık hedefi ayarlamazsanız ve iş zaten bir kanala duyuru yapıyorsa, başarısızlık bildirimleri aynı duyuru hedefini yeniden kullanır.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
