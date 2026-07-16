---
read_when:
    - Depolanan oturumları listelemek ve son etkinlikleri görmek istiyorsunuz
summary: '`openclaw sessions` için CLI referansı (depolanan oturumları ve kullanımı listeleme)'
title: Oturumlar
x-i18n:
    generated_at: "2026-07-16T17:02:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e00d846229dfad1ada1a8c9a548e26f26247d3f7e5a35106903f6cd4818878b5
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Saklanan konuşma oturumlarını listeleyin.

Oturum listeleri kanal/sağlayıcı canlılık denetimleri değildir. Oturum depolarındaki kalıcı
konuşma satırlarını gösterirler. Sessiz bir Discord, Slack, Telegram veya
başka bir kanal, bir ileti işlenene kadar yeni bir oturum satırı oluşturmadan
başarıyla yeniden bağlanabilir. Canlı kanal bağlantısına ihtiyaç duyduğunuzda
`openclaw channels status --probe`, `openclaw status --deep` veya `openclaw health --verbose` kullanın.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --store ./tmp/sessions.json
openclaw sessions --json
```

Bayraklar:

| Bayrak                 | Açıklama                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `--agent <id>`       | Yapılandırılmış tek bir ajan deposu (varsayılan: yapılandırılmış varsayılan ajan).        |
| `--all-agents`       | Yapılandırılmış tüm ajan depolarını birleştirir.                                 |
| `--store <path>`     | Açık depo yolu (`--agent` veya `--all-agents` ile birleştirilemez). |
| `--active <minutes>` | Yalnızca son N dakika içinde güncellenen oturumları gösterir.                  |
| `--limit <n\|all>`   | Çıktılanacak en fazla satır (varsayılan `100`; `all` tam çıktıyı geri yükler).        |
| `--json`             | Makine tarafından okunabilir çıktı.                                               |
| `--verbose`          | Ayrıntılı günlük kaydı.                                                       |

`openclaw sessions` ve Gateway `sessions.list` RPC'si varsayılan olarak
sınırlıdır; böylece büyük ve uzun ömürlü depolar CLI sürecini veya Gateway olay
döngüsünü tekeline alamaz. CLI varsayılan olarak en yeni 100 oturumu döndürür;
daha küçük/büyük bir aralık için `--limit <n>`, tüm depoya bilinçli olarak
ihtiyaç duyduğunuzda ise `--limit all` iletin. Çağıranların daha fazla satır
bulunduğunu göstermesi gerektiğinde JSON yanıtları `totalCount`,
`limitApplied` ve `hasMore` içerir.

RPC istemcileri, geniş birleşik keşif kaynağını koruyup yalnızca o anda
yapılandırmada bulunan ajanların satırlarını döndürmek için `configuredAgentsOnly: true`
iletebilir. Silinen veya yalnızca diskte bulunan ajan depolarının Oturumlar
görünümünde yeniden belirmemesi için Control UI varsayılan olarak bu modu kullanır.

`--all-agents`, yapılandırılmış ajan depolarını okur. Gateway ve ACP oturum
keşfi daha geniştir: yapılandırılmış ajan köklerinden veya şablonlu bir
`session.store` kökünden çözümlenen SQLite depolarını da içerir. Eski seçici
yolları ajan kökü içinde çözümlenmelidir; sembolik bağlantılar ve kök dışındaki
yollar atlanır.

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.6-sol" },
    { "agentId": "work", "key": "agent:work:main", "model": "anthropic/claude-sonnet-4-6" }
  ]
}
```

