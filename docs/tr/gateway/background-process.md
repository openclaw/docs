---
read_when:
    - Arka plan exec davranışını ekleme veya değiştirme
    - Uzun süre çalışan exec görevlerinde hata ayıklama
summary: Arka planda exec yürütme ve işlem yönetimi
title: Arka plan exec ve işlem aracı
x-i18n:
    generated_at: "2026-05-06T09:11:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7677dcb1cb28b4922a034855550696f839e64cdd349b39d09fbf2c00acf8cec1
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw, kabuk komutlarını `exec` aracı üzerinden çalıştırır ve uzun süre çalışan görevleri bellekte tutar. `process` aracı bu arka plan oturumlarını yönetir.

## exec aracı

Temel parametreler:

- `command` (zorunlu)
- `yieldMs` (varsayılan 10000): bu gecikmeden sonra otomatik olarak arka plana al
- `background` (bool): hemen arka plana al
- `timeout` (saniye, varsayılan `tools.exec.timeoutSec`): bu zaman aşımından sonra süreci sonlandırır; `timeout: 0` yalnızca o çağrı için exec süreç zaman aşımını devre dışı bırakmak üzere ayarlanmalıdır
- `elevated` (bool): yükseltilmiş mod etkin/izinli ise sandbox dışında çalıştır (`gateway` varsayılan, exec hedefi `node` olduğunda `node`)
- Gerçek bir TTY mi gerekiyor? `pty: true` ayarlayın.
- `workdir`, `env`

Davranış:

- Ön planda çalışanlar çıktıyı doğrudan döndürür.
- Arka plana alındığında (açıkça veya zaman aşımıyla), araç `status: "running"` + `sessionId` ve kısa bir son bölüm döndürür.
- Arka plan ve `yieldMs` çalıştırmaları, çağrı açık bir `timeout` sağlamadığı sürece `tools.exec.timeoutSec` değerini devralır.
- Çıktı, oturum sorgulanana veya temizlenene kadar bellekte tutulur.
- `process` aracına izin verilmezse, `exec` eşzamanlı çalışır ve `yieldMs`/`background` değerlerini yok sayar.
- Başlatılan exec komutları, bağlama duyarlı kabuk/profil kuralları için `OPENCLAW_SHELL=exec` alır.
- Şimdi başlayan uzun süreli işler için işi bir kez başlatın ve etkin olduğunda, komut çıktı ürettiğinde veya başarısız olduğunda otomatik tamamlanma uyandırmasına güvenin.
- Otomatik tamamlanma uyandırması yoksa veya çıktısız temiz şekilde çıkan bir komut için sessiz başarı onayı gerekiyorsa, tamamlanmayı doğrulamak için `process` kullanın.
- Hatırlatıcıları veya gecikmeli takipleri `sleep` döngüleri ya da tekrarlı sorgulama ile taklit etmeyin; gelecekteki işler için cron kullanın.

## Alt süreç köprüleme

exec/process araçları dışında uzun süre çalışan alt süreçler başlatırken (örneğin CLI yeniden başlatmaları veya gateway yardımcıları), sonlandırma sinyallerinin iletilmesi ve dinleyicilerin çıkış/hata sırasında ayrılması için alt süreç köprü yardımcısını bağlayın. Bu, systemd üzerinde yetim süreçleri önler ve kapatma davranışını platformlar arasında tutarlı tutar.

Ortam geçersiz kılmaları:

- `PI_BASH_YIELD_MS`: varsayılan bekletme (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: bellek içi çıktı sınırı (karakter)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: akış başına bekleyen stdout/stderr sınırı (karakter)
- `PI_BASH_JOB_TTL_MS`: tamamlanmış oturumlar için TTL (ms, 1 dk-3 sa ile sınırlı)

Yapılandırma (tercih edilen):

- `tools.exec.backgroundMs` (varsayılan 10000)
- `tools.exec.timeoutSec` (varsayılan 1800)
- `tools.exec.cleanupMs` (varsayılan 1800000)
- `tools.exec.notifyOnExit` (varsayılan true): arka plana alınmış bir exec çıktığında bir sistem olayını kuyruğa alır + Heartbeat ister.
- `tools.exec.notifyOnExitEmptySuccess` (varsayılan false): true olduğunda, çıktı üretmeyen başarılı arka plan çalıştırmaları için de tamamlanma olaylarını kuyruğa alır.

## process aracı

Eylemler:

- `list`: çalışan + tamamlanmış oturumlar
- `poll`: bir oturum için yeni çıktıyı boşaltır (çıkış durumunu da bildirir)
- `log`: birleştirilmiş çıktıyı okur (`offset` + `limit` destekler)
- `write`: stdin gönderir (`data`, isteğe bağlı `eof`)
- `send-keys`: PTY destekli bir oturuma açık anahtar belirteçleri veya baytlar gönderir
- `submit`: PTY destekli bir oturuma Enter / carriage return gönderir
- `paste`: değişmez metin gönderir, isteğe bağlı olarak bracketed paste moduna sarar
- `kill`: bir arka plan oturumunu sonlandırır
- `clear`: tamamlanmış bir oturumu bellekten kaldırır
- `remove`: çalışıyorsa sonlandırır, aksi halde tamamlanmışsa temizler

Notlar:

- Yalnızca arka plana alınmış oturumlar listelenir/bellekte kalıcı tutulur.
- Süreç yeniden başlatıldığında oturumlar kaybolur (disk kalıcılığı yoktur).
- Oturum günlükleri yalnızca `process poll/log` çalıştırırsanız ve araç sonucu kaydedilirse sohbet geçmişine kaydedilir.
- `process` her agent için kapsamlanmıştır; yalnızca o agent tarafından başlatılan oturumları görür.
- Durum, günlükler, sessiz başarı onayı veya otomatik tamamlanma uyandırması kullanılamadığında tamamlanma onayı için `poll` / `log` kullanın.
- Girdi veya müdahale gerektiğinde `write` / `send-keys` / `submit` / `paste` / `kill` kullanın.
- `process list`, hızlı taramalar için türetilmiş bir `name` (komut fiili + hedef) içerir.
- `process log`, satır tabanlı `offset`/`limit` kullanır.
- Hem `offset` hem de `limit` atlandığında, son 200 satırı döndürür ve bir sayfalama ipucu içerir.
- `offset` sağlanıp `limit` atlandığında, `offset` değerinden sona kadar döndürür (200 ile sınırlanmaz).
- Sorgulama, isteğe bağlı durum içindir; bekleme döngüsü zamanlaması için değildir. İş daha sonra gerçekleşmeliyse bunun yerine cron kullanın.

## Örnekler

Uzun bir görev çalıştırın ve daha sonra sorgulayın:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
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

Değişmez metin yapıştırın:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## İlgili

- [Exec aracı](/tr/tools/exec)
- [Exec onayları](/tr/tools/exec-approvals)
