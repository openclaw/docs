---
read_when:
    - Saklanan oturumları listelemek ve son etkinliği görmek istiyorsunuz
summary: '`openclaw sessions` için CLI referansı (depolanan oturumları listeleme + kullanım)'
title: Oturumlar
x-i18n:
    generated_at: "2026-06-28T00:24:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b9454e4b6ef925f8f90b5e8beceb6bea6404539f460cb78bcf82e241dff168d
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Saklanan konuşma oturumlarını listeleyin.

Oturum listeleri kanal/sağlayıcı canlılık denetimleri değildir. Oturum depolarından kalıcı hale getirilmiş konuşma satırlarını gösterirler. Sessiz bir Discord, Slack, Telegram veya başka bir kanal, bir mesaj işlenene kadar yeni bir oturum satırı oluşturmadan başarıyla yeniden bağlanabilir. Canlı kanal bağlantısına ihtiyacınız olduğunda `openclaw channels status --probe`, `openclaw status --deep` veya `openclaw health --verbose` kullanın.

`openclaw sessions` ve Gateway `sessions.list` yanıtları varsayılan olarak sınırlandırılır; böylece büyük ve uzun ömürlü depolar CLI sürecini veya Gateway olay döngüsünü tekelleştiremez. CLI varsayılan olarak en yeni 100 oturumu döndürür; daha küçük/daha büyük bir pencere için `--limit <n>` iletin veya tam depoya bilinçli olarak ihtiyaç duyduğunuzda `--limit all` kullanın. JSON yanıtları, çağıranların daha fazla satır bulunduğunu göstermesi gerektiğinde `totalCount`, `limitApplied` ve `hasMore` içerir.

RPC istemcileri, geniş birleşik keşif kaynağını koruyup yalnızca yapılandırmada şu anda bulunan aracılara ait satırları döndürmek için `configuredAgentsOnly: true` iletebilir. Control UI bu modu varsayılan olarak kullanır; böylece silinmiş veya yalnızca diskte bulunan aracı depoları Sessions görünümünde yeniden görünmez.

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

