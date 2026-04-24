---
read_when:
    - Arka plan `exec` davranışını ekleme veya değiştirme
    - Uzun süren `exec` görevlerinde hata ayıklama
summary: Arka plan `exec` yürütmesi ve süreç yönetimi
title: Arka plan `exec` ve süreç aracı
x-i18n:
    generated_at: "2026-04-24T09:07:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6dbf6fd0ee39a053fda0a910e95827e9d0e31dcdfbbf542b6ba5d1d63aa48dc
    source_path: gateway/background-process.md
    workflow: 15
---

# Arka Plan Exec + Süreç Aracı

OpenClaw, kabuk komutlarını `exec` aracı üzerinden çalıştırır ve uzun süren görevleri bellekte tutar. `process` aracı bu arka plan oturumlarını yönetir.

## exec aracı

Temel parametreler:

- `command` (zorunlu)
- `yieldMs` (varsayılan 10000): bu gecikmeden sonra otomatik arka plan
- `background` (bool): hemen arka plana al
- `timeout` (saniye, varsayılan 1800): bu zaman aşımından sonra süreci öldür
- `elevated` (bool): yükseltilmiş mod etkinse/izinliyse sandbox dışında çalıştır (`gateway` varsayılanıdır veya exec hedefi `node` ise `node`)
- Gerçek bir TTY mi gerekiyor? `pty: true` ayarlayın.
- `workdir`, `env`

Davranış:

- Ön plan çalıştırmaları çıktıyı doğrudan döndürür.
- Arka plana alındığında (açıkça veya zaman aşımıyla), araç `status: "running"` + `sessionId` ve kısa bir son çıktı parçası döndürür.
- Çıktı, oturum yoklanana veya temizlenene kadar bellekte tutulur.
- `process` aracına izin verilmiyorsa `exec` eşzamanlı çalışır ve `yieldMs`/`background` değerlerini yok sayar.
- Başlatılan exec komutları, bağlama duyarlı kabuk/profil kuralları için `OPENCLAW_SHELL=exec` alır.
- Şimdi başlayan uzun süreli işler için işi bir kez başlatın ve etkin olduğunda komut çıktı ürettiğinde veya başarısız olduğunda otomatik
  tamamlama uyandırmasına güvenin.
- Otomatik tamamlama uyandırması kullanılamıyorsa veya çıktı vermeden temiz şekilde tamamlanan bir komut için sessiz başarı
  onayına ihtiyacınız varsa tamamlanmayı doğrulamak için `process`
  kullanın.
- `sleep` döngüleri veya yinelenen
  yoklamalarla anımsatıcıları ya da gecikmeli takipleri taklit etmeyin; gelecekteki işler için Cron kullanın.

## Alt süreç köprüleme

Uzun süren alt süreçleri exec/process araçları dışında başlatırken (örneğin, CLI yeniden başlatmaları veya gateway yardımcıları), sonlandırma sinyallerinin iletilmesi ve çıkış/hata durumunda dinleyicilerin ayrılması için alt süreç köprü yardımcısını ekleyin. Bu, systemd üzerinde sahipsiz süreçleri önler ve platformlar arasında kapanış davranışını tutarlı tutar.

Ortam geçersiz kılmaları:

- `PI_BASH_YIELD_MS`: varsayılan yield (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: bellek içi çıktı üst sınırı (karakter)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: akış başına bekleyen stdout/stderr üst sınırı (karakter)
- `PI_BASH_JOB_TTL_MS`: bitmiş oturumlar için TTL (ms, 1 dk–3 sa ile sınırlıdır)

Yapılandırma (tercih edilen):

- `tools.exec.backgroundMs` (varsayılan 10000)
- `tools.exec.timeoutSec` (varsayılan 1800)
- `tools.exec.cleanupMs` (varsayılan 1800000)
- `tools.exec.notifyOnExit` (varsayılan true): arka plana alınmış bir exec çıktığında sistem olayı sıraya alır + Heartbeat ister.
- `tools.exec.notifyOnExitEmptySuccess` (varsayılan false): true olduğunda, çıktı üretmeyen başarılı arka plan exec çalıştırmaları için de tamamlama olaylarını sıraya alır.

## process aracı

Eylemler:

- `list`: çalışan + bitmiş oturumlar
- `poll`: bir oturum için yeni çıktıyı boşaltır (çıkış durumunu da bildirir)
- `log`: birikmiş çıktıyı okur (`offset` + `limit` destekler)
- `write`: stdin gönderir (`data`, isteğe bağlı `eof`)
- `send-keys`: PTY destekli bir oturuma açık tuş token'ları veya baytlar gönderir
- `submit`: PTY destekli bir oturuma Enter / carriage return gönderir
- `paste`: isteğe bağlı olarak bracketed paste moduna sarılmış düz metin gönderir
- `kill`: bir arka plan oturumunu sonlandırır
- `clear`: bitmiş bir oturumu bellekten kaldırır
- `remove`: çalışıyorsa öldürür, aksi halde bittiyse temizler

Notlar:

- Yalnızca arka plana alınmış oturumlar listelenir/bellekte tutulur.
- Oturumlar süreç yeniden başlatıldığında kaybolur (diskte kalıcılık yoktur).
- Oturum günlükleri yalnızca `process poll/log` çalıştırır ve araç sonucu kaydedilirse sohbet geçmişine kaydedilir.
- `process`, aracı başına kapsamlıdır; yalnızca o aracı tarafından başlatılmış oturumları görür.
- Durum, günlükler, sessiz başarı onayı veya
  otomatik tamamlama uyandırması kullanılamadığında tamamlama onayı için `poll` / `log` kullanın.
- Girdi veya müdahale gerektiğinde `write` / `send-keys` / `submit` / `paste` / `kill` kullanın.
- `process list`, hızlı taramalar için türetilmiş bir `name` (komut fiili + hedef) içerir.
- `process log`, satır tabanlı `offset`/`limit` kullanır.
- Hem `offset` hem `limit` atlandığında son 200 satırı döndürür ve bir sayfalama ipucu içerir.
- `offset` verilmiş ve `limit` atlanmışsa `offset` noktasından sona kadar döndürür (200 ile sınırlanmaz).
- Yoklama, bekleme döngüsü zamanlaması için değil, isteğe bağlı durum içindir. İşin
  daha sonra gerçekleşmesi gerekiyorsa bunun yerine Cron kullanın.

## Örnekler

Uzun bir görevi çalıştırın ve sonra yoklayın:

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

Düz metin yapıştırın:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## İlgili

- [Exec aracı](/tr/tools/exec)
- [Exec onayları](/tr/tools/exec-approvals)
