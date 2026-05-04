---
read_when:
    - Bir agent'ın neden belirli bir şekilde yanıt verdiğini, başarısız olduğunu veya araçları çağırdığını hata ayıklama
    - OpenClaw oturumu için destek paketi dışa aktarma
    - İstem bağlamını, araç çağrılarını, çalışma zamanı hatalarını veya kullanım meta verilerini inceleme
    - Yörünge yakalamayı devre dışı bırakma veya yeniden konumlandırma
summary: Bir OpenClaw ajan oturumunda hata ayıklamak için redakte edilmiş yörünge paketlerini dışa aktarın
title: Yörünge paketleri
x-i18n:
    generated_at: "2026-05-04T09:07:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8b1256e52d27185a48ceddaf7937b4f37ad6d57d075fea0d0b6d3abb871f1d8
    source_path: tools/trajectory.md
    workflow: 16
---

Trajectory capture, OpenClaw'ın oturum başına uçuş kaydedicisidir. Her agent çalıştırması için
yapılandırılmış bir zaman çizelgesi kaydeder; ardından `/export-trajectory`, geçerli
oturumu redakte edilmiş bir destek paketi hâline getirir.

Şunlar gibi soruları yanıtlamanız gerektiğinde kullanın:

- Modele hangi prompt, sistem prompt'u ve araçlar gönderildi?
- Hangi transcript mesajları ve araç çağrıları bu yanıta yol açtı?
- Çalıştırma zaman aşımına mı uğradı, iptal mi edildi, compact mı edildi veya bir sağlayıcı hatasıyla mı karşılaştı?
- Hangi model, Plugin'ler, Skills ve runtime ayarları etkindi?
- Sağlayıcı hangi kullanım ve prompt önbelleği meta verilerini döndürdü?