Saklanan oturumlar için insan tarafından okunabilir ilerleme seyrini takip edin:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail`, son trajectory JSONL olaylarını kompakt ilerleme satırları olarak işler. `--session-key` olmadan önce çalışan oturumları, ardından en son saklanan oturumu takip eder. `--tail <count>`, takip modundan önce kaç mevcut olayın yazdırılacağını denetler; varsayılan `80` değeridir ve `0` geçerli sondan başlar. `--follow`, `<session>.trajectory-path.json` tarafından başvurulan taşınmış dosyalar dahil seçilen trajectory dosyalarını izlemeye devam eder.

İlerleme görünümü bilerek muhafazakardır: istem metni, araç argümanları ve araç sonucu gövdeleri yazdırılmaz. Araç çağrıları araç adını `{...redacted...}` ile gösterir; araç sonuçları `ok`, `error` veya `done` gibi durumları gösterir; model tamamlama satırları sağlayıcı/model ve terminal durumunu gösterir.

Saklanan bir oturum için trajectory paketi dışa aktarın:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Bu, sahip exec isteğini onayladıktan sonra `/export-trajectory` slash komutu tarafından kullanılan komut yoludur. Çıktı dizini her zaman seçilen çalışma alanının altında `.openclaw/trajectory-exports/` içinde çözümlenir.

`openclaw sessions --all-agents` yapılandırılmış aracı depolarını okur. Gateway ve ACP oturum keşfi daha geniştir: varsayılan `agents/` kökü veya şablonlanmış bir `session.store` kökü altında bulunan yalnızca disk depolarını da içerir. Keşfedilen bu depolar, aracı kökü içinde normal `sessions.json` dosyalarına çözümlenmelidir; sembolik bağlantılar ve kök dışı yollar atlanır.

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

## Temizleme bakımı

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

`openclaw sessions cleanup`, yapılandırmadan `session.maintenance` ayarlarını kullanır:

- Kapsam notu: `openclaw sessions cleanup` oturum depolarını, transkriptleri ve trajectory sidecar dosyalarını yönetir. [Cron yapılandırması](/tr/automation/cron-jobs#configuration) içinde `cron.runLog.keepLines` tarafından yönetilen ve [Cron bakımı](/tr/automation/cron-jobs#maintenance) içinde açıklanan cron çalıştırma geçmişini budamaz.
- Temizleme, `session.maintenance.pruneAfter` değerinden daha eski başvurulmayan birincil transkriptleri, Compaction denetim noktalarını ve trajectory sidecar dosyalarını da budar; `sessions.json` tarafından hâlâ başvurulan dosyalar korunur.
- Temizleme, kısa ömürlü gateway model-run probe temizliğini ayrıca `modelRunPruned` olarak bildirir. Bu yalnızca `agent:*:explicit:model-run-<uuid>` biçimindeki katı açık anahtarlarla eşleşir. Sabit saklama süresi `24h` değeridir, ancak basınç kapılıdır: eski probe satırlarını yalnızca oturum girdisi bakımı/kapasite baskısına ulaşıldığında kaldırır. Çalıştığında, model-run temizliği genel eski temizlemeden ve sınırlamadan önce gerçekleşir.

- `--dry-run`: yazmadan kaç girdinin budanacağını/sınırlandırılacağını önizleyin.
  - Metin modunda dry-run, oturum etiketine göre gruplanmış bir özetle birlikte oturum başına eylem tablosu (`Action`, `Key`, `Age`, `Model`, `Flags`) yazdırır; böylece neyin tutulacağını ve neyin kaldırılacağını görebilirsiniz.
- `--enforce`: `session.maintenance.mode` `warn` olduğunda bile bakımı uygula.
- `--fix-missing`: transkript dosyaları eksik veya yalnızca başlık/boş olan girdileri, normalde henüz yaş/sayı sınırına takılmasalar bile kaldır.
- `--fix-dm-scope`: `session.dmScope` `main` olduğunda, önceki `per-peer`, `per-channel-peer` veya `per-account-channel-peer` yönlendirmesinden kalan eski eş anahtarlı doğrudan DM satırlarını kullanımdan kaldır. Önce `--dry-run` kullanın; temizlemeyi uygulamak bu satırları `sessions.json` dosyasından kaldırır ve transkriptlerini silinmiş arşivler olarak korur.
- `--active-key <key>`: belirli bir etkin anahtarı disk bütçesi tahliyesinden koru. Grup oturumları ve iş parçacığı kapsamlı sohbet oturumları gibi kalıcı harici konuşma işaretçileri de yaş/sayı/disk bütçesi bakımı tarafından tutulur.
- `--agent <id>`: tek bir yapılandırılmış aracı deposu için temizleme çalıştır.
- `--all-agents`: tüm yapılandırılmış aracı depoları için temizleme çalıştır.
- `--store <path>`: belirli bir `sessions.json` dosyasına karşı çalıştır.
- `--json`: JSON özeti yazdır. `--all-agents` ile çıktı, depo başına bir özet içerir.

Bir Gateway erişilebilir olduğunda, yapılandırılmış aracı depoları için dry-run olmayan temizleme Gateway üzerinden gönderilir; böylece çalışma zamanı trafiğiyle aynı oturum deposu yazıcısını paylaşır. Bir depo dosyasının açık çevrimdışı onarımı için `--store <path>` kullanın.

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

Takılmış veya aşırı büyük bir oturum için bağlam bütçesini geri kazanın. `openclaw sessions compact <key>`, `sessions.compact` gateway RPC etrafındaki birinci sınıf sarmalayıcıdır ve çalışan bir gateway gerektirir.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- `--max-lines` olmadan gateway transkripti LLM ile özetler. Bu yavaş olabilir, bu yüzden varsayılan `--timeout` `180000` ms değeridir.
- `--max-lines <n>` ile son `n` transkript satırına kısaltır ve önceki transkripti `.bak` sidecar olarak arşivler.
- `--agent <id>`: oturumun sahibi olan aracı; `global` anahtarları için gereklidir.
- `--url` / `--token` / `--password`: gateway bağlantısı geçersiz kılmaları.
- `--timeout <ms>`: milisaniye cinsinden RPC zaman aşımı.
- `--json`: ham RPC yükünü yazdır.

Gateway başarısız bir Compaction bildirdiğinde veya erişilemez olduğunda komut sıfır olmayan kodla çıkar; böylece cron’lar ve betikler sessiz bir no-op’u asla başarı sanmaz.

> Not: `openclaw agent --message '/compact ...'` bir Compaction yolu **değildir**. CLI'dan gelen slash komutları yetkili gönderici denetimi tarafından reddedilir; bu çağrı, sessizce no-op yapmak yerine burayı işaret eden rehberlikle sıfır olmayan kodla çıkar.

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` şunları kabul eder:

| Alan       | Tür         | Gerekli | Açıklama                                                   |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | string      | evet     | Sıkıştırılacak oturum anahtarı (örneğin `agent:main:main`). |
| `agentId`  | string      | hayır    | Oturumun sahibi olan aracı kimliği (`global` anahtarları için). |
| `maxLines` | integer ≥ 1 | hayır    | LLM özetlemesi yerine son N satıra kısalt.                 |

Örnek LLM özetleme yanıtı:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Örnek kısaltma yanıtı (`--max-lines 200`):

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

- Oturum yapılandırması: [Yapılandırma başvurusu](/tr/gateway/config-agents#session)
- [CLI başvurusu](/tr/cli)
- [Oturum yönetimi](/tr/concepts/session)
