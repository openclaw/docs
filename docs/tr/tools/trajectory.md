---
read_when:
- Debugging why an agent answered, failed, or called tools a certain way
- Bir OpenClaw oturumu için destek paketi dışa aktarma
- İstem bağlamını, araç çağrılarını, çalışma zamanı hatalarını veya kullanım meta
  verilerini inceleme
- Trajectory yakalamayı devre dışı bırakma veya yerini değiştirme
summary: Bir OpenClaw ajan oturumunda hata ayıklama için sansürlenmiş trajectory paketlerini
  dışa aktarın
title: Trajectory paketleri
x-i18n:
  generated_at: '2026-04-24T09:39:39Z'
  refreshed_at: '2026-04-28T05:23:26Z'
  model: gpt-5.4
  provider: openai
  source_hash: be799691e0c3375efd24e3bec9ce8f9ab22f01a0f8a9ce4288b7e6e952c29da4
  source_path: tools/trajectory.md
  workflow: 15
---

Trajectory yakalama, OpenClaw'ın oturum başına uçuş kaydedicisidir. Her ajan çalıştırması için
yapılandırılmış bir zaman çizelgesi kaydeder; ardından `/export-trajectory`, geçerli
oturumu sansürlenmiş bir destek paketi olarak paketler.

Bunu şu gibi soruları yanıtlamanız gerektiğinde kullanın:

- Modele hangi istem, sistem istemi ve araçlar gönderildi?
- Hangi transkript mesajları ve araç çağrıları bu yanıta yol açtı?
- Çalışma zaman aşımına mı uğradı, iptal mi oldu, sıkıştırıldı mı veya sağlayıcı hatasına mı çarptı?
- Hangi model, Plugin'ler, Skills ve çalışma zamanı ayarları etkindi?
- Sağlayıcı hangi kullanım ve prompt-cache meta verilerini döndürdü?

## Hızlı başlangıç

Etkin oturumda şunu gönderin:

```text
/export-trajectory
```

Takma ad:

```text
/trajectory
```

OpenClaw paketi çalışma alanı altında yazar:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Göreli bir çıktı dizini adı seçebilirsiniz:

```text
/export-trajectory bug-1234
```

Özel yol `.openclaw/trajectory-exports/` içinde çözümlenir. Mutlak
yollar ve `~` yolları reddedilir.

## Erişim

Trajectory dışa aktarma, sahip düzeyinde bir komuttur. Gönderen, kanal için normal komut
yetkilendirme denetimlerini ve sahip denetimlerini geçmelidir.

## Neler kaydedilir

Trajectory yakalama, OpenClaw ajan çalıştırmaları için varsayılan olarak açıktır.

Çalışma zamanı olayları şunları içerir:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

Transkript olayları da etkin oturum dalından yeniden oluşturulur:

- kullanıcı mesajları
- yardımcı mesajları
- araç çağrıları
- araç sonuçları
- Compaction'lar
- model değişiklikleri
- etiketler ve özel oturum girdileri

Olaylar şu şema işaretçisiyle JSON Lines olarak yazılır:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Paket dosyaları

Dışa aktarılan bir paket şunları içerebilir:

| Dosya                 | İçerik                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `manifest.json`       | Paket şeması, kaynak dosyalar, olay sayıları ve oluşturulan dosya listesi                    |
| `events.jsonl`        | Sıralı çalışma zamanı ve transkript zaman çizelgesi                                           |
| `session-branch.json` | Sansürlenmiş etkin transkript dalı ve oturum başlığı                                          |
| `metadata.json`       | OpenClaw sürümü, OS/çalışma zamanı, model, yapılandırma anlık görüntüsü, Plugin'ler, Skills ve istem meta verileri |
| `artifacts.json`      | Son durum, hatalar, kullanım, prompt cache, Compaction sayısı, yardımcı metni ve araç meta verileri |
| `prompts.json`        | Gönderilen istemler ve seçilmiş istem oluşturma ayrıntıları                                   |
| `system-prompt.txt`   | Yakalandığında en son derlenmiş sistem istemi                                                 |
| `tools.json`          | Yakalandığında modele gönderilen araç tanımları                                               |

