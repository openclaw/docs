---
read_when:
    - Arka plan exec davranışını ekleme veya değiştirme
    - Uzun süre çalışan exec görevlerinde hata ayıklama
summary: Arka plan exec yürütmesi ve süreç yönetimi
title: Arka Plan Exec ve Process Aracı
x-i18n:
    generated_at: "2026-04-05T13:52:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4398e2850f6f050944f103ad637cd9f578e9cc7fb478bc5cd5d972c92289b831
    source_path: gateway/background-process.md
    workflow: 15
---

# Arka Plan Exec + Process Aracı

OpenClaw kabuk komutlarını `exec` aracı üzerinden çalıştırır ve uzun süre çalışan görevleri bellekte tutar. `process` aracı bu arka plan oturumlarını yönetir.

## exec aracı

Temel parametreler:

- `command` (zorunlu)
- `yieldMs` (varsayılan 10000): bu gecikmeden sonra otomatik olarak arka plana alır
- `background` (bool): hemen arka plana al
- `timeout` (saniye, varsayılan 1800): bu zaman aşımından sonra süreci sonlandır
- `elevated` (bool): elevated mode etkinse/izin veriliyorsa sandbox dışında çalıştır (`exec` hedefi `node` olduğunda varsayılan olarak `gateway` veya `node`)
- Gerçek bir TTY mi gerekiyor? `pty: true` ayarlayın.
- `workdir`, `env`

Davranış:

- Ön plan çalıştırmaları çıktıyı doğrudan döndürür.
- Arka plana alındığında (açıkça veya zaman aşımıyla), araç `status: "running"` + `sessionId` ve kısa bir tail döndürür.
- Çıktı, oturum yoklanana veya temizlenene kadar bellekte tutulur.
- `process` aracına izin verilmiyorsa `exec` eşzamanlı çalışır ve `yieldMs`/`background` değerlerini yok sayar.
- Başlatılan exec komutları, bağlama duyarlı shell/profile kuralları için `OPENCLAW_SHELL=exec` alır.
- Şimdi başlayan uzun süreli işler için, işi bir kez başlatın ve etkin olduğunda komut çıktı ürettiğinde veya başarısız olduğunda otomatik tamamlama uyandırmasına güvenin.
- Otomatik tamamlama uyandırması kullanılamıyorsa veya çıktı üretmeden temiz şekilde tamamlanan bir komut için sessiz başarı onayı gerekiyorsa, tamamlanmayı doğrulamak için `process` kullanın.
- `sleep` döngüleri veya tekrarlanan yoklama ile hatırlatıcıları ya da gecikmeli takipleri taklit etmeyin; gelecekteki işler için cron kullanın.

## Alt süreç köprüleme

Uzun süre çalışan alt süreçleri exec/process araçları dışında başlatırken (örneğin CLI yeniden başlatmaları veya gateway yardımcıları), sonlandırma sinyallerinin iletilmesi ve çıkış/hata durumunda dinleyicilerin ayrılması için child-process bridge yardımcı işlevini ekleyin. Bu, systemd altında sahipsiz süreçleri önler ve kapanış davranışını platformlar arasında tutarlı tutar.

Ortam değişkeni geçersiz kılmaları:

- `PI_BASH_YIELD_MS`: varsayılan yield (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: bellek içi çıktı sınırı (karakter)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: akış başına bekleyen stdout/stderr sınırı (karakter)
- `PI_BASH_JOB_TTL_MS`: tamamlanmış oturumlar için TTL (ms, 1 dk–3 sa ile sınırlı)

Yapılandırma (tercih edilir):

- `tools.exec.backgroundMs` (varsayılan 10000)
- `tools.exec.timeoutSec` (varsayılan 1800)
- `tools.exec.cleanupMs` (varsayılan 1800000)
- `tools.exec.notifyOnExit` (varsayılan true): arka plana alınmış bir exec çıktığında bir sistem olayı kuyruğa ekler + heartbeat ister.
- `tools.exec.notifyOnExitEmptySuccess` (varsayılan false): true olduğunda, çıktı üretmemiş başarılı arka plan çalıştırmaları için de tamamlama olaylarını kuyruğa ekler.

## process aracı

Eylemler:

- `list`: çalışan + tamamlanmış oturumlar
- `poll`: bir oturum için yeni çıktıyı boşaltır (ayrıca çıkış durumunu da bildirir)
- `log`: birikmiş çıktıyı okur (`offset` + `limit` destekler)
- `write`: stdin gönderir (`data`, isteğe bağlı `eof`)
- `send-keys`: PTY destekli bir oturuma açık anahtar token'ları veya baytlar gönderir
- `submit`: PTY destekli bir oturuma Enter / carriage return gönderir
- `paste`: isteğe bağlı olarak bracketed paste mode ile sarılmış düz metin gönderir
- `kill`: bir arka plan oturumunu sonlandırır
- `clear`: tamamlanmış bir oturumu bellekten kaldırır
- `remove`: çalışıyorsa sonlandırır, tamamlanmışsa temizler

Notlar:

- Yalnızca arka plana alınmış oturumlar listelenir/bellekte kalıcı tutulur.
- Süreç yeniden başlatıldığında oturumlar kaybolur (diske kalıcılık yok).
- Oturum günlükleri yalnızca `process poll/log` çalıştırırsanız ve araç sonucu kaydedilirse sohbet geçmişine kaydedilir.
- `process`, aracı başına kapsamlıdır; yalnızca o aracı tarafından başlatılan oturumları görür.
- Durum, günlükler, sessiz başarı onayı veya otomatik tamamlama uyandırması kullanılamadığında tamamlama onayı için `poll` / `log` kullanın.
- Girdi veya müdahale gerektiğinde `write` / `send-keys` / `submit` / `paste` / `kill` kullanın.
- `process list`, hızlı taramalar için türetilmiş bir `name` içerir (komut fiili + hedef).
- `process log`, satır tabanlı `offset`/`limit` kullanır.
- Hem `offset` hem `limit` atlandığında son 200 satırı döndürür ve sayfalama ipucu içerir.
- `offset` verilip `limit` verilmediğinde `offset` değerinden sona kadar döndürür (200 ile sınırlandırılmaz).
- Yoklama, bekleme döngüsü zamanlaması için değil, isteğe bağlı durum kontrolü içindir. İşin daha sonra yapılması gerekiyorsa bunun yerine cron kullanın.

## Örnekler

Uzun bir görev çalıştır ve sonra yokla:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Hemen arka planda başlat:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

stdin gönder:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

PTY tuşları gönder:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Geçerli satırı gönder:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Düz metin yapıştır:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```
