---
read_when:
    - Bir ajanın neden belirli bir şekilde yanıt verdiğini, başarısız olduğunu veya araçları çağırdığını hata ayıklama
    - Bir OpenClaw oturumu için destek paketi dışa aktarma
    - İstem bağlamını, araç çağrılarını, çalışma zamanı hatalarını veya kullanım meta verilerini araştırma
    - Yörünge yakalamayı devre dışı bırakma veya yeniden konumlandırma
summary: Hata ayıklama için bir OpenClaw ajan oturumunun redakte edilmiş trajectory paketlerini dışa aktarın
title: Yörünge paketleri
x-i18n:
    generated_at: "2026-06-28T01:27:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf48616c29a1055f26d39a88869c025db7e6261b13dcaa0cd35be438c6a86a88
    source_path: tools/trajectory.md
    workflow: 16
---

Trajectory capture, OpenClaw'ın oturum başına uçuş kaydedicisidir. Her agent çalıştırması için
yapılandırılmış bir zaman çizelgesi kaydeder, ardından `/export-trajectory` mevcut
oturumu redakte edilmiş bir destek paketine dönüştürür.

Şu tür soruları yanıtlamanız gerektiğinde kullanın:

- Modele hangi prompt, system prompt ve araçlar gönderildi?
- Bu yanıta hangi transcript mesajları ve araç çağrıları yol açtı?
- Çalıştırma zaman aşımına mı uğradı, iptal mi edildi, compact mı edildi, yoksa bir sağlayıcı hatasına mı takıldı?
- Hangi model, Plugin'ler, Skills ve runtime ayarları etkindi?
- Sağlayıcı hangi kullanım ve prompt-cache metadata'sını döndürdü?

