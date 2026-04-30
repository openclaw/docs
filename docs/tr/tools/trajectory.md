---
read_when:
    - Bir ajanın neden belirli bir şekilde yanıt verdiğini, başarısız olduğunu veya araçları çağırdığını hata ayıklama
    - OpenClaw oturumu için destek paketi dışa aktarma
    - İstem bağlamını, araç çağrılarını, çalışma zamanı hatalarını veya kullanım meta verilerini araştırma
    - Yörünge yakalamayı devre dışı bırakma veya yeniden konumlandırma
summary: OpenClaw ajan oturumunda hata ayıklamak için gizli verileri çıkarılmış izlem paketlerini dışa aktar
title: Yörünge paketleri
x-i18n:
    generated_at: "2026-04-30T09:51:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dad01b3662d5e75b7626eb7ed3c3ac2dce4e3a7db2ba5952d7086c721151d1f
    source_path: tools/trajectory.md
    workflow: 16
---

Trajectory yakalama, OpenClaw'ın oturum başına çalışan uçuş kayıt cihazıdır. Her agent çalıştırması için
yapılandırılmış bir zaman çizelgesi kaydeder, ardından `/export-trajectory` geçerli
oturumu redakte edilmiş bir destek paketine dönüştürür.

Şunun gibi soruları yanıtlamanız gerektiğinde kullanın:

- Modele hangi istem, sistem istemi ve araçlar gönderildi?
- Hangi transcript mesajları ve araç çağrıları bu yanıta yol açtı?
- Çalıştırma zaman aşımına mı uğradı, iptal mi edildi, compact mı edildi, yoksa bir sağlayıcı hatasına mı takıldı?
- Hangi model, plugin'ler, Skills ve çalışma zamanı ayarları etkindi?
- Sağlayıcı hangi kullanım ve istem önbelleği metadata'sını döndürdü?

