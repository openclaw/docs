---
read_when:
    - Saklanan oturumları listelemek ve son etkinliği görmek istiyorsunuz
summary: '`openclaw sessions` için CLI başvurusu (depolanan oturumları listeleme + kullanım)'
title: Oturumlar
x-i18n:
    generated_at: "2026-07-04T20:40:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c24ee8a632998624ee41945b26ace3bfe37cadf9447f7632c373784a9301bde
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Saklanan konuşma oturumlarını listeleyin.

Oturum listeleri kanal/sağlayıcı canlılık denetimleri değildir. Oturum depolarından kalıcı hale getirilmiş konuşma satırlarını gösterirler. Sessiz bir Discord, Slack, Telegram veya başka bir kanal, bir ileti işlenene kadar yeni bir oturum satırı oluşturmadan başarıyla yeniden bağlanabilir. Canlı kanal bağlantısına ihtiyaç duyduğunuzda `openclaw channels status --probe`, `openclaw status --deep` veya `openclaw health --verbose` kullanın.

`openclaw sessions` ve Gateway `sessions.list` yanıtları varsayılan olarak sınırlandırılır; böylece büyük ve uzun ömürlü depolar CLI sürecini veya Gateway olay döngüsünü tekeline alamaz. CLI varsayılan olarak en yeni 100 oturumu döndürür; daha küçük/daha büyük bir pencere için `--limit <n>` iletin veya kasıtlı olarak tüm depoya ihtiyaç duyduğunuzda `--limit all` kullanın. JSON yanıtları, çağıranların daha fazla satır bulunduğunu gösterebilmesi için `totalCount`, `limitApplied` ve `hasMore` içerir.

RPC istemcileri, geniş birleşik keşif kaynağını koruyup yalnızca yapılandırmada şu anda bulunan aracılara ait satırları döndürmek için `configuredAgentsOnly: true` iletebilir. Control UI bu modu varsayılan olarak kullanır; böylece silinmiş veya yalnızca diskte bulunan aracı depoları Sessions görünümünde yeniden belirmez.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

Kapsam seçimi:

- varsayılan: yapılandırılmış varsayılan aracı deposu
- `--verbose`: ayrıntılı günlükleme
- `--agent <id>`: tek bir yapılandırılmış aracı deposu
- `--all-agents`: tüm yapılandırılmış aracı depolarını birleştir
- `--store <path>`: açık depo yolu (`--agent` veya `--all-agents` ile birleştirilemez)
- `--limit <n|all>`: çıktılanacak en fazla satır sayısı (varsayılan `100`; `all` tam çıktıyı geri getirir)

Saklanan oturumlar için insan tarafından okunabilir yörünge ilerlemesini takip edin:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail`, son yörünge JSONL olaylarını kompakt ilerleme satırları olarak işler. `--session-key` olmadan önce çalışan oturumları, sonra en son saklanan oturumu takip eder. `--tail <count>`, takip modu başlamadan önce kaç mevcut olayın yazdırılacağını kontrol eder; varsayılan `80` değeridir ve `0` mevcut son konumdan başlatır. `--follow`, `<session>.trajectory-path.json` tarafından başvurulan taşınmış dosyalar dahil olmak üzere seçili yörünge dosyalarını izlemeyi sürdürür.

İlerleme görünümü kasıtlı olarak muhafazakardır: istem metni, araç bağımsız değişkenleri ve araç sonuç gövdeleri yazdırılmaz. Araç çağrıları araç adını `{...redacted...}` ile gösterir; araç sonuçları `ok`, `error` veya `done` gibi durumları gösterir; model tamamlama satırları sağlayıcı/model ve terminal durumunu gösterir.

Saklanan bir oturum için yörünge paketi dışa aktarın:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Bu, sahip exec isteğini onayladıktan sonra `/export-trajectory` slash komutu tarafından kullanılan komut yoludur. Çıktı dizini her zaman seçili çalışma alanı altında `.openclaw/trajectory-exports/` içinde çözümlenir.

`openclaw sessions --all-agents`, yapılandırılmış aracı depolarını okur. Gateway ve ACP oturum keşfi daha geniştir: varsayılan `agents/` kökü veya şablonlanmış bir `session.store` kökü altında bulunan yalnızca diskteki depoları da içerir. Keşfedilen bu depolar, aracı kökü içinde normal `sessions.json` dosyalarına çözümlenmelidir; sembolik bağlantılar ve kök dışı yollar atlanır.

JSON örnekleri:

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
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Temizlik bakımı

Sonraki yazma döngüsünü beklemek yerine bakımı şimdi çalıştırın:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup`, yapılandırmadaki `session.maintenance` ayarlarını kullanır:

