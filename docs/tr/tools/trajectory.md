---
read_when:
    - Bir ajanın neden belirli bir şekilde yanıt verdiğini, başarısız olduğunu veya araçları çağırdığını hata ayıklama
    - Bir OpenClaw oturumu için destek paketi dışa aktarma
    - İstem bağlamını, araç çağrılarını, çalışma zamanı hatalarını veya kullanım meta verilerini inceleme
    - Yörünge yakalamayı devre dışı bırakma
summary: Bir OpenClaw aracı oturumunda hata ayıklamak için hassas bilgileri çıkarılmış yörünge paketlerini dışa aktarın
title: Yörünge paketleri
x-i18n:
    generated_at: "2026-07-16T18:01:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7fc494732b6239ad4ea58dca3920a47cb7433c680e7566855dd265c986b55e74
    source_path: tools/trajectory.md
    workflow: 16
---

Yörünge yakalama, OpenClaw'un oturum başına çalışan uçuş kaydedicisidir. Her ajan çalıştırması için
yapılandırılmış bir zaman çizelgesi kaydeder; ardından `/export-trajectory`, geçerli
oturumu aşağıdakileri kapsayan, hassas bilgileri ayıklanmış bir destek paketi hâline getirir:

- Modele gönderilen istem, sistem istemi ve araçlar
- Hangi transkript mesajlarının ve araç çağrılarının bir yanıta yol açtığı
- Çalıştırmanın zaman aşımına uğrayıp uğramadığı, iptal edilip edilmediği, sıkıştırılıp sıkıştırılmadığı veya bir sağlayıcı hatasıyla karşılaşıp karşılaşmadığı
- Hangi modelin, plugin'lerin, Skills'ın ve çalışma zamanı ayarlarının etkin olduğu
- Sağlayıcının döndürdüğü kullanım ve istem önbelleği meta verileri

