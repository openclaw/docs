---
read_when:
    - Bir agentı veya aracı kimin çalıştırdığını, ne zaman çalıştırdığını ve nasıl sonuçlandığını yanıtlamanız gerekir
    - İçerik içermeyen gelen veya giden mesaj yaşam döngüsü meta verilerine ihtiyacınız var
    - Sınırlandırılmış, redaksiyona uygun bir etkinlik dışa aktarımına ihtiyacınız var
summary: Yalnızca meta veri içeren çalıştırma, araç ve mesaj yaşam döngüsü denetim kayıtları için CLI başvurusu
title: Denetim kayıtları
x-i18n:
    generated_at: "2026-07-16T16:55:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: da9df6f388b0a24c3b79d755fa59d047cce99262bc6d9c890be7a83da75693a8
    source_path: cli/audit.md
    workflow: 16
---

# `openclaw audit`

Agent çalıştırmaları, araç eylemleri ve isteğe bağlı mesaj yaşam döngüsü kayıtları için Gateway'in yalnızca meta veri içeren denetim defterini sorgulayın.

Defter, çalıştırma ve araç olayları için varsayılan olarak etkindir. Tüm yeni olay kayıtlarını durdurmak için
[`audit.enabled: false`](/tr/gateway/configuration-reference#audit) ayarını yapıp Gateway'i yeniden başlatın.
Mesaj kayıtları ise varsayılan olarak devre dışıdır; bunları kaydetmek için `audit.messages` değerini
`direct` veya `all` olarak ayarlayıp Gateway'i yeniden başlatın. Mevcut kayıtlar,
süreleri dolana kadar (30 gün) sorgulanabilir durumda kalır.

Defter, konuşma transkriptlerinden ayrıdır: kimlik, sıralama, kaynak, eylem, durum ve normalleştirilmiş sonuç kodlarını kaydeder ancak hiçbir zaman içerik depolamaz; mesaj tanımlayıcıları da yalnızca kuruluma özgü anahtarlı takma adlar olarak görünür. [Denetim geçmişi](/gateway/audit), veri modelinin tamamını, gizlilik semantiğini, depolama/saklama sınırlarını ve kapsam kısıtlamalarını açıklar; bu sayfa komut yüzeyini ele alır.

```bash
openclaw audit
openclaw audit --agent main --status failed
openclaw audit --session "agent:main:main" --after 2026-07-01T00:00:00Z
openclaw audit --run 8c69f72e-8b11-4c54-98d5-1a3dd67450c3
openclaw audit --kind tool_action --limit 50 --json
openclaw audit --kind message --direction outbound --channel telegram --json
```

## Filtreler

- `--agent <id>`: tam agent kimliği
- `--session <key>`: tam oturum anahtarı
- `--run <id>`: tam çalıştırma kimliği
- `--kind <kind>`: `agent_run`, `tool_action` veya `message`
- `--status <status>`: `started`, `succeeded`, `failed`, `cancelled`,
  `timed_out`, `blocked` veya `unknown`
- `--direction <direction>`: mesaj yönü, `inbound` veya `outbound`
- `--channel <channel>`: tam mesaj kanalı
- `--after <timestamp>` / `--before <timestamp>`: sınırlar dahil ISO zaman damgası veya
  Unix milisaniyesi
- `--limit <count>`: 1 ile 500 arasında sayfa boyutu; varsayılan `100`
- `--cursor <sequence>`: önceki en yeniden en eskiye sorguyu sürdürür
- `--json`: sınırlandırılmış sayfayı JSON olarak yazdırır

CLI, tek bir komutun yapılandırılmış defterin tamamını göstermesi için sürümlü etkinlik RPC'sini sorgular. Metin çıktısı zamanı, türü, yönü, kanalı, durumu, agent'ı, çalıştırmayı ve eylemi gösterir. Eksik mesaj kaynak bilgisi `-` olarak görüntülenir; OpenClaw agent veya çalıştırma kimlikleri uydurmaz. Araç eylemleri ayrıca araç adını da gösterir. Başka bir sayfa mevcutsa JSON çıktısı `nextCursor` içerir. Sayfalama sırasında gelen kayıtları yeniden sıralamadan devam etmek için bu değeri `--cursor` seçeneğine aktarın.

Mesaj gövdeleri ve ham mesaj kimliği alanları bulunmasa da bu dışa aktarımlar hassas operasyonel meta veri olmaya devam eder. Agent, oturum ve çalıştırma kimlikleri, zamanlama, kanallar, sonuçlar ve kararlı HMAC referansları etkinlikleri ilişkilendirebilir. Bunları diğer operatör kayıtlarıyla aynı erişim denetimleri ve saklama uygulamalarıyla koruyun.

## Kaydedilen olaylar

Gateway, güvenilir yaşam döngüsü akışlarını altı eyleme yansıtır:

- `agent.run.started`
- `agent.run.finished`
- `tool.action.started`
- `tool.action.finished`
- `message.inbound.processed`
- `message.outbound.finished`

Döndürülen her kayıtta kararlı bir olay kimliği, monoton olarak artan bir defter sıra numarası, yaşam döngüsü zaman damgası, aktör, eylem, durum, bir `schemaVersion: 1` işareti, kaynak sıra numarası ve `redaction: "metadata_only"` bulunur. Agent/oturum/çalıştırma kaynak bilgileri ve olaya özgü alanlar yalnızca güvenilir kaynak bunları sağladığında bulunur. Mesaj kayıtları kasıtlı olarak `sessionKey` ve `sessionId` alanlarını içermez; bu nedenle `--session` filtreleri yalnızca çalıştırma ve araç kayıtlarını kapsar.

Sonlandırılmış çalıştırma ve araç kayıtları; başarı, başarısızlık, iptal, zaman aşımı ve politika engellerini kapalı durum ve hata kodlarıyla ayırt eder. Üst çalışma zamanı yetkili bir sonlandırma sonucu sunmadığında `unknown`, açıkça başarısız bir sonuçtur. Araç çağrısı kimlikleri yalnızca kararlı parmak izleri olarak dışa aktarılır. Araç adları, modele dönük kısa ad sözleşmesiyle eşleşmelidir; diğer değerler `unknown` olur.

Mesaj kayıtları; yön, kanal, konuşma türü, sonuç ve isteğe bağlı olarak teslimat türü, hata aşaması, süre, sonuç sayısı, normalleştirilmiş neden kodu ile anahtarlı hesap/konuşma/mesaj/hedef takma adlarını ekler. Geçerli gelen sınırı, temel yinelenen ileti ve sonlandırılmış işleme sonuçları dahil olmak üzere temel dağıtıma ulaşan kabul edilmiş mesajları kapsar. Giden sınırı, paylaşılan kalıcı teslimata ulaşan her özgün mantıksal yanıt yükü için bir sonlandırılmış satır yazar; parçalara ayırma ve bağdaştırıcı dağıtımı `resultCount` içinde toplanır. Kuyruğa alınmış yeniden denenebilir veya belirsiz gönderimler yalnızca bir onay, başarısız ileti kuyruğu veya mutabakat sonucu sonlandırılmış hâle geldikten sonra kaydedilir. Bu paylaşılan sınırları atlayan Plugin'e özgü ve doğrudan gönderim yolları henüz kapsanmamaktadır; bir satırın bulunmaması, hiçbir mesajın mevcut olmadığını kanıtlamaz.

Denetim defteri; transkriptlerin, görev geçmişinin, cron çalıştırma geçmişinin veya günlüklerin yerini almaz. Konuşma içeriğini başka bir depoya kopyalamadan operatör soruları için çalıştırmalar arası küçük bir dizin sağlar.

Gelen satırlarda `durationMs` temel dağıtımı ölçer ve `resultCount` sonlandırılmış, kuyruğa alınmış araç, engel ve yanıt yüklerini sayar. Giden satırlarda `durationMs`, sonlandırılmış duruma kadar teslimat sahipliğini (ve dolayısıyla kuyrukta bekleme süresini) içerirken `resultCount` tanımlanmış fiziksel platform gönderimlerini sayar. `deliveryKind` mevcut olduğunda, hook sonrası ve işleme sonrası etkin yükü tanımlar; bastırılmış ve kilitlenme nedeniyle belirsiz satırlar bunu içermez.

## Gateway RPC

`audit.activity.list`, `operator.read` gerektirir ve aynı filtreleri kabul eder. Çalıştırma, araç, gelen mesaj ve giden mesaj kayıtlarını içeren adlandırılmış V1 etkinlik olayı birleşimini döndürür.

```bash
openclaw gateway call audit.activity.list --params '{"channel":"telegram","limit":50}'
```

Sonuç `{ "events": AuditActivityEventV1[], "nextCursor"?: string }` şeklindedir.
Sonuçlar en yeniden en eskiye sıralanır ve istek başına 500 kayıtla sınırlıdır.

Yayınlanan `audit.list` RPC'si, eski çalıştırma/araç istemcileri için değişmeden kalır. Eski bir Gateway'de `audit.activity.list` kullanılamadığında CLI, yalnızca istenen tüm filtreler eski yöntem tarafından destekleniyorsa `audit.list` yöntemini yeniden dener. `--kind message`, `--direction` ve `--channel`, sessizce yok sayılmak yerine eski bir Gateway'de yükseltme mesajıyla başarısız olur.

## İlgili

- [Denetim geçmişi](/gateway/audit)
- [Gateway protokolü](/tr/gateway/protocol#audit-ledger-rpc)
- [Oturumlar](/tr/cli/sessions)
- [Görevler](/tr/cli/tasks)
- [Cron işleri](/tr/automation/cron-jobs)