Canlı bir Gateway sorunu için geniş kapsamlı bir destek raporu gönderiyorsanız,
[`/diagnostics`](/tr/gateway/diagnostics#chat-command) ile başlayın. Diagnostics, sanitize edilmiş
Gateway paketini toplar ve OpenAI Codex harness oturumları için onaydan sonra
Codex geri bildirimini OpenAI sunucularına da gönderebilir. Özellikle ayrıntılı
oturum bazlı istem, araç ve transcript zaman çizelgesine ihtiyacınız olduğunda
`/export-trajectory` kullanın.

## Hızlı başlangıç

Etkin oturumda bunu gönderin:

```text
/export-trajectory
```

Takma ad:

```text
/trajectory
```

OpenClaw paketi çalışma alanının altına yazar:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Göreli bir çıktı dizini adı seçebilirsiniz:

```text
/export-trajectory bug-1234
```

Özel yol `.openclaw/trajectory-exports/` içinde çözümlenir. Mutlak
yollar ve `~` yolları reddedilir.

Trajectory paketleri istemler, model mesajları, araç şemaları, araç
sonuçları, çalışma zamanı olayları ve yerel yollar içerebilir. Bu nedenle chat slash komutu
her seferinde exec onayından geçer. Paketi oluşturmayı amaçladığınızda dışa aktarımı
bir kez onaylayın; allow-all kullanmayın. Grup sohbetlerinde OpenClaw,
trajectory ayrıntılarını paylaşılan odaya geri göndermek yerine onay istemini
ve dışa aktarma sonucunu sahibine özel olarak gönderir.

Yerel inceleme veya destek iş akışları için onaylı komut yolunu doğrudan da
çalıştırabilirsiniz:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Erişim

Trajectory dışa aktarma bir sahip komutudur. Gönderen, kanal için normal komut
yetkilendirme kontrollerinden ve sahip kontrollerinden geçmelidir.

## Neler kaydedilir

Trajectory yakalama, OpenClaw agent çalıştırmaları için varsayılan olarak açıktır.

Çalışma zamanı olayları şunları içerir:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- Kaynak model, sonraki model, hata nedeni/ayrıntısı, zincir konumu ve fallback'in ilerleyip ilerlemediği, başarılı olup olmadığı veya zinciri tüketip tüketmediği dahil `model.fallback_step`
- `model.completed`
- `trace.artifacts`
- `session.ended`

Transcript olayları da etkin oturum dalından yeniden oluşturulur:

- kullanıcı mesajları
- assistant mesajları
- araç çağrıları
- araç sonuçları
- compaction'lar
- model değişiklikleri
- etiketler ve özel oturum girdileri

Olaylar, şu şema işaretçisiyle JSON Lines olarak yazılır:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Paket dosyaları

Dışa aktarılan bir paket şunları içerebilir:

| Dosya                 | İçerik                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Paket şeması, kaynak dosyalar, olay sayıları ve oluşturulan dosya listesi                     |
| `events.jsonl`        | Sıralı çalışma zamanı ve transcript zaman çizelgesi                                           |
| `session-branch.json` | Redakte edilmiş etkin transcript dalı ve oturum başlığı                                       |
| `metadata.json`       | OpenClaw sürümü, işletim sistemi/çalışma zamanı, model, config anlık görüntüsü, plugin'ler, Skills ve istem metadata'sı |
| `artifacts.json`      | Son durum, hatalar, kullanım, istem önbelleği, compaction sayısı, assistant metni ve araç metadata'sı |
| `prompts.json`        | Gönderilen istemler ve seçilen istem oluşturma ayrıntıları                                    |
| `system-prompt.txt`   | Yakalandığında en son derlenmiş sistem istemi                                                  |
| `tools.json`          | Yakalandığında modele gönderilen araç tanımları                                                |

`manifest.json`, o pakette bulunan dosyaları listeler. Oturum ilgili çalışma zamanı
verilerini yakalamadıysa bazı dosyalar atlanır.

## Yakalama konumu

Varsayılan olarak çalışma zamanı trajectory olayları oturum dosyasının yanına yazılır:

```text
<session>.trajectory.jsonl
```

OpenClaw ayrıca oturumun yanına best-effort bir işaretçi dosyası yazar:

```text
<session>.trajectory-path.json
```

Çalışma zamanı trajectory sidecar'larını özel bir dizinde saklamak için
`OPENCLAW_TRAJECTORY_DIR` ayarlayın:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Bu değişken ayarlandığında OpenClaw, o dizinde oturum kimliği başına bir JSONL
dosyası yazar.

Oturum bakımı, sahip oldukları oturum girdisi budandığında, sınırlandırıldığında
veya oturumlar disk bütçesi tarafından çıkarıldığında trajectory sidecar'larını kaldırır. Oturumlar dizini dışındaki
çalışma zamanı dosyaları yalnızca işaretçi hedefi hâlâ o oturuma ait olduğunu
kanıtladığında kaldırılır.

## Yakalamayı devre dışı bırakma

OpenClaw'ı başlatmadan önce `OPENCLAW_TRAJECTORY=0` ayarlayın:

```bash
export OPENCLAW_TRAJECTORY=0
```

Bu, çalışma zamanı trajectory yakalamayı devre dışı bırakır. `/export-trajectory` hâlâ
transcript dalını dışa aktarabilir, ancak derlenmiş bağlam,
sağlayıcı artifacts'ları ve istem metadata'sı gibi yalnızca çalışma zamanına ait dosyalar eksik olabilir.

## Gizlilik ve sınırlar

Trajectory paketleri genel paylaşıma değil, destek ve hata ayıklamaya yönelik tasarlanmıştır.
OpenClaw, dışa aktarma dosyalarını yazmadan önce hassas değerleri redakte eder:

- kimlik bilgileri ve bilinen secret benzeri payload alanları
- görüntü verileri
- yerel durum yolları
- `$WORKSPACE_DIR` ile değiştirilen çalışma alanı yolları
- algılandığında home dizini yolları

Dışa aktarıcı ayrıca girdi boyutunu sınırlar:

- çalışma zamanı sidecar dosyaları: 50 MiB
- oturum dosyaları: 50 MiB
- çalışma zamanı olayları: 200.000
- toplam dışa aktarılan olaylar: 250.000
- tekil çalışma zamanı olay satırları 256 KiB üzerinde kırpılır

Paketleri ekibiniz dışında paylaşmadan önce gözden geçirin. Redaksiyon best-effort'tur
ve uygulamaya özgü her secret'ı bilemez.

## Sorun giderme

Dışa aktarımda çalışma zamanı olayı yoksa:

- OpenClaw'ın `OPENCLAW_TRAJECTORY=0` olmadan başlatıldığını doğrulayın
- `OPENCLAW_TRAJECTORY_DIR` yazılabilir bir dizini gösteriyor mu kontrol edin
- oturumda başka bir mesaj çalıştırın, ardından tekrar dışa aktarın
- `runtimeEventCount` için `manifest.json` dosyasını inceleyin

Komut çıktı yolunu reddederse:

- `bug-1234` gibi göreli bir ad kullanın
- `/tmp/...` veya `~/...` geçirmeyin
- dışa aktarımı `.openclaw/trajectory-exports/` içinde tutun

Dışa aktarım bir boyut hatasıyla başarısız olursa, oturum veya sidecar dışa aktarma
güvenlik sınırlarını aşmıştır. Yeni bir oturum başlatın veya daha küçük bir reproduction dışa aktarın.

## İlgili

- [Diff'ler](/tr/tools/diffs)
- [Oturum yönetimi](/tr/concepts/session)
- [Exec aracı](/tr/tools/exec)