- Kapsam notu: `openclaw sessions cleanup` oturum depolarını, transcriptleri ve yörünge sidecar dosyalarını sürdürür. Cron çalıştırma geçmişini budamaz; bu geçmiş [Cron yapılandırması](/tr/automation/cron-jobs#configuration) içindeki `cron.runLog.keepLines` tarafından yönetilir ve [Cron bakımı](/tr/automation/cron-jobs#maintenance) içinde açıklanır.
- Temizlik ayrıca `session.maintenance.pruneAfter` değerinden daha eski olan başvurulmamış birincil transcriptleri, Compaction kontrol noktalarını ve yörünge sidecar dosyalarını budar; `sessions.json` tarafından hâlâ başvurulan dosyalar korunur.
- Temizlik, kısa ömürlü gateway model-run yoklama temizliğini ayrı olarak `modelRunPruned` şeklinde bildirir. Bu yalnızca `agent:*:explicit:model-run-<uuid>` biçimindeki katı açık anahtarlarla eşleşir. Sabit saklama süresi `24h` değeridir, ancak baskı kapılıdır: eski yoklama satırlarını yalnızca oturum girdisi bakım/kapasite baskısına ulaşıldığında kaldırır. Çalıştığında model-run temizliği, genel eski temizleme ve sınırlamadan önce gerçekleşir.

- `--dry-run`: yazmadan kaç girdinin budanacağını/sınırlanacağını önizleyin.
  - Metin modunda dry-run, oturum başına eylem tablosu (`Action`, `Key`, `Age`, `Model`, `Flags`) ve oturum etiketine göre gruplanmış bir özet yazdırır; böylece nelerin tutulacağını ve nelerin kaldırılacağını görebilirsiniz.
- `--enforce`: `session.maintenance.mode` `warn` olsa bile bakımı uygula.
- `--fix-missing`: transcript dosyaları eksik veya yalnızca başlık/boş olan girdileri, normalde henüz yaş/sayı nedeniyle elenmeyecek olsalar bile kaldır.
- `--fix-dm-scope`: `session.dmScope` `main` olduğunda, daha önceki `per-peer`, `per-channel-peer` veya `per-account-channel-peer` yönlendirmesinden kalan eski eş anahtarlı doğrudan DM satırlarını emekliye ayır. Önce `--dry-run` kullanın; temizliği uygulamak bu satırları `sessions.json` içinden kaldırır ve transcriptlerini silinmiş arşivler olarak korur.
- `--active-key <key>`: belirli bir etkin anahtarı disk bütçesi tahliyesinden koru. Grup oturumları ve iş parçacığı kapsamlı sohbet oturumları gibi dayanıklı harici konuşma işaretçileri de yaş/sayı/disk bütçesi bakımı tarafından tutulur.
- `--agent <id>`: tek bir yapılandırılmış aracı deposu için temizliği çalıştır.
- `--all-agents`: tüm yapılandırılmış aracı depoları için temizliği çalıştır.
- `--store <path>`: belirli bir `sessions.json` dosyasına karşı çalıştır.
- `--json`: JSON özeti yazdır. `--all-agents` ile çıktı, depo başına bir özet içerir.

Bir Gateway erişilebilir olduğunda, yapılandırılmış aracı depoları için dry-run olmayan temizlik Gateway üzerinden gönderilir; böylece çalışma zamanı trafiğiyle aynı oturum deposu yazıcısını paylaşır. Bir depo dosyasının açık çevrimdışı onarımı için `--store <path>` kullanın.

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

## Bir oturumu sıkıştırma

Takılmış veya aşırı büyük bir oturum için bağlam bütçesini geri kazanın. `openclaw sessions compact <key>`, `sessions.compact` gateway RPC çevresindeki birinci sınıf sarmalayıcıdır ve çalışan bir gateway gerektirir.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- `--max-lines` olmadan gateway, transcripti LLM ile özetler. CLI varsayılan olarak istemci son tarihi dayatmaz; yapılandırılmış Compaction yaşam döngüsünün sahibi gateway'dir.
- `--max-lines <n>` ile son `n` transcript satırına kırpar ve önceki transcripti `.bak` sidecar dosyası olarak arşivler.
- `--agent <id>`: oturumun sahibi olan aracı; `global` anahtarları için gereklidir.
- `--url` / `--token` / `--password`: gateway bağlantı geçersiz kılmaları.
- `--timeout <ms>`: milisaniye cinsinden isteğe bağlı istemci tarafı RPC zaman aşımı.
- `--json`: ham RPC yükünü yazdır.

Gateway başarısız bir Compaction bildirdiğinde veya erişilemez olduğunda komut sıfır olmayan kodla çıkar; böylece cronlar ve betikler sessiz bir işlem yapılmamasını başarı sanmaz.

> Not: `openclaw agent --message '/compact ...'` bir Compaction yolu **değildir**. CLI'dan gelen slash komutları yetkili gönderici denetimi tarafından reddedilir; bu çağrı sessizce hiçbir şey yapmamak yerine burayı işaret eden yönlendirmeyle sıfır olmayan kodla çıkar.

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` şunları kabul eder:

| Alan       | Tür         | Gerekli | Açıklama                                                  |
| ---------- | ----------- | ------- | --------------------------------------------------------- |
| `key`      | dize        | evet    | Sıkıştırılacak oturum anahtarı (örneğin `agent:main:main`). |
| `agentId`  | dize        | hayır   | Oturumun sahibi olan aracı kimliği (`global` anahtarları için). |
| `maxLines` | tamsayı ≥ 1 | hayır   | LLM özetlemesi yerine son N satıra kırp.                 |

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

- Oturum yapılandırması: [Yapılandırma referansı](/tr/gateway/config-agents#session)
- [CLI referansı](/tr/cli)
- [Oturum yönetimi](/tr/concepts/session)