`manifest.json`, o pakette bulunan dosyaları listeler. Oturum ilgili çalışma zamanı verilerini yakalamadıysa
bazı dosyalar atlanır.

## Yakalama konumu

Varsayılan olarak çalışma zamanı trajectory olayları, oturum dosyasının yanına yazılır:

```text
<session>.trajectory.jsonl
```

OpenClaw ayrıca oturumun yanına best-effort bir işaretçi dosyası da yazar:

```text
<session>.trajectory-path.json
```

Çalışma zamanı trajectory sidecar dosyalarını ayrılmış bir
dizinde saklamak için `OPENCLAW_TRAJECTORY_DIR` ayarlayın:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Bu değişken ayarlandığında OpenClaw, o
dizinde oturum kimliği başına bir JSONL dosyası yazar.

## Yakalamayı devre dışı bırakın

OpenClaw'ı başlatmadan önce `OPENCLAW_TRAJECTORY=0` ayarlayın:

```bash
export OPENCLAW_TRAJECTORY=0
```

Bu, çalışma zamanı trajectory yakalamayı devre dışı bırakır. `/export-trajectory` yine de
transkript dalını dışa aktarabilir, ancak derlenmiş bağlam,
sağlayıcı artefaktları ve istem meta verileri gibi yalnızca çalışma zamanına ait dosyalar eksik olabilir.

## Gizlilik ve sınırlar

Trajectory paketleri, herkese açık paylaşım için değil, destek ve hata ayıklama için tasarlanmıştır.
OpenClaw, dışa aktarma dosyalarını yazmadan önce hassas değerleri sansürler:

- kimlik bilgileri ve gizli anahtar benzeri olduğu bilinen yük alanları
- görsel verileri
- yerel durum yolları
- `$WORKSPACE_DIR` ile değiştirilen çalışma alanı yolları
- algılandığında ev dizini yolları

Dışa aktarıcı ayrıca girdi boyutunu da sınırlar:

- çalışma zamanı sidecar dosyaları: 50 MiB
- oturum dosyaları: 50 MiB
- çalışma zamanı olayları: 200,000
- toplam dışa aktarılan olaylar: 250,000
- tekil çalışma zamanı olay satırları 256 KiB üstünde kırpılır

Paketleri ekibinizin dışında paylaşmadan önce gözden geçirin. Sansürleme best-effort şeklindedir
ve uygulamaya özgü her gizli anahtarı bilemez.

## Sorun giderme

Dışa aktarmada çalışma zamanı olayı yoksa:

- OpenClaw'ın `OPENCLAW_TRAJECTORY=0` olmadan başlatıldığını doğrulayın
- `OPENCLAW_TRAJECTORY_DIR` değerinin yazılabilir bir dizine işaret edip etmediğini denetleyin
- oturumda bir mesaj daha çalıştırın, ardından yeniden dışa aktarın
- `runtimeEventCount` için `manifest.json` dosyasını inceleyin

Komut çıktı yolunu reddediyorsa:

- `bug-1234` gibi göreli bir ad kullanın
- `/tmp/...` veya `~/...` vermeyin
- dışa aktarmayı `.openclaw/trajectory-exports/` içinde tutun

Dışa aktarma bir boyut hatasıyla başarısız olursa, oturum veya sidecar dışa aktarma güvenlik sınırlarını aşmıştır. Yeni bir oturum başlatın veya daha küçük bir yeniden üretim dışa aktarın.

## İlgili

- [Diffs](/tr/tools/diffs)
- [Oturum yönetimi](/tr/concepts/session)
- [Exec aracı](/tr/tools/exec)
