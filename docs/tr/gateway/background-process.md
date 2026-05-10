---
read_when:
    - Arka plan yürütme davranışı ekleme veya değiştirme
    - Uzun süre çalışan exec görevlerinde hata ayıklama
summary: Arka planda exec çalıştırma ve süreç yönetimi
title: Arka plan exec ve süreç aracı
x-i18n:
    generated_at: "2026-05-10T19:34:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95fb986cf0c07ef3d054189ce2838b441ae24f07703f8edc1ddb8aca3a58b300
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw, kabuk komutlarını `exec` aracı üzerinden çalıştırır ve uzun süren görevleri bellekte tutar. `process` aracı bu arka plan oturumlarını yönetir.

## exec aracı

Temel parametreler:

- `command` (zorunlu)
- `yieldMs` (varsayılan 10000): bu gecikmeden sonra otomatik olarak arka plana al
- `background` (bool): hemen arka plana al
- `timeout` (saniye, varsayılan `tools.exec.timeoutSec`): bu zaman aşımından sonra süreci sonlandır; `timeout: 0` değerini yalnızca o çağrı için exec süreci zaman aşımını devre dışı bırakmak üzere ayarlayın
- `elevated` (bool): yükseltilmiş mod etkin/izinli ise sandbox dışında çalıştır (varsayılan olarak `gateway`, exec hedefi `node` olduğunda ise `node`)
- Gerçek bir TTY mi gerekiyor? `pty: true` ayarlayın.
- `workdir`, `env`

Davranış:

- Ön plan çalıştırmaları çıktıyı doğrudan döndürür.
- Arka plana alındığında (açıkça veya zaman aşımıyla), araç `status: "running"` + `sessionId` ve kısa bir son bölüm döndürür.
- Arka plan ve `yieldMs` çalıştırmaları, çağrı açık bir `timeout` sağlamadığı sürece `tools.exec.timeoutSec` değerini devralır.
- Çıktı, oturum sorgulanana veya temizlenene kadar bellekte tutulur.
- `process` aracına izin verilmiyorsa, `exec` eşzamanlı çalışır ve `yieldMs`/`background` değerlerini yok sayar.
- Başlatılan exec komutları, bağlama duyarlı kabuk/profil kuralları için `OPENCLAW_SHELL=exec` alır.
- Şimdi başlayan uzun süreli işler için işi bir kez başlatın ve etkin olduğunda, komut çıktı ürettiğinde veya başarısız olduğunda otomatik
  tamamlama uyandırmasına güvenin.
- Otomatik tamamlama uyandırması kullanılamıyorsa ya da çıktı olmadan temiz şekilde sonlanan bir komut için sessiz başarı
  onayına ihtiyacınız varsa, tamamlanmayı onaylamak için `process`
  kullanın.
- Hatırlatıcıları veya gecikmeli takipleri `sleep` döngüleri ya da tekrarlı
  sorgulamalarla taklit etmeyin; gelecekteki işler için Cron kullanın.

## Alt süreç köprüleme

exec/process araçları dışında uzun süreli alt süreçler başlatırken (örneğin CLI yeniden başlatmaları veya Gateway yardımcıları), sonlandırma sinyallerinin iletilmesi ve çıkış/hata durumunda dinleyicilerin ayrılması için alt süreç köprü yardımcısını ekleyin. Bu, systemd üzerinde sahipsiz süreçleri önler ve kapatma davranışını platformlar arasında tutarlı tutar.

Ortam geçersiz kılmaları:

- `PI_BASH_YIELD_MS`: varsayılan yield (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: bellek içi çıktı sınırı (karakter)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: akış başına bekleyen stdout/stderr sınırı (karakter)
- `PI_BASH_JOB_TTL_MS`: tamamlanan oturumlar için TTL (ms, 1d-3s ile sınırlı)
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`: yazılabilir arka plan oturumları büyük olasılıkla girdi bekliyor olarak işaretlenmeden önceki boşta çıktı eşiği (varsayılan 15000 ms)

Yapılandırma (tercih edilen):

- `tools.exec.backgroundMs` (varsayılan 10000)
- `tools.exec.timeoutSec` (varsayılan 1800)
- `tools.exec.cleanupMs` (varsayılan 1800000)
- `tools.exec.notifyOnExit` (varsayılan true): arka plana alınmış bir exec çıktığında bir sistem olayı kuyruğa al + Heartbeat iste.
- `tools.exec.notifyOnExitEmptySuccess` (varsayılan false): true olduğunda, çıktı üretmeyen başarılı arka plan çalıştırmaları için de tamamlama olaylarını kuyruğa al.

## process aracı

Eylemler:

- `list`: çalışan + tamamlanan oturumlar
- `poll`: bir oturum için yeni çıktıyı boşalt (çıkış durumunu da bildirir)
- `log`: birleştirilmiş çıktıyı oku ve girdi kurtarma ipuçlarını göster (`offset` + `limit` destekler)
- `write`: stdin gönder (`data`, isteğe bağlı `eof`)
- `send-keys`: PTY destekli bir oturuma açık anahtar belirteçleri veya baytlar gönder
- `submit`: PTY destekli bir oturuma Enter / carriage return gönder
- `paste`: isteğe bağlı olarak bracketed paste modunda sarılmış düz metin gönder
- `kill`: bir arka plan oturumunu sonlandır
- `clear`: tamamlanmış bir oturumu bellekten kaldır
- `remove`: çalışıyorsa sonlandır, aksi halde tamamlandıysa temizle

Notlar:

- Yalnızca arka plana alınmış oturumlar listelenir/bellekte kalıcı tutulur.
- Süreç yeniden başlatıldığında oturumlar kaybolur (diskte kalıcılık yoktur).
- Oturum günlükleri yalnızca `process poll/log` çalıştırırsanız ve araç sonucu kaydedilirse sohbet geçmişine kaydedilir.
- `process` ajan başına kapsama alınır; yalnızca o ajan tarafından başlatılan oturumları görür.
- Durum, günlükler, sessiz başarı onayı veya otomatik tamamlama uyandırması kullanılamadığında
  tamamlama onayı için `poll` / `log` kullanın.
- Etkileşimli bir CLI'yı kurtarmadan önce `log` kullanın; böylece mevcut transkript,
  stdin durumu ve girdi bekleme ipucu birlikte görünür.
- Girdi veya müdahale gerektiğinde `write` / `send-keys` / `submit` / `paste` / `kill`
  kullanın.
- `process list`, hızlı taramalar için türetilmiş bir `name` (komut fiili + hedef) içerir.
- `process list`, `poll` ve `log`, `waitingForInput` değerini yalnızca
  oturumun hâlâ yazılabilir stdin'i olduğunda ve girdi bekleme eşiğinden daha uzun
  süre boşta kaldığında bildirir.
- `process log`, satır tabanlı `offset`/`limit` kullanır.
- Hem `offset` hem de `limit` atlandığında, son 200 satırı döndürür ve bir sayfalama ipucu içerir.
- `offset` sağlandığında ve `limit` atlandığında, `offset` değerinden sona kadar döndürür (200 ile sınırlandırılmaz).
- Sorgulama, isteğe bağlı durum içindir; bekleme döngüsü zamanlaması için değildir. İş daha sonra
  yapılacaksa bunun yerine Cron kullanın.

## Örnekler

Uzun bir görev çalıştırın ve daha sonra sorgulayın:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Girdi göndermeden önce etkileşimli bir oturumu inceleyin:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

Hemen arka planda başlatın:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

stdin gönderin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

PTY tuşları gönderin:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Geçerli satırı gönderin:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Düz metin yapıştırın:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## İlgili

- [Exec aracı](/tr/tools/exec)
- [Exec onayları](/tr/tools/exec-approvals)