Kapsamlı bir Gateway destek raporu için bunun yerine
[`/diagnostics`](/tr/gateway/diagnostics#chat-command) ile başlayın; bu komut,
temizlenmiş Gateway paketini toplar ve OpenAI Codex yürütme ortamı oturumları için
onaydan sonra Codex geri bildirimini OpenAI'a gönderebilir. Ayrıntılı oturum başına
istem, araç ve transkript zaman çizelgesine ihtiyacınız olduğunda `/export-trajectory` kullanın.

## Hızlı başlangıç

Etkin oturumda gönderin (diğer adıyla `/trajectory`):

```text
/export-trajectory
```

OpenClaw, paketi çalışma alanının altına yazar:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Bunu geçersiz kılmak için göreli bir çıktı dizini adı iletin:

```text
/export-trajectory bug-1234
```

Ad, `.openclaw/trajectory-exports/` içinde çözümlenir. Mutlak yollar ve
`~` yolları reddedilir.

Yörünge paketleri istemler, model mesajları, araç şemaları, araç sonuçları,
çalışma zamanı olayları ve yerel yollar içerebilir; bu nedenle sohbet komutu her zaman
exec onayından geçer. Paketi oluşturmak istediğinizde dışa aktarmayı bir kez
onaylayın; tümüne izin ver seçeneğini kullanmayın. Grup sohbetlerinde OpenClaw,
yörünge ayrıntılarını paylaşılan odaya göndermek yerine onay istemini ve dışa
aktarma sonucunu özel olarak sahibine gönderir.

Yerel inceleme veya destek iş akışları için temel CLI komutunu
doğrudan çalıştırın:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

Diğer bayraklar: `--output <path>` (`.openclaw/trajectory-exports` içindeki
dizin adı), `--store <path>` (oturum deposunu geçersiz kılma),
`--agent <id>` (depo çözümlemesi için ajan kimliği), `--json` (yapılandırılmış çıktı).

## Erişim

Yörünge dışa aktarma bir sahip komutudur. Gönderen, kanal için normal komut
yetkilendirme denetimlerinin yanı sıra sahip denetiminden de geçmelidir.

## Kaydedilenler

OpenClaw ajan çalıştırmalarında yörünge yakalama varsayılan olarak etkindir.

Çalışma zamanı olayları şunları içerir:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`; kaynak model, sonraki model, hata nedeni/ayrıntısı, zincir konumu ve zincirin ilerleyip ilerlemediği, başarılı olup olmadığı veya tükenip tükenmediği dâhil
- `model.completed`
- `trace.artifacts`
- `session.ended`

Transkript olayları etkin oturum dalından yeniden oluşturulur: kullanıcı
mesajları, asistan mesajları, araç çağrıları, araç sonuçları, sıkıştırmalar, model
değişiklikleri, etiketler ve özel oturum girdileri.

Olaylar, şu şema işaretçisiyle JSON Lines olarak yazılır:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Paket dosyaları

| Dosya                  | İçerik                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Paket şeması, kaynak dosyalar, olay sayıları ve oluşturulan dosya listesi                             |
| `events.jsonl`        | Sıralı çalışma zamanı ve transkript zaman çizelgesi                                                        |
| `session-branch.json` | Hassas bilgileri ayıklanmış etkin transkript dalı ve oturum başlığı                                           |
| `metadata.json`       | OpenClaw sürümü, işletim sistemi/çalışma zamanı, model, yapılandırma anlık görüntüsü, plugin'ler, Skills ve istem meta verileri     |
| `artifacts.json`      | Son durum, hatalar, kullanım, istem önbelleği, sıkıştırma sayısı, asistan metni ve araç meta verileri |
| `prompts.json`        | Gönderilen istemler ve seçili istem oluşturma ayrıntıları                                         |
| `system-prompt.txt`   | Yakalandığında en son derlenmiş sistem istemi                                                   |
| `tools.json`          | Yakalandığında modele gönderilen araç tanımları                                              |

`manifest.json`, belirli bir pakette bulunan dosyaları listeler; oturum
karşılık gelen çalışma zamanı verilerini yakalamadıysa bazı dosyalar atlanır.

## Yakalama depolaması

Çalışma zamanı yörünge olayları, ajan başına SQLite veritabanında oturumla
birlikte depolanır. Bir yörüngeyi dışa aktarmak, hassas bilgileri ayıklanmış bir JSONL
destek paketi oluşturur; canlı çalışma zamanı yakalaması, oturumun yanında bulunan
bir JSONL ek dosyası değildir.

Eski sürümlerden veya açıkça yapılan eski dosya dışa aktarmalarından kalan
`.trajectory.jsonl` ve `.trajectory-path.json` dosyaları hâlâ görünebilir.
Oturum bakımı bu dosyaları temizleme hedefleri olarak değerlendirir; etkin yakalama
veritabanı satırları yazar.

## Yakalamayı devre dışı bırakma

```bash
export OPENCLAW_TRAJECTORY=0
```

Bu, OpenClaw'u başlatmadan önce çalışma zamanı yörünge yakalamasını devre dışı bırakır.
`/export-trajectory` transkript dalını yine de dışa aktarabilir; ancak derlenmiş
bağlam, sağlayıcı yapıtları ve istem meta verileri gibi yalnızca çalışma zamanına
özgü veriler eksik olabilir.

## Temizleme zaman aşımını ayarlama

OpenClaw, ajan temizliği sırasında çalışma zamanı yörünge satırlarını diske yazar.
Varsayılan temizleme zaman aşımı 10,000 ms'dir. Yavaş disklerde veya büyük depolarda,
OpenClaw'u başlatmadan önce `OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` ayarlayın:

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

Bu, OpenClaw'un ne zaman bir `openclaw-trajectory-flush` zaman aşımı kaydedip
devam edeceğini belirler; yörünge boyutu sınırlarını değiştirmez. Açık bir zaman aşımı
iletmeyen tüm ajan temizleme adımlarını ayarlamak için
`OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS` değerini ayarlayın.

## Gizlilik ve sınırlar

Yörünge paketleri destek ve hata ayıklama içindir; herkese açık paylaşım için değildir.
OpenClaw, dışa aktarma dosyalarını yazmadan önce hassas değerleri ayıklar:

- kimlik bilgileri ve bilinen gizli bilgi benzeri yük alanları
- görüntü verileri
- yerel durum yolları
- `$WORKSPACE_DIR` ile değiştirilen çalışma alanı yolları
- algılandığı durumlarda ana dizin yolları

Dışa aktarıcı ayrıca girdi boyutunu sınırlar:

- çalışma zamanı yakalaması: canlı yakalama, 10 MiB ile sınırlı dönen bir penceredir ve yeni olaylara yer açmak için en eski olayları kaldırır; dışa aktarma, 50 MiB'ye kadar mevcut eski çalışma zamanı ek dosyalarını kabul eder
- oturum dosyaları: 50 MiB
- dışa aktarma başına çalışma zamanı olayları: 200,000
- dışa aktarılan toplam olaylar: 250,000
- tekil çalışma zamanı olay satırları 256 KiB üzerinde kesilir

Paketleri ekibinizin dışında paylaşmadan önce gözden geçirin. Hassas bilgi ayıklama
en iyi çaba esasına dayanır ve uygulamaya özgü her gizli bilgiyi bilemez.

## Sorun giderme

Dışa aktarmada çalışma zamanı olayı yoksa:

- OpenClaw'un `OPENCLAW_TRAJECTORY=0` olmadan başlatıldığını doğrulayın
- oturumda başka bir mesaj çalıştırın, ardından yeniden dışa aktarın
- `runtimeEventCount` için `manifest.json` öğesini inceleyin

Komut çıktı yolunu reddederse:

- `bug-1234` gibi göreli bir ad kullanın
- `/tmp/...` veya `~/...` iletmeyin
- dışa aktarmayı `.openclaw/trajectory-exports/` içinde tutun

Dışa aktarma bir boyut hatasıyla başarısız olursa oturum veya ek dosya, yukarıdaki
dışa aktarma güvenlik sınırlarını aşmıştır. Yeni bir oturum başlatın veya daha küçük
bir yeniden üretimi dışa aktarın.

## İlgili

- [Farklar](/tr/tools/diffs)
- [Oturum yönetimi](/tr/concepts/session)
- [Exec aracı](/tr/tools/exec)
