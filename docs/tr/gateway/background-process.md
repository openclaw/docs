---
read_when:
    - Arka planda yürütme davranışı ekleme veya değiştirme
    - Uzun süre çalışan exec görevlerinde hata ayıklama
summary: Arka planda exec yürütme ve süreç yönetimi
title: Arka planda yürütme ve süreç aracı
x-i18n:
    generated_at: "2026-07-12T12:15:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b540455797df71dcdb18b0caa5f5088e81ef8823e0ec79364bebad8e6f060f12
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw, kabuk komutlarını `exec` aracı üzerinden çalıştırır ve uzun süre çalışan görevleri bellekte tutar. `process` aracı bu arka plan oturumlarını yönetir.

## exec aracı

Parametreler:

| Parametre    | Açıklama                                                                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`    | Zorunlu. Çalıştırılacak kabuk komutu.                                                                                                                                |
| `workdir`    | Çalışma dizini; varsayılan geçerli çalışma dizinini kullanmak için atlayın.                                                                                           |
| `env`        | Komut için ek ortam değişkenleri.                                                                                                                                    |
| `yieldMs`    | Arka plana almadan önce beklenecek milisaniye (varsayılan 10000).                                                                                                    |
| `background` | Hemen arka planda çalıştırır.                                                                                                                                        |
| `timeout`    | Saniye cinsinden zaman aşımı (varsayılan `tools.exec.timeoutSec`); süre dolduğunda işlemi sonlandırır. Bu çağrı için exec işlemi zaman aşımını devre dışı bırakmak üzere `timeout: 0` ayarlayın. |
| `pty`        | Kullanılabildiğinde sahte terminalde çalıştırır (TTY gerektiren CLI'lar, kodlama ajanları).                                                                            |
| `elevated`   | Yükseltilmiş mod etkinse/izin veriliyorsa korumalı alanın dışında çalıştırır (varsayılan olarak `gateway`; exec hedefi `node` olduğunda `node`).                       |
| `host`       | Exec hedefi: `auto`, `sandbox`, `gateway` veya `node`.                                                                                                               |
| `node`       | `host: "node"` ile kullanılan Node kimliği/adı.                                                                                                                      |

Davranış:

- Ön plandaki çalıştırmalar çıktıyı doğrudan döndürür.
- Arka plana alındığında (açıkça veya `yieldMs` zaman aşımıyla), araç `status: "running"` + `sessionId` ve çıktının kısa bir son bölümünü döndürür.
- Arka plana alınan ve `yieldMs` kullanılan çalıştırmalar, çağrıda açık bir `timeout` belirtilmedikçe `tools.exec.timeoutSec` değerini devralır.
- Çıktı, oturum yoklanana veya temizlenene kadar bellekte kalır.
- `process` aracına izin verilmiyorsa `exec` eşzamanlı çalışır ve `yieldMs`/`background` değerlerini yok sayar.
- Başlatılan exec komutları, bağlama duyarlı kabuk/profil kuralları için `OPENCLAW_SHELL=exec` alır.
- Şimdi başlayan uzun süreli işler için: işi bir kez başlatın ve komut çıktı ürettiğinde veya başarısız olduğunda, etkinse otomatik tamamlanma uyandırmasına güvenin.
- Otomatik tamamlanma uyandırması kullanılamıyorsa veya çıktı üretmeden başarıyla sonlanan bir komut için sessiz başarı onayı gerekiyorsa `process` ile yoklayın.
- Hatırlatıcıları veya gecikmeli takipleri `sleep` döngüleriyle ya da tekrarlanan yoklamalarla taklit etmeyin — gelecekteki işler için cron kullanın.

### Ortam değişkeni geçersiz kılmaları

| Değişken                                 | Etki                                                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_BASH_YIELD_MS`                 | Arka plana almadan önce varsayılan bekleme süresi (ms). Varsayılan 10000; 10-120000 aralığıyla sınırlandırılır.              |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`         | Bellekteki çıktı sınırı (karakter).                                                                                         |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` | Akış başına bekleyen stdout/stderr sınırı (karakter).                                                                       |
| `OPENCLAW_BASH_JOB_TTL_MS`               | Tamamlanan oturumların TTL değeri (ms); 1 dk.-3 sa. aralığıyla sınırlandırılır.                                              |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`    | Yazılabilir arka plan oturumlarının muhtemelen girdi bekliyor olarak işaretlenmesinden önceki boşta çıktı eşiği. Varsayılan 15000. |

### Yapılandırma (ortam değişkeni geçersiz kılmalarına tercih edilir)

| Anahtar                               | Varsayılan | Etki                                                                                              |
| ------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `tools.exec.backgroundMs`             | 10000      | `OPENCLAW_BASH_YIELD_MS` ile aynıdır.                                                             |
| `tools.exec.timeoutSec`               | 1800       | Çağrı başına varsayılan zaman aşımı.                                                              |
| `tools.exec.cleanupMs`                | 1800000    | `OPENCLAW_BASH_JOB_TTL_MS` ile aynıdır.                                                           |
| `tools.exec.notifyOnExit`             | true       | Arka plana alınmış bir exec sonlandığında bir sistem olayını kuyruğa ekler ve heartbeat ister.    |
| `tools.exec.notifyOnExitEmptySuccess` | false      | Çıktısız başarılı arka plan çalıştırmaları için de tamamlanma olaylarını kuyruğa ekler.            |

## Alt işlem köprüleme

Exec/process araçlarının dışında uzun süre çalışan alt işlemler başlatırken (CLI'ın yeniden başlatılması, gateway yardımcıları), sonlandırma sinyallerinin iletilmesi ve dinleyicilerin çıkışta/hata durumunda ayrılması için alt işlem köprü yardımcısını ekleyin. Bu, systemd üzerinde yetim işlemleri önler ve kapatmayı platformlar arasında tutarlı kılar.

## process aracı

Eylemler:

| Eylem       | Etki                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| `list`      | Çalışan + tamamlanmış oturumlar.                                                                        |
| `poll`      | Bir oturumun yeni çıktısını boşaltır (çıkış durumunu da bildirir).                                      |
| `log`       | Birleştirilmiş çıktıyı ve girdi kurtarma ipuçlarını okur. `offset` + `limit` destekler.                  |
| `write`     | stdin gönderir (`data`, isteğe bağlı `eof`).                                                            |
| `send-keys` | PTY destekli bir oturuma açık tuş belirteçleri veya baytlar gönderir.                                   |
| `submit`    | PTY destekli bir oturuma Enter/satır başı gönderir.                                                     |
| `paste`     | İsteğe bağlı olarak köşeli ayraçlı yapıştırma moduna sarılmış düz metin gönderir.                       |
| `kill`      | Bir arka plan oturumunu sonlandırır.                                                                    |
| `clear`     | Tamamlanmış bir oturumu bellekten kaldırır.                                                             |
| `remove`    | Çalışıyorsa sonlandırır; tamamlanmışsa temizler.                                                        |

Notlar:

- Yalnızca arka plana alınmış oturumlar listelenir/kalıcı tutulur — yalnızca bellekte, diskte değil. İşlem yeniden başlatıldığında oturumlar kaybolur.
- Canlı bir arka plan oturumu, işlem sahibi gerçek çıkışı onaylayana kadar işbirlikçi ana makine askıya almayı ve güvenli Gateway yeniden başlatmasını engeller.
- `process remove`, sonlandırma isteğinin hemen ardından çalışan bir oturumu gizleyebilir; askıya alma ve yeniden başlatma, çıkış onaylanana kadar engellenmeye devam eder.
- Oturum günlükleri yalnızca `process poll`/`log` çalıştırıldığında ve araç sonucu sohbet geçmişine kaydedildiğinde sohbet geçmişine eklenir.
- `process` ajan başına kapsamlandırılmıştır; yalnızca o ajan tarafından başlatılan oturumları görür.
- Otomatik tamamlanma uyandırması kullanılamadığında durum, günlükler veya tamamlanma onayı için `poll`/`log` kullanın.
- Etkileşimli bir CLI'ı kurtarmadan önce `log` kullanın; böylece mevcut döküm, stdin durumu ve girdi bekleme ipucu birlikte görünür.
- Girdi veya müdahale gerektiğinde `write`/`send-keys`/`submit`/`paste`/`kill` kullanın.
- `process list`, hızlı taramalar için türetilmiş bir `name` (komut fiili + hedef) içerir.
- `process list`, `poll` ve `log`, yalnızca oturumun hâlâ yazılabilir stdin'i olduğunda ve girdi bekleme eşiğinden (varsayılan 15000 ms, `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`) daha uzun süredir boşta olduğunda `waitingForInput` bildirir.
- `process log`, satır tabanlı `offset`/`limit` kullanır. Her ikisi de atlandığında, sayfalama ipucuyla birlikte son 200 satırı döndürür. `offset` ayarlanıp `limit` ayarlanmadığında, `offset` değerinden sona kadar döndürür (200 ile sınırlandırılmaz).
- `poll` için `timeout`, dönmeden önce en fazla belirtilen milisaniye kadar bekler; 30000 üzerindeki değerler 30000 ile sınırlandırılır.
- Yoklama, isteğe bağlı durum denetimi içindir; bekleme döngüsü zamanlaması için değildir. İş daha sonra yapılacaksa cron kullanın.

## Örnekler

Uzun bir görev çalıştırıp daha sonra yoklayın:

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

PTY tuşlarını gönderin:

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