Canlı bir Gateway sorunu için geniş kapsamlı bir destek raporu açıyorsanız,
[`/diagnostics`](/tr/gateway/diagnostics#chat-command) ile başlayın. Diagnostics,
temizlenmiş Gateway paketini toplar ve OpenAI Codex harness oturumları için,
onaydan sonra Codex geri bildirimini OpenAI sunucularına da gönderebilir.
Özellikle ayrıntılı oturum başına prompt, araç ve transcript zaman çizelgesine
ihtiyacınız olduğunda `/export-trajectory` kullanın.

## Hızlı başlangıç

Etkin oturumda şunu gönderin:

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

Özel yol `.openclaw/trajectory-exports/` içinde çözümlenir. Mutlak yollar
ve `~` yolları reddedilir.

Trajectory paketleri prompt'lar, model mesajları, araç şemaları, araç
sonuçları, runtime olayları ve yerel yollar içerebilir. Bu nedenle chat slash
komutu her seferinde exec onayından geçer. Paketi oluşturmak istediğinizde
dışa aktarmayı bir kez onaylayın; allow-all kullanmayın. Grup sohbetlerinde,
OpenClaw onay prompt'unu ve dışa aktarma sonucunu, trajectory ayrıntılarını
paylaşılan odaya geri göndermek yerine sahibine özel olarak gönderir.

Yerel inceleme veya destek iş akışları için, onaylanmış komut yolunu doğrudan
da çalıştırabilirsiniz:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Erişim

Trajectory dışa aktarma bir sahip komutudur. Gönderen, kanal için normal komut
yetkilendirme kontrollerinden ve sahip kontrollerinden geçmelidir.

## Neler kaydedilir

Trajectory capture, OpenClaw agent çalıştırmaları için varsayılan olarak açıktır.

Runtime olayları şunları içerir:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- kaynak model, sonraki model, hata nedeni/ayrıntısı, zincir konumu ve fallback'in ilerleyip ilerlemediği, başarılı olup olmadığı veya zinciri tüketip tüketmediği dahil `model.fallback_step`
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

Olaylar, şu şema işaretiyle JSON Lines olarak yazılır:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Paket dosyaları

Dışa aktarılan bir paket şunları içerebilir:

| Dosya                 | İçerik                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Paket şeması, kaynak dosyalar, olay sayıları ve oluşturulan dosya listesi                      |
| `events.jsonl`        | Sıralı runtime ve transcript zaman çizelgesi                                                    |
| `session-branch.json` | Redakte edilmiş etkin transcript dalı ve oturum başlığı                                         |
| `metadata.json`       | OpenClaw sürümü, OS/runtime, model, yapılandırma anlık görüntüsü, Plugin'ler, Skills ve prompt metadata'sı |
| `artifacts.json`      | Son durum, hatalar, kullanım, prompt cache, compaction sayısı, assistant metni ve araç metadata'sı |
| `prompts.json`        | Gönderilen prompt'lar ve seçili prompt oluşturma ayrıntıları                                    |
| `system-prompt.txt`   | Yakalandığında en son derlenmiş system prompt                                                   |
| `tools.json`          | Yakalandığında modele gönderilen araç tanımları                                                 |

`manifest.json`, o pakette bulunan dosyaları listeler. Oturum ilgili runtime
verilerini yakalamadığında bazı dosyalar atlanır.

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

Bu değişken ayarlandığında, OpenClaw bu dizinde oturum kimliği başına bir JSONL
dosyası yazar.

Oturum bakımı, sahibi olan oturum girdisi budandığında, sınırlandığında veya
oturumlar disk bütçesi tarafından çıkarıldığında trajectory sidecar'larını
kaldırır. Oturumlar dizini dışındaki runtime dosyaları yalnızca işaretçi hedefi
hâlâ o oturuma ait olduğunu kanıtladığında kaldırılır.

## Yakalamayı devre dışı bırakma

OpenClaw'ı başlatmadan önce `OPENCLAW_TRAJECTORY=0` ayarlayın:

```bash
export OPENCLAW_TRAJECTORY=0
```

Bu, runtime trajectory capture'ı devre dışı bırakır. `/export-trajectory`
transcript dalını yine de dışa aktarabilir, ancak derlenmiş context, sağlayıcı
artifact'leri ve prompt metadata'sı gibi yalnızca runtime'a ait dosyalar eksik
olabilir.

## Flush zaman aşımını ayarlama

OpenClaw, agent temizliği sırasında runtime trajectory sidecar'larını flush eder.
Varsayılan temizlik zaman aşımı 10.000 ms'dir. Yavaş disklerde veya büyük
depolarda, OpenClaw'ı başlatmadan önce `OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS`
ayarlayın:

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

Bu, OpenClaw'ın ne zaman bir `openclaw-trajectory-flush` zaman aşımı kaydedip
devam edeceğini kontrol eder. Trajectory boyut sınırlarını değiştirmez. Açık
bir zaman aşımı geçirmeyen tüm agent temizlik adımlarını ayarlamak için
`OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS` ayarlayın.

## Gizlilik ve sınırlar

Trajectory paketleri herkese açık paylaşım için değil, destek ve hata ayıklama
için tasarlanmıştır. OpenClaw, dışa aktarma dosyalarını yazmadan önce hassas
değerleri redakte eder:

- kimlik bilgileri ve bilinen secret benzeri payload alanları
- görüntü verileri
- yerel durum yolları
- `$WORKSPACE_DIR` ile değiştirilen çalışma alanı yolları
- algılandığında home dizini yolları

Dışa aktarıcı ayrıca girdi boyutunu sınırlar:

- runtime sidecar dosyaları: canlı yakalama 10 MiB'de durur ve alan kaldığında bir kesme olayı kaydeder; dışa aktarma mevcut runtime sidecar'larını 50 MiB'ye kadar kabul eder
- oturum dosyaları: 50 MiB
- runtime olayları: 200.000
- toplam dışa aktarılan olaylar: 250.000
- tekil runtime olay satırları 256 KiB üzerinde kesilir

Paketleri ekibiniz dışında paylaşmadan önce inceleyin. Redaksiyon best-effort'tur
ve uygulamaya özgü her secret'ı bilemez.

## Sorun giderme

Dışa aktarmada runtime olayı yoksa:

- OpenClaw'ın `OPENCLAW_TRAJECTORY=0` olmadan başlatıldığını doğrulayın
- `OPENCLAW_TRAJECTORY_DIR` öğesinin yazılabilir bir dizini gösterip göstermediğini kontrol edin
- oturumda başka bir mesaj çalıştırın, sonra tekrar dışa aktarın
- `runtimeEventCount` için `manifest.json` dosyasını inceleyin

Komut çıktı yolunu reddederse:

- `bug-1234` gibi göreli bir ad kullanın
- `/tmp/...` veya `~/...` geçirmeyin
- dışa aktarmayı `.openclaw/trajectory-exports/` içinde tutun

Dışa aktarma bir boyut hatasıyla başarısız olursa, oturum veya sidecar dışa
aktarma güvenlik sınırlarını aşmıştır. Yeni bir oturum başlatın veya daha küçük
bir yeniden üretimi dışa aktarın.

## İlgili

- [Diff'ler](/tr/tools/diffs)
- [Oturum yönetimi](/tr/concepts/session)
- [Exec aracı](/tr/tools/exec)
