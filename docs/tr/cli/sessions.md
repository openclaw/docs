---
read_when:
    - Saklanan oturumları listelemek ve son etkinliği görmek istiyorsunuz
summary: '`openclaw sessions` için CLI referansı (saklanan oturumları listeleme + kullanım)'
title: Oturumlar
x-i18n:
    generated_at: "2026-05-07T13:14:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdfdc9223f11da87b514f96e0a9505286e36d98647b3ff3a79b90588e4e69c1b
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Saklanan konuşma oturumlarını listeleyin.

Oturum listeleri kanal/sağlayıcı canlılık denetimleri değildir. Oturum depolarında kalıcı hale getirilmiş konuşma satırlarını gösterirler. Sessiz bir Discord, Slack, Telegram veya başka bir kanal, bir ileti işlenene kadar yeni bir oturum satırı oluşturmadan başarıyla yeniden bağlanabilir. Canlı kanal bağlantısına ihtiyaç duyduğunuzda `openclaw channels status --probe`, `openclaw status --deep` veya `openclaw health --verbose` kullanın.

`openclaw sessions` ve Gateway `sessions.list` yanıtları varsayılan olarak sınırlıdır; böylece büyük ve uzun ömürlü depolar CLI sürecini veya Gateway olay döngüsünü tek başına meşgul edemez. CLI varsayılan olarak en yeni 100 oturumu döndürür; daha küçük/daha büyük bir pencere için `--limit <n>` ya da kasıtlı olarak tam depoya ihtiyaç duyduğunuzda `--limit all` geçirin. JSON yanıtları, çağıranların daha fazla satır olduğunu göstermesi gerektiğinde `totalCount`, `limitApplied` ve `hasMore` içerir.

RPC istemcileri, geniş birleşik keşif kaynağını koruyup yalnızca şu anda yapılandırmada bulunan aracıların satırlarını döndürmek için `configuredAgentsOnly: true` geçirebilir. Control UI bu modu varsayılan olarak kullanır; böylece silinmiş veya yalnızca diskte bulunan aracı depoları Sessions görünümünde yeniden belirmez.

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
- `--store <path>`: açık depo yolu (`--agent` veya `--all-agents` ile birlikte kullanılamaz)
- `--limit <n|all>`: çıktılanacak en fazla satır sayısı (varsayılan `100`; `all` tam çıktıyı geri getirir)

Saklanan bir oturum için bir yörünge paketi dışa aktarın:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Bu, sahip yürütme isteğini onayladıktan sonra `/export-trajectory` eğik çizgi komutu tarafından kullanılan komut yoludur. Çıktı dizini her zaman seçili çalışma alanının altında `.openclaw/trajectory-exports/` içinde çözümlenir.

`openclaw sessions --all-agents` yapılandırılmış aracı depolarını okur. Gateway ve ACP oturum keşfi daha geniştir: varsayılan `agents/` kökü veya şablonlu bir `session.store` kökü altında bulunan yalnızca diskteki depoları da içerir. Keşfedilen bu depolar, aracı kökü içinde normal `sessions.json` dosyalarına çözümlenmelidir; sembolik bağlantılar ve kök dışı yollar atlanır.

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

Bakımı şimdi çalıştırın (sonraki yazma döngüsünü beklemek yerine):

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

- Kapsam notu: `openclaw sessions cleanup` oturum depolarını, transkriptleri ve yörünge yan dosyalarını bakımda tutar. `cron.runLog.maxBytes` ve `cron.runLog.keepLines` tarafından [Cron yapılandırması](/tr/automation/cron-jobs#configuration) içinde yönetilen ve [Cron bakımı](/tr/automation/cron-jobs#maintenance) içinde açıklanan cron çalıştırma günlüklerini (`cron/runs/<jobId>.jsonl`) budamaz.
- Temizlik ayrıca `session.maintenance.pruneAfter` değerinden daha eski, başvurulmayan birincil transkriptleri, Compaction kontrol noktalarını ve yörünge yan dosyalarını budar; `sessions.json` tarafından hâlâ başvurulan dosyalar korunur.

- `--dry-run`: yazmadan kaç girdinin budanacağını/sınırlanacağını önizle.
  - Metin modunda dry-run, neyin tutulacağını ve neyin kaldırılacağını görebilmeniz için oturum başına bir eylem tablosu (`Action`, `Key`, `Age`, `Model`, `Flags`) yazdırır.
- `--enforce`: `session.maintenance.mode` `warn` olsa bile bakımı uygula.
- `--fix-missing`: transkript dosyaları eksik olan girdileri, normalde henüz yaş/sayı sınırına takılmayacak olsalar bile kaldır.
- `--fix-dm-scope`: `session.dmScope` `main` olduğunda, önceki `per-peer`, `per-channel-peer` veya `per-account-channel-peer` yönlendirmesinden kalan eski eş anahtarlı doğrudan DM satırlarını emekliye ayır. Önce `--dry-run` kullanın; temizliği uygulamak bu satırları `sessions.json` dosyasından kaldırır ve transkriptlerini silinmiş arşivler olarak korur.
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

İlgili:

- Oturum yapılandırması: [Yapılandırma başvurusu](/tr/gateway/config-agents#session)

## İlgili

- [CLI başvurusu](/tr/cli)
- [Oturum yönetimi](/tr/concepts/session)
