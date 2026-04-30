---
read_when:
    - Arka planda yürütme davranışı ekleme veya değiştirme
    - Uzun süre çalışan exec görevlerinde hata ayıklama
summary: Arka planda exec yürütme ve süreç yönetimi
title: Arka planda yürütme ve süreç aracı
x-i18n:
    generated_at: "2026-04-30T09:19:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0df76d7a09184bf87f5568d800bcee683620a76c092f34451d987db4ef1a1eaf
    source_path: gateway/background-process.md
    workflow: 16
---

# Arka Planda Exec + Process Aracı

OpenClaw kabuk komutlarını `exec` aracı üzerinden çalıştırır ve uzun süren görevleri bellekte tutar. `process` aracı bu arka plan oturumlarını yönetir.

## exec aracı

Ana parametreler:

- `command` (gerekli)
- `yieldMs` (varsayılan 10000): bu gecikmeden sonra otomatik olarak arka plana al
- `background` (bool): hemen arka plana al
- `timeout` (saniye, varsayılan `tools.exec.timeoutSec`): bu zaman aşımından sonra süreci sonlandır; yalnızca o çağrı için exec süreç zaman aşımını devre dışı bırakmak üzere `timeout: 0` ayarlayın
- `elevated` (bool): yükseltilmiş mod etkinse/izinliyse sandbox dışında çalıştır (varsayılan olarak `gateway`, veya exec hedefi `node` olduğunda `node`)
- Gerçek bir TTY mi gerekiyor? `pty: true` ayarlayın.
- `workdir`, `env`

Davranış:

- Ön plan çalıştırmaları çıktıyı doğrudan döndürür.
- Arka plana alındığında (açıkça veya zaman aşımıyla), araç `status: "running"` + `sessionId` ve kısa bir kuyruk döndürür.
- Arka plan ve `yieldMs` çalıştırmaları, çağrı açık bir `timeout` sağlamadıkça `tools.exec.timeoutSec` değerini miras alır.
- Çıktı, oturum yoklanana veya temizlenene kadar bellekte tutulur.
- `process` aracına izin verilmiyorsa, `exec` eşzamanlı çalışır ve `yieldMs`/`background` değerlerini yok sayar.
- Başlatılan exec komutları, bağlama duyarlı kabuk/profil kuralları için `OPENCLAW_SHELL=exec` alır.
- Şimdi başlayan uzun süreli işler için, işi bir kez başlatın ve etkin olduğunda ve komut çıktı ürettiğinde veya başarısız olduğunda otomatik
  tamamlanma uyandırmasına güvenin.
- Otomatik tamamlanma uyandırması kullanılamıyorsa veya çıktısız temiz çıkmış bir komut için sessiz başarı
  onayı gerekiyorsa, tamamlanmayı onaylamak için `process` kullanın.
- Anımsatıcıları veya gecikmeli takipleri `sleep` döngüleri ya da tekrarlanan
  yoklamayla taklit etmeyin; gelecekteki işler için cron kullanın.

## Alt süreç köprüleme

exec/process araçları dışında uzun süreli alt süreçler başlatırken (örneğin, CLI yeniden başlatmaları veya gateway yardımcıları), sonlandırma sinyallerinin iletilmesi ve dinleyicilerin çıkışta/hatada ayrılması için alt süreç köprü yardımcısını ekleyin. Bu, systemd üzerinde sahipsiz süreçleri önler ve kapatma davranışını platformlar arasında tutarlı tutar.

Ortam geçersiz kılmaları:

- `PI_BASH_YIELD_MS`: varsayılan yield (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: bellek içi çıktı sınırı (karakter)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: akış başına bekleyen stdout/stderr sınırı (karakter)
- `PI_BASH_JOB_TTL_MS`: tamamlanmış oturumlar için TTL (ms, 1 dk-3 sa ile sınırlı)

Yapılandırma (tercih edilen):

- `tools.exec.backgroundMs` (varsayılan 10000)
- `tools.exec.timeoutSec` (varsayılan 1800)
- `tools.exec.cleanupMs` (varsayılan 1800000)
- `tools.exec.notifyOnExit` (varsayılan true): arka plana alınmış bir exec çıktığında bir sistem olayı kuyruğa al + Heartbeat iste.
- `tools.exec.notifyOnExitEmptySuccess` (varsayılan false): true olduğunda, çıktı üretmeyen başarılı arka plan çalıştırmaları için de tamamlanma olaylarını kuyruğa al.

## process aracı

Eylemler:

- `list`: çalışan + tamamlanmış oturumlar
- `poll`: bir oturum için yeni çıktıyı boşalt (çıkış durumunu da bildirir)
- `log`: birleştirilmiş çıktıyı oku (`offset` + `limit` destekler)
- `write`: stdin gönder (`data`, isteğe bağlı `eof`)
- `send-keys`: PTY destekli bir oturuma açık anahtar token'ları veya baytlar gönder
- `submit`: PTY destekli bir oturuma Enter / satır başı gönder
- `paste`: düz metin gönder, isteğe bağlı olarak parantezli yapıştırma moduna sarılmış
- `kill`: bir arka plan oturumunu sonlandır
- `clear`: tamamlanmış bir oturumu bellekten kaldır
- `remove`: çalışıyorsa sonlandır, aksi halde tamamlandıysa temizle

Notlar:

- Yalnızca arka plana alınmış oturumlar listelenir/bellekte kalıcı tutulur.
- Süreç yeniden başlatıldığında oturumlar kaybolur (disk kalıcılığı yoktur).
- Oturum günlükleri yalnızca `process poll/log` çalıştırırsanız ve araç sonucu kaydedilirse sohbet geçmişine kaydedilir.
- `process` ajan başına kapsamlıdır; yalnızca o ajan tarafından başlatılan oturumları görür.
- Durum, günlükler, sessiz başarı onayı veya otomatik tamamlanma uyandırması kullanılamadığında
  tamamlanma onayı için `poll` / `log` kullanın.
- Girdi veya müdahale gerektiğinde `write` / `send-keys` / `submit` / `paste` / `kill`
  kullanın.
- `process list`, hızlı taramalar için türetilmiş bir `name` (komut fiili + hedef) içerir.
- `process log`, satır tabanlı `offset`/`limit` kullanır.
- Hem `offset` hem de `limit` atlandığında, son 200 satırı döndürür ve bir sayfalama ipucu içerir.
- `offset` sağlandığında ve `limit` atlandığında, `offset` konumundan sona kadar döndürür (200 ile sınırlandırılmaz).
- Yoklama, isteğe bağlı durum içindir; bekleme döngüsü zamanlaması için değildir. İş daha sonra
  gerçekleşmeliyse, bunun yerine cron kullanın.

## Örnekler

Uzun bir görev çalıştırın ve daha sonra yoklayın:

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