Canlı bir Gateway sorunu için geniş kapsamlı bir destek raporu açıyorsanız,
[`/diagnostics`](/tr/gateway/diagnostics#chat-command) ile başlayın. Diagnostics,
temizlenmiş Gateway paketini toplar ve OpenAI Codex harness oturumları için, onaydan
sonra Codex geri bildirimini OpenAI sunucularına da gönderebilir. Özellikle
oturum başına ayrıntılı prompt, araç ve transcript zaman çizelgesine ihtiyacınız
olduğunda `/export-trajectory` kullanın.

## Hızlı başlangıç

Bunu etkin oturumda gönderin:

```text
/export-trajectory
```

Alias:

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

Trajectory paketleri prompt'lar, model mesajları, araç şemaları, araç
sonuçları, runtime olayları ve yerel yollar içerebilir. Bu nedenle chat slash komutu
her seferinde exec onayından geçer. Paketi oluşturmak istediğinizde dışa aktarmayı
bir kez onaylayın; allow-all kullanmayın. Grup sohbetlerinde OpenClaw,
onay prompt'unu ve dışa aktarma sonucunu, trajectory ayrıntılarını paylaşılan
odaya geri göndermek yerine sahibine özel olarak gönderir.

Yerel inceleme veya destek iş akışları için onaylanmış komut yolunu doğrudan da
çalıştırabilirsiniz:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Erişim

Trajectory export bir sahip komutudur. Gönderen, kanal için normal komut
yetkilendirme kontrollerini ve sahip kontrollerini geçmelidir.

## Kaydedilenler

Trajectory capture, OpenClaw agent çalıştırmaları için varsayılan olarak açıktır.

Runtime olayları şunları içerir:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- kaynak model, sonraki model, hata nedeni/ayrıntısı, zincir konumu ve fallback'in zincirde ilerleyip ilerlemediği, başarılı olup olmadığı veya zinciri tüketip tüketmediği dahil `model.fallback_step`
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

| Dosya                 | İçerikler                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Paket şeması, kaynak dosyalar, olay sayıları ve oluşturulan dosya listesi                      |
| `events.jsonl`        | Sıralı runtime ve transcript zaman çizelgesi                                                    |
| `session-branch.json` | Redakte edilmiş etkin transcript dalı ve oturum üst bilgisi                                    |
| `metadata.json`       | OpenClaw sürümü, OS/runtime, model, config anlık görüntüsü, Plugin'ler, Skills ve prompt meta verileri |
| `artifacts.json`      | Son durum, hatalar, kullanım, prompt önbelleği, compaction sayısı, assistant metni ve araç meta verileri |
| `prompts.json`        | Gönderilen prompt'lar ve seçili prompt oluşturma ayrıntıları                                   |
| `system-prompt.txt`   | Yakalandığında, en son derlenmiş sistem prompt'u                                                |
| `tools.json`          | Yakalandığında, modele gönderilen araç tanımları                                                |

`manifest.json`, o pakette bulunan dosyaları listeler. Oturum karşılık gelen
runtime verilerini yakalamadığında bazı dosyalar atlanır.

## Yakalama konumu

Varsayılan olarak runtime trajectory olayları oturum dosyasının yanına yazılır:

```text
<session>.trajectory.jsonl
```

OpenClaw ayrıca oturumun yanına best-effort bir işaretçi dosyası yazar:

```text
<session>.trajectory-path.json
```

Runtime trajectory sidecar'larını özel bir dizinde saklamak için
`OPENCLAW_TRAJECTORY_DIR` ayarlayın:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Bu değişken ayarlandığında OpenClaw, o dizinde her oturum kimliği için bir JSONL
dosyası yazar.

Oturum bakımı, sahip oldukları oturum girdisi sessions disk bütçesi tarafından
budandığında, sınırlandığında veya çıkarıldığında trajectory sidecar'larını kaldırır. Sessions dizini dışındaki runtime dosyaları yalnızca işaretçi hedefi hâlâ
o oturuma ait olduğunu kanıtladığında kaldırılır.

## Yakalamayı devre dışı bırakma

OpenClaw'ı başlatmadan önce `OPENCLAW_TRAJECTORY=0` ayarlayın:

```bash
export OPENCLAW_TRAJECTORY=0
```

Bu, runtime trajectory capture'ı devre dışı bırakır. `/export-trajectory` yine de
transcript dalını dışa aktarabilir, ancak derlenmiş bağlam, sağlayıcı artifact'ları
ve prompt meta verileri gibi yalnızca runtime dosyaları eksik olabilir.

## Gizlilik ve sınırlar

Trajectory paketleri destek ve hata ayıklama için tasarlanmıştır, herkese açık
paylaşım için değil. OpenClaw, dışa aktarma dosyalarını yazmadan önce hassas
değerleri redakte eder:

- kimlik bilgileri ve bilinen gizli bilgiye benzeyen payload alanları
- görüntü verileri
- yerel durum yolları
- `$WORKSPACE_DIR` ile değiştirilen çalışma alanı yolları
- algılandığında home dizini yolları

Exporter ayrıca girdi boyutunu sınırlar:

- runtime sidecar dosyaları: canlı yakalama 10 MiB'de durur ve alan kaldığında bir kesme olayı kaydeder; export, mevcut runtime sidecar'larını 50 MiB'ye kadar kabul eder
- oturum dosyaları: 50 MiB
- runtime olayları: 200.000
- toplam dışa aktarılan olay: 250.000
- tekil runtime olay satırları 256 KiB üzerinde kesilir

Paketleri ekibiniz dışında paylaşmadan önce inceleyin. Redaksiyon best-effort'tür
ve uygulamaya özgü her gizli bilgiyi bilemez.

## Sorun giderme

Dışa aktarmada runtime olayı yoksa:

- OpenClaw'ın `OPENCLAW_TRAJECTORY=0` olmadan başlatıldığını doğrulayın
- `OPENCLAW_TRAJECTORY_DIR` yazılabilir bir dizini gösteriyor mu kontrol edin
- oturumda başka bir mesaj çalıştırın, sonra yeniden dışa aktarın
- `runtimeEventCount` için `manifest.json` inceleyin

Komut çıktı yolunu reddederse:

- `bug-1234` gibi göreli bir ad kullanın
- `/tmp/...` veya `~/...` geçirmeyin
- dışa aktarmayı `.openclaw/trajectory-exports/` içinde tutun

Dışa aktarma bir boyut hatasıyla başarısız olursa, oturum veya sidecar dışa aktarma
güvenlik sınırlarını aşmıştır. Yeni bir oturum başlatın veya daha küçük bir
reproduction dışa aktarın.

## İlgili

- [Diff'ler](/tr/tools/diffs)
- [Oturum yönetimi](/tr/concepts/session)
- [Exec aracı](/tr/tools/exec)
