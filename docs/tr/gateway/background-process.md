---
read_when:
    - Arka plan exec davranışı ekleme veya değiştirme
    - Uzun süre çalışan exec görevlerinde hata ayıklama
summary: Arka plan exec yürütmesi ve süreç yönetimi
title: Arka planda yürütme ve süreç aracı
x-i18n:
    generated_at: "2026-06-28T00:32:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5822c1e26b0144c5216ae6e59e279ccc506cf4c0a42b8cd6c386f535fe458bd3
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw, shell komutlarını `exec` aracı üzerinden çalıştırır ve uzun süren görevleri bellekte tutar. `process` aracı bu arka plan oturumlarını yönetir.

## exec aracı

Temel parametreler:

- `command` (gerekli)
- `yieldMs` (varsayılan 10000): bu gecikmeden sonra otomatik olarak arka plana al
- `background` (bool): hemen arka plana al
- `timeout` (saniye, varsayılan `tools.exec.timeoutSec`): bu zaman aşımından sonra süreci sonlandır; yalnızca o çağrı için exec süreç zaman aşımını devre dışı bırakmak üzere `timeout: 0` ayarlayın
- `elevated` (bool): yükseltilmiş mod etkin/izinli ise sandbox dışında çalıştır (`gateway` varsayılandır veya exec hedefi `node` olduğunda `node`)
- Gerçek bir TTY mi gerekiyor? `pty: true` ayarlayın.
- `workdir`, `env`

Davranış:

- Ön plan çalıştırmaları çıktıyı doğrudan döndürür.
- Arka plana alındığında (açıkça veya zaman aşımıyla), araç `status: "running"` + `sessionId` ve kısa bir son çıktı döndürür.
- Arka plan ve `yieldMs` çalıştırmaları, çağrı açık bir `timeout` sağlamadığı sürece `tools.exec.timeoutSec` değerini devralır.
- Çıktı, oturum yoklanana veya temizlenene kadar bellekte tutulur.
- `process` aracına izin verilmiyorsa, `exec` eşzamanlı çalışır ve `yieldMs`/`background` değerlerini yok sayar.
- Başlatılan exec komutları, bağlama duyarlı shell/profil kuralları için `OPENCLAW_SHELL=exec` alır.
- Şimdi başlayan uzun süreli işler için işi bir kez başlatın ve etkin olduğunda komut çıktı ürettiğinde veya başarısız olduğunda otomatik
  tamamlanma uyandırmasına güvenin.
- Otomatik tamamlanma uyandırması kullanılamıyorsa veya çıktı üretmeden temiz şekilde çıkan bir komut için sessiz başarı
  onayına ihtiyacınız varsa, tamamlanmayı doğrulamak için `process`
  kullanın.
- Hatırlatıcıları veya gecikmeli takipleri `sleep` döngüleri ya da tekrarlı
  yoklamayla taklit etmeyin; gelecekteki işler için Cron kullanın.

## Alt süreç köprüleme

exec/process araçları dışında uzun süreli alt süreçler başlatırken (örneğin, CLI yeniden başlatmaları veya Gateway yardımcıları), sonlandırma sinyallerinin iletilmesi ve dinleyicilerin çıkışta/hatada ayrılması için alt süreç köprü yardımcısını ekleyin. Bu, systemd üzerinde yetim süreçleri önler ve kapatma davranışını platformlar arasında tutarlı tutar.

Ortam geçersiz kılmaları:

- `OPENCLAW_BASH_YIELD_MS`: varsayılan bekleme (ms)
- `OPENCLAW_BASH_MAX_OUTPUT_CHARS`: bellek içi çıktı sınırı (karakter)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: akış başına bekleyen stdout/stderr sınırı (karakter)
- `OPENCLAW_BASH_JOB_TTL_MS`: tamamlanan oturumlar için TTL (ms, 1 dk-3 sa ile sınırlı)
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`: yazılabilir arka plan oturumları büyük olasılıkla girdi bekliyor olarak işaretlenmeden önceki boşta çıktı eşiği (varsayılan 15000 ms)

Yapılandırma (tercih edilen):

- `tools.exec.backgroundMs` (varsayılan 10000)
- `tools.exec.timeoutSec` (varsayılan 1800)
- `tools.exec.cleanupMs` (varsayılan 1800000)
- `tools.exec.notifyOnExit` (varsayılan true): arka plana alınmış bir exec çıktığında bir sistem olayını kuyruğa alır + heartbeat ister.
- `tools.exec.notifyOnExitEmptySuccess` (varsayılan false): true olduğunda, çıktı üretmeyen başarılı arka plan çalıştırmaları için de tamamlanma olaylarını kuyruğa alır.

## process aracı

Eylemler:

- `list`: çalışan + tamamlanan oturumlar
- `poll`: bir oturum için yeni çıktıyı boşalt (çıkış durumunu da bildirir)
- `log`: birleştirilmiş çıktıyı oku ve girdi kurtarma ipuçlarını göster (`offset` + `limit` destekler)
- `write`: stdin gönder (`data`, isteğe bağlı `eof`)
- `send-keys`: PTY destekli bir oturuma açık anahtar belirteçleri veya baytlar gönder
- `submit`: PTY destekli bir oturuma Enter / satır başı gönder
- `paste`: düz metin gönder, isteğe bağlı olarak bracketed paste modunda sarılı
- `kill`: bir arka plan oturumunu sonlandır
- `clear`: tamamlanmış bir oturumu bellekten kaldır
- `remove`: çalışıyorsa sonlandır, aksi halde tamamlandıysa temizle

Notlar:

- Yalnızca arka plana alınmış oturumlar listelenir/bellekte kalıcı tutulur.
- Oturumlar süreç yeniden başlatıldığında kaybolur (disk kalıcılığı yoktur).
- Oturum günlükleri yalnızca `process poll/log` çalıştırırsanız ve araç sonucu kaydedilirse sohbet geçmişine kaydedilir.
- `process` ajan başına kapsamlanır; yalnızca o ajan tarafından başlatılan oturumları görür.
- Durum, günlükler, sessiz başarı onayı veya otomatik tamamlanma uyandırması kullanılamadığında
  tamamlanma onayı için `poll` / `log` kullanın.
- Etkileşimli bir CLI'ı kurtarmadan önce `log` kullanın; böylece mevcut döküm,
  stdin durumu ve girdi bekleme ipucu birlikte görünür.
- Girdi veya müdahale gerektiğinde `write` / `send-keys` / `submit` / `paste` / `kill`
  kullanın.
- `process list`, hızlı taramalar için türetilmiş bir `name` (komut fiili + hedef) içerir.
- `process list`, `poll` ve `log`, `waitingForInput` değerini yalnızca
  oturumun hâlâ yazılabilir stdin'i olduğunda ve girdi bekleme eşiğinden daha uzun süre
  boşta kaldığında bildirir.
- `process log`, satır tabanlı `offset`/`limit` kullanır.
- Hem `offset` hem `limit` atlandığında, son 200 satırı döndürür ve bir sayfalama ipucu içerir.
- `offset` sağlanıp `limit` atlandığında, `offset` değerinden sona kadar döndürür (200 ile sınırlandırılmaz).
- Yoklama isteğe bağlı durum içindir, bekleme döngüsü zamanlama için değildir. İş daha sonra
  gerçekleşmeliyse bunun yerine Cron kullanın.

## Örnekler

Uzun bir görev çalıştırın ve daha sonra yoklayın:

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