## Yörünge ilerlemesini takip etme

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail`, son çalışma zamanı yörünge olaylarını kompakt ilerleme
satırları olarak işler. `--session-key` olmadan önce çalışan oturumları,
ardından saklanan en son oturumu takip eder. `--tail <count>`, takip modu
öncesinde kaç mevcut olayın yazdırılacağını denetler; varsayılan değer
`80`'dur ve `0` geçerli sondan başlar.
`--follow`, seçilen SQLite destekli oturumu veya açıkça belirtilen eski
yörünge dosyasını izlemeyi sürdürür.

İlerleme görünümü bilinçli olarak ölçülüdür: istem metni, araç bağımsız değişkenleri
ve araç sonucu gövdeleri yazdırılmaz. Araç çağrıları, araç adını
`{...redacted...}` ile gösterir; araç sonuçları `ok`,
`error` veya `done` gibi durumları gösterir; model
tamamlama satırları sağlayıcıyı/modeli ve sonlandırma durumunu gösterir.

## Yörünge paketi dışa aktarma

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Bu, sahibin yürütme isteğini onaylamasının ardından `/export-trajectory` eğik çizgi
komutu tarafından kullanılan komut yoludur. Çıktı dizini her zaman seçilen çalışma
alanındaki `.openclaw/trajectory-exports/` içinde çözümlenir.

## Temizleme bakımı

Bir sonraki yazma döngüsünü beklemek yerine bakımı şimdi çalıştırın:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup`, yapılandırmadaki `session.maintenance` ayarlarını kullanır
([Yapılandırma başvurusu](/tr/gateway/config-agents#session)):

- Kapsam notu: `openclaw sessions cleanup`; oturum depolarının,
  dökümlerin, yörünge satırlarının ve eski yörünge yan dosyalarının bakımını yapar.
  İş başına en yeni 2000 satırı otomatik olarak tutan cron çalıştırma geçmişini
  budamaz ([Cron yapılandırması](/tr/automation/cron-jobs#configuration)).
- Temizleme ayrıca `session.maintenance.pruneAfter` değerinden daha eski olan
  başvurulmayan eski/arşiv döküm yapıtlarını, Compaction denetim noktalarını ve
  yörünge yan dosyalarını budar; SQLite oturum satırları tarafından hâlâ
  başvurulan yapıtlar korunur.
- Temizleme, kısa ömürlü Gateway model çalıştırma yoklaması
  temizliğini `modelRunPruned` olarak ayrı bildirir. Bu yalnızca
  `agent:*:explicit:model-run-<uuid>` biçimindeki kesin ve açık anahtarlarla eşleşir. Saklama
  süresi sabit `24h` değeridir ve baskıya bağlıdır: eski yoklama
  satırlarını yalnızca oturum girdisi bakım/kapasite baskısına ulaşıldığında
  kaldırır. Çalıştığında model çalıştırma temizliği, genel eski veri temizliği
  ve sınırlamadan önce gerçekleşir.

Bayraklar:

| Bayrak                 | Açıklama                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | Yazmadan kaç girdinin budanacağını/sınırlanacağını önizler. Metin modunda, oturum etiketiyle gruplandırılmış bir özetin yanı sıra oturum başına bir eylem tablosu (`Action`, `Key`, `Age`, `Model`, `Flags`) yazdırır.                                                                                                       |
| `--enforce`          | `session.maintenance.mode`, `warn` olsa bile bakımı uygular.                                                                                                                                                                                                                                          |
| `--fix-missing`      | Arşivlenmiş döküm yapıtları eksik veya yalnızca başlıktan oluşan/boş eski girdileri, normalde henüz yaş/sayı sınırını aşmayacak olsalar bile kaldırır.                                                                                                                                                             |
| `--fix-dm-scope`     | `session.dmScope`, `main` olduğunda, önceki `per-peer`, `per-channel-peer` veya `per-account-channel-peer` yönlendirmesinin geride bıraktığı eski, eş anahtarlı doğrudan DM satırlarını kullanımdan kaldırır. Önce `--dry-run` kullanın; uygulandığında bu satırları SQLite'tan kaldırır ve eski döküm yapıtlarını silinmiş arşivler olarak korur. |
| `--active-key <key>` | Belirli bir etkin anahtarı disk bütçesi nedeniyle tahliyeden korur. Grup oturumları ve ileti dizisi kapsamlı sohbet oturumları gibi kalıcı harici konuşma işaretçileri de yaş/sayı/disk bütçesi bakımı sırasında tutulur.                                                                                               |
| `--agent <id>`       | Yapılandırılmış tek bir ajan deposu için temizleme çalıştırır.                                                                                                                                                                                                                                                                |
| `--all-agents`       | Yapılandırılmış tüm ajan depoları için temizleme çalıştırır.                                                                                                                                                                                                                                                               |
| `--store <path>`     | Belirli bir eski depo seçici yolunda çalıştırır.                                                                                                                                                                                                                                                         |
| `--json`             | Bir JSON özeti yazdırır. `--all-agents` ile çıktı, depo başına bir özet içerir.                                                                                                                                                                                                                          |

Bir Gateway'e erişilebildiğinde, yapılandırılmış ajan depoları için deneme dışı
temizleme Gateway üzerinden gönderilir; böylece çalışma zamanı trafiğiyle aynı
oturum deposu yazıcısını paylaşır. Eski bir depo seçicisinin açık çevrimdışı
onarımı için `--store <path>` kullanın.

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

## Oturumu sıkıştırma

Takılmış veya aşırı büyük bir oturumun bağlam bütçesini geri kazanın.
`openclaw sessions
compact <key>`, `sessions.compact` Gateway RPC'sinin birinci sınıf
sarmalayıcısıdır ve çalışan bir Gateway gerektirir.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- `--max-lines` olmadan Gateway, dökümü LLM ile özetler. CLI
  varsayılan olarak bir istemci son tarihi uygulamaz; yapılandırılmış Compaction
  yaşam döngüsünü Gateway yönetir.
- `--max-lines <n>` ile son `n` döküm satırına
  kısaltır ve önceki dökümü bir `.bak` yan dosyası olarak arşivler.
- `--agent <id>`: oturumun sahibi olan ajan;
  `global` anahtarları için gereklidir.
- `--url` / `--token` / `--password`:
  Gateway bağlantısı geçersiz kılmaları.
- `--timeout <ms>`: milisaniye cinsinden isteğe bağlı istemci
  tarafı RPC zaman aşımı.
- `--json`: ham RPC yükünü yazdırır.

Gateway başarısız bir Compaction bildirdiğinde veya erişilemez olduğunda komut sıfırdan farklı bir kodla çıkar; böylece Cron'lar ve betikler sessizce hiçbir işlem yapılmamasını asla başarı olarak değerlendirmez.

<Note>
`openclaw agent --message '/compact ...'` bir Compaction yolu **değildir**. CLI'dan gelen eğik çizgi
komutları, yetkili gönderen denetimi tarafından reddedilir; bu çağrı, sessizce
hiçbir işlem yapmadan çıkmak yerine burayı gösteren yönlendirmeyle sıfırdan farklı
bir kodla çıkar.
</Note>

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` şunları kabul eder:

| Alan       | Tür         | Gerekli | Açıklama                                                   |
| ---------- | ----------- | ------- | ---------------------------------------------------------- |
| `key`      | string      | evet    | Compaction uygulanacak oturum anahtarı (örneğin `agent:main:main`). |
| `agentId`  | string      | hayır   | Oturumun sahibi olan aracı kimliği (`global` anahtarları için). |
| `maxLines` | integer ≥ 1 | hayır   | LLM özetlemesi yerine son N satıra kadar kırpın.            |

Örnek LLM özetleme yanıtı:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Örnek kırpma yanıtı (`--max-lines 200`):

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## İlgili

- [Oturum yapılandırması](/tr/gateway/config-agents#session)
- [Oturum yönetimi](/tr/concepts/session)
- [Compaction](/tr/concepts/compaction)
- [CLI referansı](/tr/cli)
